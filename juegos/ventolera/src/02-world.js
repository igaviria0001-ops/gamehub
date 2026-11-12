/* =========================================================================
   ESCENARIOS — terreno, obstáculos, perchas, viento y lo que se mueve.
   Unidades del mundo: 1 = 1 px con zoom 1. Y crece hacia abajo.
   · Valle de Cocora: palmas de cera (la copa estorba, se posa y se deshace).
   · Medellín de noche: rascacielos (azoteas para posarse, vidrios que
     estallan), viaducto del metro con un tren que va y viene, metrocable
     con cabinas que suben la ladera, el río y las comunas en las montañas.
   ========================================================================= */
const ARENAS = {
  cocora: {
    name: 'Valle de Cocora', time: 'Amanecer',
    w: 2800, h: 2000, breeze: 14,
    ground(x) {
      let g = 1700 + 58 * Math.sin(x * 0.0021 + 1.3) + 34 * Math.sin(x * 0.0057 + 0.4) + 16 * Math.sin(x * 0.013 + 2.2);
      // a los lados el valle sube (montaña): nadie se queda pegado al borde
      g -= 420 * smooth(clamp((320 - x) / 320, 0, 1)) + 420 * smooth(clamp((x - (2800 - 320)) / 320, 0, 1));
      return g;
    },
    // palmas de cera: tronco delgadísimo y altísimo, copa pequeña arriba (se puede posar en ella)
    palms: [[500, 660], [840, 880], [1130, 580], [1470, 780], [1820, 920], [2130, 620], [2400, 820]],
  },
  medellin: {
    name: 'Medellín de noche', time: 'Noche',
    w: 3800, h: 2300, breeze: 8,
    ground(x) {
      let g = 2050 + 6 * Math.sin(x * 0.004);
      // las laderas de las comunas suben a los dos lados
      g -= 600 * smooth(clamp((520 - x) / 520, 0, 1)) + 600 * smooth(clamp((x - 3280) / 520, 0, 1));
      return g;
    },
    palms: [],
    // [x, ancho, alto, estilo, altura del primer piso abierto]: todas las torres van sobre columnas,
    // así la calle es un corredor continuo y ningún callejón entre torres queda cerrado abajo
    // entre torre y torre quedan ~220 px: cabe dar la vuelta (un callejón de 120 era una trampa)
    buildings: [[680, 160, 640, 'concrete', 125], [1060, 120, 920, 'glass', 140], [1400, 150, 1120, 'needle', 150],
      [2140, 180, 800, 'glass', 140], [2540, 130, 1000, 'brick', 125], [2890, 200, 560, 'concrete', 130]],
    river: [1600, 1960],
    viaduct: { x0: 420, x1: 3300, top: 1925, h: 20 },
    train: { cars: 3, carW: 150, gap: 8, h: 44, speed: 300, wait: 2.2 },
    cable: { x0: 3150, y0: 1740, x1: 3920, y1: 1170, n: 5, speed: 52, drop: 34, cw: 44, ch: 40 },
  },
};
ARENAS.bogota = {
  name: 'Bogotá en tormenta', time: 'Noche de lluvia y rayos',
  w: 3800, h: 2300, breeze: 30, storm: true,
  ground(x) {
    let g = 2050 + 5 * Math.sin(x * 0.005);
    g -= 380 * smooth(clamp((360 - x) / 360, 0, 1));
    // Monserrate: el cerro sube empinado a la derecha
    g -= 1120 * smooth(clamp((x - 2620) / 1050, 0, 1));
    return g;
  },
  palms: [],
  buildings: [[380, 170, 700, 'brick', 125], [770, 140, 1000, 'glass', 140], [1130, 160, 1250, 'light', 150],
    [1510, 130, 760, 'concrete', 125], [1860, 200, 1080, 'glass', 140], [2280, 150, 640, 'brick', 125]],
  cable: { x0: 2700, y0: 1800, x1: 3620, y1: 860, n: 4, speed: 46, drop: 34, cw: 46, ch: 40, red: true },
};
// Cartagena al atardecer: el mar a la izquierda (con un galeón pirata que navega y dispara), la muralla,
// la Torre del Reloj (se pasa por debajo de su arco), casas coloniales con portales, la torre de la catedral
// y a la derecha el cerro con el castillo de San Felipe, que también dispara
ARENAS.cartagena = {
  name: 'Cartagena al atardecer', time: 'Atardecer con galeón pirata',
  w: 3800, h: 2300, breeze: 20, coast: true,
  ground(x) {
    let g = 2060 + (x < 1240 ? 0 : 4 * Math.sin(x * 0.006));
    g -= 640 * smooth(clamp((x - 3120) / 640, 0, 1));
    // el castillo: murallas en talud (inclinadas, como las de verdad) escalonadas cerro arriba
    for (const [a, h] of FORT_TIERS) g -= h * smooth(clamp((x - a) / 46, 0, 1));
    return g;
  },
  palms: [],
  buildings: [[1240, 170, 200, 'wall', 0], [1640, 130, 580, 'clock', 175], [1990, 250, 250, 'colonial', 115],
    [2470, 120, 840, 'cathedral', 175], [2800, 220, 270, 'colonial', 115]],
  river: [-200, 1240],
  ship: { x: 640, min: 300, max: 960, speed: 34, L: 340, deck: 52, masts: [[-110, 220], [0, 300], [105, 210]] },
  fort: { x: 3470, gun: 3468 },
};
// Capadocia al amanecer: chimeneas de hadas (torres de toba con sombrero de basalto y casas-cueva),
// la roca-castillo de Uçhisar (con un túnel abajo), un arco natural y globos aerostáticos que suben y
// bajan con el quemador: rebotas en la tela, te posas encima y te llevan. Las térmicas del valle
// (columnas de aire tibio) te suben gratis.
ARENAS.capadocia = {
  name: 'Capadocia', time: 'Amanecer con globos',
  w: 3600, h: 2250, breeze: 10,
  ground(x) {
    let g = 1990 + 20 * Math.sin(x * 0.0031 + 0.7) + 11 * Math.sin(x * 0.0093 + 2.1);
    g -= 520 * smooth(clamp((440 - x) / 440, 0, 1)) + 560 * smooth(clamp((x - 3120) / 480, 0, 1));
    return g;
  },
  palms: [],
  // la roca-castillo y el arco tienen patas de roca de verdad (sólidas): el hueco de abajo se cruza de lado a lado
  // (la roca-castillo va en dos escalones: la base ancha y la cima angosta encima)
  buildings: [[540, 110, 400, 'chimney', 0], [930, 120, 560, 'chimney', 0], [1330, 300, 500, 'castle', 180, 42], [1390, 180, 760, 'castleTop', 500],
    [1930, 110, 470, 'chimney', 0], [2310, 300, 540, 'arch', 300, 48], [2870, 120, 420, 'chimney', 0]],
  // globos: [x, altura media, color]; dos carriles (alto y bajo) para que no se crucen
  hotair: [[900, 300, 0], [2700, 300, 1], [1700, 830, 2], [3000, 830, 3]],
  // térmicas: [x, fase] — columnas de aire tibio que se mueven despacio por el valle
  thermals: [[1150, 0], [2650, 2.4]],
};
const ARENA_ORDER = ['cocora', 'medellin', 'bogota', 'cartagena', 'capadocia'];
const NO_WIN = { wall: 1, chimney: 1, castle: 1, castleTop: 1, arch: 1, leg: 1 };
const FORT_TIERS = [[3250, 70], [3410, 86], [3560, 74]];
// ventanas por estilo: [ancho de celda, alto de celda, ancho del vidrio, alto del vidrio]
const WIN_SIZE = { glass: [20, 26, 16, 20], colonial: [46, 78, 22, 42], clock: [44, 96, 16, 30], cathedral: [40, 100, 14, 36] };

const World = (() => {
  function build(id) {
    const A = ARENAS[id] || ARENAS.cocora;
    const W = {
      id: ARENAS[id] ? id : 'cocora', def: A, w: A.w, h: A.h, ceil: -230, time: 0,
      palms: A.palms.map(([x, h], i) => { const base = A.ground(x); return { x, base, top: base - h, r: 9, crown: { x, y: base - h - 6, r: 44, hp: 6, gone: false }, lean: (i % 2 ? 1 : -1) * 0.012 * (1 + (i % 3)), i }; }),
      groundY: x => A.ground(clamp(x, 0, A.w)),
      buildings: null, viaduct: null, train: null, cable: null,
    };
    W.slope = x => (W.groundY(x + 2) - W.groundY(x - 2)) / 4;
    if (A.buildings) {
      W.buildings = A.buildings.map(([x, w, h, style, lift], i) => {
        const g = A.ground(x + w / 2), B = { i, x0: x, x1: x + w, top: g - h, bottom: g - lift, ground: g, style, broken: new Set() };
        // ventanas: celdas regulares con márgenes (los vidrios de los «glass» son más anchos)
        const [cw, ch, wx, wy] = WIN_SIZE[style] || [24, 32, 12, 17];
        B.cw = cw; B.ch = ch; B.wx = wx; B.wy = wy;
        B.cols = NO_WIN[style] ? 0 : Math.max(1, Math.floor((w - 20) / cw)); B.rows = NO_WIN[style] ? 0 : Math.max(1, Math.floor((B.bottom - B.top - 44) / ch));
        B.ox = x + (w - B.cols * cw) / 2; B.oy = B.top + 26;
        return B;
      });
      // patas de roca bajo los arcos: van atrás, en el fondo del pasadizo (decorado, como las columnas de Medellín):
      // en 2D de lado, si fueran sólidas el hueco quedaría encerrado
      for (const [x, w, , , , legW] of A.buildings) if (legW) {
        const P = W.buildings.find(B => B.x0 === x);
        P.legs = [x, x + w - legW].map(lx => ({ x0: lx, x1: lx + legW, ground: A.ground(lx + legW / 2) }));
      }
    }
    if (A.viaduct) W.viaduct = Object.assign({}, A.viaduct);
    if (A.train) { const T = A.train, len = T.cars * T.carW + (T.cars - 1) * T.gap; W.train = Object.assign({ len, x: A.viaduct.x0 - len, dir: 1, waitT: 1.5, moving: false }, T); }
    if (A.cable) { const C = A.cable; W.cable = Object.assign({ len: Math.hypot(C.x1 - C.x0, C.y1 - C.y0), swing: new Array(C.n).fill(0), swingV: new Array(C.n).fill(0) }, C); }
    if (A.storm) W.storm = { boltT: 6, bolt: null, warn: null, planeT: 16, plane: null, gust: 0, gustT: 8, flash: 0 };
    if (A.ship) W.ship = Object.assign({ dir: 1, turn: 1, turnT: 0, holes: [], rock: 0 }, A.ship, { masts: A.ship.masts.map(m => m.slice()) });
    if (A.coast) W.coast = { shotT: 5, warn: null, balls: [], fw: [], fwT: 2, r: makeRng(31), side: 0 };
    if (A.hotair) W.hotair = A.hotair.map(([x, y, c], i) => ({ i, x, y, x0: x, y0: y, c, lane: y < 600 ? 0 : 1, vx: (i % 2 ? -1 : 1) * (19 + i * 3), kx: 0, ky: 0, oy: 0, ph: i * 1.9, r: 62, burn: 0, sq: 0, sqV: 0 }));
    if (A.thermals) W.thermals = A.thermals.map(([x, ph]) => ({ x, x0: x, ph, k: 0 }));
    return W;
  }

  /* ---------- lo que se mueve (pasos fijos, igual para todos) ---------- */
  function step(W, dt) {
    W.time += dt;
    const T = W.train;
    if (T) {
      const V = W.viaduct;
      if (T.waitT > 0) { T.waitT -= dt; T.moving = false; }
      else {
        T.moving = true; T.x += T.dir * T.speed * dt;
        // entra a la estación del otro lado, espera y se devuelve
        if (T.dir > 0 && T.x > V.x1 + 40) { T.dir = -1; T.waitT = T.wait; }
        else if (T.dir < 0 && T.x + T.len < V.x0 - 40) { T.dir = 1; T.waitT = T.wait; }
      }
    }
    const S = W.ship;
    if (S) {
      // navega de un lado a otro; al llegar al borde da la vuelta (se ve de frente un momento)
      if (S.turnT > 0) { S.turnT -= dt; S.turn = Math.cos(Math.PI * (1 - S.turnT / 2.4)) * -S.dir; if (S.turnT <= 0) S.turn = S.dir; }
      else {
        S.x += S.dir * S.speed * dt;
        if ((S.dir > 0 && S.x > S.max) || (S.dir < 0 && S.x < S.min)) { S.dir = -S.dir; S.turnT = 2.4; }
      }
      S.rock = Math.sin(W.time * 0.9) * 0.025;
    }
    if (W.hotair) stepHotair(W, dt);
    if (W.thermals) for (const T of W.thermals) {
      // la térmica va y viene por el valle y respira (más fuerte, más débil)
      T.x = T.x0 + Math.sin(W.time * 0.045 + T.ph) * 380; T.k = 0.65 + 0.35 * Math.sin(W.time * 0.31 + T.ph * 1.7);
    }
    const C = W.cable;
    if (C) for (let i = 0; i < C.n; i++) { C.swingV[i] += (-C.swing[i] * 9 - C.swingV[i] * 1.2) * dt; C.swing[i] += C.swingV[i] * dt; }
  }
  // globos: cada uno va por su carril, da la vuelta cerca de los bordes o al toparse con otro, y sube y baja
  // despacio (el quemador se enciende al subir). Los golpes los empujan un poco.
  const HA = { rope: 50, bw: 40, bh: 28, top: -40, bottom: 1085, amp: 135 };
  function stepHotair(W, dt) {
    const L = W.hotair;
    for (const b of L) {
      const px = b.x, py = b.y;
      b.x += (b.vx + b.kx) * dt;
      if ((b.x < 560 && b.vx < 0) || (b.x > W.w - 560 && b.vx > 0)) b.vx = -b.vx;
      b.kx *= Math.exp(-1.5 * dt); b.ky *= Math.exp(-1.8 * dt);
      b.oy = clamp((b.oy + b.ky * dt) * Math.exp(-0.45 * dt), -120, 120);
      const w = W.time * 0.105 + b.ph;
      b.y = clamp(b.y0 + Math.sin(w) * HA.amp + b.oy, HA.top, HA.bottom - HA.rope - HA.bh - b.r);
      b.burn = Math.cos(w) < -0.15 || b.ky < -40 ? Math.min(1, b.burn + dt * 4) : Math.max(0, b.burn - dt * 2.5);
      b.sqV += (-b.sq * 60 - b.sqV * 7) * dt; b.sq += b.sqV * dt;
      b.dx = b.x - px; b.dy = b.y - py;
    }
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      const a = L[i], c = L[j];
      if (a.lane !== c.lane || Math.abs(a.x - c.x) > a.r + c.r + 40) continue;
      // se acercan: los dos dan la vuelta
      if ((c.x - a.x) * (a.vx - c.vx) > 0) { a.vx = -a.vx; c.vx = -c.vx; }
    }
  }
  // partes del globo: la tela (círculo) y la canasta (rectángulo)
  function hotairBasket(b) { return { L: b.x - HA.bw / 2, R: b.x + HA.bw / 2, T: b.y + b.r + HA.rope, B: b.y + b.r + HA.rope + HA.bh }; }
  function knockHotair(W, i, kx, ky) { const b = W.hotair[i]; if (!b) return; b.kx = clamp(b.kx + kx, -90, 90); b.ky = clamp(b.ky + ky, -160, 160); b.sqV += Math.hypot(kx, ky) * 0.012; }
  // térmica: empuje hacia arriba en (x, y) (0 si no hay)
  function thermalAt(W, x, y) {
    if (!W.thermals) return 0;
    let up = 0;
    for (const T of W.thermals) {
      const d = Math.abs(x - T.x); if (d > 150) continue;
      const g = W.groundY(x), top = W.ceil + 380;
      if (y < top || y > g) continue;
      // más fuerte en el centro; se apaga cerca del techo
      up += 165 * T.k * smooth(1 - d / 150) * smooth(clamp((y - top) / 360, 0, 1));
    }
    return up;
  }
  // cabina i del metrocable: punto donde cuelga y centro de la cabina
  function cabin(W, i) {
    const C = W.cable, u = ((i / C.n + W.time * C.speed / C.len) % 1 + 1) % 1;
    const hx = lerp(C.x0, C.x1, u), hy = lerp(C.y0, C.y1, u), sw = C.swing[i];
    return { hx, hy, x: hx + Math.sin(sw) * C.drop, y: hy + Math.cos(sw) * C.drop + C.ch / 2, w: C.cw, h: C.ch, u, sw };
  }
  // el galeón: casco (con cubierta para posarse), mástiles y la cofa del palo mayor (también se posa)
  function shipParts(W) {
    const S = W.ship, sea = W.def.ground(S.x), k = Math.abs(S.turn), half = S.L / 2 * Math.max(0.18, k), deck = sea - S.deck;
    const parts = [{ kind: 'deck', L: S.x - half, R: S.x + half, T: deck, B: sea + 30 }];
    // popa alta (castillo de popa) del lado de atrás
    const back = -Math.sign(S.turn || S.dir);
    parts.push({ kind: 'deck', L: S.x + back * half * (back > 0 ? 0.55 : 1), R: S.x + back * half * (back > 0 ? 1 : 0.55), T: deck - 34, B: deck });
    for (const [ox, h] of S.masts) { const mx = S.x + ox * S.turn; parts.push({ kind: 'mast', L: mx - 6, R: mx + 6, T: deck - h, B: deck }); }
    const mm = S.masts[1], mx = S.x + mm[0] * S.turn;
    parts.push({ kind: 'cofa', L: mx - 22, R: mx + 22, T: deck - mm[1] + 64, B: deck - mm[1] + 76 });
    return parts;
  }
  function trainRect(W) {
    const T = W.train, V = W.viaduct;
    return { L: T.x, R: T.x + T.len, T: V.top - T.h, B: V.top };
  }

  // círculo contra rectángulo → { nx, ny, depth } o null (si el centro quedó adentro, sale por el lado más cercano)
  function rectHit(x, y, r, L, T, R, B) {
    const cx = clamp(x, L, R), cy = clamp(y, T, B), dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
    if (d > r) return null;
    if (d > 1e-6) return { nx: dx / d, ny: dy / d, depth: r - d };
    const pl = x - L, pr = R - x, pt = y - T, pb = B - y, m = Math.min(pl, pr, pt, pb);
    if (m === pt) return { nx: 0, ny: -1, depth: pt + r };
    if (m === pl) return { nx: -1, ny: 0, depth: pl + r };
    if (m === pr) return { nx: 1, ny: 0, depth: pr + r };
    return { nx: 0, ny: 1, depth: pb + r };
  }
  const isWater = (W, x) => W.def.river && x > W.def.river[0] && x < W.def.river[1];

  // el contacto más hondo entre un círculo y el escenario (o null)
  function contact(W, x, y, r) {
    let best = null;
    const take = c => { if (c && (!best || c.depth > best.depth)) best = c; };
    const gy = W.groundY(x);
    if (y + r > gy) {
      const s = W.slope(x), l = Math.hypot(s, 1), water = isWater(W, x);
      take({ nx: s / l, ny: -1 / l, depth: (y + r - gy) / l, kind: 'ground', perch: !water, water });
    }
    // los troncos de las palmas son decorado: en 2D de lado serían paredes del piso al cielo.
    // La copa sí estorba (y encima se puede posar).
    for (const P of W.palms) {
      if (P.crown.gone) continue;
      const C = P.crown, dx = x - C.x, dy = y - C.y, d = Math.hypot(dx, dy), rr = r + C.r * 0.55;
      if (d < rr) take({ nx: d ? dx / d : 0, ny: d ? dy / d : -1, depth: rr - d, kind: 'crown', perch: dy < -C.r * 0.2, P });
    }
    if (W.buildings) for (const B of W.buildings) {
      if (x + r < B.x0 || x - r > B.x1 || y + r < B.top || y - r > B.bottom) continue;
      const h = rectHit(x, y, r, B.x0, B.top, B.x1, B.bottom);
      if (!h) continue;
      if (h.ny < -0.7) take(Object.assign(h, { kind: 'roof', perch: true, top: B.top, x0: B.x0, x1: B.x1, B }));
      else take(Object.assign(h, { kind: 'building', perch: false, B }));
    }
    // el tablero del viaducto queda de fondo (en 2D de lado haría bolsillos cerrados entre edificios); el tren sí estorba
    if (W.train) { const t = trainRect(W); if (x + r > t.L && x - r < t.R && y + r > t.T && y - r < t.B) take(Object.assign(rectHit(x, y, r, t.L, t.T, t.R, t.B) || { nx: 0, ny: -1, depth: 0 }, { kind: 'train', perch: false })); }
    if (W.ship && Math.abs(x - W.ship.x) < W.ship.L / 2 + 60 && y > W.def.ground(W.ship.x) - 420) for (const p of shipParts(W)) {
      if (x + r < p.L || x - r > p.R || y + r < p.T || y - r > p.B) continue;
      const h = rectHit(x, y, r, p.L, p.T, p.R, p.B);
      if (!h) continue;
      const top = h.ny < -0.7 && p.kind !== 'mast';
      take(Object.assign(h, { kind: top ? p.kind : 'ship', perch: top, top: p.T, x0: p.L, x1: p.R }));
    }
    if (W.hotair) for (const b of W.hotair) {
      if (Math.abs(x - b.x) > b.r + r + 30 || y < b.y - b.r - r || y > b.y + b.r + HA.rope + HA.bh + r) continue;
      // la tela: rebota (encima se puede posar)
      const dx = x - b.x, dy = y - b.y, d = Math.hypot(dx, dy), rr = r + b.r * 0.94;
      if (d < rr) take({ nx: d ? dx / d : 0, ny: d ? dy / d : -1, depth: rr - d, kind: 'hotair', perch: dy < -b.r * 0.62, i: b.i, top: b.y - b.r * 0.94 });
      const k = hotairBasket(b), h = rectHit(x, y, r, k.L, k.T, k.R, k.B);
      if (h) take(Object.assign(h, { kind: h.ny < -0.7 ? 'basket' : 'hotairB', perch: h.ny < -0.7, i: b.i, top: k.T, x0: k.L, x1: k.R }));
    }
    if (W.cable) for (let i = 0; i < W.cable.n; i++) {
      const c = cabin(W, i);
      if (Math.abs(x - c.x) > c.w / 2 + r || Math.abs(y - c.y) > c.h / 2 + r) continue;
      const h = rectHit(x, y, r, c.x - c.w / 2, c.y - c.h / 2, c.x + c.w / 2, c.y + c.h / 2);
      if (h) take(Object.assign(h, { kind: 'cabin', perch: false, i }));
    }
    return best;
  }
  // viento del escenario (bordes y techo empujan hacia adentro)
  function windAt(W, x, y, t) {
    let wx = W.def.breeze * Math.sin(t * 0.13 + x * 0.0007), wy = 0;
    if (W.storm) wx += W.storm.gust;
    const m = 260;
    if (x < m) wx += (m - x) * 2.2; else if (x > W.w - m) wx -= (x - (W.w - m)) * 2.2;
    if (y < W.ceil) wy += (W.ceil - y) * 2.4;
    if (W.thermals) wy -= thermalAt(W, x, y);
    return { x: wx, y: wy };
  }
  // las copas aguantan algunos golpes; con un misil o muchas balas se deshacen (vuelven en la siguiente ronda)
  function hitCrown(W, P, n, G) {
    const C = P.crown; if (C.gone) return;
    C.hp -= n;
    if (C.hp <= 0) { C.gone = true; if (G) G.events.push({ type: 'crownGone', x: C.x, y: C.y, P }); }
  }
  function resetRound(W) {
    for (const P of W.palms) { P.crown.hp = 6; P.crown.gone = false; }
    // los vidrios rotos se quedan rotos toda la partida: la ciudad va mostrando la pelea
  }
  // ¿el punto choca con algo sólido? (para balas y misiles) → { kind, … } o null
  function solidAt(W, x, y, r = 0) {
    if (y + r > W.groundY(x)) return { kind: isWater(W, x) ? 'water' : 'ground' };
    for (const P of W.palms) { const C = P.crown; if (!C.gone && Math.hypot(x - C.x, y - C.y) < C.r * 0.7 + r) return { kind: 'crown', P }; }
    if (W.buildings) for (const B of W.buildings) if (x + r > B.x0 && x - r < B.x1 && y + r > B.top && y - r < B.bottom) return { kind: 'building', B };
    if (W.train) { const t = trainRect(W); if (x + r > t.L && x - r < t.R && y + r > t.T && y - r < t.B) return { kind: 'train' }; }
    if (W.ship && Math.abs(x - W.ship.x) < W.ship.L / 2 + 40) for (const p of shipParts(W)) if (x + r > p.L && x - r < p.R && y + r > p.T && y - r < p.B) return { kind: 'ship' };
    if (W.cable) for (let i = 0; i < W.cable.n; i++) { const c = cabin(W, i); if (Math.abs(x - c.x) < c.w / 2 + r && Math.abs(y - c.y) < c.h / 2 + r) return { kind: 'cabin', i }; }
    if (W.hotair) for (const b of W.hotair) {
      if (Math.hypot(x - b.x, y - b.y) < b.r * 0.94 + r) return { kind: 'hotair', i: b.i };
      const k = hotairBasket(b); if (x + r > k.L && x - r < k.R && y + r > k.T && y - r < k.B) return { kind: 'hotair', i: b.i };
    }
    return null;
  }
  // un vidrio: la celda de ventana que hay en (x, y), o -1 si es muro
  function windowAt(B, x, y) {
    const cx = Math.floor((x - B.ox) / B.cw), cy = Math.floor((y - B.oy) / B.ch);
    if (cx < 0 || cy < 0 || cx >= B.cols || cy >= B.rows) return -1;
    const lx = x - B.ox - cx * B.cw - (B.cw - B.wx) / 2, ly = y - B.oy - cy * B.ch - (B.ch - B.wy) / 2;
    if (lx < -3 || lx > B.wx + 3 || ly < -3 || ly > B.wy + 3) return -1;
    return cy * B.cols + cx;
  }
  // golpe en una fachada: revienta el vidrio que esté ahí
  function hitBuilding(W, B, x, y, n, G) {
    if (!B) return;
    // el golpe llega desde afuera: se busca la ventana más cercana al borde por donde entró
    const px = clamp(x, B.x0 + 1, B.x1 - 1), py = clamp(y, B.top + 1, B.bottom - 1);
    let k = windowAt(B, px, py);
    if (k < 0 && n > 1) k = windowAt(B, px + (px < (B.x0 + B.x1) / 2 ? 14 : -14), py);
    if (k >= 0 && !B.broken.has(k)) { B.broken.add(k); if (G) G.events.push({ type: 'glass', x: px, y: py, n: 1, B, side: x < B.x0 + 4 ? -1 : x > B.x1 - 4 ? 1 : 0 }); }
  }
  // explosión: revienta los vidrios cercanos, sacude las cabinas y deshace copas
  function blast(W, x, y, R, G) {
    if (W.buildings) for (const B of W.buildings) {
      if (x + R < B.x0 || x - R > B.x1 || y + R < B.top || y - R > B.bottom) continue;
      let cnt = 0;
      for (let cy = 0; cy < B.rows; cy++) {
        const wy = B.oy + cy * B.ch + B.ch / 2; if (Math.abs(wy - y) > R) continue;
        for (let cx = 0; cx < B.cols; cx++) {
          const wx = B.ox + cx * B.cw + B.cw / 2, k = cy * B.cols + cx;
          if (!B.broken.has(k) && Math.hypot(wx - x, wy - y) < R) { B.broken.add(k); cnt++; }
        }
      }
      if (cnt && G) G.events.push({ type: 'glass', x: clamp(x, B.x0, B.x1), y: clamp(y, B.top + 10, B.bottom - 10), n: cnt, B, side: x < B.x0 ? -1 : x > B.x1 ? 1 : 0 });
    }
    if (W.cable) for (let i = 0; i < W.cable.n; i++) { const c = cabin(W, i), d = Math.hypot(c.x - x, c.y - y); if (d < R * 1.6) W.cable.swingV[i] += (c.x > x ? 1 : -1) * 3 * (1 - d / (R * 1.6)); }
    if (W.hotair) for (const b of W.hotair) { const dx = b.x - x, dy = b.y - y, d = Math.hypot(dx, dy) || 1, f = 1 - d / (R * 2.2); if (f > 0) knockHotair(W, b.i, dx / d * 160 * f, dy / d * 200 * f); }
  }
  // la superficie más cercana debajo de (x, y): suelo, azotea o viaducto (para el vuelo rasante)
  function floorY(W, x, y) {
    let f = W.groundY(x);
    if (W.buildings) for (const B of W.buildings) if (x > B.x0 && x < B.x1 && y < B.top && B.top < f) f = B.top;
    if (W.ship) for (const p of shipParts(W)) if (p.kind !== 'mast' && x > p.L && x < p.R && y < p.T && p.T < f) f = p.T;
    if (W.hotair) for (const b of W.hotair) if (Math.abs(x - b.x) < b.r * 0.7 && y < b.y - b.r && b.y - b.r < f) f = b.y - b.r * 0.94;
    return f;
  }
  function nudgeCabin(W, i, dir) { if (W.cable) W.cable.swingV[i] += dir * 1.2; }
  // altura segura para aparecer en x (por encima de edificios y lejos del suelo)
  function safeY(W, x, above = 800) {
    let y = W.groundY(x) - above;
    if (W.buildings) for (const B of W.buildings) if (x > B.x0 - 120 && x < B.x1 + 120) y = Math.min(y, B.top - 260);
    if (W.ship && Math.abs(x - W.ship.x) < W.ship.L) y = Math.min(y, W.def.ground(W.ship.x) - 600);
    return Math.max(W.ceil + 120, y);
  }
  return { build, step, contact, windAt, hitCrown, resetRound, solidAt, hitBuilding, blast, nudgeCabin, cabin, trainRect, shipParts, safeY, floorY, isWater, windowAt, knockHotair, hotairBasket, thermalAt, HA };
})();
