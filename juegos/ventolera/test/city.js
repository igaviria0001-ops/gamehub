// Medellín de noche: capturas en PC, Full HD y celular, más choques con edificios, tren y cabinas
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const [name, vp, o] of [['pc', { width: 1280, height: 720 }, {}], ['fhd', { width: 1920, height: 1080 }, {}], ['cel', { width: 693, height: 272 }, { deviceScaleFactor: 2.625, isMobile: true, hasTouch: true }]]) {
    const ctx = await browser.newContext(Object.assign({ viewport: vp }, o));
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, 'index.html'));
    await page.waitForTimeout(800);
    await page.evaluate(() => { VTO.Game.setArena('medellin'); VTO.Game.G.botLevel = 2; VTO.Game.start('duel', 1); VTO.Game.G.bots[0] = new VTO.Bot(VTO.Game.G.birds[0], 3, 2); VTO.UI.show(null, false); });
    for (let k = 0; k < 4; k++) {
      await page.evaluate(() => VTO.Game.advance(4 + Math.random() * 3));
      await page.waitForTimeout(120);
      await page.screenshot({ path: path.join(__dirname, 'shots', `city-${name}-${k}.png`) });
    }
    const st = await page.evaluate(() => { const W = VTO.Game.G.world; return { roto: W.buildings.reduce((a, B) => a + B.broken.size, 0), tren: Math.round(W.train.x), estado: VTO.Game.G.state }; });
    console.log(name, JSON.stringify(st), 'ERR', errors.join(' | ') || 'ninguno');
    await ctx.close();
  }
  await browser.close();
})();
