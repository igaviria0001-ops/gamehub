import os
os.chdir('/home/claude/tya/src')
def edit(p, pairs):
    s = open(p).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:70], s.count(old))
        s = s.replace(old, new)
    open(p, 'w').write(s)

edit('07-game.js', [
("""    arenaId: 'pupitre', arenaMode: 'fixed', attractRounds: 0, lastLoser: null, tutorial: null,""",
 """    arenaId: 'pupitre', arenaMode: 'fixed', attractRounds: 0, lastLoser: null, tutorial: null, jefeId: 'aspiradora',"""),
("""    if (mode === 'escalada' || mode === 'fuga') arenaChoice = 'torre'; // la torre solo existe para escalar""",
 """    if (mode === 'escalada' || mode === 'fuga') arenaChoice = 'torre'; // la torre solo existe para escalar
    if (mode === 'jefe') { arenaChoice = (Jefes.BY[G.jefeId] || Jefes.LIST[0]).arena; fiesta = false; }"""),
("""    setArena(first, mode === 'gol' ? 'gol' : null);""",
 """    setArena(first, mode === 'gol' ? 'gol' : mode === 'jefe' ? 'jefe' : null);"""),
("""    if (G.mode === 'fuga') { Sound.silenceLoops(); Sound.Music.setMode('menu'); return; }""",
 """    if (G.mode === 'fuga' || G.mode === 'jefe') { Sound.silenceLoops(); Sound.Music.setMode('menu'); return; }"""),
("""        else if (r === 'win') endMatch(null);""",
 """        else if (r === 'win') endMatch(null);
      } else if (G.mode === 'jefe') {
        if (Jefes.status(G)) endMatch(null);"""),
("""          : [[0, () => FX.banner(Modes.cfg(G.mode).title, { size: 110, life: 0.95, color: '#ffd84d' })]];""",
 """          : [[0, () => FX.banner(G.mode === 'jefe' && Jefes.def ? Jefes.def.name.toUpperCase() : Modes.cfg(G.mode).title, { size: G.mode === 'jefe' ? 96 : 110, life: 0.95, color: '#ffd84d' })]];"""),
("""      G.respawn[p.id] = 1.5;
    }
  }""",
 """      G.respawn[p.id] = 1.5;
      if (G.mode === 'jefe') Jefes.onDunk(p, G);
    }
  }"""),
("""      if (G.mode === 'rey' && Modes.throne) pts.push({ x: Modes.throne.x + Modes.throne.w / 2, y: Modes.throne.y });""",
 """      if (G.mode === 'rey' && Modes.throne) pts.push({ x: Modes.throne.x + Modes.throne.w / 2, y: Modes.throne.y });
      if (G.mode === 'jefe') { const bp = Jefes.point(); if (bp) pts.push(bp); }"""),
("""    if (G.mode === 'fuga') {
      label = `NIVEL ${G.fugaLevel || 1}`;""",
 """    let hearts = null;
    if (G.mode === 'jefe') {
      const c = Jefes.centerLabel() || { label: 'JEFE', hearts: 3, flash: 0 };
      label = c.label; sub = ' '; hearts = c;
      if (c.flash > 0) col = '#ffd9d3';
    } else if (G.mode === 'fuga') {
      label = `NIVEL ${G.fugaLevel || 1}`;"""),
("""    if (sub) { ctx.font = font(20, 700); ctx.fillStyle = G.suddenDeath ? '#d23b2a' : PALETTE.inkSoft; ctx.fillText(sub, cx, 28 + 62); }""",
 """    if (sub) { ctx.font = font(20, 700); ctx.fillStyle = G.suddenDeath ? '#d23b2a' : PALETTE.inkSoft; ctx.fillText(sub, cx, 28 + 62); }
    if (hearts) for (let k = 0; k < 3; k++) Jefes.heart(ctx, cx - 36 + k * 36, 28 + 62, 26 * (k === hearts.hearts && hearts.flash > 0 ? 1 + hearts.flash * 0.4 : 1), k < hearts.hearts, ink);"""),
])

edit('07d-modos.js', [
("""    fuga: { coop: true, title: '¡A ESCAPAR!', sub: 'suban los dos' },""",
 """    fuga: { coop: true, title: '¡A ESCAPAR!', sub: 'suban los dos' },
    jefe: { coop: true, title: '¡A PELEAR!', sub: 'contra el jefe' },"""),
("""  function setup(G) {
    clear();""",
 """  function setup(G) {
    clear();
    Jefes.clear();
    if (G.mode === 'jefe') Jefes.setup(G);"""),
("""    if (G.mode === 'gol') updateBall(dt, G);
    if (M.flash > 0)""",
 """    if (G.mode === 'gol') updateBall(dt, G);
    if (G.mode === 'jefe') Jefes.update(dt, G);
    if (M.flash > 0)"""),
("""    if (G.mode === 'escalada' || G.mode === 'fuga') postEscalada(G);
  }""",
 """    if (G.mode === 'escalada' || G.mode === 'fuga') postEscalada(G);
    if (G.mode === 'jefe') Jefes.post(dt, G);
  }"""),
("""    if (G.mode === 'gol') { drawGoals(ctx, G, t); drawBall(ctx, G, t); }
  }""",
 """    if (G.mode === 'gol') { drawGoals(ctx, G, t); drawBall(ctx, G, t); }
    if (G.mode === 'jefe') Jefes.drawWorld(ctx, G, t);
  }"""),
("""drawHUD: (ctx, W, H, G) => drawClimbHUD(ctx, W, H, G),""",
 """drawHUD: (ctx, W, H, G) => { drawClimbHUD(ctx, W, H, G); Jefes.drawHUD(ctx, W, H, G); },"""),
("""    isPoints: mode => mode !== 'caneca' && mode !== 'escalada' && mode !== 'fuga',""",
 """    isPoints: mode => mode !== 'caneca' && mode !== 'escalada' && mode !== 'fuga' && mode !== 'jefe',"""),
])
print('ok')
