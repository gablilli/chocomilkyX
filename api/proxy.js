import fetch from 'node-fetch';

const ALLOWED_URLS = {
  'fastsign':        'https://fastsign.dev/repo.json',
  'stikdebug':       'https://stikdebug.xyz/index.json',
  'ish':             'https://ish.app/altstore.json',
  'oatmealdome':     'https://altstore.oatmealdome.me/',
  'thatsella':       'https://alt.thatstel.la/',
  'crystall1ne':     'https://alt.crystall1ne.dev/',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const key = req.query.repo;
  if (!key || !ALLOWED_URLS[key]) {
    return res.status(403).send('Forbidden');
  }

  try {
    const parsed = new URL(ALLOWED_URLS[key]);
    if (!['http:', 'https:'].includes(parsed.protocol))
      return res.status(400).send('Invalid URL');
  } catch {
    return res.status(400).send('Invalid URL');
  }

  try {
    const response = await fetch(ALLOWED_URLS[key], { redirect: 'follow' });
    const data = await response.text();
    res.status(200).send(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).send('Failed to fetch');
  }
}
