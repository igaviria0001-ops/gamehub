/* =========================================================================
   ARTE DE LOS MAGOS (3.ª versión, «hechicero oscuro») — figuras altas e
   imponentes: capucha honda con el rostro en sombra y los ojos encendidos,
   manto sobre los hombros con broche de oro, túnica larga con banda bordada
   y cinturón con medallón, mangas acampanadas con forro de color, y una capa
   grande de bordes rasgados que se mueve con física. La luz de los orbes de
   las manos pinta la tela; luz de luna en el borde.
   Cada mago conserva su seña: sombrero (Candela), juncos (Yuma), roseta de
   frailejón, corona de obsidiana (Puracé), corona de flores (Iguaque) y
   capucha alta con relámpagos (Catatumbo).
   ========================================================================= */
const ArtMage = (() => {
  const OL = 'rgba(12,6,22,0.72)';
  const hx2 = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const shade = (h, k) => { const c = hx2(h); return `rgb(${c.map(v => Math.round(clamp(k > 0 ? v + (255 - v) * k : v * (1 + k), 0, 255))).join(',')})`; };
  const rgbaOf = (h, a) => { const c = hx2(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
  const L = {
    candela: { robe: '#9a2a1a', robe2: '#3a0c08', trim: '#f2b844', lining: '#ff9a3a', panel: '#2a0a06', skin: '#a86c48', eye: '#ffb347', cape: '#b0341e', cape2: '#2a0806', scale: 1.0, build: 1, head: 'sombrero', peak: 10, pect: 'sun', motif: 'sun', aura: 'ember' },
    yuma: { robe: '#1d5580', robe2: '#081a30', trim: '#9ff0ff', lining: '#3ec8e8', panel: '#0a2238', skin: '#9a6644', eye: '#8ff8ff', cape: '#1f6088', cape2: '#061226', scale: 1.0, build: 1, head: 'reeds', peak: 15, pect: 'fish', motif: 'waves', aura: 'drop' },
    frailejon: { robe: '#4e6838', robe2: '#16200e', trim: '#dcd6a2', lining: '#a8c070', panel: '#22301a', skin: '#8e8a7c', eye: '#c8ff7a', cape: '#5a7440', cape2: '#121c0c', scale: 1.1, build: 1.3, head: 'rosette', peak: 13, pect: 'leaf', motif: 'moss', aura: 'leaf' },
    purace: { robe: '#2e2228', robe2: '#0a0608', trim: '#ff7a2a', lining: '#ff5a1a', panel: '#140c0e', skin: '#8a5a44', eye: '#ffb04a', cape: '#2c2026', cape2: '#060404', scale: 1.04, build: 1.1, head: 'spikes', peak: 12, pect: 'volcano', motif: 'cracks', aura: 'ash' },
    iguaque: { robe: '#d6e6e0', robe2: '#4e7c74', trim: '#e8c860', lining: '#2fa8a0', panel: '#2a6a62', skin: '#b07a52', eye: '#9ffff0', cape: '#9ed2c6', cape2: '#1e4842', scale: 1.0, build: 0.95, head: 'flowers', peak: 13, pect: 'moon', motif: 'flowers', aura: 'petal' },
    catatumbo: { robe: '#4c3a7c', robe2: '#140e2a', trim: '#dcbc64', lining: '#e8782e', panel: '#22183e', skin: '#5a6a8a', eye: '#ff8a5a', cape: '#3e2e68', cape2: '#0c081c', scale: 1.04, build: 1, head: 'hood', peak: 22, pect: 'bolt', motif: 'bolts', aura: 'spark', float: true },
    cocuy: { robe: '#d4e6f0', robe2: '#4e7c9c', trim: '#ffffff', lining: '#4cc4ff', panel: '#3a6888', skin: '#b8c4d0', eye: '#bff6ff', cape: '#eaf6fc', cape2: '#628cac', scale: 1.02, build: 1.04, head: 'ice', peak: 14, pect: 'star', motif: 'stars', aura: 'snow' },
    tatacoa: { robe: '#b4623a', robe2: '#481c0a', trim: '#f0dca0', lining: '#e8a44a', panel: '#562810', skin: '#9a6644', eye: '#ffe07a', cape: '#cc9258', cape2: '#582c10', scale: 1.05, build: 1.15, head: 'wrap', peak: 11, pect: 'sun', motif: 'moss', aura: 'dust' },
    galeras: { robe: '#3c2644', robe2: '#0e0612', trim: '#ffb04a', lining: '#b98aff', panel: '#1e1024', skin: '#7a5a54', eye: '#ffd27a', cape: '#4c2e52', cape2: '#100614', scale: 1.0, build: 1.0, head: 'horns', peak: 13, pect: 'bolt', motif: 'cracks', aura: 'spark' },
    // 2.0 — Luz y Sombra
    zuhe: { robe: '#c8902a', robe2: '#5a2c08', trim: '#fff2b0', lining: '#ff7a2a', panel: '#7a2410', skin: '#b07a4a', eye: '#fff6c0', cape: '#e2b24c', cape2: '#6a3a0c', scale: 1.02, build: 1.05, head: 'sunhalo', peak: 12, pect: 'sun', motif: 'sun', aura: 'glint' },
    chia: { robe: '#2a3464', robe2: '#090b20', trim: '#e2e8ff', lining: '#8a5cff', panel: '#141a3e', skin: '#a8a0b8', eye: '#eaf2ff', cape: '#aab6de', cape2: '#353d6c', scale: 1.0, build: 0.92, head: 'crescent', peak: 17, pect: 'star', motif: 'stars', aura: 'stardust' },
    mapale: { robe: '#1e1524', robe2: '#060408', trim: '#e8485e', lining: '#c443a6', panel: '#2e0c1a', skin: '#5a3a2e', eye: '#ff5a7a', cape: '#271c30', cape2: '#08040c', scale: 0.98, build: 0.9, head: 'feathers', peak: 15, pect: 'leaf', motif: 'moss', aura: 'shade' },
    tota: { robe: '#12393e', robe2: '#041214', trim: '#7af0d0', lining: '#c443a6', panel: '#0a2428', skin: '#7a9a94', eye: '#9affe0', cape: '#17484c', cape2: '#04100f', scale: 1.05, build: 1.12, head: 'kelp', peak: 13, pect: 'fish', motif: 'waves', aura: 'shade' },
  };
  // atuendos: se ganan venciendo duelos con cada mago (2 y 6 victorias)
  const SKINS = {
    candela: [{ name: 'Llanera' }, { name: 'Brasa negra', robe: '#3a2c30', robe2: '#0e080a', cape: '#4a3236', cape2: '#0a0506', trim: '#ff9a3a', panel: '#1a0e0c', lining: '#ff5a1a', eye: '#ff7a2a' }, { name: 'Sol de los venados', robe: '#d8b048', robe2: '#6a4410', cape: '#f0d070', cape2: '#7a5010', trim: '#fff6d0', panel: '#8a2a14', lining: '#ff6a2a', eye: '#fff2b0' }],
    yuma: [{ name: 'Aprendiz' }, { name: 'Manto del Mohán', robe: '#2a4a2e', robe2: '#0a160c', cape: '#33563a', cape2: '#081008', trim: '#e8c860', panel: '#10220e', lining: '#7ad86a', eye: '#b8ff9a' }, { name: 'Aguacero', robe: '#9ab8d0', robe2: '#3a5a78', cape: '#c8dcec', cape2: '#4a6a88', trim: '#ffffff', panel: '#2a4a6a', lining: '#5ae0ff', eye: '#e8fbff' }],
    frailejon: [{ name: 'Pajonal' }, { name: 'Escarcha', robe: '#a8c0cc', robe2: '#3a5260', cape: '#c8dce4', cape2: '#40586a', trim: '#ffffff', panel: '#5a7484', lining: '#9ff0ff', eye: '#bff6ff' }, { name: 'Otoño', robe: '#8a4a22', robe2: '#2e1206', cape: '#a8602c', cape2: '#3a1606', trim: '#ffd27a', panel: '#4a1e08', lining: '#ffb04a', eye: '#ffe07a' }],
    purace: [{ name: 'Ceniza' }, { name: 'Azufre', robe: '#b8a02a', robe2: '#3a3008', cape: '#8a7a1a', cape2: '#2a2206', trim: '#1a1208', panel: '#5a4a0a', lining: '#ffe84a', eye: '#fff27a' }, { name: 'Obsidiana real', robe: '#2a1a3a', robe2: '#08040e', cape: '#3a2050', cape2: '#06020a', trim: '#ff4ad8', panel: '#14081e', lining: '#c84aff', eye: '#ff8af0' }],
    iguaque: [{ name: 'Laguna' }, { name: 'Bachué', robe: '#f0e2b8', robe2: '#9a7a3a', cape: '#e8c860', cape2: '#7a5a10', trim: '#2a8a5a', panel: '#1a6a4a', lining: '#3ad89a', eye: '#b8ffd8' }, { name: 'Laguna nocturna', robe: '#24305a', robe2: '#0a0e22', cape: '#2e3c6e', cape2: '#080a1a', trim: '#d8e4ff', panel: '#141c40', lining: '#8aa8ff', eye: '#d8e4ff' }],
    catatumbo: [{ name: 'Errante' }, { name: 'Relámpago blanco', robe: '#d8dcec', robe2: '#5a6080', cape: '#eef0f8', cape2: '#606890', trim: '#5ae0ff', panel: '#3a4266', lining: '#9ff0ff', eye: '#5ae0ff' }, { name: 'Tormenta roja', robe: '#7a1a24', robe2: '#1e0408', cape: '#8a2230', cape2: '#140206', trim: '#ffd36a', panel: '#2a060c', lining: '#ff8a3a', eye: '#ffd36a' }],
  };
  Object.assign(SKINS, {
    cocuy: [{ name: 'Nevado' }, { name: 'Glaciar azul', robe: '#2a5a8a', robe2: '#0a1e3a', cape: '#3a74a8', cape2: '#0c2444', trim: '#bff6ff', panel: '#12304e', lining: '#9ff0ff', eye: '#ffffff' }, { name: 'Aurora', robe: '#3a2a5e', robe2: '#120a26', cape: '#7ae0b0', cape2: '#1e5a4a', trim: '#e0ffe8', panel: '#221640', lining: '#7affc8', eye: '#c8ffe8' }],
    tatacoa: [{ name: 'Desierto rojo' }, { name: 'Desierto gris', robe: '#8a8478', robe2: '#3a362e', cape: '#b0aa9c', cape2: '#46423a', trim: '#fff6dc', panel: '#4a463c', lining: '#e8d8a0', eye: '#fff2b0' }, { name: 'Noche de estrellas', robe: '#1c2448', robe2: '#080a1a', cape: '#2a3468', cape2: '#0a0c20', trim: '#ffe9a0', panel: '#101630', lining: '#b9c4ff', eye: '#fff6c0' }],
    galeras: [{ name: 'Fragua' }, { name: 'Ceniza viva', robe: '#5a5458', robe2: '#1c181a', cape: '#787074', cape2: '#221e20', trim: '#ff6a2a', panel: '#2a2426', lining: '#ff8a3a', eye: '#ffb04a' }, { name: 'Tormenta blanca', robe: '#d8dcec', robe2: '#5a6288', cape: '#f0f2fc', cape2: '#6a72a0', trim: '#b98aff', panel: '#4a5280', lining: '#d9b0ff', eye: '#ffffff' }],
    zuhe: [{ name: 'Hijo del sol' }, { name: 'Ocaso', robe: '#8a2a2a', robe2: '#2a0808', cape: '#b0443a', cape2: '#3a0c0c', trim: '#ffd27a', panel: '#3a0c14', lining: '#ffb04a', eye: '#ffe07a' }, { name: 'Mediodía', robe: '#f0ead0', robe2: '#8a7a4a', cape: '#fff8e0', cape2: '#a08a50', trim: '#e8a42a', panel: '#b06a14', lining: '#ffd25a', eye: '#ffffff' }],
    chia: [{ name: 'Luna llena' }, { name: 'Luna nueva', robe: '#14141c', robe2: '#040408', cape: '#22222e', cape2: '#06060c', trim: '#9aa2c8', panel: '#0c0c14', lining: '#5a4a9a', eye: '#c8d0ff' }, { name: 'Luna de sangre', robe: '#5a1a22', robe2: '#1a0508', cape: '#c88a8a', cape2: '#5a2228', trim: '#ffd8c8', panel: '#2a0a10', lining: '#ff6a5a', eye: '#ffd0c0' }],
    mapale: [{ name: 'Danzante' }, { name: 'Guacamaya', robe: '#1a3a6a', robe2: '#06102a', cape: '#c8281e', cape2: '#4a0a08', trim: '#ffd23a', panel: '#0c2244', lining: '#ffd23a', eye: '#ffe07a' }, { name: 'Ceniza', robe: '#8a8690', robe2: '#3a363e', cape: '#b4b0ba', cape2: '#4a464e', trim: '#ffffff', panel: '#4e4a54', lining: '#c443a6', eye: '#ffffff' }],
    tota: [{ name: 'Lago hondo' }, { name: 'Totora', robe: '#5a5a2a', robe2: '#1c1c0a', cape: '#7a7a3a', cape2: '#22220c', trim: '#f0e6a0', panel: '#2e2e12', lining: '#9ad85a', eye: '#e8ff9a' }, { name: 'Escarcha del páramo', robe: '#9ab4c4', robe2: '#3a5262', cape: '#c4d8e2', cape2: '#44606e', trim: '#ffffff', panel: '#54707e', lining: '#9ff0ff', eye: '#d8fbff' }],
  });
  const SKIN_NEED = [0, 2, 6];
  /* atuendos para cualquier mago (se ganan en la campaña, el grimorio, los duelos…): cada uno trae su
     material (Vest.material) y, los más altos, su aura y su estela. El mago conserva su tocado y su seña. */
  const GAL = ['255,110,210', '170,100,255', '90,150,255'];
  const OUTFITS = {
    jaguar: { name: 'Manto de jaguar', look: { robe: '#3a2414', robe2: '#120804', panel: '#24140a', trim: '#f0c24a', lining: '#ff9a3a', eye: '#ffd27a', cape: '#c88a2a', cape2: '#5a3410' }, capeMat: 'jaguar', capeC: ['#d99a2a', '#ffd27a', '#2a1606', '#7a3e0a'] },
    caiman: { name: 'Escamas de caimán', look: { robe: '#2a5a3a', robe2: '#0a1e12', panel: '#123a22', trim: '#c8f0a0', lining: '#7ad86a', eye: '#d8ff7a', cape: '#1e3a26', cape2: '#081408' }, mat: 'escamas', matC: ['#2f8a5a', '#9be8b0', '#0e3a24'] },
    runico: { name: 'Vestidura rúnica', look: { robe: '#1a0e34', robe2: '#06020e', panel: '#120828', trim: '#d9b8ff', lining: '#a86bff', eye: '#e8d4ff', cape: '#160a2e', cape2: '#05020c' }, mat: 'runas', matC: ['#160a2e', '#c99aff', '200,150,255'], capeMat: 'runas', capeC: ['#120826', '#b98aff', '190,140,255'] },
    cristal: { name: 'Manto de cristal', look: { robe: '#cfe8f6', robe2: '#5a88a8', panel: '#8ab8d4', trim: '#ffffff', lining: '#7ae0ff', eye: '#e8fbff', cape: '#9fd8f0', cape2: '#2a5a7a' }, capeMat: 'cristal', capeC: ['#bfeeff', '#6ab8e8', '#f2fdff'] },
    aurora: { name: 'Aurora del páramo', look: { robe: '#0a1e2a', robe2: '#02080c', panel: '#06141e', trim: '#9affd8', lining: '#7affc8', eye: '#c8ffe8', cape: '#0a1a26', cape2: '#02060a' }, mat: 'aurora', matC: ['#06121e', '110,255,190', '170,110,255'], capeMat: 'aurora', capeC: ['#040e18', '110,255,190', '170,110,255'] },
    tormenta: { name: 'Ojo de la tormenta', look: { robe: '#2a3448', robe2: '#0a0e18', panel: '#141a28', trim: '#bfe4ff', lining: '#5ab8ff', eye: '#bfeaff', cape: '#1e2638', cape2: '#06080e' }, mat: 'tormenta', matC: ['#1a2234', '120,140,180'], capeMat: 'tormenta', capeC: ['#141a2a', '110,130,170'], aura2: 'rayos' },
    lava: { name: 'Manto de magma', look: { robe: '#2a0e08', robe2: '#0a0404', panel: '#1a0806', trim: '#ff9a3a', lining: '#ff5a1a', eye: '#ffb04a', cape: '#24100a', cape2: '#080302' }, mat: 'lava', matC: ['#2a0e08', '#0a0404'], capeMat: 'lava', capeC: ['#220c06', '#080302'], aura2: 'brasas', trail2: 'fuego' },
    oro: { name: 'Hilo de oro', look: { robe: '#e8b030', robe2: '#7a4a08', panel: '#8a2a14', trim: '#fff6d0', lining: '#ff6a2a', eye: '#fff2b0', cape: '#e0a028', cape2: '#6a3a08' }, mat: 'oro', matC: ['#e8b030', '#fff0a8', '#9a6410'], capeMat: 'oro', capeC: ['#d89a20', '#ffe68a', '#8a5408'], aura2: 'corona' },
    fatuo: { name: 'Fuego fatuo', look: { robe: '#061a3a', robe2: '#020814', panel: '#04102a', trim: '#9ff0ff', lining: '#4ab8ff', eye: '#bff6ff', cape: '#0a1a3a', cape2: '#020612' }, mat: 'llamas', matC: ['#061a3a', '#020814', '140,230,255', '40,90,255'], aura2: 'fuego_azul', trail2: 'hielo' },
    dragon: { name: 'Piel de dragón', look: { robe: '#1a6a54', robe2: '#062a20', panel: '#0a3a2e', trim: '#ffd36a', lining: '#ffb03a', eye: '#ffe07a', cape: '#145a46', cape2: '#04201a' }, mat: 'escamas', matC: ['#1f9a7a', '#a8ffe0', '#0a3a2e'], capeMat: 'escamas', capeC: ['#17806a', '#8ef0d0', '#062a22'], aura2: 'dragon' },
    galaxia: { name: 'Manto galáctico', look: { robe: '#120a2e', robe2: '#04020c', panel: '#0a0620', trim: '#ffd6f6', lining: '#ff6fd8', eye: '#ffffff', cape: '#1a0e40', cape2: '#05020e' }, mat: 'galaxia', matC: GAL, capeMat: 'galaxia', capeC: GAL, aura2: 'galaxia', trail2: 'cometa' },
    abismo: { name: 'Abismo', look: { robe: '#0c0414', robe2: '#000000', panel: '#08020e', trim: '#c88aff', lining: '#8a3aff', eye: '#ff5a9a', cape: '#0a0410', cape2: '#000000' }, mat: 'vacio', matC: ['#3a0a5a', '200,120,255'], capeMat: 'vacio', capeC: ['#2a0846', '180,100,255'], aura2: 'vacio', trail2: 'sombra' },
    prisma: { name: 'Prisma', look: { robe: '#dfe4f0', robe2: '#6a7490', panel: '#9aa4bc', trim: '#ffffff', lining: '#ff9be6', eye: '#ffffff', cape: '#cfd6e6', cape2: '#5a6480' }, mat: 'holo', matC: [], capeMat: 'holo', capeC: [], aura2: 'prisma', trail2: 'arcoiris' },
  };
  const OUTFIT_ORDER = Object.keys(OUTFITS);
  const looks = {};
  // el atuendo puede venir como número (los de antes: 0, 1, 2), como «mago.n» o como «u.clave» (para cualquier mago)
  function look(cid, skin = 0) {
    const k = cid + '|' + skin; if (looks[k]) return looks[k];
    let sk = {};
    if (typeof skin === 'number') sk = (SKINS[cid] || [])[skin] || {};
    else if (typeof skin === 'string' && skin.startsWith('u.')) { const O = OUTFITS[skin.slice(2)]; if (O) sk = Object.assign({ name: O.name }, O.look, { mat: O.mat || null, matC: O.matC, capeMat: O.capeMat || null, capeC: O.capeC, aura2: O.aura2 || null, trail2: O.trail2 || null }); }
    else if (typeof skin === 'string') { const n = +skin.split('.')[1] || 0; sk = (SKINS[cid] || [])[n] || {}; }
    return (looks[k] = Object.assign({}, L[cid], { mat: null, capeMat: null, aura2: null, trail2: null }, sk));
  }
  // material de la prenda (el que llama ya recortó con su forma)
  const matOn = (x, kind, c, bx, by, bw, bh, t) => { if (kind && typeof Vest !== 'undefined') Vest.material(x, kind, c || [], bx, by, bw, bh, t, 0.92, !LOWFX); };
  const EC = el => ELEMENTS[el] || ELEMENTS.wind;
  function fillOL(x, fill, lw = 1.1) { x.fillStyle = fill; x.fill(); x.strokeStyle = OL; x.lineWidth = lw; x.stroke(); }
  /* ---------- orbe de una mano ---------- */
  function orb(x, X, Y, el, r, hot, t = 0) {
    const E = EC(el);
    x.save(); x.globalCompositeOperation = 'lighter';
    const g = x.createRadialGradient(X, Y, 0, X, Y, r * 3.6); g.addColorStop(0, E.c1 + 'ee'); g.addColorStop(0.3, E.c1 + '66'); g.addColorStop(1, E.c1 + '00');
    x.fillStyle = g; x.beginPath(); x.arc(X, Y, r * 3.6, 0, TAU); x.fill();
    // filamentos de energía alrededor
    x.strokeStyle = E.c0; x.lineWidth = 1; x.globalAlpha = hot ? 0.9 : 0.55;
    for (let k = 0; k < (hot ? 4 : 2); k++) { const a = t * 6 + k * 1.7; x.beginPath(); x.moveTo(X + Math.cos(a) * r * 0.9, Y + Math.sin(a) * r * 0.9); x.quadraticCurveTo(X + Math.cos(a + 0.6) * r * 2.4, Y + Math.sin(a + 0.6) * r * 2.4, X + Math.cos(a + 1.2) * r * 1.6, Y + Math.sin(a + 1.2) * r * 1.6); x.stroke(); }
    for (let k = 0; k < 3; k++) { const a = t * 5 + k * 2.1, rr = r * 1.8; x.fillStyle = E.c0; x.globalAlpha = 0.85; x.beginPath(); x.arc(X + Math.cos(a) * rr, Y + Math.sin(a) * rr * 0.6, 1.1 + (hot ? 0.6 : 0), 0, TAU); x.fill(); }
    x.restore();
    const g2 = x.createRadialGradient(X - r * 0.3, Y - r * 0.35, r * 0.1, X, Y, r); g2.addColorStop(0, '#ffffff'); g2.addColorStop(0.35, E.c0); g2.addColorStop(0.7, E.c1); g2.addColorStop(1, E.c2);
    x.fillStyle = g2; x.beginPath(); x.arc(X, Y, r, 0, TAU); x.fill();
  }
  function runeRing(x, R, t, el, el2, full) {
    const E = EC(el), E2 = el2 ? EC(el2) : E;
    x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = full ? 1 : 0.65;
    x.strokeStyle = E.c1; x.lineWidth = 2.2; x.beginPath(); x.ellipse(0, 0, R, R * 0.42, 0, 0, TAU); x.stroke();
    x.strokeStyle = E2.c0; x.lineWidth = 1; x.beginPath(); x.ellipse(0, 0, R * 0.8, R * 0.34, 0, 0, TAU); x.stroke();
    x.font = fontB(7, 900); x.fillStyle = E.c0; x.textAlign = 'center'; x.textBaseline = 'middle';
    const G = '◇△○◁▽▷◆'; for (let k = 0; k < 10; k++) { const a = t * (full ? 2.6 : 1.3) + k / 10 * TAU; x.fillText(G[k % G.length], Math.cos(a) * R * 0.9, Math.sin(a) * R * 0.38); }
    if (full) { const g = x.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, E.c1 + '44'); g.addColorStop(1, E.c1 + '00'); x.fillStyle = g; x.beginPath(); x.ellipse(0, 0, R, R * 0.42, 0, 0, TAU); x.fill(); }
    x.restore();
  }
  /* ---------- capa con física (cadena de puntos, solo para la vista) ---------- */
  function cloth(m, ax, ay, dt, len, wind) {
    const N = 7, seg = len / N;
    if (!m._cloth || m._cloth.length !== N) m._cloth = Array.from({ length: N }, (_, i) => ({ x: ax, y: ay + i * seg, px: ax, py: ay + i * seg }));
    const C = m._cloth; C[0].x = ax; C[0].y = ay; C[0].px = ax; C[0].py = ay;
    const d = Math.min(dt, 1 / 30);
    for (let i = 1; i < N; i++) { const p = C[i], vx = (p.x - p.px) * 0.9, vy = (p.y - p.py) * 0.9; p.px = p.x; p.py = p.y; p.x += vx + (-m.vx * 0.02 + wind) * d * 9; p.y += vy + (260 - m.vy * 0.25) * d * d * 4; }
    for (let it = 0; it < 3; it++) for (let i = 1; i < N; i++) { const a = C[i - 1], b = C[i], dx = b.x - a.x, dy = b.y - a.y, l = hypot(dx, dy) || 1, k = (l - seg) / l; b.x -= dx * k; b.y -= dy * k; if (b.y < a.y - seg * 0.3) b.y = a.y - seg * 0.3; }
    return C;
  }
  /* ---------- tela pintada: contorno del color de la tela (no negro) y pliegues con volumen ---------- */
  const ink = (h, a = 0.92) => { const c = hx2(h); return `rgba(${(c[0] * 0.2) | 0},${(c[1] * 0.17) | 0},${(c[2] * 0.26 + 6) | 0},${a})`; };
  function fillInk(x, fill, col, lw = 1.1) { x.fillStyle = fill; x.fill(); x.strokeStyle = ink(col); x.lineWidth = lw; x.lineJoin = 'round'; x.stroke(); }
  // pliegue: cuña que nace en (x0,y0) y se abre hasta (x1,y1); un lado en sombra y un filo de luz
  function fold(x, x0, y0, x1, y1, w, dark = 0.3, light = 0.1) {
    const dx = x1 - x0, dy = y1 - y0, l = hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    const g = x.createLinearGradient(x1 - nx * w, y1 - ny * w, x1 + nx * w, y1 + ny * w); g.addColorStop(0, 'rgba(0,0,12,0)'); g.addColorStop(0.6, `rgba(0,0,12,${dark})`); g.addColorStop(1, 'rgba(0,0,12,0)');
    x.fillStyle = g; x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo(x0 + dx * 0.5 - nx * w * 0.45, y0 + dy * 0.5 - ny * w * 0.45, x1 - nx * w, y1 - ny * w); x.lineTo(x1 + nx * w, y1 + ny * w); x.quadraticCurveTo(x0 + dx * 0.5 + nx * w * 0.45, y0 + dy * 0.5 + ny * w * 0.45, x0, y0); x.fill();
    if (light > 0) { x.strokeStyle = `rgba(255,255,255,${light})`; x.lineWidth = 0.9; x.beginPath(); x.moveTo(x0 - nx, y0 - ny + 2); x.quadraticCurveTo(x0 + dx * 0.5 - nx * (w * 0.45 + 1), y0 + dy * 0.5 - ny * (w * 0.45 + 1), x1 - nx * (w + 0.6), y1 - ny * (w + 0.6)); x.stroke(); }
  }
  // capa grande: tela pesada con forro de color, ribete y borde en jirones
  const TAT = [8, -1, 5, 0.5, 10, -1.5, 6, 1, 9];
  function drawCape(x, m, Lk, C, w0, w1, front, t) {
    const N = C.length, left = [], right = [];
    for (let i = 0; i < N; i++) { const p = C[i], q = C[Math.min(N - 1, i + 1)], o = C[Math.max(0, i - 1)], tx = q.x - o.x, ty = q.y - o.y, l = hypot(tx, ty) || 1, nx = -ty / l, ny = tx / l, w = lerp(w0, w1, Math.pow(i / (N - 1), 0.8)) / 2; left.push([p.x - m.x + nx * w, p.y - m.y + ny * w]); right.push([p.x - m.x - nx * w, p.y - m.y - ny * w]); }
    const a = left[N - 1], b = right[N - 1], J = TAT.length;
    x.beginPath(); x.moveTo(right[0][0], right[0][1]);
    for (let i = 1; i < N; i++) { const p0 = right[i - 1], p1 = right[i]; x.quadraticCurveTo(p0[0], p0[1], (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2); }
    x.lineTo(b[0], b[1]);
    for (let k = 1; k <= J; k++) { const f = k / J, px = lerp(b[0], a[0], f), py = lerp(b[1], a[1], f) + Math.sin(f * Math.PI) * 3; x.lineTo(px + (k % 2 ? 1.2 : -1.2), py + TAT[k - 1] + (TAT[k - 1] > 3 ? Math.sin(t * 3 + k) * 1.8 : 0)); }
    for (let i = N - 2; i >= 0; i--) { const p0 = left[i + 1], p1 = left[i]; x.quadraticCurveTo(p0[0], p0[1], (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2); }
    x.closePath();
    const top = C[0].y - m.y, bot = C[N - 1].y - m.y, g = x.createLinearGradient(0, top, 0, bot + 10);
    g.addColorStop(0, front ? shade(Lk.cape, 0.1) : shade(Lk.cape, -0.12)); g.addColorStop(0.5, front ? Lk.cape : shade(Lk.cape, -0.38)); g.addColorStop(1, Lk.cape2);
    fillInk(x, g, Lk.cape, 1.2);
    x.save(); x.clip();
    if (Lk.capeMat) { const X0 = Math.min(a[0], left[0][0], b[0], right[0][0]) - 6, X1 = Math.max(a[0], left[0][0], b[0], right[0][0]) + 6; matOn(x, Lk.capeMat, Lk.capeC, X0, top - 6, X1 - X0, bot - top + 22, t); }
    // volumen: luz de luna por la izquierda, sombra propia por la derecha
    const cx0 = Math.min(a[0], left[0][0]) - 2, cx1 = Math.max(b[0], right[0][0]) + 2, vg = x.createLinearGradient(cx0, 0, cx1, 0);
    vg.addColorStop(0, 'rgba(190,210,255,0.16)'); vg.addColorStop(0.3, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,14,0.42)'); x.fillStyle = vg; x.fillRect(cx0 - 20, top - 10, cx1 - cx0 + 40, bot - top + 40);
    // pliegues que caen desde los hombros
    const i2 = N - 1; for (const [s, dk] of [[0.16, 0.2], [0.36, 0.26], [0.62, 0.3], [0.84, 0.34]]) fold(x, lerp(left[1][0], right[1][0], 0.3 + s * 0.4), left[1][1], lerp(a[0], b[0], s), lerp(a[1], b[1], s) + 8, 3.6 + s * 2, dk, front ? 0.09 : 0.05);
    // forro de color asomando en el borde de abajo
    const lg = x.createLinearGradient(0, bot - 14, 0, bot + 10); lg.addColorStop(0, rgbaOf(Lk.lining, 0)); lg.addColorStop(1, rgbaOf(Lk.lining, front ? 0.34 : 0.5)); x.fillStyle = lg; x.fillRect(cx0 - 20, bot - 14, cx1 - cx0 + 40, 30);
    // ribete a lo largo de los dos bordes
    x.strokeStyle = rgbaOf(Lk.trim, 0.55); x.lineWidth = 0.9; for (const [E, s] of [[left, 1], [right, -1]]) { x.beginPath(); x.moveTo(E[0][0] + s * 2.2, E[0][1]); for (let i = 1; i < N; i++) x.lineTo(E[i][0] + s * 2.2, E[i][1]); x.stroke(); }
    x.restore();
    // de espaldas: el emblema del mago bordado en la capa
    if (front) { const mi = (N / 2) | 0, ex = (left[mi][0] + right[mi][0]) / 2, ey = (left[mi][1] + right[mi][1]) / 2 - 4; x.save(); x.globalAlpha = 0.8; pectoral(x, Lk.pect, ex, ey, t, 1.7); x.restore(); }
    x.strokeStyle = 'rgba(200,220,255,0.34)'; x.lineWidth = 1.1; x.beginPath(); x.moveTo(left[1][0] + 0.6, left[1][1]); for (let i = 2; i < N; i++) x.lineTo(left[i][0] + 0.6, left[i][1]); x.stroke();
  }
  /* ---------- medallón de oro ---------- */
  function pectoral(x, kind, X, Y, t, s = 1) {
    const g = x.createLinearGradient(X - 6 * s, Y - 6 * s, X + 6 * s, Y + 6 * s); g.addColorStop(0, '#fff2a8'); g.addColorStop(0.45, '#e8b130'); g.addColorStop(1, '#7a4a08');
    x.fillStyle = g; x.strokeStyle = 'rgba(50,24,0,0.85)'; x.lineWidth = 0.8;
    x.beginPath();
    if (kind === 'sun') { for (let k = 0; k < 16; k++) { const a = k / 16 * TAU, r = (k % 2 ? 3.4 : 5.6) * s; x.lineTo(X + Math.cos(a) * r, Y + Math.sin(a) * r * 0.85); } }
    else if (kind === 'fish') { x.ellipse(X, Y, 5.6 * s, 3.2 * s, 0, 0, TAU); x.moveTo(X + 5 * s, Y); x.lineTo(X + 8 * s, Y - 3 * s); x.lineTo(X + 8 * s, Y + 3 * s); }
    else if (kind === 'leaf') { x.moveTo(X, Y - 5.6 * s); x.quadraticCurveTo(X + 6 * s, Y, X, Y + 5.6 * s); x.quadraticCurveTo(X - 6 * s, Y, X, Y - 5.6 * s); }
    else if (kind === 'volcano') { x.moveTo(X - 6 * s, Y + 4 * s); x.lineTo(X - 2 * s, Y - 4.5 * s); x.lineTo(X + 2 * s, Y - 4.5 * s); x.lineTo(X + 6 * s, Y + 4 * s); }
    else if (kind === 'star') { for (let k = 0; k < 8; k++) { const a = k / 8 * TAU - Math.PI / 2, r = (k % 2 ? 2 : 6) * s; x.lineTo(X + Math.cos(a) * r, Y + Math.sin(a) * r); } }
    else if (kind === 'moon') { x.arc(X, Y, 5.4 * s, 0.5, TAU - 0.5); x.arc(X + 2.6 * s, Y, 3.8 * s, TAU - 0.9, 0.9, true); }
    else { x.moveTo(X + 2 * s, Y - 6 * s); x.lineTo(X - 3.6 * s, Y + 1 * s); x.lineTo(X, Y + 1 * s); x.lineTo(X - 2 * s, Y + 6 * s); x.lineTo(X + 4.5 * s, Y - 1 * s); x.lineTo(X + 1 * s, Y - 1 * s); }
    x.closePath(); x.fill(); x.stroke();
    const sh = (Math.sin(t * 2.2) + 1) / 2; x.fillStyle = `rgba(255,255,255,${0.35 + sh * 0.5})`; x.beginPath(); x.arc(X - 1.6 * s, Y - 1.8 * s, 1.1 * s, 0, TAU); x.fill();
  }
  /* ---------- ojos encendidos dentro de la sombra ---------- */
  function eyes(x, Lk, X, Y, sx, t, side, k = 1) {
    const blink = (t % 4.3) < 0.1;
    x.save(); x.globalCompositeOperation = 'lighter';
    const g = x.createRadialGradient(X, Y, 0, X, Y, sx * 3.4); g.addColorStop(0, Lk.eye + '99'); g.addColorStop(1, Lk.eye + '00'); x.fillStyle = g; x.beginPath(); x.arc(X, Y, sx * 3.4, 0, TAU); x.fill();
    x.fillStyle = Lk.eye; const h = blink ? 0.35 : 1.1 * k;
    for (const s of side ? [1] : [-1, 1]) { x.beginPath(); x.ellipse(X + s * sx, Y, 1.7 * k, h, s * 0.18, 0, TAU); x.fill(); }
    x.fillStyle = '#fff'; if (!blink) for (const s of side ? [1] : [-1, 1]) { x.beginPath(); x.arc(X + s * sx, Y, 0.6 * k, 0, TAU); x.fill(); }
    x.restore();
  }
  /* ---------- capucha, rostro y tocado ---------- */
  function hood(x, m, Lk, HX, HY, t, view, fx, glowCol) {
    const back = view === 'back', side = view === 'side', ex = side ? fx * 3.6 : fx * 1.6, pk = Lk.peak;
    // lo que va detrás de la capucha
    if (Lk.head === 'rosette') {
      for (let k = 0; k < 15; k++) { const a = -Math.PI / 2 + (k / 14 - 0.5) * 3.4, ln = 14 + (k % 3) * 4; x.save(); x.translate(HX, HY - 4); x.rotate(a + Math.PI / 2); const lg = x.createLinearGradient(0, -6, 0, -ln - 6); lg.addColorStop(0, '#6e7e5a'); lg.addColorStop(1, k % 2 ? '#e6edd2' : '#c3cfac'); x.fillStyle = lg; x.beginPath(); x.ellipse(0, -ln / 2 - 7, 3.6, ln / 2, 0, 0, TAU); x.fill(); x.strokeStyle = 'rgba(30,40,20,0.5)'; x.lineWidth = 0.7; x.stroke(); x.strokeStyle = 'rgba(255,255,255,0.25)'; x.beginPath(); x.moveTo(0, -8); x.lineTo(0, -ln - 4); x.stroke(); x.restore(); }
    } else if (Lk.head === 'ice' || Lk.head === 'horns') {
      const ice = Lk.head === 'ice';
      if (ice) for (let k = -3; k <= 3; k++) { const hh = 13 + (3 - Math.abs(k)) * 6, bx = HX + k * 4.6; const sg = x.createLinearGradient(bx - 3, HY - 6, bx + 3, HY - 8 - hh); sg.addColorStop(0, '#5a9ac4'); sg.addColorStop(0.6, '#cdeeff'); sg.addColorStop(1, '#ffffff'); x.beginPath(); x.moveTo(bx - 3, HY - 6 + Math.abs(k)); x.lineTo(bx + k * 1.6, HY - 8 - hh + Math.abs(k) * 1.5); x.lineTo(bx + 3, HY - 6 + Math.abs(k)); x.closePath(); x.fillStyle = sg; x.fill(); x.strokeStyle = 'rgba(20,60,100,0.6)'; x.lineWidth = 0.7; x.stroke(); x.strokeStyle = 'rgba(255,255,255,0.8)'; x.beginPath(); x.moveTo(bx - 0.6, HY - 7); x.lineTo(bx + k * 1.4, HY - 6 - hh + Math.abs(k) * 1.5); x.stroke(); }
      else for (const sd of [-1, 1]) { const hg3 = x.createLinearGradient(HX + sd * 8, HY - 4, HX + sd * 20, HY - 30); hg3.addColorStop(0, '#0c0810'); hg3.addColorStop(1, '#6a4a78'); x.beginPath(); x.moveTo(HX + sd * 7, HY - 4); x.bezierCurveTo(HX + sd * 20, HY - 6, HX + sd * 24, HY - 20, HX + sd * 15, HY - 32); x.bezierCurveTo(HX + sd * 18, HY - 20, HX + sd * 14, HY - 12, HX + sd * 5, HY - 10); x.closePath(); x.fillStyle = hg3; x.fill(); x.strokeStyle = 'rgba(0,0,0,0.7)'; x.lineWidth = 0.9; x.stroke(); if ((t * 2.3 + sd) % 1.7 < 0.25) { x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = '#ffe0b0'; x.lineWidth = 1.1; x.beginPath(); x.moveTo(HX + sd * 15, HY - 32); for (let q = 1; q <= 4; q++) x.lineTo(HX + sd * 15 * (1 - q / 4) + (Math.random() - 0.5) * 7, HY - 32 - Math.sin(q / 4 * Math.PI) * 9 + (Math.random() - 0.5) * 4); x.stroke(); x.restore(); } }
    } else if (Lk.head === 'sunhalo') {
      // disco solar con rayos que gira despacio detrás de la cabeza
      x.save(); x.translate(HX, HY - 6); x.globalCompositeOperation = 'lighter'; const hg2 = x.createRadialGradient(0, 0, 4, 0, 0, 30); hg2.addColorStop(0, 'rgba(255,230,140,0.55)'); hg2.addColorStop(1, 'rgba(255,200,90,0)'); x.fillStyle = hg2; x.beginPath(); x.arc(0, 0, 30, 0, TAU); x.fill(); x.globalCompositeOperation = 'source-over';
      x.rotate(t * 0.35); for (let k = 0; k < 12; k++) { x.rotate(TAU / 12); const ln = k % 2 ? 11 : 17; const rg = x.createLinearGradient(0, -13, 0, -13 - ln); rg.addColorStop(0, '#e8a42a'); rg.addColorStop(1, '#fff6c8'); x.fillStyle = rg; x.beginPath(); x.moveTo(-2.6, -13); x.lineTo(0, -13 - ln); x.lineTo(2.6, -13); x.closePath(); x.fill(); x.strokeStyle = 'rgba(80,40,0,0.6)'; x.lineWidth = 0.6; x.stroke(); }
      x.strokeStyle = '#ffe9a0'; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 14, 0, TAU); x.stroke(); x.restore();
    } else if (Lk.head === 'crescent') {
      x.save(); x.translate(HX, HY - 10); x.globalCompositeOperation = 'lighter'; const mg = x.createRadialGradient(0, 0, 4, 0, 0, 30); mg.addColorStop(0, 'rgba(200,215,255,0.5)'); mg.addColorStop(1, 'rgba(160,180,255,0)'); x.fillStyle = mg; x.beginPath(); x.arc(0, 0, 30, 0, TAU); x.fill(); x.globalCompositeOperation = 'source-over';
      x.rotate(-0.35 + Math.sin(t * 0.8) * 0.05); const cg2 = x.createLinearGradient(-18, -18, 18, 18); cg2.addColorStop(0, '#ffffff'); cg2.addColorStop(1, '#8e9cd0'); x.fillStyle = cg2; x.beginPath(); x.arc(0, 0, 19, 0.35, TAU - 0.35); x.arc(7.5, 0, 15, TAU - 0.75, 0.75, true); x.closePath(); x.fill(); x.strokeStyle = 'rgba(30,36,80,0.7)'; x.lineWidth = 0.9; x.stroke(); x.restore();
    } else if (Lk.head === 'feathers') {
      for (let k = 0; k < 9; k++) { const a = -Math.PI / 2 + (k / 8 - 0.5) * 2.5, ln = 20 + (k % 2) * 6 - Math.abs(k - 4) * 1.2; x.save(); x.translate(HX, HY - 3); x.rotate(a + Math.PI / 2 + Math.sin(t * 2 + k) * 0.04); const fg2 = x.createLinearGradient(0, -6, 0, -ln - 6); fg2.addColorStop(0, '#0c0810'); fg2.addColorStop(0.7, '#2a1e36'); fg2.addColorStop(1, k % 3 === 1 ? Lk.trim : '#463458'); x.fillStyle = fg2; x.beginPath(); x.moveTo(0, -6); x.quadraticCurveTo(4.2, -ln * 0.6, 0, -ln - 7); x.quadraticCurveTo(-4.2, -ln * 0.6, 0, -6); x.fill(); x.strokeStyle = 'rgba(190,170,220,0.3)'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(0, -7); x.lineTo(0, -ln - 5); x.stroke(); x.restore(); }
    } else if (Lk.head === 'reeds') {
      for (let k = -3; k <= 3; k++) { x.strokeStyle = k % 2 ? '#4a8a36' : '#6ea84a'; x.lineWidth = 2; x.beginPath(); x.moveTo(HX + k * 2.6, HY - 8); x.quadraticCurveTo(HX + k * 4.2, HY - 18, HX + k * 5.6 + Math.sin(t * 2 + k) * 1.6, HY - 27 + Math.abs(k) * 2.4); x.stroke(); x.fillStyle = '#7a5a2a'; x.beginPath(); x.ellipse(HX + k * 5.6 + Math.sin(t * 2 + k) * 1.6, HY - 27 + Math.abs(k) * 2.4, 1.3, 3, 0, 0, TAU); x.fill(); }
    }
    // capucha honda: cae sobre los hombros, punta doblada, borde con grosor y forro por dentro
    const hw = 12.6, tipX = HX + fx * 3 + (side ? fx * 2 : 0), tipY = HY - pk, hg = x.createLinearGradient(HX - hw - 2, HY - pk, HX + hw + 2, HY + 12);
    hg.addColorStop(0, shade(Lk.cape, 0.2)); hg.addColorStop(0.45, Lk.cape); hg.addColorStop(1, Lk.cape2);
    x.beginPath(); x.moveTo(HX - hw - 2.6, HY + 12);
    x.bezierCurveTo(HX - hw - 4.6, HY - 2, HX - hw * 0.72, HY - pk + 3.5, tipX - 1.6, tipY + 0.8);
    x.quadraticCurveTo(tipX + 0.4, tipY - 1.8, tipX + 2.2 - fx * 1.2, tipY + 1.6);
    x.bezierCurveTo(HX + hw * 0.76, HY - pk + 4.5, HX + hw + 4.6, HY - 2, HX + hw + 2.6, HY + 12);
    x.quadraticCurveTo(HX, HY + 17, HX - hw - 2.6, HY + 12); fillInk(x, hg, Lk.cape, 1.15);
    x.save(); x.clip();
    if (Lk.capeMat) matOn(x, Lk.capeMat, Lk.capeC, HX - hw - 6, HY - pk - 3, hw * 2 + 12, pk + 22, t);
    const hl = x.createRadialGradient(HX - 6.5, HY - pk * 0.45, 0, HX - 6.5, HY - pk * 0.45, 13); hl.addColorStop(0, 'rgba(215,228,255,0.26)'); hl.addColorStop(1, 'rgba(215,228,255,0)'); x.fillStyle = hl; x.fillRect(HX - 22, HY - pk - 4, 44, pk + 24);
    const hs = x.createLinearGradient(HX - 2, 0, HX + hw + 4, 0); hs.addColorStop(0, 'rgba(0,0,12,0)'); hs.addColorStop(1, 'rgba(0,0,12,0.46)'); x.fillStyle = hs; x.fillRect(HX - 2, HY - pk - 4, hw + 8, pk + 24);
    fold(x, tipX - 1, tipY + 3, HX - hw + 1.5, HY + 12, 2.6, 0.26, 0.1); fold(x, tipX + 1, tipY + 3, HX + hw - 1, HY + 13, 2.8, 0.3, 0);
    x.restore();
    x.strokeStyle = 'rgba(205,222,255,0.42)'; x.lineWidth = 1.1; x.beginPath(); x.moveTo(HX - hw - 1.9, HY + 9); x.bezierCurveTo(HX - hw - 3.6, HY - 3, HX - hw * 0.7, HY - pk + 4.4, tipX - 1, tipY + 1.6); x.stroke();
    if (!back) {
      const ow = side ? 6 : 8.2, ox = HX + ex;
      const mouth = d => { x.beginPath(); x.moveTo(ox - ow - d, HY + 7.6 + d * 0.5); x.bezierCurveTo(ox - ow - 1.2 - d, HY - 3, ox - ow * 0.52, HY - 9 - d, ox, HY - 10.2 - d); x.bezierCurveTo(ox + ow * 0.52, HY - 9 - d, ox + ow + 1.2 + d, HY - 3, ox + ow + d, HY + 7.6 + d * 0.5); x.quadraticCurveTo(ox, HY + 11.4 + d, ox - ow - d, HY + 7.6 + d * 0.5); };
      // grosor del borde: se ve el forro por dentro
      mouth(1.5); const rg = x.createLinearGradient(ox - ow, HY - 10, ox + ow, HY + 10); rg.addColorStop(0, shade(Lk.lining, -0.25)); rg.addColorStop(1, shade(Lk.lining, -0.7)); x.fillStyle = rg; x.fill();
      // hueco del rostro: sombra honda
      mouth(0); const fg = x.createRadialGradient(ox, HY - 2, 0, ox, HY + 1, 11); fg.addColorStop(0, '#020104'); fg.addColorStop(0.72, '#080510'); fg.addColorStop(1, shade(Lk.cape2, -0.35)); x.fillStyle = fg; x.fill();
      x.save(); x.clip();
      // media cara apenas iluminada desde abajo por los orbes: mandíbula, nariz y pómulos
      const skin = Lk.skin.length === 7 ? Lk.skin : '#806050', fxs = side ? fx * 1.4 : fx * 0.5;
      const fc = x.createLinearGradient(0, HY - 3, 0, HY + 9.5); fc.addColorStop(0, rgbaOf(skin, 0)); fc.addColorStop(0.6, rgbaOf(skin, 0.14)); fc.addColorStop(1, rgbaOf(skin, 0.5));
      x.fillStyle = fc; x.beginPath(); x.moveTo(ox + fxs - 5, HY - 3); x.bezierCurveTo(ox + fxs - 5.4, HY + 5, ox + fxs - 2.6, HY + 9.4, ox + fxs, HY + 9.6); x.bezierCurveTo(ox + fxs + 2.6, HY + 9.4, ox + fxs + 5.4, HY + 5, ox + fxs + 5, HY - 3); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(0,0,0,0.3)'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(ox + fxs - 1.5, HY + 7.2); x.quadraticCurveTo(ox + fxs, HY + 7.6, ox + fxs + 1.5, HY + 7.2); x.stroke();
      if (glowCol) { x.globalCompositeOperation = 'lighter'; const lg = x.createRadialGradient(ox, HY + 11, 0, ox, HY + 11, 10); lg.addColorStop(0, glowCol + '66'); lg.addColorStop(1, glowCol + '00'); x.fillStyle = lg; x.fillRect(ox - 10, HY - 1, 20, 14); x.globalCompositeOperation = 'source-over'; }
      // la sombra de la capucha cae sobre la frente
      const sh2 = x.createLinearGradient(0, HY - 10, 0, HY + 1.5); sh2.addColorStop(0, 'rgba(2,1,6,0.95)'); sh2.addColorStop(1, 'rgba(2,1,6,0)'); x.fillStyle = sh2; x.fillRect(ox - 10, HY - 11, 20, 13);
      x.restore();
      eyes(x, Lk, ox + (side ? fx * 1.2 : 0), HY + 0.2, side ? 2 : 2.9, t, side);
      // ribete del borde de la capucha: doble línea de oro
      mouth(0.7); x.strokeStyle = Lk.trim; x.lineWidth = 1.25; x.stroke();
      mouth(2.3); x.strokeStyle = rgbaOf(Lk.trim, 0.4); x.lineWidth = 0.6; x.stroke();
    } else {
      x.strokeStyle = 'rgba(0,0,12,0.35)'; x.lineWidth = 1; x.beginPath(); x.moveTo(tipX, tipY + 3); x.quadraticCurveTo(HX + 1, HY - 2, HX, HY + 14); x.stroke();
      x.strokeStyle = rgbaOf(Lk.trim, 0.7); x.lineWidth = 1.1; x.beginPath(); x.moveTo(HX - hw - 1.4, HY + 11.4); x.quadraticCurveTo(HX, HY + 16, HX + hw + 1.4, HY + 11.4); x.stroke();
    }
    // tocados encima
    if (Lk.head === 'sombrero') {
      const bg = x.createLinearGradient(HX - 22, HY - 12, HX + 22, HY - 4); bg.addColorStop(0, '#6a4a2c'); bg.addColorStop(1, '#24160a');
      x.beginPath(); x.ellipse(HX + fx * 1.5, HY - 8.5, 22, 6.2, fx * 0.08, 0, TAU); fillOL(x, bg);
      x.strokeStyle = 'rgba(255,220,160,0.25)'; x.lineWidth = 1; x.beginPath(); x.ellipse(HX + fx * 1.5, HY - 9, 20, 5.2, fx * 0.08, Math.PI * 1.05, Math.PI * 1.7); x.stroke();
      const cg = x.createLinearGradient(HX - 9, HY - 25, HX + 9, HY - 10); cg.addColorStop(0, '#7e5634'); cg.addColorStop(1, '#2e1c0c');
      x.beginPath(); x.moveTo(HX - 9, HY - 10); x.quadraticCurveTo(HX - 9.6, HY - 24, HX + fx, HY - 24.5); x.quadraticCurveTo(HX + 9.6, HY - 24, HX + 9, HY - 10); fillOL(x, cg);
      x.fillStyle = '#b02414'; x.fillRect(HX - 9, HY - 14, 18, 3.2); x.fillStyle = Lk.trim; x.fillRect(HX - 9, HY - 11.8, 18, 0.9);
      x.fillStyle = '#e8d8a0'; x.save(); x.translate(HX + 8, HY - 16); x.rotate(-0.6); x.beginPath(); x.ellipse(0, 0, 1.6, 6.4, 0, 0, TAU); x.fill(); x.restore();
    } else if (Lk.head === 'reeds') {
      x.strokeStyle = '#c8a040'; x.lineWidth = 2; x.beginPath(); x.ellipse(HX + ex * 0.5, HY - 8, 10.5, 3.4, 0, Math.PI * 1.05, TAU - 0.05); x.stroke();
      if (!back) { x.save(); x.globalCompositeOperation = 'lighter'; const gg = x.createRadialGradient(HX + ex, HY - 11, 0, HX + ex, HY - 11, 7); gg.addColorStop(0, '#9ff0ffcc'); gg.addColorStop(1, '#9ff0ff00'); x.fillStyle = gg; x.beginPath(); x.arc(HX + ex, HY - 11, 7, 0, TAU); x.fill(); x.restore(); x.fillStyle = '#dffcff'; x.beginPath(); x.moveTo(HX + ex, HY - 14); x.lineTo(HX + ex + 2, HY - 11); x.lineTo(HX + ex, HY - 8.5); x.lineTo(HX + ex - 2, HY - 11); x.fill(); }
    } else if (Lk.head === 'spikes') {
      for (let k = -2; k <= 2; k++) { const hh = 10 + (2 - Math.abs(k)) * 6; const sg = x.createLinearGradient(HX + k * 5, HY - 10, HX + k * 5, HY - 10 - hh); sg.addColorStop(0, '#0a060c'); sg.addColorStop(1, '#4a3a58'); x.beginPath(); x.moveTo(HX + k * 4.4 - 2.8, HY - 9 + Math.abs(k)); x.lineTo(HX + k * 5.8, HY - 9 - hh + Math.abs(k)); x.lineTo(HX + k * 4.4 + 2.8, HY - 9 + Math.abs(k)); fillOL(x, sg, 0.9); }
      const p = 0.5 + 0.5 * Math.sin(t * 3); x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(255,${120 + p * 90},40,0.95)`; x.lineWidth = 1.3; x.beginPath(); x.ellipse(HX, HY - 8.5, 11, 2.6, 0, Math.PI, TAU); x.stroke(); x.restore();
    } else if (Lk.head === 'flowers') {
      const cols = ['#ff7fa8', '#ffe07a', '#ffffff', '#ff7fa8', '#9fe8ff', '#ffe07a', '#ffffff'];
      for (let k = 0; k < 7; k++) { const a = Math.PI + 0.1 + k * 0.49, px = HX + Math.cos(a) * 12.5, py = HY - 1 + Math.sin(a) * 11; x.fillStyle = cols[k]; for (let pp = 0; pp < 5; pp++) { x.beginPath(); x.arc(px + Math.cos(pp * 1.26 + k) * 2.2, py + Math.sin(pp * 1.26 + k) * 2.2, 1.7, 0, TAU); x.fill(); } x.fillStyle = '#e8a020'; x.beginPath(); x.arc(px, py, 1.1, 0, TAU); x.fill(); }
    } else if (Lk.head === 'sunhalo' || Lk.head === 'crescent') {
      const sun = Lk.head === 'sunhalo'; x.strokeStyle = sun ? '#e8b130' : '#dfe6ff'; x.lineWidth = 2; x.beginPath(); x.ellipse(HX + ex * 0.5, HY - 8, 10.5, 3.2, 0, Math.PI * 1.05, TAU - 0.05); x.stroke();
      if (!back) { x.save(); x.globalCompositeOperation = 'lighter'; const gg = x.createRadialGradient(HX + ex, HY - 11.5, 0, HX + ex, HY - 11.5, 8); gg.addColorStop(0, sun ? '#ffe9a0dd' : '#dfe6ffdd'); gg.addColorStop(1, sun ? '#ffe9a000' : '#dfe6ff00'); x.fillStyle = gg; x.beginPath(); x.arc(HX + ex, HY - 11.5, 8, 0, TAU); x.fill(); x.restore(); pectoral(x, sun ? 'sun' : 'star', HX + ex, HY - 12, t, 0.5); }
    } else if (Lk.head === 'wrap') {
      const wg = x.createLinearGradient(HX - 12, HY - 12, HX + 12, HY - 4); wg.addColorStop(0, '#f4e6c0'); wg.addColorStop(1, '#b08a52');
      x.beginPath(); x.moveTo(HX - 12.5, HY - 5); x.quadraticCurveTo(HX, HY - 14, HX + 12.5, HY - 5); x.lineTo(HX + 12, HY - 0.5); x.quadraticCurveTo(HX, HY - 9, HX - 12, HY - 0.5); x.closePath(); fillOL(x, wg, 1);
      x.strokeStyle = 'rgba(90,50,20,0.5)'; x.lineWidth = 0.8; for (let k = -1; k <= 1; k++) { x.beginPath(); x.moveTo(HX + k * 6 - 2, HY - 8.5 + Math.abs(k) * 2); x.lineTo(HX + k * 6 + 1, HY - 4 + Math.abs(k) * 2); x.stroke(); }
      const sd = fx >= 0 ? -1 : 1; x.beginPath(); x.moveTo(HX + sd * 11, HY - 4); for (let k = 1; k <= 5; k++) x.lineTo(HX + sd * (11 + k * 4.4), HY - 3 + k * 3.4 + Math.sin(t * 5 + k * 0.9) * 2.2); for (let k = 5; k >= 1; k--) x.lineTo(HX + sd * (9 + k * 4.2), HY + 1 + k * 3.6 + Math.sin(t * 5 + k * 0.9) * 2.2); x.closePath(); fillOL(x, '#d8b87a', 0.9);
      if (!back) { x.fillStyle = '#e8482a'; x.beginPath(); x.arc(HX + ex, HY - 9.5, 1.9, 0, TAU); x.fill(); x.strokeStyle = Lk.trim; x.lineWidth = 0.8; x.stroke(); }
    } else if (Lk.head === 'ice') {
      if (!back) { x.save(); x.globalCompositeOperation = 'lighter'; const gg = x.createRadialGradient(HX + ex, HY - 11, 0, HX + ex, HY - 11, 8); gg.addColorStop(0, '#bff6ffcc'); gg.addColorStop(1, '#bff6ff00'); x.fillStyle = gg; x.beginPath(); x.arc(HX + ex, HY - 11, 8, 0, TAU); x.fill(); x.restore(); }
    } else if (Lk.head === 'horns') {
      const p = 0.5 + 0.5 * Math.sin(t * 4); x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(255,${150 + p * 80},70,0.95)`; x.lineWidth = 1.3; x.beginPath(); x.ellipse(HX, HY - 8.5, 11, 2.6, 0, Math.PI, TAU); x.stroke(); x.restore();
    } else if (Lk.head === 'feathers') {
      if (!back) { x.fillStyle = Lk.trim; x.beginPath(); x.moveTo(HX + ex - 3.2, HY - 9.5); x.lineTo(HX + ex + 3.2, HY - 9.5); x.lineTo(HX + ex + fx * 1.5, HY - 3.5); x.closePath(); x.fill(); x.strokeStyle = 'rgba(20,0,10,0.7)'; x.lineWidth = 0.7; x.stroke(); }
    } else if (Lk.head === 'kelp') {
      x.strokeStyle = '#d8f4ec'; x.lineWidth = 1.6; x.beginPath(); x.ellipse(HX + ex * 0.5, HY - 8, 10.5, 3.2, 0, Math.PI * 1.05, TAU - 0.05); x.stroke();
      for (let k = 0; k < 5; k++) { const a = Math.PI * 1.08 + k / 4 * Math.PI * 0.84; x.fillStyle = k % 2 ? '#ffffff' : '#bfeee2'; x.beginPath(); x.arc(HX + ex * 0.5 + Math.cos(a) * 10.5, HY - 8 + Math.sin(a) * 3.2, 1.5, 0, TAU); x.fill(); }
      for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) { const bx = HX + sd * (10 + k * 2.2), sw = Math.sin(t * 1.6 + k + sd) * 2.4; x.strokeStyle = k % 2 ? '#1f6a5c' : '#2e8a74'; x.lineWidth = 2.2; x.beginPath(); x.moveTo(bx, HY - 4); x.bezierCurveTo(bx + sd * 3 + sw, HY + 8, bx - sd * 2 + sw, HY + 16, bx + sd * 2 + sw * 1.4, HY + 24 + k * 3); x.stroke(); }
    } else if (Lk.head === 'hood') {
      if (!back) { x.save(); x.globalCompositeOperation = 'lighter'; const gg = x.createRadialGradient(HX + ex, HY - 12, 0, HX + ex, HY - 12, 8); gg.addColorStop(0, '#d8c8ffcc'); gg.addColorStop(1, '#d8c8ff00'); x.fillStyle = gg; x.beginPath(); x.arc(HX + ex, HY - 12, 8, 0, TAU); x.fill(); x.restore(); pectoral(x, 'bolt', HX + ex, HY - 13, t, 0.55); }
      if ((t * 1.7) % 3 < 0.22) { x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = '#efe6ff'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(HX + fx * 3, HY - pk); for (let k = 1; k < 5; k++) x.lineTo(HX + fx * 3 + (Math.random() - 0.5) * 14, HY - pk - k * 5); x.stroke(); x.restore(); }
    }
  }
  /* ---------- túnica larga: hombros, talle ceñido y vuelo amplio que ondea ---------- */
  // borde de abajo en ondas (dy lo sube: para la cenefa)
  function hemLine(x, hem, bot, sway, t, dy, start) {
    const n = 6; if (start) x.moveTo(-hem + sway + (dy ? 0.6 : 0), bot - 1 + dy);
    for (let k = 1; k <= n; k++) { const f = k / n, fm = (k - 0.5) / n, X = lerp(-hem, hem, f) + sway, Y = bot - 1 + Math.sin(f * Math.PI) * 4, Xm = lerp(-hem, hem, fm) + sway, Ym = bot - 1 + Math.sin(fm * Math.PI) * 4 + 2.4 + Math.sin(t * 5 + k * 1.9) * 0.8; x.quadraticCurveTo(Xm, Ym + dy, X - (dy && k === n ? 0.6 : 0), Y + dy); }
  }
  function robePath(x, sh, wa, hem, top, bot, sway, fx, t) {
    x.beginPath(); x.moveTo(-sh + fx, top);
    x.bezierCurveTo(-sh - 1.6 + fx, top + 9, -wa - 0.4 + fx * 0.6, -45, -wa + fx * 0.6, -38);
    x.bezierCurveTo(-wa - 0.6, -27, -hem * 0.8 + sway * 0.3, -15, -hem + sway, bot - 1);
    hemLine(x, hem, bot, sway, t, 0, false);
    x.bezierCurveTo(hem * 0.8 + sway * 0.3, -15, wa + 0.6, -27, wa + fx * 0.6, -38);
    x.bezierCurveTo(wa + 0.4 + fx * 0.6, -45, sh + 1.6 + fx, top + 9, sh + fx, top);
    x.quadraticCurveTo(fx, top - 3, -sh + fx, top);
  }
  function motif(x, Lk, kind, X, y0, y1, w, t) {
    x.fillStyle = Lk.trim; x.strokeStyle = Lk.trim; x.lineWidth = 1;
    if (kind === 'sun' || kind === 'waves' || kind === 'flowers') {
      for (let y = y0 + 5; y < y1 - 2; y += 7) {
        if (kind === 'sun') { x.beginPath(); x.moveTo(X, y - 2.6); x.lineTo(X + 2.4, y); x.lineTo(X, y + 2.6); x.lineTo(X - 2.4, y); x.closePath(); x.fill(); x.fillStyle = '#b02414'; x.fillRect(X - 0.8, y - 0.8, 1.6, 1.6); x.fillStyle = Lk.trim; }
        else if (kind === 'waves') { x.beginPath(); x.moveTo(X - w * 0.4, y); x.quadraticCurveTo(X - w * 0.2, y - 2.6, X, y); x.quadraticCurveTo(X + w * 0.2, y + 2.6, X + w * 0.4, y); x.stroke(); }
        else { x.fillStyle = (y | 0) % 2 ? '#ff8fb0' : Lk.trim; x.beginPath(); for (let p = 0; p < 4; p++) x.arc(X + Math.cos(p * 1.57) * 1.5, y + Math.sin(p * 1.57) * 1.5, 1.1, 0, TAU); x.fill(); }
      }
    } else if (kind === 'stars') { for (let y = y0 + 5, k = 0; y < y1 - 2; y += 7, k++) { const tw = 0.6 + 0.4 * Math.sin(t * 3 + k * 1.7); x.globalAlpha = tw; x.beginPath(); for (let q = 0; q < 8; q++) { const a = q / 8 * TAU, r = q % 2 ? 0.9 : 2.6; x.lineTo(X + (k % 2 ? 1.6 : -1.6) + Math.cos(a) * r, y + Math.sin(a) * r); } x.closePath(); x.fill(); x.globalAlpha = 1; }
    } else if (kind === 'moss') { for (let y = y0 + 4; y < y1; y += 6) { x.beginPath(); x.moveTo(X - w * 0.35, y + 2); x.lineTo(X, y - 1.5); x.lineTo(X + w * 0.35, y + 2); x.stroke(); } }
    else if (kind === 'cracks' || kind === 'bolts') {
      const p = 0.5 + 0.5 * Math.sin(t * 3), hot = kind === 'cracks';
      x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = hot ? `rgba(255,${110 + p * 100},40,${0.6 + p * 0.4})` : `rgba(220,200,255,${0.4 + (((t * 5) % 2.5) < 0.2 ? 0.6 : 0)})`; x.lineWidth = 1.3;
      x.beginPath(); x.moveTo(X - 1, y0 + 2); x.lineTo(X + 2, y0 + 10); x.lineTo(X - 2, y0 + 17); x.lineTo(X + 1.5, y0 + 26); x.lineTo(X - 1.5, y1 - 2); if (hot) { x.moveTo(X + 2, y0 + 10); x.lineTo(X + 6, y0 + 14); x.moveTo(X - 2, y0 + 17); x.lineTo(X - 6, y0 + 22); } x.stroke(); x.restore();
    }
  }
  function robe(x, m, Lk, t, sway, view, fx, B, glows) {
    const sh = 12 * B, wa = 8.6 * B, hem = 20 * B + Math.abs(sway) * 0.4, top = -60, bot = -3;
    const g = x.createLinearGradient(-hem, 0, hem, 0); g.addColorStop(0, shade(Lk.robe, 0.2)); g.addColorStop(0.28, shade(Lk.robe, 0.04)); g.addColorStop(0.62, shade(Lk.robe, -0.24)); g.addColorStop(1, Lk.robe2);
    robePath(x, sh, wa, hem, top, bot, sway, fx, t);
    fillInk(x, g, Lk.robe, 1.25);
    x.save(); x.clip();
    if (Lk.mat) matOn(x, Lk.mat, Lk.matC, -hem - 6 + sway, top - 2, hem * 2 + 12, bot - top + 10, t);
    // la luz viene de arriba: la falda se oscurece hacia el suelo; sombra del manto sobre el pecho
    const vg = x.createLinearGradient(0, -34, 0, bot + 4); vg.addColorStop(0, rgbaOf(Lk.robe2, 0)); vg.addColorStop(1, rgbaOf(Lk.robe2, 0.72)); x.fillStyle = vg; x.fillRect(-hem - 6, -34, hem * 2 + 12, 40);
    const ao = x.createLinearGradient(0, -53, 0, -41); ao.addColorStop(0, 'rgba(0,0,10,0.5)'); ao.addColorStop(1, 'rgba(0,0,10,0)'); x.fillStyle = ao; x.fillRect(-hem, -56, hem * 2, 16);
    // pliegues con volumen que nacen en el talle
    for (const [s, w, dk, li] of [[-0.8, 2.6, 0.2, 0.12], [-0.42, 3, 0.24, 0.1], [0.44, 3, 0.3, 0.06], [0.82, 2.6, 0.34, 0]]) fold(x, s * wa * 0.9 + fx * 0.6, -35, s * hem * 0.96 + sway * 0.7, bot + 3, w * B, dk, li);
    // arrugas del talle
    x.strokeStyle = 'rgba(0,0,10,0.3)'; x.lineWidth = 0.9; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * wa * 0.95, -44); x.quadraticCurveTo(s * wa * 0.5, -42, s * wa * 0.25, -40.5); x.moveTo(s * wa * 1.0, -32); x.quadraticCurveTo(s * wa * 0.6, -30.5, s * wa * 0.4, -27); x.stroke(); }
    // banda central bordada (la túnica de fuera se abre sobre ella)
    if (view !== 'back') {
      const cx = fx * (view === 'side' ? 5 : 2), pw0 = 4.4, pw1 = 7.6 + Math.abs(sway) * 0.1, pb = bot + 4;
      x.beginPath(); x.moveTo(cx - pw0, top + 4); x.lineTo(cx + pw0, top + 4); x.lineTo(cx + pw1 + sway * 0.6, pb); x.lineTo(cx - pw1 + sway * 0.6, pb); x.closePath();
      const pg = x.createLinearGradient(cx - pw1, 0, cx + pw1, 0); pg.addColorStop(0, shade(Lk.panel, 0.2)); pg.addColorStop(0.5, shade(Lk.panel, 0.06)); pg.addColorStop(1, shade(Lk.panel, -0.3)); x.fillStyle = pg; x.fill();
      const pv = x.createLinearGradient(0, -30, 0, pb); pv.addColorStop(0, 'rgba(0,0,8,0)'); pv.addColorStop(1, 'rgba(0,0,8,0.45)'); x.fillStyle = pv; x.fill();
      // solapas: sombra a cada lado y doble ribete
      for (const s of [-1, 1]) { const lg = x.createLinearGradient(cx + s * pw1, 0, cx + s * (pw1 - 3), 0); lg.addColorStop(0, 'rgba(0,0,8,0.5)'); lg.addColorStop(1, 'rgba(0,0,8,0)'); x.fillStyle = lg; x.fill(); }
      x.strokeStyle = Lk.trim; x.lineWidth = 1.15; x.beginPath(); x.moveTo(cx - pw0, top + 4); x.lineTo(cx - pw1 + sway * 0.6, pb); x.moveTo(cx + pw0, top + 4); x.lineTo(cx + pw1 + sway * 0.6, pb); x.stroke();
      x.strokeStyle = rgbaOf(Lk.trim, 0.42); x.lineWidth = 0.6; x.beginPath(); x.moveTo(cx - pw0 - 1.7, top + 4); x.lineTo(cx - pw1 - 2 + sway * 0.6, pb); x.moveTo(cx + pw0 + 1.7, top + 4); x.lineTo(cx + pw1 + 2 + sway * 0.6, pb); x.stroke();
      motif(x, Lk, Lk.motif, cx + sway * 0.3, -32, bot, pw1 * 2, t);
    }
    // cenefa bordada en el ruedo
    x.beginPath(); hemLine(x, hem, bot, sway, t, -6.2, true); x.lineTo(hem + sway + 2, bot + 8); x.lineTo(-hem + sway - 2, bot + 8); x.closePath(); x.fillStyle = rgbaOf(Lk.panel, 0.78); x.fill();
    x.beginPath(); hemLine(x, hem, bot, sway, t, -6.2, true); x.strokeStyle = rgbaOf(Lk.trim, 0.85); x.lineWidth = 0.7; x.stroke();
    x.fillStyle = Lk.trim; for (let k = 0; k < 9; k++) { const f = (k + 0.5) / 9, X = lerp(-hem, hem, f) + sway, Y = bot - 1 + Math.sin(f * Math.PI) * 4 - 2.7; x.beginPath(); x.moveTo(X, Y - 1.3); x.lineTo(X + 1.2, Y); x.lineTo(X, Y + 1.3); x.lineTo(X - 1.2, Y); x.closePath(); x.fill(); }
    // faja de tela con caídas que se mecen
    const sc = shade(Lk.lining, -0.38), bg = x.createLinearGradient(0, -40.5, 0, -33.5); bg.addColorStop(0, shade(Lk.lining, -0.2)); bg.addColorStop(1, shade(Lk.lining, -0.62));
    if (view !== 'back') { const sd = fx > 0.3 ? -1 : 1, bx = sd * wa * 0.55, sw2 = Math.sin(t * 2.2) * 1.4 + sway * 0.5;
      for (const [o, ln, wd] of [[0, 21, 2.6], [sd * 2.6, 16, 2.1]]) { x.beginPath(); x.moveTo(bx + o - wd / 2, -35); x.quadraticCurveTo(bx + o - wd / 2 + sw2 * 0.4, -35 + ln * 0.5, bx + o - wd / 2 - 0.5 + sw2, -35 + ln); x.lineTo(bx + o + wd / 2 + 0.5 + sw2, -35 + ln); x.quadraticCurveTo(bx + o + wd / 2 + sw2 * 0.4, -35 + ln * 0.5, bx + o + wd / 2, -35); x.closePath(); x.fillStyle = sc; x.fill(); x.strokeStyle = 'rgba(0,0,8,0.45)'; x.lineWidth = 0.6; x.stroke(); x.fillStyle = Lk.trim; x.fillRect(bx + o - wd / 2 - 0.5 + sw2, -35 + ln - 1.6, wd + 1, 1.6); }
    }
    x.beginPath(); x.moveTo(-wa - 3, -40.2); x.quadraticCurveTo(0, -37, wa + 3, -40.2); x.lineTo(wa + 3, -34.6); x.quadraticCurveTo(0, -31, -wa - 3, -34.6); x.closePath(); x.fillStyle = bg; x.fill();
    x.strokeStyle = rgbaOf(Lk.trim, 0.8); x.lineWidth = 0.75; x.beginPath(); x.moveTo(-wa - 3, -40.2); x.quadraticCurveTo(0, -37, wa + 3, -40.2); x.moveTo(-wa - 3, -34.6); x.quadraticCurveTo(0, -31, wa + 3, -34.6); x.stroke();
    // luz de las manos sobre la tela
    if (glows) { x.globalCompositeOperation = 'lighter'; for (const [gx, gy, col] of glows) { const lg = x.createRadialGradient(gx, gy, 0, gx, gy, 32); lg.addColorStop(0, col + '70'); lg.addColorStop(1, col + '00'); x.fillStyle = lg; x.fillRect(gx - 32, gy - 32, 64, 64); } x.globalCompositeOperation = 'source-over'; }
    x.restore();
    if (view !== 'back') pectoral(x, Lk.pect, fx * 2, -35.6, t, 0.86);
    // luz de luna en el borde izquierdo
    x.strokeStyle = 'rgba(205,222,255,0.4)'; x.lineWidth = 1.15; x.beginPath(); x.moveTo(-sh + fx + 1, top + 4); x.bezierCurveTo(-sh + fx - 0.4, top + 12, -wa + 0.6 + fx * 0.6, -45, -wa + 1 + fx * 0.6, -38); x.bezierCurveTo(-wa + 0.4, -27, -hem * 0.8 + sway * 0.3 + 1, -15, -hem + sway + 1, bot - 3); x.stroke();
    // ribete grueso del ruedo
    x.strokeStyle = Lk.trim; x.lineWidth = 1.7; x.lineJoin = 'round'; x.beginPath(); hemLine(x, hem, bot, sway, t, -1.3, true); x.stroke();
  }
  // manto sobre los hombros: esclavina con pico al frente, doble ribete, cuentas y broche con gema
  function mantle(x, Lk, fx, B, t, view) {
    const w = 19.5 * B, back = view === 'back', cy = back ? -45.5 : -41.5, g = x.createLinearGradient(0, -69, 0, -42); g.addColorStop(0, shade(Lk.cape, 0.2)); g.addColorStop(0.55, shade(Lk.cape, -0.06)); g.addColorStop(1, shade(Lk.cape, -0.4));
    const edge = d => { x.moveTo(-w + fx + d, -48.5 - d * 0.4); x.quadraticCurveTo(-w * 0.55 + fx, -43.2 - d, fx, cy - d); x.quadraticCurveTo(w * 0.55 + fx, -43.2 - d, w + fx - d, -48.5 - d * 0.4); };
    x.beginPath(); x.moveTo(w + fx, -48.5); x.bezierCurveTo(w + 2.6 + fx, -59, 10.5 + fx, -67, fx + 5, -67); x.lineTo(fx - 5, -67); x.bezierCurveTo(-10.5 + fx, -67, -w - 2.6 + fx, -59, -w + fx, -48.5);
    x.quadraticCurveTo(-w * 0.55 + fx, -43.2, fx, cy); x.quadraticCurveTo(w * 0.55 + fx, -43.2, w + fx, -48.5); x.closePath(); fillInk(x, g, Lk.cape, 1.15);
    x.save(); x.clip();
    if (Lk.capeMat) matOn(x, Lk.capeMat, Lk.capeC, -w - 4 + fx, -69, w * 2 + 8, 30, t);
    // hombros redondos: brillo de luna a la izquierda, sombra a la derecha y bajo la capucha
    const hl = x.createRadialGradient(fx - w * 0.6, -60, 0, fx - w * 0.6, -58, 9 * B); hl.addColorStop(0, 'rgba(215,228,255,0.3)'); hl.addColorStop(1, 'rgba(215,228,255,0)'); x.fillStyle = hl; x.fillRect(fx - w - 4, -70, w + 8, 30);
    const sg = x.createLinearGradient(fx, 0, fx + w + 2, 0); sg.addColorStop(0, 'rgba(0,0,12,0)'); sg.addColorStop(1, 'rgba(0,0,12,0.44)'); x.fillStyle = sg; x.fillRect(fx, -70, w + 4, 30);
    const ao = x.createRadialGradient(fx, -66, 3, fx, -64, 15); ao.addColorStop(0, 'rgba(0,0,10,0.55)'); ao.addColorStop(1, 'rgba(0,0,10,0)'); x.fillStyle = ao; x.fillRect(fx - 16, -70, 32, 22);
    for (const s of [-1, 1]) fold(x, fx + s * 6.5, -64, fx + s * w * 0.74, -45.5, 2.2, s < 0 ? 0.2 : 0.3, s < 0 ? 0.1 : 0);
    x.restore();
    x.strokeStyle = Lk.trim; x.lineWidth = 1.5; x.lineJoin = 'round'; x.beginPath(); edge(0.6); x.stroke();
    x.strokeStyle = rgbaOf(Lk.trim, 0.45); x.lineWidth = 0.6; x.beginPath(); edge(2.6); x.stroke();
    // cuentas que cuelgan del pico y de los lados
    x.fillStyle = Lk.trim; for (const [bx, by] of [[fx, cy + 1.6], [fx - w * 0.52, -42.2], [fx + w * 0.52, -42.2]]) { x.beginPath(); x.arc(bx, by + Math.sin(t * 3 + bx) * 0.3, 1.05, 0, TAU); x.fill(); }
    if (!back) {
      // broche: gema del color del forro engastada en oro
      const bx = fx, by = -47.2; x.fillStyle = '#7a4a08'; x.beginPath(); x.arc(bx, by, 3.1, 0, TAU); x.fill();
      const og = x.createLinearGradient(bx - 3, by - 3, bx + 3, by + 3); og.addColorStop(0, '#fff2a8'); og.addColorStop(0.5, '#e8b130'); og.addColorStop(1, '#8a5a10'); x.fillStyle = og; x.beginPath(); x.arc(bx, by, 2.7, 0, TAU); x.fill();
      const gg = x.createRadialGradient(bx - 0.6, by - 0.7, 0, bx, by, 1.9); gg.addColorStop(0, '#ffffff'); gg.addColorStop(0.35, Lk.lining); gg.addColorStop(1, shade(Lk.lining, -0.6)); x.fillStyle = gg; x.beginPath(); x.arc(bx, by, 1.75, 0, TAU); x.fill();
      x.save(); x.globalCompositeOperation = 'lighter'; const p = 0.5 + 0.5 * Math.sin(t * 2.4); const lg = x.createRadialGradient(bx, by, 0, bx, by, 6); lg.addColorStop(0, rgbaOf(Lk.lining, 0.35 + p * 0.25)); lg.addColorStop(1, rgbaOf(Lk.lining, 0)); x.fillStyle = lg; x.beginPath(); x.arc(bx, by, 6, 0, TAU); x.fill(); x.restore();
    }
  }
  // mano abierta hacia arriba, con los dedos curvados sosteniendo el orbe
  function hand(x, Lk, X, Y, behind) {
    const sk0 = Lk.skin.length === 7 ? Lk.skin : '#806050', sk = behind ? shade(sk0, -0.45) : sk0;
    x.lineCap = 'round'; x.strokeStyle = ink(sk0, 0.75); x.lineWidth = 2; for (const k of [-1.5, -0.5, 0.5, 1.5]) { x.beginPath(); x.moveTo(X + k * 1.5, Y + 0.8); x.quadraticCurveTo(X + k * 2.5, Y - 1.2, X + k * 2.9, Y - 2.9); x.stroke(); }
    x.fillStyle = sk; x.beginPath(); x.ellipse(X, Y + 1.5, 3.3, 2, 0, 0, TAU); x.fill(); x.strokeStyle = ink(sk0, 0.75); x.lineWidth = 0.5; x.stroke();
    x.strokeStyle = sk; x.lineWidth = 1.25; for (const k of [-1.5, -0.5, 0.5, 1.5]) { x.beginPath(); x.moveTo(X + k * 1.5, Y + 0.8); x.quadraticCurveTo(X + k * 2.5, Y - 1.2, X + k * 2.9, Y - 2.9); x.stroke(); }
    x.fillStyle = 'rgba(255,255,255,0.22)'; x.beginPath(); x.ellipse(X - 0.8, Y + 1, 1.6, 0.7, 0, 0, TAU); x.fill(); x.lineCap = 'butt';
  }
  // brazo con manga de mago: estrecha en el hombro, boca ancha que cuelga, forro de color y ribete
  function arm(x, Lk, sx, sy, hx, hy, B, behind) {
    const side = sx < 0 ? -1 : 1, up = clamp(1 - (hy - sy) / 24, 0, 1), mx = (sx + hx) / 2 + side * (5 - up * 1.5) * B, my = lerp((sy + hy) / 2 + 2.5, Math.max(sy, hy) + 12 * B, up);
    const N = 8, F = 0.84, Lp = [], Rp = []; let lastP = [hx, hy], hz = 1;
    for (let i = 0; i <= N; i++) {
      const f = i / N * F, u = 1 - f, px = u * u * sx + 2 * u * f * mx + f * f * hx, py = u * u * sy + 2 * u * f * my + f * f * hy;
      const tx = 2 * u * (mx - sx) + 2 * f * (hx - mx), ty = 2 * u * (my - sy) + 2 * f * (hy - my), l = hypot(tx, ty) || 1, nx = -ty / l, ny = tx / l, q = i / N;
      const w = (4.3 - Math.sin(q * Math.PI) * 0.7 + Math.pow(q, 2.4) * 4.4) * B; Lp.push([px + nx * w, py + ny * w]); Rp.push([px - nx * w, py - ny * w]); lastP = [px, py]; hz = Math.abs(tx) / l;
    }
    // la boca de la manga cuelga por su lado de abajo
    const low = Lp[N][1] > Rp[N][1] ? Lp : Rp; for (let i = 3; i <= N; i++) low[i][1] += 6.5 * B * hz * Math.pow((i - 2) / (N - 2), 2.2);
    x.beginPath(); x.moveTo(Lp[0][0], Lp[0][1]); for (let i = 1; i <= N; i++) x.lineTo(Lp[i][0], Lp[i][1]); for (let i = N; i >= 0; i--) x.lineTo(Rp[i][0], Rp[i][1]); x.closePath();
    const g = x.createLinearGradient(sx, sy - 4, sx, Math.max(sy, hy) + 10); g.addColorStop(0, shade(Lk.robe, behind ? -0.3 : 0.2)); g.addColorStop(0.5, shade(Lk.robe, behind ? -0.45 : -0.04)); g.addColorStop(1, shade(Lk.robe, behind ? -0.62 : -0.42));
    fillInk(x, g, Lk.robe, 1.05);
    if (Lk.mat) { x.save(); x.clip(); matOn(x, Lk.mat, Lk.matC, Math.min(sx, hx) - 12, Math.min(sy, hy) - 12, Math.abs(hx - sx) + 24, Math.abs(hy - sy) + 34, performance.now() / 1000); x.restore(); }
    // pliegues de la manga
    x.strokeStyle = 'rgba(0,0,10,0.3)'; x.lineWidth = 0.9; x.beginPath(); for (const [i0, f0, i1, f1] of [[2, 0.5, N, 0.3], [4, 0.72, N, 0.62]]) { x.moveTo(lerp(Lp[i0][0], Rp[i0][0], f0), lerp(Lp[i0][1], Rp[i0][1], f0)); x.quadraticCurveTo(lerp(Lp[i1 - 2][0], Rp[i1 - 2][0], (f0 + f1) / 2), lerp(Lp[i1 - 2][1], Rp[i1 - 2][1], (f0 + f1) / 2), lerp(Lp[i1][0], Rp[i1][0], f1), lerp(Lp[i1][1], Rp[i1][1], f1)); } x.stroke();
    if (!behind) { x.strokeStyle = 'rgba(255,255,255,0.12)'; x.lineWidth = 0.9; x.beginPath(); const hi = low === Lp ? Rp : Lp; x.moveTo(hi[1][0], hi[1][1] + 1.2); for (let i = 2; i < N; i++) x.lineTo(hi[i][0], hi[i][1] + 1.2); x.stroke(); }
    // boca de la manga: forro por dentro y aro de ribete
    const a = Lp[N], b = Rp[N], cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2, rw = hypot(a[0] - b[0], a[1] - b[1]) / 2, ra = Math.atan2(a[1] - b[1], a[0] - b[0]);
    const lg = x.createRadialGradient(cx, cy, 0, cx, cy, rw); lg.addColorStop(0, shade(Lk.lining, -0.75)); lg.addColorStop(1, behind ? shade(Lk.lining, -0.5) : shade(Lk.lining, -0.08));
    x.fillStyle = lg; x.beginPath(); x.ellipse(cx, cy, rw, 2.7 * B, ra, 0, TAU); x.fill(); x.strokeStyle = behind ? shade(Lk.trim, -0.4) : Lk.trim; x.lineWidth = 1.15; x.stroke();
    // antebrazo y mano
    x.strokeStyle = shade(Lk.skin.length === 7 ? Lk.skin : '#806050', behind ? -0.5 : -0.2); x.lineWidth = 2.6; x.lineCap = 'round'; x.beginPath(); x.moveTo(cx, cy); x.lineTo(hx, hy + 2); x.stroke(); x.lineCap = 'butt';
    hand(x, Lk, hx, hy + 1, behind);
  }
  function boots(x, Lk, m, t, B) {
    const st = m.moving > 40 ? Math.sin(m.walk) * 4 : 0;
    for (const [s, k] of [[-1, st], [1, -st]]) { const bx = s * 5.5 * B + k * 0.5, by = -1.6 - Math.max(0, k) * 0.5; x.fillStyle = '#120c0a'; x.beginPath(); x.ellipse(bx, by, 4, 2.5, 0, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,255,255,0.14)'; x.beginPath(); x.ellipse(bx - 1, by - 0.9, 1.8, 0.7, 0, 0, TAU); x.fill(); }
  }
  /* ---------- aura de partículas del elemento ---------- */
  function aura(m, Lk, dt) {
    if (LOWFX && Math.random() < 0.5) return;
    const k = Lk.aura, r = Math.random;
    if (r() > dt * (m.moving > 40 ? 7 : 3.5)) return;
    const a0 = r() * TAU, x = m.x + Math.cos(a0) * 24, y = m.y + Math.sin(a0) * 9;
    if (k === 'ember') FX.P({ x, y, z: 4 + r() * 12, vz: 30 + r() * 40, g: -20, vx: (r() - 0.5) * 20, life: 0.6 + r() * 0.6, size: 1.6, color: r() < 0.5 ? '#ffcf6a' : '#ff7a2a', kind: 'ember' });
    else if (k === 'drop') FX.P({ x, y, z: 6 + r() * 14, vz: 40, g: 160, life: 0.5, size: 1.5, color: '#9fe6ff', kind: 'drop', add: false });
    else if (k === 'leaf') FX.P({ x, y, z: 6 + r() * 14, vz: 10, g: 20, vx: (r() - 0.5) * 30, life: 1.2, size: 2.4, color: r() < 0.5 ? '#7ec85a' : '#c3cfac', kind: 'leaf', add: false });
    else if (k === 'ash') FX.P({ x, y, z: 20 + r() * 30, vz: 20, g: -10, vx: (r() - 0.5) * 16, life: 1.2, size: 1.8, color: r() < 0.3 ? '#ff8a3a' : 'rgba(120,110,110,0.8)', kind: r() < 0.3 ? 'ember' : 'flake', add: r() < 0.3 });
    else if (k === 'petal') FX.P({ x, y, z: 6 + r() * 14, vz: 8, g: 25, vx: (r() - 0.5) * 30, life: 1.3, size: 2.2, color: r() < 0.5 ? '#ffc6dc' : '#ffffff', kind: 'leaf', add: false });
    else if (k === 'snow') FX.P({ x, y, z: 30 + r() * 60, vz: -20, g: 30, vx: (r() - 0.5) * 30, life: 0.9 + r() * 0.6, size: 2, color: r() < 0.5 ? '#ffffff' : '#bfeaff', kind: 'flake', add: false });
    else if (k === 'dust') FX.P({ x, y, z: 2 + r() * 8, vz: 14, g: -4, vx: (r() - 0.5) * 40, life: 0.7 + r() * 0.5, size: 5 + r() * 5, color: 'rgba(214,170,110,0.3)', kind: 'smoke', add: false });
    else if (k === 'glint') FX.P({ x, y, z: 6 + r() * 40, vz: 26 + r() * 30, g: -14, vx: (r() - 0.5) * 14, life: 0.7 + r() * 0.6, size: 1.5, color: r() < 0.5 ? '#fff6c0' : '#ffd25a', kind: 'ember' });
    else if (k === 'stardust') FX.P({ x, y, z: 10 + r() * 60, vz: 6, g: 4, vx: (r() - 0.5) * 20, life: 0.5 + r() * 0.7, size: 1.3, color: r() < 0.5 ? '#ffffff' : '#b9c4ff', kind: 'ember' });
    else if (k === 'shade') FX.P({ x, y, z: 4 + r() * 18, vz: 24, g: -8, vx: (r() - 0.5) * 20, life: 0.8 + r() * 0.5, size: 5 + r() * 4, color: r() < 0.25 ? 'rgba(196,67,166,0.35)' : 'rgba(30,10,40,0.45)', kind: 'smoke', add: false });
    else if (k === 'spark') FX.P({ x, y, z: 20 + r() * 50, vz: 0, g: 0, vx: (r() - 0.5) * 80, vy: (r() - 0.5) * 40, life: 0.15 + r() * 0.15, size: 1.6, color: '#efe6ff', kind: 'streak' });
  }
  /* ---------- el mago completo ---------- */
  function figure(x, G, m, Lk, t, dt) {
    const fx = Math.cos(m.face), fy = Math.sin(m.face), view = fy < -0.55 ? 'back' : Math.abs(fx) > 0.75 ? 'side' : 'front';
    const moving = m.moving > 40, B = Lk.build, S = Lk.scale;
    const bob = Lk.float ? Math.sin(t * 3) * 2.6 - 6 : moving ? -Math.abs(Math.sin(m.walk)) * 2.2 : Math.sin(t * 2) * 0.6;
    const lean = clamp(m.vx * 0.0009, -0.12, 0.12), sway = clamp(-m.vx * 0.014, -6, 6);
    const H = m.hands, h0 = H[0].hold, h1 = H[1].hold, fa = m.fullAt || HOLD_FULL;
    if (m._show) { /* menú: el estrado hace de círculo */ }
    else if (m.fuse) runeRing(x, 34, t, H[0].el, H[1].el, Math.max(h0, h1) > 0.12);
    else if (h0 >= 0 || h1 >= 0) { const k = h0 >= 0 ? 0 : 1, hh = H[k].hold; runeRing(x, 22 + Math.min(1, hh / fa) * 14, t, H[k].el, null, hh >= fa); }
    if (m.absorbing) { const s = m.absorbing, E = EC(s.s.el); x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = E.c1; x.lineWidth = 3; x.beginPath(); x.arc(0, -36, 32, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(s.t, 0, 1)); x.stroke(); x.restore(); }
    if (m.dash.t > 0) { x.save(); x.globalCompositeOperation = 'lighter'; const col = PLAYER_COLORS[m.idx] ? PLAYER_COLORS[m.idx].main : '#fff'; for (let k = 1; k <= 4; k++) { x.globalAlpha = 0.28 - k * 0.05; x.fillStyle = col; x.beginPath(); x.ellipse(-m.dash.dx * k * 13, -38 - m.dash.dy * k * 13, 13 * B, 34, 0, 0, TAU); x.fill(); } x.restore(); }
    x.translate(0, bob); x.scale(S, S); x.rotate(lean);
    // dónde van las manos
    const handPos = k => {
      const side = k === 0 ? -1 : 1, hold = H[k].hold;
      if (m.granCharge > 0) { const c = 1 - m.granCharge / GRAN_CHARGE; return [side * (24 - c * 17) * B, -60 - c * 30 + Math.sin(t * 14 + k) * 1.5]; }
      if (m.fuse) return [fx * 14 + side * 5 + Math.cos(t * 9 + k * Math.PI) * 4, -46 + fy * 4 + Math.sin(t * 9 + k * Math.PI) * 3];
      if (m.castT > 0 && (m.castHand === k || m.castHand === 2)) { const f = m.castT / 0.3; return [side * 10 + fx * 24 * f, -38 + fy * 12 * f]; }
      if (hold >= 0) { const c = Math.min(1, hold / fa); return [side * (24.5 + c * 2.5) * B, -47 - c * 13 + Math.sin(t * 12) * (hold >= fa ? 1.2 : 0)]; }
      return [side * 18.5 * B + (moving ? Math.sin(m.walk + k * Math.PI) * 2.5 : 0), -34 + Math.sin(t * 2.4 + k) * 1.2];
    };
    const hp = [handPos(0), handPos(1)], shoulder = k => [(k === 0 ? -1 : 1) * 14.8 * B + fx * 1.5, -57.5];
    const drawArm = (k, behind) => { const [sx, sy] = shoulder(k), [hx, hy] = hp[k]; arm(x, Lk, sx, sy, hx, hy, B, behind); };
    const drawOrb = k => { const [hx, hy] = hp[k], hold = H[k].hold, r = 5 + (hold >= 0 ? Math.min(1, hold / fa) * 2.8 : 0) + (m.fuse ? 1.6 : 0); orb(x, hx, hy - 3, H[k].el, r, hold >= fa || m.fuse, t + k); if (H[k].uses > 0) { x.fillStyle = '#fff'; for (let u = 0; u < H[k].uses; u++) { x.beginPath(); x.arc(hx - 4 + u * 4, hy + r + 3, 1.3, 0, TAU); x.fill(); } } };
    // capa grande
    const C = cloth(m, m.x - fx * 4, m.y - 60 * S + bob, dt, 62, (G.wind ? G.wind.x * 3 : 0) + Math.sin(t * 1.3) * 0.7);
    const capeW = [30 * B, 58 * B];
    if (view !== 'back') drawCape(x, m, Lk, C, capeW[0], capeW[1], false, t);
    if (!Lk.float) boots(x, Lk, m, t, B);
    if (view === 'back') { drawArm(0, true); drawArm(1, true); drawOrb(0); drawOrb(1); }
    else if (view === 'side') { const far = fx > 0 ? 0 : 1; drawArm(far, true); drawOrb(far); }
    const glows = view === 'back' ? null : [0, 1].map(k => [hp[k][0], hp[k][1], EC(H[k].el).c1]);
    robe(x, m, Lk, t, sway, view, fx, B, glows);
    if (Lk.float) { x.save(); x.globalCompositeOperation = 'lighter'; for (let k = 0; k < 4; k++) { const p = (t * 1.2 + k / 4) % 1; x.fillStyle = `rgba(190,170,255,${(1 - p) * 0.35})`; x.beginPath(); x.ellipse((k - 1.5) * 9, -1 + p * 8, 5 * (1 - p), 2.4, 0, 0, TAU); x.fill(); } x.restore(); }
    mantle(x, Lk, fx * 1.5, B, t, view);
    hood(x, m, Lk, fx * (view === 'side' ? 2.5 : 1.5), -76, t, view, fx, glows ? EC(H[0].el).c1 : null);
    if (view === 'back') drawCape(x, m, Lk, C, capeW[0] * 1.1, capeW[1], true, t);
    if (view === 'front') { drawArm(0, false); drawArm(1, false); drawOrb(0); drawOrb(1); }
    else if (view === 'side') { const near = fx > 0 ? 1 : 0; drawArm(near, false); drawOrb(near); }
    return { view, fx, B, moving };
  }
  function draw(x, G, m) {
    const Lk = look(m.cid, m.skin || 0), t = G.time + m.idx * 1.7;
    const now = performance.now() / 1000, dt = clamp(now - (m._lt || now), 0, 0.05); m._lt = now;
    if (G.state !== 'roundEnd' || G.slow <= 0) aura(m, Lk, dt);
    const S = Lk.scale, B = Lk.build;
    if (Lk.trail2 && typeof Vest !== 'undefined') { const key = 'srt' + m.idx + (G.attract ? 'a' : ''); Vest.trailPush(key, m.x, m.y - 26 * S, now, 4); Vest.drawTrail(x, Lk.trail2, key, 7.5, now); }
    x.save(); x.translate(m.x, m.y);
    // sombra suave
    const sg = x.createRadialGradient(0, 2, 2, 0, 2, 24 * S * B); sg.addColorStop(0, 'rgba(6,4,16,0.6)'); sg.addColorStop(1, 'rgba(6,4,16,0)'); x.fillStyle = sg; x.beginPath(); x.ellipse(0, 2, 24 * S * B, 9 * S, 0, 0, TAU); x.fill();
    if (m.st.hidden > 0) x.globalAlpha = 0.32;
    // Embrujo lleno: círculo dorado que gira, columna de luz y chispas — todos ven que viene un Gran Sortilegio
    const ready = m.emb >= 100;
    if (ready) {
      x.save(); x.globalCompositeOperation = 'lighter'; const pz = 0.75 + 0.25 * Math.sin(t * 6);
      x.strokeStyle = `rgba(255,215,120,${0.8 * pz})`; x.lineWidth = 2.4; x.beginPath(); x.ellipse(0, 0, 30 * B, 12, 0, 0, TAU); x.stroke();
      x.lineWidth = 1.2; x.beginPath(); x.ellipse(0, 0, 24 * B, 9.5, 0, 0, TAU); x.stroke();
      x.font = fontB(8, 900); x.fillStyle = `rgba(255,236,170,${pz})`; x.textAlign = 'center'; x.textBaseline = 'middle'; for (let k = 0; k < 8; k++) { const a = t * 1.8 + k / 8 * TAU; x.fillText('◆✦◇✧'[k % 4], Math.cos(a) * 27 * B, Math.sin(a) * 10.8); }
      const cg = x.createLinearGradient(0, 0, 0, -120); cg.addColorStop(0, `rgba(255,210,110,${0.32 * pz})`); cg.addColorStop(1, 'rgba(255,210,110,0)'); x.fillStyle = cg; x.beginPath(); x.moveTo(-24 * B, 0); x.lineTo(-12 * B, -120); x.lineTo(12 * B, -120); x.lineTo(24 * B, 0); x.closePath(); x.fill();
      x.restore();
      if (Math.random() < dt * 14) FX.P({ x: m.x + (Math.random() - 0.5) * 40, y: m.y + (Math.random() - 0.5) * 12, z: 4 + Math.random() * 30, vz: 50 + Math.random() * 50, g: -20, life: 0.8, size: 1.8, color: Math.random() < 0.5 ? '#fff2b0' : '#ffd36a', kind: 'ember' });
    }
    // Gran Sortilegio: sello gigante en el suelo, columna de luz y el mago que se eleva
    const gch = m.granCharge > 0, gk = gch ? 1 : clamp((m.granGlow || 0) / 1.1, 0, 1);
    let lev = 0;
    if (gk > 0) {
      const els = m.granEls || CHARS[m.cid].hands, E1 = EC(els[0]), E2 = EC(els[1]), c = gch ? 1 - m.granCharge / GRAN_CHARGE : 1, R = (58 + 64 * smooth(c)) * (gch ? 1 : 1 + (1 - gk) * 0.35);
      lev = gch ? 16 * smooth(Math.min(1, c * 1.6)) : 16 * Math.max(0, gk - 0.6) / 0.4;
      x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = gk;
      const fl = x.createRadialGradient(0, 0, 0, 0, 0, R * 1.3); fl.addColorStop(0, 'rgba(255,220,130,0.5)'); fl.addColorStop(0.5, E1.c1 + '33'); fl.addColorStop(1, 'rgba(255,220,130,0)'); x.fillStyle = fl; x.beginPath(); x.ellipse(0, 0, R * 1.3, R * 0.52, 0, 0, TAU); x.fill();
      x.save(); x.scale(1, 0.4);
      const ring = (r, col, lw) => { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.arc(0, 0, r, 0, TAU); x.stroke(); };
      ring(R, '#ffe9a0', 3.2); ring(R * 0.93, E1.c1, 1.4); ring(R * 0.62, E2.c1, 2.2); ring(R * 0.3, '#fff3c4', 1.6);
      x.save(); x.rotate(t * 1.6); x.fillStyle = '#ffe9a0'; x.font = fontB(Math.max(9, R * 0.13), 900); x.textAlign = 'center'; x.textBaseline = 'middle'; for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; x.save(); x.translate(Math.cos(a) * R * 0.78, Math.sin(a) * R * 0.78); x.rotate(a + Math.PI / 2); x.fillText('ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊ'[k], 0, 0); x.restore(); } x.restore();
      x.save(); x.rotate(-t * 1.1); x.strokeStyle = E2.c0; x.lineWidth = 1.6; for (let q = 0; q < 2; q++) { x.beginPath(); for (let k = 0; k <= 3; k++) { const a = k / 3 * TAU + q * Math.PI / 3; k ? x.lineTo(Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6) : x.moveTo(Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6); } x.stroke(); } x.restore();
      x.restore();
      // columna de luz
      const ph = 230, pw = 26 * B * (gch ? 0.6 + 0.4 * c : gk), pg = x.createLinearGradient(0, 0, 0, -ph); pg.addColorStop(0, `rgba(255,236,170,${0.55 * gk})`); pg.addColorStop(0.6, E1.c1 + '30'); pg.addColorStop(1, 'rgba(255,236,170,0)');
      x.fillStyle = pg; x.beginPath(); x.moveTo(-pw, 0); x.lineTo(-pw * 0.4, -ph); x.lineTo(pw * 0.4, -ph); x.lineTo(pw, 0); x.closePath(); x.fill();
      x.restore();
      if (gch && Math.random() < dt * 40) { const a = Math.random() * TAU, d = 50 + Math.random() * 60; FX.P({ x: m.x + Math.cos(a) * d, y: m.y + Math.sin(a) * d * 0.45, z: 6, vx: -Math.cos(a) * d * 1.8, vy: -Math.sin(a) * d * 0.8, vz: 60 + Math.random() * 90, g: -30, drag: 1, life: 0.5, size: 2.2, color: Math.random() < 0.5 ? '#ffe9a0' : (Math.random() < 0.5 ? E1.c0 : E2.c0), kind: 'ember' }); }
    }
    if (lev) x.translate(0, -lev);
    if (Lk.aura2) Vest.drawAura(x, Lk.aura2, 0, -40 * S, 33 * S, t, 0);
    const { fx, moving } = figure(x, G, m, Lk, t, dt);
    if (Lk.aura2) Vest.drawAura(x, Lk.aura2, 0, -40 * S, 33 * S, t, 1);
    if (ready) { x.save(); x.globalCompositeOperation = 'lighter'; const gg = x.createRadialGradient(0, -46, 4, 0, -46, 56); gg.addColorStop(0, 'rgba(255,220,130,0.22)'); gg.addColorStop(1, 'rgba(255,220,130,0)'); x.fillStyle = gg; x.beginPath(); x.ellipse(0, -46, 34 * B, 58, 0, 0, TAU); x.fill(); x.restore(); }
    // estados
    if (m.st.frozen > 0) { const ig = x.createLinearGradient(-22, -96, 22, 4); ig.addColorStop(0, 'rgba(230,250,255,0.75)'); ig.addColorStop(1, 'rgba(140,210,240,0.55)'); x.beginPath(); x.moveTo(-22, 3); x.lineTo(-26, -52); x.lineTo(-11, -98); x.lineTo(13, -96); x.lineTo(26, -50); x.lineTo(22, 3); x.closePath(); x.fillStyle = ig; x.fill(); x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 1.5; x.stroke(); x.beginPath(); x.moveTo(-11, -98); x.lineTo(-4, -46); x.lineTo(13, -96); x.stroke(); }
    if (m.st.wet > 0 && m.st.frozen <= 0) { for (let k = 0; k < 4; k++) { const p = (t * 1.5 + k / 4) % 1; x.fillStyle = `rgba(160,220,255,${0.9 - p * 0.6})`; x.beginPath(); x.ellipse(-12 + k * 8, -60 + p * 54, 1.3, 2.4, 0, 0, TAU); x.fill(); } x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = 'rgba(80,160,255,0.12)'; x.beginPath(); x.ellipse(0, -40, 19, 38, 0, 0, TAU); x.fill(); x.restore(); }
    if (m.st.burn > 0) { x.save(); x.globalCompositeOperation = 'lighter'; for (let k = 0; k < 5; k++) { const p = (t * 2.2 + k / 5) % 1; x.fillStyle = `rgba(255,${170 - p * 110},40,${(1 - p) * 0.9})`; x.beginPath(); x.ellipse(-12 + k * 6 + Math.sin(t * 9 + k) * 2, -12 - p * 54, 3.4 * (1 - p * 0.5), 5 * (1 - p * 0.5), 0, 0, TAU); x.fill(); } x.restore(); }
    if (m.st.root > 0) { x.strokeStyle = '#2e5e2a'; x.lineWidth = 3.4; for (let k = -2; k <= 2; k++) { x.beginPath(); x.moveTo(k * 6, 3); x.bezierCurveTo(k * 14, -6, k * 2, -16, k * 7, -26); x.stroke(); } x.fillStyle = '#7ec85a'; for (let k = -2; k <= 2; k++) { x.beginPath(); x.ellipse(k * 9, -14, 3.4, 1.6, k, 0, TAU); x.fill(); } }
    if (m.st.stun > 0) for (let k = 0; k < 3; k++) { const a = t * 6 + k / 3 * TAU; x.fillStyle = '#ffe9a0'; x.beginPath(); x.arc(Math.cos(a) * 14, -100 + Math.sin(a) * 4, 2.2, 0, TAU); x.fill(); }
    if (m.st.chill > 0) { x.fillStyle = 'rgba(230,250,255,0.9)'; for (let k = 0; k < 3; k++) x.fillRect(Math.sin(t * 5 + k * 3) * 16, -70 + ((t * 30 + k * 20) % 66), 2, 2); }
    if (m.st.hex > 0) { x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(214,84,180,${0.55 + 0.3 * Math.sin(t * 7)})`; x.lineWidth = 1.6; x.translate(0, -112); x.rotate(t * 1.6); x.beginPath(); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; x.moveTo(Math.cos(a) * 9, Math.sin(a) * 9 * 0.6); x.lineTo(Math.cos(a + 2.1) * 9, Math.sin(a + 2.1) * 9 * 0.6); } x.stroke(); x.beginPath(); x.ellipse(0, 0, 10, 6, 0, 0, TAU); x.stroke(); x.restore(); x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = 'rgba(170,50,150,0.10)'; x.beginPath(); x.ellipse(0, -44, 20, 46, 0, 0, TAU); x.fill(); x.restore(); }
    if (m.st.silence > 0) { x.save(); x.translate(0, -98); x.fillStyle = 'rgba(20,6,26,0.8)'; x.beginPath(); x.arc(0, 0, 8.5, 0, TAU); x.fill(); x.strokeStyle = '#e06ac8'; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 7, 0, TAU); x.moveTo(-5, 5); x.lineTo(5, -5); x.stroke(); x.restore(); }
    if (m.st.blind > 0) { x.fillStyle = 'rgba(210,170,110,0.8)'; x.fillRect(-11 + fx * 2, -79, 22, 5); }
    if (m.buff && m.buff.shield > 0) { x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = `rgba(255,233,160,${0.45 + 0.25 * Math.sin(t * 6)})`; x.lineWidth = 2; x.beginPath(); x.ellipse(0, -44, 26 * B, 50, 0, 0, TAU); x.stroke(); x.restore(); }
    if (m.buff && m.buff.haste > 0 && moving) { x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = 'rgba(160,240,255,0.5)'; x.lineWidth = 1.5; for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(-m.vx * 0.05 - 8 + k * 8, -60 + k * 16); x.lineTo(-m.vx * 0.11 - 8 + k * 8, -60 + k * 16 - m.vy * 0.05); x.stroke(); } x.restore(); }
    if (m.flash > 0) { x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = m.flash / 0.16 * 0.75; const fg = x.createRadialGradient(0, -44, 2, 0, -44, 44); fg.addColorStop(0, '#ffffff'); fg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = fg; x.beginPath(); x.ellipse(0, -44, 22 * B, 50, 0, 0, TAU); x.fill(); x.restore(); }
    if (m._healT > 0) { m._healT -= 1 / 60; x.save(); x.globalCompositeOperation = 'lighter'; x.fillStyle = 'rgba(140,255,150,0.7)'; x.font = fontB(12); x.fillText('+', Math.sin(t * 7) * 12, -98 - (t * 40 % 20)); x.restore(); }
    x.restore();
  }
  // marca del jugador, mira y punto de caída (encima de la luz)
  function marker(x, G, m, z) {
    if (!m.alive) return; const col = PLAYER_COLORS[m.idx] ? PLAYER_COLORS[m.idx].main : '#fff', S = L[m.cid].scale * L[m.cid].build;
    x.save(); x.translate(m.x, m.y);
    x.strokeStyle = col; x.globalAlpha = m.st.hidden > 0 ? 0.3 : 0.9; x.lineWidth = 2.2 / Math.max(0.6, z);
    x.beginPath(); x.ellipse(0, 1, 21 * S, 8.5 * S, 0, 0.15, Math.PI - 0.15); x.stroke();
    x.fillStyle = col; const a = m.face; x.beginPath(); x.moveTo(Math.cos(a) * 33, Math.sin(a) * 13 + 1); x.lineTo(Math.cos(a + 0.28) * 26, Math.sin(a + 0.28) * 10 + 1); x.lineTo(Math.cos(a - 0.28) * 26, Math.sin(a - 0.28) * 10 + 1); x.fill();
    const tag = G.players === 1 && m.idx === 1 && G.mode !== 'camp' ? 'CPU' : m.ctrl && G.mode === 'camp' ? 'COMPA' : `J${m.idx + 1}`, fs = Math.max(11, 12 / Math.max(0.55, z));
    const ty = -(L[m.cid].head === 'rosette' ? 122 : L[m.cid].head === 'hood' ? 116 : 108) * L[m.cid].scale;
    x.font = fontB(fs, 900); x.textAlign = 'center'; x.globalAlpha = 0.95;
    x.fillStyle = 'rgba(10,8,25,0.6)'; x.fillText(tag, 1, ty + 1); x.fillStyle = col; x.fillText(tag, 0, ty);
    x.restore();
    // mira: a quién va el hechizo (solo personas)
    if (m.ctrl || G.attract || m.st.blind > 0 || G.state === 'roundEnd') return;
    const charging = m.holding || m.fuse, ai = m.aim(G, 700), tg = ai.target;
    x.save();
    if (tg) {
      const lk = charging && tg === m.lockOn, pinned = m.pin && m.pin.u === tg && G.time < m.pin.until, fl = m._retT > 0 ? m._retT / 0.35 : 0;
      const r = ((tg.r || 18) + 10) * (lk ? 1 - 0.08 * Math.sin(G.time * 10) : 1) * (1 + fl * 0.6), rot = lk ? G.time * 3 : 0, lw = 1 / Math.max(0.6, z);
      // línea de mira tenue mientras carga (se ve a quién va)
      if (lk) { x.save(); x.globalAlpha = 0.28; x.strokeStyle = col; x.lineWidth = 2 * lw; x.setLineDash([3, 9]); x.lineDashOffset = -G.time * 40; x.beginPath(); x.moveTo(m.x + Math.cos(ai.ang) * 30, m.y - 22 + Math.sin(ai.ang) * 30); x.lineTo(tg.x - Math.cos(ai.ang) * r, tg.y - 24 - Math.sin(ai.ang) * r); x.stroke(); x.restore(); }
      x.translate(tg.x, tg.y - 24); x.rotate(rot);
      x.strokeStyle = 'rgba(8,6,20,0.55)'; x.lineWidth = (lk ? 5 : 3.6) * lw; x.globalAlpha = lk ? 0.7 : 0.4;
      for (let k = 0; k < 4; k++) { x.rotate(Math.PI / 2); x.beginPath(); x.moveTo(r, -r * 0.45); x.lineTo(r, -r); x.lineTo(r * 0.45, -r); x.stroke(); }
      x.strokeStyle = col; x.globalAlpha = lk ? 1 : pinned ? 0.85 : 0.6; x.lineWidth = (lk ? 2.8 : 2) * lw;
      for (let k = 0; k < 4; k++) { x.rotate(Math.PI / 2); x.beginPath(); x.moveTo(r, -r * 0.45); x.lineTo(r, -r); x.lineTo(r * 0.45, -r); x.stroke(); }
      if (lk || pinned || fl > 0) { x.rotate(-rot); x.fillStyle = col; x.globalAlpha = 0.9; x.beginPath(); x.moveTo(0, -r - 16); x.lineTo(6, -r - 24); x.lineTo(-6, -r - 24); x.closePath(); x.fill(); }
      if (fl > 0) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = fl * 0.7; x.lineWidth = 3 * lw; x.beginPath(); x.arc(0, 0, r * 1.25, 0, TAU); x.stroke(); }
    } else { x.globalAlpha = 0.35; x.strokeStyle = col; x.setLineDash([6, 8]); x.lineWidth = 1.5 / Math.max(0.6, z); x.beginPath(); x.moveTo(m.x + Math.cos(m.face) * 36, m.y - 20 + Math.sin(m.face) * 36); x.lineTo(m.x + Math.cos(m.face) * 150, m.y - 20 + Math.sin(m.face) * 150); x.stroke(); x.setLineDash([]); }
    x.restore();
    if (charging) {
      const k = m.hands[0].hold >= 0 ? 0 : 1, Sp = m.fuse ? (m.hands[0].el === m.hands[1].el ? SPELLS[m.hands[0].el][1] : FUSIONS[fuseKey(m.hands[0].el, m.hands[1].el)]) : SPELLS[m.hands[k].el][1];
      if (['lob', 'meteor', 'mud', 'strike', 'cloud', 'storm', 'magnet', 'turret'].includes(Sp.kind) && (m.fuse || m.hands[k].hold > 0.15)) {
        const range = Sp.range || 300, d = tg ? Math.min(range, hypot(tg.x - m.x, tg.y - m.y)) : range * 0.85, ang = ai.ang, px = m.x + Math.cos(ang) * d, py = m.y + Math.sin(ang) * d, R = Sp.r || (Sp.trap && Sp.trap.r) || 40;
        x.save(); x.strokeStyle = col; x.globalAlpha = 0.7; x.lineWidth = 2 / Math.max(0.6, z); x.setLineDash([8, 6]); x.lineDashOffset = -G.time * 30; x.beginPath(); x.ellipse(px, py, R, R * 0.5, 0, 0, TAU); x.stroke(); x.restore();
      }
    }
  }
  /* ---------- menús: retrato y figura de cuerpo entero ---------- */
  const fakes = {};
  function fake(cid, pose) {
    const k = cid + pose; if (fakes[k]) return fakes[k];
    return (fakes[k] = { cid, idx: 0, face: Math.PI / 2, moving: 0, walk: 0, vx: 0, vy: 0, x: 0, y: 0, hands: CHARS[cid].hands.map(e => ({ el: e, hold: -1, uses: 0 })), st: { hidden: 0, frozen: 0, wet: 0, burn: 0, root: 0, stun: 0, chill: 0, blind: 0 }, dash: { t: 0 }, castT: 0, flash: 0, fuse: false, fullAt: HOLD_FULL });
  }
  const menuG = { time: 0, state: 'menu', wind: null, slow: 0 };
  function portrait(x, cid, X, Y, R, t = 0, skin = 0) {
    const m = fake(cid, 'p'), Lk = look(cid, skin), E = EC(CHARS[cid].hands[0]), E2 = EC(CHARS[cid].hands[1]);
    x.save(); x.beginPath(); x.arc(X, Y, R, 0, TAU); x.clip();
    const g = x.createRadialGradient(X, Y - R * 0.2, 0, X, Y, R * 1.1); g.addColorStop(0, '#2e2656'); g.addColorStop(1, '#07051a'); x.fillStyle = g; x.fillRect(X - R, Y - R, R * 2, R * 2);
    x.globalCompositeOperation = 'lighter';
    for (const [E_, ox] of [[E, -0.55], [E2, 0.55]]) { const g2 = x.createRadialGradient(X + R * ox, Y + R * 0.5, 0, X + R * ox, Y + R * 0.5, R * 0.9); g2.addColorStop(0, E_.c1 + '66'); g2.addColorStop(1, E_.c1 + '00'); x.fillStyle = g2; x.fillRect(X - R, Y - R, R * 2, R * 2); }
    x.globalCompositeOperation = 'source-over';
    const s = R / 21; menuG.time = t;
    x.translate(X, Y - R * 0.02 + 76 * s * Lk.scale); x.scale(s, s);
    m.vx = 0; m.vy = 0; figure(x, menuG, m, Lk, t, 1 / 60);
    x.restore();
  }
  // estrado de piedra con grabados finos que giran (para los menús)
  function dais(x, R, t, E, E2) {
    x.save(); x.scale(1, 0.34);
    const sg = x.createRadialGradient(0, 0, R * 0.1, 0, 0, R * 1.3); sg.addColorStop(0, '#30285a'); sg.addColorStop(0.62, '#17122e'); sg.addColorStop(1, 'rgba(8,6,18,0)');
    x.fillStyle = sg; x.beginPath(); x.arc(0, 0, R * 1.3, 0, TAU); x.fill();
    x.globalCompositeOperation = 'lighter';
    const ring = (r, col, lw, al) => { x.strokeStyle = col; x.globalAlpha = al; x.lineWidth = lw; x.beginPath(); x.arc(0, 0, r, 0, TAU); x.stroke(); };
    ring(R, E.c1, 2, 0.95); ring(R * 0.935, E.c0, 0.8, 0.7); ring(R * 0.62, E2.c1, 1.5, 0.85); ring(R * 0.565, E2.c0, 0.7, 0.6);
    x.save(); x.rotate(t * 0.22); x.strokeStyle = E.c0; x.globalAlpha = 0.7; x.lineWidth = 0.9; for (let k = 0; k < 48; k++) { x.rotate(TAU / 48); x.beginPath(); x.moveTo(R * 0.935, 0); x.lineTo(R * (k % 4 ? 0.9 : 0.85), 0); x.stroke(); }
    x.globalAlpha = 0.9; x.lineWidth = 1; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU, px = Math.cos(a) * R * 0.775, py = Math.sin(a) * R * 0.775, r = R * 0.04; x.beginPath(); if (k % 3 === 0) x.arc(px, py, r, 0, TAU); else if (k % 3 === 1) { x.moveTo(px, py - r); x.lineTo(px + r, py + r); x.lineTo(px - r, py + r); x.closePath(); } else { x.moveTo(px, py - r); x.lineTo(px + r, py); x.lineTo(px, py + r); x.lineTo(px - r, py); x.closePath(); } x.stroke(); }
    x.restore();
    x.save(); x.rotate(-t * 0.16); x.strokeStyle = E2.c0; x.globalAlpha = 0.5; x.lineWidth = 0.9; for (let q = 0; q < 2; q++) { x.beginPath(); for (let k = 0; k <= 3; k++) { const a = k / 3 * TAU + q * Math.PI / 3, px = Math.cos(a) * R * 0.62, py = Math.sin(a) * R * 0.62; k ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); } x.restore();
    x.globalAlpha = 1; const g = x.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, E.c1 + '55'); g.addColorStop(0.6, E2.c1 + '22'); g.addColorStop(1, E.c1 + '00'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.fill();
    x.restore();
  }
  // figura grande con escenario propio, para elegir mago
  function showcase(x, cid, W, H, t, skin = 0) {
    const m = fake(cid, 's'), Lk = look(cid, skin), E = EC(CHARS[cid].hands[0]), E2 = EC(CHARS[cid].hands[1]);
    const s = H / 132, gy = H * 0.84, cx = W / 2, hy = gy - 62 * s;
    x.save();
    const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#090720'); bg.addColorStop(0.62, '#1b1340'); bg.addColorStop(0.84, '#120c2a'); bg.addColorStop(1, '#05030c'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = 'lighter';
    // resplandor de sus dos elementos detrás de la figura
    for (const [E_, ox] of [[E, -0.2], [E2, 0.2]]) { const gx = cx + H * ox, gr = H * 0.72, g = x.createRadialGradient(gx, hy, 0, gx, hy, gr); g.addColorStop(0, E_.c1 + '5c'); g.addColorStop(0.45, E_.c1 + '22'); g.addColorStop(1, E_.c1 + '00'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
    // rayos de luz que bajan en diagonal
    for (const [E_, ox, ph] of [[E, 0.3, 0], [E2, 0.7, 2]]) { x.globalAlpha = 0.11 + 0.05 * Math.sin(t * 1.3 + ph); const lg = x.createLinearGradient(0, 0, 0, gy); lg.addColorStop(0, E_.c0); lg.addColorStop(1, E_.c0 + '00'); x.fillStyle = lg; x.beginPath(); x.moveTo(W * ox - H * 0.07, 0); x.lineTo(W * ox + H * 0.07, 0); x.lineTo(cx + (ox - 0.5) * H * 0.3 + H * 0.2, gy); x.lineTo(cx + (ox - 0.5) * H * 0.3 - H * 0.2, gy); x.closePath(); x.fill(); }
    // sello del mago: aros finos que giran detrás, como un halo
    x.globalAlpha = 1; x.save(); x.translate(cx, hy);
    const R = H * 0.4, ring = (r, col, lw, al) => { x.strokeStyle = col; x.globalAlpha = al; x.lineWidth = lw; x.beginPath(); x.arc(0, 0, r, 0, TAU); x.stroke(); };
    ring(R, E.c0, 1.2, 0.5); ring(R * 0.955, E.c1, 0.6, 0.45); ring(R * 0.7, E2.c0, 0.8, 0.32);
    x.save(); x.rotate(t * 0.12); x.strokeStyle = E.c0; x.lineWidth = 0.8; x.globalAlpha = 0.42; for (let k = 0; k < 36; k++) { x.rotate(TAU / 36); x.beginPath(); x.moveTo(R * 0.955, 0); x.lineTo(R * (k % 3 ? 0.925 : 0.88), 0); x.stroke(); }
    x.fillStyle = E.c0; x.globalAlpha = 0.75; for (let k = 0; k < 4; k++) { const a = k / 4 * TAU; x.beginPath(); x.arc(Math.cos(a) * R, Math.sin(a) * R, 2.2, 0, TAU); x.fill(); } x.restore();
    x.save(); x.rotate(-t * 0.09); x.strokeStyle = E2.c0; x.lineWidth = 0.7; x.globalAlpha = 0.26; for (let q = 0; q < 2; q++) { x.beginPath(); for (let k = 0; k <= 4; k++) { const a = k / 4 * TAU + q * Math.PI / 4, px = Math.cos(a) * R * 0.955, py = Math.sin(a) * R * 0.955; k ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); } x.restore();
    x.restore();
    // brasas/chispas que suben
    for (let k = 0; k < 30; k++) { const p = ((t * (0.07 + (k % 5) * 0.02)) + k * 0.137) % 1, px = W * ((k * 0.389) % 1) + Math.sin(t + k) * 8, py = H * (1 - p); x.globalAlpha = Math.sin(p * Math.PI) * 0.8; x.fillStyle = k % 2 ? E.c0 : E2.c0; x.beginPath(); x.arc(px, py, 0.8 + (k % 3) * 0.55, 0, TAU); x.fill(); }
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    // piso oscuro y estrado
    const fl = x.createLinearGradient(0, gy - H * 0.07, 0, H); fl.addColorStop(0, 'rgba(6,4,14,0)'); fl.addColorStop(0.5, 'rgba(6,4,14,0.55)'); fl.addColorStop(1, 'rgba(4,2,10,0.9)'); x.fillStyle = fl; x.fillRect(0, gy - H * 0.07, W, H);
    x.save(); x.translate(cx, gy); dais(x, H * 0.4, t, E, E2); x.restore();
    // figura con las manos en alto
    m.hands[0].hold = 0.35 + 0.1 * Math.sin(t * 1.4); m.hands[1].hold = 0.35 + 0.1 * Math.sin(t * 1.4 + 1.5); m.vx = Math.sin(t * 0.7) * 40; menuG.time = t;
    x.save(); x.translate(cx, gy); x.scale(s, s);
    const sh = x.createRadialGradient(0, 2, 2, 0, 2, 28); sh.addColorStop(0, 'rgba(0,0,0,0.75)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = sh; x.beginPath(); x.ellipse(0, 2, 30, 10, 0, 0, TAU); x.fill();
    m._show = true; if (Lk.aura2) Vest.drawAura(x, Lk.aura2, 0, -40 * Lk.scale, 33 * Lk.scale, t, 0); figure(x, menuG, m, Lk, t, 1 / 60); if (Lk.aura2) Vest.drawAura(x, Lk.aura2, 0, -40 * Lk.scale, 33 * Lk.scale, t, 1); x.restore();
    // bruma de color a los pies
    x.globalCompositeOperation = 'lighter'; for (const [E_, ox] of [[E, -0.3], [E2, 0.3]]) { const fx0 = cx + H * ox + Math.sin(t * 0.5 + ox * 9) * H * 0.05, g = x.createRadialGradient(fx0, gy + H * 0.04, 0, fx0, gy + H * 0.04, H * 0.34); g.addColorStop(0, E_.c1 + '2e'); g.addColorStop(1, E_.c1 + '00'); x.fillStyle = g; x.save(); x.translate(0, gy + H * 0.04); x.scale(1, 0.4); x.translate(0, -(gy + H * 0.04)); x.beginPath(); x.arc(fx0, gy + H * 0.04, H * 0.34, 0, TAU); x.fill(); x.restore(); }
    x.globalCompositeOperation = 'source-over';
    // viñeta
    const vg = x.createRadialGradient(cx, H * 0.5, Math.min(W, H) * 0.34, cx, H * 0.5, Math.max(W, H) * 0.78); vg.addColorStop(0, 'rgba(4,3,12,0)'); vg.addColorStop(1, 'rgba(4,3,12,0.8)'); x.fillStyle = vg; x.fillRect(0, 0, W, H);
    x.restore();
  }
  // figura suelta (sin fondo) para la portada: mira un poco hacia el centro, con su estrado y el resplandor de sus elementos
  function hero(x, cid, X, Y, s, t, dir, skin = 0, al = 1) {
    const m = fake(cid, 'h' + dir), Lk = look(cid, skin), E = EC(CHARS[cid].hands[0]), E2 = EC(CHARS[cid].hands[1]);
    m.face = Math.PI / 2 - dir * 0.5; m.hands[0].hold = 0.36 + 0.1 * Math.sin(t * 1.3); m.hands[1].hold = 0.36 + 0.1 * Math.sin(t * 1.3 + 1.5); m.vx = Math.sin(t * 0.7 + dir) * 40; m._show = true; menuG.time = t;
    x.save(); x.globalAlpha = al; x.translate(X, Y);
    x.globalCompositeOperation = 'lighter';
    for (const [E_, ox] of [[E, -0.3], [E2, 0.3]]) { const gx = ox * 110 * s, gy = -60 * s, g = x.createRadialGradient(gx, gy, 0, gx, gy, 150 * s); g.addColorStop(0, E_.c1 + '50'); g.addColorStop(0.5, E_.c1 + '1c'); g.addColorStop(1, E_.c1 + '00'); x.fillStyle = g; x.beginPath(); x.arc(gx, gy, 150 * s, 0, TAU); x.fill(); }
    x.globalCompositeOperation = 'source-over';
    dais(x, 44 * s, t, E, E2);
    x.globalAlpha = al; x.scale(s, s);
    const sh = x.createRadialGradient(0, 2, 2, 0, 2, 28); sh.addColorStop(0, 'rgba(0,0,0,0.75)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = sh; x.beginPath(); x.ellipse(0, 2, 30, 10, 0, 0, TAU); x.fill();
    if (Lk.aura2) Vest.drawAura(x, Lk.aura2, 0, -40 * Lk.scale, 33 * Lk.scale, t, 0);
    figure(x, menuG, m, Lk, t, 1 / 60);
    if (Lk.aura2) Vest.drawAura(x, Lk.aura2, 0, -40 * Lk.scale, 33 * Lk.scale, t, 1);
    x.restore();
  }
  return { draw, marker, portrait, showcase, hero, orb, L, SKINS, SKIN_NEED, OUTFITS, OUTFIT_ORDER, look };
})();
