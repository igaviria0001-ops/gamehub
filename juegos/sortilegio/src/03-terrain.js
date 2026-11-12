/* =========================================================================
   TERRENO — cuadrícula de celdas de 40 px con su tipo y sus estados.
   Tipos fijos: hierba, tierra, piedra, agua honda, lava, abismo, roca,
   tierra fértil, agua baja, puente, frailejón (mata que tapa y arde).
   Estados que cambian: fuego, ceniza, charco, hielo, enredadera (con dueño),
   barro, lava de magma, muro de piedra (vida y tiempo), electricidad,
   lava enfriada. Terrain.update hace correr el fuego y los tiempos.
   ========================================================================= */
const CELL = 40;
const TT = { GRASS: 0, DIRT: 1, STONE: 2, DEEP: 3, LAVA: 4, CHASM: 5, ROCK: 6, FERTILE: 7, SHALLOW: 8, BRIDGE: 9, BUSH: 10 };
const Terrain = (() => {
  function make(W, H) {
    const cols = Math.ceil(W / CELL), rows = Math.ceil(H / CELL), n = cols * rows, F = () => new Float32Array(n);
    return { W, H, cols, rows, n, base: new Uint8Array(n), fire: F(), fireO: new Int8Array(n).fill(-1), ash: F(), wet: F(), ice: F(), vine: F(), vineO: new Int8Array(n), mud: F(), lava: F(), wall: F(), wallT: F(), elec: F(), elecO: new Int8Array(n), cool: F(), pit: F(), pitO: new Int8Array(n).fill(-1), crys: new Uint8Array(n), tick: 0, burning: 0, ver: 0 };
  }
  const idx = (T, x, y) => { const c = Math.floor(x / CELL), r = Math.floor(y / CELL); return c < 0 || r < 0 || c >= T.cols || r >= T.rows ? -1 : r * T.cols + c; };
  const cx = (T, i) => (i % T.cols) * CELL + CELL / 2, cy = (T, i) => Math.floor(i / T.cols) * CELL + CELL / 2;
  const isWater = (T, i) => (T.base[i] === TT.DEEP || T.base[i] === TT.SHALLOW) && T.ice[i] <= 0;
  const isLava = (T, i) => (T.base[i] === TT.LAVA && T.cool[i] <= 0) || T.lava[i] > 0;
  // ¿tapa el paso y los proyectiles?
  const solid = (T, i) => i < 0 || T.base[i] === TT.ROCK || T.base[i] === TT.BUSH || T.wall[i] > 0;
  const solidAt = (T, x, y) => solid(T, idx(T, x, y));
  const burnable = (T, i) => T.fire[i] <= 0 && T.wet[i] <= 0 && T.ice[i] <= 0 && ((T.base[i] === TT.GRASS && T.ash[i] <= 0) || T.base[i] === TT.BUSH || (T.base[i] === TT.BRIDGE && !T.noBurnBridge) || T.vine[i] > 0);
  function forCircle(T, x, y, r, fn) {
    const c0 = Math.max(0, Math.floor((x - r) / CELL)), c1 = Math.min(T.cols - 1, Math.floor((x + r) / CELL));
    const r0 = Math.max(0, Math.floor((y - r) / CELL)), r1 = Math.min(T.rows - 1, Math.floor((y + r) / CELL));
    for (let rr = r0; rr <= r1; rr++) for (let cc = c0; cc <= c1; cc++) {
      const px = cc * CELL + CELL / 2, py = rr * CELL + CELL / 2;
      if (dist2(px, py, x, y) <= (r + CELL * 0.35) * (r + CELL * 0.35)) fn(rr * T.cols + cc, px, py);
    }
  }
  function forLine(T, x0, y0, x1, y1, fn) {
    const L = hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(L / (CELL * 0.5))); let last = -2;
    for (let k = 0; k <= n; k++) { const t = k / n, i = idx(T, lerp(x0, x1, t), lerp(y0, y1, t)); if (i >= 0 && i !== last) { last = i; if (fn(i, k / n) === false) return; } }
  }
  /* ---------- cambios ---------- */
  function ignite(G, i, t = 2.6, owner = -1) {
    const T = G.T; if (i < 0) return false;
    if (T.wet[i] > 0) { T.wet[i] = Math.max(0, T.wet[i] - 3); G.fx.push({ type: 'steam', x: cx(T, i), y: cy(T, i), r: 26 }); return false; }
    if (T.ice[i] > 0) { T.ice[i] = 0; T.wet[i] = 6; G.fx.push({ type: 'steam', x: cx(T, i), y: cy(T, i), r: 26 }); T.ver++; return false; }
    if (!burnable(T, i)) return false;
    T.fire[i] = T.base[i] === TT.BUSH ? 4.2 : T.base[i] === TT.BRIDGE ? 5 : T.vine[i] > 0 ? 1.8 : Math.min(t, 2.2); T.fireO[i] = owner; T.burning++; return true;
  }
  function wet(G, i, t = 9) {
    const T = G.T; if (i < 0) return;
    if (T.fire[i] > 0) { T.fire[i] = 0; G.fx.push({ type: 'steam', x: cx(T, i), y: cy(T, i), r: 30 }); }
    if (isLava(T, i)) { cool(G, i); return; }
    if (T.base[i] === TT.ROCK || T.base[i] === TT.CHASM) return;
    T.wet[i] = Math.max(T.wet[i], t);
  }
  function cool(G, i) {
    const T = G.T; if (T.lava[i] > 0) T.lava[i] = 0; else T.cool[i] = 9;
    G.fx.push({ type: 'steam', x: cx(T, i), y: cy(T, i), r: 34 }); G.events.push({ type: 'cool', x: cx(T, i), y: cy(T, i) }); T.ver++;
  }
  function freeze(G, i, t = 8) {
    const T = G.T; if (i < 0) return;
    if (T.fire[i] > 0) { T.fire[i] = 0; return; }
    if (isLava(T, i)) { cool(G, i); return; }
    if (T.base[i] === TT.DEEP || T.base[i] === TT.SHALLOW || T.wet[i] > 0) { T.ice[i] = Math.max(T.ice[i], T.base[i] === TT.DEEP ? t + 2 : t); T.elec[i] = 0; T.ver++; }
  }
  // corriente por el agua conectada (charcos, agua baja y honda)
  function electrify(G, i0, owner, t = 1.3, max = 70) {
    const T = G.T; if (i0 < 0 || !(isWater(T, i0) || T.wet[i0] > 0)) return 0;
    const seen = new Set([i0]), q = [i0]; let n = 0;
    while (q.length && n < max) {
      const i = q.shift(); n++; T.elec[i] = t; T.elecO[i] = owner;
      const c = i % T.cols, r = (i / T.cols) | 0;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const c2 = c + dc, r2 = r + dr; if (c2 < 0 || r2 < 0 || c2 >= T.cols || r2 >= T.rows) continue;
        const j = r2 * T.cols + c2; if (seen.has(j)) continue; seen.add(j);
        if (isWater(T, j) || T.wet[j] > 0) q.push(j);
      }
    }
    G.events.push({ type: 'electrify', x: cx(T, i0), y: cy(T, i0), n });
    return n;
  }
  function addWall(G, i, hp, t) {
    const T = G.T; if (i < 0 || T.base[i] === TT.ROCK || T.base[i] === TT.BUSH || T.base[i] === TT.CHASM || T.base[i] === TT.DEEP && T.ice[i] <= 0) return false;
    T.wall[i] = hp; T.wallT[i] = t; T.fire[i] = 0; T.vine[i] = 0; T.crys[i] = 0; T.ver++; return true;
  }
  function hitWall(G, i, dmg) {
    const T = G.T; if (i < 0 || T.wall[i] <= 0) return false;
    T.wall[i] -= dmg; if (T.wall[i] <= 0) { T.wall[i] = 0; T.wallT[i] = 0; G.fx.push({ type: 'rubble', x: cx(T, i), y: cy(T, i) }); G.events.push({ type: 'wallBreak', x: cx(T, i), y: cy(T, i) }); T.ver++; }
    else G.fx.push({ type: 'chips', x: cx(T, i), y: cy(T, i) });
    return true;
  }
  // un mago de pie aquí: qué le hace el suelo
  function under(T, x, y) {
    const i = idx(T, x, y); if (i < 0) return null; return i;
  }
  /* ---------- paso de tiempo ---------- */
  const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function update(G, dt) {
    const T = G.T, n = T.n; T.tick += dt; let spread = false;
    if (T.tick >= 0.1) { T.tick -= 0.1; spread = true; }
    let burning = 0;
    for (let i = 0; i < n; i++) {
      if (T.fire[i] > 0) {
        burning++;
        T.fire[i] -= dt;
        if (T.fire[i] <= 0) {
          T.fire[i] = 0;
          if (T.base[i] === TT.BUSH) { T.base[i] = TT.DIRT; T.ash[i] = 999; T.ver++; G.events.push({ type: 'bushGone', x: cx(T, i), y: cy(T, i) }); }
          else if (T.base[i] === TT.BRIDGE) { T.base[i] = T.bridgeUnder || TT.DEEP; T.ver++; G.events.push({ type: 'bridgeGone', x: cx(T, i), y: cy(T, i) }); }
          else if (T.vine[i] > 0) T.vine[i] = 0;
          else T.ash[i] = 22;
        } else if (spread) {
          const c = i % T.cols, r = (i / T.cols) | 0, wx = G.wind ? G.wind.x : 0, wy = G.wind ? G.wind.y : 0;
          for (const [dc, dr] of N4) {
            const c2 = c + dc, r2 = r + dr; if (c2 < 0 || r2 < 0 || c2 >= T.cols || r2 >= T.rows) continue;
            const j = r2 * T.cols + c2; if (!burnable(T, j)) continue;
            const p = (T.base[j] === TT.BUSH ? 0.022 : T.vine[j] > 0 ? 0.3 : T.base[j] === TT.BRIDGE ? 0.05 : 0.012) * (G.dry || 1) * (1 + 1.2 * (dc * wx + dr * wy));
            if (G.rng() < p) ignite(G, j, 2.6, T.fireO[i]);
          }
        }
      }
      if (T.ash[i] > 0 && T.ash[i] < 900) { T.ash[i] -= dt; if (T.ash[i] < 0) T.ash[i] = 0; }
      if (T.wet[i] > 0) { T.wet[i] -= dt * (G.rain ? 0.2 : 1); if (T.wet[i] < 0) T.wet[i] = 0; }
      if (T.ice[i] > 0) { T.ice[i] -= dt; if (T.ice[i] <= 0) { T.ice[i] = 0; if (T.base[i] !== TT.DEEP && T.base[i] !== TT.SHALLOW) T.wet[i] = 4; T.ver++; } }
      if (T.vine[i] > 0) { T.vine[i] -= dt; if (T.vine[i] < 0) T.vine[i] = 0; }
      if (T.mud[i] > 0) { T.mud[i] -= dt; if (T.mud[i] < 0) T.mud[i] = 0; }
      if (T.lava[i] > 0) { T.lava[i] -= dt; if (T.lava[i] <= 0) { T.lava[i] = 0; T.ver++; } }
      if (T.cool[i] > 0) { T.cool[i] -= dt; if (T.cool[i] <= 0) { T.cool[i] = 0; T.ver++; } }
      if (T.elec[i] > 0) { T.elec[i] -= dt; if (T.elec[i] < 0) T.elec[i] = 0; }
      if (T.pit[i] > 0) { T.pit[i] -= dt; if (T.pit[i] < 0) T.pit[i] = 0; }
      if (T.wallT[i] > 0) { T.wallT[i] -= dt; if (T.wallT[i] <= 0) { T.wallT[i] = 0; if (T.wall[i] > 0) { T.wall[i] = 0; G.fx.push({ type: 'rubble', x: cx(T, i), y: cy(T, i), soft: 1 }); T.ver++; } } }
    }
    T.burning = burning;
  }
  return { make, idx, cx, cy, solid, solidAt, isWater, isLava, burnable, forCircle, forLine, ignite, wet, cool, freeze, electrify, addWall, hitWall, under, update };
})();
