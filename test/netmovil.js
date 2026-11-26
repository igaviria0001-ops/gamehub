// Fluidez con datos móviles (red simulada en los dos aparatos): cuánto «se traba» lo que ve el remoto.
//   PERFIL=mob    datos móviles: 60 ms de ida, vaivén 25 ms, 3 % de pérdida y rachas de congestión (+150–500 ms)
//   PERFIL=relay  lo mismo pero por el relevo (sin WebRTC: lo que pasa si la conexión directa no se puede)
//   PERFIL=corte  datos móviles + un corte (CUT ms, 6000 por defecto; CORTE=directo: se cae lo directo pero internet sigue,
//                 CORTE=todo: sin red) a mitad de partida (cambio de antena, túnel…): ¿vuelve a la conexión directa?
// Medidas del remoto (NetPlay.stats): % de cuadros con «hambre» (el momento a dibujar ya pasó la última instantánea: se
// congela), rachas de hambre y la más larga, saltos del reloj de dibujo hacia atrás, instantáneas desordenadas/perdidas,
// colchón (ms) y tamaño de instantánea (anfitrión). JUEGOS=… SECS=20 VIEW=400x225 (VÉRTIGO en máquinas sin GPU)
const { chromium } = require('playwright');
const BASE = process.env.URL || 'http://127.0.0.1:8765/';
const PERFIL = process.env.PERFIL || 'mob', SECS = +process.env.SECS || 20, CUT = +process.env.CUT || 6000; // CUT: ms del corte
const Q = ({ mob: 'netmob=1', relay: 'netmob=1&netforce=relay', corte: 'netmob=1', lento: 'netmob=1&netdlag=200' }[PERFIL] || PERFIL) + (process.env.SRV ? '&server=' + process.env.SRV : ''); // SRV=http://127.0.0.1:8799: con el servidor propio · PERFIL=lento: lo directo 200 ms más lento
const JUEGOS = (process.env.JUEGOS || 'sortilegio,ventolera,tira-y-afloja,vertigo').split(',');
const KEYS = { vertigo: ['KeyA', 'KeyD'], ventolera: ['KeyW', 'KeyS'], sortilegio: ['KeyD', 'KeyA', 'KeyW', 'KeyS'], 'tira-y-afloja': ['KeyD', 'KeyA'] };
const PLAY = { vertigo: '() => window.__vtg && window.__vtg.R && window.__vtg.R.state === "race"', ventolera: '() => Game.G.state === "play"', sortilegio: '() => Game.G.state === "play"', 'tira-y-afloja': '() => Game.G.state === "play"' };
const wait = ms => new Promise(r => setTimeout(r, ms));
async function uno(b, gid) {
  const vw = process.env.VIEW ? process.env.VIEW.split('x').map(Number) : [960, 540];
  const ctx = await b.newContext({ viewport: { width: vw[0], height: vw[1] } }); const errs = [];
  await ctx.addInitScript(() => { try { localStorage.setItem('vtg_gq', '0'); } catch (e) {} window.__errs = []; if (!window.__autoPick) window.__autoPick = setInterval(() => { try { document.querySelectorAll("#netWait .pf button:not(.no)").forEach(b => b.click()); } catch (e) {} }, 700); addEventListener('error', e => window.__errs.push(String(e.message).slice(0, 160))); });
  const page = async () => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(BASE + '?net=bc&' + Q + '#online'); await wait(700); return p; };
  const H = await page(), C = await page();
  await H.fill('[data-pname="0"]', 'Ana'); await H.click('#on-host'); await wait(400);
  const code = await H.evaluate(() => Net.code);
  await C.fill('[data-pname="0"]', 'Beto'); await C.fill('#on-code', code); await C.click('#on-join');
  for (let i = 0; i < 80; i++) { if (await H.evaluate(() => Net.room && Net.room.devices.length === 2 && Net.room.devices.every(d => d.host || d.open))) break; await wait(300); }
  await H.click(`[data-ong="${gid}"]`); await wait(300);
  // siempre el mismo escenario (el primero de la lista), para comparar antes y después
  if (await H.$('[data-onmap]:not([data-onmap=""])')) { await H.click('[data-onmap]:not([data-onmap=""])'); await wait(300); }
  await H.click('#on-go');
  const frameOf = async p => { for (let i = 0; i < 200; i++) { const f = p.frames().find(x => x !== p.mainFrame() && x.url() !== 'about:blank'); if (f) { try { if (await f.evaluate(() => typeof NetPlay !== 'undefined' && NetPlay.on && !!NetPlay.cfg)) return f; } catch (e) {} } await wait(400); } return null; };
  const fh = await frameOf(H), fc = await frameOf(C);
  if (!fh || !fc) { await ctx.close(); return { juego: gid, error: 'no abrió', errores: errs.slice(0, 3) }; }
  for (let i = 0; i < 120; i++) { if (await fh.evaluate(`(${PLAY[gid]})()`).catch(() => false)) break; await wait(400); }
  await wait(1500);
  await C.bringToFront(); await wait(300);
  await fc.evaluate(() => NetPlay.statsReset()); await fh.evaluate(() => NetPlay.statsReset());
  const fps0 = await Promise.all([fh, fc].map(f => f.evaluate(() => new Promise(r => { let n = 0; const t = performance.now(); const go = () => { n++; if (performance.now() - t < 1000) requestAnimationFrame(go); else r(n); }; requestAnimationFrame(go); }))));
  const t0 = Date.now(); let k = 0, cut = false; const ks = KEYS[gid];
  while (Date.now() - t0 < SECS * 1000) {
    if (PERFIL === 'corte' && !cut && Date.now() - t0 > SECS * 300) { cut = true; await Promise.all([H, C].map(P => P.evaluate(([ms, k]) => Net.simCut(ms, k), [CUT, process.env.CORTE || 'directo']))); }
    const kk = ks[k++ % ks.length]; await C.keyboard.down(kk); await H.keyboard.down(kk); await wait(450); await C.keyboard.up(kk); await H.keyboard.up(kk); await wait(150);
  }
  // en el corte: se mira si volvió a la conexión directa (unos segundos después)
  if (PERFIL === 'corte') await wait(6000);
  const st = await fc.evaluate(() => NetPlay.stats), sh = await fh.evaluate(() => NetPlay.stats);
  const via = await C.evaluate(() => { const h = Net.peers.get(Net.hostId); return h ? { via: h.via, rtt: Math.round(h.rtt), prefiere: h.preferRelay ? 'servidor' : undefined, directo: h.drtt ? Math.round(h.drtt) : undefined, porServidor: h.rrtt ? Math.round(h.rrtt) : undefined, estado: h.pc ? h.pc.connectionState : 'sin' } : null; });
  const viaH = await H.evaluate(() => [...Net.peers.values()].map(p => p.via));
  const ge = [...await fh.evaluate(() => window.__errs.slice(0, 3)).catch(() => []), ...await fc.evaluate(() => window.__errs.slice(0, 3)).catch(() => [])];
  await ctx.close();
  return { juego: gid, perfil: PERFIL, fps: fps0, hambre: +(100 * st.hungry / Math.max(1, st.fr)).toFixed(1) + ' %', rachas: st.hEp, rachaMax: Math.round(st.hMax) + ' ms', atras: st.back, cuadros: st.fr,
    inst: { llegaron: st.rx, desordenadas: st.ooo, perdidas: st.miss }, colchon: st.lag + ' ms', vaiven: st.jit + ' ms', tamano: { prom: sh.sz, max: sh.szMax },
    ruta: via, rutaAnfitrion: viaH, errores: [...errs, ...ge].slice(0, 3) };
}
(async () => {
  // las dos páginas tienen que dibujar a ritmo normal (si no, la de atrás casi no dibuja y la medida no dice nada)
  // (el dibujo 3D por software solo para VÉRTIGO: a los juegos 2D los vuelve muy lentos en una máquina sin GPU)
  const base = ['--disable-features=WebRtcHideLocalIpsWithMdns', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-background-timer-throttling'];
  const out = []; for (const g of JUEGOS) { const b = await chromium.launch({ args: g === 'vertigo' ? base.concat(['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']) : base }); const r = await uno(b, g); console.log(JSON.stringify(r)); out.push(r); await b.close(); }
  const bad = out.filter(r => r.error || r.errores.length || (PERFIL === 'corte' && r.ruta && r.ruta.via === 'relay'));
  console.log(bad.length ? 'MÓVIL FALLA: ' + bad.map(r => r.juego + (r.error ? ' ' + r.error : r.errores.length ? ' errores' : ' quedó en relevo')).join(', ') : 'MÓVIL OK');
})();
