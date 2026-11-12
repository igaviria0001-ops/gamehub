const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => {
    const { Game, Bot } = VTO; Game.setArena('capadocia');
    for (let rep = 0; rep < 6; rep++) {
      Game.start('duel', 2); VTO.UI.show(null, false);
      const G = Game.G; G.bots = [new Bot(G.birds[0], 3 + rep, 1), new Bot(G.birds[1], 7 + rep, 1)];
      const last = [null, null]; G.bots.forEach((bot, i) => { const o = bot.think.bind(bot); bot.think = (dt, G) => (last[i] = o(dt, G)); });
      const still = [0, 0], prev = [[0, 0], [0, 0]];
      for (let t = 0; t < 120; t += 0.25) {
        Game.advance(0.25);
        for (let i = 0; i < 2; i++) {
          const b = G.birds[i];
          if (b.alive && !b.perch && Math.hypot(b.x - prev[i][0], b.y - prev[i][1]) < 15) still[i] += 0.25; else still[i] = 0; prev[i] = [b.x, b.y];
          if (still[i] > 3) {
            const log = [`rep${rep} t${t} bird${i}`]; const bot = G.bots[i];
            for (let k = 0; k < 8; k++) { Game.advance(1 / 60); log.push(`${b.x.toFixed(1)},${b.y.toFixed(1)} a${b.a.toFixed(2)} va${b.va.toFixed(2)} s${Math.round(b.s)} v${b.vx.toFixed(0)},${b.vy.toFixed(0)} fuel${b.fuel.toFixed(2)} boost${b.boosting} stun${b.stun.toFixed(2)} in ${JSON.stringify(last[i] && { dx: +last[i].dx.toFixed(2), dy: +last[i].dy.toFixed(2), b: last[i].boost })} brake${bot.brake} g${W0(G, b)}`); }
            return log;
          }
        }
      }
    }
    function W0(G, b) { const c = World.contact(G.world, b.x, b.y + 1, b.r + 1); return c ? c.kind + ' ' + c.nx.toFixed(2) + ',' + c.ny.toFixed(2) + ' d' + c.depth.toFixed(1) : 'none'; }
    return ['no stuck'];
  });
  console.log(r.join('\n'));
  await browser.close();
})();
