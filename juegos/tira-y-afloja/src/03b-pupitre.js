/* =========================================================================
   ARENA 1 · EL PUPITRE — el salón de clases
   ========================================================================= */
(() => {
  /* ---------------- pared, ventana, tablero ---------------- */
  function paintWall(ctx, rng) {
    const g = ctx.createLinearGradient(0, 0, 0, 760);
    g.addColorStop(0, '#fbe8c4'); g.addColorStop(1, '#f1d5a6');
    ctx.fillStyle = g; ctx.fillRect(0, 0, WORLD_W, 760);
    // papel de colgadura con rayas suaves
    ctx.save();
    for (let x = 0; x < WORLD_W; x += 64) {
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x, 0, 26, 760);
      ctx.fillStyle = 'rgba(214,162,110,0.10)'; ctx.fillRect(x + 30, 0, 3, 760);
    }
    ctx.restore();
    // zócalo verde
    const z = ctx.createLinearGradient(0, 740, 0, 1080);
    z.addColorStop(0, '#5aa797'); z.addColorStop(1, '#3f8274');
    ctx.fillStyle = z; ctx.fillRect(0, 744, WORLD_W, 336);
    for (let x = 30; x < WORLD_W; x += 120) { ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(x, 770, 4, 300); }
    rr(ctx, -10, 730, WORLD_W + 20, 22, 4); fillStroke(ctx, '#c88c55', 3);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(0, 734, WORLD_W, 4);
    // piso
    ctx.fillStyle = '#9b5f35'; ctx.fillRect(0, 1036, WORLD_W, 50);
    for (let x = 0; x < WORLD_W; x += 140) { ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(x, 1036, 3, 50); }
  }

  function paintWindow(ctx, rng) {
    const x = 56, y = 60, w = 286, h = 270;
    // marco exterior
    rr(ctx, x - 14, y - 14, w + 28, h + 28, 14); fillStroke(ctx, '#e7b37a', 4);
    // cielo
    ctx.save(); rr(ctx, x, y, w, h, 6); ctx.clip();
    const sky = ctx.createLinearGradient(0, y, 0, y + h);
    sky.addColorStop(0, '#6cc4f0'); sky.addColorStop(0.7, '#bfe9fb'); sky.addColorStop(1, '#e8f8ff');
    ctx.fillStyle = sky; ctx.fillRect(x, y, w, h);
    // sol
    const sun = ctx.createRadialGradient(x + 60, y + 50, 0, x + 60, y + 50, 120);
    sun.addColorStop(0, 'rgba(255,250,210,1)'); sun.addColorStop(0.25, 'rgba(255,240,170,0.8)'); sun.addColorStop(1, 'rgba(255,240,170,0)');
    ctx.fillStyle = sun; ctx.fillRect(x, y, w, h);
    // nubes
    const cloud = (cx, cy, s) => {
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      [[0, 0, 26], [24, -10, 22], [48, 0, 24], [22, 8, 22]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(cx + dx * s, cy + dy * s, r * s, 0, TAU); ctx.fill(); });
    };
    cloud(x + 150, y + 70, 0.9); cloud(x + 40, y + 140, 0.6); cloud(x + 210, y + 150, 0.5);
    // montañas y árboles
    ctx.fillStyle = '#86c97a';
    ctx.beginPath(); ctx.moveTo(x, y + h); ctx.quadraticCurveTo(x + 80, y + 170, x + 170, y + 215); ctx.quadraticCurveTo(x + 240, y + 180, x + w, y + 200); ctx.lineTo(x + w, y + h); ctx.fill();
    ctx.fillStyle = '#5daa5d';
    ctx.beginPath(); ctx.moveTo(x, y + h); ctx.quadraticCurveTo(x + 120, y + 205, x + w, y + 235); ctx.lineTo(x + w, y + h); ctx.fill();
    // rama de árbol en primer plano
    ctx.strokeStyle = '#6b4a2e'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + w + 10, y + 30); ctx.quadraticCurveTo(x + 220, y + 40, x + 175, y + 20); ctx.stroke();
    for (let i = 0; i < 9; i++) {
      const lx = x + 180 + rng() * 110, ly = y + 10 + rng() * 45;
      ctx.fillStyle = i % 2 ? '#4f9e4a' : '#66b65c';
      ctx.beginPath(); ctx.ellipse(lx, ly, 14, 8, rng() * 3, 0, TAU); ctx.fill();
    }
    ctx.restore();
    // reflejo del vidrio
    ctx.save(); rr(ctx, x, y, w, h, 6); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath(); ctx.moveTo(x + 30, y); ctx.lineTo(x + 90, y); ctx.lineTo(x + 10, y + h); ctx.lineTo(x - 50, y + h); ctx.fill();
    ctx.restore();
    // travesaños
    ctx.lineWidth = 4; ctx.strokeStyle = INK;
    rr(ctx, x + w / 2 - 7, y - 2, 14, h + 4, 3); fillStroke(ctx, '#e7b37a', 3);
    rr(ctx, x - 2, y + h / 2 - 7, w + 4, 14, 3); fillStroke(ctx, '#e7b37a', 3);
    ctx.beginPath(); rr(ctx, x, y, w, h, 6); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    // alféizar
    rr(ctx, x - 26, y + h + 10, w + 52, 18, 6); fillStroke(ctx, '#f0c08a', 4);
  }

  function paintBoard(ctx, rng) {
    const x = 560, y = 66, w = 800, h = 290;
    rr(ctx, x - 18, y - 18, w + 36, h + 36, 12); fillStroke(ctx, '#b77942', 4);
    ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(x - 12, y - 14, w + 24, 4);
    rr(ctx, x, y, w, h, 6);
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#2f6150'); g.addColorStop(1, '#244c3f');
    fillStroke(ctx, g, 3);
    ctx.save(); rr(ctx, x, y, w, h, 6); ctx.clip();
    // manchas de borrador
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.025 + rng() * 0.04})`;
      ctx.beginPath(); ctx.ellipse(x + rng() * w, y + rng() * h, 40 + rng() * 90, 14 + rng() * 26, rng() * 0.5 - 0.25, 0, TAU); ctx.fill();
    }
    // reglas del salón
    chalkText(ctx, 'Reglas del salón:', x + 36, y + 42, 28, rng);
    chalkLine(ctx, [[x + 36, y + 62], [x + 262, y + 60]], rng, '#f6f2e8', 2.5);
    chalkText(ctx, '1. No correr', x + 44, y + 98, 24, rng);
    chalkText(ctx, '2. No gritar', x + 44, y + 136, 24, rng);
    chalkText(ctx, '3. ¡NO PEGAR CHICLE!', x + 44, y + 176, 26, rng, '#ffd1e3');
    // círculo alrededor de la regla 3
    const cpts = []; for (let a = 0; a <= TAU + 0.5; a += 0.2) cpts.push([x + 160 + Math.cos(a) * 140, y + 176 + Math.sin(a) * 26]);
    chalkLine(ctx, cpts, rng, '#ffd1e3', 2.5);
    // ecuación: 3 + 4 + 3 = 10 (¡el chicle se conserva!)
    chalkText(ctx, '3 + 4 + 3 = 10', x + 44, y + 236, 26, rng, '#fff3a8');
    chalkText(ctx, '(Fresa + hilo + Menta)', x + 44, y + 266, 17, rng, '#fff3a8');
    // dibujo de los dos chicles tirando
    const bx = x + 560, by = y + 150;
    const blob = (cx, cy, r, col) => { const pts = []; for (let a = 0; a <= TAU + 0.3; a += 0.25) pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9]); chalkLine(ctx, pts, rng, col, 3); };
    blob(bx - 110, by + 20, 46, '#ffb3cf');
    blob(bx + 120, by + 34, 30, '#a6f3e2');
    chalkLine(ctx, [[bx - 64, by + 18], [bx - 10, by + 40], [bx + 40, by + 44], [bx + 90, by + 30]], rng, '#f6f2e8', 3);
    // caritas
    chalkText(ctx, '• •', bx - 110, by + 8, 20, rng, '#ffb3cf', 'center');
    chalkText(ctx, '• •', bx + 120, by + 26, 16, rng, '#a6f3e2', 'center');
    chalkText(ctx, 'VS', bx + 6, by - 52, 40, rng, '#fff3a8', 'center', -0.08);
    chalkText(ctx, '¡Examen el lunes!', x + 590, y + 262, 20, rng, '#f6f2e8', 'center', -0.03);
    ctx.restore();
    // bandeja de tizas
    rr(ctx, x - 10, y + h + 10, w + 20, 14, 4); fillStroke(ctx, '#c88c55', 3);
    [['#ffffff', 640], ['#ffc0d8', 676], ['#fff099', 1220]].forEach(([c, cx]) => { rr(ctx, cx, y + h + 2, 28, 9, 4); fillStroke(ctx, c, 2); });
    rr(ctx, 1260, y + h - 2, 60, 14, 4); fillStroke(ctx, '#7b5233', 2.5);
    rr(ctx, 1260, y + h + 5, 60, 7, 2); fillStroke(ctx, '#e9e2d0', 2);
  }

  function paintPoster(ctx, rng) {
    const x = 1414, y = 74, w = 236, h = 262;
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(0.025); ctx.translate(-w / 2, -h / 2);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; rr(ctx, 6, 8, w, h, 6); ctx.fill();
    rr(ctx, 0, 0, w, h, 6); fillStroke(ctx, '#fffaf0', 4);
    ctx.fillStyle = INK; ctx.font = font(16, 700); ctx.textAlign = 'center';
    ctx.fillText('TABLA PERIÓDICA', w / 2, 30);
    ctx.font = font(14, 600); ctx.fillText('de los chicles', w / 2, 50);
    const els = [['Fr', '#ff5c9d'], ['Me', '#27d3b2'], ['Uv', '#9b6bdf'], ['Li', '#b7dc3c'], ['Ca', '#b5703a'], ['Na', '#ff9a3c'], ['Bm', '#4aa3ff'], ['Tf', '#ffcf3c'], ['Co', '#f2f0e6']];
    els.forEach(([s, c], i) => {
      const cx = 22 + (i % 3) * 66, cy = 66 + Math.floor(i / 3) * 62;
      rr(ctx, cx, cy, 58, 54, 6); fillStroke(ctx, c, 3);
      ctx.fillStyle = INK; ctx.font = font(22, 700); ctx.fillText(s, cx + 29, cy + 34);
      ctx.font = font(10, 600); ctx.fillText(String(i + 1), cx + 10, cy + 13);
    });
    // cinta
    ctx.fillStyle = 'rgba(255,240,180,0.85)';
    ctx.save(); ctx.translate(w / 2, -2); ctx.rotate(-0.05); ctx.fillRect(-34, -9, 68, 18); ctx.restore();
    ctx.restore();
  }

  function paintClockStatic(ctx) {
    const cx = 1792, cy = 176, r = 62;
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.arc(cx + 5, cy + 7, r + 6, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, r + 8, 0, TAU); fillStroke(ctx, '#e8574a', 4);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); fillStroke(ctx, '#fffdf6', 3);
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU, l = i % 3 === 0 ? 12 : 6;
      ctx.strokeStyle = INK; ctx.lineWidth = i % 3 === 0 ? 4 : 2.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (r - 6), cy + Math.sin(a) * (r - 6)); ctx.lineTo(cx + Math.cos(a) * (r - 6 - l), cy + Math.sin(a) * (r - 6 - l)); ctx.stroke();
    }
  }


  /* ---------------- repisas y su decoración ---------------- */
  function paintShelf(ctx, P, rng, left) {
    // soportes
    [P.x + 30, P.x + P.w - 30].forEach(bx => {
      ctx.beginPath(); ctx.moveTo(bx - 8, P.y + 16); ctx.lineTo(bx + 8, P.y + 16); ctx.lineTo(bx + 8, P.y + 64); ctx.closePath();
      fillStroke(ctx, '#8d8f99', 3);
    });
    // objetos (detrás de la línea de juego)
    if (left) {
      // globo terráqueo
      const gx = P.x + 46, gy = P.y - 52;
      ctx.strokeStyle = INK; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(gx, gy, 40, -2.6, 0.9); ctx.stroke();
      rr(ctx, gx - 18, P.y - 10, 36, 10, 3); fillStroke(ctx, '#c9a227', 3);
      ctx.beginPath(); ctx.moveTo(gx, P.y - 10); ctx.lineTo(gx, gy + 36); ctx.stroke();
      ctx.beginPath(); ctx.arc(gx, gy, 32, 0, TAU); fillStroke(ctx, '#58b5f0', 3.5);
      ctx.fillStyle = '#7ccf6d';
      ctx.beginPath(); ctx.ellipse(gx - 10, gy - 8, 13, 9, 0.6, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(gx + 12, gy + 10, 10, 13, -0.3, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(gx - 14, gy - 14, 8, 5, -0.6, 0, TAU); ctx.fill();
      // matera con planta
      const px = P.x + P.w - 50;
      ctx.fillStyle = '#4caf50';
      [[-14, -46, -0.5], [0, -54, 0], [14, -44, 0.5], [-6, -36, -0.9], [8, -34, 0.9]].forEach(([dx, dy, a]) => {
        ctx.save(); ctx.translate(px + dx, P.y - 22 + dy * 0.5); ctx.rotate(a);
        ctx.beginPath(); ctx.ellipse(0, -12, 8, 18, 0, 0, TAU); ctx.fillStyle = '#58b65a'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke(); ctx.restore();
      });
      ctx.beginPath(); ctx.moveTo(px - 22, P.y - 30); ctx.lineTo(px + 22, P.y - 30); ctx.lineTo(px + 16, P.y); ctx.lineTo(px - 16, P.y); ctx.closePath();
      fillStroke(ctx, '#e0784a', 3.5);
    } else {
      // cuadernos apilados
      const cx = P.x + P.w - 70;
      [['#ff7b7b', 0], ['#ffd166', 1], ['#7ec8ff', 2]].forEach(([c, i]) => { rr(ctx, cx - 4 + i * 3, P.y - 14 - i * 13, 76, 13, 3); fillStroke(ctx, c, 3); });
      // trofeo
      const tx = P.x + 48;
      rr(ctx, tx - 20, P.y - 14, 40, 14, 3); fillStroke(ctx, '#8a5a3a', 3);
      rr(ctx, tx - 5, P.y - 34, 10, 22, 2); fillStroke(ctx, '#f2c230', 3);
      ctx.beginPath(); ctx.moveTo(tx - 24, P.y - 76); ctx.lineTo(tx + 24, P.y - 76); ctx.quadraticCurveTo(tx + 22, P.y - 36, tx, P.y - 34); ctx.quadraticCurveTo(tx - 22, P.y - 36, tx - 24, P.y - 76); ctx.closePath();
      fillStroke(ctx, '#f6c945', 3.5);
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(tx - 14, P.y - 70, 5, 26);
    }
    // tabla
    rr(ctx, P.x, P.y, P.w, P.h, 5);
    fillStroke(ctx, '#d9995a', 4);
    woodGrain(ctx, P.x + 4, P.y + 3, P.w - 8, P.h - 6, '#8a5428', rng, 6, 0.25);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(P.x + 6, P.y + 3, P.w - 12, 3);
  }

  /* ---------------- regla sostenida por lápices ---------------- */
  function pencil(ctx, x, yTop, yBot, body, rng) {
    const w = 18;
    // borrador arriba
    rr(ctx, x - w / 2, yTop, w, 20, 4); fillStroke(ctx, '#f497b2', 3);
    rr(ctx, x - w / 2 - 1, yTop + 16, w + 2, 12, 2); fillStroke(ctx, '#c9ccd6', 3);
    // cuerpo
    const top = yTop + 28, bot = yBot - 26;
    rr(ctx, x - w / 2, top, w, bot - top, 2); fillStroke(ctx, body, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x - w / 2 + 3, top + 2, 4, bot - top - 4);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x + 3, top + 2, 4, bot - top - 4);
    // punta clavada en la madera
    ctx.beginPath(); ctx.moveTo(x - w / 2, bot); ctx.lineTo(x + w / 2, bot); ctx.lineTo(x + 3, yBot - 4); ctx.lineTo(x - 3, yBot - 4); ctx.closePath();
    fillStroke(ctx, '#f1c48f', 3);
  }
  function paintRuler(ctx, P, rng) {
    pencil(ctx, P.x + 52, P.y + 10, 646, '#ffcc33', rng);
    pencil(ctx, P.x + P.w - 52, P.y + 10, 646, '#ff8a3d', rng);
    rr(ctx, P.x, P.y, P.w, P.h, 4);
    const g = ctx.createLinearGradient(0, P.y, 0, P.y + P.h);
    g.addColorStop(0, '#ffe680'); g.addColorStop(1, '#f2c53d');
    fillStroke(ctx, g, 4);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    for (let i = 0; i <= 30; i++) {
      const tx = P.x + 14 + i * ((P.w - 28) / 30);
      const l = i % 5 === 0 ? 9 : 5;
      ctx.beginPath(); ctx.moveTo(tx, P.y + 2); ctx.lineTo(tx, P.y + 2 + l); ctx.stroke();
      if (i % 5 === 0 && i > 0 && i < 30) { ctx.fillStyle = INK; ctx.font = font(8, 700); ctx.textAlign = 'center'; ctx.fillText(String(i), tx, P.y + 15.5); }
    }
  }

  /* ---------------- el pupitre ---------------- */
  function paintDesk(ctx, rng, L) {
    const top = L.solids[0], body = L.solids[1];
    // panel frontal
    rr(ctx, body.x, body.y - 6, body.w, 420, 6);
    const pg = ctx.createLinearGradient(0, body.y, 0, 1080);
    pg.addColorStop(0, '#a5663a'); pg.addColorStop(1, '#8a512b');
    fillStroke(ctx, pg, 4);
    woodGrain(ctx, body.x + 4, body.y, body.w - 8, 400, '#5c3218', rng, 11, 0.22);
    // panel interior
    rr(ctx, body.x + 40, body.y + 30, body.w - 80, 330, 10);
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(58,34,22,0.55)'; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,220,180,0.18)'; ctx.lineWidth = 2;
    rr(ctx, body.x + 43, body.y + 33, body.w - 86, 324, 9); ctx.stroke();
    // cajón
    const dx = 800, dy = 708, dw = 320, dh = 92;
    rr(ctx, dx, dy, dw, dh, 8); fillStroke(ctx, '#b87443', 4);
    woodGrain(ctx, dx + 4, dy + 4, dw - 8, dh - 8, '#6b3a1c', rng, 9, 0.2);
    rr(ctx, dx + dw / 2 - 46, dy + dh / 2 - 8, 92, 16, 8); fillStroke(ctx, '#c7cbd6', 3.5);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(dx + dw / 2 - 38, dy + dh / 2 - 5, 76, 3);
    // corazón tallado "F + M"
    ctx.save(); ctx.translate(520, 900); ctx.rotate(-0.08);
    ctx.strokeStyle = 'rgba(58,34,22,0.6)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 22); ctx.bezierCurveTo(-42, -6, -26, -40, 0, -18); ctx.bezierCurveTo(26, -40, 42, -6, 0, 22); ctx.stroke();
    ctx.fillStyle = 'rgba(58,34,22,0.6)'; ctx.font = font(18, 700); ctx.textAlign = 'center'; ctx.fillText('F+M', 0, 0);
    ctx.restore();
    // garabato a lápiz
    ctx.save(); ctx.translate(1380, 880); ctx.rotate(0.05);
    ctx.fillStyle = 'rgba(40,30,30,0.35)'; ctx.font = font(20, 500); ctx.textAlign = 'center';
    ctx.fillText('¡aquí vivía', 0, 0); ctx.fillText('un chicle!', 0, 24);
    ctx.strokeStyle = 'rgba(40,30,30,0.35)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(60, 30); ctx.quadraticCurveTo(110, 20, 120, -60); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(110, -50); ctx.lineTo(120, -62); ctx.lineTo(130, -48); ctx.stroke();
    ctx.restore();
    // sombra bajo la tapa
    const sh = ctx.createLinearGradient(0, top.y + top.h, 0, top.y + top.h + 34);
    sh.addColorStop(0, 'rgba(40,20,10,0.45)'); sh.addColorStop(1, 'rgba(40,20,10,0)');
    ctx.fillStyle = sh; ctx.fillRect(body.x + 2, top.y + top.h, body.w - 4, 34);
    // chicles pegados debajo del pupitre (¡el origen de todo!)
    const wads = [[340, '#ff7bb0'], [470, '#7ee0c8'], [612, '#b993ff'], [1180, '#ffd166'], [1330, '#ff7bb0'], [1452, '#7ec8ff'], [1585, '#a3e86b']];
    wads.forEach(([wx, c]) => {
      const wy = top.y + top.h + 4, r = 11 + rng() * 6;
      ctx.beginPath(); ctx.ellipse(wx, wy, r * 1.25, r * 0.8, 0, 0, Math.PI); fillStroke(ctx, c, 3);
      // gota colgando
      if (rng() < 0.6) { ctx.beginPath(); ctx.ellipse(wx + 4, wy + r * 0.9, 4, 7, 0, 0, TAU); fillStroke(ctx, c, 2.5); }
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(wx - r * 0.4, wy + 4, r * 0.35, 2.5, 0, 0, TAU); ctx.fill();
    });
    // patas metálicas a los lados
    [body.x - 2, body.x + body.w - 20].forEach(lx => {
      rr(ctx, lx, top.y + top.h - 2, 22, 420, 6);
      const lg = ctx.createLinearGradient(lx, 0, lx + 22, 0);
      lg.addColorStop(0, '#9da3b2'); lg.addColorStop(0.4, '#e3e6ee'); lg.addColorStop(1, '#7e8494');
      fillStroke(ctx, lg, 3.5);
    });
    // tapa del pupitre
    rr(ctx, top.x, top.y - 10, top.w, 14, 6); fillStroke(ctx, '#f0c084', 3.5); // superficie (perspectiva)
    rr(ctx, top.x, top.y, top.w, top.h, 8);
    const tg = ctx.createLinearGradient(0, top.y, 0, top.y + top.h);
    tg.addColorStop(0, '#e2a663'); tg.addColorStop(1, '#c4844a');
    fillStroke(ctx, tg, 4);
    woodGrain(ctx, top.x + 6, top.y + 4, top.w - 12, top.h - 8, '#7a4520', rng, 6, 0.28);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; rr(ctx, top.x + 10, top.y + 3, top.w - 20, 4, 2); ctx.fill();
    // marcas de lápiz sobre la tapa
    ctx.strokeStyle = 'rgba(58,34,22,0.3)'; ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) { const sx = 340 + rng() * 1200; ctx.beginPath(); ctx.moveTo(sx, top.y + 12 + rng() * 14); ctx.lineTo(sx + 20 + rng() * 30, top.y + 10 + rng() * 18); ctx.stroke(); }
  }

  function paintBook(ctx, B, rng) {
    rr(ctx, B.x, B.y, B.w, B.h, 5);
    const g = ctx.createLinearGradient(0, B.y, 0, B.y + B.h);
    g.addColorStop(0, mixHex(B.color, '#ffffff', 0.18)); g.addColorStop(1, mixHex(B.color, '#000000', 0.12));
    fillStroke(ctx, g, 4);
    // bandas del lomo
    ctx.fillStyle = 'rgba(255,240,200,0.75)';
    ctx.fillRect(B.x + 14, B.y + 4, 6, B.h - 8); ctx.fillRect(B.x + B.w - 20, B.y + 4, 6, B.h - 8);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(B.x + 22, B.y + 4, 2, B.h - 8); ctx.fillRect(B.x + B.w - 24, B.y + 4, 2, B.h - 8);
    ctx.fillStyle = 'rgba(255,248,230,0.95)'; ctx.font = font(Math.min(15, B.h * 0.5), 700);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(B.title, B.x + B.w / 2, B.y + B.h / 2 + 1);
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(B.x + 8, B.y + 3, B.w - 16, 3);
  }

  function paintEraser(ctx, E) {
    rr(ctx, E.x, E.y, E.w, E.h, 10);
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#f7a9bd'; ctx.fillRect(E.x, E.y, E.w * 0.52, E.h);
    ctx.fillStyle = '#7fb4ee'; ctx.fillRect(E.x + E.w * 0.52, E.y, E.w * 0.48, E.h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(E.x, E.y + 3, E.w, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(E.x, E.y + E.h - 8, E.w, 8);
    // migas de borrador
    ctx.restore();
    rr(ctx, E.x, E.y, E.w, E.h, 10); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(E.x + E.w * 0.52, E.y + 2); ctx.lineTo(E.x + E.w * 0.52, E.y + E.h - 2); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = 'rgba(58,34,22,0.65)'; ctx.font = font(11, 700); ctx.textAlign = 'center';
    ctx.fillText('BORRADOR', E.x + E.w * 0.26, E.y + 25);
    ctx.fillText('TINTA', E.x + E.w * 0.76, E.y + 25);
  }


  const mirrorX = (x, w) => WORLD_W - x - w;
  function layout() {
    const solids = [], oneway = [];
    const S = (x, y, w, h, kind, extra = {}) => solids.push(Object.assign({ x, y, w, h, kind }, extra));
    const O = (x, y, w, kind, extra = {}) => oneway.push(Object.assign({ x, y, w, h: 18, kind }, extra));
    S(266, 640, 1388, 38, 'deskTop');
    S(290, 678, 1340, 520, 'deskBody');
    const books = [
      [463, 606, 224, 34, '#e5533d', 'MATEMÁTICAS', '#47b36b', 'INGLÉS'],
      [475, 574, 198, 32, '#3d7be5', 'CIENCIAS', '#8a5cd6', 'ARTES'],
      [489, 543, 170, 31, '#f2b631', 'HISTORIA', '#f08a3c', 'ESPAÑOL'],
    ];
    books.forEach(([x, y, w, h, c1, t1, c2, t2]) => {
      S(x, y, w, h, 'book', { color: c1, title: t1 });
      S(mirrorX(x, w), y, w, h, 'book', { color: c2, title: t2 });
    });
    S(896, 606, 128, 34, 'eraser');
    O(744, 452, 432, 'ruler');
    O(96, 392, 250, 'shelf');
    O(mirrorX(96, 250), 392, 250, 'shelf');
    return {
      solids, oneway,
      hazardY: 832, deskLeft: 266, deskRight: 1654, deskY: 640, canRim: 826,
      spawns: [{ x: 760, y: 640 }, { x: 1160, y: 640 }],
      pelletSpots: [
        { x: 960, y: 420 }, { x: 221, y: 360 }, { x: 1699, y: 360 }, { x: 574, y: 512 }, { x: 1346, y: 512 },
        { x: 780, y: 608 }, { x: 1140, y: 608 }, { x: 960, y: 572 }, { x: 345, y: 608 }, { x: 1575, y: 608 },
        { x: 960, y: 270 }, { x: 812, y: 420 }, { x: 1108, y: 420 }, { x: 410, y: 520 }, { x: 1510, y: 520 },
      ],
      goldenSpots: [{ x: 960, y: 412 }, { x: 221, y: 352 }, { x: 1699, y: 352 }],
      respawnSpots: [{ x: 574, y: 543 }, { x: 1346, y: 543 }, { x: 960, y: 452 }],
      cans: [
        { x: 0, w: 276, color: '#3fae6b', dark: '#2a8550', light: '#7fd59d', label: 'CANECA' },
        { x: WORLD_W - 276, w: 276, color: '#3c8fe0', dark: '#2769ad', light: '#86bdf2', label: 'CANECA' },
      ],
    };
  }

  function paintBg(b, rng, L) {
    paintWall(b, rng);
    paintWindow(b, rng);
    paintBoard(b, rng);
    paintPoster(b, rng);
    paintClockStatic(b);
    paintPennants(b);
    L.cans.forEach(C => paintCanBack(b, C, rng, L.canRim));
    L.oneway.forEach(P => { if (P.kind === 'shelf') paintShelf(b, P, rng, P.x < 960); });
    paintDesk(b, rng, L);
    L.oneway.forEach(P => { if (P.kind === 'ruler') paintRuler(b, P, rng); });
    L.solids.forEach(B => { if (B.kind === 'book') paintBook(b, B, rng); if (B.kind === 'eraser') paintEraser(b, B); });
    paintLight(b);
  }

  const motes = Array.from({ length: 46 }, () => ({ x: rnd(80, 1300), y: rnd(80, 900), s: rnd(1.2, 3.2), ph: rnd(TAU), sp: rnd(6, 16) }));
  function drawDynamic(ctx, t) {
    // reloj
    const cx = 1792, cy = 176, d = new Date();
    const sec = d.getSeconds() + d.getMilliseconds() / 1000, min = d.getMinutes() + sec / 60, hr = (d.getHours() % 12) + min / 60;
    const hand = (a, l, w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(a) * l, cy - Math.cos(a) * l); ctx.stroke(); };
    hand(hr / 12 * TAU, 30, 6, INK); hand(min / 60 * TAU, 44, 4, INK); hand(sec / 60 * TAU, 48, 2, '#e8574a');
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, TAU); ctx.fill();
    // polvo flotando en la luz
    for (const m of motes) {
      const x = m.x + Math.sin(t * 0.3 + m.ph) * 30 + t * m.sp * 0.6 % 40;
      const y = m.y + Math.cos(t * 0.23 + m.ph) * 24 - (t * m.sp) % 60;
      const inBeam = clamp(1 - Math.abs((y - 70) * 1.05 - (x - 150)) / 340, 0, 1);
      if (inBeam <= 0.02) continue;
      ctx.fillStyle = `rgba(255,248,220,${0.55 * inBeam * (0.6 + 0.4 * Math.sin(t * 2 + m.ph))})`;
      ctx.beginPath(); ctx.arc(x, y, m.s, 0, TAU); ctx.fill();
    }
  }

  defineArena({
    id: 'pupitre', name: 'El Pupitre', seed: 20261102,
    desc: 'El clásico: libros, borrador y una regla en lo alto.',
    layout, paintBg, drawDynamic,
  });
})();
