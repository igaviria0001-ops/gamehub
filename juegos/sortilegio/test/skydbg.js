const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
  const variants = { base: '', nofog: 'THEMES.cielo.fogK=0', norays: 'THEMES.cielo.rays=0', noamb: 'THEMES.cielo.ambientA=0' };
  for (const [k, code] of Object.entries(variants)) {
    await page.evaluate(([code]) => { eval(code); Game.start('camp', 0, { level: 10, chars: ['zuhe', 'tota'] }); UI.show(null, false); const G = Game.G; for (const m of G.mages) m.maxHp = m.hp = 9999; Game.advance(3); G.paused = true; Game.cam.x = 740; Game.cam.y = 760; Game.cam.z = 1; }, [code]);
    await page.waitForTimeout(400); await page.screenshot({ path: path.join(__dirname, 'shots', `sky-${k}.png`) });
  }
  await browser.close();
})();
