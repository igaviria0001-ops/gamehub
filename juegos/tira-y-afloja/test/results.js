// Fin de partida: resultados, revancha, cambiar modo, torneo con elección de arena
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = []; page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(900);
  const log = [];
  const ui = () => page.evaluate(() => TYA.UI.current);
  // tira a Menta a la caneca hasta que termine la partida (o salga la elección de arena)
  const dunkUntil = (stop) => page.evaluate(stop => {
    const G = TYA.Game.G; let g = 0;
    while (g++ < 60 * 90) {
      if (G.state === 'play') { const B = G.players[1]; if (B.alive) { B.x = 120; B.y = 900; } }
      TYA.over[0] = G.state === 'replay' && g % 2 ? { left: false, right: false, jump: true, stick: false, pull: false, release: false } : null;
      TYA.Game.update(1 / 60);
      if (stop === 'pick' && TYA.UI.current === 'pick') break;
      if (TYA.UI.current === 'results') break;
    }
    TYA.over[0] = null;
    return { state: G.state, ui: TYA.UI.current, wins: G.wins.slice(), g };
  }, stop);
  await page.click('#s-title [data-act="play2"]'); await page.click('[data-act="mode-caneca"]'); await page.click('#arena-grid .arena:nth-child(1)');
  log.push(['caneca → fin', await dunkUntil()]);
  await page.waitForTimeout(200);
  await page.click('#btn-rematch'); await page.waitForTimeout(150);
  log.push(['revancha', await ui(), await page.evaluate(() => [TYA.Game.G.mode, TYA.Game.G.wins.join('-'), TYA.Game.G.state])]);
  log.push(['fin otra vez', await dunkUntil()]);
  await page.click('#s-results [data-act="changemode"]'); await page.waitForTimeout(150);
  log.push(['cambiar modo', await ui()]);
  await page.click('[data-act="mode-caneca"]'); await page.waitForTimeout(150);
  await page.click('[data-act="arena-torneo"]'); await page.waitForTimeout(150);
  log.push(['torneo → elección', await dunkUntil('pick')]);
  await page.waitForTimeout(200);
  if ((await ui()) === 'pick') { await page.click('#pick-grid .arena:nth-child(1)'); await page.waitForTimeout(200); log.push(['eligió arena', await ui(), await page.evaluate(() => TYA.Game.G.arenaId)]); }
  for (let k = 0; k < 8; k++) { const r = await dunkUntil('pick'); if (r.ui === 'results') { log.push(['torneo → fin', r]); break; } await page.waitForTimeout(150); await page.click('#pick-grid .arena:nth-child(2)'); await page.waitForTimeout(150); log.push(['otra elección', await page.evaluate(() => TYA.Game.G.arenaId)]); }
  for (const l of log) console.log(JSON.stringify(l)); log.length = 0;
  await page.click('#s-results [data-act="menu"]'); await page.waitForTimeout(150);
  log.push(['menú', await ui()]);
  for (const l of log) console.log(JSON.stringify(l));
  console.log('ERR', errors.join('\n'));
  await browser.close();
})();
