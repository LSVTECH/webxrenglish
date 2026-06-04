export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { studentName, experience, guestProfile, scores, summary, mistakes, recommendations, completedAt } = req.body || {};

  if (!studentName || !scores) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  if (!KV_URL || !KV_TOKEN) {
    console.warn('Vercel KV not configured — result not persisted.');
    return res.status(200).json({ ok: true, persisted: false, warning: 'KV not configured' });
  }

  const timestamp = Date.now();
  const key = `result:${timestamp}`;
  const record = {
    studentName,
    experience: experience || 'Hotel Receptionist',
    guestProfile: guestProfile || 'Unknown',
    scores,
    summary: summary || '',
    mistakes: mistakes || '',
    recommendations: recommendations || '',
    completedAt: completedAt || new Date().toISOString(),
    savedAt: timestamp
  };

  try {
    const setRes = await fetch(`${KV_URL}/set/${key}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KV_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(record)
    });

    if (!setRes.ok) {
      const errText = await setRes.text();
      throw new Error(`KV set failed: ${setRes.status} ${errText}`);
    }

    // Also add key to the student's index for fast lookups
    const indexKey = `student:${studentName.toLowerCase().replace(/\s+/g, '_')}`;
    await fetch(`${KV_URL}/lpush/${indexKey}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KV_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(key)
    });

    return res.status(200).json({ ok: true, persisted: true, key });
  } catch (err) {
    console.error('save-result error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
