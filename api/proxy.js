import fetch from 'node-fetch';

export default async function handler(req, res) {
  const allowedOrigin = 'https://chocomilkyx.vercel.app';
  const origin = req.headers.origin;

  if (origin !== allowedOrigin) {
    res.status(403).send('Forbidden');
    return;
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
    return;
  }

  const url = req.query.url;
  if (!url) {
    res.status(400).send('Missing url parameter');
    return;
  }

  try {
    const response = await fetch(url, { redirect: 'follow' });
    const data = await response.text();

    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    res.status(200).send(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).send('Failed to fetch');
  }
}
