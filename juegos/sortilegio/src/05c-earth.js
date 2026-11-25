/* =========================================================================
   TIERRA 3.0 — las fusiones de tierra rehechas para que sirvan de verdad y
   se vean épicas (Spells / Spells2 delegan aquí lo que no conocen):
   · Tormenta de arena (viento+tierra): torbellino de arena y piedras que te
     envuelve; las piedras golpean, las balas se deshacen y adentro nadie te
     puede apuntar. Al lanzarla, estallido que empuja.
   · Torres de rayo (tierra+rayo): dos torres de piedra unidas por un rayo;
     cruzarlo electrocuta y las torres le disparan al que se acerque. El rayo
     corre por el agua y los charcos que toque.
   · Jaula de cristal (tierra+luz): un anillo de luz persigue al rival y la
     jaula brota a su alrededor (no donde estaba). Adentro la luz quema; al
     final, estalla hacia adentro.
   · Fosa (tierra+sombra): una sombra se pega a los pies del rival, lo frena
     con manos oscuras y el suelo se lo traga. Se escapa esquivando.
   · Magma (fuego+tierra): el meteoro se parte y caen tres fragmentos más.
   · Alud de lodo (agua+tierra): avalancha de barro que avanza, arrastra,
     moja y deja el suelo hecho lodo.
   ========================================================================= */
const Earth = (() => {
  const hit = (...a) => Spells.hit(...a), add = (...a) => Spells.add(...a), foe = (...a) => Spells.foe(...a);
  const segDist = (...a) => Spells.segDist(...a);
  const okCell = (T, i) => i >= 0 && !Terrain.solid(T, i) && T.base[i] !== TT.CHASM && T.base[i] !== TT.ROCK && !(T.base[i] === TT.DEEP && T.ice[i] <= 0) && T.wall[i] <= 0;
  const busy = (G, i) => { const T = G.T, cx = Terrain.cx(T, i), cy = Terrain.cy(T, i); return G.units.some(u => u.alive && Math.abs(u.x - cx) < CELL / 2 + u.r - 3 && Math.abs(u.y - cy) < CELL / 2 + u.r - 3); };
  const dashing = u => u.isMage && ((u.dash && u.dash.t > 0) || u.iframes > 0.05);
  // a quién va dirigido: el rival marcado o en la mira (no las «metas» de la campaña), o un punto al frente
  function pickTarget(G, m, range) {
    const a = m.aim(G, range, 0), tg = a.target && !a.target.spot && a.dist <= range * 1.15 ? a.target : null, d = Math.min(range, 260);
    return { tg, ang: a.ang, x: tg ? tg.x : clamp(m.x + Math.cos(a.ang) * d, 30, G.T.W - 30), y: tg ? tg.y : clamp(m.y + Math.sin(a.ang) * d, 30, G.T.H - 30) };
  }

  /* ---------- lanzar ---------- */
  function cast(G, m, S, el, o, B) {
    const T = G.T, P = B.power, Z = B.size, L = B.gran ? 1.3 : 1;
    if (S.kind === 'sandstorm') {
      const n = S.rocks + (B.gran ? 2 : 0), s = add(G, Object.assign(B, { t: 'sandstorm', S, el: 'earth', x: m.x, y: m.y, r: S.r * Z, life: S.life * L, n, rot: G.rng() * TAU, grow: 0, hits: new Map(), rocks: [] }));
      for (let k = 0; k < n; k++) s.rocks.push({ a: k / n * TAU, h: 30 + (k % 3) * 14, sz: 10 + ((k * 7) % 5), x: m.x, y: m.y, alive: 1 });
      // estallido de arena: empuja y ciega a los cercanos
      for (const u of G.units) if (foe(B, u) && !u.obj && hypot(u.x - m.x, u.y - m.y) < s.r * 0.95 + u.r) hit(G, B, u, S.burstDmg * P, { el: 'earth', knock: S.burst, kx: u.x - m.x, ky: u.y - m.y, dazzle: 0.45, big: true });
      G.fx.push({ type: 'sandBurst', x: m.x, y: m.y, r: s.r }); G.events.push({ type: 'quake', x: m.x, y: m.y, soft: 1 });
      return;
    }
    if (S.kind === 'tesla') {
      const a = m.aim(G, S.range, 0), dx = Math.cos(a.ang), dy = Math.sin(a.ang);
      const D = clamp(a.target && !a.target.spot && a.dist < S.range * 1.15 ? a.dist + 90 : S.range * 0.8, 170, S.range * Z);
      // torre cercana y torre lejana (pasando por encima del rival); si cae en roca o agua honda, se busca la casilla buena más cercana sobre la línea
      const place = (d0, dmin) => {
        for (let d = d0; d >= dmin; d -= 20) {
          const px = m.x + dx * d, py = m.y + dy * d, i = Terrain.idx(T, px, py); if (okCell(T, i) && !busy(G, i)) return i;
          // si la línea cae en agua honda o roca, la casilla buena más cercana al lado
          let best = -1, bd = 1e9; for (const [oc, orr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) { const j = Terrain.idx(T, px + oc * CELL, py + orr * CELL); if (okCell(T, j) && !busy(G, j)) { const e = hypot(Terrain.cx(T, j) - px, Terrain.cy(T, j) - py); if (e < bd) { bd = e; best = j; } } }
          if (best >= 0) return best;
        }
        return -1; };
      const iA = place(66, 40), iB = place(D, 150);
      if (iA < 0 || iB < 0 || iA === iB) { G.fx.push({ type: 'rubble', x: m.x + dx * 60, y: m.y + dy * 60, soft: 1 }); return; }
      const hp = S.hp * P * (m.tr.wallMul || 1), life = S.life * L;
      for (const i of [iA, iB]) { Terrain.addWall(G, i, hp, life + 0.5); T.crys[i] = 2; }
      add(G, Object.assign(B, { t: 'tesla', S, el: 'bolt', iA, iB, x0: Terrain.cx(T, iA), y0: Terrain.cy(T, iA), x1: Terrain.cx(T, iB), y1: Terrain.cy(T, iB), x: (Terrain.cx(T, iA) + Terrain.cx(T, iB)) / 2, y: (Terrain.cy(T, iA) + Terrain.cy(T, iB)) / 2, rise: 0.28, life, next: 0.5, wetT: 0, hits: new Map(), stunAt: new Map(), dmg: S.dmg * P, zap: S.zap * P }));
      for (const i of [iA, iB]) G.fx.push({ type: 'pylonRise', x: Terrain.cx(T, i), y: Terrain.cy(T, i) });
      G.events.push({ type: 'quake', x: Terrain.cx(T, iB), y: Terrain.cy(T, iB), soft: 1 });
      return;
    }
    if (S.kind === 'crystal') {
      const p = pickTarget(G, m, S.range);
      add(G, Object.assign(B, { t: 'crystal', S, el: 'light', x: p.x, y: p.y, tg: p.tg, lock: S.lock * (B.gran ? 0.8 : 1), phase: 0, life: S.life * L, cells: [], hp: S.hp * P, dps: S.dps * P, burst: S.burst * P }));
      return;
    }
    if (S.kind === 'maw') {
      const p = pickTarget(G, m, S.range);
      add(G, Object.assign(B, { t: 'maw', S, el: 'shadow', x: p.x, y: p.y, tg: p.tg, chase: S.chase, phase: 0, r: S.r * Z, life: S.life * L, cells: [], hitSet: new Set(), bite: S.bite * P, grip: 0 }));
      return;
    }
    if (S.kind === 'mudslide') {
      const a = m.aim(G, S.range, 0);
      add(G, Object.assign(B, { t: 'mudslide', S, el: 'earth', x: m.x, y: m.y, ang: a.ang, d: 26, range: S.range * Z, half: S.half, hitSet: new Set(), dmg: S.dmg * P }));
      G.events.push({ type: 'quake', x: m.x + Math.cos(a.ang) * 60, y: m.y + Math.sin(a.ang) * 60, soft: 1 });
      return;
    }
  }

  /* ---------- paso de tiempo ---------- */
  function step(G, s, dt) {
    const T = G.T;
    switch (s.t) {
      case 'sandstorm': {
        const m = G.mages[s.by];
        if (m && m.alive) { s.x = m.x; s.y = m.y; m.st.hidden = Math.max(m.st.hidden, 0.2); if (m.tr.sandHeal) { m.heal(G, m.tr.sandHeal * dt); m._healT = 0.3; } }
        s.grow = Math.min(1, s.grow + dt * 3.2); s.rot += dt * (2.5 + (1 - s.grow) * 3);
        const R0 = s.r * 0.6 * (0.4 + 0.6 * s.grow);
        // piedras que giran: golpean a los rivales y deshacen sus proyectiles
        s.rocks.forEach((k, j) => {
          const a = s.rot + k.a; k.x = s.x + Math.cos(a) * R0; k.y = s.y + Math.sin(a) * R0;
          for (const u of G.units) {
            if (!foe(s, u) || u.obj === 'turret') continue; if (hypot(u.x - k.x, u.y - k.y) > 22 + u.r) continue;
            const key = j * 997 + (u.idx >= 0 ? u.idx : (u._nid || 0) + 10), last = s.hits.get(key) || -9; if (G.time - last < 0.5) continue; s.hits.set(key, G.time);
            hit(G, s, u, s.S.rockDmg * s.power, { el: 'earth', knock: 230, kx: -Math.sin(a), ky: Math.cos(a), stun: 0.1 });
            G.fx.push({ type: 'chips', x: k.x, y: k.y - 20 });
          }
        });
        for (const u of G.units) if (foe(s, u) && !u.obj && hypot(u.x - s.x, u.y - s.y) < s.r) { u.st.blind = Math.max(u.st.blind, 0.3); u.slow(0.25, 0.78); hit(G, s, u, s.S.dps * s.power * dt, { el: 'earth', tick: true }); u.lastSpell = null; }
        for (const p of G.spells) {
          if (p.t !== 'proj' || p.dead || p.team === s.team || p.ground) continue;
          const d = hypot(p.x - s.x, p.y - s.y); if (d > s.r) continue;
          if (s.rocks.some(k => hypot(p.x - k.x, p.y - k.y) < 24 + p.r)) { Spells.endProj(G, p, true); G.fx.push({ type: 'chips', x: p.x, y: p.y }); continue; }
          if (!p.heavy) { p.vx *= 1 - 1.8 * dt; p.vy *= 1 - 1.8 * dt; const ag = (G.rng() - 0.3) * 4.5 * dt, c = Math.cos(ag), sn = Math.sin(ag), vx = p.vx * c - p.vy * sn; p.vy = p.vx * sn + p.vy * c; p.vx = vx; }
        }
        s.life -= dt; if (s.life <= 0) { s.dead = true; G.fx.push({ type: 'sandEnd', x: s.x, y: s.y, r: s.r }); }
        break;
      }
      case 'tesla': {
        if (T.wall[s.iA] <= 0 || T.wall[s.iB] <= 0) { s.dead = true; end(G, s); G.events.push({ type: 'wallBreak', x: s.x, y: s.y }); break; }
        if (s.rise > 0) { s.rise -= dt; if (s.rise <= 0) G.events.push({ type: 'teslaOn', x: s.x, y: s.y }); break; }
        const ax = s.x0, ay = s.y0 - 46, bx = s.x1, by2 = s.y1 - 46;
        for (const u of G.units) {
          if (!foe(s, u) || u.obj === 'turret' || u.untargetable && !u.isMage) continue;
          if (segDist(u.x, u.y - 20, ax, ay + 20, bx, by2 + 20) > u.r + 12) continue;
          const key = u.idx >= 0 ? u.idx : (u._nid || 0) + 10, last = s.hits.get(key) || -9; if (G.time - last < 1.0) continue; s.hits.set(key, G.time);
          // el rayo lo escupe hacia el lado en que venía (no se queda pegado) y solo aturde una vez cada 2,5 s
          const nx = -(by2 - ay), ny = bx - ax, nl = hypot(nx, ny) || 1, side = ((u.x - ax) * nx + (u.y - 20 - ay) * ny) >= 0 ? 1 : -1, stunOk = G.time - (s.stunAt.get(key) || -9) > 2.5;
          if (stunOk) s.stunAt.set(key, G.time);
          if (hit(G, s, u, s.dmg, { el: 'bolt', stun: stunOk ? s.S.stun : 0, knock: 300, kx: nx / nl * side, ky: ny / nl * side, big: true }) > 0) { const k = clamp(((u.x - ax) * (bx - ax) + (u.y - ay) * (by2 - ay)) / (hypot(bx - ax, by2 - ay) ** 2 || 1), 0, 1); G.fx.push({ type: 'zap', x0: lerp(ax, bx, k), y0: lerp(ay, by2, k), x1: u.x, y1: u.y - 16, el: 'bolt' }); G.events.push({ type: 'tzap', x: u.x, y: u.y }); }
        }
        // las torres le disparan al que se acerque
        s.next -= dt;
        if (s.next <= 0) {
          s.next = s.S.every; let any = false;
          for (const [tx, ty] of [[s.x0, s.y0], [s.x1, s.y1]]) {
            let best = null, bd = s.S.zapR; for (const u of G.units) if (foe(s, u) && !u.obj && u.st.hidden <= 0) { const d = hypot(u.x - tx, u.y - ty); if (d < bd) { bd = d; best = u; } }
            if (best) { any = true; hit(G, s, best, s.zap, { el: 'bolt' }); G.fx.push({ type: 'zap', x0: tx, y0: ty - 62, x1: best.x, y1: best.y - 14, el: 'bolt' }); }
          }
          if (any) G.events.push({ type: 'tzap', x: s.x, y: s.y }); else s.next = 0.2;
        }
        // el rayo corre por el agua y los charcos que toca
        s.wetT -= dt;
        if (s.wetT <= 0) { s.wetT = 1.2; let done = 0; Terrain.forLine(T, s.x0, s.y0, s.x1, s.y1, i => { if (done < 2 && (Terrain.isWater(T, i) || T.wet[i] > 0) && T.elec[i] < 0.2) { Terrain.electrify(G, i, s.by, 0.6, 40); done++; } }); } // pulsos: medio tiempo con corriente
        s.life -= dt; if (s.life <= 0) { s.dead = true; end(G, s); }
        break;
      }
      case 'crystal': {
        if (s.phase === 0) {
          const tg = s.tg; if (tg && tg.alive && tg.st.hidden <= 0) { const dx = tg.x - s.x, dy = tg.y - s.y, d = hypot(dx, dy), v = 560 * dt; if (d <= v) { s.x = tg.x; s.y = tg.y; } else { s.x += dx / d * v; s.y += dy / d * v; } }
          s.lock -= dt; if (s.lock <= 0) build(G, s); break;
        }
        // adentro: la luz rebota en los cristales y quema
        const left = s.cells.filter(i => T.wall[i] > 0).length;
        for (const u of G.units) if (foe(s, u) && !u.obj && hypot(u.x - s.x, u.y - s.y) < 64) { hit(G, s, u, s.dps * dt, { el: 'light', tick: true }); u.lastSpell = null; if (u.isMage) u.st.blind = Math.max(u.st.blind, 0.15); }
        s.life -= dt;
        if (s.life <= 0 || left < Math.max(3, s.cells.length * 0.4)) { s.dead = true; implode(G, s); }
        break;
      }
      case 'maw': {
        if (s.phase === 0) {
          const tg = s.tg; if (tg && tg.alive && tg.st.hidden <= 0) { const dx = tg.x - s.x, dy = tg.y - s.y, d = hypot(dx, dy), v = s.S.speed * dt; if (d <= v) { s.x = tg.x; s.y = tg.y; } else { s.x += dx / d * v; s.y += dy / d * v; } }
          // manos de sombra: frenan a quien pise la mancha (esquivar las suelta)
          s.grip = 0;
          for (const u of G.units) if (foe(s, u) && !u.obj && hypot(u.x - s.x, u.y - s.y) < s.r * 0.85 + u.r * 0.5 && !dashing(u)) { u.slow(0.12, s.S.slow); s.grip = 1; }
          s.chase -= dt; if (s.chase <= 0) openMaw(G, s); break;
        }
        for (const u of G.units) { if (!foe(s, u) || u.isMage || u.obj || s.hitSet.has(u)) continue; const i = Terrain.idx(T, u.x, u.y); if (i >= 0 && T.pit[i] > 0) { s.hitSet.add(u); hit(G, s, u, u.boss ? 14 : 22, { el: 'shadow', stun: 0.9, big: true }); } }
        s.life -= dt; if (s.life <= 0) s.dead = true; break;
      }
      case 'mudslide': {
        s.d += s.S.speed * dt; const d0 = s.d - 44, d1 = s.d + 12;
        for (const u of G.units) {
          if (!foe(s, u) || s.hitSet.has(u)) continue; const dx = u.x - s.x, dy = u.y - s.y, d = hypot(dx, dy) || 1;
          if (d > d0 - u.r && d < d1 + u.r && Math.abs(angDiff(s.ang, Math.atan2(dy, dx))) < s.half + u.r / d) {
            s.hitSet.add(u); hit(G, s, u, s.dmg, { el: 'earth', knock: s.S.knock, kx: Math.cos(s.ang) * 0.85 + dx / d * 0.35, ky: Math.sin(s.ang) * 0.85 + dy / d * 0.35, wet: s.S.wet, stun: s.S.stun, big: true });
            u.slow(1.4, s.S.slow);
          }
        }
        for (const p of G.spells) { if (p.t !== 'proj' || p.dead || p.team === s.team || p.ground) continue; const dx = p.x - s.x, dy = p.y - s.y, d = hypot(dx, dy); if (d > d0 && d < d1 + 10 && Math.abs(angDiff(s.ang, Math.atan2(dy, dx))) < s.half) { Spells.endProj(G, p, true); G.fx.push({ type: 'splat', x: p.x, y: p.y, r: 22 }); } }
        if (G.frame % 2 === 0) for (let a = -s.half; a <= s.half + 1e-6; a += 0.14) { const i = Terrain.idx(T, s.x + Math.cos(s.ang + a) * s.d, s.y + Math.sin(s.ang + a) * s.d); if (i >= 0) { const b = T.base[i]; if (b !== TT.ROCK && b !== TT.CHASM && b !== TT.DEEP && !Terrain.isLava(T, i) && T.wall[i] <= 0) { T.mud[i] = Math.max(T.mud[i], s.S.life * (s.gran ? 1.3 : 1)); T.fire[i] = 0; T.ice[i] = 0; } if (T.lava[i] > 0) { T.lava[i] = 0; T.ver++; } } }
        // un muro en el camino lo frena (y se lo lleva por delante si es de los de tierra)
        if (Terrain.solidAt(T, s.x + Math.cos(s.ang) * (s.d + 10), s.y + Math.sin(s.ang) * (s.d + 10))) { const i = Terrain.idx(T, s.x + Math.cos(s.ang) * (s.d + 10), s.y + Math.sin(s.ang) * (s.d + 10)); if (i >= 0 && T.wall[i] > 0) Terrain.hitWall(G, i, 30); }
        if (s.d > s.range) { s.dead = true; G.fx.push({ type: 'splat', x: s.x + Math.cos(s.ang) * s.d, y: s.y + Math.sin(s.ang) * s.d, r: 60 }); }
        break;
      }
    }
  }
  function end(G, s) { const T = G.T; for (const i of [s.iA, s.iB]) if (T.wall[i] > 0) { T.wall[i] = 0; T.wallT[i] = 0; T.crys[i] = 0; T.ver++; G.fx.push({ type: 'rubble', x: Terrain.cx(T, i), y: Terrain.cy(T, i) }); } G.fx.push({ type: 'sparkBurst', x: s.x0, y: s.y0 - 50 }); G.fx.push({ type: 'sparkBurst', x: s.x1, y: s.y1 - 50 }); }
  // la jaula brota alrededor de donde está el rival AHORA
  function build(G, s) {
    const T = G.T, c0 = Math.floor(s.x / CELL), r0 = Math.floor(s.y / CELL); s.phase = 1;
    // centro de la casilla del rival: así el anillo de 5×5 queda parejo a su alrededor
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
      if (Math.round(hypot(dc, dr)) !== 2) continue; const c = c0 + dc, r = r0 + dr; if (c < 0 || r < 0 || c >= T.cols || r >= T.rows) continue;
      const i = r * T.cols + c; if (!okCell(T, i) || busy(G, i)) continue;
      if (Terrain.addWall(G, i, s.hp, s.life + 0.3)) { T.crys[i] = 1; s.cells.push(i); G.fx.push({ type: 'crystalRise', x: Terrain.cx(T, i), y: Terrain.cy(T, i), d: hypot(dc, dr) * 0.02 }); }
    }
    s.x = (c0 + 0.5) * CELL; s.y = (r0 + 0.5) * CELL;
    G.fx.push({ type: 'flashRing', x: s.x, y: s.y, el: 'light', r: 120 }); G.events.push({ type: 'wall', x: s.x, y: s.y, n: s.cells.length }); G.events.push({ type: 'cageShut', x: s.x, y: s.y });
    for (const u of G.units) if (foe(s, u) && !u.obj && hypot(u.x - s.x, u.y - s.y) < 64) { hit(G, s, u, 6 * s.power, { el: 'light', dazzle: 0.5 }); Combos.add(G, s.by, 'atrapado', u); }
  }
  function implode(G, s) {
    const T = G.T;
    for (const u of G.units) if (foe(s, u) && !u.obj && hypot(u.x - s.x, u.y - s.y) < 72) hit(G, s, u, s.burst, { el: 'light', dazzle: 0.6, big: true });
    for (const i of s.cells) if (T.wall[i] > 0) { T.wall[i] = 0; T.wallT[i] = 0; T.crys[i] = 0; T.ver++; }
    G.fx.push({ type: 'crystalBurst', x: s.x, y: s.y, r: 90 }); G.events.push({ type: 'cageBurst', x: s.x, y: s.y });
  }
  function openMaw(G, s) {
    const T = G.T; s.phase = 1;
    Terrain.forCircle(T, s.x, s.y, s.r, i => { const b = T.base[i]; if (!Terrain.solid(T, i) && b !== TT.DEEP && b !== TT.CHASM && b !== TT.LAVA && T.wall[i] <= 0) { s.cells.push(i); T.pit[i] = s.life; T.pitO[i] = s.by; T.fire[i] = 0; T.vine[i] = 0; T.mud[i] = 0; } });
    T.ver++;
    for (const u of G.units) if (foe(s, u) && u.isMage && hypot(u.x - s.x, u.y - s.y) < s.r + u.r * 0.4 && !dashing(u)) { if (hit(G, s, u, s.bite, { el: 'shadow', hex: 1.5, big: true }) > 0) Combos.add(G, s.by, 'enterrado', u); }
    G.events.push({ type: 'quake', x: s.x, y: s.y }); G.events.push({ type: 'mawOpen', x: s.x, y: s.y }); G.fx.push({ type: 'mawBite', x: s.x, y: s.y, r: s.r });
  }

  /* ---------- lo que cae: fragmentos del Magma ---------- */
  const FRAG = { r: 40, dmg: 7, pool: { r: 30, life: 3 }, flight: 0.34 };
  function frags(G, s) {
    const n = s.gran ? 4 : 3;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU + G.rng() * 0.8, d = 85 + G.rng() * 55, tx = clamp(s.tx + Math.cos(a) * d, 30, G.T.W - 30), ty = clamp(s.ty + Math.sin(a) * d, 30, G.T.H - 30);
      add(G, { by: s.by, team: s.team, el: 'fire', power: s.power, size: s.size, gran: s.gran, fusion: s.fusion, t: 'lob', S: FRAG, kind: 'frag', x0: s.tx, y0: s.ty - 20, x: s.tx, y: s.ty, z: 0, tx, ty, T: FRAG.flight + k * 0.05, tt: 0 });
    }
  }
  function land(G, s) {
    if (s.kind !== 'frag') return;
    const T = G.T, S = s.S;
    Spells.boom(G, s, s.tx, s.ty, S.r * s.size, S.dmg * s.power, 'fire', { burn: 1.6, knock: 200 });
    Terrain.forCircle(T, s.tx, s.ty, S.pool.r * s.size, i => { const b = T.base[i]; if (b !== TT.ROCK && b !== TT.CHASM && !(b === TT.DEEP && T.ice[i] <= 0) && T.wall[i] <= 0) { T.lava[i] = Math.max(T.lava[i], S.pool.life); T.wet[i] = 0; T.ice[i] = 0; T.ver++; } });
  }
  return { cast, step, land, frags, pickTarget };
})();
