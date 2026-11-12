// pilotos volando bajo, cerca de los techos, en cada escenario (PC y celular): que nada oscuro los tape
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch(); const errors = [];
  for (const cel of [0, 1]) {
    const ctx = await browser.newContext(Object.assign({ viewport: cel ? { width: 844, height: 390 } : { width: 1280, height: 720 } }, cel ? { deviceScaleFactor: 2, isMobile: true, hasTouch: true } : {})); const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => { try { localStorage.setItem('vto_qManual', 'true'); localStorage.setItem('vto_quality', '"alta"'); } catch (e) {} });
    await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(800);
    for (const arena of (process.env.ARENAS || 'medellin,bogota,cocora,cartagena').split(',')) {
      await page.evaluate(a => { VTO.Game.cfg.arena = a; document.querySelector('[data-act="play2"]').click(); }, arena);
      await page.waitForTimeout(3600);
      await page.evaluate(() => { const G = VTO.Game.G, W = G.world; G.birds.forEach((b, i) => { b.x = W.w * (0.35 + i * 0.3); b.y = W.groundY(b.x) - 120; b.vx = 0; b.vy = 0; }); });
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(__dirname, 'shots', `low-${arena}${cel ? '-cel' : ''}.png`) });
      await page.evaluate(() => VTO.UI.show('title'));
    }
    await ctx.close();
  }
  console.log('ERR', errors.slice(0, 4).join(' | ') || 'ninguno'); await browser.close();
})();
