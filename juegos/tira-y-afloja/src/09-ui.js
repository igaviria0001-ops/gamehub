/* =========================================================================
   MENÚS — pantallas en HTML sobre el juego, navegables con teclado y mando
   ========================================================================= */
const UI = (() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const SCREENS = { campana: 's-campana', jefes: 's-jefes', retos: 's-retos', entreno: 's-entreno', levels: 's-levels', title: 's-title', modes: 's-modes', arena: 's-arena', pick: 's-pick', howto: 's-howto', options: 's-options', pause: 's-pause', results: 's-results', records: 's-records', daily: 's-daily' };
  let achTab = 0;
  let current = 'title', stack = [], vsBot = false, paused = false, lastRes = null, pendingMode = 'caneca', pickTimer = null;

  const NAV = {
    prev: ['ArrowUp', 'ArrowLeft', 'KeyW', 'KeyA', 'KeyI', 'KeyJ', 'Pad0_up', 'Pad1_up', 'Pad0_left', 'Pad1_left'],
    next: ['ArrowDown', 'ArrowRight', 'KeyS', 'KeyD', 'KeyK', 'KeyL', 'Pad0_down', 'Pad1_down', 'Pad0_right', 'Pad1_right'],
    ok: ['Space', 'KeyE', 'KeyO', 'NumpadEnter', 'Pad0_confirm', 'Pad1_confirm'],
    back: ['Escape', 'Backspace', 'Pad0_back', 'Pad1_back'],
    pause: ['Escape', 'KeyP', 'Pad0_start', 'Pad1_start'],
  };

  function screenEl(name) { return name ? $('#' + SCREENS[name]) : null; }
  function focusables(el) { return el ? $$('button:not([disabled])', el).filter(b => b.offsetParent !== null) : []; }

  function vestBadge() { const b = $('#vestNew'); if (!b || typeof Vestidor === 'undefined') return; const n = Vestidor.V.fresh(); b.textContent = n ? n + (n === 1 ? ' nuevo' : ' nuevos') : Vestidor.V.count().join('/'); b.classList.toggle('hot', n > 0); }
  function show(name, push = true) {
    if (name === 'results' && typeof Vestidor !== 'undefined') Vestidor.after();
    if (name === 'title') setTimeout(vestBadge, 0);
    if (push && current && current !== name) stack.push(current);
    $$('.screen').forEach(s => { s.hidden = true; });
    current = name;
    if (name) Touch.hide(); else { goFull(); Touch.show(vsBot ? 'single' : 'dual'); const tt = $('#toast'); if (tt) tt.hidden = true; }
    const el = screenEl(name);
    if (el) {
      el.hidden = false;
      const f = focusables(el);
      const pref = el.querySelector('.btn.fresa, .mode, .arena') || f[0];
      if (pref) setTimeout(() => pref.focus({ preventScroll: true }), 30);
    } else {
      const cv = $('#cv'); if (cv) cv.focus({ preventScroll: true });
    }
  }
  // pantalla completa automática al empezar a jugar (en el celular, también horizontal); se puede quitar en Opciones
  function goFull() { FS.autoEnter(); }
  function goBack() {
    const prev = stack.pop();
    if (prev) show(prev, false);
    else if (paused) show('pause', false);
    else show('title', false);
    Sound.play('back');
  }

  function startGame(mode, arena) {
    stack = []; paused = false;
    show(null, false);
    Game.G.daily = null; Fiesta.force(null);
    if (!keepCamp) { Game.G.campBoss = null; }
    keepCamp = false;
    Game.startMatch(mode, vsBot, arena, mode === 'jefe' ? false : Fiesta.on);
  }
  function chooseMode(mode) {
    pendingMode = mode;
    $('#btn-torneo').hidden = mode !== 'caneca';
    fillArenaGrid();
    syncFiesta();
    show('arena');
  }

  /* tarjetas de arenas con miniatura */
  function arenaCard(def, onPick) {
    const b = document.createElement('button');
    b.className = 'arena'; b.dataset.arena = def.id;
    const c = document.createElement('canvas'); c.width = 384; c.height = 216;
    const h = document.createElement('h3'); h.textContent = def.name;
    const p = document.createElement('p'); p.textContent = def.desc;
    b.append(c, h, p);
    b.addEventListener('click', () => { Sound.init(); Sound.play('select'); onPick(def.id); });
    b.addEventListener('pointerenter', () => { if (document.activeElement !== b) { b.focus({ preventScroll: true }); Sound.play('hover'); } });
    // la miniatura se pinta un poco después para no congelar el menú
    setTimeout(() => { const t = ArenaArt.thumb(def.id, 384, 216); if (t) c.getContext('2d').drawImage(t, 0, 0); }, 30);
    return b;
  }
  function fillArenaGrid() {
    const grid = $('#arena-grid');
    if (grid.childElementCount) return;
    ARENA_LIST.forEach((def, i) => setTimeout(() => grid.append(arenaCard(def, id => startGame(pendingMode, id))), i * 15));
  }
  function showPick(loser, ids, isBot) {
    const grid = $('#pick-grid'); grid.innerHTML = '';
    const P = Game.G.players;
    const name = loser === null ? 'La suerte' : P[loser].name;
    const t = $('#pick-title');
    t.textContent = loser === null ? 'Empate: la arena sale al azar' : `${name} elige la siguiente arena`;
    t.style.color = loser === null ? 'var(--cream)' : P[loser].col.base;
    const done = id => { clearTimeout(pickTimer); stack = []; show(null, false); Game.chooseArena(id); };
    ids.forEach(id => grid.append(arenaCard(ARENA_DEFS[id], done)));
    stack = [];
    show('pick', false);
    clearTimeout(pickTimer);
    if (isBot || loser === null) {
      const choice = pick(ids);
      pickTimer = setTimeout(() => { const el = grid.querySelector(`[data-arena="${choice}"]`); if (el) el.classList.add('picked'); Sound.play('select'); }, 900);
      pickTimer = setTimeout(() => done(choice), 1700);
    }
  }
  function toMenu() {
    paused = false; stack = [];
    if (Hub.ev) { Hub.leave(); hubRestore(); }
    Game.G.daily = null; Fiesta.force(null);
    Game.startAttract();
    show('title', false);
  }
  function pause() {
    const G = Game.G;
    if (current || G.quiet || G.state === 'matchEnd') return;
    paused = true; stack = [];
    $('#btn-retos-list').hidden = !G.reto && !G.train;
    $('#btn-retos-list').textContent = G.train ? 'Elegir otro ejercicio' : 'Elegir otro reto';
    $('#btn-restart').textContent = G.reto ? 'Repetir reto' : G.train ? 'Empezar de cero' : 'Reiniciar partida';
    Sound.play('pause'); Sound.silenceLoops(); Sound.Music.setMode('pause');
    show('pause', false);
  }
  function resume() {
    paused = false; stack = [];
    show(null, false);
    Sound.Music.setMode('game');
  }

  const ACTIONS = {
    play2() { vsBot = false; $('#modes-title').textContent = 'Elige el modo · 2 jugadores'; show('modes'); },
    playbot() { vsBot = true; $('#modes-title').textContent = 'Elige el modo · contra la máquina'; show('modes'); },
    howto() { show('howto'); },
    options() { syncOptions(); $('#s-options').classList.toggle('inmatch', paused); show('options'); },
    back() { goBack(); },
    'mode-caneca'() { chooseMode('caneca'); },
    'mode-chicles'() { chooseMode('chicles'); },
    'mode-rey'() { chooseMode('rey'); },
    'mode-gol'() { startGame('gol', 'gimnasio'); }, // la cancha es fija
    'mode-escalada'() { startGame('escalada', 'torre'); }, // la torre es fija
    records() { fillRecords(); show('records'); },
    'mode-fuga'() { fillLevels(); show('levels'); },
    'mode-jefe'() { fillJefes(); show('jefes'); },
    'mode-campana'() { fillCampaign(); show('campana'); },
    nextlevel() {
      if (Game.G.mode === 'campana' || (Game.G.mode === 'jefe' && Game.G.campBoss != null)) { const st = Campaign.stages(), i = st.findIndex(s => s.id === Game.G.campStage); if (st[i + 1] && Campaign.unlocked(st[i + 1].id)) playStage(st[i + 1]); return; }
      if (Game.G.mode === 'jefe') { const L = Jefes.LIST, i = L.findIndex(d => d.id === Game.G.jefeId); if (L[i + 1]) { Game.G.jefeId = L[i + 1].id; startGame('jefe', L[i + 1].arena); } return; }
      const n = (Game.G.fugaLevel || 1) + 1; if (n <= Modes.FUGA_LEVELS) { Game.G.fugaLevel = n; startGame('fuga', 'torre'); } },
    daily() { fillDaily(); show('daily'); },
    'daily-go'() {
      const d = Progress.dailySpec();
      vsBot = true; stack = []; paused = false; show(null, false);
      Game.G.daily = { level: d.level, key: d.key }; Fiesta.force(d.mod);
      Game.startMatch(d.mode, true, d.arena, !!d.mod);
    },
    'arena-random'() { startGame(pendingMode, 'random'); },
    'arena-torneo'() { startGame(pendingMode, 'torneo'); },
    fiesta() { Fiesta.setOn(!Fiesta.on); syncFiesta(); if (Fiesta.on) Sound.play('party'); },
    resume() { resume(); },
    restart() { paused = false; stack = []; show(null, false); if (Game.G.tutorial) Tutorial.start(Game.G.tutorial.solo); else if (Game.G.reto) Retos.start(Game.G.reto.idx); else if (Game.G.train) Entreno.start(Game.G.train.idx, 1); else Game.restart(); },
    'tut-pair'() { vsBot = false; stack = []; paused = false; show(null, false); Tutorial.start(false); },
    'tut-solo'() { vsBot = true; stack = []; paused = false; show(null, false); Tutorial.start(true); },
    retos() { fillRetos(); show('retos'); },
    'retos-list'() { if (Game.G.train) { backToEntreno(Game.G.train.idx); return; } const i = Game.G.reto ? Game.G.reto.idx : 0; backToRetos(i); },
    entreno() { fillEntreno(); show('entreno'); },
    menu() { toMenu(); },
    // GameHub: volver a la colección / seguir con el torneo
    hubhome() { Hub.exit(); },
    hubback() { Hub.exit(); },
    rematch() { stack = []; show(null, false); Game.restart(); },
    changemode() { if (Game.G.mode === 'campana' || Game.G.campBoss != null) { stack = ['title', 'modes']; fillCampaign(); show('campana', false); return; } vsBot = lastRes ? lastRes.vsBot : vsBot; Game.G.daily = null; Fiesta.force(null); stack = []; show('modes', false); stack = ['title']; },
    fullscreen() { FS.toggle(); },
    vest() { if (typeof Vestidor !== 'undefined') Vestidor.open(0, () => { syncOptions(); vestBadge(); }); },
  };

  function syncFiesta() {
    const b = $('#btn-fiesta'); if (!b) return;
    b.setAttribute('aria-pressed', String(Fiesta.on));
    b.lastElementChild.textContent = Fiesta.on ? '¡Fiesta encendida!' : 'Modo Fiesta';
  }
  function fsLabel() { const b = document.querySelector('[data-act="fullscreen"]'); if (b) b.textContent = FS.label(); }
  FS.onChange(fsLabel);
  function syncOptions() {
    const set = (opt, v) => $$(`[data-opt="${opt}"] button`).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === String(v))));
    set('music', Sound.musicOn ? 1 : 0); set('sfx', Sound.sfxOn ? 1 : 0);
    set('wins', Game.G.winsNeeded); set('bot', Game.G.botLevel); set('theme', Game.G.theme);
    set('hc0', Game.G.handicap[0]); set('hc1', Game.G.handicap[1]); set('vib', Game.G.vibrate ? 1 : 0); set('tbig', Touch.big ? 1 : 0); set('autofs', FS.auto ? 1 : 0); fsLabel();
    set('marks', Player.marks ? 1 : 0); set('autostick', Game.G.autoStick ? 1 : 0); set('shake', FX.settings.shake); set('quality', Store.get('quality', 'alta'));
    const st = Game.G.musicStyle;
    $('#o-style .val').textContent = st === 'arena' ? 'Según la arena' : st === 'random' ? 'Al azar' : Sound.Music.name(st);
    [0, 1].forEach(i => {
      const b = $('#o-f' + (i + 1)), f = FLAVORS[Game.G.flavors[i]];
      b.querySelector('.val').textContent = f.name; b.querySelector('.dot').style.background = f.base;
    });
    $('#tag-caneca').textContent = `PRIMERO A ${Game.G.winsNeeded} RONDAS`;
    $('#tag-escalada').textContent = `PRIMERO A ${Game.G.winsNeeded} RONDAS`;
  }

  function fillRecords() {
    const names = Progress.names;
    ['n1', 'n2'].forEach((id, i) => { const el = $('#' + id); if (document.activeElement !== el) el.value = names[i]; });
    [0, 1].forEach(i => {
      const st = Progress.stats(names[i]);
      $('#ps' + (i + 1)).textContent = `${Progress.count(names[i])}/${Progress.ACH.length} logros · ${st.matches} partidas · ${st.wins} ganadas`;
      const a = Progress.ACCESSORIES.find(x => x.id === Progress.accOf(i));
      $(`[data-acc="${i}"] .val`).textContent = a.name;
    });
    const r = Progress.record();
    $('#h2h').textContent = `${r[0]} – ${r[1]}`;
    $$('#ach-tabs button').forEach(b => { const i = +b.dataset.t; b.setAttribute('aria-pressed', String(i === achTab)); b.textContent = `Logros de ${names[i]}`; });
    const name = names[achTab], have = Progress.count(name);
    const next = Progress.ACCESSORIES.find(a => !a.camp && a.need > have);
    $('#accnext').textContent = next ? `${name} lleva ${have} logros. Con ${next.need} se desbloquea: ${next.name}.` : `${name} desbloqueó todos los accesorios.`;
    $('#achs').innerHTML = Progress.ACH.map((a, k) => {
      const on = Progress.has(name, a.id);
      return `<div class="ach${on ? ' on' : ''}"><div class="ic">${on ? '★' : k + 1}</div><div><b>${a.name}</b><span>${a.desc}</span></div></div>`;
    }).join('');
  }
  function fillLevels() {
    const box = $('#levels'); box.innerHTML = '';
    for (let n = 1; n <= Modes.FUGA_LEVELS; n++) {
      const b = document.createElement('button');
      b.className = 'lvl';
      const st = Modes.fugaData.stars[n] || 0, best = Modes.fugaData.best[n];
      const open = Modes.fugaUnlocked(n);
      b.disabled = !open;
      b.innerHTML = `<b>${n}</b><span>${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span><small>${open ? (best ? best + ' s' : 'meta ' + Modes.fugaPar(n) + ' s') : 'bloqueado'}</small>`;
      b.addEventListener('click', () => { Sound.init(); Sound.play('select'); Game.G.fugaLevel = n; startGame('fuga', 'torre'); });
      b.addEventListener('pointerenter', () => { if (!b.disabled && document.activeElement !== b) b.focus({ preventScroll: true }); });
      box.append(b);
    }
    const done = Object.keys(Modes.fugaData.stars).length, stars = Object.values(Modes.fugaData.stars).reduce((a, b) => a + b, 0);
    $('#levels-note').textContent = `Los dos tienen que llegar arriba; si uno cae al agua, se repite. ${done}/12 niveles · ${stars}/36 estrellas.`;
  }
  let keepCamp = false;
  function playStage(s) {
    Game.G.campStage = s.id;
    if (s.type === 'boss') { Game.G.jefeId = s.jefe; Game.G.campBoss = s.zone; keepCamp = true; startGame('jefe', (Jefes.BY[s.jefe] || Jefes.LIST[0]).arena); }
    else { Game.G.campBoss = null; startGame('campana', 'campana'); }
  }
  function fillCampaign() {
    const box = $('#camp-rows'); box.innerHTML = '';
    const st = Campaign.stages(), d = Campaign.data;
    let focusEl = null;
    Campaign.ZONES.forEach((Z, zi) => {
      const zs = st.filter(s => s.zone === zi);
      if (!zs.length) return;
      const row = document.createElement('div'); row.className = 'zrow';
      const zStars = zs.reduce((a, s) => a + (d.stars[s.id] || 0), 0);
      const nm = document.createElement('div'); nm.className = 'zname';
      nm.innerHTML = `<b>${zi + 1}. ${Z.name}</b><small>★ ${zStars}/${zs.length * 3} · premio: ${d.rewards[Z.id] ? '✓ ' : ''}${Z.reward.name}</small>`;
      row.append(nm);
      zs.forEach(s => {
        const b = document.createElement('button');
        const open = Campaign.unlocked(s.id), stars = d.stars[s.id] || 0;
        b.className = 'stg' + (s.type === 'boss' ? ' boss' : '');
        b.disabled = !open;
        const best = d.best[s.id];
        if (s.type === 'boss') { const J = Jefes.BY[s.jefe]; b.innerHTML = `<b>JEFE</b><span>${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span><small>${J ? J.name.replace(/^(La|El) /, '') : s.jefe}</small>`; }
        else b.innerHTML = `<b>${s.id}</b><span>${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span><small>${open ? (best ? best.toFixed(1).replace('.', ',') + ' s' : s.room.name) : '🔒'}</small>`;
        b.setAttribute('aria-label', s.type === 'boss' ? `Jefe de la zona ${zi + 1}` : `Sala ${s.id}: ${s.room.name}`);
        b.addEventListener('click', () => { Sound.init(); Sound.play('select'); playStage(s); });
        b.addEventListener('pointerenter', () => { if (!b.disabled && document.activeElement !== b) { b.focus({ preventScroll: true }); Sound.play('hover'); } });
        if (open && !stars && !focusEl) focusEl = b;
        row.append(b);
      });
      box.append(row);
    });
    $('#camp-stars').textContent = `★ ${Campaign.totalStars()} / ${st.length * 3}`;
    if (focusEl) setTimeout(() => focusEl.focus({ preventScroll: false }), 60);
  }
  function fillJefes() {
    const box = $('#jefes'); box.innerHTML = '';
    Jefes.LIST.forEach((def, i) => {
      const b = document.createElement('button');
      b.className = 'mode coop';
      const open = true, best = Jefes.data.best[def.id], wins = Jefes.data.wins[def.id] || 0; // todos abiertos: así nadie se queda atascado en uno
      b.innerHTML = `<canvas class="art art-jefe" data-art="jefe-${def.id}" width="420" height="160"></canvas><h3>${i + 1}. ${def.name}</h3><p>${def.desc}</p><p class="rec">${!open ? 'Derroten al jefe anterior para pelear con este.' : best !== undefined ? `Récord: ${String(best).replace('.', ',')} s · derrotado ${wins} ${wins === 1 ? 'vez' : 'veces'}` : 'Sin derrotar todavía'}</p>`;
      b.addEventListener('click', () => { Sound.init(); Sound.play('select'); Game.G.jefeId = def.id; startGame('jefe', def.arena); });
      b.addEventListener('pointerenter', () => { if (!b.disabled && document.activeElement !== b) { b.focus({ preventScroll: true }); Sound.play('hover'); } });
      box.append(b);
    });
    drawModeArt();
  }
  function fillRetos(focusIdx = -1) {
    const box = $('#retos'); box.innerHTML = '';
    const d = Retos.data;
    Retos.LIST.forEach((def, i) => {
      const b = document.createElement('button');
      b.className = 'reto';
      const m = d.medal[def.id] || 0, best = d.best[def.id];
      const mname = ['', 'bronce', 'plata', 'oro'][m];
      b.innerHTML = `<span class="md m${m}">${i + 1}</span><b>${def.title}</b><small>${best !== undefined ? `${String(best.toFixed(1)).replace('.', ',')} s · ${mname}` : `${def.skill} · oro en ${String(def.gold).replace('.', ',')} s`}</small>`;
      b.setAttribute('aria-label', `Reto ${i + 1}: ${def.title}. ${m ? 'Medalla de ' + mname : 'Sin medalla'}`);
      b.addEventListener('click', () => { Sound.init(); Sound.play('select'); startReto(i); });
      b.addEventListener('pointerenter', () => { if (document.activeElement !== b) { b.focus({ preventScroll: true }); Sound.play('hover'); } });
      box.append(b);
    });
    const golds = Retos.LIST.filter(x => d.medal[x.id] === 3).length, done = Retos.LIST.filter(x => d.medal[x.id]).length;
    $('#retos-note').textContent = `Cada reto enseña una jugada. Medalla según el tiempo: oro, plata o bronce. ${done}/${Retos.count} superados · ${golds} de oro.`;
    if (focusIdx >= 0) setTimeout(() => { const el = box.children[Math.min(focusIdx, box.children.length - 1)]; if (el) el.focus({ preventScroll: true }); }, 60);
  }
  function fillEntreno(focusIdx = -1) {
    const box = $('#entreno'); box.innerHTML = '';
    const d = Entreno.data;
    const LV = ['', 'nivel 1', 'nivel 2', 'nivel 3'];
    Entreno.LIST.forEach((def, i) => {
      const b = document.createElement('button');
      b.className = 'reto';
      const top = d.top[def.id] || 0, best = d.best[def.id] || 0, tm = d.time[def.id];
      const sub = def.timed && tm !== undefined ? `récord ${String(tm.toFixed(1)).replace('.', ',')} s · ${LV[top]}` : top ? `${LV[top]} · racha ${best}` : def.skill;
      b.innerHTML = `<span class="md lv${top}">${i + 1}</span><b>${def.title}</b><small>${sub}</small>`;
      b.setAttribute('aria-label', `Ejercicio ${i + 1}: ${def.title}. ${top ? 'Llegaste al ' + LV[top] : 'Sin hacer'}`);
      b.addEventListener('click', () => { Sound.init(); Sound.play('select'); startEntreno(i); });
      b.addEventListener('pointerenter', () => { if (document.activeElement !== b) { b.focus({ preventScroll: true }); Sound.play('hover'); } });
      box.append(b);
    });
    const n3 = Entreno.LIST.filter(x => (d.top[x.id] || 0) >= 3).length;
    $('#entreno-note').textContent = `Situaciones difíciles que se repiten sin parar. Sube de nivel con 3 aciertos seguidos. ${n3}/${Entreno.count} en nivel 3.`;
    if (focusIdx >= 0) setTimeout(() => { const el = box.children[Math.min(focusIdx, box.children.length - 1)]; if (el) el.focus({ preventScroll: true }); }, 60);
  }
  function startEntreno(i) {
    vsBot = true; stack = []; paused = false;
    show(null, false);
    Game.G.daily = null; Fiesta.force(null);
    Entreno.start(i);
  }
  function backToEntreno(i) {
    paused = false;
    Game.G.daily = null; Fiesta.force(null);
    Game.startAttract();
    fillEntreno(i);
    stack = ['title'];
    show('entreno', false);
  }
  function startReto(i) {
    vsBot = true; stack = []; paused = false;
    show(null, false);
    Game.G.daily = null; Fiesta.force(null);
    Retos.start(i);
  }
  function backToRetos(i) {
    paused = false;
    Game.G.daily = null; Fiesta.force(null);
    Game.startAttract();
    fillRetos(i);
    stack = ['title'];
    show('retos', false);
  }
  function fillDaily() {
    const d = Progress.dailySpec(), st = Progress.dailyState();
    $('#d-date').textContent = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
    $('#d-title').textContent = d.title;
    $('#d-desc').textContent = d.desc;
    $('#d-state').textContent = st.done ? `¡Ya lo superaste hoy! Racha: ${st.streak} ${st.streak === 1 ? 'día' : 'días'}. Puedes volver a jugarlo.` : st.streak ? `Racha actual: ${st.streak} ${st.streak === 1 ? 'día' : 'días'}. ¡No la pierdas!` : 'Juegas tú (jugador 1) contra la máquina. Mañana hay otro.';
  }

  function showResults(res) {
    lastRes = res;
    const fuga = res.mode === 'fuga', jefe = res.mode === 'jefe', jr = jefe ? (Jefes.result || {}) : null;
    const camp = res.mode === 'campana', cr = camp ? (Campaign.result || {}) : null, campBoss = jefe && Game.G.campBoss != null;
    let bossCamp = null;
    if (campBoss && jr && !jr.campDone) { jr.campDone = true; jr.camp = Campaign.bossResult(Game.G.campBoss, jr.win, jr.hearts); }
    if (campBoss && jr) bossCamp = jr.camp;
    const jIdx = jefe ? Jefes.LIST.findIndex(d => d.id === Game.G.jefeId) : -1;
    const stNext = (camp || campBoss) ? (() => { const st = Campaign.stages(), i = st.findIndex(s => s.id === Game.G.campStage); return st[i + 1] && Campaign.unlocked(st[i + 1].id) ? st[i + 1] : null; })() : null;
    $('#btn-next').hidden = camp || campBoss ? !stNext : fuga ? !((Game.G.fugaLevel || 1) < Modes.FUGA_LEVELS) : jefe ? !(jr.win && Jefes.LIST[jIdx + 1]) : true;
    $('#btn-next').textContent = stNext ? (stNext.type === 'boss' ? '¡Al jefe!' : `Sala ${stNext.id}`) : jefe ? 'Siguiente jefe' : 'Siguiente nivel';
    $('#s-results [data-act="changemode"]').textContent = camp || campBoss ? 'Mapa' : 'Cambiar modo';
    $('#btn-rematch').textContent = fuga ? 'Repetir nivel' : jefe ? (jr.win ? 'Pelear otra vez' : 'Reintentar') : 'Revancha';
    $('.card.results .stats').hidden = fuga || jefe || camp;
    if (camp) $('#btn-rematch').textContent = 'Repetir sala';
    const na = Progress.newAch, parts = [];
    [0, 1].forEach(i => { if (na[i].length) parts.push(`${Progress.names[i]}: ${na[i].join(', ')}`); });
    const ra = $('#r-ach'); ra.hidden = !parts.length; ra.textContent = parts.length ? `Logros nuevos · ${parts.join(' · ')}` : '';
    if (bossCamp && bossCamp.reward) { ra.hidden = false; ra.textContent = (ra.textContent && !ra.hidden ? ra.textContent + ' · ' : '') + `¡Premio desbloqueado: ${bossCamp.reward.name}! Pónganselo en Opciones.`; }
    if (Game.G.daily && res.winner === 0) { ra.hidden = false; ra.textContent = (parts.length ? ra.textContent + ' · ' : '') + '¡Reto del día superado!'; }
    Platform.emit('matchEnd', { mode: res.mode, winner: res.winner, wins: res.wins, points: res.points, vsBot: res.vsBot });
    // prueba de un torneo de la colección: se reporta el ganador y solo queda «Continuar torneo»
    const hubEv = !!Hub.ev && !res.vsBot;
    if (hubEv) { Hub.result(res.winner === 0 || res.winner === 1 ? res.winner : -1, { score: (res.mode === 'caneca' || res.mode === 'escalada' ? res.wins : res.points || res.wins).join(' – ') }); hubRestore(); Hub.release(); }
    $('#btn-hub').hidden = !hubEv;
    if (hubEv) { $('#btn-next').hidden = true; $('#btn-rematch').hidden = true; $('#s-results [data-act="changemode"]').hidden = true; $('#s-results [data-act="menu"]').hidden = true; }
    else { $('#btn-rematch').hidden = false; $('#s-results [data-act="changemode"]').hidden = false; $('#s-results [data-act="menu"]').hidden = false; }
    const P = Game.G.players;
    const t = $('#r-title');
    if (camp) {
      t.textContent = `¡Sala ${cr.id || ''} superada!`; t.style.color = 'var(--menta-deep)';
    } else if (jefe) {
      const def = Jefes.BY[jr.id] || Jefes.LIST[0];
      t.textContent = jr.win ? `¡Derrotaron ${def.name.replace(/^(La|El) /, m => m === 'La ' ? 'a la ' : 'al ')}!` : `¡Ganó ${def.name.toLowerCase().replace(/^./, c => c)}!`;
      t.style.color = jr.win ? 'var(--menta-deep)' : 'var(--fresa)';
    } else if (fuga) {
      const r = Modes.fugaResult || {};
      t.textContent = `¡Nivel ${r.level || ''} superado!`; t.style.color = 'var(--menta-deep)';
    } else if (res.winner === null) { t.textContent = '¡Empate!'; t.style.color = 'var(--sol)'; }
    else { t.textContent = `¡${res.names[res.winner]} gana!`; t.style.color = P[res.winner].col.base; }
    const pts = res.points.map(Math.floor);
    $('#r-score').textContent = camp ? `${'★'.repeat(cr.stars || 0)}${'☆'.repeat(3 - (cr.stars || 0))}  ·  ${(cr.t || 0).toFixed(1).replace('.', ',')} s (meta ${cr.par} s)  ·  envolturas ${cr.wrTotal || 0}/3${cr.newBest ? ' · ¡récord!' : ''}`
      : jefe ? (jr.win ? `${(jr.t || 0).toFixed(1).replace('.', ',')} s · ${'♥'.repeat(jr.hearts || 0)}${'♡'.repeat(3 - (jr.hearts || 0))}${jr.newBest ? ' · ¡récord!' : ''}` : `Le hicieron ${jr.hits || 0} ${jr.hits === 1 ? 'golpe' : 'golpes'}. ¡Otra vez!`)
      : fuga ? (r => `${'★'.repeat(r.stars || 0)}${'☆'.repeat(3 - (r.stars || 0))}  ·  ${(r.time || 0).toFixed(1).replace('.', ',')} s (meta ${r.par} s)${r.newBest ? ' · ¡récord!' : ''}`)(Modes.fugaResult || {})
      : res.mode === 'caneca' || res.mode === 'escalada' ? `${res.wins[0]} – ${res.wins[1]} en rondas`
      : res.mode === 'rey' ? `${pts[0]} – ${pts[1]} en puntos de rey`
        : res.mode === 'gol' ? `${pts[0]} – ${pts[1]} en goles`
          : `${pts[0]} – ${pts[1]} en chicles`;
    $('#r-p2').textContent = res.vsBot ? `${res.names[1]} (máquina)` : res.names[1];
    if ($('#r-p1')) $('#r-p1').textContent = res.names[0];
    $('#r-p1').style.color = P[0].col.deep; $('#r-p2').style.color = P[1].col.deep;
    const rows = [
      ['Embestidas', 'rams'], ['Tirachinas', 'slings'], ['Latigazos', 'whips'],
      [res.mode === 'chicles' ? 'Chicles recogidos' : 'Chicles dorados', 'pellets'], ['Rivales a la caneca', 'dunks'],
    ];
    if (res.mode === 'rey') rows.unshift(['Segundos de rey', 'crown']);
    if (res.mode === 'gol') rows.unshift(['Goles', 'goals']);
    if (res.mode === 'escalada') rows.unshift(['Campanazos', 'bells']);
    $('#r-body').innerHTML = rows.map(([label, k]) => {
      const a = Math.floor(res.stats[0][k] || 0), b = Math.floor(res.stats[1][k] || 0);
      const bold = (x, y) => (x > y ? `<strong>${x}</strong>` : String(x));
      return `<tr><td>${label}</td><td>${bold(a, b)}</td><td>${bold(b, a)}</td></tr>`;
    }).join('');
    stack = [];
    show('results', false);
    void P;
  }

  let toastT = null;
  function toast(msg, ms = 4200) {
    const el = $('#toast'); el.textContent = msg; el.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, ms);
  }

  function onKey(code) {
    Sound.init();
    const ae = document.activeElement;
    if (ae && ae.tagName === 'INPUT') { if (code === 'Escape' || code === 'Enter' || code === 'NumpadEnter') ae.blur(); return; }
    if (!current) { if (NAV.pause.includes(code)) pause(); return; }
    const el = screenEl(current);
    const f = focusables(el);
    const active = document.activeElement;
    let idx = f.indexOf(active);
    if (current === 'pick' && (NAV.back.includes(code))) return;
    if (NAV.back.includes(code)) {
      if (current === 'pause') resume();
      else if (current !== 'title' && current !== 'results') goBack();
      return;
    }
    if (NAV.prev.includes(code) || NAV.next.includes(code)) {
      if (!f.length) return;
      if (idx < 0) idx = 0; else idx = (idx + (NAV.next.includes(code) ? 1 : -1) + f.length) % f.length;
      f[idx].focus({ preventScroll: true }); Sound.play('hover');
      return;
    }
    if (NAV.ok.includes(code) || code === 'Enter') {
      if (code === 'Enter' && idx >= 0) return; // el navegador ya lo hace
      (idx >= 0 ? f[idx] : f[0])?.click();
    }
  }

  /* ilustraciones de los modos */
  function drawModeArt() {
    $$('canvas[data-art]').forEach(c => {
      const ctx = c.getContext('2d'), W = c.width, H = c.height;
      ctx.clearRect(0, 0, W, H);
      const blob = (x, y, r, col, look) => {
        const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.3);
        g.addColorStop(0, col.light); g.addColorStop(0.5, col.base); g.addColorStop(1, col.dark);
        ctx.beginPath(); ctx.ellipse(x, y, r * 1.05, r * 0.95, 0, 0, TAU); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = col.deep; ctx.stroke();
        for (const s of [-1, 1]) {
          ctx.fillStyle = '#fff'; ctx.strokeStyle = '#2b1610'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(x + s * r * 0.34, y - r * 0.1, r * 0.2, r * 0.25, 0, 0, TAU); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#2b1610'; ctx.beginPath(); ctx.arc(x + s * r * 0.34 + look * r * 0.07, y - r * 0.08, r * 0.11, 0, TAU); ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(x - r * 0.45, y - r * 0.5, r * 0.22, r * 0.12, -0.6, 0, TAU); ctx.fill();
      };
      const rope = (x1, y1, x2, y2, sag) => {
        const g = ctx.createLinearGradient(x1, 0, x2, 0); g.addColorStop(0, PALETTE.fresa.base); g.addColorStop(1, PALETTE.menta.base);
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + sag, x2, y2);
        ctx.lineWidth = 11; ctx.strokeStyle = PALETTE.ink; ctx.stroke(); ctx.lineWidth = 6; ctx.strokeStyle = g; ctx.stroke();
      };
      if (c.dataset.art === 'caneca') {
        ctx.fillStyle = '#5aa797'; ctx.fillRect(0, 98, W, 42);
        ArenaArt.rr(ctx, 60, 84, W - 60, 18, 6); ArenaArt.fillStroke(ctx, '#d89a5b', 3);
        // caneca
        ctx.beginPath(); ctx.moveTo(4, 104); ctx.lineTo(52, 104); ctx.lineTo(48, 150); ctx.lineTo(8, 150); ctx.closePath(); ArenaArt.fillStroke(ctx, '#3fae6b', 3);
        rope(60, 108, 250, 64, 20);
        blob(250, 64, 20, PALETTE.fresa, -1);
        blob(52, 112, 16, PALETTE.menta, 1);
        ctx.font = font(22, 700); ctx.fillStyle = PALETTE.ink; ctx.textAlign = 'center';
        outlinedText(ctx, '¡AL FILO!', 120, 30, 24, '#ff8a7a', PALETTE.ink);
      } else if (c.dataset.art === 'rey') {
        // el borrador con la corona y los dos peleándose encima
        ArenaArt.rr(ctx, 120, 78, 190, 26, 9); ArenaArt.fillStroke(ctx, '#f7a9bd', 3);
        ctx.save(); ArenaArt.rr(ctx, 120, 78, 190, 26, 9); ctx.clip(); ctx.fillStyle = '#7fb4ee'; ctx.fillRect(225, 78, 90, 26); ctx.restore();
        ArenaArt.rr(ctx, 120, 78, 190, 26, 9); ctx.lineWidth = 3; ctx.strokeStyle = PALETTE.ink; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(195, 40); ctx.lineTo(195, 22); ctx.lineTo(205, 32); ctx.lineTo(215, 16); ctx.lineTo(225, 32); ctx.lineTo(235, 22); ctx.lineTo(235, 40); ctx.closePath();
        ArenaArt.fillStroke(ctx, '#ffd84d', 3);
        rope(185, 62, 255, 66, 6);
        blob(185, 60, 18, PALETTE.fresa, 1);
        blob(258, 63, 16, PALETTE.menta, -1);
      } else if (c.dataset.art === 'campana') {
        const ink = PALETTE.ink, rr = ArenaArt.rr, floor = H * 0.7;
        ctx.fillStyle = '#d89a5b'; ctx.fillRect(0, floor, W, H - floor); ctx.fillStyle = 'rgba(58,34,22,0.25)'; ctx.fillRect(0, floor, W, 4);
        rr(ctx, 330, floor - 86, 56, 86, 4); ArenaArt.fillStroke(ctx, '#c98a4e', 3);
        rr(ctx, 336, floor - 116, 44, 18, 4); ArenaArt.fillStroke(ctx, '#2f9e5a', 2.5);
        rr(ctx, 120, floor - 10, 70, 10, 3); ArenaArt.fillStroke(ctx, '#f2b631', 2.5);
        rr(ctx, 230, floor - 120, 22, 120, 4); ArenaArt.fillStroke(ctx, '#7d8796', 3);
        rope(150, floor - 26, 290, floor - 60, 14);
        blob(150, floor - 26, 18, PALETTE.fresa, 1); blob(290, floor - 60, 16, PALETTE.menta, 1);
        outlinedText(ctx, 'SALIDA', 358, 18, 18, '#9dffb0', ink);
      } else if (c.dataset.art && c.dataset.art.startsWith('jefe')) {
        const which = c.dataset.art === 'jefe' ? 'todos' : c.dataset.art.slice(5), ink = PALETTE.ink, rr = ArenaArt.rr;
        const floor = H * 0.7;
        ctx.fillStyle = '#c98a4e'; ctx.fillRect(0, floor, W, H - floor); ctx.fillStyle = 'rgba(58,34,22,0.25)'; ctx.fillRect(0, floor, W, 4);
        const roomba = (x, y, s) => {
          rr(ctx, x - 70 * s, y - 34 * s, 140 * s, 34 * s, 14 * s); ctx.fillStyle = '#5a6475'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
          ctx.beginPath(); ctx.ellipse(x, y - 32 * s, 70 * s, 11 * s, 0, 0, TAU); ctx.fillStyle = '#8b96a8'; ctx.fill(); ctx.stroke();
          for (const k of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x - 30 * s + k * 12 * s, y - 33 * s, 6 * s, 4.5 * s, 0, 0, TAU); ctx.fillStyle = '#9dffb0'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); }
        };
        const sharp = (x, y, s) => {
          ctx.strokeStyle = '#333'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, y - 40 * s); ctx.stroke();
          rr(ctx, x - 50 * s, y - 40 * s, 100 * s, 80 * s, 14 * s); ctx.fillStyle = '#4aa3ff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
          ctx.beginPath(); ctx.arc(x + 22 * s, y + 12 * s, 13 * s, 0, TAU); ctx.fillStyle = '#222'; ctx.fill(); ctx.stroke();
          ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 50 * s, y); ctx.lineTo(x - 72 * s, y); ctx.stroke();
          ctx.beginPath(); ctx.arc(x - 72 * s, y, 7 * s, 0, TAU); ctx.fillStyle = '#e8574a'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
          for (const k of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x - 14 * s + k * 14 * s, y - 20 * s, 7 * s, 6 * s, 0, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); }
        };
        const mop = (x, y, s) => {
          ctx.lineCap = 'round'; ctx.strokeStyle = ink; ctx.lineWidth = 10 * s; ctx.beginPath(); ctx.moveTo(x + 60 * s, 0); ctx.lineTo(x, y - 30 * s); ctx.stroke();
          ctx.strokeStyle = '#c98a4e'; ctx.lineWidth = 6 * s; ctx.beginPath(); ctx.moveTo(x + 60 * s, 0); ctx.lineTo(x, y - 30 * s); ctx.stroke();
          rr(ctx, x - 50 * s, y - 36 * s, 100 * s, 14 * s, 5 * s); ctx.fillStyle = '#3c8fe0'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
          for (let k = 0; k < 9; k++) { const mx = x - 46 * s + k * 11.5 * s; ctx.strokeStyle = ink; ctx.lineWidth = 6 * s; ctx.beginPath(); ctx.moveTo(mx, y - 24 * s); ctx.lineTo(mx - 6 * s, y); ctx.stroke(); ctx.strokeStyle = '#eef2f6'; ctx.lineWidth = 3 * s; ctx.stroke(); }
        };
        if (which === 'todos') {
          roomba(110, floor, 0.9); sharp(250, 52, 0.62); mop(350, floor, 0.75);
          blob(200, floor - 18, 16, PALETTE.fresa, -1); blob(290, floor - 18, 16, PALETTE.menta, 1); rope(200, floor - 14, 290, floor - 14, 10);
        } else {
          if (which === 'aspiradora') roomba(W * 0.6, floor, 1.25);
          if (which === 'sacapuntas') sharp(W * 0.6, H * 0.36, 1.05);
          if (which === 'aseador') mop(W * 0.6, floor, 1.25);
          if (which === 'fotocopiadora') {
            const x = W * 0.66, s = 1.1; rr(ctx, x - 60 * s, floor - 96 * s, 120 * s, 96 * s, 10 * s); ctx.fillStyle = '#e7e2d6'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
            rr(ctx, x - 64 * s, floor - 108 * s, 128 * s, 16 * s, 6 * s); ctx.fillStyle = '#cfc8b8'; ctx.fill(); ctx.stroke();
            rr(ctx, x - 40 * s, floor - 80 * s, 52 * s, 30 * s, 6 * s); ctx.fillStyle = '#2f3542'; ctx.fill(); ctx.stroke();
            for (const k of [0, 1]) { ctx.beginPath(); ctx.ellipse(x - 26 * s + k * 24 * s, floor - 65 * s, 6 * s, 5 * s, 0, 0, TAU); ctx.fillStyle = '#7fd8ff'; ctx.fill(); }
            for (let k = 0; k < 2; k++) { ctx.save(); ctx.translate(x - 110 * s - k * 70 * s, floor - 60 * s + k * 26 * s); ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(20, -11); ctx.lineTo(12, 0); ctx.lineTo(20, 10); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke(); ctx.restore(); }
          }
          if (which === 'microondas') {
            const x = W * 0.62, y = H * 0.18, s = 1;
            ctx.strokeStyle = '#6f655c'; ctx.lineWidth = 4; for (const cx of [x - 50, x + 50]) { ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, y); ctx.stroke(); }
            rr(ctx, x - 80 * s, y, 160 * s, 100 * s, 12); ctx.fillStyle = '#f2f2ee'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
            rr(ctx, x - 66 * s, y + 14, 92 * s, 72 * s, 8); ctx.fillStyle = '#ffc76a'; ctx.fill(); ctx.stroke();
            rr(ctx, x + 34, y + 14, 34, 22, 5); ctx.fillStyle = '#1b2a4a'; ctx.fill();
            ctx.fillStyle = 'rgba(255,90,40,0.75)'; ctx.fillRect(W * 0.08, floor - 6, W * 0.25, 8); ctx.fillRect(W * 0.55, floor - 6, W * 0.2, 8);
            for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(x - 30 + k * 30, floor - 30 - (k % 2) * 16, 7, 0, TAU); ctx.fillStyle = '#ffd84d'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); }
          }
          if (which === 'reloj') {
            const x = W * 0.64, y = H * 0.42, r = 58;
            ctx.beginPath(); ctx.arc(x, y, r + 8, 0, TAU); ctx.fillStyle = '#8a5a2b'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
            ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = '#fff3d6'; ctx.fill(); ctx.stroke();
            ctx.lineCap = 'round'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 34, y - 30); ctx.stroke(); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 22, y + 10); ctx.stroke();
            for (const k of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + k * 20, y - 24, 8, 8, 0, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); ctx.arc(x + k * 20 + 2, y - 22, 3, 0, TAU); ctx.fillStyle = '#e5533d'; ctx.fill(); }
            ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y + r); ctx.lineTo(x + 18, y + r + 40); ctx.stroke();
            ctx.beginPath(); ctx.arc(x + 18, y + r + 44, 12, 0, TAU); ctx.fillStyle = '#e0a83a'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = ink; ctx.stroke();
            ctx.beginPath(); ctx.ellipse(x - 70, y - 40, 16, 12, 0, 0, TAU); ctx.fillStyle = '#ffd84d'; ctx.fill(); ctx.stroke();
          }
          blob(W * 0.16, floor - 22, 20, PALETTE.fresa, 1); blob(W * 0.3, floor - 22, 20, PALETTE.menta, 1); rope(W * 0.16, floor - 18, W * 0.3, floor - 18, 12);
        }
      } else if (c.dataset.art === 'fuga') {
        // reja abierta, uno pisando el botón y el otro pasando
        ArenaArt.rr(ctx, 20, 100, 150, 10, 4); ArenaArt.fillStroke(ctx, '#d39a5c', 3);
        ArenaArt.rr(ctx, 70, 90, 50, 10, 4); ArenaArt.fillStroke(ctx, '#3fbf6a', 3);
        ArenaArt.rr(ctx, 10, 52, 120, 12, 4); ArenaArt.fillStroke(ctx, '#7d8796', 3);
        ArenaArt.rr(ctx, 230, 30, 160, 10, 4); ArenaArt.fillStroke(ctx, '#d39a5c', 3);
        rope(95, 78, 250, 40, 16);
        blob(95, 76, 15, PALETTE.fresa, 1);
        blob(250, 22, 15, PALETTE.menta, -1);
        outlinedText(ctx, '¡JUNTOS!', 330, 80, 22, '#ffd84d', PALETTE.ink);
      } else if (c.dataset.art === 'escalada') {
        // vigas, campana arriba y uno colgando del otro
        [[40, 104, 120], [250, 74, 130], [120, 44, 110]].forEach(([x, y, w]) => { ArenaArt.rr(ctx, x, y, w, 10, 4); ArenaArt.fillStroke(ctx, '#d39a5c', 3); });
        ctx.beginPath(); ctx.moveTo(340, 22); ctx.quadraticCurveTo(336, 40, 324, 50); ctx.lineTo(372, 50); ctx.quadraticCurveTo(360, 40, 356, 22); ctx.closePath(); ArenaArt.fillStroke(ctx, '#ffd84d', 3);
        rope(170, 40, 200, 96, -10);
        blob(170, 30, 15, PALETTE.fresa, 1);
        blob(200, 104, 16, PALETTE.menta, -1);
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(30 + k * 70, 116 + (k % 2) * 6, 3, 0, TAU); ctx.fill(); }
      } else if (c.dataset.art === 'gol') {
        // cartuchera-arco, canica y un jugador pateando
        ctx.fillStyle = 'rgba(40,20,10,0.45)'; ctx.fillRect(330, 68, 80, 30);
        ArenaArt.rr(ctx, 322, 58, 90, 12, 5); ArenaArt.fillStroke(ctx, '#8796b3', 3);
        ArenaArt.rr(ctx, 400, 58, 12, 40, 4); ArenaArt.fillStroke(ctx, '#55627d', 3);
        const g = ctx.createRadialGradient(258, 62, 2, 262, 66, 16); g.addColorStop(0, '#f2fbff'); g.addColorStop(1, '#4f8fd6');
        ctx.beginPath(); ctx.arc(262, 70, 14, 0, TAU); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PALETTE.ink; ctx.stroke();
        ctx.strokeStyle = 'rgba(80,120,180,0.5)'; ctx.lineWidth = 3; [[230, 64], [214, 72], [222, 80]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 22, y); ctx.stroke(); });
        rope(150, 80, 70, 80, 14);
        blob(176, 78, 20, PALETTE.fresa, 1);
        blob(64, 80, 17, PALETTE.menta, 1);
        outlinedText(ctx, '¡GOL!', 360, 30, 24, '#ffd84d', PALETTE.ink);
      } else {
        const cols = ['#ffd84d', '#9b6bdf', '#4aa3ff', '#ff9a3c', '#b7dc3c'];
        const balls = [[60, 40], [140, 100], [230, 30], [330, 90], [380, 36], [190, 70]];
        balls.forEach(([x, y], i) => {
          ctx.beginPath(); ctx.arc(x, y, i === 5 ? 15 : 11, 0, TAU); ctx.fillStyle = i === 5 ? '#ffcf3c' : cols[i % cols.length]; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PALETTE.ink; ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(x - 4, y - 4, 4, 2.5, -0.6, 0, TAU); ctx.fill();
        });
        rope(110, 118, 300, 112, 16);
        blob(110, 116, 19, PALETTE.fresa, 1);
        blob(300, 112, 22, PALETTE.menta, -1);
        outlinedText(ctx, '+3', 190, 40, 24, '#ffd84d', PALETTE.ink);
      }
    });
  }

  function init() {
    if (Touch.enabled) document.documentElement.classList.add('touchdev');
    $$('[data-act]').forEach(b => {
      b.addEventListener('click', () => { Sound.init(); Sound.play('select'); const a = ACTIONS[b.dataset.act]; if (a) a(); });
      b.addEventListener('pointerenter', () => { if (document.activeElement !== b) { b.focus({ preventScroll: true }); Sound.play('hover'); } });
    });
    // botones que rotan entre opciones (estilo de música, sabores)
    $$('[data-cyc]').forEach(b => b.addEventListener('click', () => {
      Sound.init(); Sound.play('select');
      const k = b.dataset.cyc;
      if (k === 'style') {
        const list = ['arena', 'random', ...Sound.Music.ORDER];
        Game.setMusicStyle(list[(list.indexOf(Game.G.musicStyle) + 1) % list.length]);
      } else {
        const i = k === 'f0' ? 0 : 1;
        let idx = FLAVOR_ORDER.indexOf(Game.G.flavors[i]);
        for (let n = 0; n < FLAVOR_ORDER.length; n++) { idx = (idx + 1) % FLAVOR_ORDER.length; if (Game.setFlavor(i, FLAVOR_ORDER[idx])) break; }
      }
      syncOptions();
    }));
    // jugadores: nombres, accesorios y pestañas de logros
    ['n1', 'n2'].forEach((id, i) => {
      const el = $('#' + id);
      el.addEventListener('change', () => { Progress.setName(i, el.value); el.value = Progress.names[i]; Game.applyFlavors(); fillRecords(); });
      el.addEventListener('blur', () => { Progress.setName(i, el.value); el.value = Progress.names[i]; Game.applyFlavors(); fillRecords(); });
    });
    $$('[data-acc]').forEach(b => b.addEventListener('click', () => {
      Sound.init(); Sound.play('select');
      const i = +b.dataset.acc, list = Progress.ACCESSORIES;
      let idx = list.findIndex(a => a.id === Progress.accOf(i));
      for (let n = 0; n < list.length; n++) { idx = (idx + 1) % list.length; if (Progress.setAcc(i, list[idx].id)) break; }
      Game.applyFlavors(); fillRecords();
    }));
    $$('#ach-tabs button').forEach(b => b.addEventListener('click', () => { Sound.init(); Sound.play('select'); achTab = +b.dataset.t; fillRecords(); }));
    $$('.seg:not(.tabs)').forEach(seg => {
      seg.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        Sound.init(); Sound.play('select');
        const v = b.dataset.v, opt = seg.dataset.opt;
        if (opt === 'music') Sound.setMusic(v === '1');
        if (opt === 'sfx') Sound.setSfx(v === '1');
        if (opt === 'wins') Game.setWins(Number(v));
        if (opt === 'bot') Game.setBotLevel(Number(v));
        if (opt === 'theme') Game.setTheme(v);
        if (opt === 'marks') { Player.marks = v === '1'; Store.set('marks', Player.marks); }
        if (opt === 'autostick') { Game.G.autoStick = v === '1'; Store.set('autoStick', Game.G.autoStick); }
        if (opt === 'shake') { FX.settings.shake = Number(v); Store.set('shake', Number(v)); }
        if (opt === 'hc0' || opt === 'hc1') Game.setHandicap(opt === 'hc0' ? 0 : 1, Number(v));
        if (opt === 'vib') { Game.G.vibrate = v === '1'; Store.set('vibrate', Game.G.vibrate); if (Game.G.vibrate) Game.buzz(40); }
        if (opt === 'autofs') FS.auto = v === '1';
        if (opt === 'tbig') Touch.setBig(v === '1');
        if (opt === 'quality') { Store.set('quality', v); FX.settings.particles = v === 'ligera' ? 0.45 : 1; window.dispatchEvent(new Event('resize')); }
        syncOptions();
      }));
    });
    Input.onPress(onKey);
    addEventListener('pointerdown', () => Sound.init(), { passive: true });
    addEventListener('blur', () => { if (!current) pause(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && !current) pause(); });
    Game.G.onMatchEnd = showResults;
    Game.G.onPick = showPick;
    Tutorial.onEnd = () => toMenu();
    Retos.onExit = i => backToRetos(i);
    syncOptions();
    show('title', false);
    const touchOnly = matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (!touchOnly && !Store.get('seenTut', false)) { Store.set('seenTut', true); setTimeout(() => { if (current === 'title') toast('¿Primera vez? En «Cómo jugar» hay un tutorial jugable de tres minutos.', 7000); }, 1500); }
    if (touchOnly) toast('En pantalla táctil aparecen botones al jugar. Pon el celular en horizontal: dos pueden jugar en el mismo celular, cada uno en su mitad. Si los botones te quedan chicos, agrándalos en Opciones.', 9000);
  }

  // prueba de un torneo de la colección: dos jugadores, modo y arena dados, rondas propias (sin guardar nada)
  let hubWins = null;
  function hubRestore() { if (hubWins != null) { Game.G.winsNeeded = hubWins; hubWins = null; } }
  function hubPlay(ev) {
    const G = Game.G;
    vsBot = false; paused = false; stack = [];
    G.daily = null; Fiesta.force(null); G.campBoss = null; keepCamp = false;
    if (hubWins == null) hubWins = G.winsNeeded;
    if (ev.rounds) G.winsNeeded = ev.rounds;
    show(null, false);
    Game.startMatch(ev.mode, false, ev.map && ev.map !== 'random' ? ev.map : 'random', !!(ev.opts && ev.opts.fiesta));
  }
  return { init, drawModeArt, toast, get paused() { return paused; }, get current() { return current; }, show, pause, resume, hubPlay, vestBadge };
})();

/* =========================================================================
   ARRANQUE
   ========================================================================= */
(function boot() {
  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d', { alpha: false });
  let dpr = 1, cw = 0, ch = 0, buildTimer = null;

  function artScale() {
    const contain = Math.min(cw / WORLD_W, ch / WORLD_H), cover = Math.max(cw / WORLD_W, ch / WORLD_H);
    return clamp(Math.min(cover, contain * 1.1) * 1.15, 0.45, Store.get('quality', 'alta') === 'ligera' ? 1.25 : 1.6);
  }
  function resize() {
    // nítido también en celular: «ligera» solo baja partículas y el tamaño del fondo, no la resolución
    const lite = Store.get('quality', 'alta') === 'ligera';
    dpr = Math.min(window.devicePixelRatio || 1, lite ? 2 : 2.5);
    cw = Math.max(1, Math.round(innerWidth * dpr)); ch = Math.max(1, Math.round(innerHeight * dpr));
    cv.width = cw; cv.height = ch;
    // pantallas chicas (celular apaisado): los menús se diseñaron para ~1060×600; se achican enteros para que quepan
    const z = clamp(Math.min(innerWidth / 1060, innerHeight / 600), 0.42, 1);
    const uiEl = document.getElementById('ui');
    if (uiEl && uiEl.style.zoom !== String(z)) uiEl.style.zoom = z === 1 ? '' : String(z);
    document.documentElement.style.setProperty('--uiz', z);
    // las reglas de pantalla angosta usan el ancho que ven los menús (ya achicados), no el del celular
    const ew = innerWidth / z, rc = document.documentElement.classList;
    for (const w of [620, 720, 760, 900]) rc.toggle('lt' + w, ew < w);
    const want = artScale();
    if (!ArenaArt.bg) ArenaArt.build(want);
    else if (Math.abs(want - ArenaArt.scale) > 0.1) { clearTimeout(buildTimer); buildTimer = setTimeout(() => ArenaArt.build(artScale()), 180); }
  }
  addEventListener('resize', resize);
  addEventListener('orientationchange', () => setTimeout(resize, 120));
  if (window.visualViewport) visualViewport.addEventListener('resize', resize);

  Game.init();
  resize();
  UI.init();
  UI.drawModeArt();
  // al cargar la fuente, repintar el escenario con las letras bonitas
  const fontReady = document.fonts && document.fonts.load ? Promise.race([document.fonts.load('700 30px Fredoka'), new Promise(r => setTimeout(r, 2500))]) : Promise.resolve();
  fontReady.then(() => { ArenaArt.build(artScale()); UI.drawModeArt(); }).catch(() => {});

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    Input.pollPads();
    if (!UI.paused) Game.update(dt);
    Game.render(ctx, cw, ch, dpr);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ganchos para pruebas
  const over = [null, null];
  const orig = Input.player;
  Input.player = i => over[i] || orig(i);
  window.TYA = { Game, UI, Input, Sound, FX, ARENA, PHYS, over, META: GAME_META, makeBot: (id, lvl) => new Bot(id, lvl), Tutorial, Retos, Campaign, Jefes, Progress, Touch, get Entreno() { return typeof Entreno !== 'undefined' ? Entreno : null; } };
  Platform.emit('ready', { name: GAME_META.name });
  Hub.onPlay(ev => UI.hubPlay(ev));
  Hub.ready();
})();
