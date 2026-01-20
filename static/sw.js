const CACHE = "chocomilkyx";

const ASSETS = [
  '/chocomilkyX/',
  '/chocomilkyX/index.html',
  '/chocomilkyX/static/style.css',
  '/chocomilkyX/static/app.js',
  '/chocomilkyX/static/manifest.json',
  '/chocomilkyX/back/global-repos.json',
  '/chocomilkyX/icons/icon-192.png',
  '/chocomilkyX/icons/icon-512.png'
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
