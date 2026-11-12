/* =========================================================================
   UTILERÍA — llena los mapas para que nunca se vean pelados: árboles de
   varias clases (frondosos, pinos, palmas, cerezos, cipreses, enebros,
   secos), arbustos con flores, macizos de flores, rocas, vallas de
   patrocinadores en las barandas, muros de llantas en las curvas, tribuna
   con público en la recta de meta y detalles propios de cada lugar.
   Todo con instancias (pocas llamadas de dibujo) y sin invadir la vía:
   cada objeto se ubica más allá de la pared invisible y no se monta
   sobre casas ni otros objetos (rejilla de ocupación compartida).
   ========================================================================= */
const PROPS = (() => {
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), P = new THREE.Vector3(), Y = V3(0, 1, 0), C = new THREE.Color();
  // ---- rejilla de ocupación (casas, árboles, objetos) ----
  function occGrid() { const g = new Map(), CS = 8, key = (i, j) => i * 100003 + j;
    return { occupy(x, z, r) { const i = Math.floor(x / CS), j = Math.floor(z / CS), k = key(i, j); if (!g.has(k)) g.set(k, []); g.get(k).push([x, z, r]); },
      free(x, z, r) { const i = Math.floor(x / CS), j = Math.floor(z / CS), n = Math.ceil((r + 14) / CS); for (let a = -n; a <= n; a++) for (let b = -n; b <= n; b++) { const L = g.get(key(i + a, j + b)); if (L) for (const p of L) if (Math.hypot(p[0] - x, p[1] - z) < p[2] + r) return false; } return true; } }; }
  // ---- geometrías de árboles (unidas, con color por vértice para matices) ----
  function merge(list) { let n = 0; for (const g of list) n += g.attributes.position.count; const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3); let o = 0;
    for (const g of list) { const c = g.userData.col || [1, 1, 1], cnt = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); for (let i = 0; i < cnt; i++) col.set(c, (o + i) * 3); o += cnt; }
    const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); m.setAttribute('color', new THREE.BufferAttribute(col, 3)); return m; }
  const tint = (g, c) => { const n = g.index ? g.toNonIndexed() : g; n.userData.col = c; return n; };
  function lobes(seed, R, H, k, lo) { const r = makeRng(seed), out = []; for (let i = 0; i < k; i++) { const a = r() * TAU, d = R * (0.25 + r() * 0.5), rr = R * (0.55 + r() * 0.35), g = new THREE.SphereGeometry(rr, lo ? 6 : 8, lo ? 4 : 6); g.scale(1, 0.85, 1); g.translate(Math.cos(a) * d, H + (r() - 0.3) * R * 0.6, Math.sin(a) * d); const v = 0.82 + r() * 0.3; out.push(tint(g, [v, v, v])); } return out; }
  function treeGeo(kind, lo) {
    const trunk = (h, r0, r1, c = [0.42, 0.3, 0.2]) => tint(new THREE.CylinderGeometry(r1, r0, h, 6).translate(0, h / 2, 0), c);
    switch (kind) {
      case 'broad': return merge([trunk(3.4, 0.38, 0.24), ...lobes(3, 2.8, 5.2, lo ? 3 : 4, lo)]);
      case 'cherry': return merge([trunk(2.8, 0.3, 0.2, [0.3, 0.2, 0.18]), ...lobes(5, 2.6, 4.2, lo ? 3 : 5, lo)]);
      case 'pine': return merge([trunk(2, 0.3, 0.22), ...[0, 1, 2, 3].map(i => tint(new THREE.ConeGeometry(2.6 - i * 0.55, 3.2, 8).translate(0, 2.8 + i * 1.7, 0), [0.75 + i * 0.06, 0.8 + i * 0.05, 0.75 + i * 0.06]))]);
      case 'cypress': { const g = new THREE.SphereGeometry(1.1, 8, 8); g.scale(1, 4, 1); g.translate(0, 4.6, 0); return merge([trunk(1, 0.2, 0.15), tint(g, [1, 1, 1])]); }
      case 'juniper': return merge([trunk(1.2, 0.25, 0.15), ...lobes(9, 1.4, 1.8, 3, lo)]);
      case 'dead': { const parts = [trunk(4.5, 0.25, 0.1, [0.55, 0.45, 0.38])]; for (const [a, y, l] of [[0.6, 2.6, 1.8], [-0.7, 3.2, 1.5], [2.4, 2.0, 1.3], [-2.2, 3.6, 1.1]]) { const b = new THREE.CylinderGeometry(0.05, 0.1, l, 5).translate(0, l / 2, 0); b.rotateZ(0.9); b.rotateY(a); b.translate(0, y, 0); parts.push(tint(b, [0.55, 0.45, 0.38])); } return merge(parts); }
      case 'bush': return merge(lobes(7, 1.1, 0.6, lo ? 2 : 3, lo));
    }
  }
  // palma: tronco curvo en segmentos + hojas con textura recortada
  let leafTex = null;
  function palm(lo) {
    leafTex = leafTex || GFX.canvasTex(64, 256, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = '#3d6e1f'; x.lineWidth = 3; x.beginPath(); x.moveTo(w / 2, h); x.lineTo(w / 2, 4); x.stroke(); x.fillStyle = '#4f8a2a'; for (let y = 12; y < h - 6; y += 7) { const L = 26 * Math.sin((y / h) * Math.PI) + 4; x.beginPath(); x.moveTo(w / 2, y); x.lineTo(w / 2 - L, y + 10); x.lineTo(w / 2 - L + 3, y + 13); x.closePath(); x.fill(); x.beginPath(); x.moveTo(w / 2, y); x.lineTo(w / 2 + L, y + 10); x.lineTo(w / 2 + L - 3, y + 13); x.closePath(); x.fill(); } }, false);
    const segs = []; let px = 0, py = 0; for (let i = 0; i < 6; i++) { const g = new THREE.CylinderGeometry(0.2, 0.26, 1.5, 6).translate(0, 0.75, 0); g.rotateZ(-0.05 * i); g.translate(px, py, 0); segs.push(tint(g, [0.55, 0.45, 0.32])); px += Math.sin(0.05 * i) * 1.5; py += Math.cos(0.05 * i) * 1.5; }
    const fr = []; for (let k = 0; k < (lo ? 6 : 8); k++) { const g = new THREE.PlaneGeometry(1.4, 4.2, 1, 4); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const v = (p.getY(i) + 2.1) / 4.2; p.setZ(i, -v * v * 1.6); } g.translate(0, 2.1, 0); g.rotateX(-1.1); g.rotateY(k / (lo ? 6 : 8) * TAU); g.translate(px, py, 0); g.computeVertexNormals(); fr.push(g); }
    const frN = fr.map(g => g.toNonIndexed()); let n = 0; for (const g of frN) n += g.attributes.position.count; const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0; for (const q of frN) { pos.set(q.attributes.position.array, o * 3); nor.set(q.attributes.normal.array, o * 3); uv.set(q.attributes.uv.array, o * 2); o += q.attributes.position.count; }
    const leaves = new THREE.BufferGeometry(); leaves.setAttribute('position', new THREE.BufferAttribute(pos.slice(0, o * 3), 3)); leaves.setAttribute('normal', new THREE.BufferAttribute(nor.slice(0, o * 3), 3)); leaves.setAttribute('uv', new THREE.BufferAttribute(uv.slice(0, o * 2), 2));
    return { trunk: merge(segs), leaves };
  }
  // ---- colocar instancias ----
  function inst(scene, geo, mat, list, colors, shadow) {
    if (!list.length) return null; const m = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((p, i) => { Q.setFromAxisAngle(Y, p[4] || 0); S.set(p[3], p[3] * (p[5] || 1), p[3]); M.compose(P.set(p[0], p[1], p[2]), Q, S); m.setMatrixAt(i, M); if (colors) m.setColorAt(i, C.set(colors[i % colors.length]).offsetHSL((Math.random() - 0.5) * 0.03, 0, (Math.random() - 0.5) * 0.08)); });
    m.castShadow = !!shadow && GQ.lv === 2; m.receiveShadow = true; m.frustumCulled = false; GFX.linearize(m); scene.add(m); return m;
  }
  // punto al costado de la pista, fuera de la zona manejable
  function side(T, K, rnd, minD, maxD, r, opts = {}) {
    for (let tries = 0; tries < 30; tries++) {
      const s = rnd() * T.L; if (!opts.any && (T.zone(s, 'air') || T.zone(s, 'gap') || T.zone(s, 'elev'))) continue; if (opts.noTown && T.zone(s, 'town')) continue;
      const o = T.at(s), lim = T.limits(s), sg = rnd() < 0.5 ? -1 : 1, d = (T.zone(s, 'water') ? o.w / 2 + 4 : lim.wall) + minD + rnd() * (maxD - minD), x = o.px + o.rx * d * sg, z = o.pz + o.rz * d * sg;
      const h = K.terrain.userData.height(x, z); if (h < T.lakeY + 0.4) continue; if (K.terrain.userData.clearAll(x, z) < r + 1.2) continue;
      if (!K.occ.free(x, z, r)) continue; K.occ.occupy(x, z, r); return [x, h - 0.15, z, s, sg];
    }
    return null;
  }
  // punto libre en el mapa (lejos de la pista), en tierra
  function far(T, K, rnd, R0, R1, r, cz = 0) { for (let tries = 0; tries < 20; tries++) { const a = rnd() * TAU, rr = R0 + Math.sqrt(rnd()) * (R1 - R0), x = Math.cos(a) * rr, z = Math.sin(a) * rr + cz, h = K.terrain.userData.height(x, z); if (h < T.lakeY + 0.6) continue; if (K.terrain.userData.clearAll(x, z) < r + 2) continue; if (!K.occ.free(x, z, r)) continue; K.occ.occupy(x, z, r); return [x, h - 0.2, z]; } return null; }
  /* ---------- vallas de patrocinadores (marcas inventadas) ---------- */
  let adTex = null;
  const BRANDS = [['NOVA', '#0a2a6a', '#ffd23d'], ['KOLIBRÍ', '#e8202a', '#ffffff'], ['RAYO', '#111318', '#ffe14a'], ['MAREA', '#0f7a8a', '#ffffff'], ['VOLTA', '#ffffff', '#e8202a'], ['TUCÁN', '#1a8a3a', '#ffd400'], ['ZAFIRO', '#2a3ab0', '#9fd8ff'], ['CÓNDOR', '#2a2a2a', '#ff7a1a']];
  function ads(scene, T, K, rnd) {
    adTex = adTex || GFX.canvasTex(1024, 256, (x, w, h) => { BRANDS.forEach(([n, bg, fg], i) => { const X = (i % 4) * 256, Yy = Math.floor(i / 4) * 128; x.fillStyle = bg; x.fillRect(X, Yy, 256, 128); x.fillStyle = fg; x.fillRect(X, Yy + 104, 256, 8); x.font = '400 56px "Russo One", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(n, X + 128, Yy + 58); }); }, false);
    const g = new K.Geo(); let n = 0;
    for (let s = 20; s < T.L - 20; s += 55) { if (T.zone(s, 'town') || T.zone(s, 'air') || T.zone(s, 'water') || T.zone(s, 'gap') || T.zone(s, 'elev')) continue; const o = T.at(s), lim = T.limits(s), sg = (Math.floor(s / 55) % 2) ? 1 : -1, u = (Math.max(lim.wall, T.limits(s - 5).wall, T.limits(s + 5).wall) + 0.35) * sg, b = rnd() * 8 | 0, u0 = (b % 4) / 4, v0 = b < 4 ? 0.5 : 0;
      const A = T.pos(s - 4, u, 0.1, V3()), B = T.pos(s + 4, u, 0.1, V3()), Mid = T.pos(s, u, 0.1, V3()); const up = 1.25; const pts = sg < 0 ? [A, B] : [B, A];
      if ([A, B, Mid].some(P => K.terrain.userData.clearAll(P.x, P.z) < 0.2)) continue; /* otra parte de la pista pasa cerca: aquí no */
      g.face(pts[0], pts[1], pts[1].clone().add(V3(0, up, 0)), pts[0].clone().add(V3(0, up, 0)), [u0, v0, u0 + 0.25, v0 + 0.5]); n++; }
    if (n) { const m = new THREE.Mesh(g.build(), new THREE.MeshStandardMaterial({ map: adTex, roughness: 0.6, side: THREE.DoubleSide })); m.receiveShadow = true; scene.add(m); }
  }
  /* ---------- muros de llantas en el lado de afuera de las curvas fuertes ---------- */
  function tires(scene, T, K, rnd) {
    const list = [], cols = []; const g = new THREE.CylinderGeometry(0.36, 0.36, 0.27, 10);
    for (let k = 0; k < T.N; k += 2) { const s = k * T.ds, kap = T.kap[k]; if (Math.abs(kap) < 0.014 || T.zone(s, 'town') || T.zone(s, 'air') || T.zone(s, 'water') || T.zone(s, 'gap') || T.zone(s, 'elev')) continue;
      const o = T.at(s), u = (T.limits(s).wall + 0.55) * -Math.sign(kap); { const P0 = T.pos(s, u, 0, V3()); if (K.terrain.userData.clearAll(P0.x, P0.z) < 0.3) continue; } for (let lay = 0; lay < 3; lay++) { const P2 = T.pos(s, u, 0.14 + lay * 0.27, V3()); list.push([P2.x, P2.y, P2.z, 1, 0]); cols.push((k / 2 + lay) % 2 ? '#e8e8e4' : '#d42020'); } }
    if (list.length) { const m = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ roughness: 0.85 }), list.length); list.forEach((p, i) => { M.makeTranslation(p[0], p[1], p[2]); m.setMatrixAt(i, M); m.setColorAt(i, C.set(cols[i])); }); GFX.linearize(m); m.castShadow = GQ.lv === 2; scene.add(m); }
  }
  /* ---------- marcas de llanta en el asfalto de las curvas cerradas (por la línea de carrera) ---------- */
  let skidTex = null;
  function skids(scene, T, rnd) {
    skidTex = skidTex || GFX.canvasTex(256, 16, (x, w, h) => { x.clearRect(0, 0, w, h); for (let i = 0; i < w; i++) { const f = Math.sin(Math.PI * i / w), a = Math.pow(f, 0.7) * (0.55 + Math.random() * 0.35); x.fillStyle = `rgba(14,14,16,${a})`; x.fillRect(i, 2, 1, h - 4); x.fillStyle = `rgba(14,14,16,${a * 0.5})`; x.fillRect(i, 0, 1, 2); x.fillRect(i, h - 2, 1, 2); } }, false);
    const line = racingLine(T), pos = [], uv = [], idx = [], P = new THREE.Vector3(), N = T.N, bad = s => T.zone(s, 'town') || T.zone(s, 'air') || T.zone(s, 'water') || T.zone(s, 'gap');
    const strip = (k0, k1, off) => { const base = pos.length / 3, n = k1 - k0; for (let j = 0; j <= n; j++) { const k = (k0 + j + N) % N, s = k * T.ds, u = line[k] + off; for (const e of [-0.16, 0.16]) { T.pos(s, u + e, 0.03, P); pos.push(P.x, P.y, P.z); uv.push(j / n, e > 0 ? 1 : 0); } if (j) { const a = base + (j - 1) * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); } } };
    for (let k = 0; k < N; k++) {
      if (Math.abs(T.kap[k]) < 0.011 || bad(k * T.ds)) continue;
      let k1 = k; while (k1 < N - 1 && Math.abs(T.kap[k1]) >= 0.008) k1++;
      const pre = Math.round(18 / T.ds), post = Math.round(26 / T.ds), a = k - pre, b = k1 + post; let ok = true; for (let j = a; j <= b; j += 3) if (bad(((j + N) % N) * T.ds)) ok = false;
      if (ok) for (let c = 0; c < 2 + (rnd() * 2 | 0); c++) { const j = (rnd() - 0.5) * 1.6, sh = Math.round((rnd() - 0.5) * 10 / T.ds); for (const w of [-0.98, 0.98]) strip(a + sh, b + sh, j + w); }
      k = k1;
    }
    if (!idx.length) return; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: skidTex, transparent: true, depthWrite: false, opacity: 0.55, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); m.renderOrder = 1; m.userData.noCast = true; scene.add(m);
  }
  /* ---------- tribuna con público en la recta de meta (si no es calle de pueblo) ---------- */
  function grandstand(scene, T, K) {
    if (T.zone(0, 'town') || T.zone(0, 'water')) return; const o = T.at(T.wrap(-15)), lim = T.limits(T.wrap(-15)), sg = -1, d0 = lim.wall + 3, L = 44, g = new K.Geo(), conc = new THREE.Color('#b8b6b0'), dark = new THREE.Color('#5a5c62');
    const fx = -o.rx * sg, fz = -o.rz * sg, tx = o.tx, tz = o.tz, bx = o.px + o.rx * d0 * sg, bz = o.pz + o.rz * d0 * sg, by = o.py, Pp = (a, b, y) => V3(bx + tx * a - fx * b, by + y, bz + tz * a - fz * b);
    if (!K.occ.free(bx - fx * 5, bz - fz * 5, 14)) return; K.occ.occupy(bx - fx * 5, bz - fz * 5, 14);
    for (let r = 0; r < 7; r++) { const y = 0.5 + r * 0.7, b0 = r * 1.1, b1 = b0 + 1.1; g.face(Pp(-L / 2, b0, y), Pp(L / 2, b0, y), Pp(L / 2, b1, y), Pp(-L / 2, b1, y), [0, 0, 1, 1], conc); g.face(Pp(L / 2, b0, y - 0.7), Pp(-L / 2, b0, y - 0.7), Pp(-L / 2, b0, y), Pp(L / 2, b0, y), [0, 0, 1, 1], dark); }
    g.face(Pp(-L / 2, 7.7, 0), Pp(L / 2, 7.7, 0), Pp(L / 2, 7.7, 9), Pp(-L / 2, 7.7, 9), [0, 0, 1, 1], dark);
    g.face(Pp(-L / 2 - 1, -1, 9.6), Pp(L / 2 + 1, -1, 9.6), Pp(L / 2 + 1, 8.5, 9.2), Pp(-L / 2 - 1, 8.5, 9.2), [0, 0, 1, 1], new THREE.Color('#e8e8ec'));
    for (const a of [-L / 2, -L / 6, L / 6, L / 2]) for (const [b0, b1] of [[-0.8, -0.6], [7.5, 7.7]]) { const c = new THREE.Color('#8a8c92'); g.face(Pp(a - 0.2, b0, 0), Pp(a + 0.2, b0, 0), Pp(a + 0.2, b0, 9.4), Pp(a - 0.2, b0, 9.4), [0, 0, 1, 1], c); }
    const m = new THREE.Mesh(g.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide })); m.castShadow = GQ.lv === 2; m.receiveShadow = true; GFX.linearize(m); scene.add(m);
    // público sentado
    const ppl = [], cols = ['#ff3d6e', '#ffd23d', '#19c3ff', '#19e68c', '#ff7a1a', '#ffffff', '#7a3cff', '#e8202a', '#2a7bd4', '#f2f2f2']; const yaw = Math.atan2(fx, fz);
    for (let r = 0; r < 7; r++) for (let a = -L / 2 + 0.6; a < L / 2; a += 0.75 + Math.random() * 0.3) if (Math.random() < 0.85) { const p = Pp(a, r * 1.1 + 0.55, 0.5 + r * 0.7); ppl.push([p.x, p.y, p.z, 0.9 + Math.random() * 0.2, yaw]); }
    const body = new THREE.CylinderGeometry(0.2, 0.24, 0.6, 7).translate(0, 0.3, 0), head = new THREE.SphereGeometry(0.15, 8, 6).translate(0, 0.78, 0);
    inst(scene, body, new THREE.MeshStandardMaterial({ roughness: 0.8 }), ppl, cols, false); inst(scene, head, new THREE.MeshStandardMaterial({ roughness: 0.7 }), ppl, ['#f1c9a5', '#d9a477', '#a8693f', '#7a4a2a', '#e8b98f'], false);
    // banderas en el techo
    const fl = []; for (let a = -L / 2; a <= L / 2; a += L / 5) { const p = Pp(a, 8.2, 9.4); fl.push([p.x, p.y, p.z, 1, yaw]); }
    const fg = new THREE.PlaneGeometry(1.4, 0.9).translate(0.75, 2.4, 0), pole = new THREE.CylinderGeometry(0.04, 0.04, 3, 5).translate(0, 1.5, 0);
    inst(scene, pole, new THREE.MeshStandardMaterial({ color: '#cfd2d8', metalness: 0.7 }), fl, null, false); inst(scene, fg, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.7 }), fl, ['#19e68c', '#ffd23d', '#ff3d6e', '#19c3ff'], false);
  }
  /* ---------- vegetación, rocas y flores por tema ---------- */
  const SETS = {
    guatape: { trees: [['broad', 0.5, ['#4f8a2c', '#5e9a34', '#3f7a28', '#6aa63a']], ['pine', 0.2, ['#2f5e2a', '#3a6a30']], ['palm', 0.12], ['bush', 0.18, ['#4a8a30', '#c8287a', '#e84a9a', '#5a9a38']]], near: 320, far: 1500, rocks: 60, rockCol: ['#8e8c84', '#a19e94'], flowers: 140, flowerCols: ['#ff4a8a', '#ffd23d', '#ffffff', '#c86aff', '#ff7a2a'] },
    venecia: { trees: [['cypress', 0.6, ['#2f5a34', '#3a6a3a']], ['bush', 0.4, ['#4a7a34', '#c84a8a']]], near: 70, far: 0, rocks: 0, flowers: 90, flowerCols: ['#ff3a4a', '#ffffff', '#ff8ac0'] },
    tokio: { trees: [['cherry', 0.7, ['#f6b6cf', '#f2a4c4', '#fbd0e0']], ['bush', 0.3, ['#3a6a34']]], near: 140, far: 0, rocks: 0, flowers: 0 },
    halong: { trees: [['palm', 0.55], ['broad', 0.25, ['#3f7a2c', '#4f8a34']], ['bush', 0.2, ['#3f7a30', '#5a9a38']]], near: 220, far: 300, rocks: 50, rockCol: ['#8e8e86', '#a6a69c'], flowers: 40, flowerCols: ['#ffffff', '#ffd23d'] },
    islandia: { trees: [['bush', 0.7, ['#4a6a3a', '#5a7a44', '#3e5a34']], ['juniper', 0.3, ['#3a5a34']]], near: 200, far: 160, rocks: 220, rockCol: ['#3a3836', '#4a4642', '#2e2c2c'], flowers: 160, flowerCols: ['#9a5aff', '#b07aff', '#7a4ae0'] },
    amazonas: { trees: [['broad', 0.45, ['#2e6a26', '#3a7a2c', '#24581e']], ['palm', 0.3], ['bush', 0.25, ['#3a8a30', '#2e7a28', '#d84a7a']]], near: 420, far: 700, rocks: 30, rockCol: ['#6a5a44'], flowers: 120, flowerCols: ['#ff3a6a', '#ffb02a', '#ffffff'] },
    santorini: { trees: [['cypress', 0.4, ['#2e5a30', '#3a6a3a']], ['bush', 0.45, ['#e8408a', '#d8307a', '#6a8a3a', '#f05aa0']], ['juniper', 0.15, ['#5a7a3a']]], near: 220, far: 160, rocks: 70, rockCol: ['#5a4a44', '#3a3232', '#7a5a4a'], flowers: 90, flowerCols: ['#ff4a9a', '#ffffff', '#ffd23d'] },
    egipto: { trees: [['palm', 0.75], ['bush', 0.25, ['#7a8a4a', '#8a9a50']]], near: 140, far: 90, rocks: 80, rockCol: ['#c8a46a', '#b8945a', '#d8b47a'], flowers: 0 },
    egipto: { trees: [['palm', 0.7], ['bush', 0.3, ['#8a8a50', '#9a9a5a']]], near: 90, far: 70, rocks: 90, rockCol: ['#c8a46a', '#b8945a', '#d8b47a'], flowers: 0 },
    dorado: { trees: [['broad', 0.45, ['#2e7a28', '#3a8a30', '#24661e']], ['palm', 0.25], ['pine', 0.15, ['#2f5e2a']], ['bush', 0.15, ['#3a8a30', '#ffcc33', '#e84a7a']]], near: 300, far: 700, rocks: 60, rockCol: ['#8a7a5a', '#a08a60'], flowers: 140, flowerCols: ['#ffcc33', '#ff6a3a', '#ffffff'] },
    coliseo: { trees: [['broad', 0.65, ['#2f5a26', '#3a6a2c']], ['cypress', 0.35, ['#2a4e2c', '#33592f']]], near: 60, far: 420, rocks: 0, flowers: 0 },
    totumo: { trees: [['palm', 0.5], ['broad', 0.25, ['#2f6a26', '#3f7a2c']], ['bush', 0.25, ['#2e6a2a', '#3e7a30', '#e84a7a']]], near: 260, far: 520, rocks: 0, flowers: 60, flowerCols: ['#ff3a6a', '#ffd23d', '#ffffff'] },
    canon: { trees: [['juniper', 0.5, ['#4a6a34', '#5a7a3a']], ['dead', 0.2, null], ['bush', 0.3, ['#8a8a50', '#9a9a5a']]], near: 160, far: 500, rocks: 180, rockCol: ['#b4602e', '#c87a40', '#9a4a26', '#d89a5a'], flowers: 0 },
  };
  function vegetation(scene, T, def, th, K) {
    const set = SETS[def.theme]; if (!set) return; const rnd = makeRng(97), lo = GQ.lv < 2, k = [0.3, 0.55, 1][GQ.lv];
    const pick = () => { let r = rnd() * set.trees.reduce((a, b) => a + b[1], 0); for (const t of set.trees) { r -= t[1]; if (r <= 0) return t; } return set.trees[0]; };
    const groups = {}; const add = (t, p, f) => { const key = t[0] + (f ? '_f' : ''); (groups[key] = groups[key] || { t, list: [], f }).list.push(p); };
    for (let i = 0; i < set.near * k; i++) { const t = pick(), r = t[0] === 'bush' ? 3.0 : 2.8, p = side(T, K, rnd, 1.5, t[0] === 'bush' ? 22 : 70, r, { noTown: def.theme !== 'venecia' }); if (p) add(t, [p[0], p[1], p[2], 0.75 + rnd() * 0.6, rnd() * TAU, 0.85 + rnd() * 0.35]); }
    // bosquecitos lejanos: grupos de 8 a 26 árboles (se ve natural y no pelado)
    for (let c = 0; c < set.far * k / 14; c++) { const ctr = far(T, K, rnd, 90, 1150, 1); if (!ctr) continue; const n = 8 + (rnd() * 18 | 0), R0 = 14 + rnd() * 26, t0 = pick();
      for (let i = 0; i < n; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R0, x = ctr[0] + Math.cos(a) * d, z = ctr[2] + Math.sin(a) * d, h = K.terrain.userData.height(x, z); if (h < T.lakeY + 0.6) continue; const nt = K.terrain.userData.nearTrack(x, z); if (nt && nt.d < T.limits(nt.q.k * T.ds).wall + 4) continue; if (!K.occ.free(x, z, 1.6)) continue; K.occ.occupy(x, z, 1.6); add(rnd() < 0.75 ? t0 : pick(), [x, h - 0.2, z, 0.75 + rnd() * 0.7, rnd() * TAU, 0.85 + rnd() * 0.35], true); } }
    for (const key in groups) { const { t, list, f } = groups[key];
      if (t[0] === 'palm') { const pg = palm(lo || f); inst(scene, pg.trunk, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), list, null, true); inst(scene, pg.leaves, new THREE.MeshStandardMaterial({ map: leafTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 }), list, null, true); continue; }
      inst(scene, treeGeo(t[0], lo || f), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }), list, t[2] || ['#8a7a68'], t[0] !== 'bush' && !f); }
    // rocas
    if (set.rocks) { const list = []; for (let i = 0; i < set.rocks * k; i++) { const p = rnd() < 0.6 ? side(T, K, rnd, 1, 40, 1.6, { noTown: true }) : far(T, K, rnd, 60, 900, 2); if (p) list.push([p[0], p[1] + 0.1, p[2], 0.6 + rnd() * 1.8, rnd() * TAU, 0.5 + rnd() * 0.5]); }
      const g = new THREE.DodecahedronGeometry(1, 0); inst(scene, g, new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true }), list, set.rockCol, true); }
    // macizos de flores (cruces de planos con textura recortada)
    if (set.flowers) { const tex = GFX.canvasTex(64, 64, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = '#3e7a2a'; x.lineWidth = 2; for (let i = 0; i < 9; i++) { const px = 6 + Math.random() * 52; x.beginPath(); x.moveTo(px, h); x.lineTo(px + (Math.random() - 0.5) * 6, 18 + Math.random() * 30); x.stroke(); } x.fillStyle = '#ffffff'; for (let i = 0; i < 9; i++) { x.beginPath(); x.arc(6 + Math.random() * 52, 12 + Math.random() * 34, 4 + Math.random() * 3, 0, TAU); x.fill(); } }, false);
      const g = new THREE.PlaneGeometry(1.6, 0.9).translate(0, 0.45, 0), g2 = g.clone().rotateY(Math.PI / 2), fg = new THREE.BufferGeometry(); { const a = g.toNonIndexed(), b = g2.toNonIndexed(), n = a.attributes.position.count; const pos = new Float32Array(n * 6), uv = new Float32Array(n * 4), nor = new Float32Array(n * 6); pos.set(a.attributes.position.array); pos.set(b.attributes.position.array, n * 3); uv.set(a.attributes.uv.array); uv.set(b.attributes.uv.array, n * 2); for (let i = 0; i < n * 2; i++) nor.set([0, 1, 0], i * 3); fg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); fg.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); fg.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); }
      const list = []; for (let i = 0; i < set.flowers * k; i++) { const p = side(T, K, rnd, 0.6, 14, 0.8, { noTown: def.theme !== 'venecia' }); if (!p) continue; for (let j = 0; j < 4; j++) list.push([p[0] + (rnd() - 0.5) * 2.4, p[1] + 0.1, p[2] + (rnd() - 0.5) * 2.4, 0.8 + rnd() * 0.5, rnd() * TAU]); }
      inst(scene, fg, new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 }), list, set.flowerCols, false); }
  }
  function build(scene, T, def, th, K) {
    const rnd = makeRng(131);
    if (!def.arena) { ads(scene, T, K, rnd); tires(scene, T, K, rnd); skids(scene, T, rnd); grandstand(scene, T, K); } vegetation(scene, T, def, th, K);
  }
  return { build, occGrid, treeGeo, inst, side, far };
})();
