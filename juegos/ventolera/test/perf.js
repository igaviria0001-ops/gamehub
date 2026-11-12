// Costo de dibujo por cuadro (ms de JavaScript) en Medellín y Cocora, PC Full HD y celular
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const [name, vp, o] of [['fhd', { width: 1920, height: 1080 }, {}], ['cel', { width: 693, height: 272 }, { deviceScaleFactor: 2.625, isMobile: true, hasTouch: true }]]) {
    for (const arena of ['medellin', 'cocora']) {
      const ctx = await browser.newContext(Object.assign({ viewport: vp }, o));
      const page = await ctx.newPage();
      await page.goto('file://' + path.resolve(__dirname, 'index.html'));
      await page.waitForTimeout(600);
      const r = await page.evaluate(async arena => {
        const { Game, Bot } = VTO; Game.setArena(arena); Game.start('duel', 1); VTO.UI.show(null, false);
        const G = Game.G; G.bots[0] = new Bot(G.birds[0], 4, 2); Game.advance(6);
        const T = {}; const wrap = (obj, k, tag) => { const f = obj[k]; obj[k] = function (...a) { const t0 = performance.now(); const v = f.apply(this, a); T[tag] = (T[tag] || 0) + performance.now() - t0; return v; }; };
        wrap(ArtWorld, 'drawBackground', 'fondo'); wrap(ArtWorld, 'drawStage', 'escenario'); wrap(ArtPilot, 'draw', 'pilotos'); wrap(FX, 'draw', 'efectos'); wrap(FX, 'drawCombat', 'combate');
        let frames = 0; const t0 = performance.now();
        await new Promise(res => { const f = () => { frames++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
        const out = {}; for (const k in T) out[k] = +(T[k] / frames).toFixed(2); out.cuadros = frames; return out;
      }, arena);
      console.log(name, arena, JSON.stringify(r));
      await ctx.close();
    }
  }
  await browser.close();
})();
