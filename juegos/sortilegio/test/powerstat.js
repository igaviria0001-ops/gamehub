// ¿qué tan bueno es cada poder? Máquina contra máquina, todos los magos: veces lanzado, daño por lanzamiento (también el
// que hace después: quemadura, zona, criaturas del hechizo), % de lanzamientos que tocaron a alguien y control
// (inmovilizar, aturdir, congelar) en los 3 s siguientes. Incluye los hechizos de un elemento (rápido y cargado).
// Uso: R=26 LV=4 node test/powerstat.js   (FILTRO=Eclipse → solo los que contienen ese texto; ORDEN=dmg|veces)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 400, height: 300 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(600);
  const R = +(process.env.R || 26), F = process.env.FILTRO || '', LV = +(process.env.LV || 4);
  const res = await page.evaluate(([R, LV]) => {
    const S = {}; const st = k => (S[k] = S[k] || { casts: 0, dmg: 0, hitCasts: 0, ctrl: 0 });
    const open = new Map(); // `${by}|${sk}` → { t, hit }
    const wrap = proto => { const h = proto.hurt; proto.hurt = function (G, d, src = {}) { const r = h.call(this, G, d, src); const k = src.sk; if (k && r > 0 && src.by >= 0 && this.team !== (G.mages[src.by] || {}).team) { st(k).dmg += r; const o = open.get(src.by + '|' + k); if (o && !o.hit && G.time - o.t < 6) { o.hit = 1; st(k).hitCasts++; } } return r; }; };
    wrap(Mage.prototype); if (Unit.prototype.hurt !== Mage.prototype.hurt) wrap(Unit.prototype);
    const arenas = ARENA_ORDER, N = CHAR_ORDER.length;
    for (let r = 0; r < R; r++) {
      const A = CHAR_ORDER[r % N], B = CHAR_ORDER[(r * 5 + 3 + Math.floor(r / N)) % N]; if (A === B) continue;
      Game.start('duel', 0, { chars: [A, B], wins: 1, level: LV, arena: arenas[r % arenas.length] }); const G = Game.G; G.paused = true;
      Game.tap = e => { if (e.type === 'cast' && e.sk) { st(e.sk).casts++; open.set(e.who + '|' + e.sk, { t: G.time, hit: 0 }); } };
      let t = 0;
      while (G.state !== 'roundEnd' && t < 90) {
        Game.advance(0.25); t += 0.25;
        for (const m of G.mages) { const held = (m.st.root > 0) + (m.st.stun > 0) + (m.st.frozen > 0) + (m.st.caged > 0 ? 1 : 0); if (!held) continue; const by = 1 - m.idx; for (const [k, o] of open) if (k.startsWith(by + '|') && G.time - o.t < 3) { st(k.split('|')[1]).ctrl += 0.25; break; } }
      }
    }
    Game.tap = null; return S;
  }, [R, LV]);
  const rows = Object.entries(res).filter(([k]) => !F || k.includes(F)).map(([k, v]) => [k, v.casts, v.casts ? +(v.dmg / v.casts).toFixed(1) : 0, v.casts ? Math.round(100 * v.hitCasts / v.casts) : 0, +(v.ctrl / Math.max(1, v.casts)).toFixed(2)]);
  rows.sort((a, b) => process.env.ORDEN === 'veces' ? b[1] - a[1] : a[2] - b[2]);
  console.log('poder'.padEnd(22), 'veces', 'daño/vez', '%toca', 'ctrl s/vez');
  for (const r of rows) console.log(String(r[0]).padEnd(22), String(r[1]).padStart(5), String(r[2]).padStart(8), String(r[3]).padStart(6), String(r[4]).padStart(9));
  console.log('ERR', errors.slice(0, 3).join(' | ') || 'ninguno');
  await browser.close();
})();
