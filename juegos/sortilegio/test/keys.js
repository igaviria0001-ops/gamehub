// teclado real: J1 y J2 se mueven, cargan, funden y esquivan
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(800);
  await page.click('[data-act="play2"]'); await page.waitForTimeout(200);
  await page.keyboard.press('KeyD'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(100);
  const picked = await page.evaluate(() => Game.cfg.chars.join(','));
  await page.click('.goRow [data-act="go"]'); await page.waitForTimeout(5800);
  const p0 = await page.evaluate(() => Game.G.mages.map(m => [Math.round(m.x), Math.round(m.y)]));
  await page.keyboard.down('KeyD'); await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(500); await page.keyboard.up('KeyD'); await page.keyboard.up('ArrowLeft');
  const p1 = await page.evaluate(() => Game.G.mages.map(m => [Math.round(m.x), Math.round(m.y)]));
  await page.keyboard.press('KeyF'); await page.waitForTimeout(120);
  const c1 = await page.evaluate(() => Game.G.mages[0].stats.casts);
  await page.keyboard.down('KeyG'); await page.waitForTimeout(750); await page.keyboard.up('KeyG'); await page.waitForTimeout(100);
  const c2 = await page.evaluate(() => [Game.G.mages[0].stats.casts, Game.G.mages[0].hands[1].cd > 1]);
  await page.waitForTimeout(2200);
  await page.keyboard.down('KeyK'); await page.waitForTimeout(60); await page.keyboard.down('KeyL'); await page.waitForTimeout(150); await page.keyboard.up('KeyK'); await page.keyboard.up('KeyL'); await page.waitForTimeout(100);
  const f = await page.evaluate(() => Game.G.mages[1].stats.fusions);
  await page.keyboard.press('Semicolon'); await page.waitForTimeout(50);
  const d = await page.evaluate(() => Game.G.mages[1].dash.cd > 0);
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  const pz = await page.evaluate(() => [Game.G.paused, UI.current]);
  await page.screenshot({ path: path.join(__dirname, 'shots', 'keys-pause.png') });
  console.log(JSON.stringify({ picked, p0, p1, c1, c2, f, d, pz }), 'ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
