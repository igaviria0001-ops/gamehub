/* =========================================================================
   ESCENARIOS DEL MUNDO 3 (duelo y demás modos) — pintados en tinta, con
   estaciones que rotan solas cada 25 s y toriis que las fuerzan.
   · Itsukushima: el gran torii en el mar, puentes bermellón sobre el canal
     y la MAREA (sube y baja: la orilla se inunda y el agua baja se vuelve
     honda un rato).
   Igual que los demás, son simétricos al girarlos media vuelta.
   ========================================================================= */
(() => {
  const P = (T, fn) => { for (let r = 0; r < T.rows; r++) for (let c = 0; c < T.cols; c++) { const v = fn(c * CELL + CELL / 2, r * CELL + CELL / 2, c, r); if (v != null) T.base[r * T.cols + c] = v; } };
  const sym = (T, list, type) => list.forEach(([x, y]) => { for (const [px, py] of [[x, y], [T.W - x, T.H - y]]) { const i = Terrain.idx(T, px, py); if (i >= 0) T.base[i] = type; } });
  const blob = (T, x, y, r, type) => { Terrain.forCircle(T, x, y, r, i => { T.base[i] = type; }); Terrain.forCircle(T, T.W - x, T.H - y, r, i => { T.base[i] = type; }); };
  const altar = (T, x, y) => Terrain.forCircle(T, x, y, 34, i => { T.base[i] = TT.STONE; });
  const border = (T, wob = 0.9) => P(T, (x, y, c, r) => { const e = Math.min(c, r, T.cols - 1 - c, T.rows - 1 - r); if (e === 0) return TT.ROCK; if (e === 1 && noise2(c * 0.7 + r * 0.31, r * 0.7 - c * 0.17) > wob) return TT.ROCK; return null; });

  /* ---------- Itsukushima: el santuario sobre el mar ---------- */
  ARENAS.miyajima = {
    id: 'miyajima', name: 'Itsukushima', sub: 'El gran torii en el mar y su marea', W: 1520, H: 880, world: 3, noExtra: true,
    spawns: [[230, 440], [1290, 440]],
    sources: [
      { x: 330, y: 170, el: 'plant' }, { x: 1190, y: 710, el: 'plant' },
      { x: 330, y: 710, el: 'fire' }, { x: 1190, y: 170, el: 'fire' },
      { x: 540, y: 470, el: 'water' }, { x: 980, y: 410, el: 'water' },
      { x: 130, y: 280, el: 'wind' }, { x: 1390, y: 600, el: 'wind' },
    ],
    // el canal del mar cruza en diagonal por el centro
    seaD(x, y) { return (x - 760) + (y - 440) * 0.28 + Math.sin(y / 70) * 16 * Math.sign(y - 440 || 1) * 0; },
    paint(T) {
      P(T, () => TT.GRASS);
      P(T, (x, y) => { const d = Math.abs(this.seaD(x, y)) + Math.sin((y + x * 0.3) / 60) * 10 * (y < 440 ? 1 : -1); return d < 78 ? TT.DEEP : d < 150 ? TT.SHALLOW : null; });
      // el gran torii se para en el agua baja, en medio del canal
      Terrain.forCircle(T, 760, 440, 62, i => { T.base[i] = TT.SHALLOW; });
      // caminos de las orillas a los puentes
      P(T, (x, y) => { if (T.base[Terrain.idx(T, x, y)] !== TT.GRASS) return null; const a = Math.abs(y - 200 - (x - 300) * 0.0) < 22 && x < 700, b = Math.abs(y - 680) < 22 && x > 820; const c2 = Math.abs(x - 400) < 20 && y > 200 && y < 440, d2 = Math.abs(x - 1120) < 20 && y < 680 && y > 440; return a || b || c2 || d2 ? TT.DIRT : null; });
      P(T, (x, y) => (Math.abs(y - 440) < 20 && (x < 400 || x > 1120) ? TT.DIRT : null));
      // puentes bermellón sobre el canal (arriba y abajo)
      P(T, (x, y) => { const i = Terrain.idx(T, x, y), b = T.base[i]; if (b !== TT.DEEP && b !== TT.SHALLOW) return null; return (Math.abs(y - 200) < 22 || Math.abs(y - 680) < 22) ? TT.BRIDGE : null; });
      for (const s of this.sources) altar(T, s.x, s.y);
      blob(T, 470, 300, 22, TT.ROCK); blob(T, 210, 600, 20, TT.ROCK); blob(T, 620, 120, 18, TT.ROCK);
      sym(T, [[150, 130], [250, 300], [120, 760], [480, 780], [600, 650], [260, 560], [470, 140], [640, 290]], TT.BUSH);
      border(T, 0.8);
    },
    theme: 'miyajima', event: 'tide',
    seasons: { rotate: 25, start: 'spring', toriis: [{ x: 760, y: 470, big: 1.4 }] },
  };
})();
