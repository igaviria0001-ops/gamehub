/* =========================================================================
   COSTA (Cartagena) — el galeón pirata y el castillo disparan cañonazos.
   · Siempre avisan: la tronera se enciende y la mecha chisporrotea 1,3 s
     (y si el cañón está fuera de la vista, sale una flecha en el borde).
   · La bala vuela en arco (con gravedad) hacia donde vas a estar. Un tonel
     la esquiva, y a balazos se puede reventar en el aire.
   · Al caer revienta: en el agua levanta una columna de espuma.
   · Las velas del galeón se agujerean con las balas; en la cofa del palo
     mayor y en la cubierta se puede posar (el barco te lleva).
   · Pólvora sobre la ciudad vieja y pelícanos que pasan (solo adorno).
   ========================================================================= */
const Coast = (() => {
  const GRAV = 520, BALL_R = 10, WARN = 1.3;
  // troneras del costado (coordenadas del barco: x hacia la proa, y desde el nivel del mar)
  const PORTS = [-118, -66, -14, 38, 90];

  function seaY(W) { return W.def.ground(W.ship ? W.ship.x : 600); }
  function shipDeck(W) { return seaY(W) - W.ship.deck; }
  // velas de cada palo en coordenadas del barco
  function sails(S) {
    const out = [];
    S.masts.forEach(([ox, h], m) => {
      const d = -S.deck;
      out.push({ m, x0: ox - h * 0.25, x1: ox + h * 0.25, y0: d - h * 0.56, y1: d - h * 0.24 });
      out.push({ m, x0: ox - h * 0.18, x1: ox + h * 0.18, y0: d - h * 0.86, y1: d - h * 0.61 });
    });
    return out;
  }
  // de dónde sale el cañonazo
  function muzzle(W, src, tx) {
    if (src === 'ship') {
      const S = W.ship, sea = seaY(W);
      let best = PORTS[0], bd = Infinity;
      for (const p of PORTS) { const x = S.x + p * S.turn, d = Math.abs(x - tx); if (d < bd) { bd = d; best = p; } }
      return { x: S.x + best * S.turn, y: sea - 22, port: best };
    }
    const F = W.def.fort, x = F.gun;
    return { x: x - 26, y: W.groundY(x) - 18 };
  }

  function step(G, dt) {
    const W = G.world, C = W.coast; if (!C) return;
    const live = (G.state === 'play' || G.state === 'attract') && G.canFight && G.mode !== 'school';
    // pólvora (adorno, con su propio azar)
    C.fwT -= dt;
    if (C.fwT <= 0) {
      C.fwT = 2.2 + C.r() * 3.5;
      const x = 1500 + C.r() * 1700, y = 380 + C.r() * 420;
      C.fw.push({ x, y, x0: x + (C.r() - 0.5) * 120, y0: W.groundY(x), t: 0, rise: 0.9, hue: Math.floor(C.r() * 6), n: 34 + Math.floor(C.r() * 16), seed: C.r() * 100 });
    }
    for (let i = C.fw.length - 1; i >= 0; i--) { const F = C.fw[i]; F.t += dt; if (F.t > F.rise + 1.9) C.fw.splice(i, 1); else if (!F.popped && F.t > F.rise) { F.popped = true; G.events.push({ type: 'fw', x: F.x, y: F.y }); } }
    // cañonazos
    if (C.warn) {
      C.warn.t -= dt;
      const b = G.birds[C.warn.id];
      if (C.warn.t <= 0) { if (b && b.alive && live) fire(G, C.warn, b); C.warn = null; }
    } else if (live) {
      C.shotT -= dt;
      if (C.shotT <= 0) {
        C.shotT = 4.2 + G.rng() * 3.2;
        const srcs = [];
        for (const src of ['ship', 'fort']) {
          if (src === 'ship' && (!W.ship || W.ship.turnT > 0)) continue;
          let best = null, bd = 1650;
          for (const b of G.birds) {
            if (!b.alive || b.perch && b.perch.ship) continue;
            const m = muzzle(W, src, b.x), d = Math.hypot(b.x - m.x, b.y - m.y);
            // el cañón apunta hacia arriba y a los lados, no hacia abajo
            if (d < bd && d > 220 && b.y < m.y - 40) { bd = d; best = b; }
          }
          if (best) srcs.push([src, best]);
        }
        if (srcs.length) {
          C.side = 1 - C.side;
          const [src, b] = srcs.length > 1 ? srcs[C.side] : srcs[0];
          C.warn = { src, id: b.id, t: WARN };
          G.events.push({ type: 'cannonWarn', src, b, x: b.x, y: b.y });
        }
      }
    }
    // balas de cañón
    for (let i = C.balls.length - 1; i >= 0; i--) {
      const B = C.balls[i];
      B.px = B.x; B.py = B.y; B.t += dt;
      B.vy += GRAV * dt; B.x += B.vx * dt; B.y += B.vy * dt;
      let gone = false;
      for (const b of G.birds) {
        if (!b.alive || b.perch && b.perch.ship && B.src === 'ship' && B.t < 0.3) continue;
        if (!segCircle(B.px, B.py, B.x, B.y, b.x, b.y, b.r + BALL_R)) continue;
        if (b.evadeT > 0) { if (!B.near) { B.near = true; G.events.push({ type: 'nearMiss', b, x: b.x, y: b.y }); G.events.push({ type: 'cannonDodge', b }); } continue; }
        b.damage(0.075 * b.sp.hp, -1, 'cannon'); b.stun = Math.max(b.stun, 0.45);
        const s = Math.hypot(B.vx, B.vy) || 1; b.push(B.vx / s * 420, B.vy / s * 420 - 120);
        G.events.push({ type: 'cannonHit', b, x: b.x, y: b.y });
        burst(G, B.x, B.y, false, b); gone = true; break;
      }
      if (gone) { C.balls.splice(i, 1); continue; }
      const solid = B.t > 0.25 || B.src !== 'ship' ? World.solidAt(W, B.x, B.y, 4) : (B.y > W.groundY(B.x) ? { kind: 'water' } : null);
      if (solid) { burst(G, B.x, Math.min(B.y, W.groundY(B.x)), solid.kind === 'water', null); C.balls.splice(i, 1); continue; }
      if (B.x < -300 || B.x > W.w + 300 || B.y > W.h + 300) C.balls.splice(i, 1);
    }
  }
  function fire(G, w, b) {
    const W = G.world, C = W.coast, m = muzzle(W, w.src, b.x);
    const dist = Math.hypot(b.x - m.x, b.y - m.y), T = clamp(dist / 980, 0.55, 1.5);
    // apunta a donde va a estar (sin adivinar del todo: con un cambio de rumbo se esquiva)
    const tx = b.x + b.vx * T * 0.75, ty = b.y + b.vy * T * 0.75;
    const vx = (tx - m.x) / T, vy = (ty - m.y) / T - 0.5 * GRAV * T;
    C.balls.push({ x: m.x, y: m.y, px: m.x, py: m.y, vx, vy, t: 0, src: w.src });
    if (w.src === 'ship') W.ship.recoil = 1;
    else W.coast.fortRecoil = 1;
    G.events.push({ type: 'cannon', x: m.x, y: m.y, dir: Math.sign(vx) || 1, src: w.src });
  }
  function burst(G, x, y, water, hitB) {
    const W = G.world;
    if (water) { G.events.push({ type: 'splash', x, y: W.groundY(x) }); return; }
    Combat.explode(G, x, y, -1, hitB ? 0 : 22, 0.62, 'cannon');
  }
  // una bala de ráfaga: revienta la bala de cañón o agujerea una vela
  function bulletHit(G, u) {
    const W = G.world, C = W.coast;
    for (let i = C.balls.length - 1; i >= 0; i--) {
      const B = C.balls[i];
      if (segCircle(u.px, u.py, u.x, u.y, B.x, B.y, BALL_R + 6)) {
        C.balls.splice(i, 1); burst(G, B.x, B.y, false, null);
        G.events.push({ type: 'ballDown', x: B.x, y: B.y, by: u.owner });
        return true;
      }
    }
    const S = W.ship;
    if (S && Math.abs(u.x - S.x) < S.L / 2 + 80 && Math.abs(S.turn) > 0.3) {
      const lx = (u.x - S.x) / S.turn, ly = u.y - seaY(W);
      for (const s of sails(S)) if (lx > s.x0 && lx < s.x1 && ly > s.y0 && ly < s.y1) {
        if (S.holes.length > 60) S.holes.shift();
        S.holes.push({ lx, ly, r: 3 + G.rng() * 4, a: G.rng() * TAU });
        break;
      }
    }
    return false;
  }
  // para la máquina: ¿por aquí va a pasar una bala de cañón en el próximo segundo?
  function danger(W, x, y) {
    const C = W.coast; if (!C) return false;
    for (const B of C.balls) {
      let bx = B.x, by = B.y, vy = B.vy;
      for (let t = 0; t < 1.1; t += 0.1) { if (Math.abs(bx - x) < 90 && Math.abs(by - y) < 90) return true; bx += B.vx * 0.1; vy += GRAV * 0.1; by += vy * 0.1; }
    }
    return false;
  }

  /* ---------- dibujo ---------- */
  function drawWorld(ctx, G) {
    const W = G.world, C = W.coast; if (!C) return;
    const t = G.time;
    drawPelicans(ctx, W, t);
    drawFireworks(ctx, C);
    if (W.ship) drawShip(ctx, G, W.ship, t);
    drawFortGun(ctx, G, t);
    // balas en vuelo
    for (const B of C.balls) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const s = Math.hypot(B.vx, B.vy) || 1, tg = ctx.createLinearGradient(B.x, B.y, B.x - B.vx / s * 70, B.y - B.vy / s * 70);
      tg.addColorStop(0, 'rgba(255,200,150,0.35)'); tg.addColorStop(1, 'rgba(255,200,150,0)');
      ctx.strokeStyle = tg; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(B.x, B.y); ctx.lineTo(B.x - B.vx / s * 70, B.y - B.vy / s * 70); ctx.stroke();
      ctx.restore();
      const k = G.vs || 1, r = BALL_R * k;
      const g = ctx.createRadialGradient(B.x - r * 0.35, B.y - r * 0.35, 1, B.x, B.y, r);
      g.addColorStop(0, '#8a8178'); g.addColorStop(1, '#1b1714');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(B.x, B.y, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,170,90,0.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(B.x, B.y, r + 1, -2.4, -0.8); ctx.stroke();
    }
  }
  // aviso en la tronera: brillo que palpita y la mecha que chisporrotea
  function drawWarnAt(ctx, x, y, w, t) {
    const k = 1 - w.t / WARN, on = Math.sin(t * (12 + 26 * k)) > 0;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const R = 34 + 30 * k, g = ctx.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0, `rgba(255,150,60,${on ? 0.75 : 0.4})`); g.addColorStop(1, 'rgba(255,90,30,0)');
    ctx.fillStyle = g; ctx.fillRect(x - R, y - R, R * 2, R * 2);
    for (let i = 0; i < 4; i++) { const a = t * 30 + i * 1.7, d = 6 + ((t * 40 + i * 5) % 10); ctx.fillStyle = 'rgba(255,230,150,0.9)'; ctx.fillRect(x + Math.cos(a) * d, y - 8 + Math.sin(a) * d, 2.5, 2.5); }
    ctx.restore();
    ctx.save(); ctx.font = font(22); ctx.textAlign = 'center'; ctx.fillStyle = on ? '#ffd27a' : '#ff8a5a'; ctx.fillText('!', x, y - 34 - 10 * k); ctx.restore();
  }

  function drawShip(ctx, G, S, t) {
    const W = G.world, sea = seaY(W), C = W.coast, half = S.L / 2;
    S.recoil = Math.max(0, (S.recoil || 0) - 1 / 40);
    const bob = Math.sin(t * 1.3) * 3;
    // estela de espuma detrás cuando navega
    if (S.turnT <= 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const wx = S.x - S.dir * (half + 10), wg = ctx.createLinearGradient(wx, 0, wx - S.dir * 260, 0);
      wg.addColorStop(0, 'rgba(255,240,230,0.35)'); wg.addColorStop(1, 'rgba(255,240,230,0)');
      ctx.fillStyle = wg; ctx.fillRect(Math.min(wx, wx - S.dir * 260), sea - 2, 260, 6);
      ctx.restore();
    }
    ctx.save(); ctx.translate(S.x, sea + bob); ctx.rotate(S.rock + S.recoil * 0.03 * -S.dir); ctx.scale(S.turn || 0.01, 1);
    const d = -S.deck;
    // jarcias (detrás de las velas)
    ctx.strokeStyle = 'rgba(40,24,20,0.55)'; ctx.lineWidth = 1.2; ctx.beginPath();
    for (const [ox, h] of S.masts) { ctx.moveTo(ox, d - h); ctx.lineTo(half + 70, d - 40); ctx.moveTo(ox, d - h); ctx.lineTo(-half + 6, d - 34); }
    ctx.stroke();
    // mástiles
    for (const [ox, h] of S.masts) {
      ctx.fillStyle = '#4a2c1c'; ctx.fillRect(ox - 4, d - h, 8, h);
      ctx.fillStyle = 'rgba(255,190,130,0.35)'; ctx.fillRect(ox - 4, d - h, 2.5, h);
    }
    // velas con la luz del atardecer
    for (const s of sails(S)) {
      const w = s.x1 - s.x0, belly = (s.y1 - s.y0) * 0.16;
      const g = ctx.createLinearGradient(s.x0, s.y0, s.x1, s.y1);
      g.addColorStop(0, '#fbe9cf'); g.addColorStop(0.55, '#efc9a0'); g.addColorStop(1, '#c48f78');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(s.x0, s.y0);
      ctx.lineTo(s.x1, s.y0); ctx.quadraticCurveTo(s.x1 + w * 0.08, (s.y0 + s.y1) / 2, s.x1 - w * 0.03, s.y1);
      ctx.quadraticCurveTo((s.x0 + s.x1) / 2, s.y1 + belly, s.x0 + w * 0.03, s.y1); ctx.quadraticCurveTo(s.x0 - w * 0.08, (s.y0 + s.y1) / 2, s.x0, s.y0); ctx.fill();
      ctx.strokeStyle = 'rgba(150,100,80,0.35)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let k = 1; k < 4; k++) { const x = s.x0 + w * k / 4; ctx.moveTo(x, s.y0 + 2); ctx.lineTo(x + w * 0.02, s.y1 + belly * 0.6); }
      ctx.stroke();
      ctx.fillStyle = '#3c2416'; ctx.fillRect(s.x0 - 8, s.y0 - 3, w + 16, 5);
    }
    // agujeros de bala en las velas
    ctx.fillStyle = 'rgba(40,22,30,0.82)'; ctx.beginPath();
    for (const H of S.holes) { ctx.moveTo(H.lx + H.r, H.ly); for (let k = 1; k <= 6; k++) { const a = H.a + k * TAU / 6, rr = H.r * (k % 2 ? 0.55 : 1.15); ctx.lineTo(H.lx + Math.cos(a) * rr, H.ly + Math.sin(a) * rr); } }
    ctx.fill();
    // cofa del palo mayor
    const mm = S.masts[1], cy = d - mm[1] + 64;
    ctx.fillStyle = '#5a3624'; ctx.beginPath(); ctx.moveTo(mm[0] - 22, cy); ctx.lineTo(mm[0] + 22, cy); ctx.lineTo(mm[0] + 16, cy + 14); ctx.lineTo(mm[0] - 16, cy + 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,200,140,0.3)'; ctx.fillRect(mm[0] - 22, cy, 44, 3);
    // bandera pirata en lo alto (ondea)
    const fx = mm[0], fy = d - mm[1] - 4;
    ctx.fillStyle = '#4a2c1c'; ctx.fillRect(fx - 1.5, fy - 34, 3, 36);
    ctx.fillStyle = '#16121a'; ctx.beginPath(); ctx.moveTo(fx, fy - 34);
    for (let k = 0; k <= 6; k++) ctx.lineTo(fx - k * 9, fy - 34 + Math.sin(t * 6 - k * 0.9) * 3 * (k / 6));
    for (let k = 6; k >= 0; k--) ctx.lineTo(fx - k * 9, fy - 8 + Math.sin(t * 6 - k * 0.9) * 3 * (k / 6));
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f2ece0'; const sx = fx - 28, sy = fy - 22 + Math.sin(t * 6 - 2.8) * 1.5;
    ctx.beginPath(); ctx.arc(sx, sy - 2, 5, 0, TAU); ctx.fill(); ctx.fillRect(sx - 3, sy + 2, 6, 3);
    ctx.strokeStyle = '#f2ece0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx - 8, sy + 2); ctx.lineTo(sx + 8, sy + 9); ctx.moveTo(sx + 8, sy + 2); ctx.lineTo(sx - 8, sy + 9); ctx.stroke();
    ctx.fillStyle = '#16121a'; ctx.fillRect(sx - 3, sy - 4, 2, 2); ctx.fillRect(sx + 1, sy - 4, 2, 2);
    // banderines en los otros palos
    for (const k of [0, 2]) { const [ox, h] = S.masts[k]; ctx.fillStyle = '#b8322c'; ctx.beginPath(); ctx.moveTo(ox, d - h); ctx.lineTo(ox - 26, d - h + 4 + Math.sin(t * 7 + k) * 2); ctx.lineTo(ox, d - h + 8); ctx.closePath(); ctx.fill(); }
    // casco
    const hg = ctx.createLinearGradient(0, d - 34, 0, 30);
    hg.addColorStop(0, '#8a5434'); hg.addColorStop(0.5, '#5c3420'); hg.addColorStop(1, '#2c180f');
    ctx.fillStyle = hg; ctx.beginPath();
    ctx.moveTo(-half, d - 34); ctx.lineTo(-half * 0.55, d - 34); ctx.lineTo(-half * 0.55, d); ctx.lineTo(half * 0.62, d);
    ctx.quadraticCurveTo(half * 0.95, d - 4, half + 12, d - 14);
    ctx.quadraticCurveTo(half * 0.9, 14, half * 0.55, 24); ctx.lineTo(-half * 0.8, 26); ctx.quadraticCurveTo(-half * 1.02, 10, -half, d - 34); ctx.fill();
    // baranda y franja de colores
    ctx.fillStyle = '#d7a640'; ctx.fillRect(-half * 0.98, -34, half * 1.78, 5);
    ctx.fillStyle = '#7a1f22'; ctx.fillRect(-half * 0.96, -29, half * 1.72, 4);
    ctx.strokeStyle = '#3a2216'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-half * 0.55, d - 8); ctx.lineTo(half * 0.62, d - 8); ctx.stroke();
    for (let x = -half * 0.5; x < half * 0.6; x += 16) { ctx.fillStyle = '#3a2216'; ctx.fillRect(x, d - 8, 2, 8); }
    // luz del sol en la borda
    ctx.fillStyle = 'rgba(255,180,120,0.18)'; ctx.fillRect(-half, d - 34, half * 2, 4);
    // ventanas de popa encendidas y farol
    ctx.fillStyle = 'rgba(255,214,140,0.9)'; for (let k = 0; k < 3; k++) ctx.fillRect(-half + 10 + k * 18, d - 26, 10, 9);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const lg = ctx.createRadialGradient(-half + 4, d - 46, 0, -half + 4, d - 46, 40); lg.addColorStop(0, 'rgba(255,200,120,0.6)'); lg.addColorStop(1, 'rgba(255,170,90,0)');
    ctx.fillStyle = lg; ctx.fillRect(-half - 36, d - 86, 80, 80); ctx.restore();
    ctx.fillStyle = '#ffe2a8'; ctx.fillRect(-half + 1, d - 50, 6, 8);
    // troneras con sus cañones
    const w = C.warn && C.warn.src === 'ship' ? C.warn : null, wPort = w ? muzzle(W, 'ship', G.birds[w.id].x).port : null;
    for (const p of PORTS) {
      ctx.fillStyle = '#1a0f0a'; ctx.fillRect(p - 7, -28, 14, 11);
      ctx.fillStyle = '#9a2a26'; ctx.fillRect(p - 7, -36, 14, 6);
      ctx.fillStyle = '#121212'; ctx.fillRect(p - 3, -25 + (p === wPort ? 0 : 1), 6, 5);
    }
    // bauprés
    ctx.strokeStyle = '#4a2c1c'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(half - 4, d - 12); ctx.lineTo(half + 70, d - 40); ctx.stroke();
    ctx.restore();
    // el mar tapa la parte baja del casco
    const k = Math.abs(S.turn), hw = half * Math.max(0.2, k) + 30;
    const sg = ctx.createLinearGradient(0, sea, 0, sea + 40);
    const SE = (THEMES[W.id] || {}).sea || ['#7c5a9c', '#3a2c6c'];
    sg.addColorStop(0, SE[0]); sg.addColorStop(1, ArtWorld.mix(SE[0], SE[1], 0.3));
    ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(S.x - hw, sea + 2);
    for (let x = -hw; x <= hw; x += 12) ctx.lineTo(S.x + x, sea + 2 + Math.sin(x * 0.08 + t * 2.4) * 2);
    ctx.lineTo(S.x + hw, sea + 44); ctx.lineTo(S.x - hw, sea + 44); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,200,0.55)'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let x = -hw * 0.8; x <= hw * 0.8; x += 12) ctx.lineTo(S.x + x, sea + 2 + Math.sin(x * 0.08 + t * 2.4) * 2);
    ctx.stroke();
    if (w && G.birds[w.id]) { const m = muzzle(W, 'ship', G.birds[w.id].x); drawWarnAt(ctx, m.x, m.y + bob, w, t); }
  }

  // el cañón del castillo (sobre la muralla del medio)
  function drawFortGun(ctx, G, t) {
    const W = G.world, C = W.coast, F = W.def.fort; if (!F) return;
    C.fortRecoil = Math.max(0, (C.fortRecoil || 0) - 1 / 40);
    const x = F.gun, y = W.groundY(x), rc = C.fortRecoil * 8;
    ctx.fillStyle = '#2a201c'; ctx.save(); ctx.translate(x + rc, y - 12); ctx.rotate(-0.35);
    ctx.fillRect(-34, -6, 40, 12); ctx.fillStyle = '#4a3a30'; ctx.fillRect(-34, -6, 40, 3); ctx.restore();
    ctx.fillStyle = '#5a3a24'; ctx.beginPath(); ctx.arc(x + 4, y - 6, 8, 0, TAU); ctx.fill();
    const w = C.warn && C.warn.src === 'fort' ? C.warn : null;
    if (w) { const m = muzzle(W, 'fort', 0); drawWarnAt(ctx, m.x, m.y, w, t); }
  }

  function drawFireworks(ctx, C) {
    if (!C.fw.length) return;
    const HUES = ['255,90,120', '255,210,90', '120,220,255', '170,255,140', '255,150,60', '220,140,255'];
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const F of C.fw) {
      const col = HUES[F.hue];
      if (F.t < F.rise) {
        const k = F.t / F.rise, x = lerp(F.x0, F.x, k), y = lerp(F.y0, F.y, 1 - (1 - k) * (1 - k));
        ctx.fillStyle = 'rgba(255,230,180,0.9)'; ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
        ctx.fillStyle = 'rgba(255,200,140,0.3)'; ctx.fillRect(x - 1, y, 2, 22);
        continue;
      }
      const u = F.t - F.rise, a = clamp(1 - u / 1.9, 0, 1), R = 150 * (1 - Math.exp(-u * 3.2));
      if (u < 0.15) { const g = ctx.createRadialGradient(F.x, F.y, 0, F.x, F.y, 90); g.addColorStop(0, `rgba(${col},0.5)`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.fillRect(F.x - 90, F.y - 90, 180, 180); }
      ctx.fillStyle = `rgba(${col},${a})`; ctx.beginPath();
      for (let i = 0; i < F.n; i++) {
        const ang = i / F.n * TAU + F.seed, rr = R * (0.85 + 0.15 * hash1(F.seed + i)), x = F.x + Math.cos(ang) * rr, y = F.y + Math.sin(ang) * rr + u * u * 40;
        ctx.rect(x - 1.6, y - 1.6, 3.2, 3.2);
        if (u < 1) { const r2 = rr * 0.82; ctx.rect(F.x + Math.cos(ang) * r2 - 0.8, F.y + Math.sin(ang) * r2 + u * u * 34 - 0.8, 1.6, 1.6); }
      }
      ctx.fill();
    }
    ctx.restore();
  }

  // bandada de pelícanos en V que cruza despacio (siluetas contra el atardecer)
  function drawPelicans(ctx, W, t) {
    const per = 70, u = (t % per) / per, x0 = -300 + u * (W.w + 600), y0 = 520 + Math.sin(t * 0.2) * 40;
    ctx.fillStyle = 'rgba(40,24,48,0.75)';
    for (let i = 0; i < 7; i++) {
      const row = Math.ceil(i / 2), side = i % 2 ? 1 : -1, x = x0 - row * 46, y = y0 + (i ? side * row * 26 : 0);
      const fl = Math.sin(t * 2.2 - i * 0.6) * 0.5 + 0.2;
      ctx.beginPath(); ctx.moveTo(x + 14, y); ctx.lineTo(x + 24, y + 2); ctx.lineTo(x + 12, y + 3);
      ctx.quadraticCurveTo(x, y + 4, x - 12, y + 2); ctx.lineTo(x - 2, y - 1);
      ctx.quadraticCurveTo(x - 10, y - 14 * fl - 4, x - 24, y - 12 * fl); ctx.quadraticCurveTo(x - 8, y - 4 * fl, x + 6, y - 1);
      ctx.closePath(); ctx.fill();
    }
  }

  // en la pantalla: si el cañón que te apunta está fuera de la vista, flecha en el borde
  function drawScreen(ctx, G, cam, sw, sh) {
    const W = G.world, C = W.coast; if (!C || !C.warn) return;
    const b = G.birds[C.warn.id]; if (!b) return;
    const m = muzzle(W, C.warn.src, b.x), sx = sw / 2 + (m.x - cam.x) * cam.z, sy = sh / 2 + (m.y - cam.y) * cam.z;
    if (sx > 0 && sx < sw && sy > 0 && sy < sh) return;
    const x = clamp(sx, 30, sw - 30), y = clamp(sy, 90, sh - 40), a = Math.atan2(sy - y, sx - x), on = Math.sin(G.time * 18) > 0;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = on ? 'rgba(255,150,70,0.95)' : 'rgba(255,150,70,0.45)';
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -14); ctx.lineTo(-8, 14); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.font = font(13); ctx.textAlign = x < sw / 2 ? 'left' : 'right'; ctx.fillStyle = '#ffb07a';
    ctx.fillText('¡cañón!', x < sw / 2 ? x + 22 : x - 22, y + 5); ctx.restore();
  }
  return { step, danger, bulletHit, drawWorld, drawScreen, sails, muzzle };
})();
