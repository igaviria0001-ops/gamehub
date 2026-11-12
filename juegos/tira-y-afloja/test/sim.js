const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1000);
  const out = await page.evaluate(() => {
    const G = TYA.Game.G;
    const res = { rounds: [], nan: 0, maxStrain: 0, rams: 0, slings: 0, stucks: 0, golden: 0 };
    let lastRound = G.round, lastT = 0, t = 0;
    let prevWins = G.wins.slice();
    for (let i = 0; i < 60 * 600; i++) {
      TYA.Game.update(1 / 60); t += 1 / 60;
      for (const p of G.players) if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.mass)) res.nan++;
      res.maxStrain = Math.max(res.maxStrain, G.rope.strain);
      if (G.wins[0] !== prevWins[0] || G.wins[1] !== prevWins[1]) {
        res.rounds.push({ dur: +(G.roundT).toFixed(1), w: G.wins[0] !== prevWins[0] ? 0 : 1, sd: G.suddenDeath });
        prevWins = G.wins.slice();
      }
      if (G.state === 'roundEnd' && G.stateT < 1/60 && G.wins[0] === prevWins[0] && G.wins[1] === prevWins[1]) {}
    }
    res.stats = G.players.map(p => p.stats);
    res.n = res.rounds.length;
    res.avg = +(res.rounds.reduce((a, r) => a + r.dur, 0) / Math.max(1, res.rounds.length)).toFixed(1);
    res.sdCount = res.rounds.filter(r => r.sd).length;
    res.wins = G.wins;
    res.rounds = res.rounds.slice(0, 12);
    return res;
  });
  console.log(JSON.stringify(out, null, 0));
  console.log('ERRORS', errors.join('\n'));
  await browser.close();
})();
