// Jefe en pareja: dos máquinas contra «La Sombra» (¿la tumban?, ¿cuánto tardan?), capturas
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(700);
  for (const arena of (process.env.ARENAS || 'medellin,cocora').split(',')) for (const L of [1, 2]) {
    const r = await page.evaluate(([arena, L]) => {
      const { Game, Bot, FX } = VTO; const ev = {};
      Game.setArena(arena); Game.setMode('boss'); Game.G.botLevel = L; Game.start('boss', 1); VTO.UI.show(null, false);
      const G = Game.G; G.bots[0] = new Bot(G.birds[0], 4, L); G.bots[1].level = L;
      const fe = FX.event; FX.event = (e, G2) => { if (['partDown', 'shieldDown', 'bossDown', 'down', 'bossDrone', 'hurt'].includes(e.type)) ev[e.type] = (ev[e.type] || 0) + 1; return fe(e, G2); };
      let t = 0, phases = [], last = 0;
      while (t < 300 && G.state !== 'matchEnd') { Game.advance(1 / 60); t += 1 / 60; if (G.boss && G.boss.phase !== last) { last = G.boss.phase; phases.push(last + '@' + Math.round(t)); } }
      FX.event = fe;
      return { arena, nivel: L, t: Math.round(t), estado: G.state, ganaron: G.coopWin, vidaJefe: +VTO.Boss.hpFrac(G).toFixed(2), partes: G.boss.parts.filter(p => p.alive).map(p => p.id).join(','), daño: G.boss.dmg.map(Math.round), fases: phases.join(' '), ev };
    }, [arena, L]);
    console.log(JSON.stringify(r));
  }
  await page.evaluate(() => { const { Game, Bot } = VTO; Game.setArena('medellin'); Game.start('boss', 1); VTO.UI.show(null, false); const G = Game.G; G.bots[0] = new Bot(G.birds[0], 4, 2); G.hintT = 0; Game.advance(14); });
  await page.waitForTimeout(300); await page.screenshot({ path: path.join(__dirname, 'shots', 'boss-1.png') });
  await page.evaluate(() => { const { Game, Boss } = VTO, G = Game.G; for (const p of G.boss.parts) if (p.kind !== 'core' && p.kind !== 'engine') { Boss.hurt(G, p, 9999, 0); } Game.advance(3); });
  await page.waitForTimeout(300); await page.screenshot({ path: path.join(__dirname, 'shots', 'boss-2.png') });
  console.log('ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
