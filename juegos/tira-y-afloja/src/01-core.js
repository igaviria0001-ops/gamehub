'use strict';
/* =========================================================================
   TIRA Y AFLOJA — núcleo: constantes, utilidades, entrada
   ========================================================================= */

const WORLD_W = 1920, WORLD_H = 1080;
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const easeOutBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const easeOutCubic = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeInCubic = t => t * t * t;
const rnd = (a, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const rndi = (a, b) => Math.floor(rnd(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const sign = v => (v < 0 ? -1 : v > 0 ? 1 : 0);
const approach = (v, target, step) => (v < target ? Math.min(v + step, target) : Math.max(v - step, target));

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- colores ---------- */
function hexToRgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }
function mixHex(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`;
}

const PALETTE = {
  ink: '#3a2216',
  inkSoft: '#5b3a28',
  cream: '#fff6e6',
  fresa: { id: 'fresa', name: 'Fresa', base: '#ff5c9d', light: '#ffb8d5', dark: '#e03a80', deep: '#9c1f57', glow: '#ffd6e7', accent: '#ffe27a', hat: '#4cb648', hatDark: '#2d7d2e', pattern: 'seeds', hatType: 'crown' },
  menta: { id: 'menta', name: 'Menta', base: '#27d3b2', light: '#a6f6e3', dark: '#12a98c', deep: '#0b6957', glow: '#d2fff3', accent: '#e9fffa', hat: '#56c25f', hatDark: '#2f8a3a', pattern: 'stripes', hatType: 'leaves' },
};
/* sabores: cada persona elige el suyo en Opciones (no pueden ser iguales) */
const FLAVORS = {
  fresa: PALETTE.fresa,
  menta: PALETTE.menta,
  uva: { id: 'uva', name: 'Uva', base: '#9b5de5', light: '#dcc8ff', dark: '#7b3fcb', deep: '#4a2387', glow: '#efe3ff', accent: '#efe4ff', hat: '#6bbf59', hatDark: '#3d7f34', pattern: 'grapes', hatType: 'stem' },
  limon: { id: 'limon', name: 'Limón', base: '#c4df2f', light: '#f0ffa8', dark: '#9cbb18', deep: '#5c700c', glow: '#f8ffd6', accent: '#fbffe2', hat: '#3fa34d', hatDark: '#24702f', pattern: 'zest', hatType: 'leaf' },
  mango: { id: 'mango', name: 'Mango', base: '#ffa21f', light: '#ffd79e', dark: '#e57b0b', deep: '#9a4a05', glow: '#ffe9c9', accent: '#ff5e57', hat: '#4cb648', hatDark: '#2d7d2e', pattern: 'blush', hatType: 'stem' },
  mora: { id: 'mora', name: 'Mora', base: '#4a6fe6', light: '#b3c7ff', dark: '#2f53c4', deep: '#172f7c', glow: '#dbe6ff', accent: '#d8e4ff', hat: '#56c25f', hatDark: '#2f8a3a', pattern: 'bumps', hatType: 'crown' },
};
  // premios de la campaña (se desbloquean al vencer a un jefe)
FLAVORS.algodon = { id: 'algodon', name: 'Algodón', base: '#ff9ed8', light: '#ffe0f4', dark: '#e070b8', deep: '#8a2f6e', glow: '#fff0fa', accent: '#9fd8ff', hat: '#f2e6d0', hatDark: '#a98c62', pattern: 'fluff', hatType: 'stick', camp: 'arte' };
FLAVORS.cola = { id: 'cola', name: 'Cola', base: '#8a4a26', light: '#d9a074', dark: '#6a3416', deep: '#3a1a08', glow: '#ffe6cc', accent: '#ffffff', hat: '#e5533d', hatDark: '#9a2a1c', pattern: 'fizz', hatType: 'cap', camp: 'biblioteca' };
FLAVORS.oro = { id: 'oro', name: 'Oro', base: '#f2c230', light: '#fff0a8', dark: '#cf9a12', deep: '#7a5408', glow: '#fff8d6', accent: '#ffffff', hat: '#ffffff', hatDark: '#b08a2a', pattern: 'shine', hatType: 'star', camp: 'torre' };
const FLAVOR_ORDER = ['fresa', 'menta', 'uva', 'limon', 'mango', 'mora', 'algodon', 'cola', 'oro'];
/* ambientes: tinte del escenario (los personajes y el hilo no se oscurecen, para que se lean bien) */
const THEMES = {
  dia: { name: 'Día', tint: null },
  tarde: { name: 'Tarde', tint: '#ffcba6', glow: 0.12, sky: 'rgba(255,140,70,0.16)' },
  noche: { name: 'Noche', tint: '#5d6aa8', glow: 0.32, sky: 'rgba(30,30,90,0.18)' },
};
const THEME_ORDER = ['dia', 'tarde', 'noche'];

/* ---------- fuentes ---------- */
const FONT = '"Fredoka", "Baloo 2", "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
function font(size, weight = 700) { return `${weight} ${size}px ${FONT}`; }

/* =========================================================================
   ENTRADA — teclado compartido + mandos
   P1: A/D moverse · W saltar · S pegarse · E tirar · Q aflojar
   P2: J/L moverse · I saltar · K pegarse · O tirar · U aflojar  (o el teclado numérico 4/6 8 5 9 7)
   ========================================================================= */
const KEYMAP = [
  { left: ['KeyA'], right: ['KeyD'], jump: ['KeyW'], stick: ['KeyS'], pull: ['KeyE'], release: ['KeyQ'] },
  { left: ['KeyJ', 'Numpad4'], right: ['KeyL', 'Numpad6'], jump: ['KeyI', 'Numpad8'], stick: ['KeyK', 'Numpad5'], pull: ['KeyO', 'Numpad9'], release: ['KeyU', 'Numpad7'] },
];
const GAME_KEYS = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab']);
KEYMAP.forEach(m => Object.values(m).forEach(list => list.forEach(k => GAME_KEYS.add(k))));

const Input = (() => {
  const down = new Set();
  const listeners = [];
  const pads = [null, null];
  const padPrev = [{}, {}];
  const padNow = [{}, {}];

  addEventListener('keydown', e => {
    if (GAME_KEYS.has(e.code) && !(e.target && /INPUT|TEXTAREA/.test(e.target.tagName))) e.preventDefault();
    down.add(e.code);
    if (!e.repeat) listeners.forEach(fn => fn(e.code, e));
  }, { passive: false });
  addEventListener('keyup', e => down.delete(e.code));
  addEventListener('blur', () => down.clear());
  document.addEventListener('visibilitychange', () => { if (document.hidden) down.clear(); });

  function anyDown(list) { for (const k of list) if (down.has(k)) return true; return false; }

  function pollPads() {
    let list = [];
    try { list = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : []; } catch (e) { list = []; }
    for (let i = 0; i < 2; i++) {
      const gp = list[i] || null;
      pads[i] = gp;
      padPrev[i] = padNow[i];
      const s = {};
      if (gp) {
        const b = j => !!(gp.buttons[j] && (gp.buttons[j].pressed || gp.buttons[j].value > 0.35));
        const ax = gp.axes[0] || 0;
        s.left = ax < -0.35 || b(14);
        s.right = ax > 0.35 || b(15);
        s.up = (gp.axes[1] || 0) < -0.5 || b(12);
        s.down = (gp.axes[1] || 0) > 0.5 || b(13);
        s.jump = b(0);
        s.stick = b(1) || b(2);
        s.pull = b(7) || b(5);
        s.release = b(6) || b(4);
        s.start = b(9);
        s.select = b(8);
        s.confirm = b(0);
        s.back = b(1);
      }
      padNow[i] = s;
      // eventos de "presionado" para menús
      for (const k of ['up', 'down', 'left', 'right', 'confirm', 'back', 'start', 'select']) {
        if (s[k] && !padPrev[i][k]) listeners.forEach(fn => fn('Pad' + i + '_' + k, null));
      }
    }
  }

  function player(i) {
    const m = KEYMAP[i], p = padNow[i] || {};
    const t = typeof Touch !== 'undefined' ? Touch.state[i] : {};
    return {
      left: anyDown(m.left) || !!p.left || !!t.left,
      right: anyDown(m.right) || !!p.right || !!t.right,
      jump: anyDown(m.jump) || !!p.jump || !!t.jump,
      stick: anyDown(m.stick) || !!p.stick || !!t.stick,
      pull: anyDown(m.pull) || !!p.pull || !!t.pull,
      release: anyDown(m.release) || !!p.release || !!t.release,
    };
  }

  return {
    down, player, pollPads,
    isDown: code => down.has(code),
    onPress: fn => listeners.push(fn),
    padCount: () => pads.filter(Boolean).length,
  };
})();

function emptyInput() { return { left: false, right: false, jump: false, stick: false, pull: false, release: false }; }

/* ---------- identidad del juego (para cuando haga parte de una colección) ----------
   Todo lo guardado usa el prefijo «tya_». Si el juego corre dentro de otra página
   (un lanzador con varios juegos), avisa de lo importante con postMessage. */
const GAME_META = { id: 'tira-y-afloja', name: 'Tira y Afloja', version: '0.28', storagePrefix: 'tya_', players: 2 };
const Platform = {
  embedded: (() => { try { return window.parent && window.parent !== window; } catch (e) { return true; } })(),
  emit(event, data = {}) {
    if (!this.embedded) return;
    try { window.parent.postMessage({ source: GAME_META.id, version: GAME_META.version, event, data }, '*'); } catch (e) { /* nada */ }
  },
};

/* ---------- almacenamiento seguro ---------- */
const Store = {
  get(k, d) { try { const v = localStorage.getItem('tya_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('tya_' + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
};
// en celulares y tabletas arrancar con la calidad ligera (se puede cambiar en Opciones)
try { if (matchMedia('(hover: none) and (pointer: coarse)').matches && Store.get('quality', null) === null) Store.set('quality', 'ligera'); } catch (e) { /* sin matchMedia */ }
