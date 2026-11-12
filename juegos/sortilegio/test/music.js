// la música cambia de estilo por escenario sin errores
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(600);
  await page.click('[data-act="play2"]'); await page.waitForTimeout(200);
  for (const a of ['rio', 'volcan', 'ciudad', 'paramo']) {
    await page.evaluate(a => { Game.cfg.arena = a; }, a);
    await page.evaluate(a => { Sound.init(); Game.start('duel', 0, { chars: ['candela', 'yuma'], arena: a }); UI.show(null, false); Music.setLevel(2); }, a);
    await page.waitForTimeout(2500);
  }
  console.log('ERR', errors.join(' | ') || 'ninguno'); await browser.close();
})();
