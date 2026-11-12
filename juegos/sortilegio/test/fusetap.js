// mapa de lo que hace cada toque alrededor del rombo de fusión (F = fusión, I/D = una mano, . = nada)
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const [name, vp, dsf] of [['cel', { width: 844, height: 390 }, 2], ['app', { width: 587, height: 262 }, 2.6]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dsf, isMobile: true, hasTouch: true }); const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
    await page.evaluate(() => { Game.start('duel', 2, {}); UI.show(null, false); Game.G.introT = 0; });
    await page.waitForTimeout(300);
    const L = await page.evaluate(() => Touch.layout()); const cdp = await ctx.newCDPSession(page); const R = L[0].R, f = L[0].fz;
    const rows = []; let fuseCenter = 0, fuseN = 0;
    for (let dy = -0.9; dy <= 0.9001; dy += 0.3) { let row = ''; for (let dx = -2.4; dx <= 2.4001; dx += 0.3) {
      const x = f.x + dx * R, y = f.y + dy * R;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 7 }] });
      const t = await page.evaluate(() => Input.touch[0]); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      const ch = t.h0 && t.h1 ? 'F' : t.h0 ? 'I' : t.h1 ? 'D' : t.dash ? 'e' : '.'; row += ch;
      if (Math.abs(dx) <= 0.61 && Math.abs(dy) <= 0.61) { fuseN++; if (ch === 'F') fuseCenter++; }
    } rows.push(row); }
    // dos pulgares casi al tiempo sobre las dos manos
    const a = L[0].h[0], b = L[0].h[1];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.x, y: a.y, id: 1 }] }); await page.waitForTimeout(40);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.x, y: a.y, id: 1 }, { x: b.x, y: b.y, id: 2 }] });
    const two = await page.evaluate(() => Input.touch[0]); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    console.log(name, 'R=' + R.toFixed(0), `rombo ±0,6R: ${fuseCenter}/${fuseN} fusión`, 'dos pulgares:', two.h0 && two.h1 ? 'fusión' : 'NO', 'ERR', errors.join('|') || 'ninguno');
    console.log(rows.join('\n'));
    await ctx.close();
  }
  await browser.close();
})();
