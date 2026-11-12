/* =========================================================================
   ESCENARIO DE GUATAPÉ — casas con zócalos de colores a lado y lado de la
   calle del pueblo, banderines, la iglesia en la plaza, la Piedra del Peñol
   con su grieta de escaleras, árboles, fincas y lanchas en el embalse.
   ========================================================================= */
SCENERY.guatape = (scene, T, def, K) => {
  const { Geo, canvasTex, terrain, anim, V3 } = K;
  const ZC = ['#f2c12e', '#e8452c', '#2a7bd4', '#2eaa5a', '#f07a1a', '#c02a7a', '#18a6b0', '#8a3cc8'];
  // ---- fachadas: atlas de 4 casas con zócalos ----
  const atlas = canvasTex(1024, 256, (x, w, h) => {
    for (let v = 0; v < 4; v++) {
      const X = v * 256, c1 = ZC[(v * 3) % 8], c2 = ZC[(v * 3 + 2) % 8], c3 = ZC[(v * 3 + 5) % 8];
      x.fillStyle = v === 2 ? '#fdf3e0' : '#fbfaf6'; x.fillRect(X, 0, 256, h);
      x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(X, 0, 256, 10);
      // zócalo: banda baja con tableros en relieve
      x.fillStyle = c1; x.fillRect(X, 182, 256, 74);
      for (let p = 0; p < 4; p++) { const px = X + 8 + p * 62; x.fillStyle = c2; x.beginPath(); x.roundRect(px, 192, 54, 54, 8); x.fill(); x.fillStyle = c3; x.strokeStyle = '#fff'; x.lineWidth = 3; x.beginPath(); if (p % 2) { x.arc(px + 27, 219, 15, 0, TAU); x.fill(); x.stroke(); x.fillStyle = '#fff'; x.beginPath(); x.arc(px + 27, 219, 5, 0, TAU); x.fill(); } else { x.moveTo(px + 27, 200); x.lineTo(px + 46, 219); x.lineTo(px + 27, 238); x.lineTo(px + 8, 219); x.closePath(); x.fill(); x.stroke(); } }
      // puerta y ventanas con marcos de color
      x.fillStyle = c2; x.fillRect(X + 102, 104, 52, 152); x.fillStyle = '#6b3a1e'; x.fillRect(X + 108, 110, 40, 146); x.fillStyle = 'rgba(255,255,255,0.15)'; x.fillRect(X + 112, 116, 14, 130);
      for (const wx of [24, 178]) { x.fillStyle = c3; x.fillRect(X + wx - 6, 40, 66, 92); x.fillStyle = '#2a3a4a'; x.fillRect(X + wx, 46, 54, 80); x.fillStyle = 'rgba(180,220,255,0.35)'; x.fillRect(X + wx + 4, 50, 20, 72); x.fillStyle = c1; x.fillRect(X + wx - 10, 128, 74, 8); for (let b = 0; b < 7; b++) x.fillRect(X + wx - 8 + b * 11, 136, 3, 22); x.fillRect(X + wx - 10, 156, 74, 4); }
    }
  }, false);
  // segundo piso: ventanas con postigos de madera abiertos y franja de color en el entrepiso
  const atlasU = canvasTex(1024, 256, (x, w, h) => {
    for (let v = 0; v < 4; v++) {
      const X = v * 256, c1 = ZC[(v * 3 + 1) % 8], c2 = ZC[(v * 3 + 4) % 8];
      x.fillStyle = v === 1 ? '#fdf3e0' : '#fbfaf6'; x.fillRect(X, 0, 256, h); x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(X, 0, 256, 8);
      x.fillStyle = c1; x.fillRect(X, 228, 256, 28); x.fillStyle = 'rgba(255,255,255,0.5)'; for (let k = 0; k < 16; k++) x.fillRect(X + 4 + k * 16, 236, 8, 12);
      for (const wx of [38, 162]) { x.fillStyle = '#2a3a4a'; x.fillRect(X + wx, 40, 56, 150); x.fillStyle = 'rgba(180,220,255,0.3)'; x.fillRect(X + wx + 6, 46, 18, 138); x.fillStyle = '#5a3218'; x.fillRect(X + wx + 26, 40, 4, 150);
        x.fillStyle = c2; x.fillRect(X + wx - 22, 36, 20, 158); x.fillRect(X + wx + 58, 36, 20, 158); x.fillStyle = 'rgba(0,0,0,0.18)'; for (let k = 0; k < 12; k++) { x.fillRect(X + wx - 20, 44 + k * 12, 16, 3); x.fillRect(X + wx + 60, 44 + k * 12, 16, 3); }
        x.fillStyle = c1; x.fillRect(X + wx - 6, 30, 68, 10); }
    }
  }, false);
  atlasU.wrapT = THREE.RepeatWrapping;
  const roofTex = canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#a8442a'; x.fillRect(0, 0, w, h); for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) { x.fillStyle = `rgba(${150 + Math.random() * 60},${60 + Math.random() * 30},40,1)`; x.beginPath(); x.ellipse(c * 16 + (r % 2) * 8 + 8, r * 16 + 10, 8, 7, 0, 0, Math.PI); x.fill(); } });
  const gF = new Geo(), gU = new Geo(), gB = new Geo(), gR = new Geo(), placed = [];
  const town = T.zones.find(z => z.type === 'town');
  const walk = (s0, s1, stepM, fn) => { let s = s0, n = 0; const len = T.wrap(s1 - s0); for (let d = 0; d <= len; d += stepM) { fn(T.wrap(s0 + d), n++); } };
  const wallC = new THREE.Color('#f6f2ea');
  const wood = new THREE.Color('#6b3a1e'), woodL = new THREE.Color('#8a5430'), FL = ['#e8336a', '#ff7a2e', '#f2c12e', '#d23a9a', '#ffffff'].map(c => new THREE.Color(c)), leaf = new THREE.Color('#3f8a3a');
  function house(px, pz, py, fx, fz, wid, dep, hgt, variant, two, r) {
    // fx,fz = hacia la calle (frente); rx,rz = a lo largo de la fachada
    const rx = fz, rz = -fx, hw = wid / 2, P = (a, b, y) => V3(px + rx * a + fx * b, py + y, pz + rz * a + fz * b);
    // caja en coordenadas de la casa (a: a lo largo, b: hacia la calle, y: arriba)
    const box = (g, a0, a1, b0, b1, y0, y1, col, bottom) => { g.face(P(a0, b1, y0), P(a1, b1, y0), P(a1, b1, y1), P(a0, b1, y1), null, col); g.face(P(a1, b1, y0), P(a1, b0, y0), P(a1, b0, y1), P(a1, b1, y1), null, col); g.face(P(a0, b0, y0), P(a0, b1, y0), P(a0, b1, y1), P(a0, b0, y1), null, col); g.face(P(a0, b1, y1), P(a1, b1, y1), P(a1, b0, y1), P(a0, b0, y1), null, col); if (bottom) g.face(P(a0, b0, y0), P(a1, b0, y0), P(a1, b1, y0), P(a0, b1, y0), null, col); };
    // matas: follaje verde y flores pequeñas encima
    const flowers = (a0, a1, b, y) => { box(gB, a0 + 0.05, a1 - 0.05, b - 0.26, b + 0.06, y, y + 0.22, leaf); for (let a = a0 + 0.12; a < a1 - 0.1; a += 0.2) { const c = FL[Math.floor(r() * FL.length)], s2 = 0.06 + r() * 0.04, bb = b - 0.2 + r() * 0.22; box(gB, a - s2, a + s2, bb - s2, bb + s2, y + 0.16 + r() * 0.1, y + 0.3 + r() * 0.1, c); } };
    const u0 = variant * 0.25, u1 = u0 + 0.25, H1 = two ? 5.4 : hgt;
    gF.face(P(-hw, 0, 0), P(hw, 0, 0), P(hw, 0, H1), P(-hw, 0, H1), [u0, 0, u1, 1]);
    // ventanas del primer piso: jardinera de madera con flores bajo cada una
    for (const sx of [-0.3, 0.3]) { const yb = H1 * (1 - 132 / 256), a = sx * wid, hw2 = 0.15 * wid; box(gB, a - hw2, a + hw2, 0, 0.42, yb - 0.24, yb, woodL, true); flowers(a - hw2, a + hw2, 0.3, yb); }
    if (two) {
      gU.face(P(-hw, 0, H1), P(hw, 0, H1), P(hw, 0, hgt), P(-hw, 0, hgt), [u0, 0, u1, 1]);
      // balcón de madera volado con baranda, canecillos y matas
      const bw = hw * 0.86, by = H1 + 0.05, bd = 1.05, col = new THREE.Color(ZC[(variant * 3 + 4) % 8]).lerp(wood, 0.25);
      box(gB, -bw, bw, 0, bd, by, by + 0.2, wood, true);
      for (let a = -bw + 0.6; a <= bw - 0.5; a += 1.4) box(gB, a - 0.09, a + 0.09, 0, bd * 0.85, by - 0.55, by, wood, true);
      box(gB, -bw, bw, bd - 0.1, bd, by + 1.0, by + 1.1, col, true); box(gB, -bw, -bw + 0.1, 0, bd, by + 1.0, by + 1.1, col, true); box(gB, bw - 0.1, bw, 0, bd, by + 1.0, by + 1.1, col, true);
      for (let a = -bw + 0.1; a <= bw - 0.05; a += 0.38) box(gB, a - 0.035, a + 0.035, bd - 0.08, bd - 0.01, by + 0.2, by + 1.0, col);
      for (const a of [-bw + 0.1, bw - 0.1]) for (let b = 0.3; b < bd - 0.1; b += 0.38) box(gB, a - 0.035, a + 0.035, b - 0.035, b + 0.035, by + 0.2, by + 1.0, col);
      flowers(-bw + 0.2, -bw + 1.6, bd - 0.3, by + 0.2); flowers(bw - 1.6, bw - 0.2, bd - 0.3, by + 0.2);
    } else if (r() < 0.55) {
      // tejadillo sobre la puerta
      const y0 = H1 * (1 - 104 / 256) + 0.15; gR.face(P(-1.35, 0.85, y0), P(1.35, 0.85, y0), P(1.35, 0, y0 + 0.45), P(-1.35, 0, y0 + 0.45), [0, 0, 0.7, 0.25]);
      gR.face(P(1.35, 0, y0 + 0.36), P(-1.35, 0, y0 + 0.36), P(-1.35, 0.85, y0 - 0.09), P(1.35, 0.85, y0 - 0.09), [0, 0, 0.7, 0.25]);
      for (const a of [-1.2, 1.2]) box(gB, a - 0.06, a + 0.06, 0, 0.7, y0 - 0.35, y0, wood, true);
    }
    gU.face(P(hw, -dep, 0), P(-hw, -dep, 0), P(-hw, -dep, hgt), P(hw, -dep, hgt), [u0, 0, u1, Math.max(1, Math.round(hgt / 4.6))]); // espalda: ventanas con postigos, no muro liso
    gB.face(P(hw, 0, 0), P(hw, -dep, 0), P(hw, -dep, hgt), P(hw, 0, hgt), [0, 0, 1, 1], wallC);
    gB.face(P(-hw, -dep, 0), P(-hw, 0, 0), P(-hw, 0, hgt), P(-hw, -dep, hgt), [0, 0, 1, 1], wallC);
    // techo a dos aguas que vuela sobre la calle
    const o = 0.9, ridge = hgt + 2.4;
    gR.face(P(-hw - o, o, hgt - 0.3), P(hw + o, o, hgt - 0.3), P(hw + o, -dep / 2, ridge), P(-hw - o, -dep / 2, ridge), [0, 0, wid / 4, 1]);
    gR.face(P(hw + o, -dep - o, hgt - 0.3), P(-hw - o, -dep - o, hgt - 0.3), P(-hw - o, -dep / 2, ridge), P(hw + o, -dep / 2, ridge), [0, 0, wid / 4, 1]);
    gB.face(P(-hw, 0, hgt), P(hw, 0, hgt), P(hw, -dep / 2, ridge - 0.2), P(-hw, -dep / 2, ridge - 0.2), [0, 0, 1, 1], wallC);
  }
  const rnd = makeRng(7);
  if (town) walk(town.s0, town.s1, 9.6, (s, n) => {
    const o = T.at(s);
    for (const sg of [-1, 1]) {
      if (Math.abs(o.kap) > 0.012 && Math.sign(o.kap) === sg) continue; // por dentro de las esquinas no caben
      const u = (o.w / 2 + 2.5) * sg, px = o.px + o.rx * u, pz = o.pz + o.rz * u, fx = -o.rx * sg, fz = -o.rz * sg;
      const cx = px - fx * 4, cz = pz - fz * 4; if (placed.some(p => Math.hypot(p[0] - cx, p[1] - cz) < 8.4)) continue; placed.push([cx, cz]); K.occ.occupy(cx, cz, 6.2);
      const len = Math.hypot(fx, fz), two = rnd() < 0.45; house(px, pz, o.py - 0.2, fx / len, fz / len, 9.2, 8, two ? 9.4 + rnd() * 1.2 : 6.2 + rnd() * 1.8, (n * 2 + (sg > 0 ? 1 : 0) + Math.floor(rnd() * 3)) % 4, two, rnd);
    }
  });
  const mF = new THREE.MeshStandardMaterial({ map: atlas, roughness: 0.85 }), mU = new THREE.MeshStandardMaterial({ map: atlasU, roughness: 0.85 }), mB = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), mR = new THREE.MeshStandardMaterial({ map: roofTex, roughness: 0.8 });
  for (const [g, m] of [[gF, mF], [gU, mU], [gB, mB], [gR, mR]]) if (g.i.length) scene.add(new THREE.Mesh(g.build(), m));
  // ---- plazoletas por dentro de las esquinas del pueblo (antes quedaba pasto pelado): ladrillo, kiosco, árboles, bancas y faroles ----
  if (town) {
    const apex = []; for (let k = 1; k < T.N - 1; k++) { const s = k * T.ds, a = Math.abs(T.kap[k]); if (T.zone(s, 'town') && a > 0.012 && a >= Math.abs(T.kap[k - 1]) && a >= Math.abs(T.kap[k + 1]) && !apex.some(q => Math.abs(T.wrap(q - s + T.L / 2) - T.L / 2) < 30)) apex.push(s); }
    const brick = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#9a4a32'; x.fillRect(0, 0, w, h); for (let r = 0; r < 16; r++) for (let c = 0; c < 8; c++) { const v = 0.85 + Math.random() * 0.3; x.fillStyle = `rgb(${190 * v | 0},${92 * v | 0},${62 * v | 0})`; x.fillRect(c * 32 + (r % 2) * 16 + 1, r * 16 + 1, 30, 14); } });
    brick.repeat.set(5, 5);
    const gP = new Geo(), trees = [], lamps = [], mPave = new THREE.MeshStandardMaterial({ map: brick, roughness: 0.9 });
    for (const s of apex) {
      const o = T.at(s), sg = Math.sign(o.kap), d = o.w / 2 + 15, cx = o.px + o.rx * d * sg, cz = o.pz + o.rz * d * sg, h = terrain.userData.height(cx, cz);
      const nt = terrain.userData.nearTrack(cx, cz), RP = Math.min(11, nt ? nt.d - T.at(nt.q.k * T.ds).w / 2 - 1.2 : 11); if (RP < 6) continue;
      const okAt = (x, z, r) => { const n2 = terrain.userData.nearTrack(x, z); return (!n2 || n2.d > T.limits(n2.q.k * T.ds).wall + r + 0.4) && K.occ.free(x, z, r); };
      const disc = new THREE.Mesh(new THREE.CircleGeometry(RP, 40), mPave); disc.rotation.x = -Math.PI / 2; disc.position.set(cx, h + 0.08, cz); scene.add(disc);
      const curb = new THREE.Mesh(new THREE.TorusGeometry(RP, 0.25, 4, 40), new THREE.MeshStandardMaterial({ color: '#e8e2d4', roughness: 0.8 })); curb.rotation.x = -Math.PI / 2; curb.position.set(cx, h + 0.1, cz); scene.add(curb);
      if (!okAt(cx, cz, 4.4)) continue; K.occ.occupy(cx, cz, 4.4);
      // kiosco octogonal de colores
      const kg = new THREE.Group(), col = ZC[(apex.indexOf(s) * 3 + 1) % 8], mc = new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 }), mw = new THREE.MeshStandardMaterial({ color: '#fbf8f0', roughness: 0.7 });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.8, 0.6, 8), mw); base.position.y = 0.3; kg.add(base);
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.1, 6), mc); post.position.set(Math.cos(a) * 3.3, 2.15, Math.sin(a) * 3.3); kg.add(post); }
      const rail = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.07, 4, 8), mc); rail.rotation.x = -Math.PI / 2; rail.rotation.z = Math.PI / 8; rail.position.y = 1.5; kg.add(rail);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(4.5, 2.3, 8), mR); roof.position.y = 4.85; kg.add(roof);
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), mc); tip.position.y = 6.1; kg.add(tip);
      kg.position.set(cx, h + 0.08, cz); scene.add(kg);
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3, rr = Math.min(8.2, RP - 1.6), x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr; if (!okAt(x, z, i % 2 ? 2.2 : 0.6)) continue; K.occ.occupy(x, z, i % 2 ? 2.2 : 0.6); if (i % 2) trees.push([x, h, z, 0.8 + rnd() * 0.3, rnd() * TAU, 1]); else lamps.push([x, h, z, a]); }
      for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.8, x = cx + Math.cos(a) * 6, z = cz + Math.sin(a) * 6; if (!okAt(x, z, 1.2)) continue; K.occ.occupy(x, z, 1.2); const P = (aa, bb, y) => V3(x + Math.cos(a) * bb - Math.sin(a) * aa, h + y, z + Math.sin(a) * bb + Math.cos(a) * aa), c = new THREE.Color('#2a6a3a');
        gP.face(P(-1.1, -0.25, 0.5), P(1.1, -0.25, 0.5), P(1.1, 0.25, 0.5), P(-1.1, 0.25, 0.5), null, c); gP.face(P(-1.1, 0.3, 0.5), P(1.1, 0.3, 0.5), P(1.1, 0.35, 1.0), P(-1.1, 0.35, 1.0), null, c);
        for (const e of [-1, 1]) gP.face(P(e * 0.95 - 0.05, 0, 0), P(e * 0.95 + 0.05, 0, 0), P(e * 0.95 + 0.05, 0, 0.5), P(e * 0.95 - 0.05, 0, 0.5), null, new THREE.Color('#333'));
      }
    }
    if (gP.i.length) { const m = new THREE.Mesh(gP.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide })); scene.add(m); }
    if (trees.length) PROPS.inst(scene, PROPS.treeGeo('broad', false), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }), trees, ['#4f8a2c', '#5e9a34', '#6aa63a'], true);
    if (lamps.length) { const post = new THREE.CylinderGeometry(0.09, 0.13, 4, 6).translate(0, 2, 0), lamp = new THREE.SphereGeometry(0.34, 10, 8).translate(0, 4.15, 0);
      PROPS.inst(scene, post, new THREE.MeshStandardMaterial({ color: '#1e2a24', roughness: 0.5, metalness: 0.4 }), lamps.map(p => [p[0], p[1], p[2], 1, 0]), null, true);
      PROPS.inst(scene, lamp, new THREE.MeshStandardMaterial({ color: '#fff6dc', emissive: '#ffd890', emissiveIntensity: 0.6 }), lamps.map(p => [p[0], p[1], p[2], 1, 0]), null, false); }
  }
  // ---- banderines de colores sobre la calle ----
  if (town) { const gb = new Geo(); walk(town.s0, town.s1, 26, s => { const o = T.at(s), half = o.w / 2 + 2.6; const A = V3(o.px - o.rx * half, o.py + 7.4, o.pz - o.rz * half), B = V3(o.px + o.rx * half, o.py + 7.4, o.pz + o.rz * half); const n = 14; for (let k = 0; k < n; k++) { const f0 = k / n, f1 = (k + 0.8) / n, sag = t => Math.sin(t * Math.PI) * 1.4; const p0 = A.clone().lerp(B, f0), p1 = A.clone().lerp(B, f1); p0.y -= sag(f0); p1.y -= sag(f1); const mid = p0.clone().lerp(p1, 0.5); mid.y -= 0.9; const col = new THREE.Color(ZC[k % 8]); gb.face(p0, p1, mid, mid, [0, 0, 1, 1], col); } }); scene.add(new THREE.Mesh(gb.build(), new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.8 }))); }
  // ---- iglesia en la plaza (dentro de la esquina del pueblo) ----
  { const o = T.at(T.cp(4.4)), u = -(o.w / 2 + 42), cx = o.px + o.rx * u, cz = o.pz + o.rz * u, y = o.py - 0.3, g = new THREE.Group();
    const white = new THREE.MeshStandardMaterial({ color: '#f7f4ec', roughness: 0.8 }), ochre = new THREE.MeshStandardMaterial({ color: '#d99a2b', roughness: 0.7 }), red = new THREE.MeshStandardMaterial({ color: '#b03a26', roughness: 0.7 });
    const nave = new THREE.Mesh(new THREE.BoxGeometry(16, 13, 30), white); nave.position.set(0, 6.5, 0); g.add(nave);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 11.5, 6, 4, 1), red); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 2.1); roof.position.set(0, 16, 0); g.add(roof);
    for (const sx of [-6, 6]) { const tw = new THREE.Mesh(new THREE.BoxGeometry(5, 24, 5), white); tw.position.set(sx, 12, 15); g.add(tw); const band = new THREE.Mesh(new THREE.BoxGeometry(5.3, 1.2, 5.3), ochre); band.position.set(sx, 16, 15); g.add(band); const cap = new THREE.Mesh(new THREE.ConeGeometry(3.6, 6, 4), red); cap.rotation.y = Math.PI / 4; cap.position.set(sx, 27, 15); g.add(cap); }
    const door = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 0.4), new THREE.MeshStandardMaterial({ color: '#5a2e18' })); door.position.set(0, 3, 15.1); g.add(door);
    g.position.set(cx, y, cz); g.lookAt(o.px, y, o.pz); scene.add(g); }
  // ---- La Piedra del Peñol: monolito de granito, vetas oscuras, líquenes y la grieta con su escalera en zigzag ----
  { const [rx, rz] = def.rock, CR = 2.2;
    const PR = [[94, -30], [95, 0], [94, 30], [92, 70], [89, 110], [84, 145], [75, 172], [60, 193], [40, 207], [17, 214], [0, 216]];
    const rAt = y => { for (let i = 1; i < PR.length; i++) if (y <= PR[i][1]) { const f = (y - PR[i - 1][1]) / (PR[i][1] - PR[i - 1][1]); return lerp(PR[i - 1][0], PR[i][0], f); } return 0; };
    const g = new THREE.LatheGeometry(PR.map(p => new THREE.Vector2(p[0], p[1])), 128), P = g.attributes.position, cols = new Float32Array(P.count * 3);
    const cA = new THREE.Color('#a9a8a0'), cB = new THREE.Color('#6a6b66'), cL = new THREE.Color('#5f6e45'), cD = new THREE.Color('#34342f'), tmp = new THREE.Color();
    for (let v = 0; v < P.count; v++) {
      const x = P.getX(v), y = P.getY(v), z = P.getZ(v), a = Math.atan2(z, x), da = angWrap(a - CR - Math.sin(y / 23) * 0.02), cr = (y > 3 && y < 208) ? Math.exp(-(da * da) / 0.0036) : 0;
      const bump = 1 + (fbm2(a * 3, y / 40, 3) - 0.5) * 0.09 + (fbm2(a * 22, y / 14, 2) - 0.5) * 0.025 - cr * 0.075; P.setX(v, x * bump); P.setZ(v, z * bump);
      tmp.copy(cA).lerp(cB, clamp((fbm2(a * 19, y / 150, 2) - 0.42) * 2.3, 0, 1));
      const li = fbm2(a * 6 + 5, y / 25, 3); if (li > 0.57) tmp.lerp(cL, clamp((li - 0.57) * 3, 0, 0.6));
      tmp.lerp(cD, cr * 0.75); if (y < 6) tmp.lerp(cL, 0.5);
      cols[v * 3] = tmp.r; cols[v * 3 + 1] = tmp.g; cols[v * 3 + 2] = tmp.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3)); g.computeVertexNormals();
    const by = Math.min(terrain.userData.height(rx, rz), 0);
    const rock = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93 })); rock.position.set(rx, by, rz); scene.add(rock);
    // escalera blanca en zigzag dentro de la grieta (los famosos 740 escalones)
    const st = new Geo(), white = new THREE.Color('#fbfaf4');
    for (let y = 5, k = 0; y < 204; y += 7.5, k++) {
      const a0 = CR + (k % 2 ? 0.035 : -0.035), a1 = CR + (k % 2 ? -0.035 : 0.035), y1 = y + 7.5;
      const r0 = rAt(y) * 0.935 + 1.2, r1 = rAt(y1) * 0.935 + 1.2;
      const p0 = V3(rx + Math.cos(a0) * r0, by + y, rz + Math.sin(a0) * r0), p1 = V3(rx + Math.cos(a1) * r1, by + y1, rz + Math.sin(a1) * r1);
      st.face(p0, p1, p1.clone().add(V3(0, 1.3, 0)), p0.clone().add(V3(0, 1.3, 0)), [0, 0, 1, 1], white);
    }
    scene.add(new THREE.Mesh(st.build(), new THREE.MeshStandardMaterial({ vertexColors: true, emissive: '#3a3a36', side: THREE.DoubleSide, roughness: 0.7 })));
    const hut = new THREE.Mesh(new THREE.BoxGeometry(14, 6, 10), new THREE.MeshStandardMaterial({ color: '#f4f1ea' })); hut.position.set(rx, by + 219, rz); scene.add(hut);
    const hr = new THREE.Mesh(new THREE.ConeGeometry(10, 4, 4), new THREE.MeshStandardMaterial({ color: '#b03a26' })); hr.rotation.y = Math.PI / 4; hr.position.set(rx, by + 224, rz); scene.add(hr); }
  // ---- fincas de colores en las lomas y lanchas en el embalse ----
  { const g = new Geo(), gr = new Geo(); let i = 0; for (let k = 0; k < 400 && i < 46; k++) { const a = rnd() * TAU, r = 200 + rnd() * 800, x = Math.cos(a) * r, z = Math.sin(a) * r - 60, h = terrain.userData.height(x, z); if (h < def.lake.y + 3 || h > 60) continue; const nt = terrain.userData.nearTrack(x, z); if (nt && nt.d < 40) continue; if (!K.occ.free(x, z, 10)) continue; K.occ.occupy(x, z, 10); i++;
      const c = new THREE.Color(ZC[i % 8]).lerp(new THREE.Color('#ffffff'), 0.55), w = 7, d = 6, hh = 4.5, P = (a2, b2, y) => V3(x + a2, h + y, z + b2);
      g.face(P(-w, d, 0), P(w, d, 0), P(w, d, hh), P(-w, d, hh), [0, 0, 1, 1], c); g.face(P(w, -d, 0), P(-w, -d, 0), P(-w, -d, hh), P(w, -d, hh), [0, 0, 1, 1], c); g.face(P(w, d, 0), P(w, -d, 0), P(w, -d, hh), P(w, d, hh), [0, 0, 1, 1], c); g.face(P(-w, -d, 0), P(-w, d, 0), P(-w, d, hh), P(-w, -d, hh), [0, 0, 1, 1], c);
      gr.face(P(-w - 1, d + 1, hh), P(w + 1, d + 1, hh), P(w + 1, 0, hh + 2.6), P(-w - 1, 0, hh + 2.6), [0, 0, 3, 1]); gr.face(P(w + 1, -d - 1, hh), P(-w - 1, -d - 1, hh), P(-w - 1, 0, hh + 2.6), P(w + 1, 0, hh + 2.6), [0, 0, 3, 1]); }
    scene.add(new THREE.Mesh(g.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }))); scene.add(new THREE.Mesh(gr.build(), mR));
    const boats = []; for (let k = 0; k < 300 && boats.length < 14; k++) { const a = rnd() * TAU, r = 150 + rnd() * 700, x = Math.cos(a) * r, z = Math.sin(a) * r - 60; { const nt = terrain.userData.nearTrack(x, z); if (nt && nt.d < T.w[nt.q.k] / 2 + 16) continue; } if (terrain.userData.height(x, z) > def.lake.y - 1.5) continue;
      const b = new THREE.Group(), hull = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 7), new THREE.MeshStandardMaterial({ color: '#f4f4f4', roughness: 0.5 })); hull.position.y = 0.2; b.add(hull); const top = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 3.4), new THREE.MeshStandardMaterial({ color: ZC[boats.length % 8] })); top.position.set(0, 1.9, -0.5); b.add(top); for (const sx of [-1, 1]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 4), new THREE.MeshStandardMaterial({ color: '#ddd' })); pole.position.set(sx * 0.95, 1.1, -0.5); b.add(pole); }
      b.position.set(x, def.lake.y, z); b.rotation.y = rnd() * TAU; scene.add(b); boats.push({ b, ph: rnd() * 6, sp: 1 + rnd() * 3, dir: b.rotation.y }); }
    anim.push(t => { for (const o of boats) { o.b.position.y = def.lake.y + Math.sin(t * 1.3 + o.ph) * 0.12; o.b.rotation.z = Math.sin(t * 1.1 + o.ph) * 0.04; } }); }
};
