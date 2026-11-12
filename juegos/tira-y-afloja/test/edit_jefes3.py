import os
os.chdir('/home/claude/tya/src')
def edit(p, pairs):
    s = open(p).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:70], s.count(old))
        s = s.replace(old, new)
    open(p, 'w').write(s)

edit('template.html', [
(""".modes { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr)); gap: clamp(12px, 1.6vw, 20px); width: min(980px, 100%); }""",
 """.modes { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(230px, 100%), 1fr)); gap: clamp(10px, 1.4vw, 18px); width: min(1180px, 100%); }
.jefes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; width: min(1080px, 100%); }
.jefes .mode .art { height: clamp(90px, 16vh, 150px); }
.jefes .mode .rec { font-size: 14px; color: var(--ink-soft); margin: 0; }
.jefes .mode[disabled] { opacity: .5; cursor: default; box-shadow: 0 8px 0 var(--ink); transform: none; }
@media (max-width: 760px) { .jefes { grid-template-columns: 1fr; } }"""),
("""          <span class="tag">COOPERATIVO · 12 NIVELES</span>
        </button>""",
 """          <span class="tag">COOPERATIVO · 12 NIVELES</span>
        </button>
        <button class="mode coop" data-act="mode-jefe">
          <canvas class="art art-jefe" data-art="jefe" width="420" height="140"></canvas>
          <h3>Jefes</h3>
          <p>Cooperativo: los dos contra la Aspiradora, el Sacapuntas eléctrico y el Aseador. Tres corazones compartidos.</p>
          <span class="tag">COOPERATIVO · 3 JEFES</span>
        </button>"""),
("""    <!-- RETOS DE TÉCNICA -->""",
 """    <!-- JEFES -->
    <section class="screen veil" id="s-jefes" hidden>
      <p class="title-chip">Jefes · peleen juntos</p>
      <div class="jefes" id="jefes"></div>
      <p class="fiesta-note">Comparten 3 corazones: caer a la caneca o ser tragados cuesta uno. Al jefe solo le duele cuando muestra «¡AHORA!».</p>
      <div class="row"><button class="btn" data-act="back">Atrás</button></div>
    </section>

    <!-- RETOS DE TÉCNICA -->"""),
(""".art-fuga {""", """.art-jefe { background: linear-gradient(#f6ead2, #f6ead2 70%, #c98a4e 70%); }
.art-fuga {"""),
])

edit('09-ui.js', [
("""  const SCREENS = { retos: 's-retos',""", """  const SCREENS = { jefes: 's-jefes', retos: 's-retos',"""),
("""    'mode-fuga'() { fillLevels(); show('levels'); },""",
 """    'mode-fuga'() { fillLevels(); show('levels'); },
    'mode-jefe'() { fillJefes(); show('jefes'); },"""),
("""    nextlevel() { const n""",
 """    nextlevel() {
      if (Game.G.mode === 'jefe') { const L = Jefes.LIST, i = L.findIndex(d => d.id === Game.G.jefeId); if (L[i + 1]) { Game.G.jefeId = L[i + 1].id; startGame('jefe', L[i + 1].arena); } return; }
      const n"""),
("""  function startGame(mode, arena) {
    stack = []; paused = false;
    show(null, false);
    Game.G.daily = null; Fiesta.force(null);
    Game.startMatch(mode, vsBot, arena, Fiesta.on);""",
 """  function startGame(mode, arena) {
    stack = []; paused = false;
    show(null, false);
    Game.G.daily = null; Fiesta.force(null);
    Game.startMatch(mode, vsBot, arena, mode === 'jefe' ? false : Fiesta.on);"""),
("""  function fillRetos(focusIdx = -1) {""",
 """  function fillJefes() {
    const box = $('#jefes'); box.innerHTML = '';
    Jefes.LIST.forEach((def, i) => {
      const b = document.createElement('button');
      b.className = 'mode coop';
      const open = Jefes.unlocked(def.id), best = Jefes.data.best[def.id], wins = Jefes.data.wins[def.id] || 0;
      b.disabled = !open;
      b.innerHTML = `<canvas class="art art-jefe" data-art="jefe-${def.id}" width="420" height="160"></canvas><h3>${i + 1}. ${def.name}</h3><p>${def.desc}</p><p class="rec">${!open ? 'Derroten al jefe anterior para pelear con este.' : best !== undefined ? `Récord: ${String(best).replace('.', ',')} s · derrotado ${wins} ${wins === 1 ? 'vez' : 'veces'}` : 'Sin derrotar todavía'}</p>`;
      b.addEventListener('click', () => { Sound.init(); Sound.play('select'); Game.G.jefeId = def.id; startGame('jefe', def.arena); });
      b.addEventListener('pointerenter', () => { if (!b.disabled && document.activeElement !== b) { b.focus({ preventScroll: true }); Sound.play('hover'); } });
      box.append(b);
    });
    drawModeArt();
  }
  function fillRetos(focusIdx = -1) {"""),
("""    const fuga = res.mode === 'fuga';
    $('#btn-next').hidden = !fuga || !((Game.G.fugaLevel || 1) < Modes.FUGA_LEVELS);
    $('#btn-rematch').textContent = fuga ? 'Repetir nivel' : 'Revancha';
    $('.card.results .stats').hidden = fuga;""",
 """    const fuga = res.mode === 'fuga', jefe = res.mode === 'jefe', jr = jefe ? (Jefes.result || {}) : null;
    const jIdx = jefe ? Jefes.LIST.findIndex(d => d.id === Game.G.jefeId) : -1;
    $('#btn-next').hidden = fuga ? !((Game.G.fugaLevel || 1) < Modes.FUGA_LEVELS) : jefe ? !(jr.win && Jefes.LIST[jIdx + 1]) : true;
    $('#btn-next').textContent = jefe ? 'Siguiente jefe' : 'Siguiente nivel';
    $('#btn-rematch').textContent = fuga ? 'Repetir nivel' : jefe ? (jr.win ? 'Pelear otra vez' : 'Reintentar') : 'Revancha';
    $('.card.results .stats').hidden = fuga || jefe;"""),
("""    if (fuga) {
      const r = Modes.fugaResult || {};
      t.textContent = `¡Nivel ${r.level || ''} superado!`; t.style.color = 'var(--menta-deep)';""",
 """    if (jefe) {
      const def = Jefes.BY[jr.id] || Jefes.LIST[0];
      t.textContent = jr.win ? `¡Derrotaron ${def.name.replace(/^(La|El) /, m => m === 'La ' ? 'a la ' : 'al ')}!` : `¡Ganó ${def.name.toLowerCase().replace(/^./, c => c)}!`;
      t.style.color = jr.win ? 'var(--menta-deep)' : 'var(--fresa)';
    } else if (fuga) {
      const r = Modes.fugaResult || {};
      t.textContent = `¡Nivel ${r.level || ''} superado!`; t.style.color = 'var(--menta-deep)';"""),
("""    $('#r-score').textContent = fuga ?""",
 """    $('#r-score').textContent = jefe ? (jr.win ? `${(jr.t || 0).toFixed(1).replace('.', ',')} s · ${'♥'.repeat(jr.hearts || 0)}${'♡'.repeat(3 - (jr.hearts || 0))}${jr.newBest ? ' · ¡récord!' : ''}` : `Le hicieron ${jr.hits || 0} ${jr.hits === 1 ? 'golpe' : 'golpes'}. ¡Otra vez!`)
      : fuga ?"""),
])
print('ok')
