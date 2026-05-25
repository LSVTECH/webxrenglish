export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Google API key is missing on Vercel.' });
  }

  const { text, voiceName, ssmlGender } = req.body || {};

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Bad request: body must contain a "text" field.' });
  }

  const speechGender = ssmlGender || 'MALE';
  const voice = voiceName || 'en-US-Neural2-D';

  const payload = {
    input: { text: text.substring(0, 500) },
    voice: {
      languageCode: 'en-US',
      name: voice,
      ssmlGender: speechGender
    },
    audioConfig: {
      audioEncoding: 'MP3'
    }
  };

  const endpoint = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errBody = await response.text();
      return res.status(response.status).json({ error: `TTS API returned status ${response.status}: ${errBody}` });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
