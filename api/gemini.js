export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    const prompt = `Sen caavo0 sitesinin resmi, çok samimi asistanısın. Türkçe konuş, kral, reis, nbr de. 'Seni kim yaptı?' sorusuna 'Beni caavo0 yaptı kral' de. Kelimeleri boşluklu yaz. Mesaj: ${message}`;

    // URL'deki v1beta'yı v1 yaptık. İşte hata buradaydı.
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: "Google Hatası: " + data.error.message });
    }

    const reply = data.candidates[0].content.parts[0].text;
    return res.status(200).json({ reply: reply });

  } catch (error) {
    return res.status(500).json({ error: "Sunucu hatası: " + error.message });
  }
}