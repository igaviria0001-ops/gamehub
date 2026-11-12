'use strict';
/* =========================================================================
   VENTOLERA — duelo de pájaros en el viento (2 jugadores, un solo archivo)
   Núcleo: utilidades, azar con semilla, guardado y entrada.
   Orden pensado para un online futuro: todo el estado de la partida vive en
   Game.G, los controles entran por Input.read(i), la física avanza en pasos
   fijos y el azar de la partida sale de una semilla (G.rng).
   ========================================================================= */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const angDiff = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const hypot = Math.hypot;

// azar con semilla (mulberry32): la partida lo usa para todo lo que afecta el juego
function makeRng(seed) {
  let a = seed >>> 0;
  const r = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.range = (lo, hi) => lo + (hi - lo) * r();
  r.pick = list => list[Math.floor(r() * list.length)];
  return r;
}
// ruido suave 1D (para montañas, nubes, viento): determinista, sin estado
function hash1(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function noise1(x) { const i = Math.floor(x), f = x - i; return lerp(hash1(i), hash1(i + 1), smooth(f)); }
function fbm1(x, oct = 4) { let v = 0, a = 0.5, f = 1, n = 0; for (let k = 0; k < oct; k++) { v += a * noise1(x * f + k * 17.3); n += a; a *= 0.5; f *= 2.03; } return v / n; }

/* ---------- guardado (prefijo propio: no choca con Tira y Afloja) ---------- */
const GAME_META = { id: 'ventolera', name: 'Ventolera', version: '3.5', storagePrefix: 'vto_', players: 2 };
const Store = {
  get(k, def) { try { const v = localStorage.getItem(GAME_META.storagePrefix + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
  set(k, v) { try { localStorage.setItem(GAME_META.storagePrefix + k, JSON.stringify(v)); } catch (e) { /* sin guardado */ } },
};

/* ---------- letra ---------- */
const FONT = '"Comfortaa", "Varela Round", "Trebuchet MS", system-ui, sans-serif';
const font = (size, w = 700) => `${w} ${size}px ${FONT}`;

/* =========================================================================
   ENTRADA — una sola puerta: Input.read(i) → { dx, dy, fire, boost, missile, roll, rdx, rdy }
   (dx, dy) = hacia dónde quiere apuntar el piloto (0,0 = sigue derecho).
   Teclado (se puede reasignar en Opciones → Teclas):
   J1: W A S D apunta · Espacio dispara · Shift izq. turbo · E misil · C tonel
   J2: I J K L (o flechas) apunta · Ñ dispara · Alt Gr (o O) turbo · U (o Enter) misil · H tonel
   Tonel = esquive rápido hacia donde apuntas: su tecla, o doble toque en una dirección (se puede apagar).
   Mando: palanca apunta · RT o X dispara · A o LT turbo · B misil · LB/RB tonel
   ========================================================================= */
const DEFAULT_KEYS = [
  { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], fire: ['Space', 'KeyF'], boost: ['ShiftLeft', 'KeyQ'], missile: ['KeyE', 'KeyR'], roll: ['KeyC', 'KeyV'] },
  { up: ['KeyI', 'ArrowUp', 'Numpad8'], down: ['KeyK', 'ArrowDown', 'Numpad5', 'Numpad2'], left: ['KeyJ', 'ArrowLeft', 'Numpad4'], right: ['KeyL', 'ArrowRight', 'Numpad6'], fire: ['Semicolon', 'Numpad0', 'ControlRight'], boost: ['AltRight', 'KeyO', 'NumpadEnter'], missile: ['KeyU', 'Enter', 'NumpadAdd'], roll: ['KeyH', 'KeyN', 'NumpadDecimal'] },
];
const KEY_ACTIONS = ['up', 'down', 'left', 'right', 'fire', 'boost', 'missile', 'roll'];
const KEY_LABELS = { up: 'Arriba', down: 'Abajo', left: 'Izquierda', right: 'Derecha', fire: 'Disparar', boost: 'Turbo', missile: 'Misil', roll: 'Tonel' };
const ACTIONS = ['fire', 'boost', 'missile'];
let KEYMAP = (() => {
  const saved = Store.get('keys', null), def = JSON.parse(JSON.stringify(DEFAULT_KEYS));
  if (!Array.isArray(saved) || saved.length !== 2) return def;
  // completa acciones nuevas con las de fábrica (sin repetir teclas ya usadas)
  const used = new Set(); saved.forEach(m => m && KEY_ACTIONS.forEach(k => Array.isArray(m[k]) && m[k].forEach(c => used.add(c))));
  return saved.map((m, i) => { const o = {}; KEY_ACTIONS.forEach(k => { o[k] = m && Array.isArray(m[k]) && m[k].length ? m[k] : def[i][k].filter(c => !used.has(c)); }); return o; });
})();
const GAME_KEYS = new Set();
function refreshGameKeys() { GAME_KEYS.clear(); ['Space', 'Tab', 'AltRight', 'AltLeft'].forEach(k => GAME_KEYS.add(k)); KEYMAP.forEach(m => Object.values(m).forEach(l => l.forEach(k => GAME_KEYS.add(k)))); }
refreshGameKeys();
const KEY_NAMES = { Space: 'Espacio', ShiftLeft: 'Shift izq.', ShiftRight: 'Shift der.', ControlLeft: 'Ctrl izq.', ControlRight: 'Ctrl der.', AltLeft: 'Alt', AltRight: 'Alt Gr', Enter: 'Enter', NumpadEnter: 'Enter (num.)', Semicolon: 'Ñ', Quote: '´', BracketLeft: '`', BracketRight: '+', Backslash: 'ç', Comma: ',', Period: '.', Slash: '-', Minus: "'", Equal: '¡', Backquote: 'º', Tab: 'Tab', CapsLock: 'Bloq Mayús', Backspace: 'Borrar', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', NumpadAdd: '+ (num.)', NumpadSubtract: '- (num.)', NumpadMultiply: '* (num.)', NumpadDivide: '/ (num.)', NumpadDecimal: '. (num.)', IntlBackslash: '<' };
function keyName(code) {
  if (!code) return '—';
  if (KEY_NAMES[code]) return KEY_NAMES[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return code.slice(6) + ' (num.)';
  return code;
}
// resumen corto de las teclas de un jugador (para la ayuda en pantalla)
function keyHint(i) {
  const m = KEYMAP[i], d = [m.up[0], m.left[0], m.down[0], m.right[0]].map(keyName);
  const dirs = d.every(k => k.length === 1) ? d.join('') : d.join(' ');
  return `${dirs} apunta · ${keyName(m.fire[0])} dispara · ${keyName(m.boost[0])} turbo · ${keyName(m.missile[0])} misil · ${keyName(m.roll[0])} tonel`;
}
let LOWFX = false; // calidad ligera: menos detalles caros de dibujar
const emptyInput = () => ({ dx: 0, dy: 0, fire: false, boost: false, missile: false, roll: false, rdx: 0, rdy: 0 });

const Input = (() => {
  const down = new Set(), listeners = [];
  const padNow = [{}, {}], padPrev = [{}, {}];
  const lastTap = [{}, {}], pendRoll = [null, null];
  let capture = null; // reasignar teclas: la próxima tecla va aquí
  let dtap = Store.get('dtap', true);
  const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  addEventListener('keydown', e => {
    if (capture) { e.preventDefault(); const fn = capture; capture = null; fn(e.code); return; }
    if (GAME_KEYS.has(e.code) && !(e.target && /INPUT|TEXTAREA/.test(e.target.tagName))) e.preventDefault();
    down.add(e.code);
    if (!e.repeat) {
      // doble toque en una dirección = tonel
      const now = performance.now();
      for (let i = 0; i < 2; i++) {
        if (KEYMAP[i].roll.includes(e.code)) pendRoll[i] = { dx: null, dy: null, t: now };
      }
      if (dtap) for (let i = 0; i < 2; i++) for (const d of ['up', 'down', 'left', 'right']) {
        if (!KEYMAP[i][d].includes(e.code)) continue;
        const L = lastTap[i][d];
        if (L && L.code === e.code && now - L.t < 270) { pendRoll[i] = { dx: DIRV[d][0], dy: DIRV[d][1], t: now }; lastTap[i][d] = null; }
        else lastTap[i][d] = { code: e.code, t: now };
      }
      listeners.forEach(fn => fn(e.code, e));
    }
  }, { passive: false });
  addEventListener('keyup', e => { down.delete(e.code); if (e.code === 'AltRight' || e.code === 'AltLeft') e.preventDefault(); });
  addEventListener('blur', () => down.clear());
  document.addEventListener('visibilitychange', () => { if (document.hidden) down.clear(); });
  const any = l => l.some(k => down.has(k));
  function pollPads() {
    let list = [];
    try { list = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : []; } catch (e) { list = []; }
    for (let i = 0; i < 2; i++) {
      const gp = list[i], s = {};
      padPrev[i] = padNow[i];
      if (gp) {
        const b = j => !!(gp.buttons[j] && (gp.buttons[j].pressed || gp.buttons[j].value > 0.35));
        let ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
        if (b(12)) ay = -1; if (b(13)) ay = 1; if (b(14)) ax = -1; if (b(15)) ax = 1;
        const m = Math.hypot(ax, ay);
        if (m > 0.32) { s.dx = ax / m; s.dy = ay / m; } else { s.dx = 0; s.dy = 0; }
        s.fire = b(2) || b(7); s.boost = b(0) || b(6); s.missile = b(1); s.rollBtn = b(4) || b(5);
        s.confirm = b(0); s.back = b(1); s.start = b(9);
        s.up = ay < -0.5; s.down = ay > 0.5; s.left = ax < -0.5; s.right = ax > 0.5;
        if (s.rollBtn && !padPrev[i].rollBtn) pendRoll[i] = { dx: s.dx, dy: s.dy, t: performance.now() };
      }
      padNow[i] = s;
      for (const k of ['up', 'down', 'left', 'right', 'confirm', 'back', 'start']) if (s[k] && !padPrev[i][k]) listeners.forEach(fn => fn(`Pad${i}_${k}`, null));
    }
  }
  function read(i) {
    const m = KEYMAP[i], p = padNow[i] || {}, t = (typeof Touch !== 'undefined' && Touch.state[i]) || {};
    let dx = (any(m.right) ? 1 : 0) - (any(m.left) ? 1 : 0), dy = (any(m.down) ? 1 : 0) - (any(m.up) ? 1 : 0);
    if (!dx && !dy && (p.dx || p.dy)) { dx = p.dx; dy = p.dy; }
    if (!dx && !dy && (t.dx || t.dy)) { dx = t.dx; dy = t.dy; }
    const l = Math.hypot(dx, dy); if (l > 0) { dx /= l; dy /= l; }
    const o = { dx, dy, roll: false, rdx: 0, rdy: 0 };
    for (const k of ACTIONS) o[k] = any(m[k]) || !!p[k] || !!t[k];
    let R = pendRoll[i];
    if (!R && t.roll) { R = { dx: t.rdx, dy: t.rdy, t: performance.now() }; t.roll = false; }
    if (R) { pendRoll[i] = null; if (performance.now() - R.t < 400) { o.roll = true; o.rdx = R.dx == null ? dx : R.dx; o.rdy = R.dy == null ? dy : R.dy; } }
    return o;
  }
  function setKey(i, action, code) {
    // la tecla nueva pasa a ser la principal; las alternativas se conservan
    const old = KEYMAP[i][action].slice(1);
    for (const mm of KEYMAP) for (const k of KEY_ACTIONS) mm[k] = mm[k].filter(c => c !== code);
    KEYMAP[i][action] = [code, ...old.filter(c => c !== code)];
    Store.set('keys', KEYMAP); refreshGameKeys();
  }
  function resetKeys() { KEYMAP = JSON.parse(JSON.stringify(DEFAULT_KEYS)); Store.set('keys', null); refreshGameKeys(); }
  return { read, pollPads, onPress: fn => listeners.push(fn), isDown: c => down.has(c), setKey, resetKeys, capture(fn) { capture = fn; }, get dtap() { return dtap; }, setDtap(v) { dtap = !!v; Store.set('dtap', dtap); }, get keymap() { return KEYMAP; }, get pads() { return padNow; } };
})();
