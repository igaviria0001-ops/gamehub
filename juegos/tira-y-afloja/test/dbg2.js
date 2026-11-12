const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => console.log('pageerror: ' + e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(800);
  const out = await page.evaluate(() => {
    const G = TYA.Game.G, Game = TYA.Game;
    const I = (o = {}) => Object.assign({ left: false, right: false, jump: false, stick: false, pull: false, release: false }, o);
    Game.startMatch('caneca', false);
    const [A, B] = G.players;
    A.reset(650, ARENA.deskY, 3); B.reset(730, ARENA.deskY, 3);
    G.rope.reset(A.x, A.y, B.x, B.y, 120);
    G.state = 'play'; G.canControl = true;
    const log = [];
    for (let i = 0; i < 24; i++) {
      TYA.over[0] = I(); TYA.over[1] = I();
      Game.update(1 / 60);
      log.push([i, Math.round(A.x), Math.round(A.y), Math.round(A.vx), Math.round(B.x), Math.round(B.y), Math.round(B.vx), Math.round(G.rope.tension), G.rope.pathLen.toFixed(0), G.rope.len.toFixed(0), G.state, G.acc.toFixed(3)].join(' '));
    }
    return log;
  });
  console.log(out.join('\n'));
  await browser.close();
})();
