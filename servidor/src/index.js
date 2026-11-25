/* =========================================================================
   SERVIDOR DE GAMEHUB (Cloudflare Workers, plan gratis)
   · /s/<sala>?id=<aparato>  WebSocket de la sala: señal (encontrarse) y relevo
     rápido cuando la conexión directa entre aparatos no sirve. El servidor no
     entiende lo que pasa: los mensajes van cifrados de aparato a aparato; solo
     mira a quién va cada uno (los primeros 8 bytes).
   · /ice  credenciales TURN de Cloudflare (servidores en Colombia y en todo el
     mundo) para que los celulares con datos se conecten directo.
   · /ping  para medir.
   Secretos (Cloudflare → este Worker → Settings → Variables and Secrets):
     TURN_KEY_ID y TURN_KEY_API_TOKEN (de Realtime → TURN).
   Se publica solo desde GitHub (carpeta servidor/) con cada cambio en main.
   ========================================================================= */
import { DurableObject } from 'cloudflare:workers';

// quién puede usar el servidor (el navegador manda «Origin»): GameHub y las pruebas en el computador
const ORIGINS = [/^https:\/\/igaviria0001-ops\.github\.io$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
const okOrigin = o => !o || ORIGINS.some(r => r.test(o)); // sin «Origin» = herramientas (curl), se deja para revisar
const cors = o => ({ 'Access-Control-Allow-Origin': o && okOrigin(o) ? o : 'https://igaviria0001-ops.github.io', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Max-Age': '86400', Vary: 'Origin' });
const json = (obj, o, st = 200, extra) => new Response(JSON.stringify(obj), { status: st, headers: Object.assign({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, cors(o), extra || {}) });

const ROOM_RE = /^[a-z0-9]{8,40}$/; // la sala es un resumen del código (nunca el código)
const ID_RE = /^[A-Za-z0-9]{8}$/;

let iceCache = null; // { at, body } en la memoria del Worker (se pide a Cloudflare de vez en cuando)

export default {
  async fetch(req, env) {
    const url = new URL(req.url), o = req.headers.get('Origin');
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(o) });
    if (!okOrigin(o)) return new Response('no', { status: 403 });

    if (url.pathname === '/ping') return json({ ok: true, t: Date.now(), colo: (req.cf && req.cf.colo) || '' }, o);

    if (url.pathname === '/ice') {
      if (!env.TURN_KEY_ID || !env.TURN_KEY_API_TOKEN) return json({ iceServers: [], error: 'sin-turn' }, o);
      const now = Date.now();
      if (!iceCache || now - iceCache.at > 6 * 3600 * 1000) { // credenciales de 24 h, renovadas cada 6 h
        try {
          const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate-ice-servers`, {
            method: 'POST', headers: { Authorization: `Bearer ${env.TURN_KEY_API_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ttl: 86400 }),
          });
          if (!r.ok) return json({ iceServers: [], error: 'turn-' + r.status }, o, 502);
          const d = await r.json();
          iceCache = { at: now, body: { iceServers: d.iceServers || [], ttl: 86400 - 6 * 3600 } };
        } catch (e) { return json({ iceServers: [], error: 'turn-red' }, o, 502); }
      }
      return json(iceCache.body, o);
    }

    const m = url.pathname.match(/^\/s\/([a-z0-9]+)$/);
    if (m) {
      if (req.headers.get('Upgrade') !== 'websocket') return new Response('websocket', { status: 426 });
      const room = m[1], id = url.searchParams.get('id') || '';
      if (!ROOM_RE.test(room) || !ID_RE.test(id)) return new Response('mal', { status: 400 });
      const stub = env.SALAS.get(env.SALAS.idFromName(room));
      return stub.fetch(req);
    }
    return new Response('GameHub', { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  },
};

/* Una sala = un objeto. Reparte los mensajes: los primeros 8 bytes dicen a quién («********» = a todos los demás).
   Usa la API de hibernación: si nadie habla, el objeto duerme y no gasta. */
export class Sala extends DurableObject {
  async fetch(req) {
    const id = new URL(req.url).searchParams.get('id');
    const socks = this.ctx.getWebSockets();
    if (socks.length >= 24) return new Response('llena', { status: 429 });
    for (const w of this.ctx.getWebSockets(id)) { try { w.close(4000, 'otra'); } catch (e) { /* nada */ } } // el mismo aparato se reconectó
    const pair = new WebSocketPair(), [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server, [id]);
    server.serializeAttachment({ id });
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(ws, msg) {
    if (typeof msg === 'string') { if (msg === 'p') ws.send('q'); return; } // latido
    const u8 = new Uint8Array(msg);
    if (u8.length < 9 || u8.length > 65536) return;
    const to = String.fromCharCode(...u8.subarray(0, 8)), body = u8.subarray(8);
    const me = (ws.deserializeAttachment() || {}).id;
    if (to === '********') { for (const w of this.ctx.getWebSockets()) if (w !== ws) { try { w.send(body); } catch (e) { /* nada */ } } return; }
    if (!ID_RE.test(to) || to === me) return;
    for (const w of this.ctx.getWebSockets(to)) { try { w.send(body); } catch (e) { /* nada */ } }
  }
  async webSocketClose(ws) { try { ws.close(1000, 'chao'); } catch (e) { /* nada */ } }
  async webSocketError(ws) { try { ws.close(1011, 'error'); } catch (e) { /* nada */ } }
}
