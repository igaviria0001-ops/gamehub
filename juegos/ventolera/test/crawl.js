// Recorre los menús en PC con teclado y ratón: cada botón hace algo, Tab y flechas mueven de a uno, Escape vuelve, sin errores
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(800);
  const cur = () => page.evaluate(() => VTO.UI.current);
  const focusName = () => page.evaluate(() => (document.activeElement && (document.activeElement.dataset.act || document.activeElement.dataset.stage || document.activeElement.textContent.trim().slice(0, 18))) || '-');
  // Tab y flechas
  const seq = [];
  for (const k of ['Tab', 'Tab', 'ArrowRight', 'ArrowLeft', 'ArrowDown']) { await page.keyboard.press(k); seq.push(k + '→' + await focusName()); }
  console.log('foco:', seq.join(' · '));
  // cada pantalla del título y vuelta con Escape
  for (const act of ['birds', 'howto', 'options', 'logros', 'trav']) {
    await page.evaluate(a => { VTO.UI.show('title', false); document.querySelector(`#s-title [data-act="${a}"]`).click(); }, act);
    await page.waitForTimeout(150); const a = await cur();
    await page.keyboard.press('Escape'); await page.waitForTimeout(150);
    console.log(`${act}: abre ${a} · Escape → ${await cur()}`);
  }
  // opciones → teclas → atrás
  await page.evaluate(() => { VTO.UI.show('title', false); document.querySelector('#s-title [data-act="options"]').click(); });
  await page.waitForTimeout(150);
  const keysBtn = await page.$('#s-options [data-act="keys"]'); if (keysBtn) { await keysBtn.click(); await page.waitForTimeout(150); console.log('opciones → teclas:', await cur()); await page.keyboard.press('Escape'); await page.waitForTimeout(150); console.log('Escape →', await cur()); }
  // preparar partida: cambiar modo y escenario por todos y volver
  await page.evaluate(() => { VTO.UI.show('title', false); document.querySelector('#s-title [data-act="birds"]').click(); });
  const modes = [], arenas = [];
  for (let i = 0; i < 5; i++) { await page.click('#s-birds [data-act="modeNext"]'); modes.push(await page.textContent('#modeName')); }
  for (let i = 0; i < 5; i++) { await page.click('#s-birds [data-act="arenaNext"]'); arenas.push(await page.textContent('#arenaName')); }
  console.log('modos:', modes.join(', '), '| escenarios:', arenas.join(', '));
  await page.click('#s-birds [data-act="done"]'); await page.waitForTimeout(150);
  console.log('Listo →', await cur(), '· botón 2 jugadores dice:', await page.textContent('[data-act="play2"]'));
  // jugar, pausa con Escape, opciones desde la pausa, seguir
  await page.click('[data-act="play2"]'); await page.waitForTimeout(400);
  await page.keyboard.press('Escape'); await page.waitForTimeout(200); console.log('en juego Escape →', await cur());
  const pbtns = await page.$$eval('#s-pause button', bs => bs.map(b => (b.dataset.act || '?') + (b.offsetParent ? '' : '(oculto)')));
  console.log('botones de pausa:', pbtns.join(', '));
  await page.keyboard.press('Escape'); await page.waitForTimeout(200); console.log('Escape en pausa →', await cur(), '· pausado:', await page.evaluate(() => VTO.Game.G.paused));
  // con la ventana sin foco se pausa
  await page.evaluate(() => dispatchEvent(new Event('blur'))); await page.waitForTimeout(100); console.log('ventana sin foco →', await cur());
  await page.evaluate(() => document.querySelector('#s-pause [data-act="toTitle"]').click()); await page.waitForTimeout(200); console.log('pausa → inicio:', await cur(), VTO_state = await page.evaluate(() => VTO.Game.G.state));
  console.log('ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
