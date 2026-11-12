const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
  const lv = +(process.env.LV || 12), chars = (process.env.CH || 'zuhe,chia').split(',');
  const r = await page.evaluate(([lv, chars]) => {
    Game.start('camp', 0, { level: lv, chars }); UI.show(null, false); const G = Game.G; const log = [];
    const tap = Game.tap; Game.tap = e => { if (['seal', 'down', 'fall', 'doorOpen', 'bossExposed', 'totem'].includes(e.type)) log.push(Math.round(G.roundT) + ':' + e.type + (e.who != null ? e.who : '')); };
    let t = 0; while (G.state !== 'roundEnd' && G.state !== 'matchEnd' && t < +(240)) { Game.advance(0.5); t += 0.5; }
    Game.tap = tap;
    return { t, why: G.roundWhy, win: G.campWin, lives: G.lives, label: G.L.label(G), log: log.join(' '), boss: G.boss ? Math.round(G.boss.hp) : null, pos: G.mages.map(m => [Math.round(m.x), Math.round(m.y), m.hands.map(h => h.el).join('/')]) };
  }, [lv, chars]);
  console.log(JSON.stringify(r)); console.log('ERR', errors.slice(0, 4).join(' | ') || 'ninguno');
  if (process.env.SHOT) { await page.waitForTimeout(400); await page.screenshot({ path: path.join(__dirname, 'shots', 'lvdbg.png') }); }
  await browser.close();
})();
