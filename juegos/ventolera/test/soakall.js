// Resistencia: cada escenario con cada modo, máquinas jugando 70 s; busca errores, NaN y pilotos fuera del mapa
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 960, height: 540 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(600);
  const r = await page.evaluate((AR) => {
    const { Game, Bot } = VTO, out = [];
    for (const arena of AR.split(',')) for (const mode of ['duel', 'targets', 'case', 'race', 'boss', 'free']) {
      Game.setArena(arena); Game.start(mode, 1); VTO.UI.show(null, false);
      const G = Game.G; G.bots = [new Bot(G.birds[0], 7, 2), G.bots[1] || new Bot(G.birds[1], 13, 1)];
      let bad = 0, out_ = 0, t = 0, err = null;
      try {
        while (t < 70 && G.state !== 'matchEnd') {
          Game.advance(0.25); t += 0.25;
          for (const b of G.birds) { if (!isFinite(b.x) || !isFinite(b.y) || !isFinite(b.vx) || !isFinite(b.hp)) bad++; if (b.alive && (b.x < -50 || b.x > G.world.w + 50 || b.y > G.world.groundY(b.x) + 40)) out_++; }
          if (G.world.coast) for (const B of G.world.coast.balls) if (!isFinite(B.x)) bad++;
        }
      } catch (e) { err = e.message; }
      out.push(`${arena}/${mode}: t=${t} ${G.state}${bad ? ' NaN=' + bad : ''}${out_ ? ' fuera=' + out_ : ''}${err ? ' ERROR ' + err : ''}`);
    }
    return out;
  }, process.env.ARENAS || 'cocora,medellin,bogota,cartagena');
  r.forEach(x => console.log(x));
  console.log('ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
