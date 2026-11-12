/* =========================================================================
   ARENA ESPECIAL · LA TORRE DEL RELOJ (solo para «Escalada tramposa»)
   Un tubo se rompió y el agua sube. Hay que trepar por vigas de madera,
   unas que se desmoronan y otras que se deslizan, hasta tocar la campana.
   El hilo los une: para subir te sirve el otro de ancla… y al otro tú.
   No sale en la lista de arenas: la usa solo ese modo.
   ========================================================================= */
(() => {
  let TOP_Y = -2480;
  const WALL_L = 360, WALL_R = 1560;
  const BELL = { x: 960, y: TOP_Y - 150 };

  function base(top) {
    const solids = [], oneway = [], pegs = [];
    solids.push({ x: 240, y: 640, w: 1440, h: 80, kind: 'towerFloor' });
    solids.push({ x: 200, y: top - 1200, w: WALL_L - 200, h: 1840 - top + 1200, kind: 'wallL' });
    solids.push({ x: WALL_R, y: top - 1200, w: 1720 - WALL_R, h: 1840 - top + 1200, kind: 'wallR' });
    oneway.push({ x: 760, y: top, w: 400, h: 20, kind: 'bellDeck' });
    return { solids, oneway, pegs };
  }

  // niveles de la Fuga del colegio (cooperativo): cada vez más alto y con más trampas
  function levelOpts(n) {
    return {
      top: 640 - (1150 + n * 175), crumbleEvery: n < 3 ? 0 : Math.max(3, 7 - Math.floor(n / 2)), slideEvery: n < 4 ? 0 : Math.max(4, 9 - Math.floor(n / 2)),
      gates: n < 3 ? 0 : n < 6 ? 1 : n < 10 ? 2 : 3, wmin: Math.max(170, 250 - n * 6), knobs: Math.max(0.3, 0.6 - n * 0.02), seed: 1000 + n * 77,
    };
  }
  const VERSUS = { top: -2480, crumbleEvery: 5, slideEvery: 7, gates: 0, wmin: 210, knobs: 0.55 };

  // una reja que tapa el tubo; se abre mientras alguien pisa uno de sus dos botones (abajo o arriba).
  // side: lado del botón de abajo. La reja se esconde hacia ese lado y el hueco queda del otro.
  function addGate(L, gy, side) {
    const w = WALL_R - WALL_L - 34;
    const gate = { x: side < 0 ? WALL_L : WALL_L + 34, y: gy, w, h: 24, kind: 'gate', open: 0, hold: 0, buttons: [], side };
    gate.move = (R, t, dt, G) => {
      const on = B => G && G.players.some(p => p.alive && ((p.onGround && p.groundR === B) || (p.stuck && p.stuckR === B)));
      let pressed = false;
      R.buttons.forEach(B => { B.pressed = on(B); if (B.pressed) pressed = true; });
      if (pressed) R.hold = 1.2; else R.hold = Math.max(0, R.hold - dt);
      const was = R.open;
      R.open += clamp((R.hold > 0 ? 1 : 0) - R.open, -dt * 2.2, dt * 2.2);
      R.x = R.x0 + R.side * R.open * (R.w - 130);
      if (G && !G.quiet && was < 0.02 && R.open >= 0.02) Sound.play('select');
    };
    L.solids.push(gate);
    const near = side < 0 ? WALL_L : WALL_R - 280, far = side < 0 ? WALL_R - 260 : WALL_L;
    // abajo: viga con botón; en medio: un escalón del lado del hueco; arriba: viga con botón sobre el hueco
    L.oneway.push({ x: near, y: gy + 175, w: 280, h: 18, kind: 'beam', nearGate: true });
    L.oneway.push({ x: far, y: gy + 62, w: 260, h: 18, kind: 'beam', nearGate: true });
    L.oneway.push({ x: far, y: gy - 150, w: 260, h: 18, kind: 'beam', nearGate: true });
    const B1 = { x: near + 95, y: gy + 175 - 12, w: 90, h: 12, kind: 'button', gate, top: false, pressed: false };
    const B2 = { x: far + 85, y: gy - 150 - 12, w: 90, h: 12, kind: 'button', gate, top: true, pressed: false };
    L.solids.push(B1, B2); gate.buttons.push(B1, B2);
    return gate;
  }

  // vigas: se generan con una semilla (en Escalada, distinta en cada ronda; en la Fuga, fija por nivel)
  function generate(seed, o = VERSUS) {
    const top = o.top, L = base(top), r = mulberry32(seed);
    // dónde van las rejas
    const gates = [];
    for (let g = 1; g <= o.gates; g++) gates.push(Math.round(640 + (top - 640) * g / (o.gates + 1)));
    gates.forEach((gy, k) => addGate(L, gy, k % 2 ? 1 : -1));
    const nearGate = y => gates.some(gy => Math.abs(y - gy) < 230);
    let y = 640 - 165, k = 0, last = 0;
    while (y > top + 150) {
      if (nearGate(y)) { y -= 60; continue; }
      const w = o.wmin + Math.floor(r() * 150);
      // zonas: pegada a la pared izquierda, centro o pegada a la derecha (sin repetir mucho)
      let zone = [-1, 0, 1][Math.floor(r() * 3)];
      if (zone === last && r() < 0.7) zone = zone === 0 ? (r() < 0.5 ? -1 : 1) : 0;
      last = zone;
      const x = zone < 0 ? WALL_L : zone > 0 ? WALL_R - w : 960 - w / 2 + Math.round((r() - 0.5) * 260);
      const kind = o.crumbleEvery && k > 1 && k % o.crumbleEvery === 3 % o.crumbleEvery ? 'crumble' : o.slideEvery && k > 2 && k % o.slideEvery === 5 % o.slideEvery ? 'slide' : 'beam';
      const P = { x, y: Math.round(y), w, h: 18, kind };
      if (kind === 'slide') {
        P.range = 150; P.phase = r() * 6; P.cx0 = clamp(x, WALL_L + 160, WALL_R - w - 160);
        P.x = P.cx0;
        P.move = (R, t) => { R.x = R.cx0 + Math.sin(t * 0.9 + R.phase) * R.range; };
      }
      if (kind === 'crumble') {
        P.crumble = 0; P.gone = 0;
        P.move = (R, t, dt, G) => {
          if (R.gone > 0) { R.gone -= dt; if (R.gone <= 0) { R.y = R.y0; R.crumble = 0; } else R.y = R.y0 + 6000; return; }
          const on = G && G.players.some(p => p.alive && ((p.onGround && p.groundR === R) || (p.stuck && p.stuckR === R)));
          if (on || R.crumble > 0) R.crumble += dt;
          if (R.crumble > 0.75) {
            R.gone = 3.5; R.fallX = R.x; R.fallY = R.y0; R.fallT = 0; R.y = R.y0 + 6000;
            if (G && !G.quiet) { Sound.play('dry'); FX.dust(R.x + R.w / 2, R.y0, 8, 1.2); }
          }
        };
      }
      L.oneway.push(P);
      // agarraderas de bronce para pegarse o columpiarse, del lado contrario
      if (r() < o.knobs) {
        const px = zone < 0 ? WALL_R - 70 - r() * 160 : zone > 0 ? WALL_L + 70 + r() * 160 : (r() < 0.5 ? WALL_L + 90 : WALL_R - 90);
        L.pegs.push({ x: Math.round(px), y: Math.round(y - 80), r: 15, kind: 'knob' });
      }
      y -= 150 + r() * 42;
      k++;
    }
    return L;
  }

  function layout() {
    const L = generate(1);
    return Object.assign(L, {
      zones: [], hazards: [], cans: [],
      hazardY: 5000, deskLeft: WALL_L, deskRight: WALL_R, deskY: 640, canRim: 5000, ceilY: TOP_Y - 600,
      spawns: [{ x: 760, y: 640 }, { x: 1160, y: 640 }],
      pelletSpots: [{ x: 960, y: 560 }], goldenSpots: [{ x: 960, y: 300 }, { x: 600, y: -600 }, { x: 1320, y: -1300 }],
      respawnSpots: [{ x: 760, y: 640 }, { x: 1160, y: 640 }],
      topY: TOP_Y, bell: BELL, camTop: TOP_Y - 760,
    });
  }

  // cada ronda: vigas nuevas (o las del nivel, en la Fuga)
  function init(A) {
    const G = typeof Game !== 'undefined' ? Game.G : null;
    const fuga = G && G.mode === 'fuga';
    const o = fuga ? levelOpts(G.fugaLevel || 1) : VERSUS;
    const seed = fuga ? o.seed : 1 + Math.floor(Math.random() * 1e6);
    TOP_Y = o.top; BELL.y = TOP_Y - 150;
    const L = generate(seed, o);
    A.solids = L.solids; A.oneway = L.oneway; A.pegs = L.pegs;
    for (const R of [...A.solids, ...A.oneway, ...A.pegs]) { R.x0 = R.x; R.y0 = R.y; R.dx = 0; R.dy = 0; }
    A.movers = [...A.solids, ...A.oneway, ...A.pegs].filter(R => R.move);
    A.gates = A.solids.filter(R => R.kind === 'gate');
    A.bellT = 0;
    if (A.L) { A.L.topY = TOP_Y; A.L.camTop = TOP_Y - 760; A.L.ceilY = TOP_Y - 600; A.L.bell = BELL; }
    A.ceilY = TOP_Y - 600;
  }

  /* ---------------- dibujo ---------------- */
  const INK = PALETTE.ink;
  const rr = (...a) => ArenaArt.rr(...a), fillStroke = (...a) => ArenaArt.fillStroke(...a);

  function paintBg(b) {
    // el piso de abajo (el resto se pinta al vuelo según la cámara)
    b.fillStyle = '#6d4c8f'; b.fillRect(0, 0, WORLD_W, WORLD_H);
  }
  function paintFg() { /* sin canecas */ }

  function drawSky(ctx, y0, y1) {
    const g = ctx.createLinearGradient(0, TOP_Y - 900, 0, 900);
    g.addColorStop(0, '#2b2d6e'); g.addColorStop(0.55, '#7a5aa8'); g.addColorStop(1, '#f2a97e');
    ctx.fillStyle = g;
    ctx.fillRect(0, y0, 260, y1 - y0); ctx.fillRect(1660, y0, 260, y1 - y0);
    // estrellitas arriba
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let k = 0; k < 40; k++) {
      const sy = TOP_Y - 600 + ((k * 397) % 2400), sx = (k * 151) % 520;
      if (sy < y0 || sy > y1) continue;
      ctx.fillRect(sx < 260 ? sx : 1660 + (sx - 260), sy, 2.5, 2.5);
    }
  }
  // los ladrillos se pintan una vez en un azulejo y se repiten (mucho más liviano que trazar cada línea)
  let brick = null;
  function brickPattern(ctx) {
    if (brick) return brick;
    const c = document.createElement('canvas'); c.width = 96; c.height = 88;
    const b = c.getContext('2d');
    b.fillStyle = '#ead6b4'; b.fillRect(0, 0, 96, 88);
    b.strokeStyle = 'rgba(150,100,60,0.25)'; b.lineWidth = 2;
    b.beginPath();
    b.moveTo(0, 1); b.lineTo(96, 1); b.moveTo(0, 45); b.lineTo(96, 45);
    b.moveTo(1, 0); b.lineTo(1, 44); b.moveTo(48, 44); b.lineTo(48, 88);
    b.stroke();
    brick = ctx.createPattern(c, 'repeat');
    return brick;
  }
  function drawShaft(ctx, y0, y1, t) {
    // pared de ladrillo pintada
    ctx.fillStyle = brickPattern(ctx); ctx.fillRect(WALL_L, y0, WALL_R - WALL_L, y1 - y0);
    // pisos numerados con ventana redonda
    for (let f = 0; f < 6; f++) {
      const fy = 640 - 620 * f - 330;
      if (fy < y0 - 200 || fy > y1 + 200) continue;
      ctx.fillStyle = 'rgba(120,70,40,0.12)'; ctx.fillRect(WALL_L, fy + 160, WALL_R - WALL_L, 14);
      ctx.beginPath(); ctx.arc(960, fy, 70, 0, TAU); ctx.fillStyle = '#8fc3ea'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = '#8a5a2b'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(890, fy); ctx.lineTo(1030, fy); ctx.moveTo(960, fy - 70); ctx.lineTo(960, fy + 70); ctx.lineWidth = 5; ctx.stroke();
      ctx.fillStyle = 'rgba(58,34,22,0.35)'; ctx.font = font(26, 700); ctx.textAlign = 'center';
      ctx.fillText(`PISO ${f + 1}`, 960, fy + 120);
    }
    // engranajes decorativos que giran
    [[560, -300, 90, 1], [1360, -900, 110, -1], [600, -1600, 80, -1], [1330, -2100, 100, 1], [520, 300, 70, 1]].forEach(([gx, gy, gr, d]) => {
      if (gy + gr < y0 || gy - gr > y1) return;
      ctx.save(); ctx.translate(gx, gy); ctx.rotate(t * 0.4 * d);
      ctx.fillStyle = 'rgba(160,110,60,0.22)';
      ctx.beginPath();
      for (let k = 0; k < 24; k++) { const a = k / 24 * TAU, rr2 = k % 2 ? gr : gr * 0.86; ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); }
      ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 0, gr * 0.3, 0, TAU); ctx.fillStyle = 'rgba(234,214,180,0.9)'; ctx.fill();
      ctx.restore();
    });
    // reloj gigante arriba
    const cy = TOP_Y - 470;
    if (cy + 220 > y0 && cy - 220 < y1) {
      ctx.beginPath(); ctx.arc(960, cy, 200, 0, TAU); ctx.fillStyle = '#fff6e0'; ctx.fill(); ctx.lineWidth = 14; ctx.strokeStyle = '#8a5a2b'; ctx.stroke();
      ctx.fillStyle = INK;
      for (let h = 0; h < 12; h++) { const a = h / 12 * TAU; ctx.fillRect(960 + Math.cos(a) * 170 - 4, cy + Math.sin(a) * 170 - 4, 8, 8); }
      ctx.save(); ctx.translate(960, cy); ctx.lineCap = 'round'; ctx.strokeStyle = INK;
      ctx.rotate(t * 0.05); ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -110); ctx.stroke();
      ctx.rotate(t * 0.6); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -160); ctx.stroke();
      ctx.restore();
    }
  }
  function drawWalls(ctx, y0, y1) {
    for (const [x, w] of [[200, WALL_L - 200], [WALL_R, 1720 - WALL_R]]) {
      ctx.fillStyle = '#8a5a2b'; ctx.fillRect(x, y0, w, y1 - y0);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (let y = Math.floor(y0 / 120) * 120; y < y1; y += 120) ctx.fillRect(x, y, w, 6);
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(x + 8, y0, 10, y1 - y0);
      ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.moveTo(x + w, y0); ctx.lineTo(x + w, y1); ctx.stroke();
    }
  }
  function drawLedge(ctx, P, t) {
    if (P.kind === 'bellDeck') {
      rr(ctx, P.x, P.y, P.w, 24, 6); fillStroke(ctx, '#c9a227', 4);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(P.x + 6, P.y + 4, P.w - 12, 4);
      return;
    }
    let x = P.x, y = P.y;
    if (P.kind === 'crumble' && P.crumble > 0 && P.gone <= 0) { x += (Math.random() - 0.5) * 5 * P.crumble; y += (Math.random() - 0.5) * 3 * P.crumble; }
    const col = P.kind === 'slide' ? '#9aa7b8' : P.kind === 'crumble' ? '#b98756' : '#d39a5c';
    rr(ctx, x, y, P.w, 20, 6); fillStroke(ctx, col, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(x + 6, y + 4, P.w - 12, 4);
    if (P.kind === 'beam') { ctx.fillStyle = INK; [x + 14, x + P.w - 14].forEach(bx => { ctx.beginPath(); ctx.arc(bx, y + 11, 3.5, 0, TAU); ctx.fill(); }); }
    if (P.kind === 'crumble') {
      ctx.strokeStyle = 'rgba(58,34,22,0.7)'; ctx.lineWidth = 2;
      for (let k = 1; k < 4; k++) { const cx = x + P.w * k / 4; ctx.beginPath(); ctx.moveTo(cx, y + 2); ctx.lineTo(cx + 6, y + 10); ctx.lineTo(cx - 3, y + 18); ctx.stroke(); }
    }
    if (P.kind === 'slide') {
      ctx.fillStyle = 'rgba(58,34,22,0.55)';
      for (const s of [-1, 1]) { const ax = x + P.w / 2 + s * 24; ctx.beginPath(); ctx.moveTo(ax + s * 8, y + 10); ctx.lineTo(ax - s * 2, y + 4); ctx.lineTo(ax - s * 2, y + 16); ctx.closePath(); ctx.fill(); }
    }
  }
  function drawGate(ctx, R, t) {
    // reja de metal que se desliza dentro de la pared
    ctx.save();
    ctx.beginPath(); ctx.rect(WALL_L, R.y - 10, WALL_R - WALL_L, R.h + 20); ctx.clip();
    rr(ctx, R.x, R.y, R.w, R.h, 6); fillStroke(ctx, '#7d8796', 4);
    ctx.strokeStyle = 'rgba(255,214,77,0.9)'; ctx.lineWidth = 6;
    for (let x = R.x + 10; x < R.x + R.w - 10; x += 34) { ctx.beginPath(); ctx.moveTo(x, R.y + R.h - 3); ctx.lineTo(x + 16, R.y + 3); ctx.stroke(); }
    ctx.restore();
    // cable que la une con sus botones
    ctx.save(); ctx.setLineDash([6, 8]); ctx.strokeStyle = R.open > 0.05 ? 'rgba(80,200,120,0.8)' : 'rgba(58,34,22,0.35)'; ctx.lineWidth = 3;
    for (const B of R.buttons) { ctx.beginPath(); ctx.moveTo(B.x + B.w / 2, B.top ? B.y + 14 : B.y); ctx.lineTo(B.x + B.w / 2, B.top ? R.y : R.y + R.h); ctx.stroke(); }
    ctx.restore();
  }
  function drawButton(ctx, B, t) {
    const down = B.pressed ? 6 : 0;
    rr(ctx, B.x - 8, B.y + 6, B.w + 16, 8, 3); fillStroke(ctx, '#55627d', 3);
    rr(ctx, B.x, B.y + down, B.w, B.h - down + 2, 6); fillStroke(ctx, B.pressed ? '#3fbf6a' : '#e0483a', 3.5);
    if (!B.pressed && Math.floor(t * 2) % 2 === 0) { ctx.fillStyle = '#ffffff'; ctx.font = font(13, 700); ctx.textAlign = 'center'; ctx.fillText('PISA', B.x + B.w / 2, B.y - 8); }
  }
  function drawFalling(ctx, P) {
    if (!(P.gone > 0) || P.fallY === undefined) return;
    P.fallT = (P.fallT || 0) + 1 / 60;
    const fy = P.fallY + P.fallT * P.fallT * 900;
    ctx.save(); ctx.globalAlpha = clamp(1 - P.fallT / 1.2, 0, 1);
    ctx.translate(P.fallX + P.w / 2, fy); ctx.rotate(P.fallT * 0.8);
    rr(ctx, -P.w / 2, 0, P.w * 0.48, 20, 5); fillStroke(ctx, '#b98756', 3);
    rr(ctx, P.w * 0.02, 6, P.w * 0.48, 20, 5); fillStroke(ctx, '#b98756', 3);
    ctx.restore();
  }
  function drawBell(ctx, A, t) {
    const sw = Math.sin(t * 2) * 0.08 + (A.bellT > 0 ? Math.sin(A.bellT * 25) * 0.4 * A.bellT : 0);
    ctx.save(); ctx.translate(BELL.x, BELL.y - 70);
    ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-90, -40); ctx.lineTo(90, -40); ctx.stroke();
    ctx.rotate(sw);
    ctx.beginPath(); ctx.moveTo(-14, -40); ctx.lineTo(-14, -20); ctx.moveTo(14, -40); ctx.lineTo(14, -20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-26, -20); ctx.quadraticCurveTo(-34, 50, -62, 78); ctx.lineTo(62, 78); ctx.quadraticCurveTo(34, 50, 26, -20); ctx.closePath();
    const g = ctx.createLinearGradient(-60, 0, 60, 0); g.addColorStop(0, '#b8860b'); g.addColorStop(0.4, '#ffe27a'); g.addColorStop(1, '#a87a10');
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 86, 12, 0, TAU); ctx.fillStyle = '#7a5a10'; ctx.fill(); ctx.stroke();
    ctx.restore();
    outlinedText(ctx, '¡TOCA LA CAMPANA!', BELL.x, BELL.y + 70, 26, '#ffd84d', INK);
  }
  function drawDynamic(ctx, t, G, A) {
    const v = G && G.view ? G.view : { vy: 540, hh: 600 };
    const y0 = Math.max(TOP_Y - 900, v.vy - v.hh - 40), y1 = Math.min(1200, v.vy + v.hh + 40);
    drawSky(ctx, y0, y1);
    drawShaft(ctx, y0, y1, t);
    drawWalls(ctx, y0, y1);
    // piso de abajo
    ctx.fillStyle = '#7a4a2a'; ctx.fillRect(240, 640, 1440, 560);
    rr(ctx, 240, 640, 1440, 22, 6); fillStroke(ctx, '#a56a3c', 4);
    for (const P of A.oneway) { if (P.y > y1 + 40 || P.y < y0 - 40) continue; drawLedge(ctx, P, t); }
    for (const S of A.solids) {
      if (S.y > y1 + 40 || S.y < y0 - 40) continue;
      if (S.kind === 'gate') drawGate(ctx, S, t);
      if (S.kind === 'button') drawButton(ctx, S, t);
    }
    for (const P of A.oneway) drawFalling(ctx, P);
    for (const K of A.pegs) {
      if (K.y > y1 + 30 || K.y < y0 - 30) continue;
      ctx.beginPath(); ctx.arc(K.x, K.y, K.r, 0, TAU); ctx.fillStyle = '#d8a63a'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(K.x - 4, K.y - 5, 4, 0, TAU); ctx.fill();
    }
    if (TOP_Y - 300 < y1) drawBell(ctx, A, t);
  }
  function update(dt, G, A) { if (A.bellT > 0) A.bellT = Math.max(0, A.bellT - dt * 0.6); }

  ARENA_DEFS.torre = {
    levelOpts,
    id: 'torre', name: 'La Torre del Reloj', seed: 9090, hidden: true,
    desc: 'Trepa hasta la campana antes de que te alcance el agua.',
    layout, paintBg, paintFg, drawDynamic, init, update,
  };
})();
