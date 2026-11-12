/* =========================================================================
   MAGIA — datos: elementos, hechizos (rápido y cargado), fusiones y magos.
   Los números son de partida; las pruebas de balance (test/balance.js)
   los ajustan. Una vida normal es 100.
   ========================================================================= */
const EL = ['fire', 'water', 'wind', 'earth', 'plant', 'bolt', 'light', 'shadow'];
const ELEMENTS = {
  fire:  { name: 'Fuego',  c0: '#fff1b0', c1: '#ff9a3c', c2: '#d8401c', light: [255, 140, 60],  glyph: 'fire' },
  water: { name: 'Agua',   c0: '#d8fbff', c1: '#4cc4ff', c2: '#1a5fc8', light: [90, 175, 255],  glyph: 'water' },
  wind:  { name: 'Viento', c0: '#f4fffb', c1: '#a6f7d6', c2: '#3cb994', light: [170, 255, 225], glyph: 'wind' },
  earth: { name: 'Tierra', c0: '#fbe8c2', c1: '#d39a58', c2: '#7d5228', light: [230, 175, 110], glyph: 'earth' },
  plant: { name: 'Planta', c0: '#eaffb0', c1: '#7ee05a', c2: '#2a8a3c', light: [140, 255, 120], glyph: 'plant' },
  bolt:  { name: 'Rayo',   c0: '#ffffff', c1: '#d9b0ff', c2: '#7b4dff', light: [195, 155, 255], glyph: 'bolt' },
  light: { name: 'Luz',    c0: '#fffdf0', c1: '#ffe48a', c2: '#e8a42a', light: [255, 236, 170], glyph: 'light' },
  shadow:{ name: 'Sombra', c0: '#ffd2ef', c1: '#c443a6', c2: '#2a0a32', light: [210, 70, 175], glyph: 'shadow' },
};
const elIdx = e => EL.indexOf(e);
const fuseKey = (a, b) => (elIdx(a) <= elIdx(b) ? a + '+' + b : b + '+' + a);

/* ---------- hechizos de un elemento: [rápido, cargado] ----------
   kind: proj (proyectil), cone (soplo instantáneo), wave (frente), vortex,
   wall, lob (cae donde apuntas), vine (línea en el suelo), zap (instantáneo),
   strike (rayo con aviso) */
const SPELLS = {
  fire: [
    { name: 'Brasa', kind: 'proj', cd: 0.55, speed: 640, r: 11, life: 1.0, dmg: 7, burn: 2.4 },
    { name: 'Llamarada', kind: 'proj', cd: 1.9, speed: 520, r: 17, life: 1.1, dmg: 8, burn: 2.4, boom: { r: 78, dmg: 12, ignite: 1 } },
  ],
  water: [
    { name: 'Chorro', kind: 'proj', cd: 0.5, speed: 720, r: 10, life: 0.85, dmg: 6, knock: 430, wet: 2.6, puddle: 1 },
    { name: 'Ola', kind: 'wave', cd: 2.0, speed: 560, range: 330, half: 0.62, dmg: 10, knock: 560, wet: 3.5, puddle: 1 },
  ],
  wind: [
    { name: 'Ráfaga', kind: 'proj', gust: 1, cd: 0.6, speed: 820, r: 24, life: 0.44, dmg: 7, knock: 540 },
    { name: 'Remolino', kind: 'vortex', cd: 2.0, speed: 230, r: 74, life: 3.0, dps: 11, pull: 460 },
  ],
  earth: [
    { name: 'Piedra', kind: 'proj', cd: 0.8, speed: 500, r: 15, life: 1.2, dmg: 13, stun: 0.25, knock: 300, heavy: 1 },
    { name: 'Muro', kind: 'wall', cd: 2.4, len: 4, hp: 45, life: 6 },
  ],
  plant: [
    { name: 'Semilla', kind: 'lob', cd: 1.1, range: 300, flight: 0.45, dmg: 6, hitRoot: 0.6, trap: { r: 34, root: 1.1, life: 7 } },
    { name: 'Enredadera', kind: 'vine', cd: 2.0, range: 330, life: 6, dps: 6, slow: 0.5 },
  ],
  bolt: [
    { name: 'Chispa', kind: 'zap', cd: 0.7, range: 265, dmg: 7, chain: 160 },
    { name: 'Relámpago', kind: 'strike', cd: 2.0, range: 330, delay: 0.62, r: 56, dmg: 18, stun: 0.6 },
  ],
  // 2.0 — LUZ: rápida, atraviesa y encandila (el rival apunta mal un momento). SOMBRA: maleficio (recibe más daño) y paso entre sombras
  light: [
    { name: 'Destello', kind: 'proj', cd: 0.55, speed: 980, r: 9, life: 0.62, dmg: 5, dazzle: 0.25, pierce: 1 },
    { name: 'Rayo de sol', kind: 'sunray', cd: 2.4, len: 560, w: 16, dmg: 13, dazzle: 0.5, bounces: 1 },
  ],
  shadow: [
    { name: 'Zarpa', kind: 'proj', cd: 0.72, speed: 540, r: 12, life: 1.05, dmg: 5.8, hex: 2.0 },
    { name: 'Paso de sombra', kind: 'blink', cd: 3.6, range: 270, dmg: 9, hex: 2.0, r: 62 },
  ],
};
const HEX_MUL = 1.35;
const GRAN_CHARGE = 0.3, GRAN_WAVE = 170; // Gran Sortilegio: concentración (s de juego, va en cámara lenta) y alcance de la onda // maleficio: el golpe siguiente duele más (y se gasta)

/* ---------- fusiones (las dos manos) ---------- */
const FUSIONS = {
  'fire+water':  { name: 'Vapor', kind: 'cloud', cd: 4.0, range: 260, r: 112, life: 4.5, dps: 4, hide: 1, tip: 'Esconde a quien esté adentro y apaga el fuego.' },
  'fire+wind':   { name: 'Torbellino de fuego', kind: 'firenado', cd: 4.5, speed: 235, r: 58, life: 3.3, dps: 17, turn: 2.0, pull: 330, tip: 'Persigue despacio y quema todo a su paso.' },
  'fire+earth':  { name: 'Magma', kind: 'meteor', cd: 4.5, range: 340, flight: 0.7, r: 78, dmg: 20, knock: 320, pool: { r: 62, life: 4, dps: 10 }, tip: 'Cae en arco y deja lava. Rompe muros.' },
  'fire+plant':  { name: 'Vainas de fuego', kind: 'mines', cd: 4.0, n: 3, arm: 0.6, trig: 56, r: 72, dmg: 13, life: 10, tip: 'Tres minas que estallan si el rival se acerca.' },
  'fire+bolt':   { name: 'Plasma', kind: 'beam', cd: 4.5, windup: 0.36, len: 660, w: 26, dmg: 24, tip: 'Rayo recto que rompe muros. Apunta bien.' },
  'water+wind':  { name: 'Ventisca', kind: 'frost', cd: 4.0, range: 285, half: 0.66, dmg: 8, chill: 2.0, freeze: 1.3, tip: 'Congela al mojado y vuelve hielo los charcos.' },
  'water+earth': { name: 'Lodo', kind: 'mud', cd: 4.0, range: 300, flight: 0.5, r: 112, life: 6, dmg: 6, slow: 0.55, tip: 'Barro que frena y no deja esquivar.' },
  'water+plant': { name: 'Flor de vida', kind: 'bloom', cd: 5.0, r: 92, life: 5, hps: 7, tip: 'Cura a quien esté cerca... también al rival.' },
  'water+bolt':  { name: 'Tormenta', kind: 'storm', cd: 4.5, range: 300, r: 122, life: 4.5, every: 0.6, sr: 42, dmg: 5, tip: 'Nube que moja y suelta rayos.' },
  'wind+earth':  { name: 'Tormenta de arena', kind: 'sand', cd: 4.0, r: 152, life: 4.2, dps: 3, tip: 'El rival adentro no ve ni apunta bien.' },
  'wind+plant':  { name: 'Pétalos', kind: 'petals', cd: 4.0, n: 8, speed: 390, turn: 4.2, dmg: 3.2, life: 2.6, r: 8, tip: 'Enjambre que busca al rival.' },
  'wind+bolt':   { name: 'Bola de rayo', kind: 'proj', cd: 4.0, speed: 760, r: 14, life: 2.3, dmg: 15, stun: 0.35, bounce: 3, chain: 150, tip: 'Rebota hasta tres veces en muros y bordes.' },
  'earth+plant': { name: 'Raíces', kind: 'roots', cd: 4.0, speed: 640, range: 430, r: 20, dmg: 10, root: 1.5, tip: 'Corre por el suelo e inmoviliza al primero que toca.' },
  'earth+bolt':  { name: 'Piedra imán', kind: 'magnet', cd: 4.5, range: 280, life: 3.2, pullR: 205, pull: 300, dps: 5, tip: 'Atrae a los rivales y los electrocuta.' },
  'plant+bolt':  { name: 'Flor eléctrica', kind: 'turret', cd: 5.0, range: 210, hp: 30, life: 6.5, every: 0.7, reach: 285, dmg: 5, tip: 'Torreta que dispara chispas.' },
};
Object.assign(FUSIONS, {
  'fire+light':   { name: 'Supernova', kind: 'nova', cd: 4.5, windup: 0.42, r: 150, dmg: 19, burn: 2.2, knock: 420, dazzle: 0.5, tip: 'Estalla a tu alrededor: quema, empuja y encandila.' },
  'water+light':  { name: 'Prisma', kind: 'prism', cd: 4.0, n: 3, spread: 0.24, len: 520, w: 14, dmg: 9, dazzle: 0.5, tip: 'Tres rayos de arcoíris; al mojado le pegan más.' },
  'wind+light':   { name: 'Espejismo', kind: 'mirage', cd: 5.0, n: 2, life: 4.5, hide: 0.9, flash: 0.9, tip: 'Dos reflejos tuyos confunden al rival; al romperse lo encandilan.' },
  'earth+light':  { name: 'Jaula de cristal', kind: 'cage', cd: 5.0, range: 320, flight: 0.5, hp: 26, life: 3.4, dmg: 8, tip: 'Encierra al rival entre cristales unos segundos.' },
  'plant+light':  { name: 'Girasol', kind: 'sunflower', cd: 5.0, range: 200, hp: 34, life: 7, every: 1.25, reach: 380, dmg: 7, heal: 3.5, healR: 95, tip: 'Dispara rayos de sol y cura a quien esté a su lado.' },
  'bolt+light':   { name: 'Juicio', kind: 'judgment', cd: 4.5, range: 520, delay: 0.95, lockAt: 0.28, r: 58, dmg: 26, stun: 0.55, tip: 'Marca al rival y le cae una columna de luz. ¡Hay que salir a tiempo!' },
  'light+shadow': { name: 'Eclipse', kind: 'eclipse', cd: 5.0, range: 300, r: 120, life: 3.4, dps: 4.5, tip: 'Dentro del eclipse el rival no puede lanzar hechizos.' },
  'fire+shadow':  { name: 'Fuegos fatuos', kind: 'wisps', cd: 4.5, n: 4, life: 6, trig: 150, speed: 430, turn: 5, dmg: 7, burn: 1.6, tip: 'Cuatro llamas te rodean y se lanzan sobre quien se acerque.' },
  'water+shadow': { name: 'Marea negra', kind: 'bog', cd: 4.5, range: 290, flight: 0.45, r: 112, life: 5, dps: 5.5, slow: 0.7, drain: 0.45, tip: 'Charco oscuro que frena, hace daño y te devuelve vida.' },
  'wind+shadow':  { name: 'Cuervos', kind: 'crows', cd: 4.0, n: 4, speed: 360, turn: 3.6, dmg: 4.5, life: 3.0, r: 9, dazzle: 0.5, hex: 2, tip: 'Bandada que persigue, ciega y deja maleficio.' },
  'earth+shadow': { name: 'Fosa', kind: 'pit', cd: 5.0, range: 300, delay: 0.75, life: 2.6, tip: 'Abre un hueco en el suelo: quien no salga a tiempo, cae.' },
  'plant+shadow': { name: 'Zarzal', kind: 'thorns', cd: 4.5, r: 118, life: 4.5, dmg: 9, root: 0.6, tip: 'Anillo de espinas a tu alrededor: quien lo cruce queda enredado.' },
  'bolt+shadow':  { name: 'Rayo negro', kind: 'blackbolt', cd: 4.0, range: 330, dmg: 15, hex: 3.2, silence: 0.7, chain: 190, tip: 'Rayo que maldice, salta a otro rival y lo silencia un instante.' },
});
const FUSION_ORDER = Object.keys(FUSIONS);

/* ---------- magos ---------- */
const CHARS = {
  candela:   { name: 'Candela', title: 'llanera de fuego', hands: ['fire', 'wind'], hp: 160, speed: 1.06, sig: 'fire+wind', trait: 'Sus quemaduras duran 50 % más y al esquivar deja fuego.', look: 'candela' },
  yuma:      { name: 'Yuma', title: 'aprendiz del Mohán', hands: ['water', 'bolt'], hp: 102, speed: 1.0, sig: 'water+bolt', trait: 'Más rápido en agua y barro; su agua electrificada no lo toca.', look: 'yuma' },
  frailejon: { name: 'Frailejón', title: 'guardián del páramo', hands: ['earth', 'plant'], hp: 160, speed: 0.91, sig: 'earth+plant', trait: 'Casi no lo empujan; quieto sobre hierba se cura.', look: 'frailejon' },
  purace:    { name: 'Puracé', title: 'hija del volcán', hands: ['fire', 'earth'], hp: 124, speed: 0.92, sig: 'fire+earth', trait: 'Recibe 25 % menos daño por fuego y lava.', look: 'purace' },
  iguaque:   { name: 'Iguaque', title: 'sacerdotisa de la laguna', hands: ['water', 'plant'], hp: 118, speed: 1.0, sig: 'water+plant', trait: 'Cura 50 % más; con poca vida se regenera.', look: 'iguaque' },
  catatumbo: { name: 'Catatumbo', title: 'relámpago errante', hands: ['wind', 'bolt'], hp: 144, speed: 1.15, sig: 'wind+bolt', trait: 'Sus rayos pegan 35 % más; esquiva más seguido y al esquivar a través del rival lo electrocuta.', look: 'catatumbo' },
  // 2.0 — más magos de los seis elementos de siempre
  cocuy:     { name: 'Cocuy', title: 'ermitaño del nevado', hands: ['water', 'wind'], hp: 128, speed: 1.0, sig: 'water+wind', trait: 'Congela 40 % más tiempo, no resbala en el hielo y el frío no lo frena.', look: 'cocuy' },
  tatacoa:   { name: 'Tatacoa', title: 'caminante del desierto', hands: ['wind', 'earth'], hp: 130, speed: 0.98, sig: 'wind+earth', trait: 'Dentro de su tormenta de arena se cura; sus muros aguantan más.', look: 'tatacoa' },
  galeras:   { name: 'Galeras', title: 'forjador de tormentas', hands: ['fire', 'bolt'], hp: 146, speed: 1.06, sig: 'fire+bolt', trait: 'Carga los hechizos 30 % más rápido y camina mientras prepara el Plasma.', look: 'galeras' },
  // 2.0 — magos de Luz y Sombra
  zuhe:      { name: 'Zuhé', title: 'hijo del sol', hands: ['light', 'fire'], hp: 100, speed: 1.02, sig: 'fire+light', trait: 'Encandila 50 % más tiempo y cada golpe de luz lo cura un poco.', look: 'zuhe' },
  chia:      { name: 'Chía', title: 'señora de la luna', hands: ['light', 'shadow'], hp: 108, speed: 1.08, sig: 'light+shadow', trait: 'Sus maleficios duran más y pegan más fuerte; escondida o en la oscuridad se regenera.', look: 'chia' },
  mapale:    { name: 'Mapalé', title: 'danzante de la noche', hands: ['shadow', 'wind'], hp: 132, speed: 1.2, sig: 'wind+shadow', trait: 'Tiene tres esquives y al esquivar se vuelve sombra un instante (no se le puede apuntar).', look: 'mapale' },
  tota:      { name: 'Tota', title: 'bruja del lago hondo', hands: ['shadow', 'water'], hp: 100, speed: 0.94, sig: 'water+shadow', trait: 'Roba vida con cada golpe de sombra y nada rápido en el agua.', look: 'tota' },
};
const CHAR_ORDER = ['candela', 'yuma', 'frailejon', 'purace', 'iguaque', 'catatumbo', 'cocuy', 'tatacoa', 'galeras', 'zuhe', 'chia', 'mapale', 'tota'];
// lo que cada rasgo cambia (Mage los lee)
const TRAITS = {
  candela: { burnMul: 1.85, dashFire: 1 },
  yuma: { waterSpeed: 1.35, elecImmune: 1 },
  frailejon: { knockMul: 0.45, grassRegen: 2.2 },
  purace: { fireRes: 0.75 },
  iguaque: { healMul: 1.5, lowRegen: 1.2 },
  catatumbo: { dashCd: 0.65, dashZap: 9, boltMul: 1.35 },
  cocuy: { iceWalk: 1, freezeMul: 1.4 },
  tatacoa: { sandHeal: 4.5, wallMul: 1.7, knockMul: 0.75 },
  galeras: { chargeMul: 0.7, beamNoRoot: 1 },
  zuhe: { dazzleMul: 1.4, lightHeal: 1.0 },
  chia: { hexMul: 1.4, hexDmg: 1.55, hideRegen: 2 },
  mapale: { dashN: 3, dashHide: 0.7 },
  tota: { shadowLeech: 0.12, waterSpeed: 1.15 },
};
