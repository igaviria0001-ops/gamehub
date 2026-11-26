/* =========================================================================
   TÁCTIL — dos en un mismo teléfono (horizontal): cada uno su mitad.
   Palanca flotante en el borde de su lado; junto al otro pulgar, las dos
   manos (botones del color de su elemento) con un rombo de FUSIÓN en medio;
   deslizar de una mano a la otra también funde. Esquivar: botón pequeño
   encima. Contra la máquina, J1 usa toda la pantalla.

   Palanca 3.0 (Mundo 3):
   · Nunca se queda pegada: un dedo nuevo en tu zona de palanca toma el
     control si el anterior ya no está en la pantalla (se comprueba con la
     lista real de dedos que da el navegador), y al levantar todos los dedos
     se suelta todo aunque el celular haya perdido algún aviso.
   · Más recorrido (≈1,4 veces) con zona muerta pequeña y curva de
     respuesta: precisa cerca del centro, toda la velocidad al 70 %.
   · Si el pulgar se pasa, la base lo sigue sin saltos: devolverse es
     inmediato.
   · La ubicación de los botones se calcula solo cuando cambia la pantalla
     (antes se calculaba con cada movimiento de cada dedo).
   · Opciones: tamaño de controles, palanca flotante o fija y vibración.
   ========================================================================= */
const Touch = (() => {
  let enabled = matchMedia('(pointer: coarse)').matches, active = false;
  const ptr = new Map(), st = [mk(), mk()];
  function mk() { return { stick: null, sx: 0, sy: 0, mx: 0, my: 0, ox: 0, oy: 0, kx: 0, ky: 0, h: [null, null], fuse: null, dash: null }; }
  const netOn = () => Game.G.net && typeof NetPlay !== 'undefined' && NetPlay.on;
  const solo = () => (netOn() ? NetPlay.mine.length === 1 : Game.G.players === 1);
  const now = () => performance.now();

  /* ---------- ajustes (Opciones → Controles táctiles) ---------- */
  const CFG = Object.assign({ size: 'n', fixed: false, vib: true }, Store.get('touchCfg', {}));
  const SIZE = { s: 0.86, n: 1, l: 1.16 };
  function setCfg(k, v) { CFG[k] = v; Store.set('touchCfg', CFG); Lc = null; }
  const DEAD = 0.1, SAT = 0.7; // zona muerta y punto de toda la velocidad (fracción del recorrido)

  /* ---------- dónde va cada cosa (px de pantalla), guardado hasta que cambie la pantalla ---------- */
  let sab = 0, Lc = null, Lkey = '';
  const readSab = () => { sab = +(getComputedStyle(document.documentElement).getPropertyValue('--sab') || 0) || 0; };
  readSab();
  function layout() {
    const sw = innerWidth, sh = innerHeight, s1 = solo(), key = sw + 'x' + sh + '|' + s1 + '|' + sab + '|' + CFG.size;
    if (Lc && key === Lkey) return Lc;
    const sc = Math.min(sw / 844, sh / 390), mul = SIZE[CFG.size] || 1;
    const R = clamp(sc * 33, 25, 46) * mul, T = clamp(sc * 53, 40, 68) * mul; // R = botones · T = recorrido de la palanca
    const L = [];
    for (let p = 0; p < 2; p++) {
      if (p === 1 && s1) { L.push(null); continue; }
      const right = p === 1;
      const cx = s1 ? sw - R * 3.6 : right ? sw * 0.66 : sw * 0.34, by = sh - R * 1.45 - sab;
      const h0 = { x: cx - R * 1.45, y: by, r: R }, h1 = { x: cx + R * 1.45, y: by, r: R }, fz = { x: cx, y: by - R * 0.4, r: R * 0.56 }, dz = { x: cx, y: by - R * 1.95, r: R * 0.6 };
      const stickHome = { x: s1 ? T * 1.9 : right ? sw - T * 1.8 : T * 1.8, y: sh - T * 1.65 - sab * 0.5 };
      L.push({ h: [h0, h1], fz, dz, stickHome, R, T, x0: s1 ? 0 : right ? sw / 2 : 0, x1: s1 ? sw : right ? sw : sw / 2 });
    }
    Lkey = key; Lc = L; return L;
  }
  const inside = (b, x, y, k = 1.2) => hypot(x - b.x, y - b.y) < b.r * k;
  function owner(x) { return solo() ? 0 : x < innerWidth / 2 ? 0 : 1; }
  const buzz = ms => { if (CFG.vib && navigator.vibrate) try { navigator.vibrate(ms); } catch (_) { /* sin vibración */ } };

  // la palanca: dirección y fuerza desde la base; si el dedo se pasa del recorrido, la base lo sigue
  function stickAt(S, Lp, x, y) {
    let dx = x - S.sx, dy = y - S.sy; const d = hypot(dx, dy), T = Lp.T;
    if (d > T && !CFG.fixed) { S.sx = x - dx / d * T; S.sy = y - dy / d * T; dx = x - S.sx; dy = y - S.sy; }
    const dd = hypot(dx, dy), k = Math.min(1, dd / T);
    S.ox = dd > T ? dx / dd * T : dx; S.oy = dd > T ? dy / dd * T : dy; // dónde dibujar la perilla
    const v = k < DEAD ? 0 : Math.pow(Math.min(1, (k - DEAD) / (SAT - DEAD)), 1.2);
    S.mx = dd > 0 ? dx / dd * v : 0; S.my = dd > 0 ? dy / dd * v : 0;
  }

  /* ---------- dedos de verdad: la lista que da el navegador manda ---------- */
  // Cada vez que llega un evento táctil, cada papel (palanca, mano…) debe tener un dedo cerca de donde lo
  // vimos por última vez. El que no lo tenga es un «fantasma» (el celular perdió el aviso de soltar) y se suelta.
  let pend = null, pendT = 0;
  function release(id) {
    const role = ptr.get(id); if (!role) return; ptr.delete(id);
    const S = st[role.p];
    if (S.stick === id) { S.stick = null; S.mx = S.my = S.ox = S.oy = 0; }
    for (let k = 0; k < 2; k++) if (S.h[k] === id) S.h[k] = null;
    if (S.fuse === id) S.fuse = null;
    if (S.dash === id) S.dash = null;
  }
  function reconcile(touches, fresh) {
    const list = []; for (const t of touches) if (!fresh.has(t.identifier)) list.push(t);
    let changed = false;
    for (const [id, role] of [...ptr]) {
      if (role.kind === 'cand' || (fresh.size && role.t0 > now() - 150)) continue;
      let ok = false; for (const t of list) if (hypot(t.clientX - role.lx, t.clientY - role.ly) < 90) { ok = true; break; }
      if (!ok) { release(id); changed = true; }
    }
    return changed;
  }
  // el candidato a palanca (un dedo nuevo cayó en la zona mientras ya había palanca): si la vieja era un
  // fantasma, el nuevo toma el control; si la vieja sigue viva, el nuevo solo sirve para tocar a un enemigo
  function settle(promote) {
    if (pend == null) return; const id = pend; pend = null; const role = ptr.get(id); if (!role || role.kind !== 'cand') return;
    const S = st[role.p], L = layout()[role.p]; if (!L) return;
    const old = S.stick != null ? ptr.get(S.stick) : null;
    if (promote || !old) {
      if (S.stick != null) ptr.delete(S.stick);
      role.kind = 'stick'; S.stick = id;
      if (CFG.fixed) { S.sx = L.stickHome.x; S.sy = L.stickHome.y; } else { S.sx = role.x0; S.sy = role.y0; }
      stickAt(S, L, role.lx, role.ly);
    } else role.kind = 'tap';
    push();
  }
  addEventListener('touchstart', e => {
    if (!ptr.size) return; const fresh = new Set([...e.changedTouches].map(t => t.identifier));
    reconcile(e.touches, fresh);
    if (pend != null) { const r = ptr.get(pend), S = r && st[r.p]; settle(!(S && S.stick != null && ptr.has(S.stick))); }
    push();
  }, { passive: true, capture: true });
  const endAll = e => {
    if (e.touches.length === 0) { if (ptr.size) { ptr.clear(); st[0] = mk(); st[1] = mk(); pend = null; push(); } return; }
    if (reconcile(e.touches, new Set())) push();
  };
  addEventListener('touchend', endAll, { passive: true, capture: true });
  addEventListener('touchcancel', endAll, { passive: true, capture: true });

  /* ---------- puntero ---------- */
  function down(e) {
    if (e.pointerType === 'touch') enabled = true;
    if (!enabled || UI.current != null || Game.G.state === 'attract') return;
    if (Game.G.introT > 0) Game.skipIntro();
    active = true; e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch (_) { /* sin captura */ }
    const L = layout(), p = owner(e.clientX), Lp = L[p]; if (!Lp) return; const S = st[p], x = e.clientX, y = e.clientY, t0 = now();
    let role = null;
    // cada toque va al botón cuyo centro quede más cerca (medido según su tamaño): el rombo de fusión gana todo el hueco entre las dos manos
    const R = Lp.R, cand = [[hypot(x - Lp.fz.x, y - Lp.fz.y) / (R * 0.9), { kind: 'fuse' }], [hypot(x - Lp.h[0].x, y - Lp.h[0].y) / R, { kind: 'hand', k: 0 }], [hypot(x - Lp.h[1].x, y - Lp.h[1].y) / R, { kind: 'hand', k: 1 }], [hypot(x - Lp.dz.x, y - Lp.dz.y) / (R * 0.75), { kind: 'dash' }]];
    cand.sort((a, b) => a[0] - b[0]);
    if (cand[0][0] < 1.22) role = Object.assign({ p, t0, x0: x, y0: y, lx: x, ly: y }, cand[0][1]);
    else {
      const home = Lp.stickHome, near = !CFG.fixed || hypot(x - home.x, y - home.y) < Lp.T * 2.4;
      role = { p, kind: near ? 'stick' : 'tap', t0, x0: x, y0: y, lx: x, ly: y, far: 0 };
      if (near && S.stick != null && ptr.has(S.stick)) {
        // ya hay palanca: ¿dedo nuevo de verdad o la anterior quedó pegada? lo decide el siguiente evento táctil
        if (pend != null) settle(true);
        role.kind = 'cand'; pend = e.pointerId; pendT = t0; setTimeout(() => { if (pend === e.pointerId) settle(true); }, 80);
      } else if (near) {
        S.stick = e.pointerId;
        if (CFG.fixed) { S.sx = home.x; S.sy = home.y; } else { S.sx = x; S.sy = y; }
        S.mx = S.my = 0; stickAt(S, Lp, x, y);
      }
    }
    if (role.kind === 'hand') {
      S.h[role.k] = e.pointerId;
      // si la otra mano se tocó hace muy poco (los dos pulgares o un pulgar ancho), se toma como fusión
      const o = 1 - role.k, oid = S.h[o], orole = oid != null ? ptr.get(oid) : null;
      if (orole && t0 - orole.t0 < 90 && S.fuse == null) { S.fuse = e.pointerId; role.kind = 'fuse'; S.h[role.k] = null; }
    }
    if (role.kind === 'fuse') { S.fuse = e.pointerId; buzz(12); }
    if (role.kind === 'dash') { S.dash = e.pointerId; buzz(8); }
    ptr.set(e.pointerId, role); push();
  }
  function move(e) {
    const role = ptr.get(e.pointerId); if (!role) return; if (e.cancelable) e.preventDefault();
    const S = st[role.p], L = layout()[role.p], x = e.clientX, y = e.clientY; if (!L) return;
    role.lx = x; role.ly = y;
    if (role.kind === 'stick' || role.kind === 'tap' || role.kind === 'cand') role.far = Math.max(role.far || 0, hypot(x - role.x0, y - role.y0));
    if (role.kind === 'stick' && S.stick === e.pointerId) stickAt(S, L, x, y);
    else if (role.kind === 'hand') {
      const o = 1 - role.k; if (S.fuse == null && (inside(L.h[o], x, y, 0.9) || inside(L.fz, x, y, 1.1))) { S.fuse = e.pointerId; role.kind = 'fuse'; S.h[role.k] = null; buzz(12); }
    }
    push();
  }
  function up(e) {
    const role = ptr.get(e.pointerId); if (!role) return;
    if (pend === e.pointerId) pend = null;
    release(e.pointerId);
    if ((role.kind === 'stick' || role.kind === 'tap' || role.kind === 'cand') && now() - role.t0 < 300 && (role.far || 0) < 16) tapTarget(role.p, role.x0, role.y0);
    push();
  }
  // tocar a un enemigo en la pantalla lo marca como objetivo unos segundos
  function tapTarget(p, sx, sy) {
    const li = p; if (netOn()) p = NetPlay.mine[p]; if (p == null) return;
    const G = Game.G, m = G.mages[p], c = Game.cam; if (!m || !m.alive || m.ctrl || G.state !== 'play') return;
    const z = c.z, wx = (sx - innerWidth / 2) / z + c.x, wy = (sy - innerHeight / 2) / z + c.y;
    let best = null, bd = Math.max(56, 40 / z);
    for (const u of G.units) { if (!m.canTarget(u)) continue; const d = Math.min(hypot(u.x - wx, u.y - 30 - wy), hypot(u.x - wx, u.y - wy)); if (d < bd) { bd = d; best = u; } }
    if (!best) { m.pin = null; return; }
    m.pin = { u: best, until: G.time + 5 }; m.pickU = best; if (m.holding || m.fuse) m.lockOn = best; if (netOn() && NetPlay.isClient) NetGame.pinFrom(li, best);
    m.face = Math.atan2(best.y - m.y, best.x - m.x); G.events.push({ type: 'retarget', who: p, x: best.x, y: best.y });
  }
  function push() {
    for (let p = 0; p < 2; p++) { const S = st[p]; Input.touch[p] = { mx: S.mx, my: S.my, h0: S.h[0] != null || S.fuse != null, h1: S.h[1] != null || S.fuse != null, dash: S.dash != null }; }
  }
  function reset() { ptr.clear(); pend = null; st[0] = mk(); st[1] = mk(); push(); }
  const cv = document.getElementById('game');
  cv.addEventListener('pointerdown', down, { passive: false });
  addEventListener('pointermove', move, { passive: false });
  if ('onpointerrawupdate' in window) addEventListener('pointerrawupdate', move); // posición más fresca, donde el navegador la da
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  cv.addEventListener('lostpointercapture', e => { if (ptr.has(e.pointerId)) { release(e.pointerId); push(); } });
  // al cambiar de pantalla, de aplicación o de orientación: todo suelto y los botones recalculados
  const relayout = () => { Lc = null; readSab(); };
  addEventListener('resize', relayout); addEventListener('orientationchange', () => { relayout(); reset(); });
  addEventListener('blur', reset); addEventListener('pagehide', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });

  // márgenes: la acción debe quedar por encima de los pulgares
  function insets() { if (!enabled) return { top: 0, bottom: 0, topPad: 0 }; const R = clamp(Math.min(innerWidth / 844, innerHeight / 390) * 33, 25, 46) * (SIZE[CFG.size] || 1); return { top: 0, bottom: R * 1.3, topPad: 0 }; }
  function draw(x, G) {
    if (!enabled || G.attract || UI.current != null) return;
    const L = layout();
    for (let p = 0; p < 2; p++) {
      const Lp = L[p]; if (!Lp) continue; const seat = netOn() ? NetPlay.mine[p] : p, m = G.mages[seat], S = st[p], col = (PLAYER_COLORS[seat] || PLAYER_COLORS[p]).main;
      if (!m || m.ctrl) continue;
      // palanca (la perilla se dibuja suave; la dirección que llega al mago no se suaviza)
      S.kx += (S.ox - S.kx) * 0.6; S.ky += (S.oy - S.ky) * 0.6;
      const on = S.stick != null, T = Lp.T, bx = on ? S.sx : Lp.stickHome.x, byy = on ? S.sy : Lp.stickHome.y;
      x.globalAlpha = on ? 0.55 : 0.28; x.strokeStyle = col; x.lineWidth = 2.5; x.beginPath(); x.arc(bx, byy, T, 0, TAU); x.stroke();
      x.fillStyle = 'rgba(20,14,44,0.4)'; x.fill();
      if (on) { x.globalAlpha = 0.22; x.lineWidth = 1.5; x.beginPath(); x.arc(bx, byy, T * SAT, 0, TAU); x.stroke(); }
      x.globalAlpha = on ? 0.85 : 0.4; x.fillStyle = col; x.beginPath(); x.arc(bx + S.kx, byy + S.ky, Lp.R * 0.5, 0, TAU); x.fill();
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
  // para las pruebas: simula que el celular perdió el aviso de soltar (la palanca queda empujando)
  function _ghost(p, mx, my) { const id = 990000 + p, L = layout()[p]; if (!L) return; const S = st[p]; S.stick = id; S.sx = L.stickHome.x; S.sy = L.stickHome.y; S.mx = mx; S.my = my; ptr.set(id, { p, kind: 'stick', t0: now() - 5000, x0: S.sx, y0: S.sy, lx: S.sx + mx * L.T, ly: S.sy + my * L.T, far: 99 }); push(); }
  return { get enabled() { return enabled; }, set enabled(v) { enabled = v; }, insets, draw, reset, layout, cfg: CFG, setCfg, _ghost, get _n() { return ptr.size; } };
})();
