/* =========================================================================
   RETOS ÚNICOS DE LA VUELTA AL MUNDO — piezas que se enchufan a las reglas:
   · Recolección (en equipo suman): tunjos de oro en El Dorado, máscaras del
     carnaval en Venecia (también se rompen a cohetazos).
   · Río de troncos (Amazonas): la corriente arrastra troncos por el río.
   · Tormenta de arena (Egipto): una pared de arena persigue la carrera.
   · La tierra tiembla (Islandia): brotan géiseres por toda la pista.
   · Duelo contra un campeón: un rival de élite con aura que hay que vencer.
   ========================================================================= */
const Challenge = {
  bad(T, s) { return !!(T.zone(T.wrap(s), 'gap')); },
  // objetos para recoger: en el piso, en el agua y a la altura del vuelo; reaparecen para la vuelta siguiente
  picks(R, style, gap) {
    const T = R.track; R.bz = R.bz || []; let side = 1;
    for (let s = 60; s < T.L - 30; s += gap * (0.75 + Math.random() * 0.5)) {
      if (Challenge.bad(T, s)) continue; const lim = T.limits(s), air = T.zone(s, 'air'), water = T.zone(s, 'water');
      const rm = air ? lim.wall - 4 : water ? lim.wall - 2.5 : lim.road - 1.4; side = -side;
      const u = clamp(side * (0.25 + Math.random() * 0.75) * rm, -rm, rm);
      R.bz.push({ k: 'pick', style, s, u, h: 1.3, air: !!air, ah: 3 + Math.random() * 5, life: 1e9, age: Math.random() * 6, gone: 0 });
    }
  },
  pickStep(R, z, dt) {
    const T = R.track; if (z.gone > 0) { z.gone -= dt; return; }
    z.h = z.air ? z.ah + Math.sin(z.age * 2) * 0.4 : T.groundH(z.s, z.u) + 1.4 + Math.sin(z.age * 3) * 0.2;
    for (const c of R.cars) { if (c.bot || c.out || c.respawnT > 0) continue; const ds = T.wrap(c.s - z.s + T.L / 2) - T.L / 2;
      if (Math.abs(ds) < 2.9 && Math.abs(c.u - z.u) < 2.7 && Math.abs(c.h - z.h) < 3.2) { Challenge.takePick(R, z, c); break; } }
  },
  takePick(R, z, c) { z.gone = 32; R.events.push({ type: 'pickGot', car: c.idx, s: z.s, u: z.u, h: z.h, style: z.style }); if (z.style === 'mascara') c.addGem(0.15); },
  // cohetes y avispas también rompen las máscaras
  shootPick(R, p) { const T = R.track; for (const z of R.bz) { if (z.k !== 'pick' || z.gone > 0) continue; const ds = T.wrap(p.s - z.s + T.L / 2) - T.L / 2; if (Math.abs(ds) < 2.2 && Math.abs(p.u - z.u) < 2.2 && Math.abs(p.h - z.h) < 2.6) { const c = R.cars[p.owner]; if (c && !c.bot) { Challenge.takePick(R, z, c); return true; } } } return false; },
  // troncos que bajan por el río (se mueven con la corriente, giran y vuelven a entrar al río)
  logs(R, every = 26) {
    const T = R.track; R.bz = R.bz || [];
    for (const zw of T.zones.filter(z => z.type === 'water')) { const len = T.wrap(zw.s1 - zw.s0);
      for (let d = 40; d < len - 20; d += every * (0.7 + Math.random() * 0.6)) { const s = T.wrap(zw.s0 + d), rm = T.limits(s).wall - 3; R.bz.push({ k: 'tronco', s, u: (Math.random() * 2 - 1) * rm, h: 0, yaw: (Math.random() - 0.5) * 1.6, spin: (Math.random() - 0.5) * 0.5, vs: 3 + Math.random() * 3, vu: (Math.random() - 0.5) * 1.2, len: 5.5 + Math.random() * 2, life: 1e9, age: Math.random() * 5, zs0: zw.s0, zlen: len }); } }
  },
  logStep(R, z, dt) {
    const T = R.track; let d = T.wrap(z.s - z.zs0) + z.vs * dt; if (d > z.zlen - 15) { d = 25; z.u = (Math.random() * 2 - 1) * (T.limits(T.wrap(z.zs0 + d)).wall - 3); }
    z.s = T.wrap(z.zs0 + d); const rm = T.limits(z.s).wall - 2.5; z.u += z.vu * dt; if (Math.abs(z.u) > rm) { z.u = Math.sign(z.u) * rm; z.vu = -z.vu; } z.yaw += z.spin * dt; z.h = T.groundH(z.s, z.u) - 0.15; z.hitT = Math.max(0, (z.hitT || 0) - dt);
    // choque: el bólido contra el tronco (segmento inclinado)
    for (const c of R.cars) { if (c.respawnT > 0 || c.out || c.invT > 0 || z.hitT > 0 || c.h - z.h > 1.8) continue; const ds = T.wrap(c.s - z.s + T.L / 2) - T.L / 2, du = c.u - z.u; if (Math.abs(ds) > z.len) continue;
      const ca = Math.cos(z.yaw), sa = Math.sin(z.yaw), along = clamp(ds * ca + du * sa, -z.len / 2, z.len / 2), ex = ds - along * ca, eu = du - along * sa;
      if (ex * ex + eu * eu < 1.7 * 1.7) { Items.hit(R, c, 'blast', null); z.hitT = 0.8; z.vu += Math.sign(eu || 1) * -1.5; if (!c.bot) { c.logHits = (c.logHits || 0) + 1; R.events.push({ type: 'logHit', car: c.idx, s: z.s, u: z.u }); } } }
  },
  // tormenta de arena: una pared que avanza cada vez más rápido; si alcanza a alguien lo traga un momento
  storm(R) { R.storm = { d: -120, v: 30, slowT: 0 }; },
  stormStep(R, dt) {
    const S = R.storm, T = R.track; if (!S || R.state !== 'race') return;
    const hum = R.cars.filter(c => !c.bot && !c.finished), tail = hum.length ? Math.min(...hum.map(c => Boss.dist(R, c))) : S.d + 100;
    const gap = tail - S.d; let v = Math.max(20, 52 + Math.min(10, R.time * 0.25) + (gap - 38) * 0.5); /* siempre amenaza: se mantiene a unos 50 m y en las curvas cerradas se acerca */
    { let kk = 0; for (let j = 0; j < 40; j += 5) kk = Math.max(kk, Math.abs(T.at(S.d + j).kap)); if (kk > 1e-4) v = Math.min(v, Math.sqrt(34 / kk) + 14); } if (S.slowT > 0) { S.slowT -= dt; v *= 0.55; } S.v = damp(S.v, v, 1.5, dt); S.d += S.v * dt;
    for (const c of R.cars) { if (c.finished || c.respawnT > 0) continue; const gap = Boss.dist(R, c) - S.d; c.sandK = clamp(1 - gap / 70, 0, 1); c.stormImm = Math.max(0, (c.stormImm || 0) - dt);
      if (c.stormBoostT > 0 && (c.stormBoostT -= dt) <= 0) { c.boost(1.2, 1.06); if (!c.bot) R.events.push({ type: 'stormFree', car: c.idx }); }
      if (gap < 2 && c.stormImm <= 0) { c.stormImm = 5; c.vs *= 0.45; c.fogT = 1.4; c.stormBoostT = 1.4; S.slowT = 2.6; if (!c.bot) { c.stormN = (c.stormN || 0) + 1; R.events.push({ type: 'stormCatch', car: c.idx }); } } }
  },
  // géiseres nuevos por la pista (en tierra), cada uno con su ritmo
  geysers(R, every = 110) {
    const T = R.track; R.xGeysers = [];
    for (let s = 120; s < T.L - 60; s += every * (0.75 + Math.random() * 0.5)) { if (T.zone(s, 'air') || T.zone(s, 'gap') || T.zone(s, 'water') || T.zone(s, 'town') || T.ramps.some(r => Math.abs(T.wrap(r.s - s + T.L / 2) - T.L / 2) < 45)) continue;
      const rm = T.limits(s).road - 2.5; R.xGeysers.push({ s, u: (Math.random() * 2 - 1) * rm, r: 3, period: 2.4 + Math.random() * 1.2, on: 1.1, ph: Math.random() * 3 }); }
    R.allGeysers = T.geysers.concat(R.xGeysers);
  },
  // campeón: un rival de élite (más rápido, usa objetos, con aura) que hay que vencer
  champion(R, pid, sk = 0.55) { const c = R.cars.find(o => o.bot && o.pid === pid) || R.cars.find(o => o.bot); if (!c) return null; c.elite = true;
    c.vmax *= botVmaxK(sk) / botVmaxK(c.bot.skill) / c.bot.pace; c.bot.skill = sk; c.bot.level = 1; c.bot.pace = 1; c.bot.mistK = lerp(1.6, 0.45, sk) * 0.8; return c; },
  // la máquina y el piloto automático: ir por los objetos, esquivar troncos y arena, buscar géiseres
  steer(R, c, uT) {
    const T = R.track, lim = T.limits(c.s).wall - 2.0, obs = []; let want = uT, best = 70;
    for (const z of R.bz || []) { const d = T.wrap(z.s - c.s); if (d < 1 || d > 65) continue;
      if (z.k === 'pick' && !(z.gone > 0) && !c.bot) { if (d < best && Math.abs(z.u - c.u) < 10 + d * 0.15) { best = d; want = z.u; } }
      else if (z.k === 'tronco') obs.push({ u: z.u, r: Math.abs(Math.sin(z.yaw)) * z.len / 2 + 1.2 }); }
    for (const g of R.xGeysers || []) { const d = T.wrap(g.s - c.s); if (d > 6 && d < 60 && !c.bot && d < best) { best = d; want = g.u; } }
    want = clamp(want, -lim, lim); const clear = u => obs.every(o => Math.abs(u - o.u) >= o.r + 1.6); if (!obs.length || clear(want)) return want;
    let b = want, bd = 1e9; for (const u0 of [want, ...obs.flatMap(o => [o.u - o.r - 2, o.u + o.r + 2])]) { const u = clamp(u0, -lim, lim); if (!clear(u)) continue; const dd = Math.abs(u - want) + Math.abs(u - c.u) * 0.5; if (dd < bd) { bd = dd; b = u; } } return b;
  },
};
