const ctx = require('./sim.js');
const R = new ctx.Race('guatape', { humans: [], bots: [{ pid: 'cumbia', level: +(process.argv[2] || 1) }], countT: 0.1 });
const T = R.track, c = R.cars[0], line = ctx.racingLine(T); let t = 0; const walls = [];
let lastLog = 0;
while (c.lap < 1 && t < 200) { R.step(1 / 120); t += 1 / 120; for (const e of R.events) if (e.type === 'wall') walls.push([c.s.toFixed(0), c.u.toFixed(1), (c.f * 3.6).toFixed(0), c.drift.on ? 'D' : '', T.kap[Math.floor(c.s / T.ds)].toFixed(4)]);
  if (t - lastLog > 1) { lastLog = t; const k = Math.floor(c.s / T.ds); console.log(t.toFixed(0).padStart(3), 's', c.s.toFixed(0).padStart(5), 'u', c.u.toFixed(1).padStart(6), 'line', line[k].toFixed(1).padStart(5), 'a', c.a.toFixed(2).padStart(6), 'v', (c.f * 3.6).toFixed(0).padStart(4), 'kap', T.kap[k].toFixed(4), c.drift.on ? 'DRIFT' + c.drift.lv : '', c.grounded ? '' : 'AIR'); } }
console.log('paredes', walls.length); console.log(walls.slice(0, 30).map(w => w.join(' ')).join('\n'));
