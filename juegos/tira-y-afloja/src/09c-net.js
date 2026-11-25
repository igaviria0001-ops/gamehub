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
    return (lastIn[li] = { left: !!i.left, right: !!i.right, pull: !!i.pull, release: !!i.release, jump: !!i.jump || (H.jump || 0) > now, stick: !!i.stick || (H.stick || 0) > now });
  }
  const lastIn = [];

  /* ---------- arranque ---------- */
  NetPlay.gate({
    me(li) { return { flavor: G.flavors[li], acc: typeof Progress !== 'undefined' ? Progress.accOf(li) : 'ninguno' }; },
    make(want, ev) {
      const mode = ['caneca', 'chicles', 'rey', 'gol', 'escalada', 'campana'].includes(ev.mode) ? ev.mode : 'caneca';
      const fl = [0, 1].map(i => { const w = want[i] || {}; return FLAVORS[w.flavor] ? w.flavor : ['fresa', 'menta'][i]; });
      if (fl[0] === fl[1]) fl[1] = Object.keys(FLAVORS).find(k => k !== fl[0] && !FLAVORS[k].locked) || 'menta';
      const arena = ARENA_DEFS[ev.map] ? ev.map : 'random';
      // campaña en línea: primero el anfitrión elige la sala o el jefe (stage null) entre los que él tiene abiertos
      return { mode, arena, flavors: fl, accs: [0, 1].map(i => NetPlay.okId((want[i] || {}).acc) || 'ninguno'), wins: Math.max(1, Math.min(5, ev.len || ev.rounds || 3)), fiesta: mode !== 'campana' && !!(ev.opts && ev.opts.fiesta), stage: mode === 'campana' ? null : undefined };
    },
    apply(c) { reset(); if (c.mode === 'campana' && !Campaign.stages().some(s => s.id === c.stage)) UI.netCampPick(c); else UI.netStart(c); },
  });
  function again(stage) { NetPlay.again(c => Object.assign({}, c, stage !== undefined ? { stage } : {})); }

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
  // lo que cambia todo el tiempo (viaja siempre) y lo demás (solo cuando cambia: NetPlay.slow)
  const GF = ['stateT', 'roundT', 'hintsT', 'slowT', 'timeScale'], GS = ['round', 'wins', 'points', 'suddenDeath', 'canControl', 'respawn', 'countdownLen', 'ropeCut', 'kickoff', 'cdMarks', 'lastWinner', 'lastLoser', 'winsNeeded', 'spawnCount'];
  const ASTATIC = new Set(['id', 'def', 'L', 'solids', 'oneway', 'pegs', 'zones', 'hazards', 'movers', 'spawns', 'pelletSpots', 'goldenSpots', 'respawnSpots', 'cans', 'goals', 'variant', 'hazardY', 'ceilY', 'deskLeft', 'deskRight', 'deskY', 'canRim']);
  function arenaSnap() {
    const A = ARENA, o = { t: r2(A.t) }; if (A.movers.length) o.mv = A.movers.map(R => [r1(R.x), r1(R.y), r1(R.dx), r1(R.dy)]);
    const x = {}; for (const k in A) { if (ASTATIC.has(k) || k === 't' || k === 'mods') continue; const v = A[k]; if (typeof v === 'function') continue; const e = enc(v); if (e !== undefined) x[k] = e; }
    o.$s = { mods: enc(A.mods), zn: A.zones.map(Z => r2(Z.active)), x }; return o;
  }
  let arenaSlow = null;
  // la estela del balón no viaja (llegaba como [null, null…] y el dibujo del remoto se caía): el remoto arma la suya
  const noTrail = o => { if (o && o.ball) delete o.ball.trail; return o; };
  function snap() {
    if (!on() || G.state === 'attract' || !NetPlay.cfg || !G.rope) return null;
    const g = {}; for (const k of GF) { const v = enc(G[k]); if (v !== undefined) g[k] = v; }
    const g2 = {}; for (const k of GS) { const v = enc(G[k]); if (v !== undefined) g2[k] = v; }
    // el hilo: el primer punto entero y los demás como diferencias (números cortos)
    const R = G.rope, pts = []; let lx = 0, ly = 0; for (const p of R.pts) { const x = ri(p.x), y = ri(p.y); pts.push(x - lx, y - ly); lx = x; ly = y; }
    return {
      st: STS.indexOf(G.state), ar: G.arenaId, av: ARENA.variant || null, g, g2: NetPlay.slow('g2', g2),
      p: G.players.map(p => PF.map(k => enc(p[k]))),
      rp: { pts, len: r1(R.len), strain: r2(R.strain), tension: r1(R.tension), vis: R.visible ? 1 : 0, dA: [r2(R.dirA.x), r2(R.dirA.y)], dB: [r2(R.dirB.x), r2(R.dirB.y)], temp: r2(R.temp), snapFx: r2(R.snapFx), jitter: r2(R.jitter) },
      pl: NetPlay.slow('pl', G.pellets.map(pl => { const o = enc(pl); delete o.t; return o; })), gd: NetPlay.slow('gd', G.golden ? (o => { delete o.t; return o; })(enc(G.golden)) : 0),
      a: (() => { const o = arenaSnap(); arenaSlow = o.$s; delete o.$s; return o; })(), as: NetPlay.slow('as', arenaSlow), m: NetPlay.slow('m', noTrail(enc(Modes.M))), f: NetPlay.slow('f', enc(Fiesta.state), 500),
      cam: G.cam.focus ? enc(G.cam.focus) : 0,
      cp: G.mode === 'campana' ? campSnap() : undefined, jf: G.mode === 'jefe' ? jefeSnap() : undefined,
    };
  }
  // campaña: lo que cambia de cada mecanismo (rejas, placas, palancas, poleas, ventiladores, carritos…) y el reloj de la sala
  const OSKIP = new Set(['kind', 'id', 'link', 'dir', 'w', 'h', 'x0', 'y0', 'ay', 'by', 'cycle', 'latch', 'hold', 'color', 'label', 'r', 'len', 'amp', 'period', 'power']);
  function objDyn(o) { const q = {}; for (const k in o) { if (OSKIP.has(k)) continue; const v = o[k], t = typeof v; if (t === 'number') q[k] = r1(v); else if (t === 'boolean') q[k] = v ? 1 : 0; else if (v && t === 'object' && !Array.isArray(v) && (k === 'a' || k === 'b')) q[k] = { x: r1(v.x), y: r1(v.y) }; } return q; }
  const objLast = []; let objFullAt = 0;
  function campSnap() {
    const L = ARENA.L, S = Campaign.state, now = performance.now(), full = now - objFullAt > 1000; if (full) objFullAt = now;
    const ob = []; if (L && L.objs) L.objs.forEach((o, i) => { const q = objDyn(o), j = JSON.stringify(q); if (full || objLast[i] !== j) { objLast[i] = j; ob.push([i, q]); } });
    return { ob, s: S ? { t: r1(S.t), fail: r2(S.fail), win: r1(S.win), inDoor: S.inDoor | 0, cutT: r2(S.cutT || 0), tipT: r2(S.tipT || 0), falls: S.falls | 0, wr: (S.wr || []).map(w => (w.got ? 1 : 0)) } : null };
  }
  // jefe: su estado entero (sin la definición ni las funciones), cuerpo incluido
  const JSKIP = new Set(['def', 'impl', 'result', 'lossBy']);
  function jefeSnap() { const J = Jefes.state; if (!J) return null; const o = {}; for (const k in J) { if (JSKIP.has(k)) continue; const e = enc(J[k]); if (e !== undefined) o[k] = e; } return o; }

  /* ---------- aplicar (remoto) ---------- */
  const lerp = (a, b, k) => a + (b - a) * k;
  function deepSet(dst, src) { for (const k in src) { const v = src[k]; if (v && typeof v === 'object' && !Array.isArray(v) && dst[k] && typeof dst[k] === 'object' && !Array.isArray(dst[k])) deepSet(dst[k], v); else dst[k] = v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v; } }
  const LIN = new Set(['x', 'y', 'vx', 'vy', 'r', 'mass', 'dunkT', 'charge', 'sticky', 'gripLoad']);
  function apply(A, B, k) {
    if (!A || !B) return;
    if (B.ar && (G.arenaId !== B.ar || (ARENA.variant || null) !== (B.av || null))) Game.setArena(B.ar, B.av || null);
    G.state = STS[B.st] || 'play';
    for (const key in B.g) G[key] = B.g[key];
    if (B.g2) for (const key in B.g2) G[key] = B.g2[key];
    G.players.forEach((p, i) => { const a = A.p[i], b = B.p[i]; if (!a || !b) return;
      const far = Math.abs(a[0] - b[0]) > 300 || Math.abs(a[1] - b[1]) > 300;
      PF.forEach((f, j) => { const v = b[j]; if (v && typeof v === 'object') { if (p[f] && typeof p[f] === 'object') Object.assign(p[f], v); else p[f] = v; } else p[f] = LIN.has(f) && !far && typeof a[j] === 'number' && typeof v === 'number' ? lerp(a[j], v, k) : v; });
      p.r = Math.max(4, p.r || 20); });
    const R = G.rope, ra = A.rp, rb = B.rp, abs = d => { if (d._abs) return d._abs; const o = []; let x = 0, y = 0; for (let q = 0; q < d.pts.length; q += 2) { x += d.pts[q]; y += d.pts[q + 1]; o.push(x, y); } return (d._abs = o); }, pa = abs(ra), pb = abs(rb);
    if (R.pts.length * 2 === pb.length) R.pts.forEach((pt, q) => { const ax = pa[q * 2], ay = pa[q * 2 + 1], bx = pb[q * 2], by = pb[q * 2 + 1]; pt.px = pt.x; pt.py = pt.y; if (pa.length === pb.length && Math.abs(ax - bx) < 300) { pt.x = lerp(ax, bx, k); pt.y = lerp(ay, by, k); } else { pt.x = bx; pt.y = by; } });
    R.len = rb.len; R.strain = rb.strain; R.tension = rb.tension; R.visible = !!rb.vis; R.dirA.x = rb.dA[0]; R.dirA.y = rb.dA[1]; R.dirB.x = rb.dB[0]; R.dirB.y = rb.dB[1]; R.temp = rb.temp; R.snapFx = rb.snapFx; R.jitter = rb.jitter;
    if (B.pl) G.pellets = B.pl.map((o, i) => Object.assign({ t: (G.pellets[i] && G.pellets[i].t) || 0 }, o));
    if (B.gd !== undefined) G.golden = B.gd ? Object.assign({ t: (G.golden && G.golden.t) || 0 }, B.gd) : null;
    // escenario: lo que se mueve (muebles, ventiladores, el bus…) y su estado propio
    const Ar = ARENA, D = B.a, DA = A.a; if (D) { Ar.t = D.t; if (D.mv) D.mv.forEach((v, i) => { const R2 = Ar.movers[i], va = DA && DA.mv && DA.mv[i]; if (R2) { const nr = va && Math.abs(va[0] - v[0]) < 200 && Math.abs(va[1] - v[1]) < 200; R2.x = nr ? lerp(va[0], v[0], k) : v[0]; R2.y = nr ? lerp(va[1], v[1], k) : v[1]; R2.dx = v[2]; R2.dy = v[3]; } }); }
    const DS = B.as; if (DS) { if (DS.mods) deepSet(Ar.mods, DS.mods); if (DS.zn) DS.zn.forEach((v, i) => { if (Ar.zones[i]) Ar.zones[i].active = v; }); if (DS.x) deepSet(Ar, DS.x); }
    if (B.m) deepSet(Modes.M, B.m);
    { const ba = A.m && A.m.ball, bb = B.m && B.m.ball, MB = Modes.M.ball; if (MB && ba && bb && Math.abs(ba.x - bb.x) < 300 && Math.abs(ba.y - bb.y) < 300) { MB.x = lerp(ba.x, bb.x, k); MB.y = lerp(ba.y, bb.y, k); if (typeof ba.rot === 'number' && typeof bb.rot === 'number' && Math.abs(bb.rot - ba.rot) < 3) MB.rot = lerp(ba.rot, bb.rot, k); } // el balón, suave
      // su estela, como la del anfitrión (rápido = deja rastro que se apaga en ~0,17 s)
      if (MB) { const now = performance.now(), tr = MB._tr || (MB._tr = []); if (Math.hypot(MB.vx || 0, MB.vy || 0) > 900 && (!tr.length || now - tr[tr.length - 1].t > 16)) tr.push({ x: MB.x, y: MB.y, t: now }); while (tr.length && now - tr[0].t > 170) tr.shift(); MB.trail = tr.slice(-8).map(g => ({ x: g.x, y: g.y, a: 0.4 - (now - g.t) * 0.0024 })).filter(g => g.a > 0); } }
    if (B.f) deepSet(Fiesta.state, B.f);
    if (B.cp) { const L = ARENA.L, S = Campaign.state; if (L && L.objs) for (const [i, q] of B.cp.ob) if (L.objs[i]) { for (const k in q) { const v = q[k]; if (v && typeof v === 'object') { if (L.objs[i][k]) Object.assign(L.objs[i][k], v); } else L.objs[i][k] = typeof L.objs[i][k] === 'boolean' ? !!v : v; } }
      if (B.cp.s && S) { const s = B.cp.s; S.t = s.t; S.fail = s.fail; S.win = s.win; S.inDoor = s.inDoor; S.cutT = s.cutT; S.tipT = s.tipT; S.falls = s.falls; (S.wr || []).forEach((w, i) => { w.got = !!s.wr[i]; }); } }
    if (B.jf && Jefes.state) deepSet(Jefes.state, B.jf);
    G.cam.focus = B.cam ? Object.assign({}, B.cam) : null;
  }

  /* ---------- predicción del chicle propio (remoto) ----------
     Moverse, saltar y pegarse responden YA: una copia del jugador de este aparato corre aquí con la misma física
     (Player.step, con el tirón del hilo que manda el anfitrión) y es la que se ve; el hilo se acomoda para seguir
     pegado a ella. Al llegar una instantánea se compara con lo que se predijo para ese momento (hace «un ping») y se
     corrige de a poquito; si allá pasó otra cosa (se despegó, cayó a la caneca, lo golpearon) se toma lo del anfitrión. */
  const PDT = 1 / 120, ghosts = {}, PST = { hard: 0, soft: 0, err: 0 }, IXP = Object.fromEntries(PF.map((k, i) => [k, i]));
  const SHOW = ['x', 'y', 'vx', 'vy', 'stuck', 'onGround', 'moveDir', 'charge', 'chargeLvl', 'jumping', 'diveT', 'airJumps', 'facing', 'pulling', 'releasing'];
  function hardSet(q, row) { PF.forEach((f, j) => { const v = row[j]; q[f] = v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v; }); q.setMass && q.setMass(q.mass); }
  function ghostOf(p, row) {
    let g = ghosts[p.id]; if (g && g.p === p) return g;
    const q = Object.assign(Object.create(Object.getPrototypeOf(p)), p); q.events = []; q.contacts = []; q.stats = Object.assign({}, p.stats); q.prevJump = false; q.prevStick = false;
    PST.made = (PST.made || 0) + 1;
    hardSet(q, row); return (ghosts[p.id] = { p, q, hist: [], lastN: 0, acc: 0 });
  }
  function histAt(H, t) {
    if (!H.length) return null; if (t < H[0].t) return t > H[0].t - 250 ? H[0] : null; // un poco antes del comienzo: el primero
    for (let i = H.length - 1; i >= 0; i--) if (H[i].t <= t) { const a = H[i], b = H[i + 1]; if (!b) return a; const k = (t - a.t) / Math.max(1e-6, b.t - a.t); return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), vx: lerp(a.vx, b.vx, k), vy: lerp(a.vy, b.vy, k), stuck: a.stuck }; }
    return null;
  }
  const rebase = (g, t) => { const q = g.q; g.hist = [{ t, x: q.x, y: q.y, vx: q.vx, vy: q.vy, stuck: q.stuck }]; };
  function reconcile(g, row, tAt) {
    const q = g.q, X = f => row[IXP[f]];
    if (!X('alive') || X('dunked') || !q.alive) { hardSet(q, row); rebase(g, tAt); return; }
    const h = histAt(g.hist, tAt); if (!h) { hardSet(q, row); rebase(g, tAt); PST.hard++; return; }
    // pegado/despegado distinto justo en ese instante: si unos ms antes o después la copia estaba igual, es solo el momento
    // exacto del toque (no se corrige esta vez); si no, de verdad pasó otra cosa allá
    if (!!h.stuck !== !!X('stuck')) { if (g.hist.some(o => Math.abs(o.t - tAt) < 90 && !!o.stuck === !!X('stuck'))) return; hardSet(q, row); rebase(g, tAt); PST.hard++; return; }
    const ex = X('x') - h.x, ey = X('y') - h.y, evx = X('vx') - h.vx, evy = X('vy') - h.vy; PST.soft++; PST.err = PST.err * 0.95 + Math.hypot(ex, ey) * 0.05;
    if (Math.hypot(ex, ey) > 150) { hardSet(q, row); rebase(g, tAt); PST.hard++; return; }
    const k = 0.3; q.x += ex * k; q.y += ey * k; q.vx += evx * k; q.vy += evy * k; if (q.stuck) { q.stuckX = q.x; q.stuckY = q.y; }
    for (const o of g.hist) { o.x += ex * k; o.y += ey * k; o.vx += evx * k; o.vy += evy * k; }
    // lo que decide el anfitrión: el cuerpo (tamaño del chicle), golpes, lo pegajoso
    if (Math.abs((X('mass') || 0) - q.mass) > 0.02) q.setMass(X('mass')); if ((X('stun') || 0) > q.stun + 0.05) q.stun = X('stun');
    for (const f of ['inv', 'sticky', 'slingT', 'whipT', 'anchor', 'pinned', 'hangT']) q[f] = X(f);
  }
  // cuadros muy lentos (el juego frena su reloj a 0,1 s por cuadro): la copia sigue el tiempo real para no quedarse atrás
  const realDt = (g, dt) => { const now = performance.now(), real = g.lastT ? (now - g.lastT) / 1000 : dt; g.lastT = now; return real > 0.1 ? Math.min(0.25, real) : dt; };
  function predict(dt) {
    const Lt = NetPlay.latest(), D = Lt && Lt.d; if (!D || !D.p || !G.rope) return; const now = performance.now(), R = G.rope;
    for (const seat of NetPlay.mine) {
      const p = G.players[seat], row = D.p[seat]; if (!p || !row) continue;
      const g = ghostOf(p, row), q = g.q;
      if (Lt.n !== g.lastN) { g.lastN = Lt.n; reconcile(g, row, Lt.arr - NetPlay.rtt - 12); }
      const inp = Object.assign({}, NEUTRAL, lastIn[NetPlay.mine.indexOf(seat)] || {});
      const GP = Object.create(G); GP.rope = Object.assign(Object.create(Object.getPrototypeOf(R)), R); GP.players = G.players.slice(); GP.players[seat] = q;
      g.acc += realDt(g, dt); let n = 0;
      while (g.acc >= PDT && n < 32) {
        const o = G.players[1 - seat], both = q.alive && o && o.alive && R.visible, d = seat === 0 ? R.dirA : R.dirB, T = both ? R.tension : 0, kk = (q.slingT > 0.62 ? 0 : 1);
        q.step(PDT, inp, { x: d.x * T * kk, y: d.y * T * kk }, GP); q.events.length = 0; g.acc -= PDT; n++;
      }
      if (n >= 32) g.acc = 0;
      g.hist.push({ t: now, x: q.x, y: q.y, vx: q.vx, vy: q.vy, stuck: q.stuck }); while (g.hist.length > 2 && now - g.hist[0].t > 3000) g.hist.shift();
      if (!p.alive || !q.alive) continue;
      // se dibuja la copia; el hilo se corre hacia ella (todo en la punta de este jugador, nada en la del otro)
      const dx = q.x - p.x, dy = q.y - p.y;
      for (const f of SHOW) p[f] = q[f] && typeof q[f] === 'object' ? Object.assign({}, q[f]) : q[f];
      if (q.stuckN) p.stuckN = { x: q.stuckN.x, y: q.stuckN.y };
      const P = R.pts, m = P.length - 1;
      if (m > 0 && (dx || dy)) P.forEach((pt, i) => { const w0 = seat === 0 ? 1 - i / m : i / m, w = w0 * w0 * (3 - 2 * w0); pt.x += dx * w; pt.y += dy * w; if (pt.px != null) { pt.px += dx * w; pt.py += dy * w; } });
    }
  }

  /* ---------- un cuadro del remoto ---------- */
  let evQ = [], resQ = null, shownRes = false, prevState = null;
  function clientStep(dt) {
    const S = NetPlay.sample(); if (S) apply(S.a, S.b, S.k);
    if (NetPlay.pred && dt > 0) predict(dt);
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
  function reset() { for (const k in ghosts) delete ghosts[k]; evQ = []; resQ = null; shownRes = false; prevState = null; }

  return {
    seatsMax: 2, again, snap, apply, clientStep, readLocal, get pst() { return PST; }, slowKeys: ['g2', 'pl', 'gd', 'as', 'm', 'f'],
    neutral: () => NEUTRAL,
    event(e) { evQ.push(e); if (evQ.length > 400) evQ.splice(0, evQ.length - 400); },
    results(r) { NetPlay.send({ t: 'res', r }, true, '*'); },
  };
})();
