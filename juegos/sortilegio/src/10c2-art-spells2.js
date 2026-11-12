/* =========================================================================
   DIBUJO 2.0 — hechizos de Luz y Sombra: rayos de sol, prisma, reflejos,
   cristales, girasol, juicio, eclipse, fuegos fatuos, marea negra, cuervos,
   fosa, zarzal y rayo negro. ArtSpells delega aquí lo que no conoce.
   ========================================================================= */
const ArtSpells2 = (() => {
  const glow = (...a) => ArtSpells.glow(...a);
  const star4 = (x, X, Y, r, col, rot = 0) => { x.save(); x.translate(X, Y); x.rotate(rot); x.fillStyle = col; x.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, rr = k % 2 ? r * 0.22 : r; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.closePath(); x.fill(); x.restore(); };
  /* ---------- en el suelo ---------- */
  function under(x, G) {
    const t = G.time;
    for (const s of G.spells) {
      if (s.t === 'judgment') {
        const f = 1 - s.delay / s.S.delay, r = s.r, locked = s.delay <= s.S.lockAt;
        x.save(); x.globalCompositeOperation = 'lighter';
        x.fillStyle = `rgba(255,236,170,${0.08 + f * 0.3})`; x.beginPath(); x.ellipse(s.x, s.y, r, r * 0.5, 0, 0, TAU); x.fill();
        x.strokeStyle = locked ? '#ffffff' : `rgba(255,226,130,${0.6 + f * 0.4})`; x.lineWidth = locked ? 3.5 : 2.2; x.beginPath(); x.ellipse(s.x, s.y, r, r * 0.5, 0, 0, TAU); x.stroke();
        const rr = r * (1.9 - f * 0.9); x.lineWidth = 1.5; x.setLineDash([10, 7]); x.lineDashOffset = t * 60; x.beginPath(); x.ellipse(s.x, s.y, rr, rr * 0.5, 0, 0, TAU); x.stroke(); x.setLineDash([]);
        for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + t * 1.5; x.beginPath(); x.moveTo(s.x + Math.cos(a) * r * 0.55, s.y + Math.sin(a) * r * 0.27); x.lineTo(s.x + Math.cos(a) * r * 1.15, s.y + Math.sin(a) * r * 0.57); x.stroke(); }
        // haz tenue que baja del cielo antes del golpe
        const cg = x.createLinearGradient(0, s.y - 420, 0, s.y); cg.addColorStop(0, 'rgba(255,240,180,0)'); cg.addColorStop(1, `rgba(255,240,180,${0.1 + f * 0.25})`); x.fillStyle = cg; x.fillRect(s.x - r * 0.5 * (0.3 + f * 0.7), s.y - 420, r * (0.3 + f * 0.7), 420);
        x.restore();
      } else if (s.t === 'eclipse') {
        const fade = Math.min(1, s.life / 0.5, s.age * 3);
        x.save(); x.globalAlpha = fade;
        const g = x.createRadialGradient(s.x, s.y, s.r * 0.15, s.x, s.y, s.r); g.addColorStop(0, 'rgba(6,2,16,0.82)'); g.addColorStop(0.8, 'rgba(18,6,34,0.7)'); g.addColorStop(1, 'rgba(40,10,60,0)');
        x.fillStyle = g; x.beginPath(); x.ellipse(s.x, s.y, s.r, s.r * 0.55, 0, 0, TAU); x.fill();
        x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(255,214,130,${0.5 + 0.2 * Math.sin(t * 5)})`; x.lineWidth = 2; x.setLineDash([3, 10]); x.lineDashOffset = -t * 30; x.beginPath(); x.ellipse(s.x, s.y, s.r * 0.96, s.r * 0.53, 0, 0, TAU); x.stroke(); x.setLineDash([]);
        x.restore();
      } else if (s.t === 'bog') {
        const fade = Math.min(1, s.life / 0.6, s.age * 4), R = s.r;
        x.save(); x.globalAlpha = fade;
        for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + s.id, d = R * (k ? 0.52 : 0), rr = R * (k ? 0.5 : 0.8) * (1 + 0.05 * Math.sin(t * 2 + k)); const px = s.x + Math.cos(a) * d, py = s.y + Math.sin(a) * d * 0.55; const g = x.createRadialGradient(px, py, 0, px, py, rr); g.addColorStop(0, 'rgba(8,2,14,0.95)'); g.addColorStop(0.75, 'rgba(34,8,44,0.85)'); g.addColorStop(1, 'rgba(60,14,70,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(px, py, rr, rr * 0.55, 0, 0, TAU); x.fill(); }
        x.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 8; k++) { const p = (t * 0.5 + k * 0.37) % 1, a = k * 2.4 + s.id, d = R * (0.2 + 0.6 * hash2(k, s.id)); x.strokeStyle = `rgba(214,84,180,${(1 - p) * 0.75})`; x.lineWidth = 1.4; x.beginPath(); x.ellipse(s.x + Math.cos(a) * d, s.y + Math.sin(a) * d * 0.55, 3 + p * 9, 1.5 + p * 4.5, 0, 0, TAU); x.stroke(); }
        x.strokeStyle = 'rgba(196,67,166,0.45)'; x.lineWidth = 2; x.beginPath(); x.ellipse(s.x, s.y, R * 0.98, R * 0.54, 0, 0, TAU); x.stroke();
        x.restore();
      } else if (s.t === 'pit') {
        const R = s.r;
        if (!s.open) {
          const f = 1 - s.delay / s.S.delay;
          x.save(); x.strokeStyle = `rgba(20,6,26,${0.5 + f * 0.5})`; x.lineWidth = 2 + f * 2; x.lineCap = 'round';
          for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + s.id, L = R * (0.35 + 0.65 * f) * (0.6 + 0.4 * hash2(k, s.id)); x.beginPath(); x.moveTo(s.x, s.y); x.lineTo(s.x + Math.cos(a + 0.2) * L * 0.5, s.y + Math.sin(a + 0.2) * L * 0.28); x.lineTo(s.x + Math.cos(a) * L, s.y + Math.sin(a) * L * 0.55); x.stroke(); }
          x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(214,84,180,${0.45 + 0.4 * Math.sin(t * 16)})`; x.lineWidth = 2.5; x.setLineDash([8, 6]); x.beginPath(); x.ellipse(s.x, s.y, R, R * 0.55, 0, 0, TAU); x.stroke(); x.restore();
        } else {
          const fade = Math.min(1, s.life / 0.4, (s.age - s.S.delay) * 8);
          x.save(); x.globalAlpha = fade;
          x.fillStyle = '#3a2c36'; x.beginPath(); for (let k = 0; k <= 18; k++) { const a = k / 18 * TAU, rr = R * (1.06 + 0.08 * hash2(k % 18, s.id)); x.lineTo(s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr * 0.55); } x.fill();
          const g = x.createRadialGradient(s.x, s.y + R * 0.2, R * 0.1, s.x, s.y, R); g.addColorStop(0, '#000000'); g.addColorStop(0.7, '#07030c'); g.addColorStop(1, '#1e1026');
          x.fillStyle = g; x.beginPath(); x.ellipse(s.x, s.y + 3, R * 0.96, R * 0.5, 0, 0, TAU); x.fill();
          x.strokeStyle = 'rgba(150,120,150,0.5)'; x.lineWidth = 2; x.beginPath(); x.ellipse(s.x, s.y + 1, R * 0.98, R * 0.52, 0, Math.PI * 1.05, Math.PI * 1.95); x.stroke();
          x.globalCompositeOperation = 'lighter'; for (let k = 0; k < 5; k++) { const p = (t * 0.7 + k / 5) % 1; x.fillStyle = `rgba(196,67,166,${(1 - p) * 0.5})`; x.beginPath(); x.arc(s.x + Math.sin(k * 2.3 + t) * R * 0.5, s.y - p * 46, 2.2 * (1 - p) + 0.6, 0, TAU); x.fill(); }
          x.restore();
        }
      } else if (s.t === 'thorns') {
        const fade = Math.min(1, s.life / 0.5), R = s.r * s.grow, N = 30;
        x.save(); x.globalAlpha = fade; x.lineCap = 'round';
        x.strokeStyle = '#150a1c'; x.lineWidth = 9; x.beginPath(); x.ellipse(s.x, s.y, R, R * 0.55, 0, 0, TAU); x.stroke();
        x.strokeStyle = '#3c1c48'; x.lineWidth = 5; x.beginPath(); for (let k = 0; k <= 60; k++) { const a = k / 60 * TAU, w = Math.sin(a * 9 + s.id) * 5; x.lineTo(s.x + Math.cos(a) * (R + w), s.y + Math.sin(a) * (R + w) * 0.55); } x.stroke();
        for (let k = 0; k < N; k++) { const a = k / N * TAU + s.id * 0.1, px = s.x + Math.cos(a) * R, py = s.y + Math.sin(a) * R * 0.55, out = k % 2 ? 1 : -1, h = 15 + (k % 3) * 5; x.fillStyle = k % 3 ? '#2a1234' : '#5a1e58'; x.beginPath(); x.moveTo(px - 4, py); x.lineTo(px + Math.cos(a) * out * 7, py - h); x.lineTo(px + 4, py); x.fill(); x.fillStyle = '#e06ac8'; x.fillRect(px + Math.cos(a) * out * 7 - 0.8, py - h, 1.6, 2.6); }
        x.restore();
      } else if (s.t === 'lob' && (s.kind === 'cage' || s.kind === 'bog')) {
        const f = s.tt / s.T, r = s.kind === 'cage' ? 92 : s.S.r * (s.size || 1);
        x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = s.kind === 'cage' ? `rgba(255,236,170,${0.35 + f * 0.6})` : `rgba(214,84,180,${0.3 + f * 0.6})`; x.lineWidth = 2.2; x.setLineDash([7, 6]); x.lineDashOffset = -t * 40; x.beginPath(); x.ellipse(s.tx, s.ty, r, r * 0.55, 0, 0, TAU); x.stroke(); x.restore();
      }
    }
  }
  /* ---------- lo que se ordena con los magos ---------- */
  function items(G, list) {
    for (const s of G.spells) if (s.t === 'wisp') list.push({ y: s.y + 4, draw: x => wisp(x, G, s.x, s.y - 30, s.id, s.arm > 0 ? 0.6 : 1) });
    for (const u of G.units) { if (!u.alive) continue; if (u.obj === 'decoy') list.push({ y: u.y, draw: x => decoy(x, G, u) }); else if (u.obj === 'sunflower') list.push({ y: u.y, draw: x => sunflower(x, G, u) }); }
  }
  function wisp(x, G, X, Y, id, k = 1) {
    const t = G.time + id;
    glow(x, X, Y, 26 * k, 'rgba(160,90,255,0.55)');
    x.save(); x.globalCompositeOperation = 'lighter'; x.translate(X, Y);
    for (let j = 0; j < 3; j++) { const w = (7 - j * 2) * k, h = (20 - j * 4) * k, sw = Math.sin(t * 9 + j) * 3; const g = x.createLinearGradient(0, 6, 0, -h); g.addColorStop(0, j === 2 ? 'rgba(255,255,255,0.95)' : 'rgba(120,255,220,0.8)'); g.addColorStop(0.5, j ? 'rgba(170,110,255,0.8)' : 'rgba(110,60,200,0.7)'); g.addColorStop(1, 'rgba(90,30,140,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(-w, 2); x.bezierCurveTo(-w, -h * 0.4, sw - 2, -h * 0.7, sw, -h); x.bezierCurveTo(sw + 2, -h * 0.7, w, -h * 0.4, w, 2); x.quadraticCurveTo(0, 8 * k, -w, 2); x.fill(); }
    x.globalCompositeOperation = 'source-over'; x.fillStyle = '#16061f'; x.beginPath(); x.ellipse(-2.2 * k, -3 * k, 1.1 * k, 1.9 * k, 0, 0, TAU); x.ellipse(2.2 * k, -3 * k, 1.1 * k, 1.9 * k, 0, 0, TAU); x.fill();
    x.restore();
    if (Math.random() < 0.3) FX.P({ x: X, y: Y + 30, z: 30, vx: (Math.random() - 0.5) * 20, vz: 30, g: -10, life: 0.5, size: 1.5, color: '#b98aff', kind: 'ember' });
  }
  function decoy(x, G, u) {
    const f = u._fake || (u._fake = { hands: CHARS[u.cid].hands.map(e => ({ el: e, hold: -1, uses: 0 })), dash: { t: 0 }, castT: 0, flash: 0, fuse: false, fullAt: HOLD_FULL, emb: 0, alive: true });
    Object.assign(f, { cid: u.cid, skin: u.skin, idx: u.by, x: u.x, y: u.y, vx: u.vx, vy: u.vy, face: u.face, moving: u.moving, walk: u.walk, st: u.st });
    const col = PLAYER_COLORS[u.by] ? PLAYER_COLORS[u.by].main : '#fff', Lk = ArtMage.look(u.cid, u.skin), S = Lk.scale * Lk.build;
    x.save(); x.translate(u.x, u.y); x.strokeStyle = col; x.globalAlpha = 0.9; x.lineWidth = 2.2; x.beginPath(); x.ellipse(0, 1, 21 * S, 8.5 * S, 0, 0.15, Math.PI - 0.15); x.stroke();
    x.fillStyle = col; const a = u.face; x.beginPath(); x.moveTo(Math.cos(a) * 33, Math.sin(a) * 13 + 1); x.lineTo(Math.cos(a + 0.28) * 26, Math.sin(a + 0.28) * 10 + 1); x.lineTo(Math.cos(a - 0.28) * 26, Math.sin(a - 0.28) * 10 + 1); x.fill();
    x.font = fontB(12, 900); x.textAlign = 'center'; x.fillStyle = 'rgba(10,8,25,0.6)'; x.fillText(`J${u.by + 1}`, 1, -108 * Lk.scale + 1); x.fillStyle = col; x.fillText(`J${u.by + 1}`, 0, -108 * Lk.scale); x.restore();
    const life = Math.min(1, u.life / 0.5); x.save(); x.globalAlpha = 0.55 + 0.45 * life; ArtMage.draw(x, G, f); x.restore();
    // brillo delator muy tenue (para el dueño): un destello que recorre el reflejo
    if (((G.time * 0.7 + u.foolK * 3) % 1.6) < 0.12) glow(x, u.x, u.y - 50, 46, 'rgba(255,246,200,0.35)');
  }
  function sunflower(x, G, u) {
    const t = G.time, Y = u.y, fx = Math.cos(u.aim), fy = Math.sin(u.aim), hx = u.x + fx * 7, hy = Y - 46 + fy * 3;
    x.fillStyle = 'rgba(8,6,20,0.35)'; x.beginPath(); x.ellipse(u.x, Y + 2, 16, 6, 0, 0, TAU); x.fill();
    x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = 'rgba(255,236,150,0.25)'; x.lineWidth = 1.5; x.setLineDash([4, 7]); x.lineDashOffset = -t * 20; x.beginPath(); x.ellipse(u.x, Y, u.healR, u.healR * 0.55, 0, 0, TAU); x.stroke(); x.restore();
    x.strokeStyle = '#2f6a2a'; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(u.x, Y); x.quadraticCurveTo(u.x - 6, Y - 22, hx, hy + 6); x.stroke();
    x.strokeStyle = '#58a044'; x.lineWidth = 2; x.beginPath(); x.moveTo(u.x - 1, Y - 2); x.quadraticCurveTo(u.x - 7, Y - 22, hx - 1, hy + 6); x.stroke();
    for (const [sx, yy, rot] of [[-1, -14, -0.6], [1, -24, 0.5]]) { x.save(); x.translate(u.x + sx * 3, Y + yy); x.rotate(rot + Math.sin(t * 2 + sx) * 0.08); x.fillStyle = '#4c9a3c'; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(sx * 9, -7, sx * 17, 0); x.quadraticCurveTo(sx * 9, 5, 0, 0); x.fill(); x.strokeStyle = 'rgba(20,60,20,0.6)'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(0, 0); x.lineTo(sx * 15, 0); x.stroke(); x.restore(); }
    glow(x, hx, hy, 38, 'rgba(255,220,110,0.7)');
    x.save(); x.translate(hx, hy); x.scale(1, 0.92);
    for (let ring = 0; ring < 2; ring++) for (let k = 0; k < 13; k++) { const a = k / 13 * TAU + ring * 0.24 + t * 0.25, L = ring ? 12 : 16; x.save(); x.rotate(a); const pg = x.createLinearGradient(6, 0, 6 + L, 0); pg.addColorStop(0, '#e89a1c'); pg.addColorStop(1, ring ? '#fff0a0' : '#ffd23a'); x.fillStyle = pg; x.beginPath(); x.ellipse(6 + L / 2, 0, L / 2, 3.2, 0, 0, TAU); x.fill(); x.restore(); }
    const cg = x.createRadialGradient(-2, -2, 1, 0, 0, 8); cg.addColorStop(0, '#8a5a22'); cg.addColorStop(1, '#3a200a'); x.fillStyle = cg; x.beginPath(); x.arc(0, 0, 7.5, 0, TAU); x.fill();
    const ch = clamp(1 - u.next / u.every, 0, 1); x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(255,250,210,${ch * 0.9})`; x.beginPath(); x.arc(0, 0, 2 + ch * 4, 0, TAU); x.fill(); x.restore();
    const col = PLAYER_COLORS[u.by] ? PLAYER_COLORS[u.by].main : '#fff';
    x.fillStyle = 'rgba(10,8,25,0.6)'; x.fillRect(u.x - 14, Y - 72, 28, 4); x.fillStyle = col; x.fillRect(u.x - 14, Y - 72, 28 * u.hp / u.maxHp, 4);
  }
  /* ---------- proyectiles de luz, sombra, cuervos y fuegos fatuos ---------- */
  function proj(x, G, s, Y, a, ribbon) {
    const t = G.time, rnd = Math.random;
    if (s.wisp) { wisp(x, G, s.x, Y - 6, s.id, 0.9); return true; }
    if (s.crow) {
      ribbon(5, 'rgba(60,20,80,0.55)', 'rgba(20,6,30,0)', false);
      const fl = Math.sin(t * 26 + s.id * 2); x.save(); x.translate(s.x, Y); x.rotate(a);
      x.fillStyle = '#0b0610'; x.strokeStyle = 'rgba(196,67,166,0.7)'; x.lineWidth = 0.9;
      x.beginPath(); x.moveTo(11, 0); x.quadraticCurveTo(4, -4, -9, -1.5); x.lineTo(-14, -4); x.lineTo(-12, 0); x.lineTo(-14, 4); x.lineTo(-9, 1.5); x.quadraticCurveTo(4, 4, 11, 0); x.fill(); x.stroke();
      for (const sd of [-1, 1]) { x.beginPath(); x.moveTo(3, sd * 2); x.quadraticCurveTo(-2, sd * (10 + fl * 7), -11, sd * (13 + fl * 9)); x.quadraticCurveTo(-5, sd * (6 + fl * 3), -4, sd * 2); x.closePath(); x.fill(); x.stroke(); }
      x.fillStyle = '#ff6ad0'; x.beginPath(); x.arc(7, -1, 1.1, 0, TAU); x.fill(); x.fillStyle = '#d8a030'; x.beginPath(); x.moveTo(11, -0.8); x.lineTo(15, 0.3); x.lineTo(11, 1); x.fill();
      x.restore();
      if (rnd() < 0.25) FX.P({ x: s.x, y: s.y, z: 18, vx: (rnd() - 0.5) * 30, vy: (rnd() - 0.5) * 20, vz: -10, g: 60, drag: 2, life: 0.5, size: 2.4, color: '#1a0c22', kind: 'leaf', add: false });
      return true;
    }
    if (s.el === 'light') {
      ribbon(s.r * 0.8, 'rgba(255,246,200,0.9)', 'rgba(255,200,90,0)', true);
      glow(x, s.x, Y, s.r * 4.2, 'rgba(255,226,130,0.8)');
      x.save(); x.globalCompositeOperation = 'lighter'; x.translate(s.x, Y); x.rotate(a);
      const g = x.createLinearGradient(-s.r * 3.4, 0, s.r * 1.6, 0); g.addColorStop(0, 'rgba(255,214,110,0)'); g.addColorStop(0.7, 'rgba(255,240,180,0.95)'); g.addColorStop(1, '#ffffff'); x.fillStyle = g;
      x.beginPath(); x.moveTo(s.r * 1.8, 0); x.lineTo(0, -s.r * 0.55); x.lineTo(-s.r * 3.4, 0); x.lineTo(0, s.r * 0.55); x.closePath(); x.fill(); x.restore();
      x.save(); x.globalCompositeOperation = 'lighter'; star4(x, s.x, Y, s.r * (1.5 + 0.3 * Math.sin(t * 40)), 'rgba(255,255,255,0.95)', t * 3); x.restore();
      if (rnd() < 0.6) FX.P({ x: s.x, y: s.y, z: 18, vx: (rnd() - 0.5) * 60, vy: (rnd() - 0.5) * 40, vz: 10, g: 0, drag: 3, life: 0.25 + rnd() * 0.2, size: 1.4, color: rnd() < 0.5 ? '#ffffff' : '#ffe48a', kind: 'ember' });
      return true;
    }
    if (s.el === 'shadow') {
      ribbon(s.r * 1.25, 'rgba(40,10,56,0.8)', 'rgba(20,4,30,0)', false);
      ribbon(s.r * 0.5, 'rgba(214,84,180,0.75)', 'rgba(140,40,160,0)', true);
      glow(x, s.x, Y, s.r * 2.8, 'rgba(180,60,170,0.5)');
      x.save(); x.translate(s.x, Y); x.rotate(a);
      const g = x.createRadialGradient(s.r * 0.25, -s.r * 0.25, 0.5, 0, 0, s.r * 1.15); g.addColorStop(0, '#5a2470'); g.addColorStop(0.55, '#1c0826'); g.addColorStop(1, '#06020a'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, s.r, 0, TAU); x.fill();
      x.globalCompositeOperation = 'lighter'; x.strokeStyle = 'rgba(255,130,220,0.9)'; x.lineWidth = 1.5; x.lineCap = 'round';
      for (let k = -1; k <= 1; k++) { x.beginPath(); x.moveTo(-s.r * 0.6, k * s.r * 0.55); x.quadraticCurveTo(s.r * 0.6, k * s.r * 0.9, s.r * 1.55, k * s.r * 0.35); x.stroke(); }
      x.strokeStyle = 'rgba(214,84,180,0.75)'; x.lineWidth = 1.2; x.beginPath(); x.arc(0, 0, s.r * 1.02, t * 8, t * 8 + 4.2); x.stroke(); x.restore();
      if (rnd() < 0.55) FX.P({ x: s.x - Math.cos(a) * s.r, y: s.y - Math.sin(a) * s.r, z: 18, vx: (rnd() - 0.5) * 30, vy: (rnd() - 0.5) * 20, vz: 14, g: -10, drag: 1.5, life: 0.4 + rnd() * 0.4, size: s.r * (0.6 + rnd() * 0.5), color: 'rgba(40,10,55,0.5)', kind: 'smoke', add: false });
      return true;
    }
    return false;
  }
  function lob(x, G, s, Y) {
    const t = G.time;
    if (s.kind === 'cage') { glow(x, s.x, Y, 30, 'rgba(255,236,170,0.9)'); x.save(); x.translate(s.x, Y); x.rotate(t * 5); const g = x.createLinearGradient(-8, -12, 8, 12); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#ffe9a0'); g.addColorStop(1, '#c88a2a'); x.fillStyle = g; x.beginPath(); x.moveTo(0, -13); x.lineTo(7, 0); x.lineTo(0, 13); x.lineTo(-7, 0); x.closePath(); x.fill(); x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 1; x.beginPath(); x.moveTo(0, -13); x.lineTo(0, 13); x.stroke(); x.restore(); return true; }
    if (s.kind === 'bog') { glow(x, s.x, Y, 22, 'rgba(196,67,166,0.6)'); x.fillStyle = '#0c0412'; x.beginPath(); x.ellipse(s.x, Y, 13, 11, t * 3, 0, TAU); x.fill(); x.fillStyle = '#5a2470'; x.beginPath(); x.arc(s.x - 3, Y - 3, 4.5, 0, TAU); x.fill(); return true; }
    return false;
  }
  /* ---------- por encima ---------- */
  function over(x, G) {
    const t = G.time;
    for (const s of G.spells) {
      if (s.t === 'eclipse') {
        const fade = Math.min(1, s.life / 0.5, s.age * 3), X = s.x, Y = s.y - 150, R = 30;
        x.save(); x.globalAlpha = fade * 0.35; const vg = x.createLinearGradient(0, Y, 0, s.y); vg.addColorStop(0, 'rgba(20,6,34,0)'); vg.addColorStop(1, 'rgba(20,6,34,0.9)'); x.fillStyle = vg; x.beginPath(); x.moveTo(X - R, Y); x.lineTo(X + R, Y); x.lineTo(X + s.r, s.y); x.lineTo(X - s.r, s.y); x.fill();
        x.globalAlpha = fade; x.globalCompositeOperation = 'lighter';
        const cg = x.createRadialGradient(X, Y, R * 0.9, X, Y, R * 2.6); cg.addColorStop(0, 'rgba(255,226,150,0.95)'); cg.addColorStop(0.25, 'rgba(255,160,90,0.5)'); cg.addColorStop(1, 'rgba(255,120,60,0)'); x.fillStyle = cg; x.beginPath(); x.arc(X, Y, R * 2.6, 0, TAU); x.fill();
        x.strokeStyle = 'rgba(255,240,200,0.8)'; x.lineWidth = 1.2; for (let k = 0; k < 14; k++) { const a = k / 14 * TAU + t * 0.4, L = R * (1.5 + 0.5 * Math.sin(t * 3 + k * 1.9)); x.beginPath(); x.moveTo(X + Math.cos(a) * R * 1.08, Y + Math.sin(a) * R * 1.08); x.lineTo(X + Math.cos(a) * L, Y + Math.sin(a) * L); x.stroke(); }
        x.globalCompositeOperation = 'source-over'; x.fillStyle = '#04010a'; x.beginPath(); x.arc(X, Y, R, 0, TAU); x.fill();
        x.restore();
      } else if (s.t === 'nova') {
        const f = 1 - s.windup / s.S.windup;
        x.save(); x.globalCompositeOperation = 'lighter'; glow(x, s.x, s.y - 30, 40 + f * 60, `rgba(255,220,120,${0.4 + f * 0.5})`);
        x.strokeStyle = `rgba(255,240,190,${0.3 + f * 0.6})`; x.lineWidth = 2 + f * 2; x.beginPath(); x.ellipse(s.x, s.y, s.r * (1.15 - f * 0.15), s.r * (1.15 - f * 0.15) * 0.55, 0, 0, TAU); x.stroke();
        for (let k = 0; k < 10; k++) { const a = k / 10 * TAU + t * 3, d = s.r * (1 - f) + 20; star4(x, s.x + Math.cos(a) * d, s.y - 30 + Math.sin(a) * d * 0.55, 5, 'rgba(255,246,200,0.9)', t * 4 + k); }
        x.restore();
      }
    }
  }
  /* ---------- efectos nuevos (FX.shapes) ---------- */
  function shape(x, o, f, A) {
    switch (o.type) {
      case 'sunray': {
        x.globalCompositeOperation = 'lighter'; x.lineCap = 'round'; x.lineJoin = 'round';
        const col = o.hue != null ? `hsla(${Math.round(o.hue * 290)},100%,62%,` : 'rgba(255,196,80,', lift = o.flat ? 0 : 16;
        const path = () => { x.beginPath(); o.segs.forEach(([ax, ay, bx, by], i) => { if (!i) x.moveTo(ax, ay - lift); x.lineTo(bx, by - lift); }); };
        path(); x.strokeStyle = col + A * 0.55 + ')'; x.lineWidth = o.w * 2.4 * A + 2; x.stroke();
        x.strokeStyle = o.hue != null ? `hsla(${Math.round(o.hue * 290)},100%,82%,${A})` : `rgba(255,240,170,${A})`; x.lineWidth = o.w * A + 1.5; x.stroke();
        x.strokeStyle = `rgba(255,255,255,${A})`; x.lineWidth = o.w * 0.4 * A + 1; x.stroke();
        for (let i = 1; i < o.segs.length; i++) { const [ax, ay] = o.segs[i]; star4(x, ax, ay - lift, 26 * A + 6, `rgba(255,255,255,${A})`, o.t * 6); }
        const e = o.segs[o.segs.length - 1]; star4(x, e[2], e[3] - lift, 18 * A + 4, `rgba(255,250,220,${A})`, -o.t * 5); break;
      }
      case 'nova': {
        x.globalCompositeOperation = 'lighter'; const r = o.r * (0.35 + 0.65 * smooth(Math.min(1, f * 1.6)));
        const g = x.createRadialGradient(o.x, o.y - 20, 0, o.x, o.y - 20, r); g.addColorStop(0, `rgba(255,255,255,${A})`); g.addColorStop(0.35, `rgba(255,236,150,${A * 0.9})`); g.addColorStop(0.75, `rgba(255,150,50,${A * 0.55})`); g.addColorStop(1, 'rgba(255,90,20,0)');
        x.fillStyle = g; x.beginPath(); x.ellipse(o.x, o.y - 20, r, r * 0.8, 0, 0, TAU); x.fill();
        x.strokeStyle = `rgba(255,246,200,${A})`; x.lineWidth = 3 * A + 1; for (let k = 0; k < 18; k++) { const a = k / 18 * TAU + o.seed, r0 = r * 0.5, r1 = r * (1.1 + 0.5 * hash2(k, 9)); x.beginPath(); x.moveTo(o.x + Math.cos(a) * r0, o.y - 20 + Math.sin(a) * r0 * 0.7); x.lineTo(o.x + Math.cos(a) * r1, o.y - 20 + Math.sin(a) * r1 * 0.7); x.stroke(); }
        x.lineWidth = 8 * A + 1; x.strokeStyle = `rgba(255,220,130,${A * 0.8})`; x.beginPath(); x.ellipse(o.x, o.y, r * 1.02, r * 0.56, 0, 0, TAU); x.stroke(); break;
      }
      case 'pillar': {
        x.globalCompositeOperation = 'lighter'; const w = o.r * (f < 0.2 ? f / 0.2 : 1) * (0.5 + A * 0.5), top = o.y - 520;
        const g = x.createLinearGradient(o.x - w, 0, o.x + w, 0); g.addColorStop(0, 'rgba(255,214,110,0)'); g.addColorStop(0.3, `rgba(255,236,160,${A * 0.8})`); g.addColorStop(0.5, `rgba(255,255,255,${A})`); g.addColorStop(0.7, `rgba(255,236,160,${A * 0.8})`); g.addColorStop(1, 'rgba(255,214,110,0)');
        x.fillStyle = g; x.fillRect(o.x - w, top, w * 2, 520);
        const eg = x.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 1.7); eg.addColorStop(0, `rgba(255,255,255,${A})`); eg.addColorStop(0.5, `rgba(255,226,130,${A * 0.6})`); eg.addColorStop(1, 'rgba(255,200,90,0)'); x.fillStyle = eg; x.beginPath(); x.ellipse(o.x, o.y, o.r * 1.7, o.r * 0.9, 0, 0, TAU); x.fill();
        for (let k = 0; k < 6; k++) { const p = (f * 1.5 + k / 6) % 1; x.strokeStyle = `rgba(255,255,255,${A * (1 - p)})`; x.lineWidth = 1.5; x.beginPath(); x.ellipse(o.x, o.y - p * 380, w * 0.8, w * 0.3, 0, 0, TAU); x.stroke(); } break;
      }
      case 'blinkTrail': {
        x.lineCap = 'round'; const g = x.createLinearGradient(o.x, o.y, o.x1, o.y1); g.addColorStop(0, `rgba(30,8,44,0)`); g.addColorStop(1, `rgba(40,10,56,${A * 0.8})`); x.strokeStyle = g; x.lineWidth = 26 * A + 4; x.beginPath(); x.moveTo(o.x, o.y - 30); x.lineTo(o.x1, o.y1 - 30); x.stroke();
        x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(214,84,180,${A * 0.9})`; x.lineWidth = 2.5; x.setLineDash([14, 10]); x.beginPath(); x.moveTo(o.x, o.y - 30); x.lineTo(o.x1, o.y1 - 30); x.stroke(); x.setLineDash([]);
        // silueta que queda atrás
        x.globalAlpha = A * 0.7; x.fillStyle = '#12061a'; x.beginPath(); x.ellipse(o.x, o.y - 40, 15, 40, 0, 0, TAU); x.fill(); break;
      }
      case 'star4': x.globalCompositeOperation = 'lighter'; star4(x, o.x, o.y, (o.r || 30) * (0.4 + 0.6 * Math.sin(Math.min(1, f * 2) * Math.PI / 2)) * (0.4 + A * 0.6), `rgba(255,252,225,${A})`, o.t * 5); break;
    }
  }
  // muro de cristal (Jaula de cristal)
  function crystal(x, G, i) {
    const T = G.T, px = Terrain.cx(T, i), py = Terrain.cy(T, i), a = Math.min(1, T.wallT[i] / 0.4), t = G.time;
    x.save(); x.globalAlpha = a; x.fillStyle = 'rgba(10,8,20,0.35)'; x.beginPath(); x.ellipse(px, py + 12, 21, 7, 0, 0, TAU); x.fill();
    for (const [ox, h, w, tilt] of [[-10, 40, 9, -0.16], [9, 46, 10, 0.12], [0, 58, 11, 0.02]]) {
      x.save(); x.translate(px + ox, py + 14); x.rotate(tilt);
      const g = x.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.35, 'rgba(255,236,170,0.75)'); g.addColorStop(1, 'rgba(210,150,60,0.75)');
      x.fillStyle = g; x.beginPath(); x.moveTo(-w, 0); x.lineTo(-w, -h + 10); x.lineTo(0, -h); x.lineTo(w, -h + 10); x.lineTo(w, 0); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = 1; x.stroke(); x.beginPath(); x.moveTo(-w * 0.2, 0); x.lineTo(-w * 0.2, -h + 9); x.lineTo(0, -h); x.stroke();
      x.restore();
    }
    x.globalCompositeOperation = 'lighter'; glow(x, px, py - 18, 40, `rgba(255,230,150,${0.35 + 0.15 * Math.sin(t * 4 + i)})`);
    if (((t * 1.3 + i * 0.37) % 2) < 0.15) star4(x, px + ((i * 13) % 17) - 8, py - 30 - ((i * 7) % 20), 7, '#ffffff', t * 3);
    x.restore();
  }
  // luces dinámicas de lo nuevo
  function lights(G, add) {
    for (const s of G.spells) {
      if (s.t === 'judgment') add(s.x, s.y, s.r * 2, [255, 236, 170], 0.4 + (1 - s.delay / s.S.delay) * 0.6, 0.3);
      else if (s.t === 'nova') add(s.x, s.y - 20, 180, [255, 220, 120], 1, 0.3);
      else if (s.t === 'wisp') add(s.x, s.y - 30, 70, [170, 110, 255], 0.7, 0.3);
      else if (s.t === 'bog' || s.t === 'thorns') add(s.x, s.y, s.r * 0.9, [210, 70, 175], 0.3, 0.1);
    }
    for (const u of G.units) if (u.alive && u.obj === 'sunflower') add(u.x, u.y - 40, 170, [255, 226, 130], 0.95, 0.3);
    for (let i = 0; i < G.T.n; i++) if (G.T.crys[i] && G.T.wall[i] > 0) add(Terrain.cx(G.T, i), Terrain.cy(G.T, i) - 20, 90, [255, 236, 170], 0.7, 0.3);
    for (const o of FX.shapes) { const f = 1 - o.t / o.life; if (o.type === 'sunray') { for (const [ax, ay, bx, by] of o.segs) for (let k = 0; k <= 3; k++) add(lerp(ax, bx, k / 3), lerp(ay, by, k / 3), 120, [255, 236, 170], f, 0.3); } else if (o.type === 'nova' || o.type === 'pillar') add(o.x, o.y, o.r * 2.6, [255, 236, 170], f, 0.15); }
  }
  return { under, items, over, proj, lob, shape, crystal, lights, wisp, star4 };
})();
