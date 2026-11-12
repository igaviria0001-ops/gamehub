// Uso: node atT.js <arena> <t1,t2,...>  -> capturas con el reloj de la arena en esos segundos
const { chromium } = require('playwright');
const path = require('path');
const id = process.argv[2], times = (process.argv[3] || '5').split(',').map(Number);
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1000);
  await page.evaluate(id => { TYA.UI.show(null, false); TYA.Game.startMatch('caneca', false, id); const G = TYA.Game.G; G.bots = [new Bot(0, 1), new Bot(1, 1)]; G.hintsT = 0; }, id);
  await page.waitForTimeout(3200);
  for (const t of times) {
    await page.evaluate(t => { const G = TYA.Game.G; while (ARENA.t < t && G.state === 'play') TYA.Game.update(1 / 60); }, t);
    await page.waitForTimeout(120);
    await page.screenshot({ path: `shots/t-${id}-${t}.png` });
  }
  console.log('ERRORS', errors.join('\n'));
  await browser.close();
})();
