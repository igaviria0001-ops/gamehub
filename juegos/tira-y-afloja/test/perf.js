// Mide cuánto tarda un cuadro (física + dibujo) en cada arena
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1200);
  for (const q of ['alta', 'ligera']) {
    const out = await page.evaluate(q => {
      Store.set('quality', q); window.dispatchEvent(new Event('resize'));
      const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
      const res = {};
      for (const id of ['pupitre', 'biblioteca', 'profe', 'torre']) {
        TYA.UI.show(null, false);
        TYA.Game.startMatch(id === 'torre' ? 'escalada' : 'caneca', false, id);
        const G = TYA.Game.G; G.bots = [new Bot(0, 1), new Bot(1, 1)];
        for (let i = 0; i < 300; i++) TYA.Game.update(1 / 60);
        const t0 = performance.now();
        for (let i = 0; i < 120; i++) { TYA.Game.update(1 / 60); TYA.Game.render(ctx, cv.width, cv.height, 1); }
        res[id] = +((performance.now() - t0) / 120).toFixed(2);
      }
      res.canvas = cv.width + 'x' + cv.height;
      return res;
    }, q);
    console.log(q, JSON.stringify(out));
  }
  await browser.close();
})();
