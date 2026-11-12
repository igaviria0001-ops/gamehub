/* =========================================================================
   EFECTOS Y COMBATE EN PANTALLA — explosiones de cine (destello, bola de
   fuego, onda, humo y escombros que caen humeando), trazadoras, misiles
   con su estela de humo, bengalas, cajas en paracaídas y pilotos eyectados.
   Las partículas son solo dibujo: no afectan la partida.
   ========================================================================= */
const FX = (() => {
  const P = [];
  let shake = 0, flash = 0;
  const vaPrev = [null, null];
  const R = Math.random;
  function add(o) { if (P.length < 900) P.push(Object.assign({ life: 1, max: 1, vx: 0, vy: 0, rot: 0, vr: 0, size: 4, g: 0, drag: 0 }, o)); }
  function n(cnt, f) { for (let i = 0; i < cnt; i++) add(f(i)); }
  function explosion(x, y, scale = 1) {
    shake = Math.max(shake, 12 * scale); flash = Math.max(flash, 0.35 * scale);
    add({ kind: 'flash', x, y, life: 0.22, max: 0.22, size: 120 * scale });
    // bola de fuego que se infla y se oscurece, humo iluminado desde abajo y una onda de choque fina
    add({ kind: 'fireball', x, y, life: 0.62, max: 0.62, size: 64 * scale, seed: R() * 10 });
    add({ kind: 'shock', x, y, life: 0.32, max: 0.32, size: 20 * scale, grow: 380 * scale });
    n(Math.round(5 * scale), () => { const a = R() * TAU, d = R() * 26 * scale; return { kind: 'fireball', x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90 - 30, drag: 2.5, life: 0.4 + R() * 0.3, max: 0.7, size: (22 + R() * 22) * scale, seed: R() * 10 }; });
    n(Math.round(8 * scale), () => { const a = R() * TAU, v = (30 + R() * 90) * scale; return { kind: 'smokeLit', x: x + Math.cos(a) * 14, y: y + Math.sin(a) * 14, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 50, drag: 1.4, g: -40, life: 1.8 + R() * 1.2, max: 3, size: (24 + R() * 22) * scale }; });
    add({ kind: 'ring', x, y, life: 0.45, max: 0.45, size: 30 * scale, grow: 260 * scale, color: '255,230,200' });
    n(Math.round(14 * scale), () => { const a = R() * TAU, v = (80 + R() * 260) * scale; return { kind: 'fire', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, drag: 3, life: 0.5 + R() * 0.4, max: 0.9, size: (14 + R() * 18) * scale }; });
    n(Math.round(12 * scale), () => { const a = R() * TAU, v = (40 + R() * 140) * scale; return { kind: 'smoke', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, drag: 1.6, g: -30, life: 1.4 + R() * 1.2, max: 2.6, size: (16 + R() * 20) * scale, shade: 60 + R() * 40 }; });
    n(Math.round(16 * scale), () => { const a = R() * TAU, v = 300 + R() * 600; return { kind: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 2.2, g: 500, life: 0.4 + R() * 0.5, max: 0.9, size: 8 + R() * 10 }; });
  }
  function debris(x, y, vx, vy, colors) {
    n(6, i => { const a = R() * TAU, v = 150 + R() * 350; return { kind: 'chunk', x, y, vx: vx * 0.4 + Math.cos(a) * v, vy: vy * 0.4 + Math.sin(a) * v - 200, g: 900, drag: 0.4, rot: R() * TAU, vr: (R() - 0.5) * 14, life: 2.6, max: 2.6, size: 5 + R() * 8, color: colors[i % colors.length], smoky: true }; });
  }
  function event(e, G) {
    const b = e.b;
    switch (e.type) {
      case 'shot': {
        const ca = Math.cos(b.a), sa = Math.sin(b.a), k = b.sp.size;
        add({ kind: 'muzzle', x: b.x + ca * b.r * 1.3, y: b.y + sa * b.r * 1.3, a: b.a, life: 0.05, max: 0.05, size: 14 * k });
        break;
      }
      case 'hit':
        n(e.shield ? 6 : 5, () => { const a = Math.atan2(-e.vy, -e.vx) + (R() - 0.5) * 1.6, v = 120 + R() * 320; return { kind: 'spark', x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 4, g: 300, life: 0.25 + R() * 0.2, max: 0.45, size: 6 + R() * 6, color: e.shield ? '150,230,255' : null }; });
        if (!e.shield) add({ kind: 'smoke', x: e.x, y: e.y, vx: 0, vy: -20, life: 0.6, max: 0.6, size: 8, shade: 160 });
        break;
      case 'spark':
        n(3, () => { const a = R() * TAU, v = 80 + R() * 200; return { kind: 'spark', x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, drag: 4, g: 400, life: 0.25, max: 0.25, size: 5 }; });
        add({ kind: 'dust', x: e.x, y: e.y, vx: 0, vy: -20, life: 0.5, max: 0.5, size: 6 + R() * 6, color: e.kind === 'crown' ? '#7fb36d' : e.kind === 'water' ? '#cfe2ff' : e.kind === 'hotair' ? '#ffe2c0' : G && G.world && G.world.id === 'capadocia' ? '#f0d4b0' : e.kind === 'ground' ? '#e9e2d4' : '#9aa3bb' });
        break;
      case 'boom': explosion(e.x, e.y, e.scale || 1); break;
      case 'decoyed': add({ kind: 'text', x: e.x, y: e.y - 40, vy: -40, life: 1.2, max: 1.2, text: 'misil engañado', size: 18, color: '#ffe08a' }); break;
      case 'pop':
        if (e.kind === 'balloon') n(14, () => { const a = R() * TAU, v = 80 + R() * 220; return { kind: 'chunk', x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, g: 500, drag: 2, rot: R() * TAU, vr: (R() - 0.5) * 16, life: 1, max: 1, size: 3 + R() * 3, color: e.col || '#ff5a7a' }; });
        add({ kind: 'ring', x: e.x, y: e.y, life: 0.3, max: 0.3, size: 12, grow: 70, color: '255,255,255' });
        break;
      case 'ring': add({ kind: 'ring', x: e.x, y: e.y, life: 0.5, max: 0.5, size: 60, grow: 120, color: '141,255,208' }); n(16, () => { const a = R() * TAU; return { kind: 'spark', x: e.x + Math.cos(a) * 60, y: e.y + Math.sin(a) * 60, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, drag: 3, life: 0.5, max: 0.5, size: 8, color: '141,255,208' }; }); break;
      case 'sonic':
        shake = Math.max(shake, 6); flash = Math.max(flash, 0.12);
        add({ kind: 'ring', x: b.x, y: b.y, life: 0.5, max: 0.5, size: 20, grow: 300, color: '235,245,255' });
        add({ kind: 'cone', x: b.x, y: b.y, a: e.a, vx: b.vx * 0.85, vy: b.vy * 0.85, life: 0.42, max: 0.42, size: 60 * b.sp.size });
        break;
      case 'glass': {
        // vidrios que estallan y caen brillando
        const cnt = Math.min(46, 6 + e.n * 3), sd = e.side || (R() < 0.5 ? -1 : 1);
        n(cnt, () => ({ kind: 'glass', x: e.x + (R() - 0.5) * 16 * Math.min(4, e.n), y: e.y + (R() - 0.5) * 16 * Math.min(4, e.n), vx: sd * (60 + R() * 260) + (R() - 0.5) * 120, vy: -80 - R() * 200, g: 980, drag: 0.6, rot: R() * TAU, vr: (R() - 0.5) * 20, life: 1.6 + R() * 0.8, max: 2.4, size: 2.5 + R() * 4.5, ph: R() * 6 }));
        if (e.n > 2) shake = Math.max(shake, 4);
        break;
      }
      case 'launch':
        n(5, () => ({ kind: 'smoke', x: b.x, y: b.y, vx: (R() - 0.5) * 60, vy: (R() - 0.5) * 60, drag: 2, g: -20, life: 0.8, max: 0.8, size: 10 + R() * 8, shade: 210 }));
        break;
      case 'down': {
        explosion(b.x, b.y, 1.5);
        const L = ArtPilot.look(b.sp.id, b.look); // (también las pinturas del Hangar)
        debris(b.x, b.y, b.vx, b.vy, [L.wingA, L.wingB, L.stripe, '#5b6170']);
        break;
      }
      case 'crash':
        shake = Math.max(shake, 8);
        n(10, () => ({ kind: 'dust', x: b.x, y: b.y, vx: (R() - 0.5) * 300, vy: (R() - 0.7) * 200, drag: 2, g: 200, life: 0.7, max: 0.7, size: 6 + R() * 10 }));
        n(5, () => ({ kind: 'spark', x: b.x, y: b.y, vx: (R() - 0.5) * 400, vy: -R() * 300, drag: 3, g: 500, life: 0.4, max: 0.4, size: 6 }));
        break;
      case 'skim':
        n(4, () => ({ kind: 'spray', x: b.x - Math.cos(b.a) * 10, y: b.y + b.r * 0.8, vx: -Math.cos(b.a) * 120 + (R() - 0.5) * 100, vy: -120 - R() * 140, g: 500, drag: 2, life: 0.6, max: 0.6, size: 3 + R() * 3, color: e.kind === 'ground' ? '#9fd486' : '#ffffff' }));
        break;
      case 'bounce': {
        // rebote en la tela de un globo: anillo blando y un par de hilachas del color del globo
        const k = Math.min(1.4, 0.5 + (e.sp || 300) / 500), px = b.x - e.nx * b.r, py = b.y - e.ny * b.r;
        add({ kind: 'ring', x: px, y: py, life: 0.32, max: 0.32, size: 10, grow: 120 * k, color: '255,236,210' });
        n(6, () => { const a = Math.atan2(e.ny, e.nx) + (R() - 0.5) * 1.8, v = 90 + R() * 160; return { kind: 'spray', x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: 260, drag: 2.4, life: 0.5, max: 0.5, size: 2.5 + R() * 2.5, color: HOTAIR_COLORS[(G.world.hotair && G.world.hotair[e.i] || { c: 0 }).c % HOTAIR_COLORS.length][0] }; });
        break;
      }
      case 'land': case 'takeoff':
        n(5, () => ({ kind: 'dust', x: b.x + (R() - 0.5) * 20, y: b.y + b.r, vx: (R() - 0.5) * 120, vy: -30 - R() * 60, drag: 2, g: 200, life: 0.5, max: 0.5, size: 4 + R() * 5 }));
        break;
      case 'stall': if (G && G.bots && G.bots[b.id]) break; add({ kind: 'text', x: b.x, y: b.y - 44, vy: -30, life: 0.9, max: 0.9, text: 'sin sustentación: pica o turbo arriba', size: 16 }); break;
      case 'trick': { const bot = G && G.bots && G.bots[b.id]; if (bot) break; // las maniobras de la máquina no llenan la pantalla de letreros
        add({ kind: 'trick', x: b.x, y: b.y - 62, vy: -46, life: 1.25, max: 1.25, text: e.name + (e.combo > 1 ? ` ×${e.combo}` : ''), size: (e.weak ? 17 : 24) * (bot ? 0.72 : 1), color: PLAYER_COLORS[b.id].main, weak: e.weak || bot, rot: (Math.random() - 0.5) * 0.12 }); break; }
      case 'legend':
        flash = Math.max(flash, 0.3);
        add({ kind: 'ring', x: b.x, y: b.y, life: 0.7, max: 0.7, size: 30, grow: 320, color: '255,214,90' });
        n(24, () => { const a = R() * TAU, v = 200 + R() * 400; return { kind: 'spark', x: b.x, y: b.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 2, life: 0.7, max: 0.7, size: 10, color: '255,214,90' }; });
        break;
      case 'roll':
        n(6, () => ({ kind: 'streak', x: b.x + (R() - 0.5) * 40, y: b.y + (R() - 0.5) * 40, vx: -e.rx * 200, vy: -e.ry * 200, life: 0.3, max: 0.3, size: 26 + R() * 20, a: Math.atan2(e.ry, e.rx) }));
        break;
      case 'overheat': add({ kind: 'text', x: b.x, y: b.y - 44, vy: -30, life: 0.9, max: 0.9, text: '¡recalentado!', size: 18, color: '#ffb36b' }); break;
      case 'fuelOut': add({ kind: 'text', x: b.x, y: b.y - 44, vy: -30, life: 0.8, max: 0.8, text: 'sin turbo', size: 16 }); break;
      case 'pickup': add({ kind: 'text', x: b.x, y: b.y - 50, vy: -40, life: 1.3, max: 1.3, text: e.name, size: 22, color: PLAYER_COLORS[b.id].main }); n(10, () => { const a = R() * TAU; return { kind: 'spark', x: b.x, y: b.y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, drag: 3, life: 0.4, max: 0.4, size: 6, color: PLAYER_COLORS[b.id].glow }; }); break;
      case 'flares': flash = Math.max(flash, 0.12); add({ kind: 'text', x: b.x, y: b.y - 50, vy: -40, life: 1.4, max: 1.4, text: '¡bengalas automáticas!', size: 21, color: '#ffe08a' }); add({ kind: 'ring', x: b.x, y: b.y, life: 0.4, max: 0.4, size: 20, grow: 260, color: '255,236,170' }); break;
      case 'dodged': add({ kind: 'text', x: b.x, y: b.y - 50, vy: -40, life: 1.1, max: 1.1, text: '¡esquivado!', size: 20, color: '#bff7ff' }); break;
      case 'six': if (G && G.bots && G.bots[b.id]) break; add({ kind: 'text', x: b.x, y: b.y - 52, vy: -26, life: 1.2, max: 1.2, text: '¡a tus seis!', size: 19, color: '#ff8f8f' }); break;
      case 'crownGone':
        shake = Math.max(shake, 5);
        n(18, () => { const a = R() * TAU, v = 60 + R() * 220; return { kind: 'leaf', x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, g: 160, drag: 1.4, rot: R() * TAU, vr: (R() - 0.5) * 8, life: 3, max: 3, size: 10 + R() * 8 }; });
        break;
      case 'bump':
        shake = Math.max(shake, 6);
        add({ kind: 'ring', x: e.x, y: e.y, life: 0.3, max: 0.3, size: 14, grow: 120, color: '255,255,255' });
        break;
      case 'points': add({ kind: 'trick', x: e.x, y: e.y - 30, vy: -60, life: 1, max: 1, text: `+${e.n}`, size: e.n > 1 ? 30 : 24, color: PLAYER_COLORS[b.id].main, rot: 0 }); break;
      case 'caseTake': add({ kind: 'trick', x: b.x, y: b.y - 64, vy: -40, life: 1.4, max: 1.4, text: '¡Tiene el maletín!', size: 22, color: PLAYER_COLORS[b.id].main, rot: 0 }); add({ kind: 'ring', x: b.x, y: b.y, life: 0.5, max: 0.5, size: 20, grow: 140, color: '255,214,90' }); break;
      case 'caseSteal': add({ kind: 'trick', x: b.x, y: b.y - 64, vy: -40, life: 1.4, max: 1.4, text: '¡Robado!', size: 26, color: PLAYER_COLORS[b.id].main, rot: -0.05 }); add({ kind: 'ring', x: b.x, y: b.y, life: 0.5, max: 0.5, size: 20, grow: 160, color: '255,214,90' }); shake = Math.max(shake, 6); break;
      case 'caseDrop': add({ kind: 'text', x: e.x, y: e.y - 50, vy: -40, life: 1.2, max: 1.2, text: '¡se le cayó el maletín!', size: 18, color: '#ffd23f' }); break;
      case 'enemyShot': add({ kind: 'muzzle', x: e.x, y: e.y, a: 0, life: 0.05, max: 0.05, size: 12 }); break;
      case 'bossSmoke': add({ kind: 'smoke', x: e.x + (R() - 0.5) * 20, y: e.y, vx: (R() - 0.5) * 30, vy: -40, drag: 1, g: -30, life: 1.6, max: 1.6, size: 10 + R() * 10, shade: 40 }); if (R() < 0.4) add({ kind: 'fire', x: e.x, y: e.y, vx: 0, vy: -30, drag: 2, life: 0.4, max: 0.4, size: 10 + R() * 8 }); break;
      case 'partDown': add({ kind: 'trick', x: e.x, y: e.y - 60, vy: -40, life: 1.6, max: 1.6, text: '¡' + e.name.charAt(0).toUpperCase() + e.name.slice(1) + ' destruido!', size: 22, color: e.by >= 0 ? PLAYER_COLORS[e.by].main : '#ffffff', rot: 0 }); debris(e.x, e.y, 0, 0, ['#4a2632', '#3d3440', '#ffb347', '#1d1018']); break;
      case 'shieldDown': flash = Math.max(flash, 0.25); add({ kind: 'ring', x: e.x, y: e.y, life: 0.8, max: 0.8, size: 40, grow: 400, color: '120,200,255' }); add({ kind: 'trick', x: e.x, y: e.y - 90, vy: -30, life: 2.2, max: 2.2, text: '¡El puente está expuesto!', size: 26, color: '#9fdcff', rot: 0 }); break;
      case 'bossRing': add({ kind: 'ring', x: e.x, y: e.y, life: 0.4, max: 0.4, size: 30, grow: 160, color: '255,90,78' }); break;
      case 'bossDrone': if (G && G.tm) { add({ kind: 'ring', x: e.x, y: e.y, life: 0.4, max: 0.4, size: 14, grow: 90, color: '255,90,78' }); break; } add({ kind: 'text', x: e.x, y: e.y + 40, vy: 20, life: 1.2, max: 1.2, text: '¡drones!', size: 18, color: '#ff8f8f' }); break;
      case 'bossDown': shake = Math.max(shake, 22); flash = Math.max(flash, 0.7); for (let i = 0; i < 4; i++) explosion(e.x + (R() - 0.5) * 500, e.y + (R() - 0.5) * 160, 1.6); break;
      case 'bolt': shake = Math.max(shake, 10); n(16, () => { const a = -Math.PI / 2 + (R() - 0.5) * 2.4, v = 150 + R() * 400; return { kind: 'spark', x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 2, g: 600, life: 0.5, max: 0.5, size: 9, color: '200,220,255' }; }); add({ kind: 'ring', x: e.x, y: e.y, life: 0.4, max: 0.4, size: 20, grow: 180, color: '200,220,255' }); break;
      case 'cannon': {
        // fogonazo y nube de humo que sale de la boca del cañón
        shake = Math.max(shake, 5);
        add({ kind: 'ring', x: e.x, y: e.y, life: 0.25, max: 0.25, size: 14, grow: 120, color: '255,200,120' });
        n(10, () => ({ kind: 'smoke', x: e.x + e.dir * R() * 30, y: e.y - R() * 12, vx: e.dir * (60 + R() * 140), vy: -30 - R() * 50, drag: 1.4, g: -20, life: 1.4 + R() * 0.8, max: 2.2, size: 14 + R() * 16, shade: 200 }));
        n(6, () => { const a = (e.dir > 0 ? 0 : Math.PI) - 0.5 + (R() - 0.5) * 0.8, v = 200 + R() * 300; return { kind: 'spark', x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 4, g: 300, life: 0.35, max: 0.35, size: 8, color: '255,190,110' }; });
        break;
      }
      case 'splash':
        // columna de espuma
        n(26, () => ({ kind: 'spray', x: e.x + (R() - 0.5) * 30, y: e.y, vx: (R() - 0.5) * 160, vy: -260 - R() * 420, g: 700, drag: 1, life: 1.1, max: 1.1, size: 4 + R() * 5, color: '#ffffff' }));
        add({ kind: 'ring', x: e.x, y: e.y, life: 0.5, max: 0.5, size: 10, grow: 110, color: '220,235,255' });
        break;
      case 'deliver':
        add({ kind: 'trick', x: e.x, y: e.y - 90, vy: -40, life: 1.6, max: 1.6, text: `¡Entregado! ${e.n}`, size: 28, color: '#9dff9a', rot: 0 });
        add({ kind: 'ring', x: e.x, y: e.y, life: 0.6, max: 0.6, size: 40, grow: 260, color: '160,255,180' });
        n(18, () => { const a = R() * TAU, v = 150 + R() * 260; return { kind: 'spark', x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, drag: 2.5, g: 300, life: 0.7, max: 0.7, size: 7, color: '170,255,190' }; });
        break;
      case 'wave': add({ kind: 'trick', x: e.x, y: e.y - 110, vy: -30, life: 1.8, max: 1.8, text: `¡Oleada ${e.n} de ${e.of}!`, size: 30, color: '#ff8f8f', rot: 0 }); break;
      case 'relayHint': if (G && G.bots && G.bots[e.b.id]) break; add({ kind: 'text', x: e.x, y: e.y - 50, vy: -30, life: 1.2, max: 1.2, text: `ese aro es de J${e.who + 1}`, size: 17, color: PLAYER_COLORS[e.who].main }); break;
      case 'gate': add({ kind: 'ring', x: e.x, y: e.y, life: 0.45, max: 0.45, size: 30, grow: 160, color: PLAYER_COLORS[e.b.id].glow }); break;
      case 'lap': add({ kind: 'trick', x: e.b.x, y: e.b.y - 70, vy: -40, life: 1.6, max: 1.6, text: e.last ? '¡Última vuelta!' : `¡Vuelta ${e.lap}!`, size: 26, color: PLAYER_COLORS[e.b.id].main, rot: 0 }); break;
      case 'cannonHit': add({ kind: 'text', x: e.x, y: e.y - 50, vy: -40, life: 1.1, max: 1.1, text: '¡cañonazo!', size: 20, color: '#ffbf80' }); break;
      case 'ballDown': add({ kind: 'ring', x: e.x, y: e.y, life: 0.4, max: 0.4, size: 12, grow: 120, color: (PLAYER_COLORS[e.by] || ENEMY_COLOR).glow }); break;
      case 'zap': add({ kind: 'text', x: e.x, y: e.y - 50, vy: -40, life: 1.1, max: 1.1, text: '¡rayo!', size: 20, color: '#bfd4ff' }); n(12, () => { const a = R() * TAU, v = 100 + R() * 300; return { kind: 'spark', x: e.x, y: e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 3, life: 0.4, max: 0.4, size: 8, color: '200,220,255' }; }); break;
      case 'gust': for (let i = 0; i < 26; i++) add({ kind: 'gust', x: (G && G.world ? G.world.w : 3800) * R(), y: 200 + R() * 1700, vx: e.dir * (900 + R() * 500), vy: 0, life: 1.2, max: 1.2, size: 90 + R() * 120, a: e.dir > 0 ? 0 : Math.PI }); break;
      case 'missileDown': add({ kind: 'ring', x: e.x, y: e.y, life: 0.35, max: 0.35, size: 10, grow: 90, color: (PLAYER_COLORS[e.by] || ENEMY_COLOR).glow }); break;
    }
  }
  function update(dt, G, cam, sw, sh) {
    shake = Math.max(0, shake - dt * 30); flash = Math.max(0, flash - dt * 1.6);
    if (R() < dt * 10) {
      const x = cam.x + (R() - 0.5) * sw / cam.z * 1.2, y = cam.y + (R() - 0.5) * sh / cam.z * 1.2;
      add({ kind: 'mote', x, y, vx: 10 + R() * 20, vy: -6 + R() * 12, life: 4, max: 4, size: 1.2 + R() * 2.2 });
    }
    if (dt > 0) for (const b of G.birds) {
      if (!b.alive) continue;
      // daño: humo claro, humo negro y fuego
      const hpK = b.hp / b.sp.hp, back = { x: b.x - Math.cos(b.a) * 14, y: b.y - Math.sin(b.a) * 14 };
      if (hpK < 0.6 && R() < dt * (hpK < 0.3 ? 30 : 14)) add({ kind: 'smoke', x: back.x, y: back.y, vx: -b.vx * 0.1, vy: -b.vy * 0.1 - 20, drag: 1.5, g: -25, life: 1.2, max: 1.2, size: 7 + R() * 7, shade: hpK < 0.3 ? 50 : 170 });
      if (hpK < 0.18 && R() < dt * 25) add({ kind: 'fire', x: back.x, y: back.y, vx: -b.vx * 0.15, vy: -b.vy * 0.15 - 40, drag: 3, life: 0.35, max: 0.35, size: 7 + R() * 6 });
      if (b.rasante && R() < dt * 40) { const W = G.world, wet = World.isWater(W, b.x), city = W.id === 'medellin'; add({ kind: 'dust', x: b.x - Math.cos(b.va) * 20, y: World.floorY(W, b.x, b.y) - 4, vx: -b.vx * 0.3 + (R() - 0.5) * 80, vy: -60 - R() * (wet ? 220 : 120), drag: 2, g: wet ? 500 : 200, life: 0.7, max: 0.7, size: 6 + R() * 8, color: wet ? '#d8e8ff' : city ? '#a898ac' : '#d9efc8' }); }
      if (b.drafting && R() < dt * 30) { const off = (R() - 0.5) * 60; add({ kind: 'streak', x: b.x - Math.sin(b.va) * off, y: b.y + Math.cos(b.va) * off, vx: b.vx * 0.2, vy: b.vy * 0.2, life: 0.25, max: 0.25, size: 40 + R() * 40, a: b.va }); }
      if (b.legendT > 0 && R() < dt * 30) add({ kind: 'spark', x: b.x + (R() - 0.5) * 30, y: b.y + (R() - 0.5) * 30, vx: -b.vx * 0.2, vy: -b.vy * 0.2 - 40, drag: 2, life: 0.5, max: 0.5, size: 6, color: '255,214,90' });
      // vapor en las puntas del ala al tirar fuerte a toda velocidad
      const pv = vaPrev[b.id], rate = pv == null ? 0 : Math.abs(angDiff(pv, b.va)) / dt; vaPrev[b.id] = b.va;
      if (!b.perch && b.s > 520 && rate > 2.4) {
        const k = b.sp.size * 1.24 * (G.vs || 1), ca = Math.cos(b.a), sa = Math.sin(b.a), sy = b.c;
        for (const [lx, ly] of [[-15, -18.5], [-13, 19.5]]) if (R() < dt * 70) add({ kind: 'vapor', x: b.x + (lx * ca - ly * sy * sa) * k, y: b.y + (lx * sa + ly * sy * ca) * k, vx: b.vx * 0.1, vy: b.vy * 0.1, life: 0.45, max: 0.45, size: 2.2 * k });
      }
      // rayas de velocidad
      if (!b.perch && b.s > 820 && R() < dt * 40 * (b.s - 760) / 400) {
        const off = (R() - 0.5) * 80, px = -Math.sin(b.a) * off, py = Math.cos(b.a) * off;
        add({ kind: 'streak', x: b.x + px + Math.cos(b.a) * 40, y: b.y + py + Math.sin(b.a) * 40, vx: b.vx * 0.15, vy: b.vy * 0.15, life: 0.26, max: 0.26, size: 30 + R() * 50, a: b.a });
      }
    }
    if (dt > 0) {
      for (const m of G.missiles || []) if (R() < dt * 70) add({ kind: 'smoke', x: m.x - Math.cos(m.a) * 12, y: m.y - Math.sin(m.a) * 12, vx: (R() - 0.5) * 24, vy: (R() - 0.5) * 24, drag: 1.2, g: -12, life: 0.9, max: 0.9, size: 3.5 + R() * 3, shade: 230 });
      for (const f of G.flares || []) if (R() < dt * 40) add({ kind: 'spark', x: f.x, y: f.y, vx: (R() - 0.5) * 60, vy: 40, drag: 2, life: 0.35, max: 0.35, size: 4, color: '255,236,170' });
      for (const p of G.chutes || []) if (!p.open && R() < dt * 20) add({ kind: 'smoke', x: p.x, y: p.y, vx: 0, vy: 0, life: 0.6, max: 0.6, size: 5, shade: 200 });
    }
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.life -= dt;
      if (p.life <= 0) { P.splice(i, 1); continue; }
      if (p.drag) { const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= d; }
      p.vy += p.g * dt;
      if (p.kind === 'leaf') p.vx += Math.sin(p.life * 4 + p.rot) * 80 * dt;
      if (p.kind === 'chunk' && p.smoky && R() < dt * 30) add({ kind: 'smoke', x: p.x, y: p.y, vx: 0, vy: -10, drag: 1, g: -20, life: 0.9, max: 0.9, size: 5 + R() * 5, shade: 40 });
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if ((p.kind === 'chunk' || p.kind === 'glass') && G.world && p.y > G.world.groundY(p.x)) { p.y = G.world.groundY(p.x); p.vy *= -0.3; p.vx *= 0.6; p.vr *= 0.5; if (p.kind === 'glass') p.life = Math.min(p.life, 0.5); }
    }
  }
  // minY: los letreros no suben más allá de esta altura del mundo (para no montarse en los paneles de arriba)
  function draw(ctx, layer, textK = 1, minY = -Infinity) {
    for (const p of P) {
      const k = p.life / p.max;
      const back = p.kind === 'mote' || p.kind === 'smoke' || p.kind === 'smokeLit';
      if (layer === 'back' ? !back : back) continue;
      ctx.save();
      switch (p.kind) {
        case 'mote': ctx.globalAlpha = Math.sin(k * Math.PI) * 0.7; ctx.fillStyle = '#fff0d2'; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill(); break;
        case 'smoke': { const c = p.shade; ctx.globalAlpha = 0.5 * k * Math.min(1, (1 - k) * 6 + 0.3); ctx.fillStyle = `rgb(${c},${c},${c + 8})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.8 - k * 0.8), 0, TAU); ctx.fill(); break; }
        case 'fire': { ctx.globalCompositeOperation = 'lighter'; const r = p.size * (0.6 + k * 0.6); const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r); g.addColorStop(0, `rgba(255,${Math.round(200 * k + 40)},${Math.round(120 * k)},${0.9 * k})`); g.addColorStop(1, 'rgba(255,60,20,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill(); break; }
        case 'fireball': { ctx.globalCompositeOperation = 'lighter'; const u = 1 - k, r = p.size * (0.45 + 0.75 * Math.sqrt(u)); const g = ctx.createRadialGradient(p.x - r * 0.15, p.y - r * 0.2, r * 0.05, p.x, p.y, r);
          g.addColorStop(0, `rgba(255,255,235,${Math.min(1, k * 1.6)})`); g.addColorStop(0.28, `rgba(255,${Math.round(150 + 90 * k)},${Math.round(60 + 60 * k)},${0.95 * k})`); g.addColorStop(0.7, `rgba(${Math.round(200 + 55 * k)},${Math.round(60 + 40 * k)},20,${0.7 * k})`); g.addColorStop(1, 'rgba(120,20,10,0)');
          ctx.fillStyle = g; ctx.beginPath(); for (let q = 0; q <= 14; q++) { const a = q / 14 * TAU, rr = r * (0.86 + 0.14 * Math.sin(a * 3 + p.seed + u * 4)); ctx.lineTo(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr); } ctx.fill(); break; }
        case 'shock': ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,245,230,${0.55 * k})`; ctx.lineWidth = 1 + 3 * k; ctx.beginPath(); ctx.arc(p.x, p.y, p.size + (1 - k) * p.grow, 0, TAU); ctx.stroke(); break;
        case 'smokeLit': { const u = 1 - k, r = p.size * (0.8 + u * 1.3), lit = Math.max(0, 1 - u * 3); ctx.globalAlpha = 0.42 * Math.min(1, k * 1.5) * Math.min(1, u * 8 + 0.2); const g = ctx.createRadialGradient(p.x - r * 0.2, p.y - r * 0.3, r * 0.1, p.x, p.y, r);
          g.addColorStop(0, `rgb(${Math.round(70 + 180 * lit)},${Math.round(62 + 80 * lit)},${Math.round(64 + 20 * lit)})`); g.addColorStop(0.7, `rgba(${Math.round(40 + 120 * lit)},${Math.round(36 + 40 * lit)},${Math.round(42)},0.85)`); g.addColorStop(1, 'rgba(30,28,34,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill(); break; }
        case 'flash': { ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size); g.addColorStop(0, `rgba(255,255,235,${k})`); g.addColorStop(0.4, `rgba(255,200,120,${0.6 * k})`); g.addColorStop(1, 'rgba(255,140,60,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill(); break; }
        case 'ring': ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${p.color},${0.6 * k})`; ctx.lineWidth = 2 + 5 * k; ctx.beginPath(); ctx.arc(p.x, p.y, p.size + (1 - k) * (p.grow || 60), 0, TAU); ctx.stroke(); break;
        case 'spark': ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${p.color || '255,214,140'},${k})`; ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.02 * (p.size / 8), p.y - p.vy * 0.02 * (p.size / 8)); ctx.stroke(); break;
        case 'muzzle': { ctx.globalCompositeOperation = 'lighter'; ctx.translate(p.x, p.y); ctx.rotate(p.a); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size); g.addColorStop(0, 'rgba(255,255,220,0.95)'); g.addColorStop(1, 'rgba(255,170,60,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(p.size * 0.4, 0, p.size, p.size * 0.45, 0, 0, TAU); ctx.fill(); break; }
        case 'gust': case 'streak': ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,255,255,${0.32 * k})`; ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - Math.cos(p.a) * p.size, p.y - Math.sin(p.a) * p.size); ctx.stroke(); break;
        case 'chunk': ctx.globalAlpha = Math.min(1, k * 3); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color; ctx.beginPath(); ctx.moveTo(-p.size, -p.size * 0.4); ctx.lineTo(p.size, -p.size * 0.6); ctx.lineTo(p.size * 0.6, p.size * 0.5); ctx.lineTo(-p.size * 0.8, p.size * 0.3); ctx.closePath(); ctx.fill(); break;
        case 'glass': { ctx.globalAlpha = Math.min(1, k * 3); ctx.translate(p.x, p.y); ctx.rotate(p.rot); const tw = 0.5 + 0.5 * Math.sin(p.life * 18 + p.ph); ctx.fillStyle = `rgba(${Math.round(190 + 65 * tw)},${Math.round(215 + 40 * tw)},255,0.9)`; ctx.beginPath(); ctx.moveTo(-p.size, -p.size * 0.5); ctx.lineTo(p.size, -p.size * 0.2); ctx.lineTo(-p.size * 0.2, p.size * 0.7); ctx.closePath(); ctx.fill(); break; }
        case 'cone': {
          // cono de vapor de la barrera del sonido
          ctx.globalCompositeOperation = 'lighter'; ctx.translate(p.x, p.y); ctx.rotate(p.a);
          const L = p.size * (1.4 - k * 0.4), g = ctx.createLinearGradient(L * 0.3, 0, -L, 0);
          g.addColorStop(0, `rgba(240,248,255,${0.55 * k})`); g.addColorStop(1, 'rgba(240,248,255,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(L * 0.3, 0); ctx.quadraticCurveTo(-L * 0.2, -L * 0.75, -L, -L * 0.8); ctx.lineTo(-L * 0.7, 0); ctx.lineTo(-L, L * 0.8); ctx.quadraticCurveTo(-L * 0.2, L * 0.75, L * 0.3, 0); ctx.fill(); break;
        }
        case 'vapor': ctx.globalAlpha = 0.35 * k; ctx.fillStyle = '#f4f8ff'; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.5 - k * 0.5), 0, TAU); ctx.fill(); break;
        case 'leaf': ctx.globalAlpha = Math.min(1, k * 2); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = '#3f7d50'; ctx.beginPath(); ctx.ellipse(0, 0, p.size, p.size * 0.28, 0, 0, TAU); ctx.fill(); break;
        case 'spray': ctx.globalAlpha = k; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill(); break;
        case 'dust': ctx.globalAlpha = 0.45 * k; ctx.fillStyle = p.color || '#fff1dc'; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.6 - k), 0, TAU); ctx.fill(); break;
        case 'trick': {
          ctx.globalAlpha = Math.min(1, k * 3); const pop = 1 + Math.max(0, (k - 0.85) * 3);
          ctx.translate(p.x, Math.max(p.y, minY)); ctx.rotate(p.rot); ctx.scale(pop, pop);
          ctx.font = font(Math.round(p.size * 0.8 * textK)); ctx.textAlign = 'center';
          ctx.lineWidth = 5 * textK; ctx.strokeStyle = 'rgba(20,10,45,0.7)'; ctx.strokeText(p.text, 0, 0);
          if (!p.weak) { ctx.shadowColor = p.color; ctx.shadowBlur = 12 * textK; }
          ctx.fillStyle = p.weak ? 'rgba(255,255,255,0.75)' : p.color; ctx.fillText(p.text, 0, 0); break;
        }
        case 'text': { const ty = Math.max(p.y, minY); ctx.globalAlpha = Math.min(1, k * 2.5); ctx.font = font(Math.round(p.size * 0.8 * textK)); ctx.textAlign = 'center'; ctx.lineWidth = 3.5 * textK; ctx.strokeStyle = 'rgba(25,15,50,0.55)'; ctx.strokeText(p.text, p.x, ty); ctx.fillStyle = p.color || '#ffffff'; ctx.fillText(p.text, p.x, ty); break; }
      }
      ctx.restore();
    }
  }

  /* ---------- entidades del combate ---------- */
  function drawCombat(ctx, G) {
    const vs = G.vs || 1;
    // balas trazadoras
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (const u of G.bullets) {
      const pc = PLAYER_COLORS[u.owner] || ENEMY_COLOR;
      ctx.strokeStyle = `rgba(${pc.glow},0.75)`; ctx.lineWidth = 3.4 * vs;
      ctx.beginPath(); ctx.moveTo(u.x - u.vx * 0.022, u.y - u.vy * 0.022); ctx.lineTo(u.x, u.y); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 1.4 * vs;
      ctx.beginPath(); ctx.moveTo(u.x - u.vx * 0.012, u.y - u.vy * 0.012); ctx.lineTo(u.x, u.y); ctx.stroke();
    }
    // bengalas
    for (const f of G.flares) {
      // estela de humo blanco que se curva y núcleo de magnesio enceguecedor
      if (f.trail && f.trail.length > 2) { ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.lineCap = 'round'; for (let i = 1; i < f.trail.length; i++) { const a = G.time - f.trail[i].t, k = clamp(1 - a / 1.1, 0, 1); if (k <= 0) continue; ctx.strokeStyle = `rgba(240,236,232,${0.45 * k})`; ctx.lineWidth = 3 + (1 - k) * 10; ctx.beginPath(); ctx.moveTo(f.trail[i - 1].x, f.trail[i - 1].y); ctx.lineTo(f.trail[i].x, f.trail[i].y); ctx.stroke(); } ctx.restore(); }
      const fl = 0.8 + 0.4 * Math.random(), R2 = 46 * fl;
      const g0 = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, R2); g0.addColorStop(0, 'rgba(255,240,200,0.55)'); g0.addColorStop(1, 'rgba(255,170,70,0)'); ctx.fillStyle = g0; ctx.beginPath(); ctx.arc(f.x, f.y, R2, 0, TAU); ctx.fill();
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 22);
      g.addColorStop(0, 'rgba(255,255,230,1)'); g.addColorStop(0.3, 'rgba(255,220,120,0.7)'); g.addColorStop(1, 'rgba(255,160,60,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, 22, 0, TAU); ctx.fill();
    }
    ctx.restore();
    // estela de humo de los misiles (línea continua que se desvanece)
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const m of G.missiles) {
      const tr = m.trail; if (tr.length < 2) continue;
      for (let i = 1; i < tr.length; i++) {
        const age = G.time - tr[i].t; if (age > 0.8) continue;
        const k = 1 - age / 0.8;
        ctx.strokeStyle = `rgba(235,235,242,${0.5 * k})`; ctx.lineWidth = 3 + (1 - k) * 9;
        ctx.beginPath(); ctx.moveTo(tr[i - 1].x, tr[i - 1].y); ctx.lineTo(tr[i].x, tr[i].y); ctx.stroke();
      }
    }
    ctx.restore();
    // misiles
    for (const m of G.missiles) {
      ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.a); ctx.scale(vs * 1.15, vs * 1.15);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const fl = 16 + Math.random() * 8, g = ctx.createLinearGradient(-8, 0, -8 - fl, 0);
      g.addColorStop(0, 'rgba(255,250,220,0.95)'); g.addColorStop(0.4, 'rgba(255,170,70,0.7)'); g.addColorStop(1, 'rgba(255,90,40,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-8, -3); ctx.lineTo(-8 - fl, 0); ctx.lineTo(-8, 3); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#e9edf3'; ctx.beginPath(); ctx.roundRect(-9, -2.6, 18, 5.2, 2.6); ctx.fill();
      ctx.fillStyle = (PLAYER_COLORS[m.owner] || ENEMY_COLOR).main; ctx.beginPath(); ctx.moveTo(9, -2.6); ctx.quadraticCurveTo(14, 0, 9, 2.6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#7d8696'; ctx.beginPath(); ctx.moveTo(-9, -2.4); ctx.lineTo(-12, -6); ctx.lineTo(-5, -2.4); ctx.moveTo(-9, 2.4); ctx.lineTo(-12, 6); ctx.lineTo(-5, 2.4); ctx.fill();
      ctx.restore();
    }
    // cajas del cielo
    for (const c of G.crates) {
      ctx.save(); ctx.translate(c.x, c.y); ctx.scale(vs, vs);
      const blink = c.landed && c.life < 2 && Math.sin(G.time * 20) > 0;
      if (blink) ctx.globalAlpha = 0.4;
      if (!c.landed) {
        const sw = Math.sin(G.time * 1.3 + c.sway) * 0.12;
        ctx.save(); ctx.rotate(sw);
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(-14, -14); ctx.lineTo(-30, -58); ctx.moveTo(14, -14); ctx.lineTo(30, -58); ctx.moveTo(0, -16); ctx.lineTo(0, -64); ctx.stroke();
        for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? '#ffffff' : CRATE_COLOR[c.type]; ctx.beginPath(); ctx.moveTo(0, -58); ctx.arc(0, -58, 38, Math.PI + i * Math.PI / 5, Math.PI + (i + 1) * Math.PI / 5); ctx.closePath(); ctx.fill(); }
        ctx.restore();
      }
      const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 34); glow.addColorStop(0, 'rgba(255,255,255,0.35)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); ctx.fill();
      ctx.fillStyle = CRATE_COLOR[c.type]; ctx.beginPath(); ctx.roundRect(-16, -16, 32, 32, 6); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(-16, -16, 32, 9);
      crateIcon(ctx, c.type);
      ctx.restore();
    }
    // pilotos eyectados
    for (const p of G.chutes) {
      const pc = PLAYER_COLORS[p.id];
      ctx.save(); ctx.translate(p.x, p.y); ctx.scale(vs, vs);
      if (p.open) {
        const sw = Math.sin(G.time * 1.4 + p.id) * 0.1; ctx.rotate(sw);
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-5, -6); ctx.lineTo(-28, -50); ctx.moveTo(5, -6); ctx.lineTo(28, -50); ctx.moveTo(0, -6); ctx.lineTo(0, -58); ctx.stroke();
        for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#ffffff' : pc.main; ctx.beginPath(); ctx.moveTo(0, -50); ctx.arc(0, -50, 36, Math.PI + i * Math.PI / 6, Math.PI + (i + 1) * Math.PI / 6); ctx.closePath(); ctx.fill(); }
      } else ctx.rotate(p.t * 9);
      ctx.fillStyle = '#2b303c'; ctx.beginPath(); ctx.roundRect(-4, -4, 8, 16, 4); ctx.fill();
      ctx.fillStyle = pc.main; ctx.beginPath(); ctx.arc(0, -7, 5, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }
  const CRATE_COLOR = { misiles: '#e2533d', reparar: '#3fb46a', bengalas: '#f29a2e', escudo: '#3f8fe0', rafaga: '#e8c12f', cohete: '#d64bc4' };
  function crateIcon(ctx, type) {
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    if (type === 'misiles') { ctx.beginPath(); ctx.roundRect(-9, -3, 15, 6, 3); ctx.fill(); ctx.beginPath(); ctx.moveTo(6, -3); ctx.lineTo(11, 0); ctx.lineTo(6, 3); ctx.fill(); }
    else if (type === 'reparar') { ctx.beginPath(); ctx.moveTo(-7, 7); ctx.lineTo(5, -5); ctx.stroke(); ctx.beginPath(); ctx.arc(6, -6, 4.5, 0.6, 5.6); ctx.stroke(); }
    else if (type === 'bengalas') { for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-6 + i * 6, 2 - (i % 2) * 6, 2.8, 0, TAU); ctx.fill(); } }
    else if (type === 'escudo') { ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(8, -5); ctx.quadraticCurveTo(8, 6, 0, 10); ctx.quadraticCurveTo(-8, 6, -8, -5); ctx.closePath(); ctx.fill(); }
    else if (type === 'rafaga') { for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-9, -6 + i * 6); ctx.lineTo(8, -6 + i * 6); ctx.stroke(); } }
    else if (type === 'cohete') { ctx.beginPath(); ctx.moveTo(0, -11); ctx.quadraticCurveTo(6, -4, 4, 5); ctx.lineTo(-4, 5); ctx.quadraticCurveTo(-6, -4, 0, -11); ctx.fill(); ctx.beginPath(); ctx.moveTo(-3, 7); ctx.lineTo(0, 12); ctx.lineTo(3, 7); ctx.fill(); }
  }
  return { event, update, draw, drawCombat, add, explosion, CRATE_COLOR, crateIcon, get shake() { return shake; }, get flash() { return flash; }, clear() { P.length = 0; shake = 0; flash = 0; } };
})();
