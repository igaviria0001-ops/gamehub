// traza de un ejercicio de entrenamiento: node entdbg.js id nivel reps
const { chromium } = require('playwright');
const path = require('path');
const [id, lvl, reps] = [process.argv[2], +(process.argv[3] || 1), +(process.argv[4] || 2)];
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(800);
  const out = await page.evaluate(({ id, lvl, reps }) => {
    const E = TYA.Entreno, G = TYA.Game.G, log = [];
    const NONE = () => ({ left: false, right: false, jump: false, stick: false, pull: false, release: false });
    const toward = (inp, p, x, tol = 14) => {
      if (x > p.x + tol) inp.right = true; else if (x < p.x - tol) inp.left = true;
      if ((inp.left || inp.right) && p.onGround) { S.blk = Math.abs(p.x - (S.lx ?? -99)) < 1.5 ? (S.blk || 0) + 1 : 0; if (S.blk > 6) { inp.jump = true; S.blk = -20; } }
      S.lx = p.x;
    };
    let S = {};
    const STRAT = {
      tiro(T, p) {
        const i = NONE(), st = T.rep.S;
        if (!S.at) { toward(i, p, st.x, 10); if (Math.abs(p.x - st.x) < 12 && Math.abs(p.vx) < 30 && p.onGround) S.at = true; return i; }
        if (!S.shot) { i.stick = true; if (G.rope.strain < 1.06) i.pull = true; if (p.stuck && p.charge >= 1) S.shot = true; return i; }
        return i;
      },
      combo(T, p) {
        const i = NONE(); if (T.phase !== 'rep') return i;
        const [a, b] = T.rep.stars;
        if (!a.got) {
          if (!S.jumped) { toward(i, p, a.x, 8); if (Math.abs(p.x - a.x) < 12 && p.onGround && Math.abs(p.vx) < 60) { S.jumped = true; S.jt = 0; S.dj = false; } return i; }
          S.jt += 1 / 60;
          if (!S.dj) { i.jump = S.jt < 0.35; if (S.jt > 0.4 && p.vy > -80) { S.dj = true; S.d2 = 0; } }
          else { S.d2 += 1 / 60; i.jump = S.d2 > 0.03; }
          toward(i, p, a.x, 4);
          if (p.onGround && S.jt > 0.5) S.jumped = false;
          return i;
        }
        toward(i, p, b.x, 6);
        if (Math.abs(p.x - b.x) < 30 && p.y < b.y - 20) i.stick = true;
        return i;
      },
      defensa(T, p, o) { const i = NONE(); if (Math.abs(o.x - p.x) < 300) { toward(i, p, o.x, 0); i.pull = true; } return i; },
      latigo(T, p, o) {
        const i = NONE();
        const left = T.rep.toss - T.repT;
        if ((T.rep.warn && left < 0.25) || T.rep.tossed) { i.stick = true; i.pull = true; }
        return i;
      },
      salvada() { const i = NONE(); i.pull = true; return i; },
      remate(T, p, o) { const i = NONE(); i.release = true; const ex = o.x < 960 ? 266 + 90 : 1654 - 90; if (Math.abs(p.x - ex) > 40 && T.repT > 0.2) toward(i, p, ex); return i; },
    };
    E.start(E.LIST.findIndex(d => d.id === id), lvl);
    const T = G.train; T.lock = true;
    for (let k = 0; k < 60 * 1.2; k++) TYA.Game.update(1 / 60);
    let last = 0, f = 0;
    log.push(JSON.stringify(T.rep, (k, v) => typeof v === 'number' ? Math.round(v) : v));
    while (T.tries < reps && f < 60 * 40) {
      f++;
      if (T.tries !== last) { last = T.tries; S = {}; log.push('--- ' + JSON.stringify(T.whys)); }
      if (T.phase === 'rep' && T.repT < 0.02) log.push('REP ' + JSON.stringify(T.rep, (k, v) => typeof v === 'number' ? Math.round(v) : v));
      const [p, o] = G.players;
      const inp = T.phase === 'rep' ? STRAT[id](T, p, o) : NONE();
      TYA.over[0] = Object.assign(NONE(), inp);
      TYA.Game.update(1 / 60);
      if (f % 4 === 0 && T.phase === 'rep') log.push(`${T.repT.toFixed(2)} p(${p.x|0},${p.y|0}) v(${p.vx|0},${p.vy|0}) g${+p.onGround} st${+p.stuck} sl${p.slingT.toFixed(2)} dv${p.diveT.toFixed(2)} aj${p.airJumps} ch${p.charge.toFixed(2)} m${p.mass.toFixed(1)} | o(${o.x|0},${o.y|0}) v(${o.vx|0},${o.vy|0}) og${+o.onGround} | rope ${G.rope.len|0} s${G.rope.strain.toFixed(2)} inp:${Object.keys(inp).filter(k=>inp[k]).join('')}`);
    }
    log.push('END ' + JSON.stringify(T.whys));
    TYA.over[0] = null;
    return log;
  }, { id, lvl, reps });
  console.log(out.join('\n'));
  console.log('ERR', errors.join(' | '));
  await browser.close();
})();
