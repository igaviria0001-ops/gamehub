/* =========================================================================
   FUSIONES ÉPICAS — el dibujo de los poderes rehechos «en grande» (como la
   tormenta de arena).
   · Media luna (luz + sombra): una luna creciente que gira, sale de luz y
     vuelve de sombra, con estela de lunas fantasma y polvo de estrellas.
   · Cometa (viento + luz): el mago cruza como una estrella fugaz.
   Con calidad ligera dibuja menos piezas.
   ========================================================================= */
const ArtEpic = (() => {
  const star4 = (...a) => ArtSpells2.star4(...a), glow = (...a) => ArtSpells.glow(...a);
  const SKY = 175; // altura del sol negro sobre el suelo
  /* ---------- Media luna ---------- */
  // luna creciente (cóncava hacia +x) centrada en 0,0
  function crescentPath(x, R) {
    const d = R * 0.62, r = R * 0.9, xi = (R * R - r * r + d * d) / (2 * d), yi = Math.sqrt(Math.max(0, R * R - xi * xi)), to = Math.atan2(yi, xi), ti = Math.atan2(yi, xi - d);
    x.beginPath(); x.arc(0, 0, R, to, TAU - to, false); x.arc(d, 0, r, -ti, ti, true); x.closePath();
  }
  function moon(x, X, Y, R, rot, dark, a) {
    if (a <= 0.01) return;
    x.save(); x.translate(X, Y); x.rotate(rot);
    if (!dark) {
      x.globalCompositeOperation = 'lighter'; glow(x, -R * 0.3, 0, R * 2.1, `rgba(170,205,255,${0.26 * a})`);
      x.globalCompositeOperation = 'source-over'; crescentPath(x, R); x.strokeStyle = `rgba(40,58,110,${0.55 * a})`; x.lineWidth = 3.5; x.stroke();
      const g = x.createLinearGradient(-R, 0, R * 0.3, 0); g.addColorStop(0, `rgba(255,253,240,${a})`); g.addColorStop(0.5, `rgba(200,216,255,${a})`); g.addColorStop(1, `rgba(255,214,130,${a})`); x.fillStyle = g; x.fill();
      x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(255,244,210,${0.7 * a})`; x.lineWidth = 1.4; x.stroke();
    } else {
      x.globalCompositeOperation = 'lighter'; glow(x, -R * 0.3, 0, R * 2.3, `rgba(200,50,220,${0.36 * a})`);
      x.globalCompositeOperation = 'source-over'; crescentPath(x, R); const g = x.createLinearGradient(-R, 0, R * 0.3, 0); g.addColorStop(0, `rgba(10,2,18,${a})`); g.addColorStop(1, `rgba(52,14,74,${a})`); x.fillStyle = g; x.fill();
      x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(245,120,235,${0.95 * a})`; x.lineWidth = 2.4; x.stroke();
    }
    x.restore();
  }
  const MZ = 34; // altura a la que vuela la media luna
  function crescentUnder(x, G, s) {
    const u = Math.min(1, s.age / s.T), k = clamp((u - 0.44) / 0.12, 0, 1), R = 27 * (s.r / 32);
    x.save(); x.fillStyle = 'rgba(6,2,12,0.32)'; x.beginPath(); x.ellipse(s.x, s.y + 2, R * 1.1, R * 0.4, 0, 0, TAU); x.fill();
    x.globalCompositeOperation = 'lighter'; x.fillStyle = k < 0.5 ? 'rgba(190,215,255,0.16)' : 'rgba(200,70,220,0.12)'; x.beginPath(); x.ellipse(s.x, s.y, R * 2.4, R * 1.0, 0, 0, TAU); x.fill();
    x.restore();
  }
  function crescentOver(x, G, s) {
    const u = Math.min(1, s.age / s.T), k = clamp((u - 0.44) / 0.12, 0, 1), R = 27 * (s.r / 32), rot = s.age * 15 * (s.side || 1), P0 = Spells2.crescentAt(s, u);
    // estela: lunas fantasma de donde acaba de pasar
    for (let j = LOWFX ? 3 : 6; j >= 1; j--) { const uj = u - j * 0.022; if (uj <= 0) continue; const Pj = Spells2.crescentAt(s, uj), kj = clamp((uj - 0.44) / 0.12, 0, 1);
      moon(x, s.x + Pj[0] - P0[0], s.y + Pj[1] - P0[1] - MZ, R * (1 - j * 0.05), rot - j * 0.34 * (s.side || 1), kj > 0.5, (kj > 0.5 ? 0.42 : 0.26) * (1 - j / 7)); }
    // al dar la vuelta se voltea: de luz a sombra (con un destello)
    if (k > 0 && k < 1) { x.save(); x.globalCompositeOperation = 'lighter'; star4(x, s.x, s.y - MZ, R * (1 + 1.4 * Math.sin(k * Math.PI)), `rgba(255,240,255,${0.9 * Math.sin(k * Math.PI)})`, rot); x.restore(); }
    moon(x, s.x, s.y - MZ, R, rot, false, 1 - k); moon(x, s.x, s.y - MZ, R, rot, true, k);
    if (!LOWFX && Math.random() < 0.85) { const dark = k > 0.5; FX.P({ x: s.x + vr(-12, 12), y: s.y + vr(-6, 6), z: MZ + vr(-10, 10), vx: vr(-30, 30), vy: vr(-20, 20), vz: dark ? vr(20, 60) : vr(-40, 10), g: dark ? -30 : 90, drag: 1, life: vr(0.4, 0.8), size: vr(1.5, 3.2), color: dark ? (Math.random() < 0.5 ? '#c84ad0' : '#5a1c86') : (Math.random() < 0.5 ? '#ffffff' : '#ffe6a0'), kind: 'ember', add: !dark }); }
  }
  /* ---------- Cometa ---------- */
  const CZ = 26;
  function cometUnder(x, G, s) {
    const x1 = s.phase ? s.x1 : s.x, y1 = s.phase ? s.y1 : s.y, fade = s.phase ? clamp(s.life / (s.S.trail || 1.3), 0, 1) : 1;
    x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
    const g = x.createLinearGradient(s.x0, s.y0, x1, y1); g.addColorStop(0, 'rgba(180,210,255,0)'); g.addColorStop(1, `rgba(255,244,210,${0.28 * fade})`);
    x.strokeStyle = g; x.lineWidth = 22; x.beginPath(); x.moveTo(s.x0, s.y0); x.lineTo(x1, y1); x.stroke(); x.restore();
  }
  function cometOver(x, G, s) {
    const t = G.time, x0 = s.x0, y0 = s.y0 - CZ, x1 = s.phase ? s.x1 : s.x, y1 = (s.phase ? s.y1 : s.y) - CZ, L = hypot(x1 - x0, y1 - y0);
    const fade = s.phase ? clamp(s.life / (s.S.trail || 1.3), 0, 1) : 1, ang = L > 1 ? Math.atan2(y1 - y0, x1 - x0) : s.ang, nx = -Math.sin(ang), ny = Math.cos(ang), W = 25 * (s.phase ? 0.5 + 0.5 * fade : 1);
    x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
    if (L > 4) {
      // la estela: un cono de luz que se afina hacia atrás, con el núcleo blanco
      const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, 'rgba(150,190,255,0)'); g.addColorStop(0.5, `rgba(190,220,255,${0.3 * fade})`); g.addColorStop(0.85, `rgba(255,226,150,${0.55 * fade})`); g.addColorStop(1, `rgba(255,248,226,${0.85 * fade})`);
      x.fillStyle = g; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1 + nx * W, y1 + ny * W); x.lineTo(x1 - nx * W, y1 - ny * W); x.closePath(); x.fill();
      const g2 = x.createLinearGradient(x0, y0, x1, y1); g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(1, `rgba(255,255,255,${fade})`); x.strokeStyle = g2; x.lineWidth = 3; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
      // cintas de viento que se enroscan alrededor
      for (const k of [-1, 1]) { x.strokeStyle = `rgba(214,236,255,${0.5 * fade})`; x.lineWidth = 1.6; x.beginPath();
        for (let j = 0; j <= 18; j++) { const q = j / 18, w = Math.sin(q * 10 - t * 20 + k) * W * 0.9 * q, px = x0 + (x1 - x0) * q + nx * w * k, py = y0 + (y1 - y0) * q + ny * w * k; j ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
      // chispas que titilan en la estela
      const n = LOWFX ? 6 : 16; for (let j = 0; j < n; j++) { const q = hash2(j, s.id), tw = 0.5 + 0.5 * Math.sin(t * 12 + j * 2.1), o = (hash2(s.id, j) - 0.5) * W * 1.8;
        if (tw > 0.5) star4(x, x0 + (x1 - x0) * q + nx * o, y0 + (y1 - y0) * q + ny * o, 2.5 + tw * 6 * q, `rgba(255,255,236,${tw * fade})`, t * 3 + j); }
    }
    if (!s.phase) { glow(x, x1, y1, 60, 'rgba(255,244,214,0.8)'); star4(x, x1, y1, 30 + 7 * Math.sin(t * 30), 'rgba(255,255,255,0.95)', t * 6); }
    x.restore();
  }
  /* ---------- Flor de vida: un loto gigante sobre agua ---------- */
  function petal(x, cx, cy, a, L, W, lift, c0, c1) {
    // pétalo en punta, aplastado por la perspectiva, con la punta levantada
    const ca = Math.cos(a), sa = Math.sin(a), tx = cx + ca * L, ty = cy + sa * L * 0.58 - lift, nx = -sa, ny = ca * 0.58;
    const g = x.createLinearGradient(cx, cy, tx, ty); g.addColorStop(0, c0); g.addColorStop(1, c1); x.fillStyle = g;
    x.beginPath(); x.moveTo(cx, cy); x.quadraticCurveTo(cx + ca * L * 0.5 + nx * W, cy + sa * L * 0.3 + ny * W - lift * 0.4, tx, ty); x.quadraticCurveTo(cx + ca * L * 0.5 - nx * W, cy + sa * L * 0.3 - ny * W - lift * 0.4, cx, cy); x.fill();
    x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(cx + ca * L * 0.15, cy + sa * L * 0.09 - lift * 0.1); x.lineTo(tx - ca * 3, ty + 1); x.stroke();
  }
  function lotusUnder(x, G, s) {
    const t = G.time, R = s.r, f = smooth(Math.min(1, s.age * 2.2)), fade = Math.min(1, s.life / 0.5);
    x.save(); x.globalAlpha = fade;
    // agua de la laguna bajo el loto, con ondas
    const g = x.createRadialGradient(s.x, s.y, R * 0.1, s.x, s.y, R); g.addColorStop(0, 'rgba(70,190,200,0.42)'); g.addColorStop(0.8, 'rgba(40,140,170,0.26)'); g.addColorStop(1, 'rgba(40,140,170,0)');
    x.fillStyle = g; x.beginPath(); x.ellipse(s.x, s.y, R * f, R * 0.55 * f, 0, 0, TAU); x.fill();
    x.lineWidth = 1.6;
    for (let k = 0; k < 3; k++) { const p = (t * 0.45 + k / 3) % 1; x.strokeStyle = `rgba(200,255,240,${0.4 * (1 - p)})`; x.beginPath(); x.ellipse(s.x, s.y, R * (0.3 + 0.7 * p) * f, R * 0.55 * (0.3 + 0.7 * p) * f, 0, 0, TAU); x.stroke(); }
    x.strokeStyle = `rgba(160,255,190,${0.55 + 0.2 * Math.sin(t * 3)})`; x.lineWidth = 2; x.beginPath(); x.ellipse(s.x, s.y, R * f, R * 0.55 * f, 0, 0, TAU); x.stroke();
    // hojas de loto flotando
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.4 + Math.sin(t * 0.5 + k) * 0.05, d = R * 0.78 * f, px = s.x + Math.cos(a) * d, py = s.y + Math.sin(a) * d * 0.55, pr = (13 + 4 * hash2(k, 3)) * f;
      x.fillStyle = k % 2 ? '#3f9a4a' : '#4fb055'; x.beginPath(); x.ellipse(px, py, pr, pr * 0.55, 0, a + 0.35, a + 0.35 + TAU - 0.5); x.lineTo(px, py); x.fill(); x.strokeStyle = 'rgba(20,70,30,0.5)'; x.lineWidth = 1; x.stroke(); }
    // el loto: pétalos de afuera (rosado), de adentro (blanco) y el corazón dorado
    const cx = s.x, cy = s.y - 4, rot = t * 0.12;
    for (let k = 0; k < 10; k++) { const a = k / 10 * TAU + rot; if (Math.sin(a) > 0) continue; petal(x, cx, cy, a, 62 * f, 19 * f, 14 * f, 'rgba(255,140,196,0.95)', 'rgba(255,236,246,0.95)'); }
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU - rot * 1.3 + 0.39; petal(x, cx, cy - 2, a, 40 * f, 14 * f, 18 * f, 'rgba(255,190,222,0.98)', 'rgba(255,255,255,0.98)'); }
    for (let k = 0; k < 10; k++) { const a = k / 10 * TAU + rot; if (Math.sin(a) <= 0) continue; petal(x, cx, cy, a, 62 * f, 19 * f, 14 * f, 'rgba(255,140,196,0.95)', 'rgba(255,236,246,0.95)'); }
    x.fillStyle = '#ffd24a'; x.beginPath(); x.ellipse(cx, cy - 8 * f, 8 * f, 5 * f, 0, 0, TAU); x.fill(); x.fillStyle = '#c8901a'; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; x.fillRect(cx + Math.cos(a) * 4 * f - 0.8, cy - 8 * f + Math.sin(a) * 2.4 * f - 0.8, 1.6, 1.6); }
    x.restore();
  }
  function lotusOver(x, G, s) {
    const t = G.time, R = s.r, fade = Math.min(1, s.life / 0.5, s.age * 3);
    x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = fade;
    // columna de vida que sube del loto
    const cg = x.createLinearGradient(0, s.y - 190, 0, s.y); cg.addColorStop(0, 'rgba(170,255,190,0)'); cg.addColorStop(1, `rgba(190,255,200,${0.22 + 0.08 * Math.sin(t * 4)})`); x.fillStyle = cg; x.beginPath(); x.moveTo(s.x - 16, s.y - 190); x.lineTo(s.x + 16, s.y - 190); x.lineTo(s.x + 44, s.y - 6); x.lineTo(s.x - 44, s.y - 6); x.fill();
    // polen dorado y chispas de vida que suben
    for (let k = 0; k < (LOWFX ? 8 : 20); k++) { const p = (t * (0.35 + 0.25 * hash2(k, 1)) + hash2(k, 2)) % 1, a = hash2(k, 3) * TAU, d = Math.sqrt(hash2(k, 4)) * R * 0.85;
      const px = s.x + Math.cos(a) * d + Math.sin(t * 2 + k) * 6, py = s.y + Math.sin(a) * d * 0.55 - p * 120, al = Math.sin(p * Math.PI);
      if (k % 4 === 0) { x.fillStyle = `rgba(190,255,190,${al * 0.9})`; x.font = fontB(11); x.fillText('+', px, py); } else { x.fillStyle = `rgba(255,${226 + (k % 3) * 10},140,${al * 0.85})`; x.beginPath(); x.arc(px, py, 1.6 + (k % 3) * 0.6, 0, TAU); x.fill(); } }
    x.restore();
  }
  /* ---------- Torbellino de fuego: anillos de llama que giran alrededor del embudo (como la tormenta de arena) ---------- */
  function fireRings(x, G, s, H, fade, sway) {
    const t = G.time, R = s.r, lay = LOWFX ? 4 : 7, ring = [];
    for (let L = 0; L < lay; L++) { const hf = L / (lay - 1); ring.push({ hf, L, cx: s.x + sway(hf), cy: s.y - 8 - hf * (H - 10), rr: R * (0.32 + 0.78 * hf), spin: t * (9 - hf * 3) + L * 1.1, dv: 0.6 + 0.8 * hash2(L, 5) }); }
    const band = (o, back) => { const { hf, cx, cy, rr, spin, dv } = o, a0 = back ? Math.PI : 0, a1 = back ? TAU : Math.PI;
      x.setLineDash([rr * 0.5 * dv, rr * 0.3 / dv]); x.lineDashOffset = -spin * rr; x.lineCap = 'round';
      if (back) { x.globalCompositeOperation = 'source-over'; x.strokeStyle = `rgba(110,24,10,${0.5 * fade})`; x.lineWidth = 5 + hf * 4; }
      else { x.globalCompositeOperation = 'source-over'; x.strokeStyle = hf < 0.3 ? `rgba(255,214,120,${0.9 * fade})` : hf < 0.65 ? `rgba(255,128,40,${0.88 * fade})` : `rgba(200,54,24,${0.8 * fade})`; x.lineWidth = 7 + hf * 5; }
      x.beginPath(); x.ellipse(cx, cy, rr, rr * 0.3, 0, a0, a1); x.stroke();
      if (!back) { x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(255,246,200,${0.55 * fade})`; x.lineWidth = 1.8; x.beginPath(); x.ellipse(cx, cy - 2, rr * 0.97, rr * 0.28, 0, a0 + 0.2, a1 - 0.2); x.stroke(); }
      x.setLineDash([]); };
    x.save(); for (let L = lay - 1; L >= 0; L--) band(ring[L], true); for (let L = 0; L < lay; L++) band(ring[L], false);
    // anillo de fuego en el suelo
    x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(255,120,40,${0.45 * fade})`; x.lineWidth = 4; x.beginPath(); x.ellipse(s.x, s.y, R * 1.1, R * 0.45, 0, 0, TAU); x.stroke();
    x.restore();
    // brasas que salen despedidas en espiral
    if (Math.random() < (LOWFX ? 0.3 : 0.7)) { const a = Math.random() * TAU, hf = Math.random(); FX.P({ x: s.x + Math.cos(a) * R * (0.3 + hf), y: s.y + Math.sin(a) * R * 0.3, z: 10 + hf * H, vx: -Math.sin(a) * 220 + Math.cos(a) * 80, vy: Math.cos(a) * 90, vz: vr(20, 90), g: -10, drag: 1.2, life: vr(0.6, 1.1), size: vr(1.5, 3), color: Math.random() < 0.5 ? '#ffd27a' : '#ff7a2a', kind: 'ember' }); }
  }
  /* ---------- Supernova de Zuhé: un sol pequeño que vuela, atrae y estalla ---------- */
  const SUNH = 128; // altura a la que flota el sol sobre el rival
  function sunPos(s) {
    const W = s.S.windup || 0.6, f = Math.min(1, 1 - Math.max(0, s.windup) / W), fl = Math.min(1, f / 0.3), e = smooth(fl);
    const tx = s.x, ty = s.y - SUNH, x0 = s.x0 != null ? s.x0 : tx, y0 = s.y0 != null ? s.y0 : ty;
    const R = fl < 1 ? 9 + fl * 3 : f < 0.86 ? 13 + 20 * (f - 0.3) / 0.56 : 33 - 24 * (f - 0.86) / 0.14; // crece y, justo antes de estallar, se comprime
    return { X: x0 + (tx - x0) * e, Y: y0 + (ty - y0) * e - Math.sin(fl * Math.PI) * 70, f, fl, R };
  }
  function sunBall(x, X, Y, R, t, a, seed, hot) {
    x.globalCompositeOperation = 'lighter';
    glow(x, X, Y, R * 3.4, `rgba(255,130,40,${0.32 * a})`); glow(x, X, Y, R * 1.7, `rgba(255,210,120,${0.45 * a})`);
    // llamaradas (protuberancias) que salen del borde y se curvan
    x.lineCap = 'round';
    const n = LOWFX ? 6 : 12;
    for (let k = 0; k < n; k++) { const a0 = k / n * TAU + t * 1.4 + hash2(k, seed) * 0.5, L = R * (0.45 + 0.75 * Math.abs(Math.sin(t * 4.6 + k * 1.31 + seed))), b = 0.6 * Math.sin(t * 2 + k);
      const x0 = X + Math.cos(a0) * R * 0.92, y0 = Y + Math.sin(a0) * R * 0.92, x1 = X + Math.cos(a0 + b * 0.5) * (R + L), y1 = Y + Math.sin(a0 + b * 0.5) * (R + L), cx = X + Math.cos(a0 + b) * (R + L * 0.7), cy = Y + Math.sin(a0 + b) * (R + L * 0.7);
      const lg = x.createLinearGradient(x0, y0, x1, y1); lg.addColorStop(0, `rgba(255,236,170,${0.95 * a})`); lg.addColorStop(0.5, `rgba(255,140,40,${0.7 * a})`); lg.addColorStop(1, 'rgba(255,80,20,0)');
      x.strokeStyle = lg; x.lineWidth = R * 0.22 + 1.5; x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo(cx, cy, x1, y1); x.stroke(); }
    x.globalCompositeOperation = 'source-over';
    // el cuerpo del sol: núcleo blanco, fotosfera dorada y borde naranja que hierve
    const g = x.createRadialGradient(X - R * 0.25, Y - R * 0.25, 0, X, Y, R); g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, hot ? '#ffffff' : '#ffeaa6'); g.addColorStop(0.7, hot ? '#fff0b0' : '#ffa834'); g.addColorStop(1, hot ? '#ffc060' : '#f2560c');
    x.globalAlpha = a; x.fillStyle = g; x.beginPath();
    for (let k = 0; k <= 24; k++) { const an = k / 24 * TAU, rr = R * (1 + 0.06 * Math.sin(an * 5 + t * 9 + seed)); k ? x.lineTo(X + Math.cos(an) * rr, Y + Math.sin(an) * rr) : x.moveTo(X + Math.cos(an) * rr, Y + Math.sin(an) * rr); }
    x.fill();
    if (!LOWFX) { x.fillStyle = 'rgba(255,170,60,0.35)'; for (let k = 0; k < 5; k++) { const an = hash2(k, seed) * TAU + t * 0.7, d = R * 0.55 * hash2(seed, k); x.beginPath(); x.arc(X + Math.cos(an) * d, Y + Math.sin(an) * d, R * 0.16, 0, TAU); x.fill(); } }
    x.globalAlpha = 1; x.globalCompositeOperation = 'lighter'; star4(x, X - R * 0.3, Y - R * 0.3, R * (0.9 + 0.3 * Math.sin(t * 9)), `rgba(255,255,240,${0.7 * a})`, t * 2);
    x.globalCompositeOperation = 'source-over';
  }
  function novaUnder(x, G, s) {
    const t = G.time, P = sunPos(s), R = s.r, R2 = R * 1.35, a = 0.35 + 0.65 * P.f;
    x.save();
    // calor en el suelo y la luz que baja del sol
    const g = x.createRadialGradient(s.x, s.y, 0, s.x, s.y, R2); g.addColorStop(0, `rgba(255,214,120,${0.32 * a})`); g.addColorStop(0.7, `rgba(255,130,40,${0.14 * a})`); g.addColorStop(1, 'rgba(255,100,30,0)');
    x.globalCompositeOperation = 'lighter'; x.fillStyle = g; x.beginPath(); x.ellipse(s.x, s.y, R2, R2 * 0.55, 0, 0, TAU); x.fill();
    // el borde de la explosión: anillo dorado con trazos que giran
    x.strokeStyle = `rgba(255,220,130,${0.35 + 0.55 * P.f})`; x.lineWidth = 2 + P.f * 2; x.setLineDash([10, 9]); x.lineDashOffset = -t * 60;
    x.beginPath(); x.ellipse(s.x, s.y, R, R * 0.55, 0, 0, TAU); x.stroke(); x.setLineDash([]);
    // la gravedad: anillos que se cierran y brasas que caen en espiral hacia el centro
    for (let k = 0; k < 3; k++) { const p = (t * 1.6 + k / 3) % 1, rr = R2 * (1 - p); x.strokeStyle = `rgba(255,180,90,${0.3 * Math.sin(p * Math.PI) * a})`; x.lineWidth = 2; x.beginPath(); x.ellipse(s.x, s.y, rr, rr * 0.55, 0, 0, TAU); x.stroke(); }
    const n = LOWFX ? 10 : 26; x.lineCap = 'round'; x.lineWidth = 2.2;
    for (let k = 0; k < n; k++) { const p = (t * 1.25 + hash2(k, s.id)) % 1, a0 = hash2(s.id, k) * TAU + p * 2.6, d0 = R2 * (1 - p), d1 = R2 * (1 - Math.min(1, p + 0.07)), a1 = a0 + 0.2;
      x.strokeStyle = `rgba(255,${190 + (k % 3) * 20},110,${0.85 * Math.sin(p * Math.PI) * a})`; x.beginPath(); x.moveTo(s.x + Math.cos(a0) * d0, s.y + Math.sin(a0) * d0 * 0.55); x.lineTo(s.x + Math.cos(a1) * d1, s.y + Math.sin(a1) * d1 * 0.55); x.stroke(); }
    // cono de luz del sol al suelo (cuando ya llegó)
    if (P.fl >= 1) { const w = P.R * 1.2, vg = x.createLinearGradient(0, P.Y, 0, s.y); vg.addColorStop(0, `rgba(255,236,170,${0.32 * a})`); vg.addColorStop(1, `rgba(255,190,90,${0.08 * a})`); x.fillStyle = vg;
      x.beginPath(); x.moveTo(P.X - w, P.Y); x.lineTo(P.X + w, P.Y); x.lineTo(s.x + R * 0.45, s.y); x.lineTo(s.x - R * 0.45, s.y); x.closePath(); x.fill(); }
    x.restore();
  }
  function novaOver(x, G, s) {
    const t = G.time, P = sunPos(s);
    x.save();
    if (P.fl < 1) { // estela de fuego mientras vuela
      const W = s.S.windup || 0.6;
      for (let k = 1; k <= (LOWFX ? 3 : 6); k++) { const q = sunPos(Object.assign({}, s, { windup: Math.min(W, s.windup + k * 0.018) })); x.globalCompositeOperation = 'lighter'; glow(x, q.X, q.Y, q.R * (2.2 - k * 0.2), `rgba(255,${160 - k * 12},60,${0.5 - k * 0.07})`); }
    }
    sunBall(x, P.X, P.Y, P.R, t, 1, s.id % 89, P.f > 0.86);
    if (P.f > 0.86) { const k = (P.f - 0.86) / 0.14; x.globalCompositeOperation = 'lighter'; star4(x, P.X, P.Y, 20 + 70 * k, `rgba(255,255,255,${0.5 + 0.5 * k})`, -t * 3); }
    x.restore();
  }
  /* ---------- halo de sol a los pies de Zuhé ---------- */
  function zuheHalo(x, G, u) {
    if (u.st && u.st.hidden > 0) return;
    const t = G.time, R = 34, n = LOWFX ? 8 : 14;
    x.save(); x.globalCompositeOperation = 'lighter';
    const g = x.createRadialGradient(u.x, u.y, 4, u.x, u.y, R * 1.3); g.addColorStop(0, 'rgba(255,214,120,0.22)'); g.addColorStop(1, 'rgba(255,150,50,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(u.x, u.y, R * 1.3, R * 0.7, 0, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(255,214,130,0.45)'; x.lineWidth = 1.4; x.beginPath(); x.ellipse(u.x, u.y, R * 0.72, R * 0.4, 0, 0, TAU); x.stroke();
    x.lineCap = 'round'; x.lineWidth = 2;
    for (let k = 0; k < n; k++) { const a = k / n * TAU + t * 0.9, l = 0.55 + 0.45 * Math.sin(t * 3 + k * 1.7), r0 = R * 0.8, r1 = R * (0.95 + 0.3 * l);
      x.strokeStyle = `rgba(255,${190 + (k % 2) * 40},110,${0.25 + 0.3 * l})`; x.beginPath(); x.moveTo(u.x + Math.cos(a) * r0, u.y + Math.sin(a) * r0 * 0.55); x.lineTo(u.x + Math.cos(a) * r1, u.y + Math.sin(a) * r1 * 0.55); x.stroke(); }
    x.restore();
  }
  function novaRays(x, o, f, A) {
    // el estallido: rayos de fuego que barren el suelo, un anillo que arde y una columna de luz
    x.save(); x.globalCompositeOperation = 'lighter';
    const n = LOWFX ? 10 : 20, L = o.r * (0.6 + 1.3 * smooth(Math.min(1, f * 2.2)));
    for (let k = 0; k < n; k++) { const a = k / n * TAU + o.seed, w = 0.05 + 0.06 * hash2(k, 11), LL = L * (0.75 + 0.5 * hash2(k, 5));
      const g = x.createRadialGradient(o.x, o.y, 0, o.x, o.y, LL); g.addColorStop(0, `rgba(255,236,180,${0.8 * A})`); g.addColorStop(0.45, `rgba(255,160,60,${0.5 * A})`); g.addColorStop(1, 'rgba(255,80,20,0)');
      x.fillStyle = g; x.beginPath(); x.moveTo(o.x, o.y); x.lineTo(o.x + Math.cos(a - w) * LL, o.y + Math.sin(a - w) * LL * 0.55); x.lineTo(o.x + Math.cos(a + w) * LL, o.y + Math.sin(a + w) * LL * 0.55); x.closePath(); x.fill(); }
    const rr = o.r * (0.3 + 0.85 * smooth(Math.min(1, f * 1.7)));
    x.strokeStyle = `rgba(255,150,50,${0.7 * A})`; x.lineWidth = 16 * A + 2; x.beginPath(); x.ellipse(o.x, o.y, rr, rr * 0.55, 0, 0, TAU); x.stroke();
    x.strokeStyle = `rgba(255,240,190,${A})`; x.lineWidth = 3; x.beginPath(); x.ellipse(o.x, o.y, rr, rr * 0.55, 0, 0, TAU); x.stroke();
    const cw = 34 * A + 4, cg = x.createLinearGradient(o.x - cw, 0, o.x + cw, 0); cg.addColorStop(0, 'rgba(255,200,100,0)'); cg.addColorStop(0.5, `rgba(255,240,200,${0.6 * A})`); cg.addColorStop(1, 'rgba(255,200,100,0)');
    x.fillStyle = cg; x.fillRect(o.x - cw, o.y - 420, cw * 2, 420);
    x.restore();
  }
  /* ---------- capas ---------- */
  function under(x, G) {
    for (const s of G.spells) { if (s.t === 'crescent') crescentUnder(x, G, s); else if (s.t === 'comet') cometUnder(x, G, s); else if (s.t === 'bloom') lotusUnder(x, G, s); else if (s.t === 'nova') novaUnder(x, G, s); }
    for (const u of G.units) if (u.cid === 'zuhe' && u.alive !== false && (u.isMage || u.obj === 'decoy')) zuheHalo(x, G, u);
  }
  function over(x, G) { for (const s of G.spells) { if (s.t === 'crescent') crescentOver(x, G, s); else if (s.t === 'comet') cometOver(x, G, s); else if (s.t === 'bloom') lotusOver(x, G, s); else if (s.t === 'nova') novaOver(x, G, s); } }
  function lights(G, add) {
    for (const s of G.spells) if (s.t === 'nova') { const P = sunPos(s); add(P.X, P.Y + 40, 100 + P.f * 70, [255, 200, 120], 0.35 + P.f * 0.3, 0.18); }
    for (const s of G.spells) if (s.t === 'bloom') add(s.x, s.y - 20, s.r * 1.4, [160, 255, 190], 0.55, 0.18);
    for (const s of G.spells) {
      if (s.t === 'crescent') { const k = Math.min(1, s.age / s.T) > 0.5; add(s.x, s.y - MZ, k ? 90 : 130, k ? [200, 80, 220] : [210, 226, 255], k ? 0.35 : 0.7, 0.25); }
      else if (s.t === 'comet') { if (!s.phase) add(s.x, s.y - 20, 160, [255, 242, 210], 0.85, 0.3); else add((s.x0 + s.x1) / 2, (s.y0 + s.y1) / 2, 140, [200, 220, 255], 0.35 * clamp(s.life, 0, 1), 0.15); }
    }
  }
  /* ---------- destellos ---------- */
  function fx(G, f) {
    const P = FX.P, S = FX.S, burst = FX.burst;
    switch (f.type) {
      case 'moonFlip': // la luna se voltea: de luz a sombra
        S({ type: 'star4', x: f.x, y: f.y - MZ, r: 54, life: 0.3 }); S({ type: 'ring', x: f.x, y: f.y, r0: 10, r1: 70, el: 'shadow', life: 0.35, w: 6 });
        burst(f.x, f.y - MZ, 'light', LOWFX ? 5 : 10, 200); burst(f.x, f.y - MZ, 'shadow', LOWFX ? 5 : 10, 200); return true;
      case 'moonHitO': S({ type: 'star4', x: f.x, y: f.y - 26, r: 44, life: 0.28 }); S({ type: 'flash', x: f.x, y: f.y, r: 70, el: 'light', life: 0.2 }); burst(f.x, f.y - 20, 'light', LOWFX ? 8 : 18, 280, { kind: 'ember' }); return true;
      case 'moonHitB': S({ type: 'ring', x: f.x, y: f.y, r0: 60, r1: 8, el: 'shadow', life: 0.3, w: 8 }); S({ type: 'flashRing', x: f.x, y: f.y - 20, el: 'shadow', r: 70 }); burst(f.x, f.y - 20, 'shadow', LOWFX ? 8 : 18, 240); return true;
      case 'moonCatch': S({ type: 'star4', x: f.x, y: f.y - 30, r: 28, life: 0.25 }); burst(f.x, f.y - 26, 'light', LOWFX ? 4 : 8, 140); return true;
      case 'cometGo': S({ type: 'ring', x: f.x, y: f.y, r0: 10, r1: 90, el: 'wind', life: 0.35, w: 8 }); S({ type: 'star4', x: f.x, y: f.y - CZ, r: 46, life: 0.25 }); burst(f.x, f.y - 20, 'light', LOWFX ? 6 : 14, 240, { kind: 'ember' }); return true;
      case 'cometHit': S({ type: 'star4', x: f.x, y: f.y - 24, r: 52, life: 0.3 }); S({ type: 'flash', x: f.x, y: f.y, r: 80, el: 'light', life: 0.2 }); burst(f.x, f.y - 20, 'light', LOWFX ? 10 : 22, 340, { kind: 'ember' }); return true;
      case 'cometBurst': // al llegar: estallido de luz y una ráfaga que barre el polvo
        S({ type: 'ring', x: f.x, y: f.y, r0: 16, r1: f.r * 1.5, el: 'light', life: 0.4, w: 12, gold: true }); S({ type: 'ring', x: f.x, y: f.y, r0: 10, r1: f.r * 2, el: 'wind', life: 0.5, w: 5, delay: 0.05 });
        S({ type: 'flash', x: f.x, y: f.y, r: f.r * 1.5, el: 'light', life: 0.25 }); S({ type: 'star4', x: f.x, y: f.y - CZ, r: 80, life: 0.35 });
        for (let k = 0; k < (LOWFX ? 14 : 34); k++) { const a = Math.random() * TAU, v = vr(160, 460); P({ x: f.x, y: f.y, z: vr(10, 36), vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: vr(40, 180), g: 300, drag: 1.6, life: vr(0.4, 0.9), size: vr(1.8, 3.6), color: Math.random() < 0.5 ? '#ffffff' : '#ffe8a8', kind: 'ember' }); }
        return true;
      case 'lotusPulse': S({ type: 'ring', x: f.x, y: f.y, r0: 20, r1: f.r * 1.15, el: 'water', life: 0.45, w: 10 }); S({ type: 'ring', x: f.x, y: f.y, r0: 10, r1: f.r * 0.9, el: 'plant', life: 0.5, w: 4, delay: 0.08 });
        for (let k = 0; k < (LOWFX ? 6 : 14); k++) { const a = Math.random() * TAU, v = vr(120, 260); P({ x: f.x, y: f.y - 6, z: 8, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: vr(40, 120), g: 260, drag: 1.6, life: vr(0.5, 0.9), size: vr(2.5, 4), color: Math.random() < 0.5 ? '#ffd0e6' : '#ffffff', kind: 'leaf' }); }
        return true;
      case 'lotusEnd': S({ type: 'ring', x: f.x, y: f.y, r0: f.r * 1.2, r1: 10, el: 'plant', life: 0.35, w: 12 }); S({ type: 'flash', x: f.x, y: f.y, r: f.r * 1.4, el: 'plant', life: 0.3, delay: 0.25 }); S({ type: 'snare', x: f.x, y: f.y, life: 0.8, delay: 0.2 });
        for (let k = 0; k < (LOWFX ? 12 : 30); k++) { const a = Math.random() * TAU, v = vr(160, 380); P({ x: f.x, y: f.y - 8, z: 10, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: vr(80, 220), g: 300, drag: 1.4, life: vr(0.7, 1.2), size: vr(3, 5), color: ['#ffb0d4', '#ffffff', '#ffd24a', '#9fe07a'][k % 4], kind: 'leaf' }); }
        return true;
      case 'crowBurst': // la bandada sale de una mancha de sombra entre plumas
        S({ type: 'ring', x: f.x, y: f.y, r0: 10, r1: 90, el: 'shadow', life: 0.35, w: 10 });
        for (let k = 0; k < (LOWFX ? 10 : 24); k++) { const a = f.a + vr(-1.3, 1.3), v = vr(120, 360); P({ x: f.x + Math.cos(a) * 16, y: f.y + Math.sin(a) * 10, z: vr(10, 40), vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, vz: vr(20, 120), g: 120, drag: 2.2, life: vr(0.6, 1.2), size: vr(2.5, 4), color: Math.random() < 0.75 ? '#140a1a' : '#6a2070', kind: 'leaf', add: false }); }
        return true;
      case 'blizzard': { // Ventisca: ventarrón de nieve y un abanico de cristales de hielo que brotan donde pega
        const n = LOWFX ? 7 : 13, spikes = [];
        for (let k = 0; k < n; k++) { const a = f.ang + (k / (n - 1) - 0.5) * 2 * f.half * 0.92 + vr(-0.05, 0.05), d = f.range * vr(0.55, 1.0); spikes.push({ x: f.x + Math.cos(a) * d, y: f.y + Math.sin(a) * d * 0.62, h: vr(22, 46), w: vr(7, 12), tilt: Math.cos(a) * 0.35 + vr(-0.15, 0.15), delay: d / f.range * 0.18 }); }
        S({ type: 'iceFan', x: f.x, y: f.y, spikes, life: 1.1 });
        for (let k = 0; k < (LOWFX ? 18 : 46); k++) { const a = f.ang + vr(-f.half, f.half), v = vr(380, 760); P({ x: f.x, y: f.y, z: vr(10, 40), vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.62, vz: vr(-20, 60), g: 40, drag: 1.6, life: f.range / v * vr(0.8, 1.2), size: vr(1.5, 3.2), color: Math.random() < 0.7 ? '#ffffff' : '#bfe8ff', kind: 'flake', add: false }); }
        for (let k = 0; k < (LOWFX ? 3 : 6); k++) { const a = f.ang + vr(-f.half, f.half), d = f.range * vr(0.3, 0.95); P({ x: f.x + Math.cos(a) * d, y: f.y + Math.sin(a) * d * 0.62, z: vr(4, 20), vx: Math.cos(a) * 40, vy: Math.sin(a) * 30, vz: vr(10, 40), g: 0, drag: 1, life: vr(0.8, 1.4), size: vr(12, 20), color: 'rgba(200,235,255,0.16)', kind: 'smoke', add: false }); }
        return true; }
      case 'blackStrike': // Rayo negro: un relámpago oscuro cae del cielo sobre el rival, con borde magenta, y deja la marca
        S({ type: 'blackPillar', x: f.x, y: f.y, life: 0.5, seed: Math.random() * 1000 }); S({ type: 'ring', x: f.x, y: f.y, r0: 10, r1: 110, el: 'shadow', life: 0.4, w: 12 });
        for (let k = 0; k < (LOWFX ? 10 : 24); k++) { const a = Math.random() * TAU, v = vr(160, 420); P({ x: f.x, y: f.y, z: vr(4, 30), vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: vr(60, 200), g: 500, drag: 1.3, life: vr(0.4, 0.8), size: vr(2, 4), color: Math.random() < 0.6 ? '#1a0822' : '#ff5ad0', kind: 'shard', add: false }); }
        return true;
      case 'sunBlast': // Supernova: el estallido grande (rayos, anillo de fuego, columna de luz y brasas que suben)
        S({ type: 'novaRays', x: f.x, y: f.y, r: f.r, life: 0.7, seed: Math.random() * 6 }); S({ type: 'star4', x: f.x, y: f.y - SUNH, r: 110, life: 0.4 });
        S({ type: 'ring', x: f.x, y: f.y, r0: 20, r1: f.r * 1.6, el: 'fire', life: 0.5, w: 14, delay: 0.05 });
        for (let k = 0; k < (LOWFX ? 14 : 36); k++) { const a = Math.random() * TAU, d = Math.random() * f.r * 0.8; P({ x: f.x + Math.cos(a) * d, y: f.y + Math.sin(a) * d * 0.55, z: vr(2, 20), vx: Math.cos(a) * vr(20, 80), vy: Math.sin(a) * vr(10, 40), vz: vr(140, 360), g: -20, drag: 1.2, life: vr(0.7, 1.4), size: vr(2, 4.5), color: Math.random() < 0.5 ? '#ffd27a' : '#ff8a2a', kind: 'ember' }); }
        return true;
    }
    return false;
  }
  function iceFan(x, o, f) {
    // cristales que brotan (rápido), brillan y al final se quiebran (bajan y se apagan)
    x.save();
    for (const sp of o.spikes) { const tt = o.t - sp.delay; if (tt < 0) continue; const g = Math.min(1, tt / 0.12), fadeK = o.t > o.life - 0.35 ? (o.life - o.t) / 0.35 : 1, h = sp.h * g * (0.6 + 0.4 * fadeK);
      x.globalAlpha = Math.max(0, fadeK);
      x.fillStyle = 'rgba(200,235,255,0.35)'; x.beginPath(); x.ellipse(sp.x, sp.y, sp.w * 1.8, sp.w * 0.7, 0, 0, TAU); x.fill();
      const tx = sp.x + sp.tilt * h, ty = sp.y - h, gr = x.createLinearGradient(sp.x, sp.y, tx, ty); gr.addColorStop(0, 'rgba(120,190,240,0.95)'); gr.addColorStop(0.6, 'rgba(200,240,255,0.95)'); gr.addColorStop(1, 'rgba(255,255,255,1)');
      x.fillStyle = gr; x.beginPath(); x.moveTo(sp.x - sp.w * 0.6, sp.y); x.lineTo(tx, ty); x.lineTo(sp.x + sp.w * 0.6, sp.y); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = 1; x.beginPath(); x.moveTo(sp.x - sp.w * 0.15, sp.y - 1); x.lineTo(tx, ty); x.stroke();
      x.fillStyle = 'rgba(150,210,250,0.9)'; x.beginPath(); x.moveTo(sp.x + sp.w * 0.5, sp.y); x.lineTo(sp.x + sp.w * 0.9 + sp.tilt * h * 0.4, sp.y - h * 0.45); x.lineTo(sp.x + sp.w * 1.1, sp.y); x.fill();
      if (g >= 1 && Math.sin(o.t * 20 + sp.x) > 0.8) { x.globalCompositeOperation = 'lighter'; star4(x, tx, ty, 6, 'rgba(255,255,255,0.9)', o.t * 4); x.globalCompositeOperation = 'source-over'; } }
    x.restore();
  }
  function blackPillar(x, o, f, A) {
    const top = o.y - 300, seg = 9, fl = Math.floor(o.t * 28), pts = [];
    for (let k = 0; k <= seg; k++) { const q = k / seg; pts.push([o.x + (k && k < seg ? (hash2(k, o.seed + fl) - 0.5) * 46 * (1 - q * 0.4) : 0), top + (o.y - top) * q]); }
    const path = () => { x.beginPath(); pts.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); };
    x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
    x.globalCompositeOperation = 'lighter'; path(); x.strokeStyle = `rgba(255,70,200,${0.6 * A})`; x.lineWidth = 44 * A + 6; x.stroke();
    x.globalCompositeOperation = 'source-over'; path(); x.strokeStyle = `rgba(14,2,20,${0.95 * A})`; x.lineWidth = 17 * A + 4; x.stroke();
    x.globalCompositeOperation = 'lighter'; path(); x.strokeStyle = `rgba(255,190,240,${A})`; x.lineWidth = 2.4; x.stroke();
    glow(x, o.x, o.y - 10, 70 * A + 10, `rgba(255,80,210,${0.6 * A})`);
    x.restore();
  }
  function shape(x, o, f, A) {
    if (o.type === 'iceFan') { iceFan(x, o, f); return true; }
    if (o.type === 'blackPillar') { blackPillar(x, o, f, A); return true; }
    if (o.type === 'novaRays') { novaRays(x, o, f, A); return true; }
    return false;
  }
  return { under, over, lights, fx, shape, fireRings };
})();
