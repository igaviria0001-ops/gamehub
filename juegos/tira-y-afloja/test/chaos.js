// Prueba de caos: entradas al azar para los dos jugadores en todos los modos y arenas.
// Busca errores, NaN, jugadores fuera del mundo y estados que se quedan pegados.
const { chromium } = require('playwright');
const path = require('path');
const secs = +(process.argv[2] || 60);
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = []; page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1200);
  const out = await page.evaluate(secs => {
    const G = TYA.Game.G, report = [];
    const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
    const keys = ['left', 'right', 'jump', 'stick', 'pull', 'release'];
    const combos = [
      ['caneca', 'pupitre'], ['caneca', 'gimnasio'], ['caneca', 'laboratorio'], ['caneca', 'cafeteria'], ['caneca', 'arte'], ['caneca', 'biblioteca'], ['caneca', 'bus'], ['caneca', 'profe'],
      ['chicles', 'arte'], ['rey', 'bus'], ['rey', 'profe'], ['gol', 'gimnasio'], ['escalada', 'torre'], ['fuga', 'torre'], ['jefe:aspiradora', null], ['jefe:sacapuntas', null], ['jefe:aseador', null], ['jefe:fotocopiadora', null], ['jefe:microondas', null], ['jefe:reloj', null],
    ];
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (const [mode0, arena] of combos) {
      const [mode, jid] = mode0.split(':'); if (jid) G.jefeId = jid;
      for (const fiesta of [false, true]) {
        G.fugaLevel = 6;
        TYA.Game.startMatch(mode, false, arena, fiesta);
        G.winsNeeded = 99;
        const r = { mode, arena, fiesta, nan: 0, out: 0, maxV: 0, states: {} };
        const inp = [{}, {}]; let next = [0, 0];
        for (let i = 0; i < 60 * secs; i++) {
          for (const p of [0, 1]) {
            if (i >= next[p]) { next[p] = i + 6 + Math.floor(rnd() * 30); inp[p] = {}; keys.forEach(k => { inp[p][k] = rnd() < (k === 'left' || k === 'right' ? 0.35 : 0.22); }); }
            TYA.over[p] = Object.assign({ left: false, right: false, jump: false, stick: false, pull: false, release: false }, inp[p]);
          }
          TYA.Game.update(1 / 60);
          if (i % 30 === 0) TYA.Game.render(ctx, cv.width, cv.height, 1);
          r.states[G.state] = (r.states[G.state] || 0) + 1;
          for (const p of G.players) {
            if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.vx) || !isFinite(p.mass)) r.nan++;
            if (p.alive && (p.y > 2200 || p.x < -200 || p.x > 2200 || p.y < -4000)) r.out++;
          }
          if (G.rope.pts.some(q => !isFinite(q.x) || !isFinite(q.y))) r.nan++;
          if (G.state === 'matchEnd' || G.state === 'pick') { TYA.Game.startMatch(mode, false, arena, fiesta); G.winsNeeded = 99; }
        }
        r.rope = Math.round(G.rope.len); r.mass = G.players.map(p => +p.mass.toFixed(1));
        if (r.nan || r.out || !r.states.play) report.push(r);
        else report.push({ mode: mode0, arena, fiesta, ok: true, play: r.states.play, rope: r.rope, mass: r.mass });
      }
    }
    TYA.over[0] = TYA.over[1] = null;
    return report;
  }, secs);
  for (const r of out) console.log(JSON.stringify(r));
  console.log('ERR', errors.slice(0, 8).join('\n'));
  await browser.close();
})();
