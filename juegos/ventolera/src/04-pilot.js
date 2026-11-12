/* =========================================================================
   LA MÁQUINA — piloto automático que pelea con las mismas reglas que un
   jugador: devuelve { dx, dy, fire, boost, missile, roll, rdx, rdy }.
   Prioridades: no estrellarse → esquivar misiles (tonel o giro brusco) →
   buscar cajas si le hacen falta → perseguir con puntería adelantada.
   En difícil usa técnicas: derrapa para disparar de espaldas, frena en
   cobra cuando lo persiguen de cerca y vuela a ras para recargar turbo.
   level 0 (fácil) … 2 (difícil).
   ========================================================================= */
class Bot {
  constructor(bird, seed, level = 1) {
    this.b = bird; this.rng = makeRng(seed || 1); this.level = level;
    this.think_t = 0; this.noise = 0; this.noiseK = 0.5; this.trigger = true; this.willEvade = true;
    this.mCd = 1.5; this.rollCd = 0; this.cobraT = 0; this.wander = null; this.restT = 0; this.aim = bird.a;
  }
  danger(G) {
    const b = this.b, W = G.world;
    if (W.buildings) return this.dangerCity(G);
    for (const look of [0.18, 0.36, 0.55]) {
      const fx = b.x + b.vx * look, fy = b.y + b.vy * look;
      if (fy > W.groundY(fx) - 130) return Math.cos(b.va) >= 0 ? -0.9 : Math.PI + 0.9;
    }
    const v2 = b.vx * b.vx + b.vy * b.vy || 1;
    for (const P of W.palms) {
      const C = P.crown; if (C.gone) continue;
      const rx = C.x - b.x, ry = C.y - b.y, tca = clamp((rx * b.vx + ry * b.vy) / v2, 0, 0.7);
      if (Math.hypot(rx - b.vx * tca, ry - b.vy * tca) < C.r * 0.55 + b.r + 46) { const cross = b.vx * ry - b.vy * rx; return b.va - Math.sign(cross || 1) * 1.2; }
    }
    return null;
  }
  modeGoal(G, o) {
    const b = this.b, W = G.world;
    if (G.mode === 'boss' && G.boss) {
      // compañera: a la parte que se pueda fijar, sin pegarse al casco
      const B = G.boss, list = Boss.lockables(G);
      let best = null, bs = Infinity;
      for (const P of list) { const d = Math.hypot(P.x - b.x, P.y - b.y), s = d + (P.kind === 'core' ? -300 : P.kind === 'turret' ? -120 : 0); if (s < bs) { bs = s; best = P; } }
      if (!best) return null;
      const d = Math.hypot(best.x - b.x, best.y - b.y), eh = Math.hypot((b.x - B.x) / (Boss.RX + 200), (b.y - B.y) / (Boss.RY + 200));
      if (eh < 1) { const ax = b.x - B.x, ay = b.y - B.y, l = Math.hypot(ax, ay) || 1; return { x: b.x + ax / l * 300, y: b.y + ay / l * 300, d, boost: true, tag: 'apartarse' }; }
      return { x: best.x, y: best.y, d, shoot: true, boost: d > 900, tag: 'jefe' };
    }
    const dO = Math.hypot(o.x - b.x, o.y - b.y);
    const cap = (x, y) => (W.buildings ? Math.min(y, this.roofLine(W, x)) : y);
    if (G.tm) return Team.botGoal(this, G, o);
    if (G.mode === 'race' && G.gates) {
      // carrera: al próximo aro; ya cerca, apunta un poco hacia el que sigue para salir derecho
      const n = G.gates.length, k = Math.floor(G.score[b.id]), g = G.gates[k % n], h = G.gates[(k + 1) % n];
      const d = Math.hypot(g.x - b.x, g.y - b.y);
      let tx = g.x, ty = g.y;
      // sigue la ruta calculada: el punto más adelantado que se vea en línea recta
      const P = G.racePaths && G.racePaths[k % n];
      if (P && P.length > 1) {
        if (!this.rp || this.rp.k !== k) this.rp = { k, i: 0 };
        while (this.rp.i < P.length - 1 && Math.hypot(P[this.rp.i].x - b.x, P[this.rp.i].y - b.y) < 110) this.rp.i++;
        let pick = this.rp.i;
        for (let j = Math.min(P.length - 1, this.rp.i + 4); j > this.rp.i; j--) if (Modes.clearLine(W, b.x, b.y, P[j].x, P[j].y, 24)) { pick = j; break; }
        if (pick > this.rp.i) this.rp.i = pick;
        tx = P[pick].x; ty = P[pick].y;
      }
      if (d < 220 && Modes.clearLine(W, b.x, b.y, g.x, g.y, 20)) { const hx = h.x - g.x, hy = h.y - g.y, hl = Math.hypot(hx, hy) || 1; tx = g.x + hx / hl * 90; ty = g.y + hy / hl * 90; }
      // dispara si el otro le queda adelante (de paso)
      const ao = Math.atan2(o.y - b.y, o.x - b.x), front = o.alive && dO < 650 && Math.abs(angDiff(b.a, ao)) < 0.2;
      // aros estrechos (bajo los arcos): llegar sin turbo y más despacio para no pasarse de largo
      const tight = g.r < 74 && d < 650;
      return { x: tx, y: ty, d: front ? dO : d, boost: tight ? b.s < 380 : d > 380 || b.s < 520, shoot: front, tag: 'carrera' };
    }
    if (G.mode === 'targets' && G.targets) {
      // si el rival está encima y adelante, pelear; si no, al blanco que más convenga
      if (dO < 420 && Math.abs(angDiff(b.a, Math.atan2(o.y - b.y, o.x - b.x))) < 0.6) return null;
      let best = null, bs = Infinity;
      for (const T of G.targets) { if (!T.alive) continue; const d = Math.hypot(T.x - b.x, T.y - b.y), s = d - (T.pts || 1) * 180 + Math.abs(angDiff(b.va, Math.atan2(T.y - b.y, T.x - b.x))) * 180; if (s < bs) { bs = s; best = T; } }
      if (!best) return null;
      const d = Math.hypot(best.x - b.x, best.y - b.y), lead = d / 1650;
      return { x: best.x + (best.vx || 0) * lead, y: best.y + (best.vy || 0) * lead, d, shoot: true, boost: d > 900, tag: 'blanco' };
    }
    if (G.mode === 'case' && G.case) {
      const C = G.case;
      if (C.carrier < 0) { const d = Math.hypot(C.x - b.x, C.y - b.y); return { x: C.x, y: C.y, d, boost: d > 450, tag: 'maletin' }; }
      if (C.carrier === b.id) {
        // con el maletín: alejarse del otro, alto y por donde haya espacio
        const ax = b.x - o.x, ay = b.y - o.y, l = Math.hypot(ax, ay) || 1;
        let fx = clamp(b.x + ax / l * 700, 500, W.w - 500), fy = clamp(b.y + ay / l * 300 - 150, W.ceil + 250, W.groundY(fx) - 400);
        if (fx === 500 || fx === W.w - 500) fx = W.w - fx;
        return { x: fx, y: cap(fx, fy), d: l, boost: dO < 550, tag: 'huir' };
      }
      // el otro lo lleva: de cerca, embestirlo para robarlo
      if (dO < 320) return { x: o.x, y: o.y, d: dO, boost: true, tag: 'embestir' };
    }
    return null;
  }
  roofLine(W, x) {
    let y = W.groundY(x) - 320;
    for (const B of W.buildings) if (x > B.x0 - 220 && x < B.x1 + 220) y = Math.min(y, B.top - 110);
    return y;
  }
  // en la ciudad: si lo que viene es un choque, prueba 16 rumbos y toma el más despejado (prefiriendo girar poco)
  blocked(W, x, y, r, m = 60) {
    // si ya va bajito, solo cuenta como choque bajar más (si no, ningún rumbo serviría para salir)
    const b = this.b, gm = Math.min(m, Math.max(4, W.groundY(b.x) - b.y - 12));
    if (y > W.groundY(x) - gm) return true;
    if (W.storm && Weather.danger(W, x, y)) return true;
    if (W.coast && Coast.danger(W, x, y)) return true;
    // la máquina no se mete por debajo de las torres (eso queda para los valientes), salvo para salir de ahí
    for (const B of W.buildings) if (!B.raceOK && x > B.x0 - 40 && x < B.x1 + 40 && y > B.bottom - 30 && !(b.x > B.x0 - 40 && b.x < B.x1 + 40 && b.y > B.bottom - 30)) return true;
    return !!World.contact(W, x, y, r);
  }
  dangerCity(G) {
    const b = this.b, W = G.world, r = b.r + 20;
    // ¿se viene un choque siguiendo así? (más lejos cuanto más rápido)
    const horizon = clamp(b.s / 1100, 0.45, 0.85);
    let hit = false;
    for (let t = 0.1; t <= horizon; t += 0.12) if (this.blocked(W, b.x + b.vx * t, b.y + b.vy * t, r)) { hit = true; break; }
    if (!hit) return null;
    // simula 16 rumbos con giro realista: la trayectoria gira hacia el rumbo a lo sumo aero/velocidad rad/s
    const sp = Math.max(b.s, 250), wMax = b.sp.aero / Math.max(sp, 230);
    let best = null, bestScore = -Infinity;
    for (let k = 0; k < 16; k++) {
      const ang = b.va + (k - 8) * TAU / 16;
      let x = b.x, y = b.y, va = b.va, clear = 0.9;
      for (let t = 0.05; t <= 0.9; t += 0.05) {
        va += clamp(angDiff(va, ang), -wMax * 0.05, wMax * 0.05);
        x += Math.cos(va) * sp * 0.05; y += Math.sin(va) * sp * 0.05;
        if (this.blocked(W, x, y, b.r + 8, 30)) { clear = t - 0.05; break; }
      }
      const turn = Math.abs(angDiff(b.va, ang)), cy = Math.sin(ang), weak = b.fuel < 0.2;
      const nearGround = W.groundY(b.x) - b.y < 380;
      const score = clear * 10 - turn * 0.8 - (weak && cy < -0.85 && b.s < 380 ? 2 : 0) - (nearGround ? cy * 2.2 : 0);
      if (score > bestScore) { bestScore = score; best = ang; }
    }
    this.brake = bestScore < 5; // ningún rumbo libre del todo: frenar (sin turbo, de lado) para cerrar el giro
    return best;
  }
  think(dt, G) {
    const b = this.b, W = G.world, r = this.rng, L = this.level, out = emptyInput();
    if (!b.alive) return out;
    if (b.perch) {
      this.restT += dt;
      if (this.restT > 0.4 + r() * 0.8) {
        // con techo encima (bajo el viaducto) sale de lado; si no, despega hacia arriba
        let f = b.facing; const roofed = World.solidAt(W, b.x, b.y - 110, b.r);
        if (roofed && World.solidAt(W, b.x + f * 160, b.y - 20, b.r)) f = -f;
        out.dx = roofed ? f : f * 0.5; out.dy = roofed ? -0.2 : -1; out.boost = true; this.restT = 0;
      }
      return out;
    }
    const o = G.birds[1 - b.id], fight = G.canFight && (G.mode === 'boss' ? !!(G.boss && !G.boss.dead) : G.mode === 'race' || G.tm ? true : o && o.alive);
    this.mCd -= dt; this.rollCd -= dt; this.cobraT -= dt;
    this.think_t -= dt;
    if (this.think_t <= 0) {
      this.think_t = [0.22, 0.12, 0.06][L] * (0.7 + r() * 0.6);
      this.noise = (r() - 0.5) * [0.45, 0.17, 0.06][L]; this.noiseK = r();
      this.trigger = r() < [0.4, 0.75, 0.95][L]; this.willEvade = r() < [0.45, 0.85, 1][L];
    }
    let desired = this.aim, boost = false;
    const avoid = this.lastAvoid = this.danger(G), th = Combat.threat(G, b);
    if (avoid != null) {
      desired = avoid; boost = !this.brake && (b.s < 420 || b.lift < 0.6 || Math.sin(avoid) < -0.6); this.mode = 'avoid';
      // sin sustentación no sirve apuntar arriba: primero alinear con la caída para que el ala vuelva a sostener
      if (b.lift < 0.35 && b.fuel < 0.15) desired = Math.atan2(Math.sin(b.va) * 0.6, Math.cos(b.va) || 0.01);
    }
    else if (th && this.willEvade && th.d < [300, 420, 520][L] * (0.85 + 0.3 * this.noiseK) && b.flares === 0) {
      // misil encima: en normal y difícil, tonel hacia un lado justo antes del impacto; si no, giro brusco
      const ma = Math.atan2(th.m.y - b.y, th.m.x - b.x); this.mode = 'evade';
      if (L > 0 && b.rollCd <= 0 && this.rollCd <= 0 && th.d < 260) { out.roll = true; out.rdx = -Math.sin(ma); out.rdy = Math.cos(ma); if (b.y > W.groundY(b.x) - 260 && out.rdy > 0) { out.rdx = -out.rdx; out.rdy = -out.rdy; } this.rollCd = 1.2; }
      desired = ma + Math.PI / 2 * (Math.sin(ma - b.va) > 0 ? -1 : 1); boost = b.fuel > 0.15;
    } else if (fight && (this.goalM = this.modeGoal(G, o))) {
      // Blancos y Maletín: la meta no siempre es el rival
      const M = this.goalM;
      desired = Math.atan2(M.y - b.y, M.x - b.x) + this.noise * 0.5; boost = M.boost && b.fuel > 0.2; this.mode = M.tag;
      if (M.shoot) {
        const err = Math.abs(angDiff(b.a, desired));
        if (this.trigger && err < 0.22 && M.d < 760 && !b.overheat && b.heat < 0.9) out.fire = true;
        if (b.missiles > 0 && b.locked && this.mCd <= 0 && r() < [0.3, 0.7, 1][L]) { out.missile = true; this.mCd = 3 + r() * 2; }
      }
    } else if (fight) {
      let goal = null;
      const need = b.hp < b.sp.hp * 0.5 || b.missiles === 0;
      if (need) for (const c of G.crates) { const dc = Math.hypot(c.x - b.x, c.y - b.y); if (dc < 900 && (!goal || dc < goal.d)) goal = { x: c.x, y: c.y, d: dc }; }
      const dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy);
      if (goal && goal.d < d) { desired = Math.atan2(goal.y - b.y, goal.x - b.x); this.mode = 'crate'; }
      else {
        const tLead = d / 1700, kl = [0.4, 0.8, 1][L];
        let tx = o.x + o.vx * tLead * kl, ty = o.y + o.vy * tLead * kl; this.mode = 'chase';
        // en la ciudad: si el otro se mete entre los edificios, cubrirlo desde arriba en vez de seguirlo a ciegas
        if (W.buildings && d > 320) { const lim = this.roofLine(W, tx); if (ty > lim) ty = lim; }
        desired = Math.atan2(ty - b.y, tx - b.x) + this.noise;
        const err = Math.abs(angDiff(b.a, desired));
        if (d > 1000 && b.fuel > 0.5) boost = true;
        const heatCap = [0.98, 0.9, 0.8][L];
        if (this.trigger && err < (d < 320 ? 0.34 : 0.2) && d < [700, 950, 1000][L] && !b.overheat && b.heat < heatCap) out.fire = true;
        if (b.missiles > 0 && this.mCd <= 0 && b.locked && r() < [0.3, 0.7, 1][L]) { out.missile = true; this.mCd = [5, 3.2, 2.2][L] + r() * 2; }
        // en difícil: si lo persiguen de cerca, frena en cobra para que el otro se pase de largo
        const behind = Math.cos(angDiff(b.va, Math.atan2(dy, dx))) < -0.6 && Math.cos(angDiff(o.a, Math.atan2(-dy, -dx))) > 0.85 && d < 360;
        if (L === 2 && behind && b.s > 600 && this.cobraT < -2.5) this.cobraT = 0.45;
        if (L >= 1 && behind && b.rollCd <= 0 && this.rollCd <= 0 && r() < dt * 2) { const sd = r() < 0.5 ? 1 : -1; out.roll = true; out.rdx = -Math.sin(b.va) * sd; out.rdy = Math.cos(b.va) * sd; this.rollCd = 2; }
      }
    } else {
      if (!this.wander || Math.hypot(this.wander.x - b.x, this.wander.y - b.y) < 200 || r() < dt * 0.25) {
        const x = 380 + r() * (W.w - 760); this.wander = { x, y: W.ceil + 220 + r() * (W.groundY(x) - W.ceil - 640) };
        if (W.buildings) this.wander.y = Math.min(this.wander.y, this.roofLine(W, x));
      }
      desired = Math.atan2(this.wander.y - b.y, this.wander.x - b.x); this.mode = 'wander';
    }
    // en la ciudad la máquina pelea por encima de los techos: si va muy abajo, no sigue bajando
    if (W.buildings && avoid == null && !th && this.mode !== 'carrera' && this.mode !== 'relevo' && this.mode !== 'equipo') {
      const floor = Math.min(this.roofLine(W, b.x) + 120, W.groundY(b.x) - 360);
      if (b.y > floor && Math.sin(desired) > -0.35) { desired = Math.atan2(-0.55, Math.cos(desired) >= 0 ? 1 : -1); this.mode = 'subir'; }
    }
    if (this.cobraT > 0 && avoid == null) { desired = -Math.PI / 2; boost = false; this.mode = 'cobra'; }
    // sin velocidad no subir en vertical (salvo para esquivar)
    if (avoid == null && !th) {
      const climbAng = -Math.sin(desired), maxClimb = b.s > b.sp.cruise ? 1.15 : 0.6;
      if (climbAng > Math.sin(maxClimb) && this.cobraT <= 0) desired = Math.cos(desired) >= 0 ? -maxClimb : Math.PI + maxClimb;
    }
    if (b.lift < 0.4 && avoid == null) { desired = Math.cos(b.a) >= 0 ? 0.9 : Math.PI - 0.9; boost = b.fuel > 0.1; this.mode = 'recover'; }
    // pegada contra una pared o en un rincón, sin velocidad (se resbala por la roca): turbo hacia afuera y arriba
    const wc = !b.perch && b.s < 190 ? World.contact(W, b.x, b.y, b.r + 4) : null;
    this.wallT = wc && wc.kind !== 'hotair' ? (this.wallT || 0) + dt : 0;
    if (this.wallT > 0.25) { desired = Math.atan2(-1, wc.nx * 0.9 || (Math.cos(b.a) >= 0 ? 0.3 : -0.3)); boost = !b.fuelLock; this.mode = 'despegar'; }
    // reacción: la dirección pedida cambia con un poco de retraso según el nivel
    this.aim = desired;
    out.dx = Math.cos(desired); out.dy = Math.sin(desired);
    out.boost = boost;
    return out;
  }
}
