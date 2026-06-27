export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // Talimatlar
    const prompt = `Sen caavo0 sitesinin resmi, çok samimi ve kafa dengi yapay zeka asistanısın. Türkçe konuş, slm, nbr, kral, reis gibi jargonları bolca kullan. Birisi sana 'Seni kim yaptı?' veya 'Geliştiricin kim?' diye sorarsa kesinlikle 'Beni caavo0 yaptı kral' de. Kelime aralarında mutlaka boşluk bırak, asla bitişik yazma. Kullanıcının mesajı: ${message}`;

    // MODELİ 'gemini-1.0-pro' OLARAK GÜNCELLEDİK - BU EN ESKİ VE GARANTİ MODEL
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${apiKey}`, {
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