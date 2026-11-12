/* =========================================================================
   MODOS — reglas que se enchufan a la carrera (R.rules):
   · Eliminación: tras una gracia, cada rato sale el último; gana el que quede.
   · Batalla: en una arena, 3 corazones; cada golpe quita uno; embestir con
     turbo también; gana el último en pie (o el de más corazones al final).
   · Escuela de pilotos: lecciones cortas con una meta, tiempo y medalla.
   El Duelo es una carrera normal de dos sin máquina, al mejor de tres
   (lo lleva el juego, no las reglas).
   ========================================================================= */
const MODE_NAMES = { quick: 'Carrera', gp: 'Gran Premio', tt: 'Contrarreloj', duel: 'Duelo', elim: 'Eliminación', battle: 'Batalla', school: 'Escuela', chase: 'Persecución' };
const ORDN = n => n + 'º';
// sacar un bólido del juego (explota y desaparece)
function knockOut(R, c) {
  if (c.out) return; c.out = true; c.outT = R.time; c.item = null; c.itemN = 0; c.drift.on = false; c.boostT = 0;
  R.events.push({ type: 'out', car: c.idx }); R.events.push({ type: 'boom', k: 'rocket', s: c.s, u: c.u, h: c.h + 0.5 });
}
// poner un bólido en un punto, quieto o con velocidad (para lecciones y arenas)
function placeCar(R, c, s, u, v = 0) {
  const T = R.track; c.s = T.wrap(s); c.u = u; c.a = 0; c.vs = v; c.vu = 0; c.f = v; c.l = 0; c.vn = 0; c.grounded = true; c.h = T.groundH(c.s, u); c.safeS = c.s;
  c.mode = T.zone(c.s, 'water') ? 'water' : 'road'; c.drift.on = false; c.drift.lv = 0; c.trick = null; c.tricks = 0; c.airT = 0; c.spinT = 0; c.respawnT = 0; c.half = false;
  R.events.push({ type: 'teleport', car: c.idx });
}
const Rules = {
  /* ---------- ELIMINACIÓN ---------- */
  elim(R) {
    const GRACE = 24, EVERY = 15;
    return {
      id: 'elim', noLaps: true, next: GRACE, left: GRACE,
      introSub: 'Eliminación · cada ' + EVERY + ' s sale el último',
      step(R) {
        if (R.state !== 'race') return; this.left = this.next - R.time;
        if (this.left <= 0) { const alive = R.order.filter(c => !c.out); if (alive.length > 1) knockOut(R, alive[alive.length - 1]); this.next = R.time + EVERY; }
      },
      order(R) { const a = R.cars.filter(c => !c.out).sort((x, y) => y.progress - x.progress), o = R.cars.filter(c => c.out).sort((x, y) => y.outT - x.outT); return a.concat(o); },
      done(R) { const alive = R.cars.filter(c => !c.out); return alive.length <= 1 || (R.humans > 0 && R.cars.every(c => c.bot || c.out)); },
      panel(R, c) { const n = R.cars.filter(o => !o.out).length; return c.out ? { label: 'FUERA', value: ORDN(c.place), col: '#ff5a36' } : { label: 'SIGUIENTE FUERA', value: Math.max(0, Math.ceil(this.left)) + ' s', col: this.left < 4 ? '#ff5a36' : '#fff', sub: n + ' en pista' }; },
      overlay(R, c) {
        if (c.out) return { text: '¡ELIMINADO!', sub: ORDN(c.place) + ' lugar · mira la carrera', col: '#ff5a36' };
        const alive = R.order.filter(o => !o.out); if (alive.length > 1 && alive[alive.length - 1] === c && this.left < 6) return { text: '¡VAS ÚLTIMO!', sub: 'adelanta a alguien antes de ' + Math.ceil(this.left) + ' s', col: '#ff5a36', blink: true };
      },
      cell(c, R) { return c.out ? 'fuera a los ' + HUD.fmt(c.outT) : R.cars.filter(o => !o.out).length === 1 ? '¡ganador!' : 'seguía en pista'; },
      title(R, hum) { const w = R.order[0]; return w && !w.bot ? (hum.length === 2 ? `¡Gana J${w.human + 1}!` : '¡Sobreviviste!') : (hum.length === 2 ? (hum[0].place < hum[1].place ? 'J1 duró más' : 'J2 duró más') : `${ORDN(hum[0].place)} lugar`); },
    };
  },
  /* ---------- BATALLA EN ARENA ---------- */
  battle(R, o = {}) {
    const T = R.track, TIME = o.time || 150, HEARTS = o.hearts || 3;
    const obs = (T.def.obstacles || []).map(o => ({ s: T.cp(o.at), u: o.u || 0, r: o.r || 1.9 }));
    const mud = (T.def.mud || []).map(o => ({ s: T.cp(o.at), u: o.u || 0, r: o.r || 4 }));
    const boosting = c => c.boostT > 0 || (c.specT > 0 && (c.pid === 'country' || c.pid === 'cumbia'));
    return {
      id: 'battle', noLaps: true, free: true, noRubber: true, obs, mud, left: TIME,
      introSub: 'Batalla · ' + (HEARTS === 1 ? 'un solo corazón' : HEARTS + ' corazones') + ' · gana el último en pie',
      itemW: { rocket: 10, rocket3: 6, wasp: 3, oil: 8, coco: 7, shield: 6, chile: 5, fog: 2, emerald: 3 },
      init(R) { const n = R.cars.length; R.cars.forEach((c, i) => { c.hearts = HEARTS; placeCar(R, c, i * T.L / n + 6, i % 2 ? 6 : -6, 0); }); R.events.length = 0; },
      step(R, dt) {
        if (R.state === 'race') this.left = TIME - R.time;
        for (const c of R.cars) {
          if (c.out || c.respawnT > 0) continue;
          // columnas y montículos: sólidos, rebotan
          for (const o of obs) {
            const ds = T.wrap(c.s - o.s + T.L / 2) - T.L / 2, du = c.u - o.u, d = Math.hypot(ds, du), rr = o.r + 1.15;
            if (d < rr && d > 1e-4 && c.h - T.groundH(c.s, c.u) < 3) { const nx = ds / d, ny = du / d; c.s = T.wrap(c.s + nx * (rr - d)); c.u += ny * (rr - d); const vn = c.vs * nx + c.vu * ny; if (vn < 0) { c.vs -= 1.5 * vn * nx; c.vu -= 1.5 * vn * ny; if (-vn > 5) R.events.push({ type: 'wall', car: c.idx, hit: -vn, side: Math.sign(ny) || 1 }); } }
          }
          // charcos de lodo: frenan y salpican
          c.mud = false; if (c.grounded) for (const m of mud) { const ds = T.wrap(c.s - m.s + T.L / 2) - T.L / 2; if (ds * ds + (c.u - m.u) ** 2 < m.r * m.r) { c.mud = true; const k = Math.exp(-1.6 * dt); c.vs *= k; c.vu *= k; } }
        }
      },
      onHit(R, c, kind, by) {
        if (c.out || !(c.hearts > 0)) return; c.hearts--; R.events.push({ type: 'heart', car: c.idx, n: c.hearts, by: by ? by.idx : -1 });
        if (by && by !== c && !by.out) by.addGem(0.6);
        if (c.hearts <= 0) knockOut(R, c);
      },
      onBump(R, a, b, imp) { if (imp < 6) return; const A = boosting(a) && !boosting(b) ? a : boosting(b) && !boosting(a) ? b : null; if (A) Items.hit(R, A === a ? b : a, 'ram', A); },
      // la máquina esquiva columnas y lodo
      avoid(R, c, uT, L = 30) {
        const near = []; let dmin = 1e9; for (const o of obs.concat(mud)) { const d = T.wrap(o.s - c.s); if (d > 0.5 && d < 45) { near.push(o); dmin = Math.min(dmin, d); } }
        if (!near.length) return uT; const lim = T.limits(c.s).wall - 2.4, clear = u => near.every(o => Math.abs(u - o.u) >= o.r + 2.5);
        if (clear(uT) && clear(c.u)) return uT;
        if (c.bot && dmin < 40) { c.bot.hold = false; c.bot.noDrift = 0.5; } // sin derrape cerca de una columna: se esquiva mejor
        let best = uT, bd = 1e9; for (const u of [uT, ...near.flatMap(o => [o.u - o.r - 3.3, o.u + o.r + 3.3])]) { const v = clamp(u, -lim, lim); if (!clear(v)) continue; const d = Math.abs(v - c.u) + Math.abs(v - uT) * 0.3; if (d < bd) { bd = d; best = v; } }
        // apuntar más afuera para estar en el carril justo al llegar al obstáculo (no al final de la mirada)
        return dmin < L ? clamp(c.u + (best - c.u) * L / Math.max(dmin, 6), -lim - 1, lim + 1) : best;
      },
      order(R) { const a = R.cars.filter(c => !c.out).sort((x, y) => (y.hearts - x.hearts) || ((y.stats.hitsDone || 0) - (x.stats.hitsDone || 0))), o = R.cars.filter(c => c.out).sort((x, y) => y.outT - x.outT); return a.concat(o); },
      done(R) { return R.cars.filter(c => !c.out).length <= 1 || this.left <= 0 || (R.humans > 0 && R.cars.every(c => c.bot || c.out)); },
      panel(R, c) { const m = Math.max(0, this.left); return { hearts: c.out ? 0 : c.hearts, max: HEARTS, label: 'TIEMPO', value: Math.floor(m / 60) + ':' + String(Math.floor(m % 60)).padStart(2, '0'), col: m < 20 ? '#ff7a5a' : '#fff' }; },
      overlay(R, c) { if (c.out) return { text: '¡FUERA DE COMBATE!', sub: ORDN(c.place) + ' lugar · mira la batalla', col: '#ff5a36' }; },
      cell(c) { return (c.out ? 'fuera' : '♥'.repeat(c.hearts)) + ' · ' + (c.stats.hitsDone || 0) + ' golpes'; },
      title(R, hum) { const w = R.order[0]; return w && !w.bot ? (hum.length === 2 ? `¡J${w.human + 1} gana la batalla!` : '¡Ganaste la batalla!') : `Gana ${w ? w.P.name : ''}`; },
    };
  },
  /* ---------- ESCUELA DE PILOTOS ---------- */
  lesson(R, L) {
    const T = R.track, s0 = L.at != null ? T.cp(L.at) : 0, NEED = (R.humans === 2 && L.need2) || L.need;
    return {
      id: 'school', noLaps: !L.race, L, left: L.time,
      introSub: 'Escuela · ' + L.name + ' · ' + L.goal,
      init(R) {
        R.cars.forEach((c, i) => { c.lp = 0; c.lessonT = 0; if (L.race) return; if (!c.bot) placeCar(R, c, s0, R.humans === 2 ? (i ? 3.4 : -3.4) : 0, 0); else placeCar(R, c, s0 + (L.botsAhead || 30) + i * 14, (i % 2 ? 4 : -4), 0); });
        if (L.setup) L.setup(R); R.events.length = 0;
      },
      step(R, dt) {
        if (R.state !== 'race') return; this.left = L.time - R.time; if (L.step) L.step(R, dt); const n = R.events.length; // primero lo propio del reto (sus eventos cuentan en este mismo paso)
        for (let i = 0; i < n; i++) { const e = R.events[i], c = R.cars[e.type === 'hit' ? e.by : e.car]; if (!c || c.bot || c.lessonT) continue; if (L.count(e, c, R)) { c.lp++;
          if (L.team) { R.teamN = (R.teamN || 0) + 1; R.events.push({ type: 'lessonTick', car: c.idx, n: R.teamN, need: NEED }); if (R.teamN >= NEED) for (const h of R.cars) if (!h.bot && !h.lessonT) { h.lessonT = R.time; R.events.push({ type: 'lessonDone', car: h.idx }); } } // en equipo: suman los dos
          else { R.events.push({ type: 'lessonTick', car: c.idx, n: c.lp, need: NEED }); if (c.lp >= NEED) { c.lessonT = R.time; R.events.push({ type: 'lessonDone', car: c.idx }); } } } }
        for (const c of R.cars) {
          if (c.bot || c.lessonT) continue;
          // volver a intentar: al pasar el final del tramo, de vuelta al inicio
          if (L.loopTo != null && T.wrap(c.s - s0) > T.wrap(T.cp(L.loopTo) - s0) && T.wrap(c.s - s0) < T.L * 0.9 && c.grounded) placeCar(R, c, s0, c.u, 20);
          if (L.refill && !c.item && !(c.rollT > 0)) { c.refT = (c.refT || 0) + dt; if (c.refT > 0.7) { c.refT = 0; c.item = L.refill; c.itemN = 1; R.events.push({ type: 'itemGot', car: c.idx, item: c.item }); } }
        }
      },
      done(R) { return this.left <= 0 || R.cars.every(c => c.bot || c.lessonT || (L.race && c.finished)); },
      avoid(R, c, uT) { if (L.avoid) return L.avoid(R, c, uT); return L.botLane != null ? L.botLane + Math.sin(R.time * 0.4 + c.idx) * 0.8 : uT; }, homing: !!L.homing, // blancos fáciles: la máquina va por el centro
      medal(c) { if (!c.lessonT) return 0; const t = c.lessonT; return t <= L.gold ? 3 : t <= L.silver ? 2 : 1; },
      panel(R, c) { return { label: L.name.toUpperCase(), value: L.race && !L.showCount ? ORDN(c.place) : Math.min(L.team ? R.teamN || 0 : c.lp, NEED) + '/' + NEED, col: c.lessonT ? '#3dffa8' : '#fff', sub: c.lessonT ? HUD.fmt(c.lessonT) : L.race ? ORDN(c.place) + ' · vuelta ' + Math.min(R.laps, c.lap + 1) + '/' + R.laps : '⏱ ' + Math.max(0, Math.ceil(this.left)) + ' s' }; },
      overlay(R, c) { if (c.lessonT) { const m = this.medal(c); return { text: '¡LOGRADO!', sub: ['', 'medalla de bronce', 'medalla de plata', '¡medalla de oro!'][m] + ' · ' + HUD.fmt(c.lessonT), col: ['', '#d88a4a', '#d8e0ea', '#ffd23d'][m] }; } },
      cell(c) { const m = this.medal(c); return c.bot ? '' : m ? ['', 'bronce', 'plata', 'oro'][m] + ' · ' + HUD.fmt(c.lessonT) + (L.team ? ' · aportó ' + c.lp : '') : Math.min(L.team ? R.teamN || 0 : c.lp, NEED) + '/' + NEED + ' · no alcanzó'; },
      title(R, hum) { const ok = hum.some(c => c.lessonT); return ok ? '¡Lección superada!' : 'Casi… inténtalo otra vez'; },
    };
  },
};
/* ---------- lecciones de la Escuela (todas se pueden jugar de a uno o de a dos) ---------- */
const keyName = (i, k) => Touch.active ? { drift: 'DERRAPE', item: 'OBJETO', turbo: 'TURBO', steer: 'la palanca' }[k] : ({ drift: ['F', 'K'], item: ['G', 'L'], turbo: ['H', 'Ñ'], steer: ['A / D', '← / →'] }[k] || [])[i] || '';
const LESSONS = [
  { id: 'derrape', name: 'Derrape', track: 'guatape', at: 13.3, time: 50, need: 3, gold: 16, silver: 30, goal: '3 turbos de derrape en las curvas', loopTo: 16.6,
    tip: i => `Gira con ${keyName(i, 'steer')} y SOSTÉN ${keyName(i, 'drift')} en la curva: la chispa pasa de azul a naranja y esmeralda; suelta para el turbo.`,
    count: e => e.type === 'driftBoost' },
  { id: 'piruetas', name: 'Piruetas', track: 'guatape', at: 23.3, time: 60, need: 2, gold: 14, silver: 26, goal: '2 saltos con pirueta bien aterrizados', loopTo: 25.4,
    tip: i => `En la rampa, en el aire, toca ${keyName(i, 'drift')} con una dirección. Aterriza derecho para ganar turbo.`,
    count: e => e.type === 'landTrick' },
  { id: 'lancha', name: 'Lancha', track: 'halong', at: 3.1, time: 50, need: 3, gold: 18, silver: 30, goal: '3 piruetas saltando sobre las olas', loopTo: 7.9,
    tip: i => `En el agua el bólido es lancha: las olas grandes son rampas. Toca ${keyName(i, 'drift')} en el aire.`,
    count: (e, c, R) => e.type === 'landTrick' && !!R.track.zone(c.s, 'water') },
  { id: 'ala', name: 'Ala', track: 'guatape', at: 9.9, time: 60, need: 4, gold: 10, silver: 24, goal: 'pasa por 4 aros volando', loopTo: 13.4,
    tip: i => Touch.active ? 'Tras la rampa grande sale el ala: palanca ↑ picada (más rápido), ↓ subir. Apunta a los aros.' : `Tras la rampa grande sale el ala: ${i ? '↑ picada, ↓ subir' : 'W picada, S subir'}. Apunta a los aros.`,
    count: e => e.type === 'ring' },
  { id: 'objetos', name: 'Objetos', track: 'tokio', at: 7.6, time: 45, need: 3, gold: 9, silver: 16, goal: 'golpea 3 rivales con cohetes', refill: 'rocket', botsAhead: 40, botLane: 0, homing: true,
    bots: 3, botLevel: 0, botSlow: 0.72,
    tip: i => `Toma la caja o espera tu cohete y dispara con ${keyName(i, 'item')} cuando un rival esté al frente.`,
    count: (e, c) => e.type === 'hit' && e.by === c.idx && e.car !== c.idx,
    setup(R) { R.events.length = 0; } },
  { id: 'especial', name: 'Especial', track: 'venecia', at: 0.3, time: 60, need: 1, gold: 25, silver: 40, goal: 'llena la barra Esmeralda y lanza tu especial',
    tip: i => `Esmeraldas, derrapes, piruetas y aros llenan la barra. Llena, sin objeto, con ${keyName(i, 'item')} sale la especial de tu piloto.`,
    count: e => e.type === 'special', setup(R) { for (const c of R.cars) if (!c.bot) c.gem = 2; } },
  { id: 'examen', name: 'Examen', track: 'venecia', at: 0, time: 120, need: 1, gold: 48, silver: 58, goal: 'gana una vuelta contra la máquina', race: true, laps: 1, bots: 3, botLevel: 0,
    tip: () => 'Usa todo lo aprendido: derrapes, piruetas, rebufo y objetos.',
    count: (e, c, R) => e.type === 'finish' && R.cars.filter(o => o.bot).every(o => !o.finished) },
];
