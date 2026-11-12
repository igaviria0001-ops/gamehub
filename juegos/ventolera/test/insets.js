const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const [vw, vh, d] of [[693, 272, 2.625], [844, 390, 3], [1180, 820, 2]]) for (const pl of ['play2', 'play1']) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: d, isMobile: true, hasTouch: true });
    const page = await ctx.newPage(); await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(500);
    await page.tap(`[data-act="${pl}"]`); await page.waitForTimeout(300);
    console.log(vw, vh, pl, JSON.stringify(await page.evaluate(() => { const r = VTO.Touch.insets(); return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, Math.round(v)])); })));
    await ctx.close();
  }
  await browser.close();
})();
