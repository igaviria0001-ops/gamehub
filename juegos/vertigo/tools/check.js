// revisa una pista: largo, curvatura, cruces cercanos, alturas por zona
const ctx = require('./sim.js'); const id = process.argv[2]; const T = ctx.getTrack(id);
let mk = 0, mks = 0; for (let k = 0; k < T.N; k++) if (Math.abs(T.kap[k]) > mk) { mk = Math.abs(T.kap[k]); mks = k * T.ds; }
let md = 1e9, mds = null; for (let i = 0; i < T.N; i += 2) for (let j = i + 2; j < T.N; j += 2) { const ds = Math.min(Math.abs(i - j), T.N - Math.abs(i - j)) * T.ds; if (ds < 150) continue; const d = Math.hypot(T.px[i] - T.px[j], T.pz[i] - T.pz[j]); const dy = Math.abs(T.py[i] - T.py[j]); if (d < md) { md = d; mds = [i * T.ds | 0, j * T.ds | 0, dy.toFixed(1)]; } }
console.log(id, 'L', T.L.toFixed(0), 'maxkap', mk.toFixed(4), '@', mks.toFixed(0), 'closest', md.toFixed(0), 'm at s', mds);
for (const z of T.zones) console.log(' ', z.type, z.s0.toFixed(0), '→', z.s1.toFixed(0));
const tight = []; for (let k = 0; k < T.N; k += 1) if (Math.abs(T.kap[k]) > 0.025) tight.push((k * T.ds).toFixed(0) + ':' + T.kap[k].toFixed(3)); console.log(' tight', tight.filter((_, i) => i % 3 === 0).join(' '));
