/* =========================================================================
   OBJETOS EN 3D — cajas de cristal con «?», cohetes, avispas, aceite, cocos,
   niebla, fuego, escudo y aura de especial. Íconos 2D para el HUD.
   ========================================================================= */
const ItemArt = (() => {
  let scene = null, T = null, boxes = [], mats = null, live = new Map(), carFx = [], bolts = [], deco = null, lamps = [], crowd = [], crowdM = null;
  const M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), S4 = new THREE.Vector3(), P4 = new THREE.Vector3(), UPV = new THREE.Vector3(0, 1, 0);
  const V = new THREE.Vector3(), V2 = new THREE.Vector3();
  function mk() {
    if (mats) return;
    const q = GFX.canvasTex(128, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(160,255,220,0.95)'); g.addColorStop(1, 'rgba(20,160,110,0.9)'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.strokeStyle = '#fff'; x.lineWidth = 8; x.strokeRect(4, 4, w - 8, h - 8); x.font = '400 92px "Russo One", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.shadowColor = '#0a5'; x.shadowBlur = 10; x.fillText('?', w / 2, h / 2 + 6); }, false);
    const wasp = GFX.canvasTex(64, 32, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#141414' : '#ffcc1a'; x.fillRect(i * 8, 0, 8, h); } }, false);
    const oil = GFX.canvasTex(128, 128, (x, w, h) => { const g = x.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(20,16,30,0.95)'); g.addColorStop(0.55, 'rgba(40,30,70,0.92)'); g.addColorStop(0.75, 'rgba(90,40,140,0.7)'); g.addColorStop(0.85, 'rgba(30,140,160,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.beginPath(); for (let a = 0; a < TAU; a += 0.3) { const r = 50 + Math.sin(a * 3) * 8 + Math.random() * 6; x.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } x.fill(); }, false);
    const coco = GFX.canvasTex(64, 64, (x, w, h) => { x.fillStyle = '#6b3d1c'; x.fillRect(0, 0, w, h); for (let i = 0; i < 300; i++) { x.strokeStyle = `rgba(${150 + Math.random() * 60},${90 + Math.random() * 40},50,0.6)`; x.beginPath(); const px = Math.random() * w, py = Math.random() * h; x.moveTo(px, py); x.lineTo(px + (Math.random() - 0.5) * 8, py + Math.random() * 6); x.stroke(); } }, false);
    const cloud = GFX.canvasTex(128, 128, (x, w, h) => { for (let k = 0; k < 18; k++) { const cx = 30 + Math.random() * 68, cy = 30 + Math.random() * 68, r = 20 + Math.random() * 26, g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, 'rgba(235,238,245,0.55)'); g.addColorStop(1, 'rgba(235,238,245,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); } }, false);
    mats = {
      box: new THREE.MeshStandardMaterial({ map: q, emissive: '#2aff9a', emissiveMap: q, emissiveIntensity: 0.55, transparent: true, opacity: 0.88, roughness: 0.15, metalness: 0.2 }),
      red: new THREE.MeshStandardMaterial({ color: '#e8302a', metalness: 0.4, roughness: 0.35 }), gold: new THREE.MeshStandardMaterial({ color: '#ffd23d', metalness: 0.7, roughness: 0.3 }), dark: new THREE.MeshStandardMaterial({ color: '#202228', roughness: 0.5 }),
      wasp: new THREE.MeshStandardMaterial({ map: wasp, roughness: 0.5 }), wing: new THREE.MeshBasicMaterial({ color: '#dff4ff', transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }),
      oil: new THREE.MeshBasicMaterial({ map: oil, transparent: true, depthWrite: false }), wave: new THREE.MeshBasicMaterial({ map: oil, color: '#7fe0ff', transparent: true, depthWrite: false }),
      coco: new THREE.MeshStandardMaterial({ map: coco, roughness: 0.9 }), cloud: new THREE.SpriteMaterial({ map: cloud, transparent: true, depthWrite: false, opacity: 0.9 }),
      fire: new THREE.SpriteMaterial({ map: GFX.glowTex(), color: '#ff7a1a', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }),
      flame: new THREE.SpriteMaterial({ map: GFX.glowTex(), color: '#ffb84a', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }),
      glow: new THREE.SpriteMaterial({ map: GFX.glowTex(), color: '#7dffc8', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.6 }),
      shield: new THREE.MeshBasicMaterial({ color: '#62c8ff', transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
      bolt: new THREE.LineBasicMaterial({ color: '#fff7b0' }),
    };
    for (const k of ['red', 'gold', 'dark', 'wasp', 'coco', 'box']) GFX.linearize(new THREE.Mesh(new THREE.BoxGeometry(), mats[k]));
  }
  const geo = {};
  /* corona dorada del campeón (flota sobre su bólido) */
  let _crown = null;
  function crownTex() { return _crown || (_crown = GFX.canvasTex(128, 100, (x, w, h) => { const path = () => { x.beginPath(); x.moveTo(14, 84); x.lineTo(8, 26); x.lineTo(36, 52); x.lineTo(64, 12); x.lineTo(92, 52); x.lineTo(120, 26); x.lineTo(114, 84); x.closePath(); };
    path(); x.lineWidth = 12; x.strokeStyle = '#0d1018'; x.lineJoin = 'round'; x.stroke(); const g = x.createLinearGradient(0, 10, 0, 90); g.addColorStop(0, '#fff3a0'); g.addColorStop(0.5, '#ffc83a'); g.addColorStop(1, '#d88a10'); path(); x.fillStyle = g; x.fill();
    x.fillStyle = '#0d1018'; x.fillRect(12, 70, 104, 16); x.fillStyle = '#ffd23d'; x.fillRect(15, 72, 98, 11); for (const [cx, cl] of [[34, '#ff3a5a'], [64, '#3dffa8'], [94, '#4a8aff']]) { x.beginPath(); x.arc(cx, 77, 5, 0, TAU); x.fillStyle = cl; x.fill(); }
    for (const [cx, cy] of [[8, 26], [64, 12], [120, 26]]) { x.beginPath(); x.arc(cx, cy, 7, 0, TAU); x.fillStyle = '#0d1018'; x.fill(); x.beginPath(); x.arc(cx, cy, 4.5, 0, TAU); x.fillStyle = '#fff6c0'; x.fill(); } }, false)); }
  function makeMesh(z) {
    const g = new THREE.Group();
    if (z.k === 'rocket') {
      const body = new THREE.Mesh(geo.rb || (geo.rb = new THREE.CylinderGeometry(0.22, 0.22, 1.3, 12).rotateX(Math.PI / 2)), mats.red); g.add(body);
      const nose = new THREE.Mesh(geo.rn || (geo.rn = new THREE.ConeGeometry(0.22, 0.5, 12).rotateX(Math.PI / 2)), mats.gold); nose.position.z = 0.9; g.add(nose);
      for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(geo.rf || (geo.rf = new THREE.BoxGeometry(0.04, 0.4, 0.35)), mats.dark); f.position.z = -0.5; f.rotation.z = i * TAU / 3; f.translateY(0.25); g.add(f); }
      const fl = new THREE.Sprite(mats.flame); fl.scale.set(1.4, 1.4, 1); fl.position.z = -0.9; g.add(fl);
    } else if (z.k === 'wasp') {
      const b = new THREE.Mesh(geo.wb || (geo.wb = new THREE.SphereGeometry(0.45, 14, 10).scale(0.8, 0.8, 1.4)), mats.wasp); g.add(b);
      const st = new THREE.Mesh(geo.ws || (geo.ws = new THREE.ConeGeometry(0.12, 0.4, 8).rotateX(-Math.PI / 2)), mats.dark); st.position.z = -0.8; g.add(st);
      for (const sx of [-1, 1]) { const w = new THREE.Mesh(geo.ww || (geo.ww = new THREE.PlaneGeometry(0.9, 0.4)), mats.wing); w.position.set(sx * 0.5, 0.35, 0); w.userData.flap = sx; g.add(w); }
      const gl = new THREE.Sprite(mats.flame); gl.scale.set(2, 2, 1); g.add(gl);
    } else if (z.k === 'oil') { const m = new THREE.Mesh(geo.oil || (geo.oil = new THREE.PlaneGeometry(4.6, 4.6).rotateX(-Math.PI / 2)), z.wave ? mats.wave : mats.oil); m.position.y = 0.06; g.add(m); }
    else if (z.k === 'coco') { const m = new THREE.Mesh(geo.coco || (geo.coco = new THREE.SphereGeometry(0.75, 14, 10)), mats.coco); m.position.y = 0.75; g.add(m); }
    else if (z.k === 'fog') { for (let i = 0; i < 3; i++) { const sp = new THREE.Sprite(mats.cloud); const sc = 13 + Math.random() * 6; sp.scale.set(sc, sc * 0.7, 1); sp.position.set((Math.random() - 0.5) * 12, 2 + Math.random() * 3, (Math.random() - 0.5) * 14); g.add(sp); } }
    else if (z.k === 'fire') { const sp = new THREE.Sprite(z.neon ? (mats.neon || (mats.neon = new THREE.SpriteMaterial({ map: GFX.glowTex(), color: '#ff3df0', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }))) : mats.fire); sp.scale.set(3, 3.6, 1); sp.position.y = 1; g.add(sp);
      if (z.neon) { const c2 = new THREE.Sprite(mats.neon2 || (mats.neon2 = new THREE.SpriteMaterial({ map: GFX.glowTex(), color: '#5af0ff', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }))); c2.scale.set(1.4, 2.2, 1); c2.position.y = 0.8; g.add(c2); } }
    scene.add(g); return g;
  }
  function init(sc, R) {
    mk(); scene = sc; T = R.track;
    for (const b of boxes) scene.remove(b.m); boxes = [];
    for (const [, m] of live) scene.remove(m); live.clear();
    for (const f of carFx) { scene.remove(f.shield); scene.remove(f.aura); if (f.crown) scene.remove(f.crown); } carFx = [];
    for (const b of bolts) scene.remove(b.l); bolts = [];
    const bg = geo.box || (geo.box = new THREE.BoxGeometry(1.5, 1.5, 1.5));
    for (const b of R.boxes) { const m = new THREE.Mesh(bg, mats.box), gl = new THREE.Sprite(mats.glow); gl.scale.set(3.4, 3.4, 1); const g = new THREE.Group(); g.add(m); g.add(gl); scene.add(g); boxes.push({ b, m: g, cube: m }); }
    // semáforo de salida colgado del arco de meta
    if (deco) scene.remove(deco); deco = new THREE.Group(); scene.add(deco); lamps = [];
    { const f = T.at(0), H = 7.5 - 1.35, P0 = new THREE.Vector3(f.px - f.tx * 0.45, f.py + H, f.pz - f.tz * 0.45);
      const box = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.2, 0.5), mats.dark); box.position.copy(P0); box.lookAt(P0.x + f.tx, P0.y, P0.z + f.tz); deco.add(box);
      for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(geo.lamp || (geo.lamp = new THREE.SphereGeometry(0.42, 14, 10)), new THREE.MeshBasicMaterial({ color: '#2a0d0d' })); m.position.copy(P0).add(new THREE.Vector3(f.rx * (k - 1.5) * 1.45 - f.tx * 0.3, 0, f.rz * (k - 1.5) * 1.45 - f.tz * 0.3)); deco.add(m); const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: GFX.glowTex(), color: '#ff2a2a', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 })); gl.scale.set(3, 3, 1); gl.position.copy(m.position); deco.add(gl); lamps.push({ m, gl }); } }
    // público en los andenes (o detrás de la baranda) cerca de la meta: piernas, torso, cabeza y brazos que se levantan cuando pasan los bólidos
    { const n = [40, 70, 150][GQ.lv], legs = new THREE.CylinderGeometry(0.16, 0.13, 0.8, 7).translate(0, 0.4, 0), torso = new THREE.CylinderGeometry(0.2, 0.25, 0.62, 8).translate(0, 1.11, 0), head = new THREE.SphereGeometry(0.15, 10, 8).translate(0, 1.58, 0);
      const arms = new THREE.BufferGeometry(); { const a1 = new THREE.CylinderGeometry(0.055, 0.05, 0.6, 5).translate(0.27, 0.3, 0), a2 = a1.clone().translate(-0.54, 0, 0); const p1 = a1.toNonIndexed(), p2 = a2.toNonIndexed(); const pos = new Float32Array(p1.attributes.position.count * 6); pos.set(p1.attributes.position.array, 0); pos.set(p2.attributes.position.array, p1.attributes.position.count * 3); arms.setAttribute('position', new THREE.BufferAttribute(pos, 3)); arms.computeVertexNormals(); }
      const mk = g => new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ roughness: 0.8 }), n), mL = mk(legs), mT = mk(torso), mH = mk(head), mA = mk(arms);
      const SK = ['#f1c9a5', '#d9a477', '#a8693f', '#7a4a2a', '#e8b98f'], SH = ['#ff3d6e', '#ffd23d', '#19c3ff', '#19e68c', '#ff7a1a', '#ffffff', '#7a3cff', '#e8202a', '#2a7bd4'], PA = ['#2a2e3a', '#3a5a8a', '#1a1a1e', '#6a5a40', '#e8e4d8'], col = new THREE.Color(); crowd = [];
      for (let i = 0; i < n; i++) { const sg = i % 2 ? 1 : -1, s = T.wrap(-70 + Math.random() * 150), o = T.at(s), lim = T.limits(s), u0 = T.zone(s, 'town') ? o.w / 2 + 0.6 : lim.wall + 0.8, u = sg * (u0 + Math.random() * 1.7); crowd.push({ s, u, y: o.py + (T.zone(s, 'town') ? 0.18 : 0), x: o.px + o.rx * u, z: o.pz + o.rz * u, ph: Math.random() * TAU, sc: 0.88 + Math.random() * 0.24, yaw: Math.atan2(-o.rx * sg, -o.rz * sg) });
        const sk = col.set(SK[(i * 7) % SK.length]); mH.setColorAt(i, sk); mA.setColorAt(i, col.set(SH[i % SH.length])); mT.setColorAt(i, col.set(SH[i % SH.length])); mL.setColorAt(i, col.set(PA[(i * 3) % PA.length])); }
      for (const m of [mL, mT, mH, mA]) { GFX.linearize(m); m.castShadow = GQ.lv === 2; m.frustumCulled = false; deco.add(m); } crowdM = [mL, mT, mH, mA]; }
    for (const c of R.cars) { const sh = new THREE.Mesh(geo.sh || (geo.sh = new THREE.SphereGeometry(1, 20, 14).scale(1.7, 1.25, 2.9)), mats.shield); sh.visible = false; scene.add(sh); const au = new THREE.Sprite(new THREE.SpriteMaterial({ map: GFX.glowTex(), color: '#ffffff', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); au.visible = false; au.scale.set(7, 7, 1); scene.add(au); let cr = null; if (c.elite) { cr = new THREE.Sprite(new THREE.SpriteMaterial({ map: crownTex(), transparent: true, depthWrite: false, depthTest: false })); cr.scale.set(1.9, 1.5, 1); cr.renderOrder = 5; scene.add(cr); } carFx.push({ shield: sh, aura: au, crown: cr }); }
  }
  function update(R, meshes, events, t, dt) {
    if (!scene) return;
    for (const e of boxes) { const vis = !(e.b.gone > 0); e.m.visible = vis; if (vis) { T.pos(e.b.s, e.b.u, T.groundH(e.b.s, e.b.u) + 1.3 + Math.sin(t * 2.4 + e.b.u) * 0.2, V); e.m.position.copy(V); e.cube.rotation.set(t * 0.9, t * 1.3 + e.b.u, 0.4); } }
    // trampas y proyectiles
    const seen = new Set();
    for (const z of R.hz) {
      seen.add(z); let m = live.get(z); if (!m) { m = makeMesh(z); live.set(z, m); }
      T.pos(z.s, z.u, z.h, V); m.position.copy(V); const o = T.at(z.s);
      if (z.k === 'rocket' || z.k === 'wasp') { const dir = z.vs >= 0 ? 1 : -1; m.lookAt(V.x + o.tx * dir, V.y + o.ty * dir, V.z + o.tz * dir); if (z.k === 'wasp') m.children.forEach(c => { if (c.userData.flap) c.rotation.z = c.userData.flap * Math.sin(t * 60) * 0.6; }); }
      else if (z.k === 'oil') { const k = Math.min(1, z.age / 0.3); m.scale.set(k, 1, k); m.lookAt(V.x + o.tx, V.y, V.z + o.tz); }
      else if (z.k === 'coco') m.children[0].rotation.x += dt * 6;
      else if (z.k === 'fire') { const f = 0.8 + Math.random() * 0.4, a = clamp(z.life / 1, 0, 1); m.children[0].scale.set(3 * f * a, 3.6 * f * a, 1); }
      else if (z.k === 'fog') { const a = clamp(z.life / 1.5, 0, 1) * clamp(z.age / 0.5, 0, 1); m.children.forEach(c => c.material.opacity = 0.9 * a); }
    }
    for (const [z, m] of live) if (!seen.has(z)) { scene.remove(m); live.delete(z); }
    // escudo y aura de especial / imán
    R.cars.forEach((c, i) => {
      const f = carFx[i], m = meshes[i]; if (!f || !m) return; const on = c.respawnT <= 0;
      f.shield.visible = on && c.shieldT > 0; if (f.shield.visible) { f.shield.position.copy(m.root.position); f.shield.position.y += 0.7; f.shield.quaternion.copy(m.root.quaternion); f.shield.material.opacity = 0.22 + 0.08 * Math.sin(t * 8) + (c.shieldT < 2 ? 0.15 * Math.sin(t * 30) : 0); }
      const sp = c.specT > 0 ? SPECIALS[c.pid] : null, mag = c.magnetT > 0;
      f.aura.visible = on && (!!sp || mag || !!c.elite); if (f.aura.visible) { f.aura.position.copy(m.root.position); f.aura.position.y += 0.8; f.aura.material.color.set(sp ? sp.col : mag ? '#ff4040' : '#ffc83a'); f.aura.material.opacity = sp || mag ? 0.45 + 0.25 * Math.sin(t * 14) : 0.55 + 0.15 * Math.sin(t * 5); f.aura.scale.setScalar(sp || mag ? 6 + Math.sin(t * 10) : 5.2 + Math.sin(t * 4) * 0.5); }
      if (f.crown) { f.crown.visible = on && !c.finished; if (f.crown.visible) { f.crown.position.copy(m.root.position); f.crown.position.y += 2.5 + Math.sin(t * 3) * 0.15; f.crown.material.rotation = Math.sin(t * 2) * 0.12; } }
      if (c.elite && on && Math.random() < 0.5) { const p = m.root.position; FX.emit('glow', p.x + (Math.random() - 0.5) * 2, p.y + 0.6 + Math.random(), p.z + (Math.random() - 0.5) * 2, 1, { c: [[1, 0.85, 0.3], [1, 1, 0.8]], sp: 0.6, up: 1.5, size: 0.28, life: 0.7, drag: 1 }); }
      if (c.invT > 0 && !c.specT) m.root.visible = on && Math.sin(t * 40) > -0.3;
    });
    // semáforo: rojas una a una, verdes al ¡YA!
    if (lamps.length) { const n = R.state === 'count' ? Math.ceil(R.countT) : 0, go = R.state !== 'count' && R.time < 2; lamps.forEach((l, k) => { const on = go || (R.state === 'count' && n <= 3 && k < 4 - n); const c = go ? '#2aff7a' : '#ff2a2a'; l.m.material.color.set(on ? c : '#2a0d0d'); l.gl.material.color.set(c); l.gl.material.opacity = on ? 0.9 : 0; }); }
    // público: brincos cuando hay bólidos cerca
    if (crowdM) { const near = s => R.cars.some(c => Math.abs(T.wrap(c.s - s + T.L / 2) - T.L / 2) < 28); const MA = new THREE.Matrix4(), MR = new THREE.Matrix4(), MS = new THREE.Matrix4();
      crowd.forEach((p, i) => { const ex = near(p.s) || R.state === 'done' ? 1 : 0.2, j = Math.max(0, Math.sin(t * (6 + (i % 5)) + p.ph)) * 0.3 * ex; P4.set(p.x, p.y + j, p.z); S4.set(p.sc, p.sc, p.sc); Q4.setFromAxisAngle(UPV, p.yaw); M4.compose(P4, Q4, S4); for (let k = 0; k < 3; k++) crowdM[k].setMatrixAt(i, M4);
        const up = ex > 0.5 ? 0.25 + Math.sin(t * 9 + p.ph) * 0.2 : Math.PI - 0.15; MS.makeTranslation(0, 1.36, 0); MR.makeRotationX(-up); MA.multiplyMatrices(M4, MS).multiply(MR); crowdM[3].setMatrixAt(i, MA); });
      for (const m of crowdM) m.instanceMatrix.needsUpdate = true; }
    // rayos
    for (const e of events) if (e.type === 'hit' && e.kind === 'bolt') { const m = meshes[e.car]; if (!m) continue; const p = m.root.position, pts = []; let x = p.x, z = p.z; for (let y = p.y + 60; y > p.y; y -= 6) { pts.push(new THREE.Vector3(x, y, z)); x += (Math.random() - 0.5) * 4; z += (Math.random() - 0.5) * 4; } pts.push(p.clone()); const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mats.bolt); scene.add(l); bolts.push({ l, t: 0.35 }); }
    for (let i = bolts.length - 1; i >= 0; i--) { bolts[i].t -= dt; if (bolts[i].t <= 0) { scene.remove(bolts[i].l); bolts.splice(i, 1); } }
  }
  /* ---------- íconos 2D (HUD y botón táctil): ilustraciones con volumen, contorno, brillos y halo,
     dibujadas una sola vez en alta resolución y guardadas (por cuadro solo se copian) ---------- */
  const ICON_COL = { rocket: '#ff5a3a', rocket3: '#ff7a2a', wasp: '#ffd21a', oil: '#a46aff', coco: '#d08a48', shield: '#5ac8ff', chile: '#ff3a2a', magnet: '#ff4a6a', fog: '#cfe0ff', emerald: '#2affa0', bolt: '#ffe14a' };
  const iconCache = {};
  function lg(x, x0, y0, x1, y1, stops) { const g = x.createLinearGradient(x0, y0, x1, y1); stops.forEach((c, i) => g.addColorStop(Array.isArray(c) ? c[0] : i / (stops.length - 1), Array.isArray(c) ? c[1] : c)); return g; }
  function rg(x, cx, cy, r0, r1, stops, cx1 = cx, cy1 = cy) { const g = x.createRadialGradient(cx, cy, r0, cx1, cy1, r1); stops.forEach((c, i) => g.addColorStop(Array.isArray(c) ? c[0] : i / (stops.length - 1), Array.isArray(c) ? c[1] : c)); return g; }
  const INK = '#0d1018';
  // contorno grueso oscuro debajo y relleno encima (estilo de calcomanía)
  function ink(x, path, fill, lw = 7) { path(); x.lineWidth = lw; x.strokeStyle = INK; x.stroke(); path(); x.fillStyle = fill; x.fill(); }
  function sparkle(x, cx, cy, r, a = 1) { x.save(); x.globalAlpha = a; x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(cx, cy - r); x.quadraticCurveTo(cx, cy, cx + r, cy); x.quadraticCurveTo(cx, cy, cx, cy + r); x.quadraticCurveTo(cx, cy, cx - r, cy); x.quadraticCurveTo(cx, cy, cx, cy - r); x.fill(); x.restore(); }
  function drawRocket(x, dx, dy, a, k) {
    x.save(); x.translate(dx, dy); x.rotate(a); x.scale(k, k);
    // llama
    x.fillStyle = rg(x, 0, 24, 1, 26, [[0, '#ffffff'], [0.3, '#fff2a0'], [0.6, '#ff9a2a'], [1, 'rgba(255,60,0,0)']]); x.beginPath(); x.moveTo(-10, 16); x.quadraticCurveTo(-14, 36, 0, 54); x.quadraticCurveTo(14, 36, 10, 16); x.closePath(); x.fill();
    x.fillStyle = rg(x, 0, 22, 0, 12, [[0, '#ffffff'], [1, 'rgba(255,240,160,0)']]); x.beginPath(); x.ellipse(0, 26, 6, 12, 0, 0, TAU); x.fill();
    // aletas
    const fin = sg => () => { x.beginPath(); x.moveTo(sg * 9, -2); x.lineTo(sg * 24, 16); x.lineTo(sg * 22, 24); x.lineTo(sg * 9, 17); x.closePath(); };
    for (const sg of [-1, 1]) ink(x, fin(sg), lg(x, sg * 9, 0, sg * 24, 20, ['#5a6070', '#1a1d24']), 6);
    // cuerpo
    const body = () => { x.beginPath(); x.moveTo(-10, -16); x.lineTo(10, -16); x.lineTo(10, 16); x.quadraticCurveTo(0, 22, -10, 16); x.closePath(); };
    ink(x, body, lg(x, -10, 0, 10, 0, [[0, '#6a0a08'], [0.3, '#ff4a36'], [0.48, '#ffc0b0'], [0.62, '#ee3424'], [1, '#5a0606']]));
    x.fillStyle = lg(x, -10, 0, 10, 0, [[0, '#6a7078'], [0.45, '#ffffff'], [1, '#5a6068']]); x.fillRect(-10, 2, 20, 6); x.strokeStyle = INK; x.lineWidth = 2; x.strokeRect(-10, 2, 20, 6);
    x.fillStyle = '#ffd23d'; x.beginPath(); x.arc(0, -6, 5.5, 0, TAU); x.fill(); x.lineWidth = 2; x.stroke(); x.fillStyle = rg(x, -1.5, -7.5, 0.5, 4.5, ['#e8fbff', '#3ab0e8']); x.beginPath(); x.arc(0, -6, 3.6, 0, TAU); x.fill();
    // punta dorada
    ink(x, () => { x.beginPath(); x.moveTo(-10, -16); x.quadraticCurveTo(-9, -34, 0, -44); x.quadraticCurveTo(9, -34, 10, -16); x.closePath(); }, lg(x, -10, 0, 10, 0, [[0, '#8a5206'], [0.4, '#ffe680'], [0.6, '#ffd23d'], [1, '#8a5206']]));
    x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = 2.6; x.beginPath(); x.moveTo(-4.5, -30); x.quadraticCurveTo(-5.5, -20, -5.5, 12); x.stroke();
    x.restore();
  }
  function drawIcon(x, k) {
    x.lineJoin = 'round'; x.lineCap = 'round';
    switch (k) {
      case 'rocket': x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = 3; for (const o of [-14, 0, 14]) { x.beginPath(); x.moveTo(-30 + o * 0.6, 34 + o * 0.5); x.lineTo(-48 + o * 0.6, 52 + o * 0.5); x.stroke(); } drawRocket(x, 2, -2, 0.62, 1.05); break;
      case 'rocket3': drawRocket(x, -22, 10, 0.25, 0.78); drawRocket(x, 24, 10, 0.95, 0.78); drawRocket(x, 2, -6, 0.6, 0.86); break;
      case 'wasp': {
        for (const sg of [-1, 1]) { x.save(); x.translate(sg * 16, -18); x.rotate(sg * 0.55); x.fillStyle = 'rgba(214,240,255,0.72)'; x.strokeStyle = 'rgba(255,255,255,0.95)'; x.lineWidth = 2.5; x.beginPath(); x.ellipse(0, 0, 21, 11, 0, 0, TAU); x.fill(); x.stroke(); x.strokeStyle = 'rgba(120,170,210,0.7)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(-18, 0); x.lineTo(16, -2); x.moveTo(-6, -1); x.lineTo(2, 8); x.moveTo(4, -1); x.lineTo(12, -8); x.stroke(); x.restore(); }
        const ab = () => { x.beginPath(); x.ellipse(0, 12, 19, 27, 0, 0, TAU); }; ab(); x.lineWidth = 7; x.strokeStyle = INK; x.stroke();
        x.save(); ab(); x.clip(); for (let i = -16; i < 44; i += 10) { x.fillStyle = Math.round((i + 16) / 10) % 2 ? '#1a1610' : '#ffd21a'; x.fillRect(-20, i, 40, 10); } x.fillStyle = rg(x, -8, 0, 2, 34, [[0, 'rgba(255,255,255,0.45)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(0,0,0,0.45)']]); x.fillRect(-20, -16, 40, 56); x.restore();
        ink(x, () => { x.beginPath(); x.moveTo(-5, 36); x.lineTo(0, 52); x.lineTo(5, 36); x.closePath(); }, '#2a2418', 5);
        ink(x, () => { x.beginPath(); x.arc(0, -20, 14, 0, TAU); }, rg(x, -4, -25, 1, 16, ['#5a5040', '#14110c']));
        for (const sg of [-1, 1]) { x.strokeStyle = INK; x.lineWidth = 3; x.beginPath(); x.moveTo(sg * 5, -32); x.quadraticCurveTo(sg * 12, -46, sg * 20, -44); x.stroke(); x.fillStyle = rg(x, sg * 6 - 1, -21, 0.5, 6, ['#ffd0a0', '#ff3a10']); x.beginPath(); x.ellipse(sg * 6, -20, 5, 6.5, sg * 0.3, 0, TAU); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(sg * 6 - 1.5, -22, 1.6, 0, TAU); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(sg * 2, -27); x.lineTo(sg * 11, -29); x.stroke(); }
        break; }
      case 'oil': {
        const blob = () => { x.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU, r = 38 + Math.sin(a * 3) * 6 + Math.sin(a * 5 + 1) * 3; i ? x.lineTo(Math.cos(a) * r, 18 + Math.sin(a) * r * 0.48) : x.moveTo(Math.cos(a) * r, 18 + Math.sin(a) * r * 0.48); } x.closePath(); };
        ink(x, blob, rg(x, -6, 12, 2, 44, ['#3a2a5a', '#120c20']));
        x.save(); blob(); x.clip(); x.globalAlpha = 0.6; x.fillStyle = lg(x, -30, 0, 30, 0, ['#ff5ad0', '#5ab8ff', '#5affb0', '#ffe35a', '#ff7a3a']); x.beginPath(); x.ellipse(-4, 14, 26, 8, -0.1, 0, TAU); x.fill(); x.restore();
        x.fillStyle = 'rgba(255,255,255,0.75)'; x.beginPath(); x.ellipse(-16, 10, 7, 2.6, -0.2, 0, TAU); x.fill();
        ink(x, () => { x.beginPath(); x.moveTo(6, -46); x.quadraticCurveTo(22, -18, 6, -12); x.quadraticCurveTo(-10, -18, 6, -46); x.closePath(); }, rg(x, 2, -22, 1, 16, ['#5a4a7a', '#140e22']), 6);
        x.fillStyle = 'rgba(255,255,255,0.8)'; x.beginPath(); x.ellipse(1, -22, 2.4, 5, 0.2, 0, TAU); x.fill(); break; }
      case 'coco': for (const [dx, dy, r] of [[-20, 14, 20], [20, 14, 20], [0, -16, 21]]) { ink(x, () => { x.beginPath(); x.arc(dx, dy, r, 0, TAU); }, rg(x, dx - 7, dy - 8, 2, r + 2, ['#b07840', '#7a4a20', '#3a200c'])); x.strokeStyle = 'rgba(230,180,120,0.45)'; x.lineWidth = 1.5; for (let i = 0; i < 14; i++) { const a = i * 2.39, rr = r * (0.3 + (i % 5) * 0.13); x.beginPath(); x.moveTo(dx + Math.cos(a) * rr, dy + Math.sin(a) * rr); x.lineTo(dx + Math.cos(a) * rr + 3, dy + Math.sin(a) * rr + 4); x.stroke(); } x.fillStyle = '#1e1006'; for (const [ex, ey] of [[-5, -6], [5, -6], [0, 2]]) { x.beginPath(); x.arc(dx + ex, dy + ey, 2.8, 0, TAU); x.fill(); } x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.ellipse(dx - 8, dy - 9, 6, 3, -0.6, 0, TAU); x.fill(); } break;
      case 'shield': {
        x.fillStyle = rg(x, -10, -12, 4, 44, [[0, 'rgba(210,245,255,0.55)'], [0.7, 'rgba(70,170,255,0.45)'], [1, 'rgba(30,110,255,0.75)']]); x.beginPath(); x.arc(0, 0, 42, 0, TAU); x.fill();
        x.save(); x.beginPath(); x.arc(0, 0, 41, 0, TAU); x.clip(); x.strokeStyle = 'rgba(220,250,255,0.5)'; x.lineWidth = 1.6; const hx = (cx, cy, r) => { x.beginPath(); for (let i = 0; i <= 6; i++) { const a = i / 6 * TAU; i ? x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r) : x.moveTo(cx + r, cy); } x.stroke(); }; for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) hx(i * 15 + (j % 2 ? 7.5 : 0), j * 13, 8.5); x.restore();
        x.lineWidth = 10; x.strokeStyle = INK; x.beginPath(); x.arc(0, 0, 42, 0, TAU); x.stroke(); x.lineWidth = 6; x.strokeStyle = lg(x, -40, -40, 40, 40, ['#e8fbff', '#5ac8ff', '#1a6aff']); x.stroke();
        x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 5; x.beginPath(); x.arc(0, 0, 32, -2.5, -1.6); x.stroke(); x.lineWidth = 3; x.beginPath(); x.arc(0, 0, 32, -1.35, -1.1); x.stroke(); sparkle(x, 22, -22, 8); break; }
      case 'chile': {
        for (const [fx, fy, s] of [[30, 30, 1], [40, 16, 0.7], [22, 42, 0.6]]) { x.fillStyle = rg(x, fx, fy, 0, 12 * s, [[0, '#fff6a0'], [0.5, '#ff8a1a'], [1, 'rgba(255,60,0,0)']]); x.beginPath(); x.arc(fx, fy, 12 * s, 0, TAU); x.fill(); }
        ink(x, () => { x.beginPath(); x.moveTo(-26, -20); x.quadraticCurveTo(34, -26, 26, 36); x.quadraticCurveTo(6, 4, -24, -4); x.closePath(); }, lg(x, -10, -24, 10, 20, [[0, '#ff8a7a'], [0.35, '#ee1a1a'], [1, '#7a0404']]));
        x.strokeStyle = 'rgba(255,255,255,0.75)'; x.lineWidth = 4; x.beginPath(); x.moveTo(-14, -18); x.quadraticCurveTo(14, -20, 20, 2); x.stroke();
        ink(x, () => { x.beginPath(); x.ellipse(-26, -12, 7, 10, 0.4, 0, TAU); }, lg(x, -32, -20, -20, -4, ['#7aff6a', '#1a8a2a']), 5);
        x.strokeStyle = INK; x.lineWidth = 8; x.beginPath(); x.moveTo(-30, -16); x.quadraticCurveTo(-40, -30, -30, -40); x.stroke(); x.strokeStyle = '#2aa83a'; x.lineWidth = 4.5; x.stroke(); break; }
      case 'magnet': {
        x.strokeStyle = 'rgba(120,200,255,0.75)'; x.lineWidth = 3; x.setLineDash([6, 5]); for (const r of [30, 40]) { x.beginPath(); x.arc(0, 26, r, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); } x.setLineDash([]);
        const U = () => { x.beginPath(); x.moveTo(-20, 30); x.lineTo(-20, 0); x.arc(0, 0, 20, Math.PI, 0); x.lineTo(20, 30); };
        U(); x.lineWidth = 30; x.strokeStyle = INK; x.stroke(); U(); x.lineWidth = 22; x.strokeStyle = lg(x, -30, 0, 30, 0, ['#8a0a1a', '#ff4a5a', '#ff9aa0', '#e8203a', '#7a0614']); x.stroke();
        x.lineCap = 'butt'; for (const sg of [-1, 1]) { x.lineWidth = 30; x.strokeStyle = INK; x.beginPath(); x.moveTo(sg * 20, 22); x.lineTo(sg * 20, 42); x.stroke(); x.lineWidth = 22; x.strokeStyle = lg(x, sg * 20 - 11, 0, sg * 20 + 11, 0, ['#7a8290', '#ffffff', '#8a929e']); x.beginPath(); x.moveTo(sg * 20, 24); x.lineTo(sg * 20, 40); x.stroke(); }
        x.lineCap = 'round'; x.strokeStyle = 'rgba(255,255,255,0.65)'; x.lineWidth = 3.5; x.beginPath(); x.arc(0, 0, 25, Math.PI * 1.1, Math.PI * 1.45); x.stroke(); break; }
      case 'fog': {
        const C = [[-24, 10, 18], [0, 0, 24], [22, 8, 18], [-10, -14, 17], [12, -16, 15], [6, 18, 16]];
        x.lineWidth = 7; x.strokeStyle = '#34405a'; for (const [cx, cy, r] of C) { x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.stroke(); }
        for (const [cx, cy, r] of C) { x.fillStyle = rg(x, cx - r * 0.3, cy - r * 0.4, 1, r, ['#ffffff', '#e2eaf6', '#a8b8d0']); x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); }
        x.strokeStyle = 'rgba(90,110,140,0.55)'; x.lineWidth = 3; for (const [y, w] of [[34, 36], [44, 24]]) { x.beginPath(); x.moveTo(-w, y); x.lineTo(w, y); x.stroke(); } break; }
      case 'emerald': {
        const P = [[0, -46], [30, -20], [30, 16], [0, 46], [-30, 16], [-30, -20]];
        x.beginPath(); P.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.lineWidth = 8; x.strokeStyle = '#02301e'; x.stroke();
        const face = (pts, col) => { x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.fillStyle = col; x.fill(); };
        face([[0, -46], [30, -20], [14, -14], [-14, -14], [-30, -20]], '#9affd0'); face([[-14, -14], [14, -14], [14, 10], [-14, 10]], '#2affa0');
        face([[30, -20], [30, 16], [14, 10], [14, -14]], '#12c878'); face([[-30, -20], [-14, -14], [-14, 10], [-30, 16]], '#5affb8');
        face([[-30, 16], [-14, 10], [14, 10], [30, 16], [0, 46]], '#0a8a52'); face([[-14, 10], [14, 10], [0, 46]], '#0fa866');
        x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(-14, -14); x.lineTo(-14, 10); x.lineTo(14, 10); x.lineTo(14, -14); x.closePath(); x.stroke();
        sparkle(x, -12, -26, 10); sparkle(x, 22, 22, 5, 0.8); break; }
      case 'bolt': {
        const B = () => { x.beginPath(); x.moveTo(10, -50); x.lineTo(-22, 6); x.lineTo(-2, 6); x.lineTo(-14, 50); x.lineTo(24, -10); x.lineTo(4, -10); x.closePath(); };
        x.save(); x.shadowColor = 'rgba(255,220,60,0.9)'; x.shadowBlur = 18; B(); x.fillStyle = '#ffd21a'; x.fill(); x.restore();
        ink(x, B, lg(x, -20, -40, 20, 40, ['#fffbd0', '#ffe14a', '#ff9a0a']), 8);
        x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 3; x.beginPath(); x.moveTo(6, -40); x.lineTo(-12, 0); x.stroke(); sparkle(x, 22, -34, 7); sparkle(x, -24, 34, 5, 0.8); break; }
    }
  }
  function iconImg(k) {
    if (iconCache[k]) return iconCache[k]; const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S; const x = cv.getContext('2d');
    x.translate(S / 2, S / 2); x.scale(S / 128, S / 128);
    // halo del color del objeto
    x.fillStyle = rg(x, 0, 0, 4, 62, [[0, (ICON_COL[k] || '#ffffff') + '88'], [0.55, (ICON_COL[k] || '#ffffff') + '30'], [1, (ICON_COL[k] || '#ffffff') + '00']]); x.fillRect(-64, -64, 128, 128);
    x.scale(0.98, 0.98); drawIcon(x, k); return (iconCache[k] = cv);
  }
  function icon(x, k, cx, cy, s) { const img = iconImg(k); x.save(); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(img, cx - s / 2, cy - s / 2, s, s); x.restore(); }
  return { init, update, icon, ICON_COL };
})();
