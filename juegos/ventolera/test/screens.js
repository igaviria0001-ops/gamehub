const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const [name, vp, o] of [['pc', { width: 1280, height: 720 }, {}], ['cel', { width: 693, height: 272 }, { deviceScaleFactor: 2.625, isMobile: true, hasTouch: true }]]) {
    const ctx = await browser.newContext(Object.assign({ viewport: vp }, o));
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, 'index.html'));
    await page.waitForTimeout(900);
    for (const s of ['title', 'birds', 'howto', 'options', 'keys', 'logros', 'pause', 'results']) {
      await page.evaluate(s => { if (s === 'results') VTO.UI.results({ winner: 0, wins: [3, 1], names: ['J1 · Guacamaya', 'J2 · Cóndor'], vsBot: false, stats: [{ kills: 3, dmg: 512, shots: 140, hits: 63, missileHits: 4, missiles: 6, dodged: 3, crates: 2 }, { kills: 1, dmg: 301, shots: 120, hits: 41, missileHits: 2, missiles: 5, dodged: 1, crates: 1 }] }); else VTO.UI.show(s, false); }, s); await page.waitForTimeout(500);
      if (s === 'birds') { await page.evaluate(() => { document.querySelector('[data-act="next1"]').click(); document.querySelector('[data-act="next1"]').click(); document.querySelector('[data-act="next0"]').click(); }); await page.waitForTimeout(400); }
      await page.screenshot({ path: path.join(__dirname, 'shots', `${s}-${name}.png`) });
      const over = await page.evaluate(s => { const el = document.querySelector('#s-' + s + ' .panel'); return el.scrollHeight > el.clientHeight + 2 || el.getBoundingClientRect().bottom > innerHeight + 1; }, s);
      console.log(name, s, over ? 'SE SALE' : 'cabe');
    }
    console.log(name, 'ERR', errors.join(' | ') || 'ninguno');
    await ctx.close();
  }
  await browser.close();
})();
