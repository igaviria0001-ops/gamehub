import os
os.chdir('/home/claude/tya/src')
def edit(p, pairs):
    s = open(p).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:70], s.count(old))
        s = s.replace(old, new)
    open(p, 'w').write(s)

edit('07-game.js', [
("""  function applyFlavors() {
    G.players.forEach((p, i) => { p.col = FLAVORS[G.flavors[i]]; p.name = p.col.name; });
  }""",
 """  function applyFlavors() {
    G.players.forEach((p, i) => { p.col = FLAVORS[G.flavors[i]]; p.name = p.col.name; p.acc = typeof Progress !== 'undefined' && !(G.bots && G.bots[i]) ? Progress.accOf(i) : 'ninguno'; });
  }"""),
("""    if (ARENA.id !== id || (ARENA.variant || null) !== variant) { ARENA.load(id, variant); if (ArenaArt.bg) ArenaArt.rebuild(); }
  }""",
 """    if (ARENA.id !== id || (ARENA.variant || null) !== variant) { ARENA.load(id, variant); if (ArenaArt.bg) ArenaArt.rebuild(); }
    Progress.on('arena', { id });
  }"""),
("""    G.bots = [null, vsBot ? new Bot(1, G.botLevel) : null];""",
 """    G.bots = [null, vsBot ? new Bot(1, G.daily ? G.daily.level : G.botLevel) : null];
    applyFlavors();"""),
("""    G.randomTrack = null;
    resetRound();
    Sound.Music.setMode('game');""",
 """    G.randomTrack = null;
    resetRound();
    Sound.Music.setMode('game');
    Progress.on('start');"""),
("""      const sling = att.slingT > 0;""",
 """      const sling = att.slingT > 0;
      Progress.on('ram', { att, def, sling, stomp });"""),
("""        o.whipT = 2.5; p.stats.whips++;""",
 """        o.whipT = 2.5; p.stats.whips++; Progress.on('whip', { p });"""),
("""          case 'stick':
            sfx('stick');""",
 """          case 'stick':
            Progress.on('stick', { p });
            sfx('stick');"""),
("""          case 'airjump':
            sfx('jump', p.mass * 0.6);""",
 """          case 'airjump':
            Progress.on('airjump', { p });
            sfx('jump', p.mass * 0.6);"""),
("""    G.wins[winnerId]++;""",
 """    G.wins[winnerId]++;
    Progress.on('round', { winner: winnerId, suddenDeath: G.suddenDeath });"""),
("""  function endMatch(winnerId) {
    G.state = 'matchEnd'; G.stateT = 0; G.canControl = false; G.lastWinner = winnerId;
    if (G.quiet) return;""",
 """  function endMatch(winnerId) {
    G.state = 'matchEnd'; G.stateT = 0; G.canControl = false; G.lastWinner = winnerId;
    if (G.quiet) return;
    Progress.on('match', { winner: winnerId });"""),
("""            G.points[p.id] += pts; p.stats.pellets += pts;""",
 """            G.points[p.id] += pts; p.stats.pellets += pts; Progress.on('pellet', { p, gold: pl.gold });"""),
("""            p.setMass(p.mass + 1.2); p.stats.pellets++;""",
 """            p.setMass(p.mass + 1.2); p.stats.pellets++; Progress.on('pellet', { p, gold: true });"""),
("""        if (p.wasHanging && p.onGround && p.y < ARENA.deskY) { if (!G.quiet) { FX.callout('¡SALVADA!', p.x, p.y - p.r - 30, '#9dffb0', 44); sfx('callout'); } }""",
 """        if (p.wasHanging && p.onGround && p.y < ARENA.deskY) { if (!G.quiet) { FX.callout('¡SALVADA!', p.x, p.y - p.r - 30, '#9dffb0', 44); sfx('callout'); } Progress.on('saved', { p }); }"""),
("""    const other = G.players[1 - p.id];""",
 """    const other = G.players[1 - p.id];
    Progress.on('dunk', { victim: p, by: other.alive ? other : null, ropeCut: G.ropeCut });"""),
("""    FX.drawBanners(ctx, W, H, 1);""",
 """    FX.drawBanners(ctx, W, H, 1);
    if (!G.quiet) Progress.drawHUD(ctx, W, H);"""),
("""      const extra = G.vsBot && i === 1 ? ' · máquina' : '';
      ctx.fillText(`peso ${peso}${extra}`, tx, y + 64);""",
 """      const who = G.vsBot && i === 1 ? 'máquina' : Progress.names[i];
      ctx.fillText(`${who} · peso ${peso}`, tx, y + 64);"""),
])
edit('03i-profe.js', [
("""        if (!G.quiet) { FX.callout('¡CATAPULTA!', p.x, p.y - p.r - 50, '#ffd84d', 54, 1.2); Sound.play('whoosh'); FX.speedLines(p.x, p.y, -Math.PI / 2, p.col.light); }""",
 """        if (!G.quiet) { FX.callout('¡CATAPULTA!', p.x, p.y - p.r - 50, '#ffd84d', 54, 1.2); Sound.play('whoosh'); FX.speedLines(p.x, p.y, -Math.PI / 2, p.col.light); }
        Progress.on('catapult', { p });"""),
])
edit('07d-modos.js', [
("""        const kick = (p.moveDir && p.moveDir === Math.sign(nx)) || p.slingT > 0 || p.diveT > 0;""",
 """        const kick = (p.moveDir && p.moveDir === Math.sign(nx)) || p.slingT > 0 || p.diveT > 0;
        M.lastSling = p.slingT > 0 ? p.id : null;"""),
("""        const own = M.lastTouch !== null && M.lastTouch !== scorer;
        M.goalT = 2.4;""",
 """        const own = M.lastTouch !== null && M.lastTouch !== scorer;
        Progress.on('goal', { scorer, own, sling: M.lastSling === scorer && M.lastTouch === scorer });
        M.goalT = 2.4;"""),
("""        M.winner = p.id; p.stats.bells++; ARENA.bellT = 1;""",
 """        M.winner = p.id; p.stats.bells++; ARENA.bellT = 1;
        Progress.on('bell', { p, t: G.roundT });"""),
])
edit('07c-fiesta.js', [
("""  function applyMods(id) {
    clearMods();
    F.cur = id;""",
 """  function applyMods(id) {
    clearMods();
    F.cur = id;
    if (typeof Progress !== 'undefined') Progress.on('fiesta', { id });"""),
# sorpresa fija (reto del día)
("""  function draw(G) {
    const pool = MODS.filter(m => allowed(m, G));""",
 """  function draw(G) {
    if (F.forced && BY[F.forced]) { F.last = F.forced; return F.forced; }
    const pool = MODS.filter(m => allowed(m, G));"""),
("""    get on() { return F.on; }, setOn, roll, off, tick, update, drawWorld, drawHUD,""",
 """    get on() { return F.on; }, setOn, roll, off, tick, update, drawWorld, drawHUD,
    force(id) { F.forced = id || null; },"""),
])
edit('07b-tutorial.js', [
("""        if (STEPS[tu.step].id === 'done') { FX.confetti(960, 200, 120, 1400); Sound.play('win'); }""",
 """        if (STEPS[tu.step].id === 'done') { FX.confetti(960, 200, 120, 1400); Sound.play('win'); Progress.on('tutorial', { solo: tu.solo }); }"""),
])
print('ok')
