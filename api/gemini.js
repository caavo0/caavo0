import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // CORS ayarları
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { message } = req.body;
    
    // API anahtarını doğrudan kullan
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // En kararlı çalışan "gemini-1.5-flash" modelini çağır
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Chat oturumu yerine, doğrudan "sendMessage" yapısını kullanıyoruz
    // Bu yöntem, "404 Not Found" hatalarını minimize eder
    const result = await model.generateContent(
      "Sen caavo0'un yapay zeka asistanısın. Türkçe konuş, samimi ol (slm, nbr, kral de). Kelimeleri asla bitişik yazma, aralarına boşluk koy. Yapımcın caavo0. Mesaj: " + message
    );

    const text = result.response.text();

    return res.status(200).json({ reply: text });
  } catch (error) {
    // Hatayı logla ki ne olduğu belli olsun
    console.error("HATA DETAYI:", error);
    return res.status(500).json({ error: error.toString() });
  }
}