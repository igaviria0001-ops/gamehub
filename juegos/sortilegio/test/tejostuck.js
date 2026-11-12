// Tejo: ¿dónde se queda quieto (o encerrado) el disco? Máquina vs máquina en cada escenario.
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 400, height: 300 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
  for (const arena of (process.env.ARENAS || 'paramo,rio,volcan,ciudad,cano').split(',')) {
    const r = await page.evaluate(([arena, N]) => {
      Game.G.paused = true; const stuck = [], ends = []; let goals = 0, totalT = 0, rescues = 0;
      for (let n = 0; n < N; n++) {
        Game.start('tejo', 0, { chars: [CHAR_ORDER[n % CHAR_ORDER.length], CHAR_ORDER[(n * 5 + 3) % CHAR_ORDER.length]], arena, level: 1 }); UI.show(null, false); const G = Game.G; G.paused = true;
        let t = 0, still = 0, ax = 0, ay = 0, win = []; const tap = Game.tap; Game.tap = e => { if (e.type === 'goal') goals++; if (e.type === 'tejoRescue') rescues++; };
        while (G.state !== 'roundEnd' && G.state !== 'matchEnd' && t < 200) { Game.advance(0.25); t += 0.25; const tj = G.tejo; if (!tj || G.state !== 'play') continue;
          win.push([tj.x, tj.y]); if (win.length > 24) win.shift();
          if (win.length === 24) { const xs = win.map(p => p[0]), ys = win.map(p => p[1]); const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)); if (span < 70 && G.tejoWait <= 0) { stuck.push([Math.round(tj.x), Math.round(tj.y)]); win = []; } } }
        Game.tap = tap; totalT += t; ends.push(G.score.join('-'));
      }
      // agrupar puntos de atasco por celdas de 120 px
      const grid = {}; for (const [x, y] of stuck) { const k = Math.round(x / 120) * 120 + ',' + Math.round(y / 120) * 120; grid[k] = (grid[k] || 0) + 1; }
      return { arena, W: Game.G.T.W, H: Game.G.T.H, goals, rescues, avgT: Math.round(totalT / N), stuck6s: stuck.length, spots: Object.entries(grid).sort((a, b) => b[1] - a[1]).slice(0, 8), ends: ends.join(' ') };
    }, [arena, +(process.env.N || 6)]);
    console.log(JSON.stringify(r));
  }
  console.log('ERR', errors.slice(0, 4).join(' | ') || 'ninguno'); await browser.close();
})();
