/* =========================================================================
   TINTA VIVA (Mundo 3) — el mundo es un pergamino pintado sobre papel.
   · El suelo de cada estación se pinta una vez (papel de fibra, aguadas
     con bordes que se encharcan, contornos de pincel que se quiebran,
     doble línea de orilla, rocas sumi-e con puntos de musgo, hierba de
     trazos rápidos, hojarasca, pétalos, nieve con sombras azules).
   · Cada panel muestra la estación que dice su cuadrícula (T.sea): si
     cambia, una pincelada barre el panel y lo repinta. Así el remoto en
     línea ve lo mismo sin mandar nada extra.
   · Árboles por estación (pino, cerezo, arce, bambú), toriis bermellón,
     nubes doradas entre paneles, partículas de la estación, mesa y
     rodillos del pergamino alrededor, grano de papel sobre todo.
   ========================================================================= */
const ArtInk = (() => {
  const INK = '#1d1817', INKRGB = '29,24,23';
  const PAL = {
    spring: { grass: [[182, 210, 144], [166, 202, 134], [198, 220, 160]], tuft: ['#55804a', '#6f9a55', '#3f6a3a', '#8aac62'], path: [[228, 210, 170], [220, 200, 160]], stone: [[198, 194, 184], [186, 182, 174]], water: [[156, 192, 210], [98, 142, 180]], wInk: '47,85,122', flower: ['#f3a3c0', '#ffffff', '#f8c8da', '#e57fa6'], rock: [[164, 160, 152], [104, 100, 98]], fert: [[120, 96, 72]] },
    summer: { grass: [[128, 182, 100], [112, 168, 90], [148, 194, 114]], tuft: ['#2d6a34', '#3f7e3c', '#21582a', '#5a9248'], path: [[224, 200, 152], [214, 190, 142]], stone: [[192, 190, 182], [178, 176, 170]], water: [[112, 166, 200], [46, 92, 146]], wInk: '30,62,104', flower: ['#ffffff', '#f6e27a', '#86aef0', '#c8a0f0'], rock: [[150, 150, 146], [88, 88, 88]], fert: [[106, 84, 60]] },
    autumn: { grass: [[222, 184, 114], [208, 158, 90], [230, 198, 130]], tuft: ['#8a6326', '#a3702a', '#6e5626', '#b8863a'], path: [[226, 204, 158], [214, 192, 148]], stone: [[194, 188, 176], [180, 174, 164]], water: [[146, 174, 190], [80, 114, 140]], wInk: '46,72,96', flower: ['#d2452a', '#e8762a', '#eab040', '#b8341f'], rock: [[160, 150, 138], [100, 92, 86]], fert: [[110, 82, 56]] },
    winter: { grass: [[238, 241, 245], [226, 233, 241], [246, 247, 249]], tuft: ['#5c544c', '#443e38', '#7a7268'], path: [[196, 184, 166], [184, 172, 154]], stone: [[188, 192, 198], [170, 176, 186]], water: [[182, 204, 224], [146, 176, 206]], wInk: '70,100,130', flower: ['#ffffff'], rock: [[150, 154, 160], [92, 96, 104]], fert: [[150, 140, 126]] },
  };
  const rnd = (i, k) => hash2(i * 1.37 + k * 17.1, k * 3.71 - i * 0.23);
  const on = G => !!(G && G.A && THEMES[G.A.theme] && THEMES[G.A.theme].ink);
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  const rgb = (a, al = 1) => `rgba(${a[0] | 0},${a[1] | 0},${a[2] | 0},${al})`;
  const lerp3 = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];

  /* ---------- papel ---------- */
  let paperTile = null;
  function paper() {
    if (paperTile) return paperTile;
    const c = mk(256, 256), x = c.getContext('2d'), id = x.createImageData(256, 256), D = id.data;
    for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) {
      // fibras largas (ruido estirado) + motas + grano fino; se repite sin costuras (ruido periódico a mano)
      const u = i / 256 * TAU, v = j / 256 * TAU;
      const f1 = noise2(Math.cos(u) * 3 + 11, Math.sin(u) * 3 + j / 9) * 0.6 + noise2(i / 5 + Math.sin(v) * 2, Math.cos(v) * 2 + 3) * 0.4;
      const g = hash2(i * 3.1, j * 7.3), spk = g > 0.996 ? -60 : g < 0.003 ? 30 : 0;
      const val = 238 + (f1 - 0.5) * 22 + (hash2(i, j) - 0.5) * 10 + spk, o = (j * 256 + i) * 4;
      D[o] = val + 4; D[o + 1] = val; D[o + 2] = val - 12; D[o + 3] = 255;
    }
    x.putImageData(id, 0, 0);
    // hebras
    x.lineCap = 'round';
    for (let k = 0; k < 70; k++) { const sx = hash2(k, 1) * 256, sy = hash2(k, 2) * 256, a = hash2(k, 3) * TAU, L = 6 + hash2(k, 4) * 22; x.strokeStyle = hash2(k, 5) < 0.6 ? 'rgba(255,252,240,0.55)' : 'rgba(150,130,100,0.22)'; x.lineWidth = 0.6 + hash2(k, 6) * 0.8; x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(sx + Math.cos(a + 0.6) * L * 0.5, sy + Math.sin(a + 0.6) * L * 0.5, sx + Math.cos(a) * L, sy + Math.sin(a) * L); x.stroke(); }
    return (paperTile = c);
  }
  // mancha de aguada: el pigmento se encharca en el borde (más oscuro en el filo que en el centro)
  const washes = {};
  function wash(rgbS, a = 1) {
    const k = rgbS + a; if (washes[k]) return washes[k];
    const c = mk(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, `rgba(${rgbS},${0.55 * a})`); g.addColorStop(0.72, `rgba(${rgbS},${0.7 * a})`); g.addColorStop(0.86, `rgba(${rgbS},${0.9 * a})`); g.addColorStop(1, `rgba(${rgbS},0)`);
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); return (washes[k] = c);
  }
  // trazo de pincel: grueso al medio, fino en las puntas, con hilos de pincel seco
  function brush(x, pts, w, col, alpha = 1, dry = 0.35) {
    if (pts.length < 2) return;
    const n = pts.length, L = [], R = [];
    for (let k = 0; k < n; k++) {
      const p = pts[k], q = pts[Math.min(n - 1, k + 1)], o = pts[Math.max(0, k - 1)], dx = q[0] - o[0], dy = q[1] - o[1], l = hypot(dx, dy) || 1;
      const t = k / (n - 1), ww = w * (0.25 + 0.75 * Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.04))) * 0.5;
      L.push([p[0] - dy / l * ww, p[1] + dx / l * ww]); R.push([p[0] + dy / l * ww, p[1] - dx / l * ww]);
    }
    x.globalAlpha = alpha; x.fillStyle = col; x.beginPath(); x.moveTo(L[0][0], L[0][1]);
    for (let k = 1; k < n; k++) x.lineTo(L[k][0], L[k][1]); for (let k = n - 1; k >= 0; k--) x.lineTo(R[k][0], R[k][1]); x.closePath(); x.fill();
    if (dry > 0) { x.strokeStyle = col; x.lineWidth = Math.max(0.5, w * 0.12); x.globalAlpha = alpha * dry; for (let s = -1; s <= 1; s += 2) { x.beginPath(); for (let k = 0; k < n; k++) { const p = pts[k], f = 0.5 + 0.18 * s; const px = L[k][0] * f + R[k][0] * (1 - f) + s * w * 0.32, py = L[k][1] * f + R[k][1] * (1 - f); k ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); } }
    x.globalAlpha = 1;
  }

  /* ---------- el suelo de una estación ---------- */
  const cache = {}, fields = {};
  function scaleOf(T) { return clamp(Math.sqrt(2.7e6 / (T.W * T.H)), 0.85, 1.25) * (LOWFX ? 0.8 : 1); }
  // lo que no depende de la estación se calcula una sola vez por mapa: qué hay en cada punto (con orillas
  // orgánicas), la distancia a la orilla y el ruido del pigmento
  const kindOf = t => t === TT.DEEP || t === TT.SHALLOW ? 1 : t === TT.CHASM ? 2 : t === TT.DIRT ? 3 : t === TT.STONE ? 4 : t === TT.ROCK ? 5 : t === TT.FERTILE ? 6 : 0;
  function field(G) {
    const T = G.T, B = T.base0 || T.base, key = G.arena + ':' + T.W + 'x' + T.H + ':' + hashBase(B); if (fields[key]) return fields[key];
    const type = i => { const b = B[i]; return b === TT.BUSH ? TT.GRASS : b === TT.BRIDGE ? TT.DEEP : b; };
    const R = 5, lw = Math.ceil(T.W / R), lh = Math.ceil(T.H / R), n = lw * lh, KIND = new Uint8Array(n), N1 = new Float32Array(n), N2 = new Float32Array(n);
    for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) {
      const wx = i * R + R / 2, wy = j * R + R / 2, p = j * lw + i;
      const ox = (fbm2(wx / 110, wy / 110, 3) - 0.5) * 64 + (noise2(wx / 26 + 5.3, wy / 26) - 0.5) * 14, oy = (fbm2(wx / 110 + 31, wy / 110 + 17, 3) - 0.5) * 64 + (noise2(wx / 26, wy / 26 + 9.1) - 0.5) * 14;
      const ci = Terrain.idx(T, clamp(wx + ox, 0, T.W - 1), clamp(wy + oy, 0, T.H - 1)); KIND[p] = ci < 0 ? 5 : kindOf(type(ci));
      N1[p] = fbm2(wx / 160, wy / 160, 3); N2[p] = noise2(wx / 40, wy / 40);
    }
    // dos pasadas de «mayoría» entre agua y tierra: orillas redondeadas, sin escalones de las celdas
    for (let pass = 0; pass < 2; pass++) { const src = KIND.slice(); for (let j = 1; j < lh - 1; j++) for (let i = 1; i < lw - 1; i++) { const p = j * lw + i, k = src[p]; if (k !== 0 && k !== 1 && k !== 3) continue; let w = 0, l = 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const q = src[p + dj * lw + di]; if (q === 1) w++; else if (q === 0 || q === 3) l++; } if (k === 1 && l >= 6) KIND[p] = src[p + 1] === 3 || src[p - 1] === 3 ? 3 : 0; else if (k !== 1 && w >= 6) KIND[p] = 1; } }
    // la orilla: máscara del agua desenfocada y cortada a la mitad (las esquinas de las celdas se vuelven curvas)
    { const M = new Float32Array(n), tmp = new Float32Array(n), rad = 4; for (let p = 0; p < n; p++) M[p] = KIND[p] === 1 ? 1 : 0;
      for (let pass = 0; pass < 2; pass++) {
        for (let j = 0; j < lh; j++) { let s = 0; for (let i = -rad; i <= rad; i++) s += M[j * lw + clamp(i, 0, lw - 1)]; for (let i = 0; i < lw; i++) { tmp[j * lw + i] = s / (2 * rad + 1); s += M[j * lw + Math.min(lw - 1, i + rad + 1)] - M[j * lw + Math.max(0, i - rad)]; } }
        for (let i = 0; i < lw; i++) { let s = 0; for (let j = -rad; j <= rad; j++) s += tmp[clamp(j, 0, lh - 1) * lw + i]; for (let j = 0; j < lh; j++) { M[j * lw + i] = s / (2 * rad + 1); s += tmp[Math.min(lh - 1, j + rad + 1) * lw + i] - tmp[Math.max(0, j - rad) * lw + i]; } } }
      for (let p = 0; p < n; p++) { const k = KIND[p]; if (k === 1 && M[p] < 0.5) KIND[p] = 0; else if ((k === 0 || k === 3) && M[p] >= 0.5) KIND[p] = 1; } }
    const DIST = new Uint8Array(n).fill(255), q = [];
    for (let p = 0; p < n; p++) if (KIND[p] !== 1) { DIST[p] = 0; q.push(p); }
    for (let h = 0; h < q.length; h++) { const p = q[h], pi = p % lw, pj = (p / lw) | 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = pi + di, nj = pj + dj; if (ni < 0 || nj < 0 || ni >= lw || nj >= lh) continue; const np = nj * lw + ni; if (DIST[np] > DIST[p] + 1) { DIST[np] = DIST[p] + 1; q.push(np); } } }
    return (fields[key] = { R, lw, lh, KIND, DIST, N1, N2, type });
  }
  function hashBase(B) { let h = 0; for (let i = 0; i < B.length; i += 3) h = (h * 31 + B[i]) | 0; return h; }
  // contornos de pincel: tramos cortos entre puntos vecinos del borde, en tres grosores (un solo trazo por grosor)
  function contour(x, F, test, wfn, col, alpha, gapK) {
    const { R, lw, lh } = F, paths = [new Path2D(), new Path2D(), new Path2D()];
    for (let j = 1; j < lh - 1; j++) for (let i = 1; i < lw - 1; i++) {
      const p = j * lw + i; if (!test(p)) continue; const wx = i * R + R / 2, wy = j * R + R / 2;
      if (noise2(wx / 22 + 7, wy / 22) < gapK) continue; // el pincel se seca
      const b = Math.min(2, Math.floor(wfn(wx, wy) * 3));
      for (const [di, dj] of [[1, 0], [0, 1], [1, 1], [1, -1]]) { const qq = p + dj * lw + di; if (test(qq)) { paths[b].moveTo(wx, wy); paths[b].lineTo(wx + di * R, wy + dj * R); } }
    }
    x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = col;
    for (let b = 0; b < 3; b++) { x.globalAlpha = alpha * (0.75 + b * 0.15); x.lineWidth = [1.1, 2, 3.2][b]; x.stroke(paths[b]); }
    x.globalAlpha = 1;
  }
  function prerender(G, season) {
    const key = G.arena + '|' + season + '|' + (LOWFX ? 1 : 0) + '|' + (G.cellLook ? G.cellLook.size : 0); if (cache[key]) return cache[key];
    const T = G.T, th = THEMES[G.A.theme], P = Object.assign({}, PAL[season], (th.pal && th.pal[season]) || {}), S = scaleOf(T), F = field(G), { R, lw, lh, KIND, DIST, N1, N2, type } = F, B = T.base0 || T.base;
    const c = mk(T.W * S, T.H * S), x = c.getContext('2d'); x.scale(S, S);
    // 0. papel
    x.fillStyle = x.createPattern(paper(), 'repeat'); x.fillRect(0, 0, T.W, T.H);
    // 1. aguadas a baja resolución: el color de cada zona, con algo de papel que se trasluce
    const lc = mk(lw, lh), lx = lc.getContext('2d'), id = lx.createImageData(lw, lh), D = id.data;
    for (let p = 0; p < lw * lh; p++) {
      const k = KIND[p], n1 = N1[p], n2 = N2[p];
      const pick = arr => { const ix = Math.min(arr.length - 1, Math.floor(n1 * arr.length * 1.15)); return lerp3(arr[ix], arr[(ix + 1) % arr.length], n2 * 0.5); };
      let col = k === 1 ? lerp3(P.water[0], P.water[1], Math.min(1, DIST[p] / 12) * (0.8 + n2 * 0.2)) : k === 2 ? (th.voidSky ? lerp3([178, 200, 232], [246, 226, 206], Math.min(1, (p / lw) / lh * 1.2)) : [14, 11, 14]) : k === 3 ? pick(P.path) : k === 4 ? pick(P.stone) : k === 6 ? pick(P.fert) : pick(P.grass);
      if (k !== 2) col = lerp3(col, [244, 236, 220], 0.04 + 0.09 * (1 - n2));
      const o = p * 4; D[o] = col[0]; D[o + 1] = col[1]; D[o + 2] = col[2]; D[o + 3] = 255;
    }
    for (let pass = 0; pass < 2; pass++) { const src = new Uint8ClampedArray(D); for (let j = 1; j < lh - 1; j++) for (let i = 1; i < lw - 1; i++) { const o = (j * lw + i) * 4; for (let ch = 0; ch < 3; ch++) D[o + ch] = (src[o + ch] * 4 + src[o + ch - 4] + src[o + ch + 4] + src[o + ch - lw * 4] + src[o + ch + lw * 4]) / 8; } }
    lx.putImageData(id, 0, 0);
    x.save(); x.globalCompositeOperation = 'multiply'; x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(lc, 0, 0, lw * R, lh * R); x.restore();
    // 1b. moteado de acuarela: el pigmento no cae parejo
    x.save(); x.globalCompositeOperation = 'multiply';
    for (let k = 0; k < Math.round(T.W * T.H / 7000); k++) { const bx = rnd(k, 501) * T.W, by = rnd(k, 502) * T.H, br = 16 + rnd(k, 503) * 56, p = Math.min(lw * lh - 1, ((by / R) | 0) * lw + ((bx / R) | 0)), tk = KIND[p]; if (tk === 2 || tk === 5) continue; const pal = tk === 1 ? P.water[1] : tk === 3 ? P.path[1] : tk === 4 ? P.stone[1] : P.grass[1]; x.globalAlpha = 0.12 + rnd(k, 504) * 0.16; x.drawImage(wash(pal.map(v => v | 0).join(','), 1), bx - br, by - br * 0.7, br * 2, br * 1.4); }
    x.restore();
    // 2. contornos: la orilla en tres líneas (la de tinta y dos de agua que se apagan), los caminos y el vacío de tinta
    const isK = (p, k) => p >= 0 && p < lw * lh && KIND[p] === k;
    contour(x, F, p => KIND[p] === 1 && DIST[p] === 1, (wx, wy) => fbm2(wx / 60, wy / 60, 2), `rgb(${INKRGB})`, 0.72, 0.14);
    contour(x, F, p => KIND[p] === 1 && DIST[p] === 3, (wx, wy) => fbm2(wx / 60 + 5, wy / 60, 2) * 0.7, `rgb(${P.wInk})`, 0.45, 0.32);
    contour(x, F, p => KIND[p] === 1 && DIST[p] === 6, (wx, wy) => 0.1, `rgb(${P.wInk})`, 0.28, 0.52);
    contour(x, F, p => KIND[p] === 3 && (KIND[p + 1] === 0 || KIND[p - 1] === 0 || KIND[p + lw] === 0 || KIND[p - lw] === 0), (wx, wy) => 0.2, 'rgb(112,84,52)', 0.32, 0.42);
    contour(x, F, p => KIND[p] === 2 && (KIND[p + 1] !== 2 || KIND[p - 1] !== 2 || KIND[p + lw] !== 2 || KIND[p - lw] !== 2), (wx, wy) => 0.9, th.voidSky ? 'rgb(150,120,90)' : `rgb(${INKRGB})`, th.voidSky ? 0.55 : 0.95, 0);
    // 2b. el vacío de tinta (lo que borró el Borrón): brillo húmedo y salpicaduras alrededor
    // cielo bajo las nubes (sobre el Fuji): mar de nubes blancas y la silueta del monte a lo lejos
    if (th.voidSky) { for (let k = 0; k < Math.round(T.W * T.H / 9000); k++) { const bx = rnd(k, 901) * T.W, by = rnd(k, 902) * T.H, p = Math.min(lw * lh - 1, ((by / R) | 0) * lw + ((bx / R) | 0)); if (KIND[p] !== 2) continue; const w = 60 + rnd(k, 903) * 140; x.globalAlpha = 0.55 + rnd(k, 904) * 0.35; x.drawImage(wash('255,252,246', 1), bx - w, by - w * 0.3, w * 2, w * 0.6); } x.globalAlpha = 1; }
    for (let j = 1; j < lh - 1; j += 2) for (let i = 1; i < lw - 1; i += 2) { const p = j * lw + i; if (KIND[p] !== 2 || th.voidSky) continue; const wx = i * R, wy = j * R; if (rnd(p, 601) < 0.05) { x.globalAlpha = 0.18; x.drawImage(wash('120,120,150', 1), wx - 14, wy - 6, 28, 12); }
      if ((KIND[p + 2] !== 2 || KIND[p - 2] !== 2) && rnd(p, 602) < 0.4) { const a = rnd(p, 603) * TAU, d = 6 + rnd(p, 604) * 16; x.globalAlpha = 0.85; x.fillStyle = INK; x.beginPath(); x.arc(wx + Math.cos(a) * d, wy + Math.sin(a) * d, 0.8 + rnd(p, 605) * 2.4, 0, TAU); x.fill(); } }
    x.globalAlpha = 1;
    // 3. detalles por celda
    const tufts = P.tuft, fl = P.flower;
    for (let i = 0; i < T.n; i++) {
      const b = type(i), px = Terrain.cx(T, i), py = Terrain.cy(T, i);
      if (b === TT.GRASS) {
        if (season === 'winter') {
          // nieve: sombras azules suaves en arco y alguna hierba seca que asoma
          for (let k = 0; k < 2; k++) { if (rnd(i, 700 + k) < 0.4) continue; const sx = px + (rnd(i, 702 + k) - 0.5) * 36, sy = py + (rnd(i, 704 + k) - 0.5) * 30, w = 10 + rnd(i, 706 + k) * 18; x.strokeStyle = 'rgba(110,140,186,0.3)'; x.lineWidth = 2.4; x.beginPath(); x.ellipse(sx, sy, w, w * 0.32, 0, Math.PI * 0.1, Math.PI * 0.9); x.stroke(); }
          if (rnd(i, 710) < 0.4) { const gx = px + (rnd(i, 711) - 0.5) * 30, gy = py + (rnd(i, 712) - 0.5) * 30; for (let s = 0; s < 3; s++) brush(x, [[gx + s * 2, gy], [gx + s * 2 + (s - 1) * 2, gy - 5], [gx + s * 2 + (s - 1) * 4, gy - 10 - s]], 1.5, tufts[s % tufts.length], 0.75, 0); }
          continue;
        }
        // matas de trazos rápidos (como hierba de sumi-e)
        const N = season === 'summer' ? 4 : 3;
        for (let k = 0; k < N; k++) {
          if (rnd(i, 720 + k) < 0.22) continue;
          const gx = px + (rnd(i, 721 + k * 3) - 0.5) * CELL, gy = py + (rnd(i, 722 + k * 3) - 0.5) * CELL, hgt = 7 + rnd(i, 723 + k * 3) * 10, col = tufts[(rnd(i, 724 + k) * tufts.length) | 0], lean = (rnd(i, 725 + k) - 0.5) * 6;
          for (let s = -1; s <= 1; s++) { const sx = gx + s * 2, tip = [sx + s * 3.2 + lean, gy - hgt * (1 - Math.abs(s) * 0.2)]; brush(x, [[sx, gy], [sx + s * 1 + lean * 0.4, gy - hgt * 0.5], tip], 1.9, col, 0.78, 0); }
        }
        if (season === 'spring') {
          for (let k = 0; k < 3; k++) { if (rnd(i, 730 + k) < 0.45) continue; const fx = px + (rnd(i, 731 + k) - 0.5) * 36, fy = py + (rnd(i, 733 + k) - 0.5) * 36; x.fillStyle = fl[(rnd(i, 735 + k) * fl.length) | 0]; x.globalAlpha = 0.9; x.beginPath(); x.ellipse(fx, fy, 2.8, 1.6, rnd(i, 736 + k) * 3, 0, TAU); x.fill(); }
          if (rnd(i, 740) < 0.16) { const fx = px + (rnd(i, 741) - 0.5) * 28, fy = py + (rnd(i, 742) - 0.5) * 28; for (let q = 0; q < 5; q++) { x.fillStyle = q % 2 ? '#ffffff' : fl[0]; x.beginPath(); x.arc(fx + Math.cos(q * 1.257) * 3, fy + Math.sin(q * 1.257) * 3, 2.3, 0, TAU); x.fill(); } x.fillStyle = '#e8b830'; x.beginPath(); x.arc(fx, fy, 1.4, 0, TAU); x.fill(); }
          x.globalAlpha = 1;
        } else if (season === 'summer') {
          if (rnd(i, 745) < 0.12) { const fx = px + (rnd(i, 746) - 0.5) * 28, fy = py + (rnd(i, 747) - 0.5) * 28, col = fl[(rnd(i, 748) * fl.length) | 0]; x.fillStyle = col; x.globalAlpha = 0.92; for (let q = 0; q < 6; q++) { x.beginPath(); x.arc(fx + Math.cos(q) * 2.6, fy + Math.sin(q) * 2.6, 1.9, 0, TAU); x.fill(); } x.globalAlpha = 1; }
        } else if (season === 'autumn') leaves(x, i, px, py, fl, 3);
      } else if (b === TT.DIRT || b === TT.FERTILE) {
        for (let k = 0; k < 2; k++) { const y0 = py + (rnd(i, 760 + k) - 0.5) * 28; x.strokeStyle = b === TT.FERTILE ? 'rgba(60,40,24,0.35)' : 'rgba(130,100,60,0.24)'; x.lineWidth = 1.1; x.beginPath(); x.moveTo(px - 21, y0); x.quadraticCurveTo(px, y0 + (rnd(i, 762 + k) - 0.5) * 6, px + 21, y0 + (rnd(i, 764 + k) - 0.5) * 4); x.stroke(); }
        for (let k = 0; k < 3; k++) { if (rnd(i, 770 + k) < 0.45) continue; const sx = px + (rnd(i, 771 + k) - 0.5) * 34, sy = py + (rnd(i, 773 + k) - 0.5) * 34, r = 1.2 + rnd(i, 775 + k) * 2.2; x.fillStyle = rgb(lerp3(P.stone[1], [255, 255, 255], 0.2), 0.9); x.beginPath(); x.ellipse(sx, sy, r * 1.2, r * 0.85, 0, 0, TAU); x.fill(); x.strokeStyle = `rgba(${INKRGB},0.55)`; x.lineWidth = 0.7; x.stroke(); }
        if (season === 'autumn' && B[i] === TT.DIRT && rnd(i, 780) < 0.4) leaves(x, i, px, py, fl, 1);
        if (season === 'winter') { x.globalAlpha = 0.55; x.drawImage(wash('248,249,250', 1), px - 22 + (rnd(i, 781) - 0.5) * 20, py - 6 + (rnd(i, 782) - 0.5) * 20, 30 + rnd(i, 783) * 14, 12); x.globalAlpha = 1; }
      } else if (b === TT.STONE && th.slabs) {
        // losas de piedra (ishidatami): rectángulos parejos con junta de tinta, unas más claras que otras
        const r0 = Math.floor(py / CELL), off = (r0 % 2) * CELL / 2;
        for (let k = 0; k < 2; k++) { const sx = px - CELL / 2 + k * CELL / 2 + off * 0, sy = py - CELL / 2, w = CELL / 2, h = CELL; const v = rnd(i, 850 + k); x.fillStyle = rgb(lerp3(P.stone[0], P.stone[1], v * 0.8), 1); x.fillRect(sx + 1, sy + 1, w - 2, h - 2); x.strokeStyle = `rgba(${INKRGB},0.32)`; x.lineWidth = 1; x.strokeRect(sx + 1, sy + 1, w - 2, h - 2);
          if (v < 0.25) { x.strokeStyle = `rgba(${INKRGB},0.25)`; x.beginPath(); x.moveTo(sx + 3, sy + 8 + v * 40); x.lineTo(sx + w - 4, sy + 12 + v * 30); x.stroke(); }
          if (season === 'winter' && rnd(i, 860 + k) < 0.5) { x.globalAlpha = 0.6; x.drawImage(wash('248,249,250', 1), sx - 4, sy + h * 0.3, w + 8, 12); x.globalAlpha = 1; }
          if (season === 'autumn' && rnd(i, 870 + k) < 0.3) leaves(x, i + k * 7, sx + w / 2, sy + h / 2, PAL.autumn.flower, 1); }
      } else if (b === TT.STONE) {
        const n = 1 + ((rnd(i, 790) * 2) | 0);
        for (let k = 0; k < n; k++) { const sx = px + (n > 1 ? (k - 0.5) * 18 : 0) + (rnd(i, 791 + k) - 0.5) * 6, sy = py + (rnd(i, 793 + k) - 0.5) * 8, w = (n > 1 ? 9 : 17) + rnd(i, 795 + k) * 4, h = 10 + rnd(i, 797 + k) * 5;
          const g = x.createLinearGradient(sx - w, sy - h, sx + w, sy + h); g.addColorStop(0, rgb(lerp3(P.stone[0], [255, 255, 255], 0.25))); g.addColorStop(1, rgb(P.stone[1])); x.fillStyle = g;
          x.beginPath(); for (let q = 0; q < 9; q++) { const a = q / 9 * TAU, rr = 0.82 + rnd(i, 800 + q + k * 9) * 0.25; q ? x.lineTo(sx + Math.cos(a) * w * rr, sy + Math.sin(a) * h * rr) : x.moveTo(sx + Math.cos(a) * w * rr, sy + Math.sin(a) * h * rr); } x.closePath(); x.fill();
          x.strokeStyle = `rgba(${INKRGB},0.7)`; x.lineWidth = 1.3; x.stroke();
          if (season === 'winter') { x.fillStyle = 'rgba(250,251,252,0.92)'; x.beginPath(); x.ellipse(sx - 1, sy - h * 0.3, w * 0.8, h * 0.5, 0, 0, TAU); x.fill(); } }
      } else if ((b === TT.DEEP || b === TT.SHALLOW)) {
        if (season === 'winter') {
          if (rnd(i, 820) < 0.4) { const sx = px + (rnd(i, 821) - 0.5) * 30, sy = py + (rnd(i, 822) - 0.5) * 30; let a = rnd(i, 823) * TAU; const pts = [[sx, sy]]; for (let s = 0; s < 4; s++) { a += (rnd(i, 824 + s) - 0.5) * 1.4; pts.push([pts[s][0] + Math.cos(a) * 10, pts[s][1] + Math.sin(a) * 10]); } x.strokeStyle = `rgba(${P.wInk},0.55)`; x.lineWidth = 1; x.beginPath(); pts.forEach((p, k) => k ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke(); }
          if (rnd(i, 830) < 0.22) { x.globalAlpha = 0.7; x.drawImage(wash('250,251,252', 1), px - 18, py - 5 + (rnd(i, 831) - 0.5) * 20, 30 + rnd(i, 832) * 16, 10); x.globalAlpha = 1; }
          if (rnd(i, 833) < 0.14) { x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = 1.8; x.beginPath(); x.moveTo(px - 8, py + 4); x.lineTo(px + 6, py - 6); x.stroke(); }
        } else if (rnd(i, 840) < 0.45) {
          const sx = px + (rnd(i, 841) - 0.5) * 24, sy = py + (rnd(i, 842) - 0.5) * 30, w = 9 + rnd(i, 843) * 13;
          x.strokeStyle = `rgba(${P.wInk},${0.3 + rnd(i, 844) * 0.22})`; x.lineWidth = 1.2; x.beginPath(); x.moveTo(sx - w, sy); x.bezierCurveTo(sx - w * 0.5, sy - 3, sx - w * 0.2, sy + 3, sx, sy); x.bezierCurveTo(sx + w * 0.3, sy - 3, sx + w * 0.6, sy + 2, sx + w, sy - 1); x.stroke();
        }
      }
    }
    // 4. fuentes: pilas de piedra (tsukubai) con agua quieta
    for (const s of G.sources) {
      x.save(); x.translate(s.x, s.y);
      x.globalAlpha = 0.35; x.drawImage(wash('60,50,44', 1), -48, -18, 100, 44); x.globalAlpha = 1;
      const g = x.createLinearGradient(-40, -26, 40, 26); g.addColorStop(0, rgb(lerp3(P.stone[0], [255, 255, 255], 0.2))); g.addColorStop(1, rgb(P.stone[1])); x.fillStyle = g;
      x.beginPath(); for (let q = 0; q < 12; q++) { const a = q / 12 * TAU, rr = 0.9 + hash2(s.x + q, s.y) * 0.14; q ? x.lineTo(Math.cos(a) * 40 * rr, Math.sin(a) * 25 * rr) : x.moveTo(Math.cos(a) * 40 * rr, Math.sin(a) * 25 * rr); } x.closePath(); x.fill();
      x.strokeStyle = INK; x.lineWidth = 1.8; x.stroke();
      x.fillStyle = rgb(season === 'winter' ? [170, 196, 220] : P.water[1]); x.beginPath(); x.ellipse(0, -1, 22, 13, 0, 0, TAU); x.fill(); x.strokeStyle = `rgba(${INKRGB},0.8)`; x.lineWidth = 1.2; x.stroke();
      x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = 1; x.beginPath(); x.ellipse(-4, -4, 10, 4, 0, Math.PI * 1.1, Math.PI * 1.7); x.stroke();
      if (season === 'winter') { x.fillStyle = 'rgba(250,251,252,0.95)'; x.beginPath(); x.ellipse(-14, -16, 18, 6, -0.2, 0, TAU); x.fill(); }
      x.restore();
    }
    // 5. rocas sumi-e (sprites por estación y variante)
    for (let i = 0; i < T.n; i++) if (B[i] === TT.ROCK && !(G.cellLook && G.cellLook.get(i))) { const v = (rnd(i, 29) * 8) | 0, spr = rockSpr(season, v, P), up = Math.floor(i / T.cols) > 0 && B[i - T.cols] === TT.ROCK, px = Terrain.cx(T, i) + (rnd(i, 30) - 0.5) * 8, py = Terrain.cy(T, i) + (rnd(i, 31) - 0.5) * 6 + (up ? 4 : 0), sc = 0.9 + rnd(i, 32) * 0.3; x.save(); x.translate(px, py); if (rnd(i, 33) < 0.5) x.scale(-sc, sc); else x.scale(sc, sc); x.drawImage(spr, -40, -52, 80, 70); x.restore(); }
    // 6. el papel encima de todo (fibras que atraviesan la pintura)
    x.save(); x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.3; x.fillStyle = x.createPattern(paper(), 'repeat'); x.fillRect(0, 0, T.W, T.H); x.restore();
    c.S = S; cache[key] = c; return c;
  }
  function leaves(x, i, px, py, cols, n) {
    for (let k = 0; k < n; k++) {
      if (rnd(i, 750 + k) < 0.3) continue;
      const lx = px + (rnd(i, 751 + k) - 0.5) * 34, ly = py + (rnd(i, 753 + k) - 0.5) * 34, a = rnd(i, 755 + k) * TAU, s = 2.6 + rnd(i, 756 + k) * 2.4;
      x.save(); x.translate(lx, ly); x.rotate(a); x.fillStyle = cols[(rnd(i, 757 + k) * cols.length) | 0]; x.globalAlpha = 0.92;
      x.beginPath(); for (let q = 0; q < 5; q++) { const aa = -Math.PI / 2 + (q - 2) * 0.7; x.moveTo(0, 0); x.quadraticCurveTo(Math.cos(aa - 0.3) * s, Math.sin(aa - 0.3) * s, Math.cos(aa) * s * 1.5, Math.sin(aa) * s * 1.5); x.quadraticCurveTo(Math.cos(aa + 0.3) * s, Math.sin(aa + 0.3) * s, 0, 0); } x.fill();
      x.strokeStyle = 'rgba(90,30,10,0.5)'; x.lineWidth = 0.5; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, s * 0.9); x.stroke();
      x.restore();
    }
    x.globalAlpha = 1;
  }
  // roca sumi-e: aguada con luz arriba a la izquierda, rayas de textura en la sombra, contorno fino arriba y grueso abajo,
  // puntos de musgo en el filo (en invierno, gorro de nieve)
  const rocks = {};
  function rockSpr(season, v, P) {
    const key = season + v; if (rocks[key]) return rocks[key];
    const K = 1.6, c = mk(80 * K, 70 * K), x = c.getContext('2d'); x.scale(K, K); x.translate(40, 52);
    const hr = k => hash2(v * 5.1 + k, k * 2.3 + v * 0.7), R = 20 + hr(1) * 7, h = 12 + hr(2) * 12, n = 9;
    x.globalAlpha = 0.42; x.drawImage(wash('40,36,40', 1), -R * 1.3 + 6, -R * 0.3 + 6, R * 2.6, R * 0.95); x.globalAlpha = 1;
    const V = []; for (let k = 0; k < n; k++) { const a = k / n * TAU + hr(10 + k) * 0.45, rr = R * (0.76 + hr(20 + k) * 0.34); V.push([Math.cos(a) * rr, -h * 0.5 + Math.sin(a) * rr * (Math.sin(a) < 0 ? 0.62 + h / R * 0.6 : 0.5)]); }
    const path = () => { x.beginPath(); V.forEach((p, k) => k ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); };
    const g = x.createLinearGradient(-R, -h - R * 0.5, R, R * 0.4); g.addColorStop(0, rgb(lerp3(P.rock[0], [250, 248, 240], 0.4))); g.addColorStop(0.5, rgb(P.rock[0])); g.addColorStop(1, rgb(P.rock[1]));
    path(); x.fillStyle = g; x.fill();
    x.save(); path(); x.clip(); x.strokeStyle = `rgba(${INKRGB},0.45)`; x.lineCap = 'round';
    for (let k = 0; k < 7; k++) { const sx = R * (0.0 + hr(30 + k) * 0.8), sy = -h * 0.7 + hr(40 + k) * R * 1.0; x.lineWidth = 0.9 + hr(50 + k) * 1.4; x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx - 5 - hr(60 + k) * 7, sy + 8 + hr(70 + k) * 7); x.stroke(); }
    x.restore();
    path(); x.strokeStyle = INK; x.lineWidth = 1.3; x.globalAlpha = 0.9; x.stroke(); x.globalAlpha = 1;
    const bottom = V.filter(p => p[1] > -h * 0.5 || p[0] > R * 0.3); if (bottom.length > 2) { bottom.sort((a, b) => Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0])); brush(x, bottom, 3.6, INK, 0.8, 0.3); }
    if (season !== 'winter') for (let k = 0; k < 7; k++) { if (hr(80 + k) < 0.3) continue; const p = V[(n - 3 + k) % n]; x.fillStyle = season === 'autumn' && k % 2 ? '#a8502a' : season === 'spring' && k % 3 === 0 ? '#3e6a2e' : '#1f2a1c'; x.beginPath(); x.ellipse(p[0] + (hr(90 + k) - 0.5) * 5, p[1] + 1, 1.7 + hr(95 + k), 1.15, 0, 0, TAU); x.fill(); }
    else { x.save(); path(); x.clip(); x.fillStyle = 'rgba(250,251,252,0.98)'; x.beginPath(); x.ellipse(-2, -h - R * 0.35, R * 1.05, R * 0.55 + 2, 0, 0, TAU); x.fill(); x.strokeStyle = 'rgba(100,132,176,0.6)'; x.lineWidth = 1.4; x.beginPath(); x.ellipse(-2, -h - R * 0.35, R * 1.05, R * 0.55 + 2, 0, 0.15, Math.PI - 0.15); x.stroke(); x.restore(); }
    if (season === 'autumn' && hr(99) < 0.6) leaves(x, v * 13 + 7, -4, -h - 4, PAL.autumn.flower, 1);
    return (rocks[key] = c);
  }

  /* ---------- cada cuadro: los paneles con su estación y la pincelada que los cambia ---------- */
  const shown = {}; // panel → { s, prev, t }
  function panelsOf(G) {
    const sd = G.mode === 'camp' && G.L ? G.L.seasons : G.A.seasons;
    return (sd && sd.panels) || [[0, G.T.W, (sd && sd.start) || 'spring']];
  }
  function seasonOfPanel(G, p) { const T = G.T, c = clamp(Math.floor(((p[0] + p[1]) / 2) / CELL), 0, T.cols - 1), r = (T.rows / 2) | 0; return SEASON_BY_CODE[T.sea[r * T.cols + c]] || p[2]; }
  function ground(ctx, G, view, time) {
    const P = panelsOf(G), key = G.arena + '#' + G.round;
    if (!shown[key]) { for (const k in shown) delete shown[k]; shown[key] = P.map(p => ({ s: seasonOfPanel(G, p), prev: null, t: 1 })); }
    const st = shown[key], now = performance.now() / 1000;
    for (let k = 0; k < P.length; k++) {
      const p = P[k], d = st[k], s = seasonOfPanel(G, p);
      if (s !== d.s) { d.prev = d.s; d.s = s; d.t0 = now; d.burst = 1; }
      const t = d.prev ? clamp((now - d.t0) / Seasons.TR, 0, 1) : 1; if (t >= 1) { d.prev = null; d.fx = null; }
      const x0 = Math.max(p[0], view.x0 - 40), x1 = Math.min(p[1], view.x1 + 40); if (x1 <= x0) continue;
      const draw = (s2, clip) => { const img = prerender(G, s2), S = img.S; ctx.save(); if (clip) clip(); ctx.drawImage(img, x0 * S, 0, (x1 - x0) * S, img.height, x0, 0, x1 - x0, G.T.H); ctx.restore(); };
      if (!d.prev) { draw(d.s); continue; }
      draw(d.prev);
      // la pincelada: un frente inclinado y ondulado que avanza de izquierda a derecha
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, H = G.T.H, span = p[1] - p[0] + H * 0.35, fx = y => p[0] - H * 0.35 + span * e + y * 0.35 + Math.sin(y / 37 + k) * 14 + Math.sin(y / 11) * 4;
      d.fx = fx;
      const front = () => { ctx.beginPath(); ctx.moveTo(p[0] - 10, -10); for (let y = -10; y <= H + 10; y += 20) ctx.lineTo(fx(y), y); ctx.lineTo(p[0] - 10, H + 10); ctx.closePath(); ctx.clip(); };
      draw(d.s, front);
      // el filo húmedo del pincel
      ctx.save(); ctx.globalAlpha = 0.35 * (1 - t); ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); for (let y = -10; y <= H + 10; y += 20) y < 0 ? ctx.moveTo(fx(y), y) : ctx.lineTo(fx(y), y); ctx.stroke(); ctx.restore();
      if (d.burst && t > 0.05) { d.burst = 0; burstSeason(G, s, p); }
    }
    changed(ctx, G, view, time);
    kasumi(ctx, G, P, time);
  }
  // lo que cambió el suelo de base (la marea que inunda, lo que borra el Borrón): se pinta encima del papel
  function changed(ctx, G, view, time) {
    const T = G.T, B = T.base0; if (!B) return;
    const c0 = Math.max(0, Math.floor(view.x0 / CELL)), c1 = Math.min(T.cols - 1, Math.ceil(view.x1 / CELL)), r0 = Math.max(0, Math.floor(view.y0 / CELL)), r1 = Math.min(T.rows - 1, Math.ceil(view.y1 / CELL));
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const i = r * T.cols + c, b = T.base[i]; if (b === B[i]) continue; const px = c * CELL + CELL / 2, py = r * CELL + CELL / 2, s = seenAt(G, px, py), P = PAL[s];
      if (b === TT.SHALLOW || b === TT.DEEP) {
        ctx.globalAlpha = b === TT.DEEP ? 0.75 : 0.6; ctx.drawImage(wash(P.water[b === TT.DEEP ? 1 : 0].join(','), 1), px - CELL * 0.95 + (rnd(i, 1) - 0.5) * 8, py - CELL * 0.8, CELL * 1.9, CELL * 1.6);
        const w = Math.sin(time * 1.6 + c * 0.8 + r * 1.3); if (w > 0.2) { ctx.globalAlpha = (w - 0.2) * 0.6; ctx.strokeStyle = `rgb(${P.wInk})`; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(px - 10, py + (rnd(i, 2) - 0.5) * 16); ctx.quadraticCurveTo(px, py - 3 + (rnd(i, 2) - 0.5) * 16, px + 10, py + (rnd(i, 2) - 0.5) * 16); ctx.stroke(); }
      } else if (b === TT.CHASM) { ctx.globalAlpha = 0.96; ctx.drawImage(wash('14,11,14', 1), px - CELL * 0.9, py - CELL * 0.9, CELL * 1.8, CELL * 1.8); }
    }
    ctx.globalAlpha = 1;
  }
  // la estación que se VE en un punto (mientras pasa la pincelada, lo de adelante sigue en la estación vieja)
  function seenAt(G, x, y) {
    const key = G.arena + '#' + G.round, st = shown[key]; if (!st) return Seasons.at(G, x, y) || 'spring';
    const P = panelsOf(G); let k = P.findIndex(p => x >= p[0] && x < p[1]); if (k < 0) k = x < 0 ? 0 : P.length - 1;
    const d = st[k]; if (!d) return Seasons.at(G, x, y) || 'spring'; return d.prev && d.fx ? (x < d.fx(y) ? d.s : d.prev) : d.s;
  }
  // nubes doradas (kasumi) entre paneles, como en los biombos
  const kas = {};
  function kasumiSpr(seed, H) {
    const k = seed + '|' + H; if (kas[k]) return kas[k];
    const W = 220, c = mk(W, H), x = c.getContext('2d');
    for (let b = 0; b < Math.ceil(H / 120) + 1; b++) {
      const cy = b * 120 + hash2(seed, b) * 60, w = 120 + hash2(seed, b + 9) * 80, h = 34 + hash2(seed, b + 19) * 24, cx = W / 2 + (hash2(seed, b + 29) - 0.5) * 50;
      // nube: lóbulos redondos arriba, base plana; oro con borde oscuro y remolinos
      x.save(); x.beginPath(); const lobes = 4 + ((hash2(seed, b + 39) * 3) | 0);
      x.moveTo(cx - w / 2, cy + h / 2); for (let q = 0; q < lobes; q++) { const lx = cx - w / 2 + (q + 0.5) * w / lobes, r = w / lobes * 0.62; x.arc(lx, cy + h / 2 - r * 0.4, r, Math.PI, 0); } x.lineTo(cx + w / 2, cy + h / 2); x.closePath();
      const g = x.createLinearGradient(0, cy - h, 0, cy + h); g.addColorStop(0, 'rgba(250,222,140,0.96)'); g.addColorStop(0.5, 'rgba(226,182,86,0.96)'); g.addColorStop(1, 'rgba(196,148,60,0.94)');
      x.fillStyle = g; x.fill(); x.strokeStyle = 'rgba(120,80,20,0.75)'; x.lineWidth = 1.6; x.stroke();
      x.clip(); x.strokeStyle = 'rgba(255,244,200,0.7)'; x.lineWidth = 1.2; for (let q = 0; q < 3; q++) { const sx = cx - w / 3 + q * w / 3, sy = cy + h * 0.1; x.beginPath(); x.arc(sx, sy, 6 + q * 2, Math.PI * 0.2, Math.PI * 1.6); x.stroke(); }
      // brillos de pan de oro
      for (let q = 0; q < 18; q++) { x.fillStyle = `rgba(255,250,220,${0.25 + hash2(seed + q, b) * 0.4})`; x.fillRect(cx - w / 2 + hash2(q, seed + b) * w, cy - h / 2 + hash2(seed, q + b) * h, 2, 2); }
      x.restore();
    }
    return (kas[k] = c);
  }
  function kasumi(ctx, G, P, time) {
    // solo arriba y abajo de cada costura (como en los biombos): el centro queda limpio para jugar
    for (let k = 1; k < P.length; k++) { const bx = P[k][0], H = G.T.H, spr = kasumiSpr(k * 13 + 7, 260), sw = Math.sin(time * 0.3 + k) * 4; ctx.save(); ctx.globalAlpha = 0.78; ctx.drawImage(spr, bx - spr.width / 2 + sw, -40, spr.width, 200); ctx.drawImage(spr, bx - spr.width / 2 - sw, H - 160, spr.width, 200); ctx.restore(); }
  }

  /* ---------- árboles por estación (sprites guardados por tipo, estación y variante) ---------- */
  const trees = {};
  const TS = 1.5; // resolución de los sprites
  function treeSpr(kind, season, v) {
    const key = kind + season + v; if (trees[key]) return trees[key];
    const W = 150, H = 170, c = mk(W * TS, H * TS), x = c.getContext('2d'); x.scale(TS, TS); x.translate(W / 2, H - 14);
    const hr = (k) => hash2(v * 7.3 + k, k * 1.9 + v);
    // sombra en el suelo
    x.globalAlpha = 0.32; x.drawImage(wash('40,34,40', 1), -46, -10, 92, 22); x.globalAlpha = 1;
    if (kind === 'bamboo') {
      const n = 5 + (v % 3); for (let k = 0; k < n; k++) {
        const sx = (k - (n - 1) / 2) * 9 + (hr(k) - 0.5) * 6, top = -110 - hr(k + 5) * 40, lean = (hr(k + 9) - 0.5) * 16;
        const col = season === 'autumn' ? '#a8a04a' : season === 'winter' ? '#5f7a5a' : '#5f9a4a';
        x.strokeStyle = col; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(sx, 0); x.quadraticCurveTo(sx + lean * 0.3, top / 2, sx + lean, top); x.stroke();
        x.strokeStyle = INK; x.lineWidth = 1; x.globalAlpha = 0.7; x.beginPath(); x.moveTo(sx - 2.5, 0); x.quadraticCurveTo(sx - 2.5 + lean * 0.3, top / 2, sx - 2.5 + lean, top); x.stroke(); x.globalAlpha = 1;
        for (let s = 1; s < 6; s++) { const t = s / 6, nx = sx + lean * t * t, ny = top * t; x.strokeStyle = INK; x.lineWidth = 1.6; x.beginPath(); x.moveTo(nx - 3, ny); x.lineTo(nx + 3, ny - 1); x.stroke(); }
        // hojas: trazos en punta de lanza (el pincel apretado y soltado)
        for (let s = 0; s < 4; s++) { const t = 0.55 + s * 0.13, nx = sx + lean * t * t, ny = top * t, dir = (s + k) % 2 ? 1 : -1;
          for (let q = 0; q < 3; q++) { const a = dir * (0.4 + q * 0.35) + Math.PI * (dir > 0 ? 0 : 1) * 0, L = 14 + hr(k * 9 + s * 3 + q) * 8; const ex = nx + Math.cos(a) * L * dir, ey = ny + Math.sin(a) * L * 0.6 + q * 3; brush(x, [[nx, ny], [(nx + ex) / 2, (ny + ey) / 2 - 2], [ex, ey]], 4.2, season === 'autumn' ? '#8a8a3a' : season === 'winter' ? '#2a3e2a' : '#2c5a2a', 0.85, 0);
            if (season === 'winter' && q === 0) { x.fillStyle = 'rgba(252,252,250,0.95)'; x.beginPath(); x.ellipse((nx + ex) / 2, (ny + ey) / 2 - 2, 5, 2, 0, 0, TAU); x.fill(); } } }
      }
      return (trees[key] = c);
    }
    // tronco con ramas (pino, cerezo, arce)
    const bark = kind === 'pine' ? '#3a3028' : '#3e2e28';
    const trunk = [[0, 0], [-4 + hr(1) * 8, -30], [6 - hr(2) * 12, -58], [-2 + hr(3) * 8, -82]];
    brush(x, trunk, kind === 'pine' ? 13 : 11, bark, 1, 0.4);
    const branches = [];
    for (let k = 0; k < 5; k++) { const t = 0.4 + k * 0.14, bx0 = trunk[Math.min(3, Math.round(t * 3))][0], by0 = -82 * t, dir = k % 2 ? 1 : -1, L = 26 + hr(k + 20) * 22, ex = bx0 + dir * L, ey = by0 - 10 - hr(k + 30) * 18; branches.push([ex, ey]); brush(x, [[bx0, by0], [(bx0 + ex) / 2, by0 - 6], [ex, ey]], 4.5, bark, 1, 0.3); }
    branches.push([trunk[3][0], -95]);
    if (kind === 'pine') {
      // pino negro: almohadas de agujas planas (podado en nubes)
      for (const [ex, ey] of branches) {
        const w = 30 + hr(ex) * 14, h = 11 + hr(ey) * 5;
        x.globalAlpha = 0.95; x.fillStyle = season === 'autumn' ? '#2f4a30' : '#24402a'; x.beginPath(); x.ellipse(ex, ey, w, h, 0, 0, TAU); x.fill(); x.globalAlpha = 1;
        x.strokeStyle = 'rgba(120,170,110,0.55)'; x.lineWidth = 1; for (let q = 0; q < 14; q++) { const a = Math.PI + q / 13 * Math.PI, r0 = 0.5; x.beginPath(); x.moveTo(ex + Math.cos(a) * w * r0, ey + Math.sin(a) * h * r0); x.lineTo(ex + Math.cos(a) * w * 0.95, ey + Math.sin(a) * h * 0.95); x.stroke(); }
        x.strokeStyle = INK; x.lineWidth = 1.2; x.beginPath(); x.ellipse(ex, ey, w, h, 0, 0, Math.PI); x.stroke();
        if (season === 'winter') { x.fillStyle = 'rgba(252,252,250,0.97)'; x.beginPath(); x.ellipse(ex, ey - h * 0.45, w * 0.92, h * 0.55, 0, Math.PI, TAU); x.fill(); x.strokeStyle = 'rgba(120,150,190,0.5)'; x.lineWidth = 1; x.beginPath(); x.ellipse(ex, ey - h * 0.45, w * 0.92, h * 0.55, 0, Math.PI, TAU); x.stroke(); }
      }
      return (trees[key] = c);
    }
    // cerezo y arce: copa de muchas manchas pequeñas del color de la estación
    const COL = kind === 'sakura'
      ? { spring: ['#f6b6cc', '#f9cfdc', '#ee96b4', '#ffffff'], summer: ['#4f8a46', '#6aa356', '#3c7238'], autumn: ['#e08a3a', '#c9542a', '#e8b448'], winter: null }
      : { spring: ['#a8cf6a', '#c2dd84', '#8ab85a'], summer: ['#3f7e3a', '#57943f', '#2f6a32'], autumn: ['#d63a26', '#e8602a', '#b82a1e', '#f08a32'], winter: null };
    const cols = COL[season];
    if (!cols) { // invierno: ramas desnudas con nieve
      for (const [ex, ey] of branches) { for (let q = 0; q < 3; q++) { const a = -Math.PI / 2 + (q - 1) * 0.7, L = 10 + hr(ex + q) * 8; brush(x, [[ex, ey], [ex + Math.cos(a) * L, ey + Math.sin(a) * L]], 2, bark, 1, 0); } x.fillStyle = 'rgba(252,252,250,0.96)'; x.beginPath(); x.ellipse(ex - 2, ey - 2, 9, 3, -0.2, 0, TAU); x.fill(); }
      return (trees[key] = c);
    }
    for (const [ex, ey] of branches) {
      const R = 24 + hr(ex + ey) * 10;
      x.globalAlpha = 0.5; x.drawImage(wash(cols[cols.length - 1] === '#ffffff' ? '230,140,170' : cols[0].match(/\w\w/g).map(h => parseInt(h, 16)).join(','), 1), ex - R, ey - R * 0.8, R * 2, R * 1.6); x.globalAlpha = 1;
      for (let q = 0; q < 34; q++) { const a = hr(q * 3 + ex) * TAU, r = Math.sqrt(hr(q * 5 + ey)) * R, sx = ex + Math.cos(a) * r, sy = ey + Math.sin(a) * r * 0.75; x.fillStyle = cols[(hr(q * 7 + ex * 0.3) * cols.length) | 0]; x.globalAlpha = 0.92; x.beginPath(); x.arc(sx, sy, 2.4 + hr(q + ex) * 2.4, 0, TAU); x.fill(); }
      x.globalAlpha = 1;
      // contorno partido abajo (la sombra de la copa)
      x.strokeStyle = `rgba(${INKRGB},0.45)`; x.lineWidth = 1.2; x.beginPath(); x.arc(ex, ey + 2, R * 0.85, 0.3, Math.PI - 0.3); x.stroke();
    }
    return (trees[key] = c);
  }
  function tree(x, G, i) {
    // lo que el nivel pide para esa celda (seto podado, bambú…): el Mundo 3 dibuja los que no son árboles
    const look = G.cellLook && G.cellLook.get(i); if (look && look !== 'bamboo' && typeof ArtW3 !== 'undefined' && ArtW3.cell[look]) return ArtW3.cell[look](x, G, i);
    const T = G.T, th = THEMES[G.A.theme], px = Terrain.cx(T, i), py = Terrain.cy(T, i) + 12, list = th.trees || ['pine'], kind = look === 'bamboo' ? 'bamboo' : list[Math.floor(rnd(i, 3) * list.length)];
    const s = seenAt(G, px, py), spr = treeSpr(kind, s, (rnd(i, 4) * 3) | 0), sc = (0.82 + rnd(i, 5) * 0.32) * (kind === 'bamboo' ? 1 : 0.95), burn = T.fire[i] > 0;
    // doblado por el viento (el bambú se acuesta y deja pasar): se anima hacia lo que dice la cuadrícula
    let bend = 0; if (T.bent) { const A = G._bendA && G._bendA.length === T.n ? G._bendA : (G._bendA = new Float32Array(T.n)); A[i] += ((T.bent[i] ? 1 : 0) - A[i]) * 0.14; bend = A[i]; }
    const sway = Math.sin(G.time * 0.9 + i * 0.7) * 0.012 + (G.wind ? G.wind.x * 0.02 : 0) + (bend > 0.01 ? Math.sin(G.time * 7 + i) * 0.04 * bend : 0);
    x.save(); x.translate(px, py); x.transform(1, 0, sway + bend * 1.15, 1 - bend * 0.42, 0, 0); x.scale(sc, sc); if (burn) x.filter = 'brightness(0.55) sepia(0.6)'; if (bend > 0.5) x.globalAlpha = 1 - (bend - 0.5) * 0.5;
    x.drawImage(spr, -75, -156, 150, 170); x.restore();
  }

  /* ---------- torii ---------- */
  function torii(x, G, t) {
    const sea = (t.solo ? t.s : Seasons.at(G, t.x, t.y)) || 'spring', S = SEASONS[sea], glow = Math.max(0, t.glow || 0), red = '#d0381e', redD = '#8e2212';
    x.save(); x.translate(t.x, t.y); if (t.big) x.scale(t.big, t.big);
    // en el agua: ondas alrededor de los pilares
    { const i = Terrain.idx(G.T, t.x, t.y), b = i >= 0 ? G.T.base[i] : -1; if ((b === TT.SHALLOW || b === TT.DEEP) && G.T.ice[i] <= 0) for (const dx of [-34, 34]) for (let k = 0; k < 2; k++) { const p = (G.time * 0.5 + k / 2 + (dx > 0 ? 0.25 : 0)) % 1; x.globalAlpha = 0.5 * (1 - p); x.strokeStyle = 'rgba(40,70,110,0.9)'; x.lineWidth = 1.2; x.beginPath(); x.ellipse(dx, -2, 9 + p * 16, (9 + p * 16) * 0.38, 0, 0, TAU); x.stroke(); } x.globalAlpha = 1; }
    x.globalAlpha = 0.38; x.drawImage(wash('40,30,30', 1), -60, -8, 124, 22); x.globalAlpha = 1;
    // pilares (con su base negra)
    for (const dx of [-34, 34]) {
      const g = x.createLinearGradient(dx - 6, 0, dx + 6, 0); g.addColorStop(0, redD); g.addColorStop(0.4, red); g.addColorStop(1, redD); x.fillStyle = g; x.fillRect(dx - 5.5, -86, 11, 86);
      x.fillStyle = '#1a1414'; x.fillRect(dx - 7, -10, 14, 10); x.strokeStyle = INK; x.lineWidth = 1.2; x.strokeRect(dx - 5.5, -86, 11, 76);
    }
    // nuki (travesaño bajo) y gakuzuka con el emblema de la estación
    x.fillStyle = red; x.fillRect(-46, -66, 92, 7); x.strokeStyle = INK; x.lineWidth = 1; x.strokeRect(-46, -66, 92, 7);
    x.fillStyle = '#1a1414'; x.fillRect(-9, -84, 18, 20); x.fillStyle = S.col; x.fillRect(-7, -82, 14, 16);
    emblem(x, sea, 0, -74, 5.5);
    // shimaki (rojo) y kasagi (negro, curvado hacia arriba en las puntas)
    x.fillStyle = red; x.beginPath(); x.moveTo(-54, -92); x.lineTo(54, -92); x.lineTo(52, -86); x.lineTo(-52, -86); x.closePath(); x.fill(); x.strokeStyle = INK; x.stroke();
    x.fillStyle = '#1d1716'; x.beginPath(); x.moveTo(-64, -104); x.quadraticCurveTo(0, -94, 64, -104); x.lineTo(60, -94); x.quadraticCurveTo(0, -88, -60, -94); x.closePath(); x.fill();
    if (sea === 'winter') { x.fillStyle = 'rgba(252,252,250,0.96)'; x.beginPath(); x.moveTo(-62, -104); x.quadraticCurveTo(0, -96, 62, -104); x.quadraticCurveTo(0, -101, -62, -107); x.closePath(); x.fill(); }
    if (t.stain) { // manchado de tinta del Borrón: chorreones negros
      x.fillStyle = 'rgba(16,12,16,0.92)'; for (let k = 0; k < 6; k++) { const sx = -50 + k * 20 + hash2(t.k, k) * 8, L = 18 + hash2(k, t.k) * 40; x.beginPath(); x.moveTo(sx - 4, -100); x.quadraticCurveTo(sx - 5, -100 + L * 0.6, sx, -100 + L); x.quadraticCurveTo(sx + 5, -100 + L * 0.6, sx + 4, -100); x.fill(); x.beginPath(); x.arc(sx, -100 + L, 3, 0, TAU); x.fill(); }
      x.globalAlpha = 0.3 + 0.2 * Math.sin(G.time * 3); x.fillStyle = '#ff3050'; x.beginPath(); x.arc(-8, -74, 2, 0, TAU); x.arc(8, -74, 2, 0, TAU); x.fill(); x.globalAlpha = 1;
    }
    if (glow > 0) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = glow; x.drawImage(wash(S.col.match(/\w\w/g).map(h => parseInt(h, 16)).join(','), 1), -80, -130, 160, 150); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; }
    x.restore();
  }
  // emblemas de estación: flor, sol, hoja de arce, copo
  function emblem(x, sea, cx, cy, r) {
    x.save(); x.translate(cx, cy); x.fillStyle = SEASONS[sea].dark; x.strokeStyle = SEASONS[sea].dark; x.lineWidth = 1.2;
    if (sea === 'spring') { for (let q = 0; q < 5; q++) { const a = q / 5 * TAU - Math.PI / 2; x.beginPath(); x.ellipse(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5, r * 0.42, r * 0.3, a, 0, TAU); x.fill(); } }
    else if (sea === 'summer') { x.beginPath(); x.arc(0, 0, r * 0.45, 0, TAU); x.fill(); for (let q = 0; q < 8; q++) { const a = q / 8 * TAU; x.beginPath(); x.moveTo(Math.cos(a) * r * 0.65, Math.sin(a) * r * 0.65); x.lineTo(Math.cos(a) * r, Math.sin(a) * r); x.stroke(); } }
    else if (sea === 'autumn') { x.beginPath(); for (let q = 0; q < 5; q++) { const aa = -Math.PI / 2 + (q - 2) * 0.7; x.moveTo(0, r * 0.3); x.lineTo(Math.cos(aa) * r, Math.sin(aa) * r + r * 0.2); } x.lineWidth = 2.4; x.stroke(); }
    else { for (let q = 0; q < 3; q++) { const a = q / 3 * Math.PI; x.beginPath(); x.moveTo(Math.cos(a) * r, Math.sin(a) * r); x.lineTo(-Math.cos(a) * r, -Math.sin(a) * r); x.stroke(); } }
    x.restore();
  }
  // puente bermellón (taiko-bashi): tablas de madera, barandas rojas con su poste y remates negros en las puntas
  function bridgeCell(x, G, i, px, py) {
    { const look = G.cellLook && G.cellLook.get(i); if (look && typeof ArtW3 !== 'undefined' && ArtW3.cell[look]) return ArtW3.cell[look](x, G, i); }
    const T = G.T, c = i % T.cols, r = (i / T.cols) | 0, isB = (cc, rr) => cc >= 0 && rr >= 0 && cc < T.cols && rr < T.rows && T.base[rr * T.cols + cc] === TT.BRIDGE;
    const horiz = isB(c - 1, r) || isB(c + 1, r) || !(isB(c, r - 1) || isB(c, r + 1)), x0 = px - CELL / 2, y0 = py - CELL / 2, red = '#cf3a1f', s = seenAt(G, px, py);
    x.save();
    if (!horiz) { x.translate(px, py); x.rotate(Math.PI / 2); x.translate(-px, -py); }
    const sideA = horiz ? !isB(c, r - 1) : !isB(c + 1, r), sideB = horiz ? !isB(c, r + 1) : !isB(c - 1, r), endA = horiz ? !isB(c - 1, r) : !isB(c, r - 1), endB = horiz ? !isB(c + 1, r) : !isB(c, r + 1);
    if (sideB) { x.globalAlpha = 0.35; x.drawImage(wash('20,30,50', 1), x0 - 4, y0 + CELL - 6, CELL + 8, 16); x.globalAlpha = 1; }
    const g = x.createLinearGradient(0, y0, 0, y0 + CELL); g.addColorStop(0, '#a87446'); g.addColorStop(0.5, '#966236'); g.addColorStop(1, '#7a4c28'); x.fillStyle = g; x.fillRect(x0, y0 + 2, CELL, CELL - 4);
    x.strokeStyle = 'rgba(40,24,12,0.55)'; x.lineWidth = 1; for (let k = 0; k <= 4; k++) { x.beginPath(); x.moveTo(x0 + k * 10, y0 + 3); x.lineTo(x0 + k * 10 + (rnd(i, k) - 0.5) * 1.5, y0 + CELL - 3); x.stroke(); }
    if (s === 'winter') { x.fillStyle = 'rgba(247,249,252,0.82)'; x.fillRect(x0, y0 + 8, CELL, CELL - 18); x.fillStyle = 'rgba(120,150,190,0.35)'; x.fillRect(x0, y0 + CELL - 11, CELL, 1.5); }
    if (s === 'autumn' && rnd(i, 9) < 0.5) leaves(x, i, px, py, PAL.autumn.flower, 1);
    for (const [on, yy] of [[sideA, y0 + 1], [sideB, y0 + CELL - 6]]) if (on) {
      x.fillStyle = red; x.fillRect(x0 - 0.5, yy, CELL + 1, 5); x.strokeStyle = INK; x.lineWidth = 1; x.beginPath(); x.moveTo(x0, yy); x.lineTo(x0 + CELL, yy); x.moveTo(x0, yy + 5); x.lineTo(x0 + CELL, yy + 5); x.stroke();
      x.fillStyle = '#9a2814'; x.fillRect(x0 + 1, yy - 6, 4, 7); x.strokeRect(x0 + 1, yy - 6, 4, 7);
      for (const [e, ex] of [[endA, x0 + 2], [endB, x0 + CELL - 2]]) if (e) { x.fillStyle = '#1d1716'; x.beginPath(); x.arc(ex, yy - 6, 4.2, 0, TAU); x.fill(); x.fillStyle = '#e8c060'; x.beginPath(); x.arc(ex, yy - 10, 1.8, 0, TAU); x.fill(); }
    }
    x.restore();
  }
  // hielo en tinta (charcos y agua que congela un hechizo): aguada azul pálida, borde de tinta y grietas
  function iceCell(x, i, px, py, a, time) {
    const jx = (rnd(i, 44) - 0.5) * 10, jy = (rnd(i, 45) - 0.5) * 8;
    x.globalAlpha = a * 0.8; x.drawImage(wash('214,230,244', 1), px - CELL * 0.95 + jx, py - CELL * 0.8 + jy, CELL * 1.9, CELL * 1.6);
    x.globalAlpha = a * 0.6; x.strokeStyle = 'rgb(70,100,140)'; x.lineWidth = 0.9; x.beginPath(); let ax = px + jx - 10, ay = py + jy - 6; x.moveTo(ax, ay); for (let s = 0; s < 3; s++) { ax += 7 + rnd(i, 47 + s) * 4; ay += (rnd(i, 50 + s) - 0.3) * 8; x.lineTo(ax, ay); } x.stroke();
    const g = (time * 0.5 + rnd(i, 2) * 3) % 3; if (g < 0.25) { x.globalAlpha = (0.25 - g) * 3.5; x.fillStyle = '#ffffff'; x.fillRect(px + (rnd(i, 3) - 0.5) * 22, py + (rnd(i, 4) - 0.5) * 22, 2.5, 2.5); }
    x.globalAlpha = 1;
  }
  function items(G, list) {
    if (!G.sea) return;
    for (const t of G.sea.toriis) list.push({ y: t.y, draw: x => torii(x, G, t) });
  }

  /* ---------- partículas de la estación (en pantalla, con paralaje) y la ráfaga de la pincelada ---------- */
  let parts = null, burst = [];
  function burstSeason(G, s, p) {
    const n = LOWFX ? 18 : 46; for (let k = 0; k < n; k++) burst.push({ x: p[0] + Math.random() * (p[1] - p[0]), y: Math.random() * G.T.H, vx: (Math.random() - 0.3) * 60, vy: -20 - Math.random() * 40, a: Math.random() * TAU, va: (Math.random() - 0.5) * 6, t: 0, life: 1.6 + Math.random(), s });
    if (burst.length > 160) burst.splice(0, burst.length - 160);
  }
  function partSpr(s, k) {
    const key = 'p' + s + k; if (trees[key]) return trees[key];
    const c = mk(24, 24), x = c.getContext('2d'); x.translate(12, 12);
    if (s === 'spring') { x.fillStyle = ['#f7b8ce', '#fbd4e0', '#f09ab8'][k % 3]; x.beginPath(); x.moveTo(0, -7); x.quadraticCurveTo(6, -2, 0, 7); x.quadraticCurveTo(-6, -2, 0, -7); x.fill(); x.fillStyle = 'rgba(255,255,255,0.5)'; x.beginPath(); x.ellipse(-1, -2, 1.4, 3, 0, 0, TAU); x.fill(); }
    else if (s === 'autumn') { x.fillStyle = ['#d63a26', '#e8702a', '#e8b040'][k % 3]; x.beginPath(); for (let q = 0; q < 5; q++) { const aa = -Math.PI / 2 + (q - 2) * 0.7; x.moveTo(0, 0); x.quadraticCurveTo(Math.cos(aa - 0.3) * 5, Math.sin(aa - 0.3) * 5, Math.cos(aa) * 8, Math.sin(aa) * 8); x.quadraticCurveTo(Math.cos(aa + 0.3) * 5, Math.sin(aa + 0.3) * 5, 0, 0); } x.fill(); }
    else if (s === 'winter') { const g = x.createRadialGradient(0, 0, 0, 0, 0, 6); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 6, 0, TAU); x.fill(); }
    else { const g = x.createRadialGradient(0, 0, 0, 0, 0, 7); g.addColorStop(0, 'rgba(240,255,170,1)'); g.addColorStop(1, 'rgba(200,255,120,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 7, 0, TAU); x.fill(); }
    return (trees[key] = c);
  }
  function particles(ctx, G, cam, sw, sh, dt) {
    const th = THEMES[G.A.theme], s = Seasons.at(G, cam.x, cam.y) || 'spring';
    const N = LOWFX ? 22 : MIDFX ? 40 : 60;
    if (!parts || parts.length !== N) parts = Array.from({ length: N }, (_, k) => ({ x: Math.random() * sw, y: Math.random() * sh, d: 0.5 + (k % 3) * 0.5, a: Math.random() * TAU, ph: Math.random() * 6 }));
    const wind = G.wind ? G.wind.x * 60 : 0, fall = s === 'winter' ? 38 : s === 'summer' ? 0 : 26;
    for (const p of parts) {
      const sp = p.d; p.x += ((s === 'summer' ? Math.sin(G.time * 0.7 + p.ph) * 14 : 22 + Math.sin(G.time * 1.3 + p.ph) * 18) + wind) * sp * dt; p.y += (fall + Math.cos(G.time * 1.1 + p.ph) * 10) * sp * dt; p.a += dt * (1.5 + p.ph * 0.3);
      if (p.x > sw + 20) p.x -= sw + 40; if (p.x < -20) p.x += sw + 40; if (p.y > sh + 20) { p.y -= sh + 40; p.x = Math.random() * sw; } if (p.y < -20) p.y += sh + 40;
      if (s === 'summer' && !th.night) continue;
      const spr = partSpr(s, (p.ph * 3) | 0), size = (s === 'winter' ? 5 : 9) * (0.6 + sp * 0.6);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(s === 'winter' || s === 'summer' ? 0 : p.a); ctx.scale(1, s === 'winter' || s === 'summer' ? 1 : 0.55 + 0.45 * Math.abs(Math.sin(p.a * 1.3)));
      ctx.globalAlpha = (s === 'summer' ? 0.45 + 0.45 * Math.sin(G.time * 3 + p.ph * 3) : 0.85) * (sp > 1.2 ? 0.75 : 1); ctx.drawImage(spr, -size, -size, size * 2, size * 2); ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  function worldBurst(ctx, G, dt) {
    for (let k = burst.length - 1; k >= 0; k--) { const b = burst[k]; b.t += dt; if (b.t > b.life) { burst.splice(k, 1); continue; } b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 30 * dt; b.a += b.va * dt;
      const spr = partSpr(b.s === 'summer' ? 'spring' : b.s, k % 3); ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a); ctx.globalAlpha = Math.min(1, (b.life - b.t) * 1.5); ctx.drawImage(spr, -8, -8, 16, 16); ctx.restore(); }
    ctx.globalAlpha = 1;
  }

  /* ---------- la mesa y los rodillos del pergamino (fuera del mapa) ---------- */
  let deskTile = null;
  function desk() {
    if (deskTile) return deskTile; const c = mk(256, 256), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 256, 0); g.addColorStop(0, '#2a1a12'); g.addColorStop(0.5, '#33211a'); g.addColorStop(1, '#2a1a12'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    for (let k = 0; k < 40; k++) { x.strokeStyle = `rgba(${k % 3 ? '20,10,6' : '80,52,34'},${0.25 + hash2(k, 3) * 0.3})`; x.lineWidth = 0.6 + hash2(k, 4) * 1.4; const y0 = hash2(k, 5) * 256; x.beginPath(); x.moveTo(0, y0); for (let i = 0; i <= 256; i += 16) x.lineTo(i, y0 + Math.sin(i / 40 + k) * 3); x.stroke(); }
    return (deskTile = c);
  }
  function backdrop(ctx, G, cam, sw, sh, dpr, wt) {
    // si el papel tapa toda la pantalla no hay nada que pintar alrededor (lo normal en la campaña)
    const W = G.T.W, H = G.T.H, z = cam.z, X0 = sw / 2 + (0 - cam.x) * z + cam.sx, X1 = sw / 2 + (W - cam.x) * z + cam.sx, Y0 = sh / 2 + (0 - cam.y) * z + cam.sy, Y1 = sh / 2 + (H - cam.y) * z + cam.sy;
    if (X0 <= 0 && Y0 <= 0 && X1 >= sw && Y1 >= sh) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = ctx.createPattern(desk(), 'repeat');
    if (X0 > 0) ctx.fillRect(0, 0, X0 + 2, sh); if (X1 < sw) ctx.fillRect(X1 - 2, 0, sw - X1 + 2, sh); if (Y0 > 0) ctx.fillRect(0, 0, sw, Y0 + 2); if (Y1 < sh) ctx.fillRect(0, Y1 - 2, sw, sh - Y1 + 2);
    wt();
    // sombra del papel sobre la mesa y borde de seda (montaje) arriba y abajo
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-26, -30, W + 52, 8); ctx.fillRect(-26, H + 22, W + 52, 8);
    ctx.fillStyle = '#c8a86a'; ctx.fillRect(-18, -22, W + 36, 22); ctx.fillRect(-18, H, W + 36, 22);
    ctx.fillStyle = '#7a2e22'; ctx.fillRect(-18, -16, W + 36, 8); ctx.fillRect(-18, H + 8, W + 36, 8);
    ctx.fillStyle = 'rgba(255,230,160,0.5)'; for (let xx = -10; xx < W + 18; xx += 26) { ctx.fillRect(xx, -13, 10, 2); ctx.fillRect(xx + 13, H + 11, 10, 2); }
    // rodillos de madera en los extremos
    for (const [x0, k] of [[-46, 0], [W + 10, 1]]) {
      const rg = ctx.createLinearGradient(x0, 0, x0 + 36, 0); rg.addColorStop(0, '#3a2414'); rg.addColorStop(0.45, '#9a6a3a'); rg.addColorStop(1, '#2a180c');
      ctx.fillStyle = rg; ctx.fillRect(x0, -34, 36, H + 68);
      ctx.fillStyle = '#d8b26a'; for (const yy of [-48, H + 34]) { ctx.beginPath(); ctx.ellipse(x0 + 18, yy + 7, 20, 9, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 2; ctx.stroke(); }
    }
  }
  // grano de papel sobre toda la imagen (une magos, hechizos y suelo en el mismo papel)
  function grain(ctx, sw, sh, dpr) {
    if (MIDFX) return; ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.12; ctx.fillStyle = ctx.createPattern(paper(), 'repeat'); ctx.fillRect(0, 0, sw, sh); ctx.restore();
  }
  // el tema del cuadro: los colores, la luz y el ánimo cambian con la estación de donde mira la cámara
  const themes = {};
  function theme(G, cam) {
    const base = THEMES[G.A.theme], s = (cam && Seasons.at(G, cam.x, cam.y)) || 'spring', k = G.A.theme + s; if (themes[k]) return themes[k];
    return (themes[k] = Object.assign({}, base, (base.sea && base.sea[s]) || {}));
  }
  // al cambiar el terreno de base (puertas, puentes, celdas quemadas) se repinta el suelo
  function invalidate(G) { for (const k in cache) if (k.startsWith(G.arena + '|')) delete cache[k]; }
  // pinta por adelantado las estaciones que va a usar el mapa (sin trabar el primer cuadro)
  function warm(G) { const P = panelsOf(G), list = new Set(P.map(p => seasonOfPanel(G, p))); for (const s of list) prerender(G, s); }
  return { on, prerender, ground, items, tree, bridgeCell, seenAt, iceCell, particles, worldBurst, backdrop, grain, theme, invalidate, warm, emblem, paper, wash, brush, cache };
})();

/* ---------- temas del Mundo 3 (cada estación trae su luz y su color) ---------- */
(() => {
  const base = Object.assign({}, THEMES.paramo, {
    ink: true, tree: 'ink', trees: ['pine', 'sakura', 'maple'], moon: false, bridge: 'ink',
    ambient: [70, 44, 30], ambientA: 0.05, lightK: 0.12, fog: [255, 250, 240], fogK: 0.16, bloom: 0.05, rays: 0.28, rayRgb: [255, 238, 205], moteRgb: [255, 244, 225], shadowK: 0.5, vig: '70,46,24', vigA: 0.35,
    grade: ['rgba(255,214,170,0.10)', 'rgba(80,100,170,0.10)'],
  });
  base.sea = {
    spring: { grade: ['rgba(255,190,210,0.14)', 'rgba(120,150,200,0.10)'], fog: [255, 240, 246], rayRgb: [255, 236, 240] },
    summer: { grade: ['rgba(255,230,150,0.12)', 'rgba(40,110,140,0.14)'], fog: [240, 255, 240], rays: 0.7, rayRgb: [255, 246, 200] },
    autumn: { grade: ['rgba(255,170,90,0.18)', 'rgba(120,60,40,0.12)'], fog: [255, 236, 210], rayRgb: [255, 210, 160] },
    winter: { grade: ['rgba(200,220,255,0.16)', 'rgba(70,90,150,0.16)'], fog: [236, 244, 255], rays: 0.3, rayRgb: [230, 240, 255], ambient: [40, 50, 80], ambientA: 0.1, vig: '40,50,70' },
  };
  base.music = 'wa';
  THEMES.miyajima = Object.assign({}, base, { trees: ['pine', 'sakura', 'pine', 'maple'], music: 'miyajima' });
  THEMES.wa = base;
})();
