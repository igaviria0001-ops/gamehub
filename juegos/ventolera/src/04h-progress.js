/* =========================================================================
   PROGRESO — logros, récords y pinturas que se desbloquean jugando.
   Solo cuentan los pilotos que maneja una persona (no la máquina).
   Se guarda en este navegador (Store 'prog').
   ========================================================================= */
const ACHIEVEMENTS = [
  { id: 'derribo', name: 'Primer derribo', desc: 'Derriba a un rival.' },
  { id: 'tonel', name: 'Tonel perfecto', desc: 'Esquiva un misil con un tonel.' },
  { id: 'cobra', name: 'Cobra', desc: 'Frena en seco con una cobra.' },
  { id: 'leyenda', name: 'Modo leyenda', desc: 'Llena la Adrenalina.' },
  { id: 'leyenda5', name: 'Leyenda viva', desc: 'Entra 5 veces en Modo leyenda. Desbloquea la pintura dorada.' },
  { id: 'combo5', name: 'Cadena de cinco', desc: 'Encadena 5 maniobras distintas (×5).' },
  { id: 'metro', name: 'Bajo el metro', desc: 'Vuela por debajo del viaducto en Medellín.' },
  { id: 'callejon', name: 'Callejero', desc: 'Pasa entre dos torres por debajo de sus azoteas.' },
  { id: 'sonico', name: 'Bum sónico', desc: 'Rompe la barrera del sonido.' },
  { id: 'avion', name: 'Por encima del avión', desc: 'Atraviesa el avión con un tonel en Bogotá.' },
  { id: 'rayo', name: 'Pararrayos', desc: 'Que te caiga un rayo… y seguir volando.' },
  { id: 'vigia', name: 'Vigía', desc: 'Pósate en la cofa del galeón pirata en Cartagena.' },
  { id: 'artillero', name: 'Contra la artillería', desc: 'Revienta en el aire una bala de cañón a punta de ráfaga.' },
  { id: 'globos', name: 'Cazador de globos', desc: 'Revienta 50 blancos en total.' },
  { id: 'maletin', name: 'El del maletín', desc: 'Gana una partida de Maletín.' },
  { id: 'carrera', name: 'Primero en la meta', desc: 'Gana una Carrera.' },
  { id: 'copa', name: 'Campeón de la Copa', desc: 'Gana una Copa de 5 pruebas.' },
  { id: 'trav2', name: 'De a dos', desc: 'Terminen la Travesía para dos.' },
  { id: 'jefe', name: 'Dirigible abajo', desc: 'Derrota a La Sombra.' },
  { id: 'dificil', name: 'Mejor que la máquina', desc: 'Gana un duelo contra la máquina en difícil.' },
  { id: 'escuela', name: 'Piloto graduado', desc: 'Termina la Escuela de vuelo.' },
  { id: 'travesia', name: 'De punta a punta', desc: 'Gana el Duelo final de la Travesía.' },
  { id: 'estrellas', name: 'Cielo lleno de estrellas', desc: 'Saca las 30 estrellas de la Travesía.' },
];
const Progress = (() => {
  const def = () => ({ got: {}, n: { partidas: 0, derribos: 0, maniobras: 0, leyendas: 0, blancos: 0, esquivados: 0 }, best: { combo: 0, jefe: 0, blancos: 0 } });
  let P = Object.assign(def(), Store.get('prog', {}));
  P.n = Object.assign(def().n, P.n); P.best = Object.assign(def().best, P.best); P.got = P.got || {};
  const save = () => Store.set('prog', P);
  const human = (G, b) => b && b.id != null && !G.bots[b.id] && G.state !== 'attract';
  function unlock(G, id) {
    if (P.got[id]) return;
    P.got[id] = Date.now(); save();
    const A = ACHIEVEMENTS.find(a => a.id === id);
    if (A && G) G.events.push({ type: 'achievement', name: A.name, id });
  }
  function event(G, e) {
    if (G.state === 'attract') return;
    const b = e.b;
    switch (e.type) {
      case 'down': if (e.from >= 0 && human(G, G.birds[e.from]) && G.mode !== 'boss') { P.n.derribos++; unlock(G, 'derribo'); save(); } break;
      case 'trick':
        if (!human(G, b)) break;
        P.n.maniobras++;
        if (e.combo > P.best.combo) P.best.combo = e.combo;
        if (e.combo >= 5) unlock(G, 'combo5');
        if (e.key === 'cobra') unlock(G, 'cobra');
        if (e.key === 'metro') unlock(G, 'metro');
        if (e.key === 'callejon') unlock(G, 'callejon');
        if (e.key === 'sonico') unlock(G, 'sonico');
        if (e.key === 'vigia') unlock(G, 'vigia');
        if (e.key === 'artillero') unlock(G, 'artillero');
        save(); break;
      case 'nearMiss': if (human(G, b) && b.evadeT > 0 && G.world.storm && G.world.storm.plane && Math.abs(b.y - G.world.storm.plane.y) < 80) unlock(G, 'avion'); break;
      case 'dodged': if (human(G, b)) { P.n.esquivados++; if (b.evadeT > 0 || b.rollCd > 0.4) unlock(G, 'tonel'); save(); } break;
      case 'legend': if (human(G, b)) { P.n.leyendas++; unlock(G, 'leyenda'); if (P.n.leyendas >= 5) unlock(G, 'leyenda5'); save(); } break;
      case 'zap': if (human(G, b)) setTimeout(() => { if (b.alive) unlock(G, 'rayo'); }, 1500); break;
      case 'pop': if (e.by != null && human(G, G.birds[e.by])) { P.n.blancos++; if (P.n.blancos >= 50) unlock(G, 'globos'); save(); } break;
      case 'schoolDone': unlock(G, 'escuela'); break;
      case 'travDone': unlock(G, 'travesia'); break;
      case 'copaWon': unlock(G, 'copa'); break;
      case 'trav2Done': unlock(G, 'trav2'); break;
      case 'travAll': unlock(G, 'estrellas'); break;
    }
  }
  // al terminar una partida (resultados)
  function matchEnd(G, r) {
    P.n.partidas++;
    const humans = [0, 1].filter(i => !G.bots[i]);
    if (r.mode === 'case' && humans.includes(r.winner)) unlock(G, 'maletin');
    if (r.mode === 'race' && humans.includes(r.winner)) unlock(G, 'carrera');
    if (r.mode === 'boss' && r.coopWin) { unlock(G, 'jefe'); const t = Math.round(G.time); if (!P.best.jefe || t < P.best.jefe) P.best.jefe = t; }
    if (r.mode === 'targets') for (const i of humans) P.best.blancos = Math.max(P.best.blancos, r.score[i]);
    if (r.mode === 'duel' && G.players === 1 && r.winner === 0 && (G.lvl != null ? G.lvl : G.botLevel) === 2) unlock(G, 'dificil');
    save();
  }
  const has = id => !!P.got[id];
  function reset() { P = def(); save(); }
  return { event, matchEnd, has, reset, get data() { return P; } };
})();
