// los magos de cerca: de frente, de lado, de espaldas, cargando
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(800);
  const pairs = (process.env.PAIRS || 'candela,yuma;frailejon,purace;iguaque,catatumbo').split(';');
  for (let i = 0; i < pairs.length; i++) {
    await page.evaluate(([chars, mode]) => {
      Game.start('free', 2, { chars: chars.split(','), arena: 'paramo' }); UI.show(null, false); Game.advance(2.8);
      const G = Game.G, [a, b] = G.mages; a.x = 700; a.y = 470; b.x = 820; b.y = 470;
      a.face = Math.PI / 2; b.face = mode === 'side' ? 0 : mode === 'back' ? -Math.PI / 2 : Math.PI / 2;
      if (mode === 'charge') { a.hands[0].hold = 0.7; b.fuse = true; b.hands[0].hold = 0.3; b.hands[1].hold = 0.3; }
      if (mode === 'walk') { a.vx = 200; a.moving = 200; b.vx = -200; b.moving = 200; }
      Game.cam.x = 760; Game.cam.y = 430; Game.cam.z = 3.2; G.paused = true;
    }, [pairs[i], process.env.MODE || 'front']);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(__dirname, 'shots', `gal-${i}-${process.env.MODE || 'front'}.png`) });
  }
  console.log('ERR', errors.join(' | ') || 'ninguno'); await browser.close();
})();
