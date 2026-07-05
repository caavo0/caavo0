import OpenAI from "openai";

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

let conversationHistory = [];

// Modelin çağırabileceği web arama aracının tanımı
const tools = [
    {
        type: "function",
        function: {
            name: "web_search",
            description:
                "Güncel bilgiye ihtiyaç duyulduğunda (haberler, hava durumu, fiyatlar, son dakika olaylar, tarihler, güncel veriler vb.) Google üzerinden internette arama yapar ve sonuçları metin olarak döner.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "Google'da aranacak arama sorgusu"
                    }
                },
                required: ["query"]
            }
        }
    }
];

// Tavily Search API çağrısı
async function webSearchTavily(query) {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
        return "Web arama servisi yapılandırılmamış (TAVILY_API_KEY eksik).";
    }

    try {
        const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: apiKey,
                query: query,
                search_depth: "basic",
                max_results: 5
            })
        });
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            return "Arama sonucu bulunamadı.";
        }

        return data.results
            .map((item, i) => `${i + 1}. ${item.title}\n${item.content}\nKaynak: ${item.url}`)
            .join("\n\n");
    } catch (err) {
        console.error("Tavily Search Error:", err);
        return "Web araması sırasında bir hata oluştu.";
    }
}

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { message, image, webSearch } = req.body;

        if (!message && !image) {
            return res.status(400).json({ error: "Mesaj veya resim gerekli." });
        }

        if (image) {
            conversationHistory.push({
                role: "user",
                content: [
                    {
                        type: "text",
                        text: message || "Bu resmi analiz et."
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: image
                        }
                    }
                ]
            });
        } else {
            conversationHistory.push({
                role: "user",
                content: message
            });
        }

        const systemPrompt = `Sen saygılı, eğlenceli ve samimi bir yapay zekasın.
Selamlaşmalara dikkat et: "sa, as, slm, slm aleyküm, merhaba, mrb" gibi selamlaşmaları bil.
Kullanıcı "Seni kim yaptı?" veya "Kim geliştirdi?" diye sorarsa "Beni caavo0 geliştirdi kardeşim" diye cevap ver ama sadece sorulduğunda.
Her konu değiştirdiğinde paragraf başı yap. Sen sadece Türkçe konuşan bir yapay zekasın.
Kullanıcı hangi dilde yazarsa yazsın, özellikle başka bir dil istemediği sürece her zaman Türkçe cevap ver.
İngilizce veya başka bir dil kullanma.
Her zaman Türkçe konuş ama kullanıcı başka bir dil isterse o dilde konuş.
Eğer biri "Ben hangi sitedeyim?" diye sorarsa "CaavoX uygulamasının içindesin." de.${
            webSearch
                ? "\nKullanıcı bu mesaj için web araması istiyor: Güncel bilgi gerektiren bu soruyu cevaplamadan önce mutlaka web_search aracını kullanarak internetten güncel bilgi al, sonra bu sonuçlara dayanarak cevap ver. Kaynak linklerini cevabının sonunda kısaca belirt."
                : ""
        }`;

        const messages = [
            { role: "system", content: systemPrompt },
            ...conversationHistory
        ];

        let completion = await groq.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages,
            temperature: 0.75,
            max_tokens: 800,
            tools: webSearch ? tools : undefined,
            tool_choice: webSearch ? "auto" : undefined
        });

        let responseMessage = completion.choices[0]?.message;

        // Model web_search aracını çağırmak istediyse
        if (responseMessage?.tool_calls?.length > 0) {
            messages.push(responseMessage);

            for (const toolCall of responseMessage.tool_calls) {
                if (toolCall.function.name === "web_search") {
                    const args = JSON.parse(toolCall.function.arguments || "{}");
                    const searchResult = await webSearchTavily(args.query || message);

                    messages.push({
                        role: "tool",
                        tool_call_id: toolCall.id,
                        content: searchResult
                    });
                }
            }

            // Arama sonuçlarını gördükten sonra modele son cevabı ürettiriyoruz
            completion = await groq.chat.completions.create({
                model: "meta-llama/llama-4-scout-17b-16e-instruct",
                messages,
                temperature: 0.75,
                max_tokens: 800
            });

            responseMessage = completion.choices[0]?.message;
        }

        const reply = responseMessage?.content || "Üzgünüm, anlayamadım kardeşim.";

        conversationHistory.push({
            role: "assistant",
            content: reply
        });

        // Son 200 mesajı hafızada tut
        if (conversationHistory.length > 200) {
            conversationHistory = conversationHistory.slice(-200);
        }

        res.status(200).json({ reply });

    } catch (e) {
        console.error("Groq Error:", e);
        res.status(500).json({
            error: e.message || "Bir hata oluştu."
        });
    }
}
