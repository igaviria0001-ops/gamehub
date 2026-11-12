// Máquina contra máquina en Medellín: ¿se estrellan?, ¿se quedan arriba sin sustentación?, ¿pelean?
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('ERR', e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(600);
  const arena = process.argv[2] || 'medellin';
  const r = await page.evaluate(arena => {
    const { Game, Bot } = VTO, out = [];
    for (const [s0, s1, L] of [['guacamaya', 'condor', 2], ['colibri', 'tucan', 1], ['condor', 'colibri', 2]]) {
      Game.cfg.species = [s0, s1]; Game.setArena(arena); Game.start('duel', 1); const G = Game.G;
      G.bots = [new Bot(G.birds[0], 3, L), new Bot(G.birds[1], 8, L)];
      const st = { stall: 0, crash: {}, high: 0, low: 0, n: 0, tricks: {}, rounds: 0, kills: 0 };
      const fe = VTO.FX.event; VTO.FX.__orig = VTO.FX.__orig || fe;
      VTO.FX.event = (e, G2) => { if (e.type === 'stall') st.stall++; if (e.type === 'crash') st.crash[e.kind] = (st.crash[e.kind] || 0) + 1; if (e.type === 'trick') st.tricks[e.name] = (st.tricks[e.name] || 0) + 1; return VTO.FX.__orig(e, G2); };
      for (let t = 0; t < 120 && G.state !== 'matchEnd'; t += 1 / 120) {
        Game.advance(1 / 120);
        for (const e of G.events) { if (e.type === 'stall') st.stall++; if (e.type === 'crash') st.crash[e.kind] = (st.crash[e.kind] || 0) + 1; }
        for (const b of G.birds) if (b.alive && G.state === 'play') { st.n++; if (b.y < 450) st.high++; if (b.y > G.world.groundY(b.x) - 250) { st.low++; const m = G.bots[b.id].mode + (b.perch ? '-posado' : ''); st.lowMode = st.lowMode || {}; st.lowMode[m] = (st.lowMode[m] || 0) + 1; } }
        if (G.state === 'matchEnd' || G.state === 'results') break;
      }
      G.birds.forEach(b => { st.kills += b.stats.kills || 0; });
      out.push(`${s0} vs ${s1} (nivel ${L}): ${G.wins[0]}-${G.wins[1]} · choques ${JSON.stringify(st.crash)} · pérdidas ${st.stall} · arriba ${Math.round(100 * st.high / st.n)}% · abajo ${Math.round(100 * st.low / st.n)}% · maniobras ${G.birds.map(b => b.stats.tricks || 0).join('/')} · trucos ${JSON.stringify(st.tricks)} · bajo-modo ${JSON.stringify(st.lowMode || {})} · vidrios ${G.world.buildings ? G.world.buildings.reduce((a, B) => a + B.broken.size, 0) : '-'} · misiles ${JSON.stringify(G.mlog || {})}`);
    }
    return out;
  }, arena);
  console.log(r.join('\n'));
  await browser.close();
})();
