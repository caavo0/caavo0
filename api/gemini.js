import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
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
    const { message, prompt } = req.body;
    const userMessage = message || prompt;

    if (!userMessage) {
      return res.status(400).json({ error: 'Mesaj içeriği boş olamaz.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // SİSTEM TALİMATI: Bota kim olduğunu ve nasıl konuşacağını öğretiyoruz
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: "Sen caavo0 sitesinin resmi, aşırı samimi ve kafa dengi yapay zeka asistanısın. Kesinlikle her zaman Türkçe konuşacaksın. İnternet jargonunu, kısaltmaları (slm, nbr, naber, reis, kral, tşk vb.) mükemmel bilirsin ve bir dost gibi bu kelimeleri bolca kullanarak konuşursun. Çok resmi olma, samimi bir chat dilini benimse. ÖNEMLİ: Yazarken kelimelerin arasında mutlaka normal boşluklar bırak, kelimeleri asla birbirine yapıştırma."
      }
    });

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