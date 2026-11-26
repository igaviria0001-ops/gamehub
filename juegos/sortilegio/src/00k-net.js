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
  let lagMs = 100, offset = null, lagFixed = false, rtt = 80, pt = null, ptAt = 0;
  // medidas (pruebas): cuadros dibujados, cuadros sin instantánea nueva para ese momento («hambre»), la racha más larga
  // de hambre, saltos del reloj de dibujo hacia atrás, instantáneas recibidas / desordenadas / perdidas, tamaño (anfitrión)
  const PS = { fr: 0, hungry: 0, hRun: 0, hMax: 0, hEp: 0, back: 0, rx: 0, ooo: 0, miss: 0, maxN: 0, lastPT: 0, lastAt: 0, szN: 0, szSum: 0, szMax: 0, ext: 0 }; // ext: cuadros adelantados (sin congelar)
  function psReset() { for (const k in PS) PS[k] = 0; }
  // colchón de interpolación que se ajusta solo: con red pareja, poquito (responde antes); con red a saltos, más (no tiembla).
  let lastArr = 0, lastTm = 0, jit = 8, gap = 33;
  function adapt(now, tm) {
    if (lastArr && tm > lastTm) { const g = tm - lastTm, j = Math.abs((now - lastArr) - g); gap = gap * 0.9 + g * 0.1; jit = j > jit ? jit * 0.7 + j * 0.3 : jit * 0.98 + j * 0.02; }
    lastArr = now; lastTm = tm;
    if (!lagFixed) { const want = Math.min(400, Math.max(55, gap * 1.5 + jit * 3 + 8)); lagMs += (want - lagMs) * (want > lagMs ? 0.25 : 0.02); }
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
  const STICKY = new Set(['cfg', 'res']), sticky = new Map();
  function send(d, reliable, to) {
    if (role === 'host' && reliable && (!to || to === '*') && d && STICKY.has(d.t)) { if (d.t !== 'cfg') d.c = gcfg ? gcfg.id : 0; sticky.set(d.t, { d, at: performance.now() }); }
    post('net', { ch: reliable ? 'r' : 'u', to: to || (role === 'host' ? '*' : 'host'), d });
  }
  // ¿esto es de otra partida? (cada partida en línea tiene su número: cfg.id). Lo de una partida vieja que llega tarde se
  // bota; si el anfitrión ya va en una nueva y aquí no llegó la cfg (se perdió en un bache), se pide otra vez
  const otherMatch = c => role === 'client' && c != null && gateO && (!gcfg || c !== gcfg.id);
  let cfgAskT = 0;
  function needCfg() { const now = performance.now(); if (now - cfgAskT < 900) return; cfgAskT = now; send({ t: 'want', me: myInfo() }, true, 'host'); }
  const gotOnce = new Set(); // mensajes que el anfitrión repite hasta que llegan (resultados): al juego, una sola vez
  function onNet(d, from) {
    if (!d) return;
    if (d.t === 'in' && role === 'host') { takeInput(d, from); return; }
    if (d.t === 's' && role === 'client') {
      if (otherMatch(d.c)) { if (!gcfg || d.c > gcfg.id) needCfg(); return; }
      const now = performance.now(); PS.rx++; if (d.n < PS.maxN) PS.ooo++; else { if (PS.maxN && d.n > PS.maxN + 1) PS.miss += d.n - PS.maxN - 1; PS.maxN = d.n; }
      // por el canal sin orden pueden llegar desordenadas: van en su lugar (y la repetida se bota)
      let i = snaps.length; while (i > 0 && snaps[i - 1].n > d.n) i--; if (i > 0 && snaps[i - 1].n === d.n) return;
      if (i === snaps.length) { adapt(now, d.tm); clock(now, d.tm - now); }
      Lost.ok(); snaps.splice(i, 0, { tm: d.tm, n: d.n, d: d.d, arr: now }); while (snaps.length > 40) snaps.shift(); return;
    }
    if (d.t === 'e' && role === 'client') { if (otherMatch(d.c)) return; const g = G(); if (g && g.event) for (const e of d.l) { try { g.event(e); } catch (err) { /* nada */ } } return; }
    if (role === 'client' && d.t !== 'cfg' && STICKY.has(d.t)) { if (otherMatch(d.c)) return; const k = d.t + ':' + (d.c || 0); if (gotOnce.has(k)) return; gotOnce.add(k); }
    for (const f of msgSubs) { try { f(d, from); } catch (e) { /* nada */ } }
  }
  /* entradas que llegan al anfitrión: cada cambio trae su número y los 3 anteriores (si uno se pierde, lo trae el siguiente);
     van en fila y cada estado se ve al menos un cuadro (16 ms), así un toque corto nunca se pierde aunque lleguen juntos */
  function takeInput(d, from) {
    const now = performance.now(), R = remote[d.s] || (remote[d.s] = { q: 0, fila: [], at: 0, shown: 0, from });
    R.at = now; R.from = from;
    if (typeof d.q !== 'number') { R.fila = [{ i: d.i }]; return; } // (por si llega de una versión sin número)
    const list = (Array.isArray(d.p) ? d.p : []).concat([[d.q, d.i]]).filter(x => Array.isArray(x) && typeof x[0] === 'number').sort((a, b) => a[0] - b[0]);
    if (d.q < R.q - 1000) R.q = 0; // el remoto empezó de nuevo
    for (const [q, i] of list) if (q > R.q) { R.q = q; R.fila.push({ i }); }
    while (R.fila.length > 8) R.fila.shift();
  }
  function inputOf(seat) {
    const R = remote[seat]; if (!R || !R.fila.length) return null; const now = performance.now();
    if (R.fila.length > 1 && now - R.shown >= 16) { R.fila.shift(); R.shown = now; } else if (!R.shown) R.shown = now;
    return R.fila[0].i;
  }
  if (embedded) addEventListener('message', e => {
    const m = e.data; if (!m || m.hub !== 'gamehub' || e.source !== window.parent) return;
    if (m.cmd === 'net') begin(m);
    else if (m.cmd === 'netin') onNet(m.d, m.from);
    else if (m.cmd === 'netoff') end();
    else if (m.cmd === 'netrtt' && m.rtt > 0 && m.rtt < 3000) { rtt = m.rtt; Slow.set(m.via === 'relay', rtt); } // ida y vuelta hasta el anfitrión (lo mide GameHub) y por dónde va
  });
  function begin(m) {
    end(); for (const k in slowLast) delete slowLast[k]; for (const k in lastIn) delete lastIn[k]; sticky.clear(); gotOnce.clear(); pt = null; on = true; role = m.role; seats = m.seats || []; mine = m.mine || []; sid = m.sid; ev = m.ev || null; snaps.length = 0; offset = null; offW.length = 0; snapN = 0;
    // cada juego puede pedir su ritmo (instantáneas por segundo) y su colchón de interpolación
    { const g = G(), hz = (g && g.rate) || 30; lagFixed = !!(g && g.lag); lagMs = (g && g.lag) || Math.max(100, Math.round(2.6 * 1000 / hz)); lastArr = 0; jit = 8; gap = 1000 / hz; if (role === 'host') { hostT = setInterval(hostTick, Math.round(1000 / hz)); post('netinfo', { slow: (g && g.slowKeys) || [] }); } else inT = setInterval(clientTick, 16); }
    for (const f of startSubs) { try { f({ role, seats, mine, sid, ev }); } catch (err) { post('error', { msg: String(err && err.message || err) }); } }
  }
  // solo números, textos y listas simples (sin objetos del juego, que no viajan)
  function clean(e) { const o = {}; for (const k in e) { const v = e[k]; const t = typeof v; if (t === 'number') o[k] = Math.round(v * 1000) / 1000; else if (t === 'string' || t === 'boolean') o[k] = v; else if (Array.isArray(v) && v.length < 40 && v.every(x => typeof x !== 'object' && typeof x !== 'function')) o[k] = v.slice(); } return o; }
  function end() { clearInterval(hostT); clearInterval(inT); hostT = inT = 0; on = false; Lost.ok(); Slow.hide(); if (typeof clearTimeout === 'function') { clearTimeout(wtick); clearTimeout(askT); } pend = false; role = null; for (const k in remote) delete remote[k]; snaps.length = 0; evQ.length = 0; }
  // anfitrión: instantánea + eventos acumulados
  function hostTick() {
    const g = G(); if (!g || !g.snap) return;
    let d; try { d = g.snap(); } catch (e) { return; }
    const c = gcfg ? gcfg.id : undefined, now = performance.now();
    if (d) { const m = { t: 's', n: ++snapN, tm: now, c, d }; if (snapN % 10 === 1) { const z = JSON.stringify(m).length; PS.szN++; PS.szSum += z; PS.szMax = Math.max(PS.szMax, z); } send(m, false, '*'); }
    if (evQ.length) send({ t: 'e', c, l: evQ.splice(0, evQ.length) }, true, '*');
    for (const x of sticky.values()) if (now - x.at > 1500) { x.at = now; post('net', { ch: 'r', to: '*', d: x.d }); }
  }
  // remoto: las entradas de sus jugadores (cada 16 ms; si no cambian, cada 66 ms)
  const lastIn = {};
  function clientTick() {
    const g = G(); if (!g || !g.readLocal) return; const now = performance.now();
    if (gcfg && lastArr && now - lastArr > 1500) Lost.show();
    mine.forEach((seat, li) => {
      let i; try { i = g.readLocal(li); } catch (e) { return; }
      const s = JSON.stringify(i), L = lastIn[seat] || (lastIn[seat] = { s: null, t: 0, q: 0, h: [] });
      if (L.s === s && now - L.t < 66) return;
      if (L.s !== s) { if (L.s !== null) { L.h.push([L.q, L.i]); if (L.h.length > 3) L.h.shift(); } L.q++; L.s = s; L.i = i; }
      L.t = now; send({ t: 'in', s: seat, q: L.q, i, p: L.h.slice() }, false, 'host');
    });
  }
  // remoto: al apretar o soltar algo, la entrada sale YA (no espera al próximo tick de 16 ms); después de que el juego la registró
  const nowIn = () => { if (on && role === 'client') setTimeout(clientTick, 0); };
  for (const ev of ['keydown', 'keyup', 'pointerdown', 'pointerup', 'touchstart', 'touchend']) addEventListener(ev, nowIn, { passive: true });
  /* ---------- sala de espera, elección de personaje y arranque (común a los 4 juegos) ----------
     NetPlay.gate({ me(li, id) → lo de este jugador local (personaje, pinta…); con id, con ESE personaje,
                    pick: { key, what, list(li) → [{ id, name, sub, c1, c2, lock }], art(canvas, id, li), unique } (opcional),
                    make(want, ev) → cfg de la partida (solo el anfitrión; want[puesto] = lo que mandó cada uno),
                    apply(cfg) → arrancar la partida con esa cfg (todos) })
     ev.chars: 'pick' → antes de arrancar, cada quien escoge su personaje en unos segundos (arranca apenas todos confirman);
               'random' → a cada puesto le toca uno al azar, sin repetir (igual en todos los aparatos: sale del número de la partida);
               otro → el que cada uno ya llevaba en ese juego.
     Nadie arranca hasta que todos cargaron el juego (o pasan 25 s; el anfitrión puede «Empezar ya» a los 5 s).
     «Otra partida»: NetPlay.again(f) → el anfitrión arma otra cfg (id+1) y todos la aplican (con los mismos personajes). */
  let gateO = null, gcfg = null, want = {}, pend = false, t0 = 0, wtick = 0, askT = 0;
  const PICK_MS = 20000;
  let pickOn = false, sel = [], okL = [], pk = {}, pDead = 0, pAtLaunch = -1, pst = null, pLeft = -1, pSent = '', pSentAt = 0;
  const P = () => gateO && gateO.pick;
  const coarse = () => { try { return matchMedia('(hover: none) and (pointer: coarse)').matches; } catch (e) { return false; } };
  const roster = li => { let L = []; try { L = (P().list(li) || []).filter(x => x && typeof x.id === 'string'); } catch (e) { L = []; } return L; };
  // al azar, sin repetir y igual en todos los aparatos: una baraja que sale del número de la partida
  function randId(seat, li) {
    const L = roster(li); if (!L.length) return undefined;
    let h = 2166136261; for (const ch of String(sid || 'x')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    const rnd = () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
    const d = L.map(x => x.id); for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
    const free = id => { const x = L.find(q => q.id === id); return x && !x.lock; };
    return free(d[seat % d.length]) ? d[seat % d.length] : d.slice(seats.length).find(free) || d.find(free);
  }
  const chosen = li => (pickOn ? sel[li] : ev && ev.chars === 'random' && P() ? randId(mine[li], li) : undefined);
  const myInfo = () => mine.map((seat, li) => { let m = null; try { m = gateO.me(li, chosen(li)); } catch (e) { m = null; } return { s: seat, m, ok: pickOn ? !!okL[li] : undefined }; });
  const pickName = id => { const x = roster(0).find(q => q.id === id); return x ? x.name : ''; };
  const okColor = c => (/^#[0-9a-f]{3,8}$/i.test(c || '') ? c : '#fff');
  const Wait = (() => {
    let el = null, pUI = null;
    function show() {
      if (el) return el; el = document.createElement('div'); el.id = 'netWait';
      el.innerHTML = `<style>#netWait{position:fixed;inset:0;z-index:9000;display:grid;place-items:center;background:radial-gradient(ellipse at 50% 30%,rgba(40,26,80,.9),rgba(5,4,16,.97));font-family:Nunito,system-ui,sans-serif;color:#eef3ff;padding:max(10px,env(safe-area-inset-top,0px)) max(12px,env(safe-area-inset-right,0px)) max(10px,env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px));overflow:auto}
#netWait .b{width:min(420px,100%);text-align:center;display:grid;gap:14px}#netWait h2{margin:0;font-size:clamp(20px,4.5vw,28px);font-weight:900;letter-spacing:.5px}
#netWait .sp{width:46px;height:46px;margin:0 auto;border-radius:50%;border:4px solid rgba(255,255,255,.14);border-top-color:#5ad8ff;animation:nwS 0.9s linear infinite}@keyframes nwS{to{transform:rotate(360deg)}}
#netWait ul{list-style:none;margin:0;padding:0;display:grid;gap:8px}#netWait li{display:flex;align-items:center;gap:10px;padding:9px 14px;border-radius:12px;background:rgba(255,255,255,.06);font-weight:800}
#netWait li i{width:12px;height:12px;border-radius:50%;flex:none}#netWait li span{flex:1;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#netWait li b{font-size:13px;color:#8a97b8}#netWait li.ok b{color:#6ff0b0}
#netWait button{justify-self:center;font:inherit;font-weight:900;border:0;border-radius:999px;padding:11px 22px;background:linear-gradient(#3dffa0,#18b870);color:#04210f;cursor:pointer}#netWait p{margin:0;color:#8a97b8;font-size:14px}
#netWait.nwpick{background:radial-gradient(ellipse at 50% 30%,rgba(40,26,80,.95),rgba(5,4,16,.985))}#netWait .pk{width:100%;max-width:1100px;justify-self:center;align-self:center;margin:auto 0;display:grid;gap:clamp(8px,1.6vh,14px);text-align:left}
#netWait .ph{display:flex;align-items:center;gap:12px}#netWait .ph h2{flex:1;font-size:clamp(18px,3.4vw,30px);letter-spacing:.06em;text-transform:uppercase;background:linear-gradient(180deg,#fff,#d4b3ff 60%,#ff9be6);-webkit-background-clip:text;background-clip:text;color:transparent}
#netWait .cd{position:relative;width:clamp(42px,6vw,58px);aspect-ratio:1;flex:none;display:grid;place-items:center;font-weight:900;font-size:clamp(16px,2.4vw,22px)}#netWait .cd svg{position:absolute;inset:0;transform:rotate(-90deg)}#netWait .cd circle{fill:none;stroke-width:4}#netWait .cd .bg{stroke:rgba(255,255,255,.12)}#netWait .cd .fg{stroke:#ffd36b;stroke-linecap:round;transition:stroke-dashoffset .25s linear}#netWait .cd.hot{color:#ff8a8a}#netWait .cd.hot .fg{stroke:#ff6f8a}
#netWait .pps{display:grid;gap:clamp(8px,1.6vw,16px);grid-template-columns:repeat(var(--n,1),minmax(0,1fr))}
#netWait .pp{border-radius:18px;padding:clamp(8px,1.4vw,14px);background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.1);display:grid;gap:clamp(6px,1.2vh,10px);align-content:start;box-shadow:inset 0 3px 0 var(--pc)}
#netWait .pp.done{border-color:color-mix(in srgb,var(--pc) 70%,transparent);background:color-mix(in srgb,var(--pc) 10%,rgba(255,255,255,.04))}
#netWait .pn{display:flex;align-items:center;gap:8px;font-weight:900;font-size:clamp(13px,1.8vw,16px)}#netWait .pn i{width:12px;height:12px;border-radius:50%;background:var(--pc);box-shadow:0 0 10px var(--pc)}#netWait .pn small{margin-left:auto;color:#8a97b8;font-weight:800;font-size:12px}
#netWait .gr{display:grid;grid-template-columns:repeat(auto-fill,minmax(var(--cs,clamp(58px,7.6vw,86px)),1fr));gap:clamp(4px,.8vw,8px)}
#netWait .ch{position:relative;justify-self:stretch;display:grid;justify-items:center;gap:2px;padding:6px 3px 5px;border-radius:14px;background:rgba(255,255,255,.05);border:2px solid transparent;color:#eef3ff;font-weight:800;font-size:clamp(10.5px,1.25vw,12.5px);line-height:1.1;transition:transform .12s,background .12s;box-shadow:none}
#netWait .ch canvas{width:var(--cv,clamp(38px,5.6vw,64px));height:var(--cv,clamp(38px,5.6vw,64px));border-radius:50%;background:radial-gradient(circle at 50% 40%,var(--c1),var(--c2));box-shadow:0 4px 14px rgba(0,0,0,.4)}
#netWait .ch span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#netWait .ch:hover{background:rgba(255,255,255,.1)}#netWait .ch.on{border-color:var(--pc);background:color-mix(in srgb,var(--pc) 22%,rgba(255,255,255,.04));transform:translateY(-2px)}#netWait .ch.on canvas{box-shadow:0 0 0 2px #fff,0 0 22px var(--c1)}
#netWait .ch[disabled]{opacity:.35;cursor:default}#netWait .ch em{position:absolute;top:3px;right:5px;font-style:normal;font-size:12px}
#netWait .pf{display:flex;align-items:center;gap:10px;min-height:44px}#netWait .pf div{flex:1;min-width:0;display:grid}#netWait .pf b{font-size:clamp(15px,2vw,19px);font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#netWait .pf small{color:#a9b3d6;font-weight:700;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#netWait .pf button{flex:none;padding:10px 18px;font-size:15px}#netWait .pf button.no{background:rgba(255,255,255,.12);color:#eef3ff}
#netWait .ps{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}#netWait .ps span{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.07);font-weight:800;font-size:12.5px;color:#cdd5ee}#netWait .ps span i{width:9px;height:9px;border-radius:50%}#netWait .ps span.ok{color:#6ff0b0}
#netWait .pw{text-align:center;color:#a9b3d6;font-weight:800;font-size:14px;padding:12px}
@media (max-height:430px){#netWait .ph h2{font-size:17px}#netWait .gr{grid-template-columns:repeat(auto-fill,minmax(var(--csm,52px),1fr))}#netWait .ch canvas{width:var(--cvm,34px);height:var(--cvm,34px)}#netWait .ch{padding:3px 2px;font-size:10px}#netWait .pf{min-height:36px}#netWait .pf button{padding:7px 14px;font-size:14px}#netWait .pp{padding:7px 8px;gap:5px}}
@media (prefers-reduced-motion:reduce){#netWait .ch{transition:none}}</style>
<div class="b"><div class="sp"></div><h2>Preparando la partida…</h2><ul></ul><p></p><button hidden>Empezar ya</button></div>`;
      document.body.appendChild(el); el.querySelector('.b button').onclick = () => launch(); return el;
    }
    function list(ready, note, canGo) {
      const e = show(); if (pUI) return; e.querySelector('ul').innerHTML = '';
      seats.forEach((s, i) => { const li = document.createElement('li'), ok = ready.includes(i); li.className = ok ? 'ok' : ''; li.innerHTML = '<i></i><span></span><b></b>'; li.querySelector('i').style.background = okColor(s.color); li.querySelector('span').textContent = s.name || 'J' + (i + 1); li.querySelector('b').textContent = ok ? 'listo ✓' : 'cargando…'; e.querySelector('ul').appendChild(li); });
      e.querySelector('p').textContent = note || ''; e.querySelector('.b button').hidden = !canGo;
    }
    // aviso sin lista: «El anfitrión elige el nivel…» (se quita solo cuando llega la partida)
    function msg(title, note) { const e = show(); pickOff(); e.querySelector('h2').textContent = title || ''; e.querySelector('ul').innerHTML = ''; e.querySelector('p').textContent = note || ''; e.querySelector('.b button').hidden = true; }
    /* --- elegir personaje: una columna por jugador de este aparato (con el mouse, el dedo o sus teclas) y abajo, cómo va cada uno --- */
    function pickShow() {
      const e = show(); if (pUI) return; const Q = P(), what = (Q && Q.what) || 'tu personaje';
      e.querySelector('.b').style.display = 'none';
      const box = document.createElement('div'); box.className = 'pk';
      box.innerHTML = `<div class="ph"><h2></h2><div class="cd"><svg viewBox="0 0 48 48"><circle class="bg" cx="24" cy="24" r="21"/><circle class="fg" cx="24" cy="24" r="21" stroke-dasharray="132" stroke-dashoffset="0"/></svg><span>·</span></div></div><div class="pps" style="--n:${Math.max(1, mine.length)}"></div><div class="ps"></div>`;
      box.querySelector('h2').textContent = 'Elige ' + what;
      const pps = box.querySelector('.pps');
      if (!mine.length) { const w = document.createElement('div'); w.className = 'pw'; w.textContent = `Esta vez te toca mirar: los demás eligen ${what}…`; pps.appendChild(w); }
      const cols = [];
      mine.forEach((seat, li) => {
        const S = seats[seat] || {}, L = roster(li), pp = document.createElement('div'); pp.className = 'pp'; pp.style.setProperty('--pc', okColor(S.color));
        pp.innerHTML = `<div class="pn"><i></i><span></span><small></small></div><div class="gr"></div><div class="pf"><div><b></b><small></small></div><button>¡Listo!</button></div>`;
        pp.querySelector('.pn span').textContent = S.name || 'J' + (seat + 1);
        pp.querySelector('.pn small').textContent = mine.length > 1 && !coarse() ? (li ? 'teclas J L I K · O' : 'teclas A D W S · E') : '';
        const gr = pp.querySelector('.gr'), btns = [];
        if (L.length <= 6) { gr.style.setProperty('--cs', 'clamp(76px,10.5vw,118px)'); gr.style.setProperty('--cv', 'clamp(54px,7.8vw,88px)'); gr.style.setProperty('--csm', '66px'); gr.style.setProperty('--cvm', '48px'); }
        for (const it of L) {
          const b = document.createElement('button'); b.className = 'ch'; b.dataset.id = it.id; b.style.setProperty('--c1', okColor(it.c1)); b.style.setProperty('--c2', okColor(it.c2 || it.c1));
          const cv = document.createElement('canvas'); cv.width = cv.height = 128; b.appendChild(cv); const sp = document.createElement('span'); sp.textContent = it.name; b.appendChild(sp);
          if (it.lock) { b.disabled = true; const em = document.createElement('em'); em.textContent = '🔒'; b.appendChild(em); b.title = 'Todavía no lo tienes'; }
          try { if (Q.art) Q.art(cv, it.id, li); else { const x = cv.getContext('2d'); x.fillStyle = 'rgba(255,255,255,.92)'; x.font = '900 60px Nunito,system-ui,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText((it.name || '?')[0], 64, 68); } } catch (er) { /* sin dibujo: queda el color */ }
          b.onclick = () => choose(li, it.id); gr.appendChild(b); btns.push(b);
        }
        pp.querySelector('.pf button').onclick = () => confirm(li);
        pps.appendChild(pp); cols.push({ pp, btns, L });
      });
      e.appendChild(box); e.classList.add('nwpick'); pUI = { box, cols };
      pickDraw();
    }
    function pickOff() { if (!pUI) return; pUI.box.remove(); pUI = null; if (el) el.classList.remove('nwpick'); if (el) el.querySelector('.b').style.display = ''; }
    // pinta el estado: lo escogido, quién ya está listo, qué está tomado (si no se puede repetir) y cuánto falta
    function pickDraw() {
      if (!pUI) return; const Q = P(), uniq = Q && Q.unique, st = pst || [];
      const takenBy = (id, seat) => { for (let i = 0; i < seats.length; i++) if (i !== seat && st[i] && st[i][1] && st[i][0] === id) return seats[i].name || 'J' + (i + 1); for (let k = 0; k < mine.length; k++) if (mine[k] !== seat && okL[k] && sel[k] === id) return seats[mine[k]].name || ''; return ''; };
      pUI.cols.forEach((c, li) => {
        const seat = mine[li], ok = !!okL[li], id = sel[li], it = c.L.find(x => x.id === id);
        c.pp.classList.toggle('done', ok);
        for (const b of c.btns) { const tk = uniq ? takenBy(b.dataset.id, seat) : ''; const lock = c.L.find(x => x.id === b.dataset.id).lock; b.classList.toggle('on', b.dataset.id === id); b.disabled = !!lock || (!!tk && b.dataset.id !== id) || ok && b.dataset.id !== id; b.title = tk ? 'Ya lo tiene ' + tk : lock ? 'Todavía no lo tienes' : ''; }
        c.pp.querySelector('.pf b').textContent = it ? it.name : '—'; c.pp.querySelector('.pf small').textContent = ok ? '¡Listo! Esperando a los demás…' : it ? it.sub || '' : '';
        const bt = c.pp.querySelector('.pf button'); bt.textContent = ok ? 'Cambiar' : '¡Listo!'; bt.className = ok ? 'no' : '';
      });
      const ps = pUI.box.querySelector('.ps'); ps.innerHTML = '';
      seats.forEach((s, i) => { const x = st[i] || [], k = mine.indexOf(i), ld = k >= 0 || x[2], ok = k >= 0 ? okL[k] : x[1], id = k >= 0 ? sel[k] : x[0];
        const sp = document.createElement('span'); sp.className = ok ? 'ok' : ''; sp.innerHTML = '<i></i>'; sp.querySelector('i').style.background = okColor(s.color);
        sp.appendChild(document.createTextNode(`${s.name || 'J' + (i + 1)} · ${!ld ? 'cargando…' : ok ? (pickName(id) || 'listo') + ' ✓' : 'eligiendo…'}`)); ps.appendChild(sp); });
      const cd = pUI.box.querySelector('.cd'), left = pLeft;
      cd.querySelector('span').textContent = left >= 0 ? Math.ceil(left / 1000) : '·'; cd.classList.toggle('hot', left >= 0 && left < 5500);
      cd.querySelector('.fg').setAttribute('stroke-dashoffset', left >= 0 ? String(132 * (1 - Math.min(1, left / PICK_MS))) : '0');
    }
    return { list, msg, pickShow, pickDraw, get picking() { return !!pUI; }, cols: () => (pUI ? pUI.cols : []), hide() { pUI = null; if (el) { el.remove(); el = null; } } };
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
  // aviso chiquito si la conexión va lenta (por el relevo, o ping alto): para saber que el problema es la red
  const Slow = (() => {
    let el = null, bad = 0;
    function set(relay, ms) {
      bad = relay || ms > 350 ? bad + 1 : 0;
      if (bad < 3 || !on || role !== 'client') { if (el) { el.remove(); el = null; } return; }
      if (!el) { el = document.createElement('div'); el.id = 'netSlow'; el.innerHTML = '<style>#netSlow{position:fixed;right:max(8px,env(safe-area-inset-right,0px));top:max(8px,env(safe-area-inset-top,0px));z-index:8998;padding:4px 10px;border-radius:999px;background:rgba(6,10,22,.7);color:#ffd36b;font:800 12px Nunito,system-ui,sans-serif;pointer-events:none;opacity:.9}</style><span></span>'; document.body.appendChild(el); }
      el.querySelector('span').textContent = (relay ? 'Red lenta · por relevo · ' : 'Red lenta · ') + Math.round(ms) + ' ms';
    }
    return { set, hide() { bad = 0; if (el) { el.remove(); el = null; } } };
  })();
  /* --- elegir: lo de este aparato --- */
  function choose(li, id) {
    if (!pickOn || okL[li] || gcfg) return; const it = roster(li).find(x => x.id === id); if (!it || it.lock) return;
    if (P().unique && Wait.picking) { const st = pst || []; if (seats.some((s, i) => i !== mine[li] && ((st[i] && st[i][1] && st[i][0] === id) || (mine.indexOf(i) >= 0 && okL[mine.indexOf(i)] && sel[mine.indexOf(i)] === id)))) return; }
    sel[li] = id; pickSend();
  }
  function confirm(li) { if (!pickOn || gcfg || !sel[li]) return; if (!okL[li] && P().unique && takenOther(li, sel[li])) return; okL[li] = !okL[li]; pickSend(); }
  const takenOther = (li, id) => { const st = pst || []; return seats.some((s, i) => i !== mine[li] && ((st[i] && st[i][1] && st[i][0] === id) || (mine.indexOf(i) >= 0 && okL[mine.indexOf(i)] && sel[mine.indexOf(i)] === id))); };
  function pickSend() {
    if (role === 'host') { for (const x of myInfo()) { want[x.s] = x.m || {}; pk[x.s] = { id: sel[mine.indexOf(x.s)], ok: !!x.ok }; } hostPst(true); }
    else send({ t: 'want', me: myInfo() }, true, 'host');
    Wait.pickDraw();
  }
  // anfitrión: cómo va la elección, para todos (al cambiar algo, y una vez por segundo por si se perdió)
  function hostPst(force) {
    const now = performance.now(); pLeft = pDead ? Math.max(0, pDead - now) : -1;
    pst = seats.map((s, i) => [pk[i] ? pk[i].id || '' : '', pk[i] && pk[i].ok ? 1 : 0, want[i] ? 1 : 0]);
    const j = JSON.stringify(pst); if (force || j !== pSent || now - pSentAt > 1000) { pSent = j; pSentAt = now; send({ t: 'pst', st: pst, left: Math.round(pLeft) }, true, '*'); }
    Wait.pickDraw();
  }
  // teclas mientras se elige (J1: A D W S y E; J2: J L I K u O, o las flechas y Enter): que no le lleguen al juego de atrás
  addEventListener('keydown', e => {
    if (!Wait.picking || e.repeat && /^(e|o|enter| )$/i.test(e.key)) { if (Wait.picking) { e.preventDefault(); e.stopPropagation(); } return; }
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key, K1 = { a: -1, d: 1, w: 'u', s: 'd', e: 'ok', f: 'ok', ' ': 'ok' }, K2 = { j: -1, l: 1, i: 'u', k: 'd', o: 'ok', ArrowLeft: -1, ArrowRight: 1, ArrowUp: 'u', ArrowDown: 'd', Enter: 'ok' };
    let li = -1, a; if (k in K1) { li = 0; a = K1[k]; } else if (k in K2) { li = mine.length > 1 ? 1 : 0; a = K2[k]; }
    e.stopPropagation(); if (li < 0) return; e.preventDefault(); const c = Wait.cols()[li]; if (!c || !c.L.length) return;
    if (a === 'ok') { confirm(li); return; }
    if (okL[li]) return;
    const free = c.btns.filter(b => !b.disabled || b.dataset.id === sel[li]), cur = Math.max(0, c.btns.findIndex(b => b.dataset.id === sel[li]));
    const row0 = c.btns[0].offsetTop, per = Math.max(1, c.btns.filter(b => b.offsetTop === row0).length), step = a === 'u' ? -per : a === 'd' ? per : a;
    for (let n = cur + step, t = 0; t < c.btns.length; n += Math.sign(step), t++) { const i = (n + c.btns.length) % c.btns.length; if (free.includes(c.btns[i])) { choose(li, c.btns[i].dataset.id); break; } }
  }, true);
  function launch() {
    if (!pend || !gateO) return; pend = false; clearTimeout(wtick); pAtLaunch = pDead ? Math.round(pDead - performance.now()) : -1;
    let c = null; try { c = gateO.make(want, ev || {}); } catch (e) { post('error', { msg: 'make: ' + (e && e.message) }); }
    if (!c) return; gcfg = Object.assign({ id: 1 }, c); Wait.hide(); send({ t: 'cfg', cfg: gcfg }, true, '*');
    try { gateO.apply(gcfg); } catch (e) { post('error', { msg: 'apply: ' + (e && e.message) }); }
  }
  startSubs.push(o => {
    if (!gateO) return; gcfg = null; want = {}; clearTimeout(wtick); clearTimeout(askT);
    pickOn = !!(ev && ev.chars === 'pick' && P() && roster(0).length > 1); pk = {}; pDead = 0; pst = null; pLeft = -1; pSent = ''; okL = mine.map(() => false);
    // de entrada queda marcado el de siempre (si está abierto); cada quien lo cambia y confirma
    sel = mine.map((s, li) => { if (!pickOn) return undefined; const L = roster(li), cur = (() => { try { return (gateO.me(li) || {})[P().key]; } catch (e) { return undefined; } })(); const ok = id => L.some(x => x.id === id && !x.lock); return ok(cur) ? cur : (L.find(x => !x.lock) || {}).id; });
    if (pickOn && P().unique) for (let k = 1; k < sel.length; k++) if (sel.slice(0, k).includes(sel[k])) sel[k] = (roster(k).find(x => !x.lock && !sel.includes(x.id)) || {}).id || sel[k];
    if (o.role === 'host') {
      pend = true; t0 = performance.now(); for (const x of myInfo()) { want[x.s] = x.m || {}; if (pickOn) pk[x.s] = { id: sel[mine.indexOf(x.s)], ok: false }; }
      if (pickOn) Wait.pickShow();
      const tick = () => { if (!pend || !on) return; const ready = Object.keys(want).map(Number), all = ready.length >= seats.length, now = performance.now(), el = now - t0;
        if (pickOn) {
          if (!pDead && (all || el > 25000)) pDead = now + PICK_MS;
          const allOk = seats.every((s, i) => pk[i] && pk[i].ok); hostPst(false);
          if ((all && allOk) || (pDead && now >= pDead)) { launch(); return; }
          wtick = setTimeout(tick, 250); return;
        }
        Wait.list(ready, all ? '¡Todos listos!' : 'Esperando a que todos carguen el juego…', el > 5000); send({ t: 'wait', ready }, true, '*');
        if (all || el > 25000) launch(); else wtick = setTimeout(tick, 250); };
      tick();
    } else {
      if (pickOn) Wait.pickShow(); else Wait.list([], 'Esperando al anfitrión…', false);
      const ask = () => { if (!gcfg && on && role === 'client') { send({ t: 'want', me: myInfo() }, true, 'host'); askT = setTimeout(ask, 1500); } }; ask();
    }
  });
  msgSubs.push(d => {
    if (!gateO || !d) return;
    if (d.t === 'cfg' && role === 'client' && d.cfg && typeof d.cfg.id === 'number' && (!gcfg || d.cfg.id > gcfg.id)) { gcfg = d.cfg; snaps.length = 0; pt = null; Wait.hide(); try { gateO.apply(gcfg); } catch (e) { post('error', { msg: 'apply: ' + (e && e.message) }); } }
    if (d.t === 'wait' && role === 'client' && !gcfg && Array.isArray(d.ready)) { if (pickOn) Wait.pickShow(); else Wait.list(d.ready, 'Esperando a que todos carguen el juego…', false); }
    if (d.t === 'pst' && role === 'client' && !gcfg && pickOn && Array.isArray(d.st)) {
      pst = d.st.slice(0, seats.length).map(x => (Array.isArray(x) ? [okId(x[0]), x[1] ? 1 : 0, x[2] ? 1 : 0] : ['', 0, 0])); pLeft = typeof d.left === 'number' ? d.left : -1;
      // el anfitrión no aceptó el «listo» (otro ya tenía ese personaje): se vuelve a elegir
      let back = false; mine.forEach((s, li) => { if (okL[li] && pst[s] && pst[s][2] && !pst[s][1] && pst[s][0] === sel[li] && P().unique && takenOther(li, sel[li])) { okL[li] = false; back = true; } });
      Wait.pickShow(); Wait.pickDraw(); if (back) send({ t: 'want', me: myInfo() }, true, 'host');
    }
    if (d.t === 'want' && role === 'host') {
      if (Array.isArray(d.me)) for (const x of d.me) { const s = +x.s; if (!(s >= 0 && s < seats.length) || mine.includes(s)) continue; const m = x.m && typeof x.m === 'object' ? x.m : {};
        if (pickOn && pend) { const id = okId(m[P().key]), known = roster(0).some(q => q.id === id); let ok = !!x.ok && known;
          if (ok && P().unique && seats.some((q, i) => i !== s && pk[i] && pk[i].ok && pk[i].id === id)) ok = false; // ya lo tiene otro: el primero que confirmó se lo queda
          want[s] = m; pk[s] = { id: known ? id : '', ok }; hostPst(true); }
        else if (!want[s]) want[s] = m; }
      if (gcfg) send({ t: 'cfg', cfg: gcfg }, true, '*');
    }
  });
  function again(f) { if (role !== 'host' || !gcfg || !gateO) return; const c = f ? f(gcfg) : gcfg; gcfg = Object.assign({}, c, { id: gcfg.id + 1 }); sticky.delete('res'); send({ t: 'cfg', cfg: gcfg }, true, '*'); try { gateO.apply(gcfg); } catch (e) { post('error', { msg: 'apply: ' + (e && e.message) }); } }
  // textos e identificadores que llegan de otro aparato: solo lo simple
  const okId = v => (typeof v === 'string' && v.length < 40 && /^[\w.-]*$/.test(v) ? v : '');
  // partes «lentas» de la instantánea: solo viajan si cambiaron (y al menos una vez por segundo, por si se perdió una)
  const slowLast = {};
  function slow(k, v, ms = 1000) { if (v === undefined) return undefined; const j = JSON.stringify(v), now = performance.now(), L = slowLast[k]; if (L && L.j === j && now - L.t < ms) return undefined; slowLast[k] = { j, t: now }; return v; }
  return {
    gate(o) { gateO = o; }, again, get cfg() { return gcfg; }, okId, slow,
    // (pruebas) cómo va la elección de personaje
    get pickState() { return { on: pickOn, sel: sel.slice(), ok: okL.slice(), pk: JSON.parse(JSON.stringify(pk)), left: pLeft, pend, atLaunch: pAtLaunch }; },
    notice(title, note) { if (on) Wait.msg(title, note); }, noticeOff() { Wait.hide(); },
    get on() { return on; }, get role() { return role; }, get isHost() { return on && role === 'host'; }, get isClient() { return on && role === 'client'; },
    get seats() { return seats; }, get mine() { return mine; }, get sid() { return sid; }, get ev() { return ev; },
    // ¿este puesto se juega en este aparato? y con qué jugador local (0 o 1)
    local(seat) { const k = mine.indexOf(seat); return k; },
    // anfitrión: la entrada del puesto remoto (o neutra si dejó de llegar)
    input(seat) { const r = remote[seat]; const g = G(); if (!r || performance.now() - r.at > 500) return g && g.neutral ? g.neutral() : null; return inputOf(seat); },
    // el juego avisa eventos (golpes, sonidos, efectos) para los remotos
    event(e) { if (on && role === 'host') { evQ.push(clean(e)); if (evQ.length > 200) evQ.splice(0, evQ.length - 200); } },
    // remoto: las dos instantáneas alrededor del momento a dibujar y cuánto avanzar entre ellas (0..1)
    sample() {
      if (!snaps.length) return null;
      // si el dibujo se salta instantáneas, lo «lento» que traían (solo viaja cuando cambia) pasa a la que sí se usa
      const sk = G() && G().slowKeys; if (sk && snaps.length > 1) { for (let i = 1; i < snaps.length; i++) { const p = snaps[i - 1], c = snaps[i]; if (p._used) continue; for (const k of sk) if (p.d[k] !== undefined && c.d[k] === undefined) c.d[k] = p.d[k]; } } if (snaps.length === 1 || offset == null) { const s = snaps[snaps.length - 1]; return { a: s.d, b: s.d, k: 1 }; }
      // reloj de dibujo: avanza con el tiempo real y se acerca a «ahora − colchón» cambiando un poco la velocidad (entre
      // 0,75× y 1,1×) en vez de saltar: los saltos (sobre todo hacia atrás, cuando el colchón crece) se ven como tirones.
      // Si no hay instantánea para ese momento, sigue un poquito más allá de la última con el mismo movimiento (hasta EX ms:
      // con datos malos, un bache corto ya no congela a los demás) y después se queda quieto hasta que llegue la siguiente.
      const nowF = performance.now(), target = nowF + offset - lagMs, last = snaps[snaps.length - 1].tm;
      if (pt == null || Math.abs(target - pt) > 600) pt = target;
      else { const dt = Math.min(100, Math.max(0, nowF - ptAt)), err = target - pt; pt += dt + Math.max(-0.25 * dt, Math.min(0.1 * dt, err * 0.1)); }
      ptAt = nowF;
      PS.fr++; if (PS.lastPT && pt < PS.lastPT - 1) PS.back++;
      const EX = snaps.length > 1 ? Math.min(140, Math.max(50, gap * 2.5)) : 0;
      if (pt > last + EX) { PS.hungry++; if (!PS.hRun) { PS.hRun = nowF; PS.hEp++; } PS.hMax = Math.max(PS.hMax, nowF - PS.hRun); pt = last + EX; } else PS.hRun = 0;
      PS.lastPT = pt; const t = pt;
      if (t > last && snaps.length > 1) { // adelantar: las dos últimas, k > 1 (cada juego lo usa como interpolación; tope 2)
        PS.ext++; const a = snaps[snaps.length - 2], b = snaps[snaps.length - 1], span = b.tm - a.tm;
        const k = span > 8 ? Math.min(2, 1 + (t - b.tm) / span) : 1; return { a: a.d, b: b.d, k, dt: span / 1000, ex: true };
      }
      for (let i = snaps.length - 1; i > 0; i--) { const a = snaps[i - 1], b = snaps[i]; if (a.tm <= t) { const k = b.tm > a.tm ? Math.min(1, Math.max(0, (t - a.tm) / (b.tm - a.tm))) : 1; return { a: a.d, b: b.d, k, dt: (b.tm - a.tm) / 1000 }; } }
      return { a: snaps[0].d, b: snaps[0].d, k: 1 };
    },
    set lag(ms) { lagMs = ms; lagFixed = true; }, get lag() { return lagMs; },
    get stats() { return Object.assign({ lag: Math.round(lagMs), jit: Math.round(jit), sz: PS.szN ? Math.round(PS.szSum / PS.szN) : 0 }, PS); }, statsReset: psReset,
    // predicción del personaje propio (remoto): la instantánea más nueva (con su hora de llegada) y el ping al anfitrión
    latest() { return snaps.length ? snaps[snaps.length - 1] : null; }, get rtt() { return rtt; },
    // ¿predecir? (con ?nopred se apaga, para comparar)
    get pred() { return on && role === 'client' && !noPred; },
    send, onStart(f) { startSubs.push(f); }, onMsg(f) { msgSubs.push(f); },
    // fin de la partida en línea (lo dice el anfitrión): resultado para todos
    finish(res) { if (on && role === 'host') send({ t: 'fin', res }, true, '*'); },
  };
})();
