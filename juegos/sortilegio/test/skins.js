// atuendos: se desbloquean y se ven en el menú y en el juego
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
  const lockedTxt = await page.evaluate(() => { document.querySelector('[data-act="play2"]').click(); return document.querySelector('.card .lock') ? document.querySelector('.card .lock').textContent : ''; });
  await page.evaluate(() => { CHAR_ORDER.forEach(c => Progress.data.wins[c] = 9); UI.show('title', false); document.querySelector('[data-act="play2"]').click(); });
  await page.keyboard.press('KeyW'); await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowUp'); await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(__dirname, 'shots', 'skins-setup.png') });
  const sk = await page.evaluate(() => Game.cfg.skins);
  await page.click('.goRow [data-act="go"]'); await page.waitForTimeout(300);
  const g = await page.evaluate(() => Game.G.mages.map(m => m.skin));
  console.log('bloqueado:', lockedTxt, '| cfg', sk, '| juego', g, 'ERR', errors.join(' | ') || 'ninguno'); await browser.close();
})();
