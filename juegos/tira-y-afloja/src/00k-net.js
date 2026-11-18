/* =========================================================================
   JUEGO EN LÍNEA (lado del juego) — se copia como src/00k-net.js en cada juego.
   Solo hace algo si GameHub abrió el juego para una partida en línea
   ({ cmd: 'net' }). Suelto o en partidas normales, no toca nada.
   · Anfitrión: el juego corre como siempre; las entradas de los jugadores de
     otros aparatos llegan aquí (NetPlay.input(seat)) y él manda instantáneas
     (30/s, canal sin orden) y eventos (canal confiable).
   · Remoto («títere»): no simula; manda sus entradas (60/s) y dibuja con las
     instantáneas interpoladas 100 ms atrás; efectos y sonidos por eventos.
   Cada juego pone su adaptador en NetGame (ver ONLINE.md, F3):
     NetGame = { seatsMax, readLocal(li), neutral(), snap(), apply(a, b, k), event(e), start(cfg) }
   ========================================================================= */
const NetPlay = (() => {
  const embedded = (() => { try { return window.parent && window.parent !== window; } catch (e) { return true; } })();
  let on = false, role = null, seats = [], mine = [], sid = null, ev = null, hostT = 0, inT = 0, snapN = 0;
  const remote = {}, snaps = [], startSubs = [], msgSubs = [], evQ = [];
  let lagMs = 100, offset = null;
  const G = () => (typeof NetGame !== 'undefined' ? NetGame : null);
  function post(event, data) { if (!embedded) return; try { window.parent.postMessage(Object.assign({ hub: 'gamehub', source: GAME_META.id, event }, data || {}), '*'); } catch (e) { /* nada */ } }
  // ch 'u' = sin orden (entradas, instantáneas) · 'r' = confiable (eventos, fin)
  function send(d, reliable, to) { post('net', { ch: reliable ? 'r' : 'u', to: to || (role === 'host' ? '*' : 'host'), d }); }
  function onNet(d, from) {
    if (!d) return;
    if (d.t === 'in' && role === 'host') { remote[d.s] = { i: d.i, at: performance.now(), from }; return; }
    if (d.t === 's' && role === 'client') { const now = performance.now(), off = d.tm - now; offset = offset == null ? off : Math.max(off, offset * 0.995 + off * 0.005 - 0.2); snaps.push({ tm: d.tm, n: d.n, d: d.d }); while (snaps.length > 30) snaps.shift(); return; }
    if (d.t === 'e' && role === 'client') { const g = G(); if (g && g.event) for (const e of d.l) { try { g.event(e); } catch (err) { /* nada */ } } return; }
    for (const f of msgSubs) { try { f(d, from); } catch (e) { /* nada */ } }
  }
  if (embedded) addEventListener('message', e => {
    const m = e.data; if (!m || m.hub !== 'gamehub' || e.source !== window.parent) return;
    if (m.cmd === 'net') begin(m);
    else if (m.cmd === 'netin') onNet(m.d, m.from);
    else if (m.cmd === 'netoff') end();
  });
  function begin(m) {
    end(); on = true; role = m.role; seats = m.seats || []; mine = m.mine || []; sid = m.sid; ev = m.ev || null; snaps.length = 0; offset = null; snapN = 0;
    if (role === 'host') hostT = setInterval(hostTick, 33);
    else inT = setInterval(clientTick, 16);
    for (const f of startSubs) { try { f({ role, seats, mine, sid, ev }); } catch (err) { post('error', { msg: String(err && err.message || err) }); } }
  }
  function end() { clearInterval(hostT); clearInterval(inT); hostT = inT = 0; on = false; role = null; for (const k in remote) delete remote[k]; snaps.length = 0; evQ.length = 0; }
  // anfitrión: instantánea + eventos acumulados
  function hostTick() {
    const g = G(); if (!g || !g.snap) return;
    let d; try { d = g.snap(); } catch (e) { return; }
    if (d) send({ t: 's', n: ++snapN, tm: performance.now(), d }, false, '*');
    if (evQ.length) send({ t: 'e', l: evQ.splice(0, evQ.length) }, true, '*');
  }
  // remoto: las entradas de sus jugadores (cada 16 ms; si no cambian, cada 66 ms)
  const lastIn = {};
  function clientTick() {
    const g = G(); if (!g || !g.readLocal) return; const now = performance.now();
    mine.forEach((seat, li) => {
      let i; try { i = g.readLocal(li); } catch (e) { return; }
      const s = JSON.stringify(i), L = lastIn[seat];
      if (L && L.s === s && now - L.t < 66) return;
      lastIn[seat] = { s, t: now }; send({ t: 'in', s: seat, i }, false, 'host');
    });
  }
  return {
    get on() { return on; }, get role() { return role; }, get isHost() { return on && role === 'host'; }, get isClient() { return on && role === 'client'; },
    get seats() { return seats; }, get mine() { return mine; }, get sid() { return sid; }, get ev() { return ev; },
    // ¿este puesto se juega en este aparato? y con qué jugador local (0 o 1)
    local(seat) { const k = mine.indexOf(seat); return k; },
    // anfitrión: la entrada del puesto remoto (o neutra si dejó de llegar)
    input(seat) { const r = remote[seat]; const g = G(); if (!r || performance.now() - r.at > 500) return g && g.neutral ? g.neutral() : null; return r.i; },
    // el juego avisa eventos (golpes, sonidos, efectos) para los remotos
    event(e) { if (on && role === 'host') { evQ.push(e); if (evQ.length > 200) evQ.splice(0, evQ.length - 200); } },
    // remoto: las dos instantáneas alrededor del momento a dibujar y cuánto avanzar entre ellas (0..1)
    sample() {
      if (!snaps.length) return null; if (snaps.length === 1 || offset == null) { const s = snaps[snaps.length - 1]; return { a: s.d, b: s.d, k: 1 }; }
      const t = performance.now() + offset - lagMs;
      for (let i = snaps.length - 1; i > 0; i--) { const a = snaps[i - 1], b = snaps[i]; if (a.tm <= t) { const k = b.tm > a.tm ? Math.min(1, Math.max(0, (t - a.tm) / (b.tm - a.tm))) : 1; return { a: a.d, b: b.d, k }; } }
      return { a: snaps[0].d, b: snaps[0].d, k: 1 };
    },
    set lag(ms) { lagMs = ms; },
    send, onStart(f) { startSubs.push(f); }, onMsg(f) { msgSubs.push(f); },
    // fin de la partida en línea (lo dice el anfitrión): resultado para todos
    finish(res) { if (on && role === 'host') send({ t: 'fin', res }, true, '*'); },
  };
})();
