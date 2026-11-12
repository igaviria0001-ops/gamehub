// Pantallas de la colección en PC y celular (requiere: python3 -m http.server 8765 en docs/)
const { chromium } = require('playwright');
const path = require('path');
const URL = process.env.URL || 'http://127.0.0.1:8765/';
const OUT = path.join(__dirname, 'shots');
(async () => {
  const b = await chromium.launch();
  for (const [tag, opt] of [['pc', { viewport: { width: 1366, height: 768 } }], ['cel', { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }], ['vert', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }]]) {
    if (process.env.ONLY && !process.env.ONLY.split(',').includes(tag)) continue;
    const ctx = await b.newContext(opt), p = await ctx.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await p.goto(URL); await p.waitForTimeout(1500);
    await p.screenshot({ path: path.join(OUT, `${tag}-home.png`) });
    if (tag === 'pc') { await p.hover('.slice[data-g="sortilegio"]'); await p.waitForTimeout(900); await p.screenshot({ path: path.join(OUT, `${tag}-hover.png`) }); }
    else { await p.tap('.slice[data-g="ventolera"]'); await p.waitForTimeout(900); await p.screenshot({ path: path.join(OUT, `${tag}-open.png`) }); }
    await p.evaluate(() => GAMEHUB.go('game', 'vertigo')); await p.waitForTimeout(700); await p.screenshot({ path: path.join(OUT, `${tag}-ficha.png`) });
    await p.evaluate(() => GAMEHUB.go('torneo')); await p.waitForTimeout(600); await p.screenshot({ path: path.join(OUT, `${tag}-wiz1.png`) });
    console.log(tag, errs.join(' | ') || 'sin errores');
    await ctx.close();
  }
  await b.close();
})();
