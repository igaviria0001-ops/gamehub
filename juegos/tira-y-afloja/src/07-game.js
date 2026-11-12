/* =========================================================================
   JUEGO — reglas, rondas, modos, cámara, dibujo y HUD
   ========================================================================= */
const Game = (() => {
  const DT = 1 / 120;
  const CANECA_SUDDEN = 45, CANECA_MAX = 110;
  const PELLET_COLORS = ['#ffd84d', '#9b6bdf', '#4aa3ff', '#ff9a3c', '#b7dc3c', '#ff6fae'];

  const G = {
    state: 'attract', mode: 'caneca', vsBot: false, botLevel: Store.get('botLevel', 1), winsNeeded: Store.get('wins', 3),
    players: [], rope: null, bots: [null, null], quiet: true,
    t: 0, roundT: 0, stateT: 0, round: 1, wins: [0, 0], points: [0, 0],
    pellets: [], golden: null, goldenNext: 7, goldenIdx: 0, spawnT: 0, spawnIdx: 0, spawnOrder: [], spawnCount: 0,
    timeScale: 1, slowT: 0, hitStop: 0, suddenDeath: false, canControl: false, hudK: 1, train: null,
    cam: { x: 960, y: 540, zoom: 1, tx: 960, ty: 540, tz: 1, focus: null, focusT: 0 },
    acc: 0, respawn: [0, 0], cdMarks: {}, lastWinner: null, hintsT: 0, tickSec: -1,
    onMatchEnd: null, onPick: null, view: { vx: 960, vy: 540, s: 1, hw: 960, hh: 540 },
    arenaId: 'pupitre', arenaMode: 'fixed', attractRounds: 0, lastLoser: null, tutorial: null, jefeId: 'aspiradora',
    countdownLen: 2.9,
    theme: THEMES[Store.get('theme', 'dia')] ? Store.get('theme', 'dia') : 'dia',
    flavors: (() => { const f = Store.get('flavors', ['fresa', 'menta']); return Array.isArray(f) && FLAVORS[f[0]] && FLAVORS[f[1]] && f[0] !== f[1] ? f : ['fresa', 'menta']; })(),
    musicStyle: Store.get('musicStyle', 'arena'), musicLabel: null, randomTrack: null, autoStick: Store.get('autoStick', true), handicap: (() => { const h = Store.get('handicap', [0, 0]); return Array.isArray(h) && h.length === 2 ? h.map(n => clamp(+n || 0, 0, 2)) : [0, 0]; })(), hcK: [1, 1], vibrate: Store.get('vibrate', true),
  };
  // música que trae cada arena (en Opciones se puede fijar un estilo o dejarla al azar)
  const ARENA_MUSIC = { torre: 'arcade', pupitre: 'cumbia', gimnasio: 'surf', laboratorio: 'arcade', cafeteria: 'salsa', arte: 'dembow', biblioteca: 'lofi', bus: 'surf', profe: 'salsa' };
  function pickMusic(atMatchStart) {
    const st = G.musicStyle;
    let id;
    if (G.quiet || G.state === 'attract') id = Sound.Music.ORDER.includes(st) ? st : 'cumbia';
    else if (st === 'random') {
      if (atMatchStart || !G.randomTrack || G.randomArena !== G.arenaId) { G.randomTrack = pick(Sound.Music.ORDER.filter(k => k !== G.randomTrack)); G.randomArena = G.arenaId; }
      id = G.randomTrack;
    } else if (Sound.Music.ORDER.includes(st)) id = st;
    else if ((G.mode === 'campana' || G.mode === 'jefe') && ARENA.L && ARENA.L.room) id = Campaign.ZONES[ARENA.L.room.zone].music;
    else id = ARENA_MUSIC[G.arenaId] || 'cumbia';
    const changed = Sound.Music.setTrack(id);
    if (changed && !G.quiet && Sound.musicOn) G.musicLabel = { text: Sound.Music.name(id), t: 0 };
  }
  function applyFlavors() {
    G.players.forEach((p, i) => { p.col = FLAVORS[G.flavors[i]]; p.name = p.col.name; p.acc = typeof Progress !== 'undefined' && !(G.bots && G.bots[i]) ? Progress.accOf(i) : 'ninguno'; });
  }

  function setArena(id, variant = null) {
    G.arenaId = id;
    if (ARENA.id !== id || (ARENA.variant || null) !== variant) { ARENA.load(id, variant); if (ArenaArt.bg) ArenaArt.rebuild(); }
    Progress.on('arena', { id });
  }
  function randomArena(except) {
    const ids = ARENA_LIST.map(d => d.id).filter(id => id !== except);
    return ids.length ? pick(ids) : ARENA_LIST[0].id;
  }
  function arenaChoices(n, except) {
    const ids = ARENA_LIST.map(d => d.id).filter(id => id !== except);
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    return ids.slice(0, n);
  }

  function init() {
    ARENA.load('pupitre');
    G.players = [new Player(0, FLAVORS[G.flavors[0]]), new Player(1, FLAVORS[G.flavors[1]])];
    applyFlavors();
    G.rope = new Rope();
    startAttract();
  }

  function sfx(name, ...a) { if (!G.quiet) Sound.play(name, ...a); }

  /* ---------------- flujo de partida ---------------- */
  function startAttract() {
    G.state = 'attract'; G.mode = 'caneca'; G.quiet = true; G.vsBot = false; G.fiestaMatch = false;
    G.bots = [new Bot(0, 1), new Bot(1, 1)];
    G.wins = [0, 0]; G.points = [0, 0]; G.round = 1; G.attractRounds = 0;
    G.tutorial = null; G.reto = null; G.train = null;
    resetRound();
    G.state = 'attract'; G.canControl = true; G.stateT = 0;
    Sound.Music.setMode('menu');
    pickMusic(true);
  }

  function startMatch(mode, vsBot, arenaChoice, fiesta = false) {
    if (mode === 'gol') arenaChoice = 'gimnasio'; // la cancha de gol es el gimnasio
    if (mode === 'escalada' || mode === 'fuga') arenaChoice = 'torre'; // la torre solo existe para escalar
    if (mode === 'jefe') { arenaChoice = (Jefes.BY[G.jefeId] || Jefes.LIST[0]).arena; fiesta = false; }
    if (mode === 'campana') { arenaChoice = 'campana'; fiesta = false; }
    if (arenaChoice) G.arenaMode = arenaChoice === 'random' || arenaChoice === 'torneo' ? arenaChoice : 'fixed';
    const first = arenaChoice && ARENA_DEFS[arenaChoice] ? arenaChoice : (G.arenaMode === 'fixed' ? G.arenaId : randomArena(null));
    setArena(first, mode === 'gol' ? 'gol' : mode === 'jefe' ? ((Jefes.BY[G.jefeId] || Jefes.LIST[0]).variant || 'jefe') : mode === 'campana' ? G.campStage : null);
    G.firstArena = first;
    G.mode = mode; G.vsBot = vsBot; G.quiet = false; G.tutorial = null; G.reto = null; G.train = null; G.countdownLen = 2.9; G.fiestaMatch = !!fiesta;
    G.bots = [null, vsBot ? new Bot(1, G.daily ? G.daily.level : G.botLevel) : null];
    applyFlavors();
    G.wins = [0, 0]; G.points = [0, 0]; G.round = 1; G.lastWinner = null;
    G.players.forEach(p => { p.stats = { rams: 0, slings: 0, whips: 0, pellets: 0, dunks: 0, crown: 0, goals: 0, bells: 0 }; });
    G.spawnOrder = shuffledSpots(Date.now() & 0xffff);
    G.hintsT = 9;
    G.randomTrack = null;
    resetRound();
    Sound.Music.setMode('game');
    Progress.on('start');
  }

  function shuffledSpots(seed) {
    const r = mulberry32(seed), arr = ARENA.pelletSpots.map((_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
  }

  function resetRound() {
    const [A, B] = G.players;
    ARENA.reset();
    // modo Fiesta: sorpresa de la ronda (puede cambiar tamaños y largo del hilo)
    const plan = Fiesta.roll(G);
    const sp = ARENA.spawns, mass = plan ? plan.mass : (ARENA.L.mass || 3), len = plan ? plan.len : (ARENA.L.ropeLen || 400);
    let ax = sp[0].x, bx = sp[1].x, ay = sp[0].y, by = sp[1].y;
    if (len < (bx - ax) * 1.05) {
      // hilo cortico: aparecen más cerca, sobre lo que haya debajo
      const c = (ax + bx) / 2; ax = c - len * 0.47; bx = c + len * 0.47;
      ay = Math.min(ay, ARENA.groundBelow(ax, ay - 130)); by = Math.min(by, ARENA.groundBelow(bx, by - 130));
    }
    A.reset(ax, ay, mass); B.reset(bx, by, mass);
    G.rope.reset(A.x, A.y, B.x, B.y, len); G.rope.visible = true;
    G.pellets = []; G.golden = null; G.goldenNext = 7; G.spawnT = 0.6; G.spawnCount = 0;
    G.roundT = 0; G.stateT = 0; G.suddenDeath = false; G.timeScale = 1; G.slowT = 0; G.hitStop = 0;
    G.respawn = [0, 0]; G.cdMarks = {}; G.tickSec = -1; G.ropeCut = false; G.kickoff = false;
    G.rec = []; G.replayMark = 0; G.replay = null;
    G.cam.focus = null;
    Modes.setup(G);
    FX.clear();
    G.state = 'countdown'; G.canControl = false;
    if (!G.quiet) pickMusic(false);
    G.countdownLen = G.tutorial || G.reto || G.train ? G.countdownLen : (Fiesta.cur ? 2.9 + Fiesta.CARD_END - 0.9 : 2.9);
    Sound.Music.setIntensity(0);
  }

  function endMatch(winnerId) {
    G.state = 'matchEnd'; G.stateT = 0; G.canControl = false; G.lastWinner = winnerId;
    if (G.quiet) return;
    Progress.on('match', { winner: winnerId });
    if (G.mode === 'fuga' || G.mode === 'jefe' || G.mode === 'campana') { Sound.silenceLoops(); Sound.Music.setMode('menu'); return; }
    Sound.silenceLoops();
    const w = winnerId === null ? null : G.players[winnerId];
    if (w) {
      FX.banner(`¡${w.name.toUpperCase()} GANA!`, { color: w.col.base, size: 160, life: 3.2, y: 0.38 });
      FX.confetti(w.x, w.y - 300, 140, 1400);
      w.mood = 'happy'; const l = G.players[1 - winnerId]; if (l.alive) l.mood = 'sad';
      sfx('win');
    } else {
      FX.banner('¡EMPATE!', { color: '#ffd84d', size: 160, life: 3.2, y: 0.38 });
    }
    Sound.Music.setMode('menu');
  }

  /* ---------------- actualización ---------------- */
  function update(realDt) {
    G.t += realDt;
    if (G.state === 'replay') { G.stateT += realDt; stateLogic(realDt); FX.update(realDt); return; }
    G.stateT += realDt;
    // cámara lenta / pausa de impacto
    if (G.slowT > 0) { G.slowT -= realDt; G.timeScale = lerp(G.timeScale, 0.32, 0.2); } else G.timeScale = lerp(G.timeScale, 1, 0.08);
    let simDt = realDt * G.timeScale;
    if (G.hitStop > 0) { G.hitStop -= realDt; simDt = 0; }

    stateLogic(realDt);
    Fiesta.tick(realDt, G);

    G.acc += simDt;
    let steps = 0;
    while (G.acc >= DT && steps < 8) { step(DT); G.acc -= DT; steps++; }
    if (steps >= 8) G.acc = 0;

    // animación de cuerpos (por cuadro)
    const [A, B] = G.players;
    A.animate(realDt, G, B.alive ? B : null, G.t);
    B.animate(realDt, G, A.alive ? A : null, G.t);
    for (const p of G.players) if (p.dunked) {
      if (p.dunkT < 0.55 && p.dunkT + realDt >= 0.55 && G.rope.visible && G.mode === 'caneca') {
        // el hilo se revienta
        const mid = G.rope.pts[Math.floor(G.rope.pts.length * 0.6)];
        G.rope.visible = false;
        if (!G.quiet) { FX.gum(mid.x, mid.y, p.col, 10, 1.1, 0, -1); FX.gum(mid.x, mid.y, G.players[1 - p.id].col, 8, 1, 0, -1); sfx('unstick', true); }
      }
      p.dunkT += realDt;
      p.y += (120 + p.dunkT * 700) * realDt;
      p.x = lerp(p.x, p.dunkX, 1 - Math.exp(-realDt * 4));
    }
    G.pellets.forEach(pl => { pl.t += realDt; });
    if (G.golden) G.golden.t += realDt;
    FX.update(realDt);
    updateCamera(realDt);
    record();
    // sonido del hilo
    if (!G.quiet && G.rope.visible && (G.state === 'play')) {
      Sound.setTension(G.rope.strain, true);
      const reelP = G.players.find(p => p.pulling), reelR = G.players.find(p => p.releasing);
      Sound.setReel(reelP || reelR ? 1 : 0, !!reelP);
    } else if (!G.quiet) Sound.silenceLoops();
    G.hintsT = G.state === 'roundEnd' || G.state === 'matchEnd' ? 0 : Math.max(0, G.hintsT - (G.state === 'play' ? realDt : 0));
  }

  function stateLogic(dt) {
    const S = G.state;
    if (S === 'countdown') {
      const fo = Fiesta.cur && !G.kickoff ? Fiesta.CARD_END - 0.9 : 0; // la ruleta va primero
      const marks = G.quiet || G.tutorial || fo ? [] : G.reto || G.train ? [[0, () => FX.banner((G.reto || G.train).def.title.toUpperCase(), { size: G.train ? 96 : 110, life: 1.0, color: '#ffd84d' })]] : G.kickoff
        ? [[0, () => FX.banner('¡SAQUE!', { size: 120, life: 0.9, color: '#ffffff' })]]
        : Modes.isRounds(G.mode)
          ? [[0, () => FX.banner(G.round === 1 ? (G.mode === 'escalada' ? '¡A LA CAMPANA!' : '¡A LA CANECA!') : `RONDA ${G.round}`, { size: 120, life: 0.95, color: '#ffffff' })]]
          : G.mode === 'campana' ? (G.round > 1 ? [] : [[0, () => { const r = ARENA.L && ARENA.L.room; if (r) FX.banner(r.name.toUpperCase(), { sub: `${Campaign.ZONES[r.zone].name} · sala ${r.idx + 1}`, size: 100, life: 1.2, color: '#ffd84d' }); }]])
          : [[0, () => FX.banner(G.mode === 'jefe' && Jefes.def ? Jefes.def.name.toUpperCase() : Modes.cfg(G.mode).title, { size: G.mode === 'jefe' ? 96 : 110, life: 0.95, color: '#ffd84d' })]];
      const seq = G.quiet || G.tutorial || G.kickoff || G.reto || G.train || (G.mode === 'campana' && G.round > 1) ? [] : [[1.0 + fo, '3'], [1.6 + fo, '2'], [2.2 + fo, '1']];
      for (const [tm, fn] of marks) if (G.stateT >= tm && !G.cdMarks['m' + tm]) { G.cdMarks['m' + tm] = 1; fn(); }
      for (const [tm, txt] of seq) if (G.stateT >= tm && !G.cdMarks[txt]) {
        G.cdMarks[txt] = 1; FX.banner(txt, { size: 210, life: 0.55, color: '#ffffff', rot: 0 }); sfx('beep', false);
      }
      const len = G.quiet ? 0.5 : G.kickoff ? 1.25 : G.countdownLen;
      if (G.stateT >= len) {
        G.kickoff = false;
        G.state = G.bots[0] && G.bots[1] && G.quiet ? 'attract' : 'play';
        G.stateT = 0; G.canControl = true;
        if (!G.quiet && !G.tutorial) { FX.banner('¡YA!', { size: 230, life: 0.7, color: '#ffd84d', rot: -0.06 }); sfx('beep', true); }
      }
    } else if (S === 'play' || S === 'attract') {
      G.roundT += dt * G.timeScale;
      if (G.tutorial) { Tutorial.update(dt); return; }
      if (G.reto) { Retos.update(dt); return; }
      if (G.train) { Entreno.update(dt); return; }
      if (G.mode === 'caneca') {
        if (!G.suddenDeath && G.roundT > CANECA_SUDDEN) {
          G.suddenDeath = true;
          if (!G.quiet) { FX.banner('¡TIMBRE!', { sub: 'El chicle se encoge y el piso empuja hacia afuera', size: 150, life: 2.2, color: '#ff6b5a' }); sfx('bell'); }
          Sound.Music.setIntensity(0.8);
        }
        if (G.roundT > CANECA_MAX) roundOver(null);
      } else if (G.mode === 'escalada') {
        const w = Modes.check(G);
        if (w !== undefined) roundOver(w);
      } else if (G.mode === 'fuga') {
        const r = Modes.fugaStatus(G, dt);
        if (r === 'retry') { G.round++; resetRound(); G.countdownLen = 1.9; }
        else if (r === 'win') endMatch(null);
      } else if (G.mode === 'jefe') {
        if (Jefes.status(G)) endMatch(null);
      } else if (G.mode === 'campana') {
        const r = Campaign.status(G, dt);
        if (r === 'retry') { G.round++; resetRound(); G.countdownLen = 0.8; }
        else if (r === 'win') endMatch(null);
      } else {
        const left = Modes.cfg(G.mode).time - G.roundT;
        const sec = Math.ceil(left);
        if (left <= 10 && sec !== G.tickSec && sec > 0 && !Modes.golden) { G.tickSec = sec; sfx('beep', false); if (sec === 10 && !G.quiet) FX.banner('¡ÚLTIMOS 10!', { size: 100, life: 1.1, color: '#ffd84d', y: 0.3 }); Sound.Music.setIntensity(0.9); }
        const w = Modes.check(G);
        if (w !== undefined) endMatch(w);
      }
    } else if (S === 'roundEnd') {
      if (G.stateT > (G.quiet ? 1.6 : 2.8)) {
        // la jugada que decidió la partida se repite en cámara lenta
        if (!G.quiet && G.wins.some(w => w >= G.winsNeeded) && startReplay()) return;
        afterRound();
      }
    } else if (S === 'replay') {
      const R = G.replay;
      R.t += dt * 0.5;
      const inp = [Input.player(0), Input.player(1)];
      const skip = R.t > 0.6 && inp.some(i => i.jump || i.pull || i.stick);
      if (R.t >= R.dur || skip) { G.replay = null; afterRound(); }
    } else if (S === 'matchEnd') {
      if (G.quiet) { if (G.stateT > 1.5) startAttract(); }
      else if (G.stateT > 2.6 && G.onMatchEnd && !G.matchReported) {
        G.matchReported = true;
        G.onMatchEnd(results());
      }
    }
    if (S !== 'matchEnd') G.matchReported = false;
  }

  function afterRound() {
    if (!G.quiet && G.wins.some(w => w >= G.winsNeeded)) endMatch(G.wins[0] >= G.winsNeeded ? 0 : 1);
    else if (G.quiet) {
      G.attractRounds++;
      if (G.attractRounds % 2 === 0) setArena(randomArena(G.arenaId));
      G.round++; resetRound();
    } else if (G.arenaMode === 'torneo' && G.onPick) {
      // el que perdió elige la siguiente arena
      G.state = 'pick'; G.stateT = 0;
      const loser = G.lastLoser;
      G.onPick(loser, arenaChoices(3, G.arenaId), loser !== null && !!G.bots[loser]);
    } else {
      if (G.arenaMode === 'random') setArena(randomArena(G.arenaId));
      G.round++; resetRound();
    }
  }

  /* ---------------- repetición: se graban los últimos segundos ---------------- */
  const REC_MAX = 330;
  function snapPlayer(p) {
    return {
      id: p.id, x: p.x, y: p.y, r: p.r, mass: p.mass, vx: p.vx, vy: p.vy, off: Float32Array.from(p.off), sq: p.sq, stretch: p.stretch, stretchA: p.stretchA,
      look: { x: p.look.x, y: p.look.y }, expr: p.expr, blink: p.blink, stuck: p.stuck, stuckN: { x: p.stuckN.x, y: p.stuckN.y }, sticky: p.sticky, stun: p.stun,
      alive: p.alive, dunked: p.dunked, dunkT: p.dunkT, col: p.col, acc: p.acc, facing: p.facing, inv: 0, gripLoad: p.gripLoad, charge: p.charge,
      ropeDir: { x: p.ropeDir.x, y: p.ropeDir.y }, ropeT: p.ropeT, onGround: p.onGround, trail: p.trail.map(g => ({ x: g.x, y: g.y, r: g.r, a: g.a })), contacts: [],
    };
  }
  function record() {
    if (G.quiet || G.tutorial || (G.state !== 'play' && G.state !== 'roundEnd')) return;
    G.rec.push({
      t: G.t, p: G.players.map(snapPlayer),
      rope: { visible: G.rope.visible, pts: G.rope.pts.map(q => ({ x: q.x, y: q.y })), strain: G.rope.strain, temp: G.rope.temp },
      cam: { x: G.cam.x, y: G.cam.y, zoom: G.cam.zoom },
    });
    if (G.rec.length > REC_MAX) G.rec.shift();
  }
  function startReplay() {
    if (!G.replayMark || !G.rec.length) return false;
    const frames = G.rec.filter(f => f.t >= G.replayMark - 2.3 && f.t <= G.replayMark + 1.1);
    if (frames.length < 30) return false;
    G.replay = { frames, t: 0, dur: frames[frames.length - 1].t - frames[0].t, t0: frames[0].t };
    G.replayMark = 0;
    G.state = 'replay'; G.stateT = 0; G.canControl = false;
    FX.clear(); Sound.silenceLoops();
    sfx('whoosh');
    return true;
  }
  function replayFrame() {
    const R = G.replay; if (!R) return null;
    const want = R.t0 + R.t;
    let f = R.frames[0];
    for (const fr of R.frames) { if (fr.t <= want) f = fr; else break; }
    if (!f.ghost) {
      f.ghost = {
        players: f.p.map(s => Object.assign(Object.create(Player.prototype), s)),
        rope: Object.assign(Object.create(Rope.prototype), { visible: f.rope.visible, pts: f.rope.pts, strain: f.rope.strain, temp: f.rope.temp, jitter: 0 }),
      };
    }
    G.cam.x = f.cam.x; G.cam.y = f.cam.y; G.cam.zoom = f.cam.zoom;
    return f.ghost;
  }
  function drawReplayOverlay(ctx, W, H) {
    const bar = 64, t = G.t;
    ctx.save();
    ctx.fillStyle = 'rgba(20,10,5,0.85)'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
    // perforaciones de película
    ctx.fillStyle = 'rgba(255,246,230,0.35)';
    for (let x = 18; x < W; x += 46) { ctx.fillRect(x, 10, 22, 12); ctx.fillRect(x, H - 22, 22, 12); }
    ctx.textBaseline = 'middle';
    if (Math.floor(t * 2) % 2 === 0) { ctx.fillStyle = '#ff4b3a'; ctx.beginPath(); ctx.arc(46, bar + 40, 11, 0, TAU); ctx.fill(); }
    outlinedText(ctx, 'REPETICIÓN', 66, bar + 41, 34, '#ffffff', PALETTE.ink, 'left');
    outlinedText(ctx, 'cámara lenta ×0,5', 68, bar + 78, 18, '#ffd84d', PALETTE.ink, 'left');
    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(255,246,230,0.85)'; ctx.font = font(18, 600);
    ctx.fillText('salta o tira para seguir', W / 2, H - bar / 2);
    ctx.restore();
  }

  function results() {
    return {
      mode: G.mode, winner: G.lastWinner, wins: G.wins.slice(), points: G.points.slice(),
      stats: G.players.map(p => Object.assign({}, p.stats)), names: G.players.map(p => p.name), vsBot: G.vsBot,
    };
  }

  function roundOver(winnerId) {
    G.state = 'roundEnd'; G.stateT = 0; G.canControl = false;
    if (winnerId === null) {
      G.lastLoser = null;
      if (!G.quiet) FX.banner('¡EMPATE!', { sub: G.mode === 'escalada' ? 'Los dos al agua' : 'Nadie cayó', size: 140, life: 2, color: '#ffd84d' });
      return;
    }
    G.wins[winnerId]++;
    Progress.on('round', { winner: winnerId, suddenDeath: G.suddenDeath });
    G.lastLoser = 1 - winnerId;
    const w = G.players[winnerId];
    w.mood = 'happy';
    if (!G.quiet) {
      setTimeout(() => { if (G.state === 'roundEnd') { FX.banner(`RONDA PARA ${w.name.toUpperCase()}`, { size: 96, life: 1.5, color: w.col.base, y: 0.42 }); sfx('roundWin'); } }, 900);
    }
  }

  /* ---------------- física: un paso fijo ---------------- */
  function step(dt) {
    const [A, B] = G.players, rope = G.rope;
    if (Touch.enabled) Touch.tick(); // toques cortísimos: que este paso también los vea
    ARENA.update(dt, G);
    Fiesta.update(dt, G);
    Modes.update(dt, G);
    const inputs = [0, 1].map(i => {
      if (!G.canControl) return emptyInput();
      if (G.bots[i]) return G.bots[i].think(dt, G);
      return Input.player(i);
    });
    // pantallas táctiles: quedarse quieto en el piso ancla (pegarse automático). Quieto + tirar = cargar; moverse = soltarse
    if (Touch.enabled && G.autoStick && G.canControl) for (let i = 0; i < 2; i++) {
      const p = G.players[i], inp = inputs[i];
      if (G.bots[i] || !p.alive) { p.idleT = 0; continue; }
      const still = !inp.left && !inp.right && !inp.jump && (p.stuck || (p.onGround && Math.abs(p.vx) < 60));
      p.idleT = still ? (p.idleT || 0) + dt : 0;
      // tras secarse, el pegado automático espera a que se mueva (si no, se pega y se seca una y otra vez)
      if (p.autoDry && !still) p.autoDry = false;
      if (p.idleT > 0.28 && !p.autoDry && (p.stuck || p.sticky > 0.35)) { inp.stick = true; p.autoStuck = true; } else if (!p.stuck) p.autoStuck = false;
    }

    // tirar / aflojar: el chicle pasa del hilo al cuerpo y al revés (también en el aire y aturdido)
    const minRopeU = () => Math.max(PHYS.minRope, (A.r + B.r) * PHYS.ropeBodies / PHYS.unit);
    // se calcula lo que cada uno quiere y, si no alcanza el hilo, se reparte parejo (nadie gana por ser el jugador 1)
    const wantP = [0, 0], wantR = [0, 0];
    for (let i = 0; i < 2; i++) {
      const p = G.players[i], inp = inputs[i];
      p.pulling = false; p.releasing = false;
      if (!inp.pull) p.ropeMinShown = false;
      if (!p.alive || !rope.visible) { p.ropeMinT = 0; continue; }
      const rate = p.stun > 0 ? 0.6 : 1;
      if (inp.pull && !inp.release) wantP[i] = Math.max(0, Math.min(PHYS.pullRate * rate * dt, PHYS.maxBody - p.mass));
      else if (inp.release && !inp.pull) wantR[i] = Math.max(0, Math.min(PHYS.releaseRate * rate * dt, p.mass - PHYS.minBody));
    }
    {
      const ropeU = rope.len / PHYS.unit;
      const availP = Math.max(0, ropeU - minRopeU()), availR = Math.max(0, PHYS.maxRope - ropeU);
      const kP = wantP[0] + wantP[1] > availP ? availP / (wantP[0] + wantP[1]) : 1;
      const kR = wantR[0] + wantR[1] > availR ? availR / (wantR[0] + wantR[1]) : 1;
      for (let i = 0; i < 2; i++) {
        const p = G.players[i], inp = inputs[i];
        const pa = wantP[i] * kP, ra = wantR[i] * kR;
        if (pa > 1e-6) { rope.len -= pa * PHYS.unit; p.setMass(p.mass + pa); p.pulling = true; p.ropeMinT = 0; }
        else if (inp.pull && !inp.release && p.alive && rope.visible && p.mass < PHYS.maxBody - 0.01) {
          // el hilo ya está al mínimo: avisar una vez
          p.ropeMinT = (p.ropeMinT || 0) + dt;
          if (p.ropeMinT > 0.25 && !p.ropeMinShown && !G.quiet) { p.ropeMinShown = true; FX.callout('¡HILO AL MÍNIMO!', p.x, p.y - p.r - 34, '#ffffff', 30, 1); }
        }
        if (ra > 1e-6) { rope.len += ra * PHYS.unit; p.setMass(p.mass - ra); p.releasing = true; }
      }
    }
    // muerte súbita: el hilo se encoge y los dos engordan
    if (G.suddenDeath && G.canControl && A.alive && B.alive) {
      const ropeU = rope.len / PHYS.unit;
      const amt = Math.min(0.32 * dt, ropeU - minRopeU());
      if (amt > 0) { rope.len -= amt * PHYS.unit; A.setMass(A.mass + amt / 2); B.setMass(B.mass + amt / 2); }
      // y el piso empieza a empujar hacia las canecas, cada vez más (pegarse aguanta): así no hay empates eternos
      const k = clamp((G.roundT - CANECA_SUDDEN) / 40, 0, 1) * 240 + 60;
      for (const p of [A, B]) if (!p.stuck && p.onGround) p.vx += Math.sign(p.x - 960 || 1) * k / Math.pow(p.mass, 0.35) * dt;
    }

    // tijeras: el hilo se corta unos segundos y luego se vuelve a pegar
    if (ARENA.mods.cut > 0 && !G.ropeCut && rope.visible && A.alive && B.alive) {
      G.ropeCut = true; G.cutLen = rope.len; rope.visible = false;
      const mid = rope.pts[Math.floor(rope.pts.length / 2)];
      if (!G.quiet) { sfx('unstick', true); sfx('whoosh'); FX.gum(mid.x, mid.y, A.col, 8, 1, 0, -1); FX.gum(mid.x, mid.y, B.col, 8, 1, 0, -1); FX.callout('¡TIJERETAZO!', mid.x, mid.y - 60, '#ffffff', 54, 1.3); }
    }
    if (G.ropeCut && ARENA.mods.cut <= 0 && A.alive && B.alive) {
      G.ropeCut = false;
      const d = Math.hypot(B.x - A.x, B.y - A.y);
      rope.reset(A.x, A.y, B.x, B.y, Math.max(G.cutLen || 400, d * 0.95)); rope.visible = true;
      if (!G.quiet) { sfx('stick'); FX.callout('¡SE PEGÓ DE NUEVO!', (A.x + B.x) / 2, Math.min(A.y, B.y) - 80, '#ffd84d', 44, 1.3); }
    }
    // fuerzas del hilo
    const both = A.alive && B.alive && rope.visible;
    const T = both ? rope.tension : 0;
    // al salir disparado del tirachinas, el hilo ya soltó su energía: no te frena los primeros instantes
    // ventaja: al que la tiene, el hilo lo arrastra menos por el piso (colgando, el hilo lo sube igual)
    const kA = (A.slingT > 0.62 ? 0 : 1) * (A.onGround ? 1 - 0.2 * hc(0) : 1), kB = (B.slingT > 0.62 ? 0 : 1) * (B.onGround ? 1 - 0.2 * hc(1) : 1);
    const TA = { x: rope.dirA.x * T * kA, y: rope.dirA.y * T * kA }, TB = { x: rope.dirB.x * T * kB, y: rope.dirB.y * T * kB };
    G.hcK[0] = 1 - 0.2 * hc(0); G.hcK[1] = 1 - 0.2 * hc(1);
    A.step(dt, inputs[0], TA, G);
    B.step(dt, inputs[1], TB, G);
    collidePlayers(A, B);
    if (rope.visible) rope.step(dt, A, B);
    Modes.post(dt, G);

    // técnica: latigazo
    for (const p of G.players) {
      const o = G.players[1 - p.id];
      if (p.alive && o.alive && p.stuck && p.pulling && !o.onGround && !o.stuck && Math.hypot(o.vx, o.vy) > 1150 && o.whipT <= 0 && rope.strain > 1.05) {
        o.whipT = 2.5; p.stats.whips++; buzz(35); Progress.on('whip', { p }); if (G.train) Entreno.onWhip(p);
        if (!G.quiet) { FX.callout('¡LATIGAZO!', o.x, o.y - o.r - 40, '#ffd84d', 54); sfx('callout'); FX.speedLines(o.x, o.y, Math.atan2(o.vy, o.vx), o.col.light); }
      }
    }

    processEvents();
    hangChecks(dt);
    pickups(dt);

    // ¿alguien cayó a la caneca?
    if (G.state === 'play' || G.state === 'attract') {
      const fell = G.players.filter(p => p.alive && (p.y - p.r * 0.2 > ARENA.hazardY || p.y > 1300 || ARENA.hazardAt(p.x, p.y, p.r)));
      if (fell.length) fell.forEach(p => dunk(p, fell.length > 1));
    } else if (G.state === 'roundEnd' && G.mode === 'caneca') {
      // el ganador arrastrado después de la ronda también termina en la caneca (sin puntos)
      for (const p of G.players) if (p.alive && (p.y - p.r * 0.2 > ARENA.hazardY || p.y > 1300)) {
        p.alive = false; p.dunked = true; p.dunkT = 0; p.stuck = false; p.mood = 'panic';
        const can = p.x < 960 ? ArenaArt.CANS[0] : ArenaArt.CANS[1];
        p.dunkX = can.x + can.w / 2;
        if (!G.quiet) { sfx('dunk'); FX.callout('¡SE FUE DETRÁS!', clamp(p.x, 300, WORLD_W - 300), ArenaArt.CAN_RIM - 60, '#ffd84d', 40); }
      }
    }
    // reaparición (modo chicles)
    for (let i = 0; i < 2; i++) if (G.respawn[i] > 0) {
      G.respawn[i] -= dt;
      if (G.respawn[i] <= 0) respawn(G.players[i]);
    }
  }

  // ventaja (para jugar parejo): solo en los duelos (no en retos, entrenamiento, tutorial, campaña, jefes, fuga ni reto del día)
  function hcOn() { return !G.reto && !G.train && !G.tutorial && !G.daily && !G.quiet && (Modes.isRounds(G.mode) || Modes.isPoints(G.mode)); }
  const hc = i => hcOn() ? (G.handicap[i] || 0) : 0;
  // vibración en celulares (golpes, caídas)
  function buzz(p) { if (!G.vibrate || G.quiet || !Touch.enabled) return; try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* nada */ } }

  // ¿el choque fue a propósito? (si el hilo los junta solos, no hay embestida: así no hay bucles de choques)
  function ramIntent(att, nx, ny) {
    if (att.slingT > 0 || att.diveT > 0) return true;
    if (att.moveDir && att.moveDir === Math.sign(nx) && Math.abs(nx) > 0.3) return true;
    if (ny > 0.55 && att.vy > 250) return true; // caerle encima
    return false;
  }

  function collidePlayers(A, B) {
    if (!A.alive || !B.alive) return;
    const dx = B.x - A.x, dy = B.y - A.y;
    const d = Math.hypot(dx, dy) || 0.01, minD = A.r + B.r;
    if (d >= minD) return;
    const nx = dx / d, ny = dy / d;
    const vrel = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
    const closing = -vrel;
    let ram = null;
    if (closing > PHYS.ramSpeed && A.inv <= 0 && B.inv <= 0 && G.canControl) {
      const pA = A.mass * Math.max(0, A.vx * nx + A.vy * ny);
      const pB = B.mass * Math.max(0, -(B.vx * nx + B.vy * ny));
      // con tirachinas basta con llegar con más fuerza; si no, tiene que ganar claro
      const beats = (pa, pb, att) => { pa *= 1 + 0.15 * hc(att.id); return att.slingT > 0 ? pa > pb + 60 : pa > pb * PHYS.ramRatio + 200; };
      if (beats(pA, pB, A) && ramIntent(A, nx, ny)) ram = { att: A, def: B, n: { x: nx, y: ny } };
      else if (beats(pB, pA, B) && ramIntent(B, -nx, -ny)) ram = { att: B, def: A, n: { x: -nx, y: -ny } };
    } else if (closing > 250 && A.inv <= 0 && B.inv <= 0 && G.canControl) {
      // tirachinas y picada embisten aunque lleguen un poco más lentos
      const pA = A.mass * Math.max(0, A.vx * nx + A.vy * ny), pB = B.mass * Math.max(0, -(B.vx * nx + B.vy * ny));
      if ((A.slingT > 0 || A.diveT > 0) && pA > pB + 60 && ramIntent(A, nx, ny)) ram = { att: A, def: B, n: { x: nx, y: ny } };
      else if ((B.slingT > 0 || B.diveT > 0) && pB > pA + 60 && ramIntent(B, -nx, -ny)) ram = { att: B, def: A, n: { x: -nx, y: -ny } };
    }
    if (ram && ram.def.stuck && !ram.def.pinned) ram.def.unstick('hit', G.rope.strain);
    const invA = A.stuck ? 0 : 1 / A.mass, invB = B.stuck ? 0 : 1 / B.mass, sum = invA + invB;
    if (sum === 0) return;
    const pen = minD - d;
    A.x -= nx * pen * invA / sum; A.y -= ny * pen * invA / sum;
    B.x += nx * pen * invB / sum; B.y += ny * pen * invB / sum;
    if (vrel < 0) {
      const j = -(1 + 0.3) * vrel / sum;
      A.vx -= j * nx * invA; A.vy -= j * ny * invA;
      B.vx += j * nx * invB; B.vy += j * ny * invB;
    }
    const mx = (A.x * B.r + B.x * A.r) / (A.r + B.r), my = (A.y * B.r + B.y * A.r) / (A.r + B.r);
    if (ram) {
      const { att, def, n } = ram;
      const k = clamp(Math.pow(att.mass / def.mass, 0.35), 0.6, 1.7);
      const knock = (380 + 0.55 * closing) * k * (1 + 0.15 * hc(att.id)) * (1 - 0.17 * hc(def.id));
      const stomp = att.diveT > 0 && n.y > 0.4;
      if (stomp) {
        // caerle encima en picada: sale disparado de lado y tú rebotas
        const side = Math.sign(def.x - att.x) || (def.x < 960 ? -1 : 1);
        def.vx += side * knock * 0.8; def.vy = Math.min(def.vy, -260);
        att.vy = -620; att.diveT = 0;
      } else { def.vx += n.x * knock; def.vy += n.y * knock * 0.5 - 300; }
      def.stun = PHYS.stun * clamp(closing / 900, 0.75, 1.4);
      def.onGround = false;
      if (!stomp) { att.vx *= 0.35; att.vy *= 0.35; }
      def.lastHitBy = att; def.lastHitT = 0;
      def.bump(closing * 1.4, -n.x, -n.y); att.bump(closing, n.x, n.y);
      const sling = att.slingT > 0;
      Progress.on('ram', { att, def, sling, stomp });
      buzz(stomp || sling ? 45 : 25);
      if (G.tutorial) Tutorial.onRam(att);
      if (G.reto) Retos.onRam(att, { sling, stomp });
      if (G.train) Entreno.onRam(att, { sling, stomp });
      if (sling) att.stats.slings++; else att.stats.rams++;
      att.slingT = 0;
      G.hitStop = sling ? 0.13 : 0.075;
      if (!G.quiet) {
        sfx('ram', clamp(closing / 1100, 0.5, 1.3));
        FX.shake(sling ? 0.9 : 0.55);
        FX.stars(mx, my, sling ? 12 : 8, sling ? 1.3 : 1);
        FX.ring(mx, my, '#ffffff', 90, 0.35, 8);
        FX.gum(mx, my, def.col, 6, 1, n.x, n.y - 0.5);
        if (sling) { FX.callout('¡TIRACHINAS!', mx, my - 90, '#ffd84d', 64, 1.5); sfx('callout'); }
        else if (stomp) { FX.callout('¡APLASTÓN!', mx, my - 80, '#ffb0d0', 58, 1.3); sfx('callout'); }
        else FX.callout('¡PUM!', mx, my - 70, '#ffffff', 50, 0.9);
      }
    } else if (closing > 160) {
      A.bump(closing * 0.6, nx, ny); B.bump(closing * 0.6, -nx, -ny);
      if (closing > 260) sfx('bump', clamp(closing / 700, 0.3, 1));
    }
  }

  function processEvents() {
    for (const p of G.players) {
      for (const e of p.events) {
        if (G.tutorial) Tutorial.onEvent(p, e);
        if (G.quiet) continue;
        switch (e.type) {
          case 'jump':
            sfx('jump', p.mass);
            FX.dust(p.x, p.y + p.r, 4, 0.8);
            p.sqV += 2.5;
            break;
          case 'land': {
            const I = e.impact;
            sfx('land', I / 1300, p.mass);
            FX.dust(p.x - e.nx * p.r, p.y - e.ny * p.r, I > 900 ? 9 : 5, clamp(I / 900, 0.6, 1.5));
            if (I > 700) FX.gum(p.x - e.nx * p.r, p.y - e.ny * p.r, p.col, 4, 0.6, e.nx, e.ny);
            p.bump(I, e.nx, e.ny);
            if (I > 1200) FX.shake(0.3);
            break;
          }
          case 'bounce':
            sfx('boing', p.mass);
            FX.dust(p.x, p.y + p.r, 6, 1);
            p.sqV += 4; p.bump(900, 0, -1);
            break;
          case 'stick':
            Progress.on('stick', { p });
            sfx('stick');
            FX.gum(p.x - e.nx * p.r, p.y - e.ny * p.r, p.col, 7, 0.7, e.nx, e.ny);
            FX.ring(p.x - e.nx * p.r, p.y - e.ny * p.r, p.col.light, 34, 0.3, 5);
            p.bump(500, e.nx, e.ny);
            break;
          case 'charge':
            if (e.lvl === 1) { sfx('tick', 1); FX.ring(p.x, p.y, '#ffd84d', p.r + 26, 0.25, 4); }
            else { sfx('select'); FX.ring(p.x, p.y, '#ff8a3d', p.r + 34, 0.35, 6); }
            break;
          case 'dive':
            sfx('whoosh'); FX.speedLines(p.x, p.y, Math.PI / 2, p.col.light);
            break;
          case 'airjump':
            Progress.on('airjump', { p });
            sfx('jump', p.mass * 0.6);
            FX.gum(p.x, p.y + p.r, p.col, 6, 0.8, 0, 1); FX.ring(p.x, p.y + p.r * 0.8, p.col.light, p.r * 0.9, 0.3, 5);
            p.sqV -= 3;
            break;
          case 'unstick':
            if (e.reason === 'rip') { sfx('unstick', true); FX.callout('¡DESPEGADO!', p.x, p.y - p.r - 30, p.col.light, 34, 1); }
            else if (e.reason === 'dry') { if (p.autoStuck) { p.autoDry = true; p.autoStuck = false; } else { sfx('dry'); FX.callout('¡Se secó!', p.x, p.y - p.r - 30, '#ffffff', 32, 1); } }
            else if (e.reason !== 'hit') sfx('unstick', false);
            if (e.strain > 1.15) { sfx('whoosh'); FX.speedLines(p.x, p.y, Math.atan2(p.vy, p.vx), p.col.light); }
            break;
        }
      }
      p.events.length = 0;
    }
  }

  function hangChecks(dt) {
    for (const p of G.players) {
      if (!p.alive) { p.hangT = 0; continue; }
      // campaña: colgando contra cualquier pared con el hilo tirando (alguien tira), se trepa y se asoma arriba
      if (G.mode === 'campana' && !p.stuck && G.rope.visible && G.rope.strain > 1.1 && p.ropeDir.y < 0.25 && G.players.some(q => q.pulling)) {
        const c = p.contacts.find(k => Math.abs(k.nx) > 0.75 && k.R && k.R.w !== undefined && !k.R.solidOff && k.R.kind !== 'gate');
        if (c && p.y > c.R.y - p.r && p.y < c.R.y + 260) {
          const k = clamp((G.rope.strain - 1.1) * 4, 0.35, 1);
          p.vy = Math.min(p.vy, -(120 + 260 * k));
          if (p.y < c.R.y + p.r * 0.6) {
            const into = -Math.sign(c.nx);
            p.x = into > 0 ? c.R.x + 4 : c.R.x + c.R.w - 4; p.y = c.R.y - p.r - 1;
            p.vx = into * 240; p.vy = -120; p.sqV -= 3;
            if (!G.quiet) { FX.dust(p.x, c.R.y, 6, 1); sfx('land', 0.6); }
          }
        }
      }
      // contra el costado del pupitre con el hilo tirando fuerte hacia arriba: el chicle trepa por el borde
      // (sin esto se quedaba enganchado en la esquina y tirar no servía para salvarse)
      if (!G.noClimb && !p.stuck && G.rope.visible && (p.x < ARENA.deskLeft + 4 || p.x > ARENA.deskRight - 4) && p.y > ARENA.deskY - p.r && p.y < ARENA.hazardY) {
        const out = p.x < 960 ? -1 : 1;
        const wall = p.contacts.some(c => Math.abs(c.nx) > 0.75 && Math.sign(c.nx) === out);
        if (wall && G.rope.strain > 1.1 && p.ropeDir.y < 0.25 && G.players.some(q => q.pulling)) { // tirar (cualquiera de los dos) lo sube
          const k = clamp((G.rope.strain - 1.12) * 4, 0.35, 1);
          p.vy = Math.min(p.vy, -(120 + 260 * k));
          if (p.y < ARENA.deskY + p.r * 0.6) {
            // ya en la esquina: se trepa encima (el hilo solo lo apretaría contra el canto)
            p.x = out < 0 ? ARENA.deskLeft + 4 : ARENA.deskRight - 4; p.y = ARENA.deskY - p.r - 1;
            p.vx = -out * 240; p.vy = -120; p.sqV -= 3;
            if (!G.quiet) { FX.dust(p.x, ARENA.deskY, 6, 1); sfx('land', 0.6); }
          }
        }
      }
      const hanging = p.y - p.r > ARENA.deskY - 2 && (p.x < ARENA.deskLeft + 4 || p.x > ARENA.deskRight - 4);
      if (hanging) {
        p.hangT += dt;
        if (p.hangT > 0.9 && !p.wasHanging) { p.wasHanging = true; if (!G.quiet) FX.callout('¡AL FILO!', p.x, p.y - p.r - 30, '#ff8a7a', 40); }
      } else {
        if (p.wasHanging && p.onGround && p.y < ARENA.deskY) { if (!G.quiet) { FX.callout('¡SALVADA!', p.x, p.y - p.r - 30, '#9dffb0', 44); sfx('callout'); } Progress.on('saved', { p }); if (G.reto) Retos.onSaved(p); if (G.train) Entreno.onSaved(p); }
        if (p.onGround) p.wasHanging = false;
        p.hangT = 0;
      }
    }
    // la música se agita cuando alguien cuelga
    if (!G.quiet) {
      const danger = G.players.some(p => p.alive && p.hangT > 0.2);
      Sound.Music.setIntensity(G.suddenDeath ? 0.8 : danger ? 0.7 : 0);
    }
  }

  function dunk(p, simultaneous) {
    if (G.mode === 'campana') { Campaign.onFall(p, G); return; }
    p.alive = false; p.dunked = true; p.dunkT = 0; p.stuck = false;
    G.replayMark = G.t;
    const can = p.x < 960 ? ArenaArt.CANS[0] : ArenaArt.CANS[1];
    p.dunkX = can.x + can.w / 2;
    p.mood = 'panic';
    const other = G.players[1 - p.id];
    buzz([60, 40, 90]);
    Progress.on('dunk', { victim: p, by: other.alive ? other : null, ropeCut: G.ropeCut });
    const rimX = clamp(p.x, can.x + 30, can.x + can.w - 30);
    if (!G.quiet) {
      sfx('dunk');
      FX.paper(rimX, ArenaArt.CAN_RIM - 10, 16);
      FX.gum(rimX, ArenaArt.CAN_RIM - 10, p.col, 10, 1.2, 0, -1);
      FX.shake(0.8);
    }
    G.cam.focus = { x: clamp(rimX, 380, WORLD_W - 380), y: 660 }; G.cam.focusT = 1.6;
    G.slowT = 0.7;
    if (G.tutorial) { G.rope.visible = false; G.respawn[p.id] = 1.0; G.cam.focusT = 0.8; return; }
    if (G.reto) { G.cam.focus = null; G.cam.focusT = 0; G.slowT = 0.35; Retos.onDunk(p); return; }
    if (G.train) { G.cam.focus = null; G.cam.focusT = 0; G.slowT = 0.25; Entreno.onDunk(p); return; }
    if (G.mode === 'caneca') {
      if (simultaneous) { if (G.state !== 'roundEnd') roundOver(null); return; }
      if (G.state === 'roundEnd') return;
      if (other.alive) other.stats.dunks++;
      if (!G.quiet) FX.banner('¡A LA CANECA!', { size: 150, life: 1.5, color: '#ffd84d', y: 0.36 });
      roundOver(other.alive ? other.id : null);
    } else {
      G.rope.visible = false;
      const pts = Modes.dunkPoints(G.mode);
      if (other.alive) {
        G.points[other.id] += pts; other.stats.dunks++;
        if (!G.quiet) {
          if (pts) { FX.callout('+' + pts, other.x, other.y - other.r - 50, '#ffd84d', 70, 1.4); FX.banner('¡A LA CANECA!', { sub: `+${pts} para ${other.name}`, size: 110, life: 1.3, color: '#ffd84d', y: 0.32 }); }
          else FX.banner('¡A LA CANECA!', { sub: 'vuelve en un momento', size: 100, life: 1.2, color: '#ffd84d', y: 0.32 });
        }
      }
      G.respawn[p.id] = 1.5;
      if (G.mode === 'jefe') Jefes.onDunk(p, G);
    }
  }

  function respawn(p) {
    const o = G.players[1 - p.id];
    const spots = ARENA.respawnSpots;
    let best = spots[0], bd = -1;
    for (const s of spots) { const d = Math.hypot(s.x - o.x, s.y - o.y); if (d > bd) { bd = d; best = s; } }
    const keepMass = Math.max(2, p.mass);
    const stats = p.stats;
    p.reset(best.x, best.y, keepMass);
    p.stats = stats;
    p.inv = 1.2; p.vy = -300;
    if (o.alive) {
      const L = clamp(Math.hypot(o.x - p.x, o.y - p.y) * 0.9, 250, 700);
      // el chicle del hilo se conserva aproximadamente
      G.rope.reset(p.id === 0 ? p.x : o.x, p.id === 0 ? p.y : o.y, p.id === 0 ? o.x : p.x, p.id === 0 ? o.y : p.y, Math.max(G.rope.len, L));
    }
    G.rope.visible = !G.ropeCut;
    if (!G.quiet) { FX.sparkle(p.x, p.y, p.col.light, 16); FX.ring(p.x, p.y, p.col.light, 70, 0.4, 6); sfx('pellet', 0.8); }
  }

  /* ---------------- chicles para recoger ---------------- */
  function pickups(dt) {
    if (G.state !== 'play' && G.state !== 'attract') return;
    if (G.mode === 'chicles') {
      G.spawnT -= dt;
      if (G.spawnT <= 0 && G.pellets.length < 5) {
        G.spawnT = 1.45;
        for (let tries = 0; tries < G.spawnOrder.length; tries++) {
          const idx = G.spawnOrder[G.spawnIdx++ % G.spawnOrder.length];
          const s = ARENA.pelletSpots[idx];
          if (G.pellets.some(p => Math.hypot(p.x - s.x, p.y - s.y) < 40)) continue;
          if (G.players.some(p => p.alive && Math.hypot(p.x - s.x, p.y - s.y) < 110)) continue;
          G.spawnCount++;
          const gold = G.spawnCount % 6 === 0;
          G.pellets.push({ x: s.x, y: s.y, gold, t: 0, col: gold ? '#ffcf3c' : PELLET_COLORS[G.spawnCount % PELLET_COLORS.length] });
          break;
        }
      }
      for (const p of G.players) {
        if (!p.alive) continue;
        for (let k = G.pellets.length - 1; k >= 0; k--) {
          const pl = G.pellets[k];
          if (pl.t < 0.25) continue;
          if (Math.hypot(pl.x - p.x, pl.y - p.y) < p.r + (pl.gold ? 22 : 16)) {
            G.pellets.splice(k, 1);
            const pts = pl.gold ? 3 : 1;
            G.points[p.id] += pts; p.stats.pellets += pts; Progress.on('pellet', { p, gold: pl.gold });
            p.setMass(p.mass + (pl.gold ? 0.35 : 0.1));
            if (!G.quiet) {
              sfx(pl.gold ? 'golden' : 'pellet', 1 + (G.points[p.id] % 5) * 0.06);
              FX.sparkle(pl.x, pl.y, pl.col, pl.gold ? 18 : 9);
              FX.callout(pl.gold ? '+3' : '+1', pl.x, pl.y - 30, pl.gold ? '#ffd84d' : '#ffffff', pl.gold ? 56 : 40, 0.9);
            }
          }
        }
      }
    } else {
      // chicle dorado en ¡A la caneca!: más chicle para quien lo agarre
      if (!G.golden && G.roundT > G.goldenNext) {
        const s = ARENA.goldenSpots[G.goldenIdx++ % ARENA.goldenSpots.length];
        G.golden = { x: s.x, y: s.y, gold: true, t: 0, col: '#ffcf3c', life: 9 };
      }
      if (G.golden) {
        const gd = G.golden;
        if (gd.t > gd.life) { G.golden = null; G.goldenNext = G.roundT + 9; }
        else for (const p of G.players) {
          if (p.alive && gd.t > 0.3 && Math.hypot(gd.x - p.x, gd.y - p.y) < p.r + 24) {
            p.setMass(p.mass + 1.2); p.stats.pellets++; Progress.on('pellet', { p, gold: true });
            G.golden = null; G.goldenNext = G.roundT + 12;
            if (!G.quiet) { sfx('golden'); FX.sparkle(gd.x, gd.y, '#ffd84d', 22); FX.ring(gd.x, gd.y, '#ffd84d', 80, 0.4, 7); FX.callout('+1 CHICLE', gd.x, gd.y - 40, '#ffd84d', 46, 1.2); }
            break;
          }
        }
      }
    }
  }

  /* ---------------- cámara ---------------- */
  function updateCamera(dt) {
    const cam = G.cam;
    const vis = G.players.filter(p => p.alive);
    if (cam.focusT > 0) cam.focusT -= dt; else cam.focus = null;
    if (cam.focus) { cam.tx = cam.focus.x; cam.ty = cam.focus.y; cam.tz = 1.34; }
    else if (G.reto) { const c = Retos.camera(); cam.tx = c.x; cam.ty = c.y; cam.tz = c.z; }
    else if (G.train) { const c = Entreno.camera(); cam.tx = c.x; cam.ty = c.y; cam.tz = c.z; }
    else if ((G.mode === 'campana' || (G.mode === 'jefe' && ARENA.def && ARENA.def.id === 'campana')) && G.state !== 'attract') { cam.tx = 960; cam.ty = 540; cam.tz = 1; }
    else if ((G.mode === 'escalada' || G.mode === 'fuga') && G.state !== 'attract') {
      // la torre: se ve todo el ancho y la cámara sigue la subida (sin bajar del piso)
      const al = vis.length ? vis : G.players;
      const avg = al.reduce((a, p) => a + p.y, 0) / al.length;
      const wy = Modes.waterY !== undefined ? Modes.waterY : 900;
      cam.tx = 960; cam.tz = 1.0;
      cam.ty = clamp(Math.min(avg - 80, wy - 360), ARENA.L.topY - 220, 540);
    } else if (G.mode === 'gol' && G.state !== 'attract') {
      // la cancha completa a la vista (los dos arcos), siguiendo un poquito la canica
      const b = Modes.ball;
      cam.tx = lerp(960, b ? b.x : 960, 0.12); cam.ty = 545; cam.tz = 1.02;
    } else if (vis.length) {
      const pts = vis.map(p => ({ x: p.x, y: p.y }));
      if (G.mode === 'rey' && Modes.throne) pts.push({ x: Modes.throne.x + Modes.throne.w / 2, y: Modes.throne.y });
      if (G.mode === 'jefe') { const bp = Jefes.point(); if (bp) pts.push(bp); }
      let cx = 0, cy = 0; pts.forEach(p => { cx += p.x; cy += p.y; }); cx /= pts.length; cy /= pts.length;
      let d = 300;
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) d = Math.max(d, Math.hypot(pts[i].x - pts[j].x, (pts[i].y - pts[j].y) * 1.6));
      cam.tx = lerp(960, cx, 0.7); cam.ty = lerp(600, cy, 0.45);
      cam.tz = G.state === 'attract' ? 1.06 : clamp(1.36 - d / 2200, 1.1, 1.3) * (Touch.enabled ? 1.08 : 1); // en pantalla chica, un poco más cerca
    } else { cam.tx = 960; cam.ty = 560; cam.tz = 1; }
    const k = 1 - Math.exp(-dt * 2.6);
    cam.x = lerp(cam.x, cam.tx, k); cam.y = lerp(cam.y, cam.ty, k); cam.zoom = lerp(cam.zoom, cam.tz, 1 - Math.exp(-dt * 2));
  }

  /* ---------------- dibujo ---------------- */
  function baseScale(cw, ch) {
    const contain = Math.min(cw / WORLD_W, ch / WORLD_H), cover = Math.max(cw / WORLD_W, ch / WORLD_H);
    return Math.min(cover, contain * 1.1);
  }

  // escala del HUD: 1 en pantallas grandes; hasta ~2 en un celular apaisado (para que 18 px se vean de ~9 px reales)
  let lastHk = 0;
  function hudK(cssPerUnit) {
    const k = Math.round(clamp(0.5 / Math.max(0.05, cssPerUnit), 1, 2.1) * 20) / 20;
    if (k !== lastHk) {
      lastHk = k; G.hudK = k; FX.textK = clamp(1 + (k - 1) * 0.6, 1, 1.6);
      try { document.documentElement.style.setProperty('--hk', String(k)); } catch (e) { /* sin DOM */ }
    }
    return k;
  }
  function render(ctx, cw, ch, dpr) {
    const cam = G.cam;
    const s = baseScale(cw, ch) * cam.zoom;
    const hw = cw / (2 * s), hh = ch / (2 * s);
    const vx = hw * 2 >= WORLD_W ? WORLD_W / 2 : clamp(cam.x, hw, WORLD_W - hw);
    const yMin = ARENA.L && ARENA.L.camTop !== undefined ? ARENA.L.camTop : 0; // la torre deja subir la cámara
    const vy = hh * 2 >= WORLD_H - yMin ? (WORLD_H + yMin) / 2 : clamp(cam.y, yMin + hh, WORLD_H - hh);
    G.view = { vx, vy, s, hw, hh };
    const sh = FX.shakeAmt * FX.shakeAmt * 22 * dpr;
    const sx = sh ? (Math.random() - 0.5) * 2 * sh : 0, sy = sh ? (Math.random() - 0.5) * 2 * sh : 0;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#2a1710'; ctx.fillRect(0, 0, cw, ch);
    ctx.setTransform(s, 0, 0, s, cw / 2 - vx * s + sx, ch / 2 - vy * s + sy);
    ctx.imageSmoothingEnabled = true;
    if (ArenaArt.bg) ctx.drawImage(ArenaArt.bg, 0, 0, WORLD_W, WORLD_H);
    ArenaArt.drawDynamic(ctx, G.t, G);
    const th = THEMES[G.theme];
    if (th && th.tint) drawThemeOverlay(ctx, th);
    Modes.drawWorld(ctx, G, G.t);

    G.pellets.forEach(pl => drawPellet(ctx, pl));
    if (G.golden) drawPellet(ctx, G.golden, true);
    if (G.reto) Retos.drawWorld(ctx, G.t);
    if (G.train) Entreno.drawWorld(ctx, G.t);
    if (G.suddenDeath && G.mode === 'caneca' && G.state === 'play') {
      // flechitas en el piso: después del timbre empuja hacia las canecas
      const a = 0.25 + 0.2 * Math.sin(G.t * 6);
      ctx.save(); ctx.fillStyle = `rgba(255,107,90,${a})`;
      for (let x = ARENA.deskLeft + 90; x < ARENA.deskRight - 60; x += 150) {
        if (Math.abs(x - 960) < 60) continue;
        const d = Math.sign(x - 960), y = ARENA.deskY - 3, o = (G.t * 60) % 30 * d;
        ctx.beginPath(); ctx.moveTo(x + o - d * 14, y - 8); ctx.lineTo(x + o + d * 6, y); ctx.lineTo(x + o - d * 14, y + 8); ctx.lineTo(x + o - d * 6, y); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    const RP = G.state === 'replay' ? replayFrame() : null;
    const [A, B] = RP ? RP.players : G.players;
    const ropeNow = RP ? RP.rope : G.rope;
    A.drawShadow(ctx); B.drawShadow(ctx);
    if (th && th.glow) for (const p of G.players) if (p.alive) {
      // de noche cada chicle brilla un poquito
      const gl = ctx.createRadialGradient(p.x, p.y, p.r * 0.5, p.x, p.y, p.r * 2.6);
      gl.addColorStop(0, rgba(p.col.light, th.glow)); gl.addColorStop(1, rgba(p.col.light, 0));
      ctx.fillStyle = gl; ctx.fillRect(p.x - p.r * 2.6, p.y - p.r * 2.6, p.r * 5.2, p.r * 5.2);
    }
    if (ropeNow.visible) ropeNow.draw(ctx, A, B, G.t);
    else if (G.ropeCut) [A, B].forEach(p => { if (p.alive) drawTail(ctx, p, G.t); });
    // el que está más arriba se dibuja encima
    const order = A.r > B.r ? [B, A] : [A, B];
    if (A.dunked) order.sort((p, q) => (p.dunked ? -1 : 1));
    order.forEach(p => { if (p.alive || p.dunked) p.draw(ctx, G.t); });
    if (ArenaArt.fg) ctx.drawImage(th && th.tint ? tintedFg(th) : ArenaArt.fg, 0, 0, WORLD_W, WORLD_H);
    ArenaArt.drawOver(ctx, G.t, G);
    Modes.drawOver(ctx, G, G.t);
    Fiesta.drawWorld(ctx, G.t, G);
    FX.draw(ctx);

    // viñeta
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const vg = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.45, cw / 2, ch / 2, Math.max(cw, ch) * 0.75);
    vg.addColorStop(0, 'rgba(40,20,10,0)'); vg.addColorStop(1, 'rgba(40,20,10,0.32)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, cw, ch);

    // indicadores fuera de pantalla
    for (const p of G.players) {
      if (!p.alive) continue;
      const top = vy - hh;
      if (p.y + p.r < top) {
        const px = (p.x - vx) * s + cw / 2;
        ctx.save(); ctx.translate(clamp(px, 40 * dpr, cw - 40 * dpr), 34 * dpr);
        ctx.fillStyle = p.col.base; ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = 3 * dpr;
        ctx.beginPath(); ctx.moveTo(0, -18 * dpr); ctx.lineTo(16 * dpr, 10 * dpr); ctx.lineTo(-16 * dpr, 10 * dpr); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    }

    // HUD: en pantallas chicas (celular) todo se agranda para que los textos se lean
    const u0 = Math.min(cw / 1920, ch / 1080), hk = hudK(u0 / (dpr || 1)), u = u0 * hk;
    ctx.setTransform(u, 0, 0, u, 0, 0);
    const W = cw / u, H = ch / u;
    if (Touch.enabled) { Touch.setTrain(!!G.train && G.state === 'play'); }
    if (Touch.enabled) Touch.placePause(G.reto || G.tutorial || G.train ? -1 : (G.mode === 'jefe' ? 150 : 122) + (Fiesta.cur ? 58 : 0));
    if (G.state !== 'attract' && !(G.quiet) && G.state !== 'replay') { if (G.tutorial) Tutorial.drawHUD(ctx, W, H); else if (G.reto) Retos.drawHUD(ctx, W, H); else if (G.train) Entreno.drawHUD(ctx, W, H); else drawHUD(ctx, W, H); }
    FX.drawBanners(ctx, W, H, clamp(1 + (hk - 1) * 0.35, 1, 1.4) / hk);
    if (!G.quiet) Progress.drawHUD(ctx, W, H);
    if (G.state === 'replay') drawReplayOverlay(ctx, W, H);
  }

  function drawThemeOverlay(ctx, th) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = th.tint; ctx.fillRect(-100, -500, WORLD_W + 200, WORLD_H + 1000);
    ctx.globalCompositeOperation = 'screen';
    // una luz suave (el sol de la tarde por la ventana, o la lámpara del techo de noche)
    const lx = G.theme === 'tarde' ? 300 : 960, ly = G.theme === 'tarde' ? 80 : -60;
    const lg = ctx.createRadialGradient(lx, ly, 40, lx, ly, 1100);
    lg.addColorStop(0, th.sky); lg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lg; ctx.fillRect(-100, -500, WORLD_W + 200, WORLD_H + 1000);
    ctx.restore();
  }
  // el frente del escenario (canecas, etc.) también se tiñe; se calcula una vez
  let fgCache = { src: null, theme: null, canvas: null };
  function tintedFg(th) {
    const src = ArenaArt.fg;
    if (fgCache.src === src && fgCache.theme === G.theme && fgCache.canvas) return fgCache.canvas;
    const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
    const x = c.getContext('2d');
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'multiply'; x.fillStyle = th.tint; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'destination-in'; x.drawImage(src, 0, 0);
    fgCache = { src, theme: G.theme, canvas: c };
    return c;
  }

  function drawTail(ctx, p, t) {
    const sw = Math.sin(t * 4 + p.id * 2) * 10 - p.vx * 0.02;
    ctx.save(); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(p.x, p.y + p.r * 0.6); ctx.quadraticCurveTo(p.x + sw, p.y + p.r + 22, p.x + sw * 1.6, p.y + p.r + 44);
    ctx.lineWidth = 12; ctx.strokeStyle = p.col.deep; ctx.stroke();
    ctx.lineWidth = 7; ctx.strokeStyle = p.col.base; ctx.stroke();
    ctx.beginPath(); ctx.arc(p.x + sw * 1.6, p.y + p.r + 46, 6, 0, TAU); ctx.fillStyle = p.col.base; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = p.col.deep; ctx.stroke();
    ctx.restore();
  }

  function drawPellet(ctx, pl, isGolden = false) {
    const bob = Math.sin(pl.t * 3 + pl.x) * 6;
    const appear = easeOutBack(clamp(pl.t / 0.35, 0, 1));
    const r = (pl.gold ? 19 : 13) * appear;
    if (r <= 0.5) return;
    const x = pl.x, y = pl.y + bob;
    ctx.save();
    if (pl.gold) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(pl.t * 1.2);
      ctx.fillStyle = 'rgba(255,220,90,0.28)';
      for (let k = 0; k < 8; k++) { ctx.rotate(TAU / 8); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-7, -r * 2.6); ctx.lineTo(7, -r * 2.6); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      if (isGolden && pl.life && pl.t > pl.life - 2.5 && Math.floor(pl.t * 8) % 2) ctx.globalAlpha = 0.45;
    }
    // sombra
    ctx.fillStyle = 'rgba(50,25,10,0.18)';
    ctx.beginPath(); ctx.ellipse(x, pl.y + 20, r * 0.8, r * 0.22, 0, 0, TAU); ctx.fill();
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.2);
    g.addColorStop(0, mixHex(pl.col, '#ffffff', 0.55)); g.addColorStop(0.5, pl.col); g.addColorStop(1, mixHex(pl.col, '#000000', 0.25));
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = PALETTE.ink; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.4, r * 0.3, r * 0.18, -0.6, 0, TAU); ctx.fill();
    if (pl.gold) { ctx.fillStyle = PALETTE.ink; ctx.font = font(r * 1.05, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', x, y + 1); }
    ctx.restore();
  }

  function miniBlob(ctx, x, y, r, p) {
    const c = p.col;
    ctx.save(); ctx.translate(x, y);
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.3);
    g.addColorStop(0, c.light); g.addColorStop(0.5, c.base); g.addColorStop(1, c.dark);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 3.5; ctx.strokeStyle = c.deep; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#2b1610'; ctx.lineWidth = 2;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * r * 0.34, -r * 0.08, r * 0.2, r * 0.24, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#2b1610'; ctx.beginPath(); ctx.arc(s * r * 0.34 + (p.id ? -2 : 2), -r * 0.05, r * 0.11, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; }
    ctx.strokeStyle = '#2b1610'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(0, r * 0.2, r * 0.22, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(-r * 0.45, -r * 0.5, r * 0.22, r * 0.12, -0.6, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawHUD(ctx, W, H) {
    const rr = ArenaArt.rr, ink = PALETTE.ink;
    const pad = 28;
    G.players.forEach((p, i) => {
      const w = 340, h = 96;
      const x = i === 0 ? pad : W - pad - w, y = pad;
      ctx.save();
      ctx.fillStyle = 'rgba(40,20,10,0.25)'; rr(ctx, x + 4, y + 6, w, h, 22); ctx.fill();
      rr(ctx, x, y, w, h, 22);
      ctx.fillStyle = '#fff6e6'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = ink; ctx.stroke();
      ctx.save(); rr(ctx, x, y, w, h, 22); ctx.clip();
      ctx.fillStyle = rgba(p.col.base, 0.18); ctx.fillRect(i === 0 ? x : x + w - 110, y, 110, h);
      ctx.restore();
      const iconR = clamp(p.r * 0.72, 16, 36);
      const ix = i === 0 ? x + 56 : x + w - 56;
      miniBlob(ctx, ix, y + h / 2 + 2, iconR, p);
      const tx = i === 0 ? x + 112 : x + w - 112;
      ctx.textAlign = i === 0 ? 'left' : 'right'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = ink; ctx.font = font(30, 700);
      ctx.fillText(p.name.toUpperCase(), tx, y + 40);
      if (hc(i) > 0) {
        // escudito de ventaja (pegado al borde de la tarjeta)
        ctx.save(); ctx.translate(i === 0 ? x + w - 26 : x + 26, y + 4);
        ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(14, -10); ctx.quadraticCurveTo(14, 8, 0, 16); ctx.quadraticCurveTo(-14, 8, -14, -10); ctx.closePath();
        ctx.fillStyle = '#ffd84d'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
        ctx.fillStyle = ink; ctx.font = font(hc(i) === 2 ? 12 : 16, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(hc(i) === 2 ? '++' : '+', 0, 0);
        ctx.restore();
        ctx.textAlign = i === 0 ? 'left' : 'right'; ctx.textBaseline = 'alphabetic';
      }
      ctx.font = font(18, 600); ctx.fillStyle = PALETTE.inkSoft;
      const peso = p.alive ? p.mass.toFixed(1).replace('.', ',') : '—';
      const who = G.vsBot && i === 1 ? 'máquina' : Progress.names[i];
      ctx.fillText(Modes.isPoints(G.mode) ? `peso ${peso}` : `${who} · peso ${peso}`, tx, y + 64);
      // marcador
      if (Modes.isRounds(G.mode)) {
        for (let k = 0; k < G.winsNeeded; k++) {
          const px = i === 0 ? tx + k * 30 + 10 : tx - k * 30 - 10, py = y + 82;
          ctx.beginPath(); ctx.arc(px, py, 9, 0, TAU);
          ctx.fillStyle = k < G.wins[i] ? p.col.base : 'rgba(58,34,22,0.15)'; ctx.fill();
          ctx.lineWidth = 2.5; ctx.strokeStyle = ink; ctx.stroke();
        }
      } else if (Modes.isPoints(G.mode)) {
        ctx.font = font(48, 700); ctx.textAlign = i === 0 ? 'right' : 'left';
        outlinedText(ctx, String(Math.floor(G.points[i])), i === 0 ? x + w - 22 : x + 22, y + h / 2 + 2, 52, p.col.base, ink, i === 0 ? 'right' : 'left');
      }
      ctx.restore();
    });
    // centro: ronda o tiempo
    const cx = W / 2;
    ctx.save();
    let label, sub = null, col = '#fff6e6';
    let hearts = null;
    if (G.mode === 'campana') {
      const c = Campaign.centerLabel(G) || { label: 'SALA', sub: '' };
      label = c.label; sub = c.sub; if (c.late) col = '#ffe9c9';
    } else if (G.mode === 'jefe') {
      const c = Jefes.centerLabel() || { label: 'JEFE', hearts: 3, flash: 0 };
      label = c.label; sub = ' '; hearts = c;
      if (c.flash > 0) col = '#ffd9d3';
    } else if (G.mode === 'fuga') {
      label = `NIVEL ${G.fugaLevel || 1}`;
      const t = G.state === 'countdown' ? 0 : G.roundT, par = Modes.fugaPar(G.fugaLevel || 1);
      sub = `${t.toFixed(1)} s · ★★★ en ${par} s`;
      if (t > par) col = '#ffe9c9';
    } else if (G.mode === 'escalada') {
      label = `RONDA ${G.round}`;
      const wy = Modes.waterY, low = Math.max(...G.players.filter(p => p.alive).map(p => p.y), -1e9);
      sub = wy !== undefined && wy - low < 260 ? '¡EL AGUA SUBE!' : 'toca la campana';
      if (sub[0] === '¡') col = '#d6efff';
    } else if (G.mode === 'caneca') {
      label = `RONDA ${G.round}`;
      if (G.suddenDeath) { sub = '¡TIMBRE!'; col = '#ffd9d3'; }
      else { const left = Math.max(0, Math.ceil(CANECA_SUDDEN - G.roundT)); sub = `timbre en ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; }
    } else {
      const C = Modes.cfg(G.mode);
      const left = Math.max(0, Math.ceil(C.time - (G.state === 'countdown' && G.roundT < 0.1 ? 0 : G.roundT)));
      label = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
      if (left <= 10) col = '#ffd9d3';
      if (C.sub) sub = Modes.golden ? '¡GOL DE ORO!' : C.sub;
      if (Modes.golden) { label = '¡ORO!'; col = '#fff1b8'; }
    }
    const w = G.mode === 'jefe' ? 290 : G.mode === 'campana' ? 420 : 230, h = sub ? 86 : 64;
    ctx.fillStyle = 'rgba(40,20,10,0.25)'; rr(ctx, cx - w / 2 + 4, 34, w, h, 20); ctx.fill();
    rr(ctx, cx - w / 2, 28, w, h, 20); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = ink; ctx.stroke();
    ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = font(G.mode === 'caneca' || G.mode === 'jefe' ? 30 : G.mode === 'campana' ? 28 : sub ? 34 : 40, 700); ctx.fillText(label, cx, 28 + (sub ? 30 : h / 2 + 1));
    if (sub) { ctx.font = font(20, 700); ctx.fillStyle = G.suddenDeath ? '#d23b2a' : PALETTE.inkSoft; ctx.fillText(sub, cx, 28 + 62); }
    if (hearts) for (let k = 0; k < 3; k++) Jefes.heart(ctx, cx - 36 + k * 36, 28 + 62, 26 * (k === hearts.hearts && hearts.flash > 0 ? 1 + hearts.flash * 0.4 : 1), k < hearts.hearts, ink);
    ctx.restore();

    Fiesta.drawHUD(ctx, W, H, G);
    Modes.drawHUD(ctx, W, H, G);
    if (G.musicLabel) drawMusicLabel(ctx, W, H);

    // ayuda de controles al empezar (con botones táctiles no hace falta)
    if (G.hintsT > 0 && !Touch.enabled) {
      const a = clamp(G.hintsT / 1.5, 0, 1);
      ctx.save(); ctx.globalAlpha = a;
      drawHint(ctx, 28, H - 28, 0, ['A', 'D', 'mover'], ['W', 'saltar'], ['S', 'pegarse'], ['E', 'tirar'], ['Q', 'aflojar']);
      if (!G.vsBot) drawHint(ctx, W - 28, H - 28, 1, ['J', 'L', 'mover'], ['I', 'saltar'], ['K', 'pegarse'], ['O', 'tirar'], ['U', 'aflojar']);
      ctx.restore();
    }
  }

  function drawMusicLabel(ctx, W, H) {
    const L = G.musicLabel;
    L.t += 1 / 60;
    if (L.t > 4) { G.musicLabel = null; return; }
    const a = clamp(Math.min(L.t / 0.3, (4 - L.t) / 0.6), 0, 1);
    const rr = ArenaArt.rr, ink = PALETTE.ink;
    ctx.save(); ctx.globalAlpha = a;
    ctx.font = font(20, 600);
    const w = ctx.measureText(L.text).width + 62, h = 40, x = W / 2 - w / 2, y = H - 30 - h - (G.hintsT > 0 ? 64 : 0) - (G.mode === 'campana' && G.hintsT > 0 ? 66 : 0);
    rr(ctx, x, y, w, h, 20); ctx.fillStyle = 'rgba(40,20,10,0.72)'; ctx.fill();
    // notita
    ctx.fillStyle = '#ffd84d'; ctx.strokeStyle = '#ffd84d'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(x + 22, y + 26, 5, 4, -0.4, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 26.5, y + 25); ctx.lineTo(x + 26.5, y + 11); ctx.quadraticCurveTo(x + 32, y + 14, x + 34, y + 19); ctx.stroke();
    ctx.fillStyle = '#fff6e6'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(L.text, x + 44, y + h / 2 + 1);
    ctx.restore();
    void ink;
  }

  function drawHint(ctx, x, y, side, ...items) {
    const rr = ArenaArt.rr, ink = PALETTE.ink, p = G.players[side];
    ctx.font = font(19, 600);
    // medir
    const parts = [];
    let total = 20;
    for (const it of items) {
      const keys = it.slice(0, -1), label = it[it.length - 1];
      const kw = keys.length * 36 + 4, lw = ctx.measureText(label).width;
      parts.push({ keys, label, kw, lw }); total += kw + lw + 22;
    }
    const h = 54, x0 = side === 0 ? x : x - total;
    ctx.fillStyle = 'rgba(40,20,10,0.25)'; rr(ctx, x0 + 3, y - h + 5, total, h, 16); ctx.fill();
    rr(ctx, x0, y - h, total, h, 16); ctx.fillStyle = '#fff6e6'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
    let cx = x0 + 14;
    for (const pt of parts) {
      for (const k of pt.keys) {
        rr(ctx, cx, y - h + 10, 32, 34, 7); ctx.fillStyle = rgba(p.col.base, 0.25); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = ink; ctx.stroke();
        ctx.fillStyle = ink; ctx.font = font(18, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(k, cx + 16, y - h + 28);
        cx += 36;
      }
      ctx.font = font(19, 600); ctx.textAlign = 'left'; ctx.fillStyle = PALETTE.inkSoft;
      ctx.fillText(pt.label, cx + 4, y - h + 28);
      cx += pt.lw + 26;
    }
  }

  return {
    G, init, update, render, startMatch, startAttract, resetRound, setArena, randomArena,
    chooseArena(id) {
      // el torneo sigue en la arena elegida
      setArena(id || randomArena(G.arenaId));
      G.round++; resetRound();
    },
    restart() { startMatch(G.mode, G.vsBot, G.arenaMode === 'fixed' ? G.firstArena : G.arenaMode, G.fiestaMatch); },
    setWins(n) { G.winsNeeded = n; Store.set('wins', n); },
    applyFlavors,
    setTheme(id) { if (THEMES[id]) { G.theme = id; Store.set('theme', id); } },
    setMusicStyle(id) { G.musicStyle = id; Store.set('musicStyle', id); G.randomTrack = null; pickMusic(true); },
    setFlavor(i, id) {
      if (!FLAVORS[id] || G.flavors[1 - i] === id) return false;
      if (FLAVORS[id].camp && !(Campaign.data.rewards || {})[FLAVORS[id].camp]) return false; // premio de la campaña aún sin ganar
      if (typeof Vestidor !== 'undefined' && Vestidor.V.BY[id] && !Vestidor.V.has(id)) return false; // del Vestidor: todavía no se ha ganado
      G.flavors[i] = id; Store.set('flavors', G.flavors.slice()); applyFlavors(); return true;
    },
    setBotLevel(n) { G.botLevel = n; Store.set('botLevel', n); },
    setHandicap(i, n) { G.handicap[i] = clamp(n, 0, 2); Store.set('handicap', G.handicap.slice()); },
    buzz, hcOn,
  };
})();
