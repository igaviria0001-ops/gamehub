/* =========================================================================
   HECHIZOS 2.0 — Luz y Sombra y sus trece fusiones. Spells.cast y
   Spells.update delegan aquí lo que no conocen (por «kind» y por «t»).
   LUZ: rayos que rebotan, reflejos, cristales, juicio.  SOMBRA: maleficio
   (recibe más daño), silencio (no puede lanzar), paso entre sombras, fosa.
   ========================================================================= */
const Spells2 = (() => {
  const hit = (...a) => Spells.hit(...a), add = (...a) => Spells.add(...a), foe = (...a) => Spells.foe(...a);
  const walkable = (T, x, y) => { const i = Terrain.idx(T, x, y); return i >= 0 && !Terrain.solid(T, i) && T.base[i] !== TT.CHASM; };
  // rayo de luz: avanza hasta topar roca o muro y rebota como en un espejo
  function trace(G, x0, y0, ang, len, bounces) {
    const T = G.T, segs = []; let x = x0, y = y0, dx = Math.cos(ang), dy = Math.sin(ang), left = len, sx = x, sy = y;
    while (left > 0) {
      const st = Math.min(8, left), nx = x + dx * st, ny = y + dy * st;
      if (nx < 4 || ny < 4 || nx > T.W - 4 || ny > T.H - 4 || Terrain.solidAt(T, nx, ny)) {
        segs.push([sx, sy, x, y]);
        if (bounces-- <= 0) return segs;
        const hx = nx < 4 || nx > T.W - 4 || Terrain.solidAt(T, nx, y), hy = ny < 4 || ny > T.H - 4 || Terrain.solidAt(T, x, ny);
        if (hx || !hy) dx = -dx; if (hy || !hx) dy = -dy; sx = x; sy = y; left -= st; continue;
      }
      x = nx; y = ny; left -= st;
    }
    segs.push([sx, sy, x, y]); return segs;
  }
  function rayHit(G, B, segs, w, dmg, o, seen, max = 1) {
    for (const u of G.units) {
      if (!foe(B, u)) continue; const n = seen.get(u) || 0; if (n >= max) continue;
      for (const [ax, ay, bx, by] of segs) if (Spells.segDist(u.x, u.y - 14, ax, ay - 14, bx, by - 14) < w / 2 + u.r) {
        seen.set(u, n + 1); u.st.hidden = 0; hit(G, B, u, dmg * (o.wetMul && u.st.wet > 0 ? o.wetMul : 1), Object.assign({ kx: bx - ax, ky: by - ay }, o)); break;
      }
    }
  }
  const aimOf = (G, m, range, speed = 0) => m.aim(G, range, speed);
  /* ---------- lanzar ---------- */
  function cast(G, m, S, el, o, B) {
    const P = B.power, Z = B.size, k = S.kind, T = G.T, L = B.gran ? 1.3 : 1;
    if (k === 'sunray') {
      const a = aimOf(G, m, S.len), segs = trace(G, m.x, m.y, a.ang, S.len * Z, S.bounces || 0);
      rayHit(G, Object.assign(B, { x: m.x, y: m.y, id: -1 }), segs, S.w * Z, S.dmg * P, { el: 'light', dazzle: S.dazzle, big: true, knock: 160 }, new Map());
      G.fx.push({ type: 'sunray', segs, w: S.w * Z, el: 'light' }); G.events.push({ type: 'ray', x: m.x, y: m.y }); G.events.push({ type: 'lightLine', segs });
    } else if (k === 'prism') {
      const a = aimOf(G, m, S.len), seen = new Map(), n = S.n + (B.gran ? 2 : 0); Object.assign(B, { x: m.x, y: m.y, id: -1 });
      for (let j = 0; j < n; j++) { const off = (j - (n - 1) / 2) * S.spread, segs = trace(G, m.x, m.y, a.ang + off, S.len * Z, 0); rayHit(G, B, segs, S.w * Z, S.dmg * P, { el: 'light', dazzle: S.dazzle, wetMul: 1.5 }, seen, 2); G.fx.push({ type: 'sunray', segs, w: S.w * Z, el: 'light', hue: j / Math.max(1, n - 1) }); G.events.push({ type: 'lightLine', segs }); }
      G.events.push({ type: 'ray', x: m.x, y: m.y });
    } else if (k === 'blink') {
      if (!m.isMage) { add(G, Object.assign(B, { t: 'proj', S: SPELLS.shadow[0], el: 'shadow', x: m.x, y: m.y, vx: Math.cos(m.face) * 560, vy: Math.sin(m.face) * 560, r: 13, life: 1, dmg: 7 * P, big: true })); return; }
      const a = aimOf(G, m, S.range + 120), R = S.range * Z; let tx, ty, tg = a.target && !a.target.spot && a.dist < R + 90 ? a.target : null;
      const dx = Math.cos(a.ang), dy = Math.sin(a.ang);
      if (tg) { tx = tg.x + dx * (tg.r + 36); ty = tg.y + dy * (tg.r + 36); } else { tx = m.x + dx * R; ty = m.y + dy * R; }
      let n = 0; while (!walkable(T, tx, ty) && n++ < 24) { tx -= dx * 16; ty -= dy * 16; }
      if (!walkable(T, tx, ty)) { tx = m.x; ty = m.y; }
      G.fx.push({ type: 'blink', x: m.x, y: m.y, x1: tx, y1: ty }); G.events.push({ type: 'blink', x: tx, y: ty, who: m.idx });
      m.x = tx; m.y = ty; m.vx = m.vy = 0; m.iframes = Math.max(m.iframes, 0.14); m.st.root = 0; if (tg) m.face = Math.atan2(tg.y - ty, tg.x - tx);
      Object.assign(B, { x: tx, y: ty, id: -1 });
      for (const u of G.units) if (foe(B, u) && hypot(u.x - tx, u.y - ty) < S.r * Z + u.r) hit(G, B, u, S.dmg * P, { el: 'shadow', hex: S.hex, big: true, knock: 220, kx: u.x - tx, ky: u.y - ty });
    } else if (k === 'nova') {
      add(G, Object.assign(B, { t: 'nova', S, el: 'light', x: m.x, y: m.y, windup: S.windup, r: S.r * Z, caster: m }));
    } else if (k === 'mirage') {
      const n = S.n + (B.gran ? 1 : 0);
      for (let j = 0; j < n; j++) {
        const off = (j - (n - 1) / 2) * 1.5 + (n % 2 ? 0 : 0), a = m.face + off, d = new Unit(m.x + Math.cos(a) * 26, m.y + Math.sin(a) * 26, 18, m.team);
        Object.assign(d, { obj: 'decoy', idx: -1, by: m.idx, hp: 1, maxHp: 1, life: S.life * L, knockMul: 0.6, dir: a, foolK: G.rng(), flashT: S.flash, cid: m.cid, skin: m.skin || 0, face: a, walk: 0, moving: 150, swap: 0.8 + G.rng() });
        d.update = decoyStep; d.die = decoyDie; G.units.push(d);
      }
      m.st.hidden = Math.max(m.st.hidden, S.hide); G.fx.push({ type: 'flashRing', x: m.x, y: m.y, el: 'light', r: 90 }); G.events.push({ type: 'mirage', x: m.x, y: m.y });
    } else if (k === 'cage' || k === 'bog') {
      const p = Spells.aimPoint(G, m, S.range, S.flight * 0.6);
      add(G, Object.assign(B, { t: 'lob', S, kind: k, el: k === 'cage' ? 'light' : 'shadow', x0: m.x, y0: m.y - 20, x: m.x, y: m.y, z: 0, tx: p.tx, ty: p.ty, T: S.flight, tt: 0 }));
    } else if (k === 'sunflower') {
      const p = Spells.aimPoint(G, m, S.range, 0), t = new Unit(p.tx, p.ty, 18, m.team);
      Object.assign(t, { obj: 'sunflower', untargetable: true, hp: S.hp * P, maxHp: S.hp * P, idx: -1, life: S.life * L, by: m.idx, next: 0.7, dmg: S.dmg * P, reach: S.reach, every: S.every, heal: S.heal * P * (m.tr.healMul || 1), healR: S.healR * Z, el: 'light', knockMul: 0, aim: -Math.PI / 2 });
      t.update = sunflowerStep; G.units.push(t); G.fx.push({ type: 'rise', x: t.x, y: t.y, el: 'plant' });
    } else if (k === 'judgment') {
      const a = aimOf(G, m, S.range), tg = a.target && !a.target.spot && a.dist < S.range * 1.1 ? a.target : null, d = Math.min(S.range, 280);
      add(G, Object.assign(B, { t: 'judgment', S, el: 'light', x: tg ? tg.x : m.x + Math.cos(a.ang) * d, y: tg ? tg.y : m.y + Math.sin(a.ang) * d, tg, delay: S.delay, r: S.r * Z, dmg: S.dmg * P }));
    } else if (k === 'eclipse') {
      const p = Spells.aimPoint(G, m, S.range, 0.3);
      add(G, Object.assign(B, { t: 'eclipse', S, el: 'shadow', x: p.tx, y: p.ty, r: S.r * Z, life: S.life * L, dps: S.dps * P }));
    } else if (k === 'wisps') {
      const n = S.n + (B.gran ? 2 : 0);
      for (let j = 0; j < n; j++) add(G, Object.assign({}, B, { t: 'wisp', S, el: 'shadow', caster: m, x: m.x, y: m.y, ph: j / n * TAU, life: S.life * L, arm: 0.5 + j * 0.12, dmg: S.dmg * P }));
    } else if (k === 'crows') {
      const a = aimOf(G, m, 700), n = S.n + (B.gran ? 3 : 0);
      for (let j = 0; j < n; j++) { const off = (j / Math.max(1, n - 1) - 0.5) * 1.5, sp = S.speed * (0.9 + 0.25 * ((j * 5) % 4) / 3);
        add(G, Object.assign({}, B, { t: 'proj', S, el: 'shadow', crow: true, x: m.x + Math.cos(a.ang + off) * 20, y: m.y + Math.sin(a.ang + off) * 20, vx: Math.cos(a.ang + off) * sp, vy: Math.sin(a.ang + off) * sp, r: S.r, life: S.life + j * 0.05, dmg: S.dmg * P, turn: S.turn, delayHome: 0.2 + j * 0.04, fusion: o.fusion })); }
    } else if (k === 'pit') {
      const p = Spells.aimPoint(G, m, S.range, S.delay * 0.5), cells = [];
      Terrain.forCircle(T, p.tx, p.ty, 46 * Z, i => { const b = T.base[i]; if (!Terrain.solid(T, i) && b !== TT.DEEP && b !== TT.CHASM && b !== TT.LAVA) cells.push(i); });
      add(G, Object.assign(B, { t: 'pit', S, el: 'shadow', x: p.tx, y: p.ty, r: 62 * Z, delay: S.delay, life: S.life * L, cells, open: false, hitSet: new Set() }));
    } else if (k === 'thorns') {
      add(G, Object.assign(B, { t: 'thorns', S, el: 'shadow', x: m.x, y: m.y, r: S.r * Z, life: S.life * L, dmg: S.dmg * P, last: new Map(), grow: 0 }));
    } else if (k === 'blackbolt') {
      const a = aimOf(G, m, S.range), hx = m.x + Math.cos(m.face) * 22, hy = m.y - 20 + Math.sin(m.face) * 12; let x1, y1, tg = null; Object.assign(B, { x: m.x, y: m.y, id: -1 });
      if (a.target && !a.target.spot && a.dist <= S.range * Z + a.target.r) { tg = a.target; x1 = tg.x; y1 = tg.y - 14; } else { x1 = m.x + Math.cos(a.ang) * S.range; y1 = m.y + Math.sin(a.ang) * S.range; }
      G.fx.push({ type: 'zap', x0: hx, y0: hy, x1, y1, el: 'shadow' }); G.events.push({ type: 'thunder', x: x1, y: y1 });
      if (tg) { hit(G, B, tg, S.dmg * P, { el: 'shadow', hex: S.hex, silence: S.silence * L, big: true });
        let n2 = null, bd = S.chain; for (const u of G.units) if (u !== tg && foe(B, u) && !u.untargetable) { const d = hypot(u.x - tg.x, u.y - tg.y); if (d < bd) { bd = d; n2 = u; } }
        if (n2) { hit(G, B, n2, S.dmg * 0.6 * P, { el: 'shadow', hex: S.hex }); G.fx.push({ type: 'zap', x0: tg.x, y0: tg.y - 14, x1: n2.x, y1: n2.y - 14, el: 'shadow' }); } }
    }
  }
  /* ---------- reflejos (Espejismo) y girasol: unidades con vida propia ---------- */
  function decoyStep(G, dt) {
    if (!this.alive) return; this.life -= dt; this.tickStatus(G, dt); if (this.life <= 0 || this.hp <= 0) { if (this.alive) this.die(G, {}); return; }
    this.swap -= dt; if (this.swap <= 0) { this.swap = 0.7 + G.rng() * 0.9; this.dir += (G.rng() - 0.5) * 2.2; }
    const sp = 150; this.vx += (Math.cos(this.dir) * sp - this.vx) * Math.min(1, 10 * dt); this.vy += (Math.sin(this.dir) * sp - this.vy) * Math.min(1, 10 * dt);
    const ox = this.x, oy = this.y; this.x += this.vx * dt; this.y += this.vy * dt; this.collide(G.T);
    const i = Terrain.idx(G.T, this.x, this.y); if (i >= 0 && (G.T.base[i] === TT.CHASM || G.T.base[i] === TT.DEEP)) { this.x = ox; this.y = oy; this.dir += Math.PI; }
    if (hypot(this.x - ox, this.y - oy) < sp * dt * 0.3) this.dir += 1.3;
    this.face = Math.atan2(this.vy, this.vx); this.walk += sp * dt * 0.045; this.moving = sp;
  }
  function decoyDie(G) {
    this.alive = false; G.fx.push({ type: 'flashRing', x: this.x, y: this.y, el: 'light', r: 120 }); G.events.push({ type: 'decoyPop', x: this.x, y: this.y });
    for (const u of G.units) if (u.alive && u.isMage && u.team !== this.team && hypot(u.x - this.x, u.y - this.y) < 130) { const bm = G.mages[this.by]; u.st.blind = Math.max(u.st.blind, this.flashT * (bm && bm.tr.dazzleMul || 1)); }
  }
  function sunflowerStep(G, dt) {
    if (!this.alive) return; this.life -= dt; if (this.life <= 0) { this.alive = false; G.fx.push({ type: 'pop', x: this.x, y: this.y, el: 'plant', r: 20 }); return; }
    for (const u of G.units) if (u.alive && u.team === this.team && !u.obj && hypot(u.x - this.x, u.y - this.y) < this.healR + u.r) { const h = u.heal(G, this.heal * dt); if (h > 0 && u.isMage) u._healT = 0.3; }
    let best = null, bd = this.reach; for (const u of G.units) if (u.alive && u.team !== this.team && !u.obj && u.st.hidden <= 0) { const d = hypot(u.x - this.x, u.y - this.y); if (d < bd) { bd = d; best = u; } }
    if (best) this.aim += clamp(angDiff(this.aim, Math.atan2(best.y - this.y, best.x - this.x)), -3 * dt, 3 * dt);
    this.next -= dt; if (this.next > 0) return;
    if (!best) { this.next = 0.2; return; }
    this.next = this.every; const B = { by: this.by, team: this.team, el: 'light', id: -this.by - 20, x: this.x, y: this.y };
    hit(G, B, best, this.dmg, { el: 'light', dazzle: 0.25 }); G.fx.push({ type: 'sunray', segs: [[this.x, this.y - 40, best.x, best.y - 14]], w: 9, el: 'light', flat: true }); G.events.push({ type: 'ray', x: this.x, y: this.y, small: true });
  }
  /* ---------- paso de tiempo de los hechizos nuevos ---------- */
  function step(G, s, dt) {
    const T = G.T;
    switch (s.t) {
      case 'nova': {
        const m = s.caster; if (m && m.alive !== false) { s.x = m.x; s.y = m.y; }
        s.windup -= dt; if (s.windup > 0) break; s.dead = true; const S = s.S;
        for (const u of G.units) if (foe(s, u) && hypot(u.x - s.x, u.y - s.y) < s.r + u.r) hit(G, s, u, S.dmg * s.power, { el: 'light', burn: S.burn, dazzle: S.dazzle, knock: S.knock, kx: u.x - s.x, ky: u.y - s.y, big: true });
        for (const p of G.spells) if (p.t === 'proj' && !p.dead && p.team !== s.team && hypot(p.x - s.x, p.y - s.y) < s.r) Spells.endProj(G, p, true);
        Terrain.forCircle(T, s.x, s.y, s.r * 0.75, i => { if (hypot(Terrain.cx(T, i) - s.x, Terrain.cy(T, i) - s.y) > 46) Terrain.ignite(G, i, 2, s.by); });
        G.fx.push({ type: 'nova', x: s.x, y: s.y, r: s.r }); G.events.push({ type: 'boom', x: s.x, y: s.y, r: s.r, el: 'light' }); break;
      }
      case 'judgment': {
        s.delay -= dt; if (s.tg && s.tg.alive && s.delay > s.S.lockAt && !(s.tg.st.hidden > 0)) { s.x = s.tg.x; s.y = s.tg.y; }
        if (s.delay > 0) break; s.dead = true;
        for (const u of G.units) if (foe(s, u) && hypot(u.x - s.x, u.y - s.y) < s.r + u.r) hit(G, s, u, s.dmg, { el: 'light', stun: s.S.stun, dazzle: 0.5, big: true });
        Terrain.forCircle(T, s.x, s.y, s.r * 0.6, i => Terrain.hitWall(G, i, 60));
        G.fx.push({ type: 'pillar', x: s.x, y: s.y, r: s.r }); G.events.push({ type: 'thunder', x: s.x, y: s.y, big: true }); break;
      }
      case 'eclipse': {
        for (const u of G.units) { if (u.obj || !u.alive) continue; const d = hypot(u.x - s.x, u.y - s.y); if (d > s.r) continue;
          if (foe(s, u)) { if (!(u.imm && u.imm.silence > 0) || u.st.silence > 0) u.st.silence = Math.max(u.st.silence, 0.25); hit(G, s, u, s.dps * dt, { el: 'shadow', tick: true }); u.lastSpell = null; } else u.st.hidden = Math.max(u.st.hidden, 0.2); }
        s.life -= dt; if (s.life <= 0) s.dead = true; break;
      }
      case 'wisp': {
        const m = s.caster; s.life -= dt; if (!m || m.alive === false || s.life <= 0) { s.dead = true; G.fx.push({ type: 'pop', x: s.x, y: s.y, el: 'shadow', r: 8 }); break; }
        s.ph += dt * 2.6; s.x = m.x + Math.cos(s.ph) * 46; s.y = m.y + Math.sin(s.ph) * 26; if (s.arm > 0) { s.arm -= dt; break; }
        let best = null, bd = s.S.trig; for (const u of G.units) if (foe(s, u) && !u.untargetable && !u.obj && u.st.hidden <= 0) { const d = hypot(u.x - m.x, u.y - m.y); if (d < bd) { bd = d; best = u; } }
        if (best) { const a = Math.atan2(best.y - s.y, best.x - s.x), S = s.S;
          Object.assign(s, { t: 'proj', S: { dmg: S.dmg, speed: S.speed, r: 9, life: 1.5 }, wisp: true, vx: Math.cos(a) * S.speed, vy: Math.sin(a) * S.speed, r: 9, life: 1.5, turn: S.turn, delayHome: 0, burnT: S.burn, age: 0 });
          for (const o of G.spells) if (o.t === 'wisp' && o.caster === m && o !== s) o.arm = Math.max(o.arm, 0.3); G.events.push({ type: 'wispGo', x: s.x, y: s.y }); }
        break;
      }
      case 'bog': {
        const m = G.mages[s.by]; let dr = 0;
        for (const u of G.units) if (foe(s, u) && !u.obj && hypot(u.x - s.x, u.y - s.y) < s.r) { u.slow(0.25, s.S.slow); dr += hit(G, s, u, s.dps * dt, { el: 'shadow', tick: true }) || 0; u.lastSpell = null; }
        if (dr > 0 && m && m.alive) { m.heal(G, dr * s.S.drain * (m.tr.healMul || 1)); m._healT = 0.3; if (G.frame % 14 === 0) G.fx.push({ type: 'drain', x0: s.x, y0: s.y, x1: m.x, y1: m.y - 30 }); }
        s.life -= dt; if (s.life <= 0) s.dead = true; break;
      }
      case 'pit': {
        if (!s.open) { s.delay -= dt; if (s.delay <= 0) { s.open = true; for (const i of s.cells) { T.pit[i] = s.life; T.pitO[i] = s.by; T.fire[i] = 0; T.vine[i] = 0; } G.events.push({ type: 'quake', x: s.x, y: s.y }); G.fx.push({ type: 'pitOpen', x: s.x, y: s.y, r: s.r }); } break; }
        for (const u of G.units) { if (!foe(s, u) || u.isMage || u.obj || s.hitSet.has(u)) continue; const i = Terrain.idx(T, u.x, u.y); if (i >= 0 && T.pit[i] > 0) { s.hitSet.add(u); hit(G, s, u, u.boss ? 14 : 22, { el: 'shadow', stun: 0.9, big: true }); } }
        s.life -= dt; if (s.life <= 0) s.dead = true; break;
      }
      case 'thorns': {
        s.grow = Math.min(1, s.grow + dt * 4);
        for (const u of G.units) { if (!foe(s, u) || u.obj) continue; const d = hypot(u.x - s.x, u.y - s.y); if (Math.abs(d - s.r) > 15 + u.r) continue; const l = s.last.get(u) || -9; if (G.time - l < 1.2) continue; s.last.set(u, G.time); hit(G, s, u, s.dmg, { el: 'plant', root: s.S.root, hex: 1.5, big: true, unavoid: true }); G.fx.push({ type: 'snare', x: u.x, y: u.y }); }
        s.life -= dt; if (s.life <= 0) s.dead = true; break;
      }
    }
  }
  // lo que cae del cielo: jaula de cristal y marea negra
  function land(G, s) {
    const T = G.T, S = s.S;
    if (s.kind === 'cage') {
      for (const u of G.units) if (foe(s, u) && !u.obj && hypot(u.x - s.tx, u.y - s.ty) < 70 + u.r) hit(G, s, u, S.dmg * s.power, { el: 'light', dazzle: 0.4 });
      const c0 = Math.floor(s.tx / CELL), r0 = Math.floor(s.ty / CELL); let made = 0;
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
        if (Math.round(hypot(dc, dr)) !== 2) continue; const c = c0 + dc, r = r0 + dr; if (c < 0 || r < 0 || c >= T.cols || r >= T.rows) continue;
        const i = r * T.cols + c, ccx = Terrain.cx(T, i), ccy = Terrain.cy(T, i);
        if (G.units.some(u => u.alive && Math.abs(u.x - ccx) < CELL / 2 + u.r - 4 && Math.abs(u.y - ccy) < CELL / 2 + u.r - 4)) continue;
        if (Terrain.addWall(G, i, S.hp * s.power, S.life * (s.gran ? 1.3 : 1))) { T.crys[i] = 1; made++; G.fx.push({ type: 'rise', x: ccx, y: ccy, el: 'light' }); }
      }
      G.events.push({ type: 'wall', x: s.tx, y: s.ty, n: made }); G.fx.push({ type: 'flashRing', x: s.tx, y: s.ty, el: 'light', r: 110 });
    } else if (s.kind === 'bog') {
      Spells.add(G, Object.assign({}, s, { t: 'bog', x: s.tx, y: s.ty, r: S.r * s.size, life: S.life * (s.gran ? 1.3 : 1), dps: S.dps * s.power, dead: false }));
      G.fx.push({ type: 'splat', x: s.tx, y: s.ty, r: S.r * s.size, el: 'shadow' });
    }
  }
  return { cast, step, land, trace };
})();
