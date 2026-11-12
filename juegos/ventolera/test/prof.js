// Perfil de CPU en celular (calidad ligera): qué funciones se llevan el tiempo
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const arena = process.env.ARENA || 'medellin', q = process.env.Q || 'ligera';
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(500);
  const cdp = await ctx.newCDPSession(page);
  await page.evaluate(([arena, q]) => { const { Game, Bot } = VTO; Game.setQuality(q); Game.setArena(arena); Game.setMode('duel'); Game.start('duel', 2); VTO.UI.show(null, false);
    const G = Game.G; G.bots = [new Bot(G.birds[0], 4, 2), new Bot(G.birds[1], 9, 2)]; Game.advance(4); }, [arena, q]);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
  await page.waitForTimeout(4000);
  const { profile } = await cdp.send('Profiler.stop');
  const self = new Map(); const byId = new Map(profile.nodes.map(n => [n.id, n]));
  const dt = {}; for (let i = 0; i < profile.samples.length; i++) dt[profile.samples[i]] = (dt[profile.samples[i]] || 0) + (profile.timeDeltas[i] || 0);
  let total = 0;
  for (const n of profile.nodes) { const t = (dt[n.id] || 0) / 1000; total += t; const k = (n.callFrame.functionName || '(anon)') + ':' + n.callFrame.lineNumber; self.set(k, (self.get(k) || 0) + t); }
  const top = [...self].sort((a, b) => b[1] - a[1]).slice(0, 25);
  console.log('total ms', Math.round(total));
  for (const [k, t] of top) console.log(String(Math.round(t)).padStart(6), (t / total * 100).toFixed(1).padStart(5) + '%', k);
  await browser.close();
})();
