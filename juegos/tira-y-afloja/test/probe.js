// Pruebas puntuales de los retos: poner a Fresa en un sitio, hacer una jugada y ver si toma la estrella
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
    const tick = keys => { TYA.over[0] = K(keys); TYA.Game.update(1 / 60); };
    const wait = (n, keys) => { for (let i = 0; i < n; i++) tick(typeof keys === 'function' ? keys() : keys); };
    const until = (cond, keys, max = 240) => { let i = 0; while (!cond() && i++ < max) tick(typeof keys === 'function' ? keys() : keys); return cond(); };
    function setup(i, x, floorY, mass = 3) {
      TYA.UI.show(null, false); Retos.start(i);
      until(() => G.state === 'play', {}, 300);
      const p = P(), d = G.players[1];
      p.reset(x, floorY, mass);
      G.rope.reset(p.x, p.y, d.x, d.y, Math.max(G.rope.len, Math.hypot(p.x - d.x, p.y - d.y) + 40));
      wait(6, {});
    }
    const got = k => G.reto.stars[k].got;
    const res = [];
    const T = (name, fn) => { try { res.push([name, fn()]); } catch (e) { res.push([name, 'ERR ' + e.message]); } };
    // --- salto doble ---
    const dj = (dir) => { wait(1, {}); let i = 0; while (P().vy < -60 && i++ < 60) tick({ jump: true, left: dir < 0, right: dir > 0 }); wait(2, { left: dir < 0, right: dir > 0 }); wait(24, { jump: true, left: dir < 0, right: dir > 0 }); until(() => P().onGround, {}, 120); };
    T('doble 330,300 desde el piso', () => { setup(2, 340, 640); dj(0); return got(0); });
    T('doble 960,150 desde la regla', () => { setup(2, 960, 452); dj(0); return got(1); });
    T('doble 1590,300 desde el piso', () => { setup(2, 1580, 640); dj(0); return got(2); });
    // --- picada ---
    const dive = (dir, holdJ = 30) => { wait(1, {}); wait(holdJ, { jump: true, left: dir < 0, right: dir > 0 }); until(() => P().vy > -150, { left: dir < 0, right: dir > 0 }, 60); wait(1, {}); return until(() => P().onGround || !P().alive, { stick: true }, 120); };
    T('picada 400,560 saltando del piso', () => { setup(5, 400, 640); dive(0, 12); return got(0); });
    T('picada 1346,420 desde los libros', () => { setup(5, 1346, 543); dive(0, 30); return got(1); });
    T('picada 1520,560', () => { setup(5, 1520, 640); dive(0, 12); return got(2); });
    T('aplastón sobre el muñeco en la regla', () => { setup(5, 860, 452); wait(1, {}); wait(24, { jump: true, right: true }); until(() => P().x > 950, { right: true }, 40); until(() => P().onGround || G.reto.cnt.stomp > 0, { stick: true }, 90); return G.reto.cnt.stomp; });
    // --- pared ---
    const wall = (dir) => { // caminar fuera del borde y pegarse a la pared del pupitre
      until(() => !P().onGround, { left: dir < 0, right: dir > 0 }, 90);
      wait(5, { left: dir > 0, right: dir < 0 }); wait(1, {});
      const ok = until(() => P().stuck, { stick: true, left: dir > 0, right: dir < 0 }, 40);
      return ok;
    };
    T('pared izquierda', () => { setup(6, 330, 640); wall(-1); wait(4, { stick: true }); const g = got(0); return { g, y: Math.round(P().y), x: Math.round(P().x), n: P().stuckN }; });
    T('pared izquierda y volver arriba', () => {
      setup(6, 330, 640); wall(-1); wait(4, { stick: true });
      wait(1, { stick: true, jump: true }); wait(10, { jump: true }); wait(30, { jump: true, right: true });
      wait(1, { right: true }); wait(20, { jump: true, right: true }); until(() => P().onGround || !P().alive, { right: true }, 120);
      return { alive: P().alive, x: Math.round(P().x), y: Math.round(P().y), phase: G.reto.phase };
    });
    T('pared derecha', () => { setup(6, 1590, 640); wall(1); wait(4, { stick: true }); return got(1); });
    // --- al filo ---
    T('al filo: tirar hasta salvarse', () => { TYA.UI.show(null, false); Retos.start(7); until(() => G.state === 'play', {}, 300); until(() => G.reto.cnt.saved > 0 || G.reto.phase !== 'play', { pull: true }, 400); return { saved: G.reto.cnt.saved, phase: G.reto.phase, t: +G.reto.t.toFixed(1), m: +P().mass.toFixed(1) }; });
    T('al filo: del pupitre al estante (peso 2)', () => { setup(7, 320, 640, 2); wait(1, {}); wait(30, { jump: true, left: true }); until(() => P().onGround || !P().alive, { left: P().x > 230 }, 120); wait(10, {}); return { star: got(0), x: Math.round(P().x), y: Math.round(P().y) }; });
    // --- rebotes ---
    T('rebotes: colchoneta izq 687,170', () => { setup(9, 687, 614); wait(90, {}); return got(0); });
    T('rebotes: tablero 960,90', () => { setup(9, 960, 232); wait(1, {}); wait(30, { jump: true }); until(() => P().onGround, {}, 90); return got(4); });
    T('rebotes: llegar al tablero desde la colchoneta', () => { setup(9, 700, 614); let i = 0; while (i++ < 200 && !(P().onGround && P().y < 240)) tick({ right: P().vy > 0 && P().x < 940 }); return { x: Math.round(P().x), y: Math.round(P().y), star: got(0) }; });
    T('rebotes: viga 435,320', () => { setup(9, 435, 430); wait(1, {}); wait(14, { jump: true }); until(() => P().onGround, {}, 90); return got(2); });
    // --- contrarreloj: estante derecho ---
    T('contrarreloj: estante 1640,318', () => { setup(10, 1600, 640); G.reto.stars.slice(0, 5).forEach(s => { s.got = true; }); wait(1, {}); wait(30, { jump: true, right: true }); until(() => P().onGround || !P().alive, { right: P().x < 1640 }, 120); wait(5, {}); return { star: got(5), x: Math.round(P().x), y: Math.round(P().y), alive: P().alive }; });
    // --- gran final ---
    T('final: tirachinas desde el borrador', () => { setup(11, 1000, 606); G.reto.stars[0].got = true; until(() => P().stuck, { stick: true }, 20); until(() => P().charge >= 1, { stick: true, pull: true }, 200); wait(30, {}); return got(1); });
    T('final: tirachinas desde el piso derecho', () => { setup(11, 1110, 640); G.reto.stars[0].got = true; until(() => P().stuck, { stick: true }, 20); until(() => P().charge >= 1, { stick: true, pull: true }, 200); wait(30, {}); return got(1); });
    T('final: salto doble 330,300', () => { setup(11, 340, 640); G.reto.stars[0].got = G.reto.stars[1].got = true; dj(0); return got(2); });
    T('final: aplastón sobre los libros', () => { setup(11, 700, 640); G.reto.stars.forEach(s => { s.got = true; }); wait(1, {}); wait(30, { jump: true, left: true }); until(() => P().x < 600, { left: true }, 40); until(() => P().onGround || G.reto.phase !== 'play', { stick: true }, 90); return { stomp: G.reto.cnt.stomp, phase: G.reto.phase }; });
    TYA.over[0] = null;
    return res;
  });
  for (const r of out) console.log(JSON.stringify(r));
  console.log('ERR', errors.join('\n'));
  await browser.close();
})();
