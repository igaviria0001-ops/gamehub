/* =========================================================================
   MAGOS — movimiento, manos (tocar, cargar, fundir, absorber), esquive,
   estados (quemado, mojado, congelado, enredado, aturdido, lento, ciego,
   escondido), daño, empujones y Embrujo. Las criaturas de la campaña usan
   la misma base (Unit) para recibir hechizos.
   ========================================================================= */
const HOLD_FULL = 0.6, ABSORB_T = 0.42, ABSORB_USES = 3;
class Unit {
  constructor(x, y, r, team) {
    this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.r = r; this.team = team; this.alive = true;
    this.st = { burn: 0, burnO: -1, wet: 0, frozen: 0, root: 0, stun: 0, slow: 0, slowF: 1, chill: 0, blind: 0, hidden: 0, hex: 0, silence: 0 };
    this.flash = 0; this.knockMul = 1; this.fireRes = 1; this.iframes = 0; this.isMage = false; this.lastHitBy = -1; this.hitT = 0;
  }
  get busy() { return this.st.frozen > 0 || this.st.stun > 0; }
  // daño con sus multiplicadores; src = { by (índice de mago o -1), el, dot, kind }
  hurt(G, dmg, src = {}) {
    if (!this.alive || dmg <= 0) return 0;
    if (this.iframes > 0 && !src.dot) return 0;
    if (this.invuln || this.granCharge > 0) return 0; // concentrando el Gran Sortilegio: intocable
    if (src.el === 'fire' || src.el === 'lava') dmg *= this.fireRes;
    if (this.st.frozen > 0 && !src.dot && src.el !== 'water') { dmg *= 1.5; this.st.frozen = 0; G.events.push({ type: 'shatter', x: this.x, y: this.y }); Combos.add(G, src.by, 'rompehielo', this); }
    if (this.dmgMul) dmg *= this.dmgMul;
    // maleficio: el siguiente golpe (no el daño continuo) duele más, y se gasta
    if (this.st.hex > 0 && !src.dot) { dmg *= src.by >= 0 && G.mages[src.by] && G.mages[src.by].tr.hexDmg || HEX_MUL; this.st.hex = 0; G.fx.push({ type: 'flashRing', x: this.x, y: this.y - 20, el: 'shadow', r: 60 }); }
    if (this.buff && this.buff.shield > 0) { const a = Math.min(this.buff.shield, dmg); this.buff.shield -= a; dmg -= a; if (a > 0) G.events.push({ type: 'shieldHit', x: this.x, y: this.y }); if (dmg <= 0) return 0; }
    this.hp -= dmg; if (!src.dot) { this.flash = 0.16; this.hitT = 0.4; }
    if (src.by >= 0 && src.by !== this.idx) this.lastHitBy = src.by;
    const by = src.by >= 0 ? G.mages[src.by] : null;
    if (by && by !== this && by.team !== this.team) { by.stats.dmg += dmg; if (!src.dot) { by.stats.hits++; by.racha = G.time - by.rachaT < 2.4 ? by.racha + 1 : 1; by.rachaT = G.time; if (by.racha >= 3) G.events.push({ type: 'racha', who: by.idx, n: by.racha }); } by.gainEmb(G, dmg * 0.55); }
    if (this.isMage && !src.dot && by && by.team !== this.team) this.racha = 0;
    if (this.isMage) this.stats.taken += dmg;
    G.events.push({ type: 'hurt', x: this.x, y: this.y, dmg, el: src.el, dot: !!src.dot, who: this.idx, unit: this });
    if (this.hp <= 0) { this.hp = 0; this.die(G, src); }
    return dmg;
  }
  die(G, src) { this.alive = false; G.fx.push({ type: 'pop', x: this.x, y: this.y - 20, el: this.el || 'plant', r: 20 }); G.events.push({ type: 'unitDown', x: this.x, y: this.y, unit: this }); }
  heal(G, v) { if (!this.alive) return; const h = Math.min(v, this.maxHp - this.hp); this.hp += h; return h; }
  knock(dx, dy, f) {
    const l = hypot(dx, dy) || 1; f *= this.knockMul * (this.st.root > 0 ? 0.25 : 1) * (this.st.frozen > 0 ? 0.6 : 1);
    this.vx += dx / l * f; this.vy += dy / l * f; this.kt = 0.22;
  }
  burn(G, t, by) {
    if (this.st.wet > 0) { this.st.wet = 0; G.fx.push({ type: 'steam', x: this.x, y: this.y - 20, r: 24 }); return; }
    const m = by >= 0 && G.mages[by] && G.mages[by].tr.burnMul || 1;
    this.st.burn = Math.max(this.st.burn, t * m); this.st.burnO = by;
  }
  soak(G, t) { this.st.wet = Math.max(this.st.wet, t); if (this.st.burn > 0) { this.st.burn = 0; G.fx.push({ type: 'steam', x: this.x, y: this.y - 20, r: 24 }); } }
  freeze(G, t, by) { if (this.imm && this.imm.frozen > 0) t *= 0.4; this.st.frozen = Math.max(this.st.frozen, t); this.st.wet = 0; this.st.burn = 0; this.vx *= 0.2; this.vy *= 0.2; G.events.push({ type: 'freeze', x: this.x, y: this.y }); Combos.add(G, by, 'congelado', this); }
  slow(t, f) { if (t > this.st.slow || f < this.st.slowF) { this.st.slow = Math.max(this.st.slow, t); this.st.slowF = Math.min(this.st.slowF, f); } }
  // tras quedar inmóvil un rato, un instante de resistencia (que no lo encadenen sin fin)
  stun(t) { if (this.imm && this.imm.stun > 0) t *= 0.35; this.st.stun = Math.max(this.st.stun, t); }
  root(t) { if (this.imm && this.imm.root > 0) t *= 0.3; this.st.root = Math.max(this.st.root, t); }
  tickStatus(G, dt) {
    const s = this.st;
    if (s.burn > 0) { s.burn -= dt; this.hurt(G, 3 * dt, { by: s.burnO, el: 'fire', dot: 1 }); }
    if (!this.imm) this.imm = { root: 0, stun: 0, frozen: 0, blind: 0, silence: 0 };
    for (const k of ['root', 'stun', 'frozen', 'blind', 'silence']) { if (this.imm[k] > 0) this.imm[k] -= dt; if (s[k] > 0 && s[k] - dt <= 0) this.imm[k] = k === 'stun' ? 0.6 : k === 'blind' ? 1.6 : k === 'silence' ? 2 : 1.2; }
    for (const k of ['wet', 'frozen', 'root', 'stun', 'chill', 'blind', 'hidden', 'hex', 'silence']) if (s[k] > 0) s[k] = Math.max(0, s[k] - dt);
    if (s.slow > 0) { s.slow -= dt; if (s.slow <= 0) { s.slow = 0; s.slowF = 1; } }
    if (this.flash > 0) this.flash -= dt; if (this.iframes > 0) this.iframes -= dt; if (this.hitT > 0) this.hitT -= dt; if (this.kt > 0) this.kt -= dt;
  }
  // choque con roca, matas y muros (círculo contra cuadritos)
  collide(T) {
    for (let it = 0; it < 2; it++) {
      const c0 = Math.floor((this.x - this.r) / CELL), c1 = Math.floor((this.x + this.r) / CELL), r0 = Math.floor((this.y - this.r) / CELL), r1 = Math.floor((this.y + this.r) / CELL);
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const i = c < 0 || r < 0 || c >= T.cols || r >= T.rows ? -1 : r * T.cols + c;
        if (!Terrain.solid(T, i)) continue;
        const nx = clamp(this.x, c * CELL, c * CELL + CELL), ny = clamp(this.y, r * CELL, r * CELL + CELL);
        let dx = this.x - nx, dy = this.y - ny, d = hypot(dx, dy);
        if (d >= this.r) continue;
        if (d < 0.001) { dx = this.x - (c * CELL + CELL / 2); dy = this.y - (r * CELL + CELL / 2); d = hypot(dx, dy) || 1; this.x += dx / d * this.r; this.y += dy / d * this.r; continue; }
        const push = this.r - d; this.x += dx / d * push; this.y += dy / d * push;
        const vn = (this.vx * dx + this.vy * dy) / d; if (vn < 0) { this.vx -= vn * dx / d; this.vy -= vn * dy / d; }
      }
    }
    this.x = clamp(this.x, this.r, T.W - this.r); this.y = clamp(this.y, this.r, T.H - this.r);
  }
}

class Mage extends Unit {
  constructor(G, idx, cid, x, y, team) {
    super(x, y, 18, team);
    this.isMage = true; this.idx = idx; this.cid = cid; this.C = CHARS[cid]; this.tr = TRAITS[cid] || {};
    this.maxHp = this.C.hp; this.hp = this.maxHp; this.knockMul = this.tr.knockMul || 1; this.fireRes = this.tr.fireRes || 1;
    this.face = idx === 0 ? 0 : Math.PI; this.spawn = [x, y];
    this.hands = this.C.hands.map(el => ({ el, nat: el, uses: 0, cd: 0, hold: -1, deny: 0 }));
    this.fuse = false; this.lock = [false, false]; this.rec = 0; this.prev = { h: [false, false], dash: false };
    this.dashN = this.tr.dashN || 2; this.dash = { t: 0, cd: 0, dx: 0, dy: 0, hit: false, charges: this.dashN, gap: 0, age: 0 }; this.emb = 0; this.embFlash = 0; this.impulse = 0; this.lockOn = null; this.racha = 0; this.rachaT = -9; this.buff = { haste: 0, shield: 0, shieldT: 0 };
    this.walk = 0; this.castT = 0; this.castEl = null; this.moving = 0; this.absorbing = null; this.stillT = 0; this.stats = Mage.newStats();
    this.ctrl = null; // máquina (Bot) o null = persona
    this.combo = {}; // veces que hizo cada combinación esta ronda
  }
  static newStats() { return { dmg: 0, taken: 0, hits: 0, casts: 0, fusions: 0, grazes: 0, combos: 0, absorbs: 0, gran: 0, kills: 0 }; }
  get holding() { return this.hands[0].hold >= 0 || this.hands[1].hold >= 0; }
  get fullAt() { return (this.impulse > 0 ? 0.3 : HOLD_FULL) * (this.tr.chargeMul || 1); }
  get dashMax() { return 1.2 * (this.tr.dashCd || 1); }
  nearestFoe(G, maxD = 950) { let b = null, bd = maxD; for (const u of G.units) { if (!this.canTarget(u)) continue; const d = hypot(u.x - this.x, u.y - this.y); if (d < bd) { bd = d; b = u; } } return b; }
  canTarget(u) { return u && u.alive && u.team !== this.team && !(u.st.hidden > 0) && !u.untargetable && u.obj !== 'turret' && u.obj !== 'stone'; }
  // APUNTADO (personas): se apunta hacia donde uno mira/camina; quieto no se voltea solo hacia
  // el más cercano si ya hay alguien al frente; cargando, señalar con la palanca a otro lo cambia;
  // en el celular, tocar a un enemigo lo marca (pin) unos segundos
  autoFace(G) {
    if (this.pin && this.canTarget(this.pin.u) && G.time < this.pin.until) return this.pin.u;
    let n = 0, near = null, nd = 950, ahead = false;
    for (const u of G.units) { if (!this.canTarget(u)) continue; const dx = u.x - this.x, dy = u.y - this.y, d = hypot(dx, dy); if (d > 950) continue; n++; if (d < nd) { nd = d; near = u; } if (Math.abs(angDiff(this.face, Math.atan2(dy, dx))) < 0.95) ahead = true; }
    return n === 1 || !ahead ? near : null;
  }
  // a quién señala la palanca mientras carga (para cambiar el objetivo fijado)
  pointed(G, ang) {
    let b = null, ba = 0.42;
    for (const u of G.units) { if (!this.canTarget(u) || u === this.lockOn) continue; const dx = u.x - this.x, dy = u.y - this.y, d = hypot(dx, dy); if (d > 1000) continue; const da = Math.abs(angDiff(ang, Math.atan2(dy, dx))) + d / 9000; if (da < ba) { ba = da; b = u; } }
    return b;
  }
  gainEmb(G, v) {
    if (this.emb >= 100) return; const was = this.emb;
    this.emb = Math.min(100, this.emb + v * (G.embMul || 1));
    if (this.emb >= 100 && was < 100) { this.embFlash = 1.2; G.events.push({ type: 'embReady', who: this.idx, x: this.x, y: this.y }); }
  }
  // dirección de tiro con mira automática suave hacia el rival (no a escondidos)
  aim(G, range, speed = 0) {
    let ang = this.face, target = null;
    if (this.st.blind > 0) return { ang: ang + (G.rng() - 0.5) * 0.62, target: null, dist: range };
    let best = 1e9;
    const L = this.lockOn && this.lockOn.alive && this.lockOn.st.hidden <= 0 && (this.holding || this.fuse || this.queue) ? this.lockOn : null;
    const P = !L && this.pin && G.time < this.pin.until && this.canTarget(this.pin.u) ? this.pin.u : null;
    for (const u of G.units) {
      if (!u.alive || u.team === this.team || u.st.hidden > 0 || u.untargetable) continue;
      if ((L && u !== L) || (P && u !== P)) continue;
      const dx = u.x - this.x, dy = u.y - this.y, d = hypot(dx, dy);
      if (d > range * 1.7 + 80 || (G.mist > 0.5 && d > 380)) continue;
      const da = Math.abs(angDiff(this.face, Math.atan2(dy, dx))), lim = L || P ? 9 : d < 170 ? 1.25 : 0.85;
      if (da > lim) continue;
      // el ángulo pesa más que la distancia (gana al que uno señala) y el ya elegido se sostiene un poco
      const score = da * 380 + d * 0.22 - (u === this.pickU ? 70 : 0); if (score < best) { best = score; target = u; }
    }
    if (!target && G.aimSpots) for (const p of G.aimSpots) { const dx = p.x - this.x, dy = p.y - this.y, d = hypot(dx, dy); if (d > range * 1.3 + 40 || d < 30) continue; const da = Math.abs(angDiff(this.face, Math.atan2(dy, dx))); if (da > 0.55) continue; const sc = da * 260 + d * 0.3; if (sc < best) { best = sc; target = p; } }
    if (target) {
      let tx = target.x, ty = target.y;
      if (speed > 0) { const t = hypot(tx - this.x, ty - this.y) / speed * 0.55; tx += target.vx * t; ty += target.vy * t; }
      ang = Math.atan2(ty - this.y, tx - this.x);
      return { ang, target, dist: hypot(target.x - this.x, target.y - this.y), tx, ty };
    }
    return { ang, target: null, dist: range };
  }
  sourceHere(G) {
    for (const s of G.sources) if (s.cd <= 0 && dist2(s.x, s.y, this.x, this.y) < 44 * 44) return s;
    return null;
  }
  update(G, dt) {
    const inp = this.ctrl ? this.ctrl.read(G, this, dt) : Input.read(this.idx);
    const st = this.st, T = G.T;
    this.tickStatus(G, dt);
    if (!this.alive) return;
    if (this.granGlow > 0) this.granGlow -= dt;
    // Gran Sortilegio: se eleva y concentra un instante (intocable) y luego lo suelta
    if (this.granCharge > 0) { this.granCharge -= dt; this.vx *= 0.82; this.vy *= 0.82; this.x += this.vx * dt; this.y += this.vy * dt; if (this.granCharge <= 0) this.releaseGran(G); return; }
    if (this.embFlash > 0) this.embFlash -= dt;
    for (const h of this.hands) { if (h.cd > 0) h.cd = Math.max(0, h.cd - dt); if (h.deny > 0) h.deny -= dt; }
    const hk = this.buff.haste > 0 ? 2 : 1; if (this.buff.haste > 0) { this.buff.haste -= dt; for (const h of this.hands) if (h.cd > 0) h.cd = Math.max(0, h.cd - dt); }
    if (this.buff.shieldT > 0) { this.buff.shieldT -= dt; if (this.buff.shieldT <= 0) this.buff.shield = 0; }
    if (this.rec > 0) this.rec -= dt; if (this.castT > 0) this.castT -= dt; if (this.impulse > 0) this.impulse -= dt; if (this.dash.gap > 0) this.dash.gap -= dt;
    if (this.dash.charges < this.dashN) { this.dash.cd -= dt * hk; if (this.dash.cd <= 0) { this.dash.charges++; this.dash.cd = this.dash.charges < this.dashN ? this.dashMax : 0; } }
    const locked = G.state !== 'play' || this.busy;
    // ---- suelo ----
    const ci = Terrain.idx(T, this.x, this.y);
    let spd = 230 * this.C.speed * (this.buff.haste > 0 ? 1.15 : 1), acc = 22, noDash = false;
    if (ci >= 0) {
      const b = T.base[ci];
      if (T.ice[ci] > 0) acc = this.tr.iceWalk ? 22 : 2.4;
      else if ((b === TT.DEEP) && T.ice[ci] <= 0) { spd *= this.tr.waterSpeed ? 1.0 : 0.56; noDash = true; this.soak(G, 1.5); }
      else if (b === TT.SHALLOW && T.ice[ci] <= 0) { spd *= this.tr.waterSpeed || 0.86; this.soak(G, 1.2); }
      else if (T.wet[ci] > 0) this.soak(G, 0.6);
      if (T.mud[ci] > 0) { spd *= this.tr.waterSpeed ? 0.8 : 0.45; noDash = true; }
      if (T.vine[ci] > 0 && !G.ally(T.vineO[ci], this)) { spd *= 0.5; this.hurt(G, 6 * dt, { by: T.vineO[ci], el: 'plant', dot: 1 }); }
      if (T.fire[ci] > 0 && !G.ally(T.fireO[ci], this)) { this.hurt(G, 6 * dt, { by: T.fireO[ci], el: 'fire', dot: 1 }); this.burn(G, 1.0, T.fireO[ci]); }
      if (T.elec[ci] > 0 && !(this.tr.elecImmune && T.elecO[ci] === this.idx) && !(G.coop && G.ally(T.elecO[ci], this))) { this.hurt(G, 14 * dt, { by: T.elecO[ci], el: 'bolt', dot: 1 }); if (this.st.wet > 0) this.slow(0.2, 0.6); }
      if (Terrain.isLava(T, ci)) this.hurt(G, (T.lava[ci] > 0 ? 10 : 22) * dt, { by: -1, el: 'lava', dot: 1 });
      if (b === TT.GRASS && T.ash[ci] <= 0 && this.tr.grassRegen && this.stillT > 0.5) this.heal(G, this.tr.grassRegen * dt);
      if ((b === TT.CHASM || (T.pit[ci] > 0 && !G.ally(T.pitO[ci], this))) && this.dash.t <= 0) { this.fall(G); return; }
    }
    if (this.tr.lowRegen && this.hp < this.maxHp * 0.4) this.heal(G, this.tr.lowRegen * dt);
    if (this.tr.hideRegen && st.hidden > 0) this.heal(G, this.tr.hideRegen * dt);
    if (G.ring && hypot(this.x - G.ring.x, this.y - G.ring.y) > G.ring.r) this.hurt(G, 8 * dt, { by: -1, el: 'mist', dot: 1 });
    // ---- moverse ----
    let mx = locked ? 0 : inp.mx, my = locked ? 0 : inp.my;
    const ml = hypot(mx, my);
    // hacia dónde mira: cargando, sigue al rival fijado (se puede mover de lado); quieto, voltea solo hacia el rival
    if (!locked) {
      let want = null;
      const charging = this.holding || this.fuse || this.queue;
      // cargando: señalar con la palanca a otro enemigo (un instante) cambia el objetivo fijado
      if (charging && !this.ctrl && this.lockOn && ml > 0.55) {
        const sa = Math.atan2(my, mx), c = Math.abs(angDiff(sa, Math.atan2(this.lockOn.y - this.y, this.lockOn.x - this.x))) > 0.7 ? this.pointed(G, sa) : null;
        if (c && c === this.retC) { this.retT += dt; if (this.retT > 0.11) { this.lockOn = c; this.pickU = c; this.retC = null; G.events.push({ type: 'retarget', who: this.idx, x: c.x, y: c.y }); } }
        else { this.retC = c; this.retT = 0; }
      } else this.retC = null;
      if (inp.aim != null) want = inp.aim;
      else if (charging && this.lockOn && this.lockOn.alive && this.lockOn.st.hidden <= 0) want = Math.atan2(this.lockOn.y - this.y, this.lockOn.x - this.x);
      else if (ml > 0.2) want = Math.atan2(my, mx);
      else if (this.stillT > 0.08 && !charging) { const f = this.ctrl ? this.nearestFoe(G, 900) : this.autoFace(G); if (f) want = Math.atan2(f.y - this.y, f.x - this.x); }
      if (want != null) { if (inp.aim != null || this.ctrl) this.face = want; else this.face += clamp(angDiff(this.face, want), -26 * dt, 26 * dt); }
      if (!this.ctrl && !charging) { const a = this.aim(G, 700); this.pickU = a.target && !a.target.spot ? a.target : null; }
    }
    if (st.root > 0) { mx = 0; my = 0; }
    if (this.fuse) spd *= 0.6; else if (this.holding) spd *= 0.72;
    if (st.chill > 0 && !this.tr.iceWalk) spd *= 0.6;
    if (st.slow > 0) spd *= st.slowF;
    if (this.dash.t > 0) {
      this.dash.t -= dt; const ds = 920 * (noDash ? 0.5 : 1);
      this.vx = this.dash.dx * ds; this.vy = this.dash.dy * ds;
      if (this.tr.dashFire && G.frame % 4 === 0) Terrain.ignite(G, ci, 1.2, this.idx);
      this.dash.age += dt;
      if (!this.dash.hit) for (const u of G.units) if (u.alive && u.team !== this.team && !u.obj && u !== this && hypot(u.x - this.x, u.y - this.y) < u.r + this.r + 6) {
        this.dash.hit = true; const z = this.tr.dashZap || 0;
        u.hurt(G, 5 + z, { by: this.idx, el: z ? 'bolt' : 'wind' }); u.knock(this.dash.dx, this.dash.dy, 420); G.events.push({ type: 'ram', x: u.x, y: u.y, who: this.idx });
        Combos.add(G, this.idx, 'embestida', u);
        if (z) { if (u.st.wet > 0) Combos.add(G, this.idx, 'electrocutado', u); G.fx.push({ type: 'zap', x0: this.x, y0: this.y - 20, x1: u.x, y1: u.y - 20, el: 'bolt' }); }
      }
      if (this.dash.t <= 0) this.impulse = 0.55;
    } else {
      const k = 1 - Math.exp(-(ml < 0.2 && acc > 10 ? 30 : acc) * dt), kk = this.kt > 0 ? k * 0.25 : k;
      this.vx += (mx * spd - this.vx) * kk; this.vy += (my * spd - this.vy) * kk;
    }
    if (G.wind && ci >= 0 && T.base[ci] !== TT.ROCK) { this.vx += G.wind.x * 40 * dt; this.vy += G.wind.y * 40 * dt; }
    if (G.current && ci >= 0 && T.base[ci] === TT.DEEP && T.ice[ci] <= 0) { this.vx += G.current.x * dt * 3; this.vy += G.current.y * dt * 3; }
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.collide(T);
    const sp = hypot(this.vx, this.vy); this.moving = sp; this.walk += sp * dt * 0.045;
    this.stillT = sp < 25 ? this.stillT + dt : 0;
    // ---- esquivar ----
    const dashP = inp.dash && !this.prev.dash;
    if (dashP && !locked && this.dash.charges > 0 && this.dash.gap <= 0 && st.root <= 0 && !noDash && this.dash.t <= 0) {
      let dx = ml > 0.2 ? mx / ml : Math.cos(this.face), dy = ml > 0.2 ? my / ml : Math.sin(this.face);
      if (ml > 0.2 && st.root > 0) { dx = Math.cos(this.face); dy = Math.sin(this.face); }
      const ch = this.dash.charges - 1; this.dash = { t: 0.17, cd: this.dash.cd > 0 ? this.dash.cd : this.dashMax, dx, dy, hit: false, charges: ch, gap: 0.24, age: 0 }; this.iframes = 0.16;
      if (this.tr.dashHide) this.st.hidden = Math.max(this.st.hidden, this.tr.dashHide);
      G.events.push({ type: 'dash', who: this.idx, x: this.x, y: this.y });
    }
    // ---- manos ----
    if (locked || st.silence > 0) { for (let k = 0; k < 2; k++) { const h = this.hands[k]; h.hold = -1; if (st.silence > 0 && inp.h[k] && !this.prev.h[k]) h.deny = 0.3; } this.fuse = false; this.absorbing = null; this.queue = null; }
    else this.handsStep(G, dt, inp);
    this.prev = { h: [inp.h[0], inp.h[1]], dash: inp.dash };
  }
  handsStep(G, dt, inp) {
    const H = this.hands; this.absorbing = null;
    for (let k = 0; k < 2; k++) {
      const h = H[k], o = H[1 - k], down = inp.h[k], press = down && !this.prev.h[k], rel = !down && this.prev.h[k];
      if (this.lock[k] && !down) this.lock[k] = false;
      if (press && !this.lock[k]) {
        if (h.cd > 0.15) h.deny = 0.3;
        else { h.hold = 0; if (o.hold >= 0 && o.cd <= 0.15) { this.fuse = true; } if (o.hold < 0 || !this.lockOn) { const a = this.aim(G, 700); this.lockOn = a.target && !a.target.spot ? a.target : a.target && a.target.spot ? null : this.nearestFoe(G, 700); } }
      }
      if (h.hold >= 0 && down) {
        h.hold += dt;
        if (!this.fuse) {
          const s = this.sourceHere(G);
          if (s && s.el !== h.el) { this.absorbing = { s, k, t: h.hold / ABSORB_T }; if (h.hold >= ABSORB_T) { this.absorb(G, k, s); h.hold = -1; this.lock[k] = true; } }
        }
      }
      if (rel && h.hold >= 0) {
        if (this.fuse) { this.queue = { fuse: true, t: 0.3 }; if (o.hold >= 0 || inp.h[1 - k]) this.lock[1 - k] = true; H[0].hold = H[1].hold = -1; this.fuse = false; }
        else { this.queue = { k, level: h.hold >= this.fullAt ? 2 : 1, t: 0.3 }; h.hold = -1; }
      }
    }
    // lo que se soltó justo antes de estar listo sale apenas se pueda
    const q = this.queue;
    if (q) {
      q.t -= dt;
      const ready = q.fuse ? H[0].cd <= 0 && H[1].cd <= 0 && this.rec <= 0 : H[q.k].cd <= 0 && this.rec <= 0;
      if (ready) { this.queue = null; if (q.fuse) this.castFusion(G); else this.castSingle(G, q.k, q.level); }
      else if (q.t <= 0) this.queue = null;
    }
  }
  absorb(G, k, s) {
    const h = this.hands[k]; h.el = s.el; h.uses = ABSORB_USES; s.cd = 9; this.stats.absorbs++;
    G.events.push({ type: 'absorb', who: this.idx, el: s.el, x: s.x, y: s.y, k });
  }
  useHand(h) { if (h.uses > 0) { h.uses--; if (h.uses === 0) h.el = h.nat; } }
  castSingle(G, k, level) {
    const h = this.hands[k], el = h.el, S = SPELLS[el][level - 1];
    Spells.cast(G, this, S, el, { level, power: 1 });
    h.cd = S.cd; this.rec = 0.16; this.castT = 0.25; this.castEl = el; this.castHand = k; this.stats.casts++;
    this.useHand(h);
  }
  castFusion(G, release) {
    const [a, b] = this.hands, gran = this.emb >= 100;
    // Gran Sortilegio: primero la concentración (cámara lenta, círculo mágico), después sale
    if (gran && !release) {
      if (G.state !== 'play') return;
      this.granCharge = GRAN_CHARGE; this.granEls = [a.el, b.el]; a.cd = b.cd = Math.max(a.cd, GRAN_CHARGE + 0.05); this.rec = GRAN_CHARGE + 0.05; this.castT = GRAN_CHARGE + 0.4; this.castHand = 2;
      const nm = a.el === b.el ? 'Doble ' + SPELLS[a.el][1].name.toLowerCase() : FUSIONS[fuseKey(a.el, b.el)].name;
      G.events.push({ type: 'granStart', who: this.idx, x: this.x, y: this.y, name: nm, els: [a.el, b.el] }); return;
    }
    const power = gran ? 1.65 : 1, size = gran ? 1.45 : 1;
    let S, el;
    if (a.el === b.el) { S = Object.assign({}, SPELLS[a.el][1], { name: 'Doble ' + SPELLS[a.el][1].name.toLowerCase(), cd: 3.6 }); el = a.el; Spells.cast(G, this, S, el, { level: 2, power: power * 1.6, size: size * 1.25, double: true, gran }); }
    else { const key = fuseKey(a.el, b.el); S = FUSIONS[key]; el = key; Spells.cast(G, this, S, key, { fusion: key, power, size, gran }); G.events.push({ type: 'fusion', who: this.idx, key, gran }); }
    a.cd = b.cd = S.cd; this.rec = 0.3; this.castT = 0.4; this.castEl = a.el; this.castEl2 = b.el; this.castHand = 2; this.stats.casts++; this.stats.fusions++;
    if (gran) {
      this.emb = 0; this.stats.gran++; this.granGlow = 1.1; G.events.push({ type: 'gran', who: this.idx, x: this.x, y: this.y, name: S.name, els: [a.el, b.el] });
      // onda del sello: empuja a los enemigos cercanos, deshace sus hechizos cercanos y deja un escudo dorado un momento
      for (const u of G.units) { if (!u.alive || u === this || u.team === this.team || u.untargetable || u.obj) continue; const d = hypot(u.x - this.x, u.y - this.y); if (d < GRAN_WAVE) { u.hurt(G, 8, { by: this.idx, el: 'gran' }); if (u.knock) u.knock(u.x - this.x, u.y - this.y, 380 * (1 - d / GRAN_WAVE * 0.5)); } }
      for (const s of G.spells) if (s.team !== this.team && !s.dead && s.t === 'proj' && hypot(s.x - this.x, s.y - this.y) < GRAN_WAVE + 40) { s.dead = true; G.fx.push({ type: 'pop', x: s.x, y: s.y, el: s.el, r: 20 }); }
      this.buff.shield = Math.max(this.buff.shield || 0, 20); this.buff.shieldT = Math.max(this.buff.shieldT || 0, 2);
    }
    this.useHand(a); this.useHand(b);
  }
  releaseGran(G) { this.granCharge = 0; if (G.state !== 'play') return; for (const h of this.hands) h.cd = 0; this.rec = 0; this.castFusion(G, true); }
  fall(G) {
    this.hurt(G, 15, { by: this.lastHitBy, el: 'fall' });
    G.events.push({ type: 'fall', who: this.idx, x: this.x, y: this.y });
    if (!this.alive) return;
    const [sx, sy] = Arena.safeNear(G, this.x, this.y); this.x = sx; this.y = sy; this.vx = this.vy = 0; this.stun(0.5);
  }
  die(G, src) {
    this.alive = false; this.hands.forEach(h => (h.hold = -1)); this.fuse = false;
    const k = src.by >= 0 && src.by !== this.idx ? src.by : this.lastHitBy;
    if (k >= 0 && G.mages[k] && G.mages[k] !== this) G.mages[k].stats.kills++;
    G.events.push({ type: 'down', who: this.idx, by: k, x: this.x, y: this.y });
  }
}
