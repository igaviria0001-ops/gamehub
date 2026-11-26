// Si el anfitrión se va, la sala sigue: (1) sale a propósito con un torneo en línea a medias → el siguiente aparato queda
// de anfitrión con el MISMO código, el tercero se reconecta solo, el torneo sigue y se puede jugar; (2) el anfitrión se queda
// callado a mitad de partida (sin red, app en segundo plano) → el remoto cierra la partida y sigue de anfitrión; cuando el
// viejo vuelve, queda UN solo anfitrión y el otro conectado a él.
const { chromium } = require('playwright');
const URL = (process.env.URL || 'http://127.0.0.1:8765/') + '?net=bc#online';
const wait = ms => new Promise(r => setTimeout(r, ms));
const until = async (f, ms, step = 300) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await f()) return true; } catch (e) { /* aún no */ } await wait(step); } return false; };
(async () => {
  const b = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] }); const errs = [];
  const mk = async () => { const ctx = await b.newContext({ viewport: { width: 1100, height: 700 } }); await ctx.addInitScript(() => { if (!window.__autoPick) window.__autoPick = setInterval(() => { try { document.querySelectorAll('#netWait .pf button:not(.no)').forEach(b => b.click()); } catch (e) {} }, 700); }); return async () => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(URL); await wait(700); return p; }; };
  const frameOf = async p => { for (let i = 0; i < 80; i++) { const f = p.frames().find(x => x !== p.mainFrame() && x.url() !== 'about:blank'); if (f) { try { if (await f.evaluate(() => typeof NetPlay !== 'undefined' && NetPlay.on && !!NetPlay.cfg)) return f; } catch (e) {} } await wait(400); } return null; };
  // ---------- 1) sale a propósito, con torneo ----------
  const pg = await mk(); const H = await pg(), A = await pg(), B = await pg();
  await H.fill('[data-pname="0"]', 'Ignacio'); await H.click('#on-host'); await wait(400);
  const code = await H.evaluate(() => Net.code);
  for (const [P, n] of [[A, 'Sara'], [B, 'Tomás']]) { await P.fill('[data-pname="0"]', n); await P.fill('#on-code', code); await P.click('#on-join'); await wait(300); }
  await until(() => H.evaluate(() => Net.room.devices.length === 3 && Net.room.devices.every(d => d.host || d.open)), 20000);
  await H.click('#on-tour'); await wait(400); await H.click('[data-format="liga"]'); await wait(200);
  for (let k = 0; k < 5; k++) { if (await H.evaluate(() => !!GAMEHUB.Tour.T)) break; await H.click('[data-w="next"]'); await wait(300); }
  const tid = await H.evaluate(() => GAMEHUB.Tour.T && GAMEHUB.Tour.T.id);
  await until(() => A.evaluate(id => { const T = JSON.parse(localStorage.getItem('gamehub_tourNet') || 'null'); return T && T.id === id; }, tid), 8000);
  const idA = await A.evaluate(() => Net.id);
  await H.evaluate(() => GAMEHUB.go('online')); await wait(300); await H.click('#on-leave');
  const t0 = Date.now();
  const ok1 = await until(async () => (await A.evaluate(() => Net.isHost)) && (await B.evaluate(id => Net.hostId === id && !!Net.peers.get(id) && Net.peers.get(id).open, idA)), 20000);
  const took = Date.now() - t0;
  const st1 = { aHost: await A.evaluate(() => Net.isHost), mismoCodigo: (await A.evaluate(() => Net.code)) === code, bAlNuevo: await B.evaluate(id => Net.hostId === id, idA),
    aparatos: await A.evaluate(() => Net.room.devices.length), torneoSigue: await A.evaluate(id => !!GAMEHUB.Tour.T && GAMEHUB.Tour.T.online && GAMEHUB.Tour.T.id === id, tid),
    avisoA: await A.evaluate(() => (document.querySelector('.on-note') || {}).textContent || ''), avisoB: await B.evaluate(() => (document.querySelector('.on-note') || {}).textContent || '') };
  console.log('1) salió el anfitrión →', JSON.stringify(st1), `(${took} ms)`);
  await A.screenshot({ path: '/tmp/netsucc-nuevo-anfitrion.png' });
  // el nuevo anfitrión lanza una partida con el que quedó
  await A.evaluate(() => GAMEHUB.go('online')); await wait(300);
  await A.click('[data-ong="tira-y-afloja"]'); await wait(300); await A.click('#on-go');
  const fa = await frameOf(A), fb = await frameOf(B);
  console.log('   partida con el nuevo anfitrión:', !!fa, !!fb);
  // ---------- 2) el anfitrión se queda callado a mitad de partida ----------
  const pg2 = await mk(); const H2 = await pg2(), C2 = await pg2();
  await H2.fill('[data-pname="0"]', 'Ana'); await H2.click('#on-host'); await wait(400);
  const code2 = await H2.evaluate(() => Net.code);
  await C2.fill('[data-pname="0"]', 'Beto'); await C2.fill('#on-code', code2); await C2.click('#on-join');
  await until(() => H2.evaluate(() => Net.room.devices.length === 2 && Net.room.devices.every(d => d.host || d.open)), 20000);
  await H2.click('[data-ong="tira-y-afloja"]'); await wait(300); await H2.click('#on-go');
  const g1 = await frameOf(H2), g2 = await frameOf(C2);
  await wait(2500);
  await H2.evaluate(() => { window.__pm = BroadcastChannel.prototype.postMessage; BroadcastChannel.prototype.postMessage = function () {}; for (const p of Net.peers.values()) { try { p.pc && p.pc.close(); } catch (e) {} } });
  const t1 = Date.now();
  const lost = await until(async () => { const f = C2.frames().find(x => x !== C2.mainFrame() && x.url() !== 'about:blank'); return f && await f.evaluate(() => !!document.getElementById('netLost')); }, 6000, 200);
  const ok2 = await until(() => C2.evaluate(() => Net.isHost), 45000, 500);
  const st2 = { avisoEnElJuego: lost, remotoQuedaDeAnfitrion: ok2, segundos: Math.round((Date.now() - t1) / 1000), partidaCerrada: await C2.evaluate(() => !GAMEHUB.Launcher.open_), mismoCodigo: (await C2.evaluate(() => Net.code)) === code2 };
  console.log('2) anfitrión callado →', JSON.stringify(st2));
  // vuelve el viejo
  await H2.evaluate(() => { BroadcastChannel.prototype.postMessage = window.__pm; });
  const ok3 = await until(async () => { const [h, c] = [await H2.evaluate(() => [Net.isHost, Net.id, Net.hostId, Net.hostId && Net.peers.get(Net.hostId) && Net.peers.get(Net.hostId).open]), await C2.evaluate(() => [Net.isHost, Net.id, Net.hostId, Net.hostId && Net.peers.get(Net.hostId) && Net.peers.get(Net.hostId).open])];
    return h[0] !== c[0] && (h[0] ? c[2] === h[1] && c[3] : h[2] === c[1] && h[3]); }, 30000, 500);
  const who = await H2.evaluate(() => Net.isHost) ? 'el viejo' : 'el nuevo';
  console.log('3) volvió el viejo → un solo anfitrión y el otro conectado:', ok3, '· anfitrión:', who);
  await C2.screenshot({ path: '/tmp/netsucc-callado.png' });
  console.log({ errores: errs.slice(0, 5) });
  const ok = ok1 && st1.mismoCodigo && st1.aparatos === 2 && st1.torneoSigue && fa && fb && ok2 && lost && st2.partidaCerrada && st2.mismoCodigo && ok3 && !errs.length;
  console.log(ok ? 'SUCESIÓN OK' : 'SUCESIÓN FALLA');
  await b.close();
})();
