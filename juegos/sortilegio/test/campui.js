// pantalla de campaña con el Mundo 2 abierto (PC y celular)
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const [name, vp, o] of [['pc', { width: 1280, height: 720 }, {}], ['cel', { width: 844, height: 390 }, { deviceScaleFactor: 2, isMobile: true, hasTouch: true }]]) {
    const ctx = await browser.newContext(Object.assign({ viewport: vp }, o)); const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(800);
    for (const w of [1, 2]) {
      await page.evaluate(w => { const D = {}; Camp.LEVELS.slice(0, 10).forEach(L => D[L.id] = 2); if (w === 2) { D.c11 = 3; D.c12 = 1; } localStorage.setItem('srt_camp', JSON.stringify(D)); UI.show('camp'); const b = document.querySelector(`#c-world button[data-v="${w}"]`); if (b) b.click(); }, w);
      await page.waitForTimeout(500); await page.screenshot({ path: path.join(__dirname, 'shots', `campui-${name}-${w}.png`) });
    }
    console.log(name, 'ERR', errors.join(' | ') || 'ninguno'); await ctx.close();
  }
  await browser.close();
})();
