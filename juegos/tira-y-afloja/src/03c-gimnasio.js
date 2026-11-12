/* =========================================================================
   ARENA 2 · EL GIMNASIO — colchonetas que rebotan, anillas que se balancean
   (puedes pegarte a ellas), aro de baloncesto que sirve de polea
   ========================================================================= */
(() => {
  const mirrorX = (x, w) => WORLD_W - x - w;
  const WOOD = '#e2ac6c', WOOD_D = '#a8693a';

  function layout() {
    const solids = [], oneway = [], pegs = [];
    const S = (x, y, w, h, kind, extra = {}) => solids.push(Object.assign({ x, y, w, h, kind }, extra));
    const O = (x, y, w, kind, extra = {}) => oneway.push(Object.assign({ x, y, w, h: 18, kind }, extra));
    S(266, 640, 1388, 40, 'gymTop');
    S(290, 680, 1340, 520, 'gymBody');
    S(612, 614, 150, 26, 'tramp', { bounce: 1480, squish: 0 });
    S(mirrorX(612, 150), 614, 150, 26, 'tramp', { bounce: 1480, squish: 0 });
    S(865, 602, 190, 38, 'vaultLow'); // un solo cajón bajito: más espacio para empujarse
    O(320, 430, 230, 'beam');
    O(mirrorX(320, 230), 430, 230, 'beam');
    O(870, 232, 180, 'backboard');
    pegs.push({ x: 913, y: 320, r: 7, kind: 'rim' }, { x: 1007, y: 320, r: 7, kind: 'rim' });
    const ring = (ax, side) => ({
      x: ax, y: 330, r: 17, kind: 'ring', ax, ay: 56, len: 276, side,
      move(R, t) { const dx = Math.sin(t * 1.45) * 64 * R.side; R.x = R.ax + dx; R.y = R.ay + Math.sqrt(R.len * R.len - dx * dx); },
    });
    pegs.push(ring(650, 1), ring(WORLD_W - 650, -1));
    return {
      solids, oneway, pegs,
      hazardY: 832, deskLeft: 266, deskRight: 1654, deskY: 640, canRim: 826,
      spawns: [{ x: 812, y: 640 }, { x: 1108, y: 640 }],
      pelletSpots: [
        { x: 620, y: 300 }, { x: 1300, y: 300 }, { x: 435, y: 400 }, { x: 1485, y: 400 }, { x: 960, y: 205 },
        { x: 960, y: 515 }, { x: 790, y: 608 }, { x: 1130, y: 608 }, { x: 360, y: 608 }, { x: 1560, y: 608 },
        { x: 650, y: 440 }, { x: 1270, y: 440 }, { x: 435, y: 250 }, { x: 1485, y: 250 }, { x: 960, y: 420 },
      ],
      goldenSpots: [{ x: 960, y: 196 }, { x: 435, y: 392 }, { x: 1485, y: 392 }],
      respawnSpots: [{ x: 435, y: 430 }, { x: 1485, y: 430 }, { x: 960, y: 548 }],
      cans: [
        { x: 0, w: 276, color: '#ff8a3d', dark: '#d2611a', light: '#ffc08a', label: 'CANECA' },
        { x: WORLD_W - 276, w: 276, color: '#7a6cf0', dark: '#5446c4', light: '#b7aeff', label: 'CANECA' },
      ],
    };
  }

  /* La cancha de Gol de canica: piso libre, una cartuchera-arco en cada punta */
  function layoutGol() {
    const L = layout();
    L.solids = L.solids.filter(R => R.kind !== 'tramp' && R.kind !== 'vaultLow');
    const goal = side => {
      const x0 = side < 0 ? 266 : WORLD_W - 266 - 150;
      const back = side < 0 ? { x: 266, w: 20 } : { x: WORLD_W - 266 - 20, w: 20 };
      L.solids.push({ x: back.x, y: 520, w: back.w, h: 120, kind: 'goalBack', side });
      L.solids.push({ x: x0, y: 554, w: 150, h: 16, kind: 'goalLid', side });
      // interior donde la canica cuenta como gol (sin tocar la tapa ni el fondo)
      return { side, x: side < 0 ? 286 : WORLD_W - 266 - 150, w: 130, y: 570, h: 70, mouthX: side < 0 ? 416 : WORLD_W - 416 };
    };
    L.goals = [goal(-1), goal(1)];
    L.spawns = [{ x: 700, y: 640 }, { x: 1220, y: 640 }];
    L.respawnSpots = [{ x: 600, y: 640 }, { x: 1320, y: 640 }, { x: 960, y: 640 }];
    return L;
  }

  /* ---------------- pintura fija ---------------- */
  function paintGoal(ctx, L, side) {
    const back = L.solids.find(s => s.kind === 'goalBack' && s.side === side), lid = L.solids.find(s => s.kind === 'goalLid' && s.side === side);
    const col = { base: '#8796b3', dark: '#55627d' }; // tela neutra: el color del dueño lo pinta el modo
    const x0 = Math.min(back.x, lid.x), x1 = Math.max(back.x + back.w, lid.x + lid.w);
    // cartuchera: fondo de tela con cierre, interior oscuro
    rr(ctx, x0, lid.y, x1 - x0, 640 - lid.y, 10); ctx.fillStyle = 'rgba(40,20,10,0.55)'; ctx.fill();
    ctx.save(); rr(ctx, x0, lid.y, x1 - x0, 640 - lid.y, 10); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2;
    for (let x = x0; x < x1; x += 14) { ctx.beginPath(); ctx.moveTo(x, lid.y); ctx.lineTo(x + 30, 640); ctx.stroke(); } // malla
    ctx.restore();
    rr(ctx, back.x, back.y, back.w, back.h, 6); fillStroke(ctx, col.dark, 4);
    rr(ctx, lid.x - 4, lid.y - 6, lid.w + 8, lid.h + 10, 8); fillStroke(ctx, col.base, 4);
    // cierre (cremallera)
    ctx.strokeStyle = '#3a2216'; ctx.lineWidth = 2;
    for (let x = lid.x + 6; x < lid.x + lid.w - 4; x += 8) { ctx.beginPath(); ctx.moveTo(x, lid.y + 1); ctx.lineTo(x + 4, lid.y + 5); ctx.stroke(); }
    rr(ctx, side < 0 ? lid.x + lid.w - 22 : lid.x + 6, lid.y - 12, 16, 22, 4); fillStroke(ctx, '#d9dee6', 3);
  }
  function paintWall(ctx, rng) {
    ctx.fillStyle = '#e7ecf3'; ctx.fillRect(0, 0, WORLD_W, 1080);
    // bloques de cemento pintados
    for (let row = 0, y = 0; y < 760; row++, y += 38) {
      const off = row % 2 ? 48 : 0;
      for (let x = -off; x < WORLD_W; x += 96) {
        ctx.fillStyle = `rgba(150,165,190,${0.04 + rng() * 0.07})`;
        rr(ctx, x + 3, y + 3, 90, 32, 6); ctx.fill();
      }
      ctx.fillStyle = 'rgba(120,135,160,0.22)'; ctx.fillRect(0, y, WORLD_W, 2);
    }
    // franjas del colegio
    ctx.fillStyle = '#ff8a3d'; ctx.fillRect(0, 548, WORLD_W, 34);
    ctx.fillStyle = '#33427a'; ctx.fillRect(0, 582, WORLD_W, 16);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(0, 552, WORLD_W, 4);
    ctx.fillStyle = '#33427a'; ctx.fillRect(0, 760, WORLD_W, 320);
    ctx.fillStyle = '#8e5a30'; ctx.fillRect(0, 1036, WORLD_W, 50);
  }

  function paintWindows(ctx, rng) {
    const wins = [[56, 250], [392, 230], [1298, 230], [1614, 250]];
    for (const [x, w] of wins) {
      const y = 40, h = 130;
      rr(ctx, x - 8, y - 8, w + 16, h + 16, 8); fillStroke(ctx, '#c8d0dc', 4);
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, '#7fcdf3'); g.addColorStop(1, '#d4f0fb');
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      [[0.3, 0.35, 0.8], [0.7, 0.55, 0.6]].forEach(([fx, fy, s]) => {
        [[0, 0, 22], [20, -8, 18], [40, 0, 20]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(x + w * fx + dx * s, y + h * fy + dy * s, r * s, 0, TAU); ctx.fill(); });
      });
      ctx.strokeStyle = '#9aa6b8'; ctx.lineWidth = 5;
      for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x + w * k / 3, y); ctx.lineTo(x + w * k / 3, y + h); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
      ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.strokeRect(x, y, w, h);
    }
  }

  function paintWallBars(ctx, x0) {
    const w = 210, y0 = 196, y1 = 640;
    for (let y = y0 + 26; y < y1; y += 34) { rr(ctx, x0, y, w, 9, 4); fillStroke(ctx, '#e3b06d', 2.5); }
    [x0 - 6, x0 + w - 8].forEach(px => { rr(ctx, px, y0, 14, y1 - y0, 5); fillStroke(ctx, '#c88b4a', 3); });
  }

  function paintBanner(ctx, x, col, label) {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x - 46, 18); ctx.lineTo(x + 46, 18); ctx.lineTo(x + 46, 168); ctx.lineTo(x, 196); ctx.lineTo(x - 46, 168); ctx.closePath();
    fillStroke(ctx, col.base, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x - 40, 22, 14, 140);
    // mascota
    ctx.beginPath(); ctx.arc(x, 82, 26, 0, TAU); fillStroke(ctx, col.light, 3);
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(x - 9, 78, 4, 0, TAU); ctx.arc(x + 9, 78, 4, 0, TAU); ctx.fill();
    ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.beginPath(); ctx.arc(x, 86, 9, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = font(17, 700); ctx.textAlign = 'center';
    ctx.fillText(label, x, 140);
    ctx.restore();
  }

  function paintScoreboardFrame(ctx) {
    rr(ctx, 744, 22, 432, 134, 14); fillStroke(ctx, '#2a2f3d', 4);
    rr(ctx, 756, 34, 408, 110, 8); ctx.fillStyle = '#151923'; ctx.fill();
    ctx.font = font(18, 700); ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.fresa.base; ctx.fillText('FRESA', 840, 60);
    ctx.fillStyle = PALETTE.menta.base; ctx.fillText('MENTA', 1080, 60);
    ctx.fillStyle = '#7d869b'; ctx.font = font(14, 600); ctx.fillText('LOCAL', 840, 136); ctx.fillText('VISITANTE', 1080, 136);
    // cables
    ctx.strokeStyle = '#505869'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(800, 22); ctx.lineTo(800, -10); ctx.moveTo(1120, 22); ctx.lineTo(1120, -10); ctx.stroke();
  }

  function paintHoop(ctx) {
    // soporte al techo
    ctx.strokeStyle = '#6f7a8e'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(960, 232); ctx.lineTo(960, 168); ctx.lineTo(1110, 168); ctx.stroke();
    // tablero (su borde de arriba es una plataforma)
    rr(ctx, 870, 232, 180, 80, 6); fillStroke(ctx, '#fbfdff', 4);
    ctx.strokeStyle = '#e04b3a'; ctx.lineWidth = 4; ctx.strokeRect(930, 262, 60, 40);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(876, 238, 168, 5);
    // red
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 2;
    for (let k = 0; k <= 6; k++) {
      const x0 = 913 + k * (94 / 6);
      ctx.beginPath(); ctx.moveTo(x0, 322); ctx.lineTo(925 + k * (70 / 6), 384); ctx.stroke();
    }
    for (let j = 1; j <= 3; j++) {
      const y = 322 + j * 20, inset = j * 4;
      ctx.beginPath(); ctx.moveTo(913 + inset, y); ctx.lineTo(1007 - inset, y); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(58,34,22,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(925, 384); ctx.lineTo(995, 384); ctx.stroke();
    // aro
    ctx.beginPath(); ctx.ellipse(960, 320, 47, 8, 0, 0, TAU);
    ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke();
    ctx.lineWidth = 5; ctx.strokeStyle = '#ff7a2f'; ctx.stroke();
  }

  function paintBeam(ctx, P) {
    // patas metálicas
    [P.x + 34, P.x + P.w - 46].forEach(lx => {
      rr(ctx, lx, P.y + 14, 12, 640 - P.y - 14, 4);
      const lg = ctx.createLinearGradient(lx, 0, lx + 12, 0);
      lg.addColorStop(0, '#9aa3b4'); lg.addColorStop(0.5, '#e4e8ef'); lg.addColorStop(1, '#808898');
      fillStroke(ctx, lg, 3);
      rr(ctx, lx - 16, 628, 44, 12, 4); fillStroke(ctx, '#6f7a8e', 3);
    });
    rr(ctx, P.x, P.y, P.w, P.h, 7); fillStroke(ctx, '#d8b48a', 4);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(P.x + 8, P.y + 3, P.w - 16, 4);
    ctx.fillStyle = 'rgba(120,80,40,0.25)'; ctx.fillRect(P.x + 6, P.y + 12, P.w - 12, 3);
  }

  function paintVault(ctx, L) {
    const lo = L.solids.find(s => s.kind === 'vaultLow'), hi = L.solids.find(s => s.kind === 'vaultHigh');
    rr(ctx, lo.x, lo.y, lo.w, lo.h, 6); fillStroke(ctx, '#d9a465', 4);
    ctx.strokeStyle = 'rgba(58,34,22,0.4)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lo.x + 6, lo.y + lo.h / 2); ctx.lineTo(lo.x + lo.w - 6, lo.y + lo.h / 2); ctx.stroke();
    [lo.x + lo.w * 0.3, lo.x + lo.w * 0.7].forEach(hx => { rr(ctx, hx - 16, lo.y + 6, 32, 10, 5); ctx.fillStyle = 'rgba(40,20,10,0.55)'; ctx.fill(); });
    // tapa de cuero arriba del cajón
    rr(ctx, lo.x - 4, lo.y - 4, lo.w + 8, 16, 8); fillStroke(ctx, '#b5523a', 4);
    ctx.strokeStyle = 'rgba(255,230,200,0.7)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(lo.x + 4, lo.y + 4); ctx.lineTo(lo.x + lo.w - 4, lo.y + 4); ctx.stroke(); ctx.setLineDash([]);
    void hi;
  }

  function paintStage(ctx, rng, L) {
    const top = L.solids[0], body = L.solids[1];
    rr(ctx, body.x, body.y - 6, body.w, 420, 6); fillStroke(ctx, '#c08349', 4);
    ctx.save(); ctx.beginPath(); ctx.rect(body.x + 3, body.y, body.w - 6, 400); ctx.clip();
    for (let x = body.x; x < body.x + body.w; x += 54) { ctx.fillStyle = `rgba(90,50,20,${0.08 + rng() * 0.08})`; ctx.fillRect(x, body.y, 3, 400); }
    // escudo del equipo
    ctx.beginPath(); ctx.arc(960, 860, 120, 0, TAU); ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.stroke();
    ctx.beginPath(); ctx.arc(960, 860, 96, 0, TAU); ctx.fillStyle = 'rgba(51,66,122,0.85)'; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = font(30, 700); ctx.textAlign = 'center'; ctx.fillText('LOS', 960, 845); ctx.fillText('CHICLES', 960, 882);
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(body.x, 860 - 4, 820 - body.x, 8); ctx.fillRect(1100, 856, body.x + body.w - 1100, 8);
    ctx.restore();
    ctx.fillStyle = '#33427a'; ctx.fillRect(body.x + 2, body.y, body.w - 4, 18);
    // piso de duela
    rr(ctx, top.x, top.y - 10, top.w, 14, 6); fillStroke(ctx, '#f6cc92', 3.5);
    rr(ctx, top.x, top.y, top.w, top.h, 8);
    const tg = ctx.createLinearGradient(0, top.y, 0, top.y + top.h);
    tg.addColorStop(0, '#f0bf7f'); tg.addColorStop(1, '#cf9152');
    fillStroke(ctx, tg, 4);
    ctx.save(); ctx.beginPath(); ctx.rect(top.x + 4, top.y + 2, top.w - 8, top.h - 4); ctx.clip();
    for (let x = top.x + 30; x < top.x + top.w; x += 64) { ctx.fillStyle = 'rgba(120,70,30,0.22)'; ctx.fillRect(x, top.y, 2, top.h); }
    ctx.fillStyle = '#e04b3a'; ctx.fillRect(top.x, top.y + 14, top.w, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(top.x, top.y + 3, top.w, 4);
    ctx.restore();
    // pata metálica del escenario
    [body.x - 2, body.x + body.w - 20].forEach(lx => {
      rr(ctx, lx, top.y + top.h - 2, 22, 420, 6);
      const lg = ctx.createLinearGradient(lx, 0, lx + 22, 0);
      lg.addColorStop(0, '#9da3b2'); lg.addColorStop(0.4, '#e3e6ee'); lg.addColorStop(1, '#7e8494');
      fillStroke(ctx, lg, 3.5);
    });
  }

  function paintBg(b, rng, L) {
    paintWall(b, rng);
    paintWindows(b, rng);
    paintWallBars(b, 40); paintWallBars(b, WORLD_W - 250);
    paintBanner(b, 652, PALETTE.fresa, 'FRESAS'); paintBanner(b, WORLD_W - 652, PALETTE.menta, 'MENTAS');
    paintScoreboardFrame(b);
    // ganchos de las anillas en el techo
    [650, WORLD_W - 650].forEach(x => { rr(b, x - 18, 40, 36, 18, 5); fillStroke(b, '#6f7a8e', 3); });
    L.cans.forEach(C => paintCanBack(b, C, rng, L.canRim));
    L.oneway.forEach(P => { if (P.kind === 'beam') paintBeam(b, P); });
    paintStage(b, rng, L);
    if (L.solids.some(s => s.kind === 'vaultLow')) paintVault(b, L);
    if (L.goals) { paintGoal(b, L, -1); paintGoal(b, L, 1); }
    paintHoop(b);
    paintLight(b);
  }

  /* ---------------- partes animadas ---------------- */
  function digit(ctx, x, y, n, col) {
    ctx.font = font(52, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillText('88', x, y);
    ctx.fillStyle = col; ctx.fillText(String(n).padStart(2, '0'), x, y);
    ctx.textBaseline = 'alphabetic';
  }
  function drawTramp(ctx, R) {
    const sq = R.squish || 0, dip = sq * 14;
    const x0 = R.x, x1 = R.x + R.w, top = R.y - 6;
    // patas en V
    ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0 + 24, R.y + 12); ctx.lineTo(x0 + 10, 640); ctx.moveTo(x1 - 24, R.y + 12); ctx.lineTo(x1 - 10, 640); ctx.stroke();
    ctx.strokeStyle = '#4a5268'; ctx.lineWidth = 5; ctx.stroke();
    // marco
    rr(ctx, x0, R.y + 8, R.w, 12, 6); fillStroke(ctx, '#2f3546', 3.5);
    // resortes
    ctx.strokeStyle = '#d7dbe4'; ctx.lineWidth = 2.2;
    for (let x = x0 + 12; x <= x1 - 12; x += 13) {
      const yy = R.y + 8, mid = top + 7 + (dip * Math.sin(Math.PI * (x - x0) / R.w));
      ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x - 3, (yy + mid) / 2 + 1); ctx.lineTo(x + 3, (yy + mid) / 2 - 1); ctx.lineTo(x, mid); ctx.stroke();
    }
    // lona
    ctx.beginPath();
    ctx.moveTo(x0 + 8, top);
    ctx.quadraticCurveTo((x0 + x1) / 2, top + dip * 2, x1 - 8, top);
    ctx.lineTo(x1 - 8, top + 9);
    ctx.quadraticCurveTo((x0 + x1) / 2, top + 9 + dip * 2, x0 + 8, top + 9);
    ctx.closePath();
    fillStroke(ctx, '#2f7bf2', 3.5);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0 + 18, top + 3); ctx.quadraticCurveTo((x0 + x1) / 2, top + 3 + dip * 2, x1 - 18, top + 3); ctx.stroke();
    // flechas que avisan que rebota
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const ax = (x0 + x1) / 2, ay = R.y + 14;
    ctx.beginPath(); ctx.moveTo(ax - 7, ay + 3); ctx.lineTo(ax, ay - 4); ctx.lineTo(ax + 7, ay + 3); ctx.closePath(); ctx.fill();
  }
  function drawDynamic(ctx, t, G, A) {
    // marcador con el resultado real
    const play = G && !G.quiet;
    const a = play ? Math.floor(G.mode !== 'caneca' ? G.points[0] : G.wins[0]) : 0, b = play ? Math.floor(G.mode !== 'caneca' ? G.points[1] : G.wins[1]) : 0;
    digit(ctx, 840, 100, a, '#ff6b5a'); digit(ctx, 1080, 100, b, '#ff6b5a');
    const secs = play && G.state === 'play' ? Math.floor(G.roundT) : Math.floor(t) % 100;
    ctx.font = font(26, 700); ctx.textAlign = 'center'; ctx.fillStyle = '#ffd84d';
    ctx.fillText(`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, 960, 104);
    // anillas
    for (const R of A.pegs) {
      if (R.kind !== 'ring') continue;
      ctx.strokeStyle = '#d9b48a'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(R.ax, R.ay); ctx.lineTo(R.x, R.y - R.r); ctx.stroke();
      ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.arc(R.x, R.y, R.r, 0, TAU); ctx.lineWidth = 11; ctx.strokeStyle = INK; ctx.stroke();
      ctx.lineWidth = 7; ctx.strokeStyle = '#c98b4a'; ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(R.x, R.y, R.r, -2.6, -1.4); ctx.stroke();
    }
    for (const R of A.solids) if (R.kind === 'tramp') drawTramp(ctx, R);
  }
  function update(dt, G, A) { for (const R of A.solids) if (R.squish) R.squish = Math.max(0, R.squish - dt * 4); }
  function drawStatic(ctx, L) {
    const A = { pegs: L.pegs, solids: L.solids };
    L.pegs.forEach(R => { if (R.move) R.move(R, 0.6); });
    drawDynamic(ctx, 0, null, A);
  }

  defineArena({
    id: 'gimnasio', name: 'El Gimnasio', seed: 4401,
    desc: 'Colchonetas que te lanzan alto, anillas que se mecen y un aro que sirve de polea.',
    layout, paintBg, drawDynamic, update, drawStatic,
    variants: { gol: layoutGol, libre: () => { const L = layout(); L.solids = L.solids.filter(R => R.kind !== 'tramp' && R.kind !== 'vaultLow'); return L; } },
  });
})();
