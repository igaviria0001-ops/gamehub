const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1000);
  const st = await page.evaluate(() => {
    TYA.UI.show(null, false); TYA.Game.startMatch('caneca', false, 'pupitre');
    const G = TYA.Game.G; G.hintsT = 0; let g = 0; while (G.state !== 'play' && g++ < 600) TYA.Game.update(1 / 60);
    const I = (o = {}) => Object.assign({ left: false, right: false, jump: false, stick: false, pull: false, release: false }, o);
    const [A] = G.players; const log = [];
    for (let i = 0; i < 70; i++) { TYA.over[0] = I({ stick: true, pull: i > 5 && i < 40 }); TYA.over[1] = I({ stick: i > 3 }); TYA.Game.update(1 / 60); log.push(A.stuck ? A.charge.toFixed(2) : 'x'); if (A.charge >= 1 && i > 50) break; }
    return log.join(' ');
  });
  console.log(st);
  await page.screenshot({ path: 'shots/m-charge.png' });
  await browser.close();
})();
