/* =========================================================================
   MODO FIESTA — cada ronda sale una sorpresa distinta (con ruleta al empezar).
   Se enciende en la pantalla de arenas. En «Atrapa chicles» la sorpresa
   cambia cada 25 segundos (sin las de tamaño).
   ========================================================================= */
const Fiesta = (() => {
  const MODS = [
    { id: 'luna', name: 'GRAVEDAD LUNAR', sub: 'Saltos altísimos y caídas lentas', col: '#b9a8ff' },
    { id: 'caliente', name: 'CHICLE DERRETIDO', sub: 'El hilo está caliente y estira como loco', col: '#ff9a3c' },
    { id: 'congelado', name: 'CHICLE CONGELADO', sub: 'El hilo está tieso: empuja y no cede', col: '#8fd3ff' },
    { id: 'jabon', name: 'PISO ENJABONADO', sub: 'Todo resbala: frena con tiempo', col: '#7fe0d0' },
    { id: 'gigantes', name: 'GIGANTES', sub: 'Pesados, fuertes y con el hilo cortico', col: '#ff7a66', size: true },
    { id: 'pulgas', name: 'PULGAS', sub: 'Livianitos, saltarines y con hilo largo', col: '#b7dc3c', size: true },
    { id: 'tijeras', name: 'TIJERAS LOCAS', sub: 'El hilo se corta a ratos', col: '#ffd84d', not: ['arte'] },
    { id: 'ventarron', name: 'VENTARRÓN', sub: 'Ráfagas de lado a lado: ¡pégate!', col: '#a8dcff', not: ['bus', 'laboratorio', 'torre'] },
  ];
  const BY = Object.fromEntries(MODS.map(m => [m.id, m]));
  const SPIN = 0.85, CARD_END = 2.0, CHICLES_EVERY = 25;
  const TIJ = { first: 4.5, calm: 6.5, warn: 1.3, cut: 2.6 };
  const VEN = { first: 3, calm: 3.6, warn: 1.3, gust: 2.8, push: 1900 };

  const F = {
    on: !!Store.get('fiesta', false),
    active: false,       // la partida actual es Fiesta
    cur: null,           // sorpresa aplicada
    shown: null,         // la que muestra la ruleta
    bag: [], last: null,
    rt: 9, seq: [], landed: true, pending: null, midRound: false,
    phase: 'calm', phaseT: 0, dir: 1, nextSwap: CHICLES_EVERY,
  };

  function setOn(v) { F.on = !!v; Store.set('fiesta', F.on); }

  function allowed(m, G) {
    if (m.not && m.not.includes(ARENA.id)) return false;
    if (G.mode !== 'caneca' && m.size) return false;
    return true;
  }
  function draw(G) {
    if (F.forced && BY[F.forced]) { F.last = F.forced; return F.forced; }
    const pool = MODS.filter(m => allowed(m, G));
    F.bag = F.bag.filter(id => pool.some(m => m.id === id));
    if (!F.bag.length) {
      F.bag = pool.map(m => m.id);
      for (let i = F.bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [F.bag[i], F.bag[j]] = [F.bag[j], F.bag[i]]; }
      if (F.bag.length > 1 && F.bag[F.bag.length - 1] === F.last) F.bag.unshift(F.bag.pop());
    }
    const id = F.bag.pop();
    F.last = id;
    return id;
  }

  function clearMods() {
    const M = ARENA.mods;
    M.gravity = 1; M.temp = 0; M.slip = 0;
    if (F.cur === 'ventarron') { M.push = 0; ARENA.pushWarn = 0; }
    if (F.cur === 'tijeras') M.cut = 0;
  }
  function applyMods(id) {
    clearMods();
    F.cur = id;
    if (typeof Progress !== 'undefined') Progress.on('fiesta', { id });
    const M = ARENA.mods;
    if (id === 'luna') M.gravity = 0.58;
    else if (id === 'caliente') M.temp = 0.95;
    else if (id === 'congelado') M.temp = -0.95;
    else if (id === 'jabon') M.slip = 1;
    F.phase = 'calm';
    F.phaseT = id === 'tijeras' ? TIJ.first : VEN.first;
    F.dir = Math.random() < 0.5 ? 1 : -1;
  }

  function startSpin(target, mid, G) {
    F.rt = 0; F.landed = false; F.pending = target; F.midRound = mid;
    // la ruleta pasa por varias sorpresas (de las que pueden salir aquí) y frena en la elegida
    const ids = MODS.filter(m => allowed(m, G) && m.id !== target).map(m => m.id);
    F.seq = [];
    for (let k = 0; k < 11; k++) F.seq.push(ids[(k * 3 + Math.floor(Math.random() * ids.length)) % ids.length]);
    F.seq.push(target);
    F.shown = F.seq[0];
  }

  /* Se llama en cada resetRound. Devuelve el plan de tamaños (o null). */
  function roll(G) {
    F.active = !!G.fiestaMatch && !G.quiet && !G.tutorial;
    clearMods(); F.cur = null;
    if (!F.active) { F.rt = 9; F.landed = true; return null; }
    const id = draw(G);
    applyMods(id);
    startSpin(id, false, G);
    F.nextSwap = CHICLES_EVERY;
    if (id === 'gigantes') return { mass: 5.0, len: 240 };
    if (id === 'pulgas') return { mass: 1.35, len: 700 };
    return null;
  }

  function off() { clearMods(); F.cur = null; F.active = false; F.rt = 9; F.landed = true; }

  /* cronómetro de la ruleta (tiempo real) */
  function tick(dt, G) {
    if (!F.active || F.rt > 8) return;
    const prevK = spinIndex(F.rt);
    F.rt += dt;
    const k = spinIndex(F.rt);
    if (k !== prevK && !F.landed) { F.shown = F.seq[k]; Sound.play('tick', k); }
    if (!F.landed && F.rt >= SPIN) {
      F.landed = true; F.shown = F.pending;
      Sound.play('party');
      const m = BY[F.pending];
      if (F.midRound) {
        applyMods(F.pending);
        FX.banner(m.name, { sub: m.sub, size: 84, life: 2, color: m.col, y: 0.3 });
      }
      FX.confetti(960, 120, 60, 900);
    }
  }
  function spinIndex(t) {
    const u = clamp(t / SPIN, 0, 1);
    const e = 1 - Math.pow(1 - u, 2.6);
    return Math.min(F.seq.length - 1, Math.floor(e * F.seq.length));
  }

  /* lógica de cada paso de física (después de ARENA.update) */
  function update(dt, G) {
    if (!F.active || !F.cur) return;
    // en «Atrapa chicles» la sorpresa cambia cada tanto
    if (G.mode !== 'caneca' && G.state === 'play' && G.roundT >= F.nextSwap && G.roundT < Modes.cfg(G.mode).time - 5) {
      F.nextSwap += CHICLES_EVERY;
      startSpin(draw(G), true, G);
    }
    const playing = G.canControl && G.state === 'play';
    if (F.cur === 'tijeras') {
      if (!playing) { ARENA.mods.cut = 0; if (G.state !== 'play') F.phase = 'calm'; return; }
      F.phaseT -= dt;
      if (F.phaseT <= 0) {
        if (F.phase === 'calm') { F.phase = 'warn'; F.phaseT = TIJ.warn; if (!G.quiet) Sound.play('snip'); }
        else if (F.phase === 'warn') { F.phase = 'cut'; F.phaseT = TIJ.cut; }
        else { F.phase = 'calm'; F.phaseT = TIJ.calm; }
      }
      ARENA.mods.cut = F.phase === 'cut' ? 1 : 0;
    } else if (F.cur === 'ventarron') {
      if (!playing) { ARENA.mods.push = 0; ARENA.pushWarn = 0; return; }
      F.phaseT -= dt;
      if (F.phaseT <= 0) {
        if (F.phase === 'calm') { F.phase = 'warn'; F.phaseT = VEN.warn; F.dir = -F.dir; }
        else if (F.phase === 'warn') { F.phase = 'gust'; F.phaseT = VEN.gust; if (!G.quiet) Sound.play('gust'); }
        else { F.phase = 'calm'; F.phaseT = VEN.calm; }
      }
      // la ráfaga sube y baja suave
      const k = F.phase === 'gust' ? clamp(Math.min((VEN.gust - F.phaseT) / 0.35, F.phaseT / 0.5), 0, 1) : 0;
      ARENA.mods.push = VEN.push * F.dir * k;
      ARENA.pushWarn = F.phase === 'warn' ? F.dir : 0;
    }
  }

  /* ---------------- dibujo en el mundo ---------------- */
  const STARS = (() => { const r = mulberry32(77); return Array.from({ length: 46 }, () => ({ x: r() * WORLD_W, y: r() * 420 - 20, s: 1.5 + r() * 3.5, p: r() * TAU })); })();
  const BUBBLES = (() => { const r = mulberry32(91); return Array.from({ length: 22 }, () => ({ u: r(), s: 5 + r() * 10, sp: 26 + r() * 40, p: r(), w: r() * TAU })); })();
  const STREAKS = (() => { const r = mulberry32(55); return Array.from({ length: 34 }, () => ({ y: 80 + r() * 760, len: 90 + r() * 220, sp: 0.8 + r() * 0.7, o: r() * 3000, th: 2 + r() * 3 })); })();

  function drawWorld(ctx, t, G) {
    if (!F.active || !F.cur) return;
    const id = F.cur;
    if (id === 'luna') {
      ctx.save();
      ctx.fillStyle = 'rgba(70,50,160,0.10)'; ctx.fillRect(0, -400, WORLD_W, WORLD_H + 800);
      for (const s of STARS) {
        const a = 0.35 + 0.45 * Math.sin(t * 2.2 + s.p);
        ctx.globalAlpha = clamp(a, 0, 1);
        star(ctx, s.x, s.y + Math.sin(t * 0.6 + s.p) * 6, s.s, '#fff7c2');
      }
      ctx.restore();
    } else if (id === 'jabon') {
      ctx.save();
      const L = ARENA.deskLeft, R = ARENA.deskRight, y0 = ARENA.deskY;
      for (const b of BUBBLES) {
        const life = ((t * b.sp / 220) + b.p) % 1;
        const x = L + 40 + b.u * (R - L - 80) + Math.sin(t * 1.7 + b.w) * 12;
        const y = y0 - 8 - life * 230;
        const r = b.s * (0.6 + life * 0.6);
        ctx.globalAlpha = Math.sin(life * Math.PI) * 0.85;
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
        ctx.fillStyle = 'rgba(200,250,255,0.18)'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.35, r * 0.28, r * 0.16, -0.6, 0, TAU); ctx.fill();
      }
      // brillo de jabón sobre el piso principal
      ctx.globalAlpha = 0.5 + 0.2 * Math.sin(t * 3);
      const g = ctx.createLinearGradient(L, 0, R, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(220,255,250,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(L, y0 - 3, R - L, 4);
      ctx.restore();
    } else if (id === 'caliente' || id === 'congelado') {
      const hot = id === 'caliente';
      ctx.save();
      const g = ctx.createRadialGradient(960, 540, 420, 960, 540, 1150);
      g.addColorStop(0, hot ? 'rgba(255,140,40,0)' : 'rgba(150,220,255,0)');
      g.addColorStop(1, hot ? 'rgba(255,120,30,0.20)' : 'rgba(170,225,255,0.34)');
      ctx.fillStyle = g; ctx.fillRect(0, -400, WORLD_W, WORLD_H + 800);
      if (!hot) {
        // copitos
        ctx.fillStyle = '#ffffff';
        for (let k = 0; k < 26; k++) {
          const x = (k * 263 + t * (18 + (k % 5) * 6)) % WORLD_W, y = ((k * 157 + t * (40 + (k % 7) * 8)) % 900) - 20;
          ctx.globalAlpha = 0.65; ctx.beginPath(); ctx.arc(x + Math.sin(t + k) * 10, y, 2 + (k % 3), 0, TAU); ctx.fill();
        }
      }
      ctx.restore();
    } else if (id === 'ventarron') {
      const k = Math.abs(ARENA.mods.push) / VEN.push;
      ctx.save(); ctx.lineCap = 'round';
      if (k > 0.02) {
        for (const s of STREAKS) {
          const span = WORLD_W + 600;
          const x = F.dir > 0 ? ((s.o + t * 1500 * s.sp) % span) - 300 : WORLD_W + 300 - ((s.o + t * 1500 * s.sp) % span);
          ctx.globalAlpha = 0.55 * k;
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = s.th;
          ctx.beginPath(); ctx.moveTo(x, s.y); ctx.quadraticCurveTo(x - F.dir * s.len * 0.5, s.y - 6, x - F.dir * s.len, s.y + 2); ctx.stroke();
        }
      }
      if (F.phase === 'warn' && Math.floor(t * 6) % 2 === 0) {
        // flechas que avisan hacia dónde va a soplar
        ctx.globalAlpha = 0.9;
        for (let i = -1; i <= 1; i++) chevron(ctx, 960 + i * 90 * F.dir, 330, 34, F.dir, '#ffffff');
      }
      ctx.restore();
    } else if (id === 'tijeras' && F.phase === 'warn' && G.rope.visible) {
      const pts = G.rope.pts, mid = pts[Math.floor(pts.length / 2)];
      const open = 0.25 + 0.25 * Math.sin(t * 22);
      ctx.save();
      ctx.globalAlpha = Math.floor(t * 8) % 2 ? 1 : 0.65;
      scissors(ctx, mid.x, mid.y - 95, 1.1, open);
      ctx.restore();
    }
  }

  /* ---------------- HUD: ruleta y etiqueta ---------------- */
  function drawHUD(ctx, W, H, G) {
    if (!F.active || !F.cur) return;
    const rr = ArenaArt.rr, ink = PALETTE.ink;
    // etiqueta fija bajo la ronda
    const m = BY[F.cur];
    const showCard = F.rt < CARD_END && !F.midRound;
    if (!showCard) {
      let label = m.name;
      let flash = false;
      if (F.cur === 'tijeras' && F.phase === 'warn') { label = '¡TIJERETAZO!'; flash = true; }
      if (F.cur === 'ventarron' && F.phase === 'warn') { label = F.dir > 0 ? 'RÁFAGA  →' : '←  RÁFAGA'; flash = true; }
      ctx.save();
      ctx.font = font(22, 700);
      const tw = ctx.measureText(label).width, w = tw + 84, h = 46, x = W / 2 - w / 2, y = G.mode === 'chicles' ? 104 : 126;
      const pulse = flash && Math.floor(G.t * 8) % 2 === 0;
      ctx.fillStyle = 'rgba(40,20,10,0.25)'; rr(ctx, x + 3, y + 5, w, h, 23); ctx.fill();
      rr(ctx, x, y, w, h, 23); ctx.fillStyle = pulse ? '#ffffff' : m.col; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = ink; ctx.stroke();
      icon(ctx, F.cur, x + 28, y + h / 2, 15, G.t);
      ctx.fillStyle = ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(label, x + 52, y + h / 2 + 1);
      ctx.restore();
    }
    // ruleta grande (al empezar la ronda) o chiquita (cambio en Atrapa chicles)
    if (F.rt < CARD_END && !F.midRound) drawCard(ctx, W, H, G);
    else if (F.midRound && !F.landed) drawMini(ctx, W, H, G);
  }

  function drawCard(ctx, W, H, G) {
    const rr = ArenaArt.rr, ink = PALETTE.ink;
    const t = F.rt;
    const appear = easeOutBack(clamp(t / 0.25, 0, 1));
    const fade = t > CARD_END - 0.25 ? 1 - (t - (CARD_END - 0.25)) / 0.25 : 1;
    const land = F.landed ? clamp((t - SPIN) / 0.25, 0, 1) : 0;
    const m = BY[F.shown] || BY[F.cur];
    const w = 640, h = 190, cx = W / 2, cy = H * 0.43;
    ctx.save();
    ctx.globalAlpha = clamp(fade, 0, 1);
    ctx.translate(cx, cy);
    const pop = 1 + (F.landed ? Math.sin(land * Math.PI) * 0.08 : 0);
    ctx.scale(appear * pop, appear * pop);
    ctx.rotate(-0.02);
    // título
    ctx.save(); ctx.translate(0, -h / 2 - 34); ctx.rotate(-0.04);
    rr(ctx, -150, -30, 300, 60, 30); ctx.fillStyle = '#ff5c9d'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = ink; ctx.stroke();
    outlinedText(ctx, '¡FIESTA!', 0, 2, 40, '#ffffff', ink, 'center');
    ctx.restore();
    // tarjeta
    ctx.fillStyle = 'rgba(40,20,10,0.3)'; rr(ctx, -w / 2 + 6, -h / 2 + 10, w, h, 28); ctx.fill();
    rr(ctx, -w / 2, -h / 2, w, h, 28); ctx.fillStyle = '#fff6e6'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = ink; ctx.stroke();
    // banda de color
    ctx.save(); rr(ctx, -w / 2, -h / 2, w, h, 28); ctx.clip();
    ctx.fillStyle = rgba(m.col, F.landed ? 0.55 : 0.3); ctx.fillRect(-w / 2, -h / 2, 170, h);
    // rayas de confeti
    for (let k = 0; k < 14; k++) { ctx.fillStyle = ['#ff5c9d', '#27d3b2', '#ffd84d', '#9b6bdf'][k % 4]; ctx.globalAlpha = 0.5 * clamp(fade, 0, 1); ctx.fillRect(-w / 2 + 180 + k * 33, h / 2 - 12, 18, 6); }
    ctx.restore();
    ctx.globalAlpha = clamp(fade, 0, 1);
    // ícono
    ctx.save(); ctx.translate(-w / 2 + 85, 0);
    if (!F.landed) ctx.translate(0, Math.sin(t * 60) * 3);
    icon(ctx, m.id, 0, 0, 52, G.t);
    ctx.restore();
    // nombre y explicación
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const tx = -w / 2 + 196;
    ctx.font = font(44, 700);
    let size = 44; while (ctx.measureText(m.name).width > w - 220 && size > 26) { size -= 2; ctx.font = font(size, 700); }
    ctx.fillStyle = ink; ctx.fillText(m.name, tx, F.landed ? -24 : 0);
    if (F.landed) {
      ctx.globalAlpha = clamp(fade, 0, 1) * land;
      ctx.font = font(23, 600); ctx.fillStyle = PALETTE.inkSoft;
      wrap(ctx, m.sub, tx, 26, w - 222, 28);
    }
    ctx.restore();
  }

  function drawMini(ctx, W, H, G) {
    const rr = ArenaArt.rr, ink = PALETTE.ink;
    const m = BY[F.shown];
    ctx.save();
    ctx.font = font(24, 700);
    const label = m.name, w = ctx.measureText(label).width + 90, h = 52, x = W / 2 - w / 2, y = G.mode === 'chicles' ? 166 : 186;
    rr(ctx, x, y, w, h, 26); ctx.fillStyle = '#fff6e6'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = ink; ctx.stroke();
    icon(ctx, m.id, x + 30, y + h / 2, 17, G.t);
    ctx.fillStyle = ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(label, x + 56, y + h / 2 + 1);
    ctx.restore();
  }

  function wrap(ctx, text, x, y, maxW, lh) {
    const words = text.split(' '); let line = '', yy = y;
    for (const wd of words) {
      const test = line ? line + ' ' + wd : wd;
      if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, yy); line = wd; yy += lh; } else line = test;
    }
    if (line) ctx.fillText(line, x, yy);
  }

  /* ---------------- íconos dibujados ---------------- */
  function star(ctx, x, y, r, col) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.4 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  }
  function chevron(ctx, x, y, s, dir, col) {
    ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
    ctx.beginPath(); ctx.moveTo(-s * 0.5, -s); ctx.lineTo(s * 0.5, 0); ctx.lineTo(-s * 0.5, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.lineWidth = 16; ctx.strokeStyle = PALETTE.ink; ctx.stroke();
    ctx.lineWidth = 9; ctx.strokeStyle = col; ctx.stroke();
    ctx.restore();
  }
  function scissors(ctx, x, y, s, open, rot = 0) {
    const ink = PALETTE.ink;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(rot);
    for (const sd of [-1, 1]) {
      ctx.save(); ctx.rotate(sd * open);
      // hoja
      ctx.beginPath(); ctx.moveTo(-4, 0); ctx.quadraticCurveTo(sd * 10, 30, 0, 62); ctx.quadraticCurveTo(-sd * 4, 30, -4, 0); ctx.closePath();
      ctx.fillStyle = '#e8eef3'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
      // mango
      ctx.beginPath(); ctx.ellipse(sd * 4, -26, 13, 17, 0, 0, TAU);
      ctx.lineWidth = 9; ctx.strokeStyle = ink; ctx.stroke(); ctx.lineWidth = 5.5; ctx.strokeStyle = '#ff5c4a'; ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, TAU); ctx.fillStyle = '#ffd84d'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = ink; ctx.stroke();
    ctx.restore();
  }
  function icon(ctx, id, x, y, r, t) {
    const ink = PALETTE.ink;
    ctx.save(); ctx.translate(x, y);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const lw = Math.max(2, r * 0.13);
    if (id === 'luna') {
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.arc(r * 0.45, -r * 0.3, r * 0.82, 0, TAU, true);
      ctx.fillStyle = '#ffe9a0'; ctx.fill('evenodd'); ctx.lineWidth = lw; ctx.strokeStyle = ink;
      ctx.beginPath(); ctx.arc(0, 0, r, 0.15, TAU - 1.35); ctx.stroke();
      star(ctx, r * 0.55, -r * 0.55, r * 0.28, '#ffffff');
    } else if (id === 'caliente') {
      ctx.beginPath(); ctx.moveTo(0, -r); ctx.bezierCurveTo(r * 0.9, -r * 0.2, r * 0.9, r * 0.9, 0, r); ctx.bezierCurveTo(-r * 0.9, r * 0.9, -r * 0.9, -r * 0.1, -r * 0.2, -r * 0.4);
      ctx.quadraticCurveTo(-r * 0.1, -r * 0.1, 0, -r); ctx.closePath();
      ctx.fillStyle = '#ff7a2e'; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = ink; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -r * 0.1); ctx.bezierCurveTo(r * 0.45, r * 0.25, r * 0.4, r * 0.85, 0, r * 0.85); ctx.bezierCurveTo(-r * 0.4, r * 0.85, -r * 0.4, r * 0.3, 0, -r * 0.1);
      ctx.fillStyle = '#ffd84d'; ctx.fill();
    } else if (id === 'congelado') {
      ctx.strokeStyle = ink; ctx.lineWidth = lw * 2.2;
      const arms = () => { for (let i = 0; i < 6; i++) { ctx.save(); ctx.rotate(i * Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -r); ctx.moveTo(0, -r * 0.55); ctx.lineTo(r * 0.28, -r * 0.8); ctx.moveTo(0, -r * 0.55); ctx.lineTo(-r * 0.28, -r * 0.8); ctx.stroke(); ctx.restore(); } };
      arms(); ctx.strokeStyle = '#d8f2ff'; ctx.lineWidth = lw * 1.1; arms();
    } else if (id === 'jabon') {
      for (const [bx, by, br] of [[-r * 0.3, r * 0.15, r * 0.62], [r * 0.45, -r * 0.4, r * 0.42], [r * 0.5, r * 0.5, r * 0.3]]) {
        ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fillStyle = 'rgba(210,250,255,0.9)'; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = ink; ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(bx - br * 0.35, by - br * 0.35, br * 0.25, br * 0.15, -0.6, 0, TAU); ctx.fill();
      }
    } else if (id === 'gigantes' || id === 'pulgas') {
      const big = id === 'gigantes';
      const blobs = big ? [[0, r * 0.08, r * 0.95, PALETTE.fresa]] : [[-r * 0.45, r * 0.35, r * 0.42, PALETTE.fresa], [r * 0.45, -r * 0.2, r * 0.42, PALETTE.menta]];
      for (const [bx, by, br, c] of blobs) {
        const hop = big ? 0 : Math.abs(Math.sin(t * 6 + bx)) * r * 0.25;
        ctx.beginPath(); ctx.arc(bx, by - hop, br, 0, TAU); ctx.fillStyle = c.base; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = c.deep; ctx.stroke();
        ctx.fillStyle = '#fff';
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(bx + s * br * 0.33, by - hop - br * 0.1, br * 0.2, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#2b1610';
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(bx + s * br * 0.33, by - hop - br * 0.08, br * 0.1, 0, TAU); ctx.fill(); }
      }
      if (big) { ctx.lineWidth = lw; ctx.strokeStyle = ink; ctx.beginPath(); ctx.arc(0, r * 0.3, r * 0.25, 0.3, Math.PI - 0.3); ctx.stroke(); }
    } else if (id === 'tijeras') {
      scissors(ctx, r * 0.1, 0, r / 50, 0.3 + 0.12 * Math.sin(t * 10), -Math.PI / 2);
    } else if (id === 'ventarron') {
      ctx.strokeStyle = ink; ctx.lineWidth = lw * 2.4;
      const gust = () => {
        ctx.beginPath(); ctx.moveTo(-r, -r * 0.35); ctx.lineTo(r * 0.35, -r * 0.35); ctx.arc(r * 0.35, -r * 0.62, r * 0.27, Math.PI / 2, -Math.PI * 0.9, true);
        ctx.moveTo(-r, r * 0.05); ctx.lineTo(r * 0.7, r * 0.05);
        ctx.moveTo(-r * 0.7, r * 0.45); ctx.lineTo(r * 0.2, r * 0.45); ctx.arc(r * 0.2, r * 0.7, r * 0.25, -Math.PI / 2, Math.PI * 0.9);
        ctx.stroke();
      };
      gust(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = lw * 1.1; gust();
    }
    ctx.restore();
  }

  return {
    get on() { return F.on; }, setOn, roll, off, tick, update, drawWorld, drawHUD,
    force(id) { F.forced = id || null; },
    get cur() { return F.active ? F.cur : null; }, get state() { return F; }, MODS,
    get spinning() { return F.active && F.rt < CARD_END && !F.midRound; },
    CARD_END,
  };
})();
