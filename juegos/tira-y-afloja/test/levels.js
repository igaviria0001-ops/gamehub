const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1000);
  for (const [a, b] of [[0, 2], [1, 2], [0, 1]]) {
    const r = await page.evaluate(([a, b]) => {
      const G = TYA.Game.G, wins = [0, 0];
      for (const arena of ['pupitre', 'gimnasio', 'laboratorio', 'cafeteria']) {
        TYA.Game.startMatch('caneca', false, arena); G.winsNeeded = 999;
        for (let half = 0; half < 2; half++) {
          // cambia de lado a la mitad para que no influya el lado
          G.bots = half ? [new Bot(0, b), new Bot(1, a)] : [new Bot(0, a), new Bot(1, b)];
          const w0 = G.wins.slice();
          for (let i = 0; i < 60 * 150; i++) TYA.Game.update(1 / 60);
          const d = [G.wins[0] - w0[0], G.wins[1] - w0[1]];
          if (half) { wins[0] += d[1]; wins[1] += d[0]; } else { wins[0] += d[0]; wins[1] += d[1]; }
        }
      }
      return wins;
    }, [a, b]);
    console.log(`nivel ${a} vs nivel ${b}:`, r.join(' - '));
  }
  await browser.close();
})();
