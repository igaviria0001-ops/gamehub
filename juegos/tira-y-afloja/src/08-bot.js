/* =========================================================================
   BOT — juega con las mismas teclas que una persona (y se equivoca a veces)
   nivel 0 = Novato, 1 = Masticador, 2 = Leyenda
   ========================================================================= */
class Bot {
  constructor(id, level = 1) {
    this.id = id; this.level = level;
    this.inp = emptyInput();
    this.thinkT = 0; this.jumpHold = 0; this.react = [0.3, 0.17, 0.09][level];
    this.err = [0.25, 0.1, 0.03][level];
    this.plan = null; this.stickT = 0; this.wander = rnd(-200, 200); this.wanderT = 0;
  }

  think(dt, G) {
    this.thinkT -= dt;
    this.jumpHold -= dt;
    this.wanderT -= dt;
    if (this.wanderT <= 0) { this.wander = rnd(-260, 260); this.wanderT = rnd(1.5, 3.5); }
    if (this.thinkT <= 0) {
      this.thinkT = this.react * rnd(0.7, 1.3);
      const me = G.players[this.id];
      if (me.alive) this.decide(G, me, G.players[1 - this.id]);
    }
    const out = Object.assign({}, this.inp);
    out.jump = this.jumpHold > 0;
    return out;
  }

  /* Fuga (cooperativo): rejas con botones. Si el compañero está del otro lado de una reja cerrada, pisar el botón de mi lado */
  playGates(G, me, op, inp) {
    const gates = ARENA.gates || [];
    for (const R of gates) {
      const meBelow = me.y > R.y, opBelow = op.y > R.y;
      if (Math.abs(me.y - R.y) > 520) continue;
      if (meBelow === opBelow && !(meBelow && op.y < R.y + 260 && me.y < R.y + 260)) continue;
      // los dos abajo y cerca: uno pisa el botón de abajo (el que esté más cerca de él) y el otro pasa
      let B = null;
      if (meBelow && opBelow) { const b = R.buttons.find(x => !x.top); if (Math.abs(me.x - (b.x + b.w / 2)) <= Math.abs(op.x - (b.x + b.w / 2))) B = b; }
      else if (!meBelow && opBelow) B = R.buttons.find(x => x.top);   // yo arriba: le abro desde arriba
      else if (meBelow && !opBelow) { if (R.open > 0.6) return false; continue; } // él arriba: que me abra; yo intento pasar
      if (!B) continue;
      const bx = B.x + B.w / 2;
      const onB = (me.onGround && me.groundR === B);
      if (!onB) {
        this.moveTo(me, bx, inp, 12);
        if (me.onGround && B.y < me.y - 20 && Math.abs(bx - me.x) < 200) this.wantJump(true);
        if (!me.onGround && me.airJumps > 0 && me.vy > -100 && me.y > B.y) this.wantJump(true);
      }
      // quieto en el botón hasta que el otro pase
      if (onB && Math.abs(bx - me.x) > 20) { inp.right = bx > me.x; inp.left = bx < me.x; }
      inp.release = me.mass > 2.2 && op.y > me.y; // darle hilo para que suba
      return true;
    }
    return false;
  }

  /* Jefes (cooperativo): esquivar lo peligroso y pegarle al jefe cuando se puede */
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
        // en el aviso, alejarse de la boca; al aspirar, pegarse y ponerse pesado
        const fx = J.dir > 0 ? B.x + B.w : B.x;
        if (J.state === 'suck' || J.stateT > 0.85 || Math.abs(me.x - fx) > 520) { if (me.onGround || me.contacts.length || me.stuck) inp.stick = me.sticky > 0.2; inp.pull = true; inp.release = false; }
        if (!me.stuck) this.moveTo(me, clamp(fx + J.dir * 700, ARENA.deskLeft + 90, ARENA.deskRight - 90), inp, 30);
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
    } else if (id === 'fotocopiadora') {
      // aviones: bajo = saltar, medio = pegarse, alto = quieto
      const inc = J.planes.filter(P => Math.sign(P.vx) === Math.sign(me.x - P.x) && Math.abs(P.x - me.x) < 300);
      const lane = inc.length ? inc[0].lane : (J.lane >= 0 && J.laneT > 0.3 ? J.lane : -1);
      const close = inc.length && Math.abs(inc[0].x - me.x) < 190;
      if (lane === 1 && (close || J.lane === 1)) { if (me.onGround || me.stuck) inp.stick = me.sticky > 0.3; }
      else if (lane === 0 && close && me.onGround && !sloppy) this.wantJump(true);
      else if (lane === 2 && (close || J.lane === 2)) { /* quieto */ }
      else if (J.state === 'jam') attack();
      else if (J.copies.length) {
        const c = J.copies.filter(c => c.t >= 0).sort((a, b) => Math.abs(a.x - me.x) - Math.abs(b.x - me.x))[0];
        if (c) { this.moveTo(me, c.x, inp, 10); if (me.onGround && Math.abs(c.x - me.x) < 170) this.wantJump(true); }
      } else this.moveTo(me, clamp(bx - J.side * 520, ARENA.deskLeft + 140, ARENA.deskRight - 140), inp, 60);
    } else if (id === 'microondas') {
      const tileAt = x => J.tiles.find(T => x >= T.x0 && x < T.x1);
      const mine = tileAt(me.x);
      const kern = J.kernels.find(k => k.land && Math.hypot(k.x - me.x, k.y - me.y) < 170);
      if (mine && mine.st !== 'cool' && Math.abs(me.y + me.r - ARENA.deskY) < 40) {
        // ir a la baldosa fría más cercana
        let best = null; for (const T of J.tiles) if (T.st === 'cool') { const cx = (T.x0 + T.x1) / 2; if (!best || Math.abs(cx - me.x) < Math.abs(best - me.x)) best = cx; }
        if (best !== null) this.moveTo(me, best, inp, 20); else if (me.onGround) this.wantJump(true);
      } else if (kern) { if (me.onGround) inp.stick = me.sticky > 0.3; }
      else if (J.state === 'ding') attack();
      else this.moveTo(me, me.x < 960 ? 560 : 1360, inp, 80);
    } else if (id === 'reloj') {
      const pend = J.pend, near = pend && Math.hypot(pend.x - me.x, pend.y - me.y) < 150 && (me.x - pend.x) * pend.vx > 0;
      const gear = J.gears.find(g => g.t < g.warn && Math.abs(g.x - me.x) < 90);
      if (J.state === 'warn' || J.state === 'warn2' || near) { if (me.onGround || me.contacts.length || me.stuck) inp.stick = me.sticky > 0.25; }
      else if (gear) this.moveTo(me, me.x + (me.x < gear.x ? -200 : 200), inp, 20);
      else if (J.state === 'cuckoo') {
        // ponerse debajo del cucú y saltar hacia él
        this.moveTo(me, 960 + (me.id ? 40 : -40), inp, 30);
        if (me.onGround && Math.abs(me.x - 960) < 90) this.wantJump(true);
      } else this.moveTo(me, me.id ? 1250 : 670, inp, 60);
    }
    if (edgeDist(me) < 110 && !inp.stick) { const c = me.x < 960 ? 1 : -1; inp.right = c > 0; inp.left = c < 0; }
    return true;
  }

  /* Campaña con la máquina de compañera: seguir al jugador, no caerse y ayudar con el hilo */
  playCampana(G, me, op, inp) {
    const L = ARENA.L, objs = (L && L.objs) || [];
    inp.left = inp.right = inp.jump = inp.stick = inp.pull = inp.release = false;
    const dir = Math.sign(op.x - me.x) || 1, dx = op.x - me.x;
    // peligros con aviso: quieto o pegado
    const eye = objs.find(o => o.kind === 'eye' && (o.state === 'open' || o.warn) && me.x > o.zx && me.x < o.zx + o.zw);
    const bell = objs.find(o => o.kind === 'bell' && (o.warn > 0.2) && Math.hypot(me.x - o.x, me.y - o.y) < o.radius);
    const pend = objs.find(o => o.kind === 'pendulum' && Math.hypot(o.x - me.x, o.y - me.y) < 140 && (me.x - o.x) * o.vx > 0);
    if (bell || pend) { if (me.onGround || me.stuck || me.contacts.length) inp.stick = me.sticky > 0.25; return true; }
    // si la compañera está agarrada a algo arriba y yo cuelgo, tirar para subir
    if (op.stuck && me.y > op.y + 120 && !me.onGround) { inp.pull = true; return true; }
    // si el otro cuelga debajo de mí: anclarme y tirar (lo subo)
    if (op.alive && G.rope.visible && op.y > me.y + 140 && !op.onGround && me.onGround) { inp.stick = me.sticky > 0.3; inp.pull = true; return true; }
    if (eye && me.onGround) return true; // la bibliotecaria mira: no moverse
    // si el otro llegó a la puerta, entrar también
    const E = L && L.exit;
    if (E && Math.abs(op.x - E.x) < 120 && Math.abs(op.y - E.y) < 200 && Math.abs(me.y - E.y) < 220 && Math.abs(me.x - E.x) < 420) { this.moveTo(me, E.x + (me.x < E.x ? -20 : 20), inp, 12); return true; }
    // seguir a una distancia prudente, sin tirarse a los huecos
    const want = Math.abs(dx) > 170;
    if (want) {
      const ahead = ARENA.groundBelow(me.x + dir * (me.r + 30), me.y - 40);
      const gap = me.onGround && ahead > me.y + me.r + 120;
      const opAcross = Math.abs(dx) > 120;
      const taut = G.rope.visible && G.rope.strain > 0.97;
      if (gap) {
        // saltar el hueco si el otro ya está al otro lado (o si el hilo me va a arrastrar igual)
        if (opAcross && ((op.onGround || op.stuck) && op.y < me.y + 80 || taut)) { inp.right = dir > 0; inp.left = dir < 0; this.wantJump(true); }
        else if (taut && me.onGround) inp.stick = me.sticky > 0.3; // aguantar en el borde
      } else { inp.right = dir > 0; inp.left = dir < 0; if (me.onGround && this.obstacleAhead(me, dir)) this.wantJump(true); }
    }
    // el otro está muy arriba: buscar una cama elástica o un vapor cerca
    if (op.y < me.y - 200 && me.onGround) {
      const tr = ARENA.solids.find(R => R.kind === 'tramp' && Math.abs(R.x + R.w / 2 - me.x) < 500 && Math.abs(R.y - (me.y + me.r)) < 40);
      const gy = objs.find(o => o.geyser && o.on && Math.abs(o.x + o.w / 2 - me.x) < 420);
      const T = tr ? tr.x + tr.w / 2 : gy ? gy.x + gy.w / 2 : null;
      if (T !== null) { inp.left = T < me.x - 10; inp.right = T > me.x + 10; if (gy && Math.abs(T - me.x) < 60) this.wantJump(true); }
    }
    // colgando del hilo: tirar para subir hacia el otro
    if (!me.onGround && !me.stuck && op.y < me.y - 100 && G.rope.visible && G.rope.strain > 0.95) inp.pull = true;
    // subir donde está el otro
    if (me.onGround && op.onGround && op.y < me.y - 90 && Math.abs(dx) < 260) this.wantJump(true);
    if (!me.onGround && !me.stuck && me.airJumps > 0 && me.vy > 0 && op.y < me.y - 60 && Math.abs(dx) < 220) this.wantJump(true);
    // peso: copiar al compañero (si se aliviana para el papel o la cama elástica, yo también)
    const paper = objs.find(o => o.kind === 'paper' && !o.solidOff && Math.abs(o.x + o.w / 2 - me.x) < o.w / 2 + 260);
    if (!inp.pull && !inp.release) {
      if (paper && me.mass > paper.max - 0.15) inp.release = true;
      else if (op.mass < me.mass - 0.35 && me.mass > 1.6) inp.release = true;
      else if (op.mass > me.mass + 0.35 && me.mass < 4.5 && !paper) inp.pull = true;
    }
    return true;
  }

  /* Escalada: buscar la viga más baja que esté encima, ponerse debajo y saltar (salto doble en la cima) */
  playEscalada(G, me, op, inp, sloppy) {
    const top = ARENA.L.topY, bell = ARENA.L.bell;
    // peso: liviano salta más, pero no tanto que el otro te arrastre
    inp.pull = me.mass < 1.9; inp.release = me.mass > 3.1 && !me.stuck;
    let best = null, bs = 1e9;
    const feet = me.y + me.r;
    for (const P of ARENA.oneway) {
      if (P.y > feet - 30 || P.y < feet - 360 || P.gone > 0) continue;
      const cx = clamp(me.x, P.x + 26, P.x + P.w - 26);
      const score = (feet - P.y) + Math.abs(cx - me.x) * 0.9 + (P.kind === 'crumble' ? 60 : 0);
      if (score < bs) { bs = score; best = P; }
    }
    if (me.y < top + 40) { this.moveTo(me, bell.x, inp, 20); if (me.onGround) this.wantJump(true); }
    else if (best) {
      const tx = clamp(me.x, best.x + 30, best.x + best.w - 30);
      this.moveTo(me, tx, inp, 16);
      if (me.onGround && Math.abs(tx - me.x) < 70) this.wantJump(true);
      // salto doble cerca de la cima del salto si todavía no llega
      if (!me.onGround && !me.stuck && me.airJumps > 0 && me.vy > -150 && me.y + me.r > best.y + 6 && this.level > 0) this.wantJump(true);
    } else {
      // no hay viga a la vista: ir hacia el centro y probar suerte
      this.moveTo(me, 960, inp, 60);
      if (me.onGround && Math.random() < 0.3) this.wantJump(true);
    }
    // si el hilo me jala hacia abajo, pegarse a lo que tenga para no caer
    const T = G.rope.visible && op.alive ? G.rope.tension : 0;
    const myDir = this.id === 0 ? G.rope.dirA : G.rope.dirB;
    if (T > me.mass * PHYS.g * 0.5 && myDir.y > 0.4 && me.onGround && me.sticky > 0.4 && this.level > 0) { inp.stick = true; inp.pull = false; }
    if (me.stuck && (me.sticky < 0.35 || !(T > me.mass * PHYS.g * 0.3))) inp.stick = false;
    // si el otro está arriba anclado, trepar por el hilo
    if (op.alive && op.y < me.y - 120 && op.stuck && G.rope.visible && me.mass < 4) inp.pull = true;
    // el agua está cerca: saltar ya
    if (Modes.waterY !== undefined && feet > Modes.waterY - 140 && me.onGround) this.wantJump(true);
    if (sloppy) { const l = inp.left; inp.left = inp.right; inp.right = l; }
  }

  /* Rey del borrador: subirse, quedarse en el centro, anclarse cuando llega el otro, o sacarlo */
  playRey(G, me, op, inp, sloppy, edgeDist) {
    const T = Modes.throne, tc = T.x + T.w / 2;
    const onMe = me.groundR === T || me.stuckR === T;
    const onOp = op.alive && (op.groundR === T || op.stuckR === T);
    const near = Math.hypot(op.x - me.x, op.y - me.y) < me.r + op.r + 70;
    if (onMe) {
      const dx = tc - me.x;
      if (Math.abs(dx) > 18 && !me.stuck) { inp.right = dx > 0; inp.left = dx < 0; }
      // anclarse solo si ya estoy en el centro; si no, empujar al otro hacia el borde
      const centered = Math.abs(dx) < Math.abs(op.x - tc);
      if ((onOp || near) && centered && me.sticky > 0.45 && this.level > 0) inp.stick = true;
      if (onOp && !me.stuck && !centered) { inp.right = op.x > me.x; inp.left = op.x < me.x; }
      if (me.stuck && me.sticky < 0.35) inp.stick = false;
      if (me.mass < 4.2) inp.pull = true;
    } else {
      if (onOp && Math.abs(op.x - me.x) < 280 && Math.abs(op.y - me.y) < 150) {
        inp.right = op.x > me.x; inp.left = op.x < me.x; // embestirlo
        if (op.y < me.y - 30 && me.onGround) this.wantJump(true);
      } else this.moveTo(me, tc + T.dir * 30, inp, 18);
      if (T.y < me.y - 10 && Math.abs(tc - me.x) < T.w / 2 + 90 && me.onGround) this.wantJump(true);
      if (!me.onGround && me.airJumps > 0 && me.vy > 120 && T.y < me.y && Math.abs(tc - me.x) < T.w / 2 + 40 && this.level > 0) this.wantJump(true);
      if (me.mass > 4 && !onOp) inp.release = true; // liviano para llegar primero
      if (me.mass < 2.4) inp.pull = true;
    }
    if (edgeDist(me) < 70 && !onMe) { const c = sign(960 - me.x); inp.right = c > 0; inp.left = c < 0; }
    if (sloppy) { const l = inp.left; inp.left = inp.right; inp.right = l; }
    return true;
  }

  /* Gol de canica: ponerse detrás de la canica y empujarla hacia el arco del otro */
  playGol(G, me, op, inp, sloppy) {
    const b = Modes.ball;
    if (Modes.goalT > 0) { this.moveTo(me, me.id === 0 ? 760 : 1160, inp, 40); return true; }
    const att = me.id === 0 ? 1 : -1; // hacia dónde ataco
    const behindX = b.x - att * (b.r + me.r + 10);
    const behind = (b.x - me.x) * att > -6;
    if (me.mass < 2.4) inp.pull = true; else if (me.mass > 4.6) inp.release = true;
    if (behind) {
      if (Math.abs(me.x - behindX) > 46) this.moveTo(me, behindX, inp, 10);
      else { inp.right = att > 0; inp.left = att < 0; }
      // cabezazo / salto si la canica viene alta
      if (b.y < me.y - me.r * 0.6 && Math.abs(b.x - me.x) < 110 && me.onGround) this.wantJump(b.y < me.y - 120);
      // picada si la canica está debajo
      if (this.level === 2 && !me.onGround && b.y > me.y + 40 && Math.abs(b.x - me.x) < 40) inp.stick = true;
    } else {
      // estoy del lado equivocado: rodearla saltando por encima
      this.moveTo(me, b.x - att * 220, inp, 20);
      if (Math.abs(b.x - me.x) < 140 && me.onGround) this.wantJump(true);
    }
    // si la canica va rápido hacia mi arco y estoy entre ella y el arco, frenarla de frente
    const toward = b.vx * -att > 500 && (me.x - b.x) * -att > 0;
    if (toward && Math.abs(b.y - me.y) < 120) { inp.right = b.x > me.x; inp.left = b.x < me.x; }
    if (sloppy) { const l = inp.left; inp.left = inp.right; inp.right = l; }
    return true;
  }

  wantJump(full = true) { if (this.jumpHold <= -0.05) this.jumpHold = full ? 0.32 : 0.12; }

  obstacleAhead(me, dir) {
    const px = me.x + dir * (me.r + 34), py = me.y + me.r * 0.3;
    for (const R of ARENA.solids) if (px > R.x && px < R.x + R.w && py > R.y && py < R.y + R.h && R.kind !== 'deskBody') return true;
    return false;
  }

  moveTo(me, tx, inp, tol = 30) {
    const dx = tx - me.x;
    if (Math.abs(dx) > tol) { inp.right = dx > 0; inp.left = dx < 0; }
    const dir = sign(dx);
    if (dir && me.onGround && this.obstacleAhead(me, dir)) this.wantJump(true);
  }

  decide(G, me, op) {
    const inp = emptyInput();
    const rope = G.rope;
    const dl = ARENA.deskLeft, dr = ARENA.deskRight, dy = ARENA.deskY, cx = 960;
    const hanging = p => p.alive && p.y - p.r > dy - 6 && (p.x < dl + 8 || p.x > dr - 8);
    const edgeDist = p => Math.min(p.x - dl, dr - p.x);
    const towardCenter = sign(cx - me.x) || 1;
    const myDir = this.id === 0 ? rope.dirA : rope.dirB;
    const T = rope.visible && op.alive ? rope.tension : 0;
    const pulledOut = T > me.mass * PHYS.g * 0.45 && sign(myDir.x) === -towardCenter;
    const sloppy = Math.random() < this.err;

    // administrar el peso: ni tan liviano ni tan pesado
    if (me.mass < 2.2) inp.pull = true;
    else if (me.mass > 5.2 && !me.stuck && !hanging(op)) inp.release = true;

    if ((G.mode === 'escalada' || G.mode === 'fuga') && ARENA.L.topY !== undefined) {
      if (G.mode === 'fuga' && this.playGates(G, me, op, inp)) { this.inp = inp; return; }
      this.playEscalada(G, me, op, inp, sloppy); this.inp = inp; return;
    }

    if (hanging(me)) {
      // colgando sobre la caneca: trepar, pegarse a la pared del pupitre
      inp.pull = true; inp.release = false;
      inp.right = towardCenter > 0; inp.left = towardCenter < 0;
      if (me.contacts.length && me.sticky > 0.35) inp.stick = true;
      if (me.stuck && me.sticky < 0.4) { inp.stick = false; this.wantJump(true); }
      // salto doble para volver (los mejores lo usan a tiempo)
      if (this.level > 0 && !me.onGround && !me.stuck && me.airJumps > 0 && me.vy > 150 && Math.random() < 0.5 + this.level * 0.2) this.wantJump(true);
      this.inp = inp; return;
    }

    if (G.mode === 'campana') { this.playCampana(G, me, op, inp); this.inp = inp; return; }
    if (G.mode === 'jefe' && this.playJefe(G, me, op, inp, sloppy, hanging, edgeDist)) { this.inp = inp; return; }

    if (op.alive && hanging(op) && rope.visible) {
      // el rival cuelga: anclarse y soltar hilo para que caiga
      if (me.onGround || me.stuck) inp.stick = me.sticky > 0.3;
      if (me.stuck || !me.onGround) { inp.release = me.mass > 1.4 && !sloppy; inp.pull = false; }
      if (!me.stuck) this.moveTo(me, cx, inp, 60);
      this.inp = inp; return;
    }

    const wind = ARENA.windAt(me.x, me.y);
    const push = ARENA.mods.push || ARENA.pushWarn * 1000;
    const blownOut = (wind && sign(wind) === -towardCenter && Math.abs(wind) / me.mass > 450) || (push && sign(push) === -towardCenter);
    if ((pulledOut || blownOut) && edgeDist(me) < 380 && me.sticky > 0.35 && (me.onGround || me.contacts.length)) {
      inp.stick = true; inp.pull = !sloppy; inp.release = false;
      this.inp = inp; return;
    }

    if (G.mode === 'rey' && Modes.throne && this.playRey(G, me, op, inp, sloppy, edgeDist)) { this.inp = inp; return; }
    if (G.mode === 'gol' && Modes.ball && this.playGol(G, me, op, inp, sloppy)) { this.inp = inp; return; }

    // chicle dorado o chicles del modo Atrapa chicles
    let target = null;
    if (G.mode === 'chicles' && G.pellets.length) {
      let best = 1e9;
      for (const pl of G.pellets) {
        const d = Math.hypot(pl.x - me.x, (pl.y - me.y) * 1.6) * (pl.gold ? 0.55 : 1) - (Math.hypot(pl.x - op.x, pl.y - op.y) < Math.hypot(pl.x - me.x, pl.y - me.y) ? -120 : 0);
        if (d < best) { best = d; target = pl; }
      }
    } else if (G.golden && Math.hypot(G.golden.x - me.x, G.golden.y - me.y) < 700) target = G.golden;

    const dx = op.x - me.x;
    const opSide = sign(op.x - cx) || 1;
    const onCenterSide = sign(dx) === opSide;
    const opNearEdge = edgeDist(op) < 380;
    const aggressive = G.mode === 'caneca' || (opNearEdge && Math.abs(dx) < 300);

    if (aggressive && op.alive && (!target || Math.abs(dx) < 260) && Math.abs(op.y - me.y) < 160) {
      if (Math.abs(dx) < 330 && onCenterSide) {
        // embestir hacia el borde
        inp.right = dx > 0; inp.left = dx < 0;
        if (me.onGround && this.obstacleAhead(me, sign(dx))) this.wantJump(true);
        if (this.level > 0 && me.stuck === false && Math.abs(dx) < 140 && op.stuck && Math.random() < 0.3) inp.pull = true;
      } else {
        // rodearlo para quedar del lado del centro
        this.moveTo(me, op.x - opSide * 170, inp, 40);
        if (Math.abs(dx) < 140 && me.onGround) this.wantJump(true);
      }
    } else if (target) {
      this.moveTo(me, target.x, inp, 14);
      if (target.y < me.y - 50 && Math.abs(target.x - me.x) < 240 && me.onGround) this.wantJump(target.y < me.y - 140);
    } else {
      this.moveTo(me, cx + this.wander, inp, 50);
      if (op.y < me.y - 120 && Math.abs(dx) < 300 && me.onGround && Math.random() < 0.3) this.wantJump(true);
    }

    // tirachinas: pegarse con el hilo tenso, esperar la carga y soltarse
    if (this.level > 0 && !me.stuck && me.onGround && rope.strain > 1.06 && sign(myDir.x) === sign(dx) && Math.abs(dx) > 220 && Math.random() < 0.22 + this.level * 0.08 && edgeDist(me) > 300) inp.stick = true;
    if (me.stuck) inp.stick = !(me.charge >= (this.level === 2 ? 0.95 : 0.55) || me.sticky < 0.45 || (me.charge < 0.05 && rope.strain < 1.02));
    // picada sobre el rival (Leyenda)
    if (this.level === 2 && !me.onGround && !me.stuck && Math.abs(dx) < 50 && op.y - me.y > 110 && me.vy > -100) inp.stick = true;
    // no acercarse al borde sin querer
    if (edgeDist(me) < 90 && !inp.stick) { inp.right = towardCenter > 0; inp.left = towardCenter < 0; }
    if (sloppy) { const l = inp.left; inp.left = inp.right; inp.right = l; }
    this.inp = inp;
  }
}
