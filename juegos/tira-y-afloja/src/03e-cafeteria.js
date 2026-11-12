/* =========================================================================
   ARENA 4 · LA CAFETERÍA — plancha caliente en el centro (hilo súper
   elástico), neveras que congelan el hilo cerca de los bordes y bandas
   transportadoras que cambian de dirección (con aviso)
   ========================================================================= */
(() => {
  const mirrorX = (x, w) => WORLD_W - x - w;
  const BELT_SPEED = 240;

  function layout() {
    const solids = [], oneway = [];
    const S = (x, y, w, h, kind, extra = {}) => solids.push(Object.assign({ x, y, w, h, kind }, extra));
    const O = (x, y, w, kind, extra = {}) => oneway.push(Object.assign({ x, y, w, h: 18, kind }, extra));
    S(266, 640, 1388, 38, 'counterTop');
    S(290, 678, 1340, 520, 'counterBody');
    S(850, 622, 220, 18, 'griddle');
    S(470, 614, 250, 26, 'belt', { conveyor: 0, dir: -1, scroll: 0 });
    S(mirrorX(470, 250), 614, 250, 26, 'belt', { conveyor: 0, dir: 1, scroll: 0 });
    O(330, 430, 200, 'cupShelf');
    O(mirrorX(330, 200), 430, 200, 'cupShelf');
    O(830, 410, 260, 'rack');
    const zones = [
      { type: 'heat', x: 826, y: 390, w: 268, h: 240 },
      { type: 'cold', x: 266, y: 300, w: 210, h: 340 },
      { type: 'cold', x: WORLD_W - 476, y: 300, w: 210, h: 340 },
    ];
    return {
      solids, oneway, zones,
      hazardY: 832, deskLeft: 266, deskRight: 1654, deskY: 640, canRim: 826,
      spawns: [{ x: 780, y: 640 }, { x: 1140, y: 640 }],
      pelletSpots: [
        { x: 595, y: 588 }, { x: 1325, y: 588 }, { x: 960, y: 594 }, { x: 960, y: 380 }, { x: 430, y: 400 },
        { x: 1490, y: 400 }, { x: 780, y: 608 }, { x: 1140, y: 608 }, { x: 340, y: 608 }, { x: 1580, y: 608 },
        { x: 595, y: 420 }, { x: 1325, y: 420 }, { x: 960, y: 250 }, { x: 700, y: 300 }, { x: 1220, y: 300 },
      ],
      goldenSpots: [{ x: 960, y: 372 }, { x: 430, y: 392 }, { x: 1490, y: 392 }],
      respawnSpots: [{ x: 430, y: 430 }, { x: 1490, y: 430 }, { x: 960, y: 410 }],
      cans: [
        { x: 0, w: 276, color: '#5bb84a', dark: '#3d8a30', light: '#9be08c', label: 'ORGÁNICO' },
        { x: WORLD_W - 276, w: 276, color: '#5bb84a', dark: '#3d8a30', light: '#9be08c', label: 'ORGÁNICO' },
      ],
    };
  }

  /* ---------------- bandas: 2 s quietas, 4 hacia afuera, 1 aviso, 4 hacia adentro, 1 aviso ---------------- */
  function beltPhase(t) {
    if (t < 2) return { dir: 0, warn: t > 1 ? 1 : 0, next: 1 };
    const c = (t - 2) % 10;
    if (c < 4) return { dir: 1, warn: 0, next: -1 };
    if (c < 5) return { dir: 0, warn: 1, next: -1 };
    if (c < 9) return { dir: -1, warn: 0, next: 1 };
    return { dir: 0, warn: 1, next: 1 };
  }
  function init(A) { A.belt = beltPhase(0); A.sizzle = []; A.mist = []; }
  function update(dt, G, A) {
    A.belt = beltPhase(A.t);
    for (const R of A.solids) if (R.kind === 'belt') {
      const target = A.belt.dir * BELT_SPEED * R.dir;
      R.conveyor = approach(R.conveyor, target, BELT_SPEED * 4 * dt);
      R.scroll += R.conveyor * dt;
    }
  }

  /* ---------------- pintura fija ---------------- */
  function paintWall(ctx, rng) {
    const g = ctx.createLinearGradient(0, 0, 0, 470);
    g.addColorStop(0, '#ffe8cc'); g.addColorStop(1, '#ffd9b0');
    ctx.fillStyle = g; ctx.fillRect(0, 0, WORLD_W, 470);
    for (let x = 0; x < WORLD_W; x += 80) { ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x, 0, 36, 470); }
    // baldosas a cuadros
    const tile = 46;
    for (let y = 470, r = 0; y < 1080; y += tile, r++) {
      for (let x = 0, c = 0; x < WORLD_W; x += tile, c++) {
        ctx.fillStyle = (r + c) % 2 ? '#ffd166' : '#fff6e0';
        ctx.fillRect(x, y, tile, tile);
      }
    }
    ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(0, 470, WORLD_W, 610);
    rr(ctx, -10, 458, WORLD_W + 20, 16, 4); fillStroke(ctx, '#e0784a', 3);
    ctx.fillStyle = '#8e5a30'; ctx.fillRect(0, 1036, WORLD_W, 50);
  }

  function paintMenu(ctx, rng) {
    const x = 690, y = 36, w = 540, h = 210;
    rr(ctx, x - 14, y - 14, w + 28, h + 28, 12); fillStroke(ctx, '#a8693a', 4);
    rr(ctx, x, y, w, h, 6); fillStroke(ctx, '#2a2f2c', 3);
    chalkText(ctx, 'MENÚ DEL DÍA', x + w / 2, y + 36, 32, rng, '#fff3a8', 'center');
    chalkLine(ctx, [[x + 150, y + 58], [x + w - 150, y + 58]], rng, '#fff3a8', 2.5);
    const items = [['Arroz con pollo', '$ 5.000'], ['Empanadas (2)', '$ 2.500'], ['Jugo de mora', '$ 2.000']];
    items.forEach(([a, b], i) => {
      chalkText(ctx, a, x + 40, y + 92 + i * 34, 23, rng);
      chalkText(ctx, b, x + w - 40, y + 92 + i * 34, 23, rng, '#f6f2e8', 'right');
      chalkLine(ctx, [[x + 250, y + 98 + i * 34], [x + w - 140, y + 98 + i * 34]], rng, 'rgba(246,242,232,0.4)', 1.5);
    });
    chalkText(ctx, 'Postre: ¡chicle NO!', x + w / 2, y + 192, 22, rng, '#ffb3cf', 'center');
    chalkLine(ctx, [[x + 330, y + 196], [x + 382, y + 186]], rng, '#ffb3cf', 3);
  }

  function paintFridge(ctx, x, flip) {
    const y = 120, w = 170, h = 300;
    rr(ctx, x, y, w, h, 14); fillStroke(ctx, '#f4f7fa', 4);
    // interior
    rr(ctx, x + 12, y + 14, w - 24, h - 28, 8);
    const ig = ctx.createLinearGradient(0, y, 0, y + h); ig.addColorStop(0, '#d6f1ff'); ig.addColorStop(1, '#a9dcf5');
    ctx.fillStyle = ig; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    [y + 100, y + 190].forEach(sy => { ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(x + 12, sy, w - 24, 6); });
    // cajas de leche y frascos
    const items = [[x + 40, y + 100, '#ffffff', 30, 52], [x + 84, y + 100, '#ffd166', 26, 40], [x + 124, y + 100, '#ff7b93', 22, 34], [x + 50, y + 190, '#7ec8ff', 34, 44], [x + 104, y + 190, '#9be08c', 30, 30]];
    items.forEach(([ix, iy, c, iw, ih]) => { rr(ctx, ix - iw / 2, iy - ih, iw, ih, 5); fillStroke(ctx, c, 2.5); });
    ctx.fillStyle = INK; ctx.font = font(11, 700); ctx.textAlign = 'center'; ctx.fillText('LECHE', x + 40, y + 76);
    // escarcha
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.arc(x + 22 + k * 21, y + 18, 6 + (k % 3) * 2, 0, Math.PI); ctx.fill(); }
    // puerta abierta hacia el borde
    const dx = flip ? x + w : x;
    ctx.beginPath();
    if (flip) { ctx.moveTo(dx, y); ctx.lineTo(dx + 60, y + 18); ctx.lineTo(dx + 60, y + h - 18); ctx.lineTo(dx, y + h); }
    else { ctx.moveTo(dx, y); ctx.lineTo(dx - 60, y + 18); ctx.lineTo(dx - 60, y + h - 18); ctx.lineTo(dx, y + h); }
    ctx.closePath(); fillStroke(ctx, '#e6ecf1', 4);
    const hx = flip ? dx + 46 : dx - 46;
    rr(ctx, hx - 4, y + 110, 8, 70, 4); fillStroke(ctx, '#aab4bf', 2.5);
    // copo de nieve en la puerta
    ctx.save(); ctx.translate(flip ? dx + 30 : dx - 30, y + 60); ctx.strokeStyle = '#5aaae6'; ctx.lineWidth = 3;
    for (let k = 0; k < 3; k++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(12, 0); ctx.stroke(); }
    ctx.restore();
  }

  function paintLamps(ctx) {
    [600, 960, 1320].forEach(x => {
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, -10); ctx.lineTo(x, 54); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 46, 96); ctx.quadraticCurveTo(x - 40, 54, x, 52); ctx.quadraticCurveTo(x + 40, 54, x + 46, 96); ctx.closePath();
      fillStroke(ctx, '#e0784a', 3.5);
      ctx.beginPath(); ctx.ellipse(x, 96, 46, 8, 0, 0, TAU); ctx.fillStyle = '#fff3c4'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    });
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    [600, 960, 1320].forEach(x => {
      const g = ctx.createRadialGradient(x, 100, 10, x, 300, 360);
      g.addColorStop(0, 'rgba(255,230,170,0.35)'); g.addColorStop(1, 'rgba(255,230,170,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 46, 98); ctx.lineTo(x + 46, 98); ctx.lineTo(x + 260, 640); ctx.lineTo(x - 260, 640); ctx.closePath(); ctx.fill();
    });
    ctx.restore();
  }

  function paintShelf(ctx, P, left) {
    [P.x + 26, P.x + P.w - 26].forEach(bx => { ctx.beginPath(); ctx.moveTo(bx - 8, P.y + 16); ctx.lineTo(bx + 8, P.y + 16); ctx.lineTo(bx + 8, P.y + 56); ctx.closePath(); fillStroke(ctx, '#b07a48', 3); });
    // vasos del lado de adentro
    const cx0 = left ? P.x + P.w - 66 : P.x + 20;
    for (let k = 0; k < 3; k++) {
      const cx = cx0 + k * 20;
      ctx.beginPath(); ctx.moveTo(cx, P.y - 30); ctx.lineTo(cx + 16, P.y - 30); ctx.lineTo(cx + 13, P.y); ctx.lineTo(cx + 3, P.y); ctx.closePath();
      fillStroke(ctx, ['#ff7b93', '#7ec8ff', '#ffd166'][k], 2.5);
    }
    rr(ctx, P.x, P.y, P.w, P.h, 5); fillStroke(ctx, '#d89a5b', 4);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(P.x + 6, P.y + 3, P.w - 12, 3);
  }

  function paintRack(ctx, P) {
    ctx.strokeStyle = INK; ctx.lineWidth = 4;
    [P.x + 30, P.x + P.w - 30].forEach(x => { ctx.beginPath(); ctx.moveTo(x, P.y); ctx.lineTo(x, -10); ctx.stroke(); });
    // ollas y sartenes colgando (decoración, por detrás)
    const items = [[P.x + 60, 'pot'], [P.x + 130, 'pan'], [P.x + 200, 'pot']];
    items.forEach(([x, k]) => {
      ctx.strokeStyle = '#6f7a8e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, P.y + 18); ctx.lineTo(x, P.y + 34); ctx.stroke();
      if (k === 'pot') { rr(ctx, x - 26, P.y + 34, 52, 42, 8); fillStroke(ctx, '#d0d7df', 3.5); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x - 20, P.y + 40, 6, 30); }
      else { ctx.beginPath(); ctx.ellipse(x, P.y + 50, 26, 16, 0, 0, TAU); fillStroke(ctx, '#3a3f4a', 3.5); rr(ctx, x - 4, P.y + 18, 8, 22, 3); fillStroke(ctx, '#7a4b2a', 2.5); }
    });
    rr(ctx, P.x, P.y, P.w, P.h, 6);
    const g = ctx.createLinearGradient(0, P.y, 0, P.y + P.h); g.addColorStop(0, '#eef2f6'); g.addColorStop(1, '#9aa6b4');
    fillStroke(ctx, g, 4);
  }

  function paintCounter(ctx, rng, L) {
    const top = L.solids[0], body = L.solids[1];
    rr(ctx, body.x, body.y - 6, body.w, 420, 6); fillStroke(ctx, '#4f86c6', 4);
    ctx.save(); ctx.beginPath(); ctx.rect(body.x + 3, body.y, body.w - 6, 400); ctx.clip();
    for (let y = body.y; y < body.y + 400; y += 40) for (let x = body.x; x < body.x + body.w; x += 40) {
      ctx.fillStyle = `rgba(255,255,255,${0.05 + rng() * 0.08})`; ctx.fillRect(x + 2, y + 2, 36, 36);
    }
    ctx.restore();
    ctx.fillStyle = '#35618f'; ctx.fillRect(body.x + 3, body.y + 330, body.w - 6, 24);
    // letrero
    rr(ctx, 780, 760, 360, 70, 12); fillStroke(ctx, '#fff6e0', 4);
    ctx.fillStyle = INK; ctx.font = font(30, 700); ctx.textAlign = 'center'; ctx.fillText('CAFETERÍA', 960, 806);
    const sh = ctx.createLinearGradient(0, top.y + top.h, 0, top.y + top.h + 30);
    sh.addColorStop(0, 'rgba(20,30,45,0.35)'); sh.addColorStop(1, 'rgba(20,30,45,0)');
    ctx.fillStyle = sh; ctx.fillRect(body.x, top.y + top.h, body.w, 30);
    // mesón de acero
    rr(ctx, top.x, top.y - 10, top.w, 14, 6); fillStroke(ctx, '#f2f5f8', 3.5);
    rr(ctx, top.x, top.y, top.w, top.h, 8);
    const tg = ctx.createLinearGradient(0, top.y, 0, top.y + top.h);
    tg.addColorStop(0, '#e6ebf0'); tg.addColorStop(0.5, '#bcc6cf'); tg.addColorStop(1, '#94a0ac');
    fillStroke(ctx, tg, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; rr(ctx, top.x + 10, top.y + 4, top.w - 20, 4, 2); ctx.fill();
    for (let k = 0; k < 10; k++) { const sx = 320 + rng() * 1280; ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(sx, top.y + 14, 40 + rng() * 60, 2); }
  }

  function paintGriddleBase(ctx, L) {
    const G = L.solids.find(s => s.kind === 'griddle');
    rr(ctx, G.x + 10, G.y + 12, G.w - 20, 10, 4); fillStroke(ctx, '#3a3f4a', 3);
    [G.x + 30, G.x + G.w - 30].forEach(kx => { ctx.beginPath(); ctx.arc(kx, G.y + 30, 7, 0, TAU); fillStroke(ctx, '#e04b3a', 2.5); });
  }

  function paintBg(b, rng, L) {
    paintWall(b, rng);
    paintMenu(b, rng);
    paintFridge(b, 286, false);
    paintFridge(b, WORLD_W - 286 - 170, true);
    L.cans.forEach(C => paintCanBack(b, C, rng, L.canRim));
    L.oneway.forEach(P => { if (P.kind === 'cupShelf') paintShelf(b, P, P.x < 960); if (P.kind === 'rack') paintRack(b, P); });
    paintCounter(b, rng, L);
    paintGriddleBase(b, L);
    paintLamps(b);
  }

  /* ---------------- partes animadas ---------------- */
  function drawBelt(ctx, R, A, t) {
    const x0 = R.x, x1 = R.x + R.w, y = R.y;
    // rodillos
    [x0 + 12, x1 - 12].forEach(rx => { ctx.beginPath(); ctx.arc(rx, y + 13, 12, 0, TAU); fillStroke(ctx, '#6f7a8e', 3); ctx.beginPath(); ctx.arc(rx, y + 13, 3, 0, TAU); ctx.fillStyle = INK; ctx.fill(); });
    rr(ctx, x0, y, R.w, 26, 13); fillStroke(ctx, '#2f3546', 4);
    // chevrones que se mueven con la banda
    ctx.save(); rr(ctx, x0 + 4, y + 3, R.w - 8, 20, 10); ctx.clip();
    const dir = R.conveyor === 0 ? (A.belt ? A.belt.next * R.dir : 1) : sign(R.conveyor);
    const warn = A.belt && A.belt.warn && Math.floor(t * 8) % 2 === 0;
    ctx.strokeStyle = warn ? '#ffd84d' : 'rgba(255,255,255,0.35)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    const off = ((R.scroll % 34) + 34) % 34;
    for (let x = x0 - 34 + off; x < x1 + 34; x += 34) {
      ctx.beginPath(); ctx.moveTo(x - dir * 6, y + 7); ctx.lineTo(x + dir * 4, y + 13); ctx.lineTo(x - dir * 6, y + 19); ctx.stroke();
    }
    ctx.restore();
    // bandeja con comida que viaja encima
    const span = R.w - 70, tx = x0 + 35 + (((R.scroll * 0.999) % span) + span) % span;
    rr(ctx, tx - 30, y - 9, 60, 9, 4); fillStroke(ctx, '#e08a3c', 2.5);
    ctx.beginPath(); ctx.ellipse(tx - 10, y - 12, 14, 5, 0, 0, TAU); fillStroke(ctx, '#ffffff', 2);
    ctx.beginPath(); ctx.arc(tx - 10, y - 14, 5, Math.PI, 0); ctx.fillStyle = '#ffd166'; ctx.fill();
    rr(ctx, tx + 10, y - 26, 12, 18, 3); fillStroke(ctx, '#9b3d7a', 2);
  }
  function drawGriddle(ctx, R, t) {
    const glow = 0.5 + 0.2 * Math.sin(t * 3);
    ctx.save();
    ctx.fillStyle = `rgba(255,120,40,${0.35 * glow})`;
    ctx.beginPath(); ctx.ellipse(R.x + R.w / 2, R.y + 14, R.w * 0.6, 22, 0, 0, TAU); ctx.fill();
    ctx.restore();
    rr(ctx, R.x, R.y, R.w, R.h, 5);
    const g = ctx.createLinearGradient(0, R.y, 0, R.y + R.h); g.addColorStop(0, '#4a4f58'); g.addColorStop(1, '#1f2329');
    fillStroke(ctx, g, 4);
    ctx.strokeStyle = `rgba(255,140,60,${0.5 + 0.3 * glow})`; ctx.lineWidth = 2;
    for (let x = R.x + 16; x < R.x + R.w - 10; x += 18) { ctx.beginPath(); ctx.moveTo(x, R.y + 4); ctx.lineTo(x + 6, R.y + R.h - 4); ctx.stroke(); }
    // vapor
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let k = 0; k < 4; k++) {
      const ph = (t * 0.7 + k * 0.25) % 1, bx = R.x + 40 + k * 46;
      ctx.globalAlpha = 1 - ph;
      ctx.beginPath();
      for (let y = 0; y < 50; y += 6) { const px = bx + Math.sin(y * 0.12 + t * 4 + k) * 6, py = R.y - 8 - ph * 120 - y; y ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function drawDynamic(ctx, t, G, A) {
    for (const R of A.solids) { if (R.kind === 'belt') drawBelt(ctx, R, A, t); if (R.kind === 'griddle') drawGriddle(ctx, R, t); }
    // neblina fría que cae de las neveras
    ctx.save();
    for (const Z of A.zones) if (Z.type === 'cold') {
      for (let k = 0; k < 10; k++) {
        const ph = (t * 0.25 + k * 0.1) % 1;
        const x = Z.x + 20 + ((k * 53) % (Z.w - 40)) + Math.sin(t + k) * 10, y = 420 + ph * 210;
        ctx.globalAlpha = 0.28 * Math.sin(ph * Math.PI);
        ctx.fillStyle = '#e6f7ff';
        ctx.beginPath(); ctx.ellipse(x, y, 34 + ph * 20, 12 + ph * 6, 0, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }
  function drawStatic(ctx, L) { drawDynamic(ctx, 0.4, null, { solids: L.solids, zones: L.zones, belt: beltPhase(3) }); }

  defineArena({
    id: 'cafeteria', name: 'La Cafetería', seed: 9902,
    desc: 'Plancha caliente, neveras que congelan el hilo y bandas que te arrastran.',
    layout, paintBg, drawDynamic, update, init, drawStatic,
  });
})();
