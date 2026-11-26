/* =========================================================================
   ARTE DE LOS JEFES DEL MUNDO 3 (tinta y color plano, como un biombo):
   la Kitsune de nueve colas (y sus ilusiones, que no tienen sombra),
   Raijin con su aro de tambores y Fujin con su bolsa de viento (como en
   el biombo de Sōtatsu), Yamata no Orochi con sus ocho cuellos y el Borrón,
   una mancha de tinta viva con máscara. También sus avisos en el suelo y
   sus barras de vida, y las tinajas de sake y las copias de tinta.
   ========================================================================= */
const ArtW3B = (() => {
  const INK = '#1d1817', INKRGB = '29,24,23';
  const lg = (x, x0, y0, x1, y1, ...st) => { const g = x.createLinearGradient(x0, y0, x1, y1); st.forEach((c, i) => g.addColorStop(i / (st.length - 1), c)); return g; };
  const rg = (x, cx, cy, r0, r1, ...st) => { const g = x.createRadialGradient(cx, cy, r0, cx, cy, r1); st.forEach((c, i) => g.addColorStop(i / (st.length - 1), c)); return g; };
  const fi = (x, fill, lw = 1.5, a = 0.92) => { x.fillStyle = fill; x.fill(); x.strokeStyle = `rgba(${INKRGB},${a})`; x.lineWidth = lw; x.stroke(); };
  const glow = (x, X, Y, r, col) => { x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = rg(x, X, Y, 0, r, col, 'rgba(0,0,0,0)'); x.beginPath(); x.arc(X, Y, r, 0, TAU); x.fill(); x.restore(); };
  const stroke = (x, pts, w, col = INK, a = 0.9) => ArtInk.brush(x, pts, w, col, a, 0.25);
  const shadow = (x, X, Y, rx, a = 0.4) => { const ga = x.globalAlpha; x.globalAlpha = ga * a; x.drawImage(ArtInk.wash('30,22,26', 1), X - rx, Y - rx * 0.3, rx * 2, rx * 0.6); x.globalAlpha = ga; };
  const hex = h => h.match(/\w\w/g).map(v => parseInt(v, 16)).join(',');

  // avisos en el suelo: anillo, línea o cono que se llena
  function warn(x, G, b) {
    const w = b.tele; if (!w) return; const f = 1 - w.t / w.max, E = ELEMENTS[w.el] || ELEMENTS.fire; x.save(); x.translate(b.x, b.y);
    if (w.ring) { x.strokeStyle = E.c1; x.lineWidth = 3; x.setLineDash([10, 7]); x.beginPath(); x.ellipse(0, 0, w.ring, w.ring * 0.55, 0, 0, TAU); x.stroke(); x.setLineDash([]); x.fillStyle = `rgba(${hex(E.c1)},0.22)`; x.beginPath(); x.ellipse(0, 0, w.ring * f, w.ring * 0.55 * f, 0, 0, TAU); x.fill(); }
    else if (w.line != null) { x.rotate(w.line); const W = w.wide ? 170 : 40; x.fillStyle = `rgba(${hex(E.c1)},${0.1 + f * 0.2})`; x.fillRect(0, -W, w.len, W * 2); x.strokeStyle = E.c1; x.lineWidth = 2; x.setLineDash([12, 8]); x.strokeRect(0, -W, w.len, W * 2); x.setLineDash([]); if (w.wide) { x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = 2; for (let k = 0; k < 6; k++) { const p = (G.time * 1.6 + k / 6) % 1; x.beginPath(); x.moveTo(p * w.len, -W * 0.6 + k * W * 0.24); x.lineTo(p * w.len + 60, -W * 0.6 + k * W * 0.24); x.stroke(); } } }
    else if (w.cone != null) { x.fillStyle = `rgba(${hex(E.c1)},${0.12 + f * 0.22})`; x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, w.r, w.cone - 0.4, w.cone + 0.4); x.closePath(); x.fill(); x.strokeStyle = E.c1; x.lineWidth = 2; x.stroke(); }
    else { x.strokeStyle = E.c1; x.lineWidth = 2; x.globalAlpha = 0.6 + f * 0.4; x.beginPath(); x.ellipse(0, 0, b.r * 1.6, b.r * 0.8, 0, 0, TAU * f); x.stroke(); }
    x.restore();
  }

  // el dibujo de cada jefe vive en 10k2-art-w3boss.js (ArtW3B2: con texturas)
  function boss(x, G, b) {
    const N = ArtW3B2;
    if (b.w3boss === 'kitsune' || b.w3boss === 'kclone') return N.kitsune(x, G, b);
    if (b.w3boss === 'raijin' || b.w3boss === 'fujin') return N.god(x, G, b);
    if (b.w3boss === 'orochi') return N.orochi(x, G, b);
    if (b.w3boss === 'ohead') return N.head(x, G, b);
    if (b.w3boss === 'borron') return N.borron(x, G, b);
  }
  const copy = (x, G, c) => ArtW3B2.copy(x, G, c), jar = (x, G, u) => ArtW3B2.jar(x, G, u);
  function tomoe(x, X, Y, r, col) { x.save(); x.translate(X, Y); x.fillStyle = col; for (let k = 0; k < 3; k++) { x.rotate(TAU / 3); x.beginPath(); x.arc(r * 0.45, 0, r * 0.38, 0, TAU); x.fill(); x.beginPath(); x.moveTo(r * 0.45 + r * 0.38, 0); x.quadraticCurveTo(r * 0.9, r * 0.7, r * 0.1, r * 0.95); x.quadraticCurveTo(r * 0.6, r * 0.4, r * 0.45, r * 0.38); x.fill(); } x.restore(); }
  /* ---------- barras de los jefes ---------- */
  function bar(x, X, Y, w, f, col, name, u, sh, shCol) { x.fillStyle = 'rgba(29,24,23,0.72)'; HUD.rr(x, X - 8, Y - 24 * u, w + 16, 42 * u, 10 * u); x.fill(); x.font = fontT(14 * u); x.textAlign = 'center'; x.fillStyle = '#f4e6c8'; x.fillText(name, X + w / 2, Y - 10 * u); x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(X, Y, w, 9 * u); x.fillStyle = col; x.fillRect(X, Y, w * clamp(f, 0, 1), 9 * u); if (sh != null) { x.fillStyle = shCol || '#c9b8ff'; x.fillRect(X, Y - 3 * u, w * clamp(sh, 0, 1), 3 * u); } }
  function hud(x, G, sw, sh, u) {
    const B = G.boss, cx = sw / 2, by = sh - 40 * u - (getInsets().bottom || 0) * (isTouch() ? 1.6 : 0); x.textBaseline = 'middle';
    if (B.w3boss === 'kitsune') { bar(x, cx - 180 * u, by, 360 * u, B.hp / B.maxHp, '#e86a4a', Camp.BOSS.kitsune.name, u); return true; }
    if (B.w3boss === 'raijin' || B.w3boss === 'fujin') { const R = G.units.find(q => q.w3boss === 'raijin'), F = G.units.find(q => q.w3boss === 'fujin'); [R, F].forEach((g, k) => { if (!g) return; const X = cx + (k ? 20 * u : -300 * u), f = g.down ? 0 : g.alive ? g.hp / g.maxHp : 0; bar(x, X, by, 280 * u, f, k ? '#7ac86a' : '#b89aff', g.down ? `${k ? 'Fujin' : 'Raijin'} · caído (${Math.ceil(g.downT)} s)` : Camp.BOSS[g.w3boss].name, u); }); if (W3B.shieldK(G) < 1) { x.font = fontB(12 * u, 900); x.fillStyle = '#e6d8ff'; x.fillText('⛓ juntos se protegen', cx, by + 20 * u); } return true; }
    if (B.w3boss === 'orochi') { const H = W3B.headsOf(G); x.fillStyle = 'rgba(29,24,23,0.72)'; HUD.rr(x, cx - 200 * u, by - 30 * u, 400 * u, 48 * u, 10 * u); x.fill(); x.font = fontT(14 * u); x.textAlign = 'center'; x.fillStyle = '#f4e6c8'; x.fillText(Camp.BOSS.orochi.name, cx, by - 16 * u);
      H.forEach((h, k) => { const X = cx - 168 * u + k * 48 * u, Y = by + 6 * u, E = ELEMENTS[h.el]; x.fillStyle = h.alive ? E.c2 : 'rgba(60,60,60,0.6)'; x.beginPath(); x.arc(X, Y, 11 * u, 0, TAU); x.fill(); HUD.icon(x, h.el, X, Y, 6.5 * u, h.alive ? E.c0 : 'rgba(150,150,150,0.6)'); if (h.alive && h.hp < h.maxHp) { x.strokeStyle = E.c1; x.lineWidth = 2.5 * u; x.beginPath(); x.arc(X, Y, 13.5 * u, -Math.PI / 2, -Math.PI / 2 + h.hp / h.maxHp * TAU); x.stroke(); } if (!h.alive) { x.strokeStyle = '#c8281e'; x.lineWidth = 2.5 * u; x.beginPath(); x.moveTo(X - 9 * u, Y - 9 * u); x.lineTo(X + 9 * u, Y + 9 * u); x.stroke(); } if (h.drunk > 0) { x.font = fontB(11 * u, 900); x.fillStyle = '#ffe9a0'; x.fillText('zzz', X, Y - 18 * u); } }); return true; }
    if (B.w3boss === 'borron') { bar(x, cx - 180 * u, by, 360 * u, B.hp / B.maxHp, '#9a5ad0', Camp.BOSS.borron.name, u, B.maxShield ? B.shield / B.maxShield : null, '#2a2430'); return true; }
    return false;
  }
  return { boss, hud, copy, jar, warn, tomoe };
})();
