/* =========================================================================
   PISTAS — puntos de control [x, z, altura, ancho, peralte°] (cerrada).
   Zonas: town (calle de pueblo), air (vuelo con ala tras una rampa grande),
   water (lancha sobre el embalse con olas y marejadas), gap (abismo).
   Zonas por índice de punto de control (fracciones permitidas).
   ========================================================================= */
const TRACKS = {
  guatape: {
    id: 'guatape', name: 'Guatapé', sub: 'El Peñol y el embalse', country: 'Colombia', laps: 3, theme: 'guatape', shoulder: 6,
    pts: [[-240, 220, 4, 15, 0], [-130, 220, 4, 14, 0], [-60, 215, 4, 14, 0], [-25, 180, 4, 14, -3], [-20, 120, 4, 14, 0], [5, 85, 4, 14, 3], [60, 80, 5, 15, 0], [160, 95, 5, 16, 0], [280, 100, 6, 16, 0], [350, 60, 9, 16, -6], [360, -20, 18, 15, 0], [355, -110, 30, 26, 0], [350, -210, 22, 26, 0], [358, -290, 12, 15, 0], [372, -340, 11, 14, -10], [330, -390, 10, 13, -12], [270, -370, 10, 13, -10], [265, -285, 9, 14, 0], [220, -200, 8, 15, 4], [130, -170, 6, 16, 0], [40, -215, 0.6, 18, 0], [-60, -185, 0.6, 18, 0], [-160, -225, 0.6, 18, 0], [-250, -190, 6, 15, 0], [-310, -140, 7, 15, 0], [-350, -60, 5, 15, 0], [-360, 50, 9, 16, -8], [-330, 160, 6, 16, -9], [-290, 215, 4, 15, -5]],
    zones: [
      { type: 'town', from: 28.4, to: 6.6 },
      { type: 'air', from: 10.62, to: 12.85 },
      { type: 'water', from: 19.9, to: 22.12, swells: [20.35, 21.05, 21.75] },
      { type: 'gap', from: 24.32, to: 24.62 },
    ],
    ramps: [{ at: 10.6, angle: 12, len: 22, big: true }, { at: 24.28, angle: 9, len: 16 }],
    rings: [{ d: 40, u: 0, h: 8.5 }, { d: 80, u: -6, h: 10 }, { d: 120, u: 6, h: 6 }, { d: 158, u: -2, h: 6.5 }, { d: 192, u: 3, h: 3.8, big: true }],
    gems: [
      { at: 7.4, n: 6, u: -3, gap: 7 }, { at: 9.2, n: 5, u: 0, gap: 6 }, { at: 17.2, n: 6, u: 2, gap: 6, wave: 3 },
      { at: 20.6, n: 8, u: 0, gap: 7, wave: 5 }, { at: 25.3, n: 6, u: 2, gap: 7 }, { at: 1.2, n: 5, u: -4, gap: 7 },
    ],
    boxes: [{ at: 1.55, n: 4 }, { at: 8.35, n: 4 }, { at: 16.75, n: 4 }, { at: 21.4, n: 4, gap: 4 }, { at: 25.9, n: 4 }],
    pads: [{ at: 7.9, u: 3 }, { at: 10.2, u: 0 }, { at: 19.3, u: 0 }, { at: 23.6, u: 2 }],
    start: 0.35, // dónde está la parrilla (índice de punto de control)
    rock: [-60, -560], lake: { y: 0.6 },
  },
};
TRACKS.venecia = {
  id: 'venecia', name: 'Venecia', sub: 'Canales al atardecer', country: 'Italia', laps: 3, theme: 'venecia', shoulder: 5,
  pts: [[-200, 150, 2, 16, 0], [-60, 160, 2, 16, 0], [80, 150, 2, 16, 0], [170, 125, 2, 14, -6], [205, 60, 2, 11, 0], [185, 0, 2, 10, 8], [125, -25, 3.6, 10, 0], [70, -15, 2, 10, -6], [35, -65, 2, 11, 0], [55, -130, 2, 18, 0], [130, -165, 2, 18, 0], [215, -170, 5, 16, 0], [300, -185, 17, 26, 0], [385, -150, 14, 26, 0], [425, -70, 4, 16, 0], [430, 20, 2, 15, 6], [385, 120, 2, 16, 0], [300, 230, 0.6, 18, 0], [160, 270, 0.6, 18, 0], [10, 245, 0.6, 18, 0], [-140, 280, 0.6, 18, 0], [-265, 255, 2, 15, 0], [-332, 212, 2, 15, -6], [-305, 160, 2, 15, -6]],
  zones: [
    { type: 'town', from: 3.55, to: 8.45 },
    { type: 'air', from: 11.57, to: 13.85 },
    { type: 'water', from: 16.65, to: 20.35, swells: [17.7, 18.6, 19.5] },
  ],
  ramps: [{ at: 11.55, angle: 13, len: 24, big: true }],
  rings: [{ d: 38, u: 0, h: 8.5 }, { d: 78, u: 6, h: 10 }, { d: 118, u: -6, h: 7 }, { d: 158, u: 2, h: 6 }, { d: 196, u: -3, h: 3.8, big: true }],
  boxes: [{ at: 1.2, n: 4 }, { at: 9.4, n: 4 }, { at: 15.2, n: 4 }, { at: 18.1, n: 4, gap: 4 }, { at: 22.6, n: 4 }],
  gems: [{ at: 0.5, n: 6, u: 3, gap: 7 }, { at: 5.6, n: 5, u: 0, gap: 6 }, { at: 9.8, n: 6, u: -4, gap: 7, wave: 3 }, { at: 14.4, n: 6, u: 0, gap: 7 }, { at: 19.0, n: 8, u: 0, gap: 7, wave: 5 }, { at: 23.4, n: 5, u: 2, gap: 7 }],
  pads: [{ at: 2.4, u: -3 }, { at: 10.9, u: 0 }, { at: 16.2, u: 2 }, { at: 21.6, u: 0 }],
  lake: { y: 0.6 }, terrain: { flat: true, base: -2.5 },
};
TRACKS.tokio = {
  id: 'tokio', name: 'Tokio', sub: 'Neón de noche', country: 'Japón', laps: 3, theme: 'tokio', shoulder: 5,
  pts: [[-220, 0, 2, 16, 0], [-100, 0, 2, 16, 0], [0, -10, 2, 14, 0], [80, -50, 2, 12, 6], [100, -130, 2, 12, 0], [60, -200, 2, 12, -6], [-20, -230, 6, 14, 0], [-120, -240, 14, 15, 8], [-210, -200, 16, 15, 10], [-260, -110, 16, 15, 0], [-250, -20, 17, 16, 0], [-200, 80, 18, 16, -6], [-100, 120, 20, 16, 0], [10, 140, 24, 26, 0], [120, 130, 18, 26, 0], [210, 100, 12, 16, 0], [280, 40, 8, 15, 6], [300, -50, 2, 15, 0], [280, -140, 0.6, 18, 0], [230, -260, 0.6, 18, 0], [120, -330, 0.6, 18, 0], [0, -345, 0.6, 18, 0], [-120, -330, 2, 16, 0], [-260, -360, 2, 15, -6], [-370, -250, 2, 15, 0], [-380, -110, 2, 15, 0], [-330, -20, 2, 15, 6]],
  zones: [
    { type: 'town', from: 2.4, to: 5.6 },
    { type: 'elev', from: 6.3, to: 12.18 }, { type: 'elev', from: 14.4, to: 16.6 },
    { type: 'air', from: 12.17, to: 14.35 },
    { type: 'water', from: 17.5, to: 21.5, swells: [18.6, 19.6, 20.6] },
  ],
  ramps: [{ at: 12.15, angle: 12, len: 24, big: true }],
  rings: [{ d: 40, u: 0, h: 9 }, { d: 82, u: -7, h: 11 }, { d: 124, u: 6, h: 8 }, { d: 166, u: -2, h: 7 }, { d: 205, u: 3, h: 4.5, big: true }],
  boxes: [{ at: 1.3, n: 4 }, { at: 7.4, n: 4 }, { at: 11.0, n: 4 }, { at: 19.1, n: 4, gap: 4 }, { at: 24.5, n: 4 }],
  gems: [{ at: 0.4, n: 6, u: 3, gap: 7 }, { at: 3.6, n: 5, u: 0, gap: 6 }, { at: 8.3, n: 6, u: -3, gap: 7, wave: 3 }, { at: 15.2, n: 6, u: 0, gap: 7 }, { at: 20.0, n: 8, u: 0, gap: 7, wave: 5 }, { at: 25.2, n: 6, u: 2, gap: 7 }],
  pads: [{ at: 1.9, u: 3 }, { at: 11.6, u: 0 }, { at: 16.9, u: -2 }, { at: 23.4, u: 0 }],
  lake: { y: 0.6 }, terrain: { flat: true, base: 1.3 },
};
TRACKS.halong = {
  id: 'halong', lowAt: [10.0], name: 'Bahía de Ha Long', sub: 'Islas de piedra y juncos', country: 'Vietnam', laps: 3, theme: 'halong', shoulder: 5,
  pts: [[-150, 220, 2, 16, 0], [-30, 230, 2, 16, 0], [90, 215, 2, 15, 0], [190, 170, 1.2, 18, 0], [260, 90, 0.6, 20, 0], [280, -20, 0.6, 20, 0], [240, -130, 0.6, 20, 0], [270, -240, 0.6, 20, 0], [200, -330, 1.2, 18, 0], [100, -360, 2, 15, 6], [10, -330, 2, 15, 0], [-70, -360, 5, 15, 0], [-170, -350, 18, 26, 0], [-270, -300, 15, 26, 0], [-330, -210, 4, 16, 0], [-340, -120, 1.2, 18, 0], [-300, -20, 0.6, 20, 0], [-350, 70, 0.6, 20, 0], [-300, 150, 1.2, 18, 0], [-240, 200, 2, 16, -6]],
  zones: [
    { type: 'water', from: 3.25, to: 7.75, swells: [4.6, 5.6, 6.6] },
    { type: 'air', from: 11.62, to: 13.85 },
    { type: 'water', from: 15.1, to: 17.75, swells: [16.1, 17.0] },
  ],
  ramps: [{ at: 11.6, angle: 12, len: 22, big: true }],
  rings: [{ d: 38, u: 0, h: 9 }, { d: 76, u: 7, h: 10 }, { d: 114, u: -6, h: 8 }, { d: 152, u: 2, h: 6 }, { d: 190, u: -3, h: 4, big: true }],
  boxes: [{ at: 1.0, n: 4 }, { at: 5.1, n: 4, gap: 4 }, { at: 9.6, n: 4 }, { at: 16.5, n: 4, gap: 4 }, { at: 19.2, n: 4 }],
  gems: [{ at: 0.3, n: 6, u: -3, gap: 7 }, { at: 4.0, n: 8, u: 0, gap: 7, wave: 5 }, { at: 9.0, n: 5, u: 2, gap: 6 }, { at: 14.3, n: 5, u: 0, gap: 7 }, { at: 16.4, n: 8, u: 0, gap: 7, wave: 5 }],
  pads: [{ at: 1.8, u: 3 }, { at: 11.1, u: 0 }, { at: 18.6, u: -2 }],
  lake: { y: 0.6 }, terrain: { flat: true, base: -3 },
};
TRACKS.canon = {
  id: 'canon', name: 'Gran Cañón', sub: 'El salto del borde', country: 'Estados Unidos', laps: 3, theme: 'canon', shoulder: 5,
  pts: [[-55, 268, 45, 16, 0], [20, 270, 45, 16, 0], [130, 250, 44, 15, 0], [220, 210, 40, 14, 0], [280, 150, 32, 13, 8], [250, 70, 22, 13, 0], [300, -10, 12, 13, -8], [250, -80, 4, 15, 0], [160, -110, 1.0, 18, 0], [40, -90, 0.6, 20, 0], [-80, -120, 0.6, 20, 0], [-200, -90, 0.6, 20, 0], [-300, -120, 1.2, 18, 0], [-380, -180, 8, 14, -8], [-330, -270, 20, 13, 0], [-230, -300, 32, 14, 8], [-150, -250, 42, 15, 0], [-120, -170, 46, 16, 0], [-110, -40, 60, 26, 0], [-120, 90, 52, 26, 0], [-116, 172, 46, 16, 0], [-118, 236, 45, 16, -8]],
  zones: [
    { type: 'water', from: 8.0, to: 11.95, swells: [9.5, 10.5, 11.4] },
    { type: 'air', from: 17.12, to: 19.92 },
  ],
  ramps: [{ at: 17.1, angle: 12, len: 24, big: true }],
  rings: [{ d: 45, u: 0, h: 9 }, { d: 100, u: -7, h: 11 }, { d: 160, u: 6, h: 9 }, { d: 220, u: -3, h: 7 }, { d: 280, u: 3, h: 4.5, big: true }],
  boxes: [{ at: 1.0, n: 4 }, { at: 5.5, n: 4 }, { at: 10.0, n: 4, gap: 4 }, { at: 15.6, n: 4 }, { at: 21.3, n: 4 }],
  gems: [{ at: 0.3, n: 6, u: 3, gap: 7 }, { at: 4.4, n: 5, u: 0, gap: 6 }, { at: 9.0, n: 8, u: 0, gap: 7, wave: 5 }, { at: 14.2, n: 6, u: -2, gap: 7 }, { at: 20.4, n: 5, u: 0, gap: 6 }],
  pads: [{ at: 2.2, u: 2 }, { at: 7.6, u: 0 }, { at: 16.8, u: 0 }],
  lake: { y: 0.6, plane: false }, terrain: { canyon: true, top: 44, seg: 300, gorge: { z: 40, amp: 30, wl: 220, flat: 22, slope: 108, bottom: -122, x0: -1500, x1: 120 } },
};
const TRACK_ORDER = ['guatape', 'venecia', 'tokio', 'halong', 'canon', 'islandia', 'amazonas', 'santorini', 'egipto', 'dorado'];
TRACKS.islandia = {
  id: 'islandia', name: 'Islandia', sub: 'Volcanes bajo la aurora', country: 'Islandia', laps: 3, theme: 'islandia', shoulder: 5,
  pts: [[-250, 200, 2, 16, 0], [-120, 212, 2, 16, 0], [0, 205, 3, 15, 0], [100, 175, 6, 14, -4], [170, 115, 10, 15, 0], [200, 35, 12, 16, 0], [180, -50, 14, 15, 6], [120, -100, 18, 15, 0], [40, -125, 22, 16, 0], [-45, -150, 20, 16, 0], [-112, -200, 14, 16, -4], [-100, -268, 7, 16, 0], [30, -305, 0.6, 18, 0], [140, -315, 0.6, 18, 0], [250, -285, 0.6, 18, 0], [325, -215, 4, 16, 0], [360, -125, 10, 15, 0], [380, -20, 24, 26, 0], [372, 90, 28, 26, 0], [335, 190, 20, 26, 0], [262, 270, 9, 16, 0], [150, 318, 6, 15, 6], [20, 330, 4, 15, 0], [-110, 322, 3, 15, -6], [-230, 305, 2, 15, 0], [-312, 295, 2, 15, 5], [-358, 255, 2, 15, 8], [-345, 210, 2, 15, 6]],
  zones: [
    { type: 'ice', from: 7.2, to: 10.8 },
    { type: 'water', from: 11.85, to: 14.4, swells: [12.6, 13.3, 14.0] },
    { type: 'air', from: 16.62, to: 19.95 },
  ],
  ramps: [{ at: 16.6, angle: 12, len: 22, big: true }],
  rings: [{ d: 40, u: 0, h: 9 }, { d: 85, u: -7, h: 11 }, { d: 130, u: 6, h: 9 }, { d: 175, u: -3, h: 7 }, { d: 215, u: 3, h: 4.5, big: true }],
  geysers: [{ at: 4.35, u: -4 }, { at: 4.75, u: 4 }, { at: 5.2, u: 0 }, { at: 5.65, u: -5 }],
  boxes: [{ at: 1.2, n: 4 }, { at: 6.4, n: 4 }, { at: 11.0, n: 4 }, { at: 15.4, n: 4 }, { at: 22.4, n: 4 }],
  gems: [{ at: 0.4, n: 6, u: 3, gap: 7 }, { at: 3.0, n: 5, u: 0, gap: 6 }, { at: 8.2, n: 6, u: 0, gap: 7, wave: 4 }, { at: 12.5, n: 8, u: 0, gap: 7, wave: 5 }, { at: 21.0, n: 6, u: -2, gap: 7 }, { at: 24.0, n: 5, u: 2, gap: 7 }],
  pads: [{ at: 2.2, u: -3 }, { at: 9.9, u: 0 }, { at: 16.1, u: 0 }, { at: 23.2, u: 2 }],
  lake: { y: 0.6 },
};
TRACKS.amazonas = {
  id: 'amazonas', name: 'Amazonas', sub: 'El río de la selva', country: 'Brasil', laps: 3, theme: 'amazonas', shoulder: 5,
  pts: [[-205, 118, 4, 15, 0], [-120, 138, 4, 15, 0], [-40, 120, 5, 14, -4], [20, 60, 6, 13, 0], [30, -20, 7, 13, 5], [-20, -90, 9, 13, 0], [-90, -140, 12, 13, -5], [-170, -160, 16, 14, 0], [-255, -200, 22, 15, 0], [-305, -275, 27, 16, 6], [-265, -365, 30, 26, 0], [-165, -418, 22, 26, 0], [-55, -440, 10, 26, 0], [60, -432, 2.5, 16, 0], [150, -400, 0.6, 18, 0], [240, -340, 0.6, 18, 0], [300, -250, 0.6, 18, 0], [330, -150, 0.6, 18, 0], [320, -40, 0.6, 18, 0], [290, 60, 3, 16, 0], [230, 150, 4, 15, -5], [130, 200, 4, 15, 0], [20, 232, 4, 15, 4], [-100, 232, 4, 15, 0], [-200, 214, 4, 15, -5], [-275, 214, 4, 15, -6], [-318, 198, 4, 15, -7], [-334, 163, 4, 15, -7], [-318, 128, 4, 15, -6], [-280, 113, 4, 15, -3]],
  zones: [
    { type: 'town', from: 1.7, to: 6.3 },
    { type: 'air', from: 9.62, to: 12.2 },
    { type: 'water', from: 13.7, to: 18.25, swells: [14.7, 15.5, 16.3, 17.2], current: 5 },
  ],
  ramps: [{ at: 9.6, angle: 12, len: 22, big: true }],
  rings: [{ d: 38, u: 0, h: 10 }, { d: 80, u: 6, h: 12 }, { d: 122, u: -6, h: 9 }, { d: 162, u: 2, h: 6.5 }, { d: 200, u: -2, h: 4, big: true }],
  boxes: [{ at: 0.9, n: 4 }, { at: 6.9, n: 4 }, { at: 12.9, n: 4 }, { at: 16.0, n: 4, gap: 4 }, { at: 22.5, n: 4 }],
  gems: [{ at: 0.3, n: 6, u: 3, gap: 7 }, { at: 3.4, n: 5, u: 0, gap: 6 }, { at: 7.6, n: 6, u: -2, gap: 7 }, { at: 14.3, n: 8, u: 0, gap: 7, wave: 5 }, { at: 19.6, n: 6, u: 2, gap: 7 }, { at: 24.4, n: 5, u: 0, gap: 7 }],
  pads: [{ at: 1.2, u: -3 }, { at: 9.1, u: 0 }, { at: 15.6, u: 4 }, { at: 21.2, u: 0 }],
  lake: { y: 0.6 },
};
TRACKS.santorini = {
  id: 'santorini', name: 'Santorini', sub: 'Casas blancas sobre la caldera', country: 'Grecia', laps: 3, theme: 'santorini', shoulder: 4,
  pts: [[250, 200, 40, 15, 0], [245, 100, 40, 14, 0], [215, 10, 40, 12, 0], [160, -60, 40, 11, -4], [95, -100, 40, 12, 0], [40, -125, 40, 14, 0], [-30, -150, 36, 26, 0], [-140, -175, 28, 26, 0], [-250, -150, 20, 26, 0], [-325, -85, 12, 26, 0], [-355, 10, 5, 16, 0], [-315, 105, 3, 16, 0], [-245, 160, 0.6, 18, 0], [-160, 190, 0.6, 18, 0], [-80, 205, 0.6, 18, 0], [-30, 220, 2, 14, 0], [-12, 260, 4, 12, 0], [-10, 318, 10, 13, 0], [0, 344, 12, 13, -6], [25, 355, 13, 13, -8], [50, 344, 14, 13, -6], [60, 318, 16, 13, 0], [60, 265, 21, 13, 0], [60, 232, 24, 13, 0], [70, 208, 25, 13, 6], [93, 198, 26, 13, 8], [116, 208, 27, 13, 6], [125, 232, 29, 13, 0], [126, 290, 34, 13, 0], [128, 350, 38, 13, 0], [165, 395, 40, 14, -4], [225, 392, 40, 15, -6], [258, 320, 40, 15, -4]],
  zones: [
    { type: 'town', from: 1.45, to: 4.6 },
    { type: 'air', from: 5.62, to: 9.45 },
    { type: 'water', from: 11.55, to: 14.45, swells: [12.3, 13.0, 13.8] },
  ],
  ramps: [{ at: 5.6, angle: 12, len: 22, big: true }],
  rings: [{ d: 42, u: 0, h: 10 }, { d: 90, u: -7, h: 12 }, { d: 140, u: 6, h: 10 }, { d: 190, u: -2, h: 8 }, { d: 240, u: 3, h: 5, big: true }],
  boxes: [{ at: 0.6, n: 4 }, { at: 5.0, n: 4 }, { at: 10.4, n: 4 }, { at: 13.2, n: 4, gap: 4 }, { at: 21.5, n: 3 }, { at: 28.8, n: 4 }],
  gems: [{ at: 0.2, n: 6, u: -2, gap: 7 }, { at: 2.6, n: 5, u: 0, gap: 6 }, { at: 10.2, n: 6, u: 0, gap: 7 }, { at: 12.4, n: 8, u: 0, gap: 7, wave: 5 }, { at: 16.6, n: 5, u: 0, gap: 7 }, { at: 26.0, n: 6, u: 0, gap: 7 }],
  pads: [{ at: 0.9, u: 3 }, { at: 5.2, u: 0 }, { at: 15.4, u: 0 }, { at: 29.4, u: -3 }],
  lake: { y: 0.6 }, terrain: { cliff: { nx: 1, nz: 0, d: -20, w: 50, top: 40, low: -14 } },
};
TRACKS.egipto = {
  id: 'egipto', name: 'Egipto', sub: 'Pirámides y el Nilo', country: 'Egipto', laps: 3, theme: 'egipto', shoulder: 6,
  pts: [[-333, -320, 3, 16, 0], [-192, -335, 2, 16, 0], [-64, -346, 0.6, 18, 0], [77, -339, 0.6, 18, 0], [218, -307, 0.6, 18, 0], [320, -243, 2, 16, 0], [371, -141, 3, 13, 0], [384, -26, 3, 12, 0], [378, 90, 3, 12, 0], [333, 192, 4, 14, -5], [243, 256, 6, 15, 0], [141, 275, 11, 15, 0], [51, 288, 4, 15, 0], [-38, 307, 12, 15, 0], [-128, 320, 5, 15, 0], [-218, 314, 14, 16, 0], [-320, 269, 26, 26, 0], [-410, 166, 30, 26, 0], [-448, 38, 22, 26, 0], [-442, -90, 10, 26, 0], [-442, -192, 4, 16, 0], [-416, -275, 3, 16, 5], [-371, -317, 3, 16, 3]],
  zones: [
    { type: 'water', from: 1.6, to: 4.55, swells: [2.4, 3.1, 3.8] },
    { type: 'town', from: 5.7, to: 8.4 },
    { type: 'air', from: 15.52, to: 19.45 },
  ],
  ramps: [{ at: 15.5, angle: 12, len: 22, big: true }],
  rings: [{ d: 45, u: 0, h: 10 }, { d: 95, u: 6, h: 13 }, { d: 145, u: -6, h: 11 }, { d: 195, u: 2, h: 8 }, { d: 245, u: -3, h: 5, big: true }],
  boxes: [{ at: 0.8, n: 4 }, { at: 3.1, n: 4, gap: 4 }, { at: 9.2, n: 4 }, { at: 12.0, n: 4 }, { at: 20.6, n: 4 }],
  gems: [{ at: 0.2, n: 6, u: 3, gap: 7 }, { at: 2.0, n: 8, u: 0, gap: 7, wave: 5 }, { at: 6.4, n: 6, u: 0, gap: 7 }, { at: 10.6, n: 6, u: -2, gap: 7, wave: 3 }, { at: 13.4, n: 5, u: 2, gap: 7 }, { at: 21.2, n: 5, u: 0, gap: 7 }],
  pads: [{ at: 1.1, u: 0 }, { at: 9.6, u: 3 }, { at: 15.0, u: 0 }, { at: 21.8, u: -2 }],
  lake: { y: 0.6 }, terrain: { flat: true, base: 1.4, dunes: 9 },
  pyramids: [[-180, 50, 66], [-62, -70, 52], [14, -160, 36]], sphinx: [-262, -150],
};
TRACKS.dorado = {
  id: 'dorado', name: 'El Dorado', sub: 'La ciudad de oro y la laguna sagrada', country: 'Colombia · leyenda muisca', laps: 3, theme: 'dorado', shoulder: 5,
  pts: [[-262, 140, 20, 16, 0], [-170, 155, 20, 15, 0], [-80, 150, 20, 13, 0], [0, 110, 20, 12, -5], [30, 40, 20, 12, 0], [0, -30, 20, 12, 5], [-60, -70, 21, 14, 0], [-150, -100, 24, 15, -4], [-240, -150, 30, 15, 0], [-300, -240, 32, 15, 6], [-280, -340, 30, 15, 0], [-200, -400, 26, 16, -4], [-100, -420, 20, 16, 0], [0, -420, 10, 16, 0], [100, -390, 2, 16, 0], [190, -340, 0.6, 18, 0], [270, -260, 0.6, 18, 0], [310, -160, 0.6, 18, 0], [300, -60, 0.6, 18, 0], [270, 30, 4, 16, 0], [240, 110, 12, 15, 0], [210, 190, 22, 16, 0], [140, 270, 36, 26, 0], [40, 320, 40, 26, 0], [-70, 330, 34, 26, 0], [-170, 300, 26, 26, 0], [-250, 252, 22, 16, 0], [-305, 252, 21, 16, 4], [-346, 224, 20, 16, 7], [-356, 180, 20, 16, 7], [-328, 147, 20, 16, 4]],
  zones: [
    { type: 'town', from: 1.4, to: 6.0 },
    { type: 'elev', from: 8.2, to: 11.2 },
    { type: 'water', from: 14.6, to: 18.4, swells: [15.6, 16.5, 17.4] },
    { type: 'air', from: 21.62, to: 25.45 },
  ],
  ramps: [{ at: 21.6, angle: 12, len: 22, big: true }],
  rings: [{ d: 40, u: 0, h: 10, big: true }, { d: 95, u: -7, h: 12 }, { d: 150, u: 6, h: 11 }, { d: 205, u: -2, h: 8 }, { d: 255, u: 3, h: 5, big: true }],
  boxes: [{ at: 0.8, n: 4 }, { at: 6.6, n: 4 }, { at: 12.4, n: 4 }, { at: 16.6, n: 4, gap: 4 }, { at: 20.2, n: 4 }, { at: 26.4, n: 4 }],
  gems: [{ at: 0.2, n: 8, u: 0, gap: 6, wave: 4 }, { at: 3.2, n: 6, u: 0, gap: 6 }, { at: 8.8, n: 8, u: 0, gap: 7, wave: 4 }, { at: 15.2, n: 10, u: 0, gap: 7, wave: 5 }, { at: 19.6, n: 6, u: 2, gap: 7 }, { at: 26.6, n: 6, u: -2, gap: 7 }],
  pads: [{ at: 1.1, u: 0 }, { at: 7.2, u: 3 }, { at: 13.0, u: 0 }, { at: 21.0, u: 0 }],
  lake: { y: 0.6 }, terrain: { bowl: { x: 240, z: -220, r: 170 } }, raft: [235, -210],
};
/* ---------- ARENAS de batalla: anillos anchos con columnas, rampas, cajas por todos lados ----------
   (a, b) semiejes, n puntos, y altura, w ancho; lob = lóbulos (trébol), hill = lomas */
const ringPts = (a, b, n, y, w, lob = 0, amp = 0, hill = 0, hk = 2) => Array.from({ length: n }, (_, i) => { const t = i / n * TAU, r = 1 + amp * Math.sin(lob * t); return [Math.cos(t) * a * r, Math.sin(t) * b * r, y + hill * Math.sin(hk * t), w, 0]; });
TRACKS.coliseo = {
  id: 'coliseo', name: 'Coliseo de Roma', sub: 'La arena de los gladiadores', country: 'Italia', laps: 99, theme: 'coliseo', shoulder: 1, arena: true,
  pts: ringPts(90, 66, 16, 1, 28),
  ramps: [{ at: 3.0, angle: 10, len: 9 }, { at: 11.0, angle: 10, len: 9 }],
  obstacles: [{ at: 1.6, u: 6 }, { at: 1.6, u: -6 }, { at: 5.4, u: 0 }, { at: 7.6, u: -8 }, { at: 9.6, u: 6 }, { at: 9.6, u: -6 }, { at: 13.4, u: 0 }, { at: 15.6, u: 8 }],
  boxes: [{ at: 0.4, n: 5, gap: 5 }, { at: 4.4, n: 5, gap: 5 }, { at: 8.4, n: 5, gap: 5 }, { at: 12.4, n: 5, gap: 5 }],
  gems: [{ at: 2.2, n: 6, u: -10, gap: 6 }, { at: 6.4, n: 6, u: 10, gap: 6 }, { at: 10.2, n: 6, u: -10, gap: 6 }, { at: 14.3, n: 6, u: 0, gap: 6, wave: 7 }],
  pads: [{ at: 2.6, u: 0 }, { at: 6.8, u: -9 }, { at: 10.6, u: 0 }, { at: 14.8, u: 9 }],
  terrain: { flat: true, base: 0.55 },
};
TRACKS.uyuni = {
  id: 'uyuni', name: 'Salar de Uyuni', sub: 'El espejo del cielo', country: 'Bolivia', laps: 99, theme: 'uyuni', shoulder: 1, arena: true,
  pts: ringPts(98, 98, 18, 1, 30, 3, 0.15),
  ramps: [{ at: 2.0, angle: 11, len: 10 }, { at: 8.0, angle: 11, len: 10 }, { at: 14.0, angle: 11, len: 10 }],
  obstacles: [{ at: 4.0, u: 7 }, { at: 4.0, u: -7 }, { at: 5.5, u: 0 }, { at: 10.0, u: 7 }, { at: 10.0, u: -7 }, { at: 11.5, u: 0 }, { at: 16.0, u: 7 }, { at: 16.0, u: -7 }, { at: 17.5, u: 0 }],
  boxes: [{ at: 0.6, n: 5, gap: 5 }, { at: 3.0, n: 4, gap: 6 }, { at: 6.6, n: 5, gap: 5 }, { at: 9.0, n: 4, gap: 6 }, { at: 12.6, n: 5, gap: 5 }, { at: 15.0, n: 4, gap: 6 }],
  gems: [{ at: 1.0, n: 6, u: 10, gap: 6 }, { at: 7.0, n: 6, u: -10, gap: 6 }, { at: 13.0, n: 6, u: 10, gap: 6 }],
  pads: [{ at: 1.6, u: -9 }, { at: 7.6, u: 9 }, { at: 13.6, u: -9 }],
  terrain: { flat: true, base: 0.6 },
};
TRACKS.totumo = {
  id: 'totumo', name: 'Volcán del Totumo', sub: 'Batalla en el lodo', country: 'Colombia', laps: 99, theme: 'totumo', shoulder: 1, arena: true,
  pts: ringPts(86, 78, 16, 3, 28, 0, 0, 3.2, 3),
  ramps: [{ at: 1.0, angle: 12, len: 9 }, { at: 6.4, angle: 12, len: 9 }, { at: 11.7, angle: 12, len: 9 }],
  obstacles: [{ at: 3.2, u: 5 }, { at: 3.2, u: -8 }, { at: 8.6, u: 7 }, { at: 8.6, u: -5 }, { at: 14.2, u: 7 }],
  mud: [{ at: 4.6, u: -5, r: 5 }, { at: 9.9, u: 6, r: 5 }, { at: 15.0, u: -2, r: 6 }, { at: 2.2, u: 9, r: 3.5 }, { at: 12.8, u: -9, r: 3.5 }],
  boxes: [{ at: 0.2, n: 5, gap: 5 }, { at: 5.5, n: 5, gap: 5 }, { at: 10.8, n: 5, gap: 5 }, { at: 14.4, n: 4, gap: 6 }],
  gems: [{ at: 2.0, n: 6, u: 0, gap: 6, wave: 8 }, { at: 7.4, n: 6, u: 0, gap: 6, wave: 8 }, { at: 12.6, n: 6, u: 0, gap: 6, wave: 8 }],
  pads: [{ at: 0.7, u: 8 }, { at: 6.1, u: -8 }, { at: 11.4, u: 8 }],
  lake: { y: -1.6 }, terrain: { flat: true, base: -3 },
};
const ARENA_ORDER = ['coliseo', 'uyuni', 'totumo'];
// copas del Gran Premio: dos de cinco pistas y la Gran Copa con todas
const CUPS = [
  { id: 'esmeralda', name: 'Copa Esmeralda', tracks: ['guatape', 'venecia', 'tokio', 'halong', 'canon'] },
  { id: 'dorada', name: 'Copa Dorada', tracks: ['islandia', 'amazonas', 'santorini', 'egipto', 'dorado'] },
  { id: 'mundial', name: 'Gran Copa', tracks: TRACK_ORDER },
];
const cupTracks = i => (CUPS[i] || CUPS[0]).tracks.filter(t => TRACKS[t]);
