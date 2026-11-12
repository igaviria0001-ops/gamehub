// ¿Hay ventaja de lado? duelos máquina contra máquina, con especies cruzadas, en un escenario
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 800, height: 450 } })).newPage();
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(600);
  const arena = process.env.ARENA || 'cartagena';
  const r = await page.evaluate((arena) => {
    const { Game, Bot } = VTO; Game.setArena(arena); Game.setMode('duel');
    const res = { left: 0, right: 0, draw: 0, rounds: [] };
    for (const sp of [['guacamaya', 'condor'], ['condor', 'guacamaya'], ['tucan', 'tucan']]) for (let seed = 1; seed <= 3; seed++) {
      Game.cfg.species = sp.slice(); Game.start('duel', 2); VTO.UI.show(null, false);
      const G = Game.G; G.bots = [new Bot(G.birds[0], seed * 5, 1), new Bot(G.birds[1], seed * 11, 1)];
      let t = 0; while (t < 200 && G.state !== 'matchEnd') { Game.advance(0.5); t += 0.5; }
      res.left += G.wins[0]; res.right += G.wins[1];
    }
    return res;
  }, arena);
  console.log(arena, JSON.stringify(r));
  await browser.close();
})();
