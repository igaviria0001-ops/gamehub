// caos: dos «jugadores» que aprietan todo al azar en cada modo y escenario (y la campaña); busca errores, NaN y unidades fuera del mapa
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 900, height: 500 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
  const r = await page.evaluate(() => {
    const out = []; let seed = 7; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const rnd = () => ({ mx: R() * 2 - 1, my: R() * 2 - 1, h: [R() < 0.35, R() < 0.35], dash: R() < 0.05 });
    const runs = []; for (const mode of ['duel', 'tejo', 'hunt', 'altar']) for (const arena of ARENA_ORDER) runs.push({ mode, arena });
    for (let lv = 0; lv < Camp.LEVELS.length; lv++) runs.push({ mode: 'camp', lv });
    for (const run of runs) {
      const chars = [CHAR_ORDER[(runs.indexOf(run) * 3) % CHAR_ORDER.length], CHAR_ORDER[(runs.indexOf(run) * 5 + 1) % CHAR_ORDER.length]];
      if (run.mode === 'camp') Game.start('camp', 2, { level: run.lv, chars }); else Game.start(run.mode, 2, { arena: run.arena, chars });
      UI.show(null, false); const G = Game.G; G.paused = true; G.introT = 0;
      const inputs = [rnd(), rnd()]; const orig = Input.read; Input.read = i => inputs[i];
      let bad = null; for (let k = 0; k < 240; k++) { if (k % 6 === 0) { inputs[0] = rnd(); inputs[1] = rnd(); } if (k % 40 === 0 && G.mages[0]) G.mages[0].gainEmb(G, 60); Game.advance(0.25); for (const u of G.units) if (u.alive && (!isFinite(u.x) || !isFinite(u.y) || u.x < -50 || u.y < -50 || u.x > G.T.W + 50 || u.y > G.T.H + 50)) bad = (u.isMage ? 'mago ' : (u.kind || u.obj || 'unidad ')) + Math.round(u.x) + ',' + Math.round(u.y); if (G.state === 'matchEnd') break; if (G.state === 'roundEnd' && run.mode === 'camp') break; }
      Input.read = orig; out.push((run.mode === 'camp' ? 'c' + (run.lv + 1) : run.mode + '/' + run.arena) + (bad ? ' MAL:' + bad : ''));
    }
    return out;
  });
  console.log(r.filter(x => x.includes('MAL')).join('\n') || ('todo bien en ' + r.length + ' partidas'), '\nERR', errors.slice(0, 6).join(' | ') || 'ninguno'); await browser.close();
})();
