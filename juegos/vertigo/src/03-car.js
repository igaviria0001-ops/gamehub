/* =========================================================================
   BÓLIDO — física en coordenadas de pista (s, u, h).
   Velocidad en el plano de la pista (vs, vu) y rumbo a relativo a la pista;
   al avanzar, el marco gira con la curvatura y el rumbo se corrige solo.
   Agarre lateral (se pierde al derrapar), derrape de tres colores, brinco,
   saltos con piruetas, aterrizaje limpio = turbo, barra Esmeralda (0–4),
   turbo, rebufo, paredes, plataformas de impulso y esmeraldas.
   ========================================================================= */
const G_ACC = 30; // gravedad de juego (m/s²): saltos ágiles, no flotantes
const DRIFT_LV = [0.55, 1.25, 2.15]; // segundos de carga para azul, naranja, esmeralda
const DRIFT_BOOST = [0.5, 0.9, 1.35];
const DRIFT_GEM = [0.15, 0.3, 0.5];
const PILOTS = {
  cumbia: { name: 'Cumbia', from: 'Colombia', car: 'Marimonda', vel: 3, acc: 3, han: 3, wt: 3, color: '#ff3d6e', color2: '#ffd23d', accent: '#19c3ff' },
  salsa: { name: 'Salsa', from: 'Cuba', car: 'La Sabrosura', vel: 3, acc: 4, han: 5, wt: 1, air: 4, color: '#ff7a1a', color2: '#fff3d6', accent: '#ff2a55' },
  taiko: { name: 'Taiko', from: 'Japón', car: 'Oni', vel: 4, acc: 2, han: 3, wt: 4, color: '#1c1c24', color2: '#e8202a', accent: '#f2f2f2' },
  freestyle: { name: 'Freestyle', from: 'Nueva York', car: 'Boombox', vel: 5, acc: 3, han: 2, wt: 2, color: '#7a3cff', color2: '#ffe14a', accent: '#21e0ff' },
  country: { name: 'Country', from: 'Texas', car: 'Longhorn', vel: 3, acc: 2, han: 2, wt: 5, air: 2, water: 4, color: '#8a4a1e', color2: '#e8d2a6', accent: '#2c6cb0' },
  reggae: { name: 'Reggae', from: 'Jamaica', car: 'Irie', vel: 3, acc: 4, han: 4, wt: 2, water: 5, color: '#1aa34a', color2: '#ffd400', accent: '#e8202a' },
  flamenco: { name: 'Flamenco', from: 'España', car: 'Volante', vel: 4, acc: 3, han: 4, wt: 1, air: 5, color: '#d4142a', color2: '#1a1a1a', accent: '#ffcf3a' },
  samba: { name: 'Samba', from: 'Brasil', car: 'Carioca', vel: 4, acc: 5, han: 3, wt: 1, color: '#ffd400', color2: '#00a85a', accent: '#1a3cff' },
};
const PILOT_ORDER = ['cumbia', 'salsa', 'taiko', 'freestyle', 'country', 'reggae', 'flamenco', 'samba'];

class Car {
  constructor(race, idx, pid, s, u) {
    const P = PILOTS[pid]; this.race = race; this.idx = idx; this.pid = pid; this.P = P;
    this.vmax = 52 + 2.4 * P.vel; this.acc = 14 + 3 * P.acc; this.turn = 1.3 + 0.1 * P.han; this.grip = 7.5 + 0.9 * P.han; this.wt = 0.7 + 0.15 * P.wt;
    this.chargeK = pid === 'samba' ? 1.3 : 1; this.trickK = pid === 'salsa' ? 1.5 : 1;
    this.waterK = 1 + ((P.water || 3) - 3) * 0.04; this.airK = 1 + ((P.air || 3) - 3) * 0.05; this.mode = 'road'; this.vsurf = 0; this.ringT = 0;
    this.item = null; this.itemN = 0; this.rollT = 0; this.shieldT = 0; this.magnetT = 0; this.invT = 0; this.specT = 0; this.fogT = 0; this.rubber = 0;
    this.s = s; this.u = u; this.h = 0; this.vs = 0; this.vu = 0; this.vn = 0; this.a = 0; this.steerS = 0;
    this.grounded = true; this.airT = 0; this.drift = { on: false, dir: 0, t: 0, lv: 0, armT: 0 }; this.hopT = 0;
    this.boostT = 0; this.boostK = 1; this.gem = 1; this.trick = null; this.tricks = 0; this.wobT = 0; this.spinT = 0; this.safeS = s;
    this.lap = 0; this.half = false; this.lapT = 0; this.laps = []; this.best = 0; this.finished = false; this.finishT = 0; this.respawnT = 0; this.place = idx + 1;
    this.draftT = 0; this.offroad = false; this.wallT = 0; this.prev = {}; this.f = 0; this.l = 0; this.roll = 0; this.pitch = 0; this.ev = [];
    this.stats = { drifts: 0, tricks: 0, gems: 0, walls: 0, topSpeed: 0 };
  }
  get speed() { return this.f; }
  get progress() { return this.lap * this.race.track.L + this.s; }
  emit(type, o = {}) { this.race.events.push(Object.assign({ type, car: this.idx }, o)); }
  addGem(v) { const was = this.gem; this.gem = Math.min(4, this.gem + v); if (Math.floor(this.gem) > Math.floor(was)) this.emit('gemSeg', { n: Math.floor(this.gem) }); }
  boost(t, k = 1) { this.boostT = Math.max(this.boostT, 0) + t; this.boostK = Math.max(this.boostK, k); this.emit('boost', { t }); }
  step(dt, inp) {
    const R = this.race, T = R.track; let o = T.at(this.s);
    const pv = this.prev, press = k => inp[k] && !pv[k];
    if (this.respawnT > 0) { this.respawnT -= dt; if (this.respawnT <= 0) this.respawn(); this.prev = Object.assign({}, inp); return; }
    const racing = R.state === 'race' && !this.finished;
    // descomponer velocidad en adelante / lado según el rumbo
    const ca = Math.cos(this.a), sa = Math.sin(this.a);
    let f = this.vs * ca + this.vu * sa, l = -this.vs * sa + this.vu * ca;
    this.steerS = damp(this.steerS, inp.steer, 14, dt);
    const st = this.steerS, lim = T.limits(this.s);
    this.offroad = this.grounded && Math.abs(this.u) > lim.road + 0.4;
    if (this.boostT > 0) { this.boostT -= dt; if (this.boostT <= 0) { this.boostT = 0; this.boostK = 1; } }
    if (this.wobT > 0) this.wobT -= dt; if (this.spinT > 0) this.spinT -= dt; if (this.hopT > 0) this.hopT -= dt;
    const water = T.zone(this.s, 'water'), airZ = T.zone(this.s, 'air');
    const boosting = this.boostT > 0, target = this.vmax * (boosting ? 1.28 * (this.boostK > 1 ? 1.06 : 1) : 1) * (this.offroad && !boosting ? 0.62 : 1) * (this.wobT > 0 ? 0.8 : 1) * (water ? 0.93 * this.waterK : 1) * (1 + this.rubber);
    if (this.grounded) {
      // ---- derrape ----
      const D = this.drift;
      if (inp.drift && !pv.drift) D.armT = 0.22; else if (D.armT > 0) D.armT -= dt;
      if (!D.on && inp.drift && D.armT > 0 && Math.abs(st) > 0.3 && f > 13 && racing) { D.on = true; D.dir = Math.sign(st); D.t = 0; D.lv = 0; this.hopT = 0.16; this.emit('driftStart'); }
      if (D.on) {
        D.t += dt * this.chargeK * (0.65 + 0.35 * Math.abs(st));
        const lv = D.t > DRIFT_LV[2] ? 3 : D.t > DRIFT_LV[1] ? 2 : D.t > DRIFT_LV[0] ? 1 : 0;
        if (lv > D.lv) { D.lv = lv; this.emit('driftLv', { lv }); }
        if (!inp.drift || f < 9 || this.offroad && f < 20) {
          if (D.lv > 0 && f >= 9) { this.boost(DRIFT_BOOST[D.lv - 1]); this.addGem(DRIFT_GEM[D.lv - 1]); this.stats.drifts++; this.emit('driftBoost', { lv: D.lv }); }
          D.on = false; D.lv = 0;
        }
      }
      // ---- giro ----
      const sf = clamp(f / 14, 0, 1) * (1 - 0.3 * clamp(f / this.vmax, 0, 1.2)) * (f < 0 ? -1 : 1);
      let w;
      if (D.on) w = D.dir * this.turn * (0.62 + 0.5 * clamp(st * D.dir, -1, 1)) * Math.max(0.4, sf);
      else w = st * this.turn * sf;
      // ayuda en horquillas: si giras hacia adentro y el giro no alcanza para seguir la curva, gira un poco más pero pierde velocidad
      const need = o.kap * f;
      if (this.spinT <= 0 && st * need > 0 && Math.abs(st) > 0.45 && Math.abs(need) > 0.6 && Math.abs(w) < Math.abs(need) * 1.08) {
        const ex = Math.min(Math.abs(need) * 1.08 - Math.abs(w), Math.abs(need) * 0.5) * clamp((Math.abs(st) - 0.45) * 2.5, 0, 1);
        w += ex * Math.sign(need); f -= 16 * (ex / Math.abs(need)) * dt;
      }
      if (this.spinT > 0) w = 7;
      this.a += w * dt;
      // ---- motor y frenos ----
      const braking = inp.down && racing;
      if (!racing && R.state !== 'race') { /* parrilla: quieto */ f = damp(f, 0, 3, dt); }
      else if (braking) { f -= (f > 0 ? 34 : 8) * dt; if (f < -9) f = -9; }
      else if (f < target) f += this.acc * (1 - Math.max(0, f) / target) * (boosting ? 2.2 : 1) * dt + (boosting ? 6 * dt : 0);
      else f -= (f - target) * (this.offroad ? 2.4 : 1.2) * dt;
      if (this.finished) f = damp(f, 22, 0.8, dt);
      // ---- agarre lateral ----
      const ice = T.zone(this.s, 'ice');
      const grip = water ? (D.on ? 2.4 : this.grip * 0.42 * this.waterK) : ice ? (D.on ? 2.0 : this.grip * 0.32) : D.on ? 3.4 : this.offroad ? this.grip * 0.55 : this.grip;
      if (water && water.current && this.grounded) f += water.current * Math.max(0, Math.cos(this.a)) * dt; // corriente del río a favor
      l *= Math.exp(-grip * dt);
      if (D.on) f -= 1.2 * dt; // el derrape cuesta un poquito
    } else {
      // en el aire: un poco de control y piruetas; en el tramo de vuelo, ala desplegada y planeo
      this.airT += dt;
      if (airZ || (this.specT > 0 && this.pid === 'flamenco')) {
        const pitch = (inp.up ? -1 : 0) + (inp.down ? 1 : 0), tgt = pitch < 0 ? -9 : pitch > 0 ? 3.2 : -2.5;
        this.vn = damp(this.vn, tgt, 2.6, dt); if (this.h > 18 && this.vn > 0) this.vn *= 0.9;
        if (pitch < 0) f = Math.min(f + 13 * dt, this.vmax * 1.32 * this.airK); else if (pitch > 0) f = Math.max(26, f - 10 * dt); else f = damp(f, this.vmax * 1.06 * this.airK, 0.35, dt);
        if (boosting) f = Math.min(f + 20 * dt, this.vmax * 1.45 * this.airK);
        // vuelo más natural: gira como avión (sin patinar de lado) y, sin tocar nada, se endereza solo hacia el camino
        this.a += st * this.turn * 0.8 * dt; l *= Math.exp(-7 * dt); if (Math.abs(st) < 0.1) this.a = damp(this.a, 0, 0.7, dt);
      } else this.a += st * 0.9 * dt;
      if (press('drift') && this.airT > 0.08 && (!this.trick || this.trick.t > 0.36)) {
        const kind = inp.up ? 'flip' : inp.down ? 'back' : st > 0.4 ? 'rollR' : st < -0.4 ? 'rollL' : 'spin';
        this.trick = { kind, t: 0, dur: 0.42 }; this.tricks++; this.emit('trick', { kind, n: this.tricks });
      }
      if (this.trick) this.trick.t += dt;
      if (!airZ) f -= 0.004 * f * dt;
    }
    if (this.drift.on && !this.grounded && this.airT > 0.3) { this.drift.on = false; this.drift.lv = 0; }
    // ---- turbo ----
    if (press('turbo') && racing && this.gem >= 1) { this.gem -= 1; this.boost(1.3); this.emit('turbo'); }
    if (press('item') && racing) Items.use(R, this, inp);
    // ---- recomponer y avanzar ----
    const c2 = Math.cos(this.a), s2 = Math.sin(this.a);
    this.vs = f * c2 - l * s2; this.vu = f * s2 + l * c2; this.f = f; this.l = l;
    const den = Math.max(0.3, 1 - o.kap * this.u), ds = this.vs / den * dt, sPrev = this.s;
    this.s = T.wrap(this.s + ds); this.u += this.vu * dt;
    // saltos cortos (olas, rampas) en curva: en el aire el bólido acompaña la curva en vez de salir recto contra la pared
    const dth = o.kap * ds * (!this.grounded && !airZ ? 0.2 : 1), cd = Math.cos(dth), sd = Math.sin(dth);
    const nvs = this.vs * cd + this.vu * sd, nvu = -this.vs * sd + this.vu * cd; this.vs = nvs; this.vu = nvu; this.a = angWrap(this.a - dth);
    o = T.at(this.s);
    // ---- vuelta ----
    if (Math.abs(this.s - T.L / 2) < 40) this.half = true;
    if (sPrev > T.L - 60 && this.s < 60 && ds > 0) { if (this.half) { this.half = false; this.lapDone(); } }
    // ---- altura: pegado, despegue, rampas, abismos ----
    const gap = T.zone(this.s, 'gap'), inAir = T.zone(this.s, 'air'), inWater = T.zone(this.s, 'water');
    const gH = T.groundH(this.s, this.u);
    if (this.grounded) {
      if (inWater) { const vsf = (gH - this.h) / dt; if (this.vsurf > 2.5 && vsf < this.vsurf - G_ACC * dt * 1.2 && f > 20) { this.vn = this.vsurf; this.takeoff('wave'); } else { this.h = gH; this.vn = 0; } this.vsurf = clamp(vsf, -30, 30); }
      else { this.h = gH; this.vn = 0; this.vsurf = 0; }
      for (const g of (R.allGeysers || T.geysers)) if (this.grounded && T.geyserOn(g) === 1 && Math.abs(T.wrap(this.s - g.s + T.L / 2) - T.L / 2) < g.r && Math.abs(this.u - g.u) < g.r) { this.vn = 13; this.takeoff('geyser'); }
      for (const r of T.ramps) if (sPrev < r.s && this.s >= r.s && ds > 0 && Math.abs(this.u) < lim.road + 1) { this.vn = Math.max(3, f * Math.tan(r.angle * Math.PI / 180)); this.takeoff(r.big ? 'bigRamp' : 'ramp'); }
      if (this.grounded && !inWater) {
        const need = G_ACC * o.uy + f * f * o.kapV;
        if (need < -2 || gap || inAir) { this.vn = 0; this.takeoff(gap ? 'gap' : 'crest'); }
      }
    }
    if (!this.grounded) {
      if (!inAir) this.vn += (-G_ACC * o.uy - f * f * o.kapV) * dt;
      this.h += this.vn * dt;
      if (inAir) { if (o.py + o.uy * this.h < T.lakeY + 0.4 || this.h < -16) this.fall(); }
      else if (this.h <= gH && !gap) { if (gH - this.h > 4 && !inWater) this.fall(); else { this.h = gH; this.land(); } }
      else if (gap && this.h < -9) { this.fall(); }
    } else if (!gap && !inAir) this.safeS = this.s;
    // aros del vuelo: atravesarlos da turbo y barra
    if (inAir) for (const r of T.rings) if (sPrev < r.s && this.s >= r.s && ds > 0 && Math.hypot(this.u - r.u, this.h - r.h) < (r.big ? 4.4 : 3.3)) { this.boost(r.big ? 1.2 : 0.8, 1.06); this.addGem(0.3); this.stats.rings = (this.stats.rings || 0) + 1; this.emit('ring', { big: r.big }); }
    // modo del bólido (ruedas, lancha, ala)
    const mode = (inAir || (this.specT > 0 && this.pid === 'flamenco')) && !this.grounded ? 'air' : inWater || (this.mode === 'water' && !this.grounded) ? 'water' : 'road';
    if (mode !== this.mode) { this.mode = mode; this.emit('mode', { mode }); }
    // ---- paredes ----
    const wall = lim.wall - 1.0;
    if (Math.abs(this.u) > wall && (this.h - gH < 3 || inAir)) {
      const sg = Math.sign(this.u); this.u = sg * wall;
      const into = this.vu * sg;
      if (into > 0 && inAir) { this.vu = -this.vu * 0.3; this.a = damp(this.a, -sg * 0.15, 6, dt); } // en el aire el borde es un cojín suave: no frena ni golpea
      else if (into > 0) {
        const hit = into; this.vu = -this.vu * 0.25;
        const k = clamp(hit / 70, 0.02, 0.32) * (lim.water ? 0.5 : 1); this.vs *= 1 - k; this.a *= lim.water ? 0.75 : 0.55;
        if (hit > 4) { this.wallT = 0.2; this.stats.walls++; this.emit('wall', { hit, side: sg }); if (hit > 10 && this.drift.on) { this.drift.on = false; this.drift.lv = 0; } }
      }
    }
    // ---- plataformas de impulso y esmeraldas ----
    if (this.grounded) for (const p of T.pads) if (Math.abs(T.wrap(this.s - p.s + T.L / 2) - T.L / 2) < 2.2 && Math.abs(this.u - p.u) < 2.6) { if (this.boostT < 0.9) { this.boost(1.0, 1.1); this.emit('pad'); } }
    for (const g of T.gems) if (!(g.gone > 0) && Math.abs(T.wrap(this.s - g.s + T.L / 2) - T.L / 2) < 2.6 && Math.abs(this.u - g.u) < 2.6 && Math.abs(this.h - T.groundH(g.s, g.u)) < 4) { /* antes «!g.gone»: al reaparecer el contador quedaba negativo y la esmeralda se veía pero no se podía coger */ g.gone = 6; this.addGem(0.25 * (R.rules && R.rules.gemK || 1)); this.stats.gems++; this.emit('gem', { s: g.s, u: g.u }); }
    // ---- inclinación para el dibujo ----
    this.roll = damp(this.roll, this.mode === 'air' ? st * 0.5 : clamp(l * 0.03 - (this.drift.on ? this.drift.dir * 0.12 : 0), -0.35, 0.35), this.mode === 'air' ? 4 : 8, dt);
    this.pitch = damp(this.pitch, this.grounded ? (inWater ? clamp(-this.vsurf * 0.02, -0.2, 0.2) : 0) : clamp(-this.vn * (this.mode === 'air' ? 0.03 : 0.012), -0.35, 0.35), 6, dt);
    if (racing) this.lapT += dt;
    this.stats.topSpeed = Math.max(this.stats.topSpeed, f);
    this.prev = Object.assign({}, inp);
  }
  takeoff(why) { this.grounded = false; this.airT = 0; this.tricks = 0; this.trick = null; if (why !== 'crest' || this.f > 30) this.emit('takeoff', { why }); }
  land() {
    const hard = -this.vn; this.vn = 0; this.grounded = true;
    const tr = this.trick;
    if (tr && tr.t < tr.dur) { this.wobT = 0.7; this.vs *= 0.75; this.emit('landBad'); }
    else if (this.tricks > 0) { const n = this.tricks, k2 = this.specT > 0 && this.pid === 'salsa' ? 2 : 1; this.boost(Math.min(1.8, 0.55 * n) * k2); this.addGem(0.3 * n * this.trickK * k2); this.stats.tricks += n; this.emit('landTrick', { n }); }
    else if (this.airT > 0.25) this.emit('land', { hard });
    this.trick = null; this.tricks = 0; this.airT = 0;
  }
  fall() { this.respawnT = 1.2; this.emit('fall'); this.drift.on = false; }
  respawn() {
    const T = this.race.track; this.s = T.wrap(this.safeS - 25); this.u = 0; this.h = 0; this.vn = 0; this.a = 0; this.vs = 24; this.vu = 0; this.grounded = true; this.boostT = 0.6; this.emit('respawn');
    for (let k = 0; k < 80 && (T.zone(this.s, 'gap') || T.zone(this.s, 'air')); k++) this.s = T.wrap(this.s - 5);
    this.mode = T.zone(this.s, 'water') ? 'water' : 'road'; this.vsurf = 0;
  }
  lapDone() {
    const R = this.race; this.laps.push(this.lapT); if (!this.best || this.lapT < this.best) this.best = this.lapT;
    this.lap++; this.lapT = 0; this.emit('lap', { lap: this.lap });
    if (this.lap >= R.laps && !this.finished) { this.finished = true; this.finishT = R.time; this.emit('finish'); }
  }
}
