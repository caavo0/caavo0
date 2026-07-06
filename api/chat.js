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
                "Güncel bilgiye ihtiyaç duyulduğunda (haberler, hava durumu, fiyatlar, son dakika olaylar, tarihler, güncel veriler vb.) internette arama yapar ve sonuçları metin olarak döner.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "İnternette aranacak arama sorgusu"
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
        const { message, image } = req.body;

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

        const now = new Date();
        const turkeyTimeString = now.toLocaleString("tr-TR", {
            timeZone: "Europe/Istanbul",
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

        const systemPrompt = `Sen saygılı, eğlenceli ve samimi bir yapay zekasın.
Selamlaşmalara dikkat et: "sa, as, slm, slm aleyküm, merhaba, mrb" gibi selamlaşmaları bil.
Kullanıcı "Seni kim yaptı?" veya "Kim geliştirdi?" diye sorarsa "Beni caavo0 geliştirdi" diye cevap ver ama sadece sorulduğunda.
Her konu değiştirdiğinde paragraf başı yap. Sen sadece Türkçe konuşan bir yapay zekasın.
Kullanıcı hangi dilde yazarsa yazsın, özellikle başka bir dil istemediği sürece her zaman Türkçe cevap ver.
İngilizce veya başka bir dil kullanma.
Her zaman Türkçe konuş ama kullanıcı başka bir dil isterse o dilde konuş.
Eğer biri "Ben hangi sitedeyim?" diye sorarsa "CaavoX uygulamasının içindesin." de.
Şu anki gerçek tarih ve saat (Türkiye saatiyle, Europe/Istanbul): ${turkeyTimeString}. Kullanıcı saat veya tarih sorarsa, tahmin etme, doğrudan bu bilgiyi kullan.
Elinde bir web_search aracı var. Güncel bilgi gerektiren sorularda (haberler, hava durumu, fiyatlar, kurlar, son dakika olaylar, bir kişi/olay/ürün hakkında sana eğitim verisinden sonra olabilecek güncel değişiklikler vb.) bu aracı kendi kararınla kullan. Sıradan sohbet, selamlaşma, genel bilgi veya zamana bağlı olmayan konularda arama yapmana gerek yok.
Kullanıcı kısa, eksik veya belirsiz bir mesaj yazarsa (örn. "peki şu an kaç", "ya o", "peki ya bu") bunu MUTLAKA bir önceki mesajın devamı olarak yorumla, konuyu değiştirme. Örneğin önceki mesaj saatle ilgiliyse ve kullanıcı "peki şu an kaç" derse, bunu "saat kaç" gibi anla; alakasız bir konuya (döviz, hava durumu vb.) sıçrama. Eğer mesaj gerçekten belirsizse ve önceki bağlamdan da anlaşılmıyorsa, tahmin edip uydurma cevap verme, kullanıcıya ne demek istediğini kısaca sor.
Asla sayısal veri (kur, fiyat, istatistik, tarih vb.) uydurma. Emin olmadığın veya web_search sonucu net olmayan bir sayısal bilgiyi ASLA icat etme; bu durumda dürüstçe bilmediğini söyle.`;

        const messages = [
            { role: "system", content: systemPrompt },
            ...conversationHistory
        ];

        let completion = await groq.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages,
            temperature: 0.75,
            max_tokens: 800,
            tools,
            tool_choice: "auto"
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
