// Controles táctiles: se ven y mueven al jugador
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, hasTouch: true, isMobile: false });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html') + '?touch=1');
  await page.waitForTimeout(1000);
  await page.click('[data-act="playbot"]'); await page.waitForTimeout(300);
  await page.click('[data-act="mode-caneca"]'); await page.waitForTimeout(300);
  await page.click('[data-act="arena-random"]'); await page.waitForTimeout(3600);
  const x0 = await page.evaluate(() => TYA.Game.G.players[0].x);
  const b = await page.$('.tcl.move.left .k-right');
  const box = await b.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down(); await page.waitForTimeout(150); console.log('state', await page.evaluate(() => JSON.stringify(Touch.state[0]))); await page.waitForTimeout(550); 
  await page.screenshot({ path: 'shots/touch-single.png' });
  await page.mouse.up();
  const x1 = await page.evaluate(() => TYA.Game.G.players[0].x);
  console.log('moved', Math.round(x1 - x0));
  await page.evaluate(() => { TYA.UI.show(null, false); TYA.Game.startMatch('caneca', false, 'pupitre'); Touch.show('dual'); });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'shots/touch-dual.png' });
  console.log('ERR', errors.join('\n'));
  await browser.close();
})();
