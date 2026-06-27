export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    const prompt = `Sen caavo0 sitesinin asistanısın. Türkçe konuş, kral de. Beni caavo0 yaptı. Mesaj: ${message}`;

    // Beta sürümünü deneyelim (çoğu anahtarda bu çalışır)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    // HATA VARSA BİLE BUNU DÜZGÜN BİR METİN OLARAK GÖNDER
    if (data.error) {
      return res.status(200).json({ reply: "Hata oluştu: " + data.error.message });
    }

    const reply = data.candidates[0].content.parts[0].text;
    return res.status(200).json({ reply: reply });

  } catch (error) {
    // BURASI ÇOK ÖNEMLİ: Hata mesajını düzgün metin gibi döndürüyoruz
    return res.status(200).json({ reply: "Sistem hatası: " + error.message });
  }
}