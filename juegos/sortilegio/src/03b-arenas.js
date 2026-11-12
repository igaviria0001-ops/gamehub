/* =========================================================================
   ESCENARIOS — cómo se pinta la cuadrícula de cada uno, sus fuentes de
   magia y dónde aparece cada mago. Son simétricos al girarlos media vuelta
   (lo de J1 y lo de J2 queda igual de lejos), para que nadie empiece mejor.
   ========================================================================= */
const ARENAS = {};
const ARENA_ORDER = ['paramo', 'rio', 'volcan', 'ciudad', 'cano'];
(() => {
  const P = (T, fn) => { for (let r = 0; r < T.rows; r++) for (let c = 0; c < T.cols; c++) { const v = fn(c * CELL + CELL / 2, r * CELL + CELL / 2, c, r); if (v != null) T.base[r * T.cols + c] = v; } };
  const sym = (T, list, type) => list.forEach(([x, y]) => { for (const [px, py] of [[x, y], [T.W - x, T.H - y]]) { const i = Terrain.idx(T, px, py); if (i >= 0) T.base[i] = type; } });
  const blob = (T, x, y, r, type) => { Terrain.forCircle(T, x, y, r, i => { T.base[i] = type; }); Terrain.forCircle(T, T.W - x, T.H - y, r, i => { T.base[i] = type; }); };
  const altar = (T, x, y, type = TT.STONE) => { Terrain.forCircle(T, x, y, 34, i => { T.base[i] = type; }); };
  const border = (T, wob = 0.9) => P(T, (x, y, c, r) => {
    const e = Math.min(c, r, T.cols - 1 - c, T.rows - 1 - r);
    if (e === 0) return TT.ROCK;
    if (e === 1 && noise2(c * 0.7 + r * 0.31, r * 0.7 - c * 0.17) > wob) return TT.ROCK;
    return null;
  });

  /* ---------- Páramo de Iguaque: laguna sagrada en el centro, pajonal y frailejones ---------- */
  ARENAS.paramo = {
    id: 'paramo', name: 'Páramo de Iguaque', sub: 'La laguna sagrada, entre frailejones', W: 1520, H: 880,
    spawns: [[250, 440], [1270, 440]],
    sources: [
      { x: 760, y: 128, el: 'water' }, { x: 760, y: 752, el: 'plant' },
      { x: 205, y: 180, el: 'earth' }, { x: 1315, y: 700, el: 'earth' },
      { x: 205, y: 700, el: 'wind' }, { x: 1315, y: 180, el: 'wind' },
    ],
    paint(T) {
      P(T, () => TT.GRASS);
      P(T, (x, y) => {
        const d = ((x - 760) / 296) ** 2 + ((y - 440) / 206) ** 2;
        if (d > 0.8 && d < 1.13) return TT.DIRT;
        if (Math.abs(y - 440) < 22 && (x < 480 || x > 1040)) return TT.DIRT;
        if (Math.abs(x - 760) < 22 && (y < 235 || y > 645)) return TT.DIRT;
        return null;
      });
      P(T, (x, y) => { const d = ((x - 760) / 178) ** 2 + ((y - 440) / 110) ** 2; return d < 1 ? TT.DEEP : d < 1.5 ? TT.SHALLOW : null; });
      for (const s of this.sources) altar(T, s.x, s.y);
      blob(T, 480, 215, 30, TT.ROCK); blob(T, 1020, 255, 20, TT.ROCK); blob(T, 405, 560, 18, TT.ROCK);
      sym(T, [[372, 320], [596, 745], [606, 122], [330, 770], [900, 110], [140, 410], [520, 440], [970, 745]], TT.BUSH);
      border(T);
    },
    theme: 'paramo', event: 'mist',
  };

  /* ---------- Río Magdalena: el río cruza por el medio, dos puentes de madera que arden ---------- */
  ARENAS.rio = {
    id: 'rio', name: 'Río Magdalena', sub: 'Selva, corriente y tormenta', W: 1520, H: 880,
    spawns: [[220, 440], [1300, 440]],
    sources: [
      { x: 545, y: 210, el: 'water' }, { x: 975, y: 670, el: 'water' },
      { x: 300, y: 720, el: 'plant' }, { x: 1220, y: 160, el: 'plant' },
      { x: 760, y: 440, el: 'bolt' },
    ],
    paint(T) {
      P(T, () => TT.GRASS);
      P(T, (x, y) => { const cx = 760 + Math.sin(y / 140) * 26, d = Math.abs(x - cx); return d < 70 ? TT.DEEP : d < 108 ? TT.SHALLOW : null; });
      P(T, (x, y) => (Math.abs(y - 225) < 30 || Math.abs(y - 655) < 30) && Math.abs(x - 760) < 120 ? TT.BRIDGE : null);
      Terrain.forCircle(T, 760, 440, 56, i => { T.base[i] = TT.STONE; });
      P(T, (x, y) => { if (Math.abs(y - 440) < 20 && (x < 560 || x > 960)) return TT.DIRT; if ((Math.abs(y - 225) < 20 && x < 640) || (Math.abs(y - 655) < 20 && x > 880)) return TT.DIRT; return null; });
      for (const s of this.sources) if (s.el !== 'bolt') altar(T, s.x, s.y);
      sym(T, [[120, 160], [160, 260], [420, 110], [470, 760], [130, 600], [600, 380], [360, 330], [250, 820], [630, 790], [560, 520]], TT.BUSH);
      blob(T, 420, 470, 18, TT.ROCK);
      border(T, 0.75);
    },
    theme: 'rio', event: 'storm', current: { x: 0, y: 150 },
  };
  /* ---------- Volcán Puracé: cráter de lava en el centro y dos ríos de lava ---------- */
  ARENAS.volcan = {
    id: 'volcan', name: 'Volcán Puracé', sub: 'Lava, azufre y erupciones', W: 1520, H: 880,
    spawns: [[230, 440], [1290, 440]],
    sources: [
      { x: 330, y: 250, el: 'fire' }, { x: 1190, y: 630, el: 'fire' },
      { x: 600, y: 760, el: 'earth' }, { x: 920, y: 120, el: 'earth' },
      { x: 250, y: 650, el: 'wind' }, { x: 1270, y: 230, el: 'wind' },
    ],
    paint(T) {
      P(T, (x, y) => (fbm2(x / 160, y / 160) > 0.62 ? TT.GRASS : TT.DIRT));
      P(T, (x, y) => { const d = ((x - 760) / 150) ** 2 + ((y - 440) / 100) ** 2; return d < 1 ? TT.LAVA : d < 1.7 ? TT.STONE : null; });
      P(T, (x, y) => { for (const [ax, ay, bx, by] of [[860, 380, 1120, 0], [660, 500, 400, 880]]) { const dx = bx - ax, dy = by - ay, t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy), 0, 1), d = hypot(x - ax - dx * t, y - ay - dy * t) + Math.sin(t * 9) * 6; if (d < 24 && t > 0.05) return TT.LAVA; } return null; });
      for (const s of this.sources) altar(T, s.x, s.y);
      blob(T, 520, 200, 26, TT.ROCK); blob(T, 470, 470, 20, TT.ROCK); blob(T, 640, 640, 18, TT.ROCK); blob(T, 130, 300, 22, TT.ROCK);
      border(T, 0.7);
    },
    theme: 'volcan', event: 'eruption',
  };
  /* ---------- Ciudad Perdida: terrazas circulares de piedra entre la selva ---------- */
  ARENAS.ciudad = {
    id: 'ciudad', name: 'Ciudad Perdida', sub: 'Terrazas de Teyuna y sus guardianes', W: 1520, H: 880,
    spawns: [[230, 440], [1290, 440]],
    sources: [
      { x: 760, y: 440, el: 'bolt' },
      { x: 470, y: 190, el: 'fire' }, { x: 1050, y: 690, el: 'fire' },
      { x: 400, y: 700, el: 'earth' }, { x: 1120, y: 180, el: 'earth' },
      { x: 150, y: 150, el: 'plant' }, { x: 1370, y: 730, el: 'plant' },
    ],
    statues: [[600, 120], [920, 760]],
    paint(T) {
      P(T, () => TT.GRASS);
      const ring = (cx, cy, r, gap) => { Terrain.forCircle(T, cx, cy, r, i => { T.base[i] = TT.STONE; }); };
      for (const [cx, cy, r] of [[760, 440, 150], [440, 230, 105], [440, 690, 90], [230, 440, 70]]) { ring(cx, cy, r); if (cx !== 760) ring(T.W - cx, T.H - cy, r); }
      // muros de contención con huecos (escaleras)
      const arc = (cx, cy, r, a0, a1) => { for (let a = a0; a < a1; a += 0.08) { const i = Terrain.idx(T, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.95); if (i >= 0) T.base[i] = TT.ROCK; } };
      for (const [cx, cy, r, a0, a1] of [[760, 440, 168, 0.5, 1.2], [760, 440, 168, 1.95, 2.65], [440, 230, 122, 2.2, 3.6]]) { arc(cx, cy, r, a0, a1); arc(T.W - cx, T.H - cy, r, a0, a1); arc(cx, cy, r, a0 + Math.PI, a1 + Math.PI); }
      P(T, (x, y) => (Math.abs(y - 440) < 18 && x > 280 && x < 620) || (Math.abs(y - 440) < 18 && x > 900 && x < 1240) ? TT.STONE : null);
      for (const s of this.sources) altar(T, s.x, s.y);
      sym(T, [[90, 300], [300, 90], [620, 90], [90, 600], [250, 820], [600, 560], [330, 330]], TT.BUSH);
      for (const [x, y] of this.statues) { const i = Terrain.idx(T, x, y); if (i >= 0) T.base[i] = TT.ROCK; }
      border(T, 0.8);
    },
    theme: 'ciudad', event: 'guardians',
  };
  /* ---------- Caño Cristales: el río de cinco colores cruza en diagonal; ollas hondas y lajas ---------- */
  ARENAS.cano = {
    id: 'cano', name: 'Caño Cristales', sub: 'El río de cinco colores y su creciente', W: 1520, H: 880,
    spawns: [[250, 440], [1270, 440]],
    sources: [
      { x: 560, y: 500, el: 'water' }, { x: 960, y: 380, el: 'water' },
      { x: 300, y: 720, el: 'plant' }, { x: 1220, y: 160, el: 'plant' },
      { x: 420, y: 170, el: 'fire' }, { x: 1100, y: 710, el: 'fire' },
    ],
    // distancia a la línea del río (pasa por el centro, de arriba-izquierda a abajo-derecha)
    riverD(x, y) { const dx = 920, dy = 880, l = Math.hypot(dx, dy); return ((x - 760) * dy - (y - 440) * dx) / l + Math.sin((x + y) / 150) * 18; },
    paint(T) {
      P(T, (x, y) => (fbm2(x / 170 + 9, y / 170) > 0.6 ? TT.DIRT : TT.GRASS));
      P(T, (x, y) => { const d = Math.abs(this.riverD(x, y)); return d < 62 ? TT.SHALLOW : d < 98 ? TT.STONE : null; });
      // ollas hondas en el lecho (marmitas)
      for (const [x, y, r] of [[560, 250, 30], [700, 380, 24], [470, 140, 22]]) blob(T, x, y, r, TT.DEEP);
      for (const s of this.sources) altar(T, s.x, s.y);
      blob(T, 300, 470, 24, TT.ROCK); blob(T, 640, 690, 20, TT.ROCK); blob(T, 160, 250, 18, TT.ROCK);
      sym(T, [[130, 580], [200, 820], [520, 820], [380, 340], [120, 120], [700, 820], [260, 300]], TT.BUSH);
      border(T, 0.78);
    },
    theme: 'cano', event: 'flood',
  };
})();

/* ---------- el escenario en juego ---------- */
const Arena = {
  build(G, id) {
    const A = ARENAS[id] || ARENAS.paramo; G.arena = A.id; G.A = A;
    G.T = Terrain.make(A.W, A.H); A.paint(G.T);
    G.sources = A.sources.map(s => Object.assign({ cd: 0, glow: 0 }, s));
    // 2.0: una fuente de LUZ y otra de SOMBRA, en espejo; se intercambian cada ronda (para que a nadie le quede siempre la misma cerca)
    if (!A.extra) { const T = G.T, cx = A.W * 0.37, cy = A.H * 0.27; let best = null, bd = 1e12;
      for (let i = 0; i < T.n; i++) { const b = T.base[i]; if (b !== TT.GRASS && b !== TT.DIRT && b !== TT.STONE) continue; const px = Terrain.cx(T, i), py = Terrain.cy(T, i); if (px < 110 || py < 110 || px > A.W - 110 || py > A.H - 110) continue;
        if (A.sources.some(q => hypot(q.x - px, q.y - py) < 190) || A.spawns.some(q => hypot(q[0] - px, q[1] - py) < 210) || hypot(A.W - 2 * px, A.H - 2 * py) < 260) continue;
        let ok = true; Terrain.forCircle(T, px, py, 50, j => { const bj = T.base[j]; if (bj !== TT.GRASS && bj !== TT.DIRT && bj !== TT.STONE) ok = false; }); if (!ok) continue;
        const d = dist2(px, py, cx, cy); if (d < bd) { bd = d; best = [px, py]; } }
      A.extra = best || false; }
    if (A.extra) { const [ex, ey] = A.extra, sw = (G.round || 0) % 2 === 1; G.sources.push({ x: ex, y: ey, el: sw ? 'light' : 'shadow', cd: 0, glow: 0 }, { x: A.W - ex, y: A.H - ey, el: sw ? 'shadow' : 'light', cd: 0, glow: 0 }); }
    G.T.ver++;
  },
  // un punto seguro (pisable) cerca de x, y
  safeNear(G, x, y, strict) {
    const T = G.T; let best = null, bd = 1e12;
    for (let i = 0; i < T.n; i++) {
      const b = T.base[i]; if (Terrain.solid(T, i) || b === TT.CHASM || b === TT.DEEP || Terrain.isLava(T, i) || T.pit[i] > 0 || (strict && (b === TT.LAVA || T.fire[i] > 0 || T.elec[i] > 0))) continue;
      const px = Terrain.cx(T, i), py = Terrain.cy(T, i), d = dist2(px, py, x, y); if (d < bd) { bd = d; best = [px, py]; }
    }
    return best || [T.W / 2, T.H / 2];
  },
};
