export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    const data = await response.json();
    
    // Tüm modelleri buraya listeleyelim, bakalım 1.5 Flash var mı?
    const modelList = data.models.map(m => m.name);
    res.status(200).json({ desteklenenler: modelList });
  } catch (e) {
    res.status(500).json({ error: "Anahtarınla sorgulayamadım: " + e.message });
  }
}