/**
 * api/chat.js — SUNUCU TARAFI versiyonu
 * Eğer projende package.json var ve "npm run dev / npm start" ile
 * çalıştırıyorsan (Next.js, Express gibi) muhtemelen bu dosya sana lazım.
 *
 * Pollinations.ai kullanır — API key GEREKMEZ, ücretsiz.
 */

// ------------------------------
// NEXT.JS (pages/api/chat.js) İÇİN
// ------------------------------
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Sadece POST isteği kabul edilir" });
  }

  const { prompt, type = "text" } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "prompt eksik" });
  }

  try {
    if (type === "image") {
      const encodedPrompt = encodeURIComponent(prompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
      return res.status(200).json({ imageUrl });
    }

    // type === "text"
    const response = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Cevap alınamadı.";
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("API hata:", err);
    return res.status(500).json({ error: "Sunucu hatası" });
  }
}

/*
  ------------------------------
  EXPRESS.JS İÇİN (bu bloğu ayrı bir dosyada kullan, yukarıdaki export default'u değil)
  ------------------------------

  const express = require("express");
  const router = express.Router();

  router.post("/chat", async (req, res) => {
    const { prompt, type = "text" } = req.body;
    if (!prompt) return res.status(400).json({ error: "prompt eksik" });

    try {
      if (type === "image") {
        const encodedPrompt = encodeURIComponent(prompt);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
        return res.json({ imageUrl });
      }

      const response = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "Cevap alınamadı.";
      res.json({ reply });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Sunucu hatası" });
    }
  });

  module.exports = router;
*/

/*
  ------------------------------
  Frontend'den bu API'yi nasıl çağırırsın (her iki durumda da aynı):
  ------------------------------

  // Metin için:
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "merhaba", type: "text" }),
  });
  const data = await res.json();
  console.log(data.reply);

  // Görsel için:
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: "uçan araba", type: "image" }),
  });
  const data = await res.json();
  document.getElementById("img").src = data.imageUrl;
*/
