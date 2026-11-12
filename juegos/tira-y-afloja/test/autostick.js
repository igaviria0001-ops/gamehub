// Pegarse automático en pantallas táctiles (?touch=1): quieto = pegado; quieto + tirar = carga; moverse = tirachinas
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const res = {};
  for (const touch of [true, false]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, 'index.html') + (touch ? '?touch=1' : ''));
    await page.waitForTimeout(1000);
    res[touch ? 'tactil' : 'teclado'] = await page.evaluate(() => {
      const G = TYA.Game.G, K = o => Object.assign({ left: false, right: false, jump: false, stick: false, pull: false, release: false }, o || {});
      TYA.UI.show(null, false); TYA.Game.startMatch('caneca', true, 'pupitre');
      G.bots[1] = { think: () => emptyInput() };
      let g = 0; while (G.state !== 'play' && g++ < 400) TYA.Game.update(1 / 60);
      const p = G.players[0], log = {};
      for (let k = 0; k < 30; k++) { TYA.over[0] = K({}); TYA.Game.update(1 / 60); }
      log.quietoPegado = p.stuck;
      // alejarse un poco para que el hilo se tense
      for (let k = 0; k < 40; k++) { TYA.over[0] = K({ left: true }); TYA.Game.update(1 / 60); }
      for (let k = 0; k < 30; k++) { TYA.over[0] = K({}); TYA.Game.update(1 / 60); }
      let mx = 0; for (let k = 0; k < 120; k++) { TYA.over[0] = K({ pull: true }); TYA.Game.update(1 / 60); mx = Math.max(mx, p.charge); }
      log.carga = +mx.toFixed(2); log.pegado = p.stuck;
      let sling = false;
      for (let k = 0; k < 20; k++) { TYA.over[0] = K({ right: true }); TYA.Game.update(1 / 60); if (p.slingT > 0) sling = true; }
      log.tirachinas = sling;
      TYA.over[0] = null;
      return log;
    });
    res.err = errors.join(' | ');
    await page.close();
  }
  console.log(JSON.stringify(res));
  await browser.close();
})();
