/* =========================================================================
   ESCENARIO DEL AMAZONAS — túnel de selva con árboles gigantes que se
   cierran sobre el camino de tierra roja y lianas colgando, meseta con el
   río que cae en una cascada enorme (el salto con el ala), río café con
   corriente, delfines rosados que saltan, victorias regias, palafitos con
   techos de palma, canoas y guacamayas de colores volando en círculos.
   ========================================================================= */
SCENERY.amazonas = (scene, T, def, K) => {
  const { Geo, canvasTex, glowTex, terrain, anim, V3 } = K, rnd = makeRng(89), L = T.lakeY, H = (x, z) => terrain.userData.height(x, z);
  const nearD = (x, z) => terrain.userData.clearAll(x, z);
  const town = T.zones.find(z => z.type === 'town');
  // ---- túnel de selva: árboles gigantes con copas que se tocan sobre el camino ----
  { const trunks = [], crowns = [], vines = [], ferns = [];
    for (let s = town.s0 - 30; s < town.s1 + 30; s += 9) for (const sg of [-1, 1]) {
      const sc0 = 2.2 + rnd() * 1.4, o = T.at(T.wrap(s)), d = T.limits(T.wrap(s)).wall + 1.0 + 2.2 * 0.75 * sc0 * 0.55 + rnd() * 3, x = o.px + o.rx * d * sg, z = o.pz + o.rz * d * sg, h = H(x, z); if (!K.occ.free(x, z, 1.8)) continue; K.occ.occupy(x, z, 2.2);
      const sc = sc0, cy = 6.5 + sc * 1.7; trunks.push([x, h - 0.3, z, sc * 0.55, rnd() * TAU, (cy + 1.5) / (10 * sc * 0.55)]); crowns.push([x - o.rx * sg * 3.5, h + cy, z - o.rz * sg * 3.5, sc * 1.45, rnd() * TAU, 0.62]);
      for (let k = 0; k < 2; k++) ferns.push([x + (rnd() - 0.5) * 4, h, z + (rnd() - 0.5) * 4, 1 + rnd() * 0.8, rnd() * TAU, 1]);
      if (rnd() < 0.7) { const f = rnd() * 0.8, vx = lerp(x, o.px, f), vz = lerp(z, o.pz, f), top = h + cy - 1, bot = o.py + 4.8 + rnd() * 3; if (top > bot) vines.push([vx, top, vz, 1, 0, top - bot]); } }
    const trunkG = new THREE.CylinderGeometry(0.55, 1.2, 10, 9).translate(0, 5, 0), rootG = new THREE.ConeGeometry(2.2, 2.4, 6).translate(0, 1.2, 0);
    PROPS.inst(scene, trunkG, new THREE.MeshStandardMaterial({ roughness: 0.95 }), trunks, ['#4a3a2c', '#3e3226', '#56442f'], true);
    PROPS.inst(scene, rootG, new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true }), trunks.map(p => [p[0], p[1], p[2], p[3] * 0.75, p[4], 1]), ['#5a4634'], false);
    PROPS.inst(scene, PROPS.treeGeo('broad', GQ.lv < 2), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }), crowns, ['#2e6a26', '#3a7a2c', '#24581e', '#4a8a30'], true);
    PROPS.inst(scene, new THREE.CylinderGeometry(0.06, 0.06, 1, 4).translate(0, -0.5, 0), new THREE.MeshStandardMaterial({ color: '#4a6a2a', roughness: 0.9 }), vines, ['#4a6a2a', '#5a7a30'], false);
    PROPS.inst(scene, PROPS.treeGeo('bush', true), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }), ferns, ['#3a8a30', '#2e7a28', '#5aa83a'], false); }
  // ---- dosel de la selva: lomas de copas que cubren todo el terreno (bajo costo: icosaedros suaves) ----
  { const g = new THREE.IcosahedronGeometry(1, 0), P = g.attributes.position, N = new Float32Array(P.count * 3); for (let v = 0; v < P.count; v++) { const n = V3(P.getX(v), P.getY(v), P.getZ(v)).normalize(); N.set([n.x, n.y, n.z], v * 3); } g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    const list = [], step = [36, 30, 18][GQ.lv];
    for (let x = -900; x <= 900; x += step) for (let z = -900; z <= 900; z += step) { const px = x + (rnd() - 0.5) * step, pz = z + (rnd() - 0.5) * step, h = H(px, pz), s2 = step * (0.55 + rnd() * 0.3); if (h < L + 1.2 || nearD(px, pz) < s2 + 7 || !K.occ.free(px, pz, 6)) continue; list.push([px, h + s2 * 0.25, pz, s2, rnd() * TAU, 0.5 + rnd() * 0.25]); }
    PROPS.inst(scene, g, new THREE.MeshStandardMaterial({ roughness: 0.9 }), list, ['#245a1e', '#2e6a24', '#1e4e1a', '#3a7a2a', '#2a6420'], false); }
  // ---- la cascada: un risco frente al vuelo con el río que cae a la laguna ----
  { const s = T.cp(12.5), o = T.at(s); let sg = 1, best = 1e9; for (const q of [-1, 1]) { const hh = H(o.px + o.rx * 75 * q, o.pz + o.rz * 75 * q); if (hh < best) { best = hh; sg = q; } }
    const d = 78, x = o.px + o.rx * d * sg, z = o.pz + o.rz * d * sg, Hh = 34, Wd = 30, top = L + Hh;
    const wt = canvasTex(128, 256, (cx, w, h) => { cx.fillStyle = '#d8e4dc'; cx.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { cx.fillStyle = `rgba(255,255,255,${0.35 + Math.random() * 0.6})`; cx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 14 + Math.random() * 40); } for (let i = 0; i < 120; i++) { cx.fillStyle = 'rgba(150,130,90,0.3)'; cx.fillRect(Math.random() * w, Math.random() * h, 2, 20); } });
    wt.repeat.set(3, 2); const fm = new THREE.MeshStandardMaterial({ map: wt, transparent: true, opacity: 0.95, roughness: 0.3, emissive: '#2a3a30', emissiveIntensity: 0.4, side: THREE.DoubleSide });
    const g = new THREE.Group(); g.position.set(x, L, z); g.lookAt(o.px, L, o.pz); scene.add(g); // +z mira hacia la pista
    const cl = new THREE.Mesh(new THREE.BoxGeometry(Wd + 70, Hh + 2, 40), new THREE.MeshStandardMaterial({ color: '#5a5040', roughness: 0.95 })); cl.position.set(0, Hh / 2 - 1, -22); g.add(cl);
    const moss = new THREE.Mesh(new THREE.BoxGeometry(Wd + 72, 3, 42), new THREE.MeshStandardMaterial({ color: '#2e6a26', roughness: 1 })); moss.position.set(0, Hh + 1, -22); g.add(moss);
    const fall = new THREE.Mesh(new THREE.PlaneGeometry(Wd, Hh + 2, 1, 10), fm), P = fall.geometry.attributes.position; for (let v = 0; v < P.count; v++) { const y = P.getY(v), f = (Hh / 2 + 1 - y) / (Hh + 2); P.setZ(v, Math.pow(f, 2) * 9); } fall.geometry.computeVertexNormals(); fall.position.set(0, Hh / 2, -1.6); g.add(fall);
    const riv = new THREE.Mesh(new THREE.PlaneGeometry(Wd, 40), new THREE.MeshStandardMaterial({ color: '#7a6a44', roughness: 0.15, metalness: 0.2 })); riv.rotation.x = -Math.PI / 2; riv.position.set(0, Hh + 2.6, -21); g.add(riv);
    const mist = []; for (let i = 0; i < 6; i++) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#f2f8f4', transparent: true, depthWrite: false, opacity: 0.45 })); g.add(m); mist.push({ m, ph: i / 6 }); }
    anim.push(t => { wt.offset.y = (t * 1.3) % 1; for (const q of mist) { const k = (t * 0.12 + q.ph) % 1; q.m.position.set((q.ph - 0.5) * Wd, 2 + k * 18, 6 + k * 8); q.m.scale.setScalar(18 + k * 30); q.m.material.opacity = 0.5 * Math.sin(k * Math.PI); } });
    K.occ.occupy(x, z, 40); }
  // ---- río: victorias regias y delfines rosados que saltan ----
  const wz = T.zones.find(z => z.type === 'water');
  { const lily = canvasTex(128, 128, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = '#3a7a2a'; x.beginPath(); x.arc(64, 64, 60, 0.15, TAU - 0.15); x.lineTo(64, 64); x.fill(); x.strokeStyle = '#a84a3a'; x.lineWidth = 6; x.beginPath(); x.arc(64, 64, 58, 0.15, TAU - 0.15); x.stroke(); x.strokeStyle = 'rgba(20,60,20,0.6)'; x.lineWidth = 2; for (let a = 0; a < 12; a++) { x.beginPath(); x.moveTo(64, 64); x.lineTo(64 + Math.cos(a / 12 * TAU + 0.3) * 56, 64 + Math.sin(a / 12 * TAU + 0.3) * 56); x.stroke(); } }, false);
    const lm = new THREE.MeshStandardMaterial({ map: lily, transparent: true, alphaTest: 0.5, roughness: 0.6, side: THREE.DoubleSide }), lg = new THREE.CircleGeometry(1, 16).rotateX(-Math.PI / 2), list = [];
    for (let i = 0, tries = 0; i < 70 && tries < 1500; tries++) { const s = wz.s0 + rnd() * T.wrap(wz.s1 - wz.s0), o = T.at(s), sg = rnd() < 0.5 ? -1 : 1, d = T.w[Math.floor(s / T.ds) % T.N] / 2 + 4 + rnd() * 30, x = o.px + o.rx * d * sg, z = o.pz + o.rz * d * sg; if (H(x, z) > L - 0.5) continue; list.push([x, L + 0.08, z, 0.8 + rnd() * 1.4, rnd() * TAU, 1]); i++; }
    PROPS.inst(scene, lg, lm, list, ['#ffffff', '#e8ffe0'], false);
    const pink = new THREE.MeshStandardMaterial({ color: '#f4a0b8', roughness: 0.35 }), dolph = [];
    for (let i = 0; i < 5; i++) { const g = new THREE.Group(), body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), pink); body.scale.set(0.8, 0.7, 2.6); g.add(body); const fin = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 4), pink); fin.position.set(0, 0.45, -0.2); g.add(fin); const tail = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.4), pink); tail.position.set(0, 0, -1.4); g.add(tail); scene.add(g);
      const s = wz.s0 + (i + 0.5) / 5 * T.wrap(wz.s1 - wz.s0), o = T.at(s), sg = i % 2 ? 1 : -1, d = T.w[0] / 2 + 8 + rnd() * 10; dolph.push({ g, x: o.px + o.rx * d * sg, z: o.pz + o.rz * d * sg, dx: o.tx, dz: o.tz, ph: rnd() * 6 }); }
    anim.push(t => dolph.forEach(q => { const k = ((t * 0.32 + q.ph) % 2.2) / 1.2; if (k > 1) { q.g.visible = false; return; } q.g.visible = true; const y = L - 0.6 + Math.sin(k * Math.PI) * 2.6; q.g.position.set(q.x + q.dx * (k - 0.5) * 7, y, q.z + q.dz * (k - 0.5) * 7); q.g.lookAt(q.x + q.dx * 20, y + Math.cos(k * Math.PI) * 6, q.z + q.dz * 20); })); }
  // ---- palafitos: casas de madera sobre pilotes con techo de palma, y canoas ----
  { const wood = new THREE.MeshStandardMaterial({ color: '#8a5a34', roughness: 0.9 }), thatch = canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#b8944a'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(110,80,30,0.6)'; x.lineWidth = 2; for (let i = 0; i < 160; i++) { const px = Math.random() * w; x.beginPath(); x.moveTo(px, Math.random() * h); x.lineTo(px + (Math.random() - 0.5) * 6, Math.random() * h); x.stroke(); } }), tm = new THREE.MeshStandardMaterial({ map: thatch, roughness: 1 });
    const C = ['#2a8ad4', '#e8a020', '#d83a3a', '#2aa860', '#f2f2ea']; let n = 0;
    for (let tries = 0; tries < 400 && n < 12; tries++) { const s = T.cp(18.4 + rnd() * 3.2), o = T.at(s), sg = rnd() < 0.5 ? -1 : 1, d = T.limits(s).wall + 8 + rnd() * 40, x = o.px + o.rx * d * sg, z = o.pz + o.rz * d * sg; if (!K.occ.free(x, z, 6)) continue; K.occ.occupy(x, z, 6); n++;
      const g = new THREE.Group(), gy = Math.max(H(x, z), L - 1), fy = Math.max(gy, L) + 2.6; for (const [px, pz] of [[-2.6, -2], [2.6, -2], [-2.6, 2], [2.6, 2], [0, -2], [0, 2]]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, fy - gy + 0.6, 6), wood); p.position.set(px, (gy + fy) / 2 - 0.3, pz); g.add(p); }
      const fl = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.3, 5.2), wood); fl.position.y = fy; g.add(fl); const wall = new THREE.Mesh(new THREE.BoxGeometry(5.4, 2.4, 4.2), new THREE.MeshStandardMaterial({ color: C[n % C.length], roughness: 0.8 })); wall.position.y = fy + 1.35; g.add(wall);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(4.8, 2.8, 4), tm); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.85); roof.position.y = fy + 3.9; g.add(roof);
      g.position.set(x, 0, z); g.rotation.y = Math.atan2(o.tx, o.tz); scene.add(g); }
    for (let i = 0, tries = 0; i < 8 && tries < 400; tries++) { const s = wz.s0 + rnd() * T.wrap(wz.s1 - wz.s0), o = T.at(s), sg = rnd() < 0.5 ? -1 : 1, d = T.w[0] / 2 + 14 + rnd() * 30, x = o.px + o.rx * d * sg, z = o.pz + o.rz * d * sg; if (H(x, z) > L - 0.8) continue; i++;
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 5.5, 10, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateX(Math.PI), new THREE.MeshStandardMaterial({ color: '#7a4a28', roughness: 0.8, side: THREE.DoubleSide })); c.position.set(x, L + 0.12, z); c.rotation.y = Math.atan2(o.tx, o.tz) + Math.PI / 2; scene.add(c); } }
  // ---- guacamayas que vuelan en círculos sobre la selva ----
  { const birds = [], COL = [['#e8202a', '#2a6ad4'], ['#2a7ad8', '#f2c12e'], ['#e8202a', '#f2c12e'], ['#1aa860', '#e8202a']];
    for (let i = 0; i < 14; i++) { const [c1, c2] = COL[i % COL.length], g = new THREE.Group(), body = new THREE.Mesh(new THREE.ConeGeometry(0.28, 1.6, 6).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: c1, roughness: 0.6 })); g.add(body);
      const wl = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.5).translate(-0.75, 0, 0), new THREE.MeshStandardMaterial({ color: c2, side: THREE.DoubleSide })), wr = wl.clone(); wr.scale.x = -1; g.add(wl); g.add(wr); scene.add(g);
      const s = rnd() * T.L, o = T.at(s), cx = o.px + (rnd() - 0.5) * 120, cz = o.pz + (rnd() - 0.5) * 120; birds.push({ g, wl, wr, cx, cz, r: 18 + rnd() * 30, y: 22 + rnd() * 18, sp: (0.25 + rnd() * 0.25) * (rnd() < 0.5 ? 1 : -1), ph: rnd() * TAU }); }
    anim.push(t => birds.forEach(b => { const a = t * b.sp + b.ph, x = b.cx + Math.cos(a) * b.r, z = b.cz + Math.sin(a) * b.r; b.g.position.set(x, b.y + Math.sin(t * 0.7 + b.ph) * 2, z); b.g.lookAt(b.cx + Math.cos(a + 0.1 * Math.sign(b.sp)) * b.r, b.y, b.cz + Math.sin(a + 0.1 * Math.sign(b.sp)) * b.r); const f = Math.sin(t * 9 + b.ph) * 0.7; b.wl.rotation.z = f; b.wr.rotation.z = -f; })); }
};
