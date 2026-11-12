/* =========================================================================
   ESCENARIO DE EGIPTO — las pirámides de Guiza (con piedra en hiladas y la
   punta de oro), la Esfinge, el templo de Karnak como calle (columnas
   gigantes de papiro con dinteles, pilono con dintel sobre la vía, obelisco
   y avenida de carneros), el Nilo con faluchos de vela triangular, papiro y
   palmeras, camellos, y tormentas de arena que van y vienen.
   ========================================================================= */
SCENERY.egipto = (scene, T, def, K) => {
  const { Geo, canvasTex, glowTex, terrain, anim, V3 } = K, rnd = makeRng(113), L = T.lakeY, H = (x, z) => terrain.userData.height(x, z);
  const nearD = (x, z) => terrain.userData.clearAll(x, z);
  const stoneT = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#d8b880'; x.fillRect(0, 0, w, h); for (let k = 0; k < 2000; k++) { const v = Math.random(); x.fillStyle = `rgba(${180 + v * 60},${150 + v * 50},${100 + v * 40},0.4)`; x.fillRect(Math.random() * w, Math.random() * h, 3, 2); } x.strokeStyle = 'rgba(120,90,50,0.55)'; x.lineWidth = 2; for (let y = 0; y < h; y += 16) { x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); for (let c = (y / 16) % 2 * 20; c < w; c += 40) { x.beginPath(); x.moveTo(c, y); x.lineTo(c, y + 16); x.stroke(); } } });
  // ---- pirámides de Guiza (hiladas de piedra, punta dorada en la mayor) y la Esfinge ----
  { const pm = new THREE.MeshStandardMaterial({ map: stoneT, roughness: 0.9, flatShading: true });
    def.pyramids.forEach(([x, z, h], i) => { const y = H(x, z) - 1, b = h * 0.78, g = new THREE.ConeGeometry(b * Math.SQRT2, h, 4, 1); g.rotateY(Math.PI / 4); const uv = g.attributes.uv; for (let v = 0; v < uv.count; v++) uv.setXY(v, uv.getX(v) * b / 6, uv.getY(v) * h / 6);
      const m = new THREE.Mesh(g, pm); m.position.set(x, y + h / 2, z); m.rotation.y = 0.12; scene.add(m); K.occ.occupy(x, z, b * 1.1);
      if (i === 0) { const cap = new THREE.Mesh(new THREE.ConeGeometry(4.2, 5.2, 4), new THREE.MeshStandardMaterial({ color: '#ffd23d', metalness: 0.9, roughness: 0.25, emissive: '#5a3a00', emissiveIntensity: 0.4 })); cap.rotation.y = Math.PI / 4 + 0.12; cap.position.set(x, y + h - 2.4, z); scene.add(cap); } });
    const [sx, sz] = def.sphinx, sy = H(sx, sz), sp = new THREE.Group(), sm = new THREE.MeshStandardMaterial({ color: '#cfa868', roughness: 0.92, flatShading: true });
    const body = new THREE.Mesh(new THREE.BoxGeometry(9, 7, 30), sm); body.position.set(0, 3.5, -4); sp.add(body); const chest = new THREE.Mesh(new THREE.BoxGeometry(9.5, 10, 7), sm); chest.position.set(0, 5, 10); sp.add(chest);
    const head = new THREE.Mesh(new THREE.BoxGeometry(5.5, 6.5, 5.5), sm); head.position.set(0, 13, 11.5); sp.add(head); const cloth = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 4.6, 7, 4), new THREE.MeshStandardMaterial({ color: '#c49a5a', flatShading: true })); cloth.rotation.y = Math.PI / 4; cloth.position.set(0, 12.2, 10.4); sp.add(cloth);
    for (const ex of [-3, 3]) { const paw = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 12), sm); paw.position.set(ex, 1.2, 18); sp.add(paw); }
    sp.position.set(sx, sy - 0.4, sz); sp.rotation.y = Math.atan2(-sx, -sz) + 0.4; scene.add(sp); K.occ.occupy(sx, sz, 22); }
  // ---- Karnak: columnas gigantes con capitel de papiro y dinteles a lado y lado de la calle ----
  { const town = T.zones.find(z => z.type === 'town'), colT = canvasTex(128, 256, (x, w, h) => { x.drawImage(stoneT.image, 0, 0, w, h); x.fillStyle = 'rgba(80,60,40,0.55)'; for (let i = 0; i < 14; i++) { const y = 30 + i * 15, cx = 20 + (i * 37) % 90; x.fillRect(cx, y, 6, 10); x.beginPath(); x.arc(cx + 18, y + 5, 4, 0, TAU); x.fill(); x.fillRect(cx + 30, y + 2, 12, 3); } x.fillStyle = '#2a6aa8'; x.fillRect(0, 10, w, 6); x.fillStyle = '#c8402a'; x.fillRect(0, 18, w, 4); }, true);
    const colG = new THREE.CylinderGeometry(1.5, 1.7, 13, 14).translate(0, 6.5, 0), capG = new THREE.CylinderGeometry(2.6, 1.5, 2.4, 14).translate(0, 14.2, 0), cm = new THREE.MeshStandardMaterial({ map: colT, roughness: 0.85 }), capM = new THREE.MeshStandardMaterial({ color: '#c8a860', roughness: 0.8 }), cols = [], beams = new Geo(), bc = new THREE.Color('#d0b078');
    for (let s = town.s0 + 6; s < town.s1 - 4; s += 9) for (const sg of [-1, 1]) for (let r = 0; r < 2; r++) { const o = T.at(s), d = T.limits(s).wall + 3 + r * 8, x = o.px + o.rx * d * sg, z = o.pz + o.rz * d * sg, y = H(x, z); if (!K.occ.free(x, z, 1.8)) continue; K.occ.occupy(x, z, 2.4); cols.push([x, y - 0.2, z, 1, 0, 1]);
      if (r === 0) { const o2 = T.at(s + 9), x2 = o2.px + o2.rx * d * sg, z2 = o2.pz + o2.rz * d * sg, yy = y + 15.4; beams.face(V3(x, yy, z), V3(x2, yy, z2), V3(x2, yy + 1.6, z2), V3(x, yy + 1.6, z), null, bc); beams.face(V3(x, yy + 1.6, z), V3(x2, yy + 1.6, z2), V3(x2 + o.rx * sg * 2, yy + 1.6, z2 + o.rz * sg * 2), V3(x + o.rx * sg * 2, yy + 1.6, z + o.rz * sg * 2), null, bc); } }
    PROPS.inst(scene, colG, cm, cols, ['#ffffff', '#f2e8d8'], true); PROPS.inst(scene, capG, capM, cols, ['#d8b878', '#c8a860'], true);
    scene.add(new THREE.Mesh(beams.build(), new THREE.MeshStandardMaterial({ map: stoneT, roughness: 0.9, side: THREE.DoubleSide })));
    // pilono de entrada con dintel sobre la vía (alto: los bólidos pasan por debajo)
    const s0 = town.s0, o = T.at(s0), w = T.limits(s0).wall + 1, pyl = new THREE.MeshStandardMaterial({ map: stoneT, roughness: 0.9 });
    for (const sg of [-1, 1]) { const tw = new THREE.Mesh(new THREE.BoxGeometry(14, 24, 6), pyl); const x = o.px + o.rx * (w + 8) * sg, z = o.pz + o.rz * (w + 8) * sg; tw.position.set(x, H(x, z) + 12, z); tw.lookAt(x + o.tx, H(x, z) + 12, z + o.tz); tw.rotateY(Math.PI / 2); scene.add(tw); K.occ.occupy(x, z, 8); }
    const lin = new THREE.Mesh(new THREE.BoxGeometry(w * 2 + 4, 3.2, 4), pyl); lin.position.set(o.px, o.py + 17, o.pz); lin.lookAt(o.px + o.tx, o.py + 17, o.pz + o.tz); lin.rotateY(Math.PI / 2); scene.add(lin);
    const ob = T.at(T.wrap(s0 - 30)), wo = T.limits(T.wrap(s0 - 30)).wall + 4, ox = ob.px + ob.rx * wo, oz = ob.pz + ob.rz * wo, obel = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.6, 22, 4), new THREE.MeshStandardMaterial({ color: '#c89a6a', roughness: 0.7, flatShading: true })); obel.rotation.y = Math.PI / 4; obel.position.set(ox, H(ox, oz) + 11, oz); scene.add(obel); const tip = new THREE.Mesh(new THREE.ConeGeometry(1.25, 2.2, 4), new THREE.MeshStandardMaterial({ color: '#ffd23d', metalness: 0.9, roughness: 0.25 })); tip.rotation.y = Math.PI / 4; tip.position.set(ox, H(ox, oz) + 23.1, oz); scene.add(tip); K.occ.occupy(ox, oz, 3);
    // avenida de carneros antes del pilono
    const rams = []; for (let s = s0 - 120; s < s0 - 10; s += 7) for (const sg of [-1, 1]) { const q = T.at(T.wrap(s)), d = T.limits(T.wrap(s)).wall + 2.2, x = q.px + q.rx * d * sg, z = q.pz + q.rz * d * sg; if (!K.occ.free(x, z, 1.4)) continue; K.occ.occupy(x, z, 1.6); rams.push([x, H(x, z), z, 1, Math.atan2(-q.rx * sg, -q.rz * sg), 1]); }
    const ramG = new THREE.BoxGeometry(1.4, 1.4, 3).translate(0, 1.6, 0), base = new THREE.BoxGeometry(1.8, 0.9, 3.6).translate(0, 0.45, 0), headG = new THREE.BoxGeometry(1, 1.1, 1.2).translate(0, 2.6, 1.4);
    for (const gg of [ramG, base, headG]) PROPS.inst(scene, gg, new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), rams, ['#cfae74', '#c4a068'], true); }
  // ---- el Nilo: papiro y palmeras en las orillas, faluchos navegando ----
  { const wz = T.zones.find(z => z.type === 'water'), reeds = [], palms = [];
    for (let s = wz.s0 - 40; s < wz.s1 + 40; s += 4) for (const sg of [-1, 1]) { const o = T.at(T.wrap(s)), d = Math.max(T.w[Math.floor(T.wrap(s) / T.ds) % T.N] / 2 + 6, T.zone(T.wrap(s), 'water') ? 0 : T.limits(T.wrap(s)).wall + 1.5) + rnd() * 12, x = o.px + o.rx * d * sg, z = o.pz + o.rz * d * sg; const h = H(x, z); if (h > L + 2.5) continue; reeds.push([x, Math.max(h, L - 0.4), z, 0.8 + rnd() * 0.6, rnd() * TAU, 1]); }
    const reedG = new THREE.CylinderGeometry(0.04, 0.05, 2.6, 4).translate(0, 1.3, 0), umb = new THREE.ConeGeometry(0.6, 0.6, 7).rotateX(Math.PI).translate(0, 2.8, 0);
    for (let k = 0; k < 3; k++) { const off = reeds.map(p => [p[0] + Math.cos(k * 2.1 + p[4]) * 0.5, p[1], p[2] + Math.sin(k * 2.1 + p[4]) * 0.5, p[3] * (0.8 + k * 0.15), p[4] + k, 1]); PROPS.inst(scene, reedG, new THREE.MeshStandardMaterial({ color: '#4a8a3a' }), off, ['#4a8a3a', '#5a9a40'], false); PROPS.inst(scene, umb, new THREE.MeshStandardMaterial({ color: '#7ab04a', roughness: 0.8 }), off, ['#7ab04a', '#8ac050'], false); }
    // faluchos
    const fl = []; for (let i = 0; i < 6; i++) { const s = wz.s0 + (i + 0.5) / 6 * T.wrap(wz.s1 - wz.s0), o = T.at(s), sg = i % 2 ? 1 : -1, d = T.w[0] / 2 + 12 + rnd() * 25, x = o.px + o.rx * d * sg, z = o.pz + o.rz * d * sg; if (H(x, z) > L - 0.6) continue;
      const b = new THREE.Group(), hull = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 7, 10, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#f2efe6', side: THREE.DoubleSide })); hull.rotation.x = Math.PI; hull.position.y = 0.5; b.add(hull);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 8, 6), new THREE.MeshStandardMaterial({ color: '#7a5a3a' })); mast.position.y = 4.4; b.add(mast);
      const sail = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([V3(0, 1.5, 2.5), V3(0, 11, -3.5), V3(0, 1.5, -3.2)]), new THREE.MeshStandardMaterial({ color: '#fbf8f0', side: THREE.DoubleSide })); sail.geometry.computeVertexNormals(); b.add(sail);
      b.position.set(x, L, z); b.rotation.y = Math.atan2(o.tx, o.tz); scene.add(b); fl.push({ b, ph: rnd() * 6, o, x, z }); }
    anim.push(t => fl.forEach(q => { const k = Math.sin(t * 0.05 + q.ph) * 14; q.b.position.set(q.x + q.o.tx * k, L + Math.sin(t * 1.3 + q.ph) * 0.12, q.z + q.o.tz * k); q.b.rotation.z = Math.sin(t + q.ph) * 0.05; })); }
  // ---- camellos con sus jinetes cerca de las pirámides ----
  { const cm = new THREE.MeshStandardMaterial({ color: '#b88a50', roughness: 0.9, flatShading: true }), camels = [];
    for (let i = 0; i < 6; i++) { const [px, pz] = def.pyramids[0], a = -1.2 + i * 0.18, x = px + Math.cos(a) * 95, z = pz + Math.sin(a) * 95; if (nearD(x, z) < 6) continue; const y = H(x, z), c = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 2.8), cm); body.position.y = 2.4; c.add(body); const hump = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6), cm); hump.position.set(0, 3.1, 0); c.add(hump);
      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.6, 0.4), cm); neck.position.set(0, 3.1, 1.6); neck.rotation.x = 0.5; c.add(neck); const hd = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 1), cm); hd.position.set(0, 3.9, 2.1); c.add(hd);
      for (const [lx, lz] of [[-0.4, 1], [0.4, 1], [-0.4, -1], [0.4, -1]]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.9, 0.25), cm); leg.position.set(lx, 0.95, lz); c.add(leg); }
      const rider = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1, 0.4), new THREE.MeshStandardMaterial({ color: ['#2a5ab0', '#f2f2ea', '#c8202a'][i % 3] })); rider.position.set(0, 3.9, -0.6); c.add(rider);
      c.position.set(x, y, z); c.rotation.y = a + Math.PI / 2; scene.add(c); camels.push({ c, a, x0: px, z0: pz, ph: i }); }
    anim.push(t => camels.forEach(q => { const a = q.a + t * 0.004; q.c.position.x = q.x0 + Math.cos(a) * 95; q.c.position.z = q.z0 + Math.sin(a) * 95; q.c.rotation.y = -a; q.c.position.y = H(q.c.position.x, q.c.position.z) + Math.abs(Math.sin(t * 3 + q.ph)) * 0.12; })); }
  // ---- tormenta de arena: cada tanto el aire se pone naranja y se ve poco ----
  { const f = scene.fog, n0 = f.near, f0 = f.far, c0 = f.color.clone(), cS = new THREE.Color('#d8a060');
    anim.push(t => { const k = (t % 70), a = GFX.stormK != null ? GFX.stormK : smooth(clamp((k - 40) / 5, 0, 1)) * (1 - smooth(clamp((k - 55) / 5, 0, 1))); f.near = lerp(n0, 30, a); f.far = lerp(f0, 260, a); f.color.copy(c0).lerp(cS, a * 0.8); }); }
};
