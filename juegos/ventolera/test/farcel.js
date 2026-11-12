// Celular: pilotos muy separados (la cámara se aleja al máximo): ¿se distinguen?
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 693, height: 272 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(600);
  await page.evaluate(() => { const { Game, UI } = VTO; Game.setArena('medellin'); Game.setMode('duel'); UI.show('title', false); document.querySelector('[data-act="play2"]').click(); });
  await page.waitForTimeout(300);
  const z = await page.evaluate(() => { const { Game } = VTO, G = Game.G; Game.advance(3); G.birds[0].reset(500, 900, 1); G.birds[1].reset(3300, 1100, -1); G.birds[0].missiles = 4; for (let k = 0; k < 90; k++) { G.birds[0].reset(500 + k * 2, 900, 1); G.birds[1].reset(3300 - k * 2, 1100, -1); Game.advance(1 / 60); } return [Game.cam.z.toFixed(3), G.vs.toFixed(2)]; });
  await page.waitForTimeout(200);
  console.log('zoom y escala de pilotos:', z);
  await page.screenshot({ path: path.join(__dirname, 'shots', 'far-cel.png') });
  await browser.close();
})();
