// calidad automática: con un celular lento baja sola de alta a media (y a ligera si sigue lento); si se eligió a mano no toca nada
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const manual of [false, true]) {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }); const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(600);
    const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.evaluate(m => { Game.setQuality('alta', m); if (!m) Store.set('qManual', false); Game.start('duel', 2, {}); UI.show(null, false); Game.G.mages.forEach((x, i) => x.ctrl = new Bot(2)); Game.G.introT = 0; Game.G.countT = 0.05; }, manual);
    const log = []; for (let k = 0; k < (manual ? 8 : 14); k++) { await page.waitForTimeout(5000); log.push(await page.evaluate(() => Game.quality)); }
    console.log(manual ? 'elegida a mano:' : 'automática:   ', log.join(' '), 'ERR', errors.join('|') || 'ninguno'); await ctx.close();
  }
  await browser.close();
})();
