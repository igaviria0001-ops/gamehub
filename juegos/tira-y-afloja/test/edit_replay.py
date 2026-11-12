import os
os.chdir('/home/claude/tya/src')
def edit(p, pairs):
    s = open(p).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:70], s.count(old))
        s = s.replace(old, new)
    open(p, 'w').write(s)

edit('07-game.js', [
# la continuación después de una ronda pasa a una función, y antes del final va la repetición
("""    } else if (S === 'roundEnd') {
      if (G.stateT > (G.quiet ? 1.6 : 2.8)) {
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
    } else if (S === 'matchEnd') {""",
 """    } else if (S === 'roundEnd') {
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
    } else if (S === 'matchEnd') {"""),
("""  function results() {""",
 """  function afterRound() {
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

  function results() {"""),
("""  function update(realDt) {
    G.t += realDt;""",
 """  function update(realDt) {
    G.t += realDt;
    if (G.state === 'replay') { G.stateT += realDt; stateLogic(realDt); FX.update(realDt); return; }"""),
("""    FX.update(realDt);
    updateCamera(realDt);""",
 """    FX.update(realDt);
    updateCamera(realDt);
    record();"""),
("""    const [A, B] = G.players;
    A.drawShadow(ctx); B.drawShadow(ctx);""",
 """    const RP = G.state === 'replay' ? replayFrame() : null;
    const [A, B] = RP ? RP.players : G.players;
    const ropeNow = RP ? RP.rope : G.rope;
    A.drawShadow(ctx); B.drawShadow(ctx);"""),
("""    if (G.rope.visible) G.rope.draw(ctx, A, B, G.t);""",
 """    if (ropeNow.visible) ropeNow.draw(ctx, A, B, G.t);"""),
("""    if (!G.quiet) Progress.drawHUD(ctx, W, H);""",
 """    if (!G.quiet) Progress.drawHUD(ctx, W, H);
    if (G.state === 'replay') drawReplayOverlay(ctx, W, H);"""),
("""  function dunk(p, simultaneous) {
    p.alive = false; p.dunked = true; p.dunkT = 0; p.stuck = false;""",
 """  function dunk(p, simultaneous) {
    p.alive = false; p.dunked = true; p.dunkT = 0; p.stuck = false;
    G.replayMark = G.t;"""),
("""    G.respawn = [0, 0]; G.cdMarks = {}; G.tickSec = -1; G.ropeCut = false; G.kickoff = false;""",
 """    G.respawn = [0, 0]; G.cdMarks = {}; G.tickSec = -1; G.ropeCut = false; G.kickoff = false;
    G.rec = []; G.replayMark = 0; G.replay = null;"""),
])
edit('07d-modos.js', [
("""  function drown(p, G) {
    p.alive = false; p.dunked = true; p.dunkT = 0; p.dunkX = p.x; p.stuck = false; p.mood = 'panic';""",
 """  function drown(p, G) {
    p.alive = false; p.dunked = true; p.dunkT = 0; p.dunkX = p.x; p.stuck = false; p.mood = 'panic';
    G.replayMark = G.t;"""),
("""        M.winner = p.id; p.stats.bells++; ARENA.bellT = 1;""",
 """        M.winner = p.id; p.stats.bells++; ARENA.bellT = 1; G.replayMark = G.t;"""),
])
print('ok')
