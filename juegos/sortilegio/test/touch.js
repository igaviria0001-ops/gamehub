// táctil: dos en un teléfono — palanca, manos, fusión deslizando y esquive
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(800);
  await page.tap('[data-act="play2"]'); await page.waitForTimeout(200); await page.tap('#goTop'); await page.waitForTimeout(6500);
  const L = await page.evaluate(() => Touch.layout());
  const cdp = await ctx.newCDPSession(page);
  const touch = async (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p, i) => ({ x: p[0], y: p[1], id: p[2] != null ? p[2] : i })) });
  const p0 = await page.evaluate(() => Game.G.mages.map(m => Math.round(m.x)));
  // J1 palanca a la derecha, J2 palanca a la izquierda
  const s1 = L[0].stickHome, s2 = L[1].stickHome;
  await touch('touchStart', [[s1.x, s1.y, 1], [s2.x, s2.y, 2]]); await touch('touchMove', [[s1.x + 40, s1.y, 1], [s2.x - 40, s2.y, 2]]); await page.waitForTimeout(500);
  const p1 = await page.evaluate(() => Game.G.mages.map(m => Math.round(m.x)));
  await touch('touchEnd', []);
  // J1 toca mano izquierda
  const h = L[0].h[0]; await touch('touchStart', [[h.x, h.y, 3]]); await page.waitForTimeout(60); await touch('touchEnd', []); await page.waitForTimeout(150);
  const c = await page.evaluate(() => Game.G.mages[0].stats.casts);
  // J2 desliza de una mano a la otra = fusión
  await page.waitForTimeout(800);
  const a = L[1].h[0], b = L[1].h[1]; await touch('touchStart', [[a.x, a.y, 4]]); await touch('touchMove', [[(a.x + b.x) / 2, a.y, 4]]); await touch('touchMove', [[b.x, b.y, 4]]); await page.waitForTimeout(120); await touch('touchEnd', []); await page.waitForTimeout(150);
  const f = await page.evaluate(() => Game.G.mages[1].stats.fusions);
  const d = L[0].dz; await touch('touchStart', [[d.x, d.y, 5]]); await page.waitForTimeout(40); await touch('touchEnd', []); await page.waitForTimeout(50);
  const ds = await page.evaluate(() => Game.G.mages[0].dash.cd > 0);
  await page.screenshot({ path: path.join(__dirname, 'shots', 'touch-cel.png') });
  console.log(JSON.stringify({ p0, p1, c, f, ds }), 'ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
