/* =========================================================================
   ESCENARIO DE VENECIA — palacios de estuco con ventanas de arco a lado y
   lado de la calle y del Gran Canal, el campanario de ladrillo con su techo
   verde, cúpulas blancas, góndolas amarradas, postes de rayas y faroles,
   y la isla con iglesia al fondo de la laguna. Luz de atardecer.
   ========================================================================= */
SCENERY.venecia = (scene, T, def, K) => {
  const { Geo, canvasTex, terrain, anim, V3 } = K, rnd = makeRng(11), L = T.lakeY;
  const COLS = ['#d98a4e', '#e8b874', '#c9563c', '#f0d9b5', '#e7a4a0', '#b8643f', '#efc98f', '#d47a6a'];
  // ---- atlas de fachadas: 4 palacios (3 pisos, ventanas de arco, balcón, cornisa) ----
  const atlas = canvasTex(1024, 512, (x, w, h) => {
    for (let v = 0; v < 4; v++) {
      const X = v * 256, c = COLS[(v * 3 + 1) % 8], c2 = COLS[(v * 5 + 2) % 8];
      x.fillStyle = c; x.fillRect(X, 0, 256, h);
      for (let k = 0; k < 300; k++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? '255,240,220' : '80,40,20'},0.06)`; x.fillRect(X + Math.random() * 256, Math.random() * h, 6 + Math.random() * 20, 4 + Math.random() * 12); }
      x.fillStyle = 'rgba(40,30,25,0.25)'; x.fillRect(X, h - 70, 256, 70); // zócalo húmedo
      x.fillStyle = '#efe6d4'; x.fillRect(X, 0, 256, 14); x.fillRect(X, 166, 256, 8); x.fillRect(X, 330, 256, 8); // cornisas de piedra
      const arch = (ax, ay, aw, ahh, gothic) => { x.fillStyle = '#efe6d4'; x.beginPath(); x.moveTo(ax - 4, ay + ahh); x.lineTo(ax - 4, ay + aw / 2); if (gothic) { x.quadraticCurveTo(ax - 4, ay - 6, ax + aw / 2, ay - 12); x.quadraticCurveTo(ax + aw + 4, ay - 6, ax + aw + 4, ay + aw / 2); } else x.arc(ax + aw / 2, ay + aw / 2, aw / 2 + 4, Math.PI, 0); x.lineTo(ax + aw + 4, ay + ahh); x.fill();
        x.fillStyle = '#1e2a33'; x.beginPath(); x.moveTo(ax, ay + ahh); x.lineTo(ax, ay + aw / 2); if (gothic) { x.quadraticCurveTo(ax, ay - 2, ax + aw / 2, ay - 6); x.quadraticCurveTo(ax + aw, ay - 2, ax + aw, ay + aw / 2); } else x.arc(ax + aw / 2, ay + aw / 2, aw / 2, Math.PI, 0); x.lineTo(ax + aw, ay + ahh); x.fill();
        x.fillStyle = 'rgba(255,210,140,0.25)'; x.fillRect(ax + 4, ay + aw / 2, aw / 3, ahh - aw / 2 - 4); x.fillStyle = c2; x.fillRect(ax - 2, ay + aw / 2 + 6, 3, ahh - aw / 2 - 6); x.fillRect(ax + aw - 1, ay + aw / 2 + 6, 3, ahh - aw / 2 - 6); };
      const gothic = v % 2 === 0;
      for (let f = 0; f < 2; f++) { const y0 = 40 + f * 164; if (f === 0 && v !== 1) { for (let k = 0; k < 4; k++) arch(X + 38 + k * 48, y0, 30, 92, gothic); x.fillStyle = '#efe6d4'; x.fillRect(X + 30, y0 + 98, 196, 6); for (let b = 0; b < 20; b++) x.fillRect(X + 32 + b * 10, y0 + 104, 4, 16); x.fillRect(X + 30, y0 + 118, 196, 4); } else for (const ax of [36, 106, 176]) arch(X + ax, y0 + 10, 40, 92, gothic); }
      // planta baja: portón de agua y ventanitas
      arch(X + 98, 360, 60, 152, false); x.fillStyle = '#3a2a20'; x.fillRect(X + 104, 400, 48, 112); for (const ax of [28, 196]) arch(X + ax, 400, 30, 70, false);
      x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(X + 250, 0, 6, h);
    }
  }, false);
  const roofTex = canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#9a4a30'; x.fillRect(0, 0, w, h); for (let r = 0; r < 10; r++) for (let c = 0; c < 8; c++) { x.fillStyle = `rgba(${140 + Math.random() * 60},${60 + Math.random() * 30},40,1)`; x.fillRect(c * 16 + (r % 2) * 8, r * 13, 15, 11); } });
  const gF = new Geo(), gB = new Geo(), gR = new Geo(), placed = [], wallC = new THREE.Color('#e3c39a');
  function palazzo(px, pz, py, fx, fz, wid, dep, hgt, variant) {
    const rx = fz, rz = -fx, hw = wid / 2, P = (a, b, y) => V3(px + rx * a + fx * b, py + y, pz + rz * a + fz * b), u0 = variant * 0.25, u1 = u0 + 0.25;
    gF.face(P(-hw, 0, 0), P(hw, 0, 0), P(hw, 0, hgt), P(-hw, 0, hgt), [u0, 0, u1, 1]);
    for (const [a, b, c, d] of [[[hw, -dep], [-hw, -dep]], [[hw, 0], [hw, -dep]], [[-hw, -dep], [-hw, 0]]].map(q => q.concat([0, 0]))) gB.face(P(a[0], a[1], 0), P(b[0], b[1], 0), P(b[0], b[1], hgt), P(a[0], a[1], hgt), [0, 0, 1, 1], wallC);
    // techo plano con alero y chimeneas de embudo
    const o = 0.6; gR.face(P(-hw - o, o, hgt), P(hw + o, o, hgt), P(hw + o, -dep - o, hgt), P(-hw - o, -dep - o, hgt), [0, 0, wid / 4, dep / 4]);
    gR.face(P(-hw - o, o, hgt + 1.6), P(hw + o, o, hgt + 1.6), P(hw + o, -dep / 2, hgt + 3.2), P(-hw - o, -dep / 2, hgt + 3.2), [0, 0, wid / 4, 1]);
    gR.face(P(hw + o, -dep - o, hgt + 1.6), P(-hw - o, -dep - o, hgt + 1.6), P(-hw - o, -dep / 2, hgt + 3.2), P(hw + o, -dep / 2, hgt + 3.2), [0, 0, wid / 4, 1]);
    gB.face(P(-hw, 0, hgt), P(hw, 0, hgt), P(hw, 0, hgt + 1.6), P(-hw, 0, hgt + 1.6), [0, 0, 1, 1], wallC);
    if (rnd() < 0.5) chim.push(P(hw * 0.5, -dep * 0.3, hgt + 3));
  }
  const chim = [];
  // a lo largo de un tramo: edificios a cierta distancia del borde (calle, riva o canal)
  const walk = (s0, s1, stepM, fn) => { const len = T.wrap(s1 - s0); for (let d = 0, n = 0; d <= len; d += stepM, n++) fn(T.wrap(s0 + d), n); };
  function row(s0, s1, gap, baseY, sides, minK) {
    walk(s0, s1, 10.4, (s, n) => { const o = T.at(s); for (const sg of sides) {
      if (Math.abs(o.kap) > (minK || 0.014) && Math.sign(o.kap) === sg) continue;
      const u = (o.w / 2 + gap) * sg, px = o.px + o.rx * u, pz = o.pz + o.rz * u, fx = -o.rx * sg, fz = -o.rz * sg, cx = px - fx * 5, cz = pz - fz * 5;
      if (placed.some(p => Math.hypot(p[0] - cx, p[1] - cz) < 9.6)) continue; if (T.zone(s, 'air')) continue; if (gap > 9 && (terrain.userData.height(cx, cz) < L + 0.3 || !K.occ.free(cx, cz, 5.5))) continue;
      { const nt = terrain.userData.nearTrack(cx, cz); if (nt && nt.d < T.limits(nt.q.k * T.ds).wall + 5.5) continue; }
      placed.push([cx, cz]); K.occ.occupy(cx, cz, 6.5); const len = Math.hypot(fx, fz); palazzo(px, pz, baseY != null ? baseY : o.py - 0.3, fx / len, fz / len, 10, 10, 9 + rnd() * 6, Math.floor(rnd() * 4));
    } });
  }
  const town = T.zones.find(z => z.type === 'town'), water = T.zones.find(z => z.type === 'water');
  if (town) row(town.s0, town.s1, 0.6, null, [-1, 1], 0.008);
  // el resto de la ciudad: palacios detrás de la baranda (menos en la riva del lado de la laguna y en la rampa)
  const sh = def.shoulder || 5;
  row(T.cp(8.5), T.cp(10.8), sh + 2.5, null, [-1]); row(T.cp(13.9), T.cp(16.5), sh + 2.5, null, [-1, 1]); row(T.cp(20.5), T.cp(22.5), sh + 2.5, null, [-1, 1]);
  if (water) row(water.s0, water.s1, 3.2, L - 1, [-1, 1], 0.02);
  // segunda y tercera fila de palacios: la isla queda llena de ciudad (nada de terreno pelado)
  for (const extra of [11.5, 23]) { if (town) row(town.s0, town.s1, 0.6 + extra, null, [-1, 1], 0.004); row(T.cp(8.5), T.cp(10.8), sh + 2.5 + extra, null, [-1]); row(T.cp(13.9), T.cp(16.5), sh + 2.5 + extra, null, [-1, 1], 0.004); row(T.cp(20.5), T.cp(22.5), sh + 2.5 + extra, null, [-1, 1], 0.004); row(T.cp(22.6), T.cp(3.5), sh + 2.5 + extra, null, [-1], 0.004); }
  row(T.cp(22.6), T.cp(3.5), sh + 2.5, null, [-1]); // la riva: palacios del lado de tierra
  const mF = new THREE.MeshStandardMaterial({ map: atlas, roughness: 0.85 }), mB = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), mR = new THREE.MeshStandardMaterial({ map: roofTex, roughness: 0.8 });
  for (const [g, m] of [[gF, mF], [gB, mB], [gR, mR]]) if (g.i.length) scene.add(new THREE.Mesh(g.build(), m));
  // chimeneas de embudo
  { const cg = new THREE.CylinderGeometry(0.7, 0.35, 1.6, 8).translate(0, 0.8, 0), cm = new THREE.InstancedMesh(cg, new THREE.MeshStandardMaterial({ color: '#b5654a', roughness: 0.9 }), chim.length), M = new THREE.Matrix4(); chim.forEach((p, i) => { M.makeTranslation(p.x, p.y, p.z); cm.setMatrixAt(i, M); }); scene.add(cm); }
  // ---- campanario de ladrillo con techo verde, y basílica de cúpulas junto a la plaza ----
  { const o = T.at(T.cp(9.7)), u = 30, cx = o.px + o.rx * u, cz = o.pz + o.rz * u, y = o.py - 0.3, g = new THREE.Group();
    const brick = new THREE.MeshStandardMaterial({ color: '#b5533c', roughness: 0.9 }), stone = new THREE.MeshStandardMaterial({ color: '#efe6d4', roughness: 0.7 }), green = new THREE.MeshStandardMaterial({ color: '#5f9a7a', roughness: 0.5, metalness: 0.3 }), gold = new THREE.MeshStandardMaterial({ color: '#e8c050', metalness: 0.8, roughness: 0.3 });
    const sh = new THREE.Mesh(new THREE.BoxGeometry(12, 52, 12), brick); sh.position.y = 26; g.add(sh);
    const bell = new THREE.Mesh(new THREE.BoxGeometry(13, 9, 13), stone); bell.position.y = 56.5; g.add(bell);
    for (let k = 0; k < 4; k++) { const a = new THREE.Mesh(new THREE.BoxGeometry(8.5, 6, 0.4), new THREE.MeshStandardMaterial({ color: '#2a2622' })); a.position.set(Math.sin(k * Math.PI / 2) * 6.4, 56.5, Math.cos(k * Math.PI / 2) * 6.4); a.rotation.y = k * Math.PI / 2; g.add(a); }
    const att = new THREE.Mesh(new THREE.BoxGeometry(10.5, 6, 10.5), brick); att.position.y = 64; g.add(att);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(8.2, 15, 4), green); roof.rotation.y = Math.PI / 4; roof.position.y = 74.5; g.add(roof);
    const ang = new THREE.Mesh(new THREE.OctahedronGeometry(1, 0), gold); ang.scale.set(0.8, 1.6, 0.8); ang.position.y = 83.5; g.add(ang);
    g.position.set(cx, y, cz); scene.add(g);
    // basílica: cuerpo y cinco cúpulas
    /* la basílica en el sitio más despejado junto a la plaza; si no cabe entera, un poco más pequeña (nunca encima de la vía) */
    let best = null; for (const fw of [40, 30, 50, 20, 60]) for (let off = 30; off <= 62; off += 4) { const x = o.px + o.rx * off + o.tx * fw, z = o.pz + o.rz * off + o.tz * fw, c = terrain.userData.clearAll(x, z); if (!best || c > best.c + 0.5) best = { x, z, c }; if (c >= 25) break; }
    const bk = clamp((best.c - 1.5) / 22.7, 0.55, 1), b = new THREE.Group(), bx = best.x, bz = best.z; b.scale.setScalar(bk);
    const body = new THREE.Mesh(new THREE.BoxGeometry(34, 18, 30), stone); body.position.y = 9; b.add(body);
    for (const [dx, dz, r] of [[0, 0, 7.5], [-10, -9, 5], [10, -9, 5], [-10, 9, 5], [10, 9, 5]]) { const d = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 12, 0, TAU, 0, Math.PI / 2), green); d.scale.y = 1.25; d.position.set(dx, 18, dz); b.add(d); const lan = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 3, 8), gold); lan.position.set(dx, 18 + r * 1.25 + 1.2, dz); b.add(lan); }
    b.position.set(bx, y, bz); b.lookAt(o.px, y, o.pz); scene.add(b);
  }
  // ---- cafés con sombrillas y mesas en la plaza y la riva ----
  { const tops = [], poles = [], tabs = [], chairs = [], CC = ['#c8202a', '#f2efe6', '#1f4e8a', '#2a7a4a'];
    const spots = []; for (let s = T.cp(8.8); s < T.cp(10.7); s += 7) spots.push([s, 1]); for (let s = T.cp(0.3); s < T.cp(2.8); s += 12) spots.push([s, 1]);
    for (const [s, sg] of spots) { const o = T.at(s), lim = T.limits(s); for (let k = 0; k < 2; k++) { const u = (lim.wall + 2.2 + k * 3.4) * sg, x = o.px + o.rx * u + o.tx * (rnd() - 0.5) * 2, z = o.pz + o.rz * u + o.tz * (rnd() - 0.5) * 2, y = terrain.userData.height(x, z) + 0.2; if (y < L + 0.6 || !K.occ.free(x, z, 1.6)) continue; K.occ.occupy(x, z, 1.6);
      tops.push([x, y, z]); for (const a of [0, Math.PI]) chairs.push([x + Math.cos(a + 0.4) * 0.8, y, z + Math.sin(a + 0.4) * 0.8, a]); } }
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(1, 1, 1), Yv = new THREE.Vector3(0, 1, 0);
    const um = new THREE.InstancedMesh(new THREE.ConeGeometry(1.6, 0.7, 8, 1, true).translate(0, 2.55, 0), new THREE.MeshStandardMaterial({ roughness: 0.8, side: THREE.DoubleSide }), tops.length), pm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 5).translate(0, 1.25, 0), new THREE.MeshStandardMaterial({ color: '#d8d4cc', metalness: 0.5 }), tops.length), tm = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 12).translate(0, 0.75, 0), new THREE.MeshStandardMaterial({ color: '#f4f2ee' }), tops.length);
    tops.forEach((p, i) => { M.makeTranslation(p[0], p[1], p[2]); um.setMatrixAt(i, M); pm.setMatrixAt(i, M); tm.setMatrixAt(i, M); um.setColorAt(i, new THREE.Color(CC[i % 4])); });
    const cm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.42, 0.85, 0.42).translate(0, 0.42, 0), new THREE.MeshStandardMaterial({ color: '#3a2a20', roughness: 0.7 }), chairs.length); chairs.forEach((p, i) => { Q.setFromAxisAngle(Yv, p[3]); M.compose(new THREE.Vector3(p[0], p[1], p[2]), Q, S); cm.setMatrixAt(i, M); });
    for (const m of [um, pm, tm, cm]) { m.castShadow = true; scene.add(m); } }
  // ---- isla con iglesia blanca al fondo de la laguna ----
  { const g = new THREE.Group(), w = new THREE.MeshStandardMaterial({ color: '#f2ece0', roughness: 0.7 }), x = -60, z = 620;
    const isl = new THREE.Mesh(new THREE.CylinderGeometry(90, 100, 4, 24), new THREE.MeshStandardMaterial({ color: '#b9a888', roughness: 1 })); isl.position.y = L - 1; g.add(isl);
    const ch = new THREE.Mesh(new THREE.BoxGeometry(40, 22, 30), w); ch.position.set(0, 11, 0); g.add(ch);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(11, 24, 12, 0, TAU, 0, Math.PI / 2), w); dome.scale.y = 1.3; dome.position.y = 22; g.add(dome);
    const tw = new THREE.Mesh(new THREE.BoxGeometry(7, 48, 7), new THREE.MeshStandardMaterial({ color: '#c96a4c' })); tw.position.set(30, 24, -6); g.add(tw);
    const tc = new THREE.Mesh(new THREE.ConeGeometry(5, 10, 4), new THREE.MeshStandardMaterial({ color: '#5f9a7a' })); tc.rotation.y = Math.PI / 4; tc.position.set(30, 53, -6); g.add(tc);
    g.position.set(x, 0, z); scene.add(g); }
  // ---- góndolas amarradas y postes de rayas a lo largo del canal y la riva ----
  { const hull = new THREE.Shape(); hull.moveTo(-5.5, 0.9); hull.quadraticCurveTo(-3, -0.1, 0, -0.15); hull.quadraticCurveTo(3, -0.1, 5.6, 1.1); hull.lineTo(5.2, 1.1); hull.quadraticCurveTo(0, 0.25, -5.1, 0.9); hull.closePath();
    const hg = new THREE.ExtrudeGeometry(hull, { depth: 1.3, bevelEnabled: false }); hg.translate(0, 0, -0.65);
    const gm = new THREE.InstancedMesh(hg, new THREE.MeshStandardMaterial({ color: '#141418', roughness: 0.35, metalness: 0.2 }), 40), seat = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, 0.35, 1.0), new THREE.MeshStandardMaterial({ color: '#a8202a' }), 40);
    const pg = new THREE.CylinderGeometry(0.16, 0.16, 5, 8).translate(0, 2, 0), pc = canvasTex(16, 64, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#f2f0ea' : (rnd() < 0.5 ? '#c42a2a' : '#2a54b0'); x.fillRect(0, i * 8, w, 8); } }, false), poles = new THREE.InstancedMesh(pg, new THREE.MeshStandardMaterial({ map: pc, roughness: 0.6 }), 80);
    const list = [], M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(1, 1, 1), Y = new THREE.Vector3(0, 1, 0); let ng = 0, np = 0;
    const segs = water ? [[water.s0, water.s1, 2.2]] : [];
    for (const [s0, s1, kind] of segs) walk(s0, s1, kind > 0 ? 22 : 30, s => { const o = T.at(s), sg = rnd() < 0.5 ? -1 : 1, u = kind > 0 ? (o.w / 2 + 3.7) * sg : -(o.w / 2 + 6.5); const x = o.px + o.rx * u, z = o.pz + o.rz * u;
      if (ng < 40) { list.push({ x, z, yaw: Math.atan2(o.tx, o.tz) + Math.PI / 2, ph: rnd() * 6, i: ng++ }); }
      for (const d of [-3, 3]) if (np < 80) { M.makeTranslation(x + o.tx * d + o.rx * Math.sign(u) * 1.2, L - 1, z + o.tz * d + o.rz * Math.sign(u) * 1.2); poles.setMatrixAt(np++, M); } });
    gm.count = seat.count = ng; poles.count = np; scene.add(gm); scene.add(seat); scene.add(poles);
    anim.push(t => { for (const g of list) { const bob = Math.sin(t * 1.3 + g.ph) * 0.08; Q.setFromAxisAngle(Y, g.yaw); M.compose(new THREE.Vector3(g.x, L + 0.1 + bob, g.z), Q, S); gm.setMatrixAt(g.i, M); M.compose(new THREE.Vector3(g.x, L + 0.75 + bob, g.z), Q, S); seat.setMatrixAt(g.i, M); } gm.instanceMatrix.needsUpdate = seat.instanceMatrix.needsUpdate = true; });
  }
  // ---- faroles en la riva ----
  { const pts = []; walk(T.cp(22.6), T.cp(3.2), 24, s => { const o = T.at(s), u = T.limits(s).wall + 0.9; for (const sg of [-1, 1]) pts.push(V3(o.px + o.rx * u * sg, o.py, o.pz + o.rz * u * sg)); });
    const pg = new THREE.CylinderGeometry(0.1, 0.16, 4.2, 6).translate(0, 2.1, 0), lg = new THREE.SphereGeometry(0.35, 10, 8).translate(0, 4.4, 0);
    const pm = new THREE.InstancedMesh(pg, new THREE.MeshStandardMaterial({ color: '#1e2226', metalness: 0.6, roughness: 0.4 }), pts.length), lm = new THREE.InstancedMesh(lg, new THREE.MeshBasicMaterial({ color: '#ffe0a0' }), pts.length), M = new THREE.Matrix4();
    pts.forEach((p, i) => { M.makeTranslation(p.x, p.y, p.z); pm.setMatrixAt(i, M); lm.setMatrixAt(i, M); }); scene.add(pm); scene.add(lm); }
};
