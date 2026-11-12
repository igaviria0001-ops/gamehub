import os
os.chdir('/home/claude/tya/src')
def edit(p, pairs):
    s = open(p).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:70], s.count(old))
        s = s.replace(old, new)
    open(p, 'w').write(s)

edit('01-core.js', [
("""  function player(i) {
    const m = KEYMAP[i], p = padNow[i] || {};
    return {
      left: anyDown(m.left) || !!p.left,
      right: anyDown(m.right) || !!p.right,
      jump: anyDown(m.jump) || !!p.jump,
      stick: anyDown(m.stick) || !!p.stick,
      pull: anyDown(m.pull) || !!p.pull,
      release: anyDown(m.release) || !!p.release,
    };
  }""",
 """  function player(i) {
    const m = KEYMAP[i], p = padNow[i] || {};
    const t = typeof Touch !== 'undefined' ? Touch.state[i] : {};
    return {
      left: anyDown(m.left) || !!p.left || !!t.left,
      right: anyDown(m.right) || !!p.right || !!t.right,
      jump: anyDown(m.jump) || !!p.jump || !!t.jump,
      stick: anyDown(m.stick) || !!p.stick || !!t.stick,
      pull: anyDown(m.pull) || !!p.pull || !!t.pull,
      release: anyDown(m.release) || !!p.release || !!t.release,
    };
  }"""),
])
edit('09-ui.js', [
("""  function show(name, push = true) {
    if (push && current && current !== name) stack.push(current);
    $$('.screen').forEach(s => { s.hidden = true; });
    current = name;""",
 """  function show(name, push = true) {
    if (push && current && current !== name) stack.push(current);
    $$('.screen').forEach(s => { s.hidden = true; });
    current = name;
    if (name) Touch.hide(); else Touch.show(Game.G.vsBot ? 'single' : 'dual');"""),
("""    if (touchOnly) toast('Tira y Afloja se juega con teclado o con mandos. La versión para celular viene pronto; mientras tanto, mira la demo.', 9000);""",
 """    if (touchOnly) toast('En pantalla táctil aparecen botones al jugar. Pon el celular en horizontal; con una tableta pueden jugar dos.', 8000);"""),
])
edit('template.html', [
("""<div id="app">""",
 """<div id="app">
  <div id="rotate" aria-hidden="true"><div><b>Gira el celular</b><span>Tira y Afloja se juega en horizontal</span></div></div>"""),
(""".minirow {""",
 """/* controles táctiles */
.touch { position: absolute; inset: 0; pointer-events: none; z-index: 5; }
.touch[hidden] { display: none !important; }
.tcl { position: absolute; bottom: max(14px, env(safe-area-inset-bottom, 0px)); display: grid; gap: 10px; pointer-events: auto; }
.tcl.move { grid-template-columns: repeat(2, auto); }
.tcl.act { grid-template-columns: repeat(2, auto); }
.tcl.move.left { left: max(14px, env(safe-area-inset-left, 0px)); }
.tcl.move.right { right: max(14px, env(safe-area-inset-right, 0px)); }
.single .tcl.act.right { right: max(14px, env(safe-area-inset-right, 0px)); }
.dual .tcl.act.left2 { left: calc(max(14px, env(safe-area-inset-left, 0px)) + 168px); }
.dual .tcl.act.right2 { right: calc(max(14px, env(safe-area-inset-right, 0px)) + 168px); }
.tbtn { all: unset; width: clamp(52px, 8.5vmin, 76px); height: clamp(52px, 8.5vmin, 76px); border-radius: 50%; display: grid; place-items: center;
  background: rgba(255,246,230,.55); border: 3px solid rgba(58,34,22,.75); color: var(--ink); font: 700 clamp(20px, 4vmin, 30px)/1 var(--display);
  box-shadow: 0 4px 0 rgba(58,34,22,.55), inset 0 0 0 4px color-mix(in srgb, var(--pc) 45%, transparent); touch-action: none; user-select: none; -webkit-user-select: none; }
.tbtn.on { background: color-mix(in srgb, var(--pc) 70%, white); transform: translateY(3px); box-shadow: 0 1px 0 rgba(58,34,22,.55); }
.tbtn.k-jump { background: rgba(255,216,77,.6); }
.tpause { all: unset; position: absolute; top: max(10px, env(safe-area-inset-top, 0px)); left: 50%; transform: translateX(-50%) translateY(118px); width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center;
  background: rgba(255,246,230,.7); border: 3px solid var(--ink); font: 700 18px var(--display); color: var(--ink); pointer-events: auto; }
#rotate { display: none; }
@media (orientation: portrait) and (hover: none) and (pointer: coarse) {
  #rotate { display: grid; place-items: center; position: absolute; inset: 0; z-index: 50; background: rgba(42,23,16,.92); color: var(--cream); text-align: center; }
  #rotate b { display: block; font: 700 30px var(--display); }
  #rotate span { font-size: 16px; opacity: .85; }
}
.minirow {"""),
])
print('ok')
