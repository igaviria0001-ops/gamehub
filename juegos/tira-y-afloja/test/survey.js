// vistazo de cada arena en plena pelea (máquina contra máquina), PC y celular
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const cel of [0, 1]) {
    const ctx = await browser.newContext(Object.assign({ viewport: cel ? { width: 844, height: 390 } : { width: 1280, height: 720 } }, cel ? { deviceScaleFactor: 2, isMobile: true, hasTouch: true } : {})); const page = await ctx.newPage();
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(__dirname, 'shots', `sv-title${cel ? '-c' : ''}.png`) });
    const ids = (process.env.A || 'pupitre,gimnasio,laboratorio,cafeteria,arte,biblioteca,bus,profe').split(',');
    for (const id of ids) {
      await page.evaluate(id => { TYA.UI.show && TYA.UI.show(null); TYA.Game.startMatch('caneca', true, id, false); const G = TYA.Game.G; G.bots = G.bots || []; TYA.over[0] = null; }, id);
      await page.waitForTimeout(7000);
      await page.screenshot({ path: path.join(__dirname, 'shots', `sv-${id}${cel ? '-c' : ''}.png`) });
    }
    console.log(cel ? 'cel' : 'pc', 'ERR', errors.join(' | ') || 'ninguno'); await ctx.close();
  }
  await browser.close();
})();
