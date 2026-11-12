/* =========================================================================
   BÓLIDO 3D — carrocería esculpida (perfil extruido con bisel), cabina de
   vidrio con casco, ruedas con aro de luz, alerones, toberas con llama de
   turbo, núcleo esmeralda que brilla según la barra, luz bajo el chasis y
   sombra suave. Se orienta con el marco de la pista + rumbo + inclinaciones.
   ========================================================================= */
/* ---------- GARAJE: pinturas, neón y turbo que se ganan (el catálogo y los desbloqueos están en 11c-vest.js) ----------
   mat = diseño del vestidor común de GameHub pintado en la carrocería (fit = de punta a punta; flip = las llamas
   salen de la nariz); emis = cuánto brilla en la oscuridad; metal/rough = acabado; holo = cambia de color. */
const CAR_PAINTS = {
  jaguar: { name: 'Piel de jaguar', color: '#d99a2a', color2: '#2a1606', accent: '#ffd27a', mat: 'jaguar', matC: ['#d99a2a', '#ffd27a', '#2a1606', '#7a3e0a'] },
  caiman: { name: 'Escamas de caimán', color: '#2f8a5a', color2: '#0e3a24', accent: '#c8f0a0', mat: 'escamas', matC: ['#2f8a5a', '#9be8b0', '#0e3a24'] },
  llamarada: { name: 'Llamarada', color: '#2a0a04', color2: '#ff7a1a', accent: '#ffd23f', mat: 'llamas', matC: ['#3a0a04', '#0c0202', '255,226,110', '255,84,16'], fit: true, flip: true, emis: 0.55 },
  tormenta: { name: 'Tormenta eléctrica', color: '#2a3448', color2: '#bfe4ff', accent: '#5ab8ff', mat: 'tormenta', matC: ['#1a2234', '120,140,180'], fit: true, emis: 0.25 },
  aurora: { name: 'Aurora boreal', color: '#06121e', color2: '#9affd8', accent: '#c79aff', mat: 'aurora', matC: ['#06121e', '110,255,190', '170,110,255'], fit: true, emis: 0.6 },
  cristal: { name: 'Hielo tallado', color: '#bfeeff', color2: '#ffffff', accent: '#7ae0ff', mat: 'cristal', matC: ['#bfeeff', '#6ab8e8', '#f2fdff'], metal: 0.25, rough: 0.12 },
  magma: { name: 'Magma', color: '#1a0806', color2: '#ff9a3a', accent: '#ff5a1a', mat: 'lava', matC: ['#2a0e08', '#0a0404'], emis: 1.5, pulse: true, cracks: true },
  oro: { name: 'Filigrana de oro', color: '#e8b030', color2: '#7a1a10', accent: '#fff6d0', mat: 'oro', matC: ['#e8b030', '#fff0a8', '#9a6410'], metal: 0.85, rough: 0.24 },
  fatuo: { name: 'Fuego fatuo', color: '#061a3a', color2: '#9ff0ff', accent: '#4ab8ff', mat: 'llamas', matC: ['#0a2458', '#030a1c', '160,240,255', '50,110,255'], fit: true, flip: true, emis: 0.75 },
  galaxia: { name: 'Galaxia', color: '#120a2e', color2: '#ff6fd8', accent: '#ffd6f6', mat: 'galaxia', matC: ['255,110,210', '170,100,255', '90,150,255'], fit: true, emis: 0.55 },
  agujero: { name: 'Agujero negro', color: '#0c0414', color2: '#c88aff', accent: '#8a3aff', mat: 'vacio', matC: ['#3a0a5a', '200,120,255'], fit: true, emis: 0.7, pulse: true },
  holo: { name: 'Holográfica', color: '#dfe4f0', color2: '#ffffff', accent: '#ff9be6', mat: 'holo', matC: [], fit: true, metal: 0.55, rough: 0.16, holo: true },
};
// neón: luz bajo el chasis, aros de las ruedas, tobera y puntas del ala (fuego y arcoíris se mueven)
const CAR_NEONS = { piloto: null, cian: '#21e0ff', rosa: '#ff3dc8', verde: '#3dff8a', violeta: '#a35bff', oro: '#ffcf3a', fuego: '#ff5a1a', arcoiris: '#ff3d6e' };
// turbo: color de la llama y, los mejores, una estela de partículas mientras dura el turbo
const CAR_TURBOS = {
  azul: { c: ['255,255,255', '120,220,255', '60,120,255', '40,60,255'] },
  fuego: { c: ['255,255,235', '255,214,90', '255,110,30', '220,40,10'] },
  verde: { c: ['255,255,255', '150,255,200', '40,230,130', '10,160,90'] },
  rosa: { c: ['255,255,255', '255,170,230', '255,60,190', '200,20,140'] },
  violeta: { c: ['255,255,255', '210,170,255', '150,80,255', '90,30,220'], trail: [[0.75, 0.55, 1], [0.95, 0.85, 1]] },
  oro: { c: ['255,255,240', '255,236,150', '255,190,40', '220,130,10'], trail: [[1, 0.85, 0.35], [1, 0.95, 0.7], [1, 0.7, 0.15]] },
  arcoiris: { c: ['255,255,255', '255,120,200', '120,160,255', '80,255,170'], rainbow: true, trail: [[1, 0.3, 0.4], [1, 0.75, 0.2], [0.4, 1, 0.5], [0.3, 0.7, 1], [0.75, 0.4, 1]] },
  cometa: { c: ['255,255,255', '210,230,255', '150,180,255', '90,120,255'], trail: [[1, 1, 1], [0.8, 0.9, 1], [1, 0.95, 0.8]], stars: true },
};
const CarArt = (() => {
  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), P = new THREE.Vector3();
  let flameTex = null, shadowTex = null; const flameTexes = {};
  function flameTexOf(kind) {
    texes(); if (!kind || kind === 'azul' || !CAR_TURBOS[kind]) return flameTex;
    if (flameTexes[kind]) return flameTexes[kind];
    const C = CAR_TURBOS[kind].c;
    return (flameTexes[kind] = GFX.canvasTex(64, 128, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, `rgba(${C[0]},1)`); g.addColorStop(0.25, `rgba(${C[1]},0.95)`); g.addColorStop(0.6, `rgba(${C[2]},0.55)`); g.addColorStop(1, `rgba(${C[3]},0)`);
      x.fillStyle = g; x.beginPath(); x.moveTo(w / 2 - 22, 0); x.quadraticCurveTo(w / 2 - 14, h * 0.6, w / 2, h); x.quadraticCurveTo(w / 2 + 14, h * 0.6, w / 2 + 22, 0); x.fill();
      if (CAR_TURBOS[kind].rainbow) { x.globalCompositeOperation = 'source-atop'; const r = x.createLinearGradient(0, 0, 0, h); ['255,90,120', '255,190,60', '120,255,140', '90,170,255', '200,110,255'].forEach((c, i) => r.addColorStop(0.15 + i * 0.18, `rgba(${c},0.75)`)); x.fillStyle = r; x.fillRect(0, h * 0.12, w, h); }
    }, false));
  }
  function texes() {
    if (flameTex) return;
    flameTex = GFX.canvasTex(64, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(120,220,255,0.95)'); g.addColorStop(0.6, 'rgba(60,120,255,0.5)'); g.addColorStop(1, 'rgba(40,60,255,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(w / 2 - 22, 0); x.quadraticCurveTo(w / 2 - 14, h * 0.6, w / 2, h); x.quadraticCurveTo(w / 2 + 14, h * 0.6, w / 2 + 22, 0); x.fill(); }, false);
    shadowTex = GFX.canvasTex(64, 128, (x, w, h) => { const g = x.createRadialGradient(32, 64, 4, 32, 64, 60); g.addColorStop(0, 'rgba(0,0,0,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.save(); x.scale(1, 1); x.fillRect(0, 0, w, h); x.restore(); }, false);
  }
  // carrocería por secciones (superelipses) unidas: un fuselaje liso y afilado
  function loftOld(secs, M = 24, caps = true) {
    const pos = [], idx = [];
    const ring = S => { const out = [], e = 2 / (S.e || 2.6), ym = (S.y0 + S.y1) / 2, hh = (S.y1 - S.y0) / 2; for (let j = 0; j < M; j++) { const t = j / M * TAU, c = Math.cos(t), sn = Math.sin(t); out.push((S.x || 0) + S.hw * Math.sign(c) * Math.pow(Math.abs(c), e), ym + hh * Math.sign(sn) * Math.pow(Math.abs(sn), e) * (sn < 0 ? (S.flat || 1) : 1), S.z); } return out; };
    for (const S of secs) pos.push(...ring(S));
    for (let i = 0; i < secs.length - 1; i++) for (let j = 0; j < M; j++) { const a = i * M + j, b = i * M + (j + 1) % M, c = (i + 1) * M + (j + 1) % M, d = (i + 1) * M + j; idx.push(a, b, c, a, c, d); }
    if (caps) for (const [k, dir] of [[0, -1], [secs.length - 1, 1]]) { const base = pos.length / 3, r = ring(secs[k]); pos.push(...r); let cx = 0, cy = 0; for (let j = 0; j < M; j++) { cx += r[j * 3]; cy += r[j * 3 + 1]; } pos.push(cx / M, cy / M, secs[k].z + dir * 0.02); const C = base + M; for (let j = 0; j < M; j++) { const a = base + j, b = base + (j + 1) % M; if (dir > 0) idx.push(C, a, b); else idx.push(C, b, a); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  // carrocería con UV: u alrededor de la sección (0 = costado izquierdo, 0.25 = arriba, 0.5 = derecho), v a lo largo (0 = cola, 1 = nariz)
  function loftUV(secs, M = 32) {
    const pos = [], uv = [], idx = [], z0 = secs[0].z, z1 = secs[secs.length - 1].z, C = M + 1;
    for (const S of secs) { const e = 2 / (S.e || 2.6), ym = (S.y0 + S.y1) / 2, hh = (S.y1 - S.y0) / 2;
      for (let j = 0; j <= M; j++) { const t = j / M * TAU, c = Math.cos(t), sn = Math.sin(t), bot = sn < 0;
        const xs = S.hw * (bot ? (S.under || 1) : 1); pos.push((S.x || 0) + xs * Math.sign(c) * Math.pow(Math.abs(c), e), ym + hh * Math.sign(sn) * Math.pow(Math.abs(sn), e), S.z); uv.push(j / M, (S.z - z0) / (z1 - z0)); } }
    for (let i = 0; i < secs.length - 1; i++) for (let j = 0; j < M; j++) { const a = i * C + j, b = a + 1, c = a + C + 1, d = a + C; idx.push(a, b, c, a, c, d); }
    for (const [k, dir] of [[0, -1], [secs.length - 1, 1]]) { const S = secs[k], base = pos.length / 3; for (let j = 0; j <= M; j++) { const q = (k * C + j) * 3; pos.push(pos[q], pos[q + 1], pos[q + 2]); uv.push(0.75, dir > 0 ? 0.99 : 0.01); }
      pos.push(S.x || 0, (S.y0 + S.y1) / 2, S.z + dir * 0.015); uv.push(0.75, dir > 0 ? 0.99 : 0.01); const Cn = base + C; for (let j = 0; j < M; j++) { const a = base + j, b = base + j + 1; if (dir > 0) idx.push(Cn, a, b); else idx.push(Cn, b, a); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  // lámina de alerón: perfil curvo extruido a lo ancho (x), con UV
  function foil(span, chord, thick, camber) { const sh = new THREE.Shape(); sh.moveTo(-chord / 2, 0); sh.quadraticCurveTo(0, thick + camber, chord / 2, camber * 0.4); sh.quadraticCurveTo(0, camber - thick * 0.2, -chord / 2, 0); const g = new THREE.ExtrudeGeometry(sh, { depth: span, bevelEnabled: false, curveSegments: 6 }); g.translate(0, 0, -span / 2); g.rotateY(Math.PI / 2); return g; }
  // barra entre dos puntos (suspensión, soportes)
  function strut(a, b, r) { const d = new THREE.Vector3().subVectors(b, a), g = new THREE.CylinderGeometry(r, r, d.length(), 6); g.translate(0, d.length() / 2, 0); const m = new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); m.setPosition(a); g.applyMatrix4(m); return g; }
  function mergeStatic(grp, keep) {
    const groups = new Map();
    for (const ch of grp.children.slice()) {
      if (!ch.isMesh || keep.has(ch) || Array.isArray(ch.material)) continue;
      ch.updateMatrix(); const g = ch.geometry.index ? ch.geometry.toNonIndexed() : ch.geometry.clone(); g.applyMatrix4(ch.matrix); if (!g.attributes.normal) g.computeVertexNormals();
      if (!groups.has(ch.material)) groups.set(ch.material, []); groups.get(ch.material).push(g); grp.remove(ch);
    }
    for (const [mat, list] of groups) {
      let n = 0; for (const g of list) n += g.attributes.position.count;
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
      for (const g of list) { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2); o += g.attributes.position.count; }
      const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); mg.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); mg.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      const mesh = new THREE.Mesh(mg, mat); mesh.castShadow = true; grp.add(mesh);
    }
  }
  /* ---------- texturas: decoración por piloto, fibra de carbono, llantas ---------- */
  const NUM = { cumbia: 7, salsa: 3, taiko: 9, freestyle: 1, country: 44, reggae: 5, flamenco: 8, samba: 10 };
  let carbonTex = null, tireTex = null; const liveryCache = {};
  function sharedTex() {
    if (carbonTex) return;
    carbonTex = GFX.canvasTex(64, 64, (x, w, h) => { x.fillStyle = '#121418'; x.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const g = x.createLinearGradient(i * 8, j * 8, i * 8 + 8, j * 8 + 8); const k = (i + j) % 2; g.addColorStop(0, k ? '#2a2e36' : '#181b20'); g.addColorStop(1, k ? '#14161a' : '#262a31'); x.fillStyle = g; x.fillRect(i * 8, j * 8, 8, 8); } }); carbonTex.repeat.set(3, 3);
    tireTex = GFX.canvasTex(512, 256, (x, w, h) => {
      // izquierda: costado (caucho, letras, franja del compuesto y rin de rayos); derecha: banda de rodadura
      const cx = 128, cy = 128; x.fillStyle = '#18181a'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#1e1e21'; x.beginPath(); x.arc(cx, cy, 127, 0, TAU); x.fill();
      x.strokeStyle = '#e8d43a'; x.lineWidth = 6; x.beginPath(); x.arc(cx, cy, 104, 0, TAU); x.stroke();
      x.font = '900 20px "Nunito", sans-serif'; x.fillStyle = '#e9e9e4'; x.textAlign = 'center'; x.textBaseline = 'middle';
      for (const [txt, a0] of [['VÉRTIGO', -1.9], ['VÉRTIGO', 1.25]]) { const L = txt.length; for (let i = 0; i < L; i++) { const a = a0 + (i - L / 2) * 0.13; x.save(); x.translate(cx + Math.cos(a) * 116, cy + Math.sin(a) * 116); x.rotate(a + Math.PI / 2); x.fillText(txt[i], 0, 0); x.restore(); } }
      const rg = x.createRadialGradient(cx, cy, 10, cx, cy, 92); rg.addColorStop(0, '#f2f4f7'); rg.addColorStop(0.6, '#9aa0a8'); rg.addColorStop(1, '#3a3e44'); x.fillStyle = rg; x.beginPath(); x.arc(cx, cy, 92, 0, TAU); x.fill();
      x.fillStyle = '#121316'; for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; x.save(); x.translate(cx, cy); x.rotate(a); x.beginPath(); x.moveTo(18, -9); x.lineTo(84, -15); x.lineTo(84, 15); x.lineTo(18, 9); x.closePath(); x.fill(); x.restore(); }
      x.fillStyle = '#dfe3e8'; for (let k = 0; k < 10; k++) { const a = (k + 0.5) / 10 * TAU; x.save(); x.translate(cx, cy); x.rotate(a); x.fillRect(16, -5, 70, 10); x.restore(); }
      x.fillStyle = '#c8202a'; x.beginPath(); x.arc(cx, cy, 20, 0, TAU); x.fill(); x.fillStyle = '#eee'; x.beginPath(); x.arc(cx, cy, 8, 0, TAU); x.fill();
      x.fillStyle = '#141416'; x.fillRect(256, 0, 256, h); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`; x.fillRect(256 + Math.random() * 256, Math.random() * h, 3, 1); }
      x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(256, 0, 10, h); x.fillRect(502, 0, 10, h);
    }, false);
  }
  // la pintura puesta: «piloto.0» de fábrica, «piloto.1» invertida, «piloto.2» fibra de carbono, «u.clave» del garaje
  function lookOf(pid, id) {
    const P0 = PILOTS[pid] || PILOTS.cumbia;
    if (typeof id === 'string' && id.startsWith('u.') && CAR_PAINTS[id.slice(2)]) return Object.assign({ key: id }, CAR_PAINTS[id.slice(2)]);
    const n = typeof id === 'string' ? +id.split('.')[1] || 0 : 0;
    if (n === 1) return { key: pid + '.1', color: P0.color2, color2: P0.color, accent: P0.accent };
    if (n === 2) return { key: pid + '.2', color: '#17191f', color2: P0.color, accent: P0.color2, carbon: true, metal: 0.35, rough: 0.3 };
    return { key: pid + '.0', color: P0.color, color2: P0.color2, accent: P0.accent };
  }
  // diseño del garaje sobre la carrocería: la tela (u) da la vuelta al bólido y (v) va de la cola a la nariz,
  // así que el mosaico va en celdas anchas y bajitas para que no se vea estirado
  function paintMat(x, W, H, L) {
    if (typeof Vest === 'undefined' || !L.mat) { x.fillStyle = L.color; x.fillRect(0, 0, W, H); return; }
    x.save();
    if (L.flip) { x.translate(0, H); x.scale(1, -1); }
    if (L.fit) { x.fillStyle = L.color; x.fillRect(0, 0, W, H); Vest.material(x, L.mat, L.matC, 0, 0, W, H, 1.7, 1, true); }
    else { const cw = W / 4, ch = cw / 3.6, gt = L.cracks && Vest.matTile ? Vest.matTile(L.mat, L.matC, true) : null; let k = 0;
      for (let yy = 0; yy < H; yy += ch) for (let xx = 0; xx < W; xx += cw) {
        Vest.material(x, L.mat, L.matC, xx, yy, cw + 0.5, ch + 0.5, 1.7 + (k++) * 0.37, 1, !gt);
        // magma: roca oscura y solo las grietas encendidas (así el brillo de la noche sale de las grietas)
        if (gt) { x.save(); x.globalCompositeOperation = 'lighter'; x.drawImage(gt, xx, yy, cw + 0.5, ch + 0.5); x.restore(); }
      } }
    x.restore();
  }
  function carbonFill(x, W, H) { x.fillStyle = '#121418'; x.fillRect(0, 0, W, H); for (let i = 0; i < W; i += 12) for (let j = 0; j < H; j += 4) { x.fillStyle = ((i / 12 + j / 4) % 2) ? 'rgba(70,76,90,0.55)' : 'rgba(30,33,40,0.6)'; x.fillRect(i, j, 12, 4); } const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.25, 'rgba(255,255,255,0.08)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  function livery(pid, L0) {
    const L = L0 || lookOf(pid), ck = pid + '|' + L.key;
    if (liveryCache[ck]) return liveryCache[ck];
    const P0 = Object.assign({}, PILOTS[pid], { color: L.color, color2: L.color2, accent: L.accent }), n = String(NUM[pid] || 0), W = 1024, H = 512, fancy = !!L.mat;
    const body = GFX.canvasTex(W, H, (x) => {
      const X = u => u * W, Y = v => (1 - v) * H;
      if (fancy) paintMat(x, W, H, L); else if (L.carbon) carbonFill(x, W, H); else { x.fillStyle = P0.color; x.fillRect(0, 0, W, H); }
      // vientre de fibra (abajo) y brillo lateral
      x.fillStyle = 'rgba(10,12,16,0.85)'; x.fillRect(X(0.6), 0, X(0.3), H);
      // franja central ancha que se abre en la cabina (color 2) con filetes del color de acento
      const stripe = (u0, k, col) => { x.fillStyle = col; x.beginPath(); const pts = [[0, 0.035], [0.35, 0.07], [0.6, 0.12], [0.8, 0.07], [1, 0.05]]; pts.forEach(([v, w], i) => { const xx = X(u0 - w * k); i ? x.lineTo(xx, Y(v)) : x.moveTo(xx, Y(v)); }); for (let i = pts.length - 1; i >= 0; i--) x.lineTo(X(u0 + pts[i][1] * k), Y(pts[i][0])); x.closePath(); x.fill(); };
      // (las pinturas del garaje solo llevan dos filetes finos: el diseño es el protagonista)
      if (fancy) { for (const du of [-0.075, 0.075]) { x.fillStyle = P0.accent; x.fillRect(X(0.25 + du) - 3, 0, 6, H); } }
      else { stripe(0.25, 1.25, P0.accent); stripe(0.25, 1, P0.color2); }
      // banda diagonal en los costados
      if (!fancy) for (const u0 of [0.0, 0.5]) { x.fillStyle = P0.color2; x.beginPath(); x.moveTo(X(u0 - 0.06), Y(0.62)); x.lineTo(X(u0 + 0.06), Y(0.5)); x.lineTo(X(u0 + 0.06), Y(0.42)); x.lineTo(X(u0 - 0.06), Y(0.54)); x.closePath(); x.fill(); }
      if (!fancy) { x.fillStyle = P0.color2; x.beginPath(); x.moveTo(X(0.94), Y(0.62)); x.lineTo(X(1.0), Y(0.55)); x.lineTo(X(1.0), Y(0.47)); x.lineTo(X(0.94), Y(0.54)); x.fill(); }
      // número grande en la nariz (se lee desde atrás) y en los costados de la cubierta del motor
      const num = (u, v, size, rot) => { x.save(); x.translate(X(u), Y(v)); x.rotate(rot); x.font = `400 ${size}px "Russo One", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = size * 0.14; x.strokeStyle = '#0a0a0c'; x.strokeText(n, 0, 0); x.fillStyle = '#ffffff'; x.fillText(n, 0, 0); x.restore(); };
      num(0.25, 0.84, 70, 0); num(0.06, 0.2, 64, Math.PI / 2); num(0.44, 0.2, 64, -Math.PI / 2);
      // logos inventados
      const logo = (txt, u, v, size, rot, col, bg) => { x.save(); x.translate(X(u), Y(v)); x.rotate(rot); x.font = `900 ${size}px "Nunito", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; const w = x.measureText(txt).width; if (bg) { x.fillStyle = bg; x.fillRect(-w / 2 - 6, -size * 0.62, w + 12, size * 1.24); } x.fillStyle = col; x.fillText(txt, 0, 2); x.restore(); };
      logo('VÉRTIGO', 0.07, 0.42, 30, Math.PI / 2, '#fff', 'rgba(0,0,0,0.55)'); logo('VÉRTIGO', 0.43, 0.42, 30, -Math.PI / 2, '#fff', 'rgba(0,0,0,0.55)');
      logo('COPA ESMERALDA', 0.1, 0.78, 22, Math.PI / 2, P0.color2, null); logo('COPA ESMERALDA', 0.4, 0.78, 22, -Math.PI / 2, P0.color2, null);
      logo(P0.car.toUpperCase(), 0.25, 0.58, 26, 0, '#fff', null); logo('ESMERALDA', 0.25, 0.1, 22, 0, '#fff', null);
      // costura de paneles
      x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 2; for (const v of [0.3, 0.66]) { x.beginPath(); x.moveTo(0, Y(v)); x.lineTo(W, Y(v)); x.stroke(); }
    }, false);
    const pod = GFX.canvasTex(512, 256, (x, w, h) => {
      if (fancy) paintMat(x, w, h, L); else if (L.carbon) carbonFill(x, w, h); else { x.fillStyle = P0.color; x.fillRect(0, 0, w, h); } x.fillStyle = 'rgba(10,12,16,0.85)'; x.fillRect(w * 0.6, 0, w * 0.3, h);
      if (!fancy) { x.fillStyle = P0.color2; x.beginPath(); x.moveTo(0, h * 0.25); x.lineTo(w, h * 0.1); x.lineTo(w, h * 0.32); x.lineTo(0, h * 0.5); x.fill(); }
      x.fillStyle = P0.accent; x.fillRect(0, h * 0.52, w, 6);
      x.font = '900 38px "Nunito", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.save(); x.translate(w * 0.06, h * 0.7); x.rotate(Math.PI / 2); x.fillText(P0.name.toUpperCase(), 0, 0); x.restore(); x.save(); x.translate(w * 0.44, h * 0.7); x.rotate(-Math.PI / 2); x.fillText(P0.name.toUpperCase(), 0, 0); x.restore();
    }, false);
    for (const t of [body, pod]) t.anisotropy = 8;
    return (liveryCache[ck] = { body, pod });
  }
  // sk = { paint, neon, turbo } del garaje (los bólidos de la máquina van de fábrica)
  function build(pid, playerIdx, sk) {
    texes(); sharedTex();
    const LK = lookOf(pid, sk && sk.paint), P0 = Object.assign({}, PILOTS[pid], { color: LK.color, color2: LK.color2, accent: LK.accent }), root = new THREE.Group(), pivot = new THREE.Group(), body = new THREE.Group(), lv = livery(pid, LK), lo = GQ.lv < 2, M = lo ? 22 : 32;
    pivot.position.y = 0.62; body.position.y = -0.62; root.add(pivot); pivot.add(body); // piruetas alrededor del centro del bólido
    const Mat = lo ? THREE.MeshStandardMaterial : THREE.MeshPhysicalMaterial, gloss = lo ? { envMapIntensity: 0.5 } : { clearcoat: 0.8, clearcoatRoughness: 0.08, envMapIntensity: 0.5 };
    const paint = new Mat(Object.assign({ map: lv.body, emissiveMap: lv.body, emissive: '#000000', metalness: 0.02, roughness: 0.42 }, gloss)), pod = new Mat(Object.assign({ map: lv.pod, emissiveMap: lv.pod, emissive: '#000000', metalness: 0.02, roughness: 0.42 }, gloss));
    const paintF = new Mat(Object.assign({ color: P0.color, metalness: 0.02, roughness: 0.42 }, gloss)), paint2 = new Mat(Object.assign({ color: P0.color2, metalness: 0.02, roughness: 0.4 }, gloss));
    const carbon = new THREE.MeshStandardMaterial({ map: carbonTex, metalness: 0.35, roughness: 0.42 }), black = new THREE.MeshStandardMaterial({ color: '#0b0c0e', roughness: 0.7 });
    const metal = new THREE.MeshStandardMaterial({ color: '#b8bcc4', metalness: 1, roughness: 0.25 }), visorM = new THREE.MeshStandardMaterial({ color: '#0a0a0e', metalness: 1, roughness: 0.05 });
    const glowM = new THREE.MeshBasicMaterial({ color: P0.accent }), redM = new THREE.MeshBasicMaterial({ color: '#ff1e2e' });
    const add = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); body.add(m); return m; };
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    // monocasco + cubierta del motor + nariz
    add(loftUV([
      { z: -2.32, hw: 0.15, y0: 0.42, y1: 0.62, e: 2.4 }, { z: -2.0, hw: 0.22, y0: 0.36, y1: 0.74, e: 2.6 }, { z: -1.6, hw: 0.3, y0: 0.3, y1: 0.92, e: 2.8 },
      { z: -1.15, hw: 0.37, y0: 0.26, y1: 1.05, e: 2.8 }, { z: -0.8, hw: 0.41, y0: 0.24, y1: 1.17, e: 2.6 }, { z: -0.55, hw: 0.44, y0: 0.22, y1: 0.99, e: 2.6 },
      { z: -0.1, hw: 0.43, y0: 0.22, y1: 0.85, e: 2.8 }, { z: 0.35, hw: 0.4, y0: 0.22, y1: 0.81, e: 2.8 }, { z: 0.85, hw: 0.3, y0: 0.24, y1: 0.71, e: 2.6 },
      { z: 1.4, hw: 0.2, y0: 0.25, y1: 0.58, e: 2.4 }, { z: 2.0, hw: 0.13, y0: 0.22, y1: 0.46, e: 2.3 }, { z: 2.45, hw: 0.09, y0: 0.2, y1: 0.36, e: 2.2 }, { z: 2.64, hw: 0.04, y0: 0.23, y1: 0.3, e: 2 },
    ], M), paint);
    // pontones con socavado (más angostos abajo) y tomas de aire
    for (const sx of [-1, 1]) {
      add(loftUV([{ x: sx * 0.4, z: -1.45, hw: 0.1, y0: 0.27, y1: 0.45, e: 2.4, under: 0.6 }, { x: sx * 0.58, z: -0.95, hw: 0.2, y0: 0.22, y1: 0.56, e: 2.8, under: 0.55 }, { x: sx * 0.7, z: -0.3, hw: 0.27, y0: 0.2, y1: 0.66, e: 3, under: 0.5 }, { x: sx * 0.72, z: 0.3, hw: 0.27, y0: 0.2, y1: 0.67, e: 3, under: 0.5 }, { x: sx * 0.69, z: 0.56, hw: 0.22, y0: 0.24, y1: 0.62, e: 3, under: 0.6 }], lo ? 14 : 20), pod);
      const inlet = add(new THREE.PlaneGeometry(0.34, 0.3), black, sx * 0.7, 0.45, 0.575);
      add(new THREE.BoxGeometry(0.04, 0.24, 0.3), carbon, sx * 0.95, 0.33, 0.62); // aleta de flujo delante del pontón
    }
    // piso, bordes y difusor
    { const sh = new THREE.Shape(); sh.moveTo(-0.62, 1.05); sh.lineTo(0.62, 1.05); sh.lineTo(0.9, 0.7); sh.lineTo(0.92, -1.75); sh.lineTo(0.6, -2.0); sh.lineTo(-0.6, -2.0); sh.lineTo(-0.92, -1.75); sh.lineTo(-0.9, 0.7); sh.closePath();
      const fg = new THREE.ExtrudeGeometry(sh, { depth: 0.035, bevelEnabled: false }); fg.rotateX(Math.PI / 2); add(fg, carbon, 0, 0.17, 0);
      for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.025, 0.07, 2.6), carbon, sx * 0.91, 0.16, -0.5);
      for (let k = 0; k < 3; k++) { const pl = add(new THREE.BoxGeometry(1.2 - k * 0.16, 0.02, 0.56), carbon, 0, 0.2 + k * 0.03, -2.25); pl.rotation.x = -0.32 - k * 0.04; }
      for (const sx of [-0.55, -0.2, 0.2, 0.55]) { const st = add(new THREE.BoxGeometry(0.02, 0.2, 0.55), carbon, sx, 0.26, -2.24); st.rotation.x = -0.32; } }
    // alerón trasero (plano principal + flap con DRS), placas con la marca del jugador, viga inferior y cuello de cisne
    add(foil(1.62, 0.36, 0.035, 0.03), carbon, 0, 1.0, -2.24).rotation.x = 0.1;
    add(foil(1.62, 0.22, 0.025, 0.02), paint2, 0, 1.12, -2.44).rotation.x = 0.5;
    for (const sx of [-1, 1]) { const ep = new THREE.Shape(); ep.moveTo(-0.38, 0.3); ep.lineTo(0.28, 0.3); ep.lineTo(0.3, -0.2); ep.lineTo(0.1, -0.42); ep.lineTo(-0.36, -0.42); ep.closePath(); const eg = new THREE.ExtrudeGeometry(ep, { depth: 0.03, bevelEnabled: false }); eg.rotateY(Math.PI / 2); add(eg, paintF, sx * 0.83, 0.9, -2.3);
      const tag = add(new THREE.BoxGeometry(0.04, 0.05, 0.62), playerIdx != null ? new THREE.MeshBasicMaterial({ color: PLAYER_COLORS[playerIdx].main }) : paint2, sx * 0.83, 1.21, -2.32); }
    add(foil(1.0, 0.16, 0.02, 0.015), carbon, 0, 0.58, -2.34).rotation.x = 0.15;
    for (const sx of [-0.1, 0.1]) add(strut(V(sx, 0.78, -2.05), V(sx, 1.03, -2.2), 0.018), carbon);
    // alerón delantero de tres planos con placas y sección central
    for (const sx of [-1, 1]) {
      for (const [y, z, ch, rot, mat] of [[0.13, 2.4, 0.38, -0.05, carbon], [0.19, 2.25, 0.26, 0.25, carbon], [0.26, 2.12, 0.2, 0.5, paint2]]) { const f = add(foil(0.86, ch, 0.025, 0.02), mat, sx * 0.56, y, z); f.rotation.x = rot; f.rotation.z = sx * 0.06; }
      const ep = new THREE.Shape(); ep.moveTo(-0.32, 0); ep.lineTo(0.3, 0); ep.lineTo(0.22, 0.26); ep.lineTo(-0.3, 0.22); ep.closePath(); const eg = new THREE.ExtrudeGeometry(ep, { depth: 0.025, bevelEnabled: false }); eg.rotateY(Math.PI / 2); add(eg, paintF, sx * 0.99, 0.08, 2.28);
    }
    add(new THREE.BoxGeometry(0.3, 0.025, 0.4), carbon, 0, 0.12, 2.4); for (const sx of [-0.07, 0.07]) add(strut(V(sx, 0.14, 2.32), V(sx, 0.3, 2.1), 0.015), carbon);
    // cabina: hueco oscuro, piloto con casco y visera, halo y retrovisores
    const hole = add(new THREE.SphereGeometry(0.5, 16, 8, 0, TAU, 0, Math.PI / 2), black, 0, 0.8, -0.1); hole.scale.set(0.62, 0.12, 1.0);
    const hel = add(new THREE.SphereGeometry(0.21, 18, 14), paint2, 0, 0.98, -0.32); const vis = add(new THREE.SphereGeometry(0.215, 14, 8, -0.95, 1.9, 1.15, 0.55), visorM, 0, 0.985, -0.32);
    const halo = new THREE.TorusGeometry(0.36, 0.035, 8, 20, Math.PI); halo.rotateX(Math.PI / 2); add(halo, carbon, 0, 1.0, -0.22); add(strut(V(0, 1.0, 0.14), V(0, 0.8, 0.5), 0.035), carbon);
    for (const sx of [-1, 1]) { add(strut(V(sx * 0.36, 0.83, 0.25), V(sx * 0.5, 0.92, 0.22), 0.012), carbon); add(new THREE.BoxGeometry(0.15, 0.08, 0.04), paintF, sx * 0.55, 0.93, 0.22); add(new THREE.PlaneGeometry(0.12, 0.05), visorM, sx * 0.55, 0.93, 0.199).rotation.y = Math.PI; }
    // toma de aire sobre la cabeza, cámara superior y escape central
    add(new THREE.CircleGeometry(0.11, 14), black, 0, 1.08, -0.6).scale.set(1, 1.3, 1);
    add(new THREE.BoxGeometry(0.2, 0.05, 0.08), playerIdx != null ? new THREE.MeshBasicMaterial({ color: PLAYER_COLORS[playerIdx].main }) : black, 0, 1.2, -0.72);
    const ex = add(new THREE.CylinderGeometry(0.075, 0.09, 0.3, 14, 1, true), metal, 0, 0.64, -2.36); ex.rotation.x = Math.PI / 2;
    const exIn = add(new THREE.CircleGeometry(0.07, 14), glowM, 0, 0.64, -2.5); exIn.rotation.y = Math.PI;
    for (const sx of [-0.12, 0.12]) { const wg = add(new THREE.CylinderGeometry(0.03, 0.035, 0.18, 8, 1, true), metal, sx, 0.72, -2.32); wg.rotation.x = Math.PI / 2; }
    // suspensión (brazos dobles y varillas)
    for (const sx of [-1, 1]) { for (const [zw, zb0, zb1, xh] of [[1.75, 1.55, 1.95, 0.84], [-1.65, -1.85, -1.42, 0.82]]) { for (const y of [0.3, 0.46]) { add(strut(V(sx * 0.2, y, zb0), V(sx * xh, y + 0.02, zw), 0.016), black); add(strut(V(sx * 0.2, y, zb1), V(sx * xh, y + 0.02, zw), 0.016), black); } add(strut(V(sx * xh, 0.32, zw), V(sx * 0.25, 0.62, zw + 0.05), 0.014), black); } }
    // núcleo esmeralda incrustado en el lomo
    const core = add(new THREE.OctahedronGeometry(0.15, 0), new THREE.MeshStandardMaterial({ color: '#19e68c', emissive: '#19e68c', emissiveIntensity: 1, roughness: 0.2 }), 0, 1.03, -1.32); core.scale.set(1, 1.5, 1.2);
    const coreGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GFX.glowTex(), color: '#3dffa8', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); coreGlow.scale.set(1.2, 1.2, 1); coreGlow.position.copy(core.position); body.add(coreGlow);
    // luz de lluvia y luces traseras
    const rain = add(new THREE.BoxGeometry(0.14, 0.1, 0.03), new THREE.MeshBasicMaterial({ color: '#ff2030' }), 0, 0.38, -2.47);
    const rainGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GFX.glowTex(), color: '#ff2a2a', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); rainGlow.scale.set(0.9, 0.9, 1); rainGlow.position.set(0, 0.38, -2.5); body.add(rainGlow);
    for (const sx of [-0.83, 0.83]) add(new THREE.BoxGeometry(0.035, 0.18, 0.03), redM, sx, 0.98, -2.62);
    // llamas del turbo saliendo del escape
    const flames = []; { const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 1.8), new THREE.MeshBasicMaterial({ map: flameTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); fl.geometry.translate(0, -0.9, 0); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0.64, -2.52); body.add(fl); const fl2 = fl.clone(); fl2.rotation.set(-Math.PI / 2, 0, Math.PI / 2); body.add(fl2); flames.push(fl, fl2); }
    // ruedas: una malla por rueda (costado con rin pintado + banda) en un solo material
    const wheels = [], tireM = new THREE.MeshStandardMaterial({ map: tireTex, roughness: 0.8, metalness: 0.1 });
    for (const [wx, wz, wr, ww] of [[-1.0, 1.75, 0.4, 0.34], [1.0, 1.75, 0.4, 0.34], [-0.98, -1.65, 0.42, 0.44], [0.98, -1.65, 0.42, 0.44]]) {
      const hub = new THREE.Group(); hub.position.set(wx, wr, wz); const spin = new THREE.Group(); hub.add(spin);
      const tg = new THREE.CylinderGeometry(wr, wr, ww, lo ? 22 : 30, 1); const uv = tg.attributes.uv, gr = tg.groups;
      const done = new Set(); for (const g of gr) for (let i = g.start; i < g.start + g.count; i++) { const vi = tg.index.getX(i); if (done.has(vi)) continue; done.add(vi); if (g.materialIndex === 0) uv.setX(vi, 0.5 + uv.getX(vi) * 0.5); else uv.setX(vi, uv.getX(vi) * 0.5); }
      tg.clearGroups(); tg.rotateZ(Math.PI / 2); const tm = new THREE.Mesh(tg, tireM); tm.castShadow = true; spin.add(tm);
      // tuerca y aro de luz del color de acento
      const ring = new THREE.Mesh(new THREE.TorusGeometry(wr * 0.74, 0.022, 6, 24), glowM); ring.rotation.y = Math.PI / 2; ring.position.x = Math.sign(wx) * (ww / 2 + 0.012); hub.add(ring);
      body.add(hub); wheels.push({ hub, spin, front: wz > 0, r: wr });
    }
    // luz bajo el chasis y sombra suave de contacto
    const under = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 4.8), new THREE.MeshBasicMaterial({ map: GFX.glowTex(), color: P0.accent, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })); under.rotation.x = -Math.PI / 2; under.position.y = 0.08; root.add(under);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 5.4), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.05; shadow.renderOrder = 1;
    const shadowRoot = new THREE.Group(); shadowRoot.add(shadow);
    // unir piezas fijas por material
    mergeStatic(body, new Set([core, rain, ...flames]));
    // ALA: dos alas en flecha que salen de los pontones (se despliegan en el tramo de vuelo)
    const wingsL = [], tipM = new THREE.MeshBasicMaterial({ color: P0.accent });
    for (const sx of [-1, 1]) {
      const wg = new THREE.Group(); wg.position.set(sx * 0.92, 0.55, -0.15); body.add(wg);
      const sh = new THREE.Shape(); sh.moveTo(0, 0.55); sh.lineTo(2.3, -0.55); sh.lineTo(2.35, -1.05); sh.lineTo(0, -1.0); sh.closePath();
      const ge = new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: false }); ge.rotateX(Math.PI / 2); if (sx < 0) ge.scale(-1, 1, 1);
      wg.add(new THREE.Mesh(ge, paint2)); const tip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.55), tipM); tip.position.set(sx * 2.32, 0, -0.78); wg.add(tip);
      wg.scale.set(0.001, 1, 1); wg.visible = false; wingsL.push(wg);
    }
    // LANCHA: flotadores laterales que bajan y las ruedas se acuestan como discos
    const floatsL = [];
    for (const sx of [-1, 1]) { const fl = new THREE.Mesh(loftUV([{ z: -1.9, hw: 0.12, y0: -0.12, y1: 0.12, e: 2 }, { z: -1.4, hw: 0.26, y0: -0.24, y1: 0.24, e: 2.4 }, { z: 1.3, hw: 0.28, y0: -0.26, y1: 0.26, e: 2.4 }, { z: 2.1, hw: 0.12, y0: -0.1, y1: 0.12, e: 2 }], 14), paint2); fl.position.set(sx * 1.3, 0.34, 0); fl.scale.set(0.001, 0.001, 0.001); fl.visible = false; body.add(fl); floatsL.push(fl); }
    // faros (se encienden de noche)
    const lamps = []; for (const sx of [-0.3, 0.3]) { const l = new THREE.Sprite(new THREE.SpriteMaterial({ map: GFX.glowTex(), color: '#fff4dc', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); l.scale.set(1.3, 1.3, 1); l.position.set(sx, 0.36, 2.5); l.visible = false; body.add(l); lamps.push(l); }
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(5, 14), new THREE.MeshBasicMaterial({ map: GFX.glowTex(), color: '#fff0c8', transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })); beam.rotation.x = -Math.PI / 2; beam.position.set(0, 0.07, 8.5); beam.visible = false; root.add(beam); lamps.push(beam);
    GFX.linearize(root);
    const m = { root, pivot, body, wheels, flames, core, coreGlow, rain, rainGlow, under, shadow: shadowRoot, spin: 0, wings: wingsL, floats: floatsL, wingK: 0, boatK: 0, lamps, mats: { paint, pod, paintF, paint2, glowM, tipM } };
    skin(m, pid, sk);
    return m;
  }
  // vestir un bólido ya armado (el garaje cambia de pintura sin rearmarlo)
  const lin = (c, hex) => c.set(hex).convertSRGBToLinear();
  function skin(m, pid, sk) {
    sk = sk || {}; const L = lookOf(pid, sk.paint), lv = livery(pid, L), M = m.mats, hi = GQ.lv >= 2;
    M.paint.map = lv.body; M.paint.emissiveMap = lv.body; M.pod.map = lv.pod; M.pod.emissiveMap = lv.pod;
    for (const mt of [M.paint, M.pod]) { mt.metalness = L.metal != null ? L.metal : 0.02; mt.roughness = L.rough != null ? L.rough : 0.42; lin(mt.emissive, L.emis ? '#ffffff' : '#000000'); mt.emissiveIntensity = L.emis || 0; lin(mt.color, '#ffffff'); if (hi && mt.clearcoat != null) mt.clearcoat = L.metal > 0.5 ? 0.4 : 0.8; }
    lin(M.paintF.color, L.color); lin(M.paint2.color, L.color2);
    const nk = sk.neon && CAR_NEONS[sk.neon] ? sk.neon : 'piloto', nc = CAR_NEONS[nk] || L.accent;
    for (const mt of [M.glowM, M.tipM, m.under.material]) lin(mt.color, nc);
    const tk = sk.turbo && CAR_TURBOS[sk.turbo] ? sk.turbo : 'azul'; for (const f of m.flames) f.material.map = flameTexOf(tk);
    m.look = L; m.neon = nk; m.turbo = tk; m.neonK = nk === 'piloto' ? 1 : 1.35;
    return m;
  }
  // brillos que se mueven: neón de fuego o arcoíris, pintura holográfica y magma que late
  const _hc = new THREE.Color();
  function skinFx(m, t) {
    if (!m.mats) return;
    if (m.neon === 'arcoiris') { _hc.setHSL((t * 0.25) % 1, 1, 0.55); for (const mt of [m.mats.glowM, m.mats.tipM, m.under.material]) mt.color.copy(_hc); }
    else if (m.neon === 'fuego') { const f = 0.5 + 0.5 * Math.sin(t * 13) * Math.sin(t * 7.3); _hc.setRGB(1, 0.12 + 0.3 * f, 0.02); for (const mt of [m.mats.glowM, m.mats.tipM, m.under.material]) mt.color.copy(_hc); }
    const L = m.look; if (!L) return;
    if (L.holo) { _hc.setHSL((t * 0.12) % 1, 0.7, 0.82); m.mats.paint.color.copy(_hc); m.mats.pod.color.copy(_hc); }
    if (L.pulse) { const k = L.emis * (0.65 + 0.35 * Math.sin(t * 2.6)); m.mats.paint.emissiveIntensity = k; m.mats.pod.emissiveIntensity = k; }
  }
  const baseQ = new THREE.Quaternion();
  // ubicar el bólido según su estado (llamado cada cuadro de dibujo)
  function pose(m, car, T, t, dt) {
    m.root.visible = !car.out; m.shadow.visible = !car.out; if (car.out) return; // fuera de combate: desaparece
    const o = T.at(car.s);
    // base: marco de la pista (izquierda, arriba, adelante = mano derecha)
    X.set(-o.rx, -o.ry, -o.rz); Y.set(o.ux, o.uy, o.uz); Z.set(o.tx, o.ty, o.tz);
    tmpM.makeBasis(X, Y, Z); baseQ.setFromRotationMatrix(tmpM);
    // rumbo (a>0 = hacia la derecha), inclinación lateral y cabeceo
    qa.setFromAxisAngle(Y.set(0, 1, 0), -car.a); baseQ.multiply(qa); tmpQ.copy(baseQ);
    qa.setFromAxisAngle(Z.set(0, 0, 1), car.roll); tmpQ.multiply(qa);
    qa.setFromAxisAngle(X.set(1, 0, 0), car.pitch); tmpQ.multiply(qa);
    T.pos(car.s, car.u, car.h, P); m.root.position.copy(P); m.root.quaternion.copy(tmpQ);
    // piruetas, brinco del derrape, tambaleo y trompo
    const tr = car.trick, pv = m.pivot;
    pv.position.set(0, 0.62, 0); pv.quaternion.identity();
    if (tr) { const f = clamp(tr.t / tr.dur, 0, 1), ang = smooth(f) * TAU; pv.position.y += 0.5 * Math.sin(f * Math.PI);
      if (tr.kind === 'flip') pv.quaternion.setFromAxisAngle(X.set(1, 0, 0), ang); else if (tr.kind === 'back') pv.quaternion.setFromAxisAngle(X.set(1, 0, 0), -ang);
      else if (tr.kind === 'rollL') pv.quaternion.setFromAxisAngle(Z.set(0, 0, 1), -ang); else if (tr.kind === 'rollR') pv.quaternion.setFromAxisAngle(Z.set(0, 0, 1), ang);
      else pv.quaternion.setFromAxisAngle(Y.set(0, 1, 0), -ang); }
    if (car.hopT > 0) pv.position.y += Math.sin((1 - car.hopT / 0.16) * Math.PI) * 0.35;
    if (car.wobT > 0) { qa.setFromAxisAngle(Z.set(0, 0, 1), Math.sin(t * 40) * 0.12 * Math.min(1, car.wobT)); pv.quaternion.multiply(qa); }
    if (car.spinT > 0) { qa.setFromAxisAngle(Y.set(0, 1, 0), t * 14); pv.quaternion.multiply(qa); }
    // derrape: la cola sale hacia afuera (ángulo visual extra)
    m.slip = damp(m.slip || 0, car.drift.on ? car.drift.dir * 0.14 : 0, 8, dt);
    qa.setFromAxisAngle(Y.set(0, 1, 0), -m.slip); pv.quaternion.premultiply(qa);
    for (const l of m.lamps) l.visible = GFX.W.night && car.respawnT <= 0;
    // transformación: ala en el aire, lancha en el agua
    m.wingK = damp(m.wingK, car.mode === 'air' ? 1 : 0, 7, dt); m.boatK = damp(m.boatK, car.mode === 'water' ? 1 : 0, 8, dt);
    for (const w of m.wings) { w.visible = m.wingK > 0.02; w.scale.set(Math.max(0.001, m.wingK), 1, 1); }
    for (const fl of m.floats) { fl.visible = m.boatK > 0.02; const k = Math.max(0.001, m.boatK); fl.scale.set(k, k, 1); }
    // ruedas: giro y dirección
    m.spin += car.f * dt / 0.46;
    for (const w of m.wheels) { w.spin.rotation.x = m.spin; w.hub.rotation.y = w.front ? (car.drift.on ? -car.drift.dir * 0.25 : -car.steerS * 0.42) * (1 - m.boatK) : 0; w.hub.rotation.z = Math.sign(w.hub.position.x) * (m.boatK + m.wingK * 0.6) * Math.PI / 2; }
    // llamas del turbo
    const b = car.boostT > 0 ? 1 : 0, fl = b ? 1 + 0.35 * Math.sin(t * 60) + (car.boostK > 1 ? 0.5 : 0) : car.f > 2 ? 0.25 : 0;
    for (const f of m.flames) { f.visible = fl > 0.05; f.scale.set(1, fl * (0.8 + Math.random() * 0.3), 1); }
    // núcleo esmeralda según la barra
    const g = car.gem / 4; m.core.material.emissiveIntensity = 0.4 + g * 1.8 + (car.gem >= 4 ? Math.sin(t * 10) * 0.6 : 0); m.coreGlow.scale.setScalar(1 + g * 2.2); m.coreGlow.material.opacity = 0.35 + g * 0.6;
    m.core.rotation.y = t * 3;
    const rl = (Math.sin(t * 9) > 0 ? 1 : 0.15) * (b || car.mode !== 'road' ? 1 : 0.6); m.rainGlow.material.opacity = rl; m.rain.material.color.setRGB(rl, 0.05 * rl, 0.08 * rl);
    m.under.material.opacity = (0.35 + 0.15 * Math.sin(t * 3) + (b ? 0.3 : 0)) * (m.neonK || 1); skinFx(m, t);
    // sombra en el suelo (no salta con el bólido)
    const gh = T.rampH(car.s, car.u);
    T.pos(car.s, car.u, gh + 0.06, P); m.shadow.position.copy(P); m.shadow.quaternion.copy(baseQ);
    const hh = Math.max(0, car.h - gh); m.shadow.children[0].material.opacity = clamp(1 - hh / 6, 0, 1) * 0.55; m.shadow.scale.setScalar(1 + hh * 0.04);
    m.shadow.visible = !T.zone(car.s, 'gap') && car.respawnT <= 0; m.root.visible = car.respawnT <= 0;
  }
  return { build, pose, skin, skinFx, lookOf };
})();
