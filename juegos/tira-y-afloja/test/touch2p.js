// Dos jugadores en un mismo celular: toques reales (CDP) con varios dedos a la vez
const { chromium } = require('playwright');
const path = require('path');
const W = +(process.env.W || 693), H = +(process.env.H || 272);
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(900);
  await page.tap('#s-title [data-act="play2"]'); await page.waitForTimeout(150);
  await page.tap('[data-act="mode-caneca"]'); await page.waitForTimeout(250);
  if (await page.evaluate(() => TYA.UI.current) === 'arena') await page.tap('#arena-grid .arena:nth-child(1)');
  await page.waitForTimeout(3600);
  await page.screenshot({ path: path.join(__dirname, 'shots', `dual-${W}.png`) });
  const btn = await page.evaluate(() => {
    const o = {};
    document.querySelectorAll('#touch .tcl').forEach((c, ci) => c.querySelectorAll('.tbtn').forEach(b => { const r = b.getBoundingClientRect(); o[ci + ':' + b.dataset.k] = [r.left + r.width / 2, r.top + r.height / 2, r.width]; }));
    return o;
  });
  console.log('botones', JSON.stringify(btn));
  const cdp = await ctx.newCDPSession(page);
  const pts = new Map();
  const send = async type => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: [...pts.entries()].map(([id, p]) => ({ x: p[0], y: p[1], id, radiusX: 9, radiusY: 9 })) });
  const down = async (id, x, y) => { pts.set(id, [x, y]); await send('touchStart'); };
  const up = async id => { const q = pts.get(id); pts.delete(id); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: q[0], y: q[1], id }] }); };
  const held = () => page.evaluate(() => TYA.Touch.state.map(s => Object.keys(s).filter(k => s[k]).join('+') || '-').join(' | '));
  // 1) cuatro dedos a la vez
  const B = btn;
  await down(1, B['0:right'][0], B['0:right'][1]);
  await down(2, B['1:jump'][0], B['1:jump'][1]);
  await down(3, B['3:left'][0], B['3:left'][1]);
  await down(4, B['2:pull'][0], B['2:pull'][1]);
  console.log('4 dedos:', await held());
  await up(2); console.log('suelta salto P1:', await held());
  await up(1); await up(3); await up(4); console.log('todos fuera:', await held());
  // 2) toque rapidísimo (dentro del mismo cuadro): ¿el juego lo ve?
  const jumps = await page.evaluate(() => { const G = TYA.Game.G; return G.players.map(p => p.stats && p.stats.jumps); });
  let seen = 0;
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => { const p = TYA.Game.G.players[0]; p._j = 0; if (!p._hook) { p._hook = true; const e = p.emit.bind(p); p.emit = (n, d) => { if (n === 'jump' || n === 'airjump') p._j++; return e(n, d); }; } });
    await down(5, B['1:jump'][0], B['1:jump'][1]); await up(5);
    await page.waitForTimeout(700);
    seen += await page.evaluate(() => TYA.Game.G.players[0]._j > 0 ? 1 : 0);
  }
  console.log('toques rápidos de ▲ que saltaron:', seen, '/ 10');
  // 3) toque cortísimo (abajo y arriba en el mismo instante) y doble toque rápido: el juego debe ver los dos
  const quick = await page.evaluate(async () => {
    const root = document.getElementById('touch'), b = root.querySelector('.act.left2 .k-jump').getBoundingClientRect();
    const x = b.left + b.width / 2, y = b.top + b.height / 2;
    const ev = (t, id) => root.dispatchEvent(new PointerEvent(t, { pointerId: id, clientX: x, clientY: y, bubbles: true, cancelable: true, pointerType: 'touch' }));
    const p = TYA.Game.G.players[0]; const log = []; const e0 = p.emit.bind(p); p.emit = (n, d) => { if (/jump/.test(n)) log.push(n); return e0(n, d); };
    const wait = ms => new Promise(r => setTimeout(r, ms));
    ev('pointerdown', 11); ev('pointerup', 11); await wait(700);
    const one = log.length;
    ev('pointerdown', 12); ev('pointerup', 12); await wait(70); ev('pointerdown', 13); ev('pointerup', 13); await wait(700);
    p.emit = e0;
    return { one, two: log.slice(one).join('+') };
  });
  console.log('toque cortísimo → saltos:', quick.one, '· doble toque rápido →', quick.two);
  // 4) el celular corta los toques con tres dedos encima: todo se suelta y aparece el aviso
  await down(21, B['0:left'][0], B['0:left'][1]); await down(22, B['1:jump'][0], B['1:jump'][1]); await down(23, B['3:right'][0], B['3:right'][1]);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] }); pts.clear();
  await page.waitForTimeout(250);
  console.log('tras cortar los toques:', await held(), '· aviso:', await page.evaluate(() => { const h = document.querySelector('#touch .thint'); return h && !h.hidden ? h.textContent.slice(0, 40) + '…' : 'no'; }));
  await page.screenshot({ path: path.join(__dirname, 'shots', `dual-hint-${W}.png`) });
  // 5) la pausa sigue funcionando
  await page.tap('#touch .tpause'); await page.waitForTimeout(300);
  console.log('pausa:', await page.evaluate(() => TYA.UI.current));
  console.log('ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
