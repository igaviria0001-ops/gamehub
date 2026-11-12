// por qué gana o pierde un mago: daño por elemento y hechizos usados
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 400, height: 300 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(600);
  const [A, B] = (process.env.PAIR || 'candela,yuma').split(','), R = +(process.env.R || 6);
  const res = await page.evaluate(([A, B, R]) => {
    Game.G.paused = true; const took = [{}, {}], used = [{}, {}], wins = [0, 0], len = [];
    for (let r = 0; r < R; r++) {
      Game.start('duel', 0, { chars: r % 2 ? [B, A] : [A, B], wins: 1, level: 2, arena: 'paramo' }); const G = Game.G; G.paused = true;
      const side = r % 2 ? [1, 0] : [0, 1];
      let t = 0;
      Game.tap = e => {
        if (e.type === 'hurt' && e.who >= 0) { const k = side.indexOf(e.who); took[k][e.el] = (took[k][e.el] || 0) + e.dmg; }
        if (e.type === 'cast') { const k = side.indexOf(e.who); const n = e.fusion ? FUSIONS[e.fusion].name : SPELLS[e.el] ? SPELLS[e.el][e.level === 2 ? 1 : 0].name : e.el; used[k][n] = (used[k][n] || 0) + 1; }
      };
      while (G.state !== 'roundEnd' && t < 90) { Game.advance(0.25); t += 0.25; }
      len.push(Math.round(G.roundT)); if (G.roundWinner >= 0) wins[side.indexOf(G.roundWinner)]++;
    }
    for (const o of took) for (const k in o) o[k] = Math.round(o[k] / R); return { wins, len, took, used };
  }, [A, B, R]);
  console.log(A, 'vs', B, JSON.stringify(res), 'ERR', errors.slice(0, 3).join(' | ') || 'ninguno');
  await browser.close();
})();
