import OpenAI from "openai";

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    try {
        const { message } = req.body;

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { 
                    role: "system", 
                    content: "Seni Caavo0 kodladi, eğlenceli ve her zaman Türkçe cevap veren bir yapay zekasın.Biri seni kim gelistirdi derse caavo0 diceksin seni kim yapti derse caavo0 diceksin.Zararli yazilim kodlamayacaksin ve dinin islam olacak." 
                },
                { role: "user", content: message }
            ],
            temperature: 0.7,
            max_tokens: 800
        });

        res.status(200).json({ 
            reply: completion.choices[0]?.message?.content || "Üzgünüm, cevap alamadım." 
        });

    } catch (e) {
        console.error("Groq Hatası:", e);
        res.status(500).json({ error: "Bir hata oluştu, lütfen tekrar dene." });
    }
}
