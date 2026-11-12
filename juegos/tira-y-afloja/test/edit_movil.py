import os
os.chdir('/home/claude/tya/src')
def edit(p, pairs):
    s = open(p).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:70], s.count(old))
        s = s.replace(old, new)
    open(p, 'w').write(s)

edit('01-core.js', [
("""  set(k, v) { try { localStorage.setItem('tya_' + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
};""",
 """  set(k, v) { try { localStorage.setItem('tya_' + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
};
// en celulares y tabletas arrancar con la calidad ligera (se puede cambiar en Opciones)
try { if (matchMedia('(hover: none) and (pointer: coarse)').matches && Store.get('quality', null) === null) Store.set('quality', 'ligera'); } catch (e) { /* sin matchMedia */ }"""),
])
edit('07-game.js', [
("""    musicStyle: Store.get('musicStyle', 'arena'), musicLabel: null, randomTrack: null,""",
 """    musicStyle: Store.get('musicStyle', 'arena'), musicLabel: null, randomTrack: null, autoStick: Store.get('autoStick', true),"""),
("""    const inputs = [0, 1].map(i => {
      if (!G.canControl) return emptyInput();
      if (G.bots[i]) return G.bots[i].think(dt, G);
      return Input.player(i);
    });""",
 """    const inputs = [0, 1].map(i => {
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
      if (p.idleT > 0.28 && (p.stuck || p.sticky > 0.35)) inp.stick = true;
    }"""),
("""      cam.tz = G.state === 'attract' ? 1.06 : clamp(1.36 - d / 2200, 1.1, 1.3);""",
 """      cam.tz = G.state === 'attract' ? 1.06 : clamp(1.36 - d / 2200, 1.1, 1.3) * (Touch.enabled ? 1.08 : 1); // en pantalla chica, un poco más cerca"""),
])
edit('template.html', [
("""          <div class="opt"><label id="l-marks">""",
 """          <div class="opt"><label id="l-auto">Pegarse solo al quedarse quieto (pantallas táctiles)</label><div class="seg" role="group" aria-labelledby="l-auto" data-opt="autostick"><button data-v="1">Sí</button><button data-v="0">No</button></div></div>
          <div class="opt"><label id="l-marks">"""),
])
edit('09-ui.js', [
("""        if (opt === 'marks') { Player.marks = v === '1'; Store.set('marks', Player.marks); }""",
 """        if (opt === 'marks') { Player.marks = v === '1'; Store.set('marks', Player.marks); }
        if (opt === 'autostick') { Game.G.autoStick = v === '1'; Store.set('autoStick', Game.G.autoStick); }"""),
("""    set('marks', Player.marks ? 1 : 0);""", """    set('marks', Player.marks ? 1 : 0); set('autostick', Game.G.autoStick ? 1 : 0);"""),
])
print('ok')
