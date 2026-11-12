// hechizos de cerca, a mitad de vuelo
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(800);
  const SETS = process.env.SET ? JSON.parse(process.env.SET) : [['agua-fuego', [['water', 1], ['fire', 1], ['water', 2]]], ['tierra-rayo', [['earth', 1], ['bolt', 2], ['wind', 1]]], ['fus', [['F', 'fire+wind'], ['F', 'wind+bolt'], ['F', 'fire+earth']]]];
  const STEPS = +(process.env.STEPS || 22);
  for (const [name, list] of SETS) {
    await page.evaluate(list => {
      Game.start('free', 2, { chars: ['yuma', 'candela'], arena: 'paramo' }); UI.show(null, false); Game.advance(2.8);
      const G = Game.G, [a, b] = G.mages; a.x = 520; a.y = 300; b.x = 1000; b.y = 600; a.face = 0.55; b.face = Math.PI + 0.55;
      list.forEach(([el, lv], i) => { const m = i % 2 ? b : a; m.y += i * 2; if (el === 'F') Spells.cast(G, m, FUSIONS[lv], lv, { fusion: lv, power: 1, size: 1 }); else Spells.cast(G, m, SPELLS[el][lv - 1], el, { level: lv, power: 1 }); });
      window.__adv = () => Game.advance(0.016);
    }, list);
    for (let k = 0; k < STEPS; k++) { await page.evaluate(() => window.__adv()); await page.waitForTimeout(16); }
    await page.evaluate(() => { const G = Game.G; Game.cam.x = 760; Game.cam.y = 440; Game.cam.z = 1.6; G.paused = true; });
    await page.waitForTimeout(120);
    await page.screenshot({ path: path.join(__dirname, 'shots', `sp-${name}.png`) });
  }
  console.log('ERR', errors.join(' | ') || 'ninguno'); await browser.close();
})();
