// Flujo completo: cada juego se abre aislado, el botón «⌂ Colección» vuelve, y una prueba de torneo
// arranca en el juego con su modo y escenario, termina (con máquinas) y el resultado llega solo.
const { chromium } = require('playwright');
const path = require('path');
const URL = process.env.URL || 'http://127.0.0.1:8765/';
const ONLY = (process.env.ONLY || 'tira-y-afloja,ventolera,sortilegio,vertigo').split(',');
const OUT = path.join(__dirname, 'shots');
// cómo terminar rápido una partida en cada juego (dentro de su marco)
const FINISH = {
  'tira-y-afloja': async f => f.evaluate(async () => { const { Game } = TYA, G = Game.G; G.bots = [TYA.makeBot(0, 2), TYA.makeBot(1, 2)]; for (let i = 0; i < 60000 && G.state !== 'matchEnd'; i++) Game.update(1 / 60); return { state: G.state, mode: G.mode, arena: G.arenaId, wins: G.wins, need: G.winsNeeded }; }),
  ventolera: async f => f.evaluate(async () => { const { Game, Bot } = VTO, G = Game.G; G.bots = [new Bot(G.birds[0], 3, 2), new Bot(G.birds[1], 7, 2)]; for (let i = 0; i < 900 && G.state !== 'matchEnd'; i++) Game.advance(1); await new Promise(r => setTimeout(r, 1500)); return { state: G.state, mode: G.mode, arena: G.arena, wins: G.wins, need: G.winsNeeded, score: G.score }; }),
  sortilegio: async f => f.evaluate(async () => { const G = Game.G, wait = ms => new Promise(r => setTimeout(r, ms)); const bots = () => G.mages.forEach(m => { if (!(m.ctrl instanceof Bot)) m.ctrl = new Bot(2); }); for (let i = 0; i < 4000 && G.state !== 'matchEnd'; i++) { if (G.state === 'roundEnd') { await wait(300); continue; } bots(); Game.advance(0.5); } return { state: G.state, mode: G.mode, arena: G.arenaId, wins: G.wins, need: G.winsNeeded, chars: G.chars }; }),
  vertigo: async f => f.evaluate(async () => { const R = window.__vtg.R, G = window.__vtg.G; const hum = R.cars.filter(c => !c.bot); hum[0].place = 2; hum[1].place = 1; UI.results(R, G); return { mode: G.cfg.mode, track: R.track.def.id, laps: G.cfg.laps, pilots: G.cfg.p }; }),
};
const CONT = { 'tira-y-afloja': '#btn-hub', ventolera: '#r-hub', sortilegio: '#r-hub', vertigo: '#resHub' };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }), p = await ctx.newPage(), errs = [];
  if (process.env.VTG_GQ) await ctx.addInitScript(v => { try { localStorage.setItem('vtg_gq', v); } catch (e) {} }, process.env.VTG_GQ);
  p.on('pageerror', e => errs.push('hub: ' + e.message));
  await p.goto(URL); await p.waitForTimeout(800);
  for (const id of ONLY) {
    const t0 = Date.now();
    // 1) juego suelto: abre, muestra «⌂ Colección» y vuelve
    await p.evaluate(id => GAMEHUB.Launcher.open(id), id);
    await p.waitForSelector('#stage.ready', { timeout: 150000 });
    let f = p.frames().find(x => x !== p.mainFrame());
    f.on && 0; const fe = []; p.on('pageerror', () => {});
    const home = await f.evaluate(() => { const b = document.querySelector('.hub-home'); return b ? getComputedStyle(b).display : 'sin botón'; });
    await p.screenshot({ path: path.join(OUT, `juego-${id}.png`), timeout: 120000 });
    await f.evaluate(() => document.querySelector('.hub-home').click());
    await p.waitForSelector('#stage', { state: 'hidden', timeout: 60000 });
    // 2) prueba de torneo (serie de 2 con solo este juego, personajes al azar)
    await p.evaluate(id => {
      const pool = {}; GAMEHUB.GAMES.forEach(g => { pool[g.id] = { on: g.id === id, modes: Object.fromEntries(g.modes.map(m => [m.id, m.id === (id === 'vertigo' ? 'quick' : g.modes[0].id)])), maps: Object.fromEntries(g.maps.map(m => [m[0], true])), arenas: null, len: 'corta', opts: {} }; });
      GAMEHUB.Tour.T = GAMEHUB.Torneo.create({ name: 'Prueba', format: 'serie', players: [{ name: 'Ana', color: '#ff5d8f' }, { name: 'Beto', color: '#6fc3ff' }], rules: { bestOf: 3, order: 'azar', noRepeat: true, noRepeatMap: true, chars: 'random', swapSides: true }, pool });
      GAMEHUB.Tour.save(); GAMEHUB.go('torneo');
    }, id);
    await p.waitForTimeout(400);
    const ev = await p.evaluate(() => { const e = GAMEHUB.Torneo.curEvent(GAMEHUB.Tour.T); return { mode: e.mode, map: e.map, rounds: e.rounds, j1: e.j1 }; });
    await p.click('[data-t="play"]');
    await p.waitForSelector('#stage.ready', { timeout: 150000 });
    await p.waitForTimeout(1500);
    f = p.frames().find(x => x !== p.mainFrame());
    const got = await FINISH[id](f);
    console.log('  ', id, 'terminó:', JSON.stringify(got));
    await p.waitForFunction(() => GAMEHUB.Tour.T.events[0].status === 'done', null, { timeout: 30000 });
    await p.waitForTimeout(600);
    await p.screenshot({ path: path.join(OUT, `torneo-${id}.png`), timeout: 120000 });
    const res = await p.evaluate(() => { const e = GAMEHUB.Tour.T.events[0]; return { winner: e.winner, info: e.info }; });
    const contVisible = await f.evaluate(sel => { const b = document.querySelector(sel); return !!b && !b.hidden && b.offsetParent !== null; }, CONT[id]);
    await f.evaluate(sel => document.querySelector(sel).click(), CONT[id]);
    await p.waitForSelector('#stage', { state: 'hidden', timeout: 60000 });
    console.log(id, JSON.stringify({ home, ev, got, res, contVisible, s: ((Date.now() - t0) / 1000).toFixed(0) }));
  }
  await p.screenshot({ path: path.join(OUT, 'torneo-dash.png'), timeout: 120000 });
  console.log('ERR', errs.join(' | ') || 'ninguno');
  await b.close();
})();
