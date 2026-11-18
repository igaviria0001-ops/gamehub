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
  function readLocal(li) { const i = _read(li); const o = { mx: r2(i.mx), my: r2(i.my), h: [!!i.h[0], !!i.h[1]], dash: !!i.dash }; if (pinMine[li]) o.pn = pinMine[li]; return o; }
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
  let shadow = null, tdAcc = 0, lastSimT = 0, kfSeed = null;
  function copyT(T) { const S = { n: T.n, cols: T.cols, bridgeUnder: T.bridgeUnder, ver: 0 }; for (const f of SY) S[f] = T[f].slice(); return S; }
  function keyframe(G) {
    const T = G.T, cells = {}; for (const f of SY) { if (f === 'base') continue; const a = []; for (let i = 0; i < T.n; i++) if (T[f][i]) a.push(i, INT.has(f) ? T[f][i] : r2(T[f][i])); if (a.length) cells[f] = a; }
    shadow = copyT(T); lastSimT = G.time; kfSeed = G.seed;
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
    if (out.length) NetPlay.send({ t: 'td', seed: G.seed, d: out }, true, '*');
  }
  function applyKf(d) {
    const G = Game.G; if (G.round !== d.round || G.seed !== d.seed) Game.netNewRound(d.round, d.seed);
    const T = G.T; if (!T || d.base.length !== T.n) return;
    for (const f of SY) T[f].fill(f === 'fireO' || f === 'pitO' ? -1 : 0);
    T.base.set(d.base); for (const f in d.cells) { const a = d.cells[f]; if (!T[f]) continue; for (let q = 0; q < a.length; q += 2) T[f][a[q]] = a[q + 1]; }
    if (Array.isArray(d.sources)) G.sources = d.sources.map(([x, y, el, cd]) => ({ x, y, el, cd, glow: 0 }));
    T.ver++; kfSeed = d.seed; uMap.clear();
  }
  function applyTd(d) {
    const G = Game.G, T = G.T; if (!T || d.seed !== kfSeed) return; const a = d.d;
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

  /* ---------- un cuadro del remoto ---------- */
  let evQ = [], resQ = null, shownRes = false, prevState = null, kfQ = [], tdQ = [];
  function clientStep(dt) {
    const G = Game.G;
    while (kfQ.length) applyKf(kfQ.shift());
    if (tdQ.length) { for (const d of tdQ) applyTd(d); tdQ = []; }
    if (G.T) Terrain.decay(G.T, dt, G.rain);
    const S = NetPlay.sample(); if (S) apply(S.a, S.b, S.k);
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
    if (!NetPlay.isClient) return;
    if (d.t === 'kf') kfQ.push(d); else if (d.t === 'td') tdQ.push(d); else if (d.t === 'res' && d.r) resQ = d.r;
  });
  function reset() { shadow = null; sentSeed = null; kfSeed = null; uMap.clear(); evQ = []; kfQ = []; tdQ = []; resQ = null; shownRes = false; pinMine = []; }

  return {
    seatsMax: 4, again, snap, apply, clientStep, readLocal, pinFrom,
    neutral: () => NEUTRAL,
    // anfitrión: cada evento viaja (la unidad como número)
    fwd(e) { const o = {}; for (const k in e) { const v = e[k], t = typeof v; if (t === 'number' || t === 'string' || t === 'boolean') o[k] = v; else if (k === 'unit' && v instanceof Unit) o.unit = codeOf(v); else if (Array.isArray(v) && v.length < 12 && v.every(x => typeof x !== 'object')) o[k] = v.slice(); } NetPlay.event(o); },
    event(e) { evQ.push(e); if (evQ.length > 500) evQ.splice(0, evQ.length - 500); },
    results(r) { NetPlay.send({ t: 'res', r }, true, '*'); },
  };
})();
