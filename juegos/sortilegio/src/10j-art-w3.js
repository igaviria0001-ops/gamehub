/* =========================================================================
   ARTE DEL MUNDO 3 — criaturas, objetos y escenografía pintados con tinta:
   contorno de pincel negro que se engrosa abajo, aguadas planas de color,
   brillo de papel. Kappa, tengu, kasa-obake, oni, armadura samurái, farol
   embrujado, criatura de nieve y Yuki-onna; casas de Shirakawa-go, puestos
   de papel, molinete, tablillas, cuerda, sellos rojos, muros del castillo,
   casas de madera de Kioto, lotos, enredadera, seto podado, el ensō de la
   salida y el muro de tinta del Borrón. También fuegos artificiales y
   ventisca, y las luces de todo esto para la noche.
   ========================================================================= */
const ArtW3 = (() => {
  const INK = '#1d1817', INKRGB = '29,24,23';
  const rnd = (i, k) => hash2(i * 1.37 + k * 17.1, k * 3.71 - i * 0.23);
  const lg = (x, x0, y0, x1, y1, ...st) => { const g = x.createLinearGradient(x0, y0, x1, y1); st.forEach((c, i) => g.addColorStop(i / (st.length - 1), c)); return g; };
  const rg = (x, cx, cy, r0, r1, ...st) => { const g = x.createRadialGradient(cx, cy, r0, cx, cy, r1); st.forEach((c, i) => g.addColorStop(i / (st.length - 1), c)); return g; };
  // relleno con contorno de tinta (más grueso abajo si se pide)
  const fi = (x, fill, lw = 1.5, a = 0.92) => { x.fillStyle = fill; x.fill(); x.strokeStyle = `rgba(${INKRGB},${a})`; x.lineWidth = lw; x.stroke(); };
  const glow = (x, X, Y, r, col) => { x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = rg(x, X, Y, 0, r, col, 'rgba(0,0,0,0)'); x.beginPath(); x.arc(X, Y, r, 0, TAU); x.fill(); x.restore(); };
  const shadow = (x, X, Y, rx, a = 0.32) => { const ga = x.globalAlpha; x.globalAlpha = ga * a * 1.4; x.drawImage(ArtInk.wash('40,30,30', 1), X - rx, Y - rx * 0.3, rx * 2, rx * 0.6); x.globalAlpha = ga; };
  const stroke = (x, pts, w, col = INK, a = 0.9) => ArtInk.brush(x, pts, w, col, a, 0.25);
  const eyeDot = (x, X, Y, r, col = INK) => { x.fillStyle = col; x.beginPath(); x.arc(X, Y, r, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,255,255,0.9)'; x.beginPath(); x.arc(X - r * 0.35, Y - r * 0.35, r * 0.32, 0, TAU); x.fill(); };
  const seaOf = (G, X, Y) => (ArtInk.seenAt ? ArtInk.seenAt(G, X, Y) : Seasons.at(G, X, Y)) || 'spring';

  /* ====================== CRIATURAS ====================== */
  const looks = { kappa: 1, tengu: 1, kasa: 1, oni: 1, yoroi: 1, chochin: 1, yukiko: 1, yukionna: 1, tinta: 1 };
  function creature(x, G, c) {
    if (c.D.look === 'tinta') return ArtW3B.copy(x, G, c);
    const t = c.t, a = c.spawnT > 0 ? 1 - c.spawnT / 0.6 : 1, R = c.r, dir = (c.faceA != null ? Math.cos(c.faceA) : c.vx) >= 0 ? 1 : -1, mv = hypot(c.vx, c.vy), L = c.D.look;
    x.save(); x.translate(c.x, c.y); x.globalAlpha = a * (c.st.hidden > 0 ? 0.4 : 1);
    // aviso de ataque (anillo o cono que se llena)
    if (c.warn && c.warn.t > 0) { const w = c.warn, f = 1 - Math.max(0, (c.slamT || c.fuseT || c.tele || 0)) / (w.max || 0.6), E = ELEMENTS[w.el] || ELEMENTS.fire; x.save(); x.globalAlpha = 0.85;
      if (w.cone != null) { x.fillStyle = `rgba(200,230,255,${0.12 + f * 0.2})`; x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, w.r, w.cone - 0.45, w.cone + 0.45); x.closePath(); x.fill(); x.strokeStyle = 'rgba(120,170,220,0.8)'; x.lineWidth = 2; x.stroke(); }
      else { x.strokeStyle = E.c1; x.lineWidth = 2.5; x.setLineDash([8, 6]); x.beginPath(); x.ellipse(0, 0, w.r, w.r * 0.55, 0, 0, TAU); x.stroke(); x.setLineDash([]); x.fillStyle = E.c1 + '44'; x.beginPath(); x.ellipse(0, 0, w.r * f, w.r * 0.55 * f, 0, 0, TAU); x.fill(); }
      x.restore(); }
    if (c.spawnT > 0) { x.save(); x.strokeStyle = INK; x.lineWidth = 3; x.globalAlpha = (1 - a) * 0.8; x.beginPath(); x.arc(0, 0, R * (2.6 - a * 1.4), 0, TAU * a); x.stroke(); x.restore(); x.scale(0.5 + a * 0.5, 0.5 + a * 0.5); }
    if (c.D.fly) shadow(x, 0, 4, R * 1.2, 0.25); else shadow(x, 0, 3, R * 1.25);
    const fl = c.flash > 0;
    switch (L) {
      case 'kappa': kappa(x, G, c, t, R, dir, mv); break;
      case 'tengu': tengu(x, G, c, t, R, dir, mv); break;
      case 'kasa': kasa(x, G, c, t, R, dir, mv); break;
      case 'oni': oni(x, G, c, t, R, dir, mv); break;
      case 'yoroi': yoroi(x, G, c, t, R, dir, mv); break;
      case 'chochin': chochin(x, G, c, t, R, dir, mv); break;
      case 'yukiko': yukiko(x, G, c, t, R, dir, mv); break;
      case 'yukionna': yukionna(x, G, c, t, R, dir, mv); break;
    }
    if (fl) { x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(255,250,235,${Math.min(0.7, c.flash * 5)})`; x.beginPath(); x.ellipse(0, -R * 1.4, R * 1.3, R * 1.7, 0, 0, TAU); x.fill(); x.globalCompositeOperation = 'source-over'; }
    if (c.weakHit > 0) { x.globalAlpha = c.weakHit * 3; x.font = fontB(13, 900); x.textAlign = 'center'; x.fillStyle = '#ffe9a0'; x.strokeStyle = INK; x.lineWidth = 3; x.strokeText('¡débil!', 0, -R * 3.4); x.fillText('¡débil!', 0, -R * 3.4); }
    x.restore();
    // barra de vida de los grandes
    if (c.D.heavy && c.alive && c.hp < c.maxHp && !(c.kind === 'yoroi' && !c.awake)) { const w = c.boss3 || c.kind === 'yukionna' ? 70 : 46, f = c.hp / c.maxHp; x.fillStyle = 'rgba(29,24,23,0.75)'; x.fillRect(c.x - w / 2 - 1, c.y - R * 3.6 - 1, w + 2, 6); x.fillStyle = f < 0.3 ? '#e0543a' : '#c43a2a'; x.fillRect(c.x - w / 2, c.y - R * 3.6, w * f, 4); }
  }
  // kappa: caparazón verde oscuro, piel de rana, pico amarillo y el plato de agua en la cabeza
  function kappa(x, G, c, t, R, dir, mv) {
    const st = Math.sin(t * 10) * Math.min(1, mv / 60), Y = -R * 1.3 + Math.abs(st) * -2; x.scale(dir, 1);
    for (const s of [-1, 1]) stroke(x, [[s * 6, Y + R * 0.6], [s * 8 + st * s * 4, Y + R * 1.1], [s * 9 + st * s * 6, -1]], 5, '#4f7a3a');
    x.beginPath(); x.ellipse(-4, Y, R * 1.0, R * 1.05, 0.15, 0, TAU); fi(x, lg(x, 0, Y - R, 0, Y + R, '#5f7a40', '#2e4a26'), 1.8);
    x.strokeStyle = 'rgba(20,30,16,0.6)'; x.lineWidth = 1; for (let k = -1; k <= 1; k++) { x.beginPath(); x.moveTo(-4 - R * 0.6, Y + k * 7); x.quadraticCurveTo(-4, Y + k * 7 - 3, -4 + R * 0.6, Y + k * 7); x.stroke(); }
    x.beginPath(); x.ellipse(5, Y + 2, R * 0.6, R * 0.8, 0, 0, TAU); fi(x, '#a9c27a', 1.3);
    // brazo y mano palmeada estirada (agarra)
    stroke(x, [[6, Y], [14, Y + 2], [20 + st * 2, Y - 4]], 4.5, '#8aab5e'); x.fillStyle = '#8aab5e'; x.beginPath(); x.moveTo(20, Y - 4); for (let k = 0; k < 3; k++) x.lineTo(25 + k * 1.5, Y - 9 + k * 4); x.closePath(); x.fill();
    const hy = Y - R * 1.05; x.beginPath(); x.ellipse(4, hy, R * 0.72, R * 0.66, 0, 0, TAU); fi(x, '#9cbc6c', 1.6);
    x.beginPath(); x.moveTo(R * 0.55, hy - 1); x.quadraticCurveTo(R * 1.25, hy + 2, R * 0.5, hy + 6); x.closePath(); fi(x, '#e8c040', 1.2);
    eyeDot(x, 8, hy - 3, 2.4);
    // el plato de agua (si se derrama, se debilita… aquí solo brilla)
    x.beginPath(); x.ellipse(2, hy - R * 0.62, R * 0.55, R * 0.2, 0, 0, TAU); fi(x, '#d8e4d0', 1.2); x.fillStyle = 'rgba(120,180,220,0.9)'; x.beginPath(); x.ellipse(2, hy - R * 0.62, R * 0.4, R * 0.12, 0, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = 1; x.beginPath(); x.arc(2 + Math.sin(t * 2) * 3, hy - R * 0.64, 2.5 + (t * 3 % 1) * 4, Math.PI, TAU); x.stroke();
    x.strokeStyle = INK; x.lineWidth = 1.2; for (let k = 0; k < 5; k++) { x.beginPath(); x.moveTo(-R * 0.5 + k * 4, hy - R * 0.5); x.lineTo(-R * 0.6 + k * 4.2, hy - R * 0.85); x.stroke(); }
  }
  // tengu cuervo: cabeza de cuervo, ropas de monje de montaña con borlas, alas negras que baten
  function tengu(x, G, c, t, R, dir, mv) {
    const Y = -R * 2.6 + Math.sin(t * 6) * 4, fl = Math.sin(t * 14) * 0.6; x.scale(dir, 1);
    for (const s of [-1, 1]) { x.save(); x.translate(-2, Y - 4); x.scale(s, 1); x.rotate(-0.4 + fl * s * 0.5);
      x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(R * 1.2, -R * 1.4, R * 2.6, -R * 0.6); for (let k = 0; k < 5; k++) { const f = 1 - k / 5; x.quadraticCurveTo(R * 2.4 * f + 6, -R * 0.2 + 6, R * 2.2 * f, R * 0.25 * (1 - f) + 4); } x.closePath(); fi(x, lg(x, 0, 0, R * 2.6, 0, '#2a2630', '#0e0c12'), 1.2);
      x.strokeStyle = 'rgba(120,120,150,0.5)'; x.lineWidth = 0.8; for (let k = 1; k < 5; k++) { x.beginPath(); x.moveTo(R * 0.3, -2); x.lineTo(R * 2.4 * (1 - k / 6), 2); x.stroke(); } x.restore(); }
    x.beginPath(); x.moveTo(-R * 0.7, Y + R * 1.1); x.lineTo(-R * 0.5, Y - R * 0.3); x.lineTo(R * 0.5, Y - R * 0.3); x.lineTo(R * 0.8, Y + R * 1.1); x.closePath(); fi(x, lg(x, 0, Y - R, 0, Y + R, '#ece4d0', '#bfb49a'), 1.5);
    for (let k = 0; k < 3; k++) { x.fillStyle = k === 1 ? '#c43a2a' : '#e8e0c8'; x.beginPath(); x.arc(-R * 0.25 + k * R * 0.25, Y + R * 0.05, 2.6, 0, TAU); x.fill(); x.strokeStyle = INK; x.lineWidth = 0.8; x.stroke(); }
    const hy = Y - R * 0.85; x.beginPath(); x.ellipse(0, hy, R * 0.6, R * 0.62, 0, 0, TAU); fi(x, '#201c24', 1.4);
    x.beginPath(); x.moveTo(R * 0.4, hy - 3); x.lineTo(R * 1.35, hy + 3); x.lineTo(R * 0.4, hy + 5); x.closePath(); fi(x, '#d8a030', 1.1);
    x.fillStyle = '#ffd040'; x.beginPath(); x.arc(R * 0.2, hy - 3, 2.4, 0, TAU); x.fill(); x.fillStyle = INK; x.beginPath(); x.arc(R * 0.25, hy - 3, 1.1, 0, TAU); x.fill();
    x.beginPath(); x.rect(-R * 0.3, hy - R * 0.85, R * 0.5, R * 0.3); fi(x, '#1a1418', 1);
  }
  // kasa-obake: paraguas de papel bermellón con un ojo, lengua larga y una sola pierna que salta
  function kasa(x, G, c, t, R, dir, mv) {
    const hop = Math.abs(Math.sin(t * 7)) * (mv > 20 ? 12 : 4), Y = -R * 1.6 - hop; x.scale(dir, 1);
    stroke(x, [[0, Y + R * 0.6], [1, -hop * 0.5 - 2], [0, -1]], 4.2, '#c8a070');
    x.fillStyle = '#a87850'; x.beginPath(); x.ellipse(2, -1, 7, 3, 0, 0, TAU); x.fill();
    const cov = c.blockT > 0, rx = R * 1.5, ry = R * 1.15;
    x.save(); x.translate(0, Y); x.rotate(cov ? 0.5 : Math.sin(t * 3) * 0.08);
    x.beginPath(); x.moveTo(-rx, ry * 0.25); x.quadraticCurveTo(-rx * 0.9, -ry * 0.9, 0, -ry * 1.25); x.quadraticCurveTo(rx * 0.9, -ry * 0.9, rx, ry * 0.25); for (let k = 5; k >= 0; k--) x.quadraticCurveTo(-rx + rx * 2 * (k + 0.5) / 6, ry * 0.45, -rx + rx * 2 * k / 6, ry * 0.25); x.closePath();
    fi(x, lg(x, 0, -ry, 0, ry * 0.4, '#e8604a', '#c0331e', '#8e1f10'), 1.8);
    x.strokeStyle = 'rgba(60,20,10,0.55)'; x.lineWidth = 1; for (let k = 0; k <= 6; k++) { x.beginPath(); x.moveTo(0, -ry * 1.2); x.quadraticCurveTo(-rx + rx * 2 * k / 6, -ry * 0.4, -rx + rx * 2 * k / 6, ry * 0.25); x.stroke(); }
    x.fillStyle = 'rgba(255,230,200,0.25)'; x.beginPath(); x.ellipse(-rx * 0.35, -ry * 0.55, rx * 0.25, ry * 0.3, -0.5, 0, TAU); x.fill();
    x.beginPath(); x.ellipse(rx * 0.12, -ry * 0.25, 7, 6, 0, 0, TAU); fi(x, '#fffdf0', 1.3); eyeDot(x, rx * 0.12 + 1.5, -ry * 0.25 + 0.5, 3.2);
    x.beginPath(); x.moveTo(rx * 0.25, ry * 0.05); x.quadraticCurveTo(rx * 0.7, ry * 0.4 + Math.sin(t * 8) * 4, rx * 0.5, ry * 0.75); x.quadraticCurveTo(rx * 0.45, ry * 0.4, rx * 0.15, ry * 0.12); fi(x, '#e8506a', 1);
    x.restore();
    if (cov) { x.save(); x.globalAlpha *= c.blockT * 2.5; x.strokeStyle = '#fff8e0'; x.lineWidth = 2.5; x.beginPath(); x.arc(R * 1.2, Y, R * 1.6, -0.8, 0.8); x.stroke(); x.restore(); }
  }
  // oni del trueno: piel roja, cuernos, taparrabo de tigre, garrote de hierro con púas
  function oni(x, G, c, t, R, dir, mv) {
    const slam = c.slamT > 0 ? 1 - c.slamT / 0.75 : 0, wob = Math.sin(t * 6) * Math.min(1, mv / 50) * 3, Y = -R * 1.5; x.scale(dir, 1);
    for (const s of [-1, 1]) stroke(x, [[s * 8, Y + R * 0.6], [s * 10 + wob * s, Y + R * 1.2], [s * 11, -2]], 9, '#b8402c');
    x.beginPath(); x.moveTo(-R * 0.75, Y + R * 0.2); x.lineTo(R * 0.75, Y + R * 0.2); x.lineTo(R * 0.6, Y + R * 0.85); x.lineTo(-R * 0.6, Y + R * 0.85); x.closePath(); fi(x, '#e8b840', 1.4);
    x.strokeStyle = INK; x.lineWidth = 2.2; for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(-R * 0.55 + k * R * 0.35, Y + R * 0.25); x.quadraticCurveTo(-R * 0.45 + k * R * 0.35, Y + R * 0.5, -R * 0.6 + k * R * 0.35, Y + R * 0.8); x.stroke(); }
    x.beginPath(); x.ellipse(0, Y - R * 0.35, R * 0.95, R * 0.75, 0, 0, TAU); fi(x, lg(x, 0, Y - R, 0, Y + R * 0.3, '#e8604a', '#b8352a'), 2);
    x.strokeStyle = 'rgba(90,20,10,0.5)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(-R * 0.3, Y - R * 0.6); x.quadraticCurveTo(0, Y - R * 0.3, R * 0.3, Y - R * 0.6); x.stroke();
    const hy = Y - R * 1.35; x.beginPath(); x.ellipse(0, hy, R * 0.62, R * 0.58, 0, 0, TAU); fi(x, '#d84a36', 1.8);
    for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * R * 0.3, hy - R * 0.4); x.quadraticCurveTo(s * R * 0.55, hy - R * 1.0, s * R * 0.2, hy - R * 1.25); x.lineTo(s * R * 0.12, hy - R * 0.5); x.closePath(); fi(x, '#f2e6c8', 1.2); }
    x.fillStyle = INK; x.beginPath(); x.moveTo(-R * 0.6, hy - R * 0.45); for (let k = 0; k < 6; k++) x.lineTo(-R * 0.55 + k * R * 0.22, hy - R * 0.6 - (k % 2) * 6); x.lineTo(R * 0.6, hy - R * 0.4); x.closePath(); x.fill();
    for (const s of [-1, 1]) { x.fillStyle = '#ffe070'; x.beginPath(); x.ellipse(s * R * 0.22 + 3, hy - 2, 3.4, 2.4, 0, 0, TAU); x.fill(); x.fillStyle = INK; x.beginPath(); x.arc(s * R * 0.22 + 4, hy - 2, 1.4, 0, TAU); x.fill(); }
    x.strokeStyle = INK; x.lineWidth = 1.5; x.beginPath(); x.moveTo(-R * 0.25, hy + R * 0.3); x.lineTo(R * 0.35, hy + R * 0.3); x.stroke(); for (const s of [-1, 1]) { x.fillStyle = '#fff'; x.beginPath(); x.moveTo(s * R * 0.2, hy + R * 0.3); x.lineTo(s * R * 0.24, hy + R * 0.12); x.lineTo(s * R * 0.28, hy + R * 0.3); x.fill(); }
    // garrote: se alza durante el aviso y baja de golpe
    x.save(); x.translate(R * 0.8, Y - R * 0.3); x.rotate(c.slamT > 0 ? -2.2 + slam * 0.4 : -0.5 + Math.sin(t * 2) * 0.1 + (c.slamCd > 3.6 ? 1.4 : 0));
    x.beginPath(); x.moveTo(-3, 0); x.lineTo(-6, -R * 2.2); x.lineTo(6, -R * 2.2); x.lineTo(3, 0); x.closePath(); fi(x, lg(x, -6, 0, 6, 0, '#5a5560', '#2a262e'), 1.4);
    x.fillStyle = '#c8c0b0'; for (let k = 0; k < 4; k++) for (const s of [-1, 1]) { x.beginPath(); x.arc(s * 6, -R * 0.7 - k * R * 0.4, 2, 0, TAU); x.fill(); }
    x.restore();
    if (c.slamT > 0) glow(x, R * 0.8, Y - R * 2.4, 40 + slam * 30, 'rgba(190,150,255,0.6)');
  }
  // armadura samurái: laca negra y cordones rojos, casco con cuernos dorados; dormida, arrodillada y sin luz
  function yoroi(x, G, c, t, R, dir, mv) {
    const awake = c.awake, Y = awake ? -R * 1.6 : -R * 1.0, rush = c.rush > 0; x.scale(dir, 1);
    if (rush) { x.globalAlpha *= 0.9; for (let k = 1; k <= 3; k++) { x.save(); x.translate(-k * 14, 0); x.globalAlpha *= 0.18; x.fillStyle = INK; x.beginPath(); x.ellipse(0, Y, R * 0.8, R * 1.2, 0, 0, TAU); x.fill(); x.restore(); } }
    if (awake) for (const s of [-1, 1]) stroke(x, [[s * 7, Y + R * 0.7], [s * 9, Y + R * 1.2], [s * 9, -2]], 8, '#2a2428');
    else { x.beginPath(); x.ellipse(0, -6, R * 1.1, R * 0.45, 0, 0, TAU); fi(x, '#2a2428', 1.4); }
    // faldones (kusazuri) con cordones
    for (let k = -2; k <= 2; k++) { x.beginPath(); x.rect(k * R * 0.32 - R * 0.15, Y + R * 0.35, R * 0.3, R * 0.6); fi(x, '#1e1a1e', 1); x.strokeStyle = '#c43a2a'; x.lineWidth = 1.2; for (let q = 1; q < 3; q++) { x.beginPath(); x.moveTo(k * R * 0.32 - R * 0.15, Y + R * 0.35 + q * R * 0.2); x.lineTo(k * R * 0.32 + R * 0.15, Y + R * 0.35 + q * R * 0.2); x.stroke(); } }
    x.beginPath(); x.moveTo(-R * 0.75, Y - R * 0.6); x.lineTo(R * 0.75, Y - R * 0.6); x.lineTo(R * 0.6, Y + R * 0.4); x.lineTo(-R * 0.6, Y + R * 0.4); x.closePath(); fi(x, lg(x, 0, Y - R * 0.6, 0, Y + R * 0.4, '#3a3238', '#141014'), 1.8);
    x.strokeStyle = '#c43a2a'; x.lineWidth = 1.4; for (let q = 0; q < 4; q++) { x.beginPath(); x.moveTo(-R * 0.65, Y - R * 0.4 + q * R * 0.22); x.lineTo(R * 0.65, Y - R * 0.4 + q * R * 0.22); x.stroke(); }
    for (const s of [-1, 1]) { x.beginPath(); x.ellipse(s * R * 0.85, Y - R * 0.5, R * 0.35, R * 0.22, s * 0.3, 0, TAU); fi(x, '#2a2428', 1.2); }
    const hy = Y - R * 1.1; x.beginPath(); x.arc(0, hy, R * 0.55, Math.PI, TAU); x.lineTo(R * 0.75, hy + R * 0.2); x.lineTo(-R * 0.75, hy + R * 0.2); x.closePath(); fi(x, '#201a1e', 1.6);
    x.strokeStyle = '#d8a83a'; x.lineWidth = 3; x.lineCap = 'round'; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * 3, hy - R * 0.35); x.quadraticCurveTo(s * R * 0.7, hy - R * 0.9, s * R * 0.55, hy - R * 1.3); x.stroke(); }
    x.fillStyle = '#3a2a1e'; x.fillRect(-R * 0.4, hy - R * 0.05, R * 0.8, R * 0.35); x.strokeStyle = INK; x.lineWidth = 1; x.strokeRect(-R * 0.4, hy - R * 0.05, R * 0.8, R * 0.35);
    if (awake) { for (const s of [-1, 1]) { glow(x, s * R * 0.18 + 2, hy + R * 0.1, 10, 'rgba(255,90,50,0.9)'); x.fillStyle = '#ffd0a0'; x.beginPath(); x.ellipse(s * R * 0.18 + 2, hy + R * 0.1, 2.6, 1.4, 0, 0, TAU); x.fill(); } }
    else { x.fillStyle = 'rgba(60,40,30,0.6)'; for (const s of [-1, 1]) x.fillRect(s * R * 0.18 - 1, hy + R * 0.08, 5, 1.5); const p = (t * 0.4) % 1; x.globalAlpha *= (1 - p) * 0.6; x.font = fontB(10, 800); x.textAlign = 'center'; x.fillStyle = INK; x.fillText('z', R * 0.6 + p * 6, hy - R * 0.4 - p * 16); }
    // la katana
    if (awake) { x.save(); x.translate(R * 0.7, Y); x.rotate(rush ? -0.2 : 0.9 + Math.sin(t * 3) * 0.1); x.fillStyle = '#e8ece8'; x.beginPath(); x.moveTo(0, -2); x.quadraticCurveTo(R * 1.3, -6, R * 2.2, -1); x.lineTo(0, 2); x.fill(); x.strokeStyle = INK; x.lineWidth = 0.9; x.stroke(); x.fillStyle = '#1a1418'; x.fillRect(-8, -2.5, 8, 5); x.fillStyle = '#d8a83a'; x.fillRect(-1, -4, 2.4, 8); x.restore(); }
  }
  // farol embrujado: papel rojo con costillas, una boca rajada y un ojo; antes de reventar se hincha y quema
  function chochin(x, G, c, t, R, dir, mv) {
    const fu = c.fuseT > 0 ? 1 - c.fuseT / 0.55 : 0, Y = -R * 2.4 + Math.sin(t * 3) * 5, sw = 1 + fu * 0.35 + Math.sin(t * 40) * fu * 0.06, h = R * 1.5 * sw, w = R * 1.05 * sw; x.scale(dir, 1);
    glow(x, 0, Y, R * 3.2 + fu * 30, `rgba(255,${150 - fu * 60},60,${0.55 + fu * 0.3})`);
    x.fillStyle = '#1d1817'; x.fillRect(-w * 0.55, Y - h - 4, w * 1.1, 5); x.fillRect(-w * 0.55, Y + h - 1, w * 1.1, 5);
    x.beginPath(); x.ellipse(0, Y, w, h, 0, 0, TAU); fi(x, rg(x, -w * 0.2, Y - h * 0.2, 2, h * 1.2, '#fff3c0', '#f08a3a', '#b8301e'), 1.6);
    x.strokeStyle = 'rgba(90,20,10,0.5)'; x.lineWidth = 1; for (let k = -3; k <= 3; k++) { x.beginPath(); x.ellipse(0, Y + k * h * 0.27, w * Math.sqrt(1 - (k * 0.27) ** 2), 2.2, 0, 0, Math.PI); x.stroke(); }
    eyeDot(x, w * 0.25, Y - h * 0.3, 3.6); x.beginPath(); x.moveTo(-w * 0.6, Y + h * 0.05); x.quadraticCurveTo(0, Y + h * 0.55, w * 0.7, Y + h * 0.1); x.quadraticCurveTo(0, Y + h * 0.3, -w * 0.6, Y + h * 0.05); fi(x, '#3a0e08', 1.2);
    x.beginPath(); x.moveTo(w * 0.1, Y + h * 0.3); x.quadraticCurveTo(w * 0.3, Y + h * 1.1 + Math.sin(t * 9) * 4, w * 0.05, Y + h * 1.3); x.quadraticCurveTo(-w * 0.05, Y + h * 0.8, -w * 0.05, Y + h * 0.3); fi(x, '#e8506a', 1);
  }
  // criatura de nieve: bola de nieve con ojos de carbón y bracitos de rama
  function yukiko(x, G, c, t, R, dir, mv) {
    const Y = -R * 1.1 + Math.abs(Math.sin(t * 8)) * -3 * Math.min(1, mv / 40); x.scale(dir, 1);
    x.beginPath(); x.ellipse(0, Y, R * 1.05, R * 0.95, 0, 0, TAU); fi(x, rg(x, -R * 0.3, Y - R * 0.4, 2, R * 1.3, '#ffffff', '#e6eef8', '#9ab0d0'), 1.5);
    x.beginPath(); x.ellipse(0, Y - R * 1.05, R * 0.66, R * 0.6, 0, 0, TAU); fi(x, rg(x, -R * 0.2, Y - R * 1.3, 1, R * 0.8, '#ffffff', '#dbe6f4', '#a2b6d4'), 1.4);
    eyeDot(x, R * 0.08, Y - R * 1.12, 2.2); eyeDot(x, R * 0.38, Y - R * 1.1, 2.2);
    x.strokeStyle = '#4a3a2a'; x.lineWidth = 1.8; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * R * 0.8, Y - R * 0.2); x.lineTo(s * R * 1.5, Y - R * 0.7 + Math.sin(t * 9 + s) * 3); x.lineTo(s * R * 1.65, Y - R * 1.0); x.stroke(); }
    x.fillStyle = '#e8803a'; x.beginPath(); x.moveTo(R * 0.25, Y - R * 0.98); x.lineTo(R * 0.8, Y - R * 0.92); x.lineTo(R * 0.25, Y - R * 0.86); x.fill();
  }
  // Yuki-onna: kimono blanco con obi azul, pelo negro largo que flota, piel de hielo; casi transparente cuando se esfuma
  function yukionna(x, G, c, t, R, dir, mv) {
    const Y = -R * 2.4 + Math.sin(t * 1.6) * 4, br = c.breath > 0 || c.tele > 0; x.scale(dir, 1); x.globalAlpha *= 0.88;
    glow(x, 0, Y, R * 4, 'rgba(180,220,255,0.35)');
    x.beginPath(); x.moveTo(-R * 0.6, Y - R * 0.4); x.quadraticCurveTo(-R * 1.1, Y + R * 1.4, -R * 1.3 + Math.sin(t * 2) * 4, Y + R * 2.4); for (let k = 0; k <= 6; k++) x.lineTo(-R * 1.3 + k * R * 0.45, Y + R * 2.4 + (k % 2 ? -6 : 3) + Math.sin(t * 4 + k) * 3); x.quadraticCurveTo(R * 0.9, Y + R * 1.2, R * 0.6, Y - R * 0.4); x.closePath();
    fi(x, lg(x, 0, Y - R, 0, Y + R * 2.4, '#ffffff', '#e8f0fa', 'rgba(200,220,245,0.35)'), 1.3, 0.6);
    x.fillStyle = '#3a5a9a'; x.fillRect(-R * 0.62, Y + R * 0.2, R * 1.24, R * 0.32); x.strokeStyle = 'rgba(29,24,23,0.6)'; x.lineWidth = 1; x.strokeRect(-R * 0.62, Y + R * 0.2, R * 1.24, R * 0.32);
    x.strokeStyle = 'rgba(29,24,23,0.5)'; x.lineWidth = 1; x.beginPath(); x.moveTo(-R * 0.2, Y - R * 0.4); x.lineTo(R * 0.15, Y + R * 0.2); x.moveTo(R * 0.2, Y - R * 0.4); x.lineTo(-R * 0.1, Y + R * 0.2); x.stroke();
    // el pelo, en trazos largos que flotan hacia atrás
    for (let k = 0; k < 7; k++) { const sx = -R * 0.3 + k * 3, L = R * (2.2 + rnd(k, 3) * 1.4); stroke(x, [[sx, Y - R * 1.6], [sx - R * 0.6, Y - R * 0.6 + Math.sin(t * 2 + k) * 4], [sx - R * 1.4 - k * 2, Y - R * 1.6 + L * 0.5 + Math.sin(t * 2.4 + k) * 8]], 3.5, '#121018', 0.95); }
    const hy = Y - R * 1.15; x.beginPath(); x.ellipse(R * 0.1, hy, R * 0.42, R * 0.5, 0, 0, TAU); fi(x, '#f4f8fc', 1.2, 0.7);
    x.fillStyle = '#121018'; x.beginPath(); x.ellipse(-R * 0.05, hy - R * 0.25, R * 0.45, R * 0.3, -0.3, 0, TAU); x.fill();
    x.strokeStyle = '#2a4a8a'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(R * 0.18, hy - 1); x.lineTo(R * 0.36, hy - 2); x.stroke();
    x.fillStyle = br ? '#2a4a8a' : '#a84a6a'; x.beginPath(); x.ellipse(R * 0.32, hy + R * 0.22, br ? 3 : 2, br ? 2.6 : 1, 0, 0, TAU); x.fill();
    if (br) for (let k = 0; k < 4; k++) { const p = (t * 3 + k / 4) % 1; x.fillStyle = `rgba(230,245,255,${(1 - p) * 0.8})`; x.beginPath(); x.arc(R * 0.5 + p * 30, hy + R * 0.2 + Math.sin(k) * 6, 2 + p * 5, 0, TAU); x.fill(); }
  }

  /* ====================== CELDAS (muros, lotos, enredadera, seto) ====================== */
  const cell = {};
  const isLook = (G, c, r, k) => { const T = G.T; if (c < 0 || r < 0 || c >= T.cols || r >= T.rows) return false; const i = r * T.cols + c; return G.cellLook.get(i) === k && T.base[i] === TT.ROCK; };
  // muro del castillo (dobei): grava abajo, revoque blanco y tejado de tejas grises
  function block(x, G, i, k, H, front, roof, snowK) {
    const T = G.T, c = i % T.cols, r = (i / T.cols) | 0, px = c * CELL, py = r * CELL, dn = isLook(G, c, r + 1, k), up = isLook(G, c, r - 1, k), lf = isLook(G, c - 1, r, k), rt = isLook(G, c + 1, r, k), s = seaOf(G, px + 20, py + 20);
    if (!dn) front(px, py + CELL - H, H, c, r);
    const ty = py - H; roof(px, ty, c, r, up, lf, rt);
    if (s === 'winter') { x.fillStyle = 'rgba(250,251,253,0.92)'; x.fillRect(px - (lf ? 0 : 2), ty - (up ? 0 : 4), CELL + (lf ? 0 : 2) + (rt ? 0 : 2), up ? CELL * snowK : 10); if (!up) { x.strokeStyle = 'rgba(110,140,186,0.5)'; x.lineWidth = 1; x.beginPath(); x.moveTo(px, ty + 6); x.lineTo(px + CELL, ty + 6); x.stroke(); } }
    else if (s === 'autumn' && rnd(i, 3) < 0.35) { x.fillStyle = rnd(i, 6) < 0.5 ? '#c8502a' : '#e0902a'; x.beginPath(); x.ellipse(px + rnd(i, 4) * CELL, ty + 4 + rnd(i, 7) * 28, 3, 2, rnd(i, 5) * 3, 0, TAU); x.fill(); }
  }
  // muro del castillo (dobei): base de piedra, revoque blanco con troneras y tejado de tejas grises
  cell.wall = (x, G, i) => block(x, G, i, 'wall', 30,
    (px, y, H, c, r) => { x.fillStyle = lg(x, 0, y, 0, y + H, '#f4f0e6', '#e0d8c6'); x.fillRect(px, y, CELL, H); x.fillStyle = '#8a8478'; x.fillRect(px, y + H - 9, CELL, 9); x.strokeStyle = `rgba(${INKRGB},0.45)`; x.lineWidth = 1; for (let k = 0; k < 3; k++) { const sx = px + k * 14 + (r % 2) * 7; x.beginPath(); x.moveTo(sx, y + H - 9); x.lineTo(sx, y + H); x.stroke(); } if ((c + r) % 3 === 0) { x.fillStyle = '#2a2428'; x.beginPath(); x.moveTo(px + 14, y + 16); x.lineTo(px + 20, y + 7); x.lineTo(px + 26, y + 16); x.closePath(); x.fill(); } x.strokeStyle = `rgba(${INKRGB},0.85)`; x.lineWidth = 1.4; x.beginPath(); x.moveTo(px, y + H); x.lineTo(px + CELL, y + H); x.stroke(); },
    (px, ty, c, r, up, lf, rt) => { x.fillStyle = lg(x, 0, ty, 0, ty + CELL, '#6e727c', '#4a4e58'); x.fillRect(px, ty, CELL, CELL); x.strokeStyle = 'rgba(20,22,30,0.5)'; x.lineWidth = 1; for (let k = 1; k < 4; k++) { x.beginPath(); x.moveTo(px + k * 10, ty); x.lineTo(px + k * 10, ty + CELL); x.stroke(); } if (!up) { x.fillStyle = '#2e3038'; x.fillRect(px - (lf ? 0 : 3), ty - 4, CELL + (lf ? 0 : 3) + (rt ? 0 : 3), 7); x.strokeStyle = `rgba(${INKRGB},0.9)`; x.lineWidth = 1.2; x.beginPath(); x.moveTo(px - (lf ? 0 : 3), ty - 4); x.lineTo(px + CELL + (rt ? 0 : 3), ty - 4); x.stroke(); } }, 0.6);
  // casas de madera de Kioto (machiya): rejas de madera oscura con luz cálida entre las rendijas; tejado de tejas
  cell.machiya = (x, G, i) => block(x, G, i, 'machiya', 42,
    (px, y, H, c, r) => { x.fillStyle = lg(x, 0, y, 0, y + H, '#4a3424', '#2e2016'); x.fillRect(px, y, CELL, H); x.fillStyle = 'rgba(255,190,110,0.85)'; for (let k = 0; k < 5; k++) x.fillRect(px + 3 + k * 8, y + 10, 3, H - 16); x.strokeStyle = '#1d1410'; x.lineWidth = 2; for (let k = 0; k <= 5; k++) { x.beginPath(); x.moveTo(px + k * 8 + 1, y + 8); x.lineTo(px + k * 8 + 1, y + H - 4); x.stroke(); } if ((c * 7 + r) % 5 === 0) { x.fillStyle = '#2a3a6a'; x.fillRect(px + 6, y + 1, 28, 12); x.fillStyle = '#e8e0c8'; x.font = fontB(9, 900); x.textAlign = 'center'; x.fillText('○', px + 20, y + 10); } },
    (px, ty, c, r, up) => { x.fillStyle = lg(x, 0, ty, 0, ty + CELL, '#42465a', '#2a2c38'); x.fillRect(px, ty, CELL, CELL); x.strokeStyle = 'rgba(10,10,16,0.6)'; x.lineWidth = 1; for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(px, ty + 6 + k * 10); x.lineTo(px + CELL, ty + 6 + k * 10); x.stroke(); } if (!up) { x.fillStyle = '#1e2028'; x.fillRect(px, ty - 3, CELL, 5); } }, 0.7);
  // hoja de loto: el camino que abre la primavera (hojas redondas que se mecen y flores rosas)
  cell.lotus = (x, G, i) => {
    const T = G.T, px = Terrain.cx(T, i), py = Terrain.cy(T, i), t = G.time;
    for (let k = 0; k < 2; k++) { const lx = px + (rnd(i, k) - 0.5) * 14, ly = py + (rnd(i, k + 2) - 0.5) * 12 + Math.sin(t * 1.4 + i + k) * 1.5, r = 15 + rnd(i, k + 4) * 6, nk = rnd(i, k + 6) * TAU;
      x.globalAlpha = 0.35; x.drawImage(ArtInk.wash('30,60,90', 1), lx - r, ly - r * 0.3, r * 2, r * 0.9); x.globalAlpha = 1;
      x.beginPath(); x.ellipse(lx, ly, r, r * 0.62, 0, nk + 0.25, nk + TAU - 0.25); x.lineTo(lx, ly); x.closePath(); fi(x, lg(x, lx - r, ly - r, lx + r, ly + r, '#7cb05a', '#4a8a3c'), 1.3, 0.75);
      x.strokeStyle = 'rgba(40,80,30,0.5)'; x.lineWidth = 0.8; for (let q = 0; q < 7; q++) { const a = q / 7 * TAU; x.beginPath(); x.moveTo(lx, ly); x.lineTo(lx + Math.cos(a) * r * 0.85, ly + Math.sin(a) * r * 0.55); x.stroke(); } }
    if (rnd(i, 9) < 0.45) { const fx = px + (rnd(i, 10) - 0.5) * 20, fy = py - 8; for (let q = 0; q < 6; q++) { const a = -Math.PI / 2 + (q - 2.5) * 0.42; x.beginPath(); x.ellipse(fx + Math.cos(a) * 5, fy + Math.sin(a) * 5, 6, 3, a, 0, TAU); fi(x, q % 2 ? '#f8c8da' : '#f3a3c0', 0.8, 0.6); } x.fillStyle = '#f0d050'; x.beginPath(); x.arc(fx, fy, 2.4, 0, TAU); x.fill(); }
  };
  // puente de enredadera sobre el vacío de tinta: lianas trenzadas con hojas y flores
  cell.vine = (x, G, i) => {
    const T = G.T, px = Terrain.cx(T, i), py = Terrain.cy(T, i), x0 = px - CELL / 2;
    x.fillStyle = '#4a3a22'; x.fillRect(x0, py - 16, CELL, 32);
    for (let k = 0; k < 4; k++) { const yy = py - 14 + k * 9; stroke(x, [[x0 - 2, yy + Math.sin(i + k) * 2], [px, yy + 3 * Math.sin(k + i * 0.3)], [x0 + CELL + 2, yy + Math.sin(i + k + 1) * 2]], 5, k % 2 ? '#5a7a32' : '#3e5e28', 0.95); }
    for (let k = 0; k < 4; k++) { const lx = x0 + rnd(i, k) * CELL, ly = py + (rnd(i, k + 5) - 0.5) * 30, a = rnd(i, k + 9) * TAU; x.save(); x.translate(lx, ly); x.rotate(a); x.beginPath(); x.ellipse(0, 0, 6, 3, 0, 0, TAU); fi(x, '#7cb05a', 0.7, 0.6); x.restore(); }
    if (rnd(i, 20) < 0.5) { x.fillStyle = '#ffd8e6'; x.beginPath(); x.arc(x0 + rnd(i, 21) * CELL, py + (rnd(i, 22) - 0.5) * 20, 2.6, 0, TAU); x.fill(); }
  };
  // seto podado (karikomi): un muro verde continuo y redondeado; en primavera con flores de azalea, en otoño rojizo, en invierno con nieve
  cell.hedge = (x, G, i) => {
    const T = G.T, c = i % T.cols, r = (i / T.cols) | 0, px = c * CELL, py = r * CELL, s = seaOf(G, px + 20, py + 20), burn = T.fire[i] > 0, H = 30;
    const isH = (cc, rr) => { const j = rr * T.cols + cc; return cc >= 0 && rr >= 0 && cc < T.cols && rr < T.rows && T.base[j] === TT.BUSH && G.cellLook.get(j) === 'hedge'; };
    const up = isH(c, r - 1), dn = isH(c, r + 1), col = s === 'autumn' ? ['#b8702e', '#8a4a20', '#6a3418'] : s === 'winter' ? ['#46684a', '#30503a', '#22382a'] : s === 'summer' ? ['#4a8e42', '#2e6a30', '#1e4a22'] : ['#68aa52', '#46883e', '#2e6630'];
    x.save(); if (burn) x.filter = 'brightness(0.5) sepia(0.7)';
    // frente (si abajo no sigue el seto)
    if (!dn) { x.fillStyle = lg(x, 0, py + CELL - H, 0, py + CELL, col[1], col[2]); x.beginPath(); x.moveTo(px, py + CELL - H); x.lineTo(px + CELL, py + CELL - H); x.lineTo(px + CELL, py + CELL - 4); x.quadraticCurveTo(px + CELL / 2, py + CELL + 3, px, py + CELL - 4); x.closePath(); x.fill(); x.strokeStyle = `rgba(${INKRGB},0.6)`; x.lineWidth = 1.2; x.stroke(); }
    // lomo (arriba): verde con bultos de hojas
    const ty = py - H; x.fillStyle = lg(x, 0, ty, 0, ty + CELL, col[0], col[1]); x.beginPath(); if (up) x.rect(px, ty, CELL, CELL); else { x.moveTo(px, ty + CELL); x.lineTo(px, ty + 12); x.quadraticCurveTo(px, ty, px + 12, ty); x.lineTo(px + CELL - 12, ty); x.quadraticCurveTo(px + CELL, ty, px + CELL, ty + 12); x.lineTo(px + CELL, ty + CELL); x.closePath(); } x.fill();
    if (!up) { x.strokeStyle = `rgba(${INKRGB},0.7)`; x.lineWidth = 1.3; x.beginPath(); x.moveTo(px, ty + 14); x.quadraticCurveTo(px, ty, px + 12, ty); x.lineTo(px + CELL - 12, ty); x.quadraticCurveTo(px + CELL, ty, px + CELL, ty + 14); x.stroke(); }
    for (let k = 0; k < 6; k++) { const lx = px + 4 + rnd(i, k) * 32, ly = ty + 4 + rnd(i, k + 7) * 34; x.fillStyle = k % 2 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'; x.beginPath(); x.arc(lx, ly, 4 + rnd(i, k + 3) * 4, 0, TAU); x.fill(); }
    if (s === 'spring') for (let k = 0; k < 5; k++) { x.fillStyle = k % 3 ? '#f070a0' : '#ffffff'; x.beginPath(); x.arc(px + 4 + rnd(i, k + 20) * 32, ty + 4 + rnd(i, k + 30) * 34, 2.4, 0, TAU); x.fill(); }
    if (s === 'winter') { x.fillStyle = 'rgba(250,251,253,0.92)'; x.fillRect(px, ty + (up ? 0 : 3), CELL, up ? CELL * 0.6 : 12); }
    x.restore();
  };

  /* ====================== OBJETOS ====================== */
  function objects(x, G, list) {
    const t = G.time, T = G.T;
    // estado de los toriis que llega en línea (manchas y estación de los sueltos)
    if (G.sea && G.cs && typeof G.cs.tor === 'string') G.cs.tor.split(',').forEach((q, k) => { const tr = G.sea.toriis[k]; if (!tr) return; tr.stain = q[0] === 'x'; if (tr.solo) { const n = +q.replace('x', ''); if (n) tr.s = SEASON_BY_CODE[n]; } });
    if (G.A && G.A.theme === 'kioto') festival(x, G, list);
    for (const o of G.objs) {
      if (o.t === 'house') list.push({ y: o.y + 18, draw: x => house(x, G, o) });
      else if (o.t === 'stall' && !o.gone) list.push({ y: o.rect[3], draw: x => stall(x, G, o) });
      else if (o.t === 'pinwheel') list.push({ y: o.y + 4, draw: x => pinwheel(x, G, o) });
      else if (o.t === 'tablet') list.push({ y: o.y + 6, draw: x => tablet(x, G, o) });
      else if (o.t === 'rope') list.push({ y: o.y + 6, draw: x => rope(x, G, o) });
      else if (o.t === 'seal3' && !o.got) seal(x, G, o);
      else if (o.t === 'current') current(x, G, o);
      else if (o.t === 'pads' && !o.open) buds(x, G, o);
      else if (o.t === 'exit') enso(x, G, o);
      else if (o.t === 'door' && !o.open) list.push({ y: o.rect[3] - 4, draw: x => gate(x, G, o) });
      else if (o.t === 'inkwall') list.push({ y: 1e6, draw: x => inkwall(x, G, o) });
    }
    if (typeof ArtW3B !== 'undefined') for (const u of G.units) { if (u.w3boss && u.alive) list.push({ y: u.w3boss === 'orochi' ? u.y - 120 : u.y, draw: x => ArtW3B.boss(x, G, u) }); else if (u.obj === 'sake' && u.alive) list.push({ y: u.y, draw: x => ArtW3B.jar(x, G, u) }); }
  }
  // casa de Shirakawa-go (gasshō-zukuri): techo de paja muy empinado, ventanas de papel con luz, y su farol de piedra
  function house(x, G, o) {
    const t = G.time, X = o.x, Y = o.y + 16, s = seaOf(G, X, Y), lit = o.lit;
    x.save(); x.translate(X, Y);
    x.globalAlpha = 0.4; x.drawImage(ArtInk.wash('30,26,30', 1), -110, -14, 220, 34); x.globalAlpha = 1;
    // fachada de madera con ventanas de papel
    x.beginPath(); x.rect(-84, -62, 168, 62); fi(x, lg(x, 0, -62, 0, 0, '#6a4a30', '#3e2a1a'), 1.6);
    for (const wx of [-62, -26, 10, 46]) { x.fillStyle = lit ? rg(x, wx + 8, -34, 2, 22, '#fff2c0', '#ffc860', '#d89030') : '#4a4048'; x.fillRect(wx, -48, 16, 24); x.strokeStyle = '#2a1a10'; x.lineWidth = 1.4; x.strokeRect(wx, -48, 16, 24); x.beginPath(); x.moveTo(wx + 8, -48); x.lineTo(wx + 8, -24); x.moveTo(wx, -36); x.lineTo(wx + 16, -36); x.stroke(); }
    if (lit) glow(x, 0, -36, 110, 'rgba(255,190,100,0.28)');
    // el techo de paja en «manos juntas»
    x.beginPath(); x.moveTo(-104, -56); x.lineTo(0, -168); x.lineTo(104, -56); x.lineTo(92, -50); x.lineTo(0, -150); x.lineTo(-92, -50); x.closePath(); fi(x, '#3a2a1e', 1.2);
    x.beginPath(); x.moveTo(-100, -58); x.lineTo(0, -164); x.lineTo(100, -58); x.closePath(); fi(x, lg(x, 0, -164, 0, -58, '#9a7a4a', '#6a5030'), 1.8);
    x.strokeStyle = 'rgba(60,40,20,0.45)'; x.lineWidth = 1; for (let k = 0; k < 18; k++) { const f = k / 17; x.beginPath(); x.moveTo(-100 + f * 200, -58); x.lineTo(-100 + f * 200 + (f - 0.5) * -60 * 0.3, -58 - (1 - Math.abs(f - 0.5) * 2) * 70); x.stroke(); }
    x.fillStyle = 'rgba(40,30,20,0.6)'; x.fillRect(-14, -120, 28, 20); x.fillStyle = lit ? '#ffd880' : '#3a3038'; x.fillRect(-10, -116, 20, 13);
    if (s === 'winter') { x.fillStyle = 'rgba(250,251,253,0.96)'; x.beginPath(); x.moveTo(-104, -54); x.lineTo(0, -170); x.lineTo(104, -54); x.lineTo(90, -60); x.quadraticCurveTo(40, -100, 0, -150); x.quadraticCurveTo(-40, -100, -90, -60); x.closePath(); x.fill(); x.strokeStyle = 'rgba(110,140,186,0.5)'; x.lineWidth = 1.2; x.stroke(); }
    x.restore();
    // farol de piedra (tōrō)
    const fx = o.fx, fy = o.fy; x.save(); x.translate(fx, fy);
    x.globalAlpha = 0.4; x.drawImage(ArtInk.wash('30,26,30', 1), -22, -6, 44, 12); x.globalAlpha = 1;
    x.beginPath(); x.rect(-5, -30, 10, 30); fi(x, '#8a8478', 1.2); x.beginPath(); x.rect(-14, -32, 28, 6); fi(x, '#9a948a', 1.2);
    x.beginPath(); x.rect(-10, -52, 20, 20); fi(x, lit ? rg(x, 0, -42, 1, 16, '#fff6d0', '#ffb040', '#c06020') : '#3a3438', 1.2);
    x.beginPath(); x.moveTo(-17, -52); x.lineTo(0, -66); x.lineTo(17, -52); x.closePath(); fi(x, '#8a8478', 1.2); x.beginPath(); x.arc(0, -68, 3, 0, TAU); fi(x, '#8a8478', 1);
    if (s === 'winter') { x.fillStyle = 'rgba(250,251,253,0.95)'; x.beginPath(); x.ellipse(0, -60, 16, 5, 0, 0, TAU); x.fill(); }
    if (lit) { glow(x, 0, -42, 70, 'rgba(255,170,70,0.75)'); for (let k = 0; k < 2; k++) { const h = 7 + Math.sin(t * 11 + k * 2) * 2; x.fillStyle = k ? '#fff4c0' : '#ff9a3a'; x.beginPath(); x.ellipse(0, -44 - h * 0.3, 4 - k * 1.5, h - k * 2, 0, 0, TAU); x.fill(); } }
    else { const p = 0.5 + 0.5 * Math.sin(t * 5); x.fillStyle = `rgba(255,170,80,${0.5 + p * 0.5})`; x.font = fontB(12, 900); x.textAlign = 'center'; x.strokeStyle = INK; x.lineWidth = 3; x.strokeText('¡apagado!', 0, -80); x.fillText('¡apagado!', 0, -80); HUD.icon(x, 'fire', 0, -96, 7, `rgba(255,170,80,${0.6 + p * 0.4})`); }
    x.restore();
  }
  // puesto de papel del festival (yatai): estructura de madera, cortina noren, faroles rojos
  function stall(x, G, o) {
    const t = G.time, [x0, y0, x1, y1] = o.rect, w = x1 - x0 + 20, X = (x0 + x1) / 2, top = y0 - 30, bot = y1 + 18, ig = o.igT > 0;
    x.save(); if (ig) x.filter = 'brightness(1.2) sepia(0.5)';
    x.globalAlpha = 0.4; x.drawImage(ArtInk.wash('30,26,30', 1), X - w, bot - 10, w * 2, 20); x.globalAlpha = 1;
    // paredes de papel (shōji) con su retícula
    x.beginPath(); x.rect(X - w / 2, top + 24, w, bot - top - 24); fi(x, lg(x, X - w / 2, 0, X + w / 2, 0, '#f6ecd4', '#e4d6b4'), 1.4);
    x.strokeStyle = 'rgba(90,60,30,0.55)'; x.lineWidth = 1; for (let yy = top + 34; yy < bot; yy += 18) { x.beginPath(); x.moveTo(X - w / 2, yy); x.lineTo(X + w / 2, yy); x.stroke(); } x.beginPath(); x.moveTo(X, top + 24); x.lineTo(X, bot); x.stroke();
    for (const s of [-1, 1]) { x.fillStyle = '#5a3a22'; x.fillRect(X + s * w / 2 - 3, top + 16, 6, bot - top - 16); }
    // techo de tela a rayas
    x.beginPath(); x.moveTo(X - w / 2 - 8, top + 28); x.lineTo(X - w / 2 + 2, top + 8); x.lineTo(X + w / 2 - 2, top + 8); x.lineTo(X + w / 2 + 8, top + 28); x.closePath(); fi(x, '#d8402a', 1.4);
    x.fillStyle = '#f6ecd4'; for (let k = 0; k < 5; k++) { if (k % 2) continue; x.beginPath(); x.moveTo(X - w / 2 - 8 + (w + 16) * k / 5, top + 28); x.lineTo(X - w / 2 + 2 + (w - 4) * k / 5, top + 8); x.lineTo(X - w / 2 + 2 + (w - 4) * (k + 1) / 5, top + 8); x.lineTo(X - w / 2 - 8 + (w + 16) * (k + 1) / 5, top + 28); x.fill(); }
    // farolitos colgando a lo largo
    for (let yy = y0 + 20; yy < y1; yy += 70) { const sw = Math.sin(t * 2 + yy) * 3; glow(x, X + w / 2 + 10 + sw, yy, 34, 'rgba(255,140,70,0.6)'); x.beginPath(); x.ellipse(X + w / 2 + 10 + sw, yy, 7, 10, 0, 0, TAU); fi(x, rg(x, X + w / 2 + 8, yy - 3, 1, 10, '#fff0b0', '#ff7a3a', '#b82a1a'), 1, 0.8); }
    if (ig) for (let k = 0; k < 6; k++) { const fx = X + (rnd(k, 1) - 0.5) * w, h = 16 + Math.sin(t * 13 + k) * 6; x.fillStyle = 'rgba(255,160,60,0.85)'; x.beginPath(); x.ellipse(fx, top + 20 + rnd(k, 2) * (bot - top - 30) - h * 0.4, 5, h, 0, 0, TAU); x.fill(); }
    x.restore();
  }
  // molinete de colores (kazaguruma) sobre su poste
  function pinwheel(x, G, o) {
    const X = o.x, Y = o.y, H = 96, spin = o.spin || 0;
    x.save(); x.translate(X, Y); x.globalAlpha = 0.4; x.drawImage(ArtInk.wash('30,26,30', 1), -20, -5, 40, 10); x.globalAlpha = 1;
    stroke(x, [[0, 0], [1, -H * 0.5], [0, -H]], 5, '#6a4a2c');
    x.translate(0, -H); x.rotate(o.ang || 0);
    const cols = ['#e8403a', '#3a7ad8', '#f0c030', '#3aa860', '#e8403a', '#9a4ad0'];
    for (let k = 0; k < 6; k++) { x.save(); x.rotate(k / 6 * TAU); x.beginPath(); x.moveTo(0, 0); x.lineTo(30, -4); x.quadraticCurveTo(26, 12, 4, 14); x.closePath(); fi(x, cols[k], 1.2, 0.85); x.fillStyle = 'rgba(255,255,255,0.3)'; x.beginPath(); x.moveTo(2, 2); x.lineTo(24, -2); x.lineTo(6, 8); x.fill(); x.restore(); }
    x.beginPath(); x.arc(0, 0, 4, 0, TAU); fi(x, '#f0e0b0', 1, 0.9);
    x.restore();
    if (spin > 0.3) { x.save(); x.globalAlpha = Math.min(0.8, spin - 0.3); x.strokeStyle = 'rgba(255,255,250,0.85)'; x.lineWidth = 2; for (let k = 0; k < 3; k++) { const a = (o.ang || 0) * 0.5 + k * 2.1; x.beginPath(); x.arc(X, Y - H, 40 + k * 6, a, a + 0.9); x.stroke(); } x.restore(); }
    if (!o.full) { const p = 0.5 + 0.5 * Math.sin(G.time * 4); x.save(); x.fillStyle = 'rgba(29,24,23,0.8)'; x.beginPath(); x.arc(X, Y - H - 52, 11, 0, TAU); x.fill(); HUD.icon(x, 'wind', X, Y - H - 52, 6.5, `rgba(230,255,240,${0.6 + p * 0.4})`); const f = Math.min(1, spin / 0.75); x.strokeStyle = '#ffd25a'; x.lineWidth = 3; x.beginPath(); x.arc(X, Y - H - 52, 14, -Math.PI / 2, -Math.PI / 2 + f * TAU); x.stroke(); x.restore(); }
  }
  // tablilla de piedra con el emblema de la estación que pide su torii
  function tablet(x, G, o) {
    const X = o.x, Y = o.y; x.save(); x.translate(X, Y);
    x.globalAlpha = 0.4; x.drawImage(ArtInk.wash('30,26,30', 1), -22, -5, 44, 10); x.globalAlpha = 1;
    x.beginPath(); x.moveTo(-16, 0); x.lineTo(-14, -46); x.quadraticCurveTo(0, -54, 14, -46); x.lineTo(16, 0); x.closePath(); fi(x, lg(x, -16, -50, 16, 0, '#b8b4aa', '#7a766c'), 1.6);
    x.beginPath(); x.arc(0, -30, 10, 0, TAU); fi(x, SEASONS[o.want].col, 1, 0.8); ArtInk.emblem(x, o.want, 0, -30, 7);
    if (o.ok) { glow(x, 0, -30, 40, 'rgba(255,240,170,0.8)'); x.strokeStyle = '#ffe9a0'; x.lineWidth = 2; x.beginPath(); x.moveTo(-7, -10); x.lineTo(-2, -5); x.lineTo(8, -16); x.stroke(); }
    x.restore();
  }
  // poste con la cuerda del puente levadizo
  function rope(x, G, o) {
    const X = o.x, Y = o.y; x.save(); x.translate(X, Y);
    x.beginPath(); x.rect(-6, -70, 12, 70); fi(x, lg(x, -6, 0, 6, 0, '#7a5434', '#4a301c'), 1.4); x.beginPath(); x.rect(-9, -74, 18, 6); fi(x, '#3a2414', 1.2);
    if (!o.cut) { stroke(x, [[0, -62], [40, -36], [86, 40]], 4, '#c8a870'); for (let k = 0; k < 4; k++) { x.strokeStyle = 'rgba(80,50,20,0.6)'; x.lineWidth = 1; x.beginPath(); x.moveTo(-6, -58 + k * 6); x.lineTo(6, -55 + k * 6); x.stroke(); } const p = 0.5 + 0.5 * Math.sin(G.time * 4); x.fillStyle = 'rgba(29,24,23,0.8)'; x.beginPath(); x.arc(0, -96, 11, 0, TAU); x.fill(); HUD.icon(x, 'fire', 0, -96, 6.5, `rgba(255,190,100,${0.6 + p * 0.4})`); }
    else { stroke(x, [[0, -62], [8, -48], [4, -36]], 4, '#5a4a30'); }
    x.restore();
  }
  // sello rojo escondido: un hanko que asoma brillando de vez en cuando
  function seal(x, G, o) {
    const t = G.time, p = (t * 0.35 + o.x * 0.001) % 1, near = G.mages.some(m => m.alive && hypot(m.x - o.x, m.y - o.y) < 160);
    x.save(); x.translate(o.x, o.y + Math.sin(t * 2) * 2); x.globalAlpha = near ? 0.95 : 0.55;
    x.rotate(0.12); x.beginPath(); x.rect(-11, -11, 22, 22); fi(x, '#c8281e', 1.2, 0.6); x.strokeStyle = '#ffe8d8'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(-6, -5); x.lineTo(6, -5); x.moveTo(0, -8); x.lineTo(0, 8); x.moveTo(-6, 3); x.lineTo(6, 3); x.stroke();
    if (p < 0.12 || near) { x.globalAlpha = near ? 0.7 : (0.12 - p) * 7; x.globalCompositeOperation = 'lighter'; x.fillStyle = 'rgba(255,200,180,0.9)'; x.beginPath(); x.moveTo(0, -24); x.quadraticCurveTo(0, 0, 24, 0); x.quadraticCurveTo(0, 0, 0, 24); x.quadraticCurveTo(0, 0, -24, 0); x.quadraticCurveTo(0, 0, 0, -24); x.fill(); }
    x.restore();
  }
  // corriente: líneas de agua que corren (solo en el agua honda sin congelar)
  function current(x, G, o) {
    const T = G.T, t = G.time, [dx, dy] = o.dir; x.save(); x.strokeStyle = 'rgba(240,250,255,0.55)'; x.lineWidth = 1.4; x.lineCap = 'round';
    let k = 0; for (const i of o.cells) { if (T.base[i] !== TT.DEEP || T.ice[i] > 0 || (k++ % 2)) continue; const px = Terrain.cx(T, i), py = Terrain.cy(T, i), ph = (t * 1.6 + rnd(i, 3)) % 1; x.globalAlpha = Math.sin(ph * Math.PI) * 0.6; x.beginPath(); x.moveTo(px - dx * 14 + dx * ph * 24, py - dy * 14 + dy * ph * 24 + (rnd(i, 4) - 0.5) * 20); x.lineTo(px + dx * 2 + dx * ph * 24, py + dy * 2 + dy * ph * 24 + (rnd(i, 4) - 0.5) * 20); x.stroke(); }
    x.restore();
  }
  // lotos cerrados (antes de la primavera): capullos sobre el agua
  function buds(x, G, o) {
    const T = G.T, t = G.time; for (const i of o.cells) { const px = Terrain.cx(T, i), py = Terrain.cy(T, i) + Math.sin(t * 1.3 + i) * 1.2;
      if (o.look === 'vine') { x.strokeStyle = 'rgba(80,110,50,0.6)'; x.lineWidth = 2; x.beginPath(); x.moveTo(px - 18, py + 10); x.quadraticCurveTo(px - 6, py - 2, px - 2, py + 4); x.stroke(); continue; }
      x.globalAlpha = 0.8; x.beginPath(); x.ellipse(px - 6, py + 4, 10, 6, 0, 0.3, TAU - 0.3); x.lineTo(px - 6, py + 4); x.closePath(); fi(x, '#5a8a48', 1, 0.6);
      x.beginPath(); x.ellipse(px + 8, py - 4, 4, 7, 0.2, 0, TAU); fi(x, '#e890b0', 1, 0.6); x.globalAlpha = 1; }
  }
  // la salida: un ensō (el círculo zen de un solo trazo) que brilla al abrirse
  function enso(x, G, o) {
    const t = G.time, op = o.open; x.save(); x.translate(o.x, o.y);
    const pts = []; for (let k = 0; k <= 36; k++) { const a = -2.1 + k / 36 * (TAU - 0.5); pts.push([Math.cos(a) * 58 * (1 + Math.sin(a * 3) * 0.02), Math.sin(a) * 36]); }
    x.globalAlpha = op ? 0.95 : 0.5; ArtInk.brush(x, pts, op ? 9 : 6, op ? '#1d1817' : 'rgba(29,24,23,0.8)', 1, 0.4);
    if (op) { x.globalCompositeOperation = 'lighter'; x.fillStyle = rg(x, 0, 0, 4, 64, 'rgba(255,226,140,0.45)', 'rgba(255,200,100,0)'); x.beginPath(); x.ellipse(0, 0, 64, 40, 0, 0, TAU); x.fill();
      for (let k = 0; k < 10; k++) { const p = (t * 0.5 + k / 10) % 1, a = k * 2.4; x.fillStyle = `rgba(255,${200 + (k % 3) * 20},${170 - (k % 2) * 60},${(1 - p) * 0.85})`; x.beginPath(); x.ellipse(Math.cos(a) * 40 + Math.sin(t + k) * 6, Math.sin(a) * 22 - p * 110, 3, 2, a + t, 0, TAU); x.fill(); }
      x.globalCompositeOperation = 'source-over'; }
    x.font = fontT(15); x.textAlign = 'center'; x.lineWidth = 3; x.strokeStyle = 'rgba(244,236,220,0.85)'; x.strokeText(op ? 'SALIDA' : 'salida cerrada', 0, 60); x.fillStyle = op ? '#8e2212' : 'rgba(29,24,23,0.6)'; x.fillText(op ? 'SALIDA' : 'salida cerrada', 0, 60);
    x.restore();
  }
  // puertas: cerca de bambú (sukigaki) o portón del castillo
  function gate(x, G, o) {
    const T = G.T, [x0, y0, x1, y1] = o.rect, cs = o.cells || [], c0 = Math.min(...cs.map(i => i % T.cols)), c1 = Math.max(...cs.map(i => i % T.cols)), r0 = Math.min(...cs.map(i => (i / T.cols) | 0)), r1 = Math.max(...cs.map(i => (i / T.cols) | 0));
    const X0 = c0 * CELL, X1 = (c1 + 1) * CELL, Y0 = r0 * CELL, Y1 = (r1 + 1) * CELL;
    if (o.look === 'castle') {
      x.save(); x.beginPath(); x.rect(X0 - 4, Y0 - 50, X1 - X0 + 8, Y1 - Y0 + 50); fi(x, lg(x, X0, 0, X1, 0, '#5a3a22', '#3a2414'), 2);
      x.strokeStyle = 'rgba(20,10,5,0.6)'; x.lineWidth = 1.2; for (let yy = Y0 - 40; yy < Y1; yy += 22) { x.beginPath(); x.moveTo(X0, yy); x.lineTo(X1, yy); x.stroke(); }
      x.fillStyle = '#2a2428'; for (let yy = Y0 - 30; yy < Y1; yy += 22) for (let xx = X0 + 8; xx < X1; xx += 16) { x.beginPath(); x.arc(xx, yy, 2.4, 0, TAU); x.fill(); }
      x.beginPath(); x.moveTo(X0 - 16, Y0 - 50); x.lineTo((X0 + X1) / 2, Y0 - 78); x.lineTo(X1 + 16, Y0 - 50); x.closePath(); fi(x, '#4a4e58', 1.6);
      const p = 0.5 + 0.5 * Math.sin(G.time * 3); x.fillStyle = `rgba(255,233,160,${0.5 + p * 0.4})`; x.font = fontB(11, 900); x.textAlign = 'center'; x.fillText('cerrado', (X0 + X1) / 2, Y1 + 16);
      x.restore(); return;
    }
    // cerca de bambú: cañas verticales atadas con cuerda negra
    x.save(); const H = 50;
    for (let r = r0; r <= r1; r++) { const yb = r * CELL + CELL, s = seaOf(G, X0 + 20, yb);
      for (let k = 0; k < 6; k++) { const bx = X0 + 3 + k * ((X1 - X0 - 6) / 5); x.beginPath(); x.rect(bx - 3, yb - H - (k % 2) * 4, 6, H + (k % 2) * 4); fi(x, lg(x, bx - 3, 0, bx + 3, 0, s === 'autumn' ? '#b8a050' : '#8aa858', s === 'autumn' ? '#7a6a30' : '#5a7a38'), 1, 0.7); }
      x.fillStyle = '#1d1817'; x.fillRect(X0, yb - H * 0.75, X1 - X0, 3); x.fillRect(X0, yb - H * 0.3, X1 - X0, 3); if (s === 'winter') { x.fillStyle = 'rgba(250,251,253,0.9)'; x.fillRect(X0, yb - H - 6, X1 - X0, 5); } }
    x.restore();
  }
  // el muro de tinta: una ola negra que avanza, con crestas de pincel y salpicaduras
  function inkwall(x, G, o) {
    const T = G.T, t = G.time, X = o.x; if (X < -100) return;
    x.save();
    const front = y => X + Math.sin(y / 53 + t * 2.2) * 18 + Math.sin(y / 17 - t * 4) * 6;
    x.fillStyle = '#0e0b0e'; x.beginPath(); x.moveTo(Math.max(0, X - 2000), -60); for (let y = -60; y <= T.H + 60; y += 16) x.lineTo(front(y), y); x.lineTo(Math.max(0, X - 2000), T.H + 60); x.closePath(); x.fill();
    // crestas (olas que rompen) y su borde húmedo
    for (let k = 0; k < 14; k++) { const y = (k / 13) * (T.H + 80) - 40 + Math.sin(t + k) * 10, fx = front(y), cr = 24 + Math.sin(t * 3 + k * 1.7) * 10; const pts = [[fx - 30, y + 20], [fx + cr * 0.6, y - 8], [fx + cr, y + 10], [fx + cr * 0.4, y + 16]]; ArtInk.brush(x, pts, 10, '#0e0b0e', 0.95, 0.5); }
    x.strokeStyle = 'rgba(120,110,150,0.35)'; x.lineWidth = 3; x.beginPath(); for (let y = -60; y <= T.H + 60; y += 16) y < -50 ? x.moveTo(front(y) - 6, y) : x.lineTo(front(y) - 6, y); x.stroke();
    // salpicaduras que vuelan hacia adelante
    for (let k = 0; k < 26; k++) { const p = (t * 0.9 + k * 0.137) % 1, y = (rnd(k, 1) * T.H), sx = front(y) + p * (40 + rnd(k, 2) * 80), sy = y - Math.sin(p * Math.PI) * 30; x.globalAlpha = 1 - p; x.fillStyle = '#0e0b0e'; x.beginPath(); x.arc(sx, sy, (1 - p) * (3 + rnd(k, 3) * 4), 0, TAU); x.fill(); }
    // ojos del Borrón en la ola, de vez en cuando
    x.globalAlpha = 0.6 + 0.4 * Math.sin(t * 2); for (const yy of [T.H * 0.3, T.H * 0.7]) { const fx = front(yy) - 60; x.fillStyle = '#ff3050'; x.beginPath(); x.ellipse(fx - 10, yy, 5, 2.4, 0, 0, TAU); x.ellipse(fx + 10, yy, 5, 2.4, 0, 0, TAU); x.fill(); }
    x.restore();
  }
  // festival de Kioto: cuerdas de faroles rojos sobre la calle
  function festival(x, G, list) {
    const T = G.T, t = G.time;
    for (const yy of [168, 832]) list.push({ y: yy + 30, draw: x => { const c0 = Math.max(0, G._vx0 || 0), c1 = Math.min(T.W, (G._vx1 || T.W)); x.save(); x.strokeStyle = 'rgba(29,24,23,0.7)'; x.lineWidth = 1.2; x.beginPath();
      for (let xx = Math.floor(c0 / 80) * 80; xx < c1 + 80; xx += 80) { x.moveTo(xx, yy - 40); x.quadraticCurveTo(xx + 40, yy - 26, xx + 80, yy - 40); } x.stroke();
      for (let xx = Math.floor(c0 / 80) * 80 + 40; xx < c1 + 80; xx += 80) { if (G.objs) { const w = G.objs.find(o => o.t === 'inkwall'); if (w && xx < w.x) continue; } const sw = Math.sin(t * 1.8 + xx * 0.05) * 3, ly = yy - 24; x.beginPath(); x.ellipse(xx + sw, ly, 8, 11, 0, 0, TAU); fi(x, rg(x, xx + sw - 2, ly - 3, 1, 12, '#fff0b0', '#ff6a3a', '#a8201a'), 1, 0.8); x.fillStyle = '#1d1817'; x.fillRect(xx + sw - 5, ly - 13, 10, 3); x.fillRect(xx + sw - 5, ly + 10, 10, 3); }
      x.restore(); } });
  }

  /* ====================== LUCES (para la noche) ====================== */
  function lights(G, add) {
    if (!G.L || !G.L.world3 || !G.objs) return;
    for (const o of G.objs) {
      if (o.t === 'house') { if (o.lit) { add(o.fx, o.fy - 40, 230, [255, 170, 80], 1, 0.4); add(o.x, o.y - 30, 200, [255, 190, 110], 0.8, 0.25); } }
      else if (o.t === 'stall' && !o.gone) add(o.x, o.y, 180, [255, 150, 80], 0.9, 0.3);
      else if (o.t === 'exit' && o.open) add(o.x, o.y, 170, [255, 230, 150], 0.9, 0.25);
      else if (o.t === 'pinwheel') add(o.x, o.y - 90, 90, [255, 240, 200], 0.6, 0.1);
      else if (o.t === 'seal3' && !o.got) add(o.x, o.y, 50, [255, 120, 100], 0.4, 0.2);
    }
    if (G.A.theme === 'kioto') { const w = G.objs.find(o => o.t === 'inkwall'), a0 = G.mages.reduce((a, m) => Math.min(a, m.x), 1e9) - 700; for (let xx = Math.max(w ? w.x : 0, Math.floor(a0 / 160) * 160) + 40; xx < a0 + 2000; xx += 160) for (const yy of [144, 808]) add(xx, yy, 95, [255, 130, 70], 0.7, 0.22); }
    for (const u of G.units) if (u instanceof Creature && u.alive) { if (u.kind === 'chochin') add(u.x, u.y - 40, 150 + (u.fuseT > 0 ? 80 : 0), [255, 150, 60], 1, 0.4); if (u.kind === 'yukionna') add(u.x, u.y - 50, 180, [180, 220, 255], 0.9, 0.3); }
    for (const f of fireworks) { const k = 1 - f.t / f.life; if (k > 0) add(f.x, f.y, 400 * k, f.rgb, k * 0.8, 0.25 * k); }
  }

  /* ====================== FUEGOS ARTIFICIALES Y VENTISCA ====================== */
  const fireworks = [], FW = [[255, 120, 140], [255, 210, 110], [140, 220, 255], [190, 150, 255], [255, 255, 255], [140, 255, 170]];
  function onEvent(G, e) {
    if (e.type === 'firework' && (!LOWFX || fireworks.length < 3)) { fireworks.push({ x: e.x, y: e.y, t: 0, life: 1.6, rgb: FW[e.h % FW.length], n: LOWFX ? 18 : 34, seed: Math.random() * 100 }); if (fireworks.length > 8) fireworks.shift(); }
  }
  function sky(ctx, G, dt) {
    if (!fireworks.length) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = fireworks.length - 1; k >= 0; k--) { const f = fireworks[k]; f.t += dt; if (f.t > f.life) { fireworks.splice(k, 1); continue; }
      const p = f.t / f.life, e = 1 - Math.pow(1 - Math.min(1, p * 1.6), 3), R = 150 * e, a = 1 - p;
      for (let q = 0; q < f.n; q++) { const ang = q / f.n * TAU + f.seed, rx = Math.cos(ang) * R, ry = Math.sin(ang) * R * 0.8 + p * p * 60; ctx.strokeStyle = `rgba(${f.rgb.join(',')},${a * 0.8})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f.x + rx * 0.82, f.y + ry * 0.82); ctx.lineTo(f.x + rx, f.y + ry); ctx.stroke(); ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(f.x + rx - 1, f.y + ry - 1, 2.4, 2.4); }
      if (p < 0.15) { ctx.fillStyle = `rgba(${f.rgb.join(',')},${(0.15 - p) * 4})`; ctx.beginPath(); ctx.arc(f.x, f.y, 40, 0, TAU); ctx.fill(); } }
    ctx.restore();
  }
  // ventisca de la aldea: copos gruesos en diagonal y ráfagas blancas (en pantalla)
  let flakes = null;
  function blizzard(ctx, G, sw, sh, dt) {
    if (!G.L || !G.L.cold || (G.sea && G.sea.panels[0].s === 'summer')) return;
    const n = LOWFX ? 60 : 140; if (!flakes || flakes.length !== n) flakes = Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), z: 0.4 + Math.random() * 0.9 }));
    ctx.save(); ctx.fillStyle = 'rgba(245,250,255,0.9)';
    for (const f of flakes) { f.x += dt * (0.22 + Math.sin(G.time * 0.7) * 0.08) * f.z; f.y += dt * 0.12 * f.z; if (f.x > 1.05) f.x -= 1.1; if (f.y > 1.05) f.y -= 1.1; const X = f.x * sw, Y = f.y * sh, r = 1 + f.z * 1.8; ctx.globalAlpha = 0.35 + f.z * 0.35; ctx.beginPath(); ctx.ellipse(X, Y, r * 2.4, r, 0.4, 0, TAU); ctx.fill(); }
    const gust = Math.max(0, Math.sin(G.time * 0.37) - 0.75) * 4; if (gust > 0) { ctx.globalAlpha = gust * 0.25; ctx.fillStyle = '#eef4fb'; ctx.fillRect(0, 0, sw, sh); }
    ctx.restore();
  }
  return { looks, creature, cell, objects, lights, onEvent, sky, blizzard, fireworks };
})();

/* ---------- temas de los niveles del Mundo 3: cada lugar con su luz, sus árboles y su música ---------- */
(() => {
  const B = THEMES.wa, mk = o => Object.assign({}, B, o, { sea: Object.assign({}, B.sea, o.sea || {}) });
  const night = (amb, fog) => ({ ambient: amb, nightA: 0.58, lightK: 0.55, bloom: 0.22, rays: 0.12, fog, fogK: 0.22, vig: '10,10,24', vigA: 0.55, grade: ['rgba(120,140,255,0.10)', 'rgba(30,20,60,0.18)'] });
  THEMES.arashiyama = mk({ trees: ['bamboo'], bamboo: true, music: 'bamboo', rays: 0.55, rayRgb: [230, 255, 210], grade: ['rgba(200,255,190,0.10)', 'rgba(40,90,60,0.14)'], fogK: 0.22, fog: [236, 248, 232] });
  THEMES.himeji = mk({ trees: ['pine', 'sakura', 'pine'], music: 'himeji', rays: 0.4, slabs: true });
  THEMES.shirakawa = mk(Object.assign(night([16, 24, 52], [220, 232, 255]), { trees: ['pine'], music: 'yuki', sea: { winter: { grade: ['rgba(170,200,255,0.14)', 'rgba(20,30,70,0.2)'], ambient: [16, 24, 52] }, summer: { grade: ['rgba(255,200,140,0.12)', 'rgba(40,30,60,0.14)'], ambient: [30, 20, 40] } } }));
  THEMES.kioto = mk(Object.assign(night([26, 14, 40], [255, 220, 200]), { trees: ['sakura', 'maple', 'pine'], music: 'matsuri', slabs: true, grade: ['rgba(255,140,90,0.12)', 'rgba(40,20,80,0.18)'] }));
  THEMES.fushimi = mk(Object.assign(night([30, 14, 24], [255, 210, 190]), { trees: ['maple', 'pine', 'maple'], music: 'kitsune', slabs: true, grade: ['rgba(255,120,70,0.14)', 'rgba(50,20,60,0.18)'] }));
  THEMES.fuji = mk({ trees: ['pine'], music: 'raijin', voidSky: true, rays: 0.9, rayRgb: [255, 236, 200], grade: ['rgba(255,220,170,0.12)', 'rgba(80,110,190,0.14)'], fog: [255, 250, 240], fogK: 0.3 });
  THEMES.izumo = mk(Object.assign(night([20, 16, 30], [200, 190, 220]), { trees: ['pine'], music: 'orochi', grade: ['rgba(200,80,80,0.10)', 'rgba(20,10,40,0.22)'] }));
})();
