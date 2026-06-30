import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,           // Groq key
        baseURL: "https://api.groq.com/openai/v1"   // ← Bu çok önemli
        });

        export default async function handler(req, res) {
            res.setHeader("Access-Control-Allow-Origin", "*");
                res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
                    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

                        if (req.method === "OPTIONS") return res.status(200).end();
                            if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

                                try {
                                        const { message } = req.body;

                                                const completion = await openai.chat.completions.create({
                                                            model: "llama-3.3-70b-versatile",   // veya "llama-3.1-8b-instant" (daha hızlı)
                                                                        messages: [
                                                                                        { 
                                                                                                            role: "system", 
                                                                                                                                content: "Sen yardımcı, eğlenceli ve her zaman Türkçe konuşan bir AI asistanısın. Adın Caavo0." 
                                                                                                                                                },
                                                                                                                                                                { role: "user", content: message }
                                                                                                                                                                            ],
                                                                                                                                                                                        temperature: 0.7,
                                                                                                                                                                                                    max_tokens: 800
                                                                                                                                                                                                            });

                                                                                                                                                                                                                    const reply = completion.choices[0].message.content;

                                                                                                                                                                                                                            res.status(200).json({ reply });

                                                                                                                                                                                                                                } catch (e) {
                                                                                                                                                                                                                                        console.error(e);
                                                                                                                                                                                                                                                res.status(500).json({ error: e.message });
                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                    }caavo__import