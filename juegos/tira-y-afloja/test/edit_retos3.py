import os
os.chdir('/home/claude/tya/src')
def edit(p, pairs):
    s = open(p).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:70], s.count(old))
        s = s.replace(old, new)
    open(p, 'w').write(s)

edit('template.html', [
(""".minirow { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }""",
 """.minirow { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.retos { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; width: min(1040px, 100%); }
.reto { all: unset; box-sizing: border-box; cursor: pointer; background: var(--paper); border: 4px solid var(--ink); border-radius: 18px; box-shadow: 0 6px 0 var(--ink); padding: 10px 12px; display: grid; grid-template-columns: auto minmax(0, 1fr); column-gap: 10px; row-gap: 2px; align-items: center; min-width: 0; }
.reto .md { grid-row: span 2; width: 42px; height: 42px; border-radius: 50%; border: 3px solid var(--ink); display: grid; place-items: center; font: 700 18px var(--display); color: var(--ink); box-sizing: border-box; }
.reto .md.m0 { border: 3px dashed rgba(58,34,22,.4); color: var(--ink-soft); }
.reto .md.m1 { background: #d98a4e; } .reto .md.m2 { background: #b9c6d2; } .reto .md.m3 { background: #ffc93c; box-shadow: 0 0 0 4px rgba(255,201,60,.35); }
.reto b { font: 700 19px var(--display); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.reto small { font-size: 13px; color: var(--ink-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.reto:hover, .reto:focus-visible { transform: translateY(-3px); box-shadow: 0 9px 0 var(--ink), 0 0 0 5px var(--sol); }
@media (max-width: 900px) { .retos { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 620px) { .retos { grid-template-columns: repeat(2, minmax(0, 1fr)); } }"""),
("""          <button class="btn sol" data-act="daily">Reto del día</button>""",
 """          <button class="btn sol" data-act="daily">Reto del día</button>
          <button class="btn menta" data-act="retos">Retos de técnica</button>"""),
("""    <!-- RETO DEL DÍA -->""",
 """    <!-- RETOS DE TÉCNICA -->
    <section class="screen veil" id="s-retos" hidden>
      <p class="title-chip">Retos de técnica · juega Fresa (jugador 1)</p>
      <div class="retos" id="retos"></div>
      <p class="fiesta-note" id="retos-note"></p>
      <div class="row"><button class="btn" data-act="back">Atrás</button></div>
    </section>

    <!-- RETO DEL DÍA -->"""),
("""        <button class="btn big" data-act="restart">Reiniciar partida</button>""",
 """        <button class="btn big" data-act="restart" id="btn-restart">Reiniciar partida</button>
        <button class="btn big" data-act="retos-list" id="btn-retos-list" hidden>Elegir otro reto</button>"""),
("""          <button class="btn big menta" data-act="tut-solo">Tutorial solo</button>""",
 """          <button class="btn big menta" data-act="tut-solo">Tutorial solo</button>
          <button class="btn big sol" data-act="retos">Retos de técnica</button>"""),
])
edit('09-ui.js', [
("""  const SCREENS = { levels: 's-levels',""", """  const SCREENS = { retos: 's-retos', levels: 's-levels',"""),
("""    paused = true; stack = [];
    Sound.play('pause');""",
 """    paused = true; stack = [];
    $('#btn-retos-list').hidden = !G.reto;
    $('#btn-restart').textContent = G.reto ? 'Repetir reto' : 'Reiniciar partida';
    Sound.play('pause');"""),
("""    restart() { paused = false; stack = []; show(null, false); if (Game.G.tutorial) Tutorial.start(Game.G.tutorial.solo); else Game.restart(); },
    'tut-pair'() { stack = []; paused = false; show(null, false); Tutorial.start(false); },
    'tut-solo'() { stack = []; paused = false; show(null, false); Tutorial.start(true); },""",
 """    restart() { paused = false; stack = []; show(null, false); if (Game.G.tutorial) Tutorial.start(Game.G.tutorial.solo); else if (Game.G.reto) Retos.start(Game.G.reto.idx); else Game.restart(); },
    'tut-pair'() { vsBot = false; stack = []; paused = false; show(null, false); Tutorial.start(false); },
    'tut-solo'() { vsBot = true; stack = []; paused = false; show(null, false); Tutorial.start(true); },
    retos() { fillRetos(); show('retos'); },
    'retos-list'() { const i = Game.G.reto ? Game.G.reto.idx : 0; backToRetos(i); },"""),
("""  function fillDaily() {""",
 """  function fillRetos(focusIdx = -1) {
    const box = $('#retos'); box.innerHTML = '';
    const d = Retos.data;
    Retos.LIST.forEach((def, i) => {
      const b = document.createElement('button');
      b.className = 'reto';
      const m = d.medal[def.id] || 0, best = d.best[def.id];
      const mname = ['', 'bronce', 'plata', 'oro'][m];
      b.innerHTML = `<span class="md m${m}">${i + 1}</span><b>${def.title}</b><small>${best !== undefined ? `${String(best.toFixed(1)).replace('.', ',')} s · ${mname}` : `${def.skill} · oro en ${def.gold} s`}</small>`;
      b.setAttribute('aria-label', `Reto ${i + 1}: ${def.title}. ${m ? 'Medalla de ' + mname : 'Sin medalla'}`);
      b.addEventListener('click', () => { Sound.init(); Sound.play('select'); startReto(i); });
      b.addEventListener('pointerenter', () => { if (document.activeElement !== b) { b.focus({ preventScroll: true }); Sound.play('hover'); } });
      box.append(b);
    });
    const golds = Retos.LIST.filter(x => d.medal[x.id] === 3).length, done = Retos.LIST.filter(x => d.medal[x.id]).length;
    $('#retos-note').textContent = `Cada reto enseña una jugada. Medalla según el tiempo: oro, plata o bronce. ${done}/${Retos.count} superados · ${golds} de oro.`;
    if (focusIdx >= 0) setTimeout(() => { const el = box.children[Math.min(focusIdx, box.children.length - 1)]; if (el) el.focus({ preventScroll: true }); }, 60);
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
  function fillDaily() {"""),
("""    Tutorial.onEnd = () => toMenu();""",
 """    Tutorial.onEnd = () => toMenu();
    Retos.onExit = i => backToRetos(i);"""),
])
print('ok')
