// Copa: 5 pruebas seguidas jugadas por máquinas en los puestos de las personas; marcador, siguiente prueba y campeón
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const [name, vp, opts] of [['pc', { width: 1280, height: 720 }, {}], ['cel', { width: 693, height: 272 }, { deviceScaleFactor: 2.625, isMobile: true, hasTouch: true }]]) {
    const ctx = await browser.newContext(Object.assign({ viewport: vp }, opts));
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, 'index.html'));
    await page.waitForTimeout(700);
    await page.evaluate(() => { VTO.Game.setMode('copa'); VTO.UI.show('title', false); });
    console.log(name, 'botón:', await page.textContent('[data-act="play2"]'));
    await page.evaluate(() => document.querySelector('[data-act="play2"]').click());
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(__dirname, 'shots', `copa-${name}-inicio.png`) });
    const plan = await page.evaluate(() => VTO.Copa.state.list.map(E => E.mode + '@' + E.arena).join(', '));
    console.log(name, 'plan:', plan);
    for (let k = 0; k < 7; k++) {
      const st = await page.evaluate(async () => {
        const { Game, Bot } = VTO, G = Game.G; if (!G.copa) return null;
        G.bots = [new Bot(G.birds[0], 3, 2), new Bot(G.birds[1], 9, 1)];
        let t = 0; while (G.state !== 'matchEnd' && t < 420) { Game.advance(0.5); t += 0.5; }
        return { prueba: G.copa.i + 1, modo: G.mode, arena: G.arena, t, estado: G.state };
      });
      if (!st) break;
      await page.waitForTimeout(1400);
      const res = await page.evaluate(() => ({ titulo: document.querySelector('#r-title').textContent, marcador: document.querySelector('#r-score').textContent, sigue: !document.querySelector('#r-copa').hidden, otra: !document.querySelector('#r-rematch').hidden && document.querySelector('#r-rematch').textContent }));
      console.log(name, JSON.stringify(st), JSON.stringify(res));
      if (!res.sigue) { await page.screenshot({ path: path.join(__dirname, 'shots', `copa-${name}-final.png`) }); break; }
      if (k === 1) await page.screenshot({ path: path.join(__dirname, 'shots', `copa-${name}-medio.png`) });
      await page.evaluate(() => document.querySelector('#r-copa').click()); await page.waitForTimeout(300);
    }
    console.log(name, 'logro copa:', await page.evaluate(() => VTO.Progress.has('copa')), 'ERR', errors.join(' | ') || 'ninguno');
    await ctx.close();
  }
  await browser.close();
})();
