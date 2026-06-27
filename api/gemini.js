import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { message } = req.body;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Model ismini sadece 'gemini-1.5-flash' yapıyoruz. 
    // -latest eklemiyoruz çünkü o versiyon takıntısı yapıyor.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(
      "Sen caavo0'un yapay zeka asistanısın. Türkçe konuş, samimi ol (slm, nbr, kral de). Kelimeleri asla bitişik yazma, aralarına boşluk koy. Yapımcın caavo0. Mesaj: " + message
    );

    const response = await result.response;
    const text = response.text();
    return res.status(200).json({ reply: text });
  } catch (error) {
    console.error("HATA:", error);
    // Hatanın içinde 'v1beta' geçiyorsa, bu anahtarın v1beta dışında bir yere erişimi olmadığını gösterir.
    return res.status(500).json({ error: "Model hatası: " + error.message });
  }
}