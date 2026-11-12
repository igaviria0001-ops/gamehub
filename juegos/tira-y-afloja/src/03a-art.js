/* =========================================================================
   ARTE COMÚN — utilidades de dibujo y piezas compartidas entre arenas;
   ArenaArt pinta la arena actual en capas fuera de pantalla
   ========================================================================= */
const INK = PALETTE.ink;

function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function fillStroke(ctx, fill, lw = 4, stroke = INK) {
  ctx.fillStyle = fill; ctx.fill();
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.stroke(); }
}
function woodGrain(ctx, x, y, w, h, color, rng, density = 7, alpha = 0.22) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineCap = 'round';
  const lines = Math.max(2, Math.floor(h / density));
  for (let i = 0; i < lines; i++) {
    const y0 = y + (i + 0.5) * (h / lines) + (rng() - 0.5) * 3;
    ctx.lineWidth = 1 + rng() * 1.6;
    ctx.beginPath();
    const seg = 18, ph = rng() * 10, amp = 0.8 + rng() * 1.8, freq = 0.006 + rng() * 0.01;
    let started = false;
    for (let xx = x - 10; xx <= x + w + 10; xx += seg) {
      if (rng() < 0.05) { started = false; continue; }
      const yy = y0 + Math.sin(xx * freq + ph) * amp;
      if (!started) { ctx.moveTo(xx, yy); started = true; } else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  // nudos
  const knots = Math.floor(w * h / 60000);
  for (let k = 0; k < knots; k++) {
    const kx = x + rng() * w, ky = y + rng() * h, kr = 6 + rng() * 10;
    for (let j = 0; j < 3; j++) { ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(kx, ky, kr + j * 5, (kr + j * 5) * 0.45, 0, 0, TAU); ctx.stroke(); }
  }
  ctx.restore();
}
function chalkText(ctx, text, x, y, size, rng, color = '#f6f2e8', align = 'left', rot = 0) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot);
  ctx.font = font(size, 600); ctx.textAlign = align; ctx.textBaseline = 'middle';
  for (let i = 0; i < 4; i++) {
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = color;
    ctx.fillText(text, (rng() - 0.5) * 2, (rng() - 0.5) * 2);
  }
  ctx.restore();
}
function chalkLine(ctx, pts, rng, color = '#f6f2e8', w = 3) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let k = 0; k < 3; k++) {
    ctx.globalAlpha = 0.3; ctx.lineWidth = w;
    ctx.beginPath();
    pts.forEach((p, i) => { const px = p[0] + (rng() - 0.5) * 1.6, py = p[1] + (rng() - 0.5) * 1.6; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
    ctx.stroke();
  }
  ctx.restore();
}


function paintPennants(ctx) {
  const cols = [PALETTE.fresa.base, '#ffd34d', PALETTE.menta.base, '#9b6bdf', '#ff9a3c', '#4aa3ff'];
  const y0 = 14, sag = 26;
  const yAt = x => y0 + Math.sin(x / WORLD_W * Math.PI) * sag;
  ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
  ctx.beginPath(); for (let x = 0; x <= WORLD_W; x += 20) { x ? ctx.lineTo(x, yAt(x)) : ctx.moveTo(x, yAt(x)); } ctx.stroke();
  let i = 0;
  for (let x = 30; x < WORLD_W - 20; x += 78, i++) {
    const ya = yAt(x), yb = yAt(x + 50);
    ctx.beginPath(); ctx.moveTo(x, ya); ctx.lineTo(x + 50, yb); ctx.lineTo(x + 25, (ya + yb) / 2 + 46); ctx.closePath();
    fillStroke(ctx, cols[i % cols.length], 2.5);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.moveTo(x + 6, ya + 3); ctx.lineTo(x + 26, (ya + yb) / 2 + 3); ctx.lineTo(x + 22, (ya + yb) / 2 + 20); ctx.closePath(); ctx.fill();
  }
}


/* ---------------- canecas ---------------- */
function canGeom(C) { const cx = C.x + C.w / 2; return { cx, rx: C.w / 2 - 6, ry: 24 }; }

function paintCanBack(ctx, C, rng, rim = ARENA.canRim) {
  const { cx, rx, ry } = canGeom(C);
  // interior oscuro (boca)
  ctx.beginPath(); ctx.ellipse(cx, rim, rx, ry, 0, 0, TAU);
  const ig = ctx.createLinearGradient(0, rim - ry, 0, rim + ry);
  ig.addColorStop(0, '#1d2a2a'); ig.addColorStop(1, '#3a4b48');
  ctx.fillStyle = ig; ctx.fill();
  // papeles arrugados adentro
  for (let i = 0; i < 9; i++) {
    const px = cx - rx * 0.75 + rng() * rx * 1.5, py = rim + 2 + rng() * 12, pr = 9 + rng() * 9;
    ctx.beginPath();
    for (let a = 0; a <= TAU; a += TAU / 9) { const rr2 = pr * (0.8 + rng() * 0.35); ctx.lineTo(px + Math.cos(a) * rr2, py + Math.sin(a) * rr2 * 0.8); }
    ctx.closePath(); fillStroke(ctx, i % 3 ? '#f4f1e8' : '#ffe9a8', 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(px - pr * 0.5, py - 2); ctx.lineTo(px + pr * 0.3, py + 3); ctx.stroke();
  }
  // borde trasero
  ctx.beginPath(); ctx.ellipse(cx, rim, rx, ry, 0, Math.PI, TAU);
  ctx.lineWidth = 12; ctx.strokeStyle = C.dark; ctx.stroke();
  ctx.lineWidth = 3.5; ctx.strokeStyle = INK;
  ctx.beginPath(); ctx.ellipse(cx, rim, rx + 6, ry + 6, 0, Math.PI, TAU); ctx.stroke();
}

function paintCanFront(ctx, C, rim = ARENA.canRim) {
  const { cx, rx, ry } = canGeom(C);
  const topY = rim, botY = 1090;
  ctx.beginPath();
  ctx.moveTo(cx - rx - 6, topY);
  ctx.ellipse(cx, topY, rx + 6, ry + 6, 0, Math.PI, 0, true);
  ctx.lineTo(cx + rx - 10, botY); ctx.lineTo(cx - rx + 10, botY); ctx.closePath();
  const g = ctx.createLinearGradient(C.x, 0, C.x + C.w, 0);
  g.addColorStop(0, C.dark); g.addColorStop(0.25, C.color); g.addColorStop(0.55, C.light); g.addColorStop(0.8, C.color); g.addColorStop(1, C.dark);
  fillStroke(ctx, g, 4);
  // estrías
  ctx.save(); ctx.clip();
  for (let i = -4; i <= 4; i++) { ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(cx + i * 28 - 3, topY + 30, 6, 300); }
  ctx.restore();
  // aro del borde (por delante)
  ctx.beginPath(); ctx.ellipse(cx, topY, rx + 3, ry + 3, 0, 0, Math.PI);
  ctx.lineWidth = 14; ctx.strokeStyle = C.light; ctx.stroke();
  ctx.lineWidth = 3.5; ctx.strokeStyle = INK;
  ctx.beginPath(); ctx.ellipse(cx, topY, rx + 10, ry + 10, 0, 0, Math.PI); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(cx, topY, rx - 4, ry - 4, 0, 0, Math.PI); ctx.stroke();
  // símbolo de reciclaje y letrero
  const sy = topY + 120;
  ctx.save(); ctx.translate(cx, sy);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let k = 0; k < 3; k++) {
    ctx.save(); ctx.rotate(k * TAU / 3);
    ctx.beginPath(); ctx.moveTo(-18, -22); ctx.lineTo(14, -22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -31); ctx.lineTo(16, -22); ctx.lineTo(6, -13); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.font = font(26, 700); ctx.textAlign = 'center';
  ctx.fillText(C.label, cx, topY + 72);
}


/* ---------------- rayos de luz ---------------- */
function paintLight(ctx) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const beams = [[70, 70, 210], [200, 60, 150], [290, 120, 120]];
  beams.forEach(([sx, sy, w], i) => {
    const g = ctx.createLinearGradient(sx, sy, sx + 900, sy + 800);
    g.addColorStop(0, 'rgba(255,240,200,0.22)'); g.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + w, sy); ctx.lineTo(sx + w + 900, sy + 760); ctx.lineTo(sx + 760, sy + 860); ctx.closePath(); ctx.fill();
  });
  ctx.restore();
}


const ArenaArt = (() => {
  let bg = null, fg = null, scale = 1;
  const thumbs = {};
  function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function paintInto(def, L, b, f) {
    const rng = mulberry32(def.seed || 1234);
    def.paintBg(b, rng, L);
    if (f) { if (def.paintFg) def.paintFg(f, rng, L); else L.cans.forEach(C => paintCanFront(f, C, L.canRim || 826)); }
  }
  function build(pxScale) {
    scale = clamp(pxScale || scale, 0.4, 2);
    bg = mk(Math.ceil(WORLD_W * scale), Math.ceil(WORLD_H * scale));
    fg = mk(Math.ceil(WORLD_W * scale), Math.ceil(WORLD_H * scale));
    const b = bg.getContext('2d'), f = fg.getContext('2d');
    b.scale(scale, scale); f.scale(scale, scale);
    paintInto(ARENA.def, ARENA.L, b, f);
  }
  // miniatura de una arena para los menús
  function thumb(id, w = 384, h = 216) {
    const key = id + '_' + w;
    if (thumbs[key]) return thumbs[key];
    const def = ARENA_DEFS[id]; if (!def) return null;
    const L = def.layout();
    const c = mk(w, h), ctx = c.getContext('2d');
    ctx.scale(w / WORLD_W, h / WORLD_H);
    paintInto(def, L, ctx, null);
    if (def.paintFg) def.paintFg(ctx, mulberry32(1), L); else L.cans.forEach(C => paintCanFront(ctx, C, L.canRim || 826));
    if (def.drawStatic) def.drawStatic(ctx, L);
    thumbs[key] = c;
    return c;
  }
  function clearThumbs() { for (const k in thumbs) delete thumbs[k]; }
  function drawDynamic(ctx, t, G) { if (ARENA.def && ARENA.def.drawDynamic) ARENA.def.drawDynamic(ctx, t, G, ARENA); }
  function drawOver(ctx, t, G) { if (ARENA.def && ARENA.def.drawOver) ARENA.def.drawOver(ctx, t, G, ARENA); }
  return {
    build, rebuild() { build(scale); }, thumb, clearThumbs, drawDynamic, drawOver, rr, fillStroke,
    get bg() { return bg; }, get fg() { return fg; }, get scale() { return scale; },
    get CANS() { return ARENA.cans; }, get CAN_RIM() { return ARENA.canRim; },
  };
})();
