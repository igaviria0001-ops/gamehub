/* =========================================================================
   EFECTOS — partículas en dos capas (brillo aditivo y humo/polvo), emitidas
   por el estado de cada bólido (chispas del derrape en tres colores, humo,
   polvo fuera de pista, brasas del turbo, estela de rebufo) y por los eventos
   de la carrera (esmeraldas, aterrizajes, choques, caídas al lago, piruetas).
   ========================================================================= */
const FX = (() => {
  const VS = `attribute vec4 col; attribute float size; varying vec4 vC; uniform float uScale;
    void main(){ vC = col; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = clamp(size * uScale / max(0.5,-mv.z), 1.0, 256.0); gl_Position = projectionMatrix * mv; }`;
  const FS_ADD = `varying vec4 vC; void main(){ vec2 p = gl_PointCoord - 0.5; float d = length(p)*2.0; float a = smoothstep(1.0, 0.0, d); a *= a; gl_FragColor = linearToOutputTexel(vec4(pow(vC.rgb * (0.6 + 0.8*a), vec3(2.2)), vC.a * a)); }`;
  const FS_SMK = `varying vec4 vC; void main(){ vec2 p = gl_PointCoord - 0.5; float d = length(p)*2.0; float a = smoothstep(1.0, 0.25, d); gl_FragColor = linearToOutputTexel(vec4(pow(vC.rgb, vec3(2.2)), vC.a * a)); }`;
  const uScale = { value: 400 };
  class Pool {
    constructor(n, blending, fs) {
      this.n = n; this.count = 0;
      this.p = new Float32Array(n * 3); this.v = new Float32Array(n * 3); this.c = new Float32Array(n * 4); this.sz = new Float32Array(n);
      this.life = new Float32Array(n); this.max = new Float32Array(n); this.grav = new Float32Array(n); this.drag = new Float32Array(n); this.grow = new Float32Array(n); this.a0 = new Float32Array(n);
      const g = new THREE.BufferGeometry();
      this.aP = new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage);
      this.aC = new THREE.BufferAttribute(new Float32Array(n * 4), 4).setUsage(THREE.DynamicDrawUsage);
      this.aS = new THREE.BufferAttribute(new Float32Array(n), 1).setUsage(THREE.DynamicDrawUsage);
      g.setAttribute('position', this.aP); g.setAttribute('col', this.aC); g.setAttribute('size', this.aS); g.setDrawRange(0, 0);
      const m = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: fs, uniforms: { uScale }, transparent: true, depthWrite: false, blending });
      this.mesh = new THREE.Points(g, m); this.mesh.frustumCulled = false; this.mesh.renderOrder = blending === THREE.AdditiveBlending ? 3 : 2;
    }
    add(x, y, z, vx, vy, vz, r, gg, b, a, size, life, grav = 0, drag = 0, grow = 0) {
      if (this.count >= this.n) return; const i = this.count++;
      this.p[i * 3] = x; this.p[i * 3 + 1] = y; this.p[i * 3 + 2] = z; this.v[i * 3] = vx; this.v[i * 3 + 1] = vy; this.v[i * 3 + 2] = vz;
      this.c[i * 4] = r; this.c[i * 4 + 1] = gg; this.c[i * 4 + 2] = b; this.a0[i] = a; this.sz[i] = size; this.life[i] = life; this.max[i] = life; this.grav[i] = grav; this.drag[i] = drag; this.grow[i] = grow;
    }
    update(dt) {
      let j = 0; const P = this.p, V = this.v, C = this.c;
      for (let i = 0; i < this.count; i++) {
        const l = this.life[i] - dt; if (l <= 0) continue;
        if (j !== i) { for (let k = 0; k < 3; k++) { P[j * 3 + k] = P[i * 3 + k]; V[j * 3 + k] = V[i * 3 + k]; } for (let k = 0; k < 3; k++) C[j * 4 + k] = C[i * 4 + k]; this.a0[j] = this.a0[i]; this.sz[j] = this.sz[i]; this.max[j] = this.max[i]; this.grav[j] = this.grav[i]; this.drag[j] = this.drag[i]; this.grow[j] = this.grow[i]; }
        this.life[j] = l; const dr = Math.exp(-this.drag[j] * dt);
        V[j * 3] *= dr; V[j * 3 + 1] = V[j * 3 + 1] * dr - this.grav[j] * dt; V[j * 3 + 2] *= dr;
        P[j * 3] += V[j * 3] * dt; P[j * 3 + 1] += V[j * 3 + 1] * dt; P[j * 3 + 2] += V[j * 3 + 2] * dt;
        this.sz[j] += this.grow[j] * dt; j++;
      }
      this.count = j;
      const ap = this.aP.array, ac = this.aC.array, as = this.aS.array;
      for (let i = 0; i < j; i++) {
        ap[i * 3] = P[i * 3]; ap[i * 3 + 1] = P[i * 3 + 1]; ap[i * 3 + 2] = P[i * 3 + 2];
        const f = this.life[i] / this.max[i], fade = Math.min(1, f * 3) * Math.min(1, (1 - f) * 12 + 0.2);
        ac[i * 4] = C[i * 4]; ac[i * 4 + 1] = C[i * 4 + 1]; ac[i * 4 + 2] = C[i * 4 + 2]; ac[i * 4 + 3] = this.a0[i] * fade; as[i] = this.sz[i];
      }
      this.mesh.geometry.setDrawRange(0, j); this.aP.needsUpdate = this.aC.needsUpdate = this.aS.needsUpdate = true;
    }
    clear() { this.count = 0; this.mesh.geometry.setDrawRange(0, 0); }
  }
  let glow = null, smoke = null, T = null;
  const col = new THREE.Color(), W = new THREE.Vector3(), V = new THREE.Vector3(), Q = new THREE.Vector3();
  const LV_COL = ['#d8e6ff', '#3fa9ff', '#ff8a1a', '#19e68c'];
  const rgb = h => { col.set(h); return [col.r, col.g, col.b]; };
  const LVRGB = LV_COL.map(rgb);
  function init(scene, track, touch) {
    if (!glow) { glow = new Pool(touch ? 1600 : 3200, THREE.AdditiveBlending, FS_ADD); smoke = new Pool(touch ? 700 : 1400, THREE.NormalBlending, FS_SMK); }
    glow.clear(); smoke.clear(); scene.add(glow.mesh); scene.add(smoke.mesh); T = track;
  }
  const rnd = (a = 1) => (Math.random() * 2 - 1) * a;
  // punto local del bólido → mundo
  function wp(m, x, y, z, out = W) { return out.set(x, y, z).applyMatrix4(m.root.matrixWorld); }
  function dirW(m, x, y, z, out = V) { return out.set(x, y, z).transformDirection(m.root.matrixWorld); }
  // ---- emisión continua por estado ----
  function carFx(car, m, dt, t) {
    if (car.respawnT > 0 || !m.root.visible) return;
    const D = car.drift, fwd = dirW(m, 0, 0, 1, Q).clone(), up = dirW(m, 0, 1, 0, V).clone();
    const vx = fwd.x * car.f, vy = fwd.y * car.f, vz = fwd.z * car.f;
    if (car.grounded && D.on) {
      // chispas del derrape en las ruedas traseras
      const c = LVRGB[D.lv], n = D.lv ? 3 + D.lv * 2 : 1;
      for (const sx of [-0.98, 0.98]) for (let k = 0; k < n; k++) {
        if (Math.random() > dt * 60) continue;
        wp(m, sx + rnd(0.2), 0.12, -1.55);
        const sp = D.lv ? 5 + D.lv * 2 : 2;
        glow.add(W.x, W.y, W.z, vx * 0.55 + rnd(sp) - fwd.x * 4, up.y * (2 + Math.random() * 4), vz * 0.55 + rnd(sp) - fwd.z * 4, c[0], c[1], c[2], 1, D.lv ? 0.35 + D.lv * 0.08 : 0.2, 0.18 + Math.random() * 0.18, 18, 3);
      }
      // humo de llantas
      if (Math.random() < dt * 22) { wp(m, D.dir > 0 ? -1.1 : 1.1, 0.25, -1.5); const g = 0.86 + Math.random() * 0.1; smoke.add(W.x, W.y, W.z, vx * 0.3 + rnd(1), 0.8 + Math.random(), vz * 0.3 + rnd(1), g, g, g, 0.32, 1.3, 0.9 + Math.random() * 0.5, -0.5, 1.5, 3.2); }
    }
    // turbo: brasas desde las toberas
    if (car.boostT > 0) {
      const k = car.boostK > 1 ? 1.4 : 1;
      for (const sx of [0]) for (let i = 0; i < 3; i++) { if (Math.random() > dt * 70 * k) continue; wp(m, sx + rnd(0.06), 0.64 + rnd(0.06), -2.55); const hot = Math.random(); glow.add(W.x, W.y, W.z, vx * 0.6 - fwd.x * 10 + rnd(1.5), rnd(1.5), vz * 0.6 - fwd.z * 10 + rnd(1.5), 0.45 + hot * 0.55, 0.75 + hot * 0.25, 1, 0.9, 0.55 * k, 0.16 + Math.random() * 0.12, 0, 4, -1.2); }
    }
    // polvo fuera de pista o sobre tierra
    if (car.grounded && car.offroad && car.f > 8 && Math.random() < dt * 30) {
      wp(m, rnd(1.1), 0.2, -1.6); smoke.add(W.x, W.y, W.z, vx * 0.25 + rnd(2), 1 + Math.random() * 2, vz * 0.25 + rnd(2), 0.62, 0.52, 0.38, 0.45, 1.6, 0.9 + Math.random() * 0.6, -0.3, 1.2, 3.5);
    }
    // lancha: estela y rocío; al derrapar, cola de gallo de agua
    if (car.mode === 'water' && car.grounded && car.f > 6) {
      const sp = clamp(car.f / 50, 0.3, 1.2);
      for (const sx of [-1.3, 1.3]) if (Math.random() < dt * 40 * sp) { wp(m, sx, 0.2, -1.6); smoke.add(W.x, W.y, W.z, vx * 0.2 + rnd(1.2), 1.5 + Math.random() * 2.5 * sp, vz * 0.2 + rnd(1.2), 0.93, 0.97, 1, 0.26, 0.45, 0.45 + Math.random() * 0.3, 9, 1.2, 0.9); }
      if (D.on && Math.random() < dt * 60) { const side = -D.dir; wp(m, side * 1.4, 0.3, -1.2); const out = dirW(m, side, 0.35, -0.4, Q.clone()); const c = LVRGB[D.lv]; smoke.add(W.x, W.y, W.z, vx * 0.3 + out.x * 12 + rnd(2), 4 + Math.random() * 4, vz * 0.3 + out.z * 12 + rnd(2), 0.9, 0.96, 1, 0.45, 0.8, 0.7, 14, 1, 1.2); if (D.lv) glow.add(W.x, W.y, W.z, vx * 0.3 + out.x * 10, 3 + Math.random() * 3, vz * 0.3 + out.z * 10, c[0], c[1], c[2], 1, 0.35, 0.4, 12, 1); }
    }
    // ala: estelas en las puntas
    if (car.mode === 'air' && m.wingK > 0.6) for (const sx of [-2.35, 2.35]) { wp(m, sx, 0.62, -0.9); glow.add(W.x, W.y, W.z, vx * 0.85, 0, vz * 0.85, 0.85, 1, 0.95, 0.5, 0.28, 0.45, 0, 0, -0.3); }
    // carga lista (barra llena): chispitas esmeralda alrededor
    if (car.gem >= 4 && Math.random() < dt * 14) { wp(m, rnd(1.2), 0.6 + Math.random(), rnd(2)); glow.add(W.x, W.y, W.z, vx * 0.9, 1.5 + Math.random(), vz * 0.9, 0.2, 1, 0.6, 0.9, 0.3, 0.5, -1, 2, 0); }
  }
  // ---- ráfagas por evento ----
  function burst(pool, x, y, z, n, o) {
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, e = (Math.random() * 2 - 1) * (o.flat ? 0.2 : 1), sp = o.sp * (0.4 + Math.random() * 0.6), c = o.c[Math.floor(Math.random() * o.c.length)];
      pool.add(x + rnd(o.r || 0), y + rnd(o.r || 0) * 0.3, z + rnd(o.r || 0), Math.cos(a) * sp * Math.sqrt(1 - e * e) + (o.vx || 0), (o.up || 0) + e * sp, Math.sin(a) * sp * Math.sqrt(1 - e * e) + (o.vz || 0), c[0], c[1], c[2], o.a || 1, o.size * (0.6 + Math.random() * 0.6), o.life * (0.6 + Math.random() * 0.6), o.g || 0, o.drag || 2, o.grow || 0); }
  }
  const C_GEM = ['#19e68c', '#7dffc2', '#e9fff4', '#0fb873'].map(rgb), C_SPARK = ['#fff3c2', '#ffc94a', '#ff8a1a'].map(rgb), C_DUST = ['#bfae8c', '#a8987a', '#d6c9ab'].map(rgb), C_WATER = ['#ffffff', '#d6f4ff', '#9fdcef'].map(rgb), C_TRICK = ['#ffd23d', '#ff3d6e', '#62e0ff', '#19e68c', '#ffffff'].map(rgb), C_BOOST = ['#bfe9ff', '#62e0ff', '#ffffff'].map(rgb);
  function onEvents(R, meshes, events) {
    for (const e of events) {
      const car = e.car != null ? R.cars[e.car] : null, m = car ? meshes[e.car] : null;
      switch (e.type) {
        case 'gem': { const P = T.pos(e.s, e.u, 1.2, W); burst(glow, P.x, P.y, P.z, 26, { c: C_GEM, sp: 9, size: 0.45, life: 0.6, g: 4, drag: 3 }); break; }
        case 'driftBoost': { if (!m) break; wp(m, 0, 0.5, -1.8); const c = [LVRGB[e.lv]]; burst(glow, W.x, W.y, W.z, 14 + e.lv * 8, { c: c.concat([[1, 1, 1]]), sp: 8 + e.lv * 2, size: 0.4, life: 0.4, drag: 4, vx: dirW(m, 0, 0, 1).x * car.f * 0.7, vz: V.z * car.f * 0.7 }); break; }
        case 'turbo': case 'perfectStart': case 'pad': { if (!m) break; wp(m, 0, 0.6, -2.3); burst(glow, W.x, W.y, W.z, 24, { c: C_BOOST, sp: 10, size: 0.5, life: 0.35, drag: 5, flat: true, vx: dirW(m, 0, 0, 1).x * car.f * 0.6, vz: V.z * car.f * 0.6 }); break; }
        case 'land': { if (!m || e.hard < 6) break; wp(m, 0, 0.1, 0); burst(smoke, W.x, W.y, W.z, 12, { c: car.mode === 'water' ? C_WATER : C_DUST, sp: 5, size: 1.4, life: 0.8, flat: true, drag: 3, grow: 2.5, a: 0.4, r: 1 }); break; }
        case 'landTrick': { if (!m) break; wp(m, 0, 0.6, 0); burst(glow, W.x, W.y, W.z, 30 + e.n * 10, { c: C_TRICK, sp: 12, size: 0.45, life: 0.6, g: 6, drag: 2 }); break; }
        case 'trick': { if (!m) break; wp(m, 0, 0.8, 0); burst(glow, W.x, W.y, W.z, 12, { c: C_TRICK, sp: 6, size: 0.35, life: 0.4, drag: 3, vx: dirW(m, 0, 0, 1).x * car.f * 0.8, vz: V.z * car.f * 0.8 }); break; }
        case 'landBad': { if (!m) break; wp(m, 0, 0.3, 0); burst(smoke, W.x, W.y, W.z, 16, { c: C_DUST, sp: 6, size: 1.6, life: 0.9, flat: true, drag: 3, grow: 2, a: 0.5, r: 1 }); break; }
        case 'wall': { if (!m) break; wp(m, e.side * -1.1, 0.5, 0.8); burst(glow, W.x, W.y, W.z, Math.min(40, 8 + e.hit * 1.5), { c: C_SPARK, sp: 10, size: 0.3, life: 0.35, g: 14, drag: 2 }); break; }
        case 'bump': { if (!m) break; const o = meshes[e.other]; if (!o) break; wp(m, 0, 0.7, 0, Q); wp(o, 0, 0.7, 0, W); W.add(Q).multiplyScalar(0.5); burst(glow, W.x, W.y, W.z, 16, { c: C_SPARK, sp: 8, size: 0.3, life: 0.3, g: 12, drag: 2 }); break; }
        case 'fall': { if (!m) break; const y = (R.track.def.lake ? R.track.def.lake.y : 0); wp(m, 0, 0, 0); burst(smoke, W.x, y + 0.3, W.z, 40, { c: C_WATER, sp: 6, up: 9, size: 1.1, life: 1.1, g: 16, drag: 1, grow: 1.5, a: 0.8, r: 1.2 }); break; }
        case 'respawn': { if (!m) break; m.root.updateMatrixWorld(); wp(m, 0, 0.6, 0); burst(glow, W.x, W.y, W.z, 30, { c: C_GEM, sp: 7, size: 0.4, life: 0.5, drag: 3 }); break; }
        case 'mode': { if (!m) break; wp(m, 0, 0.4, 0); if (e.mode === 'water') burst(smoke, W.x, W.y, W.z, 30, { c: C_WATER, sp: 7, up: 8, size: 0.7, life: 0.9, g: 16, drag: 1.2, grow: 0.8, a: 0.5, r: 1.5 }); else if (e.mode === 'air') burst(glow, W.x, W.y, W.z, 30, { c: C_GEM, sp: 9, size: 0.45, life: 0.5, drag: 3, vx: dirW(m, 0, 0, 1).x * car.f * 0.8, vz: V.z * car.f * 0.8 }); break; }
        case 'ring': { if (!m) break; wp(m, 0, 0.8, 1); burst(glow, W.x, W.y, W.z, e.big ? 60 : 36, { c: e.big ? C_TRICK : C_GEM, sp: 14, size: 0.5, life: 0.6, drag: 3, vx: dirW(m, 0, 0, 1).x * car.f * 0.9, vz: V.z * car.f * 0.9 }); break; }
        case 'takeoff': { if (!m || e.why !== 'wave') break; wp(m, 0, 0, -1); burst(smoke, W.x, W.y, W.z, 14, { c: C_WATER, sp: 4, up: 5, size: 1, life: 0.7, g: 14, drag: 1.5, grow: 1, a: 0.6, r: 1 }); break; }
        case 'box': { const P = T.pos(e.s, e.u, T.groundH(e.s, e.u) + 1.3, W); burst(glow, P.x, P.y, P.z, 22, { c: C_GEM, sp: 8, size: 0.4, life: 0.5, g: 6, drag: 2 }); break; }
        case 'boom': { const P = T.pos(e.s, e.u, e.h, W);
          if (e.k === 'zap') { burst(glow, P.x, P.y, P.z, 40, { c: [[0.6, 0.97, 1], [1, 1, 1], [0.4, 0.7, 1]], sp: 14, size: 0.5, life: 0.4, g: 4, drag: 2, flat: true }); break; }
          if (e.k === 'mask') { burst(glow, P.x, P.y, P.z, 40, { c: C_TRICK, sp: 10, size: 0.45, life: 0.8, g: 5, drag: 1.5 }); break; }
          burst(glow, P.x, P.y, P.z, 30, { c: e.k === 'lava' ? [[1, 0.6, 0.15], [1, 0.35, 0.05], [1, 0.9, 0.5]] : C_SPARK, sp: 12, size: 0.6, life: 0.5, g: 6, drag: 2 }); burst(smoke, P.x, P.y, P.z, 14, { c: e.k === 'lava' ? [[0.16, 0.13, 0.12], [0.3, 0.2, 0.15]] : [[0.35, 0.33, 0.32], [0.5, 0.48, 0.45]], sp: 4, size: 2, life: 1.1, drag: 2, grow: 2.5, a: 0.55, up: 2 }); break; }
        case 'pickGot': { const P = T.pos(e.s, e.u, e.h, W); burst(glow, P.x, P.y, P.z, 34, { c: e.style === 'tunjo' ? [[1, 0.85, 0.3], [1, 0.95, 0.6], [1, 1, 1]] : C_TRICK, sp: 9, size: 0.5, life: 0.7, g: 3, drag: 2 }); break; }
        case 'logHit': { if (!m) break; wp(m, 0, 0.6, 1.4); burst(smoke, W.x, W.y, W.z, 16, { c: C_WATER, sp: 6, up: 6, size: 1, life: 0.8, g: 14, drag: 1.5, grow: 1, a: 0.6, r: 1 }); burst(glow, W.x, W.y, W.z, 14, { c: [[0.55, 0.38, 0.2], [0.75, 0.55, 0.3]], sp: 8, size: 0.35, life: 0.6, g: 12, drag: 1 }); break; }
        case 'stormCatch': { if (!m) break; wp(m, 0, 1, 0); burst(smoke, W.x, W.y, W.z, 40, { c: C_DUST.concat([[0.85, 0.64, 0.38]]), sp: 10, size: 2.4, life: 1.4, drag: 1.5, grow: 2, a: 0.7, r: 2 }); break; }
        case 'stormFree': case 'dodge': { if (!m) break; wp(m, 0, 0.8, 0); burst(glow, W.x, W.y, W.z, 24, { c: C_BOOST, sp: 8, size: 0.4, life: 0.4, drag: 3 }); break; }
        case 'stompHit': { if (!m) break; wp(m, 0, 0.3, 0); burst(smoke, W.x, W.y, W.z, 18, { c: C_DUST, sp: 6, size: 1.6, life: 0.9, flat: true, drag: 3, grow: 2, a: 0.5, r: 1 }); break; }
        case 'hit': { if (!m) break; wp(m, 0, 1.6, 0); burst(glow, W.x, W.y, W.z, 16, { c: C_SPARK.concat([[1, 1, 1]]), sp: 5, size: 0.4, life: 0.8, drag: 2, flat: true }); break; }
        case 'special': { if (!m) break; wp(m, 0, 0.8, 0); col.set(SPECIALS[car.pid].col); const sc = [[col.r, col.g, col.b], [1, 1, 1], [1, 0.85, 0.3]]; burst(glow, W.x, W.y, W.z, 70, { c: sc, sp: car.pid === 'taiko' ? 22 : 14, size: 0.6, life: 0.7, drag: 2.5, flat: car.pid === 'taiko' }); break; }
        case 'shieldPop': { if (!m) break; wp(m, 0, 0.8, 0); burst(glow, W.x, W.y, W.z, 30, { c: [[0.4, 0.8, 1], [1, 1, 1]], sp: 9, size: 0.4, life: 0.4, drag: 3 }); break; }
        case 'finish': { const f = T.at(0); for (const sg of [-1, 1]) burst(glow, f.px + f.rx * sg * 7, f.py + 7, f.pz + f.rz * sg * 7, 70, { c: C_TRICK, sp: 9, up: 6, size: 0.35, life: 2.2, g: 3, drag: 1.2 }); break; }
        case 'gemSeg': { if (!m) break; wp(m, 0, 1.2, -1.25); burst(glow, W.x, W.y, W.z, 10, { c: C_GEM, sp: 4, size: 0.3, life: 0.45, drag: 3, vx: dirW(m, 0, 0, 1).x * car.f, vz: V.z * car.f }); break; }
      }
    }
  }
  function update(R, meshes, events, dt, t) {
    for (let i = 0; i < R.cars.length; i++) carFx(R.cars[i], meshes[i], dt, t);
    onEvents(R, meshes, events); glow.update(dt); smoke.update(dt);
  }
  function setScale(viewH, fov) { uScale.value = viewH * 0.5 / Math.tan(fov * Math.PI / 360); }
  // para otros módulos (jefes): una partícula suelta o una ráfaga
  function puff(x, y, z, vx, vy, vz, r, g, b, a, size, life, grav, drag, grow, gl) { const p = gl ? glow : smoke; if (p) p.add(x, y, z, vx, vy, vz, r, g, b, a, size, life, grav, drag, grow); }
  function emit(k, x, y, z, n, o) { const p = k === 'smoke' ? smoke : glow; if (p) burst(p, x, y, z, n, o); }
  return { init, update, onEvents, setScale, puff, emit };
})();
