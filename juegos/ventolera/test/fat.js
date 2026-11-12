// Dedazos: toques con desviación aleatoria alrededor de cada botón; ¿cuántos van al botón correcto?
// (y cuántos van a un control del OTRO jugador o a la palanca en vez de un botón)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const [vw, vh, dpr] of [[693, 272, 2.625], [844, 390, 3], [780, 360, 3]]) for (const mode of ['play2', 'play1']) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: dpr, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto('file://' + path.resolve(__dirname, 'index.html'));
    await page.waitForTimeout(700);
    await page.tap(`[data-act="${mode}"]`); await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const T = VTO.Touch, out = {};
      let seed = 5; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
      const targets = [];
      document.querySelectorAll('#touch .tgrp').forEach(g => { const p = g.classList.contains('p1') ? 2 : 1;
        if (g.classList.contains('tstick')) { const q = g.querySelector('.tpad').getBoundingClientRect(); targets.push([`J${p}:palanca`, q.left + q.width / 2, q.top + q.height / 2]); }
        g.querySelectorAll('.tbtn').forEach(b => { const q = b.getBoundingClientRect(); targets.push([`J${p}:${b.dataset.k}`, q.left + q.width / 2, q.top + q.height / 2]); }); });
      for (const sig of [10, 16]) {
        let ok = 0, n = 0, otro = 0, palanca = 0, nada = 0;
        for (const [want, cx, cy] of targets) for (let i = 0; i < 400; i++) {
          const x = cx + gauss() * sig, y = cy + gauss() * sig, got = T.probe(x, y); n++;
          if (got === want) ok++; else if (!got) nada++; else if (got.slice(0, 2) !== want.slice(0, 2)) otro++; else if (got.endsWith('palanca') !== want.endsWith('palanca')) palanca++;
        }
        out['σ' + sig] = `${(100 * ok / n).toFixed(1)} % bien · otro jugador ${otro} · palanca↔botón ${palanca} · nada ${nada}`;
      }
      return out;
    });
    console.log(`${vw}×${vh} ${mode === 'play2' ? 'dos' : 'uno'}:`, JSON.stringify(r));
    await ctx.close();
  }
  await browser.close();
})();
