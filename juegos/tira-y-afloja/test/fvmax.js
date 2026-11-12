const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1200);
  const out = await page.evaluate(() => {
    const G = TYA.Game.G, hits = [];
    for (const a of ARENA_LIST.map(d => d.id)) {
      TYA.Game.startMatch('caneca', false, a, true); G.winsNeeded = 999;
      G.bots = [new Bot(0, 1), new Bot(1, 1)];
      for (let i = 0; i < 60 * 400; i++) {
        TYA.Game.update(1 / 60);
        for (const p of G.players) { const v = Math.hypot(p.vx, p.vy); if (v > 3250 && hits.length < 12) hits.push([a, Fiesta.cur, G.state, p.alive, p.dunked, Math.round(v), Math.round(p.vx), Math.round(p.vy), p.mass.toFixed(1), Math.round(p.y)]); }
      }
    }
    return hits;
  });
  console.log(JSON.stringify(out));
  await browser.close();
})();
