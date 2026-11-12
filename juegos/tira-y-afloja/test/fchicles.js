const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1200);
  await page.evaluate(() => { TYA.UI.show(null, false); TYA.Game.startMatch('chicles', false, 'cafeteria', true); const G = TYA.Game.G; G.bots = [new Bot(0, 1), new Bot(1, 1)]; G.hintsT = 0; });
  const log = [];
  for (const T of [25.3, 26.4, 51]) {
    const r = await page.evaluate(T => { const G = TYA.Game.G; let g = 0; while (G.roundT < T && g++ < 60 * 80) TYA.Game.update(1 / 60); return [G.state, +G.roundT.toFixed(1), Fiesta.cur, Fiesta.state.pending, Fiesta.state.landed]; }, T);
    log.push(r);
    await page.waitForTimeout(60);
    await page.screenshot({ path: `shots/fc-${T}.png` });
  }
  const end = await page.evaluate(() => { const G = TYA.Game.G; let g = 0; while (G.state !== 'matchEnd' && g++ < 60 * 60) TYA.Game.update(1 / 60); return [G.state, G.points]; });
  console.log(JSON.stringify(log), JSON.stringify(end));
  console.log('ERRORS', errors.join('\n'));
  await browser.close();
})();
