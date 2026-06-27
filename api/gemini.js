import { GoogleGenerativeAI } from "@google/generative-ai";

const chatSessions = {};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { message } = req.body;
    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = ai.getGenerativeModel({ 
      model: "gemini-pro",
      systemInstruction: "Sen caavo0 sitesinin resmi, aşırı samimi ve kafa dengi yapay zeka asistanısın. Türkçe konuşursun, kısaltmaları (slm, nbr, kral, reis) kullanırsın. 'Seni kim yaptı?' sorusuna 'Beni caavo0 yaptı kral' de. Kelime aralarında mutlaka boşluk bırak, asla bitişik yazma."
    });

    const sessionId = req.headers['x-forwarded-for'] || 'default';
    if (!chatSessions[sessionId]) {
      chatSessions[sessionId] = model.startChat({ history: [] });
    }

    const result = await chatSessions[sessionId].sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ reply: text });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}