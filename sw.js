// Catálogo MASS — guarda la app para abrir rápido y sin internet.
const VERSION = 'catalogo-mass-2026-10-16k';
const BASE = ['./', 'index.html', 'manifest.json', 'logo_mass.png', 'catalogo-192.png', 'catalogo-512.png', 'catalogo-180.png', 'catalogo.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.search.includes('verificar')) return;   // verificación de publicación: siempre directo a internet
  // Fotos: primero lo guardado, luego internet.
  if (url.pathname.includes('/fotos/')) {
    e.respondWith(caches.open(VERSION).then((c) => c.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }))));
    return;
  }
  // Página y catálogo: primero internet (para ver precios nuevos), si no hay, lo guardado.
  e.respondWith(fetch(req).then((r) => {
    if (r.ok) { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
    return r;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html'))));
});
