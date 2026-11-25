/* =========================================================================
   ARTE DE LA TIERRA 3.0 — tormenta de arena con piedras que orbitan, torres
   de rayo con el arco entre ellas, el anillo y la jaula de cristal, la
   sombra con manos y las fauces de la Fosa, el alud de lodo, meteoros con
   cola de fuego y sus fragmentos, cráteres y raíces que revientan del suelo.
   Todo con versión ligera (LOWFX) y media (MIDFX).
   ========================================================================= */
const ArtEarth = (() => {
  const glow = (...a) => ArtSpells.glow(...a);
  const SAND = ['rgba(214,170,110,', 'rgba(190,146,92,', 'rgba(236,200,140,'];
  // puntos suaves de un color (polvo, humo)
  const softs = {};
  function soft(col) { if (softs[col]) return softs[col]; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, col); g.addColorStop(0.55, col.replace(/[\d.]+\)$/, m => (parseFloat(m) * 0.5) + ')')); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return (softs[col] = c); }
  const sdot = (x, col, X, Y, r) => x.drawImage(soft(col), X - r, Y - r, r * 2, r * 2);
  // una piedra facetada que gira
  function rock(x, X, Y, r, rot, seed, hot) {
    x.save(); x.translate(X, Y); x.rotate(rot);
    x.beginPath(); for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, rr = r * (0.78 + 0.3 * hash2(seed, k)); k ? x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : x.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.closePath();
    x.fillStyle = hot ? '#3a2018' : '#6e5236'; x.fill(); x.strokeStyle = hot ? 'rgba(255,120,40,0.9)' : 'rgba(40,26,14,0.8)'; x.lineWidth = hot ? 2 : 1.4; x.stroke();
    x.fillStyle = hot ? 'rgba(255,150,60,0.85)' : '#a8825a'; x.beginPath(); x.moveTo(-r * 0.5, -r * 0.4); x.lineTo(r * 0.25, -r * 0.62); x.lineTo(r * 0.35, -r * 0.05); x.lineTo(-r * 0.2, r * 0.1); x.closePath(); x.fill();
    if (hot) { x.strokeStyle = 'rgba(255,220,120,0.9)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(-r * 0.6, r * 0.2); x.lineTo(-r * 0.1, r * 0.05); x.lineTo(r * 0.2, r * 0.45); x.stroke(); }
    x.restore();
  }
  // rayo quebrado entre dos puntos (cambia de forma muchas veces por segundo)
  function jag(x, x0, y0, x1, y1, seed, n, amp) { x.beginPath(); x.moveTo(x0, y0); for (let k = 1; k < n; k++) { const f = k / n, e = Math.sin(f * Math.PI); x.lineTo(lerp(x0, x1, f) + (hash2(seed, k) - 0.5) * amp * 2 * e, lerp(y0, y1, f) + (hash2(k, seed) - 0.5) * amp * 2 * e); } x.lineTo(x1, y1); x.stroke(); }

  /* ---------- en el suelo ---------- */
  function under(x, G) {
    const t = G.time;
    for (const s of G.spells) {
      if (s.t === 'sandstorm') {
        const fade = Math.min(1, s.life / 0.5, s.grow * 1.5), R = s.r;
        x.save(); x.globalAlpha = fade;
        const g = x.createRadialGradient(s.x, s.y, R * 0.1, s.x, s.y, R); g.addColorStop(0, 'rgba(120,86,48,0.05)'); g.addColorStop(0.7, 'rgba(150,108,62,0.22)'); g.addColorStop(1, 'rgba(150,108,62,0)');
        x.fillStyle = g; x.beginPath(); x.arc(s.x, s.y, R, 0, TAU); x.fill();
        // brazos de arena en espiral
        x.lineCap = 'round';
        for (let arm = 0; arm < 3; arm++) {
          x.strokeStyle = SAND[arm] + '0.45)'; x.lineWidth = 7 - arm * 1.5; x.beginPath();
          for (let k = 0; k <= 22; k++) { const f = k / 22, a = s.rot * 1.4 + arm * TAU / 3 + f * 3.2, rr = R * (0.2 + 0.78 * f); k ? x.lineTo(s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr) : x.moveTo(s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr); }
          x.stroke();
        }
        x.setLineDash([14, 10]); x.lineDashOffset = -s.rot * 40; x.strokeStyle = 'rgba(236,200,140,0.5)'; x.lineWidth = 2.5; x.beginPath(); x.arc(s.x, s.y, R * 0.98, 0, TAU); x.stroke(); x.setLineDash([]);
        x.restore();
      } else if (s.t === 'tesla') {
        const on = s.rise <= 0, fl = 0.6 + 0.4 * Math.sin(t * 30 + s.id);
        x.save(); x.lineCap = 'round'; x.strokeStyle = 'rgba(20,12,30,0.35)'; x.lineWidth = 12; x.beginPath(); x.moveTo(s.x0, s.y0 + 4); x.lineTo(s.x1, s.y1 + 4); x.stroke();
        if (on) { x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(170,130,255,${0.22 * fl})`; x.lineWidth = 18; x.beginPath(); x.moveTo(s.x0, s.y0 + 2); x.lineTo(s.x1, s.y1 + 2); x.stroke(); }
        x.restore();
      } else if (s.t === 'crystal') {
        if (s.phase === 0) {
          const f = 1 - Math.max(0, s.lock) / (s.S.lock || 0.34), R = lerp(118, 70, f);
          x.save(); x.globalCompositeOperation = 'lighter';
          x.fillStyle = `rgba(255,226,140,${0.05 + f * 0.12})`; x.beginPath(); x.arc(s.x, s.y, R, 0, TAU); x.fill();
          x.strokeStyle = `rgba(255,240,190,${0.55 + f * 0.45})`; x.lineWidth = 2.5 + f * 2; x.beginPath(); x.arc(s.x, s.y, R, 0, TAU); x.stroke();
          x.lineWidth = 1.5; x.beginPath(); x.arc(s.x, s.y, R * 0.72, 0, TAU); x.stroke();
          for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + t * 3, px = s.x + Math.cos(a) * R * 0.86, py = s.y + Math.sin(a) * R * 0.86; x.fillStyle = '#fff6d2'; x.beginPath(); x.moveTo(px, py - 6); x.lineTo(px + 3.5, py); x.lineTo(px, py + 6); x.lineTo(px - 3.5, py); x.fill(); }
          x.restore();
        } else {
          const fade = Math.min(1, s.life / 0.4);
          x.save(); x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(s.x, s.y, 4, s.x, s.y, 80); g.addColorStop(0, `rgba(255,244,200,${0.28 * fade})`); g.addColorStop(1, 'rgba(255,200,100,0)'); x.fillStyle = g; x.beginPath(); x.arc(s.x, s.y, 80, 0, TAU); x.fill(); x.restore();
        }
      } else if (s.t === 'maw') {
        if (s.phase === 0) stain(x, G, s);
        else pit(x, G, s);
      } else if (s.t === 'lob' && (s.kind === 'meteor' || s.kind === 'frag')) {
        const f = Math.min(1, s.tt / s.T), r = (s.kind === 'meteor' ? s.S.r : s.S.r) * (s.size || 1), p = 0.5 + 0.5 * Math.sin(t * 22);
        x.save(); x.globalCompositeOperation = 'lighter';
        x.fillStyle = `rgba(255,90,30,${0.06 + f * 0.22})`; x.beginPath(); x.arc(s.tx, s.ty, r * (0.3 + 0.7 * f), 0, TAU); x.fill();
        x.strokeStyle = `rgba(255,${140 + p * 60},60,${0.45 + f * 0.5})`; x.lineWidth = s.kind === 'meteor' ? 3 : 2; x.beginPath(); x.arc(s.tx, s.ty, r, 0, TAU); x.stroke();
        if (s.kind === 'meteor') { x.lineWidth = 1.5; for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + t * 1.5; x.beginPath(); x.moveTo(s.tx + Math.cos(a) * r * 0.55, s.ty + Math.sin(a) * r * 0.55); x.lineTo(s.tx + Math.cos(a) * r * 0.9, s.ty + Math.sin(a) * r * 0.9); x.stroke(); } }
        x.restore();
        x.fillStyle = `rgba(8,4,10,${0.2 + f * 0.35})`; x.beginPath(); x.ellipse(s.x, s.y, 8 + f * 16, 5 + f * 8, 0, 0, TAU); x.fill();
      } else if (s.t === 'proj' && s.root3 && s.x0 != null) roots(x, G, s);
    }
  }
  // la sombra de la Fosa: mancha viva que se pega a los pies
  function stain(x, G, s) {
    const t = G.time, R = s.r * 0.95, f = 1 - Math.max(0, s.chase) / (s.S.chase || 0.8);
    x.save();
    x.fillStyle = `rgba(6,2,10,${0.55 + f * 0.3})`; x.beginPath();
    for (let k = 0; k <= 24; k++) { const a = k / 24 * TAU, rr = R * (0.82 + 0.18 * Math.sin(a * 5 + t * 6 + s.id) + 0.08 * Math.sin(a * 11 - t * 9)); k ? x.lineTo(s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr) : x.moveTo(s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr); }
    x.closePath(); x.fill();
    x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(214,84,180,${0.35 + f * 0.55})`; x.lineWidth = 2 + f * 2.5; x.stroke();
    // grietas que crecen: está por abrirse
    x.strokeStyle = `rgba(255,120,220,${f * 0.7})`; x.lineWidth = 1.6; x.lineCap = 'round';
    for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + s.id, L = R * (0.3 + 0.7 * f) * (0.6 + 0.4 * hash2(k, s.id)); x.beginPath(); x.moveTo(s.x, s.y); x.lineTo(s.x + Math.cos(a + 0.25) * L * 0.5, s.y + Math.sin(a + 0.25) * L * 0.5); x.lineTo(s.x + Math.cos(a) * L, s.y + Math.sin(a) * L); x.stroke(); }
    x.restore();
  }
  // las fauces: borde de roca con colmillos y el vacío adentro; mientras se lo traga, los colmillos se van cerrando
  function pit(x, G, s) {
    const t = G.time, R = s.r, S = s.S, sk = S.sink || 0.85, bite = s.phase === 1 ? clamp((sk - s.sink) / sk, 0, 1) : 1, fade = s.phase === 2 ? clamp(s.life / 0.55, 0, 1) : Math.min(1, (sk - s.sink) * 8 + 0.25);
    const Rm = s.phase === 2 ? R * 0.55 * fade + 4 : R * (1 - 0.3 * bite); // la boca se va cerrando
    x.save(); x.globalAlpha = Math.max(0, fade); x.translate(s.x, s.y); x.scale(1, 0.62);
    // borde de roca partida, oscuro y violeta
    x.fillStyle = '#231a26'; x.beginPath(); for (let k = 0; k <= 22; k++) { const a = k / 22 * TAU, rr = R * (1.12 + 0.12 * hash2(k % 22, s.id)); k ? x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : x.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.closePath(); x.fill();
    // el vacío
    const g = x.createRadialGradient(0, R * 0.1, Rm * 0.05, 0, 0, Rm); g.addColorStop(0, '#000'); g.addColorStop(0.6, '#07020d'); g.addColorStop(1, '#3a1150');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, Rm, 0, TAU); x.fill();
    x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
    for (let k = 0; k < 3; k++) { x.strokeStyle = `rgba(170,60,170,${0.26 - k * 0.06})`; x.lineWidth = 3 - k * 0.6; x.beginPath(); for (let j = 0; j <= 18; j++) { const q = j / 18, a = -t * 2.6 + k * 2.1 + q * 4, rr = Rm * 0.9 * (1 - q * 0.9); j ? x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : x.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.stroke(); }
    // labio de la boca: brilla magenta y late
    const pl = 0.6 + 0.4 * Math.sin(t * 9); x.strokeStyle = `rgba(235,80,210,${0.75 * pl})`; x.lineWidth = 3.5; x.beginPath(); x.arc(0, 0, Rm, 0, TAU); x.stroke();
    x.globalCompositeOperation = 'source-over';
    // colmillos cortos de roca alrededor de la boca, apuntando adentro
    const N = LOWFX ? 9 : 14;
    for (let k = 0; k < N; k++) { const a = k / N * TAU + s.id * 0.3, ca = Math.cos(a), sa = Math.sin(a), b = Rm * 1.04, L = R * (0.2 + 0.14 * hash2(k, s.id)), w = 0.17; x.fillStyle = k % 2 ? '#4e3f52' : '#6c5c70'; x.beginPath(); x.moveTo(Math.cos(a - w) * b, Math.sin(a - w) * b); x.lineTo(ca * (b - L), sa * (b - L)); x.lineTo(Math.cos(a + w) * b, Math.sin(a + w) * b); x.closePath(); x.fill(); }
    x.restore();
    // manos de sombra que salen del borde y lo sujetan (mientras está adentro)
    if (s.phase === 1) { x.save(); x.lineCap = 'round'; const n = LOWFX ? 3 : 5;
      for (let k = 0; k < n; k++) { const a = k / n * TAU + s.id + Math.sin(t * 3 + k) * 0.2, bx = s.x + Math.cos(a) * Rm, by = s.y + Math.sin(a) * Rm * 0.62, h = 30 + 16 * Math.sin(t * 5 + k * 1.7), tx = s.x + Math.cos(a) * Rm * 0.25, ty = s.y - h;
        x.strokeStyle = 'rgba(12,4,18,0.92)'; x.lineWidth = 7; x.beginPath(); x.moveTo(bx, by); x.quadraticCurveTo(bx + (tx - bx) * 0.2, ty + 6, tx, ty + 12); x.stroke();
        x.strokeStyle = 'rgba(230,90,210,0.7)'; x.lineWidth = 1.4; x.stroke();
        x.fillStyle = 'rgba(12,4,18,0.92)'; x.beginPath(); x.arc(tx, ty + 12, 5, 0, TAU); x.fill(); }
      x.restore(); }
    x.save(); x.globalCompositeOperation = 'lighter'; for (let k = 0; k < 6; k++) { const p = (t * 0.8 + k / 6) % 1; x.fillStyle = `rgba(214,84,180,${(1 - p) * 0.6 * fade})`; x.beginPath(); x.arc(s.x + Math.sin(k * 2.3 + t) * R * 0.5, s.y - p * 60, 2.4 * (1 - p) + 0.7, 0, TAU); x.fill(); } x.restore();
  }
  // raíces: van reventando del suelo por donde pasa la que corre por debajo
  function roots(x, G, s) {
    const dx = s.x - s.x0, dy = s.y - s.y0, L = hypot(dx, dy); if (L < 30) return; const ux = dx / L, uy = dy / L, sp = hypot(s.vx, s.vy) || 600, step = LOWFX ? 34 : 24;
    x.save(); x.lineCap = 'round';
    for (let d = 30; d < L; d += step) {
      const age = (L - d) / sp; if (age > 0.7) continue; const k = Math.min(1, age * 9) * (1 - Math.max(0, age - 0.45) / 0.25), sd = Math.floor(d / step) + s.id * 7;
      const px = s.x0 + ux * d + (hash2(sd, 1) - 0.5) * 16, py = s.y0 + uy * d + (hash2(sd, 2) - 0.5) * 16, h = (16 + hash2(sd, 3) * 16) * k, lean = (hash2(sd, 4) - 0.5) * 0.6;
      x.fillStyle = '#3a2614'; x.beginPath(); x.ellipse(px, py, 7, 3, 0, 0, TAU); x.fill();
      x.strokeStyle = '#5a3a1e'; x.lineWidth = 6 * k + 1; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + lean * 10, py - h * 0.6, px + lean * 16, py - h); x.stroke();
      x.strokeStyle = '#8a6a3a'; x.lineWidth = 2 * k; x.beginPath(); x.moveTo(px - 1, py - 2); x.quadraticCurveTo(px + lean * 10 - 1, py - h * 0.6, px + lean * 16 - 1, py - h); x.stroke();
      if (k > 0.5) { x.fillStyle = '#7ec85a'; x.beginPath(); x.ellipse(px + lean * 16 + 3, py - h + 2, 4, 2, 0.6, 0, TAU); x.fill(); }
    }
    x.restore();
  }

  /* ---------- lo que se ordena con los magos ---------- */
  function items(G, list) {
    const t = G.time;
    for (const s of G.spells) {
      if (s.t === 'sandstorm') {
        const fade = Math.min(1, s.life / 0.5, s.grow * 1.6), N = LOWFX ? 10 : MIDFX ? 16 : 24, R = s.r * 0.86;
        for (let k = 0; k < N; k++) {
          const a = s.rot * 0.7 + k / N * TAU, px = s.x + Math.cos(a) * R * (0.85 + 0.15 * hash2(k, 1)), py = s.y + Math.sin(a) * R * (0.85 + 0.15 * hash2(k, 1)), h = 14 + 60 * hash2(k, 2), sz = 34 + 30 * hash2(k, 3);
          list.push({ y: py, draw: x => { x.globalAlpha = fade * 0.55; sdot(x, ['rgba(150,108,62,', 'rgba(176,130,80,', 'rgba(122,86,50,'][k % 3] + '0.9)', px, py - h, sz); x.globalAlpha = 1; } });
        }
        for (const [j, k] of s.rocks.entries()) {
          const h = k.h + Math.sin(t * 3 + j) * 8;
          list.push({ y: k.y, draw: x => { x.fillStyle = 'rgba(10,6,4,0.3)'; x.beginPath(); x.ellipse(k.x, k.y, k.sz, k.sz * 0.4, 0, 0, TAU); x.fill(); rock(x, k.x, k.y - h, k.sz, t * 4 + j, j + s.id, false); } });
        }
      } else if (s.t === 'tesla') {
        list.push({ y: Math.max(s.y0, s.y1) + 3, draw: x => arc(x, G, s) });
      } else if (s.t === 'maw' && s.phase === 0) {
        const n = LOWFX ? 3 : 5, f = 1 - Math.max(0, s.chase) / (s.S.chase || 0.8);
        for (let k = 0; k < n; k++) { const a = k / n * TAU + s.id + Math.sin(t * 2 + k) * 0.2, px = s.x + Math.cos(a) * s.r * 0.62, py = s.y + Math.sin(a) * s.r * 0.62; list.push({ y: py, draw: x => hand(x, px, py, a, f, t * 5 + k, s.grip) }); }
      } else if (s.t === 'mudslide') {
        const cx = s.x + Math.cos(s.ang) * s.d, cy = s.y + Math.sin(s.ang) * s.d;
        list.push({ y: cy, draw: x => mud(x, G, s) });
      }
    }
  }
  // el arco eléctrico entre las dos torres
  function arc(x, G, s) {
    if (s.rise > 0) return; const t = G.time, ax = s.x0, ay = s.y0 - 62, bx = s.x1, by = s.y1 - 62, seed = Math.floor(t * 24) + s.id * 13, L = hypot(bx - ax, by - ay), n = Math.max(6, Math.round(L / 26));
    x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; x.lineJoin = 'round';
    x.strokeStyle = 'rgba(150,110,255,0.35)'; x.lineWidth = 12; jag(x, ax, ay, bx, by, seed, n, 10);
    x.strokeStyle = 'rgba(210,180,255,0.85)'; x.lineWidth = 4; jag(x, ax, ay, bx, by, seed, n, 10);
    x.strokeStyle = '#ffffff'; x.lineWidth = 1.6; jag(x, ax, ay, bx, by, seed, n, 10);
    if (!LOWFX) { x.strokeStyle = 'rgba(200,170,255,0.6)'; x.lineWidth = 1.4; jag(x, ax, ay, bx, by, seed + 7, n, 22); }
    glow(x, ax, ay, 34, 'rgba(200,170,255,0.9)'); glow(x, bx, by, 34, 'rgba(200,170,255,0.9)');
    x.restore();
  }
  // mano de sombra que sale del suelo y agarra
  function hand(x, px, py, a, f, ph, grip) {
    const h = (22 + 18 * f) * (0.8 + 0.2 * Math.sin(ph)), lean = Math.cos(a) * -0.35 * (grip ? 1.5 : 1);
    x.save(); x.lineCap = 'round';
    x.strokeStyle = '#08030c'; x.lineWidth = 7; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + lean * 10, py - h * 0.6, px + lean * 18, py - h); x.stroke();
    x.lineWidth = 2.4; for (let k = -1; k <= 1; k++) { x.beginPath(); x.moveTo(px + lean * 18, py - h); x.quadraticCurveTo(px + lean * 18 + k * 7, py - h - 8, px + lean * 22 + k * 9, py - h - 4 + Math.abs(k) * 3 + (grip ? 4 : 0)); x.stroke(); }
    x.globalCompositeOperation = 'lighter'; x.strokeStyle = 'rgba(214,84,180,0.45)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + lean * 10, py - h * 0.6, px + lean * 18, py - h); x.stroke();
    x.restore();
  }
  // el frente de la avalancha de barro
  function mud(x, G, s) {
    const t = G.time, d = s.d, H = 38 + 9 * Math.sin(t * 10), n = 16, fade = Math.min(1, (s.range - d) / 60 + 0.2);
    const P = []; for (let k = 0; k <= n; k++) { const a = s.ang - s.half + k / n * s.half * 2; P.push([s.x + Math.cos(a) * d, s.y + Math.sin(a) * d, a]); }
    x.save(); x.globalAlpha = Math.min(1, fade);
    x.fillStyle = 'rgba(10,6,4,0.3)'; x.beginPath(); P.forEach(([px, py], k) => k ? x.lineTo(px, py + 6) : x.moveTo(px, py + 6)); for (let k = n; k >= 0; k--) { const [px, py, a] = P[k]; x.lineTo(px - Math.cos(a) * 30, py - Math.sin(a) * 30 + 6); } x.fill();
    // el cuerpo del alud: una lengua de barro que viene detrás de la cresta, con grumos y piedras que ruedan
    const TL = Math.min(90, d * 0.6) + 10;
    const bg = x.createLinearGradient(P[n >> 1][0] - Math.cos(s.ang) * TL, P[n >> 1][1] - Math.sin(s.ang) * TL, P[n >> 1][0], P[n >> 1][1]); bg.addColorStop(0, 'rgba(70,48,28,0)'); bg.addColorStop(0.45, 'rgba(78,54,30,0.8)'); bg.addColorStop(1, '#4e3520');
    x.fillStyle = bg; x.beginPath(); P.forEach(([px, py, a], k) => { const X = px - Math.cos(a) * 6, Y = py - Math.sin(a) * 6 - H * 0.35; k ? x.lineTo(X, Y) : x.moveTo(X, Y); }); for (let k = n; k >= 0; k--) { const [px, py, a] = P[k], w = Math.sin(k * 2.3 + t * 7) * 8; x.lineTo(px - Math.cos(a) * (TL + w), py - Math.sin(a) * (TL + w)); } x.closePath(); x.fill();
    for (let k = 0; k < (LOWFX ? 6 : 14); k++) { const q = hash2(k, s.id), j = Math.min(n, Math.round(q * n)), [px, py, a] = P[j], back = 14 + hash2(s.id, k) * (TL - 24), bob = Math.sin(t * 9 + k * 1.9) * 3, r = 6 + hash2(k, 3) * 7;
      const X = px - Math.cos(a) * back, Y = py - Math.sin(a) * back - H * 0.25 * (1 - back / TL) + bob; x.fillStyle = '#5e4128'; x.beginPath(); x.ellipse(X, Y, r, r * 0.7, 0, 0, TAU); x.fill(); x.fillStyle = 'rgba(176,140,96,0.55)'; x.beginPath(); x.ellipse(X - r * 0.25, Y - r * 0.3, r * 0.45, r * 0.25, -0.3, 0, TAU); x.fill(); }
    // la cresta: una ola de barro que se levanta y se enrosca
    const cg = x.createLinearGradient(0, P[n >> 1][1] - H - 10, 0, P[n >> 1][1]); cg.addColorStop(0, '#7a5634'); cg.addColorStop(0.5, '#5a3e22'); cg.addColorStop(1, '#3e2a16');
    x.fillStyle = cg; x.beginPath(); P.forEach(([px, py], k) => k ? x.lineTo(px, py) : x.moveTo(px, py)); for (let k = n; k >= 0; k--) { const [px, py, a] = P[k]; const w = Math.sin(k * 1.7 + t * 12) * 5; x.lineTo(px - Math.cos(a) * 26, py - Math.sin(a) * 26 - H - w); } x.closePath(); x.fill();
    x.strokeStyle = '#8a6a40'; x.lineWidth = 4; x.lineCap = 'round'; x.beginPath(); for (let k = 0; k <= n; k++) { const [px, py, a] = P[k], w = Math.sin(k * 1.7 + t * 12) * 5; const X = px - Math.cos(a) * 18, Y = py - Math.sin(a) * 18 - H - w; k ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.stroke();
    x.strokeStyle = 'rgba(214,190,150,0.7)'; x.lineWidth = 2; x.beginPath(); for (let k = 0; k <= n; k++) { const [px, py, a] = P[k], w = Math.sin(k * 1.7 + t * 12) * 5; const X = px - Math.cos(a) * 16, Y = py - Math.sin(a) * 16 - H - w - 3; k ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.stroke();
    for (let k = 1; k < n; k += 2) { const [px, py, a] = P[k]; rock(x, px - Math.cos(a) * 10, py - Math.sin(a) * 10 - H * 0.6 + Math.sin(t * 14 + k) * 6, 6 + (k % 3) * 2, t * 8 + k, k + s.id, false); }
    x.restore();
    if (!LOWFX) for (let q = 0; q < 2; q++) { const [px, py, a] = P[(Math.random() * n) | 0]; FX.P({ x: px, y: py, z: 20, vx: Math.cos(a) * 160 + (Math.random() - 0.5) * 80, vy: Math.sin(a) * 160 + (Math.random() - 0.5) * 60, vz: 120 + Math.random() * 120, g: 600, life: 0.5, size: 3 + Math.random() * 3, color: '#6b4a2a', kind: 'blob', add: false }); }
  }

  /* ---------- por encima ---------- */
  function over(x, G) {
    const t = G.time;
    for (const s of G.spells) {
      if (s.t === 'sandstorm') {
        const fade = Math.min(1, s.life / 0.5, s.grow * 1.5), R = s.r, n = LOWFX ? 24 : 54, g = s.grow, lay = LOWFX ? 5 : 9, per = LOWFX ? 4 : 7;
        x.save(); x.globalAlpha = fade;
        // remolino de arena de verdad: un embudo de anillos que giran (más ancho arriba), con la cara de atrás oscura y la
        // de adelante clara, vetas que corren por los anillos y una cortina de polvo a ras del suelo que tapa lo de adentro
        const SC = ['rgba(214,170,110,0.9)', 'rgba(150,108,66,0.9)', 'rgba(238,206,150,0.9)'], ring = [];
        for (let L = 0; L < lay; L++) { const hf = L / (lay - 1), h = (10 + hf * 170) * (0.35 + 0.65 * g), rr = R * (0.18 + 0.5 * hf * hf + 0.08 * hf) * (0.55 + 0.45 * g) + Math.sin(s.rot * 1.7 + L) * 5; ring.push({ hf, L, cx: s.x + Math.sin(s.rot * 0.9 + hf * 2.2) * 18 * hf, cy: s.y - h, rr, spin: s.rot * (3.2 - hf * 1.4) + L * 0.9, dv: 0.55 + 0.9 * hash2(L, 1) }); }
        const band = (o, back) => { const { hf, cx, cy, rr, spin, dv } = o, a0 = back ? Math.PI : 0, a1 = back ? TAU : Math.PI;
          x.lineCap = 'round'; x.setLineDash([rr * 0.55 * dv, rr * 0.22 / dv]); x.lineDashOffset = -spin * rr * 0.9;
          x.strokeStyle = back ? `rgba(120,84,50,${0.32 * fade})` : `rgba(226,186,124,${(0.62 - hf * 0.18) * fade})`; x.lineWidth = ((back ? 6 : 9) + hf * 6) * (0.75 + 0.5 * hash2(o.L, 2));
          x.beginPath(); x.ellipse(cx, cy, rr, rr * 0.3, 0, a0, a1); x.stroke();
          if (!back) { x.strokeStyle = `rgba(255,236,190,${0.5 * fade})`; x.lineWidth = 2; x.setLineDash([rr * 0.25, rr * 0.5]); x.lineDashOffset = -spin * rr * 1.2; x.beginPath(); x.ellipse(cx, cy - 2, rr * 0.98, rr * 0.29, 0, a0 + 0.2, a1 - 0.2); x.stroke(); }
          x.setLineDash([]); };
        x.globalAlpha = 1; for (let L = lay - 1; L >= 0; L--) band(ring[L], true);
        for (let k = 0; k < (LOWFX ? 8 : 16); k++) { const a = s.rot * 0.8 + k / 16 * TAU, rr = R * (0.5 + 0.45 * hash2(k, 9)) * (0.5 + 0.5 * g), px = s.x + Math.cos(a) * rr, py = s.y + Math.sin(a) * rr * 0.55, sz = (70 + 46 * hash2(k, 4)) * (0.6 + 0.4 * g); x.globalAlpha = fade * 0.45; x.drawImage(soft(SC[k % 3]), px - sz / 2, py - sz * 0.32, sz, sz * 0.62); }
        for (let L = 0; L < lay; L++) { const o = ring[L]; for (let k = 0; k < (LOWFX ? 2 : 4); k++) { const a = o.spin + k / 4 * TAU, px = o.cx + Math.cos(a) * o.rr, py = o.cy + Math.sin(a) * o.rr * 0.3, sz = 26 + o.hf * 36; x.globalAlpha = fade * (Math.sin(a) > 0 ? 0.42 : 0.22); x.drawImage(soft(SC[Math.sin(a) > 0 ? 2 : 1]), px - sz / 2, py - sz * 0.4, sz, sz * 0.8); } }
        x.globalAlpha = 1; for (let L = 0; L < lay; L++) band(ring[L], false);
        x.globalAlpha = fade;
        x.fillStyle = 'rgba(120,86,48,0.12)'; x.beginPath(); x.arc(s.x, s.y - 26, R, 0, TAU); x.fill();
        x.lineCap = 'round'; x.lineWidth = 1.6;
        for (let k = 0; k < n; k++) { const a = s.rot * (1.6 + (k % 3) * 0.4) + k * 0.73, d = R * (0.25 + 0.75 * hash2(k, 3)), px = s.x + Math.cos(a) * d, py = s.y - 10 - (k % 6) * 11 + Math.sin(a) * d, tx = -Math.sin(a) * 12, ty = Math.cos(a) * 12; x.strokeStyle = SAND[k % 3] + '0.75)'; x.beginPath(); x.moveTo(px, py); x.lineTo(px + tx, py + ty); x.stroke(); }
        x.restore();
      } else if (s.t === 'crystal' && s.phase === 1) {
        const fade = Math.min(1, s.life / 0.4), live = s.cells.filter(i => G.T.wall[i] > 0); if (live.length < 2) continue;
        x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
        const seed = Math.floor(t * 8) + s.id;
        for (let k = 0; k < (LOWFX ? 2 : 4); k++) { const a = live[Math.floor(hash2(seed, k) * live.length)], b = live[Math.floor(hash2(k, seed + 3) * live.length)]; if (a === b) continue; const ax = Terrain.cx(G.T, a), ay = Terrain.cy(G.T, a) - 30, bx = Terrain.cx(G.T, b), by = Terrain.cy(G.T, b) - 30; x.strokeStyle = `rgba(255,236,170,${0.25 * fade})`; x.lineWidth = 4; x.beginPath(); x.moveTo(ax, ay); x.lineTo(s.x, s.y - 20); x.lineTo(bx, by); x.stroke(); x.strokeStyle = `rgba(255,255,255,${0.55 * fade})`; x.lineWidth = 1.2; x.stroke(); }
        if (Math.sin(t * 9 + s.id) > 0.7) ArtSpells2.star4(x, s.x + Math.sin(t * 3) * 20, s.y - 40, 14, '#ffffff', t * 3);
        x.restore();
      } else if (s.t === 'crystal' && s.phase === 0) {
        const f = 1 - Math.max(0, s.lock) / (s.S.lock || 0.34);
        x.save(); x.globalCompositeOperation = 'lighter'; const g = x.createLinearGradient(s.x, s.y - 220, s.x, s.y); g.addColorStop(0, 'rgba(255,236,170,0)'); g.addColorStop(1, `rgba(255,236,170,${0.1 + f * 0.18})`); x.fillStyle = g; x.fillRect(s.x - 14 - f * 8, s.y - 220, 28 + f * 16, 220); x.restore();
      }
    }
  }

  /* ---------- la torre de rayo (casilla de muro con crys = 2) ---------- */
  function pylon(x, G, i) {
    const T = G.T, px = Terrain.cx(T, i), py = Terrain.cy(T, i) + 8, t = G.time;
    const s = G.spells.find(q => q.t === 'tesla' && (q.iA === i || q.iB === i)), rise = s ? 1 - Math.max(0, s.rise) / 0.28 : 1, a = Math.min(1, T.wallT[i] / 0.4), H = 66 * (0.25 + 0.75 * rise), hp = T.wall[i];
    x.save(); x.globalAlpha = a;
    x.fillStyle = 'rgba(8,6,16,0.4)'; x.beginPath(); x.ellipse(px, py + 4, 22, 8, 0, 0, TAU); x.fill();
    x.fillStyle = '#4e4436'; x.beginPath(); x.moveTo(px - 19, py + 4); x.lineTo(px + 19, py + 4); x.lineTo(px + 15, py - 8); x.lineTo(px - 15, py - 8); x.fill();
    const g = x.createLinearGradient(px - 12, 0, px + 12, 0); g.addColorStop(0, '#6e6250'); g.addColorStop(0.45, '#9a8a70'); g.addColorStop(1, '#5a5040');
    x.fillStyle = g; x.beginPath(); x.moveTo(px - 12, py - 6); x.lineTo(px - 7, py - H); x.lineTo(px + 7, py - H); x.lineTo(px + 12, py - 6); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(30,22,14,0.6)'; x.lineWidth = 1.2; x.stroke();
    if (hp < 18) { x.strokeStyle = 'rgba(20,14,8,0.8)'; x.beginPath(); x.moveTo(px - 4, py - H * 0.3); x.lineTo(px + 2, py - H * 0.5); x.lineTo(px - 2, py - H * 0.7); x.stroke(); }
    // anillos de cobre
    for (let k = 0; k < 3; k++) { const yy = py - H * (0.3 + k * 0.22), w = 11 - k * 1.6; x.fillStyle = '#b8743a'; x.fillRect(px - w, yy - 2.5, w * 2, 5); x.fillStyle = '#f0b070'; x.fillRect(px - w, yy - 2.5, w * 2, 1.5); }
    // runas que brillan
    x.globalCompositeOperation = 'lighter'; const p = 0.5 + 0.5 * Math.sin(t * 8 + i);
    x.fillStyle = `rgba(200,170,255,${0.4 + p * 0.5})`; x.fillRect(px - 1.5, py - H * 0.62, 3, H * 0.12); x.fillRect(px - 4, py - H * 0.56, 8, 2);
    // esfera arriba
    const oy = py - H - 6; glow(x, px, oy, 26 + p * 8, 'rgba(190,150,255,0.85)');
    x.fillStyle = '#e8dcff'; x.beginPath(); x.arc(px, oy, 6.5, 0, TAU); x.fill(); x.fillStyle = '#ffffff'; x.beginPath(); x.arc(px - 2, oy - 2, 2.5, 0, TAU); x.fill();
    if (!LOWFX) { x.strokeStyle = 'rgba(230,210,255,0.8)'; x.lineWidth = 1; const sd = Math.floor(t * 20) + i; for (let k = 0; k < 2; k++) { const an = hash2(sd, k) * TAU; jag(x, px, oy, px + Math.cos(an) * 16, oy + Math.sin(an) * 12, sd + k, 3, 4); } }
    x.restore();
  }

  /* ---------- meteoro y fragmentos en el aire ---------- */
  function lob(x, G, s, Y) {
    if (s.kind !== 'meteor' && s.kind !== 'frag') return false;
    const t = G.time, big = s.kind === 'meteor', r = big ? 15 : 8, f = s.tt / s.T;
    // cola: hacia atrás en la trayectoria
    const vx = s.tx - s.x0, vy = (s.ty - s.y0) - (Math.cos(f * Math.PI) * (big ? 170 : 90)) * 1.4, l = hypot(vx, vy) || 1, ux = vx / l, uy = vy / l, L = big ? 70 : 36;
    x.save(); x.globalCompositeOperation = 'lighter';
    const g = x.createLinearGradient(s.x, Y, s.x - ux * L, Y - uy * L); g.addColorStop(0, 'rgba(255,220,120,0.95)'); g.addColorStop(0.35, 'rgba(255,120,40,0.7)'); g.addColorStop(1, 'rgba(120,30,10,0)');
    x.fillStyle = g; x.beginPath(); x.moveTo(s.x + uy * r * 1.1, Y - ux * r * 1.1); x.lineTo(s.x - ux * L, Y - uy * L); x.lineTo(s.x - uy * r * 1.1, Y + ux * r * 1.1); x.closePath(); x.fill();
    glow(x, s.x, Y, r * (big ? 3.2 : 2.6), 'rgba(255,120,40,0.85)');
    x.restore();
    rock(x, s.x, Y, r, t * 7 + s.id, s.id, true);
    if (Math.random() < (LOWFX ? 0.4 : 0.9)) FX.P({ x: s.x, y: s.y, z: s.z, vx: -ux * 60, vy: -uy * 30, vz: 20, g: -20, drag: 1, life: 0.6, size: big ? 10 : 6, color: 'rgba(60,40,40,0.45)', kind: 'smoke', add: false });
    if (Math.random() < 0.8) FX.P({ x: s.x, y: s.y, z: s.z, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 40, vz: 10, g: 0, life: 0.35, size: big ? 5 : 3, color: '#ff9a3c', kind: 'ember' });
    return true;
  }

  /* ---------- efectos (chispas, polvo, esquirlas) ---------- */
  const vr = (a, b) => a + Math.random() * (b - a);
  function fx(G, f) {
    const P = FX.P, S = FX.S, burst = FX.burst;
    switch (f.type) {
      case 'sandBurst':
        S({ type: 'ring', x: f.x, y: f.y, r0: 20, r1: f.r * 1.15, el: 'earth', life: 0.4, w: 16, mud: true }); S({ type: 'flash', x: f.x, y: f.y, r: f.r * 1.2, el: 'earth', life: 0.2 });
        for (let k = 0; k < (LOWFX ? 16 : 40); k++) { const a = Math.random() * TAU, v = vr(160, 420); P({ x: f.x + Math.cos(a) * 20, y: f.y + Math.sin(a) * 20, z: vr(6, 40), vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: vr(10, 80), g: 20, drag: 2.6, life: vr(0.5, 1.1), size: vr(14, 30), color: SAND[k % 3] + '0.45)', kind: 'smoke', add: false }); }
        burst(f.x, f.y, 'earth', 14, 260, { kind: 'chunk', g: 600 }); break;
      case 'sandEnd': for (let k = 0; k < (LOWFX ? 8 : 20); k++) { const a = Math.random() * TAU, v = vr(60, 200); P({ x: f.x + Math.cos(a) * f.r * 0.6, y: f.y + Math.sin(a) * f.r * 0.6, z: vr(10, 60), vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: vr(0, 40), g: 10, drag: 1.6, life: vr(0.6, 1.2), size: vr(14, 26), color: SAND[k % 3] + '0.4)', kind: 'smoke', add: false }); } burst(f.x, f.y, 'earth', 10, 220, { kind: 'chunk', g: 600 }); break;
      case 'pylonRise': S({ type: 'rise', x: f.x, y: f.y, el: 'earth', life: 0.35 }); S({ type: 'ring', x: f.x, y: f.y, r0: 8, r1: 70, el: 'bolt', life: 0.3, w: 6 }); burst(f.x, f.y, 'earth', 12, 180, { kind: 'chunk', g: 650 }); burst(f.x, f.y - 50, 'bolt', 10, 200); break;
      case 'sparkBurst': burst(f.x, f.y, 'bolt', LOWFX ? 8 : 18, 240); S({ type: 'flash', x: f.x, y: f.y, r: 70, el: 'bolt', life: 0.18 }); break;
      case 'crystalRise': S({ type: 'star4', x: f.x, y: f.y - 34, r: 18, life: 0.3, delay: f.d || 0 }); for (let k = 0; k < (LOWFX ? 3 : 6); k++) P({ x: f.x + vr(-12, 12), y: f.y + vr(-6, 6), z: 4, vx: vr(-40, 40), vy: vr(-20, 20), vz: vr(140, 260), g: 500, life: vr(0.3, 0.6), size: vr(3, 6), color: Math.random() < 0.5 ? '#ffffff' : '#ffe48a', kind: 'shard' }); break;
      case 'crystalBurst':
        S({ type: 'ring', x: f.x, y: f.y, r0: 90, r1: 10, el: 'light', life: 0.28, w: 10, gold: true }); S({ type: 'ring', x: f.x, y: f.y, r0: 10, r1: f.r * 1.7, el: 'light', life: 0.45, w: 6, delay: 0.22 });
        S({ type: 'flash', x: f.x, y: f.y, r: f.r * 2.2, el: 'light', life: 0.3, delay: 0.2 }); S({ type: 'star4', x: f.x, y: f.y - 30, r: 70, life: 0.4, delay: 0.2 });
        for (let k = 0; k < (LOWFX ? 14 : 34); k++) { const a = Math.random() * TAU, v = vr(180, 480); P({ x: f.x + Math.cos(a) * 70, y: f.y + Math.sin(a) * 70, z: vr(10, 50), vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: vr(60, 200), g: 500, drag: 1.2, life: vr(0.4, 0.8), size: vr(3, 7), color: Math.random() < 0.5 ? '#ffffff' : '#ffe48a', kind: 'shard' }); }
        break;
      case 'mawBite':
        S({ type: 'ring', x: f.x, y: f.y, r0: f.r * 1.8, r1: f.r * 0.6, el: 'shadow', life: 0.22, w: 10 });
        burst(f.x, f.y, 'earth', LOWFX ? 10 : 24, 300, { kind: 'chunk', g: 800 });
        for (let k = 0; k < (LOWFX ? 6 : 14); k++) P({ x: f.x + vr(-f.r, f.r), y: f.y + vr(-f.r, f.r), z: 4, vz: vr(30, 90), g: -8, drag: 1, life: vr(0.8, 1.5), size: vr(14, 26), color: Math.random() < 0.3 ? 'rgba(196,67,166,0.35)' : 'rgba(20,8,26,0.55)', kind: 'smoke', add: false });
        break;
      case 'crater': S({ type: 'crater', x: f.x, y: f.y, r: f.r, life: 4.5, seed: Math.random() * 100 }); for (let k = 0; k < (LOWFX ? 10 : 22); k++) { const a = Math.random() * TAU, v = vr(80, 300); P({ x: f.x, y: f.y, z: 10, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: vr(30, 120), g: 30, drag: 2.2, life: vr(0.8, 1.6), size: vr(16, 32), color: 'rgba(70,52,46,0.45)', kind: 'smoke', add: false }); } burst(f.x, f.y, 'earth', LOWFX ? 10 : 22, 380, { kind: 'chunk', g: 750 }); break;
      default: return ArtEpic.fx(G, f);
    }
    return true;
  }
  // figuras que duran (cráter humeante)
  function shape(x, o, f, A) {
    if (o.type !== 'crater') return ArtEpic.shape(x, o, f, A);
    const r = o.r, a = Math.min(1, (1 - f) * 3);
    x.save(); x.globalAlpha = a;
    const g = x.createRadialGradient(o.x, o.y, r * 0.1, o.x, o.y, r); g.addColorStop(0, 'rgba(20,12,10,0.75)'); g.addColorStop(0.7, 'rgba(40,26,20,0.45)'); g.addColorStop(1, 'rgba(40,26,20,0)');
    x.fillStyle = g; x.beginPath(); x.arc(o.x, o.y, r, 0, TAU); x.fill();
    x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(255,${110 + 60 * (1 - f)},40,${0.85 * Math.max(0, 1 - f * 1.6)})`; x.lineWidth = 2; x.lineCap = 'round';
    for (let k = 0; k < 7; k++) { const an = k / 7 * TAU + o.seed, L = r * (0.5 + 0.5 * hash2(k, o.seed)); x.beginPath(); x.moveTo(o.x + Math.cos(an) * r * 0.15, o.y + Math.sin(an) * r * 0.15); x.lineTo(o.x + Math.cos(an + 0.2) * L * 0.6, o.y + Math.sin(an + 0.2) * L * 0.6); x.lineTo(o.x + Math.cos(an) * L, o.y + Math.sin(an) * L); x.stroke(); }
    x.restore(); return true;
  }

  /* ---------- luces ---------- */
  function lights(G, add) {
    for (const s of G.spells) {
      if (s.t === 'sandstorm') add(s.x, s.y - 70, s.r * 1.1, [240, 196, 130], 0.5, 0.1);
      else if (s.t === 'tesla' && s.rise <= 0) { for (let k = 0; k <= 2; k++) add(lerp(s.x0, s.x1, k / 2), lerp(s.y0, s.y1, k / 2) - 50, 110, [200, 170, 255], 0.75, 0.2); }
      else if (s.t === 'crystal') add(s.x, s.y - 20, s.phase ? 130 : 100, [255, 236, 170], s.phase ? 0.8 : 0.5, 0.18);
      else if (s.t === 'maw') add(s.x, s.y, s.r * 1.4, [210, 70, 175], 0.3, 0.12);
    }
    for (let i = 0; i < G.T.n; i++) if (G.T.crys[i] === 2 && G.T.wall[i] > 0) add(Terrain.cx(G.T, i), Terrain.cy(G.T, i) - 64, 90, [200, 170, 255], 0.6, 0.2);
    for (const o of FX.shapes) if (o.type === 'crater') { const f = o.t / o.life; if (f < 0.4) add(o.x, o.y, o.r * 1.6, [255, 120, 50], (0.4 - f) * 2, 0.3); }
  }
  return { under, items, over, pylon, lob, fx, shape, lights, rock };
})();
