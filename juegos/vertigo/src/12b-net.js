/* =========================================================================
   VÉRTIGO EN LÍNEA — adaptador entre la carrera y NetPlay (src/00k-net.js).
   · Anfitrión: corre la carrera de verdad con todos los humanos de la sala
     (hasta 4) + la máquina hasta 6; las entradas de los puestos remotos
     llegan por la red; manda instantáneas compactas y los eventos.
   · Remoto: arma la misma carrera pero no la simula: aplica las
     instantáneas (interpoladas) y dibuja las cámaras de SUS jugadores.
   ========================================================================= */
const NetGame = (() => {
  const NEUTRAL = { steer: 0, up: false, down: false, drift: false, item: false, turbo: false };
  const _read = Input.read;
  // anfitrión: el puesto de otro aparato juega con lo que llega por la red
  Input.read = i => {
    if (NetPlay.isHost) { const li = NetPlay.local(i); if (li >= 0) return _read(li); return NetPlay.input(i) || NEUTRAL; }
    return _read(i);
  };
  // los avisos del HUD van a la vista de ese jugador (en línea, solo los de este aparato)
  const _msg = HUD.msg; HUD.msg = (i, ...a) => { if (NetPlay.on) { i = NetPlay.mine.indexOf(i); if (i < 0) return; } return _msg(i, ...a); };
  // modos en línea: carrera, mano a mano (al mejor de 3, sin máquina), eliminación, batalla en arena y Gran Premio
  const NET_MODES = ['quick', 'duel', 'elim', 'battle', 'gp'];
  const IT = Object.keys(ITEMS), MODES = ['road', 'water', 'air'], TRICK = ['flip', 'back', 'rollL', 'rollR', 'spin'], ST = ['count', 'race', 'done'];
  const r2 = v => Math.round((+v || 0) * 100) / 100, r3 = v => Math.round((+v || 0) * 1000) / 1000;
  let cfg = null, evQ = [];

  /* ---------- arranque ---------- */
  // los colores de la sala pasan a ser los de los jugadores (etiqueta del auto, HUD, resultados)
  const dark = h => { const n = parseInt(String(h).slice(1), 16); if (isNaN(n)) return h; const f = v => Math.round(v * 0.55).toString(16).padStart(2, '0'); return '#' + f(n >> 16 & 255) + f(n >> 8 & 255) + f(n & 255); };
  NetPlay.onStart(o => { o.seats.forEach((s, i) => { if (s && /^#[0-9a-f]{6}$/i.test(s.color)) PLAYER_COLORS[i] = { main: s.color, dark: dark(s.color) }; }); });
  // lo que cada aparato dice de sus jugadores: piloto elegido y lo que tiene puesto en el garaje
  const okId = v => NetPlay.okId(v);
  const okSkin = k => (k && typeof k === 'object' ? { paint: okId(k.paint), neon: okId(k.neon), turbo: okId(k.turbo) } : null);
  // sala de espera y arranque comunes (shared/netplay.js): aquí solo qué manda cada uno y cómo se arma la carrera
  NetPlay.gate({
    me(li) { const pid = (UI.cfg().p || [])[li]; let skin = null; try { skin = Vestidor.skinOf(li, pid); } catch (e) { /* nada */ } return { pid, skin }; },
    make(want, ev) {
      const S = NetPlay.seats, n = S.length, used = new Set(), mode = NET_MODES.includes(ev.mode) ? ev.mode : 'quick';
      const pilots = S.map((s, i) => { const w = want[i] || {}; let p = PILOTS[w.pid] ? w.pid : PILOT_ORDER[i % PILOT_ORDER.length]; if (used.has(p)) p = PILOT_ORDER.find(q => !used.has(q)); used.add(p); return p; });
      // mano a mano: sin máquina; los demás modos completan la parrilla hasta 6
      const pool = PILOT_ORDER.filter(p => !used.has(p)), bots = []; if (mode !== 'duel') for (let i = 0; i < Math.max(0, 6 - n); i++) bots.push({ pid: pool[i], skill: [0.1, 0.15, 0.28, 0.2, 0.05][i % 5] });
      const rnd = L => L[Math.floor(Math.random() * L.length)], cup = Math.max(0, Math.min(CUPS.length - 1, +ev.map || 0));
      const tid = mode === 'battle' ? (ARENA_ORDER.includes(ev.map) ? ev.map : rnd(ARENA_ORDER)) : mode === 'gp' ? cupTracks(cup)[0] : TRACK_ORDER.includes(ev.map) ? ev.map : rnd(TRACK_ORDER);
      const c = { mode, tid, humans: pilots, bots, laps: mode === 'gp' ? 3 : Math.max(1, Math.min(5, ev.len || ev.rounds || 3)), skins: S.map((s, i) => okSkin((want[i] || {}).skin)) };
      if (mode === 'gp') c.gp = { cup, i: 0, pts: {} }; if (mode === 'duel') c.duel = { r: 0, w: S.map(() => 0) };
      return c;
    },
    apply(c) { cfg = c; for (const k in ghosts) delete ghosts[k]; const w = document.getElementById('resWait'); if (w) w.remove(); Game.startNet({ mode: c.mode || 'quick', tid: c.tid, humans: c.humans, bots: c.bots, laps: c.laps, gp: c.gp || null, duel: c.duel || null }); },
  });

  /* ---------- instantánea (anfitrión) ---------- */
  function snap() {
    const R = Game.R; if (!R || Game.mode !== 'race' || !cfg) return null;
    const T = R.track;
    return {
      st: ST.indexOf(R.state), cd: r2(R.countT), tm: r2(R.time), dn: r2(R.doneT || 0),
      ord: R.order.map(c => c.idx),
      c: R.cars.map(c => [r3(c.s), r3(c.u), r3(c.h), r3(c.a), r3(c.roll), r3(c.pitch), r2(c.f), MODES.indexOf(c.mode), c.drift.on ? 1 : 0, c.drift.dir, c.drift.lv, r2(c.drift.t),
        r2(c.boostT), r2(c.boostK), r2(c.gem), c.item ? IT.indexOf(c.item) : -1, c.itemN || 0, c.lap, c.place, c.finished ? 1 : 0, r2(c.finishT), r2(c.respawnT), c.out ? 1 : 0,
        c.trick ? TRICK.indexOf(c.trick.kind) : -1, c.trick ? r2(c.trick.t) : 0, c.trick ? r2(c.trick.dur) : 0, r2(c.hopT), r2(c.wobT), r2(c.spinT), r2(c.steerS), r2(c.shieldT), r2(c.specT),
        c.laps.length, r2(c.laps[c.laps.length - 1] || 0), r2(c.lapT), r2(c.best), c.grounded ? 1 : 0, r2(c.fogT), r2(c.invT), r2(c.magnetT), r3(c.l), r3(c.vn), r2(c.airT), c.hearts == null ? -1 : c.hearts, r2(c.outT || 0), (c.stats && c.stats.hitsDone) || 0]),
      ru: R.rules ? (o => { const q = {}; for (const k of ['left', 'next']) if (typeof o[k] === 'number') q[k] = r2(o[k]); return q; })(R.rules) : 0,
      hz: R.hz.map(z => { const o = {}; for (const k in z) { const v = z[k]; if (typeof v === 'number') o[k] = r2(v); else if (typeof v === 'string' || typeof v === 'boolean') o[k] = v; } return o; }),
      bx: R.boxes.map(b => r2(b.gone)),
      gm: T.gems.map((g, i) => (g.gone > 0 ? i : -1)).filter(i => i >= 0),
    };
  }

  /* ---------- aplicar (remoto) ---------- */
  const lerp = (a, b, k) => a + (b - a) * k;
  const lerpA = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * k; };
  function apply(A, B, k) {
    const R = Game.R; if (!R || !A || !B) return; const L = R.track.L;
    R.state = ST[B.st] || 'race'; R.countT = B.cd; R.time = lerp(A.tm, B.tm, k); R.doneT = B.dn;
    R.cars.forEach((c, i) => {
      const a = A.c[i], b = B.c[i]; if (!a || !b) return;
      let ds = b[0] - a[0]; if (ds > L / 2) ds -= L; else if (ds < -L / 2) ds += L;
      c.s = ((a[0] + ds * k) % L + L) % L; c.u = lerp(a[1], b[1], k); c.h = lerp(a[2], b[2], k); c.a = lerpA(a[3], b[3], k); c.roll = lerpA(a[4], b[4], k); c.pitch = lerpA(a[5], b[5], k); c.f = lerp(a[6], b[6], k);
      c.mode = MODES[b[7]] || 'road'; c.drift.on = !!b[8]; c.drift.dir = b[9]; c.drift.lv = b[10]; c.drift.t = b[11];
      c.boostT = b[12]; c.boostK = b[13]; c.gem = b[14]; c.item = b[15] >= 0 ? IT[b[15]] : null; c.itemN = b[16]; c.lap = b[17]; c.place = b[18]; c.finished = !!b[19]; c.finishT = b[20]; c.respawnT = b[21]; c.out = !!b[22];
      c.trick = b[23] >= 0 ? { kind: TRICK[b[23]], t: lerp(a[23] === b[23] ? a[24] : b[24], b[24], k), dur: b[25] } : null;
      c.hopT = b[26]; c.wobT = b[27]; c.spinT = b[28]; c.steerS = lerp(a[29], b[29], k); c.shieldT = b[30]; c.specT = b[31];
      while (c.laps.length < b[32]) c.laps.push(b[33]); c.laps.length = b[32]; if (b[32]) c.laps[b[32] - 1] = b[33];
      c.lapT = b[34]; c.best = b[35]; c.grounded = !!b[36]; c.fogT = b[37]; c.invT = b[38]; c.magnetT = b[39];
      if (b[43] >= 0) c.hearts = b[43]; c.outT = b[44] || 0; if (c.stats) c.stats.hitsDone = b[45] || 0;
    });
    R.order = B.ord.map(i => R.cars[i]).filter(Boolean); if (B.ru && R.rules) Object.assign(R.rules, B.ru);
    R.hz = B.hz.map(z => Object.assign({}, z));
    B.bx.forEach((g, i) => { if (R.boxes[i]) R.boxes[i].gone = g; });
    const gs = new Set(B.gm); R.track.gems.forEach((g, i) => { g.gone = gs.has(i) ? 1 : 0; });
  }
  /* ---------- predicción del bólido propio (remoto) ----------
     El auto de cada jugador de este aparato responde YA a sus teclas: una copia corre aquí con la misma física
     (Car.step) y es la que se dibuja. Cuando llega una instantánea, se compara con lo que la copia predijo para el
     momento que esa instantánea refleja (hace «un ping») y se corrige de a poquito; si algo grande pasó allá
     (caída, reaparición, choque fuerte), se toma lo del anfitrión de una. Lo demás (vueltas, puestos, objetos) manda el anfitrión. */
  const DT = 1 / 120, ghosts = {}, lastIn = {}, PST = { hard: 0, soft: 0, err: 0 }; // PST: cuántas correcciones (para las pruebas)
  function hardSet(car, b) {
    car.s = b[0]; car.u = b[1]; car.h = b[2]; car.a = b[3]; car.roll = b[4]; car.pitch = b[5]; car.f = b[6]; car.mode = MODES[b[7]] || 'road';
    car.drift.on = !!b[8]; car.drift.dir = b[9]; car.drift.lv = b[10]; car.drift.t = b[11]; car.boostT = b[12]; car.boostK = b[13]; car.gem = b[14]; car.lap = b[17]; car.finished = !!b[19];
    car.respawnT = b[21]; car.out = !!b[22]; car.trick = b[23] >= 0 ? { kind: TRICK[b[23]], t: b[24], dur: b[25] } : null; car.hopT = b[26]; car.wobT = b[27]; car.spinT = b[28]; car.steerS = b[29];
    car.shieldT = b[30]; car.specT = b[31]; car.lapT = b[34]; car.grounded = !!b[36]; car.l = b[40] || 0; car.vn = b[41] || 0; car.airT = b[42] || 0;
    car.vs = car.f * Math.cos(car.a) - car.l * Math.sin(car.a); car.vu = car.f * Math.sin(car.a) + car.l * Math.cos(car.a); if (car.grounded) car.safeS = car.s;
  }
  function ghostOf(R, seat, b) {
    let g = ghosts[seat]; if (g && g.R === R) return g;
    const PR = Object.create(R); PR.events = []; const c = R.cars[seat];
    PST.made = (PST.made || 0) + 1;
    g = ghosts[seat] = { R, PR, car: new Car(PR, c.idx, c.pid, c.s, c.u), hist: [], lastN: 0, acc: 0 };
    if (b) hardSet(g.car, b); return g;
  }
  // lo que predijo la copia en el instante t (entre dos cuadros guardados)
  function histAt(H, t) {
    if (!H.length) return null; if (t < H[0].t) return t > H[0].t - 150 ? H[0] : null; // un poco antes del comienzo: el primero
    for (let i = H.length - 1; i >= 0; i--) if (H[i].t <= t) { const a = H[i], b = H[i + 1]; if (!b) return a; const k = (t - a.t) / Math.max(1e-6, b.t - a.t), o = {}; for (const key in a) o[key] = key === 'a' ? lerpA(a.a, b.a, k) : a[key] + (b[key] - a[key]) * k; if (Math.abs(b.s - a.s) > 100) o.s = a.s; return o; }
    return null;
  }
  // tras tomar lo del anfitrión, la historia arranca en ese instante (si no, la siguiente instantánea no tendría con qué compararse)
  const rebase = (g, t) => { const k = g.car; g.hist = [{ t, s: k.s, u: k.u, h: k.h, a: k.a, f: k.f, l: k.l || 0, vn: k.vn }]; };
  function reconcile(g, b, tAt) {
    const car = g.car, L = g.R.track.L;
    if (b[21] > 0 || b[22] || car.respawnT > 0) { hardSet(car, b); rebase(g, tAt); return; } // cayéndose o fuera: igual que el anfitrión
    const h = histAt(g.hist, tAt); if (!h) { hardSet(car, b); rebase(g, tAt); PST.hard++; return; }
    let es = b[0] - h.s; if (es > L / 2) es -= L; else if (es < -L / 2) es += L;
    const e = { s: es, u: b[1] - h.u, h: b[2] - h.h, a: angWrap(b[3] - h.a), f: b[6] - h.f, l: (b[40] || 0) - h.l, vn: (b[41] || 0) - h.vn };
    PST.soft++; PST.err = PST.err * 0.95 + Math.hypot(es, e.u) * 0.05;
    if (Math.abs(es) > 24 || Math.abs(e.u) > 7 || Math.abs(e.h) > 7 || Math.abs(e.a) > 1.2) { hardSet(car, b); rebase(g, tAt); PST.hard++; return; }
    const k = 0.3; // de a poquito: no se nota y no tiembla
    car.s = g.R.track.wrap(car.s + es * k); car.u += e.u * k; car.h += e.h * k; car.a = angWrap(car.a + e.a * k); car.vn += e.vn * k;
    const f = car.f + e.f * k, l = (car.l || 0) + e.l * k; car.f = f; car.l = l; car.vs = f * Math.cos(car.a) - l * Math.sin(car.a); car.vu = f * Math.sin(car.a) + l * Math.cos(car.a);
    for (const q of g.hist) { q.s += es * k; q.u += e.u * k; q.h += e.h * k; q.a += e.a * k; q.f += e.f * k; q.l += e.l * k; q.vn += e.vn * k; }
    // lo que decide el anfitrión: golpes, turbos de plataforma o de objeto, barra, vueltas, meta
    if (b[12] > car.boostT + 0.15) { car.boostT = b[12]; car.boostK = b[13]; }
    if (b[28] > car.spinT + 0.1) car.spinT = b[28]; if (b[27] > car.wobT + 0.1) car.wobT = b[27];
    if (Math.abs(b[14] - car.gem) > 0.3) car.gem = b[14];
    car.lap = b[17]; car.finished = !!b[19]; car.shieldT = b[30]; car.specT = b[31];
    if (!!b[36] !== car.grounded && Math.abs(e.h) < 0.6) { car.grounded = !!b[36]; if (car.grounded) { car.vn = 0; car.airT = 0; car.trick = null; } }
  }
  function predict(R, dt) {
    const Lt = NetPlay.latest(), now = performance.now(), D = Lt && Lt.d;
    for (const seat of NetPlay.mine) {
      const c = R.cars[seat]; if (!c || !D || !D.c[seat]) continue;
      const g = ghostOf(R, seat, D.c[seat]); g.PR.state = ST[D.st] || 'race'; g.PR.events.length = 0;
      if (Lt.n !== g.lastN) { g.lastN = Lt.n; reconcile(g, D.c[seat], Lt.arr - NetPlay.rtt - 12); }
      const inp = Object.assign({}, NEUTRAL, lastIn[NetPlay.mine.indexOf(seat)] || {}, { item: false });
      g.acc += dt; let n = 0; while (g.acc >= DT && n < 14) { g.car.step(DT, inp); g.PR.events.length = 0; g.acc -= DT; n++; } if (n >= 14) g.acc = 0;
      const k = g.car; g.hist.push({ t: now, s: k.s, u: k.u, h: k.h, a: k.a, f: k.f, l: k.l || 0, vn: k.vn }); while (g.hist.length > 2 && now - g.hist[0].t > 1500) g.hist.shift();
      // se dibuja la copia (lo de la carrera —vueltas, puesto, objeto— sigue siendo lo del anfitrión)
      c.s = k.s; c.u = k.u; c.h = k.h; c.a = k.a; c.roll = k.roll; c.pitch = k.pitch; c.f = k.f; c.mode = k.mode; c.grounded = k.grounded; c.steerS = k.steerS; c.hopT = k.hopT;
      c.drift.on = k.drift.on; c.drift.dir = k.drift.dir; c.drift.lv = k.drift.lv; c.drift.t = k.drift.t; c.trick = k.trick; c.boostT = k.boostT; c.boostK = k.boostK; c.vs = k.vs; c.vu = k.vu; c.vn = k.vn;
    }
  }
  // un paso del remoto: lo último del anfitrión + sus eventos de este cuadro (+ su propio bólido, ya)
  function clientStep(R, frameEv, dt) {
    const S = NetPlay.sample(); if (S) apply(S.a, S.b, S.k);
    if (NetPlay.pred && dt > 0) predict(R, dt);
    if (evQ.length) { frameEv.push(...evQ); evQ = []; }
  }
  // el anfitrión lanza otra carrera para todos (otra pista, mismos jugadores)
  // «otra para todos»: en el Gran Premio, la pista siguiente (o uno nuevo al terminar); en el mano a mano, la ronda siguiente
  // (o un duelo nuevo si ya hay campeón); en la batalla, otra arena; en lo demás, otra pista
  function again() {
    NetPlay.again(c => {
      const rnd = L => L[Math.floor(Math.random() * L.length)];
      if (c.mode === 'gp' && Game.gp) { const g = Game.gp, last = g.i >= g.list.length - 1, gp = last ? { cup: c.gp.cup, i: 0, pts: {} } : { cup: c.gp.cup, i: g.i + 1, pts: Object.assign({}, g.pts) }; return Object.assign({}, c, { gp, tid: cupTracks(gp.cup)[gp.i] }); }
      if (c.mode === 'duel' && Game.duel) { const d = Game.duel, champ = d.w.some(w => w >= 2), duel = champ ? { r: 0, w: d.w.map(() => 0) } : { r: d.r + 1, w: d.w.slice() }; return Object.assign({}, c, { duel, tid: TRACK_ORDER[(TRACK_ORDER.indexOf(c.tid) + 1) % TRACK_ORDER.length] }); }
      if (c.mode === 'battle') return Object.assign({}, c, { tid: rnd(ARENA_ORDER.filter(t => t !== c.tid)) });
      return Object.assign({}, c, { tid: rnd(TRACK_ORDER.filter(t => t !== c.tid)) });
    });
  }
  return {
    seatsMax: 4, again, get pst() { return PST; },
    // lo que lleva puesto el jugador de otro aparato (lo manda el anfitrión en la carrera)
    skinOf(seat) { return (cfg && cfg.skins && okSkin(cfg.skins[seat])) || null; },
    neutral: () => NEUTRAL,
    // remoto: lo que aprieta cada jugador de este aparato (y los toques cortos cuentan una vez)
    readLocal(li) { const i = _read(li); lastIn[li] = i; if (li === NetPlay.mine.length - 1) Input.endStep(); return i; },
    snap, apply, clientStep,
    event(e) { evQ.push(e); if (evQ.length > 300) evQ.splice(0, evQ.length - 300); },
  };
})();
