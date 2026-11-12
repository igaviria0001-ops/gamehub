// capturas de partida real (bots), cámara normal
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(800);
  const T = +(process.env.T || 9);
  for (const [arena, a, b] of (process.env.A ? JSON.parse(process.env.A) : [['paramo', 'candela', 'yuma'], ['rio', 'frailejon', 'catatumbo'], ['volcan', 'purace', 'iguaque'], ['ciudad', 'yuma', 'catatumbo']])) {
    await page.evaluate(([arena, a, b, T]) => { Game.start('duel', 0, { chars: [a, b], arena, level: 2 }); UI.show(null, false); Game.advance(T); }, [arena, a, b, T]);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(__dirname, 'shots', `play-${arena}.png`) });
  }
  console.log('ERR', errors.join(' | ') || 'ninguno'); await browser.close();
})();
