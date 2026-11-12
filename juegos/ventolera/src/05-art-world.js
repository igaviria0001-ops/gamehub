/* =========================================================================
   ARTE DEL PAISAJE — capas con degradados, sin contornos, con bruma.
   Todo se dibuja en vectores cada cuadro (nítido con cualquier zoom):
   cielo, sol y rayos, nubes, montañas por capas (las lejanas se mueven
   menos y se ven más claras), palmas de cera, suelo con luz de borde,
   niebla baja y polen flotando.
   ========================================================================= */
const THEMES = {
  cocora: {
    sky: [[0, '#1b1f52'], [0.3, '#4b4688'], [0.55, '#b7739f'], [0.75, '#f19c8f'], [0.9, '#ffc796'], [1, '#ffe4b8']],
    horizon: '#ffd6b0',
    sun: { x: 0.3, y: 0.62, r: 70, core: '255,246,220', glow: '255,190,150' },
    layers: [
      { p: 0.05, base: 1250, amp: 420, freq: 0.00085, color: '#a58fc0', seed: 11, haze: 0.6 },
      { p: 0.12, base: 1330, amp: 330, freq: 0.0013, color: '#8a7fb7', seed: 23, haze: 0.5 },
      { p: 0.22, base: 1430, amp: 250, freq: 0.002, color: '#6c7aa8', seed: 37, haze: 0.38, palms: 330, trees: 150 },
      { p: 0.36, base: 1530, amp: 180, freq: 0.0029, color: '#527a8e', seed: 41, haze: 0.26, palms: 230, trees: 120 },
      { p: 0.55, base: 1610, amp: 120, freq: 0.0042, color: '#3f6f6a', seed: 53, haze: 0.14, palms: 170, trees: 95, fincas: 760 },
    ],
    fog: '255,220,226',
    ground: ['#5c9a5e', '#3b7048', '#244b35'], rim: 'rgba(255,214,160,0.9)', grass: '#8cc777',
    palm: { trunk: '#ece5d9', shade: '#b9ae9e', ring: 'rgba(120,108,92,0.45)', frond: '#2d6a49', frondHi: '#6fae72', dry: '#9a8a5a' },
    mote: '255,240,210',
  },
};

const ArtWorld = (() => {
  const SKY_REF = 1300; // altura del mundo que se ve como «horizonte» para las capas lejanas
  let cloudSprites = null;

  function hexToRgb(h) { if (h[0] !== '#') { const m = h.match(/[\d.]+/g); return [+m[0], +m[1], +m[2]]; } const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mix(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`; }

  // nubes: manchas suaves hechas una vez y luego estiradas
  function makeClouds() {
    const list = [];
    for (let k = 0; k < 5; k++) {
      const c = document.createElement('canvas'); c.width = 420; c.height = 160;
      const g = c.getContext('2d'); const r = makeRng(900 + k);
      for (let i = 0; i < 9; i++) {
        const x = 60 + r() * 300, y = 70 + r() * 40 - (Math.abs(x - 210) < 90 ? 18 : 0), rad = 34 + r() * 46;
        const grd = g.createRadialGradient(x, y, 0, x, y, rad);
        grd.addColorStop(0, 'rgba(255,255,255,0.55)'); grd.addColorStop(0.6, 'rgba(255,255,255,0.22)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = grd; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill();
      }
      // luz del amanecer: panza encendida de rosa y naranja, lomo lavanda
      g.globalCompositeOperation = 'source-atop'; const dg = g.createLinearGradient(0, 30, 0, 140); dg.addColorStop(0, 'rgba(226,214,255,0.5)'); dg.addColorStop(0.5, 'rgba(255,214,206,0.35)'); dg.addColorStop(1, 'rgba(255,150,110,0.85)'); g.fillStyle = dg; g.fillRect(0, 0, 420, 160);
      list.push(c);
    }
    return list;
  }

  function drawSky(ctx, T, cam, sw, sh, t) {
    // el cielo se oscurece un poco al subir (la cámara mira más arriba)
    const lift = clamp((SKY_REF - cam.y) / 2400, -0.15, 0.35);
    const g = ctx.createLinearGradient(0, -sh * lift, 0, sh * (1 - lift * 0.6));
    for (const [o, c] of T.sky) g.addColorStop(o, c);
    ctx.fillStyle = g; ctx.fillRect(0, 0, sw, sh);
    // últimas estrellas en lo alto del cielo
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 46; i++) { const sx = (hash1(i * 3.7) * sw * 1.3 - cam.x * cam.z * 0.01 + sw) % sw, sy = hash1(i * 9.1) * sh * 0.42 - sh * lift * 0.5, a = (1 - sy / (sh * 0.42)) * (0.35 + 0.35 * Math.sin(t * (1 + hash1(i)) + i)); if (a <= 0.02 || sy < 0) continue; ctx.globalAlpha = Math.min(0.8, a); const r = 0.6 + hash1(i * 5.3) * 0.9; ctx.fillRect(sx, sy, r, r); }
    ctx.globalAlpha = 1;
    // sol con resplandor y rayos
    const S = T.sun, px = sw * S.x - (cam.x - 1800) * cam.z * 0.02, py = sh * S.y + (SKY_REF - cam.y) * cam.z * 0.05;
    const R = S.r * Math.max(0.7, Math.min(sw, sh * 1.8) / 700);
    let grd = ctx.createRadialGradient(px, py, 0, px, py, R * 6);
    grd.addColorStop(0, `rgba(${S.glow},0.55)`); grd.addColorStop(0.3, `rgba(${S.glow},0.18)`); grd.addColorStop(1, `rgba(${S.glow},0)`);
    ctx.fillStyle = grd; ctx.fillRect(px - R * 6, py - R * 6, R * 12, R * 12);
    grd = ctx.createRadialGradient(px, py, 0, px, py, R);
    grd.addColorStop(0, `rgba(${S.core},1)`); grd.addColorStop(0.7, `rgba(${S.core},0.85)`); grd.addColorStop(1, `rgba(${S.core},0)`);
    ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(px, py, R, 0, TAU); ctx.fill();
    // rayos suaves
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const ang = -2.45 + i * 0.4 + Math.sin(t * 0.07 + i) * 0.04, len = Math.max(sw, sh) * 0.9, wdt = 0.035 + (i % 3) * 0.02;
      const gx = ctx.createLinearGradient(px, py, px + Math.cos(ang) * len, py + Math.sin(ang) * len);
      gx.addColorStop(0, `rgba(${S.glow},0.07)`); gx.addColorStop(0.5, `rgba(${S.glow},0.025)`); gx.addColorStop(1, `rgba(${S.glow},0)`);
      ctx.fillStyle = gx; ctx.beginPath(); ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(ang - wdt) * len, py + Math.sin(ang - wdt) * len);
      ctx.lineTo(px + Math.cos(ang + wdt) * len, py + Math.sin(ang + wdt) * len); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    return { px, py };
  }

  function drawClouds(ctx, cam, sw, sh, t, band, alpha) {
    if (!cloudSprites) cloudSprites = makeClouds();
    const p = band === 'far' ? 0.08 : 0.3, zL = cam.z * (0.55 + 0.45 * p), drift = t * (band === 'far' ? 6 : 14);
    const n = band === 'far' ? 6 : 4, span = 5200;
    ctx.save(); ctx.globalAlpha = alpha != null ? alpha : band === 'far' ? 0.55 : 0.32;
    for (let i = 0; i < n; i++) {
      const wx = ((i * 1370 + drift + (band === 'far' ? 0 : 700)) % span) - 800, wy = (band === 'far' ? 520 : 760) + (i % 3) * 140;
      const sx = sw / 2 + (wx - cam.x * p) * zL, sy = sh / 2 + (wy - (cam.y * p + (1 - p) * SKY_REF)) * zL;
      const spr = cloudSprites[i % cloudSprites.length], w = spr.width * zL * (band === 'far' ? 1.6 : 2.6), h = spr.height * zL * (band === 'far' ? 1.2 : 2);
      if (sx + w / 2 < 0 || sx - w / 2 > sw) continue;
      ctx.drawImage(spr, sx - w / 2, sy - h / 2, w, h);
    }
    ctx.restore();
  }

  // una capa de montañas: perfil por ruido evaluado en cada columna de pantalla
  function drawLayer(ctx, T, L, cam, sw, sh, t, next) {
    const p = L.p, zL = cam.z * (0.55 + 0.45 * p), camY = cam.y * p + (1 - p) * SKY_REF;
    const toS = ly => sh / 2 + (ly - camY) * zL;
    const lxAt = sx => cam.x * p + (sx - sw / 2) / zL;
    const hAt = lx => L.base - L.amp * (0.25 + 0.75 * fbm1(lx * L.freq + L.seed * 9.7, 4));
    const step = Math.max(4, Math.round(sw / 160));
    const col = mix(L.color, T.horizon, L.haze * 0.55);
    let topY = Infinity;
    ctx.beginPath(); ctx.moveTo(-2, sh + 2);
    for (let sx = -step; sx <= sw + step; sx += step) { const y = toS(hAt(lxAt(sx))); if (y < topY) topY = y; ctx.lineTo(sx, y); }
    ctx.lineTo(sw + 2, sh + 2); ctx.closePath();
    const g = ctx.createLinearGradient(0, Math.max(topY, -sh), 0, sh);
    g.addColorStop(0, col); g.addColorStop(1, mix(L.color, '#101a2a', 0.25 * (1 - L.haze)));
    ctx.fillStyle = g; ctx.fill();
    // el amanecer pega en la cresta
    ctx.beginPath(); for (let sx = -step; sx <= sw + step; sx += step) { const y = toS(hAt(lxAt(sx))) + 1; sx === -step ? ctx.moveTo(sx, y) : ctx.lineTo(sx, y); }
    ctx.strokeStyle = `rgba(255,224,196,${0.14 + 0.4 * (1 - L.haze) * p})`; ctx.lineWidth = Math.max(1, 2.4 * zL); ctx.stroke();
    // arboledas redondas sobre la loma
    if (L.trees) {
      const sp = L.trees, l0 = Math.floor(lxAt(0) / sp) - 1, l1 = Math.ceil(lxAt(sw) / sp) + 1, dk = mix(col, '#2a5a52', 0.1 + 0.2 * (1 - L.haze)), hi = mix(col, '#ffe0c0', 0.3);
      for (let k = l0; k <= l1; k++) {
        if (hash1(k * 5.3 + L.seed) < 0.5) continue;
        const lx = (k + hash1(k * 1.7 + L.seed) * 0.7) * sp, sx = sw / 2 + (lx - cam.x * p) * zL, n = 2 + Math.floor(hash1(k * 2.9) * 3); if (sx < -80 || sx > sw + 80) continue;
        for (let q = 0; q < n; q++) { const ox = (q - (n - 1) / 2) * 20, r = (11 + hash1(k * 3 + q * 7.1) * 10) * zL, y = toS(hAt(lx + ox)) - r * 0.2, X2 = sx + ox * zL; ctx.fillStyle = dk; ctx.beginPath(); ctx.ellipse(X2, y, r * 1.15, r * 0.85, 0, 0, TAU); ctx.fill(); ctx.fillStyle = hi; ctx.globalAlpha = 0.22; ctx.beginPath(); ctx.ellipse(X2 - r * 0.35, y - r * 0.3, r * 0.6, r * 0.4, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
      }
    }
    // fincas: casitas blancas de techo rojo con una luz encendida
    if (L.fincas) {
      const sp = L.fincas, l0 = Math.floor(lxAt(0) / sp) - 1, l1 = Math.ceil(lxAt(sw) / sp) + 1;
      for (let k = l0; k <= l1; k++) {
        if (hash1(k * 4.1 + 7) < 0.35) continue;
        const lx = (k + 0.2 + hash1(k * 6.3) * 0.6) * sp, sx = sw / 2 + (lx - cam.x * p) * zL, y = toS(hAt(lx)) + 2 * zL, w = 34 * zL, h = 16 * zL; if (sx < -60 || sx > sw + 60) continue;
        ctx.fillStyle = '#e6dccf'; ctx.fillRect(sx - w / 2, y - h, w, h); ctx.fillStyle = 'rgba(40,40,70,0.25)'; ctx.fillRect(sx, y - h, w / 2, h);
        ctx.fillStyle = '#b5523e'; ctx.beginPath(); ctx.moveTo(sx - w * 0.62, y - h); ctx.lineTo(sx - w * 0.3, y - h * 1.75); ctx.lineTo(sx + w * 0.3, y - h * 1.75); ctx.lineTo(sx + w * 0.62, y - h); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffd98a'; ctx.fillRect(sx - w * 0.3, y - h * 0.7, w * 0.16, h * 0.4); ctx.fillStyle = '#5a3a2a'; ctx.fillRect(sx + w * 0.08, y - h * 0.62, w * 0.14, h * 0.62);
      }
    }
    // palmas de cera en el horizonte (siluetas finitas)
    if (L.palms) {
      const sp = L.palms, l0 = Math.floor(lxAt(0) / sp) - 1, l1 = Math.ceil(lxAt(sw) / sp) + 1;
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = 'round';
      for (let k = l0; k <= l1; k++) {
        if (hash1(k * 3.1 + L.seed) < 0.45) continue;
        const lx = (k + hash1(k + L.seed * 2) * 0.8) * sp, gy = hAt(lx), hgt = (380 + hash1(k * 7.7) * 420) * (0.6 + p);
        const sx = sw / 2 + (lx - cam.x * p) * zL, by = toS(gy + 30), ty = toS(gy + 30 - hgt);
        if (sx < -40 || sx > sw + 40) continue;
        const sway = Math.sin(t * 0.6 + k) * 2 * zL;
        ctx.lineWidth = Math.max(0.8, 7 * zL); ctx.beginPath(); ctx.moveTo(sx, by); ctx.quadraticCurveTo(sx, (by + ty) / 2, sx + sway, ty); ctx.stroke();
        const cr = 46 * zL; ctx.lineWidth = Math.max(0.7, 5 * zL);
        for (let f = 0; f < 7; f++) { const a = -Math.PI / 2 + (f - 3) * 0.5; ctx.beginPath(); ctx.moveTo(sx + sway, ty); ctx.quadraticCurveTo(sx + sway + Math.cos(a) * cr * 0.7, ty + Math.sin(a) * cr * 0.7 - cr * 0.2, sx + sway + Math.cos(a) * cr, ty + Math.sin(a) * cr * 0.5 + cr * 0.45); ctx.stroke(); }
      }
    }
    // bruma al pie de la capa (separa una capa de la siguiente)
    const fy = toS(L.base + 10), fh = 180 * zL;
    const fg = ctx.createLinearGradient(0, fy - fh, 0, fy + fh * 0.6);
    fg.addColorStop(0, `rgba(${T.fog},0)`); fg.addColorStop(0.6, `rgba(${T.fog},${0.18 + L.haze * 0.25})`); fg.addColorStop(1, `rgba(${T.fog},0)`);
    ctx.fillStyle = fg; ctx.fillRect(0, fy - fh, sw, fh * 1.6);
  }

  // el nevado al fondo: pico con nieve que recibe la primera luz
  function drawPeak(ctx, T, cam, sw, sh) {
    const p = 0.03, zL = cam.z * (0.55 + 0.45 * p), camY = cam.y * p + (1 - p) * SKY_REF, X = lx => sw / 2 + (lx - cam.x * p) * zL, Y = ly => sh / 2 + (ly - camY) * zL, c = 330;
    const R = [[-640, 1290], [-470, 1120], [-360, 1060], [-250, 930], [-170, 860], [-90, 700], [-40, 640], [0, 560], [50, 610], [110, 720], [170, 770], [260, 900], [350, 960], [470, 1110], [660, 1290]];
    const path = pts => { ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(X(c + x), Y(y)) : ctx.moveTo(X(c + x), Y(y))); ctx.closePath(); };
    const g = ctx.createLinearGradient(0, Y(560), 0, Y(1290)); g.addColorStop(0, '#b9a2cf'); g.addColorStop(0.55, 'rgba(196,160,196,0.85)'); g.addColorStop(1, 'rgba(232,170,170,0)');
    path(R); ctx.fillStyle = g; ctx.fill();
    // lado en sombra (el sol sale por la izquierda)
    const sd = ctx.createLinearGradient(0, Y(560), 0, Y(1250)); sd.addColorStop(0, 'rgba(70,60,130,0.45)'); sd.addColorStop(1, 'rgba(70,60,130,0)');
    path([[0, 560], [50, 610], [110, 720], [170, 770], [260, 900], [350, 960], [470, 1110], [660, 1290], [120, 1290], [40, 900], [20, 700]]); ctx.fillStyle = sd; ctx.fill();
    // nieve: casquete con lenguas que bajan
    path([[-90, 700], [-40, 640], [0, 560], [50, 610], [110, 720], [150, 755], [120, 790], [96, 762], [70, 830], [44, 770], [18, 860], [-4, 790], [-30, 850], [-52, 770], [-80, 800], [-110, 745]]);
    const sn = ctx.createLinearGradient(X(c - 110), 0, X(c + 150), 0); sn.addColorStop(0, '#fff0e6'); sn.addColorStop(0.45, '#ffe2dc'); sn.addColorStop(0.55, '#d9c8ee'); sn.addColorStop(1, '#b7a6e0'); ctx.fillStyle = sn; ctx.fill();
    // aristas
    ctx.strokeStyle = 'rgba(255,240,230,0.5)'; ctx.lineWidth = Math.max(0.8, 1.6 * zL); ctx.lineJoin = 'round'; ctx.beginPath(); [[-470, 1120], [-360, 1060], [-250, 930], [-170, 860], [-90, 700], [-40, 640], [0, 560]].forEach(([x, y], i) => i ? ctx.lineTo(X(c + x), Y(y)) : ctx.moveTo(X(c + x), Y(y))); ctx.stroke();
  }
  // bandada lejana que cruza el valle
  function drawFlock(ctx, cam, sw, sh, t) {
    const u = Math.max(0.6, Math.min(sw / 1280, sh / 720)), span = sw + 400, fx = ((t * 16 - cam.x * cam.z * 0.1) % span + span) % span - 200, fy = sh * 0.3 + (SKY_REF - cam.y) * cam.z * 0.08;
    ctx.strokeStyle = 'rgba(60,44,100,0.55)'; ctx.lineWidth = 1.5 * u; ctx.lineCap = 'round'; ctx.beginPath();
    for (let k = 0; k < 7; k++) { const bx = fx - Math.abs(k - 3) * 17 * u, by = fy + (k - 3) * 9 * u + Math.sin(t * 0.8 + k) * 2, fl = Math.sin(t * 6.5 + k * 1.4) * 3 * u, ws = 6 * u; ctx.moveTo(bx - ws, by - 1.5 * u + fl); ctx.quadraticCurveTo(bx - ws * 0.4, by - 2.4 * u, bx, by); ctx.quadraticCurveTo(bx + ws * 0.4, by - 2.4 * u, bx + ws, by - 1.5 * u + fl); }
    ctx.stroke();
  }

  function drawBackground(ctx, G, cam, sw, sh) {
    const T = THEMES[G.world.id] || THEMES.cocora, t = G.time;
    if (T.city) return ArtCity.drawBackground(ctx, G, cam, sw, sh);
    if (T.capa) return ArtCapa.drawBackground(ctx, G, cam, sw, sh);
    const sun = drawSky(ctx, T, cam, sw, sh, t);
    drawPeak(ctx, T, cam, sw, sh);
    drawClouds(ctx, cam, sw, sh, t, 'far');
    drawFlock(ctx, cam, sw, sh, t);
    T.layers.forEach((L, i) => { drawLayer(ctx, T, L, cam, sw, sh, t, T.layers[i + 1]); if (i === 1) drawClouds(ctx, cam, sw, sh, t, 'near'); });
    return sun;
  }

  /* ---------- capa del juego (cámara completa) ---------- */
  function drawPalm(ctx, P, T, t, z) {
    const C = T.palm, sway = Math.sin(t * 0.8 + P.i * 1.7) * 6;
    const tx = P.x + (P.base - P.top) * P.lean;
    // tronco: claro de un lado, sombra del otro, con anillos
    const w = P.r * 1.6;
    const g = ctx.createLinearGradient(P.x - w, 0, P.x + w, 0);
    g.addColorStop(0, C.trunk); g.addColorStop(0.55, C.trunk); g.addColorStop(1, C.shade);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(P.x - w, P.base + 20); ctx.lineTo(tx - w * 0.7 + sway, P.top); ctx.lineTo(tx + w * 0.7 + sway, P.top); ctx.lineTo(P.x + w, P.base + 20); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(P.x - w + 1.4, P.base + 10); ctx.lineTo(tx - w * 0.7 + sway + 1.2, P.top + 6); ctx.stroke();
    const cs = ctx.createLinearGradient(0, P.top, 0, P.top + 90); cs.addColorStop(0, 'rgba(30,50,40,0.45)'); cs.addColorStop(1, 'rgba(30,50,40,0)'); ctx.fillStyle = cs; ctx.beginPath(); ctx.moveTo(tx - w * 0.7 + sway, P.top); ctx.lineTo(tx + w * 0.7 + sway, P.top); ctx.lineTo(tx + w * 0.78 + sway, P.top + 90); ctx.lineTo(tx - w * 0.78 + sway, P.top + 90); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C.ring; ctx.lineWidth = 1.6;
    for (let y = P.base - 30; y > P.top + 20; y -= 34) { const k = (P.base - y) / (P.base - P.top), x = lerp(P.x, tx + sway, k); ctx.beginPath(); ctx.moveTo(x - w * (1 - k * 0.3), y); ctx.lineTo(x + w * (1 - k * 0.3), y + 2); ctx.stroke(); }
    // copa: hojas largas que se arquean y cuelgan, con folíolos colgando como peine
    const cx = tx + sway, cy = P.top;
    if (P.crown.gone) {
      // copa destrozada: el tronco termina en astillas
      ctx.fillStyle = C.shade; ctx.beginPath(); ctx.moveTo(cx - 9, cy + 30); ctx.lineTo(cx - 6, cy + 4); ctx.lineTo(cx - 1, cy + 16); ctx.lineTo(cx + 3, cy - 2); ctx.lineTo(cx + 9, cy + 30); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = C.dry; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy + 20); ctx.quadraticCurveTo(cx + 14, cy + 40, cx + 8, cy + 66); ctx.stroke();
      return;
    }
    ctx.lineCap = 'round';
    const fronds = 12;
    for (let pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      for (let f = 0; f < fronds; f++) {
        const side = f < fronds / 2 ? -1 : 1, k = (f % (fronds / 2)) / (fronds / 2 - 1);
        const a = -Math.PI / 2 + side * (0.25 + k * 1.15) + Math.sin(t * 1.1 + f + P.i) * 0.04;
        const len = 78 + (f % 3) * 10, droop = 30 + k * 46;
        const ex = cx + Math.cos(a) * len, ey = cy + Math.sin(a) * len * 0.45 + droop;
        const qx = cx + Math.cos(a) * len * 0.55, qy = cy + Math.sin(a) * len * 0.9 - 14;
        if (pass === 0) {
          // folíolos: rayitas que cuelgan del raquis
          for (let u = 0.18; u < 0.98; u += 0.075) {
            const px = (1 - u) * (1 - u) * cx + 2 * (1 - u) * u * qx + u * u * ex, py = (1 - u) * (1 - u) * cy + 2 * (1 - u) * u * qy + u * u * ey;
            const L = 13 * (1 - u * 0.5);
            ctx.moveTo(px, py); ctx.lineTo(px + side * 2.5, py + L);
          }
        } else { ctx.moveTo(cx, cy); ctx.quadraticCurveTo(qx, qy, ex, ey); }
      }
      ctx.strokeStyle = pass ? C.frondHi : C.frond; ctx.lineWidth = pass ? 2.6 : 3.4;
      ctx.stroke();
    }
    // hojas secas que cuelgan bajo la copa y el capitel verde claro
    ctx.strokeStyle = C.dry; ctx.lineWidth = 3;
    ctx.beginPath(); for (let f = 0; f < 3; f++) { const s = f - 1; ctx.moveTo(cx, cy + 6); ctx.quadraticCurveTo(cx + s * 14, cy + 30, cx + s * 9, cy + 58); } ctx.stroke();
    ctx.fillStyle = '#8fb08a'; ctx.beginPath(); ctx.ellipse(cx, cy + 10, 7, 16, 0, 0, TAU); ctx.fill();
  }

  function drawGround(ctx, G, cam, sw, sh) {
    const W = G.world, T = THEMES[W.id] || THEMES.cocora, t = G.time;
    const x0 = cam.x - sw / 2 / cam.z - 40, x1 = cam.x + sw / 2 / cam.z + 40, step = Math.max(6, 10 / cam.z);
    let minY = Infinity;
    ctx.beginPath(); ctx.moveTo(x0, W.h + 400);
    for (let x = x0; x <= x1; x += step) { const y = W.groundY(x); if (y < minY) minY = y; ctx.lineTo(x, y); }
    ctx.lineTo(x1, W.h + 400); ctx.closePath();
    const g = ctx.createLinearGradient(0, minY, 0, minY + 420);
    g.addColorStop(0, T.ground[0]); g.addColorStop(0.35, T.ground[1]); g.addColorStop(1, T.ground[2]);
    ctx.fillStyle = g; ctx.fill();
    // luz de borde (el sol del amanecer pega en la cima)
    ctx.beginPath();
    for (let x = x0; x <= x1; x += step) { const y = W.groundY(x) + 1.5; if (x === x0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.strokeStyle = T.rim; ctx.lineWidth = 3; ctx.stroke();
    // dentro del suelo: parches de pasto claro, vetas de la loma y luz que baja de la cresta
    ctx.save(); ctx.beginPath(); ctx.moveTo(x0, W.h + 400); for (let x = x0; x <= x1; x += step) ctx.lineTo(x, W.groundY(x)); ctx.lineTo(x1, W.h + 400); ctx.closePath(); ctx.clip();
    if (!LOWFX) for (let x = Math.floor(x0 / 150) * 150; x <= x1; x += 150) { const hx = x + hash1(x * 0.37) * 110, y = W.groundY(hx) + 20 + hash1(x * 0.91) * 44; ctx.fillStyle = hash1(x * 1.3) < 0.5 ? 'rgba(186,226,128,0.16)' : 'rgba(20,60,40,0.16)'; ctx.beginPath(); ctx.ellipse(hx, y, 70 + hash1(x * 0.7) * 60, 13 + hash1(x * 0.5) * 10, 0, 0, TAU); ctx.fill(); }
    for (const [d, a2, w2] of LOWFX ? [[130, 0.12, 12]] : [[58, 0.14, 9], [130, 0.12, 12], [230, 0.1, 16]]) { ctx.beginPath(); for (let x = x0; x <= x1; x += step * 2) { const y = W.groundY(x) * 0.8 + minY * 0.2 + d + Math.sin(x * 0.013 + d) * 8; x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.strokeStyle = `rgba(8,30,24,${a2})`; ctx.lineWidth = w2; ctx.stroke(); }
    ctx.beginPath(); for (let x = x0; x <= x1; x += step) { const y = W.groundY(x) + 11; x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.strokeStyle = 'rgba(255,224,150,0.13)'; ctx.lineWidth = 20; ctx.stroke();
    ctx.restore();
    // piedras medio enterradas
    for (let x = Math.floor(x0 / 310) * 310; x <= x1; x += 310) { if (hash1(x * 0.77) < 0.55) continue; const rx = x + hash1(x * 0.21) * 220, y = W.groundY(rx) + 3, r = 9 + hash1(x * 0.33) * 9; const rg = ctx.createLinearGradient(rx - r, y - r, rx + r, y); rg.addColorStop(0, '#c9c2c9'); rg.addColorStop(1, '#5a5a70'); ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(rx - r * 1.2, y + 2); ctx.quadraticCurveTo(rx - r * 1.1, y - r * 0.9, rx - r * 0.2, y - r); ctx.quadraticCurveTo(rx + r * 0.9, y - r * 0.9, rx + r * 1.25, y + 2); ctx.closePath(); ctx.fill(); }
    // frailejones: tallo oscuro, roseta de hojas plateadas y flores amarillas
    for (let x = Math.floor(x0 / 230) * 230; x <= x1; x += 230) {
      if (hash1(x * 0.59) < 0.42) continue; const fx = x + hash1(x * 0.17) * 170, y = W.groundY(fx) + 3, hgt = 20 + hash1(x * 0.43) * 22, sw2 = Math.sin(t * 1.2 + x) * 1.2;
      ctx.fillStyle = '#4a4034'; ctx.beginPath(); ctx.moveTo(fx - 4.5, y); ctx.lineTo(fx - 3.4 + sw2 * 0.5, y - hgt); ctx.lineTo(fx + 3.4 + sw2 * 0.5, y - hgt); ctx.lineTo(fx + 4.5, y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); for (let q = 5; q < hgt - 3; q += 5) { ctx.moveTo(fx - 4, y - q); ctx.lineTo(fx + 4, y - q + 1); } ctx.stroke();
      const cx = fx + sw2, cy = y - hgt - 2;
      for (let q = 0; q < 11; q++) { const a = -Math.PI + (q / 10) * Math.PI, ln = 13 + (q % 2) * 3; ctx.fillStyle = q % 2 ? '#c9d6b4' : '#a9bb98'; ctx.save(); ctx.translate(cx, cy); ctx.rotate(a + Math.PI / 2); ctx.beginPath(); ctx.ellipse(0, -ln * 0.55, 2.6, ln * 0.55, 0, 0, TAU); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = '#f2d24a'; for (let q = 0; q < 3; q++) { ctx.beginPath(); ctx.arc(cx + (q - 1) * 6, cy - 17 - (q % 2) * 4, 2.2, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = '#8a9a70'; ctx.lineWidth = 1; ctx.beginPath(); for (let q = 0; q < 3; q++) { ctx.moveTo(cx, cy - 4); ctx.lineTo(cx + (q - 1) * 6, cy - 15 - (q % 2) * 4); } ctx.stroke();
    }
    // pasto: dos tonos, matas altas de paja y flores silvestres
    ctx.lineCap = 'round';
    for (const [col, off, lw, hk] of LOWFX ? [[T.grass, 0, 2, 1]] : [['#3f8250', 5, 2.2, 0.8], [T.grass, 0, 1.8, 1]]) {
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
      for (let x = Math.floor(x0 / 11) * 11 + off; x <= x1; x += 11) { const y = W.groundY(x), h = (6 + hash1(x * 1.31 + off) * 13) * hk, lean = Math.sin(t * 1.5 + x * 0.05) * 3; ctx.moveTo(x, y + 2); ctx.quadraticCurveTo(x + lean * 0.5, y - h * 0.5, x + lean + 2.5, y - h); }
      ctx.stroke();
    }
    ctx.strokeStyle = '#d9c98a'; ctx.lineWidth = 1.4; ctx.beginPath();
    for (let x = Math.floor(x0 / 76) * 76; x <= x1; x += 76) { if (hash1(x * 0.83) < 0.35) continue; const bx = x + hash1(x * 0.29) * 50, y = W.groundY(bx), lean = Math.sin(t * 1.3 + x * 0.04) * 4; for (let q = -2; q <= 2; q++) { ctx.moveTo(bx + q * 1.5, y + 2); ctx.quadraticCurveTo(bx + q * 4 + lean * 0.5, y - 14, bx + q * 7 + lean, y - 22 - (2 - Math.abs(q)) * 5); } }
    ctx.stroke();
    const FC = ['#ffe36a', '#ff9ec4', '#ffffff', '#c9a6ff'];
    for (let x = Math.floor(x0 / 34) * 34; x <= x1; x += 34) { if (hash1(x * 0.47) < 0.45) continue; const fx = x + hash1(x * 0.13) * 26, y = W.groundY(fx), h = 6 + hash1(x * 0.71) * 8, lean = Math.sin(t * 1.5 + fx * 0.05) * 2; ctx.strokeStyle = '#4f9058'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(fx, y + 1); ctx.lineTo(fx + lean, y - h); ctx.stroke(); ctx.fillStyle = FC[Math.floor(hash1(x * 0.97) * 4)]; ctx.beginPath(); ctx.arc(fx + lean, y - h, 2.1, 0, TAU); ctx.fill(); }
  }

  // todo lo del escenario que va detrás de los pilotos
  function drawStage(ctx, G, cam, sw, sh) {
    const T = THEMES[G.world.id] || THEMES.cocora;
    if (T.city) return ArtCity.drawStage(ctx, G, cam, sw, sh);
    if (T.capa) return ArtCapa.drawStage(ctx, G, cam, sw, sh);
    for (const P of G.world.palms) drawPalm(ctx, P, T, G.time, cam.z);
    drawGround(ctx, G, cam, sw, sh);
  }
  function drawLowFog(ctx, G, cam, sw, sh) {
    const W = G.world, T = THEMES[W.id] || THEMES.cocora, t = G.time;
    if (T.city) return ArtCity.drawHaze(ctx, G, cam, sw, sh);
    if (T.capa) return ArtCapa.drawHaze(ctx, G, cam, sw, sh);
    const by = W.def.ground(cam.x) - 40, top = by - 260;
    const g = ctx.createLinearGradient(0, top, 0, by + 60);
    g.addColorStop(0, `rgba(${T.fog},0)`); g.addColorStop(0.7, `rgba(${T.fog},0.22)`); g.addColorStop(1, `rgba(${T.fog},0.05)`);
    ctx.fillStyle = g;
    const x0 = cam.x - sw / 2 / cam.z, w = sw / cam.z;
    ctx.fillRect(x0, top, w, 330);
    // jirones de niebla que pasan
    ctx.save(); ctx.globalAlpha = 0.18;
    for (let i = 0; i < 6; i++) {
      const x = ((i * 830 + t * (18 + i * 4)) % (W.w + 1200)) - 600, y = W.groundY(clamp(x, 0, W.w)) - 120 - (i % 3) * 70;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, 260);
      rg.addColorStop(0, `rgba(${T.fog},0.9)`); rg.addColorStop(1, `rgba(${T.fog},0)`);
      ctx.fillStyle = rg; ctx.save(); ctx.translate(x, y); ctx.scale(2.4, 0.5); ctx.translate(-x, -y); ctx.beginPath(); ctx.arc(x, y, 260, 0, TAU); ctx.fill(); ctx.restore();
    }
    ctx.restore();
  }

  return { drawBackground, drawStage, drawGround, drawPalm, drawLowFog, drawClouds, drawSky, mix };
})();
