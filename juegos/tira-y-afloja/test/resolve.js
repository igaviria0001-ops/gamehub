// ¿Se pueden superar los retos? Un "jugador de guion" sencillo intenta cada uno.
// Uso: node resolve.js [índices separados por coma]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = []; page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1000);
  const only = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
  const out = await page.evaluate(only => {
    const G = TYA.Game.G;
    const K = o => Object.assign({ left: false, right: false, jump: false, stick: false, pull: false, release: false }, o || {});
    const P = () => G.players[0];
    let frames = 0, log = []; const DEBUG = only && only.length === 1;
    const tick = keys => { TYA.over[0] = K(keys); TYA.Game.update(1 / 60); frames++; };
    const r = () => G.reto;
    const alive = () => r() && r().phase === 'play';
    // acciones
    const wait = (n, keys) => { for (let i = 0; i < n && alive(); i++) tick(keys); };
    const until = (cond, keys, max = 240) => { let i = 0; while (alive() && !cond() && i++ < max) tick(typeof keys === 'function' ? keys() : keys); return cond(); };
    let stall = 0;
    const go = (x, extra = {}, tol = 10, max = 300) => { stall = 0; go.lx = undefined; const ok = until(() => Math.abs(P().x - x) < tol, () => {
      // si algo bloquea el paso, saltarlo
      const moved = Math.abs(P().x - (go.lx ?? P().x + 9)); go.lx = P().x;
      if (P().onGround && moved < 0.8) stall++; else if (stall < 6) stall = 0; else stall++;
      const j = stall > 5 && stall < 26;
      if (stall > 30) stall = 0;
      if (DEBUG && frames % 8 === 0) log.push(`  ${frames}: ${Math.round(P().x)},${Math.round(P().y)} vx=${Math.round(P().vx)} g=${P().onGround} st=${stall} rope=${G.rope.strain.toFixed(2)}`);
      return Object.assign({ left: P().x > x, right: P().x < x, jump: j }, extra);
    }, max); wait(4, {}); ground(); if (DEBUG) log.push(`go ${x} -> ${Math.round(P().x)},${Math.round(P().y)} ok=${ok} f=${frames}`); return ok; };
    const settle = () => until(() => P().onGround && Math.abs(P().vx) < 30, {}, 120);
    const jumpTo = (dir, hold = 30) => { wait(1, {}); wait(hold, { jump: true, left: dir < 0, right: dir > 0 }); };
    const ground = (keys = {}) => until(() => P().onGround, keys, 200);
    const sling = (pullMax = 160) => {
      until(() => P().stuck, { stick: true }, 30);
      until(() => P().charge >= 1, { stick: true, pull: true }, pullMax);
      wait(1, { stick: false });
    };
    const massTo = (m) => { if (P().mass > m) until(() => P().mass <= m, { release: true }, 200); else until(() => P().mass >= m, { pull: true }, 200); };
    const startR = i => { TYA.UI.show(null, false); Retos.start(i); frames = 0; until(() => G.state === 'play', {}, 300); frames = 0; };
    const S = {
      0() { // saltos
        go(574); jumpTo(0); ground(); // libros
        go(380); settle();
        go(560); jumpTo(0); ground();
        go(860); jumpTo(1, 30); ground({ right: true });
        go(1346); jumpTo(0); ground(); go(1540);
      },
      1() { // alto vuelo
        massTo(1.6);
        go(574); jumpTo(0, 40); ground();
        go(1346); jumpTo(0, 40); ground();
        go(900); jumpTo(1, 40); ground(); go(960); jumpTo(0, 40); ground();
      },
      2() { // salto doble
        go(960); jumpTo(0); ground(); // a la regla
        jumpTo(0, 26); wait(1, {}); wait(20, { jump: true }); ground();
        go(330, {}, 12, 400); jumpTo(0, 26); wait(1, {}); wait(20, { jump: true }); ground();
        go(1590, {}, 12, 400); jumpTo(0, 26); wait(1, {}); wait(20, { jump: true }); ground();
      },
      3() { // embestida (gimnasio, muñeco a la izquierda)
        for (let k = 0; k < 3; k++) { go(570, {}, 15); until(() => r().cnt.ram > k, { left: true }, 120); wait(8, { right: true }); }
      },
      4() { // tirachinas
        go(574); jumpTo(0); ground(); // libros
        go(560); settle(); sling(); ground({}); settle();
        go(1346, {}, 10, 400); jumpTo(0); ground(); go(1360); settle(); sling(); ground(); settle();
        massTo(1.5); go(300, {}, 10, 400); jumpTo(-1, 30); ground({ left: true }); go(221); settle(); sling(); ground();
      },
      5() { // picada
        go(930); jumpTo(0); ground(); go(860); jumpTo(1, 30); until(() => P().vy > 0, {}, 60); until(() => !P().alive || P().onGround || r().cnt.stomp > 0, { stick: true, right: P().x < 960 }, 90); ground();
        go(470, {}, 10, 400); jumpTo(-1, 16); until(() => P().vy > -100, {}, 60); wait(1, {}); until(() => P().onGround, { stick: true, left: P().x > 400 }, 90);
        go(1346, {}, 10, 400); jumpTo(0); ground(); jumpTo(0, 30); until(() => P().vy > 0, {}, 60); wait(1, {}); until(() => P().onGround, { stick: true }, 90);
        go(1440, {}, 10, 300); jumpTo(1, 16); until(() => P().vy > -100, {}, 60); wait(1, {}); until(() => P().onGround, { stick: true, right: P().x < 1520 }, 90);
      },
      6() { // pared
        go(300); until(() => !P().onGround, { left: true }, 60); wait(6, { right: true }); wait(1, {}); until(() => P().stuck, { stick: true, right: true }, 60); until(() => r().stars[0].got, { stick: true }, 20);
        wait(2, { stick: true, jump: true }); wait(14, { jump: true, right: true }); wait(1, { right: true }); wait(12, { jump: true, right: true }); ground({ right: true });
        go(1620, {}, 10, 500); until(() => !P().onGround, { right: true }, 60); wait(6, { left: true }); wait(1, {}); until(() => P().stuck, { stick: true, left: true }, 60); until(() => r().stars[1].got, { stick: true }, 20);
      },
      7() { // al filo
        until(() => P().onGround && P().y < 640, { pull: true }, 400); wait(70, { pull: false, right: true });
        massTo(1.8); go(300, {}, 10, 300); jumpTo(-1, 30); ground({ left: true }); go(221); settle();
      },
      8() { // a la caneca: correr a embestir varias veces hacia la derecha
        for (let k = 0; k < 16 && alive(); k++) {
          const d = G.players[1];
          go(d.x - 260, {}, 20, 200); until(() => !alive() || G.players[1].stun > 0, { right: true }, 90); wait(10, {});
        }
      },
      9() { // rebotes
        go(687, {}, 10); wait(80, {}); // rebota en la colchoneta
        until(() => P().y < 230, { right: P().x < 880 }, 200); ground({ right: P().x < 960 });
        jumpTo(0, 40); ground();
        go(1233, {}, 10, 300); wait(80, {}); ground();
        go(1485, {}, 10, 300); jumpTo(0, 20); ground(); jumpTo(0, 20); ground();
        go(435, {}, 10, 500); jumpTo(0, 20); ground(); jumpTo(0, 20); ground();
      },
    };
    const res = {};
    const trace = [];
    const _tick = tick;
    if (only && only.length === 1) { const t0 = tick; }
    for (let i = 0; i < Retos.LIST.length; i++) {
      if (only && !only.includes(i)) continue;
      if (!S[i]) continue;
      startR(i);
      try { S[i](); } catch (e) { res[i] = 'error ' + e.message; continue; }
      wait(30, {});
      const R = G.reto;
      if (DEBUG) res.log = log;
      res[i] = { id: R.def.id, phase: R.phase, t: +(R.result ? R.result.t : R.t).toFixed(1), stars: R.stars.map(s => s.got ? 1 : 0).join(''), cnt: JSON.stringify(R.cnt), p: [Math.round(P().x), Math.round(P().y), +P().mass.toFixed(1)] };
    }
    TYA.over[0] = null;
    return res;
  }, only);
  for (const k in out) console.log(k, JSON.stringify(out[k]));
  console.log('ERR', errors.join('\n'));
  await browser.close();
})();
