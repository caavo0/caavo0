export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    // Hangi modelleri desteklediğini sorguluyoruz
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    const data = await response.json();

    // Desteklenen model isimlerini ekrana yazdırıyoruz
    const modelNames = data.models.map(m => m.name).join(", ");
    
    return res.status(200).json({ desteklenen_modeller: modelNames });

  } catch (error) {
    return res.status(500).json({ error: "Sorgu hatası: " + error.message });
  }
}