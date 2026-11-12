/* =========================================================================
   INTERFAZ — portada (con carrera de demostración de fondo), controles,
   pausa y resultados. Los botones usan data-act.
   ========================================================================= */
const UI = (() => {
  const $ = id => document.getElementById(id);
  const screens = ['s-title', 's-howto', 's-pause', 's-results', 's-setup', 's-world', 's-opts'];
  function show(id) { for (const s of screens) $(s).hidden = s !== id; $('pauseBtn').style.display = id ? 'none' : (Touch.active ? 'flex' : 'none'); }
  function act(a) {
    Sound.unlock(); Sound.ui();
    switch (a) {
      case 'play1': goFull(); if (cfg.mode === 'world') cfg.mode = 'quick'; openSetup(1); break;
      case 'play2': goFull(); if (cfg.mode === 'world') cfg.mode = 'quick'; openSetup(2); break;
      case 'world': goFull(); openWorld(); break;
      case 'worldNext': Game.worldNext(); break;
      case 'howto': show('s-howto'); break;
      case 'gq': Game.requality((GQ.lv + 2) % 3); gqLabel(); break;
      case 'opts': fillOpts(); show('s-opts'); break;
      case 'fs': FS.toggle(); break;
      case 'back': if (hubCfg) { hubLeave(); Game.toTitle(); break; } if (!$('s-setup').hidden && cfg.mode === 'world') openWorld(); else Game.toTitle(); break;
      case 'startRace': if (hubCfg) { hubGo(); break; } Store.set('setup', cfg); Game.startCfg(nH, cfg); break;
      case 'hubhome': case 'hubback': Hub.exit(); break;
      case 'setup': openSetup(Game.nHumans); break;
      case 'gpNext': Game.gpNext(); break;
      case 'duelNext': Game.duelNext(); break;
      case 'lessonNext': Game.lessonNext(); break;
      case 'resume': Game.pause(false); break;
      case 'restart': if (cfg.mode === 'gp') { cfg.mode = 'gp'; Game.startCfg(nH, cfg); } else Game.startCfg(nH, cfg); break;
      case 'toTitle': if (Hub.ev) hubLeave(); Game.toTitle(); break;
    }
  }
  // opciones: gráficos y pantalla completa (manual y automática)
  function segOn(id, v, fn) { document.querySelectorAll('#' + id + ' button').forEach(b => { b.classList.toggle('on', b.dataset.v === String(v)); b.onclick = e => { e.stopPropagation(); Sound.ui(); fn(b.dataset.v); fillOpts(); }; }); }
  function fsLabel() { document.querySelectorAll('[data-act=fs]').forEach(b => { b.textContent = b.dataset.long ? 'Pantalla completa: ' + (FS.on ? 'salir' : 'activar') : FS.label(); }); }
  FS.onChange(fsLabel);
  function fillOpts() { segOn('o-gq', GQ.lv, v => { Game.requality(+v); gqLabel(); }); segOn('o-fsauto', FS.auto ? 1 : 0, v => { FS.auto = v === '1'; }); fsLabel(); }
  function gqLabel() { const b = document.querySelector('[data-act=gq]'); if (b) b.innerHTML = `Gráficos: ${GQ.names[GQ.lv]}<small>${['más fluido', 'equilibrado', 'máximo detalle'][GQ.lv]}</small>`; }
  gqLabel();
  // pantalla completa automática al empezar (en el celular, también horizontal); se puede quitar en Opciones
  function goFull() { FS.autoEnter(); }
  document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b) act(b.dataset.act); });
  $('pauseBtn').addEventListener('click', () => Game.pause(true));
  /* ---------- preparar carrera: pilotos (vitrina 3D detrás), modo, pista, máquina y vueltas ---------- */
  let nH = 2; const cfg = Object.assign({ mode: 'quick', track: TRACK_ORDER[0], arena: ARENA_ORDER[0], lesson: 0, cup: 0, boss: 'tren', ch: 0, diff: 1, laps: 3, p: ['cumbia', 'salsa'] }, Store.get('setup', {}));
  if (!TRACK_ORDER.includes(cfg.track)) cfg.track = TRACK_ORDER[0]; if (!ARENA_ORDER.includes(cfg.arena)) cfg.arena = ARENA_ORDER[0]; if (!(cfg.lesson >= 0 && cfg.lesson < LESSONS.length)) cfg.lesson = 0; if (!MODE_NAMES[cfg.mode] && cfg.mode !== 'world') cfg.mode = 'quick'; if (!BOSSES[cfg.boss]) cfg.boss = 'tren'; if (!(cfg.ch >= 0 && cfg.ch < CAMPAIGN.length)) cfg.ch = 0;
  const medals = () => Store.get('school', {}), MEDAL = ['', '🥉', '🥈', '🥇'];
  const STAT = [['vel', 'Velocidad'], ['acc', 'Aceleración'], ['han', 'Manejo'], ['wt', 'Peso'], ['water', 'Lancha'], ['air', 'Ala']];
  function side(i) {
    const el = $('side' + i); el.classList.toggle('off', i >= nH); if (i >= nH) return;
    const pid = cfg.p[i], P = PILOTS[pid], sp = SPECIALS[pid], pc = PLAYER_COLORS[i].main;
    const lum = h => { const c = new THREE.Color(h); return 0.3 * c.r + 0.59 * c.g + 0.11 * c.b; }, nc = lum(P.color) < 0.22 ? P.color2 : P.color;
    el.innerHTML = `<div class="who" style="color:${pc}">JUGADOR ${i + 1}</div><div class="pname" style="color:${nc};text-shadow:0 2px 0 #000,0 0 18px ${nc}">${P.name}</div><div class="pfrom">${P.from} · bólido «${P.car}»</div>`
      + `<div class="chips">${PILOT_ORDER.map(k => `<button class="chip${k === pid ? ' on' : ''}" style="--c:${PILOTS[k].color}" data-pick="${i}:${k}">${PILOTS[k].name}</button>`).join('')}</div>`
      + STAT.map(([k, n]) => `<div class="stat"><span>${n}</span><div class="bar"><i style="width:${(P[k] || 3) * 20}%"></i></div></div>`).join('')
      + `<div class="spec" style="--c:${sp.col}"><b>${sp.name}</b> — ${sp.desc}</div>`
      + `<div class="keyhint">${isTouch() ? 'toca un piloto' : i ? '← → para cambiar' : 'A D para cambiar'}</div>`;
  }
  function seg(id, items, val, fn, dis) { const el = $(id); el.innerHTML = items.map(([v, n]) => `<button data-v="${v}" class="${String(v) === String(val) ? 'on' : ''}"${dis && dis(v) ? ' disabled' : ''}>${n}</button>`).join(''); el.onclick = e => { const b = e.target.closest('button'); if (!b || b.disabled) return; Sound.ui(); fn(b.dataset.v); renderSetup(); }; }
  function renderSetup() {
    if (nH === 2 && cfg.mode === 'tt') cfg.mode = 'quick'; if (nH === 1 && cfg.mode === 'duel') cfg.mode = 'quick';
    side(0); side(1); const m = cfg.mode;
    if (m === 'world') { const C = CAMPAIGN[cfg.ch], S = STOPS[STOP_IDX[C.stop]];
      seg('optMode', [['world', 'Vuelta al mundo']], 'world', () => 0); $('optTrackL').textContent = 'Reto'; seg('optTrack', [[cfg.ch, S.name + ' · ' + C.name]], cfg.ch, () => 0);
      seg('optDiff', [[0, 'Fácil'], [1, 'Normal'], [2, 'Difícil']], C.diff != null ? C.diff : -1, () => 0, () => true); seg('optLaps', [[2, '2'], [3, '3'], [4, '4']], C.laps || -1, () => 0, () => true);
      $('modeHelp').textContent = kindName(C) + ': ' + C.goal[0].toUpperCase() + C.goal.slice(1) + '. ' + starLine(C); Game.preview(C.track); return; }
    seg('optMode', [['quick', 'Carrera'], ['gp', 'Gran Premio'], ['tt', 'Contrarreloj'], ['duel', 'Duelo'], ['elim', 'Eliminación'], ['battle', 'Batalla'], ['chase', 'Persecución'], ['school', 'Escuela']], m, v => cfg.mode = v, v => (v === 'tt' && nH === 2) || (v === 'duel' && nH === 1));
    $('optTrackL').textContent = m === 'battle' ? 'Arena' : m === 'school' ? 'Lección' : m === 'gp' ? 'Copa' : m === 'chase' ? 'Jefe' : 'Pista';
    if (m === 'chase') { const bs = Store.get('chase', {}); seg('optTrack', BOSS_ORDER.map(k => [k, BOSSES[k].name.replace(/^El /, '') + (bs[k] ? ' ' + '★'.repeat(bs[k]) : '')]), cfg.boss, v => cfg.boss = v); }
    else if (m === 'battle') seg('optTrack', ARENA_ORDER.map(k => [k, TRACKS[k].name]), cfg.arena, v => cfg.arena = v);
    else if (m === 'school') { const md = medals(); seg('optTrack', LESSONS.map((L, i) => [i, `${i + 1} ${L.name}${md[L.id] ? ' ' + MEDAL[md[L.id]] : ''}`]), cfg.lesson, v => cfg.lesson = +v); }
    else if (m === 'gp') seg('optTrack', CUPS.map((c, i) => [i, `${c.name} (${cupTracks(i).length})`]), cfg.cup || 0, v => cfg.cup = +v);
    else seg('optTrack', TRACK_ORDER.map(k => [k, TRACKS[k].name]), cfg.track, v => cfg.track = v);
    seg('optDiff', [[0, 'Fácil'], [1, 'Normal'], [2, 'Difícil']], cfg.diff, v => cfg.diff = +v, () => m === 'tt' || m === 'duel' || m === 'school');
    seg('optLaps', [[2, '2'], [3, '3'], [4, '4']], cfg.laps, v => cfg.laps = +v, () => m === 'elim' || m === 'battle' || m === 'school' || m === 'chase');
    $('modeHelp').textContent = MODE_HELP[m] ? MODE_HELP[m](nH) : '';
    Game.preview(m === 'battle' ? cfg.arena : m === 'school' ? LESSONS[cfg.lesson || 0].track : m === 'gp' ? cupTracks(cfg.cup || 0)[0] : m === 'chase' ? BOSSES[cfg.boss].track : cfg.track);
  }
  const MODE_HELP = {
    quick: n => 'Una carrera con objetos contra la máquina.', gp: n => 'Varias pistas seguidas sumando puntos: Copa Esmeralda, Copa Dorada o la Gran Copa con todas.', tt: n => 'Solo contra el reloj: sin máquina ni objetos.',
    duel: n => 'Mano a mano, sin máquina: el primero en ganar 2 carreras gana el duelo.', elim: n => 'Cada 15 segundos sale el último. ¡Sobrevive hasta el final!',
    battle: n => 'Arena con 3 corazones: cada golpe quita uno. Embiste con turbo. Gana el último en pie.', chase: n => (n === 2 ? 'Juntos' : 'Tú solo') + ' contra ' + BOSSES[cfg.boss].name + ': ' + BOSSES[cfg.boss].intro[0].toLowerCase() + BOSSES[cfg.boss].intro.slice(1) + '. Bájale la vida antes de que ' + (BOSSES[cfg.boss].laps === 2 ? 'cruce la meta dos veces.' : 'dé vuelta y media.'), school: n => LESSONS[cfg.lesson || 0].goal[0].toUpperCase() + LESSONS[cfg.lesson || 0].goal.slice(1) + '.',
  };
  function pick(i, pid) { if (i >= nH) return; if (nH === 2 && cfg.p[1 - i] === pid) cfg.p[1 - i] = cfg.p[i]; cfg.p[i] = pid; Sound.ui(); renderSetup(); for (let k = 0; k < nH; k++) Game.showPilot(k, cfg.p[k]); }
  function step(i, d) { const L = PILOT_ORDER, k = (L.indexOf(cfg.p[i]) + d + L.length) % L.length; pick(i, L[k]); }
  function openSetup(n) { nH = n; if (cfg.p[0] === cfg.p[1]) cfg.p[1] = PILOT_ORDER.find(k => k !== cfg.p[0]); Game.setup(n); renderSetup(); for (let k = 0; k < n; k++) Game.showPilot(k, cfg.p[k]); show('s-setup'); }
  document.addEventListener('click', e => { const b = e.target.closest('[data-pick]'); if (b) { const [i, k] = b.dataset.pick.split(':'); pick(+i, k); } });
  addEventListener('keydown', e => {
    if (!$('s-setup').hidden) { const c = e.code; if (c === 'KeyA') step(0, -1); else if (c === 'KeyD') step(0, 1); else if (c === 'ArrowLeft') step(nH === 2 ? 1 : 0, -1); else if (c === 'ArrowRight') step(nH === 2 ? 1 : 0, 1); else if (c === 'Enter' || c === 'Space') act('startRace'); else if (c === 'Escape') act('back'); return; }
    if (e.code === 'Escape' || e.code === 'KeyP') { if (Game.mode === 'race') Game.pause(!Game.paused); }
    if (e.code === 'KeyM') Sound.toggle();
    if (e.code === 'Enter' && !$('s-results').hidden) act($('resMain').dataset.act);
  });
  /* ---------- prueba de un torneo de GameHub ---------- */
  let hubCfg = null;
  function hubLeave() { Hub.leave(); hubCfg = null; $('s-setup').classList.remove('hubpick'); }
  function hubPlay(ev) {
    const c = Object.assign({}, cfg, { mode: ev.mode, laps: ev.rounds || 3, diff: ev.opts && ev.opts.diff != null ? ev.opts.diff : 1, p: cfg.p.slice() });
    if (ev.mode === 'battle') c.arena = ARENA_ORDER.includes(ev.map) ? ev.map : ARENA_ORDER[Math.floor(Math.random() * ARENA_ORDER.length)];
    else c.track = TRACK_ORDER.includes(ev.map) ? ev.map : TRACK_ORDER[Math.floor(Math.random() * TRACK_ORDER.length)];
    hubCfg = c; goFull();
    if (ev.chars === 'random') { const L = PILOT_ORDER.slice().sort(() => Math.random() - 0.5); c.p = [L[0], L[1]]; }
    if (ev.chars === 'pick') {
      nH = 2; if (cfg.p[0] === cfg.p[1]) cfg.p[1] = PILOT_ORDER.find(k => k !== cfg.p[0]);
      $('s-setup').classList.add('hubpick'); Game.setup(2); renderSetup(); Game.preview(ev.mode === 'battle' ? c.arena : c.track); $('modeHelp').textContent = `${ev.title || 'Torneo'} · ${MODE_NAMES[ev.mode] || ev.mode} en ${TRACKS[ev.mode === 'battle' ? c.arena : c.track].name}${ev.mode !== 'battle' && ev.mode !== 'elim' ? ' · ' + c.laps + ' vueltas' : ''}. Elijan pilotos y ¡a correr!`;
      for (let k = 0; k < 2; k++) Game.showPilot(k, cfg.p[k]); show('s-setup');
    } else hubGo();
  }
  function hubGo() {
    const c = hubCfg; if (!c) return; $('s-setup').classList.remove('hubpick');
    if (Hub.ev && Hub.ev.chars === 'pick') c.p = cfg.p.slice(0, 2);
    Game.startCfg(2, c);
  }
  // ¿quién ganó la prueba? (entre los dos jugadores); en el duelo, solo cuando ya hay campeón
  function hubWinner(R, G) {
    const hum = R.cars.filter(c => !c.bot); if (hum.length < 2) return null;
    if (G && G.cfg && G.cfg.mode === 'duel' && G.duel) { const d = G.duel; return d.w[0] >= 2 ? 0 : d.w[1] >= 2 ? 1 : null; }
    const a = hum.find(c => c.human === 0), b = hum.find(c => c.human === 1); if (!a || !b) return null;
    return a.place === b.place ? -1 : a.place < b.place ? 0 : 1;
  }
  function results(R, G) {
    let hubNow = false;
    if (hubCfg && Hub.ev) { const w = hubWinner(R, G), d = G && G.duel; if (w != null) { Hub.result(w, { score: d && G.cfg.mode === 'duel' ? d.w.join(' – ') : '' }); Hub.release(); hubCfg = null; hubNow = true; } }
    results0(R, G);
    $('resHub').hidden = !hubNow; $('resMain').hidden = hubNow; $('resAlt').hidden = hubNow || !!hubCfg; const sal = document.querySelector('#resBtns [data-act="toTitle"]'); if (sal) sal.hidden = hubNow;
  }
  function results0(R, G) {
    const tb = $('resTable'); tb.innerHTML = '';
    const hum = R.cars.filter(c => !c.bot), win = hum.length === 2 ? (hum[0].place < hum[1].place ? 0 : 1) : null, gp = G && G.cfg && G.cfg.mode === 'gp' ? G.gp : null, last = gp && gp.i >= gp.list.length - 1;
    // contrarreloj: récord por pista y piloto
    if (G && G.cfg && G.cfg.mode === 'tt') { const c = hum[0], key = 'rec_' + R.track.def.id + '_' + c.pid, rec = Store.get(key, 0), now = c.finishT; if (!rec || now < rec) Store.set(key, now); $('resTitle').textContent = !rec || now < rec ? '¡Nuevo récord!' : 'Récord: ' + HUD.fmt(rec); $('resTitle').style.color = '#8affc8'; }
    else { $('resTitle').textContent = win != null ? `¡Gana J${win + 1}!` : hum[0].place === 1 ? '¡Primer lugar!' : `${hum[0].place}º lugar`; $('resTitle').style.color = win != null ? PLAYER_COLORS[win].main : ''; }
    $('resMain').textContent = gp && !last ? 'Siguiente pista' : gp ? 'Nuevo Gran Premio' : 'Otra carrera'; $('resMain').dataset.act = gp && !last ? 'gpNext' : 'restart';
    const RU = R.rules, mode = G && G.cfg && G.cfg.mode; $('resAlt').textContent = 'Cambiar pilotos'; $('resAlt').dataset.act = 'setup';
    // Vuelta al mundo: estrellas, lo que se abre y el siguiente reto
    if (mode === 'world' && RU && RU.world) { const C = RU.world, i = G.cfg.ch, st = RU.stars(R), S = STOPS[STOP_IDX[C.stop]], nextStop = STOP_IDX[C.stop] + 1, wasOpen = C.final || World.stopOpen(nextStop), was = World.save(i, st), nowOpen = !C.final && !wasOpen && World.stopOpen(nextStop), nx = World.next(i);
      const head = C.kind === 'boss' ? RU.title(R, hum) : st ? (st === 3 ? '¡Perfecto!' : '¡Reto superado!') : C.kind === 'race' || C.kind === 'elim' || C.kind === 'battle' ? 'Sin podio… otra vez' : 'Sin estrellas… otra vez';
      $('resTitle').innerHTML = `${head} <span style="color:#ffd23d;letter-spacing:2px">${'★'.repeat(st)}<span style="color:rgba(255,255,255,0.22)">${'★'.repeat(3 - st)}</span></span>`; $('resTitle').style.color = st ? '#fff' : '#ff9a7a';
      const cap = document.createElement('tr'); cap.innerHTML = `<th colspan="4">VUELTA AL MUNDO · ${S.name.toUpperCase()} · ${C.name}${st > was ? ' · ¡nuevo récord de estrellas!' : ''}</th>`; tb.appendChild(cap);
      if (nowOpen && nextStop < STOPS.length) { const tr = document.createElement('tr'); tr.innerHTML = `<td colspan="4" style="color:#8affc8">¡Nueva parada abierta: ${STOPS[nextStop].name}!</td>`; tb.appendChild(tr); }
      if (C.final && st) { const tr = document.createElement('tr'); tr.innerHTML = `<td colspan="4" style="color:#ffd23d">¡Diste la vuelta al mundo! Total: ${World.total()} de ${CAMPAIGN.length * 3} estrellas.</td>`; tb.appendChild(tr); }
      for (const c of R.order) { if ((C.kind === 'tt' || C.kind === 'clean' || C.kind === 'boss') && c.bot) continue; if (C.kind === 'goal' && c.bot) continue; const tr = document.createElement('tr'); if (!c.bot) tr.className = 'me'; const tag = c.bot ? '' : `<span class="tag" style="background:${PLAYER_COLORS[c.human].main}">J${c.human + 1}</span>`;
        const info = RU.cell ? RU.cell(c, R) : C.kind === 'clean' ? (c.finished ? HUD.fmt(c.finishT) : '—') + ' · ' + (c.cleanHits || 0) + ' choques' : (c.finished ? HUD.fmt(c.finishT) : '—');
        tr.innerHTML = `<td class="p">${c.place}º</td><td><span class="dot" style="background:${c.P.color}"></span>${c.P.name}${tag}</td><td colspan="2">${info}</td>`; tb.appendChild(tr); }
      const goNext = st > 0 && nx >= 0; $('resMain').textContent = goNext ? 'Siguiente reto' : 'Repetir'; $('resMain').dataset.act = goNext ? 'worldNext' : 'restart'; $('resAlt').textContent = 'Mapa'; $('resAlt').dataset.act = 'world';
      show('s-results'); return; }
    // modos con reglas: título y columna propios
    if (RU) { $('resTitle').textContent = RU.title(R, hum); const w = R.order[0]; $('resTitle').style.color = w && !w.bot ? PLAYER_COLORS[w.human].main : '';
      if (RU.id === 'school') { const L = RU.L, md = Store.get('school', {}); let best = 0; for (const c of hum) best = Math.max(best, RU.medal(c)); if (best > (md[L.id] || 0)) { md[L.id] = best; Store.set('school', md); }
        const nextOk = best > 0 && G.cfg.lesson < LESSONS.length - 1; $('resMain').textContent = nextOk ? 'Siguiente lección' : 'Repetir'; $('resMain').dataset.act = nextOk ? 'lessonNext' : 'restart';
        $('resTitle').style.color = best ? ['', '#e0a070', '#e8eef6', '#ffd23d'][best] : '#ff7a5a'; }
      else if (RU.id === 'chase') { const st = RU.stars(), bs = Store.get('chase', {}); if (st > (bs[RU.B.def.id] || 0)) { bs[RU.B.def.id] = st; Store.set('chase', bs); } $('resTitle').innerHTML = RU.title(R, hum) + (st ? ` <span style="color:#ffd23d">${'★'.repeat(st)}<span style="color:rgba(255,255,255,0.22)">${'★'.repeat(3 - st)}</span></span>` : ''); $('resTitle').style.color = RU.B.dead ? '#3dffa8' : '#ff7a5a'; $('resMain').textContent = 'Otra vez'; }
      else $('resMain').textContent = 'Otra vez';
      const cap = document.createElement('tr'); cap.innerHTML = `<th colspan="4">${MODE_NAMES[RU.id].toUpperCase()} · ${R.track.def.name}${RU.L ? ' · ' + RU.L.name : ''}</th>`; tb.appendChild(cap);
      for (const c of R.order) { if (RU.id === 'school' && c.bot && !RU.L.race) continue; const tr = document.createElement('tr'); if (!c.bot) tr.className = 'me'; const tag = c.bot ? '' : `<span class="tag" style="background:${PLAYER_COLORS[c.human].main}">J${c.human + 1}</span>`;
        tr.innerHTML = `<td class="p">${c.place}º</td><td><span class="dot" style="background:${c.P.color}"></span>${c.P.name}${tag}</td><td colspan="2">${RU.id === 'school' && RU.L.race ? (c.finished ? HUD.fmt(c.finishT) : '—') + (c.bot ? '' : ' · ' + RU.cell(c, R)) : RU.cell(c, R)}</td>`; tb.appendChild(tr); }
      show('s-results'); return; }
    // duelo: rondas al mejor de tres
    if (mode === 'duel' && G.duel) { const d = G.duel, champ = d.w[0] >= 2 ? 0 : d.w[1] >= 2 ? 1 : -1, rw = hum.length === 2 ? (hum[0].place < hum[1].place ? 0 : 1) : (hum[0].place === 1 ? 0 : 1);
      $('resTitle').textContent = champ >= 0 ? `¡J${champ + 1} gana el duelo!` : `¡J${rw + 1} gana la ronda ${d.r + 1}!`; $('resTitle').style.color = PLAYER_COLORS[champ >= 0 ? champ : rw].main;
      $('resMain').textContent = champ >= 0 ? 'Nuevo duelo' : 'Siguiente ronda'; $('resMain').dataset.act = champ >= 0 ? 'restart' : 'duelNext';
      const cap = document.createElement('tr'); cap.innerHTML = `<th colspan="4">DUELO · J1 ${d.w[0]} – ${d.w[1]} J2 · al mejor de 3</th>`; tb.appendChild(cap); }
    if (gp) { const order = PILOT_ORDER.filter(k => gp.pts[k] != null).sort((a, b) => gp.pts[b] - gp.pts[a]); if (last) { const champ = order[0], hc = R.cars.find(c => c.pid === champ && !c.bot); $('resTitle').textContent = hc ? `¡J${hc.human + 1} gana la ${gp.cup}!` : `Campeón: ${PILOTS[champ].name}`; $('resTitle').style.color = hc ? PLAYER_COLORS[hc.human].main : PILOTS[champ].color; }
      const cap = document.createElement('tr'); cap.innerHTML = `<th colspan="4">GRAN PREMIO · ${R.track.def.name} (${gp.i + 1}/${gp.list.length})</th>`; tb.appendChild(cap);
      order.forEach((k, i) => { const c = R.cars.find(x => x.pid === k), tr = document.createElement('tr'); if (c && !c.bot) tr.className = 'me'; const tag = c && !c.bot ? `<span class="tag" style="background:${PLAYER_COLORS[c.human].main}">J${c.human + 1}</span>` : ''; tr.innerHTML = `<td class="p">${i + 1}º</td><td><span class="dot" style="background:${PILOTS[k].color}"></span>${PILOTS[k].name}${tag}</td><td>${gp.pts[k]} pts</td><td style="color:var(--mute)">en esta: ${c ? c.place + 'º' : ''}</td>`; tb.appendChild(tr); });
      show('s-results'); return; }
    for (const c of R.order) {
      const tr = document.createElement('tr'); if (!c.bot) tr.className = 'me';
      const tag = c.bot ? '' : `<span class="tag" style="background:${PLAYER_COLORS[c.human].main}">J${c.human + 1}</span>`;
      tr.innerHTML = `<td class="p">${c.place}º</td><td><span class="dot" style="background:${c.P.color}"></span>${c.P.name}${tag}</td><td>${c.finished ? HUD.fmt(c.finishT) : '—'}</td><td style="color:var(--mute)">${c.best ? 'mejor ' + HUD.fmt(c.best) : ''}</td>`;
      tb.appendChild(tr);
    }
    show('s-results');
  }
  /* ---------- Vuelta al mundo: mapa, paradas y retos ---------- */
  let wSel = 0, wN = Store.get('wplayers', 2), wRAF = 0;
  const starLine = C => C.kind === 'tt' ? 'Estrellas: ' + C.times.map(t => HUD.fmt(t)).join(' · ') + '.' : C.kind === 'goal' ? 'Más rápido = más estrellas.' : C.kind === 'clean' ? 'Estrellas: 0–1 choques ★★★ · 2–3 ★★ · 4–6 ★.' : C.kind === 'boss' ? 'Más estrellas cuanto antes lo detengas.' : '1º ★★★ · 2º ★★ · 3º ★.';
  const firstOpen = () => { let k = 0; for (let i = 0; i < STOPS.length; i++) if (World.stopOpen(i)) { k = i; const [n, m] = World.stopStars(i); if (n === 0) break; } return k; };
  function openWorld() { Game.toTitle(); wSel = Math.min(wSel || firstOpen(), STOPS.length - 1); if (!World.stopOpen(wSel)) wSel = firstOpen(); renderWorld(); show('s-world'); cancelAnimationFrame(wRAF); const loop = () => { if ($('s-world').hidden) return; WorldMap.draw($('wMap'), wSel, performance.now() / 1000); wRAF = requestAnimationFrame(loop); }; loop(); }
  function renderWorld() {
    $('wTot').textContent = '★ ' + World.total() + ' / ' + CAMPAIGN.length * 3;
    seg('wPlayers', [[1, '1 jugador'], [2, '2 jugadores']], wN, v => { wN = +v; Store.set('wplayers', wN); });
    const S = STOPS[wSel], open = World.stopOpen(wSel), el = $('wPanel'); let h = `<div class="wc">Parada ${wSel + 1} · ${S.country}</div><h3>${S.name}</h3><p class="wb">${S.blurb}</p>`;
    if (!open) h += `<div class="wlock">🔒 Gana una estrella en ${STOPS[wSel - 1].name} para abrir esta parada.</div>`;
    CAMPAIGN.forEach((C, i) => { if (C.stop !== S.id) return; const st = World.starsOf(i), ok = World.open(i);
      h += `<div class="wch${C.kind === 'boss' ? ' boss' : ''}"><div class="k">${kindName(C)}${C.final ? ' final' : ''}</div><div class="n">${C.name}</div><div class="g">${C.goal[0].toUpperCase() + C.goal.slice(1)}.</div><div class="st">${'★'.repeat(st)}<i>${'★'.repeat(3 - st)}</i></div>`
        + (ok ? `<button class="btn go" data-wplay="${i}">${st ? 'Otra vez' : 'Jugar'}</button>` : `<div class="lock" title="${C.final ? 'Termina Islandia' : ''}">🔒</div>`) + `</div>`;
      if (C.final && !ok) h += `<div class="wlock">El jefe final se abre al ganar una estrella en Islandia.</div>`; });
    el.innerHTML = h;
  }
  function playCh(i) { if (!World.open(i)) return; Sound.ui(); cfg.mode = 'world'; cfg.ch = i; cancelAnimationFrame(wRAF); openSetup(wN); }
  document.addEventListener('click', e => { const b = e.target.closest('[data-wplay]'); if (b) playCh(+b.dataset.wplay); });
  $('wMap').addEventListener('pointerdown', e => { const r = $('wMap').getBoundingClientRect(), k = WorldMap.hit($('wMap'), e.clientX - r.left, e.clientY - r.top); if (k >= 0) { wSel = k; Sound.ui(); renderWorld(); } });
  addEventListener('keydown', e => { if ($('s-world').hidden) return; const c = e.code;
    if (c === 'ArrowRight' || c === 'ArrowDown' || c === 'KeyD') { wSel = (wSel + 1) % STOPS.length; Sound.ui(); renderWorld(); }
    else if (c === 'ArrowLeft' || c === 'ArrowUp' || c === 'KeyA') { wSel = (wSel - 1 + STOPS.length) % STOPS.length; Sound.ui(); renderWorld(); }
    else if (c === 'Enter' || c === 'Space') { e.preventDefault(); const list = CAMPAIGN.map((C, i) => i).filter(i => CAMPAIGN[i].stop === STOPS[wSel].id && World.open(i)); const k = list.find(i => World.starsOf(i) < 3); if (list.length) playCh(k != null ? k : list[0]); }
    else if (c === 'Escape') Game.toTitle(); });
  $('ver').textContent = 'v' + GAME_META.version;
  return { show, results, hubPlay, cfg: () => cfg, openWorld };
})();
