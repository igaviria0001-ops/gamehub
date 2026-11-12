// Duelos máquina contra máquina: cuánto dura cada ronda y cuántas se van al tiempo (sin derribo)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 800, height: 450 } })).newPage();
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const { Game, Bot } = VTO, out = [];
    for (const arena of ['cocora', 'medellin', 'bogota', 'cartagena']) for (const L of [1, 2]) {
      const rounds = []; let regen = 0;
      for (let seed = 1; seed <= 3; seed++) {
        Game.setArena(arena); Game.start('duel', 2); VTO.UI.show(null, false);
        const G = Game.G; G.bots = [new Bot(G.birds[0], seed * 7, L), new Bot(G.birds[1], seed * 13, L)];
        let t = 0, rt = 0, last = G.round;
        while (G.state !== 'matchEnd' && t < 700) {
          Game.advance(0.25); t += 0.25; if (G.state === 'play') rt += 0.25;
          if (G.state === 'roundEnd' && rt > 0) { rounds.push({ t: rt, timeUp: G.roundT <= 0.01 }); rt = 0; while (G.state === 'roundEnd') { Game.advance(0.25); t += 0.25; } }
        }
      }
      const n = rounds.length, to = rounds.filter(x => x.timeUp).length, avg = rounds.reduce((s, x) => s + x.t, 0) / n;
      out.push(`${arena} nivel ${L}: ${n} rondas · promedio ${avg.toFixed(0)} s · al tiempo ${to} (${Math.round(100 * to / n)} %)`);
    }
    return out;
  });
  r.forEach(x => console.log(x));
  await browser.close();
})();
