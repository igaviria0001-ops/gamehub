const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const [name, vp, o] of [['pc', { width: 1280, height: 720 }, {}], ['cel', { width: 844, height: 390 }, { deviceScaleFactor: 2, isMobile: true, hasTouch: true }], ['cel2', { width: 693, height: 320 }, { deviceScaleFactor: 2.6, isMobile: true, hasTouch: true }], ['app', { width: 587, height: 262 }, { deviceScaleFactor: 2.6, isMobile: true, hasTouch: true }]].filter(v => !process.env.V || process.env.V.split(',').includes(v[0]))) {
    const ctx = await browser.newContext(Object.assign({ viewport: vp }, o)); const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(900);
    const out = [];
    for (const s of (process.env.S || 'title,setup,howto,options,pause,results').split(',')) {
      await page.evaluate(s => { if (s === 'results') Game.onMatchEnd && UI.show('title', false), Game.start('duel', 2, {}), Game.G.state = 'matchEnd', (window.__r = Game.results()), document.querySelector('#s-results') && (UI.show(null, false)); if (s === 'results') { const r = Game.results(); r.wins = [3, 1]; r.winner = 0; r.stats[0].dmg = 512; } if (s === 'setup') document.querySelector('[data-act="play2"]').click(); else if (s !== 'results') UI.show(s, false); }, s);
      if (s === 'results') await page.evaluate(() => { const r = Game.results(); r.wins = [3, 1]; r.winner = 0; Game.G.state = 'matchEnd'; if (typeof Game.onMatchEnd === 'function') Game.onMatchEnd(r); }), await page.waitForTimeout(500);
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(__dirname, 'shots', `${s}-${name}.png`) });
      const over = await page.evaluate(s => { const el = document.querySelector('#s-' + s + ' .panel') || document.querySelector('#s-' + s); return el.scrollHeight > el.clientHeight + 2 || el.getBoundingClientRect().bottom > innerHeight + 1; }, s);
      out.push(s + (over ? ' SE SALE' : ' cabe'));
    }
    console.log(name, out.join(' · '), 'ERR', errors.join(' | ') || 'ninguno');
    await ctx.close();
  }
  await browser.close();
})();
