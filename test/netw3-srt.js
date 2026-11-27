// Sortilegio · Mundo 3 EN LÍNEA: anfitrión + remoto entran a niveles del Mundo 3 (servidor local en 8799).
// Comprueba en cada nivel: los dos entran, el remoto ve lo mismo (objetos del Mundo 3, jefe y su vida, estaciones de
// los paneles y de los toriis), un torii que cambia en el anfitrión cambia en el remoto, y no hay errores.
const { chromium } = require('playwright');
const URL = (process.env.URL || 'http://127.0.0.1:8765/') + '?net=srv&server=' + (process.env.SERVER || 'http://127.0.0.1:8799') + '#online', OUT = process.env.OUT || '/tmp/';
const LVS = (process.env.LVS || '18,20,23,25').split(',').map(Number);
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const page = async () => { const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }); await ctx.addInitScript(() => { window.__errs = []; window.addEventListener('error', e => window.__errs.push(e.message + ' @ ' + ((e.error && e.error.stack) || '').split('\n').slice(1, 3).join(' '))); }); const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR página', e.message)); await p.goto(URL); await wait(800); return p; };
  const H = await page(), C = await page();
  await H.evaluate(() => { const o = {}; for (let i = 1; i <= 26; i++) o['c' + i] = 2; localStorage.setItem('srt_camp', JSON.stringify(o)); localStorage.setItem('srt_voice', 'false'); });
  await C.evaluate(() => { localStorage.removeItem('srt_camp'); localStorage.setItem('srt_voice', 'false'); });
  await H.fill('[data-pname="0"]', 'Ignacio'); await H.click('#on-host'); await wait(500);
  const code = await H.evaluate(() => Net.code);
  await C.fill('[data-pname="0"]', 'Remoto'); await C.fill('#on-code', code); await C.click('#on-join');
  for (let i = 0; i < 40; i++) { const ok = await H.evaluate(() => Net.room && Net.room.devices.length === 2 && Net.room.devices.every(d => d.host || d.open)); if (ok) break; await wait(300); }
  await H.click('[data-ong="sortilegio"]'); await wait(300); await H.click('[data-onmode="camp"]'); await wait(300); await H.click('#on-go');
  const frameOf = async (p, cond) => { for (let i = 0; i < 120; i++) { const f = p.frames().find(x => x !== p.mainFrame() && x.url() !== 'about:blank'); if (f) { try { if (await f.evaluate(cond)) return f; } catch (e) { /* cargando */ } } await wait(500); } return null; };
  const fh = await frameOf(H, () => typeof UI !== 'undefined' && UI.current === 'camp');
  const fc = await frameOf(C, () => typeof NetPlay !== 'undefined' && !!document.getElementById('netWait'));
  const inLvl = async (f, lv) => { for (let i = 0; i < 60; i++) { const ok = await f.evaluate(lv => Game.G.mode === 'camp' && Game.G.campLevel === lv && ['count', 'play'].includes(Game.G.state) && !Game.G.attract, lv).catch(() => false); if (ok) return true; await wait(500); } return false; };
  const view = f => f.evaluate(() => { const G = Game.G, b = G.boss;
    return { id: G.L && G.L.id, w3: G.objs.filter(o => o.w3).length, objs: G.objs.length, boss: b ? [b.kind || b.name || '?', Math.round(b.hp)] : null, units: G.units.filter(u => u.alive !== false).length,
      sea: G.sea ? (G.sea.panels || []).map(p => p.s || p[2] || p.season).join('') : '', tor: (G.cs && G.cs.tor) || '' }; });
  let allOk = !!fh && !!fc; const rows = [];
  for (const lv of LVS) {
    await fh.evaluate(lv => { const w = document.querySelector('#c-world button[data-v="3"]'); if (w) w.click(); }, lv); await wait(300);
    await fh.evaluate(lv => { const e = document.querySelector(`#c-grid .lvl[data-lv="${lv}"]`); if (e) e.click(); else UI.startLevel && UI.startLevel(lv); }, lv);
    const both = (await inLvl(fh, lv)) && (await inLvl(fc, lv));
    // la cinemática de entrada: la ven los dos; el remoto no la puede saltar; cuando el anfitrión la salta, se cierra en los dos
    let film = null; for (let i = 0; i < 20; i++) { const a = await fh.evaluate(() => typeof Film !== 'undefined' && Film.on), c = await fc.evaluate(() => typeof Film !== 'undefined' && Film.on); if (a && c) { film = { both: true }; break; } await wait(250); }
    if (film) { await fc.evaluate(() => Film.end(true)); await wait(300); film.clientCantSkip = await fc.evaluate(() => Film.on); await fh.evaluate(() => Film.end(true)); await wait(1500); film.closedOnClient = !(await fc.evaluate(() => Film.on)); if (!film.clientCantSkip || !film.closedOnClient) allOk = false; }
    else { film = { both: false }; allOk = false; }
    for (let i = 0; i < 60; i++) { if (await fh.evaluate(() => Game.G.state === 'play')) break; await wait(300); }
    await wait(2500);
    // cambiar un torii en el anfitrión (como si le pegaran con planta)
    const hit = await fh.evaluate(() => { const G = Game.G; if (!G.sea || !G.sea.toriis || !G.sea.toriis.length) return 'sin toriis'; const t = G.sea.toriis[0]; const want = ['plant', 'fire', 'wind', 'water'].find(el => SEASON_OF_EL[el] !== (t.s || '')) || 'plant';
      try { if (t.stain) t.stain = 0; G.spells.push({ t: 'proj', id: 9001, age: 0, S: SPELLS[want][0], by: 0, team: 0, el: want, x: t.x - 60, y: t.y, vx: 600, vy: 0, r: 12, dmg: 5, life: 1 }); } catch (e) { return 'err ' + e.message; } return want; });
    await wait(2500);
    const vh = await view(fh), vc = await view(fc);
    const same = vh.id === vc.id && vh.w3 === vc.w3 && JSON.stringify(vh.boss) === JSON.stringify(vc.boss) && vh.tor === vc.tor && vh.sea === vc.sea;
    rows.push({ lv, both, film, hit, same }); if (!both || !same) allOk = false;
    await H.screenshot({ path: OUT + `netw3-${lv}-host.png` }); await C.screenshot({ path: OUT + `netw3-${lv}-remoto.png` });
    await fh.evaluate(() => { const G = Game.G; G.lives = 5; Game.endRound(0, 'win'); });
    for (let i = 0; i < 60; i++) { await wait(400); if (await fh.evaluate(() => !document.getElementById('s-results').hidden)) break; }
    await wait(1500); // la cinemática (si hay) no corre en línea
    await fh.evaluate(() => { const e = document.getElementById('r-netpick'); if (e && !e.hidden) e.click(); }); await wait(2500);
    await frameOf(H, () => UI.current === 'camp');
  }
  for (const r of rows) console.log(JSON.stringify(r));
  const errs = [...(await fh.evaluate(() => window.__errs.slice(0, 4)).catch(() => ['?'])).map(e => 'anfitrión: ' + e), ...(await fc.evaluate(() => window.__errs.slice(0, 4)).catch(() => ['?'])).map(e => 'remoto: ' + e)];
  console.log('errores:', errs.join(' | ') || 'ninguno');
  console.log(allOk && !errs.length ? 'MUNDO 3 EN LÍNEA OK' : 'MUNDO 3 EN LÍNEA FALLA');
  await b.close();
})();
