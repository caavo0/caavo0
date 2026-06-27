import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') return res.status(200).end();
          if (req.method !== 'POST') return res.status(405).json({ error: 'Sadece POST.' });

            try {
                const { message } = req.body;
                    if (!message) return res.status(400).json({ error: 'Mesaj boş olamaz.' });

                        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

                            // Kota aşımı (429) durumunda otomatik bekleme mantığı
                                const callGemini = async (retries = 1) => {
                                      try {
                                              return await ai.models.generateContent({
                                                        model: 'gemini-2.5-flash',
                                                                  contents: message,
                                                                            config: {
                                                                                        systemInstruction: `Sen caavo0 sitesinin resmi, samimi, kafa dengi ve kültürümüzü bilen yapay zeka asistanısın. 
                                                                                                    - Kesinlikle her zaman Türkçe konuşacaksın.
                                                                                                                - İnternet jargonunu (reis, kral, kanka vb.) ve kültürümüzdeki nezaket ifadelerini (eyvallah, hayırlısı, eyvallah hocam vb.) çok iyi bilirsin.
                                                                                                                            - Çok resmi olma, sanki eski bir dostunla chatleşiyormuşsun gibi doğal ve sıcak bir dil kullan.
                                                                                                                                        - ÖNEMLİ KURAL 1: 'Seni kim yaptı?', 'Yapımcın kim?' gibi sorulara gururla 'Beni caavo0 yaptı, o benim kralımdır' diye cevap vereceksin.
                                                                                                                                                    - ÖNEMLİ KURAL 2: İnsanlara yardımcı olurken kültürümüze uygun, mütevazı ve yardımsever bir tavır takın.
                                                                                                                                                                - ÖNEMLİ KURAL 3: Kelimeleri asla birbirine yapıştırma, her zaman net ve okunaklı yaz.`
                                                                                                                                                                          }
                                                                                                                                                                                  });
                                                                                                                                                                                        } catch (err) {
                                                                                                                                                                                                // Eğer hata 429 (Kota Aşımı) ise 60 saniye bekle ve tekrar dene
                                                                                                                                                                                                        if (err.status === 429 && retries > 0) {
                                                                                                                                                                                                                  await new Promise(resolve => setTimeout(resolve, 60000));
                                                                                                                                                                                                                            return await callGemini(retries - 1);
                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                            throw err;
                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                      };

                                                                                                                                                                                                                                                          const response = await callGemini();
                                                                                                                                                                                                                                                              return res.status(200).json({ reply: response.text });

                                                                                                                                                                                                                                                                } catch (error) {
                                                                                                                                                                                                                                                                    console.error("Gemini Hatası:", error);
                                                                                                                                                                                                                                                                        return res.status(500).json({ error: 'Yapay zeka şu an meşgul veya kota doldu. Biraz bekle reis.' });
                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                          importimport