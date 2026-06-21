import fetch from 'node-fetch';

const allowedOrigins = [
  'https://chocomilkyx.vercel.app',
  'https://chocomilkyx-dev.vercel.app'
];

export default async function handler(req, res) {
  const origin = req.headers.origin;

  if (!origin || !allowedOrigins.includes(origin)) {
    return res.status(403).send('Forbidden');
  }

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const url = req.query.url;
  if (!url) return res.status(400).send('Missing url parameter');

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).send('Invalid URL protocol');
    }
  } catch {
    return res.status(400).send('Invalid URL');
  }

  try {
    const response = await fetch(url, { redirect: 'follow' });
    const data = await response.text();
    res.status(200).send(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).send('Failed to fetch');
  }
}
