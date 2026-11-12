const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => console.log('ERR', e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(800);
  await page.click('[data-act="play2"]');
  const r = await page.evaluate(() => {
    const G = VTO.Game.G; G.paused = true; const out = [];
    const b = G.birds[0];
    for (let i = 0; i < 360; i++) { VTO.Game.step(1 / 120); if (i % 40 === 0) out.push([i, b.x.toFixed(0), b.y.toFixed(0), b.s.toFixed(0), b.a.toFixed(2), b.c, b.ex.toFixed(0), b.ey.toFixed(0), b.stalled]); }
    return out;
  });
  console.log(r.map(x => x.join(' ')).join('\n'));
  await browser.close();
})();
