// Capadocia: posarse en un globo (y viajar), rebotar en la tela, subir en una térmica; fotos de cerca
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => {
    const { Game } = VTO; Game.setArena('capadocia'); Game.start('free', 2); VTO.UI.show(null, false);
    const G = Game.G; G.hintT = 0; G.bots = [null, null]; G.cratesOn = false;
    const W = G.world, H = W.hotair[2], b = G.birds[0], out = {};
    // 1) posarse: soltarlo justo encima del globo, lento
    b.reset(H.x, H.y - H.r - 60, 1); b.vx = 30; b.vy = 80; b.s = 85;
    G.birds[1].reset(300, 300, 1);
    for (let i = 0; i < 90 && !b.perch; i++) Game.advance(1 / 60);
    out.perch = b.perch ? b.perch.kind : null;
    const x0 = H.x, bx0 = b.x; Game.advance(3);
    out.carried = [Math.round(H.x - x0), Math.round(b.x - bx0), b.perch ? b.perch.kind : null, Math.round(b.y - (H.y - H.r))];
    // 2) rebote: de lado contra la tela
    b.reset(H.x - 260, H.y, 1); b.vx = 520; b.vy = 0; const hp0 = b.hp;
    let bounced = false; G.events.length = 0;
    for (let i = 0; i < 60; i++) { Game.advance(1 / 60); if (b.vx < 0) bounced = true; }
    out.bounce = { bounced, vx: Math.round(b.vx), hpLost: hp0 - b.hp, stun: b.stun };
    // 3) térmica: planear quieto dentro de la columna vs fuera
    const T = W.thermals[0];
    const climb = (x) => { b.reset(x, 1300, 1); b.a = 0; b.vx = 380; b.vy = 0; const y0 = b.y; for (let i = 0; i < 60; i++) { Game.advance(1 / 60); } return Math.round(y0 - b.y); };
    out.thermIn = climb(T.x - 100); out.thermOut = climb(T.x + 900);
    out.k = T.k.toFixed(2);
    return out;
  });
  console.log(JSON.stringify(r));
  const shot = async (name, fn, arg) => { await page.evaluate(fn, arg); await page.waitForTimeout(250); await page.screenshot({ path: path.join(__dirname, 'shots', name) }); };
  await shot('capa-posado.png', () => { const { Game } = VTO, G = Game.G, H = G.world.hotair[2], b = G.birds[0]; b.reset(H.x, H.y - H.r - 40, 1); b.vx = 20; b.vy = 60; for (let i = 0; i < 90 && !b.perch; i++) Game.advance(1 / 60); G.birds[1].reset(H.x + 300, H.y - 100, -1); Game.updateCamera(0, true); });
  await shot('capa-suelo.png', () => { const { Game } = VTO, G = Game.G; G.birds[0].reset(700, 1880, 1); G.birds[1].reset(1150, 1800, -1); Game.advance(0.05); G.birds[0].reset(700, 1880, 1); G.birds[1].reset(1150, 1800, -1); Game.updateCamera(0, true); });
  await shot('capa-termica.png', () => { const { Game } = VTO, G = Game.G, T = G.world.thermals[0]; G.birds[0].reset(T.x, 1200, 1); G.birds[1].reset(T.x + 400, 1000, -1); Game.advance(0.05); G.birds[0].reset(T.x, 1200, 1); G.birds[1].reset(T.x + 400, 1000, -1); Game.updateCamera(0, true); });
  console.log('ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
