// Campaña: capturas de salas, mapa y flujo
// Uso: node camp.js shots [ids separados por coma] | node camp.js map
const { chromium } = require('playwright');
const path = require('path');
const what = process.argv[2] || 'shots';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1200);
  if (what === 'shots') {
    const ids = process.argv[3] ? process.argv[3].split(',') : await page.evaluate(() => Campaign.ROOMS.map(r => r.id));
    for (const id of ids) {
      await page.evaluate(id => { TYA.UI.show(null, false); const G = TYA.Game.G; G.campStage = id; TYA.Game.startMatch('campana', false, 'campana'); let g = 0; while (G.state !== 'play' && g++ < 400) TYA.Game.update(1 / 60); for (let k = 0; k < 30; k++) TYA.Game.update(1 / 60); }, id);
      await page.waitForTimeout(200);
      await page.screenshot({ path: `shots/c-${id}.png` });
    }
  } else if (what === 'map') {
    await page.click('#s-title [data-act="play2"]'); await page.waitForTimeout(250);
    await page.screenshot({ path: 'shots/c-modes.png' });
    await page.click('[data-act="mode-campana"]'); await page.waitForTimeout(300);
    await page.screenshot({ path: 'shots/c-map.png' });
  }
  console.log('ERR', errors.join('\n'));
  await browser.close();
})();
