// captura de un nivel de campaña a los T segundos (LV=10 T=12 [ZOOM=1.4 a un jefe])
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
  for (const spec of (process.env.L || '10:12').split(',')) {
    const [lv, T, zoom] = spec.split(':').map(Number);
    await page.evaluate(([lv, T, zoom, ch]) => { Game.start('camp', 0, { level: lv, chars: ch.split(',') }); UI.show(null, false); const G = Game.G; for (const m of G.mages) m.maxHp = m.hp = 9999; Game.advance(T); if (zoom) { const b = G.boss || G.mages[0]; G.paused = true; Game.cam.x = b.x; Game.cam.y = b.y - 40; Game.cam.z = zoom; } }, [lv, T, zoom || 0, process.env.CH || 'zuhe,tota']);
    await page.waitForTimeout(500); await page.screenshot({ path: path.join(__dirname, 'shots', `lv-${lv}${zoom ? 'z' : ''}.png`) });
  }
  console.log('ERR', errors.slice(0, 4).join(' | ') || 'ninguno'); await browser.close();
})();
