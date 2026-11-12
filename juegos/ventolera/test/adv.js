// Ventaja por jugador: opción en Opciones, menos daño y turbo más rápido; no cuenta en la Travesía
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(600);
  await page.click('#s-title [data-act="options"]'); await page.waitForTimeout(150);
  await page.click('[data-opt="adv0"] [data-v="2"]'); await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(__dirname, 'shots', 'adv-opciones.png') });
  const r = await page.evaluate(() => {
    const { Game, UI } = VTO; UI.show('title', false); Game.setMode('duel'); Game.start('duel', 2); UI.show(null, false);
    const G = Game.G, [a, b] = G.birds; a.shield = 0; b.shield = 0; a.damage(100, 1, 'bullet'); b.damage(100, 0, 'bullet');
    const out = { ventaja: G.adv.join(','), dañoJ1: Math.round(a.sp.hp - a.hp), dañoJ2: Math.round(b.sp.hp - b.hp) };
    Game.start('duel', 1, VTO.STAGES[0]); out.travesia = G.adv.join(',');
    return out;
  });
  console.log(JSON.stringify(r));
  await page.evaluate(() => { const { Game, UI } = VTO; Game.start('duel', 2); UI.show(null, false); Game.advance(3); });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(__dirname, 'shots', 'adv-hud.png'), clip: { x: 0, y: 0, width: 1280, height: 120 } });
  console.log('ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
