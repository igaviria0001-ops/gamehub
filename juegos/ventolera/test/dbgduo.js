const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(500);
  console.log(await page.evaluate(() => ({ ls: localStorage.getItem('vto_travDuo'), keys: Object.keys(localStorage) })));
  await page.evaluate(() => document.querySelector('[data-act="trav"]').click()); await page.waitForTimeout(200);
  console.log(await page.evaluate(() => [...document.querySelectorAll('#s-trav [data-tduo] button')].map(b => b.textContent + ':' + b.getAttribute('aria-pressed'))));
  await page.evaluate(() => document.querySelector('[data-stage="0"]').click()); await page.waitForTimeout(200);
  console.log(await page.evaluate(() => ({ duo: VTO.Game.G.duo, players: VTO.Game.G.players })));
  await browser.close();
})();
