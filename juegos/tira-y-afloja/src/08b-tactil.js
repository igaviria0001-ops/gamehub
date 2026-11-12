/* =========================================================================
   CONTROLES TÁCTILES — para celular o tableta (en horizontal).
   · Contra la máquina: a la izquierda moverse, a la derecha saltar,
     pegarse, tirar y aflojar.
   · Dos jugadores en un mismo celular: cada uno tiene su mitad de la
     pantalla, con el movimiento hacia el borde y las acciones hacia el
     centro (el jugador 2 en espejo).
   A prueba de dedazos:
   · Una sola capa recibe todos los dedos y decide a qué grupo va cada uno
     por cercanía: un toque cerca de un botón (aunque caiga afuera) cuenta;
     uno lejos de todos (en el centro, arriba) no hace nada.
   · Cada dedo se queda con su grupo y su jugador: deslizar el pulgar de ◀
     a ▶ cambia la dirección, pero nunca se vuelve ● ni pasa al otro jugador.
   · Entre dos botones gana el que más se usa (▲ antes que ●) y, si el dedo
     ya tenía uno, lo conserva hasta que entre claramente en otro.
   · Un toque cortísimo dura lo justo para que el juego siempre lo vea, y
     dos toques seguidos siempre cuentan como dos.
   · Si el celular corta los toques (gestos de tres dedos, avisos), se
     sueltan todos los botones y se avisa una vez.
   Se activa solo en pantallas táctiles (o con ?touch=1 en la dirección).
   ========================================================================= */
const Touch = (() => {
  const KEYS = ['left', 'right', 'jump', 'stick', 'pull', 'release'];
  const state = [emptyInput(), emptyInput()]; // lo que ve el juego
  const enabled = (() => { try { return matchMedia('(hover: none) and (pointer: coarse)').matches || /[?&]touch=1/.test(location.search); } catch (e) { return false; } })();
  let root = null, layout = null, hintEl = null, big = !!Store.get('tbig', false);

  const ICON = { left: '◀', right: '▶', jump: '▲', stick: '●', pull: '+', release: '−' };
  const LABEL = { left: 'izquierda', right: 'derecha', jump: 'saltar', stick: 'pegarse', pull: 'tirar', release: 'aflojar' };
  const WEIGHT = { jump: 1.2, stick: 0.85 };  // entre dos botones gana el más usado; ● cuesta un poco más (pegarse sin querer es lo peor)
  const MIN_MS = { jump: 150 }, MIN_DEF = 90;  // duración mínima de un toque (el salto, con altura decente)
  const MIN_STEPS = 2;                         // y que el juego lo vea al menos dos pasos
  const REACH = 0.9;  // un toque nuevo cuenta si cae a menos de esto (en anchos de botón) del grupo
  const LEAVE = 1.6;  // un dedo que se aleja más que esto del grupo suelta el botón (hasta que vuelva)
  const PAIRS = [['left', 'right'], ['pull', 'release']]; // opuestos: si van los dos, gana el último
  const SWITCH = 0.35; // para cambiar de botón sin levantar el dedo hay que entrar claramente en el otro

  let groups = [];
  const btnOf = [{}, {}];
  const ptrs = new Map(); // dedo -> { g, k }
  const K = [0, 1].map(() => Object.fromEntries(KEYS.map(k => [k, { down: false, t0: 0, seen: 0, pend: false, gap: false, vis: false }])));

  function group(cls, p, keys, color) {
    const el = document.createElement('div');
    el.className = 'tcl ' + cls; el.style.setProperty('--pc', color);
    const btns = keys.map(k => {
      const b = document.createElement('div');
      b.className = `tbtn k-${k}`; b.dataset.k = k; b.setAttribute('role', 'button');
      b.textContent = ICON[k]; b.setAttribute('aria-label', `${LABEL[k]} (jugador ${p + 1})`);
      el.append(b); btnOf[p][k] = b;
      return b;
    });
    groups.push({ p, keys, el, btns, c: [], box: null, bw: 1 });
    return el;
  }
  function measure() {
    for (const g of groups) {
      let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity, w = 0;
      g.c = g.btns.map(el => {
        const q = el.getBoundingClientRect();
        l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom); w = Math.max(w, q.width);
        return { x: q.left + q.width / 2, y: q.top + q.height / 2, r: q.width / 2 || 1 };
      });
      g.box = w ? { l, t, r, b } : null; g.bw = w || 1;
    }
  }
  const boxDist = (g, x, y) => Math.hypot(Math.max(g.box.l - x, 0, x - g.box.r), Math.max(g.box.t - y, 0, y - g.box.b)) / g.bw;
  // ¿a qué grupo va un dedo nuevo? al más cercano (así un dedazo hacia el centro sigue siendo de su dueño)
  function groupAt(x, y) {
    let best = null, bd = Infinity;
    for (const g of groups) {
      if (!g.box) continue;
      const d = boxDist(g, x, y);
      if (d < bd) { bd = d; best = g; }
    }
    return bd <= REACH ? best : null;
  }
  // ¿qué botón del grupo? el más cercano (con peso); si el dedo ya tenía uno, lo conserva hasta entrar claramente en otro
  function keyIn(g, x, y, prev) {
    if (!g.box) return null;
    const far = boxDist(g, x, y);
    if (far > LEAVE || (!prev && far > REACH)) return null;
    let best = null, bd = Infinity, dp = Infinity;
    g.c.forEach((c, i) => {
      const k = g.keys[i], d = Math.hypot(x - c.x, y - c.y) / (c.r * (WEIGHT[k] || 1));
      if (d < bd) { bd = d; best = k; }
      if (k === prev) dp = d;
    });
    if (prev && best !== prev && bd + SWITCH > dp) return prev;
    return best;
  }

  /* ---- botones apretados -> lo que ve el juego ---- */
  function sync() {
    const now = performance.now(), held = [new Set(), new Set()];
    for (const P of ptrs.values()) if (P.k) held[P.g.p].add(P.k);
    for (let p = 0; p < 2; p++) for (const k of KEYS) {
      const s = K[p][k], h = held[p].has(k);
      if (h && !s.down) {
        if (s.pend && s.seen > 0) s.gap = true; // otro toque mientras el anterior seguía: un instante suelto para que cuente como dos
        s.down = true; s.t0 = now; s.seen = 0; s.pend = true;
      } else if (!h && s.down) s.down = false;
    }
    apply(false);
  }
  function apply(stepping) {
    const now = performance.now();
    for (let p = 0; p < 2; p++) for (const k of KEYS) {
      const s = K[p][k];
      let on;
      if (s.gap) { on = false; if (stepping) s.gap = false; }
      else if (s.down) on = true;
      else if (s.pend && (s.seen < MIN_STEPS || now - s.t0 < (MIN_MS[k] || MIN_DEF))) on = true;
      else { on = false; s.pend = false; }
      if (on && stepping) s.seen++;
      state[p][k] = on;
    }
    // ◀ y ▶ (o + y −) a la vez se anulan: gana el último que se apretó
    for (let p = 0; p < 2; p++) for (const [a, b] of PAIRS) if (state[p][a] && state[p][b]) state[p][K[p][a].t0 >= K[p][b].t0 ? b : a] = false;
    for (let p = 0; p < 2; p++) for (const k of KEYS) {
      const s = K[p][k], on = state[p][k];
      if (on !== s.vis) { s.vis = on; const b = btnOf[p][k]; if (b) b.classList.toggle('on', on); }
    }
  }
  // el juego llama esto una vez por paso de física
  function tick() { if (root && !root.hidden) apply(true); }
  function releaseAll() {
    ptrs.clear();
    for (const P of K) for (const k of KEYS) Object.assign(P[k], { down: false, pend: false, gap: false, seen: 0 });
    apply(false);
  }

  /* ---- dedos ---- */
  function onDown(e) {
    if (e.target && e.target.closest && e.target.closest('.tpause, .tagain')) return; // esos tienen su propio toque
    e.preventDefault();
    Sound.init();
    measure();
    const g = groupAt(e.clientX, e.clientY);
    if (!g) return; // lejos de todos los botones: no hace nada
    try { root.setPointerCapture(e.pointerId); } catch (er) { /* nada */ }
    ptrs.set(e.pointerId, { g, k: keyIn(g, e.clientX, e.clientY, null) });
    sync();
  }
  function onMove(e) {
    const P = ptrs.get(e.pointerId); if (!P) return;
    const k = keyIn(P.g, e.clientX, e.clientY, P.k);
    if (k !== P.k) {
      // al deslizar de un botón a otro, el anterior se suelta ya (si el juego alcanzó a verlo), sin quedar los dos apretados
      if (P.k && K[P.g.p][P.k].seen > 0) K[P.g.p][P.k].pend = false;
      P.k = k; sync();
    }
  }
  function onUp(e) { if (ptrs.delete(e.pointerId)) sync(); }
  // el celular cortó los toques (gesto de tres dedos, una notificación...): se suelta todo y se avisa una vez
  let cancels = [], hinted = false;
  function onCancel(e) {
    const now = performance.now();
    cancels = cancels.filter(t => now - t < 150); cancels.push(now);
    const many = ptrs.size >= 3 || cancels.length >= 2;
    onUp(e);
    if (many && !hinted) {
      hinted = true;
      hint('El celular cortó los toques. Si pasa seguido, desactiva en sus ajustes los gestos de tres dedos.');
    }
  }
  let hintT = null;
  function hint(msg) {
    if (!hintEl) return;
    hintEl.textContent = msg; hintEl.hidden = false; hintEl.style.opacity = '1';
    clearTimeout(hintT);
    hintT = setTimeout(() => { hintEl.style.opacity = '0'; hintT = setTimeout(() => { hintEl.hidden = true; }, 450); }, 6500);
  }
  if (enabled) {
    // si ya no queda ningún dedo en la pantalla, nada puede seguir apretado (por si se perdió un «soltar»)
    const sweep = e => { if (ptrs.size && e.touches && e.touches.length === 0) { ptrs.clear(); sync(); } };
    addEventListener('touchend', sweep, { capture: true, passive: true });
    addEventListener('touchcancel', sweep, { capture: true, passive: true });
    document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });
    addEventListener('blur', releaseAll);
    addEventListener('resize', () => { if (root && !root.hidden) measure(); });
  }

  function build(mode) {
    if (root) root.remove();
    groups = []; ptrs.clear();
    root = document.createElement('div'); root.id = 'touch'; root.className = 'touch ' + mode;
    root.classList.toggle('big', big);
    const c0 = Game.G.players[0].col.base, c1 = Game.G.players[1].col.base;
    if (mode === 'single') {
      root.append(group('move left', 0, ['left', 'right'], c0));
      root.append(group('act right', 0, ['release', 'pull', 'stick', 'jump'], c0));
    } else {
      // el jugador 2 en espejo: ▲ y + hacia el centro, ● hacia su propio movimiento (igual que el jugador 1)
      root.append(group('move left', 0, ['left', 'right'], c0));
      root.append(group('act left2', 0, ['release', 'pull', 'stick', 'jump'], c0));
      root.append(group('act right2', 1, ['pull', 'release', 'jump', 'stick'], c1));
      root.append(group('move right', 1, ['left', 'right'], c1));
    }
    const pause = document.createElement('button');
    pause.className = 'tpause'; pause.type = 'button'; pause.textContent = 'II'; pause.setAttribute('aria-label', 'Pausa');
    pause.addEventListener('click', () => UI.pause());
    root.append(pause);
    const again = document.createElement('button');
    again.className = 'tagain'; again.type = 'button'; again.textContent = '⟲'; again.setAttribute('aria-label', 'Repetir la situación');
    again.addEventListener('pointerdown', e => { e.preventDefault(); Sound.init(); if (typeof Entreno !== 'undefined') Entreno.again(); });
    root.append(again);
    hintEl = document.createElement('div'); hintEl.className = 'thint'; hintEl.hidden = true; hintEl.setAttribute('role', 'status');
    root.append(hintEl);
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onCancel);
    root.addEventListener('lostpointercapture', onUp);
    root.addEventListener('contextmenu', e => e.preventDefault());
    root.classList.toggle('train', extra);
    pauseAt = null;
    document.getElementById('app').append(root);
    layout = mode;
    for (const P of K) for (const k of KEYS) P[k].vis = false;
  }
  function show(mode) {
    if (!enabled) return;
    if (!root || layout !== mode) build(mode);
    releaseAll();
    root.hidden = false;
    measure();
  }
  function hide() {
    if (root) root.hidden = true;
    releaseAll();
  }
  // tamaño de los botones (opción solo táctil)
  function setBig(on) { big = !!on; Store.set('tbig', big); if (root) { root.classList.toggle('big', big); measure(); } }
  // cuánto tapan los botones (px CSS desde cada borde de abajo): el HUD se acomoda entre ellos
  function insets() {
    if (!enabled || !root || root.hidden) return null;
    const vw = innerWidth || 1; let l = 0, r = 0, top = innerHeight || 1;
    root.querySelectorAll('.tcl').forEach(c => {
      const b = c.getBoundingClientRect(); if (!b.width) return;
      if (b.left + b.width / 2 < vw / 2) l = Math.max(l, b.right); else r = Math.max(r, vw - b.left);
      top = Math.min(top, b.top);
    });
    return { l, r, top, vw, vh: innerHeight || 1 };
  }
  // botón para repetir la situación (entrenamiento)
  let extra = false;
  function setTrain(on) { extra = !!on; if (root) root.classList.toggle('train', extra); }
  // dónde va el botón de pausa: debajo del letrero del centro (pt en unidades del HUD) o en la esquina (pt < 0)
  let pauseAt = null;
  function placePause(pt) {
    if (!root || pt === pauseAt) return;
    pauseAt = pt;
    root.classList.toggle('corner', pt < 0);
    if (pt >= 0) root.style.setProperty('--pt', String(pt));
  }
  return { state, show, hide, tick, insets, setTrain, placePause, setBig, get big() { return big; }, get enabled() { return enabled; } };
})();
