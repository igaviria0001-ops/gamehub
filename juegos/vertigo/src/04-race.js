/* =========================================================================
   CARRERA — parrilla, cuenta regresiva, vueltas, posiciones, rebufo, choques
   entre bólidos y la máquina (piloto automático por la línea de carrera).
   Todo en pasos fijos; los eventos (race.events) los leen sonido y efectos.
   ========================================================================= */
const TRACK_CACHE = {};
function getTrack(id) { return TRACK_CACHE[id] || (TRACK_CACHE[id] = new Track(TRACKS[id])); }

/* ---------- línea de carrera (por muestra): adentro en las curvas ---------- */
function racingLine(T) {
  if (T.line) return T.line;
  const N = T.N, line = new Float32Array(N), look = Math.round(30 / T.ds);
  for (let k = 0; k < N; k++) {
    let acc = 0, n = 0; for (let j = -look; j <= look; j++) { acc += T.kap[(k + j + N) % N] * (1 - Math.abs(j) / (look + 1)); n += 1 - Math.abs(j) / (look + 1); }
    const kk = acc / n, half = T.w[k] / 2 - 2.6; line[k] = clamp(kk * 420, -1, 1) * half;
  }
  for (let it = 0; it < 6; it++) { const c = line.slice(); for (let k = 0; k < N; k++) line[k] = (c[(k - 1 + N) % N] + c[k] * 2 + c[(k + 1) % N]) / 4; }
  return (T.line = line);
}
/* fuerza de la máquina en una escala continua 0–1. Medido contra jugadores simulados: un jugador normal en el celular
   anda como la máquina en 0,0–0,05, uno bueno como 0,15–0,2 y uno experto como 0,55; 1 es más rápido que casi cualquier persona.
   Los niveles viejos 0/1/2 equivalen a 0,2/0,5/0,85 (solo los usan las lecciones). */
const BOT_SKILL = [0.2, 0.5, 0.85], botVmaxK = s => s < 0.2 ? lerp(0.77, 0.86, s / 0.2) : s < 0.5 ? lerp(0.86, 0.95, (s - 0.2) / 0.3) : s < 0.85 ? lerp(0.95, 1, (s - 0.5) / 0.35) : lerp(1, 1.01, (s - 0.85) / 0.15);
class Bot {
  constructor(level = 1, skill) { this.skill = skill != null ? clamp(skill, 0, 1) : BOT_SKILL[clamp(level, 0, 2)]; if (skill != null) level = this.skill < 0.3 ? 0 : this.skill < 0.7 ? 1 : 2; this.level = level; this.hold = false; this.trickT = 0; this.turboCD = 2 + Math.random() * 3; this.noise = Math.random() * 10; this.pe = 0;
    /* cada rival es distinto: ritmo propio (se reparte en la carrera) y errores de vez en cuando (más en el nivel fácil) */
    this.pace = 1; this.mistK = lerp(1.6, 0.45, this.skill); this.mistT = 6 + Math.random() * 14; this.mist = null; }
  think(R, c, dt) {
    const T = R.track, line = racingLine(T), N = T.N, f = Math.max(0, c.f), ds = T.ds;
    const inp = { steer: 0, up: false, down: false, drift: false, item: false, turbo: false };
    if (!c.grounded) {
      this.trickT -= dt;
      if (T.zone(c.s, 'air')) {
        // planeo: buscar el próximo aro (altura y lado); si no hay, bajar suave hacia el aterrizaje
        let ring = null, bd = 1e9; for (const r of T.rings) { const d = T.wrap(r.s - c.s); if (d > 1 && d < bd && d < 160) { bd = d; ring = r; } }
        const tu = ring ? ring.u : 0, th = ring ? ring.h : 3 + this.level, k = this.level === 0 ? 0.5 : 1;
        inp.steer = clamp(((tu - c.u) * 0.22 - c.vu * 0.1) * k, -1, 1);
        inp.up = c.h > th + 1.2; inp.down = c.h < th - 0.8;
        if (!ring && this.level > 1 && c.h > 6 && this.trickT <= 0 && Math.abs(c.u) < 6) { inp.drift = !c.prev.drift; this.trickT = 0.6; }
        return inp;
      }
      const hAbove = c.h - T.groundH(c.s, c.u), rem = (c.vn + Math.sqrt(Math.max(0, c.vn * c.vn + 60 * hAbove))) / 30;
      const uA = R.rules && R.rules.avoid ? R.rules.avoid(R, c, 0, 24) : 0; inp.steer = clamp((uA - (c.u + c.vu * 0.6)) / 5, -1, 1); // en el aire: apuntar al centro (o al carril libre en la arena)
      if (c.airT > 0.08 && rem > 0.52 && this.trickT <= 0 && this.level > 0) { inp.drift = !c.prev.drift; this.trickT = 0.5; inp.steer = 0; } return inp;
    }
    // punto objetivo por delante, medido en el marco actual (la curva se integra)
    const L = 12 + f * 0.5, k0 = Math.floor(c.s / ds), n = Math.max(2, Math.round(L / ds));
    let th = 0, lat = 0; for (let j = 0; j < n; j++) { th += T.kap[(k0 + j) % N] * ds; lat += Math.sin(th) * ds; }
    const k2 = (k0 + n) % N; let uT = line[k2] + Math.sin(R.time * 0.3 + this.noise) * (2 - this.level) * 0.5;
    const limA = T.limits(k2 * ds); if (limA.water) uT *= 0.55; const edgeA = Math.max(0.5, limA.wall - 1.0 - (limA.wall - limA.road < 1 ? 3.2 : 2.2)); uT = clamp(uT, -edgeA, edgeA);
    for (const r of T.ramps) { const d = T.wrap(r.s - c.s); if (d < 110) uT = 0; }
    for (const p of T.pads) { const d = T.wrap(p.s - c.s); if (d < 70 && d > 4 && this.level > 0) uT = p.u; }
    if (R.rules && R.rules.avoid) uT = R.rules.avoid(R, c, uT, L);
    const aim = Math.atan2(lat + uT * Math.cos(th) - c.u, L * Math.cos(th) - uT * Math.sin(th));
    const vh = f > 4 ? Math.atan2(c.vu, c.vs) : c.a, err = angWrap(aim - vh), derr = (err - this.pe) / dt; this.pe = err;
    // velocidad segura: curvatura por delante con distancia de frenado
    let brake = false, kd = 0; const kn = Math.round((40 + f * 2.2) / ds), aLat = (24 + 6 * this.skill) * this.pace * this.pace, aBr = 30;
    for (let j = 2; j < kn; j++) { const kk = T.kap[(k0 + j) % N], d = j * ds, vl = Math.sqrt(aLat / Math.max(1e-4, Math.abs(kk))); if (f > Math.sqrt(vl * vl + 2 * aBr * d) + 2) brake = true; if (d > 10 && d < 50 && Math.abs(kk) > Math.abs(kd)) kd = kk; }
    // errores humanos: entrar pasado a una curva, soltar el pie un momento o un culebreo
    if (R.state === 'race' && R.time > 4 && !c.finished) { this.mistT -= dt * this.mistK;
      if (this.mistT <= 0 && !this.mist && !T.zone(c.s, 'water') && f > 20) { const r = Math.random(), k = Math.abs(kd) > 0.008 && r < 0.55 ? 'wide' : r < 0.78 ? 'lift' : 'wobble';
        this.mist = { k, t: 0, T: k === 'wide' ? 1.4 : k === 'lift' ? 0.18 + Math.random() * 0.22 : 0.9 }; this.mistT = 12 + Math.random() * 22; } }
    const MI = this.mist; if (MI) { MI.t += dt; if (MI.t > MI.T) this.mist = null; else if (MI.k === 'wide') brake = false; }
    // derrape en curvas cerradas
    const want = Math.abs(kd) > 0.014 && f > 28 && this.level > 0 && !(MI && MI.k === 'wide');
    this.noDrift = (this.noDrift || 0) - dt;
    if (want && !this.hold && this.noDrift <= 0) { this.hold = true; this.dir = Math.sign(kd); }
    if (this.hold && (Math.abs(kd) < 0.005 || (c.drift.on && err * c.drift.dir < -0.3) || (!c.drift.on && c.drift.armT <= 0 && !want))) this.hold = false;
    inp.drift = this.hold;
    let steer = clamp(err * 2.6 + derr * 0.18, -1, 1);
    if (this.hold && !c.drift.on) steer = this.dir;
    if (c.drift.on) steer = c.drift.dir * clamp(0.25 + err * c.drift.dir * 4 + derr * c.drift.dir * 0.2, -1, 1);
    // no irse contra la pared: corregir y soltar el derrape
    // mira 0.4 s adelante: si va a rozar la pared, corrige antes (también en el agua)
    const lim = T.limits(c.s), edge = lim.wall - 1.0, sv = Math.sign(c.vu), fut = (c.u + c.vu * 0.55) * sv;
    if (fut > edge - 0.8 && Math.abs(c.vu) > 0.6) { steer = -sv * clamp(0.45 + (fut - edge + 0.8) * 0.35, 0.45, 1); if ((c.drift.on || this.hold) && (c.drift.on ? c.drift.dir : this.dir) === sv) { this.hold = false; inp.drift = false; this.noDrift = 0.7; } }
    if (MI && MI.k === 'wobble') steer = clamp(steer + Math.sin(MI.t * 13) * 0.65, -1, 1);
    inp.steer = steer; inp.down = (brake && !c.drift.on) || !!(MI && MI.k === 'lift');
    // objetos
    this.itemCD = (this.itemCD || 0) - dt; if (c.item) this.holdT = (this.holdT || 0) + dt; else this.holdT = 0;
    if (c.item && !(c.rollT > 0) && this.itemCD <= 0 && this.level > 0) {
      const k = c.item, ah = Items.ahead(R, c, R.boss ? 80 : 50), bh = Items.behind(R, c, 30); let use = false, back = false;
      if ((k === 'rocket' || k === 'rocket3') && ah && Math.abs(ah.u - c.u) < (ah.isBoss ? 9 : 2.6)) use = true;
      else if (k === 'rocket' && bh && !ah && Math.abs(bh.u - c.u) < 2) { use = true; back = true; }
      else if ((k === 'oil' || k === 'coco' || k === 'fog') && bh) use = true;
      else if (['shield', 'chile', 'emerald', 'wasp', 'bolt'].includes(k)) use = this.holdT > 0.6;
      else if (k === 'magnet' && Items.ahead(R, c, 140)) use = true;
      if (this.holdT > 9) use = true;
      if (use) { inp.item = !c.prev.item; inp.down = inp.down || back; this.itemCD = 0.5; }
    } else if (!c.item && c.gem >= 4 && this.level > 0 && c.grounded && this.itemCD <= 0) { inp.item = !c.prev.item; this.itemCD = 1; }
    this.turboCD -= dt;
    let straight = true; for (let j = 0; j < Math.round(120 / ds); j += 3) if (Math.abs(T.kap[(k0 + j) % N]) > 0.006) straight = false;
    if (this.turboCD <= 0 && c.gem >= (this.level > 1 ? 2.2 : 1.2) && c.gem < 3.6 && straight && c.boostT <= 0) { inp.turbo = true; this.turboCD = 4 + Math.random() * 4; }
    return inp;
  }
}

class Race {
  constructor(trackId, cfg) {
    this.track = getTrack(trackId); const T = this.track; this.cfg = cfg; this.laps = cfg.laps || TRACKS[trackId].laps;
    for (const g of T.gems) g.gone = 0;
    this.hz = []; this.boxes = T.boxes.map(b => Object.assign({ gone: 0 }, b));
    this.time = 0; this.events = []; this.state = 'count'; this.countT = cfg.countT != null ? cfg.countT : 3.6; this.humans = cfg.humans.length;
    const list = cfg.humans.map(pid => ({ pid, human: true })).concat((cfg.bots || []).map(b => ({ pid: b.pid || b, level: b.level != null ? b.level : 1, skill: b.skill })));
    this.cars = list.map((e, i) => {
      const row = Math.floor(i / 2), side = i % 2 ? 1 : -1, s = T.wrap(-22 - row * 11 - (i % 2) * 4), c = new Car(this, i, e.pid, s, side * 3.2);
      if (!e.human) { c.bot = new Bot(e.level, e.skill); c.vmax *= botVmaxK(c.bot.skill); } else c.human = i; c.startPress = -9; return c;
    });
    this.order = this.cars.slice();
    /* ritmos repartidos entre los rivales (barajados): no todos van igual, la carrera se estira */
    { const bots = this.cars.filter(c => c.bot); for (let i = bots.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bots[i], bots[j]] = [bots[j], bots[i]]; }
      bots.forEach((c, i) => { const sp = lerp(0.09, 0.05, c.bot.skill), p = bots.length > 1 ? 1 - sp * i / (bots.length - 1) : 1 - sp / 2; c.bot.pace = p; c.vmax *= p; }); }
    // reglas del modo (eliminación, batalla, escuela)
    this.rules = cfg.rules ? cfg.rules(this) : null; if (this.rules && this.rules.init) this.rules.init(this);
  }
  step(dt) {
    this.events.length = 0; const T = this.track; T.time += dt;
    if (this.state === 'count') {
      this.countT -= dt; const n = Math.ceil(this.countT);
      if (n !== this._lastN && n <= 3 && n > 0) this.events.push({ type: 'count', n }); this._lastN = n;
      for (const c of this.cars) { const inp = c.bot ? {} : Input.read(c.human); if (inp.turbo && !c.prev.turbo) c.startPress = this.countT; c.prev = Object.assign({}, inp); }
      if (this.countT <= 0) {
        this.state = 'race'; this.events.push({ type: 'go' });
        for (const c of this.cars) { const ok = c.bot ? c.bot.level > 0 && Math.random() < 0.5 : c.startPress > 0 && c.startPress < 0.42; if (ok) { c.boost(1.1, 1.1); this.events.push({ type: 'perfectStart', car: c.idx }); } }
      }
    } else this.time += dt;
    for (const c of this.cars) {
      if (c.out) continue;
      const inp = c.bot ? (this.state === 'race' ? ((c.bot.tick = (c.bot.tick || 0) + 1) % 2 && c.bot.last ? c.bot.last : (c.bot.last = c.bot.think(this, c, dt * 2))) : {}) : c.finished ? (c.auto || (c.auto = new Bot(1))).think(this, c, dt) : (this.state === 'race' ? Input.read(c.human) : {});
      c.step(dt, Object.assign({ steer: 0, up: false, down: false, drift: false, item: false, turbo: false }, inp));
    }
    this.collide(dt); this.draft(dt); Items.step(this, dt); const RU = this.rules; if (RU && RU.step) RU.step(this, dt);
    // ayuda de remontada suave (declarada): la máquina va un poquito más rápido si va lejos detrás de los jugadores, y un poquito más lenta si va muy adelante
    const hum = this.cars.filter(c => !c.bot); if (hum.length && !(RU && RU.noRubber)) { const ref = Math.max(...hum.map(c => c.progress)), lo = Math.min(...hum.map(c => c.progress)); for (const c of this.cars) if (c.bot) c.rubber = c.progress < lo ? clamp((lo - c.progress - 120) / 500, 0, 0.05) : c.progress > ref ? -clamp((c.progress - ref - 90) / 350, 0, 0.08) : 0; } /* los que van muy adelante aflojan (se puede remontar); los de atrás solo se acercan si quedaron muy lejos: un error no hace que todos te pasen */
    for (const g of T.gems) if (g.gone > 0) g.gone = Math.max(0, g.gone - dt);
    this.order = RU && RU.order ? RU.order(this) : this.cars.slice().sort((a, b) => (b.finished - a.finished) || (a.finished && b.finished ? a.finishT - b.finishT : b.progress - a.progress));
    this.order.forEach((c, i) => { c.place = i + 1; });
    if (this.state === 'race' && (RU && RU.done ? RU.done(this) : (this.humans ? this.cars.filter(c => !c.bot) : this.cars).every(c => c.finished))) { this.state = 'done'; this.doneT = 0; this.events.push({ type: 'raceDone' }); }
    if (this.state === 'done') this.doneT += dt;
  }
  collide(dt) {
    const T = this.track, C = this.cars;
    for (let i = 0; i < C.length; i++) for (let j = i + 1; j < C.length; j++) {
      const a = C[i], b = C[j]; if (a.out || b.out || a.respawnT > 0 || b.respawnT > 0 || Math.abs(a.h - b.h) > 1.8) continue;
      let ds = T.wrap(b.s - a.s + T.L / 2) - T.L / 2; const du = b.u - a.u;
      const nx = ds / 2.15, ny = du / 1.15, d = Math.hypot(nx, ny); // elipse: largos 4,3 m, anchos 2,3 m
      if (d >= 1 || d < 1e-4) continue;
      const W = c => c.wt * (c.specT > 0 && (c.pid === 'country' || c.pid === 'cumbia') ? 5 : 1), ux = nx / d, uy = ny / d, push = (1 - d), wa = W(b) / (W(a) + W(b)), wb = 1 - wa;
      a.s = T.wrap(a.s - ux * push * 2.15 * wa); b.s = T.wrap(b.s + ux * push * 2.15 * wb); a.u -= uy * push * 1.15 * wa; b.u += uy * push * 1.15 * wb;
      const rv = (b.vs - a.vs) * ux + (b.vu - a.vu) * uy;
      if (rv < 0) { const imp = -rv * 1.25; a.vs -= ux * imp * wa; a.vu -= uy * imp * wa; b.vs += ux * imp * wb; b.vu += uy * imp * wb; if (imp > 3) this.events.push({ type: 'bump', car: a.idx, other: b.idx, imp }); if (this.rules && this.rules.onBump) this.rules.onBump(this, a, b, imp); }
    }
  }
  draft(dt) {
    const T = this.track;
    for (const c of this.cars) {
      if (c.out || !c.grounded || c.f < 30) { c.draftT = Math.max(c.draftT, 0) * 0.9; continue; }
      let ok = false; for (const o of this.cars) { if (o === c || o.out) continue; const d = T.wrap(o.s - c.s); if (d > 4 && d < 26 && Math.abs(o.u - c.u) < 2.6) ok = true; }
      const B = this.boss; if (!ok && B && !B.out && !B.def.fly) { const d = T.wrap(B.s - B.len / 2 - c.s); if (d > 3 && d < 30 && Math.abs(B.u - c.u) < B.w / 2 + 1.2) ok = true; } // rebufo detrás del jefe
      /* el rebufo de la máquina es más corto y espaciado: si no, todos se pegan en fila y nadie se separa */
      if (c.draftT < 0) c.draftT += dt; else if (ok) { c.draftT += dt; if (c.draftT > (c.bot ? 1.7 : 1.0)) { c.boost(c.bot ? 0.45 : 0.8); c.addGem(0.1); c.draftT = c.bot ? -4 : -1.5; this.events.push({ type: 'draft', car: c.idx }); } } else c.draftT = Math.max(0, c.draftT - dt);
    }
  }
}
