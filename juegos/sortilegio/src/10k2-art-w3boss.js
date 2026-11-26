/* =========================================================================
   JEFES DEL MUNDO 3 · dibujo con textura — la Kitsune, Raijin y Fujin,
   Orochi y sus ocho cabezas, el Borrón, sus copias de tinta y las tinajas.
   Las texturas (pelo, escamas, piel de tigre, grano de tinta) son mosaicos que
   se pintan una sola vez y se ponen con patrón dentro de cada forma, encima del
   degradado: así cada jefe tiene volumen, material y luz propia.
   La lógica de los jefes no cambia: aquí solo se dibuja (las copias de la
   Kitsune siguen siendo idénticas a ella, salvo que no tienen sombra).
   ========================================================================= */
const ArtW3B2 = (() => {
  const INK = '#1d1817', IR = '29,24,23';
  const H = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
  const lg = (x, x0, y0, x1, y1, ...st) => { const g = x.createLinearGradient(x0, y0, x1, y1); st.forEach((c, i) => g.addColorStop(i / (st.length - 1), c)); return g; };
  const rg = (x, cx, cy, r0, r1, ...st) => { const g = x.createRadialGradient(cx, cy, r0, cx, cy, r1); st.forEach((c, i) => g.addColorStop(i / (st.length - 1), c)); return g; };
  const ink = (x, lw = 1.6, a = 0.9) => { x.strokeStyle = `rgba(${IR},${a})`; x.lineWidth = lw; x.lineJoin = 'round'; x.lineCap = 'round'; x.stroke(); };
  // dibujos que se pintan una vez y se reusan (brillos, llamitas, nubes, tambores, el cuerpo de Orochi): así cada cuadro es liviano
  const SPR = {}, mkc = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function glowS(rgbS) { const k = 'g' + rgbS; if (SPR[k]) return SPR[k]; const c = mkc(64, 64), q = c.getContext('2d'), g = q.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, `rgba(${rgbS},1)`); g.addColorStop(1, `rgba(${rgbS},0)`); q.fillStyle = g; q.fillRect(0, 0, 64, 64); return (SPR[k] = c); }
  // brillo suave (col = 'rgba(r,g,b,a)'): el sprite es por color, la opacidad va aparte
  const glow = (x, X, Y, r, col) => { const m = /\(([^,]+),([^,]+),([^,)]+)(?:,([^)]+))?\)/.exec(col); if (!m || r <= 0) return; const a = m[4] != null ? +m[4] : 1; if (a <= 0.01) return;
    const ga = x.globalAlpha, gc = x.globalCompositeOperation; x.globalCompositeOperation = 'lighter'; x.globalAlpha = ga * Math.min(1, a); x.drawImage(glowS(`${+m[1] | 0},${+m[2] | 0},${+m[3] | 0}`), X - r, Y - r, r * 2, r * 2); x.globalAlpha = ga; x.globalCompositeOperation = gc; };
  const rgb = h => /^#/.test(h) ? h.slice(1).match(/\w\w/g).map(v => parseInt(v, 16)).join(',') : '255,255,255';
  const lo = () => typeof LOWFX !== 'undefined' && LOWFX;
  const shadow = (x, X, Y, rx, a = 0.4) => { const ga = x.globalAlpha; x.globalAlpha = ga * a; x.drawImage(ArtInk.wash('30,22,26', 1), X - rx, Y - rx * 0.32, rx * 2, rx * 0.64); x.globalAlpha = ga; };
  const brush = (x, pts, w, col, a = 0.9, dry = 0.3) => ArtInk.brush(x, pts, w, col, a, dry);

  /* ---------------- texturas (una vez por lienzo) ---------------- */
  const PAT = new WeakMap();
  function pat(x, key, w, h, make) {
    let M = PAT.get(x); if (!M) PAT.set(x, M = {}); if (M[key]) return M[key];
    const c = document.createElement('canvas'); c.width = w; c.height = h; const q = c.getContext('2d');
    try { make(q, w, h); } catch (e) { /* nada */ }
    return (M[key] = x.createPattern(c, 'repeat'));
  }
  // dibuja algo en las 9 copias vecinas para que el mosaico empalme sin costuras
  const wrap = (q, w, h, f) => { for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) { q.save(); q.translate(ox, oy); f(); q.restore(); } };
  const FUR = x => pat(x, 'fur', 72, 72, (q, w, h) => { q.lineCap = 'round';
    for (let i = 0; i < 150; i++) { const X = H(i, 1) * w, Y = H(i, 2) * h, a = 2.1 + (H(i, 3) - 0.5) * 0.9, L = 4 + H(i, 4) * 8, light = H(i, 5) < 0.58;
      wrap(q, w, h, () => { q.strokeStyle = light ? 'rgba(255,255,255,0.8)' : 'rgba(140,110,90,0.32)'; q.lineWidth = 0.8 + H(i, 6) * 0.7; q.beginPath(); q.moveTo(X, Y); q.quadraticCurveTo(X + Math.cos(a) * L * 0.5 + 1.6, Y + Math.sin(a) * L * 0.5, X + Math.cos(a) * L, Y + Math.sin(a) * L); q.stroke(); }); } });
  const SCALES = (x, key, base, light, dark) => pat(x, 'sc' + key, 40, 20, (q, w, h) => {
    q.fillStyle = dark; q.fillRect(0, 0, w, h); const s = 20;
    for (let r = -1; r <= 2; r++) for (let k = -1; k <= 2; k++) { const X = k * s + (r % 2 ? s / 2 : 0), Y = r * 10;
      const g = q.createRadialGradient(X - 3, Y + 2, 1, X, Y + 4, s * 0.66); g.addColorStop(0, light); g.addColorStop(0.5, base); g.addColorStop(1, dark);
      q.fillStyle = g; q.beginPath(); q.moveTo(X - s / 2, Y); q.quadraticCurveTo(X - s / 2, Y + 11, X, Y + 13); q.quadraticCurveTo(X + s / 2, Y + 11, X + s / 2, Y); q.closePath(); q.fill();
      q.strokeStyle = 'rgba(8,10,4,0.6)'; q.lineWidth = 1; q.stroke(); q.strokeStyle = 'rgba(255,255,230,0.18)'; q.lineWidth = 0.8; q.beginPath(); q.arc(X - 2, Y + 4, s * 0.28, Math.PI * 1.1, Math.PI * 1.7); q.stroke(); } });
  const TIGER = x => pat(x, 'tiger', 64, 40, (q, w, h) => {
    const g = q.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#f2b83a'); g.addColorStop(1, '#d8861e'); q.fillStyle = g; q.fillRect(0, 0, w, h);
    q.fillStyle = '#1d1210'; for (let i = 0; i < 4; i++) { const X = i * 16 + 4 + H(i, 2) * 4;
      wrap(q, w, h, () => { q.beginPath(); q.moveTo(X - 2, -2); q.quadraticCurveTo(X + 5, h * 0.35, X - 1, h * 0.62); q.quadraticCurveTo(X + 3, h * 0.42, X + 3.5, -2); q.closePath(); q.fill(); q.beginPath(); q.moveTo(X + 6, h + 2); q.quadraticCurveTo(X + 1, h * 0.7, X + 6, h * 0.5); q.quadraticCurveTo(X + 4, h * 0.75, X + 9, h + 2); q.closePath(); q.fill(); }); } });
  const GRAIN = x => pat(x, 'grain', 96, 96, (q, w, h) => { q.lineCap = 'round';
    for (let i = 0; i < 120; i++) { const X = H(i, 7) * w, Y = H(i, 8) * h, a = (H(i, 9) - 0.5) * 1.2, L = 6 + H(i, 10) * 18;
      wrap(q, w, h, () => { q.strokeStyle = H(i, 11) < 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(140,110,180,0.10)'; q.lineWidth = 0.7 + H(i, 12); q.beginPath(); q.moveTo(X, Y); q.lineTo(X + Math.cos(a) * L, Y + Math.sin(a) * L); q.stroke(); }); }
    for (let i = 0; i < 60; i++) { q.fillStyle = 'rgba(255,255,255,0.08)'; q.beginPath(); q.arc(H(i, 13) * w, H(i, 14) * h, 0.6 + H(i, 15) * 1.2, 0, TAU); q.fill(); } });
  // rellena la forma que ya está trazada con un patrón (encima de su color)
  const tex = (x, p, a, comp) => { if (!p) return; x.save(); x.globalAlpha *= a; if (comp) x.globalCompositeOperation = comp; x.fillStyle = p; x.fill(); x.restore(); };
  // sombra suave dentro de la forma trazada (de abajo, o de un lado)
  const shade = (x, x0, y0, x1, y1, a = 0.3) => { x.save(); x.clip(); x.fillStyle = lg(x, x0, y0, x1, y1, 'rgba(20,10,20,0)', `rgba(20,10,20,${a})`); x.fillRect(Math.min(x0, x1) - 90, Math.min(y0, y1) - 90, Math.abs(x1 - x0) + 180, Math.abs(y1 - y0) + 180); x.restore(); };
  // llamita (fuego de zorro, fuego de cresta): gota que apunta hacia arriba
  function flameS(col, core) { const k = 'f' + col + '|' + core; if (SPR[k]) return SPR[k]; const s = 16, c = mkc(64, 80), q = c.getContext('2d'); q.translate(32, 44);
    q.globalAlpha = 0.55; let g = q.createRadialGradient(0, 0, 0, 0, 0, s * 1.8); g.addColorStop(0, `rgba(${col},0.9)`); g.addColorStop(1, `rgba(${col},0)`); q.fillStyle = g; q.beginPath(); q.arc(0, 0, s * 1.8, 0, TAU); q.fill();
    q.globalAlpha = 1; g = q.createRadialGradient(0, s * 0.3, 0, 0, s * 0.3, s * 1.3); g.addColorStop(0, `rgba(${core},1)`); g.addColorStop(0.5, `rgba(${col},0.95)`); g.addColorStop(1, `rgba(${col},0)`); q.fillStyle = g;
    q.beginPath(); q.moveTo(0, -s * 2.2); q.bezierCurveTo(s * 0.5, -s, s, -s * 0.1, s * 0.8, s * 0.5); q.arc(0, s * 0.5, s * 0.8, 0, Math.PI); q.bezierCurveTo(-s, -s * 0.1, -s * 0.5, -s, 0, -s * 2.2); q.fill(); return (SPR[k] = c); }
  // llamita (fuego de zorro, fuego de cresta): gota que apunta hacia arriba
  function flame(x, X, Y, s, col, core = '255,255,255', a = 1, lean = 0) { const S = flameS(col, core), k = s / 16; x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha *= a; x.translate(X, Y); if (lean) x.rotate(lean); x.drawImage(S, -32 * k, -44 * k, 64 * k, 80 * k); x.restore(); }
  // espiral de pintura (rizo de nube, remolino de viento, marca de la zorra)
  function curl(x, X, Y, r, turns = 1.3, dir = 1) { x.beginPath(); for (let k = 0; k <= 26; k++) { const u = k / 26, a = dir * u * turns * TAU, rr = r * (1 - u * 0.85); k ? x.lineTo(X + Math.cos(a) * rr, Y + Math.sin(a) * rr) : x.moveTo(X + Math.cos(a) * rr, Y + Math.sin(a) * rr); } }
  // rayito quebrado entre dos puntos
  function zap(x, x0, y0, x1, y1, seed, j, col, w) { x.beginPath(); x.moveTo(x0, y0); for (let k = 1; k < 6; k++) { const u = k / 6; x.lineTo(x0 + (x1 - x0) * u + (H(seed, k) - 0.5) * j, y0 + (y1 - y0) * u + (H(seed, k + 7) - 0.5) * j); } x.lineTo(x1, y1); x.strokeStyle = col; x.lineWidth = w; x.lineJoin = 'round'; x.stroke(); }

  /* =================== LA KITSUNE =================== */
  function kitsune(x, G, b) {
    const t = G.time + (b._nid || 0) * 0.7, dir = Math.cos(Math.atan2(b.vy || 0, b.vx || 1)) >= 0 ? 1 : -1, real = !b.clone, Y = -34 + Math.sin(t * 2.2) * 3, rev = real && b.reveal > 0, mv = Math.min(1, hypot(b.vx || 0, b.vy || 0) / 120), L0 = lo();
    ArtW3B.warn(x, G, b); x.save(); x.translate(b.x, b.y);
    if (real) shadow(x, 0, 4, 62); // ¡la de verdad tiene sombra!
    x.scale(1.35, 1.35);
    if (b.dash) { for (let k = 1; k < 5; k++) { x.save(); x.globalAlpha = 0.15; x.translate(-Math.cos(b.dash.a) * k * 30, -Math.sin(b.dash.a) * k * 30); x.fillStyle = '#fff'; x.beginPath(); x.ellipse(0, Y, 40, 22, 0, 0, TAU); x.fill(); x.restore(); } }
    const fires = L0 ? 3 : 5, orb = k => { const a = t * 1.1 + k / fires * TAU; return [Math.cos(a) * 74, Y - 18 + Math.sin(a) * 24, Math.sin(a)]; };
    for (let k = 0; k < fires; k++) { const [fx, fy, d] = orb(k); if (d < 0) flame(x, fx, fy + Math.sin(t * 3 + k) * 4, 5.5, '110,190,255', '235,250,255', 0.85, Math.sin(t * 4 + k) * 0.2); }
    x.scale(dir, 1);
    // nueve colas esponjosas en abanico (las de atrás, un poco en sombra)
    for (let k = 0; k < 9; k++) tail(x, k, t, Y, L0);
    // patas de atrás
    for (const [lx, ph] of [[-27, 0], [-15, Math.PI * 0.6]]) leg(x, lx, Y + 8, t, ph, mv, 0.82);
    x.drawImage(kitBodyS(rev), -44, Y - 80, 136, 104);
    // patas de adelante
    for (const [lx, ph] of [[16, Math.PI], [28, Math.PI * 1.6]]) leg(x, lx, Y + 6, t, ph, mv, 1);
    // la joya del deseo (hōju) flota sobre el lomo
    { const jy = Y - 62 + Math.sin(t * 1.8) * 4, jx = -8; glow(x, jx, jy, 26, 'rgba(160,210,255,0.55)');
      x.drawImage(jewelS(), jx - 12, jy - 16, 24, 30);
      if (!L0) for (let k = 0; k < 3; k++) flame(x, jx + (k - 1) * 6, jy - 8 - (k === 1 ? 6 : 0) + Math.sin(t * 6 + k) * 1.5, 2.4, '255,200,120', '255,250,230', 0.8, (k - 1) * 0.4); }
    x.scale(dir, 1);
    for (let k = 0; k < fires; k++) { const [fx, fy, d] = orb(k); if (d >= 0) flame(x, fx, fy + Math.sin(t * 3 + k) * 4, 5.5, '110,190,255', '235,250,255', 0.9, Math.sin(t * 4 + k) * 0.2); }
    if (rev) glow(x, 0, Y - 10, 90, 'rgba(255,240,170,0.6)');
    if (b.flash > 0) { x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(255,250,235,${Math.min(0.7, b.flash * 5)})`; x.beginPath(); x.ellipse(0, Y - 10, 60, 40, 0, 0, TAU); x.fill(); }
    x.restore();
  }
  function kitBody(x, Y, rev, t) {
    // cuerpo: lomo, pecho y anca, pelo blanco con su sombra
    x.beginPath(); x.moveTo(-36, Y + 2); x.bezierCurveTo(-38, Y - 14, -18, Y - 20, 2, Y - 16); x.bezierCurveTo(14, Y - 14, 22, Y - 22, 27, Y - 32); x.lineTo(40, Y - 18);
    x.bezierCurveTo(41, Y - 2, 34, Y + 10, 22, Y + 12); x.bezierCurveTo(8, Y + 16, -12, Y + 16, -24, Y + 14); x.bezierCurveTo(-32, Y + 14, -36, Y + 10, -36, Y + 2); x.closePath();
    x.fillStyle = lg(x, 0, Y - 24, 0, Y + 16, '#ffffff', '#f8f2e8', '#ddd0bf'); x.fill(); tex(x, FUR(x), 0.85); shade(x, 0, Y - 6, 0, Y + 16, 0.22); ink(x, 1.6, 0.85);
    // marcas bermellón: llamas en el anca, raya en el hombro y puntos de oro
    x.fillStyle = '#d8382a'; for (const [ox, h0] of [[-30, 12], [-23, 17], [-15, 12]]) { x.beginPath(); x.moveTo(ox, Y + 11); x.bezierCurveTo(ox - 4, Y + 4, ox - 2, Y + 4 - h0 * 0.5, ox - 7, Y + 9 - h0); x.bezierCurveTo(ox + 1, Y + 6 - h0 * 0.6, ox + 5, Y + 3, ox + 5, Y + 11); x.closePath(); x.fill(); }
    x.strokeStyle = '#d8382a'; x.lineWidth = 1.8; curl(x, -20, Y + 3, 6.5, 1.15, -1); x.stroke();
    x.lineWidth = 2.6; x.beginPath(); x.moveTo(14, Y - 14); x.quadraticCurveTo(22, Y - 4, 20, Y + 9); x.stroke();
    x.fillStyle = '#e8b030'; for (const [gx, gy] of [[-6, Y - 10], [0, Y - 12], [6, Y - 10]]) { x.beginPath(); x.arc(gx, gy, 1.6, 0, TAU); x.fill(); }
    // collar: cuerda sagrada (shimenawa) roja y blanca, papel zigzag (shide) y cascabel de oro
    const rope = [[22, Y - 22], [28, Y - 16], [35, Y - 13], [41, Y - 16]];
    x.lineCap = 'round'; x.strokeStyle = INK; x.lineWidth = 6.5; x.beginPath(); rope.forEach(([a, c], k) => k ? x.lineTo(a, c) : x.moveTo(a, c)); x.stroke();
    for (let k = 0; k < rope.length - 1; k++) { const [a0, c0] = rope[k], [a1, c1] = rope[k + 1]; for (let j = 0; j < 3; j++) { const u0 = j / 3, u1 = (j + 0.6) / 3; x.strokeStyle = (k + j) % 2 ? '#f4ece0' : '#c8281e'; x.lineWidth = 4.5; x.beginPath(); x.moveTo(a0 + (a1 - a0) * u0, c0 + (c1 - c0) * u0); x.lineTo(a0 + (a1 - a0) * u1, c0 + (c1 - c0) * u1); x.stroke(); } }
    { const sw = Math.sin(t * 3) * 2; x.beginPath(); x.moveTo(26, Y - 16); x.lineTo(30 + sw, Y - 10); x.lineTo(25 + sw, Y - 8); x.lineTo(29 + sw, Y - 2); x.lineTo(25 + sw, Y); x.lineTo(28 + sw, Y + 5); x.fillStyle = '#fffdf6'; x.fill(); ink(x, 0.8, 0.6); }
    x.beginPath(); x.arc(36, Y - 8, 4.2, 0, TAU); x.fillStyle = rg(x, 34.5, Y - 9.5, 0.5, 4.5, '#fff6c0', '#e8b030', '#8a5a10'); x.fill(); ink(x, 1, 0.8); x.strokeStyle = 'rgba(60,30,0,0.8)'; x.lineWidth = 1; x.beginPath(); x.moveTo(33.5, Y - 7); x.lineTo(38.5, Y - 7); x.stroke();
    // cabeza: hocico largo y fino, orejas altas de forro rojo, marcas de kumadori y ojos de oro
    foxHead(x, t, Y, rev);
  }
  function kitBodyS(rev) { const k = 'kb' + (rev ? 1 : 0); if (SPR[k]) return SPR[k]; const c = mkc(272, 208), q = c.getContext('2d'); q.scale(2, 2); q.translate(44, 80); kitBody(q, 0, rev, 0); return (SPR[k] = c); }
  function jewelS() { if (SPR.jw) return SPR.jw; const c = mkc(48, 60), x = c.getContext('2d'); x.scale(2, 2); const jx = 12, jy = 16;
    x.beginPath(); x.moveTo(jx, jy - 13); x.bezierCurveTo(jx + 4, jy - 8, jx + 9, jy - 4, jx + 8, jy + 2); x.arc(jx, jy + 2, 8, 0, Math.PI); x.bezierCurveTo(jx - 9, jy - 4, jx - 4, jy - 8, jx, jy - 13); x.closePath();
    x.fillStyle = rg(x, jx - 2, jy - 1, 0.5, 10, '#ffffff', '#cfe8ff', '#6aa0d8'); x.fill(); ink(x, 1.1, 0.7); x.strokeStyle = 'rgba(232,176,48,0.9)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(jx - 6, jy + 6); x.quadraticCurveTo(jx, jy + 2, jx + 6, jy + 6); x.stroke();
    return (SPR.jw = c); }
  // una cola esponjosa, pintada una vez (de frente y en sombra) y puesta girada y estirada en cada cuadro
  const TL = 80, TCU = 0.12;
  function tailS(back) { const k = 'tl' + (back ? 1 : 0); if (SPR[k]) return SPR[k]; const c = mkc(196, 128), x = c.getContext('2d'); x.scale(2, 2); x.translate(6, 30);
    const w = 19, P = (s2, o) => [TL * s2, o + TCU * TL * s2 * s2];
    const b0 = P(0, -w * 0.3), m0 = P(0.62, -w), tip = P(1.05, 0), m1 = P(0.62, w), b1 = P(0, w * 0.3), q0 = P(0.3, -w * 0.85), q1 = P(0.3, w * 0.85), c0 = P(0.95, -w * 0.8), c1 = P(0.95, w * 0.8);
    x.beginPath(); x.moveTo(b0[0], b0[1]); x.quadraticCurveTo(q0[0], q0[1], m0[0], m0[1]); x.quadraticCurveTo(c0[0], c0[1], tip[0], tip[1]); x.quadraticCurveTo(c1[0], c1[1], m1[0], m1[1]); x.quadraticCurveTo(q1[0], q1[1], b1[0], b1[1]); x.closePath();
    x.fillStyle = lg(x, 0, 0, tip[0], tip[1], '#efe6d8', '#ffffff', '#fffaf2', '#ffd890', '#e8583a'); x.fill(); tex(x, FUR(x), 0.5);
    if (back) { x.fillStyle = 'rgba(110,90,80,0.14)'; x.fill(); } ink(x, 1.1, 0.5);
    x.strokeStyle = 'rgba(200,180,160,0.45)'; x.lineWidth = 0.8; for (const f of [-0.5, 0.5]) { const p0 = P(0.3, w * f * 0.5), p1 = P(0.86, w * f * 0.7), pm = P(0.6, w * f); x.beginPath(); x.moveTo(p0[0], p0[1]); x.quadraticCurveTo(pm[0], pm[1], p1[0], p1[1]); x.stroke(); }
    return (SPR[k] = c); }
  function tail(x, k, t, Y, L0) {
    const u = k / 8, a = -2.62 + u * 1.22 + Math.sin(t * 1.7 + k * 0.7) * 0.07, L = 66 + Math.sin(u * Math.PI) * 18 + Math.sin(t * 1.7 + k) * 2, bx = -26, by = Y - 2, sg = u < 0.5 ? -1 : 1, sx = L / TL;
    x.save(); x.translate(bx, by); x.rotate(a); x.scale(sx, sg); x.drawImage(tailS(k < 4), -6, -30, 98, 64); x.restore();
    const tx = TL * 1.05 * sx, ty = sg * TCU * TL * 1.1, ca = Math.cos(a), sa = Math.sin(a);
    if (!L0 || k % 2) flame(x, bx + ca * tx - sa * ty, by + sa * tx + ca * ty - 2, 3.6 + 0.8 * Math.sin(t * 9 + k), '120,200,255', '240,250,255', 0.8, a + Math.PI / 2);
  }
  function leg(x, lx, ly, t, ph, mv, sh) {
    const hind = sh < 1, sw = Math.sin(t * 9 + ph) * 7 * mv, kx = lx + sw * 0.5 + (hind ? -7 : 2), ky = ly + (hind ? 9 : 11), px = lx + sw + (hind ? -2 : 1), py = -2;
    const pts = [[lx, ly - 4], [kx, ky], [px, py - 6], [px + 1, py]];
    x.lineCap = 'round'; x.lineJoin = 'round';
    for (const [w, c] of [[10, INK], [7.6, hind ? '#e6dccb' : '#faf5ec']]) { x.strokeStyle = c; x.lineWidth = w; x.beginPath(); pts.forEach(([a, b], k) => k ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); }
    x.strokeStyle = hind ? '#2e2828' : '#3a3232'; x.lineWidth = 7.2; x.beginPath(); x.moveTo(px - 0.5, py - 8); x.lineTo(px + 1, py); x.stroke();
    x.strokeStyle = '#d8382a'; x.lineWidth = 2; x.beginPath(); x.moveTo(kx - 3.4, ky - 1); x.lineTo(kx + 3.4, ky - 1); x.stroke();
    x.fillStyle = '#2a2424'; x.beginPath(); x.ellipse(px + 2.5, py + 0.5, 5, 2.8, 0, 0, TAU); x.fill();
  }
  function foxHead(x, t, Y, rev) {
    const hx = 34, hy = Y - 38;
    // orejas (detrás de la cabeza): forro rojo con pelo
    for (const [ex, tilt] of [[-7, -0.15], [3, 0.12]]) { x.beginPath(); x.moveTo(hx + ex - 6, hy - 6); x.quadraticCurveTo(hx + ex - 6 + tilt * 20, hy - 24, hx + ex + tilt * 30, hy - 33); x.quadraticCurveTo(hx + ex + 7, hy - 20, hx + ex + 6, hy - 6); x.closePath(); x.fillStyle = lg(x, 0, hy - 30, 0, hy - 6, '#ffffff', '#efe4d4'); x.fill(); ink(x, 1.3, 0.85);
      x.beginPath(); x.moveTo(hx + ex - 2.5, hy - 8); x.quadraticCurveTo(hx + ex - 2 + tilt * 18, hy - 20, hx + ex + tilt * 27, hy - 28); x.quadraticCurveTo(hx + ex + 3.5, hy - 18, hx + ex + 2.5, hy - 8); x.closePath(); x.fillStyle = lg(x, 0, hy - 28, 0, hy - 8, '#e8583a', '#ffb090'); x.fill(); }
    // cabeza
    x.beginPath(); x.moveTo(hx - 13, hy + 10); x.bezierCurveTo(hx - 17, hy - 4, hx - 9, hy - 14, hx + 4, hy - 13); x.bezierCurveTo(hx + 14, hy - 12, hx + 24, hy - 4, hx + 34, hy + 3);
    x.quadraticCurveTo(hx + 37, hy + 6, hx + 32, hy + 8); x.bezierCurveTo(hx + 22, hy + 11, hx + 10, hy + 15, hx - 2, hy + 15); x.quadraticCurveTo(hx - 9, hy + 15, hx - 13, hy + 10); x.closePath();
    x.fillStyle = lg(x, 0, hy - 14, 0, hy + 15, '#ffffff', '#fbf6ee', '#e2d6c4'); x.fill(); tex(x, FUR(x), 0.6); shade(x, 0, hy + 2, 0, hy + 15, 0.2); ink(x, 1.5, 0.85);
    // mechones de la mejilla
    x.beginPath(); x.moveTo(hx - 12, hy + 6); x.lineTo(hx - 19, hy + 12); x.lineTo(hx - 10, hy + 11); x.lineTo(hx - 15, hy + 17); x.lineTo(hx - 5, hy + 14); x.lineTo(hx - 6, hy + 19); x.lineTo(hx + 2, hy + 14); x.closePath(); x.fillStyle = '#fbf6ee'; x.fill(); ink(x, 0.9, 0.6);
    // kumadori: trazo rojo que nace del ojo y se va hacia la oreja, y otro bajo el ojo
    brush(x, [[hx + 16, hy - 3], [hx + 6, hy - 8], [hx - 6, hy - 10]], 4.2, '#d8382a', 0.95, 0.2);
    brush(x, [[hx + 14, hy + 1], [hx + 4, hy + 3], [hx - 6, hy + 1]], 3, '#d8382a', 0.9, 0.2);
    x.fillStyle = '#d8382a'; x.beginPath(); x.moveTo(hx + 2, hy - 13); x.quadraticCurveTo(hx + 5, hy - 9, hx + 2, hy - 6); x.quadraticCurveTo(hx - 1, hy - 9, hx + 2, hy - 13); x.fill();
    // ojo de oro rasgado, con brillo
    x.save(); x.translate(hx + 11, hy - 3); x.rotate(0.18); x.beginPath(); x.moveTo(-5, 0); x.quadraticCurveTo(0, -3.6, 5.5, -0.5); x.quadraticCurveTo(0, 2.6, -5, 0); x.closePath(); x.fillStyle = rev ? '#fff8c0' : '#f2c040'; x.fill(); ink(x, 1.1, 0.9);
    x.fillStyle = INK; x.beginPath(); x.ellipse(0.8, -0.4, 1, 2.2, 0, 0, TAU); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(2.2, -1.4, 0.8, 0, TAU); x.fill(); x.restore();
    glow(x, hx + 11, hy - 3, 9, rev ? 'rgba(255,240,170,0.8)' : 'rgba(255,200,80,0.5)');
    // nariz, boca y bigotes
    x.fillStyle = INK; x.beginPath(); x.ellipse(hx + 33, hy + 4.5, 2.6, 2, 0, 0, TAU); x.fill();
    x.strokeStyle = `rgba(${IR},0.75)`; x.lineWidth = 1; x.beginPath(); x.moveTo(hx + 31, hy + 8); x.quadraticCurveTo(hx + 22, hy + 11, hx + 14, hy + 9); x.stroke();
    x.strokeStyle = 'rgba(80,60,50,0.5)'; x.lineWidth = 0.7; for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(hx + 27, hy + 5 + k); x.quadraticCurveTo(hx + 40, hy + 2 + k * 3, hx + 50, hy + 6 + k * 5 + Math.sin(t * 2 + k) * 1.5); x.stroke(); }
  }

  /* =================== RAIJIN Y FUJIN =================== */
  // nube de buen agüero: capa de atrás, capa del frente con borde dorado y rizos, y colas que se estiran
  function cloud(x, w, h, t, dark) { const k = 'cl' + w + h + (dark ? 'd' : ''), Z = 2, W = Math.ceil(w * 1.7 + 30), Hh = Math.ceil(h * 3.4);
    if (!SPR[k]) { const c = mkc(W * Z, Hh * Z), q = c.getContext('2d'); q.scale(Z, Z); q.translate(W / 2, Hh * 0.52); cloudDraw(q, w, h, 0, dark); SPR[k] = c; }
    x.drawImage(SPR[k], -W / 2, -Hh * 0.52 + Math.sin(t * 1.6) * 1.5, W, Hh); }
  function cloudDraw(x, w, h, t, dark) {
    const back = dark ? ['#c8c8d4', '#7a7a8c'] : ['#f0dcae', '#b88a40'], front = dark ? ['#ececf2', '#9a9aac'] : ['#fffdf6', '#f2e0b4', '#d8b070'], rim = dark ? 'rgba(140,140,160,0.9)' : 'rgba(196,140,40,0.95)';
    for (const s of [-1, 1]) { const sw = Math.sin(t * 1.4 + s) * 4; x.beginPath(); x.moveTo(s * w * 0.4, h * 0.25); x.bezierCurveTo(s * w * 0.58, h * 0.5, s * w * 0.78, h * 0.05 + sw, s * w * 0.68, -h * 0.25); x.bezierCurveTo(s * w * 0.62, -h * 0.5, s * w * 0.5, -h * 0.1, s * w * 0.56, h * 0.05); x.lineWidth = h * 0.42; x.strokeStyle = back[0]; x.lineCap = 'round'; x.stroke(); x.lineWidth = 1.6; x.strokeStyle = rim; x.stroke(); }
    for (let k = 0; k < 5; k++) { const cx = -w * 0.4 + k * w * 0.2, cy = -h * 0.35 + Math.sin(t * 1.6 + k) * 2, r = h * (0.78 + (k % 2) * 0.22); x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fillStyle = rg(x, cx - r * 0.3, cy - r * 0.4, 1, r, back[0], back[1]); x.fill(); ink(x, 1.1, 0.5); }
    for (let k = 0; k < 6; k++) { const cx = -w / 2 + 10 + k * (w - 20) / 5, cy = Math.sin(t * 2 + k) * 2, r = h * (0.66 + (k % 2) * 0.26);
      x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fillStyle = rg(x, cx - r * 0.35, cy - r * 0.45, 1, r * 1.05, front[0], front[1], front[2] || front[1]); x.fill(); ink(x, 1.2, 0.6);
      x.strokeStyle = rim; x.lineWidth = 1.5; x.beginPath(); x.arc(cx, cy, r - 2.5, Math.PI * 1.05, Math.PI * 1.75); x.stroke();
      if (k % 2) { x.lineWidth = 1.4; curl(x, cx + r * 0.1, cy + r * 0.15, r * 0.42, 1.2, k % 4 ? 1 : -1); x.stroke(); } }
    x.beginPath(); x.ellipse(0, h * 0.55, w * 0.42, h * 0.22, 0, 0, TAU); x.fillStyle = dark ? 'rgba(90,90,110,0.35)' : 'rgba(170,120,50,0.28)'; x.fill();
  }
  function drumS() { if (SPR.drum) return SPR.drum; const c = mkc(68, 52), x = c.getContext('2d'); x.scale(2, 2); x.translate(17, 12);
    x.beginPath(); x.ellipse(0, 3, 14, 8, 0, 0, TAU); x.fillStyle = lg(x, -14, 0, 14, 0, '#5a0e0a', '#b8281e', '#5a0e0a'); x.fill(); ink(x, 1.3, 0.8);
    x.beginPath(); x.ellipse(0, -1, 13, 8, 0, 0, TAU); x.fillStyle = rg(x, -3, -3, 1, 13, '#fff8ea', '#f0dfc0', '#c8b088'); x.fill(); ink(x, 1.3, 0.85);
    x.save(); x.scale(1, 8 / 13); ArtW3B.tomoe(x, 0, -1.6, 9, INK); x.restore();
    x.fillStyle = '#e8b030'; for (let j = 0; j < 7; j++) { const q = j / 7 * TAU; x.beginPath(); x.arc(Math.cos(q) * 12, 3 + Math.sin(q) * 6.5, 0.9, 0, TAU); x.fill(); }
    return (SPR.drum = c); }
  // el torso (con su taparrabo) y la cabeza de cada dios se pintan una vez
  const SKIN = R => R ? ['#fbf8ff', '#d6cce6', '#a898c0'] : ['#a8dc90', '#5aa85a', '#2e6a36'];
  function godTorsoS(R) { const k = 'gt' + (R ? 1 : 0); if (SPR[k]) return SPR[k]; const c = mkc(144, 160), x = c.getContext('2d'); x.scale(2, 2); x.translate(36, 40); const skin = SKIN(R);
    // cuerpo musculoso con su sombra
    x.beginPath(); x.moveTo(-30, -24); x.bezierCurveTo(-34, -4, -28, 18, -22, 26); x.lineTo(22, 26); x.bezierCurveTo(28, 18, 34, -4, 30, -24); x.quadraticCurveTo(0, -36, -30, -24); x.closePath();
    x.fillStyle = lg(x, 0, -34, 0, 26, skin[0], skin[1]); x.fill(); { x.save(); x.clip(); x.fillStyle = rg(x, 6, -10, 4, 40, 'rgba(0,0,0,0)', `rgba(${rgb(skin[2])},0.55)`); x.fillRect(-40, -40, 80, 70); x.restore(); } ink(x, 2, 0.9);
    x.strokeStyle = `rgba(${rgb(skin[2])},0.75)`; x.lineWidth = 1.4; x.beginPath(); x.moveTo(-16, -18); x.quadraticCurveTo(-6, -10, 0, -16); x.quadraticCurveTo(6, -10, 16, -18); x.stroke();
    for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(-6, -4 + k * 8); x.quadraticCurveTo(0, -1 + k * 8, 6, -4 + k * 8); x.stroke(); } x.beginPath(); x.moveTo(0, -12); x.lineTo(0, 18); x.stroke();
    // taparrabo de piel de tigre con flecos y cinturón de cuerda dorada
    x.beginPath(); x.moveTo(-28, 10); x.lineTo(28, 10); x.lineTo(24, 30); for (let k = 0; k <= 8; k++) x.lineTo(24 - k * 6, 30 + (k % 2 ? 6 : 0)); x.closePath();
    x.fillStyle = '#e8a030'; x.fill(); tex(x, TIGER(x), 1); shade(x, 0, 10, 0, 36, 0.25); ink(x, 1.6, 0.9);
    x.strokeStyle = INK; x.lineWidth = 5; x.beginPath(); x.moveTo(-29, 10); x.quadraticCurveTo(0, 14, 29, 10); x.stroke(); x.strokeStyle = '#e8c050'; x.lineWidth = 3.2; x.stroke(); x.strokeStyle = 'rgba(120,70,10,0.7)'; x.lineWidth = 1; x.setLineDash([3, 3]); x.stroke(); x.setLineDash([]);
    return (SPR[k] = c); }
  function godHeadS(R) { const k = 'gh' + (R ? 1 : 0); if (SPR[k]) return SPR[k]; const c = mkc(208, 160), x = c.getContext('2d'); x.scale(2, 2); x.translate(52, 104); const skin = SKIN(R), t = 0;
    // cabeza de oni: melena salvaje de pinceladas, cuernos, cejas fieras, ojos de oro y colmillos
    const hy = -48, hair = R ? ['#2a1e38', '#5a4878'] : ['#a8281e', '#ff7a40'];
    for (let k = 0; k < 13; k++) { const a = -Math.PI * 1.02 + k / 12 * Math.PI * 1.04, Lh = 22 + (k % 3) * 7 + Math.sin(k * 2.3) * 4, sw = Math.sin(t * 4 + k) * 3;
      brush(x, [[Math.cos(a) * 12, hy + Math.sin(a) * 12], [Math.cos(a) * (12 + Lh * 0.55) + sw, hy + Math.sin(a) * (12 + Lh * 0.55)], [Math.cos(a + 0.15) * (12 + Lh) + sw * 1.5, hy + Math.sin(a + 0.15) * (12 + Lh)]], 9, k % 2 ? hair[0] : hair[1], 0.95, 0.35); }
    if (R) for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * 6, hy - 14); x.quadraticCurveTo(s * 14, hy - 30, s * 6, hy - 38); x.quadraticCurveTo(s * 8, hy - 26, s * 1, hy - 15); x.closePath(); x.fillStyle = lg(x, 0, hy - 38, 0, hy - 14, '#fffbe8', '#d8c090'); x.fill(); ink(x, 1.1, 0.9); x.strokeStyle = 'rgba(140,100,40,0.6)'; x.lineWidth = 0.8; for (let j = 1; j < 4; j++) { x.beginPath(); x.moveTo(s * (3 + j), hy - 15 - j * 5); x.lineTo(s * (8 + j), hy - 16 - j * 5); x.stroke(); } }
    x.beginPath(); x.moveTo(-17, hy - 4); x.bezierCurveTo(-18, hy - 20, 18, hy - 20, 17, hy - 4); x.bezierCurveTo(18, hy + 10, 10, hy + 18, 0, hy + 18); x.bezierCurveTo(-10, hy + 18, -18, hy + 10, -17, hy - 4); x.closePath();
    x.fillStyle = lg(x, 0, hy - 18, 0, hy + 18, skin[0], skin[1]); x.fill(); shade(x, 0, hy, 0, hy + 18, 0.25); ink(x, 1.8, 0.95);
    for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * 16, hy - 4); x.lineTo(s * 24, hy - 10); x.lineTo(s * 18, hy + 4); x.closePath(); x.fillStyle = skin[1]; x.fill(); ink(x, 1, 0.8); }
    x.fillStyle = INK; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * 2, hy - 7); x.lineTo(s * 14, hy - 12); x.lineTo(s * 13, hy - 8); x.lineTo(s * 3, hy - 4); x.closePath(); x.fill(); }
    for (const s of [-1, 1]) { x.beginPath(); x.ellipse(s * 7 + 2, hy - 2, 4.6, 3.6, 0, 0, TAU); x.fillStyle = '#ffe060'; x.fill(); ink(x, 1, 0.9); x.fillStyle = INK; x.beginPath(); x.arc(s * 7 + 3, hy - 2, 1.7, 0, TAU); x.fill(); glow(x, s * 7 + 2, hy - 2, 8, R ? 'rgba(220,190,255,0.6)' : 'rgba(255,220,120,0.6)'); }
    x.fillStyle = skin[2]; x.beginPath(); x.ellipse(2, hy + 4, 4.5, 3, 0, 0, TAU); x.fill();
    x.beginPath(); x.moveTo(-8, hy + 9); x.quadraticCurveTo(3, hy + 7, 12, hy + 9); x.quadraticCurveTo(10, hy + 17, 2, hy + 17); x.quadraticCurveTo(-6, hy + 17, -8, hy + 9); x.closePath(); x.fillStyle = '#6a1210'; x.fill(); ink(x, 1.1, 0.9);
    x.fillStyle = '#fffbe8'; for (const s of [-6, 9]) { x.beginPath(); x.moveTo(s - 1.6, hy + 16); x.lineTo(s, hy + 8.5); x.lineTo(s + 1.6, hy + 16); x.closePath(); x.fill(); }
    return (SPR[k] = c); }
  function god(x, G, b) {
    const t = G.time, R = b.w3boss === 'raijin', Y = -70 + Math.sin(t * 1.8 + (R ? 0 : 2)) * 6, dn = b.down, dir = R ? 1 : -1, cs = G.cs || {}, L0 = lo();
    ArtW3B.warn(x, G, b);
    if (R && b.mark) for (const [mx, my] of b.mark) { x.save(); x.translate(mx, my); const p = 0.5 + 0.5 * Math.sin(t * 10); x.strokeStyle = `rgba(200,160,255,${0.5 + p * 0.5})`; x.lineWidth = 3; x.beginPath(); x.ellipse(0, 0, 58, 32, 0, 0, TAU); x.stroke(); ArtW3B.tomoe(x, 0, 0, 16, `rgba(200,160,255,${0.6 + p * 0.4})`); x.restore(); }
    x.save(); x.translate(b.x, b.y); shadow(x, 0, 6, 86, dn ? 0.2 : 0.35); x.scale(1.45, 1.45);
    if (dn) { x.globalAlpha = 0.65; cloud(x, 120, 26, t, true); x.globalAlpha = 1; const f = b.downT / 12; x.strokeStyle = '#ffe9a0'; x.lineWidth = 5; x.beginPath(); x.arc(0, -60, 30, -Math.PI / 2, -Math.PI / 2 + f * TAU); x.stroke(); x.font = fontB(18, 900); x.textAlign = 'center'; x.fillStyle = '#fff'; x.strokeStyle = INK; x.lineWidth = 4; x.strokeText(Math.ceil(b.downT), 0, -53); x.fillText(Math.ceil(b.downT), 0, -53); x.restore(); return; }
    x.translate(0, Y + 40); cloud(x, 136, 26, t, false); x.translate(0, -40);
    x.scale(dir, 1);
    const hit = R ? Math.max(0, 1 - ((cs.beatT || 0) * (cs.bpm || 108) / 60)) : 0, skin = R ? ['#fbf8ff', '#d6cce6', '#a898c0'] : ['#a8dc90', '#5aa85a', '#2e6a36'];
    // el chal celeste (hagoromo) que da la vuelta por encima
    { const c = R ? ['#3a6ab8', '#9fd0ff'] : ['#b8322a', '#ffb070'], sw = Math.sin(t * 2.4) * 8;
      const rib = (pts, w) => { x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); x.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]); x.lineCap = 'round'; x.strokeStyle = INK; x.lineWidth = w + 2.5; x.stroke(); x.strokeStyle = lg(x, pts[0][0], pts[0][1], pts[3][0], pts[3][1], c[0], c[1], c[0]); x.lineWidth = w; x.stroke(); x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = 1; x.stroke(); };
      rib([[-24, -12], [-70, -60 + sw], [40, -120 - sw], [64, -40]], 7); rib([[24, -10], [62, 10], [78, -10 + sw], [96, 20 - sw * 0.5]], 6); }
    if (R) { // aro de tambores del trueno detrás, con rayos que saltan al golpe
      x.lineCap = 'round'; x.strokeStyle = INK; x.lineWidth = 9; x.beginPath(); x.arc(0, -10, 72, Math.PI * 1.02, Math.PI * 1.98); x.stroke(); x.strokeStyle = '#8a1a14'; x.lineWidth = 6; x.stroke(); x.strokeStyle = '#e8b030'; x.lineWidth = 1.4; x.beginPath(); x.arc(0, -10, 72, Math.PI * 1.02, Math.PI * 1.98); x.stroke();
      const bi = Math.floor((G.time || 0) * (cs.bpm || 108) / 60) % 8;
      for (let k = 0; k < 8; k++) { const a = Math.PI * (1.05 + k / 7 * 0.9), dx = Math.cos(a) * 74, dy = Math.sin(a) * 66 - 10; x.save(); x.translate(dx, dy); x.rotate(a + Math.PI / 2);
        x.drawImage(drumS(), -17, -12, 34, 26);
        x.restore(); if (k === bi && hit > 0.25) glow(x, dx, dy, 22 + hit * 18, `rgba(200,170,255,${0.4 + hit * 0.5})`); }
      if (hit > 0.35 && !L0) { x.save(); x.globalCompositeOperation = 'lighter'; const sd = Math.floor(t * 12); for (let j = 0; j < 2; j++) { const a1 = Math.PI * (1.05 + ((bi + j * 3) % 8) / 7 * 0.9), a2 = Math.PI * (1.05 + ((bi + 2 + j * 3) % 8) / 7 * 0.9); zap(x, Math.cos(a1) * 74, Math.sin(a1) * 66 - 10, Math.cos(a2) * 74, Math.sin(a2) * 66 - 10, sd + j, 18, `rgba(210,190,255,${hit})`, 2.2); zap(x, Math.cos(a1) * 74, Math.sin(a1) * 66 - 10, Math.cos(a2) * 74, Math.sin(a2) * 66 - 10, sd + j, 18, `rgba(255,255,255,${hit})`, 0.9); } x.restore(); }
    } else { // el saco de viento de Fujin: tela blanca con remolinos y viento que se escapa
      const sw = Math.sin(t * 3) * 10;
      x.beginPath(); x.moveTo(-30, -40); x.bezierCurveTo(-78, -116 + sw, 42, -160 - sw, 74, -70); x.bezierCurveTo(52, -112 + sw, -20, -102, -10, -40); x.closePath();
      x.fillStyle = lg(x, -60, -150, 60, -40, '#ffffff', '#eef2f4', '#b8c8d0'); x.fill(); shade(x, 0, -130, 20, -40, 0.25); ink(x, 2, 0.9);
      x.save(); x.clip(); x.strokeStyle = 'rgba(46,110,130,0.55)'; x.lineWidth = 2; for (const [cx2, cy2, r2] of [[-30, -88, 14], [8, -112, 16], [40, -82, 12], [-8, -66, 10]]) { curl(x, cx2 + sw * 0.2, cy2, r2, 1.4, 1); x.stroke(); } x.restore();
      x.strokeStyle = '#2e6a36'; x.lineWidth = 4; x.beginPath(); x.moveTo(60, -74); x.quadraticCurveTo(68, -64, 74, -70); x.stroke();
      x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; for (let k = 0; k < (L0 ? 3 : 6); k++) { const p = (t * 1.3 + k / 6) % 1, len = 40 + p * 60; x.strokeStyle = `rgba(230,245,255,${(1 - p) * 0.8})`; x.lineWidth = 2.4 * (1 - p) + 0.6; x.beginPath(); x.moveTo(74 + p * 50, -70 + (k - 3) * 6); x.quadraticCurveTo(74 + p * 50 + len * 0.5, -70 + (k - 3) * 9 - 14 * Math.sin(t * 3 + k), 74 + p * 50 + len, -70 + (k - 3) * 11); x.stroke(); } x.restore();
    }
    x.drawImage(godTorsoS(R), -36, -40, 72, 80);
    // brazos: hombro, antebrazo, brazalete de oro y puño (Raijin con baquetas que golpean al compás)
    for (const s of [-1, 1]) { const ax = s * 42, ay = -18 - hit * 10, ex = s * 36, ey = -26;
      for (const [w, c] of [[12, INK], [9.5, skin[1]], [3, `rgba(255,255,255,0.35)`]]) { x.strokeStyle = c; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); x.moveTo(s * 24, -20); x.quadraticCurveTo(ex, ey - 4, ax, ay); x.stroke(); }
      x.strokeStyle = '#e8b030'; x.lineWidth = 3; x.beginPath(); x.arc(ax - s * 4, ay + 1, 5, 0, TAU); x.stroke();
      x.beginPath(); x.arc(ax, ay, 5.2, 0, TAU); x.fillStyle = skin[0]; x.fill(); ink(x, 1.3, 0.9);
      if (R) { x.strokeStyle = INK; x.lineWidth = 5.5; x.lineCap = 'round'; x.beginPath(); x.moveTo(ax, ay); x.lineTo(ax + s * 24, ay - 24 + hit * 18); x.stroke(); x.strokeStyle = '#a8703a'; x.lineWidth = 3.6; x.stroke();
        x.beginPath(); x.arc(ax + s * 24, ay - 24 + hit * 18, 4.4, 0, TAU); x.fillStyle = '#f0d890'; x.fill(); ink(x, 1, 0.8); if (hit > 0.3) glow(x, ax + s * 24, ay - 24 + hit * 18, 12 + hit * 12, `rgba(220,200,255,${hit * 0.8})`); } }
    x.drawImage(godHeadS(R), -52, -104, 104, 80);
    // aura: chispas de trueno (Raijin) o remolinos de viento (Fujin)
    if (!L0) { x.save(); x.globalCompositeOperation = 'lighter';
      if (R) { const sd = Math.floor(t * 9); for (let j = 0; j < 2; j++) { const a = H(sd, j) * TAU, r0 = 34; zap(x, Math.cos(a) * r0, -10 + Math.sin(a) * r0, Math.cos(a) * (r0 + 22), -10 + Math.sin(a) * (r0 + 22), sd + j * 3, 10, 'rgba(200,180,255,0.75)', 1.4); } }
      else { x.lineCap = 'round'; for (let j = 0; j < 4; j++) { const a = t * 2.2 + j / 4 * TAU; x.strokeStyle = `rgba(235,250,255,${0.35 + 0.25 * Math.sin(t * 3 + j)})`; x.lineWidth = 2; x.beginPath(); x.arc(0, -10, 50 + j * 4, a, a + 0.9); x.stroke(); } }
      x.restore(); }
    if (cs.beat0 != null && R) glow(x, 0, -10, 40 + hit * 40, `rgba(200,160,255,${0.25 + hit * 0.4})`);
    if (b.flash > 0) { x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(255,250,235,${Math.min(0.7, b.flash * 5)})`; x.beginPath(); x.ellipse(0, -20, 50, 60, 0, 0, TAU); x.fill(); }
    x.restore();
    // el lazo que los protege (si están cerca)
    const o = (G.units || []).find(u => u.alive && !u.down && u !== b && (u.w3boss === 'raijin' || u.w3boss === 'fujin'));
    if (R && o && hypot(o.x - b.x, o.y - b.y) < 330) { x.save(); x.globalCompositeOperation = 'lighter'; const sd = Math.floor(t * 20); zap(x, b.x, b.y - 60, o.x, o.y - 60, sd, 26, `rgba(170,150,255,${0.45 + 0.25 * Math.sin(t * 20)})`, 5); zap(x, b.x, b.y - 60, o.x, o.y - 60, sd, 26, 'rgba(255,255,255,0.85)', 1.6); x.restore(); }
  }

  /* =================== OROCHI =================== */
  const OSC = x => SCALES(x, 'oro', '#4a5a34', '#8a9a5c', '#1c2414');
  // las del cuerpo, más grandes y de borde suave (si no, el cuerpo parece una malla)
  const OSCB = x => pat(x, 'oscb', 56, 28, (q, w, h) => { q.fillStyle = '#1e2816'; q.fillRect(0, 0, w, h); const s2 = 28; for (let r = -1; r <= 2; r++) for (let k = -1; k <= 2; k++) { const X = k * s2 + (r % 2 ? s2 / 2 : 0), Y = r * 14; const g = q.createRadialGradient(X - 4, Y + 3, 1, X, Y + 6, s2 * 0.62); g.addColorStop(0, '#6a7a48'); g.addColorStop(0.55, '#3a4a2a'); g.addColorStop(1, '#1a2212'); q.fillStyle = g; q.beginPath(); q.moveTo(X - s2 / 2, Y); q.quadraticCurveTo(X - s2 / 2, Y + 15, X, Y + 18); q.quadraticCurveTo(X + s2 / 2, Y + 15, X + s2 / 2, Y); q.closePath(); q.fill(); q.strokeStyle = 'rgba(10,14,6,0.35)'; q.lineWidth = 1; q.stroke(); } });
  // cuello de serpiente: tinta, escamas, panza clara y brillo de arriba
  function neck(x, pts, w, a) { x.save(); x.globalAlpha *= a; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); x.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]); x.lineCap = 'round'; x.lineJoin = 'round';
    x.strokeStyle = INK; x.lineWidth = w + 6; x.stroke(); x.strokeStyle = OSC(x); x.lineWidth = w; x.stroke();
    x.save(); x.translate(3, 5); x.strokeStyle = 'rgba(200,170,120,0.55)'; x.lineWidth = w * 0.3; x.setLineDash([5, 4]); x.stroke(); x.setLineDash([]); x.restore();
    x.save(); x.translate(-3, -6); x.strokeStyle = 'rgba(220,240,170,0.22)'; x.lineWidth = w * 0.16; x.stroke(); x.restore(); x.restore(); }
  const COILS = [[-170, 20, 160, 66], [150, 14, 170, 70], [0, -30, 220, 86], [-80, -96, 150, 58], [90, -104, 132, 52], [0, -150, 100, 40]];
  // el cuerpo quieto (anillos, panza, musgo, cedros y la cola) se pinta una vez
  function orochiBody() {
    if (SPR.oro) return SPR.oro; const Z = 1.25, X0 = -350, Y0 = -240, W = 820, Hh = 370, c = mkc(W * Z, Hh * Z), x = c.getContext('2d'); x.scale(Z, Z); x.translate(-X0, -Y0);
    neck(x, [[200, 20], [300, 80], [360, 40], [414, 96]], 32, 1);
    for (const [cx, cy, rx, ry] of COILS) {
      x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, TAU); x.fillStyle = '#26301c'; x.fill(); tex(x, OSCB(x), 0.8);
      x.save(); x.clip(); x.fillStyle = rg(x, cx - rx * 0.15, cy - ry * 0.55, ry * 0.2, rx * 1.05, 'rgba(210,230,160,0.26)', 'rgba(0,0,0,0)', 'rgba(4,6,2,0.62)'); x.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
      x.lineCap = 'butt'; x.strokeStyle = 'rgba(170,36,26,0.78)'; x.lineWidth = ry * 0.26; x.beginPath(); x.ellipse(cx, cy, rx - ry * 0.1, ry * 0.9, 0, Math.PI * 0.12, Math.PI * 0.88); x.stroke();
      x.strokeStyle = 'rgba(60,8,6,0.6)'; x.lineWidth = 1.2; for (let k = 1; k < 12; k++) { const a = Math.PI * (0.12 + k / 12 * 0.76), cc = Math.cos(a), sn = Math.sin(a); x.beginPath(); x.moveTo(cx + cc * (rx - ry * 0.24), cy + sn * ry * 0.76); x.lineTo(cx + cc * (rx + 2), cy + sn * (ry + 2)); x.stroke(); }
      x.restore();
      x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, TAU); ink(x, 3, 0.9);
      x.strokeStyle = 'rgba(220,240,170,0.28)'; x.lineWidth = 3; x.beginPath(); x.ellipse(cx, cy, rx - 7, ry - 7, 0, Math.PI * 1.12, Math.PI * 1.72); x.stroke(); }
    for (let k = 0; k < 9; k++) { const mx2 = -150 + k * 36 + H(k, 3) * 10, my2 = -170 + Math.abs(k - 4) * 10; x.globalAlpha = 0.75; x.drawImage(ArtInk.wash('60,90,40', 1), mx2 - 20, my2 - 6, 40, 14); x.globalAlpha = 1; }
    for (let k = 0; k < 6; k++) { const tx = -140 + k * 56, ty = -140 + Math.abs(k - 2.5) * 16;
      x.strokeStyle = INK; x.lineWidth = 6; x.lineCap = 'round'; x.beginPath(); x.moveTo(tx, ty + 6); x.lineTo(tx + 1, ty - 24); x.stroke(); x.strokeStyle = '#5a3a22'; x.lineWidth = 3.6; x.stroke();
      for (let j = 0; j < 3; j++) { const w = 18 - j * 4, yy = ty - 14 - j * 14; x.beginPath(); x.moveTo(tx - w, yy); x.quadraticCurveTo(tx, yy - 6, tx + w, yy); x.lineTo(tx + 1, yy - 22); x.closePath(); x.fillStyle = lg(x, tx - w, yy - 20, tx + w, yy, '#4a7a3a', '#22402a', '#0e1e14'); x.fill(); ink(x, 1.1, 0.7);
        x.strokeStyle = 'rgba(170,210,130,0.35)'; x.lineWidth = 1; x.beginPath(); x.moveTo(tx - w * 0.6, yy - 3); x.lineTo(tx - 2, yy - 16); x.stroke(); } }
    return (SPR.oro = c);
  }
  function orochi(x, G, b) {
    const t = G.time, HS = W3B.headsOf(G), L0 = lo();
    x.save(); x.translate(b.x, b.y);
    x.globalAlpha = 0.55; x.drawImage(ArtInk.wash('10,8,12', 1), -380, -70, 760, 220); x.globalAlpha = 1;
    for (const h of HS) { const dx = h.x - b.x, dy = h.y + (h.yOff || 0) - b.y, sx = clamp(dx * 0.25, -190, 190), sw = Math.sin(t * 1.3 + (h.hk || 0)) * 18;
      if (h.alive) neck(x, [[sx, -40], [sx + dx * 0.1 + sw, -200 - Math.abs(dx) * 0.05], [dx * 0.85 - sw, dy * 0.5 - 140], [dx, dy - 40]], 30, 1);
      else neck(x, [[sx, -20], [sx * 1.3, 30], [sx * 1.7, 70], [sx * 1.9, 100]], 26, 0.85); }
    x.drawImage(orochiBody(), -350, -240, 820, 370);
    // la panza roja late, y brilla la espada en la cola (la Kusanagi)
    { const p = 0.5 + 0.5 * Math.sin(t * 2); x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'butt';
      for (const [cx, cy, rx, ry] of COILS.slice(0, 2)) { x.strokeStyle = `rgba(255,90,50,${0.1 + p * 0.18})`; x.lineWidth = ry * 0.14; x.beginPath(); x.ellipse(cx, cy, rx - ry * 0.12, ry * 0.86, 0, Math.PI * 0.25, Math.PI * 0.75); x.stroke(); }
      const q = 0.5 + 0.5 * Math.sin(t * 3); x.fillStyle = `rgba(255,250,220,${0.3 + q * 0.5})`; x.beginPath(); x.ellipse(406, 92, 11, 3.4, 0.6, 0, TAU); x.fill(); x.restore(); glow(x, 406, 92, 22, `rgba(255,250,220,${0.25 + q * 0.3})`); }
    if (!L0) for (let k = 0; k < 4; k++) { const mxx = -260 + ((t * 18 + k * 160) % 560); x.globalAlpha = 0.18; x.drawImage(ArtInk.wash('230,230,240', 1), mxx - 90, 10 - k * 30, 180, 40); x.globalAlpha = 1; }
    x.restore();
  }
  // cresta de cada cabeza, según su elemento
  function crest(x, el, t, E) {
    const c1 = rgb(E.c1), c0 = rgb(E.c0);
    if (el === 'fire') { for (let k = 0; k < 6; k++) flame(x, -24 + k * 8, -24 - (k % 2) * 4, 4 + Math.sin(t * 8 + k) * 1, '255,140,40', '255,240,180', 0.95, -0.5 + k * 0.06); return; }
    if (el === 'water') { x.beginPath(); x.moveTo(-30, -16); x.quadraticCurveTo(-24, -44, 6, -26); x.lineTo(-2, -20); x.quadraticCurveTo(-18, -24, -30, -16); x.closePath(); x.fillStyle = `rgba(${c1},0.55)`; x.fill(); ink(x, 1, 0.6); x.strokeStyle = `rgba(${c0},0.8)`; x.lineWidth = 1; for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(-24 + k * 7, -19); x.lineTo(-22 + k * 6, -34 + k * 3); x.stroke(); } return; }
    if (el === 'wind') { for (let k = 0; k < 4; k++) brush(x, [[-12 + k * 6, -20], [-24 + k * 4, -32 - k * 2 + Math.sin(t * 5 + k) * 2], [-44 + k * 3, -36 - k + Math.sin(t * 5 + k) * 3]], 6, k % 2 ? '#e8f8ff' : '#a8e0e8', 0.9, 0.4); return; }
    if (el === 'earth') { for (const [hx, L] of [[-22, 18], [-10, 24], [2, 16]]) { x.beginPath(); x.moveTo(hx - 5, -18); x.lineTo(hx - 2, -18 - L); x.lineTo(hx + 4, -18 - L * 0.6); x.lineTo(hx + 6, -18); x.closePath(); x.fillStyle = lg(x, hx - 5, -18 - L, hx + 6, -18, '#c8a878', '#6a4a2a'); x.fill(); ink(x, 1.1, 0.85); } return; }
    if (el === 'plant') { for (let k = 0; k < 4; k++) { x.save(); x.translate(-24 + k * 8, -20); x.rotate(-0.9 + k * 0.25 + Math.sin(t * 2 + k) * 0.08); x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(-6, -10, 0, -20); x.quadraticCurveTo(6, -10, 0, 0); x.fillStyle = k % 2 ? '#5ab84a' : '#8ad86a'; x.fill(); ink(x, 0.9, 0.7); x.strokeStyle = 'rgba(30,80,20,0.7)'; x.lineWidth = 0.7; x.beginPath(); x.moveTo(0, -2); x.lineTo(0, -17); x.stroke(); x.restore(); } x.fillStyle = '#ffb0d0'; x.beginPath(); x.arc(-4, -30, 3.4, 0, TAU); x.fill(); return; }
    if (el === 'bolt') { for (let k = 0; k < 5; k++) { const hx = -26 + k * 7; x.beginPath(); x.moveTo(hx - 3, -18); x.lineTo(hx + 2, -30 - (k % 2) * 6); x.lineTo(hx - 1, -30 - (k % 2) * 6); x.lineTo(hx + 4, -42 - (k % 2) * 6); x.lineTo(hx + 4, -28); x.lineTo(hx + 6, -28); x.lineTo(hx + 3, -18); x.closePath(); x.fillStyle = '#ffe060'; x.fill(); ink(x, 0.9, 0.8); } if (Math.sin(t * 13) > 0.6) { x.save(); x.globalCompositeOperation = 'lighter'; zap(x, -26, -40, -6, -46, Math.floor(t * 13), 8, 'rgba(255,250,200,0.9)', 1.2); x.restore(); } return; }
    if (el === 'light') { x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = 'rgba(255,230,140,0.85)'; x.lineWidth = 2.4; x.beginPath(); x.arc(-10, -14, 26, Math.PI * 1.05, Math.PI * 1.95); x.stroke(); for (let k = 0; k < 7; k++) { const a = Math.PI * (1.08 + k / 6 * 0.84); x.beginPath(); x.moveTo(-10 + Math.cos(a) * 27, -14 + Math.sin(a) * 27); x.lineTo(-10 + Math.cos(a) * (35 + (k % 2) * 6), -14 + Math.sin(a) * (35 + (k % 2) * 6)); x.stroke(); } x.restore(); glow(x, -10, -24, 26, 'rgba(255,230,150,0.45)'); return; }
    if (el === 'shadow') { for (let k = 0; k < 5; k++) { const p = (t * 0.7 + k / 5) % 1; x.globalAlpha = (1 - p) * 0.8; x.drawImage(ArtInk.wash('40,14,60', 1), -30 + k * 7 - 9 - p * 10, -26 - p * 34 - 9, 18 + p * 10, 18 + p * 10); } x.globalAlpha = 1; }
  }
  function head(x, G, h) {
    const t = G.time, E = ELEMENTS[h.el] || ELEMENTS.fire, dr = h.drunk > 0, a = h.lunge ? h.lunge.a : h.tele && h.tele.line != null ? h.tele.line : h.tele && h.tele.cone != null ? h.tele.cone : Math.PI / 2, dir = Math.cos(a) >= 0 ? 1 : -1, open = h.tele || h.lunge ? 1 : 0.2 + 0.1 * Math.sin(t * 2 + (h.hk || 0));
    ArtW3B.warn(x, G, h); x.save(); x.translate(h.x, h.y - 30 + (h.yOff || 0)); x.scale(1.45, 1.45); if (dr) x.rotate(Math.sin(t * 2.4) * 0.3);
    x.scale(dir, 1);
    glow(x, 0, -8, 46, `rgba(${rgb(E.c1)},0.22)`);
    crest(x, h.el, t, E);
    // boca: adentro roja, lengua bífida, mandíbula de abajo con escamas
    x.beginPath(); x.moveTo(-20, 2); x.quadraticCurveTo(10, 6, 38, 3 - open * 2); x.lineTo(34, 10 + open * 12); x.quadraticCurveTo(6, 12 + open * 8, -20, 4); x.closePath(); x.fillStyle = rg(x, 10, 6, 1, 30, '#ff6a50', '#8a1410', '#3a0606'); x.fill();
    if (open > 0.6) { const fl = Math.sin(t * 14) * 4; x.strokeStyle = '#c8283a'; x.lineWidth = 2.2; x.lineCap = 'round'; x.beginPath(); x.moveTo(14, 6 + open * 4); x.quadraticCurveTo(34, 8 + open * 6 + fl, 46, 6 + open * 8); x.moveTo(46, 6 + open * 8); x.lineTo(53, 2 + open * 8 + fl); x.moveTo(46, 6 + open * 8); x.lineTo(53, 11 + open * 8 + fl); x.stroke(); }
    x.beginPath(); x.moveTo(-26, 6); x.quadraticCurveTo(0, 16 + open * 10, 36, 11 + open * 12); x.lineTo(32, 5 + open * 7); x.quadraticCurveTo(0, 9 + open * 4, -20, 2); x.closePath(); x.fillStyle = '#3a3e28'; x.fill(); tex(x, OSC(x), 0.7); ink(x, 1.4, 0.9);
    x.fillStyle = '#f4ecd8'; for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(8 + k * 6, 6 + open * 5); x.lineTo(10 + k * 6, 1 + open * 4); x.lineTo(12 + k * 6, 6 + open * 5); x.fill(); }
    // cráneo con escamas y cejas óseas
    x.beginPath(); x.moveTo(-32, 3); x.quadraticCurveTo(-28, -25, -2, -26); x.quadraticCurveTo(26, -24, 42, -4 - open * 3); x.quadraticCurveTo(45, 1, 40, 3); x.quadraticCurveTo(10, 7, -32, 3); x.closePath();
    x.fillStyle = lg(x, 0, -26, 0, 4, '#7a8458', '#3a4228'); x.fill(); tex(x, OSC(x), 0.85); x.fillStyle = `rgba(${rgb(E.c1)},0.14)`; x.fill(); shade(x, 0, -6, 0, 6, 0.35); ink(x, 1.8, 0.95);
    x.strokeStyle = 'rgba(230,240,190,0.35)'; x.lineWidth = 2; x.beginPath(); x.moveTo(-24, -16); x.quadraticCurveTo(0, -24, 30, -12); x.stroke();
    x.beginPath(); x.moveTo(-4, -15); x.quadraticCurveTo(10, -24, 24, -14); x.quadraticCurveTo(12, -16, -4, -12); x.closePath(); x.fillStyle = '#2a3018'; x.fill(); ink(x, 1, 0.8);
    // colmillos de arriba
    x.fillStyle = '#fffaf0'; for (const fx of [26, 34]) { x.beginPath(); x.moveTo(fx - 2.4, 2); x.lineTo(fx, 10 + open * 6); x.lineTo(fx + 2.4, 2); x.closePath(); x.fill(); ink(x, 0.7, 0.6); }
    // fosa nasal y barbas que flotan
    x.fillStyle = INK; x.beginPath(); x.ellipse(37, -4, 2.4, 1.3, -0.3, 0, TAU); x.fill();
    x.strokeStyle = `rgba(${rgb(E.c0)},0.75)`; x.lineWidth = 1.1; x.lineCap = 'round'; for (const s of [0, 1]) { x.beginPath(); x.moveTo(30, 4 + s * 2); x.bezierCurveTo(22, 18 + s * 6, 6, 14 + Math.sin(t * 3 + s) * 6, -8, 22 + s * 4 + Math.sin(t * 2.4 + s) * 5); x.stroke(); }
    // el ojo (o la borrachera)
    if (dr) { x.fillStyle = 'rgba(255,90,90,0.5)'; x.beginPath(); x.ellipse(0, -6, 8, 4, 0, 0, TAU); x.fill(); x.strokeStyle = INK; x.lineWidth = 1.6; x.beginPath(); x.moveTo(6, -14); x.lineTo(14, -10); x.stroke(); x.save(); x.translate(4, -46); x.rotate(t * 4); for (let k = 0; k < 3; k++) { x.rotate(TAU / 3); x.fillStyle = '#ffe9a0'; x.font = fontB(12, 900); x.fillText('✶', 8, 0); } x.restore(); }
    else { glow(x, 11, -12, 22, `rgba(${rgb(E.c1)},0.75)`); x.save(); x.translate(11, -12); x.rotate(0.15); x.beginPath(); x.moveTo(-6, 0); x.quadraticCurveTo(0, -4.5, 6.5, -0.5); x.quadraticCurveTo(0, 3.5, -6, 0); x.closePath(); x.fillStyle = rg(x, 0, 0, 0.5, 6, '#ffffff', E.c0, E.c1); x.fill(); ink(x, 1, 0.9); x.fillStyle = INK; x.fillRect(-0.8, -3.4, 1.6, 6.8); x.restore(); }
    if (h.tele || h.lunge) glow(x, 38, 8, 32, `rgba(${rgb(E.c1)},0.55)`);
    if (h.flash > 0) { x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(255,250,235,${Math.min(0.7, h.flash * 5)})`; x.beginPath(); x.ellipse(4, -10, 40, 26, 0, 0, TAU); x.fill(); }
    x.restore();
    // barra de vida y su contrario
    if (h.hp < h.maxHp) { const w = 50, f = h.hp / h.maxHp; x.fillStyle = 'rgba(29,24,23,0.75)'; x.fillRect(h.x - w / 2 - 1, h.y - 104, w + 2, 6); x.fillStyle = E.c1; x.fillRect(h.x - w / 2, h.y - 103, w * f, 4); }
    const C = W3B.COUNTER[h.el]; if (C && ELEMENTS[C]) { x.fillStyle = 'rgba(29,24,23,0.8)'; x.beginPath(); x.arc(h.x, h.y - 118, 10, 0, TAU); x.fill(); HUD.icon(x, C, h.x, h.y - 118, 6, ELEMENTS[C].c0); }
  }

  /* =================== EL BORRÓN =================== */
  // pinceladas que giran a su alrededor como letras sueltas
  const GLYPH = [[[-8, -6], [0, -2], [8, 4]], [[-6, -8], [-4, 0], [-6, 8], [0, 10]], [[-8, 0], [0, -4], [8, 0]], [[0, -9], [2, 0], [-3, 9]], [[-7, 7], [0, 0], [7, -7]], [[-8, -4], [6, -6], [2, 8]]];
  function glyphs(x, t, Y, front) { for (let k = 0; k < 6; k++) { const a = t * 0.5 + k / 6 * TAU, s = Math.sin(a); if ((s >= 0) !== front) continue; const gx = Math.cos(a) * 112, gy = Y + s * 38 - 10, sc = 1.3 + s * 0.3;
    brush(x, GLYPH[k].map(([u, v]) => [gx + u * sc, gy + v * sc]), 5.5 * sc, '#0e0b0e', 0.55 + s * 0.3, 0.4); } }
  function borron(x, G, b) {
    const t = G.time, sh = b.shield > 0, Y = -80 + Math.sin(t * 1.4) * 8, L0 = lo(), f = b.maxShield ? b.shield / b.maxShield : 1;
    ArtW3B.warn(x, G, b); x.save(); x.translate(b.x, b.y); x.scale(1.3, 1.3);
    x.globalAlpha = 0.6; x.drawImage(ArtInk.wash('8,6,10', 1), -140, -24, 280, 70); x.globalAlpha = 1;
    if (!L0) glyphs(x, t, Y, false);
    // tentáculos de pincel con puntas secas que salpican
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + t * 0.3, L = 92 + Math.sin(t * 2 + k) * 24, ex = Math.cos(a + 0.7) * L, ey = Y + Math.sin(a + 0.7) * L * 0.5 + 60;
      brush(x, [[Math.cos(a) * 30, Y + Math.sin(a) * 20], [Math.cos(a + 0.4) * L * 0.6, Y + Math.sin(a + 0.4) * L * 0.4 + 30], [ex, ey]], 15, '#0e0b0e', 0.92, 0.45);
      x.fillStyle = 'rgba(14,11,14,0.85)'; for (let j = 0; j < 3; j++) { x.beginPath(); x.arc(ex + (H(k, j) - 0.5) * 16, ey + (H(k, j + 4) - 0.5) * 10, 1 + H(k, j + 8) * 2.4, 0, TAU); x.fill(); } }
    // cuerpo: tinta húmeda que se corre (bordes que sangran) con grano de papel adentro
    const blob = (k, rr) => { x.beginPath(); for (let j = 0; j <= 28; j++) { const a = j / 28 * TAU, r = (64 + Math.sin(a * 5 + t * 3 + k) * 7 + Math.sin(a * 3 - t * 2) * 5) * rr; j ? x.lineTo(Math.cos(a) * r, Y + Math.sin(a) * r * 0.9) : x.moveTo(Math.cos(a) * r, Y + Math.sin(a) * r * 0.9); } x.closePath(); };
    for (const [k, rr, al] of [[1.3, 1.14, 0.16], [0.7, 1.07, 0.28]]) { blob(k, rr); x.fillStyle = `rgba(14,11,14,${al})`; x.fill(); }
    blob(0, 1); x.fillStyle = sh ? rg(x, -16, Y - 26, 4, 80, '#2a2230', '#0c090e', '#040305') : rg(x, 0, Y, 6, 76, '#7a4a9a', '#3a2048', '#140a1a'); x.fill(); tex(x, GRAIN(x), sh ? 0.9 : 0.6);
    if (sh) { x.strokeStyle = `rgba(170,150,220,${0.35 + 0.15 * Math.sin(t * 3)})`; x.lineWidth = 2.5; x.stroke();
      // laca: reflejos duros arriba y una grieta por cada parte de coraza que ya perdió
      x.save(); x.clip(); x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 4; x.beginPath(); x.arc(-8, Y - 6, 50, Math.PI * 1.15, Math.PI * 1.45); x.stroke(); x.lineWidth = 2; x.beginPath(); x.arc(-8, Y - 6, 42, Math.PI * 1.5, Math.PI * 1.58); x.stroke();
        const n = Math.round((1 - f) * 6); x.globalCompositeOperation = 'lighter'; for (let k = 0; k < n; k++) { const a = H(k, 21) * TAU, r0 = 18 + H(k, 22) * 20; x.strokeStyle = 'rgba(255,230,160,0.85)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(Math.cos(a) * r0, Y + Math.sin(a) * r0 * 0.9); x.lineTo(Math.cos(a + 0.2) * (r0 + 22), Y + Math.sin(a + 0.2) * (r0 + 22) * 0.9); x.lineTo(Math.cos(a - 0.1) * (r0 + 40), Y + Math.sin(a - 0.1) * (r0 + 40) * 0.9); x.stroke(); } x.restore(); }
    else { glow(x, 0, Y, 92, 'rgba(190,110,255,0.75)'); x.save(); x.clip(); x.globalCompositeOperation = 'lighter'; for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + t * 0.4; x.strokeStyle = `rgba(230,170,255,${0.4 + 0.3 * Math.sin(t * 5 + k)})`; x.lineWidth = 1.6; x.beginPath(); x.moveTo(Math.cos(a) * 12, Y + Math.sin(a) * 10); x.lineTo(Math.cos(a + 0.25) * 40, Y + Math.sin(a + 0.25) * 34); x.lineTo(Math.cos(a) * 66, Y + Math.sin(a) * 58); x.stroke(); } x.restore(); }
    // cuernos de tinta y máscara de hannya agrietada
    for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * 16, Y - 26); x.bezierCurveTo(s * 30, Y - 44, s * 22, Y - 66, s * 40, Y - 78); x.bezierCurveTo(s * 28, Y - 62, s * 34, Y - 44, s * 26, Y - 22); x.closePath(); x.fillStyle = lg(x, 0, Y - 78, 0, Y - 22, '#8a8094', '#0e0b0e'); x.fill(); ink(x, 1.4, 0.9); }
    x.beginPath(); x.moveTo(-30, Y - 18); x.quadraticCurveTo(0, Y - 36, 30, Y - 18); x.quadraticCurveTo(28, Y + 6, 18, Y + 18); x.quadraticCurveTo(0, Y + 30, -18, Y + 18); x.quadraticCurveTo(-28, Y + 6, -30, Y - 18); x.closePath();
    x.fillStyle = lg(x, 0, Y - 34, 0, Y + 28, '#fbf4e6', '#e8dcc4', '#c8b898'); x.fill(); shade(x, 0, Y - 4, 0, Y + 28, 0.3); ink(x, 1.8, 0.95);
    x.strokeStyle = `rgba(${IR},0.7)`; x.lineWidth = 0.9; x.beginPath(); x.moveTo(8, Y - 30); x.lineTo(5, Y - 22); x.lineTo(10, Y - 16); x.lineTo(7, Y - 9); x.moveTo(-20, Y + 8); x.lineTo(-14, Y + 12); x.lineTo(-16, Y + 18); x.stroke();
    for (const s of [-1, 1]) { brush(x, [[s * 4, Y - 4], [s * 14, Y - 2], [s * 24, Y + 6]], 3.4, '#c8281e', 0.85, 0.2);
      x.beginPath(); x.moveTo(s * 3, Y - 12); x.quadraticCurveTo(s * 12, Y - 20, s * 21, Y - 10); x.quadraticCurveTo(s * 12, Y - 4, s * 3, Y - 12); x.closePath(); x.fillStyle = INK; x.fill();
      glow(x, s * 12, Y - 11, 16, 'rgba(255,40,70,0.9)'); x.fillStyle = '#ffe0a0'; x.beginPath(); x.arc(s * 12, Y - 11, 2.2, 0, TAU); x.fill(); x.fillStyle = '#ff3050'; x.beginPath(); x.arc(s * 12, Y - 11, 1.2, 0, TAU); x.fill(); }
    x.beginPath(); x.moveTo(-16, Y + 8); x.quadraticCurveTo(0, Y + 4, 16, Y + 8); x.quadraticCurveTo(12, Y + 20, 0, Y + 21); x.quadraticCurveTo(-12, Y + 20, -16, Y + 8); x.closePath(); x.fillStyle = '#3a0a10'; x.fill();
    x.fillStyle = '#fffaf0'; for (let k = 0; k < 6; k++) { const tx = -12 + k * 4.8; x.beginPath(); x.moveTo(tx - 1.8, Y + 8.5); x.lineTo(tx, Y + 12 + (k === 0 || k === 5 ? 4 : 0)); x.lineTo(tx + 1.8, Y + 8.5); x.closePath(); x.fill(); }
    x.fillStyle = '#c8281e'; x.fillRect(-4, Y - 30, 8, 8); x.strokeStyle = '#fbf4e6'; x.lineWidth = 1; x.strokeRect(-2.6, Y - 28.6, 5.2, 5.2);
    // gotas que caen y salpican
    for (let k = 0; k < (L0 ? 4 : 7); k++) { const p = (t * 0.8 + k / 7) % 1, gx = -46 + k * 15; x.fillStyle = `rgba(14,11,14,${1 - p})`; x.beginPath(); x.ellipse(gx, Y + 52 + p * 62, 3.6 * (1 - p) + 1, 5 * (1 - p) + 1.5, 0, 0, TAU); x.fill(); if (p > 0.85) { x.fillStyle = 'rgba(14,11,14,0.5)'; x.beginPath(); x.ellipse(gx, Y + 116, 8 * (p - 0.85) * 6, 2, 0, 0, TAU); x.fill(); } }
    if (!L0) glyphs(x, t, Y, true);
    if (b.flash > 0) { x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(255,250,235,${Math.min(0.6, b.flash * 5)})`; x.beginPath(); x.ellipse(0, Y, 70, 60, 0, 0, TAU); x.fill(); }
    x.restore();
  }
  /* ---------- copias de tinta: el mago pintado en tinta seca, que gotea, con ojos rojos ---------- */
  function copy(x, G, c) {
    const t = c.t || 0, a = c.spawnT > 0 ? 1 - c.spawnT / 0.6 : 1, Y = -26 + Math.sin(t * 6) * 2;
    x.save(); x.translate(c.x, c.y); x.globalAlpha = a * 0.94; shadow(x, 0, 3, 24, 0.5);
    x.beginPath(); x.moveTo(-15, 0); x.quadraticCurveTo(-18, Y - 10, -9, Y - 20); x.lineTo(9, Y - 20); x.quadraticCurveTo(18, Y - 10, 15, 0); for (let k = 0; k <= 6; k++) x.lineTo(15 - k * 5, (k % 2 ? -6 : 2) + Math.sin(t * 8 + k) * 2); x.closePath();
    x.fillStyle = lg(x, 0, Y - 20, 0, 2, '#2a2230', '#0a080c'); x.fill(); tex(x, GRAIN(x), 1);
    brush(x, [[-14, -2], [-15, Y - 8], [-8, Y - 20]], 4, '#0e0b0e', 0.8, 0.5); brush(x, [[14, -2], [15, Y - 8], [8, Y - 20]], 4, '#0e0b0e', 0.8, 0.5);
    x.beginPath(); x.moveTo(-14, Y - 26); x.quadraticCurveTo(-16, Y - 44, 0, Y - 60); x.quadraticCurveTo(16, Y - 44, 14, Y - 26); x.quadraticCurveTo(0, Y - 16, -14, Y - 26); x.closePath(); x.fillStyle = lg(x, 0, Y - 60, 0, Y - 18, '#2a2230', '#0a080c'); x.fill(); tex(x, GRAIN(x), 1);
    x.fillStyle = '#050305'; x.beginPath(); x.ellipse(0, Y - 30, 8, 7, 0, 0, TAU); x.fill();
    for (const s of [-1, 1]) { glow(x, s * 3.6, Y - 31, 6, 'rgba(255,40,70,0.8)'); x.fillStyle = '#ff3050'; x.beginPath(); x.ellipse(s * 3.6, Y - 31, 2.2, 1.3, 0, 0, TAU); x.fill(); }
    for (let k = 0; k < 3; k++) { const p = (t * 0.9 + k / 3) % 1; x.fillStyle = `rgba(10,8,12,${0.9 * (1 - p)})`; x.beginPath(); x.ellipse(-8 + k * 8, 2 + p * 14, 1.6 * (1 - p) + 0.8, 2.4 * (1 - p) + 1, 0, 0, TAU); x.fill(); }
    if (c.els) c.els.forEach((el, k) => { const E = ELEMENTS[el]; if (E) glow(x, (k ? 1 : -1) * 18, Y - 8, 15, `rgba(${rgb(E.c1)},0.7)`); });
    if (c.flash > 0) { x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(255,250,235,${Math.min(0.7, c.flash * 5)})`; x.beginPath(); x.ellipse(0, Y - 14, 20, 34, 0, 0, TAU); x.fill(); }
    x.restore();
  }
  /* ---------- tinaja de sake: barro vidriado, cuerda de paja y su papel ---------- */
  function jar(x, G, u) {
    x.save(); x.translate(u.x, u.y); shadow(x, 0, 3, 24, 0.45);
    x.beginPath(); x.moveTo(-14, 0); x.quadraticCurveTo(-25, -22, -12, -40); x.lineTo(12, -40); x.quadraticCurveTo(25, -22, 14, 0); x.closePath();
    x.fillStyle = lg(x, -20, 0, 20, 0, '#c8b48a', '#efe0bc', '#a88c5c', '#6a5434'); x.fill(); ink(x, 1.5, 0.9);
    x.strokeStyle = 'rgba(255,255,240,0.6)'; x.lineWidth = 2; x.beginPath(); x.moveTo(-10, -34); x.quadraticCurveTo(-17, -22, -11, -6); x.stroke();
    x.beginPath(); x.ellipse(0, -42, 12, 4, 0, 0, TAU); x.fillStyle = '#4a3a2a'; x.fill(); ink(x, 1.2, 0.9);
    x.strokeStyle = INK; x.lineWidth = 4.5; x.beginPath(); x.moveTo(-13, -35); x.quadraticCurveTo(0, -31, 13, -35); x.stroke(); x.strokeStyle = '#d8c078'; x.lineWidth = 3; x.stroke(); x.strokeStyle = 'rgba(120,90,30,0.8)'; x.lineWidth = 1; x.setLineDash([2, 2]); x.stroke(); x.setLineDash([]);
    x.fillStyle = '#c8281e'; x.fillRect(-9, -28, 18, 15); x.strokeStyle = INK; x.lineWidth = 1; x.strokeRect(-9, -28, 18, 15); x.fillStyle = '#fff4e0'; x.font = fontB(10, 900); x.textAlign = 'center'; x.fillText('酒', 0, -16.5);
    if (u.flash > 0) { x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(255,250,235,${u.flash * 4})`; x.beginPath(); x.arc(0, -20, 22, 0, TAU); x.fill(); }
    x.restore();
  }
  return { kitsune, god, orochi, head, borron, copy, jar, FUR, SCALES, TIGER, GRAIN, tex, flame, curl };
})();
