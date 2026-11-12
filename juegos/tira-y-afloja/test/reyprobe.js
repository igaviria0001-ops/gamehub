const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1000);
  const out = await page.evaluate(() => {
    const G = TYA.Game.G; const res = { none: 0, single: 0, both: 0, stuckBoth: 0, offThrone: 0, dead: 0 };
    TYA.Game.startMatch('rey', false, 'cafeteria'); G.bots = [new Bot(0, 1), new Bot(1, 1)];
    for (let i = 0; i < 60 * 100 && G.state !== 'matchEnd'; i++) {
      TYA.Game.update(1 / 60);
      if (G.state !== 'play') continue;
      const T = Modes.throne;
      if (T.owner === -1) res.none++; else if (T.owner === 2) { res.both++; if (G.players.every(p => p.stuck)) res.stuckBoth++; } else res.single++;
      if (G.players.some(p => !p.alive)) res.dead++;
    }
    for (const k in res) res[k] = +(res[k] / 60).toFixed(1);
    res.masses = G.players.map(p => p.mass.toFixed(1)); res.rope = Math.round(G.rope.len);
    return res;
  });
  console.log(JSON.stringify(out));
  await browser.close();
})();
