// cada hechizo contra un rival quieto a 220 px: ¿hace daño, no falla?
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(800);
  const r = await page.evaluate(() => {
    const out = [];
    const run = (label, fn, d = 220, wet = false) => {
      Game.start('free', 2, { chars: ['candela', 'frailejon'], arena: 'paramo' }); const G = Game.G; Game.advance(2.8);
      const [a, b] = G.mages; a.x = 400; a.y = 300; b.x = 400 + d; b.y = 300; a.face = 0; b.face = Math.PI; a.vx = a.vy = b.vx = b.vy = 0;
      if (wet) b.st.wet = 5;
      const hp0 = b.stats.taken; fn(G, a, b); let t = 0; while (t < 4) { Game.advance(0.05); t += 0.05; b.x = 400 + d; b.y = 300; b.vx = b.vy = 0; }
      out.push(label + ': ' + Math.round(b.stats.taken - hp0) + (b.st.root > 0 ? ' (enredado)' : ''));
    };
    for (const el of EL) for (const lv of [1, 2]) run(SPELLS[el][lv - 1].name, (G, a) => Spells.cast(G, a, SPELLS[el][lv - 1], el, { level: lv, power: 1 }));
    for (const k of FUSION_ORDER) run(FUSIONS[k].name, (G, a) => Spells.cast(G, a, FUSIONS[k], k, { fusion: k, power: 1, size: 1 }));
    run('Chispa a mojado', (G, a) => Spells.cast(G, a, SPELLS.bolt[0], 'bolt', { level: 1, power: 1 }), 220, true);
    run('Gran Plasma', (G, a) => Spells.cast(G, a, FUSIONS['fire+bolt'], 'fire+bolt', { fusion: 'fire+bolt', power: 1.5, size: 1.4, gran: true }));
    return out;
  });
  console.log(r.join('\n')); console.log('ERR', errors.slice(0, 4).join(' | ') || 'ninguno');
  await browser.close();
})();
