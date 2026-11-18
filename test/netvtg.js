// VÉRTIGO en línea: anfitrión (PC) + remoto (otro PC) en la misma máquina, sala por BroadcastChannel, WebRTC real.
// Comprueba: los dos abren la carrera, el remoto recibe instantáneas, y su tecla de giro mueve SU auto en el anfitrión.
const { chromium } = require('playwright');
const URL = (process.env.URL || 'http://127.0.0.1:8765/') + '?net=bc#online', OUT = process.env.OUT || '/tmp/';
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }); const errs = [];
  await ctx.addInitScript(() => { try { localStorage.setItem('vtg_gq', '0'); } catch (e) {} });
  const page = async () => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('c:' + m.text().slice(0, 160)); }); await p.goto(URL); await wait(800); return p; };
  const H = await page(), C = await page();
  await H.fill('[data-pname="0"]', 'Ignacio'); await H.click('#on-host'); await wait(500);
  const code = await H.evaluate(() => Net.code);
  await C.fill('[data-pname="0"]', 'Remoto'); await C.fill('#on-code', code); await C.click('#on-join');
  for (let i = 0; i < 40; i++) { const ok = await H.evaluate(() => Net.room && Net.room.devices.length === 2 && Net.room.devices.every(d => d.host || d.open)); if (ok) break; await wait(300); }
  await H.click('[data-ong="vertigo"]');
  const frameOf = async p => { for (let i = 0; i < 120; i++) { const f = p.frames().find(x => x !== p.mainFrame() && x.url() !== 'about:blank'); if (f) { try { if (await f.evaluate(() => typeof Game !== 'undefined' && Game.R && Game.mode === 'race')) return f; } catch (e) {} } await wait(500); } return null; };
  const fh = await frameOf(H), fc = await frameOf(C);
  console.log('carrera abierta: anfitrión', !!fh, '· remoto', !!fc);
  if (!fc && fh) { await fh.evaluate(() => { window.__got = []; NetPlay.onMsg(d => window.__got.push(d.t)); }); await H.evaluate(() => { window.__hm = []; Net.on('msg', (f, m) => window.__hm.push(m && m.$g ? 'g:' + (m.d && m.d.t) : m && m.$)); }); await wait(4000); console.log('anfitrión recibió (juego):', JSON.stringify(await fh.evaluate(() => window.__got)), '(app):', JSON.stringify((await H.evaluate(() => window.__hm)).slice(0, 12)), 'cfg?', await fh.evaluate(() => JSON.stringify(Object.keys(NetGame)))); }
  if (!fc) { await C.evaluate(() => { window.__fm = []; addEventListener('message', e => window.__fm.push(e.data && (e.data.event || e.data.cmd))); }); const f2 = C.frames().find(x => x !== C.mainFrame()); await f2.evaluate(() => NetPlay.send({ t: 'want' }, true, 'host')); await wait(1500); console.log('app remota recibió:', JSON.stringify(await C.evaluate(() => window.__fm.slice(0, 20))), 'Net.alive', await C.evaluate(() => [Net.alive, Net.hostId, Net.isHost])); }
  if (!fc) { console.log('remoto:', JSON.stringify(await C.evaluate(() => ({ net: GAMEHUB.Launcher.net, open: GAMEHUB.Launcher.open_, stage: !document.getElementById('stage').hidden, ready: document.getElementById('stage').classList.contains('ready'), view: location.hash })))); const f = C.frames().find(x => x !== C.mainFrame()); if (f) console.log('juego remoto:', JSON.stringify(await f.evaluate(() => ({ np: typeof NetPlay !== 'undefined' && { on: NetPlay.on, role: NetPlay.role, mine: NetPlay.mine }, mode: typeof Game !== 'undefined' && Game.mode, R: typeof Game !== 'undefined' && !!Game.R })).catch(e => String(e)))); }
  if (!fh || !fc) { console.log(errs.slice(0, 5)); await b.close(); process.exit(1); }
  // esperar la presentación y la cuenta
  for (let i = 0; i < 60; i++) { const st = await fh.evaluate(() => Game.R.state); if (st === 'race') break; await wait(500); }
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
  console.log(moved && synced && !errs.length ? 'VTG EN LÍNEA OK' : 'VTG EN LÍNEA FALLA');
  await b.close();
})();
