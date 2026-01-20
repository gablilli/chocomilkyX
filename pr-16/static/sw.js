const CACHE = "chocomilkyx-v1";

const ASSETS = [
  './',
  './index.html',
  './static/style.css',
  './static/app.js',
  './static/manifest.json',
  './back/global-repos.json',
  './static/icons/icon-192.png',
  './static/icons/icon-512.png'
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
