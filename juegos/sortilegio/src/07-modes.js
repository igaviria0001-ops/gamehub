/* =========================================================================
   MODOS — cada modo dice cómo empieza, qué pasa en cada paso y cómo se gana.
   · Duelo: rondas de 75 s; a los 45 s la Bruma cierra el borde.
   · Tejo encantado: meterle el tejo al rival a punta de hechizos (3 o 2:30).
   · Cacería de espantos: cada espanto cae solo con su contrario (2:00).
   · El Altar: sumar solo dentro del círculo sagrado, que cambia de lugar (100).
   · Práctica libre: sin rondas.
   En Tejo, Cacería y Altar, al caído lo devuelven a su lado en 3 s.
   ========================================================================= */
const MODES = {
  duel: { name: 'Duelo', short: 'Al mejor de 5 rondas: tumba al otro mago', icon: 'duel' },
  tejo: { name: 'Tejo encantado', short: 'Mete el tejo en el bocín del rival a punta de hechizos', icon: 'tejo' },
  hunt: { name: 'Cacería de espantos', short: 'Cada espanto cae solo con su contrario: cambia de manos', icon: 'hunt' },
  altar: { name: 'El Altar', short: 'Suma quien esté solo dentro del círculo sagrado', icon: 'altar' },
  copa: { name: 'Copa del Páramo', short: 'Cinco pruebas al azar', icon: 'copa' },
  free: { name: 'Práctica libre', short: 'Prueba hechizos sin presión', icon: 'free' },
  school: { name: 'Escuela de magia', short: 'Lecciones cortas', icon: 'school' },
};
const MODE_ORDER = ['duel', 'tejo', 'hunt', 'altar', 'copa'];
const Modes = (() => {
  const ROUND_T = 75, MIST_T = 45, TEJO_T = 150, HUNT_T = 120, ALTAR_GOAL = 100;
  const rounds = mode => mode === 'duel';
  function setup(G) {
    G.roundT = 0; G.ring = null; G.goals = null; G.score = [0, 0]; G.runes = []; G.runeT = 9; G.respawn = [0, 0]; G.tejo = null; G.altar = null; G.huntN = 0;
    const T = G.T, W = T.W, H = T.H;
    if (G.mode === 'tejo') {
      G.goals = [{ x: 105, y: H / 2, r: 62 }, { x: W - 105, y: H / 2, r: 62 }];
      G.sources = G.sources.filter(s => hypot(s.x - W / 2, s.y - H / 2) > 120);
      for (const g of G.goals) Terrain.forCircle(T, g.x, g.y, 90, i => { T.base[i] = TT.STONE; T.wall[i] = 0; });
      Terrain.forCircle(T, W / 2, H / 2, 60, i => { if (T.base[i] === TT.ROCK || T.base[i] === TT.BUSH) T.base[i] = TT.STONE; });
      newTejo(G); G.mages[0].x = 240; G.mages[1].x = W - 240; G.mages.forEach(m => { m.y = H / 2; m.spawn = [m.x, m.y]; });
      T.ver++;
    }
    if (G.mode === 'hunt') { for (let k = 0; k < 5; k++) spawnSpirit(G); G.huntN = 0; }
    if (G.mode === 'altar') {
      G.altarSpots = [[W / 2, H / 2], [W * 0.3, H * 0.3], [W * 0.7, H * 0.7], [W * 0.3, H * 0.72], [W * 0.7, H * 0.28]];
      G.altar = { x: W / 2, y: H / 2, r: 108, t: 20, k: 0, owner: -1 };
    }
  }
  /* ---------- runas de poder: aparecen en el eje del medio (igual de lejos para los dos) ---------- */
  const RUNES = {
    prisa: { name: 'Prisa', color: '#9ff0ff', text: 'esperas a la mitad y más rápido' },
    escudo: { name: 'Escudo de luz', color: '#ffe9a0', text: 'absorbe 30 de daño' },
    embrujo: { name: 'Embrujo', color: '#ffb0f0', text: '+45 de Embrujo' },
    vida: { name: 'Vida', color: '#9fe07a', text: '+25' },
  };
  function runes(G, dt) {
    const W = G.T.W, H = G.T.H;
    if (!G.runes.length) { G.runeT -= dt; if (G.runeT <= 0) { const ks = Object.keys(RUNES), k = ks[G.rng.int(ks.length)], spots = [[W / 2, H / 2], [W / 2, H * 0.22], [W / 2, H * 0.78]]; let [x, y] = spots[G.rng.int(3)]; [x, y] = Arena.safeNear(G, x, y); if (G.mode === 'tejo' && Math.abs(y - H / 2) < 60) y = H * 0.22; G.runes.push({ k, x, y, t: 0 }); G.events.push({ type: 'runeSpawn', x, y }); G.pops.push({ x: 0, y: 0, text: 'Runa de poder: ' + RUNES[k].name, t: 0, color: RUNES[k].color, small: true, screen: true, low: true }); } return; }
    for (const r of G.runes) { r.t += dt; for (const m of G.mages) if (m.alive && hypot(m.x - r.x, m.y - r.y) < 34) { r.taken = m; break; } if (r.taken) { const m = r.taken;
      if (r.k === 'prisa') m.buff.haste = 6; if (r.k === 'escudo') { m.buff.shield = 30; m.buff.shieldT = 10; } if (r.k === 'embrujo') m.gainEmb(G, 45); if (r.k === 'vida') m.heal(G, 25);
      G.events.push({ type: 'rune', x: r.x, y: r.y, who: m.idx, k: r.k }); G.pops.push({ x: r.x, y: r.y - 70, text: RUNES[r.k].name + ': ' + RUNES[r.k].text, t: 0, color: RUNES[r.k].color, small: true }); } }
    G.runes = G.runes.filter(r => !r.taken); if (!G.runes.length && G.runeT <= 0) G.runeT = 13 + G.rng() * 4;
  }
  function drawRunes(G, list) {
    for (const r of G.runes || []) list.push({ y: r.y, draw: x => {
      const R = RUNES[r.k], t = G.time, bob = Math.sin(t * 3) * 4, Y = r.y - 34 + bob, a = Math.min(1, r.t * 3);
      x.save(); x.globalAlpha = a;
      x.fillStyle = 'rgba(8,6,20,0.4)'; x.beginPath(); x.ellipse(r.x, r.y + 2, 18, 7, 0, 0, TAU); x.fill();
      x.strokeStyle = R.color; x.lineWidth = 2; x.globalAlpha = a * (0.5 + 0.5 * Math.sin(t * 4)); x.beginPath(); x.ellipse(r.x, r.y, 30, 13, 0, 0, TAU); x.stroke(); x.globalAlpha = a;
      ArtSpells.glow(x, r.x, Y, 46, R.color + 'aa');
      x.fillStyle = '#3a3448'; x.beginPath(); x.moveTo(r.x, Y - 20); x.lineTo(r.x + 13, Y - 4); x.lineTo(r.x + 9, Y + 16); x.lineTo(r.x - 9, Y + 16); x.lineTo(r.x - 13, Y - 4); x.closePath(); x.fill();
      x.strokeStyle = R.color; x.lineWidth = 2.4; x.beginPath();
      if (r.k === 'prisa') { x.moveTo(r.x - 5, Y - 8); x.lineTo(r.x + 4, Y); x.lineTo(r.x - 5, Y + 8); x.moveTo(r.x, Y - 8); x.lineTo(r.x + 9, Y); x.lineTo(r.x, Y + 8); }
      else if (r.k === 'escudo') { x.moveTo(r.x, Y - 9); x.lineTo(r.x + 7, Y - 5); x.lineTo(r.x + 5, Y + 6); x.lineTo(r.x, Y + 10); x.lineTo(r.x - 5, Y + 6); x.lineTo(r.x - 7, Y - 5); x.closePath(); }
      else if (r.k === 'embrujo') { for (let a2 = 0; a2 < 4 * Math.PI; a2 += 0.3) { const rr = 1 + a2 * 0.75; x.lineTo(r.x + Math.cos(a2) * rr, Y + Math.sin(a2) * rr); } }
      else { x.moveTo(r.x, Y - 9); x.lineTo(r.x, Y + 9); x.moveTo(r.x - 8, Y); x.lineTo(r.x + 8, Y); }
      x.stroke(); x.restore(); } });
  }
  function newTejo(G) { G.tejo = pushable(G, G.T.W / 2, G.T.H / 2, 'tejo'); }
  // algo que se empuja a punta de hechizos (el tejo, las piedras de la campaña)
  function pushable(G, x, y, obj, r = 20) {
    const t = new Unit(x, y, r, -2); Object.assign(t, { obj, pushable: true, untargetable: obj !== 'tejo', hp: 1e9, maxHp: 1e9, idx: -1, keep: true, knockMul: obj === 'tejo' ? 1 : 0.55, spin: 0 });
    t.hurt = function (G, dmg, src) { this.flash = 0.1; return 0; };
    t.update = function (G, dt) {
      this.tickStatus(G, dt); const f = Math.exp(-0.9 * dt); this.vx *= f; this.vy *= f;
      const sp = hypot(this.vx, this.vy); if (sp > 1300) { this.vx *= 1300 / sp; this.vy *= 1300 / sp; }
      const T = G.T;
      if (this.obj === 'tejo') tejoStep(G, this, dt);
      else { const nx = this.x + this.vx * dt, ny = this.y + this.vy * dt;
        if (Terrain.solidAt(T, nx, this.y) || nx < this.r || nx > T.W - this.r) { this.vx *= -0.75; G.events.push({ type: 'tejoBounce', x: this.x, y: this.y }); } else this.x = nx;
        if (Terrain.solidAt(T, this.x, ny) || ny < this.r || ny > T.H - this.r) { this.vy *= -0.75; G.events.push({ type: 'tejoBounce', x: this.x, y: this.y }); } else this.y = ny; }
      const ci = Terrain.idx(T, this.x, this.y); if (ci >= 0 && T.base[ci] === TT.DEEP && T.ice[ci] <= 0) { const k = Math.exp(-1.6 * dt); this.vx *= k; this.vy *= k; if (G.current) { this.vx += G.current.x * dt * 2; this.vy += G.current.y * dt * 2; } }
      this.spin += sp * dt * 0.02;
      for (const m of G.mages) if (m.alive) { const dx = this.x - m.x, dy = this.y - m.y, d = hypot(dx, dy), mn = this.r + m.r; if (d < mn && d > 0.01) { const p = mn - d; this.x += dx / d * p * (this.obj === 'tejo' ? 1 : 0.5); this.y += dy / d * p * (this.obj === 'tejo' ? 1 : 0.5); if (this.obj !== 'tejo') { m.x -= dx / d * p * 0.5; m.y -= dy / d * p * 0.5; } const rv = (this.vx - m.vx) * dx / d + (this.vy - m.vy) * dy / d; if (rv < 0) { this.vx -= rv * dx / d * 1.2; this.vy -= rv * dy / d * 1.2; } } }
    };
    G.units.push(t); return t;
  }
  // 2.0 — el tejo rebota como círculo de verdad (nunca queda medio metido en una roca), las bandas lo
  // devuelven suavemente a la cancha cuando va lento, y si igual se queda quieto 4 s, se zafa solo
  function tejoStep(G, t, dt) {
    const T = G.T, sp = hypot(t.vx, t.vy), steps = Math.max(1, Math.ceil(sp * dt / 8));
    for (let k = 0; k < steps; k++) {
      t.x += t.vx * dt / steps; t.y += t.vy * dt / steps; let hitN = null;
      const c0 = Math.floor((t.x - t.r) / CELL), c1 = Math.floor((t.x + t.r) / CELL), r0 = Math.floor((t.y - t.r) / CELL), r1 = Math.floor((t.y + t.r) / CELL);
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const i = c < 0 || r < 0 || c >= T.cols || r >= T.rows ? -1 : r * T.cols + c; if (!Terrain.solid(T, i)) continue;
        const qx = clamp(t.x, c * CELL, c * CELL + CELL), qy = clamp(t.y, r * CELL, r * CELL + CELL); let dx = t.x - qx, dy = t.y - qy, d = hypot(dx, dy);
        if (d >= t.r) continue; if (d < 0.01) { dx = t.x - (c * CELL + CELL / 2); dy = t.y - (r * CELL + CELL / 2); d = hypot(dx, dy) || 1; }
        const nx = dx / d, ny = dy / d; t.x += nx * (t.r - Math.min(d, t.r)); t.y += ny * (t.r - Math.min(d, t.r)); hitN = [nx, ny];
        if (i >= 0 && T.wall[i] > 0 && sp > 500) Terrain.hitWall(G, i, sp * 0.02);
      }
      for (const [bx, by, inside] of [[t.r, null, t.x < t.r], [T.W - t.r, null, t.x > T.W - t.r], [null, t.r, t.y < t.r], [null, T.H - t.r, t.y > T.H - t.r]]) if (inside) { if (bx != null) { t.x = bx; hitN = [bx < T.W / 2 ? 1 : -1, 0]; } else { t.y = by; hitN = [0, by < T.H / 2 ? 1 : -1]; } }
      if (hitN) { const vn = t.vx * hitN[0] + t.vy * hitN[1]; if (vn < 0) { t.vx -= 1.8 * vn * hitN[0]; t.vy -= 1.8 * vn * hitN[1]; if (-vn > 60) G.events.push({ type: 'tejoBounce', x: t.x, y: t.y }); } }
    }
    // bandas: cerca de rocas, matas o el borde, si va lento, una corriente suave lo saca hacia la cancha
    let ax = 0, ay = 0, nearS = 0;
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, ca = Math.cos(a), sa = Math.sin(a); for (const d of [34, 62]) { const px = t.x + ca * d, py = t.y + sa * d; if (px < 4 || py < 4 || px > T.W - 4 || py > T.H - 4 || Terrain.solidAt(T, px, py)) { const w = d === 34 ? 1.6 : 1; ax -= ca * w; ay -= sa * w; nearS += w; break; } } }
    if (nearS > 0 && sp < 420) { const l = hypot(ax, ay); if (l > 0.3) { const f = 340 * Math.min(1.6, nearS / 3) * (1 - sp / 420); t.vx += ax / l * f * dt; t.vy += ay / l * f * dt; } else { const cx = T.W / 2 - t.x, cy = T.H / 2 - t.y, cl = hypot(cx, cy) || 1; t.vx += cx / cl * 220 * dt; t.vy += cy / cl * 220 * dt; } }
    // ¿se quedó quieto mucho rato? se zafa con un saltico mágico hacia la cancha
    t.hist = t.hist || []; t.histT = (t.histT || 0) + dt;
    if (t.histT >= 0.25) { t.histT = 0; t.hist.push([t.x, t.y]); if (t.hist.length > 16) t.hist.shift(); }
    if (t.hist.length >= 16 && !(G.tejoWait > 0)) { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of t.hist) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      if (x1 - x0 < 55 && y1 - y0 < 55 && (nearS > 0 || Terrain.isWater(T, Terrain.idx(T, t.x, t.y)))) { const cx = T.W / 2 - t.x, cy = T.H / 2 - t.y, cl = hypot(cx, cy) || 1, [sx, sy] = Arena.safeNear(G, t.x + cx / cl * 170, t.y + cy / cl * 170);
        G.fx.push({ type: 'flashRing', x: t.x, y: t.y, el: 'wind', r: 70 }); t.x = sx; t.y = sy; t.vx = cx / cl * 120; t.vy = cy / cl * 120; t.hist = []; G.fx.push({ type: 'flashRing', x: sx, y: sy, el: 'light', r: 80 }); G.events.push({ type: 'tejoRescue', x: sx, y: sy }); G.pops.push({ x: sx, y: sy - 60, text: '¡El tejo se zafa!', t: 0, color: '#ffe9a0', small: true }); } }
  }
  function spawnSpirit(G) {
    const golden = G.huntN > 0 && G.huntN % 7 === 6, kind = golden ? 'dorado' : HUNT_KINDS[G.rng.int(HUNT_KINDS.length)];
    for (let tries = 0; tries < 40; tries++) {
      const x = 80 + G.rng() * (G.T.W - 160), y = 80 + G.rng() * (G.T.H - 160), i = Terrain.idx(G.T, x, y);
      if (i < 0 || Terrain.solid(G.T, i) || G.T.base[i] === TT.DEEP || Terrain.isLava(G.T, i)) continue;
      if (G.mages.some(m => hypot(m.x - x, m.y - y) < 220)) continue;
      const c = new Creature(G, kind, x, y); G.units.push(c); G.huntN++; return c;
    }
  }
  function onCreatureDown(G, e) {
    if (G.mode === 'hunt' && e.by >= 0 && G.state === 'play') { G.score[e.by] += e.pts; G.pops.push({ x: e.x, y: e.y - 50, text: '+' + e.pts, t: 0, color: PLAYER_COLORS[e.by].main, big: e.pts > 1 }); }
    if (G.mode === 'hunt') G.huntWait = (G.huntWait || 0) + 1;
  }
  function update(G, dt) {
    if (G.state !== 'play') return;
    if (G.mode === 'camp') return Camp.update(G, dt);
    if (G.mode === 'school') { G.roundT += dt; for (const m of G.mages) if (!m.alive && m.idx === 0) Game.revive(m); return Progress.schoolUpdate(G, dt); }
    G.roundT += dt;
    const W = G.T.W, H = G.T.H;
    if (G.mode === 'duel' || G.mode === 'tejo' || G.mode === 'altar') runes(G, dt);
    if (G.mode === 'duel') {
      const full = hypot(W, H) / 2 + 40;
      if (G.roundT > MIST_T) {
        const f = clamp((G.roundT - MIST_T) / (ROUND_T - MIST_T), 0, 1);
        G.ring = { x: W / 2, y: H / 2, r: lerp(full, 230, smooth(f)), f };
        if (!G.mistWarned) { G.mistWarned = true; G.events.push({ type: 'mist' }); }
      }
      if (G.roundT >= ROUND_T) { const [a, b] = G.mages, fa = a.hp / a.maxHp, fb = b.hp / b.maxHp; Game.endRound(Math.abs(fa - fb) < 0.01 ? -1 : fa > fb ? 0 : 1, 'time'); }
      return;
    }
    // reaparecer a los 3 s
    for (const m of G.mages) {
      if (m.alive || G.mode === 'free') continue;
      G.respawn[m.idx] += dt;
      if (G.respawn[m.idx] >= 3) { G.respawn[m.idx] = 0; Game.revive(m); m.iframes = 1.5; G.events.push({ type: 'respawn', who: m.idx }); }
    }
    if (G.mode === 'tejo') {
      const t = G.tejo;
      for (let k = 0; k < 2; k++) { const g = G.goals[k]; if (hypot(t.x - g.x, t.y - g.y) < g.r) { const scorer = 1 - k; G.score[scorer]++; G.events.push({ type: 'goal', who: scorer, x: g.x, y: g.y }); G.fx.push({ type: 'boom', x: g.x, y: g.y, r: 120, el: 'fire' }); t.x = W / 2; t.y = H / 2; t.vx = t.vy = 0; G.tejoWait = 1.6; G.pops.push({ x: g.x, y: g.y - 60, text: '¡MECHA!', t: 0, color: PLAYER_COLORS[scorer].main, big: true, gran: true }); break; } }
      if (G.tejoWait > 0) { G.tejoWait -= dt; t.vx = t.vy = 0; t.x = W / 2; t.y = H / 2; }
      const need = 3; if (G.score[0] >= need || G.score[1] >= need) return Game.endRound(G.score[0] > G.score[1] ? 0 : 1, 'score');
      if (G.roundT >= TEJO_T && (G.score[0] !== G.score[1] || G.roundT >= TEJO_T + 60)) return Game.endRound(G.score[0] === G.score[1] ? -1 : G.score[0] > G.score[1] ? 0 : 1, 'time');
    }
    if (G.mode === 'hunt') {
      const alive = G.units.filter(u => u instanceof Creature && u.alive).length;
      if (alive < 5 && G.rng() < dt * 1.5) spawnSpirit(G);
      if (G.roundT >= HUNT_T) return Game.endRound(G.score[0] === G.score[1] ? -1 : G.score[0] > G.score[1] ? 0 : 1, 'time');
    }
    if (G.mode === 'altar') {
      const A = G.altar; A.t -= dt;
      if (A.t <= 0) { A.k = (A.k + 1 + G.rng.int(G.altarSpots.length - 1)) % G.altarSpots.length; [A.x, A.y] = G.altarSpots[A.k]; A.t = 20; G.events.push({ type: 'altarMove', x: A.x, y: A.y }); }
      const inside = G.mages.filter(m => m.alive && hypot(m.x - A.x, m.y - A.y) < A.r);
      A.owner = inside.length === 1 ? inside[0].idx : inside.length > 1 ? -2 : -1;
      if (A.owner >= 0) { G.score[A.owner] = Math.min(ALTAR_GOAL, G.score[A.owner] + 3.6 * dt); inside[0].gainEmb(G, 3 * dt); }
      if (G.score[0] >= ALTAR_GOAL || G.score[1] >= ALTAR_GOAL) return Game.endRound(G.score[0] >= ALTAR_GOAL ? 0 : 1, 'score');
      if (G.roundT >= 180) return Game.endRound(G.score[0] === G.score[1] ? -1 : G.score[0] > G.score[1] ? 0 : 1, 'time');
    }
  }
  function onDown(G, m) {
    if (G.mode === 'duel') { const alive = G.mages.filter(x => x.alive); if (alive.length <= 1) Game.endRound(alive.length ? alive[0].idx : -1, 'down'); }
    else if (G.mode === 'camp') { }
    else if (G.mode === 'free') setTimeout(() => { if (G.mode === 'free') Game.revive(m); }, 1200);
    else if (G.mode === 'hunt' && G.state === 'play') { const k = m.idx; if (G.score[k] > 0) { const lost = Math.min(2, G.score[k]); G.score[k] -= lost; G.pops.push({ x: m.x, y: m.y - 60, text: '−' + lost, t: 0, color: '#ff8a8a', big: true }); } }
  }
  // dibujo de lo propio de cada modo (en el suelo)
  function drawUnder(x, G) {
    const t = G.time;
    if (G.mode === 'tejo' && G.goals) for (let k = 0; k < 2; k++) {
      const g = G.goals[k], col = PLAYER_COLORS[k].main;
      x.fillStyle = 'rgba(30,20,10,0.7)'; x.beginPath(); x.ellipse(g.x, g.y, g.r + 16, (g.r + 16) * 0.62, 0, 0, TAU); x.fill();
      x.fillStyle = '#6a4a2a'; x.beginPath(); x.ellipse(g.x, g.y, g.r, g.r * 0.6, 0, 0, TAU); x.fill();
      x.strokeStyle = col; x.lineWidth = 4; x.beginPath(); x.ellipse(g.x, g.y, g.r + 10, (g.r + 10) * 0.62, 0, 0, TAU); x.stroke();
      for (let j = 0; j < 4; j++) { const a = j / 4 * TAU + 0.4; x.fillStyle = '#f2f2f2'; x.beginPath(); x.moveTo(g.x + Math.cos(a) * g.r * 0.55, g.y + Math.sin(a) * g.r * 0.34 - 6); x.lineTo(g.x + Math.cos(a) * g.r * 0.55 + 7, g.y + Math.sin(a) * g.r * 0.34 + 3); x.lineTo(g.x + Math.cos(a) * g.r * 0.55 - 7, g.y + Math.sin(a) * g.r * 0.34 + 3); x.fill(); x.fillStyle = '#e83a2a'; x.fillRect(g.x + Math.cos(a) * g.r * 0.55 - 1.5, g.y + Math.sin(a) * g.r * 0.34 - 3, 3, 3); }
      x.font = fontB(14, 900); x.textAlign = 'center'; x.fillStyle = col; x.fillText(`BOCÍN J${k + 1}`, g.x, g.y + g.r * 0.62 + 30);
    }
    if (G.mode === 'altar' && G.altar) {
      const A = G.altar, col = A.owner >= 0 ? PLAYER_COLORS[A.owner].main : A.owner === -2 ? '#ff8a8a' : '#e8c46e';
      x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = col + '22'; x.beginPath(); x.ellipse(A.x, A.y, A.r, A.r * 0.62, 0, 0, TAU); x.fill(); x.restore();
      x.strokeStyle = col; x.lineWidth = 4; x.setLineDash([14, 10]); x.lineDashOffset = -t * 30; x.beginPath(); x.ellipse(A.x, A.y, A.r, A.r * 0.62, 0, 0, TAU); x.stroke(); x.setLineDash([]);
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; x.fillStyle = '#8a8676'; x.fillRect(A.x + Math.cos(a) * A.r - 5, A.y + Math.sin(a) * A.r * 0.62 - 16, 10, 18); x.fillStyle = col; x.fillRect(A.x + Math.cos(a) * A.r - 3, A.y + Math.sin(a) * A.r * 0.62 - 13, 6, 3); }
      if (A.t < 4) { x.font = fontB(16, 900); x.textAlign = 'center'; x.fillStyle = '#ffe9a0'; x.fillText('se mueve en ' + Math.ceil(A.t), A.x, A.y - A.r * 0.62 - 12); }
    }
  }
  function drawTejo(x, G, u) {
    const t = G.time;
    if (u.obj === 'stone') { x.fillStyle = 'rgba(8,6,20,0.4)'; x.beginPath(); x.ellipse(u.x, u.y + 4, 24, 9, 0, 0, TAU); x.fill(); x.fillStyle = '#6e6a62'; x.beginPath(); x.ellipse(u.x, u.y - 8, 23, 18, 0, 0, TAU); x.fill(); x.fillStyle = '#9a968a'; x.beginPath(); x.ellipse(u.x - 5, u.y - 14, 12, 8, 0, 0, TAU); x.fill(); x.strokeStyle = '#ffd25a'; x.lineWidth = 2; x.beginPath(); x.arc(u.x, u.y - 8, 9, 0, 4.5); x.stroke(); return; }
    x.fillStyle = 'rgba(8,6,20,0.4)'; x.beginPath(); x.ellipse(u.x, u.y + 3, 22, 9, 0, 0, TAU); x.fill();
    x.save(); x.translate(u.x, u.y - 6);
    x.fillStyle = '#4a4440'; x.beginPath(); x.ellipse(0, 4, 21, 12, 0, 0, TAU); x.fill();
    x.fillStyle = '#8a8070'; x.beginPath(); x.ellipse(0, 0, 21, 12, 0, 0, TAU); x.fill();
    x.strokeStyle = '#ffd25a'; x.lineWidth = 2; x.beginPath(); for (let a = 0; a < 4.5 * Math.PI; a += 0.25) { const r = 2 + a * 1.2; x.lineTo(Math.cos(a + u.spin) * r, Math.sin(a + u.spin) * r * 0.55); } x.stroke();
    x.restore();
    ArtSpells.glow(x, u.x, u.y - 6, 40, 'rgba(255,210,100,0.5)');
  }
  return { RUNES, drawRunes, pushable, setup, update, onDown, onCreatureDown, drawUnder, drawTejo, ROUND_T, MIST_T, TEJO_T, HUNT_T, ALTAR_GOAL, rounds };
})();
