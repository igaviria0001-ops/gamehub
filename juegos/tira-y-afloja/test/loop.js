// Reproduce: un jugador tira sin parar. ¿Qué pasa?
const { chromium } = require('playwright');
const path = require('path');
const scen = process.argv[2] || 'pullA';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1000);
  const out = await page.evaluate(scen => {
    TYA.UI.show(null, false);
    TYA.Game.startMatch('caneca', false, 'pupitre');
    const G = TYA.Game.G; G.hintsT = 0;
    let g = 0; while (G.state !== 'play' && g++ < 600) TYA.Game.update(1 / 60);
    const I = (o = {}) => Object.assign({ left: false, right: false, jump: false, stick: false, pull: false, release: false }, o);
    const log = []; let rams = 0;
    const [A, B] = G.players;
    for (let i = 0; i < 60 * 8; i++) {
      if (scen === 'pullA') { TYA.over[0] = I({ pull: i < 60 * 4 }); TYA.over[1] = I(); }
      if (scen === 'pullBoth') { TYA.over[0] = I({ pull: true }); TYA.over[1] = I({ pull: true }); }
      if (scen === 'pullAtoward') { TYA.over[0] = I({ pull: true, right: i > 120 }); TYA.over[1] = I(); }
      const r0 = A.stats.rams + B.stats.rams;
      TYA.Game.update(1 / 60);
      if (A.stats.rams + B.stats.rams > r0) rams++;
      if (i % 20 === 0) log.push([+(i / 60).toFixed(2), Math.round(G.rope.len), A.mass.toFixed(1), B.mass.toFixed(1), Math.round(Math.hypot(B.x - A.x, B.y - A.y)), Math.round(A.r + B.r), G.rope.strain.toFixed(2), Math.round(G.rope.tension), A.stun.toFixed(2), B.stun.toFixed(2), A.onGround ? 'g' : 'a', B.onGround ? 'g' : 'a', Math.round(A.y), Math.round(B.y), G.state].join(' '));
    }
    TYA.over[0] = null; TYA.over[1] = null;
    return { rams, log };
  }, scen);
  console.log('rams', out.rams); console.log(out.log.join('\n'));
  await browser.close();
})();
