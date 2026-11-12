// Campaña con la máquina: el jugador 1 (guion simple) va a la puerta y el bot lo sigue
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await browser.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(900);
  const rooms = (process.argv[2] || '1-1,2-1,3-1,5-1').split(',');
  for (const id of rooms) {
    const r = await page.evaluate((id) => {
      const G = TYA.Game.G; TYA.UI.show(null, false); G.campStage = id; TYA.Game.startMatch('campana', true, 'campana');
      let g = 0; while (G.state !== 'play' && g++ < 400) TYA.Game.update(1 / 60);
      const E = ARENA.L.exit, P = G.players; let m = { stall: 0 };
      for (let f = 0; f < 60 * 40; f++) {
        const p = P[0], dir = Math.sign(E.x - p.x), ahead = ARENA.groundBelow(p.x + dir * (p.r + 20), p.y - 40);
        const gap = p.onGround && ahead > p.y + p.r + 120;
        m.stall = p.onGround && Math.abs(p.vx) < 20 ? m.stall + 1 : 0;
        const jump = (gap || m.stall > 6) && p.onGround ? (m.j = 26) : (m.j = Math.max(0, (m.j || 0) - 1));
        TYA.over[0] = { left: dir < 0 && Math.abs(E.x - p.x) > 10, right: dir > 0 && Math.abs(E.x - p.x) > 10, jump: m.j > 0, stick: false, pull: false, release: false };
        TYA.Game.update(1 / 60);
        const S = Campaign.state; if (S.result || G.state === 'matchEnd') break;
      }
      TYA.over[0] = null;
      const S = Campaign.state;
      return { id, win: !!S.result, t: +S.t.toFixed(1), falls: S.falls, why: S.why || '', bot: [P[1].x | 0, P[1].y | 0], me: [P[0].x | 0, P[0].y | 0] };
    }, id);
    console.log(JSON.stringify(r));
  }
  console.log('ERR', errors.join(' | ')); await browser.close();
})();
