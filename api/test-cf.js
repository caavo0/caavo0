export default async function handler(req, res) {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    console.log("=== CF TEST ===");
    console.log("Account ID:", accountId);
    console.log("Token exists:", !!apiToken);
    console.log("Token length:", apiToken?.length);
    console.log("Token starts with:", apiToken?.substring(0, 10));

    if (!accountId || !apiToken) {
        return res.status(500).json({ 
            error: "Environment variables eksik",
            accountId: accountId,
            tokenExists: !!apiToken
        });
    }

    try {
        const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`;
        
        console.log("Requesting URL:", url);

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: [
                    { role: "user", content: "Merhaba, bu bir test mesajıdır. Sadece 'test başarılı' de." }
                ]
            })
        });

        console.log("Response status:", response.status);
        console.log("Response headers:", Object.fromEntries(response.headers));

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error response:", errorText);
            return res.status(response.status).json({
                error: "Cloudflare API hatası",
                status: response.status,
                details: errorText
            });
        }

        const data = await response.json();
        console.log("Success! Response:", data);

        return res.status(200).json({
            success: true,
            response: data.result?.response || data.result
        });

    } catch (error) {
        console.error("Fetch error:", error);
        return res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
}
