// Mundo 3 en tinta: capturas de un escenario en sus cuatro estaciones (y lo que tarda en pintarse cada una).
// Uso: node juegos/sortilegio/test/ink.js   (A=miyajima · V=pc,cel · Q=alta|media|ligera · MID=1 para la pincelada a medias)
const { chromium } = require('playwright');
const path = require('path');
const VIEWS = { pc: [{ width: 1280, height: 720 }, {}], cel: [{ width: 844, height: 390 }, { deviceScaleFactor: 2, isMobile: true, hasTouch: true }], app: [{ width: 587, height: 262 }, { deviceScaleFactor: 2.6, isMobile: true, hasTouch: true }] };
(async () => {
  const browser = await chromium.launch();
  const arena = process.env.A || 'miyajima';
  for (const v of (process.env.V || 'pc,cel').split(',')) {
    const [vp, o] = VIEWS[v]; const ctx = await browser.newContext(Object.assign({ viewport: vp }, o)); const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
    await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(800);
    if (process.env.Q) await page.evaluate(q => Game.setQuality(q, true), process.env.Q);
    const t0 = await page.evaluate(arena => { const a = performance.now(); Game.start('duel', 0, { chars: ['candela', 'yuma'], arena, level: 2 }); UI.show(null, false); Game.advance(4); return performance.now() - a; }, arena);
    await page.waitForTimeout(400);
    const times = {};
    for (const s of SEASON_LIST()) {
      times[s] = await page.evaluate(s => { const a = performance.now(); ArtInk.prerender(Game.G, s); const ms = performance.now() - a; if (Game.G.sea) Seasons.set(Game.G, 0, s); return ms; }, s);
      if (process.env.MID) { await page.waitForTimeout(420); await page.screenshot({ path: path.join(__dirname, 'shots', `ink-${arena}-${s}-mid-${v}.png`) }); }
      await page.waitForTimeout(1200); await page.evaluate(() => Game.advance(1.5)); await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(__dirname, 'shots', `ink-${arena}-${s}-${v}.png`) });
    }
    console.log(v, 'arranque', t0.toFixed(0), 'ms · pintar cada estación (ms):', JSON.stringify(Object.fromEntries(Object.entries(times).map(([k, x]) => [k, Math.round(x)]))), 'ERR', errors.join(' | ') || 'ninguno');
    await ctx.close();
  }
  await browser.close();
})();
function SEASON_LIST() { return (process.env.S || 'spring,summer,autumn,winter').split(','); }
