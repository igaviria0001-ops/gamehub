const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const [w, h] of [[1600, 900], [1280, 720]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto('file://' + path.resolve(__dirname, 'index.html'));
    await page.waitForTimeout(900);
    await page.click('[data-act="howto"]'); await page.waitForTimeout(400);
    await page.screenshot({ path: `shots/howto-${w}.png` });
    await page.close();
  }
  await browser.close();
})();
