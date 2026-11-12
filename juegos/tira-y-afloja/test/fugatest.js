// Fuga: ¿pueden dos bots pasar los niveles? Tiempo, reintentos, estrellas; y capturas
const { chromium } = require('playwright');
const path = require('path');
const what = process.argv[2] || 'sim';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1200);
  if (what === 'shots') {
    await page.click('[data-act="play2"]'); await page.waitForTimeout(300);
    await page.screenshot({ path: 'shots/fu-modes.png' });
    await page.click('[data-act="mode-fuga"]'); await page.waitForTimeout(300);
    await page.screenshot({ path: 'shots/fu-levels.png' });
    await page.evaluate(() => { TYA.UI.show(null, false); TYA.Game.G.fugaLevel = 4; TYA.Game.startMatch('fuga', false, 'torre'); const G = TYA.Game.G; G.bots = [new Bot(0, 2), new Bot(1, 2)]; G.hintsT = 0; });
    await page.waitForTimeout(3500);
    await page.evaluate(() => { const G = TYA.Game.G; let g = 0; while (G.roundT < 14 && G.state === 'play' && g++ < 60 * 30) TYA.Game.update(1 / 60); });
    await page.waitForTimeout(100);
    await page.screenshot({ path: 'shots/fu-play.png' });
  } else {
    const levels = (process.argv[3] || '1,2,3,4,5,6').split(',').map(Number);
    const out = await page.evaluate(levels => {
      const G = TYA.Game.G, res = {};
      for (const lv of levels) {
        G.fugaLevel = lv; TYA.Game.startMatch('fuga', false, 'torre');
        G.bots = [new Bot(0, 2), new Bot(1, 2)];
        let g = 0;
        while (G.state !== 'matchEnd' && g++ < 60 * 300) TYA.Game.update(1 / 60);
        const r = Modes.fugaResult;
        res[lv] = G.state === 'matchEnd' && r && r.level === lv ? { ok: true, t: +r.time.toFixed(1), stars: r.stars, par: r.par, tries: G.round } : { ok: false, tries: G.round, ys: G.players.map(p => Math.round(p.y)), top: ARENA.L.topY };
      }
      return res;
    }, levels);
    console.log(JSON.stringify(out));
  }
  console.log('ERR', errors.join('\n'));
  await browser.close();
})();
