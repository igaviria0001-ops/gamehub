/* =========================================================================
   EL PILOTO CON ALA DE CHORRO — vuelo libre con inercia
   · Apuntas hacia donde quieres (8 direcciones con teclas, 360° con palanca
     o joystick): el CUERPO gira rápido hacia allá; la TRAYECTORIA lo sigue
     con la fuerza del ala, que agarra más lento mientras más rápido vas.
   · Si apuntas lejos de hacia donde vas, el ala pierde agarre: derrapas,
     frenas y puedes disparar hacia atrás mientras la inercia te lleva.
   · Las turbinas empujan hacia donde apunta el cuerpo; el turbo empuja
     mucho más (y apuntando hacia arriba casi te deja flotar).
   · Subir gasta velocidad y picar la gana. Muy lento = sin sustentación: caes.
   · Doble toque en una dirección = tonel: esquive rápido hacia ese lado.
   · Volar a ras del suelo recarga el turbo; volar en la estela del otro
     te empuja (rebufo).
   · Rozar desliza; chocar de frente aturde y quita blindaje; llegar despacio
     a una copa o al suelo te posa.
   ========================================================================= */
const PHYS = {
  gTan: 420,        // subir frena y picar acelera (gravedad a lo largo de la trayectoria)
  gFall: 760,       // caída sin sustentación (más suave: se puede recuperar)
  stall: 170,       // por debajo de esto el ala deja de sostener
  maxS: 1400,
  thrust: 330,      // empuje de crucero (iguala el arrastre a la velocidad de crucero)
  boostThrust: 1250, // turbo (de sobra para subir en vertical aunque vengas cayendo)
  draftThrust: 260, // rebufo
  sideDrag: 1.9,    // freno por ir de lado
  fuelUse: 0.24, fuelBack: 0.3,
  rollImpulse: 430, rollTime: 0.36, rollCd: 1.0, rollFuel: 0.12,
  sonic: 1000, skimImpact: 300,
  perchImpact: 260, perchSpeed: 440,
  crashStun: 0.55, crashDmg: 15,
  regenWait: 5, regenRate: 0.025, regenCap: 0.7, // el blindaje se repara solo (hasta el 70 %) si no te dan un rato
  trailLife: 1.6,
};
// indicativos: cada piloto vuela y pelea distinto
const SPECIES = {
  guacamaya: { id: 'guacamaya', name: 'Guacamaya', hp: 400, body: 5.5, aero: 1950, cruise: 545, mass: 1, r: 22, size: 1.3, gun: { rate: 12, heat: 0.06, dmg: 6, barrels: 1 }, missile: { dmg: 55, turn: 3.1 } },
  colibri: { id: 'colibri', name: 'Colibrí', hp: 280, body: 6.2, aero: 2150, cruise: 600, mass: 0.6, r: 19, size: 1.05, gun: { rate: 13, heat: 0.058, dmg: 5, barrels: 1 }, missile: { dmg: 50, turn: 3.1 } },
  tucan: { id: 'tucan', name: 'Tucán', hp: 410, body: 4.7, aero: 1800, cruise: 520, mass: 1.15, r: 24, size: 1.35, gun: { rate: 8.5, heat: 0.085, dmg: 6, barrels: 2 }, missile: { dmg: 58, turn: 3.1 } },
  condor: { id: 'condor', name: 'Cóndor', hp: 540, body: 4.7, aero: 1780, cruise: 510, mass: 1.6, r: 25, size: 1.65, glide: true, gun: { rate: 10, heat: 0.055, dmg: 8, barrels: 1 }, missile: { dmg: 80, turn: 3.4 } },
};
const SPECIES_ORDER = ['guacamaya', 'colibri', 'tucan', 'condor'];

class Bird {
  constructor(id, species, look) {
    this.id = id; this.sp = SPECIES[species] || SPECIES.guacamaya; this.look = look || 0;
    this.r = this.sp.r;
    this.reset(0, 0, 1);
  }
  reset(x, y, facing) {
    this.x = x; this.y = y;
    this.a = facing > 0 ? 0 : Math.PI; this.c = facing > 0 ? 1 : -1;
    this.s = this.sp.cruise; this.vx = Math.cos(this.a) * this.s; this.vy = 0; this.va = this.a; this.mis = 0;
    this.stun = 0; this.stalled = false; this.perch = null; this.lift = 1;
    this.flipT = 0; this.flapPh = 0; this.skimT = 0; this.t = 0;
    this.alive = true; this.hp = this.sp.hp; this.hitT = 0; this.lastHitBy = -1;
    this.fuel = 1; this.boosting = false; this.fuelLock = false; this.fuelWait = 0;
    this.heat = 0; this.overheat = false; this.fireCd = 0; this.firing = false;
    this.missiles = 2; this.missileCd = 0; this.flares = 1; this.shield = 0; this.rapid = 0; this.lockT = 0; this.locked = false;
    this.pMissile = false; this.catchup = false; this.rocket = 0;
    this.evadeT = 0; this.rollCd = 0; this.spin = 0; this.spinDir = 1;
    this.rasante = false; this.drafting = false; this.legendT = 0; this.adren = 0;
    this.trail = []; this.trailAcc = 0;
    this.st = { misT: 0, rasT: 0, draftT: 0, loopAcc: 0, loopT: 0, vaPrev: this.va, sHist: [], lastTrick: -9, combo: 0, rep: {}, cool: {} };
    this.stats = { maxS: 0, crashes: 0, shots: 0, hits: 0, missiles: 0, missileHits: 0, dodged: 0, crates: 0, dmg: 0, kills: 0, tricks: 0, legends: 0 };
  }
  get facing() { return Math.cos(this.a) >= 0 ? 1 : -1; }
  emit(type, data = {}) { if (this.G) this.G.events.push(Object.assign({ type, b: this, x: this.x, y: this.y }, data)); }

  damage(n, from, kind) {
    if (!this.alive || n <= 0) return 0;
    if (this.shield > 0) { this.emit('shieldHit', { kind }); return 0; }
    // ventaja: recibe menos daño
    const av = this.G && this.G.adv ? this.G.adv[this.id] || 0 : 0;
    if (av) n *= [1, 0.8, 0.64][av];
    this.hp -= n; this.hitT = 0.14; this.lastHitBy = from; this.calmT = 0;
    if (from >= 0 && this.G && this.G.birds[from]) this.G.birds[from].stats.dmg += n;
    this.emit('hurt', { n, kind, from });
    if (this.hp <= 0) { this.hp = 0; this.alive = false; this.perch = null; this.emit('down', { from, kind }); }
    return n;
  }
  push(ix, iy) { this.vx += ix; this.vy += iy; }

  step(dt, inp, G) {
    this.G = G;
    const sp = this.sp, W = G.world;
    this.t += dt;
    if (!this.alive) return;
    this.stun = Math.max(0, this.stun - dt);
    this.flipT = Math.max(0, this.flipT - dt);
    this.skimT = Math.max(0, this.skimT - dt);
    this.hitT = Math.max(0, this.hitT - dt);
    this.shield = Math.max(0, this.shield - dt);
    this.rapid = Math.max(0, this.rapid - dt);
    this.evadeT = Math.max(0, this.evadeT - dt);
    this.rollCd = Math.max(0, this.rollCd - dt);
    this.legendT = Math.max(0, this.legendT - dt);
    // reparación lenta cuando nadie te ha dado en un rato
    this.calmT = (this.calmT || 0) + dt; this.regen = false;
    if (this.calmT > PHYS.regenWait && this.hp < sp.hp * PHYS.regenCap) { this.hp = Math.min(sp.hp * PHYS.regenCap, this.hp + sp.hp * PHYS.regenRate * dt); this.regen = true; }
    if (this.spin > 0) this.spin = Math.max(0, this.spin - dt * 2.8);
    const stunned = this.stun > 0, legend = this.legendT > 0;
    let dx = inp.dx || 0, dy = inp.dy || 0;
    let hasDir = dx * dx + dy * dy > 0.04 && !stunned;

    /* --- turbo: se gasta mientras lo mantienes; vacío, hay que esperar un poco --- */
    const wantBoost = inp.boost && !stunned && !this.perch;
    if (wantBoost && !this.fuelLock && this.fuel > 0) {
      this.boosting = true; if (!legend) this.fuel = Math.max(0, this.fuel - PHYS.fuelUse * dt); this.fuelWait = 0.3;
      if (this.fuel <= 0) { this.fuelLock = true; this.emit('fuelOut'); }
    } else {
      this.boosting = false; this.fuelWait = Math.max(0, this.fuelWait - dt);
      if (this.fuelWait <= 0 || this.rasante) this.fuel = Math.min(1, this.fuel + PHYS.fuelBack * dt * (this.perch ? 2.5 : 1) * (this.rasante ? 3.5 : 1) * (this.catchup ? 2 : 1) * (this.G && this.G.adv ? [1, 1.25, 1.5][this.G.adv[this.id] || 0] : 1));
      if (this.fuelLock && this.fuel >= 0.18) this.fuelLock = false;
    }
    if (legend) { this.fuel = 1; this.fuelLock = false; }
    // caja «Cohete»: turbo sin fin por unos segundos
    if (this.rocket > 0) { this.rocket = Math.max(0, this.rocket - dt); this.fuel = 1; this.fuelLock = false; }

    /* --- posado: apuntar hacia arriba o cualquier acción despega; a los lados, se voltea --- */
    if (this.perch && this.perch.ship) {
      // posado en el galeón: va con el barco; si el apoyo se le corre (al dar la vuelta), se cae
      const S = G.world.ship, P = this.perch;
      P.x = S.x + P.ox * (S.turn / P.turn0);
      if (!World.solidAt(G.world, P.x, P.y + this.r + 2, 2)) { this.perch = null; this.vy = 60; }
    }
    if (this.perch && this.perch.hot != null) {
      // posado en un globo: viaja con él (si se fue de lado al empujarlo, se cae)
      const H = G.world.hotair && G.world.hotair[this.perch.hot], P = this.perch;
      if (!H) this.perch = null;
      else {
        if (P.kind === 'basket') { P.x = H.x + P.ox; P.y = H.y + H.r + World.HA.rope - this.r + 3; }
        else { P.x = H.x + P.ox; P.y = H.y - H.r * 0.94 - this.r + 4 + Math.abs(P.ox) * Math.abs(P.ox) / (H.r * 2.2); }
      }
    }
    if (this.perch) {
      if (hasDir && Math.abs(dx) > 0.7 && dy > -0.3 && Math.sign(dx) !== this.facing) { this.a = dx > 0 ? 0 : Math.PI; this.c = dx > 0 ? 1 : -1; this.flipT = 0.2; this.emit('turn'); }
      if (!stunned && ((hasDir && dy < -0.3) || inp.boost || inp.fire || inp.missile)) this.takeoff(inp.boost, hasDir ? Math.atan2(dy, dx) : null);
      else { this.x = this.perch.x; this.y = this.perch.y; this.vx = 0; this.vy = 0; this.s = 0; this.pushTrail(dt, true); return; }
    }

    /* --- tonel: impulso hacia ese lado y un instante en que las balas no te tocan --- */
    if (inp.roll && this.rollCd <= 0 && !stunned && this.fuel >= PHYS.rollFuel * 0.5) {
      let rx = inp.rdx || 0, ry = inp.rdy || 0;
      if (!rx && !ry) { rx = -Math.sin(this.va); ry = Math.cos(this.va); }
      const l = Math.hypot(rx, ry) || 1; rx /= l; ry /= l;
      this.vx += rx * PHYS.rollImpulse; this.vy += ry * PHYS.rollImpulse;
      this.evadeT = PHYS.rollTime; this.rollCd = PHYS.rollCd; this.spin = 1;
      this.spinDir = (Math.cos(this.va) * ry - Math.sin(this.va) * rx) >= 0 ? 1 : -1;
      if (!legend) this.fuel = Math.max(0, this.fuel - PHYS.rollFuel);
      this.emit('roll', { rx, ry });
    }

    /* --- el cuerpo gira hacia donde apuntas (al revés exacto: da la vuelta por arriba) --- */
    const lowLift = this.lift < 0.5;
    if (!hasDir && !stunned && this.lift < 0.4 && this.s > 30 && World.floorY(W, this.x, this.y) - this.y > 200) {
      // asistencia: sin teclas y sin sustentación, la nariz baja sola hacia adelante para recuperar velocidad
      const fwd = Math.cos(this.va) >= 0 ? 1 : -1, target = Math.atan2(Math.max(0.45, Math.sin(this.va)), fwd);
      this.a += clamp(angDiff(this.a, target), -sp.body * 0.7 * dt, sp.body * 0.7 * dt);
    }
    if (hasDir) {
      const target = Math.atan2(dy, dx);
      let diff = angDiff(this.a, target);
      if (Math.abs(diff) > Math.PI - 0.3) { const viaUp = angDiff(this.a, -Math.PI / 2); diff = Math.sign(viaUp || 1) * Math.abs(diff); }
      const w = sp.body * (lowLift ? 0.85 : 1);
      this.a += clamp(diff, -w * dt, w * dt);
      this.a = Math.atan2(Math.sin(this.a), Math.cos(this.a));
    }
    // dibujo: el piloto siempre de pie (se voltea al cruzar la vertical)
    const ca = Math.cos(this.a);
    if (ca > 0.18 && this.c < 0) { this.c = 1; this.flipT = 0.2; }
    else if (ca < -0.18 && this.c > 0) { this.c = -1; this.flipT = 0.2; }

    /* --- empuje: turbinas hacia donde apunta el cuerpo --- */
    let T = PHYS.thrust;
    if (this.boosting) T += PHYS.boostThrust * (this.catchup ? 1.12 : 1) * (this.rocket > 0 ? 1.15 : 1);
    if (G.case && G.case.carrier === this.id) T *= G.tm ? 0.8 : 0.86; // el maletín pesa (en la Entrega, más)
    if (this.drafting) T += PHYS.draftThrust;
    if (stunned) T *= 0.4;
    this.vx += Math.cos(this.a) * T * dt; this.vy += Math.sin(this.a) * T * dt;

    /* --- aerodinámica --- */
    let s = Math.hypot(this.vx, this.vy), va = s > 1 ? Math.atan2(this.vy, this.vx) : this.a;
    const mis = angDiff(va, this.a), am = Math.abs(mis);
    this.mis = mis;
    // sustentación: hace falta velocidad y que el ala vaya más o menos de frente
    const lift = clamp((s - PHYS.stall * 0.6) / (PHYS.stall * 0.9), 0, 1) * clamp(1 - (am - 0.8) / 0.95, 0, 1);
    this.lift = lift;
    const stalled = s < PHYS.stall;
    if (stalled && !this.stalled && G.time > (this.stallMsgT || 0)) { this.stallMsgT = G.time + 4; this.emit('stall'); }
    this.stalled = stalled;
    const kd = PHYS.thrust / (sp.cruise * sp.cruise) * (sp.glide ? 0.8 : 1);
    s += PHYS.gTan * Math.sin(va) * lift * dt;        // picar acelera, subir frena
    s -= kd * s * s * dt;                             // arrastre
    s -= PHYS.sideDrag * s * Math.abs(Math.sin(mis)) * dt; // ir de lado frena
    s = clamp(s, 0, PHYS.maxS);
    // el ala lleva la trayectoria hacia donde apunta el cuerpo (más lento a más velocidad)
    const wA = sp.aero / Math.max(s, 230) * lift * (this.evadeT > 0 ? 0.25 : 1);
    va += clamp(mis, -wA * dt, wA * dt);
    this.vx = Math.cos(va) * s; this.vy = Math.sin(va) * s;
    // sin sustentación se cae (con turbo, las turbinas sostienen buena parte del peso)
    this.vy += PHYS.gFall * (1 - (this.boosting ? Math.max(lift, 0.55) : lift)) * dt;
    // viento del escenario
    const wnd = World.windAt(W, this.x, this.y, G.time), wk = 1 / Math.sqrt(sp.mass);
    this.x += (this.vx + wnd.x * wk) * dt; this.y += (this.vy + wnd.y * wk) * dt;
    this.s = Math.hypot(this.vx, this.vy); this.va = Math.atan2(this.vy, this.vx);
    if (this.s > this.stats.maxS) this.stats.maxS = this.s;
    // barrera del sonido (de juego): estampido y cono de vapor
    if (this.s > PHYS.sonic && !this.sonicOn) { this.sonicOn = true; this.emit('sonic', { a: this.va }); }
    else if (this.s < PHYS.sonic * 0.85) this.sonicOn = false;

    /* --- rebufo y vuelo rasante --- */
    this.drafting = false;
    const o = G.birds[1 - this.id];
    if (o && o.alive && !o.perch && this.s > 300) {
      const dxo = o.x - this.x, dyo = o.y - this.y, d = Math.hypot(dxo, dyo);
      if (d < 420 && d > 60 && Math.cos(angDiff(this.va, o.va)) > 0.82 && Math.cos(angDiff(this.va, Math.atan2(dyo, dxo))) > 0.9) this.drafting = true;
    }
    const gap = World.floorY(W, this.x, this.y) - (this.y + this.r);
    this.rasante = gap < 55 && gap > -5 && this.s > 560 && this.lift > 0.5;

    this.collide(G);
    if (this.x < 14 && this.vx < 0) { this.x = 14; this.vx = -this.vx * 0.5; }
    if (this.x > W.w - 14 && this.vx > 0) { this.x = W.w - 14; this.vx = -this.vx * 0.5; }
    // tope duro muy por encima del techo del escenario (el viento del techo ya empuja hacia abajo antes de llegar)
    const topY = (W.ceil != null ? W.ceil : 150) - 170;
    if (this.y < topY && this.vy < 0) { this.y = topY; this.vy = -this.vy * 0.4; }
    this.flapPh += dt * (this.boosting ? 30 : 12);
    this.pushTrail(dt, false);
  }

  pushTrail(dt, still) {
    this.trailAcc += dt;
    if (this.trailAcc >= 1 / 60) {
      this.trailAcc = 0;
      this.trail.push({ x: this.x - Math.cos(this.a) * this.r * 1.1, y: this.y - Math.sin(this.a) * this.r * 1.1, t: this.G.time, s: still ? 0 : this.s, b: this.boosting ? 1 : 0, l: this.legendT > 0 ? 1 : 0 });
    }
    const lim = this.G.time - PHYS.trailLife;
    while (this.trail.length && this.trail[0].t < lim) this.trail.shift();
  }

  takeoff(boost, aim) {
    const f = this.facing;
    this.a = aim != null && Math.sin(aim) < -0.2 ? aim : (f > 0 ? -0.75 : Math.PI + 0.75);
    this.c = Math.cos(this.a) >= 0 ? 1 : -1;
    const s = 380 + (boost ? 160 : 0);
    this.vx = Math.cos(this.a) * s; this.vy = Math.sin(this.a) * s;
    this.perch = null; this.y -= 6;
    this.emit('takeoff');
  }
  land(c) {
    const W = this.G.world;
    let px = this.x, py;
    if (c.kind === 'crown') { const C = c.P.crown; px = clamp(this.x, C.x - C.r * 0.45, C.x + C.r * 0.45); py = C.y - C.r * 0.55 - this.r + 6; }
    else if (c.kind === 'roof' || c.kind === 'deck' || c.kind === 'cofa') { px = clamp(this.x, c.x0 + this.r * 0.6, c.x1 - this.r * 0.6); py = c.top - this.r + 3; }
    else if (c.kind === 'basket') { px = clamp(this.x, c.x0 + 6, c.x1 - 6); py = c.top - this.r + 3; }
    else if (c.kind === 'hotair') { const H = W.hotair[c.i]; px = clamp(this.x, H.x - H.r * 0.42, H.x + H.r * 0.42); py = H.y - H.r * 0.94 - this.r + 4 + (px - H.x) * (px - H.x) / (H.r * 2.2); }
    else py = W.groundY(px) - this.r + 3;
    const f = this.vx >= 0 ? 1 : -1;
    this.perch = { kind: c.kind, x: px, y: py, P: c.P || null };
    if (c.kind === 'deck' || c.kind === 'cofa') Object.assign(this.perch, { ship: true, ox: px - W.ship.x, turn0: W.ship.turn || 1 });
    if (c.kind === 'hotair' || c.kind === 'basket') { const H = W.hotair[c.i]; Object.assign(this.perch, { hot: c.i, ox: px - H.x }); World.knockHotair(W, c.i, 0, 26); }
    this.x = px; this.y = py; this.vx = 0; this.vy = 0; this.s = 0;
    this.a = f > 0 ? 0 : Math.PI; this.c = f; this.stalled = false;
    this.emit('land', { kind: c.kind });
  }
  collide(G) {
    const c = World.contact(G.world, this.x, this.y, this.r);
    if (!c) return;
    this.x += c.nx * c.depth; this.y += c.ny * c.depth;
    const vn = this.vx * c.nx + this.vy * c.ny;
    if (vn >= 0) return;
    const impact = -vn;
    if (c.perch && c.ny < -0.5 && this.vy < PHYS.perchImpact && this.s < PHYS.perchSpeed && this.stun <= 0 && !this.boosting && Math.abs(Math.sin(this.a)) < 0.7) { this.land(c); return; }
    if (c.kind === 'hotair') {
      // la tela del globo es elástica: rebotas sin golpe ni aturdirte, y el globo se mece
      const e = 1.15;
      this.vx -= vn * c.nx * (1 + e); this.vy -= vn * c.ny * (1 + e);
      const sp2 = Math.hypot(this.vx, this.vy), cap = Math.max(380, Math.min(760, impact * 1.25));
      if (sp2 > cap) { this.vx *= cap / sp2; this.vy *= cap / sp2; }
      this.a = Math.atan2(this.vy, this.vx); this.c = Math.cos(this.a) >= 0 ? 1 : -1;
      World.knockHotair(G.world, c.i, -c.nx * impact * 0.12, -c.ny * impact * 0.16);
      if (this.skimT <= 0) { this.skimT = 0.15; this.emit('bounce', { kind: 'hotair', nx: c.nx, ny: c.ny, sp: impact, i: c.i }); }
      return;
    }
    if (impact < PHYS.skimImpact || (c.kind === 'ground' && impact < PHYS.skimImpact * 1.3 && this.s > 430 && !this.stalled)) {
      // rozar: se quita la parte que va contra la superficie y se pierde un poco de velocidad
      this.vx -= vn * c.nx * 1.05; this.vy -= vn * c.ny * 1.05;
      this.vx *= 0.97; this.vy *= 0.97;
      if (this.skimT <= 0) { this.skimT = 0.12; this.emit('skim', { kind: c.water ? 'water' : c.kind, nx: c.nx, ny: c.ny, sp: this.s }); }
    } else {
      this.vx = (this.vx - 2 * vn * c.nx) * 0.4; this.vy = (this.vy - 2 * vn * c.ny) * 0.4;
      this.vx += c.nx * 120; this.vy += c.ny * 120;
      this.a = Math.atan2(this.vy, this.vx);
      this.stun = PHYS.crashStun; this.stats.crashes++;
      this.emit('crash', { impact, kind: c.kind, nx: c.nx, ny: c.ny });
      this.damage(PHYS.crashDmg * clamp(impact / 450, 0.7, 1.6) * this.sp.hp / 400, -1, 'crash');
      if (c.kind === 'crown' && c.P) World.hitCrown(G.world, c.P, 1, G);
      if (c.kind === 'building' && c.B) World.hitBuilding(G.world, c.B, this.x - c.nx * this.r, this.y - c.ny * this.r, 2, G);
      if (c.kind === 'cabin') World.nudgeCabin(G.world, c.i, c.nx > 0 ? -1 : 1);
      if (c.kind === 'hotairB' || c.kind === 'basket') World.knockHotair(G.world, c.i, -c.nx * 40, -c.ny * 30);
    }
  }
}
