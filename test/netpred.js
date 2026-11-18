// Tu personaje responde YA en el aparato remoto (predicción): con red simulada mala (RED, por defecto 70 ms de ida y
// 70 de vuelta + 3 % de pérdida), cuánto tarda en verse la reacción a una tecla en el remoto, con predicción y sin ella
// (?nopred), y cuánto se separa lo predicho de lo que dice el anfitrión (error promedio y correcciones grandes).
// JUEGOS=vertigo,ventolera,sortilegio,tira-y-afloja (por defecto los 4) · SIN=1 mide también sin predicción
const { chromium } = require('playwright');
const BASE = process.env.URL || 'http://127.0.0.1:8765/', RED = process.env.RED || 'netlag=70&netloss=0.03';
const JUEGOS = (process.env.JUEGOS || 'vertigo,ventolera,sortilegio,tira-y-afloja').split(','), SIN = !!process.env.SIN;
const wait = ms => new Promise(r => setTimeout(r, ms));
// por juego: tecla, qué mirar del personaje propio, cuándo cuenta como «ya reaccionó», y la vara del error aceptable
const D = {
  vertigo: { key: 'KeyA', get: 's => { const c = window.__vtg.R.cars[s]; return { v: c.steerS, x: c.s, y: c.u }; }', resp: '(b, n) => Math.abs(n.v - b.v) > 0.15', play: '() => window.__vtg.R && window.__vtg.R.state === "race"', unit: 'm', maxErr: 2.5 },
  ventolera: { key: 'KeyW', get: 's => { const b = Game.G.birds[s]; return { v: b.a, x: b.x, y: b.y }; }', resp: '(b, n) => Math.abs(Math.atan2(Math.sin(n.v - b.v), Math.cos(n.v - b.v))) > 0.12', play: '() => Game.G.state === "play"', unit: 'px', maxErr: 40 },
  sortilegio: { key: 'KeyD', get: 's => { const m = Game.G.mages[s]; return { v: m.vx || 0, x: m.x, y: m.y }; }', resp: '(b, n) => n.v - b.v > 60', play: '() => Game.G.state === "play"', unit: 'px', maxErr: 25 },
  'tira-y-afloja': { key: 'KeyD', get: 's => { const p = Game.G.players[s]; return { v: p.vx || 0, x: p.x, y: p.y }; }', resp: '(b, n) => n.v - b.v > 60', play: '() => Game.G.state === "play" && Game.G.canControl', unit: 'px', maxErr: 40 },
};
async function uno(b, gid, pred) {
  const d = D[gid], q = ['net=bc', RED, pred ? '' : 'nopred'].filter(Boolean).join('&');
  const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }); const errs = [];
  await ctx.addInitScript(() => { try { localStorage.setItem('vtg_gq', '0'); } catch (e) {} window.__errs = []; addEventListener('error', e => window.__errs.push(String(e.message).slice(0, 160))); });
  const page = async () => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(BASE + '?' + q + '#online'); await wait(700); return p; };
  const H = await page(), C = await page();
  await H.fill('[data-pname="0"]', 'Ana'); await H.click('#on-host'); await wait(400);
  const code = await H.evaluate(() => Net.code);
  await C.fill('[data-pname="0"]', 'Beto'); await C.fill('#on-code', code); await C.click('#on-join');
  for (let i = 0; i < 60; i++) { if (await H.evaluate(() => Net.room && Net.room.devices.length === 2 && Net.room.devices.every(x => x.host || x.open))) break; await wait(300); }
  await H.click(`[data-ong="${gid}"]`); await wait(300); await H.click('#on-go');
  const frameOf = async p => { for (let i = 0; i < 160; i++) { const f = p.frames().find(x => x !== p.mainFrame() && x.url() !== 'about:blank'); if (f) { try { if (await f.evaluate(() => typeof NetPlay !== 'undefined' && NetPlay.on && !!NetPlay.cfg)) return f; } catch (e) {} } await wait(400); } return null; };
  const fh = await frameOf(H), fc = await frameOf(C);
  if (!fh || !fc) { await ctx.close(); return { juego: gid, error: 'no abrió' }; }
  for (let i = 0; i < 80; i++) { if (await fh.evaluate(`(${d.play})()`)) break; await wait(400); }
  await wait(2500); await C.bringToFront();
  const seat = await fc.evaluate(() => NetPlay.mine[0]);
  // 5 toques: cuánto tarda en verse la reacción en el remoto
  const lat = [];
  for (let k = 0; k < 5; k++) {
    await fc.evaluate(`(() => { const get = ${d.get}, resp = ${d.resp}; const s = ${seat}; window.__m = { t0: performance.now(), b: get(s), hit: null }; const tick = () => { if (window.__m.hit != null) return; const n = get(s); if (resp(window.__m.b, n)) window.__m.hit = performance.now() - window.__m.t0; else if (performance.now() - window.__m.t0 < 1500) requestAnimationFrame(tick); }; requestAnimationFrame(tick); })()`);
    await C.keyboard.down(d.key); await wait(700); await C.keyboard.up(d.key);
    const h = await fc.evaluate(() => window.__m.hit); if (h != null) lat.push(Math.round(h)); await wait(900);
  }
  // 6 s moviéndose: error entre lo predicho y lo que dice el anfitrión
  const keys = ['KeyD', 'KeyW', 'KeyA', 'KeyS']; const t0 = Date.now(); let i = 0;
  while (Date.now() - t0 < 6000) { const k = keys[i++ % 4]; await C.keyboard.down(k); await wait(500); await C.keyboard.up(k); }
  const pst = pred ? await fc.evaluate(() => NetGame.pst ? Object.assign({}, NetGame.pst) : null) : null;
  const ge = [...await fh.evaluate(() => window.__errs.slice(0, 3)).catch(() => []), ...await fc.evaluate(() => window.__errs.slice(0, 3)).catch(() => [])];
  await ctx.close();
  lat.sort((a, b) => a - b);
  return { juego: gid, prediccion: pred, reaccion_ms: lat.length ? lat[Math.floor(lat.length / 2)] : null, toques: lat, error: pst ? +pst.err.toFixed(2) + ' ' + d.unit : null, correcciones: pst ? { suaves: pst.soft, grandes: pst.hard } : null, maxErr: d.maxErr, errores: [...errs, ...ge].slice(0, 3) };
}
(async () => {
  const b = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const out = [];
  for (const g of JUEGOS) { for (const pred of SIN ? [false, true] : [true]) { const r = await uno(b, g, pred); console.log(JSON.stringify(r)); out.push(r); } }
  await b.close();
  const bad = out.filter(r => r.prediccion && (r.errores.length || r.reaccion_ms == null || r.reaccion_ms > 80 || parseFloat(r.error) > r.maxErr || (r.correcciones && r.correcciones.grandes > Math.max(3, r.correcciones.suaves * 0.08))));
  console.log(bad.length ? 'PREDICCIÓN FALLA' : 'PREDICCIÓN OK');
})();
