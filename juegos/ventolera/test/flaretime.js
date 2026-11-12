// cuándo salen las bengalas en partidas de máquinas: distancia del misil y tiempo que le faltaba para llegar
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
  const r = await page.evaluate(() => {
    const { Game, Bot } = VTO; const out = { d: [], tti: [], decoyed: 0, hits: 0, hitsWithFlare: 0 };
    for (const arena of ['cocora', 'medellin', 'bogota', 'cartagena']) {
      Game.setArena(arena); Game.setMode('duel'); Game.start('duel', 2); VTO.UI.show(null, false); const G = Game.G; G.bots = [new Bot(G.birds[0], 4, 2), new Bot(G.birds[1], 9, 2)];
      let t = 0; const seen = new Set();
      while (t < 200 && G.state !== 'matchEnd') {
        const before = G.birds.map(b => b.flares);
        Game.advance(1 / 60); t += 1 / 60;
        G.birds.forEach((b, i) => { if (b.flares < before[i]) { let best = null; for (const m of G.missiles) if (m.target && m.target.flare && m.target.owner === b.id && !seen.has(m)) { seen.add(m); const d = Math.hypot(m.x - b.x, m.y - b.y); out.d.push(Math.round(d)); out.tti.push(+(d / Math.max(1, m.s)).toFixed(2)); (out.age = out.age || []).push(+m.age.toFixed(2)); (out.d0 = out.d0 || []).push(Math.round(m.d0 || 0)); } } });
        for (const e of G.events || []) { if (e.type === 'decoyed' && !e._c) { e._c = 1; out.decoyed++; const b = G.birds[e.owner]; if (b) (out.dd = out.dd || []).push(Math.round(Math.hypot(b.x - e.x, b.y - e.y))); } }
      }
    }
    const G = Game.G; const avg = a => a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) : '-';
    return { engañados: out.decoyed, distExplosionAlPiloto: avg(out.dd || []), impactos: JSON.stringify(G.mlog), salidas: out.d.length, distPromedio: avg(out.d), tiempoAntesDeLlegar: avg(out.tti), dist: out.d.slice(0, 14).join(','), tti: out.tti.slice(0, 14).join(','), edad: (out.age||[]).slice(0, 14).join(','), dLanz: (out.d0||[]).slice(0,14).join(',') };
  });
  console.log(JSON.stringify(r), 'ERR', errors.join('|') || 'ninguno'); await browser.close();
})();
