/* =========================================================================
   ARTE DE MEDELLÍN DE NOCHE — el valle lleno de luces.
   Fondo: cielo de noche con estrellas y luna, el resplandor naranja de la
   ciudad en el horizonte, montañas cubiertas de lucecitas (las comunas),
   dos capas de edificios lejanos, reflectores y un avión que pasa.
   Escenario: laderas de casitas de ladrillo y colores, la calle con
   faroles de sodio, el río con reflejos, el viaducto del metro con su tren,
   los rascacielos (ventanas encendidas, vidrios rotos, letreros de neón,
   luces rojas de aviso) y el metrocable con sus cabinas.
   ========================================================================= */
THEMES.medellin = {
  city: true,
  sky: [[0, '#04061a'], [0.32, '#0f1240'], [0.58, '#272059'], [0.76, '#4f2f63'], [0.9, '#8c465d'], [1, '#c96e4f']],
  horizon: '#5a3a66',
  layers: [
    { p: 0.05, base: 1520, amp: 540, freq: 0.0009, color: '#1e2050', seed: 5, lights: 0.4, haze: 0.5, rows: 20 },
    { p: 0.12, base: 1630, amp: 430, freq: 0.0014, color: '#191a44', seed: 17, lights: 0.55, haze: 0.36, rows: 24 },
    { p: 0.21, base: 1760, amp: 330, freq: 0.0021, color: '#14153a', seed: 29, lights: 0.65, haze: 0.24, rows: 26 },
  ],
  skyline: [{ p: 0.34, base: 2000, color: '#16173a', lit: 0.16, seed: 3 }, { p: 0.52, base: 2030, color: '#10112c', lit: 0.22, seed: 9 }],
  fog: '150,90,150', glow: '255,140,80',
  ground: ['#1b1b2e', '#121222', '#0a0a16'], hill: ['#2a1c2a', '#1a1220', '#0e0a14'],
  mote: '255,210,160',
  houses: [[-40, 470], [3330, 3900]], lamps: [500, 3300],
};
THEMES.bogota = {
  city: true, storm: true, stars: false, moon: false, searchlights: false,
  sky: [[0, '#0a0e18'], [0.32, '#171f2e'], [0.58, '#283042'], [0.78, '#3a3e4e'], [0.92, '#56525c'], [1, '#76665f']],
  horizon: '#3a4050',
  layers: [
    { p: 0.06, base: 1500, amp: 760, freq: 0.0006, color: '#1a2330', seed: 7, lights: 0.06, haze: 0.5, rows: 12 },
    { p: 0.13, base: 1680, amp: 360, freq: 0.0012, color: '#161e2a', seed: 19, lights: 0.22, haze: 0.38, rows: 18 },
    { p: 0.21, base: 1820, amp: 120, freq: 0.002, color: '#121823', seed: 31, lights: 0.55, haze: 0.26, rows: 24 },
  ],
  skyline: [{ p: 0.34, base: 2000, color: '#151b27', lit: 0.13, seed: 4 }, { p: 0.52, base: 2030, color: '#10151f', lit: 0.19, seed: 12 }],
  fog: '120,132,155', glow: '255,170,110',
  ground: ['#1b1d26', '#13141c', '#0a0b12'], hill: ['#1d2626', '#141c1c', '#0b1111'],
  mote: '200,210,230',
  houses: [[-40, 380]], forest: [2620, 3900], church: 3640, lamps: [420, 2600],
};
THEMES.cartagena = {
  city: true, moon: false, searchlights: false, sun: true, starA: 0.45, cloudA: 0.26,
  sky: [[0, '#1d1d58'], [0.26, '#45337e'], [0.48, '#9a4c8c'], [0.66, '#e56f6a'], [0.82, '#ffa456'], [1, '#ffd68a']],
  horizon: '#e98a72',
  layers: [
    { p: 0.06, base: 1690, amp: 120, freq: 0.0012, color: '#7d4f86', seed: 3, lights: 0.03, haze: 0.62, rows: 6 },
    { p: 0.14, base: 1790, amp: 70, freq: 0.002, color: '#62406e', seed: 13, lights: 0.1, haze: 0.48, rows: 8 },
  ],
  // Bocagrande (torres al otro lado de la bahía, a la izquierda) y techos bajos de la ciudad vieja
  skyline: [{ p: 0.3, base: 1995, color: '#4e3466', lit: 0.1, seed: 6, x0: -2600, x1: -520 }, { p: 0.5, base: 2035, color: '#3c2850', lit: 0.12, seed: 14, x0: 380, x1: 7500, low: true }],
  popa: { lx: 2250, p: 0.2 },
  fog: '255,150,140', glow: '255,150,90',
  ground: ['#5a3c34', '#3e2826', '#24161a'], hill: ['#6c4a3e', '#4a302a', '#2a1a1c'],
  mote: '255,220,180',
  houses: [], lamps: [1460, 3100],
  sea: ['#7c5a9c', '#3a2c6c', '#1c1640'],
};

const ArtCity = (() => {
  const SKY_REF = 1500;
  const cache = {};
  const h1 = (a, b = 0) => hash1(a * 12.9898 + b * 78.233);

  /* ---------- datos que se calculan una sola vez ---------- */
  function prep(T, id) {
    if (cache[id]) return cache[id];
    const r = makeRng(77);
    const stars = Array.from({ length: 170 }, () => ({ x: r(), y: Math.pow(r(), 1.6) * 0.62, s: 0.6 + r() * 1.5, ph: r() * TAU, sp: 0.6 + r() * 2.2 }));
    // lucecitas de las montañas: en coordenadas de cada capa, más densas abajo
    const layerPts = T.layers.map(L => {
      const pts = [], step = 21, hAt = lx => L.base - L.amp * (0.25 + 0.75 * fbm1(lx * L.freq + L.seed * 9.7, 4));
      for (let lx = -4000; lx < 7000; lx += step) {
        const top = hAt(lx);
        for (let j = 0; j < L.rows; j++) {
          const ly = top + 14 + j * 15 + (h1(lx, j) - 0.5) * 8;
          const dens = L.lights * Math.min(1, 0.45 + j / 6) * (0.6 + 0.4 * Math.sin(lx * 0.0031 + L.seed));
          if (h1(lx * 0.7 + L.seed, j * 1.3) < dens) pts.push(lx + (h1(j, lx) - 0.5) * 12, ly, h1(lx + 3, j + 5) < 0.18 ? 2 : h1(lx, j + 9) < 0.5 ? 1 : 0);
        }
      }
      return pts;
    });
    // edificios lejanos
    const skylines = T.skyline.map(S => {
      const r2 = makeRng(100 + S.seed), list = [];
      for (let lx = S.x0 != null ? S.x0 : -4000; lx < (S.x1 != null ? S.x1 : 7500);) {
        const w = S.low ? 40 + r2() * 90 : 46 + r2() * 110, h = S.low ? 50 + Math.pow(r2(), 1.4) * 120 : 110 + Math.pow(r2(), 1.7) * 520, gap = r2() < 0.3 ? r2() * 40 : 0;
        const wins = [];
        for (let y = 16; y < h - 10; y += 17) for (let x = 7; x < w - 9; x += 13) if (r2() < S.lit) wins.push(x, y, r2() < 0.2 ? 1 : 0);
        list.push({ x: lx, w, h, wins, red: h > 420 && r2() < 0.6, ph: r2() * 6, dome: S.low && r2() < 0.12 });
        lx += w + gap;
      }
      return list;
    });
    return (cache[id] = { stars, layerPts, skylines });
  }

  /* ---------- fondo ---------- */
  function drawBackground(ctx, G, cam, sw, sh) {
    const id = G.world.id, T = THEMES[id], t = G.time, C = prep(T, id), { stars, layerPts, skylines } = C;
    const lift = clamp((SKY_REF - cam.y) / 2600, -0.15, 0.35);
    const g = ctx.createLinearGradient(0, -sh * lift, 0, sh * (1 - lift * 0.6));
    for (const [o, c] of T.sky) g.addColorStop(o, c);
    ctx.fillStyle = g; ctx.fillRect(0, 0, sw, sh);
    // estrellas (titilan; se borran hacia el horizonte por el resplandor de la ciudad)
    const off = -cam.x * cam.z * 0.006, offY = (SKY_REF - cam.y) * cam.z * 0.012;
    ctx.fillStyle = '#ffffff';
    if (T.stars !== false) for (const s of stars) {
      const x = ((s.x * sw * 1.2 + off) % (sw * 1.2) + sw * 1.2) % (sw * 1.2) - sw * 0.1, y = s.y * sh + offY;
      const a = (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph))) * clamp(1 - y / (sh * 0.62), 0, 1) * (T.starA || 1);
      if (a < 0.05) continue;
      ctx.globalAlpha = a; ctx.fillRect(x, y, s.s, s.s);
    }
    ctx.globalAlpha = 1;
    if (T.moon !== false) {
    // luna con halo
    const R = Math.max(14, Math.min(sw, sh * 1.8) * 0.028), mx = sw * 0.66 - (cam.x - 1900) * cam.z * 0.012, my = sh * 0.27 + offY * 1.4;
    let rg = ctx.createRadialGradient(mx, my, R * 0.8, mx, my, R * 7);
    rg.addColorStop(0, 'rgba(210,210,255,0.22)'); rg.addColorStop(1, 'rgba(210,210,255,0)');
    ctx.fillStyle = rg; ctx.fillRect(mx - R * 7, my - R * 7, R * 14, R * 14);
    rg = ctx.createRadialGradient(mx - R * 0.3, my - R * 0.3, R * 0.1, mx, my, R);
    rg.addColorStop(0, '#fffdf0'); rg.addColorStop(1, '#dcd8c4');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(mx, my, R, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(150,145,130,0.28)';
    [[0.3, -0.2, 0.22], [-0.25, 0.25, 0.16], [0.05, 0.42, 0.12], [-0.4, -0.3, 0.1]].forEach(([a, b, c]) => { ctx.beginPath(); ctx.arc(mx + a * R, my + b * R, c * R, 0, TAU); ctx.fill(); });
    // avión lejano que cruza con sus luces
    const ap = (t * 0.018) % 1.4 - 0.2, ax = sw * ap, ay = sh * 0.12 + Math.sin(ap * 3) * sh * 0.02 + offY;
    if (ap > -0.1 && ap < 1.1) {
      ctx.fillStyle = Math.sin(t * 7) > 0.6 ? '#ff4040' : 'rgba(255,64,64,0.25)'; ctx.fillRect(ax, ay, 2.4, 2.4);
      ctx.fillStyle = Math.sin(t * 5 + 1) > 0.85 ? '#ffffff' : 'rgba(255,255,255,0.3)'; ctx.fillRect(ax - 7, ay + 1, 2, 2);
    }
    }
    // nubes: jirones de noche o nubarrones de tormenta que se iluminan con los rayos
    if (T.storm) stormClouds(ctx, G, cam, sw, sh, t);
    else ArtWorld.drawClouds(ctx, cam, sw, sh, t, 'far', T.cloudA || 0.14);
    let rg;
    // resplandor naranja de la ciudad en el horizonte
    const hz = sh / 2 + (1700 - (cam.y * 0.1 + 0.9 * SKY_REF)) * cam.z * 0.6;
    if (T.sun) drawSun(ctx, T, cam, sw, sh, hz, t);
    rg = ctx.createLinearGradient(0, hz - sh * 0.45, 0, hz + sh * 0.2);
    rg.addColorStop(0, `rgba(${T.glow},0)`); rg.addColorStop(0.75, `rgba(${T.glow},0.16)`); rg.addColorStop(1, `rgba(${T.glow},0.05)`);
    ctx.fillStyle = rg; ctx.fillRect(0, hz - sh * 0.45, sw, sh * 0.65);
    // reflectores que barren el cielo
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < (T.searchlights === false ? 0 : 2); i++) {
      const bx = sw * (0.28 + i * 0.47) - (cam.x - 1900) * cam.z * 0.25, by = hz + sh * 0.1;
      const ang = -Math.PI / 2 + Math.sin(t * (0.21 + i * 0.07) + i * 2.3) * 0.55, len = sh * 1.3, wd = 0.045;
      const lg = ctx.createLinearGradient(bx, by, bx + Math.cos(ang) * len, by + Math.sin(ang) * len);
      lg.addColorStop(0, 'rgba(200,210,255,0.13)'); lg.addColorStop(1, 'rgba(200,210,255,0)');
      ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(ang - wd) * len, by + Math.sin(ang - wd) * len); ctx.lineTo(bx + Math.cos(ang + wd) * len, by + Math.sin(ang + wd) * len); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // montañas con las comunas encendidas
    T.layers.forEach((L, i) => drawMountain(ctx, T, L, layerPts[i], cam, sw, sh, t));
    if (T.popa) drawPopa(ctx, T, cam, sw, sh, t);
    T.skyline.forEach((S, i) => drawSkyline(ctx, T, S, skylines[i], cam, sw, sh, t));
  }

  // el sol que se hunde en el mar, con su halo y dos jirones de nube que lo cruzan
  let sunX = -1e9;
  function drawSun(ctx, T, cam, sw, sh, hz, t) {
    const R = Math.max(26, Math.min(sw, sh * 1.8) * 0.07), sx = sw * 0.3 - (cam.x - 1900) * cam.z * 0.03, sy = hz + sh * 0.03;
    sunX = cam.x + (sx - sw / 2) / cam.z;
    let g = ctx.createRadialGradient(sx, sy, R * 0.6, sx, sy, R * 9);
    g.addColorStop(0, 'rgba(255,210,130,0.55)'); g.addColorStop(0.35, 'rgba(255,150,100,0.18)'); g.addColorStop(1, 'rgba(255,120,100,0)');
    ctx.fillStyle = g; ctx.fillRect(sx - R * 9, sy - R * 9, R * 18, R * 18);
    g = ctx.createLinearGradient(0, sy - R, 0, sy + R);
    g.addColorStop(0, '#fff4c8'); g.addColorStop(0.6, '#ffc46a'); g.addColorStop(1, '#ff8c4a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, R, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(150,70,110,0.55)';
    for (const [dy, w, h] of [[-0.25, 2.6, 0.07], [0.32, 3.4, 0.09]]) { const x = sx - R * w * 0.5 + Math.sin(t * 0.05 + dy) * R * 0.3; ctx.beginPath(); ctx.roundRect(x, sy + dy * R, R * w, R * h, R * h / 2); ctx.fill(); }
  }
  // La Popa: el cerro de fondo con el convento blanco arriba
  function drawPopa(ctx, T, cam, sw, sh, t) {
    const P = T.popa, p = P.p, zL = cam.z * (0.55 + 0.45 * p), camY = cam.y * p + (1 - p) * SKY_REF;
    const toS = ly => sh / 2 + (ly - camY) * zL, toX = lx => sw / 2 + (lx - cam.x * p) * zL;
    const base = 1950, top = 1620, cx = P.lx;
    if (toX(cx + 900) < 0 || toX(cx - 900) > sw) return;
    ctx.fillStyle = '#563a64'; ctx.beginPath(); ctx.moveTo(toX(cx - 900), toS(base));
    ctx.bezierCurveTo(toX(cx - 520), toS(base - 40), toX(cx - 300), toS(top + 20), toX(cx - 120), toS(top));
    ctx.lineTo(toX(cx + 160), toS(top - 4)); ctx.bezierCurveTo(toX(cx + 300), toS(top + 30), toX(cx + 560), toS(base - 60), toX(cx + 900), toS(base));
    ctx.closePath(); ctx.fill();
    // el convento con la luz del sol
    const x0 = toX(cx - 90), y0 = toS(top - 34), w = 220 * zL, h = 36 * zL;
    ctx.fillStyle = '#f2d2c0'; ctx.fillRect(x0, y0, w, h);
    ctx.fillRect(toX(cx + 70), toS(top - 70), 26 * zL, 40 * zL);
    ctx.fillStyle = 'rgba(160,90,110,0.5)'; ctx.fillRect(x0 + w * 0.6, y0, w * 0.4, h);
    ctx.fillStyle = 'rgba(255,220,150,0.9)'; for (let k = 0; k < 6; k++) ctx.fillRect(x0 + (12 + k * 32) * zL, y0 + 14 * zL, 6 * zL, 8 * zL);
  }

  // nubarrones bajos: manchas oscuras que pasan; los relámpagos las encienden por dentro
  function stormClouds(ctx, G, cam, sw, sh, t) {
    const S = G.world.storm, fl = S ? S.flash : 0, wx = S && S.bolt ? sw / 2 + (S.bolt.x - cam.x) * cam.z * 0.4 : sw / 2;
    for (let i = 0; i < 9; i++) {
      const x = ((i * 397 + t * (10 + i * 2) - cam.x * cam.z * 0.08) % (sw + 700) + sw + 700) % (sw + 700) - 350, y = sh * (0.04 + (i % 3) * 0.09) + (SKY_REF - cam.y) * cam.z * 0.05;
      const R = sh * (0.35 + (i % 4) * 0.08), lit = fl * clamp(1 - Math.abs(x - wx) / (sw * 0.7), 0, 1);
      const g = ctx.createRadialGradient(x, y, 0, x, y, R);
      g.addColorStop(0, `rgba(${Math.round(40 + 150 * lit)},${Math.round(46 + 160 * lit)},${Math.round(62 + 180 * lit)},${0.55 + 0.2 * lit})`); g.addColorStop(1, 'rgba(30,36,50,0)');
      ctx.fillStyle = g; ctx.save(); ctx.translate(x, y); ctx.scale(1.9, 0.55); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill(); ctx.restore();
    }
  }

  function drawMountain(ctx, T, L, pts, cam, sw, sh, t) {
    const p = L.p, zL = cam.z * (0.55 + 0.45 * p), camY = cam.y * p + (1 - p) * SKY_REF;
    const toS = ly => sh / 2 + (ly - camY) * zL, toX = lx => sw / 2 + (lx - cam.x * p) * zL, lxAt = sx => cam.x * p + (sx - sw / 2) / zL;
    const hAt = lx => L.base - L.amp * (0.25 + 0.75 * fbm1(lx * L.freq + L.seed * 9.7, 4));
    const step = Math.max(4, Math.round(sw / 160));
    let topY = Infinity;
    ctx.beginPath(); ctx.moveTo(-2, sh + 2);
    for (let sx = -step; sx <= sw + step; sx += step) { const y = toS(hAt(lxAt(sx))); if (y < topY) topY = y; ctx.lineTo(sx, y); }
    ctx.lineTo(sw + 2, sh + 2); ctx.closePath();
    const g = ctx.createLinearGradient(0, Math.max(topY, -sh), 0, sh);
    g.addColorStop(0, ArtWorld.mix(L.color, T.horizon, L.haze * 0.5)); g.addColorStop(1, L.color);
    ctx.fillStyle = g; ctx.fill();
    // lucecitas: tres tonos en tres trazos (rápido)
    if (LOWFX && L.p < 0.1) return;
    const l0 = lxAt(-10), l1 = lxAt(sw + 10), sz = Math.max(1.2, 3.2 * zL);
    const cols = ['255,196,120', '255,226,160', '225,235,255'];
    for (let c = 0; c < 3; c++) {
      ctx.beginPath();
      for (let k = 0; k < pts.length; k += 3) {
        const lx = pts[k]; if (lx < l0) continue; if (lx > l1) break;
        if (pts[k + 2] !== c) continue;
        ctx.rect(toX(lx), toS(pts[k + 1]), sz, sz);
      }
      ctx.fillStyle = `rgba(${cols[c]},${0.62 + (1 - L.haze) * 0.38})`; ctx.fill();
    }
    // bruma al pie
    const fy = toS(L.base + 40), fh = 200 * zL;
    const fg = ctx.createLinearGradient(0, fy - fh, 0, fy + fh * 0.5);
    fg.addColorStop(0, `rgba(${T.fog},0)`); fg.addColorStop(0.7, `rgba(${T.fog},${0.1 + L.haze * 0.18})`); fg.addColorStop(1, `rgba(${T.fog},0)`);
    ctx.fillStyle = fg; ctx.fillRect(0, fy - fh, sw, fh * 1.5);
  }

  function drawSkyline(ctx, T, S, list, cam, sw, sh, t) {
    const p = S.p, zL = cam.z * (0.55 + 0.45 * p), camY = cam.y * p + (1 - p) * SKY_REF;
    const toS = ly => sh / 2 + (ly - camY) * zL, toX = lx => sw / 2 + (lx - cam.x * p) * zL;
    const l0 = cam.x * p - sw / 2 / zL - 200, l1 = cam.x * p + sw / 2 / zL + 50, by = toS(S.base);
    ctx.beginPath();
    const vis = [];
    for (const B of list) { if (B.x + B.w < l0) continue; if (B.x > l1) break; vis.push(B); const x = toX(B.x), y = toS(S.base - B.h); ctx.rect(x, y, B.w * zL + 0.6, by - y + sh); if (B.dome) { const cx = toX(B.x + B.w / 2), r = B.w * 0.32 * zL; ctx.moveTo(cx + r, y); ctx.arc(cx, y, r, 0, Math.PI, true); ctx.rect(cx - 1, y - r - 14 * zL, 2, 14 * zL); } }
    ctx.fillStyle = S.color; ctx.fill();
    const sz = Math.max(1, 5 * zL), sy = Math.max(1, 6 * zL);
    for (let c = 0; c < 2; c++) {
      ctx.beginPath();
      for (const B of vis) { const x0 = toX(B.x), y0 = toS(S.base - B.h); for (let k = 0; k < B.wins.length; k += 3) if (B.wins[k + 2] === c) ctx.rect(x0 + B.wins[k] * zL, y0 + B.wins[k + 1] * zL, sz, sy); }
      ctx.fillStyle = c ? 'rgba(210,230,255,0.55)' : 'rgba(255,205,130,0.62)'; ctx.fill();
    }
    for (const B of vis) if (B.red && Math.sin(t * 2.4 + B.ph) > 0.2) { const x = toX(B.x + B.w / 2), y = toS(S.base - B.h) - 3; ctx.fillStyle = 'rgba(255,60,50,0.9)'; ctx.fillRect(x - 1.5, y - 1.5, 3, 3); }
    // bruma de la calle lejana
    const fg = ctx.createLinearGradient(0, by - 140 * zL, 0, by + 20);
    fg.addColorStop(0, `rgba(${T.glow},0)`); fg.addColorStop(1, `rgba(${T.glow},0.12)`);
    ctx.fillStyle = fg; ctx.fillRect(0, by - 140 * zL, sw, 160 * zL + 20);
  }

  /* ---------- el escenario (coordenadas del mundo) ---------- */
  const STYLE = {
    brick: { a: '#6a3530', b: '#3c1c1c', trim: '#8a4a3c' },
    glass: { a: '#1f3d5e', b: '#0c1a2e', trim: '#4f7fae' },
    concrete: { a: '#45455a', b: '#26263a', trim: '#6c6c86' },
    needle: { a: '#5c5c70', b: '#303044', trim: '#9a9ab4' },
    light: { a: '#2a2f44', b: '#131624', trim: '#7a80a8' },
  };
  const HOUSE = ['#8a3e2e', '#a24a34', '#7a3628', '#2f6fb0', '#e0b13c', '#c8507a', '#3f9a7a', '#9a5a3a', '#b8b0a0'];

  function drawStage(ctx, G, cam, sw, sh) {
    const W = G.world, T = THEMES[W.id] || THEMES.medellin, t = G.time;
    const x0 = cam.x - sw / 2 / cam.z - 60, x1 = cam.x + sw / 2 / cam.z + 60;
    drawViaduct(ctx, W, t, x0, x1);
    drawGround(ctx, W, T, t, x0, x1);
    drawCable(ctx, W, t, x0, x1, 'back');
    for (const B of W.buildings) if (B.x1 > x0 && B.x0 < x1) drawBuilding(ctx, B, t, W);
    drawCable(ctx, W, t, x0, x1, 'front');
  }

  function drawGround(ctx, W, T, t, x0, x1) {
    const step = 8, R = W.def.river;
    // calle y laderas
    ctx.beginPath(); ctx.moveTo(x0, W.h + 600);
    for (let x = x0; x <= x1; x += step) ctx.lineTo(x, W.groundY(x));
    ctx.lineTo(x1, W.h + 600); ctx.closePath();
    const g = ctx.createLinearGradient(0, 1450, 0, 2300);
    g.addColorStop(0, T.hill[0]); g.addColorStop(0.55, T.hill[1]); g.addColorStop(1, T.hill[2]);
    ctx.fillStyle = g; ctx.fill();
    // casitas de las comunas cubriendo las laderas (techos al ras de la superficie)
    const hx = (T.houses || []).map(([a, b]) => [Math.max(x0, a), Math.min(x1, b)]);
    if (T.forest) drawForest(ctx, W, T, t, Math.max(x0, T.forest[0]), Math.min(x1, T.forest[1]));
    for (const [a, b] of hx) {
      if (a >= b) continue;
      for (let x = Math.floor(a / 30) * 30; x < b; x += 30) {
        const gy = W.groundY(x + 15), k = Math.floor(x / 30);
        for (let j = 0; j < 7; j++) {
          const hy = gy + 3 + j * 27 + (h1(k, j) - 0.5) * 6, hw = 26 + h1(k + 1, j) * 6, hh = 25;
          const col = HOUSE[Math.floor(h1(k, j + 2) * HOUSE.length)], dim = 0.12 + j * 0.11;
          ctx.fillStyle = ArtWorld.mix(col, '#0a0814', Math.min(0.88, dim + 0.18)); ctx.fillRect(x + 2, hy, hw, hh);
          ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 2, hy, hw, 3);
          if (h1(k + 7, j) < 0.62 - j * 0.04) { ctx.fillStyle = h1(k, j + 11) < 0.2 ? 'rgba(210,230,255,0.8)' : 'rgba(255,200,120,0.85)'; ctx.fillRect(x + 7 + h1(k, j + 4) * 10, hy + 8, 6, 7); }
        }
      }
      // las bocas del túnel del metro
      const V = W.viaduct;
      if (V) for (const px of [V.x0, V.x1]) {
        if (px < a - 80 || px > b + 80) continue;
        const dir = px === V.x0 ? -1 : 1;
        ctx.fillStyle = '#07060c'; ctx.beginPath(); ctx.moveTo(px + dir * 6, V.top + 4); ctx.lineTo(px + dir * 6, V.top - 50); ctx.quadraticCurveTo(px + dir * 30, V.top - 62, px + dir * 60, V.top - 50); ctx.lineTo(px + dir * 60, V.top + 4); ctx.closePath(); ctx.fill();
      }
    }
    // la calle: andén claro y faroles de sodio
    ctx.strokeStyle = 'rgba(255,190,130,0.35)'; ctx.lineWidth = 3; ctx.beginPath();
    let on = false;
    const LA = T.lamps || [500, 3300];
    for (let x = Math.max(x0, LA[0] - 30); x <= Math.min(x1, LA[1] + 30); x += step) { const y = W.groundY(x) + 1.5; if (R && x > R[0] && x < R[1]) { on = false; continue; } if (!on) { ctx.moveTo(x, y); on = true; } else ctx.lineTo(x, y); }
    ctx.stroke();
    if (W.def.fort && x1 > 3150) drawFort(ctx, W, t, x0, x1);
    if (T.sea) { if (R[1] > x0) drawSea(ctx, W, T, t, x0, Math.min(x1, R[1])); }
    // el río con reflejos
    else if (R && R[1] > x0 && R[0] < x1) {
      const top = W.groundY(R[0]) + 4;
      const wg = ctx.createLinearGradient(0, top, 0, top + 260);
      wg.addColorStop(0, '#1d2550'); wg.addColorStop(1, '#070a1c');
      ctx.fillStyle = wg; ctx.fillRect(R[0], top, R[1] - R[0], 400);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 18; i++) {
        const rx = R[0] + 10 + (i * 61.7 % (R[1] - R[0] - 20)), wob = Math.sin(t * 2.2 + i) * 3;
        const col = i % 3 === 0 ? '120,170,255' : '255,170,90';
        ctx.fillStyle = `rgba(${col},${0.12 + 0.08 * Math.sin(t * 3 + i * 1.7)})`;
        for (let k = 0; k < 6; k++) ctx.fillRect(rx + wob * (k % 2 ? 1 : -1), top + 6 + k * 14, 18 - k * 2.4, 3);
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(190,210,255,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(R[0], top); ctx.lineTo(R[1], top); ctx.stroke();
    }
    // faroles
    for (let x = LA[0]; x < LA[1]; x += 160) {
      if (x < x0 - 80 || x > x1 + 80 || (R && x > R[0] - 10 && x < R[1] + 10)) continue;
      const gy = W.groundY(x);
      ctx.strokeStyle = '#2d2c3e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x, gy - 84); ctx.lineTo(x + 16, gy - 90); ctx.stroke();
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const lg = ctx.createRadialGradient(x + 18, gy - 88, 0, x + 18, gy - 88, 70);
      lg.addColorStop(0, 'rgba(255,190,110,0.55)'); lg.addColorStop(1, 'rgba(255,150,70,0)');
      ctx.fillStyle = lg; ctx.fillRect(x - 52, gy - 158, 140, 140);
      const pg = ctx.createRadialGradient(x + 18, gy, 0, x + 18, gy, 60);
      pg.addColorStop(0, 'rgba(255,170,90,0.28)'); pg.addColorStop(1, 'rgba(255,150,70,0)');
      ctx.fillStyle = pg; ctx.save(); ctx.translate(x + 18, gy); ctx.scale(1, 0.3); ctx.beginPath(); ctx.arc(0, 0, 60, 0, TAU); ctx.fill(); ctx.restore();
      ctx.restore();
      ctx.fillStyle = '#ffe2b0'; ctx.fillRect(x + 12, gy - 91, 10, 3);
    }
  }

  // el mar Caribe al atardecer: refleja el cielo, el sol deja un camino de destellos y las olas brillan
  function drawSea(ctx, W, T, t, a, b) {
    const top = W.groundY(a) + 1, A = Math.max(a, -400);
    const g = ctx.createLinearGradient(0, top, 0, top + 300);
    g.addColorStop(0, T.sea[0]); g.addColorStop(0.45, T.sea[1]); g.addColorStop(1, T.sea[2]);
    ctx.fillStyle = g; ctx.fillRect(A, top, b - A + 2, 420);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // camino del sol: rayitas que titilan, más anchas y espaciadas hacia acá
    const sx = clamp(sunX, A - 400, b + 400);
    for (let k = 0; k < 26; k++) {
      const y = top + 4 + k * 9 + k * k * 0.18, spread = 40 + k * 9;
      for (let j = 0; j < 4; j++) {
        const ph = hash1(k * 7 + j * 13), x = sx + (ph - 0.5) * 2 * spread + Math.sin(t * 1.7 + ph * 9) * 8;
        if (x < A || x > b) continue;
        const al = (0.18 + 0.32 * (0.5 + 0.5 * Math.sin(t * 3.1 + ph * 20))) * (1 - k / 30);
        ctx.fillStyle = `rgba(255,${190 - k * 2},${120 - k * 2},${al})`; ctx.fillRect(x, y, 10 + k * 1.4, 2 + k * 0.08);
      }
    }
    // líneas de ola que avanzan
    for (let k = 0; k < 9; k++) {
      const y = top + 14 + k * 26 + k * k * 1.4, al = 0.08 + 0.05 * Math.sin(t * 0.8 + k);
      ctx.strokeStyle = `rgba(255,190,200,${al})`; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let x = Math.floor(A / 40) * 40; x < b; x += 40) { const o = (x * 0.37 + k * 53 + t * 18) % 140; if (o < 70) { ctx.moveTo(x, y + Math.sin(x * 0.01 + t) * 2); ctx.lineTo(x + 26, y + Math.sin(x * 0.01 + t + 0.3) * 2); } }
      ctx.stroke();
    }
    ctx.restore();
    // borde brillante del agua y espuma contra la muralla
    ctx.strokeStyle = 'rgba(255,214,190,0.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(A, top); ctx.lineTo(b, top); ctx.stroke();
    const R = W.def.river[1];
    if (R < b + 60) {
      ctx.fillStyle = '#4a3a3a'; ctx.beginPath(); ctx.moveTo(R - 70, top + 4);
      for (let k = 0; k <= 7; k++) ctx.lineTo(R - 70 + k * 12, top - 6 - 10 * Math.sin(k * 1.3) - k * 2);
      ctx.lineTo(R + 6, top + 30); ctx.lineTo(R - 70, top + 30); ctx.fill();
      ctx.fillStyle = 'rgba(255,245,240,0.7)';
      for (let k = 0; k < 6; k++) { const f = (t * 0.8 + k / 6) % 1; ctx.globalAlpha = 1 - f; ctx.beginPath(); ctx.arc(R - 70 - f * 40 + k * 8, top - f * 6, 3 + f * 5, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
  }

  // el castillo de San Felipe: murallas de piedra en talud que suben el cerro, garitas y la bandera
  function drawFort(ctx, W, t, x0, x1) {
    const a = Math.max(3180, x0), b = Math.min(W.w + 40, x1), step = 8;
    if (a >= b) return;
    ctx.save(); ctx.beginPath(); ctx.moveTo(a, W.h + 600);
    for (let x = a; x <= b; x += step) ctx.lineTo(x, W.groundY(x));
    ctx.lineTo(b, W.h + 600); ctx.closePath(); ctx.clip();
    const g = ctx.createLinearGradient(0, 1100, 0, 2100);
    g.addColorStop(0, '#c9a77a'); g.addColorStop(0.5, '#9a7a58'); g.addColorStop(1, '#5c4436');
    ctx.fillStyle = g; ctx.fillRect(a, 1050, b - a, 1300);
    // hiladas de piedra
    ctx.strokeStyle = 'rgba(60,40,30,0.28)'; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let y = 1100; y < 2200; y += 22) { ctx.moveTo(a, y); ctx.lineTo(b, y); }
    for (let y = 1100, r = 0; y < 2200; y += 22, r++) for (let x = Math.floor(a / 46) * 46 + (r % 2) * 23; x < b; x += 46) { ctx.moveTo(x, y); ctx.lineTo(x, y + 22); }
    ctx.stroke();
    // los taludes miran al poniente: les pega el sol
    for (const [ta, th] of FORT_TIERS) { const lg = ctx.createLinearGradient(ta, 0, ta + 60, 0); lg.addColorStop(0, 'rgba(255,170,110,0)'); lg.addColorStop(0.5, 'rgba(255,170,110,0.28)'); lg.addColorStop(1, 'rgba(255,170,110,0.05)'); ctx.fillStyle = lg; ctx.fillRect(ta - 10, 1000, 80, 1300); }
    // la base del cerro con monte
    const hg = ctx.createLinearGradient(3120, 0, 3300, 0); hg.addColorStop(0, 'rgba(70,74,46,0.9)'); hg.addColorStop(1, 'rgba(70,74,46,0)');
    ctx.fillStyle = hg; ctx.fillRect(3120, 1500, 200, 700);
    ctx.restore();
    // almenas en el borde de cada muralla y una garita en cada esquina
    for (const [ta] of FORT_TIERS) {
      const ex = ta + 50;
      if (ex < x0 - 80 || ex > x1 + 80) continue;
      ctx.fillStyle = '#b8966c';
      for (let k = 0; k < 5; k++) { const x = ex + 8 + k * 18; ctx.fillRect(x, W.groundY(x) - 11, 10, 12); }
      const gy = W.groundY(ex);
      ctx.fillStyle = '#d6b88c'; ctx.fillRect(ex - 12, gy - 34, 22, 34);
      ctx.fillStyle = '#2a1c18'; ctx.fillRect(ex - 4, gy - 26, 6, 10);
      ctx.fillStyle = '#c9a77a'; ctx.beginPath(); ctx.arc(ex - 1, gy - 34, 12, Math.PI, 0); ctx.fill();
      ctx.fillStyle = 'rgba(255,180,120,0.35)'; ctx.fillRect(ex - 12, gy - 34, 5, 34);
    }
    // la bandera de Colombia arriba
    const fx = 3700; if (fx > x0 - 100 && fx < x1 + 100) {
      const gy = W.groundY(fx);
      ctx.fillStyle = '#3a2a22'; ctx.fillRect(fx - 2, gy - 120, 4, 120);
      const cols = ['#f6c826', '#f6c826', '#1f4aa8', '#d32a2a'];
      for (let r = 0; r < 4; r++) { ctx.fillStyle = cols[r]; ctx.beginPath(); for (let k = 0; k <= 6; k++) { const x = fx + 2 + k * 10, w = Math.sin(t * 5 - k * 0.8) * 3 * k / 6; ctx[k ? 'lineTo' : 'moveTo'](x, gy - 118 + r * 9 + w); } for (let k = 6; k >= 0; k--) { const x = fx + 2 + k * 10, w = Math.sin(t * 5 - k * 0.8) * 3 * k / 6; ctx.lineTo(x, gy - 109 + r * 9 + w); } ctx.closePath(); ctx.fill(); }
    }
  }

  // el cerro: bosque oscuro con algunas luces, el camino y la iglesia blanca en la cima
  function drawForest(ctx, W, T, t, a, b) {
    if (a >= b) return;
    ctx.fillStyle = '#0e1a16';
    ctx.beginPath();
    for (let x = Math.floor(a / 22) * 22; x < b; x += 22) {
      const gy = W.groundY(x), k = x / 22, h = 26 + h1(k, 3) * 30;
      ctx.moveTo(x - 12, gy + 6); ctx.lineTo(x, gy - h); ctx.lineTo(x + 12, gy + 6);
    }
    ctx.fill();
    ctx.fillStyle = 'rgba(255,214,150,0.7)';
    for (let x = Math.floor(a / 90) * 90; x < b; x += 90) if (h1(x, 9) < 0.45) ctx.fillRect(x + h1(x, 2) * 40, W.groundY(x) + 30 + h1(x, 5) * 120, 4, 4);
    const cx = T.church;
    if (cx && cx > a - 200 && cx < b + 200) {
      const gy = W.groundY(cx);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(cx, gy - 60, 0, cx, gy - 60, 200); g.addColorStop(0, 'rgba(255,240,210,0.35)'); g.addColorStop(1, 'rgba(255,240,210,0)');
      ctx.fillStyle = g; ctx.fillRect(cx - 200, gy - 260, 400, 400); ctx.restore();
      ctx.fillStyle = '#e8e4da'; ctx.fillRect(cx - 50, gy - 60, 100, 64);
      ctx.beginPath(); ctx.moveTo(cx - 58, gy - 60); ctx.lineTo(cx, gy - 92); ctx.lineTo(cx + 58, gy - 60); ctx.closePath(); ctx.fill();
      for (const sx of [-34, 34]) { ctx.fillRect(cx + sx - 11, gy - 118, 22, 60); ctx.beginPath(); ctx.moveTo(cx + sx - 13, gy - 118); ctx.lineTo(cx + sx, gy - 140); ctx.lineTo(cx + sx + 13, gy - 118); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,214,140,0.9)'; ctx.fillRect(cx - 8, gy - 36, 16, 40); for (const sx of [-34, 34]) ctx.fillRect(cx + sx - 4, gy - 104, 8, 12);
    }
  }

  function drawViaduct(ctx, W, t, x0, x1) {
    const V = W.viaduct, Tn = W.train; if (!V) return;
    // columnas
    for (let x = V.x0 + 120; x < V.x1; x += 240) {
      if (x < x0 - 30 || x > x1 + 30) continue;
      const gy = W.groundY(x), cg = ctx.createLinearGradient(x - 11, 0, x + 11, 0);
      cg.addColorStop(0, '#4a4a60'); cg.addColorStop(1, '#25253a');
      ctx.fillStyle = cg; ctx.fillRect(x - 11, V.top + V.h, 22, gy - V.top - V.h + 4);
      ctx.fillStyle = '#3b3b52'; ctx.fillRect(x - 20, V.top + V.h, 40, 8);
    }
    // el tren (antes del tablero: las ruedas quedan detrás del borde)
    if (Tn) {
      const y0 = V.top - Tn.h;
      for (let c = 0; c < Tn.cars; c++) {
        const cx = Tn.x + c * (Tn.carW + Tn.gap); if (cx > x1 || cx + Tn.carW < x0) continue;
        const bg = ctx.createLinearGradient(0, y0, 0, V.top);
        bg.addColorStop(0, '#eceef4'); bg.addColorStop(1, '#a9aec0');
        ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(cx, y0, Tn.carW, Tn.h - 4, 9); ctx.fill();
        ctx.fillStyle = '#2f8f86'; ctx.fillRect(cx + 2, y0 + Tn.h - 15, Tn.carW - 4, 5);
        ctx.fillStyle = '#ffe9b8';
        for (let w = 0; w < 7; w++) ctx.fillRect(cx + 10 + w * 19, y0 + 9, 13, 12);
        ctx.fillStyle = 'rgba(30,40,60,0.5)'; for (let w = 0; w < 7; w++) ctx.fillRect(cx + 10 + w * 19, y0 + 16, 13, 5);
      }
      // farol delantero y luz trasera
      const front = Tn.dir > 0 ? Tn.x + Tn.len : Tn.x, back = Tn.dir > 0 ? Tn.x : Tn.x + Tn.len;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      if (Tn.moving) {
        const lg = ctx.createLinearGradient(front, 0, front + Tn.dir * 260, 0);
        lg.addColorStop(0, 'rgba(255,245,210,0.35)'); lg.addColorStop(1, 'rgba(255,245,210,0)');
        ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(front, y0 + Tn.h - 14); ctx.lineTo(front + Tn.dir * 260, y0 - 20); ctx.lineTo(front + Tn.dir * 260, y0 + Tn.h + 30); ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = '#fff6da'; ctx.fillRect(front - (Tn.dir > 0 ? 4 : 0), y0 + Tn.h - 16, 4, 6);
      ctx.fillStyle = 'rgba(255,50,40,0.9)'; ctx.fillRect(back - (Tn.dir > 0 ? 0 : 4), y0 + Tn.h - 16, 4, 6);
      ctx.restore();
    }
    // tablero con baranda
    const dg = ctx.createLinearGradient(0, V.top, 0, V.top + V.h);
    dg.addColorStop(0, '#6a6a84'); dg.addColorStop(1, '#2c2c40');
    ctx.fillStyle = dg; ctx.fillRect(Math.max(V.x0, x0), V.top, Math.min(V.x1, x1) - Math.max(V.x0, x0), V.h);
    ctx.strokeStyle = 'rgba(160,160,190,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(Math.max(V.x0, x0), V.top - 8); ctx.lineTo(Math.min(V.x1, x1), V.top - 8); ctx.stroke();
  }

  function drawBuilding(ctx, B, t, W) {
    if (OLD[B.style]) return drawOld(ctx, B, t, W);
    const S = STYLE[B.style], w = B.x1 - B.x0;
    // la aguja (decorado arriba de la azotea)
    if (B.style === 'needle') {
      ctx.fillStyle = S.a; ctx.beginPath(); ctx.moveTo(B.x0 + w * 0.18, B.top); ctx.lineTo(B.x0 + w / 2, B.top - 170); ctx.lineTo(B.x1 - w * 0.18, B.top); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.moveTo(B.x0 + w * 0.18, B.top); ctx.lineTo(B.x0 + w / 2, B.top - 170); ctx.lineTo(B.x0 + w * 0.4, B.top); ctx.closePath(); ctx.fill();
      blinkLight(ctx, B.x0 + w / 2, B.top - 172, t, B.i);
    }
    // fachada: luz de luna por la izquierda, la calle ilumina la base
    const fg = ctx.createLinearGradient(B.x0, 0, B.x1, 0);
    fg.addColorStop(0, S.a); fg.addColorStop(1, S.b);
    ctx.fillStyle = fg; ctx.fillRect(B.x0, B.top, w, B.bottom - B.top);
    const bg = ctx.createLinearGradient(0, B.bottom - 220, 0, B.bottom);
    bg.addColorStop(0, 'rgba(255,150,80,0)'); bg.addColorStop(1, 'rgba(255,150,80,0.2)');
    ctx.fillStyle = bg; ctx.fillRect(B.x0, B.bottom - 220, w, 220);
    // volumen: filo de luna a la izquierda, canto en sombra a la derecha y cornisa clara
    ctx.fillStyle = 'rgba(190,212,255,0.2)'; ctx.fillRect(B.x0, B.top, 2.5, B.bottom - B.top);
    const eg = ctx.createLinearGradient(B.x1 - w * 0.16, 0, B.x1, 0); eg.addColorStop(0, 'rgba(0,0,12,0)'); eg.addColorStop(1, 'rgba(0,0,12,0.3)'); ctx.fillStyle = eg; ctx.fillRect(B.x1 - w * 0.16, B.top, w * 0.16, B.bottom - B.top);
    ctx.fillStyle = 'rgba(210,225,255,0.16)'; ctx.fillRect(B.x0, B.top, w, 3);
    if (B.style === 'glass') {
      // reflejos diagonales del vidrio
      ctx.save(); ctx.beginPath(); ctx.rect(B.x0, B.top, w, B.bottom - B.top); ctx.clip();
      ctx.fillStyle = 'rgba(140,190,255,0.06)';
      for (let k = -2; k < 10; k++) { const y = B.top + k * 150; ctx.beginPath(); ctx.moveTo(B.x0, y); ctx.lineTo(B.x1, y - w * 0.6); ctx.lineTo(B.x1, y - w * 0.6 + 50); ctx.lineTo(B.x0, y + 50); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    }
    if (B.style === 'concrete') { ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = B.oy - 6; y < B.bottom - 10; y += B.ch) ctx.fillRect(B.x0, y, w, 4); }
    // ventanas: encendidas cálidas, frías, apagadas y rotas (en trazos agrupados)
    const lit = [], cool = [], dark = [], broken = [], tv = [];
    for (let cy = 0; cy < B.rows; cy++) {
      const floorOn = h1(B.i * 31 + cy, 3) > 0.22;
      for (let cx = 0; cx < B.cols; cx++) {
        const k = cy * B.cols + cx, x = B.ox + cx * B.cw + (B.cw - B.wx) / 2, y = B.oy + cy * B.ch + (B.ch - B.wy) / 2;
        if (B.broken.has(k)) { broken.push(x, y); continue; }
        const r = h1(B.i * 97 + k, 7);
        if (floorOn && r < 0.5) (r < 0.1 ? cool : lit).push(x, y);
        else if (floorOn && r < 0.53) tv.push(x, y);
        else dark.push(x, y);
      }
    }
    const batch = (arr, col) => { if (!arr.length) return; ctx.beginPath(); for (let i = 0; i < arr.length; i += 2) ctx.rect(arr[i], arr[i + 1], B.wx, B.wy); ctx.fillStyle = col; ctx.fill(); };
    batch(dark, B.style === 'glass' ? 'rgba(20,40,70,0.9)' : 'rgba(14,14,26,0.85)');
    batch(lit, B.style === 'glass' ? 'rgba(255,226,170,0.88)' : 'rgba(255,200,120,0.9)');
    batch(cool, 'rgba(200,225,255,0.85)');
    batch(tv, `rgba(120,160,255,${0.45 + 0.35 * Math.sin(t * 9 + B.i)})`);
    if (broken.length) {
      batch(broken, '#05050a');
      ctx.fillStyle = 'rgba(200,225,255,0.55)'; ctx.beginPath();
      for (let i = 0; i < broken.length; i += 2) { const x = broken[i], y = broken[i + 1]; ctx.moveTo(x, y); ctx.lineTo(x + B.wx * 0.45, y); ctx.lineTo(x, y + B.wy * 0.6); ctx.closePath(); ctx.moveTo(x + B.wx, y + B.wy); ctx.lineTo(x + B.wx * 0.6, y + B.wy); ctx.lineTo(x + B.wx, y + B.wy * 0.35); ctx.closePath(); }
      ctx.fill();
    }
    // la torre de luces: franjas de colores que recorren la fachada
    if (B.style === 'light') {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let y = B.top + 20, k = 0; y < B.bottom - 20; y += 44, k++) {
        const hue = (t * 50 + k * 26) % 360;
        ctx.fillStyle = `hsla(${hue},90%,60%,0.55)`; ctx.fillRect(B.x0 + 2, y, w - 4, 7);
        const g = ctx.createLinearGradient(0, y - 16, 0, y + 23); g.addColorStop(0, `hsla(${hue},90%,60%,0)`); g.addColorStop(0.5, `hsla(${hue},90%,60%,0.14)`); g.addColorStop(1, `hsla(${hue},90%,60%,0)`);
        ctx.fillStyle = g; ctx.fillRect(B.x0 - 30, y - 16, w + 60, 39);
      }
      ctx.restore();
    }
    // borde con luz de luna y cornisa
    ctx.fillStyle = 'rgba(200,210,255,0.16)'; ctx.fillRect(B.x0, B.top, 2.5, B.bottom - B.top);
    ctx.fillStyle = S.trim; ctx.fillRect(B.x0 - 4, B.top - 6, w + 8, 8);
    // primer piso abierto sobre columnas: vestíbulo iluminado al fondo, se puede pasar por debajo
    const lh = B.ground - B.bottom;
    const lg = ctx.createLinearGradient(0, B.bottom, 0, B.ground);
    lg.addColorStop(0, 'rgba(60,40,50,0.55)'); lg.addColorStop(1, 'rgba(120,80,60,0.35)');
    ctx.fillStyle = lg; ctx.fillRect(B.x0 + 14, B.bottom, w - 28, lh);
    ctx.fillStyle = 'rgba(255,214,150,0.5)'; ctx.fillRect(B.x0 + 22, B.bottom + lh * 0.35, w - 44, lh * 0.32);
    ctx.fillStyle = S.b; ctx.fillRect(B.x0 - 2, B.bottom - 2, w + 4, 10);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let x = B.x0 + 24; x < B.x1 - 16; x += 34) { const g = ctx.createRadialGradient(x, B.bottom + 8, 0, x, B.bottom + 8, 34); g.addColorStop(0, 'rgba(255,220,170,0.4)'); g.addColorStop(1, 'rgba(255,200,140,0)'); ctx.fillStyle = g; ctx.fillRect(x - 34, B.bottom, 68, 46); }
    ctx.restore();
    const cg = ctx.createLinearGradient(0, 0, 14, 0);
    for (const cx of [B.x0 + 4, B.x0 + w / 2 - 7, B.x1 - 18]) { ctx.fillStyle = S.a; ctx.fillRect(cx, B.bottom + 6, 14, lh - 4); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(cx + 9, B.bottom + 6, 5, lh - 4); }
    // azotea
    roof(ctx, B, t, w);
  }

  /* ---------- la ciudad amurallada (Cartagena) ---------- */
  const OLD = {
    wall: [['#d2b588', '#8e7252']],
    colonial: [['#f2c45c', '#c08a36'], ['#ec8a6c', '#b45a48'], ['#62bdb2', '#3a8780'], ['#4f88c8', '#355f96'], ['#e584ad', '#ab5480'], ['#f2e6cf', '#c4ae8c']],
    clock: [['#f6d98c', '#c39a52']],
    cathedral: [['#e7a85a', '#a9682f']],
  };
  function drawOld(ctx, B, t, W) {
    const w = B.x1 - B.x0, P = OLD[B.style], [ca, cb] = P[B.i % P.length];
    // fachada: el sol de la tarde llega por la izquierda
    const fg = ctx.createLinearGradient(B.x0, 0, B.x1, 0);
    fg.addColorStop(0, ca); fg.addColorStop(1, cb);
    ctx.fillStyle = fg; ctx.fillRect(B.x0, B.top, w, B.bottom - B.top);
    ctx.fillStyle = 'rgba(255,190,120,0.35)'; ctx.fillRect(B.x0, B.top, 4, B.bottom - B.top);
    if (B.style === 'wall') {
      // muralla: piedra con hiladas, almenas y una garita en la esquina del mar
      ctx.strokeStyle = 'rgba(70,50,36,0.3)'; ctx.lineWidth = 1.2; ctx.beginPath();
      for (let y = B.top + 18, r = 0; y < B.bottom; y += 20, r++) { ctx.moveTo(B.x0, y); ctx.lineTo(B.x1, y); for (let x = B.x0 + (r % 2) * 20 + 10; x < B.x1; x += 40) { ctx.moveTo(x, y); ctx.lineTo(x, y + 20); } }
      ctx.stroke();
      ctx.fillStyle = ca; for (let x = B.x0 + 30; x < B.x1 - 6; x += 22) ctx.fillRect(x, B.top - 12, 12, 13);
      const gx = B.x0 + 6;
      ctx.fillStyle = '#e2c79a'; ctx.fillRect(gx - 4, B.top - 44, 26, 44);
      ctx.fillStyle = '#2a1c18'; ctx.fillRect(gx + 6, B.top - 34, 6, 12);
      ctx.fillStyle = '#c9a77a'; ctx.beginPath(); ctx.arc(gx + 9, B.top - 44, 14, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#b8966c'; ctx.fillRect(gx + 7, B.top - 66, 4, 9);
      return;
    }
    // cornisa blanca arriba y franja abajo
    ctx.fillStyle = '#f7efe2'; ctx.fillRect(B.x0 - 5, B.top - 2, w + 10, 9);
    if (B.style === 'colonial') {
      // alero de tejas de barro
      ctx.fillStyle = '#a5462e'; ctx.fillRect(B.x0 - 10, B.top - 12, w + 20, 10);
      ctx.fillStyle = 'rgba(60,20,10,0.35)'; for (let x = B.x0 - 8; x < B.x1 + 8; x += 8) ctx.fillRect(x, B.top - 12, 2, 10);
      // matas en la terraza
      for (let x = B.x0 + 16; x < B.x1 - 10; x += 52) { ctx.fillStyle = '#9a4a2e'; ctx.fillRect(x, B.top - 22, 12, 10); ctx.fillStyle = '#3f7a46'; ctx.beginPath(); ctx.arc(x + 6, B.top - 26, 9, 0, TAU); ctx.fill(); }
    }
    if (B.style === 'cathedral') {
      // pilastras blancas
      ctx.fillStyle = 'rgba(250,240,225,0.75)'; ctx.fillRect(B.x0 + 4, B.top, 7, B.bottom - B.top); ctx.fillRect(B.x1 - 11, B.top, 7, B.bottom - B.top);
      for (let y = B.top + 100; y < B.bottom - 20; y += 200) ctx.fillRect(B.x0 - 3, y, w + 6, 7);
    }
    // ventanas: abiertas con luz, de postigos cerrados, o rotas (con astillas)
    const lit = [], shut = [], broken = [];
    for (let cy = 0; cy < B.rows; cy++) for (let cx = 0; cx < B.cols; cx++) {
      const k = cy * B.cols + cx, x = B.ox + cx * B.cw + (B.cw - B.wx) / 2, y = B.oy + cy * B.ch + (B.ch - B.wy) / 2;
      if (B.broken.has(k)) broken.push(x, y); else (h1(B.i * 41 + k, 3) < 0.45 ? lit : shut).push(x, y);
    }
    const arch = (arr, col) => { if (!arr.length) return; ctx.beginPath(); for (let i = 0; i < arr.length; i += 2) { const x = arr[i], y = arr[i + 1], r = B.wx / 2; ctx.moveTo(x, y + r); ctx.arc(x + r, y + r, r, Math.PI, 0); ctx.lineTo(x + B.wx, y + B.wy); ctx.lineTo(x, y + B.wy); ctx.closePath(); } ctx.fillStyle = col; ctx.fill(); };
    arch(lit, 'rgba(255,214,140,0.92)'); arch(shut, B.style === 'colonial' ? '#5a3a2a' : 'rgba(40,24,30,0.85)'); arch(broken, '#160c10');
    if (B.style === 'colonial' && shut.length) { ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < shut.length; i += 2) for (let y = shut[i + 1] + B.wx / 2 + 4; y < shut[i + 1] + B.wy - 2; y += 5) { ctx.moveTo(shut[i] + 2, y); ctx.lineTo(shut[i] + B.wx - 2, y); } ctx.stroke(); }
    if (broken.length) { ctx.fillStyle = '#7a5038'; ctx.beginPath(); for (let i = 0; i < broken.length; i += 2) { const x = broken[i], y = broken[i + 1]; ctx.moveTo(x, y + B.wy); ctx.lineTo(x + B.wx * 0.3, y + B.wy * 0.5); ctx.lineTo(x + B.wx * 0.45, y + B.wy); ctx.moveTo(x + B.wx, y + B.wy * 0.4); ctx.lineTo(x + B.wx * 0.7, y + B.wy * 0.6); ctx.lineTo(x + B.wx, y + B.wy * 0.75); } ctx.fill(); }
    if (B.style === 'colonial') {
      // balcones de madera con buganvilias
      for (let cy = 0; cy < B.rows; cy++) {
        const y = B.oy + cy * B.ch + (B.ch - B.wy) / 2 + B.wy;
        ctx.fillStyle = '#6a3e26'; ctx.fillRect(B.x0 + 8, y - 2, w - 16, 6);
        ctx.fillStyle = 'rgba(70,40,24,0.9)'; for (let x = B.x0 + 10; x < B.x1 - 10; x += 7) ctx.fillRect(x, y - 16, 2, 14);
        ctx.fillRect(B.x0 + 8, y - 18, w - 16, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(B.x0 + 8, y + 4, w - 16, 5);
        if (h1(B.i, cy) < 0.7) { ctx.fillStyle = '#d6337c'; const bx = B.x0 + 14 + h1(cy, B.i + 3) * (w - 60); for (let k = 0; k < 14; k++) { ctx.beginPath(); ctx.arc(bx + h1(k, cy) * 44, y - 14 + h1(cy, k) * 20, 3 + h1(k + 2, cy) * 3, 0, TAU); ctx.fill(); } ctx.fillStyle = '#3f7a46'; for (let k = 0; k < 5; k++) ctx.fillRect(bx + h1(k + 9, cy) * 40, y - 6 + h1(cy + 4, k) * 12, 5, 3); }
      }
    }
    if (B.style === 'clock') {
      // el reloj (marca la hora del juego) y la cúpula con veleta
      const cx = (B.x0 + B.x1) / 2, cy = B.top + 62, R = Math.min(w * 0.32, 40);
      ctx.fillStyle = '#f7efe2'; ctx.beginPath(); ctx.arc(cx, cy, R + 6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#3a2a22'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
      ctx.beginPath(); for (let k = 0; k < 12; k++) { const a = k * TAU / 12; ctx.moveTo(cx + Math.cos(a) * R * 0.8, cy + Math.sin(a) * R * 0.8); ctx.lineTo(cx + Math.cos(a) * R * 0.92, cy + Math.sin(a) * R * 0.92); } ctx.stroke();
      const am = t * 0.4 - Math.PI / 2, ah = t * 0.4 / 12 - Math.PI / 2 + 1.2;
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ah) * R * 0.5, cy + Math.sin(ah) * R * 0.5); ctx.stroke();
      ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(am) * R * 0.78, cy + Math.sin(am) * R * 0.78); ctx.stroke();
      const dw = w * 0.5;
      ctx.fillStyle = ca; ctx.fillRect(cx - dw / 2, B.top - 40, dw, 40);
      ctx.fillStyle = '#2a1c18'; ctx.beginPath(); ctx.moveTo(cx - 8, B.top - 4); ctx.lineTo(cx - 8, B.top - 22); ctx.arc(cx, B.top - 22, 8, Math.PI, 0); ctx.lineTo(cx + 8, B.top - 4); ctx.fill();
      ctx.fillStyle = '#d98a3a'; ctx.beginPath(); ctx.arc(cx, B.top - 40, dw / 2, Math.PI, 0); ctx.fill();
      ctx.fillStyle = 'rgba(255,220,160,0.45)'; ctx.beginPath(); ctx.arc(cx, B.top - 40, dw / 2, Math.PI, Math.PI * 1.4); ctx.lineTo(cx, B.top - 40); ctx.fill();
      ctx.fillStyle = '#3a2a22'; ctx.fillRect(cx - 1.5, B.top - 40 - dw / 2 - 26, 3, 28);
      ctx.save(); ctx.translate(cx, B.top - 40 - dw / 2 - 22); ctx.scale(Math.sin(t * 0.6) > 0 ? 1 : -1, 1); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(14, -3); ctx.lineTo(14, 3); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    if (B.style === 'cathedral') {
      // tambor con cúpula de tejas y linterna
      const cx = (B.x0 + B.x1) / 2, dw = w * 0.72;
      ctx.fillStyle = ca; ctx.fillRect(cx - dw / 2, B.top - 50, dw, 50);
      ctx.fillStyle = 'rgba(40,20,20,0.8)'; for (const k of [-1, 0, 1]) { const x = cx + k * dw * 0.3; ctx.beginPath(); ctx.moveTo(x - 6, B.top - 8); ctx.lineTo(x - 6, B.top - 30); ctx.arc(x, B.top - 30, 6, Math.PI, 0); ctx.lineTo(x + 6, B.top - 8); ctx.fill(); }
      ctx.fillStyle = '#c4622e'; ctx.beginPath(); ctx.moveTo(cx - dw / 2 - 4, B.top - 50); ctx.quadraticCurveTo(cx - dw / 2, B.top - 50 - dw * 0.75, cx, B.top - 50 - dw * 0.8); ctx.quadraticCurveTo(cx + dw / 2, B.top - 50 - dw * 0.75, cx + dw / 2 + 4, B.top - 50); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(90,30,10,0.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (const k of [-0.5, -0.2, 0.2, 0.5]) { ctx.moveTo(cx + k * dw, B.top - 50); ctx.quadraticCurveTo(cx + k * dw * 0.6, B.top - 50 - dw * 0.6, cx, B.top - 50 - dw * 0.8); } ctx.stroke();
      ctx.fillStyle = 'rgba(255,200,140,0.35)'; ctx.beginPath(); ctx.moveTo(cx - dw / 2 - 4, B.top - 50); ctx.quadraticCurveTo(cx - dw / 2, B.top - 50 - dw * 0.75, cx, B.top - 50 - dw * 0.8); ctx.lineTo(cx - dw * 0.15, B.top - 50); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f2e2c8'; ctx.fillRect(cx - 7, B.top - 50 - dw * 0.8 - 22, 14, 24);
      ctx.fillStyle = '#c4622e'; ctx.beginPath(); ctx.arc(cx, B.top - 50 - dw * 0.8 - 22, 8, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#3a2a22'; ctx.fillRect(cx - 1, B.top - 50 - dw * 0.8 - 46, 2, 18);
    }
    // planta baja: portal de arcos (se puede pasar por debajo) con luz cálida adentro
    const lh = B.ground - B.bottom;
    if (lh > 10) {
      ctx.fillStyle = 'rgba(70,36,30,0.75)'; ctx.fillRect(B.x0 + 4, B.bottom, w - 8, lh);
      ctx.fillStyle = 'rgba(255,200,130,0.35)'; ctx.fillRect(B.x0 + 10, B.bottom + lh * 0.45, w - 20, lh * 0.3);
      ctx.fillStyle = ca;
      const n = Math.max(2, Math.round(w / 70)), aw = (w - 8) / n;
      ctx.fillRect(B.x0 - 2, B.bottom - 4, w + 4, 10);
      for (let k = 0; k <= n; k++) { const x = B.x0 + 4 + k * aw; ctx.fillRect(x - 6, B.bottom, 12, lh); }
      ctx.beginPath();
      for (let k = 0; k < n; k++) { const x = B.x0 + 4 + k * aw; ctx.moveTo(x, B.bottom); ctx.lineTo(x + aw, B.bottom); ctx.lineTo(x + aw, B.bottom + 26); ctx.quadraticCurveTo(x + aw / 2, B.bottom - 4, x, B.bottom + 26); ctx.closePath(); }
      ctx.fill();
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < n; k++) { const x = B.x0 + 4 + (k + 0.5) * aw, g = ctx.createRadialGradient(x, B.bottom + 30, 0, x, B.bottom + 30, 30); g.addColorStop(0, 'rgba(255,210,150,0.45)'); g.addColorStop(1, 'rgba(255,190,120,0)'); ctx.fillStyle = g; ctx.fillRect(x - 30, B.bottom, 60, 60); }
      ctx.restore();
    }
  }

  function blinkLight(ctx, x, y, t, i) {
    const on = Math.sin(t * 2.6 + i * 1.3) > 0.1;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (on) { const g = ctx.createRadialGradient(x, y, 0, x, y, 22); g.addColorStop(0, 'rgba(255,70,60,0.8)'); g.addColorStop(1, 'rgba(255,40,40,0)'); ctx.fillStyle = g; ctx.fillRect(x - 22, y - 22, 44, 44); }
    ctx.fillStyle = on ? '#ff6a5a' : '#6a2a2a'; ctx.beginPath(); ctx.arc(x, y, 3, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function roof(ctx, B, t, w) {
    const top = B.top - 6;
    if (B.style === 'brick') {
      // tanque de agua sobre patas
      const x = B.x0 + w * 0.62;
      ctx.strokeStyle = '#2a2230'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 14, top); ctx.lineTo(x - 10, top - 26); ctx.moveTo(x + 14, top); ctx.lineTo(x + 10, top - 26); ctx.stroke();
      ctx.fillStyle = '#4a3a3e'; ctx.beginPath(); ctx.roundRect(x - 18, top - 58, 36, 34, 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x - 18, top - 58, 9, 34);
      ctx.strokeStyle = '#3a3040'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(B.x0 + 20, top); ctx.lineTo(B.x0 + 20, top - 70); ctx.stroke();
      blinkLight(ctx, B.x0 + 20, top - 72, t, B.i);
    } else if (B.style === 'glass' || B.style === 'light') {
      // helipuerto o antena con luz roja
      if (B.i % 2 && B.style === 'glass') {
        ctx.fillStyle = '#2b3446'; ctx.fillRect(B.x0 + 10, top - 8, w - 20, 8);
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '700 18px ' + FONT; ctx.textAlign = 'center'; ctx.fillText('H', B.x0 + w / 2, top - 12);
        for (let k = 0; k < 4; k++) { const on = Math.sin(t * 3 - k * 0.8) > 0.4; ctx.fillStyle = on ? '#9dff9a' : '#2f5a30'; ctx.fillRect(B.x0 + 14 + k * (w - 32) / 3, top - 11, 4, 4); }
      } else {
        const x = B.x0 + w * 0.5;
        ctx.strokeStyle = '#59647a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, top - 120); ctx.moveTo(x - 10, top); ctx.lineTo(x, top - 60); ctx.lineTo(x + 10, top); ctx.stroke();
        blinkLight(ctx, x, top - 122, t, B.i);
      }
    } else if (B.style === 'concrete') {
      // letrero de neón
      const txt = B.i % 2 ? 'LA VENTOLERA' : 'MEDELLÍN', col = B.i % 2 ? '90,230,255' : '255,80,170';
      const flick = Math.sin(t * 23 + B.i) > -0.92 || Math.sin(t * 1.3) > 0;
      ctx.strokeStyle = '#2a2a38'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(B.x0 + 24, top); ctx.lineTo(B.x0 + 24, top - 30); ctx.moveTo(B.x1 - 24, top); ctx.lineTo(B.x1 - 24, top - 30); ctx.stroke();
      ctx.fillStyle = '#16141f'; ctx.fillRect(B.x0 + 10, top - 66, w - 20, 38);
      ctx.save(); ctx.font = `700 ${Math.min(22, (w - 30) / txt.length * 1.65)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (flick) { ctx.shadowColor = `rgba(${col},1)`; ctx.shadowBlur = 16; ctx.fillStyle = `rgba(${col},1)`; }
      else ctx.fillStyle = `rgba(${col},0.25)`;
      ctx.fillText(txt, B.x0 + w / 2, top - 46); ctx.restore();
      if (flick) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(B.x0 + w / 2, top - 46, 0, B.x0 + w / 2, top - 46, w * 0.7); g.addColorStop(0, `rgba(${col},0.18)`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.fillRect(B.x0 - w * 0.2, top - 46 - w * 0.7, w * 1.4, w * 1.4); ctx.restore(); }
    } else {
      ctx.fillStyle = '#3e3e52'; ctx.fillRect(B.x0 + 16, top - 18, 30, 18); ctx.fillRect(B.x1 - 46, top - 12, 26, 12);
    }
  }

  function drawCable(ctx, W, t, x0, x1, layer) {
    const C = W.cable; if (!C) return;
    if (layer === 'back') {
      // torres y estación
      for (const u of [0.32, 0.7]) {
        const x = lerp(C.x0, C.x1, u), y = lerp(C.y0, C.y1, u) - 6, gy = W.groundY(x);
        if (x < x0 - 60 || x > x1 + 60) continue;
        ctx.strokeStyle = '#3d4256'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x - 16, gy + 6); ctx.lineTo(x - 4, y); ctx.moveTo(x + 16, gy + 6); ctx.lineTo(x + 4, y); ctx.stroke();
        ctx.lineWidth = 1.5; ctx.beginPath();
        for (let yy = gy; yy > y + 20; yy -= 36) { const k = (gy - yy) / (gy - y), w = lerp(16, 4, k), k2 = (gy - yy + 36) / (gy - y), w2 = lerp(16, 4, Math.min(1, k2)); ctx.moveTo(x - w, yy); ctx.lineTo(x + w2, yy - 36); ctx.moveTo(x + w, yy); ctx.lineTo(x - w2, yy - 36); }
        ctx.stroke();
        ctx.fillStyle = '#4b5068'; ctx.fillRect(x - 20, y - 4, 40, 7);
      }
      const sx = C.x0, sy = C.y0;
      if (sx > x0 - 120 && sx < x1 + 120) {
        const gy = W.groundY(sx);
        ctx.fillStyle = '#2e3144'; ctx.fillRect(sx - 18, sy + 10, 36, gy - sy);
        ctx.fillStyle = '#3c4058'; ctx.beginPath(); ctx.roundRect(sx - 60, sy - 10, 100, 44, 6); ctx.fill();
        ctx.fillStyle = 'rgba(255,220,160,0.8)'; ctx.fillRect(sx - 52, sy + 4, 84, 12);
        ctx.fillStyle = '#5a5f7c'; ctx.beginPath(); ctx.moveTo(sx - 70, sy - 10); ctx.lineTo(sx - 10, sy - 30); ctx.lineTo(sx + 50, sy - 10); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = 'rgba(30,32,46,0.95)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(C.x0, C.y0); ctx.lineTo(C.x1, C.y1); ctx.stroke();
      ctx.strokeStyle = 'rgba(180,190,230,0.25)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(C.x0, C.y0 - 1.2); ctx.lineTo(C.x1, C.y1 - 1.2); ctx.stroke();
      return;
    }
    // cabinas (delante)
    for (let i = 0; i < C.n; i++) {
      const c = World.cabin(W, i); if (c.x < x0 - 60 || c.x > x1 + 60) continue;
      ctx.strokeStyle = '#3a3e50'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(c.hx, c.hy); ctx.lineTo(c.x, c.y - c.h / 2); ctx.stroke();
      ctx.fillStyle = '#50556c'; ctx.fillRect(c.hx - 6, c.hy - 3, 12, 6);
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.sw * 0.6);
      const g = ctx.createLinearGradient(-c.w / 2, 0, c.w / 2, 0);
      g.addColorStop(0, '#f2f2f6'); g.addColorStop(1, '#b6b9c8');
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-c.w / 2, -c.h / 2, c.w, c.h, 8); ctx.fill();
      ctx.fillStyle = C.red ? '#d93a32' : '#e8b730'; ctx.fillRect(-c.w / 2, c.h / 2 - 9, c.w, 5);
      if (C.red) { ctx.fillStyle = 'rgba(217,58,50,0.85)'; ctx.fillRect(-c.w / 2, -c.h / 2, c.w, 5); }
      ctx.fillStyle = 'rgba(255,232,180,0.9)'; ctx.fillRect(-c.w / 2 + 5, -c.h / 2 + 6, c.w - 10, 14);
      ctx.fillStyle = 'rgba(40,50,80,0.4)'; ctx.fillRect(-1, -c.h / 2 + 6, 2, 14);
      ctx.restore();
    }
  }

  // bruma nocturna de la calle (encima de todo lo del mundo)
  function drawHaze(ctx, G, cam, sw, sh) {
    const W = G.world, T = THEMES[W.id] || THEMES.medellin, t = G.time;
    const by = W.groundY(cam.x) + 10, top = by - 300;
    const g = ctx.createLinearGradient(0, top, 0, by + 80);
    g.addColorStop(0, `rgba(${T.glow},0)`); g.addColorStop(0.75, `rgba(${T.glow},0.1)`); g.addColorStop(1, `rgba(${T.fog},0.18)`);
    ctx.fillStyle = g; ctx.fillRect(cam.x - sw / 2 / cam.z, top, sw / cam.z, 380);
  }
  return { drawBackground, drawStage, drawHaze };
})();
