// Arma GameHub en docs/ (lista para GitHub Pages):
//   docs/index.html            la portada (fuentes, estilo y código incrustados)
//   docs/games/<juego>.html    cada juego, construido desde juegos/<juego>/ con su propio build.js
//   docs/assets/…              galaxia, fotos e íconos
//   docs/manifest.webmanifest, docs/sw.js, docs/version.json   app instalable, sin internet y con avisos de versión nueva
// Uso: node build.js            (todo)   ·   node build.js --solo-app   (sin reconstruir los juegos)
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = __dirname, OUT = path.join(ROOT, 'docs');
const GAMES = [['tira-y-afloja', 'tira-y-afloja'], ['ventolera', 'ventolera'], ['sortilegio', 'sortilegio'], ['vertigo', 'vertigo']];
const soloApp = process.argv.includes('--solo-app');
const srcDir = id => process.env['SRC_' + id.replace(/-/g, '_').toUpperCase()] || path.join(ROOT, 'juegos', id);
fs.mkdirSync(path.join(OUT, 'games'), { recursive: true });

// 1) los juegos: el enlace con la colección es el mismo archivo en todos
if (!soloApp) for (const [id] of GAMES) {
  const dir = srcDir(id);
  fs.copyFileSync(path.join(ROOT, 'shared', 'hub-link.js'), path.join(dir, 'src', '00h-hub.js'));
  fs.copyFileSync(path.join(ROOT, 'shared', 'fullscreen.js'), path.join(dir, 'src', '00i-fs.js'));
  fs.copyFileSync(path.join(ROOT, 'shared', 'vestidor.js'), path.join(dir, 'src', '00j-vest.js'));
  execFileSync(process.execPath, [path.join(dir, 'build.js'), path.join(OUT, 'games', id + '.html')], { stdio: 'inherit' });
}

// 2) la portada
const A = path.join(ROOT, 'assets');
const b64 = f => fs.readFileSync(path.join(A, 'fonts', f)).toString('base64');
const ff = (fam, file, w, fmt = 'woff2') => `@font-face { font-family: "${fam}"; font-style: normal; font-weight: ${w}; font-display: swap; src: url(data:font/${fmt};base64,${b64(file)}) format("${fmt === 'ttf' ? 'truetype' : fmt}"); }`;
const fonts = [ff('Bungee', 'bungee-latin-400-normal.woff2', 400), ff('Nunito', 'nunito-latin-600-normal.woff2', 600), ff('Nunito', 'nunito-latin-800-normal.woff2', 800), ff('Nunito', 'nunito-latin-800-normal.woff2', 900),
  ff('Fredoka', 'fredoka-latin-700-normal.woff2', 700), ff('Comfortaa', 'comfortaa-latin-700-normal.woff2', 700), ff('Macondo', 'macondo-latin-400-normal.woff2', 400), ff('Russo One', 'RussoOne-Regular.ttf', 400, 'ttf')].join('\n');
const read = f => fs.readFileSync(path.join(ROOT, 'app', f), 'utf8');

// 3) galaxia, fotos e íconos
const copyDir = (from, to) => { fs.mkdirSync(to, { recursive: true }); for (const f of fs.readdirSync(from)) fs.copyFileSync(path.join(from, f), path.join(to, f)); };
copyDir(path.join(A, 'shots'), path.join(OUT, 'assets', 'shots'));
copyDir(path.join(A, 'icons'), path.join(OUT, 'assets', 'icons'));
fs.copyFileSync(path.join(A, 'galaxia.jpg'), path.join(OUT, 'assets', 'galaxia.jpg'));
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

// versión: huella de todo lo que se publica (cambia sola cuando cambia cualquier cosa)
const crypto = require('crypto'), hash = crypto.createHash('sha1');
const assetFiles = ['assets/galaxia.jpg', ...fs.readdirSync(path.join(OUT, 'assets', 'shots')).map(f => 'assets/shots/' + f), ...fs.readdirSync(path.join(OUT, 'assets', 'icons')).map(f => 'assets/icons/' + f)];
for (const f of ['index.html', 'app.css', 'catalog.js', 'torneo.js', 'app.js']) hash.update(read(f));
hash.update(fonts);
for (const f of [...GAMES.map(([id]) => `games/${id}.html`), ...assetFiles]) hash.update(fs.readFileSync(path.join(OUT, f)));
const ver = hash.digest('hex').slice(0, 10), today = new Date().toISOString().slice(0, 10);
const BUILD = { v: ver, date: today };

const js = ['catalog.js', 'torneo.js', 'app.js'].map(f => `/* ===== ${f} ===== */\n` + read(f)).join('\n').replace("/*__BUILD__*/ { v: 'dev', date: '' }", () => JSON.stringify(BUILD));
const html = read('index.html').replace('/*__FONTS__*/', () => fonts).replace('/*__CSS__*/', () => read('app.css')).replace('/*__JS__*/', () => js);
fs.writeFileSync(path.join(OUT, 'index.html'), html);
fs.writeFileSync(path.join(OUT, 'version.json'), JSON.stringify(BUILD));

// 4) app instalable, sin internet y que siempre trae lo nuevo sin tocar el progreso
const manifest = { id: './', name: 'GameHub', short_name: 'GameHub', description: 'Cuatro juegos para dos en un solo lugar, y un torneo combinado para jugar con los amigos.', lang: 'es', dir: 'ltr', start_url: './', scope: './',
  display: 'fullscreen', display_override: ['fullscreen', 'standalone'], orientation: 'any', background_color: '#05030c', theme_color: '#05030c', categories: ['games', 'entertainment'],
  icons: [{ src: 'assets/icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'assets/icons/icon-512.png', sizes: '512x512', type: 'image/png' }, { src: 'assets/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }] };
if (fs.existsSync(path.join(OUT, 'assets', 'shots', 'app-wide.jpg'))) manifest.screenshots = [{ src: 'assets/shots/app-wide.jpg', sizes: '1280x720', type: 'image/jpeg', form_factor: 'wide', label: 'La portada de GameHub' }, ...(fs.existsSync(path.join(OUT, 'assets', 'shots', 'app-narrow.jpg')) ? [{ src: 'assets/shots/app-narrow.jpg', sizes: '720x1280', type: 'image/jpeg', label: 'GameHub en el celular' }] : [])];
fs.writeFileSync(path.join(OUT, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));
const files = ['./', 'index.html', 'manifest.webmanifest', ...GAMES.map(([id]) => `games/${id}.html`), ...assetFiles];
fs.writeFileSync(path.join(OUT, 'sw.js'), `// GameHub · versión ${ver} (${today})
// Funciona sin internet y, con conexión, siempre trae lo más nuevo (primero la red, luego la copia).
// El progreso de los juegos NO vive aquí: está en el almacenamiento del navegador y ninguna versión lo toca.
const CACHE = 'gamehub-${ver}', FILES = ${JSON.stringify(files)};
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
`);
const kb = f => (fs.statSync(path.join(OUT, f)).size / 1024).toFixed(0) + ' KB';
console.log('OK docs/index.html', kb('index.html'), '·', GAMES.map(([id]) => `${id} ${kb('games/' + id + '.html')}`).join(' · '), '· versión', ver);
