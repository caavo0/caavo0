export default async function handler(req, res) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
    const data = await response.json();
    
    // Hangi modellerin aktif olduğunu bize gösterecek
    res.status(200).json({ modeller: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}