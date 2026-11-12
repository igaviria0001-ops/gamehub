/* =========================================================================
   VESTIDOR — atuendos, auras y estelas que se ganan jugando. Igual en los
   cuatro juegos de GameHub (archivo compartido: se copia como src/00j-vest.js).
   · Rarezas: Común, Raro, Épico, Legendario y Mítico; cada una más vistosa.
   · Cada juego pone su catálogo (qué hay, cómo se gana) y cómo dibujar a su
     personaje; aquí viven el guardado, la revisión de lo ganado, la pantalla
     del vestidor, la ceremonia de «¡Nuevo!» y los efectos de auras y estelas.
   · Lo ganado se guarda con el prefijo del juego («<prefijo>vest») y nunca se
     quita: una versión nueva solo puede agregar cosas.
   ========================================================================= */
const Vest = (() => {
  const RAR = {
    comun: { name: 'Común', c: '#b4c3d8', c2: '#6f819c', rgb: '180,195,216' },
    raro: { name: 'Raro', c: '#53b0ff', c2: '#1e62d6', rgb: '83,176,255' },
    epico: { name: 'Épico', c: '#c574ff', c2: '#7a2ad8', rgb: '197,116,255' },
    legendario: { name: 'Legendario', c: '#ffc53d', c2: '#e2780f', rgb: '255,197,61' },
    mitico: { name: 'Mítico', c: '#ff6fd8', c2: '#5a8dff', rgb: '255,111,216' },
  };
  const RORDER = ['comun', 'raro', 'epico', 'legendario', 'mitico'];
  const TAU = Math.PI * 2;
  const H = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------------- sprites: se dibujan una sola vez ---------------- */
  const SP = {};
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function glow(rgb, core) {
    const k = 'g' + rgb + (core ? 'c' : ''); if (SP[k]) return SP[k];
    const c = mk(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    if (core) { g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.12, `rgba(${rgb},1)`); } else g.addColorStop(0, `rgba(${rgb},1)`);
    g.addColorStop(0.3, `rgba(${rgb},0.42)`); g.addColorStop(0.62, `rgba(${rgb},0.1)`); g.addColorStop(1, `rgba(${rgb},0)`);
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); return (SP[k] = c);
  }
  function star(rgb) {
    const k = 's' + rgb; if (SP[k]) return SP[k];
    const c = mk(64, 64), x = c.getContext('2d'); x.drawImage(glow(rgb), 16, 16, 32, 32);
    x.globalCompositeOperation = 'lighter'; x.fillStyle = '#fff';
    for (const [a, l, w] of [[0, 30, 2.6], [Math.PI / 2, 30, 2.6], [Math.PI / 4, 13, 1.6], [-Math.PI / 4, 13, 1.6]]) { x.save(); x.translate(32, 32); x.rotate(a); x.beginPath(); x.moveTo(-l, 0); x.lineTo(0, -w); x.lineTo(l, 0); x.lineTo(0, w); x.closePath(); x.fill(); x.restore(); }
    return (SP[k] = c);
  }
  function flake(rgb) {
    const k = 'f' + rgb; if (SP[k]) return SP[k];
    const c = mk(48, 48), x = c.getContext('2d'); x.drawImage(glow(rgb), 4, 4, 40, 40); x.strokeStyle = '#fff'; x.lineWidth = 2; x.lineCap = 'round'; x.translate(24, 24);
    for (let i = 0; i < 6; i++) { x.rotate(Math.PI / 3); x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -15); x.moveTo(0, -9); x.lineTo(-4, -13); x.moveTo(0, -9); x.lineTo(4, -13); x.stroke(); }
    return (SP[k] = c);
  }
  function petal(c1, c2) {
    const k = 'p' + c1 + c2; if (SP[k]) return SP[k];
    const c = mk(32, 32), x = c.getContext('2d'), g = x.createLinearGradient(0, 4, 0, 28); g.addColorStop(0, c1); g.addColorStop(1, c2);
    x.fillStyle = g; x.beginPath(); x.moveTo(16, 3); x.bezierCurveTo(28, 10, 26, 24, 16, 29); x.bezierCurveTo(6, 24, 4, 10, 16, 3); x.fill();
    x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 1; x.beginPath(); x.moveTo(16, 6); x.lineTo(16, 26); x.stroke(); return (SP[k] = c);
  }
  function flame(rgbA, rgbB) {
    const k = 'fl' + rgbA + rgbB; if (SP[k]) return SP[k];
    const c = mk(32, 64), x = c.getContext('2d'), g = x.createRadialGradient(16, 48, 1, 16, 40, 30);
    g.addColorStop(0, 'rgba(255,255,240,1)'); g.addColorStop(0.25, `rgba(${rgbA},.95)`); g.addColorStop(0.65, `rgba(${rgbB},.55)`); g.addColorStop(1, `rgba(${rgbB},0)`);
    x.fillStyle = g; x.beginPath(); x.moveTo(16, 2); x.bezierCurveTo(30, 26, 31, 46, 16, 62); x.bezierCurveTo(1, 46, 2, 26, 16, 2); x.fill(); return (SP[k] = c);
  }
  function smoke(rgb) {
    const k = 'sm' + rgb; if (SP[k]) return SP[k];
    const c = mk(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, `rgba(${rgb},.9)`); g.addColorStop(0.5, `rgba(${rgb},.45)`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return (SP[k] = c);
  }
  const RUNES = ['M4 14 L10 2 L16 14 M7 8 L13 8', 'M4 2 L4 14 L14 8 Z', 'M2 8 L14 8 M8 2 L8 14 M4 4 L12 12', 'M3 3 L13 3 L8 13 Z M8 3 L8 8', 'M8 2 A6 6 0 1 0 8 14 M8 2 L8 14', 'M3 14 L3 4 L13 4 L13 14 M3 9 L13 9', 'M2 4 L8 14 L14 4 M5 4 L11 4', 'M8 1 L14 8 L8 15 L2 8 Z M8 5 L8 11'];
  function rune(i, rgb) {
    const k = 'r' + i + rgb; if (SP[k]) return SP[k];
    const c = mk(32, 32), x = c.getContext('2d'); x.drawImage(glow(rgb), 0, 0, 32, 32); x.translate(8, 8);
    x.strokeStyle = '#fff'; x.lineWidth = 1.8; x.lineCap = 'round'; x.lineJoin = 'round'; x.stroke(new Path2D(RUNES[i % RUNES.length])); return (SP[k] = c);
  }
  const put = (x, img, X, Y, s, a = 1, rot = 0) => { if (a <= 0.003 || s <= 0.2) return; x.globalAlpha = Math.min(1, a); if (rot) { x.save(); x.translate(X, Y); x.rotate(rot); x.drawImage(img, -s / 2, -s / 2 * img.height / img.width, s, s * img.height / img.width); x.restore(); } else x.drawImage(img, X - s / 2, Y - s / 2 * img.height / img.width, s, s * img.height / img.width); };
  const hsl = (h, s = 100, l = 62) => `hsl(${h},${s}%,${l}%)`;
  function hueRgb(h) { const f = n => { const k = (n + h / 30) % 12, a = 0.9; return Math.round(255 * (0.62 - 0.38 * a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); }; return `${f(0)},${f(8)},${f(4)}`; }

  /* ---------------- AURAS ----------------
     Cada una dibuja «detrás» (layer 0) y «delante» (layer 1) del personaje.
     X, Y = centro del personaje; R = su radio (media altura); t = segundos. */
  // órbita: posición en una elipse alrededor del cuerpo; d > 0 = va por delante
  const orbit = (X, Y, R, a, k = 1.15, tilt = 0.38, dy = 0) => ({ x: X + Math.cos(a) * R * k, y: Y + dy + Math.sin(a) * R * k * tilt, d: Math.sin(a) });
  const AURA = {
    ninguna: { draw() {} },
    chispas: { draw(x, X, Y, R, t, L) { for (let i = 0; i < 12; i++) { const o = orbit(X, Y, R, t * (0.6 + H(i, 1) * 0.5) + i * 0.52, 1 + H(i, 2) * 0.35, 0.4, (H(i, 3) - 0.5) * R * 1.2); if ((o.d > 0) !== !!L) continue; put(x, star('255,238,190'), o.x, o.y, R * (0.22 + 0.2 * (0.5 + 0.5 * Math.sin(t * 4 + i * 1.7))), 0.85); } } },
    burbujas: { draw(x, X, Y, R, t, L) { if (!L) return; for (let i = 0; i < 10; i++) { const p = (t * (0.25 + H(i, 1) * 0.2) + H(i, 2)) % 1, bx = X + (H(i, 3) - 0.5) * R * 2 + Math.sin(t * 2 + i) * R * 0.15, by = Y + R - p * R * 2.6, r = R * (0.08 + H(i, 4) * 0.1) * (0.6 + p * 0.6); x.globalAlpha = Math.sin(p * Math.PI) * 0.8; x.strokeStyle = 'rgba(190,240,255,.9)'; x.lineWidth = Math.max(1, R * 0.03); x.beginPath(); x.arc(bx, by, r, 0, TAU); x.stroke(); x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.arc(bx - r * 0.35, by - r * 0.35, r * 0.22, 0, TAU); x.fill(); } } },
    notas: { draw(x, X, Y, R, t, L) { if (!L) return; x.textAlign = 'center'; x.textBaseline = 'middle'; for (let i = 0; i < 6; i++) { const p = (t * 0.35 + i / 6) % 1, a = Math.sin(p * Math.PI); x.globalAlpha = a; x.font = `900 ${Math.round(R * (0.4 + H(i, 1) * 0.25))}px system-ui, sans-serif`; x.fillStyle = `hsl(${(i * 60 + t * 40) % 360},90%,72%)`; x.fillText(i % 2 ? '♪' : '♫', X + Math.sin(p * 6 + i * 2) * R * 0.9 + (H(i, 2) - 0.5) * R, Y + R * 0.4 - p * R * 2.2); } } },
    hojas: { draw(x, X, Y, R, t, L) { const cs = [['#9be36a', '#3a8a2a'], ['#f2d04a', '#b07a12'], ['#7fd0a0', '#2a7a5a']]; for (let i = 0; i < 12; i++) { const h = ((t * 0.18 + i / 12) % 1), o = orbit(X, Y, R, t * 1.3 + i * 1.9, 0.9 + h * 0.5, 0.4, R * (0.9 - h * 2)); if ((o.d > 0) !== !!L) continue; const c = cs[i % 3]; put(x, petal(c[0], c[1]), o.x, o.y, R * 0.42, Math.sin(h * Math.PI) * 0.95, t * 3 + i); } } },
    escarcha: { draw(x, X, Y, R, t, L) {
      if (!L) { x.globalCompositeOperation = 'lighter'; put(x, glow('140,220,255'), X, Y, R * 3.6, 0.55); x.globalAlpha = 0.55; x.strokeStyle = 'rgba(190,240,255,.8)'; x.lineWidth = Math.max(1, R * 0.04); x.beginPath(); x.ellipse(X, Y + R * 0.92, R * 1.15, R * 0.36, 0, 0, TAU); x.stroke(); }
      for (let i = 0; i < 14; i++) { const o = orbit(X, Y, R, t * 0.5 + i * 0.45, 1.05 + H(i, 1) * 0.4, 0.42, Math.sin(t * 0.8 + i) * R * 0.6); if ((o.d > 0) !== !!L) continue; x.globalCompositeOperation = 'lighter'; put(x, flake('160,230,255'), o.x, o.y, R * (0.3 + H(i, 2) * 0.22), 0.9, t * 0.6 + i); }
    } },
    brasas: { draw(x, X, Y, R, t, L) {
      x.globalCompositeOperation = 'lighter';
      if (!L) { put(x, glow('255,110,30'), X, Y + R * 0.2, R * 4, 0.7 + 0.12 * Math.sin(t * 7)); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, p = (t * 1.8 + H(i, 9)) % 1; put(x, flame('255,190,70', '255,60,20'), X + Math.cos(a) * R * 0.8, Y + R * 0.35 + Math.sin(a) * R * 0.25 - p * R * 0.5, R * (0.7 + 0.25 * Math.sin(t * 13 + i * 2)) * (1 - p * 0.4), (1 - p) * 0.8); } }
      for (let i = 0; i < 34; i++) { if ((i % 2) !== (L ? 1 : 0)) continue; const p = (t * (0.45 + H(i, 1) * 0.4) + H(i, 2)) % 1, bx = X + (H(i, 3) - 0.5) * R * 2.4 + Math.sin(t * 3 + i * 2) * R * 0.25 * p, by = Y + R - p * R * 3; put(x, glow(p < 0.45 ? '255,220,110' : '255,100,30', true), bx, by, R * (0.24 + 0.2 * (1 - p)), (1 - p) * (0.7 + 0.3 * Math.sin(t * 20 + i))); }
    } },
    petalos: { draw(x, X, Y, R, t, L) { for (let i = 0; i < 14; i++) { const h = (t * 0.22 + H(i, 1)) % 1, o = orbit(X, Y, R, t * 0.9 + i * 0.9, 1.05 + H(i, 2) * 0.45, 0.42, -R * 1.2 + h * R * 2.4); if ((o.d > 0) !== !!L) continue; put(x, petal('#ffd2ea', '#ff7ab8'), o.x, o.y, R * 0.36, Math.sin(h * Math.PI), t * 2.2 + i); } } },
    rayos: { draw(x, X, Y, R, t, L) {
      x.globalCompositeOperation = 'lighter';
      if (!L) { put(x, glow('90,170,255'), X, Y, R * 3.4, 0.45 + 0.2 * Math.sin(t * 13)); return; }
      const seed = Math.floor(t * 12); x.lineCap = 'round'; x.lineJoin = 'round';
      for (let b = 0; b < 3; b++) {
        const a0 = H(seed, b) * TAU, a1 = a0 + 1.2 + H(seed, b + 7) * 1.6, n = 7; x.beginPath();
        for (let j = 0; j <= n; j++) { const a = a0 + (a1 - a0) * j / n, rr = R * (1.05 + (j % 2 ? 0.28 : 0) * H(seed, b * 9 + j)), px = X + Math.cos(a) * rr, py = Y + Math.sin(a) * rr * 0.95; j ? x.lineTo(px, py) : x.moveTo(px, py); }
        x.globalAlpha = 0.5; x.strokeStyle = '#4fa8ff'; x.lineWidth = R * 0.16; x.stroke(); x.globalAlpha = 1; x.strokeStyle = '#eaf6ff'; x.lineWidth = Math.max(1.2, R * 0.05); x.stroke();
      }
      for (let i = 0; i < 6; i++) { const a = H(seed, i + 30) * TAU; put(x, star('140,200,255'), X + Math.cos(a) * R * 1.25, Y + Math.sin(a) * R * 1.1, R * 0.3, 0.9); }
    } },
    runas: { draw(x, X, Y, R, t, L) {
      x.globalCompositeOperation = 'lighter'; const gy = Y + R * 0.9;
      if (!L) {
        put(x, glow('170,90,255'), X, gy, R * 3, 0.4);
        x.lineWidth = Math.max(1, R * 0.035); x.strokeStyle = 'rgba(200,150,255,.85)'; x.globalAlpha = 0.9;
        x.beginPath(); x.ellipse(X, gy, R * 1.45, R * 0.48, 0, 0, TAU); x.stroke(); x.beginPath(); x.ellipse(X, gy, R * 1.1, R * 0.36, 0, 0, TAU); x.stroke();
        for (let i = 0; i < 8; i++) { const a = t * 0.6 + i * TAU / 8; put(x, rune(i, '170,90,255'), X + Math.cos(a) * R * 1.28, gy + Math.sin(a) * R * 0.42, R * 0.42, 0.95); }
      } else for (let i = 0; i < 5; i++) { const p = (t * 0.3 + i / 5) % 1; put(x, rune(i + 3, '200,140,255'), X + Math.sin(i * 2.3 + t) * R * 0.9, gy - p * R * 2.6, R * 0.38 * (1 - p * 0.4), Math.sin(p * Math.PI) * 0.9); }
    } },
    sombra: { draw(x, X, Y, R, t, L) {
      if (!L) { x.globalCompositeOperation = 'lighter'; put(x, glow('150,40,255'), X, Y, R * 4, 0.6 + 0.15 * Math.sin(t * 3));
        x.globalCompositeOperation = 'source-over'; for (let i = 0; i < 16; i++) { const p = (t * (0.4 + H(i, 1) * 0.25) + H(i, 2)) % 1, sx = X + (H(i, 3) - 0.5) * R * 2 + Math.sin(t * 2 + i) * R * 0.25, sy = Y + R * 0.9 - p * R * 2.9; put(x, smoke('18,2,34'), sx, sy, R * (0.9 + p * 1.1), (1 - p) * 0.85); }
        x.globalCompositeOperation = 'lighter'; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, p = (t * 1.3 + H(i, 7)) % 1; put(x, flame('200,120,255', '90,0,200'), X + Math.cos(a) * R * 0.85, Y + R * 0.3 + Math.sin(a) * R * 0.25 - p * R * 0.6, R * 0.75 * (1 - p * 0.5), (1 - p) * 0.7); } }
      else { x.globalCompositeOperation = 'lighter'; for (let i = 0; i < 12; i++) { const p = (t * 0.5 + H(i, 4)) % 1; put(x, glow('200,110,255', true), X + (H(i, 5) - 0.5) * R * 2.2, Y + R - p * R * 2.6, R * 0.26, (1 - p)); } put(x, glow('255,80,140', true), X - R * 0.18, Y - R * 0.72, R * 0.22, 0.6 + 0.4 * Math.sin(t * 5)); put(x, glow('255,80,140', true), X + R * 0.18, Y - R * 0.72, R * 0.22, 0.6 + 0.4 * Math.sin(t * 5)); }
    } },
    fuego_azul: { draw(x, X, Y, R, t, L) {
      x.globalCompositeOperation = 'lighter';
      if (!L) put(x, glow('60,160,255'), X, Y, R * 3.4, 0.45 + 0.1 * Math.sin(t * 9));
      for (let i = 0; i < 14; i++) { if ((i % 2) !== (L ? 1 : 0)) continue; const a = i / 14 * TAU + Math.sin(t + i) * 0.2, p = (t * 1.6 + H(i, 1)) % 1, fx = X + Math.cos(a) * R * 0.95, fy = Y + R * 0.75 + Math.sin(a) * R * 0.3 - p * R * 0.6; put(x, flame('120,220,255', '40,90,255'), fx, fy - R * 0.5, R * (0.55 + 0.25 * Math.sin(t * 14 + i * 3)) * (1 - p * 0.5), (1 - p) * 0.95); }
    } },
    corona: { draw(x, X, Y, R, t, L) {
      x.globalCompositeOperation = 'lighter';
      if (!L) {
        put(x, glow('255,200,80'), X, Y - R * 0.2, R * 4, 0.5);
        x.save(); x.translate(X, Y - R * 0.35); x.rotate(t * 0.25);
        for (let i = 0; i < 16; i++) { x.rotate(TAU / 16); const l = R * (1.5 + 0.35 * Math.sin(t * 3 + i * 1.3)), g = x.createLinearGradient(0, 0, 0, -l); g.addColorStop(0, 'rgba(255,230,140,.55)'); g.addColorStop(1, 'rgba(255,170,40,0)'); x.fillStyle = g; x.globalAlpha = 0.85; x.beginPath(); x.moveTo(-R * 0.09, 0); x.lineTo(0, -l); x.lineTo(R * 0.09, 0); x.fill(); }
        x.restore();
      } else {
        x.globalAlpha = 0.95; x.strokeStyle = '#ffe9a0'; x.lineWidth = Math.max(1.4, R * 0.07); x.shadowColor = '#ffb020'; x.shadowBlur = R * 0.4;
        x.beginPath(); x.ellipse(X, Y - R * 1.3 + Math.sin(t * 2) * R * 0.05, R * 0.55, R * 0.16, 0, 0, TAU); x.stroke(); x.shadowBlur = 0;
        for (let i = 0; i < 8; i++) { const p = (t * 0.35 + i / 8) % 1; put(x, star('255,210,100'), X + Math.sin(i * 2.4 + t * 0.7) * R * 1.1, Y + R - p * R * 2.8, R * 0.3, Math.sin(p * Math.PI)); }
      }
    } },
    alas: { draw(x, X, Y, R, t, L) {
      if (L) return; x.globalCompositeOperation = 'lighter'; const flap = Math.sin(t * 2.2) * 0.16;
      put(x, glow('170,230,255'), X, Y - R * 0.2, R * 3.6, 0.35);
      for (const s of [-1, 1]) for (let f = 0; f < 7; f++) {
        const a = (-0.25 - f * 0.2 - flap) , len = R * (1.9 - f * 0.13), w = R * 0.28;
        x.save(); x.translate(X + s * R * 0.25, Y - R * 0.35); x.scale(s, 1); x.rotate(a);
        const g = x.createLinearGradient(0, 0, len, 0); g.addColorStop(0, 'rgba(255,255,255,.85)'); g.addColorStop(0.6, 'rgba(150,220,255,.5)'); g.addColorStop(1, 'rgba(120,160,255,0)');
        x.fillStyle = g; x.globalAlpha = 0.75 - f * 0.05; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(len * 0.5, -w, len, -w * 0.2); x.quadraticCurveTo(len * 0.55, w * 0.5, 0, w * 0.35); x.fill(); x.restore();
      }
    } },
    dragon: { draw(x, X, Y, R, t, L) {
      x.globalCompositeOperation = 'lighter'; const N = 26;
      for (let i = N - 1; i >= 0; i--) {
        const u = t * 1.1 - i * 0.12, o = orbit(X, Y, R, u, 1.35, 0.42, Math.sin(u * 1.5) * R * 0.55);
        if ((o.d > 0) !== !!L) continue; const s = R * (0.42 - i * 0.012), a = (1 - i / N) * 0.9;
        put(x, glow(i ? '60,255,190' : '200,255,230', !i), o.x, o.y, s * (i ? 1.4 : 2.2), a);
        if (!i) { const e = orbit(X, Y, R, u + 0.08, 1.35, 0.42, Math.sin(u * 1.5) * R * 0.55); put(x, star('255,250,200'), e.x, e.y - R * 0.05, R * 0.4, 1); x.globalAlpha = 0.9; x.strokeStyle = '#c8ffe8'; x.lineWidth = Math.max(1, R * 0.05); x.beginPath(); x.moveTo(o.x, o.y); x.lineTo(o.x - R * 0.25, o.y - R * 0.35); x.moveTo(o.x, o.y); x.lineTo(o.x + R * 0.05, o.y - R * 0.42); x.stroke(); }
        else if (i % 3 === 0) put(x, star('140,255,210'), o.x, o.y - s * 0.4, s * 0.7, a * 0.6);
      }
    } },
    galaxia: { draw(x, X, Y, R, t, L) {
      x.globalCompositeOperation = 'lighter';
      if (!L) {
        put(x, glow('150,80,255'), X, Y, R * 5, 0.8); put(x, glow('255,110,210', true), X, Y, R * 2.2, 0.8);
        x.save(); x.translate(X, Y); x.scale(1, 0.5); x.rotate(t * 0.35);
        for (let arm = 0; arm < 2; arm++) for (let i = 0; i < 40; i++) { const k = i / 40, a = arm * Math.PI + k * 4.2, r = R * (0.25 + k * 1.75), j = (H(i, arm) - 0.5) * R * 0.25; const c = k < 0.4 ? '255,190,240' : k < 0.75 ? '180,120,255' : '110,170,255'; put(x, glow(c, H(i, arm + 4) > 0.7), Math.cos(a) * r + j, Math.sin(a) * r + j, R * (0.62 - k * 0.3), 0.95 * (1 - k * 0.45)); }
        x.restore();
      }
      for (let i = 0; i < 3; i++) { const o = orbit(X, Y, R, t * (0.7 + i * 0.35) + i * 2.1, 1.25 + i * 0.22, 0.4); if ((o.d > 0) !== !!L) continue; const pc = ['255,170,90', '120,210,255', '230,140,255'][i]; put(x, glow(pc, true), o.x, o.y, R * 0.55, 1); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.fillStyle = `rgb(${pc})`; x.beginPath(); x.arc(o.x, o.y, R * 0.11, 0, TAU); x.fill(); x.globalCompositeOperation = 'lighter'; }
      if (L) for (let i = 0; i < 12; i++) put(x, star('255,240,255'), X + (H(i, 9) - 0.5) * R * 3.4, Y + (H(i, 10) - 0.5) * R * 2.8, R * 0.42 * (0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i * 1.7))), 1);
    } },
    prisma: { draw(x, X, Y, R, t, L) {
      x.globalCompositeOperation = 'lighter';
      if (!L) { for (let k = 0; k < 3; k++) { const p = (t * 0.5 + k / 3) % 1; x.globalAlpha = (1 - p) * 0.95; x.lineWidth = Math.max(1.6, R * 0.14 * (1 - p)); x.strokeStyle = hsl((t * 90 + k * 120) % 360, 100, 66); x.beginPath(); x.ellipse(X, Y + R * 0.2, R * (0.8 + p * 1.2), R * (0.8 + p * 1.2) * 0.5, 0, 0, TAU); x.stroke(); } put(x, glow(hueRgb((t * 60) % 360)), X, Y, R * 4, 0.6); }
      for (let i = 0; i < 7; i++) {
        const o = orbit(X, Y, R, t * 0.9 + i * TAU / 7, 1.3, 0.45, Math.sin(t * 2 + i) * R * 0.3); if ((o.d > 0) !== !!L) continue;
        const h = (i * 51 + t * 80) % 360, s = R * 0.3; x.save(); x.translate(o.x, o.y); x.rotate(t * 2 + i); x.globalAlpha = 0.95;
        const g = x.createLinearGradient(-s, -s, s, s); g.addColorStop(0, hsl(h, 100, 85)); g.addColorStop(0.5, hsl((h + 60) % 360, 100, 62)); g.addColorStop(1, hsl((h + 140) % 360, 100, 55));
        x.fillStyle = g; x.beginPath(); x.moveTo(0, -s * 1.3); x.lineTo(s * 0.6, 0); x.lineTo(0, s * 1.3); x.lineTo(-s * 0.6, 0); x.closePath(); x.fill(); x.restore();
        put(x, glow(hueRgb(h)), o.x, o.y, R * 0.9, 0.5);
      }
    } },
    vacio: { draw(x, X, Y, R, t, L) {
      const cy = Y - R * 0.1;
      if (!L) {
        x.globalCompositeOperation = 'lighter'; put(x, glow('255,150,60'), X, cy, R * 4.4, 0.35);
        x.save(); x.translate(X, cy); x.rotate(-0.25);
        for (let i = 0; i < 70; i++) { const a = i / 70 * TAU + t * 1.4, rr = R * (1.6 + 0.12 * Math.sin(i * 3 + t * 4)), c = i % 3 ? '255,190,110' : '255,250,220'; put(x, glow(c, i % 5 === 0), Math.cos(a) * rr, Math.sin(a) * rr * 0.3, R * 0.5, 0.42); }
        x.restore();
        x.globalCompositeOperation = 'source-over'; const g = x.createRadialGradient(X, cy, R * 0.2, X, cy, R * 1.25); g.addColorStop(0, 'rgba(0,0,0,.92)'); g.addColorStop(0.7, 'rgba(10,0,20,.6)'); g.addColorStop(1, 'rgba(10,0,20,0)'); x.globalAlpha = 0.85; x.fillStyle = g; x.beginPath(); x.arc(X, cy, R * 1.25, 0, TAU); x.fill();
        x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.8; x.strokeStyle = '#ffd9a0'; x.lineWidth = Math.max(1, R * 0.05); x.beginPath(); x.arc(X, cy, R * 1.05, 0, TAU); x.stroke();
      } else {
        x.globalCompositeOperation = 'lighter';
        x.save(); x.translate(X, cy); x.rotate(-0.25); for (let i = 0; i < 30; i++) { const a = i / 30 * Math.PI + t * 1.4; put(x, glow(i % 3 ? '255,190,110' : '255,250,220', i % 4 === 0), Math.cos(a) * R * 1.6, Math.sin(a) * R * 0.48, R * 0.45, 0.5); } x.restore();
        for (let i = 0; i < 10; i++) { const p = 1 - ((t * 0.5 + i / 10) % 1), a = i * 2.4 + p * 3; put(x, star('255,220,180'), X + Math.cos(a) * R * 2.2 * p, cy + Math.sin(a) * R * 1.1 * p, R * 0.25, p); }
      }
    } },
  };
  function drawAura(x, kind, X, Y, R, t, layer) {
    const A = AURA[kind]; if (!A || kind === 'ninguna') return;
    x.save(); try { A.draw(x, X, Y, R, t, layer); } catch (e) { /* un efecto nunca debe tumbar el juego */ } x.restore();
  }

  /* ---------------- ESTELAS ----------------
     Cada personaje lleva su recorrido (puntos con su hora); se dibuja detrás. */
  const TR = {};
  function trailPush(key, X, Y, now, minD = 3) {
    const T = TR[key] || (TR[key] = []), l = T[T.length - 1];
    if (!l || Math.hypot(X - l.x, Y - l.y) >= minD) T.push({ x: X, y: Y, t: now }); else { l.t = now; }
    while (T.length > 60) T.shift();
  }
  function trailReset(key) { delete TR[key]; }
  const TRAIL = {
    ninguna: { life: 0 },
    humo: { life: 0.7, draw(x, P, w, now) { for (let i = 0; i < P.length; i++) { const p = P[i], a = 1 - (now - p.t) / 0.7; if (a <= 0) continue; put(x, smoke('235,235,245'), p.x, p.y, w * (1.4 + (1 - a) * 2.6), a * 0.5); } } },
    chispas: { life: 0.5, draw(x, P, w, now) { x.globalCompositeOperation = 'lighter'; for (let i = 0; i < P.length; i++) { const p = P[i], age = now - p.t, a = 1 - age / 0.5; if (a <= 0) continue; for (let k = 0; k < 3; k++) put(x, glow(k ? '255,220,120' : '255,150,50', true), p.x + (H(i, k + 11) - 0.5) * w * 3 * (1 - a), p.y + (H(i, k + 3) - 0.2) * w * 3.5 * (1 - a), w * (0.9 + H(i, k)) * a, a); } } },
    burbujas: { life: 0.9, draw(x, P, w, now) { for (let i = 0; i < P.length; i += 2) { const p = P[i], a = 1 - (now - p.t) / 0.9; if (a <= 0) continue; const r = w * (0.3 + (1 - a) * 0.5) * (0.6 + H(i, 1)); x.globalAlpha = a * 0.8; x.strokeStyle = 'rgba(190,240,255,.9)'; x.lineWidth = 1.2; x.beginPath(); x.arc(p.x + (H(i, 2) - 0.5) * w, p.y - (1 - a) * w * 2, r, 0, TAU); x.stroke(); } } },
    fuego: { life: 0.45, draw(x, P, w, now) { x.globalCompositeOperation = 'lighter'; for (let i = 0; i < P.length; i++) { const p = P[i], a = 1 - (now - p.t) / 0.45; if (a <= 0) continue; put(x, glow(a > 0.6 ? '255,230,140' : a > 0.3 ? '255,140,40' : '220,50,20', a > 0.7), p.x, p.y - (1 - a) * w * 1.5, w * (1.4 + a * 2.4), a); } } },
    hielo: { life: 0.6, draw(x, P, w, now) { x.globalCompositeOperation = 'lighter'; for (let i = 0; i < P.length; i++) { const p = P[i], a = 1 - (now - p.t) / 0.6; if (a <= 0) continue; put(x, glow('120,210,255'), p.x, p.y, w * 2.6 * a + w, a * 0.6); if (i % 2 === 0) put(x, flake('180,235,255'), p.x + (H(i, 1) - 0.5) * w * 2.4, p.y + (H(i, 2) - 0.5) * w * 2.4, w * 1.8 * a, a, i + now); } } },
    sombra: { life: 0.7, draw(x, P, w, now) { for (let i = 0; i < P.length; i++) { const p = P[i], a = 1 - (now - p.t) / 0.7; if (a <= 0) continue; x.globalCompositeOperation = 'lighter'; put(x, glow('140,40,255'), p.x, p.y, w * 3 * a, a * 0.35); x.globalCompositeOperation = 'source-over'; put(x, smoke('16,2,30'), p.x, p.y, w * (1.8 + (1 - a) * 2.4), a * 0.75); if (i % 2 === 0) { x.globalCompositeOperation = 'lighter'; put(x, glow('190,90,255', true), p.x + (H(i, 3) - 0.5) * w * 2, p.y + (H(i, 4) - 0.5) * w * 2, w * 0.9, a); } } } },
    neon: { life: 0.55, ribbon: true, draw(x, P, w, now, rgb) { ribbon(x, P, now, 0.55, (a, i) => { x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(${rgb},${(a * 0.45).toFixed(3)})`; return w * 1.9 * a; }); ribbon(x, P, now, 0.55, a => { x.strokeStyle = `rgba(255,255,255,${(a * 0.95).toFixed(3)})`; return Math.max(1, w * 0.45 * a); }); } },
    arcoiris: { life: 0.65, ribbon: true, draw(x, P, w, now) { const n = 6; for (let b = 0; b < n; b++) { const off = (b - (n - 1) / 2) * w * 0.32; ribbon(x, P, now, 0.65, a => { x.globalCompositeOperation = 'lighter'; x.strokeStyle = `hsla(${b * 55},100%,62%,${(a * 0.85).toFixed(3)})`; return w * 0.34; }, off); } } },
    rayo: { life: 0.35, draw(x, P, w, now) { if (P.length < 2) return; x.globalCompositeOperation = 'lighter'; const seed = Math.floor(now * 30); for (const [lw, c] of [[w * 1.2, 'rgba(80,160,255,.45)'], [Math.max(1, w * 0.3), 'rgba(235,245,255,.95)']]) { x.lineWidth = lw; x.strokeStyle = c; x.lineJoin = 'round'; x.beginPath(); let st = false; for (let i = 0; i < P.length; i++) { const p = P[i], a = 1 - (now - p.t) / 0.35; if (a <= 0) continue; const j = (H(i, seed) - 0.5) * w * 2.2; st ? x.lineTo(p.x + j, p.y - j) : x.moveTo(p.x + j, p.y - j); st = true; } x.stroke(); } } },
    cometa: { life: 0.8, draw(x, P, w, now) { x.globalCompositeOperation = 'lighter'; for (let i = 0; i < P.length; i++) { const p = P[i], a = 1 - (now - p.t) / 0.8; if (a <= 0) continue; put(x, glow('150,170,255'), p.x, p.y, w * 3.4 * a, a * 0.45); if (H(i, 1) > 0.3) put(x, star(H(i, 2) > 0.5 ? '255,240,200' : '200,220,255'), p.x + (H(i, 3) - 0.5) * w * 3.6 * (1 - a), p.y + (H(i, 4) - 0.5) * w * 3.6 * (1 - a), w * (1.4 + H(i, 5) * 1.4) * (0.4 + 0.6 * Math.abs(Math.sin(now * 6 + i))), a); } const h = P[P.length - 1]; if (h) put(x, glow('255,255,255', true), h.x, h.y, w * 4, 0.8); } },
    galaxia: { life: 0.9, draw(x, P, w, now) { x.globalCompositeOperation = 'lighter'; for (let i = 0; i < P.length; i++) { const p = P[i], a = 1 - (now - p.t) / 0.9; if (a <= 0) continue; const c = ['255,110,210', '170,100,255', '90,150,255'][i % 3]; put(x, glow(c), p.x + Math.sin(i * 1.7 + now) * w * (1 - a), p.y + Math.cos(i * 1.3) * w * (1 - a), w * (2.8 + (1 - a) * 2.4), a * 0.7); if (i % 2) put(x, star('255,245,255'), p.x + (H(i, 6) - 0.5) * w * 3.6, p.y + (H(i, 7) - 0.5) * w * 3.6, w * 1.5 * a, a); } } },
  };
  function ribbon(x, P, now, life, style, off = 0) {
    x.lineCap = 'round'; x.lineJoin = 'round';
    for (let i = 1; i < P.length; i++) {
      const p = P[i - 1], q = P[i], a = 1 - (now - p.t) / life; if (a <= 0) continue;
      let ox = 0, oy = 0; if (off) { const dx = q.x - p.x, dy = q.y - p.y, l = Math.hypot(dx, dy) || 1; ox = -dy / l * off; oy = dx / l * off; }
      x.lineWidth = style(a, i); x.beginPath(); x.moveTo(p.x + ox, p.y + oy); x.lineTo(q.x + ox, q.y + oy); x.stroke();
    }
  }
  function drawTrail(x, kind, key, w, now, rgb = '255,255,255') {
    const D = TRAIL[kind], P = TR[key]; if (!D || !D.life || !P || P.length < 2) return;
    while (P.length && now - P[0].t > D.life) P.shift();
    x.save(); try { D.draw(x, P, w, now, rgb); } catch (e) { /* nada */ } x.restore();
  }

  /* ---------------- MATERIALES (diseños de tela, ala, chicle o pintura) ----------------
     Cada uno = un mosaico quieto (se dibuja una vez por colores) + un toque animado.
     El juego recorta con la forma de la prenda y llama a Vest.material(...). */
  const R0 = s => { let v = s >>> 0; return () => (v = (v * 1664525 + 1013904223) >>> 0) / 4294967296; };
  const MAT = {
    escamas: { tile(x, W, Hh, c) { x.fillStyle = c[2]; x.fillRect(0, 0, W, Hh); const s = W / 7; for (let r = -1; r < Hh / (s * 0.55) + 1; r++) for (let k = -1; k < 8; k++) { const cx = k * s + (r % 2 ? s / 2 : 0), cy = r * s * 0.55; const g = x.createLinearGradient(cx, cy - s * 0.5, cx, cy + s * 0.5); g.addColorStop(0, c[1]); g.addColorStop(0.55, c[0]); g.addColorStop(1, c[2]); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, s * 0.56, 0, Math.PI); x.closePath(); x.fill(); x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = 1; x.stroke(); x.strokeStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.arc(cx, cy + s * 0.05, s * 0.42, Math.PI * 0.15, Math.PI * 0.55); x.stroke(); } },
      anim(x, bx, by, bw, bh, t) { const p = (t * 0.35) % 1.6 - 0.3, g = x.createLinearGradient(bx + bw * (p - 0.25), by, bx + bw * (p + 0.25), by + bh); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.globalCompositeOperation = 'lighter'; x.fillStyle = g; x.fillRect(bx, by, bw, bh); } },
    jaguar: { tile(x, W, Hh, c) { const g = x.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, c[1]); g.addColorStop(1, c[0]); x.fillStyle = g; x.fillRect(0, 0, W, Hh); const r = R0(77); for (let i = 0; i < W * Hh / 620; i++) { const X = r() * W, Y = r() * Hh, s = 4 + r() * 5; x.fillStyle = c[3] || '#b5651d'; x.beginPath(); x.ellipse(X, Y, s * 0.8, s * 0.65, r() * 3, 0, TAU); x.fill(); x.fillStyle = c[2]; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + r() * 0.4; x.beginPath(); x.ellipse(X + Math.cos(a) * s * 1.05, Y + Math.sin(a) * s * 0.9, s * 0.36, s * 0.24, a + Math.PI / 2, 0, TAU); x.fill(); } } } },
    runas: { tile(x, W, Hh, c) { x.fillStyle = c[0]; x.fillRect(0, 0, W, Hh); x.strokeStyle = c[1]; x.globalAlpha = 0.5; x.lineWidth = 1; for (let X = W * 0.18; X < W; X += W * 0.32) { x.beginPath(); x.moveTo(X, 0); x.lineTo(X, Hh); x.stroke(); } x.globalAlpha = 1; const r = R0(9); for (let i = 0; i < W * Hh / 900; i++) { x.save(); x.translate(r() * W, r() * Hh); x.scale(0.9, 0.9); x.strokeStyle = c[1]; x.lineWidth = 1.4; x.lineCap = 'round'; x.stroke(new Path2D(RUNES[i % RUNES.length])); x.restore(); } },
      anim(x, bx, by, bw, bh, t, c, tile) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.35 + 0.3 * Math.sin(t * 2.4); x.drawImage(tile, bx, by, bw, bh); const p = (t * 0.5) % 1; const g = x.createLinearGradient(0, by + bh * (1 - p) - bh * 0.2, 0, by + bh * (1 - p) + bh * 0.2); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(${c[2] || '200,150,255'},.45)`); g.addColorStop(1, 'rgba(255,255,255,0)'); x.globalAlpha = 1; x.fillStyle = g; x.fillRect(bx, by, bw, bh); } },
    cristal: { tile(x, W, Hh, c) { const r = R0(31), n = 7, m = 9, P = []; for (let j = 0; j <= m; j++) for (let i = 0; i <= n; i++) P.push([i / n * W + (i && i < n ? (r() - 0.5) * W / n * 0.7 : 0), j / m * Hh + (j && j < m ? (r() - 0.5) * Hh / m * 0.7 : 0)]); const at = (i, j) => P[j * (n + 1) + i];
        for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) for (const tri of [[at(i, j), at(i + 1, j), at(i, j + 1)], [at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)]]) { const k = r(); x.fillStyle = k < 0.33 ? c[0] : k < 0.66 ? c[1] : c[2]; x.beginPath(); x.moveTo(...tri[0]); x.lineTo(...tri[1]); x.lineTo(...tri[2]); x.closePath(); x.fill(); x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 0.8; x.stroke(); } },
      anim(x, bx, by, bw, bh, t) { x.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const k = Math.floor(t * 1.5 + i * 0.37), a = Math.sin((t * 1.5 + i * 0.37 - k) * Math.PI); put(x, star('220,240,255'), bx + H(k, i) * bw, by + H(k, i + 5) * bh, Math.min(bw, bh) * 0.35, a); } } },
    aurora: { tile(x, W, Hh, c) { x.fillStyle = c[0]; x.fillRect(0, 0, W, Hh); for (let i = 0; i < 70; i++) { x.fillStyle = 'rgba(255,255,255,' + (0.3 + H(i, 1) * 0.6).toFixed(2) + ')'; x.fillRect(H(i, 2) * W, H(i, 3) * Hh, 1.2, 1.2); } },
      anim(x, bx, by, bw, bh, t, c) { x.globalCompositeOperation = 'lighter'; for (let b = 0; b < 3; b++) { x.beginPath(); for (let i = 0; i <= 20; i++) { const u = i / 20, X = bx + u * bw, Y = by + bh * (0.25 + b * 0.22) + Math.sin(u * 5 + t * (1.2 + b * 0.3) + b) * bh * 0.08; i ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.lineTo(bx + bw, by + bh * (0.25 + b * 0.22) + bh * 0.25); x.lineTo(bx, by + bh * (0.25 + b * 0.22) + bh * 0.25); x.closePath(); const g = x.createLinearGradient(0, by + bh * (0.2 + b * 0.22), 0, by + bh * (0.5 + b * 0.22)); g.addColorStop(0, `rgba(${c[1 + b % 2]},.65)`); g.addColorStop(1, `rgba(${c[1 + b % 2]},0)`); x.fillStyle = g; x.fill(); } } },
    tormenta: { tile(x, W, Hh, c) { x.fillStyle = c[0]; x.fillRect(0, 0, W, Hh); const r = R0(5); for (let i = 0; i < 40; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 1); x.save(); x.translate(r() * W, r() * Hh); const s = 10 + r() * 26; x.scale(s, s * 0.6); g.addColorStop(0, `rgba(${c[1]},.55)`); g.addColorStop(1, `rgba(${c[1]},0)`); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 1, 0, TAU); x.fill(); x.restore(); } },
      anim(x, bx, by, bw, bh, t) { const k = Math.floor(t * 2.2), ph = t * 2.2 - k; if (H(k, 1) < 0.55 || ph > 0.35) return; x.globalCompositeOperation = 'lighter'; const a = 1 - ph / 0.35; put(x, glow('150,200,255'), bx + H(k, 2) * bw, by + bh * 0.4, Math.max(bw, bh) * 1.2, a * 0.5); x.strokeStyle = `rgba(235,245,255,${a.toFixed(3)})`; x.lineWidth = 1.6; x.beginPath(); let X = bx + H(k, 2) * bw, Y = by; x.moveTo(X, Y); while (Y < by + bh) { Y += bh * 0.12; X += (H(k, Y | 0) - 0.5) * bw * 0.25; x.lineTo(X, Y); } x.stroke(); } },
    lava: { tile(x, W, Hh, c) { const g = x.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, c[0]); g.addColorStop(1, c[1]); x.fillStyle = g; x.fillRect(0, 0, W, Hh); },
      glowTile(x, W, Hh) { const r = R0(13); x.lineCap = 'round'; x.lineJoin = 'round'; for (let i = 0; i < 9; i++) { let X = r() * W, Y = r() * Hh; const pts = [[X, Y]]; for (let k = 0; k < 7; k++) { X += (r() - 0.5) * W * 0.35; Y += (r() - 0.3) * Hh * 0.18; pts.push([X, Y]); } for (const [lw, col] of [[6, 'rgba(255,90,20,.35)'], [2.6, 'rgba(255,160,40,.9)'], [1, 'rgba(255,240,170,1)']]) { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); pts.forEach((p, j) => j ? x.lineTo(...p) : x.moveTo(...p)); x.stroke(); } } },
      anim(x, bx, by, bw, bh, t, c, tile, gtile) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.65 + 0.35 * Math.sin(t * 2.6); x.drawImage(gtile, bx, by, bw, bh); x.globalAlpha = 0.25 + 0.2 * Math.sin(t * 1.7 + 1); put(x, glow('255,90,20'), bx + bw / 2, by + bh, Math.max(bw, bh) * 1.4, 1); } },
    oro: { tile(x, W, Hh, c) { const g = x.createLinearGradient(0, 0, W, Hh); g.addColorStop(0, c[1]); g.addColorStop(0.45, c[0]); g.addColorStop(1, c[2]); x.fillStyle = g; x.fillRect(0, 0, W, Hh); x.strokeStyle = c[3] || 'rgba(120,70,0,.55)'; x.lineWidth = 1.3; x.lineCap = 'round';
        for (let j = 0; j < Hh; j += 26) for (let i = (j / 26) % 2 ? 13 : 0; i < W + 13; i += 26) { x.beginPath(); for (let k = 0; k < 26; k++) { const a = k * 0.42, r = 1 + k * 0.42; k ? x.lineTo(i + Math.cos(a) * r, j + Math.sin(a) * r) : x.moveTo(i, j); } x.stroke(); x.beginPath(); x.arc(i, j, 1.6, 0, TAU); x.fillStyle = 'rgba(255,255,230,.8)'; x.fill(); } },
      anim(x, bx, by, bw, bh, t) { const p = (t * 0.45) % 1.8 - 0.4, g = x.createLinearGradient(bx + bw * (p - 0.3), by, bx + bw * (p + 0.1), by + bh); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,250,220,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.globalCompositeOperation = 'lighter'; x.fillStyle = g; x.fillRect(bx, by, bw, bh); for (let i = 0; i < 3; i++) { const k = Math.floor(t * 1.2 + i * 0.4); put(x, star('255,235,160'), bx + H(k, i) * bw, by + H(k, i + 4) * bh, Math.min(bw, bh) * 0.3, Math.sin(((t * 1.2 + i * 0.4) % 1) * Math.PI)); } } },
    llamas: { tile(x, W, Hh, c) { const g = x.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, c[0]); g.addColorStop(1, c[1]); x.fillStyle = g; x.fillRect(0, 0, W, Hh); for (let i = 0; i < 9; i++) { const X = (i + 0.5) / 9 * W, h = Hh * (0.35 + H(i, 3) * 0.3); const f = x.createLinearGradient(0, Hh, 0, Hh - h); const fa = c[2] || '255,200,90', fb = c[3] || '220,50,10'; f.addColorStop(0, 'rgba(255,245,200,.95)'); f.addColorStop(0.35, `rgba(${fa},.9)`); f.addColorStop(1, `rgba(${fb},0)`); x.fillStyle = f; x.beginPath(); x.moveTo(X - W / 14, Hh); x.bezierCurveTo(X - W / 12, Hh - h * 0.5, X + W / 30, Hh - h * 0.6, X, Hh - h); x.bezierCurveTo(X + W / 20, Hh - h * 0.55, X + W / 12, Hh - h * 0.4, X + W / 14, Hh); x.fill(); } },
      anim(x, bx, by, bw, bh, t, c) { x.globalCompositeOperation = 'lighter'; for (let i = 0; i < 9; i++) { const p = (t * 1.8 + H(i, 1)) % 1; put(x, flame(c[2] || '255,200,80', c[3] || '255,60,10'), bx + (i + 0.5) / 9 * bw + Math.sin(t * 5 + i) * bw * 0.02, by + bh - bh * 0.18 - p * bh * 0.25, bw * 0.16 * (1 - p * 0.5), (1 - p) * 0.85); } } },
    galaxia: { tile(x, W, Hh, c) { x.fillStyle = '#07041a'; x.fillRect(0, 0, W, Hh); const r = R0(3); for (let i = 0; i < 16; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 1); x.save(); x.translate(r() * W, r() * Hh); const s = 18 + r() * 40; x.scale(s, s * (0.5 + r() * 0.5)); const col = [c[0], c[1], c[2]][i % 3]; g.addColorStop(0, `rgba(${col},.55)`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 1, 0, TAU); x.fill(); x.restore(); } for (let i = 0; i < W * Hh / 70; i++) { x.fillStyle = `rgba(255,255,255,${(0.3 + r() * 0.7).toFixed(2)})`; const s = r() < 0.1 ? 1.8 : 1; x.fillRect(r() * W, r() * Hh, s, s); } },
      pan: true, anim(x, bx, by, bw, bh, t) { x.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) put(x, star('255,245,255'), bx + H(i, 1) * bw, by + H(i, 2) * bh, Math.min(bw, bh) * 0.28 * Math.abs(Math.sin(t * 1.7 + i * 1.3)), 1); } },
    vacio: { tile(x, W, Hh, c) { const g = x.createRadialGradient(W / 2, Hh / 2, 0, W / 2, Hh / 2, Math.max(W, Hh) * 0.7); g.addColorStop(0, '#000'); g.addColorStop(0.7, '#08020f'); g.addColorStop(1, c[0]); x.fillStyle = g; x.fillRect(0, 0, W, Hh); for (let i = 0; i < 50; i++) { x.fillStyle = `rgba(${c[1]},${(H(i, 4) * 0.7).toFixed(2)})`; x.fillRect(H(i, 5) * W, H(i, 6) * Hh, 1, 1); } },
      anim(x, bx, by, bw, bh, t, c) { x.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { const p = (t * 0.4 + k / 3) % 1; x.globalAlpha = (1 - p) * 0.7; x.strokeStyle = `rgb(${c[1]})`; x.lineWidth = 1.4; x.beginPath(); x.ellipse(bx + bw / 2, by + bh * 0.45, bw * 0.6 * (1 - p), bh * 0.4 * (1 - p), 0, 0, TAU); x.stroke(); } } },
    holo: { tile(x, W, Hh, c) { const g = x.createLinearGradient(0, 0, W, Hh); g.addColorStop(0, '#e8ecf6'); g.addColorStop(0.5, '#9aa4bc'); g.addColorStop(1, '#dfe4f0'); x.fillStyle = g; x.fillRect(0, 0, W, Hh); x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 0.8; for (let i = -Hh; i < W; i += 6) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + Hh, Hh); x.stroke(); } },
      anim(x, bx, by, bw, bh, t) { x.globalCompositeOperation = 'overlay'; const p = t * 0.6, g = x.createLinearGradient(bx + Math.cos(p) * bw * 0.5, by, bx + bw - Math.cos(p) * bw * 0.5, by + bh); for (let k = 0; k <= 6; k++) g.addColorStop(k / 6, `hsla(${(k * 60 + t * 90) % 360},100%,60%,.85)`); x.fillStyle = g; x.fillRect(bx, by, bw, bh); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.25; x.fillStyle = g; x.fillRect(bx, by, bw, bh); } },
  };
  const TILES = {};
  function matTile(kind, c, glowLayer) {
    const M = MAT[kind]; if (!M) return null; const key = kind + (glowLayer ? 'G' : '') + c.join('|'); if (TILES[key]) return TILES[key];
    const W = 160, Hh = 200, cv = mk(M.pan ? W * 2 : W, M.pan ? Hh * 2 : Hh), x = cv.getContext('2d');
    try { if (glowLayer) M.glowTile(x, cv.width, cv.height, c); else M.tile(x, cv.width, cv.height, c); } catch (e) { /* nada */ }
    return (TILES[key] = cv);
  }
  // pinta un material dentro de la caja (el que llama ya recortó con la forma); a = opacidad del mosaico
  function material(x, kind, c, bx, by, bw, bh, t, a = 0.92, anim = true) {
    const M = MAT[kind]; if (!M) return; const tile = matTile(kind, c);
    x.save();
    try {
      x.globalAlpha = a;
      if (M.pan) { const ox = (t * 6) % (tile.width / 2), oy = (t * 3) % (tile.height / 2); x.drawImage(tile, ox, oy, tile.width / 2, tile.height / 2, bx, by, bw, bh); } else x.drawImage(tile, bx, by, bw, bh);
      if (anim && M.anim) { x.globalAlpha = 1; M.anim(x, bx, by, bw, bh, t, c, tile, M.glowTile ? matTile(kind, c, true) : null); }
    } catch (e) { /* nada */ }
    x.restore();
  }

  /* ---------------- estilos de la pantalla (se ponen una vez) ---------------- */
  let cssDone = false;
  function css() {
    if (cssDone) return; cssDone = true;
    const s = document.createElement('style');
    s.textContent = `
.vst,.vst-rv{position:fixed;inset:0;z-index:2147482000;font-family:var(--vst-font,inherit);color:#f6f2ff;-webkit-font-smoothing:antialiased}
.vst{display:grid;place-items:center;background:rgba(4,2,12,.82);padding:max(10px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(10px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left))}
.vst *{box-sizing:border-box}
.vst button{font:inherit;color:inherit;cursor:pointer}
.vst-box{width:min(1180px,100%);height:calc(100vh - 20px);height:calc(100dvh - 20px - env(safe-area-inset-top) - env(safe-area-inset-bottom));max-height:760px;display:flex;flex-direction:column;gap:10px;background:linear-gradient(180deg,rgba(38,24,78,.97),rgba(12,8,30,.98));border:1px solid rgba(214,196,255,.24);border-radius:22px;padding:14px 16px;box-shadow:0 30px 90px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.08)}
.vst-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.vst-head h2{margin:0;font-size:24px;letter-spacing:.02em;font-weight:800}
.vst-count{margin:2px 0 0;font-size:13px;color:#b9b0dc;font-weight:700}
.vst-pl{display:flex;gap:4px;padding:4px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);margin-left:auto}
.vst-pl button{border:0;background:none;padding:7px 14px;border-radius:999px;font-weight:800;font-size:14px;color:#b9b0dc}
.vst-pl button[aria-pressed=true]{background:var(--pc,#fff);color:#140c22}
.vst-x{border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);border-radius:999px;padding:8px 16px;font-weight:800}
.vst-tabs{display:flex;gap:6px;flex-wrap:wrap}
.vst-tabs button{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);border-radius:12px;padding:8px 14px;font-weight:800;font-size:14px;color:#cfc7ee}
.vst-tabs button small{opacity:.7;font-weight:700;margin-left:6px}
.vst-tabs button[aria-selected=true]{background:linear-gradient(100deg,#ff6fcf,#a865ff 50%,#5a8dff);color:#fff;border-color:rgba(255,255,255,.35)}
.vst-tabs .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#ff4f7a;margin-left:6px;box-shadow:0 0 8px #ff4f7a;vertical-align:1px}
.vst-main{flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr);grid-template-rows:minmax(0,1fr);gap:12px}
.vst-stage{position:relative;border-radius:18px;overflow:hidden;background:radial-gradient(ellipse at 50% 40%,rgba(120,80,200,.35),rgba(6,4,16,.95) 70%);border:1px solid rgba(255,255,255,.1);display:flex;flex-direction:column;min-height:0}
.vst-cv{flex:1;min-height:0;position:relative}.vst-cv canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.vst-sel{padding:10px 14px 14px;display:flex;flex-direction:column;gap:6px;background:linear-gradient(0deg,rgba(6,4,16,.92),rgba(6,4,16,.5))}
.vst-sel b{font-size:21px;font-weight:800}
.vst-sel p{margin:0;font-size:13.5px;color:#cfc7ee;line-height:1.35}
.vst-rar{align-self:flex-start;font-size:11.5px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;padding:4px 10px;border-radius:999px;color:#160c22;background:var(--rc,#ccc);box-shadow:0 0 16px var(--rg,transparent)}
.vst-rar.mitico{background:linear-gradient(90deg,#ff6fd8,#ffd36b,#6fffd8,#6fa8ff,#c06bff,#ff6fd8);background-size:300% 100%;animation:vstRb 3s linear infinite}
@keyframes vstRb{to{background-position:300% 0}}
.vst-prog{height:7px;border-radius:7px;background:rgba(255,255,255,.12);overflow:hidden}.vst-prog i{display:block;height:100%;background:linear-gradient(90deg,#ff6fcf,#a865ff,#5a8dff);border-radius:7px}
.vst-eq{align-self:flex-start;border:0;border-radius:999px;padding:10px 20px;font-weight:900;font-size:15px;background:linear-gradient(100deg,#ff6fcf,#a865ff 50%,#5a8dff);color:#fff;box-shadow:0 6px 22px rgba(160,90,255,.45)}
.vst-eq[disabled]{opacity:.45;cursor:default;box-shadow:none}
.vst-grid{overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));grid-auto-rows:max-content;gap:9px;align-content:start;overscroll-behavior:contain;padding:2px 4px 8px 2px;scrollbar-width:thin}
.vst-card{position:relative;border:2px solid var(--rc);border-radius:14px;background:linear-gradient(180deg,rgba(var(--rgb),.22),rgba(10,6,24,.9) 60%);padding:0 0 8px;display:flex;flex-direction:column;align-items:stretch;gap:4px;overflow:hidden;text-align:center;transition:transform .15s,box-shadow .2s}
.vst-card:hover{transform:translateY(-2px);box-shadow:0 0 22px rgba(var(--rgb),.45)}
.vst-card[aria-pressed=true]{box-shadow:0 0 0 2px #fff,0 0 26px rgba(var(--rgb),.7)}
.vst-card canvas{width:100%;aspect-ratio:4/3;display:block}
.vst-card .n{font-size:12.5px;font-weight:800;line-height:1.15;padding:0 6px}
.vst-card .r{font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:var(--rc)}
.vst-card.lock canvas{filter:grayscale(.85) brightness(.45)}
.vst-card.lock .n{color:#9a92bd}
.vst-card .lk{position:absolute;top:6px;right:6px;font-size:13px;filter:drop-shadow(0 1px 2px #000)}
.vst-card .on{position:absolute;top:6px;left:6px;font-size:10px;font-weight:900;padding:3px 7px;border-radius:999px;background:var(--pc,#fff);color:#140c22}
.vst-card .nw{position:absolute;top:6px;right:6px;font-size:10px;font-weight:900;padding:3px 7px;border-radius:999px;background:#ff4f7a;color:#fff;box-shadow:0 0 10px #ff4f7a}
.vst-card.mitico{border-color:transparent;background:linear-gradient(180deg,rgba(255,111,216,.25),rgba(10,6,24,.9) 60%) padding-box,linear-gradient(120deg,#ff6fd8,#ffd36b,#6fffd8,#6fa8ff,#c06bff,#ff6fd8) border-box;background-size:100% 100%,300% 300%;animation:vstRb2 4s linear infinite}
@keyframes vstRb2{to{background-position:0 0,300% 0}}
@media (max-width:760px),(max-height:520px){.vst-box{padding:10px;border-radius:16px}.vst-head h2{font-size:19px}.vst-main{grid-template-columns:1fr;grid-template-rows:minmax(150px,42%) minmax(0,1fr)}.vst-sel{padding:8px 10px 10px}.vst-sel b{font-size:17px}.vst-grid{grid-template-columns:repeat(auto-fill,minmax(96px,1fr))}}
@media (max-height:520px) and (orientation:landscape){.vst-main{grid-template-columns:minmax(0,1fr) minmax(0,1.3fr);grid-template-rows:minmax(0,1fr)}.vst-sel p{display:none}.vst-box{gap:6px;padding:8px 10px}.vst-head h2{font-size:17px}.vst-count{font-size:11.5px}.vst-tabs button{padding:5px 10px;font-size:13px}.vst-pl button{padding:5px 11px}.vst-x{padding:6px 12px}.vst-sel{gap:4px;padding:6px 10px 8px}.vst-sel b{font-size:15px}.vst-eq{padding:7px 14px;font-size:13px}.vst-card .n{font-size:11px}}
.vst-rv{display:grid;place-items:center;background:radial-gradient(ellipse at 50% 45%,rgba(var(--rgb),.35),rgba(4,2,12,.94) 62%);overflow:hidden;animation:vstIn .35s ease-out}
@keyframes vstIn{from{opacity:0}}
.vst-rays{position:absolute;left:50%;top:44%;width:240vmax;height:240vmax;margin:-120vmax 0 0 -120vmax;background:repeating-conic-gradient(rgba(var(--rgb),.18) 0 7deg,transparent 7deg 18deg);animation:vstSpin 22s linear infinite;-webkit-mask:radial-gradient(circle,#000 0,transparent 45%);mask:radial-gradient(circle,#000 0,transparent 45%)}
@keyframes vstSpin{to{transform:rotate(360deg)}}
.vst-flash{position:absolute;inset:0;background:#fff;opacity:0;animation:vstFlash .9s ease-out}
@keyframes vstFlash{0%{opacity:.85}100%{opacity:0}}
.vst-rvbox{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;padding:16px;max-width:min(560px,94vw);animation:vstPop .7s cubic-bezier(.2,1.4,.3,1)}
@keyframes vstPop{from{transform:scale(.4) translateY(30px);opacity:0}}
.vst-rvk{font-size:15px;font-weight:900;letter-spacing:.3em;color:#fff;text-shadow:0 0 18px rgba(var(--rgb),.9)}
.vst-rvbox canvas{width:min(340px,70vw,52vh);aspect-ratio:1;border-radius:24px;background:radial-gradient(circle at 50% 45%,rgba(var(--rgb),.32),rgba(8,4,20,.8) 70%);box-shadow:0 0 0 2px rgba(var(--rgb),.8),0 0 60px rgba(var(--rgb),.55)}
.vst-rvbox h3{margin:2px 0 0;font-size:clamp(26px,5vw,40px);font-weight:900;text-shadow:0 0 24px rgba(var(--rgb),.85),0 3px 0 rgba(0,0,0,.4)}
.vst-rvbox p{margin:0;color:#ddd5f5;font-size:14.5px;font-weight:700}
.vst-rvb{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:8px}
.vst-rvb button{font:inherit;cursor:pointer;border:1px solid rgba(255,255,255,.3);border-radius:999px;padding:10px 18px;font-weight:900;font-size:14.5px;background:rgba(255,255,255,.08);color:#fff}
.vst-rvb button.go{background:linear-gradient(100deg,#ff6fcf,#a865ff 50%,#5a8dff);border-color:rgba(255,255,255,.4)}
.vst-rvb button.p{background:var(--pc);color:#140c22;border-color:transparent}
.vst-more{font-size:12.5px;color:#b9b0dc;font-weight:700}
@media (max-height:520px){.vst-rvbox{gap:4px;padding:8px}.vst-rvbox canvas{width:min(46vh,240px)}.vst-rvbox h3{font-size:26px}.vst-rvk{font-size:12px}}
`;
    document.head.appendChild(s);
  }

  /* ---------------- un vestidor por juego ---------------- */
  function create(cfg) {
    const KEY = cfg.prefix + 'vest', slots = cfg.slots, items = cfg.items, BY = {};
    items.forEach(it => { BY[it.id] = it; });
    const load = () => { try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && v.got ? v : null; } catch (e) { return null; } };
    const S = Object.assign({ v: 1, got: {}, seen: {}, eq: [{}, {}] }, load() || {});
    if (!Array.isArray(S.eq) || S.eq.length < 2) S.eq = [{}, {}];
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* sin guardado */ } };
    const queue = [];
    const has = id => { const it = BY[id]; return !!it && (it.free || !!S.got[id]); };
    const slotOf = id => slots.find(s => s.id === id);
    // lo equipado: por jugador; si el espacio es «por personaje», también por personaje
    function eq(p, slot, ch) {
      const s = slotOf(slot), E = S.eq[p] || {}; let id = s && s.perChar ? (E[slot] || {})[ch] : E[slot];
      if (!id || !has(id) || (BY[id].char && BY[id].char !== ch && s && s.perChar)) id = defOf(slot, ch);
      return id;
    }
    function defOf(slot, ch) { const d = items.find(it => it.slot === slot && it.free && (!it.char || it.char === ch)); return d ? d.id : null; }
    function setEq(p, slot, id, ch) {
      if (!has(id)) return false; const s = slotOf(slot); S.eq[p] = S.eq[p] || {};
      if (s && s.perChar) { const c = BY[id].char || ch; S.eq[p][slot] = S.eq[p][slot] || {}; S.eq[p][slot][c] = id; } else S.eq[p][slot] = id;
      save(); if (cfg.onEquip) cfg.onEquip(p, slot, id); return true;
    }
    // revisar qué se ganó (se llama al terminar partidas, jefes, etapas…)
    function check(silent) {
      const C = cfg.ctx ? cfg.ctx() : {}, out = [];
      for (const it of items) { if (it.free || S.got[it.id] || !it.test) continue; let ok = false; try { ok = !!it.test(C); } catch (e) { ok = false; } if (ok) { S.got[it.id] = today(); out.push(it); } }
      if (out.length) { save(); out.sort((a, b) => RORDER.indexOf(a.rar) - RORDER.indexOf(b.rar)); if (!silent) queue.push(...out.filter(it => !queue.includes(it))); }
      return out;
    }
    const progOf = it => { if (!it.prog) return null; try { const C = cfg.ctx ? cfg.ctx() : {}, [a, b] = it.prog(C); return [Math.min(a, b), b]; } catch (e) { return null; } };
    let open = null, raf = 0;
    // teclas: mientras el vestidor o la ceremonia están abiertos, el juego no las recibe
    addEventListener('keydown', e => {
      if (!open) return; e.stopImmediatePropagation();
      if (e.key === 'Escape') { e.preventDefault(); open.close(); } else if (e.key === 'Enter' && open.enter) { e.preventDefault(); open.enter(); } else if ((e.key === '1' || e.key === '2') && open.p) { open.p(+e.key - 1); }
    }, true);
    addEventListener('keyup', e => { if (open) e.stopImmediatePropagation(); }, true);
    const pname = p => (cfg.pnames ? cfg.pnames()[p] : 'J' + (p + 1));
    /* ---- ceremonia «¡Nuevo!» ---- */
    function reveal(done) {
      if (!queue.length) { if (done) done(); return false; }
      css(); const it = queue.shift(), R = RAR[it.rar] || RAR.comun, s = slotOf(it.slot), el = document.createElement('div');
      el.className = 'vst-rv'; el.style.setProperty('--rgb', R.rgb); el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Nuevo: ' + it.name);
      const pcs = cfg.pcolors || ['#ffd36b', '#6fd0ff'];
      el.innerHTML = `<div class="vst-rays"></div><div class="vst-flash"></div><div class="vst-rvbox"><div class="vst-rvk">¡${esc((s.newWord || 'NUEVO').toUpperCase())} ${esc((s.one || '').toUpperCase())}!</div><canvas width="600" height="600"></canvas><span class="vst-rar ${it.rar}" style="--rc:${R.c};--rg:${R.c}">${R.name}</span><h3>${esc(it.name)}</h3><p>${esc(it.how || it.desc || '')}</p>
        <div class="vst-rvb">${[0, 1].map(p => `<button class="p" data-p="${p}" style="--pc:${pcs[p]}">Ponérselo a ${esc(pname(p))}</button>`).join('')}<button class="go" data-go>${queue.length ? 'Siguiente ›' : 'Seguir'}</button></div>${queue.length ? `<div class="vst-more">y ${queue.length} más por ver</div>` : ''}</div>`;
      document.body.appendChild(el);
      const cv = el.querySelector('canvas'), x = cv.getContext('2d'), t0 = performance.now(); let who = 0;
      const ch = cfg.charOf ? cfg.charOf(0) : null;
      const loop = now => { const t = (now - t0) / 1000; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 600, 600); try { cfg.preview(x, 600, 600, t, who, { [it.slot]: it.id }, it, true); } catch (e) { /* nada */ } raf = requestAnimationFrame(loop); };
      cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
      if (cfg.sound && cfg.sound.reveal) try { cfg.sound.reveal(it.rar); } catch (e) { /* nada */ }
      const close = () => { cancelAnimationFrame(raf); el.remove(); open = null; S.seen[it.id] = 1; save(); if (!reveal(done) && done) done(); };
      open = { close, enter: close, p(p) { if (setEq(p, it.slot, it.id, BY[it.id].char || (cfg.charOf ? cfg.charOf(p) : null))) { const b = el.querySelector(`[data-p="${p}"]`); if (b) b.textContent = '✓ Lo tiene ' + pname(p); who = p; } } };
      el.querySelectorAll('[data-p]').forEach(b => b.onclick = () => open && open.p(+b.dataset.p));
      el.querySelector('[data-go]').onclick = close; el.querySelector('[data-go]').focus();
      return true;
    }
    /* ---- pantalla del vestidor ---- */
    function wardrobe(opts = {}) {
      css(); let P = opts.player || 0, slot = opts.slot || slots[0].id, selId = null, hover = null;
      const pcs = cfg.pcolors || ['#ffd36b', '#6fd0ff'], el = document.createElement('div'); el.className = 'vst'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', cfg.title || 'Vestidor');
      document.body.appendChild(el);
      const list = () => { const ch = cfg.charOf ? cfg.charOf(P) : null, s = slotOf(slot); return items.filter(it => it.slot === slot && (!s.perChar || !it.char || it.char === ch)).sort((a, b) => RORDER.indexOf(a.rar) - RORDER.indexOf(b.rar) || (a.order || 0) - (b.order || 0)); };
      const total = () => items.filter(it => !it.free && (!it.char || !slotOf(it.slot).perChar || true)).length, gotN = () => items.filter(it => !it.free && S.got[it.id]).length;
      function render() {
        const L = list(), ch = cfg.charOf ? cfg.charOf(P) : null, cur = eq(P, slot, ch); if (!selId || !L.find(i => i.id === selId)) selId = cur || (L[0] && L[0].id);
        const tabs = slots.map(s => { const all = items.filter(it => it.slot === s.id && !it.free), g = all.filter(it => S.got[it.id]).length, nw = all.some(it => S.got[it.id] && !S.seen[it.id]); return `<button role="tab" aria-selected="${s.id === slot}" data-tab="${s.id}">${esc(s.name)}<small>${g}/${all.length}</small>${nw ? '<span class="dot"></span>' : ''}</button>`; }).join('');
        el.innerHTML = `<div class="vst-box"><div class="vst-head"><div><h2>${esc(cfg.title || 'Vestidor')}</h2><p class="vst-count">${gotN()} de ${total()} conseguidos${cfg.charName && slotOf(slot).perChar ? ' · ' + esc(cfg.charName(P)) : ''}</p></div>
          <div class="vst-pl">${[0, 1].map(p => `<button aria-pressed="${p === P}" data-pl="${p}" style="--pc:${pcs[p]}">${esc(pname(p))}</button>`).join('')}</div><button class="vst-x" data-x>Volver</button></div>
          <div class="vst-tabs" role="tablist">${tabs}</div>
          <div class="vst-main"><div class="vst-stage"><div class="vst-cv"><canvas></canvas></div><div class="vst-sel"></div></div><div class="vst-grid">${L.map(it => { const R = RAR[it.rar] || RAR.comun, ok = has(it.id), on = it.id === cur, nw = ok && !it.free && !S.seen[it.id]; return `<button class="vst-card ${it.rar}${ok ? '' : ' lock'}" aria-pressed="${it.id === selId}" data-it="${it.id}" style="--rc:${R.c};--rgb:${R.rgb};--pc:${pcs[P]}" title="${esc(it.name)}"><canvas width="160" height="120"></canvas><span class="n">${esc(it.name)}</span><span class="r">${R.name}</span>${on ? '<span class="on">PUESTO</span>' : ''}${!ok ? '<span class="lk">🔒</span>' : nw ? '<span class="nw">NUEVO</span>' : ''}</button>`; }).join('')}</div></div></div>`;
        el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { slot = b.dataset.tab; selId = null; snd('open'); render(); });
        el.querySelectorAll('[data-pl]').forEach(b => b.onclick = () => { P = +b.dataset.pl; selId = null; snd('open'); render(); });
        el.querySelector('[data-x]').onclick = () => open.close();
        el.querySelectorAll('[data-it]').forEach(b => { b.onclick = () => { selId = b.dataset.it; S.seen[selId] = 1; save(); el.querySelectorAll('[data-it]').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.it === selId))); const nw = b.querySelector('.nw'); if (nw) nw.remove(); sel(); snd('pick'); }; b.onmouseenter = () => { hover = b.dataset.it; }; b.onmouseleave = () => { hover = null; }; });
        // miniaturas quietas (la grande sí se mueve)
        el.querySelectorAll('[data-it]').forEach(b => { const it = BY[b.dataset.it], x = b.querySelector('canvas').getContext('2d'); try { cfg.preview(x, 160, 120, 1.3, P, { [it.slot]: it.id }, it, false); } catch (e) { /* nada */ } });
        sel();
      }
      function sel() {
        const it = BY[selId], box = el.querySelector('.vst-sel'); if (!it) { box.innerHTML = ''; return; }
        const R = RAR[it.rar] || RAR.comun, ok = has(it.id), ch = cfg.charOf ? cfg.charOf(P) : null, on = eq(P, slot, ch) === it.id, pg = ok ? null : progOf(it);
        box.innerHTML = `<span class="vst-rar ${it.rar}" style="--rc:${R.c};--rg:${R.c}">${R.name}</span><b>${esc(it.name)}</b><p>${ok ? esc(it.desc || it.how || '') : '🔒 ' + esc(it.how || 'Sigue jugando para ganarlo.')}</p>${pg ? `<div class="vst-prog" title="${pg[0]} de ${pg[1]}"><i style="width:${Math.round(100 * pg[0] / Math.max(1, pg[1]))}%"></i></div><p style="font-size:12px">${pg[0]} de ${pg[1]}</p>` : ''}<button class="vst-eq" ${ok && !on ? '' : 'disabled'}>${on ? '✓ Puesto a ' + esc(pname(P)) : ok ? 'Ponérselo a ' + esc(pname(P)) : 'Bloqueado'}</button>`;
        const b = box.querySelector('.vst-eq'); if (b) b.onclick = () => { if (setEq(P, slot, it.id, ch)) { snd('equip'); render(); } };
      }
      const snd = k => { if (cfg.sound && cfg.sound[k]) try { cfg.sound[k](); } catch (e) { /* nada */ } };
      const t0 = performance.now();
      const loop = now => {
        const cv = el.querySelector('.vst-stage canvas'); if (cv) {
          const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1), W = Math.max(2, Math.round(r.width * d)), Hh = Math.max(2, Math.round(r.height * d));
          if (cv.width !== W || cv.height !== Hh) { cv.width = W; cv.height = Hh; }
          const x = cv.getContext('2d'), t = (now - t0) / 1000, it = BY[hover] || BY[selId]; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, Hh);
          try { cfg.preview(x, W, Hh, t, P, it ? { [it.slot]: it.id } : {}, it, true); } catch (e) { /* nada */ }
        }
        raf = requestAnimationFrame(loop);
      };
      cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
      open = { close() { cancelAnimationFrame(raf); el.remove(); open = null; if (opts.onClose) opts.onClose(); }, p(p) { P = p; selId = null; render(); } };
      render(); snd('open');
      const f = el.querySelector('[data-x]'); if (f) f.focus();
    }
    // lo que conviene mostrar en un botón: «Vestidor · 3 nuevos»
    const fresh = () => items.filter(it => !it.free && S.got[it.id] && !S.seen[it.id]).length;
    return { RAR, has, eq, setEq, check, reveal, wardrobe, fresh, get pending() { return queue.length; }, get isOpen() { return !!open; }, items, BY, S, progOf, count: () => [items.filter(it => !it.free && S.got[it.id]).length, items.filter(it => !it.free).length] };
  }

  // camino para mostrar estelas en las vistas previas (un ocho)
  function demo(t, W, Hh, k = 0.28) { const a = t * 1.6; return { x: W / 2 + Math.sin(a) * W * k, y: Hh / 2 + Math.sin(a * 2) * Hh * k * 0.45 }; }
  return { RAR, RORDER, AURA, TRAIL, MAT, create, drawAura, drawTrail, trailPush, trailReset, material, matTile, demo, glow, star, put, hueRgb };
})();
