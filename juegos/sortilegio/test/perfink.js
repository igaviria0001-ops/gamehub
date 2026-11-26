// cuadros por segundo en el celular (CPU 4× más lenta, pantalla 844×390 ×3): un duelo de siempre contra uno del Mundo 3 en tinta
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const q of (process.env.Q || 'alta,media,ligera').split(',')) for (const arena of (process.env.A || 'paramo,miyajima').split(',')) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }); const page = await ctx.newPage();
    await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(500);
    const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: +(process.env.CPU || 4) });
    const r = await page.evaluate(async ([arena, q]) => { Game.setQuality(q, true); Game.start('duel', 0, { arena, chars: ['candela', 'yuma'], level: 2 }); UI.show(null, false); Game.advance(3);
      await new Promise(res => setTimeout(res, 800));
      let frames = 0; const t0 = performance.now(); await new Promise(res => { const f = () => { frames++; performance.now() - t0 < 4000 ? requestAnimationFrame(f) : res(); }; requestAnimationFrame(f); });
      return Math.round(frames / ((performance.now() - t0) / 1000)); }, [arena, q]);
    console.log(q.padEnd(7), arena.padEnd(9), r, 'fps'); await ctx.close();
  }
  await browser.close();
})();
