// «Cada quien elige»: la prueba abre la pantalla de elección del juego (sin modo ni escenario a la vista)
// y al darle empezar arranca con el modo y el escenario sorteados
const { chromium } = require('playwright');
const path = require('path');
const URL = process.env.URL || 'http://127.0.0.1:8765/';
const ONLY = (process.env.ONLY || 'ventolera,sortilegio,vertigo').split(',');
const SCREEN = { ventolera: ['#s-birds', '#s-birds [data-act="done"]', '#s-birds .setup'], sortilegio: ['#s-setup', '#s-setup .goRow [data-act="go"]', '#s-setup .opts'], vertigo: ['#s-setup', '#s-setup [data-act="startRace"]', '#optMode'] };
const STATE = {
  ventolera: f => f.evaluate(() => { const G = VTO.Game.G; return { state: G.state, mode: G.mode, arena: G.arena }; }),
  sortilegio: f => f.evaluate(() => { const G = Game.G; return { state: G.state, mode: G.mode, arena: G.arenaId, chars: G.chars }; }),
  vertigo: f => f.evaluate(() => { const G = window.__vtg.G, R = window.__vtg.R; return { mode: G.mode, cfg: G.cfg && G.cfg.mode, track: R && R.track.def.id, laps: G.cfg && G.cfg.laps }; }),
};
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(800);
  for (const id of ONLY) {
    await p.evaluate(id => {
      const pool = {}; GAMEHUB.GAMES.forEach(g => { pool[g.id] = { on: g.id === id, modes: Object.fromEntries(g.modes.map(m => [m.id, m.id !== 'battle'])), maps: Object.fromEntries(g.maps.map(m => [m[0], true])), arenas: null, len: 'normal', opts: {} }; });
      GAMEHUB.Tour.T = GAMEHUB.Torneo.create({ name: 'Prueba', format: 'serie', players: [{ name: 'Ana', color: '#ff5d8f' }, { name: 'Beto', color: '#6fc3ff' }], rules: { bestOf: 3, order: 'azar', noRepeat: true, noRepeatMap: true, chars: 'pick', swapSides: true }, pool });
      GAMEHUB.Tour.save(); GAMEHUB.go('torneo');
    }, id);
    await p.waitForTimeout(300);
    const ev = await p.evaluate(() => { const e = GAMEHUB.Torneo.curEvent(GAMEHUB.Tour.T); return { mode: e.mode, map: e.map, rounds: e.rounds }; });
    await p.click('[data-t="play"]');
    await p.waitForSelector('#stage.ready', { timeout: 90000 }); await p.waitForTimeout(1500);
    const f = p.frames().find(x => x !== p.mainFrame()), [scr, btn, hid] = SCREEN[id];
    const vis = await f.evaluate(([scr, hid]) => ({ screen: !document.querySelector(scr).hidden, optsHidden: getComputedStyle(document.querySelector(hid)).display === 'none' }), [scr, hid]);
    await p.screenshot({ path: path.join(__dirname, 'shots', `elegir-${id}.png`), timeout: 120000 });
    await f.evaluate(btn => document.querySelector(btn).click(), btn);
    await p.waitForTimeout(2500);
    const st = await STATE[id](f);
    console.log(id, JSON.stringify({ ev, vis, st }));
    await f.evaluate(() => { const h = document.querySelector('.hub-home'); }); await p.evaluate(() => GAMEHUB.Launcher.close());
  }
  console.log('ERR', errs.join(' | ') || 'ninguno'); await b.close();
})();
