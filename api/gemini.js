import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { message } = req.body;
    
    // API anahtarı
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // v1beta hatasını kırmak için base URL'yi v1 olarak zorluyoruz
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        // İşte sihirli çözüm: API sürümünü v1'e zorluyoruz
    }, { apiVersion: 'v1' }); 

    const result = await model.generateContent(message);
    const response = await result.response;
    
    return res.status(200).json({ reply: response.text() });
  } catch (error) {
    return res.status(500).json({ error: "Hata: " + error.message });
  }
}