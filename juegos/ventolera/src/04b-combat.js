/* =========================================================================
   COMBATE — ráfagas, misiles, bengalas, cajas del cielo, choques entre
   pilotos, explosiones y paracaídas. Todo vive en G (estado de la partida)
   y el azar sale de G.rng (misma semilla, misma partida).
   ========================================================================= */
// ¿el segmento (x1,y1)→(x2,y2) pasa a menos de r del centro? (balas rápidas no atraviesan nada)
const segCircle = (x1, y1, x2, y2, cx, cy, r) => {
  const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy || 1;
  const t = clamp(((cx - x1) * dx + (cy - y1) * dy) / l2, 0, 1);
  return Math.hypot(x1 + dx * t - cx, y1 + dy * t - cy) < r;
};
const Combat = (() => {
  const BUL = { speed: 1650, life: 0.62 };
  const MIS = { accel: 1300, max: 1500, life: 4.6, arm: 0.22, fuse: 30, cone: 0.5, range: 1750, hp: 3, radius: 110, lock: 0.7, g: 2900 };
  const CRATES = [['misiles', 30], ['reparar', 23], ['bengalas', 17], ['escudo', 10], ['rafaga', 10], ['cohete', 10]];
  const CRATE_NAME = { misiles: '+2 misiles', reparar: 'Reparación', bengalas: '+2 bengalas (salen solas)', escudo: 'Escudo', rafaga: 'Ráfaga doble', cohete: 'Cohete: turbo sin fin' };

  function reset(G) {
    G.bullets = []; G.missiles = []; G.flares = []; G.crates = []; G.chutes = [];
    G.crateT = 7 + G.rng() * 4; G.bumpCd = 0; G.sixCd = [0, 0];
  }

  const ev = (G, type, o) => G.events.push(Object.assign({ type }, o));

  /* ---------- armas de un piloto ---------- */
  function weapons(b, inp, G, dt) {
    const g = b.sp.gun;
    b.heat = Math.max(0, b.heat - (b.overheat ? 0.42 : 0.55) * dt * (b.legendT > 0 ? 3 : 1) * (b.rasante ? 1.6 : 1));
    if (b.overheat && b.heat < 0.3) { b.overheat = false; b.emit('cool'); }
    b.fireCd = Math.max(0, b.fireCd - dt); b.missileCd = Math.max(0, b.missileCd - dt);
    const canAct = b.alive && b.stun <= 0 && !b.perch && G.canFight;
    b.firing = false;
    if (inp.fire && canAct && !b.overheat && b.fireCd <= 0) {
      const rapid = b.rapid > 0;
      const legend = b.legendT > 0;
      b.fireCd = 1 / (g.rate * (rapid ? 1.6 : 1) * (legend ? 1.25 : 1));
      for (let k = 0; k < g.barrels; k++) shoot(b, G, k, g.barrels);
      if (!legend) b.heat += g.heat * (rapid ? 0.4 : 1) * (G.adv ? [1, 0.85, 0.7][G.adv[b.id] || 0] : 1);
      if (b.heat >= 1) { b.heat = 1; b.overheat = true; b.emit('overheat'); }
      b.firing = true; b.stats.shots += g.barrels;
      b.emit('shot');
    }
    // fijar blanco: mantener al otro en el cono de adelante un momento (tono de «listo»); un edificio en medio corta la mira
    const o = b.lockTgt = lockTarget(G, b);
    let inCone = false;
    if (o && o.alive && b.alive && G.canFight && !b.perch) { const dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy); inCone = d < MIS.range && d > 160 && Math.abs(angDiff(b.a, Math.atan2(dy, dx))) < MIS.cone && clearLine(G.world, b.x, b.y, o.x, o.y); }
    b.lockT = clamp(b.lockT + (inCone ? dt : -2.2 * dt), 0, 1);
    const was = b.locked; b.locked = b.lockT >= MIS.lock && inCone;
    if (b.locked && !was && b.missiles > 0) b.emit('lockOn');
    const mEdge = inp.missile && !b.pMissile; b.pMissile = inp.missile;
    if (mEdge && canAct) { if (b.missiles > 0 && b.missileCd <= 0) launch(b, G); else b.emit('empty'); }
  }
  // ayuda de puntería para personas: con teclado solo hay 8 direcciones, así que si el blanco está
  // casi en la mira (±7°), las balas se tuercen un poco hacia donde va a estar
  function assist(b, G) {
    if (G.bots[b.id]) return 0;
    const cands = [];
    const o = G.birds[1 - b.id];
    if (o && o.alive && G.mode !== 'boss') cands.push(o);
    if (G.targets) for (const T of G.targets) if (T.alive && T.kind !== 'ring') cands.push(T);
    if (G.boss) for (const P of Boss.lockables(G)) cands.push(P);
    let best = 0, bd = 0.125;
    for (const T of cands) {
      const dx = T.x - b.x, dy = T.y - b.y, d = Math.hypot(dx, dy); if (d > 1050 || d < 40) continue;
      const tl = d / BUL.speed, want = Math.atan2(dy + (T.vy || 0) * tl - b.vy * 0.6 * tl, dx + (T.vx || 0) * tl - b.vx * 0.6 * tl), off = angDiff(b.a, want);
      if (Math.abs(off) < bd) { bd = Math.abs(off); best = off; }
    }
    return best * 0.7;
  }
  function shoot(b, G, k, n) {
    const a = b.a + assist(b, G) + (G.rng() - 0.5) * 0.045;
    const off = n > 1 ? (k ? 7 : -7) : 0, ca = Math.cos(b.a), sa = Math.sin(b.a);
    const x = b.x + ca * b.r * 1.25 - sa * off, y = b.y + sa * b.r * 1.25 + ca * off;
    G.bullets.push({ x, y, px: x, py: y, vx: Math.cos(a) * BUL.speed + b.vx * 0.6, vy: Math.sin(a) * BUL.speed + b.vy * 0.6, life: BUL.life, owner: b.id, dmg: b.sp.gun.dmg, whiz: false });
  }
  function launch(b, G) {
    b.missiles--; b.missileCd = 0.6; b.stats.missiles++;
    // solo persigue si el blanco estaba fijado; si no, sale derecho
    const o = lockTarget(G, b), target = b.locked && o && o.alive ? o : null;
    b.lockT = 0; b.locked = false;
    const x = b.x + Math.cos(b.a) * b.r, y = b.y + Math.sin(b.a) * b.r;
    G.missiles.push({ x, y, d0: target ? Math.hypot(target.x - x, target.y - y) : 0, a: b.a, s: Math.max(300, b.s) + 120, owner: b.id, target, orig: target, life: MIS.life, age: 0, hp: MIS.hp, dmg: b.sp.missile.dmg, turn: b.sp.missile.turn, trailAcc: 0, trail: [] });
    b.emit('launch', { lock: !!target });
    if (target && target.emit) target.emit('locked', { from: b.id });
  }
  function deployFlares(b, G, from) {
    b.flares--;
    const made = [];
    // salen disparadas hacia el misil que viene (en abanico), para que lo engañen lejos del piloto
    const ua = from ? Math.atan2(from.y - b.y, from.x - b.x) : -Math.PI / 2;
    for (let k = 0; k < 3; k++) {
      const a = ua + (k - 1) * 0.55 + (G.rng() - 0.5) * 0.2, v = 420 + G.rng() * 80;
      const f = { x: b.x + Math.cos(a) * 18, y: b.y + Math.sin(a) * 18, vx: b.vx * 0.25 + Math.cos(a) * v, vy: b.vy * 0.25 + Math.sin(a) * v - 40, life: 2.4, owner: b.id, flare: true, trail: [] };
      G.flares.push(f); made.push(f);
    }
    // no son infalibles: cada misil cercano se va tras una bengala 7 de cada 10 veces (si no la sigue, ya no lo vuelve a intentar con ese misil)
    for (const m of G.missiles) if (m.target === b && Math.hypot(m.x - b.x, m.y - b.y) < 600) { if (G.rng() < 0.7) m.target = made[Math.floor(G.rng() * made.length)]; else m.noFlare = true; }
    b.emit('flares');
  }
  function explode(G, x, y, owner, dmg, scale = 1, cause = 'missile', exempt = -9) {
    ev(G, 'boom', { x, y, scale, owner });
    const R = MIS.radius * scale;
    World.blast(G.world, x, y, R * 0.75, G);
    for (const b of G.birds) {
      if (!b.alive || b.id === owner || b.id === exempt || ((G.mode === 'boss' || G.coop) && owner >= 0)) continue;
      const d = Math.hypot(b.x - x, b.y - y);
      if (d > R + b.r) continue;
      const k = d < b.r + 34 ? 1 : clamp(1 - (d - b.r) / R, 0, 1) * 0.5;
      const got = b.damage(dmg * k, owner, cause);
      const nx = (b.x - x) / (d || 1), ny = (b.y - y) / (d || 1);
      b.push(nx * 520 * k, ny * 520 * k); b.stun = Math.max(b.stun, 0.2 + 0.3 * k);
      if (got > 0 && owner >= 0 && G.birds[owner]) G.birds[owner].stats.missileHits++;
    }
    for (const P of G.world.palms) if (!P.crown.gone && Math.hypot(P.crown.x - x, P.crown.y - y) < R * 0.9) World.hitCrown(G.world, P, 4 * scale, G);
  }

  /* ---------- un paso ---------- */
  function step(G, dt, inputs) {
    const W = G.world;
    G.birds.forEach((b, i) => { weapons(b, inputs[i] || emptyInput(), G, dt); Style.step(G, b, dt); });

    // balas
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const u = G.bullets[i];
      u.px = u.x; u.py = u.y; u.x += u.vx * dt; u.y += u.vy * dt; u.life -= dt;
      let dead = u.life <= 0;
      if (!dead) { const s = World.solidAt(W, u.x, u.y); if (s) { dead = true; ev(G, 'spark', { x: u.x, y: u.y, kind: s.kind, vx: u.vx, vy: u.vy }); if (s.kind === 'crown') World.hitCrown(W, s.P, 0.1, G); else if (s.kind === 'building') World.hitBuilding(W, s.B, u.px, u.py, 1, G); else if (s.kind === 'cabin') World.nudgeCabin(W, s.i, u.vx > 0 ? 1 : -1); else if (s.kind === 'hotair') World.knockHotair(W, s.i, u.vx * 0.012, u.vy * 0.012); } }
      if (!dead && G.boss && Boss.bulletHit(G, u)) dead = true;
      if (!dead && W.coast && Coast.bulletHit(G, u)) dead = true;
      if (!dead) for (const b of G.birds) {
        if (b.id === u.owner || !b.alive) continue;
        if ((G.mode === 'boss' || G.coop) && u.owner >= 0) continue; // sin fuego amigo
        if (b.evadeT > 0) { if (!u.near && segCircle(u.px, u.py, u.x, u.y, b.x, b.y, b.r + 40)) { u.near = true; if ((b.nearT || 0) < G.time) { b.nearT = G.time + 1; ev(G, 'nearMiss', { b, x: b.x, y: b.y }); } } continue; }
        if (segCircle(u.px, u.py, u.x, u.y, b.x, b.y, b.r + 5)) {
          dead = true; if (u.owner >= 0) G.birds[u.owner].stats.hits++;
          const got = b.damage(u.dmg, u.owner, 'bullet');
          b.push(u.vx * 0.015, u.vy * 0.015);
          ev(G, 'hit', { x: u.x, y: u.y, b, from: u.owner, shield: !got, vx: u.vx, vy: u.vy });
          break;
        } else if (!u.whiz && Math.hypot(u.x - b.x, u.y - b.y) < 70) { u.whiz = true; ev(G, 'whiz', { b }); }
      }
      if (!dead && G.targets && u.owner >= 0) for (const T of G.targets) {
        if (!T.alive || T.kind === 'ring') continue;
        if (segCircle(u.px, u.py, u.x, u.y, T.x, T.y, T.r * (G.vs || 1))) { dead = true; School.hitTarget(G, T, u.owner); break; }
      }
      if (!dead) for (const m of G.missiles) {
        if (m.owner === u.owner || m.dead) continue;
        if (Math.hypot(m.x - u.x, m.y - u.y) < 13) { dead = true; m.hp--; if (m.hp <= 0) { m.dead = true; explode(G, m.x, m.y, m.owner, m.dmg * 0.25, 0.5, 'shotdown'); ev(G, 'missileDown', { x: m.x, y: m.y, by: u.owner }); } break; }
      }
      if (dead) G.bullets.splice(i, 1);
    }

    // misiles
    for (let i = G.missiles.length - 1; i >= 0; i--) {
      const m = G.missiles[i];
      if (m.dead) { G.missiles.splice(i, 1); continue; }
      m.age += dt; m.life -= dt; m.s = Math.min(MIS.max, m.s + MIS.accel * dt);
      let T = m.target;
      if (T && (T.flare ? T.life <= 0 : !T.alive)) { T = m.target = null; }
      if (T && !T.flare && T.flares > 0 && !m.noFlare) {
        const d = Math.hypot(T.x - m.x, T.y - m.y);
        // salen cuando al misil le falta ~1,1 s para llegar (así se ven salir con el misil todavía lejos)
        const close = Math.max(300, m.s - (T.vx * Math.cos(m.a) + T.vy * Math.sin(m.a)));
        if ((d < 460 || d / close < 1.1) && d < 1300 && Math.cos(angDiff(m.a, Math.atan2(T.y - m.y, T.x - m.x))) > 0.5) { deployFlares(T, G, m); T = m.target; }
      }
      if (T) {
        // navegación proporcional: gira según cuánto cambia la línea de vista (intercepta, no solo persigue)
        const los = Math.atan2(T.y - m.y, T.x - m.x);
        const losRate = m.los == null ? 0 : angDiff(m.los, los) / dt; m.los = los;
        const rate = 3.2 * losRate + 1.6 * angDiff(m.a, los);
        // límite de giro por aceleración lateral: lento sale ágil, a toda velocidad es rígido (quiebre tardío = esquive)
        const maxTurn = Math.min(m.turn * 1.6, MIS.g * (m.turn / 3.1) / Math.max(300, m.s));
        m.a += clamp(rate * dt, -maxTurn * dt, maxTurn * dt);
        // si el blanco quedó atrás y el misil ya se pasó, pierde agarre de a poco (esquive bien hecho)
        if (!T.flare && Math.abs(angDiff(m.a, los)) > 2.3 && m.age > 0.4) {
          m.lostT = (m.lostT || 0) + dt;
          if (m.lostT > 0.45) {
            m.target = null; m.life = Math.min(m.life, 0.7);
            if (m.orig && m.orig.alive && m.orig.stats) { m.orig.stats.dodged++; m.orig.emit('dodged'); if (Math.hypot(m.orig.x - m.x, m.orig.y - m.y) < 260) ev(G, 'nearMiss', { b: m.orig, x: m.orig.x, y: m.orig.y }); m.orig = null; }
          }
        } else m.lostT = 0;
      }
      m.x += Math.cos(m.a) * m.s * dt; m.y += Math.sin(m.a) * m.s * dt;
      m.trailAcc += dt; if (m.trailAcc > 1 / 50) { m.trailAcc = 0; m.trail.push({ x: m.x, y: m.y, t: G.time }); if (m.trail.length > 40) m.trail.shift(); }
      let boom = false, hitBird = null, decoy = -9;
      const s = World.solidAt(W, m.x, m.y, 4);
      if (s) boom = true;
      if (!boom && m.age > MIS.arm && !((G.mode === 'boss' || G.coop) && m.owner >= 0)) for (const b of G.birds) { if (!b.alive || b.id === m.owner || b.evadeT > 0 || (T && T.flare && T.owner === b.id)) continue; if (Math.hypot(b.x - m.x, b.y - m.y) < MIS.fuse + b.r) { boom = true; hitBird = b; break; } }
      if (!boom && T && T.flare && Math.hypot(T.x - m.x, T.y - m.y) < 30) { boom = true; decoy = T.owner; ev(G, 'decoyed', { x: m.x, y: m.y, owner: T.owner }); }
      if (!boom && T && T.part && T.alive && m.age > MIS.arm && Math.hypot(T.x - m.x, T.y - m.y) < T.r + MIS.fuse) { boom = true; Boss.hurt(G, T, m.dmg * 2.4, m.owner); }
      if (!boom && T && T.drone && T.alive && m.age > MIS.arm && Math.hypot(T.x - m.x, T.y - m.y) < T.r + MIS.fuse) { boom = true; T.hp = 0; T.alive = false; ev(G, 'pop', { x: T.x, y: T.y, kind: 'drone', by: m.owner, pts: T.pts }); }
      if (!boom && m.life <= 0) boom = true;
      if (boom) {
        G.mlog = G.mlog || {}; const why = hitBird ? 'impacto' : s ? s.kind : m.life <= 0 ? 'se acabó' : 'bengala'; G.mlog[why] = (G.mlog[why] || 0) + 1; if (!m.orig) G.mlog.sinBlanco = (G.mlog.sinBlanco || 0) + 1;
        explode(G, m.x, m.y, m.owner, m.dmg, hitBird ? 1 : 0.85, 'missile', decoy);
        if (m.orig && m.orig.alive && m.orig.stats && !hitBird && Math.hypot(m.orig.x - m.x, m.orig.y - m.y) > MIS.radius) { m.orig.stats.dodged++; m.orig.emit('dodged'); if (Math.hypot(m.orig.x - m.x, m.orig.y - m.y) < 260) ev(G, 'nearMiss', { b: m.orig, x: m.orig.x, y: m.orig.y }); }
        G.missiles.splice(i, 1);
      }
    }

    // bengalas
    for (let i = G.flares.length - 1; i >= 0; i--) {
      const f = G.flares[i]; f.life -= dt; f.vy += 200 * dt; f.vx *= 1 - 1.2 * dt; f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.trail) { f.trail.push({ x: f.x, y: f.y, t: G.time }); if (f.trail.length > 30) f.trail.shift(); }
      if (f.life <= 0) G.flares.splice(i, 1);
    }

    // cajas del cielo
    if (G.canFight && G.cratesOn) {
      G.crateT -= dt;
      if (G.crateT <= 0) {
        G.crateT = 9 + G.rng() * 6;
        if (G.crates.length < 2) {
          let roll = G.rng() * 100, type = CRATES[0][0];
          for (const [t, w] of CRATES) { if (roll < w) { type = t; break; } roll -= w; }
          const x = 380 + G.rng() * (W.w - 760);
          G.crates.push({ x, y: Math.max(G.world.ceil - 200, (G.camTop || 0) - 60), sway: G.rng() * TAU, type, landed: false, life: 16 });
          ev(G, 'crateSpawn', { x, type });
        }
      }
    }
    for (let i = G.crates.length - 1; i >= 0; i--) {
      const c = G.crates[i];
      if (!c.landed) { c.y += 72 * dt; c.x += Math.sin(G.time * 1.3 + c.sway) * 26 * dt; if (c.y + 18 > W.groundY(c.x)) { c.landed = true; c.y = W.groundY(c.x) - 18; c.life = 7; } }
      else c.life -= dt;
      let taken = false;
      for (const b of G.birds) if (b.alive && Math.hypot(b.x - c.x, b.y - c.y) < b.r + 32) { give(b, c.type, G); taken = true; break; }
      if (taken || c.life <= 0) G.crates.splice(i, 1);
    }

    // choques entre pilotos: recibe menos el que embiste
    G.bumpCd = Math.max(0, G.bumpCd - dt);
    const [A, B] = G.birds;
    if (A && B && A.alive && B.alive && !A.perch && !B.perch && G.mode !== 'boss' && !G.coop) {
      const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1, R = A.r + B.r;
      if (d < R) {
        const nx = dx / d, ny = dy / d, ov = (R - d) / 2;
        A.x -= nx * ov; A.y -= ny * ov; B.x += nx * ov; B.y += ny * ov;
        const vrel = (A.vx - B.vx) * nx + (A.vy - B.vy) * ny;
        if (vrel > 0 && G.bumpCd <= 0) {
          G.bumpCd = 0.3;
          const aIn = Math.max(0, A.vx * nx + A.vy * ny), bIn = Math.max(0, -(B.vx * nx + B.vy * ny));
          if (vrel > 260) {
            const base = Math.min(32, (vrel - 240) * 0.04), aRams = aIn >= bIn;
            const q = clamp(Math.sqrt(B.sp.mass / A.sp.mass), 0.75, 1.35);
            A.damage(base * (aRams ? 0.4 : 1) * q, B.id, 'bump'); B.damage(base * (aRams ? 1 : 0.4) / q, A.id, 'bump');
            A.stun = Math.max(A.stun, aRams ? 0.12 : 0.35); B.stun = Math.max(B.stun, aRams ? 0.35 : 0.12);
          }
          const tot = A.sp.mass + B.sp.mass;
          A.push(-nx * vrel * 0.9 * B.sp.mass / tot, -ny * vrel * 0.9 * B.sp.mass / tot);
          B.push(nx * vrel * 0.9 * A.sp.mass / tot, ny * vrel * 0.9 * A.sp.mass / tot);
          ev(G, 'bump', { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2, v: vrel, by: aIn >= bIn ? A.id : B.id });
        }
      }
    }

    // «¡a tus seis!»: el otro se te pega detrás y te apunta
    G.birds.forEach((b, i) => {
      G.sixCd[i] = Math.max(0, G.sixCd[i] - dt);
      const o = G.birds[1 - i];
      if (!b.alive || !o || !o.alive || G.sixCd[i] > 0 || !G.canFight || G.mode === 'boss' || G.coop) return;
      const dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy);
      if (d < 460 && Math.cos(angDiff(b.a, Math.atan2(dy, dx))) < -0.7 && Math.cos(angDiff(o.a, Math.atan2(-dy, -dx))) > 0.85) { G.sixCd[i] = 5; b.emit('six'); }
    });

    // paracaídas de los derribados
    for (const p of G.chutes) {
      p.t += dt;
      if (!p.open && p.t > 0.65) { p.open = true; ev(G, 'chute', { x: p.x, y: p.y }); }
      if (p.landed) continue;
      if (p.open) { p.vy += (70 - p.vy) * 2.5 * dt; p.vx *= 1 - 1.5 * dt; p.vx += Math.sin(G.time * 1.4 + p.id) * 20 * dt; }
      else p.vy += 900 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.y + 22 > W.groundY(p.x)) { p.y = W.groundY(p.x) - 22; p.landed = true; }
    }
  }

  function give(b, type, G) {
    if (type === 'misiles') b.missiles = Math.min(4, b.missiles + 2);
    else if (type === 'reparar') b.hp = Math.min(b.sp.hp, b.hp + b.sp.hp * 0.35);
    else if (type === 'bengalas') b.flares = Math.min(3, b.flares + 2);
    else if (type === 'escudo') b.shield = 6;
    else if (type === 'rafaga') b.rapid = 8;
    else if (type === 'cohete') b.rocket = 7;
    b.stats.crates++;
    b.emit('pickup', { kind: type, name: CRATE_NAME[type] });
  }
  function eject(G, b) { G.chutes.push({ x: b.x, y: b.y, vx: b.vx * 0.25, vy: -280, t: 0, open: false, landed: false, id: b.id }); }
  // el misil que persigue a este piloto más de cerca (para el aviso y la alarma)
  // a quién se le puede fijar el misil: al otro piloto o, en la escuela, al dron más cercano
  function lockTarget(G, b) {
    const o = G.birds[1 - b.id];
    if (G.tm) {
      // desafíos en equipo: solo drones enemigos (nunca al compañero)
      let best = null, bd = Infinity;
      for (const T of G.targets) if (T.alive && T.hostile) { const d = Math.hypot(T.x - b.x, T.y - b.y); if (d < MIS.range && Math.abs(angDiff(b.a, Math.atan2(T.y - b.y, T.x - b.x))) < MIS.cone && d < bd) { bd = d; best = T; } }
      return best;
    }
    if (G.mode === 'targets' && G.targets) {
      // en Blancos se puede fijar un dron que esté adelante (si no, al rival)
      let best = null, bd = Infinity;
      for (const T of G.targets) if (T.alive && T.drone) { const d = Math.hypot(T.x - b.x, T.y - b.y); if (d < MIS.range && Math.abs(angDiff(b.a, Math.atan2(T.y - b.y, T.x - b.x))) < MIS.cone && d < bd) { bd = d; best = T; } }
      if (best) return best;
      if (G.coop) return null; // juntos: el misil no se le fija al compañero
    }
    if (G.mode === 'boss') {
      let best = null, bd = Infinity;
      for (const T of Boss.lockables(G)) { const d = Math.hypot(T.x - b.x, T.y - b.y); if (d < MIS.range && Math.abs(angDiff(b.a, Math.atan2(T.y - b.y, T.x - b.x))) < MIS.cone && d < bd) { bd = d; best = T; } }
      return best;
    }
    if (o && o.alive) return o;
    if (!G.targets) return null;
    let best = null, bd = Infinity;
    for (const T of G.targets) if (T.alive && T.drone) { const d = Math.hypot(T.x - b.x, T.y - b.y); if (d < bd) { bd = d; best = T; } }
    return best;
  }
  // ¿hay línea de vista? (muestras cada 50 px contra edificios, viaducto, tren y cabinas)
  function clearLine(W, x0, y0, x1, y1) {
    if (!W.buildings) return true;
    const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 50);
    for (let i = 1; i < n; i++) { const u = i / n, s = World.solidAt(W, x0 + (x1 - x0) * u, y0 + (y1 - y0) * u); if (s && s.kind !== 'ground' && s.kind !== 'water') return false; }
    return true;
  }
  function threat(G, b) {
    let best = null, bd = Infinity;
    for (const m of G.missiles) if (m.target === b) { const d = Math.hypot(m.x - b.x, m.y - b.y); if (d < bd) { bd = d; best = m; } }
    return best ? { m: best, d: bd } : null;
  }
  return { reset, step, eject, threat, give, explode, CRATE_NAME, MIS };
})();
