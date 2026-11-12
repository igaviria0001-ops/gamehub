// ¿Se puede pasar por debajo del arco del reloj y de la catedral volando derecho? (persona que apunta al frente)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 800, height: 450 } })).newPage();
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const { Game, Input } = VTO, out = [];
    for (const [x0, y0, sp] of [[1450, 1985, 500], [1450, 1985, 800], [1400, 1940, 650], [2300, 1985, 700]]) {
      Game.setArena('cartagena'); Game.start('free', 1); VTO.UI.show(null, false);
      const G = Game.G, b = G.birds[0]; G.bots = [null, null]; G.birds[1].x = -5000; G.birds[1].alive = false;
      b.reset(x0, y0, 1); b.vx = sp; b.vy = 0; b.s = sp; b.a = 0; b.va = 0;
      const orig = Input.read; Input.read = i => (i === 0 ? Object.assign(orig(0), { dx: 1, dy: 0 }) : orig(i));
      let crashes = 0, minY = 1e9, maxY = 0; const o2 = G.events.push.bind(G.events); G.events.push = (...a) => { for (const e of a) if (e.type === 'crash' && e.b === b) { crashes++; window.__ck = (window.__ck || []).concat(e.kind + '@' + Math.round(e.x) + ',' + Math.round(e.y)); } return o2(...a); };
      for (let k = 0; k < 90; k++) { Game.advance(1 / 60); if (b.x > x0 + 100 && b.x < x0 + 420) { minY = Math.min(minY, b.y); maxY = Math.max(maxY, b.y); } }
      Input.read = orig;
      out.push({ desde: [x0, y0], vel: sp, llega_x: Math.round(b.x), y: Math.round(b.y), choques: crashes, rangoY: [Math.round(minY), Math.round(maxY)] });
    }
    return out;
  });
  r.forEach(x => console.log(JSON.stringify(x))); console.log(await page.evaluate(() => window.__ck));
  await browser.close();
})();
