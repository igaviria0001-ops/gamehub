// Logros: se desbloquean con eventos de personas (no de la máquina), se guardan y la pintura dorada aparece al ganar «Leyenda viva»
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => {
    const { Game, Progress, UI } = VTO; Progress.reset();
    Game.setArena('cocora'); Game.start('duel', 1); UI.show(null, false); Game.advance(3);
    const G = Game.G, [A, B] = G.birds, out = {};
    G.events.push({ type: 'trick', b: B, key: 'cobra', name: 'Cobra', combo: 1 }); Game.advance(1 / 60);
    out.cobraMaquina = Progress.has('cobra');
    G.events.push({ type: 'trick', b: A, key: 'cobra', name: 'Cobra', combo: 5 }); Game.advance(1 / 60);
    out.cobraPersona = Progress.has('cobra'); out.combo5 = Progress.has('combo5'); out.cartel = G.toast && G.toast.name;
    for (let i = 0; i < 5; i++) { G.events.push({ type: 'legend', b: A }); Game.advance(1 / 60); }
    out.leyenda5 = Progress.has('leyenda5');
    out.guardado = !!JSON.parse(localStorage.getItem('vto_prog')).got.leyenda5;
    UI.show('birds', false); for (let i = 0; i < 3; i++) document.querySelector('[data-act="look0"]').click();
    out.pinturas = Game.cfg.looks[0] + ' ' + document.getElementById('blook0').textContent;
    return out;
  });
  console.log(JSON.stringify(r));
  await page.screenshot({ path: path.join(__dirname, 'shots', 'gold.png') });
  console.log('ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
