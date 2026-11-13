/* =========================================================================
   MENÚS — título (con un duelo de máquinas de fondo), preparar duelo
   (mago de cada uno, escenario, rondas, nivel), cómo se juega, opciones,
   pausa y resultados.
   ========================================================================= */
const UI = (() => {
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  let current = 'title', stack = [], paused = false;
  const setup = { players: 2, mode: Game.cfg.mode || 'duel' };
  const Copa = { on: false, list: [], k: 0, pts: [0, 0] };
  const touch = () => Touch.enabled;
  function insets() { return Touch.insets(); }
  function show(id, push = true) {
    if (push && current && current !== id) stack.push(current);
    Touch.reset();
    current = id;
    if (id == null && !Game.G.attract && Game.G.state === 'count') FS.autoEnter(); // pantalla completa automática al empezar a jugar
    $$('.screen').forEach(s => (s.hidden = s.id !== 's-' + id));
    $('#pauseBtn').style.display = id == null && Game.G.state !== 'attract' && touch() ? 'block' : 'none';
    if (id === 'title') { if (!Game.G.attract) Game.startAttract(); Music.setLevel(0); Music.setStyle('menu'); startHeroes(); }
    if (id == null && Game.G.A && !Game.G.attract) Music.setStyle(Game.G.A.theme);
    if (id === 'setup') fillSetup();
    if (id === 'howto') fillHowto();
    if (id === 'options') fillOptions();
    if (id === 'camp') fillCamp();
    if (id === 'grim') fillGrim();
    if (id === 'title') $('#campStars').textContent = `${Camp.total()} / ${Camp.LEVELS.length * 3} ★`;
    const f = id && document.querySelector(`#s-${id} .btn.gold, #s-${id} .btn`); if (f && !touch()) f.focus({ preventScroll: true });
  }
  function back() {
    Sound.play('back');
    if (hubPending && current === 'setup') { Hub.leave(); hubPick(null); }
    if (current === 'options' && paused) { show('pause', false); return; }
    const prev = stack.pop() || 'title'; show(prev, false);
  }
  /* ---------- preparar duelo ---------- */
  const pick = Game.cfg.chars.slice(), skins = [pick[0] + '.0', pick[1] + '.0'];
  // atuendos: los maneja el vestidor (13b-vest.js); aquí solo se elige entre los que ya se ganaron
  const VV = () => (typeof Vestidor !== 'undefined' ? Vestidor.V : null);
  function syncSkins() { const V = VV(); if (V) for (let p = 0; p < 2; p++) skins[p] = V.eq(p, 'skin', pick[p]); }
  function skinList(cid) { const V = VV(); return V ? V.items.filter(it => it.slot === 'skin' && (!it.char || it.char === cid) && V.has(it.id)).sort((a, b) => Vest.RORDER.indexOf(a.rar) - Vest.RORDER.indexOf(b.rar)) : []; }
  function cycleSkin(p) { const V = VV(); if (!V) return; const L = skinList(pick[p]); if (L.length < 2) { Sound.play('deny'); return; } const k = L.findIndex(it => it.id === skins[p]), nx = L[(k + 1) % L.length]; V.setEq(p, 'skin', nx.id, pick[p]); skins[p] = nx.id; Sound.play('select'); fillCard(p); }
  function openVest(p, after) { const V = VV(); if (!V) return; V.wardrobe({ player: p || 0, onClose() { syncSkins(); if (current === 'setup') { fillCard(0); fillCard(1); } vestBadge(); if (after) after(); } }); }
  function vestBadge() { const V = VV(), b = $('#vestNew'); if (!V || !b) return; const n = V.fresh(); b.textContent = n ? n + (n === 1 ? ' nuevo' : ' nuevos') : V.count().join(' / '); b.classList.toggle('hot', n > 0); }
  // después de una partida: revisa qué se ganó y lo muestra con su ceremonia (encima de los resultados)
  function vestAfter() { const V = VV(); if (!V) return; const got = V.check(); if (got.length) setTimeout(() => { V.reveal(() => vestBadge()); }, 1100); }
  // medallones de elemento (dibujados una vez)
  const medals = {};
  function medal(el) {
    if (medals[el]) return medals[el];
    const c = document.createElement('canvas'); c.width = c.height = 96; const x = c.getContext('2d'), E = ELEMENTS[el];
    const ring = x.createLinearGradient(10, 10, 86, 86); ring.addColorStop(0, '#fff2b0'); ring.addColorStop(0.45, '#d9a43a'); ring.addColorStop(1, '#6a4008');
    x.fillStyle = ring; x.beginPath(); x.arc(48, 48, 46, 0, TAU); x.fill();
    x.fillStyle = '#1a0e08'; x.beginPath(); x.arc(48, 48, 39, 0, TAU); x.fill();
    const g = x.createRadialGradient(40, 36, 4, 48, 48, 37); g.addColorStop(0, E.c0); g.addColorStop(0.5, E.c1); g.addColorStop(1, E.c2); x.fillStyle = g; x.beginPath(); x.arc(48, 48, 36, 0, TAU); x.fill();
    x.fillStyle = 'rgba(0,0,0,0.25)'; x.beginPath(); x.arc(48, 52, 30, 0, TAU); x.fill();
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; x.fillStyle = '#4a2a06'; x.beginPath(); x.arc(48 + Math.cos(a) * 42.5, 48 + Math.sin(a) * 42.5, 1.6, 0, TAU); x.fill(); }
    HUD.icon(x, el, 48, 48, 21, '#ffffff');
    x.globalCompositeOperation = 'lighter'; x.fillStyle = 'rgba(255,255,255,0.22)'; x.beginPath(); x.ellipse(40, 30, 18, 9, -0.5, 0, TAU); x.fill();
    return (medals[el] = c.toDataURL());
  }
  function skinRow(p) {
    const V = VV(); if (!V) return '';
    const cid = pick[p], it = V.BY[skins[p]] || V.BY[cid + '.0'], R = Vest.RAR[it.rar], L = skinList(cid), all = V.items.filter(i => i.slot === 'skin' && (!i.char || i.char === cid) && !i.free).length;
    const keys = touch() ? '' : p === 0 ? ' (W)' : setup.players === 1 ? '' : ' (↑)';
    if (p === 1 && setup.players === 1) return '';
    return `<div class="skins"><button class="btn small skinBtn" style="border-color:${R.c};box-shadow:0 0 12px ${R.c}55" title="Cambiar de atuendo">Atuendo: ${it.name}${keys}</button><button class="btn small vestBtn" title="Ver todos los atuendos">Vestidor · ${L.length - 1}/${all}</button></div>`;
  }
  const elTag = el => `<span class="el"><img alt="" src="${medal(el)}">${ELEMENTS[el].name}</span>`;
  const bar = (lbl, v) => `<span class="bar"><span>${lbl}</span><b><i style="width:${Math.round(clamp(v, 0.08, 1) * 100)}%"></i></b></span>`;
  function fillCard(p) {
    const cid = pick[p], C = CHARS[cid], card = $(`.card[data-p="${p}"]`);
    const who = p === 1 && setup.players === 1 ? 'LA MÁQUINA' : `JUGADOR ${p + 1}`;
    const keysTxt = touch() ? '' : p === 0 ? 'A / D' : setup.players === 1 ? '' : '← / →';
    card.innerHTML = `<div class="hero"><canvas class="show"></canvas><div class="who">${who}${keysTxt ? `<small>${keysTxt}</small>` : ''}</div>
      <button class="btn arrow l" data-d="-1" aria-label="anterior">◀</button><button class="btn arrow r" data-d="1" aria-label="siguiente">▶</button>
      <div class="cnt">${CHAR_ORDER.indexOf(cid) + 1} / ${CHAR_ORDER.length}${CHAR_ORDER.indexOf(cid) >= 6 ? ' <i>NUEVO</i>' : ''}</div>
      <div class="info"><div class="nm">${C.name}</div><div class="tt">${C.title}</div></div></div>
      <div class="meta"><div class="els">${elTag(C.hands[0])}${elTag(C.hands[1])}</div>
      <div class="bars">${bar('Vida', (C.hp - 80) / 90)}${bar('Rapidez', (C.speed - 0.82) / 0.36)}</div>
      <div class="tr"><b>${FUSIONS[C.sig].name}:</b> ${C.trait}</div>${skinRow(p)}</div>`;
    const sb = card.querySelector('.skinBtn'); if (sb) sb.onclick = () => cycleSkin(p);
    const vb = card.querySelector('.vestBtn'); if (vb) vb.onclick = () => openVest(p);
    card.querySelectorAll('[data-d]').forEach(b => b.onclick = () => cycle(p, +b.dataset.d));
    card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap');
    startShow();
  }
  // portada: dos magos grandes a los lados, que cambian cada tanto
  let titleRaf = 0; const heroes = { a: null, b: null, t0: 0 };
  function heroPick() { const L = CHAR_ORDER.slice(); const a = L.splice((Math.random() * L.length) | 0, 1)[0], b = L[(Math.random() * L.length) | 0]; heroes.a = a; heroes.b = b; heroes.t0 = performance.now() / 1000; const O = ArtMage.OUTFIT_ORDER, rs = () => Math.random() < 0.55 ? 'u.' + O[(Math.random() * O.length) | 0] : (Math.random() * 3) | 0; heroes.sa = rs(); heroes.sb = rs(); }
  function startHeroes() {
    if (titleRaf) return; if (!heroes.a) heroPick();
    const cv = $('#t-heroes'); let lay = null, n = 0;
    const loop = () => {
      if (current !== 'title') { titleRaf = 0; return; }
      const t = performance.now() / 1000, dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); lay = null; }
      if (!lay || n++ % 40 === 0) { const m = $('#s-title .menu .main .btn'), r = $('#s-title .menu .row .btn'); lay = { main: m ? m.getBoundingClientRect().left : 0, row: r ? r.getBoundingClientRect().left : 0 }; }
      const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
      const s = Math.min(H * 0.46 / 112, lay.main / 62, lay.row / 44, 3.2);
      if (s >= 0.95 && W > H) {
        // los bordes se oscurecen un poco para que las figuras resalten
        for (const d of [0, 1]) { const g = x.createLinearGradient(d ? W : 0, 0, d ? W - W * 0.3 : W * 0.3, 0); g.addColorStop(0, 'rgba(4,3,14,0.82)'); g.addColorStop(1, 'rgba(4,3,14,0)'); x.fillStyle = g; x.fillRect(d ? W * 0.7 : 0, 0, W * 0.3, H); }
        const age = t - heroes.t0, al = clamp(Math.min(age / 0.8, (11 - age) / 0.8), 0, 1); if (age > 11) heroPick();
        const X = Math.max(34 * s, lay.main / 2), Y = H - Math.max(12, H * 0.045);
        ArtMage.hero(x, heroes.a, X, Y, s, t, 1, heroes.sa || 0, al); ArtMage.hero(x, heroes.b, W - X, Y, s, t + 3.1, -1, heroes.sb || 0, al);
      }
      titleRaf = requestAnimationFrame(loop);
    };
    titleRaf = requestAnimationFrame(loop);
  }
  // las dos figuras se animan mientras se elige
  let showRaf = 0;
  function startShow() {
    if (showRaf) return;
    const loop = () => {
      if (current !== 'setup') { showRaf = 0; return; }
      const t = performance.now() / 1000, dpr = Math.min(2, devicePixelRatio || 1);
      $$('#s-setup .card').forEach(card => {
        const cv = card.querySelector('canvas.show'); if (!cv) return; const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
        if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
        const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); ArtMage.showcase(x, pick[+card.dataset.p], w, h, t + +card.dataset.p * 2.3, skins[+card.dataset.p]);
      });
      showRaf = requestAnimationFrame(loop);
    };
    showRaf = requestAnimationFrame(loop);
  }
  function cycle(p, d) { const i = CHAR_ORDER.indexOf(pick[p]); pick[p] = CHAR_ORDER[(i + d + CHAR_ORDER.length) % CHAR_ORDER.length]; syncSkins(); Sound.play('select'); fillCard(p); Game.cfg.chars = pick.slice(); Store.set('cfg', Game.cfg); }
  function seg(id, val, onPick) { $$(`#${id} button`).forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.v === String(val))); b.onclick = () => { Sound.play('select'); onPick(b.dataset.v); seg(id, b.dataset.v, onPick); }; }); }
  function fillSetup() {
    fillCard(0); fillCard(1);
    $('#o-arena').innerHTML = ARENA_ORDER.map(a => `<button data-v="${a}">${ARENAS[a].name}</button>`).join('') + (ARENA_ORDER.length > 1 ? '<button data-v="random">Al azar</button>' : '');
    $('#o-mode').innerHTML = MODE_ORDER.map(k => `<button data-v="${k}">${MODES[k].name}</button>`).join('');
    const modeTxt = () => { $('#o-modeTxt').textContent = MODES[setup.mode].short; $('#o-winsw').hidden = setup.mode !== 'duel'; };
    seg('o-mode', setup.mode, v => { setup.mode = v; Game.cfg.mode = v; Store.set('cfg', Game.cfg); modeTxt(); }); modeTxt();
    seg('o-arena', Game.cfg.arena, v => { Game.cfg.arena = v; Store.set('cfg', Game.cfg); });
    seg('o-wins', Game.cfg.wins, v => { Game.cfg.wins = +v; Store.set('cfg', Game.cfg); });
    seg('o-lvl', Game.cfg.level, v => { Game.cfg.level = +v; Store.set('cfg', Game.cfg); });
    $('#o-lvlw').hidden = setup.players !== 1;
  }
  /* ---------- prueba de un torneo de GameHub ---------- */
  let hubPending = null;
  function hubPick(ev) { hubPending = ev; $('#s-setup').classList.toggle('hubpick', !!ev); const t = $('#s-setup .hubTitle'); if (t) t.textContent = ev ? `${ev.title || 'Torneo'} · ${MODES[ev.mode] ? MODES[ev.mode].name : ev.mode}${ARENAS[ev.map] ? ' en ' + ARENAS[ev.map].name : ''}${ev.mode === 'duel' && ev.rounds ? ' · al mejor de ' + (ev.rounds * 2 - 1) : ''}` : ''; }
  function hubStart() {
    const ev = hubPending; hubPick(null); if (!ev) return;
    Sound.init(); Sound.play('go'); paused = false; Game.G.paused = false; stack = []; Copa.on = false; setup.players = 2; setup.mode = ev.mode;
    let ch = pick.slice(), sk = skins.slice();
    if (ev.chars === 'random') { ch = [0, 1].map(() => CHAR_ORDER[Math.floor(Math.random() * CHAR_ORDER.length)]); if (ch[0] === ch[1]) ch[1] = CHAR_ORDER[(CHAR_ORDER.indexOf(ch[0]) + 1 + Math.floor(Math.random() * (CHAR_ORDER.length - 1))) % CHAR_ORDER.length]; const V = VV(); sk = V ? ch.map((c, p) => V.eq(p, 'skin', c)) : [0, 0]; }
    const map = ev.map && ARENAS[ev.map] ? ev.map : ARENA_ORDER[Math.floor(Math.random() * ARENA_ORDER.length)];
    Game.start(ev.mode, 2, { chars: ch, skins: sk, arena: map, wins: ev.rounds || 2, level: Game.cfg.level });
    show(null, false);
  }
  function hubPlay(ev) {
    paused = false; Game.G.paused = false; stack = []; Copa.on = false; Music.duck(false);
    if (ev.chars === 'pick') { setup.players = 2; setup.mode = ev.mode; hubPick(ev); show('setup', false); }
    else { hubPending = ev; hubStart(); }
  }
  function go() {
    if (hubPending) return hubStart();
    Sound.init(); Sound.play('go');
    paused = false; Game.G.paused = false; stack = [];
    if (setup.mode === 'copa') {
      const modes = ['duel', 'tejo', 'hunt', 'altar'].sort(() => Math.random() - 0.5); modes.push(['duel', 'tejo', 'hunt', 'altar'][Math.floor(Math.random() * 4)]);
      const ar = ARENA_ORDER.slice().sort(() => Math.random() - 0.5);
      Copa.on = true; Copa.k = 0; Copa.pts = [0, 0]; Copa.list = modes.map((m, i) => ({ mode: m, arena: ar[i % ar.length] }));
      copaEvent(); return;
    }
    Copa.on = false;
    Game.start(setup.mode, setup.players, { chars: pick.slice(), skins: skins.slice(), arena: Game.cfg.arena, wins: Game.cfg.wins, level: Game.cfg.level });
    show(null, false);
  }
  function copaEvent() {
    const ev = Copa.list[Copa.k]; paused = false; Game.G.paused = false;
    Game.start(ev.mode, setup.players, { chars: pick.slice(), skins: skins.slice(), arena: ev.arena, wins: 2, level: Game.cfg.level });
    Game.G.copaTag = `Copa · prueba ${Copa.k + 1} de 5`; show(null, false);
  }
  /* ---------- campaña ---------- */
  let campPlayers = Store.get('campPlayers', 2), nextLevel = -1, campWorld = 0;
  const w2open = () => Camp.best('c10') > 0;
  function fillCamp() {
    seg('c-players', campPlayers, v => { campPlayers = +v; Store.set('campPlayers', campPlayers); fillCamp(); });
    if (campWorld === 0 && !fillCamp.seen) { fillCamp.seen = 1; campWorld = w2open() && Camp.LEVELS.slice(0, 10).every(L => Camp.best(L.id)) ? 2 : 1; }
    if (campWorld === 2 && !w2open()) campWorld = 1;
    $('#c-world').innerHTML = `<button data-v="1" aria-pressed="${campWorld === 1}">Mundo 1 · Los Tunjos</button><button data-v="2" aria-pressed="${campWorld === 2}" style="${w2open() ? '' : 'opacity:.55'}">${w2open() ? '' : '🔒 '}Mundo 2 · Cielo e Infierno</button>`;
    $$('#c-world button').forEach(b => b.onclick = () => { if (+b.dataset.v === 2 && !w2open()) { $('#c-detail').textContent = 'El Mundo 2 se abre al vencer a Tragaluz (nivel 10).'; Sound.play('back'); return; } campWorld = +b.dataset.v; Sound.play('select'); fillCamp(); });
    $('#c-title').textContent = campWorld === 2 ? 'El Reino de Arriba y el de Abajo' : 'La Travesía de los Tunjos';
    $('#c-picks').innerHTML = [0, 1].map(p => `<span><span class="lbl" style="color:${PLAYER_COLORS[p].main}">${p === 1 && campPlayers === 1 ? 'COMPAÑERO' : 'J' + (p + 1)}</span><button class="btn small" data-cp="${p}" data-d="-1">◀</button> <canvas class="mini" width="72" height="72" data-mp="${p}"></canvas><b style="font-family:Macondo,serif;font-size:17px;color:var(--gold2)">${CHARS[pick[p]].name}</b> <button class="btn small" data-cp="${p}" data-d="1">▶</button></span>`).join('');
    $$('#c-picks canvas.mini').forEach(cv => { const p = +cv.dataset.mp, x = cv.getContext('2d'); x.setTransform(2, 0, 0, 2, 0, 0); ArtMage.portrait(x, pick[p], 18, 18, 17, performance.now() / 1000, skins[p]); x.strokeStyle = PLAYER_COLORS[p].main; x.lineWidth = 1.5; x.beginPath(); x.arc(18, 18, 17, 0, TAU); x.stroke(); });
    $$('#c-picks [data-cp]').forEach(b => b.onclick = () => { const p = +b.dataset.cp, i = CHAR_ORDER.indexOf(pick[p]); pick[p] = CHAR_ORDER[(i + +b.dataset.d + CHAR_ORDER.length) % CHAR_ORDER.length]; Game.cfg.chars = pick.slice(); Store.set('cfg', Game.cfg); Sound.play('select'); fillCamp(); });
    const st = n => '★'.repeat(n) + `<i>${'★'.repeat(3 - n)}</i>`;
    $('#c-grid').innerHTML = Camp.LEVELS.map((L, i) => { if ((L.world || 1) !== campWorld) return ''; const o = Camp.unlocked(i); const TC = { paramo: ['#1c3a5a', '#24402a'], rio: ['#0c3a40', '#12402a'], volcan: ['#4a1410', '#2a0c10'], ciudad: ['#18401e', '#2a3a1a'], cano: ['#5a1a2a', '#1a4a3a'], cielo: ['#2a62b8', '#b88a3a'], infierno: ['#5a1010', '#2a0a26'] }[L.theme] || ['#2a2050', '#141030']; return `<button class="lvl${o ? '' : ' lock'}${L.boss ? ' boss' : ''}" data-lv="${i}" style="--c1:${TC[0]};--c2:${TC[1]}"><span class="num">${i + 1}</span>${o ? '' : '<span class="lk">🔒</span>'}<small>${i + 1} · ${L.kind}</small><b>${L.name}</b><small>${L.place}</small><span class="st">${o ? st(Camp.best(L.id)) : 'cerrado'}</span></button>`; }).join('');
    const say = i => { const L = Camp.LEVELS[i]; $('#c-detail').textContent = Camp.unlocked(i) ? `${i + 1}. ${L.name}: ${L.text}` : `${i + 1}. ${L.name}: superen el nivel anterior para abrirlo.`; };
    let first = Camp.LEVELS.findIndex((L, i) => (L.world || 1) === campWorld && Camp.unlocked(i) && !Camp.best(L.id)); if (first < 0) first = campWorld === 2 ? 10 : 0; say(first);
    $$('#c-grid .lvl').forEach(b => { const i = +b.dataset.lv; b.onmouseenter = b.onfocus = () => say(i); b.onclick = () => { if (!Camp.unlocked(i)) { say(i); Sound.play('back'); return; } startLevel(i); }; });
  }
  function startLevel(i) { Sound.init(); Sound.play('go'); paused = false; Game.G.paused = false; stack = []; Copa.on = false; Game.start('camp', campPlayers, { level: i, chars: pick.slice() }); show(null, false); }
  /* ---------- cómo se juega ---------- */
  function fillHowto() {
    const row = (a, l) => `<tr><td>${l}</td><td><kbd>${KEYMAP[0][a].map(keyName).join('</kbd> o <kbd>')}</kbd></td><td><kbd>${KEYMAP[1][a].map(keyName).join('</kbd> o <kbd>')}</kbd></td></tr>`;
    $('#keysTable').innerHTML = `<tr><th></th><th style="color:var(--j1)">J1</th><th style="color:var(--j2)">J2</th></tr><tr><td>Moverse</td><td><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></td><td><kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd></td></tr>` + row('h0', 'Mano izquierda') + row('h1', 'Mano derecha') + row('dash', 'Esquivar');
    $('#fusList').innerHTML = FUSION_ORDER.map(k => { const [a, b] = k.split('+'); return `<div><b>${FUSIONS[k].name}</b><br>${ELEMENTS[a].name} + ${ELEMENTS[b].name}</div>`; }).join('');
  }
  function fillGrim() {
    const P = Progress.data, nF = Object.keys(P.grim).length, nA = Object.keys(P.ach).length;
    $('#g-fcount').textContent = `Fusiones descubiertas: ${nF} de ${FUSION_ORDER.length}`;
    $('#g-fus').innerHTML = FUSION_ORDER.map(k => { const [a, b] = k.split('+'), F = FUSIONS[k], on = P.grim[k]; return `<div class="${on ? '' : 'no'}"><span class="pair"><img alt="" src="${medal(a)}"><img alt="" src="${medal(b)}"></span><b>${on ? F.name : '¿?'}</b><br>${ELEMENTS[a].name} + ${ELEMENTS[b].name}${on ? `<br><span style="color:var(--mute)">${F.tip}</span>` : ''}</div>`; }).join('');
    $('#g-acount').textContent = `Logros: ${nA} de ${ACHIEVEMENTS.length}`;
    const skinCards = CHAR_ORDER.map(cid => { const w = (P.wins || {})[cid] || 0, S = ArtMage.SKINS[cid], open = [1, 2].filter(k => w >= ArtMage.SKIN_NEED[k]).length; return `<div class="ach ${open === 2 ? 'got' : 'no'}"><span class="tro">${open}/2</span><b>Atuendos de ${CHARS[cid].name}</b><br>${[1, 2].map(k => w >= ArtMage.SKIN_NEED[k] ? `✓ ${S[k].name}` : `${S[k].name} (${ArtMage.SKIN_NEED[k]} victorias)`).join(' · ')}</div>`; }).join('');
    $('#g-ach').innerHTML = skinCards + ACHIEVEMENTS.map(A => `<div class="ach ${P.ach[A.id] ? 'got' : 'no'}"><span class="tro">${P.ach[A.id] ? '★' : '☆'}</span><b>${A.name}</b><br>${A.text}</div>`).join('');
  }
  function fillKeys() {
    const t = $('#o-keys'); t.innerHTML = `<tr><th></th><th style="color:var(--j1)">J1</th><th style="color:var(--j2)">J2</th></tr>` + KEY_ACTIONS.map(a => `<tr><td>${KEY_LABELS[a]}</td>${[0, 1].map(p => `<td><button data-kp="${p}" data-ka="${a}">${KEYMAP[p][a].map(keyName).join(' / ')}</button></td>`).join('')}</tr>`).join('');
    t.querySelectorAll('[data-kp]').forEach(b => b.onclick = () => {
      b.classList.add('wait'); b.textContent = 'pulsa…'; $('#o-keyMsg').textContent = 'Pulsa la tecla nueva (Esc cancela)';
      Input.hook = code => { Input.hook = null; $('#o-keyMsg').textContent = ''; if (code !== 'Escape') { const p = +b.dataset.kp, a = b.dataset.ka; for (const m of KEYMAP) for (const k of KEY_ACTIONS) m[k] = m[k].filter(c => c !== code); KEYMAP[p][a] = [code].concat(KEYMAP[p][a].filter(c => c !== code)).slice(0, 2); for (const m of KEYMAP) for (const k of KEY_ACTIONS) if (!m[k].length) m[k] = [code === 'Escape' ? 'KeyZ' : m[k][0] || '']; Store.set('keys', KEYMAP); } fillKeys(); };
    });
    $('#o-keysReset').onclick = () => { KEYMAP = JSON.parse(JSON.stringify(DEFAULT_KEYS)); Store.set('keys', KEYMAP); fillKeys(); };
  }
  function fillOptions() {
    seg('o-presage', Store.get('presage', true) ? 1 : 0, v => Store.set('presage', v === '1'));
    seg('o-lvl2', Game.cfg.level, v => { Game.cfg.level = +v; Store.set('cfg', Game.cfg); });
    const adv = Store.get('adv', [0, 0]); for (let i = 0; i < 2; i++) seg('o-adv' + i, adv[i] || 0, v => { const A = Store.get('adv', [0, 0]).slice(); A[i] = +v; Store.set('adv', A); });
    fillKeys();
    seg('o-sound', Sound.on ? 1 : 0, v => Sound.setOn(v === '1'));
    seg('o-music', Music.on ? 1 : 0, v => Music.setOn(v === '1'));
    seg('o-quality', Game.quality, v => Game.setQuality(v, true));
    seg('o-fsauto', FS.auto ? 1 : 0, v => { FS.auto = v === '1'; }); fsLabel();
  }
  function fsLabel() { const b = $('#o-fs'); if (b) b.textContent = FS.label(); }
  FS.onChange(fsLabel);
  /* ---------- pausa y resultados ---------- */
  function pause(v) {
    if (Game.G.state === 'attract' || Game.G.state === 'matchEnd') return;
    paused = v; Game.G.paused = v; Music.duck(v);
    if (v) show('pause', false); else show(null, false);
  }
  Game.onMatchEnd = r => {
    const w = r.winner;
    if (r.camp) { campResults(r); vestAfter(); return; }
    const hubEv = !!Hub.ev && !r.vsBot && r.mode !== 'school';
    if (hubEv) { Hub.result(w === 0 || w === 1 ? w : -1, { score: r.mode === 'duel' ? r.wins.join(' – ') : r.score.join(' – ') }); Hub.release(); }
    $('#r-hub').hidden = !hubEv; $('#s-results').classList.toggle('hubres', hubEv);
    if (r.mode === 'school') { stack = []; Game.startAttract(); show('title', false); vestAfter(); return; }
    $('#r-title').textContent = w < 0 ? '¡Empate!' : `¡Gana ${r.names[w].split(' · ')[0]}!`;
    $('#r-title').style.color = w >= 0 ? PLAYER_COLORS[w].main : '';
    $('#r-score').innerHTML = `<span style="color:var(--j1)">${r.names[0]}</span> &nbsp;${r.wins[0]} – ${r.wins[1]}&nbsp; <span style="color:var(--j2)">${r.names[1]}</span>`;
    const s = r.stats, rowS = (l, k, f = v => Math.round(v)) => `<tr><td>${l}</td><td class="h0">${f(s[0][k])}</td><td class="h1">${f(s[1][k])}</td></tr>`;
    if (r.mode !== 'duel') $('#r-score').innerHTML = `<span style="color:var(--j1)">${r.names[0]}</span> &nbsp;${r.score[0]} – ${r.score[1]}&nbsp; <span style="color:var(--j2)">${r.names[1]}</span><div style="font-size:15px;color:var(--mute)">${MODES[r.mode].name}</div>`;
    const cEl = $('#r-copa'); cEl.hidden = !Copa.on; $('#r-copaNext').hidden = true; $('#r-rematch').textContent = 'Revancha';
    if (Copa.on) {
      if (w >= 0) Copa.pts[w]++; Copa.k++;
      const done = Copa.k >= 5 || Copa.pts[0] >= 3 || Copa.pts[1] >= 3;
      cEl.innerHTML = `Copa del Páramo: <span style="color:var(--j1)">J1 ${Copa.pts[0]}</span> – <span style="color:var(--j2)">${Copa.pts[1]} ${r.vsBot ? 'Máquina' : 'J2'}</span>` + (done ? '' : `<div style="font-size:15px;color:var(--mute)">Siguiente: ${MODES[Copa.list[Copa.k].mode].name} en ${ARENAS[Copa.list[Copa.k].arena].name}</div>`);
      if (done) { const cw = Copa.pts[0] === Copa.pts[1] ? -1 : Copa.pts[0] > Copa.pts[1] ? 0 : 1; $('#r-title').textContent = cw < 0 ? '¡Copa empatada!' : `¡${cw === 0 ? 'J1' : r.vsBot ? 'La máquina' : 'J2'} gana la Copa!`; $('#r-title').style.color = cw >= 0 ? PLAYER_COLORS[cw].main : ''; Copa.on = false; $('#r-rematch').textContent = 'Otra Copa'; setup.mode = 'copa'; }
      else { $('#r-copaNext').hidden = false; $('#r-rematch').hidden = true; }
    } else $('#r-rematch').hidden = false;
    $('#r-stats').innerHTML = rowS('Daño hecho', 'dmg') + rowS('Golpes', 'hits') + rowS('Fusiones', 'fusions') + rowS('Combinaciones', 'combos') + rowS('Esquives al rozar', 'grazes') + rowS('Grandes Sortilegios', 'gran') + rowS('Elementos bebidos', 'absorbs');
    hero(w >= 0 ? r.chars ? r.chars[w] : Game.G.chars[w] : Game.G.chars[0], w >= 0 ? (Copa.on ? '' : '¡Victoria!') : 'Empate', w);
    paused = false; show('results', false); startHero(); vestAfter();
  };
  function campResults(r) {
    const c = r.camp, L = Camp.LEVELS[c.level], rec = c.win ? Camp.record(Game.G) : null;
    $('#r-title').textContent = c.win ? '¡Nivel superado!' : 'Esta vez no se pudo'; $('#r-title').style.color = c.win ? '#ffe9a0' : '#ff9a8a';
    $('#r-score').innerHTML = `${c.level + 1}. ${L.name}` + (c.win ? `<div style="color:#ffd25a;font-size:30px">${'★'.repeat(c.stars)}<span style="opacity:.2">${'★'.repeat(3 - c.stars)}</span></div><div style="font-size:14px;color:var(--mute)">1 por pasar · 1 por gastar 1 vida o menos · 1 por hacerlo en menos de ${Math.floor(L.par / 60)}:${String(L.par % 60).padStart(2, '0')}${rec && rec.newBest ? ' · ¡nuevo récord!' : ''}</div>` : '');
    const s = r.stats, rowS = (l, k) => `<tr><td>${l}</td><td class="h0">${Math.round(s[0][k])}</td><td class="h1">${Math.round(s[1][k])}</td></tr>`;
    $('#r-stats').innerHTML = rowS('Daño hecho', 'dmg') + rowS('Fusiones', 'fusions') + rowS('Combinaciones', 'combos') + rowS('Elementos bebidos', 'absorbs');
    $('#r-copa').hidden = true; nextLevel = c.win && c.level + 1 < Camp.LEVELS.length ? c.level + 1 : -1;
    $('#r-copaNext').hidden = nextLevel < 0; $('#r-copaNext').textContent = 'Siguiente nivel'; $('#r-rematch').hidden = false; $('#r-rematch').textContent = c.win ? 'Repetir nivel' : 'Reintentar';
    if (c.win && c.level === 9) { $('#r-title').textContent = '¡Tragaluz cayó! Pero su sombra huyó al cielo: se abre el Mundo 2'; campWorld = 2; }
    if (c.win && c.level === Camp.LEVELS.length - 1) { $('#r-title').textContent = '¡Buziraco cayó: la luz y la sombra vuelven a su lugar!'; }
    hero(Game.G.chars[0], c.win ? '¡Victoria!' : '', -1, Game.G.chars[1]);
    paused = false; show('results', false); startHero();
  }
  // figura del ganador, viva, en la pantalla de resultados
  let heroInfo = null, heroRaf = 0;
  function hero(cid, tag, w, cid2) { const G = Game.G, sk = w >= 0 && G.mages[w] ? G.mages[w].skin || 0 : G.mages[0] ? G.mages[0].skin || 0 : 0; heroInfo = { cid, cid2, w, sk, sk2: G.mages[1] ? G.mages[1].skin || 0 : 0, t0: performance.now() / 1000 }; $('#r-heroTag').textContent = tag; }
  function startHero() {
    if (heroRaf) return;
    const loop = () => {
      if (current !== 'results' || !heroInfo) { heroRaf = 0; return; }
      const cv = $('#r-hero'), w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1), t = performance.now() / 1000;
      if (w && h) {
        if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
        const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (heroInfo.cid2) { x.save(); x.beginPath(); x.rect(0, 0, w / 2, h); x.clip(); x.translate(-w * 0.25, 0); ArtMage.showcase(x, heroInfo.cid, w, h, t, heroInfo.sk); x.restore(); x.save(); x.beginPath(); x.rect(w / 2, 0, w / 2, h); x.clip(); x.translate(w * 0.25, 0); ArtMage.showcase(x, heroInfo.cid2, w, h, t + 2, heroInfo.sk2); x.restore(); }
        else ArtMage.showcase(x, heroInfo.cid, w, h, t, heroInfo.sk);
        // lluvia de oro para quien gana
        if (heroInfo.w >= 0) { const e = t - heroInfo.t0; x.save(); x.globalCompositeOperation = 'lighter'; for (let k = 0; k < 40; k++) { const p = ((e * (0.18 + (k % 7) * 0.03)) + k * 0.173) % 1, px = w * ((k * 0.618) % 1) + Math.sin(e * 2 + k) * 10, py = p * h; x.globalAlpha = 0.85 * Math.sin(p * Math.PI); x.fillStyle = k % 3 ? '#ffd36a' : PLAYER_COLORS[heroInfo.w].main; x.save(); x.translate(px, py); x.rotate(e * 3 + k); x.fillRect(-2.5, -1.2, 5, 2.4); x.restore(); } x.restore(); }
      }
      heroRaf = requestAnimationFrame(loop);
    };
    heroRaf = requestAnimationFrame(loop);
  }
  /* ---------- acciones ---------- */
  const ACT = {
    play2: () => { setup.players = 2; setup.mode = 'duel'; show('setup'); },
    play1: () => { setup.players = 1; setup.mode = 'duel'; show('setup'); },
    practice: () => { Sound.init(); setup.players = 1; Game.start('free', 1, { chars: pick.slice(), arena: Game.cfg.arena === 'random' ? 'paramo' : Game.cfg.arena, level: 2 }); stack = []; show(null, false); },
    howto: () => show('howto'), options: () => show('options'), back, go,
    pause: () => pause(true), resume: () => pause(false),
    rematch: () => { Sound.init(); paused = false; Game.G.paused = false; if ($('#r-rematch').textContent === 'Otra Copa' && UI.current === 'results') { $('#r-rematch').textContent = 'Revancha'; go(); return; } Game.rematch(); show(null, false); },
    copaNext: () => { Sound.init(); $('#r-rematch').hidden = false; if (nextLevel >= 0 && Game.G.mode === 'camp') { const n = nextLevel; nextLevel = -1; $('#r-copaNext').textContent = 'Siguiente prueba'; startLevel(n); return; } copaEvent(); },
    camp: () => show('camp'), grim: () => show('grim'),
    school: () => { Sound.init(); setup.players = 1; paused = false; Game.G.paused = false; stack = []; Copa.on = false; Game.start('school', 1, { chars: [pick[0], pick[1]], arena: 'paramo', level: 2 }); show(null, false); },
    setupAgain: () => { stack = ['title']; show(Game.G.mode === 'camp' ? 'camp' : 'setup', false); },
    toTitle: () => { if (Hub.ev) Hub.leave(); hubPick(null); paused = false; Game.G.paused = false; Music.duck(false); stack = []; Game.startAttract(); show('title', false); },
    hubhome: () => Hub.exit(), hubback: () => Hub.exit(),
    fullscreen: () => FS.toggle(),
    vest: () => openVest(0),
  };
  document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b) return; Sound.init(); if (b.dataset.act !== 'back') Sound.play('select'); ACT[b.dataset.act] && ACT[b.dataset.act](); });
  addEventListener('pointerdown', () => Sound.init(), { once: true });
  addEventListener('keydown', e => {
    Sound.init();
    if (Input.hook) return;
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (current == null) { pause(true); e.preventDefault(); }
      else if (current === 'pause') pause(false);
      else if (current !== 'title' && current !== 'results') back();
      return;
    }
    if (current == null && Game.G.introT > 0 && !e.repeat) Game.skipIntro();
    if (current === 'setup') {
      if (e.code === 'KeyA') cycle(0, -1); else if (e.code === 'KeyD') cycle(0, 1); else if (e.code === 'KeyW') cycleSkin(0); else if (setup.players === 2 && e.code === 'ArrowUp') cycleSkin(1);
      else if (setup.players === 2 && e.code === 'ArrowLeft') cycle(1, -1); else if (setup.players === 2 && e.code === 'ArrowRight') cycle(1, 1);
    }
  });
  addEventListener('blur', () => { if (current == null && Game.G.state !== 'attract') pause(true); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && current == null && Game.G.state !== 'attract') pause(true); });
  // intensidad de la música
  setInterval(() => {
    const G = Game.G; if (G.attract || current === 'title' || !G.mages.length) { Music.setLevel(0); return; }
    if (G.paused) return;
    const [a, b] = G.mages, d = a && b ? hypot(a.x - b.x, a.y - b.y) : 999;
    let L = 1; if (d < 360 || G.spells.length > 6) L = 2;
    if (G.ring || (G.mode === 'duel' && (G.wins[0] === G.winsNeeded - 1 || G.wins[1] === G.winsNeeded - 1)) || G.mages.some(m => m.emb >= 100)) L = Math.max(L, 3);
    Music.setLevel(L);
  }, 250);
  getInsets = insets; isTouch = touch;
  $('#ver').textContent = 'v' + GAME_META.version;
  Game.startAttract(); show('title', false);
  return { show, insets, touch, hubPlay, syncSkins, vestBadge, vestAfter, pickOf: p => pick[p], get current() { return current; } };
})();
Hub.onPlay(ev => UI.hubPlay(ev));
Hub.ready();
