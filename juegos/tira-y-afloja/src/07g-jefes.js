/* =========================================================================
   JEFES — peleas cooperativas: los dos (atados por el hilo) contra un jefe.
   Comparten 3 corazones: caer a la caneca o ser tragados cuesta uno.
   · La Aspiradora (Pupitre): un robot que barre. Cuando aspira, los livianos
     vuelan hacia su boca: pégate o ponte pesado. Al recalentarse abre la
     tapa: cáele encima, embístela o úsala de blanco del tirachinas.
   · El Sacapuntas eléctrico (Salón de Arte): cuelga de un riel, escupe virutas
     y se lanza a «sacarle punta» a alguien (mira la sombra). Si muerde el hilo
     se lo come un rato. Después del golpe queda atascado: ¡a darle!
   · El Aseador (Gimnasio): su trapeadora barre el piso de lado a lado. Sáltala
     o pégate al piso (pasa por encima). Cuando descansa, golpéala.
   · La Fotocopiadora (Biblioteca), El Microondas (Cafetería) y El Reloj de la
     torre (final, tres fases): ver cada uno abajo.
   ========================================================================= */
const Jefes = (() => {
  const LIST = [
    { id: 'aspiradora', name: 'La Aspiradora', short: 'ASPIRADORA', arena: 'pupitre', hp: 8,
      desc: 'Un robot que barre el pupitre. Cuando aspira, pégate al piso o ponte pesado. Cuando se recalienta, cáele encima o embístela.' },
    { id: 'sacapuntas', name: 'El Sacapuntas eléctrico', short: 'SACAPUNTAS', arena: 'arte', hp: 8,
      desc: 'Escupe virutas y se lanza sobre uno de ustedes: miren la sombra. Si muerde el hilo se lo come. Atascado en la mesa, ¡denle duro!' },
    { id: 'aseador', name: 'El Aseador', short: 'ASEADOR', arena: 'gimnasio', hp: 8,
      desc: 'Su trapeadora barre el piso de lado a lado: sáltenla o péguense al piso. Cuando descansa, golpéenla. Ojo: deja el piso mojado.' },
    { id: 'fotocopiadora', name: 'La Fotocopiadora', short: 'FOTOCOPIADORA', arena: 'biblioteca', hp: 10,
      desc: 'Lanza aviones de papel a tres alturas (bajo: salten · medio: péguense · alto: quietos) e imprime copias que empujan. Atascada, ¡denle!' },
    { id: 'microondas', name: 'El Microondas', short: 'MICROONDAS', arena: 'cafeteria', hp: 10,
      desc: 'Calienta pedazos del mesón (naranja = va a quemar) y suelta palomitas que revientan. Cuando hace «¡DING!» abre la puerta: ¡a pegarle!' },
    { id: 'reloj', name: 'El Reloj de la torre', short: 'EL RELOJ', arena: 'campana', variant: 'jefe-reloj', hp: 14,
      desc: 'El jefe final: manecillas que giran, péndulo, campanadas que empujan al vacío y engranajes que caen. Cuando sale el cucú, ¡ese es el punto débil!' },
  ];
  const BY = Object.fromEntries(LIST.map(d => [d.id, d]));
  const data = (() => { const d = Store.get('jefes', null); return d && d.best ? d : { best: {}, wins: {} }; })();
  let J = null; // estado de la pelea actual

  /* ---------------- variantes de arena sin estorbos ---------------- */
  function variants() {
    const add = (id, fn) => { const D = ARENA_DEFS[id]; if (!D) return; D.variants = Object.assign({}, D.variants, { jefe: fn }); };
    add('pupitre', () => { const L = ARENA_DEFS.pupitre.layout(); L.solids = L.solids.filter(R => R.kind !== 'book' && R.kind !== 'eraser'); L.spawns = [{ x: 560, y: 640 }, { x: 760, y: 640 }]; L.respawnSpots = [{ x: 960, y: 452 }, { x: 420, y: 640 }, { x: 1500, y: 640 }]; return L; });
    add('arte', () => { const L = ARENA_DEFS.arte.layout(); L.oneway = L.oneway.filter(P => P.kind !== 'paintShelf'); L.calm = true; L.spawns = [{ x: 600, y: 640 }, { x: 800, y: 640 }]; L.respawnSpots = [{ x: 440, y: 420 }, { x: 1480, y: 420 }]; return L; });
    add('biblioteca', () => { const L = ARENA_DEFS.biblioteca.layout(); L.oneway = L.oneway.filter(P => P.kind !== 'ladder'); L.spawns = [{ x: 600, y: 640 }, { x: 800, y: 640 }]; L.respawnSpots = [{ x: 420, y: 400 }, { x: 600, y: 600 }]; return L; });
    add('cafeteria', () => { const L = ARENA_DEFS.cafeteria.layout(); L.solids = L.solids.filter(R => R.kind !== 'belt'); L.oneway = L.oneway.filter(P => P.kind !== 'rack'); L.zones = []; L.spawns = [{ x: 560, y: 640 }, { x: 760, y: 640 }]; L.respawnSpots = [{ x: 430, y: 430 }, { x: 1490, y: 430 }]; return L; });
    add('gimnasio', () => { const L = ARENA_DEFS.gimnasio.layout(); L.solids = L.solids.filter(R => R.kind !== 'tramp' && R.kind !== 'vaultLow'); L.spawns = [{ x: 860, y: 640 }, { x: 1060, y: 640 }]; L.respawnSpots = [{ x: 435, y: 430 }, { x: 1485, y: 430 }, { x: 960, y: 232 }]; return L; });
  }

  /* ---------------- utilidades ---------------- */
  const sfx = (...a) => { if (!Game.G.quiet) Sound.play(...a); };
  function addSolid(R) { R.x0 = R.x; R.y0 = R.y; R.dx = 0; R.dy = 0; ARENA.solids = ARENA.solids.concat([R]); return R; } // arreglo nuevo: no toca el del dibujo
  function removeSolid(R) { if (R) ARENA.solids = ARENA.solids.filter(S => S !== R); }
  function moveSolid(R, x, y) { R.dx = x - R.x; R.dy = y - R.y; if (Math.abs(R.dx) > 300 || Math.abs(R.dy) > 300) { R.dx = 0; R.dy = 0; } R.x = x; R.y = y; }
  const alive = G => G.players.filter(p => p.alive);
  function contactWith(p, R) { return p.contacts ? p.contacts.find(c => c.R === R) : null; }

  /* el que es tragado o tajado: pierde un corazón y vuelve en un momento */
  function swallow(p, G, label, x, y) {
    if (!p.alive || !J || J.over) return;
    p.alive = false; p.dunked = false; p.stuck = false; p.vx = 0; p.vy = 0;
    G.rope.visible = false; G.respawn[p.id] = 1.8;
    if (!G.quiet) {
      FX.gum(x, y, p.col, 14, 1.2, 0, -1); FX.shake(0.7); sfx('dunk');
      FX.banner(label, { sub: `${p.name} vuelve en un momento`, size: 110, life: 1.3, color: '#ff8a7a', y: 0.32 });
    }
    J.lossBy[label] = (J.lossBy[label] || 0) + 1;
    loseHeart(G);
  }
  function loseHeart(G) {
    if (!J || J.over) return;
    J.hearts--; J.heartFlash = 1;
    if (J.hearts <= 0) { J.over = 'lose'; J.overT = 0; if (!G.quiet) { FX.banner('¡GANÓ EL JEFE!', { size: 130, life: 2, color: '#ff8a7a', y: 0.4 }); sfx('back'); } }
  }

  /* daño: devuelve cuánto vale el golpe de p (0 = rebota sin daño) */
  function hitValue(p, c) {
    if (!c) return 0;
    if (p.slingT > 0 && Math.hypot(p.vx, p.vy) + (c.impact || 0) > 300) return 2;
    if (c.ny < -0.55) { // por encima
      if (p.diveT > 0) return 2;
      if ((c.impact || 0) > 620) return 1;
      return 0;
    }
    if (Math.abs(c.nx) > 0.55 && (c.impact || 0) > 360 && p.moveDir === -Math.sign(c.nx)) return 1;
    return 0;
  }
  function damage(G, p, n, x, y, kind) {
    if (!J || J.over || J.invT > 0 || J.pcd[p.id] > 0) return false;
    J.hp = Math.max(0, J.hp - n); J.invT = 0.3; J.pcd[p.id] = 0.6; J.flash = 1; J.hits++;
    p.stats.rams++;
    if (!G.quiet) {
      sfx('ram', 1.1); FX.stars(x, y, 10, 1.2); FX.ring(x, y, '#ffffff', 100, 0.35, 8); FX.shake(0.6);
      FX.callout(n >= 2 ? `¡${kind}! −${n}` : `¡PUM! −${n}`, x, y - 80, n >= 2 ? '#ffd84d' : '#ffffff', n >= 2 ? 56 : 46, 1.2);
    }
    G.hitStop = 0.09;
    if (!J.angry && J.hp <= J.maxHp / 2 && J.hp > 0) {
      J.angry = true;
      if (!G.quiet) { FX.banner('¡SE ENOJÓ!', { sub: 'ahora va más rápido', size: 120, life: 1.6, color: '#ff6b5a', y: 0.34 }); sfx('bell'); Sound.Music.setIntensity(0.75); }
    }
    if (J.hp <= 0) {
      J.over = 'win'; J.overT = 0;
      if (!G.quiet) { FX.banner('¡JEFE DERROTADO!', { size: 140, life: 2.2, color: '#ffd84d', y: 0.36 }); FX.confetti(960, 200, 160, 1400); sfx('win'); FX.shake(1); }
    }
    return true;
  }
  function bounceOff(p, R, power = 520) {
    const cx = R.x + R.w / 2;
    p.vx = Math.sign(p.x - cx || 1) * power * 0.7; p.vy = -power;
    p.diveT = 0; p.slingT = 0; p.onGround = false;
  }
  function clank(G, x, y) { if (!G.quiet && (!J.clankT || J.clankT <= 0)) { FX.callout('¡CLANK!', x, y - 60, '#cfd8e3', 40, 0.8); sfx('bump', 0.8); J.clankT = 0.6; } }

  /* =============== LA ASPIRADORA =============== */
  const ASP = {
    setup(G) {
      const b = { x: 1180, y: ARENA.deskY - 64, w: 230, h: 64, kind: 'roomba' };
      J.body = addSolid(b); J.dir = -1; J.state = 'roam'; J.stateT = 0; J.roamFor = 6; J.dust = [];
    },
    speed() { return J.angry ? 235 : 150; },
    front() { return J.dir > 0 ? J.body.x + J.body.w : J.body.x; },
    update(dt, G) {
      const B = J.body; J.stateT += dt;
      let nx = B.x;
      if (J.state === 'roam') {
        nx = B.x + J.dir * this.speed() * dt;
        const lo = ARENA.deskLeft + 6, hi = ARENA.deskRight - 6 - B.w;
        if (nx < lo) { nx = lo; J.dir = 1; } else if (nx > hi) { nx = hi; J.dir = -1; }
        // ir hacia donde estén los jugadores (con algo de terquedad)
        const al = alive(G);
        if (al.length && J.stateT > 1.2 && Math.random() < dt * 0.6) {
          const mx = al.reduce((a, p) => a + p.x, 0) / al.length, cx = B.x + B.w / 2;
          if (Math.abs(mx - cx) > 200) J.dir = Math.sign(mx - cx);
        }
        if (J.stateT > J.roamFor) {
          // dar la cara al lado donde haya más gente
          const cx = B.x + B.w / 2, al2 = alive(G);
          if (al2.length) { const s = al2.reduce((a, p) => a + Math.sign(p.x - cx), 0); if (s) J.dir = Math.sign(s); }
          J.state = 'warn'; J.stateT = 0;
          if (!G.quiet) { FX.callout('¡VA A ASPIRAR!', cx, B.y - 90, '#7fd8ff', 44, 1.1); sfx('beep', false); }
        }
      } else if (J.state === 'warn') {
        if (J.stateT > 1.15) { J.state = 'suck'; J.stateT = 0; if (!G.quiet) sfx('gust'); }
      } else if (J.state === 'suck') {
        const dur = J.angry ? 3.4 : 2.8;
        const fx = this.front(), my = B.y + B.h * 0.55;
        for (const p of G.players) {
          if (!p.alive || p.stuck) continue;
          if (p.groundR === B || (p.y < B.y && p.x > B.x - 10 && p.x < B.x + B.w + 10)) continue; // encima: a salvo
          const side = Math.sign(p.x - (B.x + B.w / 2));
          if (side !== J.dir || p.y < 200) continue;
          const d = Math.abs(p.x - fx);
          if (d > 900) continue;
          const k = (J.angry ? 4200 : 3400) * (1 - d / 1000) / Math.pow(p.mass, 1.25);
          p.vx -= J.dir * k * dt * (p.onGround ? 0.75 : 1);
          if (p.y < my - 40) p.vy += 300 * dt;
          if (Math.hypot(p.x - fx, p.y - my) < p.r + 24) swallow(p, G, '¡SUCCIONADO!', fx, my);
        }
        if (Math.random() < dt * 30 && !G.quiet) J.dust.push({ x: fx + J.dir * rnd(120, 520), y: rnd(470, 630), t: 0 });
        if (J.stateT > dur) { J.state = 'hot'; J.stateT = 0; if (!G.quiet) { FX.callout('¡SE RECALENTÓ!', B.x + B.w / 2, B.y - 90, '#ffb36b', 48, 1.3); sfx('dry'); } }
      } else if (J.state === 'hot') {
        if (Math.random() < dt * 12 && !G.quiet) FX.dust(B.x + rnd(30, B.w - 30), B.y, 1, 0.6);
        if (J.stateT > (J.angry ? 2.7 : 3.3)) { J.state = 'roam'; J.stateT = 0; J.roamFor = J.angry ? rnd(3.6, 4.8) : rnd(5, 6.6); J.dir = -J.dir; }
      }
      moveSolid(B, nx, B.y);
      J.dust.forEach(d => { d.t += dt; d.x += (this.front() - d.x) * dt * 3.2; }); J.dust = J.dust.filter(d => d.t < 0.6);
    },
    post(dt, G) {
      const B = J.body;
      for (const p of G.players) {
        if (!p.alive) continue;
        const c = contactWith(p, B); if (!c) continue;
        const v = hitValue(p, c);
        if (J.state === 'hot' && v > 0) { if (damage(G, p, v, p.x, B.y, v >= 2 && p.diveT > 0 ? 'APLASTÓN' : 'TIRACHINAS')) bounceOff(p, B, 560); }
        else if (v > 0) { clank(G, p.x, B.y); bounceOff(p, B, 420); }
        else if (J.state === 'roam' && Math.abs(c.nx) > 0.6 && Math.sign(c.nx) === J.dir && p.stun <= 0) {
          // el parachoques te empuja de frente
          p.vx = J.dir * 430 / Math.sqrt(p.mass / 3); p.vy = -240; p.stun = 0.2; p.onGround = false;
          if (!G.quiet) sfx('bump', 0.7);
        }
      }
    },
    vulnerable() { return J.state === 'hot'; },
    point() { return { x: J.body.x + J.body.w / 2, y: J.body.y }; },
    draw(ctx, G, t) {
      const B = J.body, ink = PALETTE.ink, rr = ArenaArt.rr;
      const cx = B.x + B.w / 2, hot = J.state === 'hot', suck = J.state === 'suck', warn = J.state === 'warn';
      ctx.save();
      // polvo que entra
      for (const d of J.dust) { ctx.fillStyle = `rgba(200,190,170,${0.7 * (1 - d.t / 0.6)})`; ctx.beginPath(); ctx.arc(d.x, d.y, 5, 0, TAU); ctx.fill(); }
      if (suck) {
        const fx = this.front();
        ctx.strokeStyle = 'rgba(127,216,255,0.55)'; ctx.lineWidth = 4;
        for (let k = 0; k < 5; k++) {
          const ph = (t * 2.4 + k / 5) % 1, x0 = fx + J.dir * (80 + 460 * (1 - ph));
          ctx.beginPath(); ctx.moveTo(x0, 500 + k * 26); ctx.quadraticCurveTo((x0 + fx) / 2, 560 + k * 10, fx + J.dir * 10, B.y + B.h * 0.55); ctx.stroke();
        }
      }
      // sombra
      ctx.fillStyle = 'rgba(40,20,10,0.22)'; ctx.beginPath(); ctx.ellipse(cx, B.y + B.h + 2, B.w * 0.52, 10, 0, 0, TAU); ctx.fill();
      // cuerpo: disco en perspectiva
      const flash = J.flash > 0 ? J.flash : 0;
      rr(ctx, B.x, B.y + 12, B.w, B.h - 12, 26);
      ctx.fillStyle = flash ? '#ffffff' : hot ? '#b94f3a' : '#5a6475'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = ink; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, B.y + 16, B.w / 2, 16, 0, 0, TAU);
      ctx.fillStyle = flash ? '#ffffff' : hot ? '#e0735a' : '#8b96a8'; ctx.fill(); ctx.stroke();
      // parachoques al frente
      const fx = this.front();
      rr(ctx, J.dir > 0 ? fx - 22 : fx - 4, B.y + 20, 26, B.h - 26, 10); ctx.fillStyle = '#2e3440'; ctx.fill(); ctx.stroke();
      // boca (rejilla) cuando aspira
      if (suck || warn) { ctx.fillStyle = suck ? '#111' : `rgba(17,17,17,${0.4 + 0.4 * Math.sin(t * 20)})`; rr(ctx, J.dir > 0 ? fx - 6 : fx - 12, B.y + 26, 18, B.h - 36, 6); ctx.fill(); }
      // ojos LED
      const ex = cx + J.dir * 46;
      for (const k of [-1, 1]) {
        ctx.beginPath(); ctx.ellipse(ex + k * 18, B.y + 14, 9, hot ? 3 : 7, 0, 0, TAU);
        ctx.fillStyle = hot ? '#ffe08a' : warn || suck ? '#7fd8ff' : '#9dffb0'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
      }
      // tapa / botón débil
      if (hot) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 10);
        ctx.beginPath(); ctx.ellipse(cx - 30, B.y + 12, 26, 9, 0, 0, TAU); ctx.fillStyle = `rgba(255,216,77,${0.5 + 0.5 * pulse})`; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
        outlinedText(ctx, '¡AHORA!', cx, B.y - 40 - pulse * 6, 26, '#ffd84d', ink);
        for (let k = 0; k < 3; k++) { const ph = (t * 1.4 + k / 3) % 1; ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - ph)})`; ctx.beginPath(); ctx.arc(cx + 40 + k * 16, B.y - ph * 70, 8 + ph * 10, 0, TAU); ctx.fill(); }
      } else {
        ctx.beginPath(); ctx.ellipse(cx - 30, B.y + 12, 20, 7, 0, 0, TAU); ctx.fillStyle = '#3a4250'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
      }
      // cepillos girando
      for (const bx of [B.x + 30, B.x + B.w - 30]) {
        ctx.save(); ctx.translate(bx, B.y + B.h); ctx.rotate(t * (J.state === 'roam' ? 14 : 3));
        ctx.strokeStyle = '#d9a300'; ctx.lineWidth = 3;
        for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.stroke(); }
        ctx.restore();
      }
      if (warn) outlinedText(ctx, J.dir > 0 ? '→' : '←', fx + J.dir * 60, B.y + 20, 54, '#7fd8ff', ink);
      ctx.restore();
    },
  };

  /* =============== EL SACAPUNTAS ELÉCTRICO =============== */
  const SAC = {
    TOP: 215, W: 190, H: 150,
    setup(G) {
      const b = { x: 960 - this.W / 2, y: this.TOP - this.H / 2, w: this.W, h: this.H, kind: 'sharpener' };
      J.body = addSolid(b); J.state = 'cruise'; J.stateT = 0; J.shots = []; J.shotT = 1.4; J.target = null; J.slams = 0; J.cutT = 0; J.tx = 960;
    },
    cx() { return J.body.x + J.body.w / 2; },
    floorAt(x) { return ARENA.groundBelow(x, 300); },
    update(dt, G) {
      const B = J.body; J.stateT += dt;
      let cx = this.cx(), top = B.y;
      const al = alive(G);
      if (J.cutT > 0) { J.cutT -= dt; ARENA.mods.cut = J.cutT > 0 ? 1 : 0; }
      if (J.state === 'cruise') {
        const mx = al.length ? al.reduce((a, p) => a + p.x, 0) / al.length : 960;
        cx += clamp(mx - cx, -1, 1) * Math.min(Math.abs(mx - cx), (J.angry ? 230 : 150) * dt);
        top += ((this.TOP - this.H / 2) - top) * Math.min(1, dt * 4);
        J.shotT -= dt;
        if (J.shotT <= 0 && J.stateT > 0.6) { J.shotT = J.angry ? 0.85 : 1.35; this.shoot(G, cx, top + this.H); }
        if (J.stateT > (J.angry ? 3.2 : 4.4) && al.length) {
          J.target = pick(al); J.state = 'aim'; J.stateT = 0;
          if (!G.quiet) sfx('beep', false);
        }
      } else if (J.state === 'aim') {
        const dur = J.angry ? 1.0 : 1.2, lockAt = dur - (J.angry ? 0.5 : 0.6);
        J.locked = J.stateT > lockAt;
        if (!J.locked) {
          const tx = J.target && J.target.alive ? J.target.x : cx;
          J.tx = clamp(tx, ARENA.deskLeft + this.W / 2 + 10, ARENA.deskRight - this.W / 2 - 10);
        }
        cx += clamp(J.tx - cx, -1, 1) * Math.min(Math.abs(J.tx - cx), 520 * dt);
        if (J.stateT > dur) { J.state = 'slam'; J.stateT = 0; J.slamFrom = top; J.slamTo = this.floorAt(cx) - this.H; }
      } else if (J.state === 'slam') {
        const floor = J.slamTo;
        const k = Math.min(1, J.stateT / 0.22);
        top = J.slamFrom + (floor - J.slamFrom) * k * k;
        // ¿quién quedó debajo?
        for (const p of G.players) {
          if (!p.alive) continue;
          if (Math.abs(p.x - cx) < this.W / 2 + p.r * 0.2 && p.y > top + this.H - 20 && p.y - p.r < top + this.H + 10) swallow(p, G, '¡TAJADO!', p.x, p.y);
        }
        if (k >= 1) {
          J.state = 'stuck'; J.stateT = 0;
          if (!G.quiet) { FX.shake(0.9); sfx('land', 1.4); FX.dust(cx, floor + this.H, 14, 1.4); FX.callout('¡ATASCADO!', cx, floor - 50, '#ffd84d', 50, 1.2); }
          // ¿mordió el hilo?
          if (G.rope.visible && G.rope.pts.some(q => Math.abs(q.x - cx) < this.W / 2 && q.y > floor - 10)) {
            J.cutT = 4; ARENA.mods.cut = 1;
            if (!G.quiet) FX.banner('¡SE COMIÓ EL HILO!', { sub: 'vuelve en 4 segundos', size: 96, life: 1.4, color: '#ffb0d0', y: 0.3 });
          }
        }
      } else if (J.state === 'stuck') {
        const floor = J.slamTo; top = floor;
        if (Math.random() < dt * 14 && !G.quiet) FX.sparkle(cx + rnd(-80, 80), top + rnd(10, 60), '#ffe08a', 2);
        if (J.stateT > (J.angry ? 2.6 : 3.3)) {
          J.slams++;
          // enojado: un segundo golpe al otro jugador
          if (J.angry && J.slams % 2 === 1 && al.length > 1) { J.target = al.find(p => p !== J.target) || al[0]; J.state = 'rise2'; }
          else J.state = 'rise';
          J.stateT = 0;
        }
      } else if (J.state === 'rise' || J.state === 'rise2') {
        top += ((this.TOP - this.H / 2) - top) * Math.min(1, dt * 5);
        if (J.stateT > 0.75) { J.state = J.state === 'rise2' ? 'aim' : 'cruise'; J.stateT = 0; }
      }
      moveSolid(B, cx - this.W / 2, top);
      // virutas
      for (const s of J.shots) {
        s.t += dt; s.vy += 1300 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.spin * dt;
        if (s.y > ARENA.groundBelow(s.x, s.y - 20) - 6 || s.y > 1100) s.dead = true;
        for (const p of G.players) {
          if (!p.alive || s.dead || Math.hypot(p.x - s.x, p.y - s.y) > p.r + 14) continue;
          s.dead = true;
          if (p.stuck) { if (!G.quiet) sfx('bump', 0.5); continue; } // pegado: aguanta
          const J2 = 620 / Math.pow(p.mass / 3, 0.7);
          p.vx += Math.sign(s.vx || (p.x - cx) || 1) * J2; p.vy = Math.min(p.vy, -240); p.stun = Math.max(p.stun, 0.3); p.onGround = false;
          if (!G.quiet) { sfx('bump', 0.9); FX.callout('¡VIRUTA!', p.x, p.y - p.r - 30, '#ffe0b0', 32, 0.8); }
        }
      }
      J.shots = J.shots.filter(s => !s.dead);
    },
    shoot(G, x, y) {
      const n = J.angry ? 2 : 1;
      for (let k = 0; k < n; k++) J.shots.push({ x, y: y - 10, vx: rnd(-330, 330), vy: rnd(-60, 120), t: 0, rot: rnd(TAU), spin: rnd(-9, 9) });
      if (!G.quiet) sfx('snip');
    },
    post(dt, G) {
      const B = J.body;
      for (const p of G.players) {
        if (!p.alive) continue;
        const c = contactWith(p, B); if (!c) continue;
        const v = hitValue(p, c);
        if (J.state === 'stuck' && v > 0) { if (damage(G, p, v, p.x, B.y + 30, p.diveT > 0 ? 'APLASTÓN' : 'TIRACHINAS')) bounceOff(p, B, 560); }
        else if (v > 0) { clank(G, p.x, B.y + 30); bounceOff(p, B, 400); }
      }
    },
    vulnerable() { return J.state === 'stuck'; },
    point() { return { x: this.cx(), y: J.body.y + this.H / 2 }; },
    draw(ctx, G, t) {
      const B = J.body, ink = PALETTE.ink, rr = ArenaArt.rr, cx = this.cx();
      ctx.save();
      // riel y cable
      ctx.fillStyle = '#7d8796'; ctx.fillRect(300, 112, 1320, 12); ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.strokeRect(300, 112, 1320, 12);
      ctx.strokeStyle = '#333'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx, 124); ctx.lineTo(cx, B.y); ctx.stroke();
      rr(ctx, cx - 26, 106, 52, 24, 8); ctx.fillStyle = '#5a6475'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
      // sombra de aviso
      if (J.state === 'aim' || J.state === 'slam') {
        const fy = this.floorAt(J.tx) - 2, a = J.locked || J.state === 'slam' ? 0.75 : 0.25 + 0.2 * Math.sin(t * 18);
        ctx.fillStyle = `rgba(255,60,40,${a})`; ctx.beginPath(); ctx.ellipse(J.tx, fy, this.W * 0.6, 16, 0, 0, TAU); ctx.fill();
      }
      const flash = J.flash > 0, stuck = J.state === 'stuck';
      // cuerpo
      rr(ctx, B.x, B.y, B.w, B.h, 22); ctx.fillStyle = flash ? '#ffffff' : J.angry ? '#e8574a' : '#4aa3ff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = ink; ctx.stroke();
      rr(ctx, B.x + 12, B.y + 12, B.w - 24, 44, 12); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
      // depósito de virutas (ventanita)
      rr(ctx, B.x + 22, B.y + 68, 70, 56, 10); ctx.fillStyle = '#ffe0b0'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
      for (let k = 0; k < 5; k++) { ctx.fillStyle = '#c98a4e'; ctx.beginPath(); ctx.arc(B.x + 36 + k * 11, B.y + 112 - (k % 2) * 8, 6, 0, TAU); ctx.fill(); }
      // agujero (boca) y ojos
      ctx.beginPath(); ctx.arc(B.x + B.w - 52, B.y + 96, 24, 0, TAU); ctx.fillStyle = '#222'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
      ctx.save(); ctx.translate(B.x + B.w - 52, B.y + 96); ctx.rotate(t * (stuck ? 30 : 8));
      ctx.strokeStyle = '#c9d3dc'; ctx.lineWidth = 3; for (let k = 0; k < 3; k++) { ctx.rotate(TAU / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(16, 0); ctx.stroke(); }
      ctx.restore();
      for (const k of [-1, 1]) {
        const ex = cx + k * 30, ey = B.y + 32;
        ctx.beginPath(); ctx.ellipse(ex, ey, 13, stuck ? 4 : 11, 0, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
        if (!stuck) { ctx.beginPath(); ctx.arc(ex + clamp(((J.target && J.target.alive ? J.target.x : 960) - cx) / 200, -5, 5), ey + 3, 5, 0, TAU); ctx.fillStyle = ink; ctx.fill(); }
        ctx.beginPath(); ctx.moveTo(ex - 14, ey - 16 - (J.angry ? 0 : 4)); ctx.lineTo(ex + 14, ey - 16 + (J.angry ? k * 6 : -4)); ctx.lineWidth = 4; ctx.stroke();
      }
      // manivela (punto débil cuando está atascado)
      ctx.save(); ctx.translate(B.x - 6, B.y + 70); ctx.rotate(stuck ? Math.sin(t * 20) * 0.3 : t * 2);
      ctx.strokeStyle = ink; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-34, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(-34, 0, 10, 0, TAU); ctx.fillStyle = stuck ? '#ffd84d' : '#e8574a'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
      ctx.restore();
      if (stuck) outlinedText(ctx, '¡AHORA!', cx, B.y - 34 - Math.sin(t * 10) * 6, 26, '#ffd84d', ink);
      // virutas en el aire
      for (const s of J.shots) {
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot);
        ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(0, -14, 14, 0); ctx.quadraticCurveTo(0, 6, -14, 0);
        ctx.fillStyle = '#f2c38a'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = ink; ctx.stroke();
        ctx.strokeStyle = '#e8574a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(0, -11, 12, 0); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    },
  };

  /* =============== EL ASEADOR =============== */
  const ASE = {
    W: 170, H: 46,
    setup(G) {
      const y = ARENA.deskY - this.H;
      const b = { x: ARENA.deskLeft + 8, y, w: this.W, h: this.H, kind: 'mop' };
      J.body = addSolid(b); J.side = -1; J.state = 'wait'; J.stateT = 0.8; J.waitFor = 2.6; J.wetT = 0; J.drops = [];
    },
    homeX(side) { return side < 0 ? ARENA.deskLeft + 8 : ARENA.deskRight - 8 - this.W; },
    update(dt, G) {
      const B = J.body; J.stateT += dt;
      let x = B.x;
      if (J.wetT > 0) { J.wetT -= dt; ARENA.mods.slip = J.wetT > 0 ? 1 : 0; }
      if (J.state === 'wait') {
        x = this.homeX(J.side);
        if (J.stateT > J.waitFor) { J.state = 'warn'; J.stateT = 0; if (!G.quiet) { FX.callout('¡CUIDADO, TRAPEADORA!', 960, 380, '#9dd6ff', 44, 1.2); sfx('bell'); } }
      } else if (J.state === 'warn') {
        x = this.homeX(J.side) + Math.sin(J.stateT * 40) * 5;
        if (J.stateT > (J.angry ? 0.75 : 1.0)) { J.state = 'sweep'; J.stateT = 0; J.dir = -J.side; if (!G.quiet) sfx('whoosh'); }
      } else if (J.state === 'sweep') {
        const sp = J.angry ? 700 : 540;
        x = B.x + J.dir * sp * dt;
        const end = this.homeX(J.dir);
        if ((J.dir > 0 && x >= end) || (J.dir < 0 && x <= end)) {
          x = end; J.side = J.dir; J.wetT = 3.2; ARENA.mods.slip = 1;
          if (!G.quiet) { FX.callout('¡PISO MOJADO!', 960, 520, '#9dd6ff', 40, 1.2); sfx('splash'); }
          // enojado: a veces se devuelve casi de una
          if (J.angry && Math.random() < 0.5 && !J.double) { J.double = true; J.state = 'warn'; J.stateT = 0.4; }
          else { J.double = false; J.state = 'wait'; J.stateT = 0; J.waitFor = J.angry ? 2.2 : 2.8; this.splash(G); }
        }
        // empuja a quien encuentre (los pegados al piso se salvan: pasa por encima)
        for (const p of G.players) {
          if (!p.alive || p.stuck) continue;
          const inX = p.x + p.r * 0.7 > x && p.x - p.r * 0.7 < x + this.W;
          if (inX && p.y + p.r > B.y - 4 && p.y - p.r < B.y + this.H) {
            p.vx = J.dir * 760 / Math.pow(p.mass / 3, 0.6); p.vy = -380; p.stun = Math.max(p.stun, 0.35); p.onGround = false;
            p.x = J.dir > 0 ? Math.max(p.x, x + this.W + p.r * 0.5) : Math.min(p.x, x - p.r * 0.5);
            if (!G.quiet && !(J.knT > 0)) { sfx('ram', 0.8); FX.callout('¡TRAPEADO!', p.x, p.y - p.r - 30, '#9dd6ff', 36, 0.9); J.knT = 0.4; }
          }
        }
      }
      J.knT = Math.max(0, (J.knT || 0) - dt);
      // en la pelea no es sólido mientras barre (así no te aplasta contra nada)
      B.solidOff = J.state === 'sweep';
      moveSolid(B, x, B.y);
      // gotas del balde (enojado)
      for (const d of J.drops) {
        d.vy += 1300 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
        if (d.y > ARENA.groundBelow(d.x, d.y - 20) - 6) d.dead = true;
        for (const p of G.players) if (p.alive && !d.dead && Math.hypot(p.x - d.x, p.y - d.y) < p.r + 12) {
          d.dead = true;
          if (!p.stuck) { p.vx += Math.sign(d.vx || 1) * 420 / Math.pow(p.mass / 3, 0.7); p.vy = Math.min(p.vy, -200); p.onGround = false; if (!G.quiet) sfx('splash', 0.5); }
        }
      }
      J.drops = J.drops.filter(d => !d.dead);
    },
    splash(G) {
      if (!J.angry) return;
      const x0 = J.side < 0 ? ARENA.deskLeft + 60 : ARENA.deskRight - 60;
      for (let k = 0; k < 4; k++) J.drops.push({ x: x0, y: 300, vx: -J.side * rnd(200, 620), vy: rnd(-520, -260) });
    },
    post(dt, G) {
      const B = J.body;
      if (J.state === 'sweep') return;
      for (const p of G.players) {
        if (!p.alive) continue;
        const c = contactWith(p, B); if (!c) continue;
        const v = hitValue(p, c);
        if (J.state === 'wait' && v > 0) { if (damage(G, p, v, p.x, B.y, p.diveT > 0 ? 'APLASTÓN' : 'TIRACHINAS')) bounceOff(p, B, 540); }
        else if (v > 0) { clank(G, p.x, B.y); bounceOff(p, B, 380); }
      }
    },
    vulnerable() { return J.state === 'wait'; },
    point() { return { x: J.body.x + this.W / 2, y: J.body.y }; },
    draw(ctx, G, t) {
      const B = J.body, ink = PALETTE.ink, rr = ArenaArt.rr, cx = B.x + this.W / 2;
      ctx.save();
      // charco
      if (J.wetT > 0) {
        ctx.fillStyle = `rgba(120,190,255,${0.35 * Math.min(1, J.wetT)})`;
        rr(ctx, ARENA.deskLeft + 10, ARENA.deskY - 6, ARENA.deskRight - ARENA.deskLeft - 20, 10, 5); ctx.fill();
      }
      // palo desde arriba (el aseador está fuera de cuadro)
      const lean = J.state === 'sweep' ? -J.dir * 0.32 : J.state === 'warn' ? Math.sin(t * 30) * 0.05 : J.side * 0.18;
      const topX = cx + Math.sin(lean) * 700, topY = B.y - 700;
      ctx.strokeStyle = ink; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(topX, topY); ctx.lineTo(cx, B.y + 6); ctx.stroke();
      ctx.strokeStyle = '#c98a4e'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(topX, topY); ctx.lineTo(cx, B.y + 6); ctx.stroke();
      // guante del aseador asomando
      const gx = cx + Math.sin(lean) * 330, gy = B.y - 330;
      ctx.beginPath(); ctx.arc(gx, gy, 34, 0, TAU); ctx.fillStyle = '#ffd84d'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
      ctx.beginPath(); ctx.arc(gx - 14, gy - 18, 12, 0, TAU); ctx.fill(); ctx.stroke();
      // cabeza de la trapeadora (mechas)
      const flash = J.flash > 0, rest = J.state === 'wait';
      rr(ctx, B.x + 10, B.y - 10, this.W - 20, 22, 8); ctx.fillStyle = flash ? '#ffffff' : '#3c8fe0'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
      for (let k = 0; k < 13; k++) {
        const mx = B.x + 8 + k * (this.W - 16) / 12, sw = Math.sin(t * 9 + k) * (J.state === 'sweep' ? 9 : 3) - (J.state === 'sweep' ? J.dir * 10 : 0);
        ctx.strokeStyle = ink; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(mx, B.y + 8); ctx.quadraticCurveTo(mx + sw * 0.5, B.y + 26, mx + sw, B.y + this.H); ctx.stroke();
        ctx.strokeStyle = flash ? '#ffffff' : J.angry ? '#ffb0b0' : '#eef2f6'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(mx, B.y + 8); ctx.quadraticCurveTo(mx + sw * 0.5, B.y + 26, mx + sw, B.y + this.H); ctx.stroke();
      }
      if (rest) outlinedText(ctx, '¡AHORA!', cx, B.y - 50 - Math.sin(t * 10) * 6, 26, '#ffd84d', ink);
      if (J.state === 'warn') outlinedText(ctx, J.side < 0 ? '→' : '←', cx - J.side * 130, B.y + 10, 60, '#9dd6ff', ink);
      // balde
      for (const d of J.drops) { ctx.fillStyle = '#8fd3ff'; ctx.strokeStyle = ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(d.x, d.y, 11, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.restore();
    },
  };

  /* =============== LA FOTOCOPIADORA (Biblioteca) =============== */
  // Dispara aviones de papel a tres alturas (bajo: salta · medio: pégate · alto: quieto),
  // imprime «copias» de papel que te empujan y, al final, se atasca: ¡a darle!
  const FOT = {
    W: 210, H: 196,
    LANES: [{ y: 612, name: '¡SALTA!', col: '#ff6b5a' }, { y: 548, name: '¡PÉGATE!', col: '#ffd84d' }, { y: 470, name: '¡QUIETO!', col: '#7fd8ff' }],
    setup(G) {
      ARENA.nextDrop = 1e9; // en la pelea no caen libros
      J.side = 1;
      J.body = addSolid({ x: this.homeX(1), y: ARENA.deskY - this.H, w: this.W, h: this.H, kind: 'copier' });
      J.state = 'idle'; J.stateT = 0; J.idleFor = 1.6; J.step = 0; J.planes = []; J.copies = []; J.queue = []; J.lane = -1;
    },
    homeX(side) { return side > 0 ? ARENA.deskRight - 16 - this.W : ARENA.deskLeft + 16; },
    mouthX() { const B = J.body; return J.side > 0 ? B.x - 4 : B.x + B.w + 4; },
    update(dt, G) {
      const B = J.body; J.stateT += dt;
      let x = B.x;
      if (J.state === 'idle') {
        if (J.stateT > J.idleFor) {
          const seq = J.angry ? ['print', 'copies', 'move', 'jam'] : ['print', 'copies', 'print', 'jam'];
          J.state = seq[J.step % seq.length]; J.step++; J.stateT = 0;
          if (J.state === 'print') {
            const n = J.angry ? 5 : 3; let last = -1; J.queue = [];
            for (let k = 0; k < n; k++) { let l; do { l = Math.floor(Math.random() * 3); } while (l === last); last = l; J.queue.push(l); }
            J.nextShot = 0.2;
          } else if (J.state === 'copies') {
            const n = J.angry ? 3 : 2;
            for (let k = 0; k < n; k++) J.copies.push({ x: this.mouthX(), y: ARENA.deskY, vx: 0, t: -k * 0.5, hp: 1, dir: -J.side, dead: false, kn: 0 });
            if (!G.quiet) { sfx('beep', false); FX.callout('¡COPIAS!', this.mouthX(), B.y - 40, '#fff6e6', 40, 1); }
          } else if (J.state === 'move') {
            if (!G.quiet) { FX.callout('¡SE MUEVE!', B.x + B.w / 2, B.y - 50, '#ffb36b', 44, 1); sfx('beep', false); }
          } else if (J.state === 'jam') {
            if (!G.quiet) { FX.callout('¡ATASCO DE PAPEL!', B.x + B.w / 2, B.y - 60, '#ffd84d', 46, 1.3); sfx('dry'); FX.shake(0.4); }
          }
        }
      } else if (J.state === 'print') {
        J.nextShot -= dt;
        if (J.lane < 0 && J.queue.length && J.nextShot <= 0) { J.lane = J.queue.shift(); J.laneT = 0; if (!G.quiet) sfx('beep', false); }
        if (J.lane >= 0) {
          J.laneT += dt;
          if (J.laneT > (J.angry ? 0.55 : 0.7)) {
            const L = this.LANES[J.lane];
            J.planes.push({ x: this.mouthX(), y: L.y, vx: -J.side * (J.angry ? 760 : 600), lane: J.lane, t: 0, dead: false });
            if (!G.quiet) sfx('whoosh');
            J.lane = -1; J.nextShot = J.angry ? 0.25 : 0.4;
          }
        }
        if (!J.queue.length && J.lane < 0 && J.nextShot <= -0.6) { J.state = 'idle'; J.stateT = 0; J.idleFor = J.angry ? 0.6 : 0.9; }
      } else if (J.state === 'copies') {
        if (J.stateT > 1.6) { J.state = 'idle'; J.stateT = 0; J.idleFor = J.angry ? 1.6 : 2.4; }
      } else if (J.state === 'move') {
        if (J.stateT > 0.8) {
          const to = this.homeX(-J.side), sp = 560;
          x = B.x + Math.sign(to - B.x) * sp * dt;
          if (Math.abs(to - x) < sp * dt) { x = to; J.side = -J.side; J.state = 'idle'; J.stateT = 0; J.idleFor = 0.4; if (!G.quiet) { sfx('land', 1.2); FX.shake(0.5); } }
        } else x = B.x + Math.sin(J.stateT * 50) * 3;
      } else if (J.state === 'jam') {
        if (Math.random() < dt * 10 && !G.quiet) FX.dust(B.x + rnd(20, B.w - 20), B.y, 1, 0.6);
        if (J.stateT > (J.angry ? 2.9 : 3.5)) { J.state = 'idle'; J.stateT = 0; J.idleFor = 1.0; }
      }
      moveSolid(B, x, B.y);
      // aviones
      for (const P of J.planes) {
        P.t += dt; P.x += P.vx * dt; P.y += Math.sin(P.t * 9) * 0.6;
        if (P.x < ARENA.deskLeft - 200 || P.x > ARENA.deskRight + 200) P.dead = true;
        for (const p of G.players) {
          if (!p.alive || P.dead || Math.abs(p.x - P.x) > p.r + 30 || Math.abs(p.y - P.y) > p.r + 14) continue;
          P.dead = true;
          if (p.stuck) { if (!G.quiet) { sfx('bump', 0.5); FX.callout('¡AGUANTA!', p.x, p.y - p.r - 30, '#ffd84d', 28, 0.7); } continue; }
          p.vx = Math.sign(P.vx) * 600 / Math.pow(p.mass / 3, 0.6); p.vy = Math.min(p.vy, -280); p.stun = Math.max(p.stun, 0.35); p.onGround = false;
          if (!G.quiet) { sfx('ram', 0.8); FX.callout('¡AVIONAZO!', p.x, p.y - p.r - 30, '#fff6e6', 34, 0.9); }
        }
      }
      J.planes = J.planes.filter(P => !P.dead);
      // copias de papel
      for (const c of J.copies) {
        c.t += dt; if (c.t < 0) { c.x = this.mouthX(); continue; }
        c.kn = Math.max(0, c.kn - dt);
        const al = alive(G);
        const tgt = al.length ? al.reduce((a, b) => (Math.abs(b.x - c.x) < Math.abs(a.x - c.x) ? b : a)) : null;
        if (tgt && c.kn <= 0) c.dir = Math.sign(tgt.x - c.x) || c.dir;
        c.x += c.dir * (J.angry ? 250 : 190) * dt;
        c.y = ARENA.groundBelow(c.x, ARENA.deskY - 60);
        if (c.y > ARENA.deskY + 20 || c.t > 11) { c.dead = true; if (!G.quiet) FX.dust(c.x, Math.min(c.y, 900), 6, 0.8); continue; }
        if (Math.abs(c.x - (J.body.x + this.W / 2)) < this.W / 2) { c.x = J.side > 0 ? J.body.x - 30 : J.body.x + this.W + 30; c.dir = -J.side; }
        for (const p of G.players) {
          if (!p.alive || c.dead) continue;
          const dx = p.x - c.x, dy = p.y - (c.y - 40);
          if (Math.abs(dx) > p.r + 24 || Math.abs(dy) > p.r + 40) continue;
          if ((p.vy > 250 && p.y < c.y - 50) || p.diveT > 0 || p.slingT > 0 || Math.abs(p.vx) > 430 && Math.sign(p.vx) === -Math.sign(dx)) {
            c.dead = true; p.vy = Math.min(p.vy, -520);
            if (!G.quiet) { sfx('snip'); FX.callout('¡ARRUGADA!', c.x, c.y - 90, '#fff6e6', 36, 0.9); FX.dust(c.x, c.y - 40, 10, 1); }
          } else if (!p.stuck && c.kn <= 0) {
            p.vx = c.dir * 470 / Math.pow(p.mass / 3, 0.6); p.vy = -220; p.stun = Math.max(p.stun, 0.25); p.onGround = false; c.kn = 0.5;
            if (!G.quiet) sfx('bump', 0.7);
          }
        }
      }
      J.copies = J.copies.filter(c => !c.dead);
    },
    post(dt, G) {
      const B = J.body;
      for (const p of G.players) {
        if (!p.alive) continue;
        const c = contactWith(p, B); if (!c) continue;
        const v = hitValue(p, c);
        if (J.state === 'jam' && v > 0) { if (damage(G, p, v, p.x, B.y + 20, p.diveT > 0 ? 'APLASTÓN' : 'TIRACHINAS')) bounceOff(p, B, 560); }
        else if (v > 0) { clank(G, p.x, B.y + 20); bounceOff(p, B, 400); }
      }
    },
    vulnerable() { return J.state === 'jam'; },
    point() { return { x: J.body.x + this.W / 2, y: J.body.y + 40 }; },
    draw(ctx, G, t) {
      const B = J.body, ink = PALETTE.ink, rr = ArenaArt.rr, jam = J.state === 'jam', flash = J.flash > 0;
      ctx.save();
      // aviso de la altura del próximo avión
      if (J.state === 'print' && J.lane >= 0) {
        const L = this.LANES[J.lane], a = 0.35 + 0.35 * Math.sin(t * 22);
        ctx.setLineDash([22, 14]); ctx.lineWidth = 5; ctx.strokeStyle = rgba(L.col, a);
        ctx.beginPath(); ctx.moveTo(ARENA.deskLeft, L.y); ctx.lineTo(ARENA.deskRight, L.y); ctx.stroke(); ctx.setLineDash([]);
        outlinedText(ctx, L.name, 960, L.y - 30, 34, L.col, ink);
      }
      // cuerpo
      rr(ctx, B.x, B.y + 40, B.w, B.h - 40, 16); ctx.fillStyle = flash ? '#fff' : J.angry ? '#e9b9a8' : '#e7e2d6'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = ink; ctx.stroke();
      // tapa (se abre en el atasco)
      ctx.save(); ctx.translate(J.side > 0 ? B.x + B.w : B.x, B.y + 40); ctx.rotate((jam ? 0.55 : 0.04 * Math.sin(t * 3)) * (J.side > 0 ? 1 : -1));
      rr(ctx, J.side > 0 ? -B.w : 0, -26, B.w, 28, 10); ctx.fillStyle = flash ? '#fff' : '#cfc8b8'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
      ctx.restore();
      if (jam) { ctx.fillStyle = '#1b2a4a'; rr(ctx, B.x + 18, B.y + 30, B.w - 36, 16, 6); ctx.fill(); outlinedText(ctx, '¡AHORA!', B.x + B.w / 2, B.y - 50 - Math.sin(t * 10) * 6, 26, '#ffd84d', ink); }
      // panel con cara
      const px = J.side > 0 ? B.x + 20 : B.x + B.w - 110;
      rr(ctx, px, B.y + 60, 90, 54, 10); ctx.fillStyle = '#2f3542'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
      for (const k of [0, 1]) { const ex = px + 24 + k * 42, ey = B.y + 86; ctx.beginPath(); ctx.ellipse(ex, ey, 10, jam ? 2 : 8, 0, 0, TAU); ctx.fillStyle = jam ? '#ffd84d' : J.angry ? '#ff6b5a' : '#7fd8ff'; ctx.fill(); }
      // botón verde y luz
      ctx.beginPath(); ctx.arc(px + 45, B.y + 136, 9, 0, TAU); ctx.fillStyle = J.state === 'print' && Math.floor(t * 8) % 2 ? '#3fbf6a' : '#1f6b3a'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
      // bandeja de salida con papeles
      const mx = this.mouthX(), d = -J.side;
      rr(ctx, d > 0 ? mx - 4 : mx - 76, B.y + 130, 80, 12, 5); ctx.fillStyle = '#9aa7b8'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#ffffff'; for (let k = 0; k < 3; k++) { ctx.fillRect(d > 0 ? mx + 4 + k * 3 : mx - 66 - k * 3, B.y + 122 - k * 4, 56, 6); }
      if (jam) { ctx.save(); ctx.translate(mx, B.y + 100); ctx.rotate(Math.sin(t * 16) * 0.1); ctx.fillStyle = '#fff'; ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(d * 60, -34); ctx.lineTo(d * 54, 10); ctx.lineTo(0, 16); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
      // patas
      ctx.fillStyle = ink; ctx.fillRect(B.x + 14, B.y + B.h - 6, 18, 6); ctx.fillRect(B.x + B.w - 32, B.y + B.h - 6, 18, 6);
      if (J.state === 'move' && J.stateT < 0.8) outlinedText(ctx, J.side > 0 ? '←' : '→', B.x + B.w / 2, B.y - 20, 60, '#ffb36b', ink);
      // aviones
      for (const P of J.planes) {
        ctx.save(); ctx.translate(P.x, P.y); ctx.scale(Math.sign(P.vx), 1);
        ctx.beginPath(); ctx.moveTo(34, 0); ctx.lineTo(-30, -16); ctx.lineTo(-18, 0); ctx.lineTo(-30, 14); ctx.closePath();
        ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(34, 0); ctx.lineTo(-18, 0); ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      }
      // copias: hojas con cara de chicle
      for (const c of J.copies) {
        if (c.t < 0) continue;
        const wob = Math.sin(c.t * 14) * 4;
        ctx.save(); ctx.translate(c.x, c.y);
        ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-10 + wob, 0); ctx.moveTo(8, -6); ctx.lineTo(10 - wob, 0); ctx.stroke();
        rr(ctx, -24, -74, 48, 66, 6); ctx.fillStyle = '#fbfbf6'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = 'rgba(58,34,22,0.15)'; for (let k = 0; k < 4; k++) ctx.fillRect(-16, -64 + k * 10, 32, 3);
        ctx.beginPath(); ctx.arc(0, -40, 15, 0, TAU); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(58,34,22,0.7)'; ctx.stroke();
        ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(-5 + c.dir * 2, -43, 2.5, 0, TAU); ctx.arc(5 + c.dir * 2, -43, 2.5, 0, TAU); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    },
  };

  /* =============== EL MICROONDAS (Cafetería) =============== */
  // Calienta pedazos del mesón (avisa en naranja; si quema, te lanza), suelta palomitas
  // que revientan, y cuando hace «¡DING!» abre la puerta: ahí se le pega.
  const MIC = {
    X: 810, Y: 196, W: 300, H: 200, N: 6,
    setup(G) {
      J.body = addSolid({ x: this.X, y: this.Y, w: this.W, h: this.H, kind: 'microwave' });
      const L = ARENA.deskLeft, w = (ARENA.deskRight - ARENA.deskLeft) / this.N;
      J.tiles = Array.from({ length: this.N }, (_, i) => ({ x0: L + i * w, x1: L + (i + 1) * w, st: 'cool', t: 0 }));
      J.state = 'idle'; J.stateT = 0; J.idleFor = 1.6; J.step = 0; J.kernels = []; J.spin = 0; J.burnCd = [0, 0];
      // dos repisas para subirle encima
      J.racks = [{ x: 600, y: 470, w: 170, h: 16, kind: 'rack' }, { x: 1150, y: 470, w: 170, h: 16, kind: 'rack' }];
      ARENA.oneway = ARENA.oneway.concat(J.racks);
    },
    cleanup() { if (J && J.racks) ARENA.oneway = ARENA.oneway.filter(P => !J.racks.includes(P)); },
    pickTiles() {
      const n = J.angry ? 3 : 2, idx = [...Array(this.N).keys()];
      if (J.angry && Math.random() < 0.5) { const s = Math.random() < 0.5 ? 0 : 1; return idx.filter(i => i % 2 === s); } // alternadas
      const out = []; while (out.length < n) { const i = Math.floor(Math.random() * this.N); if (!out.includes(i)) out.push(i); }
      return out;
    },
    update(dt, G) {
      const B = J.body; J.stateT += dt; J.spin += dt * (J.state === 'ding' ? 0.5 : 3);
      J.burnCd[0] = Math.max(0, J.burnCd[0] - dt); J.burnCd[1] = Math.max(0, J.burnCd[1] - dt);
      if (J.state === 'idle') {
        if (J.stateT > J.idleFor) {
          const seq = J.angry ? ['tiles', 'pop', 'tiles', 'ding'] : ['tiles', 'pop', 'ding'];
          J.state = seq[J.step % seq.length]; J.step++; J.stateT = 0;
          if (J.state === 'tiles') { const pick = this.pickTiles(); J.tiles.forEach((T, i) => { if (pick.includes(i)) { T.st = 'warn'; T.t = 0; } }); if (!G.quiet) sfx('beep', false); }
          else if (J.state === 'pop') {
            const n = J.angry ? 7 : 5;
            for (let k = 0; k < n; k++) { const tx = rnd(ARENA.deskLeft + 60, ARENA.deskRight - 60); J.kernels.push({ x: B.x + B.w / 2, y: B.y + B.h, vx: (tx - (B.x + B.w / 2)) / 0.9, vy: -520, t: 0, land: false, popT: 0, dead: false }); }
            if (!G.quiet) { sfx('snip'); FX.callout('¡PALOMITAS!', B.x + B.w / 2, B.y - 40, '#fff6e6', 42, 1); }
          } else if (J.state === 'ding') { if (!G.quiet) { sfx('bell'); FX.callout('¡DING!', B.x + B.w / 2, B.y - 50, '#ffd84d', 60, 1.2); } }
        }
      } else if (J.state === 'tiles') {
        if (J.stateT > (J.angry ? 3.0 : 3.2)) { J.tiles.forEach(T => { T.st = 'cool'; }); J.state = 'idle'; J.stateT = 0; J.idleFor = J.angry ? 0.5 : 0.9; }
      } else if (J.state === 'pop') {
        if (J.stateT > 2.4 && !J.kernels.length) { J.state = 'idle'; J.stateT = 0; J.idleFor = 0.8; }
      } else if (J.state === 'ding') {
        if (J.stateT > (J.angry ? 3.6 : 4.3)) { J.state = 'idle'; J.stateT = 0; J.idleFor = J.angry ? 0.9 : 1.2; if (!G.quiet) sfx('back'); }
      }
      // baldosas: aviso 1,1 s y luego queman 1,4 s
      const warnFor = J.angry ? 0.95 : 1.15;
      for (const T of J.tiles) {
        if (T.st === 'cool') continue;
        T.t += dt;
        if (T.st === 'warn' && T.t > warnFor) { T.st = 'hot'; T.t = 0; if (!G.quiet) sfx('dry'); }
        if (T.st === 'hot' && T.t > 1.4) { T.st = 'cool'; }
      }
      const hotTop = J.state === 'tiles' && J.tiles.some(T => T.st === 'hot');
      for (const p of G.players) {
        if (!p.alive || J.burnCd[p.id] > 0) continue;
        const onDesk = (p.onGround || p.stuck) && Math.abs(p.y + p.r - ARENA.deskY) < 10;
        const onTop = (p.onGround || p.stuck) && (p.groundR === B || p.stuckR === B) && p.y < B.y;
        const T = onDesk ? J.tiles.find(T => p.x >= T.x0 && p.x < T.x1) : null;
        if ((T && T.st === 'hot') || (onTop && hotTop)) {
          if (p.stuck) p.unstick('hit', 1, G);
          p.vy = -1180 / Math.pow(p.mass / 3, 0.3); p.vx = (p.x < 960 ? 1 : -1) * rnd(120, 360); p.onGround = false; p.stun = Math.max(p.stun, 0.4); J.burnCd[p.id] = 0.6;
          if (!G.quiet) { sfx('ram', 0.9); FX.callout('¡QUEMA!', p.x, p.y - p.r - 30, '#ff8a3d', 38, 0.9); FX.dust(p.x, p.y + p.r, 8, 1, 'rgba(255,170,90,0.9)'); }
        }
      }
      // palomitas: vuelan, caen, tiemblan y revientan
      for (const k of J.kernels) {
        k.t += dt;
        if (!k.land) { k.vy += 1100 * dt; k.x += k.vx * dt; k.y += k.vy * dt; const gy = ARENA.groundBelow(k.x, k.y - 30); if (k.vy > 0 && k.y >= gy - 10) { k.y = gy - 10; k.land = true; k.popT = 0; } if (k.y > 1100) k.dead = true; }
        else {
          k.popT += dt;
          if (k.popT > (J.angry ? 0.6 : 0.8)) {
            k.dead = true;
            if (!G.quiet) { sfx('splash', 0.6); FX.callout('¡POP!', k.x, k.y - 40, '#fff6e6', 34, 0.6); FX.dust(k.x, k.y, 10, 1.2, 'rgba(255,250,230,0.95)'); }
            for (const p of G.players) {
              if (!p.alive) continue;
              const dx = p.x - k.x, dy = p.y - k.y, d = Math.hypot(dx, dy);
              if (d > 125) continue;
              if (p.stuck) continue;
              const f = 520 * (1 - d / 170) / Math.pow(p.mass / 3, 0.6);
              p.vx += (Math.sign(dx) || 1) * f; p.vy = Math.min(p.vy, -320); p.onGround = false; p.stun = Math.max(p.stun, 0.25);
            }
          }
        }
      }
      J.kernels = J.kernels.filter(k => !k.dead);
    },
    post(dt, G) {
      const B = J.body;
      for (const p of G.players) {
        if (!p.alive) continue;
        const c = contactWith(p, B); if (!c) continue;
        let v = hitValue(p, c);
        if (!v && c.ny > 0.55 && p.vy < -380) v = 1; // cabezazo desde abajo
        if (J.state === 'ding' && v > 0) { if (damage(G, p, v, p.x, p.y, p.diveT > 0 ? 'APLASTÓN' : 'TIRACHINAS')) { p.vx = (p.x < B.x + B.w / 2 ? -1 : 1) * 380; p.vy = c.ny > 0.55 ? 300 : -480; p.onGround = false; } }
        else if (v > 0) { clank(G, p.x, p.y - 20); p.vx = (p.x < B.x + B.w / 2 ? -1 : 1) * 300; p.vy = c.ny > 0.55 ? 200 : -360; p.onGround = false; }
      }
    },
    vulnerable() { return J.state === 'ding'; },
    point() { return { x: J.body.x + this.W / 2, y: J.body.y + this.H / 2 }; },
    draw(ctx, G, t) {
      const B = J.body, ink = PALETTE.ink, rr = ArenaArt.rr, ding = J.state === 'ding', flash = J.flash > 0;
      ctx.save();
      // baldosas del mesón
      for (const T of J.tiles) {
        if (T.st === 'cool') continue;
        const hot = T.st === 'hot', a = hot ? 0.75 : 0.25 + 0.3 * Math.abs(Math.sin(t * 12));
        rr(ctx, T.x0 + 4, ARENA.deskY - 10, T.x1 - T.x0 - 8, 16, 6); ctx.fillStyle = hot ? `rgba(255,90,40,${a})` : `rgba(255,170,60,${a})`; ctx.fill();
        if (hot) for (let k = 0; k < 4; k++) { const ph = (t * 1.6 + k / 4) % 1; ctx.strokeStyle = `rgba(255,140,60,${0.6 * (1 - ph)})`; ctx.lineWidth = 3; const xx = T.x0 + (k + 0.5) * (T.x1 - T.x0) / 4; ctx.beginPath(); ctx.moveTo(xx, ARENA.deskY - 14 - ph * 70); ctx.quadraticCurveTo(xx + 10, ARENA.deskY - 30 - ph * 70, xx, ARENA.deskY - 46 - ph * 70); ctx.stroke(); }
        else outlinedText(ctx, '¡CALIENTE!', (T.x0 + T.x1) / 2, ARENA.deskY - 40, 22, '#ffb36b', ink);
      }
      // cadena que lo cuelga
      ctx.strokeStyle = '#6f655c'; ctx.lineWidth = 6; for (const cx of [B.x + 50, B.x + B.w - 50]) { ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, B.y); ctx.stroke(); }
      // cuerpo
      rr(ctx, B.x, B.y, B.w, B.h, 22); ctx.fillStyle = flash ? '#fff' : J.angry ? '#ff9a8a' : '#f2f2ee'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = ink; ctx.stroke();
      // ventana (puerta)
      const wx = B.x + 22, wy = B.y + 24, ww = B.w - 110, wh = B.h - 48;
      ctx.save();
      if (ding) { ctx.translate(wx, wy); ctx.scale(0.25, 1); ctx.translate(-wx, -wy); }
      rr(ctx, wx, wy, ww, wh, 14); ctx.fillStyle = ding ? '#fff3c4' : J.state === 'tiles' || J.state === 'pop' ? '#ffc76a' : '#3a4250'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
      ctx.restore();
      // plato giratorio con una taza adentro
      if (!ding) { ctx.save(); ctx.beginPath(); ctx.rect(wx + 4, wy + 4, ww - 8, wh - 8); ctx.clip(); ctx.translate(wx + ww / 2, wy + wh - 30); ctx.scale(1, 0.3); ctx.rotate(J.spin); ctx.beginPath(); ctx.arc(0, 0, 60, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill(); ctx.restore(); }
      else { rr(ctx, wx + 20, wy + 20, ww - 20, wh - 40, 10); ctx.fillStyle = '#ffe9a8'; ctx.fill(); outlinedText(ctx, '¡AHORA!', B.x + B.w / 2, B.y - 30 - Math.sin(t * 10) * 6, 28, '#ffd84d', ink); }
      // panel: ojos en el display
      const px = B.x + B.w - 78;
      rr(ctx, px, B.y + 24, 58, 40, 8); ctx.fillStyle = '#1b2a4a'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
      for (const k of [0, 1]) { ctx.beginPath(); ctx.ellipse(px + 17 + k * 24, B.y + 44, 6, ding ? 2 : 6, 0, 0, TAU); ctx.fillStyle = J.angry ? '#ff6b5a' : '#9dffb0'; ctx.fill(); }
      for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(px + 14 + (k % 3) * 15, B.y + 90 + Math.floor(k / 3) * 18, 5, 0, TAU); ctx.fillStyle = '#c9d3dc'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); }
      // palomitas
      for (const k of J.kernels) {
        const sh = k.land ? Math.sin(k.popT * 60) * 3 : 0;
        ctx.beginPath(); ctx.arc(k.x + sh, k.y, 11, 0, TAU); ctx.fillStyle = '#ffd84d'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = ink; ctx.stroke();
        ctx.beginPath(); ctx.arc(k.x + sh - 3, k.y - 4, 4, 0, TAU); ctx.fillStyle = '#fff6e0'; ctx.fill();
      }
      ctx.restore();
    },
  };

  /* =============== EL RELOJ (final, en lo alto de la torre) =============== */
  // Tres fases. Las manecillas giran (se pueden pisar o agarrar), el péndulo barre el piso,
  // las campanadas empujan hacia el vacío (¡péguense!) y después sale el cucú: ese es el punto débil.
  const REL = {
    CX: 960, CY: 330,
    setup(G) {
      const L = ARENA.L;
      J.minute = L.objs.find(o => o.kind === 'hand' && o.len > 200);
      J.hour = L.objs.find(o => o.kind === 'hand' && o.len <= 200);
      J.pend = L.objs.find(o => o.kind === 'pendulum');
      J.phase = 1; J.state = 'tick'; J.stateT = 0; J.tickFor = 4.5; J.dongs = 0; J.ring = 0; J.gears = []; J.gearT = 3; J.bird = null;
      J.body = addSolid({ x: this.CX - 46, y: -400, w: 92, h: 70, kind: 'cuckoo' }); // escondido hasta que sale
      this.applyPhase(G, true);
    },
    applyPhase(G, quiet) {
      const ph = J.phase;
      J.minute.period = [9, 7, 5.2][ph - 1]; J.minute.dir = ph === 3 ? -1 : 1;
      J.hour.off = ph < 2; J.hour.period = [14, 12, 8][ph - 1];
      J.pend.amp = [0.55, 0.75, 0.9][ph - 1]; J.pend.period = [2.8, 2.4, 2.0][ph - 1];
      if (!quiet && !G.quiet) { FX.banner(ph === 2 ? '¡LA HORA SE ACERCA!' : '¡MEDIANOCHE!', { sub: ph === 2 ? 'aparece el horario y caen engranajes' : 'todo gira al revés y más rápido', size: 110, life: 1.8, color: '#ff6b5a', y: 0.32 }); sfx('bell'); FX.shake(0.8); Sound.Music.setIntensity(ph === 2 ? 0.75 : 1); }
    },
    update(dt, G) {
      const B = J.body; J.stateT += dt; J.ring = Math.max(0, J.ring - dt);
      Campaign.tickHazards(dt, G);
      // cambio de fase por vida
      const want = J.hp <= 4 ? 3 : J.hp <= 9 ? 2 : 1;
      if (want > J.phase) { J.phase = want; this.applyPhase(G, false); }
      J.angry = J.phase >= 2;
      if (J.state === 'tick') {
        if (J.stateT > J.tickFor) { J.state = 'warn'; J.stateT = 0; J.dongs = 0; if (!G.quiet) FX.callout('¡VA A DAR LA HORA!', this.CX, 620, '#ffd84d', 44, 1.1); }
      } else if (J.state === 'warn') {
        if (J.stateT > 1.0) { this.dong(G); J.dongs++; J.state = J.dongs >= J.phase ? 'cuckoo' : 'warn2'; J.stateT = 0; if (J.state === 'cuckoo') this.birdOut(G); }
      } else if (J.state === 'warn2') {
        if (J.stateT > 0.75) { this.dong(G); J.dongs++; J.stateT = 0; if (J.dongs >= J.phase) { J.state = 'cuckoo'; this.birdOut(G); } }
      } else if (J.state === 'cuckoo') {
        const dur = [3.4, 3.0, 2.6][J.phase - 1];
        const k = Math.min(1, J.stateT / 0.3), back = J.stateT > dur ? Math.min(1, (J.stateT - dur) / 0.3) : 0;
        const ext = 260 * k * (1 - back);
        moveSolid(B, this.CX - 46, this.CY + 10 + ext - 35);
        if (back >= 1) { J.state = 'tick'; J.stateT = 0; J.tickFor = [4.5, 3.8, 3.2][J.phase - 1]; moveSolid(B, this.CX - 46, -400); }
      }
      if (J.state !== 'cuckoo') { B.dx = 0; B.dy = 0; }
      // engranajes que caen (fases 2 y 3)
      if (J.phase >= 2) {
        J.gearT -= dt;
        if (J.gearT <= 0) { J.gearT = J.phase === 3 ? rnd(1.2, 1.9) : rnd(2.2, 3.2); J.gears.push({ x: rnd(420, 1500), y: -60, vy: 0, t: 0, warn: 0.9, rot: 0, dead: false }); }
      }
      for (const g of J.gears) {
        g.t += dt;
        if (g.t < g.warn) continue;
        g.vy += 1600 * dt; g.y += g.vy * dt; g.rot += dt * 6;
        const gy = ARENA.groundBelow(g.x, g.y - 40);
        if (g.y > gy - 26) { g.dead = true; if (!G.quiet) { sfx('land', 1); FX.dust(g.x, gy, 10, 1.1); FX.shake(0.3); } }
        for (const p of G.players) {
          if (!p.alive || g.dead || Math.hypot(p.x - g.x, p.y - g.y) > p.r + 30) continue;
          g.dead = true;
          if (p.stuck) p.unstick('hit', 1, G);
          p.stun = Math.max(p.stun, 0.5); p.vy = Math.max(p.vy, 260); p.vx += (p.x < g.x ? -1 : 1) * 260;
          if (!G.quiet) { sfx('ram', 0.9); FX.stars(g.x, g.y, 7, 0.9); FX.callout('¡ENGRANAJAZO!', p.x, p.y - p.r - 40, '#ffd84d', 36, 1); }
        }
      }
      J.gears = J.gears.filter(g => !g.dead && g.y < 1200);
    },
    dong(G) {
      J.ring = 1.1;
      if (!G.quiet) { sfx('bell'); FX.shake(0.7); FX.callout('¡DONG!', this.CX, 120, '#ffd84d', 64, 0.9); }
      const power = [980, 1100, 1220][J.phase - 1];
      for (const p of G.players) {
        if (!p.alive) continue;
        const dx = p.x - this.CX, dy = p.y - this.CY, d = Math.hypot(dx, dy);
        if (d > 900) continue;
        if (p.stuck && p.stuckR && p.stuckR.kind !== 'handpeg') { if (!G.quiet) FX.callout('¡AGUANTA!', p.x, p.y - 70, '#ffd84d', 26, 0.7); continue; }
        if (p.stuck) p.unstick('hit', 1, G);
        const f = power * (1 - d / 1100), ux = dx / (d || 1);
        p.vx += (Math.sign(ux) || 1) * f; p.vy = Math.min(p.vy, -300); p.onGround = false; p.stun = Math.max(p.stun, 0.3);
      }
    },
    birdOut(G) { if (!G.quiet) { FX.callout('¡CU-CÚ!', this.CX, this.CY + 330, '#ffd84d', 56, 1.2); sfx('beep', false); } },
    post(dt, G) {
      if (J.state !== 'cuckoo') return;
      const B = J.body;
      for (const p of G.players) {
        if (!p.alive) continue;
        const c = contactWith(p, B); if (!c) continue;
        let v = hitValue(p, c);
        if (!v && c.ny > 0.55 && p.vy < -360) v = 1;
        if (!v && Math.hypot(p.vx, p.vy) > 520) v = 1;
        if (v > 0 && damage(G, p, v, p.x, p.y - 20, p.diveT > 0 ? 'APLASTÓN' : p.slingT > 0 ? 'TIRACHINAS' : 'CUCAZO')) { p.vx = (p.x < this.CX ? -1 : 1) * 420; p.vy = c.ny > 0.55 ? 240 : -460; p.onGround = false; }
      }
    },
    vulnerable() { return J.state === 'cuckoo'; },
    point() { return { x: this.CX, y: J.state === 'cuckoo' ? J.body.y + 35 : this.CY }; },
    draw(ctx, G, t) {
      const B = J.body, ink = PALETTE.ink, rr = ArenaArt.rr, cx = this.CX, cy = this.CY;
      ctx.save();
      // ondas de la campanada
      if (J.ring > 0) for (let k = 0; k < 3; k++) { const f = 1 - J.ring / 1.1 + k * 0.1; if (f > 1) continue; ctx.beginPath(); ctx.arc(cx, cy, 900 * f, 0, TAU); ctx.lineWidth = 8 * (1 - f); ctx.strokeStyle = `rgba(255,216,77,${0.8 * (1 - f)})`; ctx.stroke(); }
      if (J.state === 'warn' || J.state === 'warn2') {
        const a = 0.3 + 0.3 * Math.sin(t * 20);
        ctx.beginPath(); ctx.arc(cx, cy, 280, 0, TAU); ctx.lineWidth = 10; ctx.strokeStyle = `rgba(229,83,61,${a})`; ctx.stroke();
        outlinedText(ctx, '¡PÉGUENSE!', cx, 700, 40, '#ff6b5a', ink);
      }
      // cara del reloj (ojos sobre la esfera)
      const blink = J.state === 'cuckoo' ? 0.2 : 1;
      for (const k of [-1, 1]) {
        const ex = cx + k * 70, ey = cy - 70;
        ctx.beginPath(); ctx.ellipse(ex, ey, 26, 26 * blink, 0, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = ink; ctx.stroke();
        if (blink > 0.5) { const al = alive(G), tx = al.length ? al[0].x : cx; ctx.beginPath(); ctx.arc(ex + clamp((tx - cx) / 120, -10, 10), ey + 5, 9, 0, TAU); ctx.fillStyle = J.phase === 3 ? '#e5533d' : ink; ctx.fill(); }
        ctx.beginPath(); ctx.moveTo(ex - 28, ey - 34 + (J.angry ? k * -8 : 0)); ctx.lineTo(ex + 28, ey - 34 - (J.angry ? k * -8 : 0)); ctx.lineWidth = 7; ctx.strokeStyle = ink; ctx.stroke();
      }
      // puertita del cucú y el pájaro
      rr(ctx, cx - 40, cy + 120, 80, 56, 10); ctx.fillStyle = J.state === 'cuckoo' ? '#2a1710' : '#8a5a2b'; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
      if (J.state === 'cuckoo') {
        const by = B.y, flash = J.flash > 0;
        ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 6; ctx.beginPath();
        for (let k = 0; k <= 10; k++) { const yy = cy + 150 + (by - cy - 150) * k / 10; ctx.lineTo(cx + (k % 2 ? 14 : -14), yy); } ctx.stroke();
        ctx.beginPath(); ctx.ellipse(cx, by + 38, 46, 34, 0, 0, TAU); ctx.fillStyle = flash ? '#fff' : '#ffd84d'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = ink; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 40, by + 34); ctx.lineTo(cx + 70, by + 42); ctx.lineTo(cx + 40, by + 50); ctx.closePath(); ctx.fillStyle = '#ff8a3d'; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx + 18, by + 28, 6, 0, TAU); ctx.fillStyle = ink; ctx.fill();
        outlinedText(ctx, '¡AHORA!', cx, by - 22 - Math.sin(t * 10) * 6, 28, '#ffd84d', ink);
      }
      // engranajes que caen
      for (const g of J.gears) {
        if (g.t < g.warn) { const a = 0.3 + 0.4 * Math.abs(Math.sin(t * 14)); ctx.fillStyle = `rgba(229,83,61,${a})`; ctx.beginPath(); ctx.ellipse(g.x, ARENA.groundBelow(g.x, 0) - 2, 40, 10, 0, 0, TAU); ctx.fill(); continue; }
        ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.rot); ctx.beginPath();
        for (let k = 0; k < 20; k++) { const a = k / 20 * TAU, r = k % 2 ? 22 : 30; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        ctx.closePath(); ctx.fillStyle = '#b8863a'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.fillStyle = '#6b4a2a'; ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    },
  };

  const IMPL = { aspiradora: ASP, sacapuntas: SAC, aseador: ASE, fotocopiadora: FOT, microondas: MIC, reloj: REL };

  /* ---------------- ciclo de la pelea ---------------- */
  function setup(G) {
    clear();
    const def = BY[G.jefeId] || LIST[0];
    J = { def, impl: IMPL[def.id], hp: def.hp, maxHp: def.hp, hearts: 3, t: 0, invT: 0, pcd: [0, 0], flash: 0, heartFlash: 0, hits: 0, angry: false, over: null, overT: 0, clankT: 0, lossBy: {} };
    J.impl.setup(G);
    G.goldenNext = 1e9;
  }
  function clear() {
    if (J && J.impl && J.impl.cleanup) J.impl.cleanup();
    if (J && J.body) removeSolid(J.body);
    if (J) { ARENA.mods.cut = 0; ARENA.mods.slip = 0; }
    J = null;
  }
  function update(dt, G) {
    if (!J || G.mode !== 'jefe') return;
    J.invT = Math.max(0, J.invT - dt); J.pcd[0] = Math.max(0, J.pcd[0] - dt); J.pcd[1] = Math.max(0, J.pcd[1] - dt);
    J.flash = Math.max(0, J.flash - dt * 4); J.heartFlash = Math.max(0, J.heartFlash - dt * 1.5); J.clankT = Math.max(0, J.clankT - dt);
    G.golden = null; G.goldenNext = 1e9;
    if (G.state !== 'play') { if (J.body) { J.body.dx = 0; J.body.dy = 0; } return; }
    J.t += dt;
    if (J.over === 'win') { J.overT += dt; if (J.body) { J.body.dx = 0; J.body.dy = 0; } if (Math.random() < dt * 20 && !G.quiet) { const P = J.impl.point(); FX.stars(P.x + rnd(-80, 80), P.y + rnd(-40, 40), 2, 1); } return; }
    if (J.over === 'lose') J.overT += dt;
    J.impl.update(dt, G);
  }
  function post(dt, G) { if (J && G.mode === 'jefe' && G.state === 'play' && !J.over) J.impl.post(dt, G); }
  function onDunk(p, G) { if (J && !J.over) { J.lossBy.caneca = (J.lossBy.caneca || 0) + 1; loseHeart(G); } void p; }
  // 'win' | 'lose' | undefined
  function status(G) {
    if (!J || !J.over) return undefined;
    if (J.overT < (J.over === 'win' ? 2.2 : 1.6)) return undefined;
    if (!J.result) {
      const t = J.t, id = J.def.id;
      const win = J.over === 'win';
      let newBest = false;
      if (win) {
        newBest = data.best[id] === undefined || t < data.best[id];
        if (newBest) data.best[id] = +t.toFixed(1);
        data.wins[id] = (data.wins[id] || 0) + 1;
        Store.set('jefes', data);
        Progress.on('jefe', { id, hearts: J.hearts });
      }
      J.result = { id, win, t, hearts: J.hearts, newBest, hits: J.hits };
    }
    return J.over;
  }

  /* ---------------- dibujo ---------------- */
  function drawWorld(ctx, G, t) { if (J && G.mode === 'jefe' && J.body) J.impl.draw(ctx, G, t); }
  function heart(ctx, x, y, s, full, ink) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 20, s / 20);
    ctx.beginPath(); ctx.moveTo(0, 7); ctx.bezierCurveTo(-14, -3, -10, -16, 0, -8); ctx.bezierCurveTo(10, -16, 14, -3, 0, 7); ctx.closePath();
    ctx.fillStyle = full ? '#ff5c7a' : 'rgba(58,34,22,0.12)'; ctx.fill(); ctx.lineWidth = 2.2; ctx.strokeStyle = ink; ctx.stroke();
    ctx.restore();
  }
  function drawHUD(ctx, W, H, G) {
    if (!J || G.mode !== 'jefe') return;
    const ink = PALETTE.ink, rr = ArenaArt.rr;
    const w = Math.min(520, W - 760), x = W / 2 - w / 2, y = 122;
    ctx.save();
    // barra de vida del jefe
    rr(ctx, x, y, w, 20, 10); ctx.fillStyle = 'rgba(40,20,10,0.55)'; ctx.fill();
    const k = J.hp / J.maxHp;
    if (k > 0) { rr(ctx, x + 3, y + 3, (w - 6) * k, 14, 7); ctx.fillStyle = J.flash > 0 ? '#ffffff' : J.angry ? '#ff6b5a' : '#ffb03b'; ctx.fill(); }
    rr(ctx, x, y, w, 20, 10); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
    for (let i = 1; i < J.maxHp; i++) { const sx = x + 3 + (w - 6) * i / J.maxHp; ctx.strokeStyle = 'rgba(58,34,22,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, y + 4); ctx.lineTo(sx, y + 16); ctx.stroke(); }
    ctx.restore();
  }
  function centerLabel() { return J ? { label: J.def.short, hearts: J.hearts, flash: J.heartFlash } : null; }

  variants();
  return {
    LIST, BY, data, setup, clear, update, post, onDunk, status, drawWorld, drawHUD, heart, centerLabel,
    get result() { return J && J.result; }, get state() { return J; },
    point() { return J && J.body ? J.impl.point() : null; },
    get def() { return J ? J.def : null; },
    unlocked: id => { const i = LIST.findIndex(d => d.id === id); return i <= 0 || !!data.wins[LIST[i - 1].id]; },
  };
})();
