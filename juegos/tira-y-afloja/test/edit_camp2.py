import os
os.chdir('/home/claude/tya/src')
def edit(p, pairs):
    s = open(p).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:70], s.count(old))
        s = s.replace(old, new)
    open(p, 'w').write(s)

edit('template.html', [
(""".jefes { display: grid;""",
 """.camp { width: min(1180px, 100%); display: flex; flex-direction: column; gap: 10px; }
.camp-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; color: var(--cream); font: 700 20px var(--display); text-shadow: 0 2px 0 rgba(0,0,0,.35); flex-wrap: wrap; }
.zrow { display: grid; grid-template-columns: minmax(150px, 210px) repeat(6, minmax(0, 1fr)); gap: 8px; align-items: stretch; }
.zname { background: rgba(40,20,10,.55); border-radius: 14px; padding: 8px 12px; color: var(--cream); display: flex; flex-direction: column; justify-content: center; }
.zname b { font: 700 19px var(--display); }
.zname small { font-size: 12px; opacity: .85; }
.stg { all: unset; box-sizing: border-box; cursor: pointer; background: var(--paper); border: 4px solid var(--ink); border-radius: 14px; box-shadow: 0 5px 0 var(--ink); padding: 6px 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; min-height: 66px; }
.stg b { font: 700 18px var(--display); }
.stg span { font-size: 15px; letter-spacing: 1px; color: #d9a300; }
.stg small { font-size: 11px; color: var(--ink-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.stg.boss { background: #ffe1d8; border-color: #8a2a1a; box-shadow: 0 5px 0 #8a2a1a; }
.stg.boss b { color: #8a2a1a; }
.stg:hover, .stg:focus-visible { transform: translateY(-3px); box-shadow: 0 8px 0 var(--ink), 0 0 0 4px var(--sol); }
.stg[disabled] { opacity: .45; cursor: default; transform: none; box-shadow: 0 5px 0 var(--ink); }
@media (max-width: 760px) { .zrow { grid-template-columns: repeat(6, minmax(0, 1fr)); } .zname { grid-column: 1 / -1; } }
.jefes { display: grid;"""),
("""        <button class="mode coop" data-act="mode-jefe">""",
 """        <button class="mode coop" data-act="mode-campana">
          <canvas class="art art-jefe" data-art="campana" width="420" height="140"></canvas>
          <h3>Campaña</h3>
          <p>Cooperativo: 6 zonas del colegio con salas de acertijos y un jefe al final de cada una. Envolturas escondidas.</p>
          <span class="tag" id="tag-campana">COOPERATIVO · 36 ETAPAS</span>
        </button>
        <button class="mode coop" data-act="mode-jefe">"""),
("""    <!-- JEFES -->""",
 """    <!-- CAMPAÑA -->
    <section class="screen veil" id="s-campana" hidden>
      <p class="title-chip">Campaña · escapen del colegio</p>
      <div class="camp">
        <div class="camp-head"><span id="camp-stars">★ 0</span><span id="camp-note">Cada zona termina con un jefe: hay que vencerlo para seguir.</span></div>
        <div id="camp-rows" class="camp"></div>
      </div>
      <div class="row"><button class="btn" data-act="back">Atrás</button></div>
    </section>

    <!-- JEFES -->"""),
])

edit('09-ui.js', [
("""  const SCREENS = { jefes: 's-jefes',""", """  const SCREENS = { campana: 's-campana', jefes: 's-jefes',"""),
("""    'mode-jefe'() { fillJefes(); show('jefes'); },""",
 """    'mode-jefe'() { fillJefes(); show('jefes'); },
    'mode-campana'() { fillCampaign(); show('campana'); },"""),
("""    nextlevel() {
      if (Game.G.mode === 'jefe') {""",
 """    nextlevel() {
      if (Game.G.mode === 'campana' || (Game.G.mode === 'jefe' && Game.G.campBoss != null)) { const st = Campaign.stages(), i = st.findIndex(s => s.id === Game.G.campStage); if (st[i + 1] && Campaign.unlocked(st[i + 1].id)) playStage(st[i + 1]); return; }
      if (Game.G.mode === 'jefe') {"""),
("""    changemode() { vsBot""",
 """    changemode() { if (Game.G.mode === 'campana' || Game.G.campBoss != null) { stack = ['title', 'modes']; fillCampaign(); show('campana', false); return; } vsBot"""),
("""    Game.startMatch(mode, vsBot, arena, mode === 'jefe' ? false : Fiesta.on);""",
 """    if (!keepCamp) { Game.G.campBoss = null; }
    keepCamp = false;
    Game.startMatch(mode, vsBot, arena, mode === 'jefe' ? false : Fiesta.on);"""),
("""  function fillJefes() {""",
 """  let keepCamp = false;
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
      const row = document.createElement('div'); row.className = 'zrow';
      const zs = st.filter(s => s.zone === zi), zStars = zs.reduce((a, s) => a + (d.stars[s.id] || 0), 0);
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
  function fillJefes() {"""),
# resultados de campaña
("""    const fuga = res.mode === 'fuga', jefe = res.mode === 'jefe', jr = jefe ? (Jefes.result || {}) : null;""",
 """    const fuga = res.mode === 'fuga', jefe = res.mode === 'jefe', jr = jefe ? (Jefes.result || {}) : null;
    const camp = res.mode === 'campana', cr = camp ? (Campaign.result || {}) : null, campBoss = jefe && Game.G.campBoss != null;
    let bossCamp = null;
    if (campBoss && jr && !jr.campDone) { jr.campDone = true; jr.camp = Campaign.bossResult(Game.G.campBoss, jr.win, jr.hearts); }
    if (campBoss && jr) bossCamp = jr.camp;"""),
("""    $('#btn-next').hidden = fuga ? !((Game.G.fugaLevel || 1) < Modes.FUGA_LEVELS) : jefe ? !(jr.win && Jefes.LIST[jIdx + 1]) : true;
    $('#btn-next').textContent = jefe ? 'Siguiente jefe' : 'Siguiente nivel';""",
 """    const stNext = (camp || campBoss) ? (() => { const st = Campaign.stages(), i = st.findIndex(s => s.id === Game.G.campStage); return st[i + 1] && Campaign.unlocked(st[i + 1].id) ? st[i + 1] : null; })() : null;
    $('#btn-next').hidden = camp || campBoss ? !stNext : fuga ? !((Game.G.fugaLevel || 1) < Modes.FUGA_LEVELS) : jefe ? !(jr.win && Jefes.LIST[jIdx + 1]) : true;
    $('#btn-next').textContent = stNext ? (stNext.type === 'boss' ? '¡Al jefe!' : `Sala ${stNext.id}`) : jefe ? 'Siguiente jefe' : 'Siguiente nivel';
    $('#s-results [data-act="changemode"]').textContent = camp || campBoss ? 'Mapa' : 'Cambiar modo';"""),
("""    $('.card.results .stats').hidden = fuga || jefe;""",
 """    $('.card.results .stats').hidden = fuga || jefe || camp;
    if (camp) $('#btn-rematch').textContent = 'Repetir sala';"""),
("""    if (jefe) {
      const def = Jefes.BY[jr.id] || Jefes.LIST[0];""",
 """    if (camp) {
      t.textContent = `¡Sala ${cr.id || ''} superada!`; t.style.color = 'var(--menta-deep)';
    } else if (jefe) {
      const def = Jefes.BY[jr.id] || Jefes.LIST[0];"""),
("""    $('#r-score').textContent = jefe ?""",
 """    $('#r-score').textContent = camp ? `${'★'.repeat(cr.stars || 0)}${'☆'.repeat(3 - (cr.stars || 0))}  ·  ${(cr.t || 0).toFixed(1).replace('.', ',')} s (meta ${cr.par} s)  ·  envolturas ${cr.wrTotal || 0}/3${cr.newBest ? ' · ¡récord!' : ''}`
      : jefe ?"""),
("""    if (Game.G.daily && res.winner === 0) {""",
 """    if (bossCamp && bossCamp.reward) { ra.hidden = false; ra.textContent = (ra.textContent && !ra.hidden ? ra.textContent + ' · ' : '') + `¡Premio desbloqueado: ${bossCamp.reward.name}! Pónganselo en Opciones.`; }
    if (Game.G.daily && res.winner === 0) {"""),
])
print('ok')
