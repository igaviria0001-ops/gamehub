// Simulación sin navegador: carga Three.js y la física, corre carreras de la máquina
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = { console, Math, Date, JSON, Float32Array, Float64Array, Uint8Array, Int32Array, Array, Object, Set, Map, performance: { now: () => Date.now() },
  addEventListener() {}, matchMedia: () => ({ matches: false }), localStorage: { getItem: () => null, setItem() {} }, devicePixelRatio: 1 };
ctx.window = ctx; ctx.self = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'vendor/three.r128.min.js'), 'utf8'), ctx);
const files = fs.readdirSync(path.join(root, 'src')).filter(f => /^0[0-4][a-z]?-.*\.js$/.test(f)).sort();
vm.runInContext(files.map(f => fs.readFileSync(path.join(root, 'src', f), 'utf8')).join('\n') + '\n;this.Race=Race;this.getTrack=getTrack;this.PILOT_ORDER=PILOT_ORDER;this.racingLine=racingLine;this.Boss=Boss;this.BOSSES=BOSSES;this.Rules=Rules;this.CAMPAIGN=CAMPAIGN;this.World=World;this.Challenge=Challenge;', ctx);
module.exports = ctx;
if (require.main === module) {
  const track = process.argv[2] || 'guatape', n = +(process.argv[3] || 4), lvl = +(process.argv[4] || 1);
  const pilots = ctx.PILOT_ORDER.slice(0, n);
  const R = new ctx.Race(track, { humans: [], bots: pilots.map(p => ({ pid: p, level: lvl })), countT: 0.1 });
  const T = R.track; console.log('pista', track, 'largo', T.L.toFixed(0), 'm, muestras', T.N);
  const dt = 1 / 120; let t = 0; const ev = {};
  while (R.state !== 'done' && t < 600) { R.step(dt); t += dt; for (const e of R.events) ev[e.type] = (ev[e.type] || 0) + 1; }
  for (const c of R.order) console.log(c.place, c.pid.padEnd(9), 'vueltas', c.laps.map(x => x.toFixed(1)).join(' / '), 'mejor', c.best.toFixed(1), 'paredes', c.stats.walls, 'derrapes', c.stats.drifts, 'trucos', c.stats.tricks, 'gemas', c.stats.gems, 'aros', c.stats.rings || 0, 'golpes', c.stats.hits || 0, 'dio', c.stats.hitsDone || 0, 'vel. máx', (c.stats.topSpeed * 3.6).toFixed(0), 'km/h');
  console.log('t', t.toFixed(1), JSON.stringify(ev));
}
