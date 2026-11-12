// Motor del torneo: simula muchos torneos con resultados al azar y revisa que todos terminen bien
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = {}; vm.createContext(ctx);
for (const f of ['catalog.js', 'torneo.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'app', f), 'utf8') + '\nthis.GAMES = GAMES; this.GAME = GAME; this.Torneo = typeof Torneo !== "undefined" ? Torneo : undefined;', ctx);
const { GAMES, Torneo } = ctx;
const pool = () => { const P = {}; GAMES.forEach(g => { P[g.id] = { on: true, modes: Object.fromEntries(g.modes.map(m => [m.id, true])), maps: Object.fromEntries(g.maps.map(m => [m[0], true])), arenas: g.arenas ? Object.fromEntries(g.arenas.map(m => [m[0], true])) : null, len: 'normal', opts: {} }; }); return P; };
const base = { ptsW: 3, ptsD: 1, ptsL: 0, order: 'azar', noRepeat: true, noRepeatMap: true, chars: 'pick', swapSides: true };
let fails = 0, runs = 0; const summary = {};
const cases = [];
for (const n of [2]) for (const bo of [3, 5, 7]) cases.push(['serie', n, { bestOf: bo }]);
for (const n of [3, 4, 5, 6, 7, 8]) for (const [bo, legs, fin] of [[1, 1, 0], [1, 2, 3], [3, 1, 5]]) cases.push(['liga', n, { bestOf: bo, legs, final: fin }]);
for (const n of [3, 4, 5, 6, 7, 8]) for (const [bo, fb, third] of [[1, 3, true], [3, 5, false], [1, 1, true]]) cases.push(['elim', n, { bestOf: bo, finalBestOf: fb, third }]);
for (const n of [3, 5, 8]) for (const goal of [3, 5]) cases.push(['rey', n, { bestOf: 1, kingGoal: goal }]);
for (const order of ['azar', 'rotar', 'pierde', 'turnos']) cases.push(['liga', 4, { bestOf: 1, legs: 1, final: 3, order }]);
for (const [fmt, n, r] of cases) for (let rep = 0; rep < 25; rep++) {
  runs++;
  const T = Torneo.create({ name: 'x', format: fmt, players: Array.from({ length: n }, (_, i) => ({ name: 'P' + i, color: '#fff' })), rules: Object.assign({}, base, r), pool: pool() });
  let guard = 0, err = null;
  while (!T.done && guard++ < 500) {
    let ev = Torneo.curEvent(T);
    if (!ev) { const m = Torneo.nextMatch(T); if (!m) { err = 'sin cruce y sin terminar'; break; } ev = Torneo.makeEvent(T, m); }
    if (ev.status === 'choose') { const games = GAMES.filter(g => T.pool[g.id].on); ev = Torneo.chooseFor(T, games[Math.floor(Math.random() * games.length)].id); }
    if (!ev.game || !ev.mode || !ev.map) { err = 'prueba incompleta ' + JSON.stringify(ev); break; }
    const g = GAMES.find(x => x.id === ev.game), M = g.modes.find(m => m.id === ev.mode);
    const okMap = (M.map ? [M.map] : M.maps === 'arenas' ? g.arenas.map(a => a[0]) : g.maps.map(a => a[0])).includes(ev.map);
    if (!okMap) { err = 'escenario no sirve ' + ev.game + ' ' + ev.mode + ' ' + ev.map; break; }
    if (ev.j1 === ev.j2 || !ev.j1 || !ev.j2) { err = 'mismo jugador o vacío'; break; }
    const x = Math.random(), w = x < 0.1 ? 'draw' : x < 0.55 ? ev.j1 : ev.j2;
    Torneo.record(T, ev.id, w);
  }
  if (!T.done) err = err || 'no terminó';
  if (T.done && !T.players.some(p => p.id === T.champion)) err = 'campeón raro';
  if (fmt === 'liga' && T.done) { const st = Torneo.standings(T); if (!r.final && st[0].id !== T.champion) err = 'el campeón no es el primero de la tabla'; }
  if (fmt === 'elim' && T.done) { const fm = T.matches.find(m => m.stage === 'Final'); if (!fm || fm.winner !== T.champion) err = 'el campeón no ganó la final'; }
  const k = `${fmt} n=${n} ${JSON.stringify(r)}`; summary[k] = summary[k] || { ok: 0, ev: 0 }; if (err) { fails++; if (fails < 8) console.log('FALLA', k, err); } else { summary[k].ok++; summary[k].ev += T.events.length; }
}
for (const [k, v] of Object.entries(summary)) if (v.ok) console.log(k.padEnd(60), 'promedio de pruebas', (v.ev / v.ok).toFixed(1));
console.log(`${runs} torneos, ${fails} fallas`);
