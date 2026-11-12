// campaña: cada nivel con dos máquinas compañeras (o pruebas guiadas); que arranque, no falle y se pueda ganar
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
  for (const lv of (process.env.LV || '0,1,2,3,4,5,6,7,8,9').split(',').map(Number)) {
    const r = await page.evaluate(lv => {
      Game.start('camp', 0, { level: lv, chars: ['candela', 'yuma'] }); UI.show(null, false); const G = Game.G;
      let t = 0; while (G.state !== 'roundEnd' && G.state !== 'matchEnd' && t < 240) { Game.advance(0.5); t += 0.5; }
      return { lv, name: G.L.name, t, state: G.state, win: G.campWin, lives: G.lives, label: G.L.label(G), boss: G.boss ? Math.round(G.boss.hp) : null };
    }, lv);
    console.log(JSON.stringify(r));
    await page.waitForTimeout(300); await page.screenshot({ path: path.join(__dirname, 'shots', `camp-${lv}.png`) });
  }
  console.log('ERR', errors.slice(0, 5).join(' | ') || 'ninguno');
  await browser.close();
})();
