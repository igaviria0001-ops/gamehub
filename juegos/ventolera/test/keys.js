// Teclado compartido: cada acción de cada jugador llega a su piloto (y a nadie más); tonel; reasignar teclas
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => console.log('ERR', e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(600);
  await page.evaluate(() => localStorage.clear());
  const fmt = r => { const o = []; if (r.dx || r.dy) o.push(`(${r.dx.toFixed(2)},${r.dy.toFixed(2)})`); for (const k of ['fire', 'boost', 'missile']) if (r[k]) o.push(k); if (r.roll) o.push(`tonel(${r.rdx.toFixed(1)},${r.rdy.toFixed(1)})`); return o.join('+') || '-'; };
  const read = () => page.evaluate(() => [0, 1].map(i => VTO.Input.read(i))).then(rs => rs.map(fmt).join(' | '));
  // solapes en las teclas de fábrica
  console.log('solapes:', await page.evaluate(() => { const seen = {}, dup = []; VTO.Input.keymap.forEach((m, i) => Object.entries(m).forEach(([a, l]) => l.forEach(c => { if (seen[c]) dup.push(c + ' ' + seen[c] + '/' + i + a); seen[c] = i + a; }))); return dup.join(', ') || 'ninguno'; }));
  await page.click('[data-act="play2"]');
  await page.waitForTimeout(200);
  const sets = [['KeyW', 'KeyD'], ['KeyS', 'KeyA', 'Space', 'ShiftLeft', 'KeyE'], ['KeyI', 'KeyL'], ['ArrowDown', 'ArrowLeft', 'Semicolon', 'AltRight', 'KeyU'], ['KeyK', 'KeyO', 'Enter', 'Numpad0'],
    ['KeyW', 'KeyA', 'Space', 'ShiftLeft', 'KeyI', 'KeyJ', 'Semicolon', 'AltRight']];
  for (const set of sets) {
    for (const k of set) await page.keyboard.down(k);
    console.log(set.join(' ').padEnd(64), '→', await read());
    for (const k of set) await page.keyboard.up(k);
  }
  // tonel: tecla propia (hacia donde apuntas) y doble toque
  await page.keyboard.down('KeyW'); await page.keyboard.press('KeyC'); console.log('W + C (tonel J1)'.padEnd(64), '→', await read()); await page.keyboard.up('KeyW');
  await page.keyboard.press('KeyH'); console.log('H sola (tonel J2 sin dirección)'.padEnd(64), '→', await read());
  await page.keyboard.press('KeyD'); await page.keyboard.press('KeyD'); console.log('D D rápido (doble toque J1)'.padEnd(64), '→', await read());
  await page.keyboard.press('KeyD'); await page.waitForTimeout(400); await page.keyboard.press('KeyD'); console.log('D … D lento (no es tonel)'.padEnd(64), '→', await read());
  await page.evaluate(() => VTO.Input.setDtap(false));
  await page.keyboard.press('KeyD'); await page.keyboard.press('KeyD'); console.log('D D con doble toque apagado'.padEnd(64), '→', await read());
  await page.evaluate(() => VTO.Input.setDtap(true));
  // reasignar desde Opciones → Teclas
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  await page.click('#s-pause [data-act="options"]'); await page.waitForTimeout(200);
  await page.click('[data-act="keys"]'); await page.waitForTimeout(200);
  await page.click('[data-k="1:fire"]'); await page.keyboard.press('KeyP');
  await page.click('[data-k="0:boost"]'); await page.keyboard.press('Escape');
  console.log('J2 dispara con P:', await page.evaluate(() => VTO.Input.keymap[1].fire.join(',')), '· J1 turbo tras Esc:', await page.evaluate(() => VTO.Input.keymap[0].boost.join(',')), '· pantalla:', await page.evaluate(() => VTO.UI.current));
  await page.click('[data-k="0:fire"]'); await page.keyboard.press('KeyP');
  console.log('P pasa a J1 (y J2 la pierde):', await page.evaluate(() => VTO.Input.keymap.map(m => m.fire.join(',')).join(' | ')));
  console.log('guardado:', await page.evaluate(() => JSON.parse(localStorage.getItem('vto_keys'))[0].fire.join(',')));
  await page.screenshot({ path: path.resolve(__dirname, 'shots/keys.png') });
  await page.click('[data-act="keysReset"]');
  console.log('de fábrica:', await page.evaluate(() => VTO.Input.keymap.map(m => m.fire.join(',')).join(' | ')));
  await page.click('#s-keys [data-act="back"]'); await page.click('#s-options [data-act="back"]'); await page.waitForTimeout(100);
  console.log('volver lleva a:', await page.evaluate(() => VTO.UI.current));
  await browser.close();
})();
