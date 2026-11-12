// celular: campaña y duelo con controles táctiles, ver que nada se tape
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const [name, vp, sc] of [['cel', { width: 844, height: 390 }, 2], ['se', { width: 667, height: 320 }, 2]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: sc, isMobile: true, hasTouch: true });
    const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
    await page.evaluate(() => { Touch.enabled = true; Game.start('camp', 2, { level: 4, chars: ['yuma', 'candela'] }); UI.show(null, false); Game.advance(3); });
    await page.waitForTimeout(900); await page.screenshot({ path: path.join(__dirname, 'shots', `celcamp-${name}.png`) });
    await page.evaluate(() => { Game.start('tejo', 2, { chars: ['catatumbo', 'purace'], arena: 'rio' }); UI.show(null, false); Game.advance(3); });
    await page.waitForTimeout(900); await page.screenshot({ path: path.join(__dirname, 'shots', `celtejo-${name}.png`) });
    console.log(name, 'ERR', errors.join(' | ') || 'ninguno'); await ctx.close();
  }
  await browser.close();
})();
