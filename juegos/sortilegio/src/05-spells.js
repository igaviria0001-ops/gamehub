/* =========================================================================
   HECHIZOS — todo lo que sale de las manos vive en G.spells mientras dura:
   proyectiles, frentes de agua, remolinos, nubes, minas, torretas, rayos con
   aviso... Spells.cast los crea; Spells.update los mueve, los hace chocar
   entre sí y con el terreno, y aplica los golpes (Spells.hit).
   ========================================================================= */
const COMBO_NAMES = {
  electrocutado: '¡Electrocutado!', congelado: '¡Congelado!', rompehielo: '¡Rompehielo!', rebote: '¡Rebote!', incendio: '¡Incendio!',
  atrapado: '¡Atrapado!', porunpelo: '¡Por un pelo!', vapor: '¡Vaporazo!', alagua: '¡Al agua!', alvacio: '¡Al vacío!', sinescape: '¡Sin escape!',
  doblegolpe: '¡Doble golpe!', torbellino: '¡Torbellino!', alalava: '¡A la lava!', choque: '¡Choque!', enterrado: '¡Enterrado!', contraconjuro: '¡CONTRACONJURO!', embestida: '¡Embestida!',
};
const Combos = {
  add(G, by, key, at) {
    const m = by >= 0 ? G.mages[by] : null; if (!m) return;
    const now = G.time, last = m.combo['_t' + key] || -9; if (now - last < (key === 'doblegolpe' || key === 'torbellino' ? 1.5 : 0.6)) return;
    m.combo['_t' + key] = now; const n = m.combo[key] || 0; m.combo[key] = n + 1;
    m.gainEmb(G, 15 * Math.pow(0.6, n)); m.stats.combos++;
    G.events.push({ type: 'combo', who: by, key, name: COMBO_NAMES[key] || key, x: at ? at.x : m.x, y: at ? at.y : m.y, n });
  },
};
const Spells = (() => {
  const foe = (s, u) => u.alive && (s.team < 0 || u.team !== s.team) && !(u.idx === s.by && s.team < 0 && s.noSelf);
  const segDist = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1; const t = clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1); return hypot(px - (ax + dx * t), py - (ay + dy * t)); };
  // golpe a una unidad con los efectos del elemento
  function hit(G, s, u, dmg, o = {}) {
    if (!u.alive) return 0;
    const by = s.by, el = o.el || s.el0 || s.el;
    if (o.tick) o.noGraze = true;
    if (u.iframes > 0 && !o.unavoid && !o.tick) {
      if (u.isMage && !o.noGraze) { const m = u; if (!m._grazeT || G.time - m._grazeT > 0.5) { m._grazeT = G.time; m.dash.cd = Math.min(m.dash.cd, 0.25); m.stats.grazes++; Combos.add(G, m.idx, 'porunpelo', m); } }
      return 0;
    }
    let d = dmg;
    const bm = by >= 0 ? G.mages[by] : null; if (bm && !o.tick && bm.racha > 0 && G.time - bm.rachaT < 2.4) d *= 1 + 0.06 * Math.min(5, bm.racha);
    const wasHeld = u.st.root > 0 || u.st.stun > 0 || u.st.frozen > 0;
    if (el === 'bolt' && by >= 0 && G.mages[by] && G.mages[by].tr.boltMul) d *= G.mages[by].tr.boltMul;
    if (el === 'bolt' && u.st.wet > 0) { d *= o.noWet ? 1.25 : 1.6; Combos.add(G, by, 'electrocutado', u); }
    if (!o.tick && u.lastSpell && u.lastSpell.by === by && u.lastSpell.id !== s.id && G.time - u.lastSpell.t < 0.35 && by >= 0) Combos.add(G, by, 'doblegolpe', u);
    if (!o.tick) u.lastSpell = { by, id: s.id, t: G.time };
    const dealt = u.hurt(G, d, { by, el, dot: !!o.tick, fk: s.fusion || null });
    if (!u.alive) return dealt;
    if (o.dazzle) { if (u.isMage) { if (!(u.imm && u.imm.blind > 0)) u.st.blind = Math.max(u.st.blind, o.dazzle * (bm && bm.tr.dazzleMul || 1)); } else u.slow(o.dazzle * 2.5, 0.55); G.fx.push({ type: 'dazzle', x: u.x, y: u.y - 30 }); }
    if (o.hex) { u.st.hex = Math.max(u.st.hex, o.hex * (bm && bm.tr.hexMul || 1)); }
    if (o.silence && !(u.imm && u.imm.silence > 0)) u.st.silence = Math.max(u.st.silence, o.silence);
    if (bm && bm.alive && !o.tick && dealt > 0) { if (el === 'light' && bm.tr.lightHeal) { bm.heal(G, bm.tr.lightHeal); bm._healT = 0.3; } if (el === 'shadow' && bm.tr.shadowLeech) { bm.heal(G, dealt * bm.tr.shadowLeech); bm._healT = 0.3; } }
    if (o.burn) u.burn(G, o.burn, by);
    if (o.wet) u.soak(G, o.wet);
    if (o.stun) u.stun(o.stun);
    if (o.root) { u.root(o.root); G.events.push({ type: 'rooted', x: u.x, y: u.y }); }
    if (o.chill) { if (u.st.wet > 0 && o.freeze) u.freeze(G, o.freeze * (bm && bm.tr.freezeMul || 1), by); else u.st.chill = Math.max(u.st.chill, o.chill); }
    if (o.knock) {
      const kx = o.kx != null ? o.kx : u.x - s.x, ky = o.ky != null ? o.ky : u.y - s.y; u.knock(kx, ky, o.knock);
      if (u.isMage) u.knockBy = { by, t: G.time };
    }
    if (wasHeld && o.big && by >= 0) Combos.add(G, by, 'atrapado', u);
    if (s.reflected && by >= 0) Combos.add(G, by, 'rebote', u);
    return dealt;
  }
  let nextId = 1;
  function add(G, s) { s.id = nextId++; s.age = 0; G.spells.push(s); return s; }
  function base(m, el, o) { return { by: m.idx, team: m.team, el, power: o.power || 1, size: o.size || 1, gran: !!o.gran, fusion: o.fusion || null }; }
  function aimPoint(G, m, range, lead = 0) {
    const a = m.aim(G, range, 0); let tx, ty;
    if (a.target && a.dist <= range * 1.15) { tx = a.target.x + a.target.vx * lead; ty = a.target.y + a.target.vy * lead; }
    else { tx = m.x + Math.cos(a.ang) * range * 0.85; ty = m.y + Math.sin(a.ang) * range * 0.85; }
    const d = hypot(tx - m.x, ty - m.y); if (d > range) { tx = m.x + (tx - m.x) / d * range; ty = m.y + (ty - m.y) / d * range; }
    return { tx: clamp(tx, 30, G.T.W - 30), ty: clamp(ty, 30, G.T.H - 30), ang: a.ang };
  }
  /* ---------- lanzar ---------- */
  function cast(G, m, S, el, o) {
    const B = base(m, el, o), P = B.power, Z = B.size, k = S.kind, hx = m.x + Math.cos(m.face) * 22, hy = m.y - 20 + Math.sin(m.face) * 12;
    const mainEl = o.fusion ? o.fusion.split('+')[0] : el;
    G.events.push({ type: 'cast', who: m.idx, el, kind: k, fusion: o.fusion || null, gran: B.gran, level: o.level || 0, x: m.x, y: m.y });
    if (o.fusion) { const rd = Math.min(S.range || S.len || 220, 240) * 0.6; G.events.push({ type: 'fusionCast', key: o.fusion, who: m.idx, x: m.x + Math.cos(m.face) * rd, y: m.y + Math.sin(m.face) * rd, x0: m.x, y0: m.y, res: !!o.res }); }
    if (k === 'proj') {
      const a = m.aim(G, S.speed * S.life, S.speed);
      const elx = o.fusion ? (o.fusion === 'wind+bolt' ? 'bolt' : mainEl) : el;
      add(G, Object.assign(B, { t: 'proj', S, el: elx, x: m.x + Math.cos(a.ang) * 20, y: m.y + Math.sin(a.ang) * 20, vx: Math.cos(a.ang) * S.speed, vy: Math.sin(a.ang) * S.speed, r: S.r * Z, life: S.life * (B.gran ? 1.3 : 1), dmg: S.dmg * P, pierce: S.pierce || 0, bounce: S.bounce || 0, heavy: !!S.heavy, gust: !!S.gust, fusion: o.fusion, big: o.level === 2 || !!o.fusion }));
    } else if (k === 'cone' || k === 'frost') {
      const a = m.aim(G, S.range, 0), R = S.range * Z;
      G.fx.push({ type: 'cone', x: m.x, y: m.y - 14, ang: a.ang, range: R, half: S.half, el: k === 'frost' ? 'frost' : 'wind', big: !!o.fusion });
      for (const u of G.units) {
        if (!foe(B, u)) continue; const dx = u.x - m.x, dy = u.y - m.y, d = hypot(dx, dy);
        if (d > R + u.r || Math.abs(angDiff(a.ang, Math.atan2(dy, dx))) > S.half + u.r / Math.max(d, 1)) continue;
        if (k === 'cone') hit(G, B, u, S.dmg * P, { el: 'wind', knock: S.knock * (0.7 + 0.3 * (1 - d / R)), kx: Math.cos(a.ang) + dx / (d || 1), ky: Math.sin(a.ang) + dy / (d || 1) });
        else hit(G, B, u, S.dmg * P, { el: 'water', chill: S.chill, freeze: S.freeze * (B.gran ? 1.4 : 1), big: true });
      }
      if (k === 'cone') {
        for (const s of G.spells) {
          if (s.t !== 'proj' || s.team === m.team || s.ground) continue;
          const dx = s.x - m.x, dy = s.y - m.y, d = hypot(dx, dy);
          if (d > R + 30 || Math.abs(angDiff(a.ang, Math.atan2(dy, dx))) > S.half + 0.25) continue;
          const sp = hypot(s.vx, s.vy) * 1.12, tgt = m.aim(G, 900, sp), ang = tgt.target ? tgt.ang : a.ang;
          s.vx = Math.cos(ang) * sp; s.vy = Math.sin(ang) * sp; s.team = m.team; s.by = m.idx; s.reflected = true; s.life = Math.max(s.life, 0.9); s.age = 0;
          G.events.push({ type: 'reflect', x: s.x, y: s.y, who: m.idx });
        }
        for (const s of G.spells) if (s.t === 'cloud' || s.t === 'storm') { const dx = s.x - m.x, dy = s.y - m.y, d = hypot(dx, dy); if (d < R + s.r * 0.5 && Math.abs(angDiff(a.ang, Math.atan2(dy, dx))) < S.half + 0.4) { s.vx = (s.vx || 0) + Math.cos(a.ang) * 160; s.vy = (s.vy || 0) + Math.sin(a.ang) * 160; } }
      } else {
        Terrain.forCircle(G.T, m.x + Math.cos(a.ang) * R * 0.55, m.y + Math.sin(a.ang) * R * 0.55, R * 0.55, (i, px, py) => {
          if (Math.abs(angDiff(a.ang, Math.atan2(py - m.y, px - m.x))) <= S.half + 0.15 && hypot(px - m.x, py - m.y) < R) Terrain.freeze(G, i, 9);
        });
      }
    } else if (k === 'wave') {
      const a = m.aim(G, S.range, 0);
      add(G, Object.assign(B, { t: 'wave', S, x: m.x, y: m.y, ang: a.ang, d: 20, range: S.range * Z, half: S.half, hitSet: new Set() }));
    } else if (k === 'vortex') {
      const a = m.aim(G, 500, S.speed);
      add(G, Object.assign(B, { t: 'vortex', S, x: m.x + Math.cos(a.ang) * 40, y: m.y + Math.sin(a.ang) * 40, vx: Math.cos(a.ang) * S.speed, vy: Math.sin(a.ang) * S.speed, r: S.r * Z, life: S.life * (B.gran ? 1.3 : 1), dps: S.dps * P, pull: S.pull }));
    } else if (k === 'firenado') {
      const a = m.aim(G, 600, S.speed);
      add(G, Object.assign(B, { t: 'firenado', S, el: 'fire', x: m.x + Math.cos(a.ang) * 50, y: m.y + Math.sin(a.ang) * 50, vx: Math.cos(a.ang) * S.speed, vy: Math.sin(a.ang) * S.speed, r: S.r * Z, life: S.life * (B.gran ? 1.3 : 1), dps: S.dps * P, turn: S.turn, pull: S.pull }));
    } else if (k === 'wall') {
      const a = m.aim(G, 300, 0), cxp = m.x + Math.cos(a.ang) * 92, cyp = m.y + Math.sin(a.ang) * 92, px = -Math.sin(a.ang), py = Math.cos(a.ang), n = Math.round(S.len * (o.double ? 1.5 : 1) * (B.gran ? 1.3 : 1));
      let made = 0; const seen = new Set();
      for (let j = 0; j < n * 2; j++) {
        const off = (j / 2 - (n - 1) / 2) * CELL, i = Terrain.idx(G.T, cxp + px * off, cyp + py * off);
        if (i < 0 || seen.has(i)) continue; seen.add(i);
        const ccx = Terrain.cx(G.T, i), ccy = Terrain.cy(G.T, i);
        if (G.units.some(u => u.alive && Math.abs(u.x - ccx) < CELL / 2 + u.r && Math.abs(u.y - ccy) < CELL / 2 + u.r)) continue;
        if (Terrain.addWall(G, i, S.hp * P * (m.tr.wallMul || 1), S.life)) { made++; G.fx.push({ type: 'rise', x: ccx, y: ccy }); }
      }
      G.events.push({ type: 'wall', x: cxp, y: cyp, n: made });
    } else if (k === 'lob' || k === 'meteor' || k === 'mud') {
      const p = aimPoint(G, m, S.range, S.flight * 0.6);
      add(G, Object.assign(B, { t: 'lob', S, kind: k, el: k === 'meteor' ? 'fire' : k === 'mud' ? 'earth' : 'plant', x0: m.x, y0: m.y - 20, x: m.x, y: m.y, z: 0, tx: p.tx, ty: p.ty, T: S.flight, tt: 0 }));
    } else if (k === 'vine') {
      const a = m.aim(G, S.range, 0), x1 = m.x + Math.cos(a.ang) * S.range * Z, y1 = m.y + Math.sin(a.ang) * S.range * Z, x0 = m.x + Math.cos(a.ang) * 36, y0 = m.y + Math.sin(a.ang) * 36;
      let cut = false;
      Terrain.forLine(G.T, x0, y0, x1, y1, (i, f) => {
        const b = G.T.base[i]; if (Terrain.solid(G.T, i) || b === TT.CHASM) { cut = true; return false; }
        if (b === TT.DEEP && G.T.ice[i] <= 0) return;
        G.T.vine[i] = S.life * (B.gran ? 1.3 : 1); G.T.vineO[i] = m.idx; G.T.fire[i] = 0; G.fx.push({ type: 'sprout', x: Terrain.cx(G.T, i), y: Terrain.cy(G.T, i), delay: f * 0.35 });
      });
      for (const u of G.units) if (foe(B, u) && segDist(u.x, u.y, x0, y0, x1, y1) < u.r + 22) hit(G, B, u, 6 * P, { el: 'plant', root: 0.45 });
    } else if (k === 'zap') {
      const a = m.aim(G, S.range, 0); let x1, y1, tg = null;
      if (a.target && a.dist <= S.range + a.target.r) { tg = a.target; x1 = tg.x; y1 = tg.y - 14; }
      else { x1 = m.x + Math.cos(a.ang) * S.range; y1 = m.y + Math.sin(a.ang) * S.range; Terrain.forLine(G.T, m.x, m.y, x1, y1, (i, f) => { if (Terrain.solid(G.T, i)) { x1 = lerp(m.x, x1, f); y1 = lerp(m.y, y1, f); return false; } }); }
      G.fx.push({ type: 'zap', x0: hx, y0: hy, x1, y1, el: 'bolt' }); G.events.push({ type: 'zapLine', x0: m.x, y0: m.y, x1, y1: y1 + 14, by: m.idx });
      if (tg) {
        hit(G, B, tg, S.dmg * P, { el: 'bolt' });
        const near = G.units.filter(u => u !== tg && foe(B, u) && hypot(u.x - tg.x, u.y - tg.y) < S.chain && (u.st.wet > 0 || tg.st.wet > 0));
        if (near[0]) { hit(G, B, near[0], S.dmg * 0.6 * P, { el: 'bolt' }); G.fx.push({ type: 'zap', x0: tg.x, y0: tg.y - 14, x1: near[0].x, y1: near[0].y - 14, el: 'bolt' }); }
      } else { const i = Terrain.idx(G.T, x1, y1 + 14); if (i >= 0 && (Terrain.isWater(G.T, i) || G.T.wet[i] > 0)) Terrain.electrify(G, i, m.idx); }
    } else if (k === 'strike') {
      const p = aimPoint(G, m, S.range, S.delay * 0.75);
      add(G, Object.assign(B, { t: 'strike', S, x: p.tx, y: p.ty, delay: S.delay, r: S.r * Z, dmg: S.dmg * P, stun: S.stun }));
    } else if (k === 'cloud') {
      const p = aimPoint(G, m, S.range, 0);
      add(G, Object.assign(B, { t: 'cloud', S, el: 'water', x: p.tx, y: p.ty, vx: 0, vy: 0, r: S.r * Z, life: S.life * (B.gran ? 1.3 : 1), dps: S.dps * P }));
    } else if (k === 'mines') {
      const a = m.aim(G, 300, 0);
      for (let j = 0; j < S.n + (B.gran ? 2 : 0); j++) {
        const off = (j - (S.n + (B.gran ? 2 : 0) - 1) / 2) * 0.42, d = 125 - Math.abs(off) * 40;
        let x = m.x + Math.cos(a.ang + off) * d, y = m.y + Math.sin(a.ang + off) * d;
        if (Terrain.solidAt(G.T, x, y)) { x = m.x + Math.cos(a.ang + off) * 50; y = m.y + Math.sin(a.ang + off) * 50; }
        add(G, Object.assign({}, B, { t: 'mine', S, el: 'fire', x, y, arm: S.arm + j * 0.08, life: S.life, r: S.r * Z, dmg: S.dmg * P }));
      }
    } else if (k === 'beam') {
      add(G, Object.assign(B, { t: 'beam', S, el: 'fire', x: m.x, y: m.y, windup: S.windup, fired: false, ang: m.face }));
      if (!m.tr.beamNoRoot) m.st.root = Math.max(m.st.root, S.windup);
    } else if (k === 'bloom') {
      add(G, Object.assign(B, { t: 'bloom', S, el: 'plant', x: m.x + Math.cos(m.face) * 16, y: m.y + Math.sin(m.face) * 16, r: S.r * Z, life: S.life * (B.gran ? 1.3 : 1), hps: S.hps * P * (m.tr.healMul || 1) }));
    } else if (k === 'storm') {
      const p = aimPoint(G, m, S.range, 0.5);
      add(G, Object.assign(B, { t: 'storm', S, el: 'water', x: p.tx, y: p.ty, vx: 0, vy: 0, r: S.r * Z, life: S.life * (B.gran ? 1.3 : 1), next: 0.35, dmg: S.dmg * P }));
    } else if (k === 'sand') {
      add(G, Object.assign(B, { t: 'sand', S, el: 'earth', x: m.x, y: m.y, r: S.r * Z, life: S.life * (B.gran ? 1.3 : 1), dps: S.dps * P }));
    } else if (k === 'petals') {
      const a = m.aim(G, 700, 0), n = S.n + (B.gran ? 4 : 0);
      for (let j = 0; j < n; j++) {
        const off = (j / (n - 1) - 0.5) * 1.7, sp = S.speed * (0.85 + 0.3 * ((j * 7) % 5) / 4);
        add(G, Object.assign({}, B, { t: 'proj', S, el: 'plant', petal: true, x: m.x + Math.cos(a.ang + off) * 18, y: m.y + Math.sin(a.ang + off) * 18, vx: Math.cos(a.ang + off) * sp, vy: Math.sin(a.ang + off) * sp, r: S.r, life: S.life + j * 0.03, dmg: S.dmg * P, turn: S.turn, delayHome: 0.12 + j * 0.02, fusion: o.fusion }));
      }
    } else if (k === 'roots') {
      const a = m.aim(G, S.range, S.speed);
      add(G, Object.assign(B, { t: 'proj', S, el: 'plant', ground: true, x: m.x + Math.cos(a.ang) * 20, y: m.y + Math.sin(a.ang) * 20, vx: Math.cos(a.ang) * S.speed, vy: Math.sin(a.ang) * S.speed, r: S.r * Z, life: S.range * Z / S.speed, dmg: S.dmg * P, root: S.root * (B.gran ? 1.3 : 1), fusion: o.fusion, big: true }));
    } else if (k === 'magnet') {
      const p = aimPoint(G, m, S.range, 0.3);
      const u = add(G, Object.assign(B, { t: 'magnet', S, el: 'bolt', x: p.tx, y: p.ty, life: S.life * (B.gran ? 1.3 : 1), pullR: S.pullR * Z, pull: S.pull, dps: S.dps * P }));
      G.fx.push({ type: 'rise', x: u.x, y: u.y, el: 'bolt' });
    } else if (k === 'turret') {
      const p = aimPoint(G, m, S.range, 0);
      const t = new Unit(p.tx, p.ty, 18, m.team); Object.assign(t, { obj: 'turret', untargetable: true, hp: S.hp * P, maxHp: S.hp * P, idx: -1, life: S.life * (B.gran ? 1.3 : 1), by: m.idx, next: 0.5, dmg: S.dmg * P, reach: S.reach, every: S.every, el: 'bolt', knockMul: 0 });
      G.units.push(t); G.fx.push({ type: 'rise', x: t.x, y: t.y, el: 'plant' });
    } else Spells2.cast(G, m, S, el, o, B);
  }
  /* ---------- final de un proyectil ---------- */
  function endProj(G, s, at) {
    s.dead = true; const T = G.T, i = Terrain.idx(T, s.x, s.y);
    if (s.S && s.S.boom) boom(G, s, s.x, s.y, s.S.boom.r * s.size, s.S.boom.dmg * s.power, 'fire', { burn: 2.4, ignite: true });
    else if (s.el === 'fire' && !at && i >= 0 && G.rng() < 0.4) Terrain.ignite(G, i, 2.6, s.by);
    if (s.el === 'water' && s.S && s.S.puddle) Terrain.forCircle(T, s.x, s.y, 26, j => Terrain.wet(G, j, 9));
    if (s.el === 'bolt' && i >= 0 && (Terrain.isWater(T, i) || T.wet[i] > 0)) Terrain.electrify(G, i, s.by);
    G.fx.push({ type: 'pop', x: s.x, y: s.y, el: s.el, r: s.r, petal: s.petal });
  }
  function boom(G, s, x, y, r, dmg, el, o = {}) {
    for (const u of G.units) if (foe(s, u) && hypot(u.x - x, u.y - y) < r + u.r) hit(G, s, u, dmg, { el, burn: o.burn, knock: o.knock || 260, kx: u.x - x, ky: u.y - y, big: true });
    let lit = 0;
    if (o.ignite) Terrain.forCircle(G.T, x, y, r * 0.8, i => { if (Terrain.ignite(G, i, 2.6, s.by)) lit++; });
    if (o.walls) Terrain.forCircle(G.T, x, y, r * 0.7, i => Terrain.hitWall(G, i, o.walls));
    if (lit >= 5 && s.by >= 0) Combos.add(G, s.by, 'incendio', { x, y });
    G.fx.push({ type: 'boom', x, y, r, el }); G.events.push({ type: 'boom', x, y, r, el });
  }
  /* ---------- paso de tiempo ---------- */
  function update(G, dt) {
    const T = G.T, L = G.spells;
    for (const s of L) {
      if (s.dead) continue; s.age += dt;
      switch (s.t) {
        case 'proj': stepProj(G, s, dt); break;
        case 'wave': {
          s.d += s.S.speed * dt; const d0 = s.d - 34, d1 = s.d + 10;
          for (const u of G.units) { if (!foe(s, u) || s.hitSet.has(u)) continue; const dx = u.x - s.x, dy = u.y - s.y, d = hypot(dx, dy); if (d > d0 - u.r && d < d1 + u.r && Math.abs(angDiff(s.ang, Math.atan2(dy, dx))) < s.half) { s.hitSet.add(u); hit(G, s, u, s.S.dmg * s.power, { el: 'water', knock: s.S.knock, kx: Math.cos(s.ang) * 0.6 + dx / d, ky: Math.sin(s.ang) * 0.6 + dy / d, wet: s.S.wet, big: true }); } }
          for (const p of L) { if (p.t !== 'proj' || p.dead || p.team === s.team || p.heavy || p.ground) continue; const dx = p.x - s.x, dy = p.y - s.y, d = hypot(dx, dy); if (d > d0 && d < d1 + 10 && Math.abs(angDiff(s.ang, Math.atan2(dy, dx))) < s.half) { endProj(G, p, true); if (p.el === 'fire') G.fx.push({ type: 'steam', x: p.x, y: p.y, r: 30 }); } }
          if (G.frame % 3 === 0) for (let a = -s.half; a <= s.half; a += 0.2) { const i = Terrain.idx(T, s.x + Math.cos(s.ang + a) * s.d, s.y + Math.sin(s.ang + a) * s.d); if (i >= 0) Terrain.wet(G, i, 8); }
          if (s.d > s.range) s.dead = true; break;
        }
        case 'vortex': case 'firenado': {
          if (s.t === 'firenado') {
            let best = null, bd = 1e9; for (const u of G.units) if (foe(s, u) && !u.untargetable) { const d = hypot(u.x - s.x, u.y - s.y); if (d < bd) { bd = d; best = u; } }
            if (best && s.age > 0.25) { const sp = hypot(s.vx, s.vy), a = Math.atan2(s.vy, s.vx), want = Math.atan2(best.y - s.y, best.x - s.x), na = a + clamp(angDiff(a, want), -s.turn * dt, s.turn * dt); s.vx = Math.cos(na) * sp; s.vy = Math.sin(na) * sp; }
            if (G.frame % 6 === 0) Terrain.forCircle(T, s.x, s.y, s.r * 0.6, i => Terrain.ignite(G, i, 2.6, s.by));
          } else {
            const i = Terrain.idx(T, s.x, s.y); if (i >= 0 && T.fire[i] > 0) toFirenado(G, s, s.by);
          }
          s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 1 - 0.25 * dt; s.vy *= 1 - 0.25 * dt;
          if (Terrain.solidAt(T, s.x, s.y)) { s.vx *= -0.4; s.vy *= -0.4; s.x += s.vx * dt * 2; s.y += s.vy * dt * 2; }
          for (const u of G.units) {
            if (!foe(s, u) || u.obj === 'turret') continue; const dx = s.x - u.x, dy = s.y - u.y, d = hypot(dx, dy);
            if (d < s.r + 55) { const f = s.pull * (1 - d / (s.r + 55)) * dt * (u.knockMul || 1); u.vx += dx / (d || 1) * f; u.vy += dy / (d || 1) * f; }
            if (d < s.r) {
              hit(G, s, u, s.dps * dt, { el: s.t === 'firenado' ? 'fire' : 'wind', tick: true });
              if (s.t === 'firenado') u.burn(G, 1.4, s.by);
              if (d < 24 && s.t === 'vortex' && (!u._vt || G.time - u._vt > 1)) { u._vt = G.time; u.stun(0.32); }
              u.lastSpell = null;
            }
          }
          s.life -= dt; if (s.life <= 0 || s.x < 0 || s.y < 0 || s.x > T.W || s.y > T.H) s.dead = true; break;
        }
        case 'lob': {
          s.tt += dt; const f = Math.min(1, s.tt / s.T); s.x = lerp(s.x0, s.tx, f); s.y = lerp(s.y0 + 20, s.ty, f); s.z = Math.sin(f * Math.PI) * (s.kind === 'meteor' ? 170 : 90) + (1 - f) * 20;
          if (f >= 1) { s.dead = true; land(G, s); } break;
        }
        case 'trap': {
          if (s.arm > 0) s.arm -= dt; s.life -= dt; const i = Terrain.idx(T, s.x, s.y);
          if (i >= 0 && T.fire[i] > 0) { s.dead = true; G.fx.push({ type: 'pop', x: s.x, y: s.y, el: 'fire' }); break; }
          if (s.arm <= 0) for (const u of G.units) if (foe(s, u) && !u.obj && hypot(u.x - s.x, u.y - s.y) < s.r + u.r) { hit(G, s, u, s.S.dmg * s.power, { el: 'plant', root: s.S.trap.root * s.power, unavoid: true }); s.dead = true; G.fx.push({ type: 'snare', x: s.x, y: s.y }); break; }
          if (s.life <= 0) s.dead = true; break;
        }
        case 'mine': {
          if (s.arm > 0) s.arm -= dt; s.life -= dt; const i = Terrain.idx(T, s.x, s.y);
          if (i >= 0 && (T.wet[i] > 0 || Terrain.isWater(T, i))) { s.dead = true; G.fx.push({ type: 'steam', x: s.x, y: s.y, r: 24 }); break; }
          if (s.arm <= 0) for (const u of G.units) if (foe(s, u) && !u.obj && hypot(u.x - s.x, u.y - s.y) < s.S.trig + u.r) { s.dead = true; boom(G, s, s.x, s.y, s.r, s.dmg, 'fire', { burn: 2.2, ignite: true }); break; }
          if (s.life <= 0 && !s.dead) { s.dead = true; boom(G, s, s.x, s.y, s.r * 0.8, s.dmg * 0.6, 'fire', { burn: 1.5, ignite: true }); } break;
        }
        case 'strike': {
          s.delay -= dt; if (s.delay > 0) break; s.dead = true;
          for (const u of G.units) if (foe(s, u) && hypot(u.x - s.x, u.y - s.y) < s.r + u.r) hit(G, s, u, s.dmg, { el: 'bolt', stun: s.stun, big: !s.small, noWet: s.noWet });
          let elec = false; Terrain.forCircle(T, s.x, s.y, s.r * 0.6, i => { if (!elec && (Terrain.isWater(T, i) || T.wet[i] > 0)) { elec = true; Terrain.electrify(G, i, s.by, s.small ? 0.6 : 1.3, s.small ? 20 : 70); } if (T.base[i] === TT.BUSH && G.rng() < 0.4) Terrain.ignite(G, i, 2.6, s.by); });
          G.fx.push({ type: 'bolt', x: s.x, y: s.y, r: s.r, small: s.small }); G.events.push({ type: 'thunder', x: s.x, y: s.y, big: !s.small && s.r > 50 }); break;
        }
        case 'cloud': {
          s.x += (s.vx || 0) * dt; s.y += (s.vy || 0) * dt; s.vx *= 1 - 1.2 * dt; s.vy *= 1 - 1.2 * dt;
          for (const u of G.units) { const d = hypot(u.x - s.x, u.y - s.y); if (d < s.r) { u.st.hidden = 0.2; if (foe(s, u) && !u.obj) { hit(G, s, u, s.dps * dt, { el: 'fire', tick: true }); u.lastSpell = null; } if (u.st.burn > 0) u.st.burn = 0; } }
          if (G.frame % 10 === 0) Terrain.forCircle(T, s.x, s.y, s.r * 0.8, i => { if (T.fire[i] > 0) T.fire[i] = 0; if (T.ice[i] > 0) T.ice[i] = Math.min(T.ice[i], 1); });
          s.life -= dt; if (s.life <= 0) s.dead = true; break;
        }
        case 'beam': {
          const m = G.mages[s.by]; if (!m || !m.alive) { s.dead = true; break; }
          s.x = m.x; s.y = m.y;
          if (!s.fired) { s.windup -= dt; const a = m.aim(G, s.S.len, 0); s.ang = a.ang; if (s.windup <= 0) { s.fired = true; s.show = 0.28; fireBeam(G, s, m); } }
          else { s.show -= dt; if (s.show <= 0) s.dead = true; } break;
        }
        case 'bloom': {
          for (const u of G.units) if (u.alive && !u.obj && hypot(u.x - s.x, u.y - s.y) < s.r + u.r) { const h = u.heal(G, s.hps * dt); if (h > 0 && u.isMage) u._healT = 0.3; }
          s.life -= dt; if (s.life <= 0) s.dead = true; break;
        }
        case 'storm': {
          s.x += (s.vx || 0) * dt; s.y += (s.vy || 0) * dt; s.vx *= 1 - 1.2 * dt; s.vy *= 1 - 1.2 * dt;
          for (const u of G.units) if (!u.obj && hypot(u.x - s.x, u.y - s.y) < s.r) u.soak(G, 1.5);
          if (G.frame % 8 === 0) Terrain.forCircle(T, s.x, s.y, s.r * 0.85, i => Terrain.wet(G, i, 5));
          s.next -= dt;
          if (s.next <= 0) {
            s.next = s.S.every; let px, py; const inside = G.units.filter(u => foe(s, u) && !u.obj && hypot(u.x - s.x, u.y - s.y) < s.r + 10);
            if (inside.length && G.rng() < 0.7) { const u = inside[G.rng.int(inside.length)]; px = u.x + (G.rng() - 0.5) * 40; py = u.y + (G.rng() - 0.5) * 40; }
            else { const a = G.rng() * TAU, d = Math.sqrt(G.rng()) * s.r * 0.85; px = s.x + Math.cos(a) * d; py = s.y + Math.sin(a) * d; }
            add(G, { t: 'strike', S: { delay: 0.38 }, by: s.by, team: s.team, el: 'bolt', x: px, y: py, delay: 0.38, r: s.S.sr, dmg: s.dmg, stun: 0.12, small: true, noWet: true, power: 1, size: 1 });
          }
          s.life -= dt; if (s.life <= 0) s.dead = true; break;
        }
        case 'sand': {
          const m = G.mages[s.by]; if (m && m.alive) { s.x = m.x; s.y = m.y; m.st.hidden = 0.2; if (m.tr.sandHeal) { m.heal(G, m.tr.sandHeal * dt); m._healT = 0.3; } }
          for (const u of G.units) if (foe(s, u) && !u.obj && hypot(u.x - s.x, u.y - s.y) < s.r) { u.st.blind = 0.25; hit(G, s, u, s.dps * dt, { el: 'earth', tick: true }); u.lastSpell = null; }
          for (const p of L) if (p.t === 'proj' && p.team !== s.team && !p.ground && hypot(p.x - s.x, p.y - s.y) < s.r) { p.vx *= 1 - 1.6 * dt; p.vy *= 1 - 1.6 * dt; const a = (G.rng() - 0.5) * 3 * dt, c = Math.cos(a), sn = Math.sin(a); const vx = p.vx * c - p.vy * sn; p.vy = p.vx * sn + p.vy * c; p.vx = vx; }
          s.life -= dt; if (s.life <= 0) s.dead = true; break;
        }
        case 'magnet': {
          for (const u of G.units) {
            if (!foe(s, u) || u.obj === 'turret') continue; const dx = s.x - u.x, dy = s.y - u.y, d = hypot(dx, dy);
            if (d < s.pullR && d > 14) { const f = s.pull * 3.2 * dt * (u.knockMul || 1) * (1 - d / s.pullR * 0.5); u.vx += dx / d * f; u.vy += dy / d * f; }
            if (d < 62) { hit(G, s, u, s.dps * dt, { el: 'bolt', tick: true }); u.lastSpell = null; }
          }
          s.life -= dt; if (s.life <= 0) { s.dead = true; G.fx.push({ type: 'rubble', x: s.x, y: s.y, soft: 1 }); } break;
        }
        default: Spells2.step(G, s, dt);
      }
    }
    // torretas (unidades)
    for (const t of G.units) {
      if (t.obj !== 'turret' || !t.alive) continue;
      t.life -= dt; if (t.life <= 0) { t.alive = false; G.fx.push({ type: 'pop', x: t.x, y: t.y, el: 'plant', r: 20 }); continue; }
      t.next -= dt; if (t.next > 0) continue;
      let best = null, bd = t.reach; for (const u of G.units) if (u.alive && u.team !== t.team && !u.obj && u.st.hidden <= 0) { const d = hypot(u.x - t.x, u.y - t.y); if (d < bd) { bd = d; best = u; } }
      if (best) { t.next = t.every; hit(G, { by: t.by, team: t.team, el: 'bolt', id: -t.by - 10, x: t.x, y: t.y }, best, t.dmg, { el: 'bolt' }); G.fx.push({ type: 'zap', x0: t.x, y0: t.y - 30, x1: best.x, y1: best.y - 14, el: 'bolt' }); G.events.push({ type: 'tzap', x: t.x, y: t.y }); }
      else t.next = 0.15;
    }
    clash(G);
    Camp.resonance(G);
    // limpiar
    let w = 0; for (const s of L) if (!s.dead) L[w++] = s; L.length = w;
    let k = 0; for (const u of G.units) if (u.isMage || u.alive || u.keep) G.units[k++] = u; G.units.length = k;
  }
  function toFirenado(G, s, by) {
    const F = FUSIONS['fire+wind'];
    s.t = 'firenado'; s.el = 'fire'; s.dps = F.dps * 0.75 * s.power; s.turn = F.turn * 0.6; s.pull = F.pull; s.life = Math.max(s.life, 2.4); s.r = Math.max(s.r, F.r);
    G.events.push({ type: 'fusionReact', key: 'fire+wind', x: s.x, y: s.y }); Combos.add(G, by, 'torbellino', s);
  }
  function stepProj(G, s, dt) {
    const T = G.T;
    if (s.turn && s.age > (s.delayHome || 0)) {
      let best = null, bd = 900; for (const u of G.units) if (foe(s, u) && !u.untargetable && u.st.hidden <= 0) { const d = hypot(u.x - s.x, u.y - s.y); if (d < bd) { bd = d; best = u; } }
      if (best) { const sp = hypot(s.vx, s.vy), a = Math.atan2(s.vy, s.vx), na = a + clamp(angDiff(a, Math.atan2(best.y - s.y, best.x - s.x)), -s.turn * dt, s.turn * dt); s.vx = Math.cos(na) * sp; s.vy = Math.sin(na) * sp; }
    }
    const ox = s.x, oy = s.y; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    const i = Terrain.idx(T, s.x, s.y);
    if (i < 0 || Terrain.solid(T, i)) {
      if (i >= 0 && T.wall[i] > 0) Terrain.hitWall(G, i, s.heavy ? s.dmg * 2.2 : s.dmg);
      if (s.bounce > 0) {
        s.bounce--; s.x = ox; s.y = oy;
        const bx = i < 0 ? (s.x + s.vx * dt < 0 || s.x + s.vx * dt > T.W) : Terrain.solidAt(T, ox + s.vx * dt, oy), by = i < 0 ? (s.y + s.vy * dt < 0 || s.y + s.vy * dt > T.H) : Terrain.solidAt(T, ox, oy + s.vy * dt);
        if (bx || !by) s.vx = -s.vx; if (by || !bx) s.vy = -s.vy;
        G.events.push({ type: 'bounce', x: s.x, y: s.y }); s.bounced = true; return;
      }
      endProj(G, s, false); return;
    }
    if (s.gust) {
      for (const p of G.spells) {
        if (p === s || p.dead || p.t !== 'proj' || p.team === s.team || p.ground || p.gust) continue;
        if (hypot(p.x - s.x, p.y - s.y) > s.r + p.r + 6) continue;
        const sp = hypot(p.vx, p.vy) * 1.12, m = G.mages[s.by], tg = m ? m.aim(G, 900, sp) : null;
        const ang = tg && tg.target ? Math.atan2(tg.target.y - p.y, tg.target.x - p.x) : Math.atan2(s.vy, s.vx);
        p.vx = Math.cos(ang) * sp; p.vy = Math.sin(ang) * sp; p.team = s.team; p.by = s.by; p.reflected = true; p.life = Math.max(p.life, 0.9); p.age = 0;
        G.events.push({ type: 'reflect', x: p.x, y: p.y, who: s.by });
      }
      for (const c of G.spells) if ((c.t === 'cloud' || c.t === 'storm' || c.t === 'firenado' || c.t === 'vortex') && c !== s && hypot(c.x - s.x, c.y - s.y) < (c.r || 60)) { c.vx = (c.vx || 0) + s.vx * 0.012; c.vy = (c.vy || 0) + s.vy * 0.012; }
      if (G.frame % 2 === 0) G.fx.push({ type: 'gust', x: s.x, y: s.y - 16, vx: s.vx, vy: s.vy });
      Terrain.forCircle(T, s.x, s.y, 10, j => { if (T.fire[j] > 0 && G.rng() < 0.05) { const c2 = Terrain.idx(T, s.x + s.vx * 0.06, s.y + s.vy * 0.06); if (c2 >= 0) Terrain.ignite(G, c2, 2.2, T.fireO[j]); } });
    }
    if (s.ground) { const b = T.base[i]; if ((b === TT.DEEP && T.ice[i] <= 0) || b === TT.CHASM || Terrain.isLava(T, i)) { endProj(G, s, false); return; } if (G.frame % 2 === 0) G.fx.push({ type: 'rootTrail', x: s.x, y: s.y }); }
    if (s.el === 'fire' && G.frame % 3 === 0) for (const v of G.spells) if (v.t === 'vortex' && !v.dead && hypot(v.x - s.x, v.y - s.y) < v.r) { toFirenado(G, v, v.by); endProj(G, s, true); return; }
    for (const u of G.units) {
      if (!foe(s, u)) continue;
      if (hypot(u.x - s.x, (u.y - 14) - s.y) < u.r + s.r + 2 || hypot(u.x - s.x, u.y - s.y) < u.r + s.r) {
        if (u.iframes > 0 && !u.obj) {
          // CONTRACONJURO: esquivar en el último instante devuelve el hechizo
          if (u.isMage && u.dash.t > 0 && u.dash.age < 0.11 && !s.gust && !s.ground) {
            const back = s.by >= 0 && G.mages[s.by] && G.mages[s.by].alive ? G.mages[s.by] : u.nearestFoe(G, 1400), sp = hypot(s.vx, s.vy) * 1.25;
            const ang = back ? Math.atan2(back.y - s.y, back.x - s.x) : Math.atan2(-s.vy, -s.vx);
            s.vx = Math.cos(ang) * sp; s.vy = Math.sin(ang) * sp; s.team = u.team; s.by = u.idx; s.dmg *= 1.3; s.reflected = true; s.life = Math.max(s.life, 1.1); s.age = 0;
            G.events.push({ type: 'counter', x: s.x, y: s.y, who: u.idx }); Combos.add(G, u.idx, 'contraconjuro', u); u.dash.charges = Math.min(u.dashN || 2, u.dash.charges + 1); G.slow = Math.max(G.slow, 0.25);
            continue;
          }
          hit(G, s, u, 0, {}); continue;
        }
        if (u.pushable) { const sp = hypot(s.vx, s.vy) || 1, f = (210 + s.dmg * 32 + ((s.S && s.S.knock) || 0) * 0.6) * u.knockMul; u.vx += s.vx / sp * f; u.vy += s.vy / sp * f; u.flash = 0.12; G.events.push({ type: 'tejoHit', x: u.x, y: u.y, by: s.by }); u.lastBy = s.by; endProj(G, s, true); return; }
        if (u.obj) { u.hurt(G, s.dmg, { by: s.by, el: s.el }); endProj(G, s, true); return; }
        const S = s.S, el = s.el;
        const o = { el, big: s.big, kx: s.vx, ky: s.vy };
        if (el === 'fire') o.burn = 2.4;
        if (el === 'water') { o.wet = S.wet || 4; o.knock = S.knock; }
        if (el === 'earth') { o.stun = S.stun; o.knock = S.knock; }
        if (s.gust) { o.knock = S.knock; o.el = 'wind'; }
        if (s.root) o.root = s.root;
        if (s.fusion === 'wind+bolt') o.stun = S.stun;
        if (S.dazzle) o.dazzle = S.dazzle; if (S.hex) o.hex = S.hex; if (s.burnT) o.burn = s.burnT;
        if (s.petal) o.noGraze = false;
        if (s.pierced && s.pierced.has(u)) continue;
        hit(G, s, u, s.dmg, o);
        if (s.pierce > 0) { s.pierce--; (s.pierced = s.pierced || new Set()).add(u); G.fx.push({ type: 'pop', x: s.x, y: s.y, el: s.el, r: s.r }); continue; }
        if (s.fusion === 'wind+bolt' && S.chain) { const n2 = G.units.find(v => v !== u && foe(s, v) && hypot(v.x - u.x, v.y - u.y) < S.chain); if (n2) { hit(G, s, n2, s.dmg * 0.5, { el: 'bolt' }); G.fx.push({ type: 'zap', x0: u.x, y0: u.y - 14, x1: n2.x, y1: n2.y - 14, el: 'bolt' }); } }
        endProj(G, s, true); return;
      }
    }
    if (s.life <= 0) endProj(G, s, false);
  }
  function land(G, s) {
    const T = G.T, S = s.S;
    if (s.kind === 'lob') {
      G.events.push({ type: 'seedLand', x: s.tx, y: s.ty, by: s.by });
      // semilla: brota una trampa (como mucho 3 por mago)
      const mine = G.spells.filter(t => t.t === 'trap' && t.by === s.by && !t.dead);
      if (mine.length >= 3) mine[0].dead = true;
      for (const u of G.units) if (foe(s, u) && !u.obj && hypot(u.x - s.tx, u.y - s.ty) < S.trap.r + u.r) { hit(G, s, u, S.dmg * s.power, { el: 'plant', root: (S.hitRoot || S.trap.root) * s.power }); G.fx.push({ type: 'snare', x: s.tx, y: s.ty }); return; }
      const i = Terrain.idx(T, s.tx, s.ty);
      if (i < 0 || (T.base[i] === TT.DEEP && T.ice[i] <= 0) || Terrain.isLava(T, i) || T.base[i] === TT.CHASM) { G.fx.push({ type: 'pop', x: s.tx, y: s.ty, el: 'plant' }); return; }
      add(G, Object.assign({}, s, { t: 'trap', x: s.tx, y: s.ty, arm: 0.3, life: S.trap.life, r: S.trap.r * s.size, dead: false }));
      G.fx.push({ type: 'sprout', x: s.tx, y: s.ty, delay: 0 });
    } else if (s.kind === 'meteor') {
      boom(G, s, s.tx, s.ty, S.r * s.size, S.dmg * s.power, 'fire', { burn: 2.4, knock: S.knock, ignite: true, walls: 999 });
      Terrain.forCircle(T, s.tx, s.ty, S.pool.r * s.size, i => { const b = T.base[i]; if (b !== TT.ROCK && b !== TT.CHASM && !(b === TT.DEEP && T.ice[i] <= 0)) { T.lava[i] = S.pool.life * (s.gran ? 1.3 : 1); T.wet[i] = 0; T.ice[i] = 0; T.ver++; } });
      G.events.push({ type: 'quake', x: s.tx, y: s.ty });
    } else if (s.kind === 'mud') {
      for (const u of G.units) if (foe(s, u) && !u.obj && hypot(u.x - s.tx, u.y - s.ty) < S.r * s.size + u.r) hit(G, s, u, S.dmg * s.power, { el: 'earth', wet: 2 });
      Terrain.forCircle(T, s.tx, s.ty, S.r * s.size, i => { const b = T.base[i]; if (b !== TT.ROCK && b !== TT.CHASM && b !== TT.DEEP) { T.mud[i] = S.life * (s.gran ? 1.3 : 1); T.fire[i] = 0; } });
      G.fx.push({ type: 'splat', x: s.tx, y: s.ty, r: S.r * s.size });
    } else Spells2.land(G, s);
  }
  function fireBeam(G, s, m) {
    const S = s.S, L = S.len * s.size, W = S.w * s.size, x0 = m.x, y0 = m.y - 16, x1 = x0 + Math.cos(s.ang) * L, y1 = y0 + Math.sin(s.ang) * L;
    s.x1 = x1; s.y1 = y1;
    for (const u of G.units) if (foe(s, u) && segDist(u.x, u.y - 14, x0, y0, x1, y1) < W / 2 + u.r) hit(G, s, u, S.dmg * s.power, { el: 'fire', burn: 2, knock: 260, kx: Math.cos(s.ang), ky: Math.sin(s.ang), big: true });
    let lit = 0; Terrain.forLine(G.T, x0, y0 + 16, x1, y1 + 16, i => { if (G.T.wall[i] > 0) Terrain.hitWall(G, i, 999); else if (Terrain.burnable(G.T, i) && G.rng() < 0.5 && Terrain.ignite(G, i, 2.6, s.by)) lit++; });
    if (lit >= 5) Combos.add(G, s.by, 'incendio', { x: (x0 + x1) / 2, y: (y0 + y1) / 2 });
    G.events.push({ type: 'beam', x: x0, y: y0 }); G.fx.push({ type: 'beamFlash', x0, y0, x1, y1, w: W });
  }
  // proyectiles de distintos equipos que se encuentran en el aire
  function clash(G) {
    const P = G.spells.filter(s => s.t === 'proj' && !s.dead && !s.ground && !s.gust);
    for (let a = 0; a < P.length; a++) for (let b = a + 1; b < P.length; b++) {
      const p = P[a], q = P[b]; if (p.dead || q.dead || p.team === q.team) continue;
      if (hypot(p.x - q.x, p.y - q.y) > p.r + q.r) continue;
      const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
      if ((p.el === 'fire' && q.el === 'water') || (p.el === 'water' && q.el === 'fire')) {
        endProj(G, p, true); endProj(G, q, true);
        add(G, { t: 'cloud', team: -1, by: -1, noSelf: true, el: 'water', x: mx, y: my, vx: 0, vy: 0, r: 62, life: 1.6, dps: 0, power: 1, size: 1, S: FUSIONS['fire+water'] });
        G.events.push({ type: 'clash', x: mx, y: my, kind: 'vapor' }); continue;
      }
      if (p.heavy && !q.heavy) { endProj(G, q, true); p.vx *= 0.85; p.vy *= 0.85; }
      else if (q.heavy && !p.heavy) { endProj(G, p, true); q.vx *= 0.85; q.vy *= 0.85; }
      else { endProj(G, p, true); endProj(G, q, true); }
      G.events.push({ type: 'clash', x: mx, y: my, kind: 'hit' }); G.fx.push({ type: 'clash', x: mx, y: my });
    }
  }
  return { cast, update, hit, boom, foe, add, aimPoint, segDist, endProj };
})();
