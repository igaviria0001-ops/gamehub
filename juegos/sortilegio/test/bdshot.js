// los fondos del Mundo 2 solos (sin suelo ni niebla), para juzgarlos: arriba cielo, abajo infierno
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 1280, height: 1440 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message)); await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
  await page.evaluate(() => { Game.G.paused = true; const c = document.createElement('canvas'); c.width = 1280; c.height = 1440; c.style.cssText = 'position:fixed;inset:0;z-index:999'; document.body.append(c); const x = c.getContext('2d');
    const cam = { x: 900, y: 500, z: 1 }, G = { time: 12.3 }; ['cielo', 'infierno'].forEach((k, i) => { x.save(); x.translate(0, i * 720); x.beginPath(); x.rect(0, 0, 1280, 720); x.clip(); Post.backdrop(x, G, cam, 1280, 720, THEMES[k]); x.restore(); }); });
  await page.screenshot({ path: path.join(__dirname, 'shots', 'bd.png') }); console.log('ERR', errors.join('|') || 'ninguno'); await browser.close();
})();
