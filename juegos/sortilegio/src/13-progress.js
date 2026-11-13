/* =========================================================================
   PROGRESO — grimorio (fusiones y combinaciones que se van descubriendo),
   logros y récords (Store 'prog'), y la Escuela de magia (lecciones cortas
   con un espantapájaros de práctica). Solo cuentan los magos de personas.
   ========================================================================= */
const ACHIEVEMENTS = [
  { id: 'fusion1', name: 'Primera fusión', text: 'Funde las dos manos por primera vez.' },
  { id: 'fusion15', name: 'Grimorio completo', text: 'Descubre las 28 fusiones.' },
  { id: 'gran', name: 'Gran Sortilegio', text: 'Llena el Embrujo y suelta un Gran Sortilegio.' },
  { id: 'electro', name: 'Corto circuito', text: 'Electrocuta a un rival mojado.' },
  { id: 'congelado', name: 'Hielo de páramo', text: 'Congela a un rival mojado.' },
  { id: 'rebote', name: 'Devuélvelo', text: 'Rebota un hechizo con viento y que pegue.' },
  { id: 'incendio', name: 'Incendio', text: 'Prende un incendio grande.' },
  { id: 'pelo', name: 'Por un pelo', text: 'Esquiva 10 hechizos rozándolos.' },
  { id: 'absorb', name: 'Bebedor de fuentes', text: 'Bebe 20 elementos de las fuentes.' },
  { id: 'perfect', name: 'Intocable', text: 'Gana una ronda de duelo sin recibir daño.' },
  { id: 'hard', name: 'Más que la máquina', text: 'Gánale un duelo a la máquina en Maestro, sin ventaja.' },
  { id: 'tejo', name: '¡Mecha!', text: 'Mete un tejo en el bocín del rival.' },
  { id: 'hunt', name: 'Cazador de espantos', text: 'Haz 20 puntos en una Cacería.' },
  { id: 'copa', name: 'Campeón del Páramo', text: 'Gana una Copa del Páramo.' },
  { id: 'camp1', name: 'La Travesía empieza', text: 'Supera el primer nivel de la campaña.' },
  { id: 'campAll', name: 'El páramo vuelve a brillar', text: 'Derrota a Tragaluz.' },
  { id: 'campW2', name: 'Señor de la luz y la sombra', text: 'Derrota a Buziraco en el Mundo 2.' },
  { id: 'starsAll', name: 'Constelación completa', text: 'Consigue todas las estrellas de los dos mundos.' },
  { id: 'stars30', name: 'Treinta estrellas', text: 'Consigue las 30 estrellas de la campaña.' },
  { id: 'all6', name: 'Todos los caminos', text: 'Gana al menos un duelo con cada mago.' },
  { id: 'school', name: 'Aprendiz', text: 'Termina la Escuela de magia.' },
];
const Progress = (() => {
  let P = Object.assign({ ach: {}, grim: {}, combos: {}, grazes: 0, absorbs: 0, games: 0, wins: {}, best: {} }, Store.get('prog', {}));
  const save = () => Store.set('prog', P);
  const human = (G, i) => i >= 0 && G.mages[i] && !G.mages[i].ctrl && !G.attract;
  function unlock(G, id) { if (P.ach[id]) return; P.ach[id] = Date.now(); save(); const A = ACHIEVEMENTS.find(a => a.id === id); if (A && G) { G.pops.push({ x: 0, y: 0, text: 'LOGRO · ' + A.name, t: 0, color: '#ffe9a0', big: true, screen: true, low: true, row: G.pops.filter(p => p.screen && p.low && p.t < 1.6).length }); Sound.play('matchWin'); } }
  function onEvent(G, e) {
    if (G.attract) return;
    if (e.type === 'fusion' && human(G, e.who)) { if (!P.grim[e.key]) { P.grim[e.key] = 1; save(); G.pops.push(e.gran ? { x: 0, y: 0, text: '¡Nueva fusión: ' + FUSIONS[e.key].name + '!', t: 0, color: '#ffe9a0', big: true, screen: true, low: true, row: G.pops.filter(p => p.screen && p.low && p.t < 1.6).length } : { x: 0, y: 0, follow: G.mages[e.who], text: '¡Nueva fusión: ' + FUSIONS[e.key].name + '!', t: 0, color: '#ffe9a0', small: true }); } unlock(G, 'fusion1'); if (Object.keys(P.grim).length >= FUSION_ORDER.length) unlock(G, 'fusion15'); }
    if (e.type === 'resonance' && !P.grim[e.key]) { P.grim[e.key] = 1; save(); }
    if (e.type === 'gran' && human(G, e.who)) unlock(G, 'gran');
    if (e.type === 'combo' && human(G, e.who)) {
      if (!P.combos[e.key]) { P.combos[e.key] = 1; save(); }
      if (e.key === 'electrocutado') unlock(G, 'electro'); if (e.key === 'congelado') unlock(G, 'congelado'); if (e.key === 'rebote') unlock(G, 'rebote'); if (e.key === 'incendio') unlock(G, 'incendio');
      if (e.key === 'porunpelo') { P.grazes++; save(); if (P.grazes >= 10) unlock(G, 'pelo'); }
    }
    if (e.type === 'absorb' && human(G, e.who)) { P.absorbs++; save(); if (P.absorbs >= 20) unlock(G, 'absorb'); }
    if (e.type === 'goal' && human(G, e.who)) unlock(G, 'tejo');
    if (e.type === 'roundWin' || e.type === 'matchWin') {
      const w = e.who; if (G.mode === 'duel' && human(G, w) && G.mages[w].stats.taken < 0.5 && G.roundWinner === w) unlock(G, 'perfect');
    }
  }
  function onMatchEnd(G, r) {
    if (G.attract) return; P.games++;
    const w = r.winner;
    if (G.mode === 'duel' && w >= 0 && human(G, w)) { P.wins[G.chars[w]] = (P.wins[G.chars[w]] || 0) + 1; if (CHAR_ORDER.every(c => P.wins[c])) unlock(G, 'all6'); if (G.players === 1 && w === 0 && G.level >= 4 && !((Store.get('adv', [0, 0]) || [])[0] > 0)) unlock(G, 'hard'); }
    if (G.mode === 'hunt' && G.score) for (let i = 0; i < 2; i++) if (human(G, i) && G.score[i] >= 20) unlock(G, 'hunt');
    if (r.camp && r.camp.win) { unlock(G, 'camp1'); if (r.camp.level === 9) unlock(G, 'campAll'); if (r.camp.level === 17) unlock(G, 'campW2'); if (Camp.total() >= 30) unlock(G, 'stars30'); if (Camp.total() >= Camp.LEVELS.length * 3) unlock(G, 'starsAll'); }
    save();
  }
  /* ---------- Escuela de magia ---------- */
  const LESSONS = [
    { t: 'Muévete y toca una mano para lanzar su hechizo rápido. Pégale al espantapájaros.', ok: S => S.hits >= 1 },
    { t: 'Ahora SOSTÉN una mano hasta que se llene el círculo de runas y suéltala: hechizo cargado.', ok: S => S.charged >= 1 },
    { t: 'Aprieta LAS DOS MANOS a la vez (o sostén una y aprieta la otra): ¡fusión!', ok: S => S.fus >= 1 },
    { t: 'Ve a la fuente de RAYO (el altar violeta, arriba) y sostén la MANO DERECHA encima para beberlo.', ok: S => S.abs >= 1 },
    { t: 'Moja al espantapájaros con agua y luego pégale con rayo: ¡Electrocutado!', ok: S => S.electro >= 1 },
    { t: 'La torreta te dispara: ESQUIVA justo cuando el hechizo llegue (que pase rozando) 2 veces.', ok: S => S.graze >= 2 },
    { t: 'Las combinaciones llenan el Embrujo. Llénalo y funde las manos: ¡Gran Sortilegio!', ok: S => S.gran >= 1 },
  ];
  function schoolSetup(G) {
    G.school = { k: 0, S: { hits: 0, charged: 0, fus: 0, abs: 0, electro: 0, graze: 0, gran: 0 }, done: false, t: 0 };
    const m = G.mages[0]; m.hands[0].el = m.hands[0].nat = 'water'; m.hands[1].el = m.hands[1].nat = 'fire';
    G.sources = [{ x: 380, y: 200, el: 'bolt', cd: 0, glow: 0 }, { x: 380, y: 680, el: 'water', cd: 0, glow: 0 }];
    for (const s of G.sources) Terrain.forCircle(G.T, s.x, s.y, 34, i => { G.T.base[i] = TT.STONE; });
    G.T.ver++; ArtGround.cache[G.arena] = null;
    G.units = G.units.filter(u => u.idx !== 1); G.mages[1].alive = false; G.mages[1].x = -999;
    const d = new Unit(900, 440, 22, 9); Object.assign(d, { obj: 'dummy', idx: -1, hp: 400, maxHp: 400, keep: true, knockMul: 0, untargetable: false });
    d.hurt = function (G, dmg, src = {}) { if (!src.dot) G.school.S.hits++; this.flash = 0.15; G.events.push({ type: 'hurt', x: this.x, y: this.y, dmg, el: src.el, dot: !!src.dot, who: -1, unit: this }); return dmg; };
    d.update = function (G, dt) { this.tickStatus(G, dt); this.x = 900; this.y = 440; this.vx = this.vy = 0; };
    G.units.push(d); G.dummy = d;
  }
  function schoolUpdate(G, dt) {
    const Sc = G.school; if (!Sc || G.state !== 'play') return; Sc.t += dt;
    const L = LESSONS[Sc.k];
    if (Sc.k === 5 && !G.units.some(u => u.obj === 'turret')) { const t = new Unit(1150, 440, 18, 9); Object.assign(t, { obj: 'turret', untargetable: true, hp: 999, maxHp: 999, idx: -1, life: 999, by: -1, next: 1, dmg: 3, reach: 900, every: 1.6, el: 'bolt', knockMul: 0, keep: true }); G.units.push(t); G.schoolTurret = t; }
    if (G.schoolTurret && Sc.k === 5) { G.schoolTurret.next -= 0; if ((G.schoolTurret._c = (G.schoolTurret._c || 0) + dt) > 1.6) { G.schoolTurret._c = 0; const m = G.mages[0], a = Math.atan2(m.y - 440, m.x - 1150); G.spells.push({ t: 'proj', id: -77, age: 0, S: SPELLS.fire[0], by: -1, team: 9, el: 'fire', x: 1150 + Math.cos(a) * 30, y: 440 + Math.sin(a) * 30, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, r: 11, life: 2, dmg: 3, power: 1, size: 1 }); } }
    if (L && L.ok(Sc.S)) { Sc.k++; G.pops.push({ x: 0, y: 0, text: Sc.k >= LESSONS.length ? '¡Escuela terminada!' : '¡Bien!', t: 0, color: '#9fe07a', big: true, screen: true }); Sound.play('roundWin'); if (Sc.k === 6) G.mages[0].emb = 70; if (Sc.k >= LESSONS.length) { Sc.done = true; unlock(G, 'school'); setTimeout(() => { if (G.mode === 'school') Game.endRound(0, 'school'); }, 1800); } }
  }
  function schoolEvent(G, e) {
    const Sc = G.school; if (!Sc) return;
    if (e.type === 'cast' && e.who === 0 && e.level === 2 && !e.fusion) Sc.S.charged++;
    if (e.type === 'fusion' && e.who === 0) Sc.S.fus++;
    if (e.type === 'absorb' && e.who === 0) Sc.S.abs++;
    if (e.type === 'combo' && e.who === 0 && e.key === 'electrocutado') Sc.S.electro++;
    if (e.type === 'combo' && e.who === 0 && e.key === 'porunpelo') Sc.S.graze++;
    if (e.type === 'gran' && e.who === 0) Sc.S.gran++;
  }
  function schoolText(G) { const Sc = G.school; return Sc ? (Sc.k < LESSONS.length ? `Lección ${Sc.k + 1} de ${LESSONS.length}: ${LESSONS[Sc.k].t}` : '¡Lista la escuela!') : ''; }
  return { onEvent, onMatchEnd, unlock, schoolSetup, schoolUpdate, schoolEvent, schoolText, LESSONS, get data() { return P; }, reset() { P = { ach: {}, grim: {}, combos: {}, grazes: 0, absorbs: 0, games: 0, wins: {}, best: {} }; save(); } };
})();
