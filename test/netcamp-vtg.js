// VÉRTIGO · Vuelta al mundo EN LÍNEA (de a dos): anfitrión + remoto, cada uno con su almacenamiento (señal por el
// servidor local: cd servidor && npx wrangler dev --port 8799). Comprueba: el anfitrión ve su mapa (modo en línea) y el
// remoto el aviso; el reto elegido arranca igual en los dos (pista, máquina, piezas sembradas: tunjos, troncos,
// géiseres, campeón); lo recogido llega al remoto; al terminar los dos ven las estrellas y cada aparato las guarda;
// «Siguiente reto» lleva a los dos; jefes (vida, vagones, ataques) y demás retos sin errores.
// Uso: VIEW=400x225 node test/netcamp-vtg.js   (RETOS=n6,w10,… para elegir cuáles se prueban después del primero)
const { chromium } = require('playwright');
const URL = (process.env.URL || 'http://127.0.0.1:8765/') + '?net=srv&server=' + (process.env.SERVER || 'http://127.0.0.1:8799') + '#online', OUT = process.env.OUT || '/tmp/';
const VIEW = (process.env.VIEW || '400x225').split('x').map(Number);
const RETOS = (process.env.RETOS || 'n6,w10,n15,w17,n18,n22,n11,w24').split(',');
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [];
  const page = async who => { const ctx = await b.newContext({ viewport: { width: VIEW[0], height: VIEW[1] } }); await ctx.addInitScript(() => { try { localStorage.setItem('vtg_gq', '0'); } catch (e) { /* nada */ } window.__errs = []; addEventListener('error', e => window.__errs.push(String(e.message).slice(0, 200))); });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(who + ': ' + e.message)); await p.goto(URL); await wait(800); return p; };
  const H = await page('anfitrión'), C = await page('remoto');
  // el anfitrión tiene abierta toda la vuelta (una estrella en cada reto menos el final); el remoto no tiene nada
  await H.evaluate(() => { const ids = ['w1', 'w2', 'w3', 'n4', 'w5', 'n6', 'w7', 'w8', 'w9', 'w10', 'n11', 'w12', 'w13', 'w14', 'n15', 'n16', 'w17', 'n18', 'w19', 'n20', 'w21', 'n22', 'n23']; const s = {}; ids.forEach(i => { s[i] = 1; }); s.n4 = 0; localStorage.setItem('vtg_world', JSON.stringify(s)); });
  await C.evaluate(() => localStorage.removeItem('vtg_world'));
  await H.fill('[data-pname="0"]', 'Ignacio'); await H.click('#on-host'); await wait(500);
  const code = await H.evaluate(() => Net.code);
  await C.fill('[data-pname="0"]', 'Remoto'); await C.fill('#on-code', code); await C.click('#on-join');
  for (let i = 0; i < 40; i++) { if (await H.evaluate(() => Net.room && Net.room.devices.length === 2 && Net.room.devices.every(d => d.host || d.open))) break; await wait(300); }
  await H.click('[data-ong="vertigo"]'); await wait(300);
  await H.click('[data-onseg="mode"] [data-v="world"]'); await wait(400);
  await H.click('#on-go');
  const frameOf = async (p, cond) => { for (let i = 0; i < 160; i++) { const f = p.frames().find(x => x !== p.mainFrame() && x.url() !== 'about:blank'); if (f) { try { if (await f.evaluate(cond)) return f; } catch (e) { /* cargando */ } } await wait(500); } return null; };
  const fh = await frameOf(H, () => typeof UI !== 'undefined' && !document.getElementById('s-world').hidden);
  const fc = await frameOf(C, () => typeof NetPlay !== 'undefined' && !!document.getElementById('netWait') && !document.getElementById('netWait').hidden);
  const pickTxt = fc ? await fc.evaluate(() => document.querySelector('#netWait h2').textContent) : '';
  const map = fh ? await fh.evaluate(() => ({ back: document.querySelector('#s-world .whead [data-act="back"]').textContent, players: document.getElementById('wPlayers').hidden, note: (document.querySelector('#wPanel .wlock') || {}).textContent || '' })) : null;
  console.log('mapa del anfitrión:', JSON.stringify(map), '· remoto ve:', pickTxt);
  await H.screenshot({ path: OUT + 'vtgworld-pick-host.png' });
  const idx = id => fh.evaluate(id => CAMPAIGN.findIndex(C => C.id === id), id);
  const inRace = async (f, ch) => { for (let i = 0; i < 120; i++) { const ok = await f.evaluate(ch => Game.mode === 'race' && Game.R && Game.cfg && Game.cfg.mode === 'world' && Game.cfg.ch === ch && Game.R.rules && Game.R.rules.world && Game.R.rules.world === CAMPAIGN[ch], ch).catch(() => false); if (ok) return true; await wait(500); } return false; };
  const racing = async f => { for (let i = 0; i < 120; i++) { if (await f.evaluate(() => Game.R.state === 'race' && Game.R.time > 1.5).catch(() => false)) return true; await wait(500); } return false; };
  const look = f => f.evaluate(() => { const R = Game.R, bz = R.bz || []; return { track: R.track.def.id, cars: R.cars.length, bots: R.cars.filter(c => c.bot).map(c => c.pid).join(','), picks: bz.filter(z => z.k === 'pick').length, pick0: bz.filter(z => z.k === 'pick').slice(0, 2).map(z => [Math.round(z.s), Math.round(z.u * 10) / 10]), logs: bz.filter(z => z.k === 'tronco').length,
    gey: (R.xGeysers || []).length, gey0: (R.xGeysers || []).slice(0, 2).map(g => [Math.round(g.s), Math.round(g.u * 10) / 10]), storm: !!R.storm, elite: (R.cars.find(c => c.elite) || {}).pid || null, boss: R.boss ? R.boss.def.id : null, items: R.boxes.length }; });
  // 1) recolección de tunjos en El Dorado (n4): todo el ciclo
  const n4 = await idx('n4');
  await fh.evaluate(i => { const b = document.querySelector(`[data-wplay="${i}"]`); if (b) b.click(); else NetGame.pick(i); }, n4);
  const both = (await inRace(fh, n4)) && (await inRace(fc, n4)); await racing(fh); await racing(fc);
  const l1h = await look(fh), l1c = await look(fc);
  console.log('n4 en los dos:', both, '· igual:', JSON.stringify(l1h) === JSON.stringify(l1c), JSON.stringify(l1h));
  // el anfitrión «recoge» 3 tunjos → el remoto los ve recogidos y la cuenta del equipo
  await fh.evaluate(() => { const R = Game.R, me = R.cars.find(c => !c.bot), P = R.bz.filter(z => z.k === 'pick'); for (const z of P.slice(0, 3)) { me.s = z.s; me.u = z.u; me.h = z.h; Challenge.takePick(R, z, me); } R.teamN = (R.teamN || 0) + 3; /* (la cuenta la lleva el paso del reto; aquí a mano) */ });
  await wait(2500);
  const got = f => f.evaluate(() => ({ gone: Game.R.bz.filter(z => z.k === 'pick' && z.gone > 0).map(z => z.id).join(','), team: Game.R.teamN || 0 }));
  const gh = await got(fh), gc = await got(fc);
  console.log('recogidos anfitrión', JSON.stringify(gh), '· remoto', JSON.stringify(gc));
  await H.screenshot({ path: OUT + 'vtgworld-n4-host.png' }); await C.screenshot({ path: OUT + 'vtgworld-n4-remoto.png' });
  // final: el equipo llega a la meta rápido (3 estrellas)
  await fh.evaluate(() => { const R = Game.R; R.teamN = 99; for (const c of R.cars) if (!c.bot) c.lessonT = Math.max(1, R.time); });
  const res = async f => f.evaluate(() => !document.getElementById('s-results').hidden && { title: document.getElementById('resTitle').textContent, btn: ['resMain', 'resRep', 'resAlt', 'resHub'].map(id => document.getElementById(id).hidden ? null : document.getElementById(id).textContent) });
  let rh = null, rc = null; for (let i = 0; i < 60 && !(rh && rc); i++) { await wait(500); rh = await res(fh); rc = await res(fc); }
  const sv = p => p.evaluate(() => (JSON.parse(localStorage.getItem('vtg_world') || '{}')).n4 || 0);
  const sh = await sv(H), sc = await sv(C);
  console.log('resultados anfitrión', JSON.stringify(rh), '· remoto', JSON.stringify(rc), '· estrellas n4: anfitrión', sh, 'remoto', sc);
  await H.screenshot({ path: OUT + 'vtgworld-res-host.png' }); await C.screenshot({ path: OUT + 'vtgworld-res-remoto.png' });
  // siguiente reto para todos
  await fh.evaluate(() => document.getElementById('resMain').click());
  const nx = n4 + 1, next = (await inRace(fh, nx)) && (await inRace(fc, nx));
  console.log('siguiente reto en los dos:', next);
  // 2) los demás retos: misma siembra, jefes y piezas sincronizados
  const rows = [];
  for (const id of RETOS) {
    const i = await idx(id); await fh.evaluate(i => NetGame.pick(i), i);
    const ok = (await inRace(fh, i)) && (await inRace(fc, i)); await racing(fh); await racing(fc);
    const a = await look(fh), c = await look(fc);
    let boss = null;
    if (a.boss) {
      // daño en el anfitrión (y un vagón suelto en el tren) → el remoto lo ve; el jefe está más o menos en el mismo sitio
      await fh.evaluate(() => { const R = Game.R, B = R.boss; Boss.damage(R, B, Math.round(B.max * 0.3), R.cars.find(c => !c.bot), 'rocket'); if (B.def.id === 'tren') Boss.attack(R, B, 'wagon', R.cars.filter(c => !c.bot)); else Boss.attack(R, B, B.def.atk[0], R.cars.filter(c => !c.bot)); });
      await wait(3500);
      const bs = f => f.evaluate(() => { const B = Game.R.boss; return { hp: Math.round(B.hp), d: Math.round(B.d), segs: B.segs.filter(g => g.on).length, phase: B.phase, dz: Game.R.bz.filter(z => z.id > 10000).map(z => z.k).sort().join(','), hist: Math.round(B.hist[B.head] * 10) / 10 }; });
      const bh = await bs(fh), bc = await bs(fc);
      boss = { h: bh, c: bc, igual: bh.hp === bc.hp && bh.segs === bc.segs && Math.abs(bh.d - bc.d) < 25 };
    } else await wait(2500);
    // troncos: más o menos en el mismo sitio
    let logs = null; if (a.logs) { const lp = f => f.evaluate(() => Game.R.bz.filter(z => z.k === 'tronco').slice(0, 3).map(z => Math.round(z.s))); const x = await lp(fh), y = await lp(fc); logs = x.every((s, k) => Math.abs(s - y[k]) < 8); }
    const same = JSON.stringify(a) === JSON.stringify(c);
    rows.push({ id, ok, same, boss, logs, a: JSON.stringify(a).slice(0, 150) });
    await H.screenshot({ path: OUT + `vtgworld-${id}-host.png` }); await C.screenshot({ path: OUT + `vtgworld-${id}-remoto.png` });
  }
  for (const r of rows) console.log(r.id, '· arranca', r.ok, '· igual', r.same, r.boss ? '· jefe ' + JSON.stringify(r.boss) : '', r.logs != null ? '· troncos ' + r.logs : '', '·', r.a);
  // reto «sin chocar»: los choques cuentan (en el anfitrión) y llegan al remoto
  const ferr = async f => f ? f.evaluate(() => window.__errs.slice(0, 4)).catch(() => ['?']) : [];
  errs.push(...(await ferr(fh)).map(e => 'anfitrión: ' + e), ...(await ferr(fc)).map(e => 'remoto: ' + e));
  const pst = await fc.evaluate(() => JSON.stringify(NetGame.pst)).catch(() => '');
  console.log('predicción remoto:', pst);
  const ok = !!map && map.players && /sala/i.test(map.back) && /elige el reto/i.test(pickTxt) && both && JSON.stringify(l1h) === JSON.stringify(l1c) && l1h.picks > 10 && gh.gone === gc.gone && gc.gone.split(',').length === 3 && gh.team === gc.team && gh.team >= 3
    && !!rh && !!rc && /★/.test(rh.title) && /★/.test(rc.title) && rh.btn[0] === 'Siguiente reto (todos)' && !!rh.btn[1] && rh.btn[2] === 'Elegir reto' && !rc.btn[0] && !rc.btn[1] && !rc.btn[2] && rc.btn[3] === 'Volver a la sala' && sh === 3 && sc === 3 && next
    && rows.every(r => r.ok && r.same && (!r.boss || r.boss.igual) && r.logs !== false);
  console.log({ mapa: !!map, aviso: /elige el reto/i.test(pickTxt), mismoReto: both, siembraIgual: JSON.stringify(l1h) === JSON.stringify(l1c), recogidos: gh.gone === gc.gone, resultados: !!rh && !!rc, guardanLosDos: sh === 3 && sc === 3, siguiente: next, retos: rows.every(r => r.ok && r.same), jefes: rows.filter(r => r.boss).every(r => r.boss.igual), errores: errs.slice(0, 6) });
  console.log(ok && !errs.length ? 'VUELTA AL MUNDO EN LÍNEA OK' : 'VUELTA AL MUNDO EN LÍNEA FALLA');
  await b.close();
})();
