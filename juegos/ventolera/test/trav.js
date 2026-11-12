// Travesía: título, lista de etapas (pc y celular), una etapa jugada por la máquina y sus estrellas
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const vps = { pc: [{ width: 1280, height: 720 }, {}], cel: [{ width: 693, height: 272 }, { deviceScaleFactor: 2.625, isMobile: true, hasTouch: true }] };
  for (const name of ['pc', 'cel']) {
    const ctx = await browser.newContext(Object.assign({ viewport: vps[name][0] }, vps[name][1]));
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, 'index.html'));
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(__dirname, 'shots', `trav-${name}-title.png`) });
    await page.evaluate(() => document.querySelector('[data-act="trav"]').click());
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(__dirname, 'shots', `trav-${name}-lista.png`) });
    const over = await page.evaluate(() => { const el = document.querySelector('#s-trav .panel'); return el.getBoundingClientRect().bottom > innerHeight + 1 || el.scrollHeight > el.clientHeight + 2; });
    if (name === 'pc') {
      // etapa 1 jugada por una máquina fuerte en el puesto de la persona
      await page.evaluate(() => document.querySelector('[data-stage="0"]').click());
      await page.waitForTimeout(300);
      const r = await page.evaluate(async () => {
        const { Game, Bot } = VTO, G = Game.G; const info = { arena: G.arena, modo: G.mode, ganar: G.winsNeeded, nivel: G.bots[1].level };
        G.bots[0] = new Bot(G.birds[0], 3, 2);
        let t = 0; while (G.state !== 'matchEnd' && t < 400) { Game.advance(0.5); t += 0.5; }
        return Object.assign(info, { t, estado: G.state, wins: G.wins.join('-') });
      });
      await page.waitForTimeout(1500);
      const res = await page.evaluate(() => ({ estrellas: document.querySelector('#r-stars').textContent, siguiente: !document.querySelector('#r-next').hidden, guardado: JSON.stringify(VTO.Travesia.best('cocora1')), abierta2: VTO.Travesia.unlocked(1) }));
      console.log(name, JSON.stringify(r), JSON.stringify(res));
      await page.screenshot({ path: path.join(__dirname, 'shots', `trav-${name}-resultado.png`) });
      await page.evaluate(() => document.querySelector('#r-next').click());
      await page.waitForTimeout(300);
      console.log(name, 'siguiente etapa →', await page.evaluate(() => VTO.Game.G.trav + ' ' + VTO.Game.G.mode + ' ' + VTO.Game.G.arena));
    }
    console.log(name, 'lista se sale:', over, 'ERR', errors.join(' | ') || 'ninguno');
    await ctx.close();
  }
  await browser.close();
})();
