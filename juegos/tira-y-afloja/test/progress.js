// Progreso: pantallas de jugadores/logros y reto del día, logros en partida, accesorios
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'shots/p-title.png' });
  await page.click('[data-act="records"]'); await page.waitForTimeout(300);
  await page.fill('#n1', 'Ana'); await page.press('#n1', 'Enter');
  await page.fill('#n2', 'Luis'); await page.press('#n2', 'Enter');
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'shots/p-records.png' });
  await page.click('#s-records [data-act="back"]'); await page.waitForTimeout(200);
  await page.click('[data-act="daily"]'); await page.waitForTimeout(300);
  await page.screenshot({ path: 'shots/p-daily.png' });
  // una partida 2 jugadores con eventos simulados: tirachinas, salto doble, caneca
  const r = await page.evaluate(() => {
    TYA.UI.show(null, false);
    TYA.Game.startMatch('caneca', false, 'pupitre');
    const G = TYA.Game.G; G.hintsT = 0;
    let g = 0; while (G.state !== 'play' && g++ < 600) TYA.Game.update(1 / 60);
    const [A, B] = G.players;
    Progress.on('ram', { att: A, def: B, sling: true, stomp: false });
    Progress.on('airjump', { p: B });
    Progress.on('dunk', { victim: B, by: A, ropeCut: false });
    for (let k = 0; k < 10; k++) Progress.unlock(0, ['latigazo', 'aplaston', 'catapulta', 'salvada', 'pegajoso', 'gol', 'campanero', 'fiestero', 'turista', 'nocturno'][k]);
    TYA.Game.applyFlavors();
    A.acc = 'gorra'; B.acc = 'lentes';
    return { ana: Progress.count('Ana'), luis: Progress.count('Luis'), accA: Progress.accOf(0), names: Progress.names };
  });
  console.log(JSON.stringify(r));
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'shots/p-game.png' });
  // accesorios variados de cerca
  await page.evaluate(() => { const [A, B] = TYA.Game.G.players; A.acc = 'corona'; B.acc = 'audifonos'; });
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'shots/p-acc2.png' });
  await page.evaluate(() => { const [A, B] = TYA.Game.G.players; A.acc = 'mono'; B.acc = 'bigote'; });
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'shots/p-acc3.png' });
  console.log('ERR', errors.join('\n'));
  await browser.close();
})();
