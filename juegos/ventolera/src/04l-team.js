/* =========================================================================
   DESAFÍOS EN EQUIPO (Travesía para dos) — los dos pilotos juntos, sin
   fuego amigo, contra el reloj o contra drones de ataque:
   · Relevos: el recorrido de la Carrera, pero cada aro es de un piloto (su
     color) y van alternados: hay que pasarlos en orden, cada uno los suyos.
     Mientras uno pasa el suyo, el otro ya debe ir llegando al siguiente.
   · Entrega: un maletín cae en paracaídas; hay que llevarlo a la zona de
     entrega (helipuerto, iglesia…). Los drones persiguen al que lo carga y,
     si le hacen suficiente daño, se le cae. Uno carga, el otro escolta.
   · Oleadas: drones de ataque en tandas cada vez más duras; vidas
     compartidas. Se gana al limpiar la última oleada.
   G.tm guarda el estado; las estrellas se calculan al terminar.
   ========================================================================= */
const Team = (() => {
  const KINDS = ['relay', 'escort', 'waves'];
  const is = mode => KINDS.includes(mode);

  function setup(G, cfg) {
    const W = G.world;
    G.tm = { kind: G.mode, cfg, t: 0, k: 0, deliv: 0, wave: -1, toSpawn: 0, spawnT: 0, droneT: 6, nextT: 0, done: false, ok: false, why: '', stars: 0, hint: -1 };
    G.score = [0, 0]; G.targets = []; G.case = null; G.coop = true; G.gates = null;
    G.roundT = cfg.time || 240;
    if (G.mode === 'relay') { Modes.raceSetup(G); G.tm.goal = G.gates.length * (cfg.laps || 2); }
    if (G.mode === 'escort') { G.tm.zone = { x: cfg.zone[0], y: cfg.zone[1], r: 115 }; G.tm.goal = cfg.deliver[0]; dropNew(G, true); }
    if (G.mode === 'waves') { G.lives = cfg.lives || 5; G.tm.goal = cfg.waves.length; }
  }
  // el maletín cae lejos de la zona de entrega
  function dropNew(G, first) {
    const W = G.world, Z = G.tm.zone;
    let p = null;
    for (let i = 0; i < 60; i++) { const q = Modes.spot(G); if (Math.hypot(q.x - Z.x, q.y - Z.y) > 1700) { p = q; break; } }
    if (!p) p = { x: Z.x > W.w / 2 ? 600 : W.w - 600 };
    Modes.dropCase(G, p.x, W.ceil + 60, 0, 0);
    G.case.hurt = 0;
    if (!first) G.events.push({ type: 'caseNew', x: p.x, y: W.ceil + 60 });
  }
  const owner = G => G.tm.k % 2;
  function finish(G, ok, why) {
    const T = G.tm; if (T.done) return;
    T.done = true; T.ok = ok; T.why = why || '';
    const c = T.cfg;
    if (T.kind === 'relay') T.stars = ok ? 1 + (G.roundT >= c.stars[0] ? 1 : 0) + (G.roundT >= c.stars[1] ? 1 : 0) : 0;
    else if (T.kind === 'escort') { const d = T.deliv, D = c.deliver; T.stars = d >= D[0] ? 1 + (d >= D[1] ? 1 : 0) + (d >= D[2] ? 1 : 0) : 0; T.ok = T.stars > 0; }
    else if (T.kind === 'waves') T.stars = ok ? 1 + (G.lives >= 3 ? 1 : 0) + (G.lives >= 4 ? 1 : 0) : 0;
    G.events.push({ type: 'modeEnd', winner: T.ok ? 0 : -1, timeUp: why === 'tiempo' });
  }
  function summary(G) {
    const T = G.tm;
    if (T.kind === 'relay') return T.ok ? `Recorrido completo con ${Math.ceil(G.roundT)} s de sobra` : `Llegaron al aro ${T.k} de ${T.goal}`;
    if (T.kind === 'escort') return `Entregas: ${T.deliv} (meta ${T.cfg.deliver[0]})`;
    return T.ok ? `Oleadas limpias con ${G.lives} vidas` : `Llegaron a la oleada ${T.wave + 1} de ${T.goal}`;
  }

  /* ---------- un paso ---------- */
  function update(G, dt) {
    const T = G.tm; if (!T || T.done || G.state !== 'play') return;
    T.t += dt;
    if (T.kind === 'relay') updateRelay(G, dt);
    else if (T.kind === 'escort') updateEscort(G, dt);
    else updateWaves(G, dt);
  }
  function updateRelay(G, dt) {
    const T = G.tm, n = G.gates.length;
    for (const g of G.gates) { g.flash[0] = Math.max(0, g.flash[0] - dt); g.flash[1] = Math.max(0, g.flash[1] - dt); }
    const g = G.gates[T.k % n], ow = owner(G);
    G.birds.forEach((b, i) => {
      if (!b.alive) return;
      const px = b.px != null ? b.px : b.x, py = b.py != null ? b.py : b.y;
      if (!segCircle(px, py, b.x, b.y, g.x, g.y, g.r)) return;
      if (i === ow) {
        T.k++; g.flash[i] = 0.6; G.score[i]++;
        if (T.k >= T.goal) { G.events.push({ type: 'raceFinish', b, x: b.x, y: b.y }); finish(G, true); return; }
        if (T.k % n === 0) G.events.push({ type: 'lap', b, x: b.x, y: b.y, lap: T.k / n + 1, last: T.k / n + 1 === (T.cfg.laps || 2) });
        else G.events.push({ type: 'gate', b, x: g.x, y: g.y, n: T.k % n });
      } else if (T.hint !== T.k) { T.hint = T.k; G.events.push({ type: 'relayHint', b, x: b.x, y: b.y, who: ow }); }
    });
    G.birds.forEach(b => { b.px = b.x; b.py = b.y; });
    if (!T.done && G.roundT <= 0) finish(G, false, 'tiempo');
  }
  function updateEscort(G, dt) {
    const T = G.tm, Z = T.zone, C = G.case, W = G.world;
    if (C) {
      C.t += dt; C.noPickT = Math.max(0, C.noPickT - dt);
      const cb = C.carrier >= 0 ? G.birds[C.carrier] : null;
      if (cb) {
        if (!cb.alive) { drop(G, cb); }
        else {
          C.x = cb.x - Math.cos(cb.a) * 8; C.y = cb.y + 30;
          if (Math.hypot(cb.x - Z.x, cb.y - Z.y) < Z.r + cb.r) {
            T.deliv++; G.score[cb.id]++;
            G.events.push({ type: 'deliver', b: cb, x: Z.x, y: Z.y, n: T.deliv });
            G.case = null; T.nextT = 1.4;
            if (T.deliv >= T.cfg.deliver[2]) { finish(G, true); return; }
          }
        }
      } else {
        if (C.chute) { C.vy += (70 - C.vy) * Math.min(1, dt * 2); C.vx *= 1 - dt * 1.2; C.vx += Math.sin(C.t * 1.2) * 20 * dt; }
        else C.vy += 600 * dt;
        if (!C.chute && C.vy > 120) C.chute = true;
        const nx = C.x + C.vx * dt, ny = C.y + C.vy * dt, s = World.solidAt(W, nx, ny + 16, 10);
        if (s) { C.vx *= 0.5; C.vy = 0; if (s.kind === 'ground' || s.kind === 'water' || s.kind === 'building') C.chute = false; }
        else { C.x = nx; C.y = ny; }
        C.x = clamp(C.x, 120, W.w - 120);
        for (const b of G.birds) {
          if (!b.alive || (C.noPickT > 0 && b.id === C.noPick)) continue;
          if (Math.hypot(b.x - C.x, b.y - C.y) < b.r + 32) { C.carrier = b.id; C.chute = false; C.hurt = 0; G.events.push({ type: 'caseTake', b, x: b.x, y: b.y }); break; }
        }
      }
    } else if (T.nextT > 0) { T.nextT -= dt; if (T.nextT <= 0) dropNew(G); }
    // drones: más a medida que van entregando; persiguen al que carga el maletín
    T.droneT -= dt;
    const live = G.targets.filter(t => t.alive && t.hostile).length, cap = 2 + Math.min(2, T.deliv) + (T.cfg.extra || 0);
    if (T.droneT <= 0 && live < cap) {
      T.droneT = 4.5 - Math.min(1.5, T.deliv * 0.4);
      const ax = (G.birds[0].x + G.birds[1].x) / 2, x = ax > W.w / 2 ? 260 : W.w - 260, hp = 5 + Math.min(3, T.deliv);
      Boss.spawnDrone(G, x, W.ceil + 240 + G.rng() * 300, { hp, max: hp, speed: 270, rate: 1.4, dmg: 6, prefer: g => (g.case && g.case.carrier >= 0 ? g.birds[g.case.carrier] : null) });
    }
    Boss.droneStep(G, dt);
    if (!T.done && G.roundT <= 0) finish(G, T.deliv >= T.cfg.deliver[0], 'tiempo');
  }
  function drop(G, cb) {
    Modes.dropCase(G, cb.x, cb.y + 20, cb.vx * 0.3, -160, -1);
    G.case.hurt = 0; G.case.noPickT = 0;
    G.events.push({ type: 'caseDrop', b: cb, x: cb.x, y: cb.y });
  }
  function updateWaves(G, dt) {
    const T = G.tm, W = G.world, waves = T.cfg.waves;
    const live = G.targets.filter(t => t.alive && t.hostile).length;
    if (live === 0 && T.toSpawn === 0) {
      T.wave++;
      if (T.wave >= waves.length) { finish(G, true); return; }
      T.toSpawn = waves[T.wave]; T.spawnT = 1.6;
      G.events.push({ type: 'wave', n: T.wave + 1, of: waves.length, x: G.birds[0].x, y: G.birds[0].y });
    }
    if (T.toSpawn > 0) {
      T.spawnT -= dt;
      if (T.spawnT <= 0) {
        T.spawnT = 0.75; T.toSpawn--;
        const w = T.wave, left = T.toSpawn % 2 === 0, x = left ? 240 : W.w - 240;
        Boss.spawnDrone(G, x, W.ceil + 200 + G.rng() * 420, { hp: 5 + w * 2, max: 5 + w * 2, rate: 1.5 - w * 0.25, speed: 240 + w * 40, dmg: 6 + w, tough: w >= 2 });
      }
    }
    Boss.droneStep(G, dt);
    if (G.lives <= 0) finish(G, false, 'vidas');
    else if (G.roundT <= 0) finish(G, false, 'tiempo');
  }
  function event(G, e) {
    const T = G.tm; if (!T) return;
    // drones o choques le tumban el maletín al que lo carga (no de una: se acumula)
    if (T.kind === 'escort' && G.case && e.type === 'hurt' && G.case.carrier === e.b.id && e.from < 0 && G.state === 'play') {
      G.case.hurt = (G.case.hurt || 0) + e.n;
      if (G.case.hurt >= 0.04 * e.b.sp.hp && e.b.alive) drop(G, e.b);
    }
    if (T.kind === 'waves' && e.type === 'down' && G.state === 'play') G.lives--;
  }
  // dónde reaparece el que cae
  function respawnPos(G, i) {
    if (G.mode === 'relay') { const n = G.gates.length, g = G.gates[(G.tm.k - 1 + n) % n], h = G.gates[G.tm.k % n]; return { x: g.x, y: g.y + (i ? 40 : -40), f: h.x >= g.x ? 1 : -1 }; }
    return null;
  }

  /* ---------- la máquina (para probar y por si algún día hace de compañera) ---------- */
  function botGoal(bot, G, o) {
    const b = bot.b, T = G.tm, W = G.world;
    if (T.kind === 'relay') {
      const n = G.gates.length, idx = owner(G) === b.id ? T.k : T.k + 1, g = G.gates[idx % n], d = Math.hypot(g.x - b.x, g.y - b.y);
      let tx = g.x, ty = g.y;
      const P = G.racePaths && G.racePaths[idx % n];
      if (P && P.length > 1 && !Modes.clearLine(W, b.x, b.y, g.x, g.y, 24)) {
        let best = P[0], bd = Infinity;
        for (let j = P.length - 1; j >= 0; j--) if (Modes.clearLine(W, b.x, b.y, P[j].x, P[j].y, 24)) { best = P[j]; break; } else { const dd = Math.hypot(P[j].x - b.x, P[j].y - b.y); if (dd < bd) { bd = dd; best = P[j]; } }
        tx = best.x; ty = best.y;
      }
      // el que espera su turno no se pasa del aro: se queda dando vueltas cerca
      const mine = owner(G) === b.id, slow = !mine && d < 260;
      return { x: tx, y: ty, d, boost: mine ? (g.r < 74 && d < 650 ? b.s < 380 : d > 380 || b.s < 520) : d > 700, tag: 'relevo', loiter: slow };
    }
    if (T.kind === 'escort') {
      const C = G.case, Z = T.zone;
      const drone = nearestDrone(G, b, 900);
      if (C && C.carrier === b.id) return { x: Z.x, y: Z.y, d: Math.hypot(Z.x - b.x, Z.y - b.y), boost: true, tag: 'equipo' };
      if (C && C.carrier < 0) { const d = Math.hypot(C.x - b.x, C.y - b.y); return { x: C.x, y: C.y, d, boost: d > 400, tag: 'equipo' }; }
      if (drone) return { x: drone.x, y: drone.y, d: Math.hypot(drone.x - b.x, drone.y - b.y), shoot: true, boost: false, tag: 'equipo' };
      const tgt = C && C.carrier >= 0 ? G.birds[C.carrier] : Z;
      return { x: tgt.x, y: tgt.y - 120, d: Math.hypot(tgt.x - b.x, tgt.y - b.y), boost: false, tag: 'equipo' };
    }
    const drone = nearestDrone(G, b, 3000);
    if (drone) { const d = Math.hypot(drone.x - b.x, drone.y - b.y); return { x: drone.x, y: drone.y, d, shoot: true, boost: d > 900, tag: 'equipo' }; }
    return { x: W.w / 2, y: W.ceil + 500, d: 999, boost: false, tag: 'equipo' };
  }
  function nearestDrone(G, b, maxD) {
    let best = null, bd = maxD;
    for (const D of G.targets) if (D.alive && D.hostile) { const d = Math.hypot(D.x - b.x, D.y - b.y); if (d < bd) { bd = d; best = D; } }
    return best;
  }

  /* ---------- dibujo ---------- */
  function draw(ctx, G) {
    const T = G.tm; if (!T) return;
    const t = G.time;
    if (T.kind === 'relay') drawRelay(ctx, G, t);
    if (T.kind === 'escort') {
      // zona de entrega: anillo verde con un haz de luz
      const Z = T.zone, pulse = 0.5 + 0.5 * Math.sin(t * 3);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, Z.y, 0, Z.y - 900); g.addColorStop(0, 'rgba(120,255,160,0.32)'); g.addColorStop(1, 'rgba(120,255,160,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(Z.x - 40, Z.y); ctx.lineTo(Z.x - 90, Z.y - 900); ctx.lineTo(Z.x + 90, Z.y - 900); ctx.lineTo(Z.x + 40, Z.y); ctx.closePath(); ctx.fill();
      const rg = ctx.createRadialGradient(Z.x, Z.y, Z.r * 0.4, Z.x, Z.y, Z.r * 1.3); rg.addColorStop(0, 'rgba(120,255,160,0)'); rg.addColorStop(0.75, `rgba(120,255,160,${0.12 + 0.1 * pulse})`); rg.addColorStop(1, 'rgba(120,255,160,0)');
      ctx.fillStyle = rg; ctx.fillRect(Z.x - Z.r * 1.3, Z.y - Z.r * 1.3, Z.r * 2.6, Z.r * 2.6);
      ctx.restore();
      ctx.strokeStyle = '#9dff9a'; ctx.lineWidth = 4; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -t * 30;
      ctx.beginPath(); ctx.arc(Z.x, Z.y, Z.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = font(20); ctx.textAlign = 'center'; ctx.fillStyle = '#d8ffd8'; ctx.fillText('ENTREGA', Z.x, Z.y - Z.r - 12);
      Modes.draw(ctx, G);
    }
    Boss.drawDrones(ctx, G);
  }
  function drawRelay(ctx, G, t) {
    const T = G.tm, n = G.gates.length, cur = T.k % n, nxt = (T.k + 1) % n, ow = owner(G);
    for (const g of G.gates) {
      const isCur = g.i === cur && !T.done, isNext = g.i === nxt && !T.done;
      const who = isCur ? ow : isNext ? 1 - ow : -1, rx = g.r * 0.42, ry = g.r;
      ctx.save(); ctx.translate(g.x, g.y);
      if (isCur) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const col = PLAYER_COLORS[ow].glow, gl = ctx.createRadialGradient(0, 0, g.r * 0.4, 0, 0, g.r * 1.7);
        gl.addColorStop(0, `rgba(${col},0)`); gl.addColorStop(0.6, `rgba(${col},${0.2 + 0.1 * Math.sin(t * 6)})`); gl.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = gl; ctx.fillRect(-g.r * 1.7, -g.r * 1.7, g.r * 3.4, g.r * 3.4); ctx.restore();
      }
      ctx.globalAlpha = who >= 0 ? (isCur ? 1 : 0.55) : 1;
      ctx.lineWidth = isCur ? 9 : who >= 0 ? 6 : 4;
      ctx.strokeStyle = who >= 0 ? PLAYER_COLORS[who].main : 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.stroke();
      const fl = Math.max(g.flash[0], g.flash[1]);
      if (fl > 0) { ctx.globalAlpha = 1; ctx.strokeStyle = `rgba(255,255,255,${fl})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, rx + (0.6 - fl) * 90, ry + (0.6 - fl) * 90, 0, 0, TAU); ctx.stroke(); }
      ctx.globalAlpha = 1;
      if (who >= 0) { ctx.font = font(isCur ? 22 : 17); ctx.textAlign = 'center'; ctx.fillStyle = PLAYER_COLORS[who].main; ctx.fillText(`J${who + 1}`, 0, -ry - 12); }
      ctx.restore();
    }
  }
  // flechas en el borde: a tu próximo aro, al maletín o a la entrega, a los drones
  function drawPointer(ctx, G, cam, sw, sh) {
    const T = G.tm; if (!T || T.done) return;
    const arrow = (x, y, col, size = 1) => {
      const sx = sw / 2 + (x - cam.x) * cam.z, sy = sh / 2 + (y - cam.y) * cam.z, m = 40;
      if (sx > m && sx < sw - m && sy > m + 90 && sy < sh - m) return;
      const cx = clamp(sx, m, sw - m), cy = clamp(sy, m + 100, sh - m), a = Math.atan2(sy - cy, sx - cx);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); ctx.scale(size, size); ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-10, -12); ctx.lineTo(-4, 0); ctx.lineTo(-10, 12); ctx.closePath(); ctx.fill(); ctx.restore();
    };
    if (T.kind === 'relay') {
      const n = G.gates.length, ow = owner(G);
      for (let i = 0; i < 2; i++) { const g = G.gates[(i === ow ? T.k : T.k + 1) % n]; arrow(g.x, g.y, PLAYER_COLORS[i].main, i === ow ? 1 : 0.75); }
    } else if (T.kind === 'escort') {
      const C = G.case;
      if (C && C.carrier >= 0) arrow(T.zone.x, T.zone.y, '#9dff9a');
      else if (C) arrow(C.x, C.y, '#ffd23f');
      let k = 0; for (const D of G.targets) if (D.alive && D.hostile && k++ < 3) arrow(D.x, D.y, 'rgba(255,90,78,0.85)', 0.6);
    } else {
      let k = 0; for (const D of G.targets) if (D.alive && D.hostile && k++ < 5) arrow(D.x, D.y, 'rgba(255,90,78,0.9)', 0.7);
    }
  }
  // panel del centro: tiempo y cómo van
  function drawHUD(ctx, G, sw, sh, u, glass) {
    const T = G.tm; if (!T) return;
    const room = sw - 2 * (10 * u + 214 * u) - 16, lw = Touch.enabled ? Math.min(270 * u, room) : 270 * u, lh = 50 * u, ly = Touch.enabled ? 60 : 10;
    ctx.save(); glass(sw / 2 - lw / 2, ly, lw, lh, 12 * u);
    const tt = Math.max(0, Math.ceil(G.roundT)), mm = Math.floor(tt / 60), ss = String(tt % 60).padStart(2, '0');
    ctx.textAlign = 'center'; ctx.font = font(Math.max(10, 11 * u)); ctx.fillStyle = tt <= 15 && T.kind !== 'waves' ? '#ff8f8f' : 'rgba(255,255,255,0.85)';
    ctx.fillText(`${MODES[T.kind].name} · ${mm}:${ss}`, sw / 2, ly + 15 * u);
    ctx.font = font(Math.max(13, 17 * u));
    if (T.kind === 'relay') {
      const ow = owner(G); ctx.fillStyle = '#ffffff'; ctx.fillText(`aro ${Math.min(T.k + 1, T.goal)} / ${T.goal}`, sw / 2 - 40 * u, ly + 36 * u);
      ctx.fillStyle = PLAYER_COLORS[ow].main; ctx.font = font(Math.max(11, 13 * u)); ctx.fillText(`le toca a J${ow + 1}`, sw / 2 + 62 * u, ly + 36 * u);
      const k = T.k / T.goal, bw = lw - 28 * u, bx = sw / 2 - bw / 2; ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(bx, ly + 42 * u, bw, 3.5 * u); ctx.fillStyle = '#9dff9a'; ctx.fillRect(bx, ly + 42 * u, bw * k, 3.5 * u);
    } else if (T.kind === 'escort') {
      const D = T.cfg.deliver; ctx.fillStyle = T.deliv >= D[0] ? '#9dff9a' : '#ffffff';
      ctx.fillText(`entregas ${T.deliv} / ${D[0]}`, sw / 2, ly + 36 * u);
      ctx.fillStyle = '#ffd36b'; ctx.font = font(Math.max(9, 10 * u)); ctx.textAlign = 'right'; ctx.fillText(`★★ ${D[1]} · ★★★ ${D[2]}`, sw / 2 + lw / 2 - 12 * u, ly + 46 * u);
    } else {
      const live = G.targets.filter(t => t.alive && t.hostile).length + T.toSpawn;
      ctx.fillStyle = '#ffffff'; ctx.fillText(`oleada ${Math.max(1, Math.min(T.wave + 1, T.goal))} / ${T.goal} · drones ${live}`, sw / 2, ly + 34 * u);
      ctx.fillStyle = '#ff8f8f'; ctx.font = font(Math.max(10, 12 * u)); ctx.fillText('♥'.repeat(Math.max(0, G.lives)), sw / 2, ly + 47 * u);
    }
    ctx.restore();
  }
  return { KINDS, is, setup, update, event, finish, summary, respawnPos, botGoal, draw, drawPointer, drawHUD };
})();
