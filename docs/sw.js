// GameHub · versión eaec2ef214 (2026-11-12)
// Funciona sin internet y, con conexión, siempre trae lo más nuevo (primero la red, luego la copia).
// El progreso de los juegos NO vive aquí: está en el almacenamiento del navegador y ninguna versión lo toca.
const CACHE = 'gamehub-eaec2ef214', FILES = ["./","index.html","manifest.webmanifest","games/tira-y-afloja.html","games/ventolera.html","games/sortilegio.html","games/vertigo.html","assets/galaxia.jpg","assets/shots/app-narrow.jpg","assets/shots/app-wide.jpg","assets/shots/sorti-cano.jpg","assets/shots/sorti-ciudad.jpg","assets/shots/sorti-paramo.jpg","assets/shots/sorti-volcan.jpg","assets/shots/tya-arte.jpg","assets/shots/tya-bus.jpg","assets/shots/tya-cafeteria.jpg","assets/shots/tya-profe.jpg","assets/shots/vento-capadocia.jpg","assets/shots/vento-cartagena.jpg","assets/shots/vento-cocora.jpg","assets/shots/vento-medellin.jpg","assets/shots/vertigo-egipto.jpg","assets/shots/vertigo-guatape.jpg","assets/shots/vertigo-santorini.jpg","assets/shots/vertigo-tokio.jpg","assets/icons/icon-180.png","assets/icons/icon-192.png","assets/icons/icon-32.png","assets/icons/icon-512.png","assets/icons/icon-64.png","assets/icons/icon-maskable-512.png"];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())); });
// solo se borran copias viejas de GameHub (otras apps del mismo sitio no se tocan)
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => /^(gamehub|parche)-/.test(k) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  if (url.pathname.endsWith('/version.json')) return;
  const net = req.mode === 'navigate' ? fetch(url.href, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(req, { cache: 'no-cache' });
  e.respondWith(net.then(r => { if (r.ok && r.type === 'basic') { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); } return r; })
    .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('./') : Response.error()))));
});
