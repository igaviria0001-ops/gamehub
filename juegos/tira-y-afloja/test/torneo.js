const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL/.test(m.text())) errors.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1200);
  await page.click('[data-act="playbot"]'); await page.waitForTimeout(300);
  await page.click('[data-act="mode-caneca"]'); await page.waitForTimeout(1200);
  await page.screenshot({ path: 'shots/t-arenas.png' });
  await page.click('[data-act="arena-torneo"]'); await page.waitForTimeout(3600);
  const a1 = await page.evaluate(() => TYA.Game.G.arenaId + ' ' + TYA.Game.G.arenaMode);
  // Fresa (humana) cae: ella elige
  await page.evaluate(() => { const A = TYA.Game.G.players[0]; A.x = 120; A.y = 900; });
  await page.waitForTimeout(3600);
  await page.screenshot({ path: 'shots/t-pick.png' });
  const st = await page.evaluate(() => TYA.Game.G.state + ' ' + TYA.UI.current);
  await page.keyboard.press('KeyD'); await page.keyboard.press('Space');
  await page.waitForTimeout(800);
  const a2 = await page.evaluate(() => TYA.Game.G.arenaId + ' ' + TYA.Game.G.state + ' r' + TYA.Game.G.round);
  // la máquina pierde: elige sola
  await page.waitForTimeout(3000);
  await page.evaluate(() => { const B = TYA.Game.G.players[1]; B.x = 1800; B.y = 900; });
  await page.waitForTimeout(4600);
  const a3 = await page.evaluate(() => TYA.Game.G.arenaId + ' ' + TYA.Game.G.state + ' r' + TYA.Game.G.round + ' ' + TYA.UI.current);
  // hilo congelado en la cafetería
  await page.evaluate(() => { const G = TYA.Game.G; TYA.UI.show(null, false); TYA.Game.startMatch('caneca', true, 'cafeteria'); G.bots = [null, null]; });
  await page.waitForTimeout(3300);
  await page.evaluate(() => { const G = TYA.Game.G, [A, B] = G.players; A.x = 300; A.y = 590; B.x = 520; B.y = 300; B.vy = 0; G.rope.reset(A.x, A.y, B.x, B.y, 260); });
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'shots/t-cold.png' });
  console.log(a1, '|', st, '|', a2, '|', a3);
  console.log('ERRORS', errors.join('\n'));
  await browser.close();
})();
