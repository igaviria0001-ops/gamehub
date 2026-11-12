/* =========================================================================
   ENTRENAMIENTO AVANZADO — ejercicios libres para Fresa (jugador 1) contra
   un muñeco que hace cosas: embiste, cuelga del borde, sale volando, se mueve…
   No hay tiempo límite ni medalla: cada ejercicio repite una situación
   difícil una y otra vez, cuenta aciertos y racha, y sube de nivel solo
   (3 seguidos = más difícil; 3 fallos seguidos = un poco más fácil).
   R (o el botón ⟲) repite la situación al instante. Se guarda en tya_entreno.
   ========================================================================= */
class TrainDummy {
  constructor() { this.set('pin'); }
  set(mode, opts = {}) {
    Object.assign(this, { mode, t: 0, goal: null, wait: 0.3, phase: 0, stall: 0, lastX: null, jumpT: 0, speed: 120, climb: 0, hops: false, guard: 0, guardT: 0, duty: 0, wallGrab: false, kind: 'ground', jumped: false, feinted: false, t1: 0, startDir: 0 }, opts);
  }
  think(dt, G) {
    const me = G.players[1], foe = G.players[0];
    const inp = emptyInput();
    this.t += dt;
    if (!me.alive) return inp;
    if (this.mode === 'pin') { me.anchor = true; inp.stick = true; return inp; }
    if (this.mode === 'roam') return this.roam(dt, G, me, foe, inp);
    if (this.mode === 'rammer') return this.ram(dt, G, me, foe, inp);
    if (this.mode === 'hang') return this.hang(dt, G, me, foe, inp);
    return inp; // 'idle' y 'toss': quieto
  }
  hanging(me) { return me.hangT > 0.05 || (me.y - me.r > ARENA.deskY - 4 && (me.x < ARENA.deskLeft + 4 || me.x > ARENA.deskRight - 4)); }
  roam(dt, G, me, foe, inp) {
    // colgando del borde: según el nivel, tira para salvarse
    if (this.hanging(me)) { if (this.climb > 0 && (this.t * 1.3) % 1 < this.climb) inp.pull = true; return inp; }
    // defenderse: si el otro viene rápido y cerca, se pega un rato
    if (this.guard > 0) {
      if (this.guardT > 0) { this.guardT -= dt; inp.stick = true; return inp; }
      const dx = foe.x - me.x, closing = -Math.sign(dx) * foe.vx;
      if (me.onGround && foe.alive && Math.abs(dx) < 260 && closing > 300 && Math.random() < this.guard * dt * 8) { this.guardT = 0.9; inp.stick = true; return inp; }
    }
    if (me.stun > 0) return inp;
    if (this.jumpT > 0) { this.jumpT -= dt; inp.jump = true; }
    if (!me.onGround) { if (this.goal != null) inp[this.goal > me.x ? 'right' : 'left'] = this.speed > 200; return inp; }
    if (this.wait > 0) { this.wait -= dt; return inp; }
    const lo = ARENA.deskLeft + 130, hi = ARENA.deskRight - 130;
    if (this.goal == null) this.goal = rnd(lo, hi);
    if (Math.abs(this.goal - me.x) < 26) { this.goal = null; this.wait = rnd(0.15, 0.8); return inp; }
    const dir = Math.sign(this.goal - me.x);
    me.vx = approach(me.vx, dir * this.speed, 1500 * dt);
    // atascado contra algo (libros, cajón): saltico
    const moved = this.lastX == null ? 99 : Math.abs(me.x - this.lastX) / Math.max(dt, 1e-3);
    this.lastX = me.x;
    this.stall = moved < 25 ? this.stall + dt : 0;
    if (this.stall > 0.2 || (this.hops && Math.random() < dt * 0.45)) { this.stall = 0; this.jumpT = 0.22; }
    return inp;
  }
  ram(dt, G, me, foe, inp) {
    const dx = foe.x - me.x, dir = Math.sign(dx) || 1;
    if (!this.startDir) this.startDir = dir;
    if (this.phase === 0) { this.wait -= dt; if (this.wait <= 0) { this.phase = 1; this.t1 = 0; } return inp; }
    if (this.phase === 2) return inp; // ya atacó
    if (this.phase === 3) { this.wait -= dt; if (this.wait <= 0) this.phase = 1; return inp; } // amague
    this.t1 += dt;
    if (this.kind === 'feint' && !this.feinted && Math.abs(dx) < 400 && me.onGround) { this.feinted = true; this.phase = 3; this.wait = rnd(0.3, 0.6); return inp; }
    if (dir !== this.startDir && Math.abs(dx) > 60) { this.phase = 2; return inp; } // se pasó de largo
    inp[dir > 0 ? 'right' : 'left'] = true;
    if (this.kind === 'stomp') {
      if (!this.jumped && me.onGround && Math.abs(dx) < 330) { this.jumped = true; this.jumpT = 0.3; }
      if (this.jumpT > 0) { this.jumpT -= dt; inp.jump = true; }
      if (this.jumped && !me.onGround && Math.abs(dx) < 70 && me.vy > -150 && me.y < foe.y - foe.r) inp.stick = true; // picada encima
    }
    if (this.t1 > 2.8) this.phase = 2;
    return inp;
  }
  hang(dt, G, me, foe, inp) {
    // colgando: tira para subir (a ratos, según el nivel); en el nivel 3 también se agarra de la pared
    if ((this.t * 0.8 + 0.35) % 1 < this.duty) inp.pull = true;
    if (this.wallGrab && !me.onGround && me.sticky > 0.3 && me.contacts.some(c => Math.abs(c.nx) > 0.75)) inp.stick = true;
    return inp;
  }
}

const Entreno = (() => {
  const LVL_COL = ['#7fd36b', '#ffb03b', '#ff6b5a'];
  const BOOKS = [[463, 687], [1233, 1457]];
  const inBooks = x => BOOKS.some(([a, b]) => x > a - 30 && x < b + 30);
  const R = () => Game.G.train;

  /* ---------- utilidades para armar situaciones ---------- */
  function put(p, x, mass, top) {
    const y = top !== undefined ? top : ARENA.groundBelow(x, ARENA.deskY - 2);
    p.reset(x, y, mass);
  }
  function pin(p) {
    p.stuck = true; p.stuckN = { x: 0, y: -1 }; p.stuckX = p.x; p.stuckY = p.y; p.stuckR = null;
    p.anchor = true; p.pinned = true;
  }
  function hangAt(p, side, depth, mass) {
    const xe = side < 0 ? ARENA.deskLeft : ARENA.deskRight;
    p.reset(xe + side * 46, depth, mass); p.onGround = false; p.hangT = 1; p.wasHanging = true;
  }
  function rope(len) {
    const [A, B] = Game.G.players;
    Game.G.rope.reset(A.x, A.y, B.x, B.y, len); Game.G.rope.visible = true;
  }
  const cornerLen = (side, ax, ay, bx, by) => {
    const cx = side < 0 ? ARENA.deskLeft : ARENA.deskRight, cy = ARENA.deskY;
    return Math.hypot(ax - cx, ay - cy) + Math.hypot(bx - cx, by - cy);
  };
  const dummy = () => Game.G.bots[1] instanceof TrainDummy ? Game.G.bots[1] : null;
  const floorX = (ranges) => { const [a, b] = pick(ranges); return rnd(a, b); };

  /* ---------- los ejercicios ---------- */
  const LIST = [
    {
      id: 'tiro', title: 'Tiro al blanco', skill: 'Tirachinas', arena: 'gimnasio', variant: 'libre',
      tips: [
        'Párate en la marca amarilla, pégate y tira hasta que salgan las tres flechas. Suelta: atraviesa el blanco volando.',
        'Ya sin marca: busca tú desde dónde disparar para pasar por el blanco.',
        'Blancos más chicos y más corridos: elige bien la distancia y espera la carga completa.',
      ],
      setup(T, G, lvl) {
        const [A, B] = G.players;
        const spots = [[rnd(560, 1360), 640], [435, 430], [1485, 430]].concat(lvl >= 2 ? [[960, 232]] : []);
        let D, sx, n = 0, dist;
        for (; n < 80; n++) {
          D = pick(spots); sx = rnd(330, 1590);
          dist = Math.hypot(sx - D[0], 640 - D[1]);
          const underBeam = D[1] === 430 && Math.abs(sx - D[0]) < 150;
          if (dist > 380 && dist < 640 && Math.abs(sx - D[0]) > 170 && !underBeam) break;
        }
        put(B, D[0], 3, D[1]); pin(B);
        // el blanco va sobre la curva del tirachinas a carga completa (sale derecho al muñeco, con algo de elevación)
        const r3 = massRadius(3), x0 = sx, y0 = 640 - r3, x1 = D[0], y1 = D[1] - r3;
        const dd = Math.hypot(x1 - x0, y1 - y0), boost = 1420, Tt = dd / boost, lift = clamp(0.5 * PHYS.g * (dd / boost), 40, 320);
        const f = lvl === 3 ? pick([rnd(0.3, 0.38), rnd(0.62, 0.7)]) : rnd(0.42, 0.58), t = f * Tt;
        T.rep.target = { x: x0 + (x1 - x0) / dd * boost * t, y: y0 + (y1 - y0) / dd * boost * t - lift * t + 0.5 * PHYS.g * t * t, r: lvl === 3 ? 42 : lvl === 2 ? 50 : 58 };
        const S = { x: sx, y: 640 };
        T.rep.spot = lvl === 1 ? S : null; T.rep.S = S;
        T.rep.slung = false;
        put(A, clamp(sx + pick([-1, 1]) * rnd(120, 260), 320, 1600), 3);
        rope(dist * 1.06);
        G.bots[1] = new TrainDummy(); G.bots[1].set('pin');
      },
      update(T, G) {
        const p = G.players[0], tg = T.rep.target;
        if (!p.alive) return [false, '¡A la caneca!'];
        if (p.slingT > 0) {
          T.rep.slung = true;
          if (Math.hypot(p.x - tg.x, p.y - tg.y) < tg.r + p.r * 0.45) { FX.ring(tg.x, tg.y, '#ffffff', 90, 0.4, 8); return [true, '¡EN EL BLANCO!']; }
        } else if (T.rep.slung && p.onGround) return [false, '¡Casi!'];
        if (T.repT > 14) return [false, 'Otro blanco'];
        return null;
      },
      draw(ctx, T, t) {
        const tg = T.rep.target; if (!tg) return;
        if (T.rep.spot) footMark(ctx, T.rep.spot.x, 640, t, 'pégate aquí');
        bullseye(ctx, tg.x, tg.y, tg.r, t);
      },
    },
    {
      id: 'combo', title: 'Combo aéreo', skill: 'Salto doble + picada', arena: 'pupitre',
      tips: [
        'Sin tocar el piso: salta, salto doble por la estrella celeste y luego picada (pegarse en el aire) por la rosada.',
        'Más arriba y más lejos. Si tocas el piso entre las dos, vuelve a empezar.',
        'Estrellas chiquitas: el salto doble y la picada tienen que ser exactos.',
      ],
      setup(T, G, lvl) {
        const [A, B] = G.players;
        put(B, 960, 3, 606); pin(B);
        let ax, bx, by, side;
        for (let n = 0; n < 50; n++) {
          ax = rnd(420, 1500); side = Math.random() < 0.5 ? -1 : 1;
          bx = ax + side * rnd(lvl === 3 ? 220 : 150, lvl === 3 ? 320 : 250);
          if (bx < 330 || bx > 1590) continue;
          break;
        }
        const ay = lvl === 1 ? 300 : lvl === 2 ? 250 : 200;
        by = bx > 720 && bx < 1200 ? 400 : inBooks(bx) ? 470 : 540;
        T.rep.stars = [{ x: ax, y: ay, kind: 'air', got: false, popT: 0 }, { x: bx, y: by, kind: 'dive', got: false, popT: 0 }];
        T.rep.rad = lvl === 3 ? 16 : lvl === 2 ? 22 : 28;
        const px = clamp(ax - side * rnd(120, 260), 320, 1600);
        put(A, inBooks(px) ? (px < 960 ? 400 : 1520) : px, 3);
        rope(680);
        G.bots[1] = new TrainDummy(); G.bots[1].set('pin');
      },
      update(T, G) {
        const p = G.players[0], [a, b] = T.rep.stars;
        if (!p.alive) return [false, '¡A la caneca!'];
        const near = s => Math.hypot(p.x - s.x, p.y - s.y) < p.r + T.rep.rad;
        if (!a.got && near(a)) {
          if (!p.onGround && p.airJumps === 0) { a.got = true; a.popT = 0.001; T.rep.airT = 0; Sound.play('pellet', 1.1); FX.sparkle(a.x, a.y, '#7fd8ff', 14); }
          else if (!T.rep.warnA) { T.rep.warnA = 1; FX.callout('¡Con salto doble!', a.x, a.y - 50, '#ffffff', 30, 1); }
        }
        if (a.got && !b.got) {
          if (near(b)) {
            if (p.diveT > 0) { b.got = true; b.popT = 0.001; FX.sparkle(b.x, b.y, '#ff8fc4', 16); return [true, '¡COMBO!']; }
            else if (!T.rep.warnB) { T.rep.warnB = 1; FX.callout('¡En picada!', b.x, b.y - 50, '#ffffff', 30, 1); }
          }
          T.rep.airT += 1 / 60;
          if (p.onGround && T.rep.airT > 0.1) return [false, '¡Sin tocar el piso!'];
        }
        if (T.repT > 14) return [false, 'Otra vez'];
        return null;
      },
      draw(ctx, T, t) {
        T.rep.stars.forEach((s, i) => {
          if (s.got) { if (s.popT > 0 && s.popT < 0.45) { s.popT += 1 / 60; ctx.save(); ctx.globalAlpha = 1 - s.popT / 0.45; drawStar(ctx, s.x, s.y, 24 * (1 + s.popT * 2.5), KCOL[s.kind], 0); ctx.restore(); } return; }
          const dim = i === 1 && !T.rep.stars[0].got;
          starMark(ctx, s.x, s.y, T.rep.rad, KCOL[s.kind], s.kind === 'air' ? '1 · SALTO DOBLE' : '2 · PICADA', t, dim);
        });
      },
    },
    {
      id: 'aplaston', title: 'Aplastón móvil', skill: 'Picada', arena: 'gimnasio', variant: 'libre',
      tips: [
        'El muñeco camina. Salta por encima y mantén pegarse en el aire: picada. ¡Cáele encima!',
        'Ahora camina más rápido. Calcula dónde va a estar.',
        'Rápido y a saltos. Usa las barras para caer desde más alto.',
      ],
      setup(T, G, lvl) {
        const [A, B] = G.players;
        const ax = rnd(400, 1520); let bx;
        do bx = rnd(420, 1500); while (Math.abs(bx - ax) < 320);
        put(A, ax, 3); put(B, bx, 3);
        rope(720);
        const d = new TrainDummy(); d.set('roam', { speed: [100, 170, 240][lvl - 1], hops: lvl === 3, wait: 0.6 });
        G.bots[1] = d;
      },
      update(T, G) {
        if (!G.players[0].alive) return [false, '¡A la caneca!'];
        if (T.ev.rams.some(r => r.att === 0 && r.stomp)) return [true, '¡APLASTÓN!'];
        if (T.repT > 11) return [false, 'Se te escapó'];
        return null;
      },
      draw(ctx, T, t) { aimMark(ctx, Game.G.players[1], t, '¡APLÁSTALO!'); },
    },
    {
      id: 'tirachinazo', title: 'Tirachinazo', skill: 'Tirachinas + embestida', arena: 'gimnasio', variant: 'libre',
      tips: [
        'Pégate con el hilo tenso, espera las flechas y suéltate: si sales disparado contra el muñeco, es un tirachinazo.',
        'Ahora el muñeco se mueve: dispárale cuando el hilo apunte hacia él.',
        'Se mueve más rápido. Tensa el hilo tirando antes de pegarte.',
      ],
      setup(T, G, lvl) {
        const [A, B] = G.players;
        const ax = rnd(400, 1520); let bx;
        do bx = rnd(420, 1500); while (Math.abs(bx - ax) < 360 || Math.abs(bx - ax) > 700);
        put(A, ax, 3); put(B, bx, 3);
        rope(Math.abs(bx - ax) * rnd(1.05, 1.25));
        const d = new TrainDummy(); d.set(lvl === 1 ? 'idle' : 'roam', { speed: lvl === 2 ? 70 : 140, wait: 1 });
        G.bots[1] = d;
      },
      update(T, G) {
        if (!G.players[0].alive) return [false, '¡A la caneca!'];
        if (T.ev.rams.some(r => r.att === 0 && r.sling)) return [true, '¡TIRACHINAZO!'];
        if (T.ev.rams.some(r => r.att === 0 && !r.sling) && !T.rep.told) { T.rep.told = 1; FX.callout('Eso fue embestida, no tirachinas', G.players[0].x, G.players[0].y - 90, '#ffffff', 28, 1.4); }
        if (T.repT > 15) return [false, 'Otra vez'];
        return null;
      },
      draw(ctx, T, t) { aimMark(ctx, Game.G.players[1], t, '¡DISPÁRALE!'); },
    },
    {
      id: 'salvada', title: 'Salvada al filo', skill: 'Salvarse', arena: 'pupitre',
      tips: [
        'Cuelgas sobre la caneca: mantén tirar. El hilo te sube por el borde del pupitre.',
        'Más hondo y más pesado. No sueltes tirar hasta estar arriba.',
        'Llegas balanceándote y bien abajo: tira sin parar, ¡rápido!',
      ],
      setup(T, G, lvl) {
        const [A, B] = G.players;
        const side = Math.random() < 0.5 ? -1 : 1, xe = side < 0 ? ARENA.deskLeft : ARENA.deskRight;
        let bx = xe - side * [rnd(330, 420), rnd(480, 640), rnd(620, 800)][lvl - 1];
        if (Math.abs(bx - 960) < 70) bx = 960 + side * 90;
        put(B, bx, 3); pin(B);
        hangAt(A, side, [720, 752, 764][lvl - 1], [2.6, 3.1, 3.4][lvl - 1]);
        if (lvl === 3) A.vx = side * 150;
        rope(cornerLen(side, A.x, A.y, B.x, B.y) - 12);
        G.bots[1] = new TrainDummy(); G.bots[1].set('pin');
      },
      update(T, G) {
        if (T.ev.dunk[0]) return [false, '¡A la caneca!'];
        if (T.ev.saved[0]) return [true, '¡SALVADA!'];
        if (T.repT > 9) return [false, 'Muy lento'];
        return null;
      },
      draw(ctx, T, t) {
        const p = Game.G.players[0];
        if (T.level === 1 && p.alive && p.hangT > 0.2) arrowMark(ctx, p.x, p.y - p.r - 30, -Math.PI / 2, t, 'MANTÉN TIRAR');
      },
    },
    {
      id: 'defensa', title: 'Aguanta firme', skill: 'Defensa', arena: 'gimnasio', variant: 'libre',
      tips: [
        'Te va a embestir junto al borde: pegarse no sirve contra un choque. Sáltalo por encima justo a tiempo… o corre hacia él y choca de frente.',
        'Ahora a veces salta y te cae en picada: aléjate de abajo. Si te tumba, tira del hilo para salvarte.',
        'Más pesado y a veces amaga. Tira para pesar más (te empujan menos) y no te dejes engañar.',
      ],
      setup(T, G, lvl) {
        const [A, B] = G.players;
        const side = Math.random() < 0.5 ? -1 : 1, xe = side < 0 ? ARENA.deskLeft : ARENA.deskRight;
        const ax = xe - side * rnd(150, 210), bx = ax - side * rnd(480, 600);
        put(A, ax, 3); put(B, bx, [3, 3.6, 4.2][lvl - 1]);
        rope(720);
        const kinds = lvl === 1 ? ['ground'] : lvl === 2 ? ['ground', 'stomp'] : ['ground', 'stomp', 'feint'];
        const d = new TrainDummy(); d.set('rammer', { kind: pick(kinds), wait: lvl === 3 ? rnd(0.3, 1.6) : rnd(0.7, 1.2) });
        G.bots[1] = d;
        T.rep.done = null;
      },
      update(T, G) {
        const [p, o] = G.players, d = dummy();
        if (T.ev.dunk[0]) return [false, '¡Te echó a la caneca!'];
        if (T.ev.dunk[1]) return [true, '¡SE FUE SOLO!'];
        const mine = T.ev.rams.find(r => r.att === 0), his = T.ev.rams.find(r => r.att === 1);
        if (mine && (!his || mine.t < his.t)) return [true, '¡CONTRA!'];
        if (d && (his || d.phase === 2) && T.rep.done === null) { T.rep.done = T.repT; if (d) d.phase = 2; }
        if (T.rep.done !== null && T.repT - T.rep.done > 1.8) {
          const safe = p.alive && p.hangT === 0 && p.y < ARENA.deskY && p.x > ARENA.deskLeft && p.x < ARENA.deskRight;
          if (safe) return [true, his ? '¡AGUANTASTE!' : '¡ESQUIVADA!'];
          if (T.repT - T.rep.done > 7) return [false, 'Casi…'];
        }
        if (T.repT > 12) return [false, 'Otra vez'];
        void o;
        return null;
      },
      draw(ctx, T, t) {
        const d = dummy(), o = Game.G.players[1];
        if (d && d.mode === 'rammer' && d.phase === 0 && o.alive) bang(ctx, o.x, o.y - o.r - 40, t);
      },
    },
    {
      id: 'remate', title: 'Remate al filo', skill: 'Aflojar', arena: 'pupitre',
      tips: [
        'El muñeco cuelga del borde y trata de subir. Mantén aflojar: le das hilo y se cae.',
        'Tira más seguido. Aflójale y acércate al borde, sin caerte tú.',
        'Ahora tira sin parar y empiezas más lejos: aflójale y corre hacia el borde, sin caerte tú.',
      ],
      setup(T, G, lvl) {
        const [A, B] = G.players;
        const side = Math.random() < 0.5 ? -1 : 1, xe = side < 0 ? ARENA.deskLeft : ARENA.deskRight;
        let ax = xe - side * rnd(320, 560);
        if (inBooks(ax)) ax = xe - side * 180;
        put(A, ax, 3);
        hangAt(B, side, [760, 740, 720][lvl - 1], 3);
        rope(cornerLen(side, A.x, A.y, B.x, B.y) - 10);
        const d = new TrainDummy(); d.set('hang', { duty: [0.55, 0.8, 1][lvl - 1] });
        G.bots[1] = d;
      },
      update(T, G) {
        if (T.ev.dunk[0] && T.ev.dunk[1]) return [false, '¡Se fueron los dos!'];
        if (T.ev.dunk[0]) return [false, '¡Te arrastró!'];
        if (T.ev.dunk[1]) return [true, '¡REMATE!'];
        if (T.ev.saved[1]) return [false, 'Se salvó'];
        if (T.repT > 10) return [false, 'Otra vez'];
        return null;
      },
      draw(ctx, T, t) {
        const o = Game.G.players[1];
        if (T.level === 1 && o.alive && T.repT < 4) arrowMark(ctx, o.x, o.y + o.r + 36, Math.PI / 2, t, 'MANTÉN AFLOJAR');
      },
    },
    {
      id: 'latigo', title: 'Latigazo', skill: 'Pegarse + tirar', arena: 'gimnasio', variant: 'libre',
      tips: [
        'El muñeco va a salir volando. Justo antes, pégate y mantén tirar: cuando el hilo se tense, ¡latigazo!',
        'No sabes cuándo sale: verás un «!» un momento antes. Si te pegas muy pronto, el chicle se seca.',
        'Sin aviso y para cualquier lado: reacciona apenas despegue.',
      ],
      setup(T, G, lvl) {
        const [A, B] = G.players;
        const ax = rnd(700, 1220);
        put(A, ax, 3);
        const side = lvl === 1 ? (ax < 960 ? 1 : -1) : (Math.random() < 0.5 ? -1 : 1);
        put(B, ax + side * 130, 3);
        rope(lvl === 3 ? 470 : 400);
        T.rep.side = side;
        T.rep.toss = lvl === 1 ? 1.6 : lvl === 2 ? rnd(1.4, 3.8) : rnd(1.2, 4.2);
        T.rep.warn = lvl === 3 ? 0 : lvl === 2 ? 0.55 : 1.2;
        T.rep.tossed = false;
        G.bots[1] = new TrainDummy(); G.bots[1].set('toss');
      },
      update(T, G) {
        const [p, o] = G.players;
        if (!T.rep.tossed && T.repT >= T.rep.toss) {
          T.rep.tossed = true; T.rep.tossT = T.repT;
          o.vx = T.rep.side * rnd(1300, 1420); o.vy = -rnd(520, 700); o.onGround = false;
          FX.dust(o.x, o.y + o.r, 8, 1); Sound.play('whoosh');
        }
        if (T.ev.whip) return [true, T.ev.dunk[1] ? '¡LATIGAZO A LA CANECA!' : '¡LATIGAZO!'];
        if (T.ev.dunk[0]) return [false, '¡A la caneca!'];
        if (T.rep.tossed && T.repT - T.rep.tossT > 1.4) return [false, p.stuck ? '¡Tira en el momento!' : 'Pégate y tira'];
        return null;
      },
      draw(ctx, T, t) {
        const o = Game.G.players[1];
        if (!T.rep.tossed && o.alive) {
          const left = T.rep.toss - T.repT;
          if (T.rep.warn && left < T.rep.warn) bang(ctx, o.x, o.y - o.r - 40, t);
          if (T.level === 1) arrowMark(ctx, o.x + T.rep.side * 80, o.y - 50, T.rep.side > 0 ? -0.4 : Math.PI + 0.4, t, '');
        }
      },
    },
    {
      id: 'clavado', title: 'Contrarreloj', skill: 'Ganar rápido', arena: 'pupitre', timed: true,
      tips: [
        'Echa al muñeco a una caneca lo más rápido que puedas: embestidas, tirachinas, aplastones…',
        'Más pesado: se defiende pegándose y tira cuando cuelga.',
        'Pesado y terco: se pega cuando vas rápido y casi siempre se trata de salvar.',
      ],
      setup(T, G, lvl) {
        const [A, B] = G.players;
        const ax = pick([400, 760, 1160, 1520]); let bx;
        do bx = pick([400, 760, 1160, 1520]); while (bx === ax);
        put(A, ax, 3); put(B, bx, [2.6, 3.2, 3.8][lvl - 1]);
        rope(460);
        const d = new TrainDummy(); d.set('roam', { speed: [110, 140, 170][lvl - 1], climb: [0, 0.6, 1][lvl - 1], guard: [0, 0.5, 0.9][lvl - 1], wait: 0.5 });
        G.bots[1] = d;
      },
      update(T, G) {
        if (T.ev.dunk[0] && T.ev.dunk[1]) return [false, '¡Los dos!'];
        if (T.ev.dunk[0]) return [false, '¡Caíste tú!'];
        if (T.ev.dunk[1]) return [true, `¡${fmt(T.repT)} s!`];
        if (T.repT > 40) return [false, 'Se acabó el tiempo'];
        return null;
      },
    },
    {
      id: 'subita', title: 'Muerte súbita', skill: 'Bajo presión', arena: 'pupitre', bot: true,
      tips: [
        'Una ronda contra la máquina con el timbre ya sonando: el hilo se encoge y el piso empuja a las canecas.',
        'Máquina Masticador y el piso empuja más fuerte. Pegarse aguanta el empujón.',
        'Contra la Leyenda, con el empujón al máximo. ¡Suerte!',
      ],
      setup(T, G, lvl) {
        const [A, B] = G.players;
        put(A, 760, 3); put(B, 1160, 3);
        rope(420);
        G.bots[1] = new Bot(1, lvl - 1);
        G.roundT = 45 + (lvl - 1) * 14;
      },
      update(T, G) {
        if (T.ev.dunk[0] && T.ev.dunk[1]) return [false, 'Empate'];
        if (T.ev.dunk[0]) return [false, 'Ganó la máquina'];
        if (T.ev.dunk[1]) return [true, '¡GANASTE!'];
        if (T.repT > 45) return [false, 'Tablas'];
        return null;
      },
    },
  ];
  const KCOL = { air: '#7fd8ff', dive: '#ff8fc4', any: '#ffd84d' };
  const fmt = t => t.toFixed(1).replace('.', ',');

  const data = (() => { const d = Store.get('entreno', null); return d && d.best ? d : { best: {}, total: {}, top: {}, time: {} }; })();
  const save = () => Store.set('entreno', data);

  /* ---------- ciclo ---------- */
  function start(idx, level) {
    const def = LIST[idx]; if (!def) return;
    const G = Game.G;
    Game.startMatch('caneca', true, def.arena);
    if (def.variant) Game.setArena(def.arena, def.variant);
    const prev = G.train && G.train.idx === idx ? G.train : null;
    G.train = {
      idx, def, level: level || (prev ? prev.level : 1), phase: 'rep', repT: 0, pauseT: 0,
      hits: 0, tries: 0, streak: 0, lvlRun: 0, fails: 0, last: null, lastT: 9, lvlFlash: 0,
      ev: null, rep: {}, best: data.best[def.id] || 0,
    };
    G.countdownLen = 1.0; G.hintsT = 0;
    newRep(true);
    Sound.Music.setMode('game');
  }

  function newRep(first) {
    const T = R(); if (!T) return;
    const G = Game.G;
    T.rep = {}; T.repT = 0; T.phase = 'rep';
    T.ev = { rams: [], dunk: [false, false], saved: [false, false], whip: false };
    G.respawn = [0, 0]; G.slowT = 0; G.timeScale = 1; G.hitStop = 0; G.cam.focus = null; G.cam.focusT = 0;
    G.suddenDeath = !!T.def.bot;
    if (!T.def.bot) G.roundT = 0;
    T.def.setup(T, G, T.level);
    for (const p of G.players) { p.inv = 0; p.mood = null; }
    if (!first) { const p = G.players[0]; FX.sparkle(p.x, p.y, p.col.light, 12); Sound.play('select'); }
  }

  function result(ok, text) {
    const T = R(), G = Game.G, p = G.players[0], def = T.def;
    T.phase = 'pause'; T.pauseT = 0; T.tries++; T.last = ok; T.lastT = 0;
    (T.whys = T.whys || {})[text] = (T.whys[text] || 0) + 1;
    if (ok) {
      T.hits++; T.streak++; T.lvlRun++; T.fails = 0;
      data.total[def.id] = (data.total[def.id] || 0) + 1;
      if (T.streak > (data.best[def.id] || 0)) data.best[def.id] = T.streak;
      if (def.timed && (data.time[def.id] === undefined || T.repT < data.time[def.id])) { data.time[def.id] = +T.repT.toFixed(2); if (T.tries > 1) T.newTime = 1.5; }
      FX.callout(text, p.alive ? p.x : 960, (p.alive ? p.y - p.r : 500) - 60, '#9dffb0', 52, 1.2);
      Sound.play('pellet', 1 + Math.min(T.streak, 8) * 0.06);
      if (T.lvlRun >= 3 && T.level < 3 && !T.lock) {
        T.level++; T.lvlRun = 0; T.lvlFlash = 1.6;
        FX.banner(`NIVEL ${T.level}`, { sub: 'más difícil', size: 120, life: 1.3, color: LVL_COL[T.level - 1], y: 0.3 });
        Sound.play('roundWin');
      }
    } else {
      T.streak = 0; T.lvlRun = 0; T.fails++;
      FX.callout(text, p.alive ? p.x : 960, (p.alive ? p.y - p.r : 520) - 60, '#ff9d8f', 44, 1.2);
      Sound.play('back');
      if (T.fails >= 3 && T.level > 1 && !T.lock) {
        T.level--; T.fails = 0; T.lvlFlash = 1.6;
        FX.banner(`NIVEL ${T.level}`, { sub: 'un poco más fácil', size: 100, life: 1.2, color: LVL_COL[T.level - 1], y: 0.3 });
      }
    }
    if (T.level > (data.top[def.id] || 0)) data.top[def.id] = T.level;
    save();
    Progress.on('entreno', { id: def.id, level: T.level, streak: T.streak, top3: LIST.filter(d => (data.top[d.id] || 0) >= 3).length, total: LIST.length, ok });
  }

  function update(dt) {
    const T = R(); if (!T) return;
    const G = Game.G;
    if (!T.def.bot) G.suddenDeath = false;
    G.golden = null; G.goldenNext = 1e9; G.pellets.length = 0;
    T.lastT += dt; T.lvlFlash = Math.max(0, T.lvlFlash - dt);
    if (T.newTime) T.newTime = Math.max(0, T.newTime - dt);
    if (T.phase === 'rep') {
      T.repT += dt;
      const r = T.def.update(T, G, dt);
      if (r) result(r[0], r[1]);
    } else {
      T.pauseT += dt;
      if (T.pauseT > (T.last ? 0.9 : 1.15)) newRep(false);
    }
  }

  function again() {
    const T = R(); if (!T || Game.G.state !== 'play') return;
    if (typeof UI !== 'undefined' && UI.paused) return;
    newRep(false);
  }
  Input.onPress(code => { if ((code === 'KeyR' || code === 'Backspace' || /^Pad\d_select$/.test(code)) && R()) again(); });

  /* ---------- ganchos desde el juego ---------- */
  function onRam(att, info) { const T = R(); if (T && T.phase === 'rep') T.ev.rams.push({ att: att.id, sling: !!info.sling, stomp: !!info.stomp, t: T.repT }); }
  function onSaved(p) { const T = R(); if (T && T.phase === 'rep') T.ev.saved[p.id] = true; }
  function onWhip(p) { const T = R(); if (T && T.phase === 'rep' && p.id === 0) T.ev.whip = true; }
  function onDunk(p) {
    const T = R(); if (!T) return;
    if (T.phase === 'rep') T.ev.dunk[p.id] = true;
    Game.G.rope.visible = false;
    FX.gum(p.x, Math.min(p.y, 1000) - 40, p.col, 10, 1.1, 0, -1); Sound.play('dunk');
  }

  /* ---------- dibujo ---------- */
  function bullseye(ctx, x, y, r, t) {
    ctx.save();
    const pulse = 1 + Math.sin(t * 4) * 0.05;
    ctx.translate(x, y); ctx.scale(pulse, pulse);
    const gl = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.7);
    gl.addColorStop(0, 'rgba(255,90,80,0.35)'); gl.addColorStop(1, 'rgba(255,90,80,0)');
    ctx.fillStyle = gl; ctx.fillRect(-r * 1.7, -r * 1.7, r * 3.4, r * 3.4);
    [[1, '#ffffff'], [0.72, '#ff5a50'], [0.46, '#ffffff'], [0.22, '#ff5a50']].forEach(([k, c]) => {
      ctx.beginPath(); ctx.arc(0, 0, r * k, 0, TAU); ctx.fillStyle = c; ctx.fill();
    });
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.lineWidth = 4; ctx.strokeStyle = PALETTE.ink; ctx.stroke();
    ctx.restore();
  }
  function footMark(ctx, x, y, t, label) {
    ctx.save();
    ctx.globalAlpha = 0.75 + Math.sin(t * 5) * 0.2;
    ctx.fillStyle = '#ffd84d'; ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(x, y - 3, 46, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1;
    label && tag(ctx, x, y + 30, label);
    ctx.restore();
  }
  function tag(ctx, x, y, text) {
    ctx.font = font(16, 700);
    const w = ctx.measureText(text).width + 18;
    rr(ctx, x - w / 2, y - 12, w, 24, 12);
    ctx.fillStyle = '#fff6e6'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = PALETTE.ink; ctx.stroke();
    ctx.fillStyle = PALETTE.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 1);
  }
  function starMark(ctx, x, y, rad, col, label, t, dim) {
    ctx.save();
    if (dim) ctx.globalAlpha = 0.45;
    const pulse = 1 + Math.sin(t * 5 + x * 0.01) * 0.08;
    const gl = ctx.createRadialGradient(x, y, 4, x, y, 58);
    gl.addColorStop(0, rgba(col, 0.55)); gl.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = gl; ctx.fillRect(x - 58, y - 58, 116, 116);
    drawStar(ctx, x, y, rad * pulse, col, Math.sin(t * 1.6 + y) * 0.25);
    tag(ctx, x, y + rad + 18, label);
    ctx.restore();
  }
  function aimMark(ctx, o, t, label) {
    if (!o.alive) return;
    const y = o.y - o.r - 34 + Math.sin(t * 6) * 6;
    ctx.save();
    ctx.fillStyle = '#ff5a50'; ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(o.x - 15, y - 18); ctx.lineTo(o.x + 15, y - 18); ctx.lineTo(o.x, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (R().level === 1) tag(ctx, o.x, y - 40, label);
    ctx.restore();
  }
  function arrowMark(ctx, x, y, ang, t, label) {
    ctx.save();
    const k = Math.sin(t * 7) * 8;
    ctx.translate(x + Math.cos(ang) * k, y + Math.sin(ang) * k); ctx.rotate(ang);
    ctx.fillStyle = '#ffd84d'; ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(0, -20); ctx.lineTo(0, -9); ctx.lineTo(-24, -9); ctx.lineTo(-24, 9); ctx.lineTo(0, 9); ctx.lineTo(0, 20); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
    if (label) { ctx.save(); tag(ctx, x, y + (Math.sin(ang) < 0 ? -48 : 48), label); ctx.restore(); }
  }
  function bang(ctx, x, y, t) {
    ctx.save();
    const s = 1 + Math.sin(t * 18) * 0.12;
    ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.arc(0, 0, 22, 0, TAU); ctx.fillStyle = '#ff5a50'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = PALETTE.ink; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = font(30, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', 0, 2);
    ctx.restore();
  }

  function drawWorld(ctx, t) {
    const T = R(); if (!T || !T.def.draw || T.phase !== 'rep') return;
    T.def.draw(ctx, T, t);
  }

  function drawHUD(ctx, W, H) {
    const T = R(); if (!T) return;
    const def = T.def, ink = PALETTE.ink, G = Game.G;
    const band = Retos.bottomBand(W, 1100), w = band.w, x = band.x;
    const compact = w < 1000, side = compact ? 236 : 330;
    ctx.save();
    ctx.font = font(compact ? 17 : 18, 500);
    const tip = Retos.wrap(ctx, def.tips[T.level - 1], w - side - 40).slice(0, compact ? 3 : 2);
    const h = Math.max((compact ? 92 : 100) + tip.length * (compact ? 21 : 23), compact ? 130 : 140), y = H - h - 18;
    ctx.fillStyle = 'rgba(40,20,10,0.25)'; rr(ctx, x + 5, y + 7, w, h, 24); ctx.fill();
    rr(ctx, x, y, w, h, 24); ctx.fillStyle = '#fff6e6'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = ink; ctx.stroke();
    // encabezado + nivel
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = PALETTE.inkSoft; ctx.font = font(compact ? 15 : 17, 700);
    const head = `ENTRENAMIENTO · ${def.skill.toUpperCase()}`;
    ctx.fillText(head, x + 24, y + (compact ? 28 : 32));
    let cx = x + 24 + ctx.measureText(head).width + 14;
    const lc = LVL_COL[T.level - 1], fl = T.lvlFlash > 0 && Math.floor(T.lvlFlash * 8) % 2 === 0;
    ctx.font = font(compact ? 15 : 16, 700);
    const lt = `NIVEL ${T.level}`, lw = ctx.measureText(lt).width + 18 + 3 * 15;
    rr(ctx, cx, y + 10, lw, 26, 13); ctx.fillStyle = fl ? '#ffffff' : lc; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = ink; ctx.stroke();
    ctx.fillStyle = ink; ctx.fillText(lt, cx + 9, y + 29);
    for (let k = 0; k < 3; k++) {
      ctx.beginPath(); ctx.arc(cx + lw - 12 - (2 - k) * 14, y + 23, 4.5, 0, TAU);
      ctx.fillStyle = T.level >= 3 ? '#ffffff' : k < T.lvlRun ? '#ffffff' : 'rgba(58,34,22,0.25)'; ctx.fill();
    }
    ctx.fillStyle = ink; ctx.font = font(compact ? 30 : 34, 700); ctx.fillText(def.title, x + 24, y + (compact ? 62 : 70));
    ctx.font = font(compact ? 17 : 18, 500); ctx.fillStyle = PALETTE.inkSoft;
    tip.forEach((l, k) => ctx.fillText(l, x + 24, y + (compact ? 88 : 98) + k * (compact ? 21 : 23)));
    // contador
    const tx = x + w - (compact ? 22 : 30);
    ctx.textAlign = 'right';
    if (def.timed) {
      const tm = T.phase === 'rep' ? T.repT : null;
      ctx.font = font(compact ? 40 : 46, 700); ctx.fillStyle = ink;
      ctx.fillText(tm !== null ? fmt(tm) + ' s' : (T.last ? '¡Bien!' : '—'), tx, y + (compact ? 50 : 58));
      ctx.font = font(16, 700); ctx.fillStyle = T.newTime ? '#d9a300' : PALETTE.inkSoft;
      const bt = data.time[def.id];
      ctx.fillText(bt !== undefined ? (T.newTime ? `¡récord! ${fmt(bt)} s` : `récord ${fmt(bt)} s`) : 'sin récord aún', tx, y + (compact ? 76 : 86));
    } else {
      ctx.font = font(compact ? 40 : 46, 700); ctx.fillStyle = ink;
      ctx.fillText(`${T.hits}`, tx - (compact ? 56 : 64), y + (compact ? 50 : 58));
      ctx.font = font(compact ? 22 : 24, 700); ctx.fillStyle = PALETTE.inkSoft;
      ctx.fillText(`/ ${T.tries}`, tx, y + (compact ? 50 : 58));
      ctx.font = font(15, 700); ctx.fillText('aciertos', tx, y + (compact ? 70 : 80));
    }
    ctx.font = font(16, 700); ctx.fillStyle = T.streak >= 3 ? '#d9662c' : ink;
    ctx.fillText(`racha ${T.streak}${T.streak >= 3 ? ' 🔥' : ''} · mejor ${Math.max(data.best[def.id] || 0, T.streak)}`, tx, y + (compact ? 96 : 110));
    ctx.font = font(14, 600); ctx.fillStyle = PALETTE.inkSoft;
    ctx.fillText(Touch.enabled ? '⟲ repetir · II elegir otro' : 'R repetir · Esc elegir otro', tx, y + h - 14);
    ctx.restore();
  }

  function camera() { return { x: 960, y: 540, z: 1 }; }

  return {
    LIST, data, start, update, again, onRam, onSaved, onWhip, onDunk, drawWorld, drawHUD, camera, TrainDummy,
    get count() { return LIST.length; },
  };
})();
