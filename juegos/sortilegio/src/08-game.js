/* =========================================================================
   PARTIDA — estado (G), arranque, rondas, pasos fijos de 1/120 s, cámara,
   eventos (sonido, efectos, letreros) y dibujo en cada cuadro.
   ========================================================================= */
const Game = (() => {
  const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
  let sw = 0, sh = 0, dpr = 1, quality = Store.get('quality', 'alta');
  const cfg = Object.assign({ mode: 'duel', arena: 'paramo', chars: ['candela', 'yuma'], level: 1, wins: 3 }, Store.get('cfg', {}));
  const cam = { x: 880, y: 500, z: 0.6, tx: 880, ty: 500, tz: 0.6, shake: 0, sx: 0, sy: 0 };
  const G = { ally(o, m) { return o >= 0 && G.mages[o] && (o === m.idx || G.mages[o].team === m.team); }, state: 'attract', mages: [], units: [], spells: [], fx: [], events: [], pops: [], time: 0, frame: 0, rng: makeRng(1), wins: [0, 0], round: 0, players: 2, mode: 'duel', paused: false, slow: 0, slowK: 1, banner: null };
  let onMatchEnd = null, onRoundEnd = null;
  function resize() {
    const touch = matchMedia('(pointer: coarse)').matches;
    const cap = quality === 'ligera' ? 1.25 : quality === 'media' ? (touch ? 1.6 : 1.75) : 2;
    dpr = Math.min(devicePixelRatio || 1, cap);
    sw = innerWidth; sh = innerHeight;
    canvas.width = Math.round(sw * dpr); canvas.height = Math.round(sh * dpr);
    canvas.style.width = sw + 'px'; canvas.style.height = sh + 'px';
  }
  addEventListener('resize', resize); resize();
  function setQuality(q, manual) { quality = q; Store.set('quality', q); if (manual) Store.set('qManual', true); LOWFX = q === 'ligera'; MIDFX = q !== 'alta'; resize(); }
  LOWFX = quality === 'ligera'; MIDFX = quality !== 'alta';
  // si el equipo no da abasto (menos de ~50 cuadros por segundo dos veces seguidas en plena partida) baja un escalón solo; no lo hace si la persona eligió la calidad a mano
  const perf = { t: 0, n: 0, low: 0, wait: 2 };
  function watchPerf(dt) {
    if (quality === 'ligera' || Store.get('qManual', false) || G.attract || G.paused || G.state !== 'play' || G.introT > 0 || G.slow > 0 || UI.current != null) return; // en pausa, menús o cámara lenta solo se deja de contar
    if (perf.wait > 0) { perf.wait -= dt; return; }
    perf.t += dt; perf.n++; if (perf.t < 3) return;
    const f = perf.n / perf.t; perf.t = 0; perf.n = 0; perf.low = f < 50 ? perf.low + 1 : 0;
    if (perf.low >= 2) { perf.low = 0; perf.wait = 4; const q = quality === 'alta' ? 'media' : 'ligera'; setQuality(q); G.pops.push({ x: 0, y: 0, text: q === 'media' ? 'Calidad media para que vaya más fluido' : 'Calidad ligera para que vaya más fluido', t: 0, color: '#dcd2ff', screen: true, low: true }); }
  }

  /* ---------- arrancar ---------- */
  let lastOver = null;
  function start(mode, players, over = {}) {
    lastOver = over; G.mode = mode; G.players = players; G.attract = false; G.state = 'count'; G.copaTag = null; G.aimSpots = null; G.objs = null; G.boss = null; G.L = null; G.dummy = null; G.school = null;
    G.arenaId = over.arena || cfg.arena; if (G.arenaId === 'random') G.arenaId = ARENA_ORDER[Math.floor(Math.random() * ARENA_ORDER.length)];
    G.chars = over.chars || cfg.chars.slice(); G.skins = (over.skins || (typeof Vestidor !== 'undefined' ? [0, 1].map(p => Vestidor.V.eq(p, 'skin', G.chars[p])) : [0, 0])).slice(); if (G.chars[0] === G.chars[1] && G.skins[0] === G.skins[1]) { const s0 = G.skins[0]; G.skins[1] = typeof s0 === 'number' ? (s0 + 1) % 3 : /\.0$/.test(String(s0)) ? G.chars[1] + '.1' : G.chars[1] + '.0'; } G.level = over.level != null ? over.level : cfg.level;
    G.winsNeeded = mode === 'duel' ? (over.wins || cfg.wins) : 1; G.campLevel = over.level != null && mode === 'camp' ? over.level : G.campLevel || 0; G.coop = mode === 'camp'; G.wins = [0, 0]; G.round = 0; G.paused = false;
    G.matchStats = [Mage.newStats(), Mage.newStats()];
    newRound(true);
    G.introT = ['duel', 'tejo', 'hunt', 'altar'].includes(mode) && G.mages.length === 2 ? 2.7 : 0; G.introMax = G.introT; if (G.introT) G.events.push({ type: 'intro' });
  }
  function newRound(first) {
    G.round++; G.seed = (Math.random() * 1e9) | 0; G.rng = makeRng(G.seed);
    if (G.mode === 'camp') Camp.build(G, Camp.LEVELS[G.campLevel]); else Arena.build(G, G.arenaId);
    G.spells = []; G.fx = []; G.events = []; G.pops = []; G.time = 0; G.frame = 0; G.slow = 0; G.ring = null; G.mistWarned = false;
    G.wind = null; G.current = null; G.rain = false; G.embMul = 1;
    const prev = G.mages;
    G.mages = G.chars.map((cid, i) => {
      const [x, y] = G.A.spawns[i], m = new Mage(G, i, cid, x, y, i); m.skin = G.state === 'attract' ? (Math.random() < 0.4 ? 'u.' + ArtMage.OUTFIT_ORDER[(Math.random() * ArtMage.OUTFIT_ORDER.length) | 0] : (Math.random() * 3) | 0) : (G.skins || [])[i] || 0;
      if (!first && prev[i]) { m.emb = prev[i].emb * 0.5; m.stats = prev[i].stats; }
      const bot = G.state === 'attract' || i >= G.players; if (bot) m.ctrl = new Bot(G.state === 'attract' ? 1 : G.mode === 'camp' ? 2 : G.level);
      return m;
    });
    G.units = G.mages.slice();
    G.usePresage = !G.attract && G.mode === 'duel' && Store.get('presage', true) && G.round > 1;
    Events.setup(G);
    Modes.setup(G);
    if (G.mode === 'camp') Camp.setup(G);
    if (G.mode === 'school') Progress.schoolSetup(G);
    G.state = G.state === 'attract' ? 'attract' : 'count'; G.countT = first ? 2.6 : 2.2;
    if (G.state === 'attract') G.state = 'play';
    snapCamera();
    G.events.push({ type: 'round', n: G.round }); G.koCam = null;
    if (!G.attract && G.mode === 'duel' && G.winsNeeded > 1 && G.wins[0] === G.winsNeeded - 1 && G.wins[1] === G.winsNeeded - 1) G.pops.push({ x: 0, y: 0, text: '¡Ronda decisiva!', t: 0, color: '#ff9a7a', big: true, screen: true, low: true });
  }
  function startAttract() {
    G.state = 'attract'; G.mode = 'duel'; G.players = 0; G.arenaId = 'paramo';
    G.chars = [CHAR_ORDER[Math.floor(Math.random() * CHAR_ORDER.length)], CHAR_ORDER[Math.floor(Math.random() * CHAR_ORDER.length)]]; G.winsNeeded = 99; G.wins = [0, 0]; G.round = 0; G.level = 1;
    G.matchStats = [Mage.newStats(), Mage.newStats()];
    newRound(true); G.attract = true;
  }
  function endRound(winner, why) {
    if (G.state !== 'play') return;
    if (G.attract) { setTimeout(() => { if (G.attract) { G.chars = [CHAR_ORDER[Math.floor(Math.random() * CHAR_ORDER.length)], CHAR_ORDER[Math.floor(Math.random() * CHAR_ORDER.length)]]; G.state = 'attract'; newRound(true); G.attract = true; } }, 2500); G.state = 'roundEnd'; return; }
    G.state = 'roundEnd'; G.roundWinner = winner; G.roundWhy = why;
    if (winner >= 0) G.wins[winner]++;
    G.slow = 1.3;
    const done = winner >= 0 && G.wins[winner] >= G.winsNeeded;
    const name = winner >= 0 ? who(winner) : '';
    if (G.mode === 'school') { G.state = 'matchEnd'; if (onMatchEnd) onMatchEnd(results()); return; }
    if (G.mode === 'camp') { G.wins = [winner === 0 ? 1 : 0, 0]; G.campWin = why === 'win'; G.campStars = G.campWin ? Camp.stars(G) : 0; G.banner = { text: G.campWin ? '¡Nivel superado!' : 'Esta vez no se pudo', sub: { lives: 'Se acabaron las vidas', timeout: 'El volcán se desbordó', lost: 'Perdieron lo que había que proteger' }[why] || '', t: 0, color: G.campWin ? '#ffe9a0' : '#ff9a8a' }; G.events.push({ type: G.campWin ? 'matchWin' : 'roundWin', who: 0 }); setTimeout(() => { if (G.state !== 'roundEnd') return; G.state = 'matchEnd'; G.banner = null; const r = results(); Progress.onMatchEnd(G, r); if (onMatchEnd) onMatchEnd(r); }, 2600); return; }
    G.banner = { text: winner < 0 ? '¡Empate!' : done ? `¡${name} gana!` : `Ronda para ${name}`, sub: why === 'time' ? (G.mode === 'duel' ? 'Se acabó el tiempo: gana quien tenga más vida' : 'Se acabó el tiempo') : '', t: 0, color: winner >= 0 ? PLAYER_COLORS[winner].main : '#e8e0ff' };
    G.events.push({ type: done ? 'matchWin' : 'roundWin', who: winner });
    setTimeout(() => {
      if (G.state !== 'roundEnd') return;
      if (done) { G.state = 'matchEnd'; G.banner = null; const r = results(); Progress.onMatchEnd(G, r); if (onMatchEnd) onMatchEnd(r); }
      else { G.banner = null; newRound(false); }
    }, done ? 2600 : 2400);
  }
  function revive(m) { if (!m || m.alive) return; m.alive = true; m.hp = m.maxHp; const [x, y] = m.spawn || G.A.spawns[m.idx]; m.x = x; m.y = y; m.vx = m.vy = 0; m.iframes = 1; m.st = Object.assign(m.st, { burn: 0, wet: 0, frozen: 0, root: 0, stun: 0, slow: 0, slowF: 1, chill: 0, hex: 0, silence: 0, blind: 0 }); if (!G.units.includes(m)) G.units.push(m); }
  const who = i => (G.players === 1 && i === 1 ? 'La máquina' : `J${i + 1}`);
  function results() {
    const w = G.wins[0] > G.wins[1] ? 0 : G.wins[1] > G.wins[0] ? 1 : -1;
    return { camp: G.mode === 'camp' ? { level: G.campLevel, win: G.campWin, stars: G.campStars, lives: G.lives, t: G.roundT } : null, winner: w, score: (G.score || [0, 0]).map(Math.floor), wins: G.wins.slice(), names: [0, 1].map(i => `${who(i)} · ${CHARS[G.chars[i]].name}`), chars: G.chars.slice(), stats: G.mages.map(m => Object.assign({}, m.stats)), vsBot: G.players === 1, mode: G.mode };
  }

  /* ---------- paso fijo ---------- */
  const DT = 1 / 120;
  function step(dt) {
    G.frame++; G.time += dt;
    if (G.state === 'count') { if (G.introT > 0) G.introT -= dt; else { G.countT -= dt; if (G.countT <= 0) { G.state = 'play'; G.events.push({ type: 'go' }); } } }
    for (const m of G.mages) m.update(G, dt);
    // separación entre magos
    const [a, b] = G.mages;
    if (a && b && a.alive && b.alive) { const dx = b.x - a.x, dy = b.y - a.y, d = hypot(dx, dy), min = a.r + b.r; if (d < min && d > 0.01) { const p = (min - d) / 2; a.x -= dx / d * p; a.y -= dy / d * p; b.x += dx / d * p; b.y += dy / d * p; } }
    for (const u of G.units) if (!u.isMage && u.update) u.update(G, dt);
    Spells.update(G, dt);
    Terrain.update(G, dt);
    for (const s of G.sources) { if (s.cd > 0) s.cd -= dt; }
    Events.update(G, dt);
    Modes.update(G, dt);
    handleEvents();
  }
  function handleEvents() {
    const E = G.events; G.events = [];
    for (const e of E) {
      if (Game.tap) Game.tap(e);
      FX.onEvent(G, e);
      Sound.onEvent(G, e);
      if (G.mode === 'camp') Camp.onEvent(G, e);
      Progress.onEvent(G, e); if (G.mode === 'school') Progress.schoolEvent(G, e);
      if (e.type === 'creatureDown') Modes.onCreatureDown(G, e);
      if (e.type === 'goal') { cam.shake = Math.max(cam.shake, 18); G.slow = Math.max(G.slow, 0.5); }
      if (e.type === 'down') { const m = G.mages[e.who]; G.slow = Math.max(G.slow, 0.9); cam.shake = Math.max(cam.shake, 16); if (m && G.mode === 'duel') G.koCam = { x: m.x, y: m.y, until: G.time + 1.1 }; Modes.onDown(G, m); }
      if (e.type === 'combo' && !G.attract && e.n < 3) G.pops.push({ x: e.x, y: e.y - 70, text: e.name, t: 0, color: PLAYER_COLORS[e.who] ? PLAYER_COLORS[e.who].main : '#fff', big: true });
      if (e.type === 'granStart') { G.granFx = { t: 0, who: e.who, name: e.name || '', els: e.els, rel: -1 }; G.koCam = { x: e.x, y: e.y - 20, until: G.time + GRAN_CHARGE + 0.25 }; G.slow = Math.max(G.slow, 1.05); }
      if (e.type === 'gran') { if (!G.granFx) G.granFx = { t: 0.8, who: e.who, name: e.name || '', els: e.els, rel: 0.8 }; else G.granFx.rel = G.granFx.t; G.hitStop = Math.max(G.hitStop || 0, 0.07); G.slow = Math.max(G.slow, 0.45); cam.shake = Math.max(cam.shake, 20); }
      if (e.type === 'fusion' && !e.gran && G.state === 'play' && !G.attract) G.pops.push({ x: 0, y: 0, follow: G.mages[e.who], text: FUSIONS[e.key].name, t: 0, color: '#f3eaff', small: true });
      if (e.type === 'boom') cam.shake = Math.max(cam.shake, e.r > 70 ? 9 : 5);
      if (e.type === 'thunder') cam.shake = Math.max(cam.shake, e.big ? 8 : 3);
      if (e.type === 'quake') cam.shake = Math.max(cam.shake, 12);
      if (e.type === 'hurt' && !e.dot && e.dmg >= 15) cam.shake = Math.max(cam.shake, 6);
      if (e.type === 'hurt' && !e.dot && !G.attract && e.unit && e.unit.isMage && e.dmg >= 12) G.hitStop = Math.max(G.hitStop || 0, e.dmg >= 22 ? 0.085 : 0.045);
      if (e.type === 'arenaEvent' && !G.attract && e.ev !== 'breath') G.pops.push({ x: 0, y: 0, text: { mist: '¡Baja la neblina!', storm: '¡Tormenta en el río!', eruption: '¡Erupción!', guardians: '¡Despiertan los guardianes!', flood: '¡Crece el caño!', breath: '' }[e.ev], t: 0, color: '#ffd9a0', big: true, screen: true });
      if (e.type === 'mist') G.pops.push({ x: G.T.W / 2, y: G.T.H / 2, text: '¡La Bruma se cierra!', t: 0, color: '#c9b8ff', big: true, screen: true });
      if (e.type === 'embReady' && G.mages[e.who] && !G.mages[e.who].ctrl) G.pops.push({ x: e.x, y: e.y - 80, text: '¡Embrujo listo!', t: 0, color: '#ffe9a0', small: true });
    }
    while (G.pops.length > 7) G.pops.shift();
  }

  /* ---------- cámara: encuadra a los dos ---------- */
  function camTarget() {
    if (G.koCam && G.time < G.koCam.until && !G.attract) { const T = G.T, unit = Math.min(sw / 1280, sh / 720), z = 1.25 * Math.max(unit, 0.6), hw = sw / 2 / z, hh = sh / 2 / z; return { x: T.W < hw * 2 ? T.W / 2 : clamp(G.koCam.x, hw, T.W - hw), y: T.H < hh * 2 ? T.H / 2 : clamp(G.koCam.y - 30, hh, T.H - hh), z }; }
    const T = G.T, live = G.mages.filter(m => m.alive), list = live.length ? live : G.mages;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const m of list) { x0 = Math.min(x0, m.x); x1 = Math.max(x1, m.x); y0 = Math.min(y0, m.y - 30); y1 = Math.max(y1, m.y); }
    const ins = getInsets();
    const vh = sh - ins.top - ins.bottom, padX = 260, padY = 190;
    const zFit = Math.min(sw / (x1 - x0 + padX * 2), vh / (y1 - y0 + padY * 2));
    const unit = Math.min(sw / 1280, sh / 720), zAll = Math.max(Math.min(sw / T.W, vh / T.H), G.mode === 'camp' ? 0.5 * unit : 0);
    const zMax = Math.max(zAll, (matchMedia('(pointer: coarse)').matches ? 1.25 : 1.05) * Math.max(unit, 0.55));
    let z = clamp(zFit, zAll, zMax);
    let cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + (ins.top - ins.bottom) / 2 / z;
    const hw = sw / 2 / z, hh = vh / 2 / z;
    cx = T.W < hw * 2 ? T.W / 2 : clamp(cx, hw, T.W - hw);
    cy = T.H < hh * 2 ? T.H / 2 : clamp(cy, hh, T.H - hh);
    cy -= (ins.top - ins.bottom) / 2 / z;
    return { x: cx, y: cy, z };
  }
  function snapCamera() { const t = camTarget(); cam.x = t.x; cam.y = t.y; cam.z = t.z; }
  function updateCamera(dt) {
    const t = camTarget(), k = 1 - Math.exp(-dt * 3.2);
    cam.x += (t.x - cam.x) * k; cam.y += (t.y - cam.y) * k; cam.z += (t.z - cam.z) * (1 - Math.exp(-dt * 2.2));
    cam.shake *= Math.exp(-dt * 7); if (cam.shake < 0.3) cam.shake = 0;
    cam.sx = (Math.random() - 0.5) * cam.shake; cam.sy = (Math.random() - 0.5) * cam.shake;
  }

  /* ---------- bucle ---------- */
  let last = performance.now(), acc = 0, fpsT = 0, fpsN = 0, fps = 60;
  function advance(t) { let n = Math.round(t / DT); while (n-- > 0) step(DT); }
  function frame(now) {
    let dt = Math.min(0.1, (now - last) / 1000); last = now;
    fpsT += dt; fpsN++; if (fpsT > 1) { fps = fpsN / fpsT; fpsT = 0; fpsN = 0; }
    watchPerf(dt);
    if (!G.paused && G.T) {
      G.slowK = G.slow > 0 ? 0.3 : 1; if (G.slow > 0) G.slow -= dt;
      if (G.hitStop > 0) G.hitStop -= dt; else acc += dt * G.slowK; let n = 0;
      while (acc >= DT && n < 10) { step(DT); acc -= DT; n++; }
      if (n >= 10) acc = 0;
      FX.update(G, dt);
      for (const p of G.pops) p.t += dt; if (G.granFx) G.granFx.t += dt; G.pops = G.pops.filter(p => p.t < (p.big ? 1.6 : 1.1));
      if (G.banner) G.banner.t += dt;
      updateCamera(dt);
    }
    if (G.T) Art.render(G, ctx, cam, sw, sh, dpr);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return { G, cam, cfg, start, startAttract, endRound, revive, advance, step, results, setQuality, snapCamera, rematch: () => start(G.mode, G.players, lastOver),
    skipIntro() { if (G.state === 'count' && G.introT > 0 && G.introT < (G.introMax || 2.7) - 0.5) G.introT = 0.25; },
    set onMatchEnd(f) { onMatchEnd = f; }, get onMatchEnd() { return onMatchEnd; }, get perf() { return perf; }, get quality() { return quality; }, get fps() { return fps; }, get screen() { return { sw, sh, dpr }; }, who };
})();
