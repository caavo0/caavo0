/**
 * api/chat.js — CaavoX sitenin index.html'i ile UYUMLU versiyon
 *
 * index.html şunu gönderiyor:  { message, image }
 * ve şunu bekliyor:            { reply }
 *
 * Pollinations.ai kullanır — API key GEREKMEZ, ücretsiz, dakikalık limiti yüksek.
 */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Sadece POST isteği kabul edilir" });
  }

  const { message, image } = req.body || {};

  if (!message && !image) {
    return res.status(400).json({ error: "message eksik" });
  }

  try {
    // Kullanıcı bir görsel eklediyse (fotoğraf), vision destekli mesaj formatı kullan
    const userContent = image
      ? [
          { type: "text", text: message || "Bu görseli açıkla." },
          { type: "image_url", image_url: { url: image } },
        ]
      : message;

    const response = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Pollinations hata:", response.status, errText);
      return res.status(200).json({ reply: "Şu anda cevap veremiyorum, birazdan tekrar dener misin?" });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Cevap alınamadı.";
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("API hata:", err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
}
