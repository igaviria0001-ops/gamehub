const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1200);
  const out = await page.evaluate(() => {
    const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
    TYA.UI.show(null, false);
    const res = {};
    for (const id of ['torre', 'pupitre', 'profe']) {
      TYA.Game.startMatch(id === 'torre' ? 'escalada' : 'caneca', false, id);
      const G = TYA.Game.G; G.bots = [new Bot(0, 1), new Bot(1, 1)];
      for (let i = 0; i < 200; i++) TYA.Game.update(1 / 60);
      const runs = [];
      for (let k = 0; k < 4; k++) { const t0 = performance.now(); for (let i = 0; i < 40; i++) TYA.Game.render(ctx, cv.width, cv.height, 1); runs.push(+((performance.now() - t0) / 40).toFixed(1)); }
      // solo el fondo dinámico
      const t1 = performance.now(); for (let i = 0; i < 40; i++) ArenaArt.drawDynamic(ctx, G.t, G); const dyn = +((performance.now() - t1) / 40).toFixed(1);
      const t2 = performance.now(); for (let i = 0; i < 40; i++) G.players.forEach(p => p.draw(ctx, G.t)); const pl = +((performance.now() - t2) / 40).toFixed(1);
      const t3 = performance.now(); for (let i = 0; i < 40; i++) G.rope.draw(ctx, G.players[0], G.players[1], G.t); const rp = +((performance.now() - t3) / 40).toFixed(1);
      const t4 = performance.now(); for (let i = 0; i < 40; i++) ctx.drawImage(ArenaArt.bg, 0, 0, 1920, 1080); const bg = +((performance.now() - t4) / 40).toFixed(1);
      res[id] = { runs, dyn, players: pl, rope: rp, bg };
    }
    return res;
  });
  console.log(JSON.stringify(out));
  await browser.close();
})();
