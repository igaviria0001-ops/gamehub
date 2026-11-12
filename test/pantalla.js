// Pantalla completa: (A) dentro de GameHub se pone sola al tocar «Jugar» y el botón de Opciones
// de cada juego la quita y la vuelve a poner; (B) cada juego suelto la pone solo con el primer toque
// y su botón de Opciones también funciona.  Requiere: python3 -m http.server 8765 en docs/.
const { chromium } = require('playwright');
const URL = process.env.URL || 'http://127.0.0.1:8765/';
const IDS = process.argv.slice(2).length ? process.argv.slice(2) : ['tira-y-afloja', 'ventolera', 'sortilegio', 'vertigo'];
const OPEN = { vertigo: '[data-act="opts"]' }, BTN = { 'tira-y-afloja': '#s-options [data-act="fullscreen"]', ventolera: '#s-options [data-act="fullscreen"]', sortilegio: '#o-fs', vertigo: '#s-opts [data-act="fs"]' };
const [VW, VH] = (process.env.VIEW || '1280x720').split('x').map(Number);
const wait = ms => new Promise(r => setTimeout(r, ms));
// espera a que la pantalla completa quede como se pidió (los juegos pesados tardan más en esta máquina)
const until = async (fn, want, ms = 6000) => { const t = Date.now(); let v; while (Date.now() - t < ms) { v = await fn(); if (v === want) return v; await wait(200); } return v; };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const id of IDS) {
    const r = { id };
    // A) dentro de GameHub
    let ctx = await b.newContext({ viewport: { width: VW, height: VH } }), p = await ctx.newPage(), errs = [];
    if (process.env.VTG_GQ) await ctx.addInitScript(v => { try { localStorage.setItem('vtg_gq', v); } catch (e) {} }, process.env.VTG_GQ);
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(URL); await wait(1000);
    await p.evaluate(id => GAMEHUB.go('game', id), id); await wait(500);
    await p.click('.bigplay');
    await p.waitForSelector('#stage.ready', { timeout: 90000 }); await wait(1200);
    let f = p.frames().find(x => x !== p.mainFrame());
    const hubFs = () => p.evaluate(() => !!document.fullscreenElement);
    r.hub_auto = await hubFs();
    r.hub_juegoSabe = await f.evaluate(() => FS.on);
    await f.click(OPEN[id] || '[data-act="options"]'); await wait(400);
    r.hub_autoOculta = await f.evaluate(() => { const e = document.querySelector('.fs-auto'); return !e || getComputedStyle(e).display === 'none'; });
    r.hub_label1 = await f.evaluate(s => document.querySelector(s).textContent, BTN[id]);
    await f.click(BTN[id]);
    r.hub_trasSalir = await until(hubFs, false); await wait(400); r.hub_label2 = await f.evaluate(s => document.querySelector(s).textContent, BTN[id]);
    await f.click(BTN[id]);
    r.hub_trasEntrar = await until(hubFs, true);
    r.hub_errores = errs.length ? errs.slice(0, 2) : 'ninguno';
    await ctx.close();
    // B) suelto
    ctx = await b.newContext({ viewport: { width: VW, height: VH } }); p = await ctx.newPage(); const e2 = [];
    if (process.env.VTG_GQ) await ctx.addInitScript(v => { try { localStorage.setItem('vtg_gq', v); } catch (e) {} }, process.env.VTG_GQ);
    p.on('pageerror', e => e2.push(e.message));
    await p.goto(URL + 'games/' + id + '.html'); await wait(2500);
    await p.mouse.click(4, VH - 4);
    r.suelto_auto = await until(hubFs, true);
    await p.click(OPEN[id] || '[data-act="options"]'); await wait(400);
    r.suelto_autoVisible = await p.evaluate(() => { const e = document.querySelector('.fs-auto'); return !!e && getComputedStyle(e).display !== 'none'; });
    await p.click(BTN[id]); r.suelto_trasSalir = await until(hubFs, false); await wait(400);
    await p.click(BTN[id]); r.suelto_trasEntrar = await until(hubFs, true);
    r.suelto_errores = e2.length ? e2.slice(0, 2) : 'ninguno';
    await ctx.close();
    const ok = r.hub_auto && r.hub_juegoSabe && r.hub_autoOculta && !r.hub_trasSalir && r.hub_trasEntrar && r.suelto_auto && r.suelto_autoVisible && !r.suelto_trasSalir && r.suelto_trasEntrar;
    console.log(ok ? 'OK ' : 'FALLA', JSON.stringify(r));
  }
  await b.close();
})();
