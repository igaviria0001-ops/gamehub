const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1200);
  // sonido
  const snd = await page.evaluate(async () => {
    TYA.Sound.init();
    const names = ['jump','land','stick','unstick','dry','bump','ram','whoosh','dunk','pellet','golden','beep','bell','callout','win','roundWin','hover','select','back','pause'];
    names.forEach(n => TYA.Sound.play(n));
    TYA.Sound.setTension(1.3, true); TYA.Sound.setReel(1, true);
    await new Promise(r => setTimeout(r, 1500));
    TYA.Sound.silenceLoops();
    return { ready: TYA.Sound.ready };
  });
  console.log('sound', JSON.stringify(snd));
  await page.click('[data-act="howto"]'); await page.waitForTimeout(400);
  await page.screenshot({ path: 'shots/s-howto.png' });
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  await page.click('[data-act="options"]'); await page.waitForTimeout(400);
  await page.screenshot({ path: 'shots/s-options.png' });
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  // partida rápida y resultados forzados
  await page.click('[data-act="playbot"]'); await page.waitForTimeout(300);
  await page.keyboard.press('Enter'); await page.waitForTimeout(3500);
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  await page.screenshot({ path: 'shots/s-pause.png' });
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  await page.evaluate(() => { const G = TYA.Game.G; G.wins = [2, 1]; G.players[0].stats = { rams: 6, slings: 2, whips: 1, pellets: 1, dunks: 2 }; G.players[1].stats = { rams: 4, slings: 0, whips: 2, pellets: 0, dunks: 1 }; });
  await page.evaluate(() => { TYA.Game.G.players[1].y = 900; });
  await page.waitForTimeout(6500);
  await page.screenshot({ path: 'shots/s-results.png' });
  // celular
  const ph = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await ph.goto('file://' + path.resolve(__dirname, 'index.html'));
  await ph.waitForTimeout(1500);
  await ph.screenshot({ path: 'shots/s-phone.png' });
  const ph2 = await browser.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  await ph2.goto('file://' + path.resolve(__dirname, 'index.html'));
  await ph2.waitForTimeout(1500);
  await ph2.screenshot({ path: 'shots/s-phone-land.png' });
  console.log('ERRORS', errors.join('\n'));
  await browser.close();
})();
