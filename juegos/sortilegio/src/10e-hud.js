/* =========================================================================
   HUD — paneles de cada mago (retrato, vida, manos con su elemento y su
   espera, Embrujo), marcador de rondas y tiempo, cuenta regresiva y carteles.
   ========================================================================= */
const HUD = (() => {
  let u = 1;
  const unit = () => u;
  const KEY_HINT = i => [keyName(KEYMAP[i].h0[0]), keyName(KEYMAP[i].h1[0]), keyName(KEYMAP[i].dash[0])];
  // iconos de elemento (blancos o del color dado)
  function icon(x, el, X, Y, r, col = '#fff') {
    x.save(); x.translate(X, Y); x.fillStyle = col; x.strokeStyle = col; x.lineCap = 'round'; x.lineJoin = 'round';
    switch (el) {
      case 'fire': x.beginPath(); x.moveTo(0, -r); x.bezierCurveTo(r * 0.9, -r * 0.2, r * 0.8, r * 0.8, 0, r * 0.9); x.bezierCurveTo(-r * 0.8, r * 0.8, -r * 0.9, -r * 0.1, -r * 0.2, -r * 0.4); x.quadraticCurveTo(-r * 0.1, 0, 0, -r); x.fill(); break;
      case 'water': x.beginPath(); x.moveTo(0, -r); x.bezierCurveTo(r * 0.3, -r * 0.4, r * 0.75, 0, r * 0.75, r * 0.3); x.arc(0, r * 0.3, r * 0.75, 0, Math.PI); x.bezierCurveTo(-r * 0.75, 0, -r * 0.3, -r * 0.4, 0, -r); x.fill(); break;
      case 'wind': x.lineWidth = r * 0.22; for (const [y, l] of [[-0.45, 0.9], [0.05, 1.1], [0.55, 0.7]]) { x.beginPath(); x.moveTo(-r * 0.9, y * r); x.lineTo(r * (l - 0.5), y * r); x.arc(r * (l - 0.5), y * r - r * 0.22, r * 0.22, Math.PI / 2, -Math.PI * 0.9, true); x.stroke(); } break;
      case 'earth': x.beginPath(); x.moveTo(-r * 0.9, r * 0.7); x.lineTo(-r * 0.35, -r * 0.5); x.lineTo(0, 0); x.lineTo(r * 0.35, -r * 0.85); x.lineTo(r * 0.95, r * 0.7); x.closePath(); x.fill(); break;
      case 'plant': x.beginPath(); x.moveTo(-r * 0.7, r * 0.8); x.bezierCurveTo(-r * 0.9, -r * 0.4, r * 0.2, -r, r * 0.85, -r * 0.85); x.bezierCurveTo(r * 0.8, 0, r * 0.1, r * 0.7, -r * 0.7, r * 0.8); x.fill(); break;
      case 'bolt': x.beginPath(); x.moveTo(r * 0.25, -r); x.lineTo(-r * 0.55, r * 0.1); x.lineTo(-r * 0.02, r * 0.1); x.lineTo(-r * 0.3, r); x.lineTo(r * 0.6, -r * 0.15); x.lineTo(r * 0.05, -r * 0.15); x.closePath(); x.fill(); break;
      case 'light': x.beginPath(); x.arc(0, 0, r * 0.42, 0, TAU); x.fill(); x.lineWidth = r * 0.2; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, r1 = r * (k % 2 ? 0.86 : 1.02); x.beginPath(); x.moveTo(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62); x.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); x.stroke(); } break;
      case 'shadow': x.beginPath(); x.arc(0, 0, r * 0.92, 0.75, TAU - 0.75); x.arc(r * 0.42, 0, r * 0.66, TAU - 1.15, 1.15, true); x.closePath(); x.fill(); x.beginPath(); x.arc(r * 0.48, -r * 0.05, r * 0.16, 0, TAU); x.fill(); break;
    }
    x.restore();
  }
  function rr(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
  function hand(x, m, k, X, Y, R, key) {
    const h = m.hands[k], E = ELEMENTS[h.el], S = SPELLS[h.el][0];
    x.fillStyle = 'rgba(12,8,30,0.85)'; x.beginPath(); x.arc(X, Y, R + 3, 0, TAU); x.fill();
    const g = x.createRadialGradient(X, Y - R * 0.3, 0, X, Y, R); g.addColorStop(0, E.c1); g.addColorStop(1, E.c2); x.fillStyle = g; x.beginPath(); x.arc(X, Y, R, 0, TAU); x.fill();
    icon(x, h.el, X, Y, R * 0.6, E.c0);
    const cdMax = m.hands[k].cd > 0 ? Math.max(m.hands[k].cd, m._cdMax ? m._cdMax[k] || 0 : 0) : 0;
    if (h.cd > 0) { m._cdMax = m._cdMax || [0, 0]; if (h.cd > m._cdMax[k]) m._cdMax[k] = h.cd; const f = h.cd / m._cdMax[k]; x.fillStyle = 'rgba(8,4,20,0.7)'; x.beginPath(); x.moveTo(X, Y); x.arc(X, Y, R, -Math.PI / 2, -Math.PI / 2 + TAU * f); x.closePath(); x.fill(); }
    else if (m._cdMax) m._cdMax[k] = 0;
    if (h.hold >= 0) { const fa = m.fullAt; x.strokeStyle = h.hold >= fa ? '#fff' : E.c0; x.lineWidth = 3; x.beginPath(); x.arc(X, Y, R + 5, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, h.hold / fa)); x.stroke(); }
    if (h.deny > 0) { x.strokeStyle = `rgba(255,90,90,${h.deny / 0.3})`; x.lineWidth = 3; x.beginPath(); x.arc(X, Y, R + 4, 0, TAU); x.stroke(); }
    if (h.uses > 0) { for (let p = 0; p < h.uses; p++) { x.fillStyle = '#fff'; x.beginPath(); x.arc(X - (h.uses - 1) * 4 + p * 8, Y + R + 7, 2.4, 0, TAU); x.fill(); } }
    if (key) { const bx = X + R * 0.72, by = Y + R * 0.72, br = Math.max(7, R * 0.42); x.fillStyle = 'rgba(12,8,30,0.92)'; x.beginPath(); x.arc(bx, by, br, 0, TAU); x.fill(); x.font = fontB(Math.max(8, R * 0.5), 900); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.fillText(key, bx, by + 0.5); }
  }
  function panel(x, G, m, i, sw, sh) {
    const right = i === 1, W = 300 * u, X = right ? sw - 14 * u - W : 14 * u, Y = 12 * u + (getInsets().topPad || 0), col = PLAYER_COLORS[i];
    const touch = isTouch();
    x.save();
    x.fillStyle = 'rgba(14,10,34,0.62)'; rr(x, X, Y, W, 84 * u, 16 * u); x.fill();
    x.strokeStyle = 'rgba(232,196,110,0.5)'; x.lineWidth = 1.5; x.stroke();
    const PR = 28 * u, px = right ? X + W - 14 * u - PR : X + 14 * u + PR, py = Y + 42 * u;
    ArtMage.portrait(x, m.cid, px, py, PR, G.time, m.skin || 0);
    x.strokeStyle = '#e8c46e'; x.lineWidth = 2.5 * u; x.beginPath(); x.arc(px, py, PR, 0, TAU); x.stroke();
    x.strokeStyle = col.main; x.lineWidth = 2 * u; x.beginPath(); x.arc(px, py, PR + 3 * u, 0, TAU); x.stroke();
    if (!m.alive) { x.fillStyle = 'rgba(10,6,20,0.6)'; x.beginPath(); x.arc(px, py, PR, 0, TAU); x.fill(); }
    // nombre y vida
    const bx = right ? X + 14 * u : X + 14 * u + PR * 2 + 12 * u, bw = W - PR * 2 - 40 * u;
    x.font = fontT(17 * u); x.textBaseline = 'alphabetic'; x.textAlign = right ? 'right' : 'left'; x.fillStyle = col.main;
    const tag = G.players === 1 && i === 1 ? 'Máquina' : col.name;
    x.fillText(`${tag} · ${m.C.name}`, right ? bx + bw : bx, Y + 22 * u);
    const hpY = Y + 30 * u, hpH = 11 * u;
    m._trail = m._trail == null ? m.hp : Math.max(m.hp, m._trail - 40 / 60);
    x.fillStyle = 'rgba(0,0,0,0.5)'; rr(x, bx, hpY, bw, hpH, hpH / 2); x.fill();
    const f = m.hp / m.maxHp, tf = m._trail / m.maxHp, dir = right ? -1 : 1, sx = right ? bx + bw : bx;
    x.fillStyle = 'rgba(255,255,255,0.7)'; rr(x, right ? sx - bw * tf : sx, hpY, bw * tf, hpH, hpH / 2); x.fill();
    const g = x.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, f < 0.3 ? '#ff5a4a' : col.dark); g.addColorStop(1, f < 0.3 ? '#ff9a6a' : col.main);
    x.fillStyle = g; if (f > 0) { rr(x, right ? sx - bw * f : sx, hpY, Math.max(hpH, bw * f), hpH, hpH / 2); x.fill(); }
    x.font = fontB(10 * u, 900); x.fillStyle = '#fff'; x.textAlign = right ? 'left' : 'right'; x.textBaseline = 'middle'; x.fillText(Math.ceil(m.hp), right ? bx + 6 * u : bx + bw - 6 * u, hpY + hpH / 2 + 0.5);
    // embrujo
    const eY = hpY + hpH + 5 * u, eH = 8 * u, ef = m.emb / 100, full = m.emb >= 100, now = performance.now() / 1000;
    if (full) { x.save(); x.shadowColor = 'rgba(255,210,110,0.95)'; x.shadowBlur = (10 + 8 * Math.sin(now * 6)) * u; x.fillStyle = 'rgba(255,210,110,0.9)'; rr(x, bx - 1, eY - 1, bw + 2, eH + 2, eH / 2 + 1); x.fill(); x.restore(); }
    x.fillStyle = 'rgba(10,6,24,0.75)'; rr(x, bx, eY, bw, eH, eH / 2); x.fill(); x.strokeStyle = 'rgba(232,196,110,0.55)'; x.lineWidth = 1; x.stroke();
    if (ef > 0) {
      const eg = x.createLinearGradient(right ? sx : sx, 0, right ? sx - bw : sx + bw, 0);
      if (full) { const p = 0.5 + 0.5 * Math.sin(now * 8); eg.addColorStop(0, '#fff6d0'); eg.addColorStop(0.5, `rgb(255,${200 + p * 40},${90 + p * 60})`); eg.addColorStop(1, '#fff6d0'); }
      else { eg.addColorStop(0, '#6a3ac0'); eg.addColorStop(1, '#ffd36a'); }
      x.fillStyle = eg; rr(x, right ? sx - bw * ef : sx, eY, Math.max(eH, bw * ef), eH, eH / 2); x.fill();
      // brillo que recorre la barra
      const sh = ((now * 0.6) % 1) * bw * ef; x.save(); rr(x, right ? sx - bw * ef : sx, eY, Math.max(eH, bw * ef), eH, eH / 2); x.clip(); x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(right ? sx - sh - 10 * u : sx + sh, eY, 10 * u, eH); x.restore();
    }
    x.strokeStyle = 'rgba(10,6,24,0.6)'; x.lineWidth = 1; for (let k = 1; k < 4; k++) { const tx = bx + bw * k / 4; x.beginPath(); x.moveTo(tx, eY + 1); x.lineTo(tx, eY + eH - 1); x.stroke(); }
    x.font = fontB(7 * u, 900); x.textBaseline = 'middle'; x.textAlign = right ? 'right' : 'left'; x.fillStyle = full ? '#3a2006' : 'rgba(255,255,255,0.75)'; x.fillText('EMBRUJO', right ? bx + bw - 6 * u : bx + 6 * u, eY + eH / 2 + 0.5);
    if (full) { x.font = fontB(10 * u, 900); x.fillStyle = `rgba(255,233,160,${0.75 + 0.25 * Math.sin(now * 8)})`; x.textAlign = right ? 'right' : 'left'; x.fillText('✦ GRAN SORTILEGIO LISTO · funde las dos manos', right ? bx + bw : bx, eY + eH + 9 * u); }
    // manos y esquive
    const keys = touch || m.ctrl ? [null, null, null] : KEY_HINT(i), HR = 13 * u, hy = Y + 84 * u + 8 * u + HR;
    const hx0 = right ? X + W - 20 * u - HR : X + 20 * u + HR;
    for (let k = 0; k < 2; k++) hand(x, m, k, hx0 + dir * k * (HR * 2 + 12 * u), hy, HR, keys[k]);
    // esquive
    const dX = hx0 + dir * 2 * (HR * 2 + 12 * u), dR = HR * 0.72;
    x.fillStyle = 'rgba(12,8,30,0.85)'; x.beginPath(); x.arc(dX, hy, dR + 2, 0, TAU); x.fill();
    x.fillStyle = m.dash.charges > 0 ? '#8a7cc8' : '#3a3458'; x.beginPath(); x.arc(dX, hy, dR, 0, TAU); x.fill();
    x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); x.moveTo(dX - dR * 0.5, hy + dR * 0.3); x.lineTo(dX + dR * 0.1, hy - dR * 0.3); x.lineTo(dX + dR * 0.5, hy - dR * 0.3); x.stroke();
    if (m.dash.charges < (m.dashN || 2) && m.dash.cd > 0) { x.strokeStyle = 'rgba(220,210,255,0.8)'; x.lineWidth = 2; x.beginPath(); x.arc(dX, hy, dR + 3, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - m.dash.cd / m.dashMax)); x.stroke(); }
    for (let c = 0; c < (m.dashN || 2); c++) { x.fillStyle = c < m.dash.charges ? '#e6dcff' : 'rgba(255,255,255,0.18)'; x.beginPath(); x.arc(dX - 4 + c * 8, hy + dR + 5, 2.4, 0, TAU); x.fill(); }
    if (m.racha >= 2 && G.time - m.rachaT < 2.4) { x.font = fontB(12 * u, 900); x.textAlign = 'center'; x.fillStyle = `rgba(255,${220 - m.racha * 20},120,${1 - (G.time - m.rachaT) / 2.4 * 0.6})`; x.fillText(`RACHA ×${Math.min(m.racha, 6)}`, right ? X + W - 60 * u : X + 60 * u, Y + 84 * u + 46 * u); }
    if (m.buff.haste > 0 || m.buff.shield > 0) { x.font = fontB(10.5 * u, 900); x.textAlign = right ? 'right' : 'left'; x.fillStyle = '#9ff0ff'; x.fillText((m.buff.haste > 0 ? 'PRISA ' + Math.ceil(m.buff.haste) + ' ' : '') + (m.buff.shield > 0 ? 'ESCUDO ' + Math.ceil(m.buff.shield) : ''), right ? X + W - 14 * u : X + 14 * u, Y + 84 * u + 60 * u); }
    if (keys[2]) { const bx = dX + dR * 0.75, by = hy + dR * 0.75, br = Math.max(6, HR * 0.38); x.fillStyle = 'rgba(12,8,30,0.92)'; x.beginPath(); x.arc(bx, by, br, 0, TAU); x.fill(); x.font = fontB(Math.max(7, HR * 0.42), 900); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.fillText(keys[2].length > 2 ? keys[2][0] : keys[2], bx, by + 0.5); }
    // fusión que harían las dos manos
    const a = m.hands[0].el, b = m.hands[1].el, fn = a === b ? 'Doble ' + SPELLS[a][1].name.toLowerCase() : FUSIONS[fuseKey(a, b)].name;
    x.font = fontB(10.5 * u, 800); x.textAlign = right ? 'right' : 'left'; x.textBaseline = 'middle'; x.fillStyle = m.emb >= 100 ? '#ffe9a0' : 'rgba(230,220,255,0.8)';
    x.fillText((m.emb >= 100 ? '✦ ' : '') + fn, dX + dir * (dR + 10 * u), hy);
    x.restore();
  }
  // al borde de caer: latido rojo en el lado de ese jugador
  let beatT = 0;
  function lowHp(x, G, sw, sh) {
    if (G.state !== 'play' || G.mode === 'camp' || G.mode === 'school') return;
    const now = performance.now() / 1000; let any = false;
    G.mages.forEach((m, i) => {
      if (!m.alive || m.ctrl || m.hp / m.maxHp > 0.25) return; any = true;
      const b = Math.pow(Math.max(0, Math.sin(now * 7.5)), 6), side = i === 0 ? 0 : sw, g = x.createRadialGradient(side, sh / 2, sh * 0.2, side, sh / 2, sw * 0.55);
      g.addColorStop(0, 'rgba(255,40,40,0)'); g.addColorStop(1, `rgba(200,10,20,${0.16 + b * 0.22})`); x.fillStyle = g; x.fillRect(i === 0 ? 0 : sw / 2, 0, sw / 2, sh);
    });
    if (any && now - beatT > 0.84) { beatT = now; Sound.play('beat'); }
  }
  /* ---------- Gran Sortilegio: momento de cine ----------
     Concentración: se apaga el mundo salvo un foco sobre el mago, franjas de cine y una banda en diagonal (estilo «súper»)
     con el mago, «¡GRAN SORTILEGIO!» y el nombre. Al soltarlo: destello blanco, líneas de velocidad desde el mago y salida. */
  function granCine(x, G, sw, sh) {
    const g = G.granFx; if (!g) return;
    const rel = g.rel >= 0 ? g.t - g.rel : -1, END = 0.55;
    if ((rel >= 0 && rel > END) || g.t > 2.4) { G.granFx = null; return; }
    const m = G.mages[g.who], cam = Game.cam, z = cam.z, col = PLAYER_COLORS[g.who] ? PLAYER_COLORS[g.who] : PLAYER_COLORS[0];
    const X = m ? sw / 2 + (m.x - cam.x) * z + cam.sx : sw / 2, Y = m ? sh / 2 + (m.y - 46 - cam.y) * z + cam.sy : sh / 2;
    const inn = smooth(clamp(g.t / 0.16, 0, 1)), out = rel >= 0 ? smooth(clamp(rel / 0.32, 0, 1)) : 0, a = inn * (1 - out), dir = g.who === 1 ? -1 : 1;
    x.save();
    // el mundo se apaga alrededor del mago
    const sp = x.createRadialGradient(X, Y, 60 * z, X, Y, Math.max(sw, sh) * 0.75); sp.addColorStop(0, 'rgba(6,3,14,0)'); sp.addColorStop(0.35, `rgba(6,3,14,${0.45 * a})`); sp.addColorStop(1, `rgba(6,3,14,${0.8 * a})`); x.fillStyle = sp; x.fillRect(0, 0, sw, sh);
    // franjas de cine
    const bh = sh * 0.085 * (rel >= 0 ? 1 - out : inn); x.fillStyle = '#05030a'; x.fillRect(0, 0, sw, bh); x.fillRect(0, sh - bh, sw, bh);
    // banda en diagonal
    const bandIn = smooth(clamp(g.t / 0.2, 0, 1)), bandOut = rel >= 0 ? smooth(clamp(rel / 0.2, 0, 1)) : 0;
    if (bandOut < 1) {
      const H = Math.max(86, sh * 0.2), cy = sh * 0.36, sk = H * 0.5, off = (1 - bandIn) * -sw * 1.2 * dir + bandOut * sw * 1.2 * dir;
      x.save(); x.translate(off, 0);
      x.beginPath(); x.moveTo(-40, cy - H / 2 + sk * 0.3); x.lineTo(sw + 40, cy - H / 2 - sk * 0.3); x.lineTo(sw + 40, cy + H / 2 - sk * 0.3); x.lineTo(-40, cy + H / 2 + sk * 0.3); x.closePath();
      const bg = x.createLinearGradient(0, cy - H / 2, 0, cy + H / 2); bg.addColorStop(0, col.deep || '#2a1640'); bg.addColorStop(0.5, '#140a26'); bg.addColorStop(1, '#05030a'); x.fillStyle = bg; x.globalAlpha = 0.94; x.fill(); x.globalAlpha = 1;
      x.save(); x.clip();
      // líneas de velocidad dentro de la banda
      x.globalCompositeOperation = 'lighter'; for (let k = 0; k < 22; k++) { const ly = cy - H / 2 + hash2(k, 3) * H, lx = ((hash2(k, 5) * sw * 1.4 - g.t * 2600 * dir) % (sw * 1.4) + sw * 1.4) % (sw * 1.4) - sw * 0.2, ln = 80 + hash2(k, 7) * 220; x.strokeStyle = `rgba(${k % 3 ? '255,233,160' : '255,255,255'},${0.12 + hash2(k, 9) * 0.25})`; x.lineWidth = 1 + hash2(k, 11) * 2.5; x.beginPath(); x.moveTo(lx, ly); x.lineTo(lx + ln, ly - ln * 0.06); x.stroke(); }
      x.globalCompositeOperation = 'source-over';
      // el mago grande en un extremo de la banda
      if (m) { const hx = dir > 0 ? sw * 0.17 : sw * 0.83, hs = H / 52; ArtMage.hero(x, m.cid, hx, cy + H * 1.25, hs, performance.now() / 1000, dir, m.skin || 0, 1); }
      x.restore();
      x.strokeStyle = '#ffe9a0'; x.lineWidth = 3; x.beginPath(); x.moveTo(-40, cy - H / 2 + sk * 0.3); x.lineTo(sw + 40, cy - H / 2 - sk * 0.3); x.moveTo(-40, cy + H / 2 + sk * 0.3); x.lineTo(sw + 40, cy + H / 2 - sk * 0.3); x.stroke();
      x.strokeStyle = col.main; x.lineWidth = 1.5; x.beginPath(); x.moveTo(-40, cy - H / 2 + sk * 0.3 + 6); x.lineTo(sw + 40, cy - H / 2 - sk * 0.3 + 6); x.moveTo(-40, cy + H / 2 + sk * 0.3 - 6); x.lineTo(sw + 40, cy + H / 2 - sk * 0.3 - 6); x.stroke();
      // textos
      const tx = dir > 0 ? sw * 0.6 : sw * 0.4, pulse = 1 + 0.04 * Math.sin(g.t * 18);
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = fontB(Math.max(11, 15 * u), 900); x.fillStyle = col.main; x.fillText((G.players === 1 && g.who === 1 && G.mode !== 'camp' ? 'LA MÁQUINA' : `JUGADOR ${g.who + 1}`) + (m ? ' · ' + CHARS[m.cid].name.toUpperCase() : ''), tx, cy - H * 0.3);
      x.save(); x.translate(tx, cy - H * 0.02); x.scale(pulse, pulse); x.font = fontT(Math.max(28, 52 * u)); x.lineWidth = 7 * u; x.strokeStyle = 'rgba(30,14,4,0.95)'; x.strokeText('¡GRAN SORTILEGIO!', 0, 0);
      const tg = x.createLinearGradient(0, -26 * u, 0, 26 * u); tg.addColorStop(0, '#fff6d0'); tg.addColorStop(0.5, '#ffd36a'); tg.addColorStop(1, '#b0701c'); x.fillStyle = tg; x.fillText('¡GRAN SORTILEGIO!', 0, 0); x.restore();
      x.font = fontT(Math.max(15, 24 * u)); x.lineWidth = 5 * u; x.strokeStyle = 'rgba(10,4,20,0.9)'; x.strokeText(g.name, tx, cy + H * 0.3); x.fillStyle = '#fff'; x.fillText(g.name, tx, cy + H * 0.3);
      x.restore();
    }
    // al soltarlo: destello y líneas de velocidad que salen del mago
    if (rel >= 0) {
      const fl = Math.max(0, 1 - rel / 0.3); if (fl > 0) { x.fillStyle = `rgba(255,248,225,${0.75 * fl * fl})`; x.fillRect(0, 0, sw, sh); }
      const lk = Math.max(0, 1 - rel / 0.45); if (lk > 0) { x.save(); x.globalCompositeOperation = 'lighter'; for (let k = 0; k < 40; k++) { const an = hash2(k, 21) * TAU, r0 = (90 + rel * 900) * (0.6 + hash2(k, 23) * 0.8), r1 = r0 + 60 + hash2(k, 25) * 160; x.strokeStyle = `rgba(255,${200 + (k % 3) * 20},140,${0.6 * lk})`; x.lineWidth = 1.5 + hash2(k, 27) * 3; x.beginPath(); x.moveTo(X + Math.cos(an) * r0, Y + Math.sin(an) * r0); x.lineTo(X + Math.cos(an) * r1, Y + Math.sin(an) * r1); x.stroke(); } x.restore(); }
    }
    x.restore();
  }
  /* ---------- presentación «VS» antes del duelo ---------- */
  function intro(x, G, sw, sh) {
    const T = G.introMax || 2.7, p = 1 - G.introT / T, t = performance.now() / 1000;
    const inn = smooth(clamp(p / 0.16, 0, 1)), out = smooth(clamp((p - 0.86) / 0.14, 0, 1)), cx = sw / 2;
    x.save(); x.globalAlpha = 1 - out;
    x.fillStyle = 'rgba(4,3,12,0.92)'; x.fillRect(0, 0, sw, sh);
    const sl = sw * 0.07; // inclinación del corte
    for (let k = 0; k < 2; k++) {
      const m = G.mages[k], dir = k === 0 ? -1 : 1, off = (1 - inn) * sw * 0.6 * dir;
      x.save(); x.beginPath();
      if (k === 0) { x.moveTo(off, 0); x.lineTo(cx + sl + off - 4, 0); x.lineTo(cx - sl + off - 4, sh); x.lineTo(off, sh); }
      else { x.moveTo(cx + sl + off + 4, 0); x.lineTo(sw + off, 0); x.lineTo(sw + off, sh); x.lineTo(cx - sl + off + 4, sh); }
      x.closePath(); x.clip();
      const pw = sw * 0.56, px0 = k === 0 ? off - sw * 0.02 : sw - pw + off + sw * 0.02;
      x.translate(px0, 0); ArtMage.showcase(x, m.cid, pw, sh, t + k * 2.3, m.skin || 0); x.restore();
      // nombre
      const C = CHARS[m.cid], col = PLAYER_COLORS[k].main, nx = k === 0 ? sw * 0.25 + off : sw * 0.75 + off;
      x.textAlign = 'center'; x.textBaseline = 'alphabetic';
      x.font = fontB(15 * u, 900); x.fillStyle = col; x.fillText(G.players === 1 && k === 1 ? 'LA MÁQUINA' : `JUGADOR ${k + 1}`, nx, sh - 96 * u);
      x.font = fontT(58 * u); x.lineWidth = 6 * u; x.strokeStyle = 'rgba(8,4,20,0.9)'; x.strokeText(C.name, nx, sh - 40 * u); x.fillStyle = '#ffe9a0'; x.fillText(C.name, nx, sh - 40 * u);
      x.font = fontB(14 * u, 700); x.fillStyle = 'rgba(230,220,255,0.85)'; x.fillText(C.title, nx, sh - 18 * u);
    }
    { const bg = x.createLinearGradient(0, sh - 140 * u, 0, sh); bg.addColorStop(0, 'rgba(4,3,12,0)'); bg.addColorStop(1, 'rgba(4,3,12,0.88)'); x.fillStyle = bg; x.fillRect(0, sh - 140 * u, sw, 140 * u); }
    // filo dorado del corte
    x.strokeStyle = '#e8c46e'; x.lineWidth = 3 * u; x.shadowColor = 'rgba(255,210,120,0.9)'; x.shadowBlur = 18 * u; x.globalAlpha = (1 - out) * inn;
    x.beginPath(); x.moveTo(cx + sl, 0); x.lineTo(cx - sl, sh); x.stroke(); x.shadowBlur = 0;
    // VS
    const vp = clamp((p - 0.14) / 0.12, 0, 1), vs = vp < 1 ? 2.2 - 1.2 * smooth(vp) : 1 + 0.04 * Math.sin(t * 6);
    if (vp > 0) {
      x.globalAlpha = (1 - out) * vp; x.save(); x.translate(cx, sh * 0.47); x.scale(vs, vs);
      const g = x.createRadialGradient(0, 0, 0, 0, 0, 70 * u); g.addColorStop(0, 'rgba(255,220,140,0.55)'); g.addColorStop(1, 'rgba(255,220,140,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 70 * u, 0, TAU); x.fill();
      x.font = fontT(84 * u); x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 8 * u; x.strokeStyle = 'rgba(30,14,4,0.95)'; x.strokeText('VS', 0, 0);
      const tg = x.createLinearGradient(0, -40 * u, 0, 40 * u); tg.addColorStop(0, '#fff6d0'); tg.addColorStop(0.5, '#ffd36a'); tg.addColorStop(1, '#b0701c'); x.fillStyle = tg; x.fillText('VS', 0, 0); x.restore();
    }
    // escenario y modo
    const ap = clamp((p - 0.3) / 0.15, 0, 1);
    if (ap > 0) {
      x.globalAlpha = (1 - out) * ap; x.textAlign = 'center'; x.textBaseline = 'middle';
      const label = (G.copaTag ? G.copaTag + ' · ' : '') + MODES[G.mode].name + ' · ' + G.A.name;
      x.font = fontB(15 * u, 900); const w = x.measureText(label).width + 40 * u, y = 34 * u + (getInsets().topPad || 0) + (isTouch() ? 46 : 0);
      x.fillStyle = 'rgba(10,6,28,0.8)'; x.strokeStyle = 'rgba(232,196,110,0.6)'; x.lineWidth = 1.5; x.beginPath(); x.roundRect(cx - w / 2, y - 16 * u, w, 32 * u, 16 * u); x.fill(); x.stroke();
      x.fillStyle = '#ffe9a0'; x.fillText(label, cx, y + 1);
      if (G.A.sub) { x.font = fontT(17 * u); x.fillStyle = 'rgba(220,210,255,0.85)'; x.fillText(G.A.sub, cx, y + 30 * u); }
    }
    x.restore();
  }
  function draw(x, G, sw, sh) {
    u = clamp(Math.min(sw / 1280, sh / 720) * (isTouch() ? 1.08 : 1), 0.62, 1.35);
    if (G.attract || !G.mages.length) return;
    if (G.state === 'count' && G.introT > 0) { intro(x, G, sw, sh); return; }
    lowHp(x, G, sw, sh); granCine(x, G, sw, sh);
    G.mages.forEach((m, i) => { if (!(G.mode === 'school' && i === 1)) panel(x, G, m, i, sw, sh); });
    // centro arriba: rondas y tiempo
    const cx = sw / 2, ty = 14 * u + (getInsets().topPad || 0) + (isTouch() ? 46 : 0);
    if (G.mode === 'camp') Camp.hud(x, G, sw, sh, u);
    else if (G.mode === 'duel') {
      x.fillStyle = 'rgba(14,10,34,0.62)'; rr(x, cx - 74 * u, ty, 148 * u, 52 * u, 14 * u); x.fill(); x.strokeStyle = 'rgba(232,196,110,0.5)'; x.lineWidth = 1.5; x.stroke();
      const left = Math.max(0, Modes.ROUND_T - G.roundT), mist = G.roundT > Modes.MIST_T;
      x.font = fontT(22 * u); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = mist ? '#c9b8ff' : '#f3eaff';
      x.fillText(`${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`, cx, ty + 20 * u);
      for (let p = 0; p < 2; p++) for (let k = 0; k < G.winsNeeded; k++) {
        const X = cx + (p === 0 ? -1 : 1) * (14 * u + k * 13 * u), Y = ty + 40 * u;
        x.fillStyle = k < G.wins[p] ? PLAYER_COLORS[p].main : 'rgba(255,255,255,0.18)'; x.beginPath(); x.arc(X, Y, 4.5 * u, 0, TAU); x.fill();
      }
      x.font = fontB(9 * u, 900); x.fillStyle = 'rgba(230,220,255,0.6)'; x.fillText(`RONDA ${G.round}` + (G.presage ? ' · ' + PRESAGES[G.presage].name.toUpperCase() : ''), cx, ty + 62 * u);
    } else if (G.mode === 'tejo' || G.mode === 'hunt' || G.mode === 'altar') {
      const lim = G.mode === 'tejo' ? Modes.TEJO_T : G.mode === 'hunt' ? Modes.HUNT_T : 180, left = Math.max(0, lim - G.roundT);
      x.fillStyle = 'rgba(14,10,34,0.62)'; rr(x, cx - 96 * u, ty, 192 * u, 58 * u, 14 * u); x.fill(); x.strokeStyle = 'rgba(232,196,110,0.5)'; x.lineWidth = 1.5; x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'middle';
      if (G.mode === 'altar') {
        for (let p = 0; p < 2; p++) { const bw = 70 * u, bx = p === 0 ? cx - 8 * u - bw : cx + 8 * u, by = ty + 12 * u; x.fillStyle = 'rgba(0,0,0,0.5)'; rr(x, bx, by, bw, 10 * u, 5 * u); x.fill(); x.fillStyle = PLAYER_COLORS[p].main; const f = G.score[p] / Modes.ALTAR_GOAL; if (f > 0) { rr(x, p === 0 ? bx + bw * (1 - f) : bx, by, Math.max(8, bw * f), 10 * u, 5 * u); x.fill(); } x.font = fontB(11 * u, 900); x.fillText(Math.floor(G.score[p]), p === 0 ? bx - 14 * u : bx + bw + 14 * u, by + 5 * u); }
      } else { x.font = fontT(26 * u); x.fillStyle = PLAYER_COLORS[0].main; x.fillText(Math.floor(G.score[0]), cx - 34 * u, ty + 20 * u); x.fillStyle = '#e8dcff'; x.fillText('–', cx, ty + 20 * u); x.fillStyle = PLAYER_COLORS[1].main; x.fillText(Math.floor(G.score[1]), cx + 34 * u, ty + 20 * u); }
      x.font = fontB(12 * u, 900); x.fillStyle = left < 15 ? '#ffb0a0' : '#e8dcff'; x.fillText(`${MODES[G.mode].name} · ${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`, cx, ty + 44 * u);
      for (let p = 0; p < 2; p++) if (!G.mages[p].alive && G.respawn) { const W = G.mages[p]; x.font = fontB(13 * u, 900); x.fillStyle = PLAYER_COLORS[p].main; x.fillText(`J${p + 1} vuelve en ${Math.ceil(3 - G.respawn[p])}`, cx, ty + 74 * u + p * 18 * u); }
    } else if (G.mode === 'school') {
      const txt = Progress.schoolText(G), w = Math.min(sw - 40, 640 * u);
      x.fillStyle = 'rgba(14,10,34,0.72)'; rr(x, cx - w / 2, ty + 100 * u, w, 56 * u, 14 * u); x.fill(); x.strokeStyle = 'rgba(232,196,110,0.6)'; x.lineWidth = 1.5; x.stroke();
      x.font = fontT(15 * u); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#ffe9a0'; x.fillText('Escuela de magia', cx, ty + 114 * u);
      x.font = fontB(Math.max(10, 12.5 * u), 800); x.fillStyle = '#f3eaff'; const words = txt.split(' '); let line = '', lines = []; for (const wd of words) { if (x.measureText(line + wd).width > w - 30) { lines.push(line); line = ''; } line += wd + ' '; } lines.push(line); lines.slice(0, 2).forEach((l, k) => x.fillText(l.trim(), cx, ty + 132 * u + k * 15 * u));
    } else if (G.mode === 'free') {
      x.font = fontT(20 * u); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#f3eaff'; x.fillText('Práctica libre', cx, ty + 18 * u);
    }
    // cuenta regresiva
    if (G.state === 'count') {
      const n = Math.ceil(G.countT - 0.4), f = (G.countT - 0.4) % 1;
      const txt = n > 0 ? String(n) : '¡Ya!', s = (n > 0 ? 90 : 80) * u * (1 + f * 0.3);
      x.font = fontT(s); x.textAlign = 'center'; x.textBaseline = 'middle'; x.globalAlpha = n > 0 ? 0.4 + (1 - f) * 0.6 : 1;
      x.lineWidth = 8 * u; x.strokeStyle = 'rgba(12,6,30,0.85)'; x.strokeText(txt, cx, sh * 0.45); x.fillStyle = '#ffe9a0'; x.fillText(txt, cx, sh * 0.45); x.globalAlpha = 1;
      const sub = G.mode === 'camp' ? `${G.campLevel + 1}. ${G.L.name}` : G.round === 1 ? (G.mode !== 'duel' && G.mode !== 'free' ? MODES[G.mode].name + ' · ' : '') + G.A.name : G.presage ? 'Presagio: ' + PRESAGES[G.presage].name : '';
      if (sub) { x.font = fontT(26 * u); x.fillStyle = G.presage && G.round > 1 ? '#ffd9a0' : '#e8dcff'; x.strokeStyle = 'rgba(12,6,30,0.85)'; x.lineWidth = 5 * u; x.strokeText(sub, cx, sh * 0.45 + 70 * u); x.fillText(sub, cx, sh * 0.45 + 70 * u); }
      const sub2 = G.mode === 'camp' ? G.L.place + ' · ' + G.L.kind : G.round === 1 ? (G.copaTag ? G.copaTag + ' · ' : '') + (G.mode !== 'duel' && G.mode !== 'free' ? MODES[G.mode].short : G.A.sub) : G.presage ? PRESAGES[G.presage].text : '';
      if (sub2) { x.font = fontB(15 * u, 800); x.fillStyle = '#d6c8f2'; x.lineWidth = 4 * u; x.strokeText(sub2, cx, sh * 0.45 + 100 * u); x.fillText(sub2, cx, sh * 0.45 + 100 * u); }
    }
    Touch.draw(x, G);
    if (G.banner) {
      const b = G.banner, a = Math.min(1, b.t * 4), s = 52 * u;
      x.globalAlpha = a; x.fillStyle = 'rgba(10,6,26,0.55)'; x.fillRect(0, sh * 0.42 - s, sw, s * 2 + (b.sub ? 26 * u : 0));
      x.font = fontT(s); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = b.color; x.fillText(b.text, cx, sh * 0.42);
      if (b.sub) { x.font = fontB(15 * u, 700); x.fillStyle = '#e8dcff'; x.fillText(b.sub, cx, sh * 0.42 + s * 0.85); }
      x.globalAlpha = 1;
    }
  }
  return { draw, icon, unit, rr };
})();
