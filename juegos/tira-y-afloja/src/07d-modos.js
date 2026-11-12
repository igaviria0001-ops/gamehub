/* =========================================================================
   MODOS NUEVOS
   · Rey del borrador: un borrador gigante se desliza por el piso (y se sube a
     lo que encuentre). Mientras estés tú solo encima sumas puntos. Primero a 20.
   · Gol de canica: en la cancha del gimnasio, mete la canica en el arco del
     otro (una cartuchera). Se patea, se cabecea, se aplasta y el hilo tenso
     también le pega: puedes barrerla. Primero a 5; si empatan, gol de oro.
   ========================================================================= */
const Modes = (() => {
  const CFG = {
    chicles: { time: 75, dunk: 5, title: '¡ATRAPA CHICLES!' },
    rey: { time: 100, goal: 20, dunk: 3, title: '¡REY DEL BORRADOR!', sub: 'primero a 20' },
    gol: { time: 150, goal: 5, dunk: 0, title: '¡GOL DE CANICA!', sub: 'primero a 5' },
    escalada: { rounds: true, title: '¡A LA CAMPANA!', sub: 'toca la campana' },
    fuga: { coop: true, title: '¡A ESCAPAR!', sub: 'suban los dos' },
    jefe: { coop: true, title: '¡A PELEAR!', sub: 'contra el jefe' },
    campana: { coop: true, title: '¡A ESCAPAR!', sub: 'salgan los dos' },
  };
  const FUGA_LEVELS = 12;
  const fugaSave = () => Store.set('fuga', M.fugaData);
  const M = { throne: null, ball: null, goalT: 0, golden: false, goldenEnd: undefined, lastTouch: null, contest: 0, contestShown: false };
  const cfg = mode => CFG[mode] || CFG.chicles;
  M.fugaData = (() => { const d = Store.get('fuga', null); return d && d.stars ? d : { stars: {}, best: {} }; })();

  /* ---------------- preparar ---------------- */
  function clear() {
    if (M.throne) ARENA.oneway = ARENA.oneway.filter(R => R !== M.throne);
    M.throne = null; M.ball = null; M.goalT = 0; M.golden = false; M.goldenEnd = undefined; M.lastTouch = null; M.contest = 0;
  }
  function setup(G) {
    clear();
    Jefes.clear();
    if (G.mode === 'jefe') Jefes.setup(G);
    if (G.mode === 'campana') Campaign.setup(G);
    if (G.mode === 'rey') makeThrone();
    if (G.mode === 'gol') makeBall(0);
    if (G.mode === 'escalada' || G.mode === 'fuga') { M.waterY = 900; M.climbT = 0; M.winner = undefined; M.best = [640, 640]; M.fugaFail = 0; M.fugaWin = 0; }
  }

  /* ---------------- Escalada tramposa ---------------- */
  function updateWater(dt, G) {
    if (G.state !== 'play') return;
    M.climbT += dt;
    const fuga = G.mode === 'fuga', lv = G.fugaLevel || 1;
    if (M.climbT < (fuga ? 7 : 5)) return;
    let speed = fuga ? 12 + lv * 1.8 + Math.min(40, (M.climbT - 7) * 0.7) : 24 + Math.min(70, (M.climbT - 5) * 1.3);
    const alive = G.players.filter(p => p.alive);
    if (alive.length) {
      const lead = Math.min(...alive.map(p => p.y));
      if (M.waterY - lead > 1200) speed *= 2.4; // si el de adelante va muy arriba, el agua corre a alcanzar
    }
    M.waterY = Math.max(ARENA.L.topY + 260, M.waterY - speed * dt);
  }
  function drown(p, G) {
    p.alive = false; p.dunked = true; p.dunkT = 0; p.dunkX = p.x; p.stuck = false; p.mood = 'panic';
    G.replayMark = G.t;
    G.rope.visible = false; // el hilo se revienta: el otro no se ahoga con él
    if (!G.quiet) {
      Sound.play('splash'); FX.gum(p.x, M.waterY, p.col, 10, 1.1, 0, -1); FX.shake(0.5);
      FX.banner('¡AL AGUA!', { sub: p.name, size: 120, life: 1.3, color: '#8fd3ff', y: 0.34 });
    }
    G.slowT = 0.5;
  }
  function postEscalada(G) {
    const bell = ARENA.L.bell, top = ARENA.L.topY;
    if (G.mode === 'fuga') return postFuga(G);
    for (const p of G.players) {
      if (!p.alive) continue;
      M.best[p.id] = Math.min(M.best[p.id], p.y);
      if (G.state !== 'play') continue;
      if (p.y + p.r * 0.35 > M.waterY) { drown(p, G); continue; }
      if (M.winner === undefined && p.y < top && Math.abs(p.x - bell.x) < 120 && p.y > bell.y - 160) {
        M.winner = p.id; p.stats.bells++; ARENA.bellT = 1; G.replayMark = G.t;
        Progress.on('bell', { p, t: G.roundT });
        if (!G.quiet) { Sound.play('bell'); Sound.play('win'); FX.confetti(bell.x, bell.y - 100, 120, 1300); FX.banner('¡DIN DON!', { sub: `${p.name} tocó la campana`, size: 150, life: 2, color: p.col.base, y: 0.36 }); }
      }
    }
  }
  /* ---------------- Fuga del colegio (cooperativo) ---------------- */
  function postFuga(G) {
    if (G.state !== 'play') return;
    const top = ARENA.L.topY;
    for (const p of G.players) {
      if (!p.alive) continue;
      if (p.y + p.r * 0.35 > M.waterY && !M.fugaFail) {
        drown(p, G); M.fugaFail = 1.6;
        if (!G.quiet) FX.banner('¡OTRA VEZ!', { sub: 'el agua los alcanzó', size: 120, life: 1.4, color: '#8fd3ff', y: 0.42 });
      }
    }
    if (!M.fugaFail && !M.fugaWin && G.players.every(p => p.alive && p.y < top + 8)) {
      M.fugaWin = G.roundT; ARENA.bellT = 1;
      const lv = G.fugaLevel || 1, par = fugaPar(lv), t = G.roundT;
      const stars = t <= par ? 3 : t <= par * 1.45 ? 2 : 1;
      M.fugaResult = { level: lv, time: t, stars, par, newBest: !(M.fugaData.best[lv] <= t) };
      M.fugaData.stars[lv] = Math.max(M.fugaData.stars[lv] || 0, stars);
      if (!(M.fugaData.best[lv] <= t)) M.fugaData.best[lv] = +t.toFixed(1);
      fugaSave();
      if (!G.quiet) { Sound.play('bell'); Sound.play('win'); FX.confetti(960, top - 200, 140, 1300); FX.banner('¡ESCAPARON!', { sub: `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}  ·  ${t.toFixed(1)} s`, size: 140, life: 2.4, color: '#ffd84d', y: 0.36 }); }
    }
  }
  function fugaPar(lv) { return Math.round((1150 + lv * 175) / 62); }
  // 'win' cuando escapan (después de celebrar), 'retry' para repetir el nivel
  function fugaStatus(G, dt) {
    if (M.fugaFail) { M.fugaFail -= dt; if (M.fugaFail <= 0) { M.fugaFail = 0; return 'retry'; } }
    if (M.fugaWin && G.roundT - M.fugaWin > 2.2) return 'win';
    return undefined;
  }

  function drawWater(ctx, G, t) {
    if ((G.mode !== 'escalada' && G.mode !== 'fuga') || M.waterY === undefined) return;
    const y = M.waterY, v = G.view, yb = v.vy + v.hh + 60;
    if (y > yb) return;
    ctx.save();
    const g = ctx.createLinearGradient(0, y, 0, y + 500);
    g.addColorStop(0, 'rgba(80,170,230,0.78)'); g.addColorStop(1, 'rgba(30,80,150,0.92)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(200, yb);
    for (let x = 200; x <= 1720; x += 20) ctx.lineTo(x, y + Math.sin(x * 0.02 + t * 3) * 7 + Math.sin(x * 0.05 - t * 2) * 3);
    ctx.lineTo(1720, yb); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 4; ctx.beginPath();
    for (let x = 200; x <= 1720; x += 20) { const yy = y + Math.sin(x * 0.02 + t * 3) * 7 + Math.sin(x * 0.05 - t * 2) * 3; x === 200 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); }
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let k = 0; k < 18; k++) { const bx = 380 + ((k * 137 + t * 30) % 1160), by = y + 40 + ((k * 71 + t * 60) % 300); ctx.beginPath(); ctx.arc(bx, by, 3 + (k % 3), 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  function drawClimbHUD(ctx, W, H, G) {
    if ((G.mode !== 'escalada' && G.mode !== 'fuga') || !ARENA.L || ARENA.L.topY === undefined) return;
    const top = ARENA.L.topY, y0 = 160, y1 = H - 140, x = W - 52;
    const Y = wy => y1 - clamp((640 - wy) / (640 - top), 0, 1) * (y1 - y0);
    const rr = ArenaArt.rr, ink = PALETTE.ink;
    ctx.save();
    rr(ctx, x - 13, y0 - 10, 26, y1 - y0 + 20, 13); ctx.fillStyle = 'rgba(255,246,230,0.85)'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = ink; ctx.stroke();
    const wy = Y(M.waterY);
    ctx.save(); rr(ctx, x - 13, y0 - 10, 26, y1 - y0 + 20, 13); ctx.clip();
    ctx.fillStyle = 'rgba(70,160,225,0.85)'; ctx.fillRect(x - 13, wy, 26, y1 + 20 - wy);
    ctx.restore();
    // campana arriba
    ctx.fillStyle = '#ffd84d'; ctx.beginPath(); ctx.moveTo(x - 10, y0 - 18); ctx.quadraticCurveTo(x - 9, y0 - 40, x, y0 - 42); ctx.quadraticCurveTo(x + 9, y0 - 40, x + 10, y0 - 18); ctx.closePath(); ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
    G.players.forEach(p => {
      if (!p.alive && !p.dunked) return;
      const py = Y(p.y);
      ctx.beginPath(); ctx.arc(x + (p.id ? 6 : -6), py, 10, 0, TAU); ctx.fillStyle = p.col.base; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
    });
    ctx.restore();
  }

  /* ---------------- Rey del borrador ---------------- */
  function surfaceUnder(x, w) {
    let top = ARENA.deskY;
    const lim = ARENA.deskY - 130;
    const scan = list => { for (const R of list) { if (R === M.throne || R.x + R.w < x + 6 || R.x > x + w - 6) continue; if (R.y >= lim && R.y < top) top = R.y; } };
    scan(ARENA.solids); scan(ARENA.oneway);
    return top;
  }
  function makeThrone() {
    const T = { x: 960 - 95, y: 0, w: 190, h: 24, kind: 'throne', dx: 0, dy: 0, dir: Math.random() < 0.5 ? 1 : -1, speed: 0, t: 0, pause: 1.0, flip: 6, owner: -1, glow: 0 };
    T.y = surfaceUnder(T.x, T.w) - T.h - 4;
    M.throne = T;
    ARENA.oneway = [...ARENA.oneway, T];
  }
  function updateThrone(dt, G) {
    const T = M.throne; if (!T) return;
    const px = T.x, py = T.y;
    if (G.state === 'play') {
      T.t += dt;
      if (T.pause > 0) T.pause -= dt;
      else {
        const target = 130 + Math.min(120, T.t * 1.3); // con el tiempo va más rápido
        T.speed += (target - T.speed) * Math.min(1, dt * 2);
        T.x += T.dir * T.speed * dt;
        T.flip -= dt;
        const lo = ARENA.deskLeft + 24, hi = ARENA.deskRight - 24 - T.w;
        if (T.x < lo || T.x > hi || T.flip <= 0) {
          // da la vuelta en los bordes (justo encima de la caneca: lo más peligroso) o a ratos
          T.x = clamp(T.x, lo, hi); T.dir = -T.dir; T.speed *= 0.25; T.pause = 0.45; T.flip = 4.5 + ((T.t * 7.13) % 4);
        }
      }
    }
    const ty = surfaceUnder(T.x, T.w) - T.h - 4;
    T.y += (ty - T.y) * Math.min(1, dt * 10);
    T.dx = T.x - px; T.dy = T.y - py;
  }
  function scoreRey(dt, G) {
    const T = M.throne; if (!T) return;
    const on = G.players.map(p => p.alive && ((p.onGround && p.groundR === T) || (p.stuck && p.stuckR === T)));
    T.owner = on[0] && !on[1] ? 0 : on[1] && !on[0] ? 1 : on[0] && on[1] ? 2 : -1;
    // en disputa suma (a mitad de ritmo) el que esté más al centro: hay que empujar, no basta con estar
    const tc = T.x + T.w / 2;
    T.lead = T.owner === 2 ? (Math.abs(G.players[0].x - tc) < Math.abs(G.players[1].x - tc) - 6 ? 0 : Math.abs(G.players[1].x - tc) < Math.abs(G.players[0].x - tc) - 6 ? 1 : -1) : T.owner;
    T.glow = lerp(T.glow, T.lead === 0 || T.lead === 1 ? 1 : 0, Math.min(1, dt * 6));
    if (G.state !== 'play') return;
    if (T.lead === 0 || T.lead === 1) {
      const p = G.players[T.lead], rate = T.owner === 2 ? 0.5 : 1;
      const before = Math.floor(G.points[T.lead]);
      G.points[T.lead] += dt * rate; p.stats.crown += dt * rate;
      if (Math.floor(G.points[T.lead]) > before && !G.quiet) { Sound.play('pellet', 1 + (before % 5) * 0.05); FX.callout('+1', p.x, p.y - p.r - 36, p.col.light, 34, 0.7); }
    }
    if (T.owner === 2) {
      M.contest += dt;
      if (M.contest > 0.5 && !M.contestShown && !G.quiet) { M.contestShown = true; FX.callout('¡EN DISPUTA!', T.x + T.w / 2, T.y - 90, '#ffffff', 40, 1); }
    } else { M.contest = 0; M.contestShown = false; }
  }

  /* ---------------- Gol de canica ---------------- */
  function makeBall(toward) {
    M.ball = { x: 960, y: 330, vx: (toward || (Math.random() < 0.5 ? -1 : 1)) * 70, vy: 0, r: 24, rot: 0, onGround: false, trail: [] };
  }
  function kickoff(G, toward) {
    const [A, B] = G.players, sp = ARENA.spawns;
    A.reset(sp[0].x, sp[0].y, 3); B.reset(sp[1].x, sp[1].y, 3);
    G.respawn = [0, 0];
    G.rope.reset(A.x, A.y, B.x, B.y, 400); G.rope.visible = true; G.ropeCut = false;
    makeBall(toward);
    M.goalT = 0; M.lastTouch = null;
    G.state = 'countdown'; G.stateT = 0; G.canControl = false; G.cdMarks = {}; G.kickoff = true;
  }
  function updateBall(dt, G) {
    if (M.goalT > 0) {
      M.goalT -= dt;
      if (M.goalT <= 0 && G.state === 'play') kickoff(G, M.goalSide);
      return;
    }
    const b = M.ball; if (!b) return;
    const prevY = b.y;
    b.vy += PHYS.g * ARENA.mods.gravity * dt;
    if (ARENA.mods.push) b.vx += ARENA.mods.push * 0.6 * dt;
    const w = ARENA.windAt(b.x, b.y); if (w) b.vx += w * 0.6 * dt;
    b.vx *= 1 - (b.onGround ? 0.5 : 0.04) * dt;
    const sp = Math.hypot(b.vx, b.vy);
    if (sp > 2600) { b.vx *= 2600 / sp; b.vy *= 2600 / sp; }
    b.x += b.vx * dt; b.y += b.vy * dt;
    const cs = ARENA.collideCircle(b, prevY);
    b.onGround = false;
    for (const c of cs) {
      const imp = c.impact || 0;
      if (c.ny < -0.6) b.onGround = true;
      if (imp > 90) {
        const e = c.R.bounce ? 1.0 : 0.62;
        b.vx += c.nx * imp * e; b.vy += c.ny * imp * e;
        if (imp > 320 && !G.quiet) Sound.play('bump', clamp(imp / 1300, 0.2, 0.8));
      }
    }
    b.rot += b.vx * dt / b.r;
    if (sp > 900) b.trail.push({ x: b.x, y: b.y, a: 0.4 });
    for (const g of b.trail) g.a -= dt * 2.4;
    b.trail = b.trail.filter(g => g.a > 0).slice(-8);
    // se cayó a una caneca: saque desde el centro
    if (b.y > ARENA.hazardY + 40) { if (!G.quiet) FX.callout('¡FUERA!', clamp(b.x, 300, WORLD_W - 300), ARENA.deskY - 40, '#ffffff', 46, 1); kickoff(G, b.x < 960 ? 1 : -1); }
  }
  function ballPlayers(G) {
    const b = M.ball; if (!b || M.goalT > 0) return;
    for (const p of G.players) {
      if (!p.alive) continue;
      const dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy) || 0.01, min = b.r + p.r;
      if (d >= min) continue;
      const nx = dx / d, ny = dy / d, mb = 0.7, mp = p.stuck ? 1e6 : p.mass, pen = min - d;
      b.x += nx * pen * (mp / (mb + mp)); b.y += ny * pen * (mp / (mb + mp));
      if (!p.stuck) { p.x -= nx * pen * (mb / (mb + mp)); p.y -= ny * pen * (mb / (mb + mp)); }
      const vrel = (b.vx - p.vx) * nx + (b.vy - p.vy) * ny;
      if (vrel < 0) {
        const j = -(1 + 0.72) * vrel / (1 / mb + 1 / mp);
        b.vx += j / mb * nx; b.vy += j / mb * ny;
        if (!p.stuck) { p.vx -= j / mp * nx; p.vy -= j / mp * ny; }
        // patada: si vas hacia la canica a propósito (corriendo, tirachinas o picada) sale con más fuerza
        const kick = (p.moveDir && p.moveDir === Math.sign(nx)) || p.slingT > 0 || p.diveT > 0;
        M.lastSling = p.slingT > 0 ? p.id : null;
        if (kick && -vrel > 140) {
          const k = clamp(-vrel * 0.35, 120, 520) + (p.slingT > 0 ? 320 : 0);
          b.vx += nx * k; b.vy += ny * k - 170;
          if (!G.quiet) { Sound.play('ram', clamp(-vrel / 1500, 0.3, 0.8)); FX.ring(b.x, b.y, '#ffffff', 46, 0.25, 4); if (p.slingT > 0) FX.callout('¡CAÑONAZO!', b.x, b.y - 60, '#ffd84d', 46, 1); }
        } else if (-vrel > 260 && !G.quiet) Sound.play('bump', 0.45);
        M.lastTouch = p.id;
      }
    }
  }
  function ballRope(G, dt) {
    const b = M.ball, R = G.rope; if (!b || !R.visible || M.goalT > 0) return;
    const P = R.pts, n = P.length, min = b.r + ROPE.rad + 3;
    for (let i = 2; i < n - 2; i++) {
      const p = P[i], dx = b.x - p.x, dy = b.y - p.y, d2 = dx * dx + dy * dy;
      if (d2 >= min * min) continue;
      const d = Math.sqrt(d2) || 0.01, nx = dx / d, ny = dy / d, pen = min - d;
      b.x += nx * pen * 0.8; b.y += ny * pen * 0.8;
      p.x -= nx * pen * 0.2; p.y -= ny * pen * 0.2;
      const pvx = (p.x - p.px) / dt, pvy = (p.y - p.py) / dt;
      const vrel = (b.vx - pvx) * nx + (b.vy - pvy) * ny;
      if (vrel < 0) {
        const taut = clamp((R.strain - 0.98) * 6, 0.3, 1); // hilo tenso = le pega más duro
        b.vx -= 1.5 * vrel * nx * taut; b.vy -= 1.5 * vrel * ny * taut;
        if (-vrel > 500 && !G.quiet) Sound.play('boing', 2.5);
      }
    }
  }
  function checkGoals(G) {
    const b = M.ball; if (!b || M.goalT > 0 || G.state !== 'play') return;
    for (const g of ARENA.goals) {
      if (b.x > g.x + 6 && b.x < g.x + g.w - 6 && b.y > g.y + 4 && b.y < g.y + g.h + 10) {
        const scorer = g.side < 0 ? 1 : 0; // el arco de la izquierda lo defiende el jugador 1
        const p = G.players[scorer];
        G.points[scorer]++; p.stats.goals++;
        const own = M.lastTouch !== null && M.lastTouch !== scorer;
        Progress.on('goal', { scorer, own, sling: M.lastSling === scorer && M.lastTouch === scorer });
        M.goalT = 2.4; M.goalSide = g.side; M.flash = 1;
        if (M.golden) M.goldenEnd = scorer;
        G.slowT = 0.5;
        if (!G.quiet) {
          Sound.play('golden'); Sound.play('roundWin'); FX.shake(0.6);
          FX.confetti(g.mouthX, 540, 90, 1100);
          FX.banner('¡GOOOL!', { sub: own ? `autogol: punto para ${p.name}` : `de ${p.name}`, color: p.col.base, size: 170, life: 2.1, y: 0.36 });
        }
        return;
      }
    }
  }

  /* ---------------- ganchos del juego ---------------- */
  function update(dt, G) {
    if (G.mode === 'escalada' || G.mode === 'fuga') updateWater(dt, G);
    if (G.mode === 'rey') updateThrone(dt, G);
    if (G.mode === 'gol') updateBall(dt, G);
    if (G.mode === 'jefe') Jefes.update(dt, G);
    if (G.mode === 'campana') Campaign.update(dt, G);
    if (M.flash > 0) M.flash = Math.max(0, M.flash - dt);
  }
  function post(dt, G) {
    if (G.mode === 'rey') scoreRey(dt, G);
    if (G.mode === 'gol') { ballPlayers(G); ballRope(G, dt); checkGoals(G); }
    if (G.mode === 'escalada' || G.mode === 'fuga') postEscalada(G);
    if (G.mode === 'jefe') Jefes.post(dt, G);
    if (G.mode === 'campana') Campaign.post(dt, G);
  }
  // ¿se acabó la partida? devuelve el ganador (0/1), null si es empate, o undefined si sigue
  function check(G) {
    const C = cfg(G.mode);
    if (G.mode === 'escalada') {
      if (M.winner !== undefined) return M.winner;
      const [A, B] = G.players;
      if (!A.alive && !B.alive) return null;
      if (!A.alive) return 1;
      if (!B.alive) return 0;
      return undefined;
    }
    if (G.mode === 'gol') {
      if (M.goalT > 0 && M.goalT > 0.5) return undefined; // dejar ver la celebración
      for (let i = 0; i < 2; i++) if (G.points[i] >= C.goal) return i;
      if (M.golden) return M.goldenEnd !== undefined ? M.goldenEnd : undefined;
      if (G.roundT >= C.time) {
        if (G.points[0] === G.points[1]) {
          M.golden = true;
          if (!G.quiet) { FX.banner('¡GOL DE ORO!', { sub: 'el próximo gol gana', size: 130, life: 2, color: '#ffd84d' }); Sound.play('bell'); }
          return undefined;
        }
        return G.points[0] > G.points[1] ? 0 : 1;
      }
      return undefined;
    }
    if (C.goal) for (let i = 0; i < 2; i++) if (G.points[i] >= C.goal) return i;
    if (G.roundT >= C.time) {
      const a = Math.floor(G.points[0]), b = Math.floor(G.points[1]);
      return a === b ? null : a > b ? 0 : 1;
    }
    return undefined;
  }

  /* ---------------- dibujo ---------------- */
  function drawThrone(ctx, G, t) {
    const T = M.throne; if (!T) return;
    const rr = ArenaArt.rr, ink = PALETTE.ink;
    const owner = T.lead === 0 || T.lead === 1 ? G.players[T.lead] : null;
    // sombra
    ctx.fillStyle = 'rgba(40,20,10,0.22)';
    ctx.beginPath(); ctx.ellipse(T.x + T.w / 2, surfaceUnder(T.x, T.w) + 2, T.w * 0.48, 7, 0, 0, TAU); ctx.fill();
    // brillo del dueño
    if (T.glow > 0.02 && owner) {
      const g = ctx.createRadialGradient(T.x + T.w / 2, T.y, 10, T.x + T.w / 2, T.y, T.w * 0.75);
      g.addColorStop(0, rgba(owner.col.light, 0.45 * T.glow)); g.addColorStop(1, rgba(owner.col.light, 0));
      ctx.fillStyle = g; ctx.fillRect(T.x - T.w * 0.3, T.y - T.w * 0.75, T.w * 1.6, T.w * 1.5);
    }
    // el borrador: mitad rosada, mitad azul, con su etiqueta
    const h = T.h + 18;
    rr(ctx, T.x, T.y, T.w, h, 12);
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#f7a9bd'; ctx.fillRect(T.x, T.y, T.w * 0.55, h);
    ctx.fillStyle = '#7fb4ee'; ctx.fillRect(T.x + T.w * 0.55, T.y, T.w * 0.45, h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(T.x, T.y + 3, T.w, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(T.x, T.y + h - 8, T.w, 8);
    ctx.restore();
    rr(ctx, T.x, T.y, T.w, h, 12); ctx.lineWidth = 4; ctx.strokeStyle = ink; ctx.stroke();
    ctx.fillStyle = 'rgba(58,34,22,0.75)'; ctx.font = font(13, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('BORRADOR', T.x + T.w * 0.28, T.y + h / 2 + 2); ctx.fillText('REAL', T.x + T.w * 0.78, T.y + h / 2 + 2);
    // flechita de hacia dónde va
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const ax = T.x + T.w / 2 + T.dir * (T.w / 2 - 14), ay = T.y + h / 2;
    ctx.beginPath(); ctx.moveTo(ax + T.dir * 8, ay); ctx.lineTo(ax - T.dir * 4, ay - 7); ctx.lineTo(ax - T.dir * 4, ay + 7); ctx.closePath(); ctx.fill();
    // corona flotando (se sacude si está en disputa)
    const shake = T.owner === 2 ? Math.sin(t * 40) * 4 : 0;
    const cx = T.x + T.w / 2 + shake, cy = T.y - 120 + Math.sin(t * 2.5) * 6 - (owner ? 16 : 0);
    crown(ctx, cx, cy, 30, owner ? owner.col.base : '#ffd84d', t);
  }
  function crown(ctx, x, y, s, col, t) {
    const ink = PALETTE.ink;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 1.7) * 0.06);
    ctx.beginPath();
    ctx.moveTo(-s, s * 0.45); ctx.lineTo(-s, -s * 0.35); ctx.lineTo(-s * 0.5, s * 0.05); ctx.lineTo(0, -s * 0.6); ctx.lineTo(s * 0.5, s * 0.05); ctx.lineTo(s, -s * 0.35); ctx.lineTo(s, s * 0.45); ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = ink; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(-s * 0.9, s * 0.18, s * 1.8, s * 0.12);
    for (const [gx, gy] of [[-s, -s * 0.35], [0, -s * 0.6], [s, -s * 0.35]]) { ctx.beginPath(); ctx.arc(gx, gy, s * 0.14, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke(); }
    ctx.restore();
  }
  function drawBall(ctx, G, t) {
    const b = M.ball; if (!b || M.goalT > 0.05 && M.goalT < 2.3 && Math.floor(t * 10) % 2) return;
    for (const g of b.trail) { ctx.fillStyle = `rgba(150,210,255,${g.a * 0.5})`; ctx.beginPath(); ctx.arc(g.x, g.y, b.r * 0.9, 0, TAU); ctx.fill(); }
    const gy = ARENA.groundBelow(b.x, b.y + b.r * 0.5);
    if (gy < 1000) { const k = clamp(1 - (gy - b.y - b.r) / 400, 0, 1); ctx.fillStyle = `rgba(40,20,10,${0.25 * k})`; ctx.beginPath(); ctx.ellipse(b.x, gy + 1, b.r * (0.5 + 0.5 * k), 5, 0, 0, TAU); ctx.fill(); }
    ctx.save(); ctx.translate(b.x, b.y);
    const g = ctx.createRadialGradient(-b.r * 0.35, -b.r * 0.4, 2, 0, 0, b.r * 1.1);
    g.addColorStop(0, '#f2fbff'); g.addColorStop(0.5, '#9fd4ff'); g.addColorStop(1, '#4f8fd6');
    ctx.beginPath(); ctx.arc(0, 0, b.r, 0, TAU); ctx.fillStyle = g; ctx.fill();
    // remolino de colores adentro que gira con la canica
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, b.r - 2, 0, TAU); ctx.clip(); ctx.rotate(b.rot);
    ctx.lineCap = 'round';
    [['#ff5c9d', 0], ['#ffd84d', 2.1], ['#27d3b2', 4.2]].forEach(([c, a]) => {
      ctx.save(); ctx.rotate(a); ctx.strokeStyle = c; ctx.lineWidth = b.r * 0.32;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(b.r * 0.6, -b.r * 0.2, b.r * 0.85, b.r * 0.35); ctx.stroke(); ctx.restore();
    });
    ctx.restore();
    ctx.beginPath(); ctx.arc(0, 0, b.r, 0, TAU); ctx.lineWidth = 3.5; ctx.strokeStyle = PALETTE.ink; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.ellipse(-b.r * 0.38, -b.r * 0.42, b.r * 0.28, b.r * 0.15, -0.6, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function drawGoals(ctx, G, t) {
    for (const g of ARENA.goals) {
      const owner = G.players[g.side < 0 ? 0 : 1];
      const cx = g.x + g.w / 2;
      // banderín con el color de quien defiende ese arco
      ctx.save();
      ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = 4;
      const px = g.side < 0 ? g.x + 18 : g.x + g.w - 18;
      ctx.beginPath(); ctx.moveTo(px, 552); ctx.lineTo(px, 470); ctx.stroke();
      const wave = Math.sin(t * 5 + g.side) * 4;
      ctx.beginPath(); ctx.moveTo(px, 472); ctx.quadraticCurveTo(px - g.side * 30, 478 + wave, px - g.side * 56, 486); ctx.lineTo(px, 504); ctx.closePath();
      ctx.fillStyle = owner.col.base; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
      ctx.font = font(15, 700); ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff';
      outlinedText(ctx, `ARCO DE ${owner.name.toUpperCase()}`, cx, 530, 15, '#ffffff', PALETTE.ink);
      if (M.flash > 0 && M.goalSide === g.side) {
        ctx.globalAlpha = M.flash * (Math.floor(t * 12) % 2 ? 0.5 : 0.2);
        ctx.fillStyle = '#ffd84d'; ctx.fillRect(g.x, g.y, g.w, g.h);
      }
      ctx.restore();
    }
  }
  function drawWorld(ctx, G, t) {
    if (G.mode === 'rey') drawThrone(ctx, G, t);
    if (G.mode === 'gol') { drawGoals(ctx, G, t); drawBall(ctx, G, t); }
    if (G.mode === 'jefe') Jefes.drawWorld(ctx, G, t);
  }

  return {
    CFG, cfg, setup, clear, update, post, check, drawWorld, kickoff,
    drawOver: (ctx, G, t) => drawWater(ctx, G, t), drawHUD: (ctx, W, H, G) => { drawClimbHUD(ctx, W, H, G); Jefes.drawHUD(ctx, W, H, G); Campaign.drawHUD(ctx, W, H, G); },
    get waterY() { return M.waterY; },
    fugaStatus, fugaPar, FUGA_LEVELS, get fugaResult() { return M.fugaResult; }, get fugaData() { return M.fugaData; },
    fugaUnlocked: n => n === 1 || !!M.fugaData.stars[n - 1],
    get throne() { return M.throne; }, get ball() { return M.ball; }, get golden() { return M.golden; }, get goalT() { return M.goalT; },
    isPoints: mode => mode !== 'caneca' && mode !== 'escalada' && mode !== 'fuga' && mode !== 'jefe' && mode !== 'campana',
    isRounds: mode => mode === 'caneca' || mode === 'escalada',
    dunkPoints: mode => cfg(mode).dunk || 0,
  };
})();
