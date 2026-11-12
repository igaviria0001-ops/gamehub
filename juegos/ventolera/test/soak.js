// Pilotos automáticos 3 minutos simulados por pájaro: choques, pérdidas, posadas, valores raros
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => console.log('ERR', e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => {
    const { Game, Pilot } = VTO, out = [];
    for (const sp of ['guacamaya', 'colibri', 'tucan', 'condor']) {
      Game.cfg.species = [sp, sp]; Game.cfg.looks = [0, 1];
      Game.startFree(2); const G = Game.G; G.paused = true;
      G.pilots = [new Pilot(G.birds[0], 3), new Pilot(G.birds[1], 9)];
      const c = { crash: 0, stall: 0, land: 0, flap: 0, nan: 0, ceil: 0, lowT: 0 };
      const kinds = {};
      const E = VTO.Bird.prototype.emit; VTO.Bird.prototype.emit = function (t, d = {}) { if (t === 'crash') { const k = d.kind + (this.y > this.G.world.groundY(this.x) - 120 ? '-bajo' : ''); kinds[k] = (kinds[k] || 0) + 1; } if (t === 'stall') c.stall++; if (t === 'land') c.land++; return E.call(this, t, d); };
      for (let i = 0; i < 120 * 180; i++) {
        Game.step(1 / 120);
        for (const b of G.birds) { if (!isFinite(b.x + b.y + b.s + b.a)) c.nan++; if (b.y < 200) c.ceil++; }
      }
      G.birds.forEach(b => { c.crash += b.stats.crashes; c.flap += b.stats.flaps; });
      c.kinds = kinds; VTO.Bird.prototype.emit = E;
      out.push(sp + ' ' + JSON.stringify(c));
    }
    return out;
  });
  console.log(r.join('\n'));
  await browser.close();
})();
