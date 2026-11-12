const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => {
    const { Game, Bot } = VTO; Game.setArena('capadocia'); Game.start('duel', 2); VTO.UI.show(null, false);
    const G = Game.G; G.bots = [new Bot(G.birds[0], 3, 1), new Bot(G.birds[1], 7, 1)];
    const log = [];
    for (let t = 0; t < 40; t += 0.5) { Game.advance(0.5); log.push(G.birds.map(b => `${Math.round(b.x)},${Math.round(b.y)} s${Math.round(b.s)} st${b.stun.toFixed(1)}${b.perch ? ' P' + b.perch.kind : ''}`).join(' | ')); }
    return log;
  });
  console.log(r.join('\n'));
  await browser.close();
})();
