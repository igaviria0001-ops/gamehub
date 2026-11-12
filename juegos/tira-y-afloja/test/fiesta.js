// Uso: node fiesta.js [shots|sim] [arena]
const { chromium } = require('playwright');
const path = require('path');
const what = process.argv[2] || 'shots', arena = process.argv[3] || 'pupitre';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL/.test(m.text())) errors.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1200);
  if (what === 'menu') {
    await page.evaluate(() => { TYA.UI.show('title', false); });
    await page.keyboard.press('Space'); await page.waitForTimeout(300);
    await page.click('[data-act="mode-caneca"]'); await page.waitForTimeout(400);
    await page.click('#btn-fiesta'); await page.waitForTimeout(300);
    await page.screenshot({ path: 'shots/f-menu.png' });
    await page.click('[data-act="arena-random"]'); await page.waitForTimeout(500);
    await page.screenshot({ path: 'shots/f-start.png' });
    console.log('fiesta on', await page.evaluate(() => [Fiesta.on, TYA.Game.G.fiestaMatch, Fiesta.cur]));
  } else if (what === 'shots') {
    const ids = (process.argv[4] || 'luna,caliente,congelado,jabon,gigantes,pulgas,tijeras,ventarron').split(',');
    for (const id of ids) {
      await page.evaluate(([id, arena]) => {
        TYA.UI.show(null, false);
        TYA.Game.startMatch('caneca', false, arena, true);
        const G = TYA.Game.G; G.bots = [new Bot(0, 1), new Bot(1, 1)]; G.hintsT = 0;
        Fiesta.state.bag = [id]; TYA.Game.resetRound();
      }, [id, arena]);
      await page.waitForTimeout(380);
      if (id === 'luna' || id === 'gigantes') await page.screenshot({ path: `shots/f-${id}-spin.png` });
      await page.waitForTimeout(900);
      await page.screenshot({ path: `shots/f-${id}-card.png` });
      // avanzar el juego hasta un momento interesante
      await page.evaluate(id => {
        const G = TYA.Game.G, F = Fiesta.state;
        let guard = 0;
        const want = () => id === 'ventarron' ? F.phase === 'gust' && Math.abs(ARENA.mods.push) > 1500
          : id === 'tijeras' ? F.phase === 'warn' && F.phaseT < 0.8 : G.state === 'play' && G.roundT > 3.5;
        while (!want() && guard++ < 60 * 40) TYA.Game.update(1 / 60);
      }, id);
      await page.waitForTimeout(100);
      await page.screenshot({ path: `shots/f-${id}-play.png` });
    }
  } else {
    const out = await page.evaluate(([arena, secs]) => {
      const G = TYA.Game.G;
      const res = { byMod: {}, nan: 0, maxV: 0, rounds: 0 };
      const arenas = arena === 'all' ? ARENA_LIST.map(d => d.id) : [arena];
      for (const a of arenas) {
        TYA.Game.startMatch('caneca', false, a, true); G.winsNeeded = 999;
        G.bots = [new Bot(0, 1), new Bot(1, 1)];
        let prev = G.wins.slice(), mod = Fiesta.cur, prevRound = G.round;
        for (let i = 0; i < 60 * secs; i++) {
          TYA.Game.update(1 / 60);
          if (G.round !== prevRound) { prevRound = G.round; mod = Fiesta.cur; }
          for (const p of G.players) { if (!isFinite(p.x) || !isFinite(p.y)) res.nan++; res.maxV = Math.max(res.maxV, Math.hypot(p.vx, p.vy)); }
          if (G.wins[0] !== prev[0] || G.wins[1] !== prev[1]) {
            const r = res.byMod[mod] || (res.byMod[mod] = { n: 0, t: 0, w: [0, 0], draws: 0 });
            r.n++; r.t += G.roundT; r.w[G.wins[0] !== prev[0] ? 0 : 1]++; res.rounds++;
            prev = G.wins.slice();
          }
        }
      }
      for (const k in res.byMod) res.byMod[k].t = +(res.byMod[k].t / res.byMod[k].n).toFixed(1);
      res.maxV = Math.round(res.maxV);
      return res;
    }, [arena, +(process.argv[4] || 240)]);
    console.log(JSON.stringify(out));
  }
  console.log('ERRORS', errors.join('\n'));
  await browser.close();
})();
