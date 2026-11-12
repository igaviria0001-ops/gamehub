// reparto del tiempo de dibujo por partes en celular (Q=alta|ligera, ARENA=paramo, LV= nivel de campaña)
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch(); const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }); const page = await ctx.newPage();
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(600);
  const r = await page.evaluate(async ([q, arena, lv]) => {
    Game.setQuality(q); if (lv) Game.start('camp', 0, { level: +lv, chars: ['zuhe', 'tota'] }); else Game.start('duel', 2, { arena }); UI.show(null, false); const G = Game.G; if (!lv) G.mages.forEach((m, i) => m.ctrl = new Bot(2)); else for (const m of G.mages) m.maxHp = m.hp = 9999; Game.advance(5);
    const T = {}; const wrap = (o, name, tag) => { const f = o[name]; o[name] = function () { const t0 = performance.now(); const r = f.apply(this, arguments); T[tag] = (T[tag] || 0) + performance.now() - t0; return r; }; };
    wrap(Art, 'render', 'TOTAL'); wrap(ArtGround, 'prerender', 'suelo-cache'); wrap(ArtGround, 'overlays', 'suelo-encima'); wrap(ArtMage, 'draw', 'magos'); wrap(ArtMage, 'marker', 'marcas');
    for (const k of ['rays', 'bokeh', 'grade', 'bloom', 'shadows', 'water', 'backdrop']) wrap(Post, k, 'post.' + k);
    for (const k of Object.keys(ArtSpells)) if (typeof ArtSpells[k] === 'function') wrap(ArtSpells, k, 'hechizos'); for (const k of Object.keys(ArtSpells2)) if (typeof ArtSpells2[k] === 'function') wrap(ArtSpells2, k, 'hechizos');
    if (typeof HUD !== 'undefined') wrap(HUD, 'draw', 'hud'); wrap(Touch, 'draw', 'tactil'); wrap(ArtGround, 'tallItems', 'arboles-lista');
    if (typeof ArtCreature !== 'undefined') wrap(ArtCreature, 'draw', 'criaturas'); wrap(Camp, 'draw', 'camp');
    const s0 = performance.now(); let frames = 0; await new Promise(res => { const f = () => { frames++; performance.now() - s0 < 4000 ? requestAnimationFrame(f) : res(); }; requestAnimationFrame(f); });
    const out = { fps: Math.round(frames / 4), dpr: Game.screen.dpr }; for (const k in T) out[k] = (T[k] / frames).toFixed(2); return out;
  }, [process.env.Q || 'alta', process.env.ARENA || 'paramo', process.env.LV || '']);
  console.log(JSON.stringify(r)); await browser.close();
})();
