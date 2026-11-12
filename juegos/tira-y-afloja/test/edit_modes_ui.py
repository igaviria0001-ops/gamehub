import os
os.chdir('/home/claude/tya/src')
def edit(p, pairs):
    s = open(p).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:70], s.count(old))
        s = s.replace(old, new)
    open(p, 'w').write(s)

edit('template.html', [
("""          <span class="tag">75 SEGUNDOS</span>
        </button>""",
 """          <span class="tag">75 SEGUNDOS</span>
        </button>
        <button class="mode" data-act="mode-rey">
          <canvas class="art art-rey" data-art="rey" width="420" height="140"></canvas>
          <h3>Rey del borrador</h3>
          <p>Un borrador gigante recorre el pupitre. Quédate tú solo encima para sumar puntos; sácalo si se sube.</p>
          <span class="tag">PRIMERO A 20</span>
        </button>
        <button class="mode" data-act="mode-gol">
          <canvas class="art art-gol" data-art="gol" width="420" height="140"></canvas>
          <h3>Gol de canica</h3>
          <p>En la cancha del gimnasio: patea, cabecea o barre la canica con el hilo hasta el arco del otro.</p>
          <span class="tag">PRIMERO A 5 GOLES</span>
        </button>"""),
(""".art-chicles { background: linear-gradient(#2f6150, #244c3f); }""",
 """.art-chicles { background: linear-gradient(#2f6150, #244c3f); }
.art-rey { background: linear-gradient(#fbe8c4, #f1d5a6 72%, #b97a45 72%); }
.art-gol { background: linear-gradient(#e9eef6, #dfe5ef 70%, #e2ac6c 70%); }"""),
(""".modes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(14px, 2vw, 26px); width: min(940px, 100%); }""",
 """.modes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(12px, 1.6vw, 20px); width: min(980px, 100%); }
.modes .mode { padding: clamp(12px, 1.4vw, 18px); gap: 6px; }
.modes .mode .art { height: clamp(64px, 9.5vh, 112px); }
.modes .mode h3 { font-size: clamp(21px, 2.2vw, 28px); }
.modes .mode p { font-size: clamp(13px, 1.2vw, 16px); }"""),
])

edit('09-ui.js', [
("""    'mode-chicles'() { chooseMode('chicles'); },""",
 """    'mode-chicles'() { chooseMode('chicles'); },
    'mode-rey'() { chooseMode('rey'); },
    'mode-gol'() { startGame('gol', 'gimnasio'); }, // la cancha es fija"""),
("""    const rows = [
      ['Embestidas', 'rams'], ['Tirachinas', 'slings'], ['Latigazos', 'whips'],
      [res.mode === 'caneca' ? 'Chicles dorados' : 'Chicles recogidos', 'pellets'], ['Rivales a la caneca', 'dunks'],
    ];""",
 """    const rows = [
      ['Embestidas', 'rams'], ['Tirachinas', 'slings'], ['Latigazos', 'whips'],
      [res.mode === 'chicles' ? 'Chicles recogidos' : 'Chicles dorados', 'pellets'], ['Rivales a la caneca', 'dunks'],
    ];
    if (res.mode === 'rey') rows.unshift(['Segundos de rey', 'crown']);
    if (res.mode === 'gol') rows.unshift(['Goles', 'goals']);"""),
("""    $('#r-score').textContent = res.mode === 'caneca'
      ? `${res.wins[0]} – ${res.wins[1]} en rondas`
      : `${res.points[0]} – ${res.points[1]} en chicles`;""",
 """    const pts = res.points.map(Math.floor);
    $('#r-score').textContent = res.mode === 'caneca' ? `${res.wins[0]} – ${res.wins[1]} en rondas`
      : res.mode === 'rey' ? `${pts[0]} – ${pts[1]} en puntos de rey`
        : res.mode === 'gol' ? `${pts[0]} – ${pts[1]} en goles`
          : `${pts[0]} – ${pts[1]} en chicles`;"""),
("""      const a = res.stats[0][k], b = res.stats[1][k];""",
 """      const a = Math.floor(res.stats[0][k] || 0), b = Math.floor(res.stats[1][k] || 0);"""),
# arte de los modos nuevos
("""      } else {
        const cols = ['#ffd84d', '#9b6bdf', '#4aa3ff', '#ff9a3c', '#b7dc3c'];""",
 """      } else if (c.dataset.art === 'rey') {
        // el borrador con la corona y los dos peleándose encima
        ArenaArt.rr(ctx, 120, 78, 190, 26, 9); ArenaArt.fillStroke(ctx, '#f7a9bd', 3);
        ctx.save(); ArenaArt.rr(ctx, 120, 78, 190, 26, 9); ctx.clip(); ctx.fillStyle = '#7fb4ee'; ctx.fillRect(225, 78, 90, 26); ctx.restore();
        ArenaArt.rr(ctx, 120, 78, 190, 26, 9); ctx.lineWidth = 3; ctx.strokeStyle = PALETTE.ink; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(195, 40); ctx.lineTo(195, 22); ctx.lineTo(205, 32); ctx.lineTo(215, 16); ctx.lineTo(225, 32); ctx.lineTo(235, 22); ctx.lineTo(235, 40); ctx.closePath();
        ArenaArt.fillStroke(ctx, '#ffd84d', 3);
        rope(185, 62, 255, 66, 6);
        blob(185, 60, 18, PALETTE.fresa, 1);
        blob(258, 63, 16, PALETTE.menta, -1);
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
        const cols = ['#ffd84d', '#9b6bdf', '#4aa3ff', '#ff9a3c', '#b7dc3c'];"""),
])
print('ok')
