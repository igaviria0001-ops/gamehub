// ¿qué tan útil es cada fusión? Máquina contra máquina (nivel Maestro), todos los magos: veces lanzada, daño por
// lanzamiento, % de lanzamientos que tocaron a alguien y control (inmovilizar, aturdir, congelar, encerrar) que causó.
// Uso: R=40 node test/fusionstat.js   (FILTRO=earth → solo fusiones con tierra)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 400, height: 300 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(600);
  const R = +(process.env.R || 30), F = process.env.FILTRO || '';
  const res = await page.evaluate(([R]) => {
    const S = {}; const st = k => (S[k] = S[k] || { casts: 0, dmg: 0, hitCasts: 0, ctrl: 0 });
    const open = new Map(); // `${by}|${fk}` → { t, hit }
    const H0 = Unit.prototype.hurt;
    const wrap = proto => { const h = proto.hurt; proto.hurt = function (G, d, src = {}) { const r = h.call(this, G, d, src); if (src.fk && r > 0 && src.by >= 0 && this.team !== (G.mages[src.by] || {}).team) { st(src.fk).dmg += r; const o = open.get(src.by + '|' + src.fk); if (o && !o.hit && G.time - o.t < 6) { o.hit = 1; st(src.fk).hitCasts++; } } return r; }; };
    wrap(Mage.prototype); if (Unit.prototype.hurt !== Mage.prototype.hurt) wrap(Unit.prototype);
    const arenas = ARENA_ORDER;
    for (let r = 0; r < R; r++) {
      const A = CHAR_ORDER[r % CHAR_ORDER.length], B = CHAR_ORDER[(r * 5 + 3) % CHAR_ORDER.length];
      Game.start('duel', 0, { chars: [A, B], wins: 1, level: 4, arena: arenas[r % arenas.length] }); const G = Game.G; G.paused = true;
      const before = G.mages.map(m => ({}));
      Game.tap = e => {
        if (e.type === 'cast' && e.fusion) { st(e.fusion).casts++; open.set(e.who + '|' + e.fusion, { t: G.time, hit: 0 }); }
      };
      // control: estados que pone cada fusión (se mira cada cuarto de segundo quién tiene root/stun/frozen/encierro)
      let t = 0;
      while (G.state !== 'roundEnd' && t < 90) {
        Game.advance(0.25); t += 0.25;
        for (const m of G.mages) { const held = (m.st.root > 0) + (m.st.stun > 0) + (m.st.frozen > 0); if (held && m.lastSpell) { const by = m.lastSpell.by; for (const [k, o] of open) if (k.startsWith(by + '|') && G.time - o.t < 3) st(k.split('|')[1]).ctrl += 0.25; } }
      }
    }
    return S;
  }, [R]);
  const rows = Object.entries(res).filter(([k]) => !F || k.includes(F)).map(([k, v]) => [k, FUS[k] || k, v.casts, v.casts ? +(v.dmg / v.casts).toFixed(1) : 0, v.casts ? Math.round(100 * v.hitCasts / v.casts) : 0, +(v.ctrl / Math.max(1, v.casts)).toFixed(2)]).sort((a, b) => a[3] - b[3]);
  console.log('fusión'.padEnd(14), 'nombre'.padEnd(22), 'veces', 'daño/vez', '%toca', 'ctrl s/vez');
  for (const r of rows) console.log(r[0].padEnd(14), String(r[1]).padEnd(22), String(r[2]).padStart(5), String(r[3]).padStart(8), String(r[4]).padStart(6), String(r[5]).padStart(9));
  console.log('ERR', errors.slice(0, 3).join(' | ') || 'ninguno');
  await browser.close();
})();
const FUS = {};
try { const src = require('fs').readFileSync(path.join(__dirname, '..', 'src', '02-magic.js'), 'utf8'); for (const m of src.matchAll(/'([a-z]+\+[a-z]+)':\s*\{ name: '([^']+)'/g)) FUS[m[1]] = m[2]; } catch (e) { /* nada */ }
