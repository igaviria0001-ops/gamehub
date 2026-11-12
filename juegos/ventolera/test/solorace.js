// Carrera contra la máquina: la cámara te sigue a ti y un puntito marca a la máquina si no se ve
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const { Game, Bot } = VTO; Game.setArena('medellin'); Game.setMode('race'); Game.start('race', 1); VTO.UI.show(null, false);
    const G = Game.G; G.bots[0] = new Bot(G.birds[0], 3, 0); Game.advance(25); G.bots[0] = null;
    return { aros: G.score.join('-'), d: Math.round(Math.hypot(G.birds[0].x - G.birds[1].x, G.birds[0].y - G.birds[1].y)), z: Game.cam.z.toFixed(2) };
  });
  await page.waitForTimeout(200);
  console.log(JSON.stringify(r));
  await page.screenshot({ path: path.join(__dirname, 'shots', 'solorace.png') });
  console.log('ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
