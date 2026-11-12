/* =========================================================================
   TÁCTIL — dos en un mismo teléfono (horizontal): cada uno su mitad.
   Palanca flotante en el borde de su lado; junto al otro pulgar, las dos
   manos (botones del color de su elemento) con un rombo de FUSIÓN en medio;
   deslizar de una mano a la otra también funde. Esquivar: botón pequeño
   encima. Contra la máquina, J1 usa toda la pantalla.
   ========================================================================= */
const Touch = (() => {
  let enabled = matchMedia('(pointer: coarse)').matches, active = false;
  const ptr = new Map(), st = [mk(), mk()];
  function mk() { return { stick: null, sx: 0, sy: 0, mx: 0, my: 0, h: [null, null], fuse: null, dash: null }; }
  const solo = () => Game.G.players === 1;
  // dónde va cada cosa (px de pantalla)
  function layout() {
    const sw = innerWidth, sh = innerHeight, R = clamp(Math.min(sw / 844, sh / 390) * 33, 25, 46);
    const L = [];
    for (let p = 0; p < 2; p++) {
      if (p === 1 && solo()) { L.push(null); continue; }
      const right = p === 1, s1 = solo();
      const cx = s1 ? sw - R * 3.6 : right ? sw * 0.66 : sw * 0.34, by = sh - R * 1.45 - (+(getComputedStyle(document.documentElement).getPropertyValue('--sab') || 0));
      const h0 = { x: cx - R * 1.45, y: by, r: R }, h1 = { x: cx + R * 1.45, y: by, r: R }, fz = { x: cx, y: by - R * 0.4, r: R * 0.56 }, dz = { x: cx, y: by - R * 1.95, r: R * 0.6 };
      const stickHome = { x: s1 ? R * 2.4 : right ? sw - R * 2.3 : R * 2.3, y: sh - R * 2.1 };
      L.push({ h: [h0, h1], fz, dz, stickHome, R, x0: s1 ? 0 : right ? sw / 2 : 0, x1: s1 ? sw : right ? sw : sw / 2 });
    }
    return L;
  }
  const inside = (b, x, y, k = 1.2) => hypot(x - b.x, y - b.y) < b.r * k;
  function owner(x) { return solo() ? 0 : x < innerWidth / 2 ? 0 : 1; }
  function down(e) {
    if (e.pointerType === 'touch') enabled = true;
    if (!enabled || UI.current != null || Game.G.state === 'attract') return;
    if (Game.G.introT > 0) Game.skipIntro();
    active = true; e.preventDefault();
    const L = layout(), p = owner(e.clientX), Lp = L[p]; if (!Lp) return; const S = st[p], x = e.clientX, y = e.clientY;
    let role = null;
    // cada toque va al botón cuyo centro quede más cerca (medido según su tamaño): el rombo de fusión gana todo el hueco entre las dos manos
    const R = Lp.R, cand = [[hypot(x - Lp.fz.x, y - Lp.fz.y) / (R * 0.9), { p, kind: 'fuse' }], [hypot(x - Lp.h[0].x, y - Lp.h[0].y) / R, { p, kind: 'hand', k: 0 }], [hypot(x - Lp.h[1].x, y - Lp.h[1].y) / R, { p, kind: 'hand', k: 1 }], [hypot(x - Lp.dz.x, y - Lp.dz.y) / (Lp.dz.r * 1.3), { p, kind: 'dash' }]];
    cand.sort((a, b) => a[0] - b[0]);
    if (cand[0][0] < 1.22) role = cand[0][1];
    else if (!S.stick) { role = { p, kind: 'stick', t0: performance.now(), x0: x, y0: y, far: 0 }; S.stick = e.pointerId; S.sx = x; S.sy = y; S.mx = S.my = 0; }
    if (!role) return;
    if (role.kind === 'hand') {
      S.h[role.k] = e.pointerId; role.t0 = performance.now();
      // si la otra mano se tocó hace muy poco (los dos pulgares o un pulgar ancho), se toma como fusión
      const o = 1 - role.k, oid = S.h[o], orole = oid != null ? ptr.get(oid) : null;
      if (orole && performance.now() - orole.t0 < 90 && S.fuse == null) { S.fuse = e.pointerId; role.kind = 'fuse'; S.h[role.k] = null; }
    }
    if (role.kind === 'fuse') { S.fuse = e.pointerId; }
    if (role.kind === 'dash') S.dash = e.pointerId;
    ptr.set(e.pointerId, role); push();
  }
  function move(e) {
    const role = ptr.get(e.pointerId); if (!role) return; e.preventDefault();
    const S = st[role.p], L = layout()[role.p], x = e.clientX, y = e.clientY;
    if (role.kind === 'stick') {
      role.far = Math.max(role.far || 0, hypot(x - role.x0, y - role.y0));
      let dx = x - S.sx, dy = y - S.sy; const d = hypot(dx, dy), max = L.R * 1.15;
      if (d > max * 1.6) { S.sx = x - dx / d * max * 1.6; S.sy = y - dy / d * max * 1.6; dx = x - S.sx; dy = y - S.sy; }
      const k = Math.min(1, hypot(dx, dy) / max); S.mx = dx / (hypot(dx, dy) || 1) * (k < 0.18 ? 0 : k); S.my = dy / (hypot(dx, dy) || 1) * (k < 0.18 ? 0 : k);
    } else if (role.kind === 'hand') {
      const o = 1 - role.k; if (S.fuse == null && (inside(L.h[o], x, y, 0.9) || inside(L.fz, x, y, 1.1))) { S.fuse = e.pointerId; role.kind = 'fuse'; S.h[role.k] = null; }
    }
    push();
  }
  function up(e) {
    const role = ptr.get(e.pointerId); if (!role) return; ptr.delete(e.pointerId);
    const S = st[role.p];
    if (role.kind === 'stick') { S.stick = null; S.mx = S.my = 0; if (performance.now() - role.t0 < 300 && (role.far || 0) < 16) tapTarget(role.p, role.x0, role.y0); }
    if (role.kind === 'hand' && S.h[role.k] === e.pointerId) S.h[role.k] = null;
    if (role.kind === 'fuse' && S.fuse === e.pointerId) S.fuse = null;
    if (role.kind === 'dash' && S.dash === e.pointerId) S.dash = null;
    push();
  }
  // tocar a un enemigo en la pantalla lo marca como objetivo unos segundos
  function tapTarget(p, sx, sy) {
    const G = Game.G, m = G.mages[p], c = Game.cam; if (!m || !m.alive || m.ctrl || G.state !== 'play') return;
    const z = c.z, wx = (sx - innerWidth / 2) / z + c.x, wy = (sy - innerHeight / 2) / z + c.y;
    let best = null, bd = Math.max(56, 40 / z);
    for (const u of G.units) { if (!m.canTarget(u)) continue; const d = Math.min(hypot(u.x - wx, u.y - 30 - wy), hypot(u.x - wx, u.y - wy)); if (d < bd) { bd = d; best = u; } }
    if (!best) { m.pin = null; return; }
    m.pin = { u: best, until: G.time + 5 }; m.pickU = best; if (m.holding || m.fuse) m.lockOn = best;
    m.face = Math.atan2(best.y - m.y, best.x - m.x); G.events.push({ type: 'retarget', who: p, x: best.x, y: best.y });
  }
  function push() {
    for (let p = 0; p < 2; p++) { const S = st[p]; Input.touch[p] = { mx: S.mx, my: S.my, h0: S.h[0] != null || S.fuse != null, h1: S.h[1] != null || S.fuse != null, dash: S.dash != null }; }
  }
  function reset() { ptr.clear(); st[0] = mk(); st[1] = mk(); push(); }
  const cv = document.getElementById('game');
  cv.addEventListener('pointerdown', down, { passive: false });
  addEventListener('pointermove', move, { passive: false });
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  // márgenes: la acción debe quedar por encima de los pulgares
  function insets() { if (!enabled) return { top: 0, bottom: 0, topPad: 0 }; const R = clamp(Math.min(innerWidth / 844, innerHeight / 390) * 33, 25, 46); return { top: 0, bottom: R * 1.3, topPad: 0 }; }
  function draw(x, G) {
    if (!enabled || G.attract || UI.current != null) return;
    const L = layout();
    for (let p = 0; p < 2; p++) {
      const Lp = L[p]; if (!Lp) continue; const m = G.mages[p], S = st[p], col = PLAYER_COLORS[p].main;
      if (!m || m.ctrl) continue;
      // palanca
      const bx = S.stick != null ? S.sx : Lp.stickHome.x, byy = S.stick != null ? S.sy : Lp.stickHome.y;
      x.globalAlpha = S.stick != null ? 0.55 : 0.28; x.strokeStyle = col; x.lineWidth = 2.5; x.beginPath(); x.arc(bx, byy, Lp.R * 1.15, 0, TAU); x.stroke();
      x.fillStyle = 'rgba(20,14,44,0.4)'; x.fill();
      x.globalAlpha = S.stick != null ? 0.85 : 0.4; x.fillStyle = col; x.beginPath(); x.arc(bx + S.mx * Lp.R * 1.15, byy + S.my * Lp.R * 1.15, Lp.R * 0.48, 0, TAU); x.fill();
      x.globalAlpha = 1;
      // manos
      for (let k = 0; k < 2; k++) {
        const b = Lp.h[k], h = m.hands[k], E = ELEMENTS[h.el], pressed = S.h[k] != null || S.fuse != null;
        x.globalAlpha = 0.9; x.fillStyle = 'rgba(14,10,34,0.75)'; x.beginPath(); x.arc(b.x, b.y, b.r + 3, 0, TAU); x.fill();
        const g = x.createRadialGradient(b.x, b.y - b.r * 0.3, 0, b.x, b.y, b.r); g.addColorStop(0, E.c1); g.addColorStop(1, E.c2);
        x.globalAlpha = pressed ? 1 : 0.78; x.fillStyle = g; x.beginPath(); x.arc(b.x, b.y, b.r * (pressed ? 0.94 : 1), 0, TAU); x.fill();
        HUD.icon(x, h.el, b.x, b.y, b.r * 0.5, E.c0);
        if (h.cd > 0) { x.fillStyle = 'rgba(8,4,20,0.6)'; x.beginPath(); x.moveTo(b.x, b.y); x.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, h.cd / 2)); x.closePath(); x.fill(); }
        if (h.hold >= 0) { const fa = m.fullAt; x.strokeStyle = h.hold >= fa ? '#fff' : E.c0; x.lineWidth = 4; x.beginPath(); x.arc(b.x, b.y, b.r + 5, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, h.hold / fa)); x.stroke(); }
        if (h.uses > 0) for (let u = 0; u < h.uses; u++) { x.fillStyle = '#fff'; x.beginPath(); x.arc(b.x - (h.uses - 1) * 5 + u * 10, b.y + b.r + 8, 3, 0, TAU); x.fill(); }
      }
      // rombo de fusión
      const f = Lp.fz, ready = m.hands[0].cd <= 0.15 && m.hands[1].cd <= 0.15, gran = m.emb >= 100;
      x.globalAlpha = ready ? 0.97 : 0.45; x.save(); x.translate(f.x, f.y); x.rotate(Math.PI / 4);
      x.fillStyle = 'rgba(14,10,34,0.8)'; x.fillRect(-f.r * 0.98, -f.r * 0.98, f.r * 1.96, f.r * 1.96);
      x.fillStyle = gran ? '#ffe9a0' : S.fuse != null ? '#fff' : '#cbb8ff'; x.fillRect(-f.r * 0.82, -f.r * 0.82, f.r * 1.64, f.r * 1.64); x.restore();
      x.fillStyle = '#2a1640'; x.font = fontB(f.r * 1.05, 900); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('✦', f.x, f.y + 1);
      // esquivar
      const d = Lp.dz; x.globalAlpha = m.dash.charges > 0 ? 0.8 : 0.35; x.fillStyle = S.dash != null ? '#fff' : '#8a7cc8'; x.beginPath(); x.arc(d.x, d.y, d.r, 0, TAU); x.fill();
      x.strokeStyle = '#1a1030'; x.lineWidth = 3; x.beginPath(); x.moveTo(d.x - d.r * 0.45, d.y + d.r * 0.25); x.lineTo(d.x + d.r * 0.1, d.y - d.r * 0.3); x.lineTo(d.x + d.r * 0.5, d.y - d.r * 0.3); x.stroke();
      x.globalAlpha = 1;
    }
  }
  return { get enabled() { return enabled; }, set enabled(v) { enabled = v; }, insets, draw, reset, layout };
})();
