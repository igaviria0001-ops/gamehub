// Misiles: con blanco fijado persiguen; un quiebre cerrado o un tonel a tiempo los hacen pasar de largo; las bengalas los engañan
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => console.log('ERR', e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => {
    const { Game } = VTO, out = {};
    const E = () => ({ dx: 0, dy: 0, fire: false, boost: false, missile: false, roll: false, rdx: 0, rdy: 0 });
    const scen = (name, how, at, flares = 0, dist = 900) => {
      Game.cfg.species = ['guacamaya', 'guacamaya']; Game.start('free', 2); const G = Game.G; G.paused = true; G.cratesOn = false;
      const [A, B] = G.birds;
      A.reset(250, 430, 1); B.reset(250 + dist, 430, 1); G.mlog = {}; B.flares = flares;
      let t = 0, launched = false, rolled = false, breakT = 0;
      const hp0 = B.hp;
      while (t < 8) {
        const inA = E(); inA.dx = 1;
        if (!launched && A.locked) { inA.missile = true; launched = true; }
        const inB = E(); inB.dx = 1;
        const th = VTO.Combat.threat(G, B);
        if (th && how === 'quiebre' && th.d < at) breakT = 1;
        if (th && how === 'arriba' && th.d < at) breakT = 2;
        if (breakT === 1) { inB.dx = -1; inB.dy = -0.4; inB.boost = true; }
        if (breakT === 2) { inB.dx = 0; inB.dy = -1; }
        if (th && how === 'tonel' && th.d < at && !rolled) { inB.roll = true; inB.rdx = 0; inB.rdy = -1; rolled = true; }
        if (th && how === 'turbo') inB.boost = true;
        if (how === 'loco' && th) { inB.dx = Math.cos(t * 4); inB.dy = Math.sin(t * 4); }
        A.step(1 / 120, inA, G); B.step(1 / 120, inB, G); VTO.Combat.step(G, 1 / 120, [inA, inB]);
        G.events.length = 0; t += 1 / 120;
        if (launched && !G.missiles.length) break;
      }
      out[name] = { lanzado: launched, daño: Math.round(hp0 - B.hp), esquivados: B.stats.dodged, log: JSON.stringify(G.mlog || {}) };
    };
    scen('recto', 'nada', 0);
    scen('turbo', 'turbo', 0);
    scen('quiebre 700', 'quiebre', 700);
    scen('quiebre 400', 'quiebre', 400);
    scen('quiebre 220', 'quiebre', 220);
    scen('arriba 500', 'arriba', 500);
    scen('arriba 300', 'arriba', 300);
    scen('arriba 180', 'arriba', 180);
    scen('arriba 100', 'arriba', 100);
    scen('tonel 400', 'tonel', 400);
    scen('tonel 250', 'tonel', 250);
    scen('tonel 150', 'tonel', 150);
    scen('tonel 70', 'tonel', 70);
    scen('círculos', 'loco', 0);
    scen('bengalas', 'nada', 0, 2);
    return out;
  });
  for (const [k, v] of Object.entries(r)) console.log(k.padEnd(14), JSON.stringify(v));
  await browser.close();
})();
