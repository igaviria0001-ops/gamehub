// el título en varios teléfonos: ¿se sale algo?
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const [name, w, h, s] of [['h300', 844, 300, 3], ['h260', 760, 260, 3], ['h230', 700, 230, 3], ['h200', 640, 200, 3], ['w568', 568, 320, 2], ['iph14', 844, 390, 3], ['iphmax', 932, 430, 3], ['and', 780, 360, 2.75], ['se', 667, 375, 2], ['small', 640, 320, 2], ['vert', 390, 844, 3]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: s, isMobile: true, hasTouch: true });
    const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(900);
    const out = await page.evaluate(() => { const bad = []; document.querySelectorAll('#s-title .btn, #s-title h1, #s-title .sub').forEach(el => { const r = el.getBoundingClientRect(); if (r.width && (r.left < -1 || r.right > innerWidth + 1 || r.top < -1 || r.bottom > innerHeight + 1)) bad.push(el.textContent.trim().slice(0, 18)); }); return bad; });
    await page.screenshot({ path: path.join(__dirname, 'shots', `titlecel-${name}.png`) });
    console.log(name, out.length ? 'SE SALE: ' + out.join(', ') : 'cabe', errors.join(' | '));
    await ctx.close();
  }
  await browser.close();
})();
