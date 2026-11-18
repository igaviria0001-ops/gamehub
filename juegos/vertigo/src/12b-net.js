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
      const S = NetPlay.seats, n = S.length, used = new Set();
      const pilots = S.map((s, i) => { const w = want[i] || {}; let p = PILOTS[w.pid] ? w.pid : PILOT_ORDER[i % PILOT_ORDER.length]; if (used.has(p)) p = PILOT_ORDER.find(q => !used.has(q)); used.add(p); return p; });
      const pool = PILOT_ORDER.filter(p => !used.has(p)), bots = []; for (let i = 0; i < Math.max(0, 6 - n); i++) bots.push({ pid: pool[i], skill: [0.1, 0.15, 0.28, 0.2, 0.05][i % 5] });
      const tid = TRACK_ORDER.includes(ev.map) ? ev.map : TRACK_ORDER[Math.floor(Math.random() * TRACK_ORDER.length)];
      return { tid, humans: pilots, bots, laps: ev.rounds || 3, skins: S.map((s, i) => okSkin((want[i] || {}).skin)) };
    },
    apply(c) { cfg = c; const w = document.getElementById('resWait'); if (w) w.remove(); Game.startNet({ tid: c.tid, humans: c.humans, bots: c.bots, laps: c.laps }); },
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
        c.laps.length, r2(c.laps[c.laps.length - 1] || 0), r2(c.lapT), r2(c.best), c.grounded ? 1 : 0, r2(c.fogT), r2(c.invT), r2(c.magnetT)]),
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
    });
    R.order = B.ord.map(i => R.cars[i]).filter(Boolean);
    R.hz = B.hz.map(z => Object.assign({}, z));
    B.bx.forEach((g, i) => { if (R.boxes[i]) R.boxes[i].gone = g; });
    const gs = new Set(B.gm); R.track.gems.forEach((g, i) => { g.gone = gs.has(i) ? 1 : 0; });
  }
  // un paso del remoto: lo último del anfitrión + sus eventos de este cuadro
  function clientStep(R, frameEv) {
    const S = NetPlay.sample(); if (S) apply(S.a, S.b, S.k);
    if (evQ.length) { frameEv.push(...evQ); evQ = []; }
  }
  // el anfitrión lanza otra carrera para todos (otra pista, mismos jugadores)
  function again() { NetPlay.again(c => { const others = TRACK_ORDER.filter(t => t !== c.tid); return Object.assign({}, c, { tid: others[Math.floor(Math.random() * others.length)] }); }); }
  return {
    seatsMax: 4, again,
    // lo que lleva puesto el jugador de otro aparato (lo manda el anfitrión en la carrera)
    skinOf(seat) { return (cfg && cfg.skins && okSkin(cfg.skins[seat])) || null; },
    neutral: () => NEUTRAL,
    // remoto: lo que aprieta cada jugador de este aparato (y los toques cortos cuentan una vez)
    readLocal(li) { const i = _read(li); if (li === NetPlay.mine.length - 1) Input.endStep(); return i; },
    snap, apply, clientStep,
    event(e) { evQ.push(e); if (evQ.length > 300) evQ.splice(0, evQ.length - 300); },
  };
})();
