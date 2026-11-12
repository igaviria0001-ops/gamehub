const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1000);
  const res = await page.evaluate(() => {
    const I = (o = {}) => Object.assign({ left: false, right: false, jump: false, stick: false, pull: false, release: false }, o);
    const G = TYA.Game.G, log = [];
    TYA.UI.show(null, false); TYA.Game.startMatch('caneca', false, 'cafeteria');
    let g = 0; while (G.state !== 'play' && g++ < 600) TYA.Game.update(1 / 60);
    const [A, B] = G.players;
    for (let i = 0; i < 120; i++) {
      TYA.over[0] = I({ stick: i < 80, pull: i > 10 && i < 80 }); TYA.over[1] = I();
      TYA.Game.update(1 / 60);
      if (i > 70 && i < 110) log.push([i, Math.round(A.x), Math.round(A.y), Math.round(A.vx), Math.round(A.vy), A.stuck ? 'S' : '-', A.slingT.toFixed(2), Math.round(B.x), Math.round(B.y), Math.round(B.vx), Math.round(Math.hypot(B.x - A.x, B.y - A.y)), Math.round(A.r + B.r), G.rope.strain.toFixed(2), G.hitStop.toFixed(2), A.charge.toFixed(2)].join(' '));
    }
    return log;
  });
  console.log(res.join('\n'));
  await browser.close();
})();
