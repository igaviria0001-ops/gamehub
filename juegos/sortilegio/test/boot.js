// arranque: título, un duelo entre máquinas, capturas en PC y celular
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const vps = { pc: [{ width: 1280, height: 720 }, {}], cel: [{ width: 844, height: 390 }, { deviceScaleFactor: 2, isMobile: true, hasTouch: true }] };
  for (const name of (process.env.ONLY || 'pc,cel').split(',')) {
    const ctx = await browser.newContext(Object.assign({ viewport: vps[name][0] }, vps[name][1]));
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1])); page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    await page.goto('file://' + path.resolve(__dirname, 'index.html'));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(__dirname, 'shots', `title-${name}.png`) });
    const r = await page.evaluate(async (secs) => {
      Game.start('duel', 0, { chars: ['candela', 'yuma'], arena: 'paramo', wins: 3, level: 2 });
      UI.show(null, false);
      const G = Game.G; let t = 0, info = [];
      while (t < secs && G.state !== 'matchEnd') { Game.advance(0.5); t += 0.5; if (t % 10 === 0) info.push([t, G.state, G.round, G.wins.join('-'), G.mages.map(m => Math.round(m.hp)).join('/'), G.spells.length]); }
      return { t, state: G.state, wins: G.wins, info, stats: G.mages.map(m => m.stats) };
    }, +(process.env.SECS || 40));
    console.log(name, JSON.stringify(r.info), r.state, r.wins, JSON.stringify(r.stats));
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(__dirname, 'shots', `play-${name}.png`) });
    console.log(name, 'ERR', errors.slice(0, 5).join(' | ') || 'ninguno');
    await ctx.close();
  }
  await browser.close();
})();
