// Recorrido completo de menús y modos con clics y teclado; junta errores de la página
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const issues = [];
  const run = async (name, touch, fn) => {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    const errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
    page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|net::/.test(m.text())) errors.push('console: ' + m.text()); });
    await page.goto('file://' + path.resolve(__dirname, 'index.html') + (touch ? '?touch=1' : ''));
    await page.waitForTimeout(900);
    const ui = () => page.evaluate(() => TYA.UI.current);
    const sim = (secs) => page.evaluate(s => { for (let k = 0; k < 60 * s; k++) TYA.Game.update(1 / 60); }, secs);
    try { await fn(page, ui, sim); } catch (e) { errors.push('script: ' + e.message.split('\n')[0]); }
    if (errors.length) issues.push([name, errors.slice(0, 5)]);
    console.log(name.padEnd(28), errors.length ? 'ERRORES: ' + errors.length : 'ok');
    await page.close();
  };
  const click = (page, sel) => page.click(sel, { timeout: 3000 });

  await run('menús y vuelta', false, async (page, ui) => {
    for (const act of ['play2', 'playbot', 'howto', 'options', 'daily', 'records', 'retos']) {
      await click(page, `#s-title [data-act="${act}"]`); await page.waitForTimeout(150);
      const cur = await ui(); if (!cur || cur === 'title') throw new Error('no abrió ' + act);
      await page.keyboard.press('Escape'); await page.waitForTimeout(150);
      if ((await ui()) !== 'title') throw new Error('Escape no volvió desde ' + act + ' (' + (await ui()) + ')');
    }
    // navegación con flechas y espacio
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowUp');
  });

  for (const vs of ['play2', 'playbot']) {
    for (const mode of ['caneca', 'chicles', 'rey', 'gol', 'escalada', 'fuga', 'jefe']) {
      await run(`${vs} ${mode}`, false, async (page, ui, sim) => {
        await click(page, `#s-title [data-act="${vs}"]`); await page.waitForTimeout(120);
        await click(page, `[data-act="mode-${mode}"]`); await page.waitForTimeout(250);
        const cur = await ui();
        if (cur === 'arena') { await click(page, '#arena-grid .arena:nth-child(2)'); }
        else if (cur === 'levels') { await click(page, '#levels .lvl:nth-child(1)'); }
        else if (cur === 'jefes') { await click(page, '#jefes .mode:nth-child(2)'); }
        await page.waitForTimeout(200);
        if ((await ui()) !== null) throw new Error('no empezó, pantalla ' + (await ui()));
        await sim(6);
        await page.keyboard.press('Escape'); await page.waitForTimeout(120);
        if ((await ui()) !== 'pause') throw new Error('no pausó');
        await click(page, '#s-pause [data-act="resume"]'); await page.waitForTimeout(100);
        await sim(3);
        await page.keyboard.press('KeyP'); await page.waitForTimeout(100);
        await click(page, '#s-pause [data-act="restart"]'); await page.waitForTimeout(150);
        await sim(4);
        await page.keyboard.press('Escape'); await page.waitForTimeout(100);
        await click(page, '#s-pause [data-act="howto"]'); await page.waitForTimeout(100);
        await page.keyboard.press('Escape'); await page.waitForTimeout(100);
        if ((await ui()) !== 'pause') throw new Error('Cómo jugar desde la pausa no volvió a la pausa (' + (await ui()) + ')');
        await click(page, '#s-pause [data-act="menu"]'); await page.waitForTimeout(150);
        if ((await ui()) !== 'title') throw new Error('Salir al menú no volvió al título');
      });
    }
  }

  await run('retos: lista, pausa, otro reto', false, async (page, ui, sim) => {
    await click(page, '#s-title [data-act="retos"]'); await page.waitForTimeout(150);
    await click(page, '#retos .reto:nth-child(5)'); await page.waitForTimeout(150);
    await sim(4);
    await page.keyboard.press('Escape'); await page.waitForTimeout(100);
    const label = await page.evaluate(() => document.querySelector('#btn-restart').textContent);
    if (label !== 'Repetir reto') throw new Error('etiqueta de reinicio: ' + label);
    await click(page, '#s-pause [data-act="retos-list"]'); await page.waitForTimeout(200);
    if ((await ui()) !== 'retos') throw new Error('no volvió a la lista');
    await click(page, '#retos .reto:nth-child(12)'); await page.waitForTimeout(150); await sim(3);
    await page.keyboard.press('Escape'); await page.waitForTimeout(100);
    await click(page, '#s-pause [data-act="restart"]'); await page.waitForTimeout(100); await sim(2);
    const idx = await page.evaluate(() => TYA.Game.G.reto && TYA.Game.G.reto.idx);
    if (idx !== 11) throw new Error('repetir reto cambió de reto: ' + idx);
    await page.keyboard.press('Escape'); await page.waitForTimeout(100);
    await click(page, '#s-pause [data-act="menu"]'); await page.waitForTimeout(150);
    // después de un reto, una partida normal no debe tener restos del reto
    const leftover = await page.evaluate(() => { TYA.UI.show(null, false); TYA.Game.startMatch('caneca', false, 'pupitre'); return { reto: !!TYA.Game.G.reto, pinned: TYA.Game.G.players.some(p => p.pinned) }; });
    if (leftover.reto || leftover.pinned) throw new Error('quedaron restos del reto: ' + JSON.stringify(leftover));
  });

  await run('tutorial solo y en pareja', false, async (page, ui, sim) => {
    await click(page, '#s-title [data-act="howto"]'); await page.waitForTimeout(120);
    await click(page, '[data-act="tut-solo"]'); await page.waitForTimeout(120); await sim(3);
    await page.keyboard.press('Escape'); await click(page, '#s-pause [data-act="restart"]'); await sim(2);
    await page.keyboard.press('Escape'); await click(page, '#s-pause [data-act="menu"]');
    await click(page, '#s-title [data-act="howto"]'); await click(page, '[data-act="tut-pair"]'); await sim(3);
  });

  await run('opciones: todo', false, async (page) => {
    await click(page, '#s-title [data-act="options"]'); await page.waitForTimeout(120);
    const n = await page.evaluate(() => document.querySelectorAll('#s-options .seg button, #s-options [data-act], #s-options button').length);
    const btns = await page.$$('#s-options button');
    for (const b of btns) { const act = await b.getAttribute('data-act'); if (act === 'back' || !(await b.isVisible())) continue; await b.click(); await page.waitForTimeout(30); }
    await page.evaluate(() => { TYA.Game.setHandicap(0, 0); TYA.Game.setHandicap(1, 0); TYA.UI.show(null, false); TYA.Game.startMatch('caneca', false, 'biblioteca'); for (let k = 0; k < 300; k++) TYA.Game.update(1 / 60); });
    void n;
  });

  await run('jugadores y logros', false, async (page) => {
    await click(page, '#s-title [data-act="records"]'); await page.waitForTimeout(120);
    await page.fill('#n1', 'Ana'); await page.keyboard.press('Enter');
    await page.fill('#n2', 'Luis <b>'); await page.keyboard.press('Tab');
    await click(page, '[data-acc="0"]'); await click(page, '#ach-tabs button[data-t="1"]');
    const names = await page.evaluate(() => Progress.names);
    if (names[0] !== 'Ana' || /[<>]/.test(names[1])) throw new Error('nombres: ' + JSON.stringify(names));
  });

  await run('táctil: contra la máquina', true, async (page, ui, sim) => {
    await click(page, '#s-title [data-act="playbot"]'); await click(page, '[data-act="mode-caneca"]'); await click(page, '#arena-grid .arena:nth-child(1)');
    await page.waitForTimeout(200); await sim(3);
    const vis = await page.evaluate(() => { const t = document.getElementById('touch'); return t && !t.hidden ? t.className : null; });
    if (!vis || !/single/.test(vis)) throw new Error('botones táctiles: ' + vis);
    await click(page, '.tpause'); await page.waitForTimeout(100);
    if ((await ui()) !== 'pause') throw new Error('el botón de pausa táctil no pausó');
    await click(page, '#s-pause [data-act="menu"]');
    await click(page, '#s-title [data-act="retos"]'); await click(page, '#retos .reto:nth-child(1)'); await sim(2);
    const vis2 = await page.evaluate(() => document.getElementById('touch').className);
    if (!/single/.test(vis2)) throw new Error('retos sin botones de un jugador: ' + vis2);
  });

  await run('táctil: dos en tableta', true, async (page, ui, sim) => {
    await click(page, '#s-title [data-act="play2"]'); await click(page, '[data-act="mode-jefe"]'); await click(page, '#jefes .mode:nth-child(3)');
    await page.waitForTimeout(200); await sim(3);
    const vis = await page.evaluate(() => document.getElementById('touch').className);
    if (!/dual/.test(vis)) throw new Error('botones táctiles dobles: ' + vis);
  });

  console.log('\n' + (issues.length ? JSON.stringify(issues, null, 1) : 'SIN PROBLEMAS'));
  await browser.close();
})();
