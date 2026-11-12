/* =========================================================================
   ESCENARIO DE EL DORADO — la ciudad de oro de la leyenda muisca: templos
   escalonados de piedra con bandas y techos de oro, discos de sol, tunjos
   (figuras de oro) en pedestales y antorchas en la avenida; el puente de oro
   sobre el valle; la laguna sagrada en un cráter con la Balsa Muisca de oro
   flotando y destellos de ofrendas; el gran aro del sol que se atraviesa
   volando; cascadas en el borde del cráter y polvo de oro en el aire.
   ========================================================================= */
SCENERY.dorado = (scene, T, def, K) => {
  const { Geo, canvasTex, glowTex, terrain, anim, V3 } = K, rnd = makeRng(131), L = T.lakeY, H = (x, z) => terrain.userData.height(x, z);
  const nearD = (x, z) => terrain.userData.clearAll(x, z);
  const gold = new THREE.MeshStandardMaterial({ color: '#f2b830', metalness: 0.9, roughness: 0.3, emissive: '#3a2200', emissiveIntensity: 0.15 });
  const gS = new Geo(), gG = new Geo(), STONE = [new THREE.Color('#cdb88e'), new THREE.Color('#bfa77a'), new THREE.Color('#d8c49a')];
  function box(g, x, y, z, fx, fz, w, d, h, col) { const rx = fz, rz = -fx, P = (a, b, yy) => V3(x + rx * a + fx * b, y + yy, z + rz * a + fz * b), hw = w / 2, hd = d / 2;
    g.face(P(-hw, hd, 0), P(hw, hd, 0), P(hw, hd, h), P(-hw, hd, h), null, col); g.face(P(hw, -hd, 0), P(-hw, -hd, 0), P(-hw, -hd, h), P(hw, -hd, h), null, col);
    g.face(P(hw, hd, 0), P(hw, -hd, 0), P(hw, -hd, h), P(hw, hd, h), null, col); g.face(P(-hw, -hd, 0), P(-hw, hd, 0), P(-hw, hd, h), P(-hw, -hd, h), null, col); g.face(P(-hw, hd, h), P(hw, hd, h), P(hw, -hd, h), P(-hw, -hd, h), null, col); return P; }
  const discs = [];
  // templo escalonado: gradas de piedra con banda de oro, santuario arriba con techo de oro y disco de sol al frente
  function temple(x, y, z, fx, fz, w, steps) { let ww = w, yy = y; const c = STONE[Math.floor(rnd() * 3)];
    for (let i = 0; i < steps; i++) { const h = 2.6 + rnd() * 0.8; box(gS, x, yy, z, fx, fz, ww, ww * 0.8, h, c); box(gG, x, yy + h - 0.35, z, fx, fz, ww + 0.15, ww * 0.8 + 0.15, 0.35); yy += h; ww *= 0.74; }
    box(gS, x, yy, z, fx, fz, ww * 0.9, ww * 0.75, 3, c); const P = box(gG, x, yy + 3, z, fx, fz, ww, ww * 0.85, 0.5); box(gG, x, yy + 3.5, z, fx, fz, ww * 0.6, ww * 0.5, 1.6);
    const q = V3(x + fx * (w * 0.4 + 0.3), y + 2 + steps * 1.5, z + fz * (w * 0.4 + 0.3)); discs.push([q, fx, fz, 1.4 + w * 0.08]); }
  // ---- la avenida de oro (zona de pueblo): templos a lado y lado, tunjos y antorchas ----
  const town = T.zones.find(z => z.type === 'town'), tunjos = [], torches = [];
  for (let s = town.s0 + 6; s < town.s1 + 10; s += 13) for (const sg of [-1, 1]) {
    const o = T.at(T.wrap(s)); if (Math.abs(o.kap) > 0.014 && Math.sign(o.kap) === sg) continue; const w = 9 + rnd() * 5, u = (T.limits(T.wrap(s)).wall + 1.2 + w * 0.4) * sg, x = o.px + o.rx * u, z = o.pz + o.rz * u;
    if (!K.occ.free(x, z, w * 0.45)) continue; K.occ.occupy(x, z, w * 0.5); temple(x, o.py - 0.4, z, -o.rx * sg, -o.rz * sg, w, 2 + (rnd() * 3 | 0));
    const ut = (T.limits(T.wrap(s)).wall + 1.7) * sg, tx = o.px + o.rx * ut + o.tx * 6.5, tz = o.pz + o.rz * ut + o.tz * 6.5; if (rnd() < 0.6) tunjos.push([tx, o.py, tz, Math.atan2(-o.rx * sg, -o.rz * sg)]); else torches.push([tx, o.py, tz]); }
  // templos grandes alrededor de la ciudad
  for (let i = 0, tries = 0; i < 10 && tries < 400; tries++) { const s = town.s0 + rnd() * T.wrap(town.s1 - town.s0), o = T.at(s), sg = rnd() < 0.5 ? -1 : 1, d = T.limits(s).wall + 30 + rnd() * 60, x = o.px + o.rx * d * sg, z = o.pz + o.rz * d * sg, w = 16 + rnd() * 12; if (nearD(x, z) < w * 0.7 || !K.occ.free(x, z, w * 0.6)) continue; K.occ.occupy(x, z, w * 0.7); i++; temple(x, H(x, z) - 0.5, z, -o.rx * sg, -o.rz * sg, w, 3 + (rnd() * 3 | 0)); }
  scene.add(new THREE.Mesh(gS.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }))); scene.add(new THREE.Mesh(gG.build(), gold));
  // discos de sol con rayos
  { const sunT = canvasTex(256, 256, (x, w, h) => { x.clearRect(0, 0, w, h); x.translate(128, 128); x.fillStyle = '#ffd44a'; for (let i = 0; i < 16; i++) { x.rotate(TAU / 16); x.beginPath(); x.moveTo(-10, 70); x.lineTo(0, 124); x.lineTo(10, 70); x.fill(); } x.beginPath(); x.arc(0, 0, 72, 0, TAU); x.fill(); x.fillStyle = '#c88a10'; x.beginPath(); x.arc(0, 0, 58, 0, TAU); x.fill(); x.fillStyle = '#ffe07a'; x.beginPath(); x.arc(0, 0, 50, 0, TAU); x.fill(); x.fillStyle = '#a86a08'; for (const [ex, ey] of [[-18, -10], [18, -10]]) { x.beginPath(); x.arc(ex, ey, 7, 0, TAU); x.fill(); } x.fillRect(-16, 18, 32, 6); }, false);
    const dm = new THREE.MeshStandardMaterial({ map: sunT, transparent: true, alphaTest: 0.4, metalness: 0.85, roughness: 0.25, emissive: '#5a3800', emissiveIntensity: 0.6, side: THREE.DoubleSide });
    PROPS.inst(scene, new THREE.PlaneGeometry(2, 2), dm, discs.map(([q, fx, fz, r]) => [q.x, q.y, q.z, r, Math.atan2(fx, fz), 1]), null, false); }
  // tunjos: figuras planas de oro en pedestal, y antorchas (todo en instancias: pocas llamadas de dibujo en el celular)
  { const parts = [[new THREE.BoxGeometry(0.9, 2.2, 0.18).translate(0, 2.4, 0), gold], [new THREE.BoxGeometry(1.1, 0.8, 0.2).translate(0, 3.9, 0), gold], [new THREE.BoxGeometry(1.4, 0.2, 1.3).translate(0, 2.6, 0).scale(1, 1, 0.1), gold], [new THREE.BoxGeometry(1.4, 0.3, 0.12).translate(0, 4.45, 0), gold], [new THREE.BoxGeometry(1.4, 1.3, 1.4).translate(0, 0.65, 0), new THREE.MeshStandardMaterial({ color: '#8a7650', roughness: 0.8 })]];
    const tl = tunjos.map(([x, y, z, a]) => [x, y - 0.1, z, 1, a, 1]); for (const [g, m] of parts) PROPS.inst(scene, g, m, tl, null, true);
    const tc = torches.map(([x, y, z]) => [x, y, z, 1, 0, 1]); PROPS.inst(scene, new THREE.CylinderGeometry(0.12, 0.18, 3.2, 6).translate(0, 1.6, 0), new THREE.MeshStandardMaterial({ color: '#5a3a1a' }), tc, null, true); PROPS.inst(scene, new THREE.CylinderGeometry(0.45, 0.2, 0.5, 8).translate(0, 3.3, 0), gold, tc, null, false);
    // llamas: puntos que titilan (un solo dibujo para todas)
    const fp = new Float32Array(torches.length * 3); torches.forEach(([x, y, z], i) => fp.set([x, y + 3.9, z], i * 3)); const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3));
    const fm = new THREE.PointsMaterial({ map: glowTex(), color: '#ffa030', size: 2.6, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }); if (torches.length) { const f = new THREE.Points(fg, fm); f.userData.noAudit = true; scene.add(f); anim.push(t => { fm.size = 2.4 + Math.sin(t * 14) * 0.35; }); } }
  // ---- el gran aro del sol al comienzo del vuelo (se pasa por el medio) ----
  { const az = T.zones.find(z => z.type === 'air'), s = T.wrap(az.s0 + 40), o = T.at(s), p = T.pos(s, 0, 10, V3()), ring = new THREE.Mesh(new THREE.TorusGeometry(15, 1.3, 14, 72), gold); ring.position.copy(p); ring.lookAt(p.x + o.tx, p.y + o.ty, p.z + o.tz); ring.userData.noAudit = true; scene.add(ring);
    const rays = new THREE.Group(); for (let i = 0; i < 24; i++) { const r = new THREE.Mesh(new THREE.ConeGeometry(0.9, 5, 4), gold); const a = i / 24 * TAU; r.position.set(Math.cos(a) * 18.5, Math.sin(a) * 18.5, 0); r.rotation.z = a - Math.PI / 2; rays.add(r); } rays.position.copy(p); rays.lookAt(p.x + o.tx, p.y + o.ty, p.z + o.tz); rays.userData.noAudit = true; scene.add(rays);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#ffcc55', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.5 })); halo.position.copy(p); halo.scale.set(60, 60, 1); scene.add(halo);
    anim.push(t => { rays.rotation.z = t * 0.25; halo.material.opacity = 0.4 + 0.15 * Math.sin(t * 2); }); }
  // ---- la laguna sagrada: Balsa Muisca de oro flotando, destellos de ofrendas y cascadas en el borde ----
  { const [bx, bz] = def.raft, raft = new THREE.Group(); const deck = new THREE.Mesh(new THREE.BoxGeometry(22, 1.2, 10), gold); raft.add(deck);
    for (let i = -4; i <= 4; i++) { const log = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 10.4, 8), gold); log.rotation.x = Math.PI / 2; log.position.set(i * 2.4, -0.4, 0); raft.add(log); }
    const fig = (x, z, h, w) => { const f = new THREE.Group(), b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w * 0.4), gold); b.position.y = h / 2; f.add(b); const hd = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, w * 0.8, w * 0.45), gold); hd.position.y = h + w * 0.4; f.add(hd); const cr = new THREE.Mesh(new THREE.BoxGeometry(w * 1.4, w * 0.3, w * 0.2), gold); cr.position.y = h + w * 0.9; f.add(cr); f.position.set(x, 0.6, z); raft.add(f); return f; };
    fig(0, 0, 6, 2.2); for (const [x, z] of [[-7, -3], [-7, 3], [7, -3], [7, 3], [-3.5, -3.6], [3.5, 3.6], [3.5, -3.6], [-3.5, 3.6]]) fig(x, z, 3, 1.2);
    for (const sx of [-10, 10]) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 7, 6), gold); pole.position.set(sx, 4, 0); raft.add(pole); const ban = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshStandardMaterial({ color: '#e8202a', side: THREE.DoubleSide })); ban.position.set(sx + 1.3, 6.6, 0); raft.add(ban); }
    raft.position.set(bx, L + 0.3, bz); raft.scale.setScalar(1.2); scene.add(raft); K.occ.occupy(bx, bz, 18);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: '#ffcc55', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.55 })); glow.position.set(bx, L + 6, bz); glow.scale.set(70, 40, 1); scene.add(glow);
    const gp = []; for (let i = 0; i < 80; i++) { const a = rnd() * TAU, r = 20 + rnd() * 140, x = bx + Math.cos(a) * r, z = bz + Math.sin(a) * r; if (H(x, z) > L - 1 || nearD(x, z) < 4) continue; gp.push(x, L + 0.3, z); }
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); const gm = new THREE.PointsMaterial({ map: glowTex(), color: '#ffe080', size: 1.6, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }); const glints = new THREE.Points(gg, gm); glints.userData.noAudit = true; scene.add(glints);
    anim.push(t => { raft.position.y = L + 0.3 + Math.sin(t * 0.9) * 0.15; raft.rotation.y = 0.3 + Math.sin(t * 0.07) * 0.2; raft.rotation.z = Math.sin(t * 0.7) * 0.015; glow.material.opacity = 0.45 + 0.12 * Math.sin(t * 1.4);
      gm.opacity = 0.55 + 0.45 * Math.sin(t * 2.2); gm.size = 1.2 + 0.8 * Math.abs(Math.sin(t * 1.3)); });
    // cascadas en el borde del cráter
    const wt = canvasTex(64, 256, (cx, w, h) => { cx.fillStyle = '#d8eae4'; cx.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { cx.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.6})`; cx.fillRect(Math.random() * w, Math.random() * h, 2, 12 + Math.random() * 30); } });
    const B = def.terrain.bowl; for (let i = 0; i < 3; i++) { const a = 2.2 + i * 0.7, x = B.x + Math.cos(a) * (B.r + 25), z = B.z + Math.sin(a) * (B.r + 25), top = H(x, z); if (top < L + 8 || nearD(x, z) < 10) continue; const hh = top - L; const f = new THREE.Mesh(new THREE.PlaneGeometry(9, hh), new THREE.MeshStandardMaterial({ map: wt, transparent: true, opacity: 0.9, emissive: '#3a5a50', emissiveIntensity: 0.4, side: THREE.DoubleSide })); f.position.set(x, L + hh / 2, z); f.lookAt(B.x, L + hh / 2, B.z); scene.add(f); anim.push(t => { wt.offset.y = (t * 1.4) % 1; }); } }
  // ---- polvo de oro flotando sobre la ciudad ----
  { const n = [120, 220, 360][GQ.lv], pos = new Float32Array(n * 3), base = []; for (let i = 0; i < n; i++) { const s = town.s0 + rnd() * T.wrap(town.s1 - town.s0 + 200), o = T.at(T.wrap(s)), x = o.px + (rnd() - 0.5) * 120, z = o.pz + (rnd() - 0.5) * 120, y = o.py + 2 + rnd() * 30; base.push([x, y, z, rnd() * 6]); pos.set([x, y, z], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: '#ffd860', size: 0.35, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false })); pts.userData.noAudit = true; scene.add(pts);
    anim.push(t => { for (let i = 0; i < n; i++) { const b = base[i]; pos[i * 3] = b[0] + Math.sin(t * 0.3 + b[3]) * 3; pos[i * 3 + 1] = b[1] + Math.sin(t * 0.5 + b[3] * 2) * 1.5; pos[i * 3 + 2] = b[2] + Math.cos(t * 0.27 + b[3]) * 3; } g.attributes.position.needsUpdate = true; }); }
};
