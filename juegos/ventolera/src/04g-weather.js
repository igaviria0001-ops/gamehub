/* =========================================================================
   TORMENTA (Bogotá) — peligros que siempre avisan antes de llegar:
   · Rayo: primero la nube se ilumina y una columna tenue marca dónde va a
     caer (1,4 s); luego el rayo baja hasta el suelo o la azotea y lastima
     a quien esté cerca. Los edificios altos lo atraen (pararrayos).
   · Avión de pasajeros que despega de El Dorado: suena y aparece una
     flecha en el borde 2,2 s antes; cruza todo el cielo a una altura fija.
     Chocarlo duele mucho; detrás deja turbulencia. Con un tonel se pasa.
   · Ráfagas de viento que empujan a todos hacia un lado.
   Todo usa G.rng y pasos fijos.
   ========================================================================= */
const Weather = (() => {
  function step(G, dt) {
    const W = G.world, S = W.storm; if (!S) return;
    S.flash = Math.max(0, S.flash - dt * 2.5);
    const live = G.state === 'play' || G.state === 'attract';
    // ráfagas
    S.gustT -= dt;
    if (S.gustT <= 0) { S.gustT = 7 + G.rng() * 8; S.gustTo = (G.rng() < 0.5 ? -1 : 1) * (140 + G.rng() * 150); S.gustLife = 2.6; G.events.push({ type: 'gust', dir: Math.sign(S.gustTo) }); }
    if (S.gustLife > 0) { S.gustLife -= dt; S.gust += (S.gustTo - S.gust) * Math.min(1, dt * 1.8); } else S.gust *= 1 - Math.min(1, dt * 1.4);
    // rayos
    if (S.bolt) { S.bolt.t -= dt; if (S.bolt.t <= 0) S.bolt = null; }
    if (S.warn) { S.warn.t -= dt; if (S.warn.t <= 0) { strike(G, S.warn.x); S.warn = null; } }
    else if (live && G.canFight) {
      S.boltT -= dt;
      if (S.boltT <= 0) {
        S.boltT = 5.5 + G.rng() * 5;
        const alive = G.birds.filter(b => b.alive);
        let x = alive.length && G.rng() < 0.6 ? alive[Math.floor(G.rng() * alive.length)].x + (G.rng() - 0.5) * 500 : 300 + G.rng() * (W.w - 600);
        // los edificios altos atraen el rayo
        if (W.buildings) for (const B of W.buildings) if (Math.abs(x - (B.x0 + B.x1) / 2) < 140 && B.top < 1300) x = (B.x0 + B.x1) / 2;
        S.warn = { x: clamp(x, 120, W.w - 120), t: 1.4 };
        G.events.push({ type: 'boltWarn', x: S.warn.x });
      }
    }
    // aviones
    if (S.plane) {
      const P = S.plane; P.x += P.dir * P.speed * dt; P.t += dt;
      if ((P.dir > 0 && P.x > W.w + 500) || (P.dir < 0 && P.x < -500)) S.plane = null;
      else for (const b of G.birds) {
        if (!b.alive || b.perch) continue;
        const dx = (b.x - P.x) * P.dir, dy = b.y - P.y;
        // choque con el fuselaje (con un tonel se atraviesa)
        if (Math.abs(dx) < 170 && Math.abs(dy) < 32 + b.r * 0.6 && b.evadeT <= 0 && (b.planeT || 0) < G.time) {
          b.planeT = G.time + 1.2; b.damage(0.105 * b.sp.hp, -1, 'plane'); b.stun = Math.max(b.stun, 0.6);
          b.push(P.dir * 500, dy < 0 ? -420 : 420); b.emit('crash', { impact: 700, kind: 'plane', nx: 0, ny: dy < 0 ? -1 : 1 });
        } else if (Math.abs(dx) < 170 && Math.abs(dy) < 32 + b.r && b.evadeT > 0 && (b.planeNear || 0) < G.time) { b.planeNear = G.time + 2; G.events.push({ type: 'nearMiss', b, x: b.x, y: b.y }); }
        // turbulencia detrás del avión
        if (dx < -150 && dx > -650 && Math.abs(dy) < 130) { b.push(0, 520 * dt); if (G.rng() < dt * 3) b.stun = Math.max(b.stun, 0.12); }
      }
    } else if (live && G.canFight) {
      if (S.planeWarn) { S.planeWarn.t -= dt; if (S.planeWarn.t <= 0) { const w = S.planeWarn; S.plane = { x: w.dir > 0 ? -420 : W.w + 420, y: w.y, dir: w.dir, speed: 820, t: 0 }; S.planeWarn = null; G.events.push({ type: 'planePass' }); } }
      else {
        S.planeT -= dt;
        if (S.planeT <= 0) { S.planeT = 24 + G.rng() * 14; S.planeWarn = { y: W.ceil + 260 + G.rng() * 520, dir: G.rng() < 0.5 ? 1 : -1, t: 2.2 }; G.events.push({ type: 'planeWarn', y: S.planeWarn.y, dir: S.planeWarn.dir }); }
      }
    }
  }
  function strike(G, x) {
    const W = G.world, S = W.storm, yEnd = World.floorY(W, x, W.ceil - 400);
    const pts = []; let px = x;
    for (let y = -300; y < yEnd; y += 60 + G.rng() * 50) { pts.push(px, y); px = x + (G.rng() - 0.5) * 90; }
    pts.push(x, yEnd);
    // ramitas
    const forks = [];
    for (let i = 2; i + 1 < pts.length / 2 - 1; i += 2) if (G.rng() < 0.35) forks.push(pts[i * 2], pts[i * 2 + 1], pts[i * 2] + (G.rng() - 0.5) * 220, pts[i * 2 + 1] + 60 + G.rng() * 120);
    S.bolt = { x, y1: yEnd, pts, forks, t: 0.32 }; S.flash = 1;
    G.events.push({ type: 'bolt', x, y: yEnd });
    for (const b of G.birds) {
      if (!b.alive || b.y > yEnd + 30) continue;
      if (Math.abs(b.x - x) < 70 && b.evadeT <= 0) { b.damage(0.06 * b.sp.hp, -1, 'bolt'); b.stun = Math.max(b.stun, 0.5); b.push((b.x - x >= 0 ? 1 : -1) * 260, -120); G.events.push({ type: 'zap', b, x: b.x, y: b.y }); }
    }
    // si cayó en una azotea, revienta vidrios de arriba
    if (W.buildings) for (const B of W.buildings) if (x > B.x0 && x < B.x1 && Math.abs(yEnd - B.top) < 4) World.blast(W, x, B.top + 30, 60, G);
  }
  // para la máquina: ¿este punto está en peligro? (columna avisada o la ruta del avión)
  function danger(W, x, y) {
    const S = W.storm; if (!S) return false;
    if (S.warn && Math.abs(x - S.warn.x) < 95) return true;
    if (S.planeWarn && Math.abs(y - S.planeWarn.y) < 80) return true;
    if (S.plane && Math.abs(y - S.plane.y) < 80 && (x - S.plane.x) * S.plane.dir > -260 && (x - S.plane.x) * S.plane.dir < 900) return true;
    return false;
  }

  /* ---------- dibujo en el mundo ---------- */
  function drawWorld(ctx, G) {
    const W = G.world, S = W.storm; if (!S) return;
    const t = G.time;
    if (S.warn) {
      // la columna del rayo que viene: parpadea más mientras más cerca
      const k = 1 - S.warn.t / 1.4, on = Math.sin(t * (14 + k * 30)) > 0;
      const yEnd = World.floorY(W, S.warn.x, W.ceil - 400);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(S.warn.x - 60, 0, S.warn.x + 60, 0);
      g.addColorStop(0, 'rgba(160,190,255,0)'); g.addColorStop(0.5, `rgba(180,210,255,${(on ? 0.16 : 0.07) + k * 0.12})`); g.addColorStop(1, 'rgba(160,190,255,0)');
      ctx.fillStyle = g; ctx.fillRect(S.warn.x - 60, -300, 120, yEnd + 300);
      ctx.restore();
    }
    if (S.bolt) {
      const B = S.bolt, a = B.t / 0.32;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      for (const [w, col] of [[22, `rgba(140,170,255,${0.25 * a})`], [8, `rgba(200,220,255,${0.7 * a})`], [3, `rgba(255,255,255,${a})`]]) {
        ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(B.pts[0], B.pts[1]);
        for (let i = 2; i < B.pts.length; i += 2) ctx.lineTo(B.pts[i], B.pts[i + 1]);
        for (let i = 0; i < B.forks.length; i += 4) { ctx.moveTo(B.forks[i], B.forks[i + 1]); ctx.lineTo(B.forks[i + 2], B.forks[i + 3]); }
        ctx.stroke();
      }
      const gl = ctx.createRadialGradient(B.x, B.y1, 0, B.x, B.y1, 160); gl.addColorStop(0, `rgba(200,220,255,${0.6 * a})`); gl.addColorStop(1, 'rgba(200,220,255,0)');
      ctx.fillStyle = gl; ctx.fillRect(B.x - 160, B.y1 - 160, 320, 320);
      ctx.restore();
    }
    if (S.plane) drawPlane(ctx, S.plane, t);
  }
  function drawPlane(ctx, P, t) {
    ctx.save(); ctx.translate(P.x, P.y); ctx.scale(P.dir, 1);
    // estela de condensación
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const tr = ctx.createLinearGradient(-170, 0, -900, 0); tr.addColorStop(0, 'rgba(230,235,255,0.22)'); tr.addColorStop(1, 'rgba(230,235,255,0)');
    ctx.fillStyle = tr; ctx.fillRect(-900, -14, 730, 28);
    ctx.restore();
    // ala lejana, fuselaje, ala cercana, cola y motores
    ctx.fillStyle = '#7d8496'; ctx.beginPath(); ctx.moveTo(10, -6); ctx.lineTo(-70, -48); ctx.lineTo(-100, -48); ctx.lineTo(-50, -4); ctx.closePath(); ctx.fill();
    const g = ctx.createLinearGradient(0, -28, 0, 28); g.addColorStop(0, '#f4f6fb'); g.addColorStop(1, '#a9b0c2');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(170, 4); ctx.quadraticCurveTo(160, -24, 120, -26); ctx.lineTo(-150, -22); ctx.lineTo(-175, -16); ctx.lineTo(-175, 10); ctx.lineTo(120, 24); ctx.quadraticCurveTo(165, 22, 170, 4); ctx.fill();
    ctx.fillStyle = '#2f6fb0'; ctx.fillRect(-150, 2, 280, 5);
    ctx.fillStyle = 'rgba(255,236,190,0.85)'; for (let i = 0; i < 14; i++) ctx.fillRect(-120 + i * 17, -12, 7, 7);
    ctx.fillStyle = '#28324a'; ctx.beginPath(); ctx.moveTo(150, -10); ctx.quadraticCurveTo(160, -16, 166, -6); ctx.lineTo(150, -6); ctx.fill();
    ctx.fillStyle = '#c9cfdd'; ctx.beginPath(); ctx.moveTo(-130, -20); ctx.lineTo(-170, -80); ctx.lineTo(-190, -80); ctx.lineTo(-175, -18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2f6fb0'; ctx.beginPath(); ctx.moveTo(-160, -60); ctx.lineTo(-170, -80); ctx.lineTo(-190, -80); ctx.lineTo(-184, -60); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d6dbe6'; ctx.beginPath(); ctx.moveTo(20, 8); ctx.lineTo(-60, 62); ctx.lineTo(-92, 62); ctx.lineTo(-40, 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5b6274'; ctx.beginPath(); ctx.roundRect(-34, 22, 46, 16, 8); ctx.fill();
    // luces de navegación y estroboscópica
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (Math.sin(t * 9) > 0.7) { const s = ctx.createRadialGradient(-188, -80, 0, -188, -80, 40); s.addColorStop(0, 'rgba(255,255,255,0.9)'); s.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = s; ctx.fillRect(-228, -120, 80, 80); }
    ctx.fillStyle = '#ff4a4a'; ctx.beginPath(); ctx.arc(-90, 62, 4, 0, TAU); ctx.fill();
    const ll = ctx.createLinearGradient(170, 0, 520, 0); ll.addColorStop(0, 'rgba(255,250,220,0.3)'); ll.addColorStop(1, 'rgba(255,250,220,0)');
    ctx.fillStyle = ll; ctx.beginPath(); ctx.moveTo(168, 2); ctx.lineTo(520, -60); ctx.lineTo(520, 70); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  /* ---------- dibujo en la pantalla ---------- */
  const DROPS = Array.from({ length: 170 }, (_, i) => [hash1(i * 7.13), hash1(i * 3.71 + 9), 0.6 + hash1(i * 1.9) * 0.8]);
  function drawScreen(ctx, G, cam, sw, sh) {
    const W = G.world, S = W.storm; if (!S) return;
    const t = G.time, slant = 0.25 + S.gust / 900;
    // lluvia
    ctx.save(); ctx.strokeStyle = 'rgba(190,205,230,0.35)'; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let i = 0; i < DROPS.length; i += LOWFX ? 2 : 1) { const [a, b, sp] = DROPS[i];
      const L = 18 * sp, y = ((b * sh + t * 900 * sp) % (sh + 40)) - 20, x = ((a * (sw + 200) + t * 900 * sp * slant - cam.x * cam.z * 0.3) % (sw + 200) + sw + 200) % (sw + 200) - 100;
      ctx.moveTo(x, y); ctx.lineTo(x - slant * L, y - L);
    }
    ctx.stroke(); ctx.restore();
    // avisos de avión en el borde
    if (S.planeWarn) {
      const w = S.planeWarn, y = clamp(sh / 2 + (w.y - cam.y) * cam.z, 90, sh - 40), x = w.dir > 0 ? 26 : sw - 26, on = Math.sin(t * 18) > 0;
      ctx.save(); ctx.translate(x, y); ctx.scale(w.dir, 1);
      ctx.fillStyle = on ? 'rgba(255,90,78,0.95)' : 'rgba(255,90,78,0.45)';
      ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -14); ctx.lineTo(-8, 14); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.save(); ctx.font = font(13); ctx.textAlign = w.dir > 0 ? 'left' : 'right'; ctx.fillStyle = '#ff8f8f'; ctx.fillText('¡avión!', w.dir > 0 ? 46 : sw - 46, y + 5); ctx.restore();
    }
    // relámpago: todo se aclara un instante
    if (S.flash > 0) { ctx.fillStyle = `rgba(210,225,255,${S.flash * 0.35})`; ctx.fillRect(0, 0, sw, sh); }
  }
  return { step, danger, drawWorld, drawScreen, strike };
})();
