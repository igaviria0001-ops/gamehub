// Balance de pilotos: cada pareja se enfrenta (cambiando de lado) con máquinas del mismo nivel; rondas ganadas por especie
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 800, height: 450 } })).newPage();
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(500);
  const arena = process.env.ARENA || 'cocora';
  const r = await page.evaluate(arena => {
    const { Game, Bot } = VTO, SP = ['guacamaya', 'colibri', 'tucan', 'condor'], won = {}, played = {}, pair = {};
    SP.forEach(s => { won[s] = 0; played[s] = 0; });
    for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) for (const swap of [0, 1]) for (const seed of [1, 2]) {
      const sp = swap ? [SP[b], SP[a]] : [SP[a], SP[b]];
      Game.cfg.species = sp.slice(); Game.setArena(arena); Game.start('duel', 2); VTO.UI.show(null, false);
      const G = Game.G; G.bots = [new Bot(G.birds[0], seed * 7 + a, 2), new Bot(G.birds[1], seed * 13 + b, 2)];
      let t = 0; while (G.state !== 'matchEnd' && t < 600) { Game.advance(0.5); t += 0.5; }
      won[sp[0]] += G.wins[0]; won[sp[1]] += G.wins[1]; played[sp[0]] += G.wins[0] + G.wins[1]; played[sp[1]] += G.wins[0] + G.wins[1];
      const k = SP[a] + '-' + SP[b]; pair[k] = pair[k] || [0, 0]; pair[k][0] += G.wins[sp.indexOf(SP[a])]; pair[k][1] += G.wins[sp.indexOf(SP[b])];
    }
    Game.cfg.species = ['guacamaya', 'condor'];
    return { porcentaje: Object.fromEntries(SP.map(s => [s, Math.round(100 * won[s] / played[s]) + ' %'])), parejas: pair };
  }, arena);
  console.log(arena, JSON.stringify(r));
  await browser.close();
})();
