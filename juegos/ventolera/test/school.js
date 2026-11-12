// Escuela de vuelo: las 9 lecciones avanzan (aros, globos, dron con misil) y se ven bien en PC y celular
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  for (const [name, vp, o] of [['pc', { width: 1280, height: 720 }, {}], ['cel', { width: 693, height: 272 }, { deviceScaleFactor: 2.625, isMobile: true, hasTouch: true }]]) {
    const ctx = await browser.newContext(Object.assign({ viewport: vp }, o));
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, 'index.html'));
    await page.waitForTimeout(700);
    await page.evaluate(() => VTO.UI.show('title', false));
    await page.locator('[data-act="school"]').click();
    await page.waitForTimeout(800);
    const log = [];
    for (let i = 0; i < 9; i++) {
      const info = await page.evaluate(() => ({ k: VTO.School.index, t: VTO.Game.G.targets.filter(t => t.alive).map(t => t.kind).join(',') }));
      await page.screenshot({ path: path.join(__dirname, 'shots', `school-${name}-${info.k}.png`) });
      // resolverla «a mano»: pasar por los aros, reventar globos, tumbar el dron o fingir la maniobra
      const r = await page.evaluate(async () => {
        const { Game, School } = VTO, G = Game.G, b = G.birds[0], k0 = School.index;
        const T = G.targets.filter(t => t.alive);
        if (T.some(t => t.kind === 'ring')) for (const t of T.filter(t => t.kind === 'ring').sort((a, c) => a.order - c.order)) { b.x = t.x; b.y = t.y; Game.advance(1 / 60); }
        else if (T.some(t => t.kind === 'balloon')) for (const t of T) { b.mis = t.back ? 2 : 0; School.hitTarget(G, t, 0); Game.advance(1 / 60); }
        else if (k0 === 6) { const d = T.find(t => t.drone); b.reset(d.x - 600, d.y, 1); b.missiles = 3; for (let i = 0; i < 300 && d.alive; i++) { const aim = Math.atan2(d.y - b.y, d.x - b.x); b.a = aim; Game.advance(1 / 120); if (b.locked && !G.missiles.length) { VTO.Combat.step(G, 0, [{ dx: 0, dy: 0, fire: false, boost: false, missile: true, roll: false }, null]); } } }
        else if (k0 === 5) { G.events.push({ type: 'dodged', b }); }
        else if (k0 === 3) { G.events.push({ type: 'trick', b, key: 'cobra', name: 'Cobra', combo: 1 }); }
        else if (k0 === 7) { G.events.push({ type: 'trick', b, key: 'rasante', name: 'Rasante', combo: 1 }); }
        Game.advance(0.1);
        const ok = School.index;
        for (let i = 0; i < 300 && School.index === k0 && !School.finished; i++) Game.advance(1 / 60);
        return [k0, School.index, School.finished, G.targets.filter(t => t.alive).length];
      });
      log.push(r.join('→'));
      if (r[2]) break;
    }
    console.log(name, log.join(' | '), 'ERR', errors.join(' | ') || 'ninguno');
    await ctx.close();
  }
  await browser.close();
})();
