// balance: máquina difícil contra máquina difícil, todos los cruces de magos
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 400, height: 300 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(600);
  const R = +(process.env.R || 4), only = process.env.ONLY ? process.env.ONLY.split(',') : null, arena = process.env.ARENA || 'paramo';
  if (process.env.PRE) await page.evaluate(process.env.PRE);
  const res = await page.evaluate(([R, only, arena]) => {
    Game.G.paused = true;
    const C = only || CHAR_ORDER, win = {}, games = {}, len = [], fus = {}, cast = {};
    C.forEach(c => { win[c] = 0; games[c] = 0; });
    const t0 = performance.now();
    for (const a of C) for (const b of C) {
      if (a === b) continue;
      for (let r = 0; r < R; r++) {
        Game.start('duel', 0, { chars: [a, b], wins: 1, level: 2, arena }); const G = Game.G; G.paused = true;
        let t = 0; while (G.state !== 'roundEnd' && t < 90) { Game.advance(0.25); t += 0.25; }
        const w = G.roundWinner; len.push(G.roundT);
        games[a]++; games[b]++; if (w === 0) win[a]++; else if (w === 1) win[b]++; else { win[a] += 0.5; win[b] += 0.5; }
        for (const m of G.mages) { fus[m.cid] = (fus[m.cid] || 0) + m.stats.fusions; cast[m.cid] = (cast[m.cid] || 0) + m.stats.casts; }
      }
    }
    const rate = {}; for (const c of C) rate[c] = Math.round(win[c] / games[c] * 100) + '%';
    len.sort((a, b) => a - b);
    const dmg = {}; return { rate, ms: Math.round(performance.now() - t0), len: [len[0], len[len.length >> 1], len[len.length - 1]].map(Math.round), n: len.length };
  }, [R, only, arena]);
  console.log(JSON.stringify(res), 'ERR', errors.slice(0, 3).join(' | ') || 'ninguno');
  await browser.close();
})();
