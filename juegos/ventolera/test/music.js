// Música: arranca con el primer toque, sube de capa con la pelea, se apaga en pausa; sin errores de audio
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(600);
  await page.mouse.click(640, 600);
  await page.waitForTimeout(1500);
  const lv = () => page.evaluate(() => Music.level);
  console.log('título, capa', await lv());
  await page.click('[data-act="play1"]');
  await page.waitForTimeout(4500);
  console.log('ronda empezando, capa', await lv());
  await page.evaluate(() => { const G = VTO.Game.G; G.birds[0].reset(1500, 900, 1); G.birds[1].reset(1800, 900, -1); });
  await page.waitForTimeout(3000);
  console.log('cerca, capa', await lv());
  await page.evaluate(() => { const G = VTO.Game.G; G.birds[0].legendT = 6; });
  await page.waitForTimeout(3000);
  console.log('leyenda, capa', await lv());
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  console.log('pausa:', await page.evaluate(() => VTO.UI.current));
  console.log('ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
