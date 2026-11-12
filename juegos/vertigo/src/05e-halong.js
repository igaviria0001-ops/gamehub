/* =========================================================================
   ESCENARIO DE LA BAHÍA DE HA LONG — torres de piedra caliza con selva en
   la cima saliendo del agua esmeralda, un arco de roca sobre la vía, juncos
   con velas rojas de murciélago, aldea flotante y neblina sobre el agua.
   ========================================================================= */
SCENERY.halong = (scene, T, def, K) => {
  const { Geo, canvasTex, glowTex, terrain, anim, V3 } = K, rnd = makeRng(41), L = T.lakeY;
  const cR = new THREE.Color('#9a9a90'), cD = new THREE.Color('#5e6058'), cG = new THREE.Color('#3f7a32'), cG2 = new THREE.Color('#5a9a3a'), tmp = new THREE.Color();
  // ---- torres kársticas unidas en una sola malla ----
  const pos = [], col = [], idx = []; let base = 0;
  function karst(x, z, R, H) {
    const seg = 14, prof = [[R * 1.05, -6], [R, 0], [R * 0.96, H * 0.25], [R * 0.9, H * 0.55], [R * 0.82, H * 0.78], [R * 0.62, H * 0.92], [R * 0.3, H * 0.99], [0, H]], ph = rnd() * 10;
    for (let j = 0; j < prof.length; j++) for (let i = 0; i < seg; i++) {
      const a = i / seg * TAU, n = 1 + (fbm2(Math.cos(a) * 2 + ph, prof[j][1] / 18 + ph, 3) - 0.5) * 0.5, r = prof[j][0] * n, y = prof[j][1];
      pos.push(x + Math.cos(a) * r, L + y, z + Math.sin(a) * r);
      const top = smooth(clamp((y / H - 0.68) / 0.18, 0, 1)), streak = fbm2(a * 6 + ph, y / 25, 2);
      tmp.copy(cR).lerp(cD, clamp((streak - 0.45) * 2, 0, 1)).lerp(rnd() < 0.5 ? cG : cG2, top); if (y < 2) tmp.lerp(cD, 0.6); col.push(tmp.r, tmp.g, tmp.b);
    }
    for (let j = 0; j < prof.length - 1; j++) for (let i = 0; i < seg; i++) { const a = base + j * seg + i, b = base + j * seg + (i + 1) % seg, c = base + (j + 1) * seg + (i + 1) % seg, d = base + (j + 1) * seg + i; idx.push(a, d, c, a, c, b); }
    base += prof.length * seg;
  }
  const placed = [];
  for (let i = 0, tries = 0; i < ([40, 55, 85][GQ.lv]) && tries < 4000; tries++) {
    const a = rnd() * TAU, r = 30 + Math.pow(rnd(), 0.7) * 1300, x = Math.cos(a) * r, z = Math.sin(a) * r - 60, R = 10 + rnd() * 22, H = 28 + rnd() * 70;
    const nt = terrain.userData.nearTrack(x, z); if (nt && nt.d < T.w[nt.q.k] / 2 + 14 + R * 1.2) continue; if (terrain.userData.height(x, z) > L - 0.5) continue;
    if (placed.some(p => Math.hypot(p[0] - x, p[1] - z) < p[2] + R + 6)) continue; placed.push([x, z, R]); K.occ.occupy(x, z, R * 1.2); karst(x, z, R, H); i++;
  }
  { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); scene.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }))); }
  // ---- arco de roca sobre la vía ----
  { const s = T.cp(10.0), o = T.at(s), g = new THREE.TorusGeometry(15, 5.5, 12, 26, Math.PI), P = g.attributes.position, cols = new Float32Array(P.count * 3);
    for (let v = 0; v < P.count; v++) { const x = P.getX(v), y = P.getY(v), zz = P.getZ(v), n = 1 + (fbm2(x / 6, y / 6 + zz / 5, 3) - 0.5) * 0.45; P.setXYZ(v, x * n, y * n, zz * (1 + (n - 1) * 2)); tmp.copy(cR).lerp(cD, clamp(fbm2(x / 4, y / 9, 2) - 0.3, 0, 1)).lerp(cG, smooth(clamp((y - 14) / 6, 0, 1))); cols[v * 3] = tmp.r; cols[v * 3 + 1] = tmp.g; cols[v * 3 + 2] = tmp.b; }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide })); m.position.set(o.px, o.py - 1.5, o.pz); m.lookAt(o.px + o.tx, o.py - 1.5, o.pz + o.tz); m.scale.set(1.5, 1.2, 1); scene.add(m); }
  // ---- juncos con velas de murciélago, navegando en círculos ----
  { const hull = new THREE.Shape(); hull.moveTo(-6, 1.6); hull.quadraticCurveTo(-4, -0.4, 0, -0.6); hull.quadraticCurveTo(4.5, -0.4, 6.5, 2); hull.lineTo(-6, 1.6);
    const hg = new THREE.ExtrudeGeometry(hull, { depth: 3.2, bevelEnabled: false }); hg.translate(0, 0, -1.6); hg.rotateY(Math.PI / 2);
    const sail = new THREE.Shape(); sail.moveTo(0, 0); sail.lineTo(3.6, 0.2); sail.quadraticCurveTo(4.4, 4, 3.4, 9); sail.quadraticCurveTo(1.5, 10, 0, 9.6); sail.closePath();
    const sg = new THREE.ShapeGeometry(sail); const sailTex = canvasTex(64, 128, (x, w, h) => { x.fillStyle = '#c8501e'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(60,20,10,0.6)'; x.lineWidth = 3; for (let i = 8; i < h; i += 14) { x.beginPath(); x.moveTo(0, i); x.lineTo(w, i - 4); x.stroke(); } }, false);
    const hm = new THREE.MeshStandardMaterial({ color: '#5a3820', roughness: 0.8 }), smat = new THREE.MeshStandardMaterial({ map: sailTex, side: THREE.DoubleSide, roughness: 0.9 }), boats = [];
    for (let i = 0; i < 9; i++) { const g = new THREE.Group(); g.add(new THREE.Mesh(hg, hm)); for (const [z0, sc] of [[-3, 0.8], [0, 1.1], [3, 0.75]]) { const s = new THREE.Mesh(sg, smat); s.position.set(-1.6 * sc, 1.6, z0); s.scale.setScalar(sc); s.rotation.y = Math.PI / 2 + 0.25; g.add(s); } scene.add(g);
      let cx = 0, cz = 0, rr = 0, ok = false; for (let k = 0; k < 40 && !ok; k++) { const a = rnd() * TAU, r = 120 + rnd() * 700; cx = Math.cos(a) * r; cz = Math.sin(a) * r - 60; rr = 40 + rnd() * 60; ok = terrain.userData.height(cx, cz) < L - 2; const nt = terrain.userData.nearTrack(cx, cz); if (nt && nt.d < rr + 40) ok = false; }
      boats.push({ g, cx, cz, rr, ph: rnd() * TAU, sp: (0.02 + rnd() * 0.03) * (rnd() < 0.5 ? 1 : -1) }); }
    anim.push(t => boats.forEach(b => { const a = b.ph + t * b.sp; b.g.position.set(b.cx + Math.cos(a) * b.rr, L + Math.sin(t * 1.1 + b.ph) * 0.15, b.cz + Math.sin(a) * b.rr); b.g.rotation.set(Math.sin(t * 0.9 + b.ph) * 0.03, -a + (b.sp > 0 ? 0 : Math.PI), 0); })); }
  // ---- aldea flotante junto a la salida ----
  { const g = new Geo(), C = ['#e8c23a', '#3a8ad8', '#e85a3a', '#4ab86a', '#f2f2e8'], plank = new THREE.Color('#8a6a48');
    for (let k = 0; k < 14; k++) { const s = T.wrap(-80 + k * 18), o = T.at(s), sg = k % 2 ? 1 : -1, u = (o.w / 2 + 14 + rnd() * 6) * sg, cx = o.px + o.rx * u, cz = o.pz + o.rz * u, w = 5, d = 4, h = 3, c = new THREE.Color(C[k % C.length]);
      const P = (a, b, y) => V3(cx + a, L + y, cz + b);
      g.face(P(-w, d, 0.3), P(w, d, 0.3), P(w, -d, 0.3), P(-w, -d, 0.3), [0, 0, 1, 1], plank); // plataforma
      for (const [a0, b0, a1, b1] of [[-3, 2.5, 3, 2.5], [3, -2.5, -3, -2.5], [3, 2.5, 3, -2.5], [-3, -2.5, -3, 2.5]]) g.face(P(a0, b0, 0.3), P(a1, b1, 0.3), P(a1, b1, h), P(a0, b0, h), [0, 0, 1, 1], c);
      g.face(P(-3.6, 3, h), P(3.6, 3, h), P(3.6, 0, h + 1.6), P(-3.6, 0, h + 1.6), [0, 0, 1, 1], new THREE.Color('#2a6a8a')); g.face(P(3.6, -3, h), P(-3.6, -3, h), P(-3.6, 0, h + 1.6), P(3.6, 0, h + 1.6), [0, 0, 1, 1], new THREE.Color('#2a6a8a')); }
    scene.add(new THREE.Mesh(g.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide }))); }
  // ---- neblina baja sobre el agua ----
  { const mist = canvasTex(128, 64, (x, w, h) => { const g = x.createRadialGradient(64, 32, 2, 64, 32, 60); g.addColorStop(0, 'rgba(240,248,248,0.55)'); g.addColorStop(1, 'rgba(240,248,248,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, false), mm = new THREE.SpriteMaterial({ map: mist, transparent: true, depthWrite: false, opacity: 0.7 });
    for (let i = 0; i < 14; i++) { const a = rnd() * TAU, r = 260 + rnd() * 900, sp = new THREE.Sprite(mm); sp.position.set(Math.cos(a) * r, L + 12 + rnd() * 10, Math.sin(a) * r - 60); sp.scale.set(260, 60, 1); scene.add(sp); } }
};
