// Repetición: partida a 1 ronda con bots y captura durante la repetición
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1000);
  const r = await page.evaluate(() => {
    TYA.UI.show(null, false);
    TYA.Game.startMatch('caneca', false, 'cafeteria');
    const G = TYA.Game.G; G.winsNeeded = 1; G.bots = [new Bot(0, 2), new Bot(1, 2)]; G.hintsT = 0;
    let g = 0; while (G.state !== 'replay' && G.state !== 'matchEnd' && g++ < 60 * 140) TYA.Game.update(1 / 60);
    const st1 = G.state;
    for (let i = 0; i < 90; i++) TYA.Game.update(1 / 60);
    return { st1, frames: G.replay ? G.replay.frames.length : 0, dur: G.replay ? G.replay.dur.toFixed(2) : 0 };
  });
  console.log(JSON.stringify(r));
  await page.waitForTimeout(100);
  await page.screenshot({ path: 'shots/replay.png' });
  const after = await page.evaluate(() => { const G = TYA.Game.G; let g = 0; while (G.state === 'replay' && g++ < 60 * 20) TYA.Game.update(1 / 60); return G.state; });
  console.log('after', after, 'ERR', errors.join('\n'));
  await browser.close();
})();
