// Arranque: título y vuelo libre en computador y en celular (sin errores, capturas)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const runs = [{ name: 'pc', vp: { width: 1280, height: 720 }, opts: {} }, { name: 'cel', vp: { width: 693, height: 272 }, opts: { deviceScaleFactor: 2.625, isMobile: true, hasTouch: true } }];
  for (const r of runs) {
    const ctx = await browser.newContext(Object.assign({ viewport: r.vp }, r.opts));
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto('file://' + path.resolve(__dirname, 'index.html'));
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(__dirname, 'shots', `title-${r.name}.png`) });
    if (r.opts.hasTouch) await page.tap('[data-act="play2"]'); else await page.click('[data-act="play2"]');
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(__dirname, 'shots', `play-${r.name}.png`) });
    const st = await page.evaluate(() => { const G = VTO.Game.G; return { state: G.state, birds: G.birds.map(b => [Math.round(b.x), Math.round(b.y), Math.round(b.s), b.perch ? 'posado' : '']), cam: VTO.Game.cam }; });
    console.log(r.name, JSON.stringify(st));
    console.log(r.name, 'ERR', errors.join(' | ') || 'ninguno');
    await ctx.close();
  }
  await browser.close();
})();
