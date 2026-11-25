const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 960, height: 540 } })).newPage();
  await p.addInitScript(() => { localStorage.setItem('srt_quality', JSON.stringify('alta')); localStorage.setItem('srt_qManual', 'true'); });
  await p.goto('file://' + path.resolve('test/index.html')); await p.waitForTimeout(800);
  await p.evaluate(a => { UI.show(null, false); Game.start('duel', 0, { chars: ['galeras', 'cocuy'], wins: 3, level: 4, arena: a }); Game.G.introT = 0; Game.G.countT = 9; }, process.env.ARENA || 'volcan');
  await p.waitForTimeout(900); await p.screenshot({ path: process.env.OUT || '/tmp/lava0.png' });
  const info = await p.evaluate(() => { const T = Game.G.T; let base = 0, dyn = 0, cool = 0; for (let i = 0; i < T.base.length; i++) { if (T.base[i] === TT.LAVA) base++; if (T.lava[i] > 0) dyn++; if (T.cool[i] > 0) cool++; } return { base, dyn, cool, CELL }; });
  console.log(JSON.stringify(info)); await b.close(); })();
