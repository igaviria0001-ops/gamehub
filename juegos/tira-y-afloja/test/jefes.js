// Jefes: dos bots contra cada jefe (¿ganan?, ¿cuánto tarda?), capturas y pantalla de elección
// Uso: node jefes.js sim [nivel] [segundos]  |  node jefes.js shots
const { chromium } = require('playwright');
const path = require('path');
const what = process.argv[2] || 'sim';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1200);
  if (what === 'shots') {
    await page.click('#s-title [data-act="play2"]'); await page.waitForTimeout(300);
    await page.screenshot({ path: 'shots/j-modes.png' });
    await page.click('[data-act="mode-jefe"]'); await page.waitForTimeout(400);
    await page.screenshot({ path: 'shots/j-select.png' });
    for (const [id, t] of [['aspiradora', 9], ['sacapuntas', 7], ['aseador', 6]]) {
      await page.evaluate(([id, t]) => {
        TYA.UI.show(null, false); const G = TYA.Game.G; G.jefeId = id; TYA.Game.startMatch('jefe', false, null);
        G.bots = [new Bot(0, 2), new Bot(1, 2)];
        let g = 0; while (G.roundT < t && G.state !== 'matchEnd' && g++ < 60 * 60) TYA.Game.update(1 / 60);
      }, [id, t]);
      await page.waitForTimeout(150);
      await page.screenshot({ path: `shots/j-${id}.png` });
      // un momento vulnerable
      await page.evaluate(() => { const G = TYA.Game.G; let g = 0; while (!['hot', 'stuck', 'wait'].includes(Jefes.state.state) && g++ < 60 * 20) TYA.Game.update(1 / 60); for (let k = 0; k < 20; k++) TYA.Game.update(1 / 60); });
      await page.waitForTimeout(150);
      await page.screenshot({ path: `shots/j-${id}-2.png` });
    }
  } else if (what === 'flow') {
    // contra la máquina: el compañero es un bot; ganar a la fuerza y pasar al siguiente
    await page.click('#s-title [data-act="playbot"]'); await page.waitForTimeout(250);
    await page.click('[data-act="mode-jefe"]'); await page.waitForTimeout(300);
    await page.click('#jefes .mode:nth-child(1)'); await page.waitForTimeout(300);
    const a = await page.evaluate(() => { const G = TYA.Game.G; let g = 0; while (G.state !== 'play' && g++ < 400) TYA.Game.update(1 / 60); for (let k = 0; k < 300; k++) TYA.Game.update(1 / 60); const J = Jefes.state; J.hp = 0; J.over = 'win'; J.overT = 0; for (let k = 0; k < 60 * 6 && G.state !== 'matchEnd'; k++) TYA.Game.update(1 / 60); for (let k = 0; k < 60 * 4; k++) TYA.Game.update(1 / 60); return { state: G.state, bot: !!G.bots[1], mode: G.mode, ui: TYA.UI.current, res: JSON.stringify(Jefes.result), ach: Progress.has(Progress.names[0], 'desenchufada') }; });
    console.log(JSON.stringify(a));
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'shots/j-result.png' });
    await page.click('#btn-next'); await page.waitForTimeout(300);
    const b = await page.evaluate(() => ({ id: TYA.Game.G.jefeId, arena: TYA.Game.G.arenaId, variant: ARENA.variant, mode: TYA.Game.G.mode, solids: ARENA.solids.filter(R => R.kind === 'sharpener').length + '/' + ARENA.solids.filter(R => R.kind === 'roomba').length }));
    console.log(JSON.stringify(b));
    const c = await page.evaluate(() => { const G = TYA.Game.G; let g = 0; while (G.state !== 'play' && g++ < 400) TYA.Game.update(1 / 60); const J = Jefes.state; J.hearts = 1; J.lossBy = {}; const p = G.players[0]; p.x = 120; p.y = 900; for (let k = 0; k < 60 * 8 && G.state !== 'matchEnd'; k++) TYA.Game.update(1 / 60); for (let k = 0; k < 60 * 4; k++) TYA.Game.update(1 / 60); return { state: G.state, ui: TYA.UI.current, res: JSON.stringify(Jefes.result) }; });
    console.log(JSON.stringify(c));
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'shots/j-lose.png' });
    // volver a una partida normal: no deben quedar restos del jefe
    const d = await page.evaluate(() => { TYA.UI.show(null, false); TYA.Game.startMatch('caneca', false, 'arte'); const G = TYA.Game.G; return { sharp: ARENA.solids.some(R => R.kind === 'sharpener'), variant: ARENA.variant, cut: ARENA.mods.cut, calm: !!(ARENA.L && ARENA.L.calm) }; });
    console.log(JSON.stringify(d));
  } else {
    const lvl = +(process.argv[3] || 2), secs = +(process.argv[4] || 180), reps = +(process.argv[5] || 3);
    const ONLY = process.env.ONLY || null;
    const out = await page.evaluate(([lvl, secs, reps, process_only]) => {
      const G = TYA.Game.G, res = [];
      for (const d of Jefes.LIST.filter(d => !process_only || process_only.includes(d.id))) {
        for (let r = 0; r < reps; r++) {
          G.jefeId = d.id; TYA.Game.startMatch('jefe', false, null);
          G.bots = [new Bot(0, lvl), new Bot(1, lvl)];
          const ev = { swallow: 0, dunk: 0 };
          let g = 0, hpLog = [];
          while (G.state !== 'matchEnd' && g++ < 60 * secs) {
            TYA.Game.update(1 / 60);
            if (g % 600 === 0) hpLog.push(Jefes.state ? Jefes.state.hp + '/' + Jefes.state.hearts : '-');
          }
          const J = Jefes.state, R = Jefes.result;
          res.push({ id: d.id, end: G.state, win: R ? R.win : null, t: J ? +J.t.toFixed(1) : null, hp: J && J.hp, hearts: J && J.hearts, hits: J && J.hits, loss: J && JSON.stringify(J.lossBy), log: hpLog.join(' ') });
        }
      }
      return res;
    }, [lvl, secs, reps, ONLY ? ONLY.split(",") : null]);
    for (const r of out) console.log(JSON.stringify(r));
  }
  console.log('ERR', errors.slice(0, 6).join('\n'));
  await browser.close();
})();
