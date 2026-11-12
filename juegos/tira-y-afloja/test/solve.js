// Resolver salas de la campaña con dos jugadores de guion (prueba de que se pueden pasar)
// Uso: node solve.js [ids separados por coma]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = []; page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1000);
  const only = process.argv[2] ? process.argv[2].split(',') : null;
  const solutions = fs.readFileSync(path.join(__dirname, 'solutions.js'), 'utf8');
  const out = await page.evaluate(([only, solutions]) => {
    const G = TYA.Game.G;
    const K = o => Object.assign({ left: false, right: false, jump: false, stick: false, pull: false, release: false }, o || {});
    const P = i => G.players[i];
    let frames = 0, trace = [];
    const st = () => Campaign.state;
    const done = () => !st() || st().win || st().fail;
    // controladores: cada uno recibe (p, mem) y devuelve teclas
    const W = {};
    W.idle = () => ({});
    W.hold = keys => () => keys;
    // caminar hacia x saltando lo que bloquee o los huecos; extra = teclas que se suman
    W.go = (x, extra = {}, tol = 12) => (p, m) => {
      const dir = Math.sign(x - p.x);
      if (Math.abs(x - p.x) < tol) return Object.assign({}, extra);
      const moved = Math.abs(p.x - (m.lx ?? p.x + 99)); m.lx = p.x;
      m.stall = p.onGround && moved < 0.8 ? (m.stall || 0) + 1 : 0;
      const ahead = ARENA.groundBelow(p.x + dir * (p.r * 0.6 + 14), p.y - 40);
      const gap = p.onGround && ahead > p.y + p.r + 150;
      m.jt = Math.max(0, (m.jt || 0) - 1); m.cool = Math.max(0, (m.cool || 0) - 1);
      if ((m.stall > 4 || gap) && p.onGround && m.jt === 0 && m.cool === 0) { m.jt = 28; m.cool = 34; }
      return Object.assign({ left: dir < 0, right: dir > 0, jump: m.jt > 0 }, extra);
    };
    W.jumpTo = (x, hold = 30) => (p, m) => { m.f = (m.f || 0) + 1; const dir = Math.sign(x - p.x); return { jump: m.f <= hold, left: dir < 0 && Math.abs(x - p.x) > 10, right: dir > 0 && Math.abs(x - p.x) > 10 }; };
    const run = (c0, c1, until, max = 600) => {
      const m = [{}, {}];
      for (let i = 0; i < max; i++) {
        if (until && until()) return true;
        if (done()) return !!(st() && st().win);
        TYA.over[0] = K(c0 ? c0(P(0), m[0]) : {}); TYA.over[1] = K(c1 ? c1(P(1), m[1]) : {});
        TYA.Game.update(1 / 60); frames++;
        if (frames % 15 === 0) trace.push(`${frames}: A ${Math.round(P(0).x)},${Math.round(P(0).y)} m${P(0).mass.toFixed(1)}${P(0).stuck ? 'S' : ''} | B ${Math.round(P(1).x)},${Math.round(P(1).y)} m${P(1).mass.toFixed(1)}${P(1).stuck ? 'S' : ''} rope ${Math.round(G.rope.len)} st ${G.rope.strain.toFixed(2)}${(() => { const l = ARENA.L.objs.find(o => o.kind === 'liftPair'); return l ? ` lift d${Math.round(l.d)} v${Math.round(l.v)} gA ${P(0).onGround ? (P(0).groundR && P(0).groundR.kind) : '-'} vy ${Math.round(P(0).vy)} j${TYA.over[0] && TYA.over[0].jump ? 1 : 0}` : ''; })()}`);
      }
      return until ? until() : false;
    };
    const log = (m) => trace.push(String(m));
    const SOL = (new Function('W', 'run', 'P', 'G', 'K', 'log', solutions))(W, run, P, G, K, log);
    const res = {};
    for (const r of Campaign.ROOMS) {
      if (only && !only.includes(r.id)) continue;
      TYA.UI.show(null, false); G.campStage = r.id; TYA.Game.startMatch('campana', false, 'campana');
      let g = 0; while (G.state !== 'play' && g++ < 400) TYA.Game.update(1 / 60);
      frames = 0; trace = []; ARENA.t = 0; G.acc = 0;
      if (!SOL[r.id]) { res[r.id] = 'sin solución escrita'; continue; }
      try { SOL[r.id](); } catch (e) { res[r.id] = 'ERROR ' + e.message; continue; }
      run(null, null, null, 150);
      const S = Campaign.state;
      res[r.id] = { win: !!(S && S.result), t: S && S.result ? +S.result.t.toFixed(1) : +(S ? S.t : 0).toFixed(1), par: r.par, stars: S && S.result ? S.result.stars : 0, wr: S ? S.wr.filter(w => w.got).length : 0, falls: S ? S.falls : 0, why: S ? S.why : '', hit: S ? S.lastHit : '' };
      if (!res[r.id].win || (only && only.length === 1)) res[r.id].trace = trace.filter((t, k) => k % 2 === 0 || !/^\d+:/.test(t)).slice(-150);
    }
    TYA.over[0] = TYA.over[1] = null;
    return res;
  }, [only, solutions]);
  for (const k in out) {
    const v = out[k];
    console.log(k, JSON.stringify(Object.assign({}, v, { trace: undefined })));
    if (v.trace) v.trace.forEach(t => console.log('   ', t));
  }
  console.log('ERR', errors.join('\n'));
  await browser.close();
})();
