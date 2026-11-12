/* =========================================================================
   MAPA DE LA VUELTA AL MUNDO — continentes de pocos lados sobre un océano con
   meridianos, la ruta punteada que avanza (dorada lo ya ganado), y una
   insignia por parada con sus estrellas; las paradas cerradas llevan candado.
   Al tocar una parada, el panel muestra sus retos.
   ========================================================================= */
const WorldMap = (() => {
  // contornos aproximados (longitud, latitud)
  const LAND = [
    [[-168, 66], [-162, 70], [-150, 71], [-140, 70], [-128, 70], [-115, 68], [-100, 68], [-95, 72], [-85, 70], [-80, 64], [-90, 58], [-82, 52], [-78, 58], [-70, 60], [-64, 60], [-60, 55], [-56, 52], [-66, 45], [-70, 42], [-75, 38], [-76, 35], [-81, 31], [-80, 25], [-82, 27], [-84, 30], [-90, 30], [-97, 27], [-97, 22], [-92, 18], [-87, 21], [-88, 16], [-84, 11], [-79, 9], [-80, 8], [-85, 10], [-92, 14], [-100, 17], [-106, 22], [-110, 27], [-112, 31], [-115, 30], [-117, 33], [-121, 35], [-124, 40], [-124, 46], [-128, 51], [-135, 57], [-142, 60], [-152, 59], [-158, 57], [-165, 60]],
    [[-80, 9], [-77, 8], [-72, 12], [-64, 11], [-60, 8], [-52, 5], [-50, 0], [-44, -2], [-35, -6], [-37, -12], [-39, -18], [-41, -22], [-48, -26], [-53, -34], [-58, -38], [-62, -39], [-65, -42], [-66, -48], [-69, -52], [-72, -54], [-74, -50], [-74, -44], [-73, -38], [-71, -30], [-70, -20], [-75, -15], [-81, -6], [-80, -2], [-78, 2]],
    [[-50, 60], [-42, 60], [-36, 65], [-22, 70], [-20, 76], [-18, 81], [-30, 83], [-50, 82], [-60, 80], [-70, 77], [-58, 75], [-54, 70], [-52, 66]],
    [[-9, 43], [-9, 37], [-6, 36], [-1, 37], [0, 39], [3, 42], [6, 43], [9, 44], [12, 42], [16, 38], [18, 40], [13, 45], [15, 45], [19, 42], [21, 38], [23, 36], [24, 38], [23, 40], [26, 40], [28, 41], [30, 41], [36, 41], [41, 41], [40, 37], [36, 36], [35, 32], [34, 28], [39, 22], [43, 13], [52, 16], [57, 21], [58, 24], [52, 24], [50, 28], [48, 30], [52, 28], [56, 27], [60, 25], [66, 25], [68, 23], [72, 21], [73, 16], [77, 8], [80, 10], [80, 15], [86, 20], [90, 22], [92, 21], [94, 17], [98, 16], [98, 9], [101, 4], [104, 1], [103, 6], [100, 13], [104, 10], [107, 11], [109, 15], [106, 20], [110, 21], [117, 23], [121, 28], [122, 31], [120, 36], [122, 40], [119, 39], [121, 41], [127, 38], [129, 35], [129, 40], [132, 43], [141, 48], [141, 53], [136, 55], [143, 59], [155, 59], [163, 62], [171, 64], [180, 66], [180, 71], [160, 70], [150, 72], [140, 73], [130, 72], [115, 74], [105, 77], [95, 76], [80, 73], [70, 73], [66, 69], [58, 70], [50, 68], [44, 68], [40, 66], [34, 69], [28, 71], [20, 70], [14, 66], [10, 63], [5, 62], [6, 58], [8, 57], [10, 59], [12, 56], [10, 54], [8, 54], [5, 52], [2, 51], [-2, 48], [-5, 48], [-1, 46], [-2, 44]],
    [[-5, 50], [1, 51], [2, 53], [0, 54], [-2, 56], [-3, 58], [-6, 58], [-5, 55], [-3, 54], [-5, 52]], [[-10, 52], [-6, 52], [-6, 55], [-8, 55], [-10, 54]],
    [[-24, 64], [-22, 63.5], [-18, 63.5], [-14, 64.5], [-14, 66], [-17, 66.3], [-22, 66.4], [-24, 65.5]],
    [[-17, 21], [-16, 13], [-12, 8], [-8, 4], [-2, 5], [5, 6], [9, 4], [9, -1], [12, -6], [13, -12], [12, -17], [15, -27], [18, -34], [20, -35], [26, -34], [32, -28], [35, -22], [35, -17], [40, -15], [40, -10], [39, -5], [42, 0], [48, 5], [51, 11], [44, 11], [43, 13], [39, 18], [37, 22], [34, 27], [32, 31], [25, 32], [20, 31], [15, 32], [11, 33], [10, 37], [5, 37], [-1, 35], [-6, 36], [-10, 31], [-13, 27], [-16, 24]],
    [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17]],
    [[130, 31], [132, 33], [135, 34], [140, 35], [141, 38], [142, 41], [141, 43], [145, 44], [142, 46], [139, 40], [136, 37], [132, 35]],
    [[114, -22], [114, -34], [118, -35], [124, -33], [131, -31], [135, -35], [138, -35], [140, -38], [146, -39], [150, -37], [153, -31], [153, -25], [146, -19], [142, -11], [136, -12], [136, -15], [131, -12], [126, -14], [122, -18]],
    [[95, 5], [98, 4], [104, -2], [106, -6], [102, -4], [97, 2]], [[109, 1], [111, -3], [116, -4], [119, 1], [117, 7], [113, 4]], [[131, -1], [138, -2], [146, -6], [150, -10], [142, -9], [135, -4]],
    [[166, -46], [172, -44], [174, -41], [178, -38], [175, -36], [172, -34], [174, -40], [170, -44]], [[-85, 22], [-80, 23], [-75, 20], [-78, 20], [-82, 22]],
  ];
  const COL = [[-77.9, 7.2], [-77.3, 8.6], [-76, 9.3], [-75.5, 10.6], [-74.2, 11.3], [-72, 11.8], [-71.3, 12.3], [-71, 11], [-72.3, 8.2], [-72, 7], [-70, 6.9], [-67.8, 6.2], [-67.4, 3.8], [-67.8, 2], [-69.8, 1.1], [-69.9, -0.4], [-69.4, -1.2], [-70, -4.2], [-72, -2.4], [-73.6, -1.2], [-75.3, -0.1], [-77.5, 0.8], [-79, 1.6], [-77.4, 4], [-77.4, 6.6]];
  const LON0 = -132, LON1 = 158, LAT0 = -46, LAT1 = 74;
  let box = null, pins = [];
  function layout(W, H) { const pad = 14, aw = W - pad * 2, ah = H - pad * 2, k = Math.min(aw / (LON1 - LON0), ah / (LAT1 - LAT0)), w = (LON1 - LON0) * k, h = (LAT1 - LAT0) * k; box = { x: (W - w) / 2, y: (H - h) / 2, w, h, k }; }
  const P = (lon, lat) => [box.x + (lon - LON0) * box.k, box.y + (LAT1 - lat) * box.k];
  function poly(x, pts) { x.beginPath(); pts.forEach(([a, b], i) => { const [px, py] = P(a, b); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.closePath(); }
  function star(x, cx, cy, r, on) { x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); x.fillStyle = on ? '#ffd23d' : 'rgba(255,255,255,0.18)'; x.fill(); if (on) { x.strokeStyle = '#7a4a00'; x.lineWidth = 1; x.stroke(); } }
  function draw(cv, sel, t) {
    const dpr = Math.min(2, devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H); layout(W, H);
    const sc = clamp(box.w / 900, 0.8, 1.5);
    // océano
    const og = x.createRadialGradient(box.x + box.w * 0.45, box.y + box.h * 0.45, 10, box.x + box.w * 0.5, box.y + box.h * 0.5, box.w * 0.7); og.addColorStop(0, '#0f3a5e'); og.addColorStop(1, '#061a30');
    x.fillStyle = og; x.beginPath(); x.roundRect ? x.roundRect(box.x, box.y, box.w, box.h, 14 * sc) : x.rect(box.x, box.y, box.w, box.h); x.fill(); x.save(); x.clip();
    x.strokeStyle = 'rgba(140,220,255,0.08)'; x.lineWidth = 1; for (let lo = -120; lo <= 150; lo += 30) { const [a] = P(lo, 0); x.beginPath(); x.moveTo(a, box.y); x.lineTo(a, box.y + box.h); x.stroke(); } for (let la = -30; la <= 60; la += 30) { const [, b] = P(0, la); x.beginPath(); x.moveTo(box.x, b); x.lineTo(box.x + box.w, b); x.stroke(); }
    { const [, eq] = P(0, 0); x.strokeStyle = 'rgba(140,220,255,0.16)'; x.setLineDash([6, 6]); x.beginPath(); x.moveTo(box.x, eq); x.lineTo(box.x + box.w, eq); x.stroke(); x.setLineDash([]); }
    // olas suaves
    x.strokeStyle = 'rgba(160,230,255,0.07)'; for (let i = 0; i < 40; i++) { const px = box.x + ((i * 97.3) % box.w), py = box.y + ((i * 53.7) % box.h); x.beginPath(); x.arc(px, py + Math.sin(t + i) * 1.5, 6 * sc, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); }
    // tierra
    // sombra falsa (desplazada) en vez de shadowBlur: con recorte y lienzo por GPU, el desenfoque borraba partes del mapa
    x.save(); x.translate(2 * sc, 4 * sc); x.fillStyle = 'rgba(0,8,20,0.45)'; for (const L of LAND) { poly(x, L); x.fill(); } x.restore();
    { const g = x.createLinearGradient(0, box.y, 0, box.y + box.h); g.addColorStop(0, '#3f8a62'); g.addColorStop(0.5, '#2d7350'); g.addColorStop(1, '#245c42'); x.fillStyle = g; for (const L of LAND) { poly(x, L); x.fill(); } }
    x.strokeStyle = 'rgba(160,255,210,0.35)'; x.lineWidth = 1.2; for (const L of LAND) { poly(x, L); x.stroke(); }
    poly(x, COL); x.fillStyle = 'rgba(255,214,70,0.35)'; x.fill(); x.strokeStyle = 'rgba(255,214,70,0.8)'; x.stroke();
    // ruta: de parada en parada y de vuelta a casa
    pins = STOPS.map((S, i) => { const [px, py] = P(S.px, S.py), [tx, ty] = P(S.lon, S.lat); return { i, S, x: px, y: py, tx, ty, open: World.stopOpen(i) }; });
    const route = pins.concat([pins[0]]), done = k => { const [n] = World.stopStars(k); return n > 0; };
    for (let k = 0; k < route.length - 1; k++) { const a = route[k], b = route[k + 1], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, bend = Math.min(80 * sc, d * 0.25), cx = mx - dy / d * bend, cy = my + dx / d * bend;
      const ok = k < STOPS.length - 1 ? done(k) && b.open : World.open(CAMPAIGN.length - 1);
      x.lineWidth = (ok ? 3 : 2) * sc; x.strokeStyle = ok ? 'rgba(255,210,61,0.95)' : 'rgba(255,255,255,0.35)'; x.setLineDash([8 * sc, 7 * sc]); x.lineDashOffset = -t * 18 * sc; x.beginPath();
      // del Gran Cañón a Tokio se cruza el Pacífico: sale por el borde izquierdo y entra por el derecho
      if (b.x - a.x > box.w * 0.55 && a.x < b.x) { const ym = (a.y + b.y) / 2 + 10 * sc; x.moveTo(a.x, a.y); x.quadraticCurveTo((a.x + box.x) / 2, ym + 18 * sc, box.x - 4, ym); x.moveTo(box.x + box.w + 4, ym); x.quadraticCurveTo((b.x + box.x + box.w) / 2, ym + 18 * sc, b.x, b.y); }
      else { x.moveTo(a.x, a.y); x.quadraticCurveTo(cx, cy, b.x, b.y); } x.stroke(); }
    x.setLineDash([]);
    x.restore();
    // insignias de las paradas
    const r0 = 13 * sc;
    for (const p of pins) {
      const [n, m] = World.stopStars(p.i), full = n === m, isSel = p.i === sel;
      if (Math.hypot(p.tx - p.x, p.ty - p.y) > r0) { x.strokeStyle = 'rgba(255,255,255,0.5)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(p.tx, p.ty); x.stroke(); x.fillStyle = '#fff'; x.beginPath(); x.arc(p.tx, p.ty, 2.4 * sc, 0, TAU); x.fill(); }
      if (isSel) { x.strokeStyle = 'rgba(138,255,200,' + (0.5 + 0.4 * Math.sin(t * 5)) + ')'; x.lineWidth = 3 * sc; x.beginPath(); x.arc(p.x, p.y, r0 + 5 * sc + Math.sin(t * 5) * 2 * sc, 0, TAU); x.stroke(); }
      const g = x.createRadialGradient(p.x - r0 * 0.3, p.y - r0 * 0.4, 1, p.x, p.y, r0); if (!p.open) { g.addColorStop(0, '#6a7180'); g.addColorStop(1, '#2a2f3a'); } else if (full) { g.addColorStop(0, '#fff2a0'); g.addColorStop(1, '#c88a10'); } else { g.addColorStop(0, '#8affc8'); g.addColorStop(1, '#0d8a52'); }
      x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y, r0, 0, TAU); x.fill(); x.lineWidth = 2 * sc; x.strokeStyle = '#fff'; x.stroke();
      x.font = `900 ${Math.round(11 * sc)}px "Nunito", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = p.open ? '#04130c' : '#dfe6f0';
      const boss = CAMPAIGN.some((C, i) => C.stop === p.S.id && C.kind === 'boss' && World.open(i)); x.fillText(p.open ? (boss ? '☠' : String(p.i + 1)) : '🔒', p.x, p.y + 1);
      // nombre y estrellas: abajo, o al lado/arriba donde las paradas están juntas
      const side = p.S.side || 'b', label = p.S.lab || p.S.name, fs = Math.round(11.5 * sc); x.font = `900 ${fs}px "Nunito", sans-serif`; const tw = x.measureText(label).width, cols = Math.min(m, 9), sw = 8 * sc;
      let lx = p.x, ly = p.y + r0 + 11 * sc; if (side === 't') ly = p.y - r0 - 20 * sc; else if (side === 'r') { lx = p.x + r0 + 6 * sc + Math.max(tw, cols * sw) / 2; ly = p.y - 4 * sc; } else if (side === 'l') { lx = p.x - r0 - 6 * sc - Math.max(tw, cols * sw) / 2; ly = p.y - 4 * sc; }
      x.lineWidth = 3.5 * sc; x.strokeStyle = 'rgba(2,8,18,0.85)'; x.strokeText(label, lx, ly); x.fillStyle = isSel ? '#8affc8' : '#ffffff'; x.fillText(label, lx, ly);
      if (p.open) for (let k = 0; k < cols; k++) star(x, lx - (cols - 1) * sw / 2 + k * sw, ly + 11 * sc, 3.6 * sc, k < n);
    }
  }
  function hit(cv, px, py) { const r = Math.max(26, 22 * clamp(box ? box.w / 900 : 1, 0.8, 1.5)); let best = -1, bd = r; for (const p of pins) { const d = Math.hypot(p.x - px, p.y - py); if (d < bd) { bd = d; best = p.i; } } return best; }
  return { draw, hit };
})();
