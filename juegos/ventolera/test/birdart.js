const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 560 }, deviceScaleFactor: 1.5 });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 1200; c.height = 560; c.style.cssText = 'position:fixed;inset:0;z-index:99;background:linear-gradient(#4b4688,#f19c8f)';
    document.body.append(c); const ctx = c.getContext('2d');
    const sps = ['guacamaya', 'colibri', 'tucan', 'condor'];
    sps.forEach((sp, i) => [0, 1].forEach(look => {
      const S = VTO.SPECIES[sp];
      const fake = { sp: S, look, x: 0, y: 0, a: 0, c: 1, perch: null, flapPh: 1.2 + look * 2, effort: 0.6, feathers: S.feathers, rollT: 0, stun: 0, facing: 1 };
      ctx.save(); ctx.translate(150 + i * 300, 150 + look * 230); ctx.scale(2.2 / S.size, 2.2 / S.size); ArtBird.draw(ctx, fake, 1, PLAYER_COLORS[look]); ctx.restore();
    }));
  });
  await page.screenshot({ path: path.join(__dirname, 'shots', 'birdart.png') });
  await browser.close();
})();
