// Sortilegio · campaña en equipo EN LÍNEA: anfitrión + remoto (sala por BroadcastChannel, WebRTC real).
// Con MIRA=1 hay un tercer aparato que solo mira.
// Comprueba: el anfitrión ve su pantalla de la Travesía y el remoto el aviso «elige el nivel»; los dos entran al mismo
// nivel; el remoto ve los objetos (braseros prendidos), criaturas y el jefe; fin del nivel → los dos guardan las
// estrellas en su aparato; «Siguiente nivel» lleva a los dos al siguiente; «Elegir nivel» vuelve a la pantalla.
const { chromium } = require('playwright');
// Cada aparato con su propio almacenamiento (como en la vida real): la señal va por el servidor local (cd servidor && npx wrangler dev --port 8799)
const URL = (process.env.URL || 'http://127.0.0.1:8765/') + '?net=srv&server=' + (process.env.SERVER || 'http://127.0.0.1:8799') + (process.env.RED ? '&' + process.env.RED : '') + '#online', OUT = process.env.OUT || '/tmp/', MIRA = !!process.env.MIRA;
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const errs = [];
  const page = async () => { const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }); await ctx.addInitScript(() => { window.__errs = []; if (!window.__autoPick) window.__autoPick = setInterval(() => { try { document.querySelectorAll("#netWait .pf button:not(.no)").forEach(b => b.click()); } catch (e) {} }, 700); addEventListener('error', e => window.__errs.push(String(e.message).slice(0, 200))); }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('c:' + m.text().slice(0, 160)); }); await p.goto(URL); await wait(800); return p; };
  const H = await page(), C = await page(), M = MIRA ? await page() : null;
  // el remoto empieza sin nada de la campaña; el anfitrión ya pasó los dos primeros niveles
  await H.evaluate(() => localStorage.setItem('srt_camp', JSON.stringify({ c1: 2, c2: 1 }))); await C.evaluate(() => localStorage.removeItem('srt_camp'));
  await H.fill('[data-pname="0"]', 'Ignacio'); await H.click('#on-host'); await wait(500);
  const code = await H.evaluate(() => Net.code);
  for (const [P, n] of [[C, 'Remoto'], [M, 'Mirón']]) { if (!P) continue; await P.fill('[data-pname="0"]', n); await P.fill('#on-code', code); await P.click('#on-join'); }
  const nDev = MIRA ? 3 : 2;
  for (let i = 0; i < 40; i++) { const ok = await H.evaluate(n => Net.room && Net.room.devices.length === n && Net.room.devices.every(d => d.host || d.open), nDev); if (ok) break; await wait(300); }
  await H.click('[data-ong="sortilegio"]'); await wait(300);
  await H.click('[data-onmode="camp"]'); await wait(300);
  const salaTxt = await H.evaluate(() => document.querySelector('#on-play').textContent.replace(/\s+/g, ' ').slice(0, 300));
  await H.click('#on-go');
  const frameOf = async (p, cond) => { for (let i = 0; i < 120; i++) { const f = p.frames().find(x => x !== p.mainFrame() && x.url() !== 'about:blank'); if (f) { try { if (await f.evaluate(cond)) return f; } catch (e) { /* cargando */ } } await wait(500); } return null; };
  const fh = await frameOf(H, () => typeof UI !== 'undefined' && UI.current === 'camp');
  const fc = await frameOf(C, () => typeof NetPlay !== 'undefined' && !!document.getElementById('netWait'));
  const fm = M ? await frameOf(M, () => typeof NetPlay !== 'undefined' && !!document.getElementById('netWait')) : null;
  const pickTxt = fc ? await fc.evaluate(() => document.getElementById('netWait').textContent.replace(/\s+/g, ' ')) : '';
  const hostGrid = fh ? await fh.evaluate(() => [document.getElementById('c-title').textContent, document.getElementById('c-back').textContent, [...document.querySelectorAll('#c-grid .lvl')].length]) : null;
  console.log('sala:', salaTxt, '\nanfitrión en la Travesía:', JSON.stringify(hostGrid), '· remoto ve:', pickTxt);
  await H.screenshot({ path: OUT + 'netcamp-pick-host.png' }); await C.screenshot({ path: OUT + 'netcamp-pick-remoto.png' });
  // el anfitrión elige el nivel 3 (Bosque de niebla: ya lo tiene abierto)
  await fh.evaluate(() => document.querySelector('#c-grid .lvl[data-lv="2"]').click());
  const inLvl = async (f, lv) => { for (let i = 0; i < 60; i++) { const ok = await f.evaluate(lv => Game.G.mode === 'camp' && Game.G.campLevel === lv && ['count', 'play'].includes(Game.G.state) && !Game.G.attract, lv).catch(() => false); if (ok) return true; await wait(400); } return false; };
  const bothIn = (await inLvl(fh, 2)) && (await inLvl(fc, 2)) && (!fm || await inLvl(fm, 2));
  for (let i = 0; i < 40; i++) { if (await fh.evaluate(() => Game.G.state === 'play')) break; await wait(400); }
  // el anfitrión prende un brasero y aparece una oleada (como al jugar)
  await fh.evaluate(() => { const G = Game.G, o = G.objs.find(o => o.t === 'brazier'); if (o) o.lit = true; const f = G.objs.find(o => o.t === 'lantern'); if (f) f.hp = Math.round(f.maxHp * 0.5); G.units.push(new Creature(G, 'bruma', G.mages[0].x + 200, G.mages[0].y)); });
  await wait(2000);
  const view = async f => f.evaluate(() => { const G = Game.G; return { lit: G.objs.filter(o => (o.t === 'brazier' && o.lit) || (o.t === 'lantern' && o.hp < o.maxHp * 0.6)).length, crit: G.units.filter(u => u instanceof Creature && u.alive).length, lives: G.lives, label: G.L.label(G) }; });
  const vh = await view(fh), vc = await view(fc);
  console.log('nivel 3 en los dos:', bothIn, '· anfitrión', JSON.stringify(vh), '· remoto', JSON.stringify(vc));
  await H.screenshot({ path: OUT + 'netcamp-host.png' }); await C.screenshot({ path: OUT + 'netcamp-remoto.png' });
  // gana el nivel → resultados y estrellas guardadas en los dos aparatos
  await fh.evaluate(() => { const G = Game.G; G.lives = 5; G.roundT = 30; Game.endRound(0, 'win'); });
  let rh = null, rc = null;
  for (let i = 0; i < 40; i++) { await wait(400); rh = await fh.evaluate(() => !document.getElementById('s-results').hidden && document.getElementById('r-title').textContent); rc = await fc.evaluate(() => !document.getElementById('s-results').hidden && document.getElementById('r-title').textContent); if (rh && rc) break; }
  const btn = f => f.evaluate(() => ['r-copaNext', 'r-rematch', 'r-netpick', 'r-hub'].map(id => { const e = document.getElementById(id); return e.hidden ? null : e.textContent; }));
  const bh = await btn(fh), bc = await btn(fc);
  const savedH = await H.evaluate(() => JSON.parse(localStorage.getItem('srt_camp') || '{}')), savedC = await C.evaluate(() => JSON.parse(localStorage.getItem('srt_camp') || '{}')), savedM = M ? await M.evaluate(() => JSON.parse(localStorage.getItem('srt_camp') || '{}')) : {};
  console.log('resultados:', rh, JSON.stringify(bh), '· remoto:', rc, JSON.stringify(bc), '\nguardado anfitrión', JSON.stringify(savedH), '· remoto', JSON.stringify(savedC), MIRA ? '· mirón ' + JSON.stringify(savedM) : '');
  await H.screenshot({ path: OUT + 'netcamp-res-host.png' }); await C.screenshot({ path: OUT + 'netcamp-res-remoto.png' });
  // siguiente nivel para los dos
  await fh.evaluate(() => document.getElementById('r-copaNext').click());
  const next = (await inLvl(fh, 3)) && (await inLvl(fc, 3));
  // y de vuelta a elegir nivel
  await fh.evaluate(() => { Game.endRound(-1, 'lives'); });
  for (let i = 0; i < 30; i++) { await wait(400); if (await fh.evaluate(() => !document.getElementById('s-results').hidden)) break; }
  await fh.evaluate(() => document.getElementById('r-netpick').click()); await wait(2500);
  const backPick = (await fh.evaluate(() => UI.current === 'camp')) && (await fc.evaluate(() => !!document.getElementById('netWait')));
  const ferr = async f => f ? f.evaluate(() => window.__errs.slice(0, 4)).catch(() => ['?']) : [];
  errs.push(...(await ferr(fh)).map(e => 'anfitrión: ' + e), ...(await ferr(fc)).map(e => 'remoto: ' + e));
  const ok = !!hostGrid && /elige el nivel/i.test(pickTxt) && bothIn && vc.lit >= 1 && vc.crit >= 1 && !!rh && !!rc && bh[0] === 'Siguiente nivel' && !bc[0] && bc[3] === 'Volver a la sala' && savedH.c3 >= 1 && savedC.c3 >= 1 && (!MIRA || !savedM.c3) && next && backPick;
  console.log({ pantalla: !!hostGrid, aviso: /elige el nivel/i.test(pickTxt), mismoNivel: bothIn, objetos: vc.lit >= 1, criaturas: vc.crit >= 1, resultados: !!rh && !!rc, guardaLosDos: savedH.c3 >= 1 && savedC.c3 >= 1, siguiente: next, elegirOtraVez: backPick, errores: errs.slice(0, 6) });
  console.log(ok && !errs.length ? 'CAMPAÑA SRT EN LÍNEA OK' : 'CAMPAÑA SRT EN LÍNEA FALLA');
  await b.close();
})();
