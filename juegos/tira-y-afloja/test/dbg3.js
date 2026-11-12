const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => console.log('pageerror: ' + e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(800);
  const out = await page.evaluate(() => {
    const G = TYA.Game.G, Game = TYA.Game;
    const I = (o = {}) => Object.assign({ left: false, right: false, jump: false, stick: false, pull: false, release: false }, o);
    const setup = (ax, bx, ma, mb, len) => { Game.startMatch('caneca', false); const [A, B] = G.players; A.reset(ax, ARENA.deskY, ma); B.reset(bx, ARENA.deskY, mb); G.rope.reset(A.x, A.y, B.x, B.y, len); G.state = 'play'; G.canControl = true; };
    const log = [];
    const [A, B] = G.players;
    // tirachinas: ambos pegados con el hilo estirado, Fresa se suelta
    setup(650, 840, 3, 3, 150);
    for (let i = 0; i < 70; i++) {
      TYA.over[0] = i < 30 ? I({ stick: true }) : I(); TYA.over[1] = I({ stick: true });
      Game.update(1 / 60);
      if (i % 3 === 0 || (i > 28 && i < 45)) log.push(['S', i, Math.round(A.x), Math.round(A.y), Math.round(A.vx), A.stuck, Math.round(B.x), Math.round(B.y), B.stuck, +B.stun.toFixed(2), Math.round(G.rope.tension), G.rope.strain.toFixed(2), A.stats.slings].join(' '));
    }
    // embestida: liviano contra pesado
    setup(1060, 1250, 1.5, 5, 400);
    for (let i = 0; i < 50; i++) {
      TYA.over[0] = I({ right: true }); TYA.over[1] = I();
      Game.update(1 / 60);
      if (i % 2 === 0) log.push(['R', i, Math.round(A.x), Math.round(A.y), Math.round(A.vx), Math.round(A.vy), Math.round(B.x), Math.round(B.y), Math.round(B.vx), +B.stun.toFixed(2), Math.round(G.rope.tension)].join(' '));
    }
    return log;
  });
  console.log(out.join('\n'));
  await browser.close();
})();
