const UPSTREAM = {
  fastsign:    'https://fastsign.dev/repo.json',
  stikdebug:   'https://stikdebug.xyz/index.json',
  ish:         'https://ish.app/altstore.json',
  oatmealdome: 'https://altstore.oatmealdome.me/',
  thatsella:   'https://alt.thatstel.la/',
  crystall1ne: 'https://alt.crystall1ne.dev/',
};

function isSameOrigin(req) {
  const site = req.headers['sec-fetch-site'];
  if (site) return site === 'same-origin';
  try {
    return new URL(req.headers.referer).host === req.headers.host;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');

  const url = UPSTREAM[req.query.repo];
  if (!url) return res.status(403).send('Forbidden');
  if (!isSameOrigin(req)) return res.status(403).send('Forbidden');

  try {
    const r = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(502).send('Upstream error');
    }
    const data = await r.text();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=900, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(500).send('Failed to fetch');
  }
}
