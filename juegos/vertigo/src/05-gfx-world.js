/* =========================================================================
   MUNDO 3D — renderizador, cielo con sol, luz, reflejos, terreno que se
   aplana bajo la pista, agua con olas y destellos, la pista (asfalto,
   adoquín en el pueblo, bordillos, barandas, rampa, abismo, plataformas de
   impulso, esmeraldas) y el escenario de cada pista.
   ========================================================================= */
const GFX = (() => {
  let renderer, scene, theme, sunDir = new THREE.Vector3(), waterMat = null;
  const anim = []; // funciones (t, dt) que animan el escenario
  const W = { gems: [], pads: [], track: null };
  /* ---------- utilidades de texturas y geometría ---------- */
  function canvasTex(w, h, draw, rep = true) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = rep ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); t.encoding = THREE.sRGBEncoding; return t;
  }
  // constructor de geometría a mano (posición, normal, uv, color)
  class Geo {
    constructor() { this.p = []; this.n = []; this.uv = []; this.c = []; this.i = []; }
    v(x, y, z, nx, ny, nz, u, v, col) { this.p.push(x, y, z); this.n.push(nx, ny, nz); this.uv.push(u, v); this.c.push(col ? col.r : 1, col ? col.g : 1, col ? col.b : 1); return this.p.length / 3 - 1; }
    quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
    // cuadrilátero con normal calculada (puntos en sentido antihorario visto de frente)
    face(P0, P1, P2, P3, uv, col) {
      const e1 = new THREE.Vector3().subVectors(P1, P0), e2 = new THREE.Vector3().subVectors(P3, P0), n = new THREE.Vector3().crossVectors(e1, e2).normalize();
      const [u0, v0, u1, v1] = uv || [0, 0, 1, 1];
      const a = this.v(P0.x, P0.y, P0.z, n.x, n.y, n.z, u0, v0, col), b = this.v(P1.x, P1.y, P1.z, n.x, n.y, n.z, u1, v0, col), c = this.v(P2.x, P2.y, P2.z, n.x, n.y, n.z, u1, v1, col), d = this.v(P3.x, P3.y, P3.z, n.x, n.y, n.z, u0, v1, col);
      this.quad(a, b, c, d);
    }
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
      g.setIndex(this.i); g.computeBoundingSphere(); return g;
    }
  }
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  /* ---------- arranque ---------- */
  function init(container) {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.98;
    renderer.setScissorTest(true); renderer.setClearColor(0x88aacc);
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; applyQuality();
    container.appendChild(renderer.domElement);
    return renderer;
  }
  // resolución y sombras según la calidad elegida (lo demás se aplica al armar el mundo)
  // resolución: según la calidad elegida y, en carrera, la escala dinámica (baja sola si los cuadros tardan)
  let resK = 1;
  function applyQuality() { if (!renderer) return; renderer.setPixelRatio(Math.max(0.5, Math.min([1, isTouch() ? 1.6 : 1.5, 2][GQ.lv], devicePixelRatio || 1) * resK)); renderer.shadowMap.enabled = GQ.lv > 0; }
  function setResScale(k) { if (Math.abs(k - resK) < 1e-3) return false; resK = k; applyQuality(); return true; }
  /* ---------- cielo (degradado + sol) ---------- */
  function makeSky(th) {
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(th.skyTop) }, mid: { value: new THREE.Color(th.skyMid) }, bot: { value: new THREE.Color(th.skyBot) }, sun: { value: sunDir }, sunCol: { value: new THREE.Color(th.sunCol) } },
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w; }',
      fragmentShader: 'uniform vec3 top, mid, bot, sun, sunCol; varying vec3 vD; void main(){ float y = vD.y; vec3 c = y > 0.0 ? mix(mid, top, pow(clamp(y*1.6,0.0,1.0),0.7)) : mix(mid, bot, clamp(-y*4.0,0.0,1.0)); float d = max(dot(normalize(vD), normalize(sun)), 0.0); c += sunCol * (pow(d, 900.0) * 6.0 + pow(d, 40.0) * 0.35 + pow(d, 6.0) * 0.12); gl_FragColor = linearToOutputTexel(vec4(pow(max(c, 0.0), vec3(2.2)), 1.0)); }',
    });
    const m = new THREE.Mesh(new THREE.SphereGeometry(4000, 32, 16), mat); m.renderOrder = -10; m.frustumCulled = false; return m;
  }
  // cielo para los reflejos: material básico con colores por vértice (el PMREM necesita la codificación de los materiales propios)
  function envSky(th) {
    const g = new THREE.SphereGeometry(60, 48, 24), p = g.attributes.position, c = new Float32Array(p.count * 3), top = new THREE.Color(th.skyTop), mid = new THREE.Color(th.skyMid), bot = new THREE.Color(th.skyBot), sc = new THREE.Color(th.sunCol), col = new THREE.Color(), d = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) { d.fromBufferAttribute(p, i).normalize(); const y = d.y; if (y > 0) col.copy(mid).lerp(top, Math.pow(Math.min(1, y * 1.6), 0.7)); else col.copy(mid).lerp(bot, Math.min(1, -y * 4)); const s = Math.max(0, d.dot(sunDir)), k = Math.pow(s, 40) * 1.6 + Math.pow(s, 6) * 0.25; col.r += sc.r * k; col.g += sc.g * k; col.b += sc.b * k; c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false }));
  }
  // los colores hex son sRGB: pasarlos a lineal una sola vez (colores vivos y no lavados)
  const _lin = new WeakSet();
  const linC = c => { if (c && c.isColor) c.convertSRGBToLinear(); };
  function linArr(attr) { const a = attr.array; for (let i = 0; i < a.length; i++) { const v = a[i]; a[i] = v < 0.04045 ? v * 0.0773993808 : Math.pow(v * 0.9478672986 + 0.0521327014, 2.4); } attr.needsUpdate = true; }
  function linearize(root) {
    root.traverse(o => {
      if (o.isLight) { if (!_lin.has(o)) { _lin.add(o); linC(o.color); if (o.groundColor) linC(o.groundColor); } return; }
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const m of mats) { if (_lin.has(m) || m.isShaderMaterial) continue; _lin.add(m); linC(m.color); linC(m.emissive); }
      if (o.geometry && o.geometry.attributes && o.geometry.attributes.color && mats.some(m => m.vertexColors) && !_lin.has(o.geometry)) { _lin.add(o.geometry); linArr(o.geometry.attributes.color); }
      if (o.isInstancedMesh && o.instanceColor && !_lin.has(o.instanceColor)) { _lin.add(o.instanceColor); linArr(o.instanceColor); }
    });
    return root;
  }
  function cloudTex() { return canvasTex(256, 128, (x, w, h) => { for (let k = 0; k < 26; k++) { const cx = 40 + Math.random() * 176, cy = 50 + Math.random() * 40, r = 18 + Math.random() * 30, g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, 'rgba(255,255,255,0.75)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); } }, false); }
  /* ---------- agua con olas, reflejo del cielo y destellos ---------- */
  function makeWater(th, y) {
    waterMat = new THREE.ShaderMaterial({
      transparent: false, fog: false,
      uniforms: { t: { value: 0 }, sun: { value: sunDir }, deep: { value: new THREE.Color(th.waterDeep) }, shal: { value: new THREE.Color(th.waterShallow) }, sky: { value: new THREE.Color(th.skyMid) }, skyTop: { value: new THREE.Color(th.skyTop) }, fogC: { value: new THREE.Color(th.fog) }, fogN: { value: th.fogNear }, fogF: { value: th.fogFar } },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `uniform float t, fogN, fogF; uniform vec3 sun, deep, shal, sky, skyTop, fogC; varying vec3 vW;
        vec2 wv(vec2 p, vec2 d, float f, float s, float a){ float ph = dot(p, d) * f + t * s; return d * cos(ph) * a * f; }
        void main(){ vec2 p = vW.xz; vec2 g = wv(p, normalize(vec2(1.0,0.3)), 0.08, 1.3, 0.35) + wv(p, normalize(vec2(-0.4,1.0)), 0.13, 1.7, 0.22) + wv(p, normalize(vec2(0.7,-0.8)), 0.31, 2.4, 0.08) + wv(p, normalize(vec2(-1.0,-0.2)), 0.6, 3.1, 0.035);
          vec3 N = normalize(vec3(-g.x, 1.0, -g.y)); vec3 V = normalize(cameraPosition - vW); float fr = pow(1.0 - max(dot(N, V), 0.0), 4.0) * 0.9 + 0.08;
          vec3 R = reflect(-V, N); vec3 skyR = mix(sky, skyTop, clamp(R.y * 1.5, 0.0, 1.0));
          vec3 col = mix(mix(shal, deep, clamp(length(cameraPosition.xz - vW.xz) / 220.0, 0.0, 1.0) * 0.6 + 0.4), skyR, fr);
          float sp = pow(max(dot(R, normalize(sun)), 0.0), 220.0); col += vec3(1.0, 0.92, 0.75) * sp * 1.5;
          float dist = length(cameraPosition - vW); col = mix(col, fogC, smoothstep(fogN, fogF, dist));
          gl_FragColor = linearToOutputTexel(vec4(pow(max(col, 0.0), vec3(2.2)), 1.0)); }`,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000, 1, 1), waterMat); m.rotation.x = -Math.PI / 2; m.position.y = y; return m;
  }
  /* ---------- terreno que se aplana bajo la pista ---------- */
  function makeTerrain(T, th, def) {
    const SIZE = 3200, SEG = def.terrain && def.terrain.seg && GQ.lv === 2 ? def.terrain.seg : GQ.lv ? 220 : 160, lake = def.lake ? def.lake.y : -50;
    // rejilla de muestras de pista para buscar la más cercana
    const CELL = 30, grid = new Map(), gridE = new Map(), key = (i, j) => i * 100000 + j;
    const gap = T.zones.find(z => z.type === 'gap');
    for (let k = 0; k < T.N; k += 2) { const s = k * T.ds; const inGap = gap && s > gap.s0 - 30 && s < gap.s1 + 30, az = T.zone(s, 'air'), air = az && T.wrap(s - az.s0) > 10 && T.wrap(az.s1 - s) > 10, water = !!(T.zone(s, 'water') || T.zone(T.wrap(s + 12), 'water') || T.zone(T.wrap(s - 12), 'water')); const i = Math.floor(T.px[k] / CELL), j = Math.floor(T.pz[k] / CELL), kk = key(i, j); if (T.zone(s, 'elev')) { if (!gridE.has(kk)) gridE.set(kk, []); gridE.get(kk).push({ k }); continue; } if (!grid.has(kk)) grid.set(kk, []); grid.get(kk).push({ k, gap: inGap, air, water }); }
    // la muestra de pista más cercana; si dos tramos se cruzan a distinta altura, manda el de abajo (el de arriba queda como puente)
    const SH = def.shoulder != null ? def.shoulder : 6;
    const near = (x, z) => { const i = Math.floor(x / CELL), j = Math.floor(z / CELL); let best = null, bd = 1e9; const cand = [];
      for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) { const L = grid.get(key(i + a, j + b)); if (!L) continue; for (const q of L) { const dx = T.px[q.k] - x, dz = T.pz[q.k] - z, d = dx * dx + dz * dz; if (d < bd) { bd = d; best = q; } if (d < 3600) cand.push([q, d]); } }
      if (!best) return null;
      let low = null, ld = 0; for (const [q, d] of cand) { if (q.air || q === best) continue; const r = T.w[q.k] / 2 + SH + 10; if (d < r * r && T.py[q.k] < T.py[best.k] - 3 && (!low || T.py[q.k] < T.py[low.k])) { low = q; ld = d; } }
      if (low && !best.air) { best = low; bd = ld; }
      return { d: Math.sqrt(bd), q: best, u: (x - T.px[best.k]) * T.rx[best.k] + (z - T.pz[best.k]) * T.rz[best.k] }; };
    const TF = def.terrain;
    // cañón: meseta alta con un cañón escalonado que sigue el tramo de río (y se alarga 200 m por cada lado)
    let canyonD = null;
    if (TF && TF.canyon) { const wz = T.zones.find(z => z.type === 'water'), pts = [], RC = 40, rg = new Map(); for (let d = -200; d <= T.wrap(wz.s1 - wz.s0) + 200; d += 4) { const o = T.at(T.wrap(wz.s0 + d)); pts.push([o.px, o.pz]); }
      for (const p of pts) { const k = Math.floor(p[0] / RC) * 100000 + Math.floor(p[1] / RC); if (!rg.has(k)) rg.set(k, []); rg.get(k).push(p); }
      canyonD = (x, z) => { const i = Math.floor(x / RC), j = Math.floor(z / RC); let bd = 1e9; for (let a = -4; a <= 4; a++) for (let b = -4; b <= 4; b++) { const L2 = rg.get((i + a) * 100000 + (j + b)); if (L2) for (const p of L2) { const d = (p[0] - x) ** 2 + (p[1] - z) ** 2; if (d < bd) bd = d; } } return Math.sqrt(bd); }; }
    const cliff = TF && TF.cliff ? (x, z) => { const C = TF.cliff, e = (x * C.nx + z * C.nz) - C.d + Math.sin((x * C.nz - z * C.nx) / 70) * 18 + (fbm2(x / 50, z / 50, 3) - 0.5) * 16, k = smooth(clamp(e / C.w, 0, 1)); let h = lerp(C.low, C.top + (fbm2(x / 200, z / 200, 3) - 0.5) * 10, k); if (k > 0.05 && k < 0.95) { const q = Math.floor(h / 7) * 7, f = (h - q) / 7; h = q + 7 * smooth(clamp((f - 0.4) / 0.6, 0, 1)); } return h; } : null;
    const base = cliff || (TF && TF.canyon ? (x, z) => { const top = TF.top + (fbm2(x / 160, z / 160, 3) - 0.5) * 6, d = canyonD(x, z), k = 1 - smooth(clamp((d - 30) / 120, 0, 1)); let h = lerp(top, lake - 4, k);
        // la garganta honda (más de 160 m) que cruza el salto
        const G = TF.gorge; if (G) { const zc = G.z + G.amp * Math.sin(x / G.wl) + (fbm2(x / 90, 3.3, 2) - 0.5) * 20, dg = Math.abs(z - zc), fx = smooth(clamp((G.x1 - x) / 120, 0, 1)) * smooth(clamp((x - G.x0) / 120, 0, 1)), k2 = (1 - smooth(clamp((dg - G.flat) / G.slope, 0, 1))) * fx; h = Math.min(h, lerp(top, G.bottom, k2)); }
        if (h < top - 2) { const q = Math.floor(h / 9) * 9, f = (h - q) / 9; h = q + 9 * smooth(clamp((f - 0.45) / 0.55, 0, 1)); } return h; } : TF && TF.flat ? (x, z) => { const r = Math.hypot(x, z); return TF.base + (fbm2(x / 140, z / 140, 2) - 0.5) * 2 + (TF.dunes ? TF.dunes * Math.pow(Math.abs(Math.sin(x / 70 + z / 140 + fbm2(x / 200, z / 200, 2) * 6)), 3) * fbm2(x / 260, z / 260, 2) * 2 : 0) + smooth(clamp((r - 1250) / 500, 0, 1)) * 70 * (0.3 + fbm2(x / 300, z / 300, 3)); } : (x, z) => { let h = (fbm2(x / 260 + 3.1, z / 260 - 1.7, 4) - 0.47) * 70 + (fbm2(x / 90, z / 90, 3) - 0.5) * 10; const r = Math.hypot(x, z + 120); h += smooth(clamp((r - 800) / 700, 0, 1)) * 190 * (0.55 + fbm2(x / 330, z / 330, 3)); if (TF && TF.bowl) { const B = TF.bowl, db = Math.hypot(x - B.x, z - B.z); h = lerp(Math.min(h, lake - 9), h + 26 * Math.exp(-(((db - B.r - 60) / 50) ** 2)), smooth(clamp((db - B.r) / 45, 0, 1))); } return h; });
    const MARG = SIZE / SEG * 1.5; // margen = celda y media del terreno
    const g = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG); g.rotateX(-Math.PI / 2);
    const P = g.attributes.position, cols = new Float32Array(P.count * 3), cA = new THREE.Color(th.grass1), cB = new THREE.Color(th.grass2), cS = new THREE.Color(th.sand), cR = new THREE.Color(th.rock), cF = new THREE.Color(th.forest), tmp = new THREE.Color();
    const SNOW = new THREE.Color('#f4f7fb'), hs = new Float32Array(P.count), BANDS = (th.bands || ['#b4522e', '#dc9258', '#93391f']).map(c => new THREE.Color(c));
    // altura: natural lejos; cerca de la pista, tierra firme a la altura de la vía con bajada suave a la orilla
    const hAt = (x, z) => {
      let h = base(x, z); const n = near(x, z); if (!n) return h;
      // franja plana más ancha que una celda del terreno: así la malla (triángulos de ~11–20 m) nunca sube por encima de la vía ni de la berma
      const k = n.q.k, half = T.w[k] / 2 + SH + 3, ty = T.py[k] + T.ry[k] * clamp(n.u, -half, half) - 0.45 - Math.abs(T.ry[k]) * 0.6;
      if (n.q.gap) { const f = smooth(clamp((n.d - 8 - MARG * 0.5) / 40, 0, 1)); return lerp(Math.min(h, lake - 6), h, f); }
      if (n.q.air) { const f = smooth(clamp((n.d - 34) / 70, 0, 1)); return lerp(Math.min(h, lake - 5), h, f); } // laguna bajo el vuelo
      if (n.q.water) { const f = smooth(clamp((n.d - half - 6 - MARG) / 40, 0, 1)); return lerp(Math.min(h, lake - 4), Math.max(h, lake + 1.2), f); } // canal del embalse
      const land = Math.max(h, lake + 1.2), g2 = smooth(clamp((n.d - half - 22 - MARG) / 48, 0, 1)), hn = lerp(land, h, g2);
      return lerp(ty, hn, smooth(clamp((n.d - half - MARG) / 40, 0, 1)));
    };
    for (let v = 0; v < P.count; v++) { const h = hAt(P.getX(v), P.getZ(v)); hs[v] = h; P.setY(v, h); }
    g.computeVertexNormals(); const N = g.attributes.normal;
    for (let v = 0; v < P.count; v++) {
      const h = hs[v], x = P.getX(v), z = P.getZ(v), slope = 1 - N.getY(v), nn = fbm2(x / 40, z / 40, 3);
      tmp.copy(cA).lerp(cB, nn); if (nn > 0.62) tmp.lerp(cF, (nn - 0.62) * 2.2);
      if (h < lake + 1.6) tmp.lerp(cS, clamp((lake + 1.6 - h) / 1.4, 0, 1));
      if (slope > 0.22 || h > 95) tmp.lerp(cR, clamp((slope - 0.22) * 4 + (h - 95) / 60, 0, 1));
      if (th.snow && h > th.snow) tmp.lerp(SNOW, clamp((h - th.snow) / 25, 0, 1) * (slope > 0.5 ? 0.5 : 1));
      if (TF && (TF.canyon || TF.cliff) && slope > 0.1) tmp.lerp(BANDS[((Math.floor(h / 4.5) % BANDS.length) + BANDS.length) % BANDS.length], clamp((slope - 0.1) * 4, 0, 0.85));
      cols[v * 3] = tmp.r; cols[v * 3 + 1] = tmp.g; cols[v * 3 + 2] = tmp.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    // detalle de pasto: manchas y briznas que se repiten cada ~6 m (multiplica el color del terreno)
    const det = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#d8d8d8'; x.fillRect(0, 0, w, h); for (let k = 0; k < 140; k++) { const v = 170 + Math.random() * 85; x.fillStyle = `rgba(${v},${v},${v},0.35)`; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 6 + Math.random() * 22, 0, TAU); x.fill(); } for (let k = 0; k < 2600; k++) { const v = Math.random() < 0.5 ? 150 + Math.random() * 40 : 235 + Math.random() * 20; x.strokeStyle = `rgba(${v},${v},${v},0.55)`; x.lineWidth = 1; const px = Math.random() * w, py = Math.random() * h; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (Math.random() - 0.5) * 3, py - 2 - Math.random() * 4); x.stroke(); } });
    det.repeat.set(SIZE / 6, SIZE / 6); det.encoding = THREE.LinearEncoding;
    const tmat = new THREE.MeshStandardMaterial({ vertexColors: true, map: det, roughness: th.gloss ? 0.1 : 0.95, metalness: th.gloss ? 0.72 : 0 }); // salar: espejo de agua sobre la sal
    // cañón: capas de roca nítidas por altura en las paredes empinadas (no dependen de la resolución del terreno)
    if (TF && TF.canyon) tmat.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; varying vec3 vWN;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz; vWN = normalize(mat3(modelMatrix) * objectNormal);');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        varying vec3 vWP; varying vec3 vWN;
        vec3 strata(float y, vec2 p){ float t = y / 5.2 + sin(p.x * 0.021) * 0.35 + sin(p.y * 0.017 + p.x * 0.004) * 0.35; float i = floor(t), f = fract(t); float k = mod(i, 6.0);
          vec3 c = k < 1.0 ? vec3(0.70, 0.30, 0.16) : k < 2.0 ? vec3(0.82, 0.48, 0.26) : k < 3.0 ? vec3(0.58, 0.24, 0.13) : k < 4.0 ? vec3(0.88, 0.66, 0.44) : k < 5.0 ? vec3(0.74, 0.38, 0.20) : vec3(0.64, 0.30, 0.18);
          return pow(c * (0.86 + 0.14 * smoothstep(0.0, 0.25, f)) * (0.9 + 0.2 * fract(sin(dot(floor(p * 0.4), vec2(12.9, 78.2))) * 43758.5)), vec3(2.2)); }`).replace('#include <color_fragment>', `#include <color_fragment>
        float steep = 1.0 - clamp(vWN.y, 0.0, 1.0); diffuseColor.rgb = mix(diffuseColor.rgb, strata(vWP.y, vWP.xz), smoothstep(0.18, 0.45, steep));`);
    };
    const m = new THREE.Mesh(g, tmat);
    m.userData.height = hAt;
    m.userData.nearTrack = near;
    /* holgura real a la vía: distancia a la pared más cercana contando todos los tramos (también los de arriba y los elevados);
       para poner casas, árboles y utilería sin que nada se meta en la carretera */
    const wallAt = q => q.wall != null ? q.wall : (q.wall = T.limits(q.k * T.ds).wall);
    m.userData.clearAll = (x, z, R = 3) => { const i = Math.floor(x / CELL), j = Math.floor(z / CELL); let best = 1e9;
      for (let a = -R; a <= R; a++) for (let b = -R; b <= R; b++) for (const G of [grid, gridE]) { const L = G.get(key(i + a, j + b)); if (!L) continue; for (const q of L) { if (q.air || q.gap) continue; const d = Math.hypot(T.px[q.k] - x, T.pz[q.k] - z) - wallAt(q); if (d < best) best = d; } }
      return best; };
    /* tramos elevados (autopistas, puentes): el terreno no se aplana debajo, pero nada puede atravesarlos */
    m.userData.nearElev = (x, z) => { const i = Math.floor(x / CELL), j = Math.floor(z / CELL); let best = null, bd = 1e9; for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) { const L = gridE.get(key(i + a, j + b)); if (!L) continue; for (const q of L) { const dx = T.px[q.k] - x, dz = T.pz[q.k] - z, d = dx * dx + dz * dz; if (d < bd) { bd = d; best = q; } } } return best ? { d: Math.sqrt(bd), q: best } : null; };
    return m;
  }
  /* ---------- la pista ---------- */
  // pisos de arena: arena rastrillada (Coliseo), sal en hexágonos (Uyuni), lodo seco agrietado (Totumo)
  function texFloor(kind) {
    if (kind === 'salt') return canvasTex(288, 250, (x, w, h) => { x.fillStyle = '#eef0f2'; x.fillRect(0, 0, w, h); for (let k = 0; k < 900; k++) { const v = 220 + Math.random() * 35; x.fillStyle = `rgba(${v},${v},${v + 4},0.5)`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      const r = 24, hx = 3 * r, hy = Math.sqrt(3) * r; x.strokeStyle = 'rgba(160,168,182,0.75)'; x.lineWidth = 3;
      for (let i = -1; i <= w / hx + 1; i++) for (let j = -1; j <= h / hy + 1; j++) for (const [ox, oy] of [[0, 0], [1.5 * r, hy / 2]]) { const cx = i * hx + ox, cy = j * hy + oy; x.beginPath(); for (let a = 0; a <= 6; a++) { const t = a * Math.PI / 3, px = cx + Math.cos(t) * r * (0.92 + Math.random() * 0.06), py = cy + Math.sin(t) * r * (0.92 + Math.random() * 0.06); a ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); } });
    if (kind === 'dirt') return canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#a65e3c'; x.fillRect(0, 0, w, h); for (let k = 0; k < 2600; k++) { const v = Math.random(); x.fillStyle = `rgba(${130 + v * 70},${70 + v * 40},${44 + v * 30},0.45)`; x.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 2, 2); }
      for (const cx of [0.27, 0.73]) { const g2 = x.createLinearGradient(cx * w - 22, 0, cx * w + 22, 0); g2.addColorStop(0, 'rgba(70,36,22,0)'); g2.addColorStop(0.5, 'rgba(70,36,22,0.42)'); g2.addColorStop(1, 'rgba(70,36,22,0)'); x.fillStyle = g2; x.fillRect(cx * w - 22, 0, 44, h); }
      for (let k = 0; k < 30; k++) { x.fillStyle = 'rgba(90,110,50,0.35)'; x.beginPath(); x.arc(Math.random() < 0.5 ? Math.random() * 20 : w - Math.random() * 20, Math.random() * h, 4 + Math.random() * 6, 0, TAU); x.fill(); } });
    if (kind === 'mud') return canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#7a6250'; x.fillRect(0, 0, w, h); for (let k = 0; k < 1500; k++) { const v = Math.random(); x.fillStyle = `rgba(${90 + v * 60},${72 + v * 46},${56 + v * 36},0.4)`; x.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
      x.strokeStyle = 'rgba(52,38,28,0.7)'; x.lineWidth = 1.6; for (let k = 0; k < 60; k++) { let px = Math.random() * w, py = Math.random() * h; x.beginPath(); x.moveTo(px, py); for (let s = 0; s < 6; s++) { px += (Math.random() - 0.5) * 34; py += (Math.random() - 0.5) * 34; x.lineTo(px, py); } x.stroke(); } });
    return canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#d9b77e'; x.fillRect(0, 0, w, h); for (let k = 0; k < 2200; k++) { const v = Math.random(); x.fillStyle = `rgba(${200 + v * 40},${165 + v * 40},${110 + v * 40},0.45)`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      x.strokeStyle = 'rgba(150,112,64,0.35)'; x.lineWidth = 2; for (let y = 6; y < h; y += 12) { x.beginPath(); x.moveTo(0, y); for (let px = 0; px <= w; px += 16) x.lineTo(px, y + Math.sin(px * 0.05 + y) * 2); x.stroke(); }
      for (let k = 0; k < 26; k++) { x.fillStyle = 'rgba(120,88,50,0.25)'; x.beginPath(); x.ellipse(Math.random() * w, Math.random() * h, 3, 6, Math.random() * 3, 0, TAU); x.fill(); } });
  }
  function texAsphalt() {
    return canvasTex(256, 512, (x, w, h) => {
      x.fillStyle = '#3b3e44'; x.fillRect(0, 0, w, h);
      for (let k = 0; k < 9000; k++) { const v = 40 + Math.random() * 50; x.fillStyle = `rgba(${v},${v},${v + 4},${Math.random() * 0.5})`; x.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
      for (let k = 0; k < 30; k++) { x.fillStyle = 'rgba(20,20,24,0.07)'; x.beginPath(); x.ellipse(Math.random() * w, Math.random() * h, 10 + Math.random() * 30, 4 + Math.random() * 10, Math.random() * 3, 0, TAU); x.fill(); }
      x.fillStyle = '#e8e8e2'; x.fillRect(10, 0, 6, h); x.fillRect(w - 16, 0, 6, h);
      x.fillStyle = '#f2f2ea'; x.fillRect(w / 2 - 3, 0, 6, h * 0.45);
    });
  }
  function texCobble() {
    return canvasTex(256, 256, (x, w, h) => {
      x.fillStyle = '#6d625a'; x.fillRect(0, 0, w, h);
      for (let r = 0; r < 12; r++) for (let c = 0; c < 9; c++) { const ox = (r % 2) * 14, px = c * 29 + ox, py = r * 22; const v = 120 + Math.random() * 60; x.fillStyle = `rgb(${v},${v * 0.9},${v * 0.8})`; x.beginPath(); x.roundRect(px + 2, py + 2, 25, 18, 6); x.fill(); x.fillStyle = 'rgba(255,255,255,0.12)'; x.fillRect(px + 5, py + 4, 14, 3); }
    });
  }
  function texCurb() { return canvasTex(64, 128, (x, w, h) => { x.fillStyle = '#d8231f'; x.fillRect(0, 0, w, h); x.fillStyle = '#f4f4f0'; x.fillRect(0, 0, w, h / 2); }); }
  function texRail() { return canvasTex(256, 32, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#f2f4f6'); g.addColorStop(0.5, '#a8b0b8'); g.addColorStop(1, '#6a7078'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(0, h * 0.45, w, 2); }); }
  function texShoulder(th) { if (th.paving) return canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#9c968c'; x.fillRect(0, 0, w, h); for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) { const v = 150 + Math.random() * 40; x.fillStyle = `rgb(${v},${v - 4},${v - 12})`; x.fillRect(c * 64 + (r % 2) * 32 + 2, r * 32 + 2, 60, 28); for (let k = 0; k < 40; k++) { x.fillStyle = 'rgba(0,0,0,0.08)'; x.fillRect(c * 64 + (r % 2) * 32 + Math.random() * 60, r * 32 + Math.random() * 28, 2, 2); } } }); return canvasTex(128, 256, (x, w, h) => { x.fillStyle = th.grass1; x.fillRect(0, 0, w, h); for (let k = 0; k < 2200; k++) { x.fillStyle = Math.random() < 0.5 ? 'rgba(30,70,20,0.35)' : 'rgba(170,200,90,0.25)'; x.fillRect(Math.random() * w, Math.random() * h, 1.5, 3); } x.fillStyle = 'rgba(120,100,70,0.5)'; x.fillRect(0, 0, 10, h); }); }
  function buildTrack(T, th, def) {
    const grp = new THREE.Group(), ga = new Geo(), gc = new Geo(), gs = new Geo(), gk = new Geo(), gr = new Geo(), gw = new Geo(), gbar = new Geo(), gf = new Geo(), gi = new Geo();
    const N = T.N, P = (k, u, h) => V3(T.px[k] + T.rx[k] * u + T.ux[k] * h, T.py[k] + T.ry[k] * u + T.uy[k] * h, T.pz[k] + T.rz[k] * u + T.uz[k] * h);
    const inZone = (k, type) => !!T.zone(k * T.ds + T.ds / 2, type);
    const ramp = (k, u) => T.rampH ? T.rampH(k * T.ds, u) : 0;
    for (let k = 0; k < N; k++) {
      const k2 = (k + 1) % N, s0 = k * T.ds, s1 = (k + 1) * T.ds; if (inZone(k, 'gap') || inZone(k, 'air') || inZone(k, 'water')) continue;
      const town = inZone(k, 'town'), half0 = T.w[k] / 2, half1 = T.w[k2] / 2, sh = def.shoulder || 6;
      if (def.arena) { // arena: piso del tema y un murete a cada lado
        gf.face(P(k, -half0, 0.02 + ramp(k, -half0)), P(k, half0, 0.02 + ramp(k, -half0)), P(k2, half1, 0.02 + ramp(k2, -half1)), P(k2, -half1, 0.02 + ramp(k2, -half1)), [0, s0 / 12, T.w[k] / 12, s1 / 12]);
        for (const sg of [-1, 1]) { const a = (half0 + sh) * sg, b = (half1 + sh) * sg, q = sg < 0 ? [P(k2, b, 0), P(k, a, 0), P(k, a, 1.3), P(k2, b, 1.3)] : [P(k, a, 0), P(k2, b, 0), P(k2, b, 1.3), P(k, a, 1.3)]; gbar.face(q[0], q[1], q[2], q[3], [s0 / 6, 0, s1 / 6, 0.4]);
          const t0 = (half0 + sh + 0.7) * sg, t1 = (half1 + sh + 0.7) * sg, top = sg < 0 ? [P(k, t0, 1.3), P(k, a, 1.3), P(k2, b, 1.3), P(k2, t1, 1.3)] : [P(k, a, 1.3), P(k, t0, 1.3), P(k2, t1, 1.3), P(k2, b, 1.3)]; gbar.face(top[0], top[1], top[2], top[3], [0, 0, 0.2, 0.2]); }
        continue;
      }
      const stone = (town && !th.dirt) || th.allStone, iceZ = inZone(k, 'ice'), G = iceZ ? gi : stone ? gc : th.dirt ? gf : ga, vs = stone ? 6 : 16, us = stone ? T.w[k] / 6 : 1;
      // calzada (con la rampa encima si hay)
      const r0a = ramp(k, -half0), r1a = ramp(k2, -half1);
      G.face(P(k, -half0, 0.02 + r0a), P(k, half0, 0.02 + r0a), P(k2, half1, 0.02 + r1a), P(k2, -half1, 0.02 + r1a), [0, s0 / vs, us, s1 / vs]);
      if (inZone(k, 'elev')) {
        // autopista elevada: barrera de concreto, borde y cara de abajo
        for (const sg of [-1, 1]) { const a = (half0 + 1.2) * sg, b = (half1 + 1.2) * sg, q = sg < 0 ? [P(k2, b, -0.1), P(k, a, -0.1), P(k, a, 1.1), P(k2, b, 1.1)] : [P(k, a, -0.1), P(k2, b, -0.1), P(k2, b, 1.1), P(k, a, 1.1)]; gbar.face(q[0], q[1], q[2], q[3], [s0 / 8, 0, s1 / 8, 1]); const q2 = sg < 0 ? [P(k, a, -1.4), P(k2, b, -1.4), P(k2, b, 1.1), P(k, a, 1.1)] : [P(k2, b, -1.4), P(k, a, -1.4), P(k, a, 1.1), P(k2, b, 1.1)]; gbar.face(q2[0], q2[1], q2[2], q2[3], [s0 / 8, 0, s1 / 8, 1]);
          const t0 = (half0 + 0.6) * sg, t1 = (half1 + 0.6) * sg, top = sg < 0 ? [P(k, a, 1.1), P(k, t0, 1.1), P(k2, t1, 1.1), P(k2, b, 1.1)] : [P(k, t0, 1.1), P(k, a, 1.1), P(k2, b, 1.1), P(k2, t1, 1.1)]; gbar.face(top[0], top[1], top[2], top[3], [0, 0, 1, 1]); }
        gbar.face(P(k2, -half1 - 1.2, -1.4), P(k2, half1 + 1.2, -1.4), P(k, half0 + 1.2, -1.4), P(k, -half0 - 1.2, -1.4), [0, 0, 1, 1]);
        for (const sg of [-1, 1]) { const a = (half0 + 0.6) * sg, b = (half1 + 0.6) * sg, q = sg < 0 ? [P(k, a, 0.02), P(k, -half0 + 0.0, 0.02), P(k2, -half1, 0.02), P(k2, b, 0.02)] : [P(k, half0, 0.02), P(k, a, 0.02), P(k2, b, 0.02), P(k2, half1, 0.02)]; gbar.face(q[0], q[1], q[2], q[3], [0, 0, 1, 1]); }
      } else if (town && th.dirt) { /* sendero de selva: la vegetación hace de muro */
      } else if (town) {
        // andenes de piedra clara
        for (const sg of [-1, 1]) { const a0 = half0 * sg, a1 = (half0 + 2.4) * sg, b0 = half1 * sg, b1 = (half1 + 2.4) * sg; const pts = sg < 0 ? [P(k, a1, 0.18), P(k, a0, 0.18), P(k2, b0, 0.18), P(k2, b1, 0.18)] : [P(k, a0, 0.18), P(k, a1, 0.18), P(k2, b1, 0.18), P(k2, b0, 0.18)]; gw.face(pts[0], pts[1], pts[2], pts[3], [0, 0, 1, 1], new THREE.Color('#cfc6b8')); }
      } else {
        for (const sg of [-1, 1]) {
          const a0 = half0 * sg, a1 = (half0 + sh + 3) * sg, b0 = half1 * sg, b1 = (half1 + sh + 3) * sg;
          const pts = sg < 0 ? [P(k, a1, -0.08), P(k, a0, -0.02), P(k2, b0, -0.02), P(k2, b1, -0.08)] : [P(k, a0, -0.02), P(k, a1, -0.08), P(k2, b1, -0.08), P(k2, b0, -0.02)];
          gs.face(pts[0], pts[1], pts[2], pts[3], sg < 0 ? [1, s0 / 12, 0, s1 / 12] : [0, s0 / 12, 1, s1 / 12]);
          // bordillo rojo y blanco en las curvas
          if (Math.abs(T.kap[k]) > 0.007) { const c0 = (half0 - 0.2) * sg, c1 = (half0 + 1.1) * sg, d0 = (half1 - 0.2) * sg, d1 = (half1 + 1.1) * sg; const q = sg < 0 ? [P(k, c1, 0.05), P(k, c0, 0.06), P(k2, d0, 0.06), P(k2, d1, 0.05)] : [P(k, c0, 0.06), P(k, c1, 0.05), P(k2, d1, 0.05), P(k2, d0, 0.06)]; gk.face(q[0], q[1], q[2], q[3], [0, s0 / 4, 1, s1 / 4]); }
          // baranda metálica en la pared
          const wl0 = (half0 + sh) * sg, wl1 = (half1 + sh) * sg;
          const r = sg < 0 ? [P(k2, wl1, 0.35), P(k, wl0, 0.35), P(k, wl0, 1.05), P(k2, wl1, 1.05)] : [P(k, wl0, 0.35), P(k2, wl1, 0.35), P(k2, wl1, 1.05), P(k, wl0, 1.05)];
          gr.face(r[0], r[1], r[2], r[3], [s0 / 8, 0, s1 / 8, 1]);
        }
      }
    }
    const mAs = new THREE.MeshStandardMaterial({ map: texAsphalt(), roughness: 0.82, metalness: 0.05 });
    const mCo = new THREE.MeshStandardMaterial({ map: texCobble(), roughness: th.gold ? 0.45 : 0.9, metalness: th.gold ? 0.35 : 0, color: th.gold ? '#f2d488' : '#ffffff' }); // El Dorado: camino de piedra dorada
    const mSh = new THREE.MeshStandardMaterial({ map: texShoulder(th), roughness: 1 });
    const mCu = new THREE.MeshStandardMaterial({ map: texCurb(), roughness: 0.6 });
    const mRa = th.gold ? new THREE.MeshStandardMaterial({ color: '#f0c040', roughness: 0.3, metalness: 0.9, side: THREE.DoubleSide }) : th.paving ? new THREE.MeshStandardMaterial({ color: '#efe6d4', roughness: 0.8, side: THREE.DoubleSide }) : new THREE.MeshStandardMaterial({ map: texRail(), roughness: 0.35, metalness: 0.6, side: THREE.DoubleSide });
    const mWa = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
    const mBar = new THREE.MeshStandardMaterial({ map: canvasTex(64, 64, (x, w, h) => { x.fillStyle = '#9a9a96'; x.fillRect(0, 0, w, h); for (let k = 0; k < 400; k++) { const v = 120 + Math.random() * 60; x.fillStyle = `rgba(${v},${v},${v - 4},0.5)`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } x.fillStyle = th.night ? '#ffb020' : '#c8a020'; x.fillRect(0, 6, w, 5); }), roughness: 0.9, side: THREE.DoubleSide });
    // pilares bajo la autopista elevada
    { const pil = []; for (let k = 0; k < N; k += 10) if (inZone(k, 'elev')) { const p = P(k, 0, -1.4), gh = W.terrain ? W.terrain.userData.height(p.x, p.z) : 0; if (p.y - gh > 2.5) pil.push([p, p.y - gh]); }
      const pg = new THREE.BoxGeometry(3, 1, 2.2).translate(0, -0.5, 0), pm = new THREE.InstancedMesh(pg, new THREE.MeshStandardMaterial({ color: '#8e8e8a', roughness: 0.9 }), Math.max(1, pil.length)), M = new THREE.Matrix4(); pm.count = pil.length;
      pil.forEach(([p, hh], i) => { M.makeScale(1, hh + 1, 1); M.setPosition(p.x, p.y, p.z); pm.setMatrixAt(i, M); }); grp.add(pm); }
    const mFl = def.arena || th.dirt ? new THREE.MeshStandardMaterial({ map: texFloor(th.dirt ? 'dirt' : th.floor), roughness: th.gloss ? 0.2 : 0.95, metalness: th.gloss ? 0.2 : 0 }) : null;
    if (def.arena && th.rim) mBar.color.set(th.rim); if (th.gold) { mBar.color.set('#e8c878'); mBar.metalness = 0.5; mBar.roughness = 0.4; }
    const mIce = gi.i.length ? new THREE.MeshStandardMaterial({ map: canvasTex(256, 256, (x, w, h) => { const g2 = x.createLinearGradient(0, 0, w, h); g2.addColorStop(0, '#cfe6f4'); g2.addColorStop(1, '#a8d0ea'); x.fillStyle = g2; x.fillRect(0, 0, w, h); for (let k = 0; k < 500; k++) { x.fillStyle = `rgba(255,255,255,${Math.random() * 0.4})`; x.fillRect(Math.random() * w, Math.random() * h, 3, 1); } x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = 1.2; for (let k = 0; k < 40; k++) { let px = Math.random() * w, py = Math.random() * h; x.beginPath(); x.moveTo(px, py); for (let q = 0; q < 4; q++) { px += (Math.random() - 0.5) * 50; py += (Math.random() - 0.5) * 50; x.lineTo(px, py); } x.stroke(); } }), roughness: 0.12, metalness: 0.15 }) : null;
    for (const [g, m] of [[ga, mAs], [gc, mCo], [gs, mSh], [gk, mCu], [gr, mRa], [gw, mWa], [gbar, mBar], [gf, mFl], [gi, mIce]]) if (g.i.length) { const mesh = new THREE.Mesh(g.build(), m); mesh.receiveShadow = true; mesh.userData.noCast = true; grp.add(mesh); }
    // postes de la baranda
    const posts = []; for (let k = 0; k < N && !def.arena; k += 2) { if (inZone(k, 'town') || inZone(k, 'gap') || inZone(k, 'air') || inZone(k, 'water') || inZone(k, 'elev')) continue; for (const sg of [-1, 1]) posts.push(P(k, (T.w[k] / 2 + (def.shoulder || 6) + 0.15) * sg, 0)); }
    const pg = new THREE.BoxGeometry(0.16, 1.1, 0.16); pg.translate(0, 0.55, 0); const pm = new THREE.InstancedMesh(pg, new THREE.MeshStandardMaterial({ color: '#8a9098', metalness: 0.6, roughness: 0.4 }), posts.length);
    const M = new THREE.Matrix4(); posts.forEach((p, i) => { M.makeTranslation(p.x, p.y, p.z); pm.setMatrixAt(i, M); }); grp.add(pm);
    // meta: franja a cuadros
    if (def.arena) return grp;
    const fin = new Geo(), chk = canvasTex(256, 32, (x, w, h) => { for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; x.fillRect(i * 16, j * 16, 16, 16); } }, false);
    fin.face(P(0, -T.w[0] / 2, 0.04), P(0, T.w[0] / 2, 0.04), P(1, T.w[1] / 2, 0.04), P(1, -T.w[1] / 2, 0.04)); grp.add(new THREE.Mesh(fin.build(), new THREE.MeshStandardMaterial({ map: chk, roughness: 0.7 })));
    return grp;
  }
  /* ---------- arco de meta con letrero ---------- */
  function startGantry(T) {
    const g = new THREE.Group(), f = T.at(0), w = Math.max(T.w[0] / 2 + 1.2, T.limits(0).wall + 0.6), H = 7.5;
    const mPost = new THREE.MeshStandardMaterial({ color: '#1a2230', metalness: 0.7, roughness: 0.35 });
    for (const sg of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.7, H, 0.7), mPost); p.position.set(f.px + f.rx * w * sg, f.py + H / 2, f.pz + f.rz * w * sg); g.add(p); }
    const ban = canvasTex(1024, 128, (x, w2, h) => { const gr = x.createLinearGradient(0, 0, w2, 0); gr.addColorStop(0, '#0a3d2a'); gr.addColorStop(0.5, '#0f6b44'); gr.addColorStop(1, '#0a3d2a'); x.fillStyle = gr; x.fillRect(0, 0, w2, h); x.font = '400 78px "Russo One", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#ffffff'; x.shadowColor = '#19e68c'; x.shadowBlur = 18; x.fillText('VÉRTIGO · COPA ESMERALDA', w2 / 2, h / 2 + 4); }, false);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(w * 2 + 0.7, 1.6, 0.6), [mPost, mPost, mPost, mPost, new THREE.MeshStandardMaterial({ map: ban, emissive: '#ffffff', emissiveMap: ban, emissiveIntensity: 0.55 }), new THREE.MeshStandardMaterial({ map: ban, emissive: '#ffffff', emissiveMap: ban, emissiveIntensity: 0.55 })]);
    beam.position.set(f.px, f.py + H, f.pz); beam.lookAt(f.px + f.tx, f.py + H, f.pz + f.tz); g.add(beam);
    return g;
  }
  /* ---------- esmeraldas y plataformas ---------- */
  function buildPickups(T) {
    const grp = new THREE.Group();
    const gemGeo = new THREE.OctahedronGeometry(0.75, 0); gemGeo.scale(1, 1.45, 1);
    const gemMat = new THREE.MeshStandardMaterial({ color: '#19e68c', emissive: '#0bbf6a', emissiveIntensity: 0.9, metalness: 0.3, roughness: 0.15, transparent: true, opacity: 0.92 });
    const glow = new THREE.SpriteMaterial({ map: glowTex(), color: '#3dffa8', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.8 });
    W.gems = T.gems.map(g => { const m = new THREE.Mesh(gemGeo, gemMat), sp = new THREE.Sprite(glow); sp.scale.set(3.2, 3.2, 1); const o = new THREE.Group(); o.add(m); o.add(sp); const p = T.pos(g.s, g.u, 1.4, new THREE.Vector3()); o.position.copy(p); grp.add(o); return { g, o, m }; });
    const padTex = canvasTex(128, 128, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = '#7dffd0'; x.lineWidth = 14; x.lineCap = 'round'; for (const y of [30, 70, 110]) { x.beginPath(); x.moveTo(18, y); x.lineTo(64, y - 30); x.lineTo(110, y); x.stroke(); } });
    const padMat = new THREE.MeshBasicMaterial({ map: padTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, color: '#5affc0' });
    W.pads = T.pads.map(p => { const geo = new Geo(); const P = (s, u) => T.pos(s, u, 0.06, new THREE.Vector3()); geo.face(P(p.s - 2.2, p.u - 1.6), P(p.s - 2.2, p.u + 1.6), P(p.s + 2.2, p.u + 1.6), P(p.s + 2.2, p.u - 1.6), [0, 1, 1, 0]); const m = new THREE.Mesh(geo.build(), padMat); grp.add(m); return m; });
    anim.push(t => { padTex.offset.y = -t * 1.6; for (const e of W.gems) { e.o.visible = !(e.g.gone > 0); e.m.rotation.y = t * 2.2 + e.g.s; e.o.position.y = T.pos(e.g.s, e.g.u, 1.4 + Math.sin(t * 3 + e.g.s) * 0.18, tmpV).y; } });
    return grp;
  }
  const tmpV = new THREE.Vector3();
  let _glow = null;
  function glowTex() { return _glow || (_glow = canvasTex(64, 64, (x, w, h) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, false)); }
  /* ---------- rampa (cuña con franjas) y estructura del abismo ---------- */
  function buildRamps(T) {
    const grp = new THREE.Group(); const stripe = canvasTex(64, 64, (x, w, h) => { x.fillStyle = '#f0c419'; x.fillRect(0, 0, w, h); x.fillStyle = '#151515'; for (let i = -64; i < 128; i += 22) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 11, 0); x.lineTo(i + 11 + h, h); x.lineTo(i + h, h); x.fill(); } });
    const m = new THREE.MeshStandardMaterial({ map: stripe, roughness: 0.6 });
    for (const r of T.ramps) {
      const geo = new Geo(), half = T.w[Math.floor(r.s / T.ds) % T.N] / 2, H = r.len * Math.tan(r.angle * Math.PI / 180), P = (s, u, h) => T.pos(s, u, h, new THREE.Vector3());
      // cara delantera vertical (lo que se ve desde el abismo)
      geo.face(P(r.s, half, 0), P(r.s, -half, 0), P(r.s, -half, H), P(r.s, half, H), [0, 0, 4, 1]);
      for (const sg of [-1, 1]) { const u = half * sg; const q = [P(r.s - r.len, u, 0), P(r.s, u, 0), P(r.s, u, H), P(r.s, u, H)]; if (sg > 0) geo.face(q[0], q[1], q[2], q[3], [0, 0, 1, 1]); else geo.face(q[1], q[0], q[3], q[2], [0, 0, 1, 1]); }
      grp.add(new THREE.Mesh(geo.build(), m));
    }
    // pilares bajo los bordes del abismo
    const pm = new THREE.MeshStandardMaterial({ color: '#7d7a72', roughness: 0.9 });
    for (const z of T.zones) if (z.type === 'gap' || z.type === 'air') for (const s of [z.s0, z.s1]) { const p = T.pos(s, 0, 0, new THREE.Vector3()), Hh = z.type === 'air' ? p.y - T.lakeY + 8 : 14, wd = T.at(s).w + 3, bx = new THREE.Mesh(new THREE.BoxGeometry(wd, Hh, 4), pm); bx.position.copy(p).add(V3(0, -Hh / 2 - 0.2, 0)); const f = T.at(s); bx.lookAt(bx.position.x + f.tx, bx.position.y, bx.position.z + f.tz); grp.add(bx); }
    return grp;
  }
  /* ---------- tramos de agua (olas visibles, espuma, boyas) y de aire (aros) ---------- */
  function buildZones(T, th, def) {
    const grp = new THREE.Group();
    for (const z of T.zones) {
      if (z.type === 'water' && waterMat) {
        // franja de agua que se mueve con las mismas olas de la física (borde suave hacia el lago quieto)
        const len = T.wrap(z.s1 - z.s0 + 40), rows = Math.ceil(len / 2) + 1, us = [-1, -0.8, -0.6, -0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45, 0.6, 0.8, 1], C = us.length;
        const pos = new Float32Array(rows * C * 3), foam = new Float32Array(rows * C), idx = [], meta = [];
        for (let i = 0; i < rows; i++) { const s = T.wrap(z.s0 - 20 + i * 2), o = T.at(s), half = o.w / 2 + 9; for (let j = 0; j < C; j++) { const u = us[j] * half, v = i * C + j; pos[v * 3] = o.px + o.rx * u; pos[v * 3 + 2] = o.pz + o.rz * u; pos[v * 3 + 1] = T.lakeY; meta.push(s, u); } }
        for (let i = 0; i < rows - 1; i++) for (let j = 0; j < C - 1; j++) { const a = i * C + j, b = a + 1, c = a + C + 1, d = a + C; idx.push(a, c, d, a, b, c); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('foam', new THREE.BufferAttribute(foam, 1)); g.setIndex(idx);
        const m = waterMat.clone(); m.uniforms.sun.value = sunDir;
        m.vertexShader = 'attribute float foam; varying float vF; ' + waterMat.vertexShader.replace('void main(){', 'void main(){ vF = foam;');
        m.fragmentShader = 'varying float vF; ' + waterMat.fragmentShader.replace('float dist = length(cameraPosition - vW);', 'col = mix(col, vec3(0.93, 0.97, 1.0), clamp(vF, 0.0, 0.9)); float dist = length(cameraPosition - vW);');
        const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; grp.add(mesh);
        // boyas rojas y blancas que flotan a lado y lado
        const bs = []; for (let d = 0; d < T.wrap(z.s1 - z.s0); d += 9) for (const sg of [-1, 1]) bs.push({ s: T.wrap(z.s0 + d), u: sg * (T.at(T.wrap(z.s0 + d)).w / 2 + 2.6), c: (Math.round(d / 9) % 2) });
        const bg = new THREE.SphereGeometry(0.55, 14, 10); bg.scale(1, 0.8, 1); const bm = new THREE.InstancedMesh(bg, new THREE.MeshStandardMaterial({ roughness: 0.4 }), bs.length);
        const red = new THREE.Color('#e8302a'), wh = new THREE.Color('#f4f4ee'); bs.forEach((b, i) => bm.setColorAt(i, b.c ? red : wh)); grp.add(bm);
        const M4 = new THREE.Matrix4(), Pv = new THREE.Vector3();
        anim.push(t => {
          m.uniforms.t.value = t; const P = g.attributes.position.array;
          for (let v = 0; v < meta.length / 2; v++) { const h = T.waveH(meta[v * 2], meta[v * 2 + 1]); P[v * 3 + 1] = T.lakeY + h + 0.04; foam[v] = h ? T._foam : 0; }
          g.attributes.position.needsUpdate = true; g.attributes.foam.needsUpdate = true;
          bs.forEach((b, i) => { const o = T.at(b.s); Pv.set(o.px + o.rx * b.u, T.lakeY + T.waveH(b.s, b.u) + 0.15, o.pz + o.rz * b.u); M4.makeTranslation(Pv.x, Pv.y, Pv.z); bm.setMatrixAt(i, M4); }); bm.instanceMatrix.needsUpdate = true;
        });
      }
    }
    // aros del vuelo
    if (T.rings.length) {
      const tor = new THREE.TorusGeometry(3.2, 0.3, 10, 40), torB = new THREE.TorusGeometry(4.3, 0.36, 10, 48);
      const mE = new THREE.MeshStandardMaterial({ color: '#19e68c', emissive: '#12c878', emissiveIntensity: 1.3, metalness: 0.4, roughness: 0.25 }), mG = new THREE.MeshStandardMaterial({ color: '#ffd23d', emissive: '#ffb020', emissiveIntensity: 1.3, metalness: 0.6, roughness: 0.25 });
      const gl = new THREE.SpriteMaterial({ map: glowTex(), color: '#7dffc8', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5 });
      const list = T.rings.map(r => { const o = T.at(r.s), p = T.pos(r.s, r.u, r.h, new THREE.Vector3()), m = new THREE.Mesh(r.big ? torB : tor, r.big ? mG : mE); m.position.copy(p); m.lookAt(p.x + o.tx, p.y + o.ty, p.z + o.tz); const sp = new THREE.Sprite(gl); sp.scale.set(r.big ? 13 : 10, r.big ? 13 : 10, 1); sp.position.copy(p); grp.add(m); grp.add(sp); return m; });
      anim.push(t => list.forEach((m, i) => { m.rotation.z = t * 0.8 + i; const k = 1 + 0.05 * Math.sin(t * 4 + i); m.scale.set(k, k, k); }));
    }
    return grp;
  }
  /* ---------- ensamblar un mundo ---------- */
  // liberar la memoria de video del mundo anterior (si no, en el celular se acumula pista tras pista)
  function disposeScene(sc) {
    const seen = new Set(), tex = v => { if (v && v.isTexture && !seen.has(v)) { seen.add(v); v.dispose(); } };
    sc.traverse(o => {
      if (o.geometry && !seen.has(o.geometry)) { seen.add(o.geometry); o.geometry.dispose(); }
      for (const m of Array.isArray(o.material) ? o.material : o.material ? [o.material] : []) { if (seen.has(m)) continue; seen.add(m); for (const k in m) tex(m[k]); if (m.uniforms) for (const u of Object.values(m.uniforms)) tex(u && u.value); m.dispose(); }
    });
    tex(sc.environment); tex(sc.background);
  }
  function buildWorld(T, def) {
    if (scene) disposeScene(scene);
    scene = new THREE.Scene(); anim.length = 0;
    theme = THEMES[def.theme]; W.night = !!theme.night;
    sunDir.set(theme.sun[0], theme.sun[1], theme.sun[2]).normalize();
    scene.fog = new THREE.Fog(theme.fog, theme.fogNear, theme.fogFar);
    scene.add(makeSky(theme));
    // luz: cielo + sol (con sombras suaves cerca de los bólidos)
    scene.add(new THREE.HemisphereLight(theme.hemiSky, theme.hemiGround, theme.hemiI));
    const sun = new THREE.DirectionalLight(theme.sunCol, theme.sunI); sun.position.copy(sunDir).multiplyScalar(300); scene.add(sun); scene.add(sun.target);
    // sombras reales que siguen a la cámara de cada vista
    const lo = GQ.lv < 2, SR = lo ? 42 : 60; sun.castShadow = GQ.lv > 0; sun.shadow.mapSize.set(lo ? 1024 : 2048, lo ? 1024 : 2048); Object.assign(sun.shadow.camera, { left: -SR, right: SR, top: SR, bottom: -SR, near: 1, far: 420 }); sun.shadow.camera.updateProjectionMatrix(); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04; W.sun = sun;
    // reflejos para la pintura metálica: el mismo cielo, prefiltrado
    const pm = new THREE.PMREMGenerator(renderer), envScene = new THREE.Scene(); envScene.add(envSky(theme)); const gnd = new THREE.Mesh(new THREE.CircleGeometry(80, 24), new THREE.MeshBasicMaterial({ color: theme.grass2 })); gnd.rotation.x = -Math.PI / 2; gnd.position.y = -6; envScene.add(gnd); linearize(envScene);
    scene.environment = pm.fromScene(envScene, 0.02).texture; pm.dispose();
    const terrain = makeTerrain(T, theme, def); scene.add(terrain); W.terrain = terrain;
    if (def.lake && def.lake.plane !== false) scene.add(makeWater(theme, def.lake.y));
    else if (def.lake) { makeWater(theme, def.lake.y); // sin lago infinito: solo ríos (cinta ancha en el tramo de agua y el río del fondo de la garganta)
      const ribbon = (pts, y, w) => { const pos = [], idx = []; pts.forEach((p, i) => { const q = pts[Math.min(i + 1, pts.length - 1)], r = pts[Math.max(i - 1, 0)], dx = q[0] - r[0], dz = q[1] - r[1], l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l; pos.push(p[0] + nx * w, y, p[1] + nz * w, p[0] - nx * w, y, p[1] - nz * w); if (i) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); const m = new THREE.Mesh(g, waterMat); m.material.side = THREE.DoubleSide; m.frustumCulled = false; return m; };
      const wz = T.zones.find(z => z.type === 'water'); if (wz) { const pts = []; for (let d = -120; d <= T.wrap(wz.s1 - wz.s0) + 120; d += 6) { const o = T.at(T.wrap(wz.s0 + d)); pts.push([o.px, o.pz]); } scene.add(ribbon(pts, def.lake.y - 0.03, 46)); }
      const G = def.terrain && def.terrain.gorge; if (G) { const pts = []; for (let x = G.x0 - 300; x <= G.x1 - 60; x += 10) pts.push([x, G.z + G.amp * Math.sin(x / G.wl) + (fbm2(x / 90, 3.3, 2) - 0.5) * 20]); scene.add(ribbon(pts, G.bottom + 2.5, G.flat * 0.8)); } }
    const tag = o => { o.userData.noAudit = true; return o; }; // lo que va en la vía a propósito (la revisión automática lo ignora)
    scene.add(tag(buildTrack(T, theme, def))); if (!def.arena) scene.add(tag(startGantry(T)));
    if (T.geysers.length) { // géiseres: pozo turquesa con borde de minerales y chorro de vapor que avisa antes de salir
      const pool = new THREE.MeshStandardMaterial({ color: '#3ab8c8', emissive: '#0a4a54', roughness: 0.1, metalness: 0.2 }), rim = new THREE.MeshStandardMaterial({ color: '#d8c8a0', roughness: 0.9 });
      const jetT = canvasTex(64, 256, (x, w, h) => { const g2 = x.createLinearGradient(0, 0, 0, h); g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(0.3, 'rgba(255,255,255,0.75)'); g2.addColorStop(1, 'rgba(230,245,255,0.95)'); x.fillStyle = g2; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'destination-in'; const g3 = x.createLinearGradient(0, 0, w, 0); g3.addColorStop(0, 'rgba(0,0,0,0)'); g3.addColorStop(0.5, 'rgba(0,0,0,1)'); g3.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g3; x.fillRect(0, 0, w, h); }, false);
      const jetM = new THREE.MeshBasicMaterial({ map: jetT, transparent: true, depthWrite: false, side: THREE.DoubleSide }), jets = [];
      for (const gz of T.geysers) { const o = T.at(gz.s), p = T.pos(gz.s, gz.u, 0.04, new THREE.Vector3()); const r1 = new THREE.Mesh(new THREE.CylinderGeometry(gz.r * 0.9, gz.r * 1.1, 0.25, 20), rim); r1.position.copy(p); scene.add(tag(r1)); const pl = new THREE.Mesh(new THREE.CircleGeometry(gz.r * 0.7, 20), pool); pl.rotation.x = -Math.PI / 2; pl.position.set(p.x, p.y + 0.14, p.z); scene.add(tag(pl));
        const jg = new THREE.CylinderGeometry(gz.r * 0.35, gz.r * 0.7, 1, 12, 1, true).translate(0, 0.5, 0), j = new THREE.Mesh(jg, jetM); j.position.set(p.x, p.y + 0.1, p.z); scene.add(tag(j)); jets.push({ j, gz }); }
      anim.push(() => { for (const { j, gz } of jets) { const on = T.geyserOn(gz), hh = on === 1 ? 16 + Math.sin(T.time * 20) * 1.2 : on ? 1.4 + Math.sin(T.time * 30) * 0.4 : 0.01; j.scale.y = damp(j.scale.y, hh, on === 1 ? 14 : 5, 1 / 60); j.scale.x = j.scale.z = on === 1 ? 1.1 : 0.7; } }); } scene.add(tag(buildPickups(T))); scene.add(tag(buildRamps(T))); scene.add(tag(buildZones(T, theme, def)));
    // nubes lejanas
    const ct = cloudTex(); for (let k = 0; k < 26; k++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: ct, transparent: true, opacity: theme.night ? 0.45 : 0.75, color: theme.night ? theme.skyMid : '#ffffff', fog: false, depthWrite: false })); const a = Math.random() * TAU, r = 900 + Math.random() * 1500; sp.position.set(Math.cos(a) * r, 260 + Math.random() * 260, Math.sin(a) * r); const s = 260 + Math.random() * 380; sp.scale.set(s, s * 0.42, 1); scene.add(sp); }
    /* ¿cabe una caja (centro x,z; ancho w a lo ancho de (fx,fz), fondo d a lo largo de (fx,fz)) sin meterse en ninguna vía? */
    const fits = (x, z, fx, fz, w, d, m = 0.4) => { const rx = fz, rz = -fx; for (const a of [-0.5, 0, 0.5]) for (const b of [-0.5, 0, 0.5]) if (terrain.userData.clearAll(x + rx * a * w + fx * b * d, z + rz * a * w + fz * b * d) < m) return false; return true; };
    const K = { Geo, canvasTex, glowTex, terrain, anim, V3, occ: PROPS.occGrid(), fits };
    if (SCENERY[def.theme]) SCENERY[def.theme](scene, T, def, K);
    PROPS.build(scene, T, def, theme, K);
    linearize(scene); W.track = T;
    // quién proyecta y quién recibe sombra (en el celular solo los bólidos proyectan)
    const lo2 = GQ.lv < 2; scene.traverse(o => { if (o.isInstancedMesh) o.frustumCulled = false; /* r128 recorta instancias por el origen: se perdían objetos */ if (!o.isMesh || !o.material || o.material.isShaderMaterial) return; o.receiveShadow = true; if (!lo2 && !o.userData.noCast) o.castShadow = true; });
    terrain.castShadow = false; terrain.userData.noCast = true;
    return scene;
  }
  // centrar el mapa de sombras donde mira la cámara (ajustado a la rejilla para que no tiemble)
  const _f = new THREE.Vector3();
  function shadowFocus(cam) { if (!W.sun) return; cam.getWorldDirection(_f); const s = 1.5, x = Math.round((cam.position.x + _f.x * 26) / s) * s, z = Math.round((cam.position.z + _f.z * 26) / s) * s, y = Math.round(cam.position.y / s) * s - 6; W.sun.target.position.set(x, y, z); W.sun.position.set(x + sunDir.x * 160, y + sunDir.y * 160, z + sunDir.z * 160); W.sun.target.updateMatrixWorld(); }
  function update(t, dt) { if (waterMat) waterMat.uniforms.t.value = t; for (const f of anim) f(t, dt); }
  return { init, applyQuality, setResScale, get resK() { return resK; }, disposeScene, buildWorld, update, shadowFocus, get theme() { return theme; }, get renderer() { return renderer; }, get scene() { return scene; }, canvasTex: (...a) => canvasTex(...a), glowTex: () => glowTex(), linearize, Geo, W, sunDir };
})();

/* ---------- colores por tema ---------- */
const THEMES = {
  guatape: {
  grade: { sat: 1.12, con: 1.05, gain: [1.02, 1.0, 0.97], lift: [0.0, 0.01, 0.02], bloom: 0.5, thr: 0.78 },
    skyTop: '#2f6fd0', skyMid: '#9cc8ee', skyBot: '#b8d4e6', sunCol: '#fff1d6', sun: [0.55, 0.42, -0.55], sunI: 2.4,
    hemiSky: '#cfe6ff', hemiGround: '#4a6a32', hemiI: 0.42, fog: '#a9c9e6', fogNear: 320, fogFar: 2600,
    grass1: '#4f9c2c', grass2: '#7cbc38', forest: '#2a6a22', sand: '#c9b48a', rock: '#7c7a70', waterDeep: '#0e4a5e', waterShallow: '#2a8a8a',
  },
};
THEMES.venecia = {
  grade: { sat: 1.12, con: 1.1, gain: [1.04, 0.99, 0.93], lift: [0.005, 0.0, 0.015], bloom: 0.42, thr: 0.8 },
  skyTop: '#3d5ea8', skyMid: '#f0b48a', skyBot: '#f8d8b0', sunCol: '#ffd2a0', sun: [0.62, 0.2, 0.55], sunI: 2.5,
  hemiSky: '#ffe2c4', hemiGround: '#6a5a48', hemiI: 0.5, fog: '#efc6a2', fogNear: 300, fogFar: 2400,
  grass1: '#cbb89a', grass2: '#bba584', forest: '#a8957a', sand: '#c9b28c', rock: '#8c8070', waterDeep: '#1d5560', waterShallow: '#3f8c80', paving: true, allStone: true,
};
THEMES.tokio = {
  grade: { sat: 1.22, con: 1.1, gain: [0.98, 0.98, 1.06], lift: [0.01, 0.0, 0.03], bloom: 1.0, thr: 0.5, vig: 0.4 },
  skyTop: '#03061a', skyMid: '#1a1d48', skyBot: '#46305e', sunCol: '#bcd0ff', sun: [-0.45, 0.42, -0.6], sunI: 0.75, night: true,
  hemiSky: '#4a5aa8', hemiGround: '#2a1a34', hemiI: 0.62, fog: '#241f44', fogNear: 220, fogFar: 1900,
  grass1: '#3c3c46', grass2: '#34343e', forest: '#2c2c36', sand: '#4a4a52', rock: '#3a3a42', waterDeep: '#06142a', waterShallow: '#0e2a48',
};
THEMES.halong = {
  grade: { sat: 1.02, con: 1.02, gain: [0.98, 1.02, 1.02], lift: [0.02, 0.03, 0.03], bloom: 0.6, thr: 0.74 },
  skyTop: '#6a98c6', skyMid: '#cfe0e2', skyBot: '#e2ebe8', sunCol: '#fff4dc', sun: [0.3, 0.38, -0.7], sunI: 2.1,
  hemiSky: '#d8ecf0', hemiGround: '#4a6a4a', hemiI: 0.5, fog: '#c6dadb', fogNear: 160, fogFar: 1500,
  grass1: '#7aa64a', grass2: '#5e8a3a', forest: '#3a6a2a', sand: '#d8c89a', rock: '#8a8a80', waterDeep: '#17585a', waterShallow: '#3a9a88',
};
THEMES.canon = {
  grade: { sat: 1.15, con: 1.08, gain: [1.05, 1.0, 0.94], lift: [0.01, 0.0, 0.0], bloom: 0.5, thr: 0.78 },
  skyTop: '#2a64c8', skyMid: '#9cc4ec', skyBot: '#f0d8b8', sunCol: '#fff0d0', sun: [0.4, 0.62, -0.45], sunI: 2.6,
  hemiSky: '#c8e0ff', hemiGround: '#a05a30', hemiI: 0.45, fog: '#e8c8a8', fogNear: 400, fogFar: 2800,
  grass1: '#b25a32', grass2: '#c4703c', forest: '#7a6a38', sand: '#d8a868', rock: '#9a4426', waterDeep: '#2a5a50', waterShallow: '#4a8a6a',
};
THEMES.islandia = {
  grade: { sat: 1.15, con: 1.08, gain: [0.96, 1.0, 1.06], lift: [0.0, 0.01, 0.03], bloom: 0.85, thr: 0.58, vig: 0.38 },
  skyTop: '#040a20', skyMid: '#14275a', skyBot: '#3c5384', sunCol: '#c8dcff', sun: [-0.4, 0.38, 0.62], sunI: 1.15, night: true,
  hemiSky: '#6a7ec8', hemiGround: '#1c2630', hemiI: 0.78, fog: '#1a2a4c', fogNear: 280, fogFar: 2400,
  grass1: '#3f5c3a', grass2: '#55703f', forest: '#2e4a30', sand: '#26262b', rock: '#3a393d', waterDeep: '#08203a', waterShallow: '#1c4c62', snow: 62,
};
THEMES.amazonas = {
  grade: { sat: 1.2, con: 1.06, gain: [1.02, 1.03, 0.94], lift: [0.0, 0.01, 0.0], bloom: 0.55, thr: 0.78 },
  skyTop: '#3474c0', skyMid: '#b2d4dc', skyBot: '#e6eed6', sunCol: '#fff0c8', sun: [0.45, 0.5, 0.6], sunI: 2.3,
  hemiSky: '#d6eedc', hemiGround: '#2e4a1e', hemiI: 0.5, fog: '#b6cec0', fogNear: 220, fogFar: 1900,
  grass1: '#2a6a24', grass2: '#3e8a2e', forest: '#1e5a1e', sand: '#9a6a4a', rock: '#5a5040', waterDeep: '#4a3818', waterShallow: '#8a6a38', dirt: true,
};
THEMES.santorini = {
  grade: { sat: 1.14, con: 1.08, gain: [1.05, 0.99, 0.95], lift: [0.0, 0.0, 0.02], bloom: 0.5, thr: 0.8 },
  skyTop: '#2c5cb8', skyMid: '#f2b896', skyBot: '#ffd8b8', sunCol: '#ffd8a8', sun: [-0.72, 0.22, 0.4], sunI: 2.6,
  hemiSky: '#ffe6d0', hemiGround: '#6a4a3a', hemiI: 0.5, fog: '#e8c2b0', fogNear: 320, fogFar: 2600,
  grass1: '#a8966a', grass2: '#b8a678', forest: '#6a7a44', sand: '#4a4242', rock: '#7a4a3a', waterDeep: '#0b3a72', waterShallow: '#1a86a8', bands: ['#8a3e2a', '#2c2626', '#cfc2ac', '#a8583a'],
};
THEMES.egipto = {
  grade: { sat: 1.12, con: 1.08, gain: [1.06, 1.0, 0.92], lift: [0.01, 0.0, 0.0], bloom: 0.5, thr: 0.8 },
  skyTop: '#3a74c8', skyMid: '#a6c6e0', skyBot: '#f2dcb0', sunCol: '#fff0d0', sun: [0.35, 0.68, -0.4], sunI: 2.7,
  hemiSky: '#d6e6ff', hemiGround: '#a07a4a', hemiI: 0.45, fog: '#ead4a8', fogNear: 360, fogFar: 2700,
  grass1: '#d6b678', grass2: '#e2c48a', forest: '#b8985e', sand: '#cdb27e', rock: '#b08a5a', waterDeep: '#1a5a6a', waterShallow: '#3a8a7a',
};
THEMES.egipto = {
  grade: { sat: 1.12, con: 1.08, gain: [1.06, 1.0, 0.92], lift: [0.01, 0.0, 0.0], bloom: 0.5, thr: 0.8 },
  skyTop: '#3270c4', skyMid: '#a6c6e2', skyBot: '#f2dcb0', sunCol: '#fff0d0', sun: [0.35, 0.68, -0.45], sunI: 2.7,
  hemiSky: '#d8e6ff', hemiGround: '#b08a50', hemiI: 0.45, fog: '#ead6ae', fogNear: 360, fogFar: 2700,
  grass1: '#dcbc7c', grass2: '#e6c88c', forest: '#b89a60', sand: '#cfb27a', rock: '#b08a5a', waterDeep: '#1a5a6a', waterShallow: '#3a8a7a',
};
THEMES.dorado = {
  grade: { sat: 1.15, con: 1.1, gain: [1.05, 1.0, 0.92], lift: [0.0, 0.0, 0.02], bloom: 0.6, thr: 0.74 },
  skyTop: '#26357e', skyMid: '#ff9c52', skyBot: '#ffd889', sunCol: '#ffbe5a', sun: [0.62, 0.17, -0.5], sunI: 2.7,
  hemiSky: '#ffd9a6', hemiGround: '#4a3a1c', hemiI: 0.52, fog: '#e6a870', fogNear: 320, fogFar: 2500,
  grass1: '#3e8a2c', grass2: '#62a03a', forest: '#245e20', sand: '#c8a050', rock: '#7a6448', waterDeep: '#174a3a', waterShallow: '#3a8a5a', allStone: true, gold: true, snow: 150,
};
THEMES.coliseo = {
  grade: { sat: 1.12, con: 1.08, gain: [1.05, 1.0, 0.93], lift: [0.01, 0.0, 0.0], bloom: 0.45, thr: 0.8 },
  skyTop: '#3a6ec4', skyMid: '#a9c6e6', skyBot: '#f2d8b4', sunCol: '#ffe6c0', sun: [0.5, 0.45, 0.6], sunI: 2.5,
  hemiSky: '#d6e4ff', hemiGround: '#8a6a44', hemiI: 0.45, fog: '#e6d2b8', fogNear: 300, fogFar: 2400,
  grass1: '#7f9448', grass2: '#97a65a', forest: '#5a7a34', sand: '#d8b480', rock: '#a8987c', waterDeep: '#2a5a60', waterShallow: '#4a8a80', floor: 'sand', rim: '#d9c7a2',
};
THEMES.uyuni = {
  grade: { sat: 1.1, con: 1.06, gain: [0.98, 1.0, 1.04], lift: [0.0, 0.01, 0.03], bloom: 0.5, thr: 0.86 },
  skyTop: '#1846b0', skyMid: '#74aaea', skyBot: '#dce8f6', sunCol: '#ffffff', sun: [-0.35, 0.62, -0.5], sunI: 2.6,
  hemiSky: '#cfe2ff', hemiGround: '#c8ccd4', hemiI: 0.55, fog: '#d6e4f4', fogNear: 500, fogFar: 3000,
  grass1: '#eef1f4', grass2: '#e2e7ec', forest: '#d4dae2', sand: '#f2f2f0', rock: '#8a7462', waterDeep: '#6a8ab0', waterShallow: '#a8c4e0', floor: 'salt', gloss: true, rim: '#f6f4ee',
};
THEMES.totumo = {
  grade: { sat: 1.14, con: 1.06, gain: [1.02, 1.01, 0.95], lift: [0.0, 0.01, 0.0], bloom: 0.5, thr: 0.8 },
  skyTop: '#3778c6', skyMid: '#a6cfe8', skyBot: '#ece6c6', sunCol: '#fff0cc', sun: [0.4, 0.55, -0.6], sunI: 2.4,
  hemiSky: '#d4ecff', hemiGround: '#4a5a2a', hemiI: 0.48, fog: '#cfe0d8', fogNear: 260, fogFar: 2200,
  grass1: '#5c9a38', grass2: '#7db044', forest: '#2e6a26', sand: '#a48c6a', rock: '#6a5a4a', waterDeep: '#3d4c2c', waterShallow: '#6c7c46', floor: 'mud', rim: '#8e6c4a',
};
const SCENERY = {};
