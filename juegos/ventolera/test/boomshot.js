// explosión de cerca en varios instantes (juzgar bola de fuego, humo iluminado y onda)
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => { try { localStorage.setItem('vto_qManual', 'true'); localStorage.setItem('vto_quality', '"alta"'); } catch (e) {} });
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(800);
  const arena = process.env.A || 'cocora';
  await page.evaluate(a => { VTO.Game.cfg.arena = a; document.querySelector('[data-act="play2"]').click(); }, arena);
  await page.waitForTimeout(600);
  for (const [i, ms] of [[0, 90], [1, 300], [2, 900]].entries()) {
    await page.evaluate(() => { const G = VTO.Game.G, b = G.birds[0]; FX.explosion(b.x + 160, b.y - 40, 1.2); });
    await page.waitForTimeout(ms[1]);
    await page.screenshot({ path: path.join(__dirname, 'shots', `boom-${i}.png`) });
    await page.waitForTimeout(2600);
  }
  console.log('ERR', errors.slice(0, 4).join(' | ') || 'ninguno'); await browser.close();
})();
