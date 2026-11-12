const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => console.log('ERR', e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => {
    const { Game, Bot } = VTO; Game.cfg.species = ['condor', 'colibri']; Game.cfg.looks = [0, 0];
    Game.start('duel', 2); const G = Game.G; G.paused = true;
    G.bots = [new Bot(G.birds[0], 3, 1), new Bot(G.birds[1], 9, 1)];
    const out = []; let t = 0;
    const E = VTO.Bird.prototype.emit;
    VTO.Bird.prototype.emit = function (ty, d = {}) { if (['hurt', 'down', 'launch', 'lockOn', 'crash'].includes(ty)) out.push(`${t.toFixed(2)} ${G.state} J${this.id + 1} ${ty} ${d.n ? Math.round(d.n) + ' ' + d.kind : ''} hp=${Math.round(this.hp)} x=${Math.round(this.x)} y=${Math.round(this.y)}`); return E.call(this, ty, d); };
    while (t < 12 && G.round < 2) { Game.advance(1 / 120); t += 1 / 120; }
    VTO.Bird.prototype.emit = E;
    return out.slice(0, 60);
  });
  console.log(r.join('\n'));
  await browser.close();
})();
