/* =========================================================================
   ACABADO PRO (2.0) — lo que hace que la imagen se vea «de juego de verdad»:
   resplandor (bloom) de todo lo que brilla, corrección de color por
   escenario, rayos de luna entre la niebla, motas de luz desenfocadas en
   primer plano, sombras alargadas de magos y criaturas, cáusticas vivas en
   el agua, y el fondo del Mundo 2 (mar de nubes bajo las islas del cielo,
   ríos de lava en el fondo del abismo). Con calidad «ligera» se omite lo caro.
   ========================================================================= */
const Post = (() => {
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = 2; return c; };
  const b1 = mk(), b2 = mk(), b3 = mk(), wc = mk(), hc = mk();
  const fit = (c, w, h) => { w = Math.max(2, w | 0); h = Math.max(2, h | 0); if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } return c.getContext('2d'); };
  /* ---------- resplandor ---------- */
  let bf = 0;
  function bloom(ctx, k = 1) {
    if (LOWFX || k <= 0) return; const src = ctx.canvas, w = src.width, h = src.height;
    if (MIDFX) {
      // calidad media: el resplandor se calcula a 1/8 y cada dos cuadros (se ve casi igual y cuesta una fracción)
      const y2 = fit(b2, w / 8, h / 8), y3 = fit(b3, w / 16, h / 16);
      if ((bf++ & 1) === 0 || b2.width !== Math.max(2, (w / 8) | 0)) {
        y2.imageSmoothingEnabled = true; y2.imageSmoothingQuality = 'medium'; y3.imageSmoothingEnabled = true;
        y2.globalCompositeOperation = 'copy'; y2.drawImage(src, 0, 0, b2.width, b2.height);
        const y1 = fit(b1, w / 8, h / 8); y1.globalCompositeOperation = 'copy'; y1.drawImage(b2, 0, 0);
        y2.globalCompositeOperation = 'multiply'; y2.drawImage(b1, 0, 0); y2.drawImage(b1, 0, 0);
        y3.globalCompositeOperation = 'copy'; y3.drawImage(b2, 0, 0, b3.width, b3.height);
      }
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true; ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.62 * k; ctx.drawImage(b2, 0, 0, w, h); ctx.globalAlpha = 0.5 * k; ctx.drawImage(b3, 0, 0, w, h); ctx.restore(); return;
    }
    const x1 = fit(b1, w / 4, h / 4), x2 = fit(b2, w / 8, h / 8), x3 = fit(b3, w / 16, h / 16);
    for (const q of [x1, x2, x3]) { q.imageSmoothingEnabled = true; q.imageSmoothingQuality = 'high'; }
    x1.globalCompositeOperation = 'copy'; x1.drawImage(src, 0, 0, b1.width, b1.height);
    x2.globalCompositeOperation = 'copy'; x2.drawImage(b1, 0, 0, b2.width, b2.height);
    // umbral suave: multiplicar la imagen por sí misma deja solo lo que brilla de verdad
    x1.globalCompositeOperation = 'multiply'; x1.drawImage(b2, 0, 0, b1.width, b1.height);
    x2.globalCompositeOperation = 'copy'; x2.drawImage(b1, 0, 0, b2.width, b2.height);
    x1.globalCompositeOperation = 'multiply'; x1.drawImage(b2, 0, 0, b1.width, b1.height);
    x2.globalCompositeOperation = 'copy'; x2.drawImage(b1, 0, 0, b2.width, b2.height);
    x3.globalCompositeOperation = 'copy'; x3.drawImage(b2, 0, 0, b3.width, b3.height);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.6 * k; ctx.drawImage(b2, 0, 0, w, h); ctx.globalAlpha = 0.55 * k; ctx.drawImage(b3, 0, 0, w, h); ctx.restore();
  }
  /* ---------- color: frío arriba, cálido abajo (según el escenario) ---------- */
  function grade(ctx, th, sw, sh) {
    const g = ctx.createLinearGradient(0, 0, 0, sh), a = th.grade || ['rgba(70,100,220,0.26)', 'rgba(255,160,90,0.16)'];
    g.addColorStop(0, a[0]); g.addColorStop(1, a[1]);
    ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = g; ctx.fillRect(0, 0, sw, sh); ctx.restore();
  }
  /* ---------- rayos de luna y motas en primer plano (en pantalla, con paralaje) ---------- */
  const tints = {};
  function mote(rgb) { const k = rgb.join(','); if (tints[k]) return tints[k]; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, `rgba(${k},0.0)`); g.addColorStop(0.55, `rgba(${k},0.5)`); g.addColorStop(0.8, `rgba(${k},0.9)`); g.addColorStop(1, `rgba(${k},0)`); x.fillStyle = g; x.fillRect(0, 0, 64, 64); const g2 = x.createRadialGradient(32, 32, 0, 32, 32, 26); g2.addColorStop(0, `rgba(${k},0.55)`); g2.addColorStop(1, `rgba(${k},0)`); x.fillStyle = g2; x.fillRect(0, 0, 64, 64); return (tints[k] = c); }
  function rays(ctx, G, cam, sw, sh, th) {
    if (th.rays === 0) return; const t = G.time, rgb = th.rayRgb || th.fog, z = cam.z, slant = sh * 0.5, K = th.rays || 1;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 6; k++) {
      const w = (70 + hash2(k, 31) * 150) * Math.max(0.6, sw / 1280), span = sw + 700, X = (((k * 331 + hash2(k, 32) * 200 - cam.x * z * 0.55 + t * 6) % span) + span) % span - 450;
      const a = (0.02 + 0.016 * Math.sin(t * 0.33 + k * 1.9)) * K; if (a <= 0.004) continue;
      const g = ctx.createLinearGradient(0, 0, 0, sh); g.addColorStop(0, `rgba(${rgb.join(',')},${a * 1.5})`); g.addColorStop(0.75, `rgba(${rgb.join(',')},${a * 0.5})`); g.addColorStop(1, `rgba(${rgb.join(',')},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(X, -10); ctx.lineTo(X + w, -10); ctx.lineTo(X + w * 1.5 + slant, sh + 10); ctx.lineTo(X + slant - w * 0.3, sh + 10); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  function bokeh(ctx, G, cam, sw, sh, th) {
    if (MIDFX) return; const t = G.time, rgb = th.moteRgb || th.fog, spr = mote(rgb), z = cam.z, u = Math.max(0.6, Math.min(sw / 1280, sh / 720));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 18; k++) {
      const par = 1.15 + hash2(k, 41) * 0.5, r = (5 + hash2(k, 42) * 20) * u, spX = sw + 240, spY = sh + 240;
      const X = (((hash2(k, 43) * 3000 - cam.x * z * par + t * (6 + hash2(k, 44) * 14)) % spX) + spX) % spX - 120, Y = (((hash2(k, 45) * 2000 - cam.y * z * par - t * (4 + hash2(k, 46) * 8)) % spY) + spY) % spY - 120;
      ctx.globalAlpha = (0.05 + hash2(k, 47) * 0.1) * (0.6 + 0.4 * Math.sin(t * (0.6 + hash2(k, 48)) + k)) * (th.motes == null ? 1 : th.motes);
      ctx.drawImage(spr, X - r, Y - r, r * 2, r * 2);
    }
    ctx.restore();
  }
  /* ---------- sombras alargadas (la luz viene de arriba a la izquierda) ---------- */
  const shSpr = (() => { const c = document.createElement('canvas'); c.width = 96; c.height = 32; const x = c.getContext('2d'), g = x.createRadialGradient(30, 16, 2, 48, 16, 48); g.addColorStop(0, 'rgba(4,3,14,0.6)'); g.addColorStop(0.6, 'rgba(4,3,14,0.28)'); g.addColorStop(1, 'rgba(4,3,14,0)'); x.fillStyle = g; x.save(); x.scale(1, 0.34); x.beginPath(); x.arc(48, 47, 48, 0, TAU); x.fill(); x.restore(); return c; })();
  function shadows(ctx, G, th) {
    const ang = th.shadowAng != null ? th.shadowAng : 0.5, K = th.shadowK != null ? th.shadowK : 1; if (K <= 0) return;
    for (const u of G.units) {
      if (!u.alive || (u.obj && u.obj !== 'decoy')) continue; const s = u.boss ? u.r / 16 : u.isMage || u.obj ? 1.1 : (u.r || 16) / 15, fl = u.D && u.D.fly ? 26 : 0;
      ctx.save(); ctx.translate(u.x + fl * 0.6, u.y + 3 + fl); ctx.rotate(ang); ctx.globalAlpha = (u.st && u.st.hidden > 0 ? 0.25 : 0.8) * K; ctx.drawImage(shSpr, -14 * s, -11 * s, 96 * s, 22 * s); ctx.restore();
    }
  }
  /* ---------- agua viva: red de cáusticas que se desliza, recortada a la forma del agua ---------- */
  let caus = null;
  function makeCaustics() {
    const N = 256, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), id = x.createImageData(N, N), P = [];
    for (let k = 0; k < 26; k++) P.push([hash2(k, 51) * N, hash2(k, 52) * N]);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      let d1 = 1e9, d2 = 1e9; for (const [px, py] of P) { let dx = Math.abs(i - px), dy = Math.abs(j - py); if (dx > N / 2) dx = N - dx; if (dy > N / 2) dy = N - dy; const d = dx * dx + dy * dy; if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
      const e = Math.sqrt(d2) - Math.sqrt(d1), v = Math.max(0, 1 - e / 4.5), o = (j * N + i) * 4; id.data[o] = 215; id.data[o + 1] = 240; id.data[o + 2] = 255; id.data[o + 3] = Math.round(v * v * 255);
    }
    x.putImageData(id, 0, 0); return c;
  }
  function water(ctx, G, cam, sw, sh, dpr, img) {
    const mask = img && img.waterMask; if (!mask || MIDFX) return; if (!caus) caus = makeCaustics();
    const z = cam.z, k = dpr / 2, x = fit(wc, sw * k, sh * k), t = G.time, T = G.T;
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, wc.width, wc.height);
    const pat = x.createPattern(caus, 'repeat');
    for (const [sc, vx, vy, a] of [[0.55, 14, 6, 0.8], [0.9, -9, 11, 0.55]]) {
      x.setTransform(k * z * sc, 0, 0, k * z * sc * 0.62, k * (sw / 2 - cam.x * z + cam.sx) + t * vx * k * z, k * (sh / 2 - cam.y * z + cam.sy) + t * vy * k * z);
      x.globalAlpha = a; x.fillStyle = pat; const x0 = (cam.x - sw / z - t * vx) / sc - 300, y0 = (cam.y - sh / z - t * vy) / sc / 0.62 - 300; x.fillRect(x0, y0, sw * 2 / z / sc + 600, sh * 2 / z / sc / 0.62 + 600);
    }
    x.globalAlpha = 1; x.globalCompositeOperation = 'destination-in';
    x.setTransform(k * z, 0, 0, k * z, k * (sw / 2 - cam.x * z + cam.sx), k * (sh / 2 - cam.y * z + cam.sy)); x.imageSmoothingEnabled = true; x.drawImage(mask, 0, 0, T.W, T.H);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.2; ctx.drawImage(wc, 0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore();
  }
  /* ---------- fondos del Mundo 2 (se ven por los huecos del suelo) ----------
     Cielo: muy abajo un mar de nubes, islotes lejanos entre la bruma, nubes medias con su sombra, bandadas y jirones cercanos.
     Infierno: corteza de lava agrietada que late, ríos de magma, peñascos que flotan alumbrados desde abajo, humo y brasas. */
  const spr = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d')); return c; };
  const tinted = (src, col) => spr(src.width, src.height, x => { x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, src.width, src.height); });
  function cloudSpr(seed) {
    return spr(200, 130, x => {
      for (let k = 0; k < 13; k++) { const px = 100 + (hash2(k, seed) - 0.5) * 112, py = 70 + (hash2(k, seed + 1) - 0.5) * 34 - (1 - Math.abs(px - 100) / 60) * 10, r = 20 + hash2(k, seed + 2) * 22, g = x.createRadialGradient(px - r * 0.3, py - r * 0.35, r * 0.1, px, py, r); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.55, 'rgba(246,249,255,0.92)'); g.addColorStop(1, 'rgba(228,236,252,0)'); x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill(); }
      x.globalCompositeOperation = 'source-atop'; const g = x.createLinearGradient(50, 30, 150, 120); g.addColorStop(0.3, 'rgba(120,150,215,0)'); g.addColorStop(1, 'rgba(104,136,210,0.6)'); x.fillStyle = g; x.fillRect(0, 0, 200, 130);
    });
  }
  // islote o peñasco visto desde arriba: tapa, pared que se estrecha hacia abajo y bruma que lo aleja
  function isleSpr(seed, C) {
    return spr(170, 160, x => {
      const pts = []; for (let k = 0; k < 11; k++) { const a = k / 11 * TAU, r = 42 + hash2(k, seed) * 24; pts.push([85 + Math.cos(a) * r * 1.25, 60 + Math.sin(a) * r * 0.7]); }
      const path = dy => { x.beginPath(); for (let k = 0; k <= pts.length; k++) { const p = pts[k % pts.length], q = pts[(k + 1) % pts.length], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2 + dy; k ? x.quadraticCurveTo(p[0], p[1] + dy, mx, my) : x.moveTo(mx, my); } x.closePath(); };
      const cg = x.createLinearGradient(0, 60, 0, 150); cg.addColorStop(0, C.cliff[0]); cg.addColorStop(0.75, C.cliff[1]); cg.addColorStop(1, C.cliff[2] || C.cliff[1]); x.fillStyle = cg;
      for (let d = 54; d >= 0; d -= 6) { x.save(); x.translate(85, 60); x.scale(1 - Math.pow(d / 60, 1.6) * 0.8, 1); x.translate(-85, -60); path(d); x.fill(); x.restore(); }
      // estrías de la pared
      x.save(); path(0); x.globalCompositeOperation = 'source-atop'; x.strokeStyle = 'rgba(0,0,0,0.22)'; x.lineWidth = 2; for (let k = 0; k < 9; k++) { const X = 30 + k * 14 + hash2(k, seed + 5) * 6; x.beginPath(); x.moveTo(X, 70); x.lineTo(X + (X - 85) * -0.25, 140); x.stroke(); } x.restore();
      path(0); const tg = x.createLinearGradient(40, 20, 130, 100); tg.addColorStop(0, C.top[0]); tg.addColorStop(1, C.top[1]); x.fillStyle = tg; x.fill();
      x.strokeStyle = C.rim; x.lineWidth = 1.6; x.stroke();
      x.save(); x.clip(); C.deco(x, seed); x.restore();
      if (C.haze) { x.globalCompositeOperation = 'source-atop'; x.fillStyle = C.haze; x.fillRect(0, 0, 170, 160); }
    });
  }
  const ISLE_SKY = { cliff: ['#b8a890', '#6a5a72', '#4a4266'], top: ['#b8d488', '#7ea458'], rim: 'rgba(255,255,255,0.45)', haze: 'rgba(140,184,238,0.3)',
    deco(x, seed) { for (let k = 0; k < 9; k++) { const px = 40 + hash2(k, seed + 7) * 90, py = 38 + hash2(k, seed + 8) * 44, r = 4 + hash2(k, seed + 9) * 4; x.fillStyle = 'rgba(40,70,40,0.35)'; x.beginPath(); x.ellipse(px + 3, py + 4, r, r * 0.6, 0, 0, TAU); x.fill(); x.fillStyle = k % 4 === 0 ? '#f4c0dc' : k % 4 === 1 ? '#f0d890' : '#5e8a4a'; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,255,255,0.3)'; x.beginPath(); x.arc(px - r * 0.3, py - r * 0.3, r * 0.45, 0, TAU); x.fill(); } } };
  const ISLE_HELL = { cliff: ['#2a1a20', '#0c0608', '#7a2408'], top: ['#5c4654', '#2c1e28'], rim: 'rgba(255,176,110,0.55)', haze: null,
    deco(x, seed) { x.strokeStyle = 'rgba(255,120,40,0.75)'; x.lineWidth = 1.3; x.lineCap = 'round'; for (let k = 0; k < 4; k++) { let px = 45 + hash2(k, seed + 7) * 80, py = 36 + hash2(k, seed + 8) * 44; x.beginPath(); x.moveTo(px, py); for (let q = 0; q < 4; q++) { px += (hash2(k * 7 + q, seed + 9) - 0.5) * 26; py += (hash2(k * 7 + q, seed + 10) - 0.3) * 14; x.lineTo(px, py); } x.stroke(); } x.fillStyle = 'rgba(0,0,0,0.3)'; for (let k = 0; k < 6; k++) { x.beginPath(); x.ellipse(40 + hash2(k, seed + 11) * 90, 36 + hash2(k, seed + 12) * 46, 7, 4, 0, 0, TAU); x.fill(); } } };
  let SK = null, HL = null;
  function skyAssets() { if (SK) return SK; const clouds = [cloudSpr(61), cloudSpr(64), cloudSpr(67)]; return (SK = { clouds, shadows: clouds.map(c => tinted(c, 'rgb(46,92,176)')), isles: [isleSpr(71, ISLE_SKY), isleSpr(74, ISLE_SKY), isleSpr(79, ISLE_SKY)] }); }
  function hellAssets() {
    if (HL) return HL; const clouds = [cloudSpr(61), cloudSpr(64)];
    // corteza agrietada: celdas oscuras con las grietas encendidas (se repite sin costura)
    const N = 256, crust = spr(N, N, x => { const id = x.createImageData(N, N), P = []; for (let k = 0; k < 22; k++) P.push([hash2(k, 151) * N, hash2(k, 152) * N]);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { let d1 = 1e9, d2 = 1e9; const ui = i / N * TAU, uj = j / N * TAU, wi = ((i + 7 * Math.sin(uj * 3 + 1.3) + 4 * Math.sin(ui * 5 + uj * 2)) % N + N) % N, wj = ((j + 7 * Math.sin(ui * 4 + 0.7) + 4 * Math.sin(uj * 6 + ui * 3)) % N + N) % N; for (const [px, py] of P) { let dx = Math.abs(wi - px), dy = Math.abs(wj - py); if (dx > N / 2) dx = N - dx; if (dy > N / 2) dy = N - dy; const d = dx * dx + dy * dy; if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
        const wd = 0.6 + 0.4 * Math.sin(ui * 2 + 1) * Math.sin(uj * 3 + 2), e = Math.sqrt(d2) - Math.sqrt(d1), v = Math.max(0, 1 - e / (4 + 5 * wd)), w = Math.max(0, 1 - e / (1 + 2 * wd)), o = (j * N + i) * 4; id.data[o] = 255; id.data[o + 1] = Math.round(90 + w * 150); id.data[o + 2] = Math.round(20 + w * 90); id.data[o + 3] = Math.round(Math.min(1, v * v * 0.75 + w * 0.6) * 255); }
      x.putImageData(id, 0, 0); });
    return (HL = { crust, smoke: clouds.map(c => tinted(c, 'rgb(26,14,18)')), rocks: [isleSpr(171, ISLE_HELL), isleSpr(174, ISLE_HELL), isleSpr(179, ISLE_HELL)] });
  }
  // reparte imágenes por la pantalla con paralaje (se repiten al salir por un borde)
  function scatter(ctx, list, n, seed, cam, z, par, sw, sh, size, t, drift, alpha, shadow, bob) {
    const spX = sw + size * 2.4, spY = sh + size * 2;
    for (let k = 0; k < n; k++) {
      const im = list[k % list.length], w = size * (0.7 + hash2(k, seed + 3) * 0.6), h = w * im.height / im.width;
      const X = (((hash2(k, seed) * 5000 + k * spX / n - cam.x * z * par + t * drift) % spX) + spX) % spX - size * 1.2, Y = (((hash2(k, seed + 1) * 3700 - cam.y * z * par) % spY) + spY) % spY - size + (bob ? Math.sin(t * 0.6 + k * 1.9) * bob : 0);
      if (shadow) { ctx.globalAlpha = alpha * 0.4; ctx.drawImage(shadow[k % list.length], X + w * 0.08, Y + w * 0.12, w, h); }
      ctx.globalAlpha = alpha; ctx.drawImage(im, X, Y, w, h);
    }
    ctx.globalAlpha = 1;
  }
  function backdrop(ctx, G, cam, sw, sh, th) {
    const t = G.time, z = cam.z, u = Math.max(0.6, Math.min(sw / 1280, sh / 720)) * (0.6 + 0.4 * z);
    if (th.sky === 'cielo') {
      const A = skyAssets();
      const g = ctx.createLinearGradient(0, 0, 0, sh); g.addColorStop(0, th.skyCol[0]); g.addColorStop(0.55, th.skyCol[1]); g.addColorStop(1, th.skyCol[2]); ctx.fillStyle = g; ctx.fillRect(0, 0, sw, sh);
      // claridad del fondo: abajo, muy lejos, el aire se aclara
      const dg = ctx.createRadialGradient(sw * 0.5, sh * 0.6, 0, sw * 0.5, sh * 0.6, Math.max(sw, sh) * 0.7); dg.addColorStop(0, 'rgba(206,230,255,0.5)'); dg.addColorStop(1, 'rgba(206,230,255,0)'); ctx.fillStyle = dg; ctx.fillRect(0, 0, sw, sh);
      if (!LOWFX) scatter(ctx, A.clouds, 9, 201, cam, z, 0.1, sw, sh, 560 * u, t, 3, 0.3);
      // el sol se cuela por un lado
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const sg = ctx.createRadialGradient(sw * 0.8, sh * 0.16, 0, sw * 0.8, sh * 0.16, sh * 0.85); sg.addColorStop(0, 'rgba(255,238,190,0.34)'); sg.addColorStop(1, 'rgba(255,238,190,0)'); ctx.fillStyle = sg; ctx.fillRect(0, 0, sw, sh); ctx.restore();
      scatter(ctx, A.isles, 5, 211, cam, z, 0.26, sw, sh, 200 * u, t, 0, 0.95, null, 3);
      scatter(ctx, A.clouds, 8, 221, cam, z, 0.42, sw, sh, 310 * u, t, 8, 0.82, A.shadows);
      // bandadas que cruzan muy abajo
      ctx.strokeStyle = 'rgba(36,58,112,0.7)'; ctx.lineWidth = 1.7 * u; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let f = 0; f < 2; f++) { const span = sw + 500, fx = (((hash2(f, 231) * 2000 + t * (26 + f * 9) - cam.x * z * 0.55) % span) + span) % span - 250, fy = (((hash2(f, 232) * 1500 - cam.y * z * 0.55) % (sh + 200)) + sh + 200) % (sh + 200) - 100;
        for (let k = 0; k < 5; k++) { const bx = fx - Math.abs(k - 2) * 20 * u, by = fy + (k - 2) * 13 * u, fl = Math.sin(t * 7 + k * 1.3 + f) * 3.4 * u, ws = 6.5 * u; ctx.beginPath(); ctx.moveTo(bx - ws, by - 2 * u + fl); ctx.quadraticCurveTo(bx - ws * 0.4, by - 2.6 * u, bx, by); ctx.quadraticCurveTo(bx + ws * 0.2, by - 3 * u, bx + ws * 0.7, by - 3.2 * u + fl); ctx.stroke(); } }
      if (!LOWFX) scatter(ctx, A.clouds, 5, 241, cam, z, 0.72, sw, sh, 460 * u, t, 16, 0.3);
      const hz = ctx.createLinearGradient(0, 0, 0, sh); hz.addColorStop(0, 'rgba(255,214,150,0.08)'); hz.addColorStop(1, 'rgba(120,150,255,0.06)'); ctx.fillStyle = hz; ctx.fillRect(0, 0, sw, sh);
    } else if (th.sky === 'infierno') {
      const A = hellAssets();
      const bg = ctx.createRadialGradient(sw * 0.5, sh * 0.55, 0, sw * 0.5, sh * 0.55, Math.max(sw, sh) * 0.75); bg.addColorStop(0, '#3a0e0a'); bg.addColorStop(0.6, '#1c0608'); bg.addColorStop(1, '#090204'); ctx.fillStyle = bg; ctx.fillRect(0, 0, sw, sh);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      // bolsas de magma que laten bajo la corteza; las grietas solo se encienden cerca de ellas
      const x2 = LOWFX ? null : fit(hc, sw / 2, sh / 2); if (x2) { x2.setTransform(0.5, 0, 0, 0.5, 0, 0); x2.globalCompositeOperation = 'source-over'; x2.globalAlpha = 1; x2.clearRect(0, 0, sw, sh); }
      for (let k = 0; k < (LOWFX ? 4 : 8); k++) { const r = (200 + hash2(k, 251) * 190) * u, spX = sw + r * 2, spY = sh + r * 2, X = (((hash2(k, 252) * 4000 + k * spX / 8 - cam.x * z * 0.2) % spX) + spX) % spX - r, Y = (((hash2(k, 253) * 3000 - cam.y * z * 0.2) % spY) + spY) % spY - r, p = 0.55 + 0.45 * Math.sin(t * (0.5 + hash2(k, 254) * 0.6) + k * 2.1);
        const mg = ctx.createRadialGradient(X, Y, 0, X, Y, r); mg.addColorStop(0, `rgba(255,140,44,${0.3 * p})`); mg.addColorStop(0.4, `rgba(255,66,18,${0.18 * p})`); mg.addColorStop(1, 'rgba(160,20,0,0)'); ctx.fillStyle = mg; ctx.fillRect(X - r, Y - r, r * 2, r * 2);
        if (x2) { const kg = x2.createRadialGradient(X, Y, 0, X, Y, r * 1.25); kg.addColorStop(0, `rgba(255,255,255,${0.5 + 0.5 * p})`); kg.addColorStop(0.55, `rgba(255,255,255,${0.3 + 0.2 * p})`); kg.addColorStop(1, 'rgba(255,255,255,0)'); x2.fillStyle = kg; x2.fillRect(X - r * 1.25, Y - r * 1.25, r * 2.5, r * 2.5); } }
      if (x2) { const ox = -cam.x * z * 0.2, oy = -cam.y * z * 0.2; x2.globalCompositeOperation = 'source-in';
        for (const [sc, al] of [[1.25 * u, 1]]) { x2.save(); x2.translate(ox, oy); x2.scale(sc, sc); x2.globalAlpha = al; x2.fillStyle = x2.createPattern(A.crust, 'repeat'); x2.fillRect(-ox / sc, -oy / sc, sw / sc, sh / sc); x2.restore(); }
        ctx.globalAlpha = 0.9; ctx.drawImage(hc, 0, 0, sw, sh); ctx.globalAlpha = 1; }
      // ríos de magma que serpentean despacio
      { const par = 0.3, gap = 300 * u; for (let k = -1; k < sw / gap + 2; k++) { const bx = k * gap - ((cam.x * z * par) % gap), ph = Math.floor(cam.x * z * par / gap) + k; ctx.beginPath(); for (let y = -40; y <= sh + 40; y += 36) { const wy = y + cam.y * z * par, X = bx + Math.sin(wy * 0.006 + ph * 2.1) * 80 * u + Math.sin(wy * 0.017 + ph) * 24 * u; y === -40 ? ctx.moveTo(X, y) : ctx.lineTo(X, y); }
        if (!LOWFX) { ctx.strokeStyle = 'rgba(255,80,16,0.14)'; ctx.lineWidth = 44 * u; ctx.stroke(); } ctx.strokeStyle = `rgba(255,140,40,${0.2 + 0.05 * Math.sin(t * 1.3 + ph)})`; ctx.lineWidth = 16 * u; ctx.stroke(); ctx.strokeStyle = `rgba(255,226,130,${0.3 + 0.08 * Math.sin(t * 1.7 + ph * 2)})`; ctx.lineWidth = 4.5 * u; ctx.stroke(); } }
      ctx.restore();
      // peñascos que flotan, alumbrados desde abajo
      scatter(ctx, A.rocks, LOWFX ? 4 : 6, 261, cam, z, 0.5, sw, sh, 190 * u, t, 0, 1, null, 4);
      if (!LOWFX) scatter(ctx, A.smoke, 6, 271, cam, z, 0.66, sw, sh, 420 * u, t, -7, 0.3);
      // brasas que suben
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < (LOWFX ? 20 : 44); k++) { const p = (t * (0.05 + hash2(k, 95) * 0.08) + hash2(k, 96)) % 1, X = (((hash2(k, 97) * 3000 - cam.x * z * 0.6) % sw) + sw) % sw + Math.sin(t * 1.2 + k) * 14, Y = sh * (1 - p), r = (1 + hash2(k, 98) * 1.8) * u, a = Math.sin(p * Math.PI) * 0.8; if (!LOWFX) { ctx.fillStyle = `rgba(255,${130 + (k % 4) * 30},50,${a * 0.25})`; ctx.beginPath(); ctx.arc(X, Y, r * 3, 0, TAU); ctx.fill(); } ctx.fillStyle = `rgba(255,${190 + (k % 3) * 20},110,${a})`; ctx.beginPath(); ctx.arc(X, Y, r, 0, TAU); ctx.fill(); }
      ctx.restore(); const vg = ctx.createRadialGradient(sw / 2, sh / 2, sh * 0.25, sw / 2, sh / 2, sw * 0.72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, sw, sh);
    }
  }
  return { bloom, grade, rays, bokeh, shadows, water, backdrop };
})();
