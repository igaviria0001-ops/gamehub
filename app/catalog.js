/* =========================================================================
   CATÁLOGO — lo que la colección sabe de cada juego (sin cargarlo):
   nombre, colores, fotos, modos, escenarios y controles. Los ids de modos y
   escenarios son los mismos que usa cada juego por dentro.
   ========================================================================= */
const GAMES = [
  {
    id: 'tira-y-afloja', file: 'games/tira-y-afloja.html', name: 'Tira y Afloja', short: 'Tira y Afloja', num: '01',
    tag: 'Duelo de chicle', kind: 'Física y empujones',
    desc: 'Dos chicles unidos por un hilo pelean en el colegio: tirar te hace pesado, aflojar te vuelve ágil. Empuja, embiste, salta en tirachinas y echa al otro a la caneca.',
    c1: '#ff5d8f', c2: '#45d6b0', c3: '#ffd84d', ink: '#2a1710', font: 'tya',
    shots: ['tya-cafeteria', 'tya-bus', 'tya-arte', 'tya-profe'],
    modes: [
      { id: 'caneca', name: '¡A la caneca!', desc: 'Echa al otro a la caneca. Gana quien llegue primero a las rondas.', len: [2, 3, 4], lenTxt: n => `primero a ${n} rondas`, mins: 3 },
      { id: 'chicles', name: 'Atrapa chicles', desc: 'Recoge más chicles que el otro en 75 segundos.', mins: 2 },
      { id: 'rey', name: 'Rey del borrador', desc: 'Quédate solo encima del borrador gigante: primero a 20.', mins: 2 },
      { id: 'gol', name: 'Gol de canica', desc: 'Mete la canica en el arco del otro: primero a 5 goles.', map: 'gimnasio', mins: 3 },
      { id: 'escalada', name: 'Escalada tramposa', desc: 'Sube la torre antes de que llegue el agua y toca la campana.', map: 'torre', len: [2, 3, 4], lenTxt: n => `primero a ${n} rondas`, mins: 3 },
    ],
    maps: [['pupitre', 'El Pupitre'], ['gimnasio', 'El Gimnasio'], ['laboratorio', 'El Laboratorio'], ['cafeteria', 'La Cafetería'], ['arte', 'El Salón de Arte'], ['biblioteca', 'La Biblioteca'], ['bus', 'El Bus Escolar'], ['profe', 'El Escritorio del Profe']],
    extraMaps: [['torre', 'La Torre del Reloj']],
    opts: [{ id: 'fiesta', name: 'Modo Fiesta', desc: 'una sorpresa distinta en cada ronda', type: 'bool', def: false }],
    chars: false,
    keys: [['J1', 'A D moverse · W saltar · S pegarse · E tirar · Q aflojar'], ['J2', 'J L moverse · I saltar · K pegarse · O tirar · U aflojar']],
    touch: 'En el celular: cada uno en su mitad de la pantalla, con flechas y botones.',
    extras: ['Campaña de 30 salas con 6 jefes', 'Fuga del colegio para dos', 'Retos de técnica y entrenamiento', 'Reto del día'],
  },
  {
    id: 'ventolera', file: 'games/ventolera.html', name: 'Ventolera', short: 'Ventolera', num: '02',
    tag: 'Duelo de alas de chorro', kind: 'Combate aéreo',
    desc: 'Pilotos con alas de chorro se persiguen entre palmas de cera, rascacielos, galeones y globos. Ráfagas, misiles que se esquivan con un tonel, bengalas y maniobras de película.',
    c1: '#ffb36b', c2: '#6fc3ff', c3: '#ff7a8a', ink: '#141a3a', font: 'vento',
    shots: ['vento-capadocia', 'vento-medellin', 'vento-cartagena', 'vento-cocora'],
    modes: [
      { id: 'duel', name: 'Duelo', desc: 'Derriba al otro: gana quien gane las rondas.', len: [2, 3, 4], lenTxt: n => `al mejor de ${n * 2 - 1} rondas`, mins: 3 },
      { id: 'targets', name: 'Blancos', desc: 'Revienta más globos y drones que el otro en 90 segundos.', mins: 2 },
      { id: 'case', name: 'Maletín', desc: 'Quien lleva el maletín suma; embestir lo roba.', mins: 3 },
      { id: 'race', name: 'Carrera', desc: 'Aros en orden a 3 vueltas, con armas.', mins: 4 },
    ],
    maps: [['cocora', 'Valle de Cocora'], ['medellin', 'Medellín de noche'], ['bogota', 'Bogotá en tormenta'], ['cartagena', 'Cartagena al atardecer'], ['capadocia', 'Capadocia']],
    opts: [],
    chars: true, charsName: 'pilotos',
    keys: [['J1', 'WASD apuntar · Espacio/F ráfaga · Shift/Q turbo · E/R misil · C/V tonel'], ['J2', 'IJKL o flechas · Ñ/Ctrl der. ráfaga · O/Alt Gr turbo · U/Enter misil · H/N tonel']],
    touch: 'En el celular: palanca flotante y botones de ráfaga, turbo y misil para cada uno.',
    extras: ['Travesía de 10 etapas (de uno o de dos)', 'Jefe en pareja contra La Sombra', 'Copa de 5 pruebas', 'Escuela de vuelo'],
  },
  {
    id: 'sortilegio', file: 'games/sortilegio.html', name: 'Sortilegio', short: 'Sortilegio', num: '03',
    tag: 'Duelo de magos', kind: 'Hechizos y fusiones',
    desc: 'Magos con un elemento en cada mano: toca, carga o funde las dos para crear 28 hechizos. Reacciones con el terreno, combinaciones y el Gran Sortilegio.',
    c1: '#ffd36b', c2: '#9a5cff', c3: '#ff7a3d', ink: '#120a22', font: 'sorti',
    shots: ['sorti-volcan', 'sorti-cano', 'sorti-ciudad', 'sorti-paramo'],
    modes: [
      { id: 'duel', name: 'Duelo', desc: 'Tumba al otro mago: gana quien gane las rondas.', len: [2, 3, 4], lenTxt: n => `al mejor de ${n * 2 - 1} rondas`, mins: 3 },
      { id: 'tejo', name: 'Tejo encantado', desc: 'Mete el tejo en el bocín del otro a punta de hechizos.', mins: 3 },
      { id: 'hunt', name: 'Cacería de espantos', desc: 'Cada espanto cae solo con su contrario: cambia de manos.', mins: 2 },
      { id: 'altar', name: 'El Altar', desc: 'Suma quien esté solo dentro del círculo sagrado.', mins: 2 },
    ],
    maps: [['paramo', 'Páramo de Iguaque'], ['rio', 'Río Magdalena'], ['volcan', 'Volcán Puracé'], ['ciudad', 'Ciudad Perdida'], ['cano', 'Caño Cristales']],
    opts: [],
    chars: true, charsName: 'magos',
    keys: [['J1', 'WASD moverse · F/C mano izq. · G/V mano der. · H/Espacio esquivar'], ['J2', 'Flechas moverse · K mano izq. · L mano der. · Ñ esquivar']],
    touch: 'En el celular: palanca, dos manos y el rombo de fusión en el medio.',
    extras: ['Campaña en equipo de 18 niveles (cielo e infierno)', '13 magos con atuendos', 'Grimorio de 28 fusiones', 'Escuela de magia'],
  },
  {
    id: 'vertigo', file: 'games/vertigo.html', name: 'VÉRTIGO', short: 'VÉRTIGO', num: '04',
    tag: 'La Copa Esmeralda', kind: 'Carreras en 3D',
    desc: 'Bólidos que derrapan, saltan, flotan en lancha y planean con alas por 10 pistas del mundo. Objetos, turbos esmeralda, batallas y pantalla dividida para dos.',
    c1: '#3dffa8', c2: '#00c8ff', c3: '#ffd23d', ink: '#04140f', font: 'vtg',
    shots: ['vertigo-tokio', 'vertigo-santorini', 'vertigo-guatape', 'vertigo-egipto'],
    modes: [
      { id: 'quick', name: 'Carrera', desc: 'Contra 4 rivales de la máquina: gana quien llegue más adelante de los dos.', len: [2, 3, 4], lenTxt: n => `${n} vueltas`, mins: 4 },
      { id: 'duel', name: 'Mano a mano', desc: 'Sin máquina: el primero en ganar 2 carreras.', len: [2, 3, 4], lenTxt: n => `carreras de ${n} vueltas`, mins: 8 },
      { id: 'elim', name: 'Eliminación', desc: 'Cada 15 segundos sale el último. Gana quien dure más.', mins: 3 },
      { id: 'battle', name: 'Batalla', desc: 'Arena con 3 corazones: embiste con turbo. Último en pie.', maps: 'arenas', mins: 3 },
    ],
    maps: [['guatape', 'Guatapé'], ['venecia', 'Venecia'], ['tokio', 'Tokio'], ['halong', 'Bahía de Ha Long'], ['canon', 'Gran Cañón'], ['islandia', 'Islandia'], ['amazonas', 'Amazonas'], ['santorini', 'Santorini'], ['egipto', 'Egipto'], ['dorado', 'El Dorado']],
    arenas: [['coliseo', 'Coliseo de Roma'], ['uyuni', 'Salar de Uyuni'], ['totumo', 'Volcán del Totumo']],
    opts: [{ id: 'diff', name: 'Rivales de la máquina', type: 'seg', def: 1, items: [[0, 'Fáciles'], [1, 'Normales'], [2, 'Difíciles']] }],
    chars: true, charsName: 'pilotos',
    keys: [['J1', 'WASD manejar · F/C derrape · G/V objeto · H/Espacio turbo'], ['J2', 'Flechas manejar · K derrape · L objeto · Ñ turbo']],
    touch: 'En el celular: pantalla dividida con botones para cada uno.',
    extras: ['Vuelta al mundo (campaña)', 'Gran Premio de 3 copas', 'Persecución de jefes', 'Escuela y 24 desafíos'],
  },
];
const GAME = Object.fromEntries(GAMES.map(g => [g.id, g]));
// escenarios que sirven para un modo (algunos modos tienen cancha fija o usan arenas)
function mapsFor(g, mode) {
  const M = g.modes.find(m => m.id === mode);
  if (M && M.map) return [[M.map, (g.maps.concat(g.extraMaps || [])).find(x => x[0] === M.map)[1]]];
  if (M && M.maps === 'arenas') return g.arenas;
  return g.maps;
}
function mapName(g, id) { const all = g.maps.concat(g.extraMaps || [], g.arenas || []); const m = all.find(x => x[0] === id); return m ? m[1] : id; }
const LEN_IDX = { corta: 0, normal: 1, larga: 2 };
