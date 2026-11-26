// Datos por minuto de cada juego en línea (anfitrión + remoto, 1 contra 1), y prueba con red mala.
// JUEGOS=ventolera,sortilegio (por defecto los 4) · RED='netloss=0.1&netlag=80' para simular pérdida y retraso
// · RELEVO=1 para jugar sin WebRTC (todo por el relevo de señales).
const { chromium } = require('playwright');
const BASE = process.env.URL || 'http://127.0.0.1:8765/', SECS = +(process.env.SECS || 12);
const RED = process.env.RED || '', RELEVO = !!process.env.RELEVO;
const JUEGOS = (process.env.JUEGOS || 'tira-y-afloja,ventolera,sortilegio,vertigo').split(',');
const wait = ms => new Promise(r => setTimeout(r, ms));
async function uno(b, gid) {
  const q = ['net=bc', RED, RELEVO ? 'netforce=relay' : ''].filter(Boolean).join('&');
  const ctx = await b.newContext({ viewport: { width: 900, height: 520 } }); const errs = [];
  await ctx.addInitScript(() => { try { localStorage.setItem('vtg_gq', '0'); } catch (e) {} window.__errs = []; if (!window.__autoPick) window.__autoPick = setInterval(() => { try { document.querySelectorAll("#netWait .pf button:not(.no)").forEach(b => b.click()); } catch (e) {} }, 700); addEventListener('error', e => window.__errs.push(String(e.message).slice(0, 160))); });
  const page = async () => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(BASE + '?' + q + '#online'); await wait(700); return p; };
  const H = await page(), C = await page();
  await H.fill('[data-pname="0"]', 'Ana'); await H.click('#on-host'); await wait(400);
  const code = await H.evaluate(() => Net.code);
  await C.fill('[data-pname="0"]', 'Beto'); await C.fill('#on-code', code); await C.click('#on-join');
  for (let i = 0; i < 60; i++) { if (await H.evaluate(() => Net.room && Net.room.devices.length === 2 && Net.room.devices.every(d => d.host || d.open))) break; await wait(300); }
  const via = await C.evaluate(() => { const p = Net.peers.get(Net.hostId); return p && p.via; });
  await H.click(`[data-ong="${gid}"]`); await wait(300); await H.click('#on-go');
  const frameOf = async p => { for (let i = 0; i < 160; i++) { const f = p.frames().find(x => x !== p.mainFrame() && x.url() !== 'about:blank'); if (f) { try { if (await f.evaluate(() => typeof NetPlay !== 'undefined' && NetPlay.on && !!NetPlay.cfg && (NetPlay.isHost || !!NetPlay.sample()))) return f; } catch (e) {} } await wait(500); } return null; };
  const fh = await frameOf(H), fc = await frameOf(C);
  if (!fh || !fc) { console.log(gid, ': no abrió', !!fh, !!fc, errs.slice(0, 3)); await ctx.close(); return null; }
  await wait(4000);
  await H.evaluate(() => Net.resetStats()); await C.evaluate(() => Net.resetStats());
  // el remoto se mueve todo el rato (teclas de J1 de cada juego)
  await C.bringToFront(); const keys = ['KeyD', 'KeyW', 'KeyA', 'KeyS'];
  const t0 = Date.now(); let k = 0; while (Date.now() - t0 < SECS * 1000) { const key = keys[k++ % 4]; await C.keyboard.down(key); await wait(700); await C.keyboard.up(key); }
  const sh = await H.evaluate(() => Net.stats), sc = await C.evaluate(() => Net.stats);
  const ferr = async f => f.evaluate(() => window.__errs.slice(0, 3)).catch(() => []);
  const ge = [...await ferr(fh), ...await ferr(fc)];
  const r = { juego: gid, via, bajada_KBs: +(sh.out / sh.secs / 1024).toFixed(1), subida_KBs: +(sc.out / sc.secs / 1024).toFixed(2), MB_por_minuto_remoto: +((sh.out + sc.out) / sh.secs * 60 / 1048576).toFixed(2), mensajes_s: Math.round(sh.nOut / sh.secs), errores: [...errs, ...ge].slice(0, 3) };
  await ctx.close(); return r;
}
(async () => {
  const b = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const out = [];
  for (const g of JUEGOS) { const r = await uno(b, g); console.log(JSON.stringify(r)); if (r) out.push(r); }
  await b.close();
  const bad = out.filter(r => r.errores.length || !r.bajada_KBs);
  console.log(out.length === JUEGOS.length && !bad.length ? 'DATOS OK' : 'DATOS FALLA');
})();
