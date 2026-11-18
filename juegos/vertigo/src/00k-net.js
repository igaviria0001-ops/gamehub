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
  const noPred = (() => { try { return /[?&]nopred\b/.test(location.search) || /[?&]nopred\b/.test(window.parent.location.search); } catch (e) { return false; } })();
  let lagMs = 100, offset = null, lagFixed = false, rtt = 80;
  // colchón de interpolación que se ajusta solo: con red pareja, poquito (responde antes); con red a saltos, más (no tiembla)
  let lastArr = 0, lastTm = 0, jit = 8, gap = 33;
  function adapt(now, tm) {
    if (lastArr && tm > lastTm) { const g = tm - lastTm, j = Math.abs((now - lastArr) - g); gap = gap * 0.9 + g * 0.1; jit = j > jit ? jit * 0.7 + j * 0.3 : jit * 0.98 + j * 0.02; }
    lastArr = now; lastTm = tm;
    if (!lagFixed) { const want = Math.min(250, Math.max(55, gap * 1.5 + jit * 3 + 8)); lagMs += (want - lagMs) * (want > lagMs ? 0.25 : 0.02); }
  }
  // reloj del anfitrión: lo que tardó la instantánea MÁS rápida de los últimos 2 s (sin atascos), con paso suave;
  // así se reajusta solo si la red cambia (wifi ↔ datos) y no se queda pegado a un valor viejo
  const offW = [];
  function clock(now, off) {
    offW.push(now, off); while (offW.length > 2 && now - offW[0] > 2000) offW.splice(0, 2);
    let best = -Infinity; for (let i = 1; i < offW.length; i += 2) if (offW[i] > best) best = offW[i];
    offset = offset == null ? best : offset + (best - offset) * (best > offset ? 0.3 : 0.08);
  }
  const G = () => (typeof NetGame !== 'undefined' ? NetGame : null);
  function post(event, data) { if (!embedded) return; try { window.parent.postMessage(Object.assign({ hub: 'gamehub', source: GAME_META.id, event }, data || {}), '*'); } catch (e) { /* nada */ } }
  // ch 'u' = sin orden (entradas, instantáneas) · 'r' = confiable (eventos, fin)
  function send(d, reliable, to) { post('net', { ch: reliable ? 'r' : 'u', to: to || (role === 'host' ? '*' : 'host'), d }); }
  function onNet(d, from) {
    if (!d) return;
    if (d.t === 'in' && role === 'host') { remote[d.s] = { i: d.i, at: performance.now(), from }; return; }
    if (d.t === 's' && role === 'client') { const now = performance.now(); adapt(now, d.tm); clock(now, d.tm - now); Lost.ok(); snaps.push({ tm: d.tm, n: d.n, d: d.d, arr: now }); while (snaps.length > 30) snaps.shift(); return; }
    if (d.t === 'e' && role === 'client') { const g = G(); if (g && g.event) for (const e of d.l) { try { g.event(e); } catch (err) { /* nada */ } } return; }
    for (const f of msgSubs) { try { f(d, from); } catch (e) { /* nada */ } }
  }
  if (embedded) addEventListener('message', e => {
    const m = e.data; if (!m || m.hub !== 'gamehub' || e.source !== window.parent) return;
    if (m.cmd === 'net') begin(m);
    else if (m.cmd === 'netin') onNet(m.d, m.from);
    else if (m.cmd === 'netoff') end();
    else if (m.cmd === 'netrtt' && m.rtt > 0 && m.rtt < 3000) rtt = m.rtt; // ida y vuelta hasta el anfitrión (lo mide GameHub)
  });
  function begin(m) {
    end(); for (const k in slowLast) delete slowLast[k]; on = true; role = m.role; seats = m.seats || []; mine = m.mine || []; sid = m.sid; ev = m.ev || null; snaps.length = 0; offset = null; offW.length = 0; snapN = 0;
    // cada juego puede pedir su ritmo (instantáneas por segundo) y su colchón de interpolación
    { const g = G(), hz = (g && g.rate) || 30; lagFixed = !!(g && g.lag); lagMs = (g && g.lag) || Math.max(100, Math.round(2.6 * 1000 / hz)); lastArr = 0; jit = 8; gap = 1000 / hz; if (role === 'host') { hostT = setInterval(hostTick, Math.round(1000 / hz)); post('netinfo', { slow: (g && g.slowKeys) || [] }); } else inT = setInterval(clientTick, 16); }
    for (const f of startSubs) { try { f({ role, seats, mine, sid, ev }); } catch (err) { post('error', { msg: String(err && err.message || err) }); } }
  }
  // solo números, textos y listas simples (sin objetos del juego, que no viajan)
  function clean(e) { const o = {}; for (const k in e) { const v = e[k]; const t = typeof v; if (t === 'number') o[k] = Math.round(v * 1000) / 1000; else if (t === 'string' || t === 'boolean') o[k] = v; else if (Array.isArray(v) && v.length < 40 && v.every(x => typeof x !== 'object' && typeof x !== 'function')) o[k] = v.slice(); } return o; }
  function end() { clearInterval(hostT); clearInterval(inT); hostT = inT = 0; on = false; Lost.ok(); if (typeof clearTimeout === 'function') { clearTimeout(wtick); clearTimeout(askT); } pend = false; role = null; for (const k in remote) delete remote[k]; snaps.length = 0; evQ.length = 0; }
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
    if (gcfg && lastArr && now - lastArr > 1500) Lost.show();
    mine.forEach((seat, li) => {
      let i; try { i = g.readLocal(li); } catch (e) { return; }
      const s = JSON.stringify(i), L = lastIn[seat];
      if (L && L.s === s && now - L.t < 66) return;
      lastIn[seat] = { s, t: now }; send({ t: 'in', s: seat, i }, false, 'host');
    });
  }
  // remoto: al apretar o soltar algo, la entrada sale YA (no espera al próximo tick de 16 ms); después de que el juego la registró
  const nowIn = () => { if (on && role === 'client') setTimeout(clientTick, 0); };
  for (const ev of ['keydown', 'keyup', 'pointerdown', 'pointerup', 'touchstart', 'touchend']) addEventListener(ev, nowIn, { passive: true });
  /* ---------- sala de espera y arranque (común a los 4 juegos) ----------
     NetPlay.gate({ me(li) → lo de este jugador local (personaje, pinta…),
                    make(want, ev) → cfg de la partida (solo el anfitrión; want[puesto] = lo que mandó cada uno),
                    apply(cfg) → arrancar la partida con esa cfg (todos) })
     Nadie arranca hasta que todos cargaron el juego (o pasan 25 s; el anfitrión puede «Empezar ya» a los 5 s).
     «Otra partida»: NetPlay.again(f) → el anfitrión arma otra cfg (id+1) y todos la aplican. */
  let gateO = null, gcfg = null, want = {}, pend = false, t0 = 0, wtick = 0, askT = 0;
  const Wait = (() => {
    let el = null;
    function show() {
      if (el) return el; el = document.createElement('div'); el.id = 'netWait';
      el.innerHTML = `<style>#netWait{position:fixed;inset:0;z-index:9000;display:grid;place-items:center;background:radial-gradient(ellipse at 50% 40%,rgba(20,30,60,.86),rgba(3,6,13,.96));font-family:Nunito,system-ui,sans-serif;color:#eef3ff;padding:16px}
#netWait .b{width:min(420px,100%);text-align:center;display:grid;gap:14px}#netWait h2{margin:0;font-size:clamp(20px,4.5vw,28px);font-weight:900;letter-spacing:.5px}
#netWait .sp{width:46px;height:46px;margin:0 auto;border-radius:50%;border:4px solid rgba(255,255,255,.14);border-top-color:#5ad8ff;animation:nwS 0.9s linear infinite}@keyframes nwS{to{transform:rotate(360deg)}}
#netWait ul{list-style:none;margin:0;padding:0;display:grid;gap:8px}#netWait li{display:flex;align-items:center;gap:10px;padding:9px 14px;border-radius:12px;background:rgba(255,255,255,.06);font-weight:800}
#netWait li i{width:12px;height:12px;border-radius:50%;flex:none}#netWait li span{flex:1;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#netWait li b{font-size:13px;color:#8a97b8}#netWait li.ok b{color:#6ff0b0}
#netWait button{justify-self:center;font:inherit;font-weight:900;border:0;border-radius:999px;padding:11px 22px;background:linear-gradient(#3dffa0,#18b870);color:#04210f;cursor:pointer}#netWait p{margin:0;color:#8a97b8;font-size:14px}</style>
<div class="b"><div class="sp"></div><h2>Preparando la partida…</h2><ul></ul><p></p><button hidden>Empezar ya</button></div>`;
      document.body.appendChild(el); el.querySelector('button').onclick = () => launch(); return el;
    }
    function list(ready, note, canGo) {
      const e = show(); e.querySelector('ul').innerHTML = '';
      seats.forEach((s, i) => { const li = document.createElement('li'), ok = ready.includes(i); li.className = ok ? 'ok' : ''; li.innerHTML = '<i></i><span></span><b></b>'; li.querySelector('i').style.background = /^#[0-9a-f]{3,8}$/i.test(s.color || '') ? s.color : '#fff'; li.querySelector('span').textContent = s.name || 'J' + (i + 1); li.querySelector('b').textContent = ok ? 'listo ✓' : 'cargando…'; e.querySelector('ul').appendChild(li); });
      e.querySelector('p').textContent = note || ''; e.querySelector('button').hidden = !canGo;
    }
    return { list, hide() { if (el) { el.remove(); el = null; } } };
  })();
  // aviso suave si el anfitrión deja de mandar (salió de la app, se le fue la señal): se quita solo al volver
  const Lost = (() => {
    let el = null;
    return {
      show() { if (el) return; el = document.createElement('div'); el.id = 'netLost'; el.setAttribute('role', 'status');
        el.innerHTML = '<style>#netLost{position:fixed;left:50%;top:max(10px,env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:8999;display:flex;align-items:center;gap:10px;max-width:calc(100% - 24px);padding:9px 16px;border-radius:999px;background:rgba(6,10,22,.86);color:#eef3ff;font:800 14px Nunito,system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.4);pointer-events:none}#netLost i{width:14px;height:14px;flex:none;border-radius:50%;border:3px solid rgba(255,255,255,.18);border-top-color:#ffd36b;animation:nlS .9s linear infinite}@keyframes nlS{to{transform:rotate(360deg)}}</style><i></i><span>Esperando al anfitrión… (si salió de la app, la partida sigue cuando vuelva)</span>';
        document.body.appendChild(el); },
      ok() { if (el) { el.remove(); el = null; } },
    };
  })();
  const myInfo = () => mine.map((seat, li) => { let m = null; try { m = gateO.me(li); } catch (e) { m = null; } return { s: seat, m }; });
  function launch() {
    if (!pend || !gateO) return; pend = false; clearTimeout(wtick);
    let c = null; try { c = gateO.make(want, ev || {}); } catch (e) { post('error', { msg: 'make: ' + (e && e.message) }); }
    if (!c) return; gcfg = Object.assign({ id: 1 }, c); Wait.hide(); send({ t: 'cfg', cfg: gcfg }, true, '*');
    try { gateO.apply(gcfg); } catch (e) { post('error', { msg: 'apply: ' + (e && e.message) }); }
  }
  startSubs.push(o => {
    if (!gateO) return; gcfg = null; want = {}; clearTimeout(wtick); clearTimeout(askT);
    if (o.role === 'host') {
      pend = true; t0 = performance.now(); for (const x of myInfo()) want[x.s] = x.m || {};
      const tick = () => { if (!pend || !on) return; const ready = Object.keys(want).map(Number), all = ready.length >= seats.length, el = performance.now() - t0;
        Wait.list(ready, all ? '¡Todos listos!' : 'Esperando a que todos carguen el juego…', el > 5000); send({ t: 'wait', ready }, true, '*');
        if (all || el > 25000) launch(); else wtick = setTimeout(tick, 250); };
      tick();
    } else {
      Wait.list([], 'Esperando al anfitrión…', false);
      const ask = () => { if (!gcfg && on && role === 'client') { send({ t: 'want', me: myInfo() }, true, 'host'); askT = setTimeout(ask, 1500); } }; ask();
    }
  });
  msgSubs.push(d => {
    if (!gateO || !d) return;
    if (d.t === 'cfg' && role === 'client' && d.cfg && (!gcfg || gcfg.id !== d.cfg.id)) { gcfg = d.cfg; Wait.hide(); try { gateO.apply(gcfg); } catch (e) { post('error', { msg: 'apply: ' + (e && e.message) }); } }
    if (d.t === 'wait' && role === 'client' && !gcfg && Array.isArray(d.ready)) Wait.list(d.ready, 'Esperando a que todos carguen el juego…', false);
    if (d.t === 'want' && role === 'host') {
      if (Array.isArray(d.me)) for (const x of d.me) { const s = +x.s; if (s >= 0 && s < seats.length && !mine.includes(s) && !want[s]) want[s] = x.m && typeof x.m === 'object' ? x.m : {}; }
      if (gcfg) send({ t: 'cfg', cfg: gcfg }, true, '*');
    }
  });
  function again(f) { if (role !== 'host' || !gcfg || !gateO) return; const c = f ? f(gcfg) : gcfg; gcfg = Object.assign({}, c, { id: gcfg.id + 1 }); send({ t: 'cfg', cfg: gcfg }, true, '*'); try { gateO.apply(gcfg); } catch (e) { post('error', { msg: 'apply: ' + (e && e.message) }); } }
  // textos e identificadores que llegan de otro aparato: solo lo simple
  const okId = v => (typeof v === 'string' && v.length < 40 && /^[\w.-]*$/.test(v) ? v : '');
  // partes «lentas» de la instantánea: solo viajan si cambiaron (y al menos una vez por segundo, por si se perdió una)
  const slowLast = {};
  function slow(k, v, ms = 1000) { if (v === undefined) return undefined; const j = JSON.stringify(v), now = performance.now(), L = slowLast[k]; if (L && L.j === j && now - L.t < ms) return undefined; slowLast[k] = { j, t: now }; return v; }
  return {
    gate(o) { gateO = o; }, again, get cfg() { return gcfg; }, okId, slow,
    get on() { return on; }, get role() { return role; }, get isHost() { return on && role === 'host'; }, get isClient() { return on && role === 'client'; },
    get seats() { return seats; }, get mine() { return mine; }, get sid() { return sid; }, get ev() { return ev; },
    // ¿este puesto se juega en este aparato? y con qué jugador local (0 o 1)
    local(seat) { const k = mine.indexOf(seat); return k; },
    // anfitrión: la entrada del puesto remoto (o neutra si dejó de llegar)
    input(seat) { const r = remote[seat]; const g = G(); if (!r || performance.now() - r.at > 500) return g && g.neutral ? g.neutral() : null; return r.i; },
    // el juego avisa eventos (golpes, sonidos, efectos) para los remotos
    event(e) { if (on && role === 'host') { evQ.push(clean(e)); if (evQ.length > 200) evQ.splice(0, evQ.length - 200); } },
    // remoto: las dos instantáneas alrededor del momento a dibujar y cuánto avanzar entre ellas (0..1)
    sample() {
      if (!snaps.length) return null;
      // si el dibujo se salta instantáneas, lo «lento» que traían (solo viaja cuando cambia) pasa a la que sí se usa
      const sk = G() && G().slowKeys; if (sk && snaps.length > 1) { for (let i = 1; i < snaps.length; i++) { const p = snaps[i - 1], c = snaps[i]; if (p._used) continue; for (const k of sk) if (p.d[k] !== undefined && c.d[k] === undefined) c.d[k] = p.d[k]; } } if (snaps.length === 1 || offset == null) { const s = snaps[snaps.length - 1]; return { a: s.d, b: s.d, k: 1 }; }
      const t = performance.now() + offset - lagMs;
      for (let i = snaps.length - 1; i > 0; i--) { const a = snaps[i - 1], b = snaps[i]; if (a.tm <= t) { const k = b.tm > a.tm ? Math.min(1, Math.max(0, (t - a.tm) / (b.tm - a.tm))) : 1; return { a: a.d, b: b.d, k, dt: (b.tm - a.tm) / 1000 }; } }
      return { a: snaps[0].d, b: snaps[0].d, k: 1 };
    },
    set lag(ms) { lagMs = ms; lagFixed = true; }, get lag() { return lagMs; },
    // predicción del personaje propio (remoto): la instantánea más nueva (con su hora de llegada) y el ping al anfitrión
    latest() { return snaps.length ? snaps[snaps.length - 1] : null; }, get rtt() { return rtt; },
    // ¿predecir? (con ?nopred se apaga, para comparar)
    get pred() { return on && role === 'client' && !noPred; },
    send, onStart(f) { startSubs.push(f); }, onMsg(f) { msgSubs.push(f); },
    // fin de la partida en línea (lo dice el anfitrión): resultado para todos
    finish(res) { if (on && role === 'host') send({ t: 'fin', res }, true, '*'); },
  };
})();
