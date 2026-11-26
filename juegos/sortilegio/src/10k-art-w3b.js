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

  function boss(x, G, b) {
    if (b.w3boss === 'kitsune' || b.w3boss === 'kclone') return kitsune(x, G, b);
    if (b.w3boss === 'raijin' || b.w3boss === 'fujin') return god(x, G, b);
    if (b.w3boss === 'orochi') return orochi(x, G, b);
    if (b.w3boss === 'ohead') return head(x, G, b);
    if (b.w3boss === 'borron') return borron(x, G, b);
  }
  /* ---------- la Kitsune: zorra blanca de marcas bermellón y nueve colas con fuego de zorro en la punta ---------- */
  function kitsune(x, G, b) {
    const t = G.time + (b._nid || 0) * 0.7, dir = Math.cos(Math.atan2(b.vy || 0, b.vx || 1)) >= 0 ? 1 : -1, real = !b.clone, Y = -34 + Math.sin(t * 2.2) * 3, rev = real && b.reveal > 0, mv = Math.min(1, hypot(b.vx || 0, b.vy || 0) / 120);
    warn(x, G, b); x.save(); x.translate(b.x, b.y);
    if (real) shadow(x, 0, 4, 62); // ¡la de verdad tiene sombra!
    x.scale(1.35, 1.35);
    if (b.dash) { for (let k = 1; k < 5; k++) { x.save(); x.globalAlpha = 0.15; x.translate(-Math.cos(b.dash.a) * k * 30, -Math.sin(b.dash.a) * k * 30); x.fillStyle = '#fff'; x.beginPath(); x.ellipse(0, Y, 40, 22, 0, 0, TAU); x.fill(); x.restore(); } }
    x.scale(dir, 1);
    // nueve colas en abanico
    for (let k = 0; k < 9; k++) { const a = -2.6 + k * 0.17 + Math.sin(t * 2 + k * 0.7) * 0.08, L = 70 + (k % 3) * 8, ex = -24 + Math.cos(a) * L, ey = Y - 10 + Math.sin(a) * L;
      x.beginPath(); x.moveTo(-20, Y - 2); x.quadraticCurveTo(-20 + Math.cos(a + 0.4) * L * 0.6, Y - 10 + Math.sin(a + 0.4) * L * 0.6, ex, ey); x.quadraticCurveTo(-20 + Math.cos(a - 0.3) * L * 0.5, Y - 4 + Math.sin(a - 0.3) * L * 0.5, -16, Y + 6); x.closePath(); fi(x, lg(x, -20, Y, ex, ey, '#ffffff', '#f4ece0', '#e86a4a'), 1.3, 0.75);
      x.save(); x.globalCompositeOperation = 'lighter'; const fl = 0.6 + 0.4 * Math.sin(t * 9 + k); x.fillStyle = `rgba(120,200,255,${0.55 * fl})`; x.beginPath(); x.ellipse(ex, ey - 4, 6, 10 * fl, a + Math.PI / 2, 0, TAU); x.fill(); x.restore(); }
    // cuerpo y patas
    for (const [lx, ph] of [[-14, 0], [16, Math.PI]]) stroke(x, [[lx, Y + 10], [lx + Math.sin(t * 9 + ph) * 6 * mv, Y + 22], [lx + Math.sin(t * 9 + ph) * 8 * mv, -2]], 6, '#f2ece2');
    x.beginPath(); x.ellipse(0, Y, 34, 18, -0.05, 0, TAU); fi(x, lg(x, 0, Y - 18, 0, Y + 18, '#ffffff', '#ebe2d4'), 1.6);
    x.strokeStyle = '#d8402a'; x.lineWidth = 2.4; x.beginPath(); x.moveTo(-14, Y - 12); x.quadraticCurveTo(0, Y - 6, 14, Y - 14); x.stroke();
    // cabeza: hocico largo, orejas altas, marcas rojas y ojos dorados
    const hx = 30, hy = Y - 22; x.beginPath(); x.moveTo(hx - 14, hy + 10); x.quadraticCurveTo(hx - 12, hy - 12, hx + 2, hy - 12); x.quadraticCurveTo(hx + 16, hy - 6, hx + 30, hy + 4); x.quadraticCurveTo(hx + 12, hy + 14, hx - 14, hy + 10); x.closePath(); fi(x, '#fffdf8', 1.5);
    for (const ex of [-8, 4]) { x.beginPath(); x.moveTo(hx + ex - 4, hy - 8); x.lineTo(hx + ex, hy - 30); x.lineTo(hx + ex + 6, hy - 9); x.closePath(); fi(x, '#fffdf8', 1.3); x.fillStyle = '#e86a4a'; x.beginPath(); x.moveTo(hx + ex - 1, hy - 10); x.lineTo(hx + ex + 0.5, hy - 24); x.lineTo(hx + ex + 3, hy - 10); x.fill(); }
    x.strokeStyle = '#d8402a'; x.lineWidth = 2; x.beginPath(); x.moveTo(hx + 2, hy - 2); x.lineTo(hx + 14, hy + 2); x.moveTo(hx - 4, hy - 8); x.quadraticCurveTo(hx, hy - 4, hx + 8, hy - 6); x.stroke();
    x.fillStyle = rev ? '#fff8c0' : '#e8b030'; x.beginPath(); x.ellipse(hx + 6, hy - 3, 3.4, 1.8, 0.2, 0, TAU); x.fill(); x.fillStyle = INK; x.beginPath(); x.ellipse(hx + 6.5, hy - 3, 1, 1.6, 0, 0, TAU); x.fill();
    x.fillStyle = INK; x.beginPath(); x.arc(hx + 29, hy + 4, 2.4, 0, TAU); x.fill();
    // cascabel y cuerda roja del santuario
    x.strokeStyle = '#c8281e'; x.lineWidth = 3; x.beginPath(); x.moveTo(hx - 12, hy + 12); x.quadraticCurveTo(hx - 4, hy + 18, hx + 6, hy + 12); x.stroke(); x.beginPath(); x.arc(hx - 3, hy + 19, 3.6, 0, TAU); fi(x, '#e8c040', 1, 0.8);
    if (rev) glow(x, 0, Y - 10, 90, 'rgba(255,240,170,0.6)');
    if (b.flash > 0) { x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(255,250,235,${Math.min(0.7, b.flash * 5)})`; x.beginPath(); x.ellipse(0, Y - 10, 60, 40, 0, 0, TAU); x.fill(); }
    x.restore();
  }
  /* ---------- Raijin y Fujin: sobre su nube; caídos, una nube gris con el tiempo que les queda ---------- */
  function cloud(x, w, h, t, col = ['#ffffff', '#f0e4c4', '#d8b878']) { for (let k = 0; k < 6; k++) { const cx = -w / 2 + k * w / 5, cy = Math.sin(t * 2 + k) * 2, r = h * (0.7 + (k % 2) * 0.3); x.beginPath(); x.arc(cx, cy, r, 0, TAU); fi(x, rg(x, cx - r * 0.3, cy - r * 0.4, 1, r, col[0], col[1], col[2]), 1.2, 0.7); } x.strokeStyle = 'rgba(160,110,40,0.6)'; x.lineWidth = 1.2; for (let k = 0; k < 3; k++) { x.beginPath(); x.arc(-w / 3 + k * w / 3, 2, 6, Math.PI * 0.2, Math.PI * 1.6); x.stroke(); } }
  function god(x, G, b) {
    const t = G.time, R = b.w3boss === 'raijin', Y = -70 + Math.sin(t * 1.8 + (R ? 0 : 2)) * 6, dn = b.down, dir = R ? 1 : -1;
    warn(x, G, b);
    if (R && b.mark) for (const [mx, my] of b.mark) { x.save(); x.translate(mx, my); const p = 0.5 + 0.5 * Math.sin(t * 10); x.strokeStyle = `rgba(200,160,255,${0.5 + p * 0.5})`; x.lineWidth = 3; x.beginPath(); x.ellipse(0, 0, 58, 32, 0, 0, TAU); x.stroke(); tomoe(x, 0, 0, 16, `rgba(200,160,255,${0.6 + p * 0.4})`); x.restore(); }
    x.save(); x.translate(b.x, b.y); shadow(x, 0, 6, 86, dn ? 0.2 : 0.35); x.scale(1.45, 1.45);
    if (dn) { x.globalAlpha = 0.6; cloud(x, 120, 26, t, ['#d8d8e0', '#a8a8b8', '#787888']); x.globalAlpha = 1; const f = b.downT / 12; x.strokeStyle = '#ffe9a0'; x.lineWidth = 5; x.beginPath(); x.arc(0, -60, 30, -Math.PI / 2, -Math.PI / 2 + f * TAU); x.stroke(); x.font = fontB(18, 900); x.textAlign = 'center'; x.fillStyle = '#fff'; x.strokeStyle = INK; x.lineWidth = 4; x.strokeText(Math.ceil(b.downT), 0, -53); x.fillText(Math.ceil(b.downT), 0, -53); x.restore(); return; }
    x.translate(0, Y + 40); cloud(x, 130, 24, t); x.translate(0, -40);
    x.scale(dir, 1);
    if (R) { // aro de tambores detrás
      for (let k = 0; k < 8; k++) { const a = Math.PI * (1.05 + k / 7 * 0.9), dx = Math.cos(a) * 74, dy = Math.sin(a) * 66 - 10; x.save(); x.translate(dx, dy); x.beginPath(); x.ellipse(0, 0, 13, 13, 0, 0, TAU); fi(x, '#c8281e', 1.5); x.beginPath(); x.ellipse(0, 0, 9, 9, 0, 0, TAU); fi(x, '#f0e0c0', 1); tomoe(x, 0, 0, 7, INK); x.restore(); }
      x.strokeStyle = '#8a5a2a'; x.lineWidth = 3; x.beginPath(); x.arc(0, -10, 70, Math.PI * 1.02, Math.PI * 1.98); x.stroke();
    } else { // la bolsa de viento que ondea por encima
      const sw = Math.sin(t * 3) * 10; x.beginPath(); x.moveTo(-30, -40); x.bezierCurveTo(-70, -110 + sw, 40, -150 - sw, 70, -70); x.bezierCurveTo(50, -110 + sw, -20, -100, -10, -40); x.closePath(); fi(x, lg(x, -60, -140, 60, -40, '#ffffff', '#e8eef4', '#b8c8d8'), 1.6);
      x.strokeStyle = 'rgba(110,140,170,0.6)'; x.lineWidth = 1.2; for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(-20 + k * 12, -50); x.quadraticCurveTo(k * 15, -110 - k * 6, 30 + k * 10, -90); x.stroke(); } }
    // cuerpo (Raijin blanco-lila, Fujin verde)
    const skin = R ? ['#f4f0f8', '#c8c0d8'] : ['#8ac878', '#4e9a52'];
    x.beginPath(); x.ellipse(0, 0, 30, 34, 0, 0, TAU); fi(x, lg(x, 0, -34, 0, 34, skin[0], skin[1]), 2);
    x.beginPath(); x.moveTo(-28, 10); x.lineTo(28, 10); x.lineTo(22, 32); x.lineTo(-22, 32); x.closePath(); fi(x, R ? '#e8b840' : '#e0e8f0', 1.4); if (R) { x.strokeStyle = INK; x.lineWidth = 2; for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(-18 + k * 12, 12); x.quadraticCurveTo(-14 + k * 12, 20, -19 + k * 12, 30); x.stroke(); } }
    // pañuelo que flota
    stroke(x, [[-26, -14], [-50, -30 + Math.sin(t * 4) * 6], [-74, -12 + Math.sin(t * 4 + 1) * 8]], 7, R ? '#5a8ad0' : '#c84a3a', 0.9);
    // brazos (Raijin con baquetas que golpean al compás)
    const hit = R ? Math.max(0, 1 - ((G.cs.beatT || 0) * (G.cs.bpm || 108) / 60)) : 0;
    for (const s of [-1, 1]) { const ax = s * 40, ay = -16 - hit * 10; stroke(x, [[s * 22, -14], [s * 34, -24], [ax, ay]], 9, skin[1]); if (R) { x.strokeStyle = '#8a5a2a'; x.lineWidth = 4; x.lineCap = 'round'; x.beginPath(); x.moveTo(ax, ay); x.lineTo(ax + s * 22, ay - 22 + hit * 18); x.stroke(); x.fillStyle = '#e8d8b0'; x.beginPath(); x.arc(ax + s * 22, ay - 22 + hit * 18, 4, 0, TAU); x.fill(); } }
    // cabeza: cuernos, pelo salvaje, ojos dorados y boca abierta
    const hy = -46; x.beginPath(); x.ellipse(0, hy, 18, 18, 0, 0, TAU); fi(x, skin[0], 1.8);
    for (let k = 0; k < 9; k++) { const a = -Math.PI + k / 8 * Math.PI, L = 18 + (k % 2) * 8; stroke(x, [[Math.cos(a) * 14, hy + Math.sin(a) * 14], [Math.cos(a) * (14 + L * 0.6) + Math.sin(t * 5 + k) * 2, hy + Math.sin(a) * (14 + L * 0.6)], [Math.cos(a) * (14 + L), hy + Math.sin(a) * (14 + L)]], 6, R ? '#3a2a4a' : '#c83a2a', 0.95); }
    if (R) for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * 6, hy - 14); x.quadraticCurveTo(s * 12, hy - 30, s * 4, hy - 34); x.lineTo(s * 2, hy - 14); x.closePath(); fi(x, '#f0e6c8', 1); }
    for (const s of [-1, 1]) { x.fillStyle = '#ffd040'; x.beginPath(); x.ellipse(s * 6 + 3, hy - 3, 4, 2.6, 0, 0, TAU); x.fill(); x.fillStyle = INK; x.beginPath(); x.arc(s * 6 + 4, hy - 3, 1.5, 0, TAU); x.fill(); }
    x.beginPath(); x.ellipse(4, hy + 8, 7, 4, 0, 0, TAU); fi(x, '#7a1a1a', 1.2); x.fillStyle = '#fff'; x.fillRect(-1, hy + 5, 3, 3); x.fillRect(7, hy + 5, 3, 3);
    if (G.cs && G.cs.beat0 != null && R) glow(x, 0, -10, 40 + hit * 40, `rgba(200,160,255,${0.25 + hit * 0.4})`);
    if (b.flash > 0) { x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(255,250,235,${Math.min(0.7, b.flash * 5)})`; x.beginPath(); x.ellipse(0, -20, 50, 60, 0, 0, TAU); x.fill(); }
    x.restore();
    // el lazo que los protege (si están cerca)
    const o = G.units.find(u => u.alive && !u.down && u !== b && (u.w3boss === 'raijin' || u.w3boss === 'fujin'));
    if (R && o && hypot(o.x - b.x, o.y - b.y) < 330) { x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(200,180,255,${0.5 + 0.3 * Math.sin(t * 20)})`; x.lineWidth = 3; x.beginPath(); x.moveTo(b.x, b.y - 60); for (let k = 1; k < 8; k++) x.lineTo(b.x + (o.x - b.x) * k / 8 + (Math.random() - 0.5) * 18, b.y - 60 + (o.y - b.y) * k / 8 + (Math.random() - 0.5) * 18); x.lineTo(o.x, o.y - 60); x.stroke(); x.restore(); }
  }
  function tomoe(x, X, Y, r, col) { x.save(); x.translate(X, Y); x.fillStyle = col; for (let k = 0; k < 3; k++) { x.rotate(TAU / 3); x.beginPath(); x.arc(r * 0.45, 0, r * 0.38, 0, TAU); x.fill(); x.beginPath(); x.moveTo(r * 0.45 + r * 0.38, 0); x.quadraticCurveTo(r * 0.9, r * 0.7, r * 0.1, r * 0.95); x.quadraticCurveTo(r * 0.6, r * 0.4, r * 0.45, r * 0.38); x.fill(); } x.restore(); }
  /* ---------- Yamata no Orochi: el cuerpo con árboles en el lomo y ocho cuellos hacia sus cabezas ---------- */
  function orochi(x, G, b) {
    const t = G.time, H = b.heads || G.units.filter(u => u.w3boss === 'ohead');
    x.save(); x.translate(b.x, b.y);
    x.globalAlpha = 0.5; x.drawImage(ArtInk.wash('10,8,12', 1), -340, -60, 680, 200); x.globalAlpha = 1;
    // los cuellos: serpientes gruesas que suben del cuerpo y bajan hacia cada cabeza (los cortados, caídos y quietos)
    const neck = (pts, w, a) => { x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); x.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]); x.lineCap = 'round'; x.lineJoin = 'round'; x.globalAlpha = a; x.strokeStyle = INK; x.lineWidth = w + 5; x.stroke(); x.strokeStyle = '#2e3a26'; x.lineWidth = w; x.stroke(); x.strokeStyle = '#4e5a38'; x.lineWidth = w * 0.55; x.stroke(); x.setLineDash([6, 9]); x.strokeStyle = 'rgba(160,170,110,0.45)'; x.lineWidth = w * 0.18; x.stroke(); x.setLineDash([]); x.globalAlpha = 1; };
    for (const h of H) { const dx = h.x - b.x, dy = h.y + (h.yOff || 0) - b.y, sx = clamp(dx * 0.25, -190, 190), sw = Math.sin(t * 1.3 + h.hk) * 18;
      if (h.alive) neck([[sx, -40], [sx + dx * 0.1 + sw, -200 - Math.abs(dx) * 0.05], [dx * 0.85 - sw, dy * 0.5 - 140], [dx, dy - 40]], 30, 1);
      else neck([[sx, -20], [sx * 1.3, 30], [sx * 1.7, 70], [sx * 1.9, 100]], 26, 0.85); }
    // el cuerpo: anillos enroscados con escamas, panza roja que brilla, musgo y cedros en el lomo
    const coils = [[-170, 20, 160, 66], [150, 14, 170, 70], [0, -30, 220, 86], [-80, -96, 150, 58], [90, -104, 132, 52], [0, -150, 100, 40]];
    for (const [cx, cy, rx, ry] of coils) {
      x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, TAU); x.fillStyle = lg(x, 0, cy - ry, 0, cy + ry, '#4a5636', '#26301e'); x.fill(); x.strokeStyle = INK; x.lineWidth = 3; x.stroke();
      x.save(); x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, TAU); x.clip(); x.strokeStyle = 'rgba(150,160,110,0.3)'; x.lineWidth = 1.2; for (let r = -2; r <= 2; r++) for (let k = -6; k <= 6; k++) { const ex = cx + k * 26 + (r % 2) * 13, ey = cy + r * 18; x.beginPath(); x.arc(ex, ey, 11, 0.25, Math.PI - 0.25); x.stroke(); }
      x.fillStyle = `rgba(190,40,30,${0.35 + 0.15 * Math.sin(t * 2 + cx)})`; x.beginPath(); x.ellipse(cx, cy + ry * 0.75, rx * 0.8, ry * 0.32, 0, 0, TAU); x.fill(); x.restore(); }
    for (let k = 0; k < 6; k++) { const tx = -140 + k * 56, ty = -140 + Math.abs(k - 2.5) * 16; stroke(x, [[tx, ty + 6], [tx + 1, ty - 22]], 5, '#2a1e14'); x.beginPath(); x.moveTo(tx - 15, ty - 14); x.lineTo(tx + 1, ty - 54); x.lineTo(tx + 17, ty - 14); x.closePath(); fi(x, '#2a4426', 1.2, 0.7); x.beginPath(); x.moveTo(tx - 11, ty - 30); x.lineTo(tx + 1, ty - 62); x.lineTo(tx + 13, ty - 30); x.closePath(); fi(x, '#34522e', 1, 0.6); }
    // la cola con el brillo de la espada (la Kusanagi espera adentro)
    stroke(x, [[220, 30], [300, 70], [360, 50], [410, 96]], 34, '#2e3a26'); x.save(); x.globalCompositeOperation = 'lighter'; const p = 0.5 + 0.5 * Math.sin(t * 3); x.fillStyle = `rgba(255,250,220,${0.3 + p * 0.5})`; x.beginPath(); x.ellipse(404, 92, 9, 3, 0.6, 0, TAU); x.fill(); x.restore();
    x.restore();
  }
  function head(x, G, h) {
    const t = G.time, E = ELEMENTS[h.el] || ELEMENTS.fire, dr = h.drunk > 0, a = h.lunge ? h.lunge.a : h.tele && h.tele.line != null ? h.tele.line : h.tele && h.tele.cone != null ? h.tele.cone : Math.PI / 2, dir = Math.cos(a) >= 0 ? 1 : -1, open = h.tele || h.lunge ? 1 : 0.2;
    warn(x, G, h); x.save(); x.translate(h.x, h.y - 30 + (h.yOff || 0)); x.scale(1.45, 1.45); if (dr) x.rotate(Math.sin(t * 2.4) * 0.3);
    x.scale(dir, 1);
    // mandíbula, cabeza con cresta del color de su elemento
    x.beginPath(); x.moveTo(-26, 6); x.quadraticCurveTo(0, 16 + open * 10, 34, 10 + open * 12); x.lineTo(30, 4 + open * 6); x.quadraticCurveTo(0, 8, -20, 0); x.closePath(); fi(x, '#3e3e2c', 1.4);
    x.beginPath(); x.moveTo(-30, 2); x.quadraticCurveTo(-24, -26, 4, -24); x.quadraticCurveTo(30, -18, 40, -2 - open * 4); x.quadraticCurveTo(10, 4, -30, 2); x.closePath(); fi(x, lg(x, 0, -26, 0, 4, '#6a6a4a', '#3a3a28'), 1.8);
    for (let k = 0; k < 5; k++) { x.beginPath(); x.moveTo(-24 + k * 9, -18 - (k % 2) * 3); x.lineTo(-30 + k * 9, -36 - k * 2); x.lineTo(-18 + k * 9, -20); x.closePath(); fi(x, E.c1, 0.9, 0.7); }
    x.fillStyle = '#f4ecd8'; for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(8 + k * 7, 2 + open * 3); x.lineTo(10 + k * 7, 8 + open * 7); x.lineTo(12 + k * 7, 2 + open * 3); x.fill(); }
    if (dr) { x.fillStyle = 'rgba(255,90,90,0.5)'; x.beginPath(); x.ellipse(0, -6, 8, 4, 0, 0, TAU); x.fill(); x.strokeStyle = INK; x.lineWidth = 1.6; x.beginPath(); x.moveTo(6, -14); x.lineTo(14, -10); x.stroke(); x.save(); x.translate(4, -46); x.rotate(t * 4); for (let k = 0; k < 3; k++) { x.rotate(TAU / 3); x.fillStyle = '#ffe9a0'; x.font = fontB(12, 900); x.fillText('✶', 8, 0); } x.restore(); }
    else { glow(x, 10, -12, 20, E.c1 + 'aa'); x.fillStyle = E.c0; x.beginPath(); x.ellipse(10, -12, 5, 3, 0.2, 0, TAU); x.fill(); x.fillStyle = INK; x.fillRect(9.5, -15, 1.6, 6); }
    if (h.tele || h.lunge) glow(x, 36, 8, 30, E.c1 + '88');
    if (h.flash > 0) { x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(255,250,235,${Math.min(0.7, h.flash * 5)})`; x.beginPath(); x.ellipse(4, -10, 40, 26, 0, 0, TAU); x.fill(); }
    x.restore();
    // barra de vida y su contrario
    if (h.hp < h.maxHp) { const w = 50, f = h.hp / h.maxHp; x.fillStyle = 'rgba(29,24,23,0.75)'; x.fillRect(h.x - w / 2 - 1, h.y - 104, w + 2, 6); x.fillStyle = E.c1; x.fillRect(h.x - w / 2, h.y - 103, w * f, 4); }
    const C = W3B.COUNTER[h.el]; x.fillStyle = 'rgba(29,24,23,0.8)'; x.beginPath(); x.arc(h.x, h.y - 118, 10, 0, TAU); x.fill(); HUD.icon(x, C, h.x, h.y - 118, 6, ELEMENTS[C].c0);
  }
  /* ---------- el Borrón: mancha de tinta viva con una máscara de ojos rojos ---------- */
  function borron(x, G, b) {
    const t = G.time, sh = b.shield > 0, Y = -80 + Math.sin(t * 1.4) * 8;
    warn(x, G, b); x.save(); x.translate(b.x, b.y); x.scale(1.3, 1.3);
    x.globalAlpha = 0.55; x.drawImage(ArtInk.wash('8,6,10', 1), -120, -20, 240, 60); x.globalAlpha = 1;
    // tentáculos de pincel
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + t * 0.3, L = 90 + Math.sin(t * 2 + k) * 24; stroke(x, [[Math.cos(a) * 30, Y + Math.sin(a) * 20], [Math.cos(a + 0.4) * L * 0.6, Y + Math.sin(a + 0.4) * L * 0.4 + 30], [Math.cos(a + 0.7) * L, Y + Math.sin(a + 0.7) * L * 0.5 + 60]], 14, '#0e0b0e', 0.92); }
    // cuerpo
    x.beginPath(); for (let k = 0; k <= 24; k++) { const a = k / 24 * TAU, r = 64 + Math.sin(a * 5 + t * 3) * 7 + Math.sin(a * 3 - t * 2) * 5; k ? x.lineTo(Math.cos(a) * r, Y + Math.sin(a) * r * 0.9) : x.moveTo(Math.cos(a) * r, Y + Math.sin(a) * r * 0.9); } x.closePath();
    x.fillStyle = sh ? '#0e0b0e' : 'rgba(40,24,50,0.8)'; x.fill(); if (sh) { x.strokeStyle = 'rgba(160,140,200,0.4)'; x.lineWidth = 3; x.stroke(); }
    if (!sh) glow(x, 0, Y, 80, 'rgba(190,110,255,0.8)');
    if (sh) { x.fillStyle = 'rgba(255,255,255,0.18)'; x.beginPath(); x.ellipse(-22, Y - 30, 16, 8, -0.5, 0, TAU); x.fill(); }
    // máscara
    x.beginPath(); x.moveTo(-30, Y - 18); x.quadraticCurveTo(0, Y - 34, 30, Y - 18); x.quadraticCurveTo(26, Y + 20, 0, Y + 26); x.quadraticCurveTo(-26, Y + 20, -30, Y - 18); x.closePath(); fi(x, '#efe6d6', 1.6);
    for (const s of [-1, 1]) { x.fillStyle = INK; x.beginPath(); x.ellipse(s * 12, Y - 8, 8, 5, s * 0.3, 0, TAU); x.fill(); glow(x, s * 12, Y - 8, 14, 'rgba(255,40,70,0.9)'); x.fillStyle = '#ff3050'; x.beginPath(); x.ellipse(s * 12, Y - 8, 3, 2, 0, 0, TAU); x.fill(); }
    x.fillStyle = INK; x.beginPath(); x.moveTo(-14, Y + 8); for (let k = 0; k <= 6; k++) x.lineTo(-14 + k * 4.7, Y + 8 + (k % 2 ? 6 : 0)); x.lineTo(14, Y + 14); x.quadraticCurveTo(0, Y + 18, -14, Y + 8); x.fill();
    x.strokeStyle = '#c8281e'; x.lineWidth = 2; x.beginPath(); x.moveTo(-6, Y - 26); x.lineTo(0, Y - 18); x.lineTo(6, Y - 26); x.stroke();
    // gotas que caen
    for (let k = 0; k < 6; k++) { const p = (t * 0.8 + k / 6) % 1; x.fillStyle = `rgba(14,11,14,${1 - p})`; x.beginPath(); x.arc(-40 + k * 16, Y + 50 + p * 60, 4 * (1 - p) + 1, 0, TAU); x.fill(); }
    if (b.flash > 0) { x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(255,250,235,${Math.min(0.6, b.flash * 5)})`; x.beginPath(); x.ellipse(0, Y, 70, 60, 0, 0, TAU); x.fill(); }
    x.restore();
  }
  /* ---------- copias de tinta (silueta de mago en tinta, ojos rojos) y tinajas de sake ---------- */
  function copy(x, G, c) {
    const t = c.t, a = c.spawnT > 0 ? 1 - c.spawnT / 0.6 : 1, Y = -26 + Math.sin(t * 6) * 2;
    x.save(); x.translate(c.x, c.y); x.globalAlpha = a * 0.92; shadow(x, 0, 3, 22, 0.5);
    x.beginPath(); x.moveTo(-14, 0); x.quadraticCurveTo(-16, Y - 10, -8, Y - 20); x.lineTo(8, Y - 20); x.quadraticCurveTo(16, Y - 10, 14, 0); for (let k = 0; k <= 5; k++) x.lineTo(14 - k * 5.6, (k % 2 ? -5 : 2) + Math.sin(t * 8 + k) * 2); x.closePath(); x.fillStyle = '#0e0b0e'; x.fill();
    x.beginPath(); x.arc(0, Y - 28, 11, 0, TAU); x.fill(); x.beginPath(); x.moveTo(-14, Y - 30); x.lineTo(0, Y - 58); x.lineTo(14, Y - 30); x.closePath(); x.fill();
    for (const s of [-1, 1]) { x.fillStyle = '#ff3050'; x.beginPath(); x.ellipse(s * 4, Y - 28, 2.4, 1.4, 0, 0, TAU); x.fill(); }
    if (c.els) c.els.forEach((el, k) => { const E = ELEMENTS[el]; glow(x, (k ? 1 : -1) * 18, Y - 8, 14, E.c1 + 'aa'); });
    if (c.flash > 0) { x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(255,250,235,${Math.min(0.7, c.flash * 5)})`; x.beginPath(); x.ellipse(0, Y - 14, 20, 34, 0, 0, TAU); x.fill(); }
    x.restore();
  }
  function jar(x, G, u) {
    x.save(); x.translate(u.x, u.y); shadow(x, 0, 3, 24, 0.45);
    x.beginPath(); x.moveTo(-14, 0); x.quadraticCurveTo(-24, -24, -12, -40); x.lineTo(12, -40); x.quadraticCurveTo(24, -24, 14, 0); x.closePath(); fi(x, lg(x, -20, 0, 20, 0, '#d8c8a8', '#a08a60'), 1.5);
    x.beginPath(); x.ellipse(0, -42, 12, 4, 0, 0, TAU); fi(x, '#4a3a2a', 1.2); x.fillStyle = '#c8281e'; x.fillRect(-9, -28, 18, 14); x.fillStyle = '#fff4e0'; x.font = fontB(10, 900); x.textAlign = 'center'; x.fillText('酒', 0, -17);
    x.strokeStyle = '#2a1a10'; x.lineWidth = 2; x.beginPath(); x.moveTo(-12, -34); x.lineTo(12, -34); x.stroke();
    if (u.flash > 0) { x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(255,250,235,${u.flash * 4})`; x.beginPath(); x.arc(0, -20, 22, 0, TAU); x.fill(); }
    x.restore();
  }
  /* ---------- barras de los jefes ---------- */
  function bar(x, X, Y, w, f, col, name, u, sh, shCol) { x.fillStyle = 'rgba(29,24,23,0.72)'; HUD.rr(x, X - 8, Y - 24 * u, w + 16, 42 * u, 10 * u); x.fill(); x.font = fontT(14 * u); x.textAlign = 'center'; x.fillStyle = '#f4e6c8'; x.fillText(name, X + w / 2, Y - 10 * u); x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(X, Y, w, 9 * u); x.fillStyle = col; x.fillRect(X, Y, w * clamp(f, 0, 1), 9 * u); if (sh != null) { x.fillStyle = shCol || '#c9b8ff'; x.fillRect(X, Y - 3 * u, w * clamp(sh, 0, 1), 3 * u); } }
  function hud(x, G, sw, sh, u) {
    const B = G.boss, cx = sw / 2, by = sh - 40 * u - (getInsets().bottom || 0) * (isTouch() ? 1.6 : 0); x.textBaseline = 'middle';
    if (B.w3boss === 'kitsune') { bar(x, cx - 180 * u, by, 360 * u, B.hp / B.maxHp, '#e86a4a', Camp.BOSS.kitsune.name, u); return true; }
    if (B.w3boss === 'raijin' || B.w3boss === 'fujin') { const R = G.units.find(q => q.w3boss === 'raijin'), F = G.units.find(q => q.w3boss === 'fujin'); [R, F].forEach((g, k) => { if (!g) return; const X = cx + (k ? 20 * u : -300 * u), f = g.down ? 0 : g.alive ? g.hp / g.maxHp : 0; bar(x, X, by, 280 * u, f, k ? '#7ac86a' : '#b89aff', g.down ? `${k ? 'Fujin' : 'Raijin'} · caído (${Math.ceil(g.downT)} s)` : Camp.BOSS[g.w3boss].name, u); }); if (W3B.shieldK(G) < 1) { x.font = fontB(12 * u, 900); x.fillStyle = '#e6d8ff'; x.fillText('⛓ juntos se protegen', cx, by + 20 * u); } return true; }
    if (B.w3boss === 'orochi') { const H = B.heads || []; x.fillStyle = 'rgba(29,24,23,0.72)'; HUD.rr(x, cx - 200 * u, by - 30 * u, 400 * u, 48 * u, 10 * u); x.fill(); x.font = fontT(14 * u); x.textAlign = 'center'; x.fillStyle = '#f4e6c8'; x.fillText(Camp.BOSS.orochi.name, cx, by - 16 * u);
      H.forEach((h, k) => { const X = cx - 168 * u + k * 48 * u, Y = by + 6 * u, E = ELEMENTS[h.el]; x.fillStyle = h.alive ? E.c2 : 'rgba(60,60,60,0.6)'; x.beginPath(); x.arc(X, Y, 11 * u, 0, TAU); x.fill(); HUD.icon(x, h.el, X, Y, 6.5 * u, h.alive ? E.c0 : 'rgba(150,150,150,0.6)'); if (h.alive && h.hp < h.maxHp) { x.strokeStyle = E.c1; x.lineWidth = 2.5 * u; x.beginPath(); x.arc(X, Y, 13.5 * u, -Math.PI / 2, -Math.PI / 2 + h.hp / h.maxHp * TAU); x.stroke(); } if (!h.alive) { x.strokeStyle = '#c8281e'; x.lineWidth = 2.5 * u; x.beginPath(); x.moveTo(X - 9 * u, Y - 9 * u); x.lineTo(X + 9 * u, Y + 9 * u); x.stroke(); } if (h.drunk > 0) { x.font = fontB(11 * u, 900); x.fillStyle = '#ffe9a0'; x.fillText('zzz', X, Y - 18 * u); } }); return true; }
    if (B.w3boss === 'borron') { bar(x, cx - 180 * u, by, 360 * u, B.hp / B.maxHp, '#9a5ad0', Camp.BOSS.borron.name, u, B.maxShield ? B.shield / B.maxShield : null, '#2a2430'); return true; }
    return false;
  }
  return { boss, hud, copy, jar, warn, tomoe };
})();
