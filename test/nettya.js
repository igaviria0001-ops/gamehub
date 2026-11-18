// Tira y Afloja en línea: anfitrión + remoto (sala por BroadcastChannel, WebRTC real).
// Con TRES=1 entra un tercer aparato que solo MIRA (el hilo es de a dos).
// Comprueba: los dos abren la partida, el remoto ve lo mismo, su tecla mueve SU pájaro en el anfitrión,
// llegan los eventos, tamaño de las instantáneas, fin → resultados en los dos → revancha para todos.
const { chromium } = require('playwright');
const URL = (process.env.URL || 'http://127.0.0.1:8765/') + '?net=bc' + (process.env.RED ? '&' + process.env.RED : '') + '#online', OUT = process.env.OUT || '/tmp/', TRES = !!process.env.TRES, MODE = process.env.MODE || 'caneca';
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }); const errs = [];
  await ctx.addInitScript(() => { window.__errs = []; addEventListener('error', e => window.__errs.push(String(e.message).slice(0, 200))); });
  const page = async () => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('c:' + m.text().slice(0, 160)); }); await p.goto(URL); await wait(800); return p; };
  const H = await page(), C = await page(), V = TRES ? await page() : null;
  await H.fill('[data-pname="0"]', 'Ignacio');
  await H.click('#on-host'); await wait(500);
  const code = await H.evaluate(() => Net.code);
  await C.fill('[data-pname="0"]', 'Remoto'); await C.fill('#on-code', code); await C.click('#on-join');
  if (V) { await V.fill('[data-pname="0"]', 'Mirón'); await V.fill('#on-code', code); await V.click('#on-join'); }
  for (let i = 0; i < 40; i++) { const ok = await H.evaluate(n => Net.room && Net.room.devices.length === n && Net.room.devices.every(d => d.host || d.open), V ? 3 : 2); if (ok) break; await wait(300); }
  await H.click('[data-ong="tira-y-afloja"]'); await wait(300);
  await H.click(`[data-onseg="mode"] [data-v="${MODE}"]`); await wait(150);
  await H.click('[data-onseg="map"] [data-v="pupitre"]'); await wait(150);
  if (MODE === 'caneca') await H.click('[data-onseg="len"] [data-v="2"]');
  await wait(600); await H.screenshot({ path: OUT + 'nettya-sala.png' });
  await H.click('#on-go');
  const frameOf = async p => { for (let i = 0; i < 120; i++) { const f = p.frames().find(x => x !== p.mainFrame() && x.url() !== 'about:blank'); if (f) { try { if (await f.evaluate(() => typeof Game !== 'undefined' && Game.G.net && ['countdown', 'play'].includes(Game.G.state))) return f; } catch (e) {} } await wait(500); } return null; };
  const fh = await frameOf(H), fc = await frameOf(C), fv = V ? await frameOf(V) : null;
  console.log('partida abierta: anfitrión', !!fh, '· remoto', !!fc, V ? '· mirón ' + !!fv : '');
  if (!fh || !fc) { const f = C.frames().find(x => x !== C.mainFrame()); if (f) console.log('remoto:', JSON.stringify(await f.evaluate(() => ({ on: NetPlay.on, st: Game.G.state, net: Game.G.net, errs: window.__errs })).catch(e => String(e)))); console.log(errs.slice(0, 5)); await b.close(); process.exit(1); }
  for (let i = 0; i < 60; i++) { if (await fh.evaluate(() => Game.G.state === 'play')) break; await wait(500); }
  await wait(1500);
  const n = await fh.evaluate(() => Game.G.players.length), remSeat = await fc.evaluate(() => NetPlay.mine[0]);
  const pos = async f => f.evaluate(s => { const b = Game.G.players[s]; return [Math.round(b.x), Math.round(b.y), Math.round(b.mass * 100) / 100]; }, remSeat);
  const before = { h: await pos(fh), c: await pos(fc) };
  // el remoto camina a la derecha (D) 1,2 s, salta (W) y tira del hilo (E) 0,6 s
  await C.bringToFront(); await C.keyboard.down('KeyD'); await wait(1200); await C.keyboard.press('KeyW'); await C.keyboard.up('KeyD'); await C.keyboard.down('KeyE'); await wait(600); await C.keyboard.up('KeyE');
  const after = { h: await pos(fh), c: await pos(fc) };
  const shots = await fh.evaluate(s => Game.G.players[s].mass, remSeat) > 3.01 ? 1 : 0;
  const size = await fh.evaluate(() => JSON.stringify(NetGame.snap()).length);
  const watch = fv ? await fv.evaluate(() => [Math.round(Game.G.players[1].x), Game.G.state, NetPlay.mine.length]) : null;
  const fx = await fc.evaluate(() => 'hilo ' + Game.G.rope.pts.length + ' puntos, visible ' + Game.G.rope.visible + ' · arena ' + Game.G.arenaId) + (watch ? ' · mirón ve x=' + watch[0] + ' ' + watch[1] + ' (sus jugadores: ' + watch[2] + ')' : '');
  console.log('pilotos', n, '· puesto remoto', remSeat, '· antes', JSON.stringify(before), 'después', JSON.stringify(after), '· tiros del remoto', shots, '· instantánea', size, 'bytes ·', fx);
  await H.screenshot({ path: OUT + 'nettya-host.png' }); await C.screenshot({ path: OUT + 'nettya-remoto.png' });
  const moved = after.h[0] - before.h[0] > 20;
  const synced = Math.hypot(after.c[0] - after.h[0], after.c[1] - after.h[1]) < 120;
  // fin forzado: el anfitrión gana todas las rondas que hacen falta
  await fh.evaluate(() => { const G = Game.G; G.wins[0] = G.winsNeeded - 1; const p = G.players[1]; p.stuck = false; p.y = 1350; p.vy = 400; });
  let resH = null, resC = null;
  for (let i = 0; i < 60; i++) { await wait(500); resH = await fh.evaluate(() => !document.getElementById('s-results').hidden && document.getElementById('r-title').textContent); resC = await fc.evaluate(() => !document.getElementById('s-results').hidden && document.getElementById('r-title').textContent); if (resH && resC) break; }
  const btns = async f => f.evaluate(() => ['btn-rematch', 'btn-hub'].map(id => { const e = document.getElementById(id); return e.hidden ? null : e.textContent; }));
  const bh = await btns(fh), bc = await btns(fc);
  console.log('resultados anfitrión:', resH, JSON.stringify(bh), '· remoto:', resC, JSON.stringify(bc));
  await H.screenshot({ path: OUT + 'nettya-res-host.png' }); await C.screenshot({ path: OUT + 'nettya-res-remoto.png' });
  await fh.evaluate(() => document.getElementById('btn-rematch').click()); await wait(4000);
  const again = await fc.evaluate(() => Game.G.net && ['countdown', 'play'].includes(Game.G.state) && document.getElementById('s-results').hidden);
  const ferr = async f => f.evaluate(() => window.__errs.slice(0, 4)).catch(() => ['?']);
  errs.push(...(await ferr(fh)).map(e => 'anfitrión: ' + e), ...(await ferr(fc)).map(e => 'remoto: ' + e));
  const resOk = !!resH && !!resC && bh[0] === 'Revancha (todos)' && bh[1] === 'Volver a la sala' && !bc[0] && bc[1] === 'Volver a la sala';
  console.log({ jugadores: n, remotoMueveSuChicle: moved, remotoVeLoMismo: synced, tiraDelHilo: shots > 0, resultados: resOk, revancha: again, errores: errs.slice(0, 6) });
  console.log(moved && synced && shots > 0 && resOk && again && !errs.length && n === 2 && (!V || (watch && watch[2] === 0)) ? 'TYA EN LÍNEA OK' : 'TYA EN LÍNEA FALLA');
  await b.close();
})();
