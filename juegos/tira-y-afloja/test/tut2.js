const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => console.log('pageerror: ' + e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1000);
  await page.click('[data-act="howto"]'); await page.waitForTimeout(300);
  await page.click('[data-act="tut-solo"]'); await page.waitForTimeout(800);
  console.log(await page.evaluate(() => {
    const G = TYA.Game.G, A = G.players[0], out = [];
    for (let i = 0; i < 60; i++) { TYA.over[0] = { left: false, right: true, jump: false, stick: false, pull: false, release: false }; TYA.Game.update(1 / 60); if (i % 10 === 0) out.push([G.state, G.canControl, Math.round(A.x), A.alive, G.tutorial && G.tutorial.step, G.tutorial && JSON.stringify(G.tutorial.prog[0]), UI.paused, UI.current].join(' ')); }
    return out.join('\n');
  }));
  await browser.close();
})();
