// la misma escena en alta, media y ligera (celular)
const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }); const page = await ctx.newPage();
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(600);
  for (const q of ['alta', 'media', 'ligera']) { await page.evaluate(q => { Game.setQuality(q, false); Math.random = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })(); Game.start('duel', 2, { arena: process === undefined ? 'rio' : 'rio' }); }, q).catch(() => 0);
    await page.evaluate(q => { Game.setQuality(q, false); Game.start('duel', 2, { arena: 'rio' }); UI.show(null, false); Game.G.introT = 0; Game.G.countT = 0; Game.G.mages.forEach(m => m.ctrl = new Bot(2)); Game.advance(4); }, q);
    await page.waitForTimeout(700); await page.screenshot({ path: path.join(__dirname, 'shots', `q-${q}.png`) }); }
  await b.close(); })();
