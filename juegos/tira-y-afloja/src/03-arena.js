/* =========================================================================
   ARENAS — registro, geometría de la arena actual y colisiones
   Cada arena (archivos 03b…) llama a defineArena({ id, name, desc, layout,
   paintBg, paintFg?, drawDynamic?, drawOver?, init?, update? }).
   layout() devuelve: solids, oneway, pegs, zones, hazards, bordes del piso
   principal (deskLeft/deskRight/deskY), canecas y puntos de aparición.
   Propiedades especiales de un sólido: bounce (colchoneta), conveyor (banda),
   move(R, t, dt, G) (se mueve; se recuerdan R.dx/R.dy de cada paso).
   Zonas: { type: 'heat' | 'cold' | 'wind', x, y, w, h, dir, strength, active }.
   ========================================================================= */
const ARENA_DEFS = {};
const ARENA_LIST = [];
function defineArena(def) { ARENA_DEFS[def.id] = def; ARENA_LIST.push(def); }

const ARENA = (() => {
  const A = {
    id: null, def: null, L: null,
    solids: [], oneway: [], pegs: [], zones: [], hazards: [], movers: [],
    hazardY: 832, deskLeft: 266, deskRight: 1654, deskY: 640, canRim: 826,
    spawns: [], pelletSpots: [], goldenSpots: [], respawnSpots: [], cans: [],
    t: 0,
    mods: { gravity: 1, temp: 0, push: 0, cut: 0, slip: 0 }, // modificadores globales (Fiesta, bus, tijeras)
  };

  // variant: algunas arenas tienen otra versión para un modo (p. ej. la cancha de Gol de canica)
  A.load = function (id, variant = null) {
    const def = ARENA_DEFS[id] || ARENA_LIST[0];
    const useVar = variant && def.variants && def.variants[variant];
    const L = useVar ? def.variants[variant]() : def.layout();
    // el frente del mueble queda al ras del borde: así quien cuelga puede subir tirando (antes se atascaba bajo la tapa)
    for (const R of L.solids || []) if (/Body$/.test(R.kind) && R.x === 290 && R.w === 1340) { R.x = 266; R.w = 1388; }
    A.def = def; A.id = def.id; A.L = L; A.variant = useVar ? variant : null;
    A.goals = L.goals || [];
    A.solids = L.solids || []; A.oneway = L.oneway || []; A.pegs = L.pegs || []; A.zones = L.zones || []; A.hazards = L.hazards || [];
    A.hazardY = L.hazardY ?? 832; A.ceilY = L.ceilY ?? -380; A.deskLeft = L.deskLeft ?? 266; A.deskRight = L.deskRight ?? 1654; A.deskY = L.deskY ?? 640; A.canRim = L.canRim ?? 826;
    A.spawns = L.spawns || [{ x: 760, y: A.deskY }, { x: 1160, y: A.deskY }];
    A.pelletSpots = L.pelletSpots || []; A.goldenSpots = L.goldenSpots || []; A.respawnSpots = L.respawnSpots || A.spawns; A.cans = L.cans || [];
    for (const R of [...A.solids, ...A.oneway, ...A.pegs]) { R.x0 = R.x; R.y0 = R.y; R.dx = 0; R.dy = 0; }
    A.movers = [...A.solids, ...A.oneway, ...A.pegs].filter(R => R.move);
    A.reset();
  };

  A.reset = function () {
    A.t = 0;
    A.mods.push = 0; A.mods.cut = 0; A.mods.gravity = 1; A.mods.temp = 0; A.mods.slip = 0;
    A.objects = []; // cosas que caen o se mueven libres (libros, etc.)
    A.pushWarn = 0;
    for (const R of A.movers) { R.x = R.x0; R.y = R.y0; R.dx = 0; R.dy = 0; }
    for (const Z of A.zones) Z.active = Z.type === 'wind' ? 0 : 1;
    if (A.def && A.def.init) A.def.init(A);
  };

  A.update = function (dt, G) {
    A.t += dt;
    for (const R of A.movers) {
      const px = R.x, py = R.y; R.move(R, A.t, dt, G, A); R.dx = R.x - px; R.dy = R.y - py;
      if (Math.abs(R.dy) > 300 || Math.abs(R.dx) > 300) { R.dx = 0; R.dy = 0; } // aparece/desaparece: no arrastra a nadie
    }
    if (A.def.update) A.def.update(dt, G, A);
  };

  /* ---------- consultas de zonas ---------- */
  const inside = (Z, x, y) => x >= Z.x && x <= Z.x + Z.w && y >= Z.y && y <= Z.y + Z.h;
  A.windAt = function (x, y) {
    let w = 0;
    for (const Z of A.zones) if (Z.type === 'wind' && Z.active > 0 && inside(Z, x, y)) w += Z.dir * Z.strength * Z.active;
    return w;
  };
  A.tempAt = function (x, y) {
    let t = 0;
    for (const Z of A.zones) {
      if (!inside(Z, x, y)) continue;
      if (Z.type === 'heat') t += Z.active; else if (Z.type === 'cold') t -= Z.active;
    }
    return clamp(t, -1, 1);
  };
  A.hazardAt = function (x, y, r) {
    for (const H of A.hazards) if (H.active !== 0 && x + r * 0.5 > H.x && x - r * 0.5 < H.x + H.w && y + r * 0.6 > H.y && y - r * 0.6 < H.y + H.h) return H;
    return null;
  };

  /* ---------- colisiones ---------- */
  function circleRect(px, py, r, R) {
    const cx = clamp(px, R.x, R.x + R.w), cy = clamp(py, R.y, R.y + R.h);
    const dx = px - cx, dy = py - cy, d2 = dx * dx + dy * dy;
    if (d2 > r * r) return null;
    if (d2 > 1e-8) { const d = Math.sqrt(d2); return { nx: dx / d, ny: dy / d, depth: r - d, R }; }
    const l = px - R.x, rr = R.x + R.w - px, t = py - R.y, b = R.y + R.h - py;
    const m = Math.min(l, rr, t, b);
    if (m === t) return { nx: 0, ny: -1, depth: t + r, R };
    if (m === b) return { nx: 0, ny: 1, depth: b + r, R };
    if (m === l) return { nx: -1, ny: 0, depth: l + r, R };
    return { nx: 1, ny: 0, depth: rr + r, R };
  }
  function circlePeg(px, py, r, C) {
    const dx = px - C.x, dy = py - C.y, d = Math.hypot(dx, dy), m = r + C.r;
    if (d >= m) return null;
    if (d < 1e-6) return { nx: 0, ny: -1, depth: m, R: C };
    return { nx: dx / d, ny: dy / d, depth: m - d, R: C };
  }

  // Resuelve un círculo (jugador) contra el mundo. Devuelve los contactos.
  A.collideCircle = function (body, prevY) {
    const contacts = [];
    const resolve = c => {
      body.x += c.nx * c.depth; body.y += c.ny * c.depth;
      const rvx = body.vx - (c.R.dx || 0) / (1 / 120), rvy = body.vy - (c.R.dy || 0) / (1 / 120);
      const vn = rvx * c.nx + rvy * c.ny;
      if (vn < 0) { body.vx -= vn * c.nx; body.vy -= vn * c.ny; c.impact = -vn; } else c.impact = 0;
    };
    for (let iter = 0; iter < 3; iter++) {
      let any = false;
      for (const R of A.solids) {
        if (R.solidOff) continue;
        let c = circleRect(body.x, body.y, body.r, R);
        if (!c) continue;
        // escalón bajito (borde de una banda, un borrador acostado): se sube encima en vez de rebotar
        if (Math.abs(c.nx) > 0.2 && c.ny < 0 && (!R.bounce || R.stepOn) && R.y >= body.y + body.r * 0.45 && R.y - (body.y + body.r) > -body.r * 0.6) {
          c = { nx: 0, ny: -1, depth: body.y + body.r - R.y, R };
        }
        any = true; resolve(c);
        if (!contacts.some(k => k.R === R)) contacts.push(c);
      }
      for (const C of A.pegs) {
        const c = circlePeg(body.x, body.y, body.r, C);
        if (!c) continue;
        any = true; resolve(c);
        if (!contacts.some(k => k.R === C)) contacts.push(c);
      }
      if (!any) break;
    }
    // plataformas de un solo sentido (se atraviesan desde abajo)
    for (const P of A.oneway) {
      if (body.vy < -1 + (P.dy || 0) * 120) continue;
      if (body.x < P.x - body.r * 0.35 || body.x > P.x + P.w + body.r * 0.35) continue;
      const bottom = body.y + body.r, prevBottom = prevY + body.r;
      if (prevBottom <= P.y - (P.dy || 0) + 2 && bottom >= P.y && !body.dropThrough) {
        const impact = Math.max(0, body.vy - (P.dy || 0) * 120);
        body.y = P.y - body.r; if (body.vy > 0) body.vy = 0;
        contacts.push({ nx: 0, ny: -1, depth: 0, R: P, impact, oneway: true });
      }
    }
    // paredes invisibles a los lados de la pantalla y techo lejano
    if (body.x < body.r) { body.x = body.r; if (body.vx < 0) body.vx *= -0.4; }
    if (body.x > WORLD_W - body.r) { body.x = WORLD_W - body.r; if (body.vx > 0) body.vx *= -0.4; }
    if (body.y < A.ceilY + body.r) { body.y = A.ceilY + body.r; if (body.vy < 0) body.vy = 0; }
    return contacts;
  };

  // Para los puntos del hilo
  A.collidePoint = function (pt, rad) {
    let hit = false;
    for (const R of A.solids) {
      if (R.solidOff) continue;
      if (pt.x < R.x - rad || pt.x > R.x + R.w + rad || pt.y < R.y - rad || pt.y > R.y + R.h + rad) continue;
      const c = circleRect(pt.x, pt.y, rad, R);
      if (!c) continue;
      pt.x += c.nx * c.depth + (R.dx || 0); pt.y += c.ny * c.depth; hit = true;
    }
    for (const C of A.pegs) {
      const c = circlePeg(pt.x, pt.y, rad, C);
      if (!c) continue;
      pt.x += c.nx * c.depth; pt.y += c.ny * c.depth; hit = true;
    }
    for (const P of A.oneway) {
      if (pt.x < P.x || pt.x > P.x + P.w) continue;
      if (pt.py + rad <= P.y - (P.dy || 0) + 1.5 && pt.y + rad > P.y) { pt.y = P.y - rad; hit = true; }
    }
    if (pt.x < 2) pt.x = 2; if (pt.x > WORLD_W - 2) pt.x = WORLD_W - 2;
    return hit;
  };

  // ¿hay suelo debajo? (para sombras y para el bot)
  A.groundBelow = function (x, y) {
    let best = 2000;
    for (const R of A.solids) if (!R.solidOff && x >= R.x && x <= R.x + R.w && R.y >= y - 2 && R.y < best) best = R.y;
    for (const P of A.oneway) if (x >= P.x && x <= P.x + P.w && P.y >= y - 2 && P.y < best) best = P.y;
    return best;
  };

  // superficie más cercana a menos de `reach` del borde del cuerpo (para pegarse en el aire)
  A.nearSurface = function (x, y, r, reach) {
    let best = null;
    for (const R of A.solids) {
      if (R.solidOff) continue;
      const c = circleRect(x, y, r + reach, R);
      if (c && (!best || c.depth > best.depth)) best = c;
    }
    for (const C of A.pegs) {
      const c = circlePeg(x, y, r + reach, C);
      if (c && (!best || c.depth > best.depth)) best = c;
    }
    if (!best) return null;
    best.gap = reach - best.depth; // distancia que falta para tocar
    return best;
  };

  A.circleRect = circleRect;
  return A;
})();
