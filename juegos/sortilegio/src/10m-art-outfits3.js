/* =========================================================================
   ATUENDOS DEL MUNDO 3 — telas, auras y estelas propias de Sortilegio.
   Se suman a las del vestidor común (Vest.MAT / Vest.AURA / Vest.TRAIL)
   sin tocar shared/: Kitsune, Raijin, Tinta viva, Cuatro estaciones y
   Yokozuna (olas seigaiha).
   ========================================================================= */
const ArtOutfits3 = (() => {
  if (typeof Vest === 'undefined') return {};
  const { glow, star, put } = Vest;
  const h = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
  const R0 = s => { let v = s >>> 0; return () => (v = (v * 1664525 + 1013904223) >>> 0) / 4294967296; };
  const SP = {};
  const mk = (w, hh) => { const c = document.createElement('canvas'); c.width = w; c.height = hh; return c; };
  // la estación de «Cuatro estaciones»: la misma para la tela, el aura y la estela (reloj de pared)
  const SEAS_T = 3.4;
  const season = () => { const u = performance.now() / 1000 / SEAS_T; const k = Math.floor(u) % 4, f = u - Math.floor(u); return { k, n: (k + 1) % 4, f: f > 0.72 ? (f - 0.72) / 0.28 : 0 }; };

  /* ---------------- sprites pequeños (se dibujan una vez) ---------------- */
  function sakura(c1 = '#ffd6e6', c2 = '#ff8ab8') {
    const k = 'sk' + c1 + c2; if (SP[k]) return SP[k];
    const c = mk(48, 48), x = c.getContext('2d'); x.translate(24, 24);
    for (let i = 0; i < 5; i++) { x.save(); x.rotate(i / 5 * TAU); const g = x.createLinearGradient(0, 0, 0, -20); g.addColorStop(0, c2); g.addColorStop(1, c1); x.fillStyle = g; x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(-10, -6, -9, -18, -3, -20); x.lineTo(0, -17); x.lineTo(3, -20); x.bezierCurveTo(9, -18, 10, -6, 0, 0); x.fill(); x.restore(); }
    x.fillStyle = '#ffe9a0'; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.6; x.beginPath(); x.arc(Math.cos(a) * 5, Math.sin(a) * 5, 1.4, 0, TAU); x.fill(); }
    x.fillStyle = '#d84a7a'; x.beginPath(); x.arc(0, 0, 2.4, 0, TAU); x.fill();
    return (SP[k] = c);
  }
  function maple(c1 = '#ff6a2a', c2 = '#c8281e') {
    const k = 'mp' + c1 + c2; if (SP[k]) return SP[k];
    const c = mk(48, 48), x = c.getContext('2d'); x.translate(24, 26);
    const g = x.createRadialGradient(0, 0, 2, 0, 0, 22); g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; x.beginPath();
    const L = [[0, -21], [-4, -11], [-10, -15], [-9, -6], [-20, -8], [-14, 0], [-17, 5], [-8, 4], [-6, 10], [0, 6], [6, 10], [8, 4], [17, 5], [14, 0], [20, -8], [9, -6], [10, -15], [4, -11]];
    L.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(90,10,0,.55)'; x.lineWidth = 1; x.beginPath(); x.moveTo(0, 14); x.lineTo(0, -18); x.moveTo(0, 0); x.lineTo(-15, -6); x.moveTo(0, 0); x.lineTo(15, -6); x.moveTo(0, 2); x.lineTo(-12, 4); x.moveTo(0, 2); x.lineTo(12, 4); x.stroke();
    return (SP[k] = c);
  }
  function snow() {
    if (SP.sn) return SP.sn; const c = mk(40, 40), x = c.getContext('2d'); x.translate(20, 20);
    x.strokeStyle = '#ffffff'; x.lineWidth = 2; x.lineCap = 'round';
    for (let i = 0; i < 6; i++) { x.save(); x.rotate(i / 6 * TAU); x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -16); x.moveTo(0, -9); x.lineTo(-5, -13); x.moveTo(0, -9); x.lineTo(5, -13); x.stroke(); x.restore(); }
    return (SP.sn = c);
  }
  function inkDot(a = 1) { // gota de tinta con borde un poco irregular
    const k = 'ink'; if (SP[k]) return SP[k]; const c = mk(40, 40), x = c.getContext('2d'), r = R0(9);
    x.fillStyle = '#1d1817'; x.beginPath(); for (let i = 0; i <= 14; i++) { const a = i / 14 * TAU, rr = 13 + r() * 4; i ? x.lineTo(20 + Math.cos(a) * rr, 20 + Math.sin(a) * rr) : x.moveTo(20 + Math.cos(a) * rr, 20 + Math.sin(a) * rr); } x.fill();
    return (SP[k] = c);
  }
  function tomoe(x, X, Y, r, rot, col) { // mitsudomoe: tres comas girando
    x.save(); x.translate(X, Y); x.rotate(rot); x.fillStyle = col;
    for (let i = 0; i < 3; i++) { x.save(); x.rotate(i / 3 * TAU); x.beginPath(); x.arc(0, -r * 0.42, r * 0.36, 0, TAU); x.fill(); x.beginPath(); x.moveTo(r * 0.36, -r * 0.42); x.quadraticCurveTo(r * 0.55, r * 0.2, -r * 0.1, r * 0.5); x.quadraticCurveTo(r * 0.3, r * 0.05, -r * 0.36, -r * 0.42); x.fill(); x.restore(); }
    x.restore();
  }
  // pincelada de sumi: el trazo es un solo contorno relleno (sin cuentas donde se pisan los segmentos),
  // con aguada suave alrededor y, al final, cerdas secas que se abren
  function ribbonFill(x, pts, W, from, to) {
    const n = pts.length - 1, L = [], Rr = [];
    for (let i = 0; i <= n; i++) { const u = i / n; if (u < from - 1e-6 || u > to + 1e-6) continue;
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, w = W(u) / 2;
      L.push([pts[i][0] + nx * w, pts[i][1] + ny * w]); Rr.push([pts[i][0] - nx * w, pts[i][1] - ny * w]); }
    if (L.length < 2) return; x.beginPath(); L.forEach(([a, b], k) => k ? x.lineTo(a, b) : x.moveTo(a, b)); for (let k = Rr.length - 1; k >= 0; k--) x.lineTo(Rr[k][0], Rr[k][1]); x.closePath(); x.fill();
    const s0 = pts[Math.round(from * n)]; x.beginPath(); x.arc(s0[0], s0[1], W(from) / 2, 0, TAU); x.fill();
  }
  function brush(x, pts, w0, w1, col, dry = 0.3, seed = 1) {
    const r = R0(seed), n = pts.length - 1; if (n < 1) return; x.fillStyle = col; x.strokeStyle = col; x.lineCap = 'round';
    const W = u => Math.max(0.5, (w0 + (w1 - w0) * u) * (1 + Math.sin(u * 9 + seed) * 0.08)), sv = x.globalAlpha, cut = 1 - dry;
    x.globalAlpha = sv * 0.14; ribbonFill(x, pts, u => W(u) * 1.4, 0, 1);
    x.globalAlpha = sv * 0.95; ribbonFill(x, pts, u => W(u) * (u > cut ? Math.max(0.25, 1 - (u - cut) / Math.max(0.05, dry) * 1.4) : 1), 0, Math.min(1, cut + dry * 0.5));
    const B = 7; for (let b = 0; b < B; b++) { // cerdas: la parte seca del final
      const off = (b / (B - 1) - 0.5) * 0.85, stop = cut + (1 - cut) * (0.5 + r() * 0.5); x.globalAlpha = sv * (0.55 + r() * 0.45); x.beginPath(); let on = false;
      for (let i = 1; i <= n; i++) { const u = i / n; if (u < cut - 0.02) continue; if (u > stop) break;
        const [ax, ay] = pts[i - 1], [bx, by] = pts[i], dx = bx - ax, dy = by - ay, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, w = W(u);
        if (r() < 0.15) { on = false; continue; } if (!on) x.moveTo(ax + nx * off * w, ay + ny * off * w); x.lineTo(bx + nx * off * w, by + ny * off * w); on = true; }
      x.lineWidth = Math.max(0.7, W(cut) / B); x.stroke();
    }
    x.globalAlpha = sv;
  }

  /* ---------------- TELAS ---------------- */
  const MAT = {
    // piel de zorra blanca con marcas rojas (kumadori) y puntos de oro; dentro, fuegos de zorro que suben
    kitsune: { tile(x, W, H, c) {
        const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, c[0]); g.addColorStop(1, c[3]); x.fillStyle = g; x.fillRect(0, 0, W, H);
        const r = R0(21); x.lineCap = 'round';
        for (let i = 0; i < 260; i++) { const X = r() * W, Y = r() * H, a = Math.PI / 2 + (r() - 0.5) * 0.7, l = 5 + r() * 8; x.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,.55)' : 'rgba(150,120,90,.22)'; x.lineWidth = 1; x.beginPath(); x.moveTo(X, Y); x.quadraticCurveTo(X + Math.cos(a) * l * 0.5 + 2, Y + Math.sin(a) * l * 0.5, X + Math.cos(a) * l, Y + Math.sin(a) * l); x.stroke(); }
        for (let k = 0; k < 4; k++) { // llamas rojas de kumadori
          const X = (k + 0.5) / 4 * W + (k % 2 ? 8 : -8), Y = H * (0.25 + (k % 2) * 0.45); x.fillStyle = c[1];
          x.beginPath(); x.moveTo(X - 14, Y + 26); x.bezierCurveTo(X - 18, Y + 4, X - 6, Y - 4, X - 4, Y - 26); x.bezierCurveTo(X + 2, Y - 10, X + 10, Y - 6, X + 8, Y - 18); x.bezierCurveTo(X + 20, Y, X + 14, Y + 18, X + 6, Y + 26); x.quadraticCurveTo(X - 4, Y + 18, X - 14, Y + 26); x.fill();
          x.fillStyle = c[2]; x.beginPath(); x.arc(X, Y + 30, 3, 0, TAU); x.fill(); x.beginPath(); x.arc(X - 9, Y + 36, 2, 0, TAU); x.fill(); x.beginPath(); x.arc(X + 9, Y + 36, 2, 0, TAU); x.fill();
        }
        x.strokeStyle = c[2]; x.lineWidth = 2.4; x.beginPath(); x.moveTo(0, H - 8); for (let X = 0; X <= W; X += 20) x.quadraticCurveTo(X + 10, H - 18, X + 20, H - 8); x.stroke();
      },
      anim(x, bx, by, bw, bh, t) { x.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const p = (t * 0.35 + h(i, 1)) % 1; put(x, glow('120,200,255', true), bx + (0.15 + h(i, 2) * 0.7) * bw + Math.sin(t * 2 + i) * bw * 0.05, by + bh * (0.95 - p * 0.9), Math.min(bw, bh) * 0.26, Math.sin(p * Math.PI) * 0.75); } } },
    // nubes y tomoe de oro sobre índigo; cada tanto lo cruza un relámpago
    raijin: { tile(x, W, H, c) {
        const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, c[2]); g.addColorStop(0.5, c[0]); g.addColorStop(1, '#05081a'); x.fillStyle = g; x.fillRect(0, 0, W, H);
        const cloud = (X, Y, s) => { x.fillStyle = 'rgba(70,90,160,.55)'; x.strokeStyle = c[1]; x.lineWidth = 1.6; x.beginPath(); x.arc(X - s, Y, s * 0.7, Math.PI, 0); x.arc(X, Y - s * 0.3, s * 0.9, Math.PI, 0); x.arc(X + s, Y, s * 0.7, Math.PI, 0); x.closePath(); x.fill(); x.stroke(); x.beginPath(); x.arc(X + s * 1.55, Y - s * 0.1, s * 0.35, Math.PI * 0.2, Math.PI * 1.7); x.stroke(); x.beginPath(); x.arc(X - s * 1.55, Y - s * 0.1, s * 0.35, -Math.PI * 0.7, Math.PI * 0.8); x.stroke(); };
        cloud(W * 0.28, H * 0.22, 16); cloud(W * 0.78, H * 0.52, 14); cloud(W * 0.3, H * 0.84, 15);
        tomoe(x, W * 0.74, H * 0.2, 13, 0.3, c[1]); tomoe(x, W * 0.22, H * 0.55, 11, 1.2, c[1]); tomoe(x, W * 0.8, H * 0.86, 10, 2.2, c[1]);
        x.strokeStyle = 'rgba(232,176,48,.5)'; x.lineWidth = 1; for (let i = 0; i < 6; i++) { const X = h(i, 4) * W, Y = h(i, 5) * H; x.beginPath(); x.moveTo(X, Y); x.lineTo(X + 6, Y + 8); x.lineTo(X + 2, Y + 9); x.lineTo(X + 9, Y + 18); x.stroke(); }
      },
      anim(x, bx, by, bw, bh, t) {
        const k = Math.floor(t / 1.4), f = t / 1.4 - k; if (f > 0.22) return; const a = 1 - f / 0.22;
        x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(150,190,255,${(a * 0.22).toFixed(3)})`; x.fillRect(bx, by, bw, bh);
        x.strokeStyle = `rgba(255,240,170,${a.toFixed(3)})`; x.lineWidth = Math.max(1.2, bw * 0.035); x.lineJoin = 'round'; x.beginPath();
        let X = bx + h(k, 1) * bw, Y = by; x.moveTo(X, Y); while (Y < by + bh) { Y += bh * 0.12; X += (h(k, Y) - 0.5) * bw * 0.35; x.lineTo(X, Y); } x.stroke();
      } },
    // tinta viva sobre papel de arroz: pinceladas, aguadas, salpicaduras y un sello rojo; la tinta corre
    sumi: { pan: true, tile(x, W, H, c) {
        x.fillStyle = c[0]; x.fillRect(0, 0, W, H); const r = R0(77);
        for (let i = 0; i < 500; i++) { x.fillStyle = r() < 0.5 ? 'rgba(120,100,70,.10)' : 'rgba(255,255,255,.25)'; x.fillRect(r() * W, r() * H, 1 + r() * 2, 0.6); }
        x.globalAlpha = 1; for (let i = 0; i < 5; i++) { const X = r() * W, Y = r() * H, R = 20 + r() * 34, g = x.createRadialGradient(X, Y, 0, X, Y, R); const ink = c[1] === '#1d1817' ? '29,24,23' : '239,230,210'; g.addColorStop(0, `rgba(${ink},.22)`); g.addColorStop(1, `rgba(${ink},0)`); x.fillStyle = g; x.fillRect(X - R, Y - R, R * 2, R * 2); }
        for (let s = 0; s < 14; s++) { const X0 = ((s % 4) + 0.2 + r() * 0.6) / 4 * W, Y0 = (Math.floor(s / 4) + r()) / 4 * H, a = (s % 2 ? 1.2 : -0.6) + r() * 0.8, L = 60 + r() * 90, pts = []; for (let i = 0; i <= 14; i++) { const u = i / 14; pts.push([X0 + Math.cos(a + Math.sin(u * 3) * 0.5) * L * u, Y0 + Math.sin(a + Math.sin(u * 3) * 0.5) * L * u]); } brush(x, pts, 9 + r() * 12, 2 + r() * 4, c[1], 0.4, s + 3); }
        x.fillStyle = c[1]; for (let i = 0; i < 26; i++) { const R = 0.8 + r() * 2.6; x.globalAlpha = 0.5 + r() * 0.5; x.beginPath(); x.arc(r() * W, r() * H, R, 0, TAU); x.fill(); } x.globalAlpha = 1;
        // sello (hanko) rojo con un carácter cuadrado
        const X = W * 0.68, Y = H * 0.7; x.fillStyle = c[2]; x.fillRect(X, Y, 22, 22); x.strokeStyle = c[0]; x.lineWidth = 2; x.strokeRect(X + 3, Y + 3, 16, 16); x.beginPath(); x.moveTo(X + 7, Y + 7); x.lineTo(X + 15, Y + 7); x.moveTo(X + 11, Y + 5); x.lineTo(X + 11, Y + 17); x.moveTo(X + 6, Y + 13); x.lineTo(X + 16, Y + 13); x.stroke();
      },
      anim(x, bx, by, bw, bh, t, c) { // gotas que se escurren
        for (let i = 0; i < 4; i++) { const p = (t * 0.22 + h(i, 3)) % 1, X = bx + (0.12 + h(i, 4) * 0.76) * bw, Y = by + bh * (0.05 + p * 0.95), w = Math.max(1.2, bw * 0.03);
          x.globalAlpha = Math.sin(p * Math.PI) * 0.8; x.strokeStyle = c[1]; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); x.moveTo(X, Y - bh * 0.18 * p); x.lineTo(X, Y); x.stroke(); x.fillStyle = c[1]; x.beginPath(); x.arc(X, Y, w * 1.3, 0, TAU); x.fill(); }
      } },
    // las cuatro estaciones: la tela pasa por cada una (las cuatro telas se pintan aparte)
    est0: { tile(x, W, H) { // primavera: cerezo en flor sobre rosa pálido
        const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#fbe6ee'); g.addColorStop(1, '#f2c4d6'); x.fillStyle = g; x.fillRect(0, 0, W, H);
        x.strokeStyle = '#5a3a3a'; x.lineCap = 'round'; for (const [X, Y, a] of [[0, H * 0.3, -0.3], [W, H * 0.75, Math.PI + 0.25]]) { x.lineWidth = 5; x.beginPath(); x.moveTo(X, Y); const ex = X + Math.cos(a) * W * 0.8, ey = Y + Math.sin(a) * W * 0.8; x.quadraticCurveTo((X + ex) / 2, (Y + ey) / 2 + 18, ex, ey); x.stroke(); }
        const r = R0(4); for (let i = 0; i < 16; i++) put(x, sakura(), r() * W, r() * H, 14 + r() * 12, 0.95, r() * 6);
      } },
    est1: { tile(x, W, H) { // verano: yukata índigo con olas, campanillas blancas y luciérnagas
        x.fillStyle = '#16245a'; x.fillRect(0, 0, W, H); x.strokeStyle = 'rgba(160,200,255,.5)'; x.lineWidth = 1.4;
        for (let Y = 20; Y < H + 20; Y += 34) { x.beginPath(); x.moveTo(0, Y); for (let X = 0; X <= W; X += 20) x.quadraticCurveTo(X + 10, Y - 9, X + 20, Y); x.stroke(); }
        const r = R0(6); for (let i = 0; i < 6; i++) { const X = r() * W, Y = r() * H; x.fillStyle = '#f4f0ff'; x.beginPath(); for (let k = 0; k <= 10; k++) { const a = k / 10 * TAU, rr = k % 2 ? 7 : 11; k ? x.lineTo(X + Math.cos(a) * rr, Y + Math.sin(a) * rr) : x.moveTo(X + Math.cos(a) * rr, Y + Math.sin(a) * rr); } x.fill(); x.fillStyle = '#7a8aff'; x.beginPath(); x.arc(X, Y, 3, 0, TAU); x.fill(); }
        x.globalCompositeOperation = 'lighter'; for (const [X, Y, c] of [[W * 0.72, H * 0.24, '255,200,90'], [W * 0.26, H * 0.62, '255,120,190']]) { put(x, glow(c), X, Y, 70, 0.5); x.strokeStyle = `rgba(${c},.95)`; x.lineWidth = 1.6; for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; x.beginPath(); x.moveTo(X + Math.cos(a) * 6, Y + Math.sin(a) * 6); x.lineTo(X + Math.cos(a) * 26, Y + Math.sin(a) * 26); x.stroke(); put(x, glow(c, true), X + Math.cos(a) * 28, Y + Math.sin(a) * 28, 7, 1); } }
        for (let i = 0; i < 12; i++) put(x, glow('200,255,120', true), r() * W, r() * H, 10, 0.8);
      } },
    est2: { tile(x, W, H) { // otoño: arces rojos y dorados sobre ocre
        const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#e89a3a'); g.addColorStop(1, '#8a2a14'); x.fillStyle = g; x.fillRect(0, 0, W, H);
        const r = R0(8); for (let i = 0; i < 18; i++) put(x, r() < 0.5 ? maple() : maple('#ffd23a', '#e87a1a'), r() * W, r() * H, 16 + r() * 12, 0.95, r() * 6);
      } },
    est3: { tile(x, W, H) { // invierno: nieve sobre azul de luna y pinos
        const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#e8f2fb'); g.addColorStop(1, '#9ab8d4'); x.fillStyle = g; x.fillRect(0, 0, W, H);
        x.fillStyle = '#3a5a6a'; for (const X of [W * 0.2, W * 0.75]) { x.beginPath(); x.moveTo(X, H * 0.5); x.lineTo(X - 18, H * 0.9); x.lineTo(X + 18, H * 0.9); x.fill(); x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(X, H * 0.5); x.lineTo(X - 7, H * 0.65); x.lineTo(X + 7, H * 0.65); x.fill(); x.fillStyle = '#3a5a6a'; }
        const r = R0(10); for (let i = 0; i < 16; i++) put(x, snow(), r() * W, r() * H, 8 + r() * 10, 0.9, r() * 3);
      } },
    estaciones: { tile(x, W, H) { MAT.est0.tile(x, W, H); },
      anim(x, bx, by, bw, bh) {
        const S = season(), A = Vest.matTile('est' + S.k, []), B = Vest.matTile('est' + S.n, []);
        x.globalAlpha = 0.92; x.drawImage(A, bx, by, bw, bh); if (S.f > 0) { x.globalAlpha = 0.92 * S.f; x.drawImage(B, bx, by, bw, bh); }
        const p = (performance.now() / 1000 * 0.5) % 1.6 - 0.3, g = x.createLinearGradient(bx + bw * (p - 0.25), by, bx + bw * (p + 0.25), by + bh); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,.25)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.globalAlpha = 1; x.globalCompositeOperation = 'lighter'; x.fillStyle = g; x.fillRect(bx, by, bw, bh);
      } },
    // el saco de viento de Fujin: tela de jade pálido con remolinos blancos que corren
    fujin: { pan: true, tile(x, W, H, c) {
        const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, c[0]); g.addColorStop(1, c[1]); x.fillStyle = g; x.fillRect(0, 0, W, H);
        const r = R0(13); x.lineCap = 'round';
        for (let i = 0; i < 16; i++) { const X = r() * W, Y = r() * H, R = 8 + r() * 16, s = r() < 0.5 ? 1 : -1; x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 1.8; x.beginPath(); for (let k = 0; k <= 30; k++) { const a = k / 30 * TAU * 1.6 * s, rr = R * (1 - k / 34); k ? x.lineTo(X + Math.cos(a) * rr, Y + Math.sin(a) * rr) : x.moveTo(X + Math.cos(a) * rr, Y + Math.sin(a) * rr); } x.stroke(); x.beginPath(); x.moveTo(X + R, Y); x.quadraticCurveTo(X + R * 2, Y + R * 0.6 * s, X + R * 3.2, Y + R * 0.2 * s); x.stroke(); }
      } },
    // olas seigaiha (escamas de mar) en índigo y blanco
    seigaiha: { tile(x, W, H, c) {
        x.fillStyle = c[0]; x.fillRect(0, 0, W, H); const s = W / 6;
        for (let r = 0; r < H / (s * 0.5) + 2; r++) for (let k = -1; k < 8; k++) { const X = k * s + (r % 2 ? s / 2 : 0), Y = r * s * 0.5;
          for (let j = 4; j >= 1; j--) { x.fillStyle = j % 2 ? c[2] : c[0]; x.beginPath(); x.arc(X, Y, s * 0.5 * j / 4, Math.PI, 0); x.fill(); x.strokeStyle = c[1]; x.lineWidth = 1.3; x.beginPath(); x.arc(X, Y, s * 0.5 * j / 4, Math.PI, 0); x.stroke(); } }
      },
      anim(x, bx, by, bw, bh, t) { const p = (t * 0.3) % 1.6 - 0.3, g = x.createLinearGradient(bx + bw * (p - 0.25), by, bx + bw * (p + 0.25), by + bh); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(220,240,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.globalCompositeOperation = 'lighter'; x.fillStyle = g; x.fillRect(bx, by, bw, bh); } },
  };

  /* ---------------- AURAS (L = 0 detrás, 1 delante) ---------------- */
  const orbit = (X, Y, R, a, k = 1.15, tilt = 0.38, dy = 0) => ({ x: X + Math.cos(a) * R * k, y: Y + dy + Math.sin(a) * R * k * tilt, d: Math.sin(a) });
  const AURA = {
    // nueve colas de zorra que se abren en abanico detrás y se mecen; fuegos de zorro en las puntas
    colas: { draw(x, X, Y, R, t, L) {
      if (!L) {
        const bx = X, by = Y + R * 0.55;
        for (let i = 0; i < 9; i++) {
          const u = i / 8, a = -Math.PI * (0.94 - u * 0.88) + Math.sin(t * 1.5 + i * 0.7) * 0.08, len = R * (1.55 + Math.sin(u * Math.PI) * 0.45), w = R * 0.42, cu = (u - 0.5) * 0.5 + Math.sin(t * 1.5 + i) * 0.12;
          const dir = [Math.cos(a), Math.sin(a)], nrm = [-dir[1], dir[0]], P = (s, o) => [bx + dir[0] * len * s + nrm[0] * (o + cu * len * s * s), by + dir[1] * len * s + nrm[1] * (o + cu * len * s * s)];
          const b0 = P(0, -w * 0.18), b1 = P(0, w * 0.18), m0 = P(0.62, -w), m1 = P(0.62, w), tip = P(1.04, 0), c0 = P(0.95, -w * 0.75), c1 = P(0.95, w * 0.75);
          const g = x.createLinearGradient(bx, by, tip[0], tip[1]);
          g.addColorStop(0, 'rgba(236,224,204,.96)'); g.addColorStop(0.55, 'rgba(255,252,246,.98)'); g.addColorStop(0.8, 'rgba(255,214,140,.98)'); g.addColorStop(1, 'rgba(232,96,40,.95)');
          x.fillStyle = g; x.beginPath(); x.moveTo(b0[0], b0[1]); x.quadraticCurveTo(P(0.3, -w * 0.8)[0], P(0.3, -w * 0.8)[1], m0[0], m0[1]); x.quadraticCurveTo(c0[0], c0[1], tip[0], tip[1]); x.quadraticCurveTo(c1[0], c1[1], m1[0], m1[1]); x.quadraticCurveTo(P(0.3, w * 0.8)[0], P(0.3, w * 0.8)[1], b1[0], b1[1]); x.closePath(); x.fill();
          x.strokeStyle = 'rgba(140,110,80,.4)'; x.lineWidth = Math.max(1, R * 0.03); x.stroke();
          x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = Math.max(1, R * 0.025); for (const f of [-0.45, 0, 0.45]) { const q0 = P(0.35, w * f * 0.6), q1 = P(0.8, w * f); x.beginPath(); x.moveTo(q0[0], q0[1]); x.lineTo(q1[0], q1[1]); x.stroke(); }
          x.globalCompositeOperation = 'lighter'; put(x, glow('120,200,255', true), tip[0], tip[1], R * (0.6 + 0.18 * Math.sin(t * 5 + i)), 0.7); x.globalCompositeOperation = 'source-over';
        }
      }
      x.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) { const o = orbit(X, Y, R, t * 1.3 + i * TAU / 3, 1.25, 0.4, Math.sin(t * 2 + i) * R * 0.3); if ((o.d > 0) !== !!L) continue; put(x, glow('110,190,255'), o.x, o.y, R * 0.9, 0.55); put(x, glow('220,245,255', true), o.x, o.y, R * 0.4, 0.95); }
    } },
    // anillo de tambores del trueno detrás (como el de Raijin); de tambor a tambor salta un rayo
    taiko: { draw(x, X, Y, R, t, L) {
      const cx = X, cy = Y - R * 0.6, RR = R * 1.3, N = 8, rot = t * 0.4;
      if (!L) {
        x.strokeStyle = 'rgba(232,176,48,.75)'; x.lineWidth = Math.max(1.5, R * 0.09); x.beginPath(); x.ellipse(cx, cy, RR, RR, 0, 0, TAU); x.stroke();
        const k = Math.floor(t / 0.9), f = t / 0.9 - k, i0 = Math.floor(h(k, 1) * N);
        for (let i = 0; i < N; i++) { const a = rot + i / N * TAU, px = cx + Math.cos(a) * RR, py = cy + Math.sin(a) * RR, r = R * 0.22;
          x.fillStyle = '#7a1a10'; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill(); x.strokeStyle = '#e8b030'; x.lineWidth = Math.max(1, R * 0.05); x.stroke();
          x.fillStyle = '#efe6d2'; x.beginPath(); x.arc(px, py, r * 0.75, 0, TAU); x.fill(); tomoe(x, px, py, r * 0.62, -t * 2 + i, '#1d1817');
          if (i === i0 && f < 0.3) { x.globalCompositeOperation = 'lighter'; put(x, glow('160,200,255', true), px, py, R * 1.1, 1 - f / 0.3); x.globalCompositeOperation = 'source-over'; } }
        if (f < 0.25) { const a1 = rot + i0 / N * TAU, a2 = rot + (i0 + 3) / N * TAU, p1 = [cx + Math.cos(a1) * RR, cy + Math.sin(a1) * RR], p2 = [cx + Math.cos(a2) * RR, cy + Math.sin(a2) * RR];
          x.globalCompositeOperation = 'lighter'; for (const [lw, c] of [[R * 0.22, 'rgba(90,150,255,.45)'], [Math.max(1, R * 0.06), 'rgba(255,250,220,.95)']]) { x.lineWidth = lw; x.strokeStyle = c; x.lineJoin = 'round'; x.beginPath(); x.moveTo(p1[0], p1[1]); for (let s = 1; s < 7; s++) { const u = s / 7; x.lineTo(p1[0] + (p2[0] - p1[0]) * u + (h(k, s) - 0.5) * R * 0.6, p1[1] + (p2[1] - p1[1]) * u + (h(k, s + 9) - 0.5) * R * 0.6); } x.lineTo(p2[0], p2[1]); x.stroke(); } }
      } else {
        x.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { const p = (t * 1.6 + h(i, 2)) % 1, o = orbit(X, Y, R, i * 1.3 + t, 1.1, 0.4, R * 0.4 - p * R * 1.6); if (o.d < 0) continue; put(x, star('255,240,170'), o.x, o.y, R * 0.35, Math.sin(p * Math.PI)); }
      }
    } },
    // un ensō que se pinta solo detrás (pincel de tinta), con su halo para verse en fondos oscuros, y un sello rojo
    enso: { draw(x, X, Y, R, t, L) {
      const cx = X, cy = Y - R * 0.3, RR = R * 1.6, P = 3.2, u = (t % P) / P, a0 = -Math.PI * 0.45;
      const drawn = Math.min(1, u / 0.45), fade = u > 0.8 ? 1 - (u - 0.8) / 0.2 : 1;
      if (!L) {
        x.globalCompositeOperation = 'lighter'; put(x, glow('255,240,210'), cx, cy, RR * 2.7, 0.22 * fade); x.globalCompositeOperation = 'source-over';
        const n = 40, pts = []; for (let i = 0; i <= n * drawn; i++) { const a = a0 + i / n * TAU * 0.9; pts.push([cx + Math.cos(a) * RR * (1 + Math.sin(i * 0.4) * 0.025), cy + Math.sin(a) * RR]); }
        if (pts.length > 1) { x.globalAlpha = fade * 0.5; x.strokeStyle = 'rgba(255,246,228,1)'; x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = R * 0.5; x.filter = 'blur(' + Math.max(1, R * 0.12).toFixed(1) + 'px)'; x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); x.filter = 'none';
          x.globalAlpha = fade; brush(x, pts, R * 0.34, R * 0.16, '#1d1817', drawn >= 1 ? 0.32 : 0.05, 5); }
        if (drawn >= 1) { const a = a0 + TAU * 0.9, sx = cx + Math.cos(a) * RR + R * 0.25, sy = cy + Math.sin(a) * RR + R * 0.3, s = R * 0.34, k = Math.min(1, (u - 0.45) * 8);
          x.globalAlpha = fade; x.fillStyle = '#c8281e'; x.fillRect(sx - s / 2 * k, sy - s / 2 * k, s * k, s * k); x.strokeStyle = '#efe6d2'; x.lineWidth = Math.max(1, s * 0.1); x.strokeRect(sx - s * 0.32 * k, sy - s * 0.32 * k, s * 0.64 * k, s * 0.64 * k); }
      }
      x.globalAlpha = 1; // gotas de tinta que flotan y suben
      for (let i = 0; i < 7; i++) { const p = (t * 0.3 + h(i, 6)) % 1, o = orbit(X, Y, R, i * 0.9 + t * 0.4, 1.2, 0.4, R * 0.6 - p * R * 2); if ((o.d > 0) !== !!L) continue; put(x, inkDot(), o.x, o.y, R * (0.12 + h(i, 7) * 0.14), Math.sin(p * Math.PI) * 0.85); }
    } },
    // lo que vuela alrededor cambia con la estación: pétalos, luciérnagas, arces y nieve
    estaciones: { draw(x, X, Y, R, t, L) {
      const S = season();
      const one = (k, al) => { if (al <= 0.01) return;
        for (let i = 0; i < 12; i++) { const hh = (t * (k === 1 ? 0.12 : 0.22) + h(i, 1 + k)) % 1, o = orbit(X, Y, R, t * 0.8 + i * 0.55, 1.05 + h(i, 2) * 0.45, 0.42, (k === 1 ? Math.sin(t + i) * R * 0.8 : -R * 1.2 + hh * R * 2.4)); if ((o.d > 0) !== !!L) continue;
          const a = (k === 1 ? 0.5 + 0.5 * Math.sin(t * 5 + i * 2) : Math.sin(hh * Math.PI)) * al;
          if (k === 0) put(x, sakura(), o.x, o.y, R * 0.34, a, t * 2 + i);
          else if (k === 1) { x.globalCompositeOperation = 'lighter'; put(x, glow('200,255,110', true), o.x, o.y, R * 0.34, a); x.globalCompositeOperation = 'source-over'; }
          else if (k === 2) put(x, i % 2 ? maple() : maple('#ffd23a', '#e87a1a'), o.x, o.y, R * 0.4, a, t * 1.6 + i);
          else put(x, snow(), o.x, o.y, R * 0.28, a, t + i); } };
      one(S.k, 1 - S.f); one(S.n, S.f);
    } },
  };

  /* ---------------- ESTELAS ---------------- */
  const TRAIL = {
    // remolinos de viento blanco (de Fujin)
    viento: { life: 0.6, draw(x, P, w, now) {
      x.lineCap = 'round'; for (const s of [-1, 1]) { x.beginPath(); let st = false; for (let i = 0; i < P.length; i++) { const p = P[i], a = 1 - (now - p.t) / 0.6; if (a <= 0) continue; const ox = Math.sin(i * 0.6 + now * 8) * w * 1.1 * s, oy = Math.cos(i * 0.6 + now * 8) * w * 0.5; st ? x.lineTo(p.x + ox, p.y + oy) : x.moveTo(p.x + ox, p.y + oy); st = true; } x.strokeStyle = 'rgba(240,250,255,.7)'; x.lineWidth = Math.max(1, w * 0.3); x.stroke(); }
      for (let i = 0; i < P.length; i += 6) { const p = P[i], a = 1 - (now - p.t) / 0.6; if (a <= 0) continue; x.globalAlpha = a * 0.8; x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(1, w * 0.22); x.beginPath(); x.arc(p.x, p.y - w, w * (0.6 + (1 - a)), now * 6 + i, now * 6 + i + Math.PI * 1.4); x.stroke(); }
    } },
    // una pincelada de tinta que se seca en gris, con salpicaduras
    tinta: { life: 0.9, draw(x, P, w, now) {
      x.lineCap = 'round'; x.lineJoin = 'round';
      for (let i = 1; i < P.length; i++) { const p = P[i - 1], q = P[i], a = 1 - (now - p.t) / 0.9; if (a <= 0) continue;
        x.globalAlpha = Math.min(1, a * 1.3) * 0.5; x.strokeStyle = '#fff6e4'; x.lineWidth = w * 2.2 * a + 2; x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(q.x, q.y); x.stroke();
        x.globalAlpha = Math.min(1, a * 1.4); x.strokeStyle = a > 0.5 ? '#1d1817' : '#5a524c'; x.lineWidth = w * (0.4 + 1.4 * a) * (0.8 + 0.4 * h(i, 1)); x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(q.x, q.y); x.stroke(); }
      for (let i = 0; i < P.length; i += 3) { const p = P[i], a = 1 - (now - p.t) / 0.9; if (a <= 0 || h(i, 2) < 0.4) continue; put(x, inkDot(), p.x + (h(i, 3) - 0.5) * w * 4, p.y + (h(i, 4) - 0.5) * w * 4, w * (0.5 + h(i, 5)), a); }
    } },
    // lo que suelta al caminar también cambia con la estación
    estaciones: { life: 0.8, draw(x, P, w, now) {
      const S = season(), k = S.f > 0.5 ? S.n : S.k;
      for (let i = 0; i < P.length; i += 2) { const p = P[i], a = 1 - (now - p.t) / 0.8; if (a <= 0) continue; const X = p.x + (h(i, 1) - 0.5) * w * 3 * (1 - a), Y = p.y + (k === 3 || k === 0 || k === 2 ? (1 - a) * w * 2.4 : -(1 - a) * w * 2);
        if (k === 0) put(x, sakura(), X, Y, w * 2.2, a, now * 3 + i); else if (k === 1) { x.globalCompositeOperation = 'lighter'; put(x, glow('200,255,110', true), X, Y, w * 2.6, a); x.globalCompositeOperation = 'source-over'; } else if (k === 2) put(x, i % 4 ? maple() : maple('#ffd23a', '#e87a1a'), X, Y, w * 2.6, a, now * 2 + i); else put(x, snow(), X, Y, w * 1.8, a, now + i); }
    } },
  };
  Object.assign(Vest.MAT, MAT); Object.assign(Vest.AURA, AURA); Object.assign(Vest.TRAIL, TRAIL);
  return { MAT, AURA, TRAIL, season, tomoe };
})();
