/* =========================================================================
   TIRA Y AFLOJA EN LÍNEA — adaptador entre el duelo de chicle y NetPlay.
   El hilo une a dos: en línea se juega de a 2 (cada uno en su aparato, o los
   dos en uno) y los demás de la sala MIRAN la partida en vivo.
   · Anfitrión: juega de verdad; manda 30 veces por segundo los dos chicles,
     el hilo, el escenario (lo que se mueve), bolitas y el estado del modo; los
     efectos y sonidos se copian tal cual (cada llamada a FX/Sound viaja).
   · Remoto: no simula; aplica lo que llega (interpolado 100 ms atrás) y anima
     los cuerpos de chicle él mismo (ojos, rebote, estela).
   ========================================================================= */
const NetGame = (() => {
  const NEUTRAL = { left: false, right: false, jump: false, stick: false, pull: false, release: false };
  const STS = ['countdown', 'play', 'roundEnd', 'matchEnd', 'replay', 'pick'];
  const r1 = v => Math.round((+v || 0) * 10) / 10, r2 = v => Math.round((+v || 0) * 100) / 100, ri = v => Math.round(+v || 0);
  const G = Game.G, on = () => !!G.net && NetPlay.on;
  const _player = Input.player;

  /* ---------- entradas ---------- */
  Input.player = i => {
    if (!(NetPlay.isHost && on())) return _player(i);
    const li = NetPlay.local(i); if (li >= 0) return _player(li);
    return NetPlay.input(i) || NEUTRAL;
  };
  // remoto: saltar y pegarse son toques cortos: se repiten ~120 ms (por si se pierde un paquete)
  const hold = [];
  function readLocal(li) {
    const i = _player(li), now = performance.now(), H = hold[li] || (hold[li] = {});
    for (const k of ['jump', 'stick']) if (i[k]) H[k] = now + 120;
    return { left: !!i.left, right: !!i.right, pull: !!i.pull, release: !!i.release, jump: !!i.jump || (H.jump || 0) > now, stick: !!i.stick || (H.stick || 0) > now };
  }

  /* ---------- arranque ---------- */
  NetPlay.gate({
    me(li) { return { flavor: G.flavors[li], acc: typeof Progress !== 'undefined' ? Progress.accOf(li) : 'ninguno' }; },
    make(want, ev) {
      const mode = ['caneca', 'chicles', 'rey', 'gol', 'escalada'].includes(ev.mode) ? ev.mode : 'caneca';
      const fl = [0, 1].map(i => { const w = want[i] || {}; return FLAVORS[w.flavor] ? w.flavor : ['fresa', 'menta'][i]; });
      if (fl[0] === fl[1]) fl[1] = Object.keys(FLAVORS).find(k => k !== fl[0] && !FLAVORS[k].locked) || 'menta';
      const arena = ARENA_DEFS[ev.map] ? ev.map : 'random';
      return { mode, arena, flavors: fl, accs: [0, 1].map(i => NetPlay.okId((want[i] || {}).acc) || 'ninguno'), wins: Math.max(1, Math.min(5, ev.len || ev.rounds || 3)) };
    },
    apply(c) { reset(); UI.netStart(c); },
  });
  function again() { NetPlay.again(c => Object.assign({}, c)); }

  /* ---------- efectos y sonidos: cada llamada del anfitrión se repite en los remotos ---------- */
  const enc = (v, d = 0) => { if (v == null) return v; const t = typeof v; if (t === 'number') return r2(v); if (t === 'string' || t === 'boolean') return v; if (t === 'function' || d > 2) return undefined; if (Array.isArray(v)) return v.length > 40 ? undefined : v.map(x => enc(x, d + 1)); const o = {}; for (const k in v) { const e = enc(v[k], d + 1); if (e !== undefined) o[k] = e; } return o; };
  const live = () => on() && NetPlay.isHost && G.state !== 'attract' && !G.quiet;
  for (const f of ['shake', 'dust', 'gum', 'ring', 'stars', 'paper', 'confetti', 'sparkle', 'speedLines', 'callout', 'banner', 'clearBanners']) {
    const orig = FX[f]; if (typeof orig !== 'function') continue;
    FX[f] = function (...a) { if (live()) NetPlay.event({ type: '$fx', f, j: JSON.stringify(a.map(x => enc(x))) }); return orig.apply(FX, a); };
  }
  { const orig = Sound.play; Sound.play = function (n, ...a) { if (live()) NetPlay.event({ type: '$s', n: String(n), j: JSON.stringify(a.map(x => enc(x))) }); return orig.call(Sound, n, ...a); }; }
  { const orig = Player.prototype.bump; Player.prototype.bump = function (...a) { if (live()) NetPlay.event({ type: '$b', id: this.id, j: JSON.stringify(a.map(x => enc(x))) }); return orig.apply(this, a); }; }

  /* ---------- instantánea (anfitrión) ---------- */
  const PF = ['x', 'y', 'vx', 'vy', 'r', 'mass', 'alive', 'stuck', 'onGround', 'stun', 'inv', 'facing', 'dunked', 'dunkT', 'dunkX', 'pulling', 'releasing', 'reeling', 'charge', 'chargeLvl', 'sticky', 'gripLoad', 'mood', 'stuckN', 'ropeDir', 'ropeT', 'slingT', 'whipT', 'diveT', 'moveDir', 'airJumps', 'hangT', 'jumping', 'anchor', 'pinned'];
  const GF = ['stateT', 'roundT', 'round', 'wins', 'points', 'timeScale', 'slowT', 'suddenDeath', 'canControl', 'respawn', 'countdownLen', 'ropeCut', 'kickoff', 'cdMarks', 'hintsT', 'lastWinner', 'lastLoser', 'winsNeeded', 'spawnCount'];
  const ASTATIC = new Set(['id', 'def', 'L', 'solids', 'oneway', 'pegs', 'zones', 'hazards', 'movers', 'spawns', 'pelletSpots', 'goldenSpots', 'respawnSpots', 'cans', 'goals', 'variant', 'hazardY', 'ceilY', 'deskLeft', 'deskRight', 'deskY', 'canRim']);
  function arenaSnap() {
    const A = ARENA, o = { t: r2(A.t), mods: enc(A.mods), mv: A.movers.map(R => [r1(R.x), r1(R.y), r1(R.dx), r1(R.dy)]), zn: A.zones.map(Z => r2(Z.active)) };
    const x = {}; for (const k in A) { if (ASTATIC.has(k) || k === 't' || k === 'mods') continue; const v = A[k]; if (typeof v === 'function') continue; const e = enc(v); if (e !== undefined) x[k] = e; }
    o.x = x; return o;
  }
  function snap() {
    if (!on() || G.state === 'attract' || !NetPlay.cfg || !G.rope) return null;
    const g = {}; for (const k of GF) { const v = enc(G[k]); if (v !== undefined) g[k] = v; }
    const R = G.rope, pts = []; for (const p of R.pts) pts.push(ri(p.x), ri(p.y));
    return {
      st: STS.indexOf(G.state), ar: G.arenaId, av: ARENA.variant || null, g,
      p: G.players.map(p => PF.map(k => enc(p[k]))),
      rp: { pts, len: r1(R.len), strain: r2(R.strain), tension: r1(R.tension), vis: R.visible ? 1 : 0, dA: [r2(R.dirA.x), r2(R.dirA.y)], dB: [r2(R.dirB.x), r2(R.dirB.y)], temp: r2(R.temp), snapFx: r2(R.snapFx), jitter: r2(R.jitter) },
      pl: G.pellets.map(pl => enc(pl)), gd: G.golden ? enc(G.golden) : 0,
      a: arenaSnap(), m: enc(Modes.M), f: enc(Fiesta.state),
      cam: G.cam.focus ? enc(G.cam.focus) : 0,
    };
  }

  /* ---------- aplicar (remoto) ---------- */
  const lerp = (a, b, k) => a + (b - a) * k;
  function deepSet(dst, src) { for (const k in src) { const v = src[k]; if (v && typeof v === 'object' && !Array.isArray(v) && dst[k] && typeof dst[k] === 'object' && !Array.isArray(dst[k])) deepSet(dst[k], v); else dst[k] = v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v; } }
  const LIN = new Set(['x', 'y', 'vx', 'vy', 'r', 'mass', 'dunkT', 'charge', 'sticky', 'gripLoad']);
  function apply(A, B, k) {
    if (!A || !B) return;
    if (B.ar && (G.arenaId !== B.ar || (ARENA.variant || null) !== (B.av || null))) Game.setArena(B.ar, B.av || null);
    G.state = STS[B.st] || 'play';
    for (const key in B.g) G[key] = B.g[key];
    G.players.forEach((p, i) => { const a = A.p[i], b = B.p[i]; if (!a || !b) return;
      const far = Math.abs(a[0] - b[0]) > 300 || Math.abs(a[1] - b[1]) > 300;
      PF.forEach((f, j) => { const v = b[j]; if (v && typeof v === 'object') { if (p[f] && typeof p[f] === 'object') Object.assign(p[f], v); else p[f] = v; } else p[f] = LIN.has(f) && !far && typeof a[j] === 'number' && typeof v === 'number' ? lerp(a[j], v, k) : v; });
      p.r = Math.max(4, p.r || 20); });
    const R = G.rope, ra = A.rp, rb = B.rp;
    if (R.pts.length * 2 === rb.pts.length) R.pts.forEach((pt, q) => { const ax = ra.pts[q * 2], ay = ra.pts[q * 2 + 1], bx = rb.pts[q * 2], by = rb.pts[q * 2 + 1]; pt.px = pt.x; pt.py = pt.y; if (ra.pts.length === rb.pts.length && Math.abs(ax - bx) < 300) { pt.x = lerp(ax, bx, k); pt.y = lerp(ay, by, k); } else { pt.x = bx; pt.y = by; } });
    R.len = rb.len; R.strain = rb.strain; R.tension = rb.tension; R.visible = !!rb.vis; R.dirA.x = rb.dA[0]; R.dirA.y = rb.dA[1]; R.dirB.x = rb.dB[0]; R.dirB.y = rb.dB[1]; R.temp = rb.temp; R.snapFx = rb.snapFx; R.jitter = rb.jitter;
    G.pellets = B.pl.map(o => Object.assign({}, o)); G.golden = B.gd ? Object.assign({}, B.gd) : null;
    // escenario: lo que se mueve (muebles, ventiladores, el bus…) y su estado propio
    const Ar = ARENA, D = B.a; if (D) { Ar.t = D.t; deepSet(Ar.mods, D.mods); D.mv.forEach((v, i) => { const R2 = Ar.movers[i]; if (R2) { R2.x = v[0]; R2.y = v[1]; R2.dx = v[2]; R2.dy = v[3]; } }); D.zn.forEach((v, i) => { if (Ar.zones[i]) Ar.zones[i].active = v; }); if (D.x) deepSet(Ar, D.x); }
    if (B.m) deepSet(Modes.M, B.m);
    if (B.f) deepSet(Fiesta.state, B.f);
    G.cam.focus = B.cam ? Object.assign({}, B.cam) : null;
  }

  /* ---------- un cuadro del remoto ---------- */
  let evQ = [], resQ = null, shownRes = false, prevState = null;
  function clientStep(dt) {
    const S = NetPlay.sample(); if (S) apply(S.a, S.b, S.k);
    if (evQ.length) { const l = evQ; evQ = [];
      for (const e of l) { try {
        const a = e.j ? JSON.parse(e.j) : [];
        if (e.type === '$fx' && FX[e.f]) FX[e.f](...a);
        else if (e.type === '$s') Sound.play(e.n, ...a);
        else if (e.type === '$b' && G.players[e.id]) G.players[e.id].bump(...a);
      } catch (er) { /* nada */ } } }
    if (G.state !== prevState) { if (G.state === 'countdown' || G.state === 'play') shownRes = false; prevState = G.state; }
    if (G.state === 'matchEnd' && resQ && !shownRes && G.stateT > 2.4) { shownRes = true; const r = resQ; resQ = null; UI.showResults(r); }
  }
  NetPlay.onMsg(d => { if (d.t === 'res' && NetPlay.isClient && d.r) resQ = d.r; });
  function reset() { evQ = []; resQ = null; shownRes = false; prevState = null; }

  return {
    seatsMax: 2, again, snap, apply, clientStep, readLocal,
    neutral: () => NEUTRAL,
    event(e) { evQ.push(e); if (evQ.length > 400) evQ.splice(0, evQ.length - 400); },
    results(r) { NetPlay.send({ t: 'res', r }, true, '*'); },
  };
})();
