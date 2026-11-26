/* =========================================================================
   MUNDO 3 — «El Pergamino de las Estaciones» (campaña, niveles c19–c26).
   Un Japón antiguo pintado en tinta, donde los toriis cambian la estación
   de cada panel. Aquí viven: las criaturas nuevas y su manera de pelear,
   los objetos de los acertijos (lotos que florecen en primavera, setos que
   solo arden secos, el molinete del otoño, la corriente que no deja
   cruzar, los sellos escondidos, las casas con faroles, los puestos de
   papel, la cuerda del puente levadizo, las tablillas del castillo, el
   muro de tinta que persigue), Sumi (el espíritu del pincel) y los cinco
   niveles sin jefe. Los jefes y el orden final están en 07f.
   Todo entra a la campaña por los ganchos de Camp.EXT y viaja en línea
   por la cuadrícula, los objetos (OBJ_DYN) y G.cs.
   ========================================================================= */
const W3 = (() => {
  /* ---------- ayudas para pintar ---------- */
  const all = (T, type) => T.base.fill(type);
  const rect = (T, x0, y0, x1, y1, type) => { for (let r = 0; r < T.rows; r++) for (let c = 0; c < T.cols; c++) { const x = c * CELL + 20, y = r * CELL + 20; if (x >= x0 && x <= x1 && y >= y0 && y <= y1) T.base[r * T.cols + c] = type; } };
  const circ = (T, x, y, r, type) => Terrain.forCircle(T, x, y, r, i => { T.base[i] = type; });
  const ell = (T, x, y, rx, ry, type) => { for (let r = 0; r < T.rows; r++) for (let c = 0; c < T.cols; c++) { const px = c * CELL + 20, py = r * CELL + 20; if (((px - x) / rx) ** 2 + ((py - y) / ry) ** 2 < 1) T.base[r * T.cols + c] = type; } };
  const border = T => { for (let r = 0; r < T.rows; r++) for (let c = 0; c < T.cols; c++) if (!r || !c || r === T.rows - 1 || c === T.cols - 1) T.base[r * T.cols + c] = TT.ROCK; };
  const cellsRect = (T, x0, y0, x1, y1) => { const L = []; for (let r = 0; r < T.rows; r++) for (let c = 0; c < T.cols; c++) { const x = c * CELL + 20, y = r * CELL + 20; if (x >= x0 && x <= x1 && y >= y0 && y <= y1) L.push(r * T.cols + c); } return L; };
  const bushes = (T, list) => list.forEach(([x, y]) => { const i = Terrain.idx(T, x, y); if (i >= 0) T.base[i] = TT.BUSH; });
  const path = (T, pts, w, type) => { for (let k = 0; k < pts.length - 1; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[k + 1], n = Math.ceil(hypot(x1 - x0, y1 - y0) / 14); for (let s = 0; s <= n; s++) circ(T, x0 + (x1 - x0) * s / n, y0 + (y1 - y0) * s / n, w, type); } };
  const S = (x, y, el) => ({ x, y, el });
  const look = (G, cells, k) => { G.cellLook = G.cellLook || new Map(); for (const i of cells) G.cellLook.set(i, k); };
  const pop = (G, x, y, text, color = '#fff2c8', o = {}) => G.pops.push(Object.assign({ x, y, text, t: 0, color }, o));
  const sea = (G, x, y) => Seasons.at(G, x, y);
  const live = (G, kind) => G.units.filter(u => u instanceof Creature && u.alive && (!kind || u.kind === kind));
  const foes = G => G.units.filter(u => u instanceof Creature && u.alive && u.team === 9);
  const hitBy = (G, o, r, test) => { for (const s of G.spells) { if (s.dead) continue; let x = s.x, y = s.y; if (s.t === 'wave') { x += Math.cos(s.ang) * s.d; y += Math.sin(s.ang) * s.d; } if (hypot(x - o.x, y - o.y) < r + (s.r || 0) && test(s)) return s; } return null; };
  const holding = (G, o, r, el) => G.mages.some(m => m.alive && hypot(m.x - o.x, m.y - o.y) < r && m.hands.some(h => h.el === el && h.hold >= HOLD_FULL));
  const isEl = (s, el) => s.el === el || (s.fusion && s.fusion.split('+').includes(el)) || (el === 'fire' && (s.t === 'firenado' || (s.t === 'lob' && s.kind === 'meteor')));
  const ahead = G => { const L = G.mages.filter(m => m.alive); return L.length ? Math.max(...L.map(m => m.x)) : 0; };
  // Sumi (y los demás) hablan: el evento viaja en línea y cada aparato lo dice con su voz y su subtítulo
  const net = G => G.net && typeof NetPlay !== 'undefined' && NetPlay.on && !NetPlay.isHost;
  function say(G, text, who = 'sumi', delay = 0) { if (G.attract || net(G)) return; const W = st(G); W.q.push({ t: G.time + delay, who, text }); }
  // estado propio de la ronda (no viaja: cada aparato lo arma o lo deduce)
  const st = G => G.w3 || (G.w3 = { q: [], bendT: null, stuck: [0, 0, 0, 0] });
  function wave(G, kinds, spots) { kinds.forEach((k, j) => { let [x, y] = spots[j % spots.length]; x += (G.rng() - 0.5) * 60; y += (G.rng() - 0.5) * 60; const [sx, sy] = Arena.safeNear(G, x, y); G.units.push(new Creature(G, k, sx, sy)); }); }

  /* =================== CRIATURAS =================== */
  const faceOf = c => c.faceA != null ? c.faceA : Math.atan2(c.vy || 0.001, c.vx || 0.001);
  const trackFace = c => { if (hypot(c.vx, c.vy) > 25) c.faceA = Math.atan2(c.vy, c.vx); };
  const fromFront = (G, c, src) => { const m = src.by >= 0 ? G.mages[src.by] : null; if (!m) return false; return Math.abs(angDiff(faceOf(c), Math.atan2(m.y - c.y, m.x - c.x))) < 1.25; };
  Object.assign(CREATURES, {
    // kappa: sale del agua, te agarra y te arrastra hacia ella (le duele el rayo)
    kappa: { name: 'Kappa', look: 'kappa', el: 'water', weak: 'bolt', hp: 30, r: 16, speed: 118, chase: 1, bite: 9, swim: 1, team: 9, soft: 0.5,
      onBite(G, c, m) { if (!m.isMage) return; let best = null, bd = 1e9; const T = G.T; Terrain.forCircle(T, c.x, c.y, 260, i => { const b = T.base[i]; if (b !== TT.DEEP && b !== TT.SHALLOW) return; const d = hypot(Terrain.cx(T, i) - m.x, Terrain.cy(T, i) - m.y); if (d < bd) { bd = d; best = i; } });
        const a = best != null ? Math.atan2(Terrain.cy(T, best) - m.y, Terrain.cx(T, best) - m.x) : Math.atan2(c.y - m.y, c.x - m.x); m.knock(Math.cos(a), Math.sin(a), 340); m.slow(0.7, 0.7); } },
    // tengu cuervo: baja en picada y te corta el hechizo que estés cargando (le duele la tierra)
    tengu: { name: 'Tengu cuervo', look: 'tengu', el: 'wind', weak: 'earth', hp: 26, r: 15, speed: 205, chase: 1, bite: 8, swoop: 1, fly: 1, team: 9, soft: 0.5,
      onBite(G, c, m) { if (!m.isMage) return; let cut = false; for (const h of m.hands) if (h.hold >= 0) { h.hold = -1; h.deny = 0.45; cut = true; } if (m.fuse) { m.fuse = false; cut = true; } if (cut) { G.events.push({ type: 'tenguCut', x: m.x, y: m.y }); pop(G, m.x, m.y - 70, '¡Te cortó el hechizo!', '#bfe8ff', { small: true }); } } },
    // kasa-obake (el paraguas de un ojo): de frente se cubre; por la espalda o con fuego queda expuesto
    kasa: { name: 'Kasa-obake', look: 'kasa', el: 'plant', weak: 'fire', hp: 30, r: 16, speed: 128, chase: 1, bite: 7, team: 9, soft: 0.5,
      tick(G, c) { trackFace(c); },
      hurtK(G, c, src) { if (src.dot) return 1; if (fromFront(G, c, src)) { c.blockT = 0.3; if (!c.toldT || G.time - c.toldT > 4) { c.toldT = G.time; pop(G, c.x, c.y - 60, 'Se cubre: ¡por detrás o con fuego!', '#d8f0c0', { small: true }); } return 0.35; } return 1.45; } },
    // oni del trueno: avisa y golpea el suelo; por la espalda recibe el doble (le duele el viento)
    oni: { name: 'Oni del trueno', look: 'oni', el: 'bolt', weak: 'wind', hp: 95, r: 24, speed: 74, chase: 1, bite: 15, heavy: 1, team: 9, soft: 0.45,
      hurtK(G, c, src) { return !src.dot && src.by >= 0 && !fromFront(G, c, src) ? 2 : 1; },
      tick(G, c, dt, m, d) {
        if (c.slamT > 0) { c.slamT -= dt; c.vx *= 0.8; c.vy *= 0.8; c.x += c.vx * dt; c.y += c.vy * dt;
          if (c.slamT <= 0) { c.slamCd = 4.2; c.warn = null; G.fx.push({ type: 'boom', x: c.x, y: c.y, r: 110, el: 'bolt' }); G.events.push({ type: 'quake', x: c.x, y: c.y }); G.events.push({ type: 'thunder', x: c.x, y: c.y, big: true }); for (const u of G.mages) if (u.alive && hypot(u.x - c.x, u.y - c.y) < 115 && !(u.iframes > 0)) { u.hurt(G, 14, { by: -1, el: 'bolt' }); u.knock(u.x - c.x, u.y - c.y, 420); } }
          return false; }
        trackFace(c); c.slamCd = (c.slamCd == null ? 2 : c.slamCd) - dt; if (c.slamCd <= 0 && d < 125) { c.slamT = 0.75; c.warn = { r: 110, t: 0.75, max: 0.75, el: 'bolt' }; G.events.push({ type: 'bossWarn', x: c.x, y: c.y, el: 'bolt' }); } } },
    // armadura samurái: duerme hasta que pasas cerca (o la golpean); despierta, carga en línea recta (le duele la planta)
    yoroi: { name: 'Armadura samurái', look: 'yoroi', el: 'earth', weak: 'plant', hp: 72, r: 20, speed: 84, chase: 1, bite: 14, heavy: 1, charge: 1, team: 9, soft: 0.45,
      tick(G, c, dt, m, d) { if (!c.awake) { c.untargetable = true; c.vx = c.vy = 0; if (d < (c.wakeR || 170) || c.hp < c.maxHp || c.wake) { c.awake = true; c.untargetable = false; c.chT = 1.2; c.wind = 0; c.rush = 0; G.events.push({ type: 'yoroiWake', x: c.x, y: c.y }); G.fx.push({ type: 'rubble', x: c.x, y: c.y }); pop(G, c.x, c.y - 80, '¡Despierta una armadura!', '#ffcf9a', { small: true }); } return false; } } },
    // farol embrujado (chōchin-obake): flota hacia ti y revienta en llamas (le duele el agua)
    chochin: { name: 'Farol embrujado', look: 'chochin', el: 'fire', weak: 'water', hp: 18, r: 14, speed: 128, chase: 1, bite: 0, fly: 1, team: 9, soft: 0.5,
      tick(G, c, dt, m, d) { if (c.fuseT > 0) { c.fuseT -= dt; c.vx *= 0.9; c.vy *= 0.9; c.x += c.vx * dt; c.y += c.vy * dt; if (c.fuseT <= 0) { c.hp = 0; c.alive = false; G.fx.push({ type: 'boom', x: c.x, y: c.y - 20, r: 72, el: 'fire' }); G.events.push({ type: 'boom', x: c.x, y: c.y, r: 72 }); for (const u of G.mages) if (u.alive && hypot(u.x - c.x, u.y - c.y) < 78 && !(u.iframes > 0)) { u.hurt(G, 13, { by: -1, el: 'fire' }); u.burn(G, 1.2, -1); } } return false; }
        if (d < c.r + m.r + 26 && c.spawnT <= 0 && !m.fake) { c.fuseT = 0.55; c.warn = { r: 72, t: 0.55, max: 0.55, el: 'fire' }; return false; } } },
    // criatura de nieve: busca los faroles encendidos y los apaga (le duele el fuego)
    yukiko: { name: 'Criatura de nieve', look: 'yukiko', el: 'water', weak: 'fire', hp: 20, r: 15, speed: 84, chase: 1, bite: 8, team: 9, soft: 0.45,
      tick(G, c, dt, m, d) { return snowSeek(G, c, dt, m, d, 46); } },
    // Yuki-onna (mini-jefa): se esfuma en la nieve y aparece junto a un farol; su aliento congela y apaga
    yukionna: { name: 'Yuki-onna', look: 'yukionna', el: 'water', weak: 'fire', hp: 320, r: 20, speed: 92, chase: 1, bite: 10, team: 9, soft: 0.42, heavy: 1,
      tick(G, c, dt, m, d) { return yukiOnna(G, c, dt, m, d); } },
  });
  // las de nieve van al farol encendido más cercano (si un mago les estorba encima, pelean con él)
  function snowSeek(G, c, dt, m, d, reach) {
    let tg = null, td = 1e9; for (const o of G.objs || []) if (o.t === 'house' && o.lit) { const dd = hypot(o.fx - c.x, o.fy - c.y); if (dd < td) { td = dd; tg = o; } }
    if (!tg || (d < 120 && td > 200)) return true;
    const a = Math.atan2(tg.fy - c.y, tg.fx - c.x), sp = c.D.speed * (c.st.slow > 0 ? c.st.slowF : 1) * (c.st.chill > 0 ? 0.6 : 1) * (c.st.root > 0 ? 0 : 1) * (sea(G, c.x, c.y) === 'summer' ? 0.7 : 1), k = 1 - Math.exp(-6 * dt);
    c.vx += (Math.cos(a) * sp - c.vx) * (c.kt > 0 ? k * 0.2 : k); c.vy += (Math.sin(a) * sp - c.vy) * (c.kt > 0 ? k * 0.2 : k); c.x += c.vx * dt; c.y += c.vy * dt; c.collide(G.T);
    if (td < reach) { putOut(G, tg, '¡Apagó un farol!'); if (c.kind === 'yukiko') { c.hp = 0; c.alive = false; G.fx.push({ type: 'boom', x: c.x, y: c.y, r: 40, el: 'water' }); } }
    return false;
  }
  function putOut(G, o, text) { if (!o.lit) return; o.lit = false; o.outT = 0; G.events.push({ type: 'farolOut', x: o.fx, y: o.fy }); G.fx.push({ type: 'steam', x: o.fx, y: o.fy - 30, r: 40 }); pop(G, o.fx, o.fy - 90, text, '#bfe0ff', { small: true }); }
  function yukiOnna(G, c, dt, m, d) {
    c.blinkCd = (c.blinkCd == null ? 4 : c.blinkCd) - dt; c.breathCd = (c.breathCd == null ? 2.5 : c.breathCd) - dt;
    if (c.breath > 0) {
      c.breath -= dt; c.vx *= 0.85; c.vy *= 0.85; const a = c.bAng;
      if (G.frame % 5 === 0) G.fx.push({ type: 'cone', x: c.x, y: c.y - 30, ang: a, half: 0.42, range: 260, el: 'frost' });
      for (const u of G.mages) if (u.alive) { const dx = u.x - c.x, dy = u.y - c.y, dd = hypot(dx, dy); if (dd < 260 && Math.abs(angDiff(a, Math.atan2(dy, dx))) < 0.45) { u.hurt(G, 10 * dt, { by: -1, el: 'water', dot: 1 }); u.st.chill = Math.max(u.st.chill || 0, 1.2); u.cold = Math.min(100, (u.cold || 0) + 40 * dt); } }
      for (const o of G.objs || []) if (o.t === 'house' && o.lit) { const dx = o.fx - c.x, dy = o.fy - c.y; if (hypot(dx, dy) < 300 && Math.abs(angDiff(a, Math.atan2(dy, dx))) < 0.5) putOut(G, o, '¡Lo apagó su aliento!'); }
      if (c.breath <= 0) c.warn = null;
      return false;
    }
    if (c.breathCd <= 0 && d < 280 && !m.fake) { c.breathCd = 5.2; c.breath = 1.3; c.bAng = Math.atan2(m.y - c.y, m.x - c.x); c.warn = { cone: c.bAng, r: 260, t: 0.5, max: 0.5, el: 'water' }; c.tele = 0.5; G.events.push({ type: 'bossWarn', x: c.x, y: c.y, el: 'water' }); return false; }
    if (c.tele > 0) { c.tele -= dt; return false; }
    if (c.blinkCd <= 0) { c.blinkCd = 6.5; const F = (G.objs || []).filter(o => o.t === 'house' && o.lit), tg = F.length ? F[(G.rng() * F.length) | 0] : null, tx = tg ? tg.fx : m.x, ty = tg ? tg.fy : m.y;
      const [nx, ny] = Arena.safeNear(G, tx + (G.rng() - 0.5) * 240, ty + 110); G.fx.push({ type: 'steam', x: c.x, y: c.y, r: 60 }); c.x = nx; c.y = ny; c.vx = c.vy = 0; G.fx.push({ type: 'steam', x: c.x, y: c.y, r: 60 }); G.events.push({ type: 'yukiBlink', x: c.x, y: c.y }); return false; }
    return true;
  }

  /* =================== OBJETOS =================== */
  // tipos del Mundo 3 (y los de siempre que aquí se dibujan con tinta)
  const MINE = new Set(['pads', 'hedge', 'pinwheel', 'current', 'seal3', 'house', 'stall', 'inkwall', 'rope', 'tablet', 'door', 'exit', 'bridge', 'brazier', 'plate']);
  const SEALS = () => Store.get('w3seals', {});
  function start(G, L) { G.w3 = null; G.cellLook = null; G._bendA = null; if (L.world3) { st(G); G.cellLook = new Map(); } }
  function setup(G, o) {
    if (!G.L || !G.L.world3) return; const T = G.T;
    if (MINE.has(o.t)) o.w3 = 1;
    if (o.t === 'pads') { o.cells = cellsRect(T, ...o.rect); o.open = false; for (const i of o.cells) T.base[i] = o.under || TT.DEEP; look(G, o.cells, o.look || 'lotus'); }
    if (o.t === 'hedge') { o.cells = cellsRect(T, ...o.rect); T.dryOnly = T.dryOnly && T.dryOnly.length === T.n ? T.dryOnly : new Uint8Array(T.n); for (const i of o.cells) { T.base[i] = TT.BUSH; T.dryOnly[i] = 1; } look(G, o.cells, 'hedge'); o.burnt = 0; }
    if (o.t === 'pinwheel') { o.spin = 0; o.ang = 0; o.full = 0; o.hit = {}; }
    if (o.t === 'current') o.cells = new Set(cellsRect(T, ...o.rect));
    if (o.t === 'seal3') o.got = 0;
    if (o.t === 'house') { o.lit = true; o.fx = o.x; o.fy = o.y + 56; o.outT = 0; o.cells = cellsRect(T, o.x - 92, o.y - 84, o.x + 92, o.y + 4); for (const i of o.cells) T.base[i] = TT.ROCK; look(G, o.cells, 'house'); }
    if (o.t === 'stall') { o.cells = cellsRect(T, ...o.rect); for (const i of o.cells) T.base[i] = TT.ROCK; look(G, o.cells, 'stall'); o.x = (o.rect[0] + o.rect[2]) / 2; o.y = (o.rect[1] + o.rect[3]) / 2; o.gone = 0; }
    if (o.t === 'rope') o.cut = 0;
    if (o.t === 'tablet') o.ok = 0;
    if (o.t === 'inkwall') { o.x = o.x0 != null ? o.x0 : -160; o.wait = o.wait != null ? o.wait : 4; o.done = 0; o.v = 0; }
    if (o.t === 'door' && o.look) look(G, o.cells, 'gate');
  }
  function step(G, o, dt) {
    if (!G.L || !G.L.world3) return; const T = G.T;
    // lotos (o enredadera sobre el vacío de tinta): en primavera abren camino; si cambia la estación se cierran (menos donde haya alguien)
    if (o.t === 'pads') {
      const want = sea(G, (o.rect[0] + o.rect[2]) / 2, (o.rect[1] + o.rect[3]) / 2) === 'spring';
      if (want && !o.open) { o.open = true; for (const i of o.cells) { T.base[i] = TT.BRIDGE; G.fx.push({ type: 'sprout', x: Terrain.cx(T, i), y: Terrain.cy(T, i), delay: hash2(i, 3) * 0.4 }); } T.ver++; const c0 = o.cells[0]; pop(G, Terrain.cx(T, c0), Terrain.cy(T, c0) - 60, o.look === 'vine' ? '¡Crece un puente de enredadera!' : '¡Florecen los lotos: hay camino!', '#ffc8dc', { big: true }); G.events.push({ type: 'grow', x: Terrain.cx(T, c0), y: Terrain.cy(T, c0) }); }
      if (!want && o.open) { let left = 0; for (const i of o.cells) { if (T.base[i] !== TT.BRIDGE) continue; if (G.mages.some(m => m.alive && Terrain.idx(T, m.x, m.y) === i)) { left++; continue; } T.base[i] = o.under || TT.DEEP; } if (!left) { o.open = false; const c0 = o.cells[0]; pop(G, Terrain.cx(T, c0), Terrain.cy(T, c0) - 60, o.look === 'vine' ? 'La enredadera se seca…' : 'Los lotos se cierran…', '#d8d0ff', { small: true }); } T.ver++; }
    }
    // seto verde: no arde fuera del verano (avisa); quemado se cuenta como abierto
    if (o.t === 'hedge' && !o.burnt) {
      const gone = o.cells.filter(i => T.base[i] !== TT.BUSH).length; if (gone >= 3) { o.burnt = 1; G.events.push({ type: 'wallBreak', x: Terrain.cx(T, o.cells[0]), y: G.T.H / 2 }); }
      const x0 = Terrain.cx(T, o.cells[0]); if (sea(G, x0, T.H / 2) !== 'summer' && (!o.toldT || G.time - o.toldT > 4)) { const s = hitBy(G, { x: x0, y: 0 }, 9999, s2 => isEl(s2, 'fire') && Math.abs(s2.x - x0) < 46); if (s) { o.toldT = G.time; pop(G, x0, s.y - 60, 'Está verde: solo arde en VERANO', '#d8f0c0', { small: true }); } }
    }
    // molinete: el viento lo hace girar (en otoño mucho más); girando fuerte abre su puerta
    if (o.t === 'pinwheel') {
      const autumn = sea(G, o.x, o.y) === 'autumn', gain = autumn ? 0.45 : 0.07, P = { x: o.x, y: o.y - 46 };
      for (const s of G.spells) { if (s.dead || o.hit[s.id] || !isEl(s, 'wind')) continue; let x = s.x, y = s.y; if (s.t === 'wave') { x += Math.cos(s.ang) * s.d; y += Math.sin(s.ang) * s.d; } if (hypot(x - P.x, y - P.y) < 80 + (s.r || 0)) { o.hit[s.id] = 1; o.spin = Math.min(1.4, o.spin + gain); if (!autumn && (!o.toldT || G.time - o.toldT > 5)) { o.toldT = G.time; pop(G, o.x, o.y - 130, 'Casi no gira… en OTOÑO el viento sopla fuerte', '#ffd9a0', { small: true }); } } }
      if (holding(G, P, 90, 'wind')) o.spin = Math.min(1.4, o.spin + dt * (autumn ? 0.9 : 0.12));
      if (G.frame % 600 === 0) o.hit = {};
      o.spin = Math.max(0, o.spin - dt * 0.1); o.ang += dt * o.spin * 14;
      if (o.spin > 0.75 && !o.full) { o.full = 1; G.events.push({ type: 'totem', x: o.x, y: o.y }); pop(G, o.x, o.y - 120, '¡Gira el molinete!', '#ffd9a0', { big: true }); }
    }
    // corriente: en el agua honda sin congelar empuja fuerte (no se cruza nadando)
    if (o.t === 'current') {
      for (const u of G.units) { if (!u.alive || (u.D && (u.D.fly || u.D.swim)) || u.obj) continue; const i = Terrain.idx(T, u.x, u.y); if (i < 0 || !o.cells.has(i) || T.base[i] !== TT.DEEP || T.ice[i] > 0) continue;
        u.x += o.dir[0] * 250 * dt; u.y += o.dir[1] * 250 * dt; u.vx += o.dir[0] * 300 * dt; u.vy += o.dir[1] * 300 * dt;
        if (u.isMage && (!u.curT || G.time - u.curT > 4)) { u.curT = G.time; pop(G, u.x, u.y - 70, 'La corriente no deja cruzar', '#bfe2ff', { small: true }); } }
    }
    // sello rojo escondido (uno por nivel; los ocho abren un atuendo)
    if (o.t === 'seal3' && !o.got) for (const m of G.mages) if (m.alive && hypot(m.x - o.x, m.y - o.y) < 36) {
      o.got = 1; G.events.push({ type: 'w3seal', x: o.x, y: o.y, id: G.L.id }); G.fx.push({ type: 'flashRing', x: o.x, y: o.y, el: 'fire', r: 80 }); break;
    }
    // casa con farol: se vuelve a encender con fuego (hechizo, mano cargada o el suelo ardiendo)
    if (o.t === 'house' && !o.lit) {
      o.outT += dt; const f = { x: o.fx, y: o.fy - 24 }; let fire = !!hitBy(G, f, 56, s => isEl(s, 'fire')) || holding(G, f, 74, 'fire'); Terrain.forCircle(T, o.fx, o.fy, 46, i => { if (T.fire[i] > 0) fire = true; });
      if (fire) { o.lit = true; G.events.push({ type: 'brazierLit', x: o.fx, y: o.fy }); G.fx.push({ type: 'boom', x: o.fx, y: o.fy - 30, r: 130, el: 'fire' }); pop(G, o.fx, o.fy - 90, '¡Farol encendido!', '#ffcf8a', { small: true });
        // la llamada del fuego: derrite a las criaturas de nieve que estaban cerca
        for (const u of G.units) if (u instanceof Creature && u.alive && u.D.weak === 'fire' && hypot(u.x - o.fx, u.y - o.fy) < 150) u.hurt(G, 22, { by: -1, el: 'fire' }); }
    }
    // puesto de papel: arde con fuego (también si el fuego del suelo lo toca)
    if (o.t === 'stall' && !o.gone) {
      if (o.igT > 0) { o.igT -= dt; if (o.igT <= 0) o.lightUp = 1; }
      let fire = !!o.lightUp || !!hitBy(G, o, 66, s => isEl(s, 'fire')) || holding(G, o, 84, 'fire');
      if (!fire) for (const i of o.cells) { const c = i % T.cols, r = (i / T.cols) | 0; for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const j = (r + dr) * T.cols + c + dc; if (j >= 0 && j < T.n && T.fire[j] > 0) fire = true; } }
      if (fire) { o.gone = 1; for (const i of o.cells) { T.base[i] = T.base0 ? T.base0[i] : TT.DIRT; if (T.base[i] === TT.ROCK) T.base[i] = TT.DIRT; T.ash[i] = 20; Terrain.ignite(G, i, 2.2, -1); } T.ver++; G.fx.push({ type: 'boom', x: o.x, y: o.y - 20, r: 80, el: 'fire' }); G.events.push({ type: 'stallBurn', x: o.x, y: o.y }); pop(G, o.x, o.y - 70, '¡Ardió el puesto de papel!', '#ffb27a', { small: true });
        if (sea(G, o.x, o.y) === 'summer') for (const q of G.objs) if (q !== o && q.t === 'stall' && !q.gone && !(q.igT > 0) && q.rect[0] <= o.rect[2] + 50 && q.rect[2] >= o.rect[0] - 50 && q.rect[1] <= o.rect[3] + 50 && q.rect[3] >= o.rect[1] - 50) q.igT = 0.45; }
    }
    // la cuerda del puente levadizo: el fuego la quema y el puente cae
    if (o.t === 'rope' && !o.cut) { if (hitBy(G, o, 40, s => isEl(s, 'fire')) || holding(G, o, 70, 'fire')) { o.cut = 1; G.events.push({ type: 'ropeCut', x: o.x, y: o.y }); G.fx.push({ type: 'boom', x: o.x, y: o.y - 40, r: 40, el: 'fire' }); pop(G, o.x, o.y - 90, '¡Se quemó la cuerda!', '#ffb27a', { big: true }); } }
    // tablilla: dice qué estación pide su torii suelto
    if (o.t === 'tablet') { const t = G.sea && G.sea.toriis[o.tk]; o.ok = t && t.s === o.want ? 1 : 0; }
    // el muro de tinta del Borrón: avanza (más rápido si van muy adelante, más lento si van justos) y borra lo que deja atrás
    if (o.t === 'inkwall' && G.state === 'play') {
      if (o.wait > 0) { o.wait -= dt; return; }
      const L = G.mages.filter(m => m.alive), lag = L.length ? Math.min(...L.map(m => m.x)) - o.x : 400;
      o.v = clamp(55 + (lag - 420) * 0.09, 42, 120) * (o.speedK || 1) * (G.players === 1 ? 0.9 : 1); o.x = Math.min(o.x + o.v * dt, o.stopX || 1e9);
      const c1 = Math.floor((o.x - 24) / CELL); let ch = false;
      for (let c = Math.max(0, o.done); c <= Math.min(T.cols - 1, c1); c++) { for (let r = 0; r < T.rows; r++) { const i = r * T.cols + c; if (T.base[i] !== TT.CHASM) { T.base[i] = TT.CHASM; T.fire[i] = 0; T.wall[i] = 0; T.leaf[i] = 0; T.snow[i] = 0; T.ice[i] = 0; ch = true; } } o.done = c + 1; }
      if (ch) T.ver++;
      for (const u of G.units) if (u.alive && u instanceof Creature && u.x < o.x - 20) { u.alive = false; G.fx.push({ type: 'splat', x: u.x, y: u.y, r: 50, el: 'shadow' }); }
      for (const s of G.sources) if (s.x < o.x && !s.gone) { s.gone = 1; s.cd = 1e9; }
    }
  }
  /* ---------- la máquina compañera: qué estación quiere el nivel y qué hacer con los objetos ---------- */
  function toriiJob(G, m, els) {
    const L = G.L; if (!L || !L.want || !G.sea) return null; const W = L.want(G); if (!W) return null;
    for (const [tk, s] of W) {
      const t = G.sea.toriis[tk]; if (!t) continue; const cur = t.solo ? t.s : G.sea.panels[t.p].s;
      if (!t.stain && cur === s) continue;
      const el = t.stain ? 'light' : SEASONS[s].el; if (t.cd > 0 && !t.stain) return { wait: true };
      if (!els.includes(el)) return { need: el };
      const side = m.x < t.x ? -1 : 1; return { o: { x: t.x + side * 34 * (t.big || 1), y: t.y - 6, t: 'torii' }, d: side < 0 ? 140 : -140, el };
    }
    return null;
  }
  function job(G, m, els) {
    if (!G.L || !G.L.world3) return null;
    const tj = toriiJob(G, m, els); if (tj && tj.o) return tj;
    const byD = G.objs.slice().sort((a, b) => hypot((a.fx || a.x || 0) - m.x, (a.fy || a.y || 0) - m.y) - hypot((b.fx || b.x || 0) - m.x, (b.fy || b.y || 0) - m.y));
    for (const o of byD) {
      if (o.t === 'house' && !o.lit && els.includes('fire')) return { o: { x: o.fx, y: o.fy - 24, t: 'house' }, d: 120, el: 'fire' };
      if (o.t === 'stall' && !o.gone && els.includes('fire') && G.mages.some(q => q.alive && Math.abs(q.x - o.x) < 380) && (!o.need || o.need(G))) return { o: { x: o.x, y: o.y, t: 'stall' }, d: 150, el: 'fire' };
      if (o.t === 'rope' && !o.cut && els.includes('fire') && (!G.L.ropeOk || G.L.ropeOk(G))) return { o: { x: o.x, y: o.y - 40, t: 'rope' }, d: 140, el: 'fire' };
      if (o.t === 'pinwheel' && !o.full && els.includes('wind') && G.mages.some(q => q.alive && hypot(q.x - o.x, q.y - o.y) < 600)) return { o: { x: o.x, y: o.y - 46, t: 'pinwheel' }, d: 130, el: 'wind' };
      if (o.t === 'hedge' && !o.burnt && els.includes('fire') && sea(G, Terrain.cx(G.T, o.cells[0]), G.T.H / 2) === 'summer') { const c = o.cells.reduce((a, i) => Math.abs(Terrain.cy(G.T, i) - m.y) < Math.abs(Terrain.cy(G.T, a) - m.y) ? i : a, o.cells[0]); return { o: { x: Terrain.cx(G.T, c), y: Terrain.cy(G.T, c), t: 'hedge' }, d: 150, el: 'fire' }; }
    }
    if (G.L.go) { const p = G.L.go(G, m); if (p) return { o: { x: p[0], y: p[1], t: 'go' }, d: 0, el: '_' }; }
    return null;
  }
  function plan(G, m) {
    if (!G.L || !G.L.world3) return null; const els = m.hands.map(h => h.el);
    const tj = toriiJob(G, m, els); if (tj && tj.need) return { need: [tj.need] };
    if (G.objs.some(o => o.t === 'house' && !o.lit) && !els.includes('fire')) return { need: ['fire'] };
    if (G.objs.some(o => o.t === 'pinwheel' && !o.full && G.mages.some(q => q.alive && hypot(q.x - o.x, q.y - o.y) < 600)) && !els.includes('wind')) return { need: ['wind'] };
    if (G.objs.some(o => o.t === 'stall' && !o.gone && G.mages.some(q => q.alive && Math.abs(q.x - o.x) < 380) && (!o.need || o.need(G))) && !els.includes('fire')) return { need: ['fire'] };
    return G.L.plan ? G.L.plan(G, m) : null;
  }
  /* ---------- cada paso del nivel ---------- */
  function update(G, dt) {
    if (!G.L || !G.L.world3) return; const T = G.T, W = st(G);
    // lo que dice Sumi (a su tiempo)
    for (let k = W.q.length - 1; k >= 0; k--) if (G.time >= W.q[k].t) { const q = W.q.splice(k, 1)[0]; G.events.push({ type: 'say', who: q.who, text: q.text }); }
    // la mira ayuda a apuntar a los pilares de los toriis, molinetes, faroles apagados, cuerdas y puestos
    const extra = [], spot = (x, y, r = 16) => extra.push({ x, y, vx: 0, vy: 0, r, st: { hidden: 0 }, spot: true });
    if (G.sea) for (const t of G.sea.toriis) for (const dx of [-34, 34]) spot(t.x + dx * (t.big || 1), t.y - 6, 14);
    for (const o of G.objs) { if (o.t === 'pinwheel' && !o.full) spot(o.x, o.y - 46, 20); if (o.t === 'house' && !o.lit) spot(o.fx, o.fy - 24, 18); if (o.t === 'stall' && !o.gone) spot(o.x, o.y, 22); if (o.t === 'rope' && !o.cut) spot(o.x, o.y - 40, 16); }
    G.aimSpots = (G.aimSpots || []).concat(extra);
    // el estado de los toriis viaja en G.cs (manchas y estación de los sueltos)
    if (G.sea) { const s = G.sea.toriis.map(t => (t.stain ? 'x' : '') + (t.solo ? (SEASONS[t.s] ? SEASONS[t.s].code : 0) : '')).join(','); if (G.cs.tor !== s) G.cs.tor = s; }
    // frío (aldea nevada): lejos del fuego te enfrías; lleno, vas lento y al rato te congelas un instante
    if (G.L.cold) for (const m of G.mages) {
      if (!m.alive) { m.cold = 0; continue; } let warm = 0; for (const o of G.objs) if (o.t === 'house' && o.lit && hypot(o.fx - m.x, o.fy - m.y) < 220) warm = 1;
      if (!warm) Terrain.forCircle(T, m.x, m.y, 80, j => { if (T.fire[j] > 0) warm = 1; }); if (sea(G, m.x, m.y) === 'summer') warm = 1;
      if (!warm && G.mages.some(q => q !== m && q.alive && hypot(q.x - m.x, q.y - m.y) < 90)) warm = 0.4;
      m.cold = clamp((m.cold || 0) + dt * (warm ? -30 * warm : 6.5), 0, 100);
      if (m.cold >= 100) { m.slow(0.3, 0.72); m.coldT = (m.coldT || 0) + dt; if (m.coldT > 3) { m.coldT = 0; m.cold = 60; m.freeze(G, 1, -1); pop(G, m.x, m.y - 80, '¡Congelado de frío! Busquen un farol', '#cfe8ff', { small: true }); } } else m.coldT = 0;
    }
    // nadie se queda atrapado entre el bambú: si no puede moverse un rato, sale al claro más cercano
    G.mages.forEach((m, k) => { if (!m.alive) return; const i = Terrain.idx(T, m.x, m.y); let open = 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const j = Terrain.idx(T, m.x + dx * 30, m.y + dy * 30); if (j >= 0 && !Terrain.solid(T, j)) open++; } if (i >= 0 && Terrain.solid(T, i)) open = 0;
      W.stuck[k] = open ? 0 : W.stuck[k] + dt; if (W.stuck[k] > 2.2) { W.stuck[k] = 0; const [nx, ny] = Arena.safeNear(G, m.x, m.y, true); G.fx.push({ type: 'steam', x: m.x, y: m.y, r: 30 }); m.x = nx; m.y = ny; m.vx = m.vy = 0; } });
  }
  function onEvent(G, e) {
    if (!G.L || !G.L.world3) return;
    if (e.type === 'w3seal') { const D = SEALS(); if (!D[e.id]) { D[e.id] = 1; Store.set('w3seals', D); } const n = Object.keys(SEALS()).length; pop(G, e.x, e.y - 70, `¡Sello escondido! (${n}/8)`, '#ff8a7a', { big: true }); if (n >= 8 && Progress.unlock) Progress.unlock(G, 'w3seals'); }
    if (G.L.onEvent) G.L.onEvent(G, e);
  }
  Camp.EXT.start.push(start); Camp.EXT.setup.push(setup); Camp.EXT.step.push(step); Camp.EXT.plan.push(plan); Camp.EXT.job.push(job); Camp.EXT.update.push(update); Camp.EXT.event.push(onEvent);
  Camp.EXT.draw.push((x, G, list) => { if (G.L && G.L.world3 && typeof ArtW3 !== 'undefined') ArtW3.objects(x, G, list); });

  /* ---------- bambú: ráfagas de otoño y viento que lo dobla ---------- */
  // bend(G, cells, panelGust): T.bent = ráfaga de su panel, viento que pasó cerca o alguien parado adentro
  function bamboo(G, dt, cells) {
    const T = G.T, W = st(G); if (!W.bendT || W.bendT.length !== T.n) W.bendT = new Float32Array(T.n);
    // los hechizos de viento doblan el bambú que tocan (un ratito)
    for (const s of G.spells) { if (s.dead || !isEl(s, 'wind')) continue; let x = s.x, y = s.y; if (s.t === 'wave') { x += Math.cos(s.ang) * s.d; y += Math.sin(s.ang) * s.d; } Terrain.forCircle(T, x, y, (s.r || 14) + 34, i => { if (T.base[i] === TT.BUSH && G.cellLook.get(i) === 'bamboo') W.bendT[i] = Math.max(W.bendT[i], s.fusion ? 3 : 2.2); }); }
    let ch = false;
    for (const i of cells) {
      if (W.bendT[i] > 0) W.bendT[i] -= dt;
      if (T.base[i] !== TT.BUSH) { if (T.bent[i]) { T.bent[i] = 0; ch = true; } continue; }
      const P = G.sea.panels[Seasons.panelAt(G, Terrain.cx(T, i))], gust = P.s === 'autumn' && P.bend > 0;
      let v = gust || W.bendT[i] > 0 || G.cs.bowed ? 1 : 0;
      if (!v && T.bent[i]) for (const u of G.units) if (u.alive && Terrain.idx(T, u.x, u.y) === i) { v = 1; break; }
      if (T.bent[i] !== v) { T.bent[i] = v; ch = true; }
    }
    if (ch) T.ver++;
  }
  // ráfagas: en cada panel de otoño, cada 6 s (con aviso), el viento acuesta el bambú 2,6 s
  function gusts(G, dt, every = 6, len = 2.6) {
    for (const P of G.sea.panels) {
      if (P.s !== 'autumn') { P.gT = 3; P.bend = 0; continue; }
      if (P.bend > 0) { P.bend -= dt; if (P.bend <= 0) P.gT = every - len; continue; }
      P.gT = (P.gT == null ? 3 : P.gT) - dt;
      if (P.gT <= 0.9 && !P.warned) { P.warned = 1; if (G.mages.some(m => m.alive && m.x >= P.x0 && m.x < P.x1)) pop(G, 0, 0, 'Viene una ráfaga…', '#fff0d8', { screen: true, low: true }); }
      if (P.gT <= 0) { P.warned = 0; P.bend = len; G.events.push({ type: 'gust3', x: (P.x0 + P.x1) / 2, y: G.T.H / 2 }); if (!G.wind) { G.wind = { x: 1.2, y: 0 }; G.cs.windT = len; } }
    }
    if (G.cs.windT > 0) { G.cs.windT -= dt; if (G.cs.windT <= 0) G.wind = null; }
  }

  /* =================== LOS NIVELES =================== */
  const LV = {};
  /* ---------- c19 · El torii en el mar (Itsukushima): una estación por panel, cuatro acertijos ---------- */
  LV.c19 = { id: 'c19', world: 3, world3: 1, name: 'El torii en el mar', place: 'Itsukushima', kind: 'Ingenio', theme: 'miyajima', W: 2600, H: 1000, par: 240,
    text: 'Cada torii cambia la estación de su panel: golpeen un PILAR con planta (primavera), fuego (verano), viento (otoño) o agua (invierno).',
    spawns: [[150, 460], [150, 560]],
    sources: [S(290, 230, 'plant'), S(290, 790, 'wind'), S(820, 230, 'fire'), S(800, 800, 'water'), S(1420, 800, 'wind'), S(1460, 220, 'plant'), S(2010, 230, 'water'), S(2010, 790, 'light')],
    seasons: { panels: [[0, 640, 'autumn'], [640, 1280, 'spring'], [1280, 1920, 'summer'], [1920, 2600, 'spring']], toriis: [{ x: 430, y: 330 }, { x: 960, y: 700 }, { x: 1560, y: 560 }, { x: 2100, y: 500 }, { x: 2400, y: 520, big: 1.45, solo: true, s: 'spring' }] },
    paint(T) {
      all(T, TT.GRASS);
      path(T, [[80, 510], [380, 500], [540, 510]], 26, TT.DIRT); path(T, [[680, 510], [900, 470], [1160, 510]], 26, TT.DIRT); path(T, [[1280, 510], [1560, 470], [1860, 510]], 26, TT.DIRT); path(T, [[1940, 510], [2140, 500]], 26, TT.DIRT);
      // el canal con corriente (panel 1) y el mar (panel 4), con su orilla baja
      rect(T, 560, 0, 640, 1000, TT.DEEP); rect(T, 520, 0, 559, 1000, TT.SHALLOW); rect(T, 641, 0, 680, 1000, TT.SHALLOW);
      rect(T, 2180, 0, 2600, 1000, TT.DEEP); for (let k = 0; k < 6; k++) circ(T, 2180, 80 + k * 170, 48, TT.SHALLOW); ell(T, 2400, 520, 100, 80, TT.SHALLOW);
      bushes(T, [[150, 160], [190, 860], [430, 860], [760, 120], [700, 880], [740, 940], [1100, 160], [1360, 160], [1700, 860], [1820, 140], [1980, 380], [1060, 880], [460, 120]]);
      circ(T, 380, 660, 22, TT.ROCK); circ(T, 1040, 330, 20, TT.ROCK); circ(T, 1720, 330, 22, TT.ROCK); circ(T, 1990, 640, 20, TT.ROCK);
      border(T);
    },
    objs: [
      { t: 'current', rect: [560, 0, 640, 1000], dir: [-1, 0] }, { t: 'pads', rect: [560, 470, 640, 550] },
      { t: 'hedge', rect: [1200, 40, 1240, 960] },
      { t: 'pinwheel', x: 1700, y: 420 }, { t: 'door', look: 'fence', rect: [1880, 40, 1920, 960], cond: G => G.objs.some(o => o.t === 'pinwheel' && o.full) },
      { t: 'current', rect: [2180, 0, 2600, 1000], dir: [-1, 0] },
      { t: 'seal3', x: 700, y: 940 }, { t: 'exit', x: 2470, y: 520 },
    ],
    stage(G) { const c = G.cs, O = G.objs; if (!c.p0 && !G.mages.some(m => m.alive && m.x > 690)) return 0; c.p0 = 1; if (!O.find(o => o.t === 'hedge').burnt) return 1; if (!O.find(o => o.t === 'door').open) return 2; if (!c.stained) return 3; if (G.sea.toriis[4].stain) return 4; return 5; },
    want(G) { return [null, [[0, 'spring']], [[1, 'summer']], [[2, 'autumn']], [[3, 'winter']], [[4, 'spring']], null][this.stage(G) + 1]; },
    go(G) { const s = this.stage(G); if (s === 3 && G.sea.panels[3].s === 'winter') return [2330, 520]; return null; },
    goal: G => G.cs.stained && !G.sea.toriis[4].stain,
    label(G) { return ['Primavera en el canal: golpeen un pilar del torii con PLANTA', 'El seto verde no arde: llamen al VERANO (fuego al torii) y quémenlo', 'Hagan girar el molinete con VIENTO (en otoño gira mucho más)', 'Congelen el mar: INVIERNO (agua al torii) y vayan al gran torii', '¡El Borrón lo manchó! Límpienlo con LUZ', '¡A la salida!'][this.stage(G)]; },
    script(G, dt) {
      const cs = G.cs, s = this.stage(G);
      if (!cs.hi && G.state === 'play') { cs.hi = 1; say(G, '¡Llegaron al pergamino! Cada torii cambia la estación de su panel.'); say(G, 'Golpeen un pilar con planta: en primavera florecen los lotos.', 'sumi', 4.5); }
      if (!cs.w1 && G.mages.some(m => m.alive && m.x > 720)) { cs.w1 = 1; wave(G, ['kasa', 'kasa'], [[1000, 300], [1080, 760]]); say(G, 'Ese seto está verde: no arde. ¡Llamen al verano con fuego!'); }
      if (!cs.w2 && G.mages.some(m => m.alive && m.x > 1300)) { cs.w2 = 1; wave(G, ['tengu', 'kasa', 'tengu'], [[1600, 200], [1650, 820], [1500, 300]]); say(G, 'En otoño el viento sopla fuerte. ¡Hagan girar el molinete!'); }
      if (!cs.w3 && G.mages.some(m => m.alive && m.x > 1960)) { cs.w3 = 1; say(G, 'El mar no se cruza… a menos que se congele.'); }
      if (!cs.stained && G.mages.some(m => m.alive && hypot(m.x - 2400, m.y - 520) < 150)) { cs.stained = 1; const t = G.sea.toriis[4]; t.stain = true; G.fx.push({ type: 'splat', x: t.x, y: t.y - 60, r: 130, el: 'shadow' }); G.events.push({ type: 'inkSplash', x: t.x, y: t.y }); say(G, '¡Todo lo pintado se puede borrar!', 'borron'); say(G, '¡Manchó el gran torii! Límpienlo con LUZ.', 'sumi', 2.6); wave(G, ['kappa', 'kappa', 'kappa'], [[2290, 300], [2290, 740], [2520, 300]]); }
      if (s === 5 && !cs.bye) { cs.bye = 1; say(G, '¡Así se pinta un mundo! Vamos, el bosque de bambú espera.'); }
    },
    hint: 'Si el mar se derrite, la corriente vuelve: crúcenlo mientras sea invierno.' };

  /* ---------- c20 · El bosque de bambú (Arashiyama): el viento abre caminos ---------- */
  // panel 1: el sendero famoso, que serpentea entre paredes altas de bambú; panel 2: el bosque hondo, un laberinto
  const ARA_Y = x => 545 + Math.sin(x / 170) * 150 + Math.sin(x / 61) * 26;
  const MZ = { c0: 31, r0: 2, NI: 7, NJ: 6 }; // nodos del laberinto: 2×2 celdas cada 4 (pasillos de 80 px, paredes de 80 px)
  function maze(seed, extra) {
    let s = seed >>> 0; const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) & 0x7fffffff) / 0x7fffffff;
    const { NI, NJ } = MZ, vis = new Uint8Array(NI * NJ), open = new Set(), stack = [[0, 3]]; vis[3 * NI] = 1;
    while (stack.length) { const [i, j] = stack[stack.length - 1], nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([di, dj]) => { const a = i + di, b = j + dj; return a >= 0 && b >= 0 && a < NI && b < NJ && !vis[b * NI + a]; });
      if (!nb.length) { stack.pop(); continue; } const [di, dj] = nb[Math.floor(rnd() * nb.length)], a = i + di, b = j + dj; vis[b * NI + a] = 1; open.add(Math.min(i, a) + ',' + Math.min(j, b) + (di ? 'h' : 'v')); stack.push([a, b]); }
    for (let k = 0; k < extra; k++) { const i = Math.floor(rnd() * (NI - 1)), j = Math.floor(rnd() * NJ); open.add(i + ',' + j + 'h'); }
    return open;
  }
  // qué celdas del bosque hondo son pasillo con este laberinto
  function mazeCells(T, open) {
    const { c0, r0, NI, NJ } = MZ, set = new Set(), add = (c, r) => set.add(r * T.cols + c);
    for (let i = 0; i < NI; i++) for (let j = 0; j < NJ; j++) { const c = c0 + 4 * i, r = r0 + 4 * j; add(c, r); add(c + 1, r); add(c, r + 1); add(c + 1, r + 1);
      if (open.has(i + ',' + j + 'h')) for (let k = 2; k < 4; k++) { add(c + k, r); add(c + k, r + 1); }
      if (open.has(i + ',' + j + 'v')) for (let k = 2; k < 4; k++) { add(c, r + k); add(c + 1, r + k); } }
    for (const [c, r] of [[30, 14], [30, 15], [29, 14], [29, 15]]) add(c, r); // la entrada desde el sendero
    return set;
  }
  const NODE = (i, j) => [1280 + 160 * i, 120 + 160 * j];
  LV.c20 = { id: 'c20', world: 3, world3: 1, name: 'El bosque de bambú', place: 'Arashiyama', kind: 'Laberinto y lucha', theme: 'arashiyama', W: 2400, H: 1100, par: 240,
    text: 'El bambú es pared. En VERANO arde; en OTOÑO las ráfagas lo acuestan unos segundos; un hechizo de VIENTO también lo dobla un ratito. Crucen el bosque.',
    spawns: [[110, 500], [110, 590]],
    sources: [S(280, 560, 'fire'), S(420, 770, 'wind'), S(760, 520, 'plant'), S(...NODE(0, 1), 'wind'), S(...NODE(0, 5), 'fire'), S(...NODE(4, 3), 'earth'), S(...NODE(6, 5), 'water')],
    seasons: { panels: [[0, 1200, 'spring'], [1200, 2400, 'winter']], toriis: [{ x: 560, y: 530 }, { x: 1440, y: 606 }] },
    paint(T) {
      all(T, TT.BUSH);
      for (let x = 40; x <= 990; x += 10) circ(T, x, ARA_Y(x), 62, TT.DIRT);
      for (const [x, y, r] of [[280, 560, 80], [420, 770, 80], [560, 530, 110], [760, 520, 80], [110, 560, 110]]) circ(T, x, y, r, TT.GRASS);
      circ(T, 500, 170, 66, TT.GRASS); // el claro escondido (el sello)
      const open = mazeCells(T, maze(7, 3)); for (const i of open) T.base[i] = (i % T.cols === 29 || i % T.cols === 30) ? TT.DIRT : TT.GRASS;
      border(T);
    },
    objs: [{ t: 'seal3', x: 500, y: 170 }, { t: 'exit', x: NODE(6, 0)[0], y: NODE(6, 0)[1] }],
    setup(G) { const T = G.T, W = st(G); W.bam = []; for (let i = 0; i < T.n; i++) { const c = i % T.cols, r = (i / T.cols) | 0; if (c > 0 && r > 0 && c < T.cols - 1 && r < T.rows - 1) W.bam.push(i); } },
    stage(G) { const c = G.cs; if (!c.out1) return 0; if (!c.bigGust) return 1; return 2; },
    want(G) { const s = this.stage(G); return s === 0 ? [[0, 'summer']] : s === 1 ? [[1, 'autumn']] : null; },
    go(G) { const s = this.stage(G); return s === 1 ? NODE(5, 2) : s === 2 ? NODE(6, 0) : null; },
    goal: G => G.cs.bigGust && !live(G).some(u => u.boss3),
    label(G) { const s = this.stage(G); return s === 0 ? 'El sendero acaba en bambú: QUÉMENLO en verano, o DÓBLENLO (viento, o ráfagas de otoño)' : s === 1 ? 'Un laberinto de bambú: en OTOÑO las ráfagas lo acuestan… ¡crucen por donde quieran!' : live(G).some(u => u.boss3) ? '¡La bandada del rey tengu! Derríbenla (la tierra les duele)' : '¡A la salida! (arriba a la derecha)'; },
    script(G, dt) {
      const cs = G.cs, T = G.T, W = st(G);
      if (!W.bam) this.setup(G);
      if (!cs.hi && G.state === 'play') { cs.hi = 1; say(G, 'El bosque de bambú… En verano arde, en otoño se acuesta con el viento.'); say(G, 'Y un hechizo de viento lo dobla un ratito: ¡pasen detrás!', 'sumi', 5); }
      gusts(G, dt); bamboo(G, dt, W.bam);
      if (!cs.out1 && G.mages.some(m => m.alive && m.x > 1210)) { cs.out1 = 1; wave(G, ['tengu', 'tengu'], [NODE(1, 1), NODE(1, 5)]); say(G, '¡Tengus! Cortan los hechizos que cargan. ¡La tierra les duele!'); }
      // a medio bosque: la gran ráfaga acuesta todo el bosque… y al levantarse ya es otro laberinto
      if (cs.out1 && !cs.bigGust && G.mages.some(m => m.alive && m.x > 1860)) {
        cs.bigGust = 1; cs.bowed = 1; cs.bowT = 5; G.slow = Math.max(G.slow, 0.8); G.events.push({ type: 'bigGust', x: 1900, y: 560 }); pop(G, 0, 0, '¡LA GRAN RÁFAGA!', '#fff0d8', { big: true, screen: true }); say(G, '¡Agárrense! ¡El bosque se va a rearmar!');
        wave(G, ['tengu', 'tengu', 'tengu', 'kasa'], [NODE(6, 1), NODE(6, 4), NODE(5, 0), NODE(4, 5)]); for (const u of live(G).slice(-4)) u.boss3 = 1;
      }
      if (cs.bowT > 0) { cs.bowT -= dt; if (cs.bowT <= 0) { cs.bowed = 0; const open = mazeCells(T, maze(13, 4));
        for (const i of W.bam) { const c = i % T.cols; if (c < 29) continue; const want = open.has(i) ? 0 : 1, isB = T.base[i] === TT.BUSH; if (want && !isB && T.fire[i] <= 0) { if (G.units.some(u => u.alive && hypot(u.x - Terrain.cx(T, i), u.y - Terrain.cy(T, i)) < 44)) continue; T.base[i] = TT.BUSH; T.ash[i] = 0; if (hash2(i, 9) < 0.25) G.fx.push({ type: 'sprout', x: Terrain.cx(T, i), y: Terrain.cy(T, i), delay: hash2(i, 4) * 0.3 }); } else if (!want && isB) { T.base[i] = TT.GRASS; } }
        T.ver++; say(G, '¡El bosque cambió de forma! El rey tengu manda su bandada.'); } }
      // primavera: el bambú quemado vuelve a crecer (despacio, y nunca sobre alguien)
      if (G.frame % 45 === 0) for (const P of G.sea.panels) { if (P.s !== 'spring') continue; let n = 0; for (const i of W.bam) { if (n > 6 || T.base[i] === TT.BUSH || T.ash[i] <= 0 || T.fire[i] > 0 || Terrain.cx(T, i) < P.x0 || Terrain.cx(T, i) >= P.x1 || G.rng() > 0.08) continue; if (G.units.some(u => u.alive && hypot(u.x - Terrain.cx(T, i), u.y - Terrain.cy(T, i)) < 44)) continue; T.base[i] = TT.BUSH; T.ash[i] = 0; n++; G.fx.push({ type: 'sprout', x: Terrain.cx(T, i), y: Terrain.cy(T, i) }); } if (n) T.ver++; }
      // más tengus por el aire mientras quede bosque por delante
      cs.tw = (cs.tw == null ? 16 : cs.tw) - dt; if (cs.tw <= 0) { cs.tw = 17; if (cs.out1 && foes(G).length < 4) { const x = clamp(ahead(G) + 380, 1300, 2300); wave(G, ['tengu', 'tengu'], [[x, 140], [x, 960]]); } }
    },
    hint: 'Un hechizo de viento que atraviesa el bambú lo dobla dos segundos: ¡pasen detrás de él!' };

  /* ---------- c22 · El castillo de la garza blanca (Himeji) ---------- */
  LV.c22 = { id: 'c22', world: 3, world3: 1, name: 'El castillo de la garza blanca', place: 'Himeji', kind: 'Ingenio y lucha', theme: 'himeji', W: 2600, H: 1200, par: 270,
    text: 'Crucen el foso (congélenlo, o quemen la cuerda del puente), reparen la escalera borrada con enredadera de primavera y pongan cada torii del patio en la estación que pide su tablilla.',
    spawns: [[130, 560], [130, 660]],
    sources: [S(230, 300, 'water'), S(230, 920, 'fire'), S(430, 610, 'wind'), S(820, 260, 'plant'), S(820, 960, 'earth'), S(1060, 610, 'light'), S(1420, 610, 'fire'), S(1660, 250, 'wind'), S(1660, 970, 'plant'), S(1880, 560, 'water')],
    seasons: { panels: [[0, 690, 'summer'], [690, 1330, 'autumn'], [1330, 1960, 'winter'], [1960, 2600, 'spring']],
      toriis: [{ x: 410, y: 420 }, { x: 960, y: 450 }, { x: 1500, y: 330, solo: true, s: 'winter' }, { x: 1680, y: 610, solo: true, s: 'winter' }, { x: 1500, y: 900, solo: true, s: 'winter' }] },
    paint(T) {
      all(T, TT.STONE);
      // patios de grava con jardín, muros blancos entre patios (con su puerta)
      rect(T, 40, 40, 520, 1160, TT.GRASS); path(T, [[60, 610], [520, 610]], 30, TT.DIRT);
      rect(T, 560, 0, 640, 1200, TT.DEEP); rect(T, 540, 0, 559, 1200, TT.SHALLOW); rect(T, 641, 0, 660, 1200, TT.SHALLOW);
      rect(T, 680, 40, 1320, 1160, TT.STONE); path(T, [[700, 610], [1150, 610]], 30, TT.DIRT); ell(T, 860, 360, 120, 70, TT.GRASS); ell(T, 860, 860, 120, 70, TT.GRASS);
      rect(T, 1160, 40, 1240, 1160, TT.CHASM); // la escalera que borró el Borrón
      rect(T, 1320, 40, 1340, 1160, TT.ROCK); rect(T, 1320, 540, 1340, 680, TT.STONE);
      rect(T, 1360, 40, 1940, 1160, TT.STONE); ell(T, 1650, 610, 260, 380, TT.GRASS); path(T, [[1360, 610], [1940, 610]], 22, TT.DIRT);
      rect(T, 1940, 40, 1980, 1160, TT.ROCK); rect(T, 1990, 40, 2560, 1160, TT.STONE); ell(T, 2280, 610, 220, 300, TT.GRASS); path(T, [[1980, 610], [2480, 610]], 30, TT.DIRT);
      bushes(T, [[120, 140], [430, 140], [120, 1080], [430, 1080], [760, 140], [1080, 1080], [1420, 140], [1880, 1080], [2060, 140], [2500, 1080], [2060, 1080], [2500, 140]]);
      border(T);
    },
    objs: [
      { t: 'bridge', rect: [560, 570, 640, 650], cond: G => G.objs.some(o => o.t === 'rope' && o.cut) }, { t: 'rope', x: 500, y: 520 },
      { t: 'pads', look: 'vine', under: TT.CHASM, rect: [1160, 570, 1240, 650] },
      { t: 'tablet', x: 1440, y: 410, tk: 2, want: 'summer' }, { t: 'tablet', x: 1620, y: 690, tk: 3, want: 'autumn' }, { t: 'tablet', x: 1440, y: 980, tk: 4, want: 'spring' },
      { t: 'door', look: 'castle', rect: [1940, 520, 1980, 700], cond: G => G.objs.filter(o => o.t === 'tablet').every(o => o.ok) },
      { t: 'seal3', x: 2520, y: 1110 }, { t: 'exit', x: 2470, y: 610 },
    ],
    setup(G) {
      // los muros del castillo (blancos con tejado) y las armaduras dormidas
      const T = G.T, wall = []; for (let i = 0; i < T.n; i++) { const x = Terrain.cx(T, i), y = Terrain.cy(T, i); if (T.base[i] === TT.ROCK && x > 40 && x < T.W - 40 && y > 40 && y < T.H - 40) wall.push(i); } look(G, wall, 'wall');
      for (const [x, y, w] of [[900, 250, 150], [1060, 880, 150], [800, 760, 150], [1560, 180, 120], [1800, 820, 120], [1560, 1040, 120]]) { const c = new Creature(G, 'yoroi', x, y); c.wakeR = w; c.home = 1; if (x > 1330) c.court = 1; G.units.push(c); }
    },
    stage(G) { const c = G.cs, O = G.objs; if (!c.moat && !G.mages.some(m => m.alive && m.x > 680)) return 0; c.moat = 1; if (!c.stairs && !G.mages.some(m => m.alive && m.x > 1260)) return 1; c.stairs = 1; if (!O.find(o => o.t === 'door').open) return 2; return 3; },
    want(G) { const s = this.stage(G), behind = x => G.mages.some(m => m.alive && m.x < x); if (s === 0 || (behind(650) && !G.objs.find(o => o.t === 'bridge').open && G.sea.panels[0].s !== 'winter')) return G.objs.find(o => o.t === 'bridge').open ? null : [[0, 'winter']]; if (s === 1 || (behind(1150) && !G.objs.find(o => o.t === 'pads').open)) return [[1, 'spring']]; if (s === 2) return G.objs.filter(o => o.t === 'tablet' && !o.ok).map(o => [o.tk, o.want]); return null; },
    ropeOk: G => !G.cs.moat,
    go(G) { return this.stage(G) === 3 && !G.mages.some(m => m.alive && m.x < 1150) ? (G.cs.keep ? [2470, 610] : [2200, 610]) : null; },
    goal: G => G.cs.keep && !foes(G).some(u => u.boss3),
    label(G) { const s = this.stage(G); if (s === 0) return 'El foso: congélenlo (INVIERNO) o quemen la CUERDA del puente'; if (s === 1) return 'El Borrón borró la escalera: en PRIMAVERA crece un puente de enredadera'; if (s === 2) { const n = G.objs.filter(o => o.t === 'tablet' && o.ok).length; return `Cada torii suelto, en la estación de su tablilla (${n}/3) · ¡ojo con las armaduras!`; } return G.cs.keep && foes(G).some(u => u.boss3) ? '¡Defiendan la torre del homenaje!' : '¡A la torre!'; },
    script(G, dt) {
      const cs = G.cs, s = this.stage(G);
      if (!cs.hi && G.state === 'play') { cs.hi = 1; say(G, 'El castillo de la garza blanca… el Borrón se escondió aquí.'); say(G, 'Para cruzar el foso: congélenlo, o quemen la cuerda del puente.', 'sumi', 4); }
      if (s >= 1 && !cs.s1) { cs.s1 = 1; wave(G, ['kasa', 'kasa'], [[900, 420], [1000, 800]]); say(G, 'Esas armaduras duermen… no se acerquen mucho.'); }
      if (s >= 2 && !cs.s2) { cs.s2 = 1; say(G, 'Las tablillas dicen qué estación quiere cada torii. Si se equivocan, despierta una armadura.'); }
      if (s >= 3 && !cs.keep && G.mages.some(m => m.alive && m.x > 2060)) { cs.keep = 1; wave(G, ['oni', 'tengu', 'tengu', 'kasa'], [[2380, 400], [2380, 820], [2200, 300], [2200, 900]]); for (const u of foes(G).slice(-4)) u.boss3 = 1; say(G, '¡El guardián de la torre! Por la espalda le duele el doble.'); }
    },
    onEvent(G, e) {
      // torii suelto en la estación equivocada: despierta una armadura del patio
      if (e.type === 'toriiSolo') { const tb = G.objs.find(o => o.t === 'tablet' && o.tk === e.k); if (tb && e.s !== tb.want) { const y = live(G, 'yoroi').filter(u => u.court && !u.awake).sort((a, b) => hypot(a.x - e.x, a.y - e.y) - hypot(b.x - e.x, b.y - e.y))[0]; pop(G, e.x, e.y - 130, 'No es esa estación…', '#ffb0a0', { small: true }); if (y) y.wake = 1; } }
    },
    hint: 'Las armaduras cargan en línea recta: háganse a un lado. La planta las agrieta.' };

  /* ---------- c23 · La aldea nevada (Shirakawa-go): de noche, defender los faroles ---------- */
  const SHI_H = [[440, 330], [1460, 330], [950, 900]];
  LV.c23 = { id: 'c23', world: 3, world3: 1, name: 'La aldea nevada', place: 'Shirakawa-go', kind: 'Defensa', theme: 'shirakawa', W: 1900, H: 1200, par: 200, dark: 1, cold: 1, mist: 0,
    text: 'Noche de ventisca. Mantengan encendidos los faroles de las tres casas hasta el amanecer (3 minutos): las criaturas de nieve los apagan. Lejos del fuego se congelan.',
    spawns: [[880, 650], [1020, 650]],
    sources: [S(260, 620, 'fire'), S(1640, 620, 'fire'), S(950, 1120, 'light'), S(170, 1080, 'water'), S(1730, 1080, 'wind'), S(950, 120, 'plant')],
    seasons: { panels: [[0, 1900, 'winter']], toriis: [{ x: 950, y: 560, stain: true }] },
    paint(T) {
      all(T, TT.GRASS);
      path(T, [[40, 620], [700, 600], [1200, 600], [1860, 620]], 26, TT.DIRT); path(T, [[950, 80], [950, 1160]], 22, TT.DIRT);
      // los arrozales congelados y el río
      for (const [x, y] of [[300, 900], [560, 1050], [1340, 1050], [1600, 900], [640, 180], [1260, 180]]) rect(T, x - 80, y - 50, x + 80, y + 50, TT.SHALLOW);
      path(T, [[40, 1140], [400, 1160]], 18, TT.SHALLOW);
      bushes(T, [[120, 160], [200, 360], [1780, 160], [1700, 360], [120, 760], [1780, 760], [760, 760], [1140, 760], [620, 470], [1280, 470]]);
      border(T);
    },
    objs: [{ t: 'house', x: SHI_H[0][0], y: SHI_H[0][1] }, { t: 'house', x: SHI_H[1][0], y: SHI_H[1][1] }, { t: 'house', x: SHI_H[2][0], y: SHI_H[2][1] }, { t: 'seal3', x: 1820, y: 1120 }],
    want(G) { if (G.cs.sumT > 0) return null; const t = G.sea.toriis[0]; return (G.objs.some(o => o.t === 'house' && !o.lit) || G.mages.some(m => m.alive && m.cold > 60)) ? [[0, 'summer']] : t.stain ? [[0, 'summer']] : null; },
    goal: G => G.roundT >= 180 && G.cs.yuki === 2, autoWin: true,
    label(G) { const left = Math.max(0, 180 - G.roundT), n = G.objs.filter(o => o.t === 'house' && o.lit).length, tm = `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`;
      if (G.cs.yuki === 1) return `¡Yuki-onna! Derrótenla (le duele el fuego) · faroles ${n}/3`; if (left <= 0) return G.cs.yuki === 2 ? '¡Amaneció!' : 'Amanece… ¡pero falta Yuki-onna!';
      return (n < 3 ? `¡Enciendan los faroles con fuego! (${n}/3)` : `Faroles ${n}/3`) + ` · amanece en ${tm}` + (G.cs.sumT > 0 ? ` · verano ${Math.ceil(G.cs.sumT)} s` : ''); },
    script(G, dt) {
      const cs = G.cs, T = G.T, t = G.roundT, H = G.objs.filter(o => o.t === 'house');
      if (!cs.hi && G.state === 'play') { cs.hi = 1; say(G, 'Qué frío… Mantengan encendidos los faroles hasta el amanecer.'); say(G, 'El torii está manchado. Límpienlo con luz, y luego fuego: un rato de verano.', 'sumi', 5); }
      // oleadas de nieve: desde los bordes, cada vez más
      cs.wt = (cs.wt == null ? 5 : cs.wt) - dt;
      if (cs.wt <= 0 && t < 172) { const k = t < 50 ? 0 : t < 100 ? 1 : 2; cs.wt = [11, 10, 9][k]; const n = [2, 3, 4][k] - (G.players === 1 ? 1 : 0), E = [[80, 80], [1820, 80], [80, 1120], [1820, 1120], [950, 60]], list = Array.from({ length: n }, (_, j) => j === 3 && k === 2 ? 'kasa' : 'yukiko');
        if (foes(G).length < 10) wave(G, list, E.sort(() => G.rng() - 0.5)); }
      if (t > 85 && !cs.oni) { cs.oni = 1; wave(G, ['oni'], [[950, 80]]); say(G, '¡Un oni bajó de la montaña!'); }
      // a mitad de la noche, el fuego del hogar los reanima
      if (t > 90 && !cs.mid) { cs.mid = 1; if (G.lives < 3) { G.lives = 3; pop(G, 0, 0, '¡El fuego del hogar los reanima! (vidas: 3)', '#ffcf8a', { big: true, screen: true }); } }
      // Yuki-onna (a los 2:20)
      if (t > 140 && !cs.yuki) { cs.yuki = 1; const [x, y] = Arena.safeNear(G, 950, 230); const c = new Creature(G, 'yukionna', x, y); c.boss3 = 1; G.units.push(c); G.events.push({ type: 'bossWarn', x, y, el: 'water' }); pop(G, 0, 0, '¡YUKI-ONNA!', '#dff0ff', { big: true, screen: true }); say(G, 'Esta noche… nadie se calienta.', 'yukionna'); say(G, '¡Le duele el fuego! Y no la dejen soplar sobre los faroles.', 'sumi', 3); }
      if (cs.yuki === 1 && !live(G, 'yukionna').length) { cs.yuki = 2; say(G, '¡Se fue! Ya casi amanece.'); for (const u of foes(G)) { u.alive = false; G.fx.push({ type: 'steam', x: u.x, y: u.y, r: 40 }); } }
      // el torii: limpio + fuego = 30 s de verano; luego vuelve la ventisca y el Borrón lo mancha otra vez
      const tor = G.sea.toriis[0];
      if (G.sea.panels[0].s === 'summer' && !(cs.sumT > 0) && !cs.sumOn) { cs.sumOn = 1; cs.sumT = 30; say(G, '¡Verano! Se derrite la nieve: aprovechen.'); for (const m of G.mages) m.cold = 0; }
      if (cs.sumT > 0) { cs.sumT -= dt; if (cs.sumT <= 0) { cs.sumOn = 0; Seasons.set(G, 0, 'winter'); tor.stain = true; G.fx.push({ type: 'splat', x: tor.x, y: tor.y - 60, r: 110, el: 'shadow' }); say(G, '¡El invierno vuelve!', 'borron'); } }
      // perder: los tres faroles apagados 6 s seguidos
      if (H.every(o => !o.lit)) { cs.dark = (cs.dark || 0) + dt; if (cs.dark > 10) return Game.endRound(-1, 'lost'); if (!cs.darkW) { cs.darkW = 1; pop(G, 0, 0, '¡Todos los faroles apagados! ¡Rápido!', '#ff9a8a', { big: true, screen: true }); } } else { cs.dark = 0; cs.darkW = 0; }
      // aviso: una criatura va por un farol encendido
      for (const o of H) if (o.lit && (!o.warnT || G.time - o.warnT > 7) && live(G, 'yukiko').some(u => hypot(u.x - o.fx, u.y - o.fy) < 260)) { o.warnT = G.time; pop(G, o.fx, o.fy - 120, '¡Van por este farol!', '#cfe8ff', { small: true }); }
      if (t >= 180 && !cs.dawn) { cs.dawn = 1; if (cs.yuki === 2) say(G, '¡Amaneció! Lo lograron.'); }
    },
    hint: 'Cerca de un farol encendido, del fuego o de tu compañero, el frío baja.' };

  /* ---------- c25 · La noche del festival (Kioto): huir del muro de tinta ---------- */
  LV.c25 = { id: 'c25', world: 3, world3: 1, name: 'La noche del festival', place: 'Kioto', kind: 'Persecución', theme: 'kioto', W: 4400, H: 1000, par: 140, dark: 1,
    text: '¡El Borrón inunda Kioto de tinta! Corran hacia el santuario: quemen los puestos de papel, hagan girar el molinete y crucen el río. Lo que el muro toca, desaparece.',
    spawns: [[260, 450], [260, 560]],
    sources: [S(420, 280, 'fire'), S(420, 740, 'fire'), S(1240, 250, 'wind'), S(1300, 760, 'fire'), S(2380, 260, 'plant'), S(2380, 760, 'water'), S(3420, 260, 'light'), S(3480, 760, 'wind')],
    seasons: { panels: [[0, 1100, 'summer'], [1100, 2200, 'autumn'], [2200, 3300, 'summer'], [3300, 4400, 'winter']], toriis: [{ x: 2540, y: 500 }] },
    checkpoints: [[2300, 500]],
    paint(T) {
      all(T, TT.STONE);
      // calles de piedra con casas de madera a los lados
      rect(T, 0, 40, 4400, 140, TT.ROCK); rect(T, 0, 860, 4400, 960, TT.ROCK);
      for (const [x0, x1] of [[640, 700], [1640, 1700], [2000, 2040], [3700, 3760]]) { rect(T, x0, 140, x1, 340, TT.ROCK); rect(T, x0, 660, x1, 860, TT.ROCK); }
      path(T, [[40, 500], [4360, 500]], 30, TT.DIRT);
      // el río Kamo (con su corriente) y sus orillas
      rect(T, 2700, 0, 2860, 1000, TT.DEEP); rect(T, 2660, 140, 2699, 860, TT.SHALLOW); rect(T, 2861, 140, 2900, 860, TT.SHALLOW);
      // la subida al santuario: nieve y linternas de piedra
      rect(T, 3300, 140, 4360, 860, TT.GRASS); path(T, [[3300, 500], [4300, 500]], 34, TT.STONE);
      bushes(T, [[3420, 400], [3420, 620], [3900, 220], [3900, 780], [4100, 300], [4100, 700]]);
      border(T);
    },
    objs: [
      { t: 'stall', rect: [920, 150, 960, 400] }, { t: 'stall', rect: [920, 401, 960, 620] }, { t: 'stall', rect: [920, 621, 960, 850] },
      { t: 'pinwheel', x: 1880, y: 300 }, { t: 'door', look: 'fence', rect: [2120, 160, 2160, 840], cond: G => G.objs.some(o => o.t === 'pinwheel' && o.full) },
      { t: 'current', rect: [2700, 0, 2860, 1000], dir: [-0.85, 0.5] }, { t: 'pads', rect: [2700, 460, 2860, 540] },
      { t: 'stall', rect: [3880, 150, 3920, 400] }, { t: 'stall', rect: [3880, 401, 3920, 620] }, { t: 'stall', rect: [3880, 621, 3920, 850] },
      { t: 'inkwall', x0: -160, wait: 4.5 },
      { t: 'seal3', x: 1500, y: 820 }, { t: 'exit', x: 4260, y: 500 },
    ],
    setup(G) { const T = G.T, R = []; for (let i = 0; i < T.n; i++) { const x = Terrain.cx(T, i), y = Terrain.cy(T, i); if (T.base[i] === TT.ROCK && x > 40 && x < T.W - 40 && y > 40 && y < T.H - 40) R.push(i); } look(G, R, 'machiya'); },
    stage(G) { const O = G.objs, a = ahead(G); if (a < 980) return 0; if (!O.find(o => o.t === 'door').open) return 1; if (a < 2900) return 2; return 3; },
    want(G) { return this.stage(G) === 2 ? [[0, G.mages.some(m => m.hands.some(h => h.el === 'water')) ? 'winter' : 'spring']] : null; },
    goal: () => true,
    label(G) { const w = G.objs.find(o => o.t === 'inkwall'), gap = Math.round(Math.max(0, Math.min(...G.mages.filter(m => m.alive).map(m => m.x)) - w.x) / 10), s = this.stage(G), warn = gap < 30 ? ' · ¡LA TINTA LOS ALCANZA!' : ` · tinta a ${gap} m`;
      return ['¡Quemen los puestos de papel!', 'Hagan girar el molinete con VIENTO (es otoño)', 'El río: INVIERNO lo congela, PRIMAVERA abre los lotos', '¡Al santuario!'][s] + warn; },
    script(G, dt) {
      const cs = G.cs, w = G.objs.find(o => o.t === 'inkwall');
      if (!cs.hi && G.state === 'play') { cs.hi = 1; say(G, '¡Todo lo pintado se puede borrar!', 'borron'); say(G, '¡Corran! ¡La tinta borra todo lo que toca!', 'sumi', 2.2); }
      // a quien alcanza la tinta, la tinta lo escupe hacia adelante (con el golpe de la caída)
      for (const m of G.mages) if (m.alive && m.x < w.x + 70) { const o = G.mages.find(q => q !== m && q.alive && q.x > w.x + 300), [x, y] = Arena.safeNear(G, o ? o.x - 60 : w.x + 380, o ? o.y : 500, true); G.fx.push({ type: 'splat', x: m.x, y: m.y, r: 60, el: 'shadow' }); m.x = x; m.y = y; m.vx = m.vy = 0; m.iframes = Math.max(m.iframes || 0, 1); if (!m.inkT || G.time - m.inkT > 3) { m.inkT = G.time; pop(G, x, y - 80, '¡La tinta te escupió!', '#d8d0ff', { small: true }); } }
      // los puntos de control siempre por delante del muro
      if (G.checkpoint[0] < w.x + 260) { const [x, y] = Arena.safeNear(G, Math.max(w.x + 520, ahead(G) - 100), 500); G.checkpoint = [x, y]; }
      // faroles embrujados y tengus en la calle de las linternas
      if (!cs.w1 && ahead(G) > 1150) { cs.w1 = 1; wave(G, ['chochin', 'chochin', 'chochin'], [[1600, 300], [1700, 700], [1800, 500]]); say(G, '¡Faroles embrujados! Revientan en llamas: el agua los apaga.'); }
      if (!cs.w2 && ahead(G) > 2300) { cs.w2 = 1; wave(G, ['kappa', 'kappa'], [[2780, 300], [2780, 700]]); if (G.lives < 3) { G.lives = 3; pop(G, 0, 0, 'Vidas: 3', '#9fe07a', { big: true, screen: true }); } }
      if (!cs.w3 && ahead(G) > 3350) { cs.w3 = 1; wave(G, ['oni', 'tengu', 'tengu'], [[3800, 500], [3700, 260], [3700, 760]]); say(G, '¡Ya casi! El santuario está arriba.'); }
      cs.cw = (cs.cw == null ? 9 : cs.cw) - dt; if (cs.cw <= 0) { cs.cw = 10; if (foes(G).length < 5) { const x = ahead(G) + 500; if (x < 4200) wave(G, ['chochin', 'chochin'], [[x, 260], [x, 740]]); } }
      // fuegos artificiales sobre la ciudad
      cs.fw = (cs.fw || 0) - dt; if (cs.fw <= 0) { cs.fw = 0.7 + G.rng() * 1.2; G.events.push({ type: 'firework', x: ahead(G) + (G.rng() - 0.3) * 900, y: 120 + G.rng() * 300, h: (G.rng() * 6) | 0 }); }
    },
    hint: 'El muro va más rápido si se adelantan mucho, y más lento si van justos: no se separen.' };

  return { LV, say, wave, pop, live, foes, cellsRect, rect, circ, ell, border, bushes, path, S, all, look, hitBy, holding, isEl, sea, st, ahead, gusts, bamboo };
})();
