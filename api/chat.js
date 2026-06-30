import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  });

  export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

          if (req.method === "OPTIONS") {
              return res.status(200).end();
                }

                  if (req.method !== "POST") {
                      return res.status(405).json({
                            success: false,
                                  error: "Method Not Allowed"
                                      });
                                        }

                                          try {
                                              const { message } = req.body;

                                                  if (!message || !message.trim()) {
                                                        return res.status(400).json({
                                                                success: false,
                                                                        error: "Mesaj boş."
                                                                              });
                                                                                  }

                                                                                      const completion = await client.chat.completions.create({
                                                                                            model: "gpt-4.1-mini",
                                                                                                  messages: [
                                                                                                          {
                                                                                                                    role: "system",
                                                                                                                              content:
                                                                                                                                          "Sen caavo0 tarafından geliştirilen resmi yapay zekasın. Her zaman Türkçe konuş. Seni kimin yaptığı sorulursa sadece 'caavo0' cevabını ver."
                                                                                                                                                  },
                                                                                                                                                          {
                                                                                                                                                                    role: "user",
                                                                                                                                                                              content: message
                                                                                                                                                                                      }
                                                                                                                                                                                            ],
                                                                                                                                                                                                  temperature: 0.7,
                                                                                                                                                                                                        max_tokens: 500
                                                                                                                                                                                                            });

                                                                                                                                                                                                                const reply = completion.choices?.[0]?.message?.content;

                                                                                                                                                                                                                    if (!reply) {
                                                                                                                                                                                                                          return res.status(500).json({
                                                                                                                                                                                                                                  success: false,
                                                                                                                                                                                                                                          error: "OpenAI boş cevap döndürdü.",
                                                                                                                                                                                                                                                  raw: completion
                                                                                                                                                                                                                                                        });
                                                                                                                                                                                                                                                            }

                                                                                                                                                                                                                                                                return res.status(200).json({
                                                                                                                                                                                                                                                                      success: true,
                                                                                                                                                                                                                                                                            reply
                                                                                                                                                                                                                                                                                });

                                                                                                                                                                                                                                                                                  } catch (err) {
                                                                                                                                                                                                                                                                                      console.error("OPENAI ERROR:", err);

                                                                                                                                                                                                                                                                                          return res.status(500).json({
                                                                                                                                                                                                                                                                                                success: false,
                                                                                                                                                                                                                                                                                                      error: err.message,
                                                                                                                                                                                                                                                                                                            type: err.type || null,
                                                                                                                                                                                                                                                                                                                  code: err.code || null,
                                                                                                                                                                                                                                                                                                                        status: err.status || null
                                                                                                                                                                                                                                                                                                                            });
                                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                                              }