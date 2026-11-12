/* =========================================================================
   PISTA — una curva cerrada con marcos (adelante, arriba, derecha) cada ~2 m.
   Todo se mueve en coordenadas de pista: s (distancia), u (lado, + derecha),
   h (altura sobre la superficie). Curvatura en el plano (kap, + gira a la
   derecha) y vertical (kapV, + cóncava hacia arriba) para la física.
   Zonas por tramos (pueblo, hombro, abismo), rampas, esmeraldas.
   ========================================================================= */
class Track {
  constructor(def) {
    this.def = def;
    const P = def.pts, n = P.length;
    const curve = new THREE.CatmullRomCurve3(P.map(p => new THREE.Vector3(p[0], p[2], p[1])), true, 'centripetal');
    // tabla t → s para ubicar los puntos de control a lo largo de la pista
    const M = n * 60; let acc = 0; const tS = new Float64Array(M + 1); let prev = curve.getPoint(0);
    for (let k = 1; k <= M; k++) { const q = curve.getPoint(k / M); acc += q.distanceTo(prev); tS[k] = acc; prev = q; }
    const L = acc; this.L = L; this.cpS = P.map((_, i) => tS[i * 60]);
    const N = Math.max(64, Math.round(L / 2)); this.N = N; this.ds = L / N;
    const F = k => new Float32Array(N);
    this.px = F(); this.py = F(); this.pz = F(); this.tx = F(); this.ty = F(); this.tz = F(); this.ux = F(); this.uy = F(); this.uz = F(); this.rx = F(); this.ry = F(); this.rz = F();
    this.kap = F(); this.kapV = F(); this.w = F(); this.bank = F();
    // muestras a distancia pareja (búsqueda en la tabla t → s)
    let j = 0;
    for (let k = 0; k < N; k++) {
      const s = k * this.ds; while (j < M && tS[j + 1] < s) j++;
      const f = (s - tS[j]) / Math.max(1e-6, tS[j + 1] - tS[j]), q = curve.getPoint((j + f) / M);
      this.px[k] = q.x; this.py[k] = q.y; this.pz[k] = q.z;
      this.w[k] = this.attr(s, 3, 14); this.bank[k] = this.attr(s, 4, 0) * Math.PI / 180;
    }
    const T = new THREE.Vector3(), U = new THREE.Vector3(), R = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    for (let k = 0; k < N; k++) {
      const a = (k - 1 + N) % N, b = (k + 1) % N;
      T.set(this.px[b] - this.px[a], this.py[b] - this.py[a], this.pz[b] - this.pz[a]).normalize();
      U.copy(up).addScaledVector(T, -T.dot(up)).normalize();
      R.crossVectors(T, U).normalize();
      if (this.bank[k]) { U.applyAxisAngle(T, this.bank[k]); R.crossVectors(T, U).normalize(); }
      this.tx[k] = T.x; this.ty[k] = T.y; this.tz[k] = T.z; this.ux[k] = U.x; this.uy[k] = U.y; this.uz[k] = U.z; this.rx[k] = R.x; this.ry[k] = R.y; this.rz[k] = R.z;
    }
    for (let k = 0; k < N; k++) {
      const a = (k - 1 + N) % N, b = (k + 1) % N, d = 2 * this.ds;
      const dx = (this.tx[b] - this.tx[a]) / d, dy = (this.ty[b] - this.ty[a]) / d, dz = (this.tz[b] - this.tz[a]) / d;
      this.kap[k] = dx * this.rx[k] + dy * this.ry[k] + dz * this.rz[k];
      this.kapV[k] = dx * this.ux[k] + dy * this.uy[k] + dz * this.uz[k];
    }
    // suavizar curvaturas (evita saltos de un tramo a otro)
    for (const arr of [this.kap, this.kapV]) for (let it = 0; it < 3; it++) { const c = arr.slice(); for (let k = 0; k < N; k++) arr[k] = (c[(k - 1 + N) % N] + 2 * c[k] + c[(k + 1) % N]) / 4; }
    // zonas y objetos de la pista (en índices de punto de control → metros)
    this.zones = (def.zones || []).map(z => Object.assign({}, z, { s0: this.cp(z.from), s1: this.cp(z.to), swells: (z.swells || []).map(x => this.cp(x)) }));
    this.ramps = (def.ramps || []).map(r => Object.assign({}, r, { s: this.cp(r.at) }));
    this.gems = []; for (const g of def.gems || []) { const s0 = this.cp(g.at); for (let k = 0; k < g.n; k++) this.gems.push({ s: this.wrap(s0 + k * (g.gap || 6)), u: (g.u || 0) + (g.wave ? Math.sin(k * 0.8) * g.wave : 0), taken: [0, 0, 0, 0, 0, 0] }); }
    this.pads = (def.pads || []).map(p => ({ s: this.cp(p.at), u: p.u || 0 }));
    this.boxes = []; for (const b of def.boxes || []) { const n = b.n || 4; for (let k = 0; k < n; k++) this.boxes.push({ s: this.cp(b.at), u: (k - (n - 1) / 2) * (b.gap || 3.4) }); }
    const az = this.zones.find(z => z.type === 'air');
    this.rings = (def.rings || []).map(r => ({ s: r.d != null && az ? this.wrap(az.s0 + r.d) : this.cp(r.at), u: r.u || 0, h: r.h || 5, big: !!r.big }));
    this.lakeY = def.lake ? def.lake.y : -50; this.time = 0;
    // géiseres: chorros que se prenden cada tanto y lanzan al que pase por encima
    this.geysers = (def.geysers || []).map((g, i) => ({ s: this.cp(g.at), u: g.u || 0, r: g.r || 3, period: g.period || 3.2, on: g.on || 1.1, ph: g.ph != null ? g.ph : i * 0.9 }));
  }
  // medio por tramo: calle, agua (lancha) o aire (ala)
  medium(s) { return this.zone(s, 'air') ? 'air' : this.zone(s, 'water') ? 'water' : 'road'; }
  // olas del embalse dentro del tramo de agua: oleaje corto que viaja + marejadas fijas que sirven de rampa
  waveH(s, u, t = this.time) {
    const z = this.zone(s, 'water'); if (!z) return 0;
    const d0 = this.wrap(s - z.s0), d1 = this.wrap(z.s1 - s), edge = smooth(clamp(Math.min(d0, d1) / 25, 0, 1)), side = 1 - smooth(clamp((Math.abs(u) - this.w[Math.floor(this.wrap(s) / this.ds) % this.N] / 2 - 1) / 6, 0, 1));
    let h = 0.3 * Math.sin(0.2 * s - 2.1 * t) + 0.22 * Math.sin(0.11 * s + 0.21 * u - 1.3 * t + 1.3) + 0.08 * Math.sin(0.5 * u + 0.37 * s + 3 * t);
    const sw = this.swellH(s, t, z); this._foam = (clamp((h - 0.3) * 1.8, 0, 0.6) + clamp((sw - 1.5) * 0.9, 0, 0.3)) * edge * side;
    return (h + sw) * edge * side;
  }
  swellH(s, t, z) { let h = 0; for (const sw of z.swells || []) { const q = (this.wrap(s - sw + this.L / 2) - this.L / 2) / 10; h += 1.9 * Math.exp(-q * q) * (1 + 0.12 * Math.sin(t * 2 + sw)); } return h; }
  // altura del piso en el marco de la pista (0 = la calzada): rampas en la calle, superficie del agua en el embalse
  groundH(s, u) { if (this.zone(s, 'water')) { const o = this.at(s); return (this.lakeY - o.py) + this.waveH(s, u); } return this.rampH(s, u); }
  wrap(s) { s %= this.L; return s < 0 ? s + this.L : s; }
  geyserOn(g, t = this.time) { const k = (t + g.ph) % g.period; return k < g.on ? 1 : k > g.period - 0.6 ? 0.5 : 0; } // 1 = chorro, 0.5 = aviso (burbujea)
  // altura de las rampas sobre la calzada (cuña que sube hasta el borde)
  rampH(s, u) { for (const r of this.ramps) { let d = r.s - s; if (d < -this.L / 2) d += this.L; if (d > this.L / 2) d -= this.L; if (d >= 0 && d <= r.len && Math.abs(u) <= this.w[Math.floor(this.wrap(s) / this.ds) % this.N] / 2 + 0.6) return (r.len - d) * Math.tan(r.angle * Math.PI / 180); } return 0; }
  // índice fraccional de punto de control → metros
  cp(x) { const n = this.def.pts.length, i = Math.floor(x) % n, f = x - Math.floor(x), a = this.cpS[i], b = i + 1 < n ? this.cpS[i + 1] : this.L; return a + (b - a) * f; }
  // atributo de los puntos de control interpolado suave a lo largo de la pista
  attr(s, idx, def) {
    const P = this.def.pts, n = P.length; let i = n - 1;
    for (let k = 0; k < n; k++) if (this.cpS[k] <= s) i = k;
    const j = (i + 1) % n, a = this.cpS[i], b = j === 0 ? this.L : this.cpS[j], f = smooth(clamp((s - a) / Math.max(1e-6, b - a), 0, 1));
    const va = P[i][idx] != null ? P[i][idx] : def, vb = P[j][idx] != null ? P[j][idx] : def; return va + (vb - va) * f;
  }
  // muestra interpolada en s → objeto reutilizable
  at(s, o = this._o || (this._o = {})) {
    s = this.wrap(s); const x = s / this.ds, i = Math.floor(x) % this.N, j = (i + 1) % this.N, f = x - Math.floor(x);
    const L = (A) => A[i] + (A[j] - A[i]) * f;
    o.px = L(this.px); o.py = L(this.py); o.pz = L(this.pz); o.tx = L(this.tx); o.ty = L(this.ty); o.tz = L(this.tz);
    o.ux = L(this.ux); o.uy = L(this.uy); o.uz = L(this.uz); o.rx = L(this.rx); o.ry = L(this.ry); o.rz = L(this.rz);
    o.kap = L(this.kap); o.kapV = L(this.kapV); o.w = L(this.w); o.i = i; return o;
  }
  pos(s, u, h, out) { const o = this.at(s); out.set(o.px + o.rx * u + o.ux * h, o.py + o.ry * u + o.uy * h, o.pz + o.rz * u + o.uz * h); return out; }
  zone(s, type) { for (const z of this.zones) if (z.type === type && (z.s0 <= z.s1 ? s >= z.s0 && s <= z.s1 : s >= z.s0 || s <= z.s1)) return z; return null; }
  // ancho útil: asfalto + hombro (pasto) antes de la barrera
  limits(s) { const o = this.at(s), road = o.w / 2; if (this.zone(s, 'town') || this.zone(this.wrap(s + 14), 'town') || this.zone(this.wrap(s - 14), 'town')) return { road, wall: road + 0.4 }; /* las casas de las puntas del pueblo: sin andén ancho cerca */ if (this.zone(s, 'air')) return { road: road + 30, wall: road + 4, air: true }; if (this.zone(s, 'water')) return { road: road + 30, wall: road + 2.5, water: true }; if (this.zone(s, 'elev')) return { road, wall: road + 1.6 }; return { road, wall: road + (this.def.shoulder != null ? this.def.shoulder : 6) }; }
  // distancia firmada de s a la meta (para contar vueltas)
  progress(s, lap) { return lap * this.L + s; }
}
