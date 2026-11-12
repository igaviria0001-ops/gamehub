/* =========================================================================
   MODOS DE JUEGO además del duelo:
   · Blancos: 90 s para reventar más globos y drones que el otro (globo 1,
     globo dorado 5, dron 3). Se vale estorbar al rival a tiros.
   · Maletín: un maletín cae en paracaídas; quien lo lleva suma un punto por
     segundo (y vuela un poco más pesado). Si lo derriban, le revienta un
     misil cerca o lo embisten, se le cae; embestir al que lo lleva se lo
     roba. Gana quien llegue a 30 o quien tenga más a los 2:30.
   · Carrera: aros en orden por los sitios más bonitos (y estrechos) de cada
     escenario, a 3 vueltas. Con armas: derribar al otro le cuesta segundos
     (reaparece en su último aro). Gana quien cruce primero la meta.
   El estado vive en G (G.score, G.targets, G.case, G.gates) y se mueve en pasos fijos.
   ========================================================================= */
const MODES = {
  duel: { name: 'Duelo', sub: 'al mejor de 5 rondas' },
  targets: { name: 'Blancos', sub: 'revienta más que el otro' },
  case: { name: 'Maletín', sub: 'quien lo lleva suma' },
  race: { name: 'Carrera', sub: 'aros en orden, a 3 vueltas' },
  relay: { name: 'Relevos', sub: 'cada aro es de un piloto: pásenlos en orden' },
  escort: { name: 'Entrega', sub: 'lleven el maletín a la zona de entrega' },
  waves: { name: 'Oleadas', sub: 'drones de ataque en tandas' },
  copa: { name: 'Copa', sub: '5 pruebas al azar seguidas (duelo, carrera, blancos, maletín) en escenarios distintos; gana quien sume más' },
  boss: { name: 'Jefe en pareja', sub: 'los dos juntos contra un dirigible armado' },
};
const MODE_ORDER = ['duel', 'targets', 'case', 'race', 'copa', 'boss'];
// recorridos: [x, y, radio] en orden; la salida es el último aro
const RACE = {
  // Cocora: slalom entre las palmas (por debajo de una copa, por encima de la siguiente)
  cocora: [[500, 1450], [840, 640], [1130, 1460], [1470, 740], [1820, 1420], [2130, 900], [2400, 1460], [2460, 520], [1700, 360], [900, 340], [300, 900]],
  // Medellín: rozando azoteas, picada al hueco del río, entre torres, por debajo del metrocable y de vuelta por lo alto
  medellin: [[470, 1420], [760, 1320, 80], [1300, 1000, 85], [1640, 800], [1845, 1700], [2230, 1160, 80], [2605, 950, 80], [2780, 1350, 80], [3420, 1720, 80], [3560, 1080], [2900, 620], [1900, 500], [1000, 700]],
  // Bogotá: de azotea en azotea (la torre de luces incluida), picadas entre torres y subida a Monserrate
  bogota: [[300, 1180], [465, 1260, 80], [840, 970, 80], [1210, 700, 80], [1400, 1000, 85], [1575, 1190, 75], [2000, 880, 80], [2190, 1180, 80], [2355, 1300, 75], [3000, 1350], [3480, 760], [2600, 450], [1500, 420], [600, 800]],
  // Cartagena: sobre el galeón, junto a la muralla, POR DEBAJO del arco de la Torre del Reloj y de la catedral, el castillo y de vuelta
  // Capadocia: entre chimeneas de hadas, por encima de sus sombreros, por el túnel de la roca-castillo y por el arco rosa; de vuelta por lo alto entre los globos
  capadocia: [[800, 1780, 80], [990, 1260], [1190, 1770, 80], [1480, 1862, 58], [1780, 1700, 80], [1985, 1380], [2175, 1750, 80], [2460, 1860, 70], [2740, 1760, 80], [3260, 1300], [2650, 560], [1500, 480], [520, 900]],
  cartagena: [[560, 1500], [1500, 1910, 72], [1705, 1975, 66], [1880, 1740, 75], [2115, 1730, 75], [2355, 1880, 75], [2530, 1975, 66], [2690, 1740, 75], [2920, 1700, 75], [3330, 1560], [3620, 1050], [2530, 820], [1705, 1180], [850, 1150]],
};

const Modes = (() => {
  const CASE_GOAL = 30, CASE_TIME = 150, TARGET_TIME = 90, RACE_TIME = 300, LAPS = 3;
  const BAL = ['#ff5a7a', '#5ad8ff', '#7cf08a', '#c08cff', '#ff9a4a'];

  function setup(G) {
    G.score = [0, 0]; G.targets = []; G.case = null; G.modeT = 0; G.spawnT = 0.5; G.gates = null;
    G.roundT = G.mode === 'case' ? CASE_TIME : G.mode === 'race' ? RACE_TIME : TARGET_TIME;
    if (G.mode === 'case') dropCase(G, G.world.w / 2, G.world.ceil + 60, 0, 0);
    if (G.mode === 'race') raceSetup(G);
  }
  // aros del recorrido, rutas de la máquina y salida (también para los Relevos en equipo)
  function raceSetup(G) {
    {
      const list = RACE[G.world.id] || RACE.cocora;
      G.gates = list.map(([x, y, r], i) => ({ x, y, r: r || 95, i, flash: [0, 0] }));
      G.laps = LAPS; G.place = [-1, -1];
      // los aros que quedan por debajo de un edificio (el arco del reloj, la catedral) abren ese paso a la máquina
      for (const B of G.world.buildings || []) B.raceOK = G.gates.some(g => g.x > B.x0 && g.x < B.x1 && g.y > B.bottom);
      G.racePaths = G.gates.map((g, i) => racePath(G.world, G.gates[(i - 1 + G.gates.length) % G.gates.length], g));
      // salen juntos desde el último aro, mirando hacia el primero
      const S = G.gates[G.gates.length - 1], A = G.gates[0], f = A.x >= S.x ? 1 : -1;
      G.birds.forEach((b, i) => { const keep = b.stats; b.reset(S.x - f * 40, S.y + (i ? 55 : -55), f); b.G = G; if (keep) b.stats = keep; });
    }
  }
  // ruta para la máquina entre dos aros: A* en una cuadrícula de 40 px que esquiva lo sólido
  const CELL = 40;
  function grid(W) {
    if (W.raceGrid) return W.raceGrid;
    const nx = Math.ceil(W.w / CELL), ny = Math.ceil(W.h / CELL), blk = new Uint8Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const x = i * CELL + CELL / 2, y = j * CELL + CELL / 2;
      let b = y < W.ceil + 40 || y > W.groundY(x) - 64 || x < 160 || x > W.w - 160;
      if (!b && W.buildings) for (const B of W.buildings) {
        if (x > B.x0 - 36 && x < B.x1 + 36 && y > B.top - 36 && y < B.bottom + 30) { b = true; break; }
        if (!B.raceOK && x > B.x0 - 30 && x < B.x1 + 30 && y > B.bottom - 20) { b = true; break; }
      }
      if (!b && W.palms) for (const P of W.palms) if (Math.hypot(x - P.crown.x, y - P.crown.y) < P.crown.r + 30) { b = true; break; }
      blk[j * nx + i] = b ? 1 : 0;
    }
    return (W.raceGrid = { nx, ny, blk });
  }
  function clearLine(W, ax, ay, bx, by, r = 30) {
    const d = Math.hypot(bx - ax, by - ay), n = Math.max(2, Math.ceil(d / 30));
    for (let k = 1; k < n; k++) { const x = ax + (bx - ax) * k / n, y = ay + (by - ay) * k / n; if (y > W.groundY(x) - 46 || World.solidAt(W, x, y, r)) return false; }
    return true;
  }
  function racePath(W, A, B) {
    const Gd = grid(W), { nx, ny, blk } = Gd;
    const cellOf = (x, y) => { let i = clamp(Math.floor(x / CELL), 0, nx - 1), j = clamp(Math.floor(y / CELL), 0, ny - 1); if (!blk[j * nx + i]) return j * nx + i;
      // el centro del aro puede caer en una celda bloqueada (arcos estrechos): la libre más cercana
      let best = -1, bd = 1e9; for (let dj = -3; dj <= 3; dj++) for (let di = -3; di <= 3; di++) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= ny || blk[jj * nx + ii]) continue; const d = di * di + dj * dj; if (d < bd) { bd = d; best = jj * nx + ii; } } return best; };
    const s = cellOf(A.x, A.y), e = cellOf(B.x, B.y);
    if (s < 0 || e < 0) return [{ x: B.x, y: B.y }];
    const g = new Float32Array(nx * ny).fill(1e9), from = new Int32Array(nx * ny).fill(-1), done = new Uint8Array(nx * ny);
    const ex = e % nx, ey = Math.floor(e / nx), h = c => Math.hypot(c % nx - ex, Math.floor(c / nx) - ey);
    // montón binario por costo estimado (rápido también en celular)
    const heap = [], fv = [];
    const push = (c, f) => { heap.push(c); fv.push(f); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (fv[p] <= fv[i]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; [fv[p], fv[i]] = [fv[i], fv[p]]; i = p; } };
    const pop = () => { const top = heap[0], lc = heap.pop(), lf = fv.pop(); if (heap.length) { heap[0] = lc; fv[0] = lf; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && fv[l] < fv[m]) m = l; if (r < heap.length && fv[r] < fv[m]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; [fv[m], fv[i]] = [fv[i], fv[m]]; i = m; } } return top; };
    g[s] = 0; push(s, h(s));
    while (heap.length) {
      const c = pop();
      if (c === e) break;
      if (done[c]) continue; done[c] = 1;
      const ci = c % nx, cj = Math.floor(c / nx);
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ii = ci + di, jj = cj + dj; if (ii < 0 || jj < 0 || ii >= nx || jj >= ny) continue;
        const n = jj * nx + ii; if (blk[n] || done[n]) continue;
        if (di && dj && (blk[cj * nx + ii] || blk[jj * nx + ci])) continue;
        const ng = g[c] + (di && dj ? 1.414 : 1);
        if (ng < g[n]) { g[n] = ng; from[n] = c; push(n, ng + h(n)); }
      }
    }
    if (from[e] < 0 && e !== s) return [{ x: B.x, y: B.y }];
    const pts = []; for (let c = e; c >= 0; c = from[c]) pts.push({ x: (c % nx) * CELL + CELL / 2, y: Math.floor(c / nx) * CELL + CELL / 2 });
    pts.reverse(); pts.push({ x: B.x, y: B.y });
    // tensar la cuerda: quitar puntos que se pueden saltar en línea recta
    const out = [pts[0]];
    for (let k = 1; k < pts.length; k++) { const last = out[out.length - 1]; if (k + 1 < pts.length && clearLine(W, last.x, last.y, pts[k + 1].x, pts[k + 1].y, 26)) continue; out.push(pts[k]); }
    return out;
  }
  // carrera: el aro que le toca a cada uno
  const nextGate = (G, i) => G.gates[Math.floor(G.score[i]) % G.gates.length];
  function respawnPos(G, i) {
    const n = G.gates.length, k = Math.floor(G.score[i]), g = G.gates[(k - 1 + n) % n], h = G.gates[k % n];
    return { x: g.x, y: g.y, f: h.x >= g.x ? 1 : -1 };
  }
  function updateRace(G, dt) {
    const n = G.gates.length, goal = n * LAPS;
    for (const g of G.gates) { g.flash[0] = Math.max(0, g.flash[0] - dt); g.flash[1] = Math.max(0, g.flash[1] - dt); }
    G.birds.forEach((b, i) => {
      if (!b.alive || G.score[i] >= goal) return;
      const g = nextGate(G, i), px = b.px != null ? b.px : b.x, py = b.py != null ? b.py : b.y;
      if (segCircle(px, py, b.x, b.y, g.x, g.y, g.r)) {
        G.score[i]++; g.flash[i] = 0.6;
        const k = G.score[i];
        if (k >= goal) { G.events.push({ type: 'raceFinish', b, x: b.x, y: b.y }); finish(G, false, i); return; }
        if (k % n === 0) G.events.push({ type: 'lap', b, x: b.x, y: b.y, lap: k / n + 1, last: k / n + 1 === LAPS });
        else G.events.push({ type: 'gate', b, x: g.x, y: g.y, n: k % n });
      }
    });
    G.birds.forEach(b => { b.px = b.x; b.py = b.y; });
    // alcance: el que va 2 aros o más atrás recarga el turbo al doble y empuja un poco más (la carrera se mantiene pareja)
    G.birds.forEach((b, i) => { b.catchup = G.score[1 - i] - G.score[i] >= 2; });
    if (G.roundT <= 0) finish(G, true);
  }
  // un punto libre del cielo (ni dentro de edificios ni pegado al suelo)
  function spot(G) {
    const W = G.world;
    for (let i = 0; i < 30; i++) {
      const x = 400 + G.rng() * (W.w - 800), y = W.ceil + 140 + G.rng() * (W.groundY(x) - W.ceil - 420);
      if (!World.solidAt(W, x, y, 70)) return { x, y };
    }
    return { x: W.w / 2, y: W.ceil + 300 };
  }
  function dropCase(G, x, y, vx, vy, from = -1) {
    G.case = { x, y, vx, vy, carrier: -1, chute: true, noPick: from, noPickT: from >= 0 ? 1.1 : 0, t: 0 };
  }
  function carrier(G) { return G.case && G.case.carrier >= 0 ? G.birds[G.case.carrier] : null; }

  function update(G, dt) {
    if (G.mode !== 'targets' && G.mode !== 'case' && G.mode !== 'race') return;
    if (G.state !== 'play') return;
    G.modeT += dt;
    const W = G.world;
    if (G.mode === 'race') return updateRace(G, dt);
    if (G.mode === 'targets') {
      // siempre hay blancos a la vista: globos, a veces uno dorado y un dron
      G.spawnT -= dt;
      const live = G.targets.filter(t => t.alive);
      if (G.spawnT <= 0 && live.length < 7) {
        G.spawnT = 0.9 + G.rng() * 0.6;
        const p = spot(G), r = G.rng(), drones = live.filter(t => t.kind === 'drone').length;
        if (r < 0.14 && drones < 2) G.targets.push({ kind: 'drone', drone: true, x: p.x, y: p.y, r: 30, hp: 3, alive: true, t: 0, vx: 0, vy: 0, wander: true, pts: 3 });
        else { const gold = r > 0.93; G.targets.push({ kind: 'balloon', x: p.x, y: p.y, r: gold ? 24 : 28, hp: 1, alive: true, t: 0, vx: gold ? (G.rng() < 0.5 ? -1 : 1) * 160 : 0, vy: 0, col: gold ? '#ffd23f' : BAL[Math.floor(G.rng() * BAL.length)], ph: G.rng() * 6, pts: gold ? 5 : 1, gold, life: 16 }); }
      }
      for (const T of G.targets) {
        if (!T.alive) continue;
        T.t += dt;
        if (T.kind === 'balloon') {
          T.y += Math.sin(T.t * 1.4 + T.ph) * 14 * dt - 6 * dt; T.x += T.vx * dt;
          if (T.gold && (T.x < 300 || T.x > W.w - 300)) T.vx = -T.vx;
          T.life -= dt; if (T.life <= 0) T.alive = false;
        } else if (T.kind === 'drone') {
          T.vx = Math.cos(T.t * 0.5 + T.y) * 130; T.vy = Math.sin(T.t * 0.8) * 70;
          const nx = T.x + T.vx * dt, ny = T.y + T.vy * dt;
          if (!World.solidAt(W, nx, ny, 50) && ny < W.groundY(nx) - 120 && ny > W.ceil + 60) { T.x = nx; T.y = ny; }
        }
      }
      G.targets = G.targets.filter(t => t.alive || t.t < 0);
      if (G.roundT <= 0) finish(G, true);
    } else {
      const C = G.case;
      if (C) {
        C.t += dt; C.noPickT = Math.max(0, C.noPickT - dt);
        const cb = carrier(G);
        if (cb) {
          if (!cb.alive) { dropCase(G, cb.x, cb.y + 20, cb.vx * 0.3, -120, cb.id); G.events.push({ type: 'caseDrop', b: cb, x: cb.x, y: cb.y }); }
          else {
            C.x = cb.x - Math.cos(cb.a) * 8; C.y = cb.y + 30;
            G.score[cb.id] += dt;
            if (G.score[cb.id] >= CASE_GOAL) { G.score[cb.id] = CASE_GOAL; finish(G, false, cb.id); }
          }
        } else {
          // cae en paracaídas (o en picada si va rápido), rebota en lo que encuentre
          if (C.chute) { C.vy += (70 - C.vy) * Math.min(1, dt * 2); C.vx *= 1 - dt * 1.2; C.vx += Math.sin(C.t * 1.2) * 20 * dt; }
          else C.vy += 600 * dt;
          if (!C.chute && C.vy > 120) C.chute = true;
          const nx = C.x + C.vx * dt, ny = C.y + C.vy * dt, s = World.solidAt(W, nx, ny + 16, 10);
          if (s) { C.vx *= 0.5; C.vy = 0; if (s.kind === 'ground' || s.kind === 'water' || s.kind === 'building') C.chute = false; }
          else { C.x = nx; C.y = ny; }
          C.x = clamp(C.x, 120, W.w - 120);
          for (const b of G.birds) {
            if (!b.alive || (C.noPickT > 0 && b.id === C.noPick)) continue;
            if (Math.hypot(b.x - C.x, b.y - C.y) < b.r + 30) { C.carrier = b.id; C.chute = false; G.events.push({ type: 'caseTake', b, x: b.x, y: b.y }); break; }
          }
        }
      }
      if (G.roundT <= 0) finish(G, true);
    }
  }
  function finish(G, timeUp, w) {
    if (w == null) w = G.score[0] > G.score[1] ? 0 : G.score[1] > G.score[0] ? 1 : -1;
    G.events.push({ type: 'modeEnd', winner: w, timeUp });
  }
  function event(G, e) {
    if (G.mode === 'targets' && e.type === 'pop' && e.by != null && e.by >= 0 && G.state === 'play') {
      G.score[e.by] += e.pts || 1;
      G.events.push({ type: 'points', b: G.birds[e.by], n: e.pts || 1, x: e.x, y: e.y });
    }
    if (G.mode === 'case' && G.case && G.state === 'play') {
      const cb = carrier(G);
      // un misil que revienta cerca o un choque le tumban el maletín al que lo lleva
      if (cb && e.type === 'hurt' && e.b === cb && (e.kind === 'missile' || e.kind === 'shotdown') && e.n >= 6) {
        dropCase(G, cb.x, cb.y + 20, (G.rng() - 0.5) * 300, -260, cb.id); G.events.push({ type: 'caseDrop', b: cb, x: cb.x, y: cb.y });
      }
      if (cb && e.type === 'bump' && e.by != null && e.by !== cb.id && e.v > 200) {
        const th = G.birds[e.by];
        if (th && th.alive) { G.case.carrier = th.id; G.case.noPick = cb.id; G.events.push({ type: 'caseSteal', b: th, x: th.x, y: th.y }); }
      }
    }
  }

  /* ---------- dibujo ---------- */
  function drawGates(ctx, G) {
    const t = G.time, n = G.gates.length;
    const mine = [0, 1].map(i => (G.score[i] < n * LAPS ? Math.floor(G.score[i]) % n : -1));
    for (const g of G.gates) {
      const who = [0, 1].filter(i => mine[i] === g.i), fl = Math.max(g.flash[0], g.flash[1]);
      const finishLine = g.i === n - 1;
      // aro de lado: un óvalo con brillo (el número encima)
      const rx = g.r * 0.42, ry = g.r;
      ctx.save(); ctx.translate(g.x, g.y);
      if (who.length) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const col = PLAYER_COLORS[who[0]].glow, gl = ctx.createRadialGradient(0, 0, g.r * 0.4, 0, 0, g.r * 1.6);
        gl.addColorStop(0, `rgba(${col},0)`); gl.addColorStop(0.6, `rgba(${col},${0.16 + 0.08 * Math.sin(t * 6)})`); gl.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = gl; ctx.fillRect(-g.r * 1.6, -g.r * 1.6, g.r * 3.2, g.r * 3.2);
        ctx.restore();
      }
      ctx.lineWidth = who.length ? 9 : 5;
      if (who.length === 2) {
        ctx.strokeStyle = PLAYER_COLORS[0].main; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, Math.PI / 2, Math.PI * 1.5); ctx.stroke();
        ctx.strokeStyle = PLAYER_COLORS[1].main; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      } else {
        ctx.strokeStyle = who.length ? PLAYER_COLORS[who[0]].main : finishLine ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.stroke();
      }
      if (finishLine) {
        // meta: aro a cuadros
        ctx.lineWidth = 4; ctx.setLineDash([10, 10]); ctx.strokeStyle = 'rgba(20,20,30,0.7)'; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, rx - 4, ry - 4, 0, -2.2, -1.2); ctx.stroke();
      if (fl > 0) { ctx.strokeStyle = `rgba(255,255,255,${fl})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, rx + (0.6 - fl) * 90, ry + (0.6 - fl) * 90, 0, 0, TAU); ctx.stroke(); }
      ctx.font = font(who.length ? 22 : 16); ctx.textAlign = 'center'; ctx.fillStyle = who.length ? '#ffffff' : 'rgba(255,255,255,0.5)';
      ctx.fillText(finishLine ? 'META' : String(g.i + 1), 0, -ry - 12);
      ctx.restore();
    }
  }
  function draw(ctx, G) {
    if (G.mode === 'race' && G.gates) return drawGates(ctx, G);
    if ((G.mode !== 'case' && G.mode !== 'escort') || !G.case) return;
    const C = G.case, t = G.time, vs = G.vs || 1;
    ctx.save(); ctx.translate(C.x, C.y);
    if (C.carrier < 0) {
      // faro: haz de luz hacia arriba para que se vea desde lejos
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, 0, 0, -900); g.addColorStop(0, 'rgba(255,214,90,0.35)'); g.addColorStop(1, 'rgba(255,214,90,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-40, -900); ctx.lineTo(40, -900); ctx.lineTo(10, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.scale(vs * 1.1, vs * 1.1);
    if (C.carrier < 0 && C.chute) {
      const sw = Math.sin(t * 1.3) * 0.1; ctx.save(); ctx.rotate(sw);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-14, -10); ctx.lineTo(-32, -58); ctx.moveTo(14, -10); ctx.lineTo(32, -58); ctx.stroke();
      for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#1c1c24' : '#ffd23f'; ctx.beginPath(); ctx.moveTo(0, -58); ctx.arc(0, -58, 40, Math.PI + i * Math.PI / 6, Math.PI + (i + 1) * Math.PI / 6); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    } else if (C.carrier >= 0) {
      ctx.strokeStyle = 'rgba(200,200,220,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, -26); ctx.stroke();
    }
    const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 36); glow.addColorStop(0, 'rgba(255,214,90,0.45)'); glow.addColorStop(1, 'rgba(255,214,90,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, 36, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#3a2416'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-6, -11); ctx.quadraticCurveTo(0, -18, 6, -11); ctx.stroke();
    const g = ctx.createLinearGradient(0, -11, 0, 11); g.addColorStop(0, '#8a5a34'); g.addColorStop(1, '#5a361c');
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-17, -11, 34, 22, 4); ctx.fill();
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(-11, -11, 4, 5); ctx.fillRect(7, -11, 4, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(-17, -11, 34, 5);
    ctx.restore();
  }
  // flecha al maletín (o a quien lo lleva) cuando no se ve
  function drawPointer(ctx, G, cam, sw, sh) {
    if (G.mode === 'race' && G.gates) {
      // flecha de cada piloto (de su color) hacia su próximo aro, si no se ve
      for (let i = 0; i < 2; i++) {
        if (G.bots[i]) continue;
        if (G.score[i] >= G.gates.length * LAPS) continue;
        const g = nextGate(G, i), sx = sw / 2 + (g.x - cam.x) * cam.z, sy = sh / 2 + (g.y - cam.y) * cam.z, m = 40;
        if (sx > m && sx < sw - m && sy > m + 90 && sy < sh - m) continue;
        const cx = clamp(sx, m, sw - m), cy = clamp(sy, m + 100, sh - m), a = Math.atan2(sy - cy, sx - cx);
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); ctx.fillStyle = PLAYER_COLORS[i].main;
        ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-10, -12); ctx.lineTo(-4, 0); ctx.lineTo(-10, 12); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      // contra la máquina la cámara es solo tuya: un puntito en el borde dice dónde va la máquina
      const o = G.birds[1];
      if (G.players === 1 && o && o.alive) {
        const sx = sw / 2 + (o.x - cam.x) * cam.z, sy = sh / 2 + (o.y - cam.y) * cam.z, m = 26;
        if (!(sx > 0 && sx < sw && sy > 0 && sy < sh)) {
          const cx = clamp(sx, m, sw - m), cy = clamp(sy, m + 100, sh - m), a = Math.atan2(sy - cy, sx - cx);
          ctx.save(); ctx.translate(cx, cy); ctx.globalAlpha = 0.85;
          ctx.fillStyle = PLAYER_COLORS[1].main; ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill();
          ctx.rotate(a); ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(7, -5); ctx.lineTo(7, 5); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
      }
      return;
    }
    if (G.mode !== 'case' || !G.case) return;
    const C = G.case, sx = sw / 2 + (C.x - cam.x) * cam.z, sy = sh / 2 + (C.y - cam.y) * cam.z, m = 40;
    if (sx > m && sx < sw - m && sy > m + 90 && sy < sh - m) return;
    const cx = clamp(sx, m, sw - m), cy = clamp(sy, m + 100, sh - m), a = Math.atan2(sy - cy, sx - cx);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
    ctx.fillStyle = C.carrier >= 0 ? PLAYER_COLORS[C.carrier].main : '#ffd23f';
    ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-10, -12); ctx.lineTo(-4, 0); ctx.lineTo(-10, 12); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // panel central: tiempo y marcador
  function drawHUD(ctx, G, sw, sh, u, glass) {
    const lw = (G.mode === 'race' ? 270 : 230) * u, lh = (G.mode === 'race' ? 50 : 46) * u, ly = Touch.enabled ? 60 : 10;
    ctx.save();
    glass(sw / 2 - lw / 2, ly, lw, lh, 12 * u);
    const t = Math.max(0, Math.ceil(G.roundT)), mm = Math.floor(t / 60), ss = String(t % 60).padStart(2, '0');
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = font(Math.max(10, 11 * u));
    ctx.fillText(`${MODES[G.mode].name} · ${mm}:${ss}`, sw / 2, ly + 15 * u);
    ctx.font = font(Math.max(15, 20 * u));
    let s0 = Math.floor(G.score[0]), s1 = Math.floor(G.score[1]);
    if (G.coop) {
      // Blancos juntos: el total de los dos contra la meta
      const tot = s0 + s1, g = G.coopGoal, k = clamp(tot / g[2], 0, 1);
      ctx.font = font(Math.max(15, 19 * u)); ctx.textAlign = 'center'; ctx.fillStyle = tot >= g[0] ? '#9dff9a' : '#ffffff';
      ctx.fillText(`juntos ${tot} / ${g[0]}`, sw / 2, ly + 35 * u);
      const bw = lw - 28 * u, bx = sw / 2 - bw / 2;
      ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(bx, ly + 41 * u, bw, 3.5 * u);
      ctx.fillStyle = '#9dff9a'; ctx.fillRect(bx, ly + 41 * u, bw * k, 3.5 * u);
      ctx.fillStyle = '#ffd36b'; for (const gi of g) ctx.fillRect(bx + bw * gi / g[2] - 1, ly + 39 * u, 2, 7.5 * u);
      ctx.restore(); return;
    }
    ctx.fillStyle = PLAYER_COLORS[0].main; ctx.textAlign = 'right'; ctx.fillText(String(s0), sw / 2 - 14 * u, ly + 37 * u);
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.fillText('–', sw / 2, ly + 37 * u);
    ctx.fillStyle = PLAYER_COLORS[1].main; ctx.textAlign = 'left'; ctx.fillText(String(s1), sw / 2 + 14 * u, ly + 37 * u);
    if (G.mode === 'race') {
      // vuelta y aro de cada uno, con una barra del avance total
      const n = G.gates.length, bw = lw / 2 - 30 * u;
      ctx.fillStyle = 'rgba(15,10,30,0.0)';
      for (let i = 0; i < 2; i++) {
        const k = Math.min(1, G.score[i] / (n * LAPS)), lap = Math.min(LAPS, Math.floor(G.score[i] / n) + 1), x = i ? sw / 2 + 22 * u : sw / 2 - 22 * u - bw;
        ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(x, ly + 40 * u, bw, 4 * u);
        ctx.fillStyle = PLAYER_COLORS[i].main; ctx.fillRect(i ? x : x + bw * (1 - k), ly + 40 * u, bw * k, 4 * u);
        ctx.font = font(Math.max(9, 10 * u)); ctx.textAlign = i ? 'left' : 'right'; ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText(`vuelta ${lap}/${LAPS}`, i ? sw / 2 + 52 * u : sw / 2 - 52 * u, ly + 37 * u);
        if (G.birds[i].catchup) { ctx.fillStyle = '#9dff9a'; ctx.font = font(Math.max(8, 9 * u)); ctx.fillText('alcance: turbo ×2', i ? sw / 2 + 52 * u : sw / 2 - 52 * u, ly + 63 * u); }
      }
    }
    if (G.mode === 'case') {
      // barras hacia la meta
      const bw = lw / 2 - 52 * u;
      for (let i = 0; i < 2; i++) {
        const k = G.score[i] / CASE_GOAL, x = i ? sw / 2 + 40 * u : sw / 2 - 40 * u - bw;
        ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(x, ly + 31 * u, bw, 5 * u);
        ctx.fillStyle = PLAYER_COLORS[i].main; ctx.fillRect(i ? x : x + bw * (1 - k), ly + 31 * u, bw * k, 5 * u);
      }
    }
    ctx.restore();
  }
  return { setup, update, event, draw, drawPointer, drawHUD, carrier, nextGate, respawnPos, clearLine, raceSetup, spot, dropCase, CASE_GOAL, LAPS, RACE };
})();
