/* =========================================================================
   JEFES — la Persecución: un jefe gigante huye por la pista y hay que
   bajarle la vida antes de que cruce la meta dos veces.
   · El Tren de Oro (Gran Cañón): corre sobre un riel dorado que tiende solo;
     suelta barriles de pólvora y carbón ardiente; herido, desengancha vagones.
   · El Galeón de Vapor (Ha Long): navega y flota sobre vapor; cañonazos con
     aviso rojo, minas y, herido, andanadas y nubes de vapor.
   · El Cóndor de Hierro (Guatapé): vuela alto; lluvia de plumas de acero y
     picadas (después queda bajo: ¡embístelo!); herido, ventarrones.
   Daño: cohetes (lo persiguen), avispas, rayo, especiales y embestirlo con
   turbo. Al herirlo suelta botín (objetos y barra Esmeralda).
   ========================================================================= */
const BOSSES = {
  tren: { id: 'tren', name: 'El Tren de Oro', short: 'TREN', track: 'canon', col: '#ffc83a', hp: 86, speed: 45, laps: 2, loot: 'lingote',
    segs: [{ off: 0, len: 11, w: 3.4, hh: 4.8 }, { off: 12, len: 6, w: 3.2, hh: 3.4 }, { off: 19, len: 8, w: 3.4, hh: 3.6, wagon: 1 }, { off: 28, len: 8, w: 3.4, hh: 3.6, wagon: 2 }],
    atk: ['barrels', 'coal', 'barrels', 'coal'], atk2: ['barrels', 'wagon', 'coal', 'barrels', 'wagon'],
    intro: 'Un tren cargado de oro huye por el cañón', how: 'Dispárale y embístelo con turbo antes de que cruce la meta dos veces.' },
  galeon: { id: 'galeon', name: 'El Galeón de Vapor', short: 'GALEÓN', track: 'halong', col: '#62e0ff', hp: 112, speed: 44, laps: 2, loot: 'cofre',
    segs: [{ off: 0, len: 24, w: 6.6, hh: 9 }],
    atk: ['cannon', 'mines', 'cannon'], atk2: ['volley', 'cannon', 'mines', 'steam', 'volley'],
    intro: 'Un galeón pirata a vapor escapa entre las islas', how: 'Esquiva los círculos rojos: ahí caen las balas de cañón.' },
  condor: { id: 'condor', name: 'El Cóndor de Hierro', short: 'CÓNDOR', track: 'guatape', col: '#ff6a5a', hp: 112, speed: 46, laps: 2, loot: 'esmeralda', fly: 9,
    segs: [{ off: 0, len: 9, w: 7, hh: 3.2 }],
    atk: ['feathers', 'dive', 'feathers'], atk2: ['feathers', 'dive', 'gust', 'feathers', 'dive'],
    intro: 'Un cóndor mecánico sobrevuela el Peñol', how: 'Vuela alto: los cohetes lo alcanzan. Cuando baje en picada, ¡embístelo!' },
  // minijefes: una vuelta, menos vida y ataques propios
  dragon: { id: 'dragon', mini: true, name: 'El Dragón de Neón', short: 'DRAGÓN', track: 'tokio', col: '#ff3df0', hp: 84, speed: 46, laps: 1.5, loot: 'esmeralda', hover: 0.9, wave: true,
    segs: [{ off: 0, len: 5, w: 3.0, hh: 2.8 }].concat(Array.from({ length: 8 }, (_, i) => ({ off: 5.6 + i * 4.3, len: 4, w: 2.6 - i * 0.12, hh: 2.3 - i * 0.12 }))),
    atk: ['flames', 'orbs', 'flames'], atk2: ['flames', 'lightning', 'orbs', 'lightning'],
    intro: 'Un dragón de luces de neón serpentea por las autopistas', how: 'Zigzaguea: apúntale al cuerpo. Esquiva su fuego y las esferas que te persiguen.' },
  scarab: { id: 'scarab', mini: true, name: 'El Escarabajo Dorado', short: 'ESCARABAJO', track: 'egipto', col: '#ffcf3a', hp: 78, speed: 44, laps: 1.5, loot: 'lingote',
    segs: [{ off: 0, len: 9, w: 6, hh: 4.2 }],
    atk: ['sandballs', 'quicksand', 'sandballs'], atk2: ['sandballs', 'burrow', 'quicksand', 'burrow'],
    intro: 'Un escarabajo de oro gigante corre entre las pirámides', how: 'Esquiva sus bolas de arena y las arenas movedizas. Cuando se entierre y salga, ¡embístelo!' },
  golem: { id: 'golem', mini: true, name: 'El Gigante de Lava', short: 'GIGANTE', track: 'islandia', col: '#ff6a1a', hp: 92, speed: 43, laps: 1.5, loot: 'cofre',
    segs: [{ off: 0, len: 7, w: 5.4, hh: 10 }],
    atk: ['lavabombs', 'boulders', 'lavabombs'], atk2: ['lavabombs', 'stomp', 'boulders', 'stomp'],
    intro: 'Un gigante de roca y lava despertó bajo el volcán', how: 'Sal de los círculos rojos y esquiva las rocas. Cuando pisotee, ¡brinca con el derrape!' },
};
const BOSS_ORDER = ['tren', 'galeon', 'condor', 'dragon', 'scarab', 'golem'];
const BOSS_ATK_SUB = { cannon: 'sal de los círculos rojos', volley: 'sal de los círculos rojos', feathers: 'pasa por el hueco', dive: 'esquívalo… y luego embístelo', barrels: 'busca el hueco', wagon: 'esquívalo o dispárale', flames: 'pasa por el hueco entre las llamas', orbs: 'te persiguen: cambia de carril a último momento', lightning: 'sal de los círculos rojos', sandballs: 'busca el hueco', quicksand: 'no pises la arena: frena', burrow: 'cuando salga, ¡embístelo!', lavabombs: 'sal de los círculos rojos', boulders: 'busca el hueco', stomp: 'derrapa para brincar la onda' };
const BOSS_ATK_NAME = { flames: '¡FUEGO DE NEÓN!', orbs: '¡ESFERAS!', lightning: '¡RAYOS!', sandballs: '¡BOLAS DE ARENA!', quicksand: '¡ARENAS MOVEDIZAS!', burrow: '¡SE ENTIERRA!', lavabombs: '¡BOMBAS DE LAVA!', boulders: '¡ROCAS!', stomp: '¡PISOTÓN!', barrels: '¡BARRILES DE PÓLVORA!', coal: '¡CARBÓN ARDIENTE!', wagon: '¡VAGÓN SUELTO!', cannon: '¡CAÑONAZO!', mines: '¡MINAS!', volley: '¡ANDANADA!', steam: '¡NUBE DE VAPOR!', feathers: '¡PLUMAS DE ACERO!', dive: '¡PICADA!', gust: '¡VENTARRÓN!' };
const Boss = {
  create(R, def, diff = 1) {
    const T = R.track, n = Math.max(1, R.humans), k = Boss.dk(diff, [0.65, 0.8, 1.0]) * (n === 2 ? 1.6 : 1);
    const B = { isBoss: true, def, idx: -1, max: Math.round(def.hp * k), hp: 0, diff, d: 46, s: 0, u: 0, uT: 0, h: def.fly || 0, v: 0, f: 0, vs: 0, vu: 0, out: false, respawnT: 0, finished: false,
      phase: 1, hitT: 0, stunT: 0, atkT: 5, uTT: 3, lootAcc: 0, low: 0, dive: null, dying: 0, dead: false, escaped: false, hist: new Float32Array(800), hh: new Float32Array(800), head: 0, lastD: 46,
      segs: def.segs.map(g => Object.assign({ on: true }, g)), D: def.laps * T.L, wagons: 0, t: 0, s0: 46, endT: 0 };
    B.hp = B.max; B.w = Math.max(...def.segs.map(g => g.w)); B.len = Math.max(...def.segs.map(g => g.off + g.len));
    B.hist.fill(0); B.hh.fill(B.h); B.s = T.wrap(B.d - B.len / 2); R.boss = B; R.bz = []; return B;
  },
  // carril y altura de la cola a «back» metros detrás del frente (historial cada 0,5 m)
  trail(B, back) { const i = Math.min(799, Math.round(back / 0.5)), j = (B.head - i + 800) % 800; return [B.hist[j], B.hh[j]]; },
  /* dificultad continua 0–2 (la campaña sube de a poco): interpola la tabla fácil/normal/difícil */
  dk(d, tb) { d = clamp(d, -1, 2); if (d < 0) return lerp(tb[0], 2 * tb[0] - tb[1], -d); const i = Math.min(1, Math.floor(d)); return lerp(tb[i], tb[i + 1], d - i); }, /* por debajo de 0: aún más suave (los primeros jefes de la campaña) */
  segPos(B, g) { const back = g.off + g.len / 2, [u, h] = Boss.trail(B, back); return { s: B.d - back, u, h }; },
  railH(R, B, s) { const T = R.track, id = B.def.id, hv = B.def.hover || 0; if (B.def.fly) return null;
    if (T.zone(s, 'water')) return id === 'galeon' ? T.groundH(s, B.u) : id === 'tren' ? 1.0 : id === 'golem' ? T.groundH(s, B.u) - 1.2 : T.groundH(s, B.u) + 0.4 + hv;
    const za = T.zone(s, 'air') || T.zone(s, 'gap'); if (za) { if (id === 'galeon') return 2.2; if (id === 'tren') return 0.3; const p = clamp(T.wrap(s - za.s0) / Math.max(1, T.wrap(za.s1 - za.s0)), 0, 1); return 1 + hv + 9 * Math.sin(Math.PI * p); } // los que no vuelan saltan el abismo
    return T.rampH(s, B.u) + (id === 'galeon' ? 1.6 : hv); },
  dist(R, c) { const L = R.track.L; return c.lap * L + (c.lap === 0 && !c.half && c.s > L / 2 ? c.s - L : c.s); },
  step(R, dt) {
    const B = R.boss, T = R.track, def = B.def; if (!B) return; B.t += dt; B.hitT = Math.max(0, B.hitT - dt); B.stunT = Math.max(0, B.stunT - dt);
    const hum = R.cars.filter(c => !c.bot && !c.out), lead = hum.length ? Math.max(...hum.map(c => Boss.dist(R, c))) : B.d - 60, gap = B.d - B.len - lead;
    const racing = R.state === 'race' && !B.dying && !B.dead && !B.escaped;
    // velocidad: huye si lo alcanzan, espera si se quedan muy atrás (siempre se puede alcanzar)
    let vt = def.speed + (B.phase === 2 ? 3 : 0) + clamp((55 - gap) * 0.3, -20, 8); /* si te quedas lejos te espera: siempre se puede volver a tenerlo a tiro */
    if (gap > 150) vt = def.speed - 24;
    { let kk = 0; for (let j = 0; j < 36; j += 4) kk = Math.max(kk, Math.abs(T.at(B.d + j).kap)); if (kk > 1e-4) vt = Math.min(vt, Math.sqrt(30 / kk) + 5); } // en curvas cerradas frena como los demás
    // no se deja pasar: si lo alcanzan va tan rápido como el bólido (sin turbo); con turbo o rebufo sí se le llega
    const lc = hum.length ? hum.reduce((x, y) => Boss.dist(R, x) > Boss.dist(R, y) ? x : y) : null;
    if (lc && def.fly && gap < 90) vt = Math.max(vt, lc.f + clamp((32 - gap) * 0.35, -14, 16)); // el cóndor vuela: se mantiene por delante, a tiro de cohete
    else if (lc && gap < 30) vt = Math.max(vt, Math.min(lc.vmax * (gap < -4 ? 1.18 : 1), lc.f + (gap < -4 ? 9 : 1.5)));
    if (B.stunT > 0) vt *= 0.72;
    if (B.dive && B.dive.st !== 'climb') { const rel = hum.length ? Math.max(...hum.map(c => c.f)) : 40; vt = B.dive.st === 'warn' ? vt : B.dive.st === 'under' ? Math.max(vt, rel + 2) : Math.max(18, rel - (B.dive.st === 'low' ? 6 : 12)); } // bajo la arena no se deja pasar; al salir queda lento
    if (!racing) vt = B.dying || B.dead ? 0 : R.state === 'count' ? 0 : B.escaped ? def.speed + 20 : 0;
    B.v = damp(B.v, vt, B.dying ? 1.1 : 1.4, dt); if (B.v < 0.05 && (B.dying || B.dead)) B.v = 0;
    B.d += B.v * dt; B.s = T.wrap(B.d - B.len / 2); B.f = B.v; B.vs = B.v;
    // carril: cambia cada tanto, nunca contra la pared
    const sF = T.wrap(B.d), lim = T.limits(sF), room = Math.max(0, (T.zone(sF, 'water') || T.zone(sF, 'air') ? lim.wall - 1.5 : lim.road) - B.w / 2 - 0.4);
    if (racing && (B.uTT -= dt) <= 0) { B.uTT = 2.5 + Math.random() * 3.5; B.uT = (Math.random() * 2 - 1) * room * 0.8; }
    if (def.wave && racing) B.uT = Math.sin(B.t * 0.85) * room * 0.8; // el dragón serpentea
    if (B.dive && B.dive.st === 'swoop') B.uT = B.dive.u0 + (B.dive.u1 - B.dive.u0) * smooth(clamp(B.dive.t / 1.8, 0, 1));
    B.u = clamp(damp(B.u, clamp(B.uT, -room, room), B.dive ? 3 : 0.9, dt), -room, room);
    // altura: riel, agua o vuelo
    let ht = Boss.railH(R, B, sF);
    if (def.fly) { ht = def.fly + Math.sin(B.t * 0.7) * 1.4 + (T.zone(sF, 'air') ? 3 : 0); if (B.dive) ht = B.dive.st === 'warn' ? def.fly + 3 : B.dive.st === 'swoop' ? 1.5 : B.dive.st === 'low' ? 2.0 : def.fly; if (B.dying) ht = Math.max(0.5, B.h - 3 * dt); }
    if (B.dive && B.dive.kind === 'burrow' && B.dive.st === 'under') ht -= 6;
    B.h = damp(B.h, ht, def.fly ? (B.dive && B.dive.st === 'swoop' ? 4 : 1.6) : B.dive && B.dive.kind === 'burrow' ? 5 : 7, dt);
    // historial para la cola (vagones, riel)
    while (B.d - B.lastD >= 0.5) { B.lastD += 0.5; B.head = (B.head + 1) % 800; B.hist[B.head] = B.u; B.hh[B.head] = B.h; }
    if (R.state === 'count') { for (let k = 0; k < 800; k++) { B.hist[k] = B.u; B.hh[k] = B.h; } }
    // picada del cóndor
    if (B.dive && B.dive.kind === 'burrow') { const D = B.dive; D.t += dt; // escarabajo: se entierra, avanza bajo la arena y sale (queda aturdido)
      if (D.st === 'warn' && D.t > 0.8) { D.st = 'under'; D.t = 0; }
      else if (D.st === 'under' && D.t > 2.4) { D.st = 'low'; D.t = 0; B.low = 3.5; R.events.push({ type: 'bossLow' }); R.events.push({ type: 'boom', k: 'shell', s: T.wrap(B.d - B.len / 2), u: B.u, h: B.h + 1 }); for (const c of R.cars) { const ds = T.wrap(c.s - T.wrap(B.d - B.len / 2) + T.L / 2) - T.L / 2; if (Math.abs(ds) < 9 && Math.abs(c.u - B.u) < 5.5 && c.respawnT <= 0) Items.hit(R, c, 'blast', null); } }
      else if (D.st === 'low' && D.t > 3.5) { B.dive = null; B.low = 0; } }
    else if (B.dive) { const D = B.dive; D.t += dt;
      if (D.st === 'warn' && D.t > 0.9) { D.st = 'swoop'; D.t = 0; }
      else if (D.st === 'swoop' && D.t > 1.8) { D.st = 'low'; D.t = 0; B.low = 3.6; R.events.push({ type: 'bossLow' }); }
      else if (D.st === 'low' && D.t > 3.6) { D.st = 'climb'; D.t = 0; B.low = 0; }
      else if (D.st === 'climb' && D.t > 1.2) B.dive = null; }
    B.low = Math.max(0, B.low - dt);
    // botín: se le va cayendo (más si está herido): quien lo sigue de cerca recoge objetos
    if (racing && R.time > 3 && (B.dripT = (B.dripT == null ? 6 : B.dripT) - dt) <= 0) { B.dripT = B.phase === 2 ? 5 : 6.5; Boss.loot(R, B, B.d - B.len - 3, B.u, 1); }
    // ataques
    if (racing && R.time > 4 && (B.atkT -= dt) <= 0 && !B.dive && gap < 170 && gap > -40) {
      const list = B.phase === 2 ? def.atk2 : def.atk; let a = list[Math.floor(Math.random() * list.length)];
      if (a === 'wagon' && !B.segs.some(g => g.wagon && g.on)) a = 'barrels';
      if (!Boss.attack(R, B, a, hum)) B.atkT = 0.7; else B.atkT = (B.phase === 2 ? 2.6 + Math.random() * 1.3 : 3.6 + Math.random() * 1.6) * Boss.dk(B.diff, [1.25, 1, 0.82]);
    }
    // bólidos contra el jefe: sólido; con turbo, le hace daño
    const under = B.dive && B.dive.st === 'under';
    if (!B.dead && !under) for (const c of R.cars) { if (c.out || c.respawnT > 0) continue;
      for (const g of B.segs) { if (!g.on) continue; const p = Boss.segPos(B, g), ds = T.wrap(c.s - T.wrap(p.s) + T.L / 2) - T.L / 2, du = c.u - p.u, ht2 = p.h + g.hh;
        if (Math.abs(ds) > g.len / 2 + 2.1 || Math.abs(du) > g.w / 2 + 1.1 || c.h < p.h - 2.2 || c.h > ht2) continue;
        const px = g.len / 2 + 2.1 - Math.abs(ds), py = g.w / 2 + 1.1 - Math.abs(du);
        const ram = c.boostT > 0 || (c.specT > 0 && (c.pid === 'country' || c.pid === 'cumbia'));
        if (B.dive && B.dive.st === 'swoop') { Items.hit(R, c, 'blast', null); c.vs *= 0.8; }
        if (px < py && ds < 0) { // por detrás
          const rel = c.vs - B.v; c.s = T.wrap(T.wrap(p.s) - g.len / 2 - 2.1); if (rel > 0) c.vs = B.v - rel * 0.35;
          if (ram && rel > 4 && !(c.ramCD > R.time)) { c.ramCD = R.time + 0.9; const sp = c.specT > 0 && (c.pid === 'country' || c.pid === 'cumbia'); Boss.damage(R, B, sp ? 13 : 8, c, 'ram'); R.events.push({ type: 'bossRam', car: c.idx }); c.boostT = Math.min(c.boostT, 0.2); }
          else if (rel > 3) R.events.push({ type: 'bump', car: c.idx, other: c.idx, imp: rel });
        } else if (px < py) { c.s = T.wrap(T.wrap(p.s) + g.len / 2 + 2.1); }
        else { const sg = Math.sign(du) || 1; c.u = p.u + sg * (g.w / 2 + 1.1); if (c.vu * sg < 0) c.vu = -c.vu * 0.4 + sg * 2; if (ram && !(c.ramCD > R.time) && B.low > 0) { c.ramCD = R.time + 0.9; Boss.damage(R, B, 6, c, 'ram'); R.events.push({ type: 'bossRam', car: c.idx }); } }
      } }
    // ventarrón: empuja de lado a los que vienen detrás
    if (B.gustT > 0) { B.gustT -= dt; for (const c of hum) { const d = B.d - Boss.dist(R, c); if (d > 0 && d < 110 && c.respawnT <= 0) { if (c.grounded) c.vu += B.gustDir * 15 * dt; else c.u += B.gustDir * 5 * dt; } } }
    Boss.hazards(R, B, dt);
    // fin: derrotado (se detiene entre explosiones) o se escapa (cruza la meta por última vez)
    if (B.dying) { B.dying += dt; if (Math.random() < dt * 6) R.events.push({ type: 'boom', k: 'rocket', s: T.wrap(B.d - Math.random() * B.len), u: B.u + (Math.random() - 0.5) * B.w, h: B.h + Math.random() * 3 }); if (B.dying > 2.8 && !B.dead) { B.dead = true; B.out = true; R.events.push({ type: 'bossDead' }); } }
    if (racing && B.d >= B.D) { B.escaped = true; B.endT = R.time; R.events.push({ type: 'bossEscape' }); }
  },
  attack(R, B, a, hum) {
    const T = R.track, def = B.def, rear = B.d - B.len - 2.5, lim = T.limits(T.wrap(rear)), half = T.zone(T.wrap(rear), 'water') ? lim.wall - 1.2 : lim.road - 0.8;
    const bz = R.bz, n0 = bz.length, bad = x => !!(T.zone(T.wrap(x), 'air') || T.zone(T.wrap(x), 'gap')), span = (x0, x1) => { for (let x = x0; x <= x1; x += 4) if (bad(x)) return true; return false; };
    // nada de barriles, minas ni plumas flotando en el tramo de vuelo o sobre el abismo: si cae ahí, espera un momento
    if ((a === 'barrels' || a === 'mines' || a === 'wagon') && span(rear - 14, rear + 2)) return false;
    const target = () => hum.length ? hum[Math.floor(Math.random() * hum.length)] : null, front = hum.length ? hum.reduce((x, y) => Boss.dist(R, x) > Boss.dist(R, y) ? x : y) : null;
    // filas con un hueco (para pasar por ahí)
    const row = (n, gapW) => { const lanes = []; const w = half * 2, step = w / n; const gi = Math.floor(Math.random() * n); for (let i = 0; i < n; i++) if (i !== gi) lanes.push(-half + step * (i + 0.5)); return lanes; };
    switch (a) {
      case 'barrels': row(Math.max(3, Math.round(half * 2 / 3.2)), 3.6).forEach((u, i) => bz.push({ k: 'barrel', s: T.wrap(rear - i * 0.6), u, h: 0, r: 1.25, life: 16, age: 0, vs: -2 })); break;
      case 'coal': for (let i = 0; i < 6; i++) { const s1 = T.wrap(rear - 10 - Math.random() * 30), u1 = (Math.random() * 2 - 1) * half; if (bad(s1)) continue; bz.push({ k: 'coal', s: T.wrap(B.d - 14), u: B.u, h: B.h + 3.5, s0: B.d - 14, u0: B.u, h0: B.h + 3.5, s1, u1, tf: 0.7 + Math.random() * 0.4, age: 0, life: 9 }); } break;
      case 'wagon': { const g = B.segs.filter(x => x.wagon && x.on).sort((x, y) => y.off - x.off)[0]; if (!g) break; g.on = false; const p = Boss.segPos(B, g); bz.push({ k: 'wagon', s: T.wrap(p.s), u: p.u, h: p.h, vs: B.v * 0.75, vEnd: 26, uT: (Math.random() < 0.5 ? -1 : 1) * half * 0.45, r: 0, len: g.len, w: g.w, life: 14, age: 0, hp: 2, n: g.wagon }); B.len = Math.max(...B.segs.filter(x => x.on).map(x => x.off + x.len)); B.wagons++; break; }
      case 'cannon': for (const c of hum) { const tf = 1.7, s1 = T.wrap(c.s + Math.max(c.f, 20) * tf), u1 = clamp(c.u + c.vu * tf * 0.5, -half, half); if (!bad(s1)) bz.push(Boss.shell(R, B, s1, u1, tf)); } break;
      case 'volley': { const c = front; if (!c) break; const tf = 1.9, s1 = T.wrap(c.s + Math.max(c.f, 20) * tf + 6); if (span(s1 - 4, s1 + 4)) return false; const l2 = T.limits(s1), h2 = (T.zone(s1, 'water') ? l2.wall - 1.2 : l2.road - 0.8); const n = Math.max(5, Math.round(h2 * 2 / 3.2)), gi = Math.floor(Math.random() * (n - 1)); for (let i = 0; i < n; i++) if (i !== gi && i !== gi + 1) bz.push(Object.assign(Boss.shell(R, B, T.wrap(s1 + (Math.random() - 0.5) * 3), -h2 + (h2 * 2 / n) * (i + 0.5), tf + i * 0.05), { r: 1.9 })); break; }
      case 'mines': row(3, 4).forEach((u, i) => bz.push({ k: 'mine', s: T.wrap(rear - i * 4), u, h: 0, r: 1.3, life: 18, age: 0, hp: 1 })); break;
      case 'steam': R.hz.push({ k: 'fog', s: T.wrap(rear - 8), u: 0, h: 0, life: 7, owner: -1 }); break;
      case 'feathers': { const c = front; if (!c) break; const tw = 1.2, s1 = T.wrap(c.s + Math.max(c.f, 20) * (tw + 0.3) + 4); if (span(s1 - 4, s1 + 4)) return false; const l2 = T.limits(s1), h2 = T.zone(s1, 'water') ? l2.wall - 1.2 : l2.road - 0.6, n = Math.max(4, Math.round(h2 * 2 / 2.6)), gi = 1 + Math.floor(Math.random() * (n - 2));
        for (let i = 0; i < n; i++) if (i !== gi && i !== gi + 1) bz.push({ k: 'feather', s: s1, u: -h2 + (h2 * 2 / n) * (i + 0.5), h: 14, warn: tw + i * 0.04, r: 1.0, life: tw + 6, age: 0, yaw: Math.random() * 6 });
        break; }
      case 'dive': { if (span(B.d - 10, B.d + 280) || (() => { for (let x = B.d - 10; x <= B.d + 280; x += 8) if (T.zone(T.wrap(x), 'town')) return true; return false; })()) return false; /* la picada no en calles angostas (las alas no caben) ni en el aire */ const sg = Math.random() < 0.5 ? -1 : 1, rm = Math.max(1, (T.limits(T.wrap(B.d)).road) - 2); B.dive = { st: 'warn', t: 0, u0: sg * rm, u1: -sg * rm }; break; }
      case 'gust': B.gustT = 1.3; B.gustDir = Math.random() < 0.5 ? -1 : 1; R.events.push({ type: 'bossGust', dir: B.gustDir }); break;
      // ---- minijefes ----
      case 'flames': if (span(rear - 14, rear + 2)) return false; { const n = Math.max(4, Math.round(half * 2 / 2.8)), gi = Math.floor(Math.random() * (n - 1)); for (let i = 0; i < n; i++) if (i !== gi && i !== gi + 1) R.hz.push({ k: 'fire', s: T.wrap(rear - 2 - Math.random() * 3), u: -half + (half * 2 / n) * (i + 0.5), h: 0, life: 5, owner: -1, r: 1.5, neon: 1 }); bz.push({ k: 'puff', s: T.wrap(rear), u: B.u, h: B.h, life: 0.01, age: 0 }); } break;
      case 'orbs': for (let i = -1; i <= 1; i++) bz.push({ k: 'orb', s: T.wrap(rear - 2), u: clamp(B.u + i * 3.5, -half, half), h: 1.3, vs: -9, life: 7, age: 0, r: 1.1, hp: 1 }); break;
      case 'lightning': { let any = false; for (const c of hum.concat(hum.length === 1 ? [hum[0], hum[0]] : [])) { const tf = 1.3, s1 = T.wrap(c.s + Math.max(c.f, 20) * tf + (Math.random() - 0.3) * 14), u1 = clamp(c.u + (Math.random() - 0.5) * 6, -half, half); if (bad(s1)) continue; bz.push({ k: 'shell', style: 'bolt', s: s1, u: u1, h: 34, s0: s1, u0: u1, h0: 34, s1, u1, tf, age: 0, life: tf + 0.1, r: 2.2, arc: 0 }); any = true; } break; }
      case 'sandballs': if (span(rear - 14, rear + 2)) return false; row(Math.max(3, Math.round(half * 2 / 3.6)), 4).forEach((u, i) => bz.push({ k: 'barrel', style: 'ball', s: T.wrap(rear - i * 1.5), u, h: 0, r: 1.5, life: 12, age: 0, vs: -8 })); break;
      case 'quicksand': if (span(rear - 30, rear + 2)) return false; { const lanes = row(3, 4); lanes.forEach((u, i) => bz.push({ k: 'sand', s: T.wrap(rear - 6 - i * 9), u, h: 0, r: 3.3, life: 10, age: 0 })); } break;
      case 'burrow': { if (span(B.d - 20, B.d + 220)) return false; for (let x = B.d - 10; x <= B.d + 200; x += 6) if (T.zone(T.wrap(x), 'water')) return false; } B.dive = { kind: 'burrow', st: 'warn', t: 0 }; break;
      case 'lavabombs': { for (const c of hum) for (let q = 0; q < (hum.length === 1 ? 3 : 2); q++) { const tf = 1.6 + q * 0.15, s1 = T.wrap(c.s + Math.max(c.f, 20) * tf + (q - 1) * 9), u1 = clamp(c.u + (q - 1) * 4 + (Math.random() - 0.5) * 3, -half, half); if (bad(s1)) continue; bz.push(Object.assign(Boss.shell(R, B, s1, u1, tf), { style: 'lava', h: B.h + 9, h0: B.h + 9, r: 2.2 })); } break; }
      case 'boulders': if (span(rear - 14, rear + 2)) return false; row(Math.max(3, Math.round(half * 2 / 3.6)), 4).forEach((u, i) => bz.push({ k: 'barrel', style: 'boulder', s: T.wrap(rear - i * 1.2), u, h: 0, r: 1.6, life: 12, age: 0, vs: -10 })); break;
      case 'stomp': if (span(rear - 90, rear + 2)) return false; bz.push({ k: 'wave', s: T.wrap(rear), s0: rear, u: 0, h: 0, life: 2.6, age: 0, v: 34, hit: [] }); R.events.push({ type: 'boom', k: 'shell', s: T.wrap(rear + 2), u: B.u, h: 0.5 }); break;
    }
    if (!(bz.length > n0 || a === 'steam' || a === 'dive' || a === 'gust' || a === 'burrow' || a === 'flames')) return false;
    R.events.push({ type: 'bossAtk', k: a }); return true;
  },
  shell(R, B, s1, u1, tf) { return { k: 'shell', s: T_bossWrap(R, B.d - B.len * 0.4), u: B.u, h: B.h + 4, s0: B.d - B.len * 0.4, u0: B.u, h0: B.h + 4, s1, u1, tf, age: 0, life: tf + 0.1 }; },
  hazards(R, B, dt) {
    const T = R.track, bz = R.bz;
    const hitCars = (z, rr, hmax = 2.6, kind = 'blast') => { let any = false; for (const c of R.cars) { if (c.out || c.respawnT > 0) continue; const ds = T.wrap(c.s - z.s + T.L / 2) - T.L / 2, du = c.u - z.u; if (Math.abs(ds) < rr + 1.4 && Math.abs(du) < rr + 0.7 && c.h - z.h < hmax && c.h - z.h > -2.5) { Items.hit(R, c, kind, null); any = true; } } return any; };
    for (let i = bz.length - 1; i >= 0; i--) {
      const z = bz[i]; z.age += dt; z.life -= dt; let gone = z.life <= 0;
      switch (z.k) {
        case 'barrel': case 'mine': z.s = T.wrap(z.s + (z.vs || 0) * dt); z.h = T.groundH(z.s, z.u); if (z.age > 0.25 && hitCars(z, z.r)) { R.events.push({ type: 'boom', k: 'rocket', s: z.s, u: z.u, h: z.h + 0.6 }); gone = true; } break;
        case 'coal': case 'shell': { const p = clamp(z.age / z.tf, 0, 1), s = z.s0 + (T.wrap(z.s1 - T.wrap(z.s0) + T.L / 2) - T.L / 2) * p; z.s = T.wrap(s); z.u = lerp(z.u0, z.u1, p); const g1 = T.groundH(z.s1, z.u1); z.h = lerp(z.h0, g1, z.style === 'bolt' ? p * p : p) + (z.arc != null ? z.arc : z.k === 'shell' ? 16 : 5) * 4 * p * (1 - p);
          if (p >= 1) { gone = true; if (z.k === 'shell') { z.s = z.s1; z.u = z.u1; z.h = g1; hitCars(z, z.r || 2.4, 3.2); R.events.push({ type: 'boom', k: z.style === 'bolt' ? 'zap' : z.style === 'lava' ? 'lava' : 'shell', s: z.s, u: z.u, h: z.h + 0.4 }); if (z.style === 'lava') R.hz.push({ k: 'fire', s: z.s, u: z.u, h: z.h, life: 3.5, owner: -1, r: 1.4 }); }
            else R.hz.push({ k: 'fire', s: z.s1, u: z.u1, h: g1, life: 6, owner: -1, r: 1.5 }); } break; }
        case 'wagon': { z.vs = damp(z.vs, z.vEnd, 0.6, dt); z.s = T.wrap(z.s + z.vs * dt); const lim = T.limits(z.s), rm = Math.max(0, lim.road - z.w / 2 - 0.4); z.u = clamp(damp(z.u, z.uT, 0.8, dt), -rm, rm); z.h = damp(z.h, B ? Boss.railH(R, B, z.s) || 0 : 0, 6, dt);
          for (const c of R.cars) { if (c.out || c.respawnT > 0) continue; const ds = T.wrap(c.s - z.s + T.L / 2) - T.L / 2, du = c.u - z.u; if (Math.abs(ds) < z.len / 2 + 2 && Math.abs(du) < z.w / 2 + 1.1 && Math.abs(c.h - z.h) < 3) { Items.hit(R, c, 'blast', null); if (ds < 0) { c.s = T.wrap(z.s - z.len / 2 - 2.1); c.vs = Math.min(c.vs, z.vs * 0.7); } else { const sg = Math.sign(du) || 1; c.u = z.u + sg * (z.w / 2 + 1.2); } } }
          if (z.hp <= 0) { gone = true; for (let k = 0; k < 4; k++) R.events.push({ type: 'boom', k: 'rocket', s: T.wrap(z.s + (k - 1.5) * 2), u: z.u + (Math.random() - 0.5) * 2, h: z.h + 1 }); if (B) Boss.loot(R, B, z.s, z.u, 2); R.events.push({ type: 'bossWagonDown' }); }
          else if (gone) R.events.push({ type: 'boom', k: 'rocket', s: z.s, u: z.u, h: z.h + 1 }); break; }
        case 'feather': if (z.age < z.warn) { z.h = 14 * (1 - 0); } else { const f = clamp((z.age - z.warn) / 0.28, 0, 1); z.h = T.groundH(z.s, z.u) + 14 * (1 - f) * (1 - f); if (f >= 1) { if (!z.landed) { z.landed = 1; R.events.push({ type: 'featherLand', s: z.s, u: z.u }); } if (hitCars(z, z.r, 2.4)) { R.events.push({ type: 'boom', k: 'feather', s: z.s, u: z.u, h: z.h + 0.5 }); gone = true; } } } break;
        case 'puff': gone = true; break;
        case 'pick': Challenge.pickStep(R, z, dt); break;
        case 'tronco': Challenge.logStep(R, z, dt); break;
        case 'orb': { z.s = T.wrap(z.s + z.vs * dt); let tg = null, bd = 1e9; for (const c of R.cars) { if (c.bot || c.out) continue; const d = Math.abs(T.wrap(c.s - z.s + T.L / 2) - T.L / 2); if (d < bd) { bd = d; tg = c; } } if (tg && bd < 70) z.u += clamp(tg.u - z.u, -1, 1) * 2.2 * dt; z.h = T.groundH(z.s, z.u) + 1.3 + Math.sin(z.age * 6) * 0.3; if (z.age > 0.3 && hitCars(z, z.r, 2.6)) { R.events.push({ type: 'boom', k: 'rocket', s: z.s, u: z.u, h: z.h }); gone = true; } break; }
        case 'sand': z.h = T.groundH(z.s, z.u); for (const c of R.cars) { if (!c.grounded || c.respawnT > 0) continue; const ds = T.wrap(c.s - z.s + T.L / 2) - T.L / 2; if (ds * ds + (c.u - z.u) ** 2 < z.r * z.r) { const k = Math.exp(-1.9 * dt); c.vs *= k; c.vu *= k; if (!c.bot && !c._sandMsg) { c._sandMsg = 1; R.events.push({ type: 'sandIn', car: c.idx }); } } else if (c._sandMsg && Math.abs(ds) > z.r + 6) c._sandMsg = 0; } break;
        case 'wave': { const front = z.s0 - z.v * z.age; z.s = T.wrap(front); for (const c of R.cars) { if (c.respawnT > 0 || z.hit.includes(c.idx)) continue; const d = T.wrap(c.s - z.s + T.L / 2) - T.L / 2; if (Math.abs(d) < 1.6 && c.grounded) { z.hit.push(c.idx); if (c.hopT > 0) R.events.push({ type: 'dodge', car: c.idx }); else { c.vs *= 0.7; c.vn = 5.5; c.grounded = false; c.takeoff('stomp'); c.wobT = 0.8; if (!c.bot) R.events.push({ type: 'stompHit', car: c.idx }); } } } break; }
        case 'loot': z.h = T.groundH(z.s, z.u) + 1.3 + Math.sin(z.age * 4) * 0.25; if (z.age > 0.35) for (const c of R.cars) { if (c.out || c.respawnT > 0 || c.bot) continue; const ds = T.wrap(c.s - z.s + T.L / 2) - T.L / 2; if (Math.abs(ds) < 2.6 && Math.abs(c.u - z.u) < 2.3 && Math.abs(c.h - z.h) < 3.4) { gone = true; Boss.pick(R, c); R.events.push({ type: 'lootGot', car: c.idx, s: z.s, u: z.u }); break; } } break;
      }
      if (gone) bz.splice(i, 1);
    }
  },
  // un proyectil de jugador contra el jefe o contra lo que suelta (vagón, minas)
  projectile(R, z) {
    const B = R.boss, T = R.track; if (!B || B.dead) return false; if (B.dive && B.dive.st === 'under') return false;
    for (const g of B.segs) { if (!g.on) continue; const p = Boss.segPos(B, g), ds = T.wrap(z.s - T.wrap(p.s) + T.L / 2) - T.L / 2;
      if (Math.abs(ds) < g.len / 2 + 0.8 && Math.abs(z.u - p.u) < g.w / 2 + 0.9 && z.h > p.h - 1.5 && z.h < p.h + g.hh + 1) { Boss.damage(R, B, z.k === 'wasp' ? 12 : 8, R.cars[z.owner], z.k); R.events.push({ type: 'boom', k: 'rocket', s: z.s, u: z.u, h: z.h }); return true; } }
    for (const w of R.bz) { if (w.k !== 'wagon' && w.k !== 'mine' && w.k !== 'barrel' && w.k !== 'orb') continue; const ds = T.wrap(z.s - w.s + T.L / 2) - T.L / 2;
      if (Math.abs(ds) < (w.len ? w.len / 2 : w.r) + 0.8 && Math.abs(z.u - w.u) < (w.w ? w.w / 2 : w.r) + 0.8 && Math.abs(z.h - w.h - 1) < 3) { if (w.k === 'wagon') w.hp--; else { w.life = 0; R.events.push({ type: 'boom', k: 'rocket', s: w.s, u: w.u, h: w.h + 0.6 }); } R.events.push({ type: 'boom', k: 'rocket', s: z.s, u: z.u, h: z.h }); return true; } }
    return false;
  },
  damage(R, B, n, by, kind) {
    if (!B || B.dying || B.dead || B.escaped || R.state !== 'race') return; if (B.low > 0) n *= 1.5;
    n = Math.round(n * (B.def.fly && kind === 'rocket' && !B.low ? 0.9 : 1)); B.hp -= n; B.hitT = 0.3; B.stunT = Math.max(B.stunT, 0.45);
    if (by && !by.isBoss) by.bossDmg = (by.bossDmg || 0) + n;
    R.events.push({ type: 'bossHit', n, kind, by: by ? by.idx : -1 });
    B.lootAcc += n; while (B.lootAcc >= 16) { B.lootAcc -= 16; Boss.loot(R, B, B.d - B.len - 4, B.u + (Math.random() - 0.5) * 4, 1); }
    if (B.phase === 1 && B.hp <= B.max * 0.5) { B.phase = 2; B.atkT = Math.min(B.atkT, 1.2); R.events.push({ type: 'bossPhase' }); }
    if (B.hp <= 0) { B.hp = 0; B.dying = 0.001; B.endT = R.time; B.dive = null; B.low = 0; R.bz = R.bz.filter(z => z.k === 'loot'); R.events.push({ type: 'bossDown' }); }
  },
  loot(R, B, s, u, n) { const T = R.track; for (let k = 0; k < n; k++) { const ss = T.wrap(s - k * 6), lim = T.limits(ss), rm = Math.max(0, lim.road - 1.5); R.bz.push({ k: 'loot', s: ss, u: clamp(u + (k ? (Math.random() - 0.5) * 6 : 0), -rm, rm), h: 1, life: 14, age: 0, kind: B.def.loot }); } },
  pick(R, c) {
    if (!c.item && !(c.rollT > 0)) { const r = Math.random(); c.item = r < 0.55 ? 'rocket' : r < 0.75 ? 'wasp' : r < 0.9 ? 'rocket3' : 'chile'; c.itemN = c.item === 'rocket3' || c.item === 'chile' ? 3 : 1; c.rollT = 0.45; }
    c.addGem(0.7);
  },
  // especiales contra el jefe
  special(R, c) {
    const B = R.boss, T = R.track; if (!B || B.dead || B.dying) return; const d = B.d - B.len / 2 - Boss.dist(R, c), du = Math.abs(c.u - B.u), hd = Math.abs(B.h - c.h);
    let n = 0; switch (c.pid) {
      case 'taiko': if (Math.abs(d) < 34) n = 12; break; // Tambor: onda
      case 'freestyle': if (d > -8 && d < 70) n = 13; break; // Batalla: estallido al frente
      case 'samba': case 'reggae': case 'salsa': case 'flamenco': if (d > -10 && d < 60) n = 9; break; // el resto: ráfaga Esmeralda si está cerca
    }
    if (n) { if (B.def.fly && hd > 6 && c.pid !== 'flamenco' && c.pid !== 'salsa') n = Math.round(n * 0.75); Boss.damage(R, B, n, c, 'special'); }
  },
  stars(B) { if (!B.dead) return 0; const f = (B.d - B.s0) / (B.D - B.s0); return f <= 0.62 ? 3 : f <= 0.86 ? 2 : 1; },
};
const T_bossWrap = (R, s) => R.track.wrap(s);
/* ---------- reglas de la Persecución ---------- */
Rules.chase = (R, def, diff = 1) => {
  const B = Boss.create(R, def, diff);
  return {
    id: 'chase', noLaps: true, noRubber: true, noPlace: true, B, homing: true, goal: 'detén ' + def.name.replace(/^El /, 'al ') + (def.laps === 2 ? ' antes de que cruce la meta 2 veces' : ' antes de que dé vuelta y media'),
    tip: i => def.how + ' Los cohetes lo persiguen solos; recoge el botín que suelta.',
    introSub: (def.mini ? 'Minijefe · ' : 'Persecución · ') + def.name + ' · detenlo antes de ' + (def.laps === 2 ? '2 vueltas' : 'vuelta y media'),
    itemW: { rocket: 10, rocket3: 4, wasp: 4, oil: 0, coco: 0, shield: 5, chile: 6, magnet: 4, fog: 0, emerald: 4, bolt: 1.2 },
    init(R) { R.events.length = 0; },
    step(R, dt) { Boss.step(R, dt); },
    onSpecial(R, c) { Boss.special(R, c); },
    // la máquina (y el piloto automático de las pruebas): esquiva lo que suelta el jefe, recoge el botín y, con turbo, va a embestirlo
    avoid(R, c, uT) {
      const T = R.track, obs = [], lim = T.limits(c.s).wall - 2.0; let loot = null, ld = 70;
      for (const z of R.bz) { const d = T.wrap((z.s1 != null ? z.s1 : z.s) - c.s); if (d < 0.5 || d > 60) continue;
        if (z.k === 'loot') { if (d < ld) { ld = d; loot = z; } continue; } if (z.k === 'wave' || z.k === 'puff' || z.k === 'pick') continue;
        obs.push({ u: z.u1 != null ? z.u1 : z.u, r: z.k === 'shell' ? (z.r || 2.4) + 0.6 : z.k === 'wagon' ? z.w / 2 + 0.5 : z.r || 1.3 }); }
      for (const z of R.hz) if (z.k === 'fire' && z.owner === -1) { const d = T.wrap(z.s - c.s); if (d > 0.5 && d < 45) obs.push({ u: z.u, r: 1.6 }); }
      let want = loot ? loot.u : uT; const db = T.wrap(B.s - c.s);
      if (!B.def.fly && !B.out && db < 70 && (c.boostT > 0 || db > B.len / 2 + 6)) want = B.u; // detrás del jefe: rebufo y embestida
      if (B.low > 0 && db < 60) want = B.u;
      want = clamp(want, -lim, lim); const clear = u => obs.every(o => Math.abs(u - o.u) >= o.r + 1.7);
      if (!obs.length || clear(want)) return want;
      let best = want, bd = 1e9; for (const u0 of [want, ...obs.flatMap(o => [o.u - o.r - 2.2, o.u + o.r + 2.2])]) { const u = clamp(u0, -lim, lim); if (!clear(u)) continue; const d = Math.abs(u - want) + Math.abs(u - c.u) * 0.5; if (d < bd) { bd = d; best = u; } }
      return best;
    },
    order(R) { return R.cars.slice().sort((a, b) => (b.bossDmg || 0) - (a.bossDmg || 0)); },
    done(R) { return B.dead || (B.escaped && R.time - B.endT > 0.6); },
    panel(R, c) {
      const left = Math.max(0, B.D - B.d), d = Math.round(B.d - B.len / 2 - Boss.dist(R, c));
      return { label: def.name.toUpperCase(), bar: B.hp / B.max, barCol: B.phase === 2 ? '#ff5a36' : def.col, flash: B.hitT > 0, value: '', sub: (d > 0 ? 'a ' + d + ' m' : d > -B.len ? '¡al lado!' : 'lo pasaste') + ' · se escapa en ' + (left > 999 ? (left / 1000).toFixed(1).replace('.', ',') + ' km' : Math.round(left) + ' m'), esc: clamp((B.d - B.s0) / (B.D - B.s0), 0, 1) };
    },
    overlay(R, c) { if (B.dead) return { text: '¡JEFE DERROTADO!', sub: def.name + ' se detuvo', col: '#3dffa8' }; if (B.escaped) return { text: '¡SE ESCAPÓ!', sub: def.name + ' cruzó la meta', col: '#ff5a36' }; },
    cell(c) { return 'daño ' + Math.round((c.bossDmg || 0) / B.max * 100) + ' %'; },
    title(R, hum) { return B.dead ? (hum.length === 2 ? '¡Detuvieron ' + def.name.replace(/^El /, 'al ') + '!' : '¡Detuviste ' + def.name.replace(/^El /, 'al ') + '!') : '¡' + def.name + ' escapó!'; },
    stars() { return Boss.stars(B); },
  };
};
