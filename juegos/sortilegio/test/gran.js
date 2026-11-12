// Embrujo lleno: aura dorada, barra, y el momento del Gran Sortilegio
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
  await page.evaluate(() => { Game.start('duel', 2, { chars: ['candela', 'catatumbo'], arena: 'paramo' }); UI.show(null, false); Game.G.introT = 0; Game.advance(3); const G = Game.G; G.mages[0].gainEmb(G, 100); G.mages[0].x = 600; G.mages[1].x = 900; });
  await page.waitForTimeout(600); await page.screenshot({ path: path.join(__dirname, 'shots', 'gran-ready.png') });
  await page.keyboard.down('KeyF'); await page.keyboard.down('KeyG'); await page.waitForTimeout(150); await page.keyboard.up('KeyF'); await page.keyboard.up('KeyG');
  await page.waitForTimeout(450); await page.screenshot({ path: path.join(__dirname, 'shots', 'gran-cast.png') });
  const st = await page.evaluate(() => [Game.G.mages[0].stats.gran, Math.round(Game.G.mages[0].emb)]);
  console.log('gran', st, 'ERR', errors.join(' | ') || 'ninguno'); await browser.close();
})();
