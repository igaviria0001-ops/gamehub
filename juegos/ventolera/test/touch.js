// Táctil con dos jugadores en un celular: palancas flotantes, varios dedos, tonel con doble toque, toques cortísimos, corte del celular, pausa
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 693, height: 272 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(900);
  await page.tap('[data-act="play2"]'); await page.waitForTimeout(600); await page.screenshot({ path: path.join(__dirname, 'shots', 'touch-layout.png') });
  const B = await page.evaluate(() => { const o = {}; document.querySelectorAll('#touch .tgrp').forEach(g => { const p = g.classList.contains('p1') ? 'p2' : 'p1'; if (g.classList.contains('tstick')) { const r = g.querySelector('.tpad').getBoundingClientRect(); o[p + 'stick'] = [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2), Math.round(r.width), Math.round(r.height)]; } g.querySelectorAll('.tbtn').forEach(b => { const r = b.getBoundingClientRect(); o[p + b.dataset.k] = [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2), Math.round(r.width), Math.round(r.height)]; }); }); return o; });
  console.log('zonas', JSON.stringify(B));
  const cdp = await ctx.newCDPSession(page);
  const pts = new Map();
  const send = async type => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: [...pts].map(([i, p]) => ({ x: p[0], y: p[1], id: i })) });
  const down = async (id, x, y) => { pts.set(id, [x, y]); await send('touchStart'); };
  const move = async (id, x, y) => { pts.set(id, [x, y]); await send('touchMove'); };
  const up = async id => { const q = pts.get(id); pts.delete(id); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: q[0], y: q[1], id }] }); };
  const held = async (w = 120) => { await page.waitForTimeout(w); return page.evaluate(() => VTO.Touch.state.map(s => { const o = []; if (s.dx || s.dy) o.push(`(${s.dx.toFixed(2)},${s.dy.toFixed(2)})`); for (const k of ['fire', 'boost', 'missile']) if (s[k]) o.push(k); if (s.roll) o.push('tonel'); return o.join('+') || '-'; }).join(' | ')); };
  const [s1x, s1y] = B.p1stick, [s2x, s2y] = B.p2stick;
  await down(1, s1x, s1y); await move(1, s1x, s1y - 40);
  await down(2, B.p1fire[0], B.p1fire[1]); await down(3, s2x + 10, s2y + 10); await move(3, s2x - 30, s2y + 10);
  await down(4, B.p2fire[0], B.p2fire[1]); await down(7, B.p2boost[0], B.p2boost[1]); await down(8, B.p1missile[0], B.p1missile[1]);
  console.log('6 dedos (J1 arriba, J2 izquierda):', await held());
  await move(1, s1x + 40, s1y + 40); console.log('J1 gira la palanca abajo-derecha:', await held());
  await move(1, B.p1boost[0], B.p1boost[1]); console.log('J1 arrastra hasta el turbo (sigue siendo palanca):', await held());
  for (const id of [1, 2, 3, 4, 7, 8]) await up(id);
  console.log('todos fuera:', await held());
  await down(5, s1x, s1y); await move(5, s1x + 6, s1y); console.log('palanca casi quieta (zona muerta):', await held()); await up(5);
  await down(6, 346, 120); console.log('toque en el centro (nada):', await held()); await up(6);
  // tonel: doble toque y arrastrar (ya en vuelo)
  await page.waitForFunction(() => VTO.Game.G.state === 'play'); await page.waitForTimeout(300);
  console.log('estado al probar el tonel:', await page.evaluate(() => VTO.Game.G.state + ' perch=' + !!VTO.Game.G.birds[0].perch));
  await down(9, s1x, s1y); await up(9); await page.waitForTimeout(80); await down(10, s1x, s1y); await move(10, s1x, s1y - 15); await move(10, s1x, s1y - 45);
  console.log('doble toque + arrastre arriba (J1):', await held(10), '· hizo tonel:', await page.evaluate(() => VTO.Game.G.birds[0].rollCd > 0)); await up(10);
  await page.waitForTimeout(400);
  await down(11, s2x, s2y); await move(11, s2x - 45, s2y); await page.waitForTimeout(200); console.log('arrastre normal J2 (no es tonel):', await held(10), '· hizo tonel:', await page.evaluate(() => VTO.Game.G.birds[1].rollCd > 0)); await up(11);
  // toque cortísimo de misil: ¿el piloto lo ve? (y dos seguidos = dos misiles)
  await page.waitForTimeout(600);
  const quick = await page.evaluate(async () => {
    const root = document.getElementById('touch'), r = root.querySelector('.p0 .k-missile').getBoundingClientRect();
    const ev = (t, id) => root.dispatchEvent(new PointerEvent(t, { pointerId: id, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true, cancelable: true, pointerType: 'touch' }));
    const b = VTO.Game.G.birds[0]; b.reset(1200, 500, 1); b.missiles = 4; const f0 = b.stats.missiles;
    ev('pointerdown', 31); ev('pointerup', 31); await new Promise(r => setTimeout(r, 700));
    const one = b.stats.missiles - f0;
    ev('pointerdown', 32); ev('pointerup', 32); await new Promise(r => setTimeout(r, 650)); ev('pointerdown', 33); ev('pointerup', 33); await new Promise(r => setTimeout(r, 300));
    return [one, b.stats.missiles - f0 - one, VTO.Game.G.state];
  });
  console.log('misil con toque cortísimo:', quick[0], '· dos toques:', quick[1], '· estado', quick[2]);
  await down(21, s1x, s1y); await move(21, s1x, s1y - 40); await down(22, s2x, s2y); await down(23, B.p2fire[0], B.p2fire[1]);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] }); pts.clear();
  console.log('tras corte del celular:', await held(), '· aviso:', await page.evaluate(() => !document.querySelector('#touch .thint').hidden));
  await page.tap('#touch .tpause'); await page.waitForTimeout(300);
  console.log('pausa:', await page.evaluate(() => VTO.UI.current));
  await page.screenshot({ path: path.join(__dirname, 'shots', 'pause-cel.png') });
  console.log('ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
