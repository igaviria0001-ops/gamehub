// Escalada: capturas y simulación
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
    await page.click('[data-act="play2"]'); await page.waitForTimeout(400);
    await page.screenshot({ path: 'shots/es-modes.png' });
    await page.evaluate(() => { TYA.UI.show(null, false); TYA.Game.startMatch('escalada', false, 'torre'); const G = TYA.Game.G; G.bots = [new Bot(0, 2), new Bot(1, 2)]; G.hintsT = 0; });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'shots/es-0.png' });
    for (const T of [9, 14]) {
      const st = await page.evaluate(T => { const G = TYA.Game.G; let g = 0; while (G.roundT < T && G.state === 'play' && g++ < 60 * 40) TYA.Game.update(1 / 60); return [G.state, G.roundT.toFixed(1), G.players.map(p => Math.round(p.y)), Math.round(Modes.waterY)]; }, T);
      console.log(JSON.stringify(st));
      await page.waitForTimeout(150);
      await page.screenshot({ path: `shots/es-${T}.png` });
    }
  } else {
    const secs = +(process.argv[3] || 400), lvl = +(process.argv[4] || 1);
    const out = await page.evaluate(([secs, lvl]) => {
      const G = TYA.Game.G, res = { rounds: [], nan: 0 };
      TYA.Game.startMatch('escalada', false, 'torre'); G.winsNeeded = 999;
      G.bots = [new Bot(0, lvl), new Bot(1, lvl)];
      let prev = G.wins.slice(), prevRound = G.round, maxClimb = [640, 640];
      for (let i = 0; i < 60 * secs; i++) {
        const st = G.state;
        TYA.Game.update(1 / 60);
        for (const p of G.players) { if (!isFinite(p.x) || !isFinite(p.y)) res.nan++; if (p.alive) maxClimb[p.id] = Math.min(maxClimb[p.id], p.y); }
        if (st === 'play' && G.state === 'roundEnd') {
          const w = G.wins[0] !== prev[0] ? 0 : G.wins[1] !== prev[1] ? 1 : null;
          res.rounds.push({ t: +G.roundT.toFixed(1), w, bell: G.players.map(p => p.stats.bells), top: maxClimb.map(Math.round) });
          prev = G.wins.slice(); maxClimb = [640, 640];
        }
      }
      return res;
    }, [secs, lvl]);
    console.log(JSON.stringify(out));
  }
  console.log('ERR', errors.join('\n'));
  await browser.close();
})();
