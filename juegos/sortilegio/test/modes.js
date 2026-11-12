// los modos entre máquinas: ¿terminan, quién gana, sin errores?
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
  for (const mode of (process.env.MODES || 'tejo,hunt,altar').split(',')) {
    for (const arena of (process.env.ARENAS || 'paramo,rio').split(',')) {
      const r = await page.evaluate(([mode, arena]) => {
        Game.start(mode, 0, { chars: ['candela', 'iguaque'], arena, level: 2 }); UI.show(null, false); const G = Game.G;
        let t = 0; while (G.state !== 'roundEnd' && G.state !== 'matchEnd' && t < 200) { Game.advance(0.5); t += 0.5; }
        return { t, state: G.state, score: G.score.map(Math.floor), winner: G.roundWinner, units: G.units.length };
      }, [mode, arena]);
      console.log(mode, arena, JSON.stringify(r));
    }
    await page.waitForTimeout(400); await page.screenshot({ path: path.join(__dirname, 'shots', `mode-${mode}.png`) });
  }
  console.log('ERR', errors.slice(0, 4).join(' | ') || 'ninguno');
  await browser.close();
})();
