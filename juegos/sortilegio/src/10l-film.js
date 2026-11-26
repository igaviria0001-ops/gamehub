/* =========================================================================
   CINEMÁTICAS (estilo anime, pintadas con tinta) — salen CADA VEZ (no solo
   la primera) y siempre se pueden saltar (botón «Saltar», Esc, Enter o dos
   toques). También se pueden volver a ver desde la campaña.
   · «La caída de Buziraco» (al vencerlo): se agrieta de luz, cuadros de
     impacto, su tinta se derrama, de la tinta nace el Borrón, la tinta pinta
     un pergamino que se desenrolla y aparece Sumi → «Mundo 3».
   · Entrada de cada nivel del Mundo 3: el pergamino se desenrolla con el
     nombre, el lugar y sus estaciones.
   · Presentación de cada jefe: la Kitsune entre mil toriis, Raijin y Fujin
     como en el biombo, las ocho cabezas de Orochi que se levantan del río.
   · El final (al vencer al Borrón): la tinta vuelve al tintero y el
     pergamino se repinta con las cuatro estaciones.
   En línea no se muestran (la partida no se puede detener para uno solo).
   ========================================================================= */
const Film = (() => {
  const INK = '#1d1817';
  let cv = null, x = null, btn = null, raf = 0, cur = null, last = 0, taps = [];
  const E = { inOut: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, out: t => 1 - Math.pow(1 - t, 3), back: t => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); } };
  const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), seg = (t, a, b) => cl((t - a) / (b - a));
  const rnd = (i, k) => hash2(i * 1.37 + k * 17.1, k * 3.71 - i * 0.23);
  function ensure() {
    if (cv) return; cv = document.createElement('canvas'); cv.id = 'film'; Object.assign(cv.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: 60, display: 'none', background: '#0b0910', touchAction: 'none' });
    btn = document.createElement('button'); btn.textContent = 'Saltar ▸▸'; btn.className = 'btn small'; Object.assign(btn.style, { position: 'fixed', right: 'max(16px, env(safe-area-inset-right))', bottom: 'max(14px, env(safe-area-inset-bottom))', zIndex: 61, display: 'none', opacity: 0.85 });
    document.body.appendChild(cv); document.body.appendChild(btn); x = cv.getContext('2d');
    btn.onclick = e => { e.stopPropagation(); end(true); };
    cv.addEventListener('pointerdown', () => { const n = performance.now(); taps = taps.filter(t => n - t < 450); taps.push(n); if (taps.length >= 2) end(true); });
    addEventListener('keydown', e => { if (!cur) return; if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); end(true); } }, true);
  }
  // ---- reproducir ----
  function play(id, done, opt = {}) {
    const F = typeof id === 'string' ? FILMS[id] : id; const G = Game.G;
    if (!F || (G.net && typeof NetPlay !== 'undefined' && NetPlay.on)) { if (done) done(); return false; }
    ensure(); Sound.init();
    cur = { F, t: 0, done, opt, cues: (F.cues || []).slice(), music0: Music.style };
    if (F.music) Music.setStyle(F.music); Music.setLevel(F.level != null ? F.level : 2);
    if (G) { cur.paused0 = G.paused; G.paused = true; }
    cv.style.display = 'block'; btn.style.display = 'block'; last = performance.now(); resize();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); return true;
  }
  function end(skip) {
    if (!cur) return; const c = cur; cur = null; cancelAnimationFrame(raf); cv.style.display = 'none'; btn.style.display = 'none';
    if (typeof Voice !== 'undefined') Voice.clearSubs(); const G = Game.G; if (G) G.paused = !!c.paused0;
    if (G && G.A && !c.opt.keepMusic) Music.setStyle(G.A.theme);
    if (skip) Sound.play('back');
    if (c.done) c.done();
  }
  function resize() { const d = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(innerWidth * d); cv.height = Math.round(innerHeight * d); }
  addEventListener('resize', () => { if (cur) resize(); });
  function loop(now) {
    if (!cur) return; raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now; cur.t += dt; const t = cur.t, F = cur.F;
    for (let k = cur.cues.length - 1; k >= 0; k--) if (t >= cur.cues[k].t) { const q = cur.cues.splice(k, 1)[0]; if (q.say) Voice.say(q.say[0], q.say[1]); if (q.sfx) sfx(q.sfx); if (q.fn) q.fn(); }
    const d = cv.width / innerWidth, W = innerWidth, H = innerHeight; x.setTransform(d, 0, 0, d, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    try { F.draw(x, W, H, t, cur); } catch (e) { end(); throw e; }
    // franjas de cine y subtítulos
    const bh = Math.max(22, H * 0.07) * (F.bars === false ? 0 : 1); if (bh) { x.fillStyle = '#000'; x.fillRect(0, 0, W, bh); x.fillRect(0, H - bh, W, bh); }
    Voice.drawSubs(x, W, H - bh * 0.6, dt);
    if (t >= F.dur) end();
  }
  // ---- sonidos de película (con el sintetizador de efectos) ----
  function sfx(k) { const S = Sound; if (k === 'boom') { S.play('boom'); S.play('thunder', { big: true }); } else if (k === 'crack') S.play('wallBreak'); else if (k === 'gust') S.play('mist'); else if (k === 'roar') { S.play('bossRage'); S.play('boom'); } else if (k === 'chime') S.play('absorb'); else if (k === 'ink') S.onEvent(Game.G, { type: 'inkSplash' }); else if (k === 'scroll') S.onEvent(Game.G, { type: 'grow' }); else if (k === 'season') S.onEvent(Game.G, { type: 'season', s: 'spring' }); else if (k === 'taiko') S.play('bossWarn'); else S.play(k); }

  /* ======================= piezas de dibujo ======================= */
  const brush = (pts, w, col, a = 1, dry = 0.3) => ArtInk.brush(x, pts, w, col, a, dry);
  function paperBg(W, H, a = 1, tint) { x.globalAlpha = a; x.fillStyle = x.createPattern(ArtInk.paper(), 'repeat'); x.fillRect(0, 0, W, H); if (tint) { x.fillStyle = tint; x.fillRect(0, 0, W, H); } x.globalAlpha = 1; }
  function speedLines(W, H, cxp, cyp, n, col, t, inner = 0.25) { x.save(); x.strokeStyle = col; for (let k = 0; k < n; k++) { const a = rnd(k, 1) * TAU + t * 0.05, r0 = Math.max(W, H) * (inner + rnd(k, 2) * 0.2), r1 = Math.max(W, H) * 1.2; x.lineWidth = 1 + rnd(k, 3) * 3; x.globalAlpha = 0.3 + rnd(k + Math.floor(t * 20), 4) * 0.5; x.beginPath(); x.moveTo(cxp + Math.cos(a) * r0, cyp + Math.sin(a) * r0); x.lineTo(cxp + Math.cos(a) * r1, cyp + Math.sin(a) * r1); x.stroke(); } x.restore(); }
  function shake(a, t) { return [Math.sin(t * 61) * a, Math.cos(t * 47) * a]; }
  // Buziraco: el demonio con cuernos (silueta grande)
  function demon(cxp, cyp, s, glowK, crack) {
    x.save(); x.translate(cxp, cyp); x.scale(s, s);
    x.fillStyle = '#120608'; x.beginPath(); x.moveTo(-120, 160); x.quadraticCurveTo(-150, 20, -90, -40); x.quadraticCurveTo(-60, -90, 0, -96); x.quadraticCurveTo(60, -90, 90, -40); x.quadraticCurveTo(150, 20, 120, 160); x.closePath(); x.fill();
    for (const sd of [-1, 1]) { x.beginPath(); x.moveTo(sd * 40, -86); x.quadraticCurveTo(sd * 120, -150, sd * 90, -230); x.quadraticCurveTo(sd * 70, -160, sd * 18, -96); x.closePath(); x.fill(); x.beginPath(); x.moveTo(sd * 100, -20); x.quadraticCurveTo(sd * 230, -60, sd * 260, 40); x.quadraticCurveTo(sd * 200, 10, sd * 110, 40); x.closePath(); x.fill(); }
    for (const sd of [-1, 1]) { x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(255,${80 + glowK * 120},40,${0.6 + glowK * 0.4})`; x.beginPath(); x.ellipse(sd * 28, -52, 14, 6, sd * 0.3, 0, TAU); x.fill(); x.restore(); }
    if (crack > 0) { x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(255,240,200,${Math.min(1, crack * 1.4)})`; x.lineCap = 'round';
      for (let k = 0; k < 14; k++) { if (rnd(k, 9) > crack * 1.3) continue; let px = (rnd(k, 1) - 0.5) * 60, py = (rnd(k, 2) - 0.5) * 80; x.lineWidth = 2 + crack * 5; x.beginPath(); x.moveTo(px, py); for (let q = 0; q < 5; q++) { px += (rnd(k, q + 3) - 0.5) * 70; py += (rnd(k, q + 8) - 0.5) * 70; x.lineTo(px, py); } x.stroke(); }
      x.fillStyle = `rgba(255,250,220,${crack * 0.6})`; x.beginPath(); x.arc(0, 0, 40 + crack * 120, 0, TAU); x.fill(); x.restore(); }
    x.restore();
  }
  // Sumi: el espíritu del pincel (tinta viva, ojos grandes, sello rojo en la frente y cola de pincel)
  function sumi(cxp, cyp, s, t, talk) {
    x.save(); x.translate(cxp, cyp + Math.sin(t * 3) * 6 * s); x.scale(s, s);
    x.save(); x.globalAlpha = 0.25; x.fillStyle = '#000'; x.beginPath(); x.ellipse(0, 70, 40, 10, 0, 0, TAU); x.fill(); x.restore();
    brush([[0, 20], [-30 + Math.sin(t * 2) * 8, 50], [-70 + Math.sin(t * 2.4) * 14, 40], [-96, 10]], 22, INK, 0.95, 0.5);
    x.fillStyle = INK; x.beginPath(); for (let k = 0; k <= 20; k++) { const a = k / 20 * TAU, r = 44 + Math.sin(a * 3 + t * 4) * 3; k ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.95) : x.moveTo(Math.cos(a) * r, Math.sin(a) * r * 0.95); } x.closePath(); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.14)'; x.beginPath(); x.ellipse(-16, -20, 14, 8, -0.6, 0, TAU); x.fill();
    const bl = (t % 3.2) < 0.12 ? 0.15 : 1; for (const sd of [-1, 1]) { x.fillStyle = '#fffdf6'; x.beginPath(); x.ellipse(sd * 15, -2, 9, 12 * bl, 0, 0, TAU); x.fill(); x.fillStyle = INK; x.beginPath(); x.ellipse(sd * 15 + 2, 0, 4.5, 6 * bl, 0, 0, TAU); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(sd * 15 + 3.5, -3 * bl, 1.8, 0, TAU); x.fill(); }
    x.fillStyle = '#c8281e'; x.fillRect(-6, -34, 12, 12); x.fillStyle = '#ffe8d8'; x.fillRect(-3, -31, 6, 1.6); x.fillRect(-1, -33, 1.6, 9);
    const mo = talk ? 2 + Math.abs(Math.sin(t * 14)) * 5 : 2; x.fillStyle = '#c84a5a'; x.beginPath(); x.ellipse(0, 18, 6, mo, 0, 0, TAU); x.fill();
    for (const sd of [-1, 1]) { x.fillStyle = 'rgba(255,120,140,0.35)'; x.beginPath(); x.ellipse(sd * 28, 12, 7, 4, 0, 0, TAU); x.fill(); }
    x.restore();
  }
  // el paisaje del pergamino (sumi-e): Fuji, el torii en el mar, pagoda, pinos y la estación que se pinta de izquierda a derecha
  function landscape(X0, Y0, W, H, t, seasonsK) {
    x.save(); x.beginPath(); x.rect(X0, Y0, W, H); x.clip();
    paperBg(X0 + W, Y0 + H); const SC = ['#f6c6d6', '#bfe0a8', '#f2b070', '#e6eef8'];
    for (let k = 0; k < 4; k++) { const a = cl(seasonsK * 4 - k); if (a <= 0) continue; x.globalAlpha = 0.45 * a; x.fillStyle = SC[k]; x.fillRect(X0 + W * k / 4, Y0, W / 4 + 1, H); } x.globalAlpha = 1;
    // monte Fuji
    x.fillStyle = 'rgba(70,90,120,0.55)'; x.beginPath(); x.moveTo(X0 + W * 0.18, Y0 + H * 0.62); x.lineTo(X0 + W * 0.38, Y0 + H * 0.2); x.lineTo(X0 + W * 0.44, Y0 + H * 0.2); x.lineTo(X0 + W * 0.66, Y0 + H * 0.62); x.closePath(); x.fill();
    x.fillStyle = 'rgba(250,251,253,0.95)'; x.beginPath(); x.moveTo(X0 + W * 0.33, Y0 + H * 0.3); x.lineTo(X0 + W * 0.38, Y0 + H * 0.2); x.lineTo(X0 + W * 0.44, Y0 + H * 0.2); x.lineTo(X0 + W * 0.5, Y0 + H * 0.31); x.lineTo(X0 + W * 0.46, Y0 + H * 0.28); x.lineTo(X0 + W * 0.42, Y0 + H * 0.33); x.lineTo(X0 + W * 0.38, Y0 + H * 0.28); x.closePath(); x.fill();
    x.fillStyle = 'rgba(232,80,50,0.85)'; x.beginPath(); x.arc(X0 + W * 0.74, Y0 + H * 0.22, H * 0.08, 0, TAU); x.fill();
    // nubes doradas
    for (let k = 0; k < 4; k++) { const cxp = X0 + W * (0.1 + k * 0.27), cyp = Y0 + H * (0.38 + (k % 2) * 0.06); x.fillStyle = 'rgba(226,182,86,0.85)'; x.beginPath(); for (let q = 0; q < 4; q++) x.arc(cxp + q * 22, cyp - 4, 16, Math.PI, 0); x.lineTo(cxp + 78, cyp + 8); x.lineTo(cxp - 16, cyp + 8); x.closePath(); x.fill(); }
    // el mar con el torii
    x.fillStyle = 'rgba(80,120,160,0.5)'; x.fillRect(X0, Y0 + H * 0.62, W, H * 0.38); x.strokeStyle = 'rgba(40,70,110,0.6)'; x.lineWidth = 1.5; for (let k = 0; k < 9; k++) { const yy = Y0 + H * (0.68 + k * 0.035), ph = t * 0.6 + k; x.beginPath(); for (let q = 0; q <= 20; q++) { const xx = X0 + W * q / 20; x.lineTo(xx, yy + Math.sin(q * 1.3 + ph) * 3); } x.stroke(); }
    const tx = X0 + W * 0.58, ty = Y0 + H * 0.78, ts = H * 0.0028; x.save(); x.translate(tx, ty); x.scale(ts, ts); x.fillStyle = '#d0381e'; x.fillRect(-36, -90, 10, 90); x.fillRect(26, -90, 10, 90); x.fillRect(-50, -70, 100, 8); x.fillStyle = INK; x.beginPath(); x.moveTo(-66, -104); x.quadraticCurveTo(0, -94, 66, -104); x.lineTo(62, -94); x.quadraticCurveTo(0, -88, -62, -94); x.closePath(); x.fill(); x.restore();
    // pagoda y pinos
    const px = X0 + W * 0.86, py = Y0 + H * 0.62; for (let k = 0; k < 5; k++) { const w = 46 - k * 7, yy = py - k * 26; x.fillStyle = '#3a2a26'; x.fillRect(px - w * 0.35, yy - 20, w * 0.7, 18); x.fillStyle = INK; x.beginPath(); x.moveTo(px - w, yy - 18); x.quadraticCurveTo(px, yy - 30, px + w, yy - 18); x.lineTo(px + w * 0.7, yy - 24); x.lineTo(px - w * 0.7, yy - 24); x.closePath(); x.fill(); }
    for (let k = 0; k < 3; k++) { const bx = X0 + W * (0.06 + k * 0.05), by = Y0 + H * 0.62; brush([[bx, by], [bx + 3, by - 40], [bx - 2, by - 80]], 6, '#3a3028', 1, 0.3); x.fillStyle = '#24402a'; for (let q = 0; q < 3; q++) { x.beginPath(); x.ellipse(bx + (q - 1) * 16, by - 50 - q * 14, 24, 8, 0, 0, TAU); x.fill(); } }
    x.restore();
  }
  // un pergamino que se desenrolla desde el centro (o se enrolla): devuelve el área de papel visible
  function scroll(cxp, cyp, w, h, open, painter) {
    const half = w / 2 * open, X0 = cxp - half, X1 = cxp + half;
    if (half > 2) { x.save(); x.beginPath(); x.rect(X0, cyp - h / 2, X1 - X0, h); x.clip(); painter(cxp - w / 2, cyp - h / 2, w, h); x.restore();
      x.strokeStyle = 'rgba(150,110,40,0.9)'; x.lineWidth = 3; x.strokeRect(X0 + 6, cyp - h / 2 + 6, X1 - X0 - 12, h - 12); }
    for (const sx of [X0, X1]) { const g = x.createLinearGradient(sx - 12, 0, sx + 12, 0); g.addColorStop(0, '#5a3a1e'); g.addColorStop(0.5, '#a87446'); g.addColorStop(1, '#4a2e16'); x.fillStyle = g; x.fillRect(sx - 12, cyp - h / 2 - 16, 24, h + 32); x.fillStyle = '#d8b050'; x.fillRect(sx - 15, cyp - h / 2 - 26, 30, 12); x.fillRect(sx - 15, cyp + h / 2 + 14, 30, 12); }
  }
  function title(W, H, small, big, a, col = '#1d1817', y = 0.5, band) {
    x.save(); x.globalAlpha = a; x.textAlign = 'center'; x.textBaseline = 'middle';
    if (band) { const g = x.createLinearGradient(0, H * y - H * 0.14, 0, H * y + H * 0.08); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.4, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, H * y - H * 0.14, W, H * 0.22); }
    x.font = fontB(Math.max(13, W * 0.018), 900); x.fillStyle = '#c8281e'; x.fillText(small, W / 2, H * y - Math.max(30, H * 0.07));
    x.font = fontT(Math.max(30, Math.min(W * 0.06, H * 0.11))); x.fillStyle = col; x.fillText(big, W / 2, H * y); x.restore();
  }
  function seal(cxp, cyp, s, a) { x.save(); x.globalAlpha = a; x.translate(cxp, cyp); x.rotate(-0.08); x.fillStyle = '#c8281e'; x.fillRect(-s, -s, s * 2, s * 2); x.strokeStyle = '#ffe8d8'; x.lineWidth = s * 0.12; x.strokeRect(-s * 0.78, -s * 0.78, s * 1.56, s * 1.56); x.beginPath(); x.moveTo(-s * 0.5, -s * 0.3); x.lineTo(s * 0.5, -s * 0.3); x.moveTo(0, -s * 0.6); x.lineTo(0, s * 0.6); x.moveTo(-s * 0.5, s * 0.3); x.lineTo(s * 0.5, s * 0.3); x.stroke(); x.restore(); }
  function inkDrips(W, H, k, seed) {
    x.fillStyle = INK; x.beginPath(); x.moveTo(0, 0); x.lineTo(W, 0);
    for (let q = 24; q >= 0; q--) { const xx = W * q / 24, len = H * k * (0.5 + rnd(q, seed) * 0.8); x.lineTo(xx + W / 48, len * 0.85); x.quadraticCurveTo(xx + W / 48, len + 14, xx, len); x.quadraticCurveTo(xx - W / 48, len + 14, xx - W / 48, len * 0.85); }
    x.closePath(); x.fill();
  }

  /* ======================= las películas ======================= */
  const FILMS = {};
  // ---- La caída de Buziraco → nace el Borrón → el pergamino → Mundo 3 ----
  FILMS.buziraco = { dur: 25, music: 'orochiMain', level: 3,
    cues: [{ t: 0.2, sfx: 'roar' }, { t: 2.6, sfx: 'crack' }, { t: 3.25, sfx: 'boom' }, { t: 4.2, sfx: 'ink' }, { t: 9.2, say: ['borron', 'Todo lo pintado… se puede borrar.'] }, { t: 12.2, sfx: 'scroll' }, { t: 13.6, sfx: 'season' }, { t: 17.3, say: ['sumi', '¡El Borrón huyó al pergamino! ¡Síganme, hay que pintarlo de nuevo!'] }, { t: 21.2, sfx: 'chime' }],
    draw(x0, W, H, t) {
      const cxp = W / 2, cyp = H / 2;
      if (t < 3.2) { // el demonio se agrieta de luz
        const k = seg(t, 0, 3.2), [sx, sy] = shake(2 + k * 10, t); const g = x.createRadialGradient(cxp, cyp, 10, cxp, cyp, Math.max(W, H)); g.addColorStop(0, '#5a1410'); g.addColorStop(1, '#120406'); x.fillStyle = g; x.fillRect(0, 0, W, H);
        speedLines(W, H, cxp, cyp, 60, 'rgba(255,170,120,0.8)', t, 0.3 - k * 0.1); demon(cxp + sx, cyp + sy + H * 0.06, Math.min(W, H) / 520 * (1 + k * 0.12), k, seg(t, 0.8, 3.1));
        x.globalAlpha = seg(t, 2.4, 3.2); x.fillStyle = '#fff6e0'; x.fillRect(0, 0, W, H); x.globalAlpha = 1; return; }
      if (t < 4.1) { // cuadros de impacto (blanco / negro invertido)
        const f = Math.floor((t - 3.2) / 0.11); x.fillStyle = f % 2 ? '#000' : '#fff'; x.fillRect(0, 0, W, H); x.save(); x.globalCompositeOperation = f % 2 ? 'source-over' : 'difference'; demon(cxp, cyp + H * 0.06, Math.min(W, H) / 520 * 1.15, 1, 0); x.restore();
        if (f % 2) { x.fillStyle = '#fff'; for (let k = 0; k < 18; k++) { const a = k / 18 * TAU; x.beginPath(); x.moveTo(cxp, cyp); x.lineTo(cxp + Math.cos(a - 0.04) * W, cyp + Math.sin(a - 0.04) * W); x.lineTo(cxp + Math.cos(a + 0.04) * W, cyp + Math.sin(a + 0.04) * W); x.fill(); } } return; }
      if (t < 8.2) { // la tinta se derrama sobre el papel
        const k = seg(t, 4.1, 8.2); paperBg(W, H); inkDrips(W, H, E.out(k) * 1.1, 3);
        for (let q = 0; q < 40; q++) { const p = (k * 1.4 + rnd(q, 2)) % 1, dx = W * rnd(q, 1), dy = H * (0.1 + p * 1.0); x.fillStyle = INK; x.beginPath(); x.ellipse(dx, dy, 3 + rnd(q, 3) * 6, 6 + rnd(q, 4) * 12, 0, 0, TAU); x.fill(); }
        x.globalAlpha = seg(t, 7.4, 8.2); x.fillStyle = INK; x.fillRect(0, 0, W, H); x.globalAlpha = 1; return; }
      if (t < 12.2) { // el charco de tinta… y se abren dos ojos rojos
        const k = seg(t, 8.2, 12.2), z = 1 + E.inOut(k) * 0.6; x.fillStyle = '#0a080c'; x.fillRect(0, 0, W, H); paperBg(W, H, 0.12);
        x.save(); x.translate(cxp, cyp + H * 0.08); x.scale(z, z); x.fillStyle = '#000'; x.beginPath(); for (let q = 0; q <= 40; q++) { const a = q / 40 * TAU, r = W * 0.28 + Math.sin(a * 6 + t * 3) * 10 + Math.sin(a * 3 - t * 2) * 14; q ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.35) : x.moveTo(Math.cos(a) * r, Math.sin(a) * r * 0.35); } x.closePath(); x.fill();
        x.strokeStyle = 'rgba(140,120,180,0.4)'; x.lineWidth = 2; for (let q = 0; q < 3; q++) { const rr = ((t * 0.6 + q / 3) % 1) * W * 0.26; x.beginPath(); x.ellipse(0, 0, rr, rr * 0.35, 0, 0, TAU); x.stroke(); }
        const eo = E.back(seg(t, 9, 10.2)); for (const sd of [-1, 1]) { x.save(); x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(sd * 40, -10, 0, sd * 40, -10, 50); g.addColorStop(0, 'rgba(255,40,70,0.9)'); g.addColorStop(1, 'rgba(255,40,70,0)'); x.fillStyle = g; x.globalAlpha = eo; x.beginPath(); x.arc(sd * 40, -10, 50, 0, TAU); x.fill(); x.restore(); x.fillStyle = '#ff3050'; x.beginPath(); x.ellipse(sd * 40, -10, 18, 7 * eo, sd * 0.2, 0, TAU); x.fill(); }
        x.restore(); return; }
      if (t < 17) { // la tinta sube como un pincelazo y pinta el pergamino que se desenrolla
        const k = seg(t, 12.2, 17); x.fillStyle = '#0d0a10'; x.fillRect(0, 0, W, H);
        const sw = seg(t, 12.2, 13.2); brush([[W * 0.1, H * 0.95], [W * 0.4, H * 0.55], [W * 0.62, H * 0.42], [W * 0.9 * sw + W * 0.1, H * 0.1 + (1 - sw) * H * 0.4]], 60 * (1 - seg(t, 13, 13.8)) + 1, INK, 1, 0.5);
        const op = E.out(seg(t, 12.8, 14.6)); scroll(cxp, cyp, W * 0.86, H * 0.66, op, (X, Y, w, h) => landscape(X, Y, w, h, t, seg(t, 13.6, 16.8)));
        return; }
      if (t < 21) { // Sumi
        const k = seg(t, 17, 21); x.fillStyle = '#0d0a10'; x.fillRect(0, 0, W, H); scroll(cxp, cyp, W * 0.86, H * 0.66, 1, (X, Y, w, h) => landscape(X, Y, w, h, t, 1));
        sumi(cxp + Math.sin(t) * 20, cyp + H * 0.12 + (1 - E.back(seg(t, 17, 17.8))) * H * 0.4, Math.min(W, H) / 300, t, t > 17.3 && t < 20.6); return; }
      // título
      const k = seg(t, 21, 25); x.fillStyle = '#0d0a10'; x.fillRect(0, 0, W, H); const z = 1 + k * 0.25; x.save(); x.translate(cxp, cyp); x.scale(z, z); x.translate(-cxp, -cyp); scroll(cxp, cyp, W * 0.86, H * 0.66, 1, (X, Y, w, h) => { landscape(X, Y, w, h, t, 1); x.fillStyle = 'rgba(244,236,220,0.78)'; x.fillRect(X, Y, w, h); }); x.restore();
      title(W, H, 'MUNDO 3', 'El Pergamino de las Estaciones', E.out(seg(t, 21.2, 22.2)));
      const u = seg(t, 21.8, 23); brush([[W * 0.25, H * 0.58], [W * (0.25 + 0.5 * u), H * 0.585]], 10, '#c8281e', 0.9, 0.4); seal(W * 0.76, H * 0.6, 22, seg(t, 22.6, 23));
      x.globalAlpha = seg(t, 24.2, 25); x.fillStyle = '#000'; x.fillRect(0, 0, W, H); x.globalAlpha = 1;
    } };

  // ---- entrada de cada nivel del Mundo 3 (y la presentación de su jefe) ----
  const VIGN = { miyajima: 'torii', arashiyama: 'bamboo', fushimi: 'fox', himeji: 'castle', shirakawa: 'house', fuji: 'drums', kioto: 'lantern', izumo: 'serpent' };
  function vignette(kind, X, Y, s, t) {
    x.save(); x.translate(X, Y); x.scale(s, s); x.lineCap = 'round';
    if (kind === 'torii') { x.fillStyle = 'rgba(80,120,160,0.5)'; x.fillRect(-90, 10, 180, 30); x.fillStyle = '#d0381e'; x.fillRect(-36, -70, 9, 80); x.fillRect(27, -70, 9, 80); x.fillRect(-48, -52, 96, 7); x.fillStyle = INK; x.beginPath(); x.moveTo(-62, -84); x.quadraticCurveTo(0, -74, 62, -84); x.lineTo(58, -74); x.quadraticCurveTo(0, -68, -58, -74); x.fill(); }
    else if (kind === 'bamboo') for (let k = 0; k < 7; k++) { const bx = -60 + k * 20; brush([[bx, 30], [bx + 4, -40], [bx + 2, -100]], 6, '#3e7a3a', 1, 0.3); for (let q = 0; q < 4; q++) { x.strokeStyle = INK; x.lineWidth = 1.5; x.beginPath(); x.moveTo(bx - 3, 20 - q * 30); x.lineTo(bx + 5, 20 - q * 30); x.stroke(); } brush([[bx, -60], [bx + 20, -70], [bx + 30, -64]], 4, '#2c5a2a', 0.9, 0); }
    else if (kind === 'fox') { x.fillStyle = '#d0381e'; for (let k = 0; k < 4; k++) { const sc = 1 - k * 0.2; x.fillRect(-40 * sc, -70 * sc + k * 10, 8 * sc, 90 * sc); x.fillRect(32 * sc, -70 * sc + k * 10, 8 * sc, 90 * sc); x.fillRect(-50 * sc, -70 * sc + k * 10, 100 * sc, 7 * sc); } x.fillStyle = '#fff'; x.beginPath(); x.ellipse(0, 10, 20, 12, 0, 0, TAU); x.fill(); x.fillStyle = 'rgba(120,200,255,0.8)'; for (let k = 0; k < 3; k++) { x.beginPath(); x.arc(-30 + k * 30, -20 + Math.sin(t * 3 + k) * 6, 5, 0, TAU); x.fill(); } }
    else if (kind === 'castle') { x.fillStyle = '#f2efe6'; x.strokeStyle = INK; x.lineWidth = 2; for (let k = 0; k < 4; k++) { const w = 80 - k * 16, yy = 20 - k * 30; x.fillRect(-w / 2, yy - 24, w, 24); x.strokeRect(-w / 2, yy - 24, w, 24); x.fillStyle = '#4a4e58'; x.beginPath(); x.moveTo(-w / 2 - 14, yy - 22); x.quadraticCurveTo(0, yy - 36, w / 2 + 14, yy - 22); x.lineTo(w / 2, yy - 30); x.lineTo(-w / 2, yy - 30); x.fill(); x.fillStyle = '#f2efe6'; } }
    else if (kind === 'house') { x.fillStyle = '#6a4a30'; x.fillRect(-50, -10, 100, 40); x.fillStyle = '#9a7a4a'; x.beginPath(); x.moveTo(-64, -6); x.lineTo(0, -90); x.lineTo(64, -6); x.fill(); x.fillStyle = 'rgba(250,251,253,0.95)'; x.beginPath(); x.moveTo(-66, -4); x.lineTo(0, -92); x.lineTo(66, -4); x.lineTo(50, -12); x.lineTo(0, -70); x.lineTo(-50, -12); x.fill(); x.fillStyle = '#ffc860'; x.fillRect(-30, 2, 14, 16); x.fillRect(16, 2, 14, 16); }
    else if (kind === 'drums') { for (let k = 0; k < 7; k++) { const a = Math.PI * (1.05 + k / 6 * 0.9); x.fillStyle = '#c8281e'; x.beginPath(); x.arc(Math.cos(a) * 70, Math.sin(a) * 60, 13, 0, TAU); x.fill(); x.fillStyle = '#f0e0c0'; x.beginPath(); x.arc(Math.cos(a) * 70, Math.sin(a) * 60, 8, 0, TAU); x.fill(); } x.fillStyle = 'rgba(250,250,255,0.9)'; for (let k = 0; k < 5; k++) { x.beginPath(); x.arc(-50 + k * 25, 20, 16, 0, TAU); x.fill(); } x.strokeStyle = '#ffe070'; x.lineWidth = 4; x.beginPath(); x.moveTo(10, -90); x.lineTo(-6, -50); x.lineTo(8, -50); x.lineTo(-10, -10); x.stroke(); }
    else if (kind === 'lantern') { x.strokeStyle = INK; x.lineWidth = 1.5; x.beginPath(); x.moveTo(-90, -70); x.quadraticCurveTo(0, -50, 90, -70); x.stroke(); for (let k = 0; k < 5; k++) { const lx = -72 + k * 36, ly = -54 + Math.abs(k - 2) * -4; x.fillStyle = '#e8503a'; x.beginPath(); x.ellipse(lx, ly, 10, 14, 0, 0, TAU); x.fill(); x.fillStyle = INK; x.fillRect(lx - 6, ly - 17, 12, 4); } x.fillStyle = 'rgba(255,200,120,0.9)'; x.beginPath(); x.arc(40, 0, 3, 0, TAU); x.fill(); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; x.strokeStyle = `hsl(${k * 36},90%,65%)`; x.beginPath(); x.moveTo(40 + Math.cos(a) * 8, -10 + Math.sin(a) * 8); x.lineTo(40 + Math.cos(a) * 26, -10 + Math.sin(a) * 26); x.stroke(); } }
    else if (kind === 'serpent') { for (let k = 0; k < 8; k++) { const a = -Math.PI * (0.15 + k / 7 * 0.7); brush([[0, 30], [Math.cos(a) * 40, 30 + Math.sin(a) * 50], [Math.cos(a) * 80, 10 + Math.sin(a) * 90]], 9, '#2e3a26', 1, 0.3); x.fillStyle = ELEMENTS[['fire', 'water', 'wind', 'earth', 'plant', 'bolt', 'light', 'shadow'][k]].c1; x.beginPath(); x.arc(Math.cos(a) * 80, 10 + Math.sin(a) * 90, 4, 0, TAU); x.fill(); } }
    x.restore();
  }
  function levelFilm(L) {
    const boss = { kitsune: 'kitsune', gods: 'gods', orochi: 'orochi' }[L.boss], dur = boss ? 10.5 : 4.4, idx = Camp.LEVELS.indexOf(L) + 1;
    const cues = [{ t: 0.15, sfx: 'scroll' }];
    if (boss === 'kitsune') cues.push({ t: 4.4, sfx: 'chime' }, { t: 6.6, sfx: 'roar' }, { t: 7, say: ['kitsune', 'Jijiji… ¿vienen a jugar a las escondidas?'] });
    if (boss === 'gods') cues.push({ t: 4.4, sfx: 'taiko' }, { t: 5.2, sfx: 'boom' }, { t: 5.6, say: ['raijin', '¡Al ritmo del trueno!'] }, { t: 7.4, sfx: 'gust' }, { t: 7.8, say: ['fujin', '¡Y del viento!'] });
    if (boss === 'orochi') cues.push({ t: 4.4, sfx: 'roar' }, { t: 5.6, sfx: 'roar' }, { t: 7.6, sfx: 'boom' }, { t: 8, say: ['orochi', '¡Ocho cabezas, ocho hambres!'] });
    return { dur, music: boss ? (boss === 'gods' ? 'raijin' : boss === 'orochi' ? 'orochi' : 'kitsune') : null, level: boss ? 3 : 1, cues, bars: true,
      draw(x0, W, H, t) {
        x.fillStyle = '#0d0a10'; x.fillRect(0, 0, W, H);
        if (!boss || t < 4.2) { const op = t < 3.2 ? E.out(seg(t, 0, 0.9)) : 1 - E.inOut(seg(t, 3.3, 4.2)), cxp = W / 2, cyp = H / 2;
          scroll(cxp, cyp, Math.min(W * 0.9, H * 1.7), Math.min(H * 0.62, W * 0.42), op, (X, Y, w, h) => {
            paperBg(X + w, Y + h); const S = L.seasons && L.seasons.panels ? L.seasons.panels.map(p => p[2]) : [];
            S.forEach((s, k) => { x.globalAlpha = 0.28; x.fillStyle = SEASONS[s].col; x.fillRect(X + w * k / S.length, Y, w / S.length + 1, h); x.globalAlpha = 1; });
            vignette(VIGN[L.theme] || 'torii', X + w * 0.78, Y + h * 0.6, h / 300, t);
            x.textAlign = 'center'; x.textBaseline = 'middle'; const cx2 = X + w * 0.4;
            x.fillStyle = '#c8281e'; x.beginPath(); x.arc(cx2, Y + h * 0.24, h * 0.09, 0, TAU); x.fill(); x.fillStyle = '#fff4e4'; x.font = fontT(h * 0.1); x.fillText(String(idx), cx2, Y + h * 0.25);
            x.fillStyle = INK; x.font = fontT(Math.min(h * 0.14, w * 0.06)); x.fillText(L.name, cx2, Y + h * 0.47, w * 0.6);
            x.font = fontB(h * 0.06, 800); x.fillStyle = '#6a4a2a'; x.fillText(`${L.place} · ${L.kind}`, cx2, Y + h * 0.62, w * 0.6);
            const u = E.out(seg(t, 0.6, 1.6)); brush([[cx2 - w * 0.22, Y + h * 0.55], [cx2 - w * 0.22 + w * 0.44 * u, Y + h * 0.555]], 5, '#c8281e', 0.85, 0.4);
            S.forEach((s, k) => { const ex = cx2 + (k - (S.length - 1) / 2) * h * 0.13, ey = Y + h * 0.8; x.fillStyle = SEASONS[s].col; x.beginPath(); x.arc(ex, ey, h * 0.045, 0, TAU); x.fill(); x.strokeStyle = INK; x.lineWidth = 1.2; x.stroke(); ArtInk.emblem(x, s, ex, ey, h * 0.03); });
          }); return; }
        const k = seg(t, 4.2, 10.5), cxp = W / 2, cyp = H / 2, R = Math.min(W, H);
        if (boss === 'kitsune') { // el túnel de mil toriis de noche, fuegos de zorro y las nueve colas
          x.fillStyle = '#0a0610'; x.fillRect(0, 0, W, H); for (let q = 14; q >= 0; q--) { const z = ((q + t * 1.2) % 15) / 15, s = 0.15 + z * z * 2.2, a = Math.min(1, z * 2); x.save(); x.translate(cxp, cyp + R * 0.05); x.scale(s, s); x.globalAlpha = a; x.fillStyle = q % 2 ? '#b8301e' : '#d0381e'; x.fillRect(-R * 0.35, -R * 0.4, R * 0.06, R * 0.8); x.fillRect(R * 0.29, -R * 0.4, R * 0.06, R * 0.8); x.fillRect(-R * 0.4, -R * 0.42, R * 0.8, R * 0.05); x.fillStyle = INK; x.fillRect(-R * 0.44, -R * 0.48, R * 0.88, R * 0.06); x.restore(); }
          for (let q = 0; q < 9; q++) { const a = q / 9 * TAU + t * 0.6, rr = R * 0.32 * E.out(seg(t, 4.4 + q * 0.12, 6)); x.save(); x.globalCompositeOperation = 'lighter'; const g = x.createRadialGradient(cxp + Math.cos(a) * rr, cyp + Math.sin(a) * rr * 0.5, 0, cxp + Math.cos(a) * rr, cyp + Math.sin(a) * rr * 0.5, 26); g.addColorStop(0, 'rgba(160,220,255,0.9)'); g.addColorStop(1, 'rgba(60,120,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(cxp + Math.cos(a) * rr, cyp + Math.sin(a) * rr * 0.5, 26, 0, TAU); x.fill(); x.restore(); }
          const fx = E.back(seg(t, 6.2, 7.2)); if (fx > 0) { const fb = { x: 0, y: 0, vx: 1, vy: 0, clone: 0, reveal: 0, flash: 0, tele: null, _nid: 0 }; x.save(); x.translate(cxp - fb.x, cyp + R * 0.16); x.scale(fx * R / 330, fx * R / 330); fb.x = 0; fb.y = 0; ArtW3B.boss(x, { time: t, cs: {}, units: [] }, Object.assign(fb, { w3boss: 'kitsune' })); x.restore(); }
          if (t > 6.6 && t < 6.75) { x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); }
          title(W, H, 'JEFE', 'La Kitsune de nueve colas', E.out(seg(t, 7.4, 8.2)), '#fff2e0', 0.8, 1);
        } else if (boss === 'gods') { // el biombo de Sōtatsu: oro, Raijin a un lado y Fujin al otro
          const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#e8c060'); g.addColorStop(1, '#b8862a'); x.fillStyle = g; x.fillRect(0, 0, W, H); paperBg(W, H, 0.3);
          for (let q = 0; q < 8; q++) { x.fillStyle = 'rgba(255,240,190,0.45)'; x.beginPath(); x.ellipse(W * rnd(q, 1), H * (0.2 + rnd(q, 2) * 0.7), R * 0.2, R * 0.04, 0, 0, TAU); x.fill(); }
          const sl = E.back(seg(t, 4.6, 5.6)), sr = E.back(seg(t, 6.9, 7.9));
          for (const [k2, side, s2] of [['raijin', -1, sl], ['fujin', 1, sr]]) { if (s2 <= 0) continue; x.save(); x.translate(cxp + side * W * 0.24 - side * (1 - s2) * W * 0.4, cyp + R * 0.12); x.scale(R / 560, R / 560); ArtW3B.boss(x, { time: t, cs: { beatT: (t % 0.55), bpm: 108, beat0: 1 }, units: [] }, { x: 0, y: 0, vx: 0, vy: 0, w3boss: k2, flash: 0, tele: null, mark: [] }); x.restore(); }
          if ((t > 5.2 && t < 5.3) || (t > 5.45 && t < 5.5)) { x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(0, 0, W, H); }
          title(W, H, 'JEFES', 'Raijin y Fujin', E.out(seg(t, 8.2, 9)), '#fff2e0', 0.82, 1);
        } else { // Orochi: noche de tormenta sobre el río y ocho cabezas que se levantan
          x.fillStyle = '#0a0810'; x.fillRect(0, 0, W, H); x.fillStyle = 'rgba(40,60,90,0.6)'; x.fillRect(0, H * 0.72, W, H * 0.28);
          if ((t * 0.9) % 2 < 0.06) { x.fillStyle = 'rgba(200,210,255,0.6)'; x.fillRect(0, 0, W, H); }
          for (let q = 0; q < 8; q++) { const up = E.out(seg(t, 4.4 + q * 0.32, 5.6 + q * 0.32)); if (up <= 0) continue; const bx = W * (0.12 + q * 0.108), el = ['fire', 'water', 'wind', 'earth', 'plant', 'bolt', 'light', 'shadow'][q], hy = H * (0.75 - up * (0.32 + (q % 3) * 0.08));
            brush([[bx - 20, H * 0.85], [bx + Math.sin(t + q) * 20, (H * 0.85 + hy) / 2], [bx, hy]], R * 0.06, '#2e3a26', 1, 0.3);
            x.save(); x.translate(bx, hy); x.scale(R / 440, R / 440); ArtW3B.boss(x, { time: t, cs: {}, units: [] }, { x: 0, y: 30, vx: 0, vy: 0, w3boss: 'ohead', el, hp: 1, maxHp: 1, alive: true, flash: 0, tele: null, lunge: { a: q % 2 ? Math.PI * 0.7 : Math.PI * 0.3, t: 1 }, yOff: 0, hk: q }); x.restore(); }
          title(W, H, 'JEFE FINAL', 'Yamata no Orochi', E.out(seg(t, 8.2, 9)), '#fff2e0', 0.84, 1);
        }
        x.globalAlpha = seg(t, 9.8, 10.5); x.fillStyle = '#000'; x.fillRect(0, 0, W, H); x.globalAlpha = 1;
      } };
  }

  // ---- El final: la tinta vuelve al tintero y el pergamino se repinta ----
  FILMS.final = { dur: 26, music: 'wa', level: 2,
    cues: [{ t: 0.3, sfx: 'crack' }, { t: 2.4, sfx: 'boom' }, { t: 3.2, say: ['borron', '¡No! ¡No me borren a mí…!'] }, { t: 6.5, sfx: 'chime' }, { t: 10.2, sfx: 'season' }, { t: 13.4, say: ['sumi', 'Lo lograron. El pergamino vuelve a tener sus cuatro estaciones.'] }, { t: 18.4, say: ['sumi', '¡Gracias, magos! Aquí siempre tendrán un lugar.'] }, { t: 22, sfx: 'chime' }],
    draw(x0, W, H, t, c) {
      const cxp = W / 2, cyp = H / 2, R = Math.min(W, H);
      if (t < 6.5) { // el Borrón se agrieta y la tinta vuelve al tintero
        paperBg(W, H); const k = seg(t, 0, 2.4), [sx, sy] = shake(k * 8, t);
        if (t < 2.6) { x.save(); x.translate(cxp + sx, cyp + sy); x.scale(R / 260, R / 260); ArtW3B.boss(x, { time: t, cs: {}, units: [] }, { x: 0, y: 40, vx: 0, vy: 0, w3boss: 'borron', shield: 0, flash: k * 0.2, tele: null }); x.restore(); x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(255,250,220,${k})`; x.lineWidth = 3 + k * 6; for (let q = 0; q < 10; q++) { const a = q / 10 * TAU; x.beginPath(); x.moveTo(cxp, cyp - R * 0.1); x.lineTo(cxp + Math.cos(a) * R * 0.5 * k, cyp - R * 0.1 + Math.sin(a) * R * 0.5 * k); x.stroke(); } x.restore(); }
        else { const k2 = seg(t, 2.6, 6.5); // gotas que vuelan al tintero (suzuri) abajo
          x.save(); x.translate(cxp, H * 0.78); x.fillStyle = '#2a2428'; x.beginPath(); x.ellipse(0, 0, R * 0.2, R * 0.07, 0, 0, TAU); x.fill(); x.fillStyle = '#0e0b0e'; x.beginPath(); x.ellipse(-R * 0.05, -4, R * 0.11, R * 0.035, 0, 0, TAU); x.fill(); x.restore();
          for (let q = 0; q < 50; q++) { const p = cl(k2 * 1.6 - rnd(q, 1) * 0.6), a = rnd(q, 2) * TAU, r0 = R * (0.1 + rnd(q, 3) * 0.4), sx2 = cxp + Math.cos(a) * r0, sy2 = cyp - R * 0.1 + Math.sin(a) * r0 * 0.7, ex = cxp - R * 0.05, ey = H * 0.78, px = sx2 + (ex - sx2) * E.inOut(p), py = sy2 + (ey - sy2) * E.inOut(p) - Math.sin(p * Math.PI) * R * 0.15; if (p >= 1) continue; x.fillStyle = '#0e0b0e'; x.beginPath(); x.arc(px, py, 3 + rnd(q, 4) * 7, 0, TAU); x.fill(); } }
        return; }
      // el pergamino se repinta (las cuatro estaciones) y aparecen los magos
      x.fillStyle = '#0d0a10'; x.fillRect(0, 0, W, H);
      scroll(cxp, cyp, W * 0.9, H * 0.7, E.out(seg(t, 6.5, 8.2)), (X, Y, w, h) => { landscape(X, Y, w, h, t, seg(t, 9.8, 13)); const G = Game.G, ch = (G && G.chars) || ['candela', 'yuma'];
        ch.slice(0, 2).forEach((cid, k) => { const a = E.back(seg(t, 14 + k * 0.4, 15 + k * 0.4)); if (a <= 0) return; try { ArtMage.portrait(x, cid, X + w * (0.3 + k * 0.4), Y + h * 0.78, h * 0.13 * a, t, 0); } catch (e) { /* nada */ } }); });
      if (t > 12.8 && t < 21) sumi(cxp, cyp - H * 0.05 + (1 - E.back(seg(t, 12.8, 13.6))) * H * 0.4, R / 320, t, (t > 13.4 && t < 17.6) || (t > 18.4 && t < 21));
      if (t > 21) { title(W, H, 'FIN DEL MUNDO 3', '¡El pergamino está a salvo!', E.out(seg(t, 21.2, 22.2)), '#fff2e0', 0.2); seal(W * 0.5, H * 0.32, 18, seg(t, 22, 22.4)); x.save(); x.globalAlpha = seg(t, 22.4, 23.2); x.textAlign = 'center'; x.font = fontB(Math.max(13, W * 0.016), 800); x.fillStyle = '#f4e6c8'; x.fillText('Gracias por jugar · GameHub', W / 2, H * 0.86); x.restore(); }
      x.globalAlpha = seg(t, 25, 26); x.fillStyle = '#000'; x.fillRect(0, 0, W, H); x.globalAlpha = 1;
    } };

  return { play, end, levelFilm, FILMS, get on() { return !!cur; }, _seek: t => { if (cur) { cur.t = t; cur.cues = cur.cues.filter(q => q.t > t); } } };
})();
