// Entrenamiento avanzado: corre cada ejercicio con una estrategia «buena» (guionada) y sin hacer nada,
// en los niveles 1..3, y cuenta aciertos. Uso: node entreno.js [reps] [ids,separados]
const { chromium } = require('playwright');
const path = require('path');
const reps = +(process.argv[2] || 6);
const only = process.argv[3] ? process.argv[3].split(',') : null;
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = []; page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1000);
  await page.evaluate(r => { window.REACT = r; }, +(process.env.REACT || 0));
  const out = await page.evaluate(({ reps, only }) => {
    const E = TYA.Entreno, G = TYA.Game.G, res = [];
    const NONE = () => ({ left: false, right: false, jump: false, stick: false, pull: false, release: false });
    const toward = (inp, p, x, tol = 14) => {
      if (x > p.x + tol) inp.right = true; else if (x < p.x - tol) inp.left = true;
      if ((inp.left || inp.right) && p.onGround) { S.blk = Math.abs(p.x - (S.lx ?? -99)) < 1.5 ? (S.blk || 0) + 1 : 0; if (S.blk > 6) { inp.jump = true; S.blk = -20; } }
      S.lx = p.x;
    };
    const S = {}; // estado del guion
    const STRAT = {
      tiro(T, p, o) {
        const i = NONE(), st = T.rep.S;
        if (T.phase !== 'rep') return i;
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
      aplaston(T, p, o) {
        const i = NONE(); if (T.phase !== 'rep' || !o.alive) return i;
        const lead = o.x + o.vx * 0.35, dx = lead - p.x;
        if (p.onGround) { toward(i, p, lead, 10); if (Math.abs(dx) < 170) { i.jump = true; S.j = 0.3; } }
        else { if (S.j > 0) { S.j -= 1 / 60; i.jump = true; } toward(i, p, o.x + o.vx * 0.15, 6); if (Math.abs(o.x - p.x) < 26 && p.y < o.y - 60) i.stick = true; }
        return i;
      },
      tirachinazo(T, p, o) {
        const i = NONE(); if (T.phase !== 'rep' || !o.alive) return i;
        if (S.fired) return i;
        if (!p.stuck && G.rope.strain < 1.0 && Math.abs(o.x - p.x) < 600) { toward(i, p, p.x + Math.sign(p.x - o.x) * 200); }
        i.stick = true; if (G.rope.strain < 1.08) i.pull = true;
        if (p.stuck && p.charge >= 1) S.fired = true;
        return i;
      },
      salvada() { const i = NONE(); i.pull = true; return i; },
      defensa(T, p, o) {
        const i = NONE(), dx = o.x - p.x, closing = -Math.sign(dx) * o.vx;
        if (S.jt > 0) { S.jt -= 1 / 60; i.jump = true; i[dx > 0 ? 'right' : 'left'] = true; return i; }
        if (!o.onGround && Math.abs(dx) < 260) { i[dx > 0 ? 'left' : 'right'] = true; return i; } // se aleja de la picada
        if (p.onGround && closing > 250 && Math.abs(dx) < 175) { S.jt = 0.3; i.jump = true; }
        if (p.hangT > 0) i.pull = true;
        return i;
      },
      remate(T, p, o) { const i = NONE(); i.release = true; const ex = o.x < 960 ? 266 + 90 : 1654 - 90; if (Math.abs(p.x - ex) > 40 && T.repT > 0.2) toward(i, p, ex); return i; },
      latigo(T, p, o) {
        const i = NONE(); if (T.phase !== 'rep') return i;
        const left = T.rep.toss - T.repT;
        if ((T.rep.warn && left < 0.25) || (T.rep.tossed && T.repT - T.rep.tossT >= (+globalThis.REACT || 0))) { i.stick = true; i.pull = true; }
        return i;
      },
      clavado(T) { return S.bot.think(1 / 60, G); },
      subita(T) { return S.bot.think(1 / 60, G); },
    };
    const ARENA0 = { L: 266, R: 1654 };
    for (let idx = 0; idx < E.LIST.length; idx++) {
      const def = E.LIST[idx];
      if (only && !only.includes(def.id)) continue;
      for (const lvl of [1, 2, 3]) for (const mode of ['bueno', 'quieto']) {
        if (mode === 'quieto' && ['clavado', 'subita', 'combo'].includes(def.id)) continue;
        E.start(idx, lvl);
        const T = G.train; T.lock = true;
        for (let k = 0; k < 60 * 1.2; k++) TYA.Game.update(1 / 60);
        let done = 0, guard = 0, lastTries = T.tries, times = [];
        for (const k in S) delete S[k];
        S.bot = { think: () => NONE() };
        if (def.id === 'clavado' || def.id === 'subita') { S.bot = new (G.bots[1].constructor === E.TrainDummy ? Object : Object)(); }
        while (T.tries < reps && guard < 60 * 60 * 8) {
          guard++;
          if (T.tries !== lastTries) { lastTries = T.tries; for (const k in S) if (k !== 'bot') delete S[k]; }
          if ((def.id === 'clavado' || def.id === 'subita') && !S.botReal) { S.botReal = true; }
          const [p, o] = G.players;
          let inp;
          if (mode === 'quieto') inp = NONE();
          else if (def.id === 'clavado' || def.id === 'subita') { if (!S.b2) S.b2 = TYA.makeBot(0, 2); inp = S.b2.think(1 / 60, G); }
          else inp = STRAT[def.id](T, p, o);
          TYA.over[0] = Object.assign(NONE(), inp);
          TYA.Game.update(1 / 60);
          if (T.phase === 'pause' && T.pauseT < 1 / 59 && def.timed && T.last) times.push(+T.repT.toFixed(1));
        }
        res.push({ id: def.id, lvl, mode, hits: T.hits, tries: T.tries, times: times.join(' ') + ' ' + JSON.stringify(T.whys) });
      }
    }
    TYA.over[0] = null;
    return res;
  }, { reps, only });
  for (const r of out) console.log(`${r.id.padEnd(12)} n${r.lvl} ${r.mode.padEnd(7)} ${r.hits}/${r.tries} ${r.times}`);
  console.log('ERR', errors.slice(0, 6).join('\n'));
  await browser.close();
})();
