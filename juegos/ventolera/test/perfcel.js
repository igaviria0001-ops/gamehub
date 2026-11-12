// Celular con CPU 4 veces más lenta: cuadros por segundo y ms de JavaScript por cuadro en cada escenario y modo
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const q of ['alta', 'ligera']) for (const [arena, mode] of (process.env.ARENAS ? process.env.ARENAS.split(',').map(a => [a, 'duel']) : [['medellin', 'duel'], ['bogota', 'duel'], ['cocora', 'duel'], ['medellin', 'boss']])) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    if (process.env.NOPOST) await page.addInitScript(() => { window.__NOPOST = 1; });
    await page.goto('file://' + path.resolve(__dirname, 'index.html'));
    await page.waitForTimeout(500);
    const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const r = await page.evaluate(async ([arena, mode, q]) => {
      const { Game, Bot } = VTO; if (window.__NOPOST) Post.apply = (c, G, cam, sw, sh, d) => c.setTransform(d, 0, 0, d, 0, 0); Game.setQuality(q); Game.setArena(arena); Game.setMode(mode); Game.start(mode, 2); VTO.UI.show(null, false);
      const G = Game.G; G.bots = [new Bot(G.birds[0], 4, 2), new Bot(G.birds[1], 9, 2)]; Game.advance(4);
      let frames = 0, js = 0; const t0 = performance.now(); let last = t0, worst = 0;
      await new Promise(res => { const f = () => { const now = performance.now(); worst = Math.max(worst, now - last); last = now; frames++; if (now - t0 < 4000) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
      return { fps: Math.round(frames / 4), peorCuadroMs: Math.round(worst), canvas: Game.screen.sw * Game.screen.dpr + '×' + Math.round(Game.screen.sh * Game.screen.dpr) };
    }, [arena, mode, q]);
    console.log(q.padEnd(7), (arena + ' ' + mode).padEnd(16), JSON.stringify(r));
    await ctx.close();
  }
  await browser.close();
})();
