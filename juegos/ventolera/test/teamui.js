// Travesía en equipo: lista, HUD de cada desafío (pc y celular), resultados y paso a la siguiente etapa
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const [name, vp, opts] of [['pc', { width: 1280, height: 720 }, {}], ['cel', { width: 693, height: 272 }, { deviceScaleFactor: 2.625, isMobile: true, hasTouch: true }]]) {
    const ctx = await browser.newContext(Object.assign({ viewport: vp }, opts));
    const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(600);
    await page.evaluate(() => { const D = {}; ['cocora1', 'cocora2', 'med1', 'med2', 'bog1', 'bog2', 'car1', 'car2', 'car3'].forEach(id => D[id] = { s: 2, w: 2 }); localStorage.setItem('vto_trav2', JSON.stringify(D)); localStorage.setItem('vto_travDuo', 'true'); });
    await page.reload(); await page.waitForTimeout(600);
    await page.evaluate(() => document.querySelector('#s-title [data-act="trav"]').click()); await page.waitForTimeout(200);
    console.log(name, JSON.stringify(await page.evaluate(() => { const el = document.querySelector('#s-trav .panel'); return { sale: el.getBoundingClientRect().bottom > innerHeight + 1 || el.scrollHeight > el.clientHeight + 2, total: document.querySelector('#t-total').textContent, tarjetas: [...document.querySelectorAll('#t-grid .stage b')].map(b => b.textContent.replace(/^\d+\. /, '')).join(' | ') }; })));
    await page.screenshot({ path: path.join(__dirname, 'shots', `teamui-${name}-lista.png`) });
    for (const st of [1, 2, 4, 9]) {
      await page.evaluate(st => { VTO.UI.show('trav', false); document.querySelector(`#t-grid [data-stage="${st}"]`).click(); }, st);
      await page.waitForTimeout(200);
      await page.evaluate(st => { const { Game, Bot } = VTO, G = Game.G; G.bots = [new Bot(G.birds[0], 3, 1), new Bot(G.birds[1], 9, 1)]; Game.advance(st === 9 ? 30 : 18); }, st);
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(__dirname, 'shots', `teamui-${name}-${st + 1}.png`) });
    }
    if (name === 'pc') {
      // relevos hasta el final y luego «Siguiente etapa»
      await page.evaluate(() => { VTO.UI.show('trav', false); document.querySelector('#t-grid [data-stage="1"]').click(); });
      await page.evaluate(() => { const { Game, Bot } = VTO, G = Game.G; G.bots = [new Bot(G.birds[0], 3, 1), new Bot(G.birds[1], 9, 1)]; let t = 0; while (G.state !== 'matchEnd' && t < 300) { Game.advance(0.5); t += 0.5; } });
      await page.waitForTimeout(1500);
      console.log(name, 'resultado:', JSON.stringify(await page.evaluate(() => ({ titulo: document.querySelector('#r-title').textContent, marcador: document.querySelector('#r-score').textContent, estrellas: document.querySelector('#r-stars').textContent, botones: [...document.querySelectorAll('#s-results .menu button')].filter(b => b.offsetParent).map(b => b.textContent).join(' | ') }))));
      await page.screenshot({ path: path.join(__dirname, 'shots', 'teamui-pc-resultado.png') });
      await page.evaluate(() => document.querySelector('#r-next').click()); await page.waitForTimeout(200);
      console.log(name, 'siguiente →', await page.evaluate(() => VTO.Game.G.mode + ' ' + VTO.Game.G.arena + ' duo=' + VTO.Game.G.duo));
    }
    console.log(name, 'ERR', errors.join(' | ') || 'ninguno');
    await ctx.close();
  }
  await browser.close();
})();
