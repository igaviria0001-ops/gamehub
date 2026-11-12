const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const [name, vp, opts] of [['cel', { width: 693, height: 272 }, { deviceScaleFactor: 2.625, isMobile: true, hasTouch: true }], ['cel844', { width: 844, height: 390 }, { deviceScaleFactor: 3, isMobile: true, hasTouch: true }]]) {
    const ctx = await browser.newContext(Object.assign({ viewport: vp }, opts));
    const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(600);
    await page.evaluate(() => { localStorage.setItem('vto_trav2', JSON.stringify({ cocora1: { s: 2, w: 0 }, cocora2: { s: 3, w: 2 }, med1: { s: 1, w: 1 } })); }); await page.reload(); await page.waitForTimeout(600);
    await page.tap('#s-title [data-act="trav"]'); await page.waitForTimeout(200);
    await page.tap('#s-trav [data-tduo] [data-v="1"]'); await page.waitForTimeout(200);
    console.log(name, JSON.stringify(await page.evaluate(() => { const el = document.querySelector('#s-trav .panel'); return { sale: el.getBoundingClientRect().bottom > innerHeight + 1 || el.scrollHeight > el.clientHeight + 2, total: document.querySelector('#t-total').textContent }; })), 'ERR', errors.join(' | ') || 'ninguno');
    await page.screenshot({ path: path.join(__dirname, 'shots', `trav2ui-${name}.png`) });
    await ctx.close();
  }
  await browser.close();
})();
