/* =========================================================================
   OBJETOS Y ESPECIALES — cajas en la pista con ruleta según el puesto
   (mejores objetos cuanto más atrás), proyectiles y trampas en coordenadas
   de pista, escudo, imán, niebla, rayo; y la especial de cada piloto que se
   lanza con el botón de objeto cuando la barra Esmeralda está llena.
   ========================================================================= */
const ITEMS = {
  rocket: { name: 'Cohete' }, rocket3: { name: 'Tres cohetes' }, wasp: { name: 'Avispa' }, oil: { name: 'Aceite' },
  coco: { name: 'Cocos' }, shield: { name: 'Escudo' }, chile: { name: 'Chile picante' }, magnet: { name: 'Imán' },
  fog: { name: 'Niebla' }, emerald: { name: 'Esmeralda' }, bolt: { name: 'Rayo' },
};
// pesos por puesto: p = 0 (primero) … 1 (último)
const ITEM_W = {
  rocket: p => 10, rocket3: p => p > 0.25 ? 6 : 1, wasp: p => p > 0.45 ? 5 * p : 0, oil: p => 10 * (1 - p) + 2, coco: p => 7 * (1 - p) + 1,
  shield: p => 6, chile: p => 2 + 9 * p, magnet: p => p > 0.3 ? 7 * p : 0, fog: p => 6 * (1 - p) + 1, emerald: p => 3 + 3 * p, bolt: p => p > 0.8 ? 2.2 : 0,
};
const SPECIALS = {
  cumbia: { name: 'CARNAVAL', col: '#ff3d6e', desc: 'Turbo largo de comparsa: nadie te toca y empujas a quien se cruce.' },
  salsa: { name: 'VUELTA', col: '#ff7a1a', desc: 'Salto alto con turbo; las piruetas valen doble un rato.' },
  taiko: { name: 'TAMBOR', col: '#e8202a', desc: 'Golpe de tambor: una onda tumba a los de cerca y borra trampas.' },
  freestyle: { name: 'BATALLA', col: '#7a3cff', desc: 'Estallido de sonido hacia adelante que hace girar a los de enfrente.' },
  country: { name: 'ESTAMPIDA', col: '#c88a3a', desc: 'Embestida pesada: arrollas y nada te frena.' },
  reggae: { name: 'MAREJADA', col: '#1aa34a', desc: 'Ola que te impulsa y deja charcos resbalosos atrás.' },
  flamenco: { name: 'VUELO ALTO', col: '#d4142a', desc: 'Salta y planea con alas en cualquier parte, intocable.' },
  samba: { name: 'PIES DE FUEGO', col: '#ffd400', desc: 'Turbo con estela de fuego que hace girar a quien la pise.' },
};
const Items = {
  roll(R, car) {
    const n = R.cars.length, p = n > 1 ? (car.place - 1) / (n - 1) : 0.5; let tot = 0; const w = {}, RW = R.rules && R.rules.itemW;
    for (const k in ITEM_W) { w[k] = RW ? RW[k] || 0 : Math.max(0, ITEM_W[k](p)); tot += w[k]; }
    let r = Math.random() * tot; for (const k in w) { r -= w[k]; if (r <= 0) return k; } return 'rocket';
  },
  // ---- cada paso: cajas, proyectiles y trampas ----
  step(R, dt) {
    const T = R.track;
    for (const b of R.boxes) if (b.gone > 0) b.gone = Math.max(0, b.gone - dt);
    for (const c of R.cars) {
      if (c.respawnT > 0 || c.out) continue;
      if (c.shieldT > 0) c.shieldT -= dt; if (c.magnetT > 0) c.magnetT -= dt; if (c.invT > 0) c.invT -= dt; if (c.specT > 0) c.specT -= dt; if (c.fogT > 0) c.fogT -= dt;
      if (c.rollT > 0) { c.rollT -= dt; if (c.rollT <= 0) R.events.push({ type: 'itemGot', car: c.idx, item: c.item }); }
      // caja
      if (!c.item && !(c.rollT > 0)) for (const b of R.boxes) if (!(b.gone > 0) && Math.abs(T.wrap(c.s - b.s + T.L / 2) - T.L / 2) < 2.2 && Math.abs(c.u - b.u) < 2.2 && c.h - T.groundH(b.s, b.u) < 3.5) {
        b.gone = 2.5; c.item = Items.roll(R, c); c.itemN = c.item === 'chile' ? 3 : c.item === 'rocket3' ? 3 : c.item === 'coco' ? 3 : 1; c.rollT = 0.9; R.events.push({ type: 'box', car: c.idx, s: b.s, u: b.u }); break;
      }
      // imán: jalar hacia el de adelante
      if (c.magnetT > 0) { const tg = Items.ahead(R, c, 160); if (tg) { c.u = lerp(c.u, tg.u, 1 - Math.exp(-2.5 * dt)); if (c.f < tg.f + 14) c.vs += 26 * dt; } }
      // especiales con efecto continuo
      if (c.specT > 0 && c.pid === 'samba' && c.grounded && (c._fireD = (c._fireD || 0) + c.f * dt) > 2.4) { c._fireD = 0; R.hz.push({ k: 'fire', s: c.s, u: c.u, h: 0, life: 3, owner: c.idx, r: 1.7 }); }
      if (c.specT > 0 && c.pid === 'country') for (const o of R.cars) { if (o === c || o.respawnT > 0) continue; const ds = T.wrap(o.s - c.s + T.L / 2) - T.L / 2; if (Math.abs(ds) < 3.4 && Math.abs(o.u - c.u) < 2.4) Items.hit(R, o, 'stampede', c); }
    }
    // proyectiles y trampas
    for (let i = R.hz.length - 1; i >= 0; i--) {
      const z = R.hz[i]; z.life -= dt; z.age = (z.age || 0) + dt;
      if (z.k === 'rocket' || z.k === 'wasp') {
        if (z.k === 'wasp') { const tg = z.target === 'boss' ? R.boss : R.cars[z.target]; if (tg && !tg.finished && !tg.out) { const d = T.wrap(tg.s - z.s); z.vs = Math.min(85, Math.max(tg.f + 20, 50)); z.u = lerp(z.u, tg.u, 1 - Math.exp(-(d < 40 ? 6 : 2) * dt)); z.h = lerp(z.h, tg.h + (tg.isBoss ? 2 : 1), 1 - Math.exp(-4 * dt)); } }
        else if (T.zone(z.s, 'air')) { const tg = Items.ahead(R, R.cars[z.owner], 60); if (tg) { z.u = lerp(z.u, tg.u, 1 - Math.exp(-1.2 * dt)); z.h = lerp(z.h, tg.h, 1 - Math.exp(-1.2 * dt)); } }
        else { z.h = Math.max(T.groundH(z.s, z.u) + 0.7, z.h - 4 * dt); if (R.rules && R.rules.homing && z.vs > 0) { const tg = Items.ahead(R, R.cars[z.owner] || R.cars[0], 999); if (tg && T.wrap(tg.s - z.s) < 30) z.u = lerp(z.u, tg.u, 1 - Math.exp(-3 * dt)); } }
        // Persecución: los cohetes buscan al jefe (también arriba, al cóndor)
        if (R.boss && !R.boss.out && z.vs > 0 && z.k === 'rocket') { const B = R.boss, d = T.wrap(B.s - z.s); if (d < 90 && d > -B.len / 2) { const k = 1 - Math.exp(-(d < 40 ? 4.5 : 2.2) * dt); z.u = lerp(z.u, B.u, k); z.h = lerp(z.h, B.h + 1.6, k); } }
        z.s = T.wrap(z.s + z.vs * dt); z.u += (z.vu || 0) * dt;
        if (R.boss && Boss.projectile(R, z)) { R.hz.splice(i, 1); continue; }
        if (R.rules && R.rules.shootPick && R.bz && Challenge.shootPick(R, z)) { R.events.push({ type: 'boom', k: 'mask', s: z.s, u: z.u, h: z.h }); R.hz.splice(i, 1); continue; }
        const lim = T.limits(z.s); if (Math.abs(z.u) > lim.wall - 0.6) { if (T.zone(z.s, 'water') && !z.bounced) { z.vu = -(z.vu || 0) - Math.sign(z.u) * 3; z.u = Math.sign(z.u) * (lim.wall - 0.7); z.bounced = 1; } else z.life = 0; }
      } else if (z.k === 'coco') { z.bounceT = (z.bounceT || 0) + dt; z.h = Math.abs(Math.sin(z.bounceT * 5)) * 1.2 * Math.max(0, 1 - z.age / 3) + T.groundH(z.s, z.u); if (z.vs) { z.s = T.wrap(z.s + z.vs * dt); z.vs *= Math.exp(-1.5 * dt); } }
      else if (z.k === 'oil' || z.k === 'fog' || z.k === 'fire') z.h = T.groundH(z.s, z.u);
      // golpear a los bólidos
      if (z.k !== 'fog') for (const c of R.cars) {
        if (c.respawnT > 0 || c.out || (c.idx === z.owner && z.age < (z.k === 'fire' ? 99 : 0.6))) continue;
        const ds = T.wrap(c.s - z.s + T.L / 2) - T.L / 2, rr = z.r || (z.k === 'oil' ? 2.1 : z.k === 'coco' ? 1.5 : 1.6);
        if (Math.abs(ds) < rr + 1 && Math.abs(c.u - z.u) < rr + 0.6 && Math.abs(c.h - z.h) < 2.4) {
          if (z.k === 'wasp' && z.target === c.idx && c.hopT > 0) { R.events.push({ type: 'dodge', car: c.idx }); z.life = 0; break; }
          if (z.k === 'wasp' && z.target !== c.idx) continue;
          Items.hit(R, c, z.k, R.cars[z.owner]); if (z.k !== 'fire') { z.life = 0; R.events.push({ type: 'boom', k: z.k, s: z.s, u: z.u, h: z.h }); break; }
        }
      } else for (const c of R.cars) { const ds = T.wrap(c.s - z.s + T.L / 2) - T.L / 2; if (Math.abs(ds) < 10 && Math.abs(c.u - z.u) < 9) c.fogT = 0.4; }
      if (z.life <= 0) R.hz.splice(i, 1);
    }
  },
  ahead(R, c, maxD) { let best = null, bd = maxD; for (const o of (R.boss && !R.boss.out ? R.cars.concat([R.boss]) : R.cars)) { if (o === c || o.respawnT > 0 || o.out) continue; const d = T_wrapAhead(R.track, c, o); if (d > 2 && d < bd) { bd = d; best = o; } } return best; },
  behind(R, c, maxD) { let best = null, bd = maxD; for (const o of R.cars) { if (o === c || o.out) continue; const d = T_wrapAhead(R.track, o, c); if (d > 2 && d < bd) { bd = d; best = o; } } return best; },
  // ---- golpe: trompo, se pierde velocidad; el escudo lo para ----
  hit(R, c, kind, by) {
    if (c.invT > 0 || (c.specT > 0 && (c.pid === 'country' || c.pid === 'cumbia'))) return;
    if (c.shieldT > 0) { c.shieldT = 0; R.events.push({ type: 'shieldPop', car: c.idx }); c.invT = 0.5; return; }
    const strong = kind === 'bolt' || kind === 'blast' || kind === 'stampede';
    c.vs *= kind === 'oil' ? 0.6 : 0.45; c.vu *= 0.4; c.spinT = kind === 'oil' ? 0.75 : 0.9; c.boostT = 0; c.boostK = 1; c.drift.on = false; c.drift.lv = 0; c.invT = strong ? 1.6 : 1.2; c.magnetT = 0;
    if (!c.grounded && T_zoneAir(R.track, c)) c.vn = Math.min(c.vn, -3);
    c.stats.hits = (c.stats.hits || 0) + 1; if (by && by !== c) by.stats.hitsDone = (by.stats.hitsDone || 0) + 1;
    R.events.push({ type: 'hit', car: c.idx, by: by ? by.idx : -1, kind });
    if (R.rules && R.rules.onHit) R.rules.onHit(R, c, kind, by);
  },
  // ---- usar el objeto (o la especial si no hay objeto y la barra está llena) ----
  use(R, c, inp) {
    const T = R.track;
    if (c.rollT > 0) return;
    if (!c.item) { if (c.gem >= 4) Items.special(R, c); return; }
    const k = c.item, back = inp && inp.down, fwd = inp && inp.up;
    const spawn = (kk, o) => R.hz.push(Object.assign({ k: kk, s: c.s, u: c.u, h: c.h + 0.6, life: 25, owner: c.idx }, o));
    const dir = Math.cos(c.a) < -0.3 ? -1 : 1; // en la arena se puede ir al revés: dispara hacia donde mira
    if (k === 'rocket' || k === 'rocket3') {
      if (back) spawn('rocket', { s: T.wrap(c.s - 3 * dir), vs: -dir * Math.max(30, c.f - 30), life: 3 });
      else if (k === 'rocket3' && c.itemN === 3) { for (const du of [-1, 0, 1]) spawn('rocket', { s: T.wrap(c.s + 3 * dir), vs: dir * (c.f + 38), vu: du * 5, life: 3 }); c.itemN = 1; }
      else spawn('rocket', { s: T.wrap(c.s + 3 * dir), vs: dir * (c.f + 38), life: 3 });
    } else if (k === 'wasp') { const tg = R.boss && !R.boss.out ? R.boss : Items.ahead(R, c, 1e9) || R.order[0]; if (tg && tg !== c) spawn('wasp', { s: T.wrap(c.s + 3), vs: c.f + 20, target: tg.isBoss ? 'boss' : tg.idx, life: 12, h: c.h + 2 }); }
    else if (k === 'oil') { if (fwd) spawn('oil', { s: T.wrap(c.s + 18), h: 0 }); else spawn('oil', { s: T.wrap(c.s - 4), h: 0 }); }
    else if (k === 'coco') spawn('coco', { s: T.wrap(c.s - 4), u: c.u + (Math.random() - 0.5) * 3, vs: fwd ? c.f + 10 : 0 });
    else if (k === 'shield') c.shieldT = 12;
    else if (k === 'chile') c.boost(1.1, 1.1);
    else if (k === 'magnet') c.magnetT = 2.6;
    else if (k === 'fog') spawn('fog', { s: T.wrap(c.s - 6), life: 9 });
    else if (k === 'emerald') c.addGem(4);
    else if (k === 'bolt') { for (const o of R.cars) if (o !== c && !o.out && o.progress > c.progress && !(R.boss && !o.bot)) Items.hit(R, o, 'bolt', c); if (R.boss) Boss.damage(R, R.boss, 14, c, 'bolt'); R.events.push({ type: 'bolt', car: c.idx }); }
    R.events.push({ type: 'itemUse', car: c.idx, item: k, back });
    c.itemN--; if (c.itemN <= 0) { c.item = null; c.itemN = 0; }
  },
  special(R, c) {
    const T = R.track; c.gem = 0; c.specT = 0; R.events.push({ type: 'special', car: c.idx, pid: c.pid });
    switch (c.pid) {
      case 'cumbia': c.boost(2.4, 1.12); c.specT = 2.6; break; // Carnaval: turbo largo, intocable, empuja a quien toque
      case 'salsa': c.boost(1.2, 1.06); if (c.grounded) { c.vn = 11; c.takeoff('special'); } c.specT = 3; c.trickK2 = 2; break; // Vuelta: salto alto, piruetas dobles
      case 'taiko': for (const o of R.cars) { if (o === c) continue; const ds = T.wrap(o.s - c.s + T.L / 2) - T.L / 2; if (Math.hypot(ds, o.u - c.u) < 22) { Items.hit(R, o, 'blast', c); o.u += Math.sign(o.u - c.u || 1) * 2.5; } }
        for (let i = R.hz.length - 1; i >= 0; i--) { const z = R.hz[i]; if (Math.abs(T.wrap(z.s - c.s + T.L / 2) - T.L / 2) < 26) R.hz.splice(i, 1); } c.boost(0.8); break; // Tambor
      case 'freestyle': for (const o of R.cars) { if (o === c) continue; const d = T.wrap(o.s - c.s); if (d > 0 && d < 55 && Math.abs(o.u - c.u) < 6 + d * 0.12) Items.hit(R, o, 'blast', c); } c.boost(1, 1.08); break; // Batalla
      case 'country': c.specT = 3.2; c.boost(3.2, 1.08); break; // Estampida
      case 'reggae': c.boost(2.2, 1.1); for (const du of [-4, 0, 4]) R.hz.push({ k: 'oil', s: T.wrap(c.s - 8), u: c.u + du, h: 0, life: 10, owner: c.idx, wave: 1 }); break; // Marejada
      case 'flamenco': c.boost(2.5, 1.12); c.invT = 2.5; if (c.grounded) { c.vn = 14; c.takeoff('special'); } c.specT = 2.5; break; // Vuelo alto
      case 'samba': c.specT = 3.2; c.boost(3.2, 1.06); break; // Pies de fuego
    }
    if (R.rules && R.rules.onSpecial) R.rules.onSpecial(R, c);
  },
};
const T_wrapAhead = (T, from, to) => T.wrap(to.s - from.s); // distancia por delante dentro de la vuelta
const T_zoneAir = (T, c) => !!T.zone(c.s, 'air');
