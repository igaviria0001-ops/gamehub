import os
os.chdir('/home/claude/tya/src')
def edit(p, pairs):
    s = open(p).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:70], s.count(old))
        s = s.replace(old, new)
    open(p, 'w').write(s)

edit('07-game.js', [
("""    else id = ARENA_MUSIC[G.arenaId] || 'cumbia';""",
 """    else if (G.mode === 'campana' && ARENA.L && ARENA.L.room) id = Campaign.ZONES[ARENA.L.room.zone].music;
    else id = ARENA_MUSIC[G.arenaId] || 'cumbia';"""),
("""    if (mode === 'jefe') { arenaChoice = (Jefes.BY[G.jefeId] || Jefes.LIST[0]).arena; fiesta = false; }""",
 """    if (mode === 'jefe') { arenaChoice = (Jefes.BY[G.jefeId] || Jefes.LIST[0]).arena; fiesta = false; }
    if (mode === 'campana') { arenaChoice = 'campana'; fiesta = false; }"""),
("""    setArena(first, mode === 'gol' ? 'gol' : mode === 'jefe' ? 'jefe' : null);""",
 """    setArena(first, mode === 'gol' ? 'gol' : mode === 'jefe' ? 'jefe' : mode === 'campana' ? G.campStage : null);"""),
("""    const sp = ARENA.spawns, mass = plan ? plan.mass : 3, len = plan ? plan.len : 400;""",
 """    const sp = ARENA.spawns, mass = plan ? plan.mass : (ARENA.L.mass || 3), len = plan ? plan.len : (ARENA.L.ropeLen || 400);"""),
("""    if (G.mode === 'fuga' || G.mode === 'jefe') { Sound.silenceLoops(); Sound.Music.setMode('menu'); return; }""",
 """    if (G.mode === 'fuga' || G.mode === 'jefe' || G.mode === 'campana') { Sound.silenceLoops(); Sound.Music.setMode('menu'); return; }"""),
("""      } else if (G.mode === 'jefe') {
        if (Jefes.status(G)) endMatch(null);""",
 """      } else if (G.mode === 'jefe') {
        if (Jefes.status(G)) endMatch(null);
      } else if (G.mode === 'campana') {
        const r = Campaign.status(G, dt);
        if (r === 'retry') { G.round++; resetRound(); G.countdownLen = 0.8; }
        else if (r === 'win') endMatch(null);"""),
("""          : [[0, () => FX.banner(G.mode === 'jefe' && Jefes.def ? Jefes.def.name.toUpperCase() : Modes.cfg(G.mode).title,""",
 """          : G.mode === 'campana' ? (G.round > 1 ? [] : [[0, () => { const r = ARENA.L && ARENA.L.room; if (r) FX.banner(r.name.toUpperCase(), { sub: `${Campaign.ZONES[r.zone].name} · sala ${r.idx + 1}`, size: 100, life: 1.2, color: '#ffd84d' }); }]])
          : [[0, () => FX.banner(G.mode === 'jefe' && Jefes.def ? Jefes.def.name.toUpperCase() : Modes.cfg(G.mode).title,"""),
("""      const seq = G.quiet || G.tutorial || G.kickoff || G.reto ? [] :""",
 """      const seq = G.quiet || G.tutorial || G.kickoff || G.reto || (G.mode === 'campana' && G.round > 1) ? [] :"""),
("""  function dunk(p, simultaneous) {
""",
 """  function dunk(p, simultaneous) {
    if (G.mode === 'campana') { Campaign.onFall(p, G); return; }
"""),
("""    else if ((G.mode === 'escalada' || G.mode === 'fuga') && G.state !== 'attract') {""",
 """    else if (G.mode === 'campana' && G.state !== 'attract') { cam.tx = 960; cam.ty = 540; cam.tz = 1; }
    else if ((G.mode === 'escalada' || G.mode === 'fuga') && G.state !== 'attract') {"""),
("""    let hearts = null;
    if (G.mode === 'jefe') {""",
 """    let hearts = null;
    if (G.mode === 'campana') {
      const c = Campaign.centerLabel(G) || { label: 'SALA', sub: '' };
      label = c.label; sub = c.sub; if (c.late) col = '#ffe9c9';
    } else if (G.mode === 'jefe') {"""),
("""    const w = G.mode === 'jefe' ? 290 : 230, h = sub ? 86 : 64;""",
 """    const w = G.mode === 'jefe' ? 290 : G.mode === 'campana' ? 420 : 230, h = sub ? 86 : 64;"""),
("""ctx.font = font(G.mode === 'caneca' || G.mode === 'jefe' ? 30 : sub ? 34 : 40, 700); ctx.fillText(label""",
 """ctx.font = font(G.mode === 'caneca' || G.mode === 'jefe' ? 30 : G.mode === 'campana' ? 28 : sub ? 34 : 40, 700); ctx.fillText(label"""),
])

edit('07d-modos.js', [
("""    jefe: { coop: true, title: '¡A PELEAR!', sub: 'contra el jefe' },""",
 """    jefe: { coop: true, title: '¡A PELEAR!', sub: 'contra el jefe' },
    campana: { coop: true, title: '¡A ESCAPAR!', sub: 'salgan los dos' },"""),
("""    if (G.mode === 'jefe') Jefes.setup(G);""",
 """    if (G.mode === 'jefe') Jefes.setup(G);
    if (G.mode === 'campana') Campaign.setup(G);"""),
("""    if (G.mode === 'jefe') Jefes.update(dt, G);
    if (M.flash > 0)""",
 """    if (G.mode === 'jefe') Jefes.update(dt, G);
    if (G.mode === 'campana') Campaign.update(dt, G);
    if (M.flash > 0)"""),
("""    if (G.mode === 'jefe') Jefes.post(dt, G);
  }""",
 """    if (G.mode === 'jefe') Jefes.post(dt, G);
    if (G.mode === 'campana') Campaign.post(dt, G);
  }"""),
("""drawHUD: (ctx, W, H, G) => { drawClimbHUD(ctx, W, H, G); Jefes.drawHUD(ctx, W, H, G); },""",
 """drawHUD: (ctx, W, H, G) => { drawClimbHUD(ctx, W, H, G); Jefes.drawHUD(ctx, W, H, G); Campaign.drawHUD(ctx, W, H, G); },"""),
("""    isPoints: mode => mode !== 'caneca' && mode !== 'escalada' && mode !== 'fuga' && mode !== 'jefe',""",
 """    isPoints: mode => mode !== 'caneca' && mode !== 'escalada' && mode !== 'fuga' && mode !== 'jefe' && mode !== 'campana',"""),
])
print('ok')
