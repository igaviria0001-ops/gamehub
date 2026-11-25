/* =========================================================================
   RED DE GAMEHUB — salas en línea sin servidor propio.
   · Servidor propio (Cloudflare, carpeta servidor/): señal y relevo rápidos
     por WebSocket y credenciales TURN de Cloudflare (puntos en Colombia). Si
     no está o no responde, todo sigue como antes (MQTT y Open Relay).
   · Señalización: brokers MQTT públicos por WebSocket (varios a la vez) con
     los mensajes cifrados (AES-GCM, clave sacada del código de la sala).
   · Conexión: WebRTC entre aparatos (estrella: el anfitrión con cada uno).
     Dos canales: «r» confiable y ordenado (eventos, sala) y «u» sin orden ni
     reenvíos (entradas e instantáneas: nunca espera paquetes perdidos).
   · NAT / datos móviles: STUN públicos + TURN de respaldo (Open Relay, con
     credenciales temporales calculadas aquí) o los de Ajustes.
   · Si WebRTC no conecta en 12 s: relevo por el mismo MQTT (más lento, pero
     nadie se queda por fuera).
   · Pruebas: transporte «bc» (BroadcastChannel) en vez de MQTT (?net=bc).
   · Si el anfitrión se va, sigue el siguiente aparato de la sala con el mismo
     código (los demás se reconectan solos; el torneo sigue).
   API: Net.host(info) → código · Net.join(código, info) · Net.leave()
        Net.send(a, datos, confiable) (a = id | '*') · Net.on(tipo, fn)
        Net.id · Net.isHost · Net.code · Net.peers (Map) · Net.now() (reloj del anfitrión)
   ========================================================================= */
const Net = (() => {
  const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const BROKERS = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt', 'wss://test.mosquitto.org:8081'];
  // servidor propio (Cloudflare Workers). ?server=… (pruebas) o gamehub_server (Ajustes) lo cambian; '' = sin servidor
  const SERVER0 = 'https://gamehub-red.igaviria0001.workers.dev'; // el de Ignacio (Cloudflare, plan gratis; ver servidor/)
  const SERVER = (() => { try { const q = new URLSearchParams(location.search).get('server'); const v = q != null ? q : localStorage.getItem('gamehub_server'); const u = v != null ? v : SERVER0; return /^https?:\/\/[\w.\-:]+$/.test(u || '') ? u.replace(/\/$/, '') : ''; } catch (e) { return SERVER0; } })();
  const STUN = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun.cloudflare.com:3478' }, { urls: 'stun:stun1.l.google.com:19302' }];
  const enc = new TextEncoder(), dec = new TextDecoder();
  const rid = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => ALPHA[b % ALPHA.length]).join('');
  const b64 = u8 => btoa(String.fromCharCode(...u8)), unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const L = { peers: [], msg: [], status: [], room: [] };
  const emit = (t, ...a) => { for (const f of L[t] || []) { try { f(...a); } catch (e) { console.error(e); } } };

  /* ---------- estado ---------- */
  // pruebas (red simulada, la manda cada aparato): ?netloss=0.1 (pérdida) · ?netlag=80 (ms de ida) · ?netjit=25 (vaivén, ms)
  // · ?netspike=0.05 (por segundo: rachas de congestión de 0,4–1 s con +150–500 ms, como en datos móviles)
  // · ?netcut=25:6 (a los 25 s de entrar a la sala, 6 s sin red: la conexión se da por «desconectada»)
  // · ?netmob=1 (perfil de datos móviles: 60 ms, vaivén 25, 3 % de pérdida, rachas 0,05/s; el relevo suma 220 ms)
  // · ?netforce=relay (sin WebRTC). Lo confiable nunca se desordena: si «se pierde», llega tarde y frena lo que viene detrás.
  const SIM = (() => { try { const q = new URLSearchParams(location.search), mob = q.get('netmob') === '1', n = (k, d, mx) => Math.min(mx, q.has(k) ? +q.get(k) || 0 : d), cut = (q.get('netcut') || '').split(':').map(Number);
    const o = { loss: n('netloss', mob ? 0.03 : 0, 0.9), lag: n('netlag', mob ? 60 : 0, 2000), jit: n('netjit', mob ? 25 : 0, 1000), spike: n('netspike', mob ? 0.05 : 0, 5), rlag: mob || q.has('netlag') ? n('netrlag', 220, 3000) : 0, dlag: n('netdlag', 0, 3000), cut: cut.length === 2 && cut[1] > 0 ? cut : null, relay: q.get('netforce') === 'relay' };
    o.on = !!(o.loss || o.lag || o.jit || o.spike || o.cut || o.dlag); return o; } catch (e) { return { on: false, loss: 0, lag: 0, jit: 0, spike: 0, rlag: 0, dlag: 0, cut: null, relay: false }; } })();
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  let simDrop = null; // pruebas: { f(m) → true = se pierde, until }
  let cutA = 0, cutB = 0, cutDirect = false; // corte simulado: [desde, hasta) en performance.now(); cutDirect = solo se cae lo directo
  const simCut = (now, p) => (now >= cutA && now < cutB && !(cutDirect && p && p.via === 'relay') ? cutB : 0);
  function simDelay(p, now) {
    let d = SIM.lag + Math.abs(gauss()) * SIM.jit;
    if (SIM.spike) { const dt = Math.min(1000, now - (p.simChk || now)); p.simChk = now; if (now > (p.congUntil || 0) && Math.random() < SIM.spike * dt / 1000) { p.congUntil = now + 400 + Math.random() * 600; p.congAdd = 150 + Math.random() * 350; } if (now < (p.congUntil || 0)) d += p.congAdd; }
    if (p.via === 'relay') { const rl = S.sig && S.sig.srv ? SIM.rlag * 0.2 : SIM.rlag; d += rl + Math.abs(gauss()) * rl * 0.3; } // (por el servidor propio el relevo suma mucho menos)
    else d += SIM.dlag; // ?netdlag: lo directo más lento (para probar que se elige el camino más rápido)
    return d;
  }
  // demora simulada por un camino dado, con las mismas rachas de congestión del aparato (en la vida real la red del celular
  // es una sola: una racha frena lo directo y el servidor por igual)
  function simPath(p, via, now) { const v = p.via; p.via = via; try { return simDelay(p, now); } finally { p.via = v; } }
  // estado de la conexión directa (en las pruebas, durante ?netcut se ve «desconectada»)
  const pcState = p => (simCut(performance.now()) ? 'disconnected' : p.pc ? p.pc.connectionState : 'none');
  const ST = { out: 0, in: 0, nOut: 0, nIn: 0, t0: Date.now() };
  const S = { id: rid(8), code: null, isHost: false, hostId: null, info: null, key: null, topic: null, sig: null, alive: false, seen: new Map(), clockOff: 0, term: 0, dead: new Set(), succ: null };
  const peers = new Map(); // id → { id, info, pc, r, u, via: 'p2p'|'relay'|'…', rtt, t0, open, lastSeen, pend: [] }

  /* ---------- cifrado ---------- */
  async function deriveKey(code) {
    const h = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode('gamehub-sala:' + code)));
    S.topic = 'gamehub/v1/' + Array.from(h.slice(0, 10), b => b.toString(16).padStart(2, '0')).join('');
    const k2 = await crypto.subtle.digest('SHA-256', enc.encode('gamehub-clave:' + code + ':' + b64(h)));
    S.key = await crypto.subtle.importKey('raw', k2, 'AES-GCM', false, ['encrypt', 'decrypt']);
  }
  async function seal(obj) { const iv = crypto.getRandomValues(new Uint8Array(12)), ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, S.key, enc.encode(JSON.stringify(obj)))); const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12); return out; }
  async function open(u8) { try { const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u8.slice(0, 12) }, S.key, u8.slice(12)); return JSON.parse(dec.decode(pt)); } catch (e) { return null; } }

  /* ---------- MQTT mínimo (3.1.1, QoS 0) sobre WebSocket ---------- */
  function mqttStr(s) { const b = enc.encode(s); const o = new Uint8Array(2 + b.length); o[0] = b.length >> 8; o[1] = b.length & 255; o.set(b, 2); return o; }
  function mqttPacket(type, body) { const len = []; let n = body.length; do { let d = n % 128; n = Math.floor(n / 128); if (n > 0) d |= 128; len.push(d); } while (n > 0); const o = new Uint8Array(1 + len.length + body.length); o[0] = type; o.set(len, 1); o.set(body, 1 + len.length); return o; }
  const cat = (...a) => { const o = new Uint8Array(a.reduce((s, x) => s + x.length, 0)); let p = 0; for (const x of a) { o.set(x, p); p += x.length; } return o; };
  function Broker(url, onMsg) {
    let ws = null, buf = new Uint8Array(0), ping = 0, dead = false, tries = 0, ready = false;
    const queue = [];
    function connect() {
      if (dead) return; ready = false;
      try { ws = new WebSocket(url, ['mqtt']); } catch (e) { return retry(); }
      ws.binaryType = 'arraybuffer';
      ws.onopen = () => { tries = 0; const cid = 'gh' + S.id + rid(4); ws.send(mqttPacket(0x10, cat(mqttStr('MQTT'), new Uint8Array([4, 2, 0, 30]), mqttStr(cid)))); };
      ws.onmessage = e => { buf = cat(buf, new Uint8Array(e.data)); parse(); };
      ws.onclose = ws.onerror = () => { clearInterval(ping); ready = false; if (ws) { ws.onclose = ws.onerror = ws.onmessage = null; ws = null; } retry(); };
    }
    function retry() { if (dead) return; tries++; setTimeout(connect, Math.min(15000, 800 * tries)); }
    function parse() {
      for (;;) {
        if (buf.length < 2) return; let mul = 1, len = 0, i = 1, d;
        do { if (i >= buf.length) return; d = buf[i++]; len += (d & 127) * mul; mul *= 128; } while (d & 128);
        if (buf.length < i + len) return;
        const h0 = buf[0], type = h0 >> 4, body = buf.slice(i, i + len); buf = buf.slice(i + len);
        if (type === 2) { ready = true; ws.send(mqttPacket(0x82, cat(new Uint8Array([0, 1]), mqttStr(S.topic), new Uint8Array([0])))); ping = setInterval(() => { try { ws && ws.send(new Uint8Array([0xc0, 0])); } catch (e) { /* nada */ } }, 20000); while (queue.length) send(queue.shift()); emit('status', { broker: url, ok: true }); }
        else if (type === 3) { const tl = (body[0] << 8) | body[1], qos = (h0 >> 1) & 3; onMsg(body.slice(2 + tl + (qos ? 2 : 0))); }
      }
    }
    function send(u8) { if (!ws || !ready) { if (queue.length < 40) queue.push(u8); return; } try { ws.send(mqttPacket(0x30, cat(mqttStr(S.topic), u8))); } catch (e) { /* nada */ } }
    connect();
    return { send, close() { dead = true; clearInterval(ping); try { ws && ws.close(); } catch (e) { /* nada */ } }, get ready() { return ready; } };
  }
  // señalización: varios brokers a la vez (o BroadcastChannel en pruebas); los repetidos se descartan
  // servidor propio: un WebSocket a la sala (el servidor reparte; solo ve a quién va cada mensaje, lo demás va cifrado)
  function Srv(onMsg) {
    let ws = null, dead = false, tries = 0, ready = false, beat = 0, lastIn = 0, pT = 0, rtt = 0; // rtt: ida y vuelta a la sala del servidor (ms)
    const room = S.topic.split('/').pop(), queue = [], te = new TextEncoder();
    function connect() {
      if (dead || !SERVER) return; ready = false;
      try { ws = new WebSocket(SERVER.replace(/^http/, 'ws') + '/s/' + room + '?id=' + S.id); } catch (e) { return retry(); }
      ws.binaryType = 'arraybuffer';
      ws.onopen = () => { tries = 0; ready = true; lastIn = Date.now(); while (queue.length) raw(queue.shift()); emit('status', { server: true, ok: true });
        const pingSrv = () => { pT = performance.now(); try { ws.send('p'); } catch (e) { /* nada */ } }; pingSrv();
        clearInterval(beat); beat = setInterval(() => { if (!ws) return; if (Date.now() - lastIn > 12000) { try { ws.close(); } catch (e) { /* nada */ } return; } if (!pT) pingSrv(); }, 3000); };
      ws.onmessage = e => { lastIn = Date.now(); if (typeof e.data !== 'string') onMsg(new Uint8Array(e.data)); else if (e.data === 'q' && pT) { const r = performance.now() - pT; pT = 0; rtt = rtt ? rtt * 0.7 + r * 0.3 : r; } };
      ws.onclose = ws.onerror = () => { clearInterval(beat); const was = ready; ready = false; if (ws) { ws.onclose = ws.onerror = ws.onmessage = null; ws = null; } if (was) emit('status', { server: true, ok: false }); retry(); };
    }
    function retry() { if (dead) return; tries++; setTimeout(connect, Math.min(10000, 500 * tries)); }
    function raw(b) { try { ws.send(b); } catch (e) { /* nada */ } }
    function send(u8, to) { const h = te.encode(to && /^[A-Za-z0-9]{8}$/.test(to) ? to : '********'), b = new Uint8Array(8 + u8.length); b.set(h); b.set(u8, 8); if (!ws || !ready) { if (queue.length < 40) queue.push(b); return; } raw(b); }
    connect();
    // fresco = abierto y contestando (un WebSocket puede quedar «medio muerto» al cambiar de red sin avisar que se cerró)
    const fresh = () => ready && !(pT && performance.now() - pT > 2500) && Date.now() - lastIn < 8000;
    return { send, close() { dead = true; clearInterval(beat); try { ws && ws.close(); } catch (e) { /* nada */ } }, get ready() { return fresh(); }, get open() { return ready; }, get rtt() { return ready ? rtt : 0; } };
  }
  function Signal() {
    const useBC = new URLSearchParams(location.search).get('net') === 'bc' || Net.transport === 'bc';
    const onRaw = async u8 => { const m = await open(u8); if (!m || m.from === S.id || (m.to && m.to !== S.id)) return; if (S.seen.has(m.mid)) return; S.seen.set(m.mid, Date.now()); if (S.seen.size > 600) { const old = Date.now() - 60000; for (const [k, t] of S.seen) if (t < old) S.seen.delete(k); } onSignal(m); };
    const srv = SERVER && (!useBC || /[?&]server=/.test(location.search)) ? Srv(onRaw) : null;
    if (srv && new URLSearchParams(location.search).get('net') === 'srv') return { send: (u8, to) => srv.send(u8, to), close: () => srv.close(), get ready() { return srv.ready; }, get srv() { return srv.ready; }, get srvRtt() { return srv.rtt; } }; // pruebas: solo el servidor
    if (useBC) { const bc = new BroadcastChannel(S.topic); bc.onmessage = e => onRaw(new Uint8Array(e.data)); return { send: (u8, to, fast) => { if (srv && srv.open) srv.send(u8, to); if (fast && srv && srv.ready) return; bc.postMessage(u8.buffer); }, close: () => { bc.close(); srv && srv.close(); }, get ready() { return true; }, get srv() { return !!(srv && srv.ready); }, get srvRtt() { return srv ? srv.rtt : 0; } }; }
    const bs = BROKERS.map(u => Broker(u, onRaw));
    // lo de la partida (relevo) va solo por el servidor si está; la señal (encontrarse) por todos los caminos a la vez
    return { send: (u8, to, fast) => { if (srv && srv.open) srv.send(u8, to); if (fast && srv && srv.ready) return; bs.forEach(b => b.send(u8)); }, close: () => { bs.forEach(b => b.close()); srv && srv.close(); }, get ready() { return bs.some(b => b.ready) || !!(srv && srv.ready); }, get srv() { return !!(srv && srv.ready); }, get srvRtt() { return srv ? srv.rtt : 0; } };
  }
  async function signal(obj, fast) { if (!S.sig) return; obj.from = S.id; obj.mid = rid(10); S.sig.send(await seal(obj), obj.to, fast); }

  /* ---------- servidores de ICE ---------- */
  // TURN propio (Ajustes): [{ urls, username, credential }] — solo direcciones turn:/turns:/stun: y textos cortos
  function cleanIce(a) {
    if (!Array.isArray(a)) return null; const ok = u => typeof u === 'string' && u.length < 200 && /^(turns?|stun):[\w.\-:\[\]?=&\/]+$/i.test(u), str = v => typeof v === 'string' && v.length < 300;
    const out = a.slice(0, 4).map(x => x && typeof x === 'object' ? { urls: (Array.isArray(x.urls) ? x.urls : [x.urls]).filter(ok).slice(0, 6), username: str(x.username) ? x.username : undefined, credential: str(x.credential) ? x.credential : undefined } : null).filter(x => x && x.urls.length);
    return out.length ? out : null;
  }
  const ownTurn = () => { try { return cleanIce(JSON.parse(localStorage.getItem('gamehub_turn') || 'null')); } catch (e) { return null; } };
  async function openRelay() { // Open Relay «static auth»: usuario = vencimiento:nombre, clave = HMAC-SHA1(secreto público)
    try {
      const user = Math.floor(Date.now() / 1000 + 86400) + ':gamehub', k = await crypto.subtle.importKey('raw', enc.encode('openrelayprojectsecret'), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
      const cred = b64(new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(user)))), h = 'staticauth.openrelay.metered.ca';
      return [{ urls: [`turn:${h}:80`, `turn:${h}:80?transport=tcp`, `turn:${h}:443`, `turns:${h}:443?transport=tcp`], username: user, credential: cred }];
    } catch (e) { return []; }
  }
  // el propio (si hay) + el que comparte el anfitrión + el gratuito de respaldo
  // TURN de Cloudflare: el servidor da credenciales de un día; se guardan 6 h para no pedirlas en cada conexión
  let cfIceP = null;
  function cfIce() {
    if (!SERVER || (/[?&]net=bc/.test(location.search) && !/[?&]server=/.test(location.search))) return Promise.resolve([]); // (pruebas en un solo aparato sin servidor)
    try { const c = JSON.parse(localStorage.getItem('gamehub_ice') || 'null'); if (c && c.s === SERVER && Date.now() < c.exp && Array.isArray(c.ice)) return Promise.resolve(c.ice); } catch (e) { /* nada */ }
    if (cfIceP) return cfIceP;
    cfIceP = (async () => {
      try {
        const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, to = setTimeout(() => ctl && ctl.abort(), 4000);
        const r = await fetch(SERVER + '/ice', { cache: 'no-store', signal: ctl ? ctl.signal : undefined }); clearTimeout(to);
        const j = await r.json(), ice = (Array.isArray(j.iceServers) ? j.iceServers : []).map(x => ({ urls: (Array.isArray(x.urls) ? x.urls : [x.urls]).filter(u => typeof u === 'string' && /^(turns?|stun):/.test(u)).slice(0, 8), username: x.username, credential: x.credential })).filter(x => x.urls.length);
        if (r.ok || ice.length) try { localStorage.setItem('gamehub_ice', JSON.stringify({ s: SERVER, exp: Date.now() + 6 * 3600e3, ice })); } catch (e) { /* nada */ }
        return ice;
      } catch (e) { return []; } finally { setTimeout(() => { cfIceP = null; }, 30000); }
    })();
    return cfIceP;
  }
  // primero el TURN de Cloudflare (cerca, rápido), luego el propio de Ajustes, el que comparte el anfitrión y el gratuito
  async function iceServers(extra) { const [cf, orl] = await Promise.all([cfIce(), openRelay()]); return STUN.concat(cf, ownTurn() || [], cleanIce(extra) || [], orl); }

  /* ---------- pares (WebRTC) ---------- */
  function newPeer(id, info) {
    let p = peers.get(id); if (p) { if (info) p.info = info; return p; }
    p = { id, info: info || null, pc: null, r: null, u: null, via: 'conectando', rtt: 0, open: false, lastSeen: Date.now(), pend: [], relayT: 0, srvRtt: 0, drtt: 0, rrtt: 0, slowN: 0, fastN: 0, preferRelay: false };
    peers.set(id, p); return p;
  }
  async function makePC(p, initiator, extraIce) {
    if (SIM.relay) { toRelay(p); return null; }
    if (p.pc) { try { p.pc.close(); } catch (e) { /* nada */ } }
    const pc = new RTCPeerConnection({ iceServers: await iceServers(extraIce), bundlePolicy: 'max-bundle' });
    p.pc = pc; if (p.via !== 'relay') { p.open = false; p.via = 'conectando'; } // si va por el relevo, sigue por ahí hasta que abra la nueva
    pc.onicecandidate = e => { if (e.candidate) signal({ t: 'ice', to: p.id, c: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate }); };
    // se cayó: al relevo (2,5 s de gracia: en datos móviles hay baches cortos); volvió: de nuevo directo
    pc.onconnectionstatechange = () => { if (p.pc !== pc) return; const st = pc.connectionState; if (st === 'failed') toRelay(p); if (st === 'disconnected') setTimeout(() => { if (p.pc === pc && pc.connectionState === 'disconnected') toRelay(p); }, graceMs()); if (st === 'connected') backToDirect(p); emit('peers'); };
    const wire = (ch, kind) => { ch.binaryType = 'arraybuffer'; p[kind] = ch; ch.onopen = () => { if (p.pc === pc && p.r && p.r.readyState === 'open') { const was = p.via; p.open = true; if (!p.preferRelay && was !== 'p2p' && was !== 'turn') newPath(p, 0); p.via = p.preferRelay ? 'relay' : route(pc); p.routeChecked = false; p.relayN = 0; flush(p); emit('peers'); if (was === 'relay') emit('status', { direct: p.id }); } }; ch.onmessage = e => onData(p, e.data, kind === 'r'); ch.onclose = () => { if (p[kind] === ch) p[kind] = null; }; };
    // canales negociados: los dos lados los crean igual (sin esperar a «ondatachannel»)
    wire(pc.createDataChannel('r', { negotiated: true, id: 1, ordered: true }), 'r');
    wire(pc.createDataChannel('u', { negotiated: true, id: 2, ordered: false, maxRetransmits: 0 }), 'u');
    if (initiator) { const o = await pc.createOffer(); await pc.setLocalDescription(o); signal({ t: 'offer', to: p.id, sdp: pc.localDescription.sdp, term: S.term, ice: ownTurn() || undefined }); } // el TURN propio del anfitrión viaja cifrado a la sala
    clearTimeout(p.relayT); p.relayT = setTimeout(() => { if (!p.open) toRelay(p); }, 12000);
    return pc;
  }
  function route(pc) { return 'p2p'; }
  async function refineRoute(p) { // ¿directo o por TURN? (para mostrarlo en la sala)
    try { const st = await p.pc.getStats(); let pair = null; st.forEach(s => { if (s.type === 'transport' && s.selectedCandidatePairId) pair = st.get(s.selectedCandidatePairId); }); if (!pair) st.forEach(s => { if (s.type === 'candidate-pair' && s.nominated && s.state === 'succeeded') pair = s; }); if (pair && p.via !== 'relay') { const lc = st.get(pair.localCandidateId), rc = st.get(pair.remoteCandidateId); p.via = (lc && lc.candidateType === 'relay') || (rc && rc.candidateType === 'relay') ? 'turn' : 'p2p'; } } catch (e) { /* nada */ }
  }
  // relevo = solo mientras la conexión directa no sirve: el anfitrión vuelve a intentarla (6 s, 15 s, 30 s, 45 s…) y, si la
  // misma conexión revive (bache de la red), se vuelve a ella sola. Antes, un bache de unos segundos dejaba la partida
  // por el relevo lento hasta el final.
  // con el servidor propio el relevo es bueno: se pasa a él más rápido (1 s de gracia) y la conexión nueva se intenta antes
  const srvOn = () => !!(S.sig && S.sig.srv);
  const graceMs = () => (srvOn() ? 1000 : 2500);
  // al cambiar de camino, el ping se vuelve a medir en el camino nuevo (el promedio del otro confundía la elección)
  const newPath = (p, rtt) => { p.pathT = Date.now(); p.rtt = rtt || 0; p.slowN = p.fastN = 0; };
  function toRelay(p) { if (p.via === 'relay') return; newPath(p, p.rrtt); p.via = 'relay'; p.open = true; p.relayAt = Date.now(); p.retryAt = Date.now() + (p.relayN ? Math.min(45000, 15000 * p.relayN) : srvOn() ? 3000 : 6000); flush(p); emit('peers'); }
  const directOk = p => !!(p.pc && pcState(p) === 'connected' && p.r && p.r.readyState === 'open' && p.u && p.u.readyState === 'open');
  function backToDirect(p) { if (p.via !== 'relay' || !directOk(p) || p.preferRelay) return; newPath(p, p.drtt); p.via = 'p2p'; p.routeChecked = false; p.relayN = 0; flush(p); emit('peers'); emit('status', { direct: p.id }); }
  function flush(p) { const q = p.pend; p.pend = []; for (const [d, rel] of q) rawSend(p, d, rel); }
  // por el canal directo sí o sí (para medir lo directo mientras se va por el relevo del servidor)
  function directSend(p, o) {
    const ch = p.u && p.u.readyState === 'open' ? p.u : null; if (!ch) return; const s = JSON.stringify(o);
    if (!SIM.on) { try { ch.send(s); } catch (e) { /* nada */ } return; }
    const now = performance.now(); if (simCut(now, { via: 'p2p' }) || Math.random() < SIM.loss) return; setTimeout(() => { try { ch.send(s); } catch (e) { /* nada */ } }, simPath(p, 'p2p', now));
  }
  // el camino más rápido: si lo directo (o el TURN que encontró ICE, que puede ser uno público lejano) tarda bastante más que
  // ir por el servidor propio —medido de verdad: un ping por cada camino cada 2 s—, se va por el servidor y se sigue
  // midiendo lo directo para volver cuando mejore. Se exige que gane mucho (3 medidas seguidas; ver «need»):
  // el relevo junta las instantáneas (~30 por segundo) y un poco menos de retraso no compensa verse menos fluido.
  function relaySend(p, o) { // por el relevo del servidor sí o sí (con la red simulada de las pruebas)
    const s = JSON.stringify(o); if (!SIM.on) { signal({ t: 'relay', to: p.id, d: s }, true); return; }
    const now = performance.now(); if (simCut(now, { via: 'relay' }) || Math.random() < SIM.loss) return; setTimeout(() => signal({ t: 'relay', to: p.id, d: s }, true), simPath(p, 'relay', now));
  }
  function relayPing(p) { relaySend(p, { $: 'ping', t: performance.now(), r: 1 }); }
  function choosePath(p) {
    if (Date.now() - (p.pathT || 0) < 5000) return; // recién cambió de camino: primero medir el nuevo
    if (!p.preferRelay) {
      // solo cuando ICE terminó en un TURN (puede ser uno público lejano): ganar 60 ms o un 20 %. Lo directo de verdad entre
      // dos aparatos no se cambia (casi nunca pierde y, medido en el juego, el ruido del ping hacía cambiar de más)
      const gain = p.rtt - p.rrtt, need = Math.max(60, p.rtt * 0.2);
      if (srvOn() && p.open && p.via === 'turn' && p.rtt > 0 && p.rrtt > 0 && gain > need) { if (++p.slowN >= 3) { p.preferRelay = true; p.slowN = 0; p.fastN = 0; p.drtt = p.rtt; toRelay(p); emit('status', { viaServer: p.id }); } }
      else p.slowN = 0;
      return;
    }
    if (!srvOn()) { p.preferRelay = false; backToDirect(p); return; } // sin servidor: de vuelta a lo directo si está vivo
    if (!directOk(p)) { p.fastN = 0; return; }
    if (p.drtt > 0 && p.rtt > 0 && p.drtt < p.rtt - 30) { if (++p.fastN >= 3) { p.preferRelay = false; p.fastN = 0; p.rrtt = p.rtt; backToDirect(p); } } else p.fastN = 0;
  }
  function rawSend(p, data, rel) {
    const s = typeof data === 'string' ? data : JSON.stringify(data);
    if (!SIM.on) { sendNow(p, s, rel); return; }
    const now = performance.now(), cut = simCut(now, p);
    if (!rel) { if (cut || Math.random() < SIM.loss) return; setTimeout(() => sendNow(p, s, rel), simDelay(p, now)); return; }
    let t = now + simDelay(p, now); if (cut) t = Math.max(t, cut + simDelay(p, cut)); if (Math.random() < SIM.loss) t += 2 * SIM.lag + 200;
    t = Math.max(t, p.relT || 0); p.relT = t; setTimeout(() => sendNow(p, s, rel), t - now);
  }
  // relevo (sin WebRTC): lo confiable sale ya; lo urgente (instantáneas, entradas) a lo más ~12 por segundo y siempre lo
  // más nuevo de cada tipo (lo saltado no hace falta: lo trae el siguiente; las partes «lentas» pasan al que sí sale)
  const RELAY_MS = 66; // ~15 por segundo por los servidores públicos; por el servidor propio, ~30 (RELAY_FAST)
  const RELAY_FAST = 33;
  const relayKey = o => (o && o.$g ? 'g' + (o.d && o.d.t) + (o.d && o.d.s != null ? ':' + o.d.s : '') : 'n' + (o && o.$));
  function relayOut(p, s) {
    let o; try { o = JSON.parse(s); } catch (e) { return; }
    const q = p.rq || (p.rq = new Map()), k = relayKey(o), old = q.get(k);
    if (old && api.relayMerge) { try { api.relayMerge(old, o); } catch (e) { /* nada */ } }
    q.set(k, o);
    if (!p.rqT) p.rqT = setTimeout(() => relayFlush(p), Math.max(0, (S.sig && S.sig.srv ? RELAY_FAST : RELAY_MS) - (Date.now() - (p.rqAt || 0))));
  }
  function relayFlush(p) { p.rqT = 0; if (peers.get(p.id) !== p || !p.rq || !p.rq.size) return; p.rqAt = Date.now(); for (const o of p.rq.values()) signal({ t: 'relay', to: p.id, d: JSON.stringify(o) }, true); p.rq.clear(); }
  function sendNow(p, s, rel) {
    ST.out += s.length; ST.nOut++;
    if (p.via === 'relay') { if (rel) signal({ t: 'relay', to: p.id, d: s }, true); else relayOut(p, s); return; }
    const ch = (!rel && p.u && p.u.readyState === 'open') ? p.u : p.r;
    if (!ch || ch.readyState !== 'open') { if (rel && p.pend.length < 200) p.pend.push([s, rel]); return; }
    if (!rel && ch.bufferedAmount > 64000) return; // la red va atrasada: se salta este (llega otro enseguida)
    try { ch.send(s); } catch (e) { /* nada */ }
  }
  function onData(p, raw, rel) {
    p.lastSeen = Date.now(); ST.in += typeof raw === 'string' ? raw.length : raw.byteLength || 0; ST.nIn++;
    let m; try { m = JSON.parse(typeof raw === 'string' ? raw : dec.decode(raw)); } catch (e) { return; }
    if (simDrop && performance.now() < simDrop.until) { try { if (simDrop.f(m)) return; } catch (e) { /* nada */ } } // pruebas: «se perdió»
    if (m && m.$ === 'ping') { if (m.s != null) p.srvRtt = Math.max(0, +m.s || 0); if (m.d) { directSend(p, { $: 'pong', t: m.t, d: 1 }); return; } if (m.r) { if (srvOn()) relaySend(p, { $: 'pong', t: m.t, r: 1 }); return; } rawSend(p, { $: 'pong', t: m.t, h: S.isHost ? performance.now() : undefined }, p.via === 'relay'); return; }
    if (m && m.$ === 'pong' && m.d) { const rtt = performance.now() - m.t; p.drtt = p.drtt ? p.drtt * 0.7 + rtt * 0.3 : rtt; return; }
    if (m && m.$ === 'pong' && m.r) { const rtt = performance.now() - m.t; p.rrtt = p.rrtt ? p.rrtt * 0.7 + rtt * 0.3 : rtt; return; }
    if (m && m.$ === 'pong') { const now = performance.now(), rtt = now - m.t; p.rtt = p.rtt ? p.rtt * 0.8 + rtt * 0.2 : rtt; if (m.h != null && !S.isHost) { const off = m.h + rtt / 2 - now; S.clockOff = S.clockOff ? S.clockOff * 0.85 + off * 0.15 : off; } return; }
    if (m && m.$ === 'room' && !S.isHost) { if (p.id !== S.hostId) return; S.room = m.room; S.term = Math.max(S.term, m.room.term | 0); for (const d of m.room.devices || []) if (d.id !== S.hostId) S.dead.delete(d.id); emit('room', m.room); return; }
    if (m && m.$ === 'bye') { dropPeer(p.id); return; }
    if (m && m.$ === 'moved' && !S.isHost && p.id === S.hostId) { S.dead.add(p.id); clearTimeout(p.relayT); try { p.pc && p.pc.close(); } catch (e) { /* nada */ } peers.delete(p.id); S.hostId = null; S.term = Math.max(S.term, m.term | 0); S.moved = true; emit('status', { hostGone: true, old: p.id }); emit('peers'); signal({ t: 'hello', info: S.info, term: S.term }); return; }
    emit('msg', p.id, m, rel);
  }
  function dropPeer(id) { const p = peers.get(id); if (!p) return; clearTimeout(p.relayT); clearTimeout(p.rqT); try { p.pc && p.pc.close(); } catch (e) { /* nada */ } peers.delete(id); emit('peers'); if (S.isHost) broadcastRoom(); else if (id === S.hostId) succeed(); }

  /* ---------- si el anfitrión se va: sigue el siguiente de la sala (mismo código) ---------- */
  // orden: el de la última lista de la sala; si el que sigue tampoco aparece en 8 s, sigue el otro
  const nOpen = () => { const now = Date.now(); return [...peers.values()].filter(p => p.open && now - p.lastSeen < 10000).length; };
  function succeed() {
    if (S.isHost || !S.alive) return;
    const old = S.hostId; if (old) { S.dead.add(old); const hp = peers.get(old); if (hp) { clearTimeout(hp.relayT); try { hp.pc && hp.pc.close(); } catch (e) { /* nada */ } peers.delete(old); } }
    S.hostId = null; const R = S.room;
    const order = ((R && R.devices) || []).map(d => d.id).filter(id => !S.dead.has(id));
    S.succ = { order, t: Date.now(), term: Math.max(S.term, (R && R.term) || 0) + 1 };
    emit('status', { hostGone: true, old });
    nextHost();
  }
  function nextHost() {
    const c = S.succ; if (!c) return;
    while (c.order.length && c.order[0] !== S.id && S.dead.has(c.order[0])) c.order.shift();
    if (!c.order.length || c.order[0] === S.id) { becomeHost(c.term); return; }
    signal({ t: 'hello', info: S.info, term: S.term });
  }
  function becomeHost(term) {
    S.succ = null; S.isHost = true; S.hostId = S.id; S.play = null; S.term = Math.max(S.term + 1, term || 0);
    for (const p of [...peers.values()]) { clearTimeout(p.relayT); try { p.pc && p.pc.close(); } catch (e) { /* nada */ } } peers.clear();
    announce(); broadcastRoom(); emit('peers'); emit('status', { newHost: S.id, me: true });
  }
  // dos anfitriones con el mismo código (el viejo volvió, o uno se quedó sin red un rato): cede el que tiene menos
  // aparatos conectados; si empatan, el de turno más nuevo; si no, el de id menor
  function announce() { if (S.isHost && S.alive) signal({ t: 'host', term: S.term, n: nOpen() }); }
  function stepDown(to, term) {
    S.isHost = false; S.hostId = null; S.succ = null; S.dead.delete(to); S.term = Math.max(0, term | 0);
    // a los suyos les avisa que la sala sigue con otro anfitrión (no «adiós»: si no, empezarían otra sucesión)
    for (const p of [...peers.values()]) { if (p.open) { try { rawSend(p, { $: 'moved', term: S.term }, true); } catch (e) { /* nada */ } } clearTimeout(p.relayT); try { p.pc && p.pc.close(); } catch (e) { /* nada */ } } peers.clear();
    S.room = null; emit('peers'); emit('status', { steppedDown: true });
    signal({ t: 'hello', info: S.info, term: S.term });
  }

  /* ---------- señales ---------- */
  async function onSignal(m) {
    if (m.t === 'hello' && S.isHost) { // alguien quiere entrar: el anfitrión lo llama
      const p = newPeer(m.from, m.info); p.lastSeen = Date.now();
      if (!p.pc || p.pc.connectionState === 'failed' || p.pc.connectionState === 'closed' || (!p.open && Date.now() - (p.callT || 0) > 6000)) { p.callT = Date.now(); await makePC(p, true); }
      signal({ t: 'welcome', to: m.from, host: S.id, term: S.term }); broadcastRoom(); return;
    }
    if (m.t === 'host') { // otro anfitrión con este código
      if (S.isHost) { const mine = [nOpen(), S.term, S.id], his = [m.n | 0, m.term | 0, m.from]; const lose = his[0] > mine[0] || (his[0] === mine[0] && (his[1] > mine[1] || (his[1] === mine[1] && his[2] < mine[2]))); if (lose) stepDown(m.from, m.term); }
      else if (!S.hostId && !S.dead.has(m.from)) signal({ t: 'hello', info: S.info, term: S.term });
      return;
    }
    if ((m.t === 'welcome' || m.t === 'offer') && !S.isHost && (S.dead.has(m.from) || (m.term | 0) < S.term || (S.hostId && S.hostId !== m.from && (m.term | 0) <= S.term))) return; // de un anfitrión viejo
    if (m.t === 'welcome' && !S.isHost) { const was = S.hostId; S.hostId = m.host; S.term = Math.max(S.term, m.term | 0); const hp = newPeer(m.host); if (SIM.relay) toRelay(hp); if (S.succ || S.moved) { S.succ = null; S.moved = false; emit('status', { newHost: m.host }); } else if (was && was !== m.host) emit('status', { newHost: m.host }); return; }
    if (m.t === 'offer' && !S.isHost) { S.hostId = m.from; S.term = Math.max(S.term, m.term | 0); if (S.succ || S.moved) { S.succ = null; S.moved = false; emit('status', { newHost: m.from }); } const p = newPeer(m.from); const pc = await makePC(p, false, m.ice); await pc.setRemoteDescription({ type: 'offer', sdp: m.sdp }); const a = await pc.createAnswer(); await pc.setLocalDescription(a); signal({ t: 'answer', to: m.from, sdp: pc.localDescription.sdp }); for (const c of p.iceQ || []) try { await pc.addIceCandidate(c); } catch (e) { /* nada */ } p.iceQ = []; return; }
    if (m.t === 'answer' && S.isHost) { const p = peers.get(m.from); if (p && p.pc) { await p.pc.setRemoteDescription({ type: 'answer', sdp: m.sdp }); for (const c of p.iceQ || []) try { await p.pc.addIceCandidate(c); } catch (e) { /* nada */ } p.iceQ = []; } return; }
    if (m.t === 'ice') { const p = peers.get(m.from); if (!p) return; if (p.pc && p.pc.remoteDescription) { try { await p.pc.addIceCandidate(m.c); } catch (e) { /* nada */ } } else (p.iceQ = p.iceQ || []).push(m.c); return; }
    if (m.t === 'relay') { const p = peers.get(m.from); if (p) { if (p.via !== 'relay' && !directOk(p)) toRelay(p); onData(p, m.d, true); } return; }
    if (m.t === 'bye') { dropPeer(m.from); return; }
  }

  /* ---------- la sala ---------- */
  function roomState() { return { code: S.code, host: S.id, term: S.term, play: S.play || null, devices: [{ id: S.id, info: S.info, host: true, rtt: 0, via: 'local' }].concat([...peers.values()].filter(p => p.info).map(p => ({ id: p.id, info: p.info, rtt: Math.round(p.rtt), via: p.via === 'relay' && srvOn() ? 'srv' : p.via, open: p.open }))) }; }
  function broadcastRoom() { if (!S.isHost) return; const room = roomState(); S.room = room; emit('room', room); for (const p of peers.values()) if (p.open) rawSend(p, { $: 'room', room }, true); }
  let tick = 0, linkT = 0, annN = 0, lastTick = 0;
  function loop() {
    clearInterval(tick); clearInterval(linkT);
    tick = setInterval(() => {
      if (!S.alive) return; const now = Date.now();
      // si ESTE aparato estuvo trabado (cargando un juego pesado, en segundo plano), lo que le llegó aún está en la fila:
      // no se juzga a nadie por ese silencio (se les da el beneficio de haber hablado justo ahora)
      if (lastTick && now - lastTick > 4500) for (const p of peers.values()) p.lastSeen = Math.max(p.lastSeen, now - 1000);
      lastTick = now;
      const myS = S.sig && S.sig.srvRtt ? Math.round(S.sig.srvRtt) : 0;
      for (const p of peers.values()) { if (p.open) rawSend(p, { $: 'ping', t: performance.now(), s: myS }, p.via === 'relay'); if (p.preferRelay) directSend(p, { $: 'ping', t: performance.now(), d: 1, s: myS }); else if (p.open && p.via !== 'relay' && srvOn()) relayPing(p); if ((p.via === 'p2p' || p.via === 'turn') && p.pc && !p.routeChecked) { p.routeChecked = true; refineRoute(p); } choosePath(p); }
      // silencio largo = se fue (con margen: mientras un aparato carga un juego pesado puede callar varios segundos)
      const gone = p => now - p.lastSeen > (p.pc && p.pc.connectionState === 'connected' ? 60000 : p.via === 'relay' ? 30000 : 20000);
      if (S.isHost) { for (const p of [...peers.values()]) if (gone(p)) dropPeer(p.id); broadcastRoom(); if (++annN % 2 === 0) announce(); }
      else if (S.succ) { if (now - S.succ.t > 8000) { S.dead.add(S.succ.order.shift()); S.succ.t = now; } nextHost(); }
      else { const h = peers.get(S.hostId); if (!h || !h.open) signal({ t: 'hello', info: S.info, term: S.term }); else if (gone(h)) succeed(); } // callado mucho rato (con la conexión viva puede estar cargando un juego pesado: se espera más)
    }, 2000);
    // conexiones: cada medio segundo (también por sondeo: en las pruebas la «desconexión» es simulada y no da evento)
    linkT = setInterval(() => { if (S.alive) checkLinks(Date.now()); }, 500);
  }
  function checkLinks(now) {
    for (const p of [...peers.values()]) {
      if (p.via === 'relay') {
        p.discT = 0;
        if (directOk(p)) { if (!p.preferRelay) backToDirect(p); }
        else if (S.isHost && p.info && !SIM.relay && now >= (p.retryAt || 0)) { p.relayN = (p.relayN || 0) + 1; p.retryAt = now + Math.min(45000, 15000 * p.relayN); p.callT = now; makePC(p, true); } // conexión nueva por debajo
        continue;
      }
      if (!p.pc) { p.discT = 0; continue; }
      if (pcState(p) === 'disconnected') { if (!p.discT) p.discT = now; else if (now - p.discT >= graceMs()) toRelay(p); } else p.discT = 0;
    }
  }
  async function start(code, info, host) {
    leave(true); if (SIM.cut) { cutA = performance.now() + SIM.cut[0] * 1000; cutB = cutA + SIM.cut[1] * 1000; } S.code = code; S.info = info; S.isHost = host; S.hostId = host ? S.id : null; S.alive = true; S.clockOff = 0; S.term = host ? 1 : 0; S.dead.clear(); S.succ = null; S.moved = false;
    cfIce(); await deriveKey(code); S.sig = Signal(); loop();
    if (host) { broadcastRoom(); announce(); } else { signal({ t: 'hello', info }); setTimeout(() => S.alive && !S.hostId && signal({ t: 'hello', info }), 1200); }
    return code;
  }
  function leave(quiet) {
    if (S.alive) { for (const p of peers.values()) { try { rawSend(p, { $: 'bye' }, true); } catch (e) { /* nada */ } } signal({ t: 'bye' }); }
    S.alive = false; clearInterval(tick); clearInterval(linkT); S.succ = null;
    for (const p of peers.values()) { clearTimeout(p.relayT); clearTimeout(p.rqT); try { p.pc && p.pc.close(); } catch (e) { /* nada */ } }
    peers.clear(); const sg = S.sig; S.sig = null; if (sg) setTimeout(() => sg.close(), 300);
    S.code = null; S.isHost = false; S.hostId = null; S.room = null; S.play = null; if (!quiet) emit('peers');
  }
  /* ---------- probar la red de este aparato (Ajustes) ---------- */
  // señales (los servidores MQTT), conexión directa (STUN: ¿se ve la IP pública?) y respaldo (TURN: ¿da un puerto de relevo?)
  function iceTypes(servers, policy, ms = 8000) {
    return new Promise(res => {
      let pc; const types = new Set(); let done = false;
      const fin = () => { if (done) return; done = true; try { pc && pc.close(); } catch (e) { /* nada */ } res(types); };
      try {
        pc = new RTCPeerConnection({ iceServers: servers, iceTransportPolicy: policy || 'all' }); pc.createDataChannel('x');
        pc.onicecandidate = e => { if (!e.candidate) return fin(); const t = (String(e.candidate.candidate).match(/ typ (\w+)/) || [])[1]; if (t) types.add(t); if (t === 'relay' && policy === 'relay') fin(); };
        pc.onicegatheringstatechange = () => { if (pc.iceGatheringState === 'complete') fin(); };
        pc.createOffer().then(o => pc.setLocalDescription(o)).catch(fin);
      } catch (e) { fin(); }
      setTimeout(fin, ms);
    });
  }
  function brokerOk(url, ms = 6000) {
    return new Promise(res => {
      let ws = null, done = false; const fin = ok => { if (done) return; done = true; try { ws && ws.close(); } catch (e) { /* nada */ } res(ok); };
      try { ws = new WebSocket(url, ['mqtt']); ws.binaryType = 'arraybuffer'; ws.onopen = () => ws.send(mqttPacket(0x10, cat(mqttStr('MQTT'), new Uint8Array([4, 2, 0, 30]), mqttStr('ghp' + rid(8))))); ws.onmessage = e => fin(new Uint8Array(e.data)[0] >> 4 === 2); ws.onerror = ws.onclose = () => fin(false); } catch (e) { fin(false); }
      setTimeout(() => fin(false), ms);
    });
  }
  // el servidor propio: ¿responde y en cuánto? (y desde qué ciudad de Cloudflare)
  async function serverPing() {
    if (!SERVER) return null;
    try { let best = 1e9, colo = ''; for (let k = 0; k < 3; k++) { const t = performance.now(), r = await fetch(SERVER + '/ping', { cache: 'no-store' }); const j = await r.json(); best = Math.min(best, performance.now() - t); colo = j.colo || colo; } const ice = await cfIce(); return { ok: true, ms: Math.round(best), colo, turn: ice.some(x => x.urls.some(u => /^turns?:/.test(u))) }; } catch (e) { return { ok: false }; }
  }
  async function probe(turn) {
    if (typeof RTCPeerConnection === 'undefined') return { webrtc: false, signal: 0, of: BROKERS.length, stun: false, turn: false, own: null };
    const own = turn === undefined ? ownTurn() : cleanIce(turn);
    const [sig, all, mine, srv] = await Promise.all([
      Promise.all(BROKERS.map(u => brokerOk(u))),
      Promise.all([cfIce(), openRelay()]).then(([c, r]) => iceTypes(STUN.concat(c, r), 'all')),
      own ? iceTypes(own, 'relay') : Promise.resolve(null),
      serverPing(),
    ]);
    return { webrtc: true, signal: sig.filter(Boolean).length, of: BROKERS.length, stun: all.has('srflx') || all.has('prflx'), turn: all.has('relay'), own: mine ? mine.has('relay') : null, server: srv };
  }
  addEventListener('pagehide', () => { if (S.alive) leave(true); });
  const api = {
    transport: null,
    relayMerge: null, // (viejo, nuevo): GameHub pasa las partes lentas de una instantánea saltada a la que sale
    probe,
    host: info => start(rid(5), info, true),
    join: (code, info) => start(String(code).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5), info, false),
    leave: () => leave(false),
    // datos enviados y recibidos (bytes) desde el último reinicio de la cuenta
    get stats() { return Object.assign({ secs: (Date.now() - ST.t0) / 1000 }, ST); }, resetStats() { ST.out = ST.in = ST.nOut = ST.nIn = 0; ST.t0 = Date.now(); }, get sim() { return SIM; },
    // a: id de un aparato o '*' (todos); confiable = true para lo que no se puede perder
    send(a, data, rel = true) { if (a === '*') { const s = typeof data === 'string' ? data : JSON.stringify(data); for (const p of peers.values()) rawSend(p, s, rel); } else { const p = peers.get(a); if (p) rawSend(p, data, rel); } }, // (a todos: se pasa a texto una sola vez)
    setInfo(info) { S.info = info; if (S.isHost) broadcastRoom(); else { const h = peers.get(S.hostId); if (h && h.open) rawSend(h, { $: 'info', info }, true); signal({ t: 'hello', info }); } },
    on(t, f) { (L[t] = L[t] || []).push(f); return () => { L[t] = L[t].filter(x => x !== f); }; },
    now: () => performance.now() + (S.isHost ? 0 : S.clockOff),
    get id() { return S.id; }, get code() { return S.code; }, get isHost() { return S.isHost; }, get hostId() { return S.hostId; }, get alive() { return S.alive; },
    get room() { return S.room; }, get peers() { return peers; }, get signalReady() { return !!(S.sig && S.sig.ready); },
    get server() { return SERVER; }, get serverReady() { return !!(S.sig && S.sig.srv); },
    _onInfo(id, info) { const p = peers.get(id); if (p) { p.info = info; broadcastRoom(); } },
    get term() { return S.term; }, get ownTurn() { return ownTurn(); },
    // la partida que tiene abierta el anfitrión (viaja con la sala cada 2 s: si a alguien no le llegó el aviso de empezar o
    // de terminar, se pone al día solo) · null = está en la sala
    setPlay(p) { S.play = p || null; if (S.isHost) broadcastRoom(); },
    // pruebas: corte de red simulado desde ya (los dos aparatos lo piden a la vez)
    // (solo = 'directo': se cae la conexión directa pero internet sigue, como al cambiar de antena; si no, se cae todo)
    // pruebas: lo que llega y cumple f(m) se pierde durante ms (para probar que nadie se queda atrás si se pierde un aviso)
    simDrop(f, ms) { simDrop = typeof f === 'function' ? { f, until: performance.now() + ms } : null; },
    simCut(ms, solo) { cutA = performance.now(); cutB = cutA + ms; cutDirect = solo === 'directo'; SIM.on = true; },
  };
  return api;
})();
// el anfitrión recibe cambios de jugadores de un aparato
Net.on('msg', (from, m) => { if (m && m.$ === 'info' && Net.isHost) Net._onInfo(from, m.info); });
