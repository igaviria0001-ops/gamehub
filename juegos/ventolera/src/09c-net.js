/* =========================================================================
   VENTOLERA EN LÍNEA — adaptador entre la partida y NetPlay (src/00k-net.js).
   · Anfitrión: juega la partida de verdad con 2 a 4 pilotos (los de otros
     aparatos vuelan con lo que llega por la red); manda instantáneas
     compactas 30 veces por segundo y los eventos (tiros, golpes, sonidos).
   · Remoto: no simula; aplica las instantáneas (interpoladas 100 ms atrás),
     anima el escenario y dibuja con su propia cámara (sus pilotos).
   ========================================================================= */
const NetGame = (() => {
  const NEUTRAL = { dx: 0, dy: 0, roll: false, rdx: 0, rdy: 0, fire: false, boost: false, missile: false };
  const MODES_NET = ['duel', 'targets', 'case', 'race', 'boss'], ST = ['countdown', 'play', 'roundEnd', 'matchEnd'];
  const r1 = v => Math.round((+v || 0) * 10) / 10, r2 = v => Math.round((+v || 0) * 100) / 100, ri = v => Math.round(+v || 0);
  const _read = Input.read;

  /* ---------- entradas ---------- */
  // anfitrión: el piloto de otro aparato vuela con lo que llega; el tonel cuenta una sola vez aunque llegue repetido
  const lastRid = {};
  Input.read = i => {
    if (!(NetPlay.isHost && Game.G.net)) return _read(i);
    const li = NetPlay.local(i); if (li >= 0) return _read(li);
    const r = NetPlay.input(i); if (!r) return NEUTRAL;
    if (r.roll) { if (r.rid === lastRid[i]) return Object.assign({}, r, { roll: false }); lastRid[i] = r.rid; }
    return r;
  };
  // remoto: lo que aprieta cada jugador de este aparato; el tonel y el misil se repiten ~150 ms (por si se pierde un paquete)
  const latch = [], mlatch = [], lastIn = []; let ridN = 0;
  function readLocal(li) {
    const i = _read(li), now = performance.now();
    if (i.roll) latch[li] = { rdx: i.rdx, rdy: i.rdy, rid: ++ridN, until: now + 150 };
    if (i.missile) mlatch[li] = now + 120;
    const L = latch[li] && latch[li].until > now ? latch[li] : null;
    return (lastIn[li] = { dx: r2(i.dx), dy: r2(i.dy), fire: !!i.fire, boost: !!i.boost, missile: !!i.missile || (mlatch[li] || 0) > now, roll: !!L, rdx: L ? r2(L.rdx) : 0, rdy: L ? r2(L.rdy) : 0, rid: L ? L.rid : 0 });
  }

  /* ---------- arranque (sala de espera común) ---------- */
  // los colores de la sala pasan a ser los de los pilotos
  const rgb = h => { const n = parseInt(String(h).slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  NetPlay.onStart(o => { o.seats.forEach((s, i) => { if (s && /^#[0-9a-f]{6}$/i.test(s.color)) { const c = rgb(s.color); PLAYER_COLORS[i] = { main: s.color, glow: c.join(','), deep: '#' + c.map(v => Math.round(v * 0.6).toString(16).padStart(2, '0')).join(''), name: s.name }; } }); });
  const okLook = v => (typeof v === 'number' && v >= 0 && v < 9 ? v : NetPlay.okId(v) || 0);
  NetPlay.gate({
    me(li) { const c = Game.cfg; return { sp: c.species[li], look: c.looks[li], trail: c.trails[li] }; },
    make(want, ev) {
      const S = NetPlay.seats, mode = MODES_NET.includes(ev.mode) ? ev.mode : 'duel';
      const arena = ARENAS[ev.map] ? ev.map : ARENA_ORDER[Math.floor(Math.random() * ARENA_ORDER.length)];
      const species = S.map((s, i) => { const w = want[i] || {}; return SPECIES[w.sp] ? w.sp : ['guacamaya', 'condor', 'colibri', 'halcon'].find(k => SPECIES[k]) || Object.keys(SPECIES)[i % Object.keys(SPECIES).length]; });
      return { mode, arena, species, looks: S.map((s, i) => okLook((want[i] || {}).look)), trails: S.map((s, i) => NetPlay.okId((want[i] || {}).trail) || 't.ninguna'), wins: Math.max(1, Math.min(5, ev.len || ev.rounds || 3)), seed: 1 + Math.floor(Math.random() * 60000) };
    },
    apply(c) { snaps0(); UI.netStart(c); },
  });
  function again() { NetPlay.again(c => Object.assign({}, c, { seed: 1 + Math.floor(Math.random() * 60000) })); }

  /* ---------- instantánea (anfitrión) ---------- */
  // del piloto, lo que se ve: posición, rumbo, estado y barras (en el orden de BF)
  const BF = ['x', 'y', 'vx', 'vy', 'a', 'va', 'c', 's', 'hp', 'alive', 'boosting', 'legendT', 'shield', 'adren', 'missiles', 'locked', 'lockT', 'hitT', 'stun', 'spin', 'spinDir', 'rocket', 'rasante', 'rapid', 'mis', 'flipT', 'flares', 'drafting', 'stalled', 'lift', 'regen', 'overheat', 'heat', 'fuelLock', 'fuel', 'flapPh', 'evadeT', 'catchup', 'perch', 'lockTgt'];
  const BOOL = new Set(['alive', 'boosting', 'locked', 'rasante', 'drafting', 'stalled', 'regen', 'overheat', 'fuelLock', 'catchup']);
  const IX = Object.fromEntries(BF.map((k, i) => [k, i]));
  let nid = 0;
  function tgtCode(G, T) { if (!T) return -1; const bi = G.birds.indexOf(T); if (bi >= 0) return bi; const ti = G.targets.indexOf(T); return ti >= 0 ? 100 + ti : -1; }
  function birdArr(G, b) { return BF.map(k => (k === 'perch' ? (b.perch ? 1 : 0) : k === 'lockTgt' ? tgtCode(G, b.lockTgt) : BOOL.has(k) ? (b[k] ? 1 : 0) : k === 'x' || k === 'y' ? r1(b[k]) : k === 'vx' || k === 'vy' || k === 's' ? ri(b[k]) : r2(b[k]))); }
  // lo demás del mundo: copia simple (números, textos, listas cortas de cosas simples)
  function prim(o, depth = 0) {
    if (o == null || typeof o !== 'object') return o; if (Array.isArray(o)) { if (o.length > 60) return undefined; return o.map(v => (typeof v === 'number' ? r2(v) : v && typeof v === 'object' ? (depth < 2 ? prim(v, depth + 1) : undefined) : v)); }
    const r = {}; for (const k in o) { const v = o[k]; const t = typeof v; if (t === 'number') r[k] = r2(v); else if (t === 'string' || t === 'boolean') r[k] = v; else if (v && t === 'object' && depth < 2 && !(v instanceof Bird) && !v.nodeType && !(v instanceof CanvasRenderingContext2D)) { const p = prim(v, depth + 1); if (p !== undefined) r[k] = p; } }
    return r;
  }
  function worldSnap(W) {
    const o = { t: r2(W.time) };
    if (W.train) o.train = prim(W.train); if (W.ship) o.ship = prim(W.ship); if (W.hotair) o.hot = W.hotair.map(h => prim(h)); if (W.storm) o.storm = prim(W.storm); if (W.coast) o.coast = prim(W.coast);
    return o;
  }
  function snap() {
    const G = Game.G; if (!G.net || !NetPlay.cfg || !G.world || G.state === 'attract') return null;
    const sn = {
      s: [ST.indexOf(G.state), r2(G.stateT), G.round, r1(G.roundT), r2(G.timeScale), r2(G.cineTarget), G.freeze ? 1 : 0, G.canFight ? 1 : 0, G.roundWinner, G.winsNeeded],
      w: G.wins.slice(), sc: G.score.map(r2), fo: G.focus ? [ri(G.focus.x), ri(G.focus.y)] : 0, bn: G.banner ? prim(G.banner) : 0,
      b: G.birds.map(b => birdArr(G, b)),
      bu: [].concat(...G.bullets.map(u => [ri(u.x), ri(u.y), ri(u.vx), ri(u.vy), u.owner, u.enemy ? 1 : 0])),
      mi: G.missiles.map(m => { if (m.nid == null) m.nid = ++nid; return [m.nid, ri(m.x), ri(m.y), r2(m.a), m.owner, m.enemy ? 1 : 0, tgtCode(G, m.target), ri(m.s)]; }),
      fl: G.flares.map(f => { if (f.nid == null) f.nid = ++nid; return [f.nid, ri(f.x), ri(f.y), ri(f.vx), ri(f.vy), r2(f.life), f.owner]; }),
      cr: G.crates.map(c => prim(c)), ch: G.chutes.map(p => prim(p)),
      wd: worldSnap(G.world),
    };
    if (G.mode === 'targets' || (G.targets && G.targets.length)) sn.tg = G.targets.slice(0, 40).map(t => prim(t));
    if (G.case) sn.cs = prim(G.case);
    if (G.gates) sn.gf = G.gates.map(g => g.flash.map(r2));
    // Jefe en pareja: el dirigible (posición, fase, caída) y sus partes (dónde, vida, golpes, a punto de disparar); vidas del equipo
    if (G.boss) { const B = G.boss; sn.bo = { s: [ri(B.x), ri(B.y), B.dir, r2(B.flip), B.phase, B.dead ? 1 : 0, r2(B.fallT), r2(B.hitT), r2(B.t), B.lastHit], p: B.parts.map(p => [ri(p.x), ri(p.y), r1(p.hp), p.alive ? 1 : 0, r2(p.hitT || 0), r2(p.fireT || 0), r2(p.aim || 0)]) }; sn.lv = G.lives; }
    return sn;
  }

  /* ---------- aplicar (remoto) ---------- */
  const lerp = (a, b, k) => a + (b - a) * k;
  const lerpA = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return a + d * k; };
  const ANG = new Set(['a', 'va']), LIN = new Set(['x', 'y', 'vx', 'vy', 's', 'c', 'fuel', 'heat', 'adren', 'lift']);
  // asignar sin romper las referencias que guarda el juego (listas y objetos del escenario)
  function deepSet(dst, src) { for (const k in src) { const v = src[k]; if (v && typeof v === 'object' && !Array.isArray(v) && dst[k] && typeof dst[k] === 'object' && !Array.isArray(dst[k])) deepSet(dst[k], v); else dst[k] = v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v; } }
  const mTrail = new Map(), fTrail = new Map();
  let lastSN = -1;
  function snaps0() { mTrail.clear(); fTrail.clear(); lastSN = -1; for (const k in ghosts) delete ghosts[k]; }
  function apply(A, B, k, dtAB) {
    const G = Game.G; if (!A || !B || !G.world) return;
    const s = B.s; G.state = ST[s[0]] || 'play'; G.stateT = s[1]; G.round = s[2]; G.roundT = s[3]; G.timeScale = s[4]; G.cineTarget = s[5]; G.freeze = !!s[6]; G.canFight = !!s[7]; G.roundWinner = s[8]; G.winsNeeded = s[9];
    G.wins = B.w.slice(); G.score = B.sc.slice(); G.focus = B.fo ? { x: B.fo[0], y: B.fo[1] } : null; G.banner = B.bn ? Object.assign({}, B.bn) : null;
    G.birds.forEach((b, i) => {
      const a = A.b[i], c = B.b[i]; if (!a || !c) return;
      BF.forEach((f, j) => {
        if (f === 'perch') { b.perch = c[j] ? b.perch || { x: c[IX.x], y: c[IX.y] } : null; return; }
        if (f === 'lockTgt') { const v = c[j]; b.lockTgt = v < 0 ? null : v >= 100 ? G.targets[v - 100] || null : G.birds[v] || null; return; }
        if (BOOL.has(f)) { b[f] = !!c[j]; return; }
        b[f] = ANG.has(f) ? lerpA(a[j], c[j], k) : LIN.has(f) && a[IX.alive] && c[IX.alive] && Math.abs(c[IX.x] - a[IX.x]) < 600 ? lerp(a[j], c[j], k) : c[j];
      });
    });
    // proyectiles: los de B, llevados hacia atrás al mismo instante que los pilotos
    const back = (k - 1) * dtAB;
    G.bullets = []; for (let q = 0; q < B.bu.length; q += 6) { const x = B.bu[q] + B.bu[q + 2] * back, y = B.bu[q + 1] + B.bu[q + 3] * back; G.bullets.push({ x, y, px: x - B.bu[q + 2] / 60, py: y - B.bu[q + 3] / 60, vx: B.bu[q + 2], vy: B.bu[q + 3], owner: B.bu[q + 4], enemy: !!B.bu[q + 5], life: 1 }); }
    const seenM = new Set();
    G.missiles = B.mi.map(m => { const [id, x0, y0, a, owner, enemy, tg, sp] = m; seenM.add(id); const x = x0 + Math.cos(a) * sp * back, y = y0 + Math.sin(a) * sp * back;
      let tr = mTrail.get(id); if (!tr) mTrail.set(id, (tr = []));
      const target = tg < 0 ? null : tg >= 100 ? G.targets[tg - 100] || null : G.birds[tg] || null;
      return { x, y, a, s: sp, owner, enemy: !!enemy, target, orig: target, trail: tr, age: 1, life: 1 }; });
    for (const id of [...mTrail.keys()]) if (!seenM.has(id) && mTrail.get(id).lastT < G.time - 1) mTrail.delete(id);
    const seenF = new Set();
    G.flares = B.fl.map(f => { const [id, x0, y0, vx, vy, life, owner] = f; seenF.add(id); let tr = fTrail.get(id); if (!tr) fTrail.set(id, (tr = [])); return { x: x0 + vx * back, y: y0 + vy * back, vx, vy, life, owner, flare: true, trail: tr }; });
    for (const id of [...fTrail.keys()]) if (!seenF.has(id)) fTrail.delete(id);
    // lo que flota o cae (cajas en paracaídas, blancos, drones, el maletín): entre las dos instantáneas si es lo mismo y está cerca
    const near = (a, o) => a && typeof a.x === 'number' && typeof o.x === 'number' && Math.abs(a.x - o.x) < 160 && Math.abs(a.y - o.y) < 160 && a.type === o.type && a.kind === o.kind;
    const mid = (a, o) => { const r = Object.assign({}, o); if (near(a, o)) { r.x = lerp(a.x, o.x, k); r.y = lerp(a.y, o.y, k); } return r; };
    G.crates = B.cr.map((c, i) => mid(A.cr && A.cr[i], c)); G.chutes = B.ch.map((c, i) => mid(A.ch && A.ch[i], c));
    if (B.tg) G.targets = B.tg.map((t, i) => mid(A.tg && A.tg[i], t)); else if (G.mode !== 'targets') G.targets = [];
    G.case = B.cs ? mid(A.cs, B.cs) : null;
    if (B.gf && G.gates) B.gf.forEach((f, i) => { if (G.gates[i]) G.gates[i].flash = f.slice(); });
    if (B.bo && G.boss) { const O = G.boss, a = A.bo, s = B.bo.s, sa = a ? a.s : s; O.x = lerp(sa[0], s[0], k); O.y = lerp(sa[1], s[1], k); O.dir = s[2]; O.flip = s[3]; O.phase = s[4]; O.dead = !!s[5]; O.fallT = s[6]; O.hitT = s[7]; O.t = s[8]; O.lastHit = s[9];
      B.bo.p.forEach((q, i) => { const P = O.parts[i], qa = a && a.p[i]; if (!P) return; P.x = qa ? lerp(qa[0], q[0], k) : q[0]; P.y = qa ? lerp(qa[1], q[1], k) : q[1]; P.hp = q[2]; P.alive = !!q[3]; P.hitT = q[4]; P.fireT = q[5]; P.aim = q[6]; }); }
    if (B.lv != null) G.lives = B.lv;
    // escenario: solo cuando llega una instantánea nueva (entre medio se anima solo)
    if (B !== lastSN && B.wd) { lastSN = B; const W = G.world, D = B.wd; W.time = D.t; if (D.train && W.train) deepSet(W.train, D.train); if (D.ship && W.ship) deepSet(W.ship, D.ship); if (D.hot && W.hotair) D.hot.forEach((h, i) => { if (W.hotair[i]) deepSet(W.hotair[i], h); }); if (D.storm && W.storm) deepSet(W.storm, D.storm); if (D.coast && W.coast) deepSet(W.coast, D.coast); }
  }
  // estelas de misiles y bengalas (se arman aquí con las posiciones que se ven)
  function trails(G) {
    for (const m of G.missiles) { const tr = m.trail; tr.lastT = G.time; const L = tr[tr.length - 1]; if (!L || Math.hypot(L.x - m.x, L.y - m.y) > 6) { tr.push({ x: m.x, y: m.y, t: G.time }); if (tr.length > 40) tr.shift(); } }
    for (const f of G.flares) { const tr = f.trail; tr.push({ x: f.x, y: f.y, t: G.time }); if (tr.length > 30) tr.shift(); }
  }

  /* ---------- un cuadro del remoto ---------- */
  let evQ = [], resQ = null, shownRes = false, prevState = null;
  /* ---------- predicción del pájaro propio (remoto) ----------
     El pájaro de cada jugador de este aparato vuela YA con sus teclas: una copia corre aquí con la misma física
     (Bird.step, sin tocar el escenario) y es la que se ve. Cuando llega una instantánea, se compara con lo que la copia
     predijo para el momento que esa instantánea refleja (hace «un ping») y se corrige de a poquito; si pasó algo grande
     allá (lo tumbaron, se posó, un choque), se toma lo del anfitrión. Daño, blindaje, armas y puntos: los del anfitrión. */
  const PDT = 1 / 120, ghosts = {}, PST = { hard: 0, soft: 0, err: 0 };
  const VIS = ['x', 'y', 'vx', 'vy', 'a', 'va', 'c', 's', 'boosting', 'flipT', 'spin', 'spinDir', 'evadeT', 'lift', 'stalled', 'rasante', 'flapPh', 'drafting', 'stun', 'fuel', 'fuelLock'];
  const NOW = ['knockHotair', 'hitCrown', 'hitBuilding', 'nudgeCabin'], NOP = () => {};
  function hardSet(b, c) {
    BF.forEach((f, j) => { if (f === 'perch') b.perch = c[j] ? (b.perch && !b.perch.ship && b.perch.hot == null ? b.perch : { x: c[IX.x], y: c[IX.y] }) : null; else if (f !== 'lockTgt') b[f] = BOOL.has(f) ? !!c[j] : c[j]; });
  }
  function ghostOf(G, seat, c) {
    let g = ghosts[seat]; if (g && g.G === G && g.world === G.world) return g;
    const src = G.birds[seat], GP = Object.create(G); GP.events = [];
    const b = Object.assign(Object.create(Object.getPrototypeOf(src)), src); b.trail = []; b.stats = Object.assign({}, src.stats); b.perch = null; b.G = GP;
    PST.made = (PST.made || 0) + 1;
    hardSet(b, c); return (ghosts[seat] = { G, world: G.world, GP, bird: b, hist: [], lastN: 0, acc: 0 });
  }
  function histAt(H, t) {
    if (!H.length) return null; if (t < H[0].t) return t > H[0].t - 250 ? H[0] : null; // un poco antes del comienzo: el primero
    for (let i = H.length - 1; i >= 0; i--) if (H[i].t <= t) { const a = H[i], b = H[i + 1]; if (!b) return a; const k = (t - a.t) / Math.max(1e-6, b.t - a.t); return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), vx: lerp(a.vx, b.vx, k), vy: lerp(a.vy, b.vy, k), a: lerpA(a.a, b.a, k), perch: a.perch }; }
    return null;
  }
  const rebase = (g, t) => { const b = g.bird; g.hist = [{ t, x: b.x, y: b.y, vx: b.vx, vy: b.vy, a: b.a, perch: !!b.perch }]; };
  function reconcile(g, c, tAt) {
    const b = g.bird;
    if (!c[IX.alive] || !b.alive) { hardSet(b, c); rebase(g, tAt); return; } // tumbado o reapareciendo: lo del anfitrión
    const h = histAt(g.hist, tAt); if (!h) { hardSet(b, c); rebase(g, tAt); PST.hard++; return; }
    // posado/volando distinto: si unos ms antes o después la copia estaba igual, es solo el instante exacto (no se corrige esta vez)
    if (!!h.perch !== !!c[IX.perch]) { if (g.hist.some(o => Math.abs(o.t - tAt) < 90 && !!o.perch === !!c[IX.perch])) return; hardSet(b, c); rebase(g, tAt); PST.hard++; return; }
    const e = { x: c[IX.x] - h.x, y: c[IX.y] - h.y, vx: c[IX.vx] - h.vx, vy: c[IX.vy] - h.vy, a: angDiff(h.a, c[IX.a]) };
    PST.soft++; PST.err = PST.err * 0.95 + Math.hypot(e.x, e.y) * 0.05;
    if (Math.hypot(e.x, e.y) > 170 || Math.abs(e.a) > 1.6) { hardSet(b, c); rebase(g, tAt); PST.hard++; return; }
    const k = 0.3;
    b.x += e.x * k; b.y += e.y * k; b.vx += e.vx * k; b.vy += e.vy * k; b.a += e.a * k; b.s = Math.hypot(b.vx, b.vy); b.va = Math.atan2(b.vy, b.vx); b.c = Math.cos(b.a) >= 0 ? 1 : -1;
    for (const q of g.hist) { q.x += e.x * k; q.y += e.y * k; q.vx += e.vx * k; q.vy += e.vy * k; q.a += e.a * k; }
    // lo que decide el anfitrión: daño, golpes, blindaje, armas
    for (const f of ['hp', 'shield', 'legendT', 'rocket', 'missiles', 'flares', 'mis', 'adren', 'heat', 'hitT', 'rapid', 'catchup']) b[f] = c[IX[f]];
    b.overheat = !!c[IX.overheat]; if (c[IX.stun] > b.stun + 0.05) b.stun = c[IX.stun]; if (c[IX.spin] > b.spin + 0.2) { b.spin = c[IX.spin]; b.spinDir = c[IX.spinDir]; }
    if (Math.abs(c[IX.fuel] - b.fuel) > 0.12) { b.fuel = c[IX.fuel]; b.fuelLock = !!c[IX.fuelLock]; }
  }
  // cuadros muy lentos (el juego frena su reloj a 0,1 s por cuadro): la copia sigue el tiempo real para no quedarse atrás
  const realDt = (g, dt) => { const now = performance.now(), real = g.lastT ? (now - g.lastT) / 1000 : dt; g.lastT = now; return real > 0.1 ? Math.min(0.25, real) : dt; };
  function predict(G, dt) {
    const Lt = NetPlay.latest(), D = Lt && Lt.d, now = performance.now(); if (!D || !D.b || !G.world) return;
    for (const seat of NetPlay.mine) {
      const c = D.b[seat], shown = G.birds[seat]; if (!c || !shown) continue;
      const g = ghostOf(G, seat, c), b = g.bird;
      if (Lt.n !== g.lastN) { g.lastN = Lt.n; reconcile(g, c, Lt.arr - NetPlay.rtt - 12); }
      const playing = G.state === 'play' || G.state === 'roundEnd', inp = playing && !G.freeze ? Object.assign({}, NEUTRAL, lastIn[NetPlay.mine.indexOf(seat)] || {}) : NEUTRAL;
      g.acc += realDt(g, dt); let n = 0; const keep = NOW.map(k => World[k]); NOW.forEach(k => { World[k] = NOP; });
      try { while (g.acc >= PDT && n < 32) { if (!G.freeze) b.step(PDT, inp, g.GP); g.GP.events.length = 0; g.acc -= PDT; n++; } } finally { NOW.forEach((k, i) => { World[k] = keep[i]; }); }
      if (n >= 32) g.acc = 0;
      g.hist.push({ t: now, x: b.x, y: b.y, vx: b.vx, vy: b.vy, a: b.a, perch: !!b.perch }); while (g.hist.length > 2 && now - g.hist[0].t > 3000) g.hist.shift();
      if (!b.alive || !shown.alive) continue;
      for (const f of VIS) shown[f] = b[f];
      shown.perch = b.perch ? shown.perch || { x: b.x, y: b.y } : null; if (shown.perch) { shown.perch.x = b.x; shown.perch.y = b.y; }
    }
  }
  function clientStep(dt) {
    const G = Game.G, S = NetPlay.sample();
    if (S) apply(S.a, S.b, S.k, S.dt || 0.033);
    if (NetPlay.pred && dt > 0) predict(G, dt);
    for (const b of G.birds) { b.G = G; if (b.alive) b.pushTrail(dt, !!b.perch); else b.trail.length = 0; }
    trails(G);
    G.cine += (G.cineTarget - G.cine) * Math.min(1, dt * 4);
    if (G.banner) G.banner.t = (G.banner.t || 0) + 0; // el anfitrión ya manda cuánto lleva
    if (evQ.length) { const l = evQ; evQ = []; Game.clientEvents(l); }
    // fin de la partida: los resultados llegan del anfitrión
    if (G.state !== prevState) { if (G.state === 'countdown' || G.state === 'play') shownRes = false; prevState = G.state; }
    if (G.state === 'matchEnd' && resQ && !shownRes) { shownRes = true; const r = resQ; resQ = null; try { Progress.matchEnd(G, r); } catch (e) { /* nada */ } UI.results(r); }
  }
  NetPlay.onMsg(d => { if (d.t === 'res' && NetPlay.isClient && d.r) resQ = d.r; });

  return {
    seatsMax: 4, again, snap, apply, clientStep, readLocal, get pst() { return PST; },
    neutral: () => NEUTRAL,
    // anfitrión: cada evento de la partida viaja a los remotos (el piloto va como número)
    fwd(e) { const o = {}; for (const k in e) { const v = e[k], t = typeof v; if (t === 'number' || t === 'string' || t === 'boolean') o[k] = v; else if (k === 'b' && v && v.id != null) o.bid = v.id; else if (k === 'b' && v && typeof v.x === 'number') { o.bx = Math.round(v.x); o.by = Math.round(v.y); } } NetPlay.event(o); }, // (el jefe y sus partes no son pilotos: viaja su posición)
    // remoto: los eventos que llegan del anfitrión se muestran en el próximo cuadro
    event(e) { evQ.push(e); if (evQ.length > 400) evQ.splice(0, evQ.length - 400); },
    // anfitrión: resultados a todos
    results(r) { NetPlay.send({ t: 'res', r }, true, '*'); },
  };
})();
