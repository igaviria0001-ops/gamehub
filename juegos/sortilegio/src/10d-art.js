/* =========================================================================
   DIBUJO DE CADA CUADRO — suelo, lo bajo, lo alto ordenado por profundidad,
   efectos, la noche con sus luces (cada hechizo alumbra), la niebla y la
   Bruma, marcas de jugador, letreros y el HUD.
   ========================================================================= */
const Art = (() => {
  // luces: un círculo blanco suave que se "resta" a la oscuridad, y uno de color que se suma
  const spr = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.75)'); g.addColorStop(0.7, 'rgba(255,255,255,0.25)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return c; })();
  const tint = {};
  const colSpr = rgb => { const k = rgb.join(','); if (tint[k]) return tint[k]; const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, `rgba(${k},0.9)`); g.addColorStop(0.4, `rgba(${k},0.4)`); g.addColorStop(1, `rgba(${k},0)`); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return (tint[k] = c); };
  const dk = document.createElement('canvas'), dx = dk.getContext('2d');
  const fogBlobs = Array.from({ length: 14 }, (_, k) => ({ x: hash2(k, 1) * 1800, y: hash2(k, 2) * 1000, r: 160 + hash2(k, 3) * 220, v: 8 + hash2(k, 4) * 14, a: 0.05 + hash2(k, 5) * 0.07 }));
  let fireflies = null;
  function lights(G) {
    const L = [], T = G.T, t = G.time;
    const add = (x, y, r, rgb, a = 1, col = 0.35) => L.push({ x, y, r, rgb, a, col });
    for (const s of G.sources) { const E = ELEMENTS[s.el]; add(s.x, s.y - 30, s.cd > 0 ? 70 : 150 + Math.sin(t * 2 + s.x) * 10, E.light, s.cd > 0 ? 0.5 : 0.9, 0.3); }
    for (const m of G.mages) { if (!m.alive) continue; add(m.x, m.y - 24, 170, [235, 225, 255], 0.85, 0); for (const h of m.hands) add(m.x, m.y - 26, h.hold >= 0 || m.fuse ? 120 : 70, ELEMENTS[h.el].light, 0.55, h.hold >= 0 ? 0.35 : 0.18); if (m.emb >= 100) add(m.x, m.y - 30, 110, [255, 220, 120], 0.6, 0.3); }
    for (const s of G.spells) {
      const E = ELEMENTS[s.el] || ELEMENTS.wind;
      switch (s.t) {
        case 'proj': add(s.x, s.y - 18, s.petal ? 40 : 95, E.light, 0.9, 0.45); break;
        case 'firenado': add(s.x, s.y - 40, 190, [255, 130, 50], 1, 0.5); break;
        case 'vortex': add(s.x, s.y - 20, 110, [180, 255, 225], 0.6, 0.2); break;
        case 'wave': add(s.x + Math.cos(s.ang) * s.d, s.y + Math.sin(s.ang) * s.d, 140, [90, 175, 255], 0.6, 0.3); break;
        case 'strike': add(s.x, s.y, s.r * 1.8, [190, 150, 255], 0.4 + (1 - s.delay / s.S.delay) * 0.5, 0.3); break;
        case 'lob': add(s.x, s.y - s.z, s.kind === 'meteor' ? 150 : 60, s.kind === 'meteor' ? [255, 130, 50] : E.light, 0.9, 0.4); break;
        case 'mine': add(s.x, s.y, 50, [255, 140, 60], 0.6, 0.3); break;
        case 'bloom': add(s.x, s.y, 140, [150, 255, 170], 0.8, 0.3); break;
        case 'magnet': add(s.x, s.y - 34, 150, [190, 150, 255], 0.9, 0.4); break;
        case 'storm': add(s.x, s.y, s.r * 1.2, [120, 150, 220], 0.35, 0.1); break;
        case 'beam': if (!s.fired) add(s.x, s.y - 20, 100, [255, 180, 90], 0.8, 0.4); break;
      }
    }
    for (const u of G.units) { if (u.obj === 'turret' && u.alive) add(u.x, u.y - 32, 100, [200, 170, 255], 0.8, 0.3); else if (u.obj === 'tejo') add(u.x, u.y, 120, [255, 210, 120], 0.8, 0.2); else if (u instanceof Creature && u.alive) add(u.x, u.y - 24, 90, ELEMENTS[u.D.el].light, 0.7, 0.3); }
    ArtSpells2.lights(G, add);
    if (G.altar) add(G.altar.x, G.altar.y, G.altar.r * 1.6, [255, 220, 140], 0.75, 0.15);
    for (const r of G.runes || []) add(r.x, r.y - 30, 150, [255, 230, 180], 0.9, 0.2);
    if (G.dummy && G.mode === 'school') add(G.dummy.x, G.dummy.y - 30, 180, [255, 230, 180], 0.9, 0.1);
    if (G.mode === 'camp') { for (const o of G.objs) { if (o.t === 'brazier' && o.lit) add(o.x, o.y - 30, 200, [255, 160, 70], 1, 0.35); else if (o.t === 'lantern' || o.t === 'canoe') add(o.x, o.y - 60, 220, [255, 220, 140], 1, o.look === 'tree' ? 0.12 : 0.3); else if (o.t === 'exit' && o.open) add(o.x, o.y, 160, [255, 230, 150], 0.9, 0.25); else if (o.t === 'totem' && o.power > 0) add(o.x, o.y - 40, 140, [190, 150, 255], 0.9, 0.3); else if (o.t === 'seal') add(o.x, o.y, 120, ELEMENTS[o.need.split('+')[0]].light, 0.6, 0.15); } if (G.boss && G.boss.alive) add(G.boss.x, G.boss.y - 60, 220, ELEMENTS[G.boss.el].light, 0.8, 0.2); }
    if (G.goals) for (const g of G.goals) add(g.x, g.y, 120, [255, 200, 120], 0.6, 0.1);
    if (T.burning) { let n = 0; for (let i = 0; i < T.n && n < 60; i++) if (T.fire[i] > 0) { n++; add(Terrain.cx(T, i), Terrain.cy(T, i), T.base[i] === TT.BUSH ? 170 : 110, [255, 140, 60], 0.85, n > 8 ? 0.03 : 0.1); } }
    for (let i = 0; i < T.n; i++) { if (T.lava[i] > 0 || (T.base[i] === TT.LAVA && T.cool[i] <= 0)) { if ((i * 7) % 3 === 0) add(Terrain.cx(T, i), Terrain.cy(T, i), 110, [255, 110, 40], 0.7, 0.25); } else if (T.elec[i] > 0 && i % 2 === 0) add(Terrain.cx(T, i), Terrain.cy(T, i), 60, [190, 150, 255], 0.6, 0.3); }
    for (const o of FX.shapes) { if (o.type === 'flash' || o.type === 'bolt' || o.type === 'beamFlash') { const f = 1 - o.t / o.life; if (o.type === 'beamFlash') { for (let k = 0; k <= 4; k++) add(lerp(o.x0, o.x1, k / 4), lerp(o.y0, o.y1, k / 4) + 16, 130, [255, 170, 80], f, 0.3); } else add(o.x, o.y, (o.r || 60) * 1.8, (ELEMENTS[o.el] || ELEMENTS.bolt).light, f, 0.2); } }
    if (fireflies) for (const f of fireflies) add(f.x, f.y, 26, [220, 255, 140], 0.5 + 0.5 * Math.sin(t * 3 + f.p), 0.6);
    return L;
  }
  function stepFireflies(G, dt) {
    if (!fireflies || fireflies.arena !== G.arena) { fireflies = Array.from({ length: LOWFX ? 10 : 22 }, (_, k) => ({ x: Math.random() * G.T.W, y: Math.random() * G.T.H, vx: 0, vy: 0, p: Math.random() * 6 })); fireflies.arena = G.arena; }
    for (const f of fireflies) { f.vx += (Math.random() - 0.5) * 60 * dt; f.vy += (Math.random() - 0.5) * 60 * dt; f.vx *= 0.98; f.vy *= 0.98; f.x = (f.x + f.vx * dt + G.T.W) % G.T.W; f.y = (f.y + f.vy * dt + G.T.H) % G.T.H; }
  }
  let lastT = 0, vig = null;
  function render(G, ctx, cam, sw, sh, dpr) {
    const z = cam.z, now = performance.now() / 1000, dt = Math.min(0.05, now - lastT); lastT = now;
    stepFireflies(G, dt);
    const th = THEMES[G.A.theme] || THEMES.paramo;
    const W = (x, y) => [sw / 2 + (x - cam.x) * z + cam.sx, sh / 2 + (y - cam.y) * z + cam.sy];
    const view = { x0: cam.x - sw / 2 / z - 60, x1: cam.x + sw / 2 / z + 60, y0: cam.y - sh / 2 / z - 80, y1: cam.y + sh / 2 / z + 80 };
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#05060e'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const wt = () => ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (sw / 2 - cam.x * z + cam.sx), dpr * (sh / 2 - cam.y * z + cam.sy));
    if (th.sky) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); Post.backdrop(ctx, G, cam, sw, sh, th); }
    wt();
    const img = ArtGround.prerender(G); ctx.imageSmoothingEnabled = true; ctx.drawImage(img, 0, 0, G.T.W, G.T.H);
    Post.water(ctx, G, cam, sw, sh, dpr, img); wt();
    ArtGround.overlays(ctx, G, view, G.time);
    Modes.drawUnder(ctx, G);
    ArtSpells.under(ctx, G); ArtSpells2.under(ctx, G);
    // lo alto, ordenado por profundidad
    const list = [];
    for (const s of G.sources) list.push({ y: s.y + 4, draw: x => source(x, G, s) });
    for (const s of G.statues || []) list.push({ y: s.y + 14, draw: x => ArtGround.statue(x, G, s) });
    for (const m of G.mages) if (m.alive) list.push({ y: m.y, draw: x => ArtMage.draw(x, G, m) });
    for (const u of G.units) { if (u instanceof Creature && u.alive) list.push({ y: u.y, draw: x => ArtCreature.draw(x, G, u) }); else if (u.obj === 'tejo' || u.obj === 'stone') list.push({ y: u.y, draw: x => Modes.drawTejo(x, G, u) }); else if (u.obj === 'dummy') list.push({ y: u.y, draw: x => dummy(x, G, u) }); }
    ArtGround.tallItems(G, view, list);
    Modes.drawRunes(G, list);
    if (G.mode === 'camp') Camp.draw(ctx, G, list);
    ArtSpells.items(G, list); ArtSpells2.items(G, list);
    list.sort((a, b) => a.y - b.y);
    Post.shadows(ctx, G, th);
    for (const it of list) it.draw(ctx);
    ArtSpells.over(ctx, G); ArtSpells2.over(ctx, G);
    ArtSpells.shapes(ctx, G);
    ArtSpells.parts(ctx);
    // niebla que se mueve
    const fogK = (1 + (G.mist || 0) * 3.2) * (th.fogK == null ? 1 : th.fogK);
    for (const b of fogBlobs) { const fx = (b.x + G.time * b.v) % (G.T.W + 400) - 200, g = ctx.createRadialGradient(fx, b.y, 0, fx, b.y, b.r); g.addColorStop(0, `rgba(${th.fog.join(',')},${Math.min(0.5, b.a * fogK)})`); g.addColorStop(1, `rgba(${th.fog.join(',')},0)`); ctx.fillStyle = g; ctx.fillRect(fx - b.r, b.y - b.r, b.r * 2, b.r * 2); }
    // ---- la noche y sus luces ----
    const hw = Math.max(1, Math.round(sw * dpr / 2)), hh = Math.max(1, Math.round(sh * dpr / 2));
    if (dk.width !== hw || dk.height !== hh) { dk.width = hw; dk.height = hh; }
    const L = lights(G), amb = G.eclipse ? 0.84 : G.L && G.mode === 'camp' && G.L.dark ? 0.62 : Math.min(0.9, th.ambientA + (G.mist || 0) * 0.3 + (G.rain ? 0.1 : 0));
    dx.setTransform(1, 0, 0, 1, 0, 0); dx.globalCompositeOperation = 'source-over'; dx.clearRect(0, 0, hw, hh); dx.fillStyle = `rgba(${th.ambient.join(',')},${amb})`; dx.fillRect(0, 0, hw, hh);
    dx.globalCompositeOperation = 'destination-out';
    const k2 = dpr / 2;
    for (const l of L) { const [X, Y] = W(l.x, l.y), r = l.r * z; if (X < -r || Y < -r || X > sw + r || Y > sh + r) continue; dx.globalAlpha = Math.min(1, l.a); dx.drawImage(spr, (X - r) * k2, (Y - r) * k2, r * 2 * k2, r * 2 * k2); }
    dx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(dk, 0, 0, ctx.canvas.width, ctx.canvas.height);
    wt(); ctx.globalCompositeOperation = 'lighter';
    for (const l of L) { if (!l.col) continue; if (l.x < view.x0 - l.r || l.x > view.x1 + l.r || l.y < view.y0 - l.r || l.y > view.y1 + l.r) continue; ctx.globalAlpha = l.col * Math.min(1, l.a) * (th.lightK == null ? 1 : th.lightK); ctx.drawImage(colSpr(l.rgb), l.x - l.r, l.y - l.r, l.r * 2, l.r * 2); }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    // ---- viñeta: bordes oscuros que centran la mirada ----
    if (!vig || vig.w !== sw || vig.h !== sh) { vig = document.createElement('canvas'); vig.w = sw; vig.h = sh; vig.width = 320; vig.height = Math.max(1, Math.round(320 * sh / sw)); const vx = vig.getContext('2d'), g = vx.createRadialGradient(160, vig.height / 2, vig.height * 0.35, 160, vig.height / 2, 200); g.addColorStop(0, 'rgba(4,3,14,0)'); g.addColorStop(1, 'rgba(4,3,14,0.55)'); vx.fillStyle = g; vx.fillRect(0, 0, 320, vig.height); }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(vig, 0, 0, ctx.canvas.width, ctx.canvas.height);
    // ---- acabado pro: rayos de luna, motas en primer plano, color y resplandor ----
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); Post.rays(ctx, G, cam, sw, sh, th); Post.bokeh(ctx, G, cam, sw, sh, th); Post.grade(ctx, th, sw, sh); Post.bloom(ctx, th.bloom == null ? 1 : th.bloom); wt();
    // ---- lluvia ----
    if (G.rain) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.strokeStyle = 'rgba(170,200,255,0.35)'; ctx.lineWidth = 1.2; ctx.beginPath();
      const n = LOWFX ? 60 : 140; for (let k = 0; k < n; k++) { const x0 = (hash2(k, 7) * sw * 1.2 + G.time * 90) % (sw * 1.2) - sw * 0.1, y0 = (hash2(k, 9) * sh + G.time * 900 * (0.8 + hash2(k, 3) * 0.4)) % (sh + 40) - 20; ctx.moveTo(x0, y0); ctx.lineTo(x0 - 5, y0 + 18); }
      ctx.stroke(); wt();
    }
    // ---- la Bruma ----
    if (G.ring) {
      const R = G.ring;
      ctx.save(); ctx.beginPath(); ctx.rect(-200, -200, G.T.W + 400, G.T.H + 400); ctx.arc(R.x, R.y, R.r, 0, TAU, true);
      ctx.fillStyle = `rgba(110,90,170,${0.32 + R.f * 0.25})`; ctx.fill('evenodd');
      ctx.strokeStyle = 'rgba(210,190,255,0.55)'; ctx.lineWidth = 6; ctx.setLineDash([18, 14]); ctx.lineDashOffset = G.time * 30; ctx.beginPath(); ctx.arc(R.x, R.y, R.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
    }
    // marcas de jugador y letreros en el mundo
    for (const m of G.mages) ArtMage.marker(ctx, G, m, z);
    // letreros de pantalla apilados (no se montan unos sobre otros)
    { const rows = [0, 0]; for (const p of G.pops) if (p.screen) { const k = p.low ? 1 : 0; if (p.row == null) p.row = rows[k]; rows[k] = Math.max(rows[k], p.row + 1); } }
    // letreros del mundo: el mismo texto repetido (¡Incendio! ×3) se muestra una vez, y los que se montarían se apilan hacia arriba
    const placed = [], topY = 92 * HUD.unit(), seenTxt = new Map();
    for (const p of G.pops) {
      const f = p.t / (p.big ? 1.6 : 1.1), px = p.follow ? p.follow.x : p.x, py = p.follow ? p.follow.y - 78 : p.y;
      let [X, Y] = p.screen ? [sw / 2, sh * (p.low ? 0.68 : 0.42) + (p.row || 0) * 40 * Math.min(1.3, Math.max(0.65, Math.min(sw / 1280, sh / 720)))] : W(px, py - f * 40);
      const s = (p.big ? 30 : p.small ? 17 : 22) * HUD.unit() * (f < 0.12 ? 0.6 + f / 0.12 * 0.4 : 1);
      if (!p.screen) {
        const list = seenTxt.get(p.text) || [];
        if (p.dup == null) p.dup = list.some(o => Math.abs(o[0] - X) < 260 && Math.abs(o[1] - Y) < 160);
        if (p.dup) continue; list.push([X, Y]); seenTxt.set(p.text, list);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.font = p.big ? fontT(s) : fontB(s, 900);
        const w = ctx.measureText(p.text).width / 2 + 6, h = s * 0.62;
        X = clamp(X, w + 8, sw - w - 8); Y = Math.max(Y, topY + h);
        for (let it = 0; it < 6; it++) { const hit = placed.find(q => Math.abs(q[0] - X) < q[2] + w && Math.abs(q[1] - Y) < q[3] + h); if (!hit) break; Y = hit[1] - hit[3] - h - 2; if (Y < topY + h) { Y = hit[1] + hit[3] + h + 2; } }
        placed.push([X, Y, w, h]);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = f > 0.75 ? (1 - f) / 0.25 : 1; ctx.font = p.gran ? fontT(s * 1.3) : p.big ? fontT(s) : fontB(s, 900); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = Math.max(3, s * 0.16); ctx.strokeStyle = 'rgba(10,6,24,0.85)'; ctx.strokeText(p.text, X, Y); ctx.fillStyle = p.color; ctx.fillText(p.text, X, Y);
      ctx.globalAlpha = 1;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    HUD.draw(ctx, G, sw, sh);
  }
  // espantapájaros de la Escuela
  function dummy(x, G, u) {
    x.save(); x.translate(u.x, u.y);
    x.fillStyle = 'rgba(10,8,20,0.4)'; x.beginPath(); x.ellipse(0, 3, 18, 7, 0, 0, TAU); x.fill();
    x.fillStyle = '#6a4a2a'; x.fillRect(-3, -60, 6, 62); x.fillRect(-26, -46, 52, 5);
    x.fillStyle = '#c89a5a'; x.beginPath(); x.moveTo(-16, -44); x.lineTo(16, -44); x.lineTo(12, -14); x.lineTo(-12, -14); x.fill();
    x.fillStyle = '#e8c88a'; x.beginPath(); x.arc(0, -62, 12, 0, TAU); x.fill(); x.fillStyle = '#5a3a1a'; x.beginPath(); x.ellipse(0, -72, 18, 5, 0, 0, TAU); x.fill(); x.fillRect(-8, -84, 16, 12);
    x.fillStyle = '#2a1a0a'; x.fillRect(-6, -64, 3, 3); x.fillRect(3, -64, 3, 3);
    if (u.st.wet > 0) { x.fillStyle = 'rgba(140,210,255,0.8)'; x.beginPath(); x.arc(-8, -30, 2, 0, TAU); x.arc(8, -24, 2, 0, TAU); x.fill(); }
    if (u.flash > 0) { x.globalCompositeOperation = 'lighter'; x.fillStyle = `rgba(255,255,255,${u.flash * 3})`; x.beginPath(); x.arc(0, -40, 26, 0, TAU); x.fill(); }
    x.restore();
  }
  // fuente mágica: altar con un orbe que flota
  function source(x, G, s) {
    const E = ELEMENTS[s.el], t = G.time, on = s.cd <= 0, bob = Math.sin(t * 2 + s.x) * 4, Y = s.y - 40 + bob;
    if (on) { for (let k = 0; k < 2; k++) { const p = (t * 0.7 + k / 2 + s.x) % 1; x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = E.c1; x.globalAlpha = 1 - p; x.lineWidth = 2; x.beginPath(); x.ellipse(s.x, s.y, 14 + p * 28, (14 + p * 28) * 0.55, 0, 0, TAU); x.stroke(); x.restore(); } }
    ArtSpells.glow(x, s.x, Y, on ? 46 : 20, E.c1 + (on ? 'cc' : '55'));
    const r = on ? 12 : 6 + 6 * (1 - s.cd / 9);
    x.fillStyle = E.c2; x.beginPath(); x.arc(s.x, Y, r, 0, TAU); x.fill(); x.fillStyle = E.c1; x.beginPath(); x.arc(s.x, Y - 1, r * 0.8, 0, TAU); x.fill();
    if (on) HUD.icon(x, s.el, s.x, Y, r * 0.75, E.c0);
    else { x.strokeStyle = E.c0; x.lineWidth = 2; x.beginPath(); x.arc(s.x, Y, r + 5, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - s.cd / 9)); x.stroke(); }
    if (on && Math.random() < 0.08) FX.P({ x: s.x + vr(-10, 10), y: s.y, z: 40, vz: vr(20, 50), g: -20, life: vr(0.6, 1.2), size: vr(1.5, 3), color: E.c0 });
  }
  return { render };
})();
