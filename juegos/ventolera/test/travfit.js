const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 693, height: 272 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(500);
  await page.evaluate(() => { localStorage.setItem('vto_travDuo', 'true'); }); await page.reload(); await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelector('#s-title [data-act="trav"]').click()); await page.waitForTimeout(200);
  for (const i of [0, 9]) {
    await page.evaluate(i => document.querySelector(`#t-grid [data-stage="${i}"]`).dispatchEvent(new Event('mouseenter')), i);
    console.log(i, JSON.stringify(await page.evaluate(() => { const p = document.querySelector('#s-trav .panel').getBoundingClientRect(), s = document.querySelector('#s-trav'), d = document.querySelector('#t-detail').getBoundingClientRect(), g = document.querySelector('#t-grid').getBoundingClientRect(), h = document.querySelector('#s-trav .phead').getBoundingClientRect(); return { panel: [Math.round(p.top), Math.round(p.bottom)], scroll: s.scrollHeight + '/' + s.clientHeight, head: Math.round(h.height), grid: Math.round(g.height), detalle: Math.round(d.height) }; })));
  }
  await browser.close();
})();
