import os
os.chdir('/home/claude/tya/src')
def edit(p, pairs):
    s = open(p).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:70], s.count(old))
        s = s.replace(old, new)
    open(p, 'w').write(s)

edit('template.html', [
("""          <span class="tag">PRIMERO A 5 GOLES</span>
        </button>""",
 """          <span class="tag">PRIMERO A 5 GOLES</span>
        </button>
        <button class="mode" data-act="mode-escalada">
          <canvas class="art art-escalada" data-art="escalada" width="420" height="140"></canvas>
          <h3>Escalada tramposa</h3>
          <p>El agua sube por la torre del reloj. Trepa usando al otro de ancla y toca la campana primero.</p>
          <span class="tag" id="tag-escalada">PRIMERO A 3 RONDAS</span>
        </button>"""),
(""".art-gol { background:""",
 """.art-escalada { background: linear-gradient(#ead6b4, #ead6b4 72%, #50aae6 72%); }
.art-gol { background:"""),
(""".modes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));""",
 """.modes { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));"""),
])
edit('09-ui.js', [
("""    'mode-gol'() { startGame('gol', 'gimnasio'); }, // la cancha es fija""",
 """    'mode-gol'() { startGame('gol', 'gimnasio'); }, // la cancha es fija
    'mode-escalada'() { startGame('escalada', 'torre'); }, // la torre es fija"""),
("""    $('#tag-caneca').textContent = `PRIMERO A ${Game.G.winsNeeded} RONDAS`;""",
 """    $('#tag-caneca').textContent = `PRIMERO A ${Game.G.winsNeeded} RONDAS`;
    $('#tag-escalada').textContent = `PRIMERO A ${Game.G.winsNeeded} RONDAS`;"""),
("""    $('#r-score').textContent = res.mode === 'caneca' ? `${res.wins[0]} – ${res.wins[1]} en rondas`""",
 """    $('#r-score').textContent = res.mode === 'caneca' || res.mode === 'escalada' ? `${res.wins[0]} – ${res.wins[1]} en rondas`"""),
("""    if (res.mode === 'gol') rows.unshift(['Goles', 'goals']);""",
 """    if (res.mode === 'gol') rows.unshift(['Goles', 'goals']);
    if (res.mode === 'escalada') rows.unshift(['Campanazos', 'bells']);"""),
("""      } else if (c.dataset.art === 'gol') {""",
 """      } else if (c.dataset.art === 'escalada') {
        // vigas, campana arriba y uno colgando del otro
        [[40, 104, 120], [250, 74, 130], [120, 44, 110]].forEach(([x, y, w]) => { ArenaArt.rr(ctx, x, y, w, 10, 4); ArenaArt.fillStroke(ctx, '#d39a5c', 3); });
        ctx.beginPath(); ctx.moveTo(340, 22); ctx.quadraticCurveTo(336, 40, 324, 50); ctx.lineTo(372, 50); ctx.quadraticCurveTo(360, 40, 356, 22); ctx.closePath(); ArenaArt.fillStroke(ctx, '#ffd84d', 3);
        rope(170, 40, 200, 96, -10);
        blob(170, 30, 15, PALETTE.fresa, 1);
        blob(200, 104, 16, PALETTE.menta, -1);
        ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(30 + k * 70, 116 + (k % 2) * 6, 3, 0, TAU); ctx.fill(); }
      } else if (c.dataset.art === 'gol') {"""),
])
print('ok')
