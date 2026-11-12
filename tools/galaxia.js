// Genera la textura de galaxia de GameHub (nebulosa profunda + estrellas) en assets/galaxia.jpg.
// Se corre una sola vez (o cuando se quiera otra galaxia): node tools/galaxia.js [semilla]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '..', 'assets');
const SEED = +(process.argv[2] || 7);

const PAGE = `<canvas id="c"></canvas><script>
function rng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function simplex(seed) {
  const R = rng(seed), p = new Uint8Array(512), g = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
  const a = Array.from({ length: 256 }, (_, i) => i); for (let i = 255; i > 0; i--) { const j = (R() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
  for (let i = 0; i < 512; i++) p[i] = a[i & 255];
  const F = 0.5 * (Math.sqrt(3) - 1), G = (3 - Math.sqrt(3)) / 6;
  return (x, y) => {
    const s = (x + y) * F, i = Math.floor(x + s), j = Math.floor(y + s), t = (i + j) * G, x0 = x - i + t, y0 = y - j + t;
    const i1 = x0 > y0 ? 1 : 0, j1 = 1 - i1, x1 = x0 - i1 + G, y1 = y0 - j1 + G, x2 = x0 - 1 + 2 * G, y2 = y0 - 1 + 2 * G, ii = i & 255, jj = j & 255;
    let n = 0, q;
    let t0 = 0.5 - x0 * x0 - y0 * y0; if (t0 > 0) { q = g[p[ii + p[jj]] & 7]; t0 *= t0; n += t0 * t0 * (q[0] * x0 + q[1] * y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1; if (t1 > 0) { q = g[p[ii + i1 + p[jj + j1]] & 7]; t1 *= t1; n += t1 * t1 * (q[0] * x1 + q[1] * y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2; if (t2 > 0) { q = g[p[ii + 1 + p[jj + 1]] & 7]; t2 *= t2; n += t2 * t2 * (q[0] * x2 + q[1] * y2); }
    return 70 * n;
  };
}
window.make = (W, H, seed) => {
  const N = simplex(seed), N2 = simplex(seed + 101), R = rng(seed + 7);
  const fbm = (n, x, y, o) => { let a = 0.5, f = 1, s = 0, k = 0; for (let i = 0; i < o; i++) { s += a * n(x * f, y * f); k += a; f *= 2.03; a *= 0.5; } return s / k; };
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const VIO = [0.40, 0.14, 0.80], MAG = [0.95, 0.20, 0.62], BLU = [0.10, 0.26, 0.88], CYA = [0.30, 0.78, 1.0], PEA = [1.0, 0.60, 0.42], WHI = [1, 0.93, 0.98];
  const cv = document.getElementById('c'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  const img = x.createImageData(W, H), d = img.data, asp = W / H, S = 1.15;
  const band = (u, v, w) => { const c = 0.64 - 0.42 * (u - 0.5) + 0.07 * Math.sin(u * 5.2 + 1.3) + w; const dd = v - c; return Math.exp(-(dd * dd) / (2 * 0.17 * 0.17)); };
  const f01 = (n, x, y, o) => fbm(n, x, y, o) * 0.5 + 0.5;
  // capas de gas: cada una es ruido fractal elevado a una potencia (nubes suaves con núcleos brillantes)
  const L = [
    { c: [0.55, 0.16, 0.95], sc: 1.0, off: [0, 0], dens: 0.05, fall: 4.4, k: 1.05 },     // violeta
    { c: [1.0, 0.24, 0.66], sc: 1.35, off: [7.1, 3.3], dens: 0.02, fall: 5.0, k: 1.2 },  // magenta
    { c: [0.16, 0.36, 1.0], sc: 1.15, off: [3.4, 9.7], dens: 0.06, fall: 4.2, k: 1.6 }, // azul
    { c: [0.35, 0.85, 1.0], sc: 2.2, off: [12.2, 1.9], dens: 0.0, fall: 6.5, k: 1.2 }, // cian
    { c: [1.0, 0.72, 0.55], sc: 1.7, off: [5.5, 15.1], dens: -0.01, fall: 8.0, k: 2.3 },  // núcleos cálidos
  ];
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const u = px / W, v = py / H, X = u * asp * S, Y = v * S;
    const wx = fbm(N2, X * 0.8, Y * 0.8, 4) * 0.42, wy = fbm(N2, X * 0.8 + 4.1, Y * 0.8 + 7.3, 4) * 0.42;
    const b = band(u, v, 0.6 * wy * 0.2), bm = 0.12 + 0.88 * b;
    let r = 0.008, g = 0.005, bl = 0.022;
    for (let i = 0; i < L.length; i++) {
      const l = L[i], n = f01(N, (X + wx) * l.sc + l.off[0], (Y + wy) * l.sc + l.off[1], 7);
      const d = Math.pow(Math.max(0, n + l.dens + 0.16 * (b - 0.5)), l.fall) * l.k * 2.2 * bm;
      // los tonos se reparten por la imagen: rosado abajo a la izquierda, azul arriba a la derecha
      const side = i === 1 ? 0.6 + 0.8 * (1 - u) * v : i === 2 ? 0.5 + 0.9 * u * (1 - v) : 1;
      r += l.c[0] * d * side; g += l.c[1] * d * side; bl += l.c[2] * d * side;
    }
    const dust = sm(0.56, 0.78, f01(N2, (X + wx * 2) * 1.9 + 21, (Y + wy * 2) * 1.9 + 4, 6)) * (0.25 + 0.75 * b);
    const k = 1 - 0.82 * dust; r *= k; g *= k; bl *= k;
    const vg = 1 - 0.3 * Math.pow(Math.hypot(u - 0.5, (v - 0.5) * 0.9) * 1.45, 2.2);
    const o = (py * W + px) * 4;
    d[o] = 255 * (1 - Math.exp(-r * 1.55 * vg)); d[o + 1] = 255 * (1 - Math.exp(-g * 1.55 * vg)); d[o + 2] = 255 * (1 - Math.exp(-bl * 1.55 * vg)); d[o + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  // estrellas: muchas finas, más densas en la banda; unas pocas brillantes con destellos en cruz
  x.globalCompositeOperation = 'lighter';
  const tint = () => { const t = R(); return t < 0.55 ? [255, 255, 255] : t < 0.8 ? [190, 215, 255] : t < 0.93 ? [255, 205, 235] : [255, 230, 200]; };
  const n = Math.round(W * H / 520);
  for (let i = 0; i < n; i++) {
    let u, v, tries = 0; do { u = R(); v = R(); tries++; } while (R() > 0.22 + 0.78 * band(u, v, 0) && tries < 6);
    const m = Math.pow(R(), 5), [cr, cg, cb] = tint(), sx = u * W, sy = v * H;
    if (m < 0.18) { x.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + (0.25 + m * 3).toFixed(3) + ')'; x.fillRect(sx, sy, 1, 1); continue; }
    const rad = 0.6 + m * 2.2, gr = x.createRadialGradient(sx, sy, 0, sx, sy, rad * 2.6);
    gr.addColorStop(0, 'rgba(' + cr + ',' + cg + ',' + cb + ',' + Math.min(1, 0.5 + m).toFixed(3) + ')'); gr.addColorStop(0.3, 'rgba(' + cr + ',' + cg + ',' + cb + ',' + (0.2 * m + 0.05).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(' + cr + ',' + cg + ',' + cb + ',0)');
    x.fillStyle = gr; x.beginPath(); x.arc(sx, sy, rad * 2.6, 0, 6.283); x.fill();
  }
  // cúmulo brillante (como en las fotos del telescopio)
  for (let i = 0; i < 160; i++) {
    const a = R() * 6.283, rr = Math.pow(R(), 1.8) * W * 0.06, sx = W * 0.6 + Math.cos(a) * rr * 1.3, sy = H * 0.5 + Math.sin(a) * rr, m = Math.pow(R(), 2.5);
    const gr = x.createRadialGradient(sx, sy, 0, sx, sy, 1.2 + m * 3.2); gr.addColorStop(0, 'rgba(235,240,255,' + (0.55 + m * 0.45).toFixed(3) + ')'); gr.addColorStop(0.4, 'rgba(200,215,255,' + (0.18 + m * 0.2).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(160,190,255,0)');
    x.fillStyle = gr; x.beginPath(); x.arc(sx, sy, 1.2 + m * 3.2, 0, 6.283); x.fill();
  }
  const flare = (sx, sy, L, a, c) => {
    const gr = x.createRadialGradient(sx, sy, 0, sx, sy, L * 0.32); gr.addColorStop(0, 'rgba(' + c + ',' + a + ')'); gr.addColorStop(0.18, 'rgba(' + c + ',' + (a * 0.35).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(' + c + ',0)');
    x.fillStyle = gr; x.beginPath(); x.arc(sx, sy, L * 0.32, 0, 6.283); x.fill();
    for (const [dx, dy, l] of [[1, 0, 1], [0, 1, 0.85]]) {
      const g2 = x.createLinearGradient(sx - dx * L * l, sy - dy * L * l, sx + dx * L * l, sy + dy * L * l);
      g2.addColorStop(0, 'rgba(' + c + ',0)'); g2.addColorStop(0.5, 'rgba(' + c + ',' + (a * 0.9).toFixed(3) + ')'); g2.addColorStop(1, 'rgba(' + c + ',0)');
      x.fillStyle = g2; if (dx) x.fillRect(sx - L * l, sy - 0.9, 2 * L * l, 1.8); else x.fillRect(sx - 0.9, sy - L * l, 1.8, 2 * L * l);
    }
  };
  for (let i = 0; i < Math.round(W * H / 52000); i++) { const u = R(), v = R(), b = band(u, v, 0); if (R() > 0.3 + 0.7 * b) continue; flare(u * W, v * H, 14 + Math.pow(R(), 2) * 46 * (W / 1920), 0.85, R() < 0.6 ? '235,242,255' : '255,220,240'); }
  return cv.toDataURL('image/jpeg', 0.86);
};
</script>`;

(async () => {
  const b = await chromium.launch({ args: ['--disable-gpu'] }); const p = await b.newPage();
  await p.setContent(PAGE);
  for (const [name, W, H] of [['galaxia', 1920, 1080]]) {
    const url = await p.evaluate(([W, H, s]) => window.make(W, H, s), [W, H, SEED]);
    fs.writeFileSync(path.join(OUT, name + '.jpg'), Buffer.from(url.split(',')[1], 'base64'));
    console.log(name, (fs.statSync(path.join(OUT, name + '.jpg')).size / 1024).toFixed(0) + ' KB');
  }
  await b.close();
})();
