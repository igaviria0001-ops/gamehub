/* =========================================================================
   EFECTOS — partículas, textos de técnicas, anuncios, cámara
   ========================================================================= */
const FX = (() => {
  let parts = [], texts = [], banners = [];
  let shake = 0;
  // accesibilidad / rendimiento: cuánto se sacude la pantalla y cuántas partículas se dibujan
  const settings = { shake: Store.get('shake', 1), particles: Store.get('quality', 'alta') === 'ligera' ? 0.45 : 1 };

  function add(p) {
    if (settings.particles < 1 && p.type !== 'ring' && Math.random() > settings.particles) return; parts.push(Object.assign({ vx: 0, vy: 0, g: 0, drag: 0, life: 1, t: 0, size: 6, rot: 0, vr: 0, color: '#fff', type: 'dot' }, p)); if (parts.length > 700) parts.splice(0, parts.length - 700); }

  const api = {
    textK: 1, // en pantallas chicas los textos sobre el mundo se agrandan un poco
    clear() { parts = []; texts = []; banners = []; shake = 0; },
    shake(v) { shake = Math.max(shake, v * settings.shake); },
    settings,
    get shakeAmt() { return shake; },

    dust(x, y, n = 6, spread = 1, color = 'rgba(255,245,225,0.9)') {
      for (let i = 0; i < n; i++) add({ type: 'puff', x: x + rnd(-10, 10) * spread, y: y + rnd(-3, 3), vx: rnd(-160, 160) * spread, vy: rnd(-90, -10), drag: 4, life: rnd(0.35, 0.6), size: rnd(6, 13) * spread, color });
    },
    gum(x, y, col, n = 8, power = 1, dirx = 0, diry = -1) {
      for (let i = 0; i < n; i++) {
        const a = Math.atan2(diry, dirx) + rnd(-1.1, 1.1), s = rnd(160, 520) * power;
        add({ type: 'gum', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 1600, drag: 0.6, life: rnd(0.45, 0.9), size: rnd(3.5, 7.5) * Math.sqrt(power), color: col.base, edge: col.deep });
      }
    },
    ring(x, y, color = '#ffffff', size = 60, life = 0.35, width = 6) { add({ type: 'ring', x, y, life, size, color, width }); },
    stars(x, y, n = 8, power = 1) {
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU + rnd(-0.2, 0.2), s = rnd(300, 700) * power;
        add({ type: 'star', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, drag: 3.5, g: 300, life: rnd(0.5, 0.8), size: rnd(8, 15), rot: rnd(TAU), vr: rnd(-8, 8), color: pick(['#ffd84d', '#fff2a8', '#ffb03b']) });
      }
    },
    paper(x, y, n = 14) {
      for (let i = 0; i < n; i++) add({ type: 'paper', x: x + rnd(-60, 60), y, vx: rnd(-420, 420), vy: rnd(-1100, -500), g: 2200, drag: 0.4, life: rnd(1.1, 1.6), size: rnd(9, 16), rot: rnd(TAU), vr: rnd(-10, 10), color: pick(['#f6f2e8', '#fffbe9', '#ffe9a8', '#e8f3ff']) });
    },
    confetti(x, y, n = 60, spread = 900) {
      const cols = [PALETTE.fresa.base, PALETTE.menta.base, '#ffd84d', '#9b6bdf', '#ff9a3c', '#4aa3ff', '#ffffff'];
      for (let i = 0; i < n; i++) add({ type: 'confetti', x: x + rnd(-spread / 2, spread / 2), y: y + rnd(-60, 20), vx: rnd(-250, 250), vy: rnd(-900, -200), g: 900, drag: 1.6, life: rnd(1.8, 3.2), size: rnd(7, 13), rot: rnd(TAU), vr: rnd(-12, 12), color: pick(cols), flip: rnd(TAU) });
    },
    sparkle(x, y, color = '#fff6b0', n = 10) {
      for (let i = 0; i < n; i++) { const a = rnd(TAU), s = rnd(120, 380); add({ type: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, drag: 4, life: rnd(0.35, 0.6), size: rnd(3, 6), color }); }
    },
    speedLines(x, y, ang, col) {
      for (let i = 0; i < 3; i++) add({ type: 'line', x: x + rnd(-20, 20), y: y + rnd(-20, 20), rot: ang, life: 0.22, size: rnd(30, 60), color: col });
    },

    /* textos sobre el mundo (técnicas) */
    callout(text, x, y, color = '#ffffff', size = 46, life = 1.3) {
      for (let k = 0; k < 4; k++) {
        const clash = texts.find(o => o.t < 0.7 && Math.abs(o.x - x) < 260 && Math.abs(o.y - y) < (o.size + size) * 0.55);
        if (!clash) break;
        y = clash.y - (clash.size + size) * 0.6;
      }
      texts.push({ text, x, y, color, size, life, t: 0, vy: -60 });
      if (texts.length > 6) texts.shift();
    },
    /* anuncios grandes en pantalla */
    banner(text, opts = {}) {
      banners.push(Object.assign({ text, sub: '', color: '#ffffff', size: 150, life: 1.4, t: 0, stroke: PALETTE.ink }, opts));
      if (banners.length > 3) banners.shift();
    },
    clearBanners() { banners = []; },

    update(dt) {
      shake = Math.max(0, shake - dt * 2.2);
      for (const p of parts) {
        p.t += dt;
        p.vx *= Math.max(0, 1 - p.drag * dt); p.vy *= Math.max(0, 1 - p.drag * dt);
        p.vy += p.g * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if (p.type === 'paper' && p.y > ArenaArt.CAN_RIM + 30 && p.vy > 0 && (p.x < 280 || p.x > WORLD_W - 280)) p.life = Math.min(p.life, p.t + 0.05);
      }
      parts = parts.filter(p => p.t < p.life);
      for (const tx of texts) { tx.t += dt; tx.y += tx.vy * dt; tx.vy *= 1 - 2.5 * dt; }
      texts = texts.filter(tx => tx.t < tx.life);
      for (const b of banners) b.t += dt;
      banners = banners.filter(b => b.t < b.life);
    },

    draw(ctx) {
      for (const p of parts) {
        const k = p.t / p.life, a = 1 - k;
        ctx.save();
        switch (p.type) {
          case 'puff':
            ctx.globalAlpha = a * 0.8; ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (0.6 + k * 1.2), 0, TAU); ctx.fill(); break;
          case 'gum':
            ctx.globalAlpha = Math.min(1, a * 2);
            ctx.fillStyle = p.color; ctx.strokeStyle = p.edge; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 - k * 0.4), 0, TAU); ctx.fill(); ctx.stroke(); break;
          case 'ring':
            ctx.globalAlpha = a; ctx.strokeStyle = p.color; ctx.lineWidth = p.width * a + 1;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * easeOutCubic(k) + 6, 0, TAU); ctx.stroke(); break;
          case 'star':
            ctx.globalAlpha = Math.min(1, a * 2); drawStar(ctx, p.x, p.y, p.size * (1 - k * 0.3), p.color, p.rot); break;
          case 'paper': {
            ctx.globalAlpha = Math.min(1, a * 3);
            ctx.translate(p.x, p.y); ctx.rotate(p.rot);
            ctx.beginPath();
            for (let i = 0; i < 8; i++) { const ang = i / 8 * TAU, rr = p.size * (i % 2 ? 0.78 : 1); ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); }
            ctx.closePath(); ctx.fillStyle = p.color; ctx.fill(); ctx.strokeStyle = PALETTE.ink; ctx.lineWidth = 2; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-p.size * 0.5, -2); ctx.lineTo(p.size * 0.3, 3); ctx.lineWidth = 1.2; ctx.stroke();
            break;
          }
          case 'confetti': {
            ctx.globalAlpha = Math.min(1, a * 3);
            ctx.translate(p.x + Math.sin(p.t * 6 + p.flip) * 10, p.y); ctx.rotate(p.rot);
            ctx.scale(1, Math.abs(Math.cos(p.t * 8 + p.flip)) * 0.8 + 0.2);
            ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); break;
          }
          case 'spark':
            ctx.globalAlpha = a; ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * a + 0.5, 0, TAU); ctx.fill(); break;
          case 'line':
            ctx.globalAlpha = a * 0.6; ctx.strokeStyle = p.color; ctx.lineWidth = 3; ctx.lineCap = 'round';
            ctx.translate(p.x, p.y); ctx.rotate(p.rot);
            ctx.beginPath(); ctx.moveTo(-p.size, 0); ctx.lineTo(-p.size * 0.2, 0); ctx.stroke(); break;
          default:
            ctx.globalAlpha = a; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill();
        }
        ctx.restore();
      }
      // textos de técnicas
      for (const tx of texts) {
        const k = tx.t / tx.life;
        const s = tx.t < 0.18 ? easeOutBack(tx.t / 0.18) : 1;
        const a = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(tx.x, tx.y); ctx.scale(s * api.textK, s * api.textK); ctx.rotate(-0.05);
        outlinedText(ctx, tx.text, 0, 0, tx.size, tx.color, PALETTE.ink, 'center');
        ctx.restore();
      }
    },

    drawBanners(ctx, W, H, S) {
      banners.forEach((b, i) => {
        const k = b.t / b.life;
        const inT = clamp(b.t / 0.22, 0, 1);
        const s = easeOutBack(inT) * (k > 0.8 ? 1 + (k - 0.8) * 1.5 : 1);
        const a = k > 0.8 ? 1 - (k - 0.8) / 0.2 : 1;
        ctx.save();
        ctx.globalAlpha = clamp(a, 0, 1);
        ctx.translate(W / 2, H * (b.y || 0.4));
        ctx.scale(s * S, s * S);
        ctx.rotate(b.rot || -0.03);
        outlinedText(ctx, b.text, 0, 0, b.size, b.color, b.stroke, 'center', true);
        if (b.sub) outlinedText(ctx, b.sub, 0, b.size * 0.62, b.size * 0.3, '#ffffff', b.stroke, 'center');
        ctx.restore();
      });
    },
  };
  return api;
})();

function outlinedText(ctx, text, x, y, size, fill, stroke, align = 'center', big = false) {
  ctx.font = font(size, 700);
  ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  if (big) { ctx.fillStyle = 'rgba(40,20,10,0.35)'; ctx.fillText(text, x + size * 0.04, y + size * 0.07); }
  ctx.lineWidth = Math.max(4, size * 0.16); ctx.strokeStyle = stroke; ctx.strokeText(text, x, y);
  ctx.fillStyle = fill; ctx.fillText(text, x, y);
  if (big) {
    ctx.save();
    ctx.beginPath(); ctx.rect(x - 2000, y - size, 4000, size * 0.62); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillText(text, x, y);
    ctx.restore();
  }
}
