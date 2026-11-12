/* =========================================================================
   EFECTOS — partículas y destellos (solo para la vista; no tocan la partida).
   Recibe los pedidos de G.fx y los eventos, y los vuelve chispas, brasas,
   gotas, hojas, polvo, vapor, escarcha, anillos y rayos.
   ========================================================================= */
const FX = (() => {
  const parts = [], shapes = [];
  const P = (o) => { if (parts.length > (LOWFX ? 450 : 1100)) return; parts.push(Object.assign({ z: 0, vz: 0, vx: 0, vy: 0, g: 0, drag: 1.5, life: 0.6, t: 0, size: 3, add: true, kind: 'dot', rot: 0, vr: 0 }, o)); };
  const S = (o) => shapes.push(Object.assign({ t: 0, life: 0.4 }, o));
  const EC = el => (ELEMENTS[el] || ELEMENTS.wind);
  function burst(x, y, el, n, sp = 160, o = {}) {
    const E = EC(el);
    for (let k = 0; k < n * (LOWFX ? 0.5 : 1); k++) {
      const a = Math.random() * TAU, v = sp * (0.3 + Math.random() * 0.8);
      P(Object.assign({ x, y, z: o.z || 16, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, vz: 60 + Math.random() * 120, g: o.g != null ? o.g : 260, life: 0.35 + Math.random() * 0.45, size: 2 + Math.random() * 3, color: Math.random() < 0.4 ? E.c0 : E.c1, kind: o.kind || 'dot' }, o.extra || {}));
    }
  }
  function steam(x, y, r) { for (let k = 0; k < (LOWFX ? 4 : 9); k++) P({ x: x + vr(-r, r) * 0.6, y: y + vr(-r, r) * 0.4, z: 10, vx: vr(-20, 20), vy: vr(-10, 10), vz: vr(30, 70), g: -10, drag: 1, life: vr(0.8, 1.5), size: vr(10, 22), color: 'rgba(230,240,255,0.5)', kind: 'smoke', add: false }); }
  function onFx(G, f) {
    switch (f.type) {
      case 'steam': steam(f.x, f.y, f.r || 24); break;
      case 'pop': if (f.el === 'water') { for (let k = 0; k < (LOWFX ? 8 : 18); k++) { const a = Math.random() * TAU, v = vr(60, 220); P({ x: f.x, y: f.y, z: 16, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: vr(80, 240), g: 600, life: vr(0.35, 0.7), size: vr(1.4, 3), color: Math.random() < 0.5 ? 'rgba(220,245,255,0.95)' : 'rgba(100,180,255,0.9)', kind: 'drop', add: false }); } S({ type: 'ripple', x: f.x, y: f.y, r1: (f.r || 12) * 4, life: 0.6 }); break; }
        if (f.el === 'fire') { S({ type: 'fireball', x: f.x, y: f.y, r: (f.r || 12) * 2.6, life: 0.32 }); }
        burst(f.x, f.y, f.el, f.petal ? 4 : 10, f.petal ? 80 : 150, { kind: f.el === 'plant' ? 'leaf' : f.el === 'earth' ? 'chunk' : 'dot', g: f.el === 'earth' ? 500 : 220 }); S({ type: 'ring', x: f.x, y: f.y, r0: 4, r1: (f.r || 12) * 2.2, el: f.el, life: 0.25 }); break;
      case 'boom': if (f.el === 'fire' || f.el === 'lava') S({ type: 'fireball', x: f.x, y: f.y, r: f.r * 1.1, life: 0.5 }); else if (f.el === 'water') S({ type: 'ripple', x: f.x, y: f.y, r1: f.r * 1.5, life: 0.7 });
        for (let k = 0; k < (LOWFX ? 4 : 10); k++) P({ x: f.x + vr(-f.r, f.r) * 0.4, y: f.y + vr(-f.r, f.r) * 0.3, z: 12, vx: vr(-80, 80), vy: vr(-50, 50), vz: vr(40, 140), g: -30, drag: 2, life: vr(0.25, 0.5), size: f.r * vr(0.2, 0.35), color: '#ffb040', kind: 'flame' });
        burst(f.x, f.y, f.el, 26, 300, { kind: 'ember' }); S({ type: 'ring', x: f.x, y: f.y, r0: 10, r1: f.r * 1.15, el: f.el, life: 0.35, w: 10 }); S({ type: 'flash', x: f.x, y: f.y, r: f.r * 1.6, el: f.el, life: 0.22 }); for (let k = 0; k < 6; k++) P({ x: f.x + vr(-20, 20), y: f.y + vr(-14, 14), z: 10, vz: vr(20, 60), vx: vr(-40, 40), vy: vr(-20, 20), g: -15, drag: 1, life: vr(0.9, 1.6), size: vr(14, 26), color: 'rgba(60,45,55,0.45)', kind: 'smoke', add: false }); break;
      case 'cone': S(Object.assign({ life: 0.28 }, f)); for (let k = 0; k < 14; k++) { const a = f.ang + vr(-f.half, f.half), v = vr(300, 620); P({ x: f.x, y: f.y + 14, z: 18, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: f.range / v * 0.9, size: f.el === 'frost' ? vr(2, 4) : vr(1.5, 3), color: f.el === 'frost' ? '#e6fbff' : '#dffff3', kind: f.el === 'frost' ? 'flake' : 'streak', drag: 0.5 }); } break;
      case 'zap': S(Object.assign({ life: f.el === 'shadow' ? 0.26 : 0.18, seed: Math.random() * 1000 }, f)); burst(f.x1, f.y1 + 14, f.el === 'shadow' ? 'shadow' : 'bolt', 6, 140); break;
      // 2.0 — luz y sombra
      case 'sunray': S(Object.assign({ life: f.flat ? 0.2 : 0.3 }, f)); for (const [ax, ay, bx, by] of f.segs) for (let k = 0; k < (LOWFX ? 4 : 9); k++) { const q = Math.random(); P({ x: lerp(ax, bx, q), y: lerp(ay, by, q), z: 16, vx: vr(-40, 40), vy: vr(-30, 30), vz: vr(10, 70), g: -20, life: vr(0.3, 0.7), size: vr(1.2, 2.4), color: f.hue != null ? `hsl(${Math.round(f.hue * 290)},100%,75%)` : Math.random() < 0.5 ? '#ffffff' : '#ffe48a', kind: 'ember' }); } break;
      case 'flashRing': S({ type: 'ring', x: f.x, y: f.y, r0: 12, r1: f.r, el: f.el, life: 0.4, w: 8 }); S({ type: 'flash', x: f.x, y: f.y, r: f.r * 1.5, el: f.el, life: 0.3 }); S({ type: 'star4', x: f.x, y: f.y - 30, r: f.r * 0.7, life: 0.35 }); burst(f.x, f.y, f.el, 16, 220, { kind: 'ember' }); break;
      case 'dazzle': S({ type: 'star4', x: f.x, y: f.y, r: 34, life: 0.3 }); break;
      case 'nova': S({ type: 'nova', x: f.x, y: f.y, r: f.r, life: 0.5, seed: Math.random() * 6 }); S({ type: 'flash', x: f.x, y: f.y, r: f.r * 2, el: 'light', life: 0.3 }); burst(f.x, f.y, 'light', 40, 420, { kind: 'ember' }); burst(f.x, f.y, 'fire', 20, 300, { kind: 'ember' }); break;
      case 'pillar': S({ type: 'pillar', x: f.x, y: f.y, r: f.r, life: 0.5 }); S({ type: 'ring', x: f.x, y: f.y, r0: 10, r1: f.r * 1.8, el: 'light', life: 0.4, w: 9 }); S({ type: 'flash', x: f.x, y: f.y, r: f.r * 2.4, el: 'light', life: 0.25 }); burst(f.x, f.y, 'light', 26, 300, { kind: 'ember' }); break;
      case 'blink': S({ type: 'blinkTrail', x: f.x, y: f.y, x1: f.x1, y1: f.y1, life: 0.38 }); S({ type: 'ring', x: f.x1, y: f.y1, r0: 60, r1: 8, el: 'shadow', life: 0.25, w: 6 }); for (const [bx, by] of [[f.x, f.y], [f.x1, f.y1]]) for (let k = 0; k < (LOWFX ? 5 : 10); k++) P({ x: bx + vr(-14, 14), y: by + vr(-8, 8), z: vr(6, 60), vx: vr(-50, 50), vy: vr(-30, 30), vz: vr(10, 50), g: -10, drag: 2, life: vr(0.4, 0.9), size: vr(8, 16), color: Math.random() < 0.25 ? 'rgba(196,67,166,0.4)' : 'rgba(24,8,34,0.6)', kind: 'smoke', add: false }); break;
      case 'drain': for (let k = 0; k < 5; k++) { const q = k / 5, lf = 0.45; P({ x: lerp(f.x0, f.x1, q) + vr(-30, 30), y: lerp(f.y0, f.y1, q) + vr(-16, 16), z: 14, vx: (f.x1 - f.x0) / lf * (1 - q) * 0.9, vy: (f.y1 - f.y0) / lf * (1 - q) * 0.9, vz: 30, g: 0, drag: 0.4, life: lf, size: vr(1.6, 2.8), color: Math.random() < 0.5 ? '#ff9ae0' : '#9affc8', kind: 'ember' }); } break;
      case 'pitOpen': S({ type: 'ring', x: f.x, y: f.y, r0: 10, r1: f.r * 1.5, el: 'shadow', life: 0.4, w: 10 }); burst(f.x, f.y, 'earth', 18, 240, { kind: 'chunk', g: 700 }); for (let k = 0; k < 8; k++) P({ x: f.x + vr(-f.r, f.r), y: f.y + vr(-f.r, f.r) * 0.5, z: 4, vz: vr(20, 60), g: -5, drag: 1, life: vr(0.7, 1.3), size: vr(12, 22), color: 'rgba(60,40,60,0.45)', kind: 'smoke', add: false }); break;
      case 'bolt': S(Object.assign({ type: 'bolt', life: f.small ? 0.25 : 0.4, seed: Math.random() * 1000 }, f)); S({ type: 'flash', x: f.x, y: f.y, r: f.r * 2.2, el: 'bolt', life: 0.2 }); burst(f.x, f.y, 'bolt', f.small ? 6 : 16, 220); break;
      case 'beamFlash': S(Object.assign({ life: 0.3 }, f)); for (let k = 0; k < 18; k++) { const t = Math.random(); P({ x: lerp(f.x0, f.x1, t), y: lerp(f.y0, f.y1, t) + 16, z: 16, vx: vr(-60, 60), vy: vr(-60, 60), vz: vr(40, 140), g: 300, life: vr(0.3, 0.6), size: vr(2, 4), color: Math.random() < 0.5 ? '#fff3c4' : '#ff8a3c', kind: 'ember' }); } break;
      case 'rise': S({ type: 'rise', x: f.x, y: f.y, el: f.el || 'earth', life: 0.35 }); burst(f.x, f.y, f.el || 'earth', 6, 90, { kind: 'chunk', g: 600 }); break;
      case 'rubble': burst(f.x, f.y, 'earth', f.soft ? 6 : 14, f.soft ? 80 : 200, { kind: 'chunk', g: 700 }); for (let k = 0; k < 4; k++) P({ x: f.x + vr(-14, 14), y: f.y + vr(-10, 10), z: 6, vz: vr(10, 40), g: -5, drag: 1, life: vr(0.6, 1.1), size: vr(10, 18), color: 'rgba(150,130,110,0.4)', kind: 'smoke', add: false }); break;
      case 'chips': burst(f.x, f.y, 'earth', 5, 120, { kind: 'chunk', g: 700 }); break;
      case 'sprout': S({ type: 'sprout', x: f.x, y: f.y, life: 0.6, delay: f.delay || 0 }); break;
      case 'snare': S({ type: 'snare', x: f.x, y: f.y, life: 0.7 }); burst(f.x, f.y, 'plant', 10, 120, { kind: 'leaf' }); break;
      case 'splat': S({ type: 'ring', x: f.x, y: f.y, r0: 10, r1: f.r, el: 'earth', life: 0.35, w: 14, mud: true }); for (let k = 0; k < 16; k++) { const a = Math.random() * TAU, v = vr(100, 300); P({ x: f.x, y: f.y, z: 10, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, vz: vr(80, 200), g: 700, life: vr(0.4, 0.8), size: vr(3, 6), color: f.el === 'shadow' ? '#1c0826' : '#6b4a2a', kind: 'blob', add: false }); } break;
      case 'clash': S({ type: 'flash', x: f.x, y: f.y, r: 50, el: 'wind', life: 0.15 }); burst(f.x, f.y, 'wind', 10, 220); break;
      case 'gust': for (let k = 0; k < 2; k++) P({ x: f.x + vr(-12, 12), y: f.y + vr(-10, 10), z: 16, vx: f.vx * 0.3 + vr(-30, 30), vy: f.vy * 0.3 + vr(-30, 30), life: vr(0.2, 0.35), size: vr(1.5, 2.5), color: '#e6fff6', kind: 'streak', drag: 3 }); break;
      case 'rootTrail': P({ x: f.x + vr(-8, 8), y: f.y + vr(-6, 6), z: 0, vz: vr(40, 90), g: 400, life: vr(0.25, 0.5), size: vr(2, 4), color: '#7a5a34', kind: 'chunk', add: false }); break;
    }
  }
  function onEvent(G, e) {
    switch (e.type) {
      case 'retarget': { const m = G.mages[e.who]; if (m) m._retT = 0.35; break; }
      case 'hurt': if (!e.dot) { burst(e.x, e.y - 22, e.el && ELEMENTS[e.el] ? e.el : 'wind', 7, 160); if (e.dmg >= 3 && !G.attract) S({ type: 'num', x: e.x + (Math.random() - 0.5) * 24, y: e.y - 70, v: Math.round(e.dmg), el: e.el && ELEMENTS[e.el] ? e.el : 'wind', big: e.dmg >= 20, life: 0.85 }); } else if (Math.random() < 0.08) burst(e.x, e.y - 20, e.el === 'lava' || e.el === 'fire' ? 'fire' : e.el && ELEMENTS[e.el] ? e.el : 'wind', 1, 60, { kind: 'ember' }); break;
      case 'down': burst(e.x, e.y - 20, 'bolt', 30, 320); S({ type: 'ring', x: e.x, y: e.y, r0: 10, r1: 160, el: 'bolt', life: 0.5, w: 6 }); break;
      case 'absorb': { const E = EC(e.el); for (let k = 0; k < 16; k++) P({ x: e.x + vr(-20, 20), y: e.y + vr(-14, 14), z: vr(10, 40), vz: vr(60, 140), g: -40, life: vr(0.4, 0.8), size: vr(2, 4), color: E.c0, kind: 'dot' }); S({ type: 'ring', x: e.x, y: e.y, r0: 50, r1: 8, el: e.el, life: 0.35, w: 4 }); break; }
      case 'dash': for (let k = 0; k < 8; k++) P({ x: e.x + vr(-10, 10), y: e.y + vr(-4, 4), z: 2, vz: vr(10, 40), g: 60, vx: vr(-40, 40), vy: vr(-20, 20), life: vr(0.3, 0.5), size: vr(5, 9), color: 'rgba(200,190,230,0.35)', kind: 'smoke', add: false }); break;
      case 'freeze': burst(e.x, e.y - 20, 'water', 14, 140, { kind: 'flake', extra: { color: '#eafcff' } }); break;
      case 'shatter': burst(e.x, e.y - 20, 'water', 22, 260, { kind: 'shard', extra: { color: '#d8f6ff' } }); break;
      case 'granStart': { const els = e.els || ['fire', 'fire']; for (let k = 0; k < 40; k++) { const a = Math.random() * TAU, d = vr(90, 190), E = EC(els[k % 2]); P({ x: e.x + Math.cos(a) * d, y: e.y + Math.sin(a) * d * 0.55, z: vr(10, 90), vx: -Math.cos(a) * d * 2.6, vy: -Math.sin(a) * d * 1.4, vz: vr(20, 80), g: 0, drag: 0.4, life: vr(0.32, 0.42), size: vr(2, 4), color: k % 3 ? E.c0 : '#ffe9a0', kind: 'ember' }); } S({ type: 'ring', x: e.x, y: e.y, r0: 200, r1: 20, el: els[0], life: 0.38, w: 6, gold: true }); break; }
      case 'gran': { const els = e.els || ['fire', 'fire'];
        S({ type: 'granBurst', x: e.x, y: e.y, life: 0.7, els, r: GRAN_WAVE + 60 });
        S({ type: 'ring', x: e.x, y: e.y, r0: 24, r1: GRAN_WAVE + 40, el: els[0], life: 0.42, w: 16, gold: true }); S({ type: 'ring', x: e.x, y: e.y, r0: 10, r1: GRAN_WAVE + 120, el: els[1], life: 0.6, w: 7, delay: 0.06 });
        S({ type: 'flash', x: e.x, y: e.y, r: 360, el: 'fire', life: 0.4, gold: true });
        for (let k = 0; k < 46; k++) { const a = Math.random() * TAU, v = vr(220, 620), E = EC(els[k % 2]); P({ x: e.x, y: e.y, z: vr(10, 40), vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: vr(40, 220), g: 260, drag: 2, life: vr(0.5, 0.9), size: vr(2.5, 5), color: k % 3 ? E.c0 : '#ffe9a0', kind: 'ember' }); }
        break; }
      case 'embReady': S({ type: 'ring', x: e.x, y: e.y, r0: 10, r1: 90, el: 'fire', life: 0.5, w: 5, gold: true }); break;
      case 'reflect': S({ type: 'ring', x: e.x, y: e.y, r0: 6, r1: 40, el: 'wind', life: 0.2, w: 4 }); break;
      case 'electrify': S({ type: 'flash', x: e.x, y: e.y, r: 120, el: 'bolt', life: 0.25 }); break;
      case 'cool': burst(e.x, e.y, 'earth', 4, 60, { kind: 'chunk', g: 500 }); break;
      case 'bushGone': for (let k = 0; k < 10; k++) P({ x: e.x + vr(-12, 12), y: e.y + vr(-8, 8), z: 30, vz: vr(20, 60), g: -10, drag: 1, life: vr(1, 2), size: vr(10, 20), color: 'rgba(40,35,40,0.5)', kind: 'smoke', add: false }); break;
      case 'bounce': burst(e.x, e.y, 'bolt', 6, 160); break;
      case 'counter': S({ type: 'ring', x: e.x, y: e.y, r0: 8, r1: 120, el: 'fire', life: 0.4, w: 8, gold: true }); S({ type: 'flash', x: e.x, y: e.y, r: 160, el: 'fire', life: 0.25, gold: true }); burst(e.x, e.y, 'fire', 20, 300, { extra: { color: '#ffe9a0' } }); break;
      case 'ram': S({ type: 'ring', x: e.x, y: e.y, r0: 6, r1: 70, el: 'wind', life: 0.25, w: 6 }); burst(e.x, e.y - 20, 'wind', 10, 220); break;
      case 'rune': S({ type: 'ring', x: e.x, y: e.y, r0: 10, r1: 110, el: 'fire', life: 0.45, w: 6, gold: true }); burst(e.x, e.y - 20, 'fire', 18, 200, { extra: { color: '#fff3c4' } }); break;
    }
  }
  // ambiente: luciérnagas y brasas del fuego del suelo
  function ambient(G, dt) {
    const T = G.T; if (!T) return;
    if (T.burning && Math.random() < dt * Math.min(40, T.burning * 1.4)) {
      for (let tries = 0; tries < 8; tries++) { const i = (Math.random() * T.n) | 0; if (T.fire[i] > 0) { P({ x: Terrain.cx(T, i) + vr(-16, 16), y: Terrain.cy(T, i) + vr(-12, 12), z: vr(6, 20), vz: vr(60, 140), vx: vr(-15, 15), g: -40, drag: 0.6, life: vr(0.6, 1.3), size: vr(1.5, 3), color: Math.random() < 0.5 ? '#ffd27a' : '#ff7a2a', kind: 'ember' }); break; } }
    }
  }
  function update(G, dt) {
    for (const m of G.mages) if (m._retT > 0) m._retT -= dt;
    for (const f of G.fx) onFx(G, f); G.fx.length = 0;
    ambient(G, dt);
    let w = 0;
    for (const p of parts) {
      p.t += dt; if (p.t >= p.life) continue;
      const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; p.x += p.vx * dt; p.y += p.vy * dt; p.vz -= p.g * dt; p.z += p.vz * dt; p.rot += p.vr * dt;
      if (p.z < 0) { p.z = 0; p.vz *= -0.3; p.vx *= 0.6; p.vy *= 0.6; }
      parts[w++] = p;
    }
    parts.length = w;
    let s = 0; for (const o of shapes) { o.t += dt; if (o.t < o.life + (o.delay || 0)) shapes[s++] = o; } shapes.length = s;
  }
  function clear() { parts.length = 0; shapes.length = 0; }
  return { parts, shapes, update, onEvent, clear, burst, P, S };
})();
