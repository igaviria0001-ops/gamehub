import os
os.chdir('/home/claude/tya/src')
def edit(p, pairs):
    s = open(p).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:70], s.count(old))
        s = s.replace(old, new)
    open(p, 'w').write(s)

edit('07-game.js', [
("""    const w = 230, h = sub ? 86 : 64;""", """    const w = G.mode === 'jefe' ? 290 : 230, h = sub ? 86 : 64;"""),
("""ctx.font = font(G.mode === 'caneca' ? 30 : sub ? 34 : 40, 700); ctx.fillText(label""", """ctx.font = font(G.mode === 'caneca' || G.mode === 'jefe' ? 30 : sub ? 34 : 40, 700); ctx.fillText(label"""),
])

edit('08-bot.js', [
("""    if (op.alive && hanging(op) && rope.visible) {
      // el rival cuelga""",
 """    if (G.mode === 'jefe' && this.playJefe(G, me, op, inp, sloppy, hanging, edgeDist)) { this.inp = inp; return; }

    if (op.alive && hanging(op) && rope.visible) {
      // el rival cuelga"""),
("""  /* Escalada: buscar la viga más baja""",
 """  /* Jefes (cooperativo): esquivar lo peligroso y pegarle al jefe cuando se puede */
  playJefe(G, me, op, inp, sloppy, hanging, edgeDist) {
    const J = Jefes.state; if (!J || !J.body) return false;
    const B = J.body, bx = B.x + B.w / 2, id = J.def.id;
    inp.left = inp.right = inp.jump = inp.stick = inp.pull = inp.release = false;
    if (me.mass < 2.4) inp.pull = true; else if (me.mass > 4.4 && !me.stuck) inp.release = true;
    this.backT = Math.max(0, (this.backT || 0) - this.react);
    // el compañero cuelga: tirar para subirlo (y anclarse)
    if (op.alive && hanging(op) && G.rope.visible) {
      if (me.onGround) inp.stick = me.sticky > 0.3;
      inp.pull = true; inp.release = false;
      return true;
    }
    const attack = () => {
      // ir al jefe: embestirlo de lado o subir y caerle en picada
      const side = Math.sign(me.x - bx) || 1;
      const touching = me.contacts.some(c => c.R === B);
      if (touching) this.backT = 0.45;
      if (this.backT > 0) { inp.right = side > 0; inp.left = side < 0; return; }
      const high = B.y + B.h < me.y - me.r + 10 ? false : B.y < me.y - 40; // ¿el jefe está por encima de mis pies?
      if (me.onGround && Math.abs(me.x - bx) < B.w / 2 + 160 && (high || Math.random() < 0.35)) this.wantJump(true);
      if (!me.onGround && !me.stuck && Math.abs(me.x - bx) < B.w / 2 - 10 && me.y < B.y - me.r && me.vy > -200) inp.stick = true; // picada
      this.moveTo(me, bx, inp, 8);
    };
    if (id === 'aspiradora') {
      const front = Math.sign(me.x - bx) === J.dir;
      if ((J.state === 'warn' || J.state === 'suck') && front && me.groundR !== B) {
        if (me.onGround || me.contacts.length) inp.stick = me.sticky > 0.25;
        inp.pull = true; inp.release = false;
        if (!me.stuck) this.moveTo(me, bx - J.dir * 700, inp, 30);
      } else if (J.state === 'hot') attack();
      else {
        const heading = Math.sign(me.x - bx) === J.dir && Math.abs(me.x - bx) < 300;
        if (heading && me.onGround && !sloppy) this.wantJump(true);
        const tx = clamp(bx + Math.sign(me.x - bx || 1) * 420, ARENA.deskLeft + 160, ARENA.deskRight - 160);
        this.moveTo(me, tx, inp, 60);
      }
    } else if (id === 'sacapuntas') {
      if ((J.state === 'aim' || J.state === 'slam') && J.target === me) {
        const away = Math.sign(me.x - J.tx) || (me.x < 960 ? 1 : -1);
        let tx = J.tx + away * 340;
        if (tx < ARENA.deskLeft + 120 || tx > ARENA.deskRight - 120) tx = J.tx - away * 340;
        this.moveTo(me, tx, inp, 20);
      } else if (J.state === 'stuck') attack();
      else this.moveTo(me, clamp(bx + (me.x < bx ? -260 : 260), ARENA.deskLeft + 160, ARENA.deskRight - 160), inp, 50);
    } else if (id === 'aseador') {
      if (J.state === 'warn' || J.state === 'sweep') {
        if (me.onGround) inp.stick = me.sticky > 0.25;
        else if (me.contacts.length) inp.stick = true;
      } else if (J.state === 'wait') attack();
      else this.moveTo(me, 960, inp, 80);
    }
    if (edgeDist(me) < 110 && !inp.stick) { const c = me.x < 960 ? 1 : -1; inp.right = c > 0; inp.left = c < 0; }
    return true;
  }

  /* Escalada: buscar la viga más baja"""),
])
print('ok')
