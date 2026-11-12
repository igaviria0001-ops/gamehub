// Tableros de cada formato a mitad de torneo, el campeón y el salón de la fama (PC y celular)
const { chromium } = require('playwright');
const path = require('path');
const URL = process.env.URL || 'http://127.0.0.1:8765/';
const OUT = path.join(__dirname, 'shots');
(async () => {
  const b = await chromium.launch({ args: ['--disable-gpu'] });
  for (const [tag, opt] of [['pc', { viewport: { width: 1366, height: 768 } }], ['cel', { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }]]) {
    const p = await (await b.newContext(opt)).newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await p.waitForTimeout(800);
    for (const [fmt, n, rules, steps] of [['liga', 5, { bestOf: 1, legs: 1, final: 3 }, 6], ['elim', 6, { bestOf: 1, finalBestOf: 3, third: true }, 4], ['rey', 4, { bestOf: 1, kingGoal: 5 }, 5], ['serie', 2, { bestOf: 5 }, 2]]) {
      await p.evaluate(([fmt, n, rules, steps]) => {
        const { Torneo, Tour, GAMES } = GAMEHUB; const names = ['Ana', 'Beto', 'Caro', 'Dani', 'Eli', 'Fer', 'Gabo', 'Hugo'], cols = ['#ff5d8f', '#6fc3ff', '#ffd36b', '#3dffa8', '#b07bff', '#ffb36b', '#45d6b0', '#ff7a3d'];
        const pool = {}; GAMES.forEach(g => { pool[g.id] = { on: true, modes: Object.fromEntries(g.modes.map(m => [m.id, true])), maps: Object.fromEntries(g.maps.map(m => [m[0], true])), arenas: null, len: 'normal', opts: {} }; });
        Tour.T = Torneo.create({ name: { liga: 'Liga de los viernes', elim: 'Copa eliminatoria', rey: 'Rey de la pista', serie: 'Gran Clásico' }[fmt], format: fmt, players: names.slice(0, n).map((x, i) => ({ name: x, color: cols[i] })), rules: Object.assign({ ptsW: 3, ptsD: 1, ptsL: 0, order: 'azar', noRepeat: true, noRepeatMap: true, chars: 'pick', swapSides: true }, rules), pool });
        for (let i = 0; i < steps; i++) { let ev = Torneo.curEvent(Tour.T); if (!ev) ev = Torneo.makeEvent(Tour.T, Torneo.nextMatch(Tour.T)); Torneo.record(Tour.T, ev.id, Math.random() < 0.1 ? 'draw' : Math.random() < 0.5 ? ev.j1 : ev.j2, { score: '3 – 1' }); }
        Tour.save(); GAMEHUB.go('torneo');
      }, [fmt, n, rules, steps]);
      await p.waitForTimeout(700);
      await p.screenshot({ path: path.join(OUT, `tab-${tag}-${fmt}.png`), fullPage: false });
    }
    // terminar la serie y ver al campeón
    await p.evaluate(() => { const { Torneo, Tour } = GAMEHUB; let k = 0; while (!Tour.T.done && k++ < 20) { let ev = Torneo.curEvent(Tour.T); if (!ev) ev = Torneo.makeEvent(Tour.T, Torneo.nextMatch(Tour.T)); Tour.result(ev.id, ev.j1); } GAMEHUB.go('torneo'); document.querySelector('[data-t="champ"]').click(); });
    await p.waitForTimeout(1200);
    await p.screenshot({ path: path.join(OUT, `tab-${tag}-campeon.png`) });
    await p.evaluate(() => { document.querySelector('[data-cx="fame"]').click(); }); await p.waitForTimeout(700);
    await p.screenshot({ path: path.join(OUT, `tab-${tag}-fama.png`) });
    // asistente: paso de juegos con uno abierto
    await p.evaluate(() => { GAMEHUB.Tour.T = null; localStorage.removeItem('gamehub_tour'); GAMEHUB.go('torneo'); });
    await p.waitForTimeout(400);
    for (let i = 0; i < 2; i++) { await p.click('[data-w="next"]'); await p.waitForTimeout(250); }
    await p.click('[data-gopen="sortilegio"].expand'); await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(OUT, `tab-${tag}-wiz3.png`) });
    await p.click('[data-w="next"]'); await p.waitForTimeout(300); await p.screenshot({ path: path.join(OUT, `tab-${tag}-wiz4.png`) });
    await p.click('[data-w="next"]'); await p.waitForTimeout(300); await p.screenshot({ path: path.join(OUT, `tab-${tag}-wiz5.png`) });
    console.log(tag, errs.join(' | ') || 'sin errores');
  }
  await b.close();
})();
