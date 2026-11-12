import os
os.chdir('/home/claude/tya/src')
def edit(p, pairs):
    s = open(p).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:70], s.count(old))
        s = s.replace(old, new)
    open(p, 'w').write(s)

edit('07f-retos.js', [
("""    const by = def.dummy.on - massRadius(dm);
    A.reset(def.player[0], def.player[1] === FLOOR ? FLOOR : def.player[1], 3);
    B.reset(def.dummy.x, by, dm);
    B.y = by;
""", """    A.reset(def.player[0], def.player[1], 3);
    B.reset(def.dummy.x, def.dummy.on, dm);
    const by = B.y;
"""),
])
edit('05-player.js', [
("""    this.stun = 0; this.inv = 0; this.anchor = false; this.slingT = 0;""",
 """    this.stun = 0; this.inv = 0; this.anchor = false; this.pinned = false; this.slingT = 0;"""),
("""      const taut = game.rope && game.rope.visible && strain > 1.03;""",
 """      const taut = game.rope && game.rope.visible && strain > 1.03 && !this.pinned;"""),
("""      else if (!inp.stick || !canAct) this.unstick('let', strain, game);""",
 """      else if ((!inp.stick || !canAct) && !this.pinned) this.unstick('let', strain, game);"""),
])
edit('07-game.js', [
("""    if (ram && ram.def.stuck) ram.def.unstick('hit', G.rope.strain);""",
 """    if (ram && ram.def.stuck && !ram.def.pinned) ram.def.unstick('hit', G.rope.strain);"""),
("""      if (G.tutorial) Tutorial.onRam(att);""",
 """      if (G.tutorial) Tutorial.onRam(att);
      if (G.reto) Retos.onRam(att, { sling, stomp });"""),
("""        if (wasHanging_placeholder) {}""", """"""),
])
