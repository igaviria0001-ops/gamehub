/* =========================================================================
   ESCENARIO DEL GRAN CAÑÓN — mesetas y torres de roca con capas de colores,
   cactus, el mirador de vidrio en herradura sobre el borde, águilas que
   planean y polvo. El cañón mismo lo talla el terreno (ver makeTerrain).
   ========================================================================= */
SCENERY.canon = (scene, T, def, K) => {
  const { Geo, canvasTex, terrain, anim, V3 } = K, rnd = makeRng(57), L = T.lakeY;
  const BAND = ['#b4522e', '#dc9258', '#93391f', '#e8b27a'].map(c => new THREE.Color(c)), tmp = new THREE.Color();
  // ---- torres y mesetas de capas (una sola malla) ----
  const pos = [], col = [], idx = []; let base = 0;
  function butte(x, z, y0, R, H) {
    const seg = 12, prof = [[R * 1.25, -4], [R * 1.15, H * 0.15], [R, H * 0.3], [R * 0.98, H * 0.6], [R * 0.95, H * 0.92], [R * 0.9, H], [0, H]], ph = rnd() * 9;
    for (let j = 0; j < prof.length; j++) for (let i = 0; i < seg; i++) { const a = i / seg * TAU, n = 1 + (fbm2(Math.cos(a) * 1.6 + ph, prof[j][1] / 20, 2) - 0.5) * 0.35, r = prof[j][0] * n, y = prof[j][1];
      pos.push(x + Math.cos(a) * r, y0 + y, z + Math.sin(a) * r); tmp.copy(BAND[(Math.floor((y0 + y) / 5) % 4 + 4) % 4]); if (j === prof.length - 1 || j === prof.length - 2) tmp.lerp(new THREE.Color('#c8a060'), 0.5); col.push(tmp.r, tmp.g, tmp.b); }
    for (let j = 0; j < prof.length - 1; j++) for (let i = 0; i < seg; i++) { const a = base + j * seg + i, b = base + j * seg + (i + 1) % seg, c = base + (j + 1) * seg + (i + 1) % seg, d = base + (j + 1) * seg + i; idx.push(a, d, c, a, c, b); }
    base += prof.length * seg;
  }
  const placed = [];
  for (let i = 0, tries = 0; i < 46 && tries < 3000; tries++) {
    const a = rnd() * TAU, r = 150 + Math.pow(rnd(), 0.6) * 1150, x = Math.cos(a) * r, z = Math.sin(a) * r, R = 14 + rnd() * 40, H = 25 + rnd() * 60, nt = terrain.userData.nearTrack(x, z);
    if (nt && nt.d < T.w[nt.q.k] / 2 + 20 + R * 1.3) continue; if (placed.some(p => Math.hypot(p[0] - x, p[1] - z) < p[2] + R + 10)) continue;
    placed.push([x, z, R]); K.occ.occupy(x, z, R * 1.3); butte(x, z, terrain.userData.height(x, z) - 2, R, H); i++;
  }
  { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); scene.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }))); }
  // ---- cactus (saguaros) en la meseta ----
  { const pts = []; for (let k = 0, t = 0; k < ([100, 160, 300][GQ.lv]) && t < 5000; t++) { const a = rnd() * TAU, r = 30 + rnd() * 900, x = Math.cos(a) * r, z = Math.sin(a) * r, h = terrain.userData.height(x, z), nt = terrain.userData.nearTrack(x, z); if (h < 30 || (nt && nt.d < T.w[nt.q.k] / 2 + 9)) continue; pts.push([x, h, z, 0.7 + rnd() * 0.8, rnd() * TAU]); k++; }
    const trunk = new THREE.CylinderGeometry(0.45, 0.55, 6, 8).translate(0, 3, 0), arm1 = new THREE.CylinderGeometry(0.32, 0.32, 2.4, 6).translate(1.2, 3.6, 0), arm1b = new THREE.CylinderGeometry(0.3, 0.32, 1.4, 6).rotateZ(Math.PI / 2).translate(0.7, 2.6, 0), arm2 = new THREE.CylinderGeometry(0.3, 0.3, 1.8, 6).translate(-1.0, 4.1, 0), arm2b = new THREE.CylinderGeometry(0.28, 0.3, 1.0, 6).rotateZ(Math.PI / 2).translate(-0.5, 3.3, 0);
    const parts = [trunk, arm1, arm1b, arm2, arm2b], m = new THREE.MeshStandardMaterial({ color: '#4a7a3a', roughness: 0.8 }), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
    for (const g of parts) { const im = new THREE.InstancedMesh(g, m, pts.length); pts.forEach((p, i) => { Q.setFromAxisAngle(Y, p[4]); S.setScalar(p[3]); M.compose(new THREE.Vector3(p[0], p[1] - 0.2, p[2]), Q, S); im.setMatrixAt(i, M); }); scene.add(im); } }
  // ---- mirador de vidrio en herradura sobre el borde del cañón ----
  { const wz = T.zones.find(z => z.type === 'water'), o = T.at(T.wrap(wz.s0 + T.wrap(wz.s1 - wz.s0) * 0.5)), dir = new THREE.Vector3(o.rx, 0, o.rz);
    let px = o.px, pz = o.pz, k = 0; for (; k < 200; k += 4) { px = o.px + dir.x * k; pz = o.pz + dir.z * k; if (terrain.userData.height(px, pz) > 30) break; }
    const top = terrain.userData.height(px, pz), g = new THREE.Group(), glass = new THREE.MeshStandardMaterial({ color: '#9fd8ff', transparent: true, opacity: 0.35, metalness: 0.9, roughness: 0.05, side: THREE.DoubleSide }), steel = new THREE.MeshStandardMaterial({ color: '#c8ccd2', metalness: 0.8, roughness: 0.3 });
    const deck = new THREE.Mesh(new THREE.TorusGeometry(14, 1.6, 6, 30, Math.PI), glass); deck.rotation.x = Math.PI / 2; g.add(deck);
    const rail = new THREE.Mesh(new THREE.TorusGeometry(15.4, 0.12, 6, 30, Math.PI), steel); rail.rotation.x = Math.PI / 2; rail.position.y = 1.2; g.add(rail);
    g.position.set(px - dir.x * 6, top + 0.5, pz - dir.z * 6); g.lookAt(px - dir.x * 30, top + 0.5, pz - dir.z * 30); scene.add(g); }
  // ---- águilas que planean en círculos ----
  { const wing = new THREE.Shape(); wing.moveTo(0, 0); wing.lineTo(-2.4, 0.5); wing.lineTo(-1.2, -0.2); wing.lineTo(0, -0.4); wing.lineTo(1.2, -0.2); wing.lineTo(2.4, 0.5); wing.closePath();
    const wg = new THREE.ShapeGeometry(wing); wg.rotateX(-Math.PI / 2); const wm = new THREE.MeshBasicMaterial({ color: '#2a1e18', side: THREE.DoubleSide }), birds = [];
    for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(wg, wm); scene.add(b); birds.push({ b, cx: (rnd() - 0.5) * 600, cz: (rnd() - 0.5) * 600, r: 40 + rnd() * 60, y: 70 + rnd() * 40, ph: rnd() * TAU, sp: 0.15 + rnd() * 0.1 }); }
    anim.push(t => birds.forEach(o => { const a = o.ph + t * o.sp; o.b.position.set(o.cx + Math.cos(a) * o.r, o.y + Math.sin(t * 0.7 + o.ph) * 3, o.cz + Math.sin(a) * o.r); o.b.rotation.set(0, -a, Math.sin(t * 3 + o.ph) * 0.15); })); }
};
