// el Gran Sortilegio paso a paso: concentración, banda de cine, salida y onda (PC; CEL=1 celular)
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch(); const cel = !!process.env.CEL;
  const page = await (await browser.newContext(Object.assign({ viewport: cel ? { width: 844, height: 390 } : { width: 1280, height: 720 } }, cel ? { deviceScaleFactor: 2, isMobile: true, hasTouch: true } : {}))).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
  const pair = (process.env.PAIR || 'candela,yuma').split(',');
  await page.evaluate(pair => { Game.start('duel', 2, { chars: pair, arena: 'paramo' }); UI.show(null, false); const G = Game.G; G.introT = 0; G.countT = 0; Game.advance(0.3); G.mages[0].x = 640; G.mages[0].y = 470; G.mages[1].x = 900; G.mages[1].y = 470; G.mages[0].gainEmb(G, 100); G.mages[1].ctrl = null; }, pair);
  const hp0 = await page.evaluate(() => Game.G.mages[1].hp);
  await page.keyboard.down('KeyF'); await page.keyboard.down('KeyG'); await page.waitForTimeout(120); await page.keyboard.up('KeyF'); await page.keyboard.up('KeyG');
  for (const [i, ms] of [[0, 250], [1, 450], [2, 420], [3, 300]]) { await page.waitForTimeout(ms); await page.screenshot({ path: path.join(__dirname, 'shots', `gran2-${i}${cel ? 'c' : ''}.png`) }); }
  await page.waitForTimeout(1500);
  const r = await page.evaluate(hp0 => { const [a, b] = Game.G.mages; return { gran: a.stats.gran, emb: Math.round(a.emb), escudo: Math.round(a.buff.shield || 0), dañoRival: Math.round(hp0 - b.hp), empuje: Math.round(b.x - 900) }; }, hp0);
  console.log(JSON.stringify(r), 'ERR', errors.join(' | ') || 'ninguno'); await browser.close();
})();
