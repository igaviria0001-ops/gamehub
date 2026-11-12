/* =========================================================================
   LA MÁQUINA — juega con las mismas teclas que una persona (Bot.read
   devuelve lo mismo que Input.read). Esquiva lo que viene, evita el suelo
   peligroso, busca su distancia, elige hechizo según la situación (rival
   mojado → rayo, enredado → golpe grande...), carga, funde y a veces va a
   beber de una fuente. Niveles: 0 fácil, 1 normal, 2 difícil.
   ========================================================================= */
const BOT_LV = [
  { react: 0.42, dodge: 0.3, jit: 0.32, think: 0.32, absorb: 0.15, aggro: 0.55 },
  { react: 0.24, dodge: 0.62, jit: 0.16, think: 0.2, absorb: 0.35, aggro: 0.8 },
  { react: 0.12, dodge: 0.88, jit: 0.06, think: 0.12, absorb: 0.55, aggro: 1.0 },
];
const DIRS16 = Array.from({ length: 16 }, (_, k) => [Math.cos(k / 16 * TAU), Math.sin(k / 16 * TAU)]);
class Bot {
  constructor(level = 1) { this.lv = clamp(level, 0, 2); this.P = BOT_LV[this.lv]; this.inp = { mx: 0, my: 0, h: [false, false], dash: false, aim: null }; this.plan = null; this.thinkT = 0; this.castT = 0.8; this.dir = [0, 0]; this.dodged = new Set(); this.goal = null; this.absorbT = 2; this.strafe = 1; this.strafeT = 0; }
  // rival más útil: el mago (o criatura) más cercano
  target(G, m) {
    let best = null, bd = 1e9;
    for (const u of G.units) { if (!u.alive || u.team === m.team) continue; const dec = u.obj === 'decoy' && u.foolK < [0.85, 0.6, 0.35][this.lv]; if (u.obj && !dec) continue; if (u.isMage && u.st.hidden > 0 && G.mode !== 'camp') continue; const d = hypot(u.x - m.x, u.y - m.y) - (u.isMage || dec ? 120 : 0); if (d < bd) { bd = d; best = u; } }
    return best;
  }
  danger(G, x, y, m) {
    const T = G.T, i = Terrain.idx(T, x, y); if (i < 0) return 50;
    let d = 0; const b = T.base[i];
    if (Terrain.solid(T, i)) d += 30;
    if (T.fire[i] > 0) d += m.fireRes < 1 ? 12 : 26;
    if (Terrain.isLava(T, i)) d += m.fireRes < 1 ? 20 : 40;
    if (T.elec[i] > 0 && !(m.tr.elecImmune && T.elecO[i] === m.idx)) d += 22;
    if (T.vine[i] > 0 && T.vineO[i] !== m.idx) d += 14;
    if (T.mud[i] > 0 && !m.tr.waterSpeed) d += 9;
    if (b === TT.DEEP && T.ice[i] <= 0 && !m.tr.waterSpeed) d += 10;
    if (b === TT.CHASM || (T.pit[i] > 0 && !G.ally(T.pitO[i], m))) d += 60;
    if (G.ring && hypot(x - G.ring.x, y - G.ring.y) > G.ring.r - 30) d += 25;
    for (const s of G.spells) {
      if (s.team === m.team) continue;
      if ((s.t === 'strike' || s.t === 'judgment' || s.t === 'nova') && hypot(x - s.x, y - s.y) < s.r + 26) d += 40;
      else if (s.t === 'pit' && hypot(x - s.x, y - s.y) < s.r + 20) d += 45;
      else if ((s.t === 'eclipse' || s.t === 'bog') && hypot(x - s.x, y - s.y) < s.r) d += 14;
      else if (s.t === 'thorns' && Math.abs(hypot(x - s.x, y - s.y) - s.r) < 30) d += 20;
      else if ((s.t === 'firenado' || s.t === 'vortex') && hypot(x - s.x, y - s.y) < s.r + 40) d += 24;
      else if ((s.t === 'storm' || s.t === 'cloud') && s.dps !== 0 && hypot(x - s.x, y - s.y) < s.r) d += s.t === 'storm' ? 16 : 6;
      else if (s.t === 'magnet' && hypot(x - s.x, y - s.y) < s.pullR) d += 10;
      else if ((s.t === 'mine' || s.t === 'trap') && hypot(x - s.x, y - s.y) < 60) d += this.lv > 0 ? 18 : 4;
      else if (s.t === 'lob' && hypot(x - s.tx, y - s.ty) < (s.S.r || 40) + 30) d += 30;
      else if (s.t === 'beam' && !s.fired) { const dx = x - s.x, dy = y - s.y; if (Math.abs(angDiff(s.ang, Math.atan2(dy, dx))) < 0.25 && hypot(dx, dy) < 660) d += 35; }
    }
    return d;
  }
  // proyectil que viene directo: [tiempo, objeto]
  threat(G, m) {
    let best = null;
    for (const s of G.spells) {
      if (s.t !== 'proj' || s.team === m.team || s.dead) continue;
      const rx = m.x - s.x, ry = m.y - s.y, vx = s.vx - m.vx * 0.3, vy = s.vy - m.vy * 0.3, v2 = vx * vx + vy * vy || 1;
      const tc = (rx * vx + ry * vy) / v2; if (tc < 0 || tc > 0.75) continue;
      const mx = rx - vx * tc, my = ry - vy * tc; if (hypot(mx, my) > m.r + s.r + 16) continue;
      if (!best || tc < best.tc) best = { tc, s };
    }
    return best;
  }
  bestRange(m) {
    let r = 0, n = 0; for (const h of m.hands) { const S = SPELLS[h.el][0]; const rr = S.kind === 'proj' ? S.speed * S.life * (S.gust ? 0.8 : 0.55) : S.kind === 'cone' ? 170 : S.kind === 'zap' ? 230 : 260; r += rr; n++; }
    return clamp(r / n, 170, 380);
  }
  read(G, m, dt) {
    const I = this.inp, P = this.P; I.dash = false;
    let f = this.target(G, m), modeGoal = null;
    if (G.mode !== 'duel' && G.mode !== 'free') ({ f, modeGoal } = this.modeTarget(G, m, f));
    if (!modeGoal && G.runes && G.runes.length) { const r = G.runes[0], d = hypot(r.x - m.x, r.y - m.y), df = f ? hypot(r.x - f.x, r.y - f.y) : 999; if (d < 520 && (d < df + 80 || this.lv === 2)) modeGoal = [r.x, r.y]; }
    this.thinkT -= dt; this.castT -= dt; this.absorbT -= dt; this.strafeT -= dt;
    if (this.strafeT <= 0) { this.strafeT = 1 + G.rng() * 2; this.strafe = G.rng() < 0.5 ? -1 : 1; }
    // ---- seguir un plan de lanzamiento ----
    if (this.plan) {
      const p = this.plan; p.t += dt;
      if (f) { const lead = p.lead || 0; I.aim = Math.atan2(f.y + f.vy * lead - m.y, f.x + f.vx * lead - m.x) + p.jit; }
      I.h = [p.keys.includes(0) && p.t < p.hold, p.keys.includes(1) && p.t < p.hold];
      if (p.t >= p.hold + 0.05) { this.plan = null; I.h = [false, false]; this.castT = P.react + G.rng() * P.react; }
    } else I.aim = null;
    // ---- esquivar ----
    const th = this.threat(G, m);
    if (th && !this.dodged.has(th.s.id)) {
      this.dodged.add(th.s.id); if (this.dodged.size > 60) this.dodged.clear();
      const roll = G.rng();
      if (th.tc < 0.3 + P.react * 0.5 && roll < P.dodge) {
        const px = -th.s.vy, py = th.s.vx, l = hypot(px, py) || 1; let sx = px / l, sy = py / l;
        if (this.danger(G, m.x + sx * 140, m.y + sy * 140, m) > this.danger(G, m.x - sx * 140, m.y - sy * 140, m)) { sx = -sx; sy = -sy; }
        const drop = d => this.danger(G, m.x + sx * d, m.y + sy * d, m) >= 50;
        if (m.dash.charges > 0 && roll < P.dodge * 0.75 && th.tc < 0.28 && !drop(150) && !drop(190) && !drop(110)) { I.mx = sx; I.my = sy; I.dash = true; this.dir = [sx, sy]; this.thinkT = 0.25; }
        else if (!drop(40) && !drop(80)) { this.dir = [sx, sy]; this.thinkT = 0.3; }
      }
    }
    // ---- moverse ----
    if (this.thinkT <= 0) {
      this.thinkT = P.think * (0.7 + G.rng() * 0.6);
      let goalX = null, goalY = null;
      if (this.goal && this.goal.s.cd > 0) this.goal = null;
      if (this.goal) { goalX = this.goal.s.x; goalY = this.goal.s.y; }
      else if (this.absorbT <= 0) { this.absorbT = 3 + G.rng() * 3; if (G.rng() < P.absorb && m.hp > m.maxHp * 0.35) this.pickSource(G, m, f); }
      // en la campaña: camino de verdad (rodear ríos de lava, vacíos y rocas) hacia la meta lejana
      if (G.mode === 'camp') { if (goalX != null) { const w = this.nav(G, m, goalX, goalY); if (w) { goalX = w[0]; goalY = w[1]; } } else if (modeGoal) { const w = this.nav(G, m, modeGoal[0], modeGoal[1]); if (w) modeGoal = w; } }
      const want = this.bestRange(m) * (m.emb >= 100 ? 0.8 : 1);
      let best = [0, 0], bs = -1e9;
      for (const [dx, dy] of [[0, 0], ...DIRS16]) {
        const nx = m.x + dx * 70, ny = m.y + dy * 70;
        let s = -this.danger(G, nx, ny, m) * 3 - this.danger(G, m.x + dx * 30, m.y + dy * 30, m) * 2 - (this.danger(G, m.x + dx * 115, m.y + dy * 115, m) >= 50 ? 40 : 0);
        if (goalX != null) s -= hypot(nx - goalX, ny - goalY) * 0.6;
        else if (modeGoal) { s -= hypot(nx - modeGoal[0], ny - modeGoal[1]) * 0.7; }
        else if (f) {
          const d = hypot(nx - f.x, ny - f.y); s -= Math.abs(d - want) * 0.35 * P.aggro;
          const tx = -(f.y - m.y), ty = f.x - m.x, tl = hypot(tx, ty) || 1; s += (dx * tx + dy * ty) / tl * 8 * this.strafe;
        }
        s -= hypot(nx - G.T.W / 2, ny - G.T.H / 2) * 0.02;
        if (dx === 0 && dy === 0) s -= 4;
        s += G.rng() * 3;
        if (s > bs) { bs = s; best = [dx, dy]; }
      }
      this.dir = best;
    }
    if (!I.dash) { I.mx = this.dir[0]; I.my = this.dir[1]; }
    if (this.plan && this.plan.still) { I.mx *= 0.3; I.my *= 0.3; }
    // ---- beber de la fuente ----
    if (this.goal && !this.plan) {
      const s = this.goal.s;
      if (hypot(s.x - m.x, s.y - m.y) < 30) { I.mx = I.my = 0; this.plan = { keys: [this.goal.k], hold: ABSORB_T + 0.08, t: 0, jit: 0, still: true }; this.goal = null; }
    }
    // ---- lanzar ----
    if (!this.plan && this.castT <= 0 && f && G.state === 'play') {
      if (f.spot && this.job && this.job.fuse) { if (hypot(f.x - m.x, f.y - m.y) < 260 && m.hands[0].cd <= 0 && m.hands[1].cd <= 0) this.plan = { keys: [0, 1], hold: 0.12, t: 0, lead: 0, jit: 0 }; }
      else if (f.spot) { const k = this.job && this.job.any ? m.hands.findIndex(h => h.cd <= 0) : m.hands.findIndex(h => h.el === (this.job && this.job.o.t === 'totem' ? 'bolt' : this.job && this.job.o.t === 'prism' ? 'light' : 'fire') && h.cd <= 0); if (k >= 0 && hypot(f.x - m.x, f.y - m.y) < 300) this.plan = { keys: [k], hold: 0.06, t: 0, lead: 0, jit: 0 }; }
      else this.chooseCast(G, m, f);
    }
    return I;
  }
  // en los otros modos: a qué apuntar y adónde ir
  modeTarget(G, m, foeMage) {
    let f = foeMage, modeGoal = null;
    if (G.mode === 'tejo' && G.tejo && G.goals) {
      const t = G.tejo, eg = G.goals[1 - m.idx], og = G.goals[m.idx], dx = eg.x - t.x, dy = eg.y - t.y, l = hypot(dx, dy) || 1;
      const danger = hypot(t.x - og.x, t.y - og.y) < 380;
      modeGoal = danger && hypot(m.x - og.x, m.y - og.y) > hypot(t.x - og.x, t.y - og.y) - 40 ? [og.x + (t.x - og.x) * 0.4, og.y + (t.y - og.y) * 0.4] : [t.x - dx / l * 150, t.y - dy / l * 150];
      const aligned = Math.abs(angDiff(Math.atan2(t.y - m.y, t.x - m.x), Math.atan2(dy, dx))) < 0.6;
      if (aligned || danger || !foeMage || hypot(foeMage.x - m.x, foeMage.y - m.y) > 320) f = t;
    } else if (G.mode === 'hunt') {
      const els = m.hands.map(h => h.el); let best = null, bd = 1e9, any = null, ad = 1e9;
      for (const u of G.units) { if (!(u instanceof Creature) || !u.alive) continue; const d = hypot(u.x - m.x, u.y - m.y); if ((!u.D.weak || els.includes(u.D.weak)) && d - (u.D.pts > 1 ? 200 : 0) < bd) { bd = d; best = u; } if (d < ad) { ad = d; any = u; } }
      if (best) { f = best; modeGoal = [best.x, best.y]; }
      else if (any) { f = any; if (!this.goal) { let sb = null, sd = 1e9; for (const s of G.sources) { if (s.cd > 0 || s.el !== any.D.weak) continue; const d = hypot(s.x - m.x, s.y - m.y); if (d < sd) { sd = d; sb = s; } } if (sb) this.goal = { s: sb, k: m.hands[0].uses > 0 ? 1 : 0 }; } modeGoal = [any.x, any.y]; }
      if (foeMage && hypot(foeMage.x - m.x, foeMage.y - m.y) < 200 && G.rng() < 0.3) f = foeMage;
    } else if (G.mode === 'camp') {
      // compañero: ayuda con braseros, tótems y sellos; si no, sigue a la persona y pelea
      const els = m.hands.map(h => h.el), spot = o => ({ x: o.x, y: o.y - 10, vx: 0, vy: 0, r: 20, st: { hidden: 0, wet: 0, root: 0, stun: 0, frozen: 0 }, spot: true });
      let job = null;
      if (G.objs) for (const o of G.objs) {
        if (o.t === 'brazier' && !o.lit && els.includes('fire')) job = job || { o, d: 170 };
        if (o.t === 'totem' && o.power <= 0 && els.includes('bolt')) job = job || { o, d: 170 };
        if (o.t === 'prism' && o.power <= 0 && els.includes('light')) job = job || { o, d: 170 };
        if (o.t === 'rocks' && G.T.wall[Terrain.idx(G.T, o.x, 510)] > 0 && G.objs.some(c => c.t === 'canoe' && c.blocked)) job = { o: { x: o.x, y: 510, t: 'rocks' }, d: 190, any: true };
        if (o.t === 'seal' && !o.done && fuseKey(els[0], els[1]) === o.need) job = { o, d: 120, fuse: true };
      }
      const pal = G.mages.find(x => x !== m && x.alive && !x.ctrl);
      const exitO = G.objs && G.objs.find(o => o.t === 'exit' && o.open);
      this.prefer = null; this.fuseOnly = false;
      // jefes: la máquina sabe la táctica de cada uno (lo que dice el texto del nivel)
      const B = G.boss && G.boss.alive ? G.boss : null, BP = B && Camp.bossPlan ? Camp.bossPlan(G, m, B) : Camp.levelPlan(G, m);
      if (BP) {
        if (BP.need && BP.need.some(e => !els.includes(e)) && !this.goal) { const miss = BP.need.find(e => !els.includes(e)); this.seek(G, m, miss, BP.need); }
        if (BP.prefer) this.prefer = BP.prefer;
        if (BP.target && els.includes('light') && (!f || f.obj || hypot(f.x - m.x, f.y - m.y) > 230)) { f = BP.target; if (hypot(f.x - m.x, f.y - m.y) > 300) modeGoal = [f.x + (m.x - f.x) * 0.3, f.y + (m.y - f.y) * 0.3]; }
        if (BP.fuse && BP.need.every(e => els.includes(e))) { this.fuseOnly = true; this.fuseR = BP.fuseR || 240; f = B; if (hypot(B.x - m.x, B.y - m.y) > (BP.fuseR || 240)) modeGoal = [B.x + (m.x - B.x) * 0.3, B.y + (m.y - B.y) * 0.3]; }
        if (BP.lightJob && !els.includes('fire')) job = null;
      }
      if (job && (!f || hypot(f.x - m.x, f.y - m.y) > 260 || job.fuse || (BP && BP.lightJob))) { f = spot(job.o); modeGoal = [job.o.x - job.d * 0.7, job.o.y]; this.job = job; }
      else { this.job = null; if (exitO && (!f || hypot(f.x - m.x, f.y - m.y) > 240) && (!pal || hypot(pal.x - exitO.x, pal.y - exitO.y) < 420)) modeGoal = [exitO.x, exitO.y]; else if (pal && hypot(pal.x - m.x, pal.y - m.y) > 300 && !BP) modeGoal = [pal.x - 80, pal.y + 40]; }
    } else if (G.mode === 'altar' && G.altar) {
      const A = G.altar; modeGoal = [A.x + Math.cos(G.time + m.idx * 3) * 40, A.y + Math.sin(G.time + m.idx * 3) * 25];
    }
    return { f, modeGoal };
  }
  // camino por la cuadrícula (BFS de 8 vecinos que evita lo que mata), recalculado cada 0,4 s; devuelve el punto
  // visible más lejano del camino (hasta ~6 celdas) para no zigzaguear
  nav(G, m, gx, gy) {
    const T = G.T, s0 = Terrain.idx(T, m.x, m.y), g0 = Terrain.idx(T, gx, gy); if (s0 < 0 || g0 < 0) return null;
    const bad = i => { const b = T.base[i]; return Terrain.solid(T, i) || b === TT.CHASM || Terrain.isLava(T, i) || T.pit[i] > 0 || (b === TT.DEEP && T.ice[i] <= 0 && !m.tr.waterSpeed && !(T.bridgeUnder === TT.DEEP && b === TT.BRIDGE)); };
    if (hypot(gx - m.x, gy - m.y) < 140 && this.clearWalk(G, m, m.x, m.y, gx, gy, bad)) return null;
    if (!this.navP || this.navG !== g0 || G.time - this.navAt > 0.4) {
      this.navAt = G.time; this.navG = g0; this.navP = null;
      const prev = new Int32Array(T.n).fill(-1), q = [s0]; prev[s0] = s0; let found = false;
      for (let h = 0; h < q.length && !found; h++) { const i = q[h], c = i % T.cols, r = (i / T.cols) | 0;
        for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const c2 = c + dc, r2 = r + dr; if (c2 < 0 || r2 < 0 || c2 >= T.cols || r2 >= T.rows) continue; const j = r2 * T.cols + c2; if (prev[j] >= 0) continue;
          if (j !== g0 && bad(j)) continue; if (dc && dr && (bad(r * T.cols + c2) || bad(r2 * T.cols + c))) continue; prev[j] = i; if (j === g0) { found = true; break; } q.push(j); } }
      if (!found) return null; const path = []; for (let i = g0; i !== s0; i = prev[i]) path.push(i); path.reverse(); this.navP = path;
    }
    const P = this.navP; if (!P || !P.length) return null;
    let k = P.findIndex(i => i === s0); k = k < 0 ? 0 : k + 1; let best = P[Math.min(k, P.length - 1)];
    for (let j = k; j < Math.min(P.length, k + 7); j++) { const px = Terrain.cx(T, P[j]), py = Terrain.cy(T, P[j]); if (this.clearWalk(G, m, m.x, m.y, px, py, bad)) best = P[j]; else break; }
    return [Terrain.cx(T, best), Terrain.cy(T, best)];
  }
  clearWalk(G, m, x0, y0, x1, y1, bad) { let ok = true; for (const o of [-12, 12]) { const l = hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / l * o, ny = (x1 - x0) / l * o; Terrain.forLine(G.T, x0 + nx, y0 + ny, x1 + nx, y1 + ny, i => { if (bad(i)) { ok = false; return false; } }); } return ok; }
  // ir a beber un elemento que hace falta (sin soltar los que también hacen falta)
  seek(G, m, el, keep = []) {
    let s = null, sd = 1e9; for (const q of G.sources) { if (q.cd > 0 || q.el !== el) continue; const d = hypot(q.x - m.x, q.y - m.y); if (d < sd) { sd = d; s = q; } }
    if (!s) return false;
    const ks = [0, 1].filter(k => !keep.includes(m.hands[k].el)); if (!ks.length) return false;
    const k = ks.sort((a, b) => m.hands[a].uses - m.hands[b].uses)[0]; this.goal = { s, k }; return true;
  }
  pickSource(G, m, f) {
    let best = null, bv = 0;
    for (const s of G.sources) {
      if (s.cd > 0) continue; const d = hypot(s.x - m.x, s.y - m.y); if (d > 420) continue;
      for (let k = 0; k < 2; k++) {
        const h = m.hands[k]; if (h.el === s.el || h.uses > 0) continue;
        const other = m.hands[1 - k].el; let v = 6 - d / 100;
        if (f && f.st.wet > 0 && s.el === 'bolt') v += 4;
        if (s.el === 'water' && other === 'bolt') v += 3;
        if (s.el === 'fire' && f && Terrain.burnable(G.T, Terrain.idx(G.T, f.x, f.y))) v += 2;
        if (other === s.el) v -= 3;
        if (v > bv) { bv = v; best = { s, k }; }
      }
    }
    if (best) this.goal = best;
  }
  chooseCast(G, m, f) {
    const P = this.P, d = hypot(f.x - m.x, f.y - m.y), H = m.hands, opts = [];
    const vis = this.lineClear(G, m, f), wet = f.st.wet > 0, held = f.st.root > 0 || f.st.stun > 0 || f.st.frozen > 0;
    const incoming = this.threat(G, m);
    const ready = k => H[k].cd <= 0 && m.rec <= 0;
    const fm = hypot(f.vx, f.vy) / 230; // qué tanto se mueve el rival (0 quieto, 1 corriendo)
    const val = (S, el, lvl, fus) => {
      let dmg = S.dmg || 0, lo = 0, hi = 300, lead = 0, still = false, p = 0.6;
      switch (S.kind) {
        case 'proj': hi = S.speed * S.life * (S.bounce ? 0.75 : S.gust ? 0.9 : 0.7); lo = 40; if (S.gust && incoming) dmg += 12; lead = d / S.speed * 0.6; if (S.boom) dmg += S.boom.dmg * 0.7; p = clamp(1.15 - d / S.speed * 1.4 * (0.4 + fm * 0.6) - (S.r < 12 ? 0.1 : 0), 0.15, 0.9); if (!vis && !S.bounce) p *= 0.2; if (S.burn || el === 'fire') dmg += 4; break;
        case 'cone': case 'frost': hi = S.range * 0.9; p = 0.85; if (S.kind === 'frost' && wet) dmg += 12; if (S.kind === 'cone' && incoming) dmg += 10; break;
        case 'wave': hi = S.range * 0.95; p = 0.7; break;
        case 'vortex': hi = 520; lo = 90; dmg = S.dps * 1.6; p = 0.3; break;
        case 'firenado': hi = 600; lo = 60; dmg = S.dps * 1.8; p = 0.5; break;
        case 'wall': dmg = incoming || (f.holding && d > 220) ? 10 : 0; p = 1; hi = 9999; break;
        case 'lob': hi = S.range; lo = 70; dmg = S.dmg + (f.st.root > 0 ? 0 : 7); p = 0.4 + (held ? 0.4 : 0) - fm * 0.15; break;
        case 'meteor': hi = S.range; lo = 80; lead = S.flight * 0.6; dmg = S.dmg + 14; p = held ? 0.9 : 0.45; break;
        case 'mud': hi = S.range; lo = 60; dmg = 14; p = 0.55; break;
        case 'vine': hi = S.range * 0.9; dmg = 14; p = 0.5; break;
        case 'zap': hi = S.range; dmg = S.dmg * (wet ? 1.6 : 1); p = vis ? 0.9 : 0; break;
        case 'strike': hi = S.range * 1.05; lo = 60; dmg = S.dmg * (wet ? 1.6 : 1); p = held ? 0.95 : 0.5 - fm * 0.2; break;
        case 'cloud': dmg = m.hp < m.maxHp * 0.5 ? 12 : 4; p = 1; hi = 300; break;
        case 'mines': dmg = d < 260 ? 16 : 3; p = 0.6; hi = 9999; break;
        case 'beam': hi = S.len * 0.9; lo = 120; dmg = S.dmg; p = (vis ? 0.65 : 0.05) * (held ? 1.4 : 1); still = true; break;
        case 'bloom': dmg = m.hp < m.maxHp * 0.6 && d > 230 ? 26 : 0; p = 1; hi = 9999; break;
        case 'storm': hi = S.range + 40; lo = 60; dmg = 18; p = 0.6; break;
        case 'sand': dmg = d < 190 ? 14 : 0; p = 1; hi = 9999; break;
        case 'petals': hi = 650; lo = 90; dmg = S.dmg * S.n; p = 0.6; break;
        case 'roots': hi = S.range; lo = 50; dmg = S.dmg + 8; p = vis ? 0.6 : 0.1; break;
        case 'magnet': hi = S.range + 30; lo = 70; dmg = 16; p = 0.65; break;
        case 'turret': hi = S.range + 80; lo = 60; dmg = 20; p = 0.7; break;
        case 'sunray': hi = S.len * 0.85; dmg = S.dmg + 2; p = vis ? 0.75 : 0.2; break;
        case 'blink': hi = S.range + 60; dmg = S.dmg + 6; p = m.hp > m.maxHp * 0.3 ? 0.75 : 0.3; break;
        case 'nova': dmg = d < S.r * 0.85 ? S.dmg + 8 : 0; p = 0.9; hi = 9999; still = true; break;
        case 'prism': hi = S.len * 0.8; dmg = S.dmg * (d < 200 ? 2 : 1.3) * (wet ? 1.5 : 1); p = vis ? 0.75 : 0.05; break;
        case 'mirage': dmg = incoming || m.hp < m.maxHp * 0.6 ? 14 : 5; p = 1; hi = 9999; break;
        case 'cage': hi = S.range; lo = 60; dmg = 16 + (held ? 10 : 0); p = 0.55; break;
        case 'sunflower': hi = S.range + 120; lo = 60; dmg = 18 + (m.hp < m.maxHp * 0.6 ? 8 : 0); p = 0.7; break;
        case 'judgment': hi = S.range; lo = 40; dmg = S.dmg; p = held ? 0.95 : 0.55 - fm * 0.25; break;
        case 'eclipse': hi = S.range + 60; lo = 40; dmg = 20 + (f.holding ? 8 : 0); p = 0.6; break;
        case 'wisps': dmg = d < 260 ? 18 : 8; p = 0.9; hi = 9999; break;
        case 'bog': hi = S.range; lo = 50; dmg = 16 + (m.hp < m.maxHp * 0.7 ? 6 : 0); p = 0.55; break;
        case 'crows': hi = 650; lo = 80; dmg = S.dmg * S.n; p = 0.6; break;
        case 'pit': hi = S.range; lo = 60; dmg = held ? 22 : 10; p = held ? 0.9 : 0.4; break;
        case 'thorns': dmg = d < 190 ? 14 : 2; p = 1; hi = 9999; break;
        case 'blackbolt': hi = S.range; dmg = S.dmg + 6; p = vis ? 0.9 : 0; break;
      }
      if (d > hi || d < lo) p *= 0.08;
      if (held && (lvl === 2 || fus)) dmg *= 1.3;
      return { v: dmg * clamp(p, 0, 1), lead, still };
    };
    for (let k = 0; k < 2; k++) {
      if (!ready(k) || this.fuseOnly) continue; const el = H[k].el;
      const S0 = SPELLS[el][0], S1 = SPELLS[el][1];
      const q = val(S0, el, 1, false); opts.push({ keys: [k], hold: 0.06, v: q.v - S0.cd * 1.2, lead: q.lead, still: q.still });
      const c = val(S1, el, 2, false); opts.push({ keys: [k], hold: HOLD_FULL + 0.06, v: c.v * 0.85 - S1.cd * 1.2 - (d < 160 ? 4 : 0), lead: c.lead, still: c.still });
    }
    if (ready(0) && ready(1)) {
      let S, fus = true; if (H[0].el === H[1].el) S = SPELLS[H[0].el][1]; else S = FUSIONS[fuseKey(H[0].el, H[1].el)];
      const q = val(S, null, 2, fus); opts.push({ keys: [0, 1], hold: 0.12, v: q.v * (m.emb >= 100 ? 1.6 : 1) - S.cd * 0.8, lead: q.lead, still: q.still });
    }
    if (!opts.length) return;
    if (this.prefer && opts.some(o => o.keys.some(k => H[k].el === this.prefer))) for (const o of opts) { const els = o.keys.map(k => H[k].el); if (els.includes(this.prefer)) o.v = o.v * 2.2 + 8; else o.v *= 0.5; }
    if (this.fuseOnly) for (const o of opts) o.v = d < this.fuseR + 30 ? Math.max(o.v, 14) : 0;
    opts.forEach(o => (o.v += G.rng() * (3 + (2 - this.lv) * 3)));
    opts.sort((a, b) => b.v - a.v);
    const o = opts[0]; if (o.v < 1) { this.castT = 0.2; return; }
    this.plan = { keys: o.keys, hold: o.hold, t: 0, lead: o.lead, jit: (G.rng() - 0.5) * 2 * P.jit, still: o.still };
  }
  lineClear(G, m, f) { let ok = true; Terrain.forLine(G.T, m.x, m.y, f.x, f.y, i => { if (Terrain.solid(G.T, i)) { ok = false; return false; } }); return ok; }
}
