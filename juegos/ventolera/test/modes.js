// Modos: máquina contra máquina en Blancos y Maletín (puntos, robo, final con resultados); capturas
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(700);
  for (const arena of (process.env.ARENAS || 'medellin,cocora').split(',')) for (const mode of ['targets', 'case']) {
    const r = await page.evaluate(([arena, mode]) => {
      const { Game, Bot, FX } = VTO; const ev = {};
      Game.setArena(arena); Game.setMode(mode); Game.start(mode, 1); VTO.UI.show(null, false);
      const G = Game.G; G.bots[0] = new Bot(G.birds[0], 4, 2); G.bots[1].level = 2;
      const fe = FX.event; FX.event = (e, G2) => { if (['points', 'caseTake', 'caseSteal', 'caseDrop', 'modeEnd', 'down'].includes(e.type)) ev[e.type] = (ev[e.type] || 0) + 1; return fe(e, G2); };
      let t = 0, mid = null;
      while (t < 170 && G.state !== 'matchEnd') { Game.advance(1 / 60); t += 1 / 60; if (!mid && t > 30) mid = G.score.map(Math.floor).join('-'); }
      FX.event = fe;
      return { arena, mode, a30s: mid, final: G.score.map(Math.floor).join('-'), estado: G.state, t: Math.round(t), ev, modos: G.bots.map(bt => bt.mode) };
    }, [arena, mode]);
    console.log(JSON.stringify(r));
  }
  // capturas en juego
  for (const mode of ['targets', 'case']) {
    await page.evaluate(mode => { const { Game, Bot } = VTO; Game.setArena('medellin'); Game.setMode(mode); Game.start(mode, 1); VTO.UI.show(null, false); const G = Game.G; G.bots[0] = new Bot(G.birds[0], 4, 2); G.hintT = 0; Game.advance(12); }, mode);
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(__dirname, 'shots', `mode-${mode}.png`) });
  }
  console.log('ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
