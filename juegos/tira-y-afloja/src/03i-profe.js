/* =========================================================================
   ARENA 8 · EL ESCRITORIO DEL PROFE — una regla sobre un borrador funciona
   como catapulta (cae fuerte de un lado y lanzas al que está en el otro),
   grapadoras junto a los bordes que se abren y cierran de golpe, y tazas de
   café caliente que vuelven el hilo súper elástico
   ========================================================================= */
(() => {
  const mirrorX = (x, w) => WORLD_W - x - w;
  const PIVOT = { x: 960, y: 566 }, HALF = 200, MAXA = 0.33, SEG = 4;
  const STAPLE_EVERY = 7, STAPLE_WARN = 1.2;

  function layout() {
    const solids = [], oneway = [];
    const S = (x, y, w, h, kind, extra = {}) => solids.push(Object.assign({ x, y, w, h, kind }, extra));
    const O = (x, y, w, kind, extra = {}) => oneway.push(Object.assign({ x, y, w, h: 14, kind }, extra));
    S(266, 640, 1388, 38, 'profeTop');
    S(290, 678, 1340, 520, 'profeBody');
    S(918, 590, 84, 50, 'pivot');
    S(365, 348, 70, 72, 'mug', { side: -1 }); S(mirrorX(365, 70), 348, 70, 72, 'mug', { side: 1 });
    S(320, 604, 140, 36, 'stapler', { side: -1 }); S(mirrorX(320, 140), 604, 140, 36, 'stapler', { side: 1 });
    O(300, 420, 200, 'tray'); O(mirrorX(300, 200), 420, 200, 'tray');
    // la regla: 4 tramos que suben y bajan según el ángulo
    const segW = (HALF * 2) / SEG;
    for (let k = 0; k < SEG; k++) {
      const off = -HALF + segW * (k + 0.5);
      oneway.push({ x: PIVOT.x + off - segW / 2, y: PIVOT.y, w: segW, h: 14, kind: 'see', off,
        move(R, t, dt, G, A) { R.y = PIVOT.y - 7 - Math.sin(A.see ? A.see.a : 0) * R.off; } });
    }
    const zones = [
      // charcos de café hirviendo en el piso y el vapor de las tazas arriba
      { type: 'heat', x: 520, y: 470, w: 150, h: 172, puddle: true },
      { type: 'heat', x: mirrorX(520, 150), y: 470, w: 150, h: 172, puddle: true },
      { type: 'heat', x: 345, y: 170, w: 110, h: 180 },
      { type: 'heat', x: mirrorX(345, 110), y: 170, w: 110, h: 180 },
    ];
    return {
      solids, oneway, zones,
      hazardY: 832, deskLeft: 266, deskRight: 1654, deskY: 640, canRim: 826,
      spawns: [{ x: 700, y: 640 }, { x: 1220, y: 640 }],
      pelletSpots: [
        { x: 790, y: 520 }, { x: 1130, y: 520 }, { x: 400, y: 390 }, { x: 1520, y: 390 }, { x: 595, y: 540 },
        { x: 1325, y: 600 }, { x: 700, y: 608 }, { x: 1220, y: 608 }, { x: 390, y: 572 }, { x: 1530, y: 572 },
        { x: 960, y: 300 }, { x: 700, y: 380 }, { x: 1220, y: 380 }, { x: 960, y: 450 }, { x: 500, y: 480 },
      ],
      goldenSpots: [{ x: 960, y: 290 }, { x: 400, y: 382 }, { x: 1520, y: 382 }],
      respawnSpots: [{ x: 400, y: 420 }, { x: 1520, y: 420 }, { x: 960, y: 560 }],
      cans: [
        { x: 0, w: 276, color: '#2e7d5b', dark: '#1d5a40', light: '#6fbf97', label: 'CANECA' },
        { x: WORLD_W - 276, w: 276, color: '#a0522d', dark: '#723a1f', light: '#d98c62', label: 'CANECA' },
      ],
    };
  }

  /* ---------------- regla catapulta y grapadoras ---------------- */
  function staplerState(t, side) {
    const off = side < 0 ? 0 : STAPLE_EVERY / 2; // se turnan
    if (t < 4 + off - STAPLE_WARN) return { open: 0, slam: false };
    const c = (t - (4 + off - STAPLE_WARN)) % STAPLE_EVERY;
    if (c < STAPLE_WARN) return { open: c / STAPLE_WARN, slam: false, warn: true };
    if (c < STAPLE_WARN + 0.12) return { open: 1 - (c - STAPLE_WARN) / 0.12, slam: true };
    return { open: 0, slam: false };
  }
  function init(A) {
    A.see = { a: 0, w: 0 };
    A.staples = { '-1': staplerState(0, -1), '1': staplerState(0, 1) };
    A.seeOn = [false, false];
  }
  function update(dt, G, A) {
    const see = A.see;
    let torque = 0;
    if (G) G.players.forEach((p, i) => {
      if (!p.alive) return;
      const R = p.stuck ? p.stuckR : p.groundR;
      const on = !!(R && R.kind === 'see');
      if (on) {
        const dx = p.x - PIVOT.x;
        torque += p.mass * dx;
        // al caer fuerte sobre un lado, ese lado baja de golpe y el otro lanza lo que tenga encima
        if (!A.seeOn[i] && (p.lastImpact || 0) > 250) {
          see.w -= clamp(p.lastImpact * p.mass * dx * 9e-6, -9, 9);
          if (!G.quiet) Sound.play('boing', p.mass);
        }
      }
      A.seeOn[i] = on;
    });
    // el lado con más peso baja; un resorte suave la nivela si no hay nadie
    see.w += (-torque * 0.0012 - see.a * 3 - see.w * 3) * dt;
    see.w = clamp(see.w, -9, 9);
    see.a += see.w * dt;
    const wPrev = see.w;
    let hit = 0;
    if (see.a > MAXA) { see.a = MAXA; see.w = Math.min(see.w, 0); hit = 1; }
    if (see.a < -MAXA) { see.a = -MAXA; see.w = Math.max(see.w, 0); hit = -1; }
    // al tocar el tope girando rápido, lo que esté en el lado que sube sale disparado
    if (hit && Math.abs(wPrev) > 3 && G) {
      for (const p of G.players) {
        const R = p.groundR;
        if (!p.alive || p.stuck || !R || R.kind !== 'see') continue;
        if (Math.sign(R.off) !== hit) continue; // a>0 levanta el lado derecho (off>0); a<0 el izquierdo
        p.vy = Math.min(p.vy, -Math.abs(wPrev) * Math.abs(R.off) * 1.25 - 250); p.onGround = false; p.groundR = null;
        p.jumping = false; p.jumpCut = true; p.slingT = 0.6;
        if (!G.quiet) { FX.callout('¡CATAPULTA!', p.x, p.y - p.r - 50, '#ffd84d', 54, 1.2); Sound.play('whoosh'); FX.speedLines(p.x, p.y, -Math.PI / 2, p.col.light); }
        Progress.on('catapult', { p });
      }
    }
    // grapadoras
    for (const side of [-1, 1]) {
      const prev = A.staples[side];
      const st = staplerState(A.t, side);
      A.staples[side] = st;
      if (st.slam && !prev.slam) {
        const S = A.solids.find(s => s.kind === 'stapler' && s.side === side);
        if (G) {
          if (!G.quiet) { Sound.play('ram', 0.6); FX.callout('¡CLAC!', S.x + S.w / 2, S.y - 80, '#ffffff', 44, 0.8); FX.shake(0.3); }
          for (const p of G.players) {
            if (!p.alive || p.inv > 0) continue;
            if (p.x > S.x - p.r * 0.6 && p.x < S.x + S.w + p.r * 0.6 && p.y > S.y - 130 && p.y < S.y + 10) {
              if (p.stuck) p.unstick('hit', 1);
              p.stun = Math.max(p.stun, 0.8); p.vx = side * 650; p.vy = -380; p.onGround = false;
              p.bump(1400, 0, -1); p.sq = -0.3;
              if (!G.quiet) { FX.callout('¡GRAPADO!', p.x, p.y - p.r - 50, '#ff6b5a', 52, 1.2); FX.stars(p.x, p.y - p.r, 8, 1); }
            }
          }
        }
      }
    }
  }

  /* ---------------- pintura fija ---------------- */
  function paintWall(ctx, rng) {
    const g = ctx.createLinearGradient(0, 0, 0, 600); g.addColorStop(0, '#f3ead8'); g.addColorStop(1, '#e8d9bd');
    ctx.fillStyle = g; ctx.fillRect(0, 0, WORLD_W, 1080);
    for (let x = 0; x < WORLD_W; x += 100) { ctx.fillStyle = 'rgba(160,120,70,0.07)'; ctx.fillRect(x, 0, 50, 600); }
    const z = ctx.createLinearGradient(0, 560, 0, 1080); z.addColorStop(0, '#6b3d1e'); z.addColorStop(1, '#4a2914');
    ctx.fillStyle = z; ctx.fillRect(0, 572, WORLD_W, 508);
    rr(ctx, -10, 566, WORLD_W + 20, 14, 4); fillStroke(ctx, '#c9a227', 3);
    ctx.fillStyle = '#4a2914'; ctx.fillRect(0, 1036, WORLD_W, 50);
  }

  function paintDiploma(ctx, x, y, title, rng) {
    rr(ctx, x - 12, y - 12, 244, 184, 8); fillStroke(ctx, '#c9a227', 4);
    rr(ctx, x, y, 220, 160, 4); fillStroke(ctx, '#fffaf0', 2.5);
    ctx.fillStyle = INK; ctx.font = font(18, 700); ctx.textAlign = 'center'; ctx.fillText(title, x + 110, y + 42);
    ctx.strokeStyle = 'rgba(58,34,22,0.35)'; ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x + 30, y + 70 + k * 20); ctx.lineTo(x + 190, y + 70 + k * 20); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(x + 180, y + 132, 16, 0, TAU); fillStroke(ctx, '#e04b3a', 2.5);
  }

  function paintBoardSchedule(ctx, rng) {
    const x = 720, y = 70, w = 480, h = 220;
    rr(ctx, x - 14, y - 14, w + 28, h + 28, 10); fillStroke(ctx, '#b77942', 4);
    rr(ctx, x, y, w, h, 6); fillStroke(ctx, '#ffffff', 3);
    ctx.fillStyle = INK; ctx.font = font(24, 700); ctx.textAlign = 'center'; ctx.fillText('HORARIO', x + w / 2, y + 34);
    const days = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE'], cols = ['#ff9c8f', '#8fc4ff', '#ffe08a', '#9be08c', '#c9a8ff'];
    days.forEach((d, i) => {
      const cx = x + 30 + i * 86;
      ctx.fillStyle = INK; ctx.font = font(15, 700); ctx.fillText(d, cx + 36, y + 66);
      for (let k = 0; k < 4; k++) { ctx.fillStyle = cols[(i + k) % 5]; ctx.fillRect(cx, y + 78 + k * 32, 72, 26); }
    });
    ctx.fillStyle = INK; ctx.font = font(13, 700); ctx.fillText('RECREO', x + 30 + 2 * 86 + 36, y + 78 + 2 * 32 + 18);
  }

  function paintDesk(ctx, rng, L) {
    const top = L.solids[0], body = L.solids[1];
    rr(ctx, body.x, body.y - 6, body.w, 420, 6); fillStroke(ctx, '#5a2f17', 4);
    [[body.x + 30, 300], [body.x + body.w - 330, 300]].forEach(([dx, dw]) => {
      for (let k = 0; k < 3; k++) { rr(ctx, dx, body.y + 20 + k * 90, dw, 78, 8); fillStroke(ctx, '#6e3a1c', 3); rr(ctx, dx + dw / 2 - 30, body.y + 52 + k * 90, 60, 12, 6); fillStroke(ctx, '#c9a227', 2.5); }
    });
    // placa con el nombre
    rr(ctx, 840, 740, 240, 64, 8); fillStroke(ctx, '#c9a227', 4);
    ctx.fillStyle = '#3a2216'; ctx.font = font(30, 700); ctx.textAlign = 'center'; ctx.fillText('PROFE', 960, 784);
    // tapa con cuero verde
    rr(ctx, top.x, top.y - 10, top.w, 14, 6); fillStroke(ctx, '#3f7a52', 3.5);
    rr(ctx, top.x, top.y, top.w, top.h, 8);
    const tg = ctx.createLinearGradient(0, top.y, 0, top.y + top.h); tg.addColorStop(0, '#7a4120'); tg.addColorStop(1, '#4e2812');
    fillStroke(ctx, tg, 4);
    woodGrain(ctx, top.x + 6, top.y + 4, top.w - 12, top.h - 8, '#2a1206', rng, 6, 0.3);
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; rr(ctx, top.x + 10, top.y + 3, top.w - 20, 4, 2); ctx.fill();
    // papeles por calificar (atrás)
    [[700, -0.05], [1220, 0.06]].forEach(([x, r]) => { ctx.save(); ctx.translate(x, top.y - 8); ctx.rotate(r); rr(ctx, -50, -6, 100, 8, 2); fillStroke(ctx, '#ffffff', 2); ctx.fillStyle = '#e04b3a'; ctx.font = font(10, 700); ctx.fillText('10/10', 0, -9); ctx.restore(); });
  }

  function paintMug(ctx, M) {
    rr(ctx, M.x, M.y, M.w, M.h, 10); fillStroke(ctx, M.side < 0 ? '#ffffff' : '#ffd166', 4);
    ctx.beginPath(); ctx.arc(M.side < 0 ? M.x : M.x + M.w, M.y + M.h / 2, 18, -Math.PI / 2, Math.PI / 2, M.side < 0); ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = M.side < 0 ? '#ffffff' : '#ffd166'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(M.x + M.w / 2, M.y + 6, M.w / 2 - 6, 6, 0, 0, TAU); ctx.fillStyle = '#5a2f17'; ctx.fill();
    ctx.fillStyle = M.side < 0 ? '#e04b3a' : '#3a2216'; ctx.font = font(13, 700); ctx.textAlign = 'center';
    ctx.fillText(M.side < 0 ? '#1' : 'PROFE', M.x + M.w / 2, M.y + 46);
  }

  function paintTray(ctx, P) {
    ctx.strokeStyle = '#6f7a8e'; ctx.lineWidth = 3;
    [P.x + 20, P.x + P.w - 20].forEach(x => { ctx.beginPath(); ctx.moveTo(x, P.y + 14); ctx.lineTo(x, 640); ctx.stroke(); });
    for (let k = 0; k < 2; k++) { rr(ctx, P.x + 10, P.y + 70 + k * 70, P.w - 20, 14, 4); fillStroke(ctx, '#c7ced6', 3); rr(ctx, P.x + 30, P.y + 62 + k * 70, P.w - 60, 8, 2); fillStroke(ctx, '#ffffff', 2); }
    rr(ctx, P.x + 30, P.y - 8, P.w - 60, 8, 2); fillStroke(ctx, '#ffffff', 2);
    rr(ctx, P.x, P.y, P.w, P.h, 4); fillStroke(ctx, '#c7ced6', 4);
    ctx.fillStyle = INK; ctx.font = font(12, 700); ctx.textAlign = 'center'; ctx.fillText('POR CALIFICAR', P.x + P.w / 2, P.y + 11);
  }

  function paintBg(b, rng, L) {
    paintWall(b, rng);
    paintBoardSchedule(b, rng);
    paintDiploma(b, 90, 120, 'MEJOR PROFE', rng);
    paintDiploma(b, WORLD_W - 310, 120, 'DIPLOMA', rng);
    paintPennants(b);
    L.cans.forEach(C => paintCanBack(b, C, rng, L.canRim));
    L.oneway.forEach(P => { if (P.kind === 'tray') paintTray(b, P); });
    paintDesk(b, rng, L);
    L.solids.forEach(M => { if (M.kind === 'mug') paintMug(b, M); });
    // charcos de café en el piso
    L.zones.forEach(Z => {
      if (!Z.puddle) return;
      const cx = Z.x + Z.w / 2, y0 = 640;
      b.beginPath(); b.ellipse(cx, y0 - 2, Z.w / 2, 9, 0, 0, TAU);
      const pg = b.createRadialGradient(cx - 20, y0 - 5, 4, cx, y0, Z.w / 2);
      pg.addColorStop(0, '#9a5a2e'); pg.addColorStop(1, '#5a2f17');
      b.fillStyle = pg; b.fill(); b.lineWidth = 3; b.strokeStyle = '#3a1d0d'; b.stroke();
      b.fillStyle = 'rgba(255,240,220,0.45)'; b.beginPath(); b.ellipse(cx - 24, y0 - 5, 22, 3, 0, 0, TAU); b.fill();
      b.beginPath(); b.ellipse(cx + Z.w / 2 - 6, y0 - 1, 12, 5, 0.2, 0, TAU); b.fillStyle = '#6e3a1c'; b.fill();
    });
    // borrador que hace de pivote
    const P = L.solids.find(s => s.kind === 'pivot');
    rr(b, P.x, P.y, P.w, P.h, 10);
    b.save(); b.clip(); b.fillStyle = '#f7a9bd'; b.fillRect(P.x, P.y, P.w / 2, P.h); b.fillStyle = '#7fb4ee'; b.fillRect(P.x + P.w / 2, P.y, P.w / 2, P.h); b.restore();
    rr(b, P.x, P.y, P.w, P.h, 10); b.lineWidth = 4; b.strokeStyle = INK; b.stroke();
    paintLight(b);
  }

  /* ---------------- partes animadas ---------------- */
  function drawSeesaw(ctx, A) {
    const a = A.see ? A.see.a : 0;
    ctx.save(); ctx.translate(PIVOT.x, PIVOT.y); ctx.rotate(-a);
    rr(ctx, -HALF - 8, -14, HALF * 2 + 16, 18, 4);
    const g = ctx.createLinearGradient(0, -14, 0, 4); g.addColorStop(0, '#ffe680'); g.addColorStop(1, '#f2c53d');
    fillStroke(ctx, g, 4);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    for (let i = 0; i <= 30; i++) { const tx = -HALF + i * (HALF * 2 / 30), l = i % 5 === 0 ? 8 : 4; ctx.beginPath(); ctx.moveTo(tx, -12); ctx.lineTo(tx, -12 + l); ctx.stroke(); }
    ctx.restore();
  }
  function drawStapler(ctx, S, st, t) {
    const hingeX = S.side < 0 ? S.x + 10 : S.x + S.w - 10, dir = S.side < 0 ? 1 : -1;
    // base
    rr(ctx, S.x, S.y + 18, S.w, 18, 6); fillStroke(ctx, '#2a2f3d', 4);
    rr(ctx, S.x + 10, S.y + 10, S.w - 20, 10, 3); fillStroke(ctx, '#aab4bf', 3);
    // brazo
    const ang = -st.open * 0.75 * dir;
    ctx.save(); ctx.translate(hingeX, S.y + 12); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(dir * (S.w - 4), -2); ctx.quadraticCurveTo(dir * (S.w + 6), 6, dir * (S.w - 8), 10); ctx.lineTo(0, 8); ctx.closePath();
    fillStroke(ctx, '#d0342c', 4);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(dir > 0 ? 10 : -S.w + 20, -3, S.w - 40, 4);
    ctx.restore();
    ctx.beginPath(); ctx.arc(hingeX, S.y + 12, 8, 0, TAU); fillStroke(ctx, '#aab4bf', 3);
    if (st.warn && Math.floor(t * 8) % 2 === 0) {
      ctx.fillStyle = 'rgba(255,107,90,0.25)'; rr(ctx, S.x - 20, S.y - 120, S.w + 40, 130, 14); ctx.fill();
    }
  }
  function drawSteam(ctx, A, t) {
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    // vapor de los charcos
    for (const Z of A.zones || []) {
      if (!Z.puddle) continue;
      for (let k = 0; k < 4; k++) {
        const ph = (t * 0.7 + k / 4) % 1;
        ctx.globalAlpha = (1 - ph) * 0.7;
        ctx.beginPath();
        for (let y = 0; y < 50; y += 6) { const px = Z.x + 25 + k * 33 + Math.sin(y * 0.12 + t * 3 + k) * 6, py = 628 - ph * 120 - y; y ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
        ctx.stroke();
      }
    }
    for (const M of A.solids) {
      if (M.kind !== 'mug') continue;
      for (let k = 0; k < 3; k++) {
        const ph = (t * 0.6 + k / 3) % 1;
        ctx.globalAlpha = 1 - ph;
        ctx.beginPath();
        for (let y = 0; y < 60; y += 6) { const px = M.x + 18 + k * 17 + Math.sin(y * 0.1 + t * 3 + k) * 7, py = M.y - 6 - ph * 110 - y; y ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  function drawDynamic(ctx, t, G, A) {
    drawSteam(ctx, A, t);
    drawSeesaw(ctx, A);
    for (const S of A.solids) if (S.kind === 'stapler') drawStapler(ctx, S, (A.staples && A.staples[S.side]) || { open: 0 }, t);
  }
  function drawStatic(ctx, L) { drawDynamic(ctx, 0.3, null, { solids: L.solids, zones: L.zones, see: { a: 0.12 }, staples: { '-1': { open: 0.6 }, '1': { open: 0 } } }); }

  defineArena({
    id: 'profe', name: 'El Escritorio del Profe', seed: 8181,
    desc: 'Una regla catapulta, grapadoras que muerden cerca del borde y café hirviendo.',
    layout, paintBg, drawDynamic, update, init, drawStatic,
  });
})();
