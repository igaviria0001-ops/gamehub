// Máquina contra máquina: varios duelos simulados (rondas, daño, puntería, misiles, cajas, errores)
const { chromium } = require('playwright');
const path = require('path');
const LV = (process.env.LV || '1,1').split(',').map(Number);
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(600);
  const r = await page.evaluate(LV => {
    const { Game, Bot } = VTO, out = [];
    const pairs = [['guacamaya', 'condor'], ['colibri', 'tucan'], ['condor', 'colibri'], ['tucan', 'guacamaya'], ['guacamaya', 'guacamaya']];
    for (const [a, b] of pairs) {
      Game.cfg.species = [a, b]; Game.cfg.looks = [0, 1];
      Game.start('duel', 2); const G = Game.G; G.paused = true;
      G.bots = [new Bot(G.birds[0], 3, LV[0]), new Bot(G.birds[1], 9, LV[1])];
      const keep = G.bots.slice();
      let t = 0, nan = 0, rt = [], last = 0, prev = G.state, ways = {};
      while (t < 900 && G.state !== 'matchEnd') {
        if (G.state === 'countdown') G.bots = keep.slice();
        Game.advance(1 / 120); t += 1 / 120;
        if (prev === 'play' && G.state === 'roundEnd') { rt.push(Math.round(t - last)); const d = G.birds.find(x => !x.alive); }
        if (prev !== 'countdown' && G.state === 'countdown') last = t;
        prev = G.state;
        for (const bd of G.birds) if (!isFinite(bd.x + bd.y + bd.s)) nan++;
      }
      const s = G.birds.map(x => x.stats);
      out.push(`${a} vs ${b}: ${G.wins.join('-')} · rondas de ${rt.join(', ')} s · ` + s.map((x, i) => `J${i + 1}: balas ${x.hits}/${x.shots} misiles ${x.missileHits}/${x.missiles} esquivó ${x.dodged} cajas ${x.crates} choques ${x.crashes} maniobras ${x.tricks} leyenda ${x.legends}`).join(' | ') + (nan ? ` NaN ${nan}` : '') + ' misiles: ' + JSON.stringify(G.mlog || {}));
    }
    return out;
  }, LV);
  console.log(r.join('\n'));
  console.log('ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
