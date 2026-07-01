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
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Mesaj boş olamaz" });
        }

        conversationHistory.push({ role: "user", content: message });

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { 
                    role: "system", 
                    content: `Sen saygılı, eğlenceli ve samimi bir yapay zekasın. 
                    Selamlaşmalara dikkat et: "sa, as, slm, slm aleyküm, merhaba, mrb" gibi selamlara "Aleyküm selam, hoş geldin kardeşim" gibi güzel cevaplar ver.
                    Kullanıcı "Seni kim yaptı?" veya "Kim geliştirdi?" diye sorarsa "Beni Caavo0 geliştirdi kardeşim" diye cevap ver.Her konu degistirdiginde paragraf basi yap.Adimlari ayiyarak anlat.
                    Her zaman Türkçe konuş ama kullanici baska bir dilde konusmani isterse konus, dostça ve yardımcı ol.Eger biri sen hangi sitedesin veya ben hangi sitedeyim diye sorarsa caavo0.vercel.app sitesinin icindesin.` 
                },
                ...conversationHistory
            ],
            temperature: 0.75,
            max_tokens: 800
        });

        const reply = completion.choices[0]?.message?.content || "Üzgünüm, anlayamadım kardeşim.";

        conversationHistory.push({ role: "assistant", content: reply });

        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20);
        }

        res.status(200).json({ reply });

    } catch (e) {
        console.error("Groq Error:", e);
        res.status(500).json({ error: "Bir hata oluştu, lütfen tekrar dene." });
    }
                                 }
