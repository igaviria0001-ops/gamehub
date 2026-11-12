const { chromium } = require('playwright');
const path = require('path');
const id = process.argv[2] || 'laboratorio';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1000);
  const out = await page.evaluate(id => {
    const G = TYA.Game.G;
    TYA.Game.startMatch('caneca', false, id); G.winsNeeded = 999;
    G.bots = [new Bot(0, 1), new Bot(1, 1)];
    const hist = [], deaths = [];
    let prev = G.wins.slice();
    for (let i = 0; i < 60 * 120; i++) {
      TYA.Game.update(1 / 60);
      if (G.state === 'play') hist.push(G.players.map(p => [Math.round(p.x), Math.round(p.y), Math.round(p.vx), Math.round(p.vy), +p.mass.toFixed(1), p.stuck ? 'S' : '', p.stun > 0 ? 'X' : '']).flat().join(','));
      if (hist.length > 50) hist.shift();
      if (G.wins[0] !== prev[0] || G.wins[1] !== prev[1]) {
        deaths.push({ t: +G.roundT.toFixed(1), loser: G.wins[0] !== prev[0] ? 1 : 0, last: hist.filter((_, k) => k % 6 === 0).slice(-8) });
        prev = G.wins.slice(); hist.length = 0;
        if (deaths.length >= 6) break;
      }
    }
    return deaths.filter(d => d.t < 8);
  }, id);
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
