// Celular: el HUD de cada modo (uno y dos jugadores) en el celular más chico y en uno grande; ¿se monta algo?
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const [vw, vh, dpr] of [[693, 272, 2.625], [844, 390, 3]]) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: dpr, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, 'index.html'));
    await page.waitForTimeout(700);
    for (const [mode, pl, arena] of [['duel', 2, 'medellin'], ['targets', 1, 'cocora'], ['case', 2, 'bogota'], ['race', 2, 'cartagena'], ['boss', 1, 'medellin'], ['school', 1, 'cocora']]) {
      await page.evaluate(([mode, pl, arena]) => { const { Game, UI } = VTO; Game.setArena(arena); if (mode !== 'school') Game.setMode(mode); UI.show('title', false); if (mode === 'school') document.querySelector('[data-act="school"]').click(); else document.querySelector(pl === 2 ? '[data-act="play2"]' : '[data-act="play1"]').click(); }, [mode, pl, arena]);
      await page.waitForTimeout(250);
      await page.evaluate(() => { const { Game, Bot } = VTO, G = Game.G; if (G.mode !== 'school') { G.bots = [new Bot(G.birds[0], 4, 1), G.bots[1] || new Bot(G.birds[1], 9, 1)]; } Game.advance(G.mode === 'school' ? 2 : 12); if (G.mode === 'race') { G.score = [7, 4]; } G.birds[0].shield = 2; });
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(__dirname, 'shots', `hud-${vw}-${mode}.png`) });
    }
    console.log(vw, 'ERR', errors.join(' | ') || 'ninguno');
    await ctx.close();
  }
  await browser.close();
})();
