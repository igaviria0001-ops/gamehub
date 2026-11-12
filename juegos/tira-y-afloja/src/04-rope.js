/* =========================================================================
   EL HILO DE CHICLE — cadena tipo Verlet (para que cuelgue y se enrolle)
   + resorte sobre el largo total (para la tensión del juego)
   ========================================================================= */
const ROPE = {
  N: 30,
  K: 125,          // rigidez elástica
  K2: 1500,        // rigidez extra pasado el máximo
  C: 3.2,          // amortiguación
  slackTol: 1.02,  // holgura antes de que empiece a tirar
  maxStretch: 1.32,
  rad: 6,
  minBodies: 1.22, // largo mínimo efectivo = (radio A + radio B) × esto
};

class Rope {
  constructor() {
    this.pts = [];
    for (let i = 0; i < ROPE.N; i++) this.pts.push({ x: 0, y: 0, px: 0, py: 0 });
    this.len = 400; this.pathLen = 400; this.rate = 0; this.tension = 0; this.strain = 1;
    this.dirA = { x: 1, y: 0 }; this.dirB = { x: -1, y: 0 };
    this.visible = true; this.snapFx = 0; this.jitter = 0; this.temp = 0;
  }

  reset(ax, ay, bx, by, len) {
    this.len = len;
    const n = ROPE.N, d = Math.hypot(bx - ax, by - ay);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const p = this.pts[i];
      p.x = lerp(ax, bx, t); p.y = lerp(ay, by, t);
      p.px = p.x; p.py = p.y - 50;
      ARENA.collidePoint(p, ROPE.rad);
      p.px = p.x; p.py = p.y;
    }
    this.pathLen = Math.max(d, len); this.rate = 0; this.tension = 0; this.strain = this.pathLen / len; this.temp = 0;
  }

  step(dt, A, B) {
    const P = this.pts, n = ROPE.N;
    P[0].x = A.x; P[0].y = A.y; P[0].px = A.x; P[0].py = A.y;
    P[n - 1].x = B.x; P[n - 1].y = B.y; P[n - 1].px = B.x; P[n - 1].py = B.y;
    // temperatura del hilo: calor = súper elástico, frío = rígido
    let tsum = 0;
    for (let i = 1; i < n - 1; i += 2) tsum += ARENA.tempAt(P[i].x, P[i].y);
    const tTarget = clamp(tsum / ((n - 2) / 2) * 2.2 + ARENA.mods.temp, -1, 1);
    this.temp += (tTarget - this.temp) * Math.min(1, dt * 3);
    const hot = clamp(this.temp, 0, 1), cold = clamp(-this.temp, 0, 1);
    const g = PHYS.g * ARENA.mods.gravity * dt * dt * 0.9 * (1 - 0.75 * cold), damp = 0.986;
    for (let i = 1; i < n - 1; i++) {
      const p = P[i];
      const vx = (p.x - p.px) * damp, vy = (p.y - p.py) * damp;
      p.px = p.x; p.py = p.y;
      const w = ARENA.windAt(p.x, p.y);
      p.x += vx + (w ? w * 0.12 * dt * dt : 0) + (ARENA.mods.push ? ARENA.mods.push * 0.5 * dt * dt : 0); p.y += vy + g;
    }
    const rest = this.len / (n - 1);
    // el hilo nunca "tira" más corto que los dos cuerpos pegados (evita el bucle de choques)
    const len = Math.max(this.len, (A.r + B.r) * ROPE.minBodies);
    this.effLen = len;
    for (let it = 0; it < 14; it++) {
      const fwd = (it & 1) === 0;
      for (let k = 0; k < n - 1; k++) {
        const i = fwd ? k : n - 2 - k;
        const a = P[i], b = P[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1e-4;
        if (d <= rest && !(cold > 0.35 && d < rest * 0.9)) continue;
        const wa = i === 0 ? 0 : 1, wb = i + 1 === n - 1 ? 0 : 1, sum = wa + wb;
        if (!sum) continue;
        const diff = (d - rest) / d;
        const ca = diff * wa / sum, cb = diff * wb / sum;
        a.x += dx * ca; a.y += dy * ca; b.x -= dx * cb; b.y -= dy * cb;
      }
      if (it % 4 === 3) for (let i = 1; i < n - 1; i++) ARENA.collidePoint(P[i], ROPE.rad);
    }
    for (let i = 1; i < n - 1; i++) {
      const p = P[i];
      if (ARENA.collidePoint(p, ROPE.rad)) { p.px = lerp(p.px, p.x, 0.35); p.py = lerp(p.py, p.y, 0.35); }
    }
    // largo real del camino (incluye vueltas por bordes)
    let L = 0;
    for (let i = 0; i < n - 1; i++) L += Math.hypot(P[i + 1].x - P[i].x, P[i + 1].y - P[i].y);
    const r = (L - this.pathLen) / dt;
    this.rate = lerp(this.rate, r, 0.25);
    this.pathLen = L;
    this.strain = L / len;
    let T = 0;
    const slack = len * (ROPE.slackTol - 0.015 * cold);
    if (L > slack) {
      const K = ROPE.K * (1 - 0.6 * hot) * (1 + 3 * cold);
      T = K * (L - slack) + ROPE.C * (1 + cold) * clamp(this.rate, -300, 1500);
      const lim = len * (ROPE.maxStretch + 0.75 * hot - 0.24 * cold);
      if (L > lim) T += ROPE.K2 * (1 + 2 * cold) * (L - lim);
    }
    this.tension = clamp(T, 0, 80000);
    this.dirA = this._dirFrom(0, 1);
    this.dirB = this._dirFrom(n - 1, -1);
  }

  _dirFrom(i0, step) {
    const P = this.pts, o = P[i0];
    let acc = 0, i = i0;
    for (let k = 0; k < ROPE.N - 1; k++) {
      const a = P[i], b = P[i + step];
      acc += Math.hypot(b.x - a.x, b.y - a.y);
      i += step;
      if (acc > 26 || i === (step > 0 ? ROPE.N - 1 : 0)) break;
    }
    const dx = P[i].x - o.x, dy = P[i].y - o.y, d = Math.hypot(dx, dy) || 1;
    return { x: dx / d, y: dy / d };
  }

  /* ---------------- dibujo: un hilo de chicle grueso, brillante, que se adelgaza al estirarse ---------------- */
  draw(ctx, A, B, t) {
    if (!this.visible) return;
    const P = this.pts, n = ROPE.N;
    // muestras suavizadas (Catmull-Rom)
    const S = [];
    const at = i => P[clamp(i, 0, n - 1)];
    for (let i = 0; i < n - 1; i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      for (let s = 0; s < 3; s++) {
        const u = s / 3, u2 = u * u, u3 = u2 * u;
        S.push({
          x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * u + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3),
          y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * u + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3),
        });
      }
    }
    S.push({ x: P[n - 1].x, y: P[n - 1].y });
    const m = S.length;
    // largo acumulado
    let acc = 0; S[0].s = 0;
    for (let i = 1; i < m; i++) { acc += Math.hypot(S[i].x - S[i - 1].x, S[i].y - S[i - 1].y); S[i].s = acc; }
    const total = acc || 1;
    const strain = this.strain;
    const thin = clamp(1 / Math.pow(Math.max(strain, 1), 1.7), 0.32, 1);
    const baseW = 12 * thin;
    const taut = clamp((strain - 1) * 6, 0, 1);
    const vib = clamp((strain - 1.14) * 8, 0, 1) * 3.5 + this.jitter;
    // normales + ancho
    const L = [], R = [], C = [];
    for (let i = 0; i < m; i++) {
      const a = S[Math.max(0, i - 1)], b = S[Math.min(m - 1, i + 1)];
      let tx = b.x - a.x, ty = b.y - a.y; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      let nx = -ty, ny = tx; if (ny > 0) { nx = -nx; ny = -ny; } // normal hacia "arriba"
      const sA = S[i].s, sB = total - S[i].s;
      const neckA = A.r * 1.05 * Math.exp(-sA / (A.r * 0.8)) * (0.65 + 0.35 * taut);
      const neckB = B.r * 1.05 * Math.exp(-sB / (B.r * 0.8)) * (0.65 + 0.35 * taut);
      const w = baseW + neckA + neckB;
      const wob = vib ? Math.sin(t * 75 + S[i].s * 0.09) * vib * Math.sin(Math.PI * S[i].s / total) : 0;
      const cx = S[i].x + nx * wob, cy = S[i].y + ny * wob;
      C.push({ x: cx, y: cy, nx, ny, w });
      L.push({ x: cx + nx * w / 2, y: cy + ny * w / 2 });
      R.push({ x: cx - nx * w / 2, y: cy - ny * w / 2 });
    }
    const grad = (c1, c2) => {
      const g = ctx.createLinearGradient(A.x, A.y, B.x, B.y);
      g.addColorStop(0, c1[0]); g.addColorStop(0.42, c1[1]); g.addColorStop(0.58, c2[1]); g.addColorStop(1, c2[0]);
      return g;
    };
    const ca = A.col, cb = B.col;
    // sombra
    ctx.save();
    ctx.globalAlpha = 0.13; ctx.strokeStyle = '#2a140a'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = baseW + 2;
    ctx.beginPath(); C.forEach((p, i) => i ? ctx.lineTo(p.x, p.y + 9) : ctx.moveTo(p.x, p.y + 9)); ctx.stroke();
    ctx.restore();
    // cuerpo del hilo
    ctx.beginPath();
    ctx.moveTo(L[0].x, L[0].y);
    for (let i = 1; i < m; i++) ctx.lineTo(L[i].x, L[i].y);
    for (let i = m - 1; i >= 0; i--) ctx.lineTo(R[i].x, R[i].y);
    ctx.closePath();
    ctx.fillStyle = grad([ca.base, mixHex(ca.base, ca.light, 0.15)], [cb.base, mixHex(cb.base, cb.light, 0.15)]);
    ctx.fill();
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3.2; ctx.strokeStyle = grad([ca.deep, ca.deep], [cb.deep, cb.deep]); ctx.stroke();
    // sombreado inferior
    ctx.save();
    ctx.globalAlpha = 0.22; ctx.strokeStyle = '#000'; ctx.lineCap = 'round';
    ctx.beginPath();
    C.forEach((p, i) => { const x = p.x - p.nx * p.w * 0.28, y = p.y - p.ny * p.w * 0.28; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.lineWidth = Math.max(1.5, baseW * 0.3); ctx.stroke();
    ctx.restore();
    // brillo
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.62)'; ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(1.2, baseW * 0.24);
    ctx.beginPath();
    let started = false;
    for (let i = 2; i < m - 2; i++) {
      const p = C[i]; const x = p.x + p.nx * p.w * 0.2, y = p.y + p.ny * p.w * 0.2;
      if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    // calor: brillo naranja y gotas; frío: escarcha azul
    const hot = clamp(this.temp, 0, 1), cold = clamp(-this.temp, 0, 1);
    if (hot > 0.05 || cold > 0.05) {
      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const path = () => { ctx.beginPath(); C.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); };
      if (hot > 0.05) {
        path(); ctx.globalAlpha = 0.28 * hot; ctx.strokeStyle = '#ffb347'; ctx.lineWidth = baseW + 14; ctx.stroke();
        path(); ctx.globalAlpha = 0.55 * hot; ctx.strokeStyle = '#ff7a3d'; ctx.lineWidth = Math.max(2, baseW * 0.6); ctx.stroke();
        ctx.globalAlpha = hot; ctx.fillStyle = mixHex(ca.base, '#ff8a3d', 0.5);
        for (let i = 4; i < m - 4; i += 9) {
          const p = C[i], dl = ((t * 1.3 + i * 0.37) % 1);
          ctx.beginPath(); ctx.ellipse(p.x, p.y + p.w * 0.5 + dl * 22, 2.6, 3.6 + dl * 2, 0, 0, TAU); ctx.fill();
        }
      }
      if (cold > 0.05) {
        path(); ctx.globalAlpha = 0.6 * cold; ctx.strokeStyle = '#d6f3ff'; ctx.lineWidth = baseW * 0.8 + 2; ctx.stroke();
        ctx.globalAlpha = 0.9 * cold; ctx.fillStyle = '#ffffff';
        for (let i = 3; i < m - 3; i += 5) {
          const p = C[i], tw = 0.5 + 0.5 * Math.sin(t * 6 + i);
          const sx = p.x + p.nx * p.w * 0.3, sy = p.y + p.ny * p.w * 0.3, sz = 1.5 + tw * 2.2;
          ctx.fillRect(sx - sz, sy - 0.6, sz * 2, 1.2); ctx.fillRect(sx - 0.6, sy - sz, 1.2, sz * 2);
        }
      }
      ctx.restore();
    }
    // chicle estirado: se blanquea y salen hebras
    const white = clamp((strain - 1.1) * 2.4, 0, 0.55);
    if (white > 0.01) {
      ctx.save();
      ctx.globalAlpha = white; ctx.strokeStyle = '#fff4f8'; ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(1, baseW * 0.55);
      ctx.beginPath();
      for (let i = Math.floor(m * 0.2); i < m * 0.8; i++) { const p = C[i]; i > Math.floor(m * 0.2) ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }
      ctx.stroke();
      if (strain > 1.2) {
        ctx.globalAlpha = clamp((strain - 1.2) * 4, 0, 0.7);
        ctx.lineWidth = 1.4;
        for (const side of [-1, 1]) {
          ctx.strokeStyle = side < 0 ? ca.light : cb.light;
          ctx.beginPath();
          for (let i = Math.floor(m * 0.15); i < m * 0.85; i++) {
            const p = C[i], off = side * (p.w * 0.9 + 2 + Math.sin(i * 0.7 + t * 20) * 1.5);
            const x = p.x + p.nx * off, y = p.y + p.ny * off;
            i > Math.floor(m * 0.15) ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          }
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }
}
