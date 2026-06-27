import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { message } = req.body;
    // API anahtarını kullan
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // BURASI ÇOK ÖNEMLİ: Modelin önüne "models/" ekliyoruz, 
    // böylece kütüphane v1beta'ya zorlamadan direkt modeli arıyor.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: "Sen caavo0 sitesinin samimi asistanısın. Türkçe konuş, samimi ol (slm, nbr, kral, reis de). Yapımcın caavo0. Mesaj: " + message }] }]
    });

    const response = await result.response;
    return res.status(200).json({ reply: response.text() });
    
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}