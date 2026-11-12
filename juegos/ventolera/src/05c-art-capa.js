/* =========================================================================
   ARTE DE CAPADOCIA AL AMANECER — el valle de las chimeneas de hadas.
   Fondo: cielo de amanecer con el sol bajo, el volcán Erciyes nevado,
   mesetas de toba en escalones con vetas rosa y crema, campos de chimeneas
   lejanas con casas-cueva, álamos y decenas de globos que suben despacio.
   Escenario: el piso del valle (viñas, amapolas, piedras de toba), las
   chimeneas de hadas con su sombrero de basalto (cuevas, palomares
   pintados de blanco, puertas talladas), la roca-castillo con su túnel
   y su bandera, el arco del Valle Rosa, las térmicas (aire tibio que sube,
   con un águila dando vueltas arriba) y los globos de verdad del juego.
   ========================================================================= */
THEMES.capadocia = {
  capa: true,
  sky: [[0, '#1c2656'], [0.27, '#3a4889'], [0.5, '#9a7bb3'], [0.68, '#ec9ca0'], [0.84, '#ffc49a'], [1, '#ffe6b8']],
  horizon: '#f0bfa8',
  sun: { x: 0.76, y: 0.64, r: 62, core: '255,244,214', glow: '255,180,138' },
  fog: '236,188,204',
  ground: ['#e4c39b', '#c29572', '#7a5446'],
  rim: 'rgba(255,228,174,0.95)',
  mote: '255,236,210',
};
// colores de los globos: [gajo A, gajo B, franja]
const HOTAIR_COLORS = [
  ['#e8423f', '#ffd25a', '#2b5fc4'], ['#2f7fd8', '#f6f1e6', '#e8423f'], ['#46b25e', '#ff983a', '#6b3fbf'],
  ['#9a4fd0', '#ff86b4', '#ffd25a'], ['#ff7a2f', '#ffe3a6', '#2f3f8f'], ['#1fa59d', '#fff3d6', '#d8473a'],
];

const ArtCapa = (() => {
  const SKY_REF = 1450;
  const h1 = (a, b = 0) => hash1(a * 12.9898 + b * 78.233);
  const mix = (a, b, k) => ArtWorld.mix(a, b, k);
  // la toba: crema iluminada, rosada en sombra; el basalto del sombrero, gris pardo
  const TUFF = { lit: '#f6d3a6', mid: '#d8a585', shade: '#94656f', deep: '#5f3f52', cap: '#57464c', capLit: '#d29d84', capDark: '#2c2229' };
  const ROSE = { lit: '#f7c7ad', mid: '#d68f86', shade: '#8e5a6c', deep: '#5e3a52', bands: ['rgba(255,232,200,0.22)', 'rgba(150,70,90,0.14)', 'rgba(255,200,150,0.16)'] };

  /* ---------- fondo ---------- */
  // mesetas lejanas: perfil en escalones (cornisas planas y paredes empinadas, como las de toba)
  const LAYERS = [
    { p: 0.05, base: 1330, amp: 330, freq: 0.0011, color: '#8f80b4', seed: 4, haze: 0.55 },
    { p: 0.1, base: 1430, amp: 270, freq: 0.0016, color: '#9a789e', seed: 9, haze: 0.42, strata: 1 },
    { p: 0.18, base: 1545, amp: 220, freq: 0.0023, color: '#a06f86', seed: 15, haze: 0.3, strata: 1, chim: 230 },
    { p: 0.3, base: 1680, amp: 150, freq: 0.0031, color: '#8f5f70', seed: 22, haze: 0.18, strata: 1, chim: 150, caves: 1 },
    { p: 0.46, base: 1820, amp: 105, freq: 0.0044, color: '#73495c', seed: 31, haze: 0.08, chim: 125, caves: 1, poplars: 230 },
  ];
  const terr = v => 0.12 + 0.45 * smooth(clamp((v - 0.36) / 0.12, 0, 1)) + 0.43 * smooth(clamp((v - 0.6) / 0.09, 0, 1));

  // siluetas de chimeneas lejanas: se juntan todas las de la capa y se pintan de a una sola pasada por color
  // (cuerpo, lado del sol, sombrero y cuevitas): mucho más barato que una figura por chimenea
  function chimBatch(ctx, list, dk, lt, cap, caves) {
    if (!list.length) return;
    ctx.beginPath();
    for (const [sx, by, ty, w] of list) { const hw = w / 2, my = (by + ty) / 2; ctx.moveTo(sx - hw, by); ctx.quadraticCurveTo(sx - hw * 0.5, my, sx - hw * 0.28, ty); ctx.lineTo(sx + hw * 0.28, ty); ctx.quadraticCurveTo(sx + hw * 0.5, my, sx + hw, by); ctx.closePath(); }
    ctx.fillStyle = dk; ctx.fill();
    ctx.beginPath();
    for (const [sx, by, ty, w] of list) { const hw = w / 2, my = (by + ty) / 2; ctx.moveTo(sx + hw * 0.05, by); ctx.quadraticCurveTo(sx + hw * 0.12, my, sx + hw * 0.06, ty); ctx.lineTo(sx + hw * 0.28, ty); ctx.quadraticCurveTo(sx + hw * 0.5, my, sx + hw, by); ctx.closePath(); }
    ctx.fillStyle = lt; ctx.fill();
    ctx.beginPath();
    for (const [sx, , ty, w] of list) { const hw = w / 2, ry = Math.max(1.2, hw * 0.2); ctx.moveTo(sx + hw * 0.46, ty); ctx.ellipse(sx, ty, hw * 0.46, ry, 0, 0, TAU); }
    ctx.fillStyle = cap; ctx.fill();
    if (caves && !LOWFX) {
      ctx.beginPath();
      for (const [sx, by, ty, w, seed] of list) {
        if (w <= 7) continue; const hw = w / 2, n = 1 + Math.floor(h1(seed, 4) * 3);
        for (let q = 0; q < n; q++) { const u = 0.3 + h1(seed + q, 6) * 0.5, x = sx + (h1(seed * 3 + q, 8) - 0.5) * hw * 0.8, y = lerp(ty, by, u), r = Math.max(0.8, w * 0.06); ctx.rect(x - r, y - r * 1.4, r * 2, r * 2.4); }
      }
      ctx.fillStyle = 'rgba(60,30,36,0.55)'; ctx.fill();
    }
  }
  function layer(ctx, T, L, cam, sw, sh, t) {
    const p = L.p, zL = cam.z * (0.55 + 0.45 * p), camY = cam.y * p + (1 - p) * SKY_REF;
    const toS = ly => sh / 2 + (ly - camY) * zL, lxAt = sx => cam.x * p + (sx - sw / 2) / zL;
    const hAt = lx => L.base - L.amp * terr(fbm1(lx * L.freq + L.seed * 9.7, 4));
    const step = Math.max(4, Math.round(sw / (LOWFX ? 110 : 170)));
    const col = mix(L.color, T.horizon, L.haze * 0.5);
    const pts = []; let top = Infinity;
    for (let sx = -step; sx <= sw + step; sx += step) { const y = toS(hAt(lxAt(sx))); pts.push(sx, y); if (y < top) top = y; }
    const path = () => { ctx.beginPath(); ctx.moveTo(-2, sh + 2); for (let i = 0; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.lineTo(sw + 2, sh + 2); ctx.closePath(); };
    path();
    const g = ctx.createLinearGradient(0, Math.max(top, -sh), 0, Math.min(sh * 1.4, toS(L.base + 240)));
    g.addColorStop(0, mix(col, '#ffc396', 0.42 - L.haze * 0.2)); g.addColorStop(0.3, col); g.addColorStop(1, mix(L.color, '#2e1d3a', 0.3 * (1 - L.haze)));
    ctx.fillStyle = g; ctx.fill();
    // vetas horizontales de la toba (rosa, crema, ocre)
    // vetas de la toba: siguen el perfil de la meseta, más abajo (sin recortes: barato)
    if (L.strata && !LOWFX) {
      ctx.lineWidth = Math.max(1, 7 * zL);
      for (const [d, c] of [[46, `rgba(70,30,60,${0.05 + 0.07 * (1 - L.haze)})`], [96, `rgba(255,220,190,${0.05 + 0.07 * (1 - L.haze)})`], [160, `rgba(70,30,60,${0.04 + 0.06 * (1 - L.haze)})`]]) {
        ctx.beginPath(); const dy = d * zL; for (let i = 0; i < pts.length; i += 2) i ? ctx.lineTo(pts[i], pts[i + 1] + dy) : ctx.moveTo(pts[i], pts[i + 1] + dy);
        ctx.strokeStyle = c; ctx.stroke();
      }
    }
    // el sol bajo pega en las cornisas
    ctx.beginPath(); for (let i = 0; i < pts.length; i += 2) i ? ctx.lineTo(pts[i], pts[i + 1] + 1) : ctx.moveTo(pts[i], pts[i + 1] + 1);
    ctx.strokeStyle = `rgba(255,214,160,${0.3 + 0.5 * (1 - L.haze)})`; ctx.lineWidth = Math.max(1, 2.4 * zL); ctx.stroke();
    // álamos (los valles tienen hileras de álamos)
    if (L.poplars && !LOWFX) {
      const sp = L.poplars, l0 = Math.floor(lxAt(-40) / sp), l1 = Math.ceil(lxAt(sw + 40) / sp), pc = mix('#34503a', col, 0.3 + L.haze * 0.6), pl = mix('#7f9a52', col, 0.35 + L.haze * 0.5);
      const P = [];
      for (let k = l0; k <= l1; k++) {
        if (h1(k, L.seed + 11) < 0.55) continue;
        const n = 2 + Math.floor(h1(k, L.seed + 12) * 3);
        for (let q = 0; q < n; q++) {
          const lx = (k + 0.1 + q * 0.09) * sp, gy = hAt(lx), sx = sw / 2 + (lx - cam.x * p) * zL, by = toS(gy + 6), hh = (40 + h1(k + q, 3) * 26) * zL, w = hh * 0.13;
          if (sx > -20 && sx < sw + 20) P.push([sx, by, hh, w]);
        }
      }
      ctx.beginPath(); for (const [sx, by, hh, w] of P) { ctx.moveTo(sx, by - hh); ctx.quadraticCurveTo(sx + w * 1.25, by - hh * 0.4, sx + w * 0.35, by); ctx.lineTo(sx - w * 0.35, by); ctx.quadraticCurveTo(sx - w * 1.25, by - hh * 0.4, sx, by - hh); } ctx.fillStyle = pc; ctx.fill();
      ctx.beginPath(); for (const [sx, by, hh, w] of P) { ctx.moveTo(sx, by - hh); ctx.quadraticCurveTo(sx + w * 1.25, by - hh * 0.4, sx + w * 0.35, by); ctx.lineTo(sx + w * 0.1, by); ctx.quadraticCurveTo(sx + w * 0.5, by - hh * 0.5, sx, by - hh); } ctx.fillStyle = pl; ctx.fill();
    }
    // campos de chimeneas de hadas
    if (L.chim) {
      const sp = L.chim, l0 = Math.floor(lxAt(-80) / sp), l1 = Math.ceil(lxAt(sw + 80) / sp);
      const dk = mix(col, '#6a4250', 0.14 + 0.26 * (1 - L.haze)), lt = mix(col, '#fff0da', 0.3 + 0.1 * (1 - L.haze)), cap = mix(col, '#3a2c34', 0.32 + 0.3 * (1 - L.haze));
      const list = [];
      for (let k = l0; k <= l1; k++) {
        if (h1(k, L.seed) < (LOWFX ? 0.55 : 0.38)) continue;
        const n = 1 + Math.floor(h1(k, L.seed + 3) * 3);
        for (let q = 0; q < n; q++) {
          const lx = (k + 0.12 + h1(k * 3 + q, L.seed) * 0.72) * sp, gy = hAt(lx);
          const hh = (55 + h1(k * 7 + q, L.seed + 1) * 115) * (0.75 + p * 0.8), bw = hh * (0.3 + h1(k + q * 5, 2) * 0.12);
          const sx = sw / 2 + (lx - cam.x * p) * zL, w = bw * zL;
          if (sx + w < 0 || sx - w > sw) continue;
          list.push([sx, toS(gy + 14), toS(gy + 14 - hh), w, k * 7 + q]);
        }
      }
      chimBatch(ctx, list, dk, lt, cap, L.caves);
    }
    // bruma al pie de la capa
    const fy = toS(L.base + 10), fh = 170 * zL;
    const fg = ctx.createLinearGradient(0, fy - fh, 0, fy + fh * 0.6);
    fg.addColorStop(0, `rgba(${T.fog},0)`); fg.addColorStop(0.6, `rgba(${T.fog},${0.08 + L.haze * 0.18})`); fg.addColorStop(1, `rgba(${T.fog},0)`);
    ctx.fillStyle = fg; ctx.fillRect(0, fy - fh, sw, fh * 1.6);
  }
  // el Erciyes: volcano ancho y nevado, muy lejos (a la izquierda del sol)
  function volcano(ctx, cam, sw, sh) {
    const p = 0.025, zL = cam.z * (0.55 + 0.45 * p), camY = cam.y * p + (1 - p) * SKY_REF, c = -420;
    const X = lx => sw / 2 + (lx - cam.x * p) * zL, Y = ly => sh / 2 + (ly - camY) * zL;
    const P = [[-1700, 1360], [-1100, 1230], [-640, 1070], [-330, 930], [-170, 840], [-70, 790], [-20, 772], [30, 780], [80, 766], [140, 800], [260, 870], [520, 1010], [900, 1170], [1500, 1330], [1800, 1380]];
    const path = (pts, soft) => {
      ctx.beginPath(); const Q = pts.map(([x, y]) => [X(c + x), Y(y + 110)]);
      if (!soft) Q.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      else { ctx.moveTo(Q[0][0], Q[0][1]); for (let i = 1; i < Q.length - 1; i++) ctx.quadraticCurveTo(Q[i][0], Q[i][1], (Q[i][0] + Q[i + 1][0]) / 2, (Q[i][1] + Q[i + 1][1]) / 2); ctx.lineTo(Q[Q.length - 1][0], Q[Q.length - 1][1]); }
      ctx.closePath();
    };
    const g = ctx.createLinearGradient(0, Y(880), 0, Y(1470)); g.addColorStop(0, '#b6a2d0'); g.addColorStop(0.6, 'rgba(206,170,200,0.9)'); g.addColorStop(1, 'rgba(240,186,176,0)');
    path([...P, [1800, 1500], [-1700, 1500]], true); ctx.fillStyle = g; ctx.fill();
    // ladera en sombra (el sol sale por la derecha: la sombra va a la izquierda)
    const sd = ctx.createLinearGradient(0, Y(880), 0, Y(1410)); sd.addColorStop(0, 'rgba(76,62,132,0.4)'); sd.addColorStop(1, 'rgba(76,62,132,0)');
    path([[-1700, 1360], [-1100, 1230], [-640, 1070], [-330, 930], [-170, 840], [-70, 790], [-20, 772], [-40, 900], [-160, 1100], [-380, 1360]], true); ctx.fillStyle = sd; ctx.fill();
    // nieve en la cumbre, con lenguas
    path([[-330, 930], [-170, 840], [-70, 790], [-20, 772], [30, 780], [80, 766], [140, 800], [260, 870], [330, 912], [270, 930], [220, 905], [170, 960], [120, 915], [70, 985], [30, 925], [-20, 990], [-60, 930], [-120, 975], [-170, 925], [-250, 960]], true);
    const sn = ctx.createLinearGradient(X(c - 330), 0, X(c + 330), 0); sn.addColorStop(0, '#a99cd0'); sn.addColorStop(0.42, '#d6cbea'); sn.addColorStop(0.6, '#f6e4ea'); sn.addColorStop(1, '#ffd9cc'); ctx.fillStyle = sn; ctx.fill();
    // canaletas de la nieve (rayitas que bajan)
    ctx.strokeStyle = 'rgba(120,104,170,0.35)'; ctx.lineWidth = Math.max(0.8, 1.6 * zL); ctx.beginPath();
    for (const [x0, y0, x1, y1] of [[-60, 800, -110, 940], [-20, 790, -30, 960], [40, 790, 60, 930], [110, 800, 160, 900], [-150, 860, -210, 930]]) { ctx.moveTo(X(c + x0), Y(y0 + 110)); ctx.lineTo(X(c + x1), Y(y1 + 110)); }
    ctx.stroke();
  }
  // globos lejanos: muchos, de colores, a distintas distancias; suben y bajan despacio
  let BG = null, SPR = null;
  function bgList() {
    if (BG) return BG;
    const r = makeRng(77), L = [];
    for (let i = 0; i < 24; i++) { const p = 0.045 + r() * 0.4; L.push({ p, lx: r() * 5400 - 900, ly: 560 + r() * 760 + p * 500, s: 0.45 + r() * 0.55, c: Math.floor(r() * HOTAIR_COLORS.length), sp: 3 + r() * 6, ph: r() * TAU }); }
    L.sort((a, b) => a.p - b.p);
    return (BG = L);
  }
  // un sprite por color (se dibuja una vez, a 2×)
  function sprites() {
    if (SPR) return SPR;
    SPR = HOTAIR_COLORS.map(C => {
      const R = 40, c = document.createElement('canvas'); c.width = 2 * (R * 2 + 8); c.height = 2 * (R * 2 + 64);
      const g = c.getContext('2d'); g.scale(2, 2);
      const x = R + 4, y = R + 4;
      envelope(g, x, y, R, C, 0, 0, false);
      basket(g, x, y, R, 32, 26, 18, 0, false);
      return c;
    });
    return SPR;
  }
  function bgBalloon(ctx, B, cam, sw, sh, t) {
    if (LOWFX && B.c % 2) return;
    const p = B.p, zL = cam.z * (0.55 + 0.45 * p), camY = cam.y * p + (1 - p) * SKY_REF, span = 5400;
    const wx = ((B.lx + t * B.sp - cam.x * p) % span + span) % span - span / 2, ly = B.ly + Math.sin(t * 0.07 + B.ph) * 50;
    const k = B.s * zL * (0.9 + p), spr = sprites()[B.c], w = spr.width / 2 * k, h = spr.height / 2 * k;
    const sx = sw / 2 + wx * zL, sy = sh / 2 + (ly - camY) * zL;
    if (sx + w < 0 || sx - w > sw || sy + h < 0 || sy - h > sh) return;
    ctx.globalAlpha = clamp(0.45 + p * 1.6, 0.45, 1);
    ctx.drawImage(spr, sx - w / 2, sy - h * 0.3, w, h);
    ctx.globalAlpha = 1;
  }
  function drawBackground(ctx, G, cam, sw, sh) {
    const T = THEMES.capadocia, t = G.time;
    const sun = ArtWorld.drawSky(ctx, T, cam, sw, sh, t);
    volcano(ctx, cam, sw, sh);
    ArtWorld.drawClouds(ctx, cam, sw, sh, t, 'far', 0.36);
    const L = bgList(); let bi = 0;
    const upTo = q => { while (bi < L.length && L[bi].p < q) bgBalloon(ctx, L[bi++], cam, sw, sh, t); };
    LAYERS.forEach((Ly, i) => { upTo(Ly.p); layer(ctx, T, Ly, cam, sw, sh, t); if (i === 1) ArtWorld.drawClouds(ctx, cam, sw, sh, t, 'near', 0.18); });
    upTo(9);
    return sun;
  }

  /* ---------- los globos (dibujo común: fondo y juego) ---------- */
  function envPath(ctx, x, y, r) {
    ctx.beginPath(); ctx.arc(x, y, r, Math.PI * 0.8, Math.PI * 2.2);
    ctx.quadraticCurveTo(x + r * 0.6, y + r * 0.98, x + r * 0.2, y + r * 1.18);
    ctx.lineTo(x - r * 0.2, y + r * 1.18);
    ctx.quadraticCurveTo(x - r * 0.6, y + r * 0.98, x - r * 0.809, y + r * 0.588);
    ctx.closePath();
  }
  function envelope(ctx, x, y, r, C, burn, t, detail) {
    envPath(ctx, x, y, r); ctx.fillStyle = C[0]; ctx.fill();
    ctx.save(); envPath(ctx, x, y, r); ctx.clip();
    // gajos: franjas que se angostan hacia los lados (se ve redondo)
    ctx.fillStyle = C[1];
    for (const [a, b] of [[0, 0.2], [0.44, 0.65], [0.84, 0.96]]) {
      ctx.beginPath(); ctx.ellipse(x, y + r * 0.12, b * r, r * 1.14, 0, 0, TAU);
      if (a > 0) { ctx.moveTo(x + a * r, y + r * 0.12); ctx.ellipse(x, y + r * 0.12, a * r, r * 1.14, 0, 0, TAU); }
      ctx.fill('evenodd');
    }
    // franja del ecuador (con rombos)
    ctx.fillStyle = C[2]; ctx.beginPath();
    ctx.moveTo(x - r * 1.1, y + r * 0.12); ctx.quadraticCurveTo(x, y + r * 0.34, x + r * 1.1, y + r * 0.12);
    ctx.lineTo(x + r * 1.1, y + r * 0.27); ctx.quadraticCurveTo(x, y + r * 0.5, x - r * 1.1, y + r * 0.27); ctx.closePath(); ctx.fill();
    if (detail) {
      ctx.fillStyle = 'rgba(255,248,230,0.85)';
      for (let k = -4; k <= 4; k++) { const u = k / 5, bx = x + u * r, by = y + r * (0.19 + 0.21 * (1 - u * u)) + r * 0.005, d = r * 0.05 * (1 - Math.abs(u) * 0.5); ctx.beginPath(); ctx.moveTo(bx, by - d); ctx.lineTo(bx + d * 0.8, by); ctx.lineTo(bx, by + d); ctx.lineTo(bx - d * 0.8, by); ctx.closePath(); ctx.fill(); }
      // costuras de los gajos
      ctx.strokeStyle = 'rgba(60,30,40,0.16)'; ctx.lineWidth = 1;
      for (const u of [0.2, 0.44, 0.65, 0.84]) { ctx.beginPath(); ctx.ellipse(x, y + r * 0.12, u * r, r * 1.14, 0, Math.PI, TAU); ctx.stroke(); }
    }
    // volumen: luz del sol bajo (derecha, arriba) y sombra abajo a la izquierda
    let g = ctx.createRadialGradient(x + r * 0.4, y - r * 0.42, r * 0.08, x + r * 0.08, y + r * 0.05, r * 1.4);
    g.addColorStop(0, 'rgba(255,248,228,0.55)'); g.addColorStop(0.32, 'rgba(255,240,220,0.08)'); g.addColorStop(0.72, 'rgba(70,34,74,0.2)'); g.addColorStop(1, 'rgba(44,18,54,0.62)');
    ctx.fillStyle = g; ctx.fillRect(x - r * 1.1, y - r * 1.1, r * 2.2, r * 2.4);
    g = ctx.createLinearGradient(0, y + r * 0.4, 0, y + r * 1.2); g.addColorStop(0, 'rgba(44,20,52,0)'); g.addColorStop(1, 'rgba(44,20,52,0.5)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y + r * 0.4, r * 2, r * 0.82);
    // el quemador ilumina la tela por dentro
    if (burn > 0.02) {
      ctx.globalCompositeOperation = 'lighter';
      g = ctx.createRadialGradient(x, y + r * 1.15, 0, x, y + r * 1.15, r * 1.05);
      const f = burn * (0.8 + 0.2 * Math.sin(t * 31));
      g.addColorStop(0, `rgba(255,190,90,${0.55 * f})`); g.addColorStop(0.5, `rgba(255,120,50,${0.18 * f})`); g.addColorStop(1, 'rgba(255,100,40,0)');
      ctx.fillStyle = g; ctx.fillRect(x - r * 1.1, y, r * 2.2, r * 1.3);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
    // borde encendido por el sol
    ctx.strokeStyle = 'rgba(255,224,176,0.8)'; ctx.lineWidth = Math.max(1, r * 0.04);
    ctx.beginPath(); ctx.arc(x, y, r - r * 0.02, -Math.PI * 0.44, Math.PI * 0.14); ctx.stroke();
  }
  // canasta, cuerdas, quemador y pasajeros
  function basket(ctx, x, y, r, rope, bw, bh, burn, detail, t = 0, seed = 0) {
    const my = y + r * 1.18, bt = y + r + rope;
    ctx.strokeStyle = 'rgba(64,42,38,0.9)'; ctx.lineWidth = Math.max(0.8, r * 0.022); ctx.beginPath();
    for (const s of [-1, 1]) { ctx.moveTo(x + s * r * 0.2, my); ctx.lineTo(x + s * (bw / 2 - 1.5), bt); ctx.moveTo(x + s * r * 0.08, my); ctx.lineTo(x + s * bw * 0.2, bt); }
    ctx.stroke();
    // quemador
    ctx.fillStyle = '#4c4448'; ctx.fillRect(x - bw * 0.16, bt - bh * 0.42, bw * 0.32, bh * 0.2);
    if (burn > 0.05) {
      const fl = (14 + 16 * burn) * (r / 62) * (0.85 + 0.15 * Math.sin(t * 40 + seed)), fy = bt - bh * 0.42;
      const g = ctx.createLinearGradient(0, fy, 0, fy - fl);
      g.addColorStop(0, 'rgba(120,170,255,0.9)'); g.addColorStop(0.3, 'rgba(255,236,170,0.95)'); g.addColorStop(0.75, 'rgba(255,140,50,0.7)'); g.addColorStop(1, 'rgba(255,90,30,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - bw * 0.12, fy); ctx.quadraticCurveTo(x - bw * 0.14, fy - fl * 0.6, x, fy - fl); ctx.quadraticCurveTo(x + bw * 0.14, fy - fl * 0.6, x + bw * 0.12, fy); ctx.closePath(); ctx.fill();
    }
    // pasajeros: dos cabecitas (una saluda)
    if (detail) {
      const hr = bw * 0.11, py = bt - hr * 0.6;
      [[-0.26, '#e8b088', '#3a2a24', 0], [0.27, '#a8704c', '#1e1a1c', 1]].forEach(([u, skin, hair, k]) => {
        const px = x + u * bw;
        ctx.fillStyle = k ? '#2f6db0' : '#d0443c'; ctx.fillRect(px - hr * 1.1, py + hr * 0.7, hr * 2.2, hr * 1.6);
        ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(px, py, hr, 0, TAU); ctx.fill();
        ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(px, py - hr * 0.25, hr * 1.02, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
        if (k && Math.sin(t * 0.7 + seed) > 0.3) { const wv = Math.sin(t * 9 + seed) * 0.35; ctx.strokeStyle = skin; ctx.lineWidth = hr * 0.55; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px + hr * 0.9, py + hr * 1.2); ctx.lineTo(px + hr * 1.6 + wv * hr * 2, py - hr * 1.6); ctx.stroke(); }
      });
    }
    // canasta de mimbre
    const g = ctx.createLinearGradient(x - bw / 2, 0, x + bw / 2, 0);
    g.addColorStop(0, '#5e3a20'); g.addColorStop(0.6, '#a5733e'); g.addColorStop(1, '#cf9f62');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - bw / 2, bt); ctx.lineTo(x + bw / 2, bt); ctx.lineTo(x + bw / 2 - 2, bt + bh); ctx.lineTo(x - bw / 2 + 2, bt + bh); ctx.closePath(); ctx.fill();
    if (detail) {
      ctx.strokeStyle = 'rgba(60,34,18,0.45)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let yy = bt + 5; yy < bt + bh - 1; yy += 4.5) { ctx.moveTo(x - bw / 2 + 1, yy); ctx.lineTo(x + bw / 2 - 1, yy); }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,220,160,0.25)'; ctx.beginPath(); for (let xx = x - bw / 2 + 5; xx < x + bw / 2 - 2; xx += 6) { ctx.moveTo(xx, bt + 3); ctx.lineTo(xx, bt + bh - 1); } ctx.stroke();
    }
    ctx.fillStyle = '#4a2c18'; ctx.fillRect(x - bw / 2 - 1, bt - 1, bw + 2, Math.max(2, bh * 0.14));
  }
  function drawHot(ctx, b, t) {
    const C = HOTAIR_COLORS[b.c % HOTAIR_COLORS.length], r = b.r, HA = World.HA, sq = clamp(b.sq, -0.15, 0.15);
    basket(ctx, b.x, b.y, r, HA.rope, HA.bw, HA.bh, b.burn, !LOWFX, t, b.i * 3.1);
    ctx.save(); ctx.translate(b.x, b.y + r * 0.4); ctx.scale(1 + sq, 1 - sq); ctx.translate(-b.x, -b.y - r * 0.4);
    envelope(ctx, b.x, b.y, r, C, b.burn, t, !LOWFX);
    ctx.restore();
  }

  /* ---------- escenario ---------- */
  function drawGround(ctx, W, T, t, x0, x1, z) {
    const step = Math.max(6, 10 / z);
    let minY = Infinity;
    ctx.beginPath(); ctx.moveTo(x0, W.h + 400);
    for (let x = x0; x <= x1; x += step) { const y = W.groundY(x); if (y < minY) minY = y; ctx.lineTo(x, y); }
    ctx.lineTo(x1, W.h + 400); ctx.closePath();
    const g = ctx.createLinearGradient(0, minY, 0, minY + 460);
    g.addColorStop(0, T.ground[0]); g.addColorStop(0.35, T.ground[1]); g.addColorStop(1, T.ground[2]);
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.clip();
    // vetas de la toba y luz que baja del borde
    for (const [d, a, w] of LOWFX ? [[90, 0.14, 14]] : [[46, 0.16, 8], [96, 0.13, 13], [170, 0.11, 18], [260, 0.09, 22]]) {
      ctx.beginPath(); for (let x = x0; x <= x1; x += step * 2) { const y = W.groundY(x) * 0.75 + minY * 0.25 + d + Math.sin(x * 0.011 + d) * 7; x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.strokeStyle = d % 2 ? `rgba(255,236,206,${a})` : `rgba(140,70,80,${a})`; ctx.lineWidth = w; ctx.stroke();
    }
    ctx.beginPath(); for (let x = x0; x <= x1; x += step) { const y = W.groundY(x) + 12; x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.strokeStyle = 'rgba(255,230,170,0.16)'; ctx.lineWidth = 22; ctx.stroke();
    ctx.restore();
    ctx.beginPath(); for (let x = x0; x <= x1; x += step) { const y = W.groundY(x) + 1.5; x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.strokeStyle = T.rim; ctx.lineWidth = 3; ctx.stroke();
    // piedras de toba redondeadas
    for (let x = Math.floor(x0 / 260) * 260; x <= x1; x += 260) {
      if (h1(x, 1) < 0.5) continue;
      const rx = x + h1(x, 2) * 200, y = W.groundY(rx) + 4, r = 8 + h1(x, 3) * 12;
      const rg = ctx.createLinearGradient(rx - r, 0, rx + r, 0); rg.addColorStop(0, '#b98a80'); rg.addColorStop(0.7, '#ecd2b4'); rg.addColorStop(1, '#fbe6c8');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.ellipse(rx, y - r * 0.45, r, r * 0.7, 0, Math.PI, TAU); ctx.lineTo(rx + r, y); ctx.lineTo(rx - r, y); ctx.closePath(); ctx.fill();
    }
    // viñas en hileras (parras bajas con su estaca)
    for (let x = Math.floor(x0 / 24) * 24; x <= x1; x += 24) {
      if (h1(Math.floor(x / 480), 7) < 0.5 || Math.abs(W.slope(x)) > 0.25) continue;
      const y = W.groundY(x) + 2, sw2 = Math.sin(t * 1.3 + x * 0.05) * 0.8;
      ctx.strokeStyle = '#6b4a34'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 15); ctx.stroke();
      ctx.fillStyle = '#4f6a36'; ctx.beginPath(); ctx.ellipse(x + sw2, y - 13, 8, 6, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#8fae5a'; ctx.beginPath(); ctx.ellipse(x + 2 + sw2, y - 15, 4.6, 3.4, 0, 0, TAU); ctx.fill();
      if (!LOWFX && h1(x, 9) < 0.4) { ctx.fillStyle = '#6b2f5a'; ctx.beginPath(); ctx.arc(x - 3, y - 8, 1.8, 0, TAU); ctx.arc(x - 1, y - 7, 1.8, 0, TAU); ctx.fill(); }
    }
    // matas de pasto seco y amapolas
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#c9a160'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let x = Math.floor(x0 / 38) * 38; x <= x1; x += 38) {
      if (h1(x, 11) < 0.35) continue; const bx = x + h1(x, 12) * 26, y = W.groundY(bx) + 1, lean = Math.sin(t * 1.4 + bx * 0.04) * 3;
      for (let q = -2; q <= 2; q++) { ctx.moveTo(bx + q * 2, y); ctx.quadraticCurveTo(bx + q * 2.5 + lean * 0.4, y - 7, bx + q * 4 + lean, y - 11 - (2 - Math.abs(q)) * 3); }
    }
    ctx.stroke();
    if (!LOWFX) for (let x = Math.floor(x0 / 30) * 30; x <= x1; x += 30) {
      if (h1(x, 14) < 0.62) continue;
      const fx = x + h1(x, 15) * 22, y = W.groundY(fx), h = 7 + h1(x, 16) * 8, lean = Math.sin(t * 1.5 + fx * 0.05) * 2;
      ctx.strokeStyle = '#5c7a3e'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(fx, y + 1); ctx.lineTo(fx + lean, y - h); ctx.stroke();
      ctx.fillStyle = '#e63a2e'; ctx.beginPath(); ctx.arc(fx + lean, y - h, 3, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2a1416'; ctx.beginPath(); ctx.arc(fx + lean, y - h, 1, 0, TAU); ctx.fill();
    }
  }
  // térmicas: columna de aire tibio con motas que suben, flechas suaves y un águila arriba
  function drawThermals(ctx, W, t, x0, x1) {
    for (const T of W.thermals || []) {
      if (T.x + 220 < x0 || T.x - 220 > x1) continue;
      const g0 = W.groundY(T.x), top = W.ceil + 380, H = g0 - top, k = T.k;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(T.x - 165, 0, T.x + 165, 0);
      g.addColorStop(0, 'rgba(255,220,170,0)'); g.addColorStop(0.5, `rgba(255,220,170,${0.12 * k})`); g.addColorStop(1, 'rgba(255,220,170,0)');
      ctx.fillStyle = g;
      // se desvanece arriba (cuatro tajadas)
      for (let q = 0; q < 4; q++) { ctx.globalAlpha = (q + 1) / 5; ctx.fillRect(T.x - 165, top + q * 90, 330, 90); }
      ctx.globalAlpha = 1; ctx.fillRect(T.x - 165, top + 360, 330, H - 360);
      // flechas que suben
      ctx.strokeStyle = 'rgba(255,238,206,1)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let j = 0; j < 4; j++) {
        const u = ((t * (95 + 60 * k)) / H + j / 4) % 1, y = g0 - 60 - u * (H - 60), a = Math.sin(u * Math.PI) * 0.32 * k;
        ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(T.x - 22, y + 12); ctx.lineTo(T.x, y); ctx.lineTo(T.x + 22, y + 12); ctx.stroke();
      }
      // motas de polvo tibio
      ctx.fillStyle = 'rgba(255,244,222,1)';
      for (let i = 0, n = LOWFX ? 10 : 24; i < n; i++) {
        const u = ((t * (60 + 45 * k)) / H + h1(i, 5)) % 1, y = g0 - 16 - u * (H - 16), x = T.x + (h1(i, 9) - 0.5) * 230 + Math.sin(t * 1.3 + i * 2.1 + u * 7) * 16;
        ctx.globalAlpha = Math.sin(u * Math.PI) * 0.6 * k; ctx.beginPath(); ctx.arc(x, y, 1.5 + h1(i, 3) * 2.2, 0, TAU); ctx.fill();
      }
      ctx.restore();
      // el águila que planea en lo alto de la térmica
      const ea = t * 0.8 + T.ph, ex = T.x + Math.cos(ea) * 85, ey = top + 150 + Math.sin(ea) * 24, fl = Math.sin(t * 2 + T.ph) * 1.5, d = Math.cos(ea + Math.PI / 2) >= 0 ? 1 : -1;
      ctx.strokeStyle = '#3c2a30'; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.beginPath();
      ctx.moveTo(ex - 15, ey - 3 + fl); ctx.quadraticCurveTo(ex - 7, ey - 7 + fl, ex, ey); ctx.quadraticCurveTo(ex + 7, ey - 7 + fl, ex + 15, ey - 3 + fl); ctx.stroke();
      ctx.fillStyle = '#3c2a30'; ctx.beginPath(); ctx.ellipse(ex + d * 2, ey + 1, 4, 2, 0, 0, TAU); ctx.fill();
    }
  }
  // perfil irregular de un borde de roca (sin salirse más de 3 px de la caja)
  const jit = (s, k, a = 3) => (h1(s + k * 1.7, 5) - 0.5) * 2 * a;
  function rockBody(ctx, B, x0, x1, top, bot, P, s, flare) {
    const n = Math.max(5, Math.round((bot - top) / 34)), L = [], R = [];
    for (let k = 0; k <= n; k++) { const u = k / n, y = lerp(top, bot, u), f = flare ? Math.pow(u, 3) * flare : 0; L.push([x0 + 2 - f + jit(s, k, 3.2), y]); R.push([x1 - 2 + f + jit(s + 50, k, 3.2), y]); }
    ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]); for (const [x, y] of L) ctx.lineTo(x, y); for (let k = R.length - 1; k >= 0; k--) ctx.lineTo(R[k][0], R[k][1]); ctx.closePath();
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, P.shade); g.addColorStop(0.42, P.mid); g.addColorStop(0.82, P.lit); g.addColorStop(1, mix(P.lit, '#ffd9a0', 0.35));
    ctx.fillStyle = g; ctx.fill();
  }
  // una cueva tallada (ventana o puerta en arco); algunas con luz adentro
  function cave(ctx, x, y, w, h, lit, door) {
    ctx.beginPath(); ctx.moveTo(x - w / 2, y + h); ctx.lineTo(x - w / 2, y + w / 2); ctx.arc(x, y + w / 2, w / 2, Math.PI, TAU); ctx.lineTo(x + w / 2, y + h); ctx.closePath();
    if (lit) {
      const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#ffcf7a'); g.addColorStop(1, '#e08a3e'); ctx.fillStyle = g; ctx.fill();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const rg = ctx.createRadialGradient(x, y + h * 0.5, 0, x, y + h * 0.5, w * 1.8); rg.addColorStop(0, 'rgba(255,190,90,0.32)'); rg.addColorStop(1, 'rgba(255,190,90,0)'); ctx.fillStyle = rg; ctx.fillRect(x - w * 2, y + h * 0.5 - w * 2, w * 4, w * 4); ctx.restore();
    } else {
      const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#2a1719'); g.addColorStop(1, '#5a3430'); ctx.fillStyle = g; ctx.fill();
    }
    if (door) { ctx.fillStyle = '#6a3f26'; ctx.fillRect(x - w / 2 + 2, y + w * 0.55, w - 4, h - w * 0.55); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x - 0.6, y + w * 0.55, 1.2, h - w * 0.55); }
    // labio iluminado del lado del sol
    ctx.strokeStyle = 'rgba(255,240,214,0.55)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x + w / 2 + 1, y + h); ctx.lineTo(x + w / 2 + 1, y + w / 2); ctx.arc(x, y + w / 2, w / 2 + 1, 0, -Math.PI * 0.5, true); ctx.stroke();
  }
  // palomar: fila de agujeritos con la franja blanca pintada alrededor
  function dovecote(ctx, x, y, n) {
    const w = n * 6 + 6;
    ctx.fillStyle = 'rgba(255,246,232,0.62)'; ctx.beginPath(); ctx.moveTo(x - w / 2, y + 6); ctx.lineTo(x - w / 2, y - 2); ctx.quadraticCurveTo(x, y - 10, x + w / 2, y - 2); ctx.lineTo(x + w / 2, y + 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a2224'; for (let k = 0; k < n; k++) { ctx.beginPath(); ctx.arc(x - w / 2 + 6 + k * 6, y + 1.5, 1.7, 0, TAU); ctx.fill(); }
  }
  // vetas horizontales sobre la roca (recortadas a la figura)
  function bands(ctx, x0, x1, top, bot, list, s, gap = 46) {
    let k = 0;
    for (let y = top + 20 + h1(s, 1) * 20; y < bot; y += gap * (0.7 + h1(s, k) * 0.6), k++) { ctx.fillStyle = list[k % list.length]; ctx.fillRect(x0 - 20, y, x1 - x0 + 40, 4 + h1(s + k, 2) * 8); }
  }
  // manchas de la intemperie (la roca no es pareja)
  function stains(ctx, x0, x1, top, bot, s, n) {
    if (LOWFX) return;
    for (let k = 0; k < n; k++) {
      const x = lerp(x0, x1, h1(s, k + 200)), y = lerp(top, bot, h1(s, k + 230)), rx = 14 + h1(s, k + 260) * 30, ry = 20 + h1(s, k + 290) * 60;
      ctx.fillStyle = h1(s, k + 320) < 0.6 ? 'rgba(96,52,72,0.09)' : 'rgba(255,236,206,0.1)';
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
    }
  }
  // surcos de erosión: rayas verticales que bajan de la cornisa
  function grooves(ctx, x0, x1, top, bot, s, n) {
    ctx.strokeStyle = 'rgba(110,60,70,0.16)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k < n; k++) { const x = lerp(x0 + 8, x1 - 8, h1(s, k + 20)), y0 = top + h1(s, k + 40) * 40, y1 = lerp(y0, bot, 0.35 + h1(s, k + 60) * 0.5); ctx.moveTo(x, y0); ctx.quadraticCurveTo(x + jit(s, k, 5), (y0 + y1) / 2, x + jit(s, k + 3, 4), y1); }
    ctx.stroke();
  }
  function capHat(ctx, B, x0, x1, top, capH) {
    const w = x1 - x0, cx = (x0 + x1) / 2;
    ctx.beginPath(); ctx.moveTo(x0 + 6, top); ctx.lineTo(x1 - 6, top);
    ctx.quadraticCurveTo(x1 + 9, top + 1, x1 + 8, top + capH * 0.45); ctx.quadraticCurveTo(x1 + 3, top + capH * 0.86, x1 - w * 0.2, top + capH);
    ctx.lineTo(x0 + w * 0.2, top + capH); ctx.quadraticCurveTo(x0 - 3, top + capH * 0.86, x0 - 8, top + capH * 0.45); ctx.quadraticCurveTo(x0 - 9, top + 1, x0 + 6, top); ctx.closePath();
    let g = ctx.createLinearGradient(0, top, 0, top + capH);
    g.addColorStop(0, TUFF.capLit); g.addColorStop(0.22, TUFF.cap); g.addColorStop(1, TUFF.capDark);
    ctx.fillStyle = g; ctx.fill();
    g = ctx.createLinearGradient(x0 - 8, 0, x1 + 8, 0); g.addColorStop(0, 'rgba(30,20,30,0.35)'); g.addColorStop(0.6, 'rgba(30,20,30,0)'); g.addColorStop(1, 'rgba(255,200,150,0.22)');
    ctx.fillStyle = g; ctx.fill();
    // borde de arriba al sol
    ctx.strokeStyle = 'rgba(255,214,170,0.75)'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(x0 + 4, top + 1); ctx.lineTo(x1 - 4, top + 1); ctx.stroke();
    // grietas del basalto
    ctx.strokeStyle = 'rgba(20,12,18,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx - w * 0.2, top + 3); ctx.lineTo(cx - w * 0.15, top + capH * 0.6); ctx.moveTo(cx + w * 0.25, top + 4); ctx.lineTo(cx + w * 0.3, top + capH * 0.75); ctx.stroke();
  }
  function drawChimney(ctx, B, t) {
    const w = B.x1 - B.x0, top = B.top, gy = B.ground + 14, s = B.i * 13.7 + 3, capH = clamp(w * 0.34, 28, 42);
    rockBody(ctx, B, B.x0, B.x1, top + capH * 0.6, gy, TUFF, s, 16);
    ctx.save(); ctx.clip();
    // más rosado hacia la base, sombra bajo el sombrero
    let g = ctx.createLinearGradient(0, top, 0, gy); g.addColorStop(0, 'rgba(255,226,180,0.1)'); g.addColorStop(0.6, 'rgba(150,80,100,0.08)'); g.addColorStop(1, 'rgba(90,40,70,0.38)'); ctx.fillStyle = g; ctx.fillRect(B.x0 - 20, top, w + 40, gy - top);
    bands(ctx, B.x0, B.x1, top + capH, gy, ['rgba(255,244,222,0.26)', 'rgba(170,96,100,0.12)'], s, 52);
    stains(ctx, B.x0, B.x1, top + capH, gy, s, Math.round((gy - top) / 90));
    grooves(ctx, B.x0, B.x1, top + capH, gy, s, Math.round(w / 22));
    g = ctx.createLinearGradient(0, top + capH * 0.6, 0, top + capH + 34); g.addColorStop(0, 'rgba(40,20,30,0.45)'); g.addColorStop(1, 'rgba(40,20,30,0)'); ctx.fillStyle = g; ctx.fillRect(B.x0 - 20, top + capH * 0.6, w + 40, capH + 34);
    // cuevas, palomares y la puerta tallada
    let k = 0;
    for (let y = top + capH + 40; y < gy - 100; y += 64 + h1(s, k) * 24, k++) {
      const n = w > 100 ? 2 : 1;
      for (let q = 0; q < n; q++) {
        const r = h1(s + k * 3, q + 1); if (r < 0.25) continue;
        const cw = 11 + h1(s + k, q + 5) * 5, x = lerp(B.x0 + 16 + cw / 2, B.x1 - 16 - cw / 2, n === 1 ? 0.25 + h1(s, k + q) * 0.5 : (q + 0.15 + h1(s, k * 2 + q) * 0.7) / n);
        if (r > 0.86 && !LOWFX) dovecote(ctx, x, y + 6, 3 + Math.floor(h1(s, k + 9) * 3));
        else cave(ctx, x, y, cw, cw * 1.55, h1(s + k, q + 9) < 0.22, false);
      }
    }
    if (h1(s, 77) < 0.7) { const dx = lerp(B.x0 + 20, B.x1 - 20, 0.3 + h1(s, 78) * 0.4); cave(ctx, dx, gy - 14 - 42, 20, 42, false, true); ctx.fillStyle = 'rgba(255,236,206,0.5)'; ctx.fillRect(dx - 14, gy - 15, 28, 3); ctx.fillRect(dx - 11, gy - 19, 22, 3); }
    ctx.restore();
    capHat(ctx, B, B.x0, B.x1, top, capH);
  }
  // roca maciza sobre dos patas (la roca-castillo, en dos escalones, y el arco): masa, patas y guirnalda de faroles
  function drawMass(ctx, B, W, t, arch) {
    const P = arch ? ROSE : TUFF, s = B.i * 17.3 + 9, w = B.x1 - B.x0, bot = B.bottom;
    const legs = B.legs || [], C = arch ? null : W.buildings.find(T => T.style === 'castleTop' && T.x0 > B.x0 && T.x1 < B.x1);
    const top = C ? C.top : B.top;
    // el pasadizo de abajo: la pared del fondo en sombra (se ve hondo: por ahí se pasa volando) y las patas, atrás
    if (legs.length) {
      const gl = Math.max(...legs.map(L => L.ground)) + 14, g = ctx.createLinearGradient(0, bot, 0, gl);
      g.addColorStop(0, mix(P.deep, '#1c1020', 0.45)); g.addColorStop(0.6, mix(P.deep, '#1c1020', 0.2)); g.addColorStop(1, P.deep);
      ctx.fillStyle = g; ctx.fillRect(B.x0 + 6, bot - 2, w - 12, gl - bot);
      // cuevitas del fondo y una luz al final del pasadizo
      for (let k = 0; k < Math.round(w / 70); k++) { const x = lerp(B.x0 + 40, B.x1 - 40, h1(s, k + 500)), y = lerp(bot + 40, gl - 50, h1(s, k + 530)); ctx.fillStyle = 'rgba(16,8,16,0.4)'; ctx.beginPath(); ctx.ellipse(x, y, 7, 11, 0, 0, TAU); ctx.fill(); }
      for (const L of legs) {
        rockBody(ctx, L, L.x0, L.x1, bot - 4, L.ground + 14, P, s + L.x0, 12);
        const g2 = ctx.createLinearGradient(L.x0, 0, L.x1, 0); g2.addColorStop(0, mix(P.deep, P.shade, 0.3)); g2.addColorStop(1, mix(P.shade, P.mid, 0.4)); ctx.fillStyle = g2; ctx.fill();
        ctx.save(); ctx.clip(); bands(ctx, L.x0, L.x1, bot, L.ground + 14, ['rgba(255,220,190,0.1)', 'rgba(40,16,30,0.12)'], s + L.x0, 40); ctx.restore();
      }
    }
    // la silueta: esquinas redondeadas (un poco hacia afuera, para que la roca dibujada y la que choca coincidan)
    const lx0 = legs.length ? Math.min(...legs.map(L => L.x1)) : B.x0, lx1 = legs.length ? Math.max(...legs.map(L => L.x0)) : B.x1;
    const e = 3, rb = arch ? 30 : 24, rt = 34, fr = arch ? 34 : 18;
    const topEdge = (xa, xb, y, k0) => { const n = Math.max(3, Math.round((xb - xa) / 34)); for (let k = 1; k < n; k++) ctx.lineTo(lerp(xa, xb, k / n), y - e + Math.abs(jit(s, k + k0, 2.5))); };
    ctx.beginPath(); ctx.moveTo(B.x0 - e, bot);
    ctx.lineTo(B.x0 - e + jit(s, 1, 1.5), B.top + rb); ctx.quadraticCurveTo(B.x0 - e, B.top - e, B.x0 + rb, B.top - e);
    if (C) {
      topEdge(B.x0 + rb, C.x0 - 12, B.top, 10); ctx.quadraticCurveTo(C.x0 - e, B.top - e, C.x0 - e, B.top - 14);
      ctx.lineTo(C.x0 - e + jit(s, 3, 1.5), C.top + rt); ctx.quadraticCurveTo(C.x0 - e, C.top - e, C.x0 + rt, C.top - e);
      topEdge(C.x0 + rt, C.x1 - rt, C.top, 30);
      ctx.lineTo(C.x1 - rt, C.top - e); ctx.quadraticCurveTo(C.x1 + e, C.top - e, C.x1 + e, C.top + rt); ctx.lineTo(C.x1 + e + jit(s, 4, 1.5), B.top - 14);
      ctx.quadraticCurveTo(C.x1 + e, B.top - e, C.x1 + 12, B.top - e); topEdge(C.x1 + 12, B.x1 - rb, B.top, 50);
    } else topEdge(B.x0 + rb, B.x1 - rb, B.top, 10);
    ctx.lineTo(B.x1 - rb, B.top - e); ctx.quadraticCurveTo(B.x1 + e, B.top - e, B.x1 + e, B.top + rb); ctx.lineTo(B.x1 + e + jit(s, 2, 1.5), bot);
    // por debajo: el hueco entre las patas, con las esquinas de arriba redondeadas
    ctx.lineTo(lx1, bot); ctx.lineTo(lx1, bot + fr); ctx.quadraticCurveTo(lx1, bot, lx1 - fr, bot);
    ctx.lineTo(lx0 + fr, bot); ctx.quadraticCurveTo(lx0, bot, lx0, bot + fr); ctx.lineTo(lx0, bot); ctx.closePath();
    let g = ctx.createLinearGradient(B.x0, 0, B.x1, 0);
    g.addColorStop(0, P.shade); g.addColorStop(0.4, P.mid); g.addColorStop(0.85, P.lit); g.addColorStop(1, mix(P.lit, '#ffd9a0', 0.35));
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.clip();
    g = ctx.createLinearGradient(0, top, 0, bot); g.addColorStop(0, 'rgba(255,226,186,0.14)'); g.addColorStop(1, 'rgba(110,52,80,0.3)'); ctx.fillStyle = g; ctx.fillRect(B.x0 - 10, top - 10, w + 20, bot - top + 60);
    // la cima del castillo, más iluminada; sombra donde se apoya sobre la base
    if (C) { g = ctx.createLinearGradient(C.x0, 0, C.x1, 0); g.addColorStop(0, 'rgba(70,30,60,0.18)'); g.addColorStop(1, 'rgba(255,220,170,0.16)'); ctx.fillStyle = g; ctx.fillRect(C.x0 - 6, C.top - 6, C.x1 - C.x0 + 12, B.top - C.top + 6); g = ctx.createLinearGradient(0, B.top, 0, B.top + 40); g.addColorStop(0, 'rgba(70,30,60,0.3)'); g.addColorStop(1, 'rgba(70,30,60,0)'); ctx.fillStyle = g; ctx.fillRect(B.x0, B.top, w, 40); }
    bands(ctx, B.x0, B.x1, top, bot, arch ? P.bands : ['rgba(255,240,214,0.2)', 'rgba(150,80,96,0.12)', 'rgba(255,214,170,0.14)'], s, arch ? 30 : 50);
    stains(ctx, B.x0, B.x1, top, bot, s, Math.round(w * (bot - top) / 9000));
    grooves(ctx, B.x0, B.x1, top, bot, s, Math.round(w / 18));
    // sombra en la panza del arco
    g = ctx.createLinearGradient(0, bot - 50, 0, bot + fr); g.addColorStop(0, 'rgba(60,28,48,0)'); g.addColorStop(1, 'rgba(60,28,48,0.55)'); ctx.fillStyle = g; ctx.fillRect(lx0, bot - 50, lx1 - lx0, 50 + fr);
    if (!arch) {
      // cuevas desparramadas (unas grandes, otras chiquitas), repisas sueltas y puertas abajo
      for (let k = 0, n = Math.round(w * (bot - top) / 5600); k < n; k++) {
        let x = B.x0 + 22 + h1(s, k * 3) * (w - 44); const y = top + 40 + h1(s, k * 3 + 1) * (bot - top - 110), r = h1(s, k * 3 + 2), cw = 9 + r * 11;
        if (C && y < B.top + 10) x = C.x0 + 18 + h1(s, k * 3) * (C.x1 - C.x0 - 36);
        if (r > 0.93 && !LOWFX) dovecote(ctx, x, y + 6, 3);
        else cave(ctx, x, y, cw, cw * (1.3 + h1(s, k + 90) * 0.5), h1(s + k, 30) < 0.16, r > 0.82 && y > B.top + 60);
        if (h1(s, k + 120) < 0.18) { ctx.fillStyle = 'rgba(255,236,206,0.35)'; ctx.fillRect(x - cw * 1.4, y + cw * 1.9, cw * 2.8, 2); ctx.fillStyle = 'rgba(70,34,48,0.22)'; ctx.fillRect(x - cw * 1.4, y + cw * 1.9 + 2, cw * 2.8, 3); }
      }
    } else {
      // el arco del Valle Rosa: una capillita tallada con su puerta y dos ventanitas
      const cx = B.x0 + w * 0.62, cy = B.top + (bot - B.top) * 0.36;
      cave(ctx, cx, cy, 22, 40, false, true); cave(ctx, cx - 34, cy + 6, 11, 16, true, false); cave(ctx, cx + 34, cy + 6, 11, 16, false, false);
      ctx.strokeStyle = 'rgba(255,240,214,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy + 11, 18, Math.PI, TAU); ctx.stroke();
    }
    ctx.restore();
    // matas secas encima (chiquitas: se posa igual)
    ctx.strokeStyle = '#b08850'; ctx.lineWidth = 1.3; ctx.lineCap = 'round'; ctx.beginPath();
    for (const [xa, xb, y] of C ? [[B.x0 + 10, C.x0 - 10, B.top], [C.x0 + 8, C.x1 - 8, C.top], [C.x1 + 10, B.x1 - 10, B.top]] : [[B.x0 + 14, B.x1 - 14, B.top]]) {
      for (let k = 0; k < 3; k++) { const x = lerp(xa, xb, h1(s, k + 400 + y)), lean = Math.sin(t * 1.3 + x * 0.05) * 1.5; for (let q = -1; q <= 1; q++) { ctx.moveTo(x + q * 2, y - 1); ctx.lineTo(x + q * 3 + lean, y - 6 - (1 - Math.abs(q)) * 2); } }
    }
    ctx.stroke();
    // bandera en la cima de la roca-castillo
    if (C) {
      const fx = C.x0 + (C.x1 - C.x0) * 0.6, fy = C.top - 74;
      ctx.strokeStyle = '#d8d0c4'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(fx, C.top + 2); ctx.lineTo(fx, fy); ctx.stroke();
      ctx.fillStyle = '#d8232a'; ctx.beginPath(); ctx.moveTo(fx, fy);
      for (let k = 0; k <= 8; k++) { const u = k / 8; ctx.lineTo(fx + u * 46, fy + Math.sin(t * 5 - u * 5) * 3 * u); }
      for (let k = 8; k >= 0; k--) { const u = k / 8; ctx.lineTo(fx + u * 46, fy + 30 + Math.sin(t * 5 - u * 5) * 3 * u); }
      ctx.closePath(); ctx.fill();
      const mx = fx + 17, my = fy + 15 + Math.sin(t * 5 - 1.8) * 1.1;
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(mx, my, 8, 0, TAU); ctx.fill();
      ctx.fillStyle = '#d8232a'; ctx.beginPath(); ctx.arc(mx + 2.6, my, 6.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr2 = k % 2 ? 1.5 : 3.6; ctx.lineTo(mx + 9 + Math.cos(a) * rr2, my + Math.sin(a) * rr2); } ctx.closePath(); ctx.fill();
    }
    // guirnalda de faroles en el hueco (luces cálidas del amanecer)
    if (legs.length === 2) {
      const ax = lx0 + 6, bx = lx1 - 6, ay = bot + fr * 0.6, sag = 22;
      ctx.strokeStyle = 'rgba(60,40,40,0.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo((ax + bx) / 2, ay + sag * 2, bx, ay); ctx.stroke();
      const cnt = Math.max(4, Math.round((bx - ax) / 30));
      for (let k = 1; k < cnt; k++) {
        const u = k / cnt, x = lerp(ax, bx, u), y = (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * (ay + sag * 2) + u * u * ay + 4, f = 0.75 + 0.25 * Math.sin(t * 3 + k * 1.7);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; const rg = ctx.createRadialGradient(x, y, 0, x, y, 16); rg.addColorStop(0, `rgba(255,190,90,${0.45 * f})`); rg.addColorStop(1, 'rgba(255,190,90,0)'); ctx.fillStyle = rg; ctx.fillRect(x - 16, y - 16, 32, 32); ctx.restore();
        ctx.fillStyle = k % 3 === 0 ? '#ff6a4a' : k % 3 === 1 ? '#ffd36a' : '#7ad0ff'; ctx.beginPath(); ctx.ellipse(x, y, 3.2, 4.2, 0, 0, TAU); ctx.fill();
      }
    }
  }
  function drawStage(ctx, G, cam, sw, sh) {
    const W = G.world, T = THEMES.capadocia, t = G.time;
    const x0 = cam.x - sw / 2 / cam.z - 80, x1 = cam.x + sw / 2 / cam.z + 80;
    drawGround(ctx, W, T, t, x0, x1, cam.z);
    drawThermals(ctx, W, t, x0, x1);
    for (const B of W.buildings) {
      if (B.style === 'leg' || B.style === 'castleTop' || B.x1 + 60 < x0 || B.x0 - 60 > x1) continue;
      if (B.style === 'chimney') drawChimney(ctx, B, t); else drawMass(ctx, B, W, t, B.style === 'arch');
    }
    if (W.hotair) for (const b of W.hotair) if (b.x + 110 > x0 && b.x - 110 < x1) drawHot(ctx, b, t);
  }
  // bruma de la mañana en el fondo del valle, con jirones que pasan
  function drawHaze(ctx, G, cam, sw, sh) {
    const W = G.world, T = THEMES.capadocia, t = G.time;
    const by = W.def.ground(cam.x) - 30, top = by - 240;
    const g = ctx.createLinearGradient(0, top, 0, by + 60);
    g.addColorStop(0, `rgba(${T.fog},0)`); g.addColorStop(0.7, `rgba(${T.fog},0.2)`); g.addColorStop(1, `rgba(${T.fog},0.06)`);
    ctx.fillStyle = g; ctx.fillRect(cam.x - sw / 2 / cam.z, top, sw / cam.z, 310);
    if (LOWFX) return;
    ctx.save(); ctx.globalAlpha = 0.16;
    for (let i = 0; i < 5; i++) {
      const x = ((i * 910 + t * (14 + i * 4)) % (W.w + 1200)) - 600, y = W.groundY(clamp(x, 0, W.w)) - 110 - (i % 3) * 60;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, 240); rg.addColorStop(0, `rgba(${T.fog},0.9)`); rg.addColorStop(1, `rgba(${T.fog},0)`);
      ctx.fillStyle = rg; ctx.save(); ctx.translate(x, y); ctx.scale(2.4, 0.45); ctx.translate(-x, -y); ctx.beginPath(); ctx.arc(x, y, 240, 0, TAU); ctx.fill(); ctx.restore();
    }
    ctx.restore();
  }
  return { drawBackground, drawStage, drawHaze };
})();
