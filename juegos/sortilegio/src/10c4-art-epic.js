/* =========================================================================
   FUSIONES ÉPICAS — el dibujo de los poderes rehechos «en grande» (como la
   tormenta de arena): primero el Eclipse de Chía.
   · Eclipse: la luna se desliza sobre el sol encima del rival y su sombra se
     cierra en el suelo; en la totalidad el sol negro arde con su corona, el
     suelo se vuelve noche con estrellas, bandas de sombra corren hacia el
     centro y un anillo de luz con runas encierra la zona. Al final, el anillo
     de diamante: un destello en el borde del sol y una explosión de luz.
   Con calidad ligera dibuja menos piezas.
   ========================================================================= */
const ArtEpic = (() => {
  const star4 = (...a) => ArtSpells2.star4(...a), glow = (...a) => ArtSpells.glow(...a);
  const SKY = 175; // altura del sol negro sobre el suelo
  /* ---------- Eclipse ---------- */
  function eclipseUnder(x, G, s) {
    const t = G.time, R = s.r;
    if (s.warn > 0) { // la sombra de la luna llega y se cierra
      const f = 1 - s.warn / (s.S.warn || 0.42), off = (1 - f) * R * 0.9, rr = R * (1.5 - 0.5 * f);
      x.save(); x.globalAlpha = 0.25 + f * 0.55;
      const g = x.createRadialGradient(s.x - off, s.y - off * 0.3, rr * 0.1, s.x - off, s.y - off * 0.3, rr); g.addColorStop(0, 'rgba(8,2,20,0.85)'); g.addColorStop(0.75, 'rgba(18,6,34,0.55)'); g.addColorStop(1, 'rgba(30,8,50,0)');
      x.fillStyle = g; x.beginPath(); x.ellipse(s.x - off, s.y - off * 0.3, rr, rr * 0.55, 0, 0, TAU); x.fill();
      x.globalAlpha = 1; x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(255,214,130,${0.35 + f * 0.5})`; x.lineWidth = 1.5 + f * 2; x.setLineDash([6, 8]); x.lineDashOffset = t * 40;
      x.beginPath(); x.ellipse(s.x, s.y, rr, rr * 0.55, 0, 0, TAU); x.stroke(); x.setLineDash([]); x.restore(); return;
    }
    const fade = Math.min(1, s.life / 0.45, (s.age - (s.S.warn || 0)) * 4 + 0.2);
    x.save(); x.globalAlpha = fade;
    // noche en el suelo
    const g = x.createRadialGradient(s.x, s.y, R * 0.1, s.x, s.y, R * 1.05); g.addColorStop(0, 'rgba(4,1,12,0.9)'); g.addColorStop(0.72, 'rgba(14,4,30,0.82)'); g.addColorStop(0.95, 'rgba(36,10,58,0.4)'); g.addColorStop(1, 'rgba(40,10,60,0)');
    x.fillStyle = g; x.beginPath(); x.ellipse(s.x, s.y, R * 1.05, R * 0.58, 0, 0, TAU); x.fill();
    // bandas de sombra que corren hacia el centro
    x.lineWidth = 3;
    for (let k = 0; k < 4; k++) { const p = ((t * 0.55 + k / 4) % 1), rr = R * (1 - p) * 0.95; x.strokeStyle = `rgba(150,90,220,${0.22 * Math.sin(p * Math.PI)})`; x.beginPath(); x.ellipse(s.x, s.y, rr, rr * 0.55, 0, 0, TAU); x.stroke(); }
    // estrellas que titilan en la noche del eclipse
    x.globalCompositeOperation = 'lighter';
    const n = LOWFX ? 10 : 26;
    for (let k = 0; k < n; k++) { const a = hash2(k, s.id) * TAU, d = Math.sqrt(hash2(s.id, k)) * R * 0.9, tw = 0.5 + 0.5 * Math.sin(t * (2 + hash2(k, 3) * 4) + k);
      const px = s.x + Math.cos(a) * d, py = s.y + Math.sin(a) * d * 0.55; if (tw > 0.75 && !LOWFX) star4(x, px, py, 3 + tw * 4, `rgba(255,246,220,${tw * 0.9})`, t + k); else { x.fillStyle = `rgba(230,220,255,${0.3 + tw * 0.6})`; x.fillRect(px - 1, py - 1, 2, 2); } }
    // el anillo de luz: quema al que lo cruza hacia afuera
    const pul = 0.7 + 0.3 * Math.sin(t * 6);
    x.strokeStyle = `rgba(255,176,80,${0.35 * pul})`; x.lineWidth = 12; x.beginPath(); x.ellipse(s.x, s.y, R, R * 0.55, 0, 0, TAU); x.stroke();
    x.strokeStyle = `rgba(255,232,170,${0.85 * pul})`; x.lineWidth = 2.6; x.beginPath(); x.ellipse(s.x, s.y, R, R * 0.55, 0, 0, TAU); x.stroke();
    // runas que giran sobre el anillo
    x.fillStyle = `rgba(255,240,200,${0.8 * pul})`;
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + t * 0.6, px = s.x + Math.cos(a) * R, py = s.y + Math.sin(a) * R * 0.55; x.save(); x.translate(px, py); x.rotate(a + Math.PI / 2); x.fillRect(-1, -6, 2, 12); x.fillRect(-4, -2, 8, 2); x.restore(); }
    x.restore();
  }
  function corona(x, X, Y, R, t, a, seed) {
    // brillo de la corona y serpentinas que salen del borde (giran despacio y laten)
    x.globalCompositeOperation = 'lighter';
    const cg = x.createRadialGradient(X, Y, R * 0.95, X, Y, R * 3.4); cg.addColorStop(0, `rgba(255,244,214,${0.95 * a})`); cg.addColorStop(0.18, `rgba(255,214,150,${0.55 * a})`); cg.addColorStop(0.5, `rgba(200,140,255,${0.18 * a})`); cg.addColorStop(1, 'rgba(120,60,200,0)');
    x.fillStyle = cg; x.beginPath(); x.arc(X, Y, R * 3.4, 0, TAU); x.fill();
    x.lineCap = 'round';
    for (let k = 0; k < (LOWFX ? 7 : 14); k++) { const a0 = k / (LOWFX ? 7 : 14) * TAU + t * 0.25 + hash2(k, seed) * 0.4, L = R * (1.9 + 1.4 * hash2(seed, k) + 0.35 * Math.sin(t * 2.2 + k * 1.7)), bend = 0.35 * Math.sin(t * 0.8 + k);
      const x0 = X + Math.cos(a0) * R * 1.02, y0 = Y + Math.sin(a0) * R * 1.02, x1 = X + Math.cos(a0 + bend) * L, y1 = Y + Math.sin(a0 + bend) * L, cx = X + Math.cos(a0 + bend * 0.4) * (R + L) * 0.55, cy = Y + Math.sin(a0 + bend * 0.4) * (R + L) * 0.55;
      const lg = x.createLinearGradient(x0, y0, x1, y1); lg.addColorStop(0, `rgba(255,246,226,${0.85 * a})`); lg.addColorStop(1, 'rgba(255,200,150,0)');
      x.strokeStyle = lg; x.lineWidth = 2 + 2.5 * hash2(k, seed + 1); x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo(cx, cy, x1, y1); x.stroke(); }
    // protuberancias rosadas pegadas al borde
    for (let k = 0; k < 3; k++) { const a0 = hash2(seed, k + 9) * TAU + t * 0.1; x.strokeStyle = `rgba(255,110,170,${0.7 * a})`; x.lineWidth = 2.2; x.beginPath(); x.arc(X + Math.cos(a0) * R * 1.05, Y + Math.sin(a0) * R * 1.05, R * 0.22, a0 + Math.PI * 0.9, a0 + Math.PI * 2.1); x.stroke(); }
    // perlas de Baily: puntitos de luz que titilan en el borde
    for (let k = 0; k < 8; k++) { const a0 = k / 8 * TAU + seed, tw = Math.sin(t * 7 + k * 2.3); if (tw > 0.4) star4(x, X + Math.cos(a0) * R, Y + Math.sin(a0) * R, 2 + tw * 5, `rgba(255,255,255,${tw * a})`, t * 3 + k); }
    x.globalCompositeOperation = 'source-over';
  }
  function eclipseOver(x, G, s) {
    const t = G.time, R = 34 * (s.r / 128), X = s.x, Y = s.y - SKY;
    x.save();
    if (s.warn > 0) { // el sol, y la luna que se le pone encima
      const f = 1 - s.warn / (s.S.warn || 0.42);
      x.globalCompositeOperation = 'lighter'; glow(x, X, Y, R * 3, `rgba(255,236,170,${0.5 + 0.3 * (1 - f)})`); x.fillStyle = '#fff6d8'; x.beginPath(); x.arc(X, Y, R, 0, TAU); x.fill();
      x.globalCompositeOperation = 'source-over'; x.fillStyle = '#05010c'; x.beginPath(); x.arc(X - (1 - f) * R * 2.1, Y - (1 - f) * R * 0.5, R * 1.02, 0, TAU); x.fill();
      x.restore(); return;
    }
    const fade = Math.min(1, s.life / 0.45, (s.age - (s.S.warn || 0)) * 4 + 0.2);
    // columna de noche que baja del sol negro
    x.globalAlpha = fade * 0.45; const vg = x.createLinearGradient(0, Y, 0, s.y); vg.addColorStop(0, 'rgba(14,4,30,0)'); vg.addColorStop(1, 'rgba(14,4,30,0.85)'); x.fillStyle = vg;
    x.beginPath(); x.moveTo(X - R, Y); x.lineTo(X + R, Y); x.lineTo(X + s.r, s.y); x.lineTo(X - s.r, s.y); x.fill();
    x.globalAlpha = 1; corona(x, X, Y, R, t, fade, s.id % 97);
    x.fillStyle = '#04010a'; x.beginPath(); x.arc(X, Y, R, 0, TAU); x.fill();
    x.strokeStyle = `rgba(255,250,235,${0.9 * fade})`; x.lineWidth = 1.5; x.beginPath(); x.arc(X, Y, R + 0.5, 0, TAU); x.stroke();
    // a punto de acabar: el anillo de diamante empieza a brillar en el borde
    if (s.life < 0.5) { const k = 1 - s.life / 0.5, a0 = -0.9; x.globalCompositeOperation = 'lighter'; star4(x, X + Math.cos(a0) * R, Y + Math.sin(a0) * R, 8 + k * 34, `rgba(255,255,255,${0.6 + 0.4 * k})`, t * 2); glow(x, X + Math.cos(a0) * R, Y + Math.sin(a0) * R, 18 + k * 50, `rgba(255,246,220,${0.5 * k})`); }
    x.restore();
  }
  /* ---------- capas ---------- */
  function under(x, G) { for (const s of G.spells) if (s.t === 'eclipse') eclipseUnder(x, G, s); }
  function over(x, G) { for (const s of G.spells) if (s.t === 'eclipse') eclipseOver(x, G, s); }
  function lights(G, add) {
    for (const s of G.spells) if (s.t === 'eclipse') {
      if (s.warn > 0) add(s.x, s.y - SKY, 150, [255, 236, 170], 0.7, 0.3);
      else { add(s.x, s.y - SKY, 130, [255, 226, 190], 0.6, 0.25); add(s.x, s.y, s.r * 1.3, [255, 190, 120], 0.22, 0.12); }
    }
  }
  /* ---------- destellos ---------- */
  function fx(G, f) {
    const P = FX.P, S = FX.S, burst = FX.burst;
    switch (f.type) {
      case 'eclipseOn': // se cierra la totalidad: onda oscura hacia adentro y chispazo en el sol
        S({ type: 'ring', x: f.x, y: f.y, r0: f.r * 1.7, r1: f.r, el: 'shadow', life: 0.3, w: 14 }); S({ type: 'star4', x: f.x, y: f.y - SKY, r: 60, life: 0.3 });
        for (let k = 0; k < (LOWFX ? 10 : 24); k++) { const a = Math.random() * TAU; P({ x: f.x + Math.cos(a) * f.r, y: f.y + Math.sin(a) * f.r * 0.55, z: vr(4, 30), vx: -Math.cos(a) * vr(80, 180), vy: -Math.sin(a) * vr(40, 100), vz: vr(10, 60), g: 0, drag: 1.5, life: vr(0.4, 0.8), size: vr(2, 4), color: Math.random() < 0.5 ? '#c49aff' : '#ffe2a8', kind: 'dot' }); }
        return true;
      case 'eclipseRing': S({ type: 'star4', x: f.x, y: f.y - 24, r: 34, life: 0.25 }); burst(f.x, f.y - 20, 'light', LOWFX ? 6 : 14, 260); return true;
      case 'diamond': // el anillo de diamante: luz que estalla desde el centro del eclipse
        S({ type: 'diamond', x: f.x, y: f.y, r: f.r, life: 0.75 });
        S({ type: 'ring', x: f.x, y: f.y, r0: 20, r1: f.r * 1.5, el: 'light', life: 0.45, w: 12, gold: true }); S({ type: 'ring', x: f.x, y: f.y, r0: 10, r1: f.r * 2.1, el: 'shadow', life: 0.6, w: 6, delay: 0.08 });
        S({ type: 'flash', x: f.x, y: f.y, r: f.r * 2.3, el: 'light', life: 0.35 }); S({ type: 'star4', x: f.x, y: f.y - SKY, r: 120, life: 0.45 });
        for (let k = 0; k < (LOWFX ? 16 : 40); k++) { const a = Math.random() * TAU, v = vr(200, 560); P({ x: f.x, y: f.y, z: vr(10, 40), vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: vr(60, 220), g: 400, drag: 1.4, life: vr(0.5, 1.0), size: vr(2, 4), color: Math.random() < 0.55 ? '#fff6d8' : Math.random() < 0.5 ? '#ffd27a' : '#d4a8ff', kind: 'shard' }); }
        return true;
    }
    return false;
  }
  function shape(x, o, f, A) {
    if (o.type !== 'diamond') return false;
    // rayos de luz que salen del centro y se abren hacia el cielo
    x.save(); x.globalCompositeOperation = 'lighter';
    const n = LOWFX ? 10 : 18, L = o.r * (1.2 + 2.2 * smooth(Math.min(1, f * 1.8)));
    for (let k = 0; k < n; k++) { const a = k / n * TAU + o.x * 0.01, w = 0.06 + 0.05 * hash2(k, 7); const g = x.createRadialGradient(o.x, o.y - 30, 0, o.x, o.y - 30, L); g.addColorStop(0, `rgba(255,252,236,${A})`); g.addColorStop(0.5, `rgba(255,220,150,${0.5 * A})`); g.addColorStop(1, 'rgba(255,200,120,0)');
      x.fillStyle = g; x.beginPath(); x.moveTo(o.x, o.y - 30); x.lineTo(o.x + Math.cos(a - w) * L, o.y - 30 + Math.sin(a - w) * L * 0.62); x.lineTo(o.x + Math.cos(a + w) * L, o.y - 30 + Math.sin(a + w) * L * 0.62); x.closePath(); x.fill(); }
    glow(x, o.x, o.y - 30, o.r * (0.6 + f), `rgba(255,250,230,${A})`);
    x.restore(); return true;
  }
  return { under, over, lights, fx, shape };
})();
