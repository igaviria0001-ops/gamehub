// Lo que ve el anfitrión lo ve el remoto: en cada modo en línea de los 4 juegos se compara lo que hay en la partida
// (objetos del modo: el tejo, espantos, altar, blancos, maletín, balón, trono, cajas…) en los dos aparatos, y se
// guardan capturas de los dos (OUT) para mirarlas. JUEGOS=… MODOS=juego:modo,…  VIEW=400x225 en máquinas sin GPU
const { chromium } = require('playwright');
const BASE = (process.env.URL || 'http://127.0.0.1:8765/') + '?net=bc#online', OUT = process.env.OUT || '/tmp/';
const ALL = { sortilegio: ['duel', 'altar', 'hunt', 'tejo'], ventolera: ['duel', 'targets', 'case', 'race', 'boss'], 'tira-y-afloja': ['caneca', 'chicles', 'rey', 'gol', 'escalada'], vertigo: ['quick', 'duel', 'elim', 'battle', 'gp'] };
const JUEGOS = (process.env.JUEGOS || Object.keys(ALL).join(',')).split(',');
const SOLO = process.env.MODOS ? new Set(process.env.MODOS.split(',')) : null;
// qué hay (lo que se dibuja y no depende de la cámara)
const CENSO = {
  sortilegio: `(() => { const G = Game.G, u = {}; for (const x of G.units) if (!x.isMage && x.alive !== false) { const k = x.obj || x.kind || '?'; u[k] = (u[k] || 0) + 1; }
    const t = G.units.find(x => x.obj === 'tejo'); return { estado: G.state, u, metas: (G.goals || []).length, altar: !!G.altar, tejo: t ? [Math.round(t.x), Math.round(t.y)] : null }; })()`,
  ventolera: `(() => { const G = Game.G; return { estado: G.state, blancos: (G.targets || []).filter(t => t.alive !== false && !t.dead).length, maletin: !!G.case, aros: (G.gates || []).length, jefe: G.boss ? G.boss.parts.filter(p => p.alive).length : 0, pilotos: G.birds.length }; })()`,
  'tira-y-afloja': `(() => { const G = Game.G, M = Modes.M; return { estado: G.state, balon: !!(M && M.ball), trono: !!(M && M.throne), chicles: (G.pellets || []).length, dorado: !!G.golden, jugadores: G.players.length }; })()`,
  vertigo: `(() => { const R = window.__vtg.R; return { estado: R.state, autos: R.cars.length, cajas: R.boxes.length, reglas: R.rules ? R.rules.id : null, corazones: R.cars.map(c => c.hearts == null ? null : c.hearts) }; })()`,
};
const IGNORA = { sortilegio: ['tejo'], ventolera: [], 'tira-y-afloja': ['chicles'], vertigo: [] }; // se comparan aparte (se mueven / cambian rápido)
const PLAY = { vertigo: '() => window.__vtg && window.__vtg.R && window.__vtg.R.state === "race"', ventolera: '() => Game.G.state === "play"', sortilegio: '() => Game.G.state === "play"', 'tira-y-afloja': '() => Game.G.state === "play"' };
const wait = ms => new Promise(r => setTimeout(r, ms));
async function uno(b, gid, mode) {
  const vw = process.env.VIEW ? process.env.VIEW.split('x').map(Number) : [960, 540];
  const ctx = await b.newContext({ viewport: { width: vw[0], height: vw[1] } }); const errs = [];
  await ctx.addInitScript(() => { try { localStorage.setItem('vtg_gq', '0'); } catch (e) {} window.__errs = []; addEventListener('error', e => window.__errs.push(String(e.message).slice(0, 160))); });
  const page = async () => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(BASE); await wait(700); return p; };
  const H = await page(), C = await page();
  await H.fill('[data-pname="0"]', 'Ana'); await H.click('#on-host'); await wait(400);
  const code = await H.evaluate(() => Net.code);
  await C.fill('[data-pname="0"]', 'Beto'); await C.fill('#on-code', code); await C.click('#on-join');
  for (let i = 0; i < 60; i++) { if (await H.evaluate(() => Net.room && Net.room.devices.length === 2 && Net.room.devices.every(d => d.host || d.open))) break; await wait(300); }
  await H.click(`[data-ong="${gid}"]`); await wait(300);
  const has = await H.$(`[data-onseg="mode"] [data-v="${mode}"]`); if (!has) { await ctx.close(); return { juego: gid, modo: mode, error: 'modo no está en la sala' }; }
  await H.click(`[data-onseg="mode"] [data-v="${mode}"]`); await wait(300);
  await H.click('#on-go');
  const frameOf = async p => { for (let i = 0; i < 200; i++) { const f = p.frames().find(x => x !== p.mainFrame() && x.url() !== 'about:blank'); if (f) { try { if (await f.evaluate(() => typeof NetPlay !== 'undefined' && NetPlay.on && !!NetPlay.cfg)) return f; } catch (e) {} } await wait(400); } return null; };
  const fh = await frameOf(H), fc = await frameOf(C);
  if (!fh || !fc) { await ctx.close(); return { juego: gid, modo: mode, error: 'no abrió', errores: errs.slice(0, 3) }; }
  for (let i = 0; i < 120; i++) { if (await fh.evaluate(`(${PLAY[gid]})()`).catch(() => false)) break; await wait(400); }
  await wait(mode === 'hunt' ? 7000 : 3500);
  let h = null, c = null, igual = false;
  const sig = o => JSON.stringify(Object.fromEntries(Object.entries(o).filter(([k]) => !IGNORA[gid].includes(k))));
  for (let i = 0; i < 10 && !igual; i++) { h = await fh.evaluate(CENSO[gid]); await wait(450); c = await fc.evaluate(CENSO[gid]); igual = sig(h) === sig(c); if (!igual) await wait(300); }
  // el tejo: en el remoto existe y está donde lo tiene el anfitrión (con margen: el remoto ve un poco atrás)
  let tejoOk = true; if (gid === 'sortilegio' && mode === 'tejo') tejoOk = !!(c && c.tejo && h && h.tejo && Math.hypot(c.tejo[0] - h.tejo[0], c.tejo[1] - h.tejo[1]) < 220);
  await H.screenshot({ path: `${OUT}ver-${gid}-${mode}-anfitrion.png` }); await C.screenshot({ path: `${OUT}ver-${gid}-${mode}-remoto.png` });
  const ge = [...await fh.evaluate(() => window.__errs.slice(0, 3)).catch(() => []), ...await fc.evaluate(() => window.__errs.slice(0, 3)).catch(() => [])];
  await ctx.close();
  return { juego: gid, modo: mode, anfitrion: h, remoto: c, igual: igual && tejoOk, errores: [...errs, ...ge].slice(0, 3) };
}
(async () => {
  const base = ['--disable-features=WebRtcHideLocalIpsWithMdns', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-background-timer-throttling'];
  const out = [];
  for (const g of JUEGOS) for (const m of ALL[g]) {
    if (SOLO && !SOLO.has(g + ':' + m)) continue;
    const b = await chromium.launch({ args: g === 'vertigo' ? base.concat(['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']) : base });
    const r = await uno(b, g, m); console.log(JSON.stringify(r)); out.push(r); await b.close();
  }
  const bad = out.filter(r => r.error || !r.igual || (r.errores && r.errores.length));
  console.log(bad.length ? 'IGUALES FALLA: ' + bad.map(r => r.juego + ':' + r.modo + (r.error ? ' (' + r.error + ')' : '')).join(', ') : 'IGUALES OK (' + out.length + ' modos)');
})();
