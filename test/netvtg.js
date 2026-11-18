// VÉRTIGO en línea: anfitrión (PC) + remoto (otro PC) en la misma máquina, sala por BroadcastChannel, WebRTC real.
// Comprueba: los dos abren la carrera, el remoto recibe instantáneas, y su tecla de giro mueve SU auto en el anfitrión.
const { chromium } = require('playwright');
const URL = (process.env.URL || 'http://127.0.0.1:8765/') + '?net=bc' + (process.env.RED ? '&' + process.env.RED : '') + '#online', OUT = process.env.OUT || '/tmp/';
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: (process.env.VIEW ? { width: +process.env.VIEW.split('x')[0], height: +process.env.VIEW.split('x')[1] } : { width: 960, height: 540 }) }); const errs = [];
  await ctx.addInitScript(() => { try { localStorage.setItem('vtg_gq', '0'); } catch (e) {} window.__errs = []; addEventListener('error', e => window.__errs.push(String(e.message).slice(0, 200))); });
  const page = async () => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('c:' + m.text().slice(0, 160)); }); await p.goto(URL); await wait(800); return p; };
  const H = await page(), C = await page();
  await H.fill('[data-pname="0"]', 'Ignacio'); await H.click('#on-host'); await wait(500);
  const code = await H.evaluate(() => Net.code);
  await C.fill('[data-pname="0"]', 'Remoto'); await C.fill('#on-code', code); await C.click('#on-join');
  for (let i = 0; i < 40; i++) { const ok = await H.evaluate(() => Net.room && Net.room.devices.length === 2 && Net.room.devices.every(d => d.host || d.open)); if (ok) break; await wait(300); }
  await C.evaluate(() => { const t0 = Date.now(); window.__nl = []; Net.on('status', s => __nl.push([Date.now() - t0, 'st', JSON.stringify(s)])); Net.on('peers', () => __nl.push([Date.now() - t0, 'peers', JSON.stringify(Net.peers)])); });
  await H.click('[data-ong="vertigo"]'); await wait(300); await H.click('[data-onseg="map"] [data-v="venecia"]'); await wait(200); await H.click('[data-onseg="len"] [data-v="2"]'); await wait(1200);
  const nextTxt = await C.evaluate(() => { const e = document.querySelector('.on-next'); return e ? e.innerText.replace(/\s+/g, ' ') : null; });
  console.log('el remoto ve:', nextTxt); await H.screenshot({ path: OUT + 'sala-elegir.png' }); await C.screenshot({ path: OUT + 'sala-remoto-ve.png' });
  await H.click('#on-go');
  const frameOf = async p => { for (let i = 0; i < 120; i++) { const f = p.frames().find(x => x !== p.mainFrame() && x.url() !== 'about:blank'); if (f) { try { if (await f.evaluate(() => typeof Game !== 'undefined' && Game.R && Game.mode === 'race')) return f; } catch (e) {} } await wait(500); } return null; };
  const fh = await frameOf(H), fc = await frameOf(C);
  console.log('carrera abierta: anfitrión', !!fh, '· remoto', !!fc);
  if (!fc) { const f = C.frames().find(x => x !== C.mainFrame() && x.url() !== 'about:blank'); console.log('remoto (diagnóstico):', f ? JSON.stringify(await f.evaluate(() => ({ on: NetPlay.on, role: NetPlay.role, mine: NetPlay.mine, mode: Game.mode, R: !!Game.R, wait: !!document.getElementById("netWait"), errs: window.__errs })).catch(e => String(e))) : 'sin juego', JSON.stringify(await C.evaluate(() => ({ alive: Net.alive, room: Net.room && Net.room.devices.length, hash: location.hash }))));
    console.log('eventos red remoto:', JSON.stringify(await C.evaluate(() => window.__nl.slice(-12))));
    if (fh) console.log('anfitrión:', JSON.stringify(await fh.evaluate(() => ({ mode: Game.mode, wait: !!document.getElementById('netWait'), errs: window.__errs }))));
  }
  if (!fh || !fc) { console.log(errs.slice(0, 5)); await b.close(); process.exit(1); }
  const tk = await fh.evaluate(() => [Game.R.track.def.id, Game.R.laps]), tkc = await fc.evaluate(() => [Game.R.track.def.id, Game.R.laps]);
  console.log('pista y vueltas (anfitrión / remoto):', JSON.stringify(tk), JSON.stringify(tkc));
  const pickOk = !!nextTxt && /Venecia/.test(nextTxt) && tk[0] === 'venecia' && tk[1] === 2 && tkc[0] === 'venecia';
  // esperar la presentación y la cuenta
  for (let i = 0; i < 160; i++) { const ok = await fh.evaluate(() => Game.R.state === 'race' && Game.R.time > 1.5); if (ok) break; await wait(500); }
  await wait(3000);
  const info = async () => ({ h: await fh.evaluate(() => Game.R.cars.slice(0, 2).map(c => [Math.round(c.s), Math.round(c.u * 10) / 10])), c: await fc.evaluate(() => Game.R.cars.slice(0, 2).map(c => [Math.round(c.s), Math.round(c.u * 10) / 10])) });
  const before = await info();
  // el remoto gira a la derecha 1,5 s (su teclado: D)
  await C.bringToFront(); await fc.focus('body').catch(() => {}); await C.keyboard.down('KeyD'); await wait(1500); await C.keyboard.up('KeyD');
  const after = await info();
  const remSeat = await fc.evaluate(() => NetPlay.mine[0]);
  console.log('puesto del remoto', remSeat, 'antes', JSON.stringify(before), 'después', JSON.stringify(after));
  await H.screenshot({ path: OUT + 'netvtg-host.png' }); await C.screenshot({ path: OUT + 'netvtg-remoto.png' });
  const moved = after.h[1][0] !== before.h[1][0], synced = Math.abs(after.c[1][0] - after.h[1][0]) < 60;
  console.log({ autoRemotoAvanza: moved, remotoVeLoMismo: synced, errores: errs.slice(0, 5) });
  // anfitrión «oculto» (otra app encima): la carrera sigue por temporizador
  const hid = await fh.evaluate(async () => { const sl = ms => new Promise(r => setTimeout(r, ms)); const a0 = Game.R.time; await sl(2000); const a = Game.R.time - a0; Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); const b0 = Game.R.time; await sl(2000); const b = Game.R.time - b0; delete document.hidden; return Math.round((b - a) * 10) / 10; });
  console.log('anfitrión oculto: el temporizador de respaldo sumó', hid, 's de carrera en 2 s');
  // fin de carrera forzado en el anfitrión → resultados en los dos; el anfitrión lanza «Otra carrera (todos)»
  const L0 = await fh.evaluate(() => Game.R.track.L);
  await fh.evaluate(() => { const R = Game.R; R.cars.forEach((c, i) => { c.finished = true; c.finishT = 60 + i; }); R.state = 'done'; R.doneT = 3.3; });
  await wait(2500);
  const btn = async (f, id) => f.evaluate(id => { const e = document.getElementById(id); return e && !e.hidden && e.offsetParent ? e.textContent : null; }, id);
  const resH = { main: await btn(fh, 'resMain'), hub: await btn(fh, 'resHub') }, resC = { main: await btn(fc, 'resMain'), hub: await btn(fc, 'resHub') };
  console.log('resultados anfitrión', JSON.stringify(resH), '· remoto', JSON.stringify(resC));
  await H.screenshot({ path: OUT + 'netvtg-res-host.png', timeout: 60000 }).catch(() => {}); await C.screenshot({ path: OUT + 'netvtg-res-remoto.png', timeout: 60000 }).catch(() => {});
  await H.bringToFront(); await fh.evaluate(() => document.getElementById('resMain').click()); await wait(5000);
  const L1h = await fh.evaluate(() => Game.R.track.L), L1c = await fc.evaluate(() => Game.R.track.L);
  const again = await fc.evaluate(() => Game.mode === 'race' && !document.getElementById('resWait') && Game.R.state !== 'done');
  const resOk = resH.main === 'Otra carrera (todos)' && resH.hub === 'Volver a la sala' && !resC.main && resC.hub === 'Volver a la sala';
  const againOk = again && L1h === L1c && L1h !== L0 && hid > 1;
  const ferr = async f => f.evaluate(() => window.__errs.slice(0, 4)).catch(() => ['?']); errs.push(...(await ferr(fh)).map(e => 'anfitrión: ' + e), ...(await ferr(fc)).map(e => 'remoto: ' + e));
  console.log('remoto:', JSON.stringify(await fc.evaluate(() => ({ mode: Game.mode, st: Game.R.state, on: NetPlay.on, n: NetPlay.sample() && 1 }))), 'errores juego:', errs.slice(0, 6));
  console.log({ pantallaResultados: resOk, otraCarreraParaTodos: againOk, pista: [L0, L1h, L1c] });
  console.log({ eleccionEnSala: pickOk }); console.log(moved && synced && resOk && againOk && pickOk && !errs.length ? 'VTG EN LÍNEA OK' : 'VTG EN LÍNEA FALLA');
  await b.close();
})();
