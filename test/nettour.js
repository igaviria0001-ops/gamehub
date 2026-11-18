// Torneo en línea: 3 aparatos (anfitrión, remoto y un tercero). El anfitrión arma una liga con los 3 de la sala,
// lanza la prueba 1 (juegan los dos sorteados, el otro mira), el resultado se anota solo en el tablero del anfitrión
// y el tablero viaja a los demás; al final, el campeón entra al salón de la fama de TODOS (marcado «en línea»).
const { chromium } = require('playwright');
const URL = (process.env.URL || 'http://127.0.0.1:8765/') + '?net=bc#online', OUT = process.env.OUT || '/tmp/';
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const ctx = await b.newContext({ viewport: { width: 1100, height: 700 } }); const errs = [];
  const page = async () => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message + ' @' + String(e.stack || '').split('\n').slice(1, 3).join(' '))); await p.goto(URL); await wait(800); return p; };
  const H = await page(), C = await page(), V = await page();
  await H.fill('[data-pname="0"]', 'Ignacio'); await H.click('#on-host'); await wait(500);
  const code = await H.evaluate(() => Net.code);
  for (const [P, n] of [[C, 'Sara'], [V, 'Tomás']]) { await P.fill('[data-pname="0"]', n); await P.fill('#on-code', code); await P.click('#on-join'); }
  for (let i = 0; i < 40; i++) { if (await H.evaluate(() => Net.room && Net.room.devices.length === 3 && Net.room.devices.every(d => d.host || d.open))) break; await wait(300); }
  // armar la liga
  await H.click('#on-tour'); await wait(500);
  await H.click('[data-format="liga"]'); await wait(200);
  for (let k = 0; k < 5; k++) { const ok = await H.evaluate(() => !!GAMEHUB.Tour.T); if (ok) break; await H.click('[data-w="next"]'); await wait(300); }
  const T0 = await H.evaluate(() => { const T = GAMEHUB.Tour.T; return T && { online: T.online, n: T.players.length, fmt: T.format }; });
  console.log('torneo creado:', JSON.stringify(T0));
  await H.screenshot({ path: OUT + 'nettour-tablero.png' });
  // prueba 1 (se fija Tira y Afloja: el más liviano, para que la prueba sea rápida): la lanza el anfitrión
  await H.evaluate(() => { const T = GAMEHUB.Tour.T, e = GAMEHUB.Torneo.curEvent(T); e.game = 'tira-y-afloja'; e.mode = 'caneca'; e.map = 'pupitre'; GAMEHUB.Tour.save(); GAMEHUB.go('torneo'); }); await wait(400);
  const ev = await H.evaluate(() => { const T = GAMEHUB.Tour.T, e = GAMEHUB.Torneo.curEvent(T); return { game: e.game, j1: T.players.find(p => p.id === e.j1).name, j2: T.players.find(p => p.id === e.j2).name, id: e.id }; });
  console.log('prueba 1:', JSON.stringify(ev));
  await H.click('[data-t="play"]');
  const frameOf = async p => { for (let i = 0; i < 120; i++) { const f = p.frames().find(x => x !== p.mainFrame() && x.url() !== 'about:blank'); if (f) { try { if (await f.evaluate(() => typeof NetPlay !== 'undefined' && NetPlay.on && !!NetPlay.cfg)) return f; } catch (e) {} } await wait(500); } return null; };
  const fh = await frameOf(H), fc = await frameOf(C), fv = await frameOf(V);
  const mines = [fh && await fh.evaluate(() => NetPlay.mine.length), fc && await fc.evaluate(() => NetPlay.mine.length), fv && await fv.evaluate(() => NetPlay.mine.length)];
  const tours = [fh && await fh.evaluate(() => !!(NetPlay.ev && NetPlay.ev.tour)), fc && await fc.evaluate(() => !!(NetPlay.ev && NetPlay.ev.tour))];
  console.log('abierto en los 3:', !!fh, !!fc, !!fv, '· jugadores por aparato', JSON.stringify(mines), '· marcado torneo', JSON.stringify(tours));
  // el juego del anfitrión «termina»: gana el puesto 0 (J1 de la prueba)
  await fh.evaluate(() => NetPlay.send({ t: 'res', r: { winner: 0, mode: 'duel', wins: [2, 1], net: true } }, true, '*'));
  await wait(800);
  await fh.evaluate(() => Hub.exit()); await wait(1200);
  const after = await H.evaluate(() => { const T = GAMEHUB.Tour.T; return { done: T.events.filter(e => e.status === 'done').length, view: location.hash, winner: (T.events[0] || {}).winner }; });
  for (let i = 0; i < 20; i++) { if (await C.evaluate(() => { try { const T = JSON.parse(localStorage.getItem('gamehub_tourNet')); return T && T.events.some(e => e.status === 'done'); } catch (e) { return false; } })) break; await wait(300); }
  const seen = await C.evaluate(() => { try { const T = JSON.parse(localStorage.getItem('gamehub_tourNet')); return T.events.filter(e => e.status === 'done').length; } catch (e) { return -1; } });
  await C.evaluate(() => { if (GAMEHUB.Launcher.open_) GAMEHUB.Launcher.close(); }); await wait(600);
  const board = await C.evaluate(() => { const e = document.querySelector('.on-tour'); return e ? e.innerText.replace(/\s+/g, ' ').slice(0, 160) : null; });
  console.log('anfitrión tras la prueba:', JSON.stringify(after), '· el remoto ve', seen, 'pruebas jugadas · tablero:', board);
  await C.screenshot({ path: OUT + 'nettour-remoto.png' });
  // terminar la liga a mano (anotando el resto) → salón de la fama en todos
  await H.evaluate(() => { const G = GAMEHUB, T = G.Tour.T; for (let k = 0; k < 40 && !T.done; k++) { let e = G.Torneo.curEvent(T); if (!e) { const m = G.Torneo.nextMatch(T); if (!m) break; e = G.Torneo.makeEvent(T, m); } G.Tour.result(e.id, e.j1, { score: '1 – 0' }); } G.Tour.save(); });
  await wait(1500);
  const fame = async P => P.evaluate(() => { try { const H = JSON.parse(localStorage.getItem('gamehub_fame') || '[]'); return H.length ? { n: H.length, online: H[0].online, name: H[0].name } : null; } catch (e) { return 'x'; } });
  const fH = await fame(H), fC = await fame(C), fV = await fame(V);
  console.log('salón de la fama · anfitrión', JSON.stringify(fH), '· remoto', JSON.stringify(fC), '· tercero', JSON.stringify(fV));
  await C.evaluate(() => GAMEHUB.go('fama')); await wait(500); await C.screenshot({ path: OUT + 'nettour-fama.png' });
  const ok = T0 && T0.online && T0.n === 3 && fh && fc && fv && mines.filter(x => x === 1).length === 2 && mines.includes(0) && tours[0] && tours[1] && after.done === 1 && seen === 1 && !!board && fH && fC && fV && fC.online && fV.online && !errs.length;
  console.log({ errores: errs.slice(0, 5) });
  console.log(ok ? 'TORNEO EN LÍNEA OK' : 'TORNEO EN LÍNEA FALLA');
  await b.close();
})();
