/* =========================================================================
   SALAS DE LA CAMPAÑA — 5 por zona. Coordenadas del mundo (1920 × 1080);
   «y» de un piso = su borde de arriba. Cada sala: nombre, pista, tiempo meta
   (par), hilo inicial, lugares de aparición, salida, 3 envolturas y build(B).
   Medidas útiles (peso 3): salto ≈ 200 px, con salto doble ≈ 330, liviano
   (peso 1,5) ≈ 420; un hueco de 240 se salta corriendo.
   ========================================================================= */
(() => {
  const D = Campaign.define;

  /* ====================== ZONA 1 · EL SALÓN ====================== */
  D(0, {
    name: 'Primer día', par: 9, rope: 520,
    tip: 'Los dos tienen que entrar por la puerta. Mantén saltar para subir más.',
    spawn: [[160, 880], [300, 880]], exit: { x: 1780, y: 880 },
    wrappers: [[445, 690], [800, 740], [1480, 570]],
    build(B) {
      B.deco('window', 120, 160); B.deco('board', 640, 120, { text: 'Lección 1:\nlleguen juntos a la puerta' });
      B.ground(0, 710); B.ground(890, 1920);
      B.block(360, 820, 130, 60, 'books');
      B.block(1150, 760, 140, 120);
      B.plank(1350, 650, 260);
      B.hazard(710, 1030, 180, 50);
    },
  });
  D(0, {
    name: 'La placa', par: 9, rope: 400,
    tip: 'La placa pide peso 4,5: tiren del hilo para engordar y párense encima.',
    spawn: [[180, 880], [330, 880]], exit: { x: 1720, y: 880 },
    wrappers: [[300, 610], [1000, 560], [1560, 690]],
    build(B) {
      B.deco('board', 260, 110, { w: 460, text: 'Más hilo adentro\n= más peso' });
      B.ground(0, 1920);
      B.plate('p1', 700, 880, 140, 4.5, true);
      B.wall(1290, -20, 60, 600);
      B.gate(1290, 580, 60, 300, 'p1', 'up');
      B.block(1500, 780, 120, 100);
      B.sign(710, 690, 'PLACA', { color: '#ffe08a' });
    },
  });
  D(0, {
    name: 'Puente de papel', par: 15, rope: 400,
    tip: 'El papel solo aguanta a los livianos (máx 2,2): aflojen el hilo para pesar menos.',
    spawn: [[200, 880], [360, 880]], exit: { x: 1780, y: 640 },
    wrappers: [[960, 770], [1360, 560], [1640, 520]],
    build(B) {
      B.deco('window', 160, 170);
      B.ground(0, 620); B.ground(1300, 1920);
      B.paper(620, 880, 680, 2.2);
      B.hazard(620, 1030, 680, 50);
      B.block(1500, 640, 420, 240, 'books');
    },
  });
  D(0, {
    name: 'Pasarelas flojas', par: 20, rope: 760,
    tip: 'Las tablas se caen al rato. El que cruza primero puede anclarse (pegarse) y jalar al otro.',
    spawn: [[180, 880], [340, 880]], exit: { x: 1760, y: 880 },
    wrappers: [[300, 600], [860, 560], [1250, 690]],
    build(B) {
      B.deco('board', 1200, 110, { w: 480, text: 'Pegarse + tirar\n+ soltar = tirachinas' });
      B.ground(0, 640); B.ground(1120, 1920);
      B.crumble(725, 720, 110); B.crumble(905, 660, 110);
      B.hazard(640, 1030, 480, 50);
      B.block(1200, 790, 110, 90);
    },
  });
  D(0, {
    name: 'Recreo', par: 15, rope: 600,
    tip: 'El ascensor sube al que esté en el otro lado si este lado pesa más. Tirar = pesar más.',
    spawn: [[200, 880], [360, 880]], exit: { x: 1790, y: 520 },
    wrappers: [[630, 330], [900, 690], [1375, 600]],
    build(B) {
      B.deco('poster', 120, 260, { text: 'RECREO\n10:00', color: '#9dd6ff' });
      B.ground(0, 1920);
      B.block(840, 760, 120, 120);
      B.lift('l1', 980, 680, 1300, 880, 150, 200, 380, 0);
      B.block(1460, 520, 460, 360, 'books');
      B.lever('v1', 1580, 520);
      const f = B.fan(560, 300, 140, 560, 'up', 6000); f.link = 'v1';
      B.sign(1215, 600, 'ASCENSOR', { color: '#ffe08a' });
    },
  });

  /* ====================== ZONA 2 · SALÓN DE ARTE ====================== */
  D(1, {
    name: 'Témpera y secador', par: 11, rope: 520,
    tip: 'El secador empuja más a los livianos: crucen con peso. La témpera resbala.',
    spawn: [[150, 880], [300, 880]], exit: { x: 1780, y: 880 },
    wrappers: [[680, 650], [1070, 760], [1515, 600]],
    build(B) {
      B.deco('poster', 120, 220, { text: 'ARTE\n3° B', color: '#ffb0d0' });
      B.ground(0, 1000); B.ground(1140, 1920);
      B.slip(380, 880, 600);
      B.fan(1000, 640, 400, 240, 'left', 2600);
      B.block(1440, 700, 150, 180, 'metal');
      B.hazard(1000, 1030, 140, 50, 'ink');
    },
  });
  D(1, {
    name: 'Caballetes', par: 20, rope: 640,
    tip: 'Los caballetes van al mismo ritmo: súbanse cuando lleguen. Caer fuerte sobre la palanca abre la reja.',
    spawn: [[160, 880], [320, 880]], exit: { x: 1780, y: 880 },
    wrappers: [[830, 640], [1100, 430], [1330, 690]],
    build(B) {
      B.deco('poster', 120, 220, { text: 'NO TOCAR\nLOS\nCABALLETES', color: '#ffd59a' });
      B.ground(0, 520); B.ground(1420, 1920);
      B.mover(560, 800, 170, 150, 0, 4, 0);
      B.mover(900, 760, 170, 0, 110, 4, 0);
      B.mover(1180, 780, 170, 120, 0, 4, Math.PI);
      B.plank(950, 520, 150);
      B.lever('v1', 1025, 520, true);
      B.wall(1600, -20, 50, 620);
      B.gate(1600, 600, 50, 280, 'v1', 'up');
      B.hazard(520, 1030, 900, 50, 'ink');
      B.sign(1625, 560, 'REJA', { color: '#ffe08a' });
    },
  });
  D(1, {
    name: 'Papel picado', par: 22, rope: 400,
    tip: 'Primero pesados para la placa (4,5); después livianos para el papel (máx 2).',
    spawn: [[120, 880], [260, 880]], exit: { x: 1780, y: 600 },
    wrappers: [[300, 640], [965, 640], [1390, 520]],
    build(B) {
      B.ground(0, 560); B.block(1600, 600, 320, 480, 'books');
      B.plate('p1', 330, 880, 130, 4.5, true);
      B.wall(540, -20, 40, 620);
      B.gate(540, 600, 40, 280, 'p1', 'up');
      B.paper(600, 860, 180, 2); B.paper(850, 780, 160, 2); B.paper(1080, 700, 160, 2); B.paper(1310, 640, 160, 2);
      B.hazard(560, 1030, 1040, 50);
    },
  });
  D(1, {
    name: 'Tijeras locas', par: 13, rope: 450,
    tip: 'Las tijeras cortan el hilo si pasa cerca. La corriente del ventilador sube a los livianos.',
    spawn: [[150, 880], [300, 880]], exit: { x: 1760, y: 300 },
    wrappers: [[1390, 210], [700, 690], [1680, 220]],
    build(B) {
      B.ground(0, 1920);
      B.block(640, 760, 120, 120);
      B.block(1500, 300, 420, 580, 'books');
      B.fan(1300, 120, 180, 750, 'up', 5200);
      B.scissors(300, 600, 900, 6);
    },
  });
  D(1, {
    name: 'La exposición', par: 20, rope: 520,
    tip: 'Crucen livianos por el papel. Para subir, uno se queda pesado en el ascensor de la izquierda.',
    spawn: [[150, 880], [300, 880]], exit: { x: 1760, y: 420 },
    wrappers: [[870, 760], [1475, 520], [1700, 300]],
    build(B) {
      B.deco('board', 180, 120, { w: 420, text: 'Exposición de\nfin de año' });
      B.ground(0, 640); B.ground(1100, 1920);
      B.paper(640, 880, 460, 1.8);
      B.hazard(640, 1030, 460, 50, 'ink');
      B.block(1100, 800, 100, 80);
      B.lift('l1', 1220, 720, 1400, 820, 150, 160, 380, 0);
      B.block(1560, 420, 360, 460, 'books');
      B.slip(1600, 420, 120);
    },
  });

  /* ====================== ZONA 3 · EL GIMNASIO ====================== */
  D(2, {
    name: 'Colchonetas', par: 10, rope: 700,
    tip: 'La cama elástica te lanza alto. Salta justo al caer en ella para subir aún más.',
    spawn: [[150, 880], [300, 880]], exit: { x: 1790, y: 330 },
    wrappers: [[590, 360], [975, 150], [1190, 470]],
    build(B) {
      B.deco('bars', 120, 300); B.deco('hoop', 1560, 150);
      B.ground(0, 1080);
      B.tramp(500, 880, 170);
      B.block(760, 620, 320, 260, 'mat');
      B.tramp(900, 620, 150);
      B.hazard(1080, 1030, 220, 50);
      B.block(1300, 330, 620, 550, 'mat');
    },
  });
  D(2, {
    name: 'La cinta', par: 16, rope: 560,
    tip: 'Las cintas te devuelven hacia las tachuelas: livianos se corre más rápido. La placa pide peso 4,5.',
    spawn: [[120, 880], [250, 880]], exit: { x: 1830, y: 880 },
    wrappers: [[700, 660], [1030, 720], [1350, 640]],
    build(B) {
      B.deco('bars', 1100, 260, { w: 300, h: 360 });
      B.ground(0, 300); B.ground(440, 960); B.ground(1100, 1920);
      B.belt(440, 880, 520, -330);
      B.belt(1100, 880, 500, -380);
      B.hazard(300, 1030, 140, 50); B.hazard(960, 1030, 140, 50);
      B.plate('p1', 1630, 880, 120, 4.5, true);
      B.wall(1760, -20, 44, 620);
      B.gate(1760, 600, 44, 280, 'p1', 'up');
      B.sign(1690, 690, 'PLACA', { color: '#ffe08a' });
    },
  });
  D(2, {
    name: 'Las anillas', par: 16, rope: 520,
    tip: 'Aprieta «pegarse» cerca de una anilla para agarrarte. Desde ahí, salta a la siguiente.',
    spawn: [[120, 480], [270, 480]], exit: { x: 1800, y: 520 },
    wrappers: [[770, 760], [990, 220], [1420, 740]],
    build(B) {
      B.deco('bars', 1640, 140, { w: 200, h: 300 });
      B.block(0, 480, 440, 400, 'mat'); B.ground(0, 440);
      B.block(1520, 520, 400, 360, 'mat'); B.ground(1520, 1920);
      B.ring(660, -6, 396, 16, 1.3);
      B.ring(880, -6, 446, 16, 1.1);
      B.ring(1100, -6, 396, 16, 1.5);
      B.ring(1320, -6, 446, 16, 1.2);
      B.hazard(440, 1030, 1080, 50);
    },
  });
  D(2, {
    name: 'Muro de escalada', par: 18, rope: 520,
    tip: 'Livianos rebotan más alto en la cama elástica (o salta justo al caer). Las tablas se caen al rato.',
    spawn: [[150, 880], [300, 880]], exit: { x: 1800, y: 260 },
    wrappers: [[640, 300], [1290, 560], [1560, 160]],
    build(B) {
      B.deco('bars', 180, 260);
      B.ground(0, 1920);
      B.tramp(560, 880, 170, 1500);
      B.block(820, 300, 160, 580, 'mat');
      B.block(980, 600, 420, 280, 'metal');
      B.crumble(1440, 470, 120); B.crumble(1590, 420, 100);
      B.block(1700, 260, 220, 620, 'mat');
      B.hazard(1400, 1030, 300, 50);
      B.ground(1400, 1700, 1100);
    },
  });
  D(2, {
    name: 'Circuito', par: 17, rope: 600,
    tip: 'La cinta te lleva al vacío: aprovecha el impulso para saltar a la anilla. Después, cama elástica a la torre.',
    spawn: [[120, 880], [260, 880]], exit: { x: 1830, y: 380 },
    wrappers: [[620, 620], [1100, 420], [1625, 170]],
    build(B) {
      B.deco('hoop', 260, 300); B.deco('bars', 1460, 260, { w: 160, h: 300 });
      B.ground(0, 360);
      B.ground(360, 840); B.belt(360, 880, 480, 280);
      B.ring(1000, -6, 686, 8, 1.2);
      B.ring(1200, -6, 656, 8, 1.4);
      B.hazard(840, 1030, 540, 50);
      B.ground(1380, 1920);
      B.tramp(1565, 880, 120, 1500);
      B.block(1720, 380, 200, 500, 'mat');

    },
  });

  /* ====================== ZONA 4 · LA BIBLIOTECA ====================== */
  D(3, {
    name: 'Silencio, por favor', par: 16, rope: 560,
    tip: 'Cuando la bibliotecaria mira, nada de caer fuerte: súbanse sin hacer ruido y bajen cuando cierre los ojos.',
    spawn: [[120, 880], [260, 880]], exit: { x: 1800, y: 880 },
    wrappers: [[740, 820], [985, 470], [1320, 640]],
    build(B) {
      B.deco('window', 1580, 170);
      B.ground(0, 1920);
      B.block(560, 770, 140, 110, 'books');
      B.block(900, 700, 170, 180, 'books');
      B.block(1250, 770, 140, 110, 'books');
      B.eye(960, 200, [400, 300, 1120, 600], 2.2, 2.4, 0);
    },
  });
  D(3, {
    name: 'El carrito', par: 13, rope: 560,
    tip: 'Para empujar el carrito hay que pesar 3,6 o más (tira del hilo). Déjenlo sobre la placa para que la reja quede abierta.',
    spawn: [[120, 880], [240, 880]], exit: { x: 1790, y: 880 },
    wrappers: [[640, 450], [1150, 600], [1500, 640]],
    build(B) {
      B.deco('board', 120, 110, { w: 440, text: 'Devolución\nde libros' });
      B.ground(0, 1920);
      B.block(560, 520, 160, 40, 'shelf');
      B.cart(300, 880, 170, 110, 3.6);
      B.plate('p1', 880, 880, 190, 5.5, false);
      B.block(1070, 830, 28, 50, 'metal');
      B.wall(1350, -20, 50, 620);
      B.gate(1350, 600, 50, 280, 'p1', 'up');
      B.sign(975, 690, 'PLACA 5,5', { color: '#ffe08a' });
    },
  });
  D(3, {
    name: 'Montacargas', par: 18, rope: 600,
    tip: 'El carrito pesa 6: súbanlo a la plataforma izquierda y la derecha sube con quien pese menos.',
    spawn: [[120, 880], [240, 880]], exit: { x: 1800, y: 420 },
    wrappers: [[700, 600], [995, 250], [1500, 330]],
    build(B) {
      B.deco('poster', 120, 230, { text: 'NO\nCORRER', color: '#9dd6ff' });
      B.ground(0, 600); B.ground(790, 900);
      B.cart(330, 880, 170, 110, 3.6);
      B.lift('l1', 600, 890, 900, 890, 190, 480, 300, 0);
      B.block(1090, 420, 830, 460, 'shelf');
      B.hazard(600, 1030, 190, 50);
      B.sign(995, 820, 'SUBE', { color: '#ffe08a', arrow: '↑' });
    },
  });
  D(3, {
    name: 'Estantería alta', par: 26, rope: 600,
    tip: 'Las repisas viejas se caen. Si caen mientras la bibliotecaria mira… ¡SHHH! Suban cuando cierre los ojos.',
    spawn: [[120, 880], [250, 880]], exit: { x: 1790, y: 360 },
    wrappers: [[300, 560], [900, 360], [1380, 250]],
    build(B) {
      B.ground(0, 1920);
      B.plank(200, 760, 220);
      B.crumble(480, 660, 160);
      B.plank(720, 570, 200);
      B.crumble(990, 490, 150);
      B.crumble(1220, 420, 150);
      B.block(1460, 360, 460, 520, 'shelf');
      B.eye(330, 200, [0, 120, 1460, 780], 2.3, 2.6, 1.0);
    },
  });
  D(3, {
    name: 'Sección prohibida', par: 22, rope: 560,
    tip: 'El carrito llena el hueco (que no se oiga: espera a que no mire). Para el último salto, mejor livianos.',
    spawn: [[110, 880], [230, 880]], exit: { x: 1840, y: 440 },
    wrappers: [[560, 820], [1280, 560], [1610, 380]],
    build(B) {
      B.ground(0, 700); B.ground(880, 1100);
      B.ground(700, 880, 990);
      B.hazard(700, 970, 180, 20);
      B.block(640, 0, 290, 760, 'shelf');
      B.cart(300, 880, 170, 110, 3.6);
      B.block(1100, 770, 130, 110, 'books');
      B.block(1230, 660, 130, 220, 'books');
      B.block(1360, 560, 120, 320, 'books');
      B.crumble(1580, 600, 90);
      B.hazard(1480, 1030, 280, 50);
      B.block(1760, 440, 160, 440, 'shelf');
      B.eye(1150, 215, [480, 290, 1440, 720], 2.4, 2.6, 0.5);
    },
  });

  /* ====================== ZONA 5 · LA CAFETERÍA ====================== */
  D(4, {
    name: 'La fila', par: 12, rope: 560,
    tip: 'La cinta de la fila los devuelve. El jugo derramado resbala: frena antes de la sopa.',
    spawn: [[120, 880], [250, 880]], exit: { x: 1800, y: 880 },
    wrappers: [[560, 660], [970, 700], [1480, 640]],
    build(B) {
      B.deco('board', 120, 110, { w: 460, text: 'MENÚ DE HOY:\nsopa de chicle' });
      B.ground(0, 900); B.ground(1040, 1420); B.ground(1540, 1920);
      B.belt(220, 880, 680, -280);
      B.slip(1040, 880, 300);
      B.hazard(900, 1000, 140, 40, 'soup'); B.hazard(1420, 1000, 120, 40, 'soup');
      B.block(1640, 790, 60, 90, 'metal');
    },
  });
  D(4, {
    name: 'Sopa caliente', par: 15, rope: 600,
    tip: 'Las ollas echan vapor por ratos: métanse cuando sube y los lleva arriba. El calor estira el hilo.',
    spawn: [[120, 880], [250, 880]], exit: { x: 1790, y: 300 },
    wrappers: [[500, 300], [1100, 200], [1000, 700]],
    build(B) {
      B.ground(0, 900);
      B.geyser(430, 880, 140, 520, 1.8, 2.0, 0);
      B.block(700, 420, 200, 460, 'metal');
      B.hazard(900, 1000, 400, 40, 'soup');
      B.geyser(1030, 1020, 140, 780, 1.8, 2.0, 1.0);
      B.block(1300, 300, 620, 580, 'metal');
    },
  });
  D(4, {
    name: 'El congelador', par: 15, rope: 520,
    tip: 'El hielo no frena: pegarse sirve de freno. Salten antes del borde; el frío deja el hilo tieso.',
    spawn: [[120, 880], [250, 880]], exit: { x: 1810, y: 880 },
    wrappers: [[570, 700], [1080, 560], [1570, 720]],
    build(B) {
      B.cold(0, 0, 1920, 1080);
      B.ground(0, 500); B.ground(640, 1000); B.ground(1160, 1500); B.ground(1640, 1920);
      B.slip(0, 880, 500, '#cdeeff'); B.slip(640, 880, 360, '#cdeeff'); B.slip(1160, 880, 340, '#cdeeff');
      B.crumble(1030, 800, 100);
      B.block(1300, 760, 120, 120, 'metal');
      B.hazard(500, 1000, 140, 40, 'ice'); B.hazard(1000, 1000, 160, 40, 'ice'); B.hazard(1500, 1000, 140, 40, 'ice');
    },
  });
  D(4, {
    name: 'Bandejas', par: 14, rope: 760,
    tip: 'Las bandejas van al ritmo del vapor: desde la segunda, salten a la olla cuando eche vapor y los sube.',
    spawn: [[120, 880], [250, 880]], exit: { x: 1800, y: 460 },
    wrappers: [[660, 700], [1010, 260], [1300, 380]],
    build(B) {
      B.ground(0, 420);
      B.mover(470, 820, 160, 110, 0, 4, 0);
      B.mover(760, 760, 160, 0, 100, 4, 0);
      B.geyser(940, 1020, 140, 740, 1.6, 2.4, 1.4);
      B.block(1110, 460, 810, 420, 'metal');
      B.hazard(420, 1000, 690, 40, 'soup');
    },
  });
  D(4, {
    name: 'Hora del almuerzo', par: 18, rope: 600,
    tip: 'El carrito de la comida mantiene la placa. La reja abierta deja pasar al vapor que los sube a la salida.',
    spawn: [[100, 880], [220, 880]], exit: { x: 1810, y: 320 },
    wrappers: [[420, 560], [1210, 260], [1560, 700]],
    build(B) {
      B.deco('board', 640, 120, { w: 380, text: '¡A comer!' });
      B.ground(0, 1100);
      B.belt(560, 880, 280, -240);
      B.cart(330, 880, 170, 110, 3.6);
      B.plate('p1', 900, 880, 190, 5.5, false);
      B.block(1100, 820, 30, 60, 'metal');
      B.ground(1100, 1330);
      B.wall(1330, 380, 40, 500);
      B.gate(1330, 0, 40, 380, 'p1', 'up');
      B.geyser(1160, 880, 140, 640, 1.8, 2.0, 0);
      B.block(1370, 320, 550, 560, 'metal');
    },
  });

  /* ====================== ZONA 6 · LA TORRE DEL RELOJ ====================== */
  D(5, {
    name: 'Engranajes', par: 16, rope: 600,
    tip: 'Súbanse a las ruedas que giran y pasen de una a otra. Arriba a la derecha está la salida.',
    spawn: [[120, 880], [250, 880]], exit: { x: 1800, y: 420 },
    wrappers: [[640, 600], [910, 420], [1180, 240]],
    build(B) {
      B.ground(0, 380);
      B.wheel(640, 600, 200, 4, 130, 9, 1);
      B.wheel(1180, 520, 200, 4, 130, 9, -1);
      B.block(1540, 420, 380, 460, 'metal');
      B.hazard(380, 1030, 1160, 50);
    },
  });
  D(5, {
    name: 'El péndulo', par: 18, rope: 420,
    tip: 'El péndulo tumba a quien golpee, salvo que esté pegado. Crucen cuando los dos péndulos se alejen; si viene, ¡péguense!',
    spawn: [[120, 880], [240, 880]], exit: { x: 1810, y: 880 },
    wrappers: [[540, 520], [1050, 820], [1220, 520]],
    build(B) {
      B.ground(0, 330);
      B.block(410, 760, 260, 40, 'metal');
      B.block(750, 760, 260, 40, 'metal');
      B.block(1090, 760, 260, 40, 'metal');
      B.ground(1430, 1920);
      // fases opuestas entre vecinos: cuando los dos se alejan del hueco, se cruza
      B.pendulum(540, 120, 560, 0.31, 2.6, 0);
      B.pendulum(880, 120, 560, 0.31, 2.6, Math.PI);
      B.pendulum(1220, 120, 560, 0.31, 2.6, 0);
      B.hazard(330, 1030, 1100, 50);
    },
  });
  D(5, {
    name: 'Manecillas', par: 22, rope: 700,
    tip: 'Las manecillas giran: súbanse (o péguense) y déjense llevar hasta arriba. Pegado no te resbalas.',
    spawn: [[120, 880], [240, 880]], exit: { x: 1800, y: 380 },
    wrappers: [[900, 140], [560, 470], [1290, 560]],
    build(B) {
      B.deco('clockface', 900, 520, { r: 430 });
      B.ground(0, 380);
      B.hand(900, 520, 420, 12, Math.PI * 0.8, 11, 1);
      B.hand(900, 520, 250, 20, Math.PI * 1.6, 7, 1);
      B.block(1490, 380, 430, 500, 'metal');
      B.hazard(380, 1030, 1110, 50);
    },
  });
  D(5, {
    name: 'Campanario', par: 15, rope: 700,
    tip: 'Cada tanto la campana suena y empuja a todos lejos: ¡péguense cuando tiemble! Las anillas sirven para cruzar.',
    spawn: [[1600, 880], [1740, 880]], exit: { x: 170, y: 340 },
    wrappers: [[960, 520], [1290, 600], [640, 330]],
    build(B) {
      B.ground(0, 520); B.ground(1400, 1920);
      B.hazard(520, 1030, 880, 50);
      B.block(1180, 740, 220, 40, 'metal');
      B.ring(960, -6, 656, 12, 1.2);
      B.block(520, 620, 220, 40, 'metal');
      B.ring(430, -6, 476, 12, 1.5);
      B.block(0, 340, 330, 540, 'metal');
      B.bell(960, 300, 5, 1.5, 560, 1100);
    },
  });
  D(5, {
    name: 'La cima', par: 32, rope: 760,
    tip: 'La prueba final: engranaje, péndulo, manecilla y campana. Péguense a tiempo y salgan juntos por arriba.',
    spawn: [[110, 880], [230, 880]], exit: { x: 1760, y: 340 },
    wrappers: [[560, 330], [890, 420], [1450, 200]],
    build(B) {
      B.ground(0, 300);
      B.wheel(560, 650, 190, 4, 130, 8, 1);
      B.block(780, 560, 220, 40, 'metal');
      B.pendulum(890, 60, 460, 0.42, 2.6, 0);
      B.hand(1270, 520, 270, 10, Math.PI, 8, 1);
      B.block(1580, 340, 340, 540, 'metal');
      B.bell(1040, 250, 6, 2.0, 560, 1050);
      B.hazard(300, 1030, 1280, 50);
    },
  });
})();
