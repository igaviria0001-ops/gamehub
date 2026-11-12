/* =========================================================================
   LA PARTIDA — estado, pasos fijos de física, rondas, cámara de cine y HUD.
   Modos: 'duel' (al mejor de 5 rondas) y 'free' (práctica: al caer, vuelves).
   ========================================================================= */
const Game = (() => {
  const DT = 1 / 120;
  const G = {
    state: 'attract', mode: 'free', world: null, birds: [], bots: [null, null], time: 0, events: [], rng: makeRng(1),
    players: 2, paused: false, hintT: 0, canFight: false, cratesOn: true, freeze: false,
    round: 1, wins: [0, 0], winsNeeded: 3, roundT: 90, stateT: 0, timeScale: 1, slowT: 0, cine: 0, cineTarget: 0, focus: null,
    banner: null, roundWinner: -1, respawn: [0, 0], botLevel: Store.get('botLevel', 1), camTop: 0,
    bullets: [], missiles: [], flares: [], crates: [], chutes: [], targets: [],
  };
  const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
  let dpr = 1, sw = 1, sh = 1, acc = 0, last = 0, quality = Store.get('quality', 'alta');
  const cam = { x: 1400, y: 1100, z: 0.4 };
  const cfg = { species: Store.get('species', ['guacamaya', 'condor']), looks: Store.get('looks', [0, 0]), arena: Store.get('arena', 'medellin'), mode: Store.get('mode', 'duel') };
  if (!MODES[cfg.mode]) cfg.mode = 'duel';
  if (cfg.arena !== 'azar' && !ARENAS[cfg.arena]) cfg.arena = 'medellin';
  if (!SPECIES[cfg.species[0]]) cfg.species = ['guacamaya', 'condor'];
  let onMatchEnd = null, onSchoolEnd = null, attractN = 0;

  function resize() {
    sw = Math.max(1, innerWidth); sh = Math.max(1, innerHeight);
    // en celular no hace falta más de 2× (la diferencia no se ve y cuesta mucho dibujar)
    dpr = Math.min(window.devicePixelRatio || 1, quality === 'ligera' ? 1.5 : (Touch.enabled ? 2 : 3));
    LOWFX = quality === 'ligera';
    cv.width = Math.round(sw * dpr); cv.height = Math.round(sh * dpr);
    cv.style.width = sw + 'px'; cv.style.height = sh + 'px';
  }
  addEventListener('resize', resize);
  resize();

  function setup(opts) {
    G.world = World.build(opts.arena || 'cocora');
    G.time = 0; G.events = []; G.rng = makeRng(opts.seed || 1); G.paused = false;
    G.birds = [0, 1].map(i => new Bird(i, opts.species[i], opts.looks[i]));
    G.birds.forEach(b => { b.G = G; });
    G.bots = [null, null]; G.targets = []; G.boss = null;
    FX.clear();
  }
  function placeBirds() {
    // salen de espaldas desde el centro (como en un entrenamiento de combate): hay que dar la vuelta para pelear
    const W = G.world, xs = [W.w * 0.42, W.w * 0.58];
    G.birds.forEach((b, i) => {
      const keep = b.stats;
      b.reset(xs[i], World.safeY(W, xs[i], 820), i === 0 ? -1 : 1); b.G = G;
      if (keep) b.stats = keep;
    });
    World.resetRound(W); Combat.reset(G);
  }
  function startRound() {
    placeBirds();
    G.state = 'countdown'; G.stateT = 0; G.freeze = true; G.canFight = false; G.roundT = 90;
    G.cineTarget = 0; G.focus = null; G.timeScale = 1; G.slowT = 0; G.banner = null; G.roundWinner = -1;
    snapCamera();
  }
  function startAttract() {
    attractN = (attractN + 1) % ARENA_ORDER.length;
    setup({ species: ['guacamaya', 'condor'], looks: [0, 0], seed: 7, arena: cfg.arena === 'azar' ? ARENA_ORDER[attractN] : cfg.arena });
    G.state = 'attract'; G.mode = 'free'; G.players = 0;
    placeBirds(); G.freeze = false; G.canFight = true; G.cratesOn = true;
    G.bots = [new Bot(G.birds[0], 11, 1), new Bot(G.birds[1], 29, 1)];
    snapCamera();
  }
  // modo: 'duel' | 'free' | …; players: 2 (dos personas) o 1 (contra la máquina)
  // over: etapa de la Travesía (escenario, nivel de la máquina y rondas propios, sin tocar lo guardado)
  let lastOver = null;
  function start(mode, players, over) {
    lastOver = over || null;
    G.players = players; G.mode = mode;
    const seed = (Date.now() & 0xffff) || 1;
    G.arena = over && over.arena ? over.arena : cfg.arena === 'azar' ? ARENA_ORDER[seed % ARENA_ORDER.length] : cfg.arena;
    setup({ species: cfg.species, looks: cfg.looks, seed, arena: G.arena });
    const lvl = over && over.level != null ? over.level : G.botLevel;
    G.trav = over && over.id ? over.id : null; G.playT = 0; G.lvl = lvl; G.copa = over && over.copa ? over.copa : null;
    // Travesía para dos: G.duo; en las etapas «juntos» (Blancos) G.coop con la meta entre los dos
    G.duo = !!(over && over.duo); G.coop = !!(over && over.duo && over.coop); G.coopGoal = G.coop ? over.coop : null; G.tm = null;
    applyAdv();
    G.wins = [0, 0]; G.round = 1; G.cratesOn = true; G.winsNeeded = mode === 'duel' ? (over && over.wins || 3) : 1; G.score = [0, 0]; G.coopWin = false;
    if (players === 1) G.bots[1] = new Bot(G.birds[1], 5, lvl);
    G.hintT = 10;
    if (mode === 'duel') startRound();
    else if (mode === 'targets' || mode === 'case' || mode === 'race') { startRound(); Modes.setup(G); G.cratesOn = mode === 'case'; snapCamera(); }
    else if (mode === 'boss') {
      // en solitario, la máquina vuela de compañera
      if (players === 1) G.bots[1] = new Bot(G.birds[1], 5, Math.max(1, lvl));
      startRound(); Boss.setup(G, over && over.hard); G.roundT = 999;
    }
    else if (Team.is(mode)) {
      // desafíos en equipo de la Travesía para dos
      startRound(); Team.setup(G, (over && over.tcfg) || {}); G.cratesOn = mode !== 'relay'; snapCamera();
    }
    else if (mode === 'school') {
      // escuela de vuelo: solo, sin rival ni cajas; el segundo piloto queda fuera de juego
      G.bots[1] = null; placeBirds(); G.cratesOn = false;
      const W = G.world, x = W.w * 0.3; G.birds[0].reset(x, World.safeY(W, x, 760), 1); G.birds[0].G = G;
      G.birds[1].alive = false; G.birds[1].x = -9999;
      G.state = 'play'; G.freeze = false; G.canFight = true; G.hintT = 0; School.begin(G); snapCamera();
    }
    else { placeBirds(); G.state = 'play'; G.freeze = false; G.canFight = true; snapCamera(); }
  }

  /* ---------- un paso de física ---------- */
  function readPlayer(i) {
    if (G.players === 0) return emptyInput();
    const a = Input.read(i);
    if (G.players !== 1 || i !== 0) return a;
    // jugando solo, sirven las teclas de los dos lados
    const b = Input.read(1), o = Object.assign({}, a);
    for (const k of ACTIONS) o[k] = a[k] || b[k];
    if (!a.dx && !a.dy) { o.dx = b.dx; o.dy = b.dy; }
    if (!a.roll && b.roll) { o.roll = true; o.rdx = b.rdx; o.rdy = b.rdy; }
    return o;
  }
  function step(dt) {
    if (Touch.enabled) Touch.tick();
    G.time += dt;
    if (G.state === 'play') G.playT = (G.playT || 0) + dt;
    World.step(G.world, dt);
    if (!G.freeze) { Weather.step(G, dt); Coast.step(G, dt); }
    const inputs = G.birds.map((b, i) => G.bots[i] ? G.bots[i].think(dt, G) : (G.state === 'play' || G.state === 'roundEnd' ? readPlayer(i) : emptyInput()));
    if (!G.freeze) {
      G.birds.forEach((b, i) => b.step(dt, inputs[i], G));
      Combat.step(G, dt, inputs);
      if (G.mode === 'school') School.update(G, dt);
    } else G.birds.forEach(b => { b.G = G; b.flapPh += dt * 12; });
    handleEvents();
    if (G.state === 'play' && (G.mode === 'targets' || G.mode === 'case' || G.mode === 'race')) { G.roundT -= dt; Modes.update(G, dt); }
    if (G.state === 'play' && G.tm) { G.roundT -= dt; Team.update(G, dt); }
    if (G.mode === 'boss' && G.boss && (G.state === 'play' || G.state === 'roundEnd')) {
      Boss.update(G, dt);
      if (G.state === 'play' && G.boss.dead && G.boss.fallT > 3) endMode(0, false);
    }
    if (G.state === 'play' && G.mode === 'duel') {
      G.roundT -= dt;
      if (G.roundT <= 0) {
        const k = G.birds.map(b => b.hp / b.sp.hp);
        endRound(k[0] > k[1] + 0.001 ? 0 : k[1] > k[0] + 0.001 ? 1 : -1, true);
      }
    }
    // práctica y título: el derribado vuelve a los 2,5 s
    if ((G.mode === 'free' || G.mode === 'school' || G.mode === 'targets' || G.mode === 'case' || G.mode === 'race' || G.mode === 'boss' || G.tm) && (G.state === 'play' || G.state === 'attract')) {
      G.birds.forEach((b, i) => {
        if (b.alive || (G.mode === 'school' && i === 1)) return;
        G.respawn[i] += dt;
        if (G.respawn[i] > 2.5) {
          G.respawn[i] = 0;
          const W = G.world, keep = b.stats;
          const tp = G.tm ? Team.respawnPos(G, i) : null;
          if (tp) { b.reset(tp.x, tp.y, tp.f); b.px = tp.x; b.py = tp.y; }
          else if (G.mode === 'race' && G.gates) { const p = Modes.respawnPos(G, i); b.reset(p.x, p.y, p.f); b.px = p.x; b.py = p.y; }
          else { const x = i === 0 ? W.w * 0.2 : W.w * 0.8; b.reset(x, World.safeY(W, x, 800), i === 0 ? 1 : -1); }
          b.G = G; b.stats = keep;
          // dos segundos de escudo al volver: que no lo tumben apenas aparece
          if (G.mode !== 'school') b.shield = 2;
          G.chutes = G.chutes.filter(p => p.id !== i);
        }
      });
    }
  }
  let sndT = {};
  function handleEvents() {
    const quiet = G.state === 'attract';
    for (const e of G.events) {
      FX.event(e, G);
      Style.event(G, e);
      Progress.event(G, e);
      if (e.type === 'achievement') G.toast = { name: e.name, t: 0 };
      if (G.mode === 'school') School.event(G, e);
      if (G.mode === 'targets' || G.mode === 'case' || G.mode === 'race') Modes.event(G, e);
      if (G.tm) Team.event(G, e);
      if (e.type === 'modeEnd') endMode(e.winner, e.timeUp);
      if (e.type === 'schoolDone' && onSchoolEnd) setTimeout(() => onSchoolEnd(), 2600);
      if (e.type === 'down' && G.mode === 'boss' && G.state === 'play' && !G.bots[e.b.id]) {
        // vidas compartidas (la compañera de la máquina no gasta vidas)
        G.lives--; if (G.lives <= 0) { G.lives = 0; endMode(-1, false); }
      }
      if (e.type === 'down') {
        Combat.eject(G, e.b);
        if (!quiet) buzz([60, 40, 120]);
        e.b.stats.downs = (e.b.stats.downs || 0) + 1;
        if (e.from >= 0 && G.birds[e.from]) G.birds[e.from].stats.kills++;
        if (G.mode === 'duel' && G.state === 'play') {
          const other = G.birds[1 - e.b.id];
          endRound(other.alive ? other.id : -1, false, e);
        }
      }
      if (quiet && !['boom', 'down'].includes(e.type)) continue;
      // sonidos (los muy repetidos, con un mínimo de separación)
      const gap = { shot: 0.03, hit: 0.04, whiz: 0.15, skim: 0.15, spark: 0.05, glass: 0.07 }[e.type];
      if (gap) { if ((sndT[e.type] || 0) > G.time) continue; sndT[e.type] = G.time + gap; }
      Sound.play(e.type, e, quiet);
      if (!quiet && Touch.enabled && (e.type === 'hurt' && e.n >= 10)) buzz(35);
    }
    G.events.length = 0;
  }
  function buzz(ms) { if (!Store.get('vibrate', true)) return; try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* nada */ } }

  /* ---------- rondas ---------- */
  function endRound(winner, timeUp, e) {
    if (G.state !== 'play') return;
    G.state = 'roundEnd'; G.stateT = 0; G.roundWinner = winner; G.canFight = false;
    if (winner >= 0) G.wins[winner]++;
    if (!timeUp && e) { G.slowT = 1.4; G.timeScale = 0.28; G.focus = { x: e.b.x, y: e.b.y }; }
    G.cineTarget = 1;
    const W = winner >= 0 ? G.birds[winner] : null;
    G.banner = { t: 0, big: timeUp ? '¡TIEMPO!' : '¡DERRIBADO!', sub: W ? `Ronda para ${who(winner)}` : 'Ronda empatada', color: W ? PLAYER_COLORS[winner].main : '#ffffff', delay: timeUp ? 0 : 0.9 };
    Sound.play(timeUp ? 'timeUp' : 'roundEnd');
  }
  // fin de Blancos o Maletín: una sola «ronda» con su propio letrero
  function endMode(winner, timeUp) {
    if (G.state !== 'play') return;
    G.state = 'roundEnd'; G.stateT = 0; G.roundWinner = winner; G.canFight = false;
    if (winner >= 0) G.wins[winner]++;
    G.cineTarget = 1;
    const sc = (G.mode === 'race' ? 'aros ' : '') + `${Math.floor(G.score[0])} – ${Math.floor(G.score[1])}`;
    if (G.mode === 'boss') {
      const win = winner >= 0, fb = G.boss && G.boss.lastHit;
      G.coopWin = win;
      G.banner = { t: 0, big: win ? '¡DIRIGIBLE DERRIBADO!' : '¡SE ACABARON LAS VIDAS!', sub: win ? `Golpe final: ${who(fb >= 0 ? fb : 0)}` : 'La Sombra sigue en el cielo', color: win ? '#ffd36b' : '#ff8f8f', delay: win ? 0 : 0.4 };
      G.wins = [1, 1];
      Sound.play(win ? 'roundEnd' : 'timeUp');
      return;
    }
    if (G.tm) {
      // desafío en equipo: se gana o se pierde juntos
      const T = G.tm, ok = T.ok;
      G.banner = { t: 0, big: ok ? '¡LO LOGRARON!' : T.why === 'vidas' ? '¡SIN VIDAS!' : '¡SE ACABÓ EL TIEMPO!', sub: Team.summary(G), color: ok ? '#9dff9a' : '#ff8f8f', delay: 0 };
      G.wins = [1, 1]; G.coopWin = ok;
      Sound.play(ok ? 'roundEnd' : 'timeUp');
      return;
    }
    if (G.coop) {
      // Blancos juntos: se gana o se pierde en equipo
      const tot = Math.floor(G.score[0] + G.score[1]), ok = tot >= G.coopGoal[0];
      G.banner = { t: 0, big: ok ? '¡LO LOGRARON!' : '¡TIEMPO!', sub: `Entre los dos: ${tot} puntos · meta ${G.coopGoal[0]}`, color: ok ? '#9dff9a' : '#ff8f8f', delay: 0 };
      G.wins = [1, 1]; G.coopWin = ok;
      Sound.play(ok ? 'roundEnd' : 'timeUp');
      return;
    }
    G.banner = { t: 0, big: timeUp ? '¡TIEMPO!' : G.mode === 'race' ? '¡PRIMERO EN LA META!' : '¡MALETÍN ENTREGADO!', sub: winner >= 0 ? `Gana ${who(winner)} · ${sc}` : `Empate · ${sc}`, color: winner >= 0 ? PLAYER_COLORS[winner].main : '#ffffff', delay: 0 };
    if (winner < 0) G.wins = [1, 1];
    Sound.play(timeUp ? 'timeUp' : 'roundEnd');
  }
  function who(i) { const b = G.birds[i]; return G.players === 1 && i === 1 ? (G.mode === 'boss' ? `la compañera (${b.sp.name})` : `la máquina (${b.sp.name})`) : `J${i + 1} · ${b.sp.name}`; }
  function updateRounds(realDt) {
    if (G.state === 'countdown') {
      G.stateT += realDt;
      if (G.stateT >= 2.4) { G.state = 'play'; G.freeze = false; G.canFight = true; G.stateT = 0; Sound.play('go'); }
    } else if (G.state === 'roundEnd') {
      G.stateT += realDt;
      if (G.banner) G.banner.t += realDt;
      if (G.slowT > 0) { G.slowT -= realDt; if (G.slowT <= 0) { G.timeScale = 1; G.focus = null; } }
      if (G.stateT > 4.2) {
        if (G.wins.some(w => w >= G.winsNeeded)) {
          G.state = 'matchEnd'; G.stateT = 0; G.cineTarget = 0; G.banner = null;
          // el ganador da una vuelta de honor mientras se ven los resultados
          const R = results(); Progress.matchEnd(G, R);
          G.birds.forEach((b, i) => { if (b.alive) G.bots[i] = new Bot(b, 77 + i, 1); });
          if (onMatchEnd) onMatchEnd(R);
        }
        else { G.round++; startRound(); }
      }
    }
    G.cine += (G.cineTarget - G.cine) * Math.min(1, realDt * 4);
  }
  function results() {
    const w = G.wins[0] > G.wins[1] ? 0 : 1;
    return { winner: G.mode !== 'duel' && G.score[0] === G.score[1] ? -1 : G.mode !== 'duel' ? (G.score[0] > G.score[1] ? 0 : 1) : w, wins: G.wins.slice(), names: [who(0), who(1)], stats: G.birds.map(b => Object.assign({}, b.stats)), vsBot: G.players === 1, mode: G.mode, score: (G.score || [0, 0]).map(Math.floor), coopWin: !!G.coopWin, bossDmg: G.boss ? G.boss.dmg.map(Math.round) : null, hp: G.birds.map(b => (b.alive ? b.hp / b.sp.hp : 0)), lives: G.lives, playT: G.playT, trav: G.trav, lvl: G.lvl, duo: !!G.duo, coop: !!G.coop, tm: G.tm ? { ok: G.tm.ok, stars: G.tm.stars, kind: G.tm.kind, summary: Team.summary(G) } : null };
  }

  /* ---------- cámara: los dos a la vista; en un derribo, cámara lenta y de cerca ---------- */
  function snapCamera() { updateCamera(0, true); }
  function updateCamera(dt, snap) {
    const W = G.world, B = G.birds;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const pts = [];
    // en la Carrera contra la máquina, la cámara es tuya: te sigue a ti mirando hacia tu próximo aro
    const solo = G.mode === 'race' && G.players === 1 && G.gates && G.state !== 'attract' && B[0].alive;
    for (const b of B) { if (b.alive && !(solo && b.id === 1)) { pts.push([b.x, b.y], [b.x + b.vx * 0.25, b.y + b.vy * 0.2]); } }
    if (solo) { const g = Modes.nextGate(G, 0); if (Math.hypot(g.x - B[0].x, g.y - B[0].y) < 900) pts.push([g.x, g.y]); else pts.push([B[0].x + B[0].vx * 0.5, B[0].y + B[0].vy * 0.4]); }
    for (const p of G.chutes) pts.push([p.x, p.y]);
    if (G.boss && !G.boss.dead && G.state !== 'attract') pts.push([G.boss.x - 260, G.boss.y - Boss.RY - 170], [G.boss.x + 260, G.boss.y + Boss.RY + 60]);
    if (!pts.length) pts.push([cam.x, cam.y]);
    for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const mx = 260, my = 190;
    // la franja de arriba la ocupan los paneles: la acción se encuadra debajo de ellos
    const hudTop = G.state === 'attract' ? 0 : (Touch.enabled ? 100 : 88) * hudUnit();
    const zMax = Math.min(sw / 900, sh / 560), zMin = Math.min(sw / W.w, sh / 1500);
    let tz = Math.min(sw / (x1 - x0 + 2 * mx), (sh - hudTop * 0.8) / (y1 - y0 + 2 * my));
    tz = clamp(tz, zMin, Math.max(zMin, zMax));
    let tx = (x0 + x1) / 2, ty = (y0 + y1) / 2 - hudTop * 0.4 / tz;
    // en celular: que ningún piloto quede debajo de los controles (abajo a los lados, bajo los pulgares): sube la acción lo que haga falta
    if (Touch.enabled && G.state !== 'attract') {
      const I = Touch.insets();
      if (I) {
        const lowTop = I.top - 18, hudBot = hudTop + 10;
        let need = 0, room = Infinity;
        for (const b of B) {
          if (!b.alive) continue;
          const sx = sw / 2 + (b.x - tx) * tz, sy = sh / 2 + (b.y - ty) * tz;
          room = Math.min(room, sy - hudBot);
          if (sy > lowTop && (sx < I.l + 12 || sx > sw - I.r - 12)) need = Math.max(need, sy - lowTop);
        }
        ty += Math.max(0, Math.min(need, room)) / tz;
      }
    }
    if (G.focus) { tz = Math.max(zMin, zMax) * 1.25; tx = G.focus.x; ty = G.focus.y; }
    const k = snap ? 1 : 1 - Math.exp(-(tz < cam.z ? 4 : 1.8) * dt);
    cam.z += (tz - cam.z) * k;
    const hw = sw / 2 / cam.z, hh = sh / 2 / cam.z;
    tx = clamp(tx, hw, Math.max(hw, W.w - hw));
    ty = Math.min(ty, W.groundY(tx) + 260 - hh); ty = Math.max(ty, W.ceil - 270 + hh);
    const kp = snap ? 1 : 1 - Math.exp(-(G.focus ? 3 : 5) * dt);
    cam.x += (tx - cam.x) * kp; cam.y += (ty - cam.y) * kp;
    G.camTop = cam.y - hh;
  }

  /* ---------- dibujo ---------- */
  // en celular el HUD va un poco más grande (las pantallas son chicas y los textos tienen que leerse)
  function hudUnit() { return Touch.enabled ? clamp(Math.min(sh / 330, sw / 740), 0.92, 2.1) : clamp(Math.min(sh / 400, sw / 860), 0.8, 2.1); }
  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ArtPilot.setGame(G);
    ArtWorld.drawBackground(ctx, G, cam, sw, sh);
    const sk = FX.shake, ox = sk ? (Math.random() - 0.5) * sk : 0, oy = sk ? (Math.random() - 0.5) * sk : 0;
    ctx.save();
    ctx.translate(sw / 2 + ox, sh / 2 + oy); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
    FX.draw(ctx, 'back');
    ArtWorld.drawStage(ctx, G, cam, sw, sh);
    // de lejos (zoom chico, celular) los pilotos y proyectiles se dibujan más grandes para que se lean
    const vs = G.vs = clamp(Math.pow(0.92 / cam.z, 0.62), 1, 1.95);
    G.birds.forEach((b, i) => ArtPilot.drawTrail(ctx, b, G.time, PLAYER_COLORS[i], vs));
    Weather.drawWorld(ctx, G);
    Coast.drawWorld(ctx, G);
    FX.drawCombat(ctx, G);
    if (G.mode === 'school' || G.mode === 'targets') School.draw(ctx, G);
    if (G.mode === 'case' || G.mode === 'race') Modes.draw(ctx, G);
    if (G.tm) Team.draw(ctx, G);
    if (G.mode === 'boss') Boss.draw(ctx, G);
    G.birds.forEach((b, i) => { if (b.alive) ArtPilot.draw(ctx, b, G.time, PLAYER_COLORS[i], vs); });
    { const u = hudUnit(), band = G.state === 'attract' ? 0 : Math.max(92 * u, Touch.enabled ? 60 + 52 * u : 60 * u) + 26 * u; FX.draw(ctx, 'front', u / cam.z, G.camTop + band / cam.z); }
    if (G.state !== 'attract') drawWarnings();
    ArtWorld.drawLowFog(ctx, G, cam, sw, sh);
    ctx.restore();
    Post.apply(ctx, G, cam, sw, sh, dpr);
    if (FX.flash > 0) { ctx.fillStyle = `rgba(255,240,220,${FX.flash * 0.5})`; ctx.fillRect(0, 0, sw, sh); }
    if (G.cine > 0.01) { const h = sh * 0.11 * G.cine; ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, sw, h); ctx.fillRect(0, sh - h, sw, h); }
    Weather.drawScreen(ctx, G, cam, sw, sh);
    Coast.drawScreen(ctx, G, cam, sw, sh);
    if (G.mode === 'school' && G.state !== 'attract') School.drawPointer(ctx, G, cam, sw, sh);
    if ((G.mode === 'case' || G.mode === 'race') && G.state !== 'attract') Modes.drawPointer(ctx, G, cam, sw, sh);
    if (G.tm && G.state !== 'attract') Team.drawPointer(ctx, G, cam, sw, sh);
    if (G.state !== 'attract' && G.state !== 'menu') drawHUD();
  }
  // avisos en el mundo: misil que te persigue (anillo rojo y flecha) y cajas que caen fuera de la vista
  function drawWarnings() {
    // mira de fijado: los corchetes se cierran sobre el blanco mientras se fija el misil
    for (const b of G.birds) {
      const T = b.lockTgt;
      if (!b.alive || b.missiles <= 0 || b.lockT < 0.04 || !T || !T.alive) continue;
      const k = clamp(b.lockT / Combat.MIS.lock, 0, 1), vs = G.vs || 1, R = lerp(84, 40, k) * vs, pc = PLAYER_COLORS[b.id];
      ctx.save(); ctx.translate(T.x, T.y); ctx.rotate((1 - k) * Math.PI / 2);
      ctx.strokeStyle = b.locked ? pc.main : `rgba(${pc.glow},${0.35 + 0.5 * k})`; ctx.lineWidth = (b.locked ? 3 : 2) / Math.max(0.5, cam.z); ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(R, R * 0.45); ctx.lineTo(R, R); ctx.lineTo(R * 0.45, R); ctx.stroke(); }
      ctx.restore();
      if (b.locked && Math.sin(G.time * 18) > -0.3) {
        ctx.save(); ctx.font = font(Math.round(12 * hudUnit() / cam.z)); ctx.textAlign = 'center'; ctx.fillStyle = pc.main;
        ctx.lineWidth = 3 / Math.max(0.5, cam.z); ctx.strokeStyle = 'rgba(20,10,40,0.6)'; ctx.strokeText('FIJADO', T.x, T.y + R + 16 / cam.z); ctx.fillText('FIJADO', T.x, T.y + R + 16 / cam.z); ctx.restore();
      }
    }
    for (const b of G.birds) {
      if (!b.alive) continue;
      const th = Combat.threat(G, b); if (!th) continue;
      const blink = Math.sin(G.time * (th.d < 350 ? 30 : 16)) > 0;
      const R = 50 * b.sp.size * (G.vs || 1);
      ctx.save();
      ctx.strokeStyle = blink ? 'rgba(255,70,60,0.95)' : 'rgba(255,70,60,0.4)'; ctx.lineWidth = 3 / Math.max(0.4, cam.z);
      ctx.beginPath(); ctx.arc(b.x, b.y, R, 0, TAU); ctx.stroke();
      const a = Math.atan2(th.m.y - b.y, th.m.x - b.x);
      ctx.translate(b.x + Math.cos(a) * (R + 14), b.y + Math.sin(a) * (R + 14)); ctx.rotate(a);
      ctx.fillStyle = 'rgba(255,70,60,0.95)'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -8); ctx.lineTo(-6, 8); ctx.closePath(); ctx.fill();
      ctx.restore();
      if (blink) { ctx.save(); ctx.font = font(Math.round(15 * hudUnit() / cam.z)); ctx.textAlign = 'center'; ctx.lineWidth = 4 / Math.max(0.5, cam.z); ctx.strokeStyle = 'rgba(40,0,0,0.6)'; ctx.strokeText('¡MISIL!', b.x, b.y - R - 12); ctx.fillStyle = '#ff5a4e'; ctx.fillText('¡MISIL!', b.x, b.y - R - 12); ctx.restore(); }
    }
  }
  function glass(x, y, w, h, r) {
    ctx.save();
    ctx.fillStyle = 'rgba(20,16,48,0.28)'; ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.2;
    ctx.shadowColor = 'rgba(10,6,30,0.3)'; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
    ctx.restore();
  }
  function bar(x, y, w, h, k, col, right, bg = 'rgba(255,255,255,0.16)') {
    ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
    const fw = Math.max(0, w * clamp(k, 0, 1));
    if (fw > 0.5) { ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(right ? x + w - fw : x, y, fw, h, h / 2); ctx.fill(); }
  }
  function missileIcon(x, y, s, on, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = on ? 1 : 0.25;
    ctx.fillStyle = '#eef1f6'; ctx.beginPath(); ctx.roundRect(-6, -2, 11, 4, 2); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(5, -2); ctx.lineTo(8.5, 0); ctx.lineTo(5, 2); ctx.fill();
    ctx.fillStyle = '#9aa3b2'; ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(-8, -4.5); ctx.lineTo(-3, -2); ctx.moveTo(-6, 2); ctx.lineTo(-8, 4.5); ctx.lineTo(-3, 2); ctx.fill();
    ctx.restore();
  }
  function drawHUD() {
    const u = hudUnit(), pad = 10 * u;
    if (G.mode === 'school') School.drawHUD(ctx, G, sw, sh, u, glass);
    for (let i = 0; i < 2; i++) {
      if (G.mode === 'school' && i === 1) continue;
      const b = G.birds[i], pc = PLAYER_COLORS[i], w = 214 * u, h = 82 * u;
      const right = i === 1, x = right ? sw - pad - w : pad, y = pad;
      glass(x, y, w, h, 14 * u);
      ctx.save();
      const inX = right ? x + w - 14 * u : x + 14 * u, dir = right ? -1 : 1;
      ctx.textAlign = right ? 'right' : 'left'; ctx.fillStyle = '#ffffff'; ctx.font = font(Math.max(12, 14 * u));
      ctx.shadowColor = 'rgba(10,6,30,0.5)'; ctx.shadowBlur = 4;
      const name = G.players === 1 && i === 1 ? `${G.mode === 'boss' ? 'Compañera' : 'Máquina'} · ${b.sp.name}` : `J${i + 1} · ${b.sp.name}`;
      ctx.fillText(name, inX, y + 20 * u); ctx.shadowBlur = 0;
      const av = G.adv ? G.adv[i] : 0;
      if (av) {
        // escudito de ventaja (uno o dos) al lado del nombre
        const nw = ctx.measureText(name).width;
        for (let k = 0; k < av; k++) {
          const sx = inX + dir * (nw + 10 * u + k * 11 * u), sy = y + 14 * u;
          ctx.fillStyle = '#9dff9a'; ctx.beginPath(); ctx.moveTo(sx - 4.5 * u, sy - 5 * u); ctx.lineTo(sx + 4.5 * u, sy - 5 * u); ctx.lineTo(sx + 4.5 * u, sy); ctx.quadraticCurveTo(sx + 4 * u, sy + 4.5 * u, sx, sy + 6.5 * u); ctx.quadraticCurveTo(sx - 4 * u, sy + 4.5 * u, sx - 4.5 * u, sy); ctx.closePath(); ctx.fill();
        }
      }
      // rondas ganadas
      if (G.mode === 'duel') for (let k = 0; k < G.winsNeeded; k++) {
        const px = right ? x + 16 * u + k * 15 * u : x + w - 16 * u - k * 15 * u;
        ctx.beginPath(); ctx.arc(px, y + 15 * u, 5 * u, 0, TAU);
        if (k < G.wins[i]) { ctx.fillStyle = pc.main; ctx.fill(); } else { ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.4; ctx.stroke(); }
      }
      // blindaje
      const bw = w - 28 * u, bx = x + 14 * u, hpK = b.hp / b.sp.hp;
      const hpCol = hpK > 0.5 ? pc.main : hpK > 0.25 ? '#ffb347' : '#ff5a4e';
      bar(bx, y + 28 * u, bw, 11 * u, hpK, b.hitT > 0 ? '#ffffff' : b.regen && Math.sin(G.time * 7) > 0 ? '#a8ffc4' : hpCol, right);
      // adrenalina (o el tiempo que queda de modo leyenda)
      const leg = b.legendT > 0;
      bar(bx, y + 42 * u, bw, 4.5 * u, leg ? b.legendT / 7 : b.adren, leg ? (Math.sin(G.time * 14) > 0 ? '#ffe27a' : '#ffb830') : '#ffd36b', right, 'rgba(255,255,255,0.1)');
      // turbo y calor
      const half = (bw - 8 * u) / 2;
      bar(right ? bx + half + 8 * u : bx, y + 52 * u, half, 6 * u, b.fuel, b.fuelLock ? 'rgba(255,255,255,0.35)' : '#7fe3ff', right);
      bar(right ? bx : bx + half + 8 * u, y + 52 * u, half, 6 * u, b.heat, b.overheat ? (Math.sin(G.time * 20) > 0 ? '#ff5a4e' : '#ffb347') : '#ffb36b', right);
      ctx.font = font(Math.max(10, 9.5 * u)); ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.textAlign = 'left'; ctx.fillText(right ? 'calor' : 'turbo', bx, y + 67 * u);
      ctx.textAlign = 'right'; ctx.fillText(right ? 'turbo' : 'calor', bx + bw, y + 67 * u);
      if (leg) { ctx.textAlign = 'center'; ctx.fillStyle = '#ffd36b'; ctx.fillText('MODO LEYENDA', bx + bw / 2, y + 67 * u); }
      // misiles y bengalas
      for (let k = 0; k < 4; k++) missileIcon(inX + dir * (12 * u + k * 20 * u), y + 75 * u, 1.1 * u, k < b.missiles, pc.main);
      // bengalas (salen solas cuando un misil fijado va a pegar): estrellitas que laten si te persiguen
      { const hunted = G.missiles.some(m => m.target === b), pz = hunted && b.flares > 0 ? 1 + 0.35 * Math.abs(Math.sin(G.time * 10)) : 1; for (let k = 0; k < 3; k++) { const fx = inX + dir * (96 * u + k * 13 * u), fy = y + 75 * u, on = k < b.flares, r = 4.4 * u * (on ? pz : 0.8); ctx.save(); ctx.translate(fx, fy); ctx.rotate(G.time * (on ? 1.5 : 0)); ctx.fillStyle = on ? '#ffe08a' : 'rgba(255,255,255,0.16)'; ctx.beginPath(); for (let q = 0; q < 8; q++) { const a = q / 8 * TAU, rr = q % 2 ? r * 0.42 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.restore(); } }
      let ix = inX + dir * 136 * u;
      if (b.shield > 0) { ctx.fillStyle = '#7fc4ff'; ctx.font = font(Math.max(10, 11 * u)); ctx.textAlign = right ? 'right' : 'left'; ctx.fillText(`escudo ${Math.ceil(b.shield)}`, ix, y + 79 * u); ix += dir * 62 * u; }
      if (b.rapid > 0) { ctx.fillStyle = '#ffe36b'; ctx.font = font(Math.max(10, 11 * u)); ctx.textAlign = right ? 'right' : 'left'; ctx.fillText(`ráfaga ${Math.ceil(b.rapid)}`, ix, y + 79 * u); ix += dir * 62 * u; }
      if (b.rocket > 0) { ctx.fillStyle = '#ff8ae6'; ctx.font = font(Math.max(10, 11 * u)); ctx.textAlign = right ? 'right' : 'left'; ctx.fillText(`cohete ${Math.ceil(b.rocket)}`, ix, y + 79 * u); }
      ctx.restore();
    }
    // centro: ronda y tiempo (en táctil, la pausa va ahí y esto baja un poco)
    ctx.save();
    const lw = 150 * u, lh = 38 * u, ly = Touch.enabled ? pad + 50 : pad;
    if (G.mode === 'school') { /* el panel de la lección ocupa el centro */ }
    else if ((G.mode === 'targets' || G.mode === 'case' || G.mode === 'race') && G.state !== 'countdown') Modes.drawHUD(ctx, G, sw, sh, u, glass);
    else if (G.tm && G.state !== 'countdown') Team.drawHUD(ctx, G, sw, sh, u, glass);
    else if (G.mode === 'boss' && G.state !== 'countdown') Boss.drawHUD(ctx, G, sw, sh, u, glass);
    else if (G.mode === 'duel' && G.state !== 'countdown') {
      glass(sw / 2 - lw / 2, ly, lw, lh, 12 * u);
      ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff'; ctx.font = font(Math.max(11, 12 * u)); ctx.fillText(`Ronda ${G.round}`, sw / 2, ly + 15 * u);
      const t = Math.max(0, Math.ceil(G.roundT)), mm = Math.floor(t / 60), ss = String(t % 60).padStart(2, '0');
      ctx.font = font(Math.max(13, 16 * u)); ctx.fillStyle = t <= 10 && G.state === 'play' ? '#ff8f8f' : '#ffffff'; ctx.fillText(`${mm}:${ss}`, sw / 2, ly + 32 * u);
    } else if (!Touch.enabled && G.mode === 'free') {
      glass(sw / 2 - lw / 2, ly, lw, 32 * u, 12 * u);
      ctx.textAlign = 'center'; ctx.fillStyle = '#ffffff'; ctx.font = font(Math.max(12, 14 * u)); ctx.fillText('Práctica libre', sw / 2, ly + 21 * u);
    }
    ctx.restore();
    // logro desbloqueado: cartel dorado un momento
    if (G.toast) {
      G.toast.t += 1 / 60; const T = G.toast, a = clamp(Math.min(T.t * 4, (3.6 - T.t) * 2), 0, 1);
      if (T.t > 3.6) G.toast = null;
      else {
        ctx.save(); ctx.globalAlpha = a; ctx.font = font(Math.max(13, 15 * u));
        // en celular, debajo del panel del centro (arriba quedaría encima de la lección o del marcador)
        const w = ctx.measureText(T.name).width + 90 * u, x = sw / 2 - w / 2, y = Touch.enabled ? Math.max(sh * 0.2, 64 + 66 * u) : sh * 0.2;
        ctx.fillStyle = 'rgba(40,24,8,0.6)'; ctx.strokeStyle = '#ffd36b'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(x, y, w, 40 * u, 14 * u); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffd36b'; ctx.font = font(Math.max(9, 10 * u)); ctx.textAlign = 'left'; ctx.fillText(T.label || 'LOGRO', x + 14 * u, y + 24 * u);
        ctx.fillStyle = '#ffffff'; ctx.font = font(Math.max(13, 15 * u)); ctx.fillText(T.name, x + 62 * u, y + 25 * u);
        ctx.restore();
      }
    }
    // cuenta regresiva
    if (G.state === 'countdown') {
      const n = 3 - Math.floor(G.stateT / 0.8), f = (G.stateT % 0.8) / 0.8;
      bigText(n > 0 ? String(n) : '¡YA!', sh * 0.42, 1 + (1 - f) * 0.25, '#ffffff', 1 - f * 0.4, 96 * u);
      const A = G.world.def, tag0 = G.mode === 'duel' ? `Ronda ${G.round}` : MODES[G.mode].name;
      const tag = G.copa ? (G.copa.tie ? `Copa · DESEMPATE · ${tag0}` : `Copa · prueba ${G.copa.i + 1} de ${G.copa.n} · ${G.mode === 'duel' && G.round === 1 ? 'Duelo' : tag0}`) : tag0;
      smallText(tag, sh * 0.42 + 64 * u, 22 * u);
      // en la primera ronda, el nombre del escenario como cartel de película
      if (G.round === 1) { const a = clamp(1.6 - G.stateT * 0.55, 0, 1); smallText(`${A.name.toUpperCase()} · ${A.time.toLowerCase()}`, sh * 0.42 + 98 * u, 15 * u, 'rgba(255,240,210,0.9)', a); }
    }
    // letreros de fin de ronda
    if (G.banner && G.banner.t > G.banner.delay) {
      const t = G.banner.t - G.banner.delay, a = clamp(t * 3, 0, 1);
      bigText(G.banner.big, sh * 0.4, 1 + Math.max(0, 0.3 - t), '#ffffff', a, 70 * u);
      if (t > 0.5) smallText(G.banner.sub, sh * 0.4 + 54 * u, 26 * u, G.banner.color, clamp((t - 0.5) * 3, 0, 1));
    }
    // ayuda de teclas
    if (G.hintT > 0 && !Touch.enabled && G.state !== 'attract') {
      const a = clamp(G.hintT, 0, 1);
      ctx.save(); ctx.globalAlpha = a;
      const lines = G.players === 2 ? ['J1: ' + keyHint(0), 'J2: ' + keyHint(1)] : [keyHint(0) + '  (o las de J2)', 'Maniobras distintas llenan la Adrenalina' + (Input.dtap ? ' · doble toque = tonel' : '')];
      let fs = Math.max(12, 14 * u); ctx.font = font(fs);
      let tw = Math.max(...lines.map(l => ctx.measureText(l).width)) + 40 * u;
      if (tw > sw - 24) { fs *= (sw - 24) / tw; ctx.font = font(fs); tw = sw - 24; }
      const lh = fs * 1.45, hh = lines.length * lh + 16 * u, y0 = sh - 20 * u - hh - G.cine * sh * 0.11;
      glass(sw / 2 - tw / 2, y0, tw, hh, 14 * u);
      ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      lines.forEach((l, k) => ctx.fillText(l, sw / 2, y0 + 8 * u + lh * (k + 0.5)));
      ctx.restore();
    }
  }
  function bigText(txt, y, scale, col, alpha, size) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(sw / 2, y); ctx.scale(scale, scale);
    ctx.font = font(Math.round(size)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = size * 0.12; ctx.strokeStyle = 'rgba(15,8,40,0.55)'; ctx.strokeText(txt, 0, 0);
    const g = ctx.createLinearGradient(0, -size / 2, 0, size / 2); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#ffe2a8');
    ctx.fillStyle = col === '#ffffff' ? g : col; ctx.fillText(txt, 0, 0); ctx.restore();
  }
  function smallText(txt, y, size, col = '#ffffff', alpha = 1) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.font = font(Math.round(size)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(15,8,40,0.55)'; ctx.strokeText(txt, sw / 2, y); ctx.fillStyle = col; ctx.fillText(txt, sw / 2, y); ctx.restore();
  }

  /* ---------- bucle ---------- */
  function frame(ts) {
    const now = ts / 1000, fdt = Math.min(0.1, last ? now - last : 0.016); last = now;
    watchPerf(fdt);
    Input.pollPads();
    if (!G.paused && G.world) {
      acc += fdt * G.timeScale;
      while (acc >= DT) { step(DT); acc -= DT; }
      updateRounds(fdt);
      G.hintT = Math.max(0, G.hintT - fdt);
    }
    if (G.world) {
      updateCamera(G.paused ? 0 : fdt, false);
      FX.update(G.paused ? 0 : fdt * G.timeScale, G, cam, sw, sh);
      render();
      Sound.update(G, cam, sw);
    }
    requestAnimationFrame(frame);
  }
  function begin() { startAttract(); requestAnimationFrame(frame); }
  function setQuality(q) { quality = q; Store.set('quality', q); resize(); }
  // si el equipo no da abasto (menos de ~42 cuadros por segundo dos veces seguidas), pasa solo a calidad ligera
  const perf = { t: 0, n: 0, low: 0 };
  function watchPerf(fdt) {
    if (quality !== 'alta' || Store.get('qManual', false) || G.state !== 'play' || G.paused) { perf.t = 0; perf.n = 0; return; }
    perf.t += fdt; perf.n++;
    if (perf.t >= 3) {
      const fps = perf.n / perf.t; perf.t = 0; perf.n = 0;
      perf.low = fps < 42 ? perf.low + 1 : 0;
      if (perf.low >= 2) { setQuality('ligera'); G.toast = { name: 'Calidad ligera para que vaya más fluido', t: 0, label: 'AJUSTE' }; }
    }
  }
  function setArena(id) { cfg.arena = id; Store.set('arena', id); }
  function setMode(id) { cfg.mode = id; Store.set('mode', id); }
  function setSpecies(i, sp, look) { cfg.species[i] = sp; cfg.looks[i] = look; Store.set('species', cfg.species); Store.set('looks', cfg.looks); }
  function setBotLevel(n) { G.botLevel = n; Store.set('botLevel', n); }
  function rematch() { start(G.mode, G.players, lastOver); }
  // ventaja por jugador (para jugar parejo entre amigos de distinto nivel); en la Travesía y la Escuela no cuenta
  function applyAdv() { const A = Store.get('adv', [0, 0]); G.adv = (G.trav && !G.duo) || G.mode === 'school' ? [0, 0] : [A[0] || 0, A[1] || 0]; }

  function advance(dt) { let n = Math.max(1, Math.round(dt / DT)); while (n--) { step(DT); updateRounds(DT); updateCamera(DT); } }
  return { G, cam, cfg, applyAdv, begin, start, advance, startAttract, rematch, setQuality, setSpecies, setArena, setMode, setBotLevel, step, updateCamera, results, set onMatchEnd(fn) { onMatchEnd = fn; }, set onSchoolEnd(fn) { onSchoolEnd = fn; }, get quality() { return quality; }, get screen() { return { sw, sh, dpr }; } };
})();
