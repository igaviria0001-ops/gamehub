// Celular: cómo se ven los modos (Blancos, Maletín, Jefe) con los controles táctiles
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 693, height: 272 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(700);
  for (const [mode, pl] of [['targets', 2], ['case', 1], ['boss', 2]]) {
    await page.evaluate(([mode, pl]) => { const { Game, Bot, UI } = VTO; Game.setArena('medellin'); Game.setMode(mode); UI.show('title', false); document.querySelector(pl === 2 ? '[data-act="play2"]' : '[data-act="play1"]').click(); }, [mode, pl]);
    await page.waitForTimeout(300);
    await page.evaluate(() => { const { Game, Bot } = VTO, G = Game.G; G.bots = [new Bot(G.birds[0], 4, 2), G.bots[1] || new Bot(G.birds[1], 9, 2)]; Game.advance(10); });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(__dirname, 'shots', `cel-${mode}.png`) });
  }
  console.log('ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
