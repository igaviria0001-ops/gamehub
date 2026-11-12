/* =========================================================================
   MENÚS — paneles de vidrio sobre el cielo (los pájaros vuelan solos detrás).
   ========================================================================= */
const UI = (() => {
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  let current = 'title', stack = [], paused = false, previewRAF = 0;
  const SCREENS = { title: 's-title', birds: 's-birds', howto: 's-howto', options: 's-options', keys: 's-keys', logros: 's-logros', pause: 's-pause', results: 's-results', trav: 's-trav' };

  function show(name, push = true) {
    if (push && current && current !== name) stack.push(current);
    $$('.screen').forEach(s => { s.hidden = true; });
    current = name;
    const el = name ? $('#' + SCREENS[name]) : null;
    if (name) { Touch.hide(); if (el) { el.hidden = false; const f = focusables(el)[0]; if (f && !Touch.enabled) setTimeout(() => f.focus({ preventScroll: true }), 30); } }
    else { goFull(); Touch.show(Game.G.players === 1 ? 'single' : 'dual'); $('#cv').focus({ preventScroll: true }); }
    document.body.classList.toggle('playing', !name);
    document.body.classList.toggle('in-school', Game.G.mode === 'school' && Game.G.state !== 'attract');
    if (name === 'birds') startPreview(); else stopPreview();
    if (name === 'options') syncOptions();
    if (name === 'keys') renderKeys();
    if (name === 'howto') fillHowKeys();
    if (name === 'logros') fillLogros();
    if (name === 'trav') fillTrav();
    if (name === 'title') { const ts = $('#travSub'), tt = Travesia.total(); if (ts) ts.textContent = tt ? `de uno o de dos · ${tt}/30 ★` : 'de uno o de dos · 10 etapas'; }
    if (name === 'pause') { const K = Input.keymap; for (let i = 0; i < 2; i++) { const el = $('#pk' + i); if (el) el.innerHTML = `<b>J${i + 1}</b> ` + keyHint(i); } }
    if (name === 'title') { const bd = $('#schoolBadge'); if (bd) bd.hidden = !!Store.get('schoolSeen', false); if (VV()) VV().after(700); }
    if (name === 'title') { const md = Game.cfg.mode, m = MODES[md].name; $('[data-act="play2"]').textContent = `${m} · 2 jugadores`; $('[data-act="play1"]').textContent = md === 'boss' ? 'Jefe · con la máquina de compañera' : `${m} · contra la máquina`; }
    if (name !== 'keys') cancelCapture();
  }
  function focusables(el) { return $$('button:not([disabled])', el).filter(b => b.offsetParent !== null); }
  function back() {
    if (hubPending && current === 'birds') { Hub.leave(); hubPick(null); }
    const prev = stack.pop();
    if (prev) show(prev, false); else show(paused ? 'pause' : 'title', false);
    Sound.play('back');
  }
  // pantalla completa automática al empezar a jugar (en el celular, también horizontal); se puede quitar en Opciones
  function goFull() { FS.autoEnter(); }
  function fsLabel() { const b = document.querySelector('[data-act="fullscreen"]'); if (b) b.textContent = FS.label(); }
  FS.onChange(fsLabel);
  function play(mode, players) {
    stack = []; paused = false; Game.G.paused = false;
    if (mode === 'copa') { Copa.create(players); return copaEvent(); }
    Copa.end();
    Game.start(mode, players); show(null, false);
  }
  /* ---------- Copa ---------- */
  function copaEvent() {
    const C = Copa.state, E = Copa.current(); if (!E) return toTitle();
    stack = []; paused = false; Game.G.paused = false;
    Game.start(E.mode, C.players, { arena: E.arena, wins: E.wins, copa: { i: C.i, n: C.list.length, tie: !!E.tie } }); show(null, false);
  }
  const ARENA_NAME = { cocora: 'Cocora', medellin: 'Medellín', bogota: 'Bogotá', cartagena: 'Cartagena', capadocia: 'Capadocia' };
  function rematch() {
    stack = []; paused = false; Game.G.paused = false;
    // al final de una Copa, «Otra Copa» arma una nueva
    // (desde la pausa, en cambio, repite la prueba que se está jugando)
    if (Game.G.copa && Copa.state) { if (current === 'results') Copa.create(Copa.state.players); return copaEvent(); }
    Game.rematch(); show(null, false);
  }
  /* ---------- Travesía ---------- */
  const ARENA_SHORT = { cocora: 'Cocora', medellin: 'Medellín', bogota: 'Bogotá', cartagena: 'Cartagena', capadocia: 'Capadocia' };
  const starStr = n => '★'.repeat(n) + `<i>${'★'.repeat(3 - n)}</i>`;
  // ¿la Travesía se juega de uno (contra la máquina) o de dos?
  let duo = !!Store.get('travDuo', false);
  const PC = i => (i === 2 ? '#9dff9a' : PLAYER_COLORS[i].main);
  const who2 = w => (w === 2 ? 'Juntos' : `J${w + 1}`);
  function fillTrav() {
    $$('#s-trav [data-tduo] button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === (duo ? '1' : '0'))));
    const open = i => (duo ? Travesia.unlocked2(i) : Travesia.unlocked(i));
    if (duo) { const t = Travesia.tally2(); $('#t-total').innerHTML = `<span style="color:${PC(2)}">juntos ${t[2]} / 30 ★</span>`; }
    else $('#t-total').innerHTML = `${Travesia.total()} / 30 ★`;
    $('#t-grid').innerHTML = STAGES.map((S, i) => {
      const o = open(i);
      let st;
      if (!o) st = 'cerrada';
      else if (duo) { const R = Travesia.res2(S.id); st = starStr(R ? R.s : 0); }
      else st = starStr(Travesia.best(S.id));
      const nm = duo ? S.duo.name : S.name, md = duo ? (S.duo.mode === 'targets' ? 'Blancos juntos' : S.duo.mode === 'boss' ? 'Jefe' : MODES[S.duo.mode].name) : MODES[S.mode].name;
      return `<button class="stage c-${S.arena}${o ? '' : ' lock'}" data-stage="${i}" ${o ? '' : 'aria-disabled="true"'}><span class="n">ETAPA ${i + 1}</span><b><span class="nn">${i + 1}. </span>${nm}</b><small>${ARENA_SHORT[S.arena]} · ${md}</small><span class="st">${st}</span></button>`;
    }).join('');
    const det = $('#t-detail'), say = i => { const S = STAGES[i], nm = duo ? S.duo.name : S.name; det.textContent = open(i) ? `${i + 1}. ${nm}: ${duo ? S.duo.text : S.text}` : `${i + 1}. ${nm}: ${duo ? 'superen' : 'gana'} la etapa anterior para abrirla.`; };
    let first = STAGES.findIndex((S, i) => open(i) && !(duo ? Travesia.res2(S.id) : Travesia.best(S.id))); if (first < 0) first = 0;
    say(first);
    $$('#t-grid .stage').forEach(btn => {
      const i = +btn.dataset.stage;
      btn.addEventListener('mouseenter', () => say(i)); btn.addEventListener('focus', () => say(i));
      btn.addEventListener('click', () => { Sound.init(); if (!open(i)) { say(i); Sound.play('back'); return; } Sound.play('select'); startStage(i, duo); });
    });
    if (!Touch.enabled) setTimeout(() => { const f = $(`#t-grid [data-stage="${first}"]`); if (f) f.focus({ preventScroll: true }); }, 40);
  }
  function startStage(i, two) {
    const S = STAGES[i]; stack = []; paused = false; Game.G.paused = false; Copa.end();
    if (two) { const D = S.duo; Game.start(D.mode, 2, { id: S.id, arena: D.arena || S.arena, duo: true, coop: D.team || null, tcfg: D, hard: !!D.hard, wins: 1 }); }
    else Game.start(S.mode, 1, { id: S.id, arena: S.arena, level: S.level, wins: S.wins });
    show(null, false);
  }
  let nextStage = -1, nextDuo = false;
  // resultados del duelo
  function results(r) {
    if (Game.G.state !== 'matchEnd') return;
    const n = r.names, s = r.stats;
    const hubEv = !!Hub.ev && !r.vsBot;
    if (hubEv) { Hub.result(r.winner === 0 || r.winner === 1 ? r.winner : -1, { score: r.mode === 'duel' ? r.wins.join(' – ') : r.score.join(' – ') }); Hub.release(); }
    $('#r-hub').hidden = !hubEv;
    if (r.tm) {
      // desafío en equipo (Travesía para dos)
      $('#r-title').textContent = r.tm.ok ? '¡Lo lograron juntos!' : 'Esta vez no se pudo';
      $('#r-title').style.color = r.tm.ok ? '#9dff9a' : '#ff8f8f';
      $('#r-score').textContent = r.tm.summary;
    } else if (r.coop) {
      // Blancos juntos (Travesía para dos)
      const tot = r.score[0] + r.score[1], ok = !!r.coopWin;
      $('#r-title').textContent = ok ? '¡Lo lograron juntos!' : 'Les faltó poquito';
      $('#r-title').style.color = ok ? '#9dff9a' : '#ff8f8f';
      $('#r-score').textContent = `Entre los dos: ${tot} puntos (J1 ${r.score[0]} + J2 ${r.score[1]})`;
    } else if (r.mode === 'boss') {
      $('#r-title').textContent = r.coopWin ? '¡Ganaron!' : 'Perdieron esta vez';
      $('#r-title').style.color = r.coopWin ? '#ffd36b' : '#ff8f8f';
      $('#r-score').textContent = `Daño al dirigible: ${r.bossDmg[0]} y ${r.bossDmg[1]}`;
    } else {
    $('#r-title').textContent = r.winner < 0 ? '¡Empate!' : r.vsBot && r.winner === 1 ? 'Gana la máquina' : `¡Gana ${n[r.winner]}!`;
    $('#r-title').style.color = r.winner < 0 ? '#ffffff' : PLAYER_COLORS[r.winner].main;
    $('#r-score').textContent = r.mode === 'duel' ? `${r.wins[0]} – ${r.wins[1]}` : r.mode === 'race' ? `Carrera · aros ${r.score[0]} – ${r.score[1]}` : `${MODES[r.mode].name}: ${r.score[0]} – ${r.score[1]}`;
    }
    // Copa: marcador acumulado, pruebas jugadas y la siguiente (o el campeón)
    const cp = Game.G.copa && Copa.state ? Copa.record(r) : null, C = Copa.state;
    let copaChips = '';
    $('#r-copa').hidden = !(cp && !cp.done);
    if (cp) {
      const who = i => (r.vsBot && i === 1 ? 'Máquina' : `J${i + 1}`);
      copaChips = C.list.map((E, k) => { const h = cp.hist[k]; return `<span class="${h ? (h.winner >= 0 ? 'c' + h.winner : '') : 'nx'}">${k + 1}. ${E.tie ? 'Desempate' : MODES[E.mode].name} · ${ARENA_NAME[E.arena]}${h ? ' — ' + (h.winner >= 0 ? who(h.winner) : 'empate') : ''}</span>`; }).join('');
      if (cp.done) {
        $('#r-title').textContent = r.vsBot && cp.champ === 1 ? 'La máquina gana la Copa' : `¡${who(cp.champ)} gana la Copa!`;
        $('#r-title').style.color = PLAYER_COLORS[cp.champ].main;
        if (!(r.vsBot && cp.champ === 1)) Game.G.events.push({ type: 'copaWon' });
      }
      $('#r-score').textContent = `Copa: ${who(0)} ${cp.pts[0]} – ${cp.pts[1]} ${who(1)}`;
    }
    const rsC = $('#r-stars'); rsC.classList.toggle('copa', !!cp); $('#s-results').classList.toggle('copa', !!cp);
    if (cp) { rsC.hidden = false; rsC.innerHTML = `<div class="chist">${copaChips}</div>`; }
    // Travesía: estrellas, récord y siguiente etapa
    const tv = r.trav && !r.duo ? Travesia.record(r.trav, r, Game.G) : null, rs = $('#r-stars');
    const t2 = r.trav && r.duo ? Travesia.record2(r.trav, r, Game.G) : null, anyT = tv || t2;
    if (!cp) rs.hidden = !anyT; $('#r-next').hidden = !(anyT && anyT.next && anyT.stars > 0); $('#r-trav').hidden = !anyT; $('#r-birds').hidden = !!anyT || !!cp;
    $('#r-rematch').textContent = anyT ? 'Repetir etapa' : cp && cp.done ? 'Otra Copa' : 'Revancha'; $('#r-rematch').hidden = !!(cp && !cp.done);
    nextStage = anyT && anyT.next ? anyT.i + 1 : -1; nextDuo = !!t2;
    if (t2) {
      const S = t2.S, D = S.duo;
      let msg = t2.stars === 0 ? (D.team ? `Juntaron ${t2.total} de ${D.team[0]}: inténtenlo otra vez` : 'Inténtenlo otra vez: juntos se puede')
        : t2.opened ? `¡Se abrió la etapa ${t2.i + 2}: ${t2.next.duo.name}!` : t2.newBest ? '¡Nuevo récord de estrellas!' : `Su mejor marca: ${'★'.repeat(t2.best)}`;
      if (t2.done) { msg = `¡Terminaron la Travesía juntos! Llevan ${t2.tally[2]} de 30 estrellas`; $('#r-title').textContent = '¡Travesía completa!'; $('#r-title').style.color = '#9dff9a'; }
      rs.innerHTML = `<span style="color:${PC(2)}">${starStr(t2.stars)}</span><small>Etapa ${t2.i + 1} · ${D.name} — ${msg}</small>`;
    }
    if (tv) {
      const msg = tv.stars === 0 ? 'Etapa sin ganar: inténtalo otra vez' : tv.i === STAGES.length - 1 ? '¡Terminaste la Travesía!' : tv.opened ? `¡Abriste la etapa ${tv.i + 2}: ${tv.next.name}!` : tv.newBest ? '¡Nuevo récord de estrellas!' : `Tu mejor: ${'★'.repeat(tv.best)}`;
      rs.innerHTML = `${starStr(tv.stars)}<small>Etapa ${tv.i + 1} · ${tv.S.name} — ${msg}</small>`;
    }
    const pct = st => st.shots ? Math.round(100 * st.hits / st.shots) + ' %' : '—';
    const rows = [['Derribos', st => st.kills], ['Daño hecho', st => Math.round(st.dmg)], ['Puntería de ráfaga', pct], ['Misiles que dieron', st => `${st.missileHits} de ${st.missiles}`], ['Misiles esquivados', st => st.dodged], ['Cajas', st => st.crates]];
    $('#r-table').innerHTML = `<span class="h"></span><span class="h n c0">J1</span><span class="h n c1">${r.vsBot ? (r.mode === 'boss' ? 'Compañera' : 'Máquina') : 'J2'}</span>` + rows.map(([lab, f]) => `<span>${lab}</span><span class="n c0">${f(s[0])}</span><span class="n c1">${f(s[1])}</span>`).join('');
    if (hubEv) ['#r-next', '#r-copa', '#r-rematch', '#r-birds', '#r-trav', '#s-results [data-act="toTitle"]'].forEach(q => { const e = $(q); if (e) e.hidden = true; });
    else { const e = $('#s-results [data-act="toTitle"]'); if (e) e.hidden = false; }
    stack = []; show('results', false);
    if (VV()) VV().after();
  }
  function pause() {
    if (current !== null || !['play', 'countdown', 'roundEnd'].includes(Game.G.state)) return;
    paused = true; Game.G.paused = true; stack = []; show('pause', false);
  }
  function resume() { paused = false; Game.G.paused = false; stack = []; show(null, false); }
  function toTitle() { if (Hub.ev) Hub.leave(); hubPick(null); Copa.end(); paused = false; Game.G.paused = false; stack = []; Game.startAttract(); show('title', false); }
  /* ---------- prueba de un torneo de la colección ---------- */
  let hubPending = null;
  function hubPick(ev) { hubPending = ev; $('#s-birds').classList.toggle('hubpick', !!ev); const d = $('#s-birds [data-act="done"]'); if (d) d.textContent = ev ? '¡A volar!' : 'Listo'; }
  function hubStart() {
    const ev = hubPending; hubPick(null); if (!ev) return;
    stack = []; paused = false; Game.G.paused = false; Copa.end();
    const C = Game.cfg, keep = [C.species.slice(), C.looks.slice()];
    if (ev.chars === 'random') { const L = Object.keys(SPECIES); for (let i = 0; i < 2; i++) { C.species[i] = L[Math.floor(Math.random() * L.length)]; C.looks[i] = VV() ? VV().V.eq(i, 'paint', C.species[i]) : 0; } }
    const map = ev.map && ARENAS[ev.map] ? ev.map : ARENA_ORDER[Math.floor(Math.random() * ARENA_ORDER.length)];
    Game.start(ev.mode, 2, { arena: map, wins: ev.rounds || 3 });
    C.species = keep[0]; C.looks = keep[1];
    show(null, false);
  }
  function hubPlay(ev) {
    stack = []; paused = false; Game.G.paused = false; Copa.end();
    if (ev.chars === 'pick') { hubPick(ev); show('birds', false); const A = ARENAS[ev.map]; $('#modeSub').textContent = `${ev.title || 'Torneo'} · ${MODES[ev.mode] ? MODES[ev.mode].name : ev.mode}${A ? ' en ' + A.name : ''}${ev.mode === 'duel' && ev.rounds ? ' · al mejor de ' + (ev.rounds * 2 - 1) + ' rondas' : ''}. Elijan pilotos y ¡a volar!`; }
    else { hubPending = ev; hubStart(); }
  }

  /* ---------- elegir pájaros ---------- */
  // blindaje, giro, velocidad, potencia de fuego (de 1 a 5)
  const STATS = { guacamaya: [3, 4, 3, 3], colibri: [1, 5, 5, 2], tucan: [4, 2, 3, 5], condor: [5, 2, 2, 4] };
  function fillBirds() {
    for (let i = 0; i < 2; i++) {
      const sp = Game.cfg.species[i], L = ArtPilot.look(sp, Game.cfg.looks[i]), tr = Game.cfg.trails[i], T = VV() && tr && tr !== 't.ninguna' ? VV().V.BY[tr] : null;
      $(`#bname${i}`).textContent = SPECIES[sp].name;
      $(`#blook${i}`).textContent = L.name + (T ? ' · ' + T.name : '');
      const st = STATS[sp];
      $(`#bstats${i}`).innerHTML = ['Blindaje', 'Giro', 'Velocidad', 'Fuego'].map((n, k) => `<div class="stat"><span>${n}</span><i style="--v:${st[k] / 5}"></i></div>`).join('');
    }
  }
  const ARENA_NAMES = { azar: 'Al azar' };
  function fillArena() { const a = Game.cfg.arena; $('#arenaName').textContent = ARENA_NAMES[a] || ARENAS[a].name; }
  function fillMode() { const m = MODES[Game.cfg.mode]; $('#modeName').textContent = m.name; $('#modeSub').textContent = m.name + ': ' + m.sub + '.'; }
  function cycleMode(d) { const k = MODE_ORDER.indexOf(Game.cfg.mode); Game.setMode(MODE_ORDER[(k + d + MODE_ORDER.length) % MODE_ORDER.length]); fillMode(); }
  function cycleArena(d) {
    const list = [...ARENA_ORDER, 'azar'], k = list.indexOf(Game.cfg.arena);
    Game.setArena(list[(k + d + list.length) % list.length]); fillArena();
    if (Game.G.state === 'attract') Game.startAttract();
  }
  // pinturas: las bloqueadas (dorada) se saltan hasta ganar su logro; dos pilotos iguales no comparten pintura
  // (las pinturas viven en el Hangar: cada piloto recuerda la suya; el botón «Pintura» pasa por las ganadas)
  const VV = () => { try { return Vestidor; } catch (e) { return null; } }; // (el Hangar se carga después del menú)
  const same = (i, sp, id) => sp === Game.cfg.species[1 - i] && String(id) === String(Game.cfg.looks[1 - i]);
  function pickLook(i, sp, step) {
    const V = VV(); if (!V) return 0;
    const L = V.paints(sp), cur = V.V.eq(i, 'paint', sp), k0 = Math.max(0, L.indexOf(cur));
    for (let s = step ? 1 : 0; s <= L.length; s++) { const id = L[(k0 + s) % L.length]; if (!same(i, sp, id)) return id; }
    return cur;
  }
  function cycle(i, d) {
    const k = SPECIES_ORDER.indexOf(Game.cfg.species[i]);
    const sp = SPECIES_ORDER[(k + d + SPECIES_ORDER.length) % SPECIES_ORDER.length];
    Game.setSpecies(i, sp, Game.cfg.looks[i]);
    const id = pickLook(i, sp, 0); if (VV()) VV().V.setEq(i, 'paint', id, sp); else Game.setSpecies(i, sp, 0);
    fillBirds();
  }
  function recolor(i) {
    const sp = Game.cfg.species[i], id = pickLook(i, sp, 1);
    if (VV()) VV().V.setEq(i, 'paint', id, sp);
    fillBirds();
  }
  function openVest(i) { const V = VV(); if (!V) return; V.open(i, () => { if (current === 'birds') fillBirds(); }); }
  function vestBadge() {
    const V = VV(), n = V ? V.V.fresh() : 0;
    $$('.vestNew').forEach(e => { e.hidden = !n; e.textContent = n === 1 ? '¡1 nueva!' : `¡${n} nuevas!`; });
  }
  function refreshBirds() { if (current === 'birds') fillBirds(); }
  function startPreview() {
    fillBirds(); fillArena(); fillMode(); stopPreview();
    const t0 = performance.now();
    const draw = () => {
      const t = (performance.now() - t0) / 1000;
      for (let i = 0; i < 2; i++) {
        const cvs = $(`#bprev${i}`); if (!cvs) continue;
        const r = cvs.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2.5);
        if (cvs.width !== Math.round(r.width * d)) { cvs.width = Math.round(r.width * d); cvs.height = Math.round(r.height * d); }
        const c = cvs.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, r.width, r.height);
        const sp = SPECIES[Game.cfg.species[i]];
        const fake = { sp, look: Game.cfg.looks[i], x: 0, y: 0, a: Math.sin(t * 1.3 + i) * 0.1, c: 1, perch: null, flapPh: t * 9, rollT: 0, stun: 0, facing: 1, boosting: Math.sin(t * 1.1 + i * 2) > 0.3, hitT: 0, shield: 0 };
        const s = Math.min(r.width / 84, r.height / 48) / sp.size;
        c.save(); c.translate(r.width / 2 + 8, r.height / 2 + Math.sin(t * 2.2 + i) * 4); c.scale(s, s);
        ArtPilot.draw(c, fake, t, PLAYER_COLORS[i]); c.restore();
      }
      previewRAF = requestAnimationFrame(draw);
    };
    previewRAF = requestAnimationFrame(draw);
  }
  function stopPreview() { if (previewRAF) cancelAnimationFrame(previewRAF); previewRAF = 0; }

  /* ---------- logros ---------- */
  function fillLogros() {
    const P = Progress.data, n = P.n, b = P.best, got = ACHIEVEMENTS.filter(a => P.got[a.id]).length;
    const st = [[`${got}/${ACHIEVEMENTS.length}`, 'logros'], [n.partidas, 'partidas'], [n.derribos, 'derribos'], [n.maniobras, 'maniobras'], [b.combo ? '×' + b.combo : '—', 'mejor cadena'], [n.leyendas, 'leyendas'], [b.jefe ? `${Math.floor(b.jefe / 60)}:${String(b.jefe % 60).padStart(2, '0')}` : '—', 'contra La Sombra']];
    $('#l-stats').innerHTML = st.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('');
    $('#l-grid').innerHTML = ACHIEVEMENTS.map(a => `<div class="ach${P.got[a.id] ? ' on' : ''}"><b>${a.name}</b><span>${a.desc}</span></div>`).join('');
  }

  /* ---------- teclas ---------- */
  let waiting = null;
  const kb = c => `<kbd>${keyName(c)}</kbd>`;
  function fillHowKeys() {
    const K = Input.keymap;
    for (let i = 0; i < 2; i++) {
      const m = K[i], el = $('#kb' + i); if (!el) continue;
      el.innerHTML = `<b>J${i + 1}</b> ${kb(m.up[0])}${kb(m.left[0])}${kb(m.down[0])}${kb(m.right[0])} apunta · ${kb(m.fire[0])} dispara · ${kb(m.boost[0])} turbo · ${kb(m.missile[0])} misil · ${kb(m.roll[0])} tonel`;
    }
  }
  function renderKeys() {
    const K = Input.keymap, g = $('#k-grid');
    let h = '<span></span><span class="kh c0">Jugador 1</span><span class="kh c1">Jugador 2</span>';
    for (const a of KEY_ACTIONS) {
      h += `<span class="kl">${KEY_LABELS[a]}</span>`;
      for (let i = 0; i < 2; i++) {
        const l = K[i][a], alt = l.slice(1, 3).map(keyName).join(', ');
        const w = waiting && waiting.i === i && waiting.a === a;
        h += `<button class="kbtn${w ? ' wait' : ''}" data-k="${i}:${a}" aria-label="${KEY_LABELS[a]}, jugador ${i + 1}: ${keyName(l[0])}">${w ? 'Pulsa una tecla…' : keyName(l[0])}${!w && alt ? ` <small>o ${alt}</small>` : ''}</button>`;
      }
    }
    g.innerHTML = h;
    if (waiting) { const b = $(`[data-k="${waiting.i}:${waiting.a}"]`, g); if (b) b.focus({ preventScroll: true }); }
  }
  function cancelCapture() { if (waiting) { waiting = null; Input.capture(null); } }
  function startCapture(i, a) {
    waiting = { i, a }; renderKeys();
    $('#k-help').innerHTML = `Pulsa la tecla nueva para <b>${KEY_LABELS[a].toLowerCase()}</b> del jugador ${i + 1}. <kbd>Esc</kbd> cancela.`;
    Input.capture(code => {
      const w = waiting; waiting = null;
      if (code !== 'Escape' && w) { Input.setKey(w.i, w.a, code); Sound.play('select'); } else Sound.play('back');
      $('#k-help').innerHTML = 'Elige una acción y pulsa la tecla nueva. <kbd>Esc</kbd> cancela.';
      renderKeys();
    });
  }

  /* ---------- opciones ---------- */
  function syncOptions() {
    const set = (opt, v) => $$(`[data-opt="${opt}"] button`).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === String(v))));
    set('sound', Sound.on ? 1 : 0); set('music', Music.on ? 1 : 0); set('quality', Game.quality); set('bot', Game.G.botLevel); set('vib', Store.get('vibrate', true) ? 1 : 0); set('autofs', FS.auto ? 1 : 0); fsLabel(); set('dtap', Input.dtap ? 1 : 0); const A = Store.get('adv', [0, 0]); set('adv0', A[0]); set('adv1', A[1]);
  }

  const ACTIONS = {
    play2: () => play(Game.cfg.mode, 2), play1: () => play(Game.cfg.mode, 1), practice: () => play('free', 1), school: () => { Store.set('schoolSeen', true); play('school', 1); }, rematch,
    skipLesson: () => { School.skip(Game.G); resume(); },
    copaNext: () => copaEvent(),
    trav: () => { if (current === 'results') toTitle(); show('trav'); }, travNext: () => { if (nextStage >= 0) startStage(nextStage, nextDuo); },
    birds: () => show('birds'), howto: () => show('howto'), options: () => show('options'), keys: () => show('keys'), logros: () => show('logros'),
    keysReset: () => { cancelCapture(); Input.resetKeys(); renderKeys(); },
    back, resume, toTitle, done: () => { if (hubPending) return hubStart(); back(); },
    // GameHub
    hubhome: () => Hub.exit(), hubback: () => Hub.exit(),
    fullscreen: () => FS.toggle(),
    'prev0': () => cycle(0, -1), 'next0': () => cycle(0, 1), 'prev1': () => cycle(1, -1), 'next1': () => cycle(1, 1),
    'look0': () => recolor(0), 'look1': () => recolor(1),
    vest: () => openVest(0), 'vest0': () => openVest(0), 'vest1': () => openVest(1),
    arenaPrev: () => cycleArena(-1), arenaNext: () => cycleArena(1), modePrev: () => cycleMode(-1), modeNext: () => cycleMode(1),
  };
  function init() {
    $$('#s-trav [data-tduo] button').forEach(b => b.addEventListener('click', () => { Sound.init(); Sound.play('select'); duo = b.dataset.v === '1'; Store.set('travDuo', duo); fillTrav(); }));
    if (Touch.enabled) document.documentElement.classList.add('touchdev');
    $$('[data-act]').forEach(b => b.addEventListener('click', () => { Sound.init(); Sound.play('select'); const a = ACTIONS[b.dataset.act]; if (a) a(); }));
    $$('[data-opt]').forEach(seg => seg.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      Sound.init(); const opt = seg.dataset.opt, v = b.dataset.v;
      if (opt === 'sound') Sound.setOn(v === '1');
      if (opt === 'music') Music.setOn(v === '1');
      if (opt === 'quality') { Game.setQuality(v); Store.set('qManual', true); }
      if (opt === 'vib') Store.set('vibrate', v === '1');
      if (opt === 'adv0' || opt === 'adv1') { const A = Store.get('adv', [0, 0]).slice(); A[opt === 'adv0' ? 0 : 1] = +v; Store.set('adv', A); Game.applyAdv(); }
      if (opt === 'autofs') FS.auto = v === '1';
      if (opt === 'dtap') Input.setDtap(v === '1');
      if (opt === 'bot') { Game.setBotLevel(+v); if (Game.G.bots[1] && Game.G.players === 1) Game.G.bots[1].level = +v; }
      syncOptions(); Sound.play('select');
    })));
    $('#k-grid').addEventListener('click', e => {
      const b = e.target.closest('[data-k]'); if (!b) return;
      Sound.init(); const [i, a] = b.dataset.k.split(':');
      if (waiting && waiting.i === +i && waiting.a === a) { cancelCapture(); renderKeys(); return; }
      startCapture(+i, a);
    });
    Input.onPress(code => {
      if (current === null) { if (code === 'Escape' || code === 'KeyP' || /Pad\d_start/.test(code)) pause(); return; }
      const el = $('#' + SCREENS[current]); if (!el) return;
      const f = focusables(el), i = f.indexOf(document.activeElement);
      if (/ArrowDown|ArrowRight|Tab|Pad\d_(down|right)/.test(code)) { (f[(i + 1) % f.length] || f[0]).focus(); }
      else if (/ArrowUp|ArrowLeft|Pad\d_(up|left)/.test(code)) { (f[(i - 1 + f.length) % f.length] || f[0]).focus(); }
      else if (/Enter|Space|Pad\d_confirm/.test(code)) { if (document.activeElement && f.includes(document.activeElement)) document.activeElement.click(); else if (f[0]) f[0].click(); }
      else if (/Escape|Backspace|Pad\d_back/.test(code)) { if (current === 'pause') resume(); else if (current === 'results') toTitle(); else if (current !== 'title') back(); }
    });
    addEventListener('pointerdown', () => Sound.init(), { passive: true });
    addEventListener('keydown', () => Sound.init(), { passive: true });
    addEventListener('blur', () => { if (current === null) pause(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && current === null) pause(); });
    $('#ver').textContent = 'versión ' + GAME_META.version + ' · logros y récords';
    Game.onMatchEnd = r => setTimeout(() => results(r), 900);
    Game.onSchoolEnd = () => { if (Game.G.mode === 'school' && current === null) toTitle(); };
    Game.begin();
    show('title', false);
    // en celular: si lo giras a vertical o sales de la app en plena partida, se pausa sola
    if (Touch.enabled) {
      try { matchMedia('(orientation: portrait)').addEventListener('change', e => { if (e.matches) pause(); }); } catch (e) {}
      document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
    }
  }
  return { init, show, pause, resume, results, hubPlay, vestBadge, refreshBirds, get current() { return current; } };
})();

// para las pruebas automáticas
window.VTO = { Game, World, Touch, Input, PHYS, SPECIES, UI, FX, Bot, Bird, Combat, School, Music, Boss, Modes, Progress, Weather, Coast, Travesia, STAGES, Copa };
UI.init();
Hub.onPlay(ev => UI.hubPlay(ev));
Hub.ready();
