// Escuela de magia: se pasa lección por lección con acciones reales
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
  await page.click('[data-act="school"]'); await page.waitForTimeout(3000);
  const steps = [];
  const k = () => page.evaluate(() => Game.G.school.k);
  steps.push(await k());
  await page.evaluate(() => { const m = Game.G.mages[0]; m.x = 700; m.y = 440; m.face = 0; }); await page.keyboard.press('KeyF'); await page.waitForTimeout(700); steps.push(await k());
  await page.keyboard.down('KeyG'); await page.waitForTimeout(800); await page.keyboard.up('KeyG'); await page.waitForTimeout(400); steps.push(await k());
  await page.waitForTimeout(2200); await page.keyboard.down('KeyF'); await page.keyboard.down('KeyG'); await page.waitForTimeout(120); await page.keyboard.up('KeyF'); await page.keyboard.up('KeyG'); await page.waitForTimeout(500); steps.push(await k());
  await page.evaluate(() => { const m = Game.G.mages[0]; m.x = 380; m.y = 200; }); await page.waitForTimeout(4200); await page.keyboard.down('KeyF'); await page.waitForTimeout(600); await page.keyboard.up('KeyF'); await page.waitForTimeout(300); steps.push(await k());
  await page.screenshot({ path: path.join(__dirname, 'shots', 'school.png') });
  console.log(JSON.stringify(steps), 'ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
