// jefes de campaña con un "jugador humano" simulado (máquina más lenta y torpe que conoce la táctica)
// + compañero automático (como cuando Ignacio juega solo). Uso: LV=3,6,9 N=12 HK=0.5 [P2=1 dos humanos] node test/bossim.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 400, height: 300 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
  const lvs = (process.env.LV || '3,6,9').split(',').map(Number), N = +(process.env.N || 12), HK = +(process.env.HK || 0.5), P2 = !!process.env.P2;
  for (const lv of lvs) {
    const r = await page.evaluate(([lv, N, HK, P2]) => {
      Game.G.paused = true; const res = { by: {}, win: 0, t: [], lives: [], hpLeft: [], dmgIn: [], deaths: [] };
      // humano: k 0 novato … 0,5 normal … 1 experto
      const human = k => { const b = new Bot(1); b.P = { react: 0.5 - 0.3 * k, dodge: 0.25 + 0.5 * k, jit: 0.34 - 0.24 * k, think: 0.36 - 0.18 * k, absorb: 0.25, aggro: 0.65 + 0.3 * k }; b.lv = k < 0.5 ? 0 : 1; b.human = true; return b; };
      const chars = CHAR_ORDER.slice(); const NC = chars.length;
      for (let n = 0; n < N; n++) {
        const a = chars[(n * 3) % NC], b = chars[(n * 5 + 2) % NC] === a ? chars[(n * 3 + 1) % NC] : chars[(n * 5 + 2) % NC];
        Game.start('camp', P2 ? 2 : 1, { level: lv, chars: [a, b] }); UI.show(null, false); const G = Game.G; G.paused = true;
        G.campWin = false; G.mages[0].ctrl = human(HK); if (P2) G.mages[1].ctrl = human(HK);
        let t = 0, dmg = 0; const tap = Game.tap; Game.tap = e => { if (e.type === 'hurt' && e.unit && e.unit.isMage) { dmg += e.dmg; const k = (e.el || '?') + (e.dot ? '·dot' : ''); res.by[k] = (res.by[k] || 0) + e.dmg; } };
        while (G.state !== 'roundEnd' && G.state !== 'matchEnd' && t < 360) { Game.advance(0.5); t += 0.5; }
        Game.tap = tap;
        if (G.campWin) res.win++; res.t.push(Math.round(G.roundT)); res.lives.push(G.lives); res.hpLeft.push(G.boss ? Math.round(G.boss.hp / G.boss.maxHp * 100) : 0); res.dmgIn.push(Math.round(dmg / Math.max(1, G.roundT) * 60));
      }
      const avg = a => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(0);
      return { lv, boss: Camp.LEVELS[lv].boss, win: res.win + '/' + N, t: avg(res.t), lives: avg(res.lives), bossHpLeft: res.hpLeft.join(','), dmgInPerMin: avg(res.dmgIn), ts: res.t.join(','), by: Object.entries(res.by).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => k + ':' + Math.round(v / N)).join(' ') };
    }, [lv, N, HK, P2]);
    console.log(JSON.stringify(r));
  }
  console.log('ERR', errors.slice(0, 5).join(' | ') || 'ninguno');
  await browser.close();
})();
