const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const [name, vp, opts] of [['pc', { width: 1280, height: 720 }, {}], ['cel', { width: 693, height: 272 }, { deviceScaleFactor: 2.625, isMobile: true, hasTouch: true }]]) {
    const ctx = await browser.newContext(Object.assign({ viewport: vp }, opts));
    const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(600);
    const r = await page.evaluate(() => { const { Game, Bot, UI, STAGES } = VTO; Game.start('targets', 2, Object.assign({}, STAGES[1], { duo: true, coop: STAGES[1].team })); UI.show(null, false); const G = Game.G; G.bots = [new Bot(G.birds[0], 3, 1), new Bot(G.birds[1], 9, 1)]; Game.advance(40);
      // ¿hay fuego amigo o choques que duelan?
      const [a, b] = G.birds; const hp = b.hp; G.bullets.push({ x: b.x - 30, y: b.y, px: b.x - 40, py: b.y, vx: 1500, vy: 0, life: 1, owner: 0, dmg: 6, whiz: false }); Game.advance(0.05);
      return { coop: G.coop, meta: G.coopGoal.join('/'), puntos: G.score.map(Math.floor).join('+'), fuegoAmigo: Math.round(hp - b.hp) };
    });
    await page.waitForTimeout(200);
    console.log(name, JSON.stringify(r), 'ERR', errors.join(' | ') || 'ninguno');
    await page.screenshot({ path: path.join(__dirname, 'shots', `coophud-${name}.png`) });
    await ctx.close();
  }
  await browser.close();
})();
