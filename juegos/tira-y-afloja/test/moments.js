const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1500);
  const step = (n, a, b) => page.evaluate(([n, a, b]) => { const I = (o = {}) => Object.assign({ left: false, right: false, jump: false, stick: false, pull: false, release: false }, o); for (let i = 0; i < n; i++) { TYA.over[0] = I(a); TYA.over[1] = I(b); TYA.Game.update(1 / 60); } }, [n, a, b]);
  const setup = (ax, bx, ma, mb, len, mode = 'caneca') => page.evaluate(([ax, bx, ma, mb, len, mode]) => { const G = TYA.Game.G; document.querySelectorAll('.screen').forEach(s => s.hidden = true); TYA.UI.show(null, false); TYA.Game.startMatch(mode, false); const [A, B] = G.players; A.reset(ax, ARENA.deskY, ma); B.reset(bx, ARENA.deskY, mb); G.rope.reset(A.x, A.y, B.x, B.y, len); G.state = 'play'; G.canControl = true; G.hintsT = 0; }, [ax, bx, ma, mb, len, mode]);
  // A) tirachinas en el aire
  await setup(650, 840, 3, 3, 150);
  await step(30, { stick: true }, { stick: true });
  await step(4, {}, { stick: true });
  await page.waitForTimeout(50);
  await page.screenshot({ path: 'shots/m1-sling.png' });
  await step(3, {}, { stick: true });
  await page.screenshot({ path: 'shots/m2-impact.png' });
  // B) colgando sobre la caneca
  await setup(1300, 1560, 3, 3, 400);
  await step(12, { stick: true }, { right: true });
  await step(50, { stick: true, pull: true }, { right: true });
  await page.screenshot({ path: 'shots/m3-hang.png' });
  await step(70, { stick: true, release: true }, {});
  await page.screenshot({ path: 'shots/m4-dunk.png' });
  // C) atrapa chicles
  await setup(760, 1160, 3, 3, 400, 'chicles');
  await step(200, { right: true, release: true }, { left: true, jump: true });
  await page.screenshot({ path: 'shots/m5-chicles.png' });
  // D) pesado vs liviano + tirar
  await setup(700, 1150, 7, 1.2, 250);
  await step(30, { pull: true, stick: true }, { right: true, release: true });
  await page.screenshot({ path: 'shots/m6-sizes.png' });
  console.log('ERRORS', errors.join('\n'));
  await browser.close();
})();
