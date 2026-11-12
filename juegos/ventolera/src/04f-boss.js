/* =========================================================================
   JEFE EN PAREJA — los dos pilotos juntos contra «La Sombra», un dirigible
   armado que patrulla el cielo.
   Partes (cada una con su blindaje): dos torretas que disparan ráfagas,
   dos lanzamisiles, dos motores (al caer, el dirigible se vuelve lento) y
   el puente de mando, protegido por un escudo hasta que caen torretas y
   lanzamisiles. Fases: al perder dos partes suelta drones de ataque; con
   el puente expuesto arde, acelera y dispara en círculo.
   Vidas compartidas; sin fuego amigo. Solo: la máquina vuela de compañera.
   ========================================================================= */
const Boss = (() => {
  const RX = 360, RY = 104;
  const DEF = [
    { id: 'torre1', kind: 'turret', name: 'torreta de arriba', ox: 30, oy: -RY - 8, r: 30, hp: 300 },
    { id: 'torre2', kind: 'turret', name: 'torreta de abajo', ox: -140, oy: RY + 4, r: 30, hp: 300 },
    { id: 'pod1', kind: 'pod', name: 'lanzamisiles de proa', ox: 230, oy: 70, r: 28, hp: 260 },
    { id: 'pod2', kind: 'pod', name: 'lanzamisiles de popa', ox: -250, oy: 62, r: 28, hp: 260 },
    { id: 'motor1', kind: 'engine', name: 'motor de arriba', ox: -RX - 6, oy: -46, r: 26, hp: 200 },
    { id: 'motor2', kind: 'engine', name: 'motor de abajo', ox: -RX - 6, oy: 46, r: 26, hp: 200 },
    { id: 'puente', kind: 'core', name: 'puente de mando', ox: 70, oy: RY + 48, r: 42, hp: 1100 },
  ];
  const TOTAL = DEF.reduce((a, d) => a + d.hp, 0);

  function setup(G, hard) {
    const W = G.world, hk = hard ? 1.35 : 1;
    // en Capadocia el dirigible patrulla por donde van los globos altos: esos se quedan en tierra
    if (W.hotair) { W.hotair = W.hotair.filter(h => h.lane === 1); W.hotair.forEach((h, i) => { h.i = i; }); }
    G.boss = {
      x: W.w * 0.62, y: W.ceil + 380, dir: -1, flip: 1, t: 0, phase: 1, dead: false, fallT: 0, vy: 0, hitT: 0,
      hard: !!hard, parts: DEF.map(d => Object.assign({}, d, { hp: Math.round(d.hp * hk), max: Math.round(d.hp * hk), alive: true, part: true, x: 0, y: 0, vx: 0, vy: 0, fireT: 1 + Math.random() * 2, burst: 0, burstT: 0, aim: Math.PI / 2, hitT: 0 })),
      dmg: [0, 0], lastHit: -1, droneT: 6, ringT: 3,
    };
    G.lives = G.players === 2 ? 6 : 5; G.targets = [];
    place(G.boss);
  }
  function place(B) {
    const k = B.flip;
    for (const p of B.parts) {
      const nx = B.x - p.ox * k, ny = B.y + p.oy;
      p.vx = (nx - p.x) * 60; p.vy = (ny - p.y) * 60; p.x = nx; p.y = ny;
    }
  }
  const alive = (B, kind) => B.parts.filter(p => p.alive && (!kind || p.kind === kind));
  const core = B => B.parts.find(p => p.kind === 'core');
  const shielded = B => alive(B, 'turret').length + alive(B, 'pod').length > 0;
  function nearest(G, x, y, maxD = 1400) {
    let best = null, bd = maxD;
    for (const b of G.birds) if (b.alive && !b.perch) { const d = Math.hypot(b.x - x, b.y - y); if (d < bd) { bd = d; best = b; } }
    return best;
  }

  function update(G, dt) {
    const B = G.boss; if (!B) return;
    const W = G.world;
    B.t += dt; B.hitT = Math.max(0, B.hitT - dt);
    if (B.dead) {
      // cae ardiendo con explosiones encadenadas
      B.fallT += dt; B.vy += 90 * dt; B.y += B.vy * dt; B.x += B.dir * 30 * dt;
      if (B.fallT < 3.2 && G.rng() < dt * 5) G.events.push({ type: 'boom', x: B.x + (G.rng() - 0.5) * RX * 1.6, y: B.y + (G.rng() - 0.5) * RY * 1.4, scale: 0.9 + G.rng() * 0.8 });
      place(B); return;
    }
    // patrulla de lado a lado; sin motores va lento; con el puente expuesto, rabioso
    const engines = alive(B, 'engine').length, rage = !shielded(B);
    const speed = (engines === 2 ? 70 : engines === 1 ? 48 : 28) * (rage ? 1.6 : 1);
    B.x += B.dir * speed * dt;
    if ((B.dir < 0 && B.x < 700) || (B.dir > 0 && B.x > W.w - 700)) B.dir = -B.dir;
    B.flip += ((B.dir < 0 ? 1 : -1) - B.flip) * Math.min(1, dt * 1.5);
    const baseY = W.buildings ? W.ceil + 360 : W.ceil + 420;
    B.y = baseY + Math.sin(B.t * 0.35) * 70;
    place(B);
    const lost = B.parts.filter(p => !p.alive).length;
    B.phase = rage ? 3 : lost >= 2 ? 2 : 1;
    for (const p of B.parts) {
      p.hitT = Math.max(0, p.hitT - dt);
      if (!p.alive) { if (G.rng() < dt * 8) G.events.push({ type: 'bossSmoke', x: p.x, y: p.y }); continue; }
      const T = nearest(G, p.x, p.y);
      if (T) p.aim += clamp(angDiff(p.aim, Math.atan2(T.y + T.vy * 0.25 - p.y, T.x + T.vx * 0.25 - p.x)), -2.5 * dt, 2.5 * dt);
      p.fireT -= dt;
      if (p.kind === 'turret' && T) {
        // ráfagas de 5 balas lentas (se pueden esquivar)
        if (p.burst > 0) { p.burstT -= dt; if (p.burstT <= 0) { p.burst--; p.burstT = 0.09; shoot(G, p.x + Math.cos(p.aim) * 34, p.y + Math.sin(p.aim) * 34, p.aim + (G.rng() - 0.5) * 0.06, 1050, 6); } }
        else if (p.fireT <= 0) { p.fireT = (B.phase >= 2 ? 1.7 : 2.3) + G.rng() * 0.6; p.burst = 5; p.burstT = 0; }
      } else if (p.kind === 'pod' && T && p.fireT <= 0) {
        p.fireT = 6.5 + G.rng() * 2;
        const a = Math.atan2(T.y - p.y, T.x - p.x);
        G.missiles.push({ x: p.x, y: p.y, a, s: 380, owner: -1, target: T, orig: T, life: 4.2, age: 0, hp: 3, dmg: 40, turn: 2.7, trailAcc: 0, trail: [], enemy: true });
        G.events.push({ type: 'launch', b: { x: p.x, y: p.y } }); T.emit('locked', { from: -1 });
      } else if (p.kind === 'core' && rage && p.fireT <= 0) {
        // anillo de balas: hay que pasar por un hueco
        p.fireT = 3.2;
        const n = 14, off = G.rng() * TAU;
        for (let i = 0; i < n; i++) { const a = off + i * TAU / n; shoot(G, p.x + Math.cos(a) * 50, p.y + Math.sin(a) * 50, a, 760, 7); }
        G.events.push({ type: 'bossRing', x: p.x, y: p.y });
      }
    }
    // fase 2: suelta drones de ataque
    if (B.phase >= 2 || B.hard) {
      B.droneT -= dt;
      if (B.droneT <= 0 && G.targets.filter(t => t.alive && t.hostile).length < 3) {
        B.droneT = 7;
        G.targets.push({ kind: 'drone', drone: true, hostile: true, x: B.x, y: B.y + RY, r: 30, hp: 4, alive: true, t: 0, vx: 0, vy: 140, fireT: 2, pts: 0 });
        G.events.push({ type: 'bossDrone', x: B.x, y: B.y + RY });
      }
    }
    droneStep(G, dt);
    // chocar con el casco
    for (const b of G.birds) {
      if (!b.alive || b.perch) continue;
      const ex = (b.x - B.x) / (RX + b.r), ey = (b.y - B.y) / (RY + b.r), e = Math.hypot(ex, ey);
      if (e < 1) {
        const nx = ex / (e || 1) / (RX + b.r), ny = ey / (e || 1) / (RY + b.r), l = Math.hypot(nx, ny) || 1, ux = nx / l, uy = ny / l;
        b.x = B.x + ex / (e || 1) * (RX + b.r) * 1.01; b.y = B.y + ey / (e || 1) * (RY + b.r) * 1.01;
        const vn = b.vx * ux + b.vy * uy;
        if (vn < 0) { b.vx -= 1.6 * vn * ux; b.vy -= 1.6 * vn * uy; }
        if ((b.bossBumpT || 0) < G.time) { b.bossBumpT = G.time + 0.6; b.damage(10, -1, 'crash'); b.stun = Math.max(b.stun, 0.35); b.emit('crash', { impact: 400, kind: 'boss', nx: ux, ny: uy }); }
      }
    }
  }
  // drones de ataque: se acercan, guardan distancia y disparan (también los usan los desafíos en equipo)
  // D.prefer(G) puede elegir a quién perseguir (p. ej. al que lleva el maletín)
  function droneStep(G, dt) {
    const W = G.world;
    for (const D of G.targets) {
      if (!D.alive || !D.hostile) continue;
      D.t += dt;
      const T = (D.prefer && D.prefer(G)) || nearest(G, D.x, D.y, 2400);
      if (T) {
        const dx = T.x - D.x, dy = T.y - D.y, d = Math.hypot(dx, dy) || 1, want = d > 300 ? 1 : d < 200 ? -1 : 0, sp = D.speed || 220;
        D.vx += (dx / d * sp * want - D.vx) * Math.min(1, dt * 1.5) + Math.sin(D.t * 2 + D.r) * 40 * dt;
        D.vy += (dy / d * sp * want - D.vy) * Math.min(1, dt * 1.5);
        D.fireT -= dt;
        // apuntan a donde vas a estar (no a donde estás)
        if (D.fireT <= 0 && d < 750) { D.fireT = D.rate || 1.8; const tl = d / 950 * 0.85, a = Math.atan2(dy + T.vy * tl, dx + T.vx * tl); shoot(G, D.x + Math.cos(a) * 24, D.y + Math.sin(a) * 24, a, 950, D.dmg || 5); }
      }
      const nx = D.x + D.vx * dt, ny = D.y + D.vy * dt;
      if (!World.solidAt(W, nx, ny, 32) && ny > W.ceil && ny < W.groundY(nx) - 60) { D.x = nx; D.y = ny; } else { D.vx *= -0.5; D.vy *= -0.5; if (ny >= W.groundY(nx) - 60) D.vy = -120; }
    }
    G.targets = G.targets.filter(t => t.alive);
  }
  function spawnDrone(G, x, y, o = {}) {
    const D = Object.assign({ kind: 'drone', drone: true, hostile: true, x, y, r: 30, hp: 4, alive: true, t: 0, vx: 0, vy: 140, fireT: 2, pts: 0 }, o);
    G.targets.push(D); G.events.push({ type: 'bossDrone', x, y });
    return D;
  }
  function drawDrones(ctx, G) {
    const t = G.time;
    for (const D of G.targets) if (D.alive && D.hostile) {
      ctx.save(); ctx.translate(D.x, D.y); ctx.scale(G.vs || 1, G.vs || 1);
      ctx.fillStyle = D.tough ? '#4a1a2e' : '#3a1e24'; ctx.beginPath(); ctx.roundRect(-20, -8, 40, 16, 6); ctx.fill();
      ctx.fillStyle = '#ff3a3a'; ctx.beginPath(); ctx.arc(0, 0, 5 + (D.fireT < 0.4 ? 2 : 0), 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(220,230,255,0.5)'; for (const s of [-26, 26]) { ctx.beginPath(); ctx.ellipse(s, -12, 14 * Math.abs(Math.sin(t * 40 + s)), 2.5, 0, 0, TAU); ctx.fill(); }
      if (D.max && D.hp < D.max) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-18, -20, 36, 4); ctx.fillStyle = '#ffb347'; ctx.fillRect(-18, -20, 36 * D.hp / D.max, 4); }
      ctx.restore();
    }
  }
  function shoot(G, x, y, a, sp, dmg) {
    G.bullets.push({ x, y, px: x, py: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.4, owner: -1, dmg, whiz: false, enemy: true });
    G.events.push({ type: 'enemyShot', x, y });
  }
  // una bala de jugador: ¿le dio a una parte o al casco?
  function bulletHit(G, u) {
    const B = G.boss; if (!B || B.dead || u.owner < 0) return false;
    for (const p of B.parts) {
      if (!p.alive) continue;
      if (segCircle(u.px, u.py, u.x, u.y, p.x, p.y, p.r)) { hurt(G, p, u.dmg, u.owner); G.events.push({ type: 'hit', x: u.x, y: u.y, vx: u.vx, vy: u.vy, shield: p.kind === 'core' && shielded(B) }); return true; }
    }
    const ex = (u.x - B.x) / RX, ey = (u.y - B.y) / RY;
    if (ex * ex + ey * ey < 1) { G.events.push({ type: 'spark', x: u.x, y: u.y, kind: 'boss', vx: u.vx, vy: u.vy }); return true; }
    return false;
  }
  function hurt(G, p, n, by) {
    const B = G.boss; if (!p.alive || B.dead) return;
    if (p.kind === 'core' && shielded(B)) { p.hitT = 0.1; return; }
    p.hp -= n; p.hitT = 0.12; B.hitT = 0.08;
    if (by >= 0) { B.dmg[by] += n; B.lastHit = by; if (G.birds[by]) G.birds[by].stats.dmg += n; }
    if (p.hp <= 0) {
      p.hp = 0; p.alive = false;
      G.events.push({ type: 'boom', x: p.x, y: p.y, scale: p.kind === 'core' ? 2 : 1.3 });
      G.events.push({ type: 'partDown', x: p.x, y: p.y, name: p.name, by, kind: p.kind });
      if (p.kind === 'core') { B.dead = true; B.vy = 20; G.events.push({ type: 'bossDown', x: B.x, y: B.y, by }); }
      else if (!shielded(B) && core(B).alive) G.events.push({ type: 'shieldDown', x: core(B).x, y: core(B).y });
    }
  }
  // blancos para el misil: las partes vivas (el puente solo sin escudo)
  function lockables(G) {
    const B = G.boss; if (!B || B.dead) return [];
    return B.parts.filter(p => p.alive && !(p.kind === 'core' && shielded(B)));
  }
  function hpFrac(G) { const B = G.boss; return B ? B.parts.reduce((a, p) => a + Math.max(0, p.hp), 0) / B.parts.reduce((a, p) => a + p.max, 0) : 0; }

  /* ---------- dibujo ---------- */
  function draw(ctx, G) {
    const B = G.boss; if (!B) return;
    const t = G.time, k = B.flip, city = G.world.id === 'medellin';
    ctx.save(); ctx.translate(B.x, B.y);
    if (B.dead) ctx.rotate(Math.min(0.5, B.fallT * 0.15) * (B.dir > 0 ? 1 : -1));
    // reflectores hacia abajo (de noche se ven más)
    if (!B.dead) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const [sx, ph] of [[-120, 0], [150, 2]]) {
        const a = Math.PI / 2 + Math.sin(t * 0.6 + ph) * 0.5, L = 900, x0 = sx * k;
        const g = ctx.createLinearGradient(x0, RY, x0 + Math.cos(a) * L, RY + Math.sin(a) * L);
        g.addColorStop(0, `rgba(255,240,200,${city ? 0.2 : 0.1})`); g.addColorStop(1, 'rgba(255,240,200,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, RY); ctx.lineTo(x0 + Math.cos(a - 0.12) * L, RY + Math.sin(a - 0.12) * L); ctx.lineTo(x0 + Math.cos(a + 0.12) * L, RY + Math.sin(a + 0.12) * L); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    ctx.scale(k, 1);
    // aletas traseras
    ctx.fillStyle = '#2a1e2a';
    ctx.beginPath(); ctx.moveTo(RX * 0.62, -RY * 0.5); ctx.lineTo(RX * 1.05, -RY * 1.25); ctx.lineTo(RX * 1.12, -RY * 0.25); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(RX * 0.62, RY * 0.5); ctx.lineTo(RX * 1.05, RY * 1.25); ctx.lineTo(RX * 1.12, RY * 0.25); ctx.closePath(); ctx.fill();
    // casco con franjas
    const g = ctx.createLinearGradient(0, -RY, 0, RY);
    g.addColorStop(0, B.hitT > 0 ? '#ffffff' : '#6b3c46'); g.addColorStop(0.45, '#4a2632'); g.addColorStop(1, '#1d1018');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, RX, RY, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, RX, RY, 0, 0, TAU); ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 3;
    for (let x = -RX; x < RX; x += 60) { ctx.beginPath(); ctx.moveTo(x, -RY); ctx.quadraticCurveTo(x - 10, 0, x, RY); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,200,120,0.85)'; ctx.fillRect(-RX, -8, RX * 2, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.ellipse(-RX * 0.15, -RY * 0.45, RX * 0.75, RY * 0.28, 0, 0, TAU); ctx.fill();
    ctx.restore();
    // nombre pintado (no se refleja al voltear)
    ctx.save(); ctx.scale(k, 1); ctx.fillStyle = 'rgba(255,214,150,0.75)'; ctx.font = `700 34px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('LA SOMBRA', 0, -38); ctx.restore();
    // góndola
    ctx.fillStyle = '#2a1c26'; ctx.beginPath(); ctx.roundRect(-180, RY - 12, 220, 46, 14); ctx.fill();
    ctx.fillStyle = 'rgba(255,220,150,0.85)'; for (let i = 0; i < 6; i++) ctx.fillRect(-166 + i * 32, RY, 18, 12);
    ctx.restore();
    // partes (en coordenadas del mundo)
    for (const p of B.parts) {
      ctx.save(); ctx.translate(p.x, p.y);
      if (!p.alive) { ctx.fillStyle = '#1a1014'; ctx.beginPath(); ctx.arc(0, 0, p.r * 0.7, 0, TAU); ctx.fill(); ctx.restore(); continue; }
      const white = p.hitT > 0;
      if (p.kind === 'turret') {
        ctx.fillStyle = white ? '#fff' : '#3d3440'; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, TAU); ctx.fill();
        ctx.rotate(p.aim); ctx.fillStyle = '#20181f'; ctx.fillRect(10, -6, 38, 12); ctx.fillStyle = '#ff5a4e'; ctx.fillRect(44, -4, 5, 8);
      } else if (p.kind === 'pod') {
        ctx.fillStyle = white ? '#fff' : '#4a3a44'; ctx.beginPath(); ctx.roundRect(-p.r, -p.r * 0.6, p.r * 2, p.r * 1.2, 8); ctx.fill();
        ctx.fillStyle = p.fireT < 1 && Math.sin(t * 20) > 0 ? '#ff6a4a' : '#7a1f1f'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-14 + i * 14, 0, 4.5, 0, TAU); ctx.fill(); }
      } else if (p.kind === 'engine') {
        ctx.fillStyle = white ? '#fff' : '#3a3038'; ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.7, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(220,220,240,0.6)'; ctx.beginPath(); ctx.ellipse(-p.r * k, 0, 4, p.r * 1.2 * Math.abs(Math.sin(t * 30 + p.oy)), 0, 0, TAU); ctx.fill();
      } else if (p.kind === 'core') {
        ctx.fillStyle = white ? '#fff' : '#5a2a34'; ctx.beginPath(); ctx.roundRect(-p.r, -p.r * 0.55, p.r * 2, p.r * 1.1, 12); ctx.fill();
        ctx.fillStyle = 'rgba(255,90,78,0.9)'; ctx.beginPath(); ctx.arc(0, 0, 9 + Math.sin(t * 6) * 2, 0, TAU); ctx.fill();
        if (shielded(B)) {
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          const sg = ctx.createRadialGradient(0, 0, p.r * 0.8, 0, 0, p.r * 1.7);
          sg.addColorStop(0, 'rgba(120,200,255,0)'); sg.addColorStop(0.8, `rgba(120,200,255,${0.3 + 0.1 * Math.sin(t * 5)})`); sg.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 0, p.r * 1.7, 0, TAU); ctx.fill(); ctx.restore();
        }
      }
      ctx.restore();
      // barrita de blindaje de cada parte
      if (p.hp < p.max) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(p.x - 26, p.y - p.r - 14, 52, 5); ctx.fillStyle = p.kind === 'core' ? '#ff5a4e' : '#ffb347'; ctx.fillRect(p.x - 26, p.y - p.r - 14, 52 * p.hp / p.max, 5); }
    }
    drawDrones(ctx, G);
  }
  // barra del jefe arriba al centro y vidas
  function drawHUD(ctx, G, sw, sh, u, glass) {
    const B = G.boss; if (!B) return;
    // en celular cabe justo entre los dos paneles de los pilotos (si no, se montaría encima)
    const room = sw - 2 * (10 * u + 214 * u) - 16, narrow = Touch.enabled && room < 420 * u;
    const w = narrow ? room : Math.min(sw - 40, 420 * u), x = sw / 2 - w / 2, y = Touch.enabled ? 60 : 10, h = 46 * u;
    ctx.save(); glass(x, y, w, h, 12 * u);
    ctx.font = font(Math.max(10, 11 * u)); ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(narrow ? `Fase ${B.phase}` : `«LA SOMBRA» · fase ${B.phase}`, x + 14 * u, y + 16 * u);
    ctx.textAlign = 'right'; ctx.fillText(`${narrow ? '' : 'vidas '}${'♥'.repeat(Math.max(0, G.lives))}`, x + w - 14 * u, y + 16 * u);
    const bw = w - 28 * u, k = hpFrac(G);
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x + 14 * u, y + 25 * u, bw, 9 * u);
    ctx.fillStyle = B.phase === 3 ? (Math.sin(G.time * 10) > 0 ? '#ff5a4e' : '#ff8a5a') : '#ff7a5a'; ctx.fillRect(x + 14 * u, y + 25 * u, bw * k, 9 * u);
    // marcas de las partes
    B.parts.forEach((p, i) => { ctx.fillStyle = p.alive ? (p.kind === 'core' ? '#ff5a4e' : '#ffd36b') : 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.arc(x + 14 * u + i * 12 * u + 4 * u, y + 40 * u, 3.2 * u, 0, TAU); ctx.fill(); });
    ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = font(Math.max(9, 9.5 * u));
    ctx.fillText(shielded(B) ? (narrow ? 'puente con escudo: tumba las armas' : 'el puente tiene escudo: tumba torretas y lanzamisiles') : '¡el puente está expuesto!', x + w - 14 * u, y + 43 * u);
    ctx.restore();
  }
  return { setup, update, bulletHit, hurt, lockables, draw, drawHUD, hpFrac, shielded, droneStep, spawnDrone, drawDrones, RX, RY };
})();
