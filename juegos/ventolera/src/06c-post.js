/* =========================================================================
   ACABADO PRO (3.0) — lo que hace que la imagen se vea «de juego de verdad»:
   resplandor (bloom) de todo lo que brilla (neón, ventanas, turbinas,
   explosiones), corrección de color por escenario, viñeta, motas de luz
   desenfocadas en primer plano y una capa de primer plano con paralaje
   (siluetas oscuras que pasan delante, para dar profundidad).
   Con calidad «ligera» se omite lo caro.
   ========================================================================= */
const Post = (() => {
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = 2; return c; };
  const b1 = mk(), b2 = mk(), b3 = mk();
  const fit = (c, w, h) => { w = Math.max(2, w | 0); h = Math.max(2, h | 0); if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } return c.getContext('2d'); };
  // por escenario: color arriba/abajo (luz suave), fuerza del resplandor, color de las motas y del primer plano
  const LOOK = {
    cocora:    { grade: ['rgba(255,150,190,0.16)', 'rgba(30,110,110,0.28)'], bloom: 0.3, mote: '255,236,200', fore: '#0e1d1f', foreKind: 'palms', vig: 0.42 },
    medellin:  { grade: ['rgba(40,70,200,0.30)', 'rgba(255,130,40,0.20)'], bloom: 1.0, mote: '255,200,150', fore: '#05070f', foreKind: 'roofs', vig: 0.5 },
    bogota:    { grade: ['rgba(40,90,140,0.30)', 'rgba(20,40,60,0.25)'], bloom: 0.85, mote: '190,215,255', fore: '#04060a', foreKind: 'roofs', vig: 0.55 },
    cartagena: { grade: ['rgba(150,60,200,0.22)', 'rgba(255,150,50,0.26)'], bloom: 0.45, mote: '255,214,160', fore: '#1a0e14', foreKind: 'palms', vig: 0.45 },
    capadocia: { grade: ['rgba(110,80,200,0.18)', 'rgba(255,140,60,0.2)'], bloom: 0.28, mote: '255,236,210', fore: '#2a1418', foreKind: 'palms', vig: 0.4 },
  };
  /* ---------- resplandor: umbral suave por auto-multiplicación y dos niveles de desenfoque ---------- */
  function bloom(ctx, k) {
    if (LOWFX || k <= 0) return; const src = ctx.canvas, w = src.width, h = src.height;
    const x1 = fit(b1, w / 4, h / 4), x2 = fit(b2, w / 8, h / 8), x3 = fit(b3, w / 16, h / 16);
    for (const q of [x1, x2, x3]) { q.imageSmoothingEnabled = true; q.imageSmoothingQuality = 'high'; q.setTransform(1, 0, 0, 1, 0, 0); }
    x1.globalCompositeOperation = 'copy'; x1.drawImage(src, 0, 0, b1.width, b1.height);
    for (let it = 0; it < 2; it++) { x2.globalCompositeOperation = 'copy'; x2.drawImage(b1, 0, 0, b2.width, b2.height); x1.globalCompositeOperation = 'multiply'; x1.drawImage(b2, 0, 0, b1.width, b1.height); }
    x2.globalCompositeOperation = 'copy'; x2.drawImage(b1, 0, 0, b2.width, b2.height);
    x3.globalCompositeOperation = 'copy'; x3.drawImage(b2, 0, 0, b3.width, b3.height);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5 * k; ctx.drawImage(b2, 0, 0, w, h); ctx.globalAlpha = 0.55 * k; ctx.drawImage(b3, 0, 0, w, h); ctx.restore();
  }
  function grade(ctx, L, sw, sh) {
    const g = ctx.createLinearGradient(0, 0, 0, sh); g.addColorStop(0, L.grade[0]); g.addColorStop(1, L.grade[1]);
    ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = g; ctx.fillRect(0, 0, sw, sh); ctx.restore();
  }
  let vig = null;
  function vignette(ctx, L, sw, sh) {
    if (!vig || vig.w !== sw || vig.h !== sh || vig.k !== L.vig) { vig = document.createElement('canvas'); vig.w = sw; vig.h = sh; vig.k = L.vig; vig.width = 320; vig.height = Math.max(2, Math.round(320 * sh / sw)); const vx = vig.getContext('2d'), g = vx.createRadialGradient(160, vig.height / 2, vig.height * 0.42, 160, vig.height / 2, 210); g.addColorStop(0, 'rgba(4,3,14,0)'); g.addColorStop(1, `rgba(4,3,14,${L.vig})`); vx.fillStyle = g; vx.fillRect(0, 0, 320, vig.height); }
    ctx.drawImage(vig, 0, 0, sw, sh);
  }
  /* ---------- motas de luz desenfocadas que pasan delante (paralaje mayor que el juego) ---------- */
  const motes = {};
  function moteSpr(rgb) { if (motes[rgb]) return motes[rgb]; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, `rgba(${rgb},0.25)`); g.addColorStop(0.62, `rgba(${rgb},0.45)`); g.addColorStop(0.82, `rgba(${rgb},0.75)`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return (motes[rgb] = c); }
  function bokeh(ctx, G, cam, sw, sh, L) {
    if (LOWFX) return; const t = G.time, spr = moteSpr(L.mote), z = cam.z, u = Math.max(0.6, Math.min(sw / 1280, sh / 720));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 16; k++) {
      const par = 1.3 + hash1(k * 4.1) * 0.6, r = (6 + hash1(k * 7.3) * 22) * u, spX = sw + 260, spY = sh + 260;
      const X = (((hash1(k * 2.9) * 4000 - cam.x * z * par + t * (8 + hash1(k * 3.3) * 18)) % spX) + spX) % spX - 130, Y = (((hash1(k * 5.7) * 3000 - cam.y * z * par - t * (3 + hash1(k * 9.1) * 7)) % spY) + spY) % spY - 130;
      ctx.globalAlpha = (0.05 + hash1(k * 1.7) * 0.09) * (0.6 + 0.4 * Math.sin(t * (0.5 + hash1(k)) + k));
      ctx.drawImage(spr, X - r, Y - r, r * 2, r * 2);
    }
    ctx.restore();
  }
  let palm = null, DPR0 = 1;
  function palmSprite(col, u, dpr) {
    const key = col + '|' + u.toFixed(2) + '|' + dpr; if (palm && palm.key === key) return palm;
    const W = 380 * u, H = 420 * u, ox = 30 * u, oy = 340 * u; palm = document.createElement('canvas'); palm.key = key; palm.width = Math.ceil(W * dpr); palm.height = Math.ceil(H * dpr); palm.w = W; palm.h = H; palm.ox = ox; palm.oy = oy;
    const x = palm.getContext('2d'); x.scale(dpr, dpr); x.translate(ox, oy); x.strokeStyle = col; x.lineCap = 'round';
    // lado izquierdo (el derecho es su espejo)
    for (let f = 0; f < 7; f++) {
      const a = -0.95 - (f - 3) * 0.2, len = (220 + (f % 3) * 60) * u;
      const ex = Math.cos(a) * len, ey = Math.sin(a) * len * 0.75 + 60 * u, qx = Math.cos(a) * len * 0.5, qy = Math.sin(a) * len * 0.9 - 10 * u;
      x.lineWidth = 6 * u; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(qx, qy, ex, ey); x.stroke();
      x.lineWidth = 3.4 * u; x.beginPath();
      for (let q = 0.12; q < 0.98; q += 0.06) { const p = 1 - q, px = 2 * p * q * qx + q * q * ex, py = 2 * p * q * qy + q * q * ey; const ln = 34 * u * (1 - q * 0.55); x.moveTo(px, py); x.lineTo(px + 4 * u, py + ln); }
      x.stroke();
    }
    return palm;
  }
  /* ---------- primer plano: siluetas muy cerca de la cámara (abajo), se mueven más rápido que el juego ---------- */
  function foreground(ctx, G, cam, sw, sh, L) {
    if (G.state === 'menu') return; const z = cam.z, par = 1.55, u = Math.max(0.6, Math.min(sw / 1280, sh / 720)), t = G.time;
    // qué tan cerca del suelo mira la cámara: si va muy alto, el primer plano se hunde (no tapa nada)
    const W = G.world, gy = W.groundY(cam.x), bottomWorld = cam.y + sh / 2 / z, sink = clamp((gy - bottomWorld) * z * 0.35, 0, sh * 0.5);
    const base = sh + sink * 0.9 - 6 * u; if (base > sh + 120 * u) return;
    ctx.save(); ctx.fillStyle = L.fore;
    if (L.foreKind === 'roofs') {
      const span = 220 * u, off = ((cam.x * z * par) % span + span) % span;
      ctx.beginPath(); ctx.moveTo(-10, sh + 10);
      for (let i = -1; i <= Math.ceil(sw / span) + 1; i++) {
        const id = Math.floor(cam.x * z * par / span) + i, x = i * span - off, h = (40 + hash1(id * 3.7) * 70) * u, w2 = span * (0.55 + hash1(id * 1.3) * 0.4);
        ctx.lineTo(x, base - h * 0.35); ctx.lineTo(x, base - h); ctx.lineTo(x + w2, base - h); ctx.lineTo(x + w2, base - h * 0.5); ctx.lineTo(x + span, base - h * 0.5);
      }
      ctx.lineTo(sw + 10, sh + 10); ctx.closePath(); ctx.fill();
      // antenas y tanques con su lucecita roja
      for (let i = -1; i <= Math.ceil(sw / span) + 1; i++) {
        const id = Math.floor(cam.x * z * par / span) + i, x = i * span - off, h = (40 + hash1(id * 3.7) * 70) * u, w2 = span * (0.55 + hash1(id * 1.3) * 0.4);
        if (hash1(id * 5.1) < 0.6) { const ax = x + w2 * (0.25 + hash1(id * 2.2) * 0.5), ah = (30 + hash1(id * 6.6) * 50) * u; ctx.fillRect(ax - 1.5 * u, base - h - ah, 3 * u, ah); ctx.fillRect(ax - 9 * u, base - h - ah * 0.6, 18 * u, 2 * u); if (Math.sin(t * 2.4 + id) > 0.2) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(ax, base - h - ah, 0, ax, base - h - ah, 14 * u); g.addColorStop(0, 'rgba(255,60,50,0.95)'); g.addColorStop(1, 'rgba(255,40,30,0)'); ctx.fillStyle = g; ctx.fillRect(ax - 14 * u, base - h - ah - 14 * u, 28 * u, 28 * u); ctx.restore(); } }
        else if (hash1(id * 8.8) < 0.5) { const tx = x + w2 * 0.6; ctx.fillRect(tx - 14 * u, base - h - 30 * u, 28 * u, 26 * u); ctx.fillRect(tx - 12 * u, base - h - 6 * u, 3 * u, 6 * u); ctx.fillRect(tx + 9 * u, base - h - 6 * u, 3 * u, 6 * u); }
      }
    } else {
      // hojas de palma que cuelgan desde las esquinas de abajo, meciéndose (dibujadas una vez en una imagen y luego solo giradas)
      const spr = palmSprite(L.fore, u, DPR0);
      for (const side of [-1, 1]) {
        const ox = side < 0 ? -40 * u : sw + 40 * u, oy = base + 40 * u, sw2 = Math.sin(t * 0.9 + side) * 0.05;
        ctx.save(); ctx.translate(ox, oy); ctx.scale(-side, 1); ctx.rotate(sw2); ctx.drawImage(spr, -spr.ox, -spr.oy, spr.w, spr.h); ctx.restore();
      }
    }
    ctx.restore();
  }
  /* calidad ligera: tinte y viñeta horneados en una sola capa pequeña (una pasada en vez de dos, sin mezcla «soft-light») */
  let lite = null;
  function liteLayer(L, id, sw, sh) {
    const H = Math.max(2, Math.round(240 * sh / sw));
    if (lite && lite.id === id && lite.height === H) return lite;
    lite = document.createElement('canvas'); lite.id = id; lite.width = 240; lite.height = H; const x = lite.getContext('2d');
    const soft = c => c.replace(/[\d.]+\)$/, m => (parseFloat(m) * 0.45).toFixed(3) + ')');
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, soft(L.grade[0])); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, soft(L.grade[1])); x.fillStyle = g; x.fillRect(0, 0, 240, H);
    const v = x.createRadialGradient(120, H / 2, H * 0.42, 120, H / 2, 158); v.addColorStop(0, 'rgba(4,3,14,0)'); v.addColorStop(1, `rgba(4,3,14,${L.vig})`); x.fillStyle = v; x.fillRect(0, 0, 240, H);
    return lite;
  }
  function apply(ctx, G, cam, sw, sh, dpr) {
    const L = LOOK[G.world.id] || LOOK.cocora; DPR0 = Math.min(2, dpr);
    ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // (sin siluetas de primer plano: tapaban a los pilotos y no coincidían con los edificios del escenario)
    if (LOWFX) { ctx.drawImage(liteLayer(L, G.world.id, sw, sh), 0, 0, sw, sh); ctx.restore(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return; }
    bokeh(ctx, G, cam, sw, sh, L);
    grade(ctx, L, sw, sh);
    vignette(ctx, L, sw, sh);
    ctx.restore();
    bloom(ctx, L.bloom * (G.state === 'menu' ? 0.7 : 1));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  return { apply, bloom, LOOK };
})();
