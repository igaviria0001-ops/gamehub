/* =========================================================================
   TORNEO COMBINADO — la lógica (sin pantallas).
   Formatos:
   · serie: dos jugadores, al mejor de N pruebas.
   · liga: todos contra todos (1 o 2 vueltas), cada cruce al mejor de 1 o 3;
     puntos por ganar/empatar/perder y, si se quiere, final entre los 2 primeros.
   · elim: eliminatoria con llaves (los que sobran pasan directo), tercer puesto opcional.
   · rey: rey de la pista — el que gana se queda; el primero en llegar a X victorias gana.
   Cada cruce se juega en «pruebas»: una partida de un juego, en un modo y un escenario.
   La prueba se sortea justo antes de jugarla, según el banco de juegos y las reglas.
   ========================================================================= */
const Torneo = (() => {
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const need = bo => Math.floor(bo / 2) + 1;

  // ---------- armar ----------
  function create(cfg) {
    const T = {
      v: 1, id: 't' + Date.now().toString(36), name: cfg.name || 'Copa Galaxia', created: Date.now(),
      format: cfg.format, players: cfg.players.map((p, i) => ({ id: 'p' + i, name: p.name.trim() || 'Jugador ' + (i + 1), color: p.color })),
      rules: Object.assign({}, cfg.rules), pool: JSON.parse(JSON.stringify(cfg.pool)),
      matches: [], events: [], cur: null, done: false, champion: null, podium: [], last: { game: null, map: {}, mode: {} },
      stats: {}, king: null, queue: [], kingWins: {},
    };
    const ids = shuffle(T.players.map(p => p.id)), R = T.rules;
    if (T.format === 'serie') T.matches.push(match(T, ids[0], ids[1], R.bestOf, 'Serie'));
    else if (T.format === 'liga') {
      const L = ids.slice(); if (L.length % 2) L.push(null);
      const n = L.length, rounds = [];
      for (let r = 0; r < n - 1; r++) {
        const pairs = []; for (let i = 0; i < n / 2; i++) { const a = L[i], b = L[n - 1 - i]; if (a && b) pairs.push(r % 2 ? [b, a] : [a, b]); }
        rounds.push(pairs); L.splice(1, 0, L.pop());
      }
      rounds.forEach((pairs, r) => pairs.forEach(([a, b]) => T.matches.push(match(T, a, b, R.bestOf, 'Fecha ' + (r + 1), { round: r }))));
      if (R.legs === 2) rounds.forEach((pairs, r) => pairs.forEach(([a, b]) => T.matches.push(match(T, b, a, R.bestOf, 'Fecha ' + (rounds.length + r + 1), { round: rounds.length + r }))));
      if (R.final) T.matches.push(match(T, null, null, R.final, 'Final', { final: true }));
    } else if (T.format === 'elim') {
      let size = 1; while (size < ids.length) size *= 2;
      const slots = ids.concat(new Array(size - ids.length).fill(null));
      // los que pasan directo quedan repartidos (uno por cruce)
      const seeded = []; for (let i = 0; i < size / 2; i++) seeded.push(slots[i], slots[size - 1 - i]);
      let prev = [], round = 0, total = Math.log2(size);
      for (let i = 0; i < size / 2; i++) prev.push(match(T, seeded[2 * i], seeded[2 * i + 1], R.bestOf, roundName(round, total), { round }));
      T.matches.push(...prev);
      while (prev.length > 1) {
        round++; const next = [];
        for (let i = 0; i < prev.length; i += 2) next.push(match(T, null, null, round === total - 1 ? R.finalBestOf || R.bestOf : R.bestOf, roundName(round, total), { round, from: [prev[i].id, prev[i + 1].id] }));
        if (round === total - 1 && R.third && prev.length === 2) T.matches.push(match(T, null, null, R.bestOf, 'Tercer puesto', { round, third: true, fromL: [prev[0].id, prev[1].id] }));
        T.matches.push(...next); prev = next;
      }
      // el tercer puesto se juega antes de la final
      const fi = T.matches.findIndex(m => m.stage === 'Final'), ti = T.matches.findIndex(m => m.third);
      if (fi >= 0 && ti > fi) { const [t] = T.matches.splice(ti, 1); T.matches.splice(fi, 0, t); }
      for (const m of T.matches) if (m.round === 0 && (!m.a || !m.b)) { m.done = true; m.bye = true; m.winner = m.a || m.b; }
      resolve(T);
    } else if (T.format === 'rey') {
      T.queue = ids.slice(1); T.king = ids[0]; T.players.forEach(p => { T.kingWins[p.id] = 0; });
      T.matches.push(match(T, T.king, T.queue[0], 1, 'Desafío 1', { rey: true }));
    }
    T.players.forEach(p => { T.stats[p.id] = { w: 0, l: 0, d: 0, pts: 0, played: 0, mw: 0, ml: 0, md: 0, games: {} }; });
    return T;
  }
  function roundName(r, total) { const left = total - r; return left === 1 ? 'Final' : left === 2 ? 'Semifinal' : left === 3 ? 'Cuartos de final' : left === 4 ? 'Octavos de final' : 'Ronda ' + (r + 1); }
  function match(T, a, b, bestOf, stage, extra) { return Object.assign({ id: 'm' + (T.matches.length + 1 + (extra && extra.final ? 900 : 0) + (extra && extra.third ? 800 : 0)) + '_' + rnd(1e4), a, b, bestOf: bestOf || 1, stage, wins: {}, draws: 0, events: [], done: false, winner: null }, extra || {}); }
  // llena los cruces que dependen de otros (eliminatoria y final de la liga)
  function resolve(T) {
    const byId = id => T.matches.find(m => m.id === id);
    for (const m of T.matches) {
      if (m.from && (!m.a || !m.b)) { const A = byId(m.from[0]), B = byId(m.from[1]); if (A.done && !m.a) m.a = A.winner; if (B.done && !m.b) m.b = B.winner; }
      if (m.fromL && (!m.a || !m.b)) { const A = byId(m.fromL[0]), B = byId(m.fromL[1]); if (A.done && !m.a) m.a = A.a === A.winner ? A.b : A.a; if (B.done && !m.b) m.b = B.a === B.winner ? B.b : B.a; }
      if (m.final && T.format === 'liga' && !m.a && T.matches.filter(x => !x.final).every(x => x.done)) { const st = standings(T); m.a = st[0].id; m.b = st[1] ? st[1].id : null; }
    }
    // en la eliminatoria, un cruce con un solo jugador (porque el otro venía de un «pasa directo» vacío) se resuelve solo
    for (const m of T.matches) if (m.from && !m.done) { const A = byId(m.from[0]), B = byId(m.from[1]); if (A.done && B.done && (!m.a || !m.b) && (m.a || m.b)) { m.done = true; m.bye = true; m.winner = m.a || m.b; } }
  }

  // ---------- tabla ----------
  function standings(T) {
    const rows = T.players.map(p => Object.assign({ id: p.id, name: p.name, color: p.color }, T.stats[p.id]));
    if (T.format === 'rey') rows.forEach(r => { r.pts = T.kingWins[r.id] || 0; });
    rows.sort((a, b) => b.pts - a.pts || (b.w - b.l) - (a.w - a.l) || b.w - a.w || a.l - b.l || a.name.localeCompare(b.name));
    return rows;
  }

  // ---------- siguiente cruce y siguiente prueba ----------
  function nextMatch(T) {
    if (T.done) return null;
    resolve(T);
    return T.matches.find(m => !m.done && m.a && m.b) || null;
  }
  function curEvent(T) { return T.cur ? T.events.find(e => e.id === T.cur) : null; }
  // sortea la prueba (o deja que alguien elija el juego, según las reglas)
  function makeEvent(T, m, forcedGame) {
    const R = T.rules, games = GAMES.filter(g => T.pool[g.id] && T.pool[g.id].on && enabledModes(T, g).length);
    if (!games.length) return null;
    const k = m.events.length, swap = R.swapSides && k % 2 === 1;
    const ev = { id: 'e' + (T.events.length + 1), match: m.id, n: T.events.length + 1, j1: swap ? m.b : m.a, j2: swap ? m.a : m.b, status: 'ready', winner: null, chars: R.chars };
    let g = forcedGame ? GAME[forcedGame] : null;
    if (!g) {
      if ((R.order === 'pierde' || R.order === 'turnos') && games.length > 1) {
        ev.status = 'choose'; ev.chooser = chooser(T, m); T.events.push(ev); m.events.push(ev.id); T.cur = ev.id; return ev;
      }
      g = chooseGame(T, games);
    }
    fill(T, ev, g); T.events.push(ev); m.events.push(ev.id); T.cur = ev.id;
    return ev;
  }
  function chooser(T, m) {
    if (T.rules.order === 'turnos') return m.events.length % 2 === 0 ? m.a : m.b;
    const wa = m.wins[m.a] || 0, wb = m.wins[m.b] || 0;
    if (wa !== wb) return wa < wb ? m.a : m.b;
    const lastEv = m.events.length ? T.events.find(e => e.id === m.events[m.events.length - 1]) : null;
    if (lastEv && lastEv.winner && lastEv.winner !== 'draw') return lastEv.winner === m.a ? m.b : m.a;
    const sa = T.stats[m.a], sb = T.stats[m.b];
    if (sa.pts !== sb.pts) return sa.pts < sb.pts ? m.a : m.b;
    return Math.random() < 0.5 ? m.a : m.b;
  }
  function chooseGame(T, games) {
    const R = T.rules, last = T.last.game;
    if (R.order === 'rotar') { const order = GAMES.filter(g => games.includes(g)), i = order.findIndex(g => g.id === last); return order[(i + 1) % order.length]; }
    let pool = games; if (R.noRepeat && games.length > 1 && last) pool = games.filter(g => g.id !== last);
    return pick(pool);
  }
  function enabledModes(T, g) { const P = T.pool[g.id]; return g.modes.filter(m => P.modes[m.id] && enabledMaps(T, g, m.id).length); }
  function enabledMaps(T, g, mode) { const P = T.pool[g.id], M = g.modes.find(x => x.id === mode); const list = mapsFor(g, mode); if (M && (M.map || M.maps === 'arenas')) return list.filter(([id]) => M.map || !P.arenas || P.arenas[id] !== false); return list.filter(([id]) => P.maps[id]); }
  // modo, escenario y reglas dentro de un juego
  function fill(T, ev, g) {
    const P = T.pool[g.id], R = T.rules, modes = enabledModes(T, g);
    let mpool = modes; const lm = T.last.mode[g.id]; if (modes.length > 1 && lm) mpool = modes.filter(m => m.id !== lm);
    const M = pick(mpool);
    const maps = enabledMaps(T, g, M.id); let pool = maps; const lmap = T.last.map[g.id];
    if (R.noRepeatMap && maps.length > 1 && lmap) pool = maps.filter(([id]) => id !== lmap);
    const map = pick(pool)[0];
    ev.game = g.id; ev.mode = M.id; ev.map = map; ev.status = 'ready';
    ev.rounds = M.len ? M.len[LEN_IDX[P.len || 'normal']] : null;
    ev.opts = Object.assign({}, P.opts || {});
  }
  // otra vez el sorteo (mismo cruce, misma prueba)
  function reroll(T, sameGame) {
    const ev = curEvent(T); if (!ev || ev.status === 'done') return null;
    if (sameGame && ev.game) { fill(T, ev, GAME[ev.game]); return ev; }
    const games = GAMES.filter(g => T.pool[g.id] && T.pool[g.id].on && enabledModes(T, g).length);
    const others = games.filter(g => g.id !== ev.game);
    fill(T, ev, pick(others.length ? others : games)); return ev;
  }
  function chooseFor(T, gameId) { const ev = curEvent(T); if (!ev) return null; fill(T, ev, GAME[gameId]); return ev; }

  // ---------- resultado de una prueba ----------
  // w = id del jugador que ganó, o 'draw'
  function record(T, evId, w, info) {
    const ev = T.events.find(e => e.id === evId); if (!ev || ev.status === 'done') return null;
    const m = T.matches.find(x => x.id === ev.match);
    ev.status = 'done'; ev.winner = w; ev.at = Date.now(); ev.info = info || null;
    T.last.game = ev.game; T.last.map[ev.game] = ev.map; T.last.mode[ev.game] = ev.mode;
    const sa = T.stats[m.a], sb = T.stats[m.b];
    [m.a, m.b].forEach(id => { const s = T.stats[id]; s.played++; s.games[ev.game] = s.games[ev.game] || { w: 0, p: 0 }; s.games[ev.game].p++; });
    if (w === 'draw') { m.draws++; sa.d++; sb.d++; }
    else { m.wins[w] = (m.wins[w] || 0) + 1; const lo = w === m.a ? m.b : m.a; T.stats[w].w++; T.stats[lo].l++; T.stats[w].games[ev.game].w++; }
    T.cur = null;
    settle(T, m, w);
    return ev;
  }
  function settle(T, m, w) {
    const R = T.rules, wa = m.wins[m.a] || 0, wb = m.wins[m.b] || 0, n = need(m.bestOf), played = m.events.length;
    if (T.format === 'rey') {
      const king = T.king, ch = m.a === king ? m.b : m.a;
      if (w !== 'draw') T.kingWins[w] = (T.kingWins[w] || 0) + 1;
      m.done = true; m.winner = w === 'draw' ? null : w;
      const newKing = w === ch ? ch : king, loser = newKing === king ? ch : king;
      T.queue = T.queue.filter(id => id !== ch); T.queue.push(loser); T.king = newKing;
      T.stats[w === 'draw' ? king : newKing].streak = (w === 'draw' ? T.stats[king].streak || 0 : newKing === king ? (T.stats[king].streak || 0) + 1 : 1);
      if (newKing !== king) T.stats[king].streak = 0;
      T.players.forEach(p => { T.stats[p.id].pts = T.kingWins[p.id] || 0; });
      const champ = T.players.find(p => (T.kingWins[p.id] || 0) >= R.kingGoal);
      if (champ) return finish(T, champ.id);
      T.matches.push(match(T, T.king, T.queue[0], 1, 'Desafío ' + (T.matches.length + 1), { rey: true }));
      return;
    }
    let decided = null, isDraw = false;
    if (wa >= n) decided = m.a; else if (wb >= n) decided = m.b;
    else if (T.format === 'liga' && !m.final && m.bestOf === 1 && w === 'draw') isDraw = true;
    // en la liga, si se alargó mucho con empates, se decide por lo que haya
    else if (T.format === 'liga' && !m.final && played >= m.bestOf + 2) { if (wa > wb) decided = m.a; else if (wb > wa) decided = m.b; else isDraw = true; }
    if (!decided && !isDraw) return;
    m.done = true; m.winner = decided;
    const A = T.stats[m.a], B = T.stats[m.b];
    if (isDraw) { A.md++; B.md++; if (!m.final) { A.pts += R.ptsD; B.pts += R.ptsD; } }
    else { const lo = decided === m.a ? m.b : m.a; T.stats[decided].mw++; T.stats[lo].ml++; if (T.format === 'liga' && !m.final) { T.stats[decided].pts += R.ptsW; T.stats[lo].pts += R.ptsL; } }
    if (T.format === 'serie') return finish(T, decided);
    if (T.format === 'elim' && m.stage === 'Final') return finish(T, decided, m);
    resolve(T);
    if (T.format === 'liga' && T.matches.every(x => x.done)) { const fin = T.matches.find(x => x.final); return finish(T, fin ? fin.winner : standings(T)[0].id, fin); }
  }
  function finish(T, champId, finalMatch) {
    T.done = true; T.champion = champId; T.cur = null; T.ended = Date.now();
    if (T.format === 'liga') { const st = standings(T).map(r => r.id); if (finalMatch && finalMatch.winner) { const ru = finalMatch.a === champId ? finalMatch.b : finalMatch.a; T.podium = [champId, ru].concat(st.filter(id => id !== champId && id !== ru)).slice(0, 3); } else T.podium = st.slice(0, 3); }
    else if (T.format === 'elim') { const fm = finalMatch || T.matches.find(m => m.stage === 'Final'), third = T.matches.find(m => m.third); T.podium = [champId, fm ? (fm.a === champId ? fm.b : fm.a) : null, third && third.done ? third.winner : null].filter(Boolean); }
    else if (T.format === 'rey') T.podium = standings(T).map(r => r.id).slice(0, 3);
    else { const m = T.matches[0]; T.podium = [champId, m.a === champId ? m.b : m.a]; }
  }
  // un resultado manual se puede corregir mientras sea el último que se anotó
  function undo(T) {
    const done = T.events.filter(e => e.status === 'done'); if (!done.length || T.format === 'rey' || T.format === 'elim') return false;
    const ev = done[done.length - 1], m = T.matches.find(x => x.id === ev.match);
    if (m.done || T.done) return false;
    const w = ev.winner; [m.a, m.b].forEach(id => { const s = T.stats[id]; s.played--; s.games[ev.game].p--; });
    if (w === 'draw') { m.draws--; T.stats[m.a].d--; T.stats[m.b].d--; } else { m.wins[w]--; const lo = w === m.a ? m.b : m.a; T.stats[w].w--; T.stats[lo].l--; T.stats[w].games[ev.game].w--; }
    ev.status = 'ready'; ev.winner = null; T.cur = ev.id; return true;
  }
  // cuántas pruebas faltan (aprox.) para la barra de avance
  function progress(T) {
    const played = T.events.filter(e => e.status === 'done').length;
    let total;
    if (T.format === 'rey') total = Math.max(played + 1, T.players.length * T.rules.kingGoal - (T.players.length - 1));
    else total = T.matches.reduce((a, m) => a + (m.bye ? 0 : m.done ? m.events.filter(id => (T.events.find(e => e.id === id) || {}).status === 'done').length : Math.max(m.events.length, need(m.bestOf) + (m.bestOf > 1 ? 1 : 0))), 0);
    return { played, total: Math.max(total, played) };
  }
  return { create, nextMatch, makeEvent, curEvent, reroll, chooseFor, record, standings, progress, undo, need, enabledModes, enabledMaps, shuffle };
})();
