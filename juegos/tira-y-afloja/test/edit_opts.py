import os
os.chdir('/home/claude/tya/src')
def edit(p, pairs):
    s = open(p).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:70], s.count(old))
        s = s.replace(old, new)
    open(p, 'w').write(s)

edit('template.html', [
("""          <div class="opt"><label id="l-sfx">Efectos de sonido</label>""",
 """          <div class="opt"><label id="l-style">Estilo de música</label><button class="btn cyc" id="o-style" data-cyc="style" aria-labelledby="l-style"><span class="arrow" aria-hidden="true">‹</span><span class="val">Según la arena</span><span class="arrow" aria-hidden="true">›</span></button></div>
          <div class="opt"><label id="l-sfx">Efectos de sonido</label>"""),
("""          <div class="opt"><label>Pantalla completa</label>""",
 """          <div class="opt"><label id="l-theme">Ambiente</label><div class="seg" role="group" aria-labelledby="l-theme" data-opt="theme"><button data-v="dia">Día</button><button data-v="tarde">Tarde</button><button data-v="noche">Noche</button></div></div>
          <div class="opt"><label id="l-f1">Sabor del jugador 1</label><button class="btn cyc flavor" id="o-f1" data-cyc="f0" aria-labelledby="l-f1"><span class="dot"></span><span class="val">Fresa</span><span class="arrow" aria-hidden="true">›</span></button></div>
          <div class="opt"><label id="l-f2">Sabor del jugador 2</label><button class="btn cyc flavor" id="o-f2" data-cyc="f1" aria-labelledby="l-f2"><span class="dot"></span><span class="val">Menta</span><span class="arrow" aria-hidden="true">›</span></button></div>
          <div class="opt"><label>Pantalla completa</label>"""),
(""".opts { display: grid; gap: 12px; width: min(560px, 100%); }""",
 """.opts { display: grid; gap: 12px; width: min(560px, 100%); }
.btn.cyc { padding: .5em 1em; font-size: clamp(15px, 1.4vw, 18px); min-width: 12em; justify-content: space-between; }
.btn.cyc .arrow { opacity: .55; font-weight: 700; }
.btn.cyc .dot { width: 1em; height: 1em; border-radius: 50%; border: 3px solid var(--ink); flex: none; }"""),
])
edit('09-ui.js', [
("""        if (opt === 'bot') Game.setBotLevel(Number(v));""",
 """        if (opt === 'bot') Game.setBotLevel(Number(v));
        if (opt === 'theme') Game.setTheme(v);"""),
("""    set('wins', Game.G.winsNeeded); set('bot', Game.G.botLevel);""",
 """    set('wins', Game.G.winsNeeded); set('bot', Game.G.botLevel); set('theme', Game.G.theme);
    const st = Game.G.musicStyle;
    $('#o-style .val').textContent = st === 'arena' ? 'Según la arena' : st === 'random' ? 'Al azar' : Sound.Music.name(st);
    [0, 1].forEach(i => {
      const b = $('#o-f' + (i + 1)), f = FLAVORS[Game.G.flavors[i]];
      b.querySelector('.val').textContent = f.name; b.querySelector('.dot').style.background = f.base;
    });"""),
("""    $$('.seg').forEach(seg => {""",
 """    // botones que rotan entre opciones (estilo de música, sabores)
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
    $$('.seg').forEach(seg => {"""),
])
print('ok')
