export default async function handler(req, res) {
  const { message } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    // Model ismini 'gemini-1.5-flash' yerine 'gemini-1.0-pro' olarak değiştiriyoruz
    // Eğer bu da olmazsa, anahtarında "kısıtlama" var demektir.
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
       return res.status(200).json({ reply: "Hata: " + data.error.message });
    }

    const reply = data.candidates[0].content.parts[0].text;
    res.status(200).json({ reply: reply });
  } catch (e) {
    res.status(200).json({ reply: "Kod Hatası: " + e.message });
  }
}