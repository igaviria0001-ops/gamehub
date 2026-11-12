/* =========================================================================
   HUD — un lienzo 2D sobre todo. Por vista: puesto, vuelta y tiempos,
   velocímetro de aguja, barra Esmeralda de 4 rombos, carga del derrape,
   mensajes que saltan, cuenta regresiva, líneas de velocidad, sentido
   contrario y meta. Minimapa compartido.
   ========================================================================= */
const HUD = (() => {
  let cv, x, W = 0, H = 0, dpr = 1;
  const msgs = [[], []], pops = [];
  function init(c) { cv = c; x = c.getContext('2d'); resize(); }
  function resize() { dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); x.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function clear() { x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H); }
  const ctx = () => x;
  function msg(i, text, color = '#fff', o = {}) { const q = msgs[i]; if (!q) return; if (o.key) { const old = q.find(m => m.key === o.key); if (old) { old.text = text; old.t = 0; old.color = color; return; } } q.push({ text, color, t: 0, life: o.life || 1.4, big: !!o.big, sub: o.sub || '', key: o.key }); if (q.length > 4) q.shift(); }
  function update(dt) { for (const q of msgs) { for (const m of q) m.t += dt; while (q.length && q[0].t > q[0].life) q.shift(); } }
  // ---------- utilidades de dibujo ----------
  function txt(s, px, py, font, fill, align = 'left', stroke = 0, base = 'alphabetic') {
    x.font = font; x.textAlign = align; x.textBaseline = base;
    if (stroke) { x.lineJoin = 'round'; x.lineWidth = stroke; x.strokeStyle = 'rgba(0,8,20,0.85)'; x.strokeText(s, px, py); }
    x.fillStyle = fill; x.fillText(s, px, py);
  }
  function rhomb(cx, cy, w, h) { x.beginPath(); x.moveTo(cx, cy - h / 2); x.lineTo(cx + w / 2, cy); x.lineTo(cx, cy + h / 2); x.lineTo(cx - w / 2, cy); x.closePath(); }
  const fmt = t => { if (!(t >= 0)) t = 0; const m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(2); };
  const ORD = n => n + 'º';
  const PLACE_COL = ['#ffd84a', '#dfe8f2', '#ffa25a'];
  // ---------- por jugador ----------
  function player(r, car, R, i, t, opt = {}) {
    const sc = clamp(Math.min(r.w, r.h) / 520, 0.62, 1.25), m = 14 * sc + (opt.inset || 0), pc = PLAYER_COLORS[i] || PLAYER_COLORS[0];
    x.save(); x.beginPath(); x.rect(r.x, r.y, r.w, r.h); x.clip();
    speedLines(r, car, t);
    // disposición: "afuera" = borde exterior de la vista (J2 va en espejo); "adentro" deja libre la columna central
    const mir = !!opt.mirror, inIn = opt.innerInset || 0, touch = !!opt.touch;
    const Lx = r.x + m + (mir ? inIn : 0), Rx = r.x + r.w - m - (mir ? 0 : inIn), Tp = r.y + m + (opt.insetT || 0), Bt = r.y + r.h - m;
    const outer = mir ? Rx : Lx, inner = mir ? Lx : Rx, iAl = mir ? 'left' : 'right';
    // puesto
    const pl = car.place, pcol = PLACE_COL[pl - 1] || '#ffffff', fs = 64 * sc;
    if (R.state !== 'count' && !(R.rules && ((R.rules.id === 'school' && !R.rules.L.race) || R.rules.noPlace))) {
      x.font = `italic ${fontT(fs)}`; const w1 = x.measureText(String(pl)).width; x.font = fontB(18 * sc, 900); const w2 = x.measureText('/' + R.cars.length).width;
      const X0 = mir ? outer - (w1 + 4 * sc + w2) : outer;
      txt(String(pl), X0, Tp + fs * 0.82, `italic ${fontT(fs)}`, pcol, 'left', 6 * sc);
      txt('º', X0 + w1 + 2, Tp + fs * 0.42, fontT(fs * 0.4), pcol, 'left', 4 * sc);
      txt('/' + R.cars.length, X0 + w1 + 4 * sc, Tp + fs * 0.82, fontB(18 * sc, 900), 'rgba(255,255,255,0.75)', 'left', 4 * sc);
    }
    // vuelta y tiempos (arriba, lado de adentro) — o el tablero del modo (corazones, eliminación, lección)
    const RU = R.rules, pan = RU && RU.panel ? RU.panel(R, car) : null;
    if (pan && pan.bar != null) {
      // jefe: nombre, barra de vida, distancia y cuánto le falta para escaparse
      const bw2 = Math.min(220 * sc, r.w * 0.4), x0 = mir ? inner : inner - bw2, y0 = Tp + 18 * sc, bh = 15 * sc, k = clamp(pan.bar, 0, 1);
      txt(pan.label, inner, Tp + 11 * sc, fontB(12 * sc, 900), 'rgba(255,255,255,0.85)', iAl, 3 * sc);
      x.fillStyle = 'rgba(0,0,0,0.55)'; x.fillRect(x0 - 2, y0 - 2, bw2 + 4, bh + 4); const gr = x.createLinearGradient(0, y0, 0, y0 + bh); gr.addColorStop(0, pan.flash ? '#ffffff' : pan.barCol); gr.addColorStop(1, pan.flash ? '#ffe0a0' : 'rgba(0,0,0,0.35)');
      x.fillStyle = pan.barCol; x.fillRect(mir ? x0 : x0 + bw2 * (1 - k), y0, bw2 * k, bh); x.fillStyle = gr; x.globalAlpha = 0.6; x.fillRect(mir ? x0 : x0 + bw2 * (1 - k), y0, bw2 * k, bh); x.globalAlpha = 1;
      x.fillStyle = 'rgba(0,0,0,0.5)'; for (let q = 1; q < 10; q++) x.fillRect(x0 + bw2 * q / 10, y0, 1, bh);
      txt(Math.ceil(k * 100) + '%', x0 + bw2 / 2, y0 + bh * 0.8, fontB(12 * sc, 900), '#fff', 'center', 3 * sc);
      if (pan.sub) txt(pan.sub, inner, y0 + bh + 18 * sc, fontB(13 * sc, 900), '#fff', iAl, 4 * sc);
      if (pan.esc != null) { const ey = y0 + bh + 28 * sc; x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(x0, ey, bw2, 4 * sc); x.fillStyle = '#ff7a5a'; x.fillRect(mir ? x0 + bw2 * (1 - pan.esc) : x0, ey, bw2 * pan.esc, 4 * sc); txt('🏁', mir ? x0 - 2 * sc : x0 + bw2 + 2 * sc, ey + 6 * sc, fontB(11 * sc, 900), '#fff', mir ? 'right' : 'left', 0); }
    } else if (pan) {
      txt(pan.label, inner, Tp + 11 * sc, fontB(12 * sc, 900), 'rgba(255,255,255,0.7)', iAl, 3 * sc);
      txt(pan.value, inner, Tp + 40 * sc, `italic ${fontT(30 * sc)}`, pan.col || '#fff', iAl, 5 * sc);
      if (pan.sub) txt(pan.sub, inner, Tp + 62 * sc, fontB(15 * sc, 900), '#fff', iAl, 4 * sc);
      if (pan.hearts != null) for (let k = 0; k < pan.max; k++) heart(mir ? inner + (k * 30 + 14) * sc : inner - (k * 30 + 14) * sc, Tp + (pan.sub ? 84 : 66) * sc, 11 * sc, k < pan.hearts);
    } else {
      const lap = Math.min(R.laps, car.lap + 1);
      txt('VUELTA', inner, Tp + 11 * sc, fontB(12 * sc, 900), 'rgba(255,255,255,0.7)', iAl, 3 * sc);
      txt(lap + '/' + R.laps, inner, Tp + 40 * sc, `italic ${fontT(30 * sc)}`, lap === R.laps && !car.finished ? '#ff7a5a' : '#fff', iAl, 5 * sc);
      txt(fmt(car.finished ? car.finishT : R.time), inner, Tp + 62 * sc, fontB(17 * sc, 900), '#fff', iAl, 4 * sc);
      if (car.best) txt('MEJOR ' + fmt(car.best), inner, Tp + 79 * sc, fontB(12 * sc, 800), 'rgba(200,255,230,0.85)', iAl, 3 * sc);
    }
    const bw = 138 * sc;
    if (car.out) { /* fuera de combate: sin velocímetro ni barra */ }
    else if (touch) {
      // en el teléfono la parte de abajo es de los pulgares: velocidad y barra van arriba
      const kmh = Math.round(Math.max(0, car.f) * 3.6), y = Tp + (car.best ? 104 : 88) * sc;
      txt(kmh + ' km/h', inner, y, `italic ${fontT(19 * sc)}`, car.boostT > 0 ? '#b8ffe0' : '#fff', iAl, 4 * sc);
      gemBar(mir ? outer - bw : outer, Tp + fs + 66 * sc, sc, car, t);
      itemSlot(mir ? outer - bw - 40 * sc : outer + bw + 40 * sc, Tp + fs + 42 * sc, 50 * sc, car, t, sc, opt.itemKey);
    } else {
      gauge(mir ? inner + 52 * sc : inner - 52 * sc, Bt - 40 * sc, 50 * sc, car, t, sc, pc);
      gemBar(mir ? outer - bw : outer, Bt, sc, car, t);
      itemSlot(mir ? outer - bw - 44 * sc : outer + bw + 44 * sc, Bt - 26 * sc, 56 * sc, car, t, sc, opt.itemKey);
    }
    // niebla: la vista se tapa
    if (car.sandK > 0.04 && !car.finished) { const k = Math.min(1, car.sandK), cx = r.x + r.w / 2, cy = r.y + r.h / 2, gr = x.createRadialGradient(cx, cy, Math.min(r.w, r.h) * (0.5 - k * 0.3), cx, cy, Math.max(r.w, r.h) * 0.72);
      gr.addColorStop(0, 'rgba(214,160,92,0)'); gr.addColorStop(1, `rgba(196,136,66,${(0.25 + 0.6 * k) * k})`); x.fillStyle = gr; x.fillRect(r.x, r.y, r.w, r.h); }
    if (car.fogT > 0) { x.fillStyle = car.stormImm > 3.5 ? 'rgba(206,150,84,0.6)' : 'rgba(225,230,240,0.72)'; x.fillRect(r.x, r.y, r.w, r.h); }
    // sentido contrario
    if (R.state === 'race' && !(R.rules && R.rules.free) && !car.finished && car.grounded && Math.cos(car.a) < -0.2 && car.f > 3) { const a = 0.6 + 0.4 * Math.sin(t * 10); x.globalAlpha = a; txt('↺ SENTIDO CONTRARIO', r.x + r.w / 2, r.y + r.h * 0.32, fontT(24 * sc), '#ff5a36', 'center', 6 * sc); x.globalAlpha = 1; }
    // mensajes
    const q = msgs[i] || []; let my = r.y + r.h * 0.24;
    for (const g of q) {
      const k = g.t < 0.12 ? smooth(g.t / 0.12) : 1, fade = clamp((g.life - g.t) / 0.3, 0, 1), s = (g.big ? 38 : 22) * sc * (0.6 + 0.4 * k + (g.t < 0.12 ? 0.25 * Math.sin(k * Math.PI) : 0));
      x.globalAlpha = fade; txt(g.text, r.x + r.w / 2, my, `italic ${fontT(s)}`, g.color, 'center', 6 * sc);
      if (g.sub) txt(g.sub, r.x + r.w / 2, my + 20 * sc, fontB(14 * sc, 900), '#fff', 'center', 4 * sc);
      x.globalAlpha = 1; my += (g.big ? 46 : 30) * sc + (g.sub ? 18 * sc : 0);
    }
    // Escuela: el consejo de la lección mientras arranca
    { const RL = R.rules && (R.rules.L || (R.rules.tip ? R.rules : null)); if (RL && (R.state === 'count' || R.time < 6) && !car.lessonT) { x.globalAlpha = R.state === 'count' ? 1 : clamp((6 - R.time) / 1.2, 0, 1); wrap(RL.tip(i), r.x + r.w / 2, r.y + r.h * 0.66, Math.min(r.w - 40 * sc, 560 * sc), fontB(15 * sc, 900), '#fff', 20 * sc); txt('META: ' + RL.goal, r.x + r.w / 2, r.y + r.h * 0.66 - 34 * sc, fontB(14 * sc, 900), '#3dffa8', 'center', 4 * sc); x.globalAlpha = 1; } }
    // aviso grande del modo (eliminado, vas último, lección lograda)
    const ov = R.rules && R.rules.overlay ? R.rules.overlay(R, car) : null;
    if (ov) { x.globalAlpha = ov.blink ? 0.55 + 0.45 * Math.sin(t * 9) : 1; x.fillStyle = 'rgba(2,10,20,0.35)'; x.fillRect(r.x, r.y + r.h * 0.52, r.w, 84 * sc);
      txt(ov.text, r.x + r.w / 2, r.y + r.h * 0.52 + 46 * sc, `italic ${fontT(40 * sc)}`, ov.col || '#fff', 'center', 7 * sc); if (ov.sub) txt(ov.sub, r.x + r.w / 2, r.y + r.h * 0.52 + 72 * sc, fontB(15 * sc, 900), '#fff', 'center', 4 * sc); x.globalAlpha = 1; }
    // cuenta regresiva y salida
    if (R.state === 'count') { const n = Math.ceil(R.countT), f = n - R.countT; if (n <= 3 && n > 0) { const s = 120 * sc * (1.4 - 0.4 * smooth(clamp(f * 4, 0, 1))); x.globalAlpha = clamp((1 - f) * 3, 0, 1); txt(String(n), r.x + r.w / 2, r.y + r.h * 0.42, `italic ${fontT(s)}`, n === 1 ? '#19e68c' : '#fff', 'center', 10 * sc, 'middle'); x.globalAlpha = 1; } else if (n > 3) txt('PREPÁRATE', r.x + r.w / 2, r.y + r.h * 0.42, `italic ${fontT(40 * sc)}`, '#fff', 'center', 7 * sc, 'middle');
      if (R.countT < 1 && R.countT > 0) txt('Turbo justo al ¡YA! = salida perfecta', r.x + r.w / 2, r.y + r.h * 0.42 + 70 * sc, fontB(14 * sc, 800), 'rgba(255,255,255,0.8)', 'center', 4 * sc);
    } else if (R.time < 0.9) { const f = R.time / 0.9; x.globalAlpha = 1 - f * f; txt('¡YA!', r.x + r.w / 2, r.y + r.h * 0.42, `italic ${fontT(130 * sc * (1 + f * 0.4))}`, '#19e68c', 'center', 10 * sc, 'middle'); x.globalAlpha = 1; }
    // meta
    if (car.finished) {
      const k = clamp((R.time - car.finishT) / 0.35, 0, 1); x.fillStyle = `rgba(2,10,20,${0.35 * k})`; x.fillRect(r.x, r.y + r.h * 0.3, r.w, 120 * sc);
      txt('¡META!', r.x + r.w / 2, r.y + r.h * 0.3 + 52 * sc, `italic ${fontT(54 * sc * (0.7 + 0.3 * k))}`, pcol, 'center', 8 * sc);
      txt(ORD(car.place) + ' LUGAR  ·  ' + fmt(car.finishT), r.x + r.w / 2, r.y + r.h * 0.3 + 92 * sc, fontB(20 * sc, 900), '#fff', 'center', 5 * sc);
    }
    // borde con el color del jugador (sólo en pantalla dividida)
    if (opt.split) { x.strokeStyle = pc.main; x.globalAlpha = 0.55; x.lineWidth = 3; x.strokeRect(r.x + 1.5, r.y + 1.5, r.w - 3, r.h - 3); x.globalAlpha = 1; txt('J' + (i + 1), r.x + r.w / 2, r.y + r.h - 8, fontT(14 * sc), pc.main, 'center', 4); }
    x.restore();
  }
  function gauge(cx, cy, R0, car, t, sc, pc) {
    const kmh = Math.max(0, car.f) * 3.6, maxK = 320, a0 = Math.PI * 0.8, a1 = Math.PI * 2.2, f = clamp(kmh / maxK, 0, 1), boost = car.boostT > 0;
    x.lineCap = 'round';
    x.beginPath(); x.arc(cx, cy, R0, a0, a1); x.strokeStyle = 'rgba(4,10,24,0.55)'; x.lineWidth = 12 * sc; x.stroke();
    const g = x.createLinearGradient(cx - R0, cy, cx + R0, cy); g.addColorStop(0, '#62e0ff'); g.addColorStop(0.6, boost ? '#b8ffe0' : '#ffffff'); g.addColorStop(1, boost ? '#19e68c' : '#ff7a5a');
    x.beginPath(); x.arc(cx, cy, R0, a0, a0 + (a1 - a0) * f); x.strokeStyle = g; x.lineWidth = 7 * sc; x.stroke();
    for (let k = 0; k <= 8; k++) { const a = a0 + (a1 - a0) * k / 8; x.beginPath(); x.moveTo(cx + Math.cos(a) * (R0 - 10 * sc), cy + Math.sin(a) * (R0 - 10 * sc)); x.lineTo(cx + Math.cos(a) * (R0 - 15 * sc), cy + Math.sin(a) * (R0 - 15 * sc)); x.strokeStyle = 'rgba(255,255,255,0.5)'; x.lineWidth = 2 * sc; x.stroke(); }
    txt(String(Math.round(kmh)), cx, cy + 8 * sc, `italic ${fontT(30 * sc)}`, boost ? '#b8ffe0' : '#fff', 'center', 5 * sc);
    txt('km/h', cx, cy + 24 * sc, fontB(11 * sc, 900), 'rgba(255,255,255,0.7)', 'center', 3 * sc);
    x.lineCap = 'butt';
  }
  function gemBar(L, B, sc, car, t) {
    const w = 30 * sc, h = 40 * sc, gap = 6 * sc, y = B - h / 2 - 4 * sc, full = car.gem >= 4;
    txt('ESMERALDA', L, y - h / 2 - 7 * sc, fontB(11 * sc, 900), full ? '#8affc8' : 'rgba(255,255,255,0.75)', 'left', 3 * sc);
    for (let k = 0; k < 4; k++) {
      const cx = L + w / 2 + k * (w + gap), fill = clamp(car.gem - k, 0, 1);
      rhomb(cx, y, w, h); x.fillStyle = 'rgba(4,14,24,0.6)'; x.fill(); x.lineWidth = 2 * sc; x.strokeStyle = fill >= 1 ? '#c8ffe6' : 'rgba(150,255,210,0.45)'; x.stroke();
      if (fill > 0) { x.save(); rhomb(cx, y, w - 5 * sc, h - 6 * sc); x.clip(); const top = y + h / 2 - (h * fill);
        const g = x.createLinearGradient(0, y - h / 2, 0, y + h / 2); g.addColorStop(0, '#d6ffec'); g.addColorStop(0.4, '#3dffa8'); g.addColorStop(1, '#0a9c5c'); x.fillStyle = g; x.fillRect(cx - w, top, w * 2, h);
        if (fill >= 1) { x.fillStyle = 'rgba(255,255,255,0.45)'; x.beginPath(); x.moveTo(cx - w * 0.15, y - h * 0.3); x.lineTo(cx, y - h * 0.42); x.lineTo(cx + w * 0.05, y - h * 0.05); x.fill(); }
        x.restore(); }
    }
    if (full) { const a = 0.5 + 0.5 * Math.sin(t * 8); x.save(); x.shadowColor = '#19e68c'; x.shadowBlur = 18 * sc * a; for (let k = 0; k < 4; k++) { rhomb(L + w / 2 + k * (w + gap), y, w, h); x.strokeStyle = `rgba(140,255,200,${0.5 + a * 0.5})`; x.lineWidth = 2.5 * sc; x.stroke(); } x.restore(); }
    // carga del derrape
    const D = car.drift;
    if (D.on) {
      const lv = D.lv, nxt = DRIFT_LV[Math.min(2, lv)], prv = lv ? DRIFT_LV[lv - 1] : 0, f = lv >= 3 ? 1 : clamp((D.t - prv) / (nxt - prv), 0, 1);
      const COL = ['#d8e6ff', '#3fa9ff', '#ff8a1a', '#19e68c'], bw = 4 * w + 3 * gap, by = y - h / 2 - 26 * sc;
      x.fillStyle = 'rgba(4,10,24,0.6)'; x.fillRect(L, by, bw, 7 * sc);
      x.fillStyle = COL[Math.min(3, lv + 1)]; x.globalAlpha = 0.45; x.fillRect(L, by, bw * f, 7 * sc); x.globalAlpha = 1;
      for (let k = 0; k < 3; k++) { const on = lv > k; x.fillStyle = on ? COL[k + 1] : 'rgba(255,255,255,0.18)'; x.fillRect(L + k * (bw / 3) + 1, by, bw / 3 - 2, 7 * sc); }
      x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(L + (lv >= 3 ? bw : (Math.min(lv, 2) + f) * bw / 3) - 1, by - 2 * sc, 2, 11 * sc);
    }
  }
  // ---------- casilla del objeto (ruleta, objeto con cantidad, o especial lista) ----------
  const ICONS = Object.keys(ITEMS);
  function itemSlot(cx, cy, S, car, t, sc, key) {
    const spec = !car.item && !(car.rollT > 0) && car.gem >= 4 ? SPECIALS[car.pid] : null, rolling = car.rollT > 0, col = ItemArt.ICON_COL[car.item] || '#ffffff';
    // al llegar el objeto la casilla «salta»
    if (car.item && !rolling && car._hudItem !== car.item) { car._hudItem = car.item; car._hudPop = t; } if (!car.item) car._hudItem = null;
    const pop = car._hudPop != null ? clamp(1 - (t - car._hudPop) / 0.4, 0, 1) : 0, k = 1 + 0.2 * Math.sin(pop * Math.PI), R2 = S * k / 2;
    x.save();
    if (car.item && !rolling) { const g = x.createRadialGradient(cx, cy, S * 0.2, cx, cy, S * 0.95); g.addColorStop(0, col + '55'); g.addColorStop(1, col + '00'); x.fillStyle = g; x.fillRect(cx - S, cy - S, S * 2, S * 2); }
    x.beginPath(); x.roundRect(cx - R2, cy - R2, R2 * 2, R2 * 2, 11 * sc); const bg = x.createLinearGradient(0, cy - R2, 0, cy + R2); bg.addColorStop(0, spec ? 'rgba(20,70,46,0.85)' : 'rgba(34,52,92,0.82)'); bg.addColorStop(1, spec ? 'rgba(6,30,18,0.85)' : 'rgba(4,10,26,0.85)'); x.fillStyle = bg; x.fill();
    x.lineWidth = 2.5 * sc; x.strokeStyle = spec ? `rgba(140,255,200,${0.6 + 0.4 * Math.sin(t * 8)})` : rolling ? `rgba(255,255,255,${0.55 + 0.45 * Math.sin(t * 30)})` : car.item ? col : 'rgba(255,255,255,0.35)'; x.stroke();
    x.strokeStyle = 'rgba(255,255,255,0.18)'; x.lineWidth = 1.2 * sc; x.beginPath(); x.roundRect(cx - R2 + 3 * sc, cy - R2 + 3 * sc, R2 * 2 - 6 * sc, R2 * 2 - 6 * sc, 8 * sc); x.stroke();
    if (rolling) { // ruleta: los objetos pasan como en una tragamonedas
      x.beginPath(); x.roundRect(cx - R2 + 2, cy - R2 + 2, R2 * 2 - 4, R2 * 2 - 4, 9 * sc); x.clip(); const sp = 12 + 10 * clamp(car.rollT / 0.9, 0, 1), f = t * sp, i = Math.floor(f), ph = f - i;
      for (let q = -1; q <= 1; q++) ItemArt.icon(x, ICONS[(i + q + ICONS.length * 4) % ICONS.length], cx, cy + (q - ph) * S * 0.9 + S * 0.45 - S * 0.45, S * 0.86);
    }
    x.restore();
    if (car.item && !rolling) { ItemArt.icon(x, car.item, cx, cy, S * 0.92 * k); if (car.itemN > 1) { const bx = cx + S / 2 - 2 * sc, by = cy + S / 2 - 2 * sc; x.beginPath(); x.arc(bx, by, 11 * sc, 0, TAU); x.fillStyle = '#ffd23d'; x.fill(); x.lineWidth = 2 * sc; x.strokeStyle = '#3a2400'; x.stroke(); txt('×' + car.itemN, bx, by + 4.5 * sc, fontT(12 * sc), '#2a1800', 'center', 0); } }
    else if (spec) { txt('ESPECIAL', cx, cy - 4 * sc, fontB(10 * sc, 900), '#8affc8', 'center', 3 * sc); txt(spec.name, cx, cy + 10 * sc, fontT(Math.min(11, 90 / spec.name.length) * sc), spec.col, 'center', 3 * sc); }
    if (key && (car.item || spec) && !rolling) txt(key, cx, cy + S / 2 + 13 * sc, fontB(11 * sc, 900), 'rgba(255,255,255,0.8)', 'center', 3 * sc);
  }
  // ---------- líneas de velocidad ----------
  function speedLines(r, car, t) {
    const k = car.boostT > 0 ? 1 : clamp((car.f - car.vmax * 0.92) / (car.vmax * 0.08), 0, 0.5); if (k <= 0.02) return;
    const cx = r.x + r.w / 2, cy = r.y + r.h * 0.45, n = Math.round(26 * k), R0 = Math.hypot(r.w, r.h) * 0.6;
    x.strokeStyle = car.boostK > 1 ? 'rgba(180,255,220,0.55)' : 'rgba(255,255,255,0.45)'; x.lineCap = 'round';
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, r1 = R0 * (0.5 + Math.random() * 0.3), r2 = r1 + R0 * (0.15 + Math.random() * 0.3); x.lineWidth = 1 + Math.random() * 2.5; x.beginPath(); x.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.75); x.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2 * 0.75); x.stroke(); }
    x.lineCap = 'butt';
  }
  // ---------- minimapa ----------
  let mmTrack = null, mmPts = null, mmB = null;
  function minimap(R, cx, cy, size, t) {
    const T = R.track;
    if (mmTrack !== T) { mmTrack = T; mmPts = []; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let k = 0; k < T.N; k += 2) { const px = T.px[k], pz = T.pz[k]; mmPts.push(px, pz); x0 = Math.min(x0, px); x1 = Math.max(x1, px); z0 = Math.min(z0, pz); z1 = Math.max(z1, pz); } mmB = { x0, x1, z0, z1 }; }
    const sp = Math.max(mmB.x1 - mmB.x0, mmB.z1 - mmB.z0), k = size / sp, mx = (mmB.x0 + mmB.x1) / 2, mz = (mmB.z0 + mmB.z1) / 2;
    const P = (px, pz) => [cx + (px - mx) * k, cy + (pz - mz) * k];
    x.save();
    x.beginPath(); x.arc(cx, cy, size * 0.62, 0, TAU); x.fillStyle = 'rgba(4,10,24,0.45)'; x.fill();
    x.beginPath(); for (let i = 0; i < mmPts.length; i += 2) { const [a, b] = P(mmPts[i], mmPts[i + 1]); i ? x.lineTo(a, b) : x.moveTo(a, b); } x.closePath();
    x.lineJoin = 'round'; x.strokeStyle = 'rgba(0,0,0,0.6)'; x.lineWidth = 7; x.stroke(); x.strokeStyle = 'rgba(235,245,255,0.9)'; x.lineWidth = 3.5; x.stroke();
    const st = T.at(0), [sx, sy] = P(st.px, st.pz); x.fillStyle = '#19e68c'; x.fillRect(sx - 3, sy - 3, 6, 6);
    if (R.boss && !R.boss.dead) { const B = R.boss, o = T.at(B.s), [a, b] = P(o.px + o.rx * B.u, o.pz + o.rz * B.u), rr = 7 + Math.sin(t * 8) * 1.2; x.save(); x.translate(a, b); x.rotate(Math.PI / 4); x.fillStyle = B.def.col; x.fillRect(-rr / 2, -rr / 2, rr, rr); x.lineWidth = 2; x.strokeStyle = '#000'; x.strokeRect(-rr / 2, -rr / 2, rr, rr); x.restore(); }
    const cars = R.cars.slice().sort((a, b) => (a.bot ? 0 : 1) - (b.bot ? 0 : 1));
    for (const c of cars) { if (c.out) continue; const o = T.at(c.s), [a, b] = P(o.px + o.rx * c.u, o.pz + o.rz * c.u); x.beginPath(); x.arc(a, b, c.bot ? 3.2 : 5.5, 0, TAU); x.fillStyle = c.bot ? c.P.color : PLAYER_COLORS[c.human].main; x.fill(); x.lineWidth = c.bot ? 1 : 2; x.strokeStyle = c.bot ? 'rgba(0,0,0,0.6)' : '#fff'; x.stroke(); }
    x.restore();
  }
  // texto en varias líneas (consejos de la Escuela)
  function wrap(s, cx, top, maxW, font, fill, lh) { x.font = font; const words = s.split(' '), lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (x.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur);
    const bw = Math.min(maxW, Math.max(...lines.map(l => x.measureText(l).width))) + 28, bh = lines.length * lh + 16; x.fillStyle = 'rgba(4,12,26,0.72)'; x.beginPath(); x.roundRect(cx - bw / 2, top - lh + 2, bw, bh, 12); x.fill(); x.strokeStyle = 'rgba(61,255,168,0.5)'; x.lineWidth = 1.5; x.stroke();
    lines.forEach((l, i) => txt(l, cx, top + i * lh, font, fill, 'center')); }
  // corazones de la batalla
  function heart(cx, cy, r, on) { x.beginPath(); x.moveTo(cx, cy + r * 0.9); x.bezierCurveTo(cx - r * 1.4, cy - r * 0.1, cx - r * 0.7, cy - r * 1.2, cx, cy - r * 0.45); x.bezierCurveTo(cx + r * 0.7, cy - r * 1.2, cx + r * 1.4, cy - r * 0.1, cx, cy + r * 0.9); x.closePath();
    x.fillStyle = on ? '#ff3d6e' : 'rgba(40,20,30,0.6)'; x.fill(); x.lineWidth = 2; x.strokeStyle = on ? '#ffd0dc' : 'rgba(255,255,255,0.35)'; x.stroke(); }
  return { init, resize, clear, ctx, msg, update, player, minimap, txt, fmt, wrap, get W() { return W; }, get H() { return H; } };
})();
