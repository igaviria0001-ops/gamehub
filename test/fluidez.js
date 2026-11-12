// Fluidez: cada juego suelto vs. dentro de GameHub, con la misma partida y la misma ventana.
// Mide cuadros por segundo y tiempos de cuadro (p50/p95) dentro del juego, y revisa que la
// resolución interna del juego sea la misma en los dos casos (que no pierda calidad).
// Requiere: python3 -m http.server 8765 en docs/.  Uso: node test/fluidez.js [ids…]
const { chromium } = require('playwright');
const URL = process.env.URL || 'http://127.0.0.1:8765/';
const IDS = process.argv.slice(2).length ? process.argv.slice(2) : ['tira-y-afloja', 'ventolera', 'sortilegio', 'vertigo'];
const EV = {
  'tira-y-afloja': { mode: 'caneca', map: 'cafeteria', rounds: 3 },
  ventolera: { mode: 'duel', map: 'capadocia', rounds: 3 },
  sortilegio: { mode: 'duel', map: 'volcan', rounds: 3 },
  vertigo: { mode: 'quick', map: 'tokio', rounds: 2 },
};
const SECS = +(process.env.SECS || 6);
const [VW, VH] = (process.env.VIEW || '1280x720').split('x').map(Number);
// dentro del juego: arranca la partida como lo haría un torneo (sin tocar lo guardado) y mide
async function run(f, id) {
  return f.evaluate(async ([id, ev, secs]) => {
    const UIx = id === 'tira-y-afloja' ? TYA.UI : id === 'ventolera' ? VTO.UI : UI;
    UIx.hubPlay(Object.assign({ id: 'perf', game: id, chars: 'keep', title: 'Prueba de fluidez', p1: 'A', p2: 'B', opts: {} }, ev));
    await new Promise(r => setTimeout(r, 3500)); // cuenta regresiva / cámara de inicio
    const d = []; let last = performance.now();
    await new Promise(res => { const t0 = last; const fr = now => { d.push(now - last); last = now; if (now - t0 < secs * 1000) requestAnimationFrame(fr); else res(); }; requestAnimationFrame(fr); });
    d.shift(); d.sort((a, b) => a - b);
    const q = p => d[Math.min(d.length - 1, Math.floor(d.length * p))];
    const cv = [...document.querySelectorAll('canvas')].filter(c => c.width * c.height > 0).sort((a, b) => b.width * b.height - a.width * a.height)[0];
    return { fps: +(d.length / secs).toFixed(1), p50: +q(0.5).toFixed(1), p95: +q(0.95).toFixed(1), canvas: cv ? `${cv.width}x${cv.height}` : '-', css: cv ? `${cv.clientWidth}x${cv.clientHeight}` : '-', dpr: devicePixelRatio, inner: `${innerWidth}x${innerHeight}` };
  }, [id, EV[id], SECS]);
}
(async () => {
  const out = [];
  for (const id of IDS) {
    const args = id === 'vertigo' ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : ['--disable-gpu'];
    const b = await chromium.launch({ args: args.concat(['--autoplay-policy=no-user-gesture-required']) });
    const res = {};
    for (const where of ['suelto', 'gamehub', 'suelto2', 'gamehub2']) {
      const ctx = await b.newContext({ viewport: { width: VW, height: VH } }), p = await ctx.newPage(), errs = [];
      if (process.env.VTG_GQ) await ctx.addInitScript(v => { try { localStorage.setItem('vtg_gq', v); } catch (e) {} }, process.env.VTG_GQ);
      p.on('pageerror', e => errs.push(e.message));
      let f;
      if (where.startsWith('suelto')) { await p.goto(URL + 'games/' + id + '.html'); await p.waitForTimeout(2500); f = p.mainFrame(); }
      else {
        await p.goto(URL); await p.waitForTimeout(1200);
        await p.evaluate(id => GAMEHUB.Launcher.open(id), id);
        await p.waitForSelector('#stage.ready', { timeout: 90000 }); await p.waitForTimeout(1500);
        f = p.frames().find(x => x !== p.mainFrame());
      }
      const r = await run(f, id);
      if (where.startsWith('gamehub')) r.hubOculto = await p.evaluate(() => getComputedStyle(document.getElementById('app')).display === 'none' && getComputedStyle(document.querySelector('.sky')).display === 'none');
      if (errs.length) r.errores = errs.slice(0, 3);
      res[where] = r;
      await ctx.close();
    }
    await b.close();
    const avg = k => ((res[k].fps + res[k + '2'].fps) / 2).toFixed(1);
    console.log(id.padEnd(14), 'suelto', avg('suelto'), 'fps · en GameHub', avg('gamehub'), 'fps ·', JSON.stringify(res));
    out.push({ id, res });
  }
})();
