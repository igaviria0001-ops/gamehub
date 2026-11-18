/* =========================================================================
   RED DE GAMEHUB — salas en línea sin servidor propio.
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
   API: Net.host(info) → código · Net.join(código, info) · Net.leave()
        Net.send(a, datos, confiable) (a = id | '*') · Net.on(tipo, fn)
        Net.id · Net.isHost · Net.code · Net.peers (Map) · Net.now() (reloj del anfitrión)
   ========================================================================= */
const Net = (() => {
  const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const BROKERS = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt', 'wss://test.mosquitto.org:8081'];
  const STUN = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun.cloudflare.com:3478' }, { urls: 'stun:stun1.l.google.com:19302' }];
  const enc = new TextEncoder(), dec = new TextDecoder();
  const rid = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => ALPHA[b % ALPHA.length]).join('');
  const b64 = u8 => btoa(String.fromCharCode(...u8)), unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const L = { peers: [], msg: [], status: [], room: [] };
  const emit = (t, ...a) => { for (const f of L[t] || []) { try { f(...a); } catch (e) { console.error(e); } } };

  /* ---------- estado ---------- */
  // pruebas: ?netloss=0.1 (se pierde 10 % de lo que va sin orden) · ?netlag=80 (ms de más) · ?netforce=relay (sin WebRTC)
  const SIM = (() => { try { const q = new URLSearchParams(location.search); return { loss: Math.min(0.9, +q.get('netloss') || 0), lag: Math.min(2000, +q.get('netlag') || 0), relay: q.get('netforce') === 'relay' }; } catch (e) { return { loss: 0, lag: 0, relay: false }; } })();
  const ST = { out: 0, in: 0, nOut: 0, nIn: 0, t0: Date.now() };
  const S = { id: rid(8), code: null, isHost: false, hostId: null, info: null, key: null, topic: null, sig: null, alive: false, seen: new Map(), clockOff: 0 };
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
  function Signal() {
    const useBC = new URLSearchParams(location.search).get('net') === 'bc' || Net.transport === 'bc';
    const onRaw = async u8 => { const m = await open(u8); if (!m || m.from === S.id || (m.to && m.to !== S.id)) return; if (S.seen.has(m.mid)) return; S.seen.set(m.mid, Date.now()); if (S.seen.size > 600) { const old = Date.now() - 60000; for (const [k, t] of S.seen) if (t < old) S.seen.delete(k); } onSignal(m); };
    if (useBC) { const bc = new BroadcastChannel(S.topic); bc.onmessage = e => onRaw(new Uint8Array(e.data)); return { send: u8 => bc.postMessage(u8.buffer), close: () => bc.close(), get ready() { return true; } }; }
    const bs = BROKERS.map(u => Broker(u, onRaw));
    return { send: u8 => bs.forEach(b => b.send(u8)), close: () => bs.forEach(b => b.close()), get ready() { return bs.some(b => b.ready); } };
  }
  async function signal(obj) { if (!S.sig) return; obj.from = S.id; obj.mid = rid(10); S.sig.send(await seal(obj)); }

  /* ---------- servidores de ICE ---------- */
  async function iceServers() {
    const list = STUN.slice();
    try { const own = JSON.parse(localStorage.getItem('gamehub_turn') || 'null'); if (Array.isArray(own) && own.length) return list.concat(own); } catch (e) { /* nada */ }
    try { // Open Relay «static auth»: usuario = vencimiento:nombre, clave = HMAC-SHA1(secreto público)
      const user = Math.floor(Date.now() / 1000 + 86400) + ':gamehub', k = await crypto.subtle.importKey('raw', enc.encode('openrelayprojectsecret'), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
      const cred = b64(new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(user)))), h = 'staticauth.openrelay.metered.ca';
      list.push({ urls: [`turn:${h}:80`, `turn:${h}:80?transport=tcp`, `turn:${h}:443`, `turns:${h}:443?transport=tcp`], username: user, credential: cred });
    } catch (e) { /* sin TURN */ }
    return list;
  }

  /* ---------- pares (WebRTC) ---------- */
  function newPeer(id, info) {
    let p = peers.get(id); if (p) { if (info) p.info = info; return p; }
    p = { id, info: info || null, pc: null, r: null, u: null, via: 'conectando', rtt: 0, open: false, lastSeen: Date.now(), pend: [], relayT: 0 };
    peers.set(id, p); return p;
  }
  async function makePC(p, initiator) {
    if (SIM.relay) { toRelay(p); return null; }
    if (p.pc) { try { p.pc.close(); } catch (e) { /* nada */ } }
    const pc = new RTCPeerConnection({ iceServers: await iceServers(), bundlePolicy: 'max-bundle' });
    p.pc = pc; p.open = false; p.via = 'conectando';
    pc.onicecandidate = e => { if (e.candidate) signal({ t: 'ice', to: p.id, c: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate }); };
    pc.onconnectionstatechange = () => { const st = pc.connectionState; if (st === 'failed') toRelay(p); if (st === 'disconnected') setTimeout(() => { if (pc.connectionState === 'disconnected') toRelay(p); }, 5000); emit('peers'); };
    const wire = (ch, kind) => { ch.binaryType = 'arraybuffer'; p[kind] = ch; ch.onopen = () => { if (p.r && p.r.readyState === 'open') { p.open = true; p.via = route(pc); flush(p); emit('peers'); } }; ch.onmessage = e => onData(p, e.data, kind === 'r'); ch.onclose = () => { if (p[kind] === ch) p[kind] = null; }; };
    // canales negociados: los dos lados los crean igual (sin esperar a «ondatachannel»)
    wire(pc.createDataChannel('r', { negotiated: true, id: 1, ordered: true }), 'r');
    wire(pc.createDataChannel('u', { negotiated: true, id: 2, ordered: false, maxRetransmits: 0 }), 'u');
    if (initiator) { const o = await pc.createOffer(); await pc.setLocalDescription(o); signal({ t: 'offer', to: p.id, sdp: pc.localDescription.sdp }); }
    clearTimeout(p.relayT); p.relayT = setTimeout(() => { if (!p.open) toRelay(p); }, 12000);
    return pc;
  }
  function route(pc) { return 'p2p'; }
  async function refineRoute(p) { // ¿directo o por TURN? (para mostrarlo en la sala)
    try { const st = await p.pc.getStats(); let pair = null; st.forEach(s => { if (s.type === 'transport' && s.selectedCandidatePairId) pair = st.get(s.selectedCandidatePairId); }); if (!pair) st.forEach(s => { if (s.type === 'candidate-pair' && s.nominated && s.state === 'succeeded') pair = s; }); if (pair) { const lc = st.get(pair.localCandidateId), rc = st.get(pair.remoteCandidateId); p.via = (lc && lc.candidateType === 'relay') || (rc && rc.candidateType === 'relay') ? 'turn' : 'p2p'; } } catch (e) { /* nada */ }
  }
  function toRelay(p) { if (p.via === 'relay') return; p.via = 'relay'; p.open = true; flush(p); emit('peers'); }
  function flush(p) { const q = p.pend; p.pend = []; for (const [d, rel] of q) rawSend(p, d, rel); }
  function rawSend(p, data, rel) {
    const s = typeof data === 'string' ? data : JSON.stringify(data);
    if (SIM.loss && !rel && Math.random() < SIM.loss) return;
    if (SIM.lag) { setTimeout(() => sendNow(p, s, rel), SIM.lag * (0.8 + Math.random() * 0.4)); return; }
    sendNow(p, s, rel);
  }
  function sendNow(p, s, rel) {
    ST.out += s.length; ST.nOut++;
    if (p.via === 'relay') { if (rel || Math.random() < 0.5) signal({ t: 'relay', to: p.id, d: s }); return; } // sin WebRTC: lo urgente a la mitad (no saturar el broker)
    const ch = (!rel && p.u && p.u.readyState === 'open') ? p.u : p.r;
    if (!ch || ch.readyState !== 'open') { if (rel && p.pend.length < 200) p.pend.push([s, rel]); return; }
    if (!rel && ch.bufferedAmount > 64000) return; // la red va atrasada: se salta este (llega otro enseguida)
    try { ch.send(s); } catch (e) { /* nada */ }
  }
  function onData(p, raw, rel) {
    p.lastSeen = Date.now(); ST.in += typeof raw === 'string' ? raw.length : raw.byteLength || 0; ST.nIn++;
    let m; try { m = JSON.parse(typeof raw === 'string' ? raw : dec.decode(raw)); } catch (e) { return; }
    if (m && m.$ === 'ping') { rawSend(p, { $: 'pong', t: m.t, h: S.isHost ? performance.now() : undefined }, false); return; }
    if (m && m.$ === 'pong') { const now = performance.now(), rtt = now - m.t; p.rtt = p.rtt ? p.rtt * 0.8 + rtt * 0.2 : rtt; if (m.h != null && !S.isHost) { const off = m.h + rtt / 2 - now; S.clockOff = S.clockOff ? S.clockOff * 0.85 + off * 0.15 : off; } return; }
    if (m && m.$ === 'room' && !S.isHost) { S.room = m.room; emit('room', m.room); return; }
    if (m && m.$ === 'bye') { dropPeer(p.id); return; }
    emit('msg', p.id, m, rel);
  }
  function dropPeer(id) { const p = peers.get(id); if (!p) return; clearTimeout(p.relayT); try { p.pc && p.pc.close(); } catch (e) { /* nada */ } peers.delete(id); emit('peers'); if (S.isHost) broadcastRoom(); else if (id === S.hostId) emit('status', { hostGone: true }); }

  /* ---------- señales ---------- */
  async function onSignal(m) {
    if (m.t === 'hello' && S.isHost) { // alguien quiere entrar: el anfitrión lo llama
      const p = newPeer(m.from, m.info); p.lastSeen = Date.now();
      if (!p.pc || p.pc.connectionState === 'failed' || p.pc.connectionState === 'closed' || (!p.open && Date.now() - (p.callT || 0) > 6000)) { p.callT = Date.now(); await makePC(p, true); }
      signal({ t: 'welcome', to: m.from, host: S.id }); broadcastRoom(); return;
    }
    if (m.t === 'welcome' && !S.isHost) { S.hostId = m.host; const hp = newPeer(m.host); if (SIM.relay) toRelay(hp); return; }
    if (m.t === 'offer' && !S.isHost) { S.hostId = m.from; const p = newPeer(m.from); const pc = await makePC(p, false); await pc.setRemoteDescription({ type: 'offer', sdp: m.sdp }); const a = await pc.createAnswer(); await pc.setLocalDescription(a); signal({ t: 'answer', to: m.from, sdp: pc.localDescription.sdp }); for (const c of p.iceQ || []) try { await pc.addIceCandidate(c); } catch (e) { /* nada */ } p.iceQ = []; return; }
    if (m.t === 'answer' && S.isHost) { const p = peers.get(m.from); if (p && p.pc) { await p.pc.setRemoteDescription({ type: 'answer', sdp: m.sdp }); for (const c of p.iceQ || []) try { await p.pc.addIceCandidate(c); } catch (e) { /* nada */ } p.iceQ = []; } return; }
    if (m.t === 'ice') { const p = peers.get(m.from); if (!p) return; if (p.pc && p.pc.remoteDescription) { try { await p.pc.addIceCandidate(m.c); } catch (e) { /* nada */ } } else (p.iceQ = p.iceQ || []).push(m.c); return; }
    if (m.t === 'relay') { const p = peers.get(m.from); if (p) { if (p.via !== 'relay') toRelay(p); onData(p, m.d, true); } return; }
    if (m.t === 'bye') { dropPeer(m.from); return; }
  }

  /* ---------- la sala ---------- */
  function roomState() { return { code: S.code, host: S.id, devices: [{ id: S.id, info: S.info, host: true, rtt: 0, via: 'local' }].concat([...peers.values()].filter(p => p.info).map(p => ({ id: p.id, info: p.info, rtt: Math.round(p.rtt), via: p.via, open: p.open }))) }; }
  function broadcastRoom() { if (!S.isHost) return; const room = roomState(); S.room = room; emit('room', room); for (const p of peers.values()) if (p.open) rawSend(p, { $: 'room', room }, true); }
  let tick = 0;
  function loop() {
    clearInterval(tick);
    tick = setInterval(() => {
      if (!S.alive) return; const now = Date.now();
      for (const p of peers.values()) { if (p.open && p.via !== 'relay') rawSend(p, { $: 'ping', t: performance.now() }, false); if (p.via === 'p2p' && p.pc && !p.routeChecked) { p.routeChecked = true; refineRoute(p); } }
      // silencio largo = se fue (con margen: mientras un aparato carga un juego pesado puede callar varios segundos)
      const gone = p => now - p.lastSeen > (p.pc && p.pc.connectionState === 'connected' ? 60000 : 30000);
      if (S.isHost) { for (const p of [...peers.values()]) if (gone(p)) dropPeer(p.id); broadcastRoom(); }
      else { const h = peers.get(S.hostId); if (!h || !h.open) signal({ t: 'hello', info: S.info }); else if (gone(h)) { emit('status', { hostGone: true }); } }
    }, 2000);
  }
  async function start(code, info, host) {
    leave(true); S.code = code; S.info = info; S.isHost = host; S.hostId = host ? S.id : null; S.alive = true; S.clockOff = 0;
    await deriveKey(code); S.sig = Signal(); loop();
    if (host) broadcastRoom(); else { signal({ t: 'hello', info }); setTimeout(() => S.alive && !S.hostId && signal({ t: 'hello', info }), 1200); }
    return code;
  }
  function leave(quiet) {
    if (S.alive) { for (const p of peers.values()) { try { rawSend(p, { $: 'bye' }, true); } catch (e) { /* nada */ } } signal({ t: 'bye' }); }
    S.alive = false; clearInterval(tick);
    for (const p of peers.values()) { clearTimeout(p.relayT); try { p.pc && p.pc.close(); } catch (e) { /* nada */ } }
    peers.clear(); const sg = S.sig; S.sig = null; if (sg) setTimeout(() => sg.close(), 300);
    S.code = null; S.isHost = false; S.hostId = null; S.room = null; if (!quiet) emit('peers');
  }
  addEventListener('pagehide', () => { if (S.alive) leave(true); });
  return {
    transport: null,
    host: info => start(rid(5), info, true),
    join: (code, info) => start(String(code).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5), info, false),
    leave: () => leave(false),
    // datos enviados y recibidos (bytes) desde el último reinicio de la cuenta
    get stats() { return Object.assign({ secs: (Date.now() - ST.t0) / 1000 }, ST); }, resetStats() { ST.out = ST.in = ST.nOut = ST.nIn = 0; ST.t0 = Date.now(); }, get sim() { return SIM; },
    // a: id de un aparato o '*' (todos); confiable = true para lo que no se puede perder
    send(a, data, rel = true) { if (a === '*') { for (const p of peers.values()) rawSend(p, data, rel); } else { const p = peers.get(a); if (p) rawSend(p, data, rel); } },
    setInfo(info) { S.info = info; if (S.isHost) broadcastRoom(); else { const h = peers.get(S.hostId); if (h && h.open) rawSend(h, { $: 'info', info }, true); signal({ t: 'hello', info }); } },
    on(t, f) { (L[t] = L[t] || []).push(f); return () => { L[t] = L[t].filter(x => x !== f); }; },
    now: () => performance.now() + (S.isHost ? 0 : S.clockOff),
    get id() { return S.id; }, get code() { return S.code; }, get isHost() { return S.isHost; }, get hostId() { return S.hostId; }, get alive() { return S.alive; },
    get room() { return S.room; }, get peers() { return peers; }, get signalReady() { return !!(S.sig && S.sig.ready); },
    _onInfo(id, info) { const p = peers.get(id); if (p) { p.info = info; broadcastRoom(); } },
  };
})();
// el anfitrión recibe cambios de jugadores de un aparato
Net.on('msg', (from, m) => { if (m && m.$ === 'info' && Net.isHost) Net._onInfo(from, m.info); });
