// Enlace de invitación: al compartirlo debe salir GameHub (nombre e ícono), no otra app del mismo sitio.
// 1) la cabecera trae la vista previa (og:*, twitter:*) con direcciones completas, cerca del principio (los lectores de enlaces leen poco)
// 2) favicon.ico y la imagen de vista previa existen (1200×630, liviana para WhatsApp)
// 3) dentro de una sala, la dirección de la página es exactamente el enlace que se comparte; al salir, se quita ?sala
// Necesita el servidor de docs/ en 8765 (como las demás pruebas).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const BASE = process.env.URL || 'http://127.0.0.1:8765/';
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const fails = [];
  const html = fs.readFileSync(path.join(__dirname, '..', 'docs', 'index.html'), 'utf8');
  const head = html.slice(0, 16000);
  for (const k of ['og:title', 'og:description', 'og:image', 'og:image:width', 'og:site_name', 'twitter:card', 'twitter:image']) if (!new RegExp(`(property|name)="${k}"`).test(head)) fails.push('falta ' + k + ' en los primeros 16 KB');
  const img = (head.match(/property="og:image" content="([^"]+)"/) || [])[1] || '';
  if (!/^https:\/\/igaviria0001-ops\.github\.io\/gamehub\/docs\/assets\/enlace\.jpg$/.test(img)) fails.push('og:image no es la dirección completa: ' + img);
  if (!/<title>GameHub<\/title>/.test(head)) fails.push('título');
  const root = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  if (!/og:image" content="https:\/\//.test(root) || !/location\.search \+ location\.hash/.test(root)) fails.push('la página de la raíz no trae vista previa o pierde ?sala');
  const jpg = fs.readFileSync(path.join(__dirname, '..', 'docs', 'assets', 'enlace.jpg'));
  const dims = (() => { for (let i = 2; i < jpg.length;) { const m = jpg[i + 1], len = jpg.readUInt16BE(i + 2); if (m >= 0xC0 && m <= 0xC2) return [jpg.readUInt16BE(i + 7), jpg.readUInt16BE(i + 5)]; i += 2 + len; } })();
  if (!dims || dims[0] !== 1200 || dims[1] !== 630) fails.push('enlace.jpg mide ' + dims);
  if (jpg.length > 290000) fails.push('enlace.jpg pesa demasiado para WhatsApp: ' + jpg.length);
  const ico = fs.readFileSync(path.join(__dirname, '..', 'docs', 'favicon.ico'));
  if (ico.readUInt16LE(2) !== 1 || ico.readUInt16LE(4) < 3) fails.push('favicon.ico raro');

  const b = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }); const errs = [];
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  for (const f of ['favicon.ico', 'assets/enlace.jpg', 'assets/icons/icon-192.png']) { const r = await p.request.get(BASE + f); if (!r.ok()) fails.push('no se sirve ' + f); }
  // compartir: se captura lo que la página le pasa al navegador
  await ctx.addInitScript(() => { window.__shared = null; Object.defineProperty(navigator, 'share', { configurable: true, value: d => { window.__shared = d; return Promise.resolve(); } }); });
  await p.goto(BASE + '?net=bc#online'); await wait(700);
  await p.fill('[data-pname="0"]', 'Ana'); await p.click('#on-host'); await wait(800);
  const code = await p.evaluate(() => Net.code);
  const st = await p.evaluate(() => ({ href: location.href, icons: [...document.querySelectorAll('link[rel~=icon]')].map(l => l.href) }));
  await p.click('#on-share'); await wait(200);
  const sh = await p.evaluate(() => window.__shared);
  await p.click('#on-copy'); await wait(200);
  const note = await p.evaluate(() => (document.querySelector('.on-note') || {}).textContent || '');
  if (!sh || sh.url !== st.href) fails.push('lo compartido no es la dirección de la página: ' + JSON.stringify(sh) + ' vs ' + st.href);
  if (!sh || !/GameHub/.test(sh.title) || !sh.url.includes('sala=' + code)) fails.push('compartir sin nombre o sin código');
  if (!note.includes(st.href)) fails.push('copiar enlace no copia la misma dirección');
  if (!st.icons.some(h => h.endsWith('/favicon.ico'))) fails.push('sin favicon.ico en la página');
  // recargar dentro de la sala deja el código listo para volver; salir lo quita
  await p.click('#on-leave'); await wait(400);
  const after = await p.evaluate(() => location.href);
  if (/sala=/.test(after)) fails.push('al salir sigue ?sala: ' + after);
  await b.close();
  console.log(JSON.stringify({ code, pagina: st.href, compartido: sh, alSalir: after, imagen: dims, peso: jpg.length, errores: errs.slice(0, 3) }));
  if (errs.length) fails.push('errores: ' + errs.slice(0, 2).join(' | '));
  console.log(fails.length ? 'ENLACE FALLA: ' + fails.join(' · ') : 'ENLACE OK');
})();
