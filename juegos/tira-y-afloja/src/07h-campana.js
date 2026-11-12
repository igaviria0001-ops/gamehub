/* =========================================================================
   CAMPAÑA COOPERATIVA — seis zonas del colegio, cada una con cinco salas de
   acertijos y un jefe al final que hay que vencer para seguir.
   Las salas se arman con un constructor (B) y viven en la arena oculta
   'campana' (una variante por sala). Mecanismos: placas que solo hunde el
   peso, botones, palancas que se golpean, rejas, papel que solo aguanta a
   los livianos, poleas, ventiladores (las corrientes levantan al liviano),
   plataformas que se mueven o se desmoronan, colchonetas, bandas, ganchos,
   calor y frío, tachuelas y tinta. Tres estrellas por sala: terminarla,
   hacerlo antes del tiempo meta y encontrar las tres envolturas.
   ========================================================================= */
const Campaign = (() => {
  const ZONES = [
    { id: 'salon', name: 'El Salón', boss: 'aspiradora', music: 'cumbia', reward: { type: 'acc', id: 'birrete', name: 'Birrete' } },
    { id: 'arte', name: 'Salón de Arte', boss: 'sacapuntas', music: 'dembow', reward: { type: 'flavor', id: 'algodon', name: 'sabor Algodón de azúcar' } },
    { id: 'gimnasio', name: 'El Gimnasio', boss: 'aseador', music: 'surf', reward: { type: 'acc', id: 'vincha', name: 'Vincha deportiva' } },
    { id: 'biblioteca', name: 'La Biblioteca', boss: 'fotocopiadora', music: 'lofi', reward: { type: 'flavor', id: 'cola', name: 'sabor Cola' } },
    { id: 'cafeteria', name: 'La Cafetería', boss: 'microondas', music: 'salsa', reward: { type: 'acc', id: 'chef', name: 'Gorro de chef' } },
    { id: 'torre', name: 'La Torre del Reloj', boss: 'reloj', music: 'arcade', reward: { type: 'flavor', id: 'oro', name: 'sabor Chicle de oro' } },
  ];
  const ROOMS = [];   // salas en orden
  const BYID = {};
  let S = null;       // estado de la sala actual

  const data = (() => {
    const d = Store.get('camp', null);
    return d && d.stars ? Object.assign({ best: {}, wr: {}, rewards: {} }, d) : { stars: {}, best: {}, wr: {}, rewards: {} };
  })();
  const save = () => Store.set('camp', data);

  /* ---------------- etapas: 5 salas + jefe por zona ---------------- */
  function stages() {
    const out = [];
    ZONES.forEach((Z, zi) => {
      const rs = ROOMS.filter(r => r.zone === zi);
      if (!rs.length) return; // zona aún sin salas
      rs.forEach(r => out.push({ type: 'room', id: r.id, zone: zi, room: r }));
      out.push({ type: 'boss', id: `jefe-${zi + 1}`, zone: zi, jefe: Z.boss });
    });
    return out;
  }
  function stageIndex(id) { return stages().findIndex(s => s.id === id); }
  function unlocked(id) {
    const st = stages(), i = st.findIndex(s => s.id === id);
    if (i <= 0) return true;
    return !!data.stars[st[i - 1].id];
  }
  function totalStars() { return Object.values(data.stars).reduce((a, b) => a + b, 0); }

  /* ---------------- constructor de salas ---------------- */
  function makeBuilder() {
    const L = {
      solids: [], oneway: [], pegs: [], zones: [], hazards: [], objs: [], deco: [],
      hazardY: 1010, ceilY: -6, deskLeft: -9999, deskRight: 99999, deskY: 5000, canRim: 2000,
      cans: [{ x: -600, w: 200, color: '#888', dark: '#666', light: '#aaa', label: '' }, { x: 2320, w: 200, color: '#888', dark: '#666', light: '#aaa', label: '' }],
      spawns: [{ x: 300, y: 880 }, { x: 460, y: 880 }],
    };
    const S_ = (o) => { L.solids.push(o); return o; };
    const B = {
      L,
      ground(x0, x1, y = 880) { return S_({ x: x0, y, w: x1 - x0, h: 1300 - y, kind: 'ground' }); },
      block(x, y, w, h, look = 'crate') { return S_({ x, y, w, h, kind: 'block', look }); },
      wall(x, y, w, h) { return S_({ x, y, w, h, kind: 'wall' }); },
      plank(x, y, w, look = 'plank') { const o = { x, y, w, h: 18, kind: 'plank', look }; L.oneway.push(o); return o; },
      plate(id, x, y, w = 130, need = 4.5, latch = false) { const o = S_({ x, y: y - 16, w, h: 16, kind: 'plate', id, need, latch, pressed: false }); L.objs.push(o); return o; },
      button(id, x, y, w = 96, latch = false) { const o = S_({ x, y: y - 14, w, h: 14, kind: 'button', id, latch, pressed: false }); L.objs.push(o); return o; },
      lever(id, x, y, latch = false) { const o = { kind: 'lever', id, x, y, on: false, cd: 0, latch }; L.objs.push(o); return o; },
      gate(x, y, w, h, on, dir = 'up', opts = {}) { const o = S_(Object.assign({ x, y, w, h, kind: 'gate', on: [].concat(on), dir, open: 0, invert: false, all: true }, opts)); L.objs.push(o); return o; },
      paper(x, y, w, max = 2.2) { const o = S_({ x, y, w, h: 16, kind: 'paper', max, crack: 0 }); L.objs.push(o); return o; },
      lift(id, ax, ay, bx, by, w = 150, range = 240, pulleyY = 90, minD = null) {
        const a = S_({ x: ax, y: ay, w, h: 20, kind: 'lift' }), b = S_({ x: bx, y: by, w, h: 20, kind: 'lift' });
        const o = { kind: 'liftPair', id, a, b, ay, by, range, minD: minD === null ? -range : minD, d: 0, v: 0, pulleyY }; L.objs.push(o); return o;
      },
      fan(x, y, w, h, dir = 'up', power = 3600) { const o = { kind: 'fan', x, y, w, h, dir, power, on: true, link: null }; L.objs.push(o); return o; },
      mover(x, y, w, dx, dy, period = 4, phase = 0) {
        const o = { x, y, w, h: 18, kind: 'mover', move(R, t) { const s = Math.sin((t / period) * TAU + phase); R.x = R.x0 + dx * s; R.y = R.y0 + dy * s; } };
        L.oneway.push(o); return o;
      },
      crumble(x, y, w) { const o = { x, y, w, h: 18, kind: 'crumble', t: 0, gone: 0 }; L.oneway.push(o); L.objs.push(o); return o; },
      tramp(x, y, w = 150, bounce = 1450) { return S_({ x, y: y - 14, w, h: 14, kind: 'tramp', bounce, squish: 0, stepOn: true }); },
      belt(x, y, w, speed) { return S_({ x, y: y - 24, w, h: 24, kind: 'belt', conveyor: speed, scroll: 0 }); },
      slip(x, y, w, color = '#3f8cf0') { return S_({ x, y: y - 7, w, h: 7, kind: 'paint', slip: true, color }); },
      glue(x, y, w) { return S_({ x, y: y - 7, w, h: 7, kind: 'glue', glue: true }); },
      peg(x, y, r = 16) { const o = { x, y, r, kind: 'hook' }; L.pegs.push(o); return o; },
      ring(ax, ay, len, amp = 60, speed = 1.4) { const o = { x: ax, y: ay + len, r: 17, kind: 'ring', hold: 3, ax, ay, len, amp, speed, move(R, t) { const dx = Math.sin(t * R.speed) * R.amp; R.x = R.ax + dx; R.y = R.ay + Math.sqrt(R.len * R.len - dx * dx); } }; L.pegs.push(o); return o; },
      // bibliotecaria: mientras mira (ojo abierto), caer fuerte dentro de su zona = ¡SHHH! y se repite la sala
      eye(x, y, zone, open = 2.4, closed = 2.2, phase = 0) { const o = { kind: 'eye', x, y, zx: zone[0], zy: zone[1], zw: zone[2], zh: zone[3], open, closed, phase, t: 0, state: 'closed', warn: 0, lookX: 0 }; L.objs.push(o); return o; },
      // carrito de libros: solo lo empuja alguien con peso ≥ minMass; cae a los huecos y pisa placas (peso 6)
      cart(x, y, w = 170, h = 110, minMass = 3.6) { const o = S_({ x, y: y - h, w, h, kind: 'cart', minMass, weight: 6, vx: 0, vy: 0, push: 0, onR: null, move(R, t, dt, G, A) { cartMove(R, dt, G, A); } }); L.objs.push(o); return o; },
      // engranaje: n plataformas que giran en círculo (rueda de la torre)
      wheel(cx, cy, r, n = 4, w = 130, period = 8, dir = 1) {
        const W0 = { kind: 'wheel', cx, cy, r, n, period, dir, a: 0 }; L.objs.push(W0);
        for (let k = 0; k < n; k++) {
          const o = { x: cx - w / 2, y: cy, w, h: 18, kind: 'mover', wheel: W0, move(R, t) { const a = dir * t / period * TAU + k * TAU / n; W0.a = dir * t / period * TAU; R.x = cx + Math.cos(a) * r - w / 2; R.y = cy + Math.sin(a) * r; } };
          o.move(o, 0); L.oneway.push(o);
        }
        return W0;
      },
      // péndulo: la pesa empuja a quien toque (si estás pegado, aguantas)
      pendulum(px, py, len, amp = 0.9, period = 3, phase = 0, r = 46) { const o = { kind: 'pendulum', px, py, len, amp, period, phase, r, x: px, y: py + len, vx: 0, vy: 0, cd: [0, 0] }; L.objs.push(o); return o; },
      // manecilla: fila de clavijas que gira; se puede pisar o pegarse a ella
      hand(cx, cy, len, period = 10, phase = 0, n = 8, dir = 1) {
        const H = { kind: 'hand', cx, cy, len, period, phase, dir, a: phase, tk: -1, off: false }; L.objs.push(H);
        for (let k = 1; k <= n; k++) {
          const f = k / n;
          // el ángulo se acumula: así un jefe puede cambiarle la velocidad (H.period, H.dir) sin saltos
          const o = { x: cx, y: cy, r: 15, kind: 'handpeg', hold: 3, hand: H, move(R, t, dt) { if (H.tk !== t) { H.tk = t; H.a += H.dir * (dt || 0) / H.period * TAU; } if (H.off) { R.x = -600; R.y = -600; return; } R.x = H.cx + Math.cos(H.a) * H.len * f; R.y = H.cy + Math.sin(H.a) * H.len * f; } };
          o.move(o, 0, 0); L.pegs.push(o);
        }
        return H;
      },
      // campana: cada tanto suena y empuja a todos los que estén cerca (pegados aguantan)
      bell(x, y, period = 5, phase = 0, radius = 460, power = 1100) { const o = { kind: 'bell', x, y, period, phase, radius, power, t: 0, ring: 0, warn: 0, last: -1 }; L.objs.push(o); return o; },
      scissors(x, y, range = 400, period = 5) { const o = { kind: 'scissors', x, y, x0: x, range, period }; L.objs.push(o); return o; },
      hazard(x, y, w, h, kind = 'tacks') { const o = { x, y, w, h, kind }; L.hazards.push(o); return o; },
      heat(x, y, w, h) { L.zones.push({ type: 'heat', x, y, w, h, active: 1 }); },
      cold(x, y, w, h) { L.zones.push({ type: 'cold', x, y, w, h, active: 1 }); },
      // olla de sopa: géiser de vapor que sube por ratos (avisa burbujeando) y calienta el hilo
      geyser(x, y, w = 140, h = 520, on = 1.6, off = 2.2, phase = 0, power = 12000) { const o = { kind: 'fan', geyser: true, x, y: y - h, w, h, dir: 'up', power, on: false, link: null, cycle: [on, off, phase], warn: 0 }; L.objs.push(o); L.zones.push({ type: 'heat', x, y: y - h, w, h, active: 0, geyser: o }); return o; },
      sign(x, y, text, opts = {}) { L.deco.push(Object.assign({ kind: 'sign', x, y, text }, opts)); },
      deco(kind, x, y, opts = {}) { L.deco.push(Object.assign({ kind, x, y }, opts)); },
    };
    return B;
  }

  function define(zone, room) {
    room.zone = zone;
    room.idx = ROOMS.filter(r => r.zone === zone).length;
    room.id = `${zone + 1}-${room.idx + 1}`;
    ROOMS.push(room); BYID[room.id] = room;
    const D = ARENA_DEFS.campana;
    D.variants[room.id] = () => buildLayout(room);
  }
  function buildLayout(room) {
    const B = makeBuilder();
    room.build(B);
    const L = B.L;
    L.room = room; L.theme = ZONES[room.zone].id;
    L.spawns = room.spawn.map(([x, y]) => ({ x, y }));
    L.respawnSpots = L.spawns;
    L.ropeLen = room.rope || 400; L.mass = room.mass || 3;
    L.exit = Object.assign({ w: 130, h: 190 }, room.exit);
    L.wrappers = (room.wrappers || []).map(([x, y]) => ({ x, y }));
    return L;
  }

  /* ---------------- arena oculta ---------------- */
  const THEMES = {
    salon: { wall: '#f6e7c8', wall2: '#efdcb6', low: '#5aa797', top: '#d89a5b', body: '#a5663a', grain: '#5c3218', plank: '#e0b070', crate: '#c98a4e' },
    arte: { wall: '#f1e8ff', wall2: '#e6daf7', low: '#7a5cc9', top: '#c58d5a', body: '#a8744a', grain: '#5c3218', plank: '#9aa7b8', crate: '#f2b631' },
    gimnasio: { wall: '#f3efe8', wall2: '#e7e1d6', low: '#ff8a3d', top: '#e2ac6c', body: '#c08349', grain: '#7a4a1a', plank: '#d39a5c', crate: '#4aa3ff' },
    biblioteca: { wall: '#2f5d4f', wall2: '#2a5447', low: '#5c3b22', top: '#a8743f', body: '#7a4a2a', grain: '#3a2210', plank: '#b98756', crate: '#8a5cd6' },
    cafeteria: { wall: '#fbf3e4', wall2: '#f0e4cf', low: '#4f86c6', top: '#cfd8e3', body: '#4f86c6', grain: '#2d4f80', plank: '#9aa7b8', crate: '#ff9a3c' },
    torre: { wall: '#ead6b4', wall2: '#e0c9a2', low: '#6d4c8f', top: '#9a8f84', body: '#6f655c', grain: '#3c342e', plank: '#d39a5c', crate: '#b98756' },
  };
  const rr2 = (...a) => ArenaArt.rr(...a), fs = (...a) => ArenaArt.fillStroke(...a);
  function paintWall(b, T, theme, rng) {
    b.fillStyle = T.wall; b.fillRect(0, 0, WORLD_W, WORLD_H);
    if (theme === 'salon' || theme === 'arte') { for (let x = 0; x < WORLD_W; x += 90) { b.fillStyle = T.wall2; b.fillRect(x, 0, 44, WORLD_H); } }
    if (theme === 'arte') {
      const cols = ['#ff5c9d', '#27d3b2', '#ffd84d', '#4aa3ff', '#ff9a3c', '#9b6bdf'];
      for (let i = 0; i < 40; i++) { b.fillStyle = rgba(pick(cols), 0.35); b.beginPath(); b.arc(rng() * WORLD_W, rng() * 700, 4 + rng() * 14, 0, TAU); b.fill(); }
    }
    if (theme === 'gimnasio' || theme === 'torre') {
      b.strokeStyle = 'rgba(150,110,70,0.18)'; b.lineWidth = 2;
      for (let y = 0; y < WORLD_H; y += 44) { b.beginPath(); b.moveTo(0, y); b.lineTo(WORLD_W, y); b.stroke(); for (let x = (y / 44) % 2 ? 0 : 48; x < WORLD_W; x += 96) { b.beginPath(); b.moveTo(x, y); b.lineTo(x, y + 44); b.stroke(); } }
      if (theme === 'gimnasio') { b.fillStyle = '#ff8a3d'; b.fillRect(0, 470, WORLD_W, 26); b.fillStyle = '#33427a'; b.fillRect(0, 496, WORLD_W, 10); }
    }
    if (theme === 'biblioteca') {
      // estanterías al fondo
      for (let x = 40; x < WORLD_W; x += 300) {
        b.fillStyle = 'rgba(0,0,0,0.18)'; b.fillRect(x, 80, 240, 760);
        for (let y = 120; y < 820; y += 120) {
          b.fillStyle = 'rgba(90,55,25,0.6)'; b.fillRect(x, y + 96, 240, 10);
          for (let k = 0; k < 11; k++) { b.fillStyle = rgba(pick(['#c0392b', '#2e86c1', '#d4ac0d', '#7d3c98', '#229954', '#ca6f1e']), 0.45); b.fillRect(x + 6 + k * 21, y + 30 + rng() * 20, 17, 66 - rng() * 20); }
        }
      }
    }
    if (theme === 'cafeteria') {
      for (let y = 0; y < 640; y += 40) for (let x = 0; x < WORLD_W; x += 40) if (((x + y) / 40) % 2 === 0) { b.fillStyle = T.wall2; b.fillRect(x, y, 40, 40); }
    }
    if (theme === 'torre') {
      [[300, 300, 120], [1650, 220, 150], [980, 140, 90]].forEach(([gx, gy, gr]) => {
        b.fillStyle = 'rgba(160,110,60,0.22)'; b.beginPath();
        for (let k = 0; k < 24; k++) { const a = k / 24 * TAU, r = k % 2 ? gr : gr * 0.86; b.lineTo(gx + Math.cos(a) * r, gy + Math.sin(a) * r); }
        b.closePath(); b.fill();
      });
    }
    // zócalo
    const g = b.createLinearGradient(0, 820, 0, WORLD_H); g.addColorStop(0, rgba(T.low, 0.0)); g.addColorStop(0.3, rgba(T.low, 0.55)); g.addColorStop(1, rgba(T.low, 0.85));
    b.fillStyle = g; b.fillRect(0, 820, WORLD_W, WORLD_H - 820);
  }
  function paintGround(b, R, T, rng) {
    const bottom = WORLD_H + 40;
    rr2(b, R.x, R.y + 10, R.w, bottom - R.y, 6); fs(b, T.body, 4);
    woodGrain(b, R.x + 4, R.y + 24, R.w - 8, bottom - R.y - 24, T.grain, rng, 13, 0.18);
    rr2(b, R.x - 6, R.y, R.w + 12, 26, 8); fs(b, T.top, 4);
    b.fillStyle = 'rgba(255,255,255,0.32)'; b.fillRect(R.x + 4, R.y + 5, R.w - 8, 5);
    b.fillStyle = 'rgba(0,0,0,0.18)'; b.fillRect(R.x + 2, R.y + 26, R.w - 4, 10);
  }
  function paintBlock(b, R, T, rng) {
    if (R.look === 'books') {
      const cols = ['#e5533d', '#3d7be5', '#f2b631', '#47b36b', '#8a5cd6', '#f08a3c'];
      let y = R.y; const n = Math.max(1, Math.round(R.h / 32)); const h = R.h / n;
      for (let i = 0; i < n; i++) { const inset = (i % 2) * 8; rr2(b, R.x + inset, y, R.w - inset * 1.5, h, 5); fs(b, cols[(i + Math.floor(R.x)) % cols.length], 3); b.fillStyle = 'rgba(255,255,255,0.3)'; b.fillRect(R.x + inset + 10, y + 5, R.w - inset * 1.5 - 20, 3); y += h; }
      return;
    }
    if (R.look === 'mat') { // colchonetas apiladas del gimnasio
      const n = Math.max(1, Math.round(R.h / 60)); const h = R.h / n;
      for (let i = 0; i < n; i++) { const y = R.y + i * h; rr2(b, R.x, y, R.w, h, 12); fs(b, i % 2 ? '#2f5fc4' : '#3d74e0', 3.5); b.fillStyle = 'rgba(255,255,255,0.28)'; b.fillRect(R.x + 12, y + 6, R.w - 24, 4); b.strokeStyle = 'rgba(255,255,255,0.35)'; b.setLineDash([8, 8]); b.lineWidth = 2; b.strokeRect(R.x + 8, y + 12, R.w - 16, h - 22); b.setLineDash([]); }
      return;
    }
    if (R.look === 'shelf') { rr2(b, R.x, R.y, R.w, R.h, 6); fs(b, '#7a4a2a', 4); for (let y = R.y + 30; y < R.y + R.h - 10; y += 60) { b.fillStyle = 'rgba(0,0,0,0.25)'; b.fillRect(R.x + 6, y, R.w - 12, 6); } return; }
    if (R.look === 'metal') { rr2(b, R.x, R.y, R.w, R.h, 8); fs(b, '#9aa7b8', 4); b.fillStyle = 'rgba(255,255,255,0.35)'; b.fillRect(R.x + 6, R.y + 6, R.w - 12, 5); b.fillStyle = INK; [[R.x + 10, R.y + 10], [R.x + R.w - 10, R.y + 10], [R.x + 10, R.y + R.h - 10], [R.x + R.w - 10, R.y + R.h - 10]].forEach(([x, y]) => { b.beginPath(); b.arc(x, y, 3, 0, TAU); b.fill(); }); return; }
    // caja de cartón / madera
    rr2(b, R.x, R.y, R.w, R.h, 8); fs(b, T.crate, 4);
    b.strokeStyle = 'rgba(58,34,22,0.35)'; b.lineWidth = 3;
    b.beginPath(); b.moveTo(R.x + 8, R.y + 8); b.lineTo(R.x + R.w - 8, R.y + R.h - 8); b.moveTo(R.x + R.w - 8, R.y + 8); b.lineTo(R.x + 8, R.y + R.h - 8); b.stroke();
    b.fillStyle = 'rgba(255,255,255,0.3)'; b.fillRect(R.x + 6, R.y + 5, R.w - 12, 4);
    void rng;
  }
  function paintWallBlock(b, R, T) { rr2(b, R.x, R.y, R.w, R.h, 6); fs(b, T.body, 4); b.fillStyle = 'rgba(255,255,255,0.18)'; b.fillRect(R.x + 5, R.y + 5, 6, R.h - 10); }
  function paintPlank(b, P, T) {
    rr2(b, P.x, P.y, P.w, P.h, 6); fs(b, T.plank, 4);
    b.fillStyle = 'rgba(255,255,255,0.3)'; b.fillRect(P.x + 6, P.y + 4, P.w - 12, 4);
    // soportes
    b.strokeStyle = INK; b.lineWidth = 4;
    [P.x + 18, P.x + P.w - 18].forEach(x => { b.beginPath(); b.moveTo(x, P.y + P.h); b.lineTo(x - 10, P.y + P.h + 26); b.stroke(); });
  }
  function paintTramp(b, R) {
    rr2(b, R.x - 8, R.y + 4, R.w + 16, 12, 6); fs(b, '#2e3440', 3.5);
    rr2(b, R.x, R.y - 2, R.w, 12, 6); fs(b, '#4aa3ff', 3.5);
    b.fillStyle = 'rgba(255,255,255,0.4)'; b.fillRect(R.x + 8, R.y + 3, R.w - 16, 3);
  }
  function paintBelt(b, R) { rr2(b, R.x, R.y, R.w, R.h, 12); fs(b, '#3a4250', 4); [R.x + 12, R.x + R.w - 12].forEach(x => { b.beginPath(); b.arc(x, R.y + R.h / 2, 9, 0, TAU); b.fillStyle = '#9aa7b8'; b.fill(); b.stroke(); }); }
  function paintStrip(b, R) { rr2(b, R.x, R.y, R.w, R.h + 2, 3); fs(b, R.glue ? '#f4f1e8' : R.color, 2.5); if (R.glue) { b.fillStyle = 'rgba(58,34,22,0.35)'; b.font = font(11, 700); b.textAlign = 'center'; b.fillText('PEGANTE', R.x + R.w / 2, R.y - 4); } }
  function paintHazard(b, H) {
    if (H.kind === 'soup') {
      rr2(b, H.x, H.y, H.w, H.h + 30, 10); b.fillStyle = '#f29a3c'; b.fill(); b.strokeStyle = INK; b.lineWidth = 3; b.stroke();
      b.fillStyle = 'rgba(255,230,170,0.7)'; for (let x = H.x + 20; x < H.x + H.w - 10; x += 46) { b.beginPath(); b.ellipse(x, H.y + 8, 12, 4, 0, 0, TAU); b.fill(); }
      b.fillStyle = '#7fbf4a'; for (let x = H.x + 34; x < H.x + H.w - 10; x += 70) { b.fillRect(x, H.y + 14, 10, 6); }
      return;
    }
    if (H.kind === 'ink') {
      rr2(b, H.x, H.y, H.w, H.h, 10); b.fillStyle = '#1f2a4d'; b.fill(); b.strokeStyle = INK; b.lineWidth = 3; b.stroke();
      b.fillStyle = 'rgba(120,150,255,0.5)'; b.fillRect(H.x + 10, H.y + 4, H.w - 20, 4);
      return;
    }
    if (H.kind === 'ice') { // carámbanos
      const n = Math.max(1, Math.floor(H.w / 30));
      b.fillStyle = '#dff4ff'; b.fillRect(H.x, H.y + H.h - 8, H.w, 8);
      for (let i = 0; i < n; i++) { const cx = H.x + (i + 0.5) * H.w / n, by = H.y + H.h - 6, hh = 30 + (i * 13) % 18; b.beginPath(); b.moveTo(cx - 11, by); b.lineTo(cx, by - hh); b.lineTo(cx + 11, by); b.closePath(); b.fillStyle = '#bfe8ff'; b.fill(); b.strokeStyle = INK; b.lineWidth = 2.5; b.stroke(); }
      return;
    }
    // tachuelas
    const n = Math.max(1, Math.floor(H.w / 34));
    for (let i = 0; i < n; i++) {
      const cx = H.x + (i + 0.5) * H.w / n, by = H.y + H.h;
      b.beginPath(); b.ellipse(cx, by - 6, 15, 6, 0, 0, TAU); b.fillStyle = pick(['#e5533d', '#3d7be5', '#f2b631', '#47b36b']); b.fill(); b.strokeStyle = INK; b.lineWidth = 2.5; b.stroke();
      b.beginPath(); b.moveTo(cx - 3, by - 8); b.lineTo(cx, H.y); b.lineTo(cx + 3, by - 8); b.closePath(); b.fillStyle = '#c9d3dc'; b.fill(); b.stroke();
    }
  }
  function paintDeco(b, d) {
    if (d.kind === 'sign') {
      b.font = font(d.size || 22, 700); const w = b.measureText(d.text).width + 28;
      rr2(b, d.x - w / 2, d.y - 20, w, 40, 10); fs(b, d.color || '#fff6e6', 3);
      b.fillStyle = INK; b.textAlign = 'center'; b.textBaseline = 'middle'; b.fillText(d.text, d.x, d.y + 1);
      if (d.arrow) { b.font = font(30, 700); b.fillText(d.arrow, d.x + (d.arrow === '→' ? w / 2 + 24 : d.arrow === '←' ? -w / 2 - 24 : 0), d.y + (d.arrow === '↑' ? -40 : d.arrow === '↓' ? 40 : 0)); }
    } else if (d.kind === 'window') {
      rr2(b, d.x, d.y, 260, 200, 10); fs(b, '#9fd3f5', 6);
      b.strokeStyle = '#8a5a2b'; b.lineWidth = 8; b.beginPath(); b.moveTo(d.x + 130, d.y); b.lineTo(d.x + 130, d.y + 200); b.moveTo(d.x, d.y + 100); b.lineTo(d.x + 260, d.y + 100); b.stroke();
      b.fillStyle = 'rgba(255,255,255,0.7)'; b.beginPath(); b.ellipse(d.x + 70, d.y + 60, 34, 14, 0, 0, TAU); b.fill();
    } else if (d.kind === 'board') {
      rr2(b, d.x, d.y, d.w || 520, 240, 10); fs(b, '#2f6150', 8);
      b.strokeStyle = '#c98a4e'; b.lineWidth = 10; b.strokeRect(d.x - 4, d.y - 4, (d.w || 520) + 8, 248);
      if (d.text) { b.fillStyle = 'rgba(246,242,232,0.85)'; b.font = font(30, 600); b.textAlign = 'left'; b.textBaseline = 'top'; String(d.text).split('\n').forEach((l, i) => b.fillText(l, d.x + 26, d.y + 26 + i * 40)); }
    } else if (d.kind === 'poster') {
      rr2(b, d.x, d.y, 150, 190, 8); fs(b, d.color || '#ffd84d', 4);
      b.fillStyle = INK; b.font = font(20, 700); b.textAlign = 'center'; b.textBaseline = 'middle';
      String(d.text || '').split('\n').forEach((l, i) => b.fillText(l, d.x + 75, d.y + 60 + i * 28));
    } else if (d.kind === 'bars') { // espalderas
      const w = d.w || 260, h = d.h || 420;
      b.lineWidth = 4; b.strokeStyle = INK;
      [d.x, d.x + w].forEach(x => { rr2(b, x - 9, d.y, 18, h, 6); fs(b, '#c98a4e', 3); });
      for (let y = d.y + 30; y < d.y + h - 10; y += 46) { rr2(b, d.x, y, w, 10, 5); fs(b, '#e2ac6c', 2.5); }
    } else if (d.kind === 'hoop') { // aro de baloncesto
      rr2(b, d.x - 90, d.y - 120, 180, 120, 8); fs(b, '#ffffff', 5);
      b.strokeStyle = '#e5533d'; b.lineWidth = 5; b.strokeRect(d.x - 36, d.y - 70, 72, 50);
      b.beginPath(); b.ellipse(d.x, d.y + 6, 44, 10, 0, 0, TAU); b.strokeStyle = '#ff6a1f'; b.lineWidth = 6; b.stroke();
      b.strokeStyle = 'rgba(255,255,255,0.9)'; b.lineWidth = 2;
      for (let k = -3; k <= 3; k++) { b.beginPath(); b.moveTo(d.x + k * 13, d.y + 10); b.lineTo(d.x + k * 8, d.y + 70); b.stroke(); }
    } else if (d.kind === 'clockface') { // esfera grande del reloj
      const r = d.r || 380;
      b.beginPath(); b.arc(d.x, d.y, r + 26, 0, TAU); b.fillStyle = '#8a5a2b'; b.fill(); b.lineWidth = 6; b.strokeStyle = INK; b.stroke();
      b.beginPath(); b.arc(d.x, d.y, r, 0, TAU); b.fillStyle = '#fff3d6'; b.fill(); b.stroke();
      b.fillStyle = INK; b.font = font(46, 800); b.textAlign = 'center'; b.textBaseline = 'middle';
      const nums = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU - Math.PI / 2; b.fillText(nums[k], d.x + Math.cos(a) * r * 0.82, d.y + Math.sin(a) * r * 0.82); }
      for (let k = 0; k < 60; k++) { const a = k / 60 * TAU; const r0 = k % 5 ? r * 0.94 : r * 0.9; b.beginPath(); b.moveTo(d.x + Math.cos(a) * r0, d.y + Math.sin(a) * r0); b.lineTo(d.x + Math.cos(a) * r * 0.98, d.y + Math.sin(a) * r * 0.98); b.lineWidth = k % 5 ? 2 : 5; b.stroke(); }
    } else if (d.kind === 'clock') {
      b.beginPath(); b.arc(d.x, d.y, d.r || 70, 0, TAU); b.fillStyle = '#fff6e0'; b.fill(); b.lineWidth = 8; b.strokeStyle = '#8a5a2b'; b.stroke();
    }
  }
  function paintExit(b, E, T) {
    const x = E.x - E.w / 2, y = E.y - E.h;
    rr2(b, x - 12, y - 12, E.w + 24, E.h + 12, 10); fs(b, '#8a5a2b', 4);
    rr2(b, x, y, E.w, E.h, 6); fs(b, '#c98a4e', 4);
    rr2(b, x + 22, y + 22, E.w - 44, 60, 6); fs(b, '#bfe3f7', 3);
    b.beginPath(); b.arc(x + E.w - 22, y + E.h * 0.55, 7, 0, TAU); b.fillStyle = '#ffd84d'; b.fill(); b.lineWidth = 3; b.stroke();
    rr2(b, E.x - 62, y - 62, 124, 38, 8); fs(b, '#2f9e5a', 4);
    b.fillStyle = '#ffffff'; b.font = font(22, 700); b.textAlign = 'center'; b.textBaseline = 'middle'; b.fillText('SALIDA', E.x, y - 42);
    void T;
  }
  const isDynamicSolid = R => ['plate', 'button', 'gate', 'paper', 'lift', 'tramp', 'belt'].includes(R.kind) || R.move;
  function paintBg(b, rng, L) {
    const theme = L.theme || 'salon', T = THEMES[theme];
    paintWall(b, T, theme, rng);
    (L.deco || []).forEach(d => paintDeco(b, d));
    if (L.exit) paintExit(b, L.exit, T);
    (L.hazards || []).forEach(H => paintHazard(b, H));
    for (const R of L.solids) {
      if (R.kind === 'ground') paintGround(b, R, T, rng);
      else if (R.kind === 'block') paintBlock(b, R, T, rng);
      else if (R.kind === 'wall') paintWallBlock(b, R, T);
      else if (R.kind === 'tramp') paintTramp(b, R);
      else if (R.kind === 'belt') paintBelt(b, R);
      else if (R.kind === 'paint' || R.kind === 'glue') paintStrip(b, R);
    }
    for (const P of L.oneway) if (!P.move && P.kind === 'plank') paintPlank(b, P, T);
    // zonas de calor y frío
    for (const Z of L.zones || []) {
      if ((Z.type !== 'heat' && Z.type !== 'cold') || Z.geyser) continue;
      const g = b.createLinearGradient(0, Z.y + Z.h, 0, Z.y);
      g.addColorStop(0, Z.type === 'heat' ? 'rgba(255,120,60,0.35)' : 'rgba(120,200,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      b.fillStyle = g; b.fillRect(Z.x, Z.y, Z.w, Z.h);
    }
  }
  function paintFg() { /* sin canecas */ }

  /* dibujo de lo que se mueve o cambia */
  function drawDynamic(ctx, t, G, A) {
    const L = A.L; if (!L || !L.room) return;
    const T = THEMES[L.theme];
    for (const o of L.objs) {
      if (o.kind === 'gate') drawGate(ctx, o, t);
      else if (o.kind === 'plate' || o.kind === 'button') drawPlate(ctx, o, t);
      else if (o.kind === 'paper') drawPaper(ctx, o, t);
      else if (o.kind === 'liftPair') drawLift(ctx, o, t);
      else if (o.kind === 'fan') drawFan(ctx, o, t);
      else if (o.kind === 'lever') drawLever(ctx, o, t);
      else if (o.kind === 'crumble') drawCrumble(ctx, o, t, T);
      else if (o.kind === 'scissors') drawScissors(ctx, o, t);
      else if (o.kind === 'cart') drawCart(ctx, o);
      else if (o.kind === 'eye') drawEye(ctx, o, t);
    }
    for (const o of L.objs) {
      if (o.kind === 'wheel') drawWheel(ctx, o);
      else if (o.kind === 'hand') drawHand(ctx, o);
      else if (o.kind === 'pendulum') drawPendulum(ctx, o);
      else if (o.kind === 'bell') drawBell(ctx, o, t);
    }
    for (const P of A.oneway) if (P.kind === 'mover') { rr2(ctx, P.x, P.y, P.w, P.h, 6); fs(ctx, '#9aa7b8', 4); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(P.x + 6, P.y + 4, P.w - 12, 4); }
    for (const K of A.pegs) {
      if (K.kind === 'handpeg') continue;
      if (K.kind === 'ring') { ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(K.ax, K.ay); ctx.lineTo(K.x, K.y - K.r); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(K.x, K.y, K.r, 0, TAU); ctx.fillStyle = K.kind === 'ring' ? 'rgba(0,0,0,0)' : '#d8a63a'; ctx.fill(); ctx.lineWidth = K.kind === 'ring' ? 8 : 4; ctx.strokeStyle = K.kind === 'ring' ? '#e0b070' : INK; ctx.stroke();
      if (K.kind === 'ring') { ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(K.x, K.y, K.r + 4, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(K.x, K.y, K.r - 4, 0, TAU); ctx.stroke(); }
      else { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(K.x - 4, K.y - 5, 4, 0, TAU); ctx.fill(); }
    }
    for (const R of A.solids) if (R.kind === 'belt') { R.scroll = (R.scroll || 0) + (R.conveyor || 0) / 120; ctx.save(); rr2(ctx, R.x + 4, R.y + 3, R.w - 8, R.h - 6, 9); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; for (let x = R.x - 40 + ((R.scroll % 40) + 40) % 40; x < R.x + R.w; x += 40) ctx.fillRect(x, R.y + 3, 14, R.h - 6); ctx.restore(); }
    // envolturas
    if (S && S.wr) S.wr.forEach((w, i) => { if (!w.got) drawWrapper(ctx, w.x, w.y + Math.sin(t * 3 + i) * 6, t, i, w.before); });
    // la puerta se ilumina cuando entra alguien
    if (L.exit && S) {
      const E = L.exit, n = S.inDoor || 0;
      if (n > 0) { ctx.save(); ctx.globalAlpha = 0.35 + 0.2 * Math.sin(t * 8); ctx.fillStyle = '#9dffb0'; rr2(ctx, E.x - E.w / 2, E.y - E.h, E.w, E.h, 6); ctx.fill(); ctx.restore(); outlinedText(ctx, n === 1 ? '¡FALTA EL OTRO!' : '¡LISTOS!', E.x, E.y - E.h - 90, 26, '#9dffb0', INK); }
    }
  }
  function drawGate(ctx, R, t) {
    rr2(ctx, R.x, R.y, R.w, R.h, 6); fs(ctx, '#7d8796', 4);
    ctx.save(); rr2(ctx, R.x, R.y, R.w, R.h, 6); ctx.clip();
    ctx.strokeStyle = 'rgba(255,214,77,0.9)'; ctx.lineWidth = 6;
    if (R.w > R.h) for (let x = R.x + 10; x < R.x + R.w; x += 34) { ctx.beginPath(); ctx.moveTo(x, R.y + R.h); ctx.lineTo(x + 16, R.y); ctx.stroke(); }
    else for (let y = R.y + 10; y < R.y + R.h; y += 34) { ctx.beginPath(); ctx.moveTo(R.x, y + 16); ctx.lineTo(R.x + R.w, y); ctx.stroke(); }
    ctx.restore();
    // luz: roja cerrada, verde abierta
    ctx.beginPath(); ctx.arc(R.x + R.w / 2, R.y + R.h / 2, 9, 0, TAU); ctx.fillStyle = R.open > 0.5 ? '#3fbf6a' : '#e0483a'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    void t;
  }
  function drawPlate(ctx, P, t) {
    const down = P.pressed ? 7 : 0, plate = P.kind === 'plate';
    rr2(ctx, P.x - 8, P.y + 8, P.w + 16, 10, 3); fs(ctx, '#55627d', 3);
    rr2(ctx, P.x, P.y + down, P.w, P.h - down + 4, 6); fs(ctx, P.pressed ? '#3fbf6a' : plate ? '#f2b631' : '#e0483a', 3.5);
    if (plate) {
      // la pesa que pide
      const cx = P.x + P.w / 2, cy = P.y - 34;
      ctx.beginPath(); ctx.moveTo(cx - 26, cy + 18); ctx.lineTo(cx - 18, cy - 10); ctx.lineTo(cx + 18, cy - 10); ctx.lineTo(cx + 26, cy + 18); ctx.closePath();
      ctx.fillStyle = P.pressed ? '#3fbf6a' : '#3a4250'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy - 14, 7, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.font = font(15, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(P.need).replace('.', ','), cx, cy + 6);
      if (P.load > 0 && !P.pressed) { ctx.fillStyle = PALETTE.ink; ctx.font = font(14, 700); ctx.fillText(`${P.load.toFixed(1).replace('.', ',')} / ${String(P.need).replace('.', ',')}`, cx, cy - 34); }
    } else if (!P.pressed && Math.floor(t * 2) % 2 === 0) { ctx.fillStyle = '#ffffff'; ctx.font = font(13, 700); ctx.textAlign = 'center'; ctx.fillText('PISA', P.x + P.w / 2, P.y - 8); }
  }
  function drawPaper(ctx, R, t) {
    if (R.solidOff) { if (R.fallT !== undefined && R.fallT < 1.2) { R.fallT += 1 / 60; ctx.save(); ctx.globalAlpha = 1 - R.fallT / 1.2; ctx.translate(R.x + R.w / 2, R.y + R.fallT * R.fallT * 700); ctx.rotate(R.fallT); rr2(ctx, -R.w / 2, 0, R.w * 0.45, 14, 3); fs(ctx, '#fffdf5', 2.5); rr2(ctx, 0, 4, R.w * 0.45, 14, 3); fs(ctx, '#fffdf5', 2.5); ctx.restore(); } return; }
    const sh = R.crack > 0 ? (Math.random() - 0.5) * 4 : 0;
    rr2(ctx, R.x + sh, R.y, R.w, R.h, 3); fs(ctx, '#fffdf5', 3);
    ctx.strokeStyle = 'rgba(80,140,220,0.5)'; ctx.lineWidth = 1.5;
    for (let x = R.x + 12; x < R.x + R.w - 6; x += 18) { ctx.beginPath(); ctx.moveTo(x + sh, R.y + 3); ctx.lineTo(x + sh, R.y + R.h - 3); ctx.stroke(); }
    ctx.fillStyle = PALETTE.ink; ctx.font = font(13, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(`PAPEL · máx ${String(R.max).replace('.', ',')}`, R.x + R.w / 2, R.y - 6);
    void t;
  }
  function drawLift(ctx, o, t) {
    const { a, b } = o, py = o.pulleyY;
    const ax = a.x + a.w / 2, bx = b.x + b.w / 2;
    ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(ax, a.y); ctx.lineTo(ax, py); ctx.lineTo(bx, py); ctx.lineTo(bx, b.y); ctx.stroke();
    for (const x of [ax, bx]) { ctx.beginPath(); ctx.arc(x, py, 18, 0, TAU); ctx.fillStyle = '#9aa7b8'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.save(); ctx.translate(x, py); ctx.rotate(o.d * 0.03); ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.moveTo(0, -12); ctx.lineTo(0, 12); ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); }
    for (const P of [a, b]) { rr2(ctx, P.x, P.y, P.w, P.h, 6); fs(ctx, '#e0b070', 4); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(P.x + 6, P.y + 4, P.w - 12, 4); }
    void t;
  }
  function drawWheel(ctx, o) {
    const { cx, cy, r } = o;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(o.a || 0);
    // engranaje
    const R = r * 0.55, teeth = 14;
    ctx.beginPath();
    for (let k = 0; k < teeth * 2; k++) { const a = k / (teeth * 2) * TAU, rr = k % 2 ? R : R + 16; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = '#b8863a'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, R * 0.55, 0, TAU); ctx.fillStyle = '#8a5a2b'; ctx.fill(); ctx.stroke();
    // rayos hacia las plataformas
    ctx.lineWidth = 8; ctx.strokeStyle = '#6b4a2a';
    for (let k = 0; k < o.n; k++) { const a = k * TAU / o.n; ctx.beginPath(); ctx.moveTo(Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fillStyle = '#ffd84d'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
  }
  function drawHand(ctx, o) {
    ctx.save(); ctx.translate(o.cx, o.cy); ctx.rotate(o.a || 0);
    ctx.beginPath(); ctx.moveTo(-30, -10); ctx.lineTo(o.len - 30, -16); ctx.lineTo(o.len + 26, 0); ctx.lineTo(o.len - 30, 16); ctx.lineTo(-30, 10); ctx.closePath();
    ctx.fillStyle = '#2f3542'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(0, -6, o.len - 40, 4);
    ctx.restore();
    ctx.beginPath(); ctx.arc(o.cx, o.cy, 22, 0, TAU); ctx.fillStyle = '#ffd84d'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
  }
  function drawPendulum(ctx, o) {
    ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(o.px, o.py); ctx.lineTo(o.x, o.y); ctx.stroke();
    ctx.beginPath(); ctx.arc(o.px, o.py, 10, 0, TAU); ctx.fillStyle = '#ffd84d'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, TAU);
    const g = ctx.createRadialGradient(o.x - o.r * 0.4, o.y - o.r * 0.4, 4, o.x, o.y, o.r); g.addColorStop(0, '#ffe7a0'); g.addColorStop(1, '#c9932e');
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 0.55, 0, TAU); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(58,34,22,0.45)'; ctx.stroke();
  }
  function drawBell(ctx, o, t) {
    const sh = o.warn ? Math.sin(t * 50) * 0.12 * o.warn : o.ring > 0 ? Math.sin(t * 30) * 0.2 * o.ring : 0;
    // ondas
    if (o.ring > 0) { for (let k = 0; k < 3; k++) { const f = 1 - o.ring / 1.2 + k * 0.12; if (f > 1) continue; ctx.beginPath(); ctx.arc(o.x, o.y, o.radius * f, 0, TAU); ctx.lineWidth = 6 * (1 - f); ctx.strokeStyle = `rgba(255,216,77,${0.8 * (1 - f)})`; ctx.stroke(); } }
    else if (o.warn) { ctx.beginPath(); ctx.arc(o.x, o.y, o.radius, 0, TAU); ctx.setLineDash([14, 12]); ctx.lineWidth = 3; ctx.strokeStyle = `rgba(229,83,61,${0.25 + o.warn * 0.4})`; ctx.stroke(); ctx.setLineDash([]); }
    ctx.save(); ctx.translate(o.x, o.y - 60); ctx.rotate(sh);
    ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(0, -20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-26, -20); ctx.quadraticCurveTo(-30, 30, -62, 60); ctx.lineTo(62, 60); ctx.quadraticCurveTo(30, 30, 26, -20); ctx.quadraticCurveTo(0, -36, -26, -20); ctx.closePath();
    ctx.fillStyle = '#e0a83a'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-14, -10, 6, 50);
    ctx.beginPath(); ctx.arc(0, 66, 12, 0, TAU); ctx.fillStyle = '#8a5a2b'; ctx.fill(); ctx.stroke();
    ctx.restore();
    if (o.warn && Math.floor(t * 6) % 2 === 0) { ctx.font = font(22, 800); ctx.fillStyle = '#e5533d'; ctx.textAlign = 'center'; ctx.fillText('¡PÉGUENSE!', o.x, o.y - 150); }
  }
  function drawGeyser(ctx, o, t) {
    const cx = o.x + o.w / 2, by = o.y + o.h;
    // vapor
    if (o.on || o.warn) {
      ctx.save();
      const n = o.on ? 16 : 5;
      for (let k = 0; k < n; k++) {
        const ph = (t * (o.on ? 1.3 : 0.6) + k / n) % 1;
        const yy = by - 40 - ph * (o.on ? o.h : 120), xx = cx + Math.sin(k * 2.3 + t * 2) * o.w * 0.35 * (0.4 + ph);
        ctx.globalAlpha = (1 - ph) * (o.on ? 0.55 : 0.35);
        ctx.beginPath(); ctx.arc(xx, yy, 18 + ph * 26, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
      }
      ctx.restore();
    }
    // la olla
    rr2(ctx, cx - o.w * 0.5, by - 70, o.w, 74, 14); fs(ctx, '#6f7f95', 4);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(cx - o.w * 0.5 + 10, by - 62, o.w - 20, 5);
    [-1, 1].forEach(s => { rr2(ctx, cx + s * (o.w * 0.5 + 6) - 9, by - 58, 18, 16, 6); fs(ctx, '#55627d', 3); });
    ctx.beginPath(); ctx.ellipse(cx, by - 70, o.w * 0.46, 13, 0, 0, TAU); ctx.fillStyle = '#f29a3c'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    // burbujas
    for (let k = 0; k < 4; k++) { const bb = (t * (o.warn || o.on ? 4 : 1.2) + k * 0.27) % 1; ctx.beginPath(); ctx.arc(cx - 30 + k * 20, by - 72 - bb * 10, 4 + bb * 3, 0, TAU); ctx.fillStyle = 'rgba(255,220,160,0.9)'; ctx.fill(); }
    if (o.warn && Math.floor(t * 8) % 2 === 0) { ctx.font = font(22, 800); ctx.fillStyle = '#e5533d'; ctx.textAlign = 'center'; ctx.fillText('¡VAPOR!', cx, by - 100); }
  }
  function drawFan(ctx, o, t) {
    if (o.geyser) return drawGeyser(ctx, o, t);
    const up = o.dir === 'up', on = o.on;
    // corriente
    if (on) {
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 3;
      for (let k = 0; k < 7; k++) {
        const ph = (t * 1.6 + k * 0.37) % 1;
        if (up) { const x = o.x + 16 + ((k * 53) % (o.w - 32)), y = o.y + o.h - ph * o.h; ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(t * 4 + k) * 6, y - 40); ctx.stroke(); }
        else { const d = o.dir === 'right' ? 1 : -1, y = o.y + 14 + ((k * 41) % (o.h - 28)), x = d > 0 ? o.x + ph * o.w : o.x + o.w - ph * o.w; ctx.globalAlpha = Math.sin(ph * Math.PI) * 0.8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + d * 46, y + Math.sin(t * 4 + k) * 5); ctx.stroke(); }
      }
      ctx.restore();
    }
    // el ventilador
    const cx = up ? o.x + o.w / 2 : o.dir === 'right' ? o.x - 10 : o.x + o.w + 10, cy = up ? o.y + o.h + 10 : o.y + o.h / 2;
    ctx.save(); ctx.translate(cx, cy); if (!up) ctx.rotate(o.dir === 'right' ? -Math.PI / 2 : Math.PI / 2);
    rr2(ctx, -o.w * 0.5 * (up ? 1 : 0.4) - 10, -6, o.w * (up ? 1 : 0.4) + 20, 22, 8); fs(ctx, '#55627d', 4);
    ctx.save(); ctx.scale(1, 0.3); ctx.rotate(on ? t * 18 : 0);
    for (let k = 0; k < 3; k++) { ctx.rotate(TAU / 3); ctx.beginPath(); ctx.ellipse(18, 0, 22, 9, 0, 0, TAU); ctx.fillStyle = '#c9d3dc'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); }
    ctx.restore(); ctx.restore();
  }
  function drawLever(ctx, o, t) {
    rr2(ctx, o.x - 26, o.y - 14, 52, 16, 6); fs(ctx, '#55627d', 3.5);
    ctx.save(); ctx.translate(o.x, o.y - 10); ctx.rotate(o.on ? 0.7 : -0.7);
    ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -54); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -58, 12, 0, TAU); ctx.fillStyle = o.on ? '#3fbf6a' : '#e0483a'; ctx.fill(); ctx.lineWidth = 3.5; ctx.stroke();
    ctx.restore();
    if (!o.on && Math.floor(t * 2) % 2 === 0) { ctx.fillStyle = '#ffffff'; ctx.font = font(13, 700); ctx.textAlign = 'center'; ctx.fillText('¡GOLPÉALA!', o.x, o.y - 84); }
  }
  function drawCrumble(ctx, P, t, T) {
    if (P.gone > 0) return;
    let x = P.x, y = P.y;
    if (P.t > 0) { x += (Math.random() - 0.5) * 5; y += (Math.random() - 0.5) * 3; }
    rr2(ctx, x, y, P.w, 18, 6); fs(ctx, '#b98756', 4);
    ctx.strokeStyle = 'rgba(58,34,22,0.7)'; ctx.lineWidth = 2;
    for (let k = 1; k < 4; k++) { const cx = x + P.w * k / 4; ctx.beginPath(); ctx.moveTo(cx, y + 2); ctx.lineTo(cx + 6, y + 9); ctx.lineTo(cx - 3, y + 16); ctx.stroke(); }
    void t; void T;
  }
  function drawScissors(ctx, o, t) {
    // riel
    ctx.strokeStyle = 'rgba(58,34,22,0.45)'; ctx.lineWidth = 4; ctx.setLineDash([10, 8]);
    ctx.beginPath(); ctx.moveTo(o.x0 - 20, o.y); ctx.lineTo(o.x0 + o.range + 20, o.y); ctx.stroke(); ctx.setLineDash([]);
    const a = 0.25 + Math.abs(Math.sin(t * 6)) * 0.35;
    ctx.save(); ctx.translate(o.x, o.y);
    for (const s of [-1, 1]) {
      ctx.save(); ctx.rotate(s * a);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(58, -7 * s); ctx.lineTo(60, 0); ctx.closePath(); ctx.fillStyle = '#c9d3dc'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-26, 10 * s, 16, 11, 0, 0, TAU); ctx.lineWidth = 7; ctx.strokeStyle = s < 0 ? '#e8574a' : '#4aa3ff'; ctx.stroke(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fillStyle = INK; ctx.fill();
    ctx.restore();
  }
  function drawWrapper(ctx, x, y, t, i, before) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 2 + i) * 0.2);
    ctx.globalAlpha = before ? 0.45 : 1;
    const col = ['#ff5c9d', '#27d3b2', '#ffd84d'][i % 3];
    ctx.beginPath(); ctx.moveTo(-28, -10); ctx.lineTo(-18, 0); ctx.lineTo(-28, 10); ctx.lineTo(-16, 10); ctx.lineTo(16, 10); ctx.lineTo(28, 10); ctx.lineTo(18, 0); ctx.lineTo(28, -10); ctx.closePath();
    ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    rr2(ctx, -14, -8, 28, 16, 4); ctx.fillStyle = '#fff6e6'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = col; ctx.font = font(10, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('T&A', 0, 1);
    if (!before) { const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 44); g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(-44, -44, 88, 88); }
    ctx.restore();
  }

  /* ---- carrito de libros ---- */
  function cartSupport(R, A) {
    let best = 99999, bestR = null;
    const x0 = R.x + R.w * 0.3, x1 = R.x + R.w * 0.7, bottom = R.y + R.h;
    for (const S of A.solids) {
      if (S === R || S.solidOff || S.kind === 'cart' && S.y < R.y) continue;
      if (S.x > x1 || S.x + S.w < x0) continue;
      if (S.y >= bottom - 26 && S.y < best) { best = S.y; bestR = S; } // sube escalones bajitos (placas, cintas)
    }
    return { y: best, R: bestR };
  }
  function cartBlocked(R, nx, A) {
    if (nx < 0 || nx + R.w > WORLD_W) return true;
    for (const S of A.solids) {
      if (S === R || S.solidOff) continue;
      if (S.y >= R.y + R.h - 26) continue; // lo bajito (placas, el piso) no lo frena
      if (nx < S.x + S.w && nx + R.w > S.x && R.y < S.y + S.h && R.y + R.h - 26 > S.y) return true;
    }
    return false;
  }
  function cartMove(R, dt, G, A) {
    if (!G || !G.players) return;
    let target = 0, heavy = false, light = false;
    for (const p of G.players) {
      if (!p.alive || !p.moveDir || !p.contacts) continue;
      const c = p.contacts.find(k => k.R === R && Math.abs(k.nx) > 0.6);
      if (!c || p.moveDir !== -Math.sign(c.nx)) continue;
      if (p.mass >= R.minMass - 1e-6) { target += p.moveDir * clamp(150 + (p.mass - R.minMass) * 50, 150, 260); heavy = true; } else light = true;
    }
    R.push = light && !heavy ? R.push + dt : 0;
    if (R.push > 0.5 && !G.quiet) { R.push = -1.2; FX.callout(`¡PESA MUCHO! (${String(R.minMass).replace('.', ',')})`, R.x + R.w / 2, R.y - 30, '#ffb0a0', 26, 1); }
    R.vx += (target - R.vx) * Math.min(1, dt * (target ? 14 : 16));
    const sup = cartSupport(R, A);
    if (R.y + R.h < sup.y - 0.5) {
      R.vy += 2200 * dt; R.y = Math.min(R.y + R.vy * dt, sup.y - R.h);
      if (R.y >= sup.y - R.h - 0.01) { if (R.vy > 400) { R.thud = R.vy; if (!G.quiet) { Sound.play('land', 1); FX.dust(R.x + R.w / 2, R.y + R.h, 10); } } R.vy = 0; }
      R.onR = null;
    } else { R.vy = 0; if (sup.R) R.y = sup.y - R.h; R.onR = sup.R; }
    // si al caer quedó metido en una pared o en el borde de un hueco, se acomoda de lado
    for (const S of A.solids) {
      if (S === R || S.solidOff || S.y >= R.y + R.h - 26) continue;
      if (R.x < S.x + S.w && R.x + R.w > S.x && R.y < S.y + S.h && R.y + R.h - 26 > S.y) {
        const dx = (R.x + R.w / 2 < S.x + S.w / 2) ? S.x - (R.x + R.w) : (S.x + S.w) - R.x;
        if (Math.abs(dx) < R.w * 0.5) { R.x += dx; R.vx = 0; }
      }
    }
    if (Math.abs(R.vx) > 0.5) { const nx = R.x + R.vx * dt; if (cartBlocked(R, nx, A)) R.vx = 0; else R.x = nx; }
    if (R.y > 1400) { R.y = 1400; R.vy = 0; }
  }
  function drawCart(ctx, R) {
    const x = R.x, y = R.y, w = R.w, h = R.h;
    // ruedas
    [x + 26, x + w - 26].forEach(cx => { ctx.beginPath(); ctx.arc(cx, y + h - 10, 11, 0, TAU); ctx.fillStyle = '#3a4250'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); });
    rr2(ctx, x, y, w, h - 16, 8); fs(ctx, '#a5683a', 4);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x + 6, y + 5, w - 12, 4);
    // dos repisas con libros
    const cols = ['#e5533d', '#3d7be5', '#f2b631', '#47b36b', '#8a5cd6', '#f08a3c'];
    for (let r = 0; r < 2; r++) {
      const sy = y + 10 + r * ((h - 16) / 2), sh = (h - 16) / 2 - 14;
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 8, sy + sh + 2, w - 16, 5);
      let bx = x + 12, k = r * 3;
      while (bx < x + w - 22) { const bw = 12 + ((k * 7) % 9); const bh = sh - ((k * 5) % 8); ctx.fillStyle = cols[k % cols.length]; ctx.fillRect(bx, sy + sh - bh, bw, bh); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.strokeRect(bx, sy + sh - bh, bw, bh); bx += bw + 2; k++; }
    }
    // manija
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + w - 6, y + 10); ctx.lineTo(x + w + 14, y - 14); ctx.stroke();
    // etiqueta: peso mínimo para empujarlo
    const tag = `${String(R.minMass).replace('.', ',')}+`;
    ctx.font = font(16, 800); const tw = ctx.measureText(tag).width + 18;
    rr2(ctx, x + w / 2 - tw / 2, y - 26, tw, 22, 8); fs(ctx, '#ffe08a', 2.5);
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(tag, x + w / 2, y - 14);
  }
  /* ---- la bibliotecaria ---- */
  function drawEye(ctx, o, t, P) {
    const open = o.state === 'open', warn = o.warn;
    // zona
    ctx.save();
    ctx.fillStyle = open ? 'rgba(255,216,77,0.16)' : warn ? 'rgba(255,216,77,0.07)' : 'rgba(255,255,255,0)';
    ctx.fillRect(o.zx, o.zy, o.zw, o.zh);
    ctx.setLineDash([12, 10]); ctx.lineWidth = 3; ctx.strokeStyle = open ? 'rgba(229,83,61,0.75)' : 'rgba(58,34,22,0.25)';
    ctx.strokeRect(o.zx, o.zy, o.zw, o.zh); ctx.setLineDash([]);
    ctx.restore();
    // retrato
    const x = o.x, y = o.y;
    rr2(ctx, x - 80, y - 70, 160, 150, 12); fs(ctx, '#8a5a2b', 5);
    rr2(ctx, x - 66, y - 56, 132, 122, 8); fs(ctx, '#f6e7c8', 3);
    // cara y moño
    ctx.beginPath(); ctx.arc(x, y - 44, 22, 0, TAU); ctx.fillStyle = '#6b4a3a'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y + 6, 46, 50, 0, 0, TAU); ctx.fillStyle = '#f2c9a0'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y - 32, 50, 22, 0, Math.PI, TAU); ctx.fillStyle = '#6b4a3a'; ctx.fill();
    // ojos (gafas)
    const shake = warn ? Math.sin(t * 40) * 1.5 : 0;
    for (const s of [-1, 1]) {
      const ex = x + s * 20 + shake, ey = y;
      ctx.beginPath(); ctx.arc(ex, ey, 15, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
      if (open) { ctx.beginPath(); ctx.arc(ex + o.lookX * 6, ey + 3, 6, 0, TAU); ctx.fillStyle = INK; ctx.fill(); }
      else { const lid = warn ? 0.45 : 1; ctx.fillStyle = '#f2c9a0'; ctx.fillRect(ex - 15, ey - 15, 30, 30 * lid); ctx.beginPath(); ctx.moveTo(ex - 13, ey - 15 + 30 * lid - (warn ? 0 : 15)); ctx.lineTo(ex + 13, ey - 15 + 30 * lid - (warn ? 0 : 15)); ctx.lineWidth = 3; ctx.stroke(); if (warn) { ctx.beginPath(); ctx.arc(ex + o.lookX * 6, ey + 7, 4, 0, TAU); ctx.fillStyle = INK; ctx.fill(); } }
    }
    ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    // boca: «shhh» con el dedo cuando mira
    if (open) {
      ctx.beginPath(); ctx.ellipse(x, y + 30, 7, 5, 0, 0, TAU); ctx.fillStyle = '#b5524a'; ctx.fill(); ctx.stroke();
      rr2(ctx, x - 4, y + 12, 8, 30, 4); fs(ctx, '#f2c9a0', 2.5);
      ctx.font = font(26, 800); ctx.fillStyle = '#e5533d'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('¡SHHH!', x + 70, y - 70 + Math.sin(t * 8) * 3);
    } else { ctx.beginPath(); ctx.moveTo(x - 10, y + 30); ctx.quadraticCurveTo(x, y + 35, x + 10, y + 30); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); if (!warn) { ctx.font = font(22, 700); ctx.fillStyle = 'rgba(58,34,22,0.6)'; ctx.textAlign = 'left'; ctx.fillText('z z', x + 64, y - 60); } }
    void P;
  }
  function quietFail(p, G) {
    if (!S || S.fail || S.win) return;
    S.fail = 1.4; S.falls++; S.why = `shh ${Math.round(p.lastImpact || 0)} @${Math.round(p.x)},${Math.round(p.y)} t${S.t.toFixed(1)}`;
    for (const q of G.players) { q.stun = Math.max(q.stun || 0, 1.2); }
    if (!G.quiet) { Sound.play('bump'); FX.banner('¡SHHH!', { sub: 'la bibliotecaria los oyó: cuando mira, nada de caer fuerte', size: 130, life: 1.4, color: '#ffd84d', y: 0.4 }); FX.callout('¡SILENCIO!', p.x, p.y - 80, '#e5533d', 40, 1); }
  }

  function initArena(A) {
    // al reintentar, todo vuelve a como estaba
    const L = A.L; if (!L || !L.objs) return;
    for (const o of L.objs) {
      if (o.kind === 'gate') { o.open = 0; o.x = o.x0; o.y = o.y0; o.dx = 0; o.dy = 0; }
      if (o.kind === 'plate' || o.kind === 'button') { o.pressed = false; o.latched = false; o.load = 0; }
      if (o.kind === 'paper') { o.solidOff = false; o.crack = 0; o.fallT = undefined; }
      if (o.kind === 'liftPair') { o.d = 0; o.v = 0; o.a.y = o.ay; o.b.y = o.by; o.a.dx = o.a.dy = o.b.dx = o.b.dy = 0; }
      if (o.kind === 'lever') { o.on = false; o.cd = 0; }
      if (o.kind === 'crumble') { o.t = 0; o.gone = 0; }
      if (o.kind === 'fan') o.on = !o.link && !o.cycle;
      if (o.kind === 'eye') { o.t = 0; o.state = 'closed'; o.warn = 0; }
      if (o.kind === 'bell') { o.t = 0; o.ring = 0; o.warn = 0; o.last = -1; }
      if (o.kind === 'pendulum') { o.cd = [0, 0]; o.ph = undefined; }
      if (o.kind === 'cart') { o.vx = 0; o.vy = 0; o.push = 0; o.onR = null; if (o.x0 !== undefined) { o.x = o.x0; o.y = o.y0; } }
    }
  }
  ARENA_DEFS.campana = {
    id: 'campana', name: 'Campaña', seed: 4242, hidden: true, desc: '',
    layout: () => { const r = ROOMS[0]; return r ? buildLayout(r) : makeBuilder().L; },
    variants: {}, paintBg, paintFg, drawDynamic, init: initArena,
  };

  /* ---------------- lógica de la sala ---------------- */
  function active(id) {
    const L = ARENA.L;
    for (const o of L.objs) {
      if (o.id !== id) continue;
      if (o.kind === 'plate' || o.kind === 'button') return o.pressed;
      if (o.kind === 'lever') return o.on;
    }
    return false;
  }
  function setup(G) {
    const L = ARENA.L; if (!L || !L.room) { S = null; return; }
    const room = L.room, found = data.wr[room.id] || [];
    S = { room, t: 0, fail: 0, win: 0, inDoor: 0, cutT: 0, wr: L.wrappers.map((w, i) => ({ x: w.x, y: w.y, got: false, before: !!found[i] })), tipT: 0, falls: S && S.room === room ? S.falls : 0 };
    G.goldenNext = 1e9;
  }
  /* péndulos y campanas: también los usa el jefe final */
  function hazardTick(o, dt, G, P) {
    if (o.kind === 'pendulum') {
        o.ph = (o.ph === undefined ? o.phase : o.ph) + dt / o.period * TAU;
        const a = o.amp * Math.sin(o.ph);
        const nx = o.px + Math.sin(a) * o.len, ny = o.py + Math.cos(a) * o.len;
        o.vx = (nx - o.x) / dt; o.vy = (ny - o.y) / dt; o.x = nx; o.y = ny; o.ang = a;
        for (const p of P) {
          o.cd[p.id] = Math.max(0, o.cd[p.id] - dt);
          if (!p.alive || o.cd[p.id] > 0) continue;
          const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy);
          if (d > p.r + o.r) continue;
          o.cd[p.id] = 0.45; if (S) S.lastHit = `pend@${Math.round(o.px)} p${p.id} t${S.t.toFixed(2)} bob ${Math.round(o.x)},${Math.round(o.y)}`;
          const ux = dx / (d || 1), uy = dy / (d || 1);
          if (p.stuck && p.stuckR && p.stuckR.kind !== 'handpeg') { if (!G.quiet) { Sound.play('bump'); FX.callout('¡AGUANTA!', p.x, p.y - 70, '#ffd84d', 26, 0.7); } p.x += ux * 6; continue; }
          if (p.stuck) p.unstick('hit', 1, G);
          const sp = Math.sign(o.vx || ux) || 1;
          p.vx = sp * 820 + ux * 200; p.vy = Math.min(p.vy, -260) + uy * 120; p.onGround = false; p.stun = Math.max(p.stun || 0, 0.3);
          if (!G.quiet) { Sound.play('ram', 1); FX.stars(p.x, p.y - 30, 6, 1); FX.callout('¡TAN!', o.x, o.y - 70, '#ffd84d', 32, 0.7); }
        }
    } else if (o.kind === 'bell') {
        if (G.state === 'play') o.t += dt;
        const c = (o.t + o.phase) % o.period;
        o.warn = c > o.period - 0.9 ? (c - (o.period - 0.9)) / 0.9 : 0;
        o.ring = Math.max(0, o.ring - dt);
        const k = Math.floor((o.t + o.phase) / o.period);
        if (k !== o.last) {
          if (o.last >= 0) {
            o.ring = 1.2;
            if (!G.quiet) { Sound.play('bell'); FX.shake && FX.shake(10); FX.callout('¡DONG!', o.x, o.y - 120, '#ffd84d', 46, 0.9); }
            for (const p of P) {
              if (!p.alive) continue;
              const dx = p.x - o.x, dy = p.y - o.y, d = Math.hypot(dx, dy);
              if (d > o.radius) continue;
              if (p.stuck) { if (!G.quiet) FX.callout('¡AGUANTA!', p.x, p.y - 70, '#ffd84d', 24, 0.7); continue; }
              const f = o.power * (1 - d / o.radius * 0.6), ux = dx / (d || 1), uy = dy / (d || 1);
              p.vx += ux * f; p.vy += Math.min(uy * f, 0) - 260; p.onGround = false; p.stun = Math.max(p.stun || 0, 0.25);
            }
          }
          o.last = k;
        }
    }
  }
  function tickHazards(dt, G) { const L = ARENA.L; if (!L || !L.objs) return; for (const o of L.objs) if (o.kind === 'pendulum' || o.kind === 'bell') hazardTick(o, dt, G, G.players); }
  function update(dt, G) {
    if (!S || G.mode !== 'campana') return;
    const L = ARENA.L, P = G.players;
    G.golden = null; G.goldenNext = 1e9;
    if (S.cutT > 0) S.cutT -= dt;
    ARENA.mods.cut = S.cutT > 0 ? 1 : 0;
    for (const o of L.objs) {
      if (o.kind === 'plate' || o.kind === 'button') {
        let load = 0;
        for (const p of P) if (p.alive && ((p.onGround && !p.stuck && p.groundR === o) || (p.stuck && p.stuckR === o))) load += p.mass;
        for (const c of L.objs) if (c.kind === 'cart' && c.onR === o) load += c.weight;
        o.load = load;
        const on = o.kind === 'plate' ? load >= o.need - 1e-6 : load > 0;
        if (on && !o.pressed && !G.quiet) Sound.play('select');
        if (o.latch) { if (on) o.latched = true; o.pressed = on || o.latched; } else o.pressed = on;
      } else if (o.kind === 'gate') {
        let on = o.all ? o.on.every(id => active(id)) : o.on.some(id => active(id));
        if (o.invert) on = !on;
        const target = on ? 1 : 0, prev = o.open;
        o.open = clamp(o.open + Math.sign(target - o.open) * dt * (target ? 2.6 : 1.4), 0, 1);
        // no aplastar a nadie al cerrar
        if (o.open < prev) {
          const nx = o.x0 + offX(o) , ny = o.y0 + offY(o);
          if (P.some(p => p.alive && p.x + p.r > nx && p.x - p.r < nx + o.w && p.y + p.r > ny && p.y - p.r < ny + o.h)) o.open = prev;
        }
        const x = o.x0 + offX(o), y = o.y0 + offY(o);
        o.dx = x - o.x; o.dy = y - o.y; o.x = x; o.y = y;
        if (Math.abs(o.dx) > 30 || Math.abs(o.dy) > 30) { o.dx = 0; o.dy = 0; }
      } else if (o.kind === 'paper') {
        if (o.solidOff) continue;
        const heavy = P.some(p => p.alive && p.groundR === o && p.mass > o.max + 1e-6);
        if (heavy) { o.crack += dt; if (o.crack > 0.28) { o.solidOff = true; o.fallT = 0; if (!G.quiet) { Sound.play('snip'); FX.paper ? FX.paper(o.x + o.w / 2, o.y, 10) : 0; FX.callout('¡CRAC!', o.x + o.w / 2, o.y - 30, '#ffffff', 34, 0.8); } } }
        else o.crack = Math.max(0, o.crack - dt);
      } else if (o.kind === 'liftPair') {
        let wa = 0, wb = 0;
        for (const p of P) if (p.alive) { const on = p.stuck ? p.stuckR : p.onGround ? p.groundR : null; if (on === o.a) wa += p.mass; if (on === o.b) wb += p.mass; }
        for (const c of L.objs) if (c.kind === 'cart') { if (c.onR === o.a) wa += c.weight; if (c.onR === o.b) wb += c.weight; }
        const want = clamp((wa - wb) * 70, -220, 220);
        o.v += (want - o.v) * Math.min(1, dt * 4);
        o.d = clamp(o.d + o.v * dt, o.minD, o.range);
        if (o.d >= o.range || o.d <= o.minD) o.v = 0;
        const ya = o.ay + o.d, yb = o.by - o.d;
        o.a.dy = ya - o.a.y; o.b.dy = yb - o.b.y; o.a.y = ya; o.b.y = yb; o.a.dx = o.b.dx = 0;
      } else if (o.kind === 'fan') {
        if (o.link) o.on = active(o.link) !== !!o.linkInvert;
        else if (o.cycle) { const [on, off, ph] = o.cycle, c = (ARENA.t + ph) % (on + off); o.on = c < on; o.warn = !o.on && c > on + off - 0.8; }
        if (o.geyser) { const Z = L.zones.find(z => z.geyser === o); if (Z) Z.active = o.on ? 1 : 0; }
        if (!o.on) continue;
        for (const p of P) {
          if (!p.alive || p.stuck) continue;
          if (p.x < o.x || p.x > o.x + o.w || p.y < o.y || p.y > o.y + o.h) continue;
          const a = o.power / Math.pow(p.mass, 1.2);
          if (o.dir === 'up') { p.vy -= a * dt; if (p.vy < -560) p.vy = -560; p.onGround = false; }
          else p.vx += (o.dir === 'right' ? 1 : -1) * a * dt * (p.onGround ? 0.55 : 1);
        }
      } else if (o.kind === 'lever') {
        o.cd = Math.max(0, o.cd - dt);
        for (const p of P) {
          if (!p.alive || o.cd > 0 || (o.latch && o.on)) continue;
          const d = Math.hypot(p.x - o.x, p.y - (o.y - 50));
          // caer encima, tirachinas, clavado o embestida: caminar o saltar al lado no lo mueve
          if (d < p.r + 30 && (p.vy > 280 || Math.abs(p.vx) > 470 || p.slingT > 0 || p.diveT > 0)) {
            o.on = !o.on; o.cd = 0.7;
            if (!G.quiet) { Sound.play('ram', 0.8); FX.stars(o.x, o.y - 50, 6, 1); FX.callout(o.on ? '¡CLIC!' : '¡CLAC!', o.x, o.y - 100, '#ffd84d', 34, 0.8); }
          }
        }
      } else if (o.kind === 'scissors') {
        const t = ARENA.t;
        o.x = o.x0 + o.range * (0.5 - 0.5 * Math.cos(t / o.period * TAU));
        o.snap = (o.snap || 0) + dt * 6;
        if (G.rope.visible && !(S.cutT > 0) && G.rope.pts.some(q => Math.hypot(q.x - o.x, q.y - o.y) < 36)) { S.cutT = 3.5; }
      } else if (o.kind === 'pendulum' || o.kind === 'bell') {
        hazardTick(o, dt, G, P);
      } else if (o.kind === 'eye') {
        if (G.state === 'play') o.t += dt;
        const c = (o.t + o.phase) % (o.open + o.closed);
        o.state = c >= o.closed ? 'open' : 'closed';
        o.warn = o.state === 'closed' && c > o.closed - 0.7;
        const near = P.filter(p => p.alive).sort((a, b) => Math.abs(a.x - o.x) - Math.abs(b.x - o.x))[0];
        if (near) o.lookX += (clamp((near.x - o.x) / 300, -1, 1) - o.lookX) * Math.min(1, dt * 6);
        const inZ = (x, y) => x > o.zx && x < o.zx + o.zw && y > o.zy && y < o.zy + o.zh;
        if (o.state === 'open') {
          for (const p of P) if (p.alive && inZ(p.x, p.y) && (p.lastImpact || 0) > 760) quietFail(p, G);
          for (const c of L.objs) if (c.kind === 'cart' && c.thud > 500 && inZ(c.x + c.w / 2, c.y + c.h / 2)) quietFail({ x: c.x + c.w / 2, y: c.y }, G);
        }
        for (const c of L.objs) if (c.kind === 'cart') c.thud = 0;
      } else if (o.kind === 'crumble') {
        if (o.gone > 0) { o.gone -= dt; if (o.gone <= 0) { o.gone = 0; o.t = 0; o.y = o.y0; } else o.y = o.y0 + 6000; continue; }
        const on = P.some(p => p.alive && p.groundR === o);
        if (on || o.t > 0) { o.t += dt; if (o.t > 0.8) { o.gone = 3; o.y = o.y0 + 6000; if (!G.quiet) Sound.play('dry'); } }
      }
    }
  }
  function offX(o) { return o.dir === 'left' ? -o.open * (o.w - 8) : o.dir === 'right' ? o.open * (o.w - 8) : 0; }
  function offY(o) { return o.dir === 'up' ? -o.open * (o.h - 8) : o.dir === 'down' ? o.open * (o.h - 8) : 0; }

  function post(dt, G) {
    if (!S || G.mode !== 'campana' || G.state !== 'play') return;
    S.t += dt; S.tipT += dt;
    const L = ARENA.L, P = G.players;
    // envolturas
    for (const w of S.wr) {
      if (w.got) continue;
      for (const p of P) if (p.alive && Math.hypot(p.x - w.x, p.y - w.y) < p.r + 26) {
        w.got = true;
        if (!G.quiet) { Sound.play('golden'); FX.sparkle(w.x, w.y, '#ffd84d', 14); FX.callout('¡ENVOLTURA!', w.x, w.y - 40, '#ffd84d', 32, 0.9); }
      }
    }
    // la puerta: entran los dos
    const E = L.exit;
    S.inDoor = P.filter(p => p.alive && Math.abs(p.x - E.x) < E.w / 2 + 6 && p.y > E.y - E.h - 10 && p.y < E.y + 10).length;
    if (!S.fail && !S.win && S.inDoor === 2) {
      S.win = S.t;
      const room = S.room, t = S.t, par = room.par;
      const prevW = data.wr[room.id] || [];
      const wr = S.wr.map((w, i) => !!(w.got || prevW[i]));
      data.wr[room.id] = wr;
      const stars = 1 + (t <= par ? 1 : 0) + (wr.length && wr.every(Boolean) ? 1 : 0);
      const prevStars = data.stars[room.id] || 0;
      data.stars[room.id] = Math.max(prevStars, stars);
      const newBest = !(data.best[room.id] <= t);
      if (newBest) data.best[room.id] = +t.toFixed(1);
      save();
      S.result = { id: room.id, type: 'room', t, par, stars, wrNow: S.wr.filter(w => w.got).length, wrTotal: wr.filter(Boolean).length, newBest, first: !prevStars };
      if (!G.quiet) { Sound.play('win'); FX.confetti(E.x, E.y - E.h - 100, 120, 1200); FX.banner('¡SALIERON!', { sub: `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}  ·  ${t.toFixed(1).replace('.', ',')} s`, size: 130, life: 2.2, color: '#ffd84d', y: 0.36 }); }
      Progress.on('campana', { stars: totalStars() });
    }
  }
  function onFall(p, G) {
    if (!S || S.fail || S.win) return;
    p.alive = false; p.dunked = false; p.stuck = false;
    G.rope.visible = false;
    S.fail = 1.3; S.falls++; S.why = `fall p${p.id} @${Math.round(p.x)},${Math.round(p.y)} t${S.t.toFixed(1)}`;
    if (!G.quiet) { Sound.play('dunk'); FX.gum(p.x, Math.min(p.y, 1060), p.col, 12, 1.1, 0, -1); FX.banner('¡OTRA VEZ!', { sub: S.falls > 2 ? (S.room.tip || 'la sala vuelve a empezar') : 'la sala vuelve a empezar', size: 120, life: 1.3, color: '#ff8a7a', y: 0.4 }); }
  }
  // 'retry' | 'win' | undefined
  function status(G, dt) {
    if (!S) return undefined;
    if (S.fail) { S.fail -= dt; if (S.fail <= 0) { S.fail = 0; return 'retry'; } }
    if (S.win && S.t - S.win > 1.8) return 'win';
    return undefined;
  }

  /* jefes de la campaña */
  function bossResult(zone, win, hearts) {
    const id = `jefe-${zone + 1}`;
    if (!win) return null;
    const stars = hearts >= 3 ? 3 : hearts >= 2 ? 2 : 1;
    const prev = data.stars[id] || 0;
    data.stars[id] = Math.max(prev, stars);
    let reward = null;
    const Z = ZONES[zone];
    if (!data.rewards[Z.id]) { data.rewards[Z.id] = true; reward = Z.reward; }
    save();
    Progress.on('campana', { stars: totalStars(), boss: zone });
    return { stars, reward, first: !prev };
  }

  /* ---------------- HUD ---------------- */
  function drawHUD(ctx, W, H, G) {
    if (!S || G.mode !== 'campana') return;
    const room = S.room, ink = PALETTE.ink;
    ctx.save();
    // envolturas arriba a la derecha del centro
    const x0 = W / 2 + 170, y0 = 46;
    S.wr.forEach((w, i) => drawWrapper(ctx, x0 + i * 62, y0, G.t, i, !(w.got || w.before)));
    S.wr.forEach((w, i) => { if (w.got || w.before) { ctx.fillStyle = '#3fbf6a'; ctx.beginPath(); ctx.arc(x0 + i * 62 + 20, y0 + 14, 9, 0, TAU); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = ink; ctx.stroke(); } });
    // pista al empezar
    if (room.tip && S.tipT < 9 && G.state === 'play') {
      const a = clamp(Math.min(S.tipT / 0.4, (9 - S.tipT) / 0.8), 0, 1);
      ctx.globalAlpha = a; ctx.font = font(24, 600);
      // entre los botones táctiles, en una o dos líneas
      const band = Retos.bottomBand(W, W - 80);
      const lines = Retos.wrap(ctx, room.tip, band.w - 60).slice(0, 3);
      const w = Math.min(band.w, Math.max(...lines.map(l => ctx.measureText(l).width)) + 60), h = 22 + lines.length * 30;
      const x = band.x + band.w / 2 - w / 2, y = H - (Touch.enabled ? 24 : 98) - h;
      ArenaArt.rr(ctx, x, y, w, h, 26); ctx.fillStyle = 'rgba(40,20,10,0.78)'; ctx.fill();
      ctx.fillStyle = '#fff6e6'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      lines.forEach((l, k) => ctx.fillText(l, x + w / 2, y + 26 + k * 30));
    }
    ctx.restore();
  }
  function centerLabel(G) {
    if (!S) return null;
    return { label: `${S.room.id} · ${S.room.name}`, sub: `${(G.state === 'countdown' ? 0 : S.t).toFixed(1).replace('.', ',')} s · ★ en ${S.room.par} s`, late: S.t > S.room.par };
  }

  /* arena del jefe final: lo alto de la torre, con la esfera del reloj, sus manecillas y el péndulo */
  ARENA_DEFS.campana.variants['jefe-reloj'] = () => {
    const B = makeBuilder();
    B.deco('clockface', 960, 330, { r: 250 });
    B.deco('poster', 140, 160, { text: 'NO\nTOCAR\nEL RELOJ', color: '#ffd59a' });
    B.ground(330, 1590, 760);
    B.plank(410, 560, 230); B.plank(1280, 560, 230);
    B.plank(150, 380, 170); B.plank(1600, 380, 170);
    B.hand(960, 330, 235, 9, -Math.PI / 2, 9, 1);
    const hh = B.hand(960, 330, 150, 14, 0, 6, -1); hh.off = true;
    B.pendulum(960, 500, 200, 0.55, 2.8, 0, 40);
    const L = B.L;
    L.room = { zone: 5, id: 'jefe-reloj', boss: true, name: 'El Reloj' }; L.theme = 'torre';
    L.spawns = [{ x: 560, y: 760 }, { x: 1360, y: 760 }];
    L.respawnSpots = [{ x: 525, y: 560 }, { x: 1395, y: 560 }];
    L.deskLeft = 330; L.deskRight = 1590; L.deskY = 760; L.hazardY = 1010; L.canRim = 2000;
    L.ropeLen = 520; L.mass = 3;
    return L;
  };

  return {
    ZONES, ROOMS, BYID, data, define, stages, stageIndex, unlocked, totalStars, tickHazards,
    setup, update, post, onFall, status, bossResult, drawHUD, centerLabel,
    get state() { return S; }, get result() { return S && S.result; },
    roomOf: id => BYID[id],
  };
})();
