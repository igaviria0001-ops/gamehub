// los atuendos del Mundo 3 en grande (como en el vestidor), en dos momentos, sobre fondo claro y oscuro
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 1500, height: 820 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
  await page.evaluate(() => {
    UI.show(null, false); const cv = document.createElement('canvas'); cv.width = 1500; cv.height = 820; cv.style.cssText = 'position:fixed;inset:0;z-index:2147483000'; document.body.appendChild(cv);
    const x = cv.getContext('2d'), keys = ['yokozuna', 'kitsune', 'raijin', 'sumi', 'estaciones'], chars = ['fuji', 'yoshino', 'candela', 'iguaque', 'fuji'];
    const t0 = performance.now();
    (function loop() { const t = (performance.now() - t0) / 1000;
      x.fillStyle = '#efe6d2'; x.fillRect(0, 0, 1500, 410); x.fillStyle = '#141024'; x.fillRect(0, 410, 1500, 410);
      keys.forEach((k, i) => { for (const row of [0, 1]) { x.save(); x.translate(i * 300, row * 410); ArtMage.showcase(x, chars[i], 300, 410, t + row * 1.7, 'u.' + k); x.restore(); } });
      requestAnimationFrame(loop); })();
  });
  for (const k of [0, 1]) { await page.waitForTimeout(k ? 2100 : 1300); await page.screenshot({ path: path.join(__dirname, 'shots', `outfit3big-${k}.png`) }); }
  console.log('ERR', errors.slice(0, 4).join(' | ') || 'ninguno'); await browser.close();
})();
