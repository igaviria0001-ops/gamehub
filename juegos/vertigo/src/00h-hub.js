/* =========================================================================
   ENLACE CON GAMEHUB — solo hace algo si el juego corre dentro de GameHub
   (en un marco). Suelto, el juego queda igual.
   · El juego avisa «ready» cuando ya puede recibir órdenes.
   · GameHub manda { cmd: 'play', ev } para jugar una prueba de un torneo:
     ev = { id, game, mode, map, rounds, chars: 'pick'|'random'|'keep', title, p1, p2, opts }.
     El juego la arma SIN tocar lo que tiene guardado (ajustes, último modo…).
   · Al terminar la prueba, el juego avisa { event: 'result', id, winner } (0, 1 o −1 empate).
   · «exit» = volver a GameHub; «abort» = salió de la prueba sin terminarla.
   · Pantalla completa: el juego pide { event: 'fs', on } y GameHub la pone en toda la
     ventana; GameHub avisa { cmd: 'fs', on, fail, help } cada vez que cambia.
   ========================================================================= */
const Hub = (() => {
  const embedded = (() => { try { return window.parent && window.parent !== window; } catch (e) { return true; } })();
  let ev = null, playFn = null, reported = false, pending = null, fsOn = false;
  const fsSubs = [];
  function post(event, data) {
    if (!embedded) return;
    try { window.parent.postMessage(Object.assign({ hub: 'gamehub', source: GAME_META.id, version: GAME_META.version, event }, data || {}), '*'); } catch (e) { /* nada */ }
  }
  if (embedded) addEventListener('message', e => {
    const m = e.data;
    if (!m || m.hub !== 'gamehub' || !m.cmd || e.source !== window.parent) return;
    if (m.cmd === 'play' && m.ev) {
      ev = m.ev; reported = false;
      if (playFn) { try { playFn(ev); } catch (err) { post('error', { msg: String(err && err.message || err) }); } } else pending = ev;
    } else if (m.cmd === 'fs') {
      fsOn = !!m.on; fsSubs.forEach(f => { try { f(m); } catch (err) { /* nada */ } });
    }
  });
  if (embedded) document.documentElement.classList.add('in-hub');
  return {
    embedded,
    get ev() { return ev; },
    // el juego registra cómo arrancar una prueba; si la orden llegó antes, se cumple ya
    onPlay(f) { playFn = f; if (pending) { const p = pending; pending = null; try { f(p); } catch (err) { post('error', { msg: String(err && err.message || err) }); } } },
    ready() { post('ready'); },
    // resultado de la prueba (una sola vez por prueba)
    result(winner, info) { if (!ev || reported) return; reported = true; post('result', { id: ev.id, winner, info: info || {} }); },
    get reported() { return reported; },
    // volver a GameHub (desde la portada del juego o al terminar la prueba)
    exit() { post('exit', { id: ev ? ev.id : null, done: reported }); },
    // se salió de la prueba a medias (pausa → salir): GameHub la deja pendiente
    leave() { if (ev && !reported) post('abort', { id: ev.id }); ev = null; },
    // tras reportar, el juego vuelve a ser libre (una revancha ya no cuenta)
    release() { ev = null; },
    // pantalla completa de toda la ventana (la pone GameHub)
    get fsOn() { return fsOn; },
    fs(on) { post('fs', { on: !!on }); },
    onFs(f) { fsSubs.push(f); },
  };
})();
