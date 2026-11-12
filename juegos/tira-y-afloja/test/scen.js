const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(800);
  const out = await page.evaluate(() => {
    const G = TYA.Game.G, Game = TYA.Game;
    const I = (o = {}) => Object.assign({ left: false, right: false, jump: false, stick: false, pull: false, release: false }, o);
    const setup = (ax, bx, ma = 3, mb = 3, len = 400) => {
      Game.startMatch('caneca', false);
      const [A, B] = G.players;
      A.reset(ax, ARENA.deskY, ma); B.reset(bx, ARENA.deskY, mb);
      G.rope.reset(A.x, A.y, B.x, B.y, len);
      G.state = 'play'; G.canControl = true; G.stateT = 0; G.roundT = 0;
      for (let i = 0; i < 20; i++) Game.update(1 / 60);
    };
    const run = (sec, a, b, log) => { for (let i = 0; i < sec * 60; i++) { TYA.over[0] = a; TYA.over[1] = b; Game.update(1 / 60); if (log) log(i); } };
    const snap = () => G.players.map(p => ({ x: Math.round(p.x), y: Math.round(p.y), vx: Math.round(p.vx), vy: Math.round(p.vy), m: +p.mass.toFixed(2), st: p.stuck, stun: +p.stun.toFixed(2), alive: p.alive, sticky: +p.sticky.toFixed(2), grip: +p.gripLoad.toFixed(2) }));
    const R = {};
    // 1) tug: A pegada, B camina a la derecha
    setup(650, 730, 3, 3, 120);
    run(0.3, I({ stick: true }), I());
    run(1.5, I({ stick: true }), I({ right: true }));
    R.tug = { p: snap(), strain: +G.rope.strain.toFixed(2), T: Math.round(G.rope.tension) };
    // 2) tirachinas: A se suelta
    let maxVA = 0, rams0 = G.players[0].stats.rams + G.players[0].stats.slings, stunB = 0;
    run(1.2, I(), I({ right: true }), () => { maxVA = Math.max(maxVA, Math.hypot(G.players[0].vx, G.players[0].vy)); stunB = Math.max(stunB, G.players[1].stun); });
    R.sling = { maxVA: Math.round(maxVA), slings: G.players[0].stats.slings, rams: G.players[0].stats.rams, stunB: +stunB.toFixed(2), p: snap() };
    // 3) colgar: B se cae por el borde derecho, A pegada
    setup(1300, 1560, 3, 3, 400);
    run(0.2, I({ stick: true }), I({ right: true }));
    let minAliveB = true;
    run(1.5, I({ stick: true }), I({ right: true }));
    R.hang = { p: snap(), strain: +G.rope.strain.toFixed(2) };
    // 3b) B trepa (tira)
    run(1.0, I({ stick: true }), I({ pull: true, left: true }));
    R.climb = { p: snap() };
    // 4) A suelta hilo → B a la caneca
    setup(1300, 1560, 3, 3, 400);
    run(0.2, I({ stick: true }), I({ right: true }));
    run(1.0, I({ stick: true }), I({ right: true }));
    run(1.5, I({ stick: true, release: true }), I());
    R.drop = { p: snap(), state: G.state, wins: G.wins.slice() };
    // 5) Salto liviano vs pesado
    setup(700, 1200, 1, 6, 300);
    let minYA = 9999, minYB = 9999;
    run(1.0, I({ jump: true }), I({ jump: true }), () => { minYA = Math.min(minYA, G.players[0].y + G.players[0].r); minYB = Math.min(minYB, G.players[1].y + G.players[1].r); });
    R.jump = { lightRise: Math.round(640 - minYA), heavyRise: Math.round(640 - minYB) };
    // 6) embestida directa: A liviano corriendo contra B pesado quieto
    setup(1060, 1250, 1.5, 5, 400);
    let st = 0;
    run(1.2, I({ right: true }), I(), () => { st = Math.max(st, G.players[1].stun); });
    R.ram = { stunHeavy: +st.toFixed(2), p: snap() };
    // 7) pesado embiste liviano
    setup(1060, 1250, 5, 1.5, 400);
    st = 0;
    run(1.2, I({ right: true }), I(), () => { st = Math.max(st, G.players[1].stun); });
    R.ram2 = { stunLight: +st.toFixed(2), p: snap() };
    return R;
  });
  console.log(JSON.stringify(out, null, 1));
  console.log('ERRORS', errors.join('\n'));
  await browser.close();
})();
