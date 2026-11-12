// Depurar atascos de la máquina en la Carrera: dónde está y qué está haciendo
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(500);
  const sp = (process.env.SP || 'tucan,guacamaya').split(','), who = +(process.env.WHO || 1), gate = +(process.env.GATE || 4);
  const r = await page.evaluate(([sp, who, gate]) => {
    const { Game, Bot } = VTO; Game.cfg.species = sp; Game.setArena('cartagena'); Game.start('race', 2); VTO.UI.show(null, false);
    const G = Game.G; G.bots = [new Bot(G.birds[0], 3, 1), new Bot(G.birds[1], 9, 1)];
    let t = 0, since = 0, last = 0; const log = [];
    while (t < 200 && G.state !== 'matchEnd') {
      Game.advance(0.25); t += 0.25;
      if (G.score[who] !== last) { last = G.score[who]; since = 0; } else since += 0.25;
      const b = G.birds[who], k = Math.floor(G.score[who]) % G.gates.length;
      if (k === gate && since > 4 && log.length < 40) { const bt = G.bots[who]; log.push(`t${t} (${Math.round(b.x)},${Math.round(b.y)}) v=${Math.round(b.s)} modo=${bt.mode} rp=${bt.rp ? bt.rp.i + '/' + G.racePaths[k].length : '-'} st=${b.stun.toFixed(2)} lift=${b.lift.toFixed(2)}`); }
    }
    return { path: G.racePaths[gate].map(p => `${Math.round(p.x)},${Math.round(p.y)}`).join(' '), log };
  }, [sp, who, gate]);
  console.log('ruta:', r.path); r.log.forEach(l => console.log(l));
  await page.screenshot({ path: path.join(__dirname, 'shots', 'racedbg.png') });
  await browser.close();
})();
