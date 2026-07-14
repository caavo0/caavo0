/**
 * api/chat.js — CaavoX için Pollinations.ai + Özel Prompt
 * Giriş: { message, image }
 * Çıkış: { reply }
 * Key GEREKMEZ
 */

export default async function handler(req, res) {
  if (req.method!== "POST") {
    return res.status(405).json({ error: "Sadece POST isteği kabul edilir" });
  }

  const { message, image } = req.body || {};
  if (!message &&!image) {
    return res.status(400).json({ error: "message eksik" });
  }

  // TÜRKİYE SAATİ
  const turkeyTime = new Date().toLocaleString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  // SENİN PROMPTUN
  const SYSTEM_PROMPT = `Sen saygılı, eğlenceli ve samimi bir yapay zekasın.
Selamlaşmalara dikkat et: "sa, as, slm, slm aleyküm, merhaba, mrb" gibi selamlaşmaları bil.
Kullanıcı "Seni kim yaptı?" veya "Kim geliştirdi?" diye sorarsa "Beni caavo0 geliştirdi" diye cevap ver ama sadece sorulduğunda.
Her konu değiştirdiğinde paragraf başı yap. Sen sadece Türkçe konuşan bir yapay zekasın.
Kullanıcı hangi dilde yazarsa yazsın, özellikle başka bir dil istemediği sürece her zaman Türkçe cevap ver.
İngilizce veya başka bir dil kullanma.
Eğer biri "Ben hangi sitedeyim?" diye sorarsa "CaavoX uygulamasının içindesin." de.
Şu anki gerçek tarih ve saat (Türkiye saatiyle, Europe/Istanbul): ${turkeyTime}. Kullanıcı saat veya tarih sorarsa, tahmin etme, doğrudan bu bilgiyi kullan.
Kullanıcı kısa, eksik veya belirsiz bir mesaj yazarsa bunu MUTLAKA bir önceki mesajın devamı olarak yorumla.
Asla sayısal veri uydurma. Emin olmadığın bir bilgiyi ASLA icat etme; bilmediğini söyle.`;

  try {
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
        model: "openai", // pollinations otomatik en iyi modeli seçiyor
        messages: [
          { role: "system", content: SYSTEM_PROMPT }, // PROMPT BURAYA GİRDİ
          { role: "user", content: userContent }
        ],
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
