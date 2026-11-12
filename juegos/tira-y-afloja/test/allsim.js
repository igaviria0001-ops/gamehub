// Simulación bot vs bot en todas las arenas: node allsim.js [segundos por arena] [nivel]
const { chromium } = require('playwright');
const path = require('path');
const secs = +(process.argv[2] || 240), lvl = +(process.argv[3] || 1), mode = process.argv[4] || 'caneca', flag = process.argv[5] || '';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1200);
  const out = await page.evaluate(([secs, lvl, mode, flag]) => {
    const G = TYA.Game.G, res = {};
    if (flag === 'noclimb') G.noClimb = true;
    let saves = 0; const origOn = Progress.on; Progress.on = (t, d) => { if (t === 'saved') saves++; return origOn(t, d); };
    for (const d of ARENA_LIST) {
      TYA.Game.startMatch(mode, false, d.id); G.winsNeeded = 999;
      G.bots = [new Bot(0, lvl), new Bot(1, lvl)];
      const r = { n: 0, t: 0, w: [0, 0], nan: 0, rams: 0, slings: 0, draws: 0, dives: 0, aj: 0 };
      let prev = G.wins.slice(), prevDraw = 0;
      for (let i = 0; i < 60 * secs; i++) {
        const before = G.state;
        TYA.Game.update(1 / 60);
        for (const p of G.players) { if (!isFinite(p.x) || !isFinite(p.y)) r.nan++; for (const e of p.events) { if (e.type === 'dive') r.dives++; if (e.type === 'airjump') r.aj++; } }
        if (G.wins[0] !== prev[0] || G.wins[1] !== prev[1]) { r.n++; r.t += G.roundT; r.w[G.wins[0] !== prev[0] ? 0 : 1]++; prev = G.wins.slice(); }
        else if (before === 'play' && G.state === 'roundEnd') r.draws++;
      }
      r.t = +(r.t / Math.max(1, r.n)).toFixed(1);
      r.rams = G.players[0].stats.rams + G.players[1].stats.rams; r.slings = G.players[0].stats.slings + G.players[1].stats.slings;
      if (mode === 'chicles') r.points = G.points.slice();
      r.saves = saves; saves = 0;
      res[d.id] = r;
    }
    return res;
  }, [secs, lvl, mode, flag]);
  for (const [k, v] of Object.entries(out)) console.log(k.padEnd(12), JSON.stringify(v));
  console.log('ERR', errors.join('\n'));
  await browser.close();
})();
