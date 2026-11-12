/* =========================================================================
   ARENA 6 · LA BIBLIOTECA — estanterías altísimas de cuatro niveles, una
   escalera rodante que se desliza por el centro y libros que caen del techo
   en un orden fijo (una sombra avisa dónde van a caer)
   ========================================================================= */
(() => {
  const mirrorX = (x, w) => WORLD_W - x - w;
  const DROPS = [700, 1220, 960, 450, 1470, 820, 1100, 600, 1320];
  const FIRST = 6, EVERY = 3.4, WARN = 1.1;
  const BOOK_COLS = ['#e5533d', '#3d7be5', '#f2b631', '#47b36b', '#8a5cd6', '#f08a3c', '#2a9d8f', '#c94f7c'];

  function layout() {
    const solids = [], oneway = [];
    const S = (x, y, w, h, kind, extra = {}) => solids.push(Object.assign({ x, y, w, h, kind }, extra));
    const O = (x, y, w, kind, extra = {}) => oneway.push(Object.assign({ x, y, w, h: 16, kind }, extra));
    S(266, 640, 1388, 38, 'tableTop');
    S(290, 678, 1340, 520, 'tableBody');
    S(926, 612, 68, 28, 'lampBase');
    [520, 400, 280, 160].forEach(y => { O(300, y, 240, 'bookShelf'); O(mirrorX(300, 240), y, 240, 'bookShelf'); });
    oneway.push({ x: 900, y: 340, w: 120, h: 16, kind: 'ladder', cx: 960, move(R, t) { R.x = R.cx - R.w / 2 + Math.sin(t * 0.55) * 210; } });
    return {
      solids, oneway,
      hazardY: 832, deskLeft: 266, deskRight: 1654, deskY: 640, canRim: 826,
      spawns: [{ x: 760, y: 640 }, { x: 1160, y: 640 }],
      pelletSpots: [
        { x: 420, y: 490 }, { x: 1500, y: 490 }, { x: 420, y: 370 }, { x: 1500, y: 370 }, { x: 420, y: 250 },
        { x: 1500, y: 250 }, { x: 420, y: 130 }, { x: 1500, y: 130 }, { x: 960, y: 300 }, { x: 760, y: 608 },
        { x: 1160, y: 608 }, { x: 960, y: 580 }, { x: 640, y: 440 }, { x: 1280, y: 440 }, { x: 960, y: 200 },
      ],
      goldenSpots: [{ x: 960, y: 190 }, { x: 420, y: 122 }, { x: 1500, y: 122 }],
      respawnSpots: [{ x: 420, y: 400 }, { x: 1500, y: 400 }, { x: 960, y: 340 }],
      cans: [
        { x: 0, w: 276, color: '#3c8fe0', dark: '#2769ad', light: '#86bdf2', label: 'PAPEL' },
        { x: WORLD_W - 276, w: 276, color: '#3c8fe0', dark: '#2769ad', light: '#86bdf2', label: 'PAPEL' },
      ],
    };
  }

  /* ---------------- libros que caen ---------------- */
  function init(A) { A.books = []; A.nextDrop = FIRST; A.dropIdx = 0; }
  function update(dt, G, A) {
    if (A.t >= A.nextDrop - WARN && !A.books.some(b => b.state === 'warn')) {
      const x = DROPS[A.dropIdx++ % DROPS.length];
      A.books.push({ x, y: -40, vy: 0, rot: 0, vr: 0, state: 'warn', t: 0, col: BOOK_COLS[A.dropIdx % BOOK_COLS.length], gy: ARENA.groundBelow(x, -100) });
      A.nextDrop += EVERY;
    }
    for (const b of A.books) {
      b.t += dt;
      if (b.state === 'warn' && b.t >= WARN) { b.state = 'fall'; b.vy = 200; b.vr = (A.dropIdx % 2 ? 1 : -1) * 5; }
      if (b.state === 'fall') {
        b.vy += PHYS.g * dt; b.y += b.vy * dt; b.rot += b.vr * dt;
        if (G) for (const p of G.players) {
          if (!p.alive || p.inv > 0 || b.hit) continue;
          if (Math.hypot(p.x - b.x, p.y - b.y) < p.r + 22) {
            b.hit = true; b.vy = -380; b.vr *= -2;
            if (p.stuck) p.unstick('hit', 1);
            p.stun = Math.max(p.stun, 0.55); p.vy = Math.max(p.vy, 300); p.vx += (p.x < b.x ? -1 : 1) * 180;
            p.bump(1200, 0, -1);
            if (!G.quiet) { Sound.play('ram', 0.7); FX.stars(b.x, b.y, 7, 0.8); FX.callout('¡LIBRAZO!', p.x, p.y - p.r - 50, '#ffd84d', 48, 1.1); FX.shake(0.35); }
          }
        }
        if (b.y > b.gy - 12 && b.vy > 0) { b.y = b.gy - 12; b.state = 'land'; b.t = 0; b.rot = Math.round(b.rot / Math.PI) * Math.PI; if (G && !G.quiet) { Sound.play('land', 0.6, 4); FX.dust(b.x, b.gy, 6, 1); } }
      }
    }
    A.books = A.books.filter(b => !(b.state === 'land' && b.t > 1.4) && b.y < 1200);
  }

  /* ---------------- pintura fija ---------------- */
  function paintWall(ctx, rng) {
    ctx.fillStyle = '#2f5a4a'; ctx.fillRect(0, 0, WORLD_W, 1080);
    // papel tapiz con rombos
    ctx.fillStyle = 'rgba(255,230,160,0.07)';
    for (let y = 0; y < 600; y += 60) for (let x = (y / 60) % 2 ? 30 : 0; x < WORLD_W; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, y - 14); ctx.lineTo(x + 10, y); ctx.lineTo(x, y + 14); ctx.lineTo(x - 10, y); ctx.closePath(); ctx.fill();
    }
    // paneles de madera abajo
    const z = ctx.createLinearGradient(0, 560, 0, 1080); z.addColorStop(0, '#7a4a28'); z.addColorStop(1, '#5a341b');
    ctx.fillStyle = z; ctx.fillRect(0, 560, WORLD_W, 520);
    for (let x = 20; x < WORLD_W; x += 160) { rr(ctx, x, 590, 130, 160, 8); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(30,15,5,0.35)'; ctx.stroke(); }
    rr(ctx, -10, 552, WORLD_W + 20, 14, 4); fillStroke(ctx, '#d4a53c', 3);
    // riel de la escalera
    rr(ctx, 560, 92, 800, 12, 6); fillStroke(ctx, '#d4a53c', 3);
    ctx.fillStyle = '#5a341b'; ctx.fillRect(0, 1036, WORLD_W, 50);
  }

  function paintWindow(ctx) {
    const cx = 960, y0 = 120, w = 300, h = 300;
    ctx.beginPath(); ctx.moveTo(cx - w / 2, y0 + h); ctx.lineTo(cx - w / 2, y0 + w / 2); ctx.arc(cx, y0 + w / 2, w / 2, Math.PI, 0); ctx.lineTo(cx + w / 2, y0 + h); ctx.closePath();
    const g = ctx.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, '#9fd8f5'); g.addColorStop(1, '#e8f6ff');
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 14; ctx.strokeStyle = '#5a341b'; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    ctx.save(); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    [[cx - 60, y0 + 140, 1], [cx + 70, y0 + 200, 0.7]].forEach(([x, y, s]) => { [[0, 0, 26], [24, -10, 22], [48, 0, 24]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, TAU); ctx.fill(); }); });
    ctx.restore();
    ctx.strokeStyle = '#5a341b'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(cx, y0); ctx.lineTo(cx, y0 + h); ctx.moveTo(cx - w / 2, y0 + 190); ctx.lineTo(cx + w / 2, y0 + 190); ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const lg = ctx.createLinearGradient(cx, y0, cx, 640); lg.addColorStop(0, 'rgba(255,245,210,0.22)'); lg.addColorStop(1, 'rgba(255,245,210,0)');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(cx - w / 2, y0 + 100); ctx.lineTo(cx + w / 2, y0 + 100); ctx.lineTo(cx + 320, 640); ctx.lineTo(cx - 320, 640); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function paintSilence(ctx) {
    ctx.save(); ctx.translate(1200, 470); ctx.rotate(0.03);
    rr(ctx, -80, -30, 160, 60, 10); fillStroke(ctx, '#fff6e6', 4);
    ctx.fillStyle = '#e04b3a'; ctx.font = font(30, 700); ctx.textAlign = 'center'; ctx.fillText('¡SILENCIO!', 0, 11);
    ctx.restore();
    ctx.save(); ctx.translate(720, 470); ctx.rotate(-0.03);
    rr(ctx, -80, -30, 160, 60, 10); fillStroke(ctx, '#fff6e6', 4);
    ctx.fillStyle = INK; ctx.font = font(20, 700); ctx.textAlign = 'center'; ctx.fillText('Devolver los', 0, -4); ctx.fillText('libros a tiempo', 0, 18);
    ctx.restore();
  }

  function paintBookcase(ctx, x, rng) {
    const w = 240;
    rr(ctx, x - 16, 100, w + 32, 560, 10); fillStroke(ctx, '#6b3d1e', 4);
    rr(ctx, x - 4, 112, w + 8, 540, 6); ctx.fillStyle = '#3e2412'; ctx.fill();
    // cornisa
    rr(ctx, x - 26, 86, w + 52, 26, 6); fillStroke(ctx, '#8a5530', 4);
    [520, 400, 280, 160].forEach(sy => {
      // libros sobre cada tabla (detrás de los jugadores)
      let bx = x + 6;
      while (bx < x + w - 14) {
        const bw = 12 + rng() * 14, bh = 52 + rng() * 40;
        const lean = rng() < 0.08;
        ctx.save(); ctx.translate(bx + bw / 2, sy);
        if (lean) ctx.rotate(0.22);
        rr(ctx, -bw / 2, -bh, bw, bh, 2);
        fillStroke(ctx, pick(BOOK_COLS), 2);
        ctx.fillStyle = 'rgba(255,240,200,0.7)'; ctx.fillRect(-bw / 2 + 2, -bh + 8, bw - 4, 3); ctx.fillRect(-bw / 2 + 2, -16, bw - 4, 3);
        ctx.restore();
        bx += bw + 1 + (lean ? 8 : 0);
      }
    });
  }

  function paintShelfBoards(ctx, L) {
    for (const P of L.oneway) if (P.kind === 'bookShelf') {
      rr(ctx, P.x - 8, P.y, P.w + 16, P.h, 4); fillStroke(ctx, '#a4683a', 4);
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(P.x - 2, P.y + 3, P.w + 4, 3);
    }
  }

  function paintTable(ctx, rng, L) {
    const top = L.solids[0], body = L.solids[1];
    rr(ctx, body.x, body.y - 6, body.w, 420, 6); fillStroke(ctx, '#7a4524', 4);
    for (let k = 0; k < 5; k++) {
      const px = body.x + 40 + k * ((body.w - 80) / 5);
      rr(ctx, px + 10, body.y + 30, (body.w - 80) / 5 - 20, 260, 14); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(30,15,5,0.4)'; ctx.stroke();
      rr(ctx, px + 24, body.y + 44, (body.w - 80) / 5 - 48, 232, 10); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,220,170,0.15)'; ctx.stroke();
    }
    rr(ctx, top.x, top.y - 10, top.w, 14, 6); fillStroke(ctx, '#3f7a52', 3.5); // paño verde
    rr(ctx, top.x, top.y, top.w, top.h, 8);
    const tg = ctx.createLinearGradient(0, top.y, 0, top.y + top.h); tg.addColorStop(0, '#9a5a30'); tg.addColorStop(1, '#6e3d1d');
    fillStroke(ctx, tg, 4);
    woodGrain(ctx, top.x + 6, top.y + 4, top.w - 12, top.h - 8, '#3a1d0a', rng, 6, 0.3);
    // libros abiertos sobre la mesa
    [[600, '#fff9ea'], [1320, '#fff9ea']].forEach(([x, c]) => {
      ctx.beginPath(); ctx.moveTo(x - 50, top.y - 2); ctx.quadraticCurveTo(x - 25, top.y - 12, x, top.y - 4); ctx.quadraticCurveTo(x + 25, top.y - 12, x + 50, top.y - 2); ctx.closePath(); fillStroke(ctx, c, 2.5);
    });
  }

  function paintLamp(ctx, L) {
    const B = L.solids.find(s => s.kind === 'lampBase');
    rr(ctx, B.x, B.y + 10, B.w, 18, 6); fillStroke(ctx, '#d4a53c', 3.5);
    ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(960, B.y + 10); ctx.lineTo(960, B.y - 40); ctx.stroke();
    ctx.strokeStyle = '#d4a53c'; ctx.lineWidth = 4; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(900, B.y - 40); ctx.quadraticCurveTo(960, B.y - 76, 1020, B.y - 40); ctx.closePath(); fillStroke(ctx, '#2e8b57', 4);
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(960, B.y - 30, 4, 960, B.y, 120); g.addColorStop(0, 'rgba(255,240,180,0.5)'); g.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(960, B.y, 120, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function paintBg(b, rng, L) {
    paintWall(b, rng);
    paintWindow(b);
    paintSilence(b);
    L.cans.forEach(C => paintCanBack(b, C, rng, L.canRim));
    paintBookcase(b, 300, rng);
    paintBookcase(b, WORLD_W - 540, rng);
    paintShelfBoards(b, L);
    paintTable(b, rng, L);
    paintLamp(b, L);
  }

  /* ---------------- partes animadas ---------------- */
  function drawBook(ctx, b, t) {
    ctx.save(); ctx.translate(b.x + (b.state === 'warn' ? Math.sin(t * 40) * 3 : 0), b.state === 'warn' ? 18 : b.y);
    ctx.rotate(b.rot);
    rr(ctx, -26, -16, 52, 32, 4); fillStroke(ctx, b.col, 3.5);
    ctx.fillStyle = '#fff9ea'; ctx.fillRect(-22, -12, 44, 5);
    ctx.fillStyle = 'rgba(255,240,200,0.8)'; ctx.fillRect(-26, -3, 52, 3);
    if (b.state === 'fall') { // páginas que aletean
      const f = Math.sin(t * 30) * 8;
      ctx.beginPath(); ctx.moveTo(-20, -16); ctx.quadraticCurveTo(-6, -30 - f, 8, -16); ctx.closePath(); fillStroke(ctx, '#fff9ea', 2);
    }
    ctx.restore();
  }
  function drawDynamic(ctx, t, G, A) {
    // escalera rodante
    const L = A.oneway.find(P => P.kind === 'ladder');
    if (L) {
      const lx = L.x + L.w / 2;
      ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(lx - 40, 100); ctx.lineTo(lx - 64, 640); ctx.moveTo(lx + 40, 100); ctx.lineTo(lx + 16, 640); ctx.stroke();
      ctx.strokeStyle = '#b07a48'; ctx.lineWidth = 5; ctx.stroke();
      ctx.strokeStyle = '#b07a48'; ctx.lineWidth = 5;
      for (let y = 150; y < 620; y += 52) { const f = (y - 100) / 540; ctx.beginPath(); ctx.moveTo(lx - 40 - 24 * f, y); ctx.lineTo(lx + 40 - 24 * f, y); ctx.stroke(); }
      [lx - 40, lx + 40].forEach(x => { ctx.beginPath(); ctx.arc(x, 98, 8, 0, TAU); ctx.fillStyle = '#d4a53c'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke(); });
      rr(ctx, L.x, L.y, L.w, L.h, 5); fillStroke(ctx, '#c98b4a', 4);
    }
    // sombras de aviso y libros
    for (const b of A.books || []) {
      if (b.state === 'warn' || b.state === 'fall') {
        const k = b.state === 'warn' ? b.t / WARN : 1;
        ctx.fillStyle = `rgba(30,10,0,${0.15 + 0.25 * k})`;
        ctx.beginPath(); ctx.ellipse(b.x, b.gy + 2, 18 + 22 * k, 6 + 3 * k, 0, 0, TAU); ctx.fill();
      }
    }
  }
  function drawOver(ctx, t, G, A) { for (const b of A.books || []) drawBook(ctx, b, t); }
  function drawStatic(ctx, L) { drawDynamic(ctx, 0, null, { oneway: L.oneway, books: [] }); }

  defineArena({
    id: 'biblioteca', name: 'La Biblioteca', seed: 3131,
    desc: 'Estanterías altísimas, una escalera rodante y libros que caen del techo.',
    layout, paintBg, drawDynamic, drawOver, update, init, drawStatic,
  });
})();
