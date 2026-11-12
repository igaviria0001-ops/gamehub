/* =========================================================================
   ARTE DE LOS PILOTOS — persona con traje y casco, acostada sobre un ala
   en delta con cuatro turbinas (como el Jetman real), vista de tres cuartos.
   Sin contornos: formas limpias con degradado y brillo.
   Coordenadas locales: la nariz hacia +x, la espalda hacia −y.
   El casco va del color del jugador (J1 sol, J2 cielo) para reconocerlo
   siempre; el ala lleva la pintura del indicativo.
   ========================================================================= */
const ENEMY_COLOR = { main: '#ff5a4e', glow: '255,90,78', deep: '#a0261e', name: 'Enemigo' };
const PLAYER_COLORS = [{ main: '#ffcf5a', glow: '255,207,90', deep: '#c98a12', name: 'Sol' }, { main: '#5ad8ff', glow: '90,216,255', deep: '#1b8fc0', name: 'Cielo' }];

const PILOT_ART = {
  guacamaya: { span: 1, looks: [
    { name: 'Roja', wingA: '#ef4a3a', wingB: '#b3241c', stripe: '#f6c21c', stripe2: '#2a62c9' },
    { name: 'Azul y amarilla', wingA: '#3a8fe6', wingB: '#1b4fa8', stripe: '#f6b21c', stripe2: '#2c8a6a' },
    { name: 'Dorada', wingA: '#f5c542', wingB: '#a87a12', stripe: '#fff3c4', stripe2: '#e2533d', locked: 'leyenda5' } ] },
  colibri: { span: 0.85, looks: [
    { name: 'Esmeralda', wingA: '#2fd3a0', wingB: '#0f8065', stripe: '#b28cff', stripe2: '#e8fff7' },
    { name: 'Violeta', wingA: '#7d6ff7', wingB: '#3c34a8', stripe: '#ff4fa3', stripe2: '#e8e4ff' },
    { name: 'Dorada', wingA: '#f5c542', wingB: '#a87a12', stripe: '#2fd3a0', stripe2: '#fff3c4', locked: 'leyenda5' } ] },
  tucan: { span: 1.05, looks: [
    { name: 'Pico iris', wingA: '#2b2b35', wingB: '#101015', stripe: '#ffd23f', stripe2: '#ff7a2e' },
    { name: 'Pico castaño', wingA: '#36302b', wingB: '#15120f', stripe: '#f5d33b', stripe2: '#c9302c' },
    { name: 'Dorada', wingA: '#f5c542', wingB: '#a87a12', stripe: '#1c1c22', stripe2: '#ff7a2e', locked: 'leyenda5' } ] },
  condor: { span: 1.25, looks: [
    { name: 'Andino', wingA: '#26262e', wingB: '#0d0d11', stripe: '#f2efe8', stripe2: '#c23b2e' },
    { name: 'Joven', wingA: '#6a503c', wingB: '#33251a', stripe: '#dccbb6', stripe2: '#8c5a3a' },
    { name: 'Dorada', wingA: '#f5c542', wingB: '#a87a12', stripe: '#1c1c22', stripe2: '#f2efe8', locked: 'leyenda5' } ] },
};

// pinturas especiales del vestidor: sirven para cualquier piloto. mat = diseño del ala (los del vestidor
// común de GameHub); rot = el diseño va de la nariz a la cola (llamas); edge = bordes de ataque que brillan
const PAINT_GAL = ['255,110,210', '170,100,255', '90,150,255'];
const PAINTS = {
  jaguar: { name: 'Piel de jaguar', wingA: '#d99a2a', wingB: '#6a3a0a', stripe: '#2a1606', stripe2: '#ffd27a', mat: 'jaguar', matC: ['#d99a2a', '#ffd27a', '#2a1606', '#7a3e0a'] },
  caiman: { name: 'Escamas de caimán', wingA: '#2f8a5a', wingB: '#0e3a24', stripe: '#d8f5a0', stripe2: '#9be8b0', mat: 'escamas', matC: ['#2f8a5a', '#9be8b0', '#0e3a24'] },
  llamarada: { name: 'Llamarada', wingA: '#3a0c06', wingB: '#120202', stripe: '#ffd23f', stripe2: '#ff7a1a', mat: 'llamas', matC: ['#4a0c06', '#140302', '255,226,110', '255,84,16'], rot: true },
  tormenta: { name: 'Tormenta eléctrica', wingA: '#3a4660', wingB: '#0a0e18', stripe: '#bfe4ff', stripe2: '#5ab8ff', mat: 'tormenta', matC: ['#1a2234', '120,140,180'] },
  aurora: { name: 'Aurora boreal', wingA: '#0a2a3a', wingB: '#02080c', stripe: '#9affd8', stripe2: '#c79aff', mat: 'aurora', matC: ['#06121e', '110,255,190', '170,110,255'] },
  cristal: { name: 'Hielo tallado', wingA: '#bfeeff', wingB: '#3a7aa8', stripe: '#ffffff', stripe2: '#7ae0ff', mat: 'cristal', matC: ['#bfeeff', '#6ab8e8', '#f2fdff'] },
  magma: { name: 'Magma', wingA: '#3a1208', wingB: '#0a0404', stripe: '#ff9a3a', stripe2: '#ffcf6a', mat: 'lava', matC: ['#2a0e08', '#0a0404'], edge: '255,120,40' },
  oro: { name: 'Filigrana de oro', wingA: '#e8b030', wingB: '#7a4a08', stripe: '#fff6d0', stripe2: '#8a2a14', mat: 'oro', matC: ['#e8b030', '#fff0a8', '#9a6410'], edge: '255,226,140' },
  fatuo: { name: 'Fuego fatuo', wingA: '#0a2a5a', wingB: '#020814', stripe: '#9ff0ff', stripe2: '#4ab8ff', mat: 'llamas', matC: ['#0a2458', '#030a1c', '160,240,255', '50,110,255'], rot: true, edge: '120,210,255' },
  galaxia: { name: 'Galaxia', wingA: '#1a0e40', wingB: '#05020e', stripe: '#ffd6f6', stripe2: '#ff6fd8', mat: 'galaxia', matC: PAINT_GAL, edge: '255,140,230' },
  agujero: { name: 'Agujero negro', wingA: '#120618', wingB: '#000000', stripe: '#c88aff', stripe2: '#8a3aff', mat: 'vacio', matC: ['#3a0a5a', '200,120,255'], edge: '190,110,255' },
  holo: { name: 'Holográfica', wingA: '#dfe4f0', wingB: '#6a7490', stripe: '#ffffff', stripe2: '#ff9be6', mat: 'holo', matC: [], edge: 'holo' },
};
const PAINT_ORDER = Object.keys(PAINTS);

const ArtPilot = (() => {
  // la pintura puede venir como número (las de antes), como «especie.n» o como «u.clave» (para cualquier piloto)
  const LOOKS = {};
  function look(spid, lk) {
    const key = spid + '|' + lk; if (LOOKS[key]) return LOOKS[key];
    const A = PILOT_ART[spid] || PILOT_ART.guacamaya; let L = A.looks[0];
    if (typeof lk === 'number') L = A.looks[((lk % A.looks.length) + A.looks.length) % A.looks.length];
    else if (typeof lk === 'string' && lk.startsWith('u.') && PAINTS[lk.slice(2)]) L = PAINTS[lk.slice(2)];
    else if (typeof lk === 'string') L = A.looks[+lk.split('.')[1] || 0] || A.looks[0];
    return (LOOKS[key] = L);
  }
  const SUIT = '#3a4154', SUIT2 = '#242936', BOOT = '#171a22';
  const L2 = (A, B, u) => ({ x: A.x + (B.x - A.x) * u, y: A.y + (B.y - A.y) * u });
  // luz del escenario que pega en el borde del ala (cálida al atardecer, fría de noche)
  const RIM = { cocora: '255,214,176', medellin: '160,195,255', bogota: '180,205,255', cartagena: '255,186,120', capadocia: '255,208,164' };
  function flame(ctx, x, y, len, w, t, k) {
    const f = len * (0.85 + 0.15 * Math.sin(t * 60 + k * 2.1));
    const g = ctx.createLinearGradient(x, y, x - f, y);
    g.addColorStop(0, 'rgba(255,255,240,0.95)'); g.addColorStop(0.25, 'rgba(255,200,90,0.85)'); g.addColorStop(0.7, 'rgba(255,90,40,0.45)'); g.addColorStop(1, 'rgba(255,60,30,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x, y - w); ctx.quadraticCurveTo(x - f * 0.5, y - w * 0.9, x - f, y); ctx.quadraticCurveTo(x - f * 0.5, y + w * 0.9, x, y + w); ctx.closePath(); ctx.fill();
    // núcleo azul-blanco del chorro (lo más caliente) y halo
    const c = ctx.createLinearGradient(x, y, x - f * 0.42, y); c.addColorStop(0, 'rgba(235,245,255,1)'); c.addColorStop(0.5, 'rgba(140,190,255,0.75)'); c.addColorStop(1, 'rgba(120,160,255,0)');
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, y - w * 0.55); ctx.quadraticCurveTo(x - f * 0.22, y - w * 0.4, x - f * 0.42, y); ctx.quadraticCurveTo(x - f * 0.22, y + w * 0.4, x, y + w * 0.55); ctx.closePath(); ctx.fill();
    const h = ctx.createRadialGradient(x - f * 0.25, y, 0, x - f * 0.25, y, f * 0.7 + w * 2); h.addColorStop(0, 'rgba(255,170,90,0.22)'); h.addColorStop(1, 'rgba(255,120,60,0)'); ctx.fillStyle = h; ctx.beginPath(); ctx.arc(x - f * 0.25, y, f * 0.7 + w * 2, 0, TAU); ctx.fill();
  }
  // góndola de turbina: cilindro metálico con aro de admisión, banda de color y tobera que se enciende
  function nozzle(ctx, p, far, hot = 0, band = null) {
    const x0 = p.x - 2.6, x1 = p.x + 6.2, h = far ? 2.2 : 2.6, g = ctx.createLinearGradient(0, p.y - h, 0, p.y + h);
    g.addColorStop(0, far ? '#6b7282' : '#aab2c2'); g.addColorStop(0.35, far ? '#474d5a' : '#6d7586'); g.addColorStop(1, far ? '#1c2028' : '#2a2f3a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x0, p.y - h, x1 - x0, h * 2, h * 0.8); ctx.fill();
    if (band) { ctx.fillStyle = band; ctx.fillRect(p.x + 2.2, p.y - h, 1.3, h * 2); }
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x0 + 1.4, p.y - h + 0.5, x1 - x0 - 3, 0.55);
    // aro de admisión (delante) y tobera (atrás)
    ctx.fillStyle = far ? '#2a2e38' : '#3a404c'; ctx.beginPath(); ctx.ellipse(x1 - 0.4, p.y, 0.9, h, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#12141a'; ctx.beginPath(); ctx.ellipse(x0 + 0.5, p.y, 1.25, h * 0.95, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = hot > 0 ? `rgba(255,${Math.round(150 + 90 * hot)},${Math.round(70 + 120 * hot)},${0.55 + 0.45 * hot})` : 'rgba(255,140,70,0.4)'; ctx.beginPath(); ctx.ellipse(x0 + 0.3, p.y, 0.8, h * 0.62, 0, 0, TAU); ctx.fill();
  }

  // estado solo de dibujo por piloto: inclinación al girar y la bufanda (no toca la partida)
  const VIS = [null, null];
  function vis(b, t, k) {
    if (b.id == null) return null;
    let v = VIS[b.id];
    if (!v || v.t > t || t - v.t > 0.5) { v = VIS[b.id] = { t, pa: b.a, bank: 0, scarf: null }; }
    const dt = Math.max(1e-3, t - v.t), rate = angDiff(v.pa, b.a) / dt;
    v.bank += (clamp(rate / 6, -1, 1) - v.bank) * Math.min(1, dt * 8);
    v.pa = b.a; v.dt = dt; v.t = t;
    // bufanda: cadena que sigue la nuca con inercia y algo de viento
    const ca = Math.cos(b.a), sa = Math.sin(b.a), sy = b.c;
    const ax = b.x + (11.5 * ca - (-3.2 * sy) * sa) * k, ay = b.y + (11.5 * sa + (-3.2 * sy) * ca) * k, seg = 6.2 * k, N = 8;
    if (!v.scarf) v.scarf = Array.from({ length: N }, (_, i) => ({ x: ax - ca * seg * i, y: ay - sa * seg * i, px: ax - ca * seg * i, py: ay - sa * seg * i }));
    const S = v.scarf, damp = 0.86;
    S[0].x = ax; S[0].y = ay; S[0].px = ax; S[0].py = ay;
    for (let i = 1; i < N; i++) {
      const n = S[i], vx = (n.x - n.px) * damp, vy = (n.y - n.py) * damp;
      n.px = n.x; n.py = n.y;
      n.x += vx + Math.sin(t * 17 + i * 1.3) * 0.5 * k; n.y += vy + 18 * dt * k + Math.cos(t * 13 + i) * 0.5 * k;
    }
    for (let it = 0; it < 2; it++) for (let i = 1; i < N; i++) {
      const a = S[i - 1], n = S[i], dx = n.x - a.x, dy = n.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - seg) / d;
      n.x -= dx * f; n.y -= dy * f;
    }
    return v;
  }
  function drawScarf(ctx, S, pc, k) {
    if (!S) return;
    const N = S.length, left = [], right = [];
    for (let i = 0; i < N; i++) {
      const a = S[Math.max(0, i - 1)], c = S[Math.min(N - 1, i + 1)], dx = c.x - a.x, dy = c.y - a.y, l = Math.hypot(dx, dy) || 1;
      const w = (2.6 - i * 0.22) * k, nx = -dy / l * w, ny = dx / l * w;
      left.push([S[i].x + nx, S[i].y + ny]); right.push([S[i].x - nx, S[i].y - ny]);
    }
    ctx.beginPath(); ctx.moveTo(left[0][0], left[0][1]);
    for (let i = 1; i < N; i++) ctx.lineTo(left[i][0], left[i][1]);
    for (let i = N - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
    ctx.closePath();
    const g = ctx.createLinearGradient(S[0].x, S[0].y, S[N - 1].x, S[N - 1].y);
    g.addColorStop(0, pc.main); g.addColorStop(1, pc.deep);
    ctx.fillStyle = g; ctx.fill();
  }

  let G0 = null; function setGame(G) { G0 = G; }
  // dibuja un piloto; «fake» sirve para las vistas previas del menú; vs = aumento de lejos
  function draw(ctx, b, t, pc, vs = 1) {
    const sp = b.sp, A = PILOT_ART[sp.id], L = look(sp.id, b.look), s = A.span;
    const k = sp.size * 1.24 * vs, V = b.perch ? null : vis(b, t, k), rim = RIM[(G0 && G0.world && G0.world.id) || 'cocora'] || RIM.cocora;
    if (V) drawScarf(ctx, V.scarf, pc, k);
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.perch ? (b.facing > 0 ? 0 : Math.PI) : b.a);
    let sy = b.c;
    if (b.flipT > 0) { const u = 1 - b.flipT / 0.2; sy = b.c * -Math.cos(Math.PI * u); }
    if (b.spin > 0) sy = b.c * Math.cos((1 - b.spin) * TAU);
    // al girar fuerte el ala se inclina (se ve más angosta)
    const bank = V ? Math.abs(V.bank) : 0;
    ctx.scale(k, k * sy * (1 - 0.3 * bank));
    if (b.stun > 0) ctx.rotate(Math.sin(t * 40) * 0.08);
    const leg = b.legendT > 0, ar = leg ? 54 : 36;
    const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, ar);
    aura.addColorStop(0, leg ? `rgba(255,214,90,${0.45 + 0.15 * Math.sin(t * 12)})` : `rgba(${pc.glow},0.2)`); aura.addColorStop(1, leg ? 'rgba(255,170,40,0)' : `rgba(${pc.glow},0)`);
    ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(0, 0, ar, 0, TAU); ctx.fill();

    // el ala: un solo delta sobre la espalda (vista de tres cuartos desde arriba)
    const F = { x: 11, y: 0.5 }, TF = { x: -15 * s, y: -18.5 * s }, TC = { x: -20, y: 1.5 }, TN = { x: -13 * s, y: 19.5 * s };
    const noz = [L2(TC, TF, 0.62), L2(TC, TF, 0.3), L2(TC, TN, 0.3), L2(TC, TN, 0.62)];
    // llamas de las cuatro turbinas (detrás de todo)
    if (!b.perch) {
      const blen = b.boosting ? 30 + 6 * Math.sin(t * 37) : 9 + 2 * Math.sin(t * 23);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      noz.forEach((p, i) => flame(ctx, p.x - 2, p.y, blen * (i === 0 || i === 3 ? 0.85 : 1), i < 2 ? 1.9 : 2.5, t, i));
      if (b.boosting) {
        // diamantes de choque del postquemador
        ctx.fillStyle = 'rgba(255,250,235,0.75)';
        noz.forEach((p, i) => { if (i === 1 || i === 2) for (let d = 1; d <= 3; d++) { const x = p.x - 2 - d * blen * 0.22, w = (i < 2 ? 1.2 : 1.6) * (1 - d * 0.18); ctx.beginPath(); ctx.ellipse(x, p.y, 2.4 - d * 0.4, w, 0, 0, TAU); ctx.fill(); } });
      }
      if (b.boosting) { const gl = ctx.createRadialGradient(TC.x - 6, TC.y, 0, TC.x - 6, TC.y, 30); gl.addColorStop(0, 'rgba(255,170,80,0.45)'); gl.addColorStop(1, 'rgba(255,120,40,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(TC.x - 6, TC.y, 30, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    // piernas (la lejana más oscura) y botas: se estiran con la velocidad, cuelgan al frenar o en pérdida
    ctx.lineCap = 'round'; const pcMain = pc.main;
    const brake = b.perch ? 0.9 : clamp(Math.abs(b.mis || 0) * 0.9 + (b.stalled ? 0.6 : 0) + Math.max(0, 260 - b.s) / 400, 0, 1);
    const flut = b.perch ? 0 : Math.sin(t * 15 + (b.id || 0)) * 1.1 * clamp(b.s / 800, 0, 1);
    const legPath = (y0, yk, yf, w, col, bootW, near) => {
      const kx = -21 + brake * 3, ky = yk + brake * 5, fx = -31 + brake * 8, fy = yf + brake * 13 + flut;
      // muslo ancho y pantorrilla más fina, con costura y brillo arriba
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(-10, y0); ctx.quadraticCurveTo((kx - 10) / 2, (y0 + ky) / 2 - 0.4, kx, ky); ctx.stroke();
      ctx.lineWidth = w * 0.72; ctx.beginPath(); ctx.moveTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
      if (near) { ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-11, y0 - w * 0.28); ctx.quadraticCurveTo((kx - 10) / 2, (y0 + ky) / 2 - 0.4 - w * 0.28, kx, ky - w * 0.26); ctx.lineTo(fx, fy - w * 0.22); ctx.stroke();
        ctx.fillStyle = '#434b5c'; ctx.beginPath(); ctx.ellipse(kx, ky, w * 0.42, w * 0.36, 0, 0, TAU); ctx.fill(); }
      const ang = Math.atan2(fy - ky, fx - kx), ca = Math.cos(ang), sa = Math.sin(ang);
      // bota: caña, puntera y suela clara
      ctx.strokeStyle = BOOT; ctx.lineWidth = bootW * 0.8; ctx.beginPath(); ctx.moveTo(fx - ca * 0.5, fy - sa * 0.5); ctx.lineTo(fx + ca * 3.8, fy + sa * 3.8); ctx.stroke();
      ctx.strokeStyle = near ? '#8a93a6' : '#525a6a'; ctx.lineWidth = 1; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(fx + ca * 5 + sa * bootW * 0.34, fy + sa * 5 - ca * bootW * 0.34); ctx.lineTo(fx + ca * 5 - sa * bootW * 0.34, fy + sa * 5 + ca * bootW * 0.34); ctx.stroke();
      ctx.strokeStyle = near ? pcMain : 'rgba(0,0,0,0)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(fx - sa * bootW * 0.34, fy + ca * bootW * 0.34); ctx.lineTo(fx + sa * bootW * 0.34, fy - ca * bootW * 0.34); ctx.stroke(); ctx.lineCap = 'round';
    };
    legPath(1.5, 1.5, -1, 5, SUIT2, 5.4, false);
    legPath(4.5, 7, 6, 5.4, SUIT, 5.8, true);
    // brazo pegado al cuerpo, como el Jetman (el lejano apenas se asoma)
    ctx.strokeStyle = SUIT2; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(7, 0); ctx.quadraticCurveTo(-1, -1.5, -8, -2.5); ctx.stroke();
    // torso y hombros
    const tg = ctx.createLinearGradient(0, -3, 0, 8);
    tg.addColorStop(0, '#3b4252'); tg.addColorStop(1, SUIT2);
    ctx.fillStyle = tg; ctx.beginPath(); ctx.roundRect(-12, -2.5, 24, 10, 5); ctx.fill();
    // brazo cercano con guante
    ctx.strokeStyle = SUIT; ctx.lineWidth = 3.8; ctx.beginPath(); ctx.moveTo(8, 6); ctx.quadraticCurveTo(0, 9.5 + brake * 2, -7, 9 + brake * 3); ctx.stroke();
    ctx.fillStyle = BOOT; ctx.beginPath(); ctx.arc(-7.5, 9 + brake * 3, 2.3, 0, TAU); ctx.fill();
    // hombrera y arnés que asoman bajo la punta del ala
    ctx.fillStyle = '#4a5264'; ctx.beginPath(); ctx.ellipse(9.5, 4.6, 3.4, 2.6, 0.2, 0, TAU); ctx.fill();
    ctx.strokeStyle = pc.deep; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(11.5, 2.6); ctx.lineTo(7.5, 7); ctx.stroke();
    // cuello del traje y casco del color del jugador, con franja, visor espejado y reflejos
    const hx = 15, hy = 2, hr = 5.4;
    ctx.fillStyle = '#161920'; ctx.beginPath(); ctx.ellipse(hx - 4.4, hy + 1.2, 2.2, 3.4, 0.25, 0, TAU); ctx.fill();
    const hg = ctx.createRadialGradient(hx - 1.8, hy - 2.6, 0.4, hx, hy, hr * 1.05);
    hg.addColorStop(0, ArtWorld.mix(pc.main, '#ffffff', 0.62)); hg.addColorStop(0.5, pc.main); hg.addColorStop(1, ArtWorld.mix(pc.deep, '#000000', 0.25));
    ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(hx, hy, hr, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(hx, hy, hr, 0, TAU); ctx.clip();
    // franja blanca por la coronilla y sombra de abajo
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hx - 6, hy - 2.6); ctx.quadraticCurveTo(hx - 0.5, hy - 5.6, hx + 5.5, hy - 2.2); ctx.stroke();
    const hs = ctx.createLinearGradient(0, hy, 0, hy + hr); hs.addColorStop(0, 'rgba(0,0,10,0)'); hs.addColorStop(1, 'rgba(0,0,10,0.4)'); ctx.fillStyle = hs; ctx.fillRect(hx - hr, hy, hr * 2, hr);
    // visor
    const vg = ctx.createLinearGradient(hx + 0.5, hy - 3, hx + 5.5, hy + 3.5);
    vg.addColorStop(0, '#3c5486'); vg.addColorStop(0.45, '#0d1322'); vg.addColorStop(0.8, '#22355a'); vg.addColorStop(1, '#7fa8e6');
    ctx.fillStyle = vg; ctx.beginPath(); ctx.moveTo(hx + 0.4, hy - 2.6); ctx.quadraticCurveTo(hx + 4.4, hy - 3.6, hx + 6, hy - 0.4); ctx.quadraticCurveTo(hx + 5.6, hy + 3.4, hx + 1.6, hy + 3.4); ctx.quadraticCurveTo(hx - 0.6, hy + 0.6, hx + 0.4, hy - 2.6); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(hx + 1.6, hy - 1.9); ctx.quadraticCurveTo(hx + 3.8, hy - 2.6, hx + 5, hy - 0.8); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(hx - 1.9, hy - 3, 1.5, 0.8, -0.5, 0, TAU); ctx.fill();
    // góndolas lejanas (se asoman por el borde de fuga)
    const hot = b.boosting ? 1 : 0.2;
    nozzle(ctx, noz[0], true, hot); nozzle(ctx, noz[1], true, hot);
    const wingPath = (dx = 0, dy = 0) => { ctx.beginPath(); ctx.moveTo(F.x + dx, F.y + dy); ctx.quadraticCurveTo(F.x - 2 + dx, F.y - 2.6 + dy, TF.x + 1.2 + dx, TF.y + 0.6 + dy); ctx.quadraticCurveTo(TF.x - 1 + dx, TF.y - 0.4 + dy, TF.x - 0.6 + dx, TF.y + 1.6 + dy); ctx.quadraticCurveTo(TC.x - 2.5 + dx, TC.y - 6 * s + dy, TC.x + dx, TC.y + dy); ctx.quadraticCurveTo(TC.x - 2.5 + dx, TC.y + 6 * s + dy, TN.x - 0.6 + dx, TN.y - 1.6 + dy); ctx.quadraticCurveTo(TN.x - 1 + dx, TN.y + 0.4 + dy, TN.x + 1.2 + dx, TN.y - 0.6 + dy); ctx.quadraticCurveTo(F.x - 2 + dx, F.y + 3 + dy, F.x + dx, F.y + dy); ctx.closePath(); };
    // canto del ala (grosor): una sombra corrida hacia abajo
    wingPath(-0.4, 1.7); ctx.fillStyle = ArtWorld.mix(L.wingB, '#000000', 0.55); ctx.fill();
    // el ala encima, con degradado de la punta cercana (clara) a la lejana (oscura)
    const wg = ctx.createLinearGradient(TN.x, TN.y, TF.x, TF.y);
    wg.addColorStop(0, ArtWorld.mix(L.wingA, '#ffffff', 0.2)); wg.addColorStop(0.5, L.wingA); wg.addColorStop(1, ArtWorld.mix(L.wingB, '#000000', 0.25));
    wingPath(); ctx.fillStyle = wg; ctx.fill();
    ctx.save(); wingPath(); ctx.clip();
    // pintura especial: el diseño entero sobre el ala (las llamas corren de la nariz a la cola)
    if (L.mat && typeof Vest !== 'undefined') {
      if (L.rot) { ctx.save(); ctx.rotate(-Math.PI / 2); Vest.material(ctx, L.mat, L.matC, -21 * s, -50, 42 * s, 62, t, 0.96, !LOWFX); ctx.restore(); }
      else Vest.material(ctx, L.mat, L.matC, -24, -21 * s, 36, 42 * s, t, 0.96, !LOWFX);
    }
    // de la nariz a la cola se oscurece un poco
    const cg = ctx.createLinearGradient(F.x, 0, TC.x, 0); cg.addColorStop(0, 'rgba(255,255,255,0.1)'); cg.addColorStop(0.5, 'rgba(0,0,0,0)'); cg.addColorStop(1, 'rgba(0,0,12,0.3)'); ctx.fillStyle = cg; ctx.fillRect(-26, -26, 42, 52);
    // superficies de control en el borde de fuga, como plumas (con sus divisiones)
    for (const [T2, col, hi] of [[TF, 'rgba(0,0,12,0.36)', 0.1], [TN, 'rgba(0,0,12,0.24)', 0.24]]) {
      ctx.strokeStyle = col; ctx.lineWidth = 7.5; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(TC.x, TC.y); ctx.quadraticCurveTo(TC.x - 2.5, TC.y + (T2 === TN ? 6 : -6) * s, T2.x - 0.6, T2.y + (T2 === TN ? -1.6 : 1.6)); ctx.stroke();
      for (let q = 1; q <= 5; q++) { const u = q / 6, e = L2(TC, T2, u), ix = e.x + 5.2, iy = e.y + (T2 === TN ? -1 : 1) * 1.2; ctx.strokeStyle = 'rgba(0,0,10,0.45)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(e.x - 2.4, e.y); ctx.lineTo(ix, iy); ctx.stroke(); ctx.strokeStyle = `rgba(255,255,255,${hi})`; ctx.beginPath(); ctx.moveTo(e.x - 2.4, e.y + 0.7); ctx.lineTo(ix, iy + 0.7); ctx.stroke(); }
    }
    // pintura: banda ancha junto a cada borde de ataque y galón interior
    const band = (T2, col, o0, o1) => { const a1 = L2(F, T2, 0.1), a2 = L2(F, T2, 0.93), i1 = L2(a1, TC, o0), i2 = L2(a2, TC, o0), j1 = L2(a1, TC, o1), j2 = L2(a2, TC, o1); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(i1.x, i1.y); ctx.lineTo(i2.x, i2.y); ctx.lineTo(j2.x, j2.y); ctx.lineTo(j1.x, j1.y); ctx.closePath(); ctx.fill(); };
    // (las pinturas especiales solo llevan un filete fino: el diseño es el protagonista)
    if (L.mat) { band(TF, ArtWorld.mix(L.stripe, '#000000', 0.3), 0.06, 0.1); band(TN, L.stripe, 0.06, 0.105); }
    else {
      band(TF, ArtWorld.mix(L.stripe, '#000000', 0.32), 0.1, 0.22); band(TN, L.stripe, 0.1, 0.23);
      band(TF, ArtWorld.mix(L.stripe2, '#000000', 0.38), 0.29, 0.345); band(TN, L.stripe2, 0.29, 0.35);
    }
    // líneas de panel
    ctx.strokeStyle = 'rgba(0,0,10,0.2)'; ctx.lineWidth = 0.5; ctx.beginPath(); for (const T2 of [TF, TN]) { const m1 = L2(F, T2, 0.5), m2 = L2(TC, T2, 0.45); ctx.moveTo(m1.x, m1.y); ctx.lineTo(m2.x, m2.y); } ctx.stroke();
    // escarapela del jugador en el ala cercana
    const rc = L2(L2(F, TN, 0.34), TC, 0.6); ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.beginPath(); ctx.ellipse(rc.x, rc.y, 2.7, 2.2, 0.3, 0, TAU); ctx.fill(); ctx.fillStyle = pc.main; ctx.beginPath(); ctx.ellipse(rc.x, rc.y, 1.9, 1.5, 0.3, 0, TAU); ctx.fill(); ctx.fillStyle = pc.deep; ctx.beginPath(); ctx.ellipse(rc.x, rc.y, 0.8, 0.65, 0.3, 0, TAU); ctx.fill();
    // sombra bajo el lomo en la mitad cercana y brillo de barniz en diagonal
    const sg2 = ctx.createLinearGradient(0, -2, 0, 19 * s); sg2.addColorStop(0, 'rgba(0,0,10,0.24)'); sg2.addColorStop(0.3, 'rgba(0,0,10,0)'); sg2.addColorStop(1, 'rgba(0,0,10,0.26)'); ctx.fillStyle = sg2; ctx.fillRect(-26, 1, 42, 26);
    const gl2 = ctx.createLinearGradient(2, 2, -8, 17 * s); gl2.addColorStop(0, 'rgba(255,255,255,0)'); gl2.addColorStop(0.42, 'rgba(255,255,255,0.2)'); gl2.addColorStop(0.5, 'rgba(255,255,255,0.05)'); gl2.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gl2; ctx.fillRect(-26, 0, 42, 26);
    ctx.restore();
    // lomo: carenado que une el ala con el arnés del piloto
    const sp2 = ctx.createLinearGradient(0, -2.2, 0, 3.2); sp2.addColorStop(0, ArtWorld.mix(L.wingA, '#ffffff', 0.4)); sp2.addColorStop(0.5, ArtWorld.mix(L.wingA, '#000000', 0.05)); sp2.addColorStop(1, ArtWorld.mix(L.wingB, '#000000', 0.4));
    ctx.fillStyle = sp2; ctx.beginPath(); ctx.moveTo(F.x - 0.6, F.y); ctx.quadraticCurveTo(2, -2.6, TC.x + 4, TC.y - 1.5); ctx.quadraticCurveTo(TC.x + 0.6, TC.y, TC.x + 4, TC.y + 1.5); ctx.quadraticCurveTo(2, 3.4, F.x - 0.6, F.y); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 0.7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(F.x - 3, F.y - 0.7); ctx.quadraticCurveTo(0, -1.9, TC.x + 6, TC.y - 0.9); ctx.stroke();
    // derivas en las puntas del ala: aletas pequeñas echadas hacia atrás
    for (const [T2, sgn, col] of [[TF, 1, ArtWorld.mix(L.wingB, '#000000', 0.2)], [TN, -1, ArtWorld.mix(L.wingA, '#000000', 0.1)]]) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(T2.x + 1.6, T2.y + sgn * 0.5); ctx.lineTo(T2.x - 3.8, T2.y + sgn * 0.9); ctx.lineTo(T2.x - 5.4, T2.y - 2.5); ctx.lineTo(T2.x - 3.6, T2.y - 2.8); ctx.closePath(); ctx.fill(); ctx.strokeStyle = sgn < 0 ? L.stripe : ArtWorld.mix(L.stripe, '#000000', 0.3); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(T2.x + 1.6, T2.y + sgn * 0.5); ctx.lineTo(T2.x - 3.6, T2.y - 2.8); ctx.stroke(); }
    // brillo de los bordes de ataque
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(F.x - 0.4, F.y + 1); ctx.quadraticCurveTo(F.x - 2, F.y + 3, TN.x + 1.6, TN.y - 0.9); ctx.stroke();
    // luz de borde del escenario (lo pega al ambiente)
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(${rim},0.85)`; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(F.x - 0.6, F.y - 0.8); ctx.quadraticCurveTo(F.x - 2, F.y - 2.6, TF.x + 1.6, TF.y + 0.9); ctx.stroke();
    ctx.strokeStyle = `rgba(${rim},0.5)`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(15, 2, 5.6, -2.6, -0.6); ctx.stroke();
    // pinturas legendarias y míticas: los bordes de ataque y las derivas brillan con su luz
    if (L.edge) {
      const pul = 0.6 + 0.4 * Math.sin(t * 3.2 + (b.id === 1 ? 1.7 : 0)), ec = L.edge === 'holo' ? (() => { const h = (t * 90) % 360, f = n => { const k = (n + h / 30) % 12; return Math.round(255 * (0.62 - 0.38 * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); }; return `${f(0)},${f(8)},${f(4)}`; })() : L.edge;
      const edges = () => { ctx.beginPath(); ctx.moveTo(TF.x + 1.4, TF.y + 0.8); ctx.quadraticCurveTo(F.x - 2, F.y - 2.6, F.x - 0.4, F.y); ctx.quadraticCurveTo(F.x - 2, F.y + 3, TN.x + 1.4, TN.y - 0.8); };
      for (const [lw, a] of [[5.2, 0.16], [2.6, 0.42], [1, 0.95]]) { ctx.strokeStyle = lw < 2 ? `rgba(255,255,255,${(a * pul).toFixed(3)})` : `rgba(${ec},${(a * pul).toFixed(3)})`; ctx.lineWidth = lw; edges(); ctx.stroke(); }
      for (const T2 of [TF, TN]) { const g4 = ctx.createRadialGradient(T2.x - 1, T2.y, 0, T2.x - 1, T2.y, 6); g4.addColorStop(0, `rgba(${ec},${(0.45 * pul).toFixed(3)})`); g4.addColorStop(1, `rgba(${ec},0)`); ctx.fillStyle = g4; ctx.beginPath(); ctx.arc(T2.x - 1, T2.y, 6, 0, TAU); ctx.fill(); }
    }
    // luces de navegación: roja en la punta lejana, verde en la cercana, destello blanco en la cola
    const nav = (p, col, on) => { if (!on) return; const g3 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 7); g3.addColorStop(0, `rgba(${col},1)`); g3.addColorStop(0.35, `rgba(${col},0.55)`); g3.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g3; ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, TAU); ctx.fill(); };
    nav({ x: TF.x - 4.4, y: TF.y - 2.6 }, '255,70,60', true); nav({ x: TN.x - 4.4, y: TN.y - 2.6 }, '80,255,140', true); nav({ x: TC.x + 1, y: TC.y }, '255,255,255', (t * 1.3 + (b.id || 0) * 0.37) % 1 < 0.08);
    ctx.restore();
    // góndolas cercanas, con banda del color de la pintura
    nozzle(ctx, noz[2], false, hot, L.stripe); nozzle(ctx, noz[3], false, hot, L.stripe);
    // golpe: destello blanco
    if (b.hitT > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = b.hitT / 0.14 * 0.6;
      const hg2 = ctx.createRadialGradient(-4, 0, 2, -4, 0, 24 * s); hg2.addColorStop(0, 'rgba(255,255,255,0.9)'); hg2.addColorStop(0.5, 'rgba(255,240,220,0.4)'); hg2.addColorStop(1, 'rgba(255,220,180,0)');
      ctx.fillStyle = hg2; ctx.beginPath(); ctx.ellipse(-4, 0, 24 * s, 19 * s, 0, 0, TAU); ctx.fill(); ctx.restore();
    }
    ctx.restore();
    // escudo (sin rotar)
    if (b.shield > 0) {
      const R = 40 * k, pulse = 0.5 + 0.5 * Math.sin(t * 8);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const sg = ctx.createRadialGradient(b.x, b.y, R * 0.6, b.x, b.y, R);
      sg.addColorStop(0, `rgba(${pc.glow},0)`); sg.addColorStop(0.85, `rgba(${pc.glow},${0.18 + 0.12 * pulse})`); sg.addColorStop(1, `rgba(255,255,255,${b.shield < 1.5 && Math.sin(t * 20) > 0 ? 0 : 0.5})`);
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(b.x, b.y, R, 0, TAU); ctx.fill(); ctx.restore();
    }
  }

  // estela: una línea fina del color del jugador y vapor blanco que se abre (más con el turbo)
  function drawTrail(ctx, b, t, pc, vs = 1) {
    const wk = Math.sqrt(vs);
    const tr = b.trail; if (tr.length < 3) return;
    const life = PHYS.trailLife, N = 5;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let k = 0; k < N; k++) {
      const a0 = life * (1 - (k + 1) / N), a1 = life * (1 - k / N);
      ctx.beginPath(); let started = false, boostSeg = 0, n = 0;
      for (let i = 0; i < tr.length; i++) {
        const age = t - tr[i].t;
        if (age < a0 - 0.03 || age > a1 + 0.03 || tr[i].s < 60) { if (age >= a0 - 0.03 && age <= a1 + 0.03) started = false; continue; }
        if (!started) { ctx.moveTo(tr[i].x, tr[i].y); started = true; } else ctx.lineTo(tr[i].x, tr[i].y);
        boostSeg += tr[i].b; n++;
      }
      const fresh = 1 - (k + 0.5) / N, bo = n ? boostSeg / n : 0, lg = b.legendT > 0;
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = `rgba(255,255,255,${(0.10 + 0.12 * bo) * fresh})`; ctx.lineWidth = (6 + 22 * (1 - fresh)) * (0.8 + bo * 0.6) * wk; ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = lg ? `rgba(255,205,80,${0.7 * fresh})` : `rgba(${pc.glow},${(0.35 + 0.3 * bo) * fresh})`; ctx.lineWidth = ((lg ? 4 : 2) + 2.5 * fresh) * wk; ctx.stroke();
    }
    ctx.restore();
  }
  return { draw, drawTrail, setGame, look };
})();
