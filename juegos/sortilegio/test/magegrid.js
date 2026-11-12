// los magos en grande (figura de menú) para juzgar el arte: MAGES=a,b,c  COLS=5  CW=300 CH=420  SKIN=0  T=1.2
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch(); const cols = +(process.env.COLS || 5), CW = +(process.env.CW || 300), CH = +(process.env.CH || 420);
  const page = await (await browser.newContext({ viewport: { width: 400, height: 300 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
  const list = await page.evaluate(() => CHAR_ORDER.slice()); const ms = (process.env.MAGES || list.join(',')).split(',');
  const rows = Math.ceil(ms.length / cols); await page.setViewportSize({ width: cols * CW, height: rows * CH });
  await page.evaluate(([ms, cols, CW, CH, skin, T]) => {
    Game.G.paused = true; const c = document.createElement('canvas'); c.width = cols * CW; c.height = Math.ceil(ms.length / cols) * CH; c.style.cssText = 'position:fixed;inset:0;z-index:999'; document.body.append(c); const x = c.getContext('2d');
    ms.forEach((cid, i) => { x.save(); x.translate((i % cols) * CW, Math.floor(i / cols) * CH); x.beginPath(); x.rect(0, 0, CW, CH); x.clip(); for (let k = 0; k < 40; k++) ArtMage.showcase(x, cid, CW, CH, T - 0.66 + k / 60, skin); x.restore(); });
  }, [ms, cols, CW, CH, +(process.env.SKIN || 0), +(process.env.T || 1.2)]);
  await page.screenshot({ path: path.join(__dirname, 'shots', `magegrid${process.env.TAG || ''}.png`) });
  console.log('ERR', errors.slice(0, 4).join(' | ') || 'ninguno'); await browser.close();
})();
