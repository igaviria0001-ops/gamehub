/* =========================================================================
   ARENA 7 · EL BUS ESCOLAR — un semáforo avisa en amarillo y viene el
   frenazo (todo se desliza hacia adelante) o el arrancón (hacia atrás).
   Las agarraderas se mecen y puedes pegarte a ellas.
   ========================================================================= */
(() => {
  const mirrorX = (x, w) => WORLD_W - x - w;
  // fases del ciclo (segundos)
  const SEQ = [['green', 5.5], ['yellow', 1.5], ['brake', 0.6], ['red', 2.2], ['go', 0.6]];
  const CYCLE = SEQ.reduce((a, s) => a + s[1], 0);
  const PUSH = 2100;

  function layout() {
    const solids = [], oneway = [], pegs = [];
    const S = (x, y, w, h, kind, extra = {}) => solids.push(Object.assign({ x, y, w, h, kind }, extra));
    const O = (x, y, w, kind, extra = {}) => oneway.push(Object.assign({ x, y, w, h: 16, kind }, extra));
    S(266, 640, 1388, 40, 'busFloor');
    S(290, 680, 1340, 520, 'busBody');
    [330].forEach(x => { // solo un par de asientos: el pasillo central queda libre
      O(x, 520, 120, 'seat'); O(mirrorX(x, 120), 520, 120, 'seat');
      S(x - 6, 600, 132, 40, 'seatBase'); S(mirrorX(x, 120) - 6, 600, 132, 40, 'seatBase');
    });
    O(380, 300, 360, 'rack'); O(mirrorX(380, 360), 300, 360, 'rack');
    [600, 1320].forEach(ax => pegs.push({ x: ax, y: 380, r: 15, kind: 'strap', ax, ay: 250, move(R, t, dt, G, A) { const s = A.bus ? A.bus.sway : 0; R.x = R.ax + s * 46; R.y = R.ay + 130 - Math.abs(s) * 8; } }));
    return {
      solids, oneway, pegs,
      hazardY: 832, deskLeft: 266, deskRight: 1654, deskY: 640, canRim: 826,
      spawns: [{ x: 760, y: 640 }, { x: 1160, y: 640 }],
      pelletSpots: [
        { x: 390, y: 490 }, { x: 640, y: 600 }, { x: 1280, y: 600 }, { x: 1530, y: 490 }, { x: 560, y: 270 },
        { x: 1360, y: 270 }, { x: 760, y: 608 }, { x: 1160, y: 608 }, { x: 960, y: 608 }, { x: 390, y: 570 },
        { x: 1530, y: 570 }, { x: 600, y: 450 }, { x: 1320, y: 450 }, { x: 820, y: 330 }, { x: 960, y: 470 },
      ],
      goldenSpots: [{ x: 960, y: 450 }, { x: 560, y: 262 }, { x: 1360, y: 262 }],
      respawnSpots: [{ x: 560, y: 300 }, { x: 1360, y: 300 }, { x: 960, y: 640 }],
      cans: [
        { x: 0, w: 276, color: '#7c8796', dark: '#56606e', light: '#b7c0cc', label: 'CANECA' },
        { x: WORLD_W - 276, w: 276, color: '#7c8796', dark: '#56606e', light: '#b7c0cc', label: 'CANECA' },
      ],
    };
  }

  /* ---------------- lógica del bus ---------------- */
  function phaseAt(t) {
    let c = t % CYCLE;
    for (const [name, d] of SEQ) { if (c < d) return { name, k: c / d }; c -= d; }
    return { name: 'green', k: 0 };
  }
  function init(A) {
    A.busDir = A.busDir === 1 ? -1 : 1; // cada ronda el bus va en sentido contrario
    A.bus = { phase: 'green', k: 0, speed: 1, sway: 0, swayV: 0, scroll: 0 };
    A.pushWarn = 0;
  }
  function update(dt, G, A) {
    const prev = A.bus.phase;
    const ph = phaseAt(A.t);
    A.bus.phase = ph.name; A.bus.k = ph.k;
    const d = A.busDir || 1;
    A.mods.push = ph.name === 'brake' ? PUSH * d : ph.name === 'go' ? -PUSH * d : 0;
    // aviso de hacia dónde va a empujar (para el semáforo y para el bot)
    A.pushWarn = ph.name === 'yellow' ? d : ph.name === 'red' && ph.k > 0.55 ? -d : 0;
    const targetSpeed = ph.name === 'red' || ph.name === 'brake' ? 0 : 1;
    A.bus.speed = approach(A.bus.speed, targetSpeed, dt * (ph.name === 'brake' ? 1.8 : 0.9));
    A.bus.scroll += A.bus.speed * 520 * dt * (A.busDir || 1);
    // las agarraderas se mecen con el empujón
    A.bus.swayV += ((A.mods.push / PUSH) * 1.2 - A.bus.sway * 9 - A.bus.swayV * 2.2) * dt * 6;
    A.bus.sway += A.bus.swayV * dt;
    if (G && !G.quiet && prev !== ph.name) {
      if (ph.name === 'yellow') { FX.callout('¡SEMÁFORO EN AMARILLO!', 960, 400, '#ffd84d', 40, 1.4); Sound.play('beep', false); }
      if (ph.name === 'brake') { FX.callout('¡FRENAZO!', 960, 400, '#ff6b5a', 60, 1.1); Sound.play('whoosh'); FX.shake(0.5); }
      if (ph.name === 'go') { FX.callout('¡ARRANCA!', 960, 400, '#9dffb0', 56, 1.1); Sound.play('whoosh'); FX.shake(0.4); }
    }
  }

  /* ---------------- pintura fija ---------------- */
  const WIN = [[330, 150], [560, 150], [790, 150], [1020, 150], [1250, 150], [1480, 150]];
  const WW = 190, WH = 150;
  function paintOutside(ctx) {
    // acera y calle (afuera, a los lados del bus)
    const g = ctx.createLinearGradient(0, 0, 0, 1080); g.addColorStop(0, '#8fd3f4'); g.addColorStop(0.7, '#d8f1fb'); g.addColorStop(1, '#d8f1fb');
    ctx.fillStyle = g; ctx.fillRect(0, 0, WORLD_W, 1080);
    ctx.fillStyle = '#9aa3ad'; ctx.fillRect(0, 980, WORLD_W, 100);
    ctx.fillStyle = '#c7ced6'; ctx.fillRect(0, 960, WORLD_W, 24);
    ctx.fillStyle = '#86c97a'; ctx.beginPath(); ctx.ellipse(120, 640, 220, 140, 0, Math.PI, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(1800, 640, 220, 140, 0, Math.PI, TAU); ctx.fill();
  }
  function paintBus(ctx, rng, L) {
    // carrocería amarilla
    rr(ctx, 230, 70, 1460, 860, 60); fillStroke(ctx, '#ffc93c', 5);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; rr(ctx, 260, 84, 1400, 20, 10); ctx.fill();
    // interior
    rr(ctx, 266, 110, 1388, 540, 26);
    const ig = ctx.createLinearGradient(0, 110, 0, 650); ig.addColorStop(0, '#f6efe0'); ig.addColorStop(1, '#e5d8bd');
    ctx.fillStyle = ig; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke();
    // ventanas (el paisaje se dibuja encima en cada cuadro)
    WIN.forEach(([x, y]) => { rr(ctx, x - 10, y - 10, WW + 20, WH + 20, 18); fillStroke(ctx, '#d9d2c2', 3); rr(ctx, x, y, WW, WH, 12); ctx.fillStyle = '#9fd8f5'; ctx.fill(); });
    // puertas abiertas en los extremos
    [[230, 1], [1690, -1]].forEach(([x, d]) => {
      ctx.fillStyle = '#3a3f4a'; ctx.fillRect(d > 0 ? x : x - 36, 140, 36, 500);
      for (let k = 0; k < 2; k++) { rr(ctx, d > 0 ? x + 4 + k * 14 : x - 32 + k * 14, 150, 10, 480, 4); fillStroke(ctx, '#ffc93c', 2.5); }
    });
    // pasamanos del techo
    ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(330, 248); ctx.lineTo(1590, 248); ctx.stroke();
    ctx.strokeStyle = '#c7ced6'; ctx.lineWidth = 5; ctx.stroke();
    // asientos (detrás)
    L.oneway.filter(P => P.kind === 'seat').forEach(P => {
      rr(ctx, P.x + 8, P.y, P.w - 16, 120, 16); fillStroke(ctx, '#3f6fc4', 4);
      rr(ctx, P.x + 20, P.y + 12, P.w - 40, 60, 10); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fill();
      rr(ctx, P.x - 6, 600, P.w + 12, 40, 10); fillStroke(ctx, '#4b7fd6', 4);
      rr(ctx, P.x, P.y - 6, P.w, P.h + 6, 8); fillStroke(ctx, '#5a8ee6', 4);
    });
    // portaequipajes
    L.oneway.filter(P => P.kind === 'rack').forEach(P => {
      ctx.strokeStyle = '#8d99a6'; ctx.lineWidth = 3;
      for (let x = P.x + 20; x < P.x + P.w; x += 40) { ctx.beginPath(); ctx.moveTo(x, P.y); ctx.lineTo(x, 110); ctx.stroke(); }
      // mochilas
      [[P.x + 60, '#ff7b93'], [P.x + P.w - 70, '#7ec8ff']].forEach(([mx, c]) => { rr(ctx, mx - 28, P.y - 46, 56, 46, 12); fillStroke(ctx, c, 3); rr(ctx, mx - 16, P.y - 30, 32, 16, 5); ctx.lineWidth = 2; ctx.stroke(); });
      rr(ctx, P.x, P.y, P.w, P.h, 6); fillStroke(ctx, '#c7ced6', 4);
    });
    // cartel del chofer
    rr(ctx, 1500, 360, 130, 70, 10); fillStroke(ctx, '#fff6e6', 3.5);
    ctx.fillStyle = INK; ctx.font = font(16, 700); ctx.textAlign = 'center'; ctx.fillText('NO SACAR', 1565, 390); ctx.fillText('LA CABEZA', 1565, 412);
    // piso del pasillo
    const F = L.solids[0], B = L.solids[1];
    rr(ctx, F.x, F.y, F.w, F.h, 8); fillStroke(ctx, '#5b6470', 4);
    for (let x = F.x + 14; x < F.x + F.w; x += 22) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x, F.y + 6, 10, F.h - 12); }
    // lado de afuera bajo el piso
    rr(ctx, B.x - 24, B.y, B.w + 48, 230, 20); fillStroke(ctx, '#ffc93c', 5);
    ctx.fillStyle = '#2a2f3d'; ctx.fillRect(B.x - 24, B.y + 40, B.w + 48, 24);
    ctx.fillStyle = INK; ctx.font = font(64, 700); ctx.textAlign = 'center'; ctx.fillText('ESCOLAR', 960, B.y + 150);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(B.x, B.y + 76, B.w, 6);
  }

  function paintBg(b, rng, L) {
    paintOutside(b);
    L.cans.forEach(C => paintCanBack(b, C, rng, L.canRim));
    paintBus(b, rng, L);
  }

  /* ---------------- partes animadas ---------------- */
  function drawScenery(ctx, A, t) {
    const s = A.bus ? A.bus.scroll : 0;
    WIN.forEach(([x, y]) => {
      ctx.save(); rr(ctx, x, y, WW, WH, 12); ctx.clip();
      const g = ctx.createLinearGradient(0, y, 0, y + WH); g.addColorStop(0, '#7fcdf3'); g.addColorStop(1, '#d4f0fb');
      ctx.fillStyle = g; ctx.fillRect(x, y, WW, WH);
      // montañas lejanas (lentas)
      ctx.fillStyle = '#9fd39a';
      for (let k = -1; k < 3; k++) { const mx = x + ((k * 160 - s * 0.15) % 320 + 320) % 320 - 60; ctx.beginPath(); ctx.moveTo(mx - 90, y + WH); ctx.quadraticCurveTo(mx, y + 40, mx + 90, y + WH); ctx.fill(); }
      // casas y árboles (rápidos)
      for (let k = -1; k < 4; k++) {
        const hx = x + ((k * 120 - s * 0.6 + x * 0.7) % 480 + 480) % 480 - 100;
        if (k % 2) { rr(ctx, hx, y + 72, 64, 60, 4); fillStroke(ctx, ['#ff9a8a', '#ffd166', '#a6f6e3'][(k + 3) % 3], 2.5); ctx.beginPath(); ctx.moveTo(hx - 6, y + 74); ctx.lineTo(hx + 32, y + 48); ctx.lineTo(hx + 70, y + 74); ctx.closePath(); fillStroke(ctx, '#e5533d', 2.5); }
        else { ctx.fillStyle = '#4f9e4a'; ctx.beginPath(); ctx.arc(hx + 30, y + 84, 26, 0, TAU); ctx.fill(); ctx.fillStyle = '#7a4b2a'; ctx.fillRect(hx + 26, y + 100, 8, 40); }
      }
      // postes (muy rápidos)
      const px = x + ((-s * 1.4 + x) % 300 + 300) % 300 - 40;
      ctx.fillStyle = '#6b6f78'; ctx.fillRect(px, y, 8, WH);
      ctx.restore();
      ctx.lineWidth = 4; ctx.strokeStyle = INK; rr(ctx, x, y, WW, WH, 12); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(x + 20, y + 4); ctx.lineTo(x + 60, y + 4); ctx.lineTo(x + 26, y + WH - 4); ctx.lineTo(x + 4, y + WH - 4); ctx.closePath(); ctx.fill();
    });
  }
  function drawLight(ctx, A, t) {
    const ph = A.bus ? A.bus.phase : 'green';
    const x = 960, y = 258;
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 60, 112); ctx.lineTo(x - 60, y); ctx.moveTo(x + 60, 112); ctx.lineTo(x + 60, y); ctx.stroke();
    rr(ctx, x - 96, y, 192, 66, 14); fillStroke(ctx, '#2a2f3d', 4);
    const blink = Math.floor(t * 6) % 2 === 0;
    [['red', '#ff4d3d', -60], ['yellow', '#ffd84d', 0], ['green', '#4cd66a', 60]].forEach(([n, c, dx]) => {
      const on = (n === 'red' && (ph === 'red' || ph === 'brake')) || (n === 'yellow' && ph === 'yellow' && blink) || (n === 'green' && (ph === 'green' || ph === 'go'));
      ctx.beginPath(); ctx.arc(x + dx, y + 33, 22, 0, TAU); ctx.fillStyle = on ? c : 'rgba(255,255,255,0.08)'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = '#11141c'; ctx.stroke();
      if (on) { ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x + dx, y + 33, 4, x + dx, y + 33, 60); g.addColorStop(0, rgba(c, 0.5)); g.addColorStop(1, rgba(c, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + dx, y + 33, 60, 0, TAU); ctx.fill(); ctx.restore(); }
    });
    // flecha que indica hacia dónde va a empujar
    const w = A.pushWarn || (A.mods && A.mods.push ? sign(A.mods.push) : 0);
    if (w) {
      ctx.fillStyle = Math.floor(t * 6) % 2 ? '#ffd84d' : '#ff9a3c'; ctx.strokeStyle = INK; ctx.lineWidth = 3;
      const ax = x + w * 125;
      ctx.beginPath(); ctx.moveTo(ax - w * 14, y + 14); ctx.lineTo(ax + w * 18, y + 33); ctx.lineTo(ax - w * 14, y + 52); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax - w * 34, y + 26); ctx.lineTo(ax - w * 14, y + 26); ctx.lineTo(ax - w * 14, y + 40); ctx.lineTo(ax - w * 34, y + 40); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  function drawStraps(ctx, A) {
    for (const R of A.pegs) {
      if (R.kind !== 'strap') continue;
      ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(R.ax, R.ay); ctx.lineTo(R.x, R.y - R.r); ctx.stroke();
      ctx.strokeStyle = '#e8e2d4'; ctx.lineWidth = 5; ctx.stroke();
      ctx.beginPath(); ctx.arc(R.x, R.y, R.r, 0, TAU); ctx.lineWidth = 10; ctx.strokeStyle = INK; ctx.stroke();
      ctx.lineWidth = 6; ctx.strokeStyle = '#f2b631'; ctx.stroke();
    }
  }
  function drawWheels(ctx, A, t) {
    const s = A.bus ? A.bus.scroll : 0;
    [480, 1440].forEach(x => {
      ctx.save(); ctx.translate(x, 930);
      ctx.beginPath(); ctx.arc(0, 0, 70, 0, TAU); fillStroke(ctx, '#2a2f3d', 5);
      ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); fillStroke(ctx, '#c7ced6', 4);
      ctx.rotate(s / 70);
      for (let k = 0; k < 5; k++) { ctx.rotate(TAU / 5); ctx.fillStyle = '#6b6f78'; ctx.fillRect(-4, -30, 8, 18); }
      ctx.restore();
    });
  }
  function drawDynamic(ctx, t, G, A) { drawScenery(ctx, A, t); drawLight(ctx, A, t); drawStraps(ctx, A); drawWheels(ctx, A, t); }
  function drawStatic(ctx, L) { drawDynamic(ctx, 0, null, { pegs: L.pegs, bus: { phase: 'green', scroll: 120, sway: 0 }, mods: {}, pushWarn: 0 }); }

  defineArena({
    id: 'bus', name: 'El Bus Escolar', seed: 6262,
    desc: 'El semáforo avisa en amarillo: luego viene el frenazo o el arrancón.',
    layout, paintBg, drawDynamic, update, init, drawStatic,
  });
})();
