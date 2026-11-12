/* =========================================================================
   ARENAS DE BATALLA — el Coliseo de Roma (graderías llenas, muro de arcos
   con la parte en ruinas, hipogeo de ladrillo en el centro, columnas rotas
   y braseros), el Salar de Uyuni (espejo de sal en hexágonos, Isla
   Incahuasi con cactus gigantes, montículos de sal, banderas, jeeps y
   volcanes en el horizonte) y el Volcán del Totumo (cono de lodo con su
   escalera y bañistas en el cráter, charcos que burbujean, ciénaga con
   manglares, palmas y kioscos de colores).
   ========================================================================= */
const ARENA_KIT = (() => {
  // lado de afuera del anillo (+1 o −1 en u)
  function outerSign(T) { const a = T.pos(0, 10, 0, new THREE.Vector3()), b = T.pos(0, -10, 0, new THREE.Vector3()); return Math.hypot(a.x, a.z) > Math.hypot(b.x, b.z) ? 1 : -1; }
  // cinta alrededor del anillo entre dos puntos del corte (d = distancia al borde de la vía, h = altura)
  function band(g, T, sg, d0, h0, d1, h1, uvLen, col, hFn) {
    const N = T.N, P = new THREE.Vector3(), Q = new THREE.Vector3();
    for (let k = 0; k < N; k += 2) {
      const k2 = (k + 2) % N, s0 = k * T.ds, s1 = (k + 2) * T.ds, w0 = T.w[k] / 2, w1 = T.w[k2] / 2, e0 = hFn ? hFn(s0) : 0, e1 = hFn ? hFn(s1) : 0;
      const A = T.pos(s0, sg * (w0 + d0), h0 + (h0 > 1 ? e0 : 0), new THREE.Vector3()), B = T.pos(s1, sg * (w1 + d0), h0 + (h0 > 1 ? e1 : 0), new THREE.Vector3());
      const C = T.pos(s1, sg * (w1 + d1), h1 + e1, new THREE.Vector3()), D = T.pos(s0, sg * (w0 + d1), h1 + e0, new THREE.Vector3());
      // todos los puntos al nivel del piso del anillo (sin lomas) para que las graderías queden parejas
      for (const V of [A, B, C, D]) V.y -= 0;
      g.face(A, B, C, D, [s0 / uvLen, 0, s1 / uvLen, 1], col);
    }
  }
  function mat(o) { return new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.85, side: THREE.DoubleSide }, o)); }
  // gente simple (torso + cabeza) en instancias, con brinco barato (solo cambia la altura)
  function crowd(scene, list, anim, cols) {
    if (!list.length) return; const g = new THREE.BoxGeometry(0.62, 0.9, 0.36).translate(0, 0.45, 0), hd = new THREE.BoxGeometry(0.36, 0.38, 0.36).translate(0, 1.1, 0);
    const body = new THREE.InstancedMesh(g, mat({ side: THREE.FrontSide, roughness: 0.9 }), list.length), head = new THREE.InstancedMesh(hd, mat({ side: THREE.FrontSide, color: '#d8a882', roughness: 0.8 }), list.length);
    const M = new THREE.Matrix4(), C = new THREE.Color(), SK = ['#f0c8a0', '#c89064', '#8a5a3a', '#e8b890', '#6a4028'];
    list.forEach((p, i) => { M.makeRotationY(p[3]); M.setPosition(p[0], p[1], p[2]); body.setMatrixAt(i, M); head.setMatrixAt(i, M); body.setColorAt(i, C.set(cols[(i * 7) % cols.length]).offsetHSL((Math.random() - 0.5) * 0.06, 0, (Math.random() - 0.5) * 0.12)); head.setColorAt(i, C.set(SK[i % SK.length])); });
    for (const m of [body, head]) { m.frustumCulled = false; GFX.linearize(m); scene.add(m); }
    const ph = list.map(() => Math.random() * 6), sp = list.map(() => 5 + Math.random() * 4), y0 = list.map(p => p[1]);
    anim.push(t => { const a = body.instanceMatrix.array, b = head.instanceMatrix.array; for (let i = 0; i < list.length; i += 1) { const y = y0[i] + Math.max(0, Math.sin(t * sp[i] + ph[i])) * 0.28; a[i * 16 + 13] = y; b[i * 16 + 13] = y; } body.instanceMatrix.needsUpdate = true; head.instanceMatrix.needsUpdate = true; });
  }
  // obstáculo en coordenadas de pista → punto del mundo
  const obsPos = (T, o) => T.pos(T.cp(o.at), o.u || 0, 0, new THREE.Vector3());
  return { outerSign, band, mat, crowd, obsPos };
})();

/* ---------- COLISEO DE ROMA ---------- */
SCENERY.coliseo = (scene, T, def, K) => {
  const { Geo, canvasTex, anim, V3 } = K, A = ARENA_KIT, sg = A.outerSign(T), rnd = makeRng(41), N = T.N;
  const trav = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#d9c9a6'; x.fillRect(0, 0, w, h); for (let k = 0; k < 2500; k++) { const v = Math.random(); x.fillStyle = `rgba(${170 + v * 70},${150 + v * 60},${110 + v * 50},0.35)`; x.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 1 + Math.random() * 2); } x.strokeStyle = 'rgba(120,100,70,0.35)'; x.lineWidth = 2; for (let y = 0; y < h; y += 32) { x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); for (let c = (y / 32) % 2 * 32; c < w; c += 64) { x.beginPath(); x.moveTo(c, y); x.lineTo(c, y + 32); x.stroke(); } } });
  // graderías: escalones de piedra con líneas de asientos
  const seats = canvasTex(256, 128, (x, w, h) => { x.fillStyle = '#cdbb96'; x.fillRect(0, 0, w, h); for (let k = 0; k < 1500; k++) { const v = Math.random(); x.fillStyle = `rgba(${150 + v * 70},${130 + v * 60},${100 + v * 40},0.4)`; x.fillRect(Math.random() * w, Math.random() * h, 3, 2); } x.fillStyle = 'rgba(90,70,50,0.35)'; for (let y = 0; y < h; y += 32) x.fillRect(0, y, w, 4); });
  const gP = new Geo(), gS = new Geo(), gR = new Geo(), gW = new Geo();
  // podio (muro que rodea la arena) con cornisa de mármol
  A.band(gP, T, sg, 1.7, 0, 1.7, 4.4, 12); A.band(gP, T, sg, 1.7, 4.4, 2.6, 4.6, 12);
  // cavea: 7 gradas
  const TIERS = 7, D0 = 2.6, DD = 4.2, HH = 3.0; const tread = [];
  for (let j = 0; j < TIERS; j++) { const d = D0 + j * DD, h = 4.6 + j * HH; A.band(gS, T, sg, d, h, d, h + HH, 10); A.band(gS, T, sg, d, h + HH, d + DD, h + HH, 10); tread.push([d, h + HH]); }
  // muro exterior de arcos (alto, con la parte en ruinas); se ve desde adentro por encima de las gradas
  const facade = canvasTex(512, 512, (x, w, h) => { x.drawImage(trav.image, 0, 0, w, h); const tiers = [[60, 160], [180, 280], [300, 400]];
    for (const [y0, y1] of tiers) { for (let a = 0; a < 8; a++) { const cx = a * 64 + 32; x.fillStyle = 'rgba(40,30,20,0.9)'; x.beginPath(); x.moveTo(cx - 20, y1); x.lineTo(cx - 20, y0 + 26); x.arc(cx, y0 + 26, 20, Math.PI, 0); x.lineTo(cx + 20, y1); x.fill(); x.fillStyle = 'rgba(255,240,210,0.35)'; x.fillRect(cx + 26, y0, 8, y1 - y0); }
      x.fillStyle = 'rgba(140,115,80,0.8)'; x.fillRect(0, y1, w, 12); }
    x.fillStyle = 'rgba(140,115,80,0.8)'; x.fillRect(0, 410, w, 10); for (let a = 0; a < 8; a++) { x.fillStyle = 'rgba(40,30,20,0.85)'; x.fillRect(a * 64 + 24, 440, 16, 26); } }, true);
  const ruin = s => { const f = T.wrap(s) / T.L; const k = smooth(clamp((f - 0.58) / 0.04, 0, 1)) * (1 - smooth(clamp((f - 0.86) / 0.04, 0, 1))); return -k * (16 + Math.floor(f * 40) % 3 * 3); };
  const DO = D0 + TIERS * DD; A.band(gW, T, sg, DO, 0, DO, 46, 34, null, ruin); A.band(gW, T, sg, DO + 3, 0, DO + 3, 46, 34, null, ruin); A.band(gW, T, sg, DO, 46, DO + 3, 46, 34, null, ruin);
  const mT = A.mat({ map: trav }), mSe = A.mat({ map: seats }), mF = A.mat({ map: facade });
  for (const [g, m] of [[gP, mT], [gS, mSe], [gW, mF]]) scene.add(new THREE.Mesh(g.build(), m));
  // el anillo de gradas y muros ocupa espacio (nada de árboles adentro)
  for (let x = -80; x <= 80; x += 9) for (let z = -56; z <= 56; z += 9) if ((x / 80) ** 2 + (z / 56) ** 2 < 1) K.occ.occupy(x, z, 7); // isla del hipogeo
  for (let k = 0; k < N; k += 5) { const p = T.pos(k * T.ds, sg * (T.w[k] / 2 + 26), 0, V3()); K.occ.occupy(p.x, p.z, 26); const q = T.pos(k * T.ds, -sg * (T.w[k] / 2 + 12), 0, V3()); K.occ.occupy(q.x, q.z, 12); }
  // público en las gradas (más o menos según la calidad gráfica)
  { const list = [], every = [3.2, 2.2, 1.5][GQ.lv], fill = 0.75; for (const [d, h] of tread) for (let s = 0; s < T.L; s += every) { if (rnd() > fill || ruin(s) < -4) continue; const k = Math.floor(s / T.ds) % N, w = T.w[k] / 2, p = T.pos(s, sg * (w + d + 1.2 + rnd() * 1.6), h, V3()), o = T.at(s); list.push([p.x, p.y, p.z, Math.atan2(-o.rx * sg, -o.rz * sg)]); }
    A.crowd(scene, list, anim, ['#b02a2a', '#f2ede0', '#2a5ab0', '#e8b82a', '#5a2a8a', '#2a8a4a', '#d86a2a', '#7a4a2a']); }
  // estandartes morados y dorados colgando del podio
  { const tex = canvasTex(64, 160, (x, w, h) => { x.fillStyle = '#5a1a7a'; x.fillRect(0, 0, w, h); x.fillStyle = '#e8b82a'; x.fillRect(0, 0, w, 8); x.fillRect(0, h - 22, w, 4); x.beginPath(); x.moveTo(0, h - 18); for (let i = 0; i <= 8; i++) x.lineTo(i * 8, h - (i % 2 ? 2 : 18)); x.lineTo(w, h - 18); x.fill(); x.strokeStyle = '#e8b82a'; x.lineWidth = 5; x.beginPath(); x.arc(32, 64, 18, 0.6, Math.PI * 2 - 0.6 + Math.PI * 0.2); x.stroke(); x.font = '900 26px "Russo One", sans-serif'; x.textAlign = 'center'; x.fillStyle = '#e8b82a'; x.fillText('V', 32, 74); }, false);
    const g = new THREE.PlaneGeometry(1.8, 2.8).translate(0, -1.4, 0), m = A.mat({ map: tex, roughness: 0.7 });
    for (let s = 6; s < T.L; s += 22) { const k = Math.floor(s / T.ds) % N, p = T.pos(s, sg * (T.w[k] / 2 + 1.62), 4.35, V3()), o = T.at(s), b = new THREE.Mesh(g, m); b.position.copy(p); b.lookAt(p.x - o.rx * sg, p.y, p.z - o.rz * sg); scene.add(b); } }
  // hipogeo: laberinto de muros de ladrillo en la isla del centro
  { const g = new Geo(), brick = new THREE.Color('#a0583a'), brick2 = new THREE.Color('#8a4a30'), inner = (x, z) => { const nt = K.terrain.userData.nearTrack(x, z); return !nt || nt.d > T.w[nt.q.k] / 2 + 4; };
    const a = 74, b = 50, y0 = T.py[0] - 0.45, box = (x0, z0, x1, z1, h, c) => { const P = (x, z, y) => V3(x, y0 + y, z); g.face(P(x0, z1, 0), P(x1, z1, 0), P(x1, z1, h), P(x0, z1, h), null, c); g.face(P(x1, z0, 0), P(x0, z0, 0), P(x0, z0, h), P(x1, z0, h), null, c); g.face(P(x1, z1, 0), P(x1, z0, 0), P(x1, z0, h), P(x1, z1, h), null, c); g.face(P(x0, z0, 0), P(x0, z1, 0), P(x0, z1, h), P(x0, z0, h), null, c); g.face(P(x0, z1, h), P(x1, z1, h), P(x1, z0, h), P(x0, z0, h), null, c); };
    for (let x = -a; x <= a; x += 7) for (let z = -b; z <= b; z += 7) { if ((x / a) ** 2 + (z / b) ** 2 > 0.62) continue; const h = 1.2 + rnd() * 2.2, c = rnd() < 0.5 ? brick : brick2;
      if (rnd() < 0.7 && inner(x + 3.5, z)) box(x, z - 0.35, x + 7, z + 0.35, h, c); if (rnd() < 0.6 && inner(x, z + 3.5)) box(x - 0.35, z, x + 0.35, z + 7, h * 0.9, c); }
    scene.add(new THREE.Mesh(g.build(), A.mat({ vertexColors: true, side: THREE.FrontSide, roughness: 0.95 })));
    // piso de tablas sobre parte del hipogeo
    const plank = canvasTex(128, 128, (x, w, h) => { for (let i = 0; i < 8; i++) { const v = 0.8 + Math.random() * 0.3; x.fillStyle = `rgb(${150 * v | 0},${104 * v | 0},${64 * v | 0})`; x.fillRect(0, i * 16, w, 15); } });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(34, 0.4, 10), A.mat({ map: plank, side: THREE.FrontSide })); deck.position.set(-18, y0 + 3.6, 0); scene.add(deck);
    for (const px of [-34, -24, -12, -2]) for (const pz of [-4.5, 4.5]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.6, 0.5), A.mat({ color: '#6a4a2a', side: THREE.FrontSide })); post.position.set(px, y0 + 1.8, pz); scene.add(post); }
  }
  // columnas rotas (son los obstáculos sólidos) y braseros con fuego
  { const mm = A.mat({ color: '#efe8da', roughness: 0.6, side: THREE.FrontSide }), bm = A.mat({ map: trav, side: THREE.FrontSide });
    for (const o of def.obstacles) { const p = A.obsPos(T, o), h = 3 + rnd() * 3.5, c = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, h, 16, 1), mm); c.position.set(p.x, p.y + 0.9 + h / 2, p.z); c.rotation.z = (rnd() - 0.5) * 0.06; c.userData.noAudit = true; scene.add(c);
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 2.6), bm); base.position.set(p.x, p.y + 0.45, p.z); base.userData.noAudit = true; scene.add(base); const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 0.8, 0.5, 16), mm); cap.position.set(p.x, p.y + 0.9 + h, p.z); cap.rotation.x = 0.2; cap.userData.noAudit = true; scene.add(cap); }
    const fire = new THREE.SpriteMaterial({ map: K.glowTex(), color: '#ff9a3a', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }), fl = [];
    for (let i = 0; i < 6; i++) { const s = i / 6 * T.L + 15, k = Math.floor(s / T.ds) % N, p = T.pos(s, -sg * (T.w[k] / 2 + 3.2), 0, V3()); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.5, 2.6, 8), A.mat({ color: '#6a4a2a', metalness: 0.5, roughness: 0.4, side: THREE.FrontSide })); st.position.set(p.x, p.y + 1.3, p.z); scene.add(st);
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.5, 0.7, 12), A.mat({ color: '#8a6a3a', metalness: 0.6, roughness: 0.35, side: THREE.FrontSide })); bowl.position.set(p.x, p.y + 2.9, p.z); scene.add(bowl);
      const f = new THREE.Sprite(fire); f.position.set(p.x, p.y + 4, p.z); f.scale.set(3.6, 4.6, 1); scene.add(f); fl.push(f); }
    anim.push(t => fl.forEach((f, i) => { const k = 1 + 0.18 * Math.sin(t * 13 + i * 2) + 0.1 * Math.sin(t * 29 + i); f.scale.set(3.4 * k, 4.6 * k, 1); f.material.opacity = 0.85 + 0.15 * Math.sin(t * 17 + i); })); }
};

/* ---------- SALAR DE UYUNI ---------- */
SCENERY.uyuni = (scene, T, def, K) => {
  const { Geo, canvasTex, anim, V3 } = K, A = ARENA_KIT, sg = A.outerSign(T), rnd = makeRng(53), N = T.N, y0 = T.py[0] - 0.45;
  // Isla Incahuasi: cerro de roca con cactus gigantes
  { const R0 = 52, H = 24, sub = new THREE.SphereGeometry(1, 96, 32, 0, TAU, 0, Math.PI / 2), P = sub.attributes.position, cols = new Float32Array(P.count * 3), cA = new THREE.Color('#9a8064'), cB = new THREE.Color('#6e5a48'), cC = new THREE.Color('#c8b498'), tmp = new THREE.Color();
    const hAt = (x, z) => { const r = Math.hypot(x, z) / R0; if (r >= 1) return 0; return H * Math.pow(1 - r * r, 0.9) * (0.8 + 0.4 * fbm2(x / 30, z / 30, 3)) + (fbm2(x / 8, z / 8, 2) - 0.5) * 2.4 * (1 - r); };
    for (let v = 0; v < P.count; v++) { const x = P.getX(v) * R0, z = P.getZ(v) * R0, h = hAt(x, z); P.setXYZ(v, x, Math.max(0, h) - 0.3, z); const n = fbm2(x / 6, z / 6, 3); tmp.copy(cA).lerp(cB, n).lerp(cC, clamp((n - 0.6) * 3, 0, 1) * 0.6); cols[v * 3] = tmp.r; cols[v * 3 + 1] = tmp.g; cols[v * 3 + 2] = tmp.b; }
    sub.setAttribute('color', new THREE.BufferAttribute(cols, 3)); sub.computeVertexNormals(); const isl = new THREE.Mesh(sub, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true })); isl.position.y = y0; scene.add(isl);
    for (let k = 0; k < 10; k++) K.occ.occupy(Math.cos(k / 10 * TAU) * 30, Math.sin(k / 10 * TAU) * 30, 26);
    // cactus columnares (tronco + brazos), instanciados
    const parts = [new THREE.CylinderGeometry(0.42, 0.5, 6, 9).translate(0, 3, 0)]; for (const [a, y, l] of [[0, 3.2, 2.4], [Math.PI, 4.1, 1.8]]) { const e = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8).rotateZ(Math.PI / 2).translate(Math.cos(a) * 0.9, y, Math.sin(a) * 0.9); const u = new THREE.CylinderGeometry(0.3, 0.32, l, 8).translate(Math.cos(a) * 1.5, y + l / 2, Math.sin(a) * 1.5); parts.push(e, u); }
    const cg = THREE.BufferGeometryUtils ? THREE.BufferGeometryUtils.mergeBufferGeometries(parts.map(p => p.toNonIndexed())) : null; const list = [];
    for (let i = 0; i < [70, 110, 170][GQ.lv]; i++) { const a = rnd() * TAU, r = Math.sqrt(rnd()) * R0 * 0.85, x = Math.cos(a) * r, z = Math.sin(a) * r; list.push([x, y0 + Math.max(0, hAt(x, z)) - 0.5, z, 0.7 + rnd() * 0.8, rnd() * TAU, 0.8 + rnd() * 0.6]); }
    const cm = new THREE.MeshStandardMaterial({ color: '#5c8a4a', roughness: 0.8 }); if (cg) PROPS.inst(scene, cg, cm, list, ['#5c8a4a', '#6a9a50', '#4e7a40'], true); else for (const g2 of parts) PROPS.inst(scene, g2, cm, list, ['#5c8a4a'], true); }
  // montículos de sal en filas, banderas, hotel de sal, jeeps, volcanes en el horizonte
  { const list = []; for (let c = 0; c < 9; c++) { const a = rnd() * TAU, r = 220 + rnd() * 380, cx = Math.cos(a) * r, cz = Math.sin(a) * r; for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) list.push([cx + i * 5 + rnd(), y0, cz + j * 5 + rnd(), 0.9 + rnd() * 0.4, rnd() * TAU, 1]); }
    PROPS.inst(scene, new THREE.ConeGeometry(1.4, 1.3, 10).translate(0, 0.65, 0), new THREE.MeshStandardMaterial({ color: '#f6f6f2', roughness: 0.7 }), list, ['#f8f8f4', '#eeeeea'], true); }
  { const cx = 160 * sg, cz = 40, poles = [], flags = [], tex = canvasTex(256, 64, (x, w, h) => { const C = ['#d8202a', '#f2c12e', '#1a8a3a', '#2a5ab0', '#ffffff', '#8a2ab0', '#ff7a1a', '#18a6b0']; for (let i = 0; i < 8; i++) for (let j = 0; j < 3; j++) { x.fillStyle = C[(i * 3 + j * 5) % 8]; x.fillRect(i * 32, j * 21, 32, 22); } }, false);
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, x = cx + Math.cos(a) * 16, z = cz + Math.sin(a) * 16, p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 7, 6), new THREE.MeshStandardMaterial({ color: '#c8ccd2', metalness: 0.7, roughness: 0.3 })); p.position.set(x, y0 + 3.5, z); scene.add(p);
      const fg = new THREE.PlaneGeometry(2.2, 1.4, 6, 1).translate(1.1, 0, 0); const uv = fg.attributes.uv; for (let v = 0; v < uv.count; v++) uv.setX(v, (uv.getX(v) + (i % 8)) / 8); const f = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.8 })); f.position.set(x, y0 + 6.2, z); f.rotation.y = rnd() * TAU; scene.add(f); flags.push(f); }
    anim.push(t => flags.forEach((f, i) => { const P = f.geometry.attributes.position; for (let v = 0; v < P.count; v++) { const x = P.getX(v); P.setZ(v, Math.sin(t * 6 + x * 2.2 + i) * 0.18 * x / 2.2); } P.needsUpdate = true; }));
    K.occ.occupy(cx, cz, 20);
    const salt = canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#f2f0ea'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(160,150,130,0.6)'; x.lineWidth = 2; for (let y = 0; y < h; y += 16) { x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); for (let c = (y / 16) % 2 * 16; c < w; c += 32) { x.beginPath(); x.moveTo(c, y); x.lineTo(c, y + 16); x.stroke(); } } });
    salt.repeat.set(4, 1); const hx = cx + 40 * sg, hz = cz - 50, hotel = new THREE.Mesh(new THREE.BoxGeometry(34, 6, 16), new THREE.MeshStandardMaterial({ map: salt, roughness: 0.8 })); hotel.position.set(hx, y0 + 3, hz); scene.add(hotel); K.occ.occupy(hx, hz, 20);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(5, 18, 10, 0, TAU, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ map: salt, roughness: 0.8 })); dome.position.set(hx - 9, y0 + 6, hz); scene.add(dome);
    // jeeps 4x4 parqueados
    const jc = ['#e8e8e4', '#d8202a', '#2a5ab0', '#f2c12e', '#2a2a2e', '#1a8a3a'];
    for (let i = 0; i < 6; i++) { const j = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(2, 1.1, 4.4), new THREE.MeshStandardMaterial({ color: jc[i], roughness: 0.4, metalness: 0.3 })); body.position.y = 1.1; j.add(body); const cab = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.9, 2.6), new THREE.MeshStandardMaterial({ color: '#203040', roughness: 0.2, metalness: 0.4 })); cab.position.set(0, 2.05, -0.3); j.add(cab);
      const rack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 2.2), new THREE.MeshStandardMaterial({ color: ['#f2c12e', '#2a5ab0', '#d8202a'][i % 3] })); rack.position.set(0, 2.75, -0.3); j.add(rack);
      for (const [wx, wz] of [[-1, 1.4], [1, 1.4], [-1, -1.4], [1, -1.4]]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.4, 12).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#1a1a1e' })); w.position.set(wx, 0.5, wz); j.add(w); }
      j.position.set(hx + (i - 2.5) * 4, y0, hz + 14); j.rotation.y = 0.3 * (rnd() - 0.5); scene.add(j); }
    // volcanes y cordillera lejana (el Tunupa con franjas de colores)
    const vt = canvasTex(64, 256, (x, w, h) => { const C = ['#f4f4f8', '#f4f4f8', '#b0705a', '#c88a4a', '#8a5a6a', '#a8784a', '#7a5a4a', '#9a6a5a']; for (let i = 0; i < 16; i++) { x.fillStyle = C[Math.min(C.length - 1, Math.floor(i / 2))]; x.fillRect(0, i * 16, w, 17); } }, false);
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + rnd() * 0.2, r = 1500 + rnd() * 300, h = 120 + rnd() * 160, c = new THREE.Mesh(new THREE.ConeGeometry(h * 2.2, h, 9, 1, true), new THREE.MeshStandardMaterial({ map: vt, roughness: 1, fog: true })); c.position.set(Math.cos(a) * r, y0 + h / 2 - 6, Math.sin(a) * r); c.rotation.y = rnd() * TAU; scene.add(c); } }
  // pilares de bloques de sal (obstáculos)
  { const sb = new THREE.BoxGeometry(1.1, 0.8, 1.1), m = new THREE.MeshStandardMaterial({ color: '#f4f2ec', roughness: 0.75 }), list = [];
    for (const o of def.obstacles) { const p = A.obsPos(T, o); for (let j = 0; j < 4; j++) for (let q = 0; q < 4 - (j > 2 ? 2 : 0); q++) list.push([p.x + ((q % 2) - 0.5) * 1.15, p.y + 0.4 + j * 0.82, p.z + ((q >> 1) - 0.5) * 1.15, 1, rnd() * 0.2]); }
    const pm = PROPS.inst(scene, sb, m, list, ['#f6f4ee', '#ebe8e0', '#f2efe6'], true); if (pm) pm.userData.noAudit = true; }
};

/* ---------- VOLCÁN DEL TOTUMO ---------- */
SCENERY.totumo = (scene, T, def, K) => {
  const { Geo, canvasTex, anim, V3 } = K, A = ARENA_KIT, rnd = makeRng(67), y0 = T.lakeY - 1.0;
  // el cono de lodo con chorreaduras
  const RB = 40, RT = 8, H = 26, g = new THREE.CylinderGeometry(RT, RB, H, 72, 12, true), P = g.attributes.position, cols = new Float32Array(P.count * 3), cA = new THREE.Color('#7a6654'), cB = new THREE.Color('#5a4a3c'), cC = new THREE.Color('#a8947c'), tmp = new THREE.Color();
  for (let v = 0; v < P.count; v++) { const x = P.getX(v), y = P.getY(v), z = P.getZ(v), a = Math.atan2(z, x), drip = Math.pow(Math.abs(Math.sin(a * 23 + Math.sin(a * 7) * 2)), 6), k = 1 + (fbm2(a * 4, y / 8, 3) - 0.5) * 0.12 + drip * 0.03 * (y / H + 0.5); P.setX(v, x * k); P.setZ(v, z * k);
    tmp.copy(cA).lerp(cB, drip * 0.8).lerp(cC, clamp((fbm2(a * 9, y / 5, 2) - 0.55) * 3, 0, 0.7)); cols[v * 3] = tmp.r; cols[v * 3 + 1] = tmp.g; cols[v * 3 + 2] = tmp.b; }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3)); g.computeVertexNormals(); const cone = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0.05 })); cone.position.y = y0 + H / 2; scene.add(cone);
  for (let k = 0; k < 8; k++) K.occ.occupy(Math.cos(k / 8 * TAU) * 22, Math.sin(k / 8 * TAU) * 22, 24);
  // cráter: lodo brillante que burbujea, con bañistas embarrados
  const mudM = new THREE.MeshStandardMaterial({ color: '#4a3a2e', roughness: 0.22, metalness: 0.1 }), crater = new THREE.Mesh(new THREE.CircleGeometry(RT * 0.95, 32), mudM); crater.rotation.x = -Math.PI / 2; crater.position.y = y0 + H - 0.4; scene.add(crater);
  const heads = []; for (let i = 0; i < 9; i++) { const a = rnd() * TAU, r = rnd() * RT * 0.7, h = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), mudM); h.position.set(Math.cos(a) * r, y0 + H - 0.3, Math.sin(a) * r); scene.add(h); heads.push(h); }
  const bub = []; for (let i = 0; i < 12; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6, 0, TAU, 0, Math.PI / 2), mudM); b.position.set((rnd() - 0.5) * RT, y0 + H - 0.42, (rnd() - 0.5) * RT); scene.add(b); bub.push({ b, ph: rnd() * 5 }); }
  anim.push(t => { heads.forEach((h, i) => { h.position.y = y0 + H - 0.3 + Math.sin(t * 1.3 + i) * 0.08; }); bub.forEach(o => { const k = ((t * 0.7 + o.ph) % 1.6) / 1.6; o.b.scale.setScalar(k < 0.9 ? 0.3 + k : 0.01); }); });
  // escalera de madera hasta el cráter, con barandas
  { const st = new Geo(), wood = new THREE.Color('#8a5a32'), wood2 = new THREE.Color('#6a4226'), dir = V3(1, 0, 0.2).normalize(), side = V3(-dir.z, 0, dir.x), n = 34;
    for (let i = 0; i < n; i++) { const f = i / n, f2 = (i + 1) / n, r = lerp(RB + 1.5, RT - 0.5, f), r2 = lerp(RB + 1.5, RT - 0.5, f2), y = H * f + 0.2, yy = H * f2 + 0.2, c = V3(dir.x * r, y0 + y, dir.z * r), c2 = V3(dir.x * r2, y0 + y, dir.z * r2), wv = 1.1;
      st.face(c.clone().addScaledVector(side, -wv), c.clone().addScaledVector(side, wv), c2.clone().addScaledVector(side, wv), c2.clone().addScaledVector(side, -wv), null, i % 2 ? wood : wood2);
      st.face(c2.clone().addScaledVector(side, -wv), c2.clone().addScaledVector(side, wv), c2.clone().addScaledVector(side, wv).setY(y0 + yy), c2.clone().addScaledVector(side, -wv).setY(y0 + yy), null, wood2);
      for (const e of [-1, 1]) if (i % 3 === 0) { const p0 = c.clone().addScaledVector(side, e * wv); st.face(p0, p0.clone().add(V3(0.08 * dir.x, 0, 0.08 * dir.z)), p0.clone().add(V3(0.08 * dir.x, 1.1, 0.08 * dir.z)), p0.clone().add(V3(0, 1.1, 0)), null, wood2); } }
    for (const e of [-1, 1]) { const a = V3(dir.x * (RB + 1.5), y0 + 1.3, dir.z * (RB + 1.5)).addScaledVector(side, e * 1.1), b = V3(dir.x * (RT - 0.5), y0 + H + 1.3, dir.z * (RT - 0.5)).addScaledVector(side, e * 1.1); st.face(a, b, b.clone().setY(b.y + 0.1), a.clone().setY(a.y + 0.1), null, wood); }
    scene.add(new THREE.Mesh(st.build(), A.mat({ vertexColors: true }))); }
  // charcos de lodo en la pista (frenan): brillantes y con burbujas
  { const pm = new THREE.MeshStandardMaterial({ color: '#3e3024', roughness: 0.18, metalness: 0.1, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), bubs = [];
    for (const m of def.mud) { const s = T.cp(m.at), o = T.at(s), p = T.pos(s, m.u, 0.05, V3()), d = new THREE.Mesh(new THREE.CircleGeometry(m.r || 4, 28), pm); d.position.copy(p); d.lookAt(p.x + o.ux, p.y + o.uy, p.z + o.uz); d.scale.set(1, 1.25, 1); d.userData.noAudit = true; scene.add(d);
      for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6, 0, TAU, 0, Math.PI / 2), pm), q = T.pos(s + (rnd() - 0.5) * m.r, m.u + (rnd() - 0.5) * m.r, 0.05, V3()); b.position.copy(q); b.userData.noAudit = true; scene.add(b); bubs.push({ b, ph: rnd() * 3 }); } }
    anim.push(t => bubs.forEach(o => { const k = ((t * 0.9 + o.ph) % 1.4) / 1.4; o.b.scale.setScalar(k < 0.85 ? 0.3 + k * 1.2 : 0.01); })); }
  // montículos de lodo (obstáculos sólidos)
  { const list = []; for (const o of def.obstacles) { const p = A.obsPos(T, o); list.push([p.x, p.y - 0.2, p.z, 1, rnd() * TAU, 1]); }
    const mm = PROPS.inst(scene, new THREE.ConeGeometry(2.6, 3.4, 12).translate(0, 1.7, 0), new THREE.MeshStandardMaterial({ color: '#6a5444', roughness: 0.6 }), list, ['#6a5444', '#7a6252'], true); if (mm) mm.userData.noAudit = true; }
  // kioscos de colores (fritos, cocos, artesanías) y canoas en la ciénaga
  { const C = ['#e8202a', '#f2c12e', '#1a8a3a', '#2a7bd4', '#f07a1a', '#c02a7a']; let n = 0;
    for (let tries = 0; tries < 200 && n < 8; tries++) { const s = rnd() * T.L, o = T.at(s), sgn = A.outerSign(T), d = T.w[Math.floor(s / T.ds) % T.N] / 2 + 6 + rnd() * 8, x = o.px + o.rx * d * sgn, z = o.pz + o.rz * d * sgn, h = K.terrain.userData.height(x, z); if (h < T.lakeY + 0.5 || !K.occ.free(x, z, 4)) continue; K.occ.occupy(x, z, 4); n++;
      const k = new THREE.Group(), post = A.mat({ color: '#7a5030', side: THREE.FrontSide }); for (const [px, pz] of [[-1.4, -1.1], [1.4, -1.1], [-1.4, 1.1], [1.4, 1.1]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.6, 0.16), post); p.position.set(px, 1.3, pz); k.add(p); }
      const counter = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 0.5), A.mat({ color: C[n % 6], side: THREE.FrontSide })); counter.position.set(0, 0.5, 1.1); k.add(counter);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.4, 4), A.mat({ color: '#c8a868', roughness: 0.95, side: THREE.FrontSide })); roof.rotation.y = Math.PI / 4; roof.position.y = 3.2; k.add(roof);
      const aw = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.9), A.mat({ color: C[(n + 2) % 6] })); aw.position.set(0, 2.3, 1.5); aw.rotation.x = -0.6; k.add(aw);
      k.position.set(x, h, z); k.lookAt(o.px, h, o.pz); scene.add(k); }
    for (let i = 0, tries = 0; i < 7 && tries < 300; tries++) { const a = rnd() * TAU, r = 130 + rnd() * 260, x = Math.cos(a) * r, z = Math.sin(a) * r; if (K.terrain.userData.height(x, z) > T.lakeY - 0.8) continue; i++;
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 5, 10, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(Math.PI), A.mat({ color: C[i % 6], roughness: 0.6 })); c.scale.set(1, 1, 0.8); c.position.set(x, T.lakeY + 0.15, z); c.rotation.y = rnd() * TAU; scene.add(c); } }
};
