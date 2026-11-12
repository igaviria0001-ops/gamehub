// Botones táctiles en cada forma de jugar: un toque de ▲ (y del jugador 2 si hay) llega al juego
const { chromium } = require('playwright');
const path = require('path');
const PATHS = [
  ['contra la máquina', ['playbot', 'mode-caneca']],
  ['2 jugadores · gol', ['play2', 'mode-gol']],
  ['2 jugadores · rey', ['play2', 'mode-rey']],
  ['tutorial en pareja', ['howto', 'tut-pair']],
  ['tutorial solo', ['howto', 'tut-solo']],
  ['entrenamiento', ['entreno', '#entreno button']],
  ['retos', ['retos', '#retos button']],
];
(async () => {
  const browser = await chromium.launch();
  for (const [name, steps] of PATHS) {
    const ctx = await browser.newContext({ viewport: { width: 693, height: 272 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, 'index.html'));
    await page.waitForTimeout(700);
    try {
      for (const s of steps) {
        const sel = s.startsWith('#') ? s : `[data-act="${s}"]`;
        const el = await page.$$(sel); let done = false;
        for (const e of el) if (await e.isVisible()) { await e.tap(); done = true; break; }
        if (!done) throw new Error('no encontré ' + sel);
        await page.waitForTimeout(250);
        if (await page.evaluate(() => TYA.UI.current) === 'arena') { await page.tap('#arena-grid .arena:nth-child(1)'); await page.waitForTimeout(250); }
      }
      await page.waitForTimeout(3300);
      const info = await page.evaluate(() => {
        const t = document.getElementById('touch'); if (!t || t.hidden) return null;
        const c = sel => { const b = t.querySelectorAll(sel); return [...b].map(x => { const q = x.getBoundingClientRect(); return [q.left + q.width / 2, q.top + q.height / 2]; }); };
        const pz = t.querySelector('.tpause').getBoundingClientRect();
        return { mode: t.classList.contains('dual') ? 'dual' : 'single', jumps: c('.k-jump'), pause: [pz.left, pz.top, pz.right, pz.bottom], ui: TYA.UI.current };
      });
      if (!info) { console.log(name.padEnd(22), 'SIN BOTONES (ui=' + await page.evaluate(() => TYA.UI.current) + ')'); await ctx.close(); continue; }
      const cdp = await ctx.newCDPSession(page);
      const pts = info.jumps.map((j, i) => ({ x: j[0], y: j[1], id: 30 + i }));
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts });
      await page.waitForTimeout(60);
      const st = await page.evaluate(() => TYA.Touch.state.map(s => s.jump));
      for (const p of pts) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [p] });
      console.log(name.padEnd(22), info.mode.padEnd(6), '▲ llega:', st.slice(0, info.jumps.length).join(','), '· pausa en', info.pause.map(Math.round).join(','), errors.length ? 'ERR ' + errors.join(' | ') : '');
    } catch (e) { console.log(name, 'FALLÓ', e.message); }
    await ctx.close();
  }
  await browser.close();
})();
