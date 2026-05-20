export default async function handler(req, res) {
  // Solo permitimos peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Google API key is missing on Vercel.' });
  }

  const geminiModel = "gemini-2.5-flash-lite";
  const payload = req.body;

  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.contents)) {
    return res.status(400).json({ error: 'Bad request: body must contain a "contents" array.' });
  }

  // Prevent abuse: cap total history entries
  if (payload.contents.length > 100) {
    return res.status(400).json({ error: 'Too many messages in contents (max 100).' });
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errBody = await response.text();
      return res.status(response.status).json({ error: `Gemini API returned status ${response.status}: ${errBody}` });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
