const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 })).newPage();
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(600);
  const q = process.env.Q || 'ligera';
  await page.evaluate(a => { window.__AR = a; }, process.env.AR || 'capadocia');
  for (const off of (process.env.OFFS || 'none,bg,stage,both,haze').split(',')) {
    const r = await page.evaluate(async ([q, off]) => {
      const { Game, Bot } = VTO; Game.setQuality(q); Game.setArena(window.__AR || 'capadocia'); Game.start('duel', 2); VTO.UI.show(null, false);
      window.__o = window.__o || { bg: ArtCapa.drawBackground, stage: ArtCapa.drawStage, haze: ArtCapa.drawHaze };
      ArtCapa.drawBackground = (off === 'bg' || off === 'both') ? (c, G, cam, sw, sh) => { c.fillStyle = '#866'; c.fillRect(0, 0, sw, sh); } : window.__o.bg;
      ArtCapa.drawStage = (off === 'stage' || off === 'both') ? () => {} : window.__o.stage;
      ArtCapa.drawHaze = off === 'haze' ? () => {} : window.__o.haze;
      const G = Game.G; G.bots = [new Bot(G.birds[0], 3, 1), new Bot(G.birds[1], 7, 1)];
      let n = 0; await new Promise(res => requestAnimationFrame(res)); const t0 = performance.now();
      await new Promise(res => { const step = () => { n++; if (n < 50) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); });
      return +((performance.now() - t0) / n).toFixed(1);
    }, [q, off]);
    console.log(q, 'off=' + off, r, 'ms');
  }
  await browser.close();
})();
