/* =========================================================================
   VÉRTIGO — la Copa Esmeralda (un solo archivo, sin internet)
   Núcleo: utilidades, azar con semilla, guardado y entrada.
   La simulación avanza en pasos fijos de 1/120 s; los controles entran por
   Input.read(i) → { steer, up, down, drift, item, turbo }.
   ========================================================================= */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const angWrap = a => { a %= TAU; if (a > Math.PI) a -= TAU; if (a < -Math.PI) a += TAU; return a; };
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
function makeRng(seed) {
  let a = seed >>> 0;
  const r = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.range = (lo, hi) => lo + (hi - lo) * r();
  r.int = n => Math.floor(r() * n);
  return r;
}
function hash2(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function noise2(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, sx = smooth(fx), sy = smooth(fy);
  return lerp(lerp(hash2(ix, iy), hash2(ix + 1, iy), sx), lerp(hash2(ix, iy + 1), hash2(ix + 1, iy + 1), sx), sy);
}
function fbm2(x, y, oct = 4) { let v = 0, a = 0.5, n = 0; for (let k = 0; k < oct; k++) { v += a * noise2(x, y); n += a; x = x * 2.03 + 17.1; y = y * 2.03 + 9.7; a *= 0.5; } return v / n; }

/* ---------- guardado (prefijo propio: no choca con los otros juegos) ---------- */
const GAME_META = { id: 'vertigo', name: 'VÉRTIGO', version: '1.1.2', storagePrefix: 'vtg_' };
const Store = {
  get(k, def) { try { const v = localStorage.getItem(GAME_META.storagePrefix + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
  set(k, v) { try { localStorage.setItem(GAME_META.storagePrefix + k, JSON.stringify(v)); } catch (e) { /* sin guardado */ } },
};
const FONT_T = '"Russo One", system-ui, sans-serif';
const FONT_B = '"Nunito", "Trebuchet MS", system-ui, sans-serif';
const fontT = size => `400 ${size}px ${FONT_T}`;
const fontB = (size, w = 800) => `${w} ${size}px ${FONT_B}`;
const PLAYER_COLORS = [{ main: '#ffc94a', dark: '#b07a10' }, { main: '#62e0ff', dark: '#1a7fa0' }];
const isTouch = () => matchMedia('(pointer: coarse)').matches;
// calidad gráfica: 2 Ultra (por defecto en computador), 1 Alta (por defecto en celular), 0 Ligera
const GQ = { lv: (() => { const v = Store.get('gq', null); return v == null ? (isTouch() ? 1 : 2) : clamp(v | 0, 0, 2); })(), names: ['Ligera', 'Alta', 'Ultra'] };

/* =========================================================================
   ENTRADA
   J1: A D girar · W S subir/bajar (aire) y S frenar · F derrape · G objeto · H turbo
   J2: flechas · K o Num1 derrape · L o Num2 objeto · Ñ o Num3 turbo
   ========================================================================= */
const DEFAULT_KEYS = [
  { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], drift: ['KeyF', 'KeyC'], item: ['KeyG', 'KeyV'], turbo: ['KeyH', 'Space'] },
  { up: ['ArrowUp', 'Numpad8'], down: ['ArrowDown', 'Numpad5'], left: ['ArrowLeft', 'Numpad4'], right: ['ArrowRight', 'Numpad6'], drift: ['KeyK', 'Numpad1'], item: ['KeyL', 'Numpad2'], turbo: ['Semicolon', 'Numpad3', 'Quote'] },
];
// teclas que se pueden cambiar en Opciones (lo guardado se completa con las de fábrica si falta algo)
const KEY_ACTIONS = ['left', 'right', 'up', 'down', 'drift', 'item', 'turbo'];
const KEY_LABELS = { left: 'Girar a la izquierda', right: 'Girar a la derecha', up: 'Arriba (con el ala: picada)', down: 'Abajo (frenar; con el ala: subir)', drift: 'Derrape · piruetas', item: 'Objeto · especial', turbo: 'Turbo' };
const KEYMAP = (() => {
  const saved = Store.get('keys', null), def = JSON.parse(JSON.stringify(DEFAULT_KEYS));
  if (!Array.isArray(saved) || saved.length !== 2) return def;
  return saved.map((m, i) => { const o = {}; KEY_ACTIONS.forEach(k => { o[k] = m && Array.isArray(m[k]) ? m[k].filter(c => typeof c === 'string' && c) : def[i][k]; }); return o; });
})();
const KEY_NAMES = { Space: 'Espacio', Semicolon: 'Ñ', Quote: '{', ShiftLeft: 'Shift izq.', ShiftRight: 'Shift der.', ControlLeft: 'Ctrl izq.', ControlRight: 'Ctrl der.', AltLeft: 'Alt', AltRight: 'Alt Gr', Enter: 'Enter', NumpadEnter: 'Enter num.', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Comma: ',', Period: '.', Slash: '-', Minus: "'", BracketLeft: '´', BracketRight: '+', Backslash: '}', IntlBackslash: '<', Tab: 'Tab', Backspace: 'Borrar' };
function keyLabel(code) {
  if (!code) return '—';
  if (KEY_NAMES[code]) return KEY_NAMES[code];
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return code.slice(6).replace('Add', '+').replace('Subtract', '−').replace('Multiply', '×').replace('Divide', '÷').replace('Decimal', ',') + ' num.';
  return code;
}
const Input = (() => {
  const down = new Set();
  const touch = [null, null];
  const taps = new Set(), touchTaps = [{}, {}];
  addEventListener('keydown', e => { if (Input.hook) return; down.add(e.code); taps.add(e.code); if (e.code.startsWith('Arrow') || e.code === 'Space' || KEYMAP.some(m => KEY_ACTIONS.some(k => m[k].includes(e.code)))) e.preventDefault(); });
  addEventListener('keyup', e => down.delete(e.code));
  addEventListener('blur', () => down.clear());
  const any = list => list.some(c => down.has(c) || taps.has(c));
  function read(i) {
    const t = touch[i], Ks = Input.solo && i === 0 ? KEYMAP : [KEYMAP[i]], A = k => Ks.some(K => any(K[k]));
    let steer = (A('right') ? 1 : 0) - (A('left') ? 1 : 0), up = A('up'), dn = A('down'), drift = A('drift'), item = A('item'), turbo = A('turbo');
    // táctil: arriba/abajo solo si el dedo va más vertical que de lado (no frena sin querer al girar)
    if (t) { const tt = touchTaps[i]; if (Math.abs(t.sx) > Math.abs(steer)) steer = t.sx; up = up || (t.sy < -0.5 && -t.sy > Math.abs(t.sx) * 0.9); dn = dn || (t.sy > 0.55 && t.sy > Math.abs(t.sx) * 0.9); drift = drift || t.drift || !!tt.drift; item = item || t.item || !!tt.item; turbo = turbo || t.turbo || !!tt.turbo; }
    return { steer, up, down: dn, drift, item, turbo };
  }
  // toques muy cortos (bajar y soltar entre dos pasos) también cuentan una vez
  const endStep = () => { taps.clear(); touchTaps[0] = {}; touchTaps[1] = {}; };
  const tap = (i, k) => { if (touchTaps[i]) touchTaps[i][k] = true; };
  return { read, touch, down, hook: null, solo: false, endStep, tap };
})();
