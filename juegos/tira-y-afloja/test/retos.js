// Retos de técnica: capturas de cada reto, pantalla de lista y pruebas de que se pueden superar
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
    await page.click('#s-title [data-act="retos"]'); await page.waitForTimeout(400);
    await page.screenshot({ path: 'shots/re-list.png' });
    const only = process.argv[3] ? process.argv[3].split(',').map(Number) : [...Array(12).keys()];
    for (const i of only) {
      await page.evaluate(i => { TYA.UI.show(null, false); Retos.start(i); const G = TYA.Game.G; let g = 0; while (G.state !== 'play' && g++ < 400) TYA.Game.update(1 / 60); for (let k = 0; k < 40; k++) TYA.Game.update(1 / 60); }, i);
      await page.waitForTimeout(250);
      await page.screenshot({ path: `shots/re-${String(i + 1).padStart(2, '0')}.png` });
    }
  } else if (what === 'done') {
    await page.evaluate(() => { TYA.UI.show(null, false); Retos.start(0); const G = TYA.Game.G; let g = 0; while (G.state !== 'play' && g++ < 400) TYA.Game.update(1 / 60); G.reto.stars.forEach(s => { s.got = true; }); G.reto.t = 7.2; TYA.Game.update(1 / 60); for (let k = 0; k < 40; k++) TYA.Game.update(1 / 60); });
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'shots/re-done.png' });
    // siguiente reto con saltar
    await page.evaluate(() => { TYA.over[0] = { left: false, right: false, jump: true, stick: false, pull: false, release: false }; for (let k = 0; k < 5; k++) TYA.Game.update(1 / 60); TYA.over[0] = null; });
    const st = await page.evaluate(() => ({ idx: TYA.Game.G.reto && TYA.Game.G.reto.idx, data: JSON.stringify(Retos.data), ach: Progress.has(Progress.names[0], 'retador') }));
    console.log(JSON.stringify(st));
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    await page.screenshot({ path: 'shots/re-pause.png' });
    await page.click('[data-act="retos-list"]'); await page.waitForTimeout(400);
    await page.screenshot({ path: 'shots/re-list2.png' });
  }
  console.log('ERR', errors.join('\n'));
  await browser.close();
})();
