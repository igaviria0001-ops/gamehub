var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
import { DurableObject } from "cloudflare:workers";
var ORIGINS = [/^https:\/\/igaviria0001-ops\.github\.io$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
var okOrigin = /* @__PURE__ */ __name((o) => !o || ORIGINS.some((r) => r.test(o)), "okOrigin");
var cors = /* @__PURE__ */ __name((o) => ({ "Access-Control-Allow-Origin": o && okOrigin(o) ? o : "https://igaviria0001-ops.github.io", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Max-Age": "86400", Vary: "Origin" }), "cors");
var json = /* @__PURE__ */ __name((obj, o, st = 200, extra) => new Response(JSON.stringify(obj), { status: st, headers: Object.assign({ "Content-Type": "application/json", "Cache-Control": "no-store" }, cors(o), extra || {}) }), "json");
var ROOM_RE = /^[a-z0-9]{8,40}$/;
var ID_RE = /^[A-Za-z0-9]{8}$/;
var iceCache = null;
var src_default = {
  async fetch(req, env) {
    const url = new URL(req.url), o = req.headers.get("Origin");
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(o) });
    if (!okOrigin(o)) return new Response("no", { status: 403 });
    if (url.pathname === "/ping") return json({ ok: true, t: Date.now(), colo: req.cf && req.cf.colo || "" }, o);
    if (url.pathname === "/ice") {
      if (!env.TURN_KEY_ID || !env.TURN_KEY_API_TOKEN) return json({ iceServers: [], error: "sin-turn" }, o);
      const now = Date.now();
      if (!iceCache || now - iceCache.at > 6 * 3600 * 1e3) {
        try {
          const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate-ice-servers`, {
            method: "POST",
            headers: { Authorization: `Bearer ${env.TURN_KEY_API_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({ ttl: 86400 })
          });
          if (!r.ok) return json({ iceServers: [], error: "turn-" + r.status }, o, 502);
          const d = await r.json();
          iceCache = { at: now, body: { iceServers: d.iceServers || [], ttl: 86400 - 6 * 3600 } };
        } catch (e) {
          return json({ iceServers: [], error: "turn-red" }, o, 502);
        }
      }
      return json(iceCache.body, o);
    }
    const m = url.pathname.match(/^\/s\/([a-z0-9]+)$/);
    if (m) {
      if (req.headers.get("Upgrade") !== "websocket") return new Response("websocket", { status: 426 });
      const room = m[1], id = url.searchParams.get("id") || "";
      if (!ROOM_RE.test(room) || !ID_RE.test(id)) return new Response("mal", { status: 400 });
      const stub = env.SALAS.get(env.SALAS.idFromName(room));
      return stub.fetch(req);
    }
    return new Response("GameHub", { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
};
var Sala = class extends DurableObject {
  static {
    __name(this, "Sala");
  }
  async fetch(req) {
    const id = new URL(req.url).searchParams.get("id");
    const socks = this.ctx.getWebSockets();
    if (socks.length >= 24) return new Response("llena", { status: 429 });
    for (const w of this.ctx.getWebSockets(id)) {
      try {
        w.close(4e3, "otra");
      } catch (e) {
      }
    }
    const pair = new WebSocketPair(), [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server, [id]);
    server.serializeAttachment({ id });
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(ws, msg) {
    if (typeof msg === "string") {
      if (msg === "p") ws.send("q");
      return;
    }
    const u8 = new Uint8Array(msg);
    if (u8.length < 9 || u8.length > 65536) return;
    const to = String.fromCharCode(...u8.subarray(0, 8)), body = u8.subarray(8);
    const me = (ws.deserializeAttachment() || {}).id;
    if (to === "********") {
      for (const w of this.ctx.getWebSockets()) if (w !== ws) {
        try {
          w.send(body);
        } catch (e) {
        }
      }
      return;
    }
    if (!ID_RE.test(to) || to === me) return;
    for (const w of this.ctx.getWebSockets(to)) {
      try {
        w.send(body);
      } catch (e) {
      }
    }
  }
  async webSocketClose(ws) {
    try {
      ws.close(1e3, "chao");
    } catch (e) {
    }
  }
  async webSocketError(ws) {
    try {
      ws.close(1011, "error");
    } catch (e) {
    }
  }
};

// ../../wr/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../wr/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-VOgEoG/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../wr/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-VOgEoG/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  Sala,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
