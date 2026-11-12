/* =========================================================================
   PRINCIPAL — mundo, carrera, cámaras de persecución, pantalla dividida,
   bucle de pasos fijos, eventos → sonido/efectos/HUD, portada con carrera
   de demostración y cámara de cine.
   ========================================================================= */
const Game = (() => {
  const DT = 1 / 120;
  let R = null, meshes = [], cams = [], camSt = [], scene = null, worldFor = null, acc = 0, last = 0, t = 0, frameEv = [];
  const G = { mode: 'title', paused: false, nHumans: 2 };
  const view = document.getElementById('view'), hud = document.getElementById('hud');
  try { GFX.init(view); } catch (e) { document.getElementById('ver').textContent = 'Sin gráficos 3D (WebGL) en este navegador.'; throw e; }
  HUD.init(hud); POST.init(GFX.renderer);
  const V = new THREE.Vector3(), V2 = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), FWD = new THREE.Vector3(), TU = new THREE.Vector3();
  function world(tid) {
    if (worldFor === tid) return; const T = getTrack(tid);
    meshes = []; show = []; scene = GFX.buildWorld(T, TRACKS[tid]); worldFor = tid; FX.init(scene, T, GQ.lv < 2);
  }
  // lo que tiene puesto en el garaje el jugador i con ese piloto
  const garageSkin = (i, pid) => { try { return Vestidor.skinOf(i, pid); } catch (e) { return null; } };
  const drop = m => { scene.remove(m.root); scene.remove(m.shadow); GFX.disposeScene(m.root); GFX.disposeScene(m.shadow); };
  function clearCars() { for (const m of meshes) drop(m); meshes = []; }
  function newRace(tid, humans, bots, countT, opts = {}) {
    world(tid); Input.endStep();
    R = new Race(tid, Object.assign({ humans, bots, countT }, opts)); if (opts.noItems) R.boxes = []; FX.init(scene, R.track, GQ.lv < 2);
    if (opts.botSlow) for (const c of R.cars) if (c.bot) c.vmax *= opts.botSlow;
    clearCars();
    meshes = R.cars.map(c => { const m = CarArt.build(c.pid, c.bot ? null : c.human, c.bot ? null : garageSkin(c.human, c.pid)); scene.add(m.root); scene.add(m.shadow); return m; });
    ItemArt.init(scene, R); BossArt.init(scene, R);
    const nv = Math.max(1, humans.length); cams = []; camSt = [];
    for (let i = 0; i < nv; i++) { cams.push(new THREE.PerspectiveCamera(68, 1, 0.3, 5000)); camSt.push(null); }
    acc = 0; frameEv = [];
    return R;
  }
  /* ---------- carreras: rápida, Gran Premio (puntos) y contrarreloj ---------- */
  /* fuerza de cada rival (0 principiante … 1 experto): en cada dificultad hay unos más flojos y uno o dos buenos */
  const DIFF_SK = [[0, 0.04, 0.12, 0.08, 0], [0.1, 0.15, 0.28, 0.2, 0.05], [0.35, 0.42, 0.6, 0.5, 0.3]], SK_OFF = [-0.04, 0, 0.1, 0.05, -0.06], GP_PTS = [10, 8, 6, 5, 4, 3];
  function startCfg(n, cfg, next) {
    G.nHumans = n; Input.solo = n === 1; G.cfg = cfg; clearShow(); const mode = cfg.mode;
    if (mode === 'gp' && !next) G.gp = { i: 0, pts: {}, list: cupTracks(cfg.cup || 0), cup: (CUPS[cfg.cup || 0] || CUPS[0]).name };
    if (mode === 'duel' && !next) G.duel = { r: 0, w: [0, 0] };
    const humans = cfg.p.slice(0, n), pool = PILOT_ORDER.filter(p => !humans.includes(p)).sort(() => Math.random() - 0.5), bots = [];
    const up = mode === 'gp' ? (cfg.cup || 0) * 0.04 + (G.gp ? G.gp.i : 0) * 0.01 : 0; /* la Copa Dorada y la Gran Copa son más duras, y cada carrera del Gran Premio un poquito más */
    const addBots = (k, lv) => { for (let i = 0; i < k; i++) bots.push(lv != null ? { pid: pool[i], level: lv } : { pid: pool[i], skill: clamp(DIFF_SK[cfg.diff != null ? cfg.diff : 1][i] + up, 0, 1) }); };
    let tid = cfg.track, laps = cfg.laps, rules = null, botSlow = 0;
    switch (mode) {
      case 'gp': tid = G.gp.list[G.gp.i]; addBots(6 - n); break;
      case 'tt': if (n === 2) addBots(4); break;
      case 'duel': tid = TRACK_ORDER[(Math.max(0, TRACK_ORDER.indexOf(cfg.track)) + G.duel.r) % TRACK_ORDER.length]; if (n === 1) bots.push({ pid: pool[0], skill: [0.08, 0.22, 0.48][cfg.diff != null ? cfg.diff : 1] }); break;
      case 'elim': addBots(6 - n); laps = 999; rules = Rules.elim; break;
      case 'battle': tid = cfg.arena || ARENA_ORDER[0]; addBots(6 - n); laps = 999; rules = Rules.battle; break;
      case 'world': { const C = CAMPAIGN[cfg.ch || 0] || CAMPAIGN[0], addD = (k, d) => { for (let i = 0; i < k; i++) bots.push({ pid: pool[i], skill: C.sk != null ? clamp(C.sk + SK_OFF[i], 0, 1) : DIFF_SK[d][i] }); }; tid = C.track; rules = R => Rules.world(R, C);
        if (C.kind === 'race') { addD(6 - n, C.diff || 0); laps = C.laps; }
        else if (C.kind === 'elim' || C.kind === 'battle') { addD(C.bots != null ? C.bots : 6 - n, C.diff); laps = 999; }
        else if (C.L) { addBots(C.L.bots, C.L.botLevel); laps = C.L.laps; }
        else if (C.kind === 'tt' || C.kind === 'clean' || C.kind === 'logs') laps = C.laps;
        else if (C.kind === 'escape') { addBots(2, 0); laps = C.laps; }
        else if (C.kind === 'rival') { const k = pool.indexOf(C.champ); if (k > 0) { pool.splice(k, 1); pool.unshift(C.champ); } addD(4, 1); laps = C.laps; }
        else laps = 999; break; }
      case 'chase': { const B = BOSSES[cfg.boss] || BOSSES.tren; tid = B.track; laps = 999; rules = R => Rules.chase(R, B, cfg.diff); break; } /* Persecución libre: fácil 0, normal 1, difícil 2 */
      case 'school': { const L = LESSONS[cfg.lesson || 0]; tid = L.track; addBots(L.bots || 0, L.botLevel || 0); laps = L.laps || 999; rules = R => Rules.lesson(R, L); botSlow = L.botSlow || 0; break; }
      default: addBots(6 - n);
    }
    const wc = mode === 'world' ? CAMPAIGN[cfg.ch || 0] : null;
    newRace(tid, humans, bots, undefined, { laps, noItems: mode === 'tt' || (wc && (wc.kind === 'tt' || wc.kind === 'clean' || wc.kind === 'logs' || wc.noItems)), rules, botSlow });
    G.mode = 'race'; G.paused = false; G.shownResults = false; G.introT = G.INTRO = R.boss ? 4.6 : 3.6;
    if (isTouch()) Touch.start(n); else Touch.stop();
    UI.show(null); Sound.startRace(n); Music.play(R.boss ? 'boss_' + R.boss.def.id : TRACKS[tid].theme); resize();
  }
  function start(n) { startCfg(n, G.cfg || UI.cfg()); }
  function demo() {
    const bots = ['cumbia', 'salsa', 'taiko', 'freestyle', 'country', 'reggae'].map((p, i) => ({ pid: p, level: 2 - (i % 2) }));
    newRace(worldFor || TRACK_ORDER[0], [], bots, 0.01); G.mode = 'title';
    // en la portada, algunos bólidos lucen cosas del garaje (para antojar)
    const pick = o => { const k = Object.keys(o); return k[Math.floor(Math.random() * k.length)]; };
    meshes.forEach((m, i) => { if (Math.random() < 0.45) CarArt.skin(m, R.cars[i].pid, { paint: 'u.' + pick(CAR_PAINTS), neon: pick(CAR_NEONS), turbo: pick(CAR_TURBOS) }); }); G.shot = 0; G.shotT = 0; Touch.stop(); Sound.stopRace(); Music.play('menu');
  }
  // puntos del Gran Premio tras cada carrera
  function gpScore() { if (!G.gp || G.gp.scored === G.gp.i) return; G.gp.scored = G.gp.i; R.order.forEach((c, i) => { G.gp.pts[c.pid] = (G.gp.pts[c.pid] || 0) + (GP_PTS[i] || 0); }); }
  function gpNext() { if (!G.gp) return; G.gp.i++; startCfg(G.nHumans, G.cfg, true); }
  // duelo al mejor de tres: cada carrera suma una ronda al que llega primero
  function duelScore() { if (!G.duel || G.duel.scored === G.duel.r) return; G.duel.scored = G.duel.r; const h = R.cars.filter(c => !c.bot); if (h.length === 2) G.duel.w[h[0].place < h[1].place ? 0 : 1]++; else if (h.length === 1) G.duel.w[h[0].place === 1 ? 0 : 1]++; }
  function duelNext() { if (!G.duel) return; G.duel.r++; startCfg(G.nHumans, G.cfg, true); }
  function worldNext() { const c = G.cfg, k = World.next(c.ch || 0); if (k < 0) return; c.ch = k; Store.set('setup', c); startCfg(G.nHumans, c); }
  function lessonNext() { const c = G.cfg; c.lesson = Math.min(LESSONS.length - 1, (c.lesson || 0) + 1); Store.set('setup', c); startCfg(G.nHumans, c); }
  /* ---------- vitrina de pilotos (detrás del menú de preparar carrera) ---------- */
  let show = [];
  function clearShow() { for (const m of show) if (m) drop(m); show = []; for (const m of meshes) m.root.visible = true; }
  function setup(n) { G.mode = 'setup'; G.nHumans = n; Touch.stop(); Sound.stopRace(); for (const m of meshes) { m.root.visible = false; m.shadow.visible = false; } resize(); }
  function showPilot(i, pid) {
    if (show[i]) drop(show[i]);
    const m = CarArt.build(pid, G.nHumans === 2 ? i : null, garageSkin(i, pid)); scene.add(m.root); m.pid = pid; m.spin = 0; show[i] = m;
    for (let k = G.nHumans; k < show.length; k++) if (show[k]) { drop(show[k]); show[k] = null; }
  }
  function showroom(dt) {
    const T = R.track, s0 = T.wrap(-40), o = T.at(s0), cam = cams[0];
    T.pos(T.wrap(s0 + 9.5), 0, 2.1, V); cam.position.copy(V); T.pos(s0, 0, 0.9, V2); cam.up.copy(UP); cam.lookAt(V2); cam.fov = 50; cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
    show.forEach((m, i) => { if (!m) return; const u = G.nHumans === 2 ? (i ? -2.7 : 2.7) : 0; T.pos(s0, u, 0, V); m.root.position.copy(V); m.yaw = (m.yaw || (i ? -0.6 : 0.6)) + dt * 0.6; m.root.rotation.set(0, Math.atan2(o.tx, o.tz) + m.yaw, 0); m.wingK = 0; m.boatK = 0; });
  }
  function toTitle() { clearShow(); G.gp = null; demo(); UI.show('s-title'); resize(); try { Vestidor.after(700); } catch (e) { /* nada */ } }
  // vista previa: al elegir pista/arena en «Preparar carrera», el fondo pasa a ser esa pista (con los bólidos elegidos en la vitrina)
  let pvT = null;
  function preview(tid) {
    if (!TRACKS[tid]) return; clearTimeout(pvT);
    pvT = setTimeout(() => { if (G.mode !== 'setup' || worldFor === tid) return; const pids = show.map(m => m && m.pid);
      const bots = ['cumbia', 'salsa', 'taiko', 'freestyle', 'country', 'reggae'].map((p, i) => ({ pid: p, level: 1 })); newRace(tid, [], bots, 0.01);
      for (const m of meshes) { m.root.visible = false; m.shadow.visible = false; } show = []; pids.forEach((pid, k) => { if (pid) showPilot(k, pid); }); resize(); }, 90);
  }
  // cambiar la calidad gráfica: resolución, sombras y posproceso al instante; la portada se rearma para que se note
  function requality(lv) { GQ.lv = lv; Store.set('gq', lv); GFX.setResScale(1); GFX.applyQuality(); POST.quality(); const tid = worldFor; worldFor = null; world(tid); demo(); resize(); }
  function pause(p) {
    if (G.mode !== 'race') return; G.paused = p; UI.show(p ? 's-pause' : null); if (p) Sound.update(R, humansCars(), true);
  }
  const humansCars = () => R ? R.cars.filter(c => !c.bot) : [];
  /* ---------- eventos → HUD ---------- */
  const DRIFT_NAME = ['', 'AZUL', 'NARANJA', 'ESMERALDA'], DRIFT_COL = ['', '#5ab8ff', '#ff9a3a', '#3dffa8'];
  const TRICK_NAME = { flip: 'MORTAL', back: 'MORTAL ATRÁS', rollR: 'TONEL', rollL: 'TONEL', spin: 'TROMPO' };
  function hudEvents(events) {
    for (const e of events) {
      if (e.type === 'out') { const o = R.cars[e.car]; humansCars().forEach(h => { if (h !== o && !h.out) HUD.msg(h.human, (o.bot ? o.P.name : 'J' + (o.human + 1)) + ' QUEDÓ FUERA', '#ffb84a', { key: 'out', life: 1.6 }); }); }
      if (e.type === 'hit' && e.by >= 0 && e.by !== e.car) { const a = R.cars[e.by]; if (a && !a.bot) HUD.msg(a.human, '¡LE DISTE!', '#ffd23d', { key: 'hitDone', life: 1, sub: R.cars[e.car].P.name }); }
      if (R.boss) { const B = R.boss, all = (txt, col, o) => humansCars().forEach(h => HUD.msg(h.human, txt, col, o));
        if (e.type === 'bossAtk') all(BOSS_ATK_NAME[e.k] || '¡CUIDADO!', '#ff9a6a', { key: 'batk', life: 1.3, sub: BOSS_ATK_SUB[e.k] || '' });
        else if (e.type === 'bossPhase') all('¡' + B.def.short + ' FURIOSO!', '#ff5a36', { big: true, life: 1.8, sub: 'ataca más seguido' });
        else if (e.type === 'bossLow') all(B.def.id === 'scarab' ? '¡ESTÁ ATURDIDO!' : '¡ESTÁ BAJO!', '#3dffa8', { big: true, life: 1.8, sub: 'embístelo con turbo · daño ×1,5' });
        else if (e.type === 'bossWagonDown') all('¡VAGÓN DESTRUIDO!', '#ffd23d', { life: 1.4, sub: 'suelta botín' });
        else if (e.type === 'bossHit' && e.by >= 0) { const a = R.cars[e.by]; if (a && !a.bot) HUD.msg(a.human, '−' + e.n, B.phase === 2 ? '#ff7a5a' : B.def.col, { key: 'bdmg', life: 0.8, sub: e.kind === 'ram' ? '¡EMBESTIDA!' : '' }); }
        else if (e.type === 'lootGot') { const a = R.cars[e.car]; if (a && !a.bot) HUD.msg(a.human, 'BOTÍN', '#ffd23d', { key: 'loot', life: 0.9, sub: a.item ? ITEMS[a.item].name : '+ barra' }); } }
      const c = e.car != null ? R.cars[e.car] : null; if (!c || c.bot) continue; const i = c.human;
      switch (e.type) {
        case 'perfectStart': HUD.msg(i, '¡SALIDA PERFECTA!', '#3dffa8', { big: true, life: 1.6 }); break;
        case 'driftBoost': HUD.msg(i, 'TURBO ' + DRIFT_NAME[e.lv], DRIFT_COL[e.lv], { key: 'drift', life: 0.9 }); break;
        case 'trick': c._tricks = (c._tricks || []).concat(TRICK_NAME[e.kind]); break;
        case 'landTrick': HUD.msg(i, e.n > 1 ? `¡PIRUETA x${e.n}!` : '¡PIRUETA!', '#ffd23d', { big: true, sub: (c._tricks || []).join(' + '), life: 1.5 }); c._tricks = []; break;
        case 'landBad': HUD.msg(i, '¡MAL ATERRIZAJE!', '#ff5a36', { life: 1.2 }); c._tricks = []; break;
        case 'draft': HUD.msg(i, 'REBUFO', '#bfe9ff', { life: 1 }); break;
        case 'gemSeg': if (e.n >= 4) HUD.msg(i, '¡BARRA LLENA!', '#3dffa8', { life: 1.4 }); break;
        case 'fall': HUD.msg(i, '¡AL AGUA!', '#62e0ff', { big: true, life: 1.4 }); break;
        case 'lap': if (c.finished || (R.rules && R.rules.noLaps)) break; if (e.lap === R.laps - 1) HUD.msg(i, '¡VUELTA FINAL!', '#ff7a5a', { big: true, life: 2, sub: HUD.fmt(c.laps[c.laps.length - 1]) }); else HUD.msg(i, 'VUELTA ' + (e.lap + 1), '#fff', { life: 1.6, sub: HUD.fmt(c.laps[c.laps.length - 1]) }); break;
        case 'pad': HUD.msg(i, 'IMPULSO', '#7dffd0', { key: 'pad', life: 0.7 }); break;
        case 'mode': { const n = (c._modeN = c._modeN || {}); n[e.mode] = (n[e.mode] || 0) + 1; const hint = n[e.mode] <= 2;
          if (e.mode === 'air') HUD.msg(i, '¡A VOLAR!', '#8affc8', { big: true, life: 1.8, sub: hint ? (Touch.active ? 'palanca ↑ picada · ↓ subir · pasa por los aros' : (i ? '↑ picada · ↓ subir' : 'W picada · S subir') + ' · pasa por los aros') : '' });
          else if (e.mode === 'water') HUD.msg(i, '¡AL AGUA!', '#62e0ff', { big: true, life: 1.6, sub: hint ? 'las olas grandes son rampas' : '' }); break; }
        case 'hit': HUD.msg(i, e.kind === 'bolt' ? '¡RAYO!' : e.kind === 'oil' ? '¡RESBALÓN!' : '¡TROMPO!', '#ff5a36', { big: true, life: 1.2, sub: e.by >= 0 && e.by !== e.car ? 'por ' + R.cars[e.by].P.name : '' }); break;
        case 'dodge': HUD.msg(i, '¡ESQUIVE!', '#8affc8', { big: true, life: 1.2 }); break;
        case 'shieldPop': HUD.msg(i, 'EL ESCUDO AGUANTÓ', '#62c8ff', { life: 1.1 }); break;
        case 'special': HUD.msg(i, '¡' + SPECIALS[c.pid].name + '!', SPECIALS[c.pid].col, { big: true, life: 1.6 }); break;
        case 'itemGot': if (c.item) HUD.msg(i, ITEMS[c.item].name.toUpperCase(), '#fff', { key: 'item', life: 0.9 }); break;
        case 'ring': HUD.msg(i, e.big ? '¡ARO DORADO!' : '¡ARO!', e.big ? '#ffd23d' : '#3dffa8', { key: 'ring', life: 0.9 }); break;
        case 'heart': HUD.msg(i, e.n > 0 ? (e.n === 1 ? '¡ÚLTIMO CORAZÓN!' : '−1 ♥') : '¡SIN CORAZONES!', '#ff5a7a', { key: 'heart', big: e.n <= 1, life: 1.4 }); break;
        case 'lessonTick': if (e.n < e.need) HUD.msg(i, `✓ ${e.n}/${e.need}`, '#3dffa8', { key: 'lesson', big: true, life: 1.2 }); break;
        case 'logHit': HUD.msg(i, '¡TRONCO!', '#ff7a4a', { key: 'log', big: true, life: 1.1, sub: 'golpe ' + (c.logHits || 1) }); break;
        case 'stormFree': HUD.msg(i, '¡A CORRER!', '#3dffa8', { key: 'storm', big: true, life: 1.1 }); break;
        case 'sandIn': HUD.msg(i, '¡ARENAS MOVEDIZAS!', '#e8b060', { key: 'sand', life: 1.1 }); break;
        case 'stompHit': HUD.msg(i, '¡PISOTÓN!', '#ff5a36', { big: true, life: 1.2, sub: 'derrapa justo antes para brincar la onda' }); break;
      }
    }
  }
  /* ---------- cámaras ---------- */
  function chase(i, car, dt, snap) {
    const T = R.track, cam = cams[i]; let s = camSt[i];
    if (!s || snap) s = camSt[i] = { a: car.a, h: car.h, fov: 68, shake: 0, pos: new THREE.Vector3(), look: new THREE.Vector3(), init: false };
    // rumbo de la cámara: entre el rumbo del bólido y su velocidad (el derrape se lee de lado)
    const vh = car.f > 6 ? Math.atan2(car.vu, car.vs) : car.a, want = car.drift.on ? angWrap(vh + angWrap(car.a - vh) * 0.45) : car.a;
    s.a = s.a + angWrap(want - s.a) * (1 - Math.exp(-(car.drift.on ? 4.5 : 7) * dt));
    s.h = damp(s.h, car.h, car.grounded ? 10 : 3.2, dt);
    const o = T.at(car.s), ca = Math.cos(s.a), sa = Math.sin(s.a);
    FWD.set(o.tx * ca + o.rx * sa, o.ty * ca + o.ry * sa, o.tz * ca + o.rz * sa).normalize();
    TU.set(o.ux, o.uy, o.uz); const up = V2.copy(UP).lerp(TU, 0.55).normalize();
    s.airK = damp(s.airK || 0, car.mode === 'air' ? 1 : 0, 2.5, dt);
    const sp = clamp(car.f / car.vmax, 0, 1.4), back = 6.6 + sp * 1.6 + s.airK * 2.4, high = 2.5 + sp * 0.35 + s.airK * 1.2;
    T.pos(car.s, car.u, s.h, V);
    const pos = V.clone().addScaledVector(FWD, -back).addScaledVector(up, high);
    const look = V.clone().addScaledVector(FWD, 4.5).addScaledVector(up, 1.15);
    // en calles angostas: la cámara no se mete en las fachadas
    { const sc = T.wrap(car.s - back * 0.9), town = T.zone(sc, 'town'); if (!T.zone(sc, 'air')) { const o2 = T.at(sc), uc = (pos.x - o2.px) * o2.rx + (pos.y - o2.py) * o2.ry + (pos.z - o2.pz) * o2.rz, lim = T.limits(sc).wall + (town || T.def.arena ? -0.7 : 0.6); if (Math.abs(uc) > lim) { const d = uc - Math.sign(uc) * lim; pos.x -= o2.rx * d; pos.y -= o2.ry * d; pos.z -= o2.rz * d; } } }
    // no meter la cámara bajo el terreno (detrás de crestas)
    const th = GFX.W.terrain && GFX.W.terrain.userData.height ? GFX.W.terrain.userData.height(pos.x, pos.z) : -1e9; if (pos.y < th + 1.2) pos.y = th + 1.2;
    if (!s.init) { s.pos.copy(pos); s.look.copy(look); s.init = true; } else { s.pos.lerp(pos, 1 - Math.exp(-14 * dt)); s.look.lerp(look, 1 - Math.exp(-18 * dt)); }
    s.shake = Math.max(0, s.shake - dt * 2.5);
    cam.position.copy(s.pos); if (s.shake > 0) cam.position.add(V.set((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake));
    cam.up.copy(up); cam.lookAt(s.look);
    const fov = 66 + sp * 8 + (car.boostT > 0 ? 9 * (car.boostK > 1 ? 1.25 : 1) : 0) + (car.grounded ? 0 : 2);
    s.fov = damp(s.fov, fov, 4, dt); cam.fov = s.fov; cam.updateProjectionMatrix();
  }
  // portada: tomas de cine sobre el líder
  function cinema(dt) {
    const cam = cams[0], T = R.track; G.shotT += dt; if (G.shotT > 6.5) { G.shotT = 0; G.shot = (G.shot + 1) % 4; }
    const c = R.order[G.shot === 1 ? 1 : 0] || R.cars[0], k = G.shotT, lim = T.limits(c.s), rd = lim.road - 0.6;
    T.pos(c.s, c.u, c.h + 0.9, V2); let s = c.s, u = 0, h = 2, fov = 55;
    if (G.shot === 0) { s = c.s + 7 - k * 2.3; u = clamp(c.u + (c.u > 0 ? -5.5 : 5.5), -rd, rd); h = 1.5; fov = 50; }
    else if (G.shot === 1) { s = c.s + 13; u = clamp(c.u - 1.8, -rd, rd); h = 0.9; fov = 44; }
    else if (G.shot === 3) { s = c.s - 8.5; u = clamp(c.u * 0.6 + 1.6, -rd, rd); h = 2.7; fov = 70; }
    if (G.shot === 2) { const a = k * 0.22 + c.s * 0.001; cam.position.copy(V2).add(V.set(Math.cos(a) * 55, 34, Math.sin(a) * 55)); fov = 52; }
    else T.pos(T.wrap(s), u, h, cam.position);
    const th = GFX.W.terrain.userData.height ? GFX.W.terrain.userData.height(cam.position.x, cam.position.z) : -1e9; if (cam.position.y < th + 1.2) cam.position.y = th + 1.2;
    cam.up.copy(UP); cam.lookAt(G.shot === 3 ? V2.addScaledVector(V.set(T.at(c.s).tx, 0, T.at(c.s).tz), 6) : V2); cam.fov = fov; cam.updateProjectionMatrix();
  }
  /* ---------- presentación de la pista: vuelo de cámara y título ---------- */
  function introCam() {
    const T = R.track, k = smooth(clamp(1 - G.introT / G.INTRO, 0, 1)), sg = T.wrap(-26), o = T.at(sg), C = T.pos(sg, 0, 0, V.clone());
    const a = lerp(2.5, 0.12, k), rad = lerp(190, 17, k), hh = lerp(110, 5.5, k), tx = -o.tx * Math.cos(a) + o.rx * Math.sin(a), tz = -o.tz * Math.cos(a) + o.rz * Math.sin(a);
    const cam = cams[0]; cam.position.set(C.x + tx * rad, C.y + hh, C.z + tz * rad); cam.up.copy(UP); cam.lookAt(C.x + o.tx * 30 * k, C.y + 2, C.z + o.tz * 30 * k); cam.fov = 55; cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
  }
  function titleCard() {
    const x = HUD.ctx(), W = innerWidth, H = innerHeight, d = R.track.def, e = G.INTRO - G.introT, a = clamp(e / 0.5, 0, 1) * clamp(G.introT / 0.5, 0, 1), sc = clamp(Math.min(W, H) / 560, 0.6, 1.4);
    x.globalAlpha = a; const g = x.createLinearGradient(0, H * 0.55, 0, H); g.addColorStop(0, 'rgba(2,6,14,0)'); g.addColorStop(1, 'rgba(2,6,14,0.75)'); x.fillStyle = g; x.fillRect(0, H * 0.55, W, H * 0.45);
    HUD.txt(d.name.toUpperCase(), W / 2, H * 0.8, `italic ${fontT(70 * sc)}`, '#ffffff', 'center', 9 * sc);
    const modeTxt = R.rules ? R.rules.introSub : G.cfg && G.cfg.mode === 'duel' && G.duel ? `Duelo · ronda ${G.duel.r + 1} · J1 ${G.duel.w[0]} – ${G.duel.w[1]} J2` : R.laps + ' vueltas';
    HUD.txt(d.sub + ' · ' + (d.country || ''), W / 2, H * 0.8 + 34 * sc, fontB(19 * sc, 900), '#b8ffe0', 'center', 5 * sc);
    HUD.txt(modeTxt, W / 2, H * 0.8 + 58 * sc, fontB(16 * sc, 900), '#ffffff', 'center', 4 * sc);
    const hc = humansCars(); HUD.txt(hc.map((c, i) => c.P.name + ' (J' + (i + 1) + ')').join(R.boss ? '   y   ' : '   vs   '), W / 2, H * 0.8 + 82 * sc, fontB(16 * sc, 900), '#ffd23d', 'center', 4 * sc);
    if (R.rules && (R.rules.L || R.rules.tip)) { const tip = R.rules.L ? R.rules.L.tip : R.rules.tip; hc.forEach((c, i) => { const v = views[i] || { x: 0, w: W }; HUD.wrap(tip(i), (hc.length === 2 ? (i ? W * 0.75 : W * 0.25) : W / 2), H * 0.18, Math.min(W / hc.length - 40, 520), fontB(15 * sc, 900), '#fff', 20 * sc); }); }
    x.globalAlpha = a * 0.7; HUD.txt(Touch.active ? 'toca para saltar' : 'cualquier tecla para saltar', W / 2, H - 14 * sc, fontB(12 * sc, 800), '#fff', 'center', 3); x.globalAlpha = 1;
  }
  const skipIntro = () => { if (G.mode === 'race' && G.introT > 0 && G.INTRO - G.introT > 0.5) G.introT = 0.01; };
  addEventListener('keydown', skipIntro); addEventListener('touchstart', skipIntro, { passive: true }); addEventListener('mousedown', skipIntro);
  /* ---------- tamaño y vistas ---------- */
  let views = [];
  function resize() {
    const W = innerWidth, H = innerHeight; GFX.renderer.setSize(W, H); POST.resize(W, H); HUD.resize(); if (Touch.active) Touch.layout();
    const n = G.mode === 'race' && !(G.introT > 0) ? G.nHumans : 1;
    views = n === 2 ? [{ x: 0, y: 0, w: Math.floor(W / 2) - 1, h: H }, { x: Math.ceil(W / 2) + 1, y: 0, w: W - Math.ceil(W / 2) - 1, h: H }] : [{ x: 0, y: 0, w: W, h: H }];
    cams.forEach((c, i) => { const v = views[i] || views[0]; c.aspect = v.w / v.h; c.updateProjectionMatrix(); });
  }
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.mode === 'race' && !G.paused) pause(true); });
  /* ---------- resolución dinámica: si un equipo no da, se baja la resolución hasta que vaya fluido (y se sube cuando sobra) ---------- */
  const DR = { acc: 0, n: 0, t: 0, cool: 0 };
  function dynRes(dt) {
    if (G.noDynRes || G.mode !== 'race' || G.paused || G.introT > 0 || dt <= 0) { DR.acc = DR.n = DR.t = 0; return; }
    DR.acc += dt; DR.n++; DR.t += dt; DR.cool -= dt; if (DR.t < 1.5) return;
    const avg = DR.acc / DR.n; DR.acc = DR.n = DR.t = 0; let k = GFX.resK;
    if (avg > 1 / 44 && k > 0.55) k = Math.max(0.55, k - (avg > 1 / 28 ? 0.15 : 0.08));
    else if (avg < 1 / 57 && k < 1 && DR.cool <= 0) k = Math.min(1, k + 0.05);
    if (GFX.setResScale(Math.round(k * 100) / 100)) { DR.cool = 5; resize(); }
  }
  /* ---------- bucle ---------- */
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;
    if (!R) return; dynRes(dt);
    const intro = G.mode === 'race' && G.introT > 0 && !G.paused;
    if (intro) { G.introT -= dt; if (G.introT <= 0) { G.introT = 0; camSt.fill(null); resize(); } }
    const run = !(G.mode === 'race' && G.paused) && !intro && G.mode !== 'setup';
    frameEv.length = 0;
    if (run) { t += dt; acc += dt; let n = 0; while (acc >= DT && n < 14) { R.step(DT); Input.endStep(); if (R.events.length) frameEv.push(...R.events); acc -= DT; n++; } if (n >= 14) acc = 0; }
    // demostración infinita: reiniciar cuando terminen
    if (G.mode === 'title' && R.state === 'done' && R.doneT > 4) { demo(); resize(); }
    // eventos
    if (G.mode === 'race') { hudEvents(frameEv); Sound.onEvents(R, frameEv); for (const e of frameEv) { const c = e.car != null ? R.cars[e.car] : null; if (c && !c.bot && camSt[c.human]) { if (e.type === 'teleport') camSt[c.human] = null; else if (e.type === 'wall' && e.hit > 8) camSt[c.human].shake = Math.min(0.5, e.hit * 0.02); if (e.type === 'landBad' || (e.type === 'land' && e.hard > 14)) camSt[c.human].shake = 0.35; } } }
    HUD.update(run ? dt : 0);
    // dibujar bólidos
    if (G.mode !== 'setup') for (let i = 0; i < R.cars.length; i++) { CarArt.pose(meshes[i], R.cars[i], R.track, t, run ? dt : 0); meshes[i].root.updateMatrixWorld(); }
    if (run) FX.update(R, meshes, frameEv, dt, t);
    ItemArt.update(R, meshes, frameEv, t, run ? dt : 0); BossArt.update(R, t, run ? dt : 0, frameEv);
    GFX.update(t, dt);
    // cámaras
    if (G.freeCam) { /* depuración */ } else if (G.mode === 'setup') showroom(dt); else if (intro) introCam(dt); else if (G.mode === 'race') humansCars().forEach((c, i) => chase(i, c.out ? (R.order.find(o => !o.out) || c) : c, dt, false)); else cinema(dt);
    // render por vista
    const r = GFX.renderer, H = innerHeight, post = POST.on;
    if (post) POST.begin(); else if (views.length > 1) { r.setScissor(0, 0, innerWidth, H); r.setViewport(0, 0, innerWidth, H); r.setClearColor(0x03060d); r.clear(); }
    const hcs = G.mode === 'race' ? humansCars() : [];
    views.forEach((v, i) => { const cam = cams[i] || cams[0], asp = v.w / v.h; if (Math.abs(cam.aspect - asp) > 1e-3) { cam.aspect = asp; cam.updateProjectionMatrix(); } // cada vista con su proporción (evita la imagen aplastada)
      GFX.shadowFocus(cam);
      if (post) POST.setView(v); else { r.setViewport(v.x, H - v.y - v.h, v.w, v.h); r.setScissor(v.x, H - v.y - v.h, v.w, v.h); }
      FX.setScale(v.h, cam.fov); r.render(scene, cam);
      const c = hcs[i]; G.spd = G.spd || [0, 0]; G.spd[i] = damp(G.spd[i], c && c.boostT > 0 && !intro ? (c.boostK > 1 ? 1 : 0.7) : 0, 6, dt); });
    if (post) POST.end(views, G.spd || [0, 0], GFX.theme && GFX.theme.grade, t);
    // HUD
    HUD.clear();
    if (intro) { titleCard(); }
    else if (G.mode === 'race') {
      const hc = humansCars(), split = hc.length === 2, touch = Touch.active, W = innerWidth, H = innerHeight, x = HUD.ctx();
      const mmS = Math.min(W, H) * (split ? (touch ? 0.17 : 0.2) : touch ? 0.17 : 0.22), mmR = mmS * 0.62;
      hc.forEach((c, i) => HUD.player(views[i], c, R, i, t, { split, touch, mirror: split && i === 1, innerInset: split ? mmR + 8 : 0, insetT: touch ? 4 : 0, itemKey: touch ? '' : i ? 'L' : 'G' }));
      if (split) { x.fillStyle = '#03060d'; x.fillRect(W / 2 - 2, 0, 4, H); }
      if (split || touch) HUD.minimap(R, W / 2, (touch ? 56 : 12) + mmR, mmS, t);
      else HUD.minimap(R, W - mmR - 20, H * 0.42, mmS, t);
      Touch.draw(x, hc, t);
      Sound.update(R, hc, G.paused);
      if (R.state === 'done' && R.doneT > 3.2 && !G.shownResults) { G.shownResults = true; if (G.cfg && G.cfg.mode === 'gp') gpScore(); if (G.cfg && G.cfg.mode === 'duel') duelScore(); UI.results(R, G); }
    }
  }
  /* ---------- arranque ---------- */
  function boot() {
    demo(); resize(); UI.show('s-title'); requestAnimationFrame(frame);
    window.__vtg = { get R() { return R; }, get G() { return G; }, cams: () => cams, meshes: () => meshes, look(px, py, pz, tx, ty, tz, fov = 60) { G.freeCam = true; const c = cams[0]; c.position.set(px, py, pz); c.up.set(0, 1, 0); c.lookAt(tx, ty, tz); c.fov = fov; c.updateProjectionMatrix(); } };
  }
  return Object.assign(G, { start, startCfg, setup, showPilot, gpNext, duelNext, lessonNext, worldNext, toTitle, pause, boot, requality, preview });
})();
(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => { try { Game.boot(); Hub.onPlay(ev => UI.hubPlay(ev)); Hub.ready(); } catch (e) { console.error(e); const v = document.getElementById('ver'); if (v) v.textContent = 'Este navegador no pudo iniciar los gráficos 3D (WebGL): ' + e.message; } });
