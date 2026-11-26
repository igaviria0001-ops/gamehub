/* =========================================================================
   ESTACIONES (Mundo 3) — el mapa se divide en paneles (como un pergamino
   pintado) y cada panel tiene su estación. Los toriis la cambian: se
   golpean con el elemento de la estación que se quiere.
     planta → primavera · fuego → verano · viento → otoño · agua → invierno
   La LUZ limpia un torii manchado por el Borrón (si no, no acepta nada).
   · Primavera: las plantas crecen y duran más; lluvia suave.
   · Verano: la hierba se seca y el fuego corre el doble; los charcos se secan.
   · Otoño: hojarasca en el suelo (arde, el viento la levanta).
   · Invierno: el agua y los charcos se congelan; la nieve frena fuera de
     los caminos; el fuego casi no prende.
   Más fuerte en su estación: +20 %; el elemento contrario, −15 %.
   En duelo la estación rota sola (cada `rotate` segundos) y un torii la
   fuerza. Todo lo que cambia el suelo va en la cuadrícula (T.sea, T.snow,
   T.leaf), así que en línea viaja como cualquier otro cambio del terreno.
   ========================================================================= */
const SEASONS = {
  spring: { id: 'spring', code: 1, name: 'Primavera', el: 'plant', strong: 'plant', weak: null, col: '#ffb4cf', dark: '#c0436f', icon: 'flor' },
  summer: { id: 'summer', code: 2, name: 'Verano', el: 'fire', strong: 'fire', weak: 'water', col: '#8fd46a', dark: '#2e7a3a', icon: 'sol' },
  autumn: { id: 'autumn', code: 3, name: 'Otoño', el: 'wind', strong: 'wind', weak: null, col: '#ffa040', dark: '#b8401c', icon: 'hoja' },
  winter: { id: 'winter', code: 4, name: 'Invierno', el: 'water', strong: 'water', weak: 'fire', col: '#d6ecff', dark: '#4a6e9a', icon: 'copo' },
};
const SEASON_ORDER = ['spring', 'summer', 'autumn', 'winter'];
const SEASON_BY_CODE = [null, 'spring', 'summer', 'autumn', 'winter'];
const SEASON_OF_EL = { plant: 'spring', fire: 'summer', wind: 'autumn', water: 'winter' };
const Seasons = (() => {
  const TR = 0.9;   // lo que dura la pincelada que cambia la estación
  // def: { panels: [[x0, x1, estación], …] | start, rotate: s, toriis: [{ x, y, stain }] }
  function setup(G, def) {
    G.sea = null; if (!def) return;
    const T = G.T, W = T.W;
    const panels = (def.panels || [[0, W, def.start || 'spring']]).map(([x0, x1, s], k) => ({ k, x0, x1, s, cd: 0 }));
    G.sea = { def, panels, rot: def.rotate || 0, rotT: def.rotate || 0, warned: false, up: 0, toriis: [] };
    G.sea.toriis = (def.toriis || []).map((t, k) => ({ k, x: t.x != null ? t.x : t[0], y: t.y != null ? t.y : t[1], stain: !!t.stain, big: t.big || 0, cd: 0, glow: 0, hitT: 0, p: panelAt(G, t.x != null ? t.x : t[0]) }));
    for (const p of panels) paint(G, p);
  }
  function panelAt(G, x) { const P = G.sea.panels; for (let k = 0; k < P.length; k++) if (x >= P[k].x0 && x < P[k].x1) return k; return x < P[0].x0 ? 0 : P.length - 1; }
  function at(G, x, y) { if (!G.sea) return null; const i = Terrain.idx(G.T, x, y); return i >= 0 ? SEASON_BY_CODE[G.T.sea[i]] : null; }
  function mult(G, x, y, el) {
    const s = at(G, x, y); if (!s) return 1; const S = SEASONS[s];
    if (S.strong === el) return 1.2; if (S.weak === el) return 0.85; return 1;
  }
  // pinta en la cuadrícula lo que trae la estación del panel
  function paint(G, p) {
    const T = G.T, S = SEASONS[p.s], c0 = Math.max(0, Math.floor(p.x0 / CELL)), c1 = Math.min(T.cols - 1, Math.ceil(p.x1 / CELL) - 1);
    for (let r = 0; r < T.rows; r++) for (let c = c0; c <= c1; c++) {
      const i = r * T.cols + c, b = T.base[i]; T.sea[i] = S.code;
      const soft = b === TT.GRASS || b === TT.FERTILE;
      T.snow[i] = p.s === 'winter' && soft && T.fire[i] <= 0 ? 1 : 0;
      T.leaf[i] = p.s === 'autumn' && T.ash[i] <= 0 && (soft || (b === TT.DIRT && hash2(c * 0.7, r * 1.3) < 0.35)) ? 1 : 0;
      if (p.s === 'summer' && T.wet[i] > 0) T.wet[i] *= 0.5;
    }
    T.ver++;
  }
  // cambia la estación de un panel (con la pincelada que la repinta)
  function set(G, k, s, by = -1, x, y) {
    const p = G.sea.panels[k]; if (!p || p.s === s) return false;
    p.s = s; p.cd = 1.2; paint(G, p);
    const S = SEASONS[s];
    G.events.push({ type: 'season', s, k, by, x: x != null ? x : (p.x0 + p.x1) / 2, y: y != null ? y : G.T.H / 2 });
    if (!G.attract) G.pops.push({ x: 0, y: 0, text: '¡' + S.name + '!', t: 0, color: S.col, big: true, screen: true });
    return true;
  }
  // ¿qué elemento de estación toca el torii? (hechizos que llegan, o un mago que carga una mano a su lado)
  function hitEl(G, t) {
    for (const s of G.spells) {
      if (s.dead) continue;
      let x = s.x, y = s.y; if (s.t === 'wave') { x += Math.cos(s.ang) * s.d; y += Math.sin(s.ang) * s.d; }
      // hay que pegarle a un pilar (los hechizos que pasan por debajo del arco no cuentan)
      if (Math.min(hypot(x - (t.x - 34 * (t.big || 1)), y - t.y), hypot(x - (t.x + 34 * (t.big || 1)), y - t.y)) > 22 + (s.r || 0)) continue;
      if (s.el === 'light' || (s.fusion && s.fusion.includes('light'))) return 'light';
      if (SEASON_OF_EL[s.el]) return s.el;
      if (s.fusion) for (const e of s.fusion.split('+')) if (SEASON_OF_EL[e]) return e;
    }
    for (const m of G.mages) if (m.alive && hypot(m.x - t.x, m.y - t.y) < 70) for (const h of m.hands) if (h.hold >= HOLD_FULL && (SEASON_OF_EL[h.el] || h.el === 'light')) return h.el;
    return null;
  }
  function update(G, dt) {
    const Z = G.sea; if (!Z) return;
    for (const p of Z.panels) if (p.cd > 0) p.cd -= dt;
    // toriis
    if (G.state === 'play' || G.state === 'attract') for (const t of Z.toriis) {
      if (t.cd > 0) t.cd -= dt; if (t.glow > 0) t.glow -= dt; if (t.hitT > 0) t.hitT -= dt;
      if (t.cd > 0) continue;
      const el = hitEl(G, t); if (!el) continue;
      if (t.stain) { if (el === 'light') { t.stain = false; t.cd = 0.8; t.glow = 1; G.events.push({ type: 'toriiClean', x: t.x, y: t.y }); G.pops.push({ x: t.x, y: t.y - 110, text: '¡Torii limpio!', t: 0, color: '#fff2b0', small: true }); }
        else if (t.hitT <= 0) { t.hitT = 1.5; G.pops.push({ x: t.x, y: t.y - 110, text: 'Manchado: límpialo con LUZ', t: 0, color: '#d8d0ff', small: true }); }
        continue; }
      const s = SEASON_OF_EL[el]; if (!s) continue;
      if (set(G, t.p, s, -1, t.x, t.y)) { t.cd = Z.rot ? 4 : 1.4; t.glow = 1; if (Z.rot) { Z.rotT = Z.rot; Z.warned = false; } }
    }
    // rotación sola (duelo): aviso 3 s antes
    if (Z.rot && G.state === 'play') {
      Z.rotT -= dt;
      if (!Z.warned && Z.rotT <= 3) { Z.warned = true; const nx = SEASON_ORDER[(SEASON_ORDER.indexOf(Z.panels[0].s) + 1) % 4]; G.pops.push({ x: 0, y: 0, text: 'Se acerca ' + (nx === 'summer' ? 'el ' : nx === 'winter' ? 'el ' : 'la ') + SEASONS[nx].name.toLowerCase(), t: 0, color: SEASONS[nx].col, screen: true, low: true }); }
      if (Z.rotT <= 0) { Z.rotT = Z.rot; Z.warned = false; for (const p of Z.panels) set(G, p.k, SEASON_ORDER[(SEASON_ORDER.indexOf(p.s) + 1) % 4]); }
    }
    // cada 0,25 s: el invierno mantiene el agua congelada; el verano seca los charcos
    Z.up -= dt; if (Z.up > 0) return; Z.up = 0.25;
    const T = G.T;
    for (const p of Z.panels) {
      if (p.s !== 'winter') continue;
      const c0 = Math.max(0, Math.floor(p.x0 / CELL)), c1 = Math.min(T.cols - 1, Math.ceil(p.x1 / CELL) - 1);
      for (let r = 0; r < T.rows; r++) for (let c = c0; c <= c1; c++) {
        const i = r * T.cols + c, b = T.base[i];
        if (((b === TT.DEEP || b === TT.SHALLOW) && T.fire[i] <= 0) || T.wet[i] > 0) { if (T.ice[i] <= 0) T.ver++; T.ice[i] = Math.max(T.ice[i], 1.2); T.elec[i] = 0; }
      }
    }
  }
  return { setup, update, set, at, mult, panelAt, repaint: paint, TR };
})();
