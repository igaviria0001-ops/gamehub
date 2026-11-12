/* =========================================================================
   ARENA 5 · EL SALÓN DE ARTE — unas tijeras gigantes cortan el hilo cinco
   segundos (se abren y tiemblan antes), témpera resbalosa cerca de los
   bordes y charcos de pegante que frenan
   ========================================================================= */
(() => {
  const mirrorX = (x, w) => WORLD_W - x - w;
  const FIRST = 12, EVERY = 20, WARN = 1.8, CUT = 5;

  function layout() {
    const solids = [], oneway = [];
    const S = (x, y, w, h, kind, extra = {}) => solids.push(Object.assign({ x, y, w, h, kind }, extra));
    const O = (x, y, w, kind, extra = {}) => oneway.push(Object.assign({ x, y, w, h: 18, kind }, extra));
    S(266, 640, 1388, 38, 'artTop');
    S(290, 678, 1340, 520, 'artBody');
    S(296, 633, 170, 7, 'paint', { slip: true, color: '#3f8cf0' });
    S(mirrorX(296, 170), 633, 170, 7, 'paint', { slip: true, color: '#ff8a2a' });
    S(560, 633, 130, 7, 'glue', { glue: true });
    S(mirrorX(560, 130), 633, 130, 7, 'glue', { glue: true });
    S(900, 590, 120, 50, 'clay');
    O(330, 420, 220, 'dryRack');
    O(mirrorX(330, 220), 420, 220, 'dryRack');
    O(820, 300, 280, 'paintShelf');
    return {
      solids, oneway,
      hazardY: 832, deskLeft: 266, deskRight: 1654, deskY: 640, canRim: 826,
      spawns: [{ x: 790, y: 640 }, { x: 1130, y: 640 }],
      pelletSpots: [
        { x: 440, y: 390 }, { x: 1480, y: 390 }, { x: 960, y: 270 }, { x: 960, y: 556 }, { x: 790, y: 606 },
        { x: 1130, y: 606 }, { x: 380, y: 600 }, { x: 1540, y: 600 }, { x: 625, y: 600 }, { x: 1295, y: 600 },
        { x: 620, y: 430 }, { x: 1300, y: 430 }, { x: 960, y: 180 }, { x: 520, y: 520 }, { x: 1400, y: 520 },
      ],
      goldenSpots: [{ x: 960, y: 262 }, { x: 440, y: 382 }, { x: 1480, y: 382 }],
      respawnSpots: [{ x: 440, y: 420 }, { x: 1480, y: 420 }, { x: 960, y: 300 }],
      cans: [
        { x: 0, w: 276, color: '#9b6bdf', dark: '#7046b5', light: '#cbb0f5', label: 'CANECA' },
        { x: WORLD_W - 276, w: 276, color: '#f2b631', dark: '#c98a12', light: '#ffe08a', label: 'CANECA' },
      ],
    };
  }

  /* ---------------- tijeras ---------------- */
  function scissorState(t) {
    if (t < FIRST - WARN) return { phase: 'idle', k: 0 };
    const c = (t - (FIRST - WARN)) % EVERY;
    if (c < WARN) return { phase: 'warn', k: c / WARN };
    if (c < WARN + 0.18) return { phase: 'snip', k: (c - WARN) / 0.18 };
    if (c < WARN + CUT) return { phase: 'cut', k: (c - WARN) / CUT };
    return { phase: 'idle', k: 0 };
  }
  function init(A) { A.sc = scissorState(0); }
  function update(dt, G, A) {
    if (A.L && A.L.calm) { A.sc = { phase: 'idle', k: 0 }; A.mods.cut = 0; return; } // sin tijeras (pelea con jefe)
    const prev = A.sc.phase;
    A.sc = scissorState(A.t);
    A.mods.cut = A.sc.phase === 'snip' || A.sc.phase === 'cut' ? 1 : 0;
    if (G && !G.quiet) {
      if (prev !== 'warn' && A.sc.phase === 'warn') { FX.callout('¡CUIDADO, TIJERAS!', 960, 300, '#ff6b5a', 46, 1.6); Sound.play('bell'); }
      if (prev === 'warn' && A.sc.phase === 'snip') FX.shake(0.4);
    }
  }

  /* ---------------- pintura fija ---------------- */
  function paintWall(ctx, rng) {
    ctx.fillStyle = '#f1e8ff'; ctx.fillRect(0, 0, WORLD_W, 1080);
    for (let x = 0; x < WORLD_W; x += 90) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x, 0, 40, 760); }
    // salpicaduras de pintura
    const cols = ['#ff5c9d', '#27d3b2', '#ffd84d', '#4aa3ff', '#ff9a3c', '#9b6bdf'];
    for (let i = 0; i < 46; i++) {
      const x = rng() * WORLD_W, y = rng() * 560, r = 4 + rng() * 14;
      ctx.fillStyle = rgba(pick(cols), 0.45);
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x + (rng() - 0.5) * r * 4, y + (rng() - 0.5) * r * 4, r * 0.25, 0, TAU); ctx.fill(); }
    }
    const z = ctx.createLinearGradient(0, 560, 0, 1080); z.addColorStop(0, '#7a5cc9'); z.addColorStop(1, '#5d43a3');
    ctx.fillStyle = z; ctx.fillRect(0, 572, WORLD_W, 508);
    rr(ctx, -10, 566, WORLD_W + 20, 14, 4); fillStroke(ctx, '#ffd84d', 3);
    ctx.fillStyle = '#8e5a30'; ctx.fillRect(0, 1036, WORLD_W, 50);
  }

  function paintCorkboard(ctx, x, y, rng, flip) {
    rr(ctx, x - 12, y - 12, 304, 224, 10); fillStroke(ctx, '#b77942', 4);
    rr(ctx, x, y, 280, 200, 6); ctx.fillStyle = '#d9a86c'; ctx.fill();
    for (let i = 0; i < 160; i++) { ctx.fillStyle = 'rgba(120,70,30,0.25)'; ctx.fillRect(x + rng() * 280, y + rng() * 200, 2, 2); }
    // dibujos de niños
    const drawings = flip ? ['blob', 'house', 'sun'] : ['sun', 'blob', 'house'];
    drawings.forEach((d, i) => {
      const dx = x + 14 + i * 88, dy = y + 22 + (i % 2) * 20, rot = (rng() - 0.5) * 0.2;
      ctx.save(); ctx.translate(dx + 38, dy + 52); ctx.rotate(rot); ctx.translate(-38, -52);
      rr(ctx, 0, 0, 76, 104, 3); fillStroke(ctx, '#ffffff', 2.5);
      ctx.lineWidth = 3; ctx.lineCap = 'round';
      if (d === 'sun') { ctx.strokeStyle = '#ffb02e'; ctx.beginPath(); ctx.arc(38, 40, 14, 0, TAU); ctx.stroke(); for (let k = 0; k < 8; k++) { const a = k * TAU / 8; ctx.beginPath(); ctx.moveTo(38 + Math.cos(a) * 19, 40 + Math.sin(a) * 19); ctx.lineTo(38 + Math.cos(a) * 26, 40 + Math.sin(a) * 26); ctx.stroke(); } ctx.strokeStyle = '#4cb648'; ctx.beginPath(); ctx.moveTo(6, 88); ctx.quadraticCurveTo(38, 78, 70, 88); ctx.stroke(); }
      if (d === 'house') { ctx.strokeStyle = '#e5533d'; ctx.beginPath(); ctx.moveTo(16, 50); ctx.lineTo(38, 28); ctx.lineTo(60, 50); ctx.stroke(); ctx.strokeStyle = '#3d7be5'; ctx.strokeRect(20, 50, 36, 34); ctx.strokeStyle = '#a8693a'; ctx.strokeRect(32, 64, 12, 20); }
      if (d === 'blob') { ctx.strokeStyle = PALETTE.fresa.base; ctx.beginPath(); ctx.arc(26, 56, 13, 0, TAU); ctx.stroke(); ctx.strokeStyle = PALETTE.menta.base; ctx.beginPath(); ctx.arc(54, 60, 10, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#888'; ctx.beginPath(); ctx.moveTo(38, 57); ctx.quadraticCurveTo(41, 64, 44, 60); ctx.stroke(); ctx.fillStyle = INK; ctx.font = font(10, 700); ctx.textAlign = 'center'; ctx.fillText('MI CHICLE', 38, 94); }
      ctx.fillStyle = '#e04b3a'; ctx.beginPath(); ctx.arc(38, 6, 4, 0, TAU); ctx.fill();
      ctx.restore();
    });
  }

  function paintScissorHook(ctx) {
    rr(ctx, 930, 20, 60, 22, 8); fillStroke(ctx, '#6f7a8e', 3.5);
    ctx.fillStyle = INK; ctx.font = font(15, 700); ctx.textAlign = 'center';
    rr(ctx, 1010, 40, 190, 50, 8); fillStroke(ctx, '#fff6c2', 3);
    ctx.fillStyle = INK; ctx.fillText('NO CORRER CON', 1105, 61); ctx.fillText('LAS TIJERAS', 1105, 80);
  }

  function paintTable(ctx, rng, L) {
    const top = L.solids[0], body = L.solids[1];
    rr(ctx, body.x, body.y - 6, body.w, 420, 6); fillStroke(ctx, '#c58d5a', 4);
    const drawers = 6, dw = (body.w - 40) / drawers;
    const handle = ['#ff5c9d', '#27d3b2', '#ffd84d', '#4aa3ff', '#ff9a3c', '#9b6bdf'];
    for (let k = 0; k < drawers; k++) {
      const dx = body.x + 20 + k * dw;
      rr(ctx, dx + 6, body.y + 26, dw - 12, 120, 8); fillStroke(ctx, '#d9a46c', 3);
      rr(ctx, dx + dw / 2 - 24, body.y + 80, 48, 14, 7); fillStroke(ctx, handle[k], 2.5);
    }
    // goterones de pintura por el frente
    const drips = [[380, '#3f8cf0'], [620, '#ffffff'], [1300, '#ffffff'], [1540, '#ff8a2a'], [960, '#ff5c9d']];
    drips.forEach(([x, c]) => {
      ctx.fillStyle = c; ctx.strokeStyle = 'rgba(58,34,22,0.35)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - 30, top.y + top.h); ctx.lineTo(x + 30, top.y + top.h);
      ctx.quadraticCurveTo(x + 22, top.y + top.h + 20, x + 14, top.y + top.h + 46); ctx.arc(x + 8, top.y + top.h + 46, 6, 0, Math.PI);
      ctx.quadraticCurveTo(x - 4, top.y + top.h + 18, x - 30, top.y + top.h); ctx.fill(); ctx.stroke();
    });
    // mesa cubierta con papel
    rr(ctx, top.x, top.y - 10, top.w, 14, 6); fillStroke(ctx, '#ffffff', 3.5);
    rr(ctx, top.x, top.y, top.w, top.h, 8);
    const tg = ctx.createLinearGradient(0, top.y, 0, top.y + top.h); tg.addColorStop(0, '#fbf7ef'); tg.addColorStop(1, '#ddd3c2');
    fillStroke(ctx, tg, 4);
    for (let i = 0; i < 18; i++) { ctx.fillStyle = rgba(pick(handle), 0.35); ctx.beginPath(); ctx.arc(top.x + 40 + rng() * (top.w - 80), top.y + 8 + rng() * 22, 3 + rng() * 6, 0, TAU); ctx.fill(); }
  }

  function paintPuddles(ctx, L) {
    for (const R of L.solids) {
      if (R.kind === 'paint') {
        ctx.beginPath(); ctx.ellipse(R.x + R.w / 2, R.y + 4, R.w / 2 + 8, 9, 0, 0, TAU); fillStroke(ctx, R.color, 3);
        ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(R.x + R.w * 0.35, R.y + 1, R.w * 0.18, 2.5, 0, 0, TAU); ctx.fill();
        // frasco volcado
        const fx = R.x < 960 ? R.x + R.w - 20 : R.x + 20;
        ctx.save(); ctx.translate(fx, R.y - 6); ctx.rotate(R.x < 960 ? 1.4 : -1.4);
        rr(ctx, -14, -18, 28, 34, 6); fillStroke(ctx, '#ffffff', 2.5); rr(ctx, -12, -2, 24, 16, 4); ctx.fillStyle = R.color; ctx.fill();
        ctx.restore();
      }
      if (R.kind === 'glue') {
        ctx.beginPath(); ctx.ellipse(R.x + R.w / 2, R.y + 4, R.w / 2 + 6, 8, 0, 0, TAU); fillStroke(ctx, '#f7f7f2', 3);
        ctx.strokeStyle = 'rgba(200,200,190,0.9)'; ctx.lineWidth = 2;
        for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(R.x + 20 + k * 30, R.y + 3, 6, Math.PI, 0); ctx.stroke(); }
        const bx = R.x < 960 ? R.x + 6 : R.x + R.w - 6;
        ctx.save(); ctx.translate(bx, R.y - 12);
        rr(ctx, -10, -26, 20, 32, 5); fillStroke(ctx, '#ffffff', 2.5);
        ctx.beginPath(); ctx.moveTo(-5, -26); ctx.lineTo(0, -38); ctx.lineTo(5, -26); ctx.closePath(); fillStroke(ctx, '#ff9a3c', 2);
        ctx.fillStyle = INK; ctx.font = font(7, 700); ctx.textAlign = 'center'; ctx.fillText('PEGANTE', 0, -8);
        ctx.restore();
      }
    }
  }

  function paintClay(ctx, L) {
    const C = L.solids.find(s => s.kind === 'clay');
    const cols = ['#ff7b93', '#7ec8ff', '#ffd166', '#9be08c'];
    for (let k = 0; k < 4; k++) {
      const row = k < 2 ? 1 : 0, x = C.x + (k % 2) * 60 + (row ? 0 : 0), y = C.y + row * 25;
      rr(ctx, x, y, 60, 25, 6); fillStroke(ctx, cols[k], 3);
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(x + 6, y + 4, 40, 3);
    }
  }

  function paintRack(ctx, P, rng) {
    ctx.strokeStyle = '#6f7a8e'; ctx.lineWidth = 3;
    [P.x + 20, P.x + P.w - 20].forEach(x => { ctx.beginPath(); ctx.moveTo(x, P.y); ctx.lineTo(x, 640); ctx.stroke(); });
    for (let y = P.y + 50; y < 620; y += 40) { ctx.beginPath(); ctx.moveTo(P.x + 20, y); ctx.lineTo(P.x + P.w - 20, y); ctx.stroke(); }
    // pinturas secándose
    const cols = ['#ffd84d', '#ff7b93', '#7ec8ff'];
    for (let k = 0; k < 3; k++) {
      const px = P.x + 30 + k * 62, py = P.y + 56 + (k % 2) * 40;
      rr(ctx, px, py, 52, 36, 3); fillStroke(ctx, '#ffffff', 2);
      ctx.fillStyle = cols[k]; ctx.beginPath(); ctx.arc(px + 26, py + 18, 10, 0, TAU); ctx.fill();
    }
    rr(ctx, P.x, P.y, P.w, P.h, 5); fillStroke(ctx, '#aab4bf', 4);
  }

  function paintPaintShelf(ctx, P) {
    ctx.strokeStyle = INK; ctx.lineWidth = 4;
    [P.x + 40, P.x + P.w - 40].forEach(x => { ctx.beginPath(); ctx.moveTo(x, P.y); ctx.lineTo(x, -10); ctx.stroke(); });
    const cols = ['#ff5c9d', '#27d3b2', '#4aa3ff'];
    [P.x + 14, P.x + P.w - 44].forEach((x, i) => { rr(ctx, x, P.y - 30, 30, 30, 5); fillStroke(ctx, cols[i], 3); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x + 4, P.y - 26, 22, 4); });
    rr(ctx, P.x, P.y, P.w, P.h, 5); fillStroke(ctx, '#d89a5b', 4);
  }

  function paintEasel(ctx) {
    ctx.strokeStyle = INK; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(900, 640); ctx.lineTo(960, 360); ctx.lineTo(1020, 640); ctx.stroke();
    ctx.strokeStyle = '#c98b4a'; ctx.lineWidth = 6; ctx.stroke();
    rr(ctx, 880, 380, 160, 130, 4); fillStroke(ctx, '#ffffff', 4);
    // retrato de Fresa y Menta, sin terminar
    ctx.fillStyle = PALETTE.fresa.base; ctx.beginPath(); ctx.arc(930, 448, 26, 0, TAU); ctx.fill();
    ctx.fillStyle = PALETTE.menta.base; ctx.beginPath(); ctx.arc(992, 456, 20, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; [[922, 444], [938, 444], [986, 452], [998, 452]].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); });
    ctx.strokeStyle = 'rgba(58,34,22,0.4)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.strokeRect(892, 392, 136, 106); ctx.setLineDash([]);
  }

  function paintBg(b, rng, L) {
    paintWall(b, rng);
    paintCorkboard(b, 60, 110, rng, false);
    paintCorkboard(b, WORLD_W - 340, 110, rng, true);
    paintScissorHook(b);
    paintPennants(b);
    L.cans.forEach(C => paintCanBack(b, C, rng, L.canRim));
    L.oneway.forEach(P => { if (P.kind === 'dryRack') paintRack(b, P, rng); if (P.kind === 'paintShelf') paintPaintShelf(b, P); });
    paintEasel(b);
    paintTable(b, rng, L);
    paintPuddles(b, L);
    paintClay(b, L);
    paintLight(b);
  }

  /* ---------------- tijeras animadas ---------------- */
  function drawScissors(ctx, A, t) {
    const sc = A.sc || { phase: 'idle', k: 0 };
    let open = 0.18, shake = 0, y = 150;
    if (sc.phase === 'warn') { open = 0.18 + 0.5 * Math.min(1, sc.k * 3); shake = Math.sin(t * 50) * 5 * sc.k; y = 150 + sc.k * 50; }
    if (sc.phase === 'snip') { open = 0.68 * (1 - sc.k); y = 200; }
    if (sc.phase === 'cut') { open = 0.02; y = 200 - Math.min(1, sc.k * 4) * 50; }
    ctx.strokeStyle = '#6f7a8e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(960, 40); ctx.lineTo(960 + shake, y - 70); ctx.stroke();
    ctx.save(); ctx.translate(960 + shake, y);
    for (const side of [-1, 1]) {
      ctx.save(); ctx.rotate(side * open);
      // hoja
      ctx.beginPath(); ctx.moveTo(-8 * side, 0); ctx.lineTo(4 * side, 190); ctx.lineTo(16 * side, 186); ctx.lineTo(14 * side, 0); ctx.closePath();
      fillStroke(ctx, '#dfe4ea', 4);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(side > 0 ? 6 : -10, 20, 4, 140);
      // mango
      ctx.beginPath(); ctx.ellipse(-26 * side, -40, 26, 34, side * 0.3, 0, TAU);
      ctx.lineWidth = 14; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 9; ctx.strokeStyle = side < 0 ? '#ff5c9d' : '#27d3b2'; ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); fillStroke(ctx, '#aab4bf', 3.5);
    ctx.restore();
    // destello del corte
    if (sc.phase === 'snip' || (sc.phase === 'cut' && sc.k < 0.06)) {
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(660, 320); ctx.lineTo(1260, 300); ctx.stroke(); ctx.restore();
    }
    // reloj de cuánto falta para que el hilo se vuelva a pegar
    if (sc.phase === 'cut') {
      const left = 1 - sc.k;
      ctx.save(); ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(58,34,22,0.25)'; ctx.beginPath(); ctx.arc(1100, 150, 30, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#ffd84d'; ctx.beginPath(); ctx.arc(1100, 150, 30, -Math.PI / 2, -Math.PI / 2 + TAU * left); ctx.stroke();
      ctx.restore();
    }
  }
  function drawDynamic(ctx, t, G, A) { drawScissors(ctx, A, t); }
  function drawStatic(ctx, L) { drawScissors(ctx, { sc: { phase: 'warn', k: 0.5 } }, 0); }

  defineArena({
    id: 'arte', name: 'El Salón de Arte', seed: 5150,
    desc: 'Unas tijeras gigantes cortan el hilo un rato, la témpera resbala y el pegante frena.',
    layout, paintBg, drawDynamic, update, init, drawStatic,
  });
})();
