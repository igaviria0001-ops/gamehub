// Vistazo de cada escenario en pelea (máquina contra máquina) — para juzgar gráficos
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch(); const vp = process.env.CEL ? { width: 844, height: 390 } : { width: 1280, height: 720 };
  const ctx = await browser.newContext(Object.assign({ viewport: vp }, process.env.CEL ? { deviceScaleFactor: 2, isMobile: true, hasTouch: true } : {})); const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.addInitScript(() => { try { localStorage.setItem('vto_qManual', 'true'); localStorage.setItem('vto_quality', '"alta"'); } catch (e) {} });
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(800);
  for (const arena of (process.env.ARENAS || 'cocora,medellin,bogota,cartagena').split(',')) {
    await page.evaluate(a => { VTO.Game.cfg.arena = a; VTO.Game.cfg.species = ['guacamaya', 'tucan']; document.querySelector('[data-act="play2"]').click(); }, arena);
    await page.waitForTimeout(400);
    await page.evaluate(() => { const G = VTO.Game.G; G.bots = [new VTO.Bot(G.birds[0], 3, 2), new VTO.Bot(G.birds[1], 9, 2)]; });
    await page.waitForTimeout(+(process.env.T || 7000));
    await page.screenshot({ path: path.join(__dirname, 'shots', `look-${arena}${process.env.CEL ? '-cel' : ''}.png`) });
    await page.evaluate(() => { VTO.UI && VTO.UI.show ? VTO.UI.show('title') : 0; });
  }
  console.log('ERR', errors.slice(0, 4).join(' | ') || 'ninguno'); await browser.close();
})();
