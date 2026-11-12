/* =========================================================================
   COPA — una noche de juego entre amigos: 5 pruebas al azar seguidas
   (duelo al mejor de 3, carrera, blancos, maletín… cada una en un
   escenario distinto). Cada prueba ganada da un punto; si quedan
   empatados, desempate a un solo duelo. Sirve para dos personas o
   contra la máquina.
   ========================================================================= */
const Copa = (() => {
  const POOL = ['duel', 'race', 'targets', 'case'];
  let C = null;
  function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function create(players, r = Math.random) {
    // las cuatro pruebas en desorden y una más (distinta de la anterior); escenarios sin repetir seguidos
    const modes = shuffle(POOL.slice(), r); let extra; do { extra = POOL[Math.floor(r() * POOL.length)]; } while (extra === modes[3]); modes.push(extra);
    const arenas = shuffle(ARENA_ORDER.slice(), r); let ea; do { ea = ARENA_ORDER[Math.floor(r() * ARENA_ORDER.length)]; } while (ea === arenas[arenas.length - 1]); arenas.push(ea);
    C = { players, list: modes.map((m, k) => ({ mode: m, arena: arenas[k % arenas.length], wins: m === 'duel' ? 2 : 1 })), i: 0, pts: [0, 0], hist: [] };
    return C;
  }
  const current = () => (C && C.i < C.list.length ? C.list[C.i] : null);
  // al terminar una prueba: punto para el ganador; si se acabaron y van empatados, desempate
  function record(r) {
    if (!C) return null;
    const E = C.list[C.i], w = r.winner;
    if (w === 0 || w === 1) C.pts[w]++;
    C.hist.push({ mode: E.mode, arena: E.arena, winner: w, tie: !!E.tie });
    C.i++;
    if (C.i >= C.list.length && C.pts[0] === C.pts[1]) {
      let a; do { a = ARENA_ORDER[Math.floor(Math.random() * ARENA_ORDER.length)]; } while (a === E.arena);
      C.list.push({ mode: 'duel', arena: a, wins: 1, tie: true });
    }
    const done = C.i >= C.list.length;
    return { done, champ: done ? (C.pts[0] > C.pts[1] ? 0 : 1) : -1, pts: C.pts.slice(), i: C.i, n: C.list.length, hist: C.hist.slice() };
  }
  function end() { C = null; }
  return { create, current, record, end, get state() { return C; } };
})();
