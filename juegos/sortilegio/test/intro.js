// presentación VS en PC y celular
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const [name, vp, o] of [['pc', { width: 1280, height: 720 }, {}], ['app', { width: 587, height: 262 }, { deviceScaleFactor: 2.6, isMobile: true, hasTouch: true }]]) {
    const page = await (await browser.newContext(Object.assign({ viewport: vp }, o))).newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(800);
    await page.evaluate(() => { Game.start('duel', 2, { chars: ['catatumbo', 'purace'], arena: 'cano' }); UI.show(null, false); Game.advance(1.2); Game.G.paused = true; });
    await page.waitForTimeout(400); await page.screenshot({ path: path.join(__dirname, 'shots', `intro-${name}.png`) });
    const st = await page.evaluate(() => { Game.G.paused = false; Game.advance(4.2); return [Game.G.state, Game.G.introT.toFixed(2)]; });
    console.log(name, st, 'ERR', errors.join(' | ') || 'ninguno');
  }
  await browser.close();
})();
