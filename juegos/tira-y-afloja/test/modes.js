// Modos nuevos: capturas y simulación bot contra bot
// node modes.js shots | node modes.js sim <modo> <arena> <segundos>
const { chromium } = require('playwright');
const path = require('path');
const what = process.argv[2] || 'shots';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1200);
  if (what === 'shots') {
    await page.click('[data-act="play2"]'); await page.waitForTimeout(500);
    await page.screenshot({ path: 'shots/md-modes.png' });
    for (const [mode, arena] of [['rey', 'pupitre'], ['gol', 'gimnasio'], ['rey', 'profe']]) {
      await page.evaluate(([mode, arena]) => { TYA.UI.show(null, false); TYA.Game.startMatch(mode, false, arena); const G = TYA.Game.G; G.bots = [new Bot(0, 2), new Bot(1, 2)]; G.hintsT = 0; }, [mode, arena]);
      await page.waitForTimeout(800);
      await page.screenshot({ path: `shots/md-${mode}-${arena}-0.png` });
      await page.evaluate(() => { const G = TYA.Game.G; let g = 0; while (G.roundT < 9 && g++ < 60 * 30) TYA.Game.update(1 / 60); });
      await page.waitForTimeout(100);
      await page.screenshot({ path: `shots/md-${mode}-${arena}-1.png` });
    }
  } else {
    const mode = process.argv[3] || 'rey', arena = process.argv[4] || 'pupitre', secs = +(process.argv[5] || 300), lvl = +(process.argv[6] || 1);
    const out = await page.evaluate(([mode, arena, secs, lvl]) => {
      const G = TYA.Game.G, res = { matches: [], nan: 0 };
      let t = 0;
      while (t < secs) {
        TYA.Game.startMatch(mode, false, arena);
        G.bots = [new Bot(0, lvl), new Bot(1, lvl)];
        let g = 0;
        while (G.state !== 'matchEnd' && g++ < 60 * 400) { TYA.Game.update(1 / 60); t += 1 / 60; for (const p of G.players) if (!isFinite(p.x) || !isFinite(p.y)) res.nan++; }
        res.matches.push({ dur: +G.roundT.toFixed(1), pts: G.points.map(Math.floor), winner: G.lastWinner, goals: G.players.map(p => p.stats.goals), crown: G.players.map(p => Math.round(p.stats.crown)), dunks: G.players.map(p => p.stats.dunks) });
        if (g >= 60 * 400) { res.stuck = true; break; }
      }
      return res;
    }, [mode, arena, secs, lvl]);
    console.log(JSON.stringify(out));
  }
  console.log('ERR', errors.join('\n'));
  await browser.close();
})();
