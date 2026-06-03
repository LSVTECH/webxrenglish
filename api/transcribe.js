export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const apiKey = process.env.GOOGLE_TTS_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Google API key is missing on Vercel.' });
  }
  const payload = req.body;
  if (!payload || !payload.audio || !payload.audio.content) {
    return res.status(400).json({ error: 'Bad request: body must contain audio.content.' });
  }
  const endpoint = `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`;
  const sttPayload = {
    config: {
      encoding: 'WEBM_OPUS',
      sampleRateHertz: 48000,
      languageCode: 'en-US'
    },
    audio: {
      content: payload.audio.content
    }
  };
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sttPayload)
    });
    if (!response.ok) {
      const errBody = await response.text();
      return res.status(response.status).json({ error: `Google STT API returned status ${response.status}: ${errBody}` });
    }
    const data = await response.json();
    const transcript = data.results && data.results[0] && data.results[0].alternatives && data.results[0].alternatives[0] ? data.results[0].alternatives[0].transcript : '';
    return res.status(200).json({ transcript });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
