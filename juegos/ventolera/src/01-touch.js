/* =========================================================================
   CONTROLES TÁCTILES — por jugador: un joystick al borde (donde pongas el
   dedo aparece; arrastra hacia donde quieres apuntar; dos toques rápidos
   y arrastre = tonel) y, junto a él, el fuego (el más grande), el turbo
   y el misil.
   · Contra la máquina: joystick al borde izquierdo, armas al borde derecho.
   · Dos en un celular: cada uno en su mitad (joystick al borde, armas hacia el centro).
   A prueba de dedazos (lo aprendido en Tira y Afloja 0.27):
   · una sola capa recibe todos los dedos y cada toque va al grupo más cercano;
     uno lejos de todo (centro, arriba) no hace nada;
   · cada dedo se queda en su grupo: deslizar de ▲ a ▼ cambia, nunca pasa al otro;
   · toques cortísimos duran lo justo para que el juego los vea, y dos seguidos
     cuentan como dos;
   · si el celular corta los toques, se suelta todo y se avisa una vez.
   ========================================================================= */
const Touch = (() => {
  const KEYS = ['fire', 'boost', 'missile'];
  const stickOf = [null, null], lastStickUp = [0, 0];
  const state = [emptyInput(), emptyInput()];
  const enabled = (() => { try { return matchMedia('(hover: none) and (pointer: coarse)').matches || /[?&]touch=1/.test(location.search); } catch (e) { return false; } })();
  let root = null, layout = null, hintEl = null;
  const MIN_MS = 90, MIN_STEPS = 2, REACH = 0.9, LEAVE = 1.6, SWITCH = 0.3;
  const ICON = {
    up: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 9 L33 28 H7 Z" fill="currentColor"/></svg>',
    down: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 31 L33 12 H7 Z" fill="currentColor"/></svg>',
    fire: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="13" fill="none" stroke="currentColor" stroke-width="3.5"/><path d="M24 4v10M24 34v10M4 24h10M34 24h10" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><circle cx="24" cy="24" r="3.5" fill="currentColor"/></svg>',
    boost: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M26 4C28 14 38 18 38 30a14 14 0 0 1-28 0c0-7 4-11 7-14 0 6 3 9 6 9-2-8 1-15 4-21Z" fill="currentColor"/></svg>',
    missile: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 27h22l10-3-10-3H8l-4-5v16z" fill="currentColor"/><path d="M14 21l-4-7M14 27l-4 7" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
  };
  const LABEL = { fire: 'disparar', boost: 'turbo', missile: 'misil' };
  let groups = [];
  const btnOf = [{}, {}];
  const ptrs = new Map();
  const K = [0, 1].map(() => Object.fromEntries(KEYS.map(k => [k, { down: false, t0: 0, seen: 0, pend: false, gap: false, vis: false }])));

  function group(cls, p, keys) {
    const el = document.createElement('div');
    el.className = 'tgrp ' + cls + ' p' + p;
    const btns = keys.map(k => {
      const b = document.createElement('div');
      b.className = 'tbtn k-' + k; b.dataset.k = k; b.setAttribute('role', 'button');
      b.setAttribute('aria-label', `${LABEL[k]} (jugador ${p + 1})`); b.innerHTML = ICON[k];
      el.append(b); btnOf[p][k] = b;
      return b;
    });
    groups.push({ p, keys, el, btns, c: [], box: null, bw: 1 });
    return el;
  }
  // joystick flotante: el área entera responde; la base aparece donde tocas
  function stick(cls, p) {
    const el = document.createElement('div');
    el.className = 'tgrp tstick ' + cls + ' p' + p;
    const pad = document.createElement('div'); pad.className = 'tpad'; pad.setAttribute('role', 'slider'); pad.setAttribute('aria-label', `apuntar (jugador ${p + 1})`);
    const base = document.createElement('div'); base.className = 'tbase';
    const knob = document.createElement('div'); knob.className = 'tknob';
    base.append(knob); pad.append(base); el.append(pad);
    const g = { p, keys: [], el, btns: [pad], c: [], box: null, bw: 1, stick: true, base, knob, pad };
    groups.push(g); stickOf[p] = g;
    return el;
  }
  function stickSet(g, P, x, y) {
    const R = g.bw * 0.36;
    let vx = (x - P.ox) / R, vy = (y - P.oy) / R;
    const m = Math.hypot(vx, vy);
    if (m > 1) { vx /= m; vy /= m; }
    const s = state[g.p];
    if (m > 0.2) { s.dx = vx / Math.max(m, 1e-6) * Math.min(1, m); s.dy = vy / Math.max(m, 1e-6) * Math.min(1, m); const l = Math.hypot(s.dx, s.dy) || 1; s.dx /= l; s.dy /= l; }
    else { s.dx = 0; s.dy = 0; }
    if (P.rollArm && m > 0.55) { if (performance.now() - P.rollArm < 350) { s.roll = true; s.rdx = vx / (m || 1); s.rdy = vy / (m || 1); } P.rollArm = 0; }
    g.knob.style.transform = `translate(${vx * R}px, ${vy * R}px)`;
    g.el.classList.toggle('on', m > 0.2);
  }
  function stickStart(g, P, x, y) {
    const pr = g.pad.getBoundingClientRect();
    const R = g.bw * 0.36;
    P.ox = clamp(x, pr.left + R * 0.6, pr.right - R * 0.6); P.oy = clamp(y, pr.top + R * 0.6, pr.bottom - R * 0.6);
    g.base.style.left = (P.ox - pr.left) + 'px'; g.base.style.top = (P.oy - pr.top) + 'px';
    g.el.classList.add('held');
    if (performance.now() - lastStickUp[g.p] < 300) P.rollArm = performance.now();
    stickSet(g, P, x, y);
  }
  function stickEnd(g) {
    const s = state[g.p]; s.dx = 0; s.dy = 0;
    lastStickUp[g.p] = performance.now();
    g.knob.style.transform = ''; g.base.style.left = ''; g.base.style.top = '';
    g.el.classList.remove('held', 'on');
  }
  let insCache = null;
  function measure() {
    insCache = null;
    for (const g of groups) {
      let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity, w = 0;
      g.c = g.btns.map(el => {
        const q = el.getBoundingClientRect();
        l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom); w = Math.max(w, q.width);
        return { x: q.left + q.width / 2, y: q.top + q.height / 2, rx: q.width / 2 || 1, ry: q.height / 2 || 1 };
      });
      g.box = w ? { l, t, r, b } : null; g.bw = w || 1;
    }
  }
  const boxDist = (g, x, y) => Math.hypot(Math.max(g.box.l - x, 0, x - g.box.r), Math.max(g.box.t - y, 0, y - g.box.b)) / g.bw;
  // el grupo más cercano en píxeles (la palanca es grande: si se midiera relativo a su tamaño, les robaría toques a los botones de al lado)
  function groupAt(x, y) {
    let best = null, bd = Infinity;
    for (const g of groups) {
      if (!g.box) continue;
      const d = boxDist(g, x, y) * g.bw, reach = REACH * (g.stick ? g.bw / 2.05 : g.bw);
      if (d <= reach && d < bd) { bd = d; best = g; }
    }
    return best;
  }
  function keyIn(g, x, y, prev) {
    if (!g.box) return null;
    const far = boxDist(g, x, y);
    if (far > LEAVE || (!prev && far > REACH)) return null;
    let best = null, bd = Infinity, dp = Infinity;
    g.c.forEach((c, i) => {
      const d = Math.hypot((x - c.x) / c.rx, (y - c.y) / c.ry);
      if (d < bd) { bd = d; best = g.keys[i]; }
      if (g.keys[i] === prev) dp = d;
    });
    if (prev && best !== prev && bd + SWITCH > dp) return prev;
    return best;
  }
  function sync() {
    const now = performance.now(), held = [new Set(), new Set()];
    for (const P of ptrs.values()) if (P.k && !P.g.stick) held[P.g.p].add(P.k);
    for (let p = 0; p < 2; p++) for (const k of KEYS) {
      const s = K[p][k], h = held[p].has(k);
      if (h && !s.down) { if (s.pend && s.seen > 0) s.gap = true; s.down = true; s.t0 = now; s.seen = 0; s.pend = true; }
      else if (!h && s.down) s.down = false;
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
      else if (s.pend && (s.seen < MIN_STEPS || now - s.t0 < MIN_MS)) on = true;
      else { on = false; s.pend = false; }
      if (on && stepping) s.seen++;
      state[p][k] = on;
    }
    for (let p = 0; p < 2; p++) for (const k of KEYS) {
      const s = K[p][k], on = state[p][k];
      if (on !== s.vis) { s.vis = on; const b = btnOf[p][k]; if (b) b.classList.toggle('on', on); }
    }
  }
  function tick() { if (root && !root.hidden) apply(true); }
  function releaseAll() { ptrs.clear(); for (const P of K) for (const k of KEYS) Object.assign(P[k], { down: false, pend: false, gap: false, seen: 0 }); for (const g of stickOf) if (g) stickEnd(g); state.forEach(s => { s.dx = 0; s.dy = 0; s.roll = false; }); apply(false); }
  function onDown(e) {
    if (e.target && e.target.closest && e.target.closest('.tpause')) return;
    e.preventDefault(); Sound.init(); measure();
    const g = groupAt(e.clientX, e.clientY); if (!g) return;
    try { root.setPointerCapture(e.pointerId); } catch (er) { /* nada */ }
    if (g.stick) {
      // un solo dedo por joystick (el nuevo manda)
      for (const [id, Q] of ptrs) if (Q.g === g) ptrs.delete(id);
      const P = { g, k: 'stick' }; ptrs.set(e.pointerId, P); stickStart(g, P, e.clientX, e.clientY); return;
    }
    ptrs.set(e.pointerId, { g, k: keyIn(g, e.clientX, e.clientY, null) }); sync();
  }
  function onMove(e) {
    const P = ptrs.get(e.pointerId); if (!P) return;
    if (P.g.stick) { stickSet(P.g, P, e.clientX, e.clientY); return; }
    const k = keyIn(P.g, e.clientX, e.clientY, P.k);
    if (k !== P.k) { if (P.k && K[P.g.p][P.k].seen > 0) K[P.g.p][P.k].pend = false; P.k = k; sync(); }
  }
  function onUp(e) { const P = ptrs.get(e.pointerId); if (!P) return; ptrs.delete(e.pointerId); if (P.g.stick) stickEnd(P.g); else sync(); }
  let cancels = [], hinted = false, hintT = null;
  function onCancel(e) {
    const now = performance.now(); cancels = cancels.filter(t => now - t < 150); cancels.push(now);
    const many = ptrs.size >= 3 || cancels.length >= 2;
    onUp(e);
    if (many && !hinted && hintEl) {
      hinted = true; hintEl.textContent = 'El celular cortó los toques. Si pasa seguido, desactiva en sus ajustes los gestos de tres dedos.';
      hintEl.hidden = false; clearTimeout(hintT); hintT = setTimeout(() => { hintEl.hidden = true; }, 6500);
    }
  }
  if (enabled) {
    const sweep = e => { if (ptrs.size && e.touches && e.touches.length === 0) { ptrs.clear(); for (const g of stickOf) if (g) stickEnd(g); sync(); } };
    addEventListener('touchend', sweep, { capture: true, passive: true });
    addEventListener('touchcancel', sweep, { capture: true, passive: true });
    document.addEventListener('visibilitychange', () => { if (document.hidden) releaseAll(); });
    addEventListener('blur', releaseAll);
    addEventListener('resize', () => { if (root && !root.hidden) measure(); });
  }
  function build(mode) {
    if (root) root.remove();
    groups = []; ptrs.clear(); stickOf[0] = stickOf[1] = null;
    root = document.createElement('div'); root.id = 'touch'; root.className = 'touch ' + mode;
    if (mode === 'single') {
      root.append(stick('left', 0));
      root.append(group('act right', 0, ['missile', 'boost', 'fire']));
    } else {
      root.append(stick('left', 0));
      root.append(group('act left2', 0, ['boost', 'missile', 'fire']));
      root.append(group('act right2', 1, ['missile', 'boost', 'fire']));
      root.append(stick('right', 1));
    }
    const pause = document.createElement('button');
    pause.className = 'tpause'; pause.type = 'button'; pause.setAttribute('aria-label', 'Pausa');
    pause.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="5" y="4" width="3.4" height="12" rx="1.2" fill="currentColor"/><rect x="11.6" y="4" width="3.4" height="12" rx="1.2" fill="currentColor"/></svg>';
    pause.addEventListener('click', () => UI.pause());
    root.append(pause);
    hintEl = document.createElement('div'); hintEl.className = 'thint glass'; hintEl.hidden = true; hintEl.setAttribute('role', 'status');
    root.append(hintEl);
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onCancel);
    root.addEventListener('lostpointercapture', onUp);
    root.addEventListener('contextmenu', e => e.preventDefault());
    document.getElementById('app').append(root);
    layout = mode;
    for (const P of K) for (const k of KEYS) P[k].vis = false;
  }
  function show(mode) { if (!enabled) return; if (!root || layout !== mode) build(mode); releaseAll(); root.hidden = false; measure(); }
  function hide() { if (root) root.hidden = true; releaseAll(); }
  // cuánto tapan los botones (px CSS) para acomodar el HUD
  // (se calcula una vez por disposición: pedir medidas en cada cuadro le cuesta al celular)
  function insets() {
    if (!enabled || !root || root.hidden) return null;
    if (insCache) return insCache;
    const vw = innerWidth || 1; let l = 0, r = 0, top = innerHeight || 1;
    root.querySelectorAll('.tgrp').forEach(c => { const b = c.getBoundingClientRect(); if (!b.width) return; if (b.left + b.width / 2 < vw / 2) l = Math.max(l, b.right); else r = Math.max(r, vw - b.left); top = Math.min(top, b.top); });
    return (insCache = { l, r, top });
  }
  // para las pruebas: qué grupo y qué botón recibiría un toque en (x, y)
  function probe(x, y) { measure(); const g = groupAt(x, y); if (!g) return null; return 'J' + (g.p + 1) + ':' + (g.stick ? 'palanca' : keyIn(g, x, y, null)); }
  return { state, show, hide, tick, insets, probe, get enabled() { return enabled; } };
})();
