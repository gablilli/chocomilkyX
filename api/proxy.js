import fetch from 'node-fetch';

const allowedOrigins = [
  'https://chocomilkyx.vercel.app',
  'https://chocomilkyx-dev.vercel.app'
];

const PROXY_SECRET = process.env.PROXY_SECRET;

export default async function handler(req, res) {
  const origin = req.headers.origin;
  const token = req.headers['x-proxy-token'];

  const hasValidOrigin = origin && allowedOrigins.includes(origin);
  const hasValidToken = PROXY_SECRET && token === PROXY_SECRET;

  if (!hasValidOrigin && !hasValidToken) {
    return res.status(403).send('Forbidden');
  }

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-proxy-token');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const url = req.query.url;
  if (!url) {
    return res.status(400).send('Missing url parameter');
  }

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
