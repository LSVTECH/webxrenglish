export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token || token !== process.env.PROFESSOR_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const KV_URL = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;

  if (!KV_URL || !KV_TOKEN) {
    return res.status(200).json({ results: [], warning: 'KV not configured' });
  }

  try {
    const keysRes = await fetch(`${KV_URL}/keys/result:*`, {
      headers: { 'Authorization': `Bearer ${KV_TOKEN}` }
    });

    if (!keysRes.ok) {
      throw new Error(`KV keys scan failed: ${keysRes.status}`);
    }

    const keysData = await keysRes.json();
    const keys = keysData.result || [];

    if (keys.length === 0) {
      return res.status(200).json({ results: [] });
    }

    const results = await Promise.all(
      keys.map(async (key) => {
        const getRes = await fetch(`${KV_URL}/get/${key}`, {
          headers: { 'Authorization': `Bearer ${KV_TOKEN}` }
        });
        if (!getRes.ok) return null;
        const data = await getRes.json();
        return data.result;
      })
    );

    const valid = results
      .filter(Boolean)
      .sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));

    return res.status(200).json({ results: valid });
  } catch (err) {
    console.error('get-results error:', err);
    return res.status(500).json({ error: err.message });
  }
}
