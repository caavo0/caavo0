import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  // CORS Ayarları
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sadece POST istekleri atılabilir.' });
  }

  try {
    // Frontend'den gelen veriyi al (message veya prompt her ihtimale karşı hazır)
    const { message, prompt } = req.body;
    const userMessage = message || prompt;

    if (!userMessage) {
      return res.status(400).json({ error: 'Mesaj içeriği boş olamaz.' });
    }

    // Vercel Environment Variables'a eklediğin key'i çağırır
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
    });

    // Sitenin index.html dosyası hangi değişkeni arıyorsa patlamasın diye hepsini dönüyoruz
    return res.status(200).json({ 
      reply: response.text,
      response: response.text,
      text: response.text 
    });

  } catch (error) {
    console.error("Gemini Hatası:", error);
    return res.status(500).json({ error: 'Yapay zeka şu an müsait değil.', details: error.message });
  }
}