const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const [name, vp, o] of [['pc', { width: 1280, height: 720 }, {}], ['cel', { width: 693, height: 272 }, { deviceScaleFactor: 2.625, isMobile: true, hasTouch: true }]]) {
    const ctx = await browser.newContext(Object.assign({ viewport: vp }, o));
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('ERR', e.message));
    await page.goto('file://' + path.resolve(__dirname, 'index.html'));
    await page.waitForTimeout(900);
    await page.evaluate(() => { const b = document.querySelector('[data-act="play2"]'); b.click(); });
    await page.waitForTimeout(300);
    // los dos suben un poco y luego J1 hace un rizo; J2 pica
    await page.evaluate(() => { const G = VTO.Game.G; G.birds[0].reset(1000, 700, 1); G.birds[1].reset(1900, 600, -1); });
    await page.keyboard.down('KeyW'); await page.waitForTimeout(1500); await page.keyboard.up('KeyW');
    await page.keyboard.down('ArrowDown'); await page.waitForTimeout(250); await page.keyboard.up('ArrowDown');
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(350);
    await page.screenshot({ path: path.join(__dirname, 'shots', `loop-${name}.png`) });
    await ctx.close();
  }
  await browser.close();
})();
