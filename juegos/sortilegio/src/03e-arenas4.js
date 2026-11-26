/* =========================================================================
   ESCENARIOS NUEVOS (3.0) para el duelo y los demás modos: cuatro del
   Mundo 2 y tres más del Mundo 3 (con Itsukushima, cuatro). Todos
   simétricos al girarlos media vuelta, como los de siempre.
   · Islas del cielo — tres islas y puentes de luz sobre el vacío; tormenta.
   · Templo del sol — patio dorado con columnas y guardianes que despiertan.
   · Coliseo de ceniza — arena redonda con fosos de lava; lluvia de rocas.
   · Puente de huesos — un puente largo sobre el abismo con plataformas.
   · Arashiyama — bosque de bambú con calles; las estaciones rotan.
   · Fushimi Inari — de noche, entre toriis y zorros de piedra que disparan.
   · Shirakawa-go — aldea nevada con casas de techo de paja y arrozales.
   ========================================================================= */
(() => {
  const P = (T, fn) => { for (let r = 0; r < T.rows; r++) for (let c = 0; c < T.cols; c++) { const v = fn(c * CELL + CELL / 2, r * CELL + CELL / 2, c, r); if (v != null) T.base[r * T.cols + c] = v; } };
  const sym = (T, list, type) => list.forEach(([x, y]) => { for (const [px, py] of [[x, y], [T.W - x, T.H - y]]) { const i = Terrain.idx(T, px, py); if (i >= 0) T.base[i] = type; } });
  const blob = (T, x, y, r, type) => { Terrain.forCircle(T, x, y, r, i => { T.base[i] = type; }); Terrain.forCircle(T, T.W - x, T.H - y, r, i => { T.base[i] = type; }); };
  const ell = (T, x, y, rx, ry, type, both = true) => P(T, (px, py) => { const a = ((px - x) / rx) ** 2 + ((py - y) / ry) ** 2 < 1, b = both && ((px - (T.W - x)) / rx) ** 2 + ((py - (T.H - y)) / ry) ** 2 < 1; return a || b ? type : null; });
  const altar = (T, x, y) => Terrain.forCircle(T, x, y, 34, i => { T.base[i] = TT.STONE; });
  const border = (T, wob = 0.9) => P(T, (x, y, c, r) => { const e = Math.min(c, r, T.cols - 1 - c, T.rows - 1 - r); if (e === 0) return TT.ROCK; if (e === 1 && noise2(c * 0.7 + r * 0.31, r * 0.7 - c * 0.17) > wob) return TT.ROCK; return null; });
  const lineSym = (T, x0, y0, x1, y1, w, type) => { for (const [a, b, c, d] of [[x0, y0, x1, y1], [T.W - x0, T.H - y0, T.W - x1, T.H - y1]]) { const n = Math.ceil(hypot(c - a, d - b) / 12); for (let s = 0; s <= n; s++) Terrain.forCircle(T, a + (c - a) * s / n, b + (d - b) * s / n, w, i => { T.base[i] = type; }); } };
  const src = list => list.flatMap(([x, y, el]) => [{ x, y, el }, { x: 1520 - x, y: 880 - y, el }]);

  /* ---------- Islas del cielo ---------- */
  ARENAS.islas = { id: 'islas', name: 'Islas del cielo', sub: 'Puentes de luz sobre el vacío, y la tormenta', W: 1520, H: 880, world: 2, bridgeUnder: TT.CHASM, noBurnBridge: true,
    spawns: [[260, 440], [1260, 440]], sources: src([[300, 230, 'light'], [300, 660, 'wind'], [620, 440, 'bolt'], [140, 440, 'water']]),
    paint(T) { P(T, () => TT.CHASM); ell(T, 330, 440, 270, 330, TT.GRASS); P(T, (x, y) => (((x - 760) / 170) ** 2 + ((y - 440) / 210) ** 2 < 1 ? TT.STONE : null));
      lineSym(T, 560, 300, 640, 360, 22, TT.BRIDGE); lineSym(T, 560, 600, 640, 540, 22, TT.BRIDGE);
      for (const s of this.sources) altar(T, s.x, s.y); sym(T, [[230, 170], [420, 760], [200, 330], [470, 560]], TT.BUSH); blob(T, 450, 300, 20, TT.ROCK); },
    theme: 'cielo', event: 'storm' };
  /* ---------- Templo del sol ---------- */
  ARENAS.templo = { id: 'templo', name: 'Templo del sol', sub: 'Patio dorado; los guardianes despiertan', W: 1520, H: 880, world: 2,
    spawns: [[250, 440], [1270, 440]], sources: src([[360, 200, 'light'], [360, 680, 'fire'], [640, 300, 'earth'], [150, 300, 'shadow']]),
    statues: [[560, 640], [960, 240]],
    paint(T) { P(T, () => TT.CHASM); P(T, (x, y) => (((x - 760) / 720) ** 2 + ((y - 440) / 420) ** 2 < 1 ? TT.STONE : null)); P(T, (x, y) => (((x - 760) / 600) ** 2 + ((y - 440) / 330) ** 2 < 1 ? TT.GRASS : null));
      P(T, (x, y) => (Math.abs(y - 440) < 30 && x > 120 && x < 1400 ? TT.STONE : null)); P(T, (x, y) => (((x - 760) / 120) ** 2 + ((y - 440) / 120) ** 2 < 1 ? TT.STONE : null));
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + 0.2; Terrain.forCircle(T, 760 + Math.cos(a) * 250, 440 + Math.sin(a) * 200, 16, i => { T.base[i] = TT.ROCK; }); }
      for (const s of this.sources) altar(T, s.x, s.y); for (const [x, y] of this.statues) { const i = Terrain.idx(T, x, y); if (i >= 0) T.base[i] = TT.ROCK; const j = Terrain.idx(T, 1520 - x, 880 - y); if (j >= 0) T.base[j] = TT.ROCK; }
      sym(T, [[260, 230], [300, 650], [500, 150], [480, 720]], TT.BUSH); },
    theme: 'cielo', event: 'guardians' };
  /* ---------- Coliseo de ceniza ---------- */
  ARENAS.coliseo = { id: 'coliseo', name: 'Coliseo de ceniza', sub: 'Fosos de lava y lluvia de rocas ardientes', W: 1520, H: 880, world: 2,
    spawns: [[300, 440], [1220, 440]], sources: src([[420, 220, 'light'], [420, 660, 'water'], [700, 160, 'fire'], [220, 440, 'shadow']]),
    paint(T) { P(T, () => TT.ROCK); P(T, (x, y) => (((x - 760) / 700) ** 2 + ((y - 440) / 400) ** 2 < 1 ? TT.DIRT : null)); P(T, (x, y) => (((x - 760) / 160) ** 2 + ((y - 440) / 110) ** 2 < 1 ? TT.STONE : null));
      blob(T, 560, 260, 54, TT.LAVA); blob(T, 560, 620, 54, TT.LAVA); blob(T, 760, 130, 40, TT.LAVA);
      for (const [x, y] of [[360, 330], [360, 550], [660, 440]]) blob(T, x, y, 20, TT.ROCK);
      for (const s of this.sources) altar(T, s.x, s.y); },
    theme: 'infierno', event: 'eruption' };
  /* ---------- Puente de huesos ---------- */
  ARENAS.huesos = { id: 'huesos', name: 'Puente de huesos', sub: 'Un puente sobre el abismo y sus plataformas', W: 1520, H: 880, world: 2,
    spawns: [[220, 440], [1300, 440]], sources: src([[210, 230, 'light'], [210, 650, 'fire'], [560, 220, 'earth'], [560, 660, 'shadow']]),
    paint(T) { P(T, () => TT.CHASM); ell(T, 230, 440, 200, 330, TT.DIRT); P(T, (x, y) => (Math.abs(y - 440) < 62 ? TT.STONE : null)); ell(T, 560, 220, 120, 90, TT.DIRT); ell(T, 560, 660, 120, 90, TT.DIRT); P(T, (x, y) => (((x - 760) / 160) ** 2 + ((y - 440) / 150) ** 2 < 1 ? TT.DIRT : null));
      lineSym(T, 560, 290, 600, 400, 20, TT.STONE); lineSym(T, 560, 590, 600, 480, 20, TT.STONE);
      for (const s of this.sources) altar(T, s.x, s.y); blob(T, 300, 300, 18, TT.ROCK); blob(T, 760, 360, 14, TT.ROCK); },
    theme: 'infierno', event: 'mist' };

  /* ---------- Arashiyama (Mundo 3) ---------- */
  ARENAS.arashiyama = { id: 'arashiyama', name: 'Arashiyama', sub: 'Bosque de bambú: en verano arde', W: 1520, H: 880, world: 3, noExtra: true,
    spawns: [[220, 440], [1300, 440]], sources: src([[260, 200, 'plant'], [260, 680, 'fire'], [620, 440, 'wind'], [520, 120, 'water']]),
    paint(T) { P(T, () => TT.GRASS);
      // manchas de bambú con calles entre ellas (en espejo)
      for (const [x, y, rx, ry] of [[420, 300, 70, 110], [420, 600, 70, 100], [700, 210, 60, 90], [140, 120, 80, 60], [660, 690, 50, 70]]) ell(T, x, y, rx, ry, TT.BUSH);
      P(T, (x, y) => (Math.abs(y - 440 - Math.sin(x / 140) * 50) < 34 ? TT.DIRT : null));
      for (const s of this.sources) altar(T, s.x, s.y); border(T, 0.85); },
    theme: 'arashiyama', event: 'mist', seasons: { rotate: 25, start: 'summer', toriis: [{ x: 760, y: 440 }] } };
  /* ---------- Fushimi Inari (Mundo 3, de noche) ---------- */
  ARENAS.fushimi = { id: 'fushimi', name: 'Fushimi Inari', sub: 'Mil toriis y zorros de piedra, de noche', W: 1520, H: 880, world: 3, noExtra: true,
    spawns: [[230, 440], [1290, 440]], sources: src([[300, 180, 'fire'], [300, 700, 'water'], [640, 300, 'wind'], [560, 760, 'plant']]),
    statues: [[600, 560], [920, 320]],
    paint(T) { P(T, () => TT.GRASS); P(T, (x, y) => (Math.abs(y - 440) < 46 ? TT.STONE : null)); P(T, (x, y) => (Math.abs(x - 760) < 40 ? TT.STONE : null));
      ell(T, 760, 440, 150, 110, TT.STONE, false);
      for (const [x, y] of [[420, 360], [420, 520], [560, 360], [560, 520]]) blob(T, x, y, 12, TT.ROCK);
      for (const s of this.sources) altar(T, s.x, s.y); for (const [x, y] of this.statues) { const i = Terrain.idx(T, x, y); if (i >= 0) T.base[i] = TT.ROCK; const j = Terrain.idx(T, 1520 - x, 880 - y); if (j >= 0) T.base[j] = TT.ROCK; }
      sym(T, [[140, 140], [180, 760], [460, 120], [470, 760], [660, 140], [380, 680]], TT.BUSH); border(T, 0.85); },
    looks(G) { const T = G.T, R = []; for (let i = 0; i < T.n; i++) { const x = Terrain.cx(T, i), y = Terrain.cy(T, i); if (T.base[i] === TT.ROCK && x > 40 && y > 40 && x < T.W - 40 && y < T.H - 40) R.push(i); } for (const i of R) G.cellLook.set(i, 'fox'); },
    theme: 'fushimi', event: 'guardians', seasons: { rotate: 25, start: 'autumn', toriis: [{ x: 400, y: 440 }, { x: 1120, y: 440 }] } };
  /* ---------- Shirakawa-go (Mundo 3) ---------- */
  ARENAS.shirakawa = { id: 'shirakawa', name: 'Shirakawa-go', sub: 'Aldea nevada de techos de paja', W: 1520, H: 880, world: 3, noExtra: true,
    spawns: [[220, 440], [1300, 440]], sources: src([[240, 200, 'fire'], [240, 680, 'water'], [600, 440, 'wind'], [520, 780, 'plant']]),
    paint(T) { P(T, () => TT.GRASS); P(T, (x, y) => (Math.abs(y - 440) < 30 ? TT.DIRT : null));
      for (const [x, y] of [[440, 240], [440, 640]]) { P(T, (px, py) => (Math.abs(px - x) < 80 && Math.abs(py - y) < 40 ? TT.ROCK : null)); P(T, (px, py) => (Math.abs(px - (1520 - x)) < 80 && Math.abs(py - (880 - y)) < 40 ? TT.ROCK : null)); }
      for (const [x, y] of [[680, 160], [680, 720]]) { P(T, (px, py) => (Math.abs(px - x) < 70 && Math.abs(py - y) < 45 ? TT.SHALLOW : null)); P(T, (px, py) => (Math.abs(px - (1520 - x)) < 70 && Math.abs(py - (880 - y)) < 45 ? TT.SHALLOW : null)); }
      for (const s of this.sources) altar(T, s.x, s.y); sym(T, [[140, 140], [150, 760], [300, 340], [300, 540]], TT.BUSH); border(T, 0.85); },
    looks(G) { const T = G.T; for (let i = 0; i < T.n; i++) { const x = Terrain.cx(T, i), y = Terrain.cy(T, i); if (T.base[i] === TT.ROCK && x > 60 && y > 60 && x < T.W - 60 && y < T.H - 60) G.cellLook.set(i, 'gassho'); } },
    theme: 'shirakawa', event: 'mist', seasons: { rotate: 25, start: 'winter', toriis: [{ x: 760, y: 440 }] } };

  ARENA_ORDER.push('miyajima', 'arashiyama', 'fushimi', 'shirakawa', 'islas', 'templo', 'coliseo', 'huesos');
})();
