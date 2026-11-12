/* =========================================================================
   ESCUELA DE VUELO — lecciones cortas para aprender las técnicas jugando.
   Aros para apuntar, turbo vertical, globos para la ráfaga, cobra,
   derrape con tiro de espaldas, tonel contra un misil de práctica, misil
   fijado contra un dron y vuelo rasante. Cada lección muestra las teclas
   (o los controles táctiles) que tiene cada quien.
   Los blancos viven en G.targets: { kind: 'ring' | 'balloon' | 'drone', … }.
   ========================================================================= */
const School = (() => {
  let k = 0, lesson = null, doneT = 0, finished = false, msgT = 0;
  const touch = () => typeof Touch !== 'undefined' && Touch.enabled;
  const key = a => touch() ? { fire: 'el botón de fuego', boost: 'el botón de turbo', missile: 'el botón de misil', roll: 'doble toque y arrastrar' }[a] : keyName(KEYMAP[0][a][0]);
  const aimTxt = () => touch() ? 'la palanca' : [KEYMAP[0].up[0], KEYMAP[0].left[0], KEYMAP[0].down[0], KEYMAP[0].right[0]].map(keyName).join(' ');
  const pal = ['#ff5a7a', '#ffd23f', '#5ad8ff', '#7cf08a', '#c08cff'];

  // un punto libre cerca de (x, y): sube hasta que no choque con nada
  function free(G, x, y, r = 90) {
    const W = G.world; x = clamp(x, 300, W.w - 300);
    for (let i = 0; i < 40; i++) { if (!World.solidAt(W, x, y, r) && y < W.groundY(x) - r - 40) return { x, y }; y -= 40; }
    return { x, y: Math.max(W.ceil + 120, y) };
  }
  const P = G => G.birds[0];
  const add = (G, o) => { G.targets.push(Object.assign({ alive: true, hp: 1, vx: 0, vy: 0, t: 0 }, o)); };

  const LESSONS = [
    { id: 'aros', title: 'Apuntar', text: () => `Apunta con ${aimTxt()}: el ala gira hacia allá. Pasa por los 4 aros.`,
      setup(G) { const b = P(G), d = b.facing; [[420, -60], [760, -300], [1000, 40], [700, 260]].forEach(([dx, dy], i) => { const p = free(G, b.x + d * dx, b.y + dy); add(G, { kind: 'ring', x: p.x, y: p.y, r: 70, order: i }); }); },
      goal: G => G.targets.filter(t => t.kind === 'ring').length, got: G => G.targets.filter(t => t.kind === 'ring' && !t.alive).length },
    { id: 'turbo', title: 'Turbo', text: () => `El turbo (${key('boost')}) empuja hacia donde apuntas: aunque vengas cayendo, apunta arriba con turbo y subes como cohete. Llega al aro alto.`,
      setup(G) { const b = P(G); const p = free(G, b.x + b.facing * 160, Math.max(G.world.ceil + 200, b.y - 650)); add(G, { kind: 'ring', x: p.x, y: p.y, r: 80, order: 0 }); },
      goal: () => 1, got: G => G.targets.filter(t => t.kind === 'ring' && !t.alive).length },
    { id: 'globos', title: 'Ráfaga', text: () => `Mantén ${key('fire')} para disparar. Revienta los 5 globos (si el arma se recalienta, espera un momento).`,
      setup(G) { const b = P(G); for (let i = 0; i < 5; i++) { const p = free(G, b.x + b.facing * (500 + i * 180), b.y - 120 + (i % 2) * 220, 40); add(G, { kind: 'balloon', x: p.x, y: p.y, r: 28, col: pal[i], ph: i }); } },
      goal: () => 5, got: G => G.targets.filter(t => t.kind === 'balloon' && !t.alive).length },
    { id: 'cobra', title: 'Cobra', text: () => `Frenar en seco: con buena velocidad, apunta de golpe hacia arriba un instante. El perseguidor se pasa de largo.`,
      setup() {}, goal: () => 1, got: (G, L) => L.count || 0, trick: 'cobra' },
    { id: 'derrape', title: 'Derrape', text: () => `El cuerpo gira, pero la inercia sigue. Apunta hacia atrás sin frenar y revienta 2 globos volando de espaldas.`,
      setup(G) { const b = P(G); for (let i = 0; i < 4; i++) { const p = free(G, b.x - b.facing * (380 + i * 160), b.y - 80 + (i % 2) * 160, 40); add(G, { kind: 'balloon', x: p.x, y: p.y, r: 28, col: pal[(i + 2) % 5], ph: i, back: true }); } },
      goal: () => 2, got: (G, L) => L.count || 0, trick: 'espaldas' },
    { id: 'tonel', title: 'Tonel', text: () => `Un dron te va a lanzar un misil de práctica. Cuando esté encima, haz un tonel: ${key('roll')}${touch() ? '' : ' o doble toque en una dirección'}. En ese instante no te toca.`,
      setup(G) { const b = P(G), p = free(G, b.x + b.facing * 900, b.y - 100, 60); add(G, { kind: 'drone', drone: true, x: p.x, y: p.y, r: 30, hp: 99, shooter: true, fireT: 1.6 }); },
      goal: () => 1, got: (G, L) => L.count || 0 },
    { id: 'misil', title: 'Misil', text: () => `Mantén el dron en la mira hasta oír el tono de «fijado» y lanza el misil con ${key('missile')}.`,
      setup(G) { const b = P(G), p = free(G, b.x + b.facing * 1000, b.y - 200, 60); add(G, { kind: 'drone', drone: true, x: p.x, y: p.y, r: 30, hp: 3, wander: true }); b.missiles = Math.max(b.missiles, 3); },
      goal: () => 1, got: G => G.targets.filter(t => t.kind === 'drone' && !t.alive).length },
    { id: 'rasante', title: 'Rasante', text: () => `Vuela rápido pegado al suelo (o a una azotea) sin tocarlo: recarga el turbo y enfría el arma.`,
      setup() {}, goal: () => 1, got: (G, L) => L.count || 0, trick: 'rasante' },
    { id: 'fin', title: '¡Listo, piloto!', text: () => `Encadena maniobras distintas para llenar la Adrenalina y entrar en Modo leyenda. Ahora sí: ¡a pelear!`,
      setup() {}, goal: () => 1, got: (G, L) => (L.t > 4 ? 1 : 0) },
  ];

  function begin(G) {
    k = 0; finished = false; G.targets = [];
    start(G);
  }
  function start(G) {
    G.targets = G.targets.filter(t => t.kind !== 'ring' && t.kind !== 'balloon' && t.kind !== 'drone');
    lesson = Object.assign({ t: 0, count: 0 }, LESSONS[k]); doneT = 0; msgT = 0;
    lesson.setup(G);
    G.events.push({ type: 'lesson', k });
  }
  function skip(G) { if (k < LESSONS.length - 1) { k++; start(G); } }
  function update(G, dt) {
    if (!lesson) return;
    lesson.t += dt;
    const b = P(G);
    for (const T of G.targets) {
      if (!T.alive) continue;
      T.t += dt;
      if (T.kind === 'ring') {
        const first = G.targets.filter(t => t.kind === 'ring' && t.alive).sort((a, c) => a.order - c.order)[0];
        if (T === first && b.alive && Math.hypot(b.x - T.x, b.y - T.y) < T.r) { T.alive = false; G.events.push({ type: 'ring', x: T.x, y: T.y }); }
      } else if (T.kind === 'balloon') {
        T.y += Math.sin(T.t * 1.4 + T.ph) * 14 * dt;
      } else if (T.kind === 'drone') {
        if (T.wander) { T.vx = Math.cos(T.t * 0.5) * 120; T.vy = Math.sin(T.t * 0.8) * 70; T.x += T.vx * dt; T.y += T.vy * dt; const f = free(G, T.x, T.y, 50); T.y = Math.min(T.y, f.y); }
        if (T.shooter && b.alive && !G.missiles.length) {
          T.fireT -= dt;
          if (T.fireT <= 0) {
            T.fireT = 3.2;
            const a = Math.atan2(b.y - T.y, b.x - T.x);
            G.missiles.push({ x: T.x + Math.cos(a) * 40, y: T.y + Math.sin(a) * 40, a, s: 520, owner: 1, target: b, orig: b, life: 4.6, age: 0, hp: 3, dmg: 5, turn: 2.6, trailAcc: 0, trail: [] });
            G.events.push({ type: 'launch', b: { x: T.x, y: T.y } });
          }
        }
      }
    }
    // ¿lección cumplida?
    if (!doneT && lesson.got(G, lesson) >= lesson.goal(G, lesson)) {
      doneT = 0.001;
      G.events.push({ type: 'lessonDone', k, last: k === LESSONS.length - 1 });
    }
    if (doneT) {
      doneT += dt;
      if (doneT > 1.6) {
        if (k < LESSONS.length - 1) { k++; start(G); } else if (!finished) { finished = true; G.events.push({ type: 'schoolDone' }); }
      }
    }
  }
  function event(G, e) {
    if (!lesson) return;
    if (lesson.trick && e.type === 'trick' && e.b && e.b.id === 0 && e.key === lesson.trick && !doneT) lesson.count++;
    if (lesson.id === 'tonel' && e.type === 'dodged' && e.b && e.b.id === 0) lesson.count++;
    if (lesson.id === 'derrape' && e.type === 'pop' && e.back) lesson.count++;
  }
  // una bala alcanzó un blanco (lo llama el combate)
  function hitTarget(G, T, by) {
    if (T.kind === 'ring') return false;
    T.hp--;
    if (T.hp <= 0) {
      T.alive = false;
      const sh = G.birds[by], back = sh && Math.abs(sh.mis || 0) > 1.45;
      G.events.push({ type: 'pop', x: T.x, y: T.y, kind: T.kind, col: T.col, back, by, pts: T.pts });
      if (T.kind === 'drone') G.events.push({ type: 'boom', x: T.x, y: T.y, scale: 0.8 });
    } else G.events.push({ type: 'spark', x: T.x, y: T.y, kind: 'drone' });
    return true;
  }

  /* ---------- dibujo ---------- */
  function draw(ctx, G) {
    if (!G.targets) return;
    const t = G.time, vs = G.vs || 1;
    const rings = G.targets.filter(T => T.kind === 'ring' && T.alive).sort((a, c) => a.order - c.order);
    for (const T of G.targets) {
      if (!T.alive) continue;
      ctx.save(); ctx.translate(T.x, T.y);
      if (T.kind === 'ring') {
        const next = T === rings[0], R = T.r * (1 + 0.05 * Math.sin(t * 4));
        ctx.globalAlpha = next ? 1 : 0.35;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(0, 0, R * 0.75, 0, 0, R * 1.25); g.addColorStop(0, 'rgba(120,255,200,0)'); g.addColorStop(0.5, 'rgba(120,255,200,0.35)'); g.addColorStop(1, 'rgba(120,255,200,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * 1.25, 0, TAU); ctx.fill(); ctx.restore();
        ctx.strokeStyle = next ? '#8dffd0' : '#ffffff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.setLineDash([12, 14]); ctx.lineDashOffset = -t * 40; ctx.beginPath(); ctx.arc(0, 0, R - 9, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      } else if (T.kind === 'balloon') {
        ctx.scale(vs, vs);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, T.r); ctx.quadraticCurveTo(6, T.r + 20, 0, T.r + 40); ctx.stroke();
        const g = ctx.createRadialGradient(-T.r * 0.35, -T.r * 0.4, 2, 0, 0, T.r * 1.1); g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, T.col); g.addColorStop(1, ArtWorld.mix(T.col, '#000000', 0.35));
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, T.r * 0.85, T.r, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = T.col; ctx.beginPath(); ctx.moveTo(-4, T.r); ctx.lineTo(4, T.r); ctx.lineTo(0, T.r - 6); ctx.fill();
        if (T.back) { ctx.fillStyle = '#ffffff'; ctx.font = '700 15px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('↺', 0, 1); }
      } else if (T.kind === 'drone') {
        ctx.scale(vs, vs);
        ctx.fillStyle = '#2c3142'; ctx.beginPath(); ctx.roundRect(-22, -8, 44, 16, 6); ctx.fill();
        ctx.fillStyle = '#ff5a4e'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill();
        if (Math.sin(t * 8) > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 18); g.addColorStop(0, 'rgba(255,90,78,0.7)'); g.addColorStop(1, 'rgba(255,90,78,0)'); ctx.fillStyle = g; ctx.fillRect(-18, -18, 36, 36); ctx.restore(); }
        ctx.strokeStyle = '#59607a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-22, -4); ctx.lineTo(-30, -14); ctx.moveTo(22, -4); ctx.lineTo(30, -14); ctx.stroke();
        ctx.fillStyle = 'rgba(220,230,255,0.55)';
        for (const s of [-30, 30]) { ctx.beginPath(); ctx.ellipse(s, -15, 16 * Math.abs(Math.sin(t * 40 + s)), 2.5, 0, 0, TAU); ctx.fill(); }
        if (T.hp < 99) for (let i = 0; i < 3; i++) { ctx.fillStyle = i < T.hp ? '#7cf08a' : 'rgba(255,255,255,0.25)'; ctx.fillRect(-13 + i * 9, 13, 7, 3); }
      }
      ctx.restore();
    }
  }
  // flecha al borde de la pantalla hacia el próximo blanco (si está fuera de la vista)
  function drawPointer(ctx, G, cam, sw, sh) {
    if (!G.targets) return;
    const b = P(G); if (!b || !b.alive) return;
    const live = G.targets.filter(T => T.alive && T.kind !== 'drone' || (T.alive && T.kind === 'drone'));
    let T = live.filter(t => t.kind === 'ring').sort((a, c) => a.order - c.order)[0];
    if (!T) T = live.sort((a, c) => Math.hypot(a.x - b.x, a.y - b.y) - Math.hypot(c.x - b.x, c.y - b.y))[0];
    if (!T) return;
    const sx = sw / 2 + (T.x - cam.x) * cam.z, sy = sh / 2 + (T.y - cam.y) * cam.z, m = 46;
    if (sx > m && sx < sw - m && sy > m + 80 && sy < sh - m) return;
    const cx = clamp(sx, m, sw - m), cy = clamp(sy, m + 90, sh - m), a = Math.atan2(sy - sh / 2, sx - sw / 2);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
    ctx.fillStyle = T.kind === 'ring' ? 'rgba(141,255,208,0.95)' : 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-10, -12); ctx.lineTo(-4, 0); ctx.lineTo(-10, 12); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // panel de la lección (arriba al centro)
  function drawHUD(ctx, G, sw, sh, u, glass) {
    if (!lesson) return;
    const left = 234 * u, w = Math.min(sw - left - 10, 560 * u), x = Math.max(sw / 2 - w / 2, left), y = Touch.enabled ? 62 : 10, done = doneT > 0;
    ctx.save();
    ctx.font = font(Math.max(12, 13.5 * u));
    const lines = wrap(ctx, lesson.text(), w - 32 * u);
    const h = (44 + lines.length * 18) * u;
    glass(x, y, w, h, 14 * u);
    ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = font(Math.max(10, 10.5 * u));
    ctx.fillText(`ESCUELA DE VUELO · ${k + 1} de ${LESSONS.length}`, x + 16 * u, y + 17 * u);
    ctx.textAlign = 'right'; const goal = lesson.goal(G, lesson), got = Math.min(goal, lesson.got(G, lesson));
    if (goal > 1) ctx.fillText(`${got} / ${goal}`, x + w - 16 * u, y + 17 * u);
    ctx.textAlign = 'left'; ctx.fillStyle = done ? '#8dffd0' : '#fff4c9'; ctx.font = font(Math.max(14, 17 * u));
    ctx.fillText(done ? '¡Bien! ' + lesson.title : lesson.title, x + 16 * u, y + 37 * u);
    ctx.fillStyle = '#ffffff'; ctx.font = font(Math.max(12, 13.5 * u));
    lines.forEach((l, i) => ctx.fillText(l, x + 16 * u, y + (58 + i * 18) * u));
    // progreso de lecciones
    for (let i = 0; i < LESSONS.length; i++) { ctx.beginPath(); ctx.arc(x + w - 16 * u - (LESSONS.length - 1 - i) * 11 * u, y + 34 * u, 3.4 * u, 0, TAU); ctx.fillStyle = i < k || (i === k && done) ? '#8dffd0' : i === k ? '#fff4c9' : 'rgba(255,255,255,0.25)'; ctx.fill(); }
    ctx.restore();
  }
  function wrap(ctx, txt, maxW) {
    const out = []; let line = '';
    for (const w of txt.split(' ')) { const tr = line ? line + ' ' + w : w; if (ctx.measureText(tr).width > maxW && line) { out.push(line); line = w; } else line = tr; }
    if (line) out.push(line); return out;
  }
  return { begin, update, event, hitTarget, draw, drawPointer, drawHUD, skip, get index() { return k; }, get count() { return LESSONS.length; }, get finished() { return finished; } };
})();
