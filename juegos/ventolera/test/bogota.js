// Bogotá en tormenta: máquina contra máquina (rayos, aviones, ráfagas, choques) y capturas
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const [name, vp, o] of [['pc', { width: 1280, height: 720 }, {}], ['cel', { width: 693, height: 272 }, { deviceScaleFactor: 2.625, isMobile: true, hasTouch: true }]]) {
    const ctx = await browser.newContext(Object.assign({ viewport: vp }, o));
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, 'index.html'));
    await page.waitForTimeout(700);
    const r = await page.evaluate(() => {
      const { Game, Bot, FX } = VTO; const ev = {};
      Game.setArena('bogota'); Game.setMode('duel'); Game.start('duel', 1); VTO.UI.show(null, false);
      const G = Game.G; G.bots[0] = new Bot(G.birds[0], 4, 2); G.bots[1].level = 2; G.hintT = 0;
      const fe = FX.event; FX.event = (e, G2) => { if (['bolt', 'zap', 'planePass', 'gust', 'crash', 'down'].includes(e.type)) { const k = e.type === 'crash' ? 'crash-' + e.kind : e.type; ev[k] = (ev[k] || 0) + 1; } return fe(e, G2); };
      Game.advance(90);
      FX.event = fe;
      return { estado: G.state, rondas: G.wins.join('-'), ev };
    });
    console.log(name, JSON.stringify(r));
    for (let k = 0; k < 3; k++) {
      await page.evaluate(k => { const { Game } = VTO, S = Game.G.world.storm; if (k === 0) { S.warn = { x: Game.G.birds[0].x + 40, t: 0.5 }; } if (k === 1) { Game.advance(0.6); } if (k === 2) { S.planeWarn = null; S.plane = { x: Game.G.birds[0].x - 300, y: Game.G.birds[0].y - 120, dir: 1, speed: 820, t: 0 }; } Game.advance(1 / 30); }, k);
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(__dirname, 'shots', `bogota-${name}-${k}.png`) });
    }
    console.log(name, 'ERR', errors.join(' | ') || 'ninguno');
    await ctx.close();
  }
  await browser.close();
})();
