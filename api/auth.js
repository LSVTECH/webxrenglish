export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password, role } = req.body || {};

  if (!password || !role) {
    return res.status(400).json({ ok: false, message: 'Missing password or role' });
  }

  if (role === 'student' && password === process.env.STUDENT_PASSWORD) {
    return res.status(200).json({ ok: true, role: 'student' });
  }

  if (role === 'professor' && password === process.env.PROFESSOR_PASSWORD) {
    return res.status(200).json({ ok: true, role: 'professor' });
  }

  return res.status(401).json({ ok: false, message: 'Invalid credentials' });
}
