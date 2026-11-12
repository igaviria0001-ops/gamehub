// Jefes nuevos: capturas en distintos momentos y prueba sin bots (que no se caiga nada)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1200);
  const ids = process.argv[2] ? process.argv[2].split(',') : ['fotocopiadora', 'microondas', 'reloj'];
  for (const id of ids) {
    for (const [k, t] of [[1, 3], [2, 7], [3, 11], [4, 16]]) {
      const info = await page.evaluate(([id, t, k]) => {
        const G = TYA.Game.G;
        if (k === 1) { TYA.UI.show(null, false); G.jefeId = id; TYA.Game.startMatch('jefe', false, null); G.bots = [null, null]; }
        let g = 0; while (G.roundT < t && G.state !== 'matchEnd' && g++ < 60 * 60) TYA.Game.update(1 / 60);
        const J = Jefes.state; return J ? { st: J.state, hp: J.hp, hearts: J.hearts, arena: ARENA.def && ARENA.def.id } : null;
      }, [id, t, k]);
      console.log(id, t, JSON.stringify(info));
      await page.waitForTimeout(120);
      await page.screenshot({ path: `shots/j2-${id}-${k}.png` });
    }
  }
  console.log('ERR', errors.join('\n'));
  await browser.close();
})();
