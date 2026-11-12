import os
os.chdir('/home/claude/tya/src')
def edit(p, pairs):
    s = open(p).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:70], s.count(old))
        s = s.replace(old, new)
    open(p, 'w').write(s)

edit('06-fx.js', [
("""  let shake = 0;

  function add(p) {""",
 """  let shake = 0;
  // accesibilidad / rendimiento: cuánto se sacude la pantalla y cuántas partículas se dibujan
  const settings = { shake: Store.get('shake', 1), particles: Store.get('quality', 'alta') === 'ligera' ? 0.45 : 1 };

  function add(p) {
    if (settings.particles < 1 && p.type !== 'ring' && Math.random() > settings.particles) return;"""),
("""    shake(v) { shake = Math.max(shake, v); },""",
 """    shake(v) { shake = Math.max(shake, v * settings.shake); },
    settings,"""),
])
edit('template.html', [
("""          <div class="opt"><label>Pantalla completa</label>""",
 """          <div class="opt"><label id="l-shake">Sacudida de pantalla</label><div class="seg" role="group" aria-labelledby="l-shake" data-opt="shake"><button data-v="1">Normal</button><button data-v="0.4">Suave</button><button data-v="0">No</button></div></div>
          <div class="opt"><label id="l-quality">Calidad gráfica</label><div class="seg" role="group" aria-labelledby="l-quality" data-opt="quality"><button data-v="alta">Alta</button><button data-v="ligera">Ligera (PC sencillo)</button></div></div>
          <div class="opt"><label>Pantalla completa</label>"""),
(""".opts { display: grid; gap: 12px; width: min(560px, 100%); }""",
 """.opts { display: grid; gap: 10px; width: min(600px, 100%); }"""),
])
edit('09-ui.js', [
("""        if (opt === 'theme') Game.setTheme(v);""",
 """        if (opt === 'theme') Game.setTheme(v);
        if (opt === 'shake') { FX.settings.shake = Number(v); Store.set('shake', Number(v)); }
        if (opt === 'quality') { Store.set('quality', v); FX.settings.particles = v === 'ligera' ? 0.45 : 1; window.dispatchEvent(new Event('resize')); }"""),
("""    set('wins', Game.G.winsNeeded); set('bot', Game.G.botLevel); set('theme', Game.G.theme);""",
 """    set('wins', Game.G.winsNeeded); set('bot', Game.G.botLevel); set('theme', Game.G.theme);
    set('shake', FX.settings.shake); set('quality', Store.get('quality', 'alta'));"""),
("""  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);""",
 """  function resize() {
    const lite = Store.get('quality', 'alta') === 'ligera';
    dpr = lite ? 1 : Math.min(window.devicePixelRatio || 1, 2);"""),
])
print('ok')
