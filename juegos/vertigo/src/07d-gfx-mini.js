/* =========================================================================
   MINIJEFES Y RETOS EN 3D
   · El Dragón de Neón: cuerpo de laca con escamas de borde neón, anillos
     que cambian de color en ola, cresta cian, cuernos, bigotes, crin y
     mandíbula que se abre al atacar.
   · El Escarabajo Dorado: élitros de oro con incrustaciones de lapislázuli,
     turquesa y cornalina, seis patas que caminan (las de adelante sostienen
     el disco solar) y se entierra en la arena.
   · El Gigante de Lava: roca basáltica con grietas de lava que laten,
     chimeneas en la espalda, brazos y piernas que caminan y pisotean.
   · Los retos: tunjos de oro, máscaras de carnaval, troncos del río, esferas
     de neón, arenas movedizas, la onda del pisotón, bolas de arena, rocas,
     rayos y bombas de lava, la pared de la tormenta de arena y los géiseres.
   ========================================================================= */
const MiniArt = (() => {
  const V = new THREE.Vector3(), V2 = new THREE.Vector3(), CA = new THREE.Color(), CB = new THREE.Color();
  let M = null;
  /* números pseudoaleatorios estables (la misma forma cada vez) */
  let seed = 1; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  function mats(H) {
    if (M) return M; const std = o => new THREE.MeshStandardMaterial(o), tex = H.tex, mt = H.mt;
    /* escamas del dragón: base de laca morada y bordes de neón (el borde brilla) */
    const scaleRow = (x, w, h, edge) => { for (let r = 0; r < 9; r++) for (let c = -1; c < 9; c++) { const cx = c * 32 + (r % 2) * 16, cy = r * 30 - 6; x.beginPath(); x.arc(cx, cy, 20, 0.05 * Math.PI, 0.95 * Math.PI); if (edge) { x.strokeStyle = 'rgba(255,90,245,0.95)'; x.lineWidth = 3; x.stroke(); } else { const g = x.createRadialGradient(cx, cy, 2, cx, cy + 6, 22); g.addColorStop(0, '#3a1660'); g.addColorStop(1, '#0e0618'); x.fillStyle = g; x.fill(); x.strokeStyle = '#06030c'; x.lineWidth = 2; x.stroke(); } } };
    const scaleT = tex(256, 256, (x, w, h) => { x.fillStyle = '#12081e'; x.fillRect(0, 0, w, h); scaleRow(x, w, h, false); });
    const scaleE = tex(256, 256, (x, w, h) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, h); scaleRow(x, w, h, true); });
    /* piel del cuerpo continuo: escamas alrededor, línea de neón en el lomo y placas del vientre */
    const tubeDraw = (x, w, h, glow) => { x.fillStyle = glow ? '#000' : '#12081e'; x.fillRect(0, 0, w, h);
      for (let r = 0; r < 10; r++) for (let c = -1; c < 17; c++) { const cx = c * 32 + (r % 2) * 16, cy = r * 28 - 4; x.beginPath(); x.arc(cx, cy, 19, 0.05 * Math.PI, 0.95 * Math.PI); if (glow) { x.strokeStyle = 'rgba(255,70,240,0.75)'; x.lineWidth = 2.5; x.stroke(); } else { const g = x.createRadialGradient(cx, cy, 2, cx, cy + 6, 21); g.addColorStop(0, '#3c1764'); g.addColorStop(1, '#0d0617'); x.fillStyle = g; x.fill(); x.strokeStyle = '#06030c'; x.lineWidth = 2; x.stroke(); } }
      const b0 = w * 0.64, b1 = w * 0.86; x.fillStyle = glow ? '#000' : '#16303c'; x.fillRect(b0, 0, b1 - b0, h); for (let r = 0; r < 8; r++) { x.strokeStyle = glow ? '#3ff0ff' : '#2a6070'; x.lineWidth = glow ? 3 : 4; x.beginPath(); x.moveTo(b0 + 4, r * 32 + 4); x.quadraticCurveTo((b0 + b1) / 2, r * 32 + 16, b1 - 4, r * 32 + 4); x.stroke(); }
      x.fillStyle = glow ? '#ff4af2' : '#ff3df0'; x.fillRect(w * 0.25 - 4, 0, 8, h); if (glow) { x.fillStyle = 'rgba(255,74,242,0.35)'; x.fillRect(w * 0.25 - 12, 0, 24, h); } };
    const tubeT = tex(512, 256, (x, w, h) => tubeDraw(x, w, h, false)), tubeE = tex(512, 256, (x, w, h) => tubeDraw(x, w, h, true));
    /* élitros del escarabajo: oro con costillas, anillos de celdas de lapislázuli, turquesa y cornalina */
    const elyT = tex(512, 256, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffe08a'); g.addColorStop(1, '#c8902a'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = '#1d3d9a'; for (let i = 0; i < 16; i++) { const cx = (i + 0.5) * w / 16; x.fillRect(cx - 9, 0, 18, h * 0.62); }
      x.fillStyle = '#e8b448'; for (let i = 0; i < 16; i++) { const cx = (i + 0.5) * w / 16; x.fillRect(cx - 2, 0, 4, h * 0.62); }
      const cols = ['#1d3d9a', '#2ab7a9', '#c0392b', '#1d3d9a', '#2ab7a9'];
      for (let row = 0; row < 3; row++) { const y0 = h * (0.66 + row * 0.11); for (let i = 0; i < 32; i++) { x.fillStyle = cols[(i + row) % cols.length]; x.fillRect(i * w / 32 + 3, y0, w / 32 - 6, h * 0.08); } }
      x.fillStyle = '#ffe9a8'; x.fillRect(0, h * 0.63, w, 4); x.fillRect(w * 0.25 - 3, 0, 6, h); x.fillRect(w * 0.75 - 3, 0, 6, h);
    });
    const proT = tex(256, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffe08a'); g.addColorStop(1, '#b8801e'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#1d3d9a' : '#2ab7a9'; x.fillRect(i * 16 + 2, h * 0.55, 12, h * 0.3); } x.fillStyle = '#c0392b'; for (let i = 0; i < 8; i++) { x.beginPath(); x.arc(i * 32 + 16, h * 0.3, 7, 0, TAU); x.fill(); } });
    /* roca de lava: basalto con grietas; el mapa de emisión tiene solo las grietas */
    const cracks = []; seed = 7; for (let k = 0; k < 16; k++) { let px = rnd() * 256, py = rnd() * 256; const pts = [[px, py]]; let a = rnd() * TAU; for (let s = 0; s < 9; s++) { a += (rnd() - 0.5) * 1.4; px += Math.cos(a) * 14; py += Math.sin(a) * 14; pts.push([px, py]); } cracks.push(pts); }
    const drawCr = (x, glow) => { for (const pts of cracks) for (const [lw, col] of glow ? [[9, 'rgba(255,90,10,0.45)'], [4, '#ff9a1a'], [1.6, '#fff0a0']] : [[5, '#3a1608']]) { x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.stroke(); } };
    const rockT = tex(256, 256, (x, w, h) => { x.fillStyle = '#2c2522'; x.fillRect(0, 0, w, h); for (let k = 0; k < 900; k++) { const v = 25 + Math.random() * 40; x.fillStyle = `rgb(${v + 6},${v},${v - 4})`; x.fillRect(Math.random() * w, Math.random() * h, 3 + Math.random() * 5, 2 + Math.random() * 4); } drawCr(x, false); });
    const crackT = tex(256, 256, (x, w, h) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, h); drawCr(x, true); });
    /* corteza, anillos del tronco y musgo */
    const barkT = tex(128, 256, (x, w, h) => { x.fillStyle = '#4a3220'; x.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { const v = 0.6 + Math.random() * 0.6; x.strokeStyle = `rgba(${40 * v | 0},${26 * v | 0},${14 * v | 0},0.9)`; x.lineWidth = 2 + Math.random() * 4; const px = Math.random() * w; x.beginPath(); x.moveTo(px, 0); x.bezierCurveTo(px + 8, h * 0.3, px - 8, h * 0.6, px + 4, h); x.stroke(); } for (let i = 0; i < 25; i++) { x.fillStyle = `rgba(70,110,40,${0.3 + Math.random() * 0.4})`; x.beginPath(); x.ellipse(Math.random() * w, Math.random() * h, 6 + Math.random() * 10, 3 + Math.random() * 6, 0, 0, TAU); x.fill(); } });
    const ringT = tex(128, 128, (x, w, h) => { x.fillStyle = '#c89a62'; x.fillRect(0, 0, w, h); for (let r = 6; r < 64; r += 5 + Math.random() * 3) { x.strokeStyle = `rgba(110,70,36,${0.4 + Math.random() * 0.4})`; x.lineWidth = 1.5; x.beginPath(); x.arc(64 + Math.random() * 2, 64 + Math.random() * 2, r, 0, TAU); x.stroke(); } x.strokeStyle = '#3a2614'; x.lineWidth = 8; x.beginPath(); x.arc(64, 64, 60, 0, TAU); x.stroke(); }, false);
    /* arena: bolas de arena y arenas movedizas (espiral) */
    const sandT = tex(128, 128, (x, w, h) => { x.fillStyle = '#d6b072'; x.fillRect(0, 0, w, h); for (let k = 0; k < 900; k++) { const v = 150 + Math.random() * 80; x.fillStyle = `rgba(${v},${v * 0.78 | 0},${v * 0.48 | 0},0.6)`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); } });
    const swirlT = tex(256, 256, (x, w, h) => { x.clearRect(0, 0, w, h); const g = x.createRadialGradient(128, 128, 0, 128, 128, 126); g.addColorStop(0, 'rgba(110,76,34,0.95)'); g.addColorStop(0.55, 'rgba(200,160,96,0.9)'); g.addColorStop(0.85, 'rgba(220,186,120,0.55)'); g.addColorStop(1, 'rgba(220,186,120,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.translate(128, 128); for (let arm = 0; arm < 4; arm++) { x.rotate(TAU / 4); x.strokeStyle = 'rgba(80,52,20,0.55)'; x.lineWidth = 5; x.beginPath(); for (let k = 0; k <= 40; k++) { const a = k * 0.12, r = 6 + k * 2.8; const px = Math.cos(a) * r, py = Math.sin(a) * r; k ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); } }, false);
    /* onda del pisotón: banda ardiente y cortina de polvo */
    const bandT = tex(64, 64, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,120,20,0)'); g.addColorStop(0.45, 'rgba(255,170,60,0.9)'); g.addColorStop(0.5, 'rgba(255,245,200,1)'); g.addColorStop(0.55, 'rgba(255,170,60,0.9)'); g.addColorStop(1, 'rgba(255,120,20,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, false);
    const curtT = tex(64, 64, (x, w, h) => { const g = x.createLinearGradient(0, h, 0, 0); g.addColorStop(0, 'rgba(255,150,60,0.85)'); g.addColorStop(0.4, 'rgba(200,130,80,0.45)'); g.addColorStop(1, 'rgba(160,120,90,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, false);
    const add = c => new THREE.MeshBasicMaterial({ color: c, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    M = {
      scale: std({ map: scaleT, emissiveMap: scaleE, emissive: '#ffffff', emissiveIntensity: 0.9, metalness: 0.45, roughness: 0.3 }),
      tube: std({ map: tubeT, emissiveMap: tubeE, emissive: '#ffffff', emissiveIntensity: 0.9, metalness: 0.45, roughness: 0.3 }),
      crest: new THREE.MeshBasicMaterial({ color: '#5af0ff', transparent: true, opacity: 0.85, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
      belly: std({ color: '#1a3442', emissive: '#2af0ff', emissiveIntensity: 0.45, metalness: 0.3, roughness: 0.35 }),
      neonP: new THREE.MeshBasicMaterial({ color: '#ff3df0' }), neonC: new THREE.MeshBasicMaterial({ color: '#5af0ff' }),
      horn: std({ color: '#ece4ff', metalness: 0.6, roughness: 0.22, emissive: '#5af0ff', emissiveIntensity: 0.35 }), eyeY: new THREE.MeshBasicMaterial({ color: '#fff27a' }), tooth: std({ color: '#f4f0ea', roughness: 0.4 }),
      fin: new THREE.MeshBasicMaterial({ color: '#ff3df0', transparent: true, opacity: 0.75, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
      ely: std({ map: elyT, metalness: 0.85, roughness: 0.26, emissive: '#3a2400', emissiveIntensity: 0.25 }), pro: std({ map: proT, metalness: 0.85, roughness: 0.26, emissive: '#3a2400', emissiveIntensity: 0.25 }),
      leg: std({ color: '#1a2a5a', metalness: 0.75, roughness: 0.3 }), under: std({ color: '#2a1e10', metalness: 0.5, roughness: 0.5 }), eyeT: new THREE.MeshBasicMaterial({ color: '#4dffe0' }), sun: new THREE.MeshBasicMaterial({ color: '#ff6a2a', side: THREE.DoubleSide }),
      rock: std({ map: rockT, emissiveMap: crackT, emissive: '#ffffff', emissiveIntensity: 1.3, roughness: 0.92, metalness: 0.05, flatShading: true }), lava: new THREE.MeshBasicMaterial({ color: '#ffb030' }), eyeL: new THREE.MeshBasicMaterial({ color: '#ffe680' }),
      bark: std({ map: barkT, roughness: 0.95 }), ring: std({ map: ringT, roughness: 0.9 }), moss: std({ color: '#4a7a2a', roughness: 1 }),
      sand: std({ map: sandT, roughness: 1 }), swirl: new THREE.MeshBasicMaterial({ map: swirlT, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }),
      band: new THREE.MeshBasicMaterial({ map: bandT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }), curt: new THREE.MeshBasicMaterial({ map: curtT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
      tunjo: std({ color: '#f2b830', metalness: 0.9, roughness: 0.22, emissive: '#7a4400', emissiveIntensity: 0.35 }), tunjoL: std({ color: '#ffe9a0', metalness: 0.9, roughness: 0.18, emissive: '#a06a10', emissiveIntensity: 0.35 }),
      orbP: add('#ff3df0'), orbC: add('#5af0ff'), white: new THREE.MeshBasicMaterial({ color: '#fff4ff' }),
      pool: std({ color: '#3ab8c8', emissive: '#0a4a54', roughness: 0.1, metalness: 0.2 }), rim: std({ color: '#d8c8a0', roughness: 0.9 }),
    };
    for (const k of ['scale', 'tube', 'belly', 'horn', 'tooth', 'ely', 'pro', 'leg', 'under', 'rock', 'bark', 'ring', 'moss', 'sand', 'pool', 'rim', 'tunjo', 'tunjoL']) GFX.linearize(new THREE.Mesh(new THREE.BoxGeometry(), M[k]));
    for (const k of ['ely', 'pro', 'leg', 'horn', 'belly']) H.flash(M[k]);
    return M;
  }
  /* roca facetada (siempre la misma para la misma semilla) */
  function rockGeo(r, sx, sy, sz, sd) { seed = sd; const g = new THREE.IcosahedronGeometry(r, 1), p = g.attributes.position; const key = new Map();
    for (let i = 0; i < p.count; i++) { const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`; if (!key.has(k)) key.set(k, 0.82 + rnd() * 0.32); const n = key.get(k); p.setXYZ(i, p.getX(i) * n * sx, p.getY(i) * n * sy, p.getZ(i) * n * sz); }
    g.computeVertexNormals(); return g; }
  /* ======================= EL DRAGÓN DE NEÓN ======================= */
  const HS = 1.55, VS = 1.3; /* el dragón se ve más grande que su caja de choque para que se lea de lejos */
  function dragonHead(H, sg) {
    const { add } = H, g = new THREE.Group(), keep = new Set(), A = {}; const hh = sg.hh;
    add(g, new THREE.SphereGeometry(1, 24, 16).scale(1.35, 1.1, 1.6), M.scale, 0, 1.5, -0.4);
    add(g, new THREE.SphereGeometry(1, 20, 14).scale(0.92, 0.58, 1.85), M.scale, 0, 1.36, 1.35); add(g, new THREE.BoxGeometry(1.5, 0.12, 2.4), M.neonP, 0, 1.0, 1.55);
    for (const sx of [-1, 1]) { add(g, new THREE.SphereGeometry(0.08, 8, 6), M.neonP, sx * 0.34, 1.7, 3.1);
      add(g, new THREE.SphereGeometry(0.22, 12, 10), M.eyeY, sx * 0.78, 1.95, 0.85); const e = H.glowSprite('#ffe040', 0.9, 0.75); e.position.set(sx * 0.84, 1.97, 0.95); g.add(e); keep.add(e);
      add(g, new THREE.BoxGeometry(0.7, 0.1, 0.16), M.neonC, sx * 0.72, 2.24, 0.9, 0, 0, sx * -0.35);
      const hn = add(g, new THREE.ConeGeometry(0.24, 2.3, 8).translate(0, 1.15, 0), M.horn, sx * 0.55, 2.3, -0.9); hn.rotation.set(-1.05, 0, sx * -0.35);
      const hn2 = add(g, new THREE.ConeGeometry(0.12, 0.9, 6).translate(0, 0.45, 0), M.neonC, sx * 0.62, 2.55, -1.3); hn2.rotation.set(-0.7, 0, sx * -0.6);
      /* bigotes de neón */
      const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(sx * 0.62, 1.32, 2.2), new THREE.Vector3(sx * 1.4, 1.1, 1.6), new THREE.Vector3(sx * 2.0, 0.7, 0.1), new THREE.Vector3(sx * 2.4, 1.0, -1.7), new THREE.Vector3(sx * 2.7, 0.6, -3.0)]);
      const wk = new THREE.Mesh(new THREE.TubeGeometry(cv, 24, 0.07, 6, false), M.neonC); const wg = new THREE.Group(); wg.position.set(sx * 0.62, 1.32, 2.2); wk.position.set(-sx * 0.62, -1.32, -2.2); wg.add(wk); g.add(wg); keep.add(wg); (A.whisk = A.whisk || []).push(wg); }
    /* crin: plumas de neón hacia atrás */
    for (let i = 0; i < 7; i++) { const pv = new THREE.Group(); pv.position.set(0, 2.15, -1.2); pv.rotation.y = (i - 3) * 0.22; const f = new THREE.Mesh(H.feather(1.9 - Math.abs(i - 3) * 0.12, 0.55, M.neonP), i % 2 ? M.neonP : M.fin); f.rotation.x = 0.45; pv.add(f); g.add(pv); }
    /* mandíbula con dientes */
    const jaw = new THREE.Group(); jaw.position.set(0, 1.05, 0.0); g.add(jaw); keep.add(jaw);
    add(jaw, new THREE.SphereGeometry(1, 18, 12).scale(0.84, 0.3, 1.75), M.belly, 0, -0.12, 1.35);
    for (let i = 0; i < 7; i++) for (const sx of [-1, 1]) add(jaw, new THREE.ConeGeometry(0.07, 0.32, 5), M.tooth, sx * (0.6 - i * 0.03), 0.18, 2.4 - i * 0.3);
    for (let i = 0; i < 4; i++) { const b = add(jaw, new THREE.ConeGeometry(0.08, 0.7, 5), M.neonC, (i - 1.5) * 0.18, -0.55, 1.6 - i * 0.1); b.rotation.x = Math.PI - 0.3; }
    const mg = H.glowSprite('#ff6af8', 2.6, 0); mg.position.set(0, 1.2, 1.9); g.add(mg); keep.add(mg); A.mouth = mg;
    H.merge(jaw, new Set()); H.merge(g, keep); A.jaw = jaw; const outer = new THREE.Group(); g.scale.setScalar(HS); outer.add(g); outer.userData.hh = hh; return { g: outer, A };
  }
  function dragonBody(H, sg, i, n) {
    const { add } = H, g = new THREE.Group(), keep = new Set(), w = sg.w, hh = sg.hh, len = sg.len, last = i === n - 1;
    const ringM = new THREE.MeshBasicMaterial({ color: '#ff3df0' }); add(g, new THREE.TorusGeometry(1, 0.08, 6, 30).scale(w / 2 * 0.98, hh / 2 * 0.98, 1), ringM, 0, hh / 2, 0.2);
    /* cresta de neón en el lomo: aleta dentada */
    { const sh = new THREE.Shape(), L2 = len * 0.62, th = 1.05 - i * 0.07; sh.moveTo(-L2, 0); sh.lineTo(-L2 * 0.5, th * 0.75); sh.lineTo(-L2 * 0.2, th * 0.25); sh.lineTo(L2 * 0.25, th); sh.lineTo(L2 * 0.45, th * 0.3); sh.lineTo(L2, th * 0.6); sh.lineTo(L2, 0); sh.lineTo(-L2, 0);
      const cg = new THREE.ShapeGeometry(sh).rotateY(-Math.PI / 2); add(g, cg, M.crest, 0, hh * 0.9, 0); }
    const legs = [];
    if (i === 1 || i === 5) for (const sx of [-1, 1]) { const lg = new THREE.Group(); lg.position.set(sx * w * 0.4, hh * 0.32, 0.3); g.add(lg); keep.add(lg);
      add(lg, new THREE.SphereGeometry(1, 12, 8).scale(0.42, 0.55, 0.45), M.tube, sx * 0.1, -0.15, 0);
      add(lg, new THREE.CylinderGeometry(0.17, 0.12, 1.1, 8).translate(0, -0.55, 0), M.tube, sx * 0.18, -0.45, 0.1, 0.35, 0, sx * 0.25);
      for (let k = -1; k <= 1; k++) { const cl = add(lg, new THREE.ConeGeometry(0.07, 0.5, 5), M.neonC, sx * 0.42 + k * 0.13, -1.38, 0.55); cl.rotation.x = 1.9; }
      H.merge(lg, new Set()); legs.push({ lg, sx }); }
    if (last) { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(1.4, -0.6, 1.8, -2.6); sh.quadraticCurveTo(0.6, -1.9, 0, -3.4); sh.quadraticCurveTo(-0.6, -1.9, -1.8, -2.6); sh.quadraticCurveTo(-1.4, -0.6, 0, 0);
      const fg = new THREE.ShapeGeometry(sh, 8); fg.rotateX(Math.PI / 2); const fin = add(g, fg, M.fin, 0, hh / 2, -len * 0.85); keep.add(fin); g.userData.fin = fin;
      const fg2 = fg.clone(); fg2.rotateZ(Math.PI / 2); const fin2 = add(g, fg2, M.fin, 0, hh / 2, -len * 0.85); keep.add(fin2); }
    H.merge(g, keep); const outer = new THREE.Group(); g.scale.setScalar(VS); outer.add(g); outer.userData = { ringM, legs, hh, w, len, inner: g, fin: g.userData.fin }; return outer;
  }
  /* cuerpo continuo: un tubo que pasa por el centro de cada segmento (se rehace cada cuadro) */
  const NR = 80, NK = 16;
  function makeTube() {
    const n = (NR + 1) * (NK + 1), geo = new THREE.BufferGeometry(), uv = new Float32Array(n * 2), idx = [];
    for (let j = 0; j <= NR; j++) for (let k = 0; k <= NK; k++) { const v = j * (NK + 1) + k; uv[v * 2] = k / NK; uv[v * 2 + 1] = j / NR * 10; if (j < NR && k < NK) { const a = v, b = v + NK + 1, c = b + 1, d = a + 1; idx.push(a, b, d, b, c, d); } }
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
    const m = new THREE.Mesh(geo, M.tube); m.frustumCulled = false; m.castShadow = GQ.lv > 0; m.receiveShadow = false; return m;
  }
  const TP = [], TR = [], C3 = new THREE.CatmullRomCurve3([], false, 'centripetal'), TG = new THREE.Vector3(), SD = new THREE.Vector3(), UP2 = new THREE.Vector3(), UPW = new THREE.Vector3(0, 1, 0);
  function updateTube(A, segG) {
    const m = A.tube; if (!m) return; let q = 0; const pt = (o, x, y, z, rx, ry) => { if (!TP[q]) TP[q] = new THREE.Vector3(); o.localToWorld(TP[q].set(x, y, z)); TR[q] = [rx, ry]; q++; };
    pt(segG[0], 0, 1.45 * HS, -1.15 * HS, 1.2, 1.1);
    for (let i = 1; i < segG.length; i++) { const g = segG[i], d = g.userData; pt(g, 0, d.hh / 2 * VS, 0, d.w / 2 * 0.92 * VS, d.hh / 2 * 0.92 * VS); }
    const lg = segG[segG.length - 1], ld = lg.userData; pt(lg, 0, ld.hh / 2 * VS, -ld.len * 0.85 * VS, 0.14, 0.14);
    C3.points = TP.slice(0, q); C3.updateArcLengths && C3.updateArcLengths();
    const P = m.geometry.attributes.position.array, N = m.geometry.attributes.normal.array; let last = null;
    for (let j = 0; j <= NR; j++) { const t = j / NR; C3.getPoint(t, V); C3.getTangent(t, TG); const f = t * (q - 1), i0 = Math.min(q - 2, Math.floor(f)), fr = f - i0, rx = lerp(TR[i0][0], TR[i0 + 1][0], fr), ry = lerp(TR[i0][1], TR[i0 + 1][1], fr);
      SD.crossVectors(TG, UPW); if (SD.lengthSq() < 1e-6) SD.copy(last || V2.set(1, 0, 0)); SD.normalize(); UP2.crossVectors(SD, TG).normalize();
      for (let k = 0; k <= NK; k++) { const a = k / NK * TAU, ca = Math.cos(a), sa = Math.sin(a), v = (j * (NK + 1) + k) * 3;
        P[v] = V.x + SD.x * ca * rx + UP2.x * sa * ry; P[v + 1] = V.y + SD.y * ca * rx + UP2.y * sa * ry; P[v + 2] = V.z + SD.z * ca * rx + UP2.z * sa * ry;
        const nx = SD.x * ca / rx + UP2.x * sa / ry, ny = SD.y * ca / rx + UP2.y * sa / ry, nz = SD.z * ca / rx + UP2.z * sa / ry, nl = Math.hypot(nx, ny, nz) || 1; N[v] = nx / nl; N[v + 1] = ny / nl; N[v + 2] = nz / nl; } }
    m.geometry.attributes.position.needsUpdate = true; m.geometry.attributes.normal.needsUpdate = true;
  }
  function buildDragon(H, B) {
    const segs = B.def.segs, list = [], A = { legs: [], rings: [] };
    const hd = dragonHead(H, segs[0]); list.push(hd.g); Object.assign(A, hd.A);
    for (let i = 1; i < segs.length; i++) { const g = dragonBody(H, segs[i], i - 1, segs.length - 1); list.push(g); A.rings.push(g.userData.ringM); for (const l of g.userData.legs) A.legs.push(Object.assign({ i }, l)); if (g.userData.fin) A.fin = g.userData.fin; }
    A.jawT = 0; A.tube = makeTube(); return { list, A };
  }
  /* ======================= EL ESCARABAJO DORADO ======================= */
  function buildScarab(H, B) {
    const { add } = H, mt = H.mt, g = new THREE.Group(), keep = new Set(), A = { legs: [], stars: [] };
    add(g, new THREE.SphereGeometry(1, 48, 18, 0, TAU, 0, Math.PI / 2).scale(2.85, 2.6, 3.2), M.ely, 0, 1.25, -1.0);
    add(g, new THREE.CylinderGeometry(1, 1, 0.5, 40).scale(2.8, 1, 3.15), M.under, 0, 1.05, -1.0);
    add(g, new THREE.TorusGeometry(1, 0.07, 6, 48).rotateX(Math.PI / 2).scale(2.86, 1, 3.21), mt.gold, 0, 1.28, -1.0);
    add(g, new THREE.SphereGeometry(1, 36, 12, 0, TAU, 0, Math.PI / 2).scale(2.25, 1.6, 1.45), M.pro, 0, 1.3, 2.05);
    add(g, new THREE.CylinderGeometry(1, 1, 0.4, 32).scale(2.2, 1, 1.4), M.under, 0, 1.12, 2.05);
    add(g, new THREE.CylinderGeometry(1.3, 1.45, 0.45, 24, 1, false, -Math.PI / 2, Math.PI), mt.gold, 0, 1.35, 3.35);
    for (let i = 0; i < 6; i++) { const a = (i / 5 - 0.5) * 2.2; add(g, new THREE.BoxGeometry(0.22, 0.32, 0.45), mt.gold, Math.sin(a) * 1.35, 1.35, 3.35 + Math.cos(a) * 1.35); }
    for (const sx of [-1, 1]) { add(g, new THREE.SphereGeometry(0.24, 12, 10), M.eyeT, sx * 1.05, 1.62, 3.15); const e = H.glowSprite('#4dffe0', 1.5, 0.9); e.position.set(sx * 1.1, 1.65, 3.25); g.add(e); keep.add(e); }
    /* disco solar sostenido por las patas de adelante */
    const sun = new THREE.Group(); sun.position.set(0, 5.6, 2.9); g.add(sun); keep.add(sun);
    add(sun, new THREE.CircleGeometry(1.45, 40), M.sun); add(sun, new THREE.TorusGeometry(1.5, 0.12, 8, 40), mt.gold); const sg = H.glowSprite('#ff7a2a', 7, 0.85); sun.add(sg); A.sunGlow = sg; A.sun = sun;
    /* seis patas: cadera → fémur → tibia con espinas */
    const legDef = [[2.2, 'front'], [0.3, 'mid'], [-1.7, 'hind']];
    legDef.forEach(([z, kind], j) => { for (const sx of [-1, 1]) {
      const hip = new THREE.Group(); hip.position.set(sx * 1.9, 1.35, z); g.add(hip); keep.add(hip);
      const fem = new THREE.Group(); hip.add(fem); add(fem, new THREE.CylinderGeometry(0.2, 0.26, 2.2, 8).rotateZ(Math.PI / 2).translate(sx * 1.1, 0, 0), M.leg); add(fem, new THREE.SphereGeometry(0.3, 10, 8), mt.gold);
      const tib = new THREE.Group(); tib.position.set(sx * 2.2, 0, 0); fem.add(tib); add(tib, new THREE.SphereGeometry(0.24, 10, 8), mt.gold); add(tib, new THREE.CylinderGeometry(0.12, 0.2, 2.3, 8).translate(0, -1.15, 0), M.leg);
      for (let k = 0; k < 4; k++) { const sp = add(tib, new THREE.ConeGeometry(0.06, 0.38, 5), mt.gold, sx * 0.14, -0.5 - k * 0.45, 0); sp.rotation.z = sx * -1.1; }
      H.merge(fem, new Set([tib])); H.merge(tib, new Set());
      if (kind === 'front') { fem.rotation.z = sx * 0.95; fem.rotation.y = sx * -0.5; tib.rotation.z = sx * 3.0; }
      else { fem.rotation.z = sx * 0.35; tib.rotation.z = sx * -0.25; }
      A.legs.push({ hip, fem, tib, sx, j, kind }); } });
    for (let k = 0; k < 3; k++) { const s = H.glowSprite('#fff27a', 1.1, 0); g.add(s); keep.add(s); A.stars.push(s); }
    const mound = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10, 0, TAU, 0, Math.PI / 2).scale(3.4, 1.1, 4.5), M.sand); mound.visible = false; A.mound = mound;
    H.merge(g, keep); return { list: [g], A };
  }
  /* ======================= EL GIGANTE DE LAVA ======================= */
  function buildGolem(H, B) {
    const { add } = H, g = new THREE.Group(), keep = new Set(), A = { arms: [], legs: [], vents: [], eyes: [] };
    const body = new THREE.Group(); g.add(body); keep.add(body); A.body = body;
    add(body, rockGeo(1.4, 1.35, 0.7, 0.95, 11), M.rock, 0, 4.3, 0);
    add(body, rockGeo(1.0, 2.5, 2.3, 1.75, 12), M.rock, 0, 6.7, 0);
    add(body, rockGeo(0.9, 1.4, 1.2, 1.2, 13), M.rock, 0, 7.4, -0.9);
    add(body, new THREE.SphereGeometry(0.62, 14, 10), M.lava, 0, 6.9, 1.45); { const c = H.glowSprite('#ff8a20', 4.5, 0.9); c.position.set(0, 6.9, 1.7); body.add(c); keep.add(c); A.core = c; }
    /* cabeza hundida entre los hombros */
    add(body, rockGeo(0.85, 1.25, 1.0, 1.1, 14), M.rock, 0, 9.0, 0.55);
    for (const sx of [-1, 1]) { add(body, new THREE.BoxGeometry(0.42, 0.13, 0.12), M.eyeL, sx * 0.38, 9.12, 1.45, 0, 0, sx * -0.25); const e = H.glowSprite('#ffc040', 1.4, 0.95); e.position.set(sx * 0.4, 9.12, 1.6); body.add(e); keep.add(e); A.eyes.push(e); }
    add(body, new THREE.BoxGeometry(0.7, 0.12, 0.1), M.lava, 0, 8.65, 1.5);
    /* chimeneas volcánicas en la espalda */
    for (const sx of [-1, 1]) { add(body, new THREE.CylinderGeometry(0.35, 0.75, 1.5, 8), M.rock, sx * 1.15, 8.4, -1.25, -0.35, 0, sx * 0.25); add(body, new THREE.CircleGeometry(0.33, 10).rotateX(-Math.PI / 2), M.lava, sx * 1.33, 9.13, -1.5);
      const vg = H.glowSprite('#ff6a10', 1.6, 0.8); vg.position.set(sx * 1.35, 9.4, -1.55); body.add(vg); keep.add(vg); A.vents.push(vg); }
    /* hombros, brazos y puños */
    for (const sx of [-1, 1]) { add(body, rockGeo(1.0, 1.15, 1.0, 1.05, 20 + sx), M.rock, sx * 2.45, 7.85, 0);
      const arm = new THREE.Group(); arm.position.set(sx * 2.55, 7.6, 0); body.add(arm); keep.add(arm);
      add(arm, rockGeo(0.75, 0.95, 1.7, 0.95, 30 + sx), M.rock, sx * 0.15, -1.4, 0);
      const fore = new THREE.Group(); fore.position.set(sx * 0.2, -2.8, 0); arm.add(fore); add(fore, rockGeo(0.75, 1.05, 1.6, 1.05, 40 + sx), M.rock, 0, -1.3, 0.1); add(fore, rockGeo(1.0, 1.15, 1.05, 1.2, 50 + sx), M.rock, 0, -2.9, 0.2);
      H.merge(fore, new Set()); H.merge(arm, new Set([fore])); A.arms.push({ arm, fore, sx }); }
    /* piernas */
    for (const sx of [-1, 1]) { const leg = new THREE.Group(); leg.position.set(sx * 1.25, 4.1, 0); g.add(leg); keep.add(leg);
      add(leg, rockGeo(1.0, 1.0, 1.55, 1.0, 60 + sx), M.rock, 0, -1.15, 0);
      const knee = new THREE.Group(); knee.position.set(0, -2.2, 0); leg.add(knee); add(knee, rockGeo(0.85, 1.0, 1.25, 1.0, 70 + sx), M.rock, 0, -0.75, 0); add(knee, rockGeo(1.0, 1.15, 0.5, 1.55, 80 + sx), M.rock, 0, -1.6, 0.35);
      H.merge(knee, new Set()); H.merge(leg, new Set([knee])); A.legs.push({ leg, knee, sx }); }
    H.merge(body, new Set([...keep].filter(o => o.parent === body))); H.merge(g, keep); A.stompT = 0; return { list: [g], A };
  }
  function build(id, H, B) { mats(H); return id === 'dragon' ? buildDragon(H, B) : id === 'scarab' ? buildScarab(H, B) : buildGolem(H, B); }
  /* pose de cada segmento: ondas del dragón, temblor del escarabajo, paso del gigante y cómo caen */
  function pose(B, i, t, P) {
    const id = B.def.id, D = B.dive, k = B.dying > 0 || B.dead ? Math.min(1, (B.dying || 2.6) / 2.6) : 0;
    if (id === 'dragon') { const ph = t * 3 - i * 0.75; P.dh += 0.5 + Math.sin(ph) * 0.45; P.pitch += Math.cos(ph) * 0.12; P.roll += Math.sin(ph * 0.5) * 0.08;
      if (k) { P.dh -= k * (2 + i * 0.25) * Math.min(1, k * 1.5); P.roll += (i % 2 ? 1 : -1) * 0.9 * k; P.pitch += 0.3 * k; } }
    else if (id === 'scarab') { if (D && D.kind === 'burrow' && D.st === 'warn') { P.roll += Math.sin(t * 40) * 0.05; P.pitch += 0.12; }
      if (D && D.kind === 'burrow' && D.st === 'low') P.roll += Math.sin(t * 7) * 0.12;
      if (k) { P.roll += k * Math.PI; P.dh += Math.sin(k * Math.PI) * 2.5 + k * 3.8; } }
    else if (id === 'golem') { if (k) { P.pitch += k * 1.25; P.dh -= k * 1.4; } }
  }
  let walkD = 0;
  function animate(B, A, segG, R, t, dt, events, H) {
    const id = B.def.id, T = R.track, hitK = clamp(B.hitT / 0.3, 0, 1), dying = B.dying > 0 || B.dead; walkD += B.v * dt;
    for (const e of events) if (e.type === 'bossAtk') { A.jawT = 1.1; if (e.k === 'stomp') A.stompT = 0.5;
      if (id === 'dragon' && (e.k === 'flames' || e.k === 'orbs')) { const g = segG[segG.length - 1]; if (g && g.visible) { V.set(0, 1.5, -3).applyMatrix4(g.matrixWorld); FX.emit('glow', V.x, V.y, V.z, 40, { c: [[1, 0.25, 0.95], [0.35, 0.95, 1], [1, 1, 1]], sp: 10, size: 0.6, life: 0.6, drag: 2 }); } } }
    if (id === 'dragon') {
      if (!A.tube.parent && H.scene) H.scene.add(A.tube); A.tube.visible = segG[1] && segG[1].visible; updateTube(A, segG);
      M.scale.emissiveIntensity = M.tube.emissiveIntensity = 0.75 + Math.sin(t * 5) * 0.25 + hitK * 1.2;
      A.rings.forEach((m, i) => { const k = 0.5 + 0.5 * Math.sin(t * 4 - i * 0.6); CA.set('#ff3df0'); CB.set('#5af0ff'); m.color.copy(CA.lerp(CB, k)); if (hitK > 0) m.color.lerp(CB.set('#ffffff'), hitK * 0.8); });
      A.jawT = Math.max(0, A.jawT - dt); const open = A.jawT > 0 ? Math.sin(Math.min(1, (1.1 - A.jawT) / 0.25) * Math.PI / 2) * 0.55 : 0.06 + Math.sin(t * 2) * 0.04; A.jaw.rotation.x = open; A.mouth.material.opacity = open * 1.6;
      for (const w of A.whisk || []) { w.rotation.y = Math.sin(t * 2.2 + w.position.x) * 0.15; w.rotation.x = Math.sin(t * 1.7) * 0.1; }
      for (const L of A.legs) L.lg.rotation.x = Math.sin(walkD / 3 + L.i + (L.sx > 0 ? 0 : Math.PI)) * 0.7;
      if (A.fin) A.fin.rotation.z = Math.sin(t * 4) * 0.25;
      if (!dying && Math.random() < dt * 30) { const g = segG[1 + Math.floor(Math.random() * (segG.length - 1))]; if (g && g.visible) { V.set((Math.random() - 0.5) * 2, g.userData.hh || 1, (Math.random() - 0.5) * 3).applyMatrix4(g.matrixWorld); FX.puff(V.x, V.y, V.z, 0, 0.6, 0, Math.random() < 0.5 ? 1 : 0.35, Math.random() < 0.5 ? 0.3 : 0.95, 1, 0.9, 0.35, 0.8, 0, 1, 0, true); } }
    }
    if (id === 'scarab') { const g = segG[0], D = B.dive, under = D && D.kind === 'burrow' && D.st === 'under';
      g.visible = !(under && B.h < -1.2); const ph = walkD / 2.6;
      for (const L of A.legs) { if (L.kind === 'front') { L.fem.rotation.x = Math.sin(t * 1.5 + L.sx) * 0.08; continue; } const off = (L.j + (L.sx > 0 ? 1 : 0)) % 2 ? Math.PI : 0, s = Math.sin(ph + off);
        L.hip.rotation.y = L.sx * s * 0.38; L.hip.rotation.z = L.sx * Math.max(0, Math.cos(ph + off)) * 0.28; }
      A.sun.rotation.z = t * 0.4; A.sunGlow.material.opacity = 0.7 + Math.sin(t * 3) * 0.2; A.sun.visible = !dying;
      const low = D && D.kind === 'burrow' && D.st === 'low'; A.stars.forEach((s, k) => { s.material.opacity = low ? 0.95 : 0; if (low) s.position.set(Math.cos(t * 4 + k * 2.1) * 1.6, 3.6, 2.4 + Math.sin(t * 4 + k * 2.1) * 1.6); });
      if (!A.mound.parent && H.scene) H.scene.add(A.mound);
      A.mound.visible = !!under && !dying; if (A.mound.visible) { const s = T.wrap(B.d - B.len / 2); H.place(A.mound, s, B.u, T.groundH(s, B.u) - 0.3); A.mound.scale.y = 0.8 + Math.sin(t * 12) * 0.15; }
      if (D && D.kind === 'burrow' && (D.st === 'warn' || under) && Math.random() < dt * 40) { const s = T.wrap(B.d - B.len / 2 + (Math.random() - 0.3) * 6), u = B.u + (Math.random() - 0.5) * 6; T.pos(s, u, T.groundH(s, u) + 0.4, V); FX.puff(V.x, V.y, V.z, (Math.random() - 0.5) * 5, 3 + Math.random() * 4, (Math.random() - 0.5) * 5, 0.84, 0.68, 0.42, 0.75, 1.6, 1.0, 6, 1.2, 2.5); }
      if (!dying && !under && Math.random() < dt * 8) { const s = T.wrap(B.d - B.len), u = B.u + (Math.random() - 0.5) * 5; T.pos(s, u, T.groundH(s, u) + 0.3, V); FX.puff(V.x, V.y, V.z, 0, 1.2, 0, 0.84, 0.7, 0.46, 0.5, 1.4, 0.9, 0, 1.5, 2); }
    }
    if (id === 'golem') { const ph = walkD / 4.2; A.stompT = Math.max(0, A.stompT - dt);
      M.rock.emissiveIntensity = 1.1 + Math.sin(t * 2.4) * 0.35 + hitK * 1.5 + (B.phase === 2 ? 0.3 : 0);
      A.legs.forEach((L, k) => { const s = Math.sin(ph + k * Math.PI); L.leg.rotation.x = s * 0.42; L.knee.rotation.x = Math.max(0, -Math.cos(ph + k * Math.PI)) * 0.7; });
      if (A.stompT > 0) { const p = 1 - A.stompT / 0.5, L = A.legs[1]; L.leg.rotation.x = p < 0.3 ? -1.1 * Math.sin(p / 0.3 * Math.PI / 2) : p < 0.45 ? -1.1 * (1 - (p - 0.3) / 0.15) : 0; L.knee.rotation.x = p < 0.3 ? 1.2 : 0.2;
        if (A.stompT <= 0.275 && A.stompT + dt > 0.275) { const s = T.wrap(B.d - B.len / 2); for (let q = 0; q < 26; q++) { const a = q / 26 * TAU; T.pos(s + Math.cos(a) * 3, B.u + Math.sin(a) * 3, T.groundH(s, B.u) + 0.4, V); FX.puff(V.x, V.y, V.z, Math.cos(a) * 9, 2.5, Math.sin(a) * 9, 0.55, 0.45, 0.38, 0.8, 2.2, 1.1, 2, 1.5, 2.5); } } }
      A.arms.forEach((L, k) => { L.arm.rotation.x = -Math.sin(ph + k * Math.PI) * 0.38 + (A.stompT > 0 ? -0.9 * Math.sin(A.stompT / 0.5 * Math.PI) : 0); L.arm.rotation.z = L.sx * (0.12 + Math.sin(t * 1.3 + k) * 0.04); L.fore.rotation.x = -0.35 - Math.max(0, Math.sin(ph + k * Math.PI)) * 0.25; });
      A.body.position.y = Math.abs(Math.sin(ph)) * 0.25 - 0.1; A.body.rotation.z = Math.sin(ph) * 0.04;
      A.core.material.opacity = 0.7 + Math.sin(t * 5) * 0.25; for (const e of A.eyes) e.material.opacity = 0.8 + Math.sin(t * 7) * 0.2; for (const v of A.vents) { v.material.opacity = 0.45 + Math.random() * 0.35; v.scale.setScalar(1.4 + Math.random() * 0.5); }
      const g = segG[0]; if (g && g.visible && !B.dead) { g.updateMatrixWorld();
        if (Math.random() < dt * 9) for (const sx of [-1, 1]) { V.set(sx * 1.35, 9.6, -1.6).applyMatrix4(g.matrixWorld); FX.puff(V.x, V.y, V.z, (Math.random() - 0.5) * 1.5, 4 + Math.random() * 2, (Math.random() - 0.5) * 1.5, 0.18, 0.15, 0.14, 0.55, 2.2, 2.2, -0.4, 0.6, 3); }
        if (Math.random() < dt * 6) { V.set((Math.random() - 0.5) * 4, 3 + Math.random() * 5, (Math.random() - 0.5) * 2).applyMatrix4(g.matrixWorld); FX.puff(V.x, V.y, V.z, 0, -1, 0, 1, 0.55, 0.1, 1, 0.45, 0.9, 14, 0.3, 0, true); }
        if (T.zone(T.wrap(B.d - B.len / 2), 'water') && Math.random() < dt * 14) { const s = T.wrap(B.d - B.len / 2), u = B.u + (Math.random() - 0.5) * 5; T.pos(s, u, T.groundH(s, u) + 0.2, V); FX.puff(V.x, V.y, V.z, (Math.random() - 0.5) * 4, 4 + Math.random() * 3, (Math.random() - 0.5) * 4, 1, 1, 1, 0.7, 1.2, 0.9, 12, 1, 1.5); } } }
    if (dying && Math.random() < dt * 12) { const g = segG[Math.floor(Math.random() * segG.length)]; if (g && g.visible) { V.set((Math.random() - 0.5) * 3, 1 + Math.random() * 3, (Math.random() - 0.5) * 3).applyMatrix4(g.matrixWorld); const c = id === 'dragon' ? [Math.random() < 0.5 ? 1 : 0.35, 0.4, 1] : id === 'golem' ? [1, 0.5, 0.1] : [1, 0.85, 0.3]; FX.puff(V.x, V.y, V.z, (Math.random() - 0.5) * 6, 4, (Math.random() - 0.5) * 6, c[0], c[1], c[2], 1, 0.4, 0.7, 9, 1, 0, true); } }
  }
  function dispose(A) { if (A && A.mound && A.mound.parent) A.mound.parent.remove(A.mound); if (A && A.tube && A.tube.parent) A.tube.parent.remove(A.tube); }

  /* ======================= LO QUE SUELTAN Y LOS RETOS ======================= */
  const OWN = new Set(['pick', 'tronco', 'orb', 'sand', 'wave', 'puff']);
  const owns = z => OWN.has(z.k) || ((z.k === 'barrel' || z.k === 'shell') && !!z.style);
  const MASK = [['#c8102e', '#1a1a1a', '#ffd23d'], ['#1f4fd8', '#f4f0e8', '#ffd23d'], ['#7a1fa8', '#ffd23d', '#fff4d0'], ['#0f8a5a', '#ffd23d', '#fff4d0'], ['#f4f0e8', '#c8102e', '#ffd23d']];
  const maskTex = {};
  function maskMat(i, H) { if (maskTex[i]) return maskTex[i]; const [a, b, gold] = MASK[i];
    const t = H.tex(256, 128, (x, w, h) => { x.fillStyle = a; x.fillRect(0, 0, w, h); x.fillStyle = b; const dw = 32, dh = 32; for (let r = -1; r < 6; r++) for (let c = -1; c < 10; c++) if ((r + c) % 2 === 0) { const cx = c * dw, cy = r * dh; x.beginPath(); x.moveTo(cx, cy - dh / 2); x.lineTo(cx + dw / 2, cy); x.lineTo(cx, cy + dh / 2); x.lineTo(cx - dw / 2, cy); x.closePath(); x.fill(); }
      x.strokeStyle = gold; x.lineWidth = 3; for (const sx of [-1, 1]) { x.beginPath(); x.ellipse(w / 2 + sx * 49, h / 2 - 6, 30, 19, sx * -0.18, 0, TAU); x.stroke(); x.beginPath(); for (let k = 0; k < 20; k++) { const a2 = k * 0.45, r = 4 + k * 1.3; const px = w / 2 + sx * (90 + Math.cos(a2) * r * 0.6), py = h / 2 + 24 + Math.sin(a2) * r * 0.5; k ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); }
      x.fillStyle = gold; for (let k = 0; k < 40; k++) { x.globalAlpha = 0.5 + Math.random() * 0.5; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 1.5, 0, TAU); x.fill(); } x.globalAlpha = 1; }, true);
    t.repeat.set(1 / 2.3, 1 / 1.15); t.offset.set(0.5, 0.5); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.35, metalness: 0.25, emissive: '#ffffff', emissiveMap: t, emissiveIntensity: 0.18 }); GFX.linearize(new THREE.Mesh(new THREE.BoxGeometry(), m)); return (maskTex[i] = m); }
  let maskGeo = null, tunjoGeo = null;
  function getMaskGeo() { if (maskGeo) return maskGeo; const sh = new THREE.Shape();
    sh.moveTo(0, 0.3); sh.bezierCurveTo(0.35, 0.52, 0.95, 0.48, 1.08, 0.16); sh.bezierCurveTo(1.04, -0.14, 0.78, -0.44, 0.46, -0.4); sh.bezierCurveTo(0.26, -0.37, 0.13, -0.14, 0, -0.12);
    sh.bezierCurveTo(-0.13, -0.14, -0.26, -0.37, -0.46, -0.4); sh.bezierCurveTo(-0.78, -0.44, -1.04, -0.14, -1.08, 0.16); sh.bezierCurveTo(-0.95, 0.48, -0.35, 0.52, 0, 0.3);
    for (const sx of [-1, 1]) { const hp = new THREE.Path(); hp.absellipse(sx * 0.43, 0.04, 0.22, 0.12, 0, TAU, true, sx * -0.18); sh.holes.push(hp); }
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.07, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 16 }); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, p.getZ(i) - x * x * 0.38 - y * y * 0.15); } g.computeVertexNormals(); g.rotateY(Math.PI); g.scale(1.25, 1.25, 1.25); return (maskGeo = g); }
  function getTunjoGeo() { if (tunjoGeo) return tunjoGeo; const sh = new THREE.Shape();
    sh.moveTo(-0.32, 1.0); sh.lineTo(-0.42, 1.18); sh.lineTo(-0.28, 1.12); sh.lineTo(-0.18, 1.26); sh.lineTo(-0.08, 1.12); sh.lineTo(0, 1.3); sh.lineTo(0.08, 1.12); sh.lineTo(0.18, 1.26); sh.lineTo(0.28, 1.12); sh.lineTo(0.42, 1.18); sh.lineTo(0.32, 1.0);
    sh.lineTo(0.3, 0.62); sh.lineTo(0.5, 0.5); sh.lineTo(0.42, -0.9); sh.lineTo(0.16, -0.9); sh.lineTo(0.14, -1.15); sh.lineTo(0.04, -1.15); sh.lineTo(0, -0.95); sh.lineTo(-0.04, -1.15); sh.lineTo(-0.14, -1.15); sh.lineTo(-0.16, -0.9); sh.lineTo(-0.42, -0.9); sh.lineTo(-0.5, 0.5); sh.lineTo(-0.3, 0.62); sh.lineTo(-0.32, 1.0);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 }); g.translate(0, 0, -0.05); return (tunjoGeo = g); }
  /* columna de luz para ver los objetos de lejos */
  let beamGeo = null, beamTex = null; const beamMats = {};
  function beam(col) { if (!beamGeo) { beamGeo = new THREE.CylinderGeometry(0.45, 0.6, 14, 12, 1, true).translate(0, 7, 0); beamTex = GFX.canvasTex(16, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0.8)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, false); }
    const m = beamMats[col] || (beamMats[col] = new THREE.MeshBasicMaterial({ map: beamTex, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: 0.5 })); const b = new THREE.Mesh(beamGeo, m); b.position.y = 1.4; b.userData.beam = 1; return b; }
  function hazMesh(z, H) {
    mats(H); const g = new THREE.Group(), { add } = H, mt = H.mt;
    if (z.k === 'pick' && z.style === 'tunjo') { const f = new THREE.Group(); add(f, getTunjoGeo(), M.tunjo);
      /* relieves de alambre: ojos, nariz, boca, brazos cruzados, collar */
      for (const sx of [-1, 1]) { add(f, new THREE.BoxGeometry(0.16, 0.04, 0.05), M.tunjoL, sx * 0.13, 0.86, -0.1); add(f, new THREE.BoxGeometry(0.05, 0.62, 0.05), M.tunjoL, sx * 0.3, 0.12, -0.1, 0, 0, sx * 0.5); }
      add(f, new THREE.BoxGeometry(0.04, 0.18, 0.05), M.tunjoL, 0, 0.74, -0.1); add(f, new THREE.BoxGeometry(0.18, 0.035, 0.05), M.tunjoL, 0, 0.62, -0.1); add(f, new THREE.BoxGeometry(0.62, 0.05, 0.05), M.tunjoL, 0, 0.42, -0.1);
      for (let k = 0; k < 5; k++) add(f, new THREE.SphereGeometry(0.045, 6, 4), M.tunjoL, (k - 2) * 0.12, 0.36, -0.12);
      f.scale.setScalar(1.7); g.add(f); g.userData.f = f; const gl = H.glowSprite('#ffd24a', 4.4, 0.8); g.add(gl); g.userData.gl = gl; g.add(beam('#ffd24a')); }
    else if (z.k === 'pick') { const i = Math.abs(Math.round(z.s * 7)) % MASK.length, f = new THREE.Group(); f.add(new THREE.Mesh(getMaskGeo(), [maskMat(i, H), mt.gold]));
      for (let k = 0; k < 4; k++) { const pv = new THREE.Group(); pv.position.set(-0.95, 0.38, 0.12); pv.rotation.z = 0.5 - k * 0.22; const fe = new THREE.Mesh(H.feather(1.5 + k * 0.15, 0.42, mt.white), k % 2 ? mt.white : maskMat(i, H)); fe.rotation.x = Math.PI / 2; pv.add(fe); f.add(pv); }
      f.scale.setScalar(1.35); g.add(f); g.userData.f = f; const gl = H.glowSprite(MASK[i][0], 4, 0.55); gl.position.z = 0.4; g.add(gl); g.userData.gl = gl; g.add(beam(MASK[i][0] === '#f4f0e8' ? '#ffd23d' : MASK[i][0])); }
    else if (z.k === 'tronco') { const L = z.len || 6, lg = new THREE.Group();
      add(lg, new THREE.CylinderGeometry(0.72, 0.64, L, 14, 1, true).rotateX(Math.PI / 2), M.bark);
      for (const sz of [-1, 1]) add(lg, new THREE.CircleGeometry(sz > 0 ? 0.72 : 0.64, 14), M.ring, 0, 0, sz * L / 2, 0, sz > 0 ? 0 : Math.PI, 0);
      seed = Math.round(z.s * 13) || 3; for (let k = 0; k < 2; k++) { const b = add(lg, new THREE.CylinderGeometry(0.12, 0.2, 1.3, 7).translate(0, 0.65, 0), M.bark, 0, 0.3, (rnd() - 0.5) * L * 0.6); b.rotation.set(rnd() - 0.5, 0, (rnd() < 0.5 ? -1 : 1) * (0.6 + rnd() * 0.5)); }
      for (let k = 0; k < 3; k++) add(lg, new THREE.SphereGeometry(0.4, 8, 6).scale(1, 0.35, 1.6), M.moss, (rnd() - 0.5) * 0.6, 0.6, (rnd() - 0.5) * L * 0.7);
      lg.position.y = 0.32; g.add(lg); g.userData.lg = lg; }
    else if (z.k === 'orb') { const pink = Math.round(z.u * 3 + z.s) % 2 === 0, o = new THREE.Group(); add(o, new THREE.SphereGeometry(0.5, 14, 10), M.white); add(o, new THREE.SphereGeometry(0.85, 16, 12), pink ? M.orbP : M.orbC);
      const r1 = add(o, new THREE.TorusGeometry(1.05, 0.06, 6, 28), pink ? M.orbC : M.orbP); const r2 = add(o, new THREE.TorusGeometry(1.05, 0.06, 6, 28), pink ? M.orbC : M.orbP); r2.rotation.x = Math.PI / 2;
      const gl = H.glowSprite(pink ? '#ff3df0' : '#5af0ff', 4.6, 0.9); o.add(gl); g.add(o); g.userData.o = o; g.userData.r = [r1, r2]; g.userData.pink = pink; }
    else if (z.k === 'sand') { const m = new THREE.Mesh(new THREE.PlaneGeometry(z.r * 2.3, z.r * 2.3).rotateX(-Math.PI / 2), M.swirl.clone()); m.renderOrder = 2; g.add(m); g.userData.m = m; }
    else if (z.k === 'wave') { const b = new THREE.Mesh(new THREE.PlaneGeometry(1, 3).rotateX(-Math.PI / 2), M.band.clone()), c = new THREE.Mesh(new THREE.PlaneGeometry(1, 2.6).translate(0, 1.3, 0), M.curt.clone()); b.position.y = 0.15; g.add(b); g.add(c); g.userData.b = b; g.userData.c = c; }
    else if (z.k === 'barrel' && z.style === 'ball') { const b = new THREE.Group(); add(b, new THREE.SphereGeometry(1.05, 16, 12), M.sand); for (let k = 0; k < 6; k++) add(b, new THREE.SphereGeometry(0.35, 8, 6), M.sand, (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.6); b.position.y = 1.05; g.add(b); g.userData.b = b; g.userData.rad = 1.05; }
    else if (z.k === 'barrel') { const b = new THREE.Group(); add(b, rockGeo(1.1, 1, 0.95, 1, 90 + (Math.round(z.u * 10) & 7)), M.rock); b.position.y = 1.05; g.add(b); const gl = H.glowSprite('#ff7a1a', 3, 0.6); gl.position.y = 1.05; g.add(gl); g.userData.b = b; g.userData.rad = 1.05; }
    else if (z.k === 'shell' && z.style === 'bolt') { const o = new THREE.Group(); add(o, new THREE.SphereGeometry(0.45, 12, 8), M.white); const a = H.glowSprite('#7af0ff', 4.2, 1), b = H.glowSprite('#ffffff', 2, 1); o.add(a); o.add(b); g.add(o); g.userData.fl = [a, b]; }
    else if (z.k === 'shell') { add(g, rockGeo(0.65, 1, 1, 1, 77), M.rock); const gl = H.glowSprite('#ff7a1a', 3.2, 0.9); g.add(gl); }
    g.traverse(m => { if (m.isMesh && !m.material.transparent) m.castShadow = GQ.lv > 1; }); return g;
  }
  function hazStep(z, m, R, t, dt, H) {
    const T = R.track;
    if (z.k === 'pick') { m.visible = !(z.gone > 0); if (!m.visible) { m.userData.pop = 0; return; } const pop = m.userData.pop = Math.min(1, (m.userData.pop == null ? 1 : m.userData.pop) + dt * 3);
      H.place(m, z.s, z.u, z.h, Math.sin(z.age * 1.6) * 0.55); m.userData.f.scale.setScalar((z.style === 'tunjo' ? 1.7 : 1.35) * (0.2 + 0.8 * pop)); m.userData.gl.material.opacity = (z.style === 'tunjo' ? 0.65 : 0.45) + Math.sin(z.age * 5) * 0.2;
      if (Math.random() < dt * 3) { V.copy(m.position); FX.puff(V.x + (Math.random() - 0.5) * 2, V.y + (Math.random() - 0.5) * 2, V.z + (Math.random() - 0.5) * 2, 0, 0.5, 0, 1, 0.92, 0.6, 1, 0.3, 0.6, 0, 1, 0, true); } return; }
    if (z.k === 'tronco') { H.place(m, z.s, z.u, z.h + Math.sin(z.age * 2.2) * 0.08, -z.yaw, Math.sin(z.age * 1.7) * 0.06); m.userData.lg.rotation.z = z.age * z.vs * 0.25;
      if (Math.random() < dt * 4) { const sd = (Math.random() < 0.5 ? 1 : -1) * (z.len || 6) / 2; T.pos(z.s + Math.cos(z.yaw) * sd, z.u + Math.sin(z.yaw) * sd, z.h + 0.3, V); FX.puff(V.x, V.y, V.z, 0, 1.2, 0, 1, 1, 1, 0.55, 0.9, 0.7, 6, 1, 1.5); } return; }
    if (z.k === 'orb') { H.place(m, z.s, z.u, z.h); const o = m.userData.o; o.rotation.y += dt * 2; m.userData.r[0].rotation.y += dt * 3; m.userData.r[1].rotation.z += dt * 2.4; const k = Math.min(1, z.age / 0.3); o.scale.setScalar(k * (1 + Math.sin(z.age * 10) * 0.08));
      if (Math.random() < 0.6) { V.copy(m.position); FX.puff(V.x, V.y, V.z, 0, 0.3, 0, m.userData.pink ? 1 : 0.35, m.userData.pink ? 0.25 : 0.95, 1, 0.8, 0.5, 0.45, 0, 1, 0, true); } return; }
    if (z.k === 'sand') { H.place(m, z.s, z.u, T.groundH(z.s, z.u) + 0.06, z.age * 0.9); const a = Math.min(1, z.age / 0.6) * Math.min(1, (z.life - z.age) / 0.8); m.userData.m.material.opacity = clamp(a, 0, 1);
      if (Math.random() < dt * 6) { const a2 = Math.random() * TAU, r = Math.random() * z.r; T.pos(z.s + Math.cos(a2) * r, z.u + Math.sin(a2) * r, T.groundH(z.s, z.u) + 0.3, V); FX.puff(V.x, V.y, V.z, 0, 0.8, 0, 0.82, 0.66, 0.4, 0.5, 1, 0.8, 0, 1, 1.5); } return; }
    if (z.k === 'wave') { const lim = T.limits(z.s), W = lim.wall * 2 + 2; H.place(m, z.s, 0, T.groundH(z.s, 0)); m.userData.b.scale.x = W; m.userData.c.scale.x = W; const a = clamp(Math.min(z.age / 0.15, (z.life - z.age) / 0.6), 0, 1);
      m.userData.b.material.opacity = a; m.userData.c.material.opacity = a * 0.8; m.userData.c.scale.y = 0.7 + Math.sin(z.age * 30) * 0.15;
      if (Math.random() < 0.8) { const u = (Math.random() - 0.5) * W; T.pos(z.s, u, T.groundH(z.s, u) + 0.3, V); FX.puff(V.x, V.y, V.z, 0, 3, 0, 0.6, 0.48, 0.38, 0.7, 1.8, 0.8, 0, 1.5, 2); } return; }
    if (z.k === 'puff') { if (!m.userData.done) { m.userData.done = 1; T.pos(z.s, z.u, (z.h || 1) + 1.5, V); FX.emit('glow', V.x, V.y, V.z, 36, { c: [[1, 0.25, 0.95], [0.35, 0.95, 1], [1, 1, 1]], sp: 9, size: 0.6, life: 0.6, drag: 2 }); } return; }
    if (z.k === 'barrel') { H.place(m, z.s, z.u, z.h); const b = m.userData.b; b.rotation.x += (z.vs || 0) * dt / m.userData.rad;
      if (Math.random() < 0.4) { T.pos(z.s, z.u, z.h + 0.3, V); if (z.style === 'ball') FX.puff(V.x, V.y, V.z, 0, 1, 0, 0.84, 0.7, 0.46, 0.55, 1.2, 0.8, 0, 1.5, 2); else FX.puff(V.x, V.y + 0.6, V.z, 0, 1.5, 0, 0.2, 0.17, 0.16, 0.5, 1.4, 1.2, -0.5, 1, 2); } return; }
    if (z.k === 'shell') { T.pos(z.s, z.u, z.h, V); m.position.copy(V); m.rotation.x += dt * 4; m.rotation.y += dt * 3;
      if (z.style === 'bolt') { for (const f of m.userData.fl) f.material.opacity = 0.5 + Math.random() * 0.5; FX.puff(V.x, V.y, V.z, (Math.random() - 0.5) * 2, 2, (Math.random() - 0.5) * 2, 0.6, 0.95, 1, 0.9, 0.5, 0.35, 0, 1, 0, true); }
      else { FX.puff(V.x, V.y, V.z, 0, 0.5, 0, 1, 0.5, 0.12, 0.9, 0.8, 0.45, 0, 1, 1, true); if (Math.random() < 0.6) FX.puff(V.x, V.y, V.z, 0, 0.8, 0, 0.16, 0.14, 0.13, 0.5, 1.2, 1.2, -0.3, 1, 2); } return; }
  }
  /* ======================= TORMENTA Y GÉISERES ======================= */
  function worldInit(R, scene, H) {
    const W = { scene, items: [], bolts: [] }; mats(H); const T = R.track;
    if (R.storm) { const wall = new THREE.Group(), cols = ['#c98e4c', '#dcae70', '#b07842', '#e6bf86', '#a46a36']; W.puffs = []; seed = 5;
      /* una pared hecha de nubes de polvo que ruedan hacia adelante (filas abajo más densas y oscuras) */
      for (let row = 0; row < 5; row++) for (let i = 0; i < 9; i++) for (let lay = 0; lay < 2; lay++) { const mtl = new THREE.SpriteMaterial({ map: puffTex(H), color: cols[Math.floor(rnd() * cols.length)], transparent: true, depthWrite: false, opacity: 0, rotation: rnd() * TAU });
        if (row < 2) mtl.color.multiplyScalar(0.82); const sp = new THREE.Sprite(mtl); wall.add(sp); W.puffs.push({ sp, row, x: (i / 8 - 0.5) + (rnd() - 0.5) * 0.08, ph: rnd(), sz: 15 + rnd() * 10 + row * 1.5, spin: (rnd() - 0.5) * 0.4, lay }); }
      scene.add(wall); W.wall = wall; W.items.push(wall); }
    if (R.xGeysers && R.xGeysers.length) { W.jets = [];
      const jetT = H.tex(64, 256, (x, w, h) => { const g2 = x.createLinearGradient(0, 0, 0, h); g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(0.3, 'rgba(255,255,255,0.75)'); g2.addColorStop(1, 'rgba(230,245,255,0.95)'); x.fillStyle = g2; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'destination-in'; const g3 = x.createLinearGradient(0, 0, w, 0); g3.addColorStop(0, 'rgba(0,0,0,0)'); g3.addColorStop(0.5, 'rgba(0,0,0,1)'); g3.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g3; x.fillRect(0, 0, w, h); }, false);
      const jetM = new THREE.MeshBasicMaterial({ map: jetT, transparent: true, depthWrite: false, side: THREE.DoubleSide });
      for (const gz of R.xGeysers) { const p = T.pos(gz.s, gz.u, 0.04, new THREE.Vector3()), grp = new THREE.Group(); grp.position.copy(p);
        const r1 = new THREE.Mesh(new THREE.CylinderGeometry(gz.r * 0.9, gz.r * 1.1, 0.25, 20), M.rim); grp.add(r1); const pl = new THREE.Mesh(new THREE.CircleGeometry(gz.r * 0.7, 20), M.pool); pl.rotation.x = -Math.PI / 2; pl.position.y = 0.14; grp.add(pl);
        for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35 + Math.random() * 0.25, 0), M.rim); st.position.set(Math.cos(a) * gz.r * 1.05, 0.15, Math.sin(a) * gz.r * 1.05); grp.add(st); }
        const j = new THREE.Mesh(new THREE.CylinderGeometry(gz.r * 0.35, gz.r * 0.7, 1, 12, 1, true).translate(0, 0.5, 0), jetM); j.position.y = 0.06; grp.add(j); scene.add(grp); W.items.push(grp); W.jets.push({ j, gz, p }); } }
    return W;
  }
  function worldStep(W, R, t, dt, events, H) {
    if (!W) return; const T = R.track;
    if (W.wall && R.storm) { const S = R.storm, s = T.wrap(S.d), lim = T.limits(s), Wd = lim.wall * 2 + 60; H.place(W.wall, s, 0, T.groundH(s, 0));
      for (const P of W.puffs) { const ph = (P.ph + t * (0.22 + P.row * 0.02)) % 1, env = Math.sin(ph * Math.PI); P.sp.position.set(-P.x * Wd, 3 + P.row * 7.5 + ph * 4, -24 + ph * 26 - P.lay * 6); const sc = P.sz * (0.8 + ph * 0.4); P.sp.scale.set(sc, sc, 1);
        P.sp.material.opacity = Math.min(1, env * 1.6) * (P.row < 2 ? 0.95 : 0.8); P.sp.material.rotation += P.spin * (dt || 0); }
      let sk = 0; for (const c of R.cars) if (!c.bot) sk = Math.max(sk, c.sandK || 0); GFX.stormK = R.state === 'race' || R.state === 'done' ? Math.min(1, sk * 1.3) : 0;
      /* el viento de arena: polvo que pasa volando junto a los jugadores cuando la tormenta está cerca */
      for (const c of R.cars) { if (c.bot || !(c.sandK > 0.15)) continue; const n = Math.random() < c.sandK * dt * 60 ? 2 : 0; for (let q = 0; q < n; q++) { const s2 = c.s - 6 + Math.random() * 30, u = c.u + (Math.random() - 0.5) * 22; T.pos(s2, u, 0.5 + Math.random() * 5, V); const o = T.at(s2); FX.puff(V.x, V.y, V.z, o.tx * (24 + c.f * 0.4), 0.5, o.tz * (24 + c.f * 0.4), 0.86, 0.66, 0.4, 0.35 + c.sandK * 0.35, 1.6 + Math.random() * 1.6, 1.2, 0, 0.3, 1.2); } }
      if (Math.random() < dt * 20) { const u = (Math.random() - 0.5) * lim.wall * 2; T.pos(s + 2, u, 1 + Math.random() * 8, V); const o = T.at(s); FX.puff(V.x, V.y, V.z, o.tx * 18, 1, o.tz * 18, 0.84, 0.64, 0.38, 0.6, 4, 1.6, 0, 0.4, 3); } }
    if (W.jets) for (const J of W.jets) { const on = T.geyserOn(J.gz), hh = on === 1 ? 16 + Math.sin(T.time * 20) * 1.2 : on ? 1.4 + Math.sin(T.time * 30) * 0.4 : 0.01; J.j.scale.y = damp(J.j.scale.y, hh, on === 1 ? 14 : 5, dt || 1 / 60); J.j.scale.x = J.j.scale.z = on === 1 ? 1.1 : 0.7;
      if (on && Math.random() < dt * (on === 1 ? 20 : 5)) FX.puff(J.p.x + (Math.random() - 0.5) * 2, J.p.y + (on === 1 ? 4 + Math.random() * 12 : 0.6), J.p.z + (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, on === 1 ? 6 : 1.5, (Math.random() - 0.5) * 2, 0.95, 0.97, 1, 0.5, on === 1 ? 2.5 : 1.2, 1.4, -1, 1, 2.5); }
    /* rayos: una línea quebrada del cielo al piso */
    for (const e of events) if (e.type === 'boom' && e.k === 'zap') { const pts = []; T.pos(e.s, e.u, e.h, V); let x = V.x, z = V.z; for (let y = V.y + 50; y > V.y; y -= 5) { pts.push(new THREE.Vector3(x, y, z)); x += (Math.random() - 0.5) * 3; z += (Math.random() - 0.5) * 3; } pts.push(V.clone());
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#c8fbff', transparent: true })); W.scene.add(l); W.bolts.push({ l, t: 0.3 }); const sp = H.glowSprite('#7af0ff', 9, 1); sp.position.copy(V); W.scene.add(sp); W.bolts.push({ l: sp, t: 0.25 }); }
    for (let i = W.bolts.length - 1; i >= 0; i--) { const b = W.bolts[i]; b.t -= dt; if (b.l.material) b.l.material.opacity = Math.max(0, b.t / 0.3) * (Math.random() < 0.3 ? 0.4 : 1); if (b.t <= 0) { W.scene.remove(b.l); W.bolts.splice(i, 1); } }
  }
  let _puff = null;
  function puffTex(H) { return _puff || (_puff = H.tex(128, 128, (x, w, h) => { x.clearRect(0, 0, w, h); seed = 9; for (let k = 0; k < 14; k++) { const cx = 30 + rnd() * 68, cy = 34 + rnd() * 60, r = 22 + rnd() * 26, g = x.createRadialGradient(cx, cy, 0, cx, cy, r); const v = 0.8 + rnd() * 0.2; g.addColorStop(0, `rgba(${255 * v | 0},${255 * v | 0},${255 * v | 0},0.55)`); g.addColorStop(0.6, `rgba(${235 * v | 0},${235 * v | 0},${235 * v | 0},0.3)`); g.addColorStop(1, 'rgba(230,230,230,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); } }, false)); }
  function worldClear(W) { GFX.stormK = null; if (!W) return; for (const o of W.items) if (o.parent) o.parent.remove(o); for (const b of W.bolts) if (b.l.parent) b.l.parent.remove(b.l); }
  return { build, pose, animate, dispose, owns, hazMesh, hazStep, worldInit, worldStep, worldClear };
})();
