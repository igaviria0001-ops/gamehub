// depurar un nivel del Mundo 3 con dos máquinas: cada N segundos, qué dice el nivel y dónde está cada uno
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
  const lv = +(process.env.LV || 18), every = +(process.env.EV || 10), max = +(process.env.MAX || 240), players = +(process.env.P || 0);
  await page.evaluate(([lv, players]) => { Game.start('camp', players, { level: lv, chars: (window.CH || ['candela', 'yuma']) }); UI.show(null, false); }, [lv, players]);
  let t = 0;
  while (t < max) {
    const r = await page.evaluate(([ev]) => { const G = Game.G; let k = 0; while (G.state !== 'roundEnd' && G.state !== 'matchEnd' && k < ev / 0.5) { Game.advance(0.5); k++; }
      return { t: Math.round(G.roundT), st: G.state, win: G.campWin, lives: G.lives, label: G.L.label(G), sea: G.sea ? G.sea.panels.map(p => p.s[0] + p.s[1]).join(',') : '', m: G.mages.map(m => [Math.round(m.x), Math.round(m.y), m.alive ? 1 : 0, m.hands.map(h => h.el).join('+'), m.ctrl && m.ctrl.job ? (m.ctrl.job.o.t + "@" + Math.round(m.ctrl.job.o.x)) : "-", m.ctrl && m.ctrl.goal ? "src:" + m.ctrl.goal.s.el : ""]), foes: G.units.filter(u => u instanceof Creature && u.alive).length, boss: G.boss ? Math.round(G.boss.hp) + (G.boss.shield ? '/' + Math.round(G.boss.shield) : '') : null }; }, [every]);
    console.log(JSON.stringify(r)); t += every; if (r.st !== 'play') break;
  }
  await page.screenshot({ path: path.join(__dirname, 'shots', `w3dbg-${lv}.png`) });
  console.log('ERR', errors.slice(0, 5).join(' | ') || 'ninguno');
  await browser.close();
})();
