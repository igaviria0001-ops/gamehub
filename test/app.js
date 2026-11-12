// App instalable: manifiesto e íconos, service worker, aviso de versión nueva SIN perder el progreso,
// funcionamiento sin internet y copia de seguridad.  Requiere: python3 -m http.server 8765 en docs/.
// (Cambia docs/version.json y docs/sw.js un momento para simular una versión nueva y los deja como estaban.)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const URL = process.env.URL || 'http://127.0.0.1:8765/';
const DOCS = path.join(__dirname, '..', 'docs');
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const verFile = path.join(DOCS, 'version.json'), swFile = path.join(DOCS, 'sw.js');
  const ver0 = fs.readFileSync(verFile, 'utf8'), sw0 = fs.readFileSync(swFile, 'utf8');
  const b = await chromium.launch({ args: ['--disable-gpu'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }), p = await ctx.newPage(), errs = [], R = {};
  p.on('pageerror', e => errs.push(e.message));
  try {
    await p.goto(URL); await wait(1500);
    // 1) manifiesto e íconos
    R.manifest = await p.evaluate(async () => { const m = await (await fetch('manifest.webmanifest')).json(); const ok = await Promise.all(m.icons.concat(m.screenshots || []).map(async i => (await fetch(i.src)).ok)); return { name: m.name, display: m.display, start: m.start_url, icons: m.icons.length, todosLosArchivos: ok.every(Boolean) }; });
    // 2) service worker activo y controlando
    await p.evaluate(() => navigator.serviceWorker.ready); await p.reload(); await wait(1500);
    R.swControla = await p.evaluate(() => !!navigator.serviceWorker.controller);
    R.cacheGameHub = await p.evaluate(async () => (await caches.keys()).filter(k => k.startsWith('gamehub-')));
    // 3) progreso de mentiras en los 4 juegos y en GameHub
    await p.evaluate(() => { localStorage.setItem('tya_ach', JSON.stringify({ Ana: { primera: '2026-11-12' } })); localStorage.setItem('vto_prog', JSON.stringify({ games: 7 })); localStorage.setItem('srt_camp', JSON.stringify({ done: [1, 2, 3] })); localStorage.setItem('vtg_world', JSON.stringify({ c1: 3 })); localStorage.setItem('gamehub_fame', JSON.stringify([{ name: 'Copa Galaxia', players: [], events: [], date: Date.now(), format: 'serie' }])); });
    // 4) sale una versión nueva: avisa y, al actualizar, el progreso sigue ahí
    fs.writeFileSync(verFile, JSON.stringify({ v: 'prueba-nueva', date: '2026-12-01' }));
    fs.writeFileSync(swFile, sw0.replace(/^\/\/ GameHub · versión [^\n]*/, '// GameHub · versión prueba-nueva'));
    await p.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()));
    await p.waitForSelector('#update:not([hidden])', { timeout: 20000 });
    R.avisoVersion = await p.evaluate(() => document.querySelector('#update').textContent.trim());
    await p.click('#upgo'); await p.waitForLoadState('load'); await wait(1500);
    R.progresoTrasActualizar = await p.evaluate(() => ['tya_ach', 'vto_prog', 'srt_camp', 'vtg_world', 'gamehub_fame'].every(k => localStorage.getItem(k)));
    // 5) sin internet: la portada y un juego abren desde la copia
    fs.writeFileSync(verFile, ver0); fs.writeFileSync(swFile, sw0);
    await ctx.setOffline(true);
    await p.reload(); await wait(1500);
    R.sinInternetPortada = await p.evaluate(() => !!document.querySelector('.slice'));
    await p.evaluate(() => GAMEHUB.Launcher.open('tira-y-afloja'));
    await p.waitForSelector('#stage.ready', { timeout: 60000 });
    R.sinInternetJuego = true;
    await p.evaluate(() => GAMEHUB.Launcher.close());
    await ctx.setOffline(false);
    // 6) copia de seguridad: guarda todo, se borra, se restaura
    const copia = await p.evaluate(() => { const d = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^(tya|vto|srt|vtg|gamehub)_/.test(k)) d[k] = localStorage.getItem(k); } return JSON.stringify({ app: 'GameHub', v: 1, date: new Date().toISOString(), data: d }); });
    await p.evaluate(() => localStorage.removeItem('vtg_world'));
    await p.evaluate(() => { GAMEHUB.go('ajustes'); GAMEHUB.App.import(); });
    await p.fill('#bktxt', copia); await p.click('#bkgo'); await p.click('[data-myes]');
    await p.waitForLoadState('load'); await wait(2000);
    R.copiaRestaurada = await p.evaluate(() => localStorage.getItem('vtg_world') === JSON.stringify({ c1: 3 }));
    // 7) ajustes de la app
    await p.evaluate(() => GAMEHUB.go('ajustes')); await wait(500);
    await p.screenshot({ path: path.join(__dirname, 'shots', 'ajustes-app.png') });
  } catch (e) { R.error = e.message; } finally {
    fs.writeFileSync(verFile, ver0); fs.writeFileSync(swFile, sw0);
  }
  R.errores = errs.length ? errs : 'ninguno';
  console.log(JSON.stringify(R, null, 1));
  await b.close();
})();
