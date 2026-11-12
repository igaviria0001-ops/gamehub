// Carrera: aros bien puestos (ni dentro de nada ni pegados al suelo) y dos máquinas que la terminan en cada escenario
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(600);
  for (const arena of (process.env.ARENAS || 'cocora,medellin,bogota,cartagena').split(',')) {
    const r = await page.evaluate((arena) => {
      const { Game, Bot, World, Modes } = VTO; Game.setArena(arena); Game.setMode('race');
      const t0 = performance.now(); Game.start('race', 1); const setupMs = Math.round(performance.now() - t0); VTO.UI.show(null, false);
      const G = Game.G, W = G.world, fails = G.racePaths.map((p, i) => p.length < 2 && Math.hypot(p[0].x - G.gates[(i - 1 + G.gates.length) % G.gates.length].x, p[0].y - G.gates[(i - 1 + G.gates.length) % G.gates.length].y) > 300 ? i + 1 : 0).filter(Boolean);
      const bad = G.gates.filter(g => World.solidAt(W, g.x, g.y, g.r * 0.7) || g.y > W.groundY(g.x) - g.r - 40 || g.y < W.ceil + 60).map(g => g.i + 1);
      const L = Number(new URLSearchParams(location.search).get('L') || 1);
      G.bots = [new Bot(G.birds[0], 3, 1), new Bot(G.birds[1], 9, 1)];
      let t = 0, stuckGate = {}, last = [0, 0], since = [0, 0], deaths = 0;
      const orig = G.events.push.bind(G.events); G.events.push = (...a) => { for (const e of a) if (e.type === 'down') deaths++; return orig(...a); };
      while (t < 320 && G.state !== 'matchEnd') {
        Game.advance(0.5); t += 0.5;
        for (let i = 0; i < 2; i++) { if (G.score[i] !== last[i]) { last[i] = G.score[i]; since[i] = 0; } else since[i] += 0.5; if (since[i] > 15) { const k = Math.floor(G.score[i]) % G.gates.length + 1; stuckGate[k] = (stuckGate[k] || 0) + 1; since[i] = 0; } }
      }
      return { arena, setupMs, sinRuta: fails, aros: G.gates.length, malos: bad, t, estado: G.state, aros_pasados: G.score.join('-'), atascado_en: stuckGate, derribos: deaths };
    }, arena);
    console.log(JSON.stringify(r));
  }
  // foto de la carrera en Medellín
  await page.evaluate(() => { const { Game } = VTO; Game.setArena('medellin'); Game.start('race', 2); VTO.UI.show(null, false); Game.advance(3.2); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(__dirname, 'shots', 'race-start.png') });
  console.log('ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
