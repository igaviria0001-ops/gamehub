const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 600 }, deviceScaleFactor: 1.5 });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 1200; c.height = 600; c.style.cssText = 'position:fixed;inset:0;z-index:99;background:linear-gradient(#4b4688,#f19c8f)';
    document.body.append(c); const ctx = c.getContext('2d');
    ['guacamaya', 'colibri', 'tucan', 'condor'].forEach((sp, i) => [0, 1].forEach(look => {
      const S = VTO.SPECIES[sp];
      const fake = { sp: S, look, x: 0, y: 0, a: look ? -0.35 : 0, c: 1, perch: null, flapPh: 1, rollT: 0, stun: 0, facing: 1, boosting: look === 1, hitT: 0, shield: 0, s: 620, mis: 0 };
      ctx.save(); ctx.translate(160 + i * 290, 160 + look * 260); ctx.scale(3.2 / S.size, 3.2 / S.size); ArtPilot.draw(ctx, fake, 1, PLAYER_COLORS[look]); ctx.restore();
    }));
  });
  await page.screenshot({ path: path.join(__dirname, 'shots', 'pilotart.png') });
  await browser.close();
})();
