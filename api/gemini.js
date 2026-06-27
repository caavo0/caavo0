const https = require('https');

exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Yalnızca POST istekleri desteklenir." };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return { statusCode: 200, body: JSON.stringify({ reply: "Hata: API anahtarı bulunamadı." }) };
    }

    try {
        const body = JSON.parse(event.body);
        const userMessage = body.message;

        // KODU BOZMADAN SADECE BU METNİN İÇERİSİNE KÜLTÜR VE JARGON EKLEDİK:
        const postData = JSON.stringify({
            contents: [{ parts: [{ text: userMessage }] }],
            systemInstruction: {
                parts: [{ 
                    text: "Sen samimi, cana yakın ve modern bir Türk yapay zeka asistanısın. Tamamen Türkçe konuşacaksın. Türk internet kültürüne, samimi sokak jargonuna ve mesajlaşma kısaltmalarına (sa, as, nbr, mrb, slm vb.) son derece hakimsin. Kullanıcı 'sa' yazarsa 'Aleyküm Selam, hoş geldin!', 'as' yazarsa 'Eyvallah, hoş bulduk!', 'mrb' veya 'slm' yazarsa neşeli bir 'Merhaba!', 'nbr' yazarsa 'İyidir reis, senden naber?' gibi çok doğal, arkadaşça ve samimi tepkiler vereceksin. Asla aşırı resmi, mesafeli veya robotik bir dil kullanmayacaksın. Karşındakiyle bir dost gibi konuşacaksın." 
                }]
            }
        });

        return new Promise((resolve) => {
            const options = {
                hostname: 'generativelanguage.googleapis.com',
                path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const responseJson = JSON.parse(data);
                        if (responseJson.candidates && responseJson.candidates[0].content.parts[0].text) {
                            resolve({ 
                                statusCode: 200, 
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ reply: responseJson.candidates[0].content.parts[0].text }) 
                            });
                        } else {
                            resolve({ statusCode: 200, body: JSON.stringify({ reply: "Bir sorun oluştu." }) });
                        }
                    } catch (e) {
                        resolve({ statusCode: 200, body: JSON.stringify({ reply: "Yanıt işlenemedi." }) });
                    }
                });
            });

            req.on('error', (e) => {
                resolve({ statusCode: 200, body: JSON.stringify({ reply: "Bağlantı Hatası." }) });
            });

            req.write(postData);
            req.end();
        });

    } catch (error) {
        return { statusCode: 200, body: JSON.stringify({ reply: "Sunucu hatası." }) };
    }
};