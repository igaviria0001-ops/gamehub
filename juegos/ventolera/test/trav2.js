// Travesía para dos: selector, etapas en contra (estrellas al que gana) y juntos (Blancos con meta, jefe), resultados y siguiente etapa
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
    console.log(name, 'botón:', (await page.textContent('[data-act="trav"]')).trim());
    await page.evaluate(() => document.querySelector('#s-title [data-act="trav"]').click()); await page.waitForTimeout(200);
    await page.evaluate(() => document.querySelector('#s-trav [data-tduo] [data-v="1"]').click()); await page.waitForTimeout(200);
    const over = await page.evaluate(() => { const el = document.querySelector('#s-trav .panel'), h = document.querySelector('#s-trav .phead'); return { sale: el.getBoundingClientRect().bottom > innerHeight + 1 || el.scrollHeight > el.clientHeight + 2, cabecera: Math.round(h.getBoundingClientRect().height), detalle: document.querySelector('#t-detail').textContent }; });
    console.log(name, 'lista para dos:', JSON.stringify(over));
    await page.screenshot({ path: path.join(__dirname, 'shots', `trav2-${name}-lista.png`) });
    if (name === 'pc') {
      // juega las etapas 1 (duelo), 2 (Blancos juntos) y 9 (jefe juntos) con máquinas en los puestos de las personas
      for (const st of [0, 1, 8, 9]) {
        if (st === 8) { await page.evaluate(() => { const D = JSON.parse(localStorage.getItem('vto_trav2') || '{}'); ['med1', 'med2', 'bog1', 'bog2', 'car1', 'car2'].forEach(id => D[id] = { s: 1, w: 0 }); localStorage.setItem('vto_trav2', JSON.stringify(D)); }); await page.reload(); await page.waitForTimeout(700); }
        const info = await page.evaluate(async st => {
          const { Game, Bot, UI } = VTO; UI.show('trav', false);
          document.querySelector(`#t-grid [data-stage="${st}"]`).click();
          const G = Game.G; const info = { etapa: st + 1, modo: G.mode, jugadores: G.players, duo: G.duo, coop: G.coop };
          G.bots = [new Bot(G.birds[0], 3, 2), new Bot(G.birds[1], 9, st === 9 ? 2 : 1)];
          let t = 0; while (G.state !== 'matchEnd' && t < 400) { Game.advance(0.5); t += 0.5; }
          info.t = t; info.marcador = G.score.join('-') + ' / ' + G.wins.join('-');
          return info;
        }, st);
        await page.waitForTimeout(1500);
        const res = await page.evaluate(() => ({ titulo: document.querySelector('#r-title').textContent, marcador: document.querySelector('#r-score').textContent, estrellas: document.querySelector('#r-stars').textContent, botones: [...document.querySelectorAll('#s-results .menu button')].filter(b => b.offsetParent).map(b => b.textContent).join(' | ') }));
        console.log(name, JSON.stringify(info), JSON.stringify(res));
        await page.screenshot({ path: path.join(__dirname, 'shots', `trav2-res-${st + 1}.png`) });
      }
      await page.evaluate(() => document.querySelector('#r-trav').click()); await page.waitForTimeout(200);
      console.log(name, 'cuenta:', await page.evaluate(() => document.querySelector('#t-total').textContent));
      await page.screenshot({ path: path.join(__dirname, 'shots', 'trav2-pc-despues.png') });
    }
    console.log(name, 'ERR', errors.join(' | ') || 'ninguno');
    await ctx.close();
  }
  await browser.close();
})();
