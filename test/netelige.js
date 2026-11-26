// Elegir personaje en línea antes de cada partida (todos los juegos): anfitrión (1 jugador) + otro aparato con 2 jugadores.
// G=sortilegio|vertigo|ventolera|tira-y-afloja (por defecto sortilegio) · CH=random para probar «al azar».
// Comprueba: aparece la pantalla de elegir en los dos (una columna por jugador local), el clic y las teclas (J L … O) eligen,
// si el juego no deja repetir (VÉRTIGO, Tira y Afloja) lo que otro ya confirmó queda bloqueado, la partida arranca apenas
// todos confirman (sin esperar la cuenta) y cada uno juega con el que escogió. Con CH=random: no hay pantalla y no se repiten.
const { chromium } = require('playwright');
const URL = (process.env.URL || 'http://127.0.0.1:8765/') + '?net=bc#online', OUT = process.env.OUT || '/tmp/', G = process.env.G || 'sortilegio', CH = process.env.CH || 'pick';
const wait = ms => new Promise(r => setTimeout(r, ms));
// lo que cada juego guarda de los personajes de la partida, por puesto
const CHARS = {
  sortilegio: () => Game.G.mages.map(m => m.cid),
  vertigo: () => Game.R.cars.filter(c => !c.bot).sort((a, b) => a.human - b.human).map(c => c.pid),
  ventolera: () => Game.G.birds.slice(0, NetPlay.seats.length).map(b => b.sp.id),
  'tira-y-afloja': () => Game.G.players.map(p => p.col.id),
};
const PLAYING = {
  sortilegio: () => typeof Game !== 'undefined' && Game.G.net && ['count', 'play'].includes(Game.G.state),
  vertigo: () => typeof Game !== 'undefined' && !!Game.R && Game.mode === 'race' && !!NetPlay.cfg,
  ventolera: () => typeof Game !== 'undefined' && Game.G.net && ['countdown', 'play'].includes(Game.G.state),
  'tira-y-afloja': () => typeof Game !== 'undefined' && Game.G.net && ['countdown', 'play'].includes(Game.G.state),
};
(async () => {
  const b = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const errs = [];
  // los dos en el mismo navegador (la sala de prueba va por BroadcastChannel), cada uno con su tamaño de pantalla
  const ctx = await b.newContext({ viewport: { width: 1100, height: 620 } }); await ctx.addInitScript(() => { try { localStorage.setItem('vtg_gq', '0'); } catch (e) {} window.__errs = []; addEventListener('error', e => window.__errs.push(String(e.message).slice(0, 200))); });
  const mk = async (vw, vh) => { const p = await ctx.newPage(); await p.setViewportSize({ width: vw, height: vh }); p.on('pageerror', e => errs.push(e.message)); await p.goto(URL); await wait(800); return p; };
  const V = (process.env.VIEW || '').split('x').map(Number), H = await mk(V[0] || 1100, V[1] || 620), C = await mk(V[0] || 800, V[1] || 400);
  await H.fill('[data-pname="0"]', 'Ignacio'); await H.click('#on-host'); await wait(500);
  const code = await H.evaluate(() => Net.code);
  await C.click('#on-n [data-v="2"]'); await C.fill('[data-pname="0"]', 'Juan'); await C.fill('[data-pname="1"]', 'Sara');
  await C.fill('#on-code', code); await C.click('#on-join');
  for (let i = 0; i < 40; i++) { if (await H.evaluate(() => Net.room && Net.room.devices.length === 2 && Net.room.devices.every(d => d.host || d.open))) break; await wait(300); }
  await H.click(`[data-ong="${G}"]`); await wait(400);
  const seats = await H.evaluate(() => Online.players().length);
  if (G === 'tira-y-afloja') console.log('(Tira y Afloja es de 2: juegan Ignacio y Juan, Sara mira)');
  if (CH === 'random') await H.click('[data-onseg="chars"] [data-v="random"]');
  await wait(300); await H.screenshot({ path: OUT + 'netelige-sala.png', fullPage: false });
  await H.click('#on-go');
  const frameOf = async p => { for (let i = 0; i < 120; i++) { const f = p.frames().find(x => x !== p.mainFrame() && x.url() !== 'about:blank'); if (f) { try { if (await f.evaluate(() => typeof NetPlay !== 'undefined' && NetPlay.on)) return f; } catch (e) {} } await wait(300); } return null; };
  const fh = await frameOf(H), fc = await frameOf(C);
  if (!fh || !fc) { console.log('no abrió el juego', !!fh, !!fc, errs.slice(0, 4)); await b.close(); process.exit(1); }
  const res = { juego: G, modo: CH };
  if (CH === 'pick') {
    const ui = async f => { for (let i = 0; i < 60; i++) { const n = await f.evaluate(() => { const k = document.querySelector('#netWait .pk'); return k ? [...k.querySelectorAll('.pp')].map(p => p.querySelectorAll('.ch').length) : null; }); if (n) return n; await wait(250); } return null; };
    res.columnasAnfitrion = await ui(fh); res.columnasRemoto = await ui(fc);
    const list = await fh.evaluate(() => [...document.querySelectorAll('#netWait .pp .ch')].map(b => [b.dataset.id, b.disabled]));
    const free = list.filter(x => !x[1]).map(x => x[0]);
    // el anfitrión escoge el último de la lista y confirma; el remoto: J1 con clic el penúltimo, J2 con teclas
    const hPick = free[free.length - 1], cPick = free[free.length - 2];
    await fh.evaluate(id => document.querySelector(`#netWait .pp .ch[data-id="${id}"]`).click(), hPick); await wait(150);
    await H.screenshot({ path: OUT + 'netelige-anfitrion.png' });
    await fh.evaluate(() => document.querySelector('#netWait .pf button').click());
    await wait(900);
    // si no se puede repetir, el remoto ya no puede escoger el del anfitrión
    const blocked = await fc.evaluate(id => { const b = document.querySelector(`#netWait .pp .ch[data-id="${id}"]`); return b ? b.disabled : null; }, hPick);
    res.bloqueaRepetido = blocked;
    const cols = res.columnasRemoto ? res.columnasRemoto.length : 0;
    if (cols) await fc.evaluate(id => document.querySelector(`#netWait .pp .ch[data-id="${id}"]`).click(), cPick);
    await C.bringToFront();
    let kPick = null;
    if (cols > 1) { // J2 del remoto con sus teclas: L L (dos a la derecha) y O (listo)
      await C.keyboard.press('KeyL'); await wait(120); await C.keyboard.press('KeyL'); await wait(120);
      kPick = await fc.evaluate(() => { const p = document.querySelectorAll('#netWait .pp')[1]; const on = p && p.querySelector('.ch.on'); return on ? on.dataset.id : null; });
    }
    await wait(300); await C.screenshot({ path: OUT + 'netelige-remoto.png' });
    const t0 = Date.now();
    await fc.evaluate(() => document.querySelector('#netWait .pp .pf button').click());
    if (cols > 1) await C.keyboard.press('KeyO');
    if (process.env.DBG) { for (let k = 0; k < 6; k++) { console.log(Date.now() - t0, 'anfitrión:', JSON.stringify(await fh.evaluate(() => NetPlay.pickState))); await wait(300); } await wait(400); console.log('remoto tras confirmar:', await fc.evaluate(() => [...document.querySelectorAll('#netWait .pp')].map(p => p.querySelector('.ch.on') && p.querySelector('.ch.on').dataset.id + ':' + p.querySelector('.pf button').textContent).join(' | ') + ' · ' + document.querySelector('#netWait .ps').textContent)); }
    // «arranca»: el anfitrión ya armó la partida (sin esperar la cuenta); después, a que cargue en los dos
    let started = false; for (let i = 0; i < 80; i++) { if (await fh.evaluate(() => !!NetPlay.cfg).catch(() => false)) { started = true; break; } await wait(100); }
    res.arrancaEn = started ? ((Date.now() - t0) / 1000).toFixed(1) + ' s' : 'no arrancó';
    for (let i = 0; i < 80; i++) { if (await fh.evaluate(PLAYING[G]).catch(() => false) && await fc.evaluate(PLAYING[G]).catch(() => false)) break; await wait(250); }
    await wait(800);
    res.sobrabaAlArrancar = await fh.evaluate(() => NetPlay.pickState.atLaunch); // ms de la cuenta que no hizo falta esperar
    const hc = await fh.evaluate(CHARS[G]), cc = await fc.evaluate(CHARS[G]);
    res.personajes = hc; res.remotoVe = cc;
    const want = [hPick, cPick, kPick].slice(0, hc.length);
    res.esperados = want;
    res.ok = !!started && JSON.stringify(hc) === JSON.stringify(want) && JSON.stringify(cc) === JSON.stringify(hc) && started && res.sobrabaAlArrancar > 4000 && (!['vertigo', 'tira-y-afloja'].includes(G) || blocked === true);
  } else {
    await wait(1500);
    res.pantallaElegir = await fh.evaluate(() => !!document.querySelector('#netWait .pk'));
    let started = false; for (let i = 0; i < 80; i++) { if (await fh.evaluate(PLAYING[G]).catch(() => false)) { started = true; break; } await wait(250); }
    await wait(1000);
    const hc = await fh.evaluate(CHARS[G]), cc = await fc.evaluate(CHARS[G]);
    res.personajes = hc; res.remotoVe = cc;
    res.ok = started && !res.pantallaElegir && new Set(hc).size === hc.length && JSON.stringify(cc) === JSON.stringify(hc);
  }
  const ferr = async f => f.evaluate(() => window.__errs.slice(0, 4)).catch(() => ['?']);
  errs.push(...(await ferr(fh)).map(e => 'anfitrión: ' + e), ...(await ferr(fc)).map(e => 'remoto: ' + e));
  res.errores = errs.slice(0, 5); res.jugadores = seats;
  console.log(JSON.stringify(res));
  console.log(res.ok && !errs.length ? 'ELEGIR EN LÍNEA OK' : 'ELEGIR EN LÍNEA FALLA');
  await b.close();
})();
