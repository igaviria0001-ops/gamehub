// Medellín: vistas fijas de lugares (calle y río con el tren, ladera con metrocable, azoteas)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const vps = { pc: [{ width: 1280, height: 720 }, {}], cel: [{ width: 693, height: 272 }, { deviceScaleFactor: 2.625, isMobile: true, hasTouch: true }] };
  for (const name of process.argv.slice(2).length ? process.argv.slice(2) : ['pc']) {
    const ctx = await browser.newContext(Object.assign({ viewport: vps[name][0] }, vps[name][1]));
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, 'index.html'));
    await page.waitForTimeout(800);
    const ARENA = process.env.ARENA || 'medellin';
    const spots = process.env.ARENA === 'cartagena' ? [['mar', 450, 1750, 850, 1700], ['muralla', 1450, 1980, 2100, 1750], ['catedral', 2250, 1250, 2700, 1450], ['castillo', 3250, 1350, 3650, 1000]] : process.env.ARENA === 'bogota' ? [['monserrate', 3300, 1300, 3550, 1050], ['cable', 2900, 1500, 3150, 1350], ['luces', 1150, 1000, 1350, 1150], ['calle', 900, 1900, 1400, 1950]] : [['calle', 1600, 1830, 2100, 1700], ['ladera', 3250, 1600, 3600, 1450], ['azoteas', 1000, 1000, 1450, 850], ['torres', 2300, 1500, 2700, 1980]];
    for (const [tag, x1, y1, x2, y2] of spots) {
      await page.evaluate(([x1, y1, x2, y2, arena]) => {
        const { Game } = VTO; Game.setArena(arena); Game.start('free', 2); VTO.UI.show(null, false);
        const G = Game.G; G.hintT = 0; G.birds[0].reset(x1, y1, 1); G.birds[1].reset(x2, y2, -1); G.freeze = true; G.cratesOn = false;
        Game.advance(3); G.birds[0].reset(x1, y1, 1); G.birds[1].reset(x2, y2, -1); Game.updateCamera(0, true);
      }, [x1, y1, x2, y2, ARENA]);
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(__dirname, 'shots', `spot-${ARENA}-${name}-${tag}.png`) });
    }
    console.log(name, 'ERR', errors.join(' | ') || 'ninguno');
    await ctx.close();
  }
  await browser.close();
})();
