import os
os.chdir('/home/claude/tya/src')
def edit(p, pairs):
    s = open(p).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:70], s.count(old))
        s = s.replace(old, new)
    open(p, 'w').write(s)

edit('07-game.js', [
("""    if (ram && ram.def.stuck) ram.def.unstick('hit', G.rope.strain);""",
 """    if (ram && ram.def.stuck && !ram.def.pinned) ram.def.unstick('hit', G.rope.strain);"""),
("""      if (G.tutorial) Tutorial.onRam(att);""",
 """      if (G.tutorial) Tutorial.onRam(att);
      if (G.reto) Retos.onRam(att, { sling, stomp });"""),
# salvarse del filo
("""Progress.on('saved', { p }); }""",
 """Progress.on('saved', { p }); if (G.reto) Retos.onSaved(p); }"""),
# caneca: los retos deciden
("""    if (G.tutorial) { G.rope.visible = false; G.respawn[p.id] = 1.0; G.cam.focusT = 0.8; return; }""",
 """    if (G.tutorial) { G.rope.visible = false; G.respawn[p.id] = 1.0; G.cam.focusT = 0.8; return; }
    if (G.reto) { G.cam.focus = null; G.cam.focusT = 0; G.slowT = 0.35; Retos.onDunk(p); return; }"""),
# estado: el reto lleva su propio reloj
("""      if (G.tutorial) { Tutorial.update(dt); return; }""",
 """      if (G.tutorial) { Tutorial.update(dt); return; }
      if (G.reto) { Retos.update(dt); return; }"""),
# cuenta regresiva corta con el nombre del reto
("""      const marks = G.quiet || G.tutorial || fo ? [] : G.kickoff""",
 """      const marks = G.quiet || G.tutorial || fo ? [] : G.reto ? [[0, () => FX.banner(G.reto.def.title.toUpperCase(), { size: 110, life: 1.0, color: '#ffd84d' })]] : G.kickoff"""),
("""      const seq = G.quiet || G.tutorial || G.kickoff ? [] :""",
 """      const seq = G.quiet || G.tutorial || G.kickoff || G.reto ? [] :"""),
# limpiar el reto al empezar otra cosa
("""    G.tutorial = null;
    resetRound();
    G.state = 'attract';""",
 """    G.tutorial = null; G.reto = null;
    resetRound();
    G.state = 'attract';"""),
("""G.quiet = false; G.tutorial = null; G.countdownLen = 2.9;""",
 """G.quiet = false; G.tutorial = null; G.reto = null; G.countdownLen = 2.9;"""),
("""    G.countdownLen = G.tutorial ? G.countdownLen :""",
 """    G.countdownLen = G.tutorial || G.reto ? G.countdownLen :"""),
# cámara fija en los retos
("""    if (cam.focus) { cam.tx = cam.focus.x; cam.ty = cam.focus.y; cam.tz = 1.34; }""",
 """    if (cam.focus) { cam.tx = cam.focus.x; cam.ty = cam.focus.y; cam.tz = 1.34; }
    else if (G.reto) { const c = Retos.camera(); cam.tx = c.x; cam.ty = c.y; cam.tz = c.z; }"""),
# estrellas del reto en el mundo
("""    if (G.golden) drawPellet(ctx, G.golden, true);
""",
 """    if (G.golden) drawPellet(ctx, G.golden, true);
    if (G.reto) Retos.drawWorld(ctx, G.t);
"""),
("""{ if (G.tutorial) Tutorial.drawHUD(ctx, W, H); else drawHUD(ctx, W, H); }""",
 """{ if (G.tutorial) Tutorial.drawHUD(ctx, W, H); else if (G.reto) Retos.drawHUD(ctx, W, H); else drawHUD(ctx, W, H); }"""),
])
edit('07e-progreso.js', [
("""   40 logros, accesorios""", """   43 logros, accesorios"""),
("""    ['constante', 'Constante', 'Supera el reto del día 3 días seguidos'],""",
 """    ['constante', 'Constante', 'Supera el reto del día 3 días seguidos'],
    ['retador', 'Retador', 'Supera un reto de técnica'],
    ['medallista', 'Medallista', 'Gana oro en 6 retos de técnica'],
    ['maestro', 'Maestro del chicle', 'Supera los 12 retos de técnica'],"""),
("""    if (G.quiet || G.tutorial) return;""",
 """    if (type === 'reto') {
      unlock(0, 'retador', true);
      if (d.golds >= 6) unlock(0, 'medallista', true);
      if (d.done >= d.total) unlock(0, 'maestro', true);
      return;
    }
    if (G.quiet || G.tutorial) return;
    if (G.reto && !['ram', 'whip', 'saved', 'airjump'].includes(type)) return; // en los retos solo cuentan las jugadas"""),
])
edit('09-ui.js', [
("""`${Progress.count(names[i])}/40 logros""", """`${Progress.count(names[i])}/${Progress.ACH.length} logros"""),
])
print('ok')
