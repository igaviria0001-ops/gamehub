const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1500);
  console.log('TYA', await page.evaluate(() => typeof TYA));
  console.log(errors.join('\n'));
  await browser.close();
})();
