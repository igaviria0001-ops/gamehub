/* =========================================================================
   CAMPAÑA EN EQUIPO — «La Travesía de los Tunjos»: 10 niveles para dos (o
   uno con compañero automático), sin fuego amigo y con vidas compartidas.
   RESONANCIA: si proyectiles de los dos se cruzan, se funden en la fusión
   de sus elementos (agua + viento = ventisca justo ahí).
   Objetos de nivel: braseros (se prenden con fuego), placas (se pisan o se
   les empuja una piedra), piedras empujables, tótems (se cargan con rayo o
   con agua electrificada), puertas, sellos (piden una fusión exacta), tierra
   fértil (semilla + agua = puente de enredadera), farol y canoa que se
   defienden, salida. Jefes: Madremonte, Mohán y Tragaluz.
   ========================================================================= */
const Camp = (() => {
  // ---- ayudas para pintar niveles ----
  const all = (T, type) => T.base.fill(type);
  const rect = (T, x0, y0, x1, y1, type) => { for (let r = 0; r < T.rows; r++) for (let c = 0; c < T.cols; c++) { const x = c * CELL + 20, y = r * CELL + 20; if (x >= x0 && x <= x1 && y >= y0 && y <= y1) T.base[r * T.cols + c] = type; } };
  const circ = (T, x, y, r, type) => Terrain.forCircle(T, x, y, r, i => { T.base[i] = type; });
  const ell = (T, x, y, rx, ry, type) => { for (let r = 0; r < T.rows; r++) for (let c = 0; c < T.cols; c++) { const px = c * CELL + 20, py = r * CELL + 20; if (((px - x) / rx) ** 2 + ((py - y) / ry) ** 2 < 1) T.base[r * T.cols + c] = type; } };
  const border = T => { for (let r = 0; r < T.rows; r++) for (let c = 0; c < T.cols; c++) if (!r || !c || r === T.rows - 1 || c === T.cols - 1) T.base[r * T.cols + c] = TT.ROCK; };
  const cellsRect = (T, x0, y0, x1, y1) => { const L = []; for (let r = 0; r < T.rows; r++) for (let c = 0; c < T.cols; c++) { const x = c * CELL + 20, y = r * CELL + 20; if (x >= x0 && x <= x1 && y >= y0 && y <= y1) L.push(r * T.cols + c); } return L; };
  const bushes = (T, list) => list.forEach(([x, y]) => { const i = Terrain.idx(T, x, y); if (i >= 0) T.base[i] = TT.BUSH; });
  const S = (x, y, el) => ({ x, y, el });
  const ring = (G, cx, cy, rx, ry) => Array.from({ length: 8 }, (_, k) => [cx + Math.cos(k / 8 * TAU + 0.3) * rx, cy + Math.sin(k / 8 * TAU + 0.3) * ry]);
  // hechizo lanzado por el nivel o por un jefe sobre un punto (lluvia de fuego, fosas)
  function foeCast(G, x, y, Sp, el, o = {}) { const fk = { x, y, idx: -1, team: 9, tr: {}, st: { hidden: 0, blind: 0 }, face: 0, aim() { return { ang: 0, target: null, dist: 0 }; } }; Spells.cast(G, fk, Sp, el, Object.assign({ power: 1, size: 1, fusion: el.includes('+') ? el : null }, o)); }
  // ráfagas del cielo: aviso y luego empujan hacia un borde; hay que caminar contra el viento
  function gusts(G, dt, every, force) {
    G.cs.gt -= dt;
    if (G.cs.gust > 0) { G.cs.gust -= dt; const k = G.cs.gust > 2.6 ? 0 : 1; G.wind = { x: Math.cos(G.cs.ga) * (0.6 + k * 2.4), y: Math.sin(G.cs.ga) * (0.6 + k * 2.4) }; if (k) for (const u of G.units) if (u.alive && (u.isMage || u instanceof Creature) && !(u.st.root > 0)) { u.x += Math.cos(G.cs.ga) * force * dt * (u.isMage ? 1 : 0.5); u.y += Math.sin(G.cs.ga) * force * dt * (u.isMage ? 1 : 0.5); } if (G.cs.gust <= 0) G.wind = null; }
    else if (G.cs.gt <= 0) { G.cs.gt = every; G.cs.gust = 4.1; G.cs.ga = G.rng() * TAU; G.pops.push({ x: 0, y: 0, text: '¡Viene una ráfaga!', t: 0, color: '#dff6ff', big: true, screen: true }); G.events.push({ type: 'arenaEvent', ev: 'breath' }); }
  }
  /* ---------- los diez niveles ---------- */
  const LEVELS = [
    { id: 'c1', name: 'El despertar', place: 'Páramo de Iguaque', kind: 'Ingenio y lucha', theme: 'paramo', W: 1800, H: 1000, par: 150,
      text: 'Los braseros del páramo se apagaron. Beban fuego de la fuente y enciendan los tres.',
      spawns: [[180, 470], [180, 560]], sources: [S(330, 300, 'fire'), S(330, 720, 'water'), S(1150, 520, 'fire')],
      paint(T) { all(T, TT.GRASS); rect(T, 100, 480, 1700, 540, TT.DIRT); ell(T, 820, 300, 150, 90, TT.DEEP); ell(T, 820, 300, 190, 120, TT.SHALLOW); ell(T, 820, 300, 150, 90, TT.DEEP); bushes(T, [[600, 700], [640, 760], [1300, 760], [1450, 330], [980, 660], [520, 150], [1200, 150]]); circ(T, 1060, 380, 26, TT.ROCK); border(T); },
      objs: [{ t: 'brazier', x: 560, y: 260 }, { t: 'brazier', x: 1000, y: 820 }, { t: 'brazier', x: 1400, y: 240 }, { t: 'exit', x: 1680, y: 510 }],
      goal: G => G.objs.filter(o => o.t === 'brazier' && o.lit).length >= 3,
      label: G => { const n = G.objs.filter(o => o.t === 'brazier' && o.lit).length; return n < 3 ? `Enciendan los braseros con fuego (${n}/3)` : '¡Vayan juntos a la salida!'; },
      script(G, dt) { const n = G.objs.filter(o => o.t === 'brazier' && o.lit).length; if (n !== G.cs.n) { G.cs.n = n; if (n === 1) wave(G, ['bruma', 'bruma', 'bruma']); if (n === 2) wave(G, ['bruma', 'bruma', 'murcielago', 'bruma']); } },
      hint: 'Sostén una mano sobre la fuente de fuego para beberla.' },
    { id: 'c2', name: 'La laguna helada', place: 'Laguna de Iguaque', kind: 'Ingenio', theme: 'paramo', W: 2000, H: 1000, par: 170,
      text: 'Para cruzar: congelen el agua (agua + viento, o crucen sus hechizos), hagan crecer el puente de enredadera en la tierra fértil mojada y abran la puerta pisando las dos placas.',
      spawns: [[200, 460], [200, 560]], sources: [S(420, 300, 'water'), S(420, 720, 'wind'), S(1000, 400, 'plant'), S(1000, 620, 'water')],
      paint(T) { all(T, TT.GRASS); rect(T, 640, 0, 1360, 1000, TT.DEEP); ell(T, 1000, 510, 150, 170, TT.GRASS); rect(T, 1050, 480, 1090, 540, TT.FERTILE); rect(T, 1700, 0, 1740, 1000, TT.ROCK); bushes(T, [[300, 150], [520, 880], [1500, 160], [1580, 860]]); border(T); },
      objs: [{ t: 'sprout', x: 1070, y: 510, cells: [1100, 480, 1370, 540] }, { t: 'plate', x: 1500, y: 280 }, { t: 'plate', x: 1500, y: 740 }, { t: 'stone', x: 1560, y: 510 }, { t: 'door', rect: [1700, 420, 1740, 600], cond: G => G.objs.filter(o => o.t === 'plate').every(o => o.pressed) }, { t: 'exit', x: 1880, y: 510 }],
      goal: G => G.objs.find(o => o.t === 'door').open,
      label: G => { const sp = G.objs.find(o => o.t === 'sprout'), d = G.objs.find(o => o.t === 'door'); return !G.cs.island ? 'Congelen un camino hasta la isla (agua + viento)' : !sp.grown ? 'Mojen la tierra fértil y siembren una semilla' : !d.open ? 'Pisen las dos placas a la vez (o empújenles la piedra)' : '¡A la salida!'; },
      script(G) { if (!G.cs.island && G.mages.some(m => m.alive && m.x > 900 && m.x < 1100)) G.cs.island = 1; if (G.cs.island && !G.cs.w) { G.cs.w = 1; wave(G, ['bruma', 'bruma'], [[1550, 300], [1550, 700]]); } },
      hint: 'La ventisca vuelve hielo el agua por unos segundos: ¡crucen rápido!' },
    { id: 'c3', name: 'Bosque de niebla', place: 'Bosque de niebla', kind: 'Lucha', theme: 'rio', W: 1700, H: 1000, par: 200, mist: 1,
      text: 'Protejan el farol del Tunjo durante cuatro oleadas de espantos de la Bruma.',
      spawns: [[760, 500], [940, 500]], sources: [S(500, 260, 'fire'), S(1200, 740, 'bolt'), S(500, 740, 'wind'), S(1200, 260, 'earth')],
      paint(T) { all(T, TT.GRASS); circ(T, 850, 500, 90, TT.STONE); bushes(T, [[300, 300], [260, 700], [1400, 300], [1440, 720], [850, 160], [850, 860], [640, 420], [1060, 600]]); border(T); },
      objs: [{ t: 'lantern', x: 850, y: 500, hp: 260 }],
      waves: [['bruma', 'bruma', 'bruma', 'bruma'], ['bruma', 'bruma', 'murcielago', 'bruma', 'murcielago'], ['murcielago', 'murcielago', 'bruma', 'murcielago', 'bruma', 'bruma'], ['golem', 'bruma', 'murcielago', 'bruma', 'murcielago']],
      goal: G => G.cs.wave >= 4 && !G.units.some(u => u instanceof Creature && u.alive && u.team === 9),
      label: G => `Defiendan el farol · oleada ${Math.min(4, G.cs.wave + (G.cs.wave < 4 ? 1 : 0))}/4`, autoWin: true,
      script(G, dt) { if (G.cs.wave == null) { G.cs.wave = 0; G.cs.wt = 3; } const live = G.units.some(u => u instanceof Creature && u.alive && u.team === 9); if (!live && G.cs.wave < 4) { G.cs.wt -= dt; if (G.cs.wt <= 0) { wave(G, this.waves[G.cs.wave], edges(G)); G.cs.wave++; G.cs.wt = 3; G.pops.push({ x: 0, y: 0, text: `Oleada ${G.cs.wave}`, t: 0, color: '#ffd9a0', big: true, screen: true }); } } } },
    { id: 'c4', name: 'La Madremonte', place: 'Selva del Magdalena', kind: 'Jefe', theme: 'rio', W: 1600, H: 1000, par: 200, boss: 'madremonte',
      text: 'La Madremonte está atrapada por la Bruma. Quémenle la armadura de lianas y péguenle al corazón (el rayo duele más).',
      spawns: [[220, 460], [220, 560]], sources: [S(330, 240, 'fire'), S(330, 780, 'fire'), S(1300, 240, 'bolt'), S(1300, 780, 'water')],
      paint(T) { all(T, TT.GRASS); bushes(T, [[120, 120], [1480, 120], [120, 880], [1480, 880], [800, 120], [800, 880], [560, 300], [1040, 700]]); border(T); },
      objs: [], goal: G => G.boss && !G.boss.alive, label: G => G.boss && G.boss.shield > 0 ? 'Quemen las lianas de la Madremonte (fuego)' : '¡Péguenle al corazón!', autoWin: true },
    { id: 'c5', name: 'Las compuertas', place: 'Río Magdalena', kind: 'Ingenio', theme: 'rio', W: 2000, H: 1000, par: 190, current: { x: 0, y: 160 },
      text: 'Bajen el puente: carguen los dos tótems de rayo casi al tiempo (sirve electrificar el agua que los toca). Luego quemen la barrera de espinas.',
      spawns: [[180, 460], [180, 560]], sources: [S(380, 500, 'bolt'), S(560, 140, 'water'), S(560, 860, 'water'), S(1360, 300, 'fire'), S(1360, 720, 'wind')],
      paint(T) { all(T, TT.GRASS); rect(T, 900, 0, 1100, 1000, TT.DEEP); rect(T, 860, 0, 900, 1000, TT.SHALLOW); rect(T, 1100, 0, 1140, 1000, TT.SHALLOW); rect(T, 620, 210, 860, 290, TT.SHALLOW); rect(T, 620, 710, 860, 790, TT.SHALLOW); for (let y = 40; y < 1000; y += 40) { const i = Terrain.idx(T, 1620, y); if (i >= 0) T.base[i] = TT.BUSH; const j = Terrain.idx(T, 1660, y); if (j >= 0) T.base[j] = TT.BUSH; } border(T); },
      objs: [{ t: 'totem', x: 640, y: 250 }, { t: 'totem', x: 640, y: 750 }, { t: 'bridge', rect: [860, 470, 1140, 550], cond: G => G.objs.filter(o => o.t === 'totem').every(o => o.power > 0) }, { t: 'exit', x: 1880, y: 510 }],
      goal: G => G.objs.find(o => o.t === 'bridge').open && G.cs.thorns,
      label: G => !G.objs.find(o => o.t === 'bridge').open ? 'Carguen los dos tótems con rayo casi al tiempo' : !G.cs.thorns ? 'Quemen la barrera de espinas' : '¡A la salida!',
      script(G) { if (!G.cs.thorns) { let any = false; for (let y = 40; y < 1000; y += 40) { const i = Terrain.idx(G.T, 1620, y), j = Terrain.idx(G.T, 1660, y); if ((i >= 0 && G.T.base[i] !== TT.BUSH) || (j >= 0 && G.T.base[j] !== TT.BUSH)) { const a = G.T.base[i] !== TT.BUSH, b = G.T.base[j] !== TT.BUSH; if (a && b) any = true; } } if (any) G.cs.thorns = 1; } if (G.objs.find(o => o.t === 'bridge').open && !G.cs.w) { G.cs.w = 1; wave(G, ['caiman', 'bruma', 'bruma'], [[1000, 200], [1300, 800], [1400, 200]]); } } },
    { id: 'c6', name: 'El río de cinco colores', place: 'Caño Cristales', kind: 'Lucha e ingenio', theme: 'cano', W: 2400, H: 1000, par: 210,
      text: 'Lleven la canoa del Tunjo río abajo: avanza si hay alguien cerca. Rompan las rocas que tapan el río y defiéndanla de los murciélagos.',
      spawns: [[160, 380], [160, 640]], sources: [S(600, 220, 'earth'), S(1300, 800, 'fire'), S(1800, 220, 'bolt'), S(1000, 220, 'wind')],
      paint(T) { all(T, TT.GRASS); rect(T, 0, 430, 2400, 590, TT.SHALLOW); rect(T, 0, 470, 2400, 550, TT.DEEP); bushes(T, [[400, 160], [800, 860], [1200, 140], [1600, 860], [2000, 140], [2200, 860]]); border(T); },
      objs: [{ t: 'canoe', x: 140, y: 510, hp: 200, path: [[140, 510], [2280, 510]] }, { t: 'rocks', x: 760 }, { t: 'rocks', x: 1380 }, { t: 'rocks', x: 1960 }],
      goal: G => { const c = G.objs.find(o => o.t === 'canoe'); return c.x >= 2240; }, autoWin: true,
      label: G => { const c = G.objs.find(o => o.t === 'canoe'); return c.blocked ? '¡Rompan las rocas que tapan el río!' : c.moving ? 'La canoa avanza: defiéndanla' : 'Acérquense a la canoa para que avance'; },
      script(G, dt) { G.cs.bt = (G.cs.bt || 8) - dt; if (G.cs.bt <= 0) { G.cs.bt = 11; const c = G.objs.find(o => o.t === 'canoe'); if (G.units.filter(u => u instanceof Creature && u.alive).length < 4) wave(G, ['murcielago', 'murcielago'], [[c.x + 300, 120], [c.x + 300, 900]]); } } },
    { id: 'c7', name: 'El Mohán', place: 'Río Magdalena', kind: 'Jefe', theme: 'rio', W: 1700, H: 1000, par: 220, boss: 'mohan', current: { x: 0, y: 120 },
      text: 'El Mohán se esconde en el agua: así casi no le duele nada. Congélenlo (agua + viento) y ahí sí, ¡con todo!',
      spawns: [[220, 460], [220, 560]], sources: [S(380, 220, 'water'), S(380, 780, 'wind'), S(1320, 220, 'wind'), S(1320, 780, 'water'), S(250, 500, 'bolt')],
      paint(T) { all(T, TT.GRASS); rect(T, 700, 0, 1000, 1000, TT.DEEP); rect(T, 660, 0, 700, 1000, TT.SHALLOW); rect(T, 1000, 0, 1040, 1000, TT.SHALLOW); bushes(T, [[150, 150], [150, 850], [1550, 150], [1550, 850], [500, 500]]); border(T); },
      objs: [], goal: G => G.boss && !G.boss.alive, label: G => G.boss && G.boss.st.frozen > 0 ? '¡Está congelado: ahora!' : 'Congelen al Mohán con ventisca', autoWin: true },
    { id: 'c8', name: 'El templo de las estatuas', place: 'San Agustín', kind: 'Ingenio', theme: 'ciudad', W: 1800, H: 1100, par: 220,
      text: 'Cada sello pide una fusión exacta. Traigan los elementos de las fuentes y crúcenlos sobre el sello (o fúndanlos con las dos manos). Cuidado con los guardianes.',
      spawns: [[200, 500], [200, 600]], sources: [S(420, 200, 'fire'), S(420, 900, 'water'), S(900, 140, 'earth'), S(900, 960, 'plant'), S(1380, 200, 'wind'), S(1380, 900, 'bolt')],
      statues: [[700, 550], [1100, 550]],
      paint(T) { all(T, TT.STONE); rect(T, 60, 60, 1740, 1040, TT.GRASS); rect(T, 160, 160, 1640, 940, TT.STONE); for (const [x, y] of [[700, 550], [1100, 550]]) { const i = Terrain.idx(T, x, y); if (i >= 0) T.base[i] = TT.ROCK; } bushes(T, [[100, 100], [1700, 100], [100, 1000], [1700, 1000]]); border(T); },
      objs: [{ t: 'seal', x: 650, y: 300, need: 'fire+water' }, { t: 'seal', x: 1150, y: 800, need: 'earth+plant' }, { t: 'seal', x: 900, y: 550, need: 'wind+bolt' }, { t: 'exit', x: 1650, y: 550 }],
      goal: G => G.objs.filter(o => o.t === 'seal').every(o => o.done),
      label: G => { const n = G.objs.filter(o => o.t === 'seal' && o.done).length; return n < 3 ? `Abran los sellos con la fusión que piden (${n}/3)` : '¡A la salida!'; },
      script(G, dt) { for (const s of G.statues) s.awake = 1; G.cs.wt = (G.cs.wt || 12) - dt; if (G.cs.wt <= 0) { G.cs.wt = 18; wave(G, ['golem'], [[900, 300]]); } } },
    { id: 'c9', name: 'Corazón de fuego', place: 'Volcán Puracé', kind: 'Lucha', theme: 'volcan', W: 1800, H: 1100, par: 160, limit: 240,
      text: 'Suban al cráter antes de que el volcán se desborde. El agua y el hielo vuelven piedra la lava por unos segundos.',
      spawns: [[860, 1000], [940, 1000]], sources: [S(500, 920, 'water'), S(1300, 920, 'wind'), S(400, 660, 'water'), S(1400, 420, 'water'), S(900, 680, 'fire')],
      paint(T) { all(T, TT.DIRT); for (const y of [820, 560, 300]) rect(T, 0, y - 40, 1800, y + 40, TT.LAVA); for (const [x, y] of [[300, 680], [1500, 680], [600, 430], [1200, 430], [400, 180], [1400, 180]]) circ(T, x, y, 22, TT.ROCK); border(T); },
      objs: [{ t: 'exit', x: 900, y: 110 }], goal: () => true, label: G => 'Suban al cráter: enfríen la lava con agua o hielo', checkpoints: [[900, 700], [900, 440], [900, 180]],
      script(G, dt) { G.cs.wt = (G.cs.wt || 6) - dt; if (G.cs.wt <= 0) { G.cs.wt = 13; const top = Math.min(...G.mages.filter(m => m.alive).map(m => m.y)); wave(G, ['magma', 'magma'], [[200, clamp(top - 200, 120, 1000)], [1600, clamp(top - 200, 120, 1000)]]); } } },
    { id: 'c10', name: 'Tragaluz', place: 'Laguna de Guatavita', kind: 'Jefe final', theme: 'paramo', W: 1700, H: 1000, par: 260, boss: 'tragaluz', dark: 1,
      text: 'Tragaluz se come la luz. Enciendan los cuatro braseros para quitarle la niebla y tumbarlo. Él los apaga con su aliento: ¡vuelvan a prenderlos!',
      spawns: [[220, 460], [220, 560]], sources: [S(300, 200, 'fire'), S(1400, 800, 'fire'), S(300, 800, 'bolt'), S(1400, 200, 'water'), S(850, 900, 'wind')],
      paint(T) { all(T, TT.GRASS); ell(T, 850, 480, 230, 160, TT.SHALLOW); bushes(T, [[120, 120], [1580, 120], [120, 880], [1580, 880]]); border(T); },
      objs: [{ t: 'brazier', x: 520, y: 240 }, { t: 'brazier', x: 1180, y: 240 }, { t: 'brazier', x: 520, y: 740 }, { t: 'brazier', x: 1180, y: 740 }],
      goal: G => G.boss && !G.boss.alive, label: G => { const n = G.objs.filter(o => o.t === 'brazier' && o.lit).length; return n < 3 ? `Enciendan los braseros: ${n}/4 (con 3 se le cae la niebla)` : '¡Sin niebla: péguenle!'; }, autoWin: true },
    /* ================= MUNDO 2 — «El Reino de Arriba y el de Abajo» ================= */
    { id: 'c11', world: 2, name: 'La escalera de nubes', place: 'Islas del cielo', kind: 'Ingenio y lucha', theme: 'cielo', W: 2200, H: 1000, par: 170,
      text: 'La sombra de Tragaluz huyó al cielo. Beban LUZ de la fuente y alumbren los dos prismas casi al tiempo: se tenderá un puente de luz entre las islas.',
      spawns: [[240, 460], [240, 560]], sources: [S(170, 330, 'light'), S(170, 690, 'wind'), S(1000, 420, 'light'), S(1200, 600, 'shadow')],
      paint(T) { all(T, TT.CHASM); ell(T, 360, 500, 310, 330, TT.GRASS); ell(T, 1100, 500, 290, 350, TT.GRASS); ell(T, 1850, 500, 300, 320, TT.GRASS); circ(T, 1100, 500, 110, TT.STONE); circ(T, 1850, 500, 90, TT.STONE); bushes(T, [[300, 260], [420, 760], [1000, 220], [1220, 800], [1760, 280], [1960, 720]]); },
      objs: [{ t: 'prism', x: 520, y: 320, g: 1 }, { t: 'prism', x: 520, y: 680, g: 1 }, { t: 'bridge', under: TT.CHASM, rect: [650, 460, 830, 560], cond: G => G.objs.filter(o => o.t === 'prism' && o.g === 1).every(o => o.power > 0) },
        { t: 'prism', x: 1100, y: 250, g: 2 }, { t: 'prism', x: 1100, y: 750, g: 2 }, { t: 'bridge', under: TT.CHASM, rect: [1370, 460, 1570, 560], cond: G => G.objs.filter(o => o.t === 'prism' && o.g === 2).every(o => o.power > 0) }, { t: 'exit', x: 1900, y: 500 }],
      goal: G => G.objs.filter(o => o.t === 'bridge').every(o => o.open),
      label: G => { const B = G.objs.filter(o => o.t === 'bridge'); return !B[0].open ? 'Alumbren los dos prismas con LUZ casi al tiempo' : !B[1].open ? 'Otros dos prismas: ¡cuidado con las centellas!' : '¡A la salida!'; },
      script(G) { const B = G.objs.filter(o => o.t === 'bridge'); if (B[0].open && !G.cs.w1 && G.mages.some(m => m.alive && m.x > 860)) { G.cs.w1 = 1; wave(G, ['centella', 'centella', 'arpia'], [[1100, 300], [1100, 700], [1250, 500]]); } if (B[1].open && !G.cs.w2 && G.mages.some(m => m.alive && m.x > 1600)) { G.cs.w2 = 1; wave(G, ['nimbo', 'centella', 'centella'], [[1900, 300], [1800, 700], [2000, 600]]); } },
      hint: 'La Luz atraviesa y encandila; a las centellas las tumba la Sombra.' },
    { id: 'c12', world: 2, name: 'El jardín colgante', place: 'Islas del cielo', kind: 'Lucha', theme: 'cielo', W: 1700, H: 1100, par: 210,
      text: 'Protejan el Árbol de Luz durante cinco oleadas. Cuando sople la ráfaga, caminen contra el viento: ¡no se dejen llevar al vacío!',
      spawns: [[760, 560], [940, 560]], sources: [S(480, 300, 'light'), S(1220, 800, 'shadow'), S(480, 800, 'earth'), S(1220, 300, 'bolt'), S(850, 900, 'wind')],
      paint(T) { all(T, TT.CHASM); ell(T, 850, 550, 720, 450, TT.GRASS); circ(T, 850, 550, 110, TT.STONE); bushes(T, [[420, 520], [1280, 580], [700, 240], [1000, 860], [560, 760], [1140, 340]]); },
      objs: [{ t: 'lantern', look: 'tree', x: 850, y: 550, hp: 420 }],
      waves: [['centella', 'centella', 'centella', 'arpia'], ['arpia', 'arpia', 'centella', 'centella', 'centella'], ['nimbo', 'centella', 'arpia', 'centella', 'arpia'], ['nimbo', 'nimbo', 'arpia', 'arpia', 'centella', 'centella'], ['arpia', 'arpia', 'arpia', 'nimbo', 'nimbo', 'centella', 'centella']],
      goal: G => G.cs.wave >= 5 && !G.units.some(u => u instanceof Creature && u.alive && u.team === 9), autoWin: true,
      label: G => (G.cs.gust > 0 ? '¡RÁFAGA! Caminen contra el viento · ' : '') + `Defiendan el Árbol de Luz · oleada ${Math.min(5, (G.cs.wave || 0) + ((G.cs.wave || 0) < 5 ? 1 : 0))}/5`,
      script(G, dt) { if (G.cs.wave == null) { G.cs.wave = 0; G.cs.wt = 3; G.cs.gt = 15; } const live = G.units.some(u => u instanceof Creature && u.alive && u.team === 9);
        if (!live && G.cs.wave < 5) { G.cs.wt -= dt; if (G.cs.wt <= 0) { wave(G, this.waves[G.cs.wave], ring(G, 850, 550, 560, 330)); G.cs.wave++; G.cs.wt = 3; G.pops.push({ x: 0, y: 0, text: `Oleada ${G.cs.wave}`, t: 0, color: '#ffd9a0', big: true, screen: true }); } }
        gusts(G, dt, 15, 60); } },
    { id: 'c13', world: 2, name: 'Los sellos del alba', place: 'Templo del sol', kind: 'Ingenio', theme: 'cielo', W: 1900, H: 1100, par: 230,
      text: 'Tres sellos de luz. Cada uno pide una fusión con LUZ: traigan los elementos de las fuentes y fúndanlos (o crucen sus hechizos) sobre el sello.',
      spawns: [[260, 500], [260, 600]], sources: [S(420, 260, 'light'), S(420, 840, 'water'), S(950, 200, 'earth'), S(950, 900, 'light'), S(1480, 260, 'wind'), S(1480, 840, 'light')],
      paint(T) { all(T, TT.CHASM); ell(T, 950, 550, 840, 470, TT.STONE); ell(T, 950, 550, 760, 400, TT.GRASS); rect(T, 300, 500, 1600, 600, TT.STONE); rect(T, 900, 200, 1000, 900, TT.STONE); circ(T, 620, 330, 58, TT.CHASM); circ(T, 1280, 770, 58, TT.CHASM); bushes(T, [[520, 700], [1380, 400], [760, 800], [1140, 300]]); },
      objs: [{ t: 'seal', x: 640, y: 560, need: 'water+light' }, { t: 'seal', x: 950, y: 360, need: 'earth+light' }, { t: 'seal', x: 1260, y: 560, need: 'wind+light' }, { t: 'exit', x: 1620, y: 550 }],
      goal: G => G.objs.filter(o => o.t === 'seal').every(o => o.done),
      label: G => { const n = G.objs.filter(o => o.t === 'seal' && o.done).length; return n < 3 ? `Abran los sellos con la fusión de luz que piden (${n}/3)` : '¡A la salida!'; },
      script(G, dt) { G.cs.wt = (G.cs.wt || 10) - dt; if (G.cs.wt <= 0) { G.cs.wt = 17; const n = G.objs.filter(o => o.t === 'seal' && o.done).length; wave(G, [['centella', 'centella'], ['arpia', 'centella'], ['nimbo', 'centella'], ['nimbo', 'arpia']][n], [[950, 760], [1100, 400]]); } },
      hint: 'Prisma = agua + luz · Jaula de cristal = tierra + luz · Espejismo = viento + luz.' },
    { id: 'c14', world: 2, name: 'El Cóndor de Oro', place: 'La cumbre del cielo', kind: 'Jefe', theme: 'cielo', W: 1700, H: 1050, par: 210, boss: 'condor',
      text: 'El guardián del cielo fue cegado por la sombra. En el aire casi no le duele nada: encandílenlo con LUZ (tres golpes) para que caiga, o esperen a que aterrice tras su picada.',
      spawns: [[300, 480], [300, 580]], sources: [S(260, 300, 'light'), S(1440, 760, 'light'), S(850, 170, 'shadow'), S(850, 880, 'wind'), S(1440, 300, 'bolt'), S(260, 760, 'earth')],
      paint(T) { all(T, TT.CHASM); ell(T, 850, 525, 770, 450, TT.GRASS); circ(T, 850, 525, 150, TT.STONE); bushes(T, [[520, 300], [1180, 760], [520, 760], [1180, 300]]); },
      objs: [], goal: G => G.boss && !G.boss.alive, autoWin: true,
      label: G => !G.boss ? '' : G.boss.grounded > 0 ? '¡Está en el suelo: con todo!' : `Encandílenlo con LUZ (${Math.min(3, G.boss.glare | 0)}/3) o esquiven su picada` },
    { id: 'c15', world: 2, name: 'La boca del infierno', place: 'El Reino de Abajo', kind: 'Lucha e ingenio', theme: 'infierno', W: 2000, H: 1100, par: 200,
      text: 'La sombra bajó al abismo. Los obeliscos oscuros crían diablillos: solo la LUZ los rompe. Cuando la lava crezca, aléjense del río.',
      spawns: [[180, 260], [180, 340]], sources: [S(330, 200, 'light'), S(330, 900, 'water'), S(1000, 280, 'light'), S(1000, 860, 'shadow'), S(1700, 880, 'light')],
      paint(T) { all(T, TT.DIRT); rect(T, 0, 500, 2000, 600, TT.LAVA); rect(T, 380, 500, 520, 600, TT.STONE); rect(T, 900, 500, 1020, 600, TT.STONE); rect(T, 1260, 500, 1400, 600, TT.STONE); for (const [x, y] of [[700, 300], [1500, 760], [860, 820], [1180, 240], [240, 700], [1760, 340]]) circ(T, x, y, 24, TT.ROCK); border(T); },
      objs: [{ t: 'obelisk', x: 640, y: 780 }, { t: 'obelisk', x: 1120, y: 280 }, { t: 'obelisk', x: 1600, y: 780 }, { t: 'exit', x: 1860, y: 280 }],
      goal: G => G.objs.filter(o => o.t === 'obelisk').every(o => !o.u.alive),
      label: G => { const n = G.objs.filter(o => o.t === 'obelisk' && !o.u.alive).length; if (n >= 3 && !G.cs.clean) { G.cs.clean = 1; for (const u of G.units) if (u instanceof Creature && u.alive) { u.alive = false; G.fx.push({ type: 'flashRing', x: u.x, y: u.y, el: 'light', r: 60 }); } G.pops.push({ x: 0, y: 0, text: '¡Los diablillos se desvanecen!', t: 0, color: '#ffe9a0', big: true, screen: true }); } return (G.cs.tide > 0 ? '¡SUBE LA LAVA! Lejos del río · ' : '') + (n < 3 ? `Rompan los obeliscos con LUZ (${n}/3)` : '¡A la salida!'); },
      script(G, dt) { G.cs.tt = (G.cs.tt == null ? 12 : G.cs.tt) - dt; if (G.cs.tide > 0) { G.cs.tide -= dt; if (G.cs.tide <= 2.2 && !G.cs.up) { G.cs.up = 1; for (const i of cellsRect(G.T, 0, 420, 2000, 680)) if (G.T.base[i] !== TT.STONE && G.T.base[i] !== TT.LAVA && G.T.base[i] !== TT.ROCK) G.T.lava[i] = 2.2; G.T.ver++; G.events.push({ type: 'quake', x: 1000, y: 550 }); } }
        else if (G.cs.tt <= 0) { G.cs.tt = 14; G.cs.tide = 4.4; G.cs.up = 0; G.pops.push({ x: 0, y: 0, text: '¡Sube la lava!', t: 0, color: '#ff9a5a', big: true, screen: true }); G.events.push({ type: 'arenaEvent', ev: 'breath' }); } },
      tideRect: [0, 420, 2000, 680], hint: 'Los diablillos caen con agua. La lava crecida dura poco: esperen lejos del río.' },
    { id: 'c16', world: 2, name: 'El puente de huesos', place: 'El Reino de Abajo', kind: 'Lucha e ingenio', theme: 'infierno', W: 2400, H: 1000, par: 220,
      text: 'Lleven el Ánima hasta el otro lado: avanza si hay alguien cerca. Rompan las murallas de hueso y cuídenla de calaveras y sombras (la LUZ las deshace). ¡Ojo con las fosas!',
      spawns: [[160, 440], [160, 580]], sources: [S(520, 380, 'light'), S(1100, 640, 'fire'), S(1650, 380, 'light'), S(900, 380, 'earth'), S(2100, 640, 'shadow')],
      paint(T) { all(T, TT.CHASM); rect(T, 0, 360, 2400, 660, TT.DIRT); for (const [x, y] of [[420, 340], [980, 680], [1500, 340], [2040, 680], [1260, 680], [700, 340]]) circ(T, x, y, 50, TT.CHASM); rect(T, 0, 470, 2400, 550, TT.STONE); },
      objs: [{ t: 'canoe', look: 'soul', x: 140, y: 510, hp: 240, path: [[140, 510], [2280, 510]] }, { t: 'rocks', x: 700 }, { t: 'rocks', x: 1300 }, { t: 'rocks', x: 1900 }],
      goal: G => G.objs.find(o => o.t === 'canoe').x >= 2240, autoWin: true,
      label: G => { const c = G.objs.find(o => o.t === 'canoe'); return c.blocked ? '¡Rompan la muralla de hueso!' : c.moving ? 'El Ánima avanza: defiéndanla' : 'Acérquense al Ánima para que avance'; },
      script(G, dt) { const c = G.objs.find(o => o.t === 'canoe'); G.cs.bt = (G.cs.bt || 7) - dt; if (G.cs.bt <= 0) { G.cs.bt = 12; wave(G, c.x > 1200 ? ['calavera', 'sombra', 'sombra'] : ['sombra', 'sombra'], [[c.x + 320, 400], [c.x + 320, 620], [c.x - 260, 510]]); }
        G.cs.pt = (G.cs.pt || 10) - dt; if (G.cs.pt <= 0) { G.cs.pt = 13; const L = G.mages.filter(m => m.alive); if (L.length) { const m = L[(G.rng() * L.length) | 0]; foeCast(G, m.x + m.vx * 0.4, m.y + m.vy * 0.4, Object.assign({}, FUSIONS['earth+shadow'], { range: 1, delay: 1.0 }), 'earth+shadow'); } } } },
    { id: 'c17', world: 2, name: 'El coliseo de ceniza', place: 'El Reino de Abajo', kind: 'Lucha', theme: 'infierno', W: 1700, H: 1050, par: 230,
      text: 'Cinco oleadas en el coliseo. Caen rocas ardientes del techo (miren los círculos) y al final sale Cerbero: esquiven su embestida.',
      spawns: [[760, 520], [940, 520]], sources: [S(420, 260, 'light'), S(1280, 790, 'light'), S(420, 790, 'water'), S(1280, 260, 'shadow'), S(850, 180, 'earth')],
      paint(T) { all(T, TT.DIRT); circ(T, 850, 525, 180, TT.STONE); for (const [x, y] of [[420, 525], [1280, 525], [850, 880]]) circ(T, x, y, 62, TT.LAVA); for (const [x, y] of [[600, 300], [1100, 300], [600, 760], [1100, 760]]) circ(T, x, y, 22, TT.ROCK); border(T); },
      objs: [], waves: [['diablillo', 'diablillo', 'sombra', 'sombra'], ['calavera', 'calavera', 'diablillo', 'diablillo', 'sombra'], ['magma', 'magma', 'calavera', 'diablillo', 'diablillo'], ['calavera', 'calavera', 'sombra', 'sombra', 'magma', 'diablillo'], ['cerbero', 'diablillo', 'diablillo', 'calavera']],
      goal: G => G.cs.wave >= 5 && !G.units.some(u => u instanceof Creature && u.alive && u.team === 9), autoWin: true,
      label: G => `Sobrevivan al coliseo · oleada ${Math.min(5, (G.cs.wave || 0) + ((G.cs.wave || 0) < 5 ? 1 : 0))}/5` + ((G.cs.wave || 0) >= 5 ? ' · ¡CERBERO!' : ''),
      script(G, dt) { if (G.cs.wave == null) { G.cs.wave = 0; G.cs.wt = 3; G.cs.mt = 9; } const live = G.units.some(u => u instanceof Creature && u.alive && u.team === 9);
        if (!live && G.cs.wave < 5) { G.cs.wt -= dt; if (G.cs.wt <= 0) { wave(G, this.waves[G.cs.wave], edges(G)); G.cs.wave++; G.cs.wt = 3; G.pops.push({ x: 0, y: 0, text: G.cs.wave === 5 ? '¡Cerbero!' : `Oleada ${G.cs.wave}`, t: 0, color: '#ffb08a', big: true, screen: true }); } }
        G.cs.mt -= dt; if (G.cs.mt <= 0) { G.cs.mt = 7.5; for (const m of G.mages) if (m.alive && G.rng() < 0.7) foeCast(G, m.x + (G.rng() - 0.5) * 120, m.y + (G.rng() - 0.5) * 120, Object.assign({}, FUSIONS['fire+earth'], { range: 1, flight: 1.25, dmg: 14, pool: { r: 46, life: 2.5, dps: 8 } }), 'fire+earth'); } } },
    { id: 'c18', world: 2, name: 'Buziraco', place: 'El trono del abismo', kind: 'Jefe final', theme: 'infierno', W: 1800, H: 1100, par: 280, boss: 'buziraco', dark: 1,
      text: 'Buziraco, señor del abismo, se tragó la sombra de Tragaluz. Su coraza de sombra solo se rompe con LUZ. Rota la coraza: ¡con todo! Esquiven las fosas y la lluvia de fuego.',
      spawns: [[260, 500], [260, 600]], sources: [S(300, 240, 'light'), S(1500, 860, 'light'), S(900, 930, 'light'), S(300, 860, 'water'), S(1500, 240, 'wind'), S(900, 170, 'earth')],
      paint(T) { all(T, TT.DIRT); circ(T, 900, 550, 200, TT.STONE); for (const [x, y] of [[520, 330], [1280, 770], [520, 770], [1280, 330]]) circ(T, x, y, 22, TT.ROCK); border(T); },
      objs: [], goal: G => G.boss && !G.boss.alive, autoWin: true,
      label: G => !G.boss ? '' : G.boss.shield > 0 ? 'Rompan la coraza de sombra con LUZ' : '¡Sin coraza: péguenle con todo!' },
  ];
  /* ---------- arranque de un nivel ---------- */
  function build(G, L) {
    G.A = { id: L.id, name: L.name, sub: L.place, W: L.W, H: L.H, spawns: L.spawns, sources: L.sources, theme: L.theme, event: null, statues: L.statues, current: L.current };
    G.arena = 'camp-' + L.id; ArtGround.cache[G.arena] = null; G.T = Terrain.make(L.W, L.H); G.T.bridgeUnder = L.theme === 'cielo' || L.theme === 'infierno' ? TT.CHASM : TT.DEEP; G.T.noBurnBridge = L.theme === 'cielo'; L.paint(G.T);
    G.sources = L.sources.map(s => Object.assign({ cd: 0, glow: 0 }, s));
    for (const s of G.sources) Terrain.forCircle(G.T, s.x, s.y, 34, i => { if (G.T.base[i] !== TT.DEEP) G.T.base[i] = TT.STONE; });
    G.T.ver++;
  }
  function setup(G) {
    const L = LEVELS[G.campLevel]; G.L = L; G.cs = {}; G.coop = true; G.lives = L.boss ? 6 : 5; G.objs = []; G.boss = null; G.checkpoint = L.spawns[0].slice();
    G.hpMul = G.players === 1 ? 0.8 : 1; G.biteMul = 1;
    for (const m of G.mages) { m.team = 0; m.spawn = m.spawn || [m.x, m.y]; }
    if (L.mist) { G.mist = 1; G.A.event = null; }
    G.ring = null;
    for (const d of L.objs) {
      const o = Object.assign({}, d);
      if (o.t === 'stone') { const u = Modes.pushable(G, o.x, o.y, 'stone', 22); o.u = u; }
      if (o.t === 'door' || o.t === 'bridge') { o.cells = cellsRect(G.T, ...o.rect); o.open = false; for (const i of o.cells) G.T.base[i] = o.t === 'door' ? TT.ROCK : o.under || TT.DEEP; }
      if (o.t === 'prism') o.power = 0;
      if (o.t === 'obelisk') { const u = new Unit(o.x, o.y, 22, 9); Object.assign(u, { obj: 'obelisk', idx: -1, hp: 90 * (G.players === 1 ? 0.8 : 1), maxHp: 90 * (G.players === 1 ? 0.8 : 1), knockMul: 0, keep: true, el: 'shadow', denyT: -9 });
        u.hurt = function (G2, dmg, src = {}) { if (!this.alive) return 0; if (src.el !== 'light') { if (G2.time - this.denyT > 2.5 && !src.dot) { this.denyT = G2.time; G2.pops.push({ x: this.x, y: this.y - 90, text: 'Solo la LUZ lo rompe', t: 0, color: '#ffe9a0', small: true }); } return 0; } this.hp -= dmg; this.flash = 0.12; G2.events.push({ type: 'hurt', x: this.x, y: this.y - 30, dmg, el: 'light', who: -1, unit: this }); if (this.hp <= 0) { this.alive = false; this.hp = 0; G2.fx.push({ type: 'boom', x: this.x, y: this.y - 30, r: 110, el: 'shadow' }); G2.fx.push({ type: 'flashRing', x: this.x, y: this.y, el: 'light', r: 150 }); G2.pops.push({ x: this.x, y: this.y - 90, text: '¡Obelisco roto!', t: 0, color: '#ffe9a0', big: true }); G2.events.push({ type: 'seal', x: this.x, y: this.y }); } return dmg; };
        o.u = u; o.sp = 5; G.units.push(u); }
      if (o.t === 'sprout') { o.list = cellsRect(G.T, ...o.cells); o.grown = false; }
      if (o.t === 'lantern' || o.t === 'canoe') { o.maxHp = o.hp; }
      if (o.t === 'canoe') { o.moving = false; o.blocked = false; }
      if (o.t === 'rocks') { o.cells = cellsRect(G.T, o.x - 20, 440, o.x + 20, 580); for (const i of o.cells) { G.T.wall[i] = 70; G.T.wallT[i] = 9999; } }
      if (o.t === 'totem') o.power = 0;
      G.objs.push(o);
    }
    if (L.boss) spawnBoss(G, L.boss);
    G.T.ver++;
  }
  function edges(G) { const W = G.T.W, H = G.T.H; return [[80, 80], [W - 80, 80], [80, H - 80], [W - 80, H - 80], [W / 2, 70], [W / 2, H - 70]]; }
  function wave(G, kinds, spots) {
    spots = spots || edges(G);
    kinds.forEach((k, j) => { let [x, y] = spots[j % spots.length]; x += (G.rng() - 0.5) * 60; y += (G.rng() - 0.5) * 60; const [sx, sy] = Arena.safeNear(G, x, y); const c = new Creature(G, k, sx, sy); G.units.push(c); });
  }
  /* ---------- jefes ---------- */
  const BOSS = {
    madremonte: { name: 'La Madremonte', hp: 520, r: 44, shield: 160, look: 'madremonte' },
    mohan: { name: 'El Mohán', hp: 680, r: 40, look: 'mohan' },
    tragaluz: { name: 'Tragaluz', hp: 1100, r: 52, look: 'tragaluz' },
    condor: { name: 'El Cóndor de Oro', hp: 1000, r: 46, look: 'condor' },
    buziraco: { name: 'Buziraco', hp: 920, r: 54, shield: 150, look: 'buziraco' },
  };
  function spawnBoss(G, k) {
    const D = BOSS[k], W = G.T.W, H = G.T.H;
    const b = new Unit(k === 'mohan' ? 850 : W * 0.66, H / 2, D.r, 9); Object.assign(b, { boss: k, D, idx: -1, hp: D.hp * (G.players === 1 ? 0.75 : 1), maxHp: D.hp * (G.players === 1 ? 0.75 : 1), shield: D.shield || 0, maxShield: D.shield || 0, t: 0, cd: 2.5, phase: 0, knockMul: 0.08, el: { mohan: 'water', tragaluz: 'bolt', condor: 'wind', buziraco: 'shadow' }[k] || 'plant' });
    if (k === 'condor') { b.x = W / 2 + 330; b.y = H / 2; b.orb = 0; b.glare = 0; b.grounded = 0; b.fly = 1; }
    if (k === 'buziraco') { b.x = W * 0.62; }
    b.hurt = function (G, dmg, src = {}) {
      if (!this.alive) return 0; let d = dmg;
      if (this.boss === 'madremonte') { if (this.shield > 0) { if (src.el === 'fire' || src.el === 'lava') { this.shield -= d * 1.1; if (this.shield <= 0) { this.shield = 0; this.stun(4); this.regrow = 9; G.pops.push({ x: this.x, y: this.y - 120, text: '¡Sin lianas!', t: 0, color: '#ffd25a', big: true }); } } return 0; } if (src.el === 'bolt') d *= 1.7; }
      if (this.boss === 'mohan') d *= this.st.frozen > 0 ? 2.2 : this.st.chill > 0 ? 1.3 : 0.32;
      if (this.boss === 'tragaluz' && !this.exposed) { this.flash = 0.05; return 0; }
      if (this.boss === 'condor') { if (this.grounded > 0) d *= this.dazed ? 1.25 : 1; else { d *= 0.3; if (src.el === 'light' && !src.dot && !(this.glareCd > 0)) { this.glare += 1; this.glareT = 5; G.fx.push({ type: 'dazzle', x: this.x, y: this.y - 90 }); if (this.glare >= 3) { this.glare = 0; this.glareCd = 11; this.grounded = 4.2; this.dazed = 1; this.tele = null; this.dive = null; this._selfStun = 1; this.stun(4.6); this._selfStun = 0; G.pops.push({ x: this.x, y: this.y - 150, text: '¡Encandilado!', t: 0, color: '#ffe9a0', big: true }); G.events.push({ type: 'bossExposed', x: this.x, y: this.y }); G.fx.push({ type: 'flashRing', x: this.x, y: this.y, el: 'light', r: 170 }); } } } }
      if (this.boss === 'buziraco' && this.shield > 0) { if (src.el === 'light') { this.shield -= d * 1.15; this.flash = 0.08; G.fx.push({ type: 'dazzle', x: this.x + (Math.random() - 0.5) * 50, y: this.y - 60 - Math.random() * 60 }); if (this.shield <= 0) { this.shield = 0; this.tele = null; this._selfStun = 1; this.stun(3.6); this._selfStun = 0; this.regrow = 14; G.pops.push({ x: this.x, y: this.y - 150, text: '¡Sin coraza!', t: 0, color: '#ffe9a0', big: true }); G.events.push({ type: 'bossExposed', x: this.x, y: this.y }); G.fx.push({ type: 'flashRing', x: this.x, y: this.y, el: 'light', r: 190 }); } } else if (!src.dot && G.time - (this.denyT || -9) > 3) { this.denyT = G.time; G.pops.push({ x: this.x, y: this.y - 150, text: 'La coraza solo cede ante la LUZ', t: 0, color: '#e6b8ff', small: true }); } return 0; }
      this.hp -= d; this.flash = 0.1; if (src.by >= 0 && G.mages[src.by]) { G.mages[src.by].stats.dmg += d; G.mages[src.by].gainEmb(G, d * 0.3); }
      G.events.push({ type: 'hurt', x: this.x, y: this.y - 40, dmg: d, el: src.el, dot: !!src.dot, who: -1, unit: this });
      if (this.hp <= 0) { this.alive = false; this.hp = 0; G.events.push({ type: 'bossDown', x: this.x, y: this.y }); G.fx.push({ type: 'boom', x: this.x, y: this.y - 30, r: 160, el: this.el }); G.slow = 1.2; }
      return d;
    };
    const caster = { get x() { return b.x; }, get y() { return b.y; }, idx: -1, team: 9, tr: {}, st: { hidden: 0, blind: 0 }, face: 0,
      aim(G, range) { let t = null, bd = 1e9; for (const m of G.mages) if (m.alive) { const d = hypot(m.x - b.x, m.y - b.y); if (d < bd) { bd = d; t = m; } } const ang = t ? Math.atan2(t.y - b.y, t.x - b.x) : 0; this.face = ang; return { ang, target: t, dist: bd }; } };
    b.cast = (S, el, o = {}) => { caster.aim(G, 999); Spells.cast(G, caster, S, el, Object.assign({ power: 1, size: 1 }, o)); };
    // aviso antes de atacar: el jefe se detiene y brilla con el color del ataque
    // aguantan mejor los aturdidos de los hechizos (si no, casi no alcanzan a atacar)
    if (k !== 'madremonte') { b.stunRes = k === 'condor' || k === 'buziraco' ? 0.3 : 0.35; b.stun = function (t) { Unit.prototype.stun.call(this, t * (this._selfStun ? 1 : this.stunRes)); }; }
    if (k === 'mohan') b.freeze = function (G, t, by) { Unit.prototype.freeze.call(this, G, t * 1.8, by); };
    b.warn = (t, el, fn) => { b.tele = { t, max: t, el, fn }; G.events.push({ type: 'bossWarn', x: b.x, y: b.y, el }); };
    b.update = function (G, dt) {
      this.t += dt; this.tickStatus(G, dt); if (!this.alive) return;
      const f = 1 - this.hp / this.maxHp; this.phase = f > 0.66 ? 2 : f > 0.33 ? 1 : 0;
      let tgt = null, bd = 1e9; for (const m of G.mages) if (m.alive) { const d = hypot(m.x - this.x, m.y - this.y); if (d < bd) { bd = d; tgt = m; } }
      if (this.boss === 'madremonte') {
        if (this.regrow > 0) { this.regrow -= dt; if (this.regrow <= 0) { this.shield = this.maxShield * 0.65; G.pops.push({ x: this.x, y: this.y - 120, text: 'Las lianas vuelven a crecer', t: 0, color: '#9fe07a', small: true }); } }
        if (!this.busy && tgt) { const dx = tgt.x - this.x, dy = tgt.y - this.y, d = hypot(dx, dy) || 1; if (d > 260) { this.x += dx / d * 45 * dt; this.y += dy / d * 45 * dt; } }
        this.cd -= dt; if (this.cd <= 0 && !this.busy) { this.cd = [2.6, 2.1, 1.7][this.phase]; const r = G.rng(); if (r < 0.45) this.cast({ name: 'Tronco', kind: 'proj', cd: 0, speed: 430, r: 22, life: 2, dmg: 13, stun: 0.3, knock: 340, heavy: 1 }, 'earth'); else if (r < 0.75) this.cast(SPELLS.plant[1], 'plant', { size: 1.4 }); else wave(G, ['bruma', 'bruma'].slice(0, 1 + this.phase), [[this.x - 120, this.y], [this.x + 120, this.y]]); }
      } else if (this.boss === 'mohan') {
        // 2.0: avisa antes de atacar (brazos arriba + brillo del elemento), menos alcance de tormenta y congelado más largo
        this.st.wet = 2; if (this.imm && this.imm.frozen > 0.5) this.imm.frozen = 0.5;
        const ty = tgt ? clamp(tgt.y, 140, G.T.H - 140) : G.T.H / 2; if (!this.busy && !this.tele) { this.y += clamp(ty - this.y, -70 * dt, 70 * dt); this.x = 850 + Math.sin(this.t * 0.7) * 60; }
        if (this.tele) { if (this.busy) this.tele = null; else { this.tele.t -= dt; if (this.tele.t <= 0) { const fn = this.tele.fn; this.tele = null; fn(); } } }
        else { this.cd -= dt; if (this.cd <= 0 && !this.busy) { this.cd = [3.3, 2.8, 2.35][this.phase]; const r = G.rng(), stormUp = G.spells.some(q => q.t === 'storm' && q.by === -1 && !q.dead);
          if (r < 0.3) this.warn(0.6, 'wind', () => this.cast(Object.assign({}, SPELLS.wind[1], { dps: 8 }), 'wind'));
          else if (r < 0.55 && !stormUp) this.warn(0.75, 'bolt', () => this.cast(Object.assign({}, FUSIONS['water+bolt'], { range: 620 }), 'water+bolt', { fusion: 'water+bolt' }));
          else if (r < 0.9) this.warn(0.65, 'water', () => this.cast(SPELLS.water[1], 'water', { size: 1.2 }));
          else wave(G, ['caiman'], [[this.x, this.y + 150]]); } }
      } else if (this.boss === 'tragaluz') {
        // 2.0: el aliento se anuncia (inhala 2 s) y apaga como mucho dos braseros; al quedar sin niebla se aturde un momento;
        // el pulso pega una sola vez por mago y se puede esquivar (rodar a través)
        const lit = G.objs.filter(o => o.t === 'brazier' && o.lit).length, was = this.exposed; this.exposed = lit >= 3;
        if (this.exposed && !was) { this._selfStun = 1; this.stun(0.9); this._selfStun = 0; this.tele = null; this.inhale = 0; G.pops.push({ x: this.x, y: this.y - 150, text: '¡Sin niebla!', t: 0, color: '#ffe9a0', big: true }); G.events.push({ type: 'bossExposed', x: this.x, y: this.y }); }
        if (!this.busy && tgt && !this.tele) { this.x += Math.cos(this.t * 0.5) * 30 * dt; this.y += Math.sin(this.t * 0.8) * 24 * dt; }
        if (this.inhale > 0) { this.inhale -= dt; if (this.inhale <= 0) { const L2 = G.objs.filter(o => o.t === 'brazier' && o.lit); let n = 0; for (let j = 0; j < 2 && L2.length; j++) { const o = L2.splice((G.rng() * L2.length) | 0, 1)[0]; if (G.rng() < 0.85) { o.lit = false; n++; } } if (n) { G.pops.push({ x: this.x, y: this.y - 140, text: '¡Apagó ' + (n > 1 ? 'dos braseros!' : 'un brasero!'), t: 0, color: '#c9b8ff', big: true }); G.events.push({ type: 'arenaEvent', ev: 'breath' }); } } }
        else { this.breath = (this.breath || 17) - dt; if (this.breath <= 0 && lit > 0 && !this.busy) { this.breath = [15, 13, 11][this.phase]; this.inhale = 2; G.pops.push({ x: this.x, y: this.y - 150, text: 'Tragaluz toma aire…', t: 0, color: '#c9b8ff', small: true }); } }
        if (this.tele) { if (this.busy) this.tele = null; else { this.tele.t -= dt; if (this.tele.t <= 0) { const fn = this.tele.fn; this.tele = null; fn(); } } }
        else if (!(this.inhale > 0)) { this.cd -= dt; if (this.cd <= 0 && !this.busy) { this.cd = [2.5, 2.1, 1.75][this.phase]; const r = G.rng();
          if (r < 0.3) this.warn(0.8, 'shadow', () => { this.pulse = 0.01; this.pulseHit = new Set(); this.pulse2 = this.phase >= 2 ? 0.55 : 0; });
          else if (r < 0.52) this.warn(0.7, 'fire', () => this.cast(Object.assign({}, FUSIONS['fire+bolt'], { dmg: 18, len: 900, windup: 0.5 }), 'fire+bolt', { fusion: 'fire+bolt' }));
          else if (r < 0.8) this.warn(0.5, 'bolt', () => { this.cast(SPELLS.bolt[1], 'bolt', { size: 1.15, power: 0.85 }); if (this.phase >= 1) for (const m of G.mages) if (m.alive && G.rng() < 0.6) Spells.cast(G, { x: m.x + (G.rng() - 0.5) * 160, y: m.y + (G.rng() - 0.5) * 160, idx: -1, team: 9, tr: {}, st: { hidden: 0, blind: 0 }, face: 0, aim(G2, rr) { return { ang: 0, target: null, dist: 0 }; } }, Object.assign({}, SPELLS.bolt[1], { range: 1 }), 'bolt', { power: 0.7, size: 0.9 }); });
          else wave(G, ['bruma', 'murcielago', 'bruma', 'murcielago'].slice(0, 2 + this.phase), [[this.x - 150, this.y], [this.x + 150, this.y], [this.x, this.y + 160]]); } }
        if (this.pulse2 > 0) { this.pulse2 -= dt; if (this.pulse2 <= 0 && !this.pulse) { this.pulse = 0.01; this.pulseHit = new Set(); } }
        if (this.pulse) { const pr = this.pulse * 480; this.pulse += dt; for (const m of G.mages) { if (!m.alive || this.pulseHit.has(m)) continue; const d = hypot(m.x - this.x, m.y - this.y); if (Math.abs(d - pr) < 26) { this.pulseHit.add(m); if (m.hurt(G, 16, { by: -1, el: 'shadow' }) > 0) m.knock(m.x - this.x, m.y - this.y, 260); } } if (pr > 760) this.pulse = 0; }
      } else if (this.boss === 'condor') {
        // vuela en círculo (casi no recibe daño); picada con aviso → aterriza y queda vulnerable; tres golpes de luz lo tumban
        const cx = G.T.W / 2, cy = G.T.H / 2;
        if (this.glareT > 0) { this.glareT -= dt; if (this.glareT <= 0) this.glare = 0; } if (this.glareCd > 0 && !(this.grounded > 0)) this.glareCd -= dt;
        if (this.grounded > 0) { this.grounded -= dt; this.fly = Math.max(0, this.fly - dt * 4); if (this.grounded <= 0) { this.dazed = 0; this.cd = 1.2; G.pops.push({ x: this.x, y: this.y - 140, text: 'Alza el vuelo', t: 0, color: '#ffe9a0', small: true }); } }
        else if (this.dive) { const D = this.dive; if (D.w > 0) { D.w -= dt; this.fly = Math.min(1, this.fly + dt * 3); if (D.w <= 0) G.events.push({ type: 'dash', who: -1, x: this.x, y: this.y }); }
          else { const st = 980 * dt; D.d -= st; this.x += D.dx * st; this.y += D.dy * st; this.fly = Math.max(0.15, this.fly - dt * 5); for (const m of G.mages) if (m.alive && !D.hit.has(m) && hypot(m.x - this.x, m.y - this.y) < this.r + m.r + 10) { D.hit.add(m); if (m.hurt(G, 18, { by: -1, el: 'wind' }) > 0) m.knock(-D.dy + D.dx * 0.4, D.dx + D.dy * 0.4, 520); } if (D.d <= 0) { this.dive = null; this.grounded = 2.7; G.events.push({ type: 'quake', x: this.x, y: this.y }); G.fx.push({ type: 'rubble', x: this.x, y: this.y }); G.pops.push({ x: this.x, y: this.y - 140, text: '¡Aterrizó!', t: 0, color: '#9fe07a', small: true }); } } }
        else { this.fly = Math.min(1, this.fly + dt * 1.5); this.orb += dt * (0.42 + this.phase * 0.08); const tx = cx + Math.cos(this.orb) * 420, ty = cy + Math.sin(this.orb) * 250; this.x += clamp(tx - this.x, -260 * dt, 260 * dt); this.y += clamp(ty - this.y, -260 * dt, 260 * dt);
          if (this.tele) { this.tele.t -= dt; if (this.tele.t <= 0) { const fn = this.tele.fn; this.tele = null; fn(); } }
          else { this.cd -= dt; if (this.cd <= 0 && tgt) { this.cd = [3.0, 2.6, 2.2][this.phase]; const r = G.rng();
            if (r < 0.34) { const a = Math.atan2(tgt.y - this.y, tgt.x - this.x), d = Math.min(760, hypot(tgt.x - this.x, tgt.y - this.y) + 170); this.dive = { w: 0.95, dx: Math.cos(a), dy: Math.sin(a), d, d0: d, x0: this.x, y0: this.y, hit: new Set() }; G.events.push({ type: 'bossWarn', x: this.x, y: this.y, el: 'wind' }); }
            else if (r < 0.66) this.warn(0.55, 'light', () => { const a0 = Math.atan2(tgt.y - this.y, tgt.x - this.x), n = 5 + this.phase * 2; for (let j = 0; j < n; j++) { const a = a0 + (j - (n - 1) / 2) * 0.2; G.spells.push({ t: 'proj', id: -60 - j, age: 0, S: { dmg: 8, dazzle: 0.5, speed: 520, r: 10, life: 1.8 }, by: -1, team: 9, el: 'light', feather: true, x: this.x + Math.cos(a) * 40, y: this.y + Math.sin(a) * 40, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, r: 10, life: 1.8, dmg: 8, power: 1, size: 1 }); } G.events.push({ type: 'cast', who: -1, el: 'light', kind: 'proj', x: this.x, y: this.y }); });
            else if (r < 0.86) this.warn(0.75, 'wind', () => { for (const m of G.mages) if (m.alive) { const d = hypot(m.x - this.x, m.y - this.y); if (d < 560) { m.hurt(G, 6, { by: -1, el: 'wind' }); m.knock(m.x - this.x, m.y - this.y, 620 * (1 - d / 800)); } } G.fx.push({ type: 'cone', x: this.x, y: this.y - 14, ang: 0, range: 560, half: Math.PI, el: 'wind', big: true }); G.events.push({ type: 'cast', who: -1, el: 'wind', kind: 'cone', x: this.x, y: this.y, level: 2 }); });
            else wave(G, ['centella', 'centella', 'arpia'].slice(0, 1 + this.phase), [[this.x - 100, this.y + 60], [this.x + 100, this.y + 60], [this.x, this.y - 80]]); } } }
      } else if (this.boss === 'buziraco') {
        // coraza de sombra (solo luz) → aturdido y vulnerable; fosas bajo los pies, lluvia de fuego, rayo negro y diablillos
        if (this.regrow > 0) { this.regrow -= dt; if (this.regrow <= 0) { this.shield = this.maxShield * 0.5; G.pops.push({ x: this.x, y: this.y - 150, text: 'La coraza vuelve a cerrarse', t: 0, color: '#e6b8ff', small: true }); } }
        if (!this.busy && tgt && !this.tele) { const dx = tgt.x - this.x, dy = tgt.y - this.y, d = hypot(dx, dy) || 1; if (d > 240) { this.x += dx / d * 42 * dt; this.y += dy / d * 42 * dt; } }
        if (this.tele) { if (this.busy) this.tele = null; else { this.tele.t -= dt; if (this.tele.t <= 0) { const fn = this.tele.fn; this.tele = null; fn(); } } }
        else { this.cd -= dt; if (this.cd <= 0 && !this.busy) { this.cd = [3.5, 3.1, 2.7][this.phase]; const r = G.rng(), L = G.mages.filter(m => m.alive), crowd = G.units.filter(u => u instanceof Creature && u.alive).length >= 2;
          if (r < 0.28) this.warn(0.6, 'fire', () => { for (const m of L) foeCast(G, m.x + m.vx * 0.5 + (G.rng() - 0.5) * 70, m.y + m.vy * 0.5 + (G.rng() - 0.5) * 70, Object.assign({}, FUSIONS['fire+earth'], { range: 1, flight: 1.15, dmg: 12, pool: { r: 42, life: 1.8, dps: 6 } }), 'fire+earth'); if (this.phase >= 2) foeCast(G, this.x + (G.rng() - 0.5) * 500, this.y + (G.rng() - 0.5) * 400, Object.assign({}, FUSIONS['fire+earth'], { range: 1, flight: 1.3, dmg: 16, pool: { r: 50, life: 3, dps: 8 } }), 'fire+earth'); });
          else if (r < 0.52) this.warn(0.5, 'shadow', () => { for (const m of (this.phase >= 2 ? L : L.slice().sort(() => G.rng() - 0.5).slice(0, 1))) foeCast(G, m.x + m.vx * 0.35, m.y + m.vy * 0.35, Object.assign({}, FUSIONS['earth+shadow'], { range: 1, delay: 0.95 }), 'earth+shadow'); });
          else if (r < 0.78 || crowd) this.warn(0.6, 'shadow', () => this.cast(Object.assign({}, FUSIONS['bolt+shadow'], { range: 760, dmg: 10, silence: 0.5 }), 'bolt+shadow', { fusion: 'bolt+shadow' }));
          else wave(G, ['diablillo', 'sombra', 'calavera'].slice(0, 1 + this.phase), [[this.x - 150, this.y + 40], [this.x + 150, this.y + 40], [this.x, this.y + 160]]); } }
        // última fase: la lava se come el borde del salón, anillo por anillo
        if (this.phase >= 2) { this.ringT = (this.ringT == null ? 2 : this.ringT) - dt; if (this.ringT <= 0 && (this.rings || 0) < 3) { this.ringT = 11; this.rings = (this.rings || 0) + 1; const T2 = G.T, k = this.rings; for (let r2 = 0; r2 < T2.rows; r2++) for (let c2 = 0; c2 < T2.cols; c2++) { const e = Math.min(c2, r2, T2.cols - 1 - c2, T2.rows - 1 - r2); if (e >= 1 && e <= k + 1 && T2.base[r2 * T2.cols + c2] !== TT.ROCK && T2.base[r2 * T2.cols + c2] !== TT.STONE) T2.lava[r2 * T2.cols + c2] = 9999; } T2.ver++; G.events.push({ type: 'quake', x: this.x, y: this.y }); G.pops.push({ x: 0, y: 0, text: '¡La lava cierra el salón!', t: 0, color: '#ff9a5a', big: true, screen: true }); } }
      }
      if (this.boss !== 'condor') this.collide(G.T);
      // tocarlo duele
      for (const m of G.mages) if (m.alive && !(this.boss === 'condor' && this.fly > 0.5) && hypot(m.x - this.x, m.y - this.y) < this.r + m.r && (!this.biteT || G.time - this.biteT > 0.8)) { this.biteT = G.time; m.hurt(G, 10, { by: -1, el: this.el }); m.knock(m.x - this.x, m.y - this.y, 420); }
    };
    G.boss = b; G.units.push(b);
  }
  // táctica de cada jefe (la usa la máquina compañera): qué elementos hacen falta y qué preferir
  function bossPlan(G, m, B) {
    if (B.boss === 'madremonte') return B.shield > 0 ? { need: ['fire'], prefer: 'fire' } : { prefer: 'bolt' };
    if (B.boss === 'mohan') return B.st.frozen > 0 ? {} : { need: ['water', 'wind'], fuse: true, fuseR: 240 };
    if (B.boss === 'tragaluz') return !B.exposed ? { need: ['fire'], lightJob: true } : {};
    if (B.boss === 'condor') return B.grounded > 0 ? {} : { need: ['light'], prefer: 'light' };
    if (B.boss === 'buziraco') return B.shield > 0 ? { need: ['light'], prefer: 'light' } : {};
    return null;
  }
  function levelPlan(G, m) {
    if (!G.objs) return null; const els = m.hands.map(h => h.el);
    const ob = G.objs.filter(o => o.t === 'obelisk' && o.u.alive).sort((a, b) => hypot(a.x - m.x, a.y - m.y) - hypot(b.x - m.x, b.y - m.y))[0];
    if (ob) return { need: ['light'], prefer: 'light', target: ob.u };
    if (G.objs.some(o => o.t === 'prism' && o.power <= 0) && !els.includes('light')) return { need: ['light'] };
    const seal = G.objs.filter(o => o.t === 'seal' && !o.done).sort((a, b) => hypot(a.x - m.x, a.y - m.y) - hypot(b.x - m.x, b.y - m.y))[0];
    if (seal) return { need: seal.need.split('+') };
    return null;
  }
  /* ---------- cada paso ---------- */
  function update(G, dt) {
    if (G.state !== 'play') return;
    const L = G.L; G.roundT += dt;
    // reaparecer junto al compañero (gasta una vida)
    for (const m of G.mages) {
      if (m.alive) continue; G.respawn[m.idx] += dt;
      if (G.respawn[m.idx] >= 3) { const o = G.mages.find(x => x.alive && x !== m); m.spawn = o ? Arena.safeNear(G, o.x, o.y, true) : G.checkpoint.slice(); /* nunca sobre lava enfriada, fuego o vacío */ G.respawn[m.idx] = 0; Game.revive(m); m.iframes = 2; }
    }
    // objetos (y puntos a los que la mira ayuda a apuntar)
    for (const o of G.objs) objStep(G, o, dt);
    G.aimSpots = G.objs.filter(o => (o.t === 'brazier' && !o.lit) || (o.t === 'prism' && o.power <= 0) || (o.t === 'sprout' && !o.grown) || o.t === 'totem' || (o.t === 'seal' && !o.done)).map(o => ({ x: o.x, y: o.y, vx: 0, vy: 0, r: 20, st: { hidden: 0 }, spot: true }));
    if (L.script) L.script.call(L, G, dt);
    // puntos de control
    if (L.checkpoints) for (const c of L.checkpoints) if (G.mages.some(m => m.alive && hypot(m.x - c[0], m.y - c[1]) < 160)) { if (!G.cs['cp' + c[1]]) { G.cs['cp' + c[1]] = 1; G.checkpoint = c.slice(); G.pops.push({ x: c[0], y: c[1] - 60, text: 'Punto de control', t: 0, color: '#9fe07a', small: true }); } }
    // atadura: que no se separen demasiado (la cámara los muestra a los dos)
    const [a, b] = G.mages;
    if (a && b && a.alive && b.alive) { const dx = b.x - a.x, dy = b.y - a.y, d = hypot(dx, dy), max = 1150; if (d > max) { const p = (d - max) * 0.5; a.x += dx / d * p * dt * 6; a.y += dy / d * p * dt * 6; b.x -= dx / d * p * dt * 6; b.y -= dy / d * p * dt * 6; } }
    // fallar
    if (G.lives < 0) return Game.endRound(-1, 'lives');
    if (L.limit && G.roundT > L.limit) return Game.endRound(-1, 'timeout');
    const lan = G.objs.find(o => o.t === 'lantern' || o.t === 'canoe'); if (lan && lan.hp <= 0) return Game.endRound(-1, 'lost');
    // ganar
    if (L.goal(G)) {
      const ex = G.objs.find(o => o.t === 'exit');
      if (ex) { ex.open = true; const inside = G.mages.filter(m => m.alive && hypot(m.x - ex.x, m.y - ex.y) < 70).length, need = G.mages.filter(m => m.alive).length; if (inside >= need && need > 0) Game.endRound(0, 'win'); }
      else if (L.autoWin) Game.endRound(0, 'win');
    }
  }
  function objStep(G, o, dt) {
    const T = G.T;
    if (o.t === 'brazier' && !o.lit) {
      let fire = false; Terrain.forCircle(T, o.x, o.y, 44, i => { if (T.fire[i] > 0 || T.lava[i] > 0) fire = true; });
      for (const s of G.spells) { if (s.dead) continue; const near = hypot(s.x - o.x, s.y - o.y) < 56; if (near && (s.el === 'fire' || s.t === 'firenado' || (s.t === 'lob' && s.kind === 'meteor'))) fire = true; if (s.t === 'beam' && s.fired && s.x1 != null) { const t = clamp(((o.x - s.x) * (s.x1 - s.x) + (o.y - s.y) * (s.y1 - s.y)) / ((s.x1 - s.x) ** 2 + (s.y1 - s.y) ** 2 || 1), 0, 1); if (hypot(o.x - (s.x + (s.x1 - s.x) * t), o.y - (s.y + (s.y1 - s.y) * t)) < 50) fire = true; } }
      for (const m of G.mages) if (m.alive && hypot(m.x - o.x, m.y - o.y) < 50 && m.hands.some(h => h.el === 'fire' && h.hold >= HOLD_FULL)) fire = true;
      if (fire) { o.lit = true; G.events.push({ type: 'brazierLit', x: o.x, y: o.y }); G.fx.push({ type: 'boom', x: o.x, y: o.y - 20, r: 50, el: 'fire' }); }
    }
    if (o.t === 'plate') { o.pressed = G.mages.some(m => m.alive && hypot(m.x - o.x, m.y - o.y) < 30) || G.units.some(u => u.obj === 'stone' && hypot(u.x - o.x, u.y - o.y) < 30); }
    if (o.t === 'totem') {
      if (o.power > 0) o.power -= dt;
      let hit = false; Terrain.forCircle(T, o.x, o.y, 48, i => { if (T.elec[i] > 0) hit = true; });
      for (const s of G.spells) if (!s.dead && (s.el === 'bolt' || s.t === 'strike') && hypot(s.x - o.x, s.y - o.y) < 50) hit = true;
      if (o.zapped) { hit = true; o.zapped = false; }
      if (hit) { if (o.power <= 0) G.events.push({ type: 'totem', x: o.x, y: o.y }); o.power = 4.5; }
    }
    if (o.t === 'prism') {
      if (o.power > 0) o.power -= dt; let hit = false;
      for (const s of G.spells) if (!s.dead && (s.el === 'light' || s.t === 'judgment' || s.t === 'nova') && hypot(s.x - o.x, s.y - o.y) < (s.t === 'nova' ? s.r : 52)) hit = true;
      for (const m of G.mages) if (m.alive && hypot(m.x - o.x, m.y - o.y) < 50 && m.hands.some(h => h.el === 'light' && h.hold >= HOLD_FULL)) hit = true;
      if (o.zapped) { hit = true; o.zapped = false; }
      if (hit) { if (o.power <= 0) { G.events.push({ type: 'totem', x: o.x, y: o.y }); G.fx.push({ type: 'flashRing', x: o.x, y: o.y, el: 'light', r: 90 }); } o.power = 9; }
    }
    if (o.t === 'obelisk' && o.u.alive) { o.sp -= dt; if (o.sp <= 0) { o.sp = 12; if (G.units.filter(u => u instanceof Creature && u.alive).length < 4) wave(G, ['diablillo'], [[o.x + 60, o.y + 30]]); } }
    if ((o.t === 'door' || o.t === 'bridge') && !o.open && o.cond(G)) {
      o.open = true; for (const i of o.cells) { T.base[i] = o.t === 'door' ? TT.STONE : TT.BRIDGE; G.fx.push({ type: o.t === 'door' ? 'rubble' : 'rise', x: Terrain.cx(T, i), y: Terrain.cy(T, i), soft: 1, el: o.under ? 'light' : undefined }); }
      T.ver++; ArtGround.cache[G.arena] = null; G.events.push({ type: 'doorOpen', x: Terrain.cx(T, o.cells[0]), y: Terrain.cy(T, o.cells[0]) }); G.pops.push({ x: Terrain.cx(T, o.cells[0]), y: Terrain.cy(T, o.cells[0]) - 50, text: o.t === 'door' ? '¡Se abrió!' : o.under ? '¡Puente de luz!' : '¡Bajó el puente!', t: 0, color: '#9fe07a', big: true });
    }
    if (o.t === 'sprout' && !o.grown) {
      if (o.wetT > 0) o.wetT -= dt; for (const s of G.spells) if (!s.dead && (s.el === 'water' || s.t === 'wave' || s.t === 'storm') && hypot(s.x + (s.t === 'wave' ? Math.cos(s.ang) * s.d : 0) - o.x, s.y + (s.t === 'wave' ? Math.sin(s.ang) * s.d : 0) - o.y) < 60) o.wetT = 9;
      const wet = o.wetT > 0 || (() => { let w = false; Terrain.forCircle(T, o.x, o.y, 50, i => { if (T.wet[i] > 0) w = true; }); return w; })();
      o.wet = wet;
      if (wet && G.cs.seed && hypot(G.cs.seed[0] - o.x, G.cs.seed[1] - o.y) < 80) { o.grown = true; for (const i of o.list) { T.base[i] = TT.BRIDGE; T.vine[i] = 0; G.fx.push({ type: 'sprout', x: Terrain.cx(T, i), y: Terrain.cy(T, i), delay: (Terrain.cx(T, i) - o.x) / 600 }); } T.ver++; G.events.push({ type: 'grow', x: o.x, y: o.y }); G.pops.push({ x: o.x, y: o.y - 60, text: '¡Creció el puente!', t: 0, color: '#9fe07a', big: true }); }
    }
    if (o.t === 'seal' && !o.done) {
      for (const s of G.spells) if (!s.dead && s.fusion === o.need && hypot(s.x - o.x, s.y - o.y) < 130) o.done = true;
      if (o.done) { G.events.push({ type: 'seal', x: o.x, y: o.y }); G.fx.push({ type: 'boom', x: o.x, y: o.y, r: 90, el: o.need.split('+')[1] }); G.pops.push({ x: o.x, y: o.y - 70, text: '¡Sello abierto!', t: 0, color: '#ffe9a0', big: true }); }
    }
    if (o.t === 'canoe') {
      const near = G.mages.some(m => m.alive && hypot(m.x - o.x, m.y - o.y) < 330);
      let blocked = false; Terrain.forLine(T, o.x + 30, o.y, o.x + 70, o.y, i => { if (T.wall[i] > 0) blocked = true; });
      o.blocked = blocked; o.moving = near && !blocked;
      if (o.moving) o.x = Math.min(o.path[1][0], o.x + 52 * dt);
    }
    if (o.t === 'lantern' || o.t === 'canoe') {
      for (const u of G.units) if (u instanceof Creature && u.alive && u.team === 9 && hypot(u.x - o.x, u.y - o.y) < 46) { if (!u.lanT || G.time - u.lanT > 1) { u.lanT = G.time; o.hp -= u.D.bite * (o.look === 'tree' ? 0.32 : o.look === 'soul' ? 0.4 : o.t === 'canoe' ? 0.36 : 0.5); o.hitT = 0.3; G.events.push({ type: 'hurt', x: o.x, y: o.y, dmg: 6, el: u.D.el, who: -1 }); } }
      if (o.hitT > 0) o.hitT -= dt; else if (o.hp > 0) o.hp = Math.min(o.maxHp, o.hp + (o.look === 'soul' ? 1.5 : o.t === 'canoe' ? 1.2 : 2) * dt);
    }
  }
  function onEvent(G, e) {
    if (e.type === 'seedLand') G.cs.seed = [e.x, e.y];
    if (e.type === 'lightLine') for (const o of G.objs) if (o.t === 'prism') for (const [x0, y0, x1, y1] of e.segs) { const dx = x1 - x0, dy = y1 - y0, tt = clamp(((o.x - x0) * dx + (o.y - y0) * dy) / (dx * dx + dy * dy || 1), 0, 1); if (hypot(o.x - (x0 + dx * tt), o.y - (y0 + dy * tt)) < 50) o.zapped = true; }
    if (e.type === 'zapLine') for (const o of G.objs) if (o.t === 'totem') { const dx = e.x1 - e.x0, dy = e.y1 - e.y0, tt = clamp(((o.x - e.x0) * dx + (o.y - e.y0) * dy) / (dx * dx + dy * dy || 1), 0, 1); if (hypot(o.x - (e.x0 + dx * tt), o.y - (e.y0 + dy * tt)) < 50) o.zapped = true; }
    if (e.type === 'fusionCast') for (const o of G.objs) if (o.t === 'seal' && !o.done && o.need === e.key && (hypot(e.x - o.x, e.y - o.y) < 170 || hypot(e.x0 - o.x, e.y0 - o.y) < 120)) { o.done = true; G.events.push({ type: 'seal', x: o.x, y: o.y }); G.fx.push({ type: 'boom', x: o.x, y: o.y, r: 90, el: o.need.split('+')[1] }); G.pops.push({ x: o.x, y: o.y - 70, text: '¡Sello abierto!', t: 0, color: '#ffe9a0', big: true }); }
    if (e.type === 'down' && G.mode === 'camp') { G.lives--; G.respawn[e.who] = 0; }
  }
  // RESONANCIA: dos proyectiles de compañeros distintos que se cruzan se funden
  function resonance(G) {
    if (!G.coop) return;
    const P = G.spells.filter(s => s.t === 'proj' && !s.dead && s.team === 0 && s.by >= 0 && !s.petal && !s.ground);
    for (let a = 0; a < P.length; a++) for (let b = a + 1; b < P.length; b++) {
      const p = P[a], q = P[b]; if (p.by === q.by || p.dead || q.dead || p.el === q.el) continue;
      if (hypot(p.x - q.x, p.y - q.y) > p.r + q.r + 26) continue;
      const key = fuseKey(p.el, q.el); if (!FUSIONS[key]) continue;
      p.dead = q.dead = true; const x = (p.x + q.x) / 2, y = (p.y + q.y) / 2, m = G.mages[p.by];
      const fake = { x, y, idx: p.by, team: 0, tr: {}, st: { hidden: 0, blind: 0 }, face: Math.atan2(p.vy + q.vy, p.vx + q.vx), hands: m.hands, aim(G2, range, speed) { return m.aim.call(Object.assign(Object.create(Mage.prototype), m, { x, y, face: this.face }), G2, range, speed); } };
      Spells.cast(G, fake, FUSIONS[key], key, { fusion: key, power: 0.9, size: 0.95, res: true });
      G.events.push({ type: 'resonance', key, x, y }); G.fx.push({ type: 'boom', x, y, r: 70, el: q.el });
      G.pops.push({ x, y: y - 60, text: 'Resonancia: ' + FUSIONS[key].name, t: 0, color: '#ffe9a0', big: true });
      for (const mm of G.mages) mm.gainEmb(G, 12);
    }
  }
  /* ---------- dibujo de los objetos ---------- */
  function draw(x, G, list) { return ArtBeast.objects(x, G, list); }
  function drawOld(x, G, list) {
    const t = G.time;
    for (const o of G.objs) {
      if (o.t === 'brazier') list.push({ y: o.y + 8, draw: x => { x.fillStyle = 'rgba(10,8,20,0.4)'; x.beginPath(); x.ellipse(o.x, o.y + 6, 22, 8, 0, 0, TAU); x.fill(); x.fillStyle = '#6e6a62'; x.fillRect(o.x - 8, o.y - 20, 16, 24); x.fillStyle = '#8a8676'; x.beginPath(); x.ellipse(o.x, o.y - 22, 22, 9, 0, 0, TAU); x.fill(); x.fillStyle = '#2a2420'; x.beginPath(); x.ellipse(o.x, o.y - 23, 16, 5, 0, 0, TAU); x.fill(); if (o.lit) { x.save(); x.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { const h = 26 + Math.sin(t * 9 + k * 2) * 8; x.fillStyle = `rgba(255,${150 + k * 40},60,0.8)`; x.beginPath(); x.moveTo(o.x - 12 + k * 8, o.y - 22); x.quadraticCurveTo(o.x - 8 + k * 8, o.y - 22 - h * 0.6, o.x - 4 + k * 4 + Math.sin(t * 11 + k) * 3, o.y - 22 - h); x.quadraticCurveTo(o.x - 2 + k * 6, o.y - 22 - h * 0.5, o.x - 2 + k * 8, o.y - 22); x.fill(); } x.restore(); } else { x.fillStyle = 'rgba(255,200,120,0.5)'; x.font = fontB(13, 900); x.textAlign = 'center'; x.fillText('apagado', o.x, o.y - 40); HUD.icon(x, 'fire', o.x, o.y - 58, 7, 'rgba(255,170,80,0.7)'); } } });
      else if (o.t === 'plate') { x.fillStyle = o.pressed ? '#9fe07a' : '#8a8676'; x.beginPath(); x.ellipse(o.x, o.y, 28, 16, 0, 0, TAU); x.fill(); x.strokeStyle = '#4a463c'; x.lineWidth = 3; x.stroke(); x.fillStyle = o.pressed ? '#d8ffb0' : '#a6a292'; x.beginPath(); x.ellipse(o.x, o.y - (o.pressed ? 0 : 3), 20, 11, 0, 0, TAU); x.fill(); }
      else if (o.t === 'totem') list.push({ y: o.y + 6, draw: x => { const on = o.power > 0; x.fillStyle = 'rgba(10,8,20,0.4)'; x.beginPath(); x.ellipse(o.x, o.y + 4, 18, 7, 0, 0, TAU); x.fill(); x.fillStyle = '#5a4a3a'; x.fillRect(o.x - 12, o.y - 56, 24, 60); x.fillStyle = on ? '#e6d6ff' : '#3a3040'; for (let k = 0; k < 3; k++) x.fillRect(o.x - 8, o.y - 50 + k * 18, 16, 6); if (on) { ArtSpells.glow(x, o.x, o.y - 40, 60, 'rgba(190,150,255,0.8)'); x.fillStyle = '#fff'; x.font = fontB(12, 900); x.textAlign = 'center'; x.fillText(o.power.toFixed(1), o.x, o.y - 66); } else HUD.icon(x, 'bolt', o.x, o.y - 68, 8, 'rgba(200,170,255,0.8)'); } });
      else if (o.t === 'sprout' && !o.grown) { x.fillStyle = o.wet ? '#3a2a1a' : '#5b4231'; x.beginPath(); x.ellipse(o.x, o.y, 26, 16, 0, 0, TAU); x.fill(); HUD.icon(x, 'plant', o.x - 10, o.y - 30, 8, '#9fe07a'); HUD.icon(x, 'water', o.x + 10, o.y - 30, 8, o.wet ? '#9ff0ff' : 'rgba(150,200,255,0.5)'); }
      else if (o.t === 'seal') { const E1 = ELEMENTS[o.need.split('+')[0]], E2 = ELEMENTS[o.need.split('+')[1]]; x.save(); x.strokeStyle = o.done ? '#ffe9a0' : E1.c1; x.lineWidth = 4; x.setLineDash(o.done ? [] : [10, 8]); x.lineDashOffset = t * 20; x.beginPath(); x.ellipse(o.x, o.y, 70, 44, 0, 0, TAU); x.stroke(); x.restore(); if (!o.done) { HUD.icon(x, o.need.split('+')[0], o.x - 16, o.y, 12, E1.c1); x.fillStyle = '#fff'; x.font = fontB(16, 900); x.textAlign = 'center'; x.fillText('+', o.x, o.y + 6); HUD.icon(x, o.need.split('+')[1], o.x + 16, o.y, 12, E2.c1); x.font = fontT(15); x.fillStyle = '#ffe9a0'; x.fillText(FUSIONS[o.need].name, o.x, o.y + 64); } }
      else if (o.t === 'exit') { const op = o.open; x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = op ? `rgba(255,230,140,${0.6 + Math.sin(t * 4) * 0.3})` : 'rgba(150,140,180,0.4)'; x.lineWidth = 5; x.beginPath(); x.ellipse(o.x, o.y, 64, 40, 0, 0, TAU); x.stroke(); if (op) { x.fillStyle = 'rgba(255,220,120,0.15)'; x.fill(); } x.restore(); x.font = fontT(16); x.textAlign = 'center'; x.fillStyle = op ? '#ffe9a0' : 'rgba(200,190,230,0.6)'; x.fillText(op ? 'SALIDA' : 'salida cerrada', o.x, o.y + 62); }
      else if (o.t === 'lantern' || o.t === 'canoe') list.push({ y: o.y + 10, draw: x => {
        if (o.t === 'lantern') { x.fillStyle = 'rgba(10,8,20,0.4)'; x.beginPath(); x.ellipse(o.x, o.y + 4, 22, 8, 0, 0, TAU); x.fill(); x.fillStyle = '#3a2a1a'; x.fillRect(o.x - 3, o.y - 60, 6, 64); x.fillStyle = '#c8901e'; x.fillRect(o.x - 14, o.y - 86, 28, 30); ArtSpells.glow(x, o.x, o.y - 72, 80, 'rgba(255,210,120,0.9)'); x.fillStyle = '#fff3c4'; x.fillRect(o.x - 9, o.y - 82, 18, 22); }
        else { x.fillStyle = '#5a3a1e'; x.beginPath(); x.ellipse(o.x, o.y, 54, 16, 0, 0, TAU); x.fill(); x.fillStyle = '#8a5a2e'; x.beginPath(); x.ellipse(o.x, o.y - 4, 48, 11, 0, 0, TAU); x.fill(); x.fillStyle = '#c8901e'; x.fillRect(o.x - 6, o.y - 36, 12, 26); ArtSpells.glow(x, o.x, o.y - 30, 60, 'rgba(255,210,120,0.8)'); }
        const f = o.hp / o.maxHp; x.fillStyle = 'rgba(10,8,25,0.7)'; x.fillRect(o.x - 30, o.y - 104, 60, 6); x.fillStyle = f < 0.3 ? '#ff6a5a' : '#ffd25a'; x.fillRect(o.x - 30, o.y - 104, 60 * Math.max(0, f), 6);
        if (o.hitT > 0) { x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(255,80,60,${o.hitT})`; x.beginPath(); x.arc(o.x, o.y - 40, 40, 0, TAU); x.fill(); x.restore(); } } });
    }
    if (G.boss && G.boss.alive) list.push({ y: G.boss.y, draw: x => drawBoss(x, G, G.boss) });
  }
  function drawBoss(x, G, b) {
    const t = G.time, k = b.boss;
    x.save(); x.translate(b.x, b.y);
    x.fillStyle = 'rgba(10,8,20,0.45)'; x.beginPath(); x.ellipse(0, 4, b.r * 1.2, b.r * 0.45, 0, 0, TAU); x.fill();
    if (k === 'madremonte') {
      x.fillStyle = '#4a3a28'; x.beginPath(); x.moveTo(-34, 0); x.quadraticCurveTo(-44, -70, -20, -110); x.lineTo(20, -110); x.quadraticCurveTo(44, -70, 34, 0); x.fill();
      x.fillStyle = '#2e5a2a'; for (let j = 0; j < 9; j++) { const a = j / 9 * TAU + t * 0.3; x.beginPath(); x.ellipse(Math.cos(a) * 34, -120 + Math.sin(a) * 18, 22, 12, a, 0, TAU); x.fill(); }
      x.fillStyle = '#d8c0a0'; x.beginPath(); x.ellipse(0, -100, 15, 18, 0, 0, TAU); x.fill(); x.fillStyle = '#ff5a3a'; x.fillRect(-8, -104, 5, 3); x.fillRect(3, -104, 5, 3);
      const core = b.shield <= 0; x.fillStyle = core ? `rgba(255,${120 + Math.sin(t * 8) * 60},120,1)` : '#7a2a3a'; x.beginPath(); x.arc(0, -55, 11, 0, TAU); x.fill(); if (core) ArtSpells.glow(x, 0, -55, 40, 'rgba(255,120,140,0.8)');
      if (b.shield > 0) { x.strokeStyle = '#3e7a32'; x.lineWidth = 6; for (let j = 0; j < 6; j++) { x.beginPath(); x.moveTo(-36 + j * 14, -4); x.bezierCurveTo(-60 + j * 22, -50, 40 - j * 16, -70, -30 + j * 12, -108); x.stroke(); } x.fillStyle = '#7ec85a'; for (let j = 0; j < 10; j++) { x.beginPath(); x.ellipse(-30 + (j * 37) % 60, -20 - (j * 23) % 80, 6, 3, j, 0, TAU); x.fill(); } }
    } else if (k === 'mohan') {
      x.fillStyle = 'rgba(80,140,180,0.35)'; x.beginPath(); x.ellipse(0, 0, 60, 22, 0, 0, TAU); x.fill();
      x.fillStyle = '#2a3a4a'; x.beginPath(); x.moveTo(-30, 0); x.quadraticCurveTo(-36, -60, -14, -84); x.lineTo(14, -84); x.quadraticCurveTo(36, -60, 30, 0); x.fill();
      x.fillStyle = '#e8e2d0'; x.beginPath(); x.moveTo(-14, -70); x.quadraticCurveTo(0, -20 + Math.sin(t * 2) * 4, 14, -70); x.fill();
      x.fillStyle = '#b57a52'; x.beginPath(); x.ellipse(0, -88, 13, 14, 0, 0, TAU); x.fill();
      x.fillStyle = '#c8a050'; x.beginPath(); x.ellipse(0, -100, 30, 7, 0, 0, TAU); x.fill(); x.fillRect(-12, -116, 24, 16);
      x.fillStyle = '#ffd25a'; x.fillRect(-8, -92, 4, 3); x.fillRect(4, -92, 4, 3);
      if (b.st.frozen > 0) { x.fillStyle = 'rgba(200,240,255,0.6)'; x.fillRect(-40, -130, 80, 132); }
    } else if (k === 'tragaluz') {
      const ex = b.exposed;
      for (let j = 0; j < 12; j++) { const a = j / 12 * TAU + t * 0.6, r = 50 + Math.sin(t * 2 + j) * 12; x.fillStyle = ex ? 'rgba(90,70,130,0.5)' : 'rgba(150,140,190,0.55)'; x.beginPath(); x.arc(Math.cos(a) * r * 0.8, -70 + Math.sin(a) * r * 0.5, 34, 0, TAU); x.fill(); }
      x.fillStyle = '#14102a'; x.beginPath(); x.ellipse(0, -70, 40, 46, 0, 0, TAU); x.fill();
      for (const ex2 of [-14, 14]) { ArtSpells.glow(x, ex2, -78, 26, 'rgba(255,240,180,0.9)'); x.fillStyle = '#fff6d0'; x.beginPath(); x.ellipse(ex2, -78, 6, 3, 0, 0, TAU); x.fill(); }
      x.strokeStyle = '#fff6d0'; x.lineWidth = 2; x.beginPath(); x.arc(0, -56, 14, 0.2, Math.PI - 0.2); x.stroke();
      if (b.pulse) { const pr = b.pulse * 520; x.strokeStyle = 'rgba(200,180,255,0.7)'; x.lineWidth = 8; x.beginPath(); x.ellipse(0, 0, pr, pr * 0.6, 0, 0, TAU); x.stroke(); }
    }
    if (b.flash > 0) { x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(255,255,255,${b.flash * 4})`; x.beginPath(); x.arc(0, -60, b.r * 1.3, 0, TAU); x.fill(); }
    x.restore();
  }
  function hud(x, G, sw, sh, u) {
    const L = G.L, cx = sw / 2, ty = 12 * u + (isTouch() ? 46 : 0);
    x.fillStyle = 'rgba(14,10,34,0.68)'; HUD.rr(x, cx - 200 * u, ty, 400 * u, 56 * u, 14 * u); x.fill(); x.strokeStyle = 'rgba(232,196,110,0.5)'; x.lineWidth = 1.5; x.stroke();
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = fontT(17 * u); x.fillStyle = '#ffe9a0'; x.fillText(`${G.campLevel + 1}. ${L.name}`, cx, ty + 17 * u);
    x.font = fontB(12.5 * u, 800); x.fillStyle = '#f3eaff'; x.fillText(L.label(G), cx, ty + 39 * u);
    // vidas compartidas
    for (let k = 0; k < (G.L.boss ? 6 : 5); k++) { const X = cx - 200 * u + 18 * u + k * 15 * u, Y = ty + 70 * u; x.fillStyle = k < G.lives ? '#ff7a8a' : 'rgba(255,255,255,0.15)'; x.font = fontB(13 * u, 900); x.fillText('♥', X, Y); }
    if (L.limit) { const left = Math.max(0, L.limit - G.roundT); x.font = fontB(13 * u, 900); x.fillStyle = left < 30 ? '#ff9a7a' : '#e8dcff'; x.fillText(`${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`, cx + 170 * u, ty + 70 * u); }
    if (G.boss && G.boss.alive) { const b = G.boss, bw = 360 * u, bx = cx - bw / 2, by = sh - 40 * u - (getInsets().bottom || 0) * (isTouch() ? 1.6 : 0); x.fillStyle = 'rgba(14,10,34,0.7)'; HUD.rr(x, bx - 8, by - 22 * u, bw + 16, 40 * u, 10 * u); x.fill(); x.font = fontT(15 * u); x.fillStyle = '#ffd9a0'; x.fillText(BOSS[b.boss].name, cx, by - 10 * u); x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(bx, by, bw, 9 * u); x.fillStyle = '#ff6a5a'; x.fillRect(bx, by, bw * b.hp / b.maxHp, 9 * u); if (b.maxShield) { x.fillStyle = '#5aa84a'; x.fillRect(bx, by - 2 * u, bw * Math.max(0, b.shield) / b.maxShield, 3 * u); } if (b.boss === 'tragaluz' && !b.exposed) { x.font = fontB(11 * u, 900); x.fillStyle = '#c9b8ff'; x.fillText('cubierto de niebla', cx, by + 18 * u); } }
  }
  // estrellas: 1 por pasar, +1 si gastaron 1 vida o menos, +1 si fue a tiempo
  function stars(G) { const lost = (G.L.boss ? 6 : 5) - Math.max(0, G.lives); return 1 + (lost <= 1 ? 1 : 0) + (G.roundT <= G.L.par ? 1 : 0); }
  const save = () => Store.get('camp', {});
  function record(G) { const D = save(), id = G.L.id, s = stars(G), prev = D[id] || 0; if (s > prev) { D[id] = s; Store.set('camp', D); } return { stars: s, best: Math.max(s, prev), newBest: s > prev }; }
  const unlocked = i => i === 0 || (save()[LEVELS[i - 1].id] || 0) > 0;
  const total = () => LEVELS.reduce((a, L) => a + (save()[L.id] || 0), 0);
  return { LEVELS, BOSS, bossPlan, levelPlan, foeCast, build, setup, update, onEvent, resonance, draw, hud, stars, record, unlocked, total, best: id => save()[id] || 0 };
})();
