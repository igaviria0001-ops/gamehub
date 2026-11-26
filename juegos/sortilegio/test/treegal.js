// árboles del Mundo 3 (sprites) por tipo y estación, en grande. TAG=antes|despues
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 1500, height: 820 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
  await page.evaluate(() => { UI.show(null, false); const cv = document.createElement('canvas'); cv.width = 1500; cv.height = 820; cv.style.cssText = 'position:fixed;inset:0;z-index:2147483000'; document.body.appendChild(cv);
    const x = cv.getContext('2d'); x.fillStyle = '#e4dcc4'; x.fillRect(0, 0, 1500, 820);
    ['pine', 'sakura', 'maple', 'bamboo'].forEach((k, r) => ['spring', 'summer', 'autumn', 'winter'].forEach((s, c) => { const spr = ArtInk.treeSpr(k, s, 1); x.drawImage(spr, 20 + c * 370, 10 + r * 200, 150 * 1.3, 170 * 1.3); const spr2 = ArtInk.treeSpr(k, s, 2); x.drawImage(spr2, 190 + c * 370, 30 + r * 200, 150, 170); })); });
  await page.waitForTimeout(200); await page.screenshot({ path: path.join(__dirname, 'shots', `treegal-${process.env.TAG || 'x'}.png`) });
  console.log('ERR', errors.join(' | ') || 'ninguno'); await browser.close(); })();
