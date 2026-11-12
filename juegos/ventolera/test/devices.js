// Varios aparatos (celulares chicos y grandes, tableta): título, partida con controles táctiles, pausa al girar
const { chromium } = require('playwright');
const path = require('path');
const DEV = [
  ['se', 667, 375, 2], ['iphone14', 844, 390, 3], ['android', 780, 360, 3], ['tableta', 1180, 820, 2],
];
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  for (const [name, w, h, d] of DEV) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: d, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(name + ': ' + e.message));
    await page.goto('file://' + path.resolve(__dirname, 'index.html'));
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(__dirname, 'shots', `dev-${name}-title.png`) });
    // ¿algo se sale de la pantalla en el título?
    const over = await page.evaluate(() => [...document.querySelectorAll('#s-title button, #s-title .card, #s-title h1')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.bottom > innerHeight + 1 || r.left < -1 || r.top < -1); }).map(e => e.textContent.trim().slice(0, 20)));
    await page.evaluate(() => { const { Game, UI } = VTO; Game.setArena('bogota'); Game.setMode('duel'); UI.show('title', false); document.querySelector('[data-act="play1"]').click(); });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(__dirname, 'shots', `dev-${name}-setup.png`) });
    await page.waitForTimeout(400);
    await page.evaluate(() => { const { Game } = VTO; Game.advance(5); });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(__dirname, 'shots', `dev-${name}-play.png`) });
    const st = await page.evaluate(() => ({ state: VTO.Game.G.state, touch: !!document.querySelector('#touch:not([hidden])'), ui: VTO.UI.current }));
    // girar a vertical: debe pausarse
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: h, height: w, deviceScaleFactor: d, mobile: true, screenOrientation: { type: 'portraitPrimary', angle: 0 } });
    await page.waitForTimeout(400);
    const rot = await page.evaluate(() => ({ paused: VTO.Game.G.paused, ui: VTO.UI.current, rotate: getComputedStyle(document.querySelector('#rotate')).display }));
    await page.screenshot({ path: path.join(__dirname, 'shots', `dev-${name}-vertical.png`) });
    console.log(name.padEnd(9), 'sale:', JSON.stringify(over), 'juego:', JSON.stringify(st), 'vertical:', JSON.stringify(rot));
    await ctx.close();
  }
  console.log('ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
