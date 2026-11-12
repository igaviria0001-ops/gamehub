// Premios de campaña: sombreros y sabores nuevos se ven bien
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(1000);
  const combos = [['algodon', 'birrete', 'cola', 'vincha'], ['oro', 'chef', 'algodon', 'birrete']];
  let k = 0;
  for (const [f1, a1, f2, a2] of combos) {
    const r = await page.evaluate(([f1, a1, f2, a2]) => {
      Campaign.data.rewards = { salon: true, arte: true, gimnasio: true, biblioteca: true, cafeteria: true, torre: true };
      const G = TYA.Game.G; G.flavors = ['fresa', 'menta'];
      const ok = [TYA.Game.setFlavor(0, f1), TYA.Game.setFlavor(1, f2), Progress.setAcc(0, a1), Progress.setAcc(1, a2)];
      TYA.UI.show(null, false); TYA.Game.startMatch('caneca', false, 'pupitre');
      for (let i = 0; i < 260; i++) TYA.Game.update(1 / 60);
      const P = G.players; return { ok, acc: [P[0].acc, P[1].acc], col: [P[0].col.id, P[1].col.id] };
    }, [f1, a1, f2, a2]);
    console.log(JSON.stringify(r));
    await page.evaluate(() => { const G = TYA.Game.G; G.cam.tz = 2.2; G.cam.zoom = 2.2; G.cam.tx = G.cam.x = (G.players[0].x + G.players[1].x) / 2; G.cam.ty = G.cam.y = G.players[0].y - 40; });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `shots/rw-${k++}.png` });
  }
  console.log('ERR', errors.join(' | ')); await browser.close();
})();
