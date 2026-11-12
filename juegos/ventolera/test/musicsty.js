// Música por escenario: cada uno cambia de sabor y suena en todas las capas sin errores
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(600);
  await page.mouse.click(640, 600);
  await page.waitForTimeout(800);
  for (const arena of ['cocora', 'medellin', 'bogota', 'cartagena']) {
    await page.evaluate(arena => { const { Game, UI } = VTO; Game.setArena(arena); Game.setMode('duel'); Game.start('duel', 1); UI.show(null, false); const G = Game.G; G.birds[0].reset(1500, 900, 1); G.birds[1].reset(1800, 900, -1); G.birds[0].legendT = 20; }, arena);
    await page.waitForTimeout(7000);
    console.log(arena, 'estilo', await page.evaluate(() => Music.style), 'capa', await page.evaluate(() => Music.level));
  }
  console.log('ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
