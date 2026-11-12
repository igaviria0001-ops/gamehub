// celular con CPU 4x más lenta: cuadros por segundo en un duelo (referencia) y en niveles del Mundo 2
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const q of ['alta', 'ligera']) for (const lv of [-1, 10, 15]) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }); const page = await ctx.newPage();
    await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(500);
    const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const r = await page.evaluate(async ([lv, q]) => { Game.setQuality(q); if (lv < 0) Game.start('duel', 2, { arena: 'paramo' }); else Game.start('camp', 0, { level: lv, chars: ['zuhe', 'tota'] }); UI.show(null, false); const G = Game.G; for (const m of G.mages) m.maxHp = m.hp = 9999; if (lv < 0) G.mages.forEach((m, i) => m.ctrl = new Bot(i)); Game.advance(4);
      let frames = 0; const t0 = performance.now(); await new Promise(res => { const f = () => { frames++; performance.now() - t0 < 4000 ? requestAnimationFrame(f) : res(); }; requestAnimationFrame(f); }); return Math.round(frames / 4); }, [lv, q]);
    console.log(q.padEnd(7), lv < 0 ? 'duelo páramo' : 'nivel ' + (lv + 1), r, 'fps'); await ctx.close();
  }
  await browser.close();
})();
