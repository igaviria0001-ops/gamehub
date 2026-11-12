const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); const page = await ctx.newPage();
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(800);
  await page.tap('[data-act="play2"]'); await page.waitForTimeout(200); await page.tap('#goTop'); await page.waitForTimeout(6500);
  await page.screenshot({ path: path.join(__dirname, 'shots', 'touch-layout.png') }); await b.close(); })();
