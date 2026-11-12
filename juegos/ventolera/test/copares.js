// Resultados de la Copa (en medio y al final) en el celular más chico: ¿cabe todo sin desplazar?
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 693, height: 272 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(600);
  for (const [tag, done] of [['medio', 2], ['final', 5]]) {
    const over = await page.evaluate(done => {
      const { Game, UI, Copa } = VTO; Copa.create(2); const C = Copa.state;
      for (let k = 0; k < done - 1; k++) { C.hist.push({ mode: C.list[k].mode, arena: C.list[k].arena, winner: k % 2 }); C.pts[k % 2]++; C.i++; }
      Game.start(C.list[C.i].mode, 2, { arena: C.list[C.i].arena, wins: 1, copa: { i: C.i, n: 5 } }); Game.G.state = 'matchEnd';
      UI.results({ winner: 0, wins: [1, 0], names: ['J1', 'J2'], vsBot: false, mode: C.list[C.i].mode, score: [12, 7], stats: [{ kills: 1, dmg: 300, shots: 50, hits: 20, missileHits: 1, missiles: 3, dodged: 1, crates: 0 }, { kills: 0, dmg: 100, shots: 40, hits: 10, missileHits: 0, missiles: 2, dodged: 0, crates: 1 }] });
      const el = document.querySelector('#s-results .panel'); return { sale: el.getBoundingClientRect().bottom > innerHeight + 1 || el.scrollHeight > el.clientHeight + 2, alto: Math.round(el.getBoundingClientRect().height), botones: [...document.querySelectorAll('#s-results .menu button')].filter(b => b.offsetParent).map(b => b.textContent).join(' | ') };
    }, done);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(__dirname, 'shots', `copares-${tag}.png`) });
    console.log(tag, JSON.stringify(over));
  }
  console.log('ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
