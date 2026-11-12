// ¿Sale el tirachinas? A se pega, carga y se suelta hacia B
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1000);
  const res = await page.evaluate(() => {
    const I = (o = {}) => Object.assign({ left: false, right: false, jump: false, stick: false, pull: false, release: false }, o);
    const G = TYA.Game.G, out = {};
    const scen = {
      // B se aleja; A pegado
      bAway: i => [I({ stick: i < 75 }), I({ right: i < 70 })],
      // B quieto; A pegado y tirando
      aPull: i => [I({ stick: i < 80, pull: i > 10 && i < 80 }), I()],
      // B quieto; A pegado sin tirar (hilo flojo) -> no debería cargar
      slack: i => [I({ stick: i < 80 }), I()],
      // B salta y A suelta con salto
      aJump: i => [I({ stick: i < 90, jump: i >= 70 && i < 90 }), I({ right: i < 60 })],
    };
    for (const [name, fn] of Object.entries(scen)) {
      TYA.UI.show(null, false); TYA.Game.startMatch('caneca', false, 'cafeteria');
      let g = 0; while (G.state !== 'play' && g++ < 600) TYA.Game.update(1 / 60);
      const [A, B] = G.players; let maxCharge = 0, relV = 0, rel = -1;
      for (let i = 0; i < 200; i++) {
        const [a, b] = fn(i); TYA.over[0] = a; TYA.over[1] = b;
        const wasStuck = A.stuck;
        TYA.Game.update(1 / 60);
        maxCharge = Math.max(maxCharge, A.charge);
        if (wasStuck && !A.stuck && rel < 0) { rel = i; relV = Math.round(Math.hypot(A.vx, A.vy)); }
      }
      out[name] = { maxCharge: +maxCharge.toFixed(2), rel, relV, slings: A.stats.slings, rams: A.stats.rams, Bstun: B.stun.toFixed(2), Bx: Math.round(B.x), Ax: Math.round(A.x) };
    }
    TYA.over[0] = TYA.over[1] = null;
    return out;
  });
  console.log(JSON.stringify(res, null, 1)); console.log('ERR', errors.join('\n'));
  await browser.close();
})();
