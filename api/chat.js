import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

const getTurkeyTime = () => {
  return new Date().toLocaleString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const getSystemPrompt = () => {
  return `Sen saygılı, eğlenceli ve samimi bir yapay zekasın. Adın CaavoX.
Selamlaşmalara dikkat et: "sa, as, slm, slm aleyküm, merhaba, mrb" gibi selamlaşmaları bil ve aynı tonda karşılık ver.
Kullanıcı "Seni kim yaptı?" veya "Kim geliştirdi?" diye sorarsa sadece o zaman "Beni caavo0 geliştirdi" diye cevap ver.
Her konu değiştirdiğinde paragraf başı yap.
Sen sadece Türkçe konuşan bir yapay zekasın. Kullanıcı hangi dilde yazarsa yazsın, özellikle başka bir dil istemediği sürece her zaman Türkçe cevap ver.
Eğer biri "Ben hangi sitedeyim?" diye sorarsa "CaavoX uygulamasının içindesin." de.
Şu anki gerçek tarih ve saat (Türkiye saatiyle, Europe/Istanbul): ${getTurkeyTime()}.
Kullanıcı kısa, eksik veya belirsiz bir mesaj yazarsa bunu MUTLAKA bir önceki mesajın devamı olarak yorumla.
Asla sayısal veri uydurma. Emin olmadığın bir bilgiyi ASLA icat etme; bilmediğini söyle.`;
}

export default async function handler(req, res) {
  if (req.method!== "POST") {
    return res.status(405).json({ error: "Sadece POST isteği kabul edilir" });
  }

  const { message, image, history = [] } = req.body || {};
  if (!message &&!image) {
    return res.status(400).json({ error: "message eksik" });
  }

  try {
    // 1. System prompt
    const messages = [{ role: "system", content: getSystemPrompt() }];

    // 2. Geçmiş mesajları ekle. Son 10 mesaj yeterli. Token şişmesin
    const limitedHistory = history.slice(-10);
    messages.push(...limitedHistory);

    // 3. Şimdiki mesajı ekle
    const userContent = image
  ? [
          { type: "text", text: message || "Bu görseli detaylı açıkla." },
          { type: "image_url", image_url: { url: image } },
        ]
      : [{ type: "text", text: message }];
    
    messages.push({ role: "user", content: userContent });

    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: messages, // ARTIK GEÇMİŞLE BERABER GİDİYOR
      temperature: 0.7,
      max_tokens: 2048,
    });

    const reply = completion.choices[0]?.message?.content || "Cevap alınamadı.";
    return res.status(200).json({ reply });

  } catch (err) {
    console.error("Groq API Hata:", err);
    return res.status(500).json({ error: "Sunucu hatası: " + err.message });
  }
}
