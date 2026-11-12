/* =========================================================================
   ARTE DEL SUELO — el terreno de cada escenario se pinta una vez (manchas
   orgánicas por celda + textura de pincel + matas de pasto, piedras, flores)
   y luego, cada cuadro, encima: charcos, hielo, barro, ceniza, lava,
   enredaderas, corriente eléctrica, brillos del agua. Lo alto (frailejones,
   muros, llamas) se dibuja ordenado por profundidad junto a los magos.
   ========================================================================= */
const THEMES = {
  paramo: {
    grass: ['#7c8749', '#8f9150', '#667a42', '#9a9656'], tuft: ['#c2b062', '#a99d55', '#7d9150', '#d8c27a'], flower: ['#f2e6a0', '#e8a7d0', '#fff6e0', '#c9b6ff'],
    dirt: ['#8a6b4a', '#7a5c3e', '#9a7a56'], stone: ['#8e90a2', '#7c7e92', '#a2a4b4'], deep: ['#1f5a7c', '#27688a'], shallow: ['#4a93a6', '#5aa3b2'], shore: '#5e6448',
    rock: { top: '#857e92', face: '#4c4658', hi: '#b2abc2', moss: '#6c8048' }, fertile: '#5b4231', lava: ['#ff7b2a', '#c8331a'], chasm: '#070a14',
    ambient: [16, 20, 52], ambientA: 0.5, moon: true, fog: [190, 200, 235],
  },
  rio: {
    grass: ['#3e6b3a', '#4a7a40', '#335c32', '#57864a'], tuft: ['#6aa04a', '#4f8a3c', '#86b85a', '#a6cc66'], flower: ['#ff8fb0', '#ffd06a', '#ffffff', '#ff6a4a'],
    dirt: ['#6e5236', '#5e442c', '#7e6040'], stone: ['#7a7e86', '#6e7280', '#888c94'], deep: ['#2a5a5e', '#2f6668'], shallow: ['#4a8682', '#58948c'], shore: '#5a5636',
    rock: { top: '#6e6a62', face: '#3e3a36', hi: '#a09a8a', moss: '#4f7a3a' }, fertile: '#4a3424', lava: ['#ff7b2a', '#c8331a'], chasm: '#070a14',
    ambient: [8, 22, 34], ambientA: 0.5, fog: [170, 215, 200], tree: 'jungle',
  },
  volcan: {
    grass: ['#4a4a3a', '#55523e', '#3e3e34', '#5e5a44'], tuft: ['#7a7a52', '#8a8a5a', '#9a9460', '#6a6a50'], flower: ['#ffb04a', '#ffe07a'],
    dirt: ['#4e4240', '#43393a', '#5a4c48'], stone: ['#5e5864', '#524e5a', '#6a6472'], deep: ['#1f4e6e', '#27688a'], shallow: ['#4a93a6', '#5aa3b2'], shore: '#3e3634',
    rock: { top: '#3a3440', face: '#1c1822', hi: '#6e6480', moss: '#6a3a24' }, fertile: '#3a2a24', lava: ['#ff8a2a', '#e04a1a', '#ffb43a'], chasm: '#070a14',
    ambient: [34, 12, 20], ambientA: 0.5, fog: [140, 100, 100], tree: 'none',
  },
  cano: {
    grass: ['#5a7a3a', '#6a8a42', '#4a6a34', '#7a9a4a'], tuft: ['#9ac85a', '#7ab048', '#c8d870', '#e8c84a'], flower: ['#ff4a5a', '#ffd04a', '#fff'],
    dirt: ['#8a6a48', '#7a5c3e', '#9a7a56'], stone: ['#a09a8a', '#908a7a', '#b0aa9a'], deep: ['#2a6a7a', '#2a5a8a'], shallow: ['#c8384a', '#e85a3a', '#e8c84a', '#4aa86a'], shore: '#8a7a5a',
    rock: { top: '#7a7468', face: '#4a4640', hi: '#b0a898', moss: '#5a8a40' }, fertile: '#5b4231', lava: ['#ff7b2a', '#c8331a'], chasm: '#070a14',
    ambient: [14, 20, 44], ambientA: 0.46, fog: [200, 210, 230], tree: 'jungle',
  },
  ciudad: {
    grass: ['#4a7842', '#578848', '#3c6838', '#649852'], tuft: ['#7ab85a', '#5a9a44', '#94c868', '#b2d878'], flower: ['#ff8fb0', '#ffe07a', '#ffffff', '#c9b6ff'],
    dirt: ['#7a5c40', '#6a4e34', '#8a6c4c'], stone: ['#a29e90', '#928e80', '#b2ae9e'], deep: ['#1f5a7c', '#27688a'], shallow: ['#4a93a6', '#5aa3b2'], shore: '#5e6448',
    rock: { top: '#837e70', face: '#4e4a42', hi: '#bab4a2', moss: '#5a8a40' }, fertile: '#5b4231', lava: ['#ff7b2a', '#c8331a'], chasm: '#070a14',
    ambient: [12, 20, 42], ambientA: 0.5, fog: [185, 205, 225], tree: 'bush',
  },
  // ---- Mundo 2 ----
  cielo: {
    grass: ['#7fa25a', '#8fb066', '#70964e', '#9cba72'], tuft: ['#cfe08a', '#b8d27a', '#e6eaa0', '#a6c86a'], flower: ['#ffffff', '#ffd6f0', '#bfe6ff', '#ffe9a0'],
    dirt: ['#d2c2a0', '#c6b48e', '#decfae'], stone: ['#c8c6d8', '#b8b6cc', '#d8d6e6'], deep: ['#3a86c8', '#4a96d4'], shallow: ['#7ac0e8', '#8accf0'], shore: '#d8d0b0',
    rock: { top: '#e2dcec', face: '#8e88aa', hi: '#ffffff', moss: '#c8b860' }, fertile: '#8a6a48', lava: ['#ff7b2a', '#c8331a'], chasm: '#8ab8ee',
    ambient: [40, 50, 120], ambientA: 0.26, fog: [255, 250, 235], fogK: 0.25, lightK: 0.45, tree: 'gold', edgeRgb: '255,250,230', sky: 'cielo', skyCol: ['#2f6fd0', '#6aa4ea', '#b8d6f6'], cliff: ['#b4a694', '#54485a'], edgeHi: 'rgba(255,255,255,0.4)',
    grade: ['rgba(255,214,140,0.16)', 'rgba(90,120,255,0.2)'], bloom: 0.2, rays: 1.3, rayRgb: [255, 244, 200], moteRgb: [255, 246, 210], shadowK: 0.85, bridge: 'light',
  },
  infierno: {
    grass: ['#3a2c2e', '#463436', '#322628', '#503a3a'], tuft: ['#6a4a40', '#7a5444', '#5a3e3a', '#8a5a44'], flower: ['#ff7a3a', '#ffb04a'],
    dirt: ['#30242a', '#281e24', '#3a2c32'], stone: ['#3e3848', '#343040', '#484254'], deep: ['#3a1014', '#4a1418'], shallow: ['#5a2024', '#6a282a'], shore: '#241a1c',
    rock: { top: '#3a2c40', face: '#140e18', hi: '#74608a', moss: '#8a2a1a' }, fertile: '#2a1a1a', lava: ['#ff8a2a', '#e04a1a', '#ffb43a'], chasm: '#0a0204',
    ambient: [36, 4, 10], ambientA: 0.6, fog: [170, 70, 50], fogK: 0.3, bloom: 0.7, tree: 'dead', edgeRgb: '255,130,60', sky: 'infierno', cliff: ['#3e2c38', '#0c0608'], edgeHi: 'rgba(255,140,60,0.3)',
    grade: ['rgba(255,70,30,0.22)', 'rgba(100,20,150,0.2)'], rays: 0.8, rayRgb: [255, 110, 50], moteRgb: [255, 150, 70], bridge: 'bone',
  },
};
const ArtGround = (() => {
  const cache = {};
  let noiseTile = null;
  function makeNoise() {
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), id = x.createImageData(256, 256);
    for (let j = 0; j < 256; j++) for (let i = 0; i < 256; i++) {
      const v = fbm2(i / 32, j / 32, 4) * 0.7 + hash2(i, j) * 0.3, o = (j * 256 + i) * 4, g = Math.round(v * 255);
      id.data[o] = g; id.data[o + 1] = g; id.data[o + 2] = g; id.data[o + 3] = 255;
    }
    x.putImageData(id, 0, 0); return c;
  }
  const rnd = (i, k) => hash2(i * 1.37 + k * 17.1, k * 3.71 - i * 0.23);
  const hx3 = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixH = (a, b, f) => { const A = hx3(a), B = hx3(b); return `rgb(${A.map((v, k) => Math.round(v + (B[k] - v) * f)).join(',')})`; };
  const rr2 = (x, X, Y, w, h, r) => { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); };
  // lava viva: brillo amplio que fluye, costras oscuras que derivan y burbujas
  function lavaCell(x, i, px, py, time, a) {
    const f = 0.5 + 0.5 * Math.sin(time * 1.6 + rnd(i, 11) * 6), jx = Math.sin(time * 0.5 + rnd(i, 12) * 6) * 9, jy = Math.cos(time * 0.4 + rnd(i, 13) * 6) * 7;
    x.globalAlpha = a * (0.22 + f * 0.2); x.drawImage(blob('255,200,90', 0.9), px - CELL * 1.15 + jx, py - CELL * 1.15 + jy, CELL * 2.3, CELL * 2.3);
    if (rnd(i, 14) < 0.45) { x.globalAlpha = a * 0.55; x.drawImage(blob('60,22,16', 0.9), px - 13 + jx * 1.4, py - 9 + jy, 26 + rnd(i, 15) * 14, 16 + rnd(i, 16) * 8); }
    if (rnd(i, 17) < 0.3) { const bp = (time * 0.7 + rnd(i, 18) * 5) % 1; x.globalAlpha = a * (1 - bp); x.strokeStyle = 'rgba(255,240,170,0.9)'; x.lineWidth = 1.5; x.beginPath(); x.arc(px + (rnd(i, 19) - 0.5) * 24, py + (rnd(i, 20) - 0.5) * 20, 2 + bp * 6, 0, TAU); x.stroke(); }
    x.globalAlpha = 1;
  }
  // manchas suaves (degradado redondo) para charcos, hielo, barro, ceniza, lava...
  const blobs = {};
  function blob(rgb, core = 0.85) { const k = rgb + core; if (blobs[k]) return blobs[k]; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, `rgba(${rgb},${core})`); g.addColorStop(0.55, `rgba(${rgb},${core * 0.75})`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return (blobs[k] = c); }
  function prerender(G) {
    const key = G.arena; if (cache[key]) return cache[key];
    const T = G.T, th = THEMES[G.A.theme] || THEMES.paramo, S = 1.25;
    const c = document.createElement('canvas'); c.width = Math.ceil(T.W * S); c.height = Math.ceil(T.H * S);
    const x = c.getContext('2d'); x.scale(S, S);
    if (!noiseTile) noiseTile = makeNoise();
    const type = i => { const b = T.base[i]; return b === TT.BUSH ? (th.tree === 'dead' ? TT.DIRT : TT.GRASS) : b === TT.BRIDGE ? (th.sky ? TT.CHASM : TT.DEEP) : b; };
    // 1. campo de color a baja resolución (bordes orgánicos y suaves al agrandarlo)
    const R = 6, lw = Math.ceil(T.W / R), lh = Math.ceil(T.H / R), lc = document.createElement('canvas'); lc.width = lw; lc.height = lh;
    const lx = lc.getContext('2d'), id = lx.createImageData(lw, lh), D = id.data;
    const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const PAL = {}; PAL[TT.GRASS] = th.grass.map(hex); PAL[TT.FERTILE] = [hex(th.fertile)]; PAL[TT.DIRT] = th.dirt.map(hex); PAL[TT.STONE] = th.stone.map(hex);
    PAL[TT.DEEP] = th.deep.map(hex); PAL[TT.SHALLOW] = th.shallow.map(hex); PAL[TT.LAVA] = th.lava.map(hex); PAL[TT.CHASM] = [hex(th.chasm)]; PAL[TT.ROCK] = [hex(th.rock.face)];
    const shore = hex(th.shore), KIND = new Uint8Array(lw * lh); let EDGE = false;
    for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) {
      const wx = i * R + R / 2, wy = j * R + R / 2;
      const ox = (fbm2(wx / 80, wy / 80, 3) - 0.5) * 46, oy = (fbm2(wx / 80 + 31, wy / 80 + 17, 3) - 0.5) * 46;
      const ci = Terrain.idx(T, clamp(wx + ox, 0, T.W - 1), clamp(wy + oy, 0, T.H - 1)); let ty = ci < 0 ? TT.ROCK : type(ci);
      const pal = PAL[ty] || PAL[TT.GRASS], n = fbm2(wx / 140, wy / 140, 3), n2 = noise2(wx / 33, wy / 33);
      const k = Math.min(pal.length - 1, Math.floor(n * pal.length * 1.2)), c = pal[k], c2 = pal[(k + 1) % pal.length], f = (n2 - 0.5) * 0.6 + 0.5;
      let r = lerp(c[0], c2[0], f * 0.5), g = lerp(c[1], c2[1], f * 0.5), bb = lerp(c[2], c2[2], f * 0.5);
      if (ty === TT.SHALLOW || ty === TT.DEEP) { let near = false; for (const [dx, dy] of [[-22, 0], [22, 0], [0, -22], [0, 22]]) { const cj = Terrain.idx(T, clamp(wx + ox + dx, 0, T.W - 1), clamp(wy + oy + dy, 0, T.H - 1)); if (cj >= 0 && type(cj) !== TT.SHALLOW && type(cj) !== TT.DEEP) near = true; } if (near) { r = lerp(r, shore[0], 0.6); g = lerp(g, shore[1], 0.6); bb = lerp(bb, shore[2], 0.6); } }
      const o = (j * lw + i) * 4; D[o] = r; D[o + 1] = g; D[o + 2] = bb; D[o + 3] = 255; KIND[j * lw + i] = ty === TT.SHALLOW || ty === TT.DEEP ? 1 : ty === TT.CHASM ? 2 : ty === TT.LAVA ? 3 : 0;
    }
    // cielo/abismo (Mundo 2): el vacío queda transparente para ver las nubes o la lava del fondo
    if (th.sky) for (let q = 0; q < lw * lh; q++) if (KIND[q] === 2) D[q * 4 + 3] = 0;
    // dos pasadas de desenfoque para que los bordes queden orgánicos
    for (let pass = 0; pass < 2; pass++) { const src = new Uint8ClampedArray(D); for (let j = 1; j < lh - 1; j++) for (let i = 1; i < lw - 1; i++) for (let ch = 0; ch < 3; ch++) { let sum = 0; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) sum += src[((j + dj) * lw + i + di) * 4 + ch]; D[(j * lw + i) * 4 + ch] = sum / 9; } }
    lx.putImageData(id, 0, 0);
    // máscara del agua (para las cáusticas vivas) con la misma orilla orgánica
    { const mc = document.createElement('canvas'); mc.width = lw; mc.height = lh; const mx = mc.getContext('2d'), md = mx.createImageData(lw, lh); let any = false; for (let q = 0; q < lw * lh; q++) if (KIND[q] === 1) { md.data[q * 4] = md.data[q * 4 + 1] = md.data[q * 4 + 2] = 255; md.data[q * 4 + 3] = 255; any = true; } mx.putImageData(md, 0, 0); if (any) c.waterMask = mc; }
    // islas flotantes / borde del abismo (Mundo 2): pared de roca que cuelga bajo cada orilla, con estratos y puntas
    if (th.sky) {
      const cf = hx3(th.cliff[0]), cd = hx3(th.cliff[1]);
      for (let j = 0; j < lh - 1; j++) for (let i = 0; i < lw; i++) {
        const q = j * lw + i; if (KIND[q] === 2 || KIND[q + lw] !== 2) continue;
        const wx = i * R, wy = j * R + R * 0.2, hgt = 44 + fbm2(wx / 60, 3.3, 2) * 46 + (hash2(i, 7) < 0.18 ? 16 : 0);
        const g = x.createLinearGradient(0, wy - 2, 0, wy + hgt); g.addColorStop(0, `rgb(${cf.join(',')})`); g.addColorStop(0.55, `rgb(${cf.map((v, k) => Math.round((v + cd[k]) / 2)).join(',')})`); g.addColorStop(1, `rgba(${cd.join(',')},0.0)`);
        x.fillStyle = g; x.fillRect(wx - 1, wy - 3, R + 2, hgt + 3);
        if (hash2(i, 11) < 0.3) { x.fillStyle = 'rgba(0,0,10,0.22)'; x.fillRect(wx, wy + 6 + hash2(i, 12) * 20, R + 1, 3); }
        if (th.sky === 'infierno' && hash2(i, 13) < 0.12) { x.fillStyle = 'rgba(255,120,40,0.5)'; x.fillRect(wx + 2, wy + 10 + hash2(i, 14) * 24, 2, 9); }
      }
      EDGE = true;
    }
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(lc, 0, 0, lw * R, lh * R);
    // filo del abismo: luz en el borde de arriba, sombra en el de abajo (manchas suaves, sin escalones)
    if (EDGE) for (let j = 1; j < lh - 1; j++) for (let i = 1; i < lw - 1; i++) { const q = j * lw + i; if (KIND[q] === 2) continue; const dn = KIND[q + lw] === 2, up = KIND[q - lw] === 2 || KIND[q - 1] === 2 || KIND[q + 1] === 2; if (!dn && !up) continue; x.globalAlpha = dn ? 0.4 : 0.55; x.drawImage(blob(dn ? '0,0,14' : th.edgeRgb || '255,255,255', 0.6), i * R - R * 0.6, j * R - R * 0.4 + (dn ? R * 0.5 : 0), R * 2.2, R * 1.6); }
    x.globalAlpha = 1;
    // 1b. luz de luna moteada a gran escala (rompe lo plano) y sombra suave hacia abajo a la derecha
    // (en el Mundo 2 se guarda la silueta del suelo: las manchas no deben caer sobre el vacío, que deja ver el fondo)
    let keep = null; if (th.sky) { keep = document.createElement('canvas'); keep.width = x.canvas.width; keep.height = x.canvas.height; keep.getContext('2d').drawImage(x.canvas, 0, 0); }
    x.save(); x.globalCompositeOperation = 'soft-light';
    for (let k = 0; k < Math.round(T.W * T.H / 52000); k++) { const bx = rnd(k, 301) * T.W, by = rnd(k, 302) * T.H, br = 90 + rnd(k, 303) * 170, lit = rnd(k, 304) < 0.55; x.globalAlpha = 0.28 + rnd(k, 305) * 0.22; x.drawImage(blob(lit ? '255,244,214' : '6,14,50', 0.9), bx - br, by - br * 0.7, br * 2, br * 1.4); }
    x.restore();
    if (keep) { x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'destination-in'; x.drawImage(keep, 0, 0); x.restore(); keep = null; }
    // 1c. orillas: arena mojada oscura del lado de tierra y cordón de espuma del lado del agua
    if (!th.sky || true) for (let j = 1; j < lh - 1; j++) for (let i = 1; i < lw - 1; i++) {
      const q = j * lw + i, kd = KIND[q]; if (kd !== 1 && kd !== 3) continue;
      const edge = KIND[q - 1] !== kd || KIND[q + 1] !== kd || KIND[q - lw] !== kd || KIND[q + lw] !== kd; if (!edge) continue;
      const wx = i * R + R / 2, wy = j * R + R / 2, h1 = rnd(q, 311), h2 = rnd(q, 312);
      if (kd === 1) { x.globalAlpha = 0.5; x.drawImage(blob('30,26,20', 0.8), wx - 13, wy - 10, 26, 20); x.globalAlpha = 0.5 + h1 * 0.4; x.fillStyle = '#eaf6ff'; x.beginPath(); x.ellipse(wx + (h1 - 0.5) * 5, wy + (h2 - 0.5) * 5, 2.2 + h2 * 2.6, 1.6 + h1 * 1.6, h1 * 3, 0, TAU); x.fill(); }
      else { x.globalAlpha = 0.6; x.drawImage(blob('20,8,6', 0.9), wx - 14, wy - 11, 28, 22); x.globalAlpha = 0.5; x.drawImage(blob('255,170,60', 0.8), wx - 7, wy - 5, 14, 10); }
    }
    x.globalAlpha = 1;
    // 2. textura de pincel
    x.save(); x.globalAlpha = 0.18; x.globalCompositeOperation = 'soft-light'; x.fillStyle = x.createPattern(noiseTile, 'repeat'); x.fillRect(0, 0, T.W, T.H);
    x.globalAlpha = 0.1; x.globalCompositeOperation = 'multiply'; x.save(); x.scale(4, 4); x.fillRect(0, 0, T.W / 4, T.H / 4); x.restore(); x.restore();
    // 3. detalles por celda
    for (let i = 0; i < T.n; i++) {
      const b = type(i), px = Terrain.cx(T, i), py = Terrain.cy(T, i);
      if (b === TT.GRASS) {
        // matas en tres capas: sombra de la base, hojas oscuras y puntas claras
        const N = 9; for (let k = 0; k < N; k++) {
          const gx = px + (rnd(i, k) - 0.5) * CELL * 1.05, gy = py + (rnd(i, k + 20) - 0.5) * CELL * 1.05, h = 5 + rnd(i, k + 40) * 10, big = rnd(i, k + 70) < 0.22;
          x.globalAlpha = 0.28; x.drawImage(blob('8,14,10', 0.9), gx - 7, gy - 3, 14, 7);
          const c1 = th.tuft[(rnd(i, k + 60) * th.tuft.length) | 0], c2 = th.tuft[(rnd(i, k + 61) * th.tuft.length) | 0];
          for (let ly = 0; ly < 2; ly++) { x.strokeStyle = ly ? c1 : mixH(c2, '#0c1a10', 0.45); x.lineWidth = ly ? 1.15 : 1.7; x.globalAlpha = ly ? 0.9 : 0.8; x.lineCap = 'round'; x.beginPath(); const nb = big ? 4 : 2; for (let q = -nb; q <= nb; q++) { const lean = (rnd(i, k * 7 + q + 100) - 0.5) * 5, hh = h * (big ? 1.5 : 1) * (ly ? 1 : 0.8) * (0.7 + rnd(i, k * 5 + q + 120) * 0.5); x.moveTo(gx + q * 1.3, gy); x.quadraticCurveTo(gx + q * 2.3 + lean * 0.4, gy - hh * 0.6, gx + q * 3.2 + lean, gy - hh); } x.stroke(); }
        }
        // hojitas caídas, tréboles, flores con pétalos y hongos
        if (rnd(i, 97) < 0.35) { x.globalAlpha = 0.55; for (let k = 0; k < 3; k++) { x.fillStyle = k % 2 ? mixH(th.grass[0], '#0a1408', 0.4) : mixH(th.tuft[0], '#ffffff', 0.15); x.beginPath(); x.ellipse(px + (rnd(i, k + 130) - 0.5) * 34, py + (rnd(i, k + 133) - 0.5) * 34, 3.2, 1.5, rnd(i, k + 136) * 3, 0, TAU); x.fill(); } }
        if (rnd(i, 99) < 0.2) { for (let k = 0; k < 3; k++) { const fx2 = px + (rnd(i, k + 80) - 0.5) * 32, fy2 = py + (rnd(i, k + 85) - 0.5) * 32, col = th.flower[(rnd(i, 98 + k) * th.flower.length) | 0]; x.globalAlpha = 0.95; x.strokeStyle = '#2f5a2a'; x.lineWidth = 1; x.beginPath(); x.moveTo(fx2, fy2 + 4); x.lineTo(fx2, fy2); x.stroke(); x.fillStyle = col; for (let q = 0; q < 5; q++) { x.beginPath(); x.arc(fx2 + Math.cos(q * 1.257) * 1.9, fy2 + Math.sin(q * 1.257) * 1.9 - 1, 1.35, 0, TAU); x.fill(); } x.fillStyle = '#ffd24a'; x.beginPath(); x.arc(fx2, fy2 - 1, 0.9, 0, TAU); x.fill(); } }
        if (rnd(i, 96) < 0.045) { const mx2 = px + (rnd(i, 140) - 0.5) * 24, my2 = py + (rnd(i, 141) - 0.5) * 24; x.globalAlpha = 1; x.fillStyle = '#e8dcc0'; x.fillRect(mx2 - 1, my2 - 3, 2, 4); x.fillStyle = th.flower[0] === '#ffb04a' ? '#c85a2a' : '#c8402e'; x.beginPath(); x.ellipse(mx2, my2 - 4, 4, 2.6, 0, Math.PI, TAU); x.fill(); x.fillStyle = '#fff'; x.fillRect(mx2 - 2, my2 - 5.5, 1, 1); x.fillRect(mx2 + 1, my2 - 5, 1, 1); }
        if (rnd(i, 95) < 0.07) { const sx2 = px + (rnd(i, 142) - 0.5) * 26, sy2 = py + (rnd(i, 143) - 0.5) * 26, rr = 3 + rnd(i, 144) * 3; x.globalAlpha = 0.5; x.drawImage(blob('6,6,16', 0.9), sx2 - rr * 1.3 + 2, sy2 - rr * 0.4 + 2, rr * 2.8, rr * 1.4); x.globalAlpha = 1; x.fillStyle = th.rock.face; x.beginPath(); x.ellipse(sx2, sy2, rr, rr * 0.72, 0, 0, TAU); x.fill(); x.fillStyle = th.rock.top; x.beginPath(); x.ellipse(sx2 - rr * 0.15, sy2 - rr * 0.2, rr * 0.8, rr * 0.5, 0, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.ellipse(sx2 - rr * 0.35, sy2 - rr * 0.35, rr * 0.3, rr * 0.16, 0, 0, TAU); x.fill(); }
        x.globalAlpha = 1;
      } else if (b === TT.DIRT || b === TT.FERTILE) {
        // tierra: surcos, piedritas con luz y sombra, hojas secas
        x.strokeStyle = 'rgba(40,24,12,0.22)'; x.lineWidth = 1.4; x.lineCap = 'round'; for (let k = 0; k < 2; k++) { const y0 = py + (rnd(i, k + 150) - 0.5) * 30; x.beginPath(); x.moveTo(px - 20, y0); x.quadraticCurveTo(px, y0 + (rnd(i, k + 152) - 0.5) * 9, px + 20, y0 + (rnd(i, k + 154) - 0.5) * 5); x.stroke(); }
        x.strokeStyle = 'rgba(255,236,200,0.10)'; x.lineWidth = 1; for (let k = 0; k < 2; k++) { const y0 = py + (rnd(i, k + 150) - 0.5) * 30 + 1.6; x.beginPath(); x.moveTo(px - 20, y0); x.quadraticCurveTo(px, y0 + (rnd(i, k + 152) - 0.5) * 9, px + 20, y0 + (rnd(i, k + 154) - 0.5) * 5); x.stroke(); }
        for (let k = 0; k < 4; k++) { const sx2 = px + (rnd(i, k) - 0.5) * 36, sy2 = py + (rnd(i, k + 5) - 0.5) * 36, rr = 1.3 + rnd(i, k + 9) * 2.6; x.fillStyle = 'rgba(20,12,8,0.4)'; x.beginPath(); x.ellipse(sx2 + 1, sy2 + 1, rr * 1.2, rr * 0.8, 0, 0, TAU); x.fill(); x.fillStyle = k % 2 ? mixH(th.dirt[0], '#d8ccb8', 0.45) : mixH(th.dirt[1], '#0c0806', 0.3); x.beginPath(); x.ellipse(sx2, sy2, rr, rr * 0.72, 0, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,245,225,0.4)'; x.beginPath(); x.ellipse(sx2 - rr * 0.3, sy2 - rr * 0.3, rr * 0.35, rr * 0.2, 0, 0, TAU); x.fill(); }
        if (b === TT.FERTILE) { x.strokeStyle = 'rgba(20,10,6,0.5)'; x.lineWidth = 2; for (let k = -1; k <= 1; k++) { x.beginPath(); x.moveTo(px - 16, py + k * 11); x.lineTo(px + 16, py + k * 11); x.stroke(); } x.fillStyle = '#7ec85a'; for (let k = 0; k < 3; k++) { x.beginPath(); x.ellipse(px - 10 + k * 10, py - 4 + (k % 2) * 9, 2.4, 1.2, k, 0, TAU); x.fill(); } }
      } else if (b === TT.DEEP || b === TT.SHALLOW) {
        // orilla irregular: lomitas de tierra que muerden el agua, espuma, piedritas y juncos
        const r0 = Math.floor(i / T.cols), c0 = i % T.cols;
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const cc = c0 + dc, rr = r0 + dr; if (cc < 0 || rr < 0 || cc >= T.cols || rr >= T.rows) continue; const j = rr * T.cols + cc, tj = type(j);
          if (tj === TT.DEEP || tj === TT.SHALLOW || tj === TT.ROCK || T.base[j] === TT.BRIDGE || T.base[i] === TT.BRIDGE) continue;
          const lp = (PAL[tj] || PAL[TT.GRASS])[0], ex = px + dc * CELL * 0.5, ey = py + dr * CELL * 0.5;
          for (let k = 0; k < 3; k++) {
            const al = (k - 1) * 13 + (rnd(i, 200 + k + dc * 3 + dr * 7) - 0.5) * 8, rad = 7 + rnd(i, 210 + k + dc + dr * 5) * 7, inw = rnd(i, 220 + k + dc * 2 + dr) * 7;
            const lx2 = ex + (dr ? al : -dc * inw), ly2 = ey + (dc ? al : -dr * inw);
            x.fillStyle = `rgb(${Math.round(lp[0] * 0.82)},${Math.round(lp[1] * 0.82)},${Math.round(lp[2] * 0.82)})`; x.beginPath(); x.ellipse(lx2, ly2, rad, rad * 0.75, 0, 0, TAU); x.fill();
            x.strokeStyle = 'rgba(220,240,255,0.35)'; x.lineWidth = 1.2; x.beginPath(); const fa = Math.atan2(-dr, -dc); x.ellipse(lx2, ly2, rad + 2, rad * 0.75 + 2, 0, fa - 1, fa + 1); x.stroke();
            if (rnd(i, 230 + k + dc + dr * 3) < 0.25) { x.fillStyle = '#8a8698'; x.beginPath(); x.ellipse(lx2 + (rnd(i, 240 + k) - 0.5) * 8, ly2 + 2, 3, 2, 0, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,255,255,0.3)'; x.fillRect(lx2 - 1 + (rnd(i, 240 + k) - 0.5) * 8, ly2 + 0.5, 2, 1); }
            if (th.tuft && rnd(i, 250 + k + dc * 5 + dr) < 0.3) { x.strokeStyle = '#3e6a2e'; x.lineWidth = 1.5; for (let q = -2; q <= 2; q++) { x.beginPath(); x.moveTo(lx2 + q * 2, ly2); x.quadraticCurveTo(lx2 + q * 3, ly2 - 8, lx2 + q * 4.2, ly2 - 15 - Math.abs(q)); x.stroke(); } x.fillStyle = '#6a4424'; x.beginPath(); x.ellipse(lx2 + 4.2, ly2 - 17, 1.5, 3.5, 0, 0, TAU); x.fill(); }
          }
        }
        // hondura: más oscuro hacia el centro del agua profunda
        if (b === TT.DEEP) { let deepN = 0; for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const cc = c0 + dc, rr = r0 + dr; if (cc >= 0 && rr >= 0 && cc < T.cols && rr < T.rows && T.base[rr * T.cols + cc] === TT.DEEP) deepN++; } if (deepN === 4) { x.globalAlpha = 0.25; x.drawImage(blob('4,10,30', 0.9), px - CELL, py - CELL, CELL * 2, CELL * 2); x.globalAlpha = 1; } }
      } else if (b === TT.STONE) {
        // losas: dos o tres por celda, cada una con su tono, bisel de luz arriba-izquierda y junta oscura
        const split = rnd(i, 160) < 0.5, cut = 0.38 + rnd(i, 161) * 0.24, x0 = px - CELL / 2, y0 = py - CELL / 2;
        const slabs = split ? [[x0, y0, CELL * cut, CELL], [x0 + CELL * cut, y0, CELL * (1 - cut), CELL * 0.5], [x0 + CELL * cut, y0 + CELL * 0.5, CELL * (1 - cut), CELL * 0.5]] : [[x0, y0, CELL, CELL * cut], [x0, y0 + CELL * cut, CELL * 0.55, CELL * (1 - cut)], [x0 + CELL * 0.55, y0 + CELL * cut, CELL * 0.45, CELL * (1 - cut)]];
        slabs.forEach(([sx2, sy2, w, h], k) => {
          const tone = rnd(i, 170 + k); x.fillStyle = tone < 0.5 ? `rgba(255,255,255,${0.03 + tone * 0.1})` : `rgba(0,0,20,${(tone - 0.5) * 0.22})`; rr2(x, sx2 + 1.2, sy2 + 1.2, w - 2.4, h - 2.4, 3); x.fill();
          x.strokeStyle = 'rgba(10,10,26,0.42)'; x.lineWidth = 1.6; rr2(x, sx2 + 0.8, sy2 + 0.8, w - 1.6, h - 1.6, 3); x.stroke();
          x.strokeStyle = 'rgba(255,255,255,0.16)'; x.lineWidth = 1.1; x.beginPath(); x.moveTo(sx2 + 2.4, sy2 + h - 4); x.lineTo(sx2 + 2.4, sy2 + 3.4); x.lineTo(sx2 + w - 4, sy2 + 2.4); x.stroke();
          if (rnd(i, 180 + k) < 0.22) { x.strokeStyle = 'rgba(10,10,26,0.4)'; x.lineWidth = 0.9; x.beginPath(); const cx2 = sx2 + w * (0.3 + rnd(i, 183 + k) * 0.4), cy2 = sy2 + h * 0.2; x.moveTo(cx2, cy2); x.lineTo(cx2 + 3, cy2 + h * 0.25); x.lineTo(cx2 - 2, cy2 + h * 0.5); x.stroke(); }
          if (rnd(i, 186 + k) < 0.2 && th.rock.moss) { x.globalAlpha = 0.7; x.drawImage(blob(hex(th.rock.moss).join(','), 0.8), sx2 - 4, sy2 + h - 7, 16, 10); x.globalAlpha = 1; }
        });
      }
    }
    // 3a. Mundo 2: el suelo del infierno con grietas que brillan, huesos y obsidiana; el del cielo con tréboles de luz
    if (th.sky === 'infierno') {
      const isG = (px, py) => { const i = Terrain.idx(T, px, py); return i >= 0 && (type(i) === TT.DIRT || type(i) === TT.STONE || type(i) === TT.GRASS); };
      for (let k = 0; k < Math.round(T.W * T.H / 26000); k++) {
        let px = rnd(k, 401) * T.W, py = rnd(k, 402) * T.H; if (!isG(px, py)) continue; let a = rnd(k, 403) * TAU; const pts = [[px, py]];
        for (let st = 0; st < 7 + rnd(k, 404) * 8; st++) { a += (rnd(k * 31 + st, 405) - 0.5) * 1.3; px += Math.cos(a) * 14; py += Math.sin(a) * 14; if (!isG(px, py)) break; pts.push([px, py]); if (rnd(k * 7 + st, 406) < 0.18) { const b = a + (rnd(st, k) < 0.5 ? 1 : -1) * 0.9; pts.push([px + Math.cos(b) * 16, py + Math.sin(b) * 16], [px, py]); } }
        if (pts.length < 3) continue; const path = () => { x.beginPath(); pts.forEach((p, n) => n ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); };
        x.lineCap = 'round'; x.lineJoin = 'round'; path(); x.strokeStyle = 'rgba(8,2,4,0.85)'; x.lineWidth = 4; x.stroke();
        x.save(); x.globalCompositeOperation = 'lighter'; path(); x.strokeStyle = 'rgba(255,80,20,0.35)'; x.lineWidth = 7; x.stroke(); path(); x.strokeStyle = 'rgba(255,170,60,0.9)'; x.lineWidth = 1.6; x.stroke(); x.restore();
      }
      for (let i = 0; i < T.n; i++) { const b = type(i); if (b !== TT.DIRT && b !== TT.STONE) continue; const px = Terrain.cx(T, i), py = Terrain.cy(T, i);
        if (rnd(i, 410) < 0.07) { const bx = px + (rnd(i, 411) - 0.5) * 24, by = py + (rnd(i, 412) - 0.5) * 24, a = rnd(i, 413) * 3; x.save(); x.translate(bx, by); x.rotate(a); x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(-7, 1.5, 15, 3); x.fillStyle = '#d8ccb4'; x.fillRect(-7, -1, 14, 2.4); for (const s2 of [-1, 1]) { x.beginPath(); x.arc(s2 * 7, -1.4, 2, 0, TAU); x.arc(s2 * 7, 1.4, 2, 0, TAU); x.fill(); } x.restore(); }
        else if (rnd(i, 414) < 0.035) { const bx = px + (rnd(i, 415) - 0.5) * 20, by = py + (rnd(i, 416) - 0.5) * 20; x.fillStyle = 'rgba(0,0,0,0.4)'; x.beginPath(); x.ellipse(bx + 1, by + 4, 8, 3, 0, 0, TAU); x.fill(); x.fillStyle = '#e2d8c2'; x.beginPath(); x.arc(bx, by - 1, 6, Math.PI, 0); x.lineTo(bx + 4.5, by + 3); x.lineTo(bx - 4.5, by + 3); x.closePath(); x.fill(); x.fillStyle = '#1a0a0c'; x.beginPath(); x.arc(bx - 2.2, by - 0.5, 1.5, 0, TAU); x.arc(bx + 2.2, by - 0.5, 1.5, 0, TAU); x.fill(); }
        else if (rnd(i, 417) < 0.06) { const bx = px + (rnd(i, 418) - 0.5) * 26, by = py + (rnd(i, 419) - 0.5) * 26, h = 6 + rnd(i, 420) * 9; x.fillStyle = 'rgba(0,0,0,0.4)'; x.beginPath(); x.ellipse(bx + 3, by + 1, 6, 2.4, 0, 0, TAU); x.fill(); x.fillStyle = '#1c1022'; x.beginPath(); x.moveTo(bx - 4, by); x.lineTo(bx - 1, by - h); x.lineTo(bx + 4, by); x.closePath(); x.fill(); x.fillStyle = 'rgba(200,120,255,0.55)'; x.beginPath(); x.moveTo(bx - 1, by - h); x.lineTo(bx - 2.6, by - 1); x.lineTo(bx - 1.2, by - 1); x.closePath(); x.fill(); } }
    } else if (th.sky === 'cielo') {
      for (let i = 0; i < T.n; i++) { if (type(i) !== TT.GRASS || rnd(i, 430) > 0.06) continue; const px = Terrain.cx(T, i) + (rnd(i, 431) - 0.5) * 24, py = Terrain.cy(T, i) + (rnd(i, 432) - 0.5) * 24;
        x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.5; x.drawImage(blob('255,236,170', 0.6), px - 10, py - 7, 20, 14); x.restore(); x.fillStyle = '#fff6d0'; for (let q = 0; q < 5; q++) { x.beginPath(); x.arc(px + Math.cos(q * 1.257) * 2.2, py + Math.sin(q * 1.257) * 2.2, 1.5, 0, TAU); x.fill(); } x.fillStyle = '#ffd25a'; x.beginPath(); x.arc(px, py, 1, 0, TAU); x.fill(); }
    }
    // 3b. bordes entre pasto y camino/piedra: el pasto se monta sobre el borde con una sombrita
    for (let i = 0; i < T.n; i++) {
      if (type(i) !== TT.GRASS) continue; const r0 = Math.floor(i / T.cols), c0 = i % T.cols, px = Terrain.cx(T, i), py = Terrain.cy(T, i);
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const cc = c0 + dc, rr = r0 + dr; if (cc < 0 || rr < 0 || cc >= T.cols || rr >= T.rows) continue; const tj = type(rr * T.cols + cc); if (tj !== TT.DIRT && tj !== TT.STONE) continue;
        for (let k = 0; k < 5; k++) { const al = (k - 2) * 9 + (rnd(i, 190 + k + dc * 3 + dr * 7) - 0.5) * 6, out = 14 + rnd(i, 196 + k + dc + dr * 2) * 12, gx = px + dc * out + (dr ? al : 0), gy = py + dr * out + (dc ? al : 0), h = 5 + rnd(i, 200 + k) * 6;
          x.globalAlpha = 0.3; x.drawImage(blob('8,12,10', 0.9), gx - 7, gy - 3, 14, 8); x.globalAlpha = 0.9; x.strokeStyle = th.tuft[(rnd(i, 205 + k) * th.tuft.length) | 0]; x.lineWidth = 1.2; x.beginPath(); for (let q = -2; q <= 2; q++) { x.moveTo(gx + q * 1.3, gy); x.quadraticCurveTo(gx + q * 2.2, gy - h * 0.6, gx + q * 3 + dc * 2, gy - h); } x.stroke(); }
      }
    }
    x.globalAlpha = 1;
    // 4. altares de las fuentes: piedra con espiral muisca
    for (const s of G.sources) {
      x.save(); x.translate(s.x, s.y);
      x.fillStyle = 'rgba(20,15,30,0.4)'; x.beginPath(); x.ellipse(0, 6, 46, 30, 0, 0, TAU); x.fill();
      x.fillStyle = '#9b97ab'; x.beginPath(); x.ellipse(0, 0, 42, 27, 0, 0, TAU); x.fill();
      x.fillStyle = '#b8b4c6'; x.beginPath(); x.ellipse(0, -2, 38, 23, 0, 0, TAU); x.fill();
      x.strokeStyle = 'rgba(70,60,90,0.6)'; x.lineWidth = 2; x.beginPath();
      for (let a = 0; a < 5.5 * Math.PI; a += 0.2) { const r = 3 + a * 1.75; x.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.62 - 2); } x.stroke();
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; x.fillStyle = 'rgba(70,60,90,0.5)'; x.fillRect(Math.cos(a) * 34 - 2, Math.sin(a) * 20 - 4, 4, 4); }
      x.restore();
    }
    // 5. rocas: peñascos facetados con cara de frente, luz de arriba a la izquierda, grietas y musgo
    const mixC = (a, b, f) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, k) => Math.round(v + (B[k] - v) * f)).join(',')})`; };
    for (let i = 0; i < T.n; i++) {
      if (T.base[i] !== TT.ROCK) continue;
      const px0 = Terrain.cx(T, i), py0 = Terrain.cy(T, i), up = Math.floor(i / T.cols) > 0 && T.base[i - T.cols] === TT.ROCK;
      const px = px0 + (rnd(i, 30) - 0.5) * 8, py = py0 + (rnd(i, 31) - 0.5) * 6 + (up ? 4 : 0), R = 21 + rnd(i, 32) * 7, h = 13 + rnd(i, 33) * 10 + (up ? 6 : 0), n = 8;
      const sg = x.createRadialGradient(px + 4, py + 12, 4, px + 4, py + 12, R * 1.5); sg.addColorStop(0, 'rgba(6,4,14,0.55)'); sg.addColorStop(1, 'rgba(6,4,14,0)'); x.fillStyle = sg; x.beginPath(); x.ellipse(px + 4, py + 12, R * 1.5, R * 0.75, 0, 0, TAU); x.fill(); x.save(); x.translate(px + R * 0.7, py + 10 + h * 0.25); x.rotate(0.45); x.globalAlpha = 0.5; x.drawImage(blob('6,4,16', 0.8), -R * 0.6, -R * 0.55, R * 2.4 + h, R * 1.1); x.restore();
      const V = []; for (let k = 0; k < n; k++) { const a = k / n * TAU + rnd(i, 40 + k) * 0.5, rr = R * (0.78 + rnd(i, 50 + k) * 0.32); V.push([px + Math.cos(a) * rr, py - h + Math.sin(a) * rr * 0.62, a]); }
      // caras de frente (las que miran hacia abajo)
      for (let k = 0; k < n; k++) { const A = V[k], B = V[(k + 1) % n], am = (A[2] + B[2]) / 2 + (B[2] < A[2] ? Math.PI : 0); if (Math.sin(am) < -0.15) continue; const f = 0.15 + 0.35 * Math.max(0, -Math.cos(am)); x.fillStyle = mixC(th.rock.face, '#05040a', 0.35 - f * 0.6); x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.lineTo(B[0] + (B[0] - px) * 0.08, B[1] + h); x.lineTo(A[0] + (A[0] - px) * 0.08, A[1] + h); x.closePath(); x.fill(); x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 1; x.stroke(); }
      // tapa en facetas
      const C = [px - R * 0.12 + (rnd(i, 34) - 0.5) * 6, py - h - R * 0.12];
      for (let k = 0; k < n; k++) { const A = V[k], B = V[(k + 1) % n], mx = (A[0] + B[0]) / 2 - C[0], my = (A[1] + B[1]) / 2 - C[1], l = hypot(mx, my) || 1, lit = clamp(0.5 + 0.5 * (-(mx / l) * 0.7 - (my / l) * 0.7) + (rnd(i, 60 + k) - 0.5) * 0.15, 0, 1); x.fillStyle = mixC(th.rock.face, th.rock.hi, 0.25 + lit * 0.65); x.beginPath(); x.moveTo(C[0], C[1]); x.lineTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.closePath(); x.fill(); x.strokeStyle = 'rgba(0,0,0,0.12)'; x.lineWidth = 0.8; x.stroke(); }
      // contorno y filo iluminado
      x.strokeStyle = 'rgba(8,6,16,0.55)'; x.lineWidth = 1.3; x.beginPath(); V.forEach((p, k) => k ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); x.stroke();
      x.strokeStyle = 'rgba(255,255,255,0.28)'; x.lineWidth = 1.2; x.beginPath(); for (let k = 0; k < n; k++) { const p = V[k]; if (Math.cos(p[2]) < 0.2 && Math.sin(p[2]) < 0.3) x.lineTo(p[0], p[1]); } x.stroke();
      // grieta y musgo
      if (rnd(i, 35) < 0.6) { x.strokeStyle = 'rgba(10,8,18,0.5)'; x.lineWidth = 1; x.beginPath(); x.moveTo(C[0] + 2, C[1] + 2); x.lineTo(C[0] + 7 + rnd(i, 36) * 6, C[1] + 6); x.lineTo(C[0] + 10, C[1] + 12 + rnd(i, 37) * 4); x.stroke(); }
      if (rnd(i, 5) < 0.65) { x.globalAlpha = 0.85; x.drawImage(blob(hex(th.rock.moss).join(','), 0.8), C[0] - 14 + rnd(i, 6) * 10, C[1] - 6, 22 + rnd(i, 7) * 10, 12); for (let k = 0; k < 6; k++) { x.fillStyle = k % 2 ? th.rock.moss : mixC(th.rock.moss, '#ffffff', 0.25); x.beginPath(); x.arc(C[0] - 8 + rnd(i, 70 + k) * 18, C[1] - 2 + rnd(i, 80 + k) * 7, 1.5 + rnd(i, 90 + k) * 1.5, 0, TAU); x.fill(); } x.globalAlpha = 1; }
    }
    cache[key] = c; c.S = S; return c;
  }
  /* ---------- lo que cambia en el suelo (cada cuadro) ---------- */
  function overlays(x, G, view, time) {
    const T = G.T, th = THEMES[G.A.theme] || THEMES.paramo;
    const c0 = Math.max(0, Math.floor(view.x0 / CELL) - 1), c1 = Math.min(T.cols - 1, Math.ceil(view.x1 / CELL) + 1), r0 = Math.max(0, Math.floor(view.y0 / CELL) - 1), r1 = Math.min(T.rows - 1, Math.ceil(view.y1 / CELL) + 1);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const i = r * T.cols + c, px = c * CELL + CELL / 2, py = r * CELL + CELL / 2, b = T.base[i];
      if ((b === TT.DEEP || b === TT.SHALLOW) && T.ice[i] <= 0) {
        const w = Math.sin(time * 1.3 + c * 0.9 + r * 1.7);
        if (w > 0.35) { x.strokeStyle = `rgba(210,240,255,${(w - 0.35) * 0.6})`; x.lineWidth = 1.5; x.beginPath(); x.moveTo(px - 10 + Math.sin(time + r) * 4, py + (rnd(i, 3) - 0.5) * 20); x.lineTo(px + 8 + Math.sin(time + r) * 4, py + (rnd(i, 3) - 0.5) * 20); x.stroke(); }
        // reflejo de luna que respira y cáusticas suaves
        const sh = Math.sin(time * 0.7 + c * 0.45 - r * 0.3) * Math.sin(time * 0.5 + r * 0.6 + c * 0.2);
        if (sh > 0.2) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = (sh - 0.2) * (b === TT.DEEP ? 0.35 : 0.25); x.drawImage(blob('120,190,255', 0.7), px - CELL * 1.1, py - CELL * 0.7, CELL * 2.2, CELL * 1.4); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
        if (b === TT.DEEP && rnd(i, 21) < 0.12) { const sp = (time * 0.35 + rnd(i, 22) * 7) % 1; x.globalAlpha = Math.sin(sp * Math.PI) * 0.55; x.fillStyle = '#e8f6ff'; x.beginPath(); x.ellipse(px + (rnd(i, 23) - 0.5) * 26, py + (rnd(i, 24) - 0.5) * 20, 3 + sp * 4, 1.2, 0, 0, TAU); x.fill(); x.globalAlpha = 1; }
      }
      if (b === TT.BRIDGE && th.bridge === 'light') {
        // puente de luz: lámina de luz dorada con borde de arcoíris (nace de los prismas), ondas que la recorren y destellos
        const isB = j => j >= 0 && j < T.base.length && T.base[j] === TT.BRIDGE, U = r > 0 && isB(i - T.cols), D = r < T.rows - 1 && isB(i + T.cols), Lf = c > 0 && isB(i - 1), Rt = c < T.cols - 1 && isB(i + 1), h = CELL / 2, x0 = px - h, y0 = py - h;
        x.save();
        // cortina de luz que cae al vacío bajo el borde
        if (!D) { const cg = x.createLinearGradient(0, py + h, 0, py + h + 60); cg.addColorStop(0, 'rgba(255,224,130,0.5)'); cg.addColorStop(1, 'rgba(255,224,130,0)'); x.fillStyle = cg; x.fillRect(x0, py + h, CELL, 60); }
        // cuerpo de vidrio dorado: más denso en los bordes, más claro en el centro
        const bg = x.createLinearGradient(0, y0, 0, y0 + CELL); bg.addColorStop(0, U ? 'rgba(255,228,140,0.5)' : 'rgba(250,196,84,0.8)'); bg.addColorStop(U ? 0.5 : 0.34, 'rgba(255,232,150,0.5)'); bg.addColorStop(D ? 0.5 : 0.66, 'rgba(255,232,150,0.5)'); bg.addColorStop(1, D ? 'rgba(255,228,140,0.5)' : 'rgba(244,184,76,0.8)'); x.fillStyle = bg; x.fillRect(x0, y0, CELL, CELL);
        // ondas de luz que recorren el puente (continuas entre losas)
        for (let q = 0; q < 4; q++) { const wx = x0 + q * 10, wv = Math.pow(Math.max(0, Math.sin(wx * 0.022 - time * 2.2)), 6) + 0.5 * Math.pow(Math.max(0, Math.sin(wx * 0.05 + time * 1.3 + r)), 8); if (wv > 0.02) { x.fillStyle = `rgba(255,255,240,${Math.min(0.6, wv * 0.5)})`; x.fillRect(wx, y0, 10, CELL); } }
        // celosía de rombos
        x.strokeStyle = 'rgba(255,255,255,0.6)'; x.lineWidth = 1; x.beginPath(); x.moveTo(px - h, py); x.lineTo(px, py - h); x.lineTo(px + h, py); x.lineTo(px, py + h); x.closePath(); x.stroke();
        x.strokeStyle = 'rgba(214,150,50,0.4)'; x.beginPath(); x.moveTo(px - h, py + 1.2); x.lineTo(px, py - h + 1.2); x.lineTo(px + h, py + 1.2); x.moveTo(px - h, py + 1.2); x.lineTo(px, py + h + 1.2); x.lineTo(px + h, py + 1.2); x.stroke();
        // barandas: filo blanco, cordón de oro y tres hilos de color (la luz salió de los prismas)
        for (const [edge, sgn] of [[!U, 1], [!D, -1]]) if (edge) { const ey = sgn > 0 ? y0 : y0 + CELL; x.fillStyle = '#fffdf0'; x.fillRect(x0, sgn > 0 ? ey : ey - 2.4, CELL, 2.4); x.fillStyle = 'rgba(206,140,40,0.9)'; x.fillRect(x0, sgn > 0 ? ey + 2.4 : ey - 3.6, CELL, 1.2); let k = 0; for (const col of ['255,96,120', '120,230,150', '90,170,255']) { x.fillStyle = `rgba(${col},${0.62 + 0.2 * Math.sin(time * 2 + px * 0.03 + k)})`; x.fillRect(x0, sgn > 0 ? ey + 5 + k * 2.6 : ey - 6.8 - k * 2.6, CELL, 1.8); k++; } }
        // remates donde el puente toca tierra
        x.globalCompositeOperation = 'lighter';
        for (const [edge, ex] of [[!Lf, x0], [!Rt, x0 + CELL]]) if (edge) { const eg = x.createRadialGradient(ex, py, 0, ex, py, 24); eg.addColorStop(0, 'rgba(255,240,190,0.4)'); eg.addColorStop(1, 'rgba(255,240,190,0)'); x.fillStyle = eg; x.fillRect(ex - 24, y0 - 4, 48, CELL + 8); }
        // destellos de cuatro puntas
        const tw = Math.sin(time * 2.4 + rnd(i, 71) * 20); if (tw > 0.55) { const sx = px + (rnd(i, 72) - 0.5) * 26, sy = py + (rnd(i, 73) - 0.5) * 26, sr = (tw - 0.55) * 18; x.fillStyle = 'rgba(255,255,255,0.95)'; x.beginPath(); x.moveTo(sx, sy - sr); x.quadraticCurveTo(sx, sy, sx + sr, sy); x.quadraticCurveTo(sx, sy, sx, sy + sr); x.quadraticCurveTo(sx, sy, sx - sr, sy); x.quadraticCurveTo(sx, sy, sx, sy - sr); x.fill(); }
        x.restore();
      } else if (b === TT.BRIDGE && th.bridge === 'bone') {
        x.fillStyle = '#1c1216'; x.fillRect(px - CELL / 2, py - CELL / 2 + 3, CELL, CELL - 6);
        for (let k = 0; k < 4; k++) { const bx = px - CELL / 2 + k * 10 + 1; x.fillStyle = k % 2 ? '#d8ccb4' : '#c4b89e'; rr2(x, bx, py - CELL / 2 + 2, 8, CELL - 4, 3); x.fill(); x.fillStyle = 'rgba(60,40,30,0.35)'; x.fillRect(bx + 5.5, py - CELL / 2 + 5, 1.5, CELL - 10); x.fillStyle = '#efe6d2'; x.beginPath(); x.arc(bx + 4, py - CELL / 2 + 3, 4.2, 0, TAU); x.arc(bx + 4, py + CELL / 2 - 3, 4.2, 0, TAU); x.fill(); }
      } else if (b === TT.BRIDGE) {
        x.fillStyle = '#3a2614'; x.fillRect(px - CELL / 2, py - CELL / 2 + 2, CELL, CELL - 4);
        for (let k = 0; k < 4; k++) { x.fillStyle = k % 2 ? '#8a5e36' : '#9a6a3e'; x.fillRect(px - CELL / 2 + k * 10 + 0.5, py - CELL / 2 + 3, 9, CELL - 6); }
      }
      if (T.ash[i] > 0 && b !== TT.BUSH) {
        const a = Math.min(0.75, T.ash[i] / 6); x.globalAlpha = a; x.drawImage(blob('30,22,24'), px - CELL * 0.95 + (rnd(i, 50) - 0.5) * 10, py - CELL * 0.8, CELL * 1.9, CELL * 1.6); x.globalAlpha = 1;
        if (T.ash[i] > 16 && T.ash[i] < 900) { x.fillStyle = `rgba(255,120,40,${(T.ash[i] - 16) / 6 * (0.5 + 0.5 * Math.sin(time * 6 + i))})`; x.fillRect(px + (rnd(i, 60) - 0.5) * 26, py + (rnd(i, 61) - 0.5) * 22, 2, 2); x.fillRect(px + (rnd(i, 62) - 0.5) * 26, py + (rnd(i, 63) - 0.5) * 22, 2, 2); }
        if (T.ash[i] > 900) { x.fillStyle = '#2a2420'; x.beginPath(); x.ellipse(px, py, 7, 4, 0, 0, TAU); x.fill(); }
      }
      if (b === TT.LAVA && T.cool[i] > 0) { x.globalAlpha = Math.min(1, T.cool[i] / 1); x.drawImage(blob('40,34,46', 0.95), px - CELL, py - CELL, CELL * 2, CELL * 2); x.globalAlpha = 1; if (rnd(i, 4) < 0.5) { x.strokeStyle = 'rgba(255,120,40,0.45)'; x.lineWidth = 1; x.beginPath(); x.moveTo(px - 10, py - 4); x.lineTo(px + 2, py + 3); x.lineTo(px + 12, py - 6); x.stroke(); } }
      if (b === TT.LAVA && T.cool[i] <= 0) lavaCell(x, i, px, py, time, 1);
      if (T.lava[i] > 0) { const a = Math.min(1, T.lava[i] / 0.8); x.globalAlpha = a; x.drawImage(blob('190,45,18', 0.95), px - CELL * 1.05, py - CELL * 1.05, CELL * 2.1, CELL * 2.1); x.globalAlpha = 1; lavaCell(x, i, px, py, time, a); }
      if (T.mud[i] > 0) {
        const a = Math.min(0.95, T.mud[i] / 0.6); x.globalAlpha = a; x.drawImage(blob('86,58,34', 0.9), px - CELL, py - CELL * 0.9, CELL * 2, CELL * 1.8); x.globalAlpha = 1;
        x.fillStyle = `rgba(150,110,70,${a * 0.7})`; const bb = (time * 0.8 + rnd(i, 6) * 5) % 1; if (rnd(i, 9) < 0.5) { x.beginPath(); x.arc(px + (rnd(i, 7) - 0.5) * 20, py + (rnd(i, 8) - 0.5) * 20, 1.5 + bb * 3, 0, TAU); x.fill(); }
      }
      if (T.wet[i] > 0 && b !== TT.DEEP && b !== TT.SHALLOW) {
        const a = Math.min(0.85, T.wet[i] / 4); x.globalAlpha = a; x.drawImage(blob('60,130,200', 0.75), px - CELL * 0.95, py - CELL * 0.75, CELL * 1.9, CELL * 1.5); x.globalAlpha = 1;
        if (rnd(i, 9) < 0.35) { const sh = 0.5 + 0.5 * Math.sin(time * 1.5 + i); x.strokeStyle = `rgba(220,240,255,${a * 0.5 * sh})`; x.lineWidth = 1.4; x.beginPath(); x.moveTo(px - 8, py - 3); x.lineTo(px + 6, py - 5); x.stroke(); }
      }
      if (T.ice[i] > 0) {
        const a = Math.min(0.95, T.ice[i] / 1.5); x.globalAlpha = a; x.drawImage(blob('205,240,255', 0.9), px - CELL, py - CELL * 0.9, CELL * 2, CELL * 1.8); x.globalAlpha = 1;
        if (rnd(i, 5) < 0.5) { x.strokeStyle = `rgba(255,255,255,${a * 0.6})`; x.lineWidth = 1; x.beginPath(); x.moveTo(px - 12 + rnd(i, 1) * 6, py - 10); x.lineTo(px + 2, py + 2); x.lineTo(px + 12, py - 4); x.stroke(); }
        const g = (time * 0.6 + rnd(i, 2) * 3) % 3; if (g < 0.3) { x.fillStyle = `rgba(255,255,255,${(0.3 - g) * 3})`; x.fillRect(px + (rnd(i, 3) - 0.5) * 24, py + (rnd(i, 4) - 0.5) * 24, 3, 3); }
      }
      if (T.vine[i] > 0) {
        const a = Math.min(1, T.vine[i] / 0.5), own = T.vineO[i] >= 0 && PLAYER_COLORS[T.vineO[i]] ? PLAYER_COLORS[T.vineO[i]].main : '#9fe07a';
        x.globalAlpha = a; x.strokeStyle = '#2e5e2a'; x.lineWidth = 4; x.beginPath();
        for (let k = 0; k < 3; k++) { const y = py + (k - 1) * 11 + (rnd(i, k) - 0.5) * 6; x.moveTo(px - CELL / 2, y); x.bezierCurveTo(px - 8, y - 8, px + 8, y + 8, px + CELL / 2, y); } x.stroke();
        x.strokeStyle = '#4f9a3c'; x.lineWidth = 2; x.stroke();
        x.fillStyle = '#d9f0b0'; for (let k = 0; k < 5; k++) { const tx = px + (rnd(i, k + 10) - 0.5) * 34, ty = py + (rnd(i, k + 15) - 0.5) * 30; x.beginPath(); x.moveTo(tx, ty - 4); x.lineTo(tx + 2, ty + 1); x.lineTo(tx - 2, ty + 1); x.fill(); }
        x.fillStyle = own; for (let k = 0; k < 2; k++) { x.beginPath(); x.ellipse(px + (rnd(i, k + 30) - 0.5) * 26, py + (rnd(i, k + 33) - 0.5) * 26, 4, 2.2, rnd(i, k) * 3, 0, TAU); x.fill(); }
        x.globalAlpha = 1;
      }
      if (T.elec[i] > 0) {
        const a = Math.min(1, T.elec[i] / 0.4);
        x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = a * (0.2 + 0.08 * Math.sin(time * 9 + i)); x.drawImage(blob('150,110,255'), px - CELL, py - CELL * 0.8, CELL * 2, CELL * 1.6);
        if (Math.random() < 0.45) { x.globalAlpha = a; x.strokeStyle = 'rgba(225,205,255,0.95)'; x.lineWidth = 1.3; x.beginPath(); let lx = px + (Math.random() - 0.5) * 30, ly = py + (Math.random() - 0.5) * 24; x.moveTo(lx, ly); const ang = Math.random() * TAU; for (let k = 1; k <= 4; k++) { lx += Math.cos(ang) * 9 + (Math.random() - 0.5) * 10; ly += Math.sin(ang) * 6 + (Math.random() - 0.5) * 10; x.lineTo(lx, ly); } x.stroke(); }
        x.restore();
      }
    }
  }
  /* ---------- lo alto: frailejones, muros, llamas (para ordenar con los magos) ---------- */
  function tallItems(G, view, list) {
    const T = G.T;
    const c0 = Math.max(0, Math.floor(view.x0 / CELL) - 1), c1 = Math.min(T.cols - 1, Math.ceil(view.x1 / CELL) + 1), r0 = Math.max(0, Math.floor(view.y0 / CELL) - 1), r1 = Math.min(T.rows - 1, Math.ceil(view.y1 / CELL) + 3);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const i = r * T.cols + c;
      if (T.base[i] === TT.BUSH) { const th = THEMES[G.A.theme] || THEMES.paramo; list.push({ y: r * CELL + CELL * 0.7, draw: x => (th.tree === 'jungle' ? jungle(x, G, i) : th.tree === 'bush' ? shrub(x, G, i) : th.tree === 'gold' || th.tree === 'dead' ? ArtBeast.tree(x, G, i, th.tree) : frailejon(x, G, i)) }); }
      if (T.wall[i] > 0) list.push({ y: r * CELL + CELL - 2, draw: x => wall(x, G, i) });
      if (T.fire[i] > 0) list.push({ y: r * CELL + CELL * 0.62, draw: x => flames(x, G, i) });
    }
  }
  function frailejon(x, G, i) {
    const T = G.T, px = Terrain.cx(T, i), py = Terrain.cy(T, i) + 8, burn = T.fire[i] > 0, s = 0.85 + rnd(i, 1) * 0.35, sway = Math.sin(G.time * 1.2 + i) * 1.5;
    x.save(); x.translate(px, py); x.scale(s, s);
    x.fillStyle = 'rgba(10,8,20,0.35)'; x.beginPath(); x.ellipse(2, 2, 16, 6, 0, 0, TAU); x.fill();
    // tronco peludo
    x.fillStyle = burn ? '#2a2018' : '#5d4a3a'; x.beginPath(); x.moveTo(-7, 0); x.quadraticCurveTo(-9, -22, -6, -40); x.lineTo(6, -40); x.quadraticCurveTo(9, -22, 7, 0); x.fill();
    x.strokeStyle = burn ? '#3a2a20' : '#7a644e'; x.lineWidth = 1.2; for (let k = 0; k < 7; k++) { x.beginPath(); x.moveTo(-7, -4 - k * 5); x.lineTo(7, -7 - k * 5); x.stroke(); }
    // roseta de hojas plateadas
    x.translate(sway, -42);
    const n = 13; for (let k = 0; k < n; k++) {
      const a = -Math.PI / 2 + (k / (n - 1) - 0.5) * 3.6, L = 16 + (k % 3) * 3;
      x.save(); x.rotate(a + Math.PI / 2); x.fillStyle = burn ? '#4a3a2a' : k % 2 ? '#a9b892' : '#c3cfac';
      x.beginPath(); x.ellipse(0, -L / 2, 4, L / 2, 0, 0, TAU); x.fill(); x.restore();
    }
    x.fillStyle = burn ? '#5a3a20' : '#dfe6c8'; x.beginPath(); x.arc(0, 0, 5, 0, TAU); x.fill();
    if (!burn && rnd(i, 4) < 0.5) { x.fillStyle = '#f2d84a'; for (let k = 0; k < 3; k++) { x.beginPath(); x.arc((k - 1) * 6, -14 - (k % 2) * 4, 2.6, 0, TAU); x.fill(); } }
    x.restore();
  }
  function jungle(x, G, i) {
    const T = G.T, px = Terrain.cx(T, i), py = Terrain.cy(T, i) + 10, burn = T.fire[i] > 0, s = 0.9 + rnd(i, 1) * 0.4, sway = Math.sin(G.time * 1.1 + i) * 2;
    x.save(); x.translate(px, py); x.scale(s, s);
    x.fillStyle = 'rgba(10,8,20,0.35)'; x.beginPath(); x.ellipse(4, 2, 22, 8, 0, 0, TAU); x.fill();
    x.strokeStyle = burn ? '#2a2018' : '#6a5038'; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(6, -30, sway, -58); x.stroke();
    x.strokeStyle = burn ? '#3a2a20' : '#8a6a48'; x.lineWidth = 1.5; for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(-3 + k * 0.6, -6 - k * 9); x.lineTo(4 + k * 0.6, -8 - k * 9); x.stroke(); }
    x.translate(sway, -60);
    for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k / 6 - 0.5) * 4.2; x.save(); x.rotate(a + Math.PI / 2); x.fillStyle = burn ? '#4a3a2a' : k % 2 ? '#2f7a3a' : '#3f9a48'; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(-9, -16, 0, -34 - (k % 2) * 6); x.quadraticCurveTo(9, -16, 0, 0); x.fill(); x.restore(); }
    if (!burn) { x.fillStyle = '#ffcf4a'; x.beginPath(); x.arc(-4, 4, 3, 0, TAU); x.arc(3, 5, 3, 0, TAU); x.fill(); }
    x.restore();
  }
  function shrub(x, G, i) {
    const T = G.T, px = Terrain.cx(T, i), py = Terrain.cy(T, i) + 10, burn = T.fire[i] > 0, s = 0.9 + rnd(i, 1) * 0.35;
    x.save(); x.translate(px, py); x.scale(s, s);
    x.fillStyle = 'rgba(10,8,20,0.35)'; x.beginPath(); x.ellipse(2, 2, 22, 8, 0, 0, TAU); x.fill();
    for (const [ox, oy, r, c] of [[-10, -14, 13, 0], [10, -14, 13, 1], [0, -26, 15, 2], [0, -12, 12, 3]]) { x.fillStyle = burn ? ['#3a2a20', '#4a3424', '#3a2a20', '#2a2018'][c] : ['#2f6a34', '#3a7a3e', '#4a8a48', '#2a5e30'][c]; x.beginPath(); x.arc(ox, oy, r, 0, TAU); x.fill(); }
    if (!burn) { x.fillStyle = '#ff8fb0'; for (let k = 0; k < 4; k++) { x.beginPath(); x.arc(-12 + k * 8, -20 - (k % 2) * 10, 2.4, 0, TAU); x.fill(); } }
    x.restore();
  }
  // guardián de piedra de la Ciudad Perdida
  function statue(x, G, s) {
    const g = s.glow;
    x.save(); x.translate(s.x, s.y + 16);
    x.fillStyle = 'rgba(10,8,20,0.4)'; x.beginPath(); x.ellipse(0, 2, 26, 9, 0, 0, TAU); x.fill();
    x.fillStyle = '#6e6a5e'; x.fillRect(-20, -14, 40, 16); x.fillStyle = '#8a8676'; x.beginPath(); x.moveTo(-17, -14); x.lineTo(-15, -62); x.lineTo(15, -62); x.lineTo(17, -14); x.fill();
    x.fillStyle = '#9a9684'; x.beginPath(); x.ellipse(0, -66, 19, 13, 0, 0, TAU); x.fill();
    x.fillStyle = '#5a564a'; x.fillRect(-12, -70, 24, 3); x.fillRect(-9, -56, 18, 3);
    for (const ex of [-7, 7]) { x.fillStyle = g > 0.1 ? `rgba(255,${180 - g * 60},80,${0.4 + g * 0.6})` : '#4a463c'; x.beginPath(); x.arc(ex, -64, 3.5, 0, TAU); x.fill(); }
    x.strokeStyle = '#5a564a'; x.lineWidth = 2; x.beginPath(); x.moveTo(-12, -40); x.quadraticCurveTo(0, -32, 12, -40); x.stroke();
    x.restore();
    if (g > 0.05) ArtSpells.glow(x, s.x, s.y - 50, 50, `rgba(255,170,80,${g * 0.6})`);
  }
  function wall(x, G, i) {
    if (G.T.crys[i]) return ArtSpells2.crystal(x, G, i);
    const T = G.T, px = Terrain.cx(T, i), py = Terrain.cy(T, i), a = Math.min(1, T.wallT[i] / 0.4), hp = T.wall[i], h = 44 * Math.min(1, (6 - Math.max(0, T.wallT[i] - 0)) > 0 ? 1 : 1);
    x.save(); x.globalAlpha = a;
    x.fillStyle = 'rgba(10,8,20,0.35)'; x.fillRect(px - 20, py + 10, 42, 10);
    x.fillStyle = '#6b5640'; x.beginPath(); x.moveTo(px - 20, py - 4); x.lineTo(px + 20, py - 4); x.lineTo(px + 19, py + 18); x.lineTo(px - 19, py + 18); x.fill();
    x.fillStyle = '#a07e58'; x.beginPath(); x.moveTo(px - 20, py - 4); x.lineTo(px - 14, py - h + 14); x.lineTo(px + 15, py - h + 12); x.lineTo(px + 20, py - 4); x.fill();
    x.fillStyle = '#c49c6c'; x.beginPath(); x.ellipse(px, py - h + 14, 15, 5, 0, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(60,40,20,0.6)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(px - 8, py - 20); x.lineTo(px - 2, py - 8); x.lineTo(px - 6, py + 4); if (hp < 25) { x.moveTo(px + 6, py - 26); x.lineTo(px + 10, py - 10); x.lineTo(px + 4, py + 2); } x.stroke();
    x.restore();
  }
  function flames(x, G, i) {
    const T = G.T, px = Terrain.cx(T, i), py = Terrain.cy(T, i) + 10, t = G.time, big = T.base[i] === TT.BUSH ? 1.6 : 1, a = Math.min(1, T.fire[i] / 0.4);
    x.save(); x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a * 0.28; x.drawImage(blob('255,110,30', 0.8), px - 26 * big, py - 18 * big, 52 * big, 30 * big);
    // lenguas exteriores (rojo-naranja) y núcleo (amarillo-blanco), cada una ondulando
    for (let layer = 0; layer < 2; layer++) for (let k = 0; k < 3; k++) {
      const core = layer === 1, ph = t * (8 + k) + i * 1.7 + k * 2.1, ox = (k - 1) * (core ? 7 : 11) * big + Math.sin(ph * 0.7) * 2;
      const h = (core ? 12 + 6 * Math.sin(ph) : 20 + 10 * Math.sin(ph * 1.1)) * big * (k === 1 ? 1.25 : 0.9), w = (core ? 4.5 : 8) * big, tip = Math.sin(ph * 1.6) * 5 * big;
      const g = x.createLinearGradient(0, py, 0, py - h);
      if (core) { g.addColorStop(0, 'rgba(255,250,210,0.55)'); g.addColorStop(0.6, 'rgba(255,215,110,0.3)'); g.addColorStop(1, 'rgba(255,200,80,0)'); }
      else { g.addColorStop(0, 'rgba(255,90,25,0.5)'); g.addColorStop(0.55, 'rgba(230,100,35,0.3)'); g.addColorStop(1, 'rgba(180,40,20,0)'); }
      x.globalAlpha = a; x.fillStyle = g; x.beginPath(); x.moveTo(px + ox - w, py);
      x.bezierCurveTo(px + ox - w * 1.1, py - h * 0.35, px + ox - w * 0.2 + tip * 0.5, py - h * 0.6, px + ox + tip, py - h);
      x.bezierCurveTo(px + ox + w * 0.3 + tip * 0.5, py - h * 0.6, px + ox + w * 1.1, py - h * 0.35, px + ox + w, py); x.fill();
    }
    x.restore();
    if (Math.random() < 0.05 * big) FX.P({ x: px + (Math.random() - 0.5) * 20, y: py - 2, z: 14, vx: (Math.random() - 0.5) * 30, vy: 0, vz: 50 + Math.random() * 60, g: -20, life: 0.6 + Math.random() * 0.6, size: 1.5 + Math.random() * 1.5, color: '#ffb050', kind: 'ember' });
    if (Math.random() < 0.025 * big) FX.P({ x: px, y: py - 4, z: 26 * big, vx: (Math.random() - 0.5) * 16, vy: 0, vz: 30, g: -10, drag: 1, life: 1 + Math.random() * 0.6, size: 9 + Math.random() * 6, color: 'rgba(40,32,36,0.45)', kind: 'smoke', add: false });
  }
  return { prerender, overlays, tallItems, cache, statue, blob };
})();
