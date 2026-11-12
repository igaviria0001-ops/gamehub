/* =========================================================================
   TRAVESÍA POR COLOMBIA — campaña para jugar solo contra la máquina.
   Diez etapas por los cuatro escenarios, cada una con su modo y su nivel.
   Ganar abre la siguiente; las estrellas (1 a 3) salen de qué tan bien:
   · Duelo: ganar · sin perder ronda · y además con medio blindaje o más.
   · Carrera: ganar · por 3 aros o más · por 8 o más.
   · Blancos: ganar · 40 puntos · 60 puntos.
   · Maletín: ganar · llegar a 30 · llegar a 30 con la máquina en 12 o menos.
   · Jefe: ganar · con 3 vidas o más · en menos de 2:30.
   Se guarda en este navegador (Store 'trav').
   TRAVESÍA PARA DOS (Store 'trav2'): diez desafíos en equipo por los mismos
   escenarios (sin fuego amigo): Blancos juntos, Relevos, Entrega del
   maletín con drones, Oleadas de drones y, al final, La Sombra reforzada.
   Las estrellas son de los dos (STAGES[].duo tiene cada desafío).
   ========================================================================= */
const STAGES = [
  { id: 'cocora1', arena: 'cocora', mode: 'duel', level: 0, wins: 2, name: 'Primer duelo', text: 'Amanece en el valle. Gánale a la máquina en fácil, al mejor de 3.', duo: { name: 'Primer vuelo juntos', mode: 'targets', team: [45, 65, 85], text: 'Revienten globos y drones entre los dos: 45 puntos en 90 s (65 y 85 dan más estrellas). Aquí no se dispara al compañero.' } },
  { id: 'cocora2', arena: 'cocora', mode: 'targets', level: 0, name: 'Globos entre palmas', text: 'Revienta más globos y drones que la máquina. El dorado vale 5.', duo: { name: 'Relevos entre palmas', mode: 'relay', laps: 2, time: 140, stars: [35, 65], text: 'Relevos: cada aro tiene el color de un piloto y van alternados. Pásenlos en orden, cada uno los suyos: 2 vueltas en 2:20. Mientras uno pasa el suyo, el otro ya va por el siguiente.' } },
  { id: 'med1', arena: 'medellin', mode: 'race', level: 1, name: 'Carrera nocturna', text: 'Tres vueltas rozando las azoteas de Medellín.', duo: { name: 'El maletín del metro', mode: 'escort', zone: [2230, 1175], deliver: [4, 6, 8], time: 150, text: 'Lleven el maletín al helipuerto de la torre: 4 entregas en 2:30 (6 y 8 dan más estrellas). Los drones persiguen al que lo carga y, si le pegan, se le cae. Uno carga y el otro escolta.' } },
  { id: 'med2', arena: 'medellin', mode: 'case', level: 1, name: 'El maletín del metro', text: 'Agarra el maletín y que no te lo quiten: embestir roba.', duo: { name: 'Relevos nocturnos', mode: 'relay', laps: 2, time: 160, stars: [35, 65], text: 'Relevos por las azoteas de Medellín: cada uno sus aros, en orden, 2 vueltas en 2:40.' } },
  { id: 'bog1', arena: 'bogota', mode: 'duel', level: 1, wins: 2, name: 'Duelo en la tormenta', text: 'Rayos, avión y ráfagas de viento. Al mejor de 3.', duo: { name: 'Drones en la tormenta', mode: 'waves', waves: [5, 8, 11], lives: 5, time: 240, text: 'Tres oleadas de drones de ataque entre rayos, avión y ráfagas. 5 vidas entre los dos: cúbranse la espalda.' } },
  { id: 'bog2', arena: 'bogota', mode: 'race', level: 1, name: 'Subida a Monserrate', text: 'De azotea en azotea hasta la iglesia del cerro.', duo: { name: 'Entrega en Monserrate', mode: 'escort', zone: [3600, 840], deliver: [4, 6, 8], time: 170, extra: 1, text: 'Suban el maletín hasta la iglesia de Monserrate: 4 entregas en 2:50 (6 y 8 dan más estrellas), con drones y tormenta.' } },
  { id: 'car1', arena: 'cartagena', mode: 'targets', level: 2, name: 'Blancos en la bahía', text: 'Entre cañonazos del galeón. La máquina va en difícil.', duo: { name: 'Blancos en la bahía', mode: 'targets', team: [50, 75, 100], text: 'Entre cañonazos del galeón: 50 puntos entre los dos (75 y 100 dan más estrellas).' } },
  { id: 'car2', arena: 'cartagena', mode: 'race', level: 2, name: 'Bajo los arcos', text: 'Por debajo de la Torre del Reloj y de la catedral, a toda.', duo: { name: 'Relevos bajo los arcos', mode: 'relay', laps: 2, time: 200, stars: [45, 80], text: 'Relevos por Cartagena, por debajo de la Torre del Reloj y de la catedral: 2 vueltas en 3:20.' } },
  { id: 'car3', arena: 'cartagena', mode: 'boss', level: 2, name: 'La Sombra en Cartagena', text: 'Con la máquina de compañera, tumben el dirigible.', duo: { name: 'Piratas del aire', mode: 'waves', waves: [6, 9, 12], lives: 5, time: 260, text: 'Oleadas de drones piratas mientras el galeón y el castillo disparan cañonazos. 5 vidas entre los dos.' } },
  { id: 'final', arena: 'medellin', mode: 'duel', level: 2, wins: 3, name: 'Duelo final', text: 'La máquina en difícil, al mejor de 5. Aquí se gana la Travesía.', duo: { name: 'Desafío final: La Sombra', mode: 'boss', hard: true, text: 'La Sombra vuelve más blindada y con drones desde el comienzo, sobre Medellín. Todo lo aprendido, juntos.' } },
];
const Travesia = (() => {
  let D = Store.get('trav', {});
  const best = id => D[id] || 0;
  const unlocked = i => i === 0 || best(STAGES[i - 1].id) > 0;
  const total = () => STAGES.reduce((s, S) => s + best(S.id), 0);
  function starsFor(S, r) {
    if (S.mode === 'boss') return r.coopWin ? 1 + (r.lives >= 3 ? 1 : 0) + (r.playT < 150 ? 1 : 0) : 0;
    if (r.winner !== 0) return 0;
    if (S.mode === 'duel') return 1 + (r.wins[1] === 0 ? 1 : 0) + (r.wins[1] === 0 && r.hp[0] >= 0.5 ? 1 : 0);
    if (S.mode === 'race') { const m = r.score[0] - r.score[1]; return 1 + (m >= 3 ? 1 : 0) + (m >= 8 ? 1 : 0); }
    if (S.mode === 'targets') return 1 + (r.score[0] >= 40 ? 1 : 0) + (r.score[0] >= 60 ? 1 : 0);
    if (S.mode === 'case') return 1 + (r.score[0] >= 30 ? 1 : 0) + (r.score[0] >= 30 && r.score[1] <= 12 ? 1 : 0);
    return 1;
  }
  // al terminar una etapa: estrellas de esta vez, la mejor y si abrió la siguiente
  function record(id, r, G) {
    const i = STAGES.findIndex(S => S.id === id); if (i < 0) return null;
    const S = STAGES[i], s = starsFor(S, r), prev = best(id), wasOpen = i + 1 < STAGES.length && unlocked(i + 1);
    if (s > prev) { D[id] = s; Store.set('trav', D); }
    if (G && s > 0 && id === 'final') G.events.push({ type: 'travDone' });
    if (G && total() >= STAGES.length * 3) G.events.push({ type: 'travAll' });
    return { i, S, stars: s, best: Math.max(s, prev), newBest: s > prev, opened: !wasOpen && i + 1 < STAGES.length && unlocked(i + 1), next: i + 1 < STAGES.length && unlocked(i + 1) ? STAGES[i + 1] : null };
  }
  function reset() { D = {}; Store.set('trav', D); }

  /* ---------- para dos ---------- */
  let D2 = Store.get('trav2', {});
  const res2 = id => D2[id] || null;
  const unlocked2 = i => i === 0 || !!(res2(STAGES[i - 1].id) && res2(STAGES[i - 1].id).s > 0);
  // estrellas de cada uno y las de equipo (w: 0 = J1, 1 = J2, 2 = juntos)
  function tally2() { const t = [0, 0, 0]; for (const S of STAGES) { const R = res2(S.id); if (R && R.s > 0) t[R.w] += R.s; } return t; }
  function stars2(S, r) {
    const D = S.duo;
    if (r.tm) return { w: 2, s: r.tm.stars };
    if (D.mode === 'boss') return { w: 2, s: r.coopWin ? 1 + (r.lives >= 4 ? 1 : 0) + (r.playT < (D.hard ? 210 : 150) ? 1 : 0) : 0 };
    if (D.team) { const t = r.score[0] + r.score[1], g = D.team; return { w: 2, s: t >= g[0] ? 1 + (t >= g[1] ? 1 : 0) + (t >= g[2] ? 1 : 0) : 0, total: t }; }
    return { w: 2, s: 0 };
  }
  // se guarda la mejor marca de cada desafío
  function record2(id, r, G) {
    const i = STAGES.findIndex(S => S.id === id); if (i < 0) return null;
    const S = STAGES[i], R = stars2(S, r), prev = res2(id), prevS = prev ? prev.s : 0, wasOpen = i + 1 < STAGES.length && unlocked2(i + 1);
    if (R.s > prevS) { D2[id] = { s: R.s, w: 2 }; Store.set('trav2', D2); }
    const last = i === STAGES.length - 1 && R.s > 0;
    if (G && last) G.events.push({ type: 'trav2Done' });
    return { i, S, stars: R.s, best: Math.max(R.s, prevS), newBest: R.s > prevS, total: R.total, tally: tally2(), done: last, opened: !wasOpen && i + 1 < STAGES.length && unlocked2(i + 1), next: i + 1 < STAGES.length && unlocked2(i + 1) ? STAGES[i + 1] : null };
  }
  function reset2() { D2 = {}; Store.set('trav2', D2); }
  return { best, unlocked, total, record, reset, starsFor, res2, unlocked2, tally2, record2, reset2 };
})();
