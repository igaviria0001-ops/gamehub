const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('pageerror', e => console.log('pageerror: ' + e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1000);
  const out = await page.evaluate(() => {
    const G = TYA.Game.G, Game = TYA.Game;
    TYA.UI.show(null, false);
    Game.startMatch('caneca', false, 'profe'); G.bots = [null, null]; G.hintsT = 0;
    for (let i = 0; i < 200; i++) Game.update(1 / 60);
    const [A, B] = G.players;
    A.setMass(2); B.setMass(5.5);
    A.x = 800; A.y = 450; A.vx = 0; A.vy = 0; B.x = 1120; B.y = 150; B.vx = 0; B.vy = 0;
    G.rope.reset(A.x, A.y, B.x, B.y, 700);
    let minA = 9999, maxW = 0;
    const log = [];
    for (let i = 0; i < 120; i++) { TYA.over[0] = TYA.over[1] = { left: false, right: false, jump: false, stick: false, pull: false, release: false }; Game.update(1 / 60); minA = Math.min(minA, A.y); maxW = Math.max(maxW, Math.abs(ARENA.see.w)); if (i % 10 === 0) log.push([i, Math.round(A.y), Math.round(A.vy), Math.round(B.y), ARENA.see.a.toFixed(2)].join(' ')); }
    return { rise: Math.round(450 - minA), maxW: maxW.toFixed(2), log };
  });
  console.log(JSON.stringify(out));
  await page.waitForTimeout(100);
  await browser.close();
})();
