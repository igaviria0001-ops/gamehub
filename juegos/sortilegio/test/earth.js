// Fusiones de tierra 3.0: cada una lanzada contra un rival que camina (o quieto), sin errores; qué tanto pega/atrapa y fotos.
// Uso: node test/earth.js   (SHOTS=1 guarda fotos en test/shots/earth-*.png)
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const KEYS = ['wind+earth', 'earth+bolt', 'earth+light', 'earth+shadow', 'fire+earth', 'water+earth', 'earth+plant'];
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 1100, height: 620 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
  // una franja seca y pareja (sin agua, roca ni arbustos) para que la prueba sea justa
  await page.evaluate(() => { window.dryRow = G => { const T = G.T, bad = j => j < 0 || Terrain.solid(T, j) || [TT.DEEP, TT.SHALLOW, TT.LAVA, TT.CHASM, TT.BUSH, TT.ROCK].includes(T.base[j]);
    for (let y = 200; y < T.H - 160; y += 40) for (let x0 = 80; x0 < T.W - 560; x0 += 40) { let ok = true; for (let x = x0; x <= x0 + 480 && ok; x += 20) for (let dy = -40; dy <= 40 && ok; dy += 40) if (bad(Terrain.idx(T, x, y + dy))) ok = false; if (ok) { window.DX = x0 - 540; return y; } } window.DX = 0; return 500; }; });
  const out = {};
  for (const key of KEYS) {
    for (const mode of ['walk', 'still']) {
      const r = await page.evaluate(([key, mode]) => {
        UI.show(null, false);
        Game.start('duel', 2, { chars: ['tatacoa', 'candela'], wins: 1, arena: 'ciudad' }); const G = Game.G; G.paused = true; G.state = 'play'; G.countT = 0; G.introT = 0;
        const [a, b] = G.mages; const Y = dryRow(G); a.x = 600 + DX; a.y = Y; b.x = (key === 'wind+earth' ? 720 : 860) + DX; b.y = Y; a.face = 0; a.hp = a.maxHp = 999; b.hp = b.maxHp = 400;
        const els = key.split('+'); a.hands[0].el = els[0]; a.hands[1].el = els[1];
        Input.read = i => ({ mx: 0, my: i === 1 && mode === 'walk' ? 1 : 0, h: [false, false], dash: false });
        const hp0 = b.hp; let held = 0, maxSt = 0, fell = 0, hidden = 0;
        Spells.cast(G, a, FUSIONS[key], els[0], { fusion: key, power: 1, size: 1 });
        const shots = [];
        for (let k = 0; k < 40; k++) { Game.advance(0.1); if (b.st.root > 0 || b.st.stun > 0 || b.st.frozen > 0) held += 0.1; if (b.st.slow > 0) maxSt = Math.max(maxSt, 1 - b.st.slowF); if (a.st.hidden > 0) hidden += 0.1; }
        const ev = G.spells.map(s => s.t);
        return { dmg: Math.round(hp0 - b.hp), held: +held.toFixed(1), slow: +maxSt.toFixed(2), hidden: +hidden.toFixed(1), bx: Math.round(b.x - DX), by: Math.round(b.y), left: ev.join(',') };
      }, [key, mode]);
      out[key + ' ' + mode] = r;
    }
  }
  console.table(out);
  if (process.env.SHOTS) {
    fs.mkdirSync(path.join(__dirname, 'shots'), { recursive: true });
    for (const [key, at] of [['wind+earth', 1.0], ['earth+bolt', 0.8], ['earth+light', 0.25], ['earth+light', 1.0], ['earth+shadow', 0.4], ['earth+shadow', 1.2], ['fire+earth', 0.45], ['fire+earth', 0.75], ['water+earth', 0.35], ['earth+plant', 0.3]]) {
      await page.evaluate(([key, at]) => {
        UI.show(null, false);
        Game.start('duel', 2, { chars: ['tatacoa', 'candela'], wins: 1, arena: 'ciudad' }); const G = Game.G; G.paused = true; G.state = 'play'; G.countT = 0; G.introT = 0;
        const [a, b] = G.mages; const Y = dryRow(G); a.x = 600 + DX; a.y = Y; b.x = (key === 'wind+earth' ? 720 : 860) + DX; b.y = Y; a.face = 0; a.hp = a.maxHp = 999; b.hp = b.maxHp = 400;
        const els = key.split('+'); a.hands[0].el = els[0]; a.hands[1].el = els[1];
        Input.read = i => ({ mx: 0, my: 0, h: [false, false], dash: false });
        Spells.cast(G, a, FUSIONS[key], els[0], { fusion: key, power: 1, size: 1 });
        Game.advance(at); Game.snapCamera();
        G.paused = false; setTimeout(() => { G.paused = true; }, 60);
      }, [key, at]);
      await page.waitForTimeout(140);
      await page.screenshot({ path: path.join(__dirname, 'shots', `earth-${key.replace('+', '-')}-${at}.png`) });
    }
  }
  console.log('ERR', errors.slice(0, 5).join(' | ') || 'ninguno');
  await browser.close();
})();
