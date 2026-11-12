const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const [W, H] of [[693, 272], [640, 360]]) {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto('file://' + path.resolve(__dirname, 'index.html'));
    await page.waitForTimeout(800);
    await page.tap('#s-title [data-act="play2"]'); await page.waitForTimeout(150);
    await page.tap('[data-act="mode-caneca"]'); await page.waitForTimeout(250);
    if (await page.evaluate(() => TYA.UI.current) === 'arena') await page.tap('#arena-grid .arena:nth-child(1)');
    await page.waitForTimeout(1200);
    for (const big of [false, true]) {
      await page.evaluate(b => TYA.Touch.setBig(b), big); await page.waitForTimeout(100);
      const r = await page.evaluate(() => [...document.querySelectorAll('#touch .tbtn')].map(b => { const q = b.getBoundingClientRect(); return [Math.round(q.left), Math.round(q.right)]; }));
      console.log(W + 'x' + H, big ? 'grandes' : 'normales', JSON.stringify(r));
      await page.screenshot({ path: path.join(__dirname, 'shots', `dual-${W}x${H}-${big ? 'big' : 'norm'}.png`) });
    }
    await page.evaluate(() => TYA.Touch.setBig(false));
    await ctx.close();
  }
  await browser.close();
})();
