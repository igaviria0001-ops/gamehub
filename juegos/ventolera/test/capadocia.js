// Capadocia: dos máquinas pelean; cuenta rebotes en globos, posadas, choques y atascos; fotos del escenario
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(700);
  const N = +(process.env.N || 4), AR = process.env.ARENA || 'capadocia';
  const r = await page.evaluate(([N, AR]) => {
    const { Game, Bot } = VTO; Game.setArena(AR); Game.setMode('duel');
    const out = [];
    for (let seed = 1; seed <= N; seed++) {
      Game.start('duel', 2); VTO.UI.show(null, false);
      const G = Game.G; G.bots = [new Bot(G.birds[0], seed * 3, 1), new Bot(G.birds[1], seed * 7, 1)];
      const ev = {}, kinds = {}; let t = 0, stuck = 0, lastX = [[0, 0], [0, 0]], still = [0, 0], hotPerch = 0, therm = 0;
      const orig = G.events.push.bind(G.events);
      G.events.push = (...a) => { for (const e of a) { ev[e.type] = (ev[e.type] || 0) + 1; if (e.type === 'crash' || e.type === 'land') kinds[e.type + ':' + e.kind] = (kinds[e.type + ':' + e.kind] || 0) + 1; } return orig(...a); };
      while (t < 150 && G.state !== 'matchEnd') {
        Game.advance(0.5); t += 0.5;
        G.birds.forEach((b, i) => { if (b.perch && b.perch.hot != null) hotPerch += 0.5; if (World.thermalAt(G.world, b.x, b.y) > 30) therm += 0.5; if (b.alive && !b.perch && Math.hypot(b.x - lastX[i][0], b.y - lastX[i][1]) < 30) still[i] += 0.5; else still[i] = 0; if (still[i] > 4) stuck++; lastX[i] = [b.x, b.y]; });
      }
      out.push({ seed, t, state: G.state, wins: G.wins.join('-'), stuck, bounce: ev.bounce || 0, crash: ev.crash || 0, land: ev.land || 0, down: ev.down || 0, hotPerch, therm, kinds, hot: (G.world.hotair || []).map(h => [Math.round(h.x), Math.round(h.y)]).join(' ') });
    }
    return out;
  }, [N, AR]);
  r.forEach(x => console.log(JSON.stringify(x)));
  const shot = async (name, fn, arg) => { await page.evaluate(fn, arg); await page.waitForTimeout(250); await page.screenshot({ path: path.join(__dirname, 'shots', name) }); };
  const place = ([x0, y0, x1, y1, adv]) => { const { Game } = VTO; Game.start('free', 2); VTO.UI.show(null, false); const G = Game.G; G.hintT = 0; G.bots = [null, null]; G.cratesOn = false; if (adv) Game.advance(adv); G.birds[0].reset(x0, y0, 1); G.birds[1].reset(x1, y1, -1); Game.advance(0.05); G.birds[0].reset(x0, y0, 1); G.birds[1].reset(x1, y1, -1); Game.updateCamera(0, true); };
  await shot('capa-castillo.png', place, [1250, 1500, 1750, 1650, 0]);
  await shot('capa-arco.png', place, [2200, 1700, 2700, 1600, 0]);
  await shot('capa-globos.png', place, [800, 500, 1300, 700, 30]);
  await shot('capa-alto.png', place, [1600, 200, 2100, 300, 60]);
  await shot('capa-chimeneas.png', place, [600, 1400, 1000, 1300, 0]);
  console.log('ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
