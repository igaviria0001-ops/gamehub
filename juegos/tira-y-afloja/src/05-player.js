/* =========================================================================
   JUGADORES — Fresa y Menta: física, cuerpo blando y caras
   ========================================================================= */
const PHYS = {
  g: 2200,
  vmax: 480, accG: 4400, accA: 3000, fric: 2100, fricStun: 600,
  jumpV: 1010, coyote: 0.1, buffer: 0.13,
  grip: 2.25, drain: 1 / 2.8, recharge: 1 / 1.9, stickMin: 0.3,
  pullRate: 1.45, releaseRate: 1.9, minBody: 1, maxBody: 9.5,
  unit: 100, minRope: 0.6, maxRope: 8,
  ramSpeed: 440, ramRatio: 1.2, stun: 0.6,
  maxV: 3200,
  ropeBodies: 1.3,   // tirar no puede dejar el hilo más corto que los dos cuerpos × esto
  stickReach: 20,    // en el aire te pegas a lo que esté a esta distancia
  slingReady: 0.35,  // carga mínima del tirachinas
  airJumpCost: 0.3, airJumpF: 0.8, // salto doble: chicle que se va al hilo y fuerza
};
const massRadius = m => 11 + 15.5 * Math.sqrt(m);
const speedF = m => clamp(Math.pow(3 / m, 0.33), 0.6, 1.45);
const jumpF = m => clamp(Math.pow(3 / m, 0.42), 0.55, 1.62);

const BODY_N = 28;
const BODY_DIRS = Array.from({ length: BODY_N }, (_, i) => { const a = i / BODY_N * TAU - Math.PI / 2; return { x: Math.cos(a), y: Math.sin(a) }; });

class Player {
  constructor(id, col) {
    this.id = id; this.col = col; this.name = col.name;
    this.off = new Float32Array(BODY_N); this.offV = new Float32Array(BODY_N);
    this.stats = { rams: 0, slings: 0, whips: 0, pellets: 0, dunks: 0 };
    this.reset(id === 0 ? 760 : 1160, ARENA.deskY, 3);
  }

  reset(x, floorY, mass) {
    this.mass = mass; this.r = massRadius(mass);
    this.x = x; this.y = floorY - this.r; this.vx = 0; this.vy = 0;
    this.onGround = true; this.contacts = []; this.coyote = 0; this.jumpBuf = 0; this.prevJump = false;
    this.jumping = false; this.jumpCut = true;
    this.stuck = false; this.stuckR = null; this.groundR = null; this.stuckN = { x: 0, y: -1 }; this.stuckX = x; this.stuckY = this.y; this.sticky = 1; this.stickCd = 0; this.gripLoad = 0;
    this.stun = 0; this.inv = 0; this.anchor = false; this.pinned = false; this.slingT = 0; this.slingPower = 0; this.whipT = 0;
    this.facing = this.id === 0 ? 1 : -1;
    this.alive = true; this.dunked = false; this.dunkT = 0; this.dunkX = 0;
    this.reeling = 0; this.pulling = false; this.releasing = false;
    this.events = [];
    // visual
    this.off.fill(0); this.offV.fill(0);
    this.sq = 0; this.sqV = 0; this.stretch = 1; this.stretchA = 0;
    this.look = { x: this.facing, y: 0 }; this.blinkT = rnd(1, 4); this.blink = 0;
    this.expr = 'normal'; this.exprHold = 0; this.mood = null;
    this.trail = []; this.hangT = 0; this.wasHanging = false;
    this.lastHitBy = null; this.lastHitT = 99;
    this.ropeT = 0; this.ropeDir = { x: 0, y: 0 };
    // maniobras
    this.moveDir = 0; this.diveT = 0; this.charge = 0; this.chargeLvl = 0; this.stickHeld = 0; this.prevStick = false; this.airPress = false;
    this.airJumps = 1; this.ropeMinT = 0; this.ropeMinShown = false;
  }

  setMass(m) {
    m = clamp(m, PHYS.minBody, PHYS.maxBody);
    const oldR = this.r;
    this.mass = m; this.r = massRadius(m);
    const dr = this.r - oldR;
    if (this.stuck) { this.stuckX += this.stuckN.x * dr; this.stuckY += this.stuckN.y * dr; this.x = this.stuckX; this.y = this.stuckY; }
    else if (this.onGround) this.y -= dr;
  }

  emit(type, data = {}) { this.events.push(Object.assign({ type }, data)); }

  /* ---------------- un paso de física (dt fijo) ---------------- */
  step(dt, inp, T, game) {
    if (!this.alive) return;
    const prevY = this.y;
    this.stickCd = Math.max(0, this.stickCd - dt);
    this.stun = Math.max(0, this.stun - dt);
    this.inv = Math.max(0, this.inv - dt);
    this.slingT = Math.max(0, this.slingT - dt);
    this.whipT = Math.max(0, this.whipT - dt);
    this.lastHitT += dt;
    const jumpPressed = inp.jump && !this.prevJump;
    this.prevJump = inp.jump;
    if (jumpPressed) this.jumpBuf = PHYS.buffer; else this.jumpBuf = Math.max(0, this.jumpBuf - dt);
    const canAct = this.stun <= 0 && game.canControl;
    this.moveDir = canAct ? (inp.right ? 1 : 0) - (inp.left ? 1 : 0) : 0;
    this.stickHeld = inp.stick ? this.stickHeld + dt : 0;
    // «pegarse» apretado de nuevo estando en el aire: agarra lo cercano o hace la picada
    const stickPressed = inp.stick && !this.prevStick; this.prevStick = inp.stick;
    if (stickPressed && !this.onGround && !this.stuck) this.airPress = true;
    if (!inp.stick || this.onGround || this.stuck) this.airPress = false;
    this.ropeT = Math.hypot(T.x, T.y);
    // lo que se mueve debajo te lleva consigo
    const carrier = this.stuck ? this.stuckR : (this.onGround ? this.groundR : null);
    if (carrier && (carrier.dx || carrier.dy)) {
      if (this.stuck) { this.stuckX += carrier.dx; this.stuckY += carrier.dy; }
      else {
        this.x += carrier.dx;
        if (carrier.dy < 0) this.vy = Math.min(this.vy, carrier.dy / dt); // sube con la plataforma; si frena de golpe, te lanza
        else this.y += carrier.dy;
      }
    }
    if (this.ropeT > 1) this.ropeDir = { x: T.x / this.ropeT, y: T.y / this.ropeT };

    /* --- pegarse --- */
    // anillas de la campaña (hold): imán más largo, sirve aunque «pegarse» venga apretado desde antes, y cerca de ellas no hay picada
    let ringNear = null;
    if (!this.stuck && canAct && inp.stick && !this.onGround && ARENA.pegs.length) {
      for (const K of ARENA.pegs) if (K.hold) { const d = Math.hypot(this.x - K.x, this.y - K.y) - this.r - K.r; if (d < 260 && (!ringNear || d < ringNear.d)) ringNear = { K, d }; }
      if (ringNear && ringNear.d < 42 && ringNear.d > 0 && this.stickCd <= 0 && this.sticky >= PHYS.stickMin && !this.contacts.length) {
        const K = ringNear.K, dx = this.x - K.x, dy = this.y - K.y, dl = Math.hypot(dx, dy) || 1;
        this.x = K.x + dx / dl * (this.r + K.r); this.y = K.y + dy / dl * (this.r + K.r);
        this.contacts = [{ nx: dx / dl, ny: dy / dl, depth: 0, R: K }];
      }
    }
    // en el aire, si hay una pared o un techo muy cerca, el chicle la alcanza (imán corto)
    if (!this.stuck && canAct && inp.stick && this.airPress && !this.contacts.length && !this.onGround && this.stickCd <= 0 && this.sticky >= PHYS.stickMin && this.stickHeld < 0.35) {
      const ns = ARENA.nearSurface(this.x, this.y, this.r, PHYS.stickReach);
      if (ns && ns.gap > 0) {
        this.x -= ns.nx * ns.gap; this.y -= ns.ny * ns.gap;
        this.contacts = [{ nx: ns.nx, ny: ns.ny, depth: 0, R: ns.R }];
      }
    }
    if (!this.stuck && canAct && inp.stick && this.stickCd <= 0 && this.sticky >= PHYS.stickMin && this.contacts.length) {
      let best = this.contacts[0];
      for (const c of this.contacts) if (c.ny < best.ny) best = c; // preferir el suelo
      this.stuck = true; this.stuckN = { x: best.nx, y: best.ny }; this.stuckR = best.R;
      this.stuckX = this.x; this.stuckY = this.y; this.vx = 0; this.vy = 0;
      this.emit('stick', { nx: best.nx, ny: best.ny, air: !this.onGround && best.ny > -0.55, dive: this.diveT > 0 });
      this.diveT = 0; this.airJumps = 1; this.charge = 0; this.chargeLvl = 0;
    }
    if (this.stuck) {
      const hold = this.stuckR && this.stuckR.hold ? this.stuckR.hold : 1; // anillas de la campaña: se agarran mejor
      if (!this.anchor) this.sticky -= PHYS.drain * dt * (game.suddenDeath ? 1.6 : 1) * (game.hcK ? game.hcK[this.id] : 1) / hold;
      const n = this.stuckN;
      const away = T.x * n.x + T.y * n.y;
      const tang = Math.abs(T.x * -n.y + T.y * n.x);
      const load = Math.max(0, away) + tang * 0.75;
      const limit = this.anchor ? Infinity : PHYS.grip * this.mass * PHYS.g * (hold > 1 ? 2.4 : 1);
      this.gripLoad = load / limit;
      const strain = game.rope ? game.rope.strain : 1;
      // tirachinas: con el hilo tenso, la carga sube; suéltate cuando esté lista
      const taut = game.rope && game.rope.visible && strain > 1.03 && !this.pinned;
      if (taut) this.charge = Math.min(1, this.charge + dt * (0.9 + 5 * (strain - 1.03)));
      else this.charge = Math.max(0, this.charge - dt * 1.4);
      const lvl = this.charge >= 1 ? 2 : this.charge >= PHYS.slingReady ? 1 : 0;
      if (lvl > this.chargeLvl) this.emit('charge', { lvl });
      this.chargeLvl = lvl;
      if (load > limit) this.unstick('rip', strain, game);
      else if (this.sticky <= 0) this.unstick('dry', strain, game);
      else if ((!inp.stick || !canAct) && !this.pinned) this.unstick('let', strain, game);
      else if (jumpPressed) this.unstick('jump', strain, game);
      if (this.stuck) {
        this.x = this.stuckX; this.y = this.stuckY; this.vx = 0; this.vy = 0;
        return;
      }
    } else {
      this.gripLoad = 0;
      this.sticky = Math.min(1, this.sticky + PHYS.recharge * dt);
    }

    /* --- correr --- */
    const dir = canAct ? (inp.right ? 1 : 0) - (inp.left ? 1 : 0) : 0;
    if (dir) this.facing = dir;
    const sf = speedF(this.mass);
    const surf = this.onGround && this.groundR ? this.groundR : null;
    const belt = surf && surf.conveyor ? surf.conveyor : 0;
    const slip = this.onGround && ((surf && surf.slip) || ARENA.mods.slip || ARENA.mods.push);
    const glue = surf && surf.glue;
    this.surface = slip ? 'slip' : glue ? 'glue' : null;
    const target = dir * PHYS.vmax * sf * (glue ? 0.4 : 1) + belt;
    if (this.onGround) {
      let maxA = dir ? PHYS.accG * sf : (this.stun > 0 || this.slingT > 0.35 ? PHYS.fricStun : PHYS.fric);
      if (dir && Math.sign(this.vx - belt) === dir && Math.abs(this.vx - belt) > Math.abs(target - belt)) maxA = PHYS.fric * 0.35; // conservar el impulso
      if (slip) maxA *= dir ? 0.3 : 0.07;      // témpera: resbala
      if (glue) maxA = Math.max(maxA, PHYS.fric * 1.6); // pegante: frena en seco
      this.vx += clamp(target - this.vx, -maxA * dt, maxA * dt);
    } else {
      if (dir) {
        const dv = target - this.vx;
        // cambiar de dirección en el aire responde más rápido que acelerar
        const acc = PHYS.accA * sf * (Math.sign(this.vx) === -dir ? 1.35 : 1);
        if (Math.sign(dv) === dir) this.vx += clamp(dv, -acc * dt, acc * dt);
      }
      this.vx *= 1 - 0.12 * dt;
    }
    /* --- picada: mantener «pegarse» en el aire sin nada cerca --- */
    if (this.onGround) this.diveT = 0;
    const overFloor = this.y - this.r < ARENA.deskY - 8; // nunca sobre la caneca
    if (canAct && !this.onGround && inp.stick && this.airPress && this.stickHeld > 0.08 && overFloor && !this.contacts.length && !ringNear) {
      if (this.diveT <= 0) { this.diveT = 0.001; this.vy = Math.max(this.vy, 650); this.emit('dive'); }
      this.diveT += dt;
      this.vy += PHYS.g * 1.3 * dt;
      this.vx *= 1 - 2.5 * dt;
    } else if (this.diveT > 0) this.diveT += dt;

    /* --- el hilo tira --- */
    this.vx += T.x / this.mass * dt;
    this.vy += T.y / this.mass * dt;
    this.vy += PHYS.g * ARENA.mods.gravity * dt;
    const wind = ARENA.windAt(this.x, this.y);
    if (wind) this.vx += wind / this.mass * dt * (this.onGround ? 0.5 : 1);
    if (ARENA.mods.push) this.vx += ARENA.mods.push / Math.pow(this.mass, 0.35) * dt * (this.onGround ? 1 : 0.6);

    /* --- saltar --- */
    if (this.onGround) this.coyote = PHYS.coyote; else this.coyote = Math.max(0, this.coyote - dt);
    if (this.onGround) this.airJumps = 1;
    if (this.jumpBuf > 0 && this.coyote > 0 && canAct) {
      this.vy = Math.min(this.vy, 0) - PHYS.jumpV * jumpF(this.mass) * (this.surface === 'glue' ? 0.72 : 1);
      this.jumpBuf = 0; this.coyote = 0; this.onGround = false; this.jumping = true; this.jumpCut = false;
      this.emit('jump');
    } else if (jumpPressed && canAct && !this.onGround && this.coyote <= 0 && this.airJumps > 0 && game.rope && game.rope.visible
      && this.mass > PHYS.minBody + PHYS.airJumpCost + 0.05 && game.rope.len < PHYS.maxRope * PHYS.unit - PHYS.airJumpCost * PHYS.unit) {
      // salto doble: escupes un poquito de chicle al hilo y te impulsas (a ras del piso, mejor esperar el salto normal)
      const gap = ARENA.groundBelow(this.x, this.y + this.r) - (this.y + this.r);
      if (!(this.vy > 0 && gap < 46)) {
        this.airJumps--;
        this.setMass(this.mass - PHYS.airJumpCost); game.rope.len += PHYS.airJumpCost * PHYS.unit;
        this.vy = Math.min(this.vy, 0) - PHYS.jumpV * jumpF(this.mass) * PHYS.airJumpF;
        this.jumpBuf = 0; this.jumping = true; this.jumpCut = true; this.diveT = 0;
        this.emit('airjump');
      }
    }
    if (this.jumping && !inp.jump && this.vy < 0 && !this.jumpCut) { this.vy *= 0.5; this.jumpCut = true; }
    if (this.vy >= 0) this.jumping = false;

    const sp = Math.hypot(this.vx, this.vy);
    if (sp > PHYS.maxV) { this.vx *= PHYS.maxV / sp; this.vy *= PHYS.maxV / sp; }

    this.x += this.vx * dt; this.y += this.vy * dt;
    const wasGround = this.onGround;
    const vBefore = Math.hypot(this.vx, this.vy);
    this.contacts = ARENA.collideCircle(this, prevY);
    const sp2 = Math.hypot(this.vx, this.vy);
    if (sp2 > PHYS.maxV) { this.vx *= PHYS.maxV / sp2; this.vy *= PHYS.maxV / sp2; }
    const gc = this.contacts.find(c => c.ny < -0.55);
    this.onGround = !!gc;
    this.groundR = gc ? gc.R : null;
    if (gc && gc.R.bounce && !(inp.stick && canAct)) {
      const jf = clamp(Math.pow(3 / this.mass, 0.22), 0.78, 1.25);
      this.vy = -gc.R.bounce * jf; this.onGround = false; this.groundR = null; this.coyote = 0;
      this.jumping = false; this.jumpCut = true;
      if (this.jumpBuf > 0 && canAct) { this.vy -= 330; this.jumpBuf = 0; } // salto a tiempo: más alto
      gc.R.squish = 1;
      this.emit('bounce', { impact: gc.impact || 0 });
    }
    let impact = 0; for (const c of this.contacts) impact = Math.max(impact, c.impact || 0);
    this.lastImpact = impact;
    if (impact > 280 && (!wasGround || impact > 700)) {
      const c = this.contacts.reduce((a, b) => ((b.impact || 0) > (a.impact || 0) ? b : a));
      this.emit('land', { impact, nx: c.nx, ny: c.ny });
    }
  }

  unstick(reason, strain = 1, game = null) {
    this.stuck = false;
    this.stickCd = reason === 'rip' ? 0.45 : reason === 'dry' ? 0.7 : 0.1;
    const n = this.stuckN;
    if (reason === 'jump') {
      const jf = jumpF(this.mass);
      if (this.stuckR && this.stuckR.hold) {
        // anillas y manecillas: el salto sale hacia arriba y hacia donde aprietas (no te rebota al revés)
        this.vy = -PHYS.jumpV * jf * 0.95; this.vx = (this.moveDir || 0) * 430 * speedF(this.mass);
      } else if (Math.abs(n.x) > 0.6) { this.vx = n.x * 620 * speedF(this.mass); this.vy = -PHYS.jumpV * jf * 0.86; }
      else if (n.y > 0.6) { this.vy = 250; }
      else { this.vy = -PHYS.jumpV * jf; }
      this.jumping = true; this.jumpCut = false;
      this.emit('jump');
    }
    // el chicle estirado "chasquea" y te lanza hacia el otro lado del hilo.
    // Soltarse a propósito usa la carga (la flecha); despegarse sin querer, solo lo estirado.
    const voluntary = reason === 'let' || reason === 'jump';
    const strainB = strain > 1.08 ? clamp((strain - 1.04) * 4200, 0, 1350) : 0;
    const chargeB = voluntary && this.charge >= PHYS.slingReady ? 520 + 900 * this.charge : 0;
    const boost = reason === 'hit' ? 0 : Math.max(strainB, chargeB);
    if (boost > 0) {
      let d = this.ropeDir, lift = Math.min(320, boost * 0.3);
      // si el hilo va casi derecho al rival, apuntar a su cuerpo (con la caída justa para llegarle)
      const o = game && game.players ? game.players[1 - this.id] : null;
      if (o && o.alive && game.rope && game.rope.visible) {
        const dx = o.x - this.x, dy = o.y - this.y, dist = Math.hypot(dx, dy) || 1;
        if (game.rope.pathLen < dist * 1.18 + 30) {
          d = { x: dx / dist, y: dy / dist };
          lift = clamp(0.5 * PHYS.g * ARENA.mods.gravity * (dist / boost), 40, 320);
        }
      }
      this.vx += d.x * boost; this.vy += d.y * boost - lift;
      this.slingT = 0.9; this.slingPower = Math.max(strain, 1 + this.charge * 0.3);
      if (this.contacts.some(c => c.ny < -0.55)) this.onGround = false;
    }
    const charged = this.charge;
    this.charge = 0; this.chargeLvl = 0;
    this.emit('unstick', { reason, strain: boost > 0 ? Math.max(strain, 1.16) : strain, charged });
  }

  /* ---------------- animación visual (por cuadro) ---------------- */
  animate(dt, game, other, t) {
    // blink
    this.blinkT -= dt;
    if (this.blinkT <= 0) { this.blink = 0.13; this.blinkT = rnd(1.8, 4.8); }
    this.blink = Math.max(0, this.blink - dt);
    // mirada: al rival, o hacia donde se mueve rápido
    let lx = other ? other.x - this.x : this.facing, ly = other ? other.y - this.y : 0;
    const sp = Math.hypot(this.vx, this.vy);
    if (sp > 700) { lx = this.vx; ly = this.vy; }
    const ll = Math.hypot(lx, ly) || 1;
    this.look.x = lerp(this.look.x, lx / ll, 1 - Math.exp(-dt * 10));
    this.look.y = lerp(this.look.y, ly / ll, 1 - Math.exp(-dt * 10));

    // vértices del cuerpo blando
    const r = this.r;
    const rv = r * (this.stuck ? 1.13 : 1.07);
    const contacts = this.stuck ? [{ nx: this.stuckN.x, ny: this.stuckN.y, depth: 0 }] : this.contacts;
    const ropePull = clamp(this.ropeT / (this.mass * PHYS.g * 1.6), 0, 1);
    const rd = this.ropeDir;
    for (let i = 0; i < BODY_N; i++) {
      const u = BODY_DIRS[i];
      let target = 0;
      for (const c of contacts) {
        const cosA = -(u.x * c.nx + u.y * c.ny);
        if (cosA > 0.25) { const allowed = (r - (c.depth || 0)) / cosA; target = Math.min(target, allowed - rv); }
      }
      if (ropePull > 0.02) {
        const d = u.x * rd.x + u.y * rd.y;
        if (d > 0) target += r * 0.32 * ropePull * d * d * d;
      }
      target += Math.sin(t * 3.2 + i * 0.9 + this.id * 2) * r * 0.012;
      if (this.gripLoad > 0.7) target += Math.sin(t * 60 + i * 2) * r * 0.025 * (this.gripLoad - 0.7) * 3;
      const k = 430, c = 15;
      this.offV[i] += ((target - this.off[i]) * k - this.offV[i] * c) * dt;
      this.off[i] += this.offV[i] * dt;
    }
    // aplastarse al aterrizar (resorte escalar)
    this.sqV += (-this.sq * 380 - this.sqV * 16) * dt;
    this.sq += this.sqV * dt;
    this.sq = clamp(this.sq, -0.38, 0.38);
    // estirarse en el aire según la velocidad
    const air = !this.onGround && !this.stuck;
    const st = air ? 1 + clamp(sp / 3400, 0, 0.24) : 1;
    this.stretch = lerp(this.stretch, st, 1 - Math.exp(-dt * 12));
    if (sp > 60) this.stretchA = Math.atan2(this.vy, this.vx);
    // estela cuando va muy rápido
    if (sp > 1150 && !this.stuck) this.trail.push({ x: this.x, y: this.y, r: this.r, a: 0.45 });
    for (const g of this.trail) g.a -= dt * 2.6;
    this.trail = this.trail.filter(g => g.a > 0).slice(-10);

    // expresión
    this.exprHold = Math.max(0, this.exprHold - dt);
    if (!this.exprHold) this.expr = this.pickExpr(game, other, sp);
  }

  pickExpr(game, other, sp) {
    if (this.mood) return this.mood;
    if (this.stun > 0) return 'stun';
    const below = this.y - this.r > ARENA.deskY + 6 && (this.x < ARENA.deskLeft + 10 || this.x > ARENA.deskRight - 10);
    if (below && !this.stuck) return 'panic';
    if (this.stuck && this.gripLoad > 0.65) return 'strain';
    if (this.pulling) return 'effort';
    if (this.releasing) return 'release';
    if (this.stuck) return 'stuck';
    if (!this.onGround && sp > 1050) return 'wild';
    if (!this.onGround && this.vy > 900) return 'panic';
    if (this.mass >= 5.5 && this.onGround) return 'smug';
    return 'normal';
  }

  bump(impact, nx, ny) {
    const I = clamp(impact / 1400, 0, 1);
    this.sqV -= I * 9 * Math.max(0.3, -ny);
    for (let i = 0; i < BODY_N; i++) {
      const u = BODY_DIRS[i];
      const d = -(u.x * nx + u.y * ny);
      this.offV[i] += (d > 0 ? -d : Math.abs(u.x * ny - u.y * nx) * 0.4) * I * this.r * 9;
    }
  }

  /* ---------------- dibujo ---------------- */
  drawShadow(ctx) {
    if (!this.alive && !this.dunked) return;
    if (this.dunked) return;
    const gy = ARENA.groundBelow(this.x, this.y + this.r * 0.4);
    if (gy > 1000) return;
    const h = gy - (this.y + this.r);
    const k = clamp(1 - h / 520, 0, 1);
    if (k <= 0) return;
    ctx.save();
    ctx.fillStyle = `rgba(50,25,10,${0.24 * k})`;
    ctx.beginPath(); ctx.ellipse(this.x, gy + 2, this.r * (0.6 + 0.5 * k), this.r * 0.16 * (0.5 + 0.5 * k), 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  draw(ctx, t) {
    const c = this.col, r = this.r;
    if (this.dunked && this.dunkT > 1.4) return;
    let cx = this.x, cy = this.y;
    if (this.gripLoad > 0.75 && this.stuck) { cx += (Math.random() - 0.5) * 3; cy += (Math.random() - 0.5) * 2; }
    ctx.save();
    if (this.inv > 0 && Math.floor(t * 18) % 2 === 0) ctx.globalAlpha = 0.45;

    // estela
    for (const g of this.trail) {
      ctx.fillStyle = rgba(c.base, g.a * 0.5);
      ctx.beginPath(); ctx.arc(g.x, g.y, g.r * 0.92, 0, TAU); ctx.fill();
    }

    // hebras pegajosas hacia la superficie
    if (this.stuck) this.drawGoo(ctx, cx, cy, t);

    ctx.translate(cx, cy);
    // estirar en dirección de la velocidad
    const st = this.stretch;
    if (Math.abs(st - 1) > 0.005) { ctx.rotate(this.stretchA); ctx.scale(st, 1 / st); ctx.rotate(-this.stretchA); }
    // aplastar desde la base
    const sq = this.sq;
    ctx.translate(0, r); ctx.scale(1 - sq * 0.75, 1 + sq); ctx.translate(0, -r);

    // contorno del cuerpo
    const pts = [];
    for (let i = 0; i < BODY_N; i++) { const u = BODY_DIRS[i], rr = r + this.off[i]; pts.push({ x: u.x * rr, y: u.y * rr }); }
    const path = () => {
      ctx.beginPath();
      const n = pts.length;
      const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      let m0 = mid(pts[n - 1], pts[0]);
      ctx.moveTo(m0.x, m0.y);
      for (let i = 0; i < n; i++) { const p = pts[i], m = mid(p, pts[(i + 1) % n]); ctx.quadraticCurveTo(p.x, p.y, m.x, m.y); }
      ctx.closePath();
    };

    // sombrero (detrás)
    const topY = -(r + this.off[0]);
    this.drawHat(ctx, topY, t, true);

    path();
    const g = ctx.createRadialGradient(-r * 0.38, -r * 0.45, r * 0.05, -r * 0.1, -r * 0.1, r * 1.45);
    g.addColorStop(0, c.light); g.addColorStop(0.42, c.base); g.addColorStop(1, c.dark);
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 4.5; ctx.strokeStyle = c.deep; ctx.lineJoin = 'round'; ctx.stroke();

    // patrón y sombreado dentro del cuerpo
    ctx.save();
    path(); ctx.clip();
    this.drawPattern(ctx, r);
    // luz de borde inferior (rebote del pupitre)
    const rim = ctx.createRadialGradient(r * 0.25, r * 0.9, r * 0.2, r * 0.25, r * 0.9, r * 1.1);
    rim.addColorStop(0, 'rgba(255,230,190,0.35)'); rim.addColorStop(1, 'rgba(255,230,190,0)');
    ctx.fillStyle = rim; ctx.fillRect(-r * 1.5, -r * 1.5, r * 3, r * 3);
    ctx.restore();

    // brillo especular
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath(); ctx.ellipse(-r * 0.42, -r * 0.5, r * 0.26, r * 0.14, -0.6, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(-r * 0.13, -r * 0.68, r * 0.065, 0, TAU); ctx.fill();

    this.drawHat(ctx, topY, t, false);
    this.drawHeadAcc(ctx, r, topY, t);
    this.drawFace(ctx, r, t);
    ctx.restore();

    // medidor de pegajosidad
    if (this.alive && (this.stuck || this.sticky < 0.999)) {
      const a0 = -Math.PI / 2;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(58,34,22,0.35)';
      ctx.beginPath(); ctx.arc(this.x, this.y, r + 13, 0, TAU); ctx.stroke();
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = this.sticky < PHYS.stickMin ? '#ff6b5a' : (this.stuck ? '#ffffff' : rgba('#ffffff', 0.75));
      ctx.beginPath(); ctx.arc(this.x, this.y, r + 13, a0, a0 + TAU * clamp(this.sticky, 0, 1)); ctx.stroke();
      ctx.restore();
    }
    // carga del tirachinas: flechitas hacia donde vas a salir
    if (this.stuck && this.charge > 0.04 && this.alive) this.drawCharge(ctx, t);
    // marca 1 / 2 encima (ayuda a quien confunde colores)
    if (Player.marks && this.alive) {
      const mx = this.x, my = this.y - this.r * 1.55 - 26;
      ctx.save();
      ctx.beginPath(); ctx.moveTo(mx - 15, my - 14); ctx.lineTo(mx + 15, my - 14); ctx.lineTo(mx + 15, my + 8); ctx.lineTo(mx + 5, my + 8); ctx.lineTo(mx, my + 15); ctx.lineTo(mx - 5, my + 8); ctx.lineTo(mx - 15, my + 8); ctx.closePath();
      ctx.fillStyle = '#fff6e6'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PALETTE.ink; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.fillStyle = PALETTE.ink; ctx.font = font(17, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(this.id === 0 ? '1' : '2', mx, my - 2);
      ctx.restore();
    }
    // estrellas de aturdido
    if (this.stun > 0) {
      for (let k = 0; k < 3; k++) {
        const a = t * 6 + k * TAU / 3;
        drawStar(ctx, this.x + Math.cos(a) * r * 0.9, this.y - r - 10 + Math.sin(a) * r * 0.25, 9, '#ffd84d', a);
      }
    }
  }

  drawCharge(ctx, t) {
    const d = this.ropeDir, r = this.r, ch = this.charge;
    if (!d.x && !d.y) return;
    const ready = ch >= PHYS.slingReady, full = ch >= 1;
    const n = full ? 3 : ch >= 0.7 ? 2 : 1;
    // un poquito por encima del hilo para no taparlo
    let px = -d.y, py = d.x; if (py > 0) { px = -px; py = -py; }
    const off = r * 0.75;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const pulse = full ? 1 + 0.12 * Math.sin(t * 22) : 1;
    for (let k = 0; k < n; k++) {
      const dist = r + 18 + k * 20;
      const cx = this.x + d.x * dist + px * off, cy = this.y + d.y * dist + py * off;
      const s = (9 + k * 2) * pulse;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.atan2(d.y, d.x));
      ctx.globalAlpha = ready ? 1 : 0.35 + ch;
      ctx.beginPath(); ctx.moveTo(-s * 0.6, -s); ctx.lineTo(s * 0.5, 0); ctx.lineTo(-s * 0.6, s);
      ctx.lineWidth = 9; ctx.strokeStyle = PALETTE.ink; ctx.stroke();
      ctx.lineWidth = 5; ctx.strokeStyle = !ready ? '#ffffff' : full ? (Math.floor(t * 12) % 2 ? '#ff8a3d' : '#ffd84d') : '#ffd84d'; ctx.stroke();
      ctx.restore();
    }
    // medidor: arco que se llena alrededor
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = 5; ctx.strokeStyle = full ? '#ff8a3d' : ready ? '#ffd84d' : 'rgba(255,255,255,0.7)';
    const a0 = Math.atan2(d.y, d.x);
    ctx.beginPath(); ctx.arc(this.x, this.y, r + 6, a0 - 0.9 * ch, a0 + 0.9 * ch); ctx.stroke();
    ctx.restore();
  }

  drawGoo(ctx, cx, cy, t) {
    const n = this.stuckN, c = this.col, r = this.r;
    // punto de contacto
    const px = cx - n.x * r, py = cy - n.y * r;
    const tx = -n.y, ty = n.x;
    ctx.save();
    ctx.fillStyle = c.base; ctx.strokeStyle = c.deep; ctx.lineWidth = 3;
    // charco aplastado contra la superficie
    ctx.beginPath();
    ctx.ellipse(px, py, r * 0.95, r * 0.22, Math.atan2(ty, tx), 0, TAU);
    ctx.fill(); ctx.stroke();
    // hebras
    for (let k = -1; k <= 1; k += 2) {
      const sx = px + tx * r * 0.7 * k, sy = py + ty * r * 0.7 * k;
      const ex = cx + tx * r * 0.55 * k - n.x * r * 0.4, ey = cy + ty * r * 0.55 * k - n.y * r * 0.4;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo((sx + ex) / 2 + n.x * 4, (sy + ey) / 2 + n.y * 4, ex, ey);
      ctx.lineWidth = 6; ctx.strokeStyle = c.deep; ctx.stroke();
      ctx.lineWidth = 3.5; ctx.strokeStyle = c.base; ctx.stroke();
    }
    ctx.restore();
  }

  drawPattern(ctx, r) {
    const pat = this.col.pattern || (this.id === 0 ? 'seeds' : 'stripes');
    if (pat === 'grapes') {
      // uvitas: burbujas más claras dentro del cuerpo
      ctx.strokeStyle = rgba(this.col.light, 0.55); ctx.lineWidth = r * 0.05 + 1;
      for (const [gx, gy, gr] of [[-0.45, 0.35, 0.3], [0.1, 0.55, 0.28], [0.55, 0.2, 0.26], [-0.6, -0.25, 0.22], [0.5, -0.45, 0.2], [-0.1, -0.7, 0.18]]) {
        ctx.beginPath(); ctx.arc(gx * r, gy * r, gr * r, 0, TAU); ctx.stroke();
        ctx.fillStyle = rgba('#ffffff', 0.35); ctx.beginPath(); ctx.arc((gx - gr * 0.35) * r, (gy - gr * 0.35) * r, gr * r * 0.22, 0, TAU); ctx.fill();
      }
      return;
    }
    if (pat === 'zest') {
      // poros de cáscara de limón y un gajo claro
      ctx.fillStyle = rgba(this.col.light, 0.75);
      for (let k = 0; k < 22; k++) { const a = k * 2.4, d = 0.35 + (k % 5) * 0.12; ctx.beginPath(); ctx.arc(Math.cos(a) * d * r, Math.sin(a) * d * r, r * 0.03 + 0.8, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = rgba('#ffffff', 0.4); ctx.lineWidth = r * 0.08; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, r * 0.15, r * 0.75, 0.3, Math.PI - 0.3); ctx.stroke();
      return;
    }
    if (pat === 'blush') {
      // mango: cachete rojizo de un lado
      const g = ctx.createRadialGradient(r * 0.55, -r * 0.35, r * 0.05, r * 0.55, -r * 0.35, r * 0.95);
      g.addColorStop(0, rgba(this.col.accent, 0.75)); g.addColorStop(1, rgba(this.col.accent, 0));
      ctx.fillStyle = g; ctx.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4);
      ctx.fillStyle = rgba('#7a3b00', 0.25);
      for (const [sx, sy] of [[-0.5, 0.4], [-0.2, 0.62], [0.3, 0.55], [-0.62, 0.05]]) { ctx.beginPath(); ctx.arc(sx * r, sy * r, r * 0.035 + 0.8, 0, TAU); ctx.fill(); }
      return;
    }
    if (pat === 'fluff') {
      // algodón de azúcar: nubecitas celestes
      for (const [fx, fy, fr] of [[-0.45, -0.35, 0.3], [0.35, -0.5, 0.26], [0.55, 0.25, 0.3], [-0.5, 0.4, 0.28], [0.05, 0.6, 0.22]]) {
        const g = ctx.createRadialGradient(fx * r, fy * r, 1, fx * r, fy * r, fr * r);
        g.addColorStop(0, rgba(this.col.accent, 0.75)); g.addColorStop(1, rgba(this.col.accent, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fx * r, fy * r, fr * r, 0, TAU); ctx.fill();
      }
      return;
    }
    if (pat === 'fizz') {
      // cola: burbujitas que suben
      ctx.strokeStyle = rgba('#ffffff', 0.6); ctx.lineWidth = 1.4;
      for (let k = 0; k < 9; k++) { const bx = ((k * 37) % 13 - 6) / 7 * r * 0.75, by = ((k * 53 + (performance.now() / 40 | 0)) % 100) / 100 * -1.6 * r + 0.8 * r; if (bx * bx + by * by > r * r * 0.8) continue; ctx.beginPath(); ctx.arc(bx, by, r * 0.05 + 1, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = rgba(this.col.light, 0.25); ctx.fillRect(-r, -r * 0.95, r * 2, r * 0.25);
      return;
    }
    if (pat === 'shine') {
      // oro: brillos
      const ph = (performance.now() / 1200) % 1;
      const g = ctx.createLinearGradient(-r + ph * 2.6 * r - r, -r, ph * 2.6 * r - r, r);
      g.addColorStop(0, rgba('#ffffff', 0)); g.addColorStop(0.5, rgba('#ffffff', 0.55)); g.addColorStop(1, rgba('#ffffff', 0));
      ctx.fillStyle = g; ctx.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4);
      ctx.fillStyle = rgba('#ffffff', 0.9);
      for (const [sx, sy, ss] of [[-0.5, -0.45, 0.12], [0.45, 0.35, 0.09]]) { ctx.beginPath(); ctx.moveTo(sx * r, (sy - ss) * r); ctx.lineTo((sx + ss * 0.3) * r, sy * r); ctx.lineTo(sx * r, (sy + ss) * r); ctx.lineTo((sx - ss * 0.3) * r, sy * r); ctx.closePath(); ctx.fill(); }
      return;
    }
    if (pat === 'bumps') {
      // mora: bolitas
      for (let row = -2; row <= 2; row++) for (let col = -3; col <= 3; col++) {
        const bx = (col + (row % 2 ? 0.5 : 0)) * r * 0.32, by = row * r * 0.3;
        if (bx * bx + by * by > r * r * 0.9) continue;
        ctx.fillStyle = rgba(this.col.dark, 0.35); ctx.beginPath(); ctx.arc(bx, by, r * 0.15, 0, TAU); ctx.fill();
        ctx.fillStyle = rgba('#ffffff', 0.4); ctx.beginPath(); ctx.arc(bx - r * 0.05, by - r * 0.05, r * 0.04 + 0.6, 0, TAU); ctx.fill();
      }
      return;
    }
    if (pat === 'seeds') {
      // semillitas de fresa
      const seeds = [[-0.62, -0.42], [0.58, -0.46], [-0.78, 0.12], [0.76, 0.16], [-0.46, 0.62], [0.42, 0.66], [0.02, 0.8], [-0.2, -0.8], [0.26, -0.78], [-0.86, -0.18], [0.88, -0.16]];
      for (const [sx, sy] of seeds) {
        ctx.save(); ctx.translate(sx * r, sy * r); ctx.rotate(Math.atan2(sy, sx) + Math.PI / 2);
        ctx.fillStyle = this.col.accent; ctx.strokeStyle = rgba(this.col.deep, 0.5); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.ellipse(0, 0, r * 0.045 + 1, r * 0.075 + 1.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    } else {
      // rayas de menta
      ctx.strokeStyle = 'rgba(233,255,250,0.5)'; ctx.lineCap = 'round';
      ctx.lineWidth = r * 0.13;
      ctx.beginPath(); ctx.moveTo(-r * 1.1, -r * 0.55); ctx.quadraticCurveTo(0, -r * 0.85, r * 1.1, -r * 0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 1.1, r * 0.55); ctx.quadraticCurveTo(0, r * 0.85, r * 1.1, r * 0.5); ctx.stroke();
      ctx.lineWidth = r * 0.07;
      ctx.beginPath(); ctx.moveTo(-r * 1.1, r * 0.82); ctx.quadraticCurveTo(0, r * 1.05, r * 1.1, r * 0.8); ctx.stroke();
    }
  }

  drawHat(ctx, topY, t, back) {
    if (this.acc === 'gorra' || this.acc === 'corona' || this.acc === 'birrete' || this.acc === 'chef') return; // el accesorio reemplaza el sombrerito
    const c = this.col, r = this.r;
    const s = 0.42 * r + 6;
    const sway = Math.sin(t * 2.4 + this.id) * 0.08 - clamp(this.vx / 3000, -0.3, 0.3);
    ctx.save();
    ctx.translate(0, topY + 3);
    ctx.rotate(sway);
    ctx.lineJoin = 'round';
    const hat = c.hatType || (this.id === 0 ? 'crown' : 'leaves');
    if (hat === 'stick' || hat === 'cap' || hat === 'star') {
      if (!back) {
        if (hat === 'stick') { ctx.beginPath(); ctx.moveTo(0, s * 0.1); ctx.lineTo(s * 0.05, -s * 0.7); ctx.lineCap = 'round'; ctx.lineWidth = 7; ctx.strokeStyle = c.hatDark; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = c.hat; ctx.stroke(); }
        else if (hat === 'cap') { ctx.beginPath(); ctx.ellipse(0, -s * 0.12, s * 0.42, s * 0.16, 0, 0, TAU); ctx.fillStyle = c.hat; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = c.hatDark; ctx.stroke(); for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(k * s * 0.12, -s * 0.24); ctx.lineTo(k * s * 0.12, -s * 0.02); ctx.lineWidth = 1.5; ctx.stroke(); } }
        else { ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr2 = k % 2 ? s * 0.18 : s * 0.42; ctx.lineTo(Math.cos(a) * rr2, -s * 0.45 + Math.sin(a) * rr2); } ctx.closePath(); ctx.fillStyle = c.hat; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = c.hatDark; ctx.stroke(); }
      }
    } else if (hat === 'stem' || hat === 'leaf') {
      if (!back) {
        if (hat === 'stem') {
          // palito café con una hoja
          ctx.beginPath(); ctx.moveTo(0, s * 0.05); ctx.quadraticCurveTo(s * 0.05, -s * 0.3, -s * 0.06, -s * 0.5);
          ctx.lineCap = 'round'; ctx.lineWidth = 7; ctx.strokeStyle = '#3d2410'; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#8a5a2b'; ctx.stroke();
        }
        ctx.save(); ctx.translate(hat === 'stem' ? 0 : -s * 0.05, hat === 'stem' ? -s * 0.3 : -s * 0.02); ctx.rotate(hat === 'stem' ? 0.9 : 0.5);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s * 0.4, -s * 0.3, 0, -s * 0.95); ctx.quadraticCurveTo(-s * 0.4, -s * 0.3, 0, 0); ctx.closePath();
        ctx.fillStyle = c.hat; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = c.hatDark; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, -s * 0.05); ctx.lineTo(0, -s * 0.8); ctx.lineWidth = 1.6; ctx.stroke();
        ctx.restore();
      }
    } else if (hat === 'crown') {
      // corona de fresa: hojas en estrella
      if (back) {
        for (let k = 0; k < 5; k++) {
          const a = -Math.PI / 2 + (k - 2) * 0.62;
          ctx.save(); ctx.rotate(a + Math.PI / 2);
          ctx.beginPath(); ctx.moveTo(-s * 0.18, 0); ctx.quadraticCurveTo(-s * 0.22, -s * 0.55, 0, -s * 0.78); ctx.quadraticCurveTo(s * 0.22, -s * 0.55, s * 0.18, 0); ctx.closePath();
          ctx.fillStyle = k % 2 ? c.hat : mixHex(c.hat, '#ffffff', 0.12); ctx.fill();
          ctx.lineWidth = 3; ctx.strokeStyle = c.hatDark; ctx.stroke();
          ctx.restore();
        }
      } else {
        ctx.beginPath(); ctx.moveTo(0, -s * 0.05); ctx.quadraticCurveTo(s * 0.12, -s * 0.45, s * 0.3, -s * 0.55);
        ctx.lineWidth = 5; ctx.strokeStyle = c.hatDark; ctx.lineCap = 'round'; ctx.stroke();
        ctx.lineWidth = 2.5; ctx.strokeStyle = c.hat; ctx.stroke();
      }
    } else {
      // hojitas de menta
      if (!back) {
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s * 0.35);
        ctx.lineWidth = 5; ctx.strokeStyle = c.hatDark; ctx.lineCap = 'round'; ctx.stroke();
        ctx.lineWidth = 2.5; ctx.strokeStyle = c.hat; ctx.stroke();
        for (const side of [-1, 1]) {
          ctx.save(); ctx.translate(0, -s * 0.3); ctx.rotate(side * 0.95);
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s * 0.32, -s * 0.28, 0, -s * 0.85); ctx.quadraticCurveTo(-s * 0.32, -s * 0.28, 0, 0); ctx.closePath();
          ctx.fillStyle = side < 0 ? c.hat : mixHex(c.hat, '#ffffff', 0.15); ctx.fill();
          ctx.lineWidth = 3; ctx.strokeStyle = c.hatDark; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, -s * 0.05); ctx.lineTo(0, -s * 0.7); ctx.lineWidth = 1.6; ctx.stroke();
          ctx.restore();
        }
      }
    }
    ctx.restore();
  }

  drawFace(ctx, r, t) {
    const c = this.col, ink = '#2b1610';
    const expr = this.expr;
    const lx = this.look.x, ly = this.look.y;
    const fx = clamp(lx, -1, 1) * r * 0.14, fy = -r * 0.06 + clamp(ly, -1, 1) * r * 0.08;
    const eyeR = 4.5 + r * 0.175;
    const sep = r * 0.36;
    ctx.save();
    ctx.translate(fx, fy);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    // cachetes
    ctx.fillStyle = 'rgba(255,95,140,0.32)';
    ctx.beginPath(); ctx.ellipse(-sep * 1.25, eyeR * 1.35, eyeR * 0.75, eyeR * 0.42, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(sep * 1.25, eyeR * 1.35, eyeR * 0.75, eyeR * 0.42, 0, 0, TAU); ctx.fill();

    const eye = (ex, side) => {
      ctx.save(); ctx.translate(ex, 0);
      if (expr === 'stun') {
        ctx.strokeStyle = ink; ctx.lineWidth = 2.6;
        ctx.beginPath();
        for (let a = 0; a < TAU * 2; a += 0.3) { const rr = eyeR * 0.9 * a / (TAU * 2); const aa = a + t * 9 * side; a ? ctx.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr) : ctx.moveTo(0, 0); }
        ctx.stroke(); ctx.restore(); return;
      }
      if (expr === 'happy') {
        ctx.strokeStyle = ink; ctx.lineWidth = 3.4;
        ctx.beginPath(); ctx.arc(0, eyeR * 0.35, eyeR * 0.75, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
        ctx.restore(); return;
      }
      const wide = expr === 'panic' || expr === 'wild' ? 1.18 : 1;
      const ew = eyeR * wide, eh = eyeR * 1.15 * wide;
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = ink; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.ellipse(0, 0, ew, eh, 0, 0, TAU); ctx.fill(); ctx.stroke();
      const pr = eyeR * (expr === 'panic' ? 0.36 : expr === 'wild' ? 0.5 : 0.56);
      const px = clamp(lx, -1, 1) * ew * 0.38, py = clamp(ly, -1, 1) * eh * 0.36;
      ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(px, py, pr, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px - pr * 0.35, py - pr * 0.4, pr * 0.34, 0, TAU); ctx.fill();
      // párpados
      let lid = 0, slant = 0;
      if (expr === 'effort' || expr === 'strain') { lid = 0.48; slant = -side * 0.42; }
      else if (expr === 'stuck') { lid = 0.32; slant = -side * 0.25; }
      else if (expr === 'smug') { lid = 0.5; slant = side * 0.1; }
      else if (expr === 'release') { lid = 0.42; slant = side * 0.18; }
      else if (expr === 'sad') { lid = 0.38; slant = side * 0.35; }
      if (this.blink > 0 && expr !== 'stun') lid = 1.05;
      if (lid > 0) {
        ctx.save();
        ctx.beginPath(); ctx.ellipse(0, 0, ew + 1, eh + 1, 0, 0, TAU); ctx.clip();
        ctx.rotate(slant);
        ctx.fillStyle = c.base;
        ctx.fillRect(-ew * 1.6, -eh * 1.6, ew * 3.2, eh * 1.6 + (lid * 2 - 1) * eh);
        ctx.strokeStyle = ink; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.moveTo(-ew * 1.3, (lid * 2 - 1) * eh); ctx.lineTo(ew * 1.3, (lid * 2 - 1) * eh); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    };
    eye(-sep, -1); eye(sep, 1);

    // cejas
    if (expr === 'effort' || expr === 'strain' || expr === 'stuck') {
      ctx.strokeStyle = ink; ctx.lineWidth = 3.4;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * (sep + eyeR * 0.9), -eyeR * 1.55); ctx.lineTo(s * (sep - eyeR * 0.6), -eyeR * 1.05); ctx.stroke(); }
    } else if (expr === 'panic' || expr === 'sad') {
      ctx.strokeStyle = ink; ctx.lineWidth = 3;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * (sep + eyeR * 0.8), -eyeR * 1.35); ctx.lineTo(s * (sep - eyeR * 0.5), -eyeR * 1.8); ctx.stroke(); }
    }

    // boca
    const my = eyeR * 1.7, mw = r * 0.2;
    ctx.strokeStyle = ink; ctx.lineWidth = 2.8; ctx.fillStyle = '#7a1f2e';
    switch (expr) {
      case 'effort':
      case 'strain': {
        ctx.fillStyle = '#ffffff';
        ArenaArt.rr(ctx, -mw * 1.05, my - eyeR * 0.32, mw * 2.1, eyeR * 0.72, 4); ctx.fill(); ctx.stroke();
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(-mw * 1.05, my + eyeR * 0.04); ctx.lineTo(mw * 1.05, my + eyeR * 0.04); ctx.stroke();
        for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(k * mw * 0.5, my - eyeR * 0.32); ctx.lineTo(k * mw * 0.5, my + eyeR * 0.4); ctx.stroke(); }
        if (expr === 'strain') { ctx.fillStyle = 'rgba(160,220,255,0.9)'; ctx.beginPath(); ctx.ellipse(sep + eyeR * 1.4, -eyeR * 1.2 + (t * 30 % 10), 3, 5, 0, 0, TAU); ctx.fill(); }
        break;
      }
      case 'panic':
      case 'wild': {
        ctx.beginPath(); ctx.ellipse(0, my + eyeR * 0.1, mw * (expr === 'wild' ? 0.9 : 0.6), eyeR * (expr === 'wild' ? 0.75 : 0.85), 0, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ff7b93'; ctx.beginPath(); ctx.ellipse(0, my + eyeR * 0.55, mw * 0.4, eyeR * 0.28, 0, 0, TAU); ctx.fill();
        break;
      }
      case 'release': {
        ctx.beginPath(); ctx.ellipse(mw * 0.2, my + 1, mw * 0.32, eyeR * 0.36, 0, 0, TAU); ctx.fill(); ctx.stroke();
        break;
      }
      case 'stuck': {
        ctx.beginPath(); ctx.moveTo(-mw * 0.8, my + 2); ctx.quadraticCurveTo(0, my - 2, mw * 0.8, my + 2); ctx.stroke();
        break;
      }
      case 'smug': {
        ctx.beginPath(); ctx.moveTo(-mw * 0.8, my + 1); ctx.quadraticCurveTo(mw * 0.2, my + eyeR * 0.5, mw * 1.0, my - eyeR * 0.3); ctx.stroke();
        break;
      }
      case 'stun': {
        ctx.beginPath();
        for (let k = 0; k <= 8; k++) { const x = -mw + k * mw / 4, y = my + Math.sin(k * 1.6 + t * 12) * 2.5; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
        break;
      }
      case 'happy': {
        ctx.beginPath(); ctx.moveTo(-mw * 1.2, my - 2); ctx.quadraticCurveTo(0, my + eyeR * 1.6, mw * 1.2, my - 2); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ff7b93'; ctx.beginPath(); ctx.ellipse(0, my + eyeR * 0.7, mw * 0.5, eyeR * 0.3, 0, 0, TAU); ctx.fill();
        break;
      }
      case 'sad': {
        ctx.beginPath(); ctx.moveTo(-mw * 0.8, my + eyeR * 0.5); ctx.quadraticCurveTo(0, my - eyeR * 0.3, mw * 0.8, my + eyeR * 0.5); ctx.stroke();
        break;
      }
      default: {
        ctx.beginPath(); ctx.moveTo(-mw, my - 1); ctx.quadraticCurveTo(0, my + eyeR * 0.85, mw, my - 1); ctx.stroke();
      }
    }
    // accesorios de la cara
    if (this.acc === 'lentes') {
      ctx.strokeStyle = ink; ctx.lineWidth = 3.2;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * sep, 0, eyeR * 1.42, 0, TAU); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(-sep + eyeR * 1.42, -eyeR * 0.2); ctx.quadraticCurveTo(0, -eyeR * 0.6, sep - eyeR * 1.42, -eyeR * 0.2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * sep, 0, eyeR * 1.15, -2.4, -1.7); ctx.stroke(); }
    } else if (this.acc === 'bigote') {
      ctx.fillStyle = '#4a2c1a'; ctx.strokeStyle = ink; ctx.lineWidth = 2;
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(0, my - eyeR * 0.55);
        ctx.quadraticCurveTo(s * mw * 1.2, my - eyeR * 1.1, s * mw * 2.1, my - eyeR * 0.35);
        ctx.quadraticCurveTo(s * mw * 1.3, my - eyeR * 0.2, 0, my - eyeR * 0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    }
    ctx.restore();
  }

  // accesorios de la cabeza (se ganan con logros)
  drawHeadAcc(ctx, r, topY, t) {
    const a = this.acc;
    if (!a || a === 'ninguno' || a === 'lentes' || a === 'bigote') return;
    const ink = PALETTE.ink;
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (a === 'gorra') {
      const f = this.facing || 1;
      ctx.beginPath(); ctx.arc(0, topY + r * 0.42, r * 0.78, Math.PI * 1.08, Math.PI * 1.92);
      ctx.closePath(); ctx.fillStyle = '#e0483a'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = ink; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(f * r * 0.62, topY + r * 0.36, r * 0.48, r * 0.1, f * 0.12, 0, TAU); ctx.fillStyle = '#b5322a'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, topY + r * 0.02, r * 0.08, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(-r * 0.3, topY + r * 0.2, r * 0.18, r * 0.07, -0.5, 0, TAU); ctx.fill();
    } else if (a === 'corona') {
      const s = r * 0.5, y = topY + r * 0.08;
      ctx.beginPath();
      ctx.moveTo(-s, y); ctx.lineTo(-s, y - s * 0.7); ctx.lineTo(-s * 0.5, y - s * 0.3); ctx.lineTo(0, y - s * 0.95); ctx.lineTo(s * 0.5, y - s * 0.3); ctx.lineTo(s, y - s * 0.7); ctx.lineTo(s, y); ctx.closePath();
      ctx.fillStyle = '#ffd84d'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = ink; ctx.stroke();
      for (const gx of [-s * 0.5, 0, s * 0.5]) { ctx.beginPath(); ctx.arc(gx, y - s * 0.15, s * 0.1, 0, TAU); ctx.fillStyle = gx ? '#4aa3ff' : '#ff5c5c'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); }
    } else if (a === 'audifonos') {
      ctx.beginPath(); ctx.arc(0, topY + r * 0.95, r * 1.02, Math.PI * 1.12, Math.PI * 1.88);
      ctx.lineWidth = 9; ctx.strokeStyle = ink; ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = '#3d4a63'; ctx.stroke();
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.ellipse(s * r * 0.92, topY + r * 0.95, r * 0.17, r * 0.27, 0, 0, TAU);
        ctx.fillStyle = '#ff5c9d'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
      }
    } else if (a === 'birrete') {
      // birrete de graduación con borla
      const y = topY + r * 0.18, w = r * 0.95;
      ctx.beginPath(); ctx.ellipse(0, y + r * 0.08, r * 0.5, r * 0.2, 0, 0, TAU); ctx.fillStyle = '#2b2b3a'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-w, y - r * 0.05); ctx.lineTo(0, y - r * 0.32); ctx.lineTo(w, y - r * 0.05); ctx.lineTo(0, y + r * 0.2); ctx.closePath(); ctx.fillStyle = '#34344a'; ctx.fill(); ctx.stroke();
      const sw = Math.sin(t * 3 + this.id) * 0.2;
      ctx.beginPath(); ctx.moveTo(0, y - r * 0.06); ctx.lineTo(w * 0.7 + sw * 10, y + r * 0.1); ctx.lineTo(w * 0.72 + sw * 12, y + r * 0.45); ctx.lineWidth = 2.5; ctx.strokeStyle = '#ffd84d'; ctx.stroke();
      ctx.beginPath(); ctx.arc(w * 0.72 + sw * 12, y + r * 0.5, r * 0.08, 0, TAU); ctx.fillStyle = '#ffd84d'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = ink; ctx.stroke();
    } else if (a === 'vincha') {
      // vincha deportiva
      ctx.beginPath(); ctx.arc(0, topY + r * 1.0, r * 0.98, Math.PI * 1.2, Math.PI * 1.8); ctx.lineWidth = r * 0.24; ctx.strokeStyle = ink; ctx.stroke(); ctx.lineWidth = r * 0.17; ctx.strokeStyle = '#ffffff'; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, topY + r * 1.0, r * 0.98, Math.PI * 1.42, Math.PI * 1.58); ctx.lineWidth = r * 0.17; ctx.strokeStyle = '#e5533d'; ctx.stroke();
    } else if (a === 'chef') {
      // gorro de chef
      const y = topY + r * 0.15;
      ArenaArt.rr(ctx, -r * 0.42, y - r * 0.25, r * 0.84, r * 0.3, r * 0.06); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
      ctx.beginPath(); for (const [cx, cy, cr] of [[-0.32, -0.42, 0.26], [0, -0.58, 0.3], [0.32, -0.42, 0.26]]) { ctx.moveTo((cx + cr) * r, y + cy * r); ctx.arc(cx * r, y + cy * r, cr * r, 0, TAU); }
      ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(58,34,22,0.12)'; ctx.fillRect(-r * 0.38, y - r * 0.18, r * 0.76, r * 0.06);
    } else if (a === 'mono') {
      ctx.save(); ctx.translate(r * 0.5, topY + r * 0.2); ctx.rotate(0.35);
      const s = r * 0.32;
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(d * s * 1.3, -s * 0.9, d * s * 1.4, 0); ctx.quadraticCurveTo(d * s * 1.3, s * 0.9, 0, 0); ctx.fillStyle = '#ff4f7b'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, 0, s * 0.3, 0, TAU); ctx.fillStyle = '#ff8fab'; ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    void t;
  }
}

Player.marks = Store.get('marks', false);

function drawStar(ctx, x, y, r, color, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r; const a = i / 10 * TAU - Math.PI / 2; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = PALETTE.ink; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}
