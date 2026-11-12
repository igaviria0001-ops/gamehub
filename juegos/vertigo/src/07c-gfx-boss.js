/* =========================================================================
   JEFES EN 3D — el Tren de Oro (locomotora negra y oro con bielas que se
   mueven, ténder con carbón y vagones cargados de lingotes, sobre un riel
   dorado que se tiende solo), el Galeón de Vapor (casco de madera, velas,
   chimenea de bronce, ruedas de paletas y cañones de popa) y el Cóndor de
   Hierro (alas articuladas con plumas de acero, collar blanco, ojos rojos,
   engranajes y propulsores). Más lo que sueltan: barriles, carbón, balas con
   círculo rojo de aviso, minas, plumas y el botín.
   ========================================================================= */
const BossArt = (() => {
  let scene = null, T = null, B = null, root = null, segG = [], anim = null, hz = new Map(), rail = null, shadowBlob = null, flash = [], W = null;
  const V = new THREE.Vector3(), V2 = new THREE.Vector3(), X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Q2 = new THREE.Quaternion(), S1 = new THREE.Vector3(1, 1, 1), AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0), AZ = new THREE.Vector3(0, 0, 1);
  const tex = (w, h, f, rep) => GFX.canvasTex(w, h, f, rep);
  // ---------- piezas ----------
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const cylY = (rt, rb, h, n = 20) => new THREE.CylinderGeometry(rt, rb, h, n);
  const cylZ = (r, len, n = 20, r2 = r) => new THREE.CylinderGeometry(r, r2, len, n).rotateX(Math.PI / 2);
  const cylX = (r, len, n = 20) => new THREE.CylinderGeometry(r, r, len, n).rotateZ(Math.PI / 2);
  function add(g, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m; }
  function merge(grp, keep) { // une lo estático por material: pocas llamadas de dibujo
    const groups = new Map();
    for (const ch of grp.children.slice()) {
      if (!ch.isMesh || keep.has(ch)) continue; ch.updateMatrix(); const g = ch.geometry.index ? ch.geometry.toNonIndexed() : ch.geometry.clone(); g.applyMatrix4(ch.matrix); if (!g.attributes.normal) g.computeVertexNormals();
      if (!groups.has(ch.material)) groups.set(ch.material, []); groups.get(ch.material).push(g); grp.remove(ch);
    }
    for (const [mat, list] of groups) { let n = 0; for (const g of list) n += g.attributes.position.count; const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
      for (const g of list) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2); o += g.attributes.position.count; }
      const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); mg.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); mg.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      const mesh = new THREE.Mesh(mg, mat); mesh.castShadow = GQ.lv > 0; grp.add(mesh); }
  }
  const glowSprite = (col, s, op = 1) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: GFX.glowTex(), color: col, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: op })); sp.scale.set(s, s, 1); return sp; };
  // ---------- materiales ----------
  let mt = null;
  function mats() {
    const std = (o) => new THREE.MeshStandardMaterial(o);
    const plank = tex(256, 256, (x, w, h) => { x.fillStyle = '#6b4426'; x.fillRect(0, 0, w, h); for (let r = 0; r < 16; r++) { const v = 0.85 + Math.random() * 0.3; x.fillStyle = `rgba(${110 * v | 0},${70 * v | 0},${38 * v | 0},1)`; x.fillRect(0, r * 16 + 1, w, 14); x.fillStyle = 'rgba(30,16,6,0.6)'; x.fillRect(0, r * 16, w, 1.5); for (let k = 0; k < 3; k++) x.fillRect(Math.random() * w, r * 16, 1.5, 16); for (let k = 0; k < 30; k++) { x.fillStyle = `rgba(40,22,10,${Math.random() * 0.25})`; x.fillRect(Math.random() * w, r * 16 + Math.random() * 14, 20 + Math.random() * 40, 1); } } });
    const hull = tex(512, 256, (x, w, h) => { x.drawImage(plank.image, 0, 0, w, h); x.fillStyle = '#1c2a2a'; x.fillRect(0, h * 0.62, w, h * 0.38); for (let k = 0; k < 400; k++) { x.fillStyle = `rgba(${60 + Math.random() * 60},${110 + Math.random() * 60},${90 + Math.random() * 40},0.35)`; x.fillRect(Math.random() * w, h * 0.62 + Math.random() * h * 0.38, 6, 3); } x.fillStyle = '#d4a032'; x.fillRect(0, h * 0.14, w, 9); x.fillRect(0, h * 0.58, w, 7); x.fillStyle = '#7a1612'; x.fillRect(0, h * 0.18, w, 14); for (let i = 0; i < 8; i++) { x.fillStyle = '#120a06'; x.fillRect(30 + i * 62, h * 0.24, 22, 22); x.strokeStyle = '#d4a032'; x.lineWidth = 3; x.strokeRect(30 + i * 62, h * 0.24, 22, 22); } }, false);
    const sail = tex(256, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#f4ead2'); g.addColorStop(1, '#ddcfae'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(120,96,60,0.35)'; x.lineWidth = 2; for (let i = 1; i < 8; i++) { x.beginPath(); x.moveTo(i * w / 8, 0); x.lineTo(i * w / 8, h); x.stroke(); } x.strokeStyle = 'rgba(120,96,60,0.6)'; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, h - 6); }, false);
    const emblem = tex(256, 256, (x, w, h) => { x.drawImage(sail.image, 0, 0); x.translate(128, 128); x.fillStyle = '#b8862a'; for (let i = 0; i < 12; i++) { x.rotate(TAU / 12); x.fillRect(-11, -84, 22, 26); } x.beginPath(); x.arc(0, 0, 64, 0, TAU); x.fill(); x.fillStyle = '#f0e2c0'; x.beginPath(); x.arc(0, 0, 40, 0, TAU); x.fill(); x.fillStyle = '#0fa866'; x.beginPath(); x.moveTo(0, -30); x.lineTo(22, 0); x.lineTo(0, 32); x.lineTo(-22, 0); x.closePath(); x.fill(); x.fillStyle = '#7dffc8'; x.beginPath(); x.moveTo(0, -30); x.lineTo(8, 0); x.lineTo(0, 32); x.closePath(); x.fill(); }, false);
    const flag = tex(128, 96, (x, w, h) => { x.fillStyle = '#121214'; x.fillRect(0, 0, w, h); x.translate(64, 48); x.fillStyle = '#d4a032'; for (let i = 0; i < 10; i++) { x.rotate(TAU / 10); x.fillRect(-4, -30, 8, 9); } x.beginPath(); x.arc(0, 0, 22, 0, TAU); x.fill(); x.fillStyle = '#121214'; x.beginPath(); x.arc(0, 0, 11, 0, TAU); x.fill(); x.fillStyle = '#19e68c'; x.beginPath(); x.arc(0, 0, 6, 0, TAU); x.fill(); }, false);
    const plate = (txt, bg, fg) => tex(512, 128, (x, w, h) => { x.fillStyle = bg; x.fillRect(0, 0, w, h); x.strokeStyle = fg; x.lineWidth = 8; x.strokeRect(8, 8, w - 16, h - 16); x.font = '400 64px "Russo One", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = fg; x.shadowColor = 'rgba(0,0,0,0.6)'; x.shadowBlur = 6; x.fillText(txt, w / 2, h / 2 + 4); for (const px of [24, w - 24]) for (const py of [24, h - 24]) { x.beginPath(); x.arc(px, py, 6, 0, TAU); x.fill(); } }, false);
    const stern = tex(256, 128, (x, w, h) => { x.fillStyle = '#5a2e14'; x.fillRect(0, 0, w, h); for (let i = 0; i < 5; i++) { const px = 16 + i * 48; const g = x.createLinearGradient(0, 30, 0, 100); g.addColorStop(0, '#ffe7a0'); g.addColorStop(1, '#ff9a2a'); x.fillStyle = g; x.fillRect(px, 30, 34, 64); x.strokeStyle = '#d4a032'; x.lineWidth = 5; x.strokeRect(px, 30, 34, 64); x.beginPath(); x.moveTo(px + 17, 30); x.lineTo(px + 17, 94); x.moveTo(px, 62); x.lineTo(px + 34, 62); x.stroke(); } x.fillStyle = '#d4a032'; x.fillRect(0, 8, w, 8); x.fillRect(0, h - 18, w, 8); }, false);
    const coal = tex(128, 128, (x, w, h) => { x.fillStyle = '#121216'; x.fillRect(0, 0, w, h); for (let k = 0; k < 300; k++) { const v = 20 + Math.random() * 40; x.fillStyle = `rgb(${v},${v},${v + 6})`; x.fillRect(Math.random() * w, Math.random() * h, 3, 3); } });
    mt = {
      gold: std({ color: '#f4bb30', metalness: 0.92, roughness: 0.22, emissive: '#5a3600', emissiveIntensity: 0.32 }),
      brass: std({ color: '#c8913a', metalness: 0.9, roughness: 0.32 }),
      iron: std({ color: '#1d1f25', metalness: 0.7, roughness: 0.42 }), iron2: std({ color: '#30333b', metalness: 0.75, roughness: 0.35 }),
      red: std({ color: '#8c1712', metalness: 0.25, roughness: 0.42 }), redL: std({ color: '#b52a1e', metalness: 0.3, roughness: 0.38 }),
      wood: std({ map: plank, roughness: 0.85 }), hull: std({ map: hull, roughness: 0.75, side: THREE.DoubleSide }), sail: std({ map: sail, roughness: 0.95, side: THREE.DoubleSide }), emblem: std({ map: emblem, roughness: 0.95, side: THREE.DoubleSide }),
      flag: std({ map: flag, roughness: 0.9, side: THREE.DoubleSide }), stern: std({ map: stern, roughness: 0.6, emissive: '#ffffff', emissiveMap: stern, emissiveIntensity: 0.35 }),
      glass: std({ color: '#0d1620', metalness: 0.3, roughness: 0.08 }), lamp: new THREE.MeshBasicMaterial({ color: '#fff4c8' }), tail: new THREE.MeshBasicMaterial({ color: '#ff3020' }),
      coal: std({ map: coal, roughness: 0.95 }), gem: std({ color: '#19e68c', metalness: 0.2, roughness: 0.08, emissive: '#0d9a5a', emissiveIntensity: 0.9 }),
      steel: std({ color: '#9aa2ac', metalness: 0.92, roughness: 0.22 }), wing: std({ color: '#33363e', metalness: 0.72, roughness: 0.34, side: THREE.DoubleSide }), steelD: std({ color: '#3c4048', metalness: 0.85, roughness: 0.3 }), white: std({ color: '#f2eee6', roughness: 0.92 }),
      skin: std({ color: '#7e463e', roughness: 0.7, metalness: 0.15 }), beak: std({ color: '#e2d2a8', metalness: 0.55, roughness: 0.3 }), eye: new THREE.MeshBasicMaterial({ color: '#ff2a1a' }),
      plateTren: std({ map: plate('TREN DE ORO', '#8c1712', '#ffd24a'), roughness: 0.5, metalness: 0.3 }), plateNum: std({ map: plate('Nº 1 · EL DORADO', '#1d1f25', '#ffd24a'), roughness: 0.5, metalness: 0.4 }),
    };
    for (const k of ['gold', 'brass', 'iron', 'iron2', 'red', 'redL', 'wood', 'hull', 'sail', 'emblem', 'flag', 'glass', 'coal', 'steel', 'steelD', 'white', 'skin', 'beak', 'plateTren', 'plateNum', 'wing']) GFX.linearize(new THREE.Mesh(new THREE.BoxGeometry(), mt[k]));
    flash = ['gold', 'brass', 'iron', 'iron2', 'red', 'redL', 'wood', 'hull', 'steel', 'steelD', 'white', 'skin', 'wing'].map(k => ({ m: mt[k], e: mt[k].emissive.clone(), i: mt[k].emissiveIntensity }));
  }
  // rueda de locomotora: aro, radios, cubo y contrapeso
  function wheel(r, w, spokes = 12, rim = mt.iron, sp = mt.redL) {
    const g = new THREE.Group();
    add(g, cylX(r, w * 0.6, 28), rim); add(g, new THREE.TorusGeometry(r * 0.9, r * 0.07, 6, 28).rotateY(Math.PI / 2), mt.gold);
    for (let i = 0; i < spokes; i++) { const a = i / spokes * TAU, m = add(g, box(w * 0.5, r * 0.82, r * 0.08), sp); m.rotation.x = a; m.position.set(0, Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42); }
    add(g, cylX(r * 0.2, w * 0.9, 14), mt.gold); const cw = add(g, box(w * 0.55, r * 0.3, r * 0.6), sp); cw.position.set(0, -r * 0.5, 0);
    merge(g, new Set()); return g;
  }
  // lingote: prisma trapecio
  const ingotGeo = () => new THREE.CylinderGeometry(0.28, 0.4, 0.26, 4, 1).rotateY(Math.PI / 4).scale(1, 1, 1.9);
  /* ---------- EL TREN DE ORO ---------- */
  function trainWagon(n) {
    const g = new THREE.Group(), keep = new Set(), wh = [];
    add(g, box(2.6, 0.42, 7.6), mt.iron, 0, 1.05, 0); add(g, box(0.4, 0.3, 1.1), mt.iron2, 0, 1.0, 4.3);
    for (const sx of [-1, 1]) { add(g, box(0.12, 1.4, 7.4), mt.red, sx * 1.42, 1.95, 0); const p = add(g, new THREE.PlaneGeometry(5.6, 1.1), mt.plateTren, sx * 1.49, 1.95, 0, 0, sx * Math.PI / 2, 0); add(g, box(0.16, 0.1, 7.5), mt.gold, sx * 1.44, 2.7, 0); add(g, box(0.16, 0.1, 7.5), mt.gold, sx * 1.44, 1.22, 0); for (const z of [-3.5, -1.75, 0, 1.75, 3.5]) add(g, box(0.18, 1.45, 0.12), mt.gold, sx * 1.47, 1.95, z); }
    for (const sz of [-1, 1]) add(g, box(2.96, 1.4, 0.12), mt.red, 0, 1.95, sz * 3.7);
    // carga: lingotes en pirámide, esmeraldas y un cofre
    const ig = ingotGeo(); for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 4 - layer; i++) for (let j = 0; j < 8 - layer * 2; j++) { const m = add(g, ig, mt.gold, -0.95 + layer * 0.31 + i * 0.62, 2.55 + layer * 0.27, -2.9 + layer * 0.75 + j * 0.78); }
    for (let k = 0; k < 5; k++) add(g, new THREE.OctahedronGeometry(0.32, 0).scale(1, 1.4, 1), mt.gem, (Math.random() - 0.5) * 1.8, 3.4 + Math.random() * 0.3, (Math.random() - 0.5) * 5, Math.random(), Math.random(), 0);
    if (n === 2) { add(g, box(1.4, 0.9, 1.0), mt.wood, 0, 3.0, -2.6); add(g, box(1.44, 0.12, 1.04), mt.gold, 0, 3.2, -2.6); add(g, box(1.4, 0.18, 1.0), mt.wood, 0, 3.75, -3.0, -0.9, 0, 0); const sp = glowSprite('#ffd24a', 3.2, 0.8); sp.position.set(0, 3.8, -2.6); g.add(sp); keep.add(sp);
      const tl = add(g, new THREE.SphereGeometry(0.22, 12, 8), mt.tail, 0, 2.9, -3.85); const tg = glowSprite('#ff2a1a', 2.2, 0.9); tg.position.set(0, 2.9, -4.0); g.add(tg); keep.add(tl); }
    for (const z of [-2.6, -1.7, 1.7, 2.6]) for (const sx of [-1, 1]) { const w = wheel(0.5, 0.3, 8, mt.iron, mt.iron2); w.position.set(sx * 1.25, 0.5, z); w.updateMatrix(); for (const m of w.children.slice()) { m.applyMatrix4(w.matrix); g.add(m); } } // a esta velocidad no se nota el giro: van fijas y unidas (pocas llamadas de dibujo)
    for (const z of [-2.15, 2.15]) add(g, box(2.8, 0.3, 1.6), mt.iron2, 0, 0.75, z);
    merge(g, keep); return { g, wh };
  }
  function buildTrain() {
    const out = [], A = { wheels: [], rods: [], smoke: null, lamp: null, whistle: null };
    // locomotora
    { const g = new THREE.Group(), keep = new Set();
      add(g, box(2.5, 0.45, 10.4), mt.iron, 0, 1.05, 0.2); add(g, box(3.1, 0.6, 0.32), mt.red, 0, 1.15, 5.38); add(g, box(3.1, 0.12, 0.34), mt.gold, 0, 1.5, 5.38);
      add(g, cylZ(1.12, 6.4, 32), mt.iron, 0, 2.55, 1.55); for (const z of [-1.2, 0.3, 1.8, 3.3]) add(g, cylZ(1.17, 0.16, 32), mt.gold, 0, 2.55, z);
      add(g, cylZ(1.22, 1.15, 32), mt.iron2, 0, 2.55, 4.85); add(g, cylZ(0.98, 0.14, 28), mt.iron, 0, 2.55, 5.46); add(g, new THREE.TorusGeometry(0.98, 0.08, 8, 30), mt.gold, 0, 2.55, 5.54); add(g, cylZ(0.18, 0.2, 12), mt.gold, 0, 2.55, 5.6);
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; add(g, new THREE.SphereGeometry(0.06, 6, 4), mt.gold, Math.cos(a) * 0.82, 2.55 + Math.sin(a) * 0.82, 5.54); }
      // faro
      add(g, box(0.8, 0.8, 0.85), mt.gold, 0, 4.0, 4.85); add(g, box(0.6, 0.18, 0.95), mt.iron, 0, 4.5, 4.85); const lens = add(g, cylZ(0.3, 0.06, 20), mt.lamp, 0, 4.0, 5.3); keep.add(lens);
      A.lamp = glowSprite('#fff2b0', 6, 0.9); A.lamp.position.set(0, 4.0, 5.6); g.add(A.lamp); keep.add(A.lamp);
      // chimenea de globo
      add(g, cylY(0.38, 0.44, 1.0, 20), mt.iron, 0, 4.1, 4.05); add(g, cylY(0.98, 0.42, 1.35, 24), mt.iron2, 0, 5.2, 4.05); add(g, new THREE.TorusGeometry(0.98, 0.1, 8, 26).rotateX(Math.PI / 2), mt.gold, 0, 5.88, 4.05); add(g, new THREE.TorusGeometry(0.43, 0.07, 6, 20).rotateX(Math.PI / 2), mt.gold, 0, 4.55, 4.05);
      A.smoke = new THREE.Vector3(0, 6.0, 4.05);
      // domos, campana, silbato, pasamanos
      const dome = r => new THREE.SphereGeometry(r, 20, 12, 0, TAU, 0, Math.PI / 2).scale(1, 1.25, 1);
      add(g, cylY(0.55, 0.62, 0.5, 20), mt.gold, 0, 3.65, 2.5); add(g, dome(0.55), mt.gold, 0, 3.9, 2.5); add(g, cylY(0.45, 0.5, 0.4, 20), mt.gold, 0, 3.6, 0.55); add(g, dome(0.45), mt.gold, 0, 3.8, 0.55);
      add(g, new THREE.LatheGeometry([[0, 0.5], [0.12, 0.48], [0.18, 0.3], [0.24, 0.05], [0.3, 0]].map(([a, b]) => new THREE.Vector2(a, b)), 16), mt.gold, 0, 3.75, 1.55); add(g, box(0.06, 0.6, 0.06), mt.iron, 0.3, 3.95, 1.55); add(g, box(0.06, 0.6, 0.06), mt.iron, -0.3, 3.95, 1.55); add(g, box(0.66, 0.06, 0.06), mt.iron, 0, 4.25, 1.55);
      add(g, cylY(0.09, 0.09, 0.7, 10), mt.gold, 0.35, 4.0, -1.85); A.whistle = new THREE.Vector3(0.35, 4.4, -1.85);
      for (const sx of [-1, 1]) { add(g, cylZ(0.045, 6.2, 8), mt.gold, sx * 0.98, 3.2, 1.65); add(g, box(0.55, 0.07, 7.6), mt.red, sx * 1.47, 1.78, 1.2); add(g, box(0.57, 0.04, 7.62), mt.gold, sx * 1.47, 1.83, 1.2);
        // cilindros y crucetas
        add(g, cylZ(0.44, 1.55, 20), mt.iron2, sx * 1.4, 1.45, 3.4); for (const z of [2.62, 4.18]) add(g, cylZ(0.47, 0.1, 20), mt.gold, sx * 1.4, 1.45, z); add(g, box(0.1, 0.12, 2.3), mt.steel, sx * 1.4, 1.45, 1.9); }
      // cabina
      add(g, box(2.9, 2.75, 2.7), mt.red, 0, 2.7, -3.45); add(g, box(3.35, 0.22, 3.2), mt.iron, 0, 4.18, -3.45); add(g, box(3.0, 0.1, 2.8), mt.gold, 0, 4.04, -3.45); add(g, box(2.98, 0.1, 2.78), mt.gold, 0, 1.38, -3.45);
      for (const sx of [-1, 1]) { add(g, box(0.04, 0.95, 1.2), mt.glass, sx * 1.46, 3.25, -3.25); add(g, box(0.06, 1.07, 0.08), mt.gold, sx * 1.47, 3.25, -2.62); add(g, box(0.06, 1.07, 0.08), mt.gold, sx * 1.47, 3.25, -3.88); add(g, box(0.06, 0.08, 1.32), mt.gold, sx * 1.47, 3.8, -3.25); add(g, box(0.06, 0.08, 1.32), mt.gold, sx * 1.47, 2.72, -3.25); add(g, new THREE.PlaneGeometry(2.2, 0.55), mt.plateNum, sx * 1.47, 2.12, -3.45, 0, sx * Math.PI / 2, 0); }
      for (const sx of [-1, 1]) add(g, new THREE.CircleGeometry(0.32, 18), mt.glass, sx * 0.85, 3.4, -2.08);
      // quitapiedras
      for (let i = -4; i <= 4; i++) { const m = add(g, box(0.09, 0.09, 1.5), i % 2 ? mt.gold : mt.redL, i * 0.33, 0.62, 5.95); m.rotation.set(0.55, -i * 0.1, 0); }
      add(g, box(3.0, 0.12, 0.12), mt.gold, 0, 0.98, 5.5); add(g, box(0.4, 0.4, 0.5), mt.iron2, 0, 1.1, 5.75);
      // ruedas motrices, delanteras y traseras + bielas
      for (const sx of [-1, 1]) {
        for (const z of [-1.45, 0.75]) { const w = wheel(0.98, 0.32, 14); w.position.set(sx * 1.38, 0.98, z); g.add(w); keep.add(w); A.wheels.push({ m: w, r: 0.98 }); }
        for (const [z, r, y] of [[3.35, 0.46, 0.46], [4.45, 0.46, 0.46], [-3.9, 0.58, 0.58]]) { const w = wheel(r, 0.26, 8); w.position.set(sx * 1.22, y, z); w.updateMatrix(); for (const m of w.children.slice()) { m.applyMatrix4(w.matrix); g.add(m); } }
        const rod = add(g, box(0.1, 0.16, 2.6), mt.gold); keep.add(rod); const main = add(g, box(0.08, 0.14, 2.4), mt.steel); keep.add(main); A.rods.push({ rod, main, sx });
      }
      merge(g, keep); out.push(g); }
    // ténder con carbón
    { const g = new THREE.Group(), keep = new Set(), wh = [];
      add(g, box(2.6, 0.42, 5.8), mt.iron, 0, 1.0, 0); add(g, box(3.0, 1.7, 5.6), mt.red, 0, 2.05, 0); add(g, box(3.06, 0.12, 5.66), mt.gold, 0, 2.94, 0); add(g, box(3.06, 0.1, 5.66), mt.gold, 0, 1.26, 0);
      for (const sx of [-1, 1]) add(g, new THREE.PlaneGeometry(3.6, 0.9), mt.plateTren, sx * 1.51, 2.05, 0, 0, sx * Math.PI / 2, 0);
      for (let k = 0; k < 14; k++) { const r = 0.45 + Math.random() * 0.35; add(g, new THREE.DodecahedronGeometry(r, 0), mt.coal, (Math.random() - 0.5) * 2.0, 3.0 + Math.random() * 0.25, -2.3 + k * 0.36, Math.random() * 3, Math.random() * 3, 0); }
      for (let k = 0; k < 4; k++) add(g, new THREE.DodecahedronGeometry(0.2, 0), mt.gold, (Math.random() - 0.5) * 1.8, 3.4, (Math.random() - 0.5) * 4);
      for (const z of [-2.1, -1.2, 1.2, 2.1]) for (const sx of [-1, 1]) { const w = wheel(0.5, 0.3, 8, mt.iron, mt.iron2); w.position.set(sx * 1.25, 0.5, z); w.updateMatrix(); for (const m of w.children.slice()) { m.applyMatrix4(w.matrix); g.add(m); } }
      add(g, box(0.4, 0.3, 1.0), mt.iron2, 0, 1.0, 3.3); merge(g, keep); out.push(g); A.wheels.push(...wh); }
    for (const n of [1, 2]) { const w = trainWagon(n); out.push(w.g); A.wheels.push(...w.wh); }
    anim = A; return out;
  }
  // riel dorado: durmientes en instancias + dos rieles (cinta que se actualiza)
  function makeRail() {
    const N = 150, ties = new THREE.InstancedMesh(new THREE.BoxGeometry(3.6, 0.18, 0.5), new THREE.MeshStandardMaterial({ color: '#5a3a22', roughness: 0.9 }), N); GFX.linearize(ties); ties.frustumCulled = false; ties.receiveShadow = true;
    const nv = (N + 1) * 2 * 4, pos = new Float32Array(nv * 3), idx = [];
    for (let r = 0; r < 2; r++) for (let k = 0; k < N; k++) { const b = (r * (N + 1) + k) * 4, c = b + 4; for (let q = 0; q < 4; q++) { const a0 = b + q, a1 = b + (q + 1) % 4, c0 = c + q, c1 = c + (q + 1) % 4; idx.push(a0, c0, a1, a1, c0, c1); } }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx);
    const rails = new THREE.Mesh(geo, mt.gold); rails.frustumCulled = false;
    root.add(ties); root.add(rails); return { N, ties, rails, pos, geo };
  }
  function updateRail(t) {
    const r = rail, B2 = B; if (!r) return; const step = 2, O = {};
    for (let k = 0; k <= r.N; k++) {
      const back = k * step - 4, [u, h] = Boss.trail(B2, Math.max(0, back)), s = T.wrap(B2.d - back), o = T.at(s, O);
      const fade = clamp((back - 230) / 60, 0, 1), sink = fade * 2.2, hh = h - 0.12 - sink;
      for (let side = 0; side < 2; side++) { const uu = u + (side ? 1.38 : -1.38), cx = o.px + o.rx * uu + o.ux * hh, cy = o.py + o.ry * uu + o.uy * hh, cz = o.pz + o.rz * uu + o.uz * hh, b = ((side * (r.N + 1)) + k) * 12;
        const pts = [[-0.09, 0], [0.09, 0], [0.09, 0.22], [-0.09, 0.22]]; for (let q = 0; q < 4; q++) { const [a, y] = pts[q]; r.pos[b + q * 3] = cx + o.rx * a + o.ux * y; r.pos[b + q * 3 + 1] = cy + o.ry * a + o.uy * y; r.pos[b + q * 3 + 2] = cz + o.rz * a + o.uz * y; } }
      if (k < r.N) { X.set(-o.rx, -o.ry, -o.rz); Y.set(o.ux, o.uy, o.uz); Z.set(o.tx, o.ty, o.tz); M.makeBasis(X, Y, Z); Q.setFromRotationMatrix(M); V.set(o.px + o.rx * u + o.ux * (hh - 0.1), o.py + o.ry * u + o.uy * (hh - 0.1), o.pz + o.rz * u + o.uz * (hh - 0.1)); const sc = back < 0 ? 0.001 : 1 - fade; V2.set(sc, sc, sc); M.compose(V, Q, V2); r.ties.setMatrixAt(k, M); }
    }
    r.geo.attributes.position.needsUpdate = true; r.geo.computeVertexNormals(); r.ties.instanceMatrix.needsUpdate = true;
  }
  /* ---------- EL GALEÓN DE VAPOR ---------- */
  const hwz = z => { const t = z / 12; return 3.25 * Math.pow(Math.max(0, 1 - Math.pow(t > 0 ? t : -t * 0.9, t > 0 ? 2.3 : 3.2)), 0.55) + 0.02; };
  const ysz = z => { const t = z / 12; return 2.4 + (t < 0 ? 2.3 * t * t : 1.2 * t * t); };
  const ykz = z => { const t = z / 12; return -1.7 * (1 - Math.pow(Math.abs(t), 6)) + 0.4; };
  function hullGeo() {
    const NZ = 40, NP = 18, pos = [], uv = [], idx = [];
    for (let i = 0; i <= NZ; i++) { const z = -11.6 + 23.6 * i / NZ, hw = hwz(z), ys = ysz(z), yk = ykz(z);
      for (let j = 0; j <= NP; j++) { const ph = -Math.PI / 2 + Math.PI * j / NP, sx = Math.sin(ph), cy = Math.cos(ph), x = Math.sign(sx) * Math.pow(Math.abs(sx), 0.55) * hw, y = ys - (ys - yk) * Math.pow(cy, 0.7);
        pos.push(x, y, z); uv.push(i / NZ * 3, 1 - (1 - Math.abs(sx) * 0.62 - 0.38 * (1 - Math.pow(cy, 0.7))) ); } }
    for (let i = 0; i < NZ; i++) for (let j = 0; j < NP; j++) { const a = i * (NP + 1) + j, b = a + NP + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    // espejo de popa (transom)
    const z0 = -11.6, hw = hwz(z0), ys = ysz(z0), yk = ykz(z0), sh = new THREE.Shape(); sh.moveTo(-hw, ys); for (let j = 0; j <= 18; j++) { const ph = -Math.PI / 2 + Math.PI * j / 18, sx = Math.sin(ph), cy = Math.cos(ph); sh.lineTo(Math.sign(sx) * Math.pow(Math.abs(sx), 0.55) * hw, ys - (ys - yk) * Math.pow(cy, 0.7)); }
    const tr = new THREE.ShapeGeometry(sh).rotateY(Math.PI).translate(0, 0, z0); return [g, tr];
  }
  function sailGeo(w, h, bulge) { const g = new THREE.PlaneGeometry(w, h, 10, 8), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) / w + 0.5, y = p.getY(i) / h + 0.5; p.setZ(i, Math.sin(x * Math.PI) * Math.sin(y * Math.PI * 0.9 + 0.15) * bulge); } g.computeVertexNormals(); return g; }
  function buildGaleon() {
    const g = new THREE.Group(), keep = new Set(), A = { paddles: [], smoke: [], sails: [], flag: null, jets: [], lanterns: [], cannons: [] };
    const [hg, tg] = hullGeo(); add(g, hg, mt.hull); add(g, tg, mt.stern);
    // cubierta y bordas
    { const sh = new THREE.Shape(); for (let i = 0; i <= 30; i++) { const z = -11.4 + 22.6 * i / 30; i ? sh.lineTo(-hwz(z) * 0.94, -z) : sh.moveTo(-hwz(z) * 0.94, -z); } for (let i = 30; i >= 0; i--) { const z = -11.4 + 22.6 * i / 30; sh.lineTo(hwz(z) * 0.94, -z); }
      add(g, new THREE.ShapeGeometry(sh).rotateX(-Math.PI / 2), mt.wood, 0, 2.55, 0); }
    for (const sx of [-1, 1]) for (let i = 0; i < 24; i++) { const z = -11 + i * 0.95, z2 = z + 0.95, a = new THREE.Vector3(sx * hwz(z) * 0.98, ysz(z) + 0.55, z), b = new THREE.Vector3(sx * hwz(z2) * 0.98, ysz(z2) + 0.55, z2); const d = b.clone().sub(a), m = add(g, cylY(0.07, 0.07, d.length(), 6), mt.gold, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); m.quaternion.setFromUnitVectors(AY, d.normalize()); if (i % 2 === 0) add(g, cylY(0.05, 0.05, 0.6, 6), mt.gold, a.x, a.y - 0.3, a.z); }
    // castillo de popa con ventanas y faroles
    add(g, box(5.4, 2.5, 4.2), mt.wood, 0, ysz(-10) + 0.1, -9.6); add(g, box(5.7, 0.2, 4.5), mt.gold, 0, ysz(-10) + 1.4, -9.6); add(g, new THREE.PlaneGeometry(5.2, 2.2), mt.stern, 0, ysz(-10) + 0.05, -11.72, 0, Math.PI, 0);
    for (const sx of [-1, 1]) { add(g, cylY(0.22, 0.16, 0.6, 10), mt.brass, sx * 2.5, ysz(-11) + 2.0, -11.6); const l = glowSprite('#ffc860', 2.6, 0.9); l.position.set(sx * 2.5, ysz(-11) + 2.05, -11.6); g.add(l); keep.add(l); A.lanterns.push(l); }
    add(g, box(4.2, 1.2, 3.2), mt.wood, 0, ysz(9) + 0.0, 8.6);
    // mástiles, vergas y velas
    // aparejo (mástiles, vergas, velas, bandera) en su propio grupo: se recoge al pasar bajo el arco de roca
    const rig = new THREE.Group(), rigKeep = new Set(); rig.position.y = 2.6; g.add(rig); keep.add(rig); A.rig = rig;
    const masts = [[6.2, 14.5, 7.5], [-0.6, 17.5, 9.2], [-6.6, 12.5, 6.4]];
    for (const [z, h, w] of masts) { add(rig, cylY(0.22, 0.34, h, 12), mt.wood, 0, h / 2, z); add(rig, cylY(0.75, 0.55, 0.5, 14), mt.wood, 0, h * 0.72, z); add(rig, new THREE.TorusGeometry(0.75, 0.05, 6, 16).rotateX(Math.PI / 2), mt.gold, 0, 0.25 + h * 0.72, z);
      for (const [f, ww, sh2] of [[0.36, w, h * 0.3], [0.7, w * 0.78, h * 0.24]]) { const y = h * f; add(rig, cylX(0.12, ww + 0.6, 8), mt.wood, 0, y, z + 0.25); const sl = add(rig, sailGeo(ww, sh2, 0.9), z === -0.6 && f < 0.5 ? mt.emblem : mt.sail, 0, y - sh2 / 2 - 0.1, z + 0.45); rigKeep.add(sl); A.sails.push(sl); } }
    add(g, cylY(0.14, 0.2, 7, 8), mt.wood, 0, 4.6, 13.4, 1.05, 0, 0);
    { const jib = new THREE.Shape(); jib.moveTo(0, 0); jib.lineTo(0, 9.5); jib.lineTo(5.6, 0); jib.lineTo(0, 0); add(rig, new THREE.ShapeGeometry(jib), mt.sail, 0, 1.7, 7.0, 0, -Math.PI / 2, 0); }
    // bandera
    { const fl = add(rig, new THREE.PlaneGeometry(2.6, 1.7, 6, 3).translate(1.3, 0, 0), mt.flag, 0, 17.5 + 0.6, -0.6); rigKeep.add(fl); A.flag = fl; } merge(rig, rigKeep);
    // chimenea de bronce (vapor) y calderas
    add(g, cylY(0.78, 0.92, 5.4, 22), mt.brass, 0, 2.6 + 2.7, 2.8); for (const y of [3.4, 5.0, 6.6]) add(g, new THREE.TorusGeometry(0.86, 0.08, 6, 22).rotateX(Math.PI / 2), mt.gold, 0, y, 2.8); add(g, cylY(1.05, 0.8, 0.7, 22), mt.iron, 0, 8.3, 2.8); A.smoke.push(new THREE.Vector3(0, 8.8, 2.8));
    add(g, cylZ(1.0, 2.6, 18), mt.iron2, 0, 3.4, 4.6); add(g, cylZ(1.04, 0.12, 18), mt.gold, 0, 3.4, 5.9);
    // ruedas de paletas en cajas de bronce
    for (const sx of [-1, 1]) { const x0 = sx * (hwz(0.8) + 0.75), w = new THREE.Group();
      for (const dx of [-0.48, 0.48]) add(w, new THREE.TorusGeometry(2.3, 0.08, 6, 30).rotateY(Math.PI / 2), mt.iron, dx, 0, 0);
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, p = add(w, box(1.1, 0.08, 0.75), mt.red, 0, Math.cos(a) * 1.95, Math.sin(a) * 1.95); p.rotation.x = -a; const sp = add(w, box(0.06, 2.3, 0.06), mt.iron2, 0, Math.cos(a) * 1.15, Math.sin(a) * 1.15); sp.rotation.x = -a; }
      add(w, cylX(0.35, 1.2, 14), mt.gold); merge(w, new Set()); w.position.set(x0, 1.6, 0.8); g.add(w); keep.add(w); A.paddles.push(w);
      add(g, new THREE.CylinderGeometry(2.65, 2.65, 1.35, 24, 1, false, 0, Math.PI).rotateZ(Math.PI / 2), mt.wood, x0, 1.6, 0.8); add(g, new THREE.TorusGeometry(2.65, 0.1, 6, 24, Math.PI).rotateY(Math.PI / 2), mt.gold, x0 + sx * 0.68, 1.6, 0.8); }
    // cañones: dos de popa (disparan atrás) y cuatro por banda
    for (const sx of [-1, 1]) { const c = add(g, cylZ(0.24, 1.5, 14, 0.3), mt.iron, sx * 1.3, ysz(-11.6) - 0.9, -12.1); add(g, new THREE.TorusGeometry(0.26, 0.06, 6, 14), mt.gold, sx * 1.3, ysz(-11.6) - 0.9, -12.85); A.cannons.push(new THREE.Vector3(sx * 1.3, ysz(-11.6) - 0.9, -13));
      for (let i = 0; i < 4; i++) { const z = -5 + i * 3.2; add(g, cylX(0.2, 1.1, 12), mt.iron, sx * (hwz(z) + 0.15), 3.05, z); } }
    // mascarón de oro
    add(g, new THREE.SphereGeometry(0.45, 14, 10), mt.gold, 0, 3.2, 12.0); add(g, new THREE.ConeGeometry(0.4, 1.4, 12).rotateX(Math.PI / 2), mt.gold, 0, 2.7, 12.4);
    // chorros de vapor por debajo (flota sobre la tierra)
    for (const [x, z] of [[-1.6, -6], [1.6, -6], [-1.6, 5], [1.6, 5]]) { const j = glowSprite('#dff6ff', 3.4, 0); j.position.set(x, -0.9, z); g.add(j); keep.add(j); A.jets.push(j); }
    merge(g, keep); anim = A; return [g];
  }
  /* ---------- EL CÓNDOR DE HIERRO ---------- */
  function feather(len, w, mat) { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(w * 0.6, len * 0.3, w * 0.45, len * 0.85); sh.lineTo(0, len); sh.lineTo(-w * 0.45, len * 0.85); sh.quadraticCurveTo(-w * 0.6, len * 0.3, 0, 0); const g = new THREE.ExtrudeGeometry(sh, { depth: 0.07, bevelEnabled: false, curveSegments: 4 }); g.translate(0, 0, -0.035); g.rotateX(-Math.PI / 2); return g; } // apunta hacia -z
  // espejo en x conservando las caras hacia afuera (invierte el orden de los triángulos)
  function mirrorX(geo) { geo.scale(-1, 1, 1); const g = geo.index ? geo.toNonIndexed() : geo; for (const k of ['position', 'normal', 'uv']) { const a = g.attributes[k]; if (!a) continue; const n = a.itemSize, arr = a.array; for (let i = 0; i < arr.length; i += n * 3) for (let q = 0; q < n; q++) { const t = arr[i + n + q]; arr[i + n + q] = arr[i + 2 * n + q]; arr[i + 2 * n + q] = t; } } g.computeVertexNormals(); if (g !== geo) { geo.copy(g); } return geo; }
  function gear(r, teeth, th) { const g = new THREE.Group(); add(g, new THREE.TorusGeometry(r, r * 0.2, 6, 24), mt.gold); for (let i = 0; i < teeth; i++) { const a = i / teeth * TAU, m = add(g, box(r * 0.3, r * 0.3, th), mt.gold, Math.cos(a) * r * 1.15, Math.sin(a) * r * 1.15, 0); m.rotation.z = a; } add(g, cylZ(r * 0.3, th * 1.4, 12), mt.iron2); return g; }
  function buildCondor() {
    const g = new THREE.Group(), keep = new Set(), A = { wings: [], tail: null, gears: [], jets: [], eyes: [] };
    add(g, new THREE.SphereGeometry(1, 32, 20).scale(1.35, 1.25, 3.5), mt.iron); add(g, new THREE.SphereGeometry(1, 24, 14, 0, TAU, 0, Math.PI / 2).scale(1.2, 0.7, 3.0), mt.iron2, 0, 0.35, -0.2);
    for (const z of [-1.8, -0.4, 1.0, 2.2]) { const k = Math.sqrt(Math.max(0.05, 1 - (z / 3.5) ** 2)); add(g, new THREE.TorusGeometry(1, 0.05, 6, 30).scale(1.36 * k, 1.26 * k, 1), mt.gold, 0, 0, z); }
    for (let i = 0; i < 14; i++) { const z = -2.6 + i * 0.38; add(g, new THREE.SphereGeometry(0.06, 6, 4), mt.gold, 0, 1.26 * Math.sqrt(Math.max(0.05, 1 - (z / 3.5) ** 2)) + 0.02, z); }
    // collar blanco esponjado
    { const ruff = new THREE.TorusGeometry(1.0, 0.46, 12, 28), p = ruff.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = 1 + 0.12 * Math.sin(x * 9 + y * 7) + 0.08 * Math.sin(z * 13 + x * 5); p.setXYZ(i, x * n, y * n, z * n); } ruff.computeVertexNormals(); add(g, ruff, mt.white, 0, 0.25, 3.0); }
    // cuello, cabeza, cresta, pico ganchudo y ojos rojos
    add(g, cylZ(0.42, 1.3, 16, 0.55), mt.skin, 0, 0.45, 3.8); add(g, new THREE.SphereGeometry(0.62, 22, 16).scale(0.85, 0.82, 1.15), mt.skin, 0, 0.62, 4.55); add(g, box(0.16, 0.42, 0.9), mt.iron, 0, 1.15, 4.6);
    { const sh = new THREE.Shape(); sh.moveTo(0, 0.28); sh.quadraticCurveTo(0.7, 0.36, 1.0, -0.05); sh.quadraticCurveTo(1.05, -0.38, 0.86, -0.42); sh.quadraticCurveTo(0.84, -0.12, 0.55, -0.12); sh.lineTo(0, -0.22); sh.lineTo(0, 0.28);
      const bk = new THREE.ExtrudeGeometry(sh, { depth: 0.32, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2, curveSegments: 8 }); bk.translate(0, 0, -0.16); bk.rotateY(-Math.PI / 2); add(g, bk, mt.beak, 0, 0.55, 5.05); }
    for (const sx of [-1, 1]) { const e = add(g, new THREE.SphereGeometry(0.11, 10, 8), mt.eye, sx * 0.43, 0.8, 4.85); keep.add(e); const gl = glowSprite('#ff3a1a', 1.4, 1); gl.position.set(sx * 0.48, 0.8, 4.9); g.add(gl); keep.add(gl); A.eyes.push(gl); }
    // alas: hombro → antebrazo → mano, plumas de acero, banda blanca, engranaje en el hombro
    for (const sg of [1, -1]) {
      const sh = new THREE.Group(); sh.position.set(sg * 1.05, 0.55, 0.5); g.add(sh); keep.add(sh);
      const arm = new THREE.Group(); sh.add(arm); const fore = new THREE.Group(); fore.position.set(sg * 4.4, 0, -0.2); arm.add(fore); const hand = new THREE.Group(); hand.position.set(sg * 4.2, 0, -0.35); fore.add(hand);
      // ala de ave: borde de ataque curvo y borde de fuga dentado (plumas), banda blanca arriba como el cóndor
      const wingSeg = (len, lead0, lead1, c0, c1, mat, teeth, th = 0.12, td = 0.42) => { const s2 = new THREE.Shape(); s2.moveTo(0, lead0); s2.quadraticCurveTo(len * 0.5, (lead0 + lead1) / 2 + 0.3, len, lead1);
        const t0 = lead1 - c1, t1 = lead0 - c0; s2.lineTo(len, t0); for (let k = 1; k <= teeth; k++) { const fa = (k - 0.5) / teeth, fb = k / teeth; s2.lineTo(len * (1 - fa), lerp(t0, t1, fa) - td); s2.lineTo(len * (1 - fb), lerp(t0, t1, fb)); } s2.lineTo(0, lead0);
        const geo = new THREE.ExtrudeGeometry(s2, { depth: th, bevelEnabled: false, curveSegments: 6 }); geo.rotateX(Math.PI / 2); if (sg < 0) mirrorX(geo); const m = new THREE.Mesh(geo, mat); m.castShadow = GQ.lv > 0; return m; };
      arm.add(wingSeg(4.5, 0.35, 0.2, 2.5, 2.0, mt.wing, 7)); fore.add(wingSeg(4.3, 0.2, 0.05, 2.0, 1.5, mt.wing, 7));
      const b0 = wingSeg(3.9, -0.45, -0.5, 0.55, 0.5, mt.white, 5, 0.04, 0.2); b0.position.set(sg * 0.4, 0.05, 0); arm.add(b0); const b1 = wingSeg(3.7, -0.5, -0.6, 0.5, 0.42, mt.white, 5, 0.04, 0.2); b1.position.set(sg * 0.3, 0.05, 0); fore.add(b1);
      arm.add(add(new THREE.Group(), cylX(0.11, 4.5, 8), mt.gold, sg * 2.25, -0.05, 0.42)); fore.add(add(new THREE.Group(), cylX(0.09, 4.3, 8), mt.gold, sg * 2.15, -0.05, 0.25));
      // primarias: los «dedos» abiertos en la punta
      for (let i = 0; i < 7; i++) { const f = new THREE.Mesh(feather(3.2 + Math.sin(i / 6 * Math.PI) * 1.1, 0.62, mt.wing), i % 2 ? mt.wing : mt.steelD); f.position.set(sg * 0.1, -0.05, -0.15 - i * 0.2); f.rotation.y = -sg * (Math.PI / 2 + 0.08 - i * 0.16); f.rotation.z = sg * (0.03 * i); f.castShadow = GQ.lv > 0; hand.add(f); }
      { const hp = wingSeg(1.0, 0.05, 0.0, 1.5, 1.2, mt.wing, 2); hand.add(hp); }
      const ge = gear(0.42, 10, 0.16); ge.rotation.y = Math.PI / 2; ge.position.set(sg * 0.2, 0, 0); sh.add(ge); A.gears.push(ge);
      merge(arm, new Set()); merge(fore, new Set()); merge(hand, new Set());
      A.wings.push({ sg, sh, arm, fore, hand });
    }
    // cola en abanico
    { const tl = new THREE.Group(); tl.position.set(0, 0.2, -3.2); const fg = feather(3.2, 0.7, mt.steel); for (let i = 0; i < 9; i++) { const f = new THREE.Mesh(fg, i % 2 ? mt.steelD : mt.steel); f.rotation.y = (i - 4) * 0.13; tl.add(f); } g.add(tl); keep.add(tl); A.tail = tl; }
    // garras recogidas y propulsores
    for (const sx of [-1, 1]) { add(g, cylY(0.16, 0.2, 1.1, 8), mt.brass, sx * 0.6, -1.25, -0.9, 0.5, 0, 0); for (let k = -1; k <= 1; k++) add(g, new THREE.ConeGeometry(0.08, 0.5, 6).rotateX(Math.PI * 0.7), mt.beak, sx * 0.6 + k * 0.14, -1.7, -0.55);
      add(g, cylZ(0.34, 1.4, 16, 0.42), mt.iron2, sx * 0.85, 0.6, -2.6); add(g, new THREE.TorusGeometry(0.4, 0.06, 6, 16), mt.gold, sx * 0.85, 0.6, -3.3); const j = glowSprite('#ff9a3a', 2.4, 0.9); j.position.set(sx * 0.85, 0.6, -3.6); g.add(j); keep.add(j); A.jets.push(j); }
    { const ge = gear(0.5, 12, 0.18); ge.position.set(0, 1.15, -0.6); ge.rotation.x = -Math.PI / 2; g.add(ge); keep.add(ge); A.gears.push(ge); }
    merge(g, keep); anim = A; return [g];
  }
  /* ---------- lo que sueltan ---------- */
  function hazMesh(z) {
    const g = new THREE.Group();
    if (z.k === 'barrel') { const b = new THREE.Group(), inner = new THREE.Group(); add(inner, cylY(0.52, 0.52, 1.15, 16), mt.wood); add(inner, cylY(0.58, 0.58, 0.85, 16), mt.wood); for (const y of [-0.4, 0.4]) add(inner, new THREE.TorusGeometry(0.56, 0.04, 6, 18).rotateX(Math.PI / 2), mt.iron, 0, y, 0); add(inner, cylY(0.3, 0.3, 1.18, 12), mt.redL); inner.rotation.z = Math.PI / 2; b.add(inner); b.position.y = 0.58; g.add(b); g.userData.b = b;
      const sp = glowSprite('#ffb030', 1.3, 1); sp.position.y = 1.3; g.add(sp); g.userData.spark = sp; }
    else if (z.k === 'coal') { add(g, new THREE.DodecahedronGeometry(0.5, 0), mt.coal); const sp = glowSprite('#ff6a1a', 2.2, 0.9); g.add(sp); }
    else if (z.k === 'mine') { const m = new THREE.Group(); add(m, new THREE.SphereGeometry(0.6, 16, 12), mt.iron2); for (let i = 0; i < 10; i++) { const d = new THREE.Vector3().setFromSphericalCoords(1, Math.acos(1 - 2 * (i + 0.5) / 10), i * 2.4), c = add(m, new THREE.ConeGeometry(0.1, 0.4, 6), mt.brass, d.x * 0.68, d.y * 0.68, d.z * 0.68); c.quaternion.setFromUnitVectors(AY, d); } const l = glowSprite('#ff2020', 1.4, 1); l.position.y = 0.7; m.add(l); m.userData.l = l; m.position.y = 0.6; g.add(m); g.userData.m = m; }
    else if (z.k === 'shell') { add(g, new THREE.SphereGeometry(0.42, 14, 10), mt.iron); const sp = glowSprite('#ffb060', 1.4, 0.7); g.add(sp); }
    else if (z.k === 'feather') { const f = new THREE.Mesh(feather(2.8, 0.8, mt.steel), mt.steel); f.rotation.x = Math.PI / 2 - 0.12; f.position.y = 0; g.add(f); const q = add(g, cylY(0.06, 0.06, 0.8, 6), mt.gold, 0, 2.9, 0); }
    else if (z.k === 'wagon') { const w = trainWagon(z.n || 2); g.add(w.g); g.userData.wh = w.wh; }
    else if (z.k === 'loot') { const L = new THREE.Group();
      if (z.kind === 'lingote') { for (const [x, y, zz] of [[-0.3, 0, 0], [0.3, 0, 0], [0, 0.26, 0]]) add(L, ingotGeo(), mt.gold, x, y, zz); }
      else if (z.kind === 'cofre') { add(L, box(1.1, 0.7, 0.75), mt.wood); add(L, box(1.14, 0.1, 0.79), mt.gold, 0, 0.2, 0); add(L, new THREE.CylinderGeometry(0.38, 0.38, 1.1, 14, 1, false, 0, Math.PI).rotateZ(Math.PI / 2), mt.wood, 0, 0.35, 0); add(L, box(0.18, 0.24, 0.06), mt.gold, 0, 0.18, 0.4); }
      else add(L, new THREE.OctahedronGeometry(0.6, 0).scale(1, 1.4, 1), mt.gem);
      const sp = glowSprite(z.kind === 'esmeralda' ? '#3dffa8' : '#ffd24a', 3.6, 0.85); L.add(sp); g.add(L); g.userData.L = L; }
    g.traverse(m => { if (m.isMesh) m.castShadow = GQ.lv > 1; }); scene.add(g); return g;
  }
  // marcas en el piso: círculo rojo (bala de cañón) y sombra con borde (pluma)
  let ringTex = null, shTex = null;
  function marker(kind) {
    if (!ringTex) { ringTex = tex(128, 128, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = '#ff2a1a'; x.lineWidth = 9; x.setLineDash([16, 9]); x.beginPath(); x.arc(64, 64, 56, 0, TAU); x.stroke(); x.setLineDash([]); const g = x.createRadialGradient(64, 64, 0, 64, 64, 56); g.addColorStop(0, 'rgba(255,40,20,0.55)'); g.addColorStop(0.7, 'rgba(255,40,20,0.18)'); g.addColorStop(1, 'rgba(255,40,20,0.05)'); x.fillStyle = g; x.beginPath(); x.arc(64, 64, 56, 0, TAU); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 4; x.beginPath(); x.moveTo(64, 34); x.lineTo(64, 94); x.moveTo(34, 64); x.lineTo(94, 64); x.stroke(); }, false);
      shTex = tex(128, 128, (x, w, h) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 62); g.addColorStop(0, 'rgba(0,0,0,0.7)'); g.addColorStop(0.75, 'rgba(0,0,0,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, false); }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: kind === 'ring' ? ringTex : shTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 })); m.renderOrder = 3; scene.add(m); return m;
  }
  // colocar en el marco de la pista con rumbo (yaw) y alabeo (roll)
  function place(o3, s, u, h, yaw = 0, roll = 0, pitch = 0) {
    const o = T.at(s); X.set(-o.rx, -o.ry, -o.rz); Y.set(o.ux, o.uy, o.uz); Z.set(o.tx, o.ty, o.tz); M.makeBasis(X, Y, Z); Q.setFromRotationMatrix(M);
    if (yaw) { Q2.setFromAxisAngle(AY, yaw); Q.multiply(Q2); } if (pitch) { Q2.setFromAxisAngle(AX, pitch); Q.multiply(Q2); } if (roll) { Q2.setFromAxisAngle(AZ, roll); Q.multiply(Q2); }
    T.pos(s, u, h, V); o3.position.copy(V); o3.quaternion.copy(Q);
  }
  /* ---------- herramientas para los minijefes y los retos (07d) ---------- */
  const H = { add, merge, glowSprite, tex, feather, place, flash: m => flash.push({ m, e: m.emissive.clone(), i: m.emissiveIntensity }), get mt() { return mt; }, get scene() { return scene; } };
  /* ---------- montar y animar ---------- */
  function clear() { if (B && B.def.mini) MiniArt.dispose(anim); MiniArt.worldClear(W); W = null; if (root && root.parent) root.parent.remove(root); root = null; segG = []; anim = null; rail = null; shadowBlob = null; for (const [, m] of hz) { if (m.parent) m.parent.remove(m); if (m.userData.mk && m.userData.mk.parent) m.userData.mk.parent.remove(m.userData.mk); } hz.clear(); B = null; }
  function init(sc, R) {
    clear(); scene = sc; T = R.track; if (!mt) mats();
    if (R.storm || (R.xGeysers && R.xGeysers.length)) W = MiniArt.worldInit(R, scene, H);
    if (!R.boss) return; B = R.boss;
    root = new THREE.Group(); scene.add(root);
    const id = B.def.id; let list;
    if (B.def.mini) { const o = MiniArt.build(id, H, B); list = o.list; anim = o.A; } else list = id === 'tren' ? buildTrain() : id === 'galeon' ? buildGaleon() : buildCondor();
    segG = list.map(g => { root.add(g); return g; });
    if (id === 'tren') rail = makeRail();
    if (id === 'condor') { shadowBlob = marker('shadow'); shadowBlob.scale.set(20, 1, 12); }
  }
  let wheelD = 0, puffT = 0, flapT = 0, flashOn = true; const FLASHC = new THREE.Color(1, 0.95, 0.85);
  function update(R, t, dt, events) {
    if (!scene) return;
    if (B && R.boss === B) updateBoss(R, t, dt, events);
    if (R.bz) updateHaz(R, t, dt);
    if (W) MiniArt.worldStep(W, R, t, dt, events, H);
  }
  const P = { roll: 0, pitch: 0, yaw: 0, dh: 0 };
  function updateBoss(R, t, dt, events) {
    const def = B.def, id = def.id, dying = B.dying > 0 || B.dead;
    // destello al recibir daño
    const fk = clamp(B.hitT / 0.3, 0, 1); if (fk > 0 || flashOn) { flashOn = fk > 0; for (const f of flash) { f.m.emissive.copy(f.e).lerp(FLASHC, fk * 0.8); f.m.emissiveIntensity = f.i + fk * 0.9; } }
    // segmentos en su lugar sobre el riel / agua / cielo
    const yawAt = (back) => { const [u1] = Boss.trail(B, back), [u2] = Boss.trail(B, back + 3); return Math.atan2(u1 - u2, 3); };
    B.segs.forEach((g, i) => { const m = segG[i]; if (!m) return; m.visible = g.on;
      if (!g.on) return; const p = Boss.segPos(B, g), back = g.off + g.len / 2;
      let roll = 0, pitch = 0, yaw = -yawAt(back);
      if (id === 'galeon') { roll = Math.sin(t * 0.9) * 0.04 + (T.zone(T.wrap(p.s), 'water') ? Math.sin(t * 1.7) * 0.03 : 0); pitch = Math.sin(t * 0.7) * 0.02; }
      if (id === 'condor') { roll = (B.u - B.uT) * -0.05 + Math.sin(t * 0.8) * 0.06; pitch = B.dive ? (B.dive.st === 'swoop' ? 0.35 : B.dive.st === 'warn' ? -0.25 : B.dive.st === 'climb' ? -0.3 : 0) : Math.sin(t * 0.6) * 0.04; }
      if (dying && !def.mini) { const k = Math.min(1, B.dying / 2.6); if (id === 'tren') { roll = (i % 2 ? 1 : -1) * 0.28 * k; yaw += (i % 2 ? 0.25 : -0.2) * k; } else if (id === 'galeon') { roll = 0.3 * k; pitch = -0.12 * k; } else { roll = B.dying * 2.2; pitch = 0.5 * k; } }
      let dh = id === 'galeon' && !T.zone(T.wrap(p.s), 'water') ? Math.sin(t * 2.2) * 0.15 : 0;
      if (def.mini) { P.roll = roll; P.pitch = pitch; P.dh = dh; MiniArt.pose(B, i, t, P); roll = P.roll; pitch = P.pitch; dh = P.dh; }
      place(m, T.wrap(p.s), p.u, p.h + dh, yaw, roll, pitch); });
    const lead = segG[0]; if (!lead) return; lead.updateMatrixWorld();
    if (def.mini) { for (const g of segG) g.updateMatrixWorld(); MiniArt.animate(B, anim, segG, R, t, dt, events, H); }
    // animación propia
    if (id === 'tren') { wheelD += B.v * dt; for (const w of anim.wheels) w.m.rotation.x = wheelD / w.r;
      const th = wheelD / 0.98; for (const r of anim.rods) { const cy = 0.98 + Math.sin(th) * 0.38, cz = Math.cos(th) * 0.38; r.rod.position.set(r.sx * 1.62, cy, -0.35 + cz); const px = 2.3 + cz * 0.4; r.main.position.set(r.sx * 1.66, (cy + 1.45) / 2, (0.75 + cz + px) / 2 + 0.2); r.main.rotation.x = Math.atan2(cy - 1.45, 2.4); }
      anim.lamp.material.opacity = 0.7 + Math.sin(t * 9) * 0.05; updateRail(t); }
    if (id === 'galeon' && anim.rig) { let lo = 1; for (const c of (T.def.lowAt || [])) { const d = Math.abs(T.wrap(T.cp(c) - B.s + T.L / 2) - T.L / 2); lo = Math.min(lo, smooth(clamp((d - 30) / 60, 0, 1))); } anim.rigK = damp(anim.rigK == null ? 1 : anim.rigK, 0.38 + 0.62 * lo, 3, dt); anim.rig.scale.y = anim.rigK; }
    if (id === 'galeon') { for (const p of anim.paddles) p.rotation.x += B.v * dt / 2.3; for (const s of anim.sails) s.scale.z = 1 + Math.sin(t * 1.7 + s.position.y) * 0.12; if (anim.flag) anim.flag.rotation.y = Math.sin(t * 3.1) * 0.35 + 0.2;
      const land = !T.zone(B.s, 'water'); for (const j of anim.jets) { j.material.opacity = land ? 0.55 + Math.random() * 0.3 : 0; j.scale.set(3 + Math.random(), 3 + Math.random(), 1); } }
    if (id === 'condor') { flapT += dt; const dive = B.dive && (B.dive.st === 'swoop' || B.dive.st === 'warn'), burst = (flapT % 3.4) < 1.3 || (B.dive && B.dive.st === 'climb'), amp = dive ? 0.06 : burst ? 0.5 : 0.1, w = burst ? 7 : 2.2;
      for (const W of anim.wings) { const sw = dive ? 0.85 : 0, th = Math.sin(flapT * w) * amp + (dive ? -0.15 : 0.05); W.sh.rotation.set(0, W.sg * sw, W.sg * th); W.fore.rotation.set(0, W.sg * sw * 0.4, W.sg * Math.sin(flapT * w - 0.5) * amp * 0.6); W.hand.rotation.set(0, W.sg * sw * 0.3, W.sg * (Math.sin(flapT * w - 1) * amp * 0.5 + 0.08)); }
      if (anim.tail) anim.tail.rotation.x = Math.sin(t * 1.3) * 0.06 + (B.dive && B.dive.st === 'swoop' ? -0.25 : 0); for (const ge of anim.gears) ge.rotation.z += dt * 2.5;
      for (const e of anim.eyes) e.material.opacity = 0.75 + Math.sin(t * 6) * 0.25 + (B.dive ? 0.3 : 0);
      if (shadowBlob) { const [u0] = [B.u]; T.pos(B.s, u0, T.groundH(B.s, u0) + 0.06, V); const o = T.at(B.s); shadowBlob.position.copy(V); shadowBlob.rotation.y = Math.atan2(o.tx, o.tz); const k = clamp(1 - (B.h - 1) / 16, 0.15, 1); shadowBlob.material.opacity = k * 0.9; shadowBlob.scale.set(20 * (1.2 - k * 0.3), 1, 12 * (1.2 - k * 0.3)); shadowBlob.visible = !B.dead && !T.zone(B.s, 'air') && !T.zone(B.s, 'gap'); } }
    for (const j of (anim.jets || [])) if (id === 'condor') { j.material.opacity = 0.6 + Math.random() * 0.4; j.scale.setScalar(2 + Math.random() * 1.2 + (B.v > def.speed ? 1 : 0)); }
    // humo de chimenea, vapor y daño
    puffT -= dt; if (puffT <= 0 && !B.dead) { puffT = id === 'tren' ? clamp(0.5 - B.v * 0.007, 0.08, 0.5) : 0.12;
      const pts = id === 'tren' ? [anim.smoke] : id === 'galeon' ? anim.smoke : []; for (const p of pts) { V.copy(p).applyMatrix4(lead.matrixWorld); FX.puff(V.x, V.y, V.z, (Math.random() - 0.5) * 2, 4 + Math.random() * 3, (Math.random() - 0.5) * 2, 0.32, 0.3, 0.3, 0.42, 1.5, 1.6, -0.5, 0.8, 3); }
      if (id === 'galeon' && !T.zone(B.s, 'water')) for (let k = 0; k < 2; k++) { V.set((Math.random() - 0.5) * 4, -1.2, (Math.random() - 0.5) * 16).applyMatrix4(lead.matrixWorld); FX.puff(V.x, V.y, V.z, 0, -2, 0, 0.92, 0.95, 1, 0.5, 1.8, 0.8, 0, 2, 2); }
      if (id === 'galeon' && T.zone(B.s, 'water')) { V.set((Math.random() - 0.5) * 6, 0.2, -11.5).applyMatrix4(lead.matrixWorld); FX.puff(V.x, V.y, V.z, 0, 1, 0, 1, 1, 1, 0.6, 1.5, 1.2, 2, 1, 1.5); }
      if (B.phase === 2 || dying) { const sg = segG[Math.floor(Math.random() * segG.length)]; if (sg && sg.visible) { V.set((Math.random() - 0.5) * 2, 2 + Math.random() * 2, (Math.random() - 0.5) * 4).applyMatrix4(sg.matrixWorld); FX.puff(V.x, V.y, V.z, 0, 3, 0, 0.08, 0.08, 0.09, 0.6, 2, 2, -1, 0.5, 2.5); if (Math.random() < 0.4) FX.puff(V.x, V.y, V.z, (Math.random() - 0.5) * 6, 4, (Math.random() - 0.5) * 6, 1, 0.6, 0.2, 1, 0.3, 0.5, 9, 1, 0, true); } } }
    // eventos: fogonazos de cañón, silbato, botín
    for (const e of events) {
      if (e.type === 'bossAtk' && id === 'galeon' && (e.k === 'cannon' || e.k === 'volley')) for (const c of anim.cannons) { V.copy(c).applyMatrix4(lead.matrixWorld); FX.emit('glow', V.x, V.y, V.z, 24, { c: [[1, 0.9, 0.5], [1, 0.5, 0.15]], sp: 9, size: 0.7, life: 0.35, drag: 3 }); FX.emit('smoke', V.x, V.y, V.z, 10, { c: [[0.7, 0.7, 0.72]], sp: 3, size: 2.2, life: 1.4, drag: 2, grow: 2, a: 0.5 }); }
      if (e.type === 'bossAtk' && id === 'tren' && anim.whistle) { V.copy(anim.whistle).applyMatrix4(lead.matrixWorld); FX.emit('smoke', V.x, V.y, V.z, 14, { c: [[1, 1, 1]], sp: 2, up: 6, size: 1.4, life: 1, drag: 1.5, grow: 2, a: 0.6 }); }
      if (e.type === 'bossHit') { const g = segG[segG.length - 1]; if (g && g.visible) { V.set(0, 2.5, 0).applyMatrix4(g.matrixWorld); FX.emit('glow', V.x, V.y, V.z, 26, { c: [[1, 0.95, 0.6], [1, 0.7, 0.2], [1, 1, 1]], sp: 11, size: 0.5, life: 0.45, g: 8, drag: 2 }); } }
      if (e.type === 'lootGot') { T.pos(e.s, e.u, T.groundH(e.s, e.u) + 1.3, V); FX.emit('glow', V.x, V.y, V.z, 30, { c: def.loot === 'esmeralda' ? [[0.2, 1, 0.6], [1, 1, 1]] : [[1, 0.85, 0.3], [1, 1, 1]], sp: 8, size: 0.45, life: 0.6, g: 4, drag: 2 }); }
      if (e.type === 'bossGust') for (const c of R.cars) { if (c.bot) continue; for (let k = 0; k < 24; k++) { T.pos(c.s + 10 + Math.random() * 30, c.u - e.dir * (6 + Math.random() * 6), 0.5 + Math.random() * 3, V); const o = T.at(c.s); FX.emit('glow', V.x, V.y, V.z, 1, { c: [[0.9, 0.95, 1]], sp: 0.5, size: 0.25, life: 0.8, drag: 0.5, vx: o.rx * e.dir * 22, vz: o.rz * e.dir * 22 }); } }
    }
  }
  /* lo que suelta el jefe y las piezas de los retos (también sin jefe) */
  function updateHaz(R, t, dt) {
    const seen = new Set();
    for (const z of R.bz) { seen.add(z); const own = MiniArt.owns(z); let m = hz.get(z); if (!m) { if (own) { m = MiniArt.hazMesh(z, H); scene.add(m); } else m = hazMesh(z); hz.set(z, m); if (z.k === 'shell') { m.userData.mk = marker('ring'); } if (z.k === 'feather') m.userData.mk = marker('shadow'); }
      if (own) MiniArt.hazStep(z, m, R, t, dt, H);
      else if (z.k === 'shell' || z.k === 'coal') { T.pos(z.s, z.u, z.h, V); m.position.copy(V); if (Math.random() < 0.5) FX.puff(V.x, V.y, V.z, 0, 0.5, 0, z.k === 'coal' ? 1 : 0.5, z.k === 'coal' ? 0.5 : 0.5, z.k === 'coal' ? 0.2 : 0.5, 0.5, 0.6, 0.5, 0, 1, 1.5, z.k === 'coal'); }
      else { const yaw = z.k === 'feather' ? z.yaw || 0 : z.k === 'loot' ? z.age * 2.2 : 0; place(m, z.s, z.u, z.h, yaw); }
      if (z.k === 'barrel' && !own) { const b = m.userData.b; b.rotation.x += (z.vs || 0) * dt / 0.55; m.userData.spark.material.opacity = 0.6 + Math.random() * 0.4; }
      if (z.k === 'mine') { const mm = m.userData.m; mm.position.y = 0.6 + Math.sin(z.age * 3) * 0.15; mm.userData.l.material.opacity = Math.sin(z.age * 10) > 0 ? 1 : 0.15; }
      if (z.k === 'wagon') { place(m, z.s, z.u, z.h, Math.sin(z.age * 3) * 0.05, Math.sin(z.age * 7) * 0.04); for (const w of m.userData.wh || []) w.m.rotation.x += z.vs * dt / w.r; }
      if (z.k === 'loot') m.userData.L.position.y = Math.sin(z.age * 4) * 0.1;
      const mk = m.userData.mk; if (mk) { const s1 = z.k === 'shell' ? z.s1 : z.s, u1 = z.k === 'shell' ? z.u1 : z.u, gh = T.groundH(s1, u1) + 0.08; place(mk, s1, u1, gh);
        if (z.k === 'shell') { const k = clamp(z.age / z.tf, 0, 1), r = (z.r || 2.4) * 2 * (1.25 - 0.25 * k); mk.scale.set(r, 1, r); mk.material.opacity = 0.5 + 0.5 * Math.abs(Math.sin(z.age * (6 + k * 10))); }
        else { const k = clamp(z.age / Math.max(0.01, z.warn), 0, 1), landed = z.age >= z.warn + 0.28; mk.visible = !landed; mk.scale.set(1.2 + k * 1.6, 1, 3 + k * 1.2); mk.material.opacity = 0.3 + k * 0.6; } } }
    for (const [z, m] of hz) if (!seen.has(z)) { scene.remove(m); if (m.userData.mk) scene.remove(m.userData.mk); hz.delete(z); }
  }
  return { init, update, clear };
})();
