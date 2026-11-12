/* =========================================================================
   ESCENARIO DE SANTORINI — pueblo blanco en lo alto de la caldera (casas
   cúbicas encaladas con puertas y postigos azules, terrazas, iglesias de
   cúpula azul con campanario), casas colgadas del acantilado de capas de
   colores, molinos de viento con aspas que giran, buganvillas, veleros y
   un crucero en la caldera, y el islote volcánico negro.
   ========================================================================= */
SCENERY.santorini = (scene, T, def, K) => {
  const { Geo, canvasTex, terrain, anim, V3 } = K, rnd = makeRng(97), L = T.lakeY, H = (x, z) => terrain.userData.height(x, z);
  const nearD = (x, z) => terrain.userData.clearAll(x, z);
  const g = new Geo(), WH = ['#f8f6f0', '#fbfaf6', '#f4efe4', '#f6ecd8', '#f8e4dc'].map(c => new THREE.Color(c)), BL = new THREE.Color('#1a5ab8'), BL2 = new THREE.Color('#2a7ad8'), PINK = new THREE.Color('#e8408a'), DK = new THREE.Color('#2a2a30');
  // caja orientada: centro (x,z), ancho a lo largo de (fx,fz)=frente, profundidad, alto
  function box(x, y, z, fx, fz, w, d, h, col) { const rx = fz, rz = -fx, P = (a, b, yy) => V3(x + rx * a + fx * b, y + yy, z + rz * a + fz * b), hw = w / 2, hd = d / 2;
    g.face(P(-hw, hd, 0), P(hw, hd, 0), P(hw, hd, h), P(-hw, hd, h), null, col); g.face(P(hw, -hd, 0), P(-hw, -hd, 0), P(-hw, -hd, h), P(hw, -hd, h), null, col);
    g.face(P(hw, hd, 0), P(hw, -hd, 0), P(hw, -hd, h), P(hw, hd, h), null, col); g.face(P(-hw, -hd, 0), P(-hw, hd, 0), P(-hw, hd, h), P(-hw, -hd, h), null, col);
    g.face(P(-hw, hd, h), P(hw, hd, h), P(hw, -hd, h), P(-hw, -hd, h), null, col); return P; }
  // una casa encalada con puerta y ventanas azules mirando a (fx,fz)
  function house(x, y, z, fx, fz, w, d, h) {
    const c = WH[Math.floor(rnd() * WH.length)], P = box(x, y, z, fx, fz, w, d, h, c);
    box(x, y + h, z, fx, fz, w + 0.3, d + 0.3, 0.35, c); // cornisa
    const fr = (a, yy, ww, hh, col) => { const q = P(a, d / 2 + 0.06, 0); box(q.x, y + yy, q.z, fx, fz, ww, 0.12, hh, col); };
    fr(-w * 0.18, 0, 1.1, 2.1, rnd() < 0.7 ? BL : BL2); fr(w * 0.22, 1.1, 0.9, 1.0, BL); if (h > 5) { fr(-w * 0.2, 3.6, 0.9, 1.0, BL); fr(w * 0.22, 3.6, 0.9, 1.0, BL); }
    if (rnd() < 0.45) { const q = P((rnd() - 0.5) * w * 0.4, -d * 0.2, 0); box(q.x, y + h, q.z, fx, fz, w * 0.55, d * 0.5, 2.6 + rnd() * 1.2, c); }
    if (rnd() < 0.35) { const q = P(w / 2 + 0.3, d / 2 - 0.3, 0); box(q.x, y, q.z, fx, fz, 0.8, 0.8, h * 0.8, PINK); } }
  const domes = [];
  function church(x, y, z, fx, fz) { const c = WH[0]; box(x, y, z, fx, fz, 6, 8, 5.5, c); box(x, y + 5.5, z, fx, fz, 4.6, 4.6, 1.2, c); domes.push([x, y + 6.7, z]);
    const rx = fz, rz = -fx, bx = x + rx * 3.6 + fx * 3.4, bz = z + rz * 3.6 + fz * 3.4; box(bx, y, bz, fx, fz, 1.8, 1.8, 7.5, c); box(bx, y + 7.5, bz, fx, fz, 1.4, 1.4, 0.4, BL); }
  // ---- calles del pueblo: casas pegadas a lado y lado ----
  const town = T.zones.find(z => z.type === 'town'); let n = 0;
  for (let s = town.s0 - 20; s < town.s1 + 30; s += 7.5) for (const sg of [-1, 1]) {
    const o = T.at(T.wrap(s)); if (Math.abs(o.kap) > 0.014 && Math.sign(o.kap) === sg) continue; const w = 6 + rnd() * 2.5, d = 6 + rnd() * 2, u = (T.limits(T.wrap(s)).wall + 0.4 + d / 2) * sg, x = o.px + o.rx * u, z = o.pz + o.rz * u;
    if (!K.occ.free(x, z, 3.5)) continue; const y = o.py - 0.3, uc = (T.limits(T.wrap(s)).wall + 5.2) * sg, isCh = (n + 1) % 9 === 4;
    if (isCh ? !K.fits(o.px + o.rx * uc, o.pz + o.rz * uc, -o.rx * sg, -o.rz * sg, 11, 13) : !K.fits(x, z, -o.rx * sg, -o.rz * sg, w + 1.8, d + 0.8)) continue; K.occ.occupy(x, z, 4); n++;
    if (isCh) { church(o.px + o.rx * uc, y, o.pz + o.rz * uc, -o.rx * sg, -o.rz * sg); K.occ.occupy(o.px + o.rx * uc, o.pz + o.rz * uc, 5); } else house(x, y, z, -o.rx * sg, -o.rz * sg, w, d, 3.6 + rnd() * 2.8); }
  // ---- casas colgadas del acantilado (de cara al mar) ----
  for (let i = 0, tries = 0; i < [70, 120, 190][GQ.lv] && tries < 6000; tries++) {
    const x = -30 + rnd() * 90, z = -260 + rnd() * 700, y = H(x, z); if (y < 6 || y > 39 || nearD(x, z) < 6.5 || !K.occ.free(x, z, 3.4)) continue;
    const ch = rnd() < 0.08, fz2 = (rnd() - 0.5) * 0.3, w = 5 + rnd() * 3, d = 5 + rnd() * 2; if (!K.fits(x, z, -1, ch ? 0 : fz2, ch ? 11 : w + 1.8, ch ? 13 : d + 0.8)) continue; K.occ.occupy(x, z, 3.4); i++;
    if (ch) church(x, y - 0.4, z, -1, 0); else house(x, y - 0.6, z, -1, fz2, w, d, 3.2 + rnd() * 2.4); }
  scene.add(new THREE.Mesh(g.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 })));
  { const dm = new THREE.MeshStandardMaterial({ color: '#1f5fc0', roughness: 0.35, metalness: 0.1 }), dg = new THREE.SphereGeometry(2.3, 18, 10, 0, TAU, 0, Math.PI / 2), crossG = new THREE.BoxGeometry(0.12, 0.9, 0.12);
    for (const [x, y, z] of domes) { const m = new THREE.Mesh(dg, dm); m.position.set(x, y, z); scene.add(m); const c = new THREE.Mesh(crossG, new THREE.MeshStandardMaterial({ color: '#f2f0ea' })); c.position.set(x, y + 2.7, z); scene.add(c); } }
  // ---- molinos de viento en el borde (Oia) ----
  { const mills = [], thatch = new THREE.MeshStandardMaterial({ color: '#8a6a4a', roughness: 1 }), wall = new THREE.MeshStandardMaterial({ color: '#f6f4ee', roughness: 0.85 }), sailM = new THREE.MeshStandardMaterial({ color: '#f2ece0', side: THREE.DoubleSide, roughness: 0.8 });
    for (let i = 0; i < 4; i++) { const s = T.cp(4.4 + i * 0.28), o = T.at(s), sg = i % 2 ? 1 : -1, d = T.limits(s).wall + 9, x = o.px + o.rx * d * sg, z = o.pz + o.rz * d * sg, y = H(x, z); if (!K.occ.free(x, z, 4)) continue; K.occ.occupy(x, z, 4.5);
      const m = new THREE.Group(), body = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 8, 16), wall); body.position.y = 4; m.add(body); const roof = new THREE.Mesh(new THREE.ConeGeometry(2.7, 2.6, 16), thatch); roof.position.y = 9.3; m.add(roof);
      const hub = new THREE.Group(); hub.position.set(0, 8.4, 2.8); m.add(hub); for (let k = 0; k < 8; k++) { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 5.2, 0.12), thatch); arm.position.y = 2.6; const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 3.6).translate(0.7, 3.2, 0), sailM); const a = new THREE.Group(); a.add(arm); a.add(sail); a.rotation.z = k / 8 * TAU; hub.add(a); }
      m.position.set(x, y, z); m.lookAt(x - 1, y, z); scene.add(m); mills.push(hub); }
    anim.push(t => mills.forEach((h, i) => { h.rotation.z = t * (0.7 + i * 0.1); })); }
  // ---- veleros y un crucero en la caldera ----
  { const boats = []; for (let i = 0, tries = 0; i < 9 && tries < 500; tries++) { const x = -700 + rnd() * 650, z = -500 + rnd() * 900; if (H(x, z) > L - 2 || nearD(x, z) < 25) continue; i++;
      const b = new THREE.Group(), hull = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1, 8), new THREE.MeshStandardMaterial({ color: '#f4f4f2', roughness: 0.4 })); hull.position.y = 0.3; b.add(hull); const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 9, 6), new THREE.MeshStandardMaterial({ color: '#d8d8d8' })); mast.position.y = 5; b.add(mast);
      const sail = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([V3(0, 1.2, -0.2), V3(0, 9, -0.2), V3(0, 1.2, -3.6)]), new THREE.MeshStandardMaterial({ color: '#ffffff', side: THREE.DoubleSide })); sail.geometry.computeVertexNormals(); b.add(sail);
      b.position.set(x, L, z); b.rotation.y = rnd() * TAU; scene.add(b); boats.push({ b, ph: rnd() * 6 }); }
    const ship = new THREE.Group(), hullS = new THREE.Mesh(new THREE.BoxGeometry(18, 7, 120), new THREE.MeshStandardMaterial({ color: '#f6f6f4', roughness: 0.4 })); hullS.position.y = 2.5; ship.add(hullS); const band = new THREE.Mesh(new THREE.BoxGeometry(18.2, 1.4, 120.2), new THREE.MeshStandardMaterial({ color: '#1a3a7a' })); band.position.y = 0.2; ship.add(band);
    for (let k = 0; k < 4; k++) { const deck = new THREE.Mesh(new THREE.BoxGeometry(16 - k * 1.5, 3, 90 - k * 14), new THREE.MeshStandardMaterial({ color: '#fbfbf8', roughness: 0.5 })); deck.position.y = 7.5 + k * 3; ship.add(deck); }
    const fun = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3, 6, 12), new THREE.MeshStandardMaterial({ color: '#c8202a' })); fun.position.set(0, 22, -20); ship.add(fun); ship.position.set(-760, L - 1, 120); ship.rotation.y = 0.4; scene.add(ship);
    anim.push(t => boats.forEach(o => { o.b.position.y = L + Math.sin(t * 1.2 + o.ph) * 0.15; o.b.rotation.z = Math.sin(t * 0.9 + o.ph) * 0.06; })); }
};
