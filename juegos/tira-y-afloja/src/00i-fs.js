/* =========================================================================
   PANTALLA COMPLETA — igual en los cuatro juegos (archivo compartido de GameHub).
   · Automática (se puede apagar en Opciones): se pone sola con el primer toque
     o tecla, y otra vez al empezar a jugar. En el celular, además, horizontal.
   · Manual: FS.toggle() desde el botón «Pantalla completa» de Opciones.
   · Dentro de GameHub la pone GameHub en toda la ventana: aquí solo se pide.
   ========================================================================= */
const FS = (() => {
  const d = document.documentElement, subs = [];
  const touch = (() => { try { return matchMedia('(hover: none) and (pointer: coarse)').matches; } catch (e) { return false; } })();
  const key = () => (GAME_META.storagePrefix || GAME_META.id + '_') + 'autoFs';
  let auto = null, tried = false, waiting = false;
  const getAuto = () => { if (auto === null) { try { const v = localStorage.getItem(key()); auto = v == null ? true : JSON.parse(v) !== false; } catch (e) { auto = true; } } return auto; };
  const own = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const can = !!(d.requestFullscreen || d.webkitRequestFullscreen);
  const isOn = () => own() || (Hub.embedded && Hub.fsOn);
  const emit = () => { const on = isOn(); subs.forEach(f => { try { f(on); } catch (e) { /* nada */ } }); };
  const lock = () => { if (!touch) return; try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* nada */ } };
  function ownEnter() {
    try {
      if (d.requestFullscreen) return d.requestFullscreen({ navigationUI: 'hide' }).then(() => { lock(); return true; }, () => false);
      if (d.webkitRequestFullscreen) { d.webkitRequestFullscreen(); return new Promise(r => setTimeout(() => r(own()), 300)); }
    } catch (e) { /* el navegador no deja */ }
    return Promise.resolve(false);
  }
  function ownExit() {
    try { if (document.exitFullscreen) return document.exitFullscreen().then(() => true, () => false); if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); return Promise.resolve(true); } } catch (e) { /* nada */ }
    return Promise.resolve(false);
  }
  // aviso corto propio (por si el navegador no deja)
  let tipEl = null, tipT = 0;
  function tip(msg) {
    if (!tipEl) { tipEl = document.createElement('div'); tipEl.setAttribute('role', 'status'); tipEl.style.cssText = 'position:fixed;left:50%;bottom:max(18px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483000;max-width:min(560px,90vw);padding:10px 18px;border-radius:999px;background:rgba(10,7,26,.95);color:#fff;font:700 14px/1.35 system-ui,sans-serif;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.5);pointer-events:none;transition:opacity .3s;opacity:0'; document.body.appendChild(tipEl); }
    tipEl.textContent = msg; tipEl.style.opacity = '1'; clearTimeout(tipT); tipT = setTimeout(() => { tipEl.style.opacity = '0'; }, 3800);
  }
  const help = () => /iP(hone|od)/.test(navigator.userAgent) ? 'En iPhone la pantalla completa se logra instalando GameHub: Compartir → «Agregar a inicio».' : 'El navegador no dejó poner pantalla completa aquí.';
  // dentro de GameHub: la respuesta de GameHub dice si se pudo; si no, se intenta en el marco del juego
  if (Hub.embedded) Hub.onFs(m => { emit(); if (waiting && m.fail != null) { waiting = false; if (m.fail) ownEnter().then(ok => { if (!ok) tip(m.help || help()); emit(); }); } });
  document.addEventListener('fullscreenchange', emit); document.addEventListener('webkitfullscreenchange', emit);
  function enter() {
    if (isOn()) return;
    if (Hub.embedded) { waiting = true; Hub.fs(true); return; }
    if (!can) { tip(help()); return; }
    ownEnter().then(ok => { if (!ok) tip(help()); });
  }
  function exit() { if (own()) { ownExit(); return; } if (Hub.embedded && Hub.fsOn) Hub.fs(false); }
  // automática: suelto, con el primer toque o tecla y al empezar a jugar (dentro de GameHub la pone GameHub al abrir el juego)
  function autoEnter() { if (Hub.embedded || !getAuto() || isOn() || !can) return; ownEnter(); }
  if (!Hub.embedded) {
    const first = e => {
      if (tried) return;
      if (e.type === 'keydown' && (e.key === 'Escape' || e.key === 'F11' || e.metaKey || e.ctrlKey || e.altKey)) return;
      tried = true; removeEventListener('pointerup', first, true); removeEventListener('keydown', first, true); autoEnter();
    };
    addEventListener('pointerup', first, true); addEventListener('keydown', first, true);
  }
  return {
    get can() { return can || Hub.embedded; },
    get on() { return isOn(); },
    get auto() { return getAuto(); },
    set auto(v) { auto = !!v; try { localStorage.setItem(key(), JSON.stringify(auto)); } catch (e) { /* sin guardado */ } if (auto) enter(); },
    enter, exit, toggle() { if (isOn()) exit(); else enter(); }, autoEnter,
    label() { return isOn() ? 'Salir' : 'Activar'; },
    onChange(f) { subs.push(f); },
  };
})();
