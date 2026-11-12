'use strict';
/* =========================================================================
   SORTILEGIO — duelo de magos para dos (un solo archivo, sin internet)
   Núcleo: utilidades, azar con semilla, guardado y entrada.
   Todo el estado de la partida vive en Game.G; los controles entran por
   Input.read(i); la simulación avanza en pasos fijos de 1/120 s.
   ========================================================================= */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const hypot = Math.hypot;
const dist2 = (ax, ay, bx, by) => (ax - bx) * (ax - bx) + (ay - by) * (ay - by);

function makeRng(seed) {
  let a = seed >>> 0;
  const r = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.range = (lo, hi) => lo + (hi - lo) * r();
  r.pick = list => list[Math.floor(r() * list.length)];
  r.int = n => Math.floor(r() * n);
  return r;
}
// azar solo para lo visual (no toca la partida)
const vrand = Math.random;
const vr = (a, b) => a + (b - a) * Math.random();
function hash2(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function noise2(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, sx = smooth(fx), sy = smooth(fy);
  return lerp(lerp(hash2(ix, iy), hash2(ix + 1, iy), sx), lerp(hash2(ix, iy + 1), hash2(ix + 1, iy + 1), sx), sy);
}
function fbm2(x, y, oct = 4) { let v = 0, a = 0.5, n = 0; for (let k = 0; k < oct; k++) { v += a * noise2(x, y); n += a; x = x * 2.03 + 17.1; y = y * 2.03 + 9.7; a *= 0.5; } return v / n; }

/* ---------- guardado (prefijo propio: no choca con los otros juegos) ---------- */
const GAME_META = { id: 'sortilegio', name: 'Sortilegio', version: '2.3', storagePrefix: 'srt_', players: 2 };
const Store = {
  get(k, def) { try { const v = localStorage.getItem(GAME_META.storagePrefix + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
  set(k, v) { try { localStorage.setItem(GAME_META.storagePrefix + k, JSON.stringify(v)); } catch (e) { /* sin guardado */ } },
};

/* ---------- letras ---------- */
const FONT_T = '"Macondo", "Georgia", serif';
const FONT_B = '"Nunito", "Trebuchet MS", system-ui, sans-serif';
const fontT = size => `400 ${size}px ${FONT_T}`;
const fontB = (size, w = 800) => `${w} ${size}px ${FONT_B}`;
const PLAYER_COLORS = [
  { main: '#ffc94a', dark: '#b07a10', name: 'J1' },
  { main: '#62e0ff', dark: '#1a7fa0', name: 'J2' },
];
let LOWFX = false, MIDFX = false; // ligera / media (o ligera): menos efectos caros

/* =========================================================================
   ENTRADA — Input.read(i) → { mx, my, h: [mano izq., mano der.], dash }
   J1: W A S D · F (o C) mano izquierda · G (o V) mano derecha · H (o Espacio) esquivar
   J2: flechas (u 8 4 5 6 numérico) · K (o 1 num.) izq. · L (o 2 num.) der. · Ñ (o 3 num.) esquivar
   Mando: palanca · X / LB mano izq. · B / RB mano der. · A / LT esquivar
   ========================================================================= */
const DEFAULT_KEYS = [
  { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], h0: ['KeyF', 'KeyC'], h1: ['KeyG', 'KeyV'], dash: ['KeyH', 'Space'] },
  { up: ['ArrowUp', 'Numpad8'], down: ['ArrowDown', 'Numpad5'], left: ['ArrowLeft', 'Numpad4'], right: ['ArrowRight', 'Numpad6'], h0: ['KeyK', 'Numpad1'], h1: ['KeyL', 'Numpad2'], dash: ['Semicolon', 'Numpad3'] },
];
const KEY_ACTIONS = ['up', 'down', 'left', 'right', 'h0', 'h1', 'dash'];
const KEY_LABELS = { up: 'Arriba', down: 'Abajo', left: 'Izquierda', right: 'Derecha', h0: 'Mano izquierda', h1: 'Mano derecha', dash: 'Esquivar' };
let KEYMAP = (() => {
  const saved = Store.get('keys', null), def = JSON.parse(JSON.stringify(DEFAULT_KEYS));
  if (!Array.isArray(saved) || saved.length !== 2) return def;
  return saved.map((m, i) => { const o = {}; KEY_ACTIONS.forEach(k => { o[k] = m && Array.isArray(m[k]) && m[k].length ? m[k] : def[i][k]; }); return o; });
})();
const KEY_NAMES = { Space: 'Espacio', Semicolon: 'Ñ', ShiftLeft: 'Shift izq.', ShiftRight: 'Shift der.', ControlLeft: 'Ctrl izq.', ControlRight: 'Ctrl der.', AltLeft: 'Alt', AltRight: 'Alt Gr', Enter: 'Enter', NumpadEnter: 'Enter num.', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Comma: ',', Period: '.', Slash: '-', Minus: "'", Quote: '{', BracketLeft: '´', BracketRight: '+', Backslash: '}', IntlBackslash: '<', Tab: 'Tab', Backspace: 'Borrar' };
function keyName(code) {
  if (!code) return '—';
  if (KEY_NAMES[code]) return KEY_NAMES[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return code.slice(6).replace('Add', '+').replace('Subtract', '−').replace('Multiply', '×').replace('Divide', '÷').replace('Decimal', ',') + ' (num.)';
  return code;
}
const Input = (() => {
  const down = new Set();
  let hook = null; // para reasignar teclas
  const touch = [null, null]; // lo llena Touch (mx, my, h0, h1, dash)
  const virt = [null, null];  // entradas fabricadas (pruebas, máquina)
  addEventListener('keydown', e => {
    if (hook) { e.preventDefault(); hook(e.code); return; }
    const k = e.code;
    for (const m of KEYMAP) for (const a of KEY_ACTIONS) if (m[a].includes(k)) { e.preventDefault(); break; }
    down.add(k);
  });
  addEventListener('keyup', e => down.delete(e.code));
  addEventListener('blur', () => down.clear());
  const any = list => list.some(c => down.has(c));
  function pad(i) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const list = []; for (const p of pads) if (p && p.connected) list.push(p);
    const p = list[i]; if (!p) return null;
    const b = n => !!(p.buttons[n] && p.buttons[n].pressed);
    let mx = p.axes[0] || 0, my = p.axes[1] || 0;
    if (hypot(mx, my) < 0.22) { mx = 0; my = 0; }
    if (b(14)) mx = -1; if (b(15)) mx = 1; if (b(12)) my = -1; if (b(13)) my = 1;
    return { mx, my, h: [b(2) || b(4), b(1) || b(5)], dash: b(0) || b(6) };
  }
  function read(i) {
    if (virt[i]) return virt[i];
    const m = KEYMAP[i];
    let mx = (any(m.right) ? 1 : 0) - (any(m.left) ? 1 : 0), my = (any(m.down) ? 1 : 0) - (any(m.up) ? 1 : 0);
    let h0 = any(m.h0), h1 = any(m.h1), dash = any(m.dash);
    const g = pad(i);
    if (g) { if (g.mx || g.my) { mx = g.mx; my = g.my; } h0 = h0 || g.h[0]; h1 = h1 || g.h[1]; dash = dash || g.dash; }
    const t = touch[i];
    if (t) { if (t.mx || t.my) { mx = t.mx; my = t.my; } h0 = h0 || t.h0; h1 = h1 || t.h1; dash = dash || t.dash; }
    const l = hypot(mx, my); if (l > 1) { mx /= l; my /= l; }
    return { mx, my, h: [h0, h1], dash };
  }
  const anyKey = () => down.size > 0;
  return { read, touch, virt, down, anyKey, set hook(f) { hook = f; }, get hook() { return hook; } };
})();
// los menús y el táctil las cambian (márgenes que tapan los pulgares, ¿hay pantalla táctil?)
let getInsets = () => ({ top: 0, bottom: 0, topPad: 0 });
let isTouch = () => false;
