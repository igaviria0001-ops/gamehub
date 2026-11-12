/* =========================================================================
   ARTE DE LOS HECHIZOS Y EFECTOS — cada elemento con su forma: cometa de
   fuego, gota con estela, piedra que gira, esfera eléctrica, pétalos,
   raíces bajo el suelo, olas, remolinos, nubes, minas, torretas...
   ========================================================================= */
const ArtSpells = (() => {
  const EC = el => ELEMENTS[el] || ELEMENTS.wind;
  // punto suave de cualquier color (humo, nubes, llamas)
  const softs = {};
  function soft(col) { if (softs[col]) return softs[col]; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.fillStyle = col; x.fillRect(0, 0, 64, 64); x.globalCompositeOperation = 'destination-in'; const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(0,0,0,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return (softs[col] = c); }
  const sdot = (x, col, X, Y, r) => x.drawImage(soft(col), X - r, Y - r, r * 2, r * 2);
  const glow = (x, X, Y, r, col, a = 1) => { x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = a; const g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(X, Y, r, 0, TAU); x.fill(); x.restore(); };
  const rgba = (rgb, a) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;
  // lo que va en el suelo (debajo de los magos)
  function under(x, G) {
    const t = G.time;
    for (const s of G.spells) {
      if (s.t === 'strike') {
        const f = 1 - s.delay / s.S.delay, r = s.r;
        x.save(); x.globalCompositeOperation = 'lighter';
        x.strokeStyle = `rgba(200,170,255,${0.4 + f * 0.5})`; x.lineWidth = 2; x.beginPath(); x.ellipse(s.x, s.y, r, r * 0.5, 0, 0, TAU); x.stroke();
        x.fillStyle = `rgba(160,120,255,${f * 0.35})`; x.beginPath(); x.ellipse(s.x, s.y, r * f, r * 0.5 * f, 0, 0, TAU); x.fill();
        for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + t * 2; x.fillStyle = '#efe6ff'; x.fillRect(s.x + Math.cos(a) * r * 0.85 - 2, s.y + Math.sin(a) * r * 0.42 - 2, 4, 4); }
        x.restore();
      } else if (s.t === 'lob') {
        const f = s.tt / s.T, r = (s.kind === 'meteor' ? s.S.r : s.kind === 'mud' ? s.S.r : 26) * (s.size || 1);
        x.strokeStyle = s.kind === 'meteor' ? `rgba(255,140,60,${0.3 + f * 0.6})` : s.kind === 'mud' ? `rgba(160,110,60,${0.3 + f * 0.5})` : `rgba(140,230,110,${0.3 + f * 0.5})`;
        x.lineWidth = 2; x.setLineDash([6, 6]); x.beginPath(); x.ellipse(s.tx, s.ty, r, r * 0.5, 0, 0, TAU); x.stroke(); x.setLineDash([]);
        x.fillStyle = 'rgba(8,6,20,0.35)'; x.beginPath(); x.ellipse(s.x, s.y, 8 + f * 6, 4 + f * 2, 0, 0, TAU); x.fill();
      } else if (s.t === 'trap') {
        const col = PLAYER_COLORS[s.by] ? PLAYER_COLORS[s.by].main : '#9fe07a', p = 0.6 + 0.4 * Math.sin(t * 4 + s.id);
        x.fillStyle = '#2e5e2a'; x.beginPath(); x.ellipse(s.x, s.y, 12, 6, 0, 0, TAU); x.fill();
        for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + 0.3; x.save(); x.translate(s.x + Math.cos(a) * 8, s.y + Math.sin(a) * 4); x.rotate(a); x.fillStyle = k % 2 ? '#5aa84a' : '#7ec85a'; x.beginPath(); x.ellipse(0, 0, 7, 2.6, 0, 0, TAU); x.fill(); x.restore(); }
        x.fillStyle = col; x.globalAlpha = s.arm > 0 ? 0.4 : p; x.beginPath(); x.arc(s.x, s.y - 2, 3.2, 0, TAU); x.fill(); x.globalAlpha = 1;
      } else if (s.t === 'mine') {
        const p = s.arm > 0 ? 0.3 : 0.6 + 0.4 * Math.sin(t * 8 + s.id);
        x.fillStyle = '#5a2a14'; x.beginPath(); x.ellipse(s.x, s.y, 11, 7, 0, 0, TAU); x.fill();
        x.fillStyle = '#c8501e'; x.beginPath(); x.ellipse(s.x, s.y - 3, 9, 7, 0, 0, TAU); x.fill();
        x.strokeStyle = '#3a6a2a'; x.lineWidth = 2; x.beginPath(); x.moveTo(s.x, s.y - 9); x.quadraticCurveTo(s.x + 4, s.y - 15, s.x + 7, s.y - 14); x.stroke();
        glow(x, s.x, s.y - 4, 16, `rgba(255,150,60,${p})`);
      } else if (s.t === 'bloom') {
        const f = Math.min(1, s.age * 4), fade = Math.min(1, s.life / 0.5);
        x.save(); x.globalAlpha = fade;
        x.strokeStyle = 'rgba(150,255,170,0.45)'; x.lineWidth = 2; x.beginPath(); x.ellipse(s.x, s.y, s.r * f, s.r * 0.5 * f, 0, 0, TAU); x.stroke();
        for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + t * 0.3; x.save(); x.translate(s.x + Math.cos(a) * 9 * f, s.y - 6 + Math.sin(a) * 5 * f); x.rotate(a); x.fillStyle = k % 2 ? '#ffd6ea' : '#ffffff'; x.beginPath(); x.ellipse(6 * f, 0, 9 * f, 5 * f, 0, 0, TAU); x.fill(); x.restore(); }
        x.fillStyle = '#ffe07a'; x.beginPath(); x.arc(s.x, s.y - 6, 5 * f, 0, TAU); x.fill();
        for (let k = 0; k < 3; k++) { const p = (t * 0.8 + k / 3) % 1; x.fillStyle = `rgba(160,255,170,${1 - p})`; x.font = fontB(10); x.fillText('+', s.x + Math.sin(k * 2.1 + t) * s.r * 0.6, s.y - p * 50); }
        x.restore();
      } else if (s.t === 'magnet') {
        x.save(); x.globalAlpha = Math.min(1, s.life / 0.3);
        x.strokeStyle = 'rgba(190,150,255,0.35)'; x.lineWidth = 1.5; x.setLineDash([4, 8]); x.lineDashOffset = -t * 40; x.beginPath(); x.ellipse(s.x, s.y, s.pullR, s.pullR * 0.5, 0, 0, TAU); x.stroke(); x.setLineDash([]);
        x.restore();
      }
    }
  }
  // lo que se ordena con los magos (proyectiles, torbellinos, cristales, torretas)
  function items(G, list) {
    for (const s of G.spells) {
      if (s.t === 'proj' || s.t === 'vortex' || s.t === 'firenado' || s.t === 'magnet' || s.t === 'lob') list.push({ y: s.y + (s.t === 'lob' ? 0 : 6), draw: x => one(x, G, s) });
      else if (s.t === 'wave') list.push({ y: s.y + Math.sin(s.ang) * s.d, draw: x => one(x, G, s) });
    }
    for (const u of G.units) if (u.obj === 'turret') list.push({ y: u.y, draw: x => turret(x, G, u) });
  }
  function one(x, G, s) {
    const t = G.time;
    if (s.gran) {
      const gy = s.y - (s.t === 'lob' ? s.z || 0 : 18), R = (s.r || 20) * 2.4 + 10 * Math.sin(t * 9), E2 = EC(String(s.el).split('+')[1] || s.el);
      glow(x, s.x, gy, R, 'rgba(255,214,110,0.75)'); glow(x, s.x, gy, R * 0.7, E2.c1 + 'aa');
      if (s.t === 'proj' || s.t === 'lob' || s.t === 'vortex' || s.t === 'firenado') { x.save(); x.globalCompositeOperation = 'lighter'; x.translate(s.x, gy); x.rotate(t * 4); x.strokeStyle = 'rgba(255,233,160,0.85)'; x.lineWidth = 2; const rr = (s.r || 20) * 1.5 + 6; x.beginPath(); x.ellipse(0, 0, rr, rr * 0.75, 0, 0, TAU); x.stroke(); x.fillStyle = '#fff3c4'; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; x.beginPath(); x.moveTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.75 - 3); x.lineTo(Math.cos(a) * rr + 2.4, Math.sin(a) * rr * 0.75); x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.75 + 3); x.lineTo(Math.cos(a) * rr - 2.4, Math.sin(a) * rr * 0.75); x.fill(); } x.restore(); }
      if (Math.random() < 0.8) FX.P({ x: s.x + (Math.random() - 0.5) * 22, y: s.y + (Math.random() - 0.5) * 8, z: 14 + Math.random() * 22, vz: 20, g: 0, life: 0.6, size: 2.4, color: Math.random() < 0.5 ? '#ffe9a0' : E2.c0, kind: 'ember' });
    }
    if (s.t === 'proj') {
      const a = Math.atan2(s.vy, s.vx), sp = hypot(s.vx, s.vy), Y = s.ground ? s.y : s.y - 18, E = EC(s.el);
      if (!s.ground) { x.fillStyle = 'rgba(8,6,20,0.3)'; x.beginPath(); x.ellipse(s.x, s.y + 2, s.r * 0.9, s.r * 0.4, 0, 0, TAU); x.fill(); }
      if (s.ground) {
        x.fillStyle = '#5a3e22'; x.beginPath(); x.ellipse(s.x, s.y, 16, 7, a, 0, TAU); x.fill();
        for (let k = 0; k < 4; k++) { const ox = Math.cos(a) * (k * 8 - 8), oy = Math.sin(a) * (k * 8 - 8); x.fillStyle = k % 2 ? '#7a5a34' : '#8a6a3e'; x.beginPath(); x.moveTo(s.x + ox - 4, s.y + oy); x.lineTo(s.x + ox, s.y + oy - 14 - Math.sin(t * 20 + k) * 4); x.lineTo(s.x + ox + 4, s.y + oy); x.fill(); }
        return;
      }
      if (s.gust) { const f = Math.min(1, s.life / 0.15); x.save(); x.globalAlpha = 0.85 * f; x.translate(s.x, Y); x.rotate(a); x.strokeStyle = '#e8fff6'; x.lineWidth = 3; for (let k = 0; k < 3; k++) { x.beginPath(); x.arc(-k * 9, 0, s.r * (0.9 - k * 0.15), -1.1, 1.1); x.stroke(); } x.strokeStyle = 'rgba(160,250,215,0.6)'; x.lineWidth = 7; x.beginPath(); x.arc(0, 0, s.r, -0.9, 0.9); x.stroke(); x.restore(); return; }
      if (s.petal) { x.save(); x.translate(s.x, Y); x.rotate(t * 10 + s.id); x.fillStyle = s.id % 2 ? '#ffc6e0' : '#d8ff9a'; x.beginPath(); x.ellipse(0, 0, 7, 3.5, 0, 0, TAU); x.fill(); x.restore(); glow(x, s.x, Y, 14, 'rgba(255,190,230,0.5)'); return; }
      // rastro de posiciones (solo para la vista)
      const tr = s._tr || (s._tr = []); const last = tr[tr.length - 1];
      if (!last || hypot(last[0] - s.x, last[1] - Y) > 3) { tr.push([s.x, Y]); if (tr.length > 16) tr.shift(); }
      const ribbon = (w0, colHead, colTail, add) => {
        if (tr.length < 2) return; const n = tr.length, L = [], R = [];
        for (let i = 0; i < n; i++) { const p = tr[i], q = tr[Math.min(n - 1, i + 1)], o = tr[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], l = hypot(dx, dy) || 1, w = w0 * Math.pow(i / (n - 1), 0.8) * (0.85 + 0.15 * Math.sin(t * 30 + i)); L.push([p[0] - dy / l * w, p[1] + dx / l * w]); R.push([p[0] + dy / l * w, p[1] - dx / l * w]); }
        x.save(); if (add) x.globalCompositeOperation = 'lighter';
        const g = x.createLinearGradient(tr[0][0], tr[0][1], tr[n - 1][0], tr[n - 1][1]); g.addColorStop(0, colTail); g.addColorStop(1, colHead);
        x.fillStyle = g; x.beginPath(); x.moveTo(L[0][0], L[0][1]); for (const p of L) x.lineTo(p[0], p[1]); x.lineTo(s.x, Y); for (let i = R.length - 1; i >= 0; i--) x.lineTo(R[i][0], R[i][1]); x.closePath(); x.fill(); x.restore();
      };
      const rnd = Math.random;
      if (s.el === 'water') {
        ribbon(s.r * 1.05, 'rgba(120,205,255,0.75)', 'rgba(30,90,200,0)', false);
        ribbon(s.r * 0.45, 'rgba(235,250,255,0.85)', 'rgba(160,220,255,0)', true);
        glow(x, s.x, Y, s.r * 3, 'rgba(70,160,255,0.55)');
        x.save(); x.translate(s.x, Y); x.rotate(a);
        const wg = x.createRadialGradient(s.r * 0.35, -s.r * 0.3, 1, 0, 0, s.r * 1.4); wg.addColorStop(0, 'rgba(240,252,255,0.95)'); wg.addColorStop(0.35, 'rgba(110,200,255,0.85)'); wg.addColorStop(1, 'rgba(20,80,190,0.75)');
        x.fillStyle = wg; x.beginPath(); x.moveTo(s.r * 1.3, 0); x.bezierCurveTo(s.r * 1.3, -s.r * 1.05, -s.r * 0.6, -s.r * 0.95, -s.r * 2.2, 0); x.bezierCurveTo(-s.r * 0.6, s.r * 0.95, s.r * 1.3, s.r * 1.05, s.r * 1.3, 0); x.fill();
        x.strokeStyle = 'rgba(255,255,255,0.75)'; x.lineWidth = 1.2; x.beginPath(); x.arc(s.r * 0.25, 0, s.r * 0.85, -1.9, -0.6); x.stroke();
        x.fillStyle = 'rgba(255,255,255,0.95)'; x.beginPath(); x.ellipse(s.r * 0.55, -s.r * 0.35, s.r * 0.32, s.r * 0.18, -0.4, 0, TAU); x.fill();
        x.restore();
        if (rnd() < 0.7) FX.P({ x: s.x - Math.cos(a) * s.r, y: s.y - Math.sin(a) * s.r, z: 18, vx: s.vx * 0.15 + (rnd() - 0.5) * 70, vy: s.vy * 0.15 + (rnd() - 0.5) * 50, vz: 30 + rnd() * 60, g: 420, life: 0.35 + rnd() * 0.3, size: 1.3 + rnd() * 1.4, color: rnd() < 0.5 ? 'rgba(200,240,255,0.95)' : 'rgba(110,190,255,0.9)', kind: 'drop', add: false });
      } else if (s.el === 'fire') {
        ribbon(s.r * 1.25, 'rgba(255,200,90,0.85)', 'rgba(200,40,10,0)', true);
        ribbon(s.r * 0.55, 'rgba(255,250,220,0.9)', 'rgba(255,160,60,0)', true);
        glow(x, s.x, Y, s.r * 3.6, 'rgba(255,130,40,0.75)');
        x.save(); x.globalCompositeOperation = 'lighter'; x.translate(s.x, Y); x.rotate(a);
        for (let k = 0; k < 4; k++) { const fl = Math.sin(t * 40 + k * 1.7 + s.id) * 0.5 + 0.5, len = s.r * (2.2 + fl * 1.4), off = (k - 1.5) * s.r * 0.35; x.fillStyle = k % 2 ? 'rgba(255,110,30,0.7)' : 'rgba(255,190,70,0.65)'; x.beginPath(); x.moveTo(s.r * 0.6, off * 0.6); x.quadraticCurveTo(-len * 0.4, off * 1.6 + Math.sin(t * 50 + k) * 2, -len, off * 0.9); x.quadraticCurveTo(-len * 0.4, off * 0.4, s.r * 0.6, off * 0.6 + 1.5); x.fill(); }
        const fg = x.createRadialGradient(s.r * 0.2, 0, 0, 0, 0, s.r * 1.1); fg.addColorStop(0, '#ffffff'); fg.addColorStop(0.35, '#fff1a8'); fg.addColorStop(0.7, '#ff9a3c'); fg.addColorStop(1, 'rgba(220,60,20,0)');
        x.fillStyle = fg; x.beginPath(); x.arc(0, 0, s.r * 1.1, 0, TAU); x.fill(); x.restore();
        if (rnd() < 0.9) FX.P({ x: s.x - Math.cos(a) * s.r * 0.6, y: s.y - Math.sin(a) * s.r * 0.6, z: 18 + (rnd() - 0.5) * 6, vx: s.vx * 0.1 + (rnd() - 0.5) * 40, vy: s.vy * 0.1 + (rnd() - 0.5) * 30, vz: 20 + rnd() * 40, g: -60, drag: 3, life: 0.25 + rnd() * 0.25, size: s.r * (0.5 + rnd() * 0.5), color: '#ffb040', kind: 'flame' });
        if (rnd() < 0.25) FX.P({ x: s.x, y: s.y, z: 22, vx: (rnd() - 0.5) * 30, vy: (rnd() - 0.5) * 20, vz: 30, g: -20, drag: 1, life: 0.6 + rnd() * 0.5, size: s.r * 0.9, color: 'rgba(50,40,45,0.35)', kind: 'smoke', add: false });
        if (rnd() < 0.3) FX.P({ x: s.x, y: s.y, z: 18, vx: (rnd() - 0.5) * 120, vy: (rnd() - 0.5) * 90, vz: 60 + rnd() * 80, g: 200, life: 0.5, size: 1.4, color: '#ffd27a', kind: 'ember' });
      } else if (s.el === 'earth') {
        ribbon(s.r * 0.7, 'rgba(170,130,90,0.35)', 'rgba(120,90,60,0)', false);
        x.save(); x.translate(s.x, Y); x.rotate(t * 7 + s.id);
        const pts = []; for (let k = 0; k < 8; k++) { const aa = k / 8 * TAU, r = s.r * (0.82 + 0.3 * hash2(k, s.id)); pts.push([Math.cos(aa) * r, Math.sin(aa) * r]); }
        x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); const rg = x.createLinearGradient(-s.r, -s.r, s.r, s.r); rg.addColorStop(0, '#d8b080'); rg.addColorStop(0.5, '#8a5a2e'); rg.addColorStop(1, '#4a2e16'); x.fillStyle = rg; x.fill(); x.strokeStyle = 'rgba(30,18,8,0.9)'; x.lineWidth = 1.5; x.stroke();
        x.fillStyle = 'rgba(255,230,190,0.35)'; x.beginPath(); x.moveTo(pts[5][0], pts[5][1]); x.lineTo(pts[6][0], pts[6][1]); x.lineTo(0, 0); x.closePath(); x.fill();
        x.strokeStyle = 'rgba(40,24,10,0.8)'; x.lineWidth = 1; x.beginPath(); x.moveTo(pts[1][0] * 0.6, pts[1][1] * 0.6); x.lineTo(0, 0); x.lineTo(pts[4][0] * 0.7, pts[4][1] * 0.7); x.stroke();
        x.restore();
        if (rnd() < 0.5) FX.P({ x: s.x, y: s.y, z: 14, vx: (rnd() - 0.5) * 30, vy: (rnd() - 0.5) * 20, vz: 10, g: -10, drag: 1.2, life: 0.5 + rnd() * 0.4, size: s.r * 0.7, color: 'rgba(150,120,90,0.35)', kind: 'smoke', add: false });
        if (rnd() < 0.2) FX.P({ x: s.x, y: s.y, z: 14, vx: (rnd() - 0.5) * 60, vy: (rnd() - 0.5) * 40, vz: 40, g: 600, life: 0.5, size: 2.2, color: '#7a5a34', kind: 'chunk', add: false });
      } else if (s.el === 'bolt') {
        ribbon(s.r * 0.9, 'rgba(210,180,255,0.75)', 'rgba(120,80,255,0)', true);
        glow(x, s.x, Y, s.r * 3.6, 'rgba(190,150,255,0.95)');
        x.save(); x.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 5; k++) { const aa = rnd() * TAU, L1 = s.r * (1.2 + rnd() * 1.4); x.strokeStyle = k % 2 ? 'rgba(255,255,255,0.95)' : 'rgba(200,170,255,0.9)'; x.lineWidth = 1.3; x.beginPath(); x.moveTo(s.x, Y); x.lineTo(s.x + Math.cos(aa) * L1 * 0.5 + (rnd() - 0.5) * 6, Y + Math.sin(aa) * L1 * 0.5 + (rnd() - 0.5) * 6); x.lineTo(s.x + Math.cos(aa) * L1, Y + Math.sin(aa) * L1); x.stroke(); }
        const bg = x.createRadialGradient(s.x, Y, 0, s.x, Y, s.r); bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.5, '#e6d6ff'); bg.addColorStop(1, 'rgba(150,110,255,0)'); x.fillStyle = bg; x.beginPath(); x.arc(s.x, Y, s.r, 0, TAU); x.fill(); x.restore();
        if (rnd() < 0.4) FX.P({ x: s.x, y: s.y, z: 18, vx: (rnd() - 0.5) * 200, vy: (rnd() - 0.5) * 140, life: 0.12 + rnd() * 0.1, size: 1.5, color: '#f2ebff', kind: 'streak', drag: 2 });
      } else if (ArtSpells2.proj(x, G, s, Y, a, ribbon)) { /* luz, sombra, cuervos, fuegos fatuos */
      } else {
        ribbon(s.r * 1.1, E.c1 + 'aa', E.c1 + '00', true);
        glow(x, s.x, Y, s.r * 3.2, E.c1 + 'dd');
        x.fillStyle = E.c1; x.beginPath(); x.arc(s.x, Y, s.r, 0, TAU); x.fill();
        x.fillStyle = E.c0; x.beginPath(); x.arc(s.x + Math.cos(a) * s.r * 0.25, Y + Math.sin(a) * s.r * 0.25, s.r * 0.55, 0, TAU); x.fill();
      }
    } else if (s.t === 'wave') {
      const R = s.d, fade = Math.min(1, (s.range - s.d) / 60, s.d / 40), a0 = s.ang - s.half, a1 = s.ang + s.half;
      x.save(); x.globalAlpha = fade;
      // muro de agua: base oscura, cuerpo translúcido, cresta de espuma
      for (const [dy, w, col] of [[0, 26, 'rgba(20,70,160,0.55)'], [-8, 18, 'rgba(60,150,235,0.6)'], [-15, 9, 'rgba(160,225,255,0.75)']]) { x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); x.ellipse(s.x, s.y + dy, R, R * 0.9, 0, a0, a1); x.stroke(); }
      x.fillStyle = 'rgba(255,255,255,0.95)'; for (let k = 0; k <= 16; k++) { const aa = lerp(a0, a1, k / 16), bump = 2.5 + 2 * Math.sin(t * 14 + k * 1.7); x.beginPath(); x.arc(s.x + Math.cos(aa) * (R + 4), s.y - 19 + Math.sin(aa) * (R * 0.9 + 4), bump, 0, TAU); x.fill(); }
      x.strokeStyle = 'rgba(255,255,255,0.5)'; x.lineWidth = 1.5; x.beginPath(); x.ellipse(s.x, s.y - 6, R - 6, R * 0.9 - 6, 0, a0 + 0.05, a1 - 0.05); x.stroke();
      x.restore();
      if (Math.random() < 0.9) for (let k = 0; k < 2; k++) { const aa = lerp(a0, a1, Math.random()); FX.P({ x: s.x + Math.cos(aa) * R, y: s.y + Math.sin(aa) * R * 0.9, z: 18, vx: Math.cos(aa) * 120 + (Math.random() - 0.5) * 60, vy: Math.sin(aa) * 80, vz: 80 + Math.random() * 90, g: 500, life: 0.4, size: 1.6 + Math.random() * 1.5, color: 'rgba(220,245,255,0.95)', kind: 'drop', add: false }); }
    } else if (s.t === 'vortex' || s.t === 'firenado') {
      const fire = s.t === 'firenado', fade = Math.min(1, s.life / 0.4, s.age * 5), H = fire ? 120 : 78, R = s.r;
      x.save(); x.globalAlpha = fade;
      // sombra y quemadura/polvo en el suelo
      x.fillStyle = 'rgba(8,6,20,0.32)'; x.beginPath(); x.ellipse(s.x, s.y, R * 0.75, R * 0.32, 0, 0, TAU); x.fill();
      const spin = t * (fire ? 7.5 : 9), sway = k => Math.sin(t * 2.3 + k * 1.7) * 6 * k;
      if (fire) {
        x.globalCompositeOperation = 'lighter';
        glow(x, s.x, s.y - 4, R * 1.4, 'rgba(255,110,30,0.55)', fade);
        // columna central
        const cg = x.createLinearGradient(0, s.y, 0, s.y - H); cg.addColorStop(0, 'rgba(255,240,190,0.75)'); cg.addColorStop(0.4, 'rgba(255,160,60,0.45)'); cg.addColorStop(1, 'rgba(200,50,20,0)');
        x.fillStyle = cg; x.beginPath(); x.moveTo(s.x - R * 0.18, s.y); x.quadraticCurveTo(s.x - R * 0.2 + sway(0.5), s.y - H * 0.5, s.x - R * 0.55 + sway(1), s.y - H); x.lineTo(s.x + R * 0.55 + sway(1), s.y - H); x.quadraticCurveTo(s.x + R * 0.2 + sway(0.5), s.y - H * 0.5, s.x + R * 0.18, s.y); x.fill();
      }
      // embudo: cono invertido que ondula
      const wob = k => Math.sin(t * 6 + k * 3) * 3;
      x.globalAlpha = fade * (fire ? 0.5 : 0.16);
      const fg = x.createLinearGradient(0, s.y, 0, s.y - H);
      if (fire) { fg.addColorStop(0, 'rgba(255,230,150,1)'); fg.addColorStop(0.35, 'rgba(255,140,40,0.8)'); fg.addColorStop(0.8, 'rgba(190,50,20,0.35)'); fg.addColorStop(1, 'rgba(120,20,10,0)'); }
      else { fg.addColorStop(0, 'rgba(230,255,248,1)'); fg.addColorStop(1, 'rgba(200,250,235,0.2)'); }
      x.fillStyle = fg; x.beginPath(); x.moveTo(s.x - R * 0.16, s.y);
      for (let k = 1; k <= 6; k++) { const f = k / 6; x.lineTo(s.x - R * (0.16 + f * 0.8) + sway(f) + wob(k), s.y - f * H); }
      for (let k = 6; k >= 1; k--) { const f = k / 6; x.lineTo(s.x + R * (0.16 + f * 0.8) + sway(f) + wob(k + 7), s.y - f * H); }
      x.lineTo(s.x + R * 0.16, s.y); x.closePath(); x.fill();
      // hebras en hélice: atrás tenues, adelante brillantes y gruesas
      const strands = 3, SEG = LOWFX ? 14 : 22; x.lineCap = 'round';
      for (const front of [false, true]) for (let st = 0; st < strands; st++) {
        let px0 = null, py0 = null;
        for (let k = 0; k <= SEG; k++) {
          const f = k / SEG, a = spin + f * 8 + st * TAU / strands, sn = Math.sin(a), rr = R * (0.18 + f * 0.82);
          const px = s.x + Math.cos(a) * rr + sway(f), py = s.y - f * H + sn * rr * 0.3;
          if (px0 != null && (sn > 0) === front) {
            const al = (front ? 1 : 0.35) * (1 - f * 0.55);
            x.globalAlpha = fade * al; x.lineWidth = (fire ? 7 : 3) * (1 - f * 0.6) + 1;
            x.strokeStyle = fire ? (f < 0.3 ? '#fff0b0' : f < 0.65 ? '#ffa040' : '#e0502a') : '#eafff8';
            x.beginPath(); x.moveTo(px0, py0); x.lineTo(px, py); x.stroke();
          }
          px0 = px; py0 = py;
        }
      }
      if (fire) {
        // lenguas sueltas en el borde
        for (let k = 0; k < (LOWFX ? 6 : 12); k++) { const f = ((k * 0.37 + t * 0.9) % 1), a = spin * 1.3 + k * 2.4, rr = R * (0.2 + f * 0.85), px = s.x + Math.cos(a) * rr + sway(f), py = s.y - f * H + Math.sin(a) * rr * 0.3; x.globalAlpha = fade * (1 - f) * 0.8; sdot(x, f < 0.4 ? 'rgb(255,200,90)' : 'rgb(255,110,40)', px, py, 7 + f * 7); }
        x.globalAlpha = fade * 0.7; sdot(x, 'rgb(255,250,215)', s.x, s.y - 8, R * 0.38);
      }
      if (!fire) {
        // cuerpo translúcido del remolino
        x.globalAlpha = fade * 0.18; const vg = x.createLinearGradient(s.x - R, 0, s.x + R, 0); vg.addColorStop(0, 'rgba(200,255,240,0)'); vg.addColorStop(0.5, 'rgba(220,255,245,1)'); vg.addColorStop(1, 'rgba(200,255,240,0)');
        x.fillStyle = vg; x.beginPath(); x.moveTo(s.x - R * 0.2, s.y); x.lineTo(s.x - R * 1.05 + sway(1), s.y - H); x.lineTo(s.x + R * 1.05 + sway(1), s.y - H); x.lineTo(s.x + R * 0.2, s.y); x.fill();
        // polvo y hojitas en órbita
        x.globalAlpha = fade; for (let k = 0; k < 10; k++) { const a = t * (6 + k % 3) + k * 2.1, f = (k * 0.13 + t * 0.4) % 1, rr = R * (0.3 + f * 0.8), px = s.x + Math.cos(a) * rr + sway(f), py = s.y - f * H + Math.sin(a) * rr * 0.3; x.fillStyle = k % 3 ? 'rgba(190,165,125,0.85)' : 'rgba(120,190,90,0.9)'; x.save(); x.translate(px, py); x.rotate(a * 2); x.fillRect(-2.5, -1.2, 5, 2.4); x.restore(); }
      } else {
        // humo oscuro arriba (no aditivo)
        x.globalCompositeOperation = 'source-over';
        for (let k = 0; k < 5; k++) { const a = t * 1.5 + k * 1.3, px = s.x + Math.cos(a) * R * 0.5 + sway(1.1), py = s.y - H - 8 - (k % 2) * 10 + Math.sin(a) * 5; x.globalAlpha = fade * 0.35; sdot(x, 'rgb(45,32,38)', px, py, 22 + (k % 3) * 6); }
        if (Math.random() < 0.6) FX.P({ x: s.x + (Math.random() - 0.5) * R, y: s.y + (Math.random() - 0.5) * R * 0.4, z: 10 + Math.random() * 40, vx: (Math.random() - 0.5) * 80, vy: (Math.random() - 0.5) * 40, vz: 90 + Math.random() * 110, g: -30, life: 0.7 + Math.random() * 0.5, size: 2 + Math.random() * 2, color: '#ffb050', kind: 'ember' });
      }
      x.restore();
    } else if (s.t === 'lob') {
      const Y = s.y - s.z;
      if (ArtSpells2.lob(x, G, s, Y)) { /* cristal, marea */ }
      else if (s.kind === 'meteor') { glow(x, s.x, Y, 34, 'rgba(255,120,40,0.9)'); x.fillStyle = '#3a2420'; x.beginPath(); x.arc(s.x, Y, 13, 0, TAU); x.fill(); x.fillStyle = '#ff8a3c'; x.beginPath(); x.arc(s.x - 3, Y - 3, 7, 0, TAU); x.fill(); FX.P({ x: s.x, y: s.y, z: s.z, vz: 10, g: 0, life: 0.4, size: 5, color: '#ff8a3c', kind: 'ember' }); }
      else if (s.kind === 'mud') { x.fillStyle = '#6b4a2a'; x.beginPath(); x.ellipse(s.x, Y, 13, 11, t * 3, 0, TAU); x.fill(); x.fillStyle = '#8a6a40'; x.beginPath(); x.arc(s.x - 3, Y - 3, 5, 0, TAU); x.fill(); }
      else { glow(x, s.x, Y, 16, 'rgba(160,255,120,0.7)'); x.fillStyle = '#6a8a2a'; x.beginPath(); x.ellipse(s.x, Y, 6, 8, t * 6, 0, TAU); x.fill(); x.fillStyle = '#b8f07a'; x.beginPath(); x.arc(s.x - 1.5, Y - 2, 2.5, 0, TAU); x.fill(); }
    } else if (s.t === 'magnet') {
      const bob = Math.sin(t * 3) * 4, Y = s.y - 34 + bob;
      x.fillStyle = 'rgba(8,6,20,0.35)'; x.beginPath(); x.ellipse(s.x, s.y, 14, 6, 0, 0, TAU); x.fill();
      glow(x, s.x, Y, 46, 'rgba(180,140,255,0.7)');
      x.fillStyle = '#5a3aa8'; x.beginPath(); x.moveTo(s.x, Y - 22); x.lineTo(s.x + 11, Y); x.lineTo(s.x, Y + 16); x.lineTo(s.x - 11, Y); x.closePath(); x.fill();
      x.fillStyle = '#c8b0ff'; x.beginPath(); x.moveTo(s.x, Y - 22); x.lineTo(s.x + 4, Y - 2); x.lineTo(s.x, Y + 16); x.lineTo(s.x - 5, Y); x.closePath(); x.fill();
      for (const u of G.units) { if (!Spells.foe(s, u) || u.obj) continue; const d = hypot(u.x - s.x, u.y - s.y); if (d < s.pullR) { x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(210,180,255,${0.8 - d / s.pullR * 0.6})`; x.lineWidth = 1.5; x.beginPath(); x.moveTo(s.x, Y); for (let k = 1; k <= 5; k++) x.lineTo(lerp(s.x, u.x, k / 5) + (Math.random() - 0.5) * 12, lerp(Y, u.y - 20, k / 5) + (Math.random() - 0.5) * 12); x.stroke(); x.restore(); } }
    }
  }
  function turret(x, G, u) {
    const t = G.time, Y = u.y;
    x.fillStyle = 'rgba(8,6,20,0.35)'; x.beginPath(); x.ellipse(u.x, Y + 2, 14, 6, 0, 0, TAU); x.fill();
    x.strokeStyle = '#3e7a32'; x.lineWidth = 4; x.beginPath(); x.moveTo(u.x, Y); x.quadraticCurveTo(u.x - 6, Y - 16, u.x, Y - 30); x.stroke();
    x.fillStyle = '#5aa84a'; x.beginPath(); x.ellipse(u.x - 8, Y - 12, 7, 3, -0.5, 0, TAU); x.ellipse(u.x + 7, Y - 18, 7, 3, 0.5, 0, TAU); x.fill();
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + t; x.fillStyle = k % 2 ? '#b89aff' : '#e6d6ff'; x.beginPath(); x.ellipse(u.x + Math.cos(a) * 7, Y - 32 + Math.sin(a) * 4, 7, 4, a, 0, TAU); x.fill(); }
    glow(x, u.x, Y - 32, 26, 'rgba(200,170,255,0.8)'); x.fillStyle = '#fff'; x.beginPath(); x.arc(u.x, Y - 32, 4, 0, TAU); x.fill();
    const col = PLAYER_COLORS[u.by] ? PLAYER_COLORS[u.by].main : '#fff';
    x.fillStyle = 'rgba(10,8,25,0.6)'; x.fillRect(u.x - 14, Y - 50, 28, 4); x.fillStyle = col; x.fillRect(u.x - 14, Y - 50, 28 * u.hp / u.maxHp, 4);
  }
  // lo que va por encima (nubes, tormenta, arena)
  function over(x, G) {
    const t = G.time;
    for (const s of G.spells) {
      if (s.t === 'cloud') {
        const fade = Math.min(1, s.life / 0.6, s.age * 4);
        for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + s.id, d = (k % 3) * s.r * 0.28, px = s.x + Math.cos(a + t * 0.2) * d, py = s.y - 20 + Math.sin(a + t * 0.2) * d * 0.55, r = s.r * (0.42 + 0.1 * Math.sin(t + k)); x.globalAlpha = 0.6 * fade; sdot(x, 'rgb(236,242,252)', px, py, r * 1.35); } x.globalAlpha = 1;
      } else if (s.t === 'storm') {
        const fade = Math.min(1, s.life / 0.6, s.age * 4);
        x.save(); x.globalAlpha = fade;
        x.strokeStyle = 'rgba(160,200,255,0.5)'; x.lineWidth = 1.2; x.beginPath();
        for (let k = 0; k < 26; k++) { const px = s.x + (hash2(k, s.id) - 0.5) * s.r * 1.8, py0 = s.y - 100 + ((t * 500 + k * 37) % 120); if (hypot(px - s.x, (py0 - s.y + 60) * 0.5) > s.r) continue; x.moveTo(px, py0); x.lineTo(px - 3, py0 + 14); } x.stroke();
        for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + s.id, d = (k % 2) * s.r * 0.4, px = s.x + Math.cos(a + t * 0.3) * d, py = s.y - 110 + Math.sin(a + t * 0.3) * d * 0.3; x.globalAlpha = fade * 0.95; sdot(x, k % 2 ? 'rgb(52,56,84)' : 'rgb(72,78,110)', px, py, s.r * 0.6); x.globalAlpha = fade; } { const fl = Math.sin(t * 13 + s.id) > 0.93; if (fl) glow(x, s.x, s.y - 110, s.r * 1.1, 'rgba(190,170,255,0.6)'); }
        x.restore();
      } else if (s.t === 'sand') {
        const fade = Math.min(1, s.life / 0.5, s.age * 4);
        x.save(); x.globalAlpha = fade * 0.75;
        for (let k = 0; k < 40; k++) { const a = t * (2 + (k % 3)) + k * 0.7, d = s.r * (0.3 + 0.7 * hash2(k, 3)); x.fillStyle = k % 3 ? 'rgba(220,180,120,0.8)' : 'rgba(180,140,90,0.8)'; x.fillRect(s.x + Math.cos(a) * d, s.y - 20 + Math.sin(a) * d * 0.45 - (k % 5) * 6, 3, 2); }
        x.fillStyle = 'rgba(200,160,100,0.12)'; x.beginPath(); x.ellipse(s.x, s.y - 16, s.r, s.r * 0.5, 0, 0, TAU); x.fill();
        x.restore();
      } else if (s.t === 'beam' && !s.fired) {
        const m = G.mages[s.by]; if (!m) continue; const f = 1 - s.windup / s.S.windup;
        x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(255,170,80,${0.25 + f * 0.5})`; x.lineWidth = 2 + f * 3; x.setLineDash([10, 8]); x.beginPath(); x.moveTo(m.x, m.y - 16); x.lineTo(m.x + Math.cos(s.ang) * s.S.len * s.size, m.y - 16 + Math.sin(s.ang) * s.S.len * s.size); x.stroke(); x.setLineDash([]); x.restore();
        glow(x, m.x + Math.cos(s.ang) * 22, m.y - 26, 20 + f * 30, 'rgba(255,200,120,0.9)');
      }
    }
  }
  /* ---------- efectos ---------- */
  function jag(x, x0, y0, x1, y1, seed, n = 7, amp = 14) {
    x.beginPath(); x.moveTo(x0, y0);
    for (let k = 1; k < n; k++) { const f = k / n; x.lineTo(lerp(x0, x1, f) + (hash2(seed, k) - 0.5) * amp * 2, lerp(y0, y1, f) + (hash2(k, seed) - 0.5) * amp * 2); }
    x.lineTo(x1, y1);
  }
  function shapes(x, G) {
    for (const o of FX.shapes) {
      if (o.delay && o.t < o.delay) continue;
      const f = (o.t - (o.delay || 0)) / o.life, E = EC(o.el), A = 1 - f;
      x.save();
      switch (o.type) {
        case 'num': { const s = (o.big ? 22 : 16) * (f < 0.15 ? 1 + (0.15 - f) * 4 : 1); x.globalAlpha = Math.min(1, A * 1.6); x.font = fontB(s, 900); x.textAlign = 'center'; x.textBaseline = 'middle'; const Y = o.y - f * 34; x.lineWidth = 4; x.strokeStyle = 'rgba(10,6,24,0.9)'; x.strokeText(o.v, o.x, Y); x.fillStyle = o.big ? '#fff3c0' : E.c0; x.fillText(o.v, o.x, Y); break; }
        case 'ring': x.globalCompositeOperation = o.mud ? 'source-over' : 'lighter'; x.strokeStyle = o.gold ? `rgba(255,220,120,${A})` : o.mud ? `rgba(110,80,45,${A})` : E.c1; x.globalAlpha = o.mud ? 1 : A; x.lineWidth = (o.w || 3) * A + 1; x.beginPath(); const r = lerp(o.r0, o.r1, smooth(f)); x.ellipse(o.x, o.y, r, r * 0.5, 0, 0, TAU); x.stroke(); break;
        case 'granBurst': { x.globalCompositeOperation = 'lighter'; const E1 = EC(o.els[0]), E2 = EC(o.els[1]), R = o.r * (0.35 + 0.65 * Math.sqrt(f));
          // rayos de luz que salen del centro, alternando los dos elementos y oro
          x.translate(o.x, o.y - 20); x.rotate(f * 0.6);
          for (let k = 0; k < 18; k++) { const a = k / 18 * TAU, w = 0.07 + (k % 3) * 0.03, col = k % 3 === 0 ? '255,233,160' : (k % 3 === 1 ? E1 : E2).light.join(','), g = x.createLinearGradient(0, 0, Math.cos(a) * R * 1.4, Math.sin(a) * R * 0.9);
            g.addColorStop(0, `rgba(${col},${0.75 * A})`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a - w) * R * 1.4, Math.sin(a - w) * R * 0.9); x.lineTo(Math.cos(a + w) * R * 1.4, Math.sin(a + w) * R * 0.9); x.closePath(); x.fill(); }
          break; }
        case 'flash': x.globalCompositeOperation = 'lighter'; { const g = x.createRadialGradient(o.x, o.y - 20, 0, o.x, o.y - 20, o.r); g.addColorStop(0, o.gold ? `rgba(255,240,180,${A * 0.8})` : `rgba(${E.light.join(',')},${A * 0.7})`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(o.x, o.y - 20, o.r, 0, TAU); x.fill(); } break;
        case 'cone': x.globalCompositeOperation = 'lighter'; { const R = o.range * (0.4 + 0.6 * smooth(Math.min(1, f * 2))); x.fillStyle = o.el === 'frost' ? `rgba(200,240,255,${A * 0.35})` : `rgba(200,255,235,${A * 0.25})`; x.beginPath(); x.moveTo(o.x, o.y); x.arc(o.x, o.y, R, o.ang - o.half, o.ang + o.half); x.closePath(); x.fill(); x.strokeStyle = o.el === 'frost' ? `rgba(255,255,255,${A * 0.8})` : `rgba(230,255,245,${A * 0.7})`; x.lineWidth = 2; x.beginPath(); x.arc(o.x, o.y, R, o.ang - o.half, o.ang + o.half); x.stroke(); } break;
        case 'zap': if (o.el === 'shadow') { x.strokeStyle = `rgba(16,4,24,${A})`; x.lineWidth = 11; jag(x, o.x0, o.y0, o.x1, o.y1, o.seed + ((o.t * 30) | 0)); x.stroke(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(214,84,180,${A})`; x.lineWidth = 4; x.stroke(); x.strokeStyle = `rgba(255,200,240,${A})`; x.lineWidth = 1.5; x.stroke(); break; }
          x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(200,170,255,${A})`; x.lineWidth = 6; jag(x, o.x0, o.y0, o.x1, o.y1, o.seed + ((o.t * 30) | 0)); x.stroke(); x.strokeStyle = `rgba(255,255,255,${A})`; x.lineWidth = 2; x.stroke(); break;
        case 'bolt': x.globalCompositeOperation = 'lighter'; { const top = o.y - 460, sd = o.seed + ((o.t * 20) | 0) * 0.37;
          x.strokeStyle = `rgba(150,110,255,${A * 0.35})`; x.lineWidth = o.small ? 12 : 26; jag(x, o.x + 40, top, o.x, o.y - 6, sd, 10, o.small ? 14 : 22); x.stroke();
          x.strokeStyle = `rgba(200,170,255,${A})`; x.lineWidth = o.small ? 4 : 8; x.stroke(); x.strokeStyle = `rgba(255,255,255,${A})`; x.lineWidth = o.small ? 1.6 : 3; x.stroke();
          for (let b = 0; b < (o.small ? 1 : 3); b++) { const f2 = 0.3 + hash2(o.seed, b) * 0.4, sx = lerp(o.x + 40, o.x, f2) + (hash2(b, o.seed) - 0.5) * 30, sy = lerp(top, o.y, f2); x.strokeStyle = `rgba(220,200,255,${A * 0.8})`; x.lineWidth = 1.6; jag(x, sx, sy, sx + (hash2(o.seed + b, 3) - 0.5) * 160, sy + 60 + hash2(b, 7) * 80, sd + b * 13, 5, 10); x.stroke(); }
          const sg = x.createRadialGradient(o.x, o.y, 0, o.x, o.y, (o.r || 50) * 1.4); sg.addColorStop(0, `rgba(255,255,255,${A * 0.7})`); sg.addColorStop(1, 'rgba(160,120,255,0)'); x.fillStyle = sg; x.beginPath(); x.ellipse(o.x, o.y, (o.r || 50) * 1.4, (o.r || 50) * 0.7, 0, 0, TAU); x.fill(); } break;
        case 'fireball': { x.globalCompositeOperation = 'lighter'; const r = o.r * (0.45 + 0.55 * smooth(Math.min(1, f * 1.8))), fg = x.createRadialGradient(o.x, o.y - r * 0.3, 0, o.x, o.y - r * 0.3, r); fg.addColorStop(0, `rgba(255,255,230,${A})`); fg.addColorStop(0.3, `rgba(255,210,90,${A * 0.95})`); fg.addColorStop(0.65, `rgba(255,100,30,${A * 0.7})`); fg.addColorStop(1, 'rgba(160,30,10,0)'); x.fillStyle = fg; x.beginPath(); x.arc(o.x, o.y - r * 0.3, r, 0, TAU); x.fill(); } break;
        case 'ripple': { x.strokeStyle = `rgba(200,240,255,${A * 0.8})`; x.lineWidth = 2.5 * A + 0.5; for (let k = 0; k < 2; k++) { const r = o.r1 * smooth(Math.min(1, f * (1.3 - k * 0.3))); x.beginPath(); x.ellipse(o.x, o.y, r, r * 0.5, 0, 0, TAU); x.stroke(); } } break;
        case 'beamFlash': x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; x.strokeStyle = `rgba(255,120,40,${A * 0.7})`; x.lineWidth = o.w * 1.8 * A; x.beginPath(); x.moveTo(o.x0, o.y0); x.lineTo(o.x1, o.y1); x.stroke(); x.strokeStyle = `rgba(255,230,160,${A})`; x.lineWidth = o.w * 0.8 * A + 2; x.stroke(); x.strokeStyle = `rgba(255,255,255,${A})`; x.lineWidth = o.w * 0.3 * A + 1; x.stroke(); break;
        case 'rise': x.fillStyle = o.el === 'light' ? `rgba(255,240,180,${A})` : o.el === 'bolt' ? `rgba(200,170,255,${A})` : o.el === 'plant' ? `rgba(120,220,100,${A})` : `rgba(190,150,100,${A})`; for (let k = 0; k < 5; k++) { const ox = (k - 2) * 8, h = (20 + (k % 2) * 12) * Math.sin(Math.min(1, f * 3) * Math.PI / 2); x.beginPath(); x.moveTo(o.x + ox - 4, o.y + 8); x.lineTo(o.x + ox, o.y + 8 - h); x.lineTo(o.x + ox + 4, o.y + 8); x.fill(); } break;
        case 'sprout': { const g = Math.min(1, f * 2.5); x.strokeStyle = '#4f9a3c'; x.lineWidth = 2.5; for (let k = -1; k <= 1; k++) { x.beginPath(); x.moveTo(o.x + k * 6, o.y + 6); x.quadraticCurveTo(o.x + k * 10, o.y - 6 * g, o.x + k * 4, o.y - 14 * g); x.stroke(); } x.globalAlpha = A; x.fillStyle = '#9fe07a'; x.beginPath(); x.arc(o.x, o.y - 14 * g, 3 * g, 0, TAU); x.fill(); } break;
        default: ArtSpells2.shape(x, o, f, A); break;
        case 'snare': x.strokeStyle = `rgba(80,160,60,${A})`; x.lineWidth = 3; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; x.beginPath(); x.moveTo(o.x + Math.cos(a) * 26, o.y + Math.sin(a) * 12); x.quadraticCurveTo(o.x + Math.cos(a + 0.6) * 10, o.y - 26 * Math.min(1, f * 3), o.x, o.y - 30 * Math.min(1, f * 3)); x.stroke(); } break;
      }
      x.restore();
    }
  }
  function parts(x) {
    for (const p of FX.parts) {
      const f = p.t / p.life, A = 1 - f, X = p.x, Y = p.y - p.z;
      if (p.add) x.globalCompositeOperation = 'lighter'; else x.globalCompositeOperation = 'source-over';
      switch (p.kind) {
        case 'smoke': x.globalAlpha = A; sdot(x, p.color, X, Y, p.size * (0.8 + f * 1.1)); break;
        case 'leaf': x.globalAlpha = A; x.fillStyle = p.color.startsWith('#') ? '#7ec85a' : p.color; x.save(); x.translate(X, Y); x.rotate(p.t * 8 + p.x); x.beginPath(); x.ellipse(0, 0, p.size * 1.4, p.size * 0.6, 0, 0, TAU); x.fill(); x.restore(); break;
        case 'chunk': x.globalAlpha = Math.min(1, A * 2); x.fillStyle = '#8a6a44'; x.fillRect(X - p.size / 2, Y - p.size / 2, p.size, p.size * 0.8); break;
        case 'blob': x.globalAlpha = Math.min(1, A * 2); x.fillStyle = p.color; x.beginPath(); x.arc(X, Y, p.size, 0, TAU); x.fill(); break;
        case 'flake': x.globalAlpha = A; x.fillStyle = p.color; x.fillRect(X - p.size / 2, Y - p.size / 2, p.size, p.size); break;
        case 'flame': { x.globalAlpha = A * 0.9; const c = f < 0.3 ? '255,240,180' : f < 0.6 ? '255,150,50' : '200,60,30'; const gg = x.createRadialGradient(X, Y, 0, X, Y, p.size * (1 - f * 0.4)); gg.addColorStop(0, `rgba(${c},0.9)`); gg.addColorStop(1, `rgba(${c},0)`); x.fillStyle = gg; x.beginPath(); x.arc(X, Y, p.size * (1 - f * 0.4), 0, TAU); x.fill(); break; }
        case 'drop': x.globalAlpha = Math.min(1, A * 1.5); x.fillStyle = p.color; x.beginPath(); x.ellipse(X, Y, p.size * 0.8, p.size * 1.2, 0, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,255,255,0.8)'; x.fillRect(X - p.size * 0.3, Y - p.size * 0.6, p.size * 0.4, p.size * 0.4); break;
        case 'shard': x.globalAlpha = A; x.fillStyle = p.color; x.beginPath(); x.moveTo(X, Y - p.size * 1.5); x.lineTo(X + p.size, Y + p.size); x.lineTo(X - p.size, Y + p.size); x.fill(); break;
        case 'streak': x.globalAlpha = A * 0.8; x.strokeStyle = p.color; x.lineWidth = p.size * 0.6; x.beginPath(); x.moveTo(X, Y); x.lineTo(X - p.vx * 0.04, Y - p.vy * 0.04); x.stroke(); break;
        default: x.globalAlpha = A; x.fillStyle = p.color; x.beginPath(); x.arc(X, Y, p.size * (p.kind === 'ember' ? A : 1), 0, TAU); x.fill();
      }
    }
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  }
  return { under, items, over, shapes, parts, glow, rgba };
})();
