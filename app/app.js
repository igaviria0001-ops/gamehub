/* =========================================================================
   GAMEHUB — la colección: portada, fichas, lanzador aislado de cada juego,
   torneo combinado, salón de la fama, ajustes, instalación y copia de seguridad.
   Cada juego corre en su propio marco y guarda sus cosas con su propio
   prefijo; la colección solo guarda lo suyo con «gamehub_».
   ========================================================================= */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const touch = (() => { try { return matchMedia('(hover: none) and (pointer: coarse)').matches; } catch (e) { return false; } })();
  const PRE = 'gamehub_';
  // lo que se guardó cuando la colección se llamaba «El Parche» pasa al nombre nuevo (una sola vez)
  try { for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && k.startsWith('parche_')) { const n = PRE + k.slice(7); if (localStorage.getItem(n) == null) localStorage.setItem(n, localStorage.getItem(k)); localStorage.removeItem(k); } } } catch (e) { /* sin guardado */ }
  const Store = {
    get(k, d) { try { const v = localStorage.getItem(PRE + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(PRE + k, JSON.stringify(v)); } catch (e) { /* sin guardado */ } },
    del(k) { try { localStorage.removeItem(PRE + k); } catch (e) { /* nada */ } },
  };
  const BUILD = /*__BUILD__*/ { v: 'dev', date: '' };
  const SET = Object.assign({ sound: true, fsPlay: true }, Store.get('settings', {}));
  const saveSet = () => Store.set('settings', SET);
  const COLORS = ['#ff5d8f', '#45d6b0', '#ffb36b', '#6fc3ff', '#ffd36b', '#b07bff', '#3dffa8', '#ff7a3d'];
  const shot = (g, i = 0) => `assets/shots/${g.shots[i % g.shots.length]}.jpg`;
  const initials = n => (String(n).trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2) || '?').toUpperCase();

  /* ---------- íconos ---------- */
  let cupN = 0;
  const ICON = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>',
    full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    unfull: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 10l5 5 5-5M4 20h16"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8v8M8 12h8"/></svg>',
    get cup() { const id = 'cg' + (++cupN); return `<svg viewBox="0 0 64 64"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".45" stop-color="#ffd36b"/><stop offset="1" stop-color="#c88a1c"/></linearGradient></defs><path d="M18 12H9a9 9 0 0 0 11 12M46 12h9a9 9 0 0 1-11 12" fill="none" stroke="#e8b04a" stroke-width="4"/><path d="M17 7h30v15a15 15 0 0 1-30 0z" fill="url(#${id})"/><path d="M22 10h5v12a10 10 0 0 0 4 8 13 13 0 0 1-9-12z" fill="#fff" opacity=".45"/><path d="M28 36h8v9h-8z" fill="#d89b2e"/><path d="M19 46h26l3 10H16z" fill="url(#${id})"/><path d="M22 51h20" stroke="#b7791a" stroke-width="2"/></svg>`; },
    crown: '<svg viewBox="0 0 64 64"><path d="M8 22l12 10 12-18 12 18 12-10-5 28H13z" fill="#ffd36b" stroke="#c88a1c" stroke-width="3" stroke-linejoin="round"/><circle cx="8" cy="20" r="4" fill="#ff5d8f"/><circle cx="32" cy="12" r="4" fill="#3dffa8"/><circle cx="56" cy="20" r="4" fill="#6fc3ff"/><path d="M13 50h38v6H13z" fill="#e8a93a"/></svg>',
    serie: '<svg viewBox="0 0 48 48" fill="none" stroke-width="3.2" stroke-linecap="round"><circle cx="14" cy="24" r="8" stroke="#ff5d8f"/><circle cx="34" cy="24" r="8" stroke="#6fc3ff"/><path d="M22 24h4" stroke="#ffd36b"/></svg>',
    liga: '<svg viewBox="0 0 48 48" fill="none" stroke-width="3" stroke-linecap="round"><path d="M8 12h32M8 24h32M8 36h32" stroke="#aaa3c8"/><circle cx="12" cy="12" r="3.5" fill="#ffd36b" stroke="none"/><circle cx="12" cy="24" r="3.5" fill="#45d6b0" stroke="none"/><circle cx="12" cy="36" r="3.5" fill="#ff5d8f" stroke="none"/></svg>',
    elim: '<svg viewBox="0 0 48 48" fill="none" stroke="#aaa3c8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h10v10H6M6 30h10v10H6M16 13h6v22h-6M22 24h10"/><circle cx="38" cy="24" r="6" stroke="#ffd36b"/></svg>',
    rey: '<svg viewBox="0 0 48 48"><path d="M8 18l8 7 8-12 8 12 8-7-4 20H12z" fill="#ffd36b" stroke="#c88a1c" stroke-width="2.4" stroke-linejoin="round"/></svg>',
  };

  /* ---------- sonidos de la colección (cortos, sintetizados) ---------- */
  const Snd = (() => {
    let ac = null, armed = false;
    // el audio solo arranca después del primer toque o tecla (los navegadores no dejan antes)
    const arm = () => { armed = true; }; addEventListener('pointerdown', arm, { once: true, capture: true }); addEventListener('keydown', arm, { once: true, capture: true });
    const ctx = () => { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } } return ac; };
    function tone(f, d, v, type = 'sine', f2 = null, delay = 0) {
      if (!SET.sound || !armed) return; const a = ctx(); if (!a) return; if (a.state === 'suspended') a.resume();
      const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + 0.02);
    }
    let lastHover = 0;
    return {
      hover() { const n = performance.now(); if (touch || n - lastHover < 70) return; lastHover = n; tone(1500, 0.04, 0.025, 'triangle'); },
      click() { tone(660, 0.07, 0.05, 'triangle', 990); },
      back() { tone(520, 0.08, 0.045, 'triangle', 330); },
      open() { tone(220, 0.35, 0.06, 'sawtooth', 880); tone(440, 0.3, 0.04, 'triangle', 1320, 0.05); },
      ok() { [523, 659, 784].forEach((f, i) => tone(f, 0.18, 0.05, 'triangle', null, i * 0.07)); },
      fanfare() { [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, i === 5 ? 0.6 : 0.16, 0.07, 'square', null, i * 0.13)); [262, 330, 392].forEach(f => tone(f, 1.3, 0.04, 'triangle', null, 0.65)); },
      shuffle() { for (let i = 0; i < 7; i++) tone(500 + Math.random() * 700, 0.05, 0.03, 'square', null, i * 0.06); },
    };
  })();

  /* ---------- fondo: estrellas que titilan sobre la nebulosa, con estrellas fugaces ---------- */
  const BG = (() => {
    const cv = $('#bg'), x = cv.getContext('2d'); let w = 0, h = 0, k = 1, raf = 0, on = true, t0 = performance.now(), last = t0, mx = 0, my = 0, px = 0, py = 0, nextShot = 2.5, shot = null;
    // tres capas: lejos (muchas, chiquitas), medio y cerca (pocas, brillantes, con cruz)
    const R = (() => { let s = 20261112; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; })();
    const COL = ['255,255,255', '200,220,255', '255,210,240', '210,190,255', '180,240,255'];
    const stars = Array.from({ length: 230 }, (_, i) => { const L = i < 160 ? 0 : i < 214 ? 1 : 2; return { x: R(), y: R(), L, r: [0.55, 0.95, 1.5][L] * (0.7 + R() * 0.6), a: [0.45, 0.7, 0.95][L], tw: 0.6 + R() * 2.2, ph: R() * 6.28, c: COL[(R() * COL.length) | 0] }; });
    function size() { k = Math.min(2, (window.devicePixelRatio || 1)) * (touch ? 0.75 : 1); w = cv.width = Math.max(2, Math.round(innerWidth * k)); h = cv.height = Math.max(2, Math.round(innerHeight * k)); }
    addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
    function frame(now) {
      raf = 0; if (!on) return; const t = (now - t0) / 1000, dt = Math.min(0.05, (now - last) / 1000); last = now;
      x.clearRect(0, 0, w, h); px += (mx - px) * 0.04; py += (my - py) * 0.04;
      x.globalCompositeOperation = 'lighter';
      for (const s of stars) {
        const par = [4, 10, 22][s.L] * k, sx = ((s.x * w - px * par) % w + w) % w, sy = ((s.y * h - py * par) % h + h) % h;
        const a = s.a * (0.55 + 0.45 * Math.sin(t * s.tw + s.ph)), r = s.r * k;
        x.fillStyle = `rgba(${s.c},${a.toFixed(3)})`; x.beginPath(); x.arc(sx, sy, r, 0, 6.283); x.fill();
        if (s.L === 2 && a > 0.5) { const L = r * (5 + 4 * a); x.fillStyle = `rgba(${s.c},${(a * 0.5).toFixed(3)})`; x.fillRect(sx - L, sy - 0.5 * k, 2 * L, k); x.fillRect(sx - 0.5 * k, sy - L, k, 2 * L); }
      }
      // estrella fugaz de vez en cuando
      if (!shot && t > nextShot) { const dir = R() < 0.5 ? 1 : -1; shot = { x: (0.15 + R() * 0.7) * w, y: R() * h * 0.45, vx: dir * (0.55 + R() * 0.4) * w, vy: (0.22 + R() * 0.2) * h, t: 0, d: 0.9 + R() * 0.5 }; nextShot = t + 5 + R() * 9; }
      if (shot) {
        shot.t += dt; const f = shot.t / shot.d, hx = shot.x + shot.vx * shot.t, hy = shot.y + shot.vy * shot.t, tl = 0.16, tx = hx - shot.vx * tl, ty = hy - shot.vy * tl, al = Math.sin(Math.min(1, f) * Math.PI);
        const g = x.createLinearGradient(tx, ty, hx, hy); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(235,225,255,${(0.85 * al).toFixed(3)})`);
        x.strokeStyle = g; x.lineWidth = 1.6 * k; x.lineCap = 'round'; x.beginPath(); x.moveTo(tx, ty); x.lineTo(hx, hy); x.stroke();
        if (f >= 1) shot = null;
      }
      x.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(frame);
    }
    addEventListener('resize', size); size();
    return { start() { on = true; last = performance.now(); if (!raf) raf = requestAnimationFrame(frame); }, stop() { on = false; if (raf) cancelAnimationFrame(raf); raf = 0; } };
  })();
  document.addEventListener('visibilitychange', () => { if (document.hidden) BG.stop(); else if ($('#stage').hidden) BG.start(); });

  /* ---------- logotipos de los juegos ---------- */
  function glogo(g, cls = '') {
    if (g.font === 'tya') return `<h2 class="glogo tya ${cls}">Tira<span class="y">y</span><span class="a2">Afloja</span></h2>`;
    const c = { vento: 'vento', sorti: 'sorti', vtg: 'vtg' }[g.font];
    return `<h2 class="glogo ${c} ${cls}">${esc(g.name)}</h2>`;
  }
  const gvars = g => `--c1:${g.c1};--c2:${g.c2};--gc1:${g.c1};--gc2:${g.c2}`;

  /* ---------- vistas ---------- */
  let view = 'home', lastMain = 'home';
  function go(v, arg, push = true) {
    $$('.view').forEach(s => { s.hidden = true; s.classList.remove('enter'); });
    view = v; if (v !== 'game') lastMain = v;
    const el = $('#v-' + v); el.hidden = false; void el.offsetWidth; el.classList.add('enter'); el.scrollTop = 0;
    $$('.nav button').forEach(b => b.setAttribute('aria-current', String(b.dataset.go === (v === 'game' ? 'home' : v))));
    if (v === 'home') renderHome(); else if (v === 'game') renderGame(arg); else if (v === 'torneo') renderTorneo(); else if (v === 'fama') renderFame(); else if (v === 'ajustes') renderSettings();
    const hash = v === 'home' ? '' : v === 'game' ? 'ficha-' + arg : v;
    if (push) { try { history.replaceState(null, '', hash ? '#' + hash : location.pathname + location.search); } catch (e) { /* nada */ } }
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-go]'); if (b) { Snd.click(); go(b.dataset.go); }
  });
  document.addEventListener('pointerover', e => { if (e.target.closest('button, .slice, .tbanner')) Snd.hover(); });

  /* ---------- portada ---------- */
  let slideT = 0;
  function renderHome() {
    const el = $('#v-home');
    el.innerHTML = `
      <div class="hero">
        <h1 class="logo" aria-label="GameHub"><span class="k">4 JUEGOS · 1 UNIVERSO</span><span class="lw"><span class="ld" aria-hidden="true">GAMEHUB</span><span class="lf">GAMEHUB</span>${[[2, 8, '#ff9be6', 0], [44, -6, '#9fd8ff', 1.1], [93, 14, '#d4b3ff', 2.2], [70, 74, '#ffd9a8', 0.6], [18, 70, '#a8fff0', 1.7]].map(([l, t, c, d]) => `<i class="spark" style="left:${l}%;top:${t}%;--sc:${c};--d:-${d}s"></i>`).join('')}</span></h1>
        <div class="side">
          <p class="tagline">Cuatro juegos para dos, cada uno en su propio mundo.<small>Elige uno y a jugar, o mézclalos en un torneo con los amigos.</small></p>
          <div class="cta"><button class="btn gold big" data-go="torneo">${ICON.cup.replace('<svg', '<svg style="width:1.3em;height:1.3em"')}Torneo combinado</button></div>
        </div>
      </div>
      <div class="slices" id="slices">${GAMES.map(g => `
        <article class="slice" tabindex="0" data-g="${g.id}" style="${gvars(g)}" aria-label="${esc(g.name)}: ${esc(g.tag)}">
          <div class="unskew">
            <div class="art">${g.shots.map((s, i) => `<img src="assets/shots/${s}.jpg" alt="" ${i ? 'loading="lazy"' : ''} class="${i ? '' : 'on'}" decoding="async">`).join('')}</div>
            <div class="shade"></div><div class="bar"></div>
            <div class="content">
              <div class="num">${g.num} · <span class="kind">${esc(g.kind)}</span></div>
              ${glogo(g)}
              <div class="more"><div>
                <p class="desc">${esc(g.desc)}</p>
                <div class="chips"><span>2 jugadores</span><span>${g.modes.length} modos de duelo</span><span>${g.maps.length + (g.arenas ? g.arenas.length : 0)} escenarios</span></div>
                <div class="acts"><button class="btn play" data-play="${g.id}">${ICON.play} Jugar</button><button class="btn ghost" data-info="${g.id}">Ver todo</button></div>
              </div></div>
            </div>
          </div>
        </article>`).join('')}
      </div>
      <div class="tbanner" data-go="torneo" role="button" tabindex="0">
        <span class="cup">${ICON.cup}</span>
        <div><b>Torneo combinado</b><p>Mezcla los 4 juegos, modos y escenarios al azar: series, ligas, eliminatorias o rey de la pista, de 2 a 8 jugadores.</p></div>
        <span class="btn small">${tourActive() ? 'Seguir el torneo' : 'Armar uno'} ›</span>
      </div>`;
    const S = $('#slices');
    $$('.slice', S).forEach(s => {
      s.addEventListener('click', e => {
        if (e.target.closest('[data-play]')) { Snd.open(); Launcher.open(e.target.closest('[data-play]').dataset.play); return; }
        if (e.target.closest('[data-info]')) { Snd.click(); go('game', s.dataset.g); return; }
        // en pantallas táctiles el primer toque abre la tajada; el segundo, la ficha
        if (touch && !s.classList.contains('open')) { $$('.slice', S).forEach(o => o.classList.remove('open')); s.classList.add('open'); S.classList.add('has-open'); Snd.click(); return; }
        if (touch) { Snd.click(); go('game', s.dataset.g); return; }
        Snd.click(); go('game', s.dataset.g);
      });
      s.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target === s) { Snd.open(); Launcher.open(s.dataset.g); } });
    });
    $('.tbanner').addEventListener('keydown', e => { if (e.key === 'Enter') go('torneo'); });
    clearInterval(slideT);
    slideT = setInterval(() => {
      if (view !== 'home' || !$('#stage').hidden) return;
      $$('.slice', S).forEach(s => { if (!(s.matches(':hover') || s.classList.contains('open') || s.matches(':focus-within'))) return; const im = $$('.art img', s), k = im.findIndex(i => i.classList.contains('on')); im[k].classList.remove('on'); im[(k + 1) % im.length].classList.add('on'); });
    }, 3200);
  }

  /* ---------- ficha de un juego ---------- */
  function renderGame(id) {
    const g = GAME[id] || GAMES[0], el = $('#v-game');
    el.setAttribute('style', gvars(g));
    el.innerHTML = `<div class="detail">
      <div>
        <div class="media">${g.shots.map((s, i) => `<img src="assets/shots/${s}.jpg" alt="${esc(g.name)}" class="${i ? '' : 'on'}">`).join('')}</div>
        <div class="thumbs">${g.shots.map((s, i) => `<button aria-label="Foto ${i + 1}" aria-pressed="${!i}" data-th="${i}"><img src="assets/shots/${s}.jpg" alt="" loading="lazy"></button>`).join('')}</div>
      </div>
      <div class="dinfo">
        <button class="btn small ghost back" data-go="home">‹ Volver</button>
        <div><div class="num" style="font:400 13px/1 var(--display);letter-spacing:.2em;color:var(--gc1);margin-bottom:8px">${g.num} · ${esc(g.tag.toUpperCase())}</div>${glogo(g)}</div>
        <p class="lead">${esc(g.desc)}</p>
        <button class="btn gold big bigplay" data-play="${g.id}">${ICON.play} Jugar ${esc(g.short)}</button>
        <h3>MODOS PARA DOS</h3>
        <div class="modes">${g.modes.map(m => `<div><b>${esc(m.name)}</b><span>${esc(m.desc)}</span></div>`).join('')}</div>
        <h3>ESCENARIOS</h3>
        <div class="chips">${g.maps.concat(g.arenas || []).map(m => `<span>${esc(m[1])}</span>`).join('')}</div>
        <h3>CONTROLES</h3>
        <div class="keys">${g.keys.map(([j, k], i) => `<div class="${i ? 'j2' : ''}"><b>${j}</b><span>${esc(k)}</span></div>`).join('')}<div class="note">${esc(g.touch)} Las teclas se pueden cambiar dentro del juego.</div></div>
        <h3>Y ADEMÁS</h3>
        <div class="chips">${g.extras.map(x => `<span>${esc(x)}</span>`).join('')}</div>
        <p class="note">Este juego guarda sus propios ajustes, récords y avances: nada de lo que hagas aquí cambia los otros.</p>
      </div></div>`;
    const im = $$('.media img', el), th = $$('.thumbs button', el);
    const sel = k => { im.forEach((x, i) => x.classList.toggle('on', i === k)); th.forEach((b, i) => b.setAttribute('aria-pressed', String(i === k))); };
    th.forEach(b => b.addEventListener('click', () => { Snd.click(); sel(+b.dataset.th); }));
    $('[data-play]', el).addEventListener('click', () => { Snd.open(); Launcher.open(g.id); });
  }

  /* ---------- pantalla completa: la maneja la colección (también cuando la pide un juego) ---------- */
  const FS = (() => {
    const d = document.documentElement, subs = [];
    const el = () => document.fullscreenElement || document.webkitFullscreenElement || null;
    const can = !!(d.requestFullscreen || d.webkitRequestFullscreen);
    const lock = () => { if (!touch) return; try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* nada */ } };
    const unlock = () => { try { screen.orientation.unlock(); } catch (e) { /* nada */ } };
    function enter() {
      if (el()) { lock(); return Promise.resolve(true); }
      try {
        if (d.requestFullscreen) return d.requestFullscreen({ navigationUI: 'hide' }).then(() => { lock(); return true; }, () => false);
        if (d.webkitRequestFullscreen) { d.webkitRequestFullscreen(); return new Promise(r => setTimeout(() => r(!!el()), 300)); }
      } catch (e) { /* el navegador no deja */ }
      return Promise.resolve(false);
    }
    function exit() {
      if (!el()) return Promise.resolve(true);
      try { if (document.exitFullscreen) return document.exitFullscreen().then(() => true, () => false); if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); return Promise.resolve(true); } } catch (e) { /* nada */ }
      return Promise.resolve(false);
    }
    const help = () => /iP(hone|od)/.test(navigator.userAgent) ? 'En iPhone la pantalla completa se logra instalando GameHub: Compartir → «Agregar a inicio».' : 'El navegador no dejó poner pantalla completa aquí.';
    const changed = () => { const on = !!el(), b = $('#fsbtn'); if (b) { b.setAttribute('aria-pressed', String(on)); b.setAttribute('aria-label', on ? 'Salir de pantalla completa' : 'Pantalla completa'); b.innerHTML = on ? ICON.unfull : ICON.full; } subs.forEach(f => f(on)); };
    document.addEventListener('fullscreenchange', changed); document.addEventListener('webkitfullscreenchange', changed);
    return { can, get on() { return !!el(); }, enter, exit, toggle() { return el() ? exit() : enter(); }, lock, unlock, help, onChange(f) { subs.push(f); } };
  })();

  /* ---------- lanzador: cada juego en su propio marco ---------- */
  const Launcher = (() => {
    const stage = $('#stage'), frame = $('#frame'), cache = {};
    let cur = null, readyT = 0, tourEv = null, resultGot = false;
    async function load(g) {
      if (cache[g.id]) return cache[g.id];
      const r = await fetch(g.file, { cache: 'no-cache' }); if (!r.ok) throw new Error('HTTP ' + r.status);
      return (cache[g.id] = await r.text());
    }
    const post = msg => { try { frame.contentWindow.postMessage(Object.assign({ hub: 'gamehub' }, msg), '*'); } catch (e) { /* nada */ } };
    const focusGame = () => { try { frame.focus({ preventScroll: true }); frame.contentWindow.focus(); } catch (e) { /* nada */ } };
    async function open(id, ev) {
      const g = GAME[id]; if (!g) return;
      // se pide ya, mientras dura el toque o clic en «Jugar» (los navegadores solo la dejan así)
      if (SET.fsPlay) FS.enter(); else if (FS.on) FS.lock();
      cur = g; tourEv = ev || null; resultGot = false;
      stage.setAttribute('style', gvars(g)); stage.classList.remove('ready'); stage.hidden = false; BG.stop();
      document.body.classList.add('playing');
      $('#ltitle').innerHTML = glogo(g);
      $('#ltip').textContent = ev ? `Prueba ${ev.n}: ${tName(ev.j1)} (J1) contra ${tName(ev.j2)} (J2) · ${modeName(ev)} en ${mapName(g, ev.map)}` : g.touch.startsWith('En el') && touch ? g.touch : `Para volver a GameHub, usa «⌂ GameHub» en la portada del juego.`;
      $('#lerr').hidden = true; $('#lbtns').hidden = true; $('.lbar').hidden = false;
      clearTimeout(readyT); readyT = setTimeout(() => fail('El juego está tardando en arrancar.'), 25000);
      frame.removeAttribute('srcdoc'); frame.src = 'about:blank';
      try { const html = await load(g); if (cur !== g) return; frame.removeAttribute('src'); frame.srcdoc = html; }
      catch (e) { if (cur !== g) return; frame.src = g.file; }
    }
    function fail(msg) { $('#lerr').textContent = msg; $('#lerr').hidden = false; $('#lbtns').hidden = false; $('.lbar').hidden = true; }
    function close() {
      clearTimeout(readyT); cur = null; tourEv = null;
      stage.hidden = true; stage.classList.remove('ready'); frame.removeAttribute('srcdoc'); frame.src = 'about:blank'; hideToast();
      document.body.classList.remove('playing'); if (touch) FS.unlock();
      BG.start();
      if (view === 'torneo') renderTorneo(); else if (view === 'home') renderHome();
      if (Tour.T && Tour.T.done && !Tour.T.celebrated) Champ.show(Tour.T);
      App.afterGame();
    }
    let toastT = 0;
    function toast(html, withBack) { const t = $('#htoast'); t.innerHTML = `<span class="dot"></span><span>${html}</span>` + (withBack ? '<button class="btn small gold" id="htback">Volver al torneo ›</button>' : ''); t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(hideToast, 9000); const b = $('#htback'); if (b) b.onclick = () => { Snd.click(); close(); }; }
    function hideToast() { $('#htoast').classList.remove('show'); if (cur) focusGame(); }
    // si el foco se sale del juego (un toque en el aviso, por ejemplo), las teclas lo devuelven al juego
    addEventListener('keydown', () => { if (cur && stage.classList.contains('ready') && document.activeElement !== frame) focusGame(); }, true);
    stage.addEventListener('pointerup', e => { if (cur && !e.target.closest('button')) focusGame(); });
    FS.onChange(on => { if (cur) post({ cmd: 'fs', on }); });
    addEventListener('message', e => {
      if (!cur || e.source !== frame.contentWindow) return;
      const m = e.data; if (!m || m.hub !== 'gamehub') return;
      if (m.event === 'ready') {
        clearTimeout(readyT); stage.classList.add('ready');
        const vs = Store.get('versions', {}); vs[m.source] = m.version; Store.set('versions', vs);
        focusGame(); post({ cmd: 'fs', on: FS.on, can: FS.can });
        if (tourEv) { const ev = tourEv, g = cur; post({ cmd: 'play', ev: { id: ev.id, game: g.id, mode: ev.mode, map: ev.map, rounds: ev.rounds, chars: ev.chars, opts: ev.opts, p1: tName(ev.j1), p2: tName(ev.j2), title: `Torneo · prueba ${ev.n} · ${tName(ev.j1)} (J1) contra ${tName(ev.j2)} (J2)` } }); }
      } else if (m.event === 'fs') {
        // el juego pidió pantalla completa (o salir) desde sus opciones: la pone la colección
        (m.on ? FS.enter() : FS.exit()).then(ok => { post({ cmd: 'fs', on: FS.on, fail: !ok, help: ok ? '' : FS.help() }); focusGame(); });
      } else if (m.event === 'result' && tourEv && m.id === tourEv.id) {
        resultGot = true;
        const ev = tourEv, w = m.winner === 0 ? ev.j1 : m.winner === 1 ? ev.j2 : 'draw';
        Tour.result(ev.id, w, m.info);
        Snd.ok();
        toast(w === 'draw' ? 'Empate: la prueba quedó anotada' : `¡Gana ${esc(tName(w))}! Resultado anotado`, true);
      } else if (m.event === 'exit') close();
      else if (m.event === 'abort' && tourEv) { toast('La prueba quedó pendiente: pueden volver a jugarla', true); }
      else if (m.event === 'error') toast('El juego avisó un error: ' + esc(m.msg || ''), !!tourEv);
    });
    $('#lretry').addEventListener('click', () => { const g = cur, ev = tourEv; if (g) { delete cache[g.id]; open(g.id, ev); } });
    $('#lback').addEventListener('click', () => close());
    return { open, close, get open_() { return !!cur; } };
  })();

  /* ---------- torneo: estado guardado y asistente ---------- */
  const Tour = {
    T: Store.get('tour', null),
    save() { Store.set('tour', this.T); },
    result(evId, w, info) { if (!this.T) return; const ev = Torneo.record(this.T, evId, w, info); if (ev) { this.save(); if (this.T.done) archive(this.T); } },
  };
  if (Tour.T && Tour.T.v !== 1) Tour.T = null;
  const tourActive = () => !!(Tour.T && !Tour.T.done);
  const tName = id => { const p = Tour.T && Tour.T.players.find(x => x.id === id); return p ? p.name : '—'; };
  const tColor = id => { const p = Tour.T && Tour.T.players.find(x => x.id === id); return p ? p.color : '#888'; };
  const modeName = ev => { const g = GAME[ev.game], M = g && g.modes.find(m => m.id === ev.mode); return M ? M.name : ev.mode; };
  const FORMATS = {
    serie: { name: 'Mano a mano', icon: 'serie', desc: 'Dos jugadores, al mejor de varias pruebas.', min: 2, max: 2 },
    liga: { name: 'Liga', icon: 'liga', desc: 'Todos contra todos; puntos y tabla. Final opcional entre los dos primeros.', min: 3, max: 8 },
    elim: { name: 'Eliminatoria', icon: 'elim', desc: 'Llaves: quien pierde queda fuera. Si sobra alguien, pasa directo.', min: 3, max: 8 },
    rey: { name: 'Rey de la pista', icon: 'rey', desc: 'El que gana se queda; el que pierde hace fila. Gana quien llegue primero a la meta.', min: 3, max: 8 },
  };
  function defaultPool() { const P = {}; GAMES.forEach(g => { P[g.id] = { on: true, modes: Object.fromEntries(g.modes.map(m => [m.id, true])), maps: Object.fromEntries(g.maps.map(m => [m[0], true])), arenas: g.arenas ? Object.fromEntries(g.arenas.map(m => [m[0], true])) : null, len: 'normal', opts: Object.fromEntries((g.opts || []).map(o => [o.id, o.def])) }; }); return P; }
  function newWizard() {
    const lastP = Store.get('lastPlayers', null);
    return {
      step: 0, name: 'Copa Galaxia',
      players: lastP && lastP.length >= 2 ? lastP.map(p => ({ name: p.name, color: p.color })) : [{ name: '', color: COLORS[0] }, { name: '', color: COLORS[3] }],
      format: 'serie',
      rules: { bestOf: 5, legs: 1, ptsW: 3, ptsD: 1, ptsL: 0, final: 3, finalBestOf: 3, third: true, kingGoal: 5, order: 'azar', noRepeat: true, noRepeatMap: true, chars: 'pick', swapSides: true },
      pool: Store.get('lastPool', null) || defaultPool(), open: {},
    };
  }
  let W = null;
  const STEPS = ['Jugadores', 'Formato', 'Juegos', 'Reglas', '¡Listo!'];
  function fixFormat() {
    const n = W.players.length, F = FORMATS[W.format];
    if (n < F.min || n > F.max) W.format = n === 2 ? 'serie' : 'liga';
  }
  function setFormat(f) {
    W.format = f; const R = W.rules;
    if (f === 'serie') R.bestOf = 5; else if (f === 'liga') { R.bestOf = 1; } else if (f === 'elim') { R.bestOf = 1; R.finalBestOf = 3; } else if (f === 'rey') R.bestOf = 1;
  }
  const PRESETS = [
    { name: 'Duelo relámpago', desc: 'Dos jugadores, al mejor de 5 pruebas, todo al azar.', apply() { while (W.players.length > 2) W.players.pop(); while (W.players.length < 2) addPlayer(); setFormat('serie'); W.rules.bestOf = 5; W.name = 'Duelo relámpago'; } },
    { name: 'Liga de los amigos', desc: 'Todos contra todos (3 a 8) y final al mejor de 3.', apply() { while (W.players.length < 4) addPlayer(); setFormat('liga'); W.rules.final = 3; W.rules.legs = 1; W.name = 'Liga de los amigos'; } },
    { name: 'Copa eliminatoria', desc: 'Llaves con tercer puesto y final al mejor de 3.', apply() { while (W.players.length < 4) addPlayer(); setFormat('elim'); W.rules.third = true; W.name = 'Copa eliminatoria'; } },
    { name: 'Rey de la pista', desc: 'El que gana se queda. Primero a 5 victorias.', apply() { while (W.players.length < 3) addPlayer(); setFormat('rey'); W.rules.kingGoal = 5; W.name = 'Rey de la pista'; } },
  ];
  function addPlayer() { if (W.players.length >= 8) return; const used = W.players.map(p => p.color); W.players.push({ name: '', color: COLORS.find(c => !used.includes(c)) || COLORS[W.players.length % 8] }); }

  function renderTorneo() {
    const el = $('#v-torneo');
    if (Tour.T) return renderDash(el);
    if (!W) W = newWizard();
    renderWizard(el);
  }
  let lastStep = -1;
  function renderWizard(el) {
    const s = W.step;
    if (s !== lastStep) { el.scrollTop = 0; lastStep = s; }
    el.innerHTML = `<div class="wrap">
      <div class="thead"><div><h1 class="h1">Torneo combinado</h1><p class="sub">Arma un torneo con los 4 juegos: cada prueba se sortea entre los juegos, modos y escenarios que dejes encendidos. Los resultados se anotan solos al terminar cada partida.</p></div></div>
      <div class="wiz">
        <nav class="steps">${STEPS.map((n, i) => `<button data-step="${i}" aria-current="${i === s}" class="${i < s ? 'ok' : ''}"><i>${i < s ? '✓' : i + 1}</i><span>${n}</span></button>`).join('')}</nav>
        <div class="panel" id="wstep">${[stepPlayers, stepFormat, stepGames, stepRules, stepSummary][s]()}</div>
      </div></div>`;
    $$('[data-step]', el).forEach(b => b.onclick = () => { const k = +b.dataset.step; if (k > s && !validStep(s)) return; Snd.click(); W.step = k; renderWizard(el); });
    bindWizard(el);
  }
  function wfoot(nextTxt = 'Siguiente ›') { return `<div class="wfoot"><button class="btn ghost" data-w="prev" ${W.step === 0 ? 'style="visibility:hidden"' : ''}>‹ Atrás</button><button class="btn gold" data-w="next">${nextTxt}</button></div>`; }
  function stepPlayers() {
    const recent = (Store.get('names', [])).filter(n => !W.players.some(p => p.name.trim().toLowerCase() === n.toLowerCase())).slice(0, 12);
    return `<div class="h2">ARRANQUE RÁPIDO</div>
      <div class="presets">${PRESETS.map((p, i) => `<button class="preset" data-preset="${i}"><b>${esc(p.name)}</b><span>${esc(p.desc)}</span></button>`).join('')}</div>
      <div class="h2">¿QUIÉNES JUEGAN? <span style="color:var(--mute);letter-spacing:0;font-family:var(--body);font-weight:800;font-size:13px">(de 2 a 8)</span></div>
      <div class="players">${W.players.map((p, i) => `<div class="prow"><button class="swatch" style="background:${p.color}" data-color="${i}" aria-label="Cambiar color"></button><input maxlength="16" placeholder="Jugador ${i + 1}" value="${esc(p.name)}" data-name="${i}" autocomplete="off" spellcheck="false"><button class="x" data-del="${i}" aria-label="Quitar" ${W.players.length <= 2 ? 'disabled style="opacity:.3"' : ''}>✕</button></div>`).join('')}</div>
      <div class="row" style="margin-top:10px"><button class="btn small" data-w="add" ${W.players.length >= 8 ? 'disabled' : ''}>+ Agregar jugador</button></div>
      ${recent.length ? `<div class="recent">${recent.map(n => `<button class="chipbtn" data-recent="${esc(n)}">+ ${esc(n)}</button>`).join('')}</div>` : ''}
      ${wfoot()}`;
  }
  function stepFormat() {
    fixFormat(); const n = W.players.length, R = W.rules, F = W.format;
    const seg = (key, items, val) => `<div class="seg" data-seg="${key}">${items.map(([v, t]) => `<button data-v="${v}" aria-pressed="${String(v) === String(val)}">${t}</button>`).join('')}</div>`;
    let opts = '';
    if (F === 'serie') opts = `<div class="field"><span class="lbl">Largo de la serie</span>${seg('bestOf', [[3, 'Al mejor de 3'], [5, 'Al mejor de 5'], [7, 'Al mejor de 7'], [9, 'Al mejor de 9']], R.bestOf)}<span class="hint">Un empate no cuenta: se juega otra prueba.</span></div>`;
    if (F === 'liga') opts = `<div class="field"><span class="lbl">Vueltas</span>${seg('legs', [[1, 'Una vuelta'], [2, 'Ida y vuelta']], R.legs)}</div>
      <div class="field"><span class="lbl">Cada cruce</span>${seg('bestOf', [[1, 'Una prueba'], [3, 'Al mejor de 3']], R.bestOf)}</div>
      <div class="field"><span class="lbl">Puntos</span>${seg('pts', [['3-1-0', 'Gana 3 · empata 1'], ['2-1-0', 'Gana 2 · empata 1'], ['1-0-0', 'Solo victorias']], `${R.ptsW}-${R.ptsD}-${R.ptsL}`)}</div>
      <div class="field"><span class="lbl">Final entre los dos primeros</span>${seg('final', [[0, 'Sin final'], [3, 'Al mejor de 3'], [5, 'Al mejor de 5']], R.final)}</div>`;
    if (F === 'elim') opts = `<div class="field"><span class="lbl">Cada cruce</span>${seg('bestOf', [[1, 'Una prueba'], [3, 'Al mejor de 3'], [5, 'Al mejor de 5']], R.bestOf)}</div>
      <div class="field"><span class="lbl">La final</span>${seg('finalBestOf', [[1, 'Una prueba'], [3, 'Al mejor de 3'], [5, 'Al mejor de 5'], [7, 'Al mejor de 7']], R.finalBestOf)}</div>
      <div class="field"><span class="lbl">Partido por el tercer puesto</span>${seg('third', [[1, 'Sí'], [0, 'No']], R.third ? 1 : 0)}<span class="hint">Solo cuando hay semifinales.</span></div>`;
    if (F === 'rey') opts = `<div class="field"><span class="lbl">Gana quien llegue a</span>${seg('kingGoal', [[3, '3 victorias'], [5, '5 victorias'], [7, '7 victorias'], [10, '10 victorias']], R.kingGoal)}<span class="hint">El rey defiende contra el primero de la fila; con empate, el rey se queda.</span></div>`;
    return `<div class="h2">FORMATO · ${n} JUGADORES</div>
      <div class="formats">${Object.entries(FORMATS).map(([k, f]) => { const ok = n >= f.min && n <= f.max; return `<button class="opt" data-format="${k}" aria-pressed="${k === F}" ${ok ? '' : 'disabled'}>${ICON[f.icon]}<div><b>${f.name}</b><span>${f.desc}${ok ? '' : f.max === 2 ? ' (solo para 2)' : ' (desde 3 jugadores)'}</span></div></button>`; }).join('')}</div>
      <div style="margin-top:8px">${opts}</div>${wfoot()}`;
  }
  function poolSummary(g) {
    const P = W.pool[g.id]; if (!P.on) return 'Apagado';
    const ms = g.modes.filter(m => P.modes[m.id]).length, mp = g.maps.filter(m => P.maps[m[0]]).length;
    return `${ms} de ${g.modes.length} modos · ${mp} de ${g.maps.length} escenarios · partidas ${({ corta: 'cortas', normal: 'normales', larga: 'largas' })[P.len]}`;
  }
  function stepGames() {
    return `<div class="h2">¿QUÉ SE JUEGA?</div><p class="sub" style="margin:-4px 0 12px">Enciende los juegos que entran al sorteo y, si quieres, escoge sus modos y escenarios.</p>
      <div class="gpool">${GAMES.map(g => { const P = W.pool[g.id], open = W.open[g.id]; return `<div class="gcard ${P.on ? '' : 'off'}" style="${gvars(g)}">
        <div class="ghead" data-gopen="${g.id}"><img class="thumb" src="${shot(g)}" alt=""><div class="gl">${glogo(g)}<div class="gsum">${poolSummary(g)}</div></div>
          <button class="expand" data-gopen="${g.id}">${open ? 'Cerrar' : 'Elegir'} ${open ? '▴' : '▾'}</button><button class="tgl" data-gon="${g.id}" aria-pressed="${P.on}" aria-label="Incluir ${esc(g.name)}"></button></div>
        ${open && P.on ? `<div class="gbody">
          <div class="lbl">Modos</div><div class="chips">${g.modes.map(m => `<button class="chipbtn" data-gmode="${g.id}:${m.id}" aria-pressed="${!!P.modes[m.id]}" title="${esc(m.desc)}">${esc(m.name)}</button>`).join('')}</div>
          <div class="lbl">Escenarios</div><div class="chips">${g.maps.map(m => `<button class="chipbtn" data-gmap="${g.id}:${m[0]}" aria-pressed="${!!P.maps[m[0]]}">${esc(m[1])}</button>`).join('')}<button class="chipbtn" data-gall="${g.id}">Todos</button></div>
          ${g.arenas ? `<div class="lbl">Arenas de batalla</div><div class="chips">${g.arenas.map(m => `<button class="chipbtn" data-garena="${g.id}:${m[0]}" aria-pressed="${P.arenas[m[0]] !== false}">${esc(m[1])}</button>`).join('')}</div>` : ''}
          ${g.modes.some(m => m.map) ? `<div class="hint" style="font-size:12.5px;color:var(--mute)">${g.modes.filter(m => m.map).map(m => `${esc(m.name)} se juega siempre en ${esc(mapName(g, m.map))}`).join(' · ')}.</div>` : ''}
          <div class="lbl">Largo de las partidas</div><div class="seg" data-glen="${g.id}">${[['corta', 'Cortas'], ['normal', 'Normales'], ['larga', 'Largas']].map(([v, t]) => `<button data-v="${v}" aria-pressed="${P.len === v}">${t}</button>`).join('')}</div>
          ${(g.opts || []).map(o => o.type === 'bool' ? `<div class="lbl">${esc(o.name)} <span style="font-weight:700">· ${esc(o.desc)}</span></div><div class="seg" data-gopt="${g.id}:${o.id}">${[[1, 'Sí'], [0, 'No']].map(([v, t]) => `<button data-v="${v}" aria-pressed="${!!P.opts[o.id] === !!v}">${t}</button>`).join('')}</div>` : `<div class="lbl">${esc(o.name)}</div><div class="seg" data-gopt="${g.id}:${o.id}">${o.items.map(([v, t]) => `<button data-v="${v}" aria-pressed="${P.opts[o.id] === v}">${t}</button>`).join('')}</div>`).join('')}
        </div>` : ''}</div>`; }).join('')}</div>${wfoot()}`;
  }
  function stepRules() {
    const R = W.rules, seg = (key, items, val) => `<div class="seg" data-seg="${key}">${items.map(([v, t]) => `<button data-v="${v}" aria-pressed="${String(v) === String(val)}">${t}</button>`).join('')}</div>`;
    return `<div class="h2">REGLAS DEL SORTEO</div>
      <div class="field"><span class="lbl">¿Cómo se escoge el juego de cada prueba?</span>${seg('order', [['azar', 'Al azar'], ['rotar', 'Rotando los juegos'], ['pierde', 'Elige el que va perdiendo'], ['turnos', 'Eligen por turnos']], R.order)}<span class="hint">El modo y el escenario siempre se sortean dentro del juego (y se pueden volver a sortear).</span></div>
      <div class="field"><span class="lbl">No repetir</span><div class="row">${seg('noRepeat', [[1, 'Juego seguido: no'], [0, 'Da igual']], R.noRepeat ? 1 : 0)}${seg('noRepeatMap', [[1, 'Escenario seguido: no'], [0, 'Da igual']], R.noRepeatMap ? 1 : 0)}</div></div>
      <div class="field"><span class="lbl">Personajes (pilotos, magos…)</span>${seg('chars', [['pick', 'Cada quien elige'], ['random', 'Al azar'], ['keep', 'Los de siempre']], R.chars)}<span class="hint">«Cada quien elige» abre la pantalla de elección del juego, con el modo y el escenario ya puestos.</span></div>
      <div class="field"><span class="lbl">Lados (quién es J1 y quién J2)</span>${seg('swapSides', [[1, 'Cambian en cada prueba'], [0, 'Siempre los mismos']], R.swapSides ? 1 : 0)}</div>
      <div class="field"><label for="tname">Nombre del torneo</label><input class="textin" id="tname" maxlength="32" value="${esc(W.name)}"><div class="chips" style="margin-top:2px">${['Copa Galaxia', 'Liga de los viernes', 'Gran Clásico', 'Copa Esmeralda', 'El Mundialito'].map(n => `<button class="chipbtn" data-tname="${esc(n)}">${esc(n)}</button>`).join('')}</div></div>
      ${wfoot()}`;
  }
  function estimate() {
    const games = GAMES.filter(g => W.pool[g.id].on), avg = games.length ? games.reduce((a, g) => a + g.modes.filter(m => W.pool[g.id].modes[m.id]).reduce((b, m) => b + m.mins, 0) / Math.max(1, g.modes.filter(m => W.pool[g.id].modes[m.id]).length), 0) / games.length : 3;
    const n = W.players.length, R = W.rules, need = b => Math.floor(b / 2) + 1, ex = b => b === 1 ? 1 : need(b) + 0.6;
    let ev;
    if (W.format === 'serie') ev = ex(R.bestOf);
    else if (W.format === 'liga') ev = n * (n - 1) / 2 * R.legs * ex(R.bestOf) + (R.final ? ex(R.final) : 0);
    else if (W.format === 'elim') ev = (n - 2) * ex(R.bestOf) + ex(R.finalBestOf) + (R.third && n >= 4 ? ex(R.bestOf) : 0);
    else ev = R.kingGoal * 1.8 + n;
    return { ev: Math.round(ev), mins: Math.round(ev * (avg + 1)) };
  }
  function stepSummary() {
    const R = W.rules, F = FORMATS[W.format], E = estimate(), games = GAMES.filter(g => W.pool[g.id].on);
    const fmt = W.format === 'serie' ? `al mejor de ${R.bestOf}` : W.format === 'liga' ? `${R.legs === 2 ? 'ida y vuelta' : 'una vuelta'}, cruces ${R.bestOf === 1 ? 'de una prueba' : 'al mejor de 3'}, puntos ${R.ptsW}-${R.ptsD}-${R.ptsL}${R.final ? `, final al mejor de ${R.final}` : ''}` : W.format === 'elim' ? `cruces ${R.bestOf === 1 ? 'de una prueba' : 'al mejor de ' + R.bestOf}, final ${R.finalBestOf === 1 ? 'de una prueba' : 'al mejor de ' + R.finalBestOf}${R.third ? ', con tercer puesto' : ''}` : `gana quien llegue a ${R.kingGoal} victorias`;
    return `<div class="h2">TODO LISTO</div>
      <div class="summary">
        <div><span class="k">Torneo</span><b>${esc(W.name)}</b></div>
        <div><span class="k">Jugadores</span><span class="row" style="gap:6px">${W.players.map((p, i) => `<span class="who"><i style="background:${p.color}"></i>${esc(p.name.trim() || 'Jugador ' + (i + 1))}</span>`).join(' · ')}</span></div>
        <div><span class="k">Formato</span><span><b>${F.name}</b> · ${fmt}</span></div>
        <div><span class="k">Juegos</span><span>${games.map(g => esc(g.name)).join(', ') || '<span style="color:var(--bad)">ninguno</span>'}</span></div>
        <div><span class="k">Sorteo</span><span>${({ azar: 'Al azar', rotar: 'Rotando los juegos', pierde: 'Elige el que va perdiendo', turnos: 'Por turnos' })[R.order]} · personajes: ${({ pick: 'cada quien elige', random: 'al azar', keep: 'los de siempre' })[R.chars]} · ${R.swapSides ? 'lados cambian' : 'lados fijos'}</span></div>
        <div><span class="k">Duración</span><span>Unas ${E.ev} pruebas · cerca de ${E.mins < 60 ? E.mins + ' minutos' : (E.mins / 60).toFixed(1).replace('.', ',') + ' horas'}</span></div>
      </div>${wfoot('¡Armar el torneo! ›')}`;
  }
  function validStep(s) {
    if (s === 0) { W.players.forEach((p, i) => { if (!p.name.trim()) p.name = 'Jugador ' + (i + 1); }); const names = W.players.map(p => p.name.trim().toLowerCase()); if (new Set(names).size !== names.length) { notify('Hay dos jugadores con el mismo nombre.'); return false; } }
    if (s === 2) { const ok = GAMES.some(g => W.pool[g.id].on && g.modes.some(m => W.pool[g.id].modes[m.id] && Torneo.enabledMaps({ pool: W.pool }, g, m.id).length)); if (!ok) { notify('Enciende al menos un juego con un modo y un escenario.'); return false; } }
    return true;
  }
  function bindWizard(el) {
    const re = () => renderWizard(el);
    $$('[data-w]', el).forEach(b => b.onclick = () => {
      const a = b.dataset.w;
      if (a === 'prev') { Snd.back(); W.step = Math.max(0, W.step - 1); re(); }
      else if (a === 'next') { if (!validStep(W.step)) return; if (W.step < 4) { Snd.click(); W.step++; re(); } else startTour(); }
      else if (a === 'add') { Snd.click(); addPlayer(); re(); setTimeout(() => { const i = $$('[data-name]', el).pop(); if (i) i.focus(); }, 30); }
    });
    $$('[data-preset]', el).forEach(b => b.onclick = () => { Snd.click(); PRESETS[+b.dataset.preset].apply(); W.step = 0; re(); notify(`Formato «${PRESETS[+b.dataset.preset].name}» listo: pon los nombres y sigue.`); });
    $$('[data-name]', el).forEach(i => { i.oninput = () => { W.players[+i.dataset.name].name = i.value; }; i.onkeydown = e => { if (e.key === 'Enter') { const n = $$('[data-name]', el)[+i.dataset.name + 1]; if (n) n.focus(); else $('[data-w="next"]', el).click(); } }; });
    $$('[data-color]', el).forEach(b => b.onclick = () => { const p = W.players[+b.dataset.color], k = COLORS.indexOf(p.color); p.color = COLORS[(k + 1) % COLORS.length]; Snd.click(); re(); });
    $$('[data-del]', el).forEach(b => b.onclick = () => { if (W.players.length <= 2) return; W.players.splice(+b.dataset.del, 1); Snd.back(); re(); });
    $$('[data-recent]', el).forEach(b => b.onclick = () => { const empty = W.players.find(p => !p.name.trim()); if (empty) empty.name = b.dataset.recent; else if (W.players.length < 8) { addPlayer(); W.players[W.players.length - 1].name = b.dataset.recent; } Snd.click(); re(); });
    $$('[data-format]', el).forEach(b => b.onclick = () => { Snd.click(); setFormat(b.dataset.format); re(); });
    $$('[data-seg]', el).forEach(sg => $$('button', sg).forEach(b => b.onclick = () => {
      const k = sg.dataset.seg, v = b.dataset.v, R = W.rules; Snd.click();
      if (k === 'pts') { const [a, d, l] = v.split('-').map(Number); R.ptsW = a; R.ptsD = d; R.ptsL = l; }
      else if (['bestOf', 'legs', 'final', 'finalBestOf', 'kingGoal'].includes(k)) R[k] = +v;
      else if (['third', 'noRepeat', 'noRepeatMap', 'swapSides'].includes(k)) R[k] = v === '1';
      else R[k] = v;
      re();
    }));
    $$('[data-gopen]', el).forEach(b => b.onclick = e => { if (e.target.closest('.tgl')) return; e.stopPropagation(); const id = b.dataset.gopen; W.open[id] = !W.open[id]; if (W.open[id] && !W.pool[id].on) W.pool[id].on = true; Snd.click(); re(); });
    $$('[data-gon]', el).forEach(b => b.onclick = e => { e.stopPropagation(); const P = W.pool[b.dataset.gon]; P.on = !P.on; Snd.click(); re(); });
    $$('[data-gmode]', el).forEach(b => b.onclick = () => { const [g, m] = b.dataset.gmode.split(':'); const P = W.pool[g]; P.modes[m] = !P.modes[m]; Snd.click(); re(); });
    $$('[data-gmap]', el).forEach(b => b.onclick = () => { const [g, m] = b.dataset.gmap.split(':'); const P = W.pool[g]; P.maps[m] = !P.maps[m]; Snd.click(); re(); });
    $$('[data-gall]', el).forEach(b => b.onclick = () => { const g = GAME[b.dataset.gall], P = W.pool[g.id], all = g.maps.every(m => P.maps[m[0]]); g.maps.forEach(m => { P.maps[m[0]] = !all; }); Snd.click(); re(); });
    $$('[data-garena]', el).forEach(b => b.onclick = () => { const [g, m] = b.dataset.garena.split(':'); const P = W.pool[g]; P.arenas[m] = P.arenas[m] === false; Snd.click(); re(); });
    $$('[data-glen]', el).forEach(sg => $$('button', sg).forEach(b => b.onclick = () => { W.pool[sg.dataset.glen].len = b.dataset.v; Snd.click(); re(); }));
    $$('[data-gopt]', el).forEach(sg => $$('button', sg).forEach(b => b.onclick = () => { const [g, o] = sg.dataset.gopt.split(':'), def = GAME[g].opts.find(x => x.id === o); W.pool[g].opts[o] = def.type === 'bool' ? b.dataset.v === '1' : +b.dataset.v; Snd.click(); re(); }));
    const tn = $('#tname', el); if (tn) tn.oninput = () => { W.name = tn.value; };
    $$('[data-tname]', el).forEach(b => b.onclick = () => { W.name = b.dataset.tname; Snd.click(); re(); });
  }
  function startTour() {
    W.players.forEach((p, i) => { if (!p.name.trim()) p.name = 'Jugador ' + (i + 1); });
    Store.set('lastPlayers', W.players); Store.set('lastPool', W.pool);
    const names = Store.get('names', []); W.players.forEach(p => { const n = p.name.trim(); const k = names.findIndex(x => x.toLowerCase() === n.toLowerCase()); if (k >= 0) names.splice(k, 1); names.unshift(n); }); Store.set('names', names.slice(0, 24));
    Tour.T = Torneo.create({ name: W.name.trim() || 'Copa Galaxia', players: W.players, format: W.format, rules: W.rules, pool: W.pool });
    Tour.save(); W = null; Snd.shuffle(); renderTorneo();
  }

  /* ---------- tablero del torneo ---------- */
  function ensureEvent(T) {
    let ev = Torneo.curEvent(T);
    if (!ev && !T.done) { const m = Torneo.nextMatch(T); if (m) { ev = Torneo.makeEvent(T, m); Tour.save(); } }
    return ev;
  }
  function renderDash(el) {
    const T = Tour.T, ev = ensureEvent(T), P = Torneo.progress(T), F = FORMATS[T.format];
    el.innerHTML = `<div class="wrap">
      <div class="thead"><div style="flex:1;min-width:260px"><h1 class="h1">${esc(T.name)}</h1><div class="meta">${F.name} · ${T.players.length} jugadores · prueba ${Math.min(P.played + (T.done ? 0 : 1), P.total)} de unas ${P.total}</div><div class="prog"><i style="width:${Math.round(100 * P.played / Math.max(1, P.total))}%"></i></div></div>
        <div class="row">${T.done ? '<button class="btn gold" data-t="champ">Ver campeón</button>' : ''}<button class="btn small" data-t="copy">Copiar resumen</button><button class="btn small" data-t="undo" ${canUndo(T) ? '' : 'hidden'}>Deshacer último resultado</button><button class="btn small danger" data-t="end">${T.done ? 'Nuevo torneo' : 'Terminar torneo'}</button></div></div>
      <div class="dash">
        <div class="stack">${T.done ? doneCard(T) : ev ? (ev.status === 'choose' ? chooseCard(T, ev) : eventCard(T, ev)) : ''}${formatBoard(T, ev)}</div>
        <div class="side">${T.format === 'liga' || T.format === 'rey' ? '' : `<div class="panel"><div class="h2">TABLA</div>${tableHTML(T, true)}</div>`}<div class="panel"><div class="h2">PRUEBAS JUGADAS</div>${histHTML(T)}</div></div>
      </div></div>`;
    $$('[data-t]', el).forEach(b => b.onclick = () => dashAct(b.dataset.t, b));
    $$('[data-choose]', el).forEach(b => b.onclick = () => { Snd.click(); Torneo.chooseFor(T, b.dataset.choose); Tour.save(); renderDash(el); });
  }
  function canUndo(T) { const d = T.events.filter(e => e.status === 'done'); if (!d.length || T.format === 'rey' || T.format === 'elim' || T.done) return false; const m = T.matches.find(x => x.id === d[d.length - 1].match); return m && !m.done; }
  function matchLine(T, m) { if (!m) return ''; const wa = m.wins[m.a] || 0, wb = m.wins[m.b] || 0; return m.bestOf > 1 ? `${esc(m.stage)} · ${esc(tName(m.a))} ${wa} – ${wb} ${esc(tName(m.b))} · al mejor de ${m.bestOf}` : esc(m.stage); }
  function plHTML(id, j, keys) { return `<div class="pl"><span class="av" style="background:${tColor(id)}">${esc(initials(tName(id)))}</span><div><b>${esc(tName(id))}</b><small>${j}${keys ? ' · ' + esc(keys) : ''}</small></div></div>`; }
  function eventCard(T, ev) {
    const g = GAME[ev.game], M = g.modes.find(m => m.id === ev.mode), m = T.matches.find(x => x.id === ev.match);
    const len = M.len && ev.rounds ? ' · ' + M.lenTxt(ev.rounds) : '';
    const charTxt = g.chars ? ` · ${g.charsName}: ${({ pick: 'cada quien elige', random: 'al azar', keep: 'los de siempre' })[ev.chars]}` : '';
    const optTxt = (g.opts || []).map(o => o.type === 'bool' ? (ev.opts && ev.opts[o.id] ? ' · ' + o.name : '') : ` · ${o.name.toLowerCase()}: ${o.items.find(x => x[0] === (ev.opts || {})[o.id])?.[1].toLowerCase() || ''}`).join('');
    return `<div class="evcard" style="${gvars(g)}"><div class="art"><img src="${shot(g, ev.n)}" alt=""></div><div class="in">
      <div class="tag">PRUEBA ${ev.n} · ${matchLine(T, m)}</div>
      ${glogo(g)}
      <div class="what">${esc(M.name)} <span>en</span> ${esc(mapName(g, ev.map))}<span>${esc(len)}${esc(charTxt)}${esc(optTxt)}</span></div>
      <div class="vs">${plHTML(ev.j1, 'J1', touch ? 'izquierda' : g.keys[0][1].split(' · ')[0])}<span class="x">VS</span>${plHTML(ev.j2, 'J2', touch ? 'derecha' : g.keys[1][1].split(' · ')[0])}</div>
      <div class="evkeys"><b>J1</b> ${esc(g.keys[0][1])}<br><b>J2</b> ${esc(g.keys[1][1])}</div>
      <div class="row"><button class="btn gold big" data-t="play">${ICON.play} ¡A jugar!</button><button class="btn" data-t="rerollMode" title="Otro modo o escenario del mismo juego">Otro modo</button><button class="btn" data-t="reroll" title="Sortear otro juego">Otro juego</button><button class="btn ghost" data-t="manual">Anotar a mano</button></div>
    </div></div>`;
  }
  function chooseCard(T, ev) {
    const games = GAMES.filter(g => T.pool[g.id].on && Torneo.enabledModes(T, g).length);
    return `<div class="panel"><div class="h2">PRUEBA ${ev.n} · ${matchLine(T, T.matches.find(x => x.id === ev.match))}</div>
      <div class="vs" style="margin-bottom:12px">${plHTML(ev.j1, 'J1')}<span class="x">VS</span>${plHTML(ev.j2, 'J2')}</div>
      <p class="sub" style="margin:0 0 12px"><b style="color:${tColor(ev.chooser)}">${esc(tName(ev.chooser))}</b> ${T.rules.order === 'pierde' ? 'va perdiendo y' : 'tiene el turno:'} elige el juego. El modo y el escenario se sortean.</p>
      <div class="choose">${games.map(g => `<button data-choose="${g.id}" style="${gvars(g)}"><img src="${shot(g, 1)}" alt="">${glogo(g)}</button>`).join('')}</div></div>`;
  }
  function doneCard(T) {
    const c = T.champion;
    return `<div class="panel" style="text-align:center;padding:26px"><div style="width:90px;margin:0 auto 6px">${ICON.cup}</div><div class="h2" style="margin-bottom:6px">CAMPEÓN</div><div class="h1" style="color:${tColor(c)}">${esc(tName(c))}</div>
      <p class="sub" style="margin:10px auto 16px">${T.events.filter(e => e.status === 'done').length} pruebas jugadas en ${esc(T.name)}.</p>
      <div class="row" style="justify-content:center"><button class="btn gold" data-t="again">Revancha: mismo torneo</button><button class="btn" data-t="end">Nuevo torneo</button></div></div>`;
  }
  function tableHTML(T, compact) {
    const st = Torneo.standings(T), rey = T.format === 'rey', liga = T.format === 'liga';
    return `<table class="table"><thead><tr><th>#</th><th>Jugador</th>${liga ? '<th class="n">Pts</th><th class="n">PJ</th>' : ''}${rey ? '<th class="n">Vict.</th>' : ''}<th class="n" title="Pruebas ganadas">G</th><th class="n" title="Empatadas">E</th><th class="n" title="Perdidas">P</th></tr></thead><tbody>${st.map((r, i) => `<tr class="${T.done && r.id === T.champion ? 'me' : ''}"><td>${i + 1}</td><td><span class="who"><i style="background:${r.color}"></i>${esc(r.name)}${rey && r.id === T.king ? ' 👑' : ''}</span></td>${liga ? `<td class="n"><b>${r.pts}</b></td><td class="n">${r.mw + r.ml + r.md}</td>` : ''}${rey ? `<td class="n"><b>${r.pts}</b></td>` : ''}<td class="n">${r.w}</td><td class="n">${r.d}</td><td class="n">${r.l}</td></tr>`).join('')}</tbody></table>`;
  }
  function histHTML(T) {
    const d = T.events.filter(e => e.status === 'done').slice().reverse();
    if (!d.length) return '<div class="note">Todavía no se ha jugado ninguna prueba.</div>';
    return `<div class="hist">${d.map(e => { const g = GAME[e.game]; return `<div><span class="gdot" style="background:${g.c1}"></span><span>${e.n}. ${esc(g.short)} · ${esc(modeName(e))}<br><small style="color:var(--mute)">${esc(tName(e.j1))} vs ${esc(tName(e.j2))} · ${esc(mapName(g, e.map))}${e.info && e.info.score ? ' · ' + esc(e.info.score) : ''}</small></span><span class="res" style="color:${e.winner === 'draw' ? 'var(--mute)' : tColor(e.winner)}">${e.winner === 'draw' ? 'Empate' : esc(tName(e.winner))}</span></div>`; }).join('')}</div>`;
  }
  function formatBoard(T, ev) {
    if (T.format === 'serie') {
      const m = T.matches[0], n = Torneo.need(m.bestOf), pip = id => Array.from({ length: n }, (_, i) => `<i style="display:inline-block;width:14px;height:14px;border-radius:50%;margin:0 3px;background:${i < (m.wins[id] || 0) ? tColor(id) : 'rgba(255,255,255,.12)'}"></i>`).join('');
      return `<div class="panel"><div class="h2">LA SERIE · AL MEJOR DE ${m.bestOf}</div><div class="row" style="justify-content:space-around;text-align:center;gap:20px">${[m.a, m.b].map(id => `<div><div class="who" style="justify-content:center;font-size:20px"><i style="background:${tColor(id)};width:16px;height:16px"></i>${esc(tName(id))}</div><div style="font:400 54px/1.1 var(--display);margin:6px 0">${m.wins[id] || 0}</div><div>${pip(id)}</div></div>`).join('<div style="font:400 26px var(--display);color:var(--gold)">–</div>')}</div>${m.draws ? `<p class="note" style="text-align:center;margin:10px 0 0">Empates: ${m.draws}</p>` : ''}</div>`;
    }
    if (T.format === 'liga') {
      const fin = T.matches.find(m => m.final), up = T.matches.filter(m => !m.done && !m.final && m !== (ev && T.matches.find(x => x.id === ev.match))).slice(0, 4);
      return `<div class="panel"><div class="h2">TABLA</div>${tableHTML(T)}${fin ? `<p class="note" style="margin:10px 0 0">Final al mejor de ${fin.bestOf} entre los dos primeros${fin.a ? `: <b>${esc(tName(fin.a))}</b> contra <b>${esc(tName(fin.b))}</b>` : ''}.</p>` : ''}</div>
        ${up.length ? `<div class="panel"><div class="h2">LO QUE SIGUE</div><div class="hist">${up.map(m => `<div><span>${esc(m.stage)}</span><span class="res"><span style="color:${tColor(m.a)}">${esc(tName(m.a))}</span> vs <span style="color:${tColor(m.b)}">${esc(tName(m.b))}</span></span></div>`).join('')}</div></div>` : ''}`;
    }
    if (T.format === 'elim') {
      const rounds = {}; T.matches.forEach(m => { const k = m.third ? 'third' : m.round; (rounds[k] = rounds[k] || []).push(m); });
      const curM = ev && ev.match;
      const box = m => { const side = id => { if (!id) return `<div class="tbd">${m.bye && !id ? '—' : 'por definir'}</div>`; const won = m.done && m.winner === id; return `<div class="${won ? 'w' : ''}"><span class="who"><i style="background:${tColor(id)}"></i>${esc(tName(id))}</span><span class="s">${m.bye ? (id ? 'pasa' : '') : m.events.length ? (m.wins[id] || 0) : ''}</span></div>`; }; return `<div class="bm ${m.id === curM ? 'cur' : ''}">${side(m.a)}${side(m.b)}</div>`; };
      const keys = Object.keys(rounds).filter(k => k !== 'third').map(Number).sort((a, b) => a - b);
      return `<div class="panel"><div class="h2">LLAVES</div><div class="bracket">${keys.map(k => `<div class="bcol"><h4>${esc(rounds[k][0].stage.toUpperCase())}</h4>${rounds[k].map(box).join('')}${rounds.third && k === keys[keys.length - 1] ? `<h4 style="margin-top:14px">TERCER PUESTO</h4>${rounds.third.map(box).join('')}` : ''}</div>`).join('')}</div></div>`;
    }
    if (T.format === 'rey') {
      return `<div class="panel"><div class="h2">REY DE LA PISTA · PRIMERO A ${T.rules.kingGoal}</div><div class="kingbox">${ICON.crown}<div><div style="font-size:12px;color:var(--mute);font-weight:900;letter-spacing:.1em">EN EL TRONO</div><div class="who" style="font-size:22px"><i style="background:${tColor(T.king)}"></i>${esc(tName(T.king))}</div><div class="note">${T.kingWins[T.king] || 0} victorias · racha de ${(T.stats[T.king] && T.stats[T.king].streak) || 0}</div></div></div>
        <div style="margin-top:12px;font-weight:900;font-size:13px;color:var(--mute)">LA FILA</div><div class="queue">${T.queue.map((id, i) => `<span style="border:1px solid ${tColor(id)}">${i + 1}. ${esc(tName(id))}</span>`).join('')}</div>
        <div style="margin-top:12px">${tableHTML(T)}</div></div>`;
    }
    return '';
  }
  function dashAct(a) {
    const T = Tour.T, ev = Torneo.curEvent(T);
    if (a === 'play' && ev) { Snd.open(); Launcher.open(ev.game, ev); }
    else if (a === 'reroll') { Snd.shuffle(); Torneo.reroll(T, false); Tour.save(); renderTorneo(); }
    else if (a === 'rerollMode') { Snd.shuffle(); Torneo.reroll(T, true); Tour.save(); renderTorneo(); }
    else if (a === 'manual' && ev) manual(ev);
    else if (a === 'undo') { if (Torneo.undo(T)) { Tour.save(); Snd.back(); renderTorneo(); } }
    else if (a === 'champ') Champ.show(T, true);
    else if (a === 'copy') {
      const txt = summaryText(T);
      const done = () => notify('Resumen copiado: pégalo en el chat del grupo.');
      try { navigator.clipboard.writeText(txt).then(done, () => openModal(`<h3>Resumen del torneo</h3><p>Cópialo de aquí:</p><textarea class="textin" style="max-width:none;height:220px;font-size:13px" readonly>${esc(txt)}</textarea><div class="mbtns" style="margin-top:12px"><button class="btn gold" data-mclose>Listo</button></div>`)); } catch (e) { openModal(`<h3>Resumen del torneo</h3><textarea class="textin" style="max-width:none;height:220px;font-size:13px" readonly>${esc(txt)}</textarea><div class="mbtns" style="margin-top:12px"><button class="btn gold" data-mclose>Listo</button></div>`); }
    }
    else if (a === 'again') { const T0 = Tour.T; Tour.T = Torneo.create({ name: T0.name, players: T0.players.map(p => ({ name: p.name, color: p.color })), format: T0.format, rules: T0.rules, pool: T0.pool }); Tour.save(); Snd.shuffle(); renderTorneo(); }
    else if (a === 'end') {
      if (T.done) { Tour.T = null; Store.del('tour'); W = null; renderTorneo(); return; }
      confirmBox('¿Terminar el torneo?', 'Se pierde lo jugado de este torneo (no entra al salón de la fama).', 'Sí, terminarlo', () => { Tour.T = null; Store.del('tour'); W = null; renderTorneo(); });
    }
  }
  function summaryText(T) {
    const F = FORMATS[T.format], st = Torneo.standings(T), L = [`🏆 ${T.name} · ${F.name}`];
    if (T.done) L.push(`¡Campeón: ${tName(T.champion)}!`);
    if (T.format === 'serie') { const m = T.matches[0]; L.push(`${tName(m.a)} ${m.wins[m.a] || 0} – ${m.wins[m.b] || 0} ${tName(m.b)} (al mejor de ${m.bestOf})`); }
    else st.forEach((r, i) => L.push(`${i + 1}. ${r.name} — ${T.format === 'liga' ? r.pts + ' pts · ' : T.format === 'rey' ? r.pts + ' victorias · ' : ''}${r.w} ganadas, ${r.l} perdidas`));
    const d = T.events.filter(e => e.status === 'done');
    if (d.length) { L.push('', 'Pruebas:'); d.forEach(e => { const g = GAME[e.game]; L.push(`${e.n}. ${g.short} · ${modeName(e)} (${mapName(g, e.map)}): ${tName(e.j1)} vs ${tName(e.j2)} → ${e.winner === 'draw' ? 'empate' : 'gana ' + tName(e.winner)}`); }); }
    return L.join('\n');
  }
  function manual(ev) {
    const g = GAME[ev.game];
    openModal(`<h3>¿Cómo quedó la prueba ${ev.n}?</h3><p>${esc(g.name)} · ${esc(modeName(ev))} en ${esc(mapName(g, ev.map))}.</p>
      <div class="pickw"><button data-mw="${ev.j1}"><span class="av" style="background:${tColor(ev.j1)}">${esc(initials(tName(ev.j1)))}</span>Ganó ${esc(tName(ev.j1))}</button><button data-mw="draw" style="padding:16px 14px">Empate</button><button data-mw="${ev.j2}"><span class="av" style="background:${tColor(ev.j2)}">${esc(initials(tName(ev.j2)))}</span>Ganó ${esc(tName(ev.j2))}</button></div>
      <div class="mbtns"><button class="btn ghost" data-mclose>Cancelar</button></div>`);
    $$('[data-mw]').forEach(b => b.onclick = () => { closeModal(); Tour.result(ev.id, b.dataset.mw, { manual: true }); Snd.ok(); renderTorneo(); if (Tour.T.done) Champ.show(Tour.T); });
  }
  function archive(T) {
    if (T.archived) return; T.archived = true; Tour.save();
    const H = Store.get('fame', []);
    H.unshift({ id: T.id, name: T.name, format: T.format, date: T.ended || Date.now(), players: T.players, champion: T.champion, podium: T.podium, events: T.events.filter(e => e.status === 'done').map(e => ({ g: e.game, w: e.winner, a: e.j1, b: e.j2 })) });
    Store.set('fame', H.slice(0, 60));
  }

  /* ---------- campeón ---------- */
  const Champ = (() => {
    let raf = 0;
    function show(T, again) {
      T.celebrated = true; Tour.save();
      const el = $('#champ'), c = T.champion, pod = T.podium || [];
      el.innerHTML = `<canvas id="confetti"></canvas><div class="cbox"><div class="trophy">${ICON.cup}</div><div class="k">${esc(T.name.toUpperCase())}</div><div class="name" style="color:${tColor(c)}">${esc(tName(c))}</div><div style="font-weight:900;color:var(--mute)">¡Campeón de la galaxia!</div>
        ${pod.length > 1 ? `<div class="podium">${pod[1] ? `<div class="p2"><small>2.º</small>${esc(tName(pod[1]))}</div>` : ''}<div class="p1"><small>1.º</small>${esc(tName(pod[0]))}</div>${pod[2] ? `<div class="p3"><small>3.º</small>${esc(tName(pod[2]))}</div>` : ''}</div>` : ''}
        <div class="row" style="justify-content:center;margin-top:8px"><button class="btn gold" data-cx="see">Ver el torneo</button><button class="btn" data-cx="fame">Salón de la fama</button></div></div>`;
      el.hidden = false; if (!again) Snd.fanfare();
      $$('[data-cx]', el).forEach(b => b.onclick = () => { hide(); go(b.dataset.cx === 'fame' ? 'fama' : 'torneo'); });
      confetti();
    }
    function hide() { $('#champ').hidden = true; cancelAnimationFrame(raf); }
    function confetti() {
      const cv = $('#confetti'), x = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1);
      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; x.scale(dpr, dpr);
      const P = Array.from({ length: 180 }, () => ({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight, vx: (Math.random() - 0.5) * 60, vy: 80 + Math.random() * 160, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 8, s: 5 + Math.random() * 7, c: COLORS[Math.floor(Math.random() * COLORS.length)] }));
      let last = performance.now();
      const fr = now => { const dt = Math.min(0.05, (now - last) / 1000); last = now; x.clearRect(0, 0, innerWidth, innerHeight); for (const p of P) { p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; if (p.y > innerHeight + 20) { p.y = -20; p.x = Math.random() * innerWidth; } x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore(); } raf = requestAnimationFrame(fr); };
      cancelAnimationFrame(raf); raf = requestAnimationFrame(fr);
    }
    return { show, hide };
  })();

  /* ---------- salón de la fama ---------- */
  function renderFame() {
    const H = Store.get('fame', []), el = $('#v-fama');
    const by = {}; H.forEach(t => { t.players.forEach(p => { const k = p.name.trim().toLowerCase(); const r = by[k] = by[k] || { name: p.name, color: p.color, cups: 0, pods: 0, w: 0, played: 0, games: {} }; }); const nm = id => (t.players.find(p => p.id === id) || {}).name || ''; const r0 = by[nm(t.champion).trim().toLowerCase()]; if (r0) r0.cups++; (t.podium || []).forEach(id => { const r = by[nm(id).trim().toLowerCase()]; if (r) r.pods++; }); (t.events || []).forEach(e => { [e.a, e.b].forEach(id => { const r = by[nm(id).trim().toLowerCase()]; if (r) r.played++; }); if (e.w && e.w !== 'draw') { const r = by[nm(e.w).trim().toLowerCase()]; if (r) { r.w++; r.games[e.g] = (r.games[e.g] || 0) + 1; } } }); });
    const rank = Object.values(by).sort((a, b) => b.cups - a.cups || b.w - a.w || b.pods - a.pods);
    el.innerHTML = `<div class="wrap"><div class="thead"><div><h1 class="h1">Salón de la fama</h1><p class="sub">Los campeones de cada torneo que se termina quedan aquí, con sus copas y sus pruebas ganadas.</p></div></div>
      ${H.length ? `<div class="grid2" style="align-items:start"><div class="panel"><div class="h2">RANKING GENERAL</div><table class="table"><thead><tr><th>#</th><th>Jugador</th><th class="n">Copas</th><th class="n">Podios</th><th class="n">Pruebas ganadas</th><th>Su juego</th></tr></thead><tbody>${rank.map((r, i) => { const best = Object.entries(r.games).sort((a, b) => b[1] - a[1])[0]; return `<tr><td>${i + 1}</td><td><span class="who"><i style="background:${r.color}"></i>${esc(r.name)}</span></td><td class="n"><b>${r.cups}</b></td><td class="n">${r.pods}</td><td class="n">${r.w} de ${r.played}</td><td>${best ? esc(GAME[best[0]].short) : '—'}</td></tr>`; }).join('')}</tbody></table></div>
        <div class="fame">${H.map(t => { const ch = t.players.find(p => p.id === t.champion) || {}; return `<div class="fcard"><div class="when">${new Date(t.date).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })} · ${FORMATS[t.format].name}</div><div class="tn">${esc(t.name)}</div><div class="champ">${ICON.cup}<span style="color:${ch.color || '#fff'}">${esc(ch.name || '—')}</span></div><div class="note">${t.players.length} jugadores · ${(t.events || []).length} pruebas · ${[...new Set((t.events || []).map(e => GAME[e.g] && GAME[e.g].short))].filter(Boolean).join(', ')}</div></div>`; }).join('')}</div></div>`
        : `<div class="panel empty">${ICON.cup}<div style="font-weight:900;color:var(--text);font-size:18px">Todavía no hay campeones</div><p class="sub" style="margin:8px auto 16px">Arma un torneo y el primero que lo gane estrena el salón.</p><button class="btn gold" data-go="torneo">Armar un torneo</button></div>`}
    </div>`;
  }

  /* ---------- ajustes ---------- */
  function renderSettings() {
    const el = $('#v-ajustes'), vs = Store.get('versions', {});
    const tg = (k, on, t, d) => `<div class="field"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><div><div style="font-weight:900">${t}</div><div class="hint" style="margin:2px 0 0">${d}</div></div><button class="tgl" data-set="${k}" aria-pressed="${on}" aria-label="${t}"></button></div></div>`;
    const st = App.state();
    el.innerHTML = `<div class="wrap" style="max-width:820px"><div class="thead"><div><h1 class="h1">Ajustes</h1><p class="sub">Los de GameHub. Cada juego tiene además sus propias opciones adentro (teclas, calidad, sonido, pantalla completa…), y no se tocan entre sí.</p></div></div>
      <div class="stack">
      <div class="panel">
        <div class="h2">LA APP</div>
        <div class="field"><div class="appline"><div class="grow"><div style="font-weight:900">${st.installed ? 'GameHub está instalada en este aparato' : 'Instalar GameHub'}</div><div class="hint" style="margin:2px 0 0">${st.installed ? 'Se abre desde su ícono, a pantalla completa, y funciona sin internet.' : st.hosted ? 'Queda con su ícono como una app: se abre a pantalla completa, funciona sin internet y se actualiza sola.' : 'Se puede instalar desde la página de GameHub en GitHub (en esta vista previa no).'}</div></div>${!st.installed && st.hosted ? `<button class="btn gold small" data-app="install">${ICON.down} Instalar</button>` : st.installed ? '<span class="vtag">INSTALADA</span>' : ''}</div></div>
        <div class="field"><div class="appline"><div class="grow"><div style="font-weight:900">Versión <span class="vtag">${esc(BUILD.v)}</span></div><div class="hint" style="margin:2px 0 0">${BUILD.date ? 'Publicada el ' + esc(new Date(BUILD.date + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })) + '. ' : ''}Cuando sale algo nuevo (un mundo, un modo, arreglos), la app se actualiza sola y avisa. Tu progreso no se toca.</div></div>${st.hosted ? '<button class="btn small" data-app="update">Buscar actualización</button>' : ''}</div></div>
        <div class="field"><div class="appline"><div class="grow"><div style="font-weight:900">Tu progreso</div><div class="hint" style="margin:2px 0 0">Récords, campañas, mundos, ajustes y torneos de los 4 juegos se guardan en este aparato y siguen intactos con cada actualización. ${st.persisted ? 'Está protegido: el navegador no lo borra solo.' : 'Para protegerlo del todo, instala la app o guarda una copia de vez en cuando.'}</div></div></div>
          <div class="row"><button class="btn small" data-app="export">${ICON.down} Guardar copia de seguridad</button><button class="btn small" data-app="import">Restaurar una copia</button></div></div>
      </div>
      <div class="panel">
        <div class="h2">AL JUGAR</div>
        ${tg('fsPlay', SET.fsPlay, 'Pantalla completa automática', 'Al abrir un juego se pone sola la pantalla completa (en celular, también horizontal). Dentro de cada juego, en Opciones, está el botón para ponerla o quitarla a mano.')}
        ${tg('sound', SET.sound, 'Sonidos de GameHub', 'Los clics y la fanfarria del campeón. El sonido de cada juego se maneja en el juego.')}
        <div class="field"><span class="lbl">Los juegos</span><div class="keys">${GAMES.map(g => `<div><b style="background:${g.c1}">${g.num}</b><span>${esc(g.name)} ${vs[g.id] ? '· versión ' + esc(vs[g.id]) : '· aún sin abrir aquí'} · guarda con su propio nombre</span></div>`).join('')}</div></div>
        <div class="field"><span class="lbl">Borrar datos de GameHub</span><div class="row"><button class="btn small danger" data-clear="tour">Borrar el torneo en curso</button><button class="btn small danger" data-clear="fame">Borrar el salón de la fama</button><button class="btn small danger" data-clear="names">Olvidar nombres recientes</button></div><span class="hint">Esto no borra nada de los juegos.</span></div>
        <div class="field"><span class="lbl">Acerca de</span><p class="note" style="margin:0">GameHub reúne Tira y Afloja, Ventolera, Sortilegio y VÉRTIGO. Cada juego corre aparte, en su propio marco: lo que guarda uno (ajustes, récords, campañas) nunca toca a los otros.</p></div>
      </div></div></div>`;
    $$('[data-set]', el).forEach(b => b.onclick = () => { const k = b.dataset.set; SET[k] = !SET[k]; saveSet(); Snd.click(); renderSettings(); });
    $$('[data-clear]', el).forEach(b => b.onclick = () => { const k = b.dataset.clear; confirmBox('¿Seguro?', k === 'tour' ? 'Se borra el torneo que está en curso.' : k === 'fame' ? 'Se borran todos los campeones guardados.' : 'Se olvidan los nombres que salen como sugerencia.', 'Sí, borrar', () => { if (k === 'tour') { Tour.T = null; Store.del('tour'); } else Store.del(k === 'names' ? 'names' : 'fame'); notify('Listo.'); }); });
    $$('[data-app]', el).forEach(b => b.onclick = () => { Snd.click(); App[b.dataset.app](); });
  }

  /* ---------- app instalable, actualizaciones sin perder nada y copia de seguridad ---------- */
  const App = (() => {
    // fuera de la vista previa (en GitHub Pages, con https) se puede instalar y trabajar sin internet
    const hosted = (/^https:$/.test(location.protocol) || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) && !/(^|\.)claude\.(ai|site)$|claudeusercontent|anthropic/.test(location.hostname);
    const installed = () => { try { return matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true; } catch (e) { return false; } };
    const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const PREFIXES = ['tya_', 'vto_', 'srt_', 'vtg_', PRE];
    let deferred = null, persisted = false, pendingUpdate = false;
    const btn = $('#instbtn');
    const refreshBtn = () => { btn.hidden = !hosted || installed() || !(deferred || ios); };
    addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; refreshBtn(); if (view === 'ajustes') renderSettings(); });
    addEventListener('appinstalled', () => { deferred = null; refreshBtn(); persist(); notify('¡GameHub quedó instalada! Ábrela desde su ícono.'); if (view === 'ajustes') renderSettings(); });
    btn.addEventListener('click', () => { Snd.click(); install(); });
    function persist() { try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().then(v => { persisted = v; }).catch(() => {}); } catch (e) { /* nada */ } }
    try { if (navigator.storage && navigator.storage.persisted) navigator.storage.persisted().then(v => { persisted = v; }).catch(() => {}); } catch (e) { /* nada */ }
    // pedir que el navegador no borre el progreso (se pide con el primer toque, que es cuando lo deja)
    addEventListener('pointerdown', () => { if (hosted) persist(); }, { once: true, capture: true });
    function install() {
      if (deferred) { const d = deferred; deferred = null; d.prompt(); d.userChoice.then(r => { refreshBtn(); if (r && r.outcome === 'accepted') persist(); }).catch(() => {}); return; }
      if (ios) {
        openModal(`<h3>Instalar GameHub en ${/iPad/.test(navigator.userAgent) || navigator.maxTouchPoints > 1 && !/iPhone/.test(navigator.userAgent) ? 'el iPad' : 'el iPhone'}</h3><p>Así queda con su ícono, a pantalla completa y funcionando sin internet:</p>
          <ol class="steps-ios"><li>Abre esta página en <b>Safari</b>.</li><li>Toca <b>Compartir</b> ${ICON.share} (abajo o arriba).</li><li>Elige <b>«Agregar a inicio»</b> ${ICON.plus} y luego <b>Agregar</b>.</li></ol><div class="mbtns"><button class="btn gold" data-mclose>Entendido</button></div>`);
        return;
      }
      openModal(`<h3>Instalar GameHub</h3><p>Tu navegador no mostró el botón directo. Se puede igual:</p><ol class="steps-ios"><li>En <b>Chrome</b> o <b>Edge</b>: menú <b>⋮</b> → <b>«Instalar GameHub»</b> (o «Agregar a la pantalla principal» en el celular).</li><li>En <b>Safari</b> del Mac: menú <b>Archivo → Agregar al Dock</b>.</li></ol><div class="mbtns"><button class="btn gold" data-mclose>Entendido</button></div>`);
    }
    // versión nueva: el service worker trae lo nuevo; se avisa (y nunca se recarga en medio de un juego)
    function showUpdate() {
      if (Launcher.open_) { pendingUpdate = true; return; }
      const u = $('#update'); u.innerHTML = '<span class="dot"></span><span>Hay una versión nueva de GameHub. Tu progreso queda igual.</span><button class="btn small gold" id="upgo">Actualizar</button><button class="btn small ghost" id="upno" aria-label="Después">✕</button>'; u.hidden = false;
      $('#upgo').onclick = () => location.reload(); $('#upno').onclick = () => { u.hidden = true; };
    }
    async function check(manual) {
      try {
        const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) throw 0; const j = await r.json();
        if (j.v && j.v !== BUILD.v) { showUpdate(); return true; }
        if (manual) notify('Ya tienes la versión más nueva.');
      } catch (e) { if (manual) notify('No se pudo revisar (¿sin internet?). Se revisa sola cuando vuelva la conexión.'); }
      return false;
    }
    function register() {
      if (!hosted || !('serviceWorker' in navigator)) return;
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
        reg.addEventListener('updatefound', () => { const nw = reg.installing; if (nw) nw.addEventListener('statechange', () => { if (nw.state === 'activated') check(false); }); });
        setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000);
        document.addEventListener('visibilitychange', () => { if (!document.hidden) { reg.update().catch(() => {}); check(false); } });
      }).catch(() => {});
      check(false);
    }
    // copia de seguridad: todo lo de los 4 juegos y de GameHub en un archivo (o un texto para pegar)
    function collect() { const data = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && PREFIXES.some(p => k.startsWith(p))) data[k] = localStorage.getItem(k); } } catch (e) { /* nada */ } return { app: 'GameHub', v: 1, date: new Date().toISOString(), build: BUILD.v, data }; }
    function exportBackup() {
      const json = JSON.stringify(collect()), name = `gamehub-progreso-${new Date().toISOString().slice(0, 10)}.json`, n = Object.keys(JSON.parse(json).data).length;
      openModal(`<h3>Copia de seguridad</h3><p>${n} datos guardados (récords, campañas, ajustes y torneos de los 4 juegos). ${hosted ? 'Guárdala como archivo, o copia el texto y pégalo en un chat o una nota.' : 'Copia el texto y guárdalo en un chat o una nota (en esta vista previa no se pueden descargar archivos).'}</p><div class="mbtns" style="justify-content:flex-start">${hosted ? `<button class="btn gold" id="bkfile">${ICON.down} Descargar archivo</button>` : ''}<button class="btn${hosted ? '' : ' gold'}" id="bkcopy">Copiar texto</button><button class="btn ghost" data-mclose>Cerrar</button></div>`);
      if ($('#bkfile')) $('#bkfile').onclick = () => { try { const b = new Blob([json], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); notify('Archivo listo: ' + name); } catch (e) { notify('Aquí no se pudo descargar: usa «Copiar texto».'); } };
      $('#bkcopy').onclick = () => { const ok = () => notify('Copia copiada: guárdala donde quieras.'); try { navigator.clipboard.writeText(json).then(ok, () => showText(json)); } catch (e) { showText(json); } };
    }
    function showText(json) { openModal(`<h3>Copia de seguridad</h3><p>Selecciona todo el texto y cópialo:</p><textarea class="textin" style="max-width:none;height:200px;font-size:12px" readonly>${esc(json)}</textarea><div class="mbtns"><button class="btn gold" data-mclose>Listo</button></div>`); const t = $('#modal textarea'); t.focus(); t.select(); }
    function importBackup() {
      openModal(`<h3>Restaurar una copia</h3><p>Elige el archivo de la copia (o pega su texto). Reemplaza el progreso de este aparato por el de la copia.</p><div class="row" style="margin-bottom:10px"><label class="btn small" style="cursor:pointer">Elegir archivo<input type="file" id="bkin" accept=".json,application/json,text/plain" hidden></label></div><textarea class="textin" id="bktxt" style="max-width:none;height:120px;font-size:12px" placeholder="…o pega aquí el texto de la copia"></textarea><div class="mbtns" style="margin-top:12px"><button class="btn ghost" data-mclose>Cancelar</button><button class="btn gold" id="bkgo">Restaurar</button></div>`);
      $('#bkin').onchange = e => { const f = e.target.files && e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { $('#bktxt').value = String(r.result || ''); }; r.readAsText(f); };
      $('#bkgo').onclick = () => {
        let j = null; try { j = JSON.parse($('#bktxt').value); } catch (e) { j = null; }
        if (!j || j.app !== 'GameHub' || !j.data || typeof j.data !== 'object') { notify('Eso no parece una copia de GameHub.'); return; }
        const keys = Object.keys(j.data).filter(k => PREFIXES.some(p => k.startsWith(p)) && typeof j.data[k] === 'string');
        confirmBox('¿Restaurar la copia?', `Se cargan ${keys.length} datos de la copia del ${new Date(j.date).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })} y se reemplaza el progreso actual de este aparato.`, 'Sí, restaurar', () => {
          try { const old = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && PREFIXES.some(p => k.startsWith(p))) old.push(k); } old.forEach(k => localStorage.removeItem(k)); keys.forEach(k => localStorage.setItem(k, j.data[k])); } catch (e) { notify('No se pudo guardar en este aparato.'); return; }
          notify('Copia restaurada. Recargando…'); setTimeout(() => location.reload(), 900);
        });
      };
    }
    refreshBtn();
    return {
      register, state: () => ({ hosted, installed: installed(), persisted, ios }),
      install, update: () => check(true), export: exportBackup, import: importBackup,
      afterGame() { if (pendingUpdate) { pendingUpdate = false; showUpdate(); } },
    };
  })();

  /* ---------- modal y avisos ---------- */
  function openModal(html) { const m = $('#modal'); m.innerHTML = `<div class="mbox" role="dialog" aria-modal="true">${html}</div>`; m.hidden = false; $$('[data-mclose]', m).forEach(b => b.onclick = () => { Snd.back(); closeModal(); }); m.onclick = e => { if (e.target === m) closeModal(); }; const f = $('button', m); if (f) f.focus(); }
  function closeModal() { $('#modal').hidden = true; }
  function confirmBox(t, p, yes, fn) { openModal(`<h3>${esc(t)}</h3><p>${esc(p)}</p><div class="mbtns"><button class="btn ghost" data-mclose>Cancelar</button><button class="btn gold" data-myes>${esc(yes)}</button></div>`); $('[data-myes]').onclick = () => { closeModal(); fn(); }; }
  function notify(msg) { const t = $('#notify'); t.textContent = msg; t.classList.add('show'); clearTimeout(notify.t); notify.t = setTimeout(() => t.classList.remove('show'), 2600); }
  addEventListener('keydown', e => { if (e.key === 'Escape' && !Launcher.open_) { if (!$('#modal').hidden) closeModal(); else if (!$('#champ').hidden) Champ.hide(); else if (view === 'game') go('home'); } });

  /* ---------- pantalla completa ---------- */
  $('#fsbtn').addEventListener('click', () => { Snd.click(); FS.toggle().then(ok => { if (!ok) notify(FS.help()); }); });

  /* ---------- arranque ---------- */
  const h = (location.hash || '').slice(1);
  if (h.startsWith('ficha-') && GAME[h.slice(6)]) go('game', h.slice(6), false);
  else if (['torneo', 'fama', 'ajustes'].includes(h)) go(h, null, false);
  else go('home', null, false);
  BG.start();
  // en GitHub Pages: app instalable, sin internet y con actualizaciones que no tocan el progreso
  App.register();
  window.GAMEHUB = { Tour, Torneo, Launcher, go, GAMES, FS, App };
})();
