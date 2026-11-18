/* =========================================================================
   SORTILEGIO EN LÍNEA — adaptador entre el duelo y NetPlay (src/00k-net.js).
   · Anfitrión: juega de verdad con 2 a 4 magos (los de otros aparatos con lo
     que llega por la red). Manda 30 veces por segundo una instantánea (magos,
     hechizos, criaturas, estado de la ronda), los eventos, los efectos y
     letreros que arma la lógica, y el terreno: una foto entera al empezar cada
     ronda y después solo las celdas que cambian de verdad (fuego, hielo…).
   · Remoto: no simula; arma la misma ronda (mismo escenario y semilla), aplica
     lo que llega (interpolado 100 ms atrás) y deja correr los tiempos del
     terreno igual que el anfitrión.
   ========================================================================= */
const NetGame = (() => {
  const NEUTRAL = { mx: 0, my: 0, h: [false, false], dash: false };
  const ST = ['count', 'play', 'roundEnd', 'matchEnd'];
  const r2 = v => Math.round((+v || 0) * 100) / 100;
  const _read = Input.read;
  const on = () => NetPlay.on && Game.G.net;

  /* ---------- entradas ---------- */
  const pinSeen = {};
  Input.read = i => {
    if (!(NetPlay.isHost && on())) return _read(i);
    const li = NetPlay.local(i); if (li >= 0) return _read(li);
    const r = NetPlay.input(i); if (!r) return NEUTRAL;
    // celular remoto: tocó a un enemigo para marcarlo
    if (r.pn && r.pn[1] !== pinSeen[i]) { pinSeen[i] = r.pn[1]; const G = Game.G, m = G.mages[i], u = unitOf(r.pn[0]); if (m && u && m.canTarget(u)) { m.pin = { u, until: G.time + 5 }; m.pickU = u; if (m.holding || m.fuse) m.lockOn = u; } }
    return r;
  };
  let pinMine = [];
  function readLocal(li) { const i = _read(li); const o = { mx: r2(i.mx), my: r2(i.my), h: [!!i.h[0], !!i.h[1]], dash: !!i.dash }; if (pinMine[li]) o.pn = pinMine[li]; lastIn[li] = o; return o; }
  const lastIn = [];
  let pinN = 0;
  function pinFrom(li, u) { pinMine[li] = [codeOf(u), ++pinN]; }

  /* ---------- referencias: magos y criaturas viajan como números; las tablas del juego, por nombre ---------- */
  let nid = 0;
  function codeOf(u) { if (!u) return -1; if (u.isMage) return u.idx; if (u._nid == null) u._nid = ++nid; return 100 + u._nid; }
  const uMap = new Map(); // remoto: número → criatura/objeto
  function unitOf(c) { const G = Game.G; if (c == null || c < 0) return null; return c < 100 ? G.mages[c] || null : (NetPlay.isHost ? G.units.find(u => u._nid === c - 100) : uMap.get(c)) || null; }
  const DEF = new Map(), DEFR = new Map();
  (function walk() {
    const roots = { S: typeof SPELLS !== 'undefined' && SPELLS, F: typeof FUSIONS !== 'undefined' && FUSIONS, C: typeof CHARS !== 'undefined' && CHARS, E: typeof ELEMENTS !== 'undefined' && ELEMENTS, K: typeof CREATURES !== 'undefined' && CREATURES, P: typeof PRESAGES !== 'undefined' && PRESAGES, T: typeof TRAITS !== 'undefined' && TRAITS };
    const go = (o, path, d) => { if (!o || typeof o !== 'object' || DEF.has(o) || d > 4) return; DEF.set(o, path); DEFR.set(path, o); for (const k in o) { const v = o[k]; if (v && typeof v === 'object') go(v, path + '.' + k, d + 1); } };
    for (const k in roots) if (roots[k]) go(roots[k], k, 0);
  })();
  // copia simple para viajar: números redondeados, textos, listas y objetos chicos; magos/criaturas → {$u}, tablas → {$d}
  function enc(v, d = 0) {
    if (v == null) return v; const t = typeof v;
    if (t === 'number') return r2(v); if (t === 'string' || t === 'boolean') return v; if (t === 'function') return undefined;
    if (v instanceof Unit) return { $u: codeOf(v) };
    if (DEF.has(v)) return { $d: DEF.get(v) };
    if (d > 3) return undefined;
    if (Array.isArray(v) || ArrayBuffer.isView(v)) { if (v.length > 80) return undefined; return Array.from(v, x => enc(x, d + 1)); }
    if (v instanceof Set || v instanceof Map) return undefined;
    const o = {}; for (const k in v) { if (k[0] === '_' && k !== '_nid') continue; const e = enc(v[k], d + 1); if (e !== undefined) o[k] = e; } return o;
  }
  function dec(v) {
    if (v == null || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map(dec);
    if ('$u' in v) return unitOf(v.$u); if ('$d' in v) return DEFR.get(v.$d) || null;
    const o = {}; for (const k in v) o[k] = dec(v[k]); return o;
  }

  /* ---------- arranque (sala de espera común) ---------- */
  NetPlay.onStart(o => { o.seats.forEach((s, i) => { if (s && /^#[0-9a-f]{6}$/i.test(s.color)) { const n = parseInt(s.color.slice(1), 16), dk = '#' + [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => Math.round(v * 0.55).toString(16).padStart(2, '0')).join(''); PLAYER_COLORS[i] = { main: s.color, dark: dk, name: s.name }; } }); });
  const MODES_NET = ['duel', 'altar', 'hunt', 'tejo'];
  NetPlay.gate({
    me(li) { const c = Game.cfg.chars[li] || CHAR_ORDER[li % CHAR_ORDER.length]; let skin = 0; try { skin = Vestidor.V.eq(li, 'skin', c); } catch (e) { /* nada */ } return { cid: c, skin }; },
    make(want, ev) {
      const S = NetPlay.seats, n = S.length; let mode = MODES_NET.includes(ev.mode) ? ev.mode : 'duel'; if (mode === 'tejo' && n !== 2) mode = 'duel';
      const arena = ARENAS[ev.map] ? ev.map : ARENA_ORDER[Math.floor(Math.random() * ARENA_ORDER.length)];
      const chars = S.map((s, i) => { const w = want[i] || {}; return CHARS[w.cid] ? w.cid : CHAR_ORDER[i % CHAR_ORDER.length]; });
      const skins = S.map((s, i) => { const k = (want[i] || {}).skin; return typeof k === 'number' && k >= 0 && k < 9 ? k : NetPlay.okId(k) || 0; });
      return { mode, arena, chars, skins, wins: Math.max(1, Math.min(5, ev.len || ev.rounds || 2)) };
    },
    apply(c) { reset(); UI.netStart(c); },
  });
  function again() { NetPlay.again(c => Object.assign({}, c)); }

  /* ---------- terreno ---------- */
  const SY = Terrain.SYNC, INT = new Set(['base', 'fireO', 'vineO', 'elecO', 'pitO', 'crys']);
  let shadow = null, tdAcc = 0, lastSimT = 0, kfSeed = null, tdN = 0, tdLast = 0, kfAsk = 0, kfMiss = 0, kfSent = 0;
  function copyT(T) { const S = { n: T.n, cols: T.cols, bridgeUnder: T.bridgeUnder, ver: 0 }; for (const f of SY) S[f] = T[f].slice(); return S; }
  function keyframe(G) {
    const T = G.T, cells = {}; for (const f of SY) { if (f === 'base') continue; const a = []; for (let i = 0; i < T.n; i++) if (T[f][i]) a.push(i, INT.has(f) ? T[f][i] : r2(T[f][i])); if (a.length) cells[f] = a; }
    shadow = copyT(T); lastSimT = G.time; kfSeed = G.seed; tdN = 0; kfSent = performance.now();
    NetPlay.send({ t: 'kf', seed: G.seed, round: G.round, arena: G.arenaId, base: Array.from(T.base), cells, sources: G.sources.map(s => [r2(s.x), r2(s.y), s.el, r2(s.cd)]) }, true, '*');
  }
  // cada 100 ms: lo que cambió de verdad respecto a lo que el remoto ya tiene (su copia «se gasta» igual que la del anfitrión)
  function terrainDiff(G) {
    const T = G.T; if (!shadow || shadow.n !== T.n) return;
    Terrain.decay(shadow, Math.max(0, G.time - lastSimT), G.rain); lastSimT = G.time;
    const out = [];
    for (let i = 0; i < T.n; i++) {
      let mask = 0; const vals = [];
      for (let k = 0; k < SY.length; k++) { const f = SY[k], a = T[f][i], b = shadow[f][i]; if (INT.has(f) ? a !== b : Math.abs(a - b) > (f === 'wall' ? 0.5 : 0.2) || (a === 0) !== (b === 0)) { mask |= 1 << k; vals.push(INT.has(f) ? a : r2(a)); shadow[f][i] = a; } }
      if (mask) out.push(i, mask, ...vals);
    }
    if (out.length) NetPlay.send({ t: 'td', seed: G.seed, q: ++tdN, d: out }, true, '*');
  }
  function applyKf(d) {
    const G = Game.G; if (G.round !== d.round || G.seed !== d.seed) Game.netNewRound(d.round, d.seed);
    const T = G.T; if (!T || d.base.length !== T.n) return;
    for (const f of SY) T[f].fill(f === 'fireO' || f === 'pitO' ? -1 : 0);
    T.base.set(d.base); for (const f in d.cells) { const a = d.cells[f]; if (!T[f]) continue; for (let q = 0; q < a.length; q += 2) T[f][a[q]] = a[q + 1]; }
    if (Array.isArray(d.sources)) G.sources = d.sources.map(([x, y, el, cd]) => ({ x, y, el, cd, glow: 0 }));
    T.ver++; kfSeed = d.seed; tdLast = 0; kfMiss = 0; uMap.clear();
  }
  // si se perdió el terreno (llegó tarde a la ronda, o un cambio no llegó por el relevo), se pide uno completo
  function askKf() { const now = performance.now(); if (now - kfAsk < 2000) return; kfAsk = now; NetPlay.send({ t: 'kfreq' }, true, 'host'); }
  function applyTd(d) {
    const G = Game.G, T = G.T; if (!T || d.seed !== kfSeed) return; const a = d.d;
    if (typeof d.q === 'number') { if (d.q !== tdLast + 1) askKf(); tdLast = d.q; }
    for (let q = 0; q < a.length;) { const i = a[q++], mask = a[q++]; for (let k = 0; k < SY.length; k++) if (mask & (1 << k)) T[SY[k]][i] = a[q++]; }
    T.ver++;
  }

  /* ---------- instantánea (anfitrión) ---------- */
  const GF = ['countT', 'introT', 'introMax', 'roundT', 'winsNeeded', 'wins', 'score', 'respawn', 'presage', 'mist', 'rain', 'current', 'wind', 'dry', 'embMul', 'eclipse', 'ring', 'altar', 'goals', 'tejoWait', 'huntWait', 'huntN', 'runeT', 'runes', 'statues', 'banner', 'ev', 'mistWarned', 'roundWinner', 'roundWhy', 'granFx', 'koCam'];
  const MF = ['x', 'y', 'vx', 'vy', 'face', 'hp', 'maxHp', 'alive', 'emb', 'embFlash', 'flash', 'walk', 'moving', 'castT', 'castHand', 'castEl', 'fuse', 'granCharge', 'granGlow', 'granEls', 'absorbing', 'racha', 'rachaT', 'iframes', 'hitT', 'impulse', 'lockOn', 'pin', 'hands', 'st', 'buff', 'dash', 'skin', 'stillT', 'invuln', 'lock', 'kt', 'dmgMul'];
  let sentSeed = null;
  function snap() {
    const G = Game.G; if (!on() || !G.T || G.attract || !NetPlay.cfg) return null;
    if (G.seed !== sentSeed) { sentSeed = G.seed; keyframe(G); }
    tdAcc += 1; if (tdAcc >= 3) { tdAcc = 0; terrainDiff(G); }
    // efectos y letreros que armó la lógica (no un evento): viajan como eventos
    for (const f of G.fx) if (!f._s) { f._s = 1; NetPlay.event({ type: '$fx', j: JSON.stringify(enc(f)) }); }
    for (const p of G.pops) if (!p._s) { p._s = 1; NetPlay.event({ type: '$pop', j: JSON.stringify(enc(p)) }); }
    const g = {}; for (const k of GF) { const v = enc(G[k]); if (v !== undefined && v !== null) g[k] = v; }
    return {
      seed: G.seed, round: G.round, st: ST.indexOf(G.state), t: r2(G.time), g,
      m: G.mages.map(m => { const o = {}; for (const k of MF) { const v = enc(m[k]); if (v !== undefined && v !== null && v !== 0 && v !== false) o[k] = v; } return o; }),
      u: G.units.filter(u => !u.isMage).map(u => { const o = enc(u); o.$c = codeOf(u); if (u instanceof Creature) o.$k = u.kind; return o; }),
      s: G.spells.map(s => enc(s)),
      so: G.sources.map(s => [r2(s.cd), r2(s.glow)]),
    };
  }

  /* ---------- aplicar (remoto) ---------- */
  const lerp = (a, b, k) => a + (b - a) * k;
  const lerpA = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return a + d * k; };
  const ZERO = { emb: 0, embFlash: 0, flash: 0, walk: 0, moving: 0, castT: 0, castHand: 0, fuse: false, granCharge: 0, granGlow: 0, racha: 0, iframes: 0, hitT: 0, impulse: 0, alive: false, stillT: 0, invuln: false, kt: 0, absorbing: null, lockOn: null, pin: null, castEl: null };
  function setDeep(dst, src) { for (const k in src) { const v = src[k]; if (v && typeof v === 'object' && !Array.isArray(v) && dst[k] && typeof dst[k] === 'object' && !Array.isArray(dst[k]) && !(dst[k] instanceof Unit)) setDeep(dst[k], v); else dst[k] = v; } }
  function apply(A, B, k) {
    const G = Game.G; if (!A || !B || B.seed !== kfSeed || G.seed !== B.seed) return;
    G.state = ST[B.st] || 'play';
    const g = dec(B.g); for (const key of GF) G[key] = key in g ? g[key] : key === 'wins' || key === 'score' || key === 'respawn' ? G[key] : null;
    if (!G.wins) G.wins = G.mages.map(() => 0); if (!G.score) G.score = G.mages.map(() => 0); if (!G.respawn) G.respawn = G.mages.map(() => 0);
    if (G.banner && typeof G.banner.t !== 'number') G.banner.t = 0;
    // criaturas y objetos (torretas, señuelos, el tejo): se crean la primera vez que llegan
    const seen = new Set();
    G.units = G.mages.slice();
    for (const o of B.u) {
      const c = o.$c; seen.add(c); let u = uMap.get(c);
      if (!u) { u = o.$k && CREATURES[o.$k] ? Object.create(Creature.prototype) : Object.create(Unit.prototype); u.st = {}; if (o.$k) { u.D = CREATURES[o.$k]; u.kind = o.$k; } uMap.set(c, u); }
      const a = A.u.find(x => x.$c === c), dd = dec(o); delete dd.$c; delete dd.$k; setDeep(u, dd);
      if (a && Math.abs(a.x - o.x) < 300) { u.x = lerp(a.x, o.x, k); u.y = lerp(a.y, o.y, k); }
      G.units.push(u);
    }
    for (const c of [...uMap.keys()]) if (!seen.has(c)) uMap.delete(c);
    // magos
    G.mages.forEach((m, i) => {
      const a = A.m[i], b = B.m[i]; if (!a || !b) return;
      const d = dec(b); for (const key in ZERO) if (!(key in d)) m[key] = ZERO[key];
      for (const key of ['st', 'buff', 'dash']) if (d[key] && m[key]) { for (const kk in m[key]) if (typeof m[key][kk] === 'number' && !(kk in d[key])) m[key][kk] = 0; }
      if (d.hands) { d.hands.forEach((h, j) => { if (m.hands[j]) Object.assign(m.hands[j], h); }); delete d.hands; }
      setDeep(m, d);
      const near = Math.abs((a.x || 0) - (b.x || 0)) < 260 && Math.abs((a.y || 0) - (b.y || 0)) < 260;
      if (near) { m.x = lerp(a.x || 0, b.x || 0, k); m.y = lerp(a.y || 0, b.y || 0, k); m.face = lerpA(a.face || 0, b.face || 0, k); }
      if (!('alive' in b)) m.alive = false;
    });
    // hechizos: los de B; los que ya venían en A, a mitad de camino
    G.spells = B.s.map(o => { const s = dec(o), a = A.s.find(x => x.id === o.id); if (a && typeof a.x === 'number' && typeof s.x === 'number' && Math.abs(a.x - s.x) < 400) { s.x = lerp(a.x, s.x, k); s.y = lerp(a.y, s.y, k); } return s; });
    B.so.forEach((v, i) => { if (G.sources[i]) { G.sources[i].cd = v[0]; G.sources[i].glow = v[1]; } });
  }

  /* ---------- predicción del mago propio (remoto) ----------
     Caminar y esquivar responden YA: una copia del mago de este aparato se mueve aquí con sus teclas (la misma cuenta
     de velocidad, suelo —hielo, agua, barro, enredaderas—, estados y paredes que usa el juego) y es la que se ve. Al llegar
     una instantánea se compara con lo que se predijo para ese momento (hace «un ping») y se corrige de a poquito; si
     pasó algo grande (lo empujaron lejos, cayó, reapareció) se toma lo del anfitrión. Hechizos, vida y daño: del anfitrión. */
  const PDT = 1 / 120, ghosts = {}, PST = { hard: 0, soft: 0, err: 0 };
  function ghostOf(m) {
    let g = ghosts[m.idx]; if (g && g.m === m) return g;
    PST.made = (PST.made || 0) + 1;
    return (ghosts[m.idx] = { m, x: m.x, y: m.y, vx: m.vx || 0, vy: m.vy || 0, face: m.face || 0, r: m.r, dash: { t: 0, dx: 0, dy: 0 }, prevDash: false, hist: [], lastN: 0, acc: 0, walk: m.walk || 0 });
  }
  // la misma cuenta de moverse de Mage.update (sin daño, sin hechizos, sin tocar el terreno)
  function moveGhost(g, m, inp, G, dt) {
    const T = G.T, st = m.st || {}, bf = m.buff || {}, tr = m.tr || {}, C = m.C || { speed: 1 };
    const locked = G.state !== 'play' || !!m.busy || (st.stun || 0) > 0 || (st.frozen || 0) > 0 || (m.granCharge || 0) > 0;
    const ci = Terrain.idx(T, g.x, g.y);
    let spd = 230 * C.speed * ((bf.haste || 0) > 0 ? 1.15 : 1), acc = 22, noDash = false;
    if (ci >= 0) {
      const b = T.base[ci];
      if (T.ice[ci] > 0) acc = tr.iceWalk ? 22 : 2.4;
      else if (b === TT.DEEP && T.ice[ci] <= 0) { spd *= tr.waterSpeed ? 1.0 : 0.56; noDash = true; }
      else if (b === TT.SHALLOW && T.ice[ci] <= 0) spd *= tr.waterSpeed || 0.86;
      if (T.mud[ci] > 0) { spd *= tr.waterSpeed ? 0.8 : 0.45; noDash = true; }
      if (T.vine[ci] > 0 && T.vineO[ci] !== m.idx && !(G.ally && G.ally(T.vineO[ci], m))) spd *= 0.5;
    }
    let mx = locked ? 0 : inp.mx || 0, my = locked ? 0 : inp.my || 0; const ml = Math.hypot(mx, my);
    const charging = !!(m.fuse || m.holding || (m.castT || 0) > 0);
    if (!locked && !charging && ml > 0.2) g.face += clamp(angDiff(g.face, Math.atan2(my, mx)), -26 * dt, 26 * dt); else g.face = m.face || 0;
    if ((st.root || 0) > 0) { mx = 0; my = 0; }
    if (m.fuse) spd *= 0.6; else if (m.holding) spd *= 0.72;
    if ((st.chill || 0) > 0 && !tr.iceWalk) spd *= 0.6;
    if ((st.slow || 0) > 0) spd *= st.slowF || 1;
    if (g.dash.t > 0) { g.dash.t -= dt; const ds = 920 * (noDash ? 0.5 : 1); g.vx = g.dash.dx * ds; g.vy = g.dash.dy * ds; }
    else { const k = 1 - Math.exp(-(ml < 0.2 && acc > 10 ? 30 : acc) * dt), kk = (m.kt || 0) > 0 ? k * 0.25 : k; g.vx += (mx * spd - g.vx) * kk; g.vy += (my * spd - g.vy) * kk; }
    if (G.wind && ci >= 0 && T.base[ci] !== TT.ROCK) { g.vx += G.wind.x * 40 * dt; g.vy += G.wind.y * 40 * dt; }
    if (G.current && ci >= 0 && T.base[ci] === TT.DEEP && T.ice[ci] <= 0) { g.vx += G.current.x * dt * 3; g.vy += G.current.y * dt * 3; }
    g.x += g.vx * dt; g.y += g.vy * dt;
    Unit.prototype.collide.call(g, T);
    g.walk += Math.hypot(g.vx, g.vy) * dt * 0.045;
    // esquivar: sale ya (el anfitrión hace lo mismo cuando le llega la tecla)
    const dashP = inp.dash && !g.prevDash; g.prevDash = !!inp.dash;
    const D = m.dash || {};
    if (dashP && !locked && (D.charges || 0) > 0 && (D.gap || 0) <= 0 && (st.root || 0) <= 0 && !noDash && g.dash.t <= 0 && (D.t || 0) <= 0) {
      const dx = ml > 0.2 ? mx / ml : Math.cos(g.face), dy = ml > 0.2 ? my / ml : Math.sin(g.face); g.dash = { t: 0.17, dx, dy }; g.dashAt = performance.now();
    }
  }
  function histAt(H, t) {
    if (!H.length) return null; if (t < H[0].t) return t > H[0].t - 250 ? H[0] : null; // un poco antes del comienzo: el primero
    for (let i = H.length - 1; i >= 0; i--) if (H[i].t <= t) { const a = H[i], b = H[i + 1]; if (!b) return a; const k = (t - a.t) / Math.max(1e-6, b.t - a.t); return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), vx: lerp(a.vx, b.vx, k), vy: lerp(a.vy, b.vy, k) }; }
    return null;
  }
  function reconcile(g, c, tAt) {
    const sx = c.x || 0, sy = c.y || 0, svx = c.vx || 0, svy = c.vy || 0;
    const hardSet = () => { g.x = sx; g.y = sy; g.vx = svx; g.vy = svy; g.dash.t = 0; g.hist = [{ t: tAt, x: sx, y: sy, vx: svx, vy: svy }]; }; // la historia arranca en ese instante
    if (!c.alive || (c.granCharge || 0) > 0) { hardSet(); return; }
    // el anfitrión empezó a esquivar (y aquí no): se toma su esquive
    if (c.dash && c.dash.t > 0 && g.dash.t <= 0 && !(g.dashAt && performance.now() - g.dashAt < 400)) { g.dash = { t: c.dash.t, dx: c.dash.dx || 0, dy: c.dash.dy || 0 }; }
    const h = histAt(g.hist, tAt); if (!h) { hardSet(); PST.hard++; return; }
    const ex = sx - h.x, ey = sy - h.y, evx = svx - h.vx, evy = svy - h.vy; PST.soft++; PST.err = PST.err * 0.95 + Math.hypot(ex, ey) * 0.05;
    if (Math.hypot(ex, ey) > 140) { hardSet(); PST.hard++; return; }
    const k = 0.3; g.x += ex * k; g.y += ey * k; g.vx += evx * k; g.vy += evy * k;
    for (const q of g.hist) { q.x += ex * k; q.y += ey * k; q.vx += evx * k; q.vy += evy * k; }
  }
  // cuadros muy lentos (el juego frena su reloj a 0,1 s por cuadro): la copia sigue el tiempo real para no quedarse atrás
  const realDt = (g, dt) => { const now = performance.now(), real = g.lastT ? (now - g.lastT) / 1000 : dt; g.lastT = now; return real > 0.1 ? Math.min(0.25, real) : dt; };
  function predict(G, dt) {
    const Lt = NetPlay.latest(), D = Lt && Lt.d; if (!D || !D.m || !G.T || D.seed !== kfSeed) return; const now = performance.now();
    for (const seat of NetPlay.mine) {
      const m = G.mages[seat], c = D.m[seat]; if (!m || !c) continue;
      const g = ghostOf(m);
      if (Lt.n !== g.lastN) { g.lastN = Lt.n; reconcile(g, dec(c), Lt.arr - NetPlay.rtt - 12); }
      const inp = lastIn[NetPlay.mine.indexOf(seat)] || { mx: 0, my: 0, dash: false };
      g.acc += realDt(g, dt); let n = 0; while (g.acc >= PDT && n < 32) { moveGhost(g, m, inp, G, PDT); g.acc -= PDT; n++; } if (n >= 32) g.acc = 0;
      g.hist.push({ t: now, x: g.x, y: g.y, vx: g.vx, vy: g.vy }); while (g.hist.length > 2 && now - g.hist[0].t > 3000) g.hist.shift();
      if (!m.alive) continue;
      // se dibuja la copia: posición, rumbo y paso
      m.x = g.x; m.y = g.y; m.vx = g.vx; m.vy = g.vy; m.face = g.face; m.moving = Math.hypot(g.vx, g.vy); m.walk = g.walk;
      if (g.dash.t > 0 && m.dash) { m.dash.t = Math.max(m.dash.t || 0, g.dash.t); m.dash.dx = g.dash.dx; m.dash.dy = g.dash.dy; }
    }
  }

  /* ---------- un cuadro del remoto ---------- */
  let evQ = [], resQ = null, shownRes = false, prevState = null, kfQ = [], tdQ = [];
  function clientStep(dt) {
    const G = Game.G;
    while (kfQ.length) applyKf(kfQ.shift());
    if (tdQ.length) { for (const d of tdQ) applyTd(d); tdQ = []; }
    if (G.T) Terrain.decay(G.T, dt, G.rain);
    const S = NetPlay.sample(); if (S) apply(S.a, S.b, S.k);
    if (NetPlay.pred && dt > 0) predict(G, dt);
    if (S && S.b && S.b.seed !== kfSeed && !kfQ.length) { kfMiss += dt; if (kfMiss > 0.8) askKf(); } else kfMiss = 0;
    if (evQ.length) { const l = evQ; evQ = []; const evs = [];
      for (const e of l) {
        if (e.type === '$fx') { try { G.fx.push(dec(JSON.parse(e.j))); } catch (er) { /* nada */ } continue; }
        if (e.type === '$pop') { try { G.pops.push(Object.assign(dec(JSON.parse(e.j)), { t: 0 })); } catch (er) { /* nada */ } continue; }
        if (e.unit != null) e.unit = unitOf(e.unit); evs.push(e);
      }
      Game.clientEvents(evs); }
    if (G.state !== prevState) { if (G.state === 'count' || G.state === 'play') shownRes = false; prevState = G.state; }
    if (G.state === 'matchEnd' && resQ && !shownRes) { shownRes = true; const r = resQ; resQ = null; try { Progress.onMatchEnd(G, r); } catch (e) { /* nada */ } UI.netResults(r); }
  }
  NetPlay.onMsg(d => {
    // anfitrión: un remoto pide el terreno completo (a lo más uno por segundo; le llega a todos y todos quedan al día)
    if (NetPlay.isHost && d.t === 'kfreq') { const G = Game.G; if (G.T && !G.attract && shadow && performance.now() - kfSent > 1000) keyframe(G); return; }
    if (!NetPlay.isClient) return;
    if (d.t === 'kf') kfQ.push(d); else if (d.t === 'td') tdQ.push(d); else if (d.t === 'res' && d.r) resQ = d.r;
  });
  function reset() { for (const k in ghosts) delete ghosts[k]; shadow = null; sentSeed = null; kfSeed = null; tdN = 0; tdLast = 0; kfMiss = 0; uMap.clear(); evQ = []; kfQ = []; tdQ = []; resQ = null; shownRes = false; pinMine = []; }

  return {
    seatsMax: 4, again, snap, apply, clientStep, readLocal, pinFrom, get pst() { return PST; },
    neutral: () => NEUTRAL,
    // anfitrión: cada evento viaja (la unidad como número)
    fwd(e) { const o = {}; for (const k in e) { const v = e[k], t = typeof v; if (t === 'number' || t === 'string' || t === 'boolean') o[k] = v; else if (k === 'unit' && v instanceof Unit) o.unit = codeOf(v); else if (Array.isArray(v) && v.length < 12 && v.every(x => typeof x !== 'object')) o[k] = v.slice(); } NetPlay.event(o); },
    event(e) { evQ.push(e); if (evQ.length > 500) evQ.splice(0, evQ.length - 500); },
    results(r) { NetPlay.send({ t: 'res', r }, true, '*'); },
  };
})();
