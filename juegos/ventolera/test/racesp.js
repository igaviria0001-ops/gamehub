// Carrera en un escenario con distintas parejas de pilotos: tiempo y atascos
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 800, height: 450 } })).newPage();
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(500);
  const arena = process.env.ARENA || 'cartagena';
  const r = await page.evaluate(arena => {
    const { Game, Bot } = VTO, out = [];
    for (const sp of [['condor', 'colibri'], ['tucan', 'guacamaya'], ['colibri', 'condor']]) {
      Game.cfg.species = sp; Game.setArena(arena); Game.start('race', 2); VTO.UI.show(null, false);
      const G = Game.G; G.bots = [new Bot(G.birds[0], 3, 1), new Bot(G.birds[1], 9, 1)];
      let t = 0, stuck = {}, last = [0, 0], since = [0, 0];
      while (t < 320 && G.state !== 'matchEnd') { Game.advance(0.5); t += 0.5; for (let i = 0; i < 2; i++) { if (G.score[i] !== last[i]) { last[i] = G.score[i]; since[i] = 0; } else since[i] += 0.5; if (since[i] > 15) { const k = Math.floor(G.score[i]) % G.gates.length + 1; stuck[sp[i] + ':' + k] = (stuck[sp[i] + ':' + k] || 0) + 1; since[i] = 0; } } }
      out.push(`${sp.join(' vs ')}: ${t} s · aros ${G.score.join('-')} · atascos ${JSON.stringify(stuck)}`);
    }
    Game.cfg.species = ['guacamaya', 'condor'];
    return out;
  }, arena);
  r.forEach(x => console.log(arena, x));
  await browser.close();
})();
