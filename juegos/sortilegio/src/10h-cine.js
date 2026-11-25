/* =========================================================================
   CINE — lo que hace que cada momento se sienta de película, sin tapar la
   acción ni cambiar cómo se juega (todo es dibujo y cámara):
   · Sellos mágicos bajo quien funde (dos anillos con las runas de sus dos
     elementos) y un golpe de cámara que «respira» con cada hechizo grande.
   · Impactos: chispas que salen en la dirección del golpe, destello en
     estrella, golpe de cámara y un borde de color en la pantalla con los
     golpes muy fuertes.
   · Marcas que quedan en el suelo un rato: quemaduras, grietas, escarcha.
   · Caída de un mago: franjas de cine, luz que se cierra sobre él, alma que
     sube y la pantalla que se apaga un instante.
   · Ráfagas de luz en el borde para el contraconjuro y el Gran Sortilegio.
   Con calidad ligera hace la mitad (o nada de lo más pesado).
   ========================================================================= */
const Cine = (() => {
  const S = { punch: 0, edge: null, ko: null, bars: 0, barsT: 0, sigils: [], decals: [], sparks: [], beat: 0 };
  const EC = el => ELEMENTS[el] || null;
  const vr = (a, b) => a + Math.random() * (b - a);
  function punch(v) { S.punch = Math.min(0.09, Math.max(S.punch, v)); }
  function edge(rgb, a, life = 0.3) { if (!S.edge || a >= S.edge.a * (1 - S.edge.t / S.edge.life)) S.edge = { rgb, a, t: 0, life }; }
  function sigil(x, y, els, big) { S.sigils.push({ x, y, els, t: 0, life: big ? 0.75 : 0.5, r: big ? 92 : 56, rot: Math.random() * TAU }); if (S.sigils.length > 10) S.sigils.shift(); }
  function decal(type, x, y, r, el) { S.decals.push({ type, x, y, r, el, t: 0, life: type === 'frost' ? 5 : 6.5, seed: Math.random() * 100 }); if (S.decals.length > (LOWFX ? 8 : 18)) S.decals.shift(); }
  function sparks(x, y, dx, dy, el, n, sp) {
    const E = EC(el) || ELEMENTS.wind, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, k = LOWFX ? 0.5 : 1;
    for (let i = 0; i < Math.round(n * k); i++) { const a = Math.atan2(uy, ux) + vr(-0.7, 0.7), v = vr(sp * 0.5, sp * 1.2); S.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: vr(0.12, 0.26), col: Math.random() < 0.45 ? E.c0 : E.c1, w: vr(1.5, 3.2) }); }
    if (S.sparks.length > 160) S.sparks.splice(0, S.sparks.length - 160);
  }
  /* ---------- eventos (el anfitrión y los remotos los ven igual) ---------- */
  function onEvent(G, e) {
    if (G.attract) return;
    switch (e.type) {
      case 'fusionCast': { const k = String(e.key || '').split('+'); sigil(e.x0, e.y0, k, true); punch(0.03); break; }
      case 'cast': if (!e.fusion && e.level === 2) { sigil(e.x, e.y, [e.el], false); punch(0.012); } break;
      case 'cometBurst': punch(0.022); break;
      case 'mawSpit': punch(0.035); decal('crack', e.x, e.y, 70); break;
      case 'sunBlast': punch(0.045); edge([255, 200, 110], 0.26, 0.35); decal('scorch', e.x, e.y, e.r * 0.6); break;
      case 'hurt': {
        if (e.dot || !(e.dmg >= 6)) break; const u = e.unit, dx = u && u.vx ? u.vx : (Math.random() - 0.5), dy = u && u.vy ? u.vy : (Math.random() - 0.5);
        const el = e.el && ELEMENTS[e.el] ? e.el : 'wind';
        sparks(e.x, e.y - 22, dx, dy, el, e.dmg >= 15 ? 12 : 7, e.dmg >= 15 ? 520 : 380);
        if (e.dmg >= 14) { FX.S({ type: 'star4', x: e.x, y: e.y - 26, r: 26 + Math.min(40, e.dmg), life: 0.2 }); punch(e.dmg >= 22 ? 0.035 : 0.018); }
        if (e.dmg >= 20 && u && u.isMage) { const E = EC(el); edge(E ? E.light : [255, 255, 255], Math.min(0.35, e.dmg / 80)); }
        break;
      }
      case 'boom': if (e.el === 'fire' || e.el === 'lava') decal('scorch', e.x, e.y, e.r * 0.8); else if (e.el === 'earth') decal('crack', e.x, e.y, e.r * 0.7); punch(e.r > 70 ? 0.025 : 0.012); break;
      case 'quake': decal('crack', e.x, e.y, e.soft ? 50 : 80); punch(e.soft ? 0.012 : 0.022); break;
      case 'freeze': decal('frost', e.x, e.y, 46); break;
      case 'beam': punch(0.02); break;
      case 'thunder': punch(e.big ? 0.03 : 0.01); if (e.big) edge([200, 170, 255], 0.2, 0.2); break;
      case 'counter': edge([255, 220, 130], 0.35, 0.35); punch(0.04); break;
      case 'cageShut': punch(0.025); break;
      case 'cageBurst': punch(0.03); edge([255, 236, 170], 0.18, 0.25); break;
      case 'mawOpen': punch(0.03); decal('crack', e.x, e.y, 90); break;
      case 'granStart': S.bars = Math.max(S.bars, 1); S.barsT = 0.9; break;
      case 'gran': punch(0.08); edge([255, 214, 110], 0.45, 0.5); break;
      case 'down': {
        const m = G.mages[e.who]; S.ko = { x: e.x, y: e.y, t: 0, life: 1.5, col: m && PLAYER_COLORS[m.idx] ? PLAYER_COLORS[m.idx].main : '#fff' }; S.bars = 1; S.barsT = 1.3; punch(0.07); edge([255, 255, 255], 0.4, 0.25);
        // el alma que sube
        for (let k = 0; k < (LOWFX ? 10 : 24); k++) FX.P({ x: e.x + vr(-10, 10), y: e.y + vr(-6, 6), z: vr(20, 60), vx: vr(-30, 30), vy: vr(-10, 10), vz: vr(80, 220), g: -60, drag: 1.2, life: vr(0.9, 1.6), size: vr(2, 4), color: k % 3 ? '#ffffff' : (m && PLAYER_COLORS[m.idx] ? PLAYER_COLORS[m.idx].main : '#ffe9a0'), kind: 'ember' });
        break;
      }
      case 'matchWin': S.bars = 1; S.barsT = 1.6; edge([255, 214, 110], 0.3, 0.6); break;
    }
  }
  /* ---------- tiempo (cuadro a cuadro, también en pausa de golpe) ---------- */
  function step(dt) {
    S.punch *= Math.exp(-dt * 9); if (S.punch < 0.001) S.punch = 0;
    if (S.edge) { S.edge.t += dt; if (S.edge.t >= S.edge.life) S.edge = null; }
    if (S.ko) { S.ko.t += dt; if (S.ko.t >= S.ko.life) S.ko = null; }
    if (S.barsT > 0) S.barsT -= dt; S.bars += ((S.barsT > 0 ? 1 : 0) - S.bars) * (1 - Math.exp(-dt * 7));
    for (const s of S.sigils) s.t += dt; S.sigils = S.sigils.filter(s => s.t < s.life);
    for (const d of S.decals) d.t += dt; S.decals = S.decals.filter(d => d.t < d.life);
    for (const p of S.sparks) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - 6 * dt; p.vy *= 1 - 6 * dt; } S.sparks = S.sparks.filter(p => p.t < p.life);
  }
  function clear() { S.punch = 0; S.edge = null; S.ko = null; S.bars = 0; S.barsT = 0; S.sigils.length = 0; S.decals.length = 0; S.sparks.length = 0; }
  /* ---------- en el suelo: marcas y sellos ---------- */
  function under(x, G) {
    const t = G.time;
    for (const d of S.decals) {
      const a = Math.min(1, (d.life - d.t) / 1.5) * Math.min(1, d.t * 8);
      x.save(); x.globalAlpha = a;
      if (d.type === 'scorch') { const g = x.createRadialGradient(d.x, d.y, d.r * 0.1, d.x, d.y, d.r); g.addColorStop(0, 'rgba(18,10,8,0.6)'); g.addColorStop(0.6, 'rgba(30,18,12,0.35)'); g.addColorStop(1, 'rgba(30,18,12,0)'); x.fillStyle = g; x.beginPath(); x.arc(d.x, d.y, d.r, 0, TAU); x.fill(); if (d.t < 1.4) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = a * (1 - d.t / 1.4) * 0.8; for (let k = 0; k < 5; k++) { const an = k / 5 * TAU + d.seed; x.fillStyle = '#ff7a2a'; x.beginPath(); x.arc(d.x + Math.cos(an) * d.r * 0.45, d.y + Math.sin(an) * d.r * 0.45, 2.5, 0, TAU); x.fill(); } } }
      else if (d.type === 'crack') { x.strokeStyle = 'rgba(30,20,14,0.7)'; x.lineCap = 'round'; for (let k = 0; k < 7; k++) { const an = k / 7 * TAU + d.seed, L = d.r * (0.55 + 0.45 * hash2(k, d.seed)); x.lineWidth = 3 - k % 2; x.beginPath(); x.moveTo(d.x, d.y); x.lineTo(d.x + Math.cos(an + 0.3) * L * 0.45, d.y + Math.sin(an + 0.3) * L * 0.45); x.lineTo(d.x + Math.cos(an - 0.1) * L * 0.8, d.y + Math.sin(an - 0.1) * L * 0.8); x.lineTo(d.x + Math.cos(an + 0.15) * L, d.y + Math.sin(an + 0.15) * L); x.stroke(); } }
      else if (d.type === 'frost') { x.fillStyle = 'rgba(220,245,255,0.28)'; x.beginPath(); x.arc(d.x, d.y, d.r, 0, TAU); x.fill(); x.strokeStyle = 'rgba(240,252,255,0.6)'; x.lineWidth = 1.2; for (let k = 0; k < 6; k++) { const an = k / 6 * TAU + d.seed; x.beginPath(); x.moveTo(d.x, d.y); x.lineTo(d.x + Math.cos(an) * d.r, d.y + Math.sin(an) * d.r); x.stroke(); } }
      x.restore();
    }
    for (const s of S.sigils) {
      const f = s.t / s.life, R = s.r * (0.4 + 0.6 * Math.sin(Math.min(1, f * 2.2) * Math.PI / 2)), a = f < 0.7 ? 1 : (1 - f) / 0.3, E1 = EC(s.els[0]) || ELEMENTS.wind, E2 = EC(s.els[1] || s.els[0]) || E1;
      x.save(); x.globalCompositeOperation = 'lighter'; x.translate(s.x, s.y);
      x.globalAlpha = a * 0.9; x.strokeStyle = E1.c1; x.lineWidth = 3; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.stroke();
      x.strokeStyle = E2.c1; x.lineWidth = 1.6; x.beginPath(); x.arc(0, 0, R * 0.78, 0, TAU); x.stroke();
      // runas del sello: marcas que giran en sentidos contrarios
      const n = s.els.length > 1 ? 10 : 6;
      x.rotate(s.rot + t * 1.8); x.fillStyle = E1.c0; for (let k = 0; k < n; k++) { x.rotate(TAU / n); x.fillRect(R * 0.86, -2, 8, 4); }
      x.rotate(-(s.rot + t * 1.8) * 2); x.fillStyle = E2.c0; for (let k = 0; k < n; k++) { x.rotate(TAU / n); x.beginPath(); x.moveTo(R * 0.62, 0); x.lineTo(R * 0.7, -4); x.lineTo(R * 0.7, 4); x.closePath(); x.fill(); }
      if (s.els.length > 1) { x.rotate(t * 2.5); x.strokeStyle = E2.c0; x.globalAlpha = a * 0.6; x.lineWidth = 1.2; x.beginPath(); for (let k = 0; k <= 5; k++) { const an = k * 4 * Math.PI / 5; x.lineTo(Math.cos(an) * R * 0.6, Math.sin(an) * R * 0.6); } x.stroke(); }
      x.globalAlpha = a * 0.35; const g = x.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, E1.c1); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fill();
      x.restore();
    }
  }
  /* ---------- por encima: chispas de los golpes ---------- */
  function over(x, G) {
    if (!S.sparks.length) return;
    x.save(); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
    for (const p of S.sparks) { const f = p.t / p.life; x.globalAlpha = 1 - f; x.strokeStyle = p.col; x.lineWidth = p.w * (1 - f * 0.6); x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); x.stroke(); }
    x.restore();
  }
  /* ---------- en la pantalla: bordes de color, caída de un mago, franjas de cine ---------- */
  function screen(ctx, G, sw, sh, W) {
    if (G.attract) return;
    if (S.edge) {
      const e = S.edge, f = e.t / e.life, a = e.a * (1 - f) * (1 - f);
      const g = ctx.createRadialGradient(sw / 2, sh / 2, Math.min(sw, sh) * 0.32, sw / 2, sh / 2, Math.hypot(sw, sh) * 0.6); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(${e.rgb.join(',')},${a})`);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(0, 0, sw, sh); ctx.restore();
    }
    if (S.ko) {
      const k = S.ko, f = k.t / k.life, a = f < 0.15 ? f / 0.15 : f > 0.6 ? (1 - f) / 0.4 : 1, [X, Y] = W(k.x, k.y - 30), R = Math.max(sw, sh) * (0.5 - 0.22 * Math.min(1, f * 3));
      const g = ctx.createRadialGradient(X, Y, R * 0.25, X, Y, R); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(6,4,14,${0.55 * a})`);
      ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, sw, sh); ctx.restore();
    }
    if (S.bars > 0.01) { const h = Math.round(sh * 0.07 * S.bars); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, sw, h); ctx.fillRect(0, sh - h, sw, h); }
  }
  // luces que dan los sellos
  function lights(G, add) { for (const s of S.sigils) { const f = s.t / s.life, E = EC(s.els[0]); if (E) add(s.x, s.y - 10, s.r * 1.6, E.light, (1 - f) * 0.9, 0.25 * (1 - f)); } }
  return { onEvent, step, under, over, screen, lights, clear, get punch() { return S.punch; } };
})();
