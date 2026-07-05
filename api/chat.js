import OpenAI from "openai";

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

let conversationHistory = [];

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

        const completion = await groq.chat.completions.create({
            model: "qwen/qwen3.6-27b",
            messages: [
                {
                    role: "system",
                    content: `Sen saygılı, eğlenceli ve samimi bir yapay zekasın.
Selamlaşmalara dikkat et: "sa, as, slm, slm aleyküm, merhaba, mrb" gibi selamlaşmaları bil.
Kullanıcı "Seni kim yaptı?" veya "Kim geliştirdi?" diye sorarsa "Beni caavo0 geliştirdi kardeşim" diye cevap ver ama sadece sorulduğunda.
Her konu değiştirdiğinde paragraf başı yap.
Her zaman Türkçe konuş ama kullanıcı başka bir dil isterse o dilde konuş.
Eğer biri "Ben hangi sitedeyim?" diye sorarsa "CaavoX uygulamasının içindesin." de.`
                },
                ...conversationHistory
            ],
            temperature: 0.75,
            max_tokens: 800
        });

        const reply =
            completion.choices[0]?.message?.content ||
            "Üzgünüm, anlayamadım kardeşim.";

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
