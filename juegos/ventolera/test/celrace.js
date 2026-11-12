// Celular: Carrera (panel, flechas, aros) y Cartagena con cañonazo, con los controles táctiles
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 693, height: 272 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(700);
  for (const [arena, mode, pl, t] of [['bogota', 'race', 1, 9], ['cartagena', 'race', 2, 14], ['cartagena', 'duel', 1, 8]]) {
    await page.evaluate(([arena, mode, pl]) => { const { Game, UI } = VTO; Game.setArena(arena); Game.setMode(mode); UI.show('title', false); document.querySelector(pl === 2 ? '[data-act="play2"]' : '[data-act="play1"]').click(); }, [arena, mode, pl]);
    await page.waitForTimeout(300);
    await page.evaluate(t => { const { Game, Bot } = VTO, G = Game.G; G.bots = [new Bot(G.birds[0], 4, 1), G.bots[1] || new Bot(G.birds[1], 9, 1)]; Game.advance(t); }, t);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(__dirname, 'shots', `cel-${arena}-${mode}.png`) });
  }
  console.log('ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
