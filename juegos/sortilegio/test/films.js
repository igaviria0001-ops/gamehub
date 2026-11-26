// cinemáticas: que arranquen, se dibujen sin errores y se puedan saltar; fotos en shots/film-<id>-<t>.png
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
  const plan = { buziraco: [1, 2.9, 3.5, 6, 10.5, 14.5, 18.5, 23], lv18: [1.5, 3], lv20: [2, 5.5, 8.5], lv23: [6, 8.5], lv25: [6.5, 9], final: [2, 4.5, 11, 15, 22.5] };
  for (const [id, times] of Object.entries(process.env.F ? Object.fromEntries(Object.entries(plan).filter(([k]) => process.env.F.split(',').includes(k))) : plan)) {
    await page.evaluate(id => { Game.start('camp', 0, { level: 18, chars: ['candela', 'yuma'] }); UI.show(null, false); Film.play(id.startsWith('lv') ? Film.levelFilm(Camp.LEVELS[+id.slice(2)]) : id); }, id);
    for (const t of times) { await page.evaluate(t => Film._seek(t), t); await page.waitForTimeout(160); await page.screenshot({ path: path.join(__dirname, 'shots', `film-${id}-${t}.png`) }); }
    const skipped = await page.evaluate(() => { document.querySelector('#film + button').click(); return !Film.on && !Game.G.paused; });
    console.log(id, skipped ? 'se salta ✓' : '✗ no se saltó');
  }
  console.log('ERR', errors.slice(0, 4).join(' | ') || 'ninguno'); await browser.close();
})();
