// Que todo lo marcado como oculto esté de verdad oculto (botones de resultados, insignias, pausa)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(600);
  const check = () => page.evaluate(() => [...document.querySelectorAll('[hidden]')].filter(e => getComputedStyle(e).display !== 'none').map(e => e.id || e.className || e.tagName));
  console.log('título:', JSON.stringify(await check()));
  for (const s of ['results', 'pause', 'trav', 'options', 'birds']) { await page.evaluate(s => { if (s === 'results') { VTO.Game.G.state = 'matchEnd'; VTO.UI.results({ winner: 0, wins: [3, 1], names: ['J1', 'J2'], vsBot: false, mode: 'duel', score: [0, 0], stats: [{}, {}] }); } else VTO.UI.show(s, false); }, s); await page.waitForTimeout(150); console.log(s + ':', JSON.stringify(await check()), await page.evaluate(() => [...document.querySelectorAll('#s-results .menu button')].filter(b => b.offsetParent).map(b => b.textContent).join(' | '))); }
  console.log('ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
