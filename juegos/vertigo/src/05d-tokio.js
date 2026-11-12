/* =========================================================================
   ESCENARIO DE TOKIO DE NOCHE — rascacielos con ventanas encendidas, calle
   de letreros de neón, cruce peatonal, la Torre de Tokio roja y blanca,
   el puente Arcoíris sobre la bahía, faroles y estrellas.
   ========================================================================= */
SCENERY.tokio = (scene, T, def, K) => {
  const { Geo, canvasTex, glowTex, terrain, anim, V3 } = K, rnd = makeRng(23), L = T.lakeY;
  // ---- ventanas encendidas (se repiten) ----
  const winTex = (tint) => canvasTex(128, 128, (x, w, h) => { x.fillStyle = '#0c1018'; x.fillRect(0, 0, w, h); for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) { const on = Math.random() < 0.55; x.fillStyle = on ? (Math.random() < 0.7 ? tint : '#fff4d8') : '#141a26'; x.fillRect(c * 32 + 4, r * 16 + 4, 24, 9); } });
  const mats = ['#9fd4ff', '#ffe0a0', '#c8b8ff'].map(tint => { const t = winTex(tint); return new THREE.MeshStandardMaterial({ color: '#2a3040', map: t, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.65, roughness: 0.4, metalness: 0.3 }); });
  const gB = [new Geo(), new Geo(), new Geo()], gRoof = new Geo(), roofC = new THREE.Color('#1a1e28'), beacons = [];
  function tower(x, z, y, w, d, h, m, ang = 0) {
    K.occ.occupy(x, z, Math.hypot(w, d) / 2);
    const ca = Math.cos(ang), sa = Math.sin(ang), P = (a, b, c) => V3(x + a * ca - b * sa, y + c, z + a * sa + b * ca), hw = w / 2, hd = d / 2, g = gB[m], uw = Math.max(1, Math.round(w / 14)), ud = Math.max(1, Math.round(d / 14)), vh = Math.max(1, Math.round(h / 11));
    g.face(P(-hw, hd, 0), P(hw, hd, 0), P(hw, hd, h), P(-hw, hd, h), [0, 0, uw, vh]); g.face(P(hw, -hd, 0), P(-hw, -hd, 0), P(-hw, -hd, h), P(hw, -hd, h), [0, 0, uw, vh]);
    g.face(P(hw, hd, 0), P(hw, -hd, 0), P(hw, -hd, h), P(hw, hd, h), [0, 0, ud, vh]); g.face(P(-hw, -hd, 0), P(-hw, hd, 0), P(-hw, hd, h), P(-hw, -hd, h), [0, 0, ud, vh]);
    gRoof.face(P(-hw, hd, h), P(hw, hd, h), P(hw, -hd, h), P(-hw, -hd, h), [0, 0, 1, 1], roofC);
    if (h > 70) beacons.push(V3(x, y + h + 1, z));
  }
  // rascacielos por toda la ciudad, lejos de la pista
  for (let i = 0, tries = 0; i < ([170, 260, 420][GQ.lv]) && tries < 6000; tries++) {
    const a = rnd() * TAU, r = 40 + Math.pow(rnd(), 0.8) * 1050, x = Math.cos(a) * r, z = Math.sin(a) * r - 100, nt = terrain.userData.nearTrack(x, z), gh = terrain.userData.height(x, z);
    if (gh < L + 0.5) continue; const w = 14 + rnd() * 22, d = 14 + rnd() * 22; if (nt && nt.d < T.w[nt.q.k] / 2 + 9 + Math.max(w, d) * 0.7) continue;
    { const ne = terrain.userData.nearElev(x, z); if (ne && ne.d < T.w[ne.q.k] / 2 + 10 + Math.max(w, d) * 0.72) continue; }
    const far = Math.hypot(x, z + 100) / 1100, h = 18 + rnd() * rnd() * 150 * (1.1 - far * 0.5); tower(x, z, gh - 0.5, w, d, h, i % 3); i++;
  }
  // calle de neón (zona de pueblo): edificios pegados con letreros
  const town = T.zones.find(z => z.type === 'town'), NEON = ['#ff2a8a', '#2af0ff', '#ffe02a', '#7a3cff', '#ff6a1a', '#3dff8a'], WORDS = ['RAMEN', 'カラオケ', 'GAME', '東京', 'SUSHI', 'ネオン', 'HOTEL', '24H', 'VÉRTIGO', 'BAR', 'ラーメン', 'ARCADE'];
  const signs = [];
  if (town) for (let d = 8, n = 0; d <= T.wrap(town.s1 - town.s0) - 8; d += 11, n++) { const s = T.wrap(town.s0 + d), o = T.at(s); for (const sg of [-1, 1]) {
    if (Math.abs(o.kap) > 0.01 && Math.sign(o.kap) === sg) continue; const u = (o.w / 2 + 0.6 + 7) * sg, x = o.px + o.rx * u, z = o.pz + o.rz * u, h = 22 + rnd() * 40; tower(x, z, o.py - 0.3, 14, 12, h, (n + (sg > 0 ? 1 : 0)) % 3, Math.atan2(o.rz, o.rx));
    // letrero vertical colgado hacia la calle
    const col = NEON[Math.floor(rnd() * NEON.length)], word = WORDS[Math.floor(rnd() * WORDS.length)], vert = rnd() < 0.55;
    signs.push({ p: V3(o.px + o.rx * (o.w / 2 + 0.2) * sg, o.py + 6 + rnd() * 8, o.pz + o.rz * (o.w / 2 + 0.2) * sg), col, word, vert, face: V3(-o.rx * sg, 0, -o.rz * sg), t: o });
  } }
  gB.forEach((g, i) => { if (g.i.length) scene.add(new THREE.Mesh(g.build(), mats[i])); }); if (gRoof.i.length) scene.add(new THREE.Mesh(gRoof.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 })));
  const signTex = {}; const mkSign = (word, col, vert) => { const k = word + col + vert; return signTex[k] || (signTex[k] = canvasTex(vert ? 64 : 256, vert ? 256 : 64, (x, w, h) => { x.fillStyle = 'rgba(10,8,20,0.9)'; x.fillRect(0, 0, w, h); x.strokeStyle = col; x.lineWidth = 4; x.strokeRect(3, 3, w - 6, h - 6); x.fillStyle = '#fff'; x.shadowColor = col; x.shadowBlur = 14; x.font = `900 ${vert ? 40 : 40}px "Nunito", "Hiragino Sans", "Yu Gothic", "Noto Sans CJK JP", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; if (vert) [...word].slice(0, 5).forEach((ch, i, a) => x.fillText(ch, w / 2, h / 2 + (i - (a.length - 1) / 2) * 46)); else x.fillText(word, w / 2, h / 2 + 2); }, false)); };
  const glowM = (col) => new THREE.SpriteMaterial({ map: glowTex(), color: col, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.55 });
  const flick = [];
  for (const sg of signs) { const tx = mkSign(sg.word, sg.col, sg.vert), m = new THREE.Mesh(new THREE.PlaneGeometry(sg.vert ? 2.2 : 7, sg.vert ? 8.5 : 1.9), new THREE.MeshBasicMaterial({ map: tx, side: THREE.DoubleSide })); m.position.copy(sg.p); const o = sg.t; m.lookAt(sg.p.x + o.tx, sg.p.y, sg.p.z + o.tz); if (!sg.vert) m.lookAt(sg.p.x + sg.face.x, sg.p.y, sg.p.z + sg.face.z); scene.add(m); const gl = new THREE.Sprite(glowM(sg.col)); gl.scale.set(sg.vert ? 7 : 11, sg.vert ? 12 : 5, 1); gl.position.copy(sg.p); scene.add(gl); if (rnd() < 0.3) flick.push(gl); }
  anim.push(t => flick.forEach((g, i) => { g.material.opacity = Math.sin(t * 7 + i * 3) > 0.92 ? 0.1 : 0.55; }));
  // cruce peatonal en la avenida de salida
  { const g = new Geo(), wc = new THREE.Color('#f4f4f0'), s0 = T.cp(1.8), o = T.at(s0); for (let k = -6; k <= 6; k++) { const u0 = k * 1.15 - 0.35, u1 = u0 + 0.7; const P = (s, u) => T.pos(s, u, 0.05, new THREE.Vector3()); g.face(P(s0 - 4, u0), P(s0 - 4, u1), P(s0 + 4, u1), P(s0 + 4, u0), [0, 0, 1, 1], wc); }
    scene.add(new THREE.Mesh(g.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }))); }
  // ---- Torre de Tokio ----
  { const g = new THREE.Group(), red = new THREE.MeshStandardMaterial({ color: '#ff4a1a', emissive: '#ff3a10', emissiveIntensity: 0.55, roughness: 0.5 }), white = new THREE.MeshStandardMaterial({ color: '#f4f0ea', emissive: '#ffd0a0', emissiveIntensity: 0.4 });
    const segs = [[24, 16, 40, red], [16, 9, 40, white], [9, 4.5, 40, red], [4.5, 1.8, 30, white], [1.8, 0.4, 25, red]]; let y = 0;
    segs.forEach(([r0, r1, h, m]) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, h, 4, 1, true), m); c.material.side = THREE.DoubleSide; c.material.wireframe = false; c.position.y = y + h / 2; c.rotation.y = Math.PI / 4; g.add(c); y += h; });
    for (const yy of [72, 118]) { const d = new THREE.Mesh(new THREE.BoxGeometry(yy < 100 ? 22 : 12, 6, yy < 100 ? 22 : 12), white); d.position.y = yy; d.rotation.y = Math.PI / 4; g.add(d); }
    const gl = new THREE.Sprite(glowM('#ff6a2a')); gl.scale.set(90, 190, 1); gl.position.y = 85; gl.material.opacity = 0.3; g.add(gl);
    g.position.set(-520, terrain.userData.height(-520, -520), -520); scene.add(g); }
  // ---- puente Arcoíris sobre la bahía ----
  { const wz = T.zones.find(z => z.type === 'water'); if (wz) { const s = T.wrap(wz.s0 + T.wrap(wz.s1 - wz.s0) * 0.62), o = T.at(s), g = new THREE.Group(), span = 150, H = 24;
    const conc = new THREE.MeshStandardMaterial({ color: '#d8d8dc', emissive: '#ffffff', emissiveIntensity: 0.15, roughness: 0.6 });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(14, 2, span * 2.4), conc); deck.position.y = H; g.add(deck);
    for (const sz of [-span / 2, span / 2]) { for (const sx of [-6, 6]) { const tw = new THREE.Mesh(new THREE.BoxGeometry(2.5, 70, 2.5), conc); tw.position.set(sx, 35, sz); g.add(tw); } const cb = new THREE.Mesh(new THREE.BoxGeometry(14, 2, 2), conc); cb.position.set(0, 66, sz); g.add(cb); }
    const cableP = []; for (const sx of [-6, 6]) for (let i = 0; i <= 40; i++) { const zz = -span * 1.2 + i / 40 * span * 2.4, mid = Math.abs(zz) < span / 2 ? 66 - Math.cos(zz / (span / 2) * Math.PI / 2) * 36 : 66 - (Math.abs(zz) - span / 2) / (span * 0.7) * 40; cableP.push(V3(sx, mid, zz)); }
    const lights = new THREE.Points(new THREE.BufferGeometry().setFromPoints(cableP), new THREE.PointsMaterial({ color: '#ffffff', size: 3, sizeAttenuation: false, vertexColors: false }));
    const rainbow = new Float32Array(cableP.length * 3), c = new THREE.Color(); cableP.forEach((p, i) => { c.setHSL((i % 41) / 41, 0.9, 0.62); rainbow.set([c.r, c.g, c.b], i * 3); }); lights.geometry.setAttribute('color', new THREE.BufferAttribute(rainbow, 3)); lights.material.vertexColors = true; g.add(lights);
    g.position.set(o.px, L, o.pz); g.lookAt(o.px + o.rx, L, o.pz + o.rz); scene.add(g);
    anim.push(t => { lights.material.size = 3 + Math.sin(t * 2) * 0.6; }); } }
  // ---- faroles por la orilla de la pista (no en la autopista ni en el agua) ----
  { const pts = []; for (let k = 0; k < T.N; k += 14) { const s = k * T.ds; if (T.zone(s, 'elev') || T.zone(s, 'water') || T.zone(s, 'air') || T.zone(s, 'town')) continue; const o = T.at(s), u = o.w / 2 + (def.shoulder || 5) + 1; for (const sg of [-1, 1]) pts.push(V3(o.px + o.rx * u * sg, o.py, o.pz + o.rz * u * sg)); }
    const pg = new THREE.CylinderGeometry(0.12, 0.18, 7, 6).translate(0, 3.5, 0), lg = new THREE.SphereGeometry(0.4, 8, 6).translate(0, 7.1, 0);
    const pm = new THREE.InstancedMesh(pg, new THREE.MeshStandardMaterial({ color: '#2a2e34', metalness: 0.6 }), pts.length), lm = new THREE.InstancedMesh(lg, new THREE.MeshBasicMaterial({ color: '#ffe8b0' }), pts.length), M = new THREE.Matrix4();
    pts.forEach((p, i) => { M.makeTranslation(p.x, p.y, p.z); pm.setMatrixAt(i, M); lm.setMatrixAt(i, M); }); scene.add(pm); scene.add(lm);
    const gm = glowM('#ffd890'); gm.opacity = 0.35; for (let i = 0; i < pts.length; i += 2) { const sp = new THREE.Sprite(gm); sp.scale.set(6, 6, 1); sp.position.copy(pts[i]).add(V3(0, 7.1, 0)); scene.add(sp); } }
  // ---- postes de luz con cables (tan de Tokio) y máquinas expendedoras encendidas ----
  { const poles = [], wires = [], vend = [];
    for (const sg of [-1, 1]) { let prev = null; for (let k = 0; k < T.N; k += 15) { const s = k * T.ds; if (T.zone(s, 'elev') || T.zone(s, 'water') || T.zone(s, 'air')) { prev = null; continue; } const o = T.at(s), u = (T.limits(s).wall + 1.6) * sg, x = o.px + o.rx * u, z = o.pz + o.rz * u, y = terrain.userData.height(x, z);
      if (!K.occ.free(x, z, 0.8)) { prev = null; continue; } K.occ.occupy(x, z, 0.8); const top = V3(x, y + 9.2, z); poles.push([x, y, z, Math.atan2(o.rx, o.rz)]);
      if (prev && prev.distanceTo(top) < 45) for (const dy of [0, -0.6]) { const a = prev.clone().add(V3(0, dy, 0)), b = top.clone().add(V3(0, dy, 0)); for (let i = 0; i < 8; i++) { const t0 = i / 8, t1 = (i + 1) / 8, sag = t => Math.sin(t * Math.PI) * 1.1; const p0 = a.clone().lerp(b, t0), p1 = a.clone().lerp(b, t1); p0.y -= sag(t0); p1.y -= sag(t1); wires.push(p0, p1); } }
      prev = top; if (rnd() < 0.18) vend.push([x + o.tx * 2.2, y, z + o.tz * 2.2, Math.atan2(-o.rx * sg, -o.rz * sg)]); } }
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(1, 1, 1), Yv = V3(0, 1, 0);
    const pg = new THREE.CylinderGeometry(0.16, 0.2, 9.4, 6).translate(0, 4.7, 0), cg = new THREE.BoxGeometry(2.2, 0.12, 0.12).translate(0, 8.7, 0);
    for (const [g, c] of [[pg, '#6a6a66'], [cg, '#4a4a48']]) { const m = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }), poles.length); poles.forEach((p, i) => { Q.setFromAxisAngle(Yv, p[3]); M.compose(V3(p[0], p[1], p[2]), Q, S); m.setMatrixAt(i, M); }); scene.add(m); }
    if (wires.length) scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(wires), new THREE.LineBasicMaterial({ color: '#111216' })));
    const vt = canvasTex(64, 128, (x, w, h) => { x.fillStyle = '#e8eef6'; x.fillRect(0, 0, w, h); x.fillStyle = '#d82a2a'; x.fillRect(0, 0, w, 14); for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { x.fillStyle = ['#2a7bd4', '#ff7a1a', '#19c38c', '#ffd23d', '#c42a7a'][(r * 4 + c) % 5]; x.fillRect(5 + c * 14, 22 + r * 22, 10, 16); } x.fillStyle = '#1a1e26'; x.fillRect(6, 92, 52, 26); }, false);
    const vm = new THREE.InstancedMesh(new THREE.BoxGeometry(1.0, 1.9, 0.8).translate(0, 0.95, 0), new THREE.MeshStandardMaterial({ map: vt, emissive: '#ffffff', emissiveMap: vt, emissiveIntensity: 0.8, roughness: 0.4 }), vend.length);
    vend.forEach((p, i) => { Q.setFromAxisAngle(Yv, p[3]); M.compose(V3(p[0], p[1], p[2]), Q, S); vm.setMatrixAt(i, M); }); scene.add(vm); }
  // luces rojas de aviso en los rascacielos altos, y estrellas
  { const bm = new THREE.Points(new THREE.BufferGeometry().setFromPoints(beacons), new THREE.PointsMaterial({ color: '#ff3030', size: 4, sizeAttenuation: false })); scene.add(bm); anim.push(t => { bm.material.opacity = 0.4 + 0.6 * (Math.sin(t * 2.5) > 0 ? 1 : 0); bm.material.transparent = true; });
    const sp = []; for (let i = 0; i < 700; i++) { const a = rnd() * TAU, e = 0.12 + rnd() * 1.3; sp.push(V3(Math.cos(a) * Math.cos(e) * 3500, Math.sin(e) * 3500, Math.sin(a) * Math.cos(e) * 3500)); }
    scene.add(new THREE.Points(new THREE.BufferGeometry().setFromPoints(sp), new THREE.PointsMaterial({ color: '#dfe8ff', size: 1.6, sizeAttenuation: false, fog: false }))); }
};
