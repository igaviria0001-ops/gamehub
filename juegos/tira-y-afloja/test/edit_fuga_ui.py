import os
os.chdir('/home/claude/tya/src')
def edit(p, pairs):
    s = open(p).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:70], s.count(old))
        s = s.replace(old, new)
    open(p, 'w').write(s)

edit('template.html', [
("""          <span class="tag" id="tag-escalada">PRIMERO A 3 RONDAS</span>
        </button>""",
 """          <span class="tag" id="tag-escalada">PRIMERO A 3 RONDAS</span>
        </button>
        <button class="mode coop" data-act="mode-fuga">
          <canvas class="art art-fuga" data-art="fuga" width="420" height="140"></canvas>
          <h3>Fuga del colegio</h3>
          <p>Cooperativo: escapen juntos por la torre. Uno pisa el botón de la reja y el otro pasa. 12 niveles con estrellas.</p>
          <span class="tag">COOPERATIVO · 12 NIVELES</span>
        </button>"""),
(""".art-escalada {""",
 """.art-fuga { background: linear-gradient(#cfe3f5, #cfe3f5 72%, #50aae6 72%); }
.mode.coop .tag { background: var(--menta-deep); }
.levels { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; width: min(900px, 100%); }
.lvl { all: unset; box-sizing: border-box; cursor: pointer; background: var(--paper); border: 4px solid var(--ink); border-radius: 18px; box-shadow: 0 6px 0 var(--ink); padding: 12px 6px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.lvl b { font: 700 30px var(--display); }
.lvl span { font-size: 18px; letter-spacing: 2px; color: #d9a300; }
.lvl small { font-size: 12px; color: var(--ink-soft); }
.lvl:hover, .lvl:focus-visible { transform: translateY(-3px); box-shadow: 0 9px 0 var(--ink), 0 0 0 5px var(--sol); }
.lvl[disabled] { opacity: .45; cursor: default; box-shadow: 0 6px 0 var(--ink); transform: none; }
@media (max-width: 760px) { .levels { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.art-escalada {"""),
("""    <!-- RETO DEL DÍA -->""",
 """    <!-- FUGA: NIVELES -->
    <section class="screen veil" id="s-levels" hidden>
      <p class="title-chip">Fuga del colegio · elijan nivel</p>
      <div class="levels" id="levels"></div>
      <p class="fiesta-note" id="levels-note">Los dos tienen que llegar arriba. ★★★ si escapan antes del tiempo meta.</p>
      <div class="row"><button class="btn" data-act="back">Atrás</button></div>
    </section>

    <!-- RETO DEL DÍA -->"""),
("""          <button class="btn big fresa" data-act="rematch">Revancha</button>""",
 """          <button class="btn big menta" data-act="nextlevel" id="btn-next" hidden>Siguiente nivel</button>
          <button class="btn big fresa" data-act="rematch" id="btn-rematch">Revancha</button>"""),
])

edit('09-ui.js', [
("""  const SCREENS = { title: 's-title',""",
 """  const SCREENS = { levels: 's-levels', title: 's-title',"""),
("""    records() { fillRecords(); show('records'); },""",
 """    records() { fillRecords(); show('records'); },
    'mode-fuga'() { fillLevels(); show('levels'); },
    nextlevel() { const n = (Game.G.fugaLevel || 1) + 1; if (n <= Modes.FUGA_LEVELS) { Game.G.fugaLevel = n; startGame('fuga', 'torre'); } },"""),
("""  function fillDaily() {""",
 """  function fillLevels() {
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
  function fillDaily() {"""),
("""  function showResults(res) {
    lastRes = res;""",
 """  function showResults(res) {
    lastRes = res;
    const fuga = res.mode === 'fuga';
    $('#btn-next').hidden = !fuga || !((Game.G.fugaLevel || 1) < Modes.FUGA_LEVELS);
    $('#btn-rematch').textContent = fuga ? 'Repetir nivel' : 'Revancha';
    $('.card.results .stats').hidden = fuga;"""),
("""    if (res.winner === null) { t.textContent = '¡Empate!'; t.style.color = 'var(--sol)'; }""",
 """    if (fuga) {
      const r = Modes.fugaResult || {};
      t.textContent = `¡Nivel ${r.level || ''} superado!`; t.style.color = 'var(--menta-deep)';
    } else if (res.winner === null) { t.textContent = '¡Empate!'; t.style.color = 'var(--sol)'; }"""),
("""    $('#r-score').textContent = res.mode === 'caneca' || res.mode === 'escalada' ? `${res.wins[0]} – ${res.wins[1]} en rondas`""",
 """    $('#r-score').textContent = fuga ? (r => `${'★'.repeat(r.stars || 0)}${'☆'.repeat(3 - (r.stars || 0))}  ·  ${(r.time || 0).toFixed(1).replace('.', ',')} s (meta ${r.par} s)${r.newBest ? ' · ¡récord!' : ''}`)(Modes.fugaResult || {})
      : res.mode === 'caneca' || res.mode === 'escalada' ? `${res.wins[0]} – ${res.wins[1]} en rondas`"""),
("""      } else if (c.dataset.art === 'escalada') {""",
 """      } else if (c.dataset.art === 'fuga') {
        // reja abierta, uno pisando el botón y el otro pasando
        ArenaArt.rr(ctx, 20, 100, 150, 10, 4); ArenaArt.fillStroke(ctx, '#d39a5c', 3);
        ArenaArt.rr(ctx, 70, 90, 50, 10, 4); ArenaArt.fillStroke(ctx, '#3fbf6a', 3);
        ArenaArt.rr(ctx, 10, 52, 120, 12, 4); ArenaArt.fillStroke(ctx, '#7d8796', 3);
        ArenaArt.rr(ctx, 230, 30, 160, 10, 4); ArenaArt.fillStroke(ctx, '#d39a5c', 3);
        rope(95, 78, 250, 40, 16);
        blob(95, 76, 15, PALETTE.fresa, 1);
        blob(250, 22, 15, PALETTE.menta, -1);
        outlinedText(ctx, '¡JUNTOS!', 330, 80, 22, '#ffd84d', PALETTE.ink);
      } else if (c.dataset.art === 'escalada') {"""),
])
print('ok')
