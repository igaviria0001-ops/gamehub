// Capturas de una pelea real (máquina contra máquina) en computador y celular
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
    await page.evaluate(() => { VTO.Game.cfg.species = ['guacamaya', 'tucan']; VTO.Game.cfg.looks = [0, 0]; document.querySelector('[data-act="play2"]').click(); const G = VTO.Game.G; G.bots = [new VTO.Bot(G.birds[0], 3, 2), new VTO.Bot(G.birds[1], 9, 2)]; G.hintT = 0; });
    for (let k = 0; k < 7; k++) {
      await page.waitForTimeout(k === 0 ? 3600 : 1700);
      await page.evaluate(() => { const G = VTO.Game.G; if (G.state === 'countdown') G.bots = [new VTO.Bot(G.birds[0], 3, 2), new VTO.Bot(G.birds[1], 9, 2)]; });
      await page.screenshot({ path: path.join(__dirname, 'shots', `fight-${name}-${k}.png`) });
    }
    console.log(name, 'ERR', errors.join(' | ') || 'ninguno', await page.evaluate(() => VTO.Game.G.wins.join('-') + ' ' + VTO.Game.G.state));
    await ctx.close();
  }
  await browser.close();
})();
