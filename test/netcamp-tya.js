// Tira y Afloja · campaña EN LÍNEA (salas y jefes): anfitrión + remoto, cada uno con su almacenamiento (señal por el
// servidor local: cd servidor && npx wrangler dev --port 8799). Comprueba: el anfitrión ve su mapa y el remoto el aviso;
// los dos en la misma sala; los mecanismos llegan al remoto; salir por la puerta → los dos guardan la sala; «Siguiente»
// lleva a los dos; los 6 jefes en línea sin errores y con el remoto viendo lo mismo (vida y posición del jefe).
const { chromium } = require('playwright');
const URL = (process.env.URL || 'http://127.0.0.1:8765/') + '?net=srv&server=' + (process.env.SERVER || 'http://127.0.0.1:8799') + (process.env.RED ? '&' + process.env.RED : '') + '#online', OUT = process.env.OUT || '/tmp/';
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const errs = [];
  const page = async () => { const ctx = await b.newContext({ viewport: { width: 960, height: 540 } }); await ctx.addInitScript(() => { window.__errs = []; if (!window.__autoPick) window.__autoPick = setInterval(() => { try { document.querySelectorAll("#netWait .pf button:not(.no)").forEach(b => b.click()); } catch (e) {} }, 700); addEventListener('error', e => window.__errs.push(String(e.message).slice(0, 200))); }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('c:' + m.text().slice(0, 160)); }); await p.goto(URL); await wait(800); return p; };
  const H = await page(), C = await page();
  await H.evaluate(() => localStorage.setItem('tya_camp', JSON.stringify({ stars: { '1-1': 2, '1-2': 1 }, best: {}, wr: {}, rewards: {} }))); await C.evaluate(() => localStorage.removeItem('tya_camp'));
  await H.fill('[data-pname="0"]', 'Ignacio'); await H.click('#on-host'); await wait(500);
  const code = await H.evaluate(() => Net.code);
  await C.fill('[data-pname="0"]', 'Remoto'); await C.fill('#on-code', code); await C.click('#on-join');
  for (let i = 0; i < 40; i++) { const ok = await H.evaluate(() => Net.room && Net.room.devices.length === 2 && Net.room.devices.every(d => d.host || d.open)); if (ok) break; await wait(300); }
  await H.click('[data-ong="tira-y-afloja"]'); await wait(300);
  await H.click('[data-onmode="campana"]'); await wait(300);
  await H.click('#on-go');
  const frameOf = async (p, cond) => { for (let i = 0; i < 120; i++) { const f = p.frames().find(x => x !== p.mainFrame() && x.url() !== 'about:blank'); if (f) { try { if (await f.evaluate(cond)) return f; } catch (e) { /* cargando */ } } await wait(500); } return null; };
  const fh = await frameOf(H, () => typeof UI !== 'undefined' && UI.current === 'campana');
  const fc = await frameOf(C, () => typeof NetPlay !== 'undefined' && !!document.getElementById('netWait'));
  const pickTxt = fc ? await fc.evaluate(() => document.querySelector('#netWait h2').textContent) : '';
  const map = fh ? await fh.evaluate(() => [document.getElementById('camp-back').textContent, [...document.querySelectorAll('#camp-rows .stg')].filter(b => !b.disabled).length]) : null;
  console.log('mapa del anfitrión:', JSON.stringify(map), '· remoto ve:', pickTxt);
  await H.screenshot({ path: OUT + 'tyacamp-pick-host.png' });
  await fh.evaluate(() => { const b = [...document.querySelectorAll('#camp-rows .stg')].find(x => x.getAttribute('aria-label') === 'Sala 1-3: ' + Campaign.roomOf('1-3').name); b.click(); });
  const inStage = async (f, id) => { for (let i = 0; i < 60; i++) { const ok = await f.evaluate(id => Game.G.net && Game.G.campStage === id && ['countdown', 'play'].includes(Game.G.state) && ARENA.L && (ARENA.L.room ? ARENA.L.room.id === id : true), id).catch(() => false); if (ok) return true; await wait(400); } return false; };
  const both = (await inStage(fh, '1-3')) && (await inStage(fc, '1-3'));
  for (let i = 0; i < 40; i++) { if (await fh.evaluate(() => Game.G.state === 'play')) break; await wait(300); }
  // un mecanismo cambia en el anfitrión → el remoto lo ve
  await fh.evaluate(() => { const o = ARENA.L.objs.find(o => o.kind === 'gate' || o.kind === 'plate' || o.kind === 'lever'); if (o) { if (o.kind === 'gate') o.open = 0.77; else if (o.kind === 'plate') o.pressed = true; else o.on = true; window.__probe = o.id + ':' + o.kind; } });
  await wait(1500);
  const probe = async f => f.evaluate(() => { const o = ARENA.L.objs.find(o => o.kind === 'gate' || o.kind === 'plate' || o.kind === 'lever'); return o ? (o.kind === 'gate' ? +o.open.toFixed(2) : o.kind === 'plate' ? !!o.pressed : !!o.on) : null; });
  const ph = await probe(fh), pc = await probe(fc);
  const clock = async f => f.evaluate(() => Campaign.state ? +Campaign.state.t.toFixed(1) : -1);
  console.log('sala 1-3 en los dos:', both, '· mecanismo anfitrión', ph, 'remoto', pc, '· reloj', await clock(fh), await clock(fc));
  await H.screenshot({ path: OUT + 'tyacamp-host.png' }); await C.screenshot({ path: OUT + 'tyacamp-remoto.png' });
  // los dos a la puerta → sala superada
  await fh.evaluate(() => { const E = ARENA.L.exit; Game.G.players.forEach(p => { p.alive = true; p.stuck = false; p.x = E.x + (p.id ? 10 : -10); p.y = E.y - 30; p.vx = p.vy = 0; }); });
  let rh = null, rc = null;
  for (let i = 0; i < 50; i++) { await wait(400); rh = await fh.evaluate(() => UI.current === 'results' && document.getElementById('r-title').textContent); rc = await fc.evaluate(() => UI.current === 'results' && document.getElementById('r-title').textContent); if (rh && rc) break; await fh.evaluate(() => { const E = ARENA.L.exit; Game.G.players.forEach(p => { if (Game.G.state === 'play') { p.alive = true; p.x = E.x + (p.id ? 10 : -10); p.y = E.y - 30; p.vx = p.vy = 0; } }); }).catch(() => {}); }
  const btn = f => f.evaluate(() => ['btn-next', 'btn-rematch', 'btn-netpick', 'btn-hub'].map(id => { const e = document.getElementById(id); return e.hidden ? null : e.textContent.trim(); }));
  const bh = await btn(fh), bc = await btn(fc);
  const sv = async p => p.evaluate(() => (JSON.parse(localStorage.getItem('tya_camp') || '{}').stars || {})['1-3'] || 0);
  const sh = await sv(H), sc = await sv(C);
  console.log('resultados:', rh, JSON.stringify(bh), '· remoto:', rc, JSON.stringify(bc), '· estrellas 1-3 anfitrión', sh, 'remoto', sc);
  await fh.evaluate(() => document.getElementById('btn-next').click());
  const next = (await inStage(fh, '1-4')) && (await inStage(fc, '1-4'));
  // los seis jefes
  const bosses = [];
  for (let z = 1; z <= 6; z++) {
    await fh.evaluate(id => NetGame.again(id), 'jefe-' + z);
    const okH = await (async () => { for (let i = 0; i < 50; i++) { if (await fh.evaluate(() => Game.G.mode === 'jefe' && Game.G.state === 'play' && !!Jefes.state).catch(() => false)) return true; await wait(300); } return false; })();
    const okC = await (async () => { for (let i = 0; i < 50; i++) { if (await fc.evaluate(() => Game.G.mode === 'jefe' && ['countdown', 'play'].includes(Game.G.state) && !!Jefes.state).catch(() => false)) return true; await wait(300); } return false; })();
    await fh.evaluate(() => { const J = Jefes.state; if (J) { J.hp = Math.max(1, J.maxHp - 2); } });
    await wait(4000);
    const js = async f => f.evaluate(() => { const J = Jefes.state; return J ? { id: J.def.id, hp: J.hp, t: +J.t.toFixed(1), bx: J.body ? Math.round(J.body.x) : null } : null; });
    const a = await js(fh), c = await js(fc);
    bosses.push({ z, okH, okC, host: a, remoto: c, igual: !!(a && c && a.id === c.id && a.hp === c.hp && Math.abs(a.t - c.t) < 1.2) });
    if (z === 4 || z === 6) { await H.screenshot({ path: OUT + `tyacamp-jefe${z}-host.png` }); await C.screenshot({ path: OUT + `tyacamp-jefe${z}-remoto.png` }); }
  }
  console.table(bosses.map(x => ({ z: x.z, ok: x.okH && x.okC, igual: x.igual, host: JSON.stringify(x.host), remoto: JSON.stringify(x.remoto) })));
  const ferr = async f => f ? f.evaluate(() => window.__errs.slice(0, 4)).catch(() => ['?']) : [];
  errs.push(...(await ferr(fh)).map(e => 'anfitrión: ' + e), ...(await ferr(fc)).map(e => 'remoto: ' + e));
  const ok = !!map && /elige la sala/i.test(pickTxt) && both && ph === pc && !!rh && !!rc && !!bh[0] && !bc[0] && bc[3] === 'Volver a la sala' && sh >= 1 && sc >= 1 && next && bosses.every(x => x.okH && x.okC && x.igual);
  console.log({ mapa: !!map, aviso: /elige la sala/i.test(pickTxt), mismaSala: both, mecanismos: ph === pc, resultados: !!rh && !!rc, guardaLosDos: sh >= 1 && sc >= 1, siguiente: next, jefes: bosses.every(x => x.okH && x.okC && x.igual), errores: errs.slice(0, 6) });
  console.log(ok && !errs.length ? 'CAMPAÑA TYA EN LÍNEA OK' : 'CAMPAÑA TYA EN LÍNEA FALLA');
  await b.close();
})();
