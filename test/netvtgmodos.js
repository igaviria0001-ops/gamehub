// VÉRTIGO en línea, todos los modos: mano a mano, eliminación, batalla y Gran Premio (MODOS=duel,elim,battle,gp).
// Por modo: anfitrión + remoto abren lo mismo (reglas, pista o arena, máquina o no, corazones), se fuerza el final en el
// anfitrión, los dos ven resultados, y «la siguiente para todos» avanza igual en los dos (ronda del duelo, pista del GP).
const { chromium } = require('playwright');
const URL = (process.env.URL || 'http://127.0.0.1:8765/') + '?net=bc#online', OUT = process.env.OUT || '/tmp/';
const MODOS = (process.env.MODOS || 'duel,elim,battle,gp').split(',');
const wait = ms => new Promise(r => setTimeout(r, ms));
async function uno(b, mode) {
  const ctx = await b.newContext({ viewport: (process.env.VIEW ? { width: +process.env.VIEW.split('x')[0], height: +process.env.VIEW.split('x')[1] } : { width: 960, height: 540 }) }); const errs = [];
  await ctx.addInitScript(() => { try { localStorage.setItem('vtg_gq', '0'); } catch (e) {} window.__errs = []; addEventListener('error', e => window.__errs.push(String(e.message).slice(0, 200))); });
  const page = async () => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(URL); await wait(700); return p; };
  const H = await page(), C = await page();
  await H.fill('[data-pname="0"]', 'Ana'); await H.click('#on-host'); await wait(400);
  const code = await H.evaluate(() => Net.code);
  await C.fill('[data-pname="0"]', 'Beto'); await C.fill('#on-code', code); await C.click('#on-join');
  for (let i = 0; i < 60; i++) { if (await H.evaluate(() => Net.room && Net.room.devices.length === 2 && Net.room.devices.every(d => d.host || d.open))) break; await wait(300); }
  await H.click('[data-ong="vertigo"]'); await wait(300); await H.click(`[data-onseg="mode"] [data-v="${mode}"]`); await wait(300);
  const opts = await H.evaluate(() => [...document.querySelectorAll('[data-onseg="map"] button')].map(x => x.dataset.v));
  if (mode === 'gp') await H.click('[data-onseg="map"] [data-v="0"]'); else if (mode === 'battle') await H.click('[data-onseg="map"] [data-v="coliseo"]'); else await H.click('[data-onseg="map"] [data-v="tokio"]');
  await wait(600); const sees = await C.evaluate(() => { const e = document.querySelector('.on-next'); return e ? e.innerText.replace(/\s+/g, ' ') : ''; });
  await H.screenshot({ path: `${OUT}vtgmodo-${mode}-sala.png` }); await H.click('#on-go');
  const frameOf = async p => { for (let i = 0; i < 160; i++) { const f = p.frames().find(x => x !== p.mainFrame() && x.url() !== 'about:blank'); if (f) { try { if (await f.evaluate(() => typeof Game !== 'undefined' && Game.R && Game.mode === 'race' && NetPlay.on && !!NetPlay.cfg)) return f; } catch (e) {} } await wait(500); } return null; };
  const fh = await frameOf(H), fc = await frameOf(C);
  if (!fh || !fc) { await ctx.close(); return { modo: mode, error: 'no abrió', abre: [!!fh, !!fc], errores: errs.slice(0, 3) }; }
  const look = f => f.evaluate(() => ({ track: Game.R.track.def.id, rules: Game.R.rules ? Game.R.rules.id : null, cars: Game.R.cars.length, bots: Game.R.cars.filter(c => c.bot).length, hearts: Game.R.cars.map(c => c.hearts == null ? null : c.hearts), gp: Game.gp ? { i: Game.gp.i, n: Game.gp.list.length, cup: Game.gp.cup } : null, duel: Game.duel ? { r: Game.duel.r, w: Game.duel.w.slice() } : null }));
  for (let i = 0; i < 120; i++) { if (await fh.evaluate(() => Game.R.state === 'race' && Game.R.time > 1)) break; await wait(500); }
  await wait(1500);
  const lh = await look(fh), lc = await look(fc);
  // final forzado en el anfitrión: gana el puesto 0 (el anfitrión)
  await fh.evaluate(m => { const R = Game.R;
    if (m === 'elim' || m === 'battle') { for (const c of R.cars) if (c.idx !== 0 && !c.out) knockOut(R, c); }
    else { R.cars.forEach((c, i) => { if (!c.finished) { c.finished = true; c.finishT = R.time + i; c.lap = R.laps; } }); }
  }, mode);
  const res = async f => f.evaluate(() => !document.getElementById('s-results').hidden && { title: document.getElementById('resTitle').textContent, main: document.getElementById('resMain').hidden ? null : document.getElementById('resMain').textContent, th: (document.querySelector('#resTable th') || {}).textContent || '' });
  let rh = null, rc = null; for (let i = 0; i < 60 && !(rh && rc); i++) { await wait(500); rh = await res(fh); rc = await res(fc); }
  await H.screenshot({ path: `${OUT}vtgmodo-${mode}-res.png` }); await C.screenshot({ path: `${OUT}vtgmodo-${mode}-res-remoto.png` });
  // la siguiente para todos
  let next = null;
  if (rh && rh.main) { await fh.evaluate(() => document.getElementById('resMain').click()); for (let i = 0; i < 80; i++) { await wait(500); const a = await look(fh).catch(() => null), c = await look(fc).catch(() => null); const ok = await fc.evaluate(() => document.getElementById('s-results').hidden && Game.mode === 'race').catch(() => false); if (ok && a && c) { next = { h: a, c }; if (a.track === c.track) break; } } }
  const ge = [...await fh.evaluate(() => window.__errs.slice(0, 3)).catch(() => []), ...await fc.evaluate(() => window.__errs.slice(0, 3)).catch(() => [])];
  await ctx.close();
  const same = JSON.stringify([lh.track, lh.rules, lh.cars, lh.bots, lh.hearts, lh.gp, lh.duel]) === JSON.stringify([lc.track, lc.rules, lc.cars, lc.bots, lc.hearts, lc.gp, lc.duel]);
  const want = { duel: lh.bots === 0 && lh.duel && lh.duel.w.length === 2, elim: lh.rules === 'elim' && lh.cars === 6, battle: lh.rules === 'battle' && lh.track === 'coliseo' && lh.hearts.every(x => x === 3), gp: lh.gp && lh.gp.i === 0 && lh.gp.n === 5 }[mode];
  const adv = !next ? false : mode === 'gp' ? next.h.gp.i === 1 && next.c.gp.i === 1 && next.h.track === next.c.track : mode === 'duel' ? next.h.duel.r === 1 && next.c.duel.r === 1 && next.h.duel.w[0] === 1 && next.c.duel.w[0] === 1 : next.h.track === next.c.track;
  return { modo: mode, sala: sees, mapas: opts.slice(0, 4), anfitrion: lh, remotoIgual: same, reglasOk: !!want, resultados: { h: rh, c: rc }, siguiente: next ? { h: next.h.gp || next.h.duel || next.h.track, c: next.c.gp || next.c.duel || next.c.track } : null, avanzaIgual: adv, errores: [...errs, ...ge].slice(0, 3) };
}
(async () => {
  const b = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const out = []; for (const m of MODOS) { const r = await uno(b, m); console.log(JSON.stringify(r)); out.push(r); }
  await b.close();
  const bad = out.filter(r => r.error || !r.remotoIgual || !r.reglasOk || !r.resultados.h || !r.resultados.c || !r.avanzaIgual || r.errores.length);
  console.log(bad.length ? 'MODOS VTG FALLA: ' + bad.map(r => r.modo).join(',') : 'MODOS VTG OK');
})();
