/* =========================================================================
   VUELTA AL MUNDO — la campaña: 24 retos en 13 paradas, de Colombia hacia el
   occidente y de vuelta a casa. Cada reto da hasta 3 estrellas; una estrella
   en una parada abre la siguiente. Tres jefes en el camino (el Tren de Oro en
   el Gran Cañón, el Galeón de Vapor en Ha Long) y el Cóndor de Hierro al
   volver a Guatapé. Se juega de a uno o de a dos (cuenta la mejor estrella).
   ========================================================================= */
const STOPS = [
  { id: 'guatape', name: 'Guatapé', side: 'l', country: 'Colombia', lon: -75.2, lat: 6.2, px: -90, py: 2, blurb: 'Aquí empieza la vuelta al mundo: el Peñol, el embalse y el pueblo de zócalos.' },
  { id: 'totumo', name: 'Volcán del Totumo', lab: 'Totumo', side: 't', country: 'Colombia', lon: -75.3, lat: 10.7, px: -84, py: 21, blurb: 'Un volcán de lodo junto al mar Caribe. Aquí se pelea embarrado.' },
  { id: 'dorado', name: 'El Dorado', side: 'r', country: 'Colombia · leyenda muisca', lon: -73.8, lat: 4.9, px: -66, py: 11, blurb: 'La ciudad de oro de la leyenda y la laguna sagrada de la balsa muisca.' },
  { id: 'amazonas', name: 'Amazonas', side: 'r', country: 'Brasil', lon: -62, lat: -3.5, px: -55, py: -8, blurb: 'Túneles de selva, una cascada gigante y el río de los delfines rosados.' },
  { id: 'uyuni', name: 'Salar de Uyuni', lab: 'Uyuni', country: 'Bolivia', lon: -67.5, lat: -20.2, px: -68, py: -24, blurb: 'El espejo del cielo: un desierto de sal donde se pelea sin sombra.' },
  { id: 'canon', name: 'Gran Cañón', country: 'Estados Unidos', lon: -112.1, lat: 36.1, px: -112, py: 37, blurb: 'Un tren cargado de oro huye por el borde del cañón. ¿Lo alcanzas?' },
  { id: 'tokio', name: 'Tokio', country: 'Japón', lon: 139.7, lat: 35.7, px: 141, py: 37, blurb: 'Neón de noche, autopistas elevadas y la bahía del puente Arcoíris.' },
  { id: 'halong', name: 'Bahía de Ha Long', lab: 'Ha Long', country: 'Vietnam', lon: 107, lat: 20.9, px: 110, py: 15, blurb: 'Islas de piedra entre la bruma… y un galeón pirata a vapor.' },
  { id: 'egipto', name: 'Egipto', country: 'Egipto', lon: 31.1, lat: 29.9, px: 31, py: 21, blurb: 'Pirámides, el templo de Karnak y el Nilo. Ojo con la tormenta de arena.' },
  { id: 'santorini', name: 'Santorini', country: 'Grecia', lon: 25.4, lat: 36.4, px: 42, py: 40, blurb: 'Casas blancas y cúpulas azules colgadas sobre la caldera.' },
  { id: 'coliseo', name: 'Coliseo de Roma', lab: 'Roma', country: 'Italia', lon: 12.5, lat: 41.9, px: 13, py: 33, blurb: 'La arena de los gladiadores. El público quiere batalla.' },
  { id: 'venecia', name: 'Venecia', side: 't', country: 'Italia', lon: 12.3, lat: 45.4, px: 2, py: 51, blurb: 'Calles de piedra, el Gran Canal y el carnaval.' },
  { id: 'islandia', name: 'Islandia', side: 'l', country: 'Islandia', lon: -19, lat: 64.9, px: -20, py: 66, blurb: 'Hielo, volcanes y géiseres bajo la aurora boreal.' },
];
const STOP_IDX = Object.fromEntries(STOPS.map((s, i) => [s.id, i]));
// lecciones con meta dentro de una carrera (usan las reglas de la Escuela)
const goalL = (o) => Object.assign({ race: true, showCount: true, time: 999, bots: 3, botLevel: 1, laps: 2 }, o);
const CAMPAIGN = [
  { id: 'w1', stop: 'guatape', kind: 'race', name: 'Primera vuelta', goal: 'termina en el podio; aquí cada esmeralda vale doble', track: 'guatape', laps: 2, diff: 0, sk: 0.06, gemK: 2 },
  { id: 'w2', stop: 'guatape', kind: 'goal', name: 'Rey del derrape', goal: 'haz 4 turbos de derrape antes de terminar 2 vueltas', track: 'guatape',
    L: goalL({ id: 'w2', name: 'Derrapes', need: 4, gold: 40, silver: 60, botLevel: 0, tip: i => `Sostén ${keyName(i, 'drift')} en cada curva y suéltalo para el turbo. Cuantos más pronto, más estrellas.`, count: e => e.type === 'driftBoost' }) },
  { id: 'w3', stop: 'totumo', kind: 'battle', name: 'Guerra de lodo', goal: 'gana la batalla en el lodo (3 corazones)', track: 'totumo', diff: 0, sk: 0.1 },
  { id: 'n4', stop: 'dorado', kind: 'collect', name: 'Ofrendas de oro', goal: 'recoge 22 tunjos de oro en 2 vueltas (de a dos: 32 entre los dos)', track: 'dorado',
    L: goalL({ id: 'n4', name: 'Tunjos de oro', need: 22, need2: 32, gold: 64, silver: 86, team: true, bots: 2, botLevel: 0, style: 'tunjo', gap: 120, tip: () => 'Los tunjos están regados por la avenida, el puente, la laguna y el vuelo. En equipo suman los dos: ¡repártanse los carriles!', count: e => e.type === 'pickGot' }) },
  { id: 'w5', stop: 'dorado', kind: 'goal', name: 'Aros del sol', goal: 'pasa por 4 aros volando en 2 vueltas', track: 'dorado',
    L: goalL({ id: 'w5', name: 'Aros', need: 4, gold: 76, silver: 92, tip: i => Touch.active ? 'En el ala: palanca ↑ picada, ↓ subir. Apunta a cada aro.' : `En el ala: ${i ? '↑ picada, ↓ subir' : 'W picada, S subir'}. Apunta a cada aro.`, count: e => e.type === 'ring' }) },
  { id: 'n6', stop: 'amazonas', kind: 'logs', name: 'Río de troncos', goal: 'cruza el río en 2 vueltas sin chocar con los troncos', track: 'amazonas', laps: 2 },
  { id: 'w7', stop: 'amazonas', kind: 'race', name: 'Selva sin cajas', goal: 'termina en el podio sin objetos (2 vueltas)', track: 'amazonas', laps: 2, diff: 1, sk: 0.26, noItems: true },
  { id: 'w8', stop: 'uyuni', kind: 'battle', name: 'Muerte súbita', goal: 'queda en pie con un solo corazón (3 rivales)', track: 'uyuni', diff: 1, sk: 0.18, hearts: 1, time: 75, bots: 3 },
  { id: 'w9', stop: 'canon', kind: 'goal', name: 'Salto del cañón', goal: 'aterriza 3 piruetas antes de terminar 2 vueltas', track: 'canon',
    L: goalL({ id: 'w9', name: 'Piruetas', need: 3, gold: 50, silver: 70, tip: i => `En el aire toca ${keyName(i, 'drift')} con una dirección y aterriza derecho.`, count: e => e.type === 'landTrick' }) },
  { id: 'w10', stop: 'canon', kind: 'boss', name: 'El Tren de Oro', goal: 'detén al Tren de Oro antes de 2 vueltas', track: 'canon', boss: 'tren', diff: -0.8 },
  { id: 'n11', stop: 'tokio', kind: 'boss', name: 'El Dragón de Neón', goal: 'atrapa al dragón antes de que dé vuelta y media', track: 'tokio', boss: 'dragon', diff: 1.0 },
  { id: 'w12', stop: 'tokio', kind: 'goal', name: 'Cohetes en Shibuya', goal: 'golpea 3 rivales con objetos en 2 vueltas', track: 'tokio',
    L: goalL({ id: 'w12', name: 'Golpes', need: 3, gold: 60, silver: 85, bots: 5, itemW: { rocket: 10, rocket3: 6, wasp: 2, oil: 2, coco: 4, shield: 2, chile: 2, magnet: 1, fog: 0, emerald: 2, bolt: 0.5 }, tip: i => `Toma las cajas y lanza con ${keyName(i, 'item')} cuando tengas a alguien al frente.`, count: (e, c) => e.type === 'hit' && e.by === c.idx && e.car !== c.idx }) },
  { id: 'w13', stop: 'halong', kind: 'goal', name: 'Olas de jade', goal: 'aterriza 4 piruetas en el agua en 2 vueltas', track: 'halong',
    L: goalL({ id: 'w13', name: 'Piruetas en el agua', need: 4, gold: 34, silver: 55, tip: i => `En la lancha, las olas grandes son rampas: en el aire toca ${keyName(i, 'drift')}.`, count: (e, c, R) => e.type === 'landTrick' && !!R.track.zone(c.s, 'water') }) },
  { id: 'w14', stop: 'halong', kind: 'boss', name: 'El Galeón de Vapor', goal: 'hunde el galeón antes de 2 vueltas', track: 'halong', boss: 'galeon', diff: -0.5 },
  { id: 'n15', stop: 'egipto', kind: 'escape', name: 'Tormenta de arena', goal: 'huye de la tormenta 2 vueltas sin que te alcance', track: 'egipto', laps: 2 },
  { id: 'n16', stop: 'egipto', kind: 'boss', name: 'El Escarabajo Dorado', goal: 'detén al escarabajo antes de que dé vuelta y media', track: 'egipto', boss: 'scarab', diff: 1.5 },
  { id: 'w17', stop: 'santorini', kind: 'clean', name: 'Curvas del acantilado', goal: 'termina 2 vueltas sin chocar con las paredes', track: 'santorini', laps: 2 },
  { id: 'n18', stop: 'santorini', kind: 'rival', name: 'Duelo en el acantilado', goal: 'gánale al Campeón del Egeo (2 vueltas)', track: 'santorini', laps: 2, champ: 'flamenco', champName: 'el Campeón del Egeo', sk: 0.15, champSk: 0.03 },
  { id: 'w19', stop: 'coliseo', kind: 'battle', name: 'Gladiadores', goal: 'gana la batalla contra los gladiadores', track: 'coliseo', diff: 2, sk: 0.2 },
  { id: 'n20', stop: 'venecia', kind: 'collect', name: 'Máscaras del carnaval', goal: 'rompe 24 máscaras en 2 vueltas: pásales por encima o dispárales (de a dos: 36)', track: 'venecia', shoot: true,
    L: goalL({ id: 'n20', name: 'Máscaras', need: 24, need2: 36, gold: 58, silver: 80, team: true, bots: 2, botLevel: 0, style: 'mascara', gap: 95, itemW: { rocket: 10, rocket3: 8, wasp: 0, oil: 1, coco: 0, shield: 1, chile: 3, magnet: 0, fog: 0, emerald: 2, bolt: 0 }, tip: i => `Las máscaras flotan por las calles, la plaza, el canal y el vuelo. Rómpelas pasando por encima o con cohetes (${keyName(i, 'item')}).`, count: e => e.type === 'pickGot' }) },
  { id: 'w21', stop: 'venecia', kind: 'goal', name: 'Especial en el Gran Canal', goal: 'llena la barra y lanza tu especial antes de terminar 2 vueltas', track: 'venecia',
    L: goalL({ id: 'w21', name: 'Especial', need: 1, gold: 36, silver: 56, tip: i => `Llena la barra con derrapes, piruetas y aros; sin objeto, ${keyName(i, 'item')} lanza la especial.`, count: e => e.type === 'special' }) },
  { id: 'n22', stop: 'islandia', kind: 'geysers', name: 'La tierra tiembla', goal: 'vuela con 9 géiseres en 2 vueltas (de a dos: 14 entre los dos)', track: 'islandia',
    L: goalL({ id: 'n22', name: 'Géiseres', need: 9, need2: 14, gold: 66, silver: 90, team: true, bots: 2, botLevel: 0, tip: () => 'Brotaron géiseres por toda la pista: pásales por encima cuando estén a punto de soplar (burbujean) y te lanzan al aire. ¡Haz piruetas!', count: e => e.type === 'takeoff' && e.why === 'geyser' }) },
  { id: 'n23', stop: 'islandia', kind: 'boss', name: 'El Gigante de Lava', goal: 'detén al gigante antes de que dé vuelta y media', track: 'islandia', boss: 'golem', diff: 1.3 },
  { id: 'w24', stop: 'guatape', kind: 'boss', name: 'El Cóndor de Hierro', goal: 'derriba al Cóndor de Hierro: el jefe final', track: 'guatape', boss: 'condor', diff: 2, final: true },
];
const KIND_NAME = { race: 'Carrera', goal: 'Reto', tt: 'Contrarreloj', battle: 'Batalla', elim: 'Eliminación', clean: 'Precisión', boss: 'Jefe', mini: 'Minijefe', collect: 'Recolección', logs: 'Obstáculos', escape: 'Huida', geysers: 'Reto', rival: 'Duelo' };
const kindName = C => C.kind === 'boss' && BOSSES[C.boss] && BOSSES[C.boss].mini ? KIND_NAME.mini : KIND_NAME[C.kind];
const World = {
  stars() { return Store.get('world', {}); },
  starsOf(i) { const C = CAMPAIGN[i]; return (World.stars()[C.id]) || 0; },
  total() { const s = World.stars(); return CAMPAIGN.reduce((a, C) => a + (s[C.id] || 0), 0); },
  // una parada se abre con una estrella en la anterior; el jefe final, al terminar Islandia
  stopOpen(si) { if (si <= 0) return true; const prev = STOPS[si - 1].id; return CAMPAIGN.some((C, i) => C.stop === prev && !C.final && World.starsOf(i) > 0); },
  open(i) { const C = CAMPAIGN[i]; return C.final ? World.stopOpen(STOPS.length) : World.stopOpen(STOP_IDX[C.stop]); },
  stopStars(si) { const id = STOPS[si].id; let n = 0, m = 0; CAMPAIGN.forEach((C, i) => { if (C.stop === id) { n += World.starsOf(i); m += 3; } }); return [n, m]; },
  save(i, st) { const s = World.stars(), C = CAMPAIGN[i]; const was = s[C.id] || 0; if (st > was) { s[C.id] = st; Store.set('world', s); } return was; },
  next(i) { for (let k = i + 1; k < CAMPAIGN.length; k++) if (World.open(k)) return k; return -1; },
};
/* ---------- reglas de un reto: las del modo + estrellas ---------- */
Rules.world = (R, C) => {
  let RU = null;
  if (C.kind === 'elim') RU = Rules.elim(R);
  else if (C.kind === 'battle') RU = Rules.battle(R, { hearts: C.hearts, time: C.time });
  else if (C.L) { // retos con meta (también recolección y géiseres): reglas de la Escuela con piezas propias
    const L = Object.assign({}, C.L); if (!L.goal) L.goal = C.goal;
    if (C.kind === 'collect') { L.setup = R => { R.bz = []; Challenge.picks(R, L.style, L.gap); }; L.step = (R, dt) => Boss.hazards(R, null, dt); L.avoid = Challenge.steer; }
    if (C.kind === 'geysers') { L.setup = R => { R.bz = []; Challenge.geysers(R); }; L.avoid = Challenge.steer; }
    RU = Rules.lesson(R, L);
  }
  else if (C.kind === 'boss') RU = Rules.chase(R, BOSSES[C.boss], C.diff);
  else RU = { id: 'world' };
  const hum = () => R.cars.filter(c => !c.bot), placeStars = () => { let b = 0; for (const c of hum()) if (!(C.kind === 'race' && !c.finished)) b = Math.max(b, c.place <= 3 ? 4 - c.place : 0); return b; };
  if (C.L && C.L.itemW) RU.itemW = C.L.itemW; if (C.shoot) RU.shootPick = true; if (C.gemK) RU.gemK = C.gemK;
  RU.world = C; RU.introSub = 'Vuelta al mundo · ' + C.name; if (!RU.goal) RU.goal = C.goal;
  if (!RU.tip && !RU.L) RU.tip = i => ({ tt: 'Solo contra el reloj: sin máquina ni objetos. Tres tiempos: ' + (C.times || []).map(t => HUD.fmt(t)).join(' · ') + '.', clean: 'Cada choque contra la pared cuenta. Frena antes de las curvas cerradas y derrapa suave.',
    race: C.gemK ? 'Cada esmeralda llena el doble de barra: turbo seguido para llegar al podio.' : C.noItems ? 'Sin cajas: solo manejo, derrapes, piruetas y rebufo.' : 'Derrapa en las curvas, aprovecha el rebufo y los objetos. Podio = estrellas.',
    logs: 'La corriente arrastra troncos por el río. Míralos venir y pasa por los huecos: cada choque cuenta.', escape: 'Una pared de arena viene detrás y cada vez más rápido. Derrapa, usa el turbo y no te dejes alcanzar.',
    rival: (C.champName ? C.champName[0].toUpperCase() + C.champName.slice(1) : 'El campeón') + ' brilla y va con todo. Gánale: cuanto más le saques, más estrellas.' })[C.kind] || '';
  // ---- río de troncos ----
  if (C.kind === 'logs') { RU.init = R => { R.bz = []; Challenge.logs(R); R.events.length = 0; }; RU.step = (R, dt) => Boss.hazards(R, null, dt); RU.avoid = Challenge.steer;
    RU.panel = (R, c) => ({ label: 'TRONCOS', value: String(c.logHits || 0), col: (c.logHits || 0) <= 2 ? '#3dffa8' : (c.logHits || 0) <= 4 ? '#ffd23d' : '#ff7a5a', sub: 'choques · vuelta ' + Math.min(R.laps, c.lap + 1) + '/' + R.laps }); }
  // ---- tormenta de arena ----
  if (C.kind === 'escape') { RU.init = R => { Challenge.storm(R); R.events.length = 0; }; RU.step = (R, dt) => Challenge.stormStep(R, dt);
    RU.panel = (R, c) => { const g = Math.round(Boss.dist(R, c) - R.storm.d); return { label: 'TORMENTA', value: c.finished ? '¡LIBRE!' : g > 0 ? g + ' m' : '¡ENCIMA!', col: c.finished ? '#3dffa8' : g < 30 ? '#ff5a36' : g < 70 ? '#ffd23d' : '#fff', sub: 'te alcanzó ' + (c.stormN || 0) + ' · vuelta ' + Math.min(R.laps, c.lap + 1) + '/' + R.laps }; }; }
  // ---- duelo contra el campeón ----
  if (C.kind === 'rival') { RU.init = R => { RU.champ = Challenge.champion(R, C.champ, C.champSk); R.events.length = 0; };
    RU.panel = (R, c) => { const ch = RU.champ; if (!ch) return null; const d = Math.round(ch.progress - c.progress); return { label: (C.champName || 'el campeón').toUpperCase(), value: c.finished ? (ch.finished && ch.finishT < c.finishT ? 'TE GANÓ' : '¡LE GANASTE!') : d > 0 ? 'te lleva ' + d + ' m' : 'le llevas ' + (-d) + ' m', col: d > 0 ? '#ff7a5a' : '#3dffa8', sub: 'vuelta ' + Math.min(R.laps, c.lap + 1) + '/' + R.laps + ' · ' + ORDN(c.place) }; }; }
  RU.stars = (R) => {
    switch (C.kind) {
      case 'race': case 'elim': case 'battle': return placeStars();
      case 'tt': { let b = 0; for (const c of hum()) if (c.finished) { const t = c.finishT; b = Math.max(b, t <= C.times[0] ? 3 : t <= C.times[1] ? 2 : t <= C.times[2] ? 1 : 0); } return b; }
      case 'clean': { let b = 0; for (const c of hum()) if (c.finished) { const n = c.cleanHits || 0; b = Math.max(b, n <= 1 ? 3 : n <= 3 ? 2 : n <= 6 ? 1 : 0); } return b; }
      case 'logs': { let b = 0; for (const c of hum()) if (c.finished) { const n = c.logHits || 0; b = Math.max(b, n <= 2 ? 3 : n <= 4 ? 2 : n <= 7 ? 1 : 0); } return b; }
      case 'escape': { const h = hum(); if (!h.every(c => c.finished)) return 0; const n = h.reduce((a, c) => a + (c.stormN || 0), 0), k = h.length === 2 ? [1, 3, 6] : [0, 1, 3]; return n <= k[0] ? 3 : n <= k[1] ? 2 : n <= k[2] ? 1 : 0; }
      case 'rival': { const ch = RU.champ; let b = 0; for (const c of hum()) { if (!c.finished) continue; if (!ch || !ch.finished || ch.finishT > c.finishT) { const lead = ch && !ch.finished ? Math.max(0, R.track.L * R.laps - ch.progress) / Math.max(20, ch.f) : ch ? ch.finishT - c.finishT : 9; b = Math.max(b, lead >= 2.5 ? 3 : 2); } else if (c.finishT - ch.finishT <= 3) b = Math.max(b, 1); } return b; }
      case 'goal': case 'collect': case 'geysers': { let b = 0; for (const c of hum()) b = Math.max(b, RU.medal(c)); return b; }
      case 'boss': return Boss.stars(R.boss);
    } return 0;
  };
  if (C.L) RU.overlay = (R, c) => { if (c.lessonT) { const m = RU.medal(c); return { text: '¡LOGRADO!', sub: '★'.repeat(m) + '☆'.repeat(3 - m) + ' · ' + HUD.fmt(c.lessonT), col: '#ffd23d' }; } };
  if (C.kind === 'escape') RU.overlay = (R, c) => { if (!c.finished && c.stormImm > 3.6) return { text: '¡TE ATRAPÓ LA TORMENTA!', sub: 'aguanta… ya sales', col: '#fff4d8', blink: true }; };
  return RU;
};
