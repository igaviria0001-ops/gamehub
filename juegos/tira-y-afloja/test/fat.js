// Dedazos: toques con error de pulgar (σ ≈ 2,5 mm) en cada botón, dos jugadores en un celular.
// Cuenta aciertos, botón equivocado (sobre todo ● sin querer) y toques ignorados. FILE=old.html compara.
const { chromium } = require('playwright');
const path = require('path');
const FILE = process.env.FILE || 'index.html', SIG = +(process.env.SIG || 16), N = +(process.env.N || 40);
const W = +(process.env.W || 693), H = +(process.env.H || 272);
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('file://' + path.resolve(__dirname, FILE));
  await page.waitForTimeout(900);
  await page.tap('#s-title [data-act="' + (process.env.BOT ? 'playbot' : 'play2') + '"]'); await page.waitForTimeout(150);
  await page.tap('[data-act="mode-caneca"]'); await page.waitForTimeout(250);
  if (await page.evaluate(() => TYA.UI.current) === 'arena') await page.tap('#arena-grid .arena:nth-child(1)');
  await page.waitForTimeout(1500);
  if (process.env.BIG) await page.evaluate(() => TYA.Touch.setBig && TYA.Touch.setBig(true));
  await page.waitForTimeout(200);
  const btns = await page.evaluate(() => [...document.querySelectorAll('#touch .tbtn')].map(b => { const r = b.getBoundingClientRect(); const cl = b.closest('.tcl'); const p = cl.classList.contains('right2') || cl.classList.contains('right') && document.querySelector('#touch').classList.contains('dual') && cl.classList.contains('move') ? 1 : 0; return { k: b.dataset.k, p, x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; }));
  const cdp = await ctx.newCDPSession(page);
  const res = { ok: 0, wrong: 0, ign: 0, stickBad: 0, otherPlayer: 0, n: 0 }, bad = {};
  for (const b of btns) for (let i = 0; i < N; i++) {
    const x = b.x + gauss() * SIG, y = Math.min(H - 1, b.y + gauss() * SIG);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
    const st = await page.evaluate(() => TYA.Touch.state.map(s => Object.keys(s).filter(k => s[k])));
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x, y, id: 1 }] });
    await page.evaluate(() => { TYA.Touch.hide(); TYA.Touch.show(document.querySelector('#touch').classList.contains('dual') ? 'dual' : 'single'); });
    res.n++;
    const mine = st[b.p], other = st[1 - b.p];
    if (other.length) res.otherPlayer++;
    if (mine.length === 1 && mine[0] === b.k && !other.length) res.ok++;
    else if (!mine.length && !other.length) res.ign++;
    else { res.wrong++; const key = `${b.p + 1}${b.k}->${mine.join('+') || '(otro)'}`; bad[key] = (bad[key] || 0) + 1; if (mine.includes('stick') && b.k !== 'stick') res.stickBad++; }
  }
  const pc = v => (100 * v / res.n).toFixed(1) + '%';
  console.log(`${FILE} σ=${SIG}px  aciertos ${pc(res.ok)} · equivocado ${pc(res.wrong)} (● sin querer ${res.stickBad}, del otro jugador ${res.otherPlayer}) · ignorados ${pc(res.ign)}`);
  console.log('  errores:', Object.entries(bad).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => k + ' ×' + v).join(', '));
  await browser.close();
})();
