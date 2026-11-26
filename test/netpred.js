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
  vertigo: { key: 'KeyA', key2: 'KeyD', get: 's => { const c = window.__vtg.R.cars[s]; return { v: c.steerS, x: c.s, y: c.u }; }', resp: '(b, n) => Math.abs(n.v - b.v) > 0.15', play: '() => window.__vtg.R && window.__vtg.R.state === "race"', unit: 'm', maxErr: 4 },
  ventolera: { key: 'KeyW', key2: 'KeyS', get: 's => { const b = Game.G.birds[s]; return { v: b.a, x: b.x, y: b.y }; }', resp: '(b, n) => Math.abs(Math.atan2(Math.sin(n.v - b.v), Math.cos(n.v - b.v))) > 0.12', play: '() => Game.G.state === "play"', unit: 'px', maxErr: 40 },
  sortilegio: { key: 'KeyD', key2: 'KeyA', get: 's => { const m = Game.G.mages[s]; return { v: m.vx || 0, x: m.x, y: m.y }; }', resp: '(b, n) => Math.abs(n.v - b.v) > 60', play: '() => Game.G.state === "play"', unit: 'px', maxErr: 25 },
  'tira-y-afloja': { key: 'KeyD', key2: 'KeyA', get: 's => { const p = Game.G.players[s]; return { v: p.vx || 0, x: p.x, y: p.y }; }', resp: '(b, n) => Math.abs(n.v - b.v) > 60', play: '() => Game.G.state === "play" && Game.G.canControl', unit: 'px', maxErr: 40 },
};
async function uno(b, gid, pred) {
  const d = D[gid], q = ['net=bc', RED, pred ? '' : 'nopred'].filter(Boolean).join('&');
  const ctx = await b.newContext({ viewport: (process.env.VIEW ? { width: +process.env.VIEW.split('x')[0], height: +process.env.VIEW.split('x')[1] } : { width: 960, height: 540 }) }); const errs = [];
  await ctx.addInitScript(() => { try { localStorage.setItem('vtg_gq', '0'); } catch (e) {} window.__errs = []; if (!window.__autoPick) window.__autoPick = setInterval(() => { try { document.querySelectorAll("#netWait .pf button:not(.no)").forEach(b => b.click()); } catch (e) {} }, 700); addEventListener('error', e => window.__errs.push(String(e.message).slice(0, 160))); });
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
  const lat = [], frs = [];
  for (let k = 0; k < 6; k++) {
    // se mide desde que el juego RECIBE la tecla (no desde que la prueba la manda) y en cuadros dibujados
    await fc.evaluate(`(() => { const get = ${d.get}, resp = ${d.resp}; const s = ${seat}; window.__m = { tk: 0, b: get(s), hit: null, fr: null, n: 0, mx: 0 };
      addEventListener('keydown', () => { if (!window.__m.tk) { window.__m.tk = performance.now(); window.__m.b = get(s); } }, { capture: true, once: true });
      const tick = () => { const M = window.__m; if (M.hit != null) return; if (M.tk) { M.n++; const n = get(s); M.mx = Math.max(M.mx, Math.abs(n.v - M.b.v)); if (resp(M.b, n)) { M.hit = performance.now() - M.tk; M.fr = M.n; return; } if (performance.now() - M.tk > 1500) return; } requestAnimationFrame(tick); }; requestAnimationFrame(tick); })()`);
    const kk = k % 2 ? d.key2 : d.key; await C.keyboard.down(kk); await wait(450); await C.keyboard.up(kk);
    const h = await fc.evaluate(() => window.__m.hit), fr = await fc.evaluate(() => window.__m.fr); if (h != null) { lat.push(Math.round(h)); frs.push(fr); } if (process.env.DBG) console.log('toque', k, JSON.stringify(await fc.evaluate(() => [window.__m.b, window.__m.mx, document.activeElement && document.activeElement.tagName, window.__m.n, window.__m.tk > 0]))); await wait(900);
  }
  // 6 s moviéndose: error entre lo predicho y lo que dice el anfitrión
  const keys = ['KeyD', 'KeyW', 'KeyA', 'KeyS']; const t0 = Date.now(); let i = 0;
  while (Date.now() - t0 < 6000) { const k = keys[i++ % 4]; await C.keyboard.down(k); await wait(500); await C.keyboard.up(k); }
  const pst = pred ? await fc.evaluate(() => NetGame.pst ? Object.assign({}, NetGame.pst) : null) : null; if (process.env.DBG) console.log("pst", JSON.stringify(pst));
  const ge = [...await fh.evaluate(() => window.__errs.slice(0, 3)).catch(() => []), ...await fc.evaluate(() => window.__errs.slice(0, 3)).catch(() => [])];
  await ctx.close();
  lat.sort((a, b) => a - b);
  frs.sort((a, b) => a - b); const lento = pst && pst.fdt > 60 ? pst.fdt : 0;
  return { juego: gid, lento, prediccion: pred, reaccion_cuadros: frs.length ? frs[Math.floor(frs.length / 2)] : null, reaccion_ms: lat.length ? lat[Math.floor(lat.length / 2)] : null, toques: lat, cuadros: frs, error: pst ? +pst.err.toFixed(2) + ' ' + d.unit : null, correcciones: pst ? { suaves: pst.soft, grandes: pst.hard } : null, maxErr: d.maxErr, errores: [...errs, ...ge].slice(0, 3) };
}
(async () => {
  const b = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const out = [];
  for (const g of JUEGOS) { for (const pred of SIN ? [false, true] : [true]) { const r = await uno(b, g, pred); console.log(JSON.stringify(r)); out.push(r); } }
  await b.close();
  // VÉRTIGO es 3D: en una máquina sin GPU (cuadros de 100 ms o más, ping de segundos por la carga) la medida no dice nada
  for (const r of out) if (r.lento) console.log(r.juego + ': máquina demasiado lenta para medir (cuadros de ' + r.lento + ' ms); no se juzga');
  const bad = out.filter(r => r.prediccion && !r.lento && (r.errores.length || r.reaccion_cuadros == null || r.reaccion_cuadros > 3 || r.toques.length < 4 || parseFloat(r.error) > r.maxErr || (r.correcciones && r.correcciones.grandes > Math.max(3, r.correcciones.suaves * 0.08))));
  console.log(bad.length ? 'PREDICCIÓN FALLA' : 'PREDICCIÓN OK');
})();
