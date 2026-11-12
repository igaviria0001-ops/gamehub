const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 })).newPage();
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(600);
  for (const q of ['alta', 'ligera']) {
    const r = await page.evaluate(async (q) => {
      const { Game, Bot } = VTO; Game.setQuality(q); Game.setArena('capadocia'); Game.start('duel', 2); VTO.UI.show(null, false);
      const G = Game.G; G.bots = [new Bot(G.birds[0], 3, 1), new Bot(G.birds[1], 7, 1)];
      const acc = {}; const wrap = (obj, k, name) => { const f = obj[k]; obj[k] = function (...a) { const t = performance.now(); const r = f.apply(this, a); acc[name] = (acc[name] || 0) + performance.now() - t; return r; }; };
      wrap(ArtCapa, 'drawBackground', 'bg'); wrap(ArtCapa, 'drawStage', 'stage'); wrap(ArtCapa, 'drawHaze', 'haze'); wrap(Post, 'apply', 'post');
      wrap(ArtWorld, 'drawSky', 'sky'); wrap(ArtWorld, 'drawClouds', 'clouds');
      let n = 0; const t0 = performance.now();
      await new Promise(res => { const step = () => { n++; if (n < 40) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); });
      const tot = performance.now() - t0; const o = { frames: n, msPerFrame: +(tot / n).toFixed(1) }; for (const k in acc) o[k] = +(acc[k] / n).toFixed(1); return o;
    }, q);
    console.log(q, JSON.stringify(r));
  }
  await browser.close();
})();
