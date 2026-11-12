// Celular apaisado (como el de Ignacio: ~693×272 CSS px, DPR 2.625) — capturas de menú, juego, retos y campaña
const { chromium } = require('playwright');
const path = require('path');
const W = +(process.argv[2] || 693), H = +(process.argv[3] || 272), DPR = +(process.argv[4] || 2.625), tag = process.argv[5] || 'm';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1200);
  const info = await page.evaluate(() => ({ iw: innerWidth, ih: innerHeight, cv: [document.getElementById('cv').width, document.getElementById('cv').height], dpr: devicePixelRatio, q: localStorage.getItem('tya_quality') }));
  console.log(JSON.stringify(info));
  const shot = async n => { await page.waitForTimeout(250); await page.screenshot({ path: `shots/${tag}-${n}.png` }); };
  await shot('menu');
  await page.tap('#s-title [data-act="playbot"]'); await shot('modes');
  await page.tap('[data-act="mode-caneca"]'); await page.waitForTimeout(200);
  if (await page.evaluate(() => TYA.UI.current) === 'arena') await page.tap('#arena-grid .arena:nth-child(1)');
  await page.evaluate(() => { for (let k = 0; k < 60 * 4.5; k++) TYA.Game.update(1 / 60); });
  await shot('game');
  const btns = await page.evaluate(() => [...document.querySelectorAll('#touch .tbtn')].filter(b => b.offsetParent).map(b => { const r = b.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; }));
  console.log('botones', JSON.stringify(btns), 'fuera:', btns.filter(r => r[0] < 0 || r[1] < 0 || r[2] > W || r[3] > H).length);
  // reto con resultado
  await page.evaluate(() => { TYA.UI.show('title'); });
  await page.waitForTimeout(150);
  await page.tap('#s-title [data-act="retos"]'); await shot('retos');
  await page.tap('#retos .reto:nth-child(1)');
  await page.evaluate(() => { for (let k = 0; k < 60 * 3; k++) TYA.Game.update(1 / 60); });
  await shot('reto');
  // campaña
  await page.evaluate(() => { TYA.UI.show(null, false); const G = TYA.Game.G; G.campStage = '2-2'; TYA.Game.startMatch('campana', false, 'campana'); for (let k = 0; k < 60 * 4; k++) TYA.Game.update(1 / 60); });
  await shot('camp');
  await page.evaluate(() => { TYA.UI.show('title'); }); await page.waitForTimeout(150);
  await page.tap('#s-title [data-act="play2"]'); await page.waitForTimeout(150);
  await page.tap('[data-act="mode-campana"]'); await shot('map');
  await page.evaluate(() => { TYA.UI.show('pause'); }); await shot('pause');
  console.log('ERR', errors.join(' | '));
  await browser.close();
})();
