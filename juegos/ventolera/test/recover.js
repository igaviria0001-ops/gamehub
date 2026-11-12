// Recuperarse de una pérdida: ¿cuánta altura se pierde con turbo hacia arriba, soltando todo o picando?
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('ERR', e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => {
    const { Game } = VTO; Game.setArena('cocora'); Game.start('free', 2); const G = Game.G; G.paused = true;
    const out = {};
    const E = () => ({ dx: 0, dy: 0, fire: false, boost: false, missile: false, roll: false });
    for (const sp of ['guacamaya', 'condor']) for (const [name, f] of [['arriba+turbo', () => Object.assign(E(), { dy: -1, boost: true })], ['soltar', () => E()], ['adelante+turbo', () => Object.assign(E(), { dx: 1, boost: true })], ['picar', () => Object.assign(E(), { dx: 0.6, dy: 0.8 })]]) {
      Game.cfg.species = [sp, sp]; Game.start('free', 2); G.paused = true;
      const b = G.birds[0]; b.reset(1400, 700, 1); b.vx = 40; b.vy = 300; b.a = -1.2; b.fuel = 1;
      const y0 = b.y; let t = 0, low = b.y, ok = null;
      while (t < 5) { b.step(1 / 120, f(), G); G.events.length = 0; t += 1 / 120; low = Math.max(low, b.y); if (!ok && b.lift > 0.85 && b.vy < 0) ok = t; }
      out[sp + ' ' + name] = `cae ${Math.round(low - y0)} px · recupera en ${ok ? ok.toFixed(2) + ' s' : 'nunca'} · a los 5 s sube ${Math.round(y0 - b.y)} px · turbo ${b.fuel.toFixed(2)}`;
    }
    return out;
  });
  for (const [k, v] of Object.entries(r)) console.log(k.padEnd(26), v);
  await browser.close();
})();
