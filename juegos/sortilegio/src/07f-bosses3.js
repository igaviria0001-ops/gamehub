/* =========================================================================
   JEFES DEL MUNDO 3 y el orden final de sus niveles.
   · c21 Kitsune (Fushimi Inari): ENGAÑO. Fuego de zorro que persigue,
     se esfuma entre las linternas y, herida, se multiplica en ilusiones.
     Las ilusiones no tienen sombra; la LUZ las deshace y deja a la de
     verdad al descubierto. Además pelea por la estación: en invierno su
     fuego de zorro se apaga a medias, así que ella vuelve el torii al verano.
   · c24 Raijin y Fujin (sobre el Fuji): COORDINACIÓN Y RITMO. Atacan al
     compás del tambor (rayos en el 1 y el 3, ventarrón en el 4). Juntos se
     protegen: hay que separarlos. Si cae uno, se levanta a los 12 s… a
     menos que el otro caiga también.
   · c26 Orochi y el Borrón (río Hi, Izumo): GIGANTE Y ESTRATEGIA. Ocho
     cabezas, cada una de un elemento (y débil a su contrario). Las tinajas
     de sake las emborrachan (duermen y reciben el doble). Sin cabezas, de
     la cola sale el Borrón: tormenta de tinta, fosas y copias de tinta de
     los magos. Su coraza solo cede ante la LUZ.
   ========================================================================= */
const W3B = (() => {
  const { say, wave, pop, live, foes, rect, circ, ell, border, bushes, path, S, all, look, isEl, sea, st } = W3;
  const solo = G => G.players === 1 ? 0.75 : 1;
  const nearest = (G, b) => { let t = null, bd = 1e9; for (const m of G.mages) if (m.alive) { const d = hypot(m.x - b.x, m.y - b.y); if (d < bd) { bd = d; t = m; } } return [t, bd]; };
  // proyectil enemigo
  function shot(G, x, y, a, o) { const sp = o.speed || 380; G.spells.push(Object.assign({ t: 'proj', id: -80 - ((G.rng() * 1000) | 0), age: 0, S: { dmg: o.dmg || 8, speed: sp, r: o.r || 12, life: o.life || 1.8 }, by: -1, team: 9, el: o.el || 'fire', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: o.r || 12, life: o.life || 1.8, dmg: o.dmg || 8, power: 1, size: 1 }, o.extra || {})); }
  // armar un jefe del Mundo 3
  function make(G, k, x, y, o = {}) {
    const D = Camp.BOSS[k], b = new Unit(x, y, D.r, 9);
    Object.assign(b, { w3: 1, w3boss: k, boss: k, D, idx: -1, hp: D.hp * solo(G), maxHp: D.hp * solo(G), shield: 0, maxShield: 0, t: 0, phase: 0, knockMul: 0.06, el: D.el, stunRes: 0.3, keep: true }, o);
    b.stun = function (t) { Unit.prototype.stun.call(this, t * (this._selfStun ? 1 : this.stunRes)); };
    b.hurt = function (G2, dmg, src = {}) {
      if (!this.alive || dmg <= 0 || this.down || (this.untargetable && this.w3boss === 'ohead')) return 0; let d = dmg * (this.hurtK ? this.hurtK(G2, src) : 1); if (d <= 0) return 0;
      if (G2.sea && src.el) d *= Seasons.mult(G2, this.x, this.y, src.el);
      if (this.shield > 0) { if (this.shieldEl && !isEl(src, this.shieldEl)) { if (!src.dot && G2.time - (this.denyT || -9) > 3) { this.denyT = G2.time; pop(G2, this.x, this.y - 150, this.shieldMsg || 'Esa coraza solo cede ante la LUZ', '#e6d8ff', { small: true }); } return 0; } this.shield -= d; this.flash = 0.08; if (this.shield <= 0) { this.shield = 0; if (this.onBreak) this.onBreak(G2); } return 0; }
      this.hp -= d; this.flash = 0.1; if (src.by >= 0 && G2.mages[src.by]) { G2.mages[src.by].stats.dmg += d; G2.mages[src.by].gainEmb(G2, d * 0.3); }
      G2.events.push({ type: 'hurt', x: this.x, y: this.y - 40, dmg: d, el: src.el, dot: !!src.dot, who: -1, unit: this });
      if (this.hp <= 0) { this.hp = 0; if (this.onZero && this.onZero(G2) === false) return d; this.alive = false; G2.events.push({ type: 'bossDown', x: this.x, y: this.y, k: this.boss }); G2.fx.push({ type: 'boom', x: this.x, y: this.y - 30, r: 160, el: this.el }); G2.slow = 1.2; }
      return d;
    };
    b.warn = (t, el, fn, extra) => { b.tele = Object.assign({ t, max: t, el, fn }, extra || {}); G.events.push({ type: 'bossWarn', x: b.x, y: b.y, el }); };
    return b;
  }
  function moveTo(G, b, tx, ty, sp, dt) { const dx = tx - b.x, dy = ty - b.y, d = hypot(dx, dy) || 1, k = 1 - Math.exp(-5 * dt); b.vx += (dx / d * sp * Math.min(1, d / 60) - b.vx) * k; b.vy += (dy / d * sp * Math.min(1, d / 60) - b.vy) * k; b.x += b.vx * dt; b.y += b.vy * dt; b.collide(G.T); }
  function tele(G, b, dt) { if (!b.tele) return false; b.tele.t -= dt; b.vx *= 0.85; b.vy *= 0.85; if (b.tele.t <= 0) { const f = b.tele.fn; b.tele = null; f(); } return true; }

  /* =================== KITSUNE =================== */
  Object.assign(Camp.BOSS, {
    kitsune: { name: 'Kitsune de nueve colas', hp: 1300, r: 30, look: 'kitsune', el: 'fire', w3: 1 },
    kclone: { name: 'Ilusión', hp: 1, r: 30, look: 'kitsune', el: 'fire', w3: 1 },
    raijin: { name: 'Raijin, el del trueno', hp: 620, r: 34, look: 'raijin', el: 'bolt', w3: 1 },
    fujin: { name: 'Fujin, el del viento', hp: 620, r: 34, look: 'fujin', el: 'wind', w3: 1 },
    orochi: { name: 'Yamata no Orochi', hp: 1, r: 60, look: 'orochi', el: 'shadow', w3: 1 },
    ohead: { name: 'Cabeza', hp: 150, r: 26, look: 'ohead', el: 'fire', w3: 1 },
    borron: { name: 'El Borrón', hp: 500, r: 50, look: 'borron', el: 'shadow', w3: 1 },
  });
  const KSPOTS = [[360, 300], [1440, 300], [360, 820], [1440, 820], [900, 260], [600, 560], [1200, 560]];
  function kitsuneSpawn(G) {
    const b = make(G, 'kitsune', 1200, 520); b.cd = 2; b.blinkT = 6; b.flipT = 20; b.reveal = 0; G.boss = b; G.units.push(b);
    b.hurtK = (G2, src) => { if (src.el === 'light' && !src.dot) { if (b.reveal <= 0) { G2.fx.push({ type: 'flashRing', x: b.x, y: b.y - 40, el: 'light', r: 110 }); pop(G2, b.x, b.y - 150, '¡Al descubierto!', '#fff2b0', { big: true }); G2.events.push({ type: 'bossExposed', x: b.x, y: b.y }); } b.reveal = 4; } return b.reveal > 0 ? 1.35 : 0.6; };
    b.update = function (G2, dt) { kitsuneStep(G2, this, dt); };
  }
  function cloneAt(G, b, x, y) { const c = make(G, 'kclone', x, y, { hp: 1, maxHp: 1, clone: 1, cd: 1.5 + G.rng() * 2 }); c.hurt = function (G2, dmg, src) { if (!this.alive || dmg <= 0) return 0; this.alive = false; G2.fx.push({ type: 'steam', x: this.x, y: this.y - 30, r: 50 }); G2.fx.push({ type: 'snare', x: this.x, y: this.y }); G2.events.push({ type: 'kitsuneLaugh', x: this.x, y: this.y }); pop(G2, this.x, this.y - 120, '¡Ilusión!', '#ffd8a0', { small: true }); return 0; }; c.update = function (G2, dt) { cloneStep(G2, this, dt); }; G.units.push(c); return c; }
  function foxfire(G, b, n, dmgK = 1) {
    const [m] = nearest(G, b); if (!m) return; const winter = sea(G, b.x, b.y) === 'winter', base = Math.atan2(m.y - b.y, m.x - b.x);
    for (let k = 0; k < n; k++) { const a = base + (k - (n - 1) / 2) * 0.42; shot(G, b.x + Math.cos(a) * 30, b.y - 30 + Math.sin(a) * 20, a, { el: 'fire', dmg: (winter ? 5 : 9) * dmgK, speed: winter ? 190 : 270, r: 13, life: 2.6, extra: { foxfire: 1, home: winter ? 1.2 : 2.2, burnT: winter ? 0 : 1 } }); }
    G.events.push({ type: 'cast', who: -1, el: 'fire', kind: 'proj', x: b.x, y: b.y, level: 1 });
  }
  function kitsuneStep(G, b, dt) {
    b.t += dt; b.tickStatus(G, dt); if (!b.alive) return; if (G.state !== 'play') return; if (b.reveal > 0) b.reveal -= dt;
    const f = 1 - b.hp / b.maxHp, ph = f > 0.66 ? 2 : f > 0.33 ? 1 : 0;
    if (ph > b.phase) { b.phase = ph; G.events.push({ type: 'bossRage', x: b.x, y: b.y, ph }); G.slow = Math.max(G.slow, 0.45);
      const n = ph === 1 ? 3 : 5; for (let k = 0; k < n; k++) { const [x, y] = KSPOTS[(k * 3 + ph) % KSPOTS.length]; cloneAt(G, b, x, y); }
      say(G, ph === 1 ? '¿Cuál de nosotras es la de verdad?' : '¡Mil toriis, mil zorras!', 'kitsune'); say(G, ph === 1 ? '¡Las ilusiones no tienen sombra! Y la luz las deshace.' : '¡Que no los engañe! Busquen la sombra.', 'sumi', 2.6); }
    // la luz deshace las ilusiones cercanas
    for (const s of G.spells) if (!s.dead && s.team === 0 && isEl(s, 'light')) for (const c of G.units) if (c.clone && c.alive && hypot(c.x - s.x, c.y - s.y) < 200) c.hurt(G, 1, { by: s.by, el: 'light' });
    if (b.busy) return;
    // el fuego de zorro (homing): en invierno casi no persigue
    for (const s of G.spells) if (s.foxfire && !s.dead) { const [m] = nearest(G, s); if (m) { const a = Math.atan2(m.y - s.y, m.x - s.x), sp = hypot(s.vx, s.vy), ca = Math.atan2(s.vy, s.vx), na = ca + clamp(angDiff(ca, a), -s.home * dt, s.home * dt); s.vx = Math.cos(na) * sp; s.vy = Math.sin(na) * sp; } }
    if (tele(G, b, dt)) return;
    const [m, d] = nearest(G, b); if (!m) return;
    // pelea por la estación: vuelve el torii al verano
    b.flipT -= dt; const tor = G.sea.toriis[0];
    if (b.flipT <= 0 && G.sea.panels[0].s !== 'summer') { b.flipT = 22 - ph * 4; G.fx.push({ type: 'steam', x: b.x, y: b.y, r: 50 }); b.x = tor.x + 90; b.y = tor.y + 40; G.fx.push({ type: 'steam', x: b.x, y: b.y, r: 50 }); b.warn(0.9, 'fire', () => { Seasons.set(G, 0, 'summer', -1, tor.x, tor.y); tor.glow = 1; say(G, '¡El verano es mío!', 'kitsune'); }); return; }
    if (b.flipT <= 0) b.flipT = 8;
    b.blinkT -= dt * (b.reveal > 0 ? 0 : 1); b.cd -= dt;
    // se esfuma entre las linternas (y si hay ilusiones, se barajan todas)
    if (b.blinkT <= 0) { b.blinkT = 7 - ph; const C = G.units.filter(u => u.clone && u.alive); const spots = KSPOTS.slice().sort(() => G.rng() - 0.5);
      [b, ...C].forEach((u, k) => { G.fx.push({ type: 'steam', x: u.x, y: u.y, r: 50 }); u.x = spots[k % spots.length][0] + (G.rng() - 0.5) * 60; u.y = spots[k % spots.length][1] + (G.rng() - 0.5) * 60; u.vx = u.vy = 0; G.fx.push({ type: 'steam', x: u.x, y: u.y, r: 50 }); });
      G.events.push({ type: 'yukiBlink', x: b.x, y: b.y }); return; }
    // cola que barre si la tienen encima
    if (d < 150 && b.cd <= 0) { b.cd = 2.4; b.warn(0.6, 'fire', () => { G.fx.push({ type: 'boom', x: b.x, y: b.y, r: 150, el: 'fire' }); G.events.push({ type: 'boom', x: b.x, y: b.y, r: 150 }); for (const q of G.mages) if (q.alive && hypot(q.x - b.x, q.y - b.y) < 160 && !(q.iframes > 0)) { q.hurt(G, 15, { by: -1, el: 'fire' }); q.knock(q.x - b.x, q.y - b.y, 480); } }, { ring: 150 }); return; }
    // embestida en línea (fase 2+)
    if (ph >= 1 && b.cd <= 0 && d > 260 && G.rng() < 0.35) { b.cd = 3.4; const a = Math.atan2(m.y - b.y, m.x - b.x); b.warn(0.7, 'fire', () => { b.dash = { a, t: 0.42 }; }, { line: a, len: 540 }); return; }
    if (b.dash) { b.dash.t -= dt; b.vx = Math.cos(b.dash.a) * 1250; b.vy = Math.sin(b.dash.a) * 1250; b.x += b.vx * dt; b.y += b.vy * dt; b.collide(G.T); for (const q of G.mages) if (q.alive && hypot(q.x - b.x, q.y - b.y) < b.r + q.r + 6 && !(q.iframes > 0) && !q.kitHit) { q.kitHit = 1; q.hurt(G, 18, { by: -1, el: 'fire' }); q.knock(Math.cos(b.dash.a), Math.sin(b.dash.a), 520); } if (b.dash.t <= 0) { b.dash = null; for (const q of G.mages) q.kitHit = 0; } return; }
    if (b.cd <= 0) { b.cd = 3.6 - ph * 0.5; b.warn(0.45, 'fire', () => foxfire(G, b, 3 + ph)); return; }
    // se mueve en círculos alrededor del más cercano, a media distancia
    const a = Math.atan2(b.y - m.y, b.x - m.x) + 0.6 * dt * 3, want = 300; moveTo(G, b, m.x + Math.cos(a) * want, m.y + Math.sin(a) * want, 210 + ph * 30, dt);
  }
  function cloneStep(G, c, dt) {
    c.t += dt; if (!c.alive) return; if (G.state !== 'play') return; const B = G.boss; if (!B || !B.alive) { c.alive = false; return; } if (tele(G, c, dt)) return;
    const [m] = nearest(G, c); if (!m) return; c.cd -= dt;
    if (c.cd <= 0) { c.cd = 4 + G.rng() * 2; c.warn(0.45, 'fire', () => foxfire(G, c, 2, 0.55)); return; }
    const a = Math.atan2(c.y - m.y, c.x - m.x) + 0.6 * dt * 3; moveTo(G, c, m.x + Math.cos(a) * 320, m.y + Math.sin(a) * 320, 200, dt);
  }

  /* =================== RAIJIN Y FUJIN =================== */
  const BPM0 = 108;
  function godsSpawn(G) {
    const R = make(G, 'raijin', 1300, 420, { cd: 2, mark: [], beat: -1, target: 0, hurtK: (G2, src) => (isEl(src, 'wind') ? 1.4 : 1) * shieldK(G2) }), F = make(G, 'fujin', 1300, 720, { cd: 2, beat: -1, target: 1, hurtK: (G2, src) => (isEl(src, 'earth') ? 1.4 : 1) * shieldK(G2) });
    for (const b of [R, F]) { b.downT = 0; b.onZero = G2 => { const o = b === R ? F : R; if (o.down || !o.alive) return true; b.down = true; b.downT = 12; b.hp = 0.01; b.tele = null; G2.events.push({ type: 'bossExposed', x: b.x, y: b.y }); pop(G2, 0, 0, `¡${b.boss === 'raijin' ? 'Raijin' : 'Fujin'} cayó! Tumben al otro antes de 12 s`, '#ffe9a0', { big: true, screen: true }); say(G2, b.boss === 'raijin' ? '¡Hermano, levántame!' : '¡No me dejes caer solo!', b.boss); return false; }; }
    R.update = function (G2, dt) { godStep(G2, this, F, dt); }; F.update = function (G2, dt) { godStep(G2, this, R, dt); };
    G.boss = R; G.boss2 = F; G.units.push(R, F); G.cs.beat0 = 0;
  }
  const shieldK = G => { const R = G.units.find(u => u.w3boss === 'raijin'), F = G.units.find(u => u.w3boss === 'fujin'); return R && F && !R.down && !F.down && hypot(R.x - F.x, R.y - F.y) < 330 ? 0.3 : 1; };
  function godStep(G, b, o, dt) {
    b.t += dt; b.tickStatus(G, dt); if (!b.alive) return; if (G.state !== 'play') return;
    if (b.down) { b.downT -= dt; b.vx *= 0.9; b.vy *= 0.9; if (o.down || !o.alive) { b.alive = false; b.down = false; G.events.push({ type: 'bossDown', x: b.x, y: b.y, k: b.boss }); G.fx.push({ type: 'boom', x: b.x, y: b.y - 30, r: 160, el: b.el }); if (o.alive) { o.alive = false; o.down = false; G.events.push({ type: 'bossDown', x: o.x, y: o.y, k: o.boss }); G.fx.push({ type: 'boom', x: o.x, y: o.y - 30, r: 160, el: o.el }); } G.slow = 1.3; G.cs.godsDone = 1; return; }
      if (b.downT <= 0) { b.down = false; b.hp = b.maxHp * 0.35; G.fx.push({ type: 'flashRing', x: b.x, y: b.y, el: b.el, r: 160 }); pop(G, b.x, b.y - 160, '¡Se levantó!', '#ffb0a0', { big: true }); say(G, '¡Otra vez juntos!', b.boss); } return; }
    if (b.busy) return;
    // el compás: rayos en el 1 y el 3 (Raijin), ventarrón en el 4 (Fujin); con los dos heridos, más rápido
    const both = b.hp < b.maxHp * 0.5 && (o.down || o.hp < o.maxHp * 0.5), bpm = BPM0 * (both ? 1.25 : 1), bt = 60 / bpm;
    G.cs.bpm = bpm;
    const beat = G.cs.beat0 | 0, newBeat = beat !== b.beat; b.beat = beat;
    const tgt = G.mages[b.target] && G.mages[b.target].alive ? G.mages[b.target] : nearest(G, b)[0]; if (!tgt) return;
    if (b.boss === 'raijin') {
      // marca dos sitios un tiempo antes y en el golpe caen los rayos
      if (newBeat && beat === 6) { b.mark = [[tgt.x + tgt.vx * 0.5, tgt.y + tgt.vy * 0.5], [tgt.x + (G.rng() - 0.5) * 300, tgt.y + (G.rng() - 0.5) * 220]]; if (both) b.mark.push([o.x + (G.rng() - 0.5) * 400, o.y + (G.rng() - 0.5) * 300]); }
      if (newBeat && beat === 0 && b.mark.length) { for (const [x, y] of b.mark) Camp.foeCast(G, x, y, Object.assign({}, SPELLS.bolt[1], { range: 1, delay: 0.02, r: 56, dmg: 11, stun: 0.3 }), 'bolt'); G.events.push({ type: 'thunder', x: b.x, y: b.y, big: true }); b.mark = []; }
      // anillo de tambores (cada dos compases, si lo rodean)
      if (newBeat && beat === 2 && hypot(tgt.x - b.x, tgt.y - b.y) < 200) b.warn(bt * 2, 'bolt', () => { G.fx.push({ type: 'boom', x: b.x, y: b.y, r: 180, el: 'bolt' }); for (const q of G.mages) if (q.alive && hypot(q.x - b.x, q.y - b.y) < 190 && !(q.iframes > 0)) { q.hurt(G, 12, { by: -1, el: 'bolt' }); q.knock(q.x - b.x, q.y - b.y, 300); q.stun(0.25); } }, { ring: 180 });
    } else {
      // el ventarrón: en el 3 se ve de dónde sopla, en el 4 empuja (hacia el borde de las nubes)
      if (newBeat && (beat === 2 || beat === 6)) { b.gustA = Math.atan2(tgt.y - b.y, tgt.x - b.x); b.warn(bt, 'wind', () => {}, { line: b.gustA, len: 900, wide: 1 }); }
      if (newBeat && (beat === 3 || beat === 7) && b.gustA != null) { const a = b.gustA; b.gustA = null; G.events.push({ type: 'gust3', x: b.x, y: b.y }); for (const q of G.mages) { if (!q.alive) continue; const dx = q.x - b.x, dy = q.y - b.y, along = dx * Math.cos(a) + dy * Math.sin(a), side = Math.abs(-dx * Math.sin(a) + dy * Math.cos(a)); if (along > -40 && along < 900 && side < 170 && !(q.iframes > 0)) { q.knock(Math.cos(a), Math.sin(a), 380); q.hurt(G, 5, { by: -1, el: 'wind' }); } } for (let k = 0; k < 8; k++) G.fx.push({ type: 'gust', x: b.x + Math.cos(a) * k * 90, y: b.y + Math.sin(a) * k * 90, vx: Math.cos(a) * 600, vy: Math.sin(a) * 600 }); }
      // abanico de cuchillas de viento
      b.cd -= dt; if (b.cd <= 0 && !b.tele) { b.cd = both ? 3.2 : 4.4; const a0 = Math.atan2(tgt.y - b.y, tgt.x - b.x); b.warn(0.4, 'wind', () => { for (let k = -1; k <= 1; k++) shot(G, b.x, b.y - 30, a0 + k * 0.24, { el: 'wind', dmg: 7, speed: 460, r: 12, life: 1.4 }); }); }
    }
    if (tele(G, b, dt)) return;
    // cada uno persigue a «su» mago (si los magos se separan, los dioses también)
    const d = hypot(tgt.x - b.x, tgt.y - b.y), want = b.boss === 'raijin' ? 170 : 280, a = Math.atan2(b.y - tgt.y, b.x - tgt.x) + (b.boss === 'fujin' ? 0.5 * dt : -0.4 * dt);
    moveTo(G, b, tgt.x + Math.cos(a) * want, tgt.y + Math.sin(a) * want, b.boss === 'raijin' ? 150 : 190, dt);
    // se buscan entre ellos si están lejos (quieren protegerse)
    if (!o.down && o.alive && hypot(o.x - b.x, o.y - b.y) > 500) { b.x += (o.x - b.x) * 0.15 * dt; b.y += (o.y - b.y) * 0.15 * dt; }
  }

  /* =================== OROCHI Y EL BORRÓN =================== */
  const HEADS = ['fire', 'water', 'wind', 'earth', 'plant', 'bolt', 'light', 'shadow'];
  const COUNTER = { fire: 'water', water: 'bolt', wind: 'earth', earth: 'plant', plant: 'fire', bolt: 'wind', light: 'shadow', shadow: 'light' };
  const OBODY = [1200, 330];
  function orochiSpawn(G) {
    const body = make(G, 'orochi', OBODY[0], OBODY[1], { untargetable: true, knockMul: 0, hp: 1e9, maxHp: 1e9, heads: [], phase: 0 }); body.hurt = () => 0; body.update = function (G2, dt) { orochiStep(G2, this, dt); };
    G.units.push(body); G.boss = body;
    HEADS.forEach((el, k) => { const a = Math.PI * (0.08 + k / 7 * 0.84), ax = OBODY[0] + Math.cos(a) * -620, ay = OBODY[1] + Math.sin(a) * 430 + 40;
      const h = make(G, 'ohead', ax, ay, { el, hk: k, ax, ay, cd: 2 + k * 0.6, drunk: 0, knockMul: 0, hurtK: (G2, src) => (isEl(src, COUNTER[el]) ? 1.6 : src.el === el ? 0.3 : 0.75) * (h.drunk > 0 ? 2 : 1), upT: 2 + k * 0.7, up: 0 });
      h.onZero = G2 => { h.alive = false; h.lunge = null; G2.events.push({ type: 'headDown', x: h.x, y: h.y, el }); G2.fx.push({ type: 'boom', x: h.x, y: h.y - 30, r: 120, el }); G2.fx.push({ type: 'splat', x: h.x, y: h.y, r: 90, el: 'shadow' }); pop(G2, h.x, h.y - 120, '¡Cabeza cortada!', '#ffe9a0', { big: true }); G2.slow = Math.max(G2.slow, 0.35); return false; };
      h.update = function (G2, dt) { headStep(G2, this, dt); }; body.heads.push(h); G.units.push(h); });
  }
  function headStep(G, h, dt) {
    h.t += dt; h.tickStatus(G, dt); if (!h.alive) return; if (G.state !== 'play') return;
    if (h.drunk > 0) { h.drunk -= dt; h.x += (h.ax + Math.sin(h.t) * 20 - h.x) * dt * 2; h.y += (h.ay + 30 - h.y) * dt * 2; return; }
    // el cuello sube y baja: alzada no se le alcanza (escupe desde arriba); abajo muerde y se le puede pegar
    h.upT -= dt; if (h.upT <= 0 && !h.tele && !h.lunge) { h.up = h.up ? 0 : 1; h.upT = h.up ? 4.5 + G.rng() * 2 : 4 + G.rng() * 1.5; }
    h.untargetable = !!h.up; h.yOff = h.up ? -70 : 0;
    if (h.busy) return;
    // la tinaja de sake más cercana: si está a mano, va a beber
    const J = G.units.filter(u => u.obj === 'sake' && u.alive && !u.drunkBy);
    let jar = null, jd = 1e9; for (const u of J) { const d = hypot(u.x - h.x, u.y - h.y); if (d < jd) { jd = d; jar = u; } }
    if (jar && jd < 260) { h.up = 0; h.untargetable = false; h.yOff = 0; moveTo(G, h, jar.x, jar.y - 10, 240, dt); if (jd < 46) { jar.drunkBy = h; jar.alive = false; jar.x = jar.y = -9999; h.drunk = 7; h.tele = null; G.events.push({ type: 'sakeDrink', x: jar.x, y: jar.y }); G.fx.push({ type: 'pop', x: jar.x, y: jar.y - 20, el: 'water', r: 30 }); pop(G, h.x, h.y - 120, '¡Borracha! (recibe el doble)', '#ffe9a0', { small: true }); } return; }
    if (tele(G, h, dt)) return;
    const [m, d] = nearest(G, h); if (!m) return;
    // el cuello alcanza hasta cierto radio desde su anclaje
    const reach = 330, tx = h.ax + clamp(m.x - h.ax, -reach, reach) * 0.5, ty = h.ay + clamp(m.y - h.ay, -reach, reach) * 0.5; moveTo(G, h, tx, ty, 120, dt);
    h.cd -= dt; if (h.cd > 0) return; h.cd = 3.4 + G.rng() * 1.6 - G.boss.phase * 0.3;
    const a = Math.atan2(m.y - h.y, m.x - h.x);
    if (d < 220) { h.warn(0.65, h.el, () => { h.lunge = { a, t: 0.25 }; }, { line: a, len: 260 }); return; }
    // aliento de su elemento: cono o proyectiles
    if (h.el === 'fire' || h.el === 'water' || h.el === 'wind') h.warn(0.6, h.el, () => { for (let k = -2; k <= 2; k++) shot(G, h.x, h.y - 20, a + k * 0.12, { el: h.el, dmg: 6, speed: 420, r: 13, life: 1.3 }); }, { cone: a, r: 420 });
    else if (h.el === 'bolt' || h.el === 'earth') h.warn(0.7, h.el, () => Camp.foeCast(G, m.x + m.vx * 0.5, m.y + m.vy * 0.5, Object.assign({}, h.el === 'bolt' ? SPELLS.bolt[1] : FUSIONS['fire+earth'], { range: 1, delay: h.el === 'bolt' ? 0.6 : 0.9, r: 54, dmg: 12, flight: 0.9 }), h.el === 'bolt' ? 'bolt' : 'fire+earth'));
    else h.warn(0.5, h.el, () => shot(G, h.x, h.y - 20, a, { el: h.el, dmg: 11, speed: 330, r: 18, life: 2, extra: h.el === 'shadow' ? { S: { dmg: 11, hex: 2.2, speed: 330, r: 18, life: 2 } } : {} }));
  }
  function orochiStep(G, body, dt) {
    body.t += dt; const T = G.T, cs = G.cs;
    // mordiscos (se resuelven aquí: la cabeza se estira de golpe)
    for (const h of body.heads) if (h.alive && h.lunge) { h.lunge.t -= dt; h.x += Math.cos(h.lunge.a) * 900 * dt; h.y += Math.sin(h.lunge.a) * 900 * dt; for (const q of G.mages) if (q.alive && hypot(q.x - h.x, q.y - h.y) < h.r + q.r + 8 && !(q.iframes > 0) && !q.biteH) { q.biteH = 1; q.hurt(G, 16, { by: -1, el: h.el }); q.knock(Math.cos(h.lunge.a), Math.sin(h.lunge.a), 500); } if (h.lunge.t <= 0) { h.lunge = null; for (const q of G.mages) q.biteH = 0; } }
    const alive = body.heads.filter(h => h.alive).length;
    if (body.phase === 0 && alive <= 4 && !cs.half) { cs.half = 1; body.phase = 1; G.events.push({ type: 'bossRage', x: body.x, y: body.y, ph: 1 }); say(G, '¡Cuatro cabezas menos! Pero ahora están furiosas.'); refillJars(G, 3); }
    // sin cabezas: del cuerpo (la cola) sale el Borrón
    if (body.phase < 2 && alive === 0) { body.phase = 2; body.alive = false; G.events.push({ type: 'bossDown', x: body.x, y: body.y, k: 'orochi' }); G.slow = 1.4; G.fx.push({ type: 'splat', x: body.x, y: body.y, r: 260, el: 'shadow' }); cs.borronT = 3.2; say(G, '¡Lo lograron! …¿Qué es eso en la cola?'); }
  }
  function refillJars(G, n) { const spots = G.L.jars; let k = 0; for (const [x, y] of spots) { if (k >= n) break; if (G.units.some(u => u.obj === 'sake' && u.alive && hypot(u.x - x, u.y - y) < 40)) continue; const u = Modes.pushable(G, x, y, 'sake', 20); u.knockMul = 0.9; k++; G.fx.push({ type: 'rise', x, y }); } }
  function borronSpawn(G) {
    const b = make(G, 'borron', OBODY[0], OBODY[1] + 160, { shield: 130 * solo(G), maxShield: 130 * solo(G), shieldEl: 'light', shieldMsg: 'La tinta solo cede ante la LUZ', cd: 2.5, regrow: 0, copyT: 4, pitT: 6 });
    b.onBreak = G2 => { b._selfStun = 1; b.stun(4.5); b._selfStun = 0; b.regrow = 15; G2.events.push({ type: 'bossExposed', x: b.x, y: b.y }); G2.fx.push({ type: 'flashRing', x: b.x, y: b.y, el: 'light', r: 200 }); pop(G2, b.x, b.y - 170, '¡Sin tinta! ¡Con todo!', '#fff2b0', { big: true }); };
    b.update = function (G2, dt) { borronStep(G2, this, dt); }; G.units.push(b); G.boss = b;
    G.events.push({ type: 'borronRise', x: b.x, y: b.y }); G.cs.music = 'orochiMain';
    say(G, '¡Todo lo pintado se puede borrar! ¡Hasta ustedes!', 'borron'); say(G, '¡El Borrón! Les pinto luz: rompan su tinta… ¡y cuidado con sus copias!', 'sumi', 3.2);
    // Sumi pinta luz en dos fuentes
    for (const q of G.sources) if (q.el === 'fire' || q.el === 'plant') { q.el = 'light'; q.cd = 0; G.fx.push({ type: 'flashRing', x: q.x, y: q.y, el: 'light', r: 120 }); }
  }
  function borronStep(G, b, dt) {
    b.t += dt; b.tickStatus(G, dt); if (!b.alive) return; if (G.state !== 'play') return; const T = G.T;
    if (b.regrow > 0) { b.regrow -= dt; if (b.regrow <= 0 && b.shield <= 0) { b.shield = b.maxShield * 0.5; pop(G, b.x, b.y - 170, 'La tinta vuelve a cubrirlo', '#d8d0ff', { small: true }); } }
    const f = 1 - b.hp / b.maxHp, ph = f > 0.6 ? 2 : f > 0.25 ? 1 : 0;
    if (ph > b.phase) { b.phase = ph; G.events.push({ type: 'bossRage', x: b.x, y: b.y, ph }); G.slow = Math.max(G.slow, 0.5); say(G, ph === 1 ? '¡Borraré sus nombres del pergamino!' : '¡Ni el papel quedará!', 'borron'); }
    if (b.busy) return;
    // copias de tinta de los magos (usan sus mismos elementos)
    b.copyT -= dt; if (b.copyT <= 0) { b.copyT = 15 - ph * 2; for (const m of G.mages) if (m.alive && G.units.filter(u => u.kind === 'tinta' && u.alive).length < Math.max(1, ph)) { const [x, y] = Arena.safeNear(G, b.x + (G.rng() - 0.5) * 300, b.y + 180); const c = new Creature(G, 'tinta', x, y); c.copyOf = m.cid; c.els = m.hands.map(h => h.el); G.units.push(c); G.fx.push({ type: 'splat', x, y, r: 70, el: 'shadow' }); } pop(G, b.x, b.y - 180, '¡Copias de tinta!', '#d8d0ff', { small: true }); }
    // fosas de tinta bajo los pies
    b.pitT -= dt * (ph ? 1 : 0); if (b.pitT <= 0) { b.pitT = 12 - ph * 1.5; for (const m of G.mages) if (m.alive) Camp.foeCast(G, m.x + m.vx * 0.4, m.y + m.vy * 0.4, Object.assign({}, FUSIONS['earth+shadow'], { range: 1, delay: 1.0 }), 'earth+shadow'); }
    if (tele(G, b, dt)) return;
    const [m, d] = nearest(G, b); if (!m) return;
    b.cd -= dt;
    if (b.cd <= 0) { b.cd = 3.6 - ph * 0.5; const a = Math.atan2(m.y - b.y, m.x - b.x);
      if (ph >= 1 && G.rng() < 0.5) b.warn(0.55, 'shadow', () => { for (let k = 0; k < 6 + ph * 3; k++) shot(G, b.x, b.y - 40, k / (6 + ph * 3) * TAU + b.t, { el: 'shadow', dmg: 7, speed: 300, r: 14, life: 2.2 }); });
      else b.warn(0.7, 'shadow', () => { for (let k = -1; k <= 1; k++) shot(G, b.x, b.y - 40, a + k * 0.25, { el: 'shadow', dmg: 10, speed: 420, r: 18, life: 2, extra: { S: { dmg: 10, hex: 2.2, speed: 420, r: 18, life: 2 } } }); }, { line: a, len: 600 });
      return; }
    moveTo(G, b, m.x + Math.cos(b.t * 0.5) * 320, m.y - 200 + Math.sin(b.t * 0.7) * 120, 120 + ph * 30, dt);
  }
  // la copia de tinta: corre como un mago y dispara sus mismos elementos (la luz la deshace)
  CREATURES.tinta = { name: 'Copia de tinta', look: 'tinta', el: 'shadow', weak: 'light', hp: 55, r: 18, speed: 185, chase: 1, bite: 7, team: 9, soft: 0.55,
    tick(G, c, dt, m, d) { c.cd2 = (c.cd2 == null ? 1.5 : c.cd2) - dt; if (d < 240) { c.vx += (c.x - m.x) / d * 300 * dt; c.vy += (c.y - m.y) / d * 300 * dt; } if (c.cd2 <= 0 && d < 520) { c.cd2 = 2.3; const el = c.els ? c.els[(G.rng() * 2) | 0] : 'shadow', a = Math.atan2(m.y + m.vy * 0.3 - c.y, m.x + m.vx * 0.3 - c.x); shot(G, c.x, c.y - 24, a, { el, dmg: 6, speed: 470, r: 12, life: 1.4 }); G.events.push({ type: 'cast', who: -1, el, kind: 'proj', x: c.x, y: c.y, level: 1 }); } } };

  // ganchos: armar los jefes, su táctica para la máquina compañera
  Camp.EXT.spawn.push((G, k) => { if (k === 'kitsune') { kitsuneSpawn(G); return true; } if (k === 'gods') { godsSpawn(G); return true; } if (k === 'orochi') { orochiSpawn(G); return true; } return false; });
  Camp.EXT.boss.push((G, m, B) => {
    if (!B.w3) return undefined;
    if (B.boss === 'kitsune') return G.units.some(u => u.clone && u.alive) || B.reveal <= 0 ? { need: ['light'], prefer: 'light' } : {};
    if (B.boss === 'raijin' || B.boss === 'fujin') return { prefer: m.idx === 0 ? 'wind' : 'earth' };
    if (B.boss === 'orochi') { const h = B.heads.filter(q => q.alive).sort((a, b) => hypot(a.x - m.x, a.y - m.y) - hypot(b.x - m.x, b.y - m.y))[0]; return h ? { need: [COUNTER[h.el]], prefer: COUNTER[h.el], target: h } : {}; }
    if (B.boss === 'borron') return B.shield > 0 ? { need: ['light'], prefer: 'light' } : {};
    return {};
  });

  /* =================== LOS NIVELES DE JEFE =================== */
  const LV = W3.LV;
  LV.c21 = { id: 'c21', world: 3, world3: 1, name: 'La Kitsune', place: 'Fushimi Inari', kind: 'Jefe', theme: 'fushimi', W: 1800, H: 1100, par: 240, boss: 'kitsune', dark: 1,
    text: 'La Kitsune de nueve colas sirve ahora al Borrón. Engaña: se esfuma y se multiplica. Las ilusiones NO tienen sombra, y la LUZ las deshace. En invierno, su fuego de zorro se debilita.',
    spawns: [[260, 500], [260, 620]],
    sources: [S(240, 260, 'light'), S(1560, 860, 'light'), S(240, 860, 'water'), S(1560, 260, 'wind'), S(900, 1000, 'earth'), S(900, 140, 'plant')],
    seasons: { panels: [[0, 1800, 'autumn']], toriis: [{ x: 900, y: 860 }] },
    paint(T) { all(T, TT.GRASS); ell(T, 900, 560, 560, 330, TT.STONE); path(T, [[40, 560], [1760, 560]], 34, TT.STONE); path(T, [[900, 60], [900, 1060]], 30, TT.STONE);
      bushes(T, [[140, 140], [1660, 140], [140, 980], [1660, 980], [520, 140], [1280, 140], [520, 980], [1280, 980]]); for (const [x, y] of [[620, 380], [1180, 380], [620, 740], [1180, 740]]) circ(T, x, y, 18, TT.ROCK); border(T); },
    objs: [{ t: 'seal3', x: 1700, y: 1040 }],
    setup(G) { const T = G.T, R = []; for (let i = 0; i < T.n; i++) { const x = Terrain.cx(T, i), y = Terrain.cy(T, i); if (T.base[i] === TT.ROCK && x > 40 && y > 40 && x < T.W - 40 && y < T.H - 40) R.push(i); } look(G, R, 'fox'); },
    want: G => G.boss && G.boss.alive && G.sea.panels[0].s !== 'winter' ? [[0, 'winter']] : null,
    goal: G => G.boss && !G.boss.alive, autoWin: true,
    label: G => { const B = G.boss; if (!B) return ''; const n = G.units.filter(u => u.clone && u.alive).length; return (G.sea.panels[0].s === 'summer' ? 'Verano: su fuego de zorro arde fuerte (¡invierno al torii!) · ' : '') + (n ? `${n + 1} zorras: la de verdad tiene SOMBRA (la LUZ deshace ilusiones)` : B.reveal > 0 ? '¡Al descubierto: con todo!' : 'Encandílenla con LUZ y péguenle'); },
    script(G) { if (!G.cs.hi && G.state === 'play') { G.cs.hi = 1; say(G, 'Jijiji… ¿vienen a jugar a las escondidas?', 'kitsune'); say(G, 'Es la Kitsune. Nada de lo que muestra es seguro.', 'sumi', 3); } } };

  LV.c24 = { id: 'c24', world: 3, world3: 1, name: 'Raijin y Fujin', place: 'Sobre el monte Fuji', kind: 'Jefe', theme: 'fuji', W: 2000, H: 1150, par: 260, boss: 'gods',
    text: 'Los dioses del trueno y del viento atacan al compás del tambor. Juntos se protegen: SEPÁRENLOS. Si cae uno, se levanta a los 12 s… a menos que el otro caiga también.',
    spawns: [[420, 500], [420, 650]],
    sources: [S(300, 330, 'wind'), S(300, 820, 'earth'), S(1000, 200, 'wind'), S(1000, 960, 'earth'), S(1700, 330, 'light'), S(1700, 820, 'water')],
    seasons: { panels: [[0, 2000, 'summer']], toriis: [{ x: 1000, y: 580 }] },
    paint(T) { all(T, TT.CHASM); ell(T, 1000, 575, 900, 500, TT.GRASS); for (const [x, y, r] of [[620, 330, 80], [1380, 820, 80], [1000, 575, 0]]) if (r) circ(T, x, y, r, TT.CHASM); ell(T, 1000, 575, 150, 150, TT.STONE); path(T, [[300, 575], [1700, 575]], 26, TT.STONE); bushes(T, [[330, 400], [330, 760], [1670, 400], [1670, 760]]); },
    objs: [{ t: 'seal3', x: 1000, y: 140 }],
    goal: G => G.cs.godsDone, autoWin: true,
    label: G => { const R = G.units.find(u => u.w3boss === 'raijin'), F = G.units.find(u => u.w3boss === 'fujin'); if (!R || !F) return ''; const dn = [R, F].find(b => b.down); if (dn) return `¡${dn === R ? 'Raijin' : 'Fujin'} está caído (${Math.ceil(dn.downT)} s)! ¡Tumben al otro!`; return shieldK(G) < 1 ? '¡Juntos se protegen! SEPÁRENLOS' : 'Raijin: le duele el VIENTO · Fujin: le duele la TIERRA'; },
    script(G, dt) { const cs = G.cs, bt = 60 / (cs.bpm || BPM0); cs.beatT = (cs.beatT || 0) + dt; if (cs.beatT >= bt) { cs.beatT -= bt; cs.beat0 = ((cs.beat0 || 0) + 1) % 8; G.events.push({ type: 'taiko', x: 1000, y: 575, n: cs.beat0 }); }
      if (!G.cs.hi && G.state === 'play') { G.cs.hi = 1; say(G, '¡Al ritmo del trueno!', 'raijin'); say(G, '¡Y del viento!', 'fujin', 1.6); say(G, 'Escuchen el tambor: rayos en el uno y el tres, viento en el cuatro.', 'sumi', 3.6); } } };

  LV.c26 = { id: 'c26', world: 3, world3: 1, name: 'Orochi y el Borrón', place: 'Río Hi, Izumo', kind: 'Jefe final', theme: 'izumo', W: 2400, H: 1400, par: 340, boss: 'orochi', dark: 1,
    text: 'Yamata no Orochi: ocho cabezas, cada una de un elemento y débil a su contrario. Empujen las tinajas de sake hacia ellas: se emborrachan y reciben el doble. Y cuando caigan las ocho… cuidado con la cola.',
    spawns: [[1100, 1220], [1300, 1220]],
    sources: [S(260, 1180, 'water'), S(700, 1260, 'bolt'), S(1200, 1300, 'light'), S(1700, 1260, 'wind'), S(2140, 1180, 'earth'), S(260, 760, 'fire'), S(2140, 760, 'plant'), S(1200, 900, 'shadow')],
    seasons: { panels: [[0, 1200, 'summer'], [1200, 2400, 'autumn']], toriis: [{ x: 420, y: 1000 }, { x: 1980, y: 1000 }] },
    jars: [[560, 900], [900, 1060], [1500, 1060], [1840, 900], [740, 700], [1660, 700], [1200, 1120], [1200, 760]],
    paint(T) { all(T, TT.DIRT); ell(T, 1200, 360, 520, 260, TT.DEEP); rect(T, 0, 0, 2400, 120, TT.DEEP); path(T, [[40, 1320], [2360, 1320]], 40, TT.SHALLOW); ell(T, 1200, 900, 900, 420, TT.GRASS); ell(T, 1200, 900, 600, 280, TT.STONE);
      bushes(T, [[120, 300], [2280, 300], [120, 600], [2280, 600], [300, 1300], [2100, 1300]]); border(T); },
    objs: [{ t: 'seal3', x: 2320, y: 1340 }],
    setup(G) { for (const [x, y] of this.jars) { const u = Modes.pushable(G, x, y, 'sake', 20); u.knockMul = 0.9; } },
    want: G => null,
    goal: G => G.cs.borronDone, autoWin: true,
    label: G => { const B = G.boss; if (!B) return ''; if (B.w3boss === 'orochi') { const n = B.heads.filter(h => h.alive).length; return `Cabezas: ${n}/8 · cada una cae con su CONTRARIO · empujen el SAKE hacia ellas`; } if (G.cs.borronT > 0) return '…'; return B.shield > 0 ? 'Rompan la tinta del Borrón con LUZ' : '¡Sin tinta: con todo!'; },
    script(G, dt) {
      const cs = G.cs;
      if (!cs.hi && G.state === 'play') { cs.hi = 1; say(G, 'Yamata no Orochi… el Borrón lo despertó.'); say(G, 'Cada cabeza cae con su contrario. Y el sake las duerme.', 'sumi', 3.4); }
      if (cs.borronT > 0) { cs.borronT -= dt; if (cs.borronT <= 0) borronSpawn(G); }
      const B = G.units.find(u => u.w3boss === 'borron'); if (B && !B.alive && !cs.borronDone) { cs.borronDone = 1; for (const u of foes(G)) { u.alive = false; G.fx.push({ type: 'splat', x: u.x, y: u.y, r: 50, el: 'shadow' }); } }
      cs.jarT = (cs.jarT == null ? 30 : cs.jarT) - dt; if (cs.jarT <= 0) { cs.jarT = 30; if (G.boss && G.boss.w3boss === 'orochi' && G.units.filter(u => u.obj === 'sake' && u.alive).length < 3) refillJars(G, 2); }
    } };

  // el orden de la campaña: los ocho niveles del Mundo 3 van después del 18
  for (const id of ['c19', 'c20', 'c21', 'c22', 'c23', 'c24', 'c25', 'c26']) Camp.LEVELS.push(LV[id]);
  return { shieldK, COUNTER, HEADS };
})();
