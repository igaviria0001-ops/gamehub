/* =========================================================================
   TÁCTIL — dos jugadores en un solo teléfono (de lado). Cada jugador es dueño
   de su mitad: palanca flotante en el borde exterior y botones hacia el
   centro (DERRAPE grande, TURBO con la barra, OBJETO). Un jugador: palanca a
   la izquierda y botones a la derecha. Arriba/abajo en la palanca = piruetas
   en el aire y freno. Deslizar el dedo entre botones también cuenta.
   ========================================================================= */
const Touch = (() => {
  const st = { active: false, n: 1, sc: 1, players: [], touches: new Map() };
  const BTN = [{ id: 'drift', label: 'DERRAPE', r: 50 }, { id: 'turbo', label: 'TURBO', r: 36 }, { id: 'item', label: 'OBJETO', r: 34 }];
  function layout() {
    const W = innerWidth, H = innerHeight, sc = clamp(Math.min(W, H) / 400, 0.72, 1.3); st.sc = sc; st.players = [];
    for (let i = 0; i < st.n; i++) {
      const half = st.n === 2, x0 = half ? (i ? W / 2 : 0) : 0, x1 = half ? (i ? W : W / 2) : W, mir = half && i === 1; // J2: espejo
      const w = x1 - x0, inner = mir ? x0 : x1, dir = mir ? 1 : -1; // dir: hacia adentro del área del jugador desde el borde de botones
      const by = H - 20 * sc - 54 * sc;
      const b = [
        { ...BTN[0], x: inner + dir * (half ? 74 : 90) * sc, y: by, r: BTN[0].r * sc },
        { ...BTN[1], x: inner + dir * (half ? 66 : 84) * sc, y: by - 104 * sc, r: BTN[1].r * sc },
        { ...BTN[2], x: inner + dir * (half ? 166 : 186) * sc, y: by + 10 * sc, r: BTN[2].r * sc },
      ];
      if (!half) { b[1].x = inner + dir * 196 * sc; b[1].y = by - 30 * sc; b[2].x = inner + dir * 70 * sc; b[2].y = by - 110 * sc; }
      const stickX = mir ? x1 - 90 * sc : x0 + 90 * sc;
      st.players.push({ i, x0, x1, mir, btns: b, home: { x: stickX, y: H - 96 * sc }, stick: null, R: 58 * sc });
      Input.touch[i] = { sx: 0, sy: 0, drift: false, item: false, turbo: false };
    }
  }
  function start(n) { st.n = n; st.active = true; st.touches.clear(); layout(); }
  function stop() { st.active = false; st.touches.clear(); Input.touch[0] = Input.touch[1] = null; }
  const ownerOf = (px) => { for (const p of st.players) if (px >= p.x0 && px < p.x1) return p; return st.players[0]; };
  function btnAt(p, x, y) { let best = null, bd = 1e9; for (const b of p.btns) { const d = Math.hypot(x - b.x, y - b.y); if (d < b.r * 1.35 && d < bd) { bd = d; best = b; } } return best; }
  function sync() {
    for (const p of st.players) { const t = Input.touch[p.i]; if (!t) continue; t.drift = t.turbo = t.item = false; t.sx = t.sy = 0; }
    for (const [, o] of st.touches) {
      const p = o.p, t = Input.touch[p.i]; if (!t) continue;
      if (o.kind === 'btn' && o.btn) t[o.btn.id] = true;
      if (o.kind === 'stick') { let dx = (o.x - o.ox) / p.R, dy = (o.y - o.oy) / p.R; const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; } const dz = 0.12, ax = Math.abs(dx); t.sx = ax < dz ? 0 : Math.sign(dx) * Math.min(1, (ax - dz) / (0.85 - dz)); t.sy = dy; }
    }
  }
  // los toques sobre botones y pantallas (pausa, resultados) son de la interfaz, no del manejo
  const onUI = e => !!(e.target && e.target.closest && e.target.closest('button, .screen:not([hidden])'));
  function onStart(e) {
    if (!st.active || onUI(e)) return; e.preventDefault();
    for (const tc of e.changedTouches) {
      const p = ownerOf(tc.clientX), b = btnAt(p, tc.clientX, tc.clientY);
      if (b) { st.touches.set(tc.identifier, { p, kind: 'btn', btn: b, x: tc.clientX, y: tc.clientY, t0: performance.now() }); Input.tap(p.i, b.id); }
      else {
        // palanca: el dedo que ya maneja manda; si no, crea una nueva
        let has = false; for (const [, o] of st.touches) if (o.p === p && o.kind === 'stick') has = true;
        if (!has) st.touches.set(tc.identifier, { p, kind: 'stick', ox: tc.clientX, oy: tc.clientY, x: tc.clientX, y: tc.clientY });
      }
    }
    sync();
  }
  function onMove(e) {
    if (!st.active || onUI(e)) return; e.preventDefault();
    for (const tc of e.changedTouches) { const o = st.touches.get(tc.identifier); if (!o) continue; o.x = tc.clientX; o.y = tc.clientY;
      if (o.kind === 'btn') { const b = btnAt(o.p, o.x, o.y); if (b) o.btn = b; }
      else { const dx = o.x - o.ox, dy = o.y - o.oy, d = Math.hypot(dx, dy), max = o.p.R * 1.25; if (d > max) { o.ox = o.x - dx / d * max; o.oy = o.y - dy / d * max; } } }
    sync();
  }
  function onEnd(e) { if (!st.active) return; for (const tc of e.changedTouches) st.touches.delete(tc.identifier); sync(); }
  addEventListener('touchstart', onStart, { passive: false }); addEventListener('touchmove', onMove, { passive: false });
  addEventListener('touchend', onEnd); addEventListener('touchcancel', onEnd);
  addEventListener('resize', () => { if (st.active) layout(); });
  // ---- dibujo (sobre el HUD) ----
  function draw(x, cars, t) {
    if (!st.active) return; const sc = st.sc;
    for (const p of st.players) {
      const car = cars[p.i]; let so = null; for (const [, o] of st.touches) if (o.p === p && o.kind === 'stick') so = o;
      const pc = PLAYER_COLORS[p.i].main;
      // palanca
      const bx = so ? so.ox : p.home.x, byy = so ? so.oy : p.home.y;
      x.globalAlpha = so ? 0.9 : 0.4; x.beginPath(); x.arc(bx, byy, p.R, 0, TAU); x.fillStyle = 'rgba(6,12,26,0.35)'; x.fill(); x.lineWidth = 2.5; x.strokeStyle = 'rgba(255,255,255,0.55)'; x.stroke();
      const kx = so ? bx + clamp(so.x - so.ox, -p.R, p.R) : bx, ky = so ? byy + clamp(so.y - so.oy, -p.R, p.R) : byy;
      x.beginPath(); x.arc(kx, ky, p.R * 0.45, 0, TAU); x.fillStyle = pc; x.globalAlpha = so ? 0.85 : 0.35; x.fill();
      if (!so) { x.globalAlpha = 0.5; HUD.txt('◂ ▸', bx, byy + 5 * sc, fontB(15 * sc, 900), '#fff', 'center'); }
      x.globalAlpha = 1;
      // botones
      const ti = Input.touch[p.i] || {};
      for (const b of p.btns) {
        const on = !!ti[b.id], dim = b.id === 'item' && car && !car.item && !(car.rollT > 0) && car.gem < 4;
        x.beginPath(); x.arc(b.x, b.y, b.r * (on ? 0.94 : 1), 0, TAU);
        x.fillStyle = on ? (b.id === 'drift' ? 'rgba(255,138,26,0.55)' : 'rgba(25,230,140,0.55)') : 'rgba(6,12,26,0.42)'; x.globalAlpha = dim ? 0.35 : 1; x.fill();
        x.lineWidth = 2.5; x.strokeStyle = on ? '#fff' : b.id === 'item' && car && car.item && !(car.rollT > 0) ? ItemArt.ICON_COL[car.item] || '#fff' : 'rgba(255,255,255,0.55)'; x.stroke();
        if (b.id === 'turbo' && car) { // la barra esmeralda alrededor del turbo
          for (let k = 0; k < 4; k++) { const f = clamp(car.gem - k, 0, 1); if (f <= 0) continue; const a0 = -Math.PI / 2 + k * TAU / 4 + 0.08, a1 = a0 + (TAU / 4 - 0.16) * f; x.beginPath(); x.arc(b.x, b.y, b.r + 5 * sc, a0, a1); x.strokeStyle = '#3dffa8'; x.lineWidth = 4 * sc; x.stroke(); }
        }
        if (b.id === 'item' && car && (car.item || car.rollT > 0)) ItemArt.icon(x, car.rollT > 0 ? Object.keys(ITEMS)[Math.floor(t * 16) % 11] : car.item, b.x, b.y, b.r * 1.3);
        else if (b.id === 'item' && car && car.gem >= 4) { HUD.txt('ESPECIAL', b.x, b.y + 4 * sc, fontB(9 * sc, 900), '#8affc8', 'center'); }
        else HUD.txt(b.label, b.x, b.y + 4 * sc, fontB((b.id === 'drift' ? 13 : 10.5) * sc, 900), '#fff', 'center');
        x.globalAlpha = 1;
      }
    }
  }
  return { start, stop, draw, layout, get active() { return st.active; } };
})();
