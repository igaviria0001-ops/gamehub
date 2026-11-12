// Segunda ronda de pruebas puntuales de los retos (posiciones nuevas, aplastones y flujos completos)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = []; page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1000);
  const out = await page.evaluate(() => {
    const G = TYA.Game.G;
    const K = o => Object.assign({ left: false, right: false, jump: false, stick: false, pull: false, release: false }, o || {});
    const P = () => G.players[0];
    let trace = null;
    const tick = keys => { TYA.over[0] = K(keys); TYA.Game.update(1 / 60); if (trace) trace.push(`${Math.round(P().x)},${Math.round(P().y)} vy${Math.round(P().vy)} aj${P().airJumps} g${P().onGround ? 1 : 0} d${P().diveT > 0 ? 1 : 0} ${Object.keys(K(keys)).filter(k => K(keys)[k]).join('+')}`); };
    const wait = (n, keys) => { for (let i = 0; i < n; i++) tick(typeof keys === 'function' ? keys() : keys); };
    const until = (cond, keys, max = 240) => { let i = 0; while (!cond() && i++ < max) tick(typeof keys === 'function' ? keys() : keys); return cond(); };
    function setup(i, x, floorY, mass = 3, keepRope = false) {
      TYA.UI.show(null, false); Retos.start(i);
      until(() => G.state === 'play', {}, 300);
      if (x === null) return;
      const p = P(), d = G.players[1];
      p.reset(x, floorY, mass);
      if (!keepRope) G.rope.reset(p.x, p.y, d.x, d.y, Math.max(G.rope.len, Math.hypot(p.x - d.x, p.y - d.y) + 40));
      else G.rope.reset(p.x, p.y, d.x, d.y, G.rope.len);
      wait(6, {});
    }
    const got = k => G.reto.stars[k].got;
    const res = [];
    const T = (name, fn) => { try { res.push([name, fn()]); } catch (e) { res.push([name, 'ERR ' + e.message]); } };
    const dj = (dir = 0) => { wait(1, {}); wait(4, { jump: true, left: dir < 0, right: dir > 0 }); let i = 0; while (P().vy < -60 && i++ < 60) tick({ jump: true, left: dir < 0, right: dir > 0 }); wait(2, { left: dir < 0, right: dir > 0 }); wait(24, { jump: true, left: dir < 0, right: dir > 0 }); until(() => P().onGround, {}, 120); };
    const fullJump = (dir = 0, n = 30) => { wait(1, {}); wait(n, { jump: true, left: dir < 0, right: dir > 0 }); until(() => P().onGround || !P().alive, { left: dir < 0, right: dir > 0 }, 120); };
    // salto doble (encima de libros y regla)
    T('doble 574,190 desde libros', () => { setup(2, 574, 543); dj(); return got(0); });
    T('doble 960,90 desde la regla', () => { setup(2, 960, 452); dj(); return got(1); });
    T('doble 1346,190 desde libros', () => { setup(2, 1346, 543); dj(); return got(2); });
    T('doble 574,190 SIN doble (no debe)', () => { setup(2, 574, 543); fullJump(); return got(0); });
    // alto vuelo
    T('alto: centro 960,50 a peso 1.6 desde la regla', () => { setup(1, 960, 452, 1.6); fullJump(); return got(1); });
    T('alto: centro a peso 3 (no debe)', () => { setup(1, 960, 452, 3); fullJump(); return got(1); });
    T('alto: flujo estante izq (aflojar a 1.4, ir al borde, saltar)', () => {
      setup(1, null); until(() => P().mass <= 1.4, { release: true }, 200);
      until(() => P().x < 300, { left: true, jump: P().x < 470 && P().x > 440 }, 300);
      wait(1, {}); wait(30, { jump: true, left: true }); until(() => P().onGround || !P().alive, { left: P().x > 221 }, 120); wait(16, { jump: true }); until(() => P().onGround || !P().alive, {}, 120);
      return { star: got(0), x: Math.round(P().x), y: Math.round(P().y), rope: Math.round(G.rope.len), alive: P().alive };
    });
    // pared
    T('pared izq (estrella 228,665)', () => { setup(6, 330, 640); until(() => !P().onGround, { left: true }, 90); wait(5, { right: true }); wait(1, {}); until(() => P().stuck, { stick: true, right: true }, 40); wait(4, { stick: true }); return { g: got(0), y: Math.round(P().y) }; });
    T('pared der (estrella 1692,665)', () => { setup(6, 1590, 640); until(() => !P().onGround, { right: true }, 90); wait(5, { left: true }); wait(1, {}); until(() => P().stuck, { stick: true, left: true }, 40); wait(4, { stick: true }); return { g: got(1), y: Math.round(P().y) }; });
    // picada: aplastón sobre el muñeco de la regla
    T('aplastón en la regla', () => {
      setup(5, 820, 452); trace = [];
      wait(1, {}); wait(26, { jump: true, right: P().x < 900 });
      until(() => P().x > 940, () => ({ right: P().x < 940 }), 40); wait(1, { left: true });
      until(() => P().onGround || G.reto.cnt.stomp > 0, { stick: true }, 90);
      const tr = trace.filter((_, k) => k % 3 === 0).slice(0, 30); trace = null;
      return { stomp: G.reto.cnt.stomp, ram: G.reto.cnt.ram, tr };
    });
    // final
    T('final: salto doble 330,300', () => { setup(11, 340, 640); G.reto.stars[0].got = G.reto.stars[1].got = true; trace = []; dj(); const tr = trace.filter((_, k) => k % 4 === 0).slice(0, 18); trace = null; return { g: got(2), tr }; });
    T('final: pared 228,665', () => { setup(11, 330, 640); [0, 1, 2].forEach(k => { G.reto.stars[k].got = true; }); until(() => !P().onGround, { left: true }, 90); wait(5, { right: true }); wait(1, {}); until(() => P().stuck, { stick: true, right: true }, 40); wait(4, { stick: true }); return got(3); });
    T('final: aplastón sobre los libros', () => {
      setup(11, 760, 640); G.reto.stars.forEach(s => { s.got = true; }); trace = [];
      wait(1, {}); wait(30, () => ({ jump: true, left: P().x > 610 })); until(() => P().x < 600, () => ({ left: P().x > 600 }), 60); wait(1, { right: true });
      until(() => P().onGround || G.reto.phase !== 'play', { stick: true }, 90);
      const tr = trace.filter((_, k) => k % 3 === 0).slice(0, 30); trace = null;
      return { stomp: G.reto.cnt.stomp, phase: G.reto.phase, tr };
    });
    // al filo completo
    T('al filo completo', () => {
      setup(7, null); const marks = [];
      until(() => G.reto.cnt.saved > 0 || G.reto.phase !== 'play', { pull: true }, 400); marks.push(['salvada', Math.round(P().x), Math.round(P().y), +G.reto.t.toFixed(1)]);
      until(() => P().mass <= 1.4, { release: true }, 200); marks.push(['aflojó', Math.round(P().x), Math.round(P().y), Math.round(G.rope.len)]);
      until(() => P().x < 300 || G.reto.phase !== 'play', { left: true }, 300); marks.push(['borde', Math.round(P().x), Math.round(P().y)]);
      wait(1, {}); wait(30, { jump: true, left: true }); until(() => P().onGround || !P().alive, { left: P().x > 221 }, 120);
      wait(1, {}); wait(16, { jump: true }); until(() => P().onGround || !P().alive, {}, 120);
      return { marks, phase: G.reto.phase, t: +(G.reto.result ? G.reto.result.t : G.reto.t).toFixed(1), star: got(0), x: Math.round(P().x), y: Math.round(P().y), rope: Math.round(G.rope.len) };
    });
    // rebotes
    T('rebotes 720,200 (colchoneta der. de la izq.)', () => { setup(9, 730, 614); trace = []; wait(100, {}); const tr = trace.filter((_, k) => k % 5 === 0); trace = null; return { g: got(0), tr }; });
    T('rebotes 1200,200', () => { setup(9, 1190, 614); wait(100, {}); return got(1); });
    // contrarreloj: alcanzables
    T('contra 960,200 desde la regla', () => { setup(10, 960, 452); G.reto.stars.slice(0, 2).forEach(s => { s.got = true; }); fullJump(); return got(2); });
    T('contra 1180,380 en la punta de la regla', () => { setup(10, 1150, 452); G.reto.stars.slice(0, 5).forEach(s => { s.got = true; }); wait(4, {}); return got(5); });
    T('contra 960,560 sobre el borrador', () => { setup(10, 960, 606); G.reto.stars.slice(0, 6).forEach(s => { s.got = true; }); wait(4, {}); return got(6); });
    TYA.over[0] = null;
    return res;
  });
  for (const r of out) console.log(JSON.stringify(r));
  console.log('ERR', errors.join('\n'));
  await browser.close();
})();
