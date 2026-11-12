// Opciones: sabores, ambiente y música; capturas de noche y tarde
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1000);
  await page.click('[data-act="options"]'); await page.waitForTimeout(300);
  await page.click('#o-f1'); await page.click('#o-f1');
  await page.click('#o-f2'); await page.click('#o-f2');
  await page.click('[data-opt="theme"] [data-v="noche"]');
  await page.click('#o-style');
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'shots/o-options.png' });
  console.log(await page.evaluate(() => JSON.stringify([TYA.Game.G.flavors, TYA.Game.G.theme, TYA.Game.G.musicStyle])));
  await page.evaluate(() => { TYA.UI.show(null, false); TYA.Game.startMatch('caneca', false, 'pupitre'); const G = TYA.Game.G; G.bots = [new Bot(0, 1), new Bot(1, 1)]; G.hintsT = 0; });
  await page.waitForTimeout(5200);
  await page.screenshot({ path: 'shots/o-night.png' });
  await page.evaluate(() => { TYA.Game.setTheme('tarde'); TYA.Game.setFlavor(0, 'mango'); TYA.Game.setFlavor(1, 'mora'); TYA.Game.setArena('biblioteca'); TYA.Game.resetRound(); });
  await page.waitForTimeout(4800);
  await page.screenshot({ path: 'shots/o-tarde.png' });
  console.log('ERR', errors.join('\n'));
  await browser.close();
})();
