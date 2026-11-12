// Hoja de contacto con las 8 arenas (miniaturas grandes)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1500);
  const data = await page.evaluate(() => {
    const W = 800, H = 450, c = document.createElement('canvas'); c.width = W * 2; c.height = H * 4;
    const ctx = c.getContext('2d');
    ARENA_LIST.forEach((d, i) => { const t = ArenaArt.thumb(d.id, W, H); ctx.drawImage(t, (i % 2) * W, Math.floor(i / 2) * H); ctx.fillStyle = '#000'; ctx.font = 'bold 28px sans-serif'; ctx.fillText(d.id, (i % 2) * W + 10, Math.floor(i / 2) * H + 34); });
    return c.toDataURL('image/png');
  });
  require('fs').writeFileSync('shots/sheet.png', Buffer.from(data.split(',')[1], 'base64'));
  await browser.close();
})();
