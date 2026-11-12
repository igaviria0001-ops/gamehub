// Cartagena: dos máquinas pelean; cuenta cañonazos, impactos, chapuzones y se fija que nadie se quede atascado
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(700);
  const r = await page.evaluate(() => {
    const { Game, Bot } = VTO; Game.setArena('cartagena'); Game.setMode('duel');
    const out = [];
    for (let seed = 1; seed <= 4; seed++) {
      Game.start('duel', 2); VTO.UI.show(null, false);
      const G = Game.G; G.bots = [new Bot(G.birds[0], seed * 3, 1), new Bot(G.birds[1], seed * 7, 1)];
      const ev = {}; let t = 0, stuck = 0, lastX = [0, 0], still = [0, 0], perches = 0;
      const orig = G.events.push.bind(G.events);
      G.events.push = (...a) => { for (const e of a) ev[e.type] = (ev[e.type] || 0) + 1; return orig(...a); };
      while (t < 120 && G.state !== 'matchEnd') {
        Game.advance(0.5); t += 0.5;
        G.birds.forEach((b, i) => { if (b.alive && !b.perch && Math.hypot(b.x - lastX[i][0], b.y - lastX[i][1]) < 30) still[i] += 0.5; else still[i] = 0; if (still[i] > 4) stuck++; lastX[i] = [b.x, b.y]; });
      }
      out.push({ seed, t, state: G.state, wins: G.wins.join('-'), stuck, cannon: ev.cannon || 0, hit: ev.cannonHit || 0, splash: ev.splash || 0, boom: ev.boom || 0, ballDown: ev.ballDown || 0, fw: ev.fw || 0, land: ev.land || 0, down: ev.down || 0 });
    }
    return out;
  });
  r.forEach(x => console.log(JSON.stringify(x)));
  // fotos: a ras del agua con el galeón, aviso de cañón y pólvora
  await page.evaluate(() => {
    const { Game, Bot } = VTO; Game.start('free', 2); VTO.UI.show(null, false);
    const G = Game.G; G.hintT = 0; G.bots = [null, null]; G.cratesOn = false;
    G.birds[0].reset(430, 1880, 1); G.birds[1].reset(880, 1500, -1);
    G.world.coast.shotT = 0.1; G.world.coast.fwT = 0;
    Game.advance(0.9); G.birds[0].reset(430, 1880, 1); G.birds[1].reset(880, 1500, -1); Game.updateCamera(0, true);
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(__dirname, 'shots', 'carta-agua.png') });
  await page.evaluate(() => { const { Game } = VTO, G = Game.G; Game.advance(0.6); G.birds[0].reset(430, 1880, 1); G.birds[1].reset(880, 1500, -1); Game.updateCamera(0, true); });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(__dirname, 'shots', 'carta-disparo.png') });
  await page.evaluate(() => { const { Game } = VTO, G = Game.G; G.birds[0].reset(2000, 700, 1); G.birds[1].reset(2600, 800, -1); G.world.coast.fw.length = 0; G.world.coast.fwT = 0; Game.advance(1.4); G.birds[0].reset(2000, 700, 1); G.birds[1].reset(2600, 800, -1); Game.updateCamera(0, true); });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(__dirname, 'shots', 'carta-polvora.png') });
  console.log('ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
