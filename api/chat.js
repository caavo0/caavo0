import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const HISTORY_LIMIT = 200;

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
Asla sayısal veri uydurma. Emin olmadığın bir bilgiyi ASLA icat etme; bilmediğini söyle.
Konuşma geçmişindeki son ${HISTORY_LIMIT} mesajı hatırlıyorsun; kullanıcı geçmişte söylenen bir şeye atıfta bulunursa bu geçmişi kullanarak cevap ver.
Güncel, anlık veya bilgi aralığının dışında kalabilecek bir konu (haberler, hava durumu, güncel fiyatlar, güncel olaylar, "bugün", "şu an", "en son" gibi ifadeler) sorulursa, tahmin etmek yerine "web_search" aracını kullanarak internetten güncel bilgi al ve ona göre cevap ver.`;
}

// Tavily ile web araması yapan yardımcı fonksiyon
const searchTavily = async (query) => {
  if (!TAVILY_API_KEY) {
    return { error: "Tavily API anahtarı tanımlı değil (TAVILY_API_KEY)." };
  }
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: "basic",
        include_answer: true,
        max_results: 5,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return { error: `Tavily hata: ${response.status} ${errText}` };
    }

    const data = await response.json();
    return {
      answer: data.answer || null,
      results: (data.results || []).map(r => ({
        title: r.title,
        url: r.url,
        content: r.content,
      })),
    };
  } catch (err) {
    return { error: "Tavily isteği başarısız: " + err.message };
  }
};

// Modelin çağırabileceği araç tanımı
const tools = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Güncel, anlık veya bilgi aralığı dışında kalabilecek konularda internetten güncel bilgi getirir. Haberler, hava durumu, güncel fiyatlar, güncel olaylar gibi sorularda kullan.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Aranacak arama sorgusu.",
          },
        },
        required: ["query"],
      },
    },
  },
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Sadece POST isteği kabul edilir" });
  }

  const { message, image, history = [] } = req.body || {};
  if (!message && !image) {
    return res.status(400).json({ error: "message eksik" });
  }

  try {
    // 1. System prompt
    const messages = [{ role: "system", content: getSystemPrompt() }];

    // 2. Geçmiş mesajları ekle. Son 200 mesaj hatırlanır.
    const limitedHistory = history.slice(-HISTORY_LIMIT);
    messages.push(...limitedHistory);

    // 3. Şimdiki mesajı ekle
    const userContent = image
      ? [
          { type: "text", text: message || "Bu görseli detaylı açıkla." },
          { type: "image_url", image_url: { url: image } },
        ]
      : [{ type: "text", text: message }];

    messages.push({ role: "user", content: userContent });

    // 4. İlk istek: model gerekirse web_search aracını çağırabilir
    let completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages,
      temperature: 0.7,
      max_tokens: 2048,
      tools,
      tool_choice: "auto",
    });

    let responseMessage = completion.choices[0]?.message;

    // 5. Model tool çağrısı yaptıysa, Tavily'i çalıştır ve sonucu modele geri gönder
    if (responseMessage?.tool_calls?.length) {
      messages.push(responseMessage);

      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.function.name === "web_search") {
          let args = {};
          try {
            args = JSON.parse(toolCall.function.arguments || "{}");
          } catch {
            args = {};
          }
          const searchResult = await searchTavily(args.query || message);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(searchResult),
          });
        }
      }

      completion = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      });

      responseMessage = completion.choices[0]?.message;
    }

    const reply = responseMessage?.content || "Cevap alınamadı.";
    return res.status(200).json({ reply });

  } catch (err) {
    console.error("Groq API Hata:", err);
    return res.status(500).json({ error: "Sunucu hatası: " + err.message });
  }
}
