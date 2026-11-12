/* =========================================================================
   ARENA 3 · EL LABORATORIO — ventiladores que soplan por turnos (al liviano
   se lo llevan), mechero que vuelve el hilo súper elástico y una balanza
   cuyos platos suben y bajan con el peso
   ========================================================================= */
(() => {
  const mirrorX = (x, w) => WORLD_W - x - w;
  // ciclo de 15 s que arranca a los 6 s: sopla un lado 3,5 s, pausa, sopla el otro
  const START = 6, CYCLE = 15, ON_FIRST = [0, 3.5], ON_SECOND = [7.5, 11], WARN = 1.3;

  function layout() {
    const solids = [], oneway = [];
    const S = (x, y, w, h, kind, extra = {}) => solids.push(Object.assign({ x, y, w, h, kind }, extra));
    const O = (x, y, w, kind, extra = {}) => oneway.push(Object.assign({ x, y, w, h: 18, kind }, extra));
    S(266, 640, 1388, 38, 'labTop');
    S(290, 678, 1340, 520, 'labBody');
    S(928, 602, 64, 38, 'burner');
    S(436, 572, 96, 68, 'microscope');
    S(mirrorX(436, 96), 572, 96, 68, 'microscope');
    O(300, 400, 220, 'labShelf');
    O(mirrorX(300, 220), 400, 220, 'labShelf');
    const pan = (x, side) => ({ x, y: 500, w: 160, h: 16, kind: 'pan', side, move(R, t, dt, G, A) { R.y = R.y0 + R.side * (A.scale ? A.scale.off : 0); } });
    oneway.push(pan(640, 1), pan(mirrorX(640, 160), -1));
    const zones = [
      { type: 'heat', x: 868, y: 380, w: 184, h: 228 },
      { type: 'wind', x: 266, y: 300, w: 1388, h: 345, dir: 1, strength: 2900, side: 'L' },
      { type: 'wind', x: 266, y: 300, w: 1388, h: 345, dir: -1, strength: 2900, side: 'R' },
    ];
    return {
      solids, oneway, zones,
      hazardY: 832, deskLeft: 266, deskRight: 1654, deskY: 640, canRim: 826,
      spawns: [{ x: 760, y: 640 }, { x: 1160, y: 640 }],
      pelletSpots: [
        { x: 720, y: 470 }, { x: 1200, y: 470 }, { x: 410, y: 370 }, { x: 1510, y: 370 }, { x: 780, y: 608 },
        { x: 1140, y: 608 }, { x: 360, y: 608 }, { x: 1560, y: 608 }, { x: 960, y: 470 }, { x: 960, y: 250 },
        { x: 720, y: 330 }, { x: 1200, y: 330 }, { x: 484, y: 540 }, { x: 1436, y: 540 }, { x: 960, y: 560 },
      ],
      goldenSpots: [{ x: 960, y: 250 }, { x: 410, y: 362 }, { x: 1510, y: 362 }],
      respawnSpots: [{ x: 410, y: 400 }, { x: 1510, y: 400 }, { x: 720, y: 500 }],
      cans: [
        { x: 0, w: 276, color: '#e5533d', dark: '#b23a28', light: '#ff9a8a', label: 'RESIDUOS' },
        { x: WORLD_W - 276, w: 276, color: '#e5533d', dark: '#b23a28', light: '#ff9a8a', label: 'RESIDUOS' },
      ],
    };
  }

  /* ---------------- lógica: ventiladores y balanza ---------------- */
  function fanState(t, side, flip) {
    const first = flip ? 'R' : 'L';
    const c = t - START + WARN < 0 ? -99 : ((t - START) % CYCLE + CYCLE) % CYCLE, [a, b] = side === first ? ON_FIRST : ON_SECOND;
    if (t < START - WARN) return { on: 0, warn: 0, spin: 0 };
    if (c >= a && c < b) return { on: clamp((c - a) / 0.4, 0, 1), warn: 0, spin: 1 };
    if (c >= a - WARN && c < a) return { on: 0, warn: 1, spin: (c - (a - WARN)) / WARN };
    if (c >= b && c < b + 1.2) return { on: 0, warn: 0, spin: 1 - (c - b) / 1.2 };
    return { on: 0, warn: 0, spin: 0 };
  }
  function init(A) {
    A.fanFlip = A.fanFlip ? 0 : 1; // cada ronda empieza soplando un lado distinto
    A.scale = { off: 0, vel: 0 }; A.fans = { L: fanState(0, 'L', A.fanFlip), R: fanState(0, 'R', A.fanFlip) }; A.fanAngle = { L: 0, R: 0 };
  }
  function update(dt, G, A) {
    const prevL = A.fans.L.on, prevR = A.fans.R.on;
    A.fans.L = fanState(A.t, 'L', A.fanFlip); A.fans.R = fanState(A.t, 'R', A.fanFlip);
    for (const Z of A.zones) if (Z.type === 'wind') Z.active = A.fans[Z.side].on;
    if (G && !G.quiet && ((prevL === 0 && A.fans.L.on > 0) || (prevR === 0 && A.fans.R.on > 0))) Sound.play('whoosh');
    A.fanAngle.L += dt * 30 * A.fans.L.spin; A.fanAngle.R += dt * 30 * A.fans.R.spin;
    // balanza: el plato con más peso baja
    let wL = 0, wR = 0;
    if (G) for (const p of G.players) {
      if (!p.alive) continue;
      const R = p.stuck ? p.stuckR : p.groundR;
      if (R && R.kind === 'pan') { if (R.side > 0) wL += p.mass; else wR += p.mass; }
    }
    const target = clamp((wL - wR) * 16, -90, 90);
    A.scale.vel += ((target - A.scale.off) * 40 - A.scale.vel * 7) * dt;
    A.scale.off += A.scale.vel * dt;
  }

  /* ---------------- pintura fija ---------------- */
  function paintWall(ctx, rng) {
    ctx.fillStyle = '#eef5f6'; ctx.fillRect(0, 0, WORLD_W, 1080);
    for (let y = 0; y < 580; y += 46) {
      for (let x = (y / 46) % 2 ? -23 : 0; x < WORLD_W; x += 46) {
        ctx.fillStyle = `rgba(160,200,210,${0.08 + rng() * 0.1})`;
        ctx.fillRect(x + 2, y + 2, 42, 42);
      }
    }
    ctx.strokeStyle = 'rgba(120,160,170,0.35)'; ctx.lineWidth = 2;
    for (let y = 0; y < 580; y += 46) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_W, y); ctx.stroke(); }
    const z = ctx.createLinearGradient(0, 560, 0, 1080);
    z.addColorStop(0, '#2f6f72'); z.addColorStop(1, '#22504f');
    ctx.fillStyle = z; ctx.fillRect(0, 572, WORLD_W, 508);
    rr(ctx, -10, 566, WORLD_W + 20, 14, 4); fillStroke(ctx, '#d5e2e6', 3);
    ctx.fillStyle = '#6b7c84'; ctx.fillRect(0, 1036, WORLD_W, 50);
  }

  function paintCeilingLights(ctx) {
    [480, 960, 1440].forEach(x => {
      rr(ctx, x - 150, 6, 300, 22, 8); fillStroke(ctx, '#d7dde4', 3.5);
      rr(ctx, x - 138, 12, 276, 10, 5); ctx.fillStyle = '#fffbe8'; ctx.fill();
    });
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    [480, 960, 1440].forEach(x => {
      const g = ctx.createLinearGradient(0, 28, 0, 640);
      g.addColorStop(0, 'rgba(220,245,255,0.22)'); g.addColorStop(1, 'rgba(220,245,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 140, 28); ctx.lineTo(x + 140, 28); ctx.lineTo(x + 300, 640); ctx.lineTo(x - 300, 640); ctx.closePath(); ctx.fill();
    });
    ctx.restore();
  }

  function paintPeriodicTable(ctx) {
    const x0 = 612, y0 = 56, cw = 38, ch = 26, gap = 2;
    rr(ctx, x0 - 18, y0 - 44, 18 * (cw + gap) + 34, 7 * (ch + gap) + 64, 10); fillStroke(ctx, '#fffaf0', 4);
    ctx.fillStyle = INK; ctx.font = font(18, 700); ctx.textAlign = 'center';
    ctx.fillText('TABLA PERIÓDICA DE LOS ELEMENTOS', x0 + 9 * (cw + gap), y0 - 16);
    const col = c => (c <= 2 ? '#ff9c8f' : c <= 12 ? '#8fc4ff' : c <= 17 ? '#ffe08a' : '#c9a8ff');
    const has = (r, c) => (r === 0 ? c === 1 || c === 18 : r <= 2 ? c <= 2 || c >= 13 : true);
    for (let r = 0; r < 7; r++) for (let c = 1; c <= 18; c++) {
      if (!has(r, c)) continue;
      const x = x0 + (c - 1) * (cw + gap), y = y0 + r * (ch + gap);
      ctx.fillStyle = col(c); ctx.fillRect(x, y, cw, ch);
      ctx.strokeStyle = 'rgba(58,34,22,0.5)'; ctx.lineWidth = 1.2; ctx.strokeRect(x, y, cw, ch);
    }
    ctx.fillStyle = INK; ctx.font = font(14, 700);
    ctx.fillText('H', x0 + cw / 2, y0 + 18); ctx.fillText('He', x0 + 17 * (cw + gap) + cw / 2, y0 + 18);
    ctx.fillText('Ch', x0 + 6 * (cw + gap) + cw / 2, y0 + 3 * (ch + gap) + 18);
  }

  function paintCabinet(ctx, x, y, rng) {
    rr(ctx, x, y, 200, 250, 10); fillStroke(ctx, '#c9d6dc', 4);
    rr(ctx, x + 12, y + 12, 176, 226, 6); ctx.fillStyle = 'rgba(200,235,245,0.55)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.moveTo(x + 30, y + 12); ctx.lineTo(x + 70, y + 12); ctx.lineTo(x + 20, y + 238); ctx.lineTo(x + 12, y + 238); ctx.lineTo(x + 12, y + 80); ctx.closePath(); ctx.fill();
    [y + 86, y + 164].forEach(sy => { ctx.fillStyle = '#9fb0b8'; ctx.fillRect(x + 12, sy, 176, 6); });
    const liquids = ['#ff5c9d', '#27d3b2', '#ffd84d', '#9b6bdf', '#4aa3ff', '#ff9a3c'];
    [y + 86, y + 164, y + 238].forEach((sy, row) => {
      for (let k = 0; k < 4; k++) {
        const fx = x + 34 + k * 42, c = liquids[(row * 4 + k) % liquids.length];
        if ((row + k) % 2) { // matraz
          ctx.beginPath(); ctx.moveTo(fx - 4, sy - 54); ctx.lineTo(fx + 4, sy - 54); ctx.lineTo(fx + 4, sy - 34); ctx.lineTo(fx + 16, sy - 2); ctx.lineTo(fx - 16, sy - 2); ctx.lineTo(fx - 4, sy - 34); ctx.closePath();
          ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(fx - 10, sy - 18); ctx.lineTo(fx + 10, sy - 18); ctx.lineTo(fx + 15, sy - 4); ctx.lineTo(fx - 15, sy - 4); ctx.closePath(); ctx.fillStyle = c; ctx.fill();
        } else { // tubo
          rr(ctx, fx - 7, sy - 52, 14, 50, 6); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
          rr(ctx, fx - 5, sy - 28, 10, 24, 5); ctx.fillStyle = c; ctx.fill();
        }
      }
    });
  }

  function paintGogglesPoster(ctx, x, y) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.02);
    rr(ctx, 0, 0, 210, 230, 8); fillStroke(ctx, '#fff6c2', 4);
    rr(ctx, 10, 10, 190, 44, 6); ctx.fillStyle = '#2a8a4a'; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = font(26, 700); ctx.textAlign = 'center'; ctx.fillText('¡USA GAFAS!', 105, 42);
    // gafas
    ctx.lineWidth = 4; ctx.strokeStyle = INK;
    rr(ctx, 30, 96, 66, 50, 18); ctx.fillStyle = '#a9e1f5'; ctx.fill(); ctx.stroke();
    rr(ctx, 114, 96, 66, 50, 18); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(96, 114); ctx.lineTo(114, 114); ctx.stroke();
    ctx.strokeStyle = '#3a8fd6'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(30, 116); ctx.lineTo(10, 108); ctx.moveTo(180, 116); ctx.lineTo(200, 108); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(40, 104, 14, 6); ctx.fillRect(124, 104, 14, 6);
    ctx.fillStyle = INK; ctx.font = font(16, 600);
    ctx.fillText('y no acerques el chicle', 105, 186); ctx.fillText('al mechero', 105, 208);
    ctx.restore();
  }

  function paintShelf(ctx, P, left) {
    [P.x + 30, P.x + P.w - 30].forEach(bx => {
      ctx.beginPath(); ctx.moveTo(bx - 8, P.y + 16); ctx.lineTo(bx + 8, P.y + 16); ctx.lineTo(bx + 8, P.y + 60); ctx.closePath(); fillStroke(ctx, '#8d99a6', 3);
    });
    // frascos del lado de adentro
    const fx = left ? P.x + P.w - 40 : P.x + 40;
    rr(ctx, fx - 14, P.y - 44, 28, 44, 8); fillStroke(ctx, 'rgba(220,245,255,0.8)', 3);
    rr(ctx, fx - 11, P.y - 22, 22, 20, 6); ctx.fillStyle = left ? '#9b6bdf' : '#ffd84d'; ctx.fill();
    rr(ctx, fx - 10, P.y - 52, 20, 10, 3); fillStroke(ctx, '#3a3f4a', 2.5);
    rr(ctx, P.x, P.y, P.w, P.h, 5); fillStroke(ctx, '#cfd9df', 4);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(P.x + 6, P.y + 3, P.w - 12, 3);
  }

  function paintBench(ctx, rng, L) {
    const top = L.solids[0], body = L.solids[1];
    rr(ctx, body.x, body.y - 6, body.w, 420, 6); fillStroke(ctx, '#d9e2e6', 4);
    // puertas de gabinete
    const doors = 8, dw = (body.w - 40) / doors;
    for (let k = 0; k < doors; k++) {
      const dx = body.x + 20 + k * dw;
      rr(ctx, dx + 4, body.y + 22, dw - 8, 250, 8); fillStroke(ctx, '#eef3f5', 3);
      rr(ctx, dx + (k % 2 ? 14 : dw - 30), body.y + 120, 12, 46, 6); fillStroke(ctx, '#aab4bf', 2.5);
    }
    ctx.fillStyle = '#9fb0b8'; ctx.fillRect(body.x + 4, body.y + 290, body.w - 8, 18);
    const sh = ctx.createLinearGradient(0, top.y + top.h, 0, top.y + top.h + 30);
    sh.addColorStop(0, 'rgba(20,30,35,0.4)'); sh.addColorStop(1, 'rgba(20,30,35,0)');
    ctx.fillStyle = sh; ctx.fillRect(body.x, top.y + top.h, body.w, 30);
    // cubierta negra
    rr(ctx, top.x, top.y - 10, top.w, 14, 6); fillStroke(ctx, '#46565f', 3.5);
    rr(ctx, top.x, top.y, top.w, top.h, 8);
    const tg = ctx.createLinearGradient(0, top.y, 0, top.y + top.h);
    tg.addColorStop(0, '#3a4a53'); tg.addColorStop(1, '#232f35');
    fillStroke(ctx, tg, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; rr(ctx, top.x + 10, top.y + 4, top.w - 20, 4, 2); ctx.fill();
    // llaves de gas
    [520, 1400].forEach(x => {
      ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, top.y - 4); ctx.lineTo(x, top.y - 52); ctx.quadraticCurveTo(x, top.y - 74, x + 22, top.y - 74); ctx.stroke();
      ctx.strokeStyle = '#c4ccd6'; ctx.lineWidth = 4; ctx.stroke();
    });
  }

  function paintBurnerBase(ctx, L) {
    const B = L.solids.find(s => s.kind === 'burner');
    rr(ctx, B.x + 20, B.y - 30, 24, 40, 4); fillStroke(ctx, '#aab4c0', 3.5);
    rr(ctx, B.x, B.y + 18, B.w, 20, 6); fillStroke(ctx, '#6f7c88', 3.5);
    rr(ctx, B.x + 16, B.y + 2, 32, 18, 4); fillStroke(ctx, '#8d99a6', 3);
    // manguera
    ctx.strokeStyle = '#e9a23b'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(B.x + B.w, B.y + 28); ctx.quadraticCurveTo(B.x + B.w + 60, B.y + 30, B.x + B.w + 70, B.y + 38); ctx.stroke();
  }

  function paintMicroscope(ctx, M) {
    const cx = M.x + M.w / 2;
    // base y columna (la caja de colisión es el cuerpo completo)
    rr(ctx, M.x, M.y + M.h - 16, M.w, 16, 6); fillStroke(ctx, '#3f4a57', 4);
    rr(ctx, M.x + 10, M.y + 18, M.w - 20, M.h - 30, 10); fillStroke(ctx, '#e9eef2', 4);
    rr(ctx, M.x + 18, M.y + 30, 22, 26, 5); fillStroke(ctx, '#5aaae6', 3);
    // tubo y ocular
    ctx.save(); ctx.translate(cx + 8, M.y + 18); ctx.rotate(-0.35);
    rr(ctx, -10, -46, 20, 52, 6); fillStroke(ctx, '#3f4a57', 3.5);
    rr(ctx, -13, -56, 26, 14, 5); fillStroke(ctx, '#20262e', 3);
    ctx.restore();
    ctx.beginPath(); ctx.arc(M.x + M.w - 18, M.y + 40, 8, 0, TAU); fillStroke(ctx, '#aab4bf', 3);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(M.x + 16, M.y + 22, M.w - 32, 4);
  }

  function paintBg(b, rng, L) {
    paintWall(b, rng);
    paintPeriodicTable(b);
    paintCabinet(b, 52, 118, rng);
    paintGogglesPoster(b, WORLD_W - 262, 130);
    paintPennants(b, 0);
    // varilla de la balanza al techo
    b.strokeStyle = INK; b.lineWidth = 9; b.beginPath(); b.moveTo(960, -10); b.lineTo(960, 300); b.stroke();
    b.strokeStyle = '#b7c0ca'; b.lineWidth = 5; b.stroke();
    L.cans.forEach(C => paintCanBack(b, C, rng, L.canRim));
    L.oneway.forEach(P => { if (P.kind === 'labShelf') paintShelf(b, P, P.x < 960); });
    paintBench(b, rng, L);
    paintBurnerBase(b, L);
    L.solids.forEach(M => { if (M.kind === 'microscope') paintMicroscope(b, M); });
    paintCeilingLights(b);
  }

  /* ---------------- partes animadas ---------------- */
  function drawFan(ctx, x, y, dir, st, ang, t) {
    // soporte
    rr(ctx, x - 8, y + 30, 16, 26, 4); fillStroke(ctx, '#7c8896', 3);
    rr(ctx, x - 30, y + 52, 60, 12, 5); fillStroke(ctx, '#5d6875', 3);
    // aspas
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath(); ctx.arc(0, 0, 40, 0, TAU); ctx.fillStyle = st.warn ? 'rgba(255,216,77,0.35)' : 'rgba(220,235,245,0.6)'; ctx.fill();
    for (let k = 0; k < 3; k++) {
      ctx.save(); ctx.rotate(ang + k * TAU / 3);
      ctx.beginPath(); ctx.ellipse(0, -18, 10, 18, 0, 0, TAU); ctx.fillStyle = st.spin > 0.6 ? 'rgba(90,170,230,0.55)' : '#5aaae6'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fillStyle = '#3a3f4a'; ctx.fill();
    // rejilla
    ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(0, 0, 40, 0, TAU); ctx.stroke();
    ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(58,34,22,0.5)';
    for (let k = 0; k < 8; k++) { const a = k * TAU / 8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 40, Math.sin(a) * 40); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, 0, 24, 0, TAU); ctx.stroke();
    ctx.restore();
    // aviso: luz que parpadea antes de soplar
    if (st.warn && Math.floor(t * 8) % 2 === 0) {
      ctx.beginPath(); ctx.arc(x + dir * 30, y - 36, 8, 0, TAU); ctx.fillStyle = '#ffd84d'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
    }
  }
  function drawScale(ctx, A) {
    const off = A.scale ? A.scale.off : 0;
    const pans = A.oneway.filter(P => P.kind === 'pan');
    const lp = pans.find(P => P.side > 0), rp = pans.find(P => P.side < 0);
    const ly = 300 + off * 0.55, ry = 300 - off * 0.55;
    // brazo
    ctx.lineCap = 'round';
    ctx.strokeStyle = INK; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(lp.x + lp.w / 2, ly); ctx.lineTo(rp.x + rp.w / 2, ry); ctx.stroke();
    ctx.strokeStyle = '#d4a53c'; ctx.lineWidth = 7; ctx.stroke();
    ctx.beginPath(); ctx.arc(960, 300, 12, 0, TAU); ctx.fillStyle = '#d4a53c'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = INK; ctx.stroke();
    // aguja
    ctx.strokeStyle = '#e04b3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(960, 300); ctx.lineTo(960 + off * 0.35, 352); ctx.stroke();
    for (const [P, y] of [[lp, ly], [rp, ry]]) {
      const cx = P.x + P.w / 2;
      ctx.strokeStyle = '#6b5a3a'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(P.x + 10, P.y); ctx.moveTo(cx, y); ctx.lineTo(P.x + P.w - 10, P.y); ctx.moveTo(cx, y); ctx.lineTo(cx, P.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(P.x + P.w, P.y); ctx.quadraticCurveTo(P.x + P.w - 10, P.y + 22, cx, P.y + 24); ctx.quadraticCurveTo(P.x + 10, P.y + 22, P.x, P.y); ctx.closePath();
      fillStroke(ctx, '#e0b54a', 4);
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(P.x + 12, P.y + 3, P.w - 24, 3);
    }
  }
  function drawDynamic(ctx, t, G, A) {
    drawScale(ctx, A);
    // llama del mechero
    const fl = 1 + Math.sin(t * 23) * 0.08 + Math.sin(t * 37) * 0.06;
    ctx.save(); ctx.translate(960, 572);
    ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(-16, -34 * fl, 0, -62 * fl); ctx.quadraticCurveTo(16, -34 * fl, 12, 0); ctx.closePath();
    ctx.fillStyle = 'rgba(80,150,255,0.85)'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.quadraticCurveTo(-8, -20 * fl, 0, -36 * fl); ctx.quadraticCurveTo(8, -20 * fl, 6, 0); ctx.closePath();
    ctx.fillStyle = 'rgba(200,235,255,0.95)'; ctx.fill();
    ctx.restore();
    // aire caliente
    ctx.save(); ctx.strokeStyle = 'rgba(255,170,90,0.28)'; ctx.lineWidth = 3;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      for (let y = 500; y > 390; y -= 8) { const x = 920 + k * 26 + Math.sin(y * 0.06 + t * 5 + k) * 6; y === 500 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.restore();
    // ventiladores en las repisas
    const fans = A.fans || { L: { spin: 0, warn: 0 }, R: { spin: 0, warn: 0 } }, ang = A.fanAngle || { L: 0, R: 0 };
    drawFan(ctx, 334, 348, 1, fans.L, ang.L, t);
    drawFan(ctx, WORLD_W - 334, 348, -1, fans.R, -ang.R, t);
  }
  // rachas de viento por delante de los jugadores
  function drawOver(ctx, t, G, A) {
    if (!A.fans) return;
    for (const side of ['L', 'R']) {
      const on = A.fans[side].on; if (on <= 0.02) continue;
      const dir = side === 'L' ? 1 : -1;
      ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${0.55 * on})`; ctx.lineCap = 'round'; ctx.lineWidth = 3;
      for (let k = 0; k < 16; k++) {
        const y = 320 + ((k * 97) % 310), sp = 900 + (k % 5) * 160;
        const x = dir > 0 ? 266 + ((t * sp + k * 211) % 1388) : 1654 - ((t * sp + k * 211) % 1388);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - dir * 30, y - 6, x - dir * 60, y); ctx.stroke();
      }
      ctx.restore();
    }
  }
  function drawStatic(ctx, L) {
    const A = { oneway: L.oneway, scale: { off: 0 }, fans: { L: { spin: 0, warn: 0 }, R: { spin: 0, warn: 0 } }, fanAngle: { L: 0.3, R: 0.3 } };
    drawDynamic(ctx, 0, null, A);
  }

  defineArena({
    id: 'laboratorio', name: 'El Laboratorio', seed: 7319,
    desc: 'Ventiladores por turnos, un mechero que calienta el hilo y una balanza que se inclina.',
    layout, paintBg, drawDynamic, drawOver, update, init, drawStatic,
  });
})();
