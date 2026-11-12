// ventaja: bot contra bot (mismo nivel), con y sin ventaja; cuenta rondas ganadas
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(800);
  const out = await page.evaluate(() => {
    const G = TYA.Game.G, res = {};
    for (const h of [[0, 0], [2, 0], [0, 2]]) {
      TYA.Game.setHandicap(0, h[0]); TYA.Game.setHandicap(1, h[1]);
      let w = [0, 0, 0];
      for (let m = 0; m < 30; m++) {
        TYA.Game.startMatch('caneca', true, 'pupitre');
        const b0 = TYA.makeBot(0, 2); G.winsNeeded = 1;
        let k = 0;
        while (G.state !== 'matchEnd' && k < 60 * 120) { TYA.over[0] = b0.think(1 / 60, G); TYA.Game.update(1 / 60); k++; }
        const lw = G.wins[0] > G.wins[1] ? 0 : G.wins[1] > G.wins[0] ? 1 : 2; w[lw]++;
      }
      res[h.join('-')] = w.join('/') + ' on:' + TYA.Game.hcOn();
    }
    TYA.Game.setHandicap(0, 0); TYA.Game.setHandicap(1, 0); TYA.over[0] = null;
    return res;
  });
  console.log(JSON.stringify(out), 'ERR', errors.join(' | '));
  await browser.close();
})();
