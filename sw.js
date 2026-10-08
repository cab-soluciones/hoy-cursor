const CACHE = 'hoy-v2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './js/main.js',
  './js/util.js',
  './js/data.js',
  './js/calc.js',
  './js/ui.js',
  './js/hoy.js',
  './js/gym.js',
  './js/gastos.js',
  './js/notas.js',
  './js/ajustes.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(req, { ignoreSearch: true }).then((hit) => {
        const net = fetch(req).then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        });
        if (hit) { net.catch(() => {}); return hit; }
        return net.catch(() => cache.match('./index.html'));
      })
    )
  );
});
