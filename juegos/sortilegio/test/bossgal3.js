// galería de los jefes del Mundo 3 en grande (para revisar el dibujo): Kitsune, Raijin, Fujin, Orochi con cabezas,
// el Borrón (con y sin coraza), copia de tinta y tinaja. TAG=antes|despues · T=segundo de la animación
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
  const tag = process.env.TAG || 'shot', T = +(process.env.T || 1.3);
  await page.evaluate(([T]) => {
    UI.show(null, false); const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 1000; cv.style.cssText = 'position:fixed;inset:0;z-index:2147483000'; document.body.appendChild(cv);
    const x = cv.getContext('2d'); x.fillStyle = '#e9dfc8'; x.fillRect(0, 0, 1600, 1000); x.fillStyle = '#d8ccb0'; x.fillRect(0, 500, 1600, 500);
    const base = { vx: 60, vy: 0, flash: 0, tele: null, alive: true, hp: 1, maxHp: 1, shield: 0, maxShield: 1, t: T };
    const G = { time: T, cs: { beatT: 0.05, bpm: 108, beat0: 0 }, units: [], frame: 1 };
    const one = (X, Y, s, b) => { x.save(); x.translate(X, Y); x.scale(s, s); const o = Object.assign({}, base, b, { x: 0, y: 0 }); ArtW3B.boss(x, G, o); x.restore(); };
    one(230, 330, 1.7, { w3boss: 'kitsune', reveal: 0 });
    one(620, 360, 1.5, { w3boss: 'raijin' });
    one(980, 360, 1.5, { w3boss: 'fujin', vx: -60 });
    one(1340, 360, 1.6, { w3boss: 'borron', shield: 1 });
    one(1340, 760, 1.0, { w3boss: 'borron', shield: 0 });
    // Orochi: cuerpo y ocho cabezas alrededor
    const els = ['fire', 'water', 'wind', 'earth', 'plant', 'bolt', 'light', 'shadow'];
    const heads = els.map((el, k) => Object.assign({}, base, { w3boss: 'ohead', el, hk: k, x: 0, y: 0, alive: k !== 5, drunk: k === 2 ? 3 : 0, hp: 100, maxHp: 150 }));
    x.save(); x.translate(560, 840); x.scale(0.62, 0.62);
    const body = Object.assign({}, base, { w3boss: 'orochi', x: 0, y: 0 });
    heads.forEach((h, k) => { const a = Math.PI * (0.08 + k / 7 * 0.84); h.x = Math.cos(a) * -560; h.y = Math.sin(a) * -330 + 120; });
    const G2 = Object.assign({}, G, { units: [body, ...heads] });
    ArtW3B.boss(x, G2, body); heads.forEach(h => ArtW3B.boss(x, G2, h)); x.restore();
    // cabezas sueltas en grande
    ['fire', 'water', 'plant', 'bolt'].forEach((el, k) => { x.save(); x.translate(1000 + k * 0, 0); x.restore(); });
    x.save(); x.translate(1120, 980); x.scale(1.1, 1.1); ['fire', 'water', 'earth', 'shadow'].forEach((el, k) => { const h = Object.assign({}, base, { w3boss: 'ohead', el, hk: k, x: -120 + k * 0, y: 0, alive: true }); x.save(); x.translate(-300 + k * 0, 0); x.restore(); }); x.restore();
    for (const [k, el] of ['fire', 'water', 'earth', 'shadow'].entries()) { x.save(); x.translate(1030 + k * 150, 700); x.scale(1.25, 1.25); ArtW3B.boss(x, G, Object.assign({}, base, { w3boss: 'ohead', el, hk: k, x: 0, y: 0, alive: true, lunge: k % 2 ? { a: 0.3, t: 0.2 } : null })); x.restore(); }
    x.save(); x.translate(1450, 920); x.scale(1.6, 1.6); ArtW3B.copy(x, G, { x: 0, y: 0, t: T, spawnT: 0, flash: 0, els: ['fire', 'water'] }); x.restore();
    x.save(); x.translate(1540, 920); x.scale(1.6, 1.6); ArtW3B.jar(x, G, { x: 0, y: 0, flash: 0 }); x.restore();
  }, [T]);
  await page.waitForTimeout(200); await page.screenshot({ path: path.join(__dirname, 'shots', `bossgal3-${tag}.png`) });
  console.log('ERR', errors.slice(0, 4).join(' | ') || 'ninguno'); await browser.close();
})();
