import os
os.chdir('/home/claude/tya/src')
def edit(p, pairs):
    s = open(p).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:70], s.count(old))
        s = s.replace(old, new)
    open(p, 'w').write(s)

edit('template.html', [
("""        <button class="btn big" data-act="options">Opciones</button>
      </div>""",
 """        <button class="btn big" data-act="options">Opciones</button>
        <div class="minirow">
          <button class="btn sol" data-act="daily">Reto del día</button>
          <button class="btn" data-act="records">Jugadores y logros</button>
        </div>
      </div>"""),
("""    <!-- PAUSA -->""",
 """    <!-- JUGADORES Y LOGROS -->
    <section class="screen veil" id="s-records" hidden>
      <div class="card records">
        <h2>Jugadores y logros</h2>
        <div class="players2">
          <div class="pcard" data-i="0">
            <label class="lbl" for="n1">Jugador 1</label>
            <input class="name" id="n1" maxlength="14" autocomplete="off" spellcheck="false">
            <p class="pstat" id="ps1"></p>
            <button class="btn cyc acc" data-acc="0"><span class="val">Sin accesorio</span><span class="arrow" aria-hidden="true">›</span></button>
          </div>
          <div class="vs"><span id="h2h">0 – 0</span><small>historial entre los dos</small></div>
          <div class="pcard" data-i="1">
            <label class="lbl" for="n2">Jugador 2</label>
            <input class="name" id="n2" maxlength="14" autocomplete="off" spellcheck="false">
            <p class="pstat" id="ps2"></p>
            <button class="btn cyc acc" data-acc="1"><span class="val">Sin accesorio</span><span class="arrow" aria-hidden="true">›</span></button>
          </div>
        </div>
        <div class="seg tabs" role="group" aria-label="Ver logros de" id="ach-tabs"><button data-t="0" aria-pressed="true">Logros de Jugador 1</button><button data-t="1" aria-pressed="false">Logros de Jugador 2</button></div>
        <p class="accnext" id="accnext"></p>
        <div class="achs" id="achs"></div>
        <div class="row"><button class="btn" data-act="back">Listo</button></div>
      </div>
    </section>

    <!-- RETO DEL DÍA -->
    <section class="screen veil" id="s-daily" hidden>
      <div class="card daily">
        <p class="date" id="d-date"></p>
        <h2>Reto del día</h2>
        <p class="dtitle" id="d-title"></p>
        <p id="d-desc"></p>
        <p class="dstate" id="d-state"></p>
        <div class="row">
          <button class="btn big sol" data-act="daily-go">¡A jugar!</button>
          <button class="btn" data-act="back">Atrás</button>
        </div>
      </div>
    </section>

    <!-- PAUSA -->"""),
("""        <table class="stats">""",
 """        <p class="newach" id="r-ach" hidden></p>
        <table class="stats">"""),
(""".opts { display: grid;""",
 """.minirow { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.btn.sol { background: var(--sol); }
.btn.sol:hover, .btn.sol:focus-visible { background: #ffe58a; }
.card.records { width: min(1040px, 100%); }
.players2 { display: grid; grid-template-columns: 1fr auto 1fr; gap: 14px; align-items: center; margin-bottom: 12px; }
.pcard { display: flex; flex-direction: column; gap: 6px; background: rgba(58,34,22,.05); border: 3px solid var(--ink); border-radius: 18px; padding: 10px 14px; min-width: 0; }
.pcard .lbl { font: 700 13px var(--body); letter-spacing: .05em; text-transform: uppercase; color: var(--ink-soft); }
.pcard .name { font: 700 22px var(--display); color: var(--ink); background: var(--cream); border: 3px solid var(--ink); border-radius: 12px; padding: 6px 10px; min-width: 0; }
.pcard .name:focus { outline: none; box-shadow: 0 0 0 4px var(--sol); }
.pcard .pstat { font-size: 14px; color: var(--ink-soft); }
.vs { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.vs span { font: 700 34px var(--display); }
.vs small { font-size: 12px; color: var(--ink-soft); }
.tabs { margin: 4px auto 6px; display: flex; width: fit-content; }
.accnext { text-align: center; font-size: 14px; color: var(--ink-soft); margin: 0 0 8px; }
.achs { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 8px; max-height: min(44vh, 420px); overflow-y: auto; padding: 4px; }
.ach { display: flex; gap: 8px; align-items: flex-start; border: 2px solid rgba(58,34,22,.25); border-radius: 12px; padding: 7px 9px; background: var(--cream); }
.ach .ic { flex: none; width: 26px; height: 26px; border-radius: 50%; border: 2.5px solid var(--ink); display: grid; place-items: center; font: 700 13px var(--display); background: #e6d6bf; }
.ach.on .ic { background: var(--sol); }
.ach b { display: block; font: 700 14px var(--body); }
.ach span { font-size: 12px; color: var(--ink-soft); line-height: 1.25; }
.ach:not(.on) { opacity: .62; }
.card.daily { width: min(620px, 100%); text-align: center; }
.daily .date { font: 700 13px var(--body); letter-spacing: .06em; text-transform: uppercase; color: var(--ink-soft); }
.daily .dtitle { font: 700 24px var(--display); margin: 4px 0 8px; color: var(--fresa-deep); }
.daily .dstate { margin-top: 10px; font-weight: 700; }
.newach { text-align: center; font-weight: 700; color: var(--fresa-deep); margin: 0 0 10px; }
@media (max-width: 760px) { .players2 { grid-template-columns: 1fr; } }
.opts { display: grid;"""),
])

edit('09-ui.js', [
("""  const SCREENS = { title: 's-title', modes: 's-modes', arena: 's-arena', pick: 's-pick', howto: 's-howto', options: 's-options', pause: 's-pause', results: 's-results' };""",
 """  const SCREENS = { title: 's-title', modes: 's-modes', arena: 's-arena', pick: 's-pick', howto: 's-howto', options: 's-options', pause: 's-pause', results: 's-results', records: 's-records', daily: 's-daily' };
  let achTab = 0;"""),
("""  function startGame(mode, arena) {
    stack = []; paused = false;
    show(null, false);
    Game.startMatch(mode, vsBot, arena, Fiesta.on);""",
 """  function startGame(mode, arena) {
    stack = []; paused = false;
    show(null, false);
    Game.G.daily = null; Fiesta.force(null);
    Game.startMatch(mode, vsBot, arena, Fiesta.on);"""),
("""  function toMenu() {
    paused = false; stack = [];""",
 """  function toMenu() {
    paused = false; stack = [];
    Game.G.daily = null; Fiesta.force(null);"""),
("""    'mode-escalada'() { startGame('escalada', 'torre'); }, // la torre es fija""",
 """    'mode-escalada'() { startGame('escalada', 'torre'); }, // la torre es fija
    records() { fillRecords(); show('records'); },
    daily() { fillDaily(); show('daily'); },
    'daily-go'() {
      const d = Progress.dailySpec();
      vsBot = true; stack = []; paused = false; show(null, false);
      Game.G.daily = { level: d.level, key: d.key }; Fiesta.force(d.mod);
      Game.startMatch(d.mode, true, d.arena, !!d.mod);
    },"""),
("""    changemode() { vsBot = lastRes ? lastRes.vsBot : vsBot; stack = []; show('modes', false); stack = ['title']; },""",
 """    changemode() { vsBot = lastRes ? lastRes.vsBot : vsBot; Game.G.daily = null; Fiesta.force(null); stack = []; show('modes', false); stack = ['title']; },"""),
("""  function showResults(res) {
    lastRes = res;""",
 """  function fillRecords() {
    const names = Progress.names;
    ['n1', 'n2'].forEach((id, i) => { const el = $('#' + id); if (document.activeElement !== el) el.value = names[i]; });
    [0, 1].forEach(i => {
      const st = Progress.stats(names[i]);
      $('#ps' + (i + 1)).textContent = `${Progress.count(names[i])}/40 logros · ${st.matches} partidas · ${st.wins} ganadas`;
      const a = Progress.ACCESSORIES.find(x => x.id === Progress.accOf(i));
      $(`[data-acc="${i}"] .val`).textContent = a.name;
    });
    const r = Progress.record();
    $('#h2h').textContent = `${r[0]} – ${r[1]}`;
    $$('#ach-tabs button').forEach(b => { const i = +b.dataset.t; b.setAttribute('aria-pressed', String(i === achTab)); b.textContent = `Logros de ${names[i]}`; });
    const name = names[achTab], have = Progress.count(name);
    const next = Progress.ACCESSORIES.find(a => a.need > have);
    $('#accnext').textContent = next ? `${name} lleva ${have} logros. Con ${next.need} se desbloquea: ${next.name}.` : `${name} desbloqueó todos los accesorios.`;
    $('#achs').innerHTML = Progress.ACH.map((a, k) => {
      const on = Progress.has(name, a.id);
      return `<div class="ach${on ? ' on' : ''}"><div class="ic">${on ? '★' : k + 1}</div><div><b>${a.name}</b><span>${a.desc}</span></div></div>`;
    }).join('');
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
    const na = Progress.newAch, parts = [];
    [0, 1].forEach(i => { if (na[i].length) parts.push(`${Progress.names[i]}: ${na[i].join(', ')}`); });
    const ra = $('#r-ach'); ra.hidden = !parts.length; ra.textContent = parts.length ? `Logros nuevos · ${parts.join(' · ')}` : '';
    if (Game.G.daily && res.winner === 0) { ra.hidden = false; ra.textContent = (parts.length ? ra.textContent + ' · ' : '') + '¡Reto del día superado!'; }"""),
# no navegar el menú mientras se escribe un nombre
("""  function onKey(code) {
    Sound.init();""",
 """  function onKey(code) {
    Sound.init();
    const ae = document.activeElement;
    if (ae && ae.tagName === 'INPUT') { if (code === 'Escape' || code === 'Enter' || code === 'NumpadEnter') ae.blur(); return; }"""),
("""    $$('.seg').forEach(seg => {""",
 """    // jugadores: nombres, accesorios y pestañas de logros
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
    $$('.seg:not(.tabs)').forEach(seg => {"""),
])

edit('07-game.js', [
("""    setTheme(id) {""",
 """    applyFlavors,
    setTheme(id) {"""),
])
print('ok')
