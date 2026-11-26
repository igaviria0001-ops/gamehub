// los atuendos del Mundo 3 puestos en dos magos, en un mapa claro y uno oscuro (en movimiento)
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
  const pairs = [['kitsune', 'raijin', 'fushimi'], ['sumi', 'estaciones', 'arashiyama'], ['yokozuna', 'sumi', 'huesos'], ['estaciones', 'kitsune', 'templo']];
  for (const [a, b, arena] of pairs) {
    await page.evaluate(([a, b, arena]) => {
      Game.start('free', 2, { chars: ['fuji', 'yoshino'], arena, skins: ['u.' + a, 'u.' + b] }); UI.show(null, false); const G = Game.G;
      for (let i = 0; i < 12; i++) Game.advance(0.25);
      G.mages[0].x = G.T.W / 2 - 110; G.mages[1].x = G.T.W / 2 + 110; G.mages.forEach(m => { m.y = G.T.H / 2; m.vx = m.ctrl ? 0 : 0; });
      window.__mv = true; const t0 = performance.now();
      (function mv() { if (!window.__mv) return; const s = (performance.now() - t0) / 1000; G.mages[0].x = G.T.W / 2 - 110 + Math.sin(s * 2) * 60; G.mages[1].y = G.T.H / 2 + Math.cos(s * 2) * 50; requestAnimationFrame(mv); })();
    }, [a, b, arena]);
    await page.waitForTimeout(1500);
    const cam = await page.evaluate(() => { const G = Game.G; return [G.mages[0].x, G.mages[0].y]; });
    await page.screenshot({ path: path.join(__dirname, 'shots', `outfit3-${a}-${b}.png`) });
    await page.evaluate(() => { window.__mv = false; });
  }
  console.log('ERR', errors.slice(0, 4).join(' | ') || 'ninguno'); await browser.close();
})();
