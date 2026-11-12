// Uso: node arena.js <arena> [segundos de bots]
const { chromium } = require('playwright');
const path = require('path');
const id = process.argv[2] || 'pupitre', secs = +(process.argv[3] || 240);
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL/.test(m.text())) errors.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1200);
  await page.evaluate(id => { TYA.UI.show(null, false); TYA.Game.startMatch('caneca', false, id); const G = TYA.Game.G; G.bots = [new Bot(0, 1), new Bot(1, 1)]; }, id);
  await page.waitForTimeout(4200);
  await page.screenshot({ path: `shots/a-${id}-1.png` });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `shots/a-${id}-2.png` });
  const thumb = await page.evaluate(id => { const c = ArenaArt.thumb(id, 384, 216); return c ? c.toDataURL('image/png') : null; }, id);
  if (thumb) require('fs').writeFileSync(`shots/a-${id}-thumb.png`, Buffer.from(thumb.split(',')[1], 'base64'));
  const out = await page.evaluate(([id, secs]) => {
    const G = TYA.Game.G;
    TYA.Game.startMatch('caneca', false, id); G.winsNeeded = 999;
    G.bots = [new Bot(0, 1), new Bot(1, 1)];
    const res = { rounds: [], nan: 0, maxV: 0 };
    let prev = G.wins.slice(), t0 = performance.now();
    for (let i = 0; i < 60 * secs; i++) {
      TYA.Game.update(1 / 60);
      for (const p of G.players) { if (!isFinite(p.x) || !isFinite(p.y)) res.nan++; res.maxV = Math.max(res.maxV, Math.hypot(p.vx, p.vy)); }
      if (G.wins[0] !== prev[0] || G.wins[1] !== prev[1]) { res.rounds.push(+G.roundT.toFixed(1)); prev = G.wins.slice(); }
    }
    res.ms = Math.round(performance.now() - t0);
    res.n = res.rounds.length; res.avg = +(res.rounds.reduce((a, b) => a + b, 0) / Math.max(1, res.n)).toFixed(1);
    res.wins = G.wins; res.stats = G.players.map(p => p.stats); res.rounds = res.rounds.slice(0, 10); res.maxV = Math.round(res.maxV);
    return res;
  }, [id, secs]);
  console.log(id, JSON.stringify(out));
  console.log('ERRORS', errors.join('\n'));
  await browser.close();
})();
