/* =========================================================================
   PROGRESO — nombres de cada jugador, marcador histórico entre ellos,
   55 logros, accesorios que se desbloquean con logros (y tres con la campaña) y el reto del día.
   Todo se guarda en este navegador (prefijo tya_). Los logros son de cada
   nombre: si juegan Ana y Luis, cada uno gana los suyos.
   ========================================================================= */
const Progress = (() => {
  const ACH = [
    ['alumno', 'Alumno aplicado', 'Termina el tutorial'],
    ['primera_caneca', '¡A la caneca!', 'Echa a tu rival a la caneca'],
    ['tirachinas', 'Tirachinas', 'Acierta un tirachinas'],
    ['latigazo', 'Latigazo', 'Haz un latigazo'],
    ['aplaston', 'Aplastón', 'Cae en picada sobre el otro'],
    ['catapulta', 'Catapulta', 'Sal volando con la regla del profe'],
    ['salvada', '¡Salvada!', 'Vuelve al pupitre después de quedar colgando'],
    ['doble_salto', 'Escupitajo', 'Haz un salto doble'],
    ['pegajoso', 'Pegajoso', 'Pégate 10 veces en una partida'],
    ['tijeretazo', 'Sin hilo', 'Echa al otro a la caneca con el hilo cortado'],
    ['muerte_subita', 'Al timbre', 'Gana una ronda después del timbre'],
    ['peso_pluma', 'Peso pluma', 'Gana una ronda pesando menos de 1,6'],
    ['peso_pesado', 'Peso pesado', 'Gana una ronda pesando 7 o más'],
    ['perfecto', 'Impecable', 'Gana una partida sin perder ni una ronda'],
    ['remontada', 'Remontada', 'Gana una partida yendo perdiendo por 2 rondas'],
    ['gana_caneca', 'Campeón del pupitre', 'Gana una partida de ¡A la caneca!'],
    ['goloso', 'Goloso', 'Recoge 25 chicles en una partida'],
    ['dorado', 'Buscador de oro', 'Recoge 5 chicles dorados en una partida'],
    ['gana_chicles', 'Bolsillos llenos', 'Gana Atrapa chicles'],
    ['gana_rey', 'Rey del salón', 'Gana Rey del borrador'],
    ['rey_absoluto', 'Rey absoluto', 'Gana Rey del borrador con el otro por debajo de 5'],
    ['gol', '¡Gol!', 'Mete un gol'],
    ['canonazo', 'Cañonazo', 'Mete un gol con tirachinas'],
    ['hat_trick', 'Triplete', 'Mete 3 goles en una partida'],
    ['arquero', 'Arco en cero', 'Gana Gol de canica sin recibir goles'],
    ['gol_de_oro', 'Gol de oro', 'Gana una partida con gol de oro'],
    ['campanero', 'Campanero', 'Toca la campana de la torre'],
    ['escalador_veloz', 'Ardilla', 'Toca la campana en menos de 15 segundos'],
    ['gana_escalada', 'Cima', 'Gana Escalada tramposa'],
    ['fiestero', 'Fiestero', 'Juega una partida con la Fiesta encendida'],
    ['todas_sorpresas', 'Lo vi todo', 'Ve las 8 sorpresas de la Fiesta'],
    ['turista', 'Turista', 'Juega en las 8 arenas'],
    ['nocturno', 'Búho', 'Gana una partida de noche'],
    ['vence_novato', 'Calentando', 'Gánale a la máquina Novato'],
    ['vence_masticador', 'Masticado', 'Gánale a la máquina Masticador'],
    ['vence_leyenda', 'Leyenda', 'Gánale a la máquina Leyenda'],
    ['campeon_torneo', 'Campeón del torneo', 'Gana un torneo'],
    ['maraton', 'Maratón', 'Juega 10 partidas'],
    ['reto_diario', 'Reto cumplido', 'Supera un reto del día'],
    ['constante', 'Constante', 'Supera el reto del día 3 días seguidos'],
    ['retador', 'Retador', 'Supera un reto de técnica'],
    ['medallista', 'Medallista', 'Gana oro en 6 retos de técnica'],
    ['maestro', 'Maestro del chicle', 'Supera los 12 retos de técnica'],
    ['entrenado', 'En forma', 'Llega al nivel 3 en un ejercicio de entrenamiento'],
    ['racha10', 'Imparable', 'Haz 10 aciertos seguidos en un ejercicio de entrenamiento'],
    ['atleta', 'Atleta del chicle', 'Llega al nivel 3 en los 10 ejercicios de entrenamiento'],
    ['desenchufada', 'Desenchufada', 'Derrota a la Aspiradora'],
    ['sin_punta', 'Sin punta', 'Derrota al Sacapuntas eléctrico'],
    ['piso_limpio', 'Piso limpio', 'Derrota al Aseador'],
    ['atasco', 'Atasco de papel', 'Derrota a la Fotocopiadora'],
    ['ding', '¡Ding!', 'Derrota al Microondas'],
    ['medianoche', 'Medianoche', 'Derrota al Reloj de la torre'],
    ['primer_dia', 'Primer día', 'Sal de la primera sala de la campaña'],
    ['zona_superada', 'Zona superada', 'Derrota al jefe de una zona en la campaña'],
    ['fugados', '¡Nos fugamos!', 'Termina la campaña (vence al Reloj en la torre)'],
    ['coleccion', 'Coleccionista', 'Junta 50 estrellas en la campaña'],
    ['perfeccion', 'Perfeccionistas', 'Junta 100 estrellas en la campaña'],
  ].map(([id, name, desc]) => ({ id, name, desc }));
  const BY = Object.fromEntries(ACH.map(a => [a.id, a]));

  // accesorios: se desbloquean con la cantidad de logros
  const ACCESSORIES = [
    { id: 'ninguno', name: 'Sin accesorio', need: 0 },
    { id: 'lentes', name: 'Lentes', need: 3 },
    { id: 'gorra', name: 'Gorra', need: 7 },
    { id: 'mono', name: 'Moño', need: 12 },
    { id: 'audifonos', name: 'Audífonos', need: 17 },
    { id: 'bigote', name: 'Bigote', need: 23 },
    { id: 'corona', name: 'Corona', need: 30 },
    // premios de la campaña: se ganan venciendo al jefe de la zona
    { id: 'birrete', name: 'Birrete (campaña)', need: 1e9, camp: 'salon' },
    { id: 'vincha', name: 'Vincha deportiva (campaña)', need: 1e9, camp: 'gimnasio' },
    { id: 'chef', name: 'Gorro de chef (campaña)', need: 1e9, camp: 'cafeteria' },
  ];

  const S = {
    names: (() => { const n = Store.get('names', null); return Array.isArray(n) && n.length === 2 ? n : ['Jugador 1', 'Jugador 2']; })(),
    ach: Store.get('ach', {}),        // { nombre: { idLogro: 'AAAA-MM-DD' } }
    h2h: Store.get('h2h', {}),        // { 'a|b': [victorias de a, victorias de b] }
    pstats: Store.get('pstats', {}),  // { nombre: { matches, wins } }
    acc: (() => { const a = Store.get('acc', null); return Array.isArray(a) && a.length === 2 ? a : ['ninguno', 'ninguno']; })(),
    seen: Store.get('seen', { mods: {}, arenas: {} }),
    daily: Store.get('daily', { last: null, streak: 0 }),
  };
  let match = null;
  const popups = [];
  const save = k => Store.set(k, S[k]);
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const cleanName = (s, i) => (String(s || '').replace(/[<>]/g, '').trim().slice(0, 14) || `Jugador ${i + 1}`);

  /* ---------------- nombres y récords ---------------- */
  function setName(i, s) { S.names[i] = cleanName(s, i); save('names'); }
  function count(name) { return Object.keys(S.ach[name] || {}).length; }
  function has(name, id) { return !!(S.ach[name] && S.ach[name][id]); }
  function h2hKey() { const [a, b] = S.names; return a <= b ? [`${a}|${b}`, false] : [`${b}|${a}`, true]; }
  function record() {
    const [k, flip] = h2hKey(), r = S.h2h[k] || [0, 0];
    return flip ? [r[1], r[0]] : r.slice();
  }

  /* ---------------- desbloquear ---------------- */
  function human(i) { const G = Game.G; return !G.quiet && !(G.bots && G.bots[i]); }
  function unlock(i, id, force = false) {
    if (!BY[id] || (!force && !human(i))) return;
    const name = S.names[i];
    if (has(name, id)) return;
    const before = count(name);
    (S.ach[name] = S.ach[name] || {})[id] = today();
    save('ach');
    popups.push({ i, title: BY[id].name, desc: BY[id].desc, t: 0 });
    if (match) match.newAch[i].push(BY[id].name);
    Sound.play('golden');
    const after = before + 1, nx = ACCESSORIES.find(a => a.need === after);
    if (nx) popups.push({ i, title: `Accesorio nuevo: ${nx.name}`, desc: 'Póntelo en Opciones', t: 0 });
  }

  /* ---------------- eventos del juego ---------------- */
  function on(type, d = {}) {
    const G = Game.G;
    if (type === 'tutorial') { unlock(0, 'alumno', true); if (!d.solo) unlock(1, 'alumno', true); return; }
    if (type === 'reto') {
      unlock(0, 'retador', true);
      if (d.golds >= 6) unlock(0, 'medallista', true);
      if (d.done >= d.total) unlock(0, 'maestro', true);
      return;
    }
    if (type === 'entreno') {
      if (d.level >= 3) unlock(0, 'entrenado', true);
      if (d.streak >= 10) unlock(0, 'racha10', true);
      if (d.top3 >= d.total) unlock(0, 'atleta', true);
      return;
    }
    if (G.quiet || G.tutorial) return;
    if ((G.reto || G.train) && !['ram', 'whip', 'saved', 'airjump'].includes(type)) return; // en los retos solo cuentan las jugadas
    switch (type) {
      case 'start': {
        match = {
          mode: G.mode, arena: G.arenaId, vsBot: G.vsBot, bot: G.vsBot ? (G.daily ? G.daily.level : G.botLevel) : null,
          fiesta: G.fiestaMatch, torneo: G.arenaMode === 'torneo', sticks: [0, 0], pellets: [0, 0], golds: [0, 0],
          goals: [0, 0], conceded: [0, 0], lost: [0, 0], worst: [0, 0], newAch: [[], []],
        };
        if (ARENA_LIST.some(a => a.id === G.arenaId)) { S.seen.arenas[G.arenaId] = 1; save('seen'); }
        for (const i of [0, 1]) {
          if (G.fiestaMatch) unlock(i, 'fiestero');
          if (ARENA_LIST.every(a => S.seen.arenas[a.id])) unlock(i, 'turista');
        }
        break;
      }
      case 'arena': // cambio de arena en torneo o al azar
        if (ARENA_LIST.some(a => a.id === d.id)) { S.seen.arenas[d.id] = 1; save('seen'); if (ARENA_LIST.every(a => S.seen.arenas[a.id])) [0, 1].forEach(i => unlock(i, 'turista')); }
        break;
      case 'ram': if (d.sling) unlock(d.att.id, 'tirachinas'); if (d.stomp) unlock(d.att.id, 'aplaston'); break;
      case 'whip': unlock(d.p.id, 'latigazo'); break;
      case 'jefe': { const a = { aspiradora: 'desenchufada', sacapuntas: 'sin_punta', aseador: 'piso_limpio', fotocopiadora: 'atasco', microondas: 'ding', reloj: 'medianoche' }[d.id]; if (a) [0, 1].forEach(i => unlock(i, a)); break; }
      case 'campana': {
        const both = id => [0, 1].forEach(i => unlock(i, id));
        if (d.stars >= 1) both('primer_dia');
        if (d.boss !== undefined) both('zona_superada');
        if (d.boss === 5) both('fugados');
        if (d.stars >= 50) both('coleccion');
        if (d.stars >= 100) both('perfeccion');
        break;
      }
      case 'catapult': unlock(d.p.id, 'catapulta'); break;
      case 'saved': unlock(d.p.id, 'salvada'); break;
      case 'airjump': unlock(d.p.id, 'doble_salto'); break;
      case 'stick': if (match && ++match.sticks[d.p.id] >= 10) unlock(d.p.id, 'pegajoso'); break;
      case 'dunk': if (d.by) { unlock(d.by.id, 'primera_caneca'); if (d.ropeCut) unlock(d.by.id, 'tijeretazo'); } break;
      case 'pellet':
        if (!match) break;
        match.pellets[d.p.id] += d.gold ? 3 : 1; if (d.gold) match.golds[d.p.id]++;
        if (match.pellets[d.p.id] >= 25) unlock(d.p.id, 'goloso');
        if (match.golds[d.p.id] >= 5) unlock(d.p.id, 'dorado');
        break;
      case 'round': {
        if (!match || d.winner === null || d.winner === undefined) break;
        const w = d.winner, l = 1 - w, wp = G.players[w];
        match.lost[l]++;
        match.worst[l] = Math.min(match.worst[l], G.wins[l] - G.wins[w]);
        if (d.suddenDeath) unlock(w, 'muerte_subita');
        if (wp.mass < 1.6) unlock(w, 'peso_pluma');
        if (wp.mass >= 7) unlock(w, 'peso_pesado');
        break;
      }
      case 'goal':
        if (!match) break;
        match.goals[d.scorer]++; match.conceded[1 - d.scorer]++;
        if (!d.own) { unlock(d.scorer, 'gol'); if (d.sling) unlock(d.scorer, 'canonazo'); if (match.goals[d.scorer] >= 3) unlock(d.scorer, 'hat_trick'); }
        break;
      case 'bell': unlock(d.p.id, 'campanero'); if (d.t < 15) unlock(d.p.id, 'escalador_veloz'); break;
      case 'fiesta':
        S.seen.mods[d.id] = 1; save('seen');
        if (Object.keys(S.seen.mods).length >= 8) [0, 1].forEach(i => unlock(i, 'todas_sorpresas'));
        break;
      case 'match': {
        if (!match) break;
        const w = d.winner;
        // estadísticas y marcador histórico (solo si los dos son personas, o contra la máquina para el jugador 1)
        for (const i of [0, 1]) {
          if (!human(i)) continue;
          const st = S.pstats[S.names[i]] = S.pstats[S.names[i]] || { matches: 0, wins: 0 };
          st.matches++; if (w === i) st.wins++;
          if (st.matches >= 10) unlock(i, 'maraton');
        }
        save('pstats');
        if (!G.vsBot && w !== null && S.names[0] !== S.names[1]) {
          const [k, flip] = h2hKey(); const r = S.h2h[k] || [0, 0];
          r[(w === 0) !== flip ? 0 : 1]++; S.h2h[k] = r; save('h2h');
        }
        if (w === null || w === undefined) break;
        const l = 1 - w;
        const byMode = { caneca: 'gana_caneca', chicles: 'gana_chicles', rey: 'gana_rey', escalada: 'gana_escalada' };
        if (byMode[match.mode]) unlock(w, byMode[match.mode]);
        if ((match.mode === 'caneca' || match.mode === 'escalada') && match.lost[w] === 0 && G.wins[w] >= 2) unlock(w, 'perfecto');
        if (match.worst[w] <= -2) unlock(w, 'remontada');
        if (match.mode === 'rey' && G.points[l] < 5) unlock(w, 'rey_absoluto');
        if (match.mode === 'gol' && match.conceded[w] === 0) unlock(w, 'arquero');
        if (match.mode === 'gol' && Modes.golden) unlock(w, 'gol_de_oro');
        if (G.theme === 'noche') unlock(w, 'nocturno');
        if (match.torneo) unlock(w, 'campeon_torneo');
        if (match.vsBot && w === 0) unlock(0, ['vence_novato', 'vence_masticador', 'vence_leyenda'][match.bot] || 'vence_novato');
        if (G.daily && w === 0 && human(0)) dailyDone();
        break;
      }
    }
  }

  /* ---------------- reto del día ---------------- */
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function dailySpec() {
    const key = today(), r = mulberry32(hashStr('tya' + key));
    const modes = ['caneca', 'caneca', 'chicles', 'rey', 'gol', 'escalada'];
    const mode = modes[Math.floor(r() * modes.length)];
    const arenas = ARENA_LIST.map(a => a.id);
    const arena = mode === 'gol' ? 'gimnasio' : mode === 'escalada' ? 'torre' : arenas[Math.floor(r() * arenas.length)];
    const mods = Fiesta.MODS.filter(m => !(m.not && m.not.includes(arena)) && !(mode !== 'caneca' && m.size));
    const mod = r() < 0.75 ? mods[Math.floor(r() * mods.length)] : null;
    const level = r() < 0.55 ? 1 : 2;
    const modeName = { caneca: '¡A la caneca!', chicles: 'Atrapa chicles', rey: 'Rey del borrador', gol: 'Gol de canica', escalada: 'Escalada tramposa' }[mode];
    const arenaName = (ARENA_DEFS[arena] || {}).name || '';
    const levelName = ['Novato', 'Masticador', 'Leyenda'][level];
    return {
      key, mode, arena, mod: mod ? mod.id : null, level,
      title: `${modeName}${mod ? ' · ' + mod.name.charAt(0) + mod.name.slice(1).toLowerCase() : ''}`,
      desc: `Gánale a la máquina ${levelName} en ${modeName}, en ${arenaName}${mod ? ', con «' + mod.name.charAt(0) + mod.name.slice(1).toLowerCase() + '» todas las rondas' : ''}.`,
    };
  }
  function dailyState() {
    const k = today(), last = S.daily.last;
    const yest = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
    const streak = last === k || last === yest ? S.daily.streak : 0;
    return { done: last === k, streak };
  }
  function dailyDone() {
    const k = today();
    if (S.daily.last === k) return;
    const st = dailyState();
    S.daily = { last: k, streak: st.streak + 1 };
    save('daily');
    unlock(0, 'reto_diario');
    if (S.daily.streak >= 3) unlock(0, 'constante');
    popups.push({ i: 0, title: '¡Reto del día superado!', desc: `Racha: ${S.daily.streak} ${S.daily.streak === 1 ? 'día' : 'días'}`, t: 0 });
  }

  /* ---------------- avisos de logro (en el lienzo) ---------------- */
  function drawHUD(ctx, W, H) {
    if (!popups.length) return;
    const p = popups[0];
    p.t += 1 / 60;
    const life = 3.2;
    if (p.t > life) { popups.shift(); return; }
    const k = Math.min(1, p.t / 0.25, (life - p.t) / 0.3);
    const G = Game.G, pl = G.players[p.i], rr = ArenaArt.rr, ink = PALETTE.ink;
    ctx.save();
    ctx.globalAlpha = clamp(k, 0, 1);
    ctx.font = font(22, 700);
    const w = Math.max(ctx.measureText(p.title).width, (ctx.font = font(16, 600), ctx.measureText(p.desc).width)) + 110;
    const x = p.i === 0 ? 28 : W - 28 - w, y = (G.tutorial ? 214 : 140) - (1 - k) * 30;
    ctx.fillStyle = 'rgba(40,20,10,0.3)'; rr(ctx, x + 4, y + 6, w, 70, 18); ctx.fill();
    rr(ctx, x, y, w, 70, 18); ctx.fillStyle = '#fff6e6'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = ink; ctx.stroke();
    // trofeo
    ctx.save(); ctx.translate(x + 40, y + 35);
    ctx.beginPath(); ctx.moveTo(-15, -18); ctx.lineTo(15, -18); ctx.quadraticCurveTo(14, 4, 0, 8); ctx.quadraticCurveTo(-14, 4, -15, -18); ctx.closePath();
    ctx.fillStyle = '#ffd84d'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
    ctx.fillRect(-3, 8, 6, 8); ctx.strokeRect(-3, 8, 6, 8);
    ctx.beginPath(); ctx.rect(-10, 16, 20, 5); ctx.fillStyle = pl ? pl.col.base : '#ff5c9d'; ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = pl ? pl.col.deep : ink; ctx.font = font(13, 700); ctx.fillText(`LOGRO · ${S.names[p.i].toUpperCase()}`, x + 70, y + 18);
    ctx.fillStyle = ink; ctx.font = font(22, 700); ctx.fillText(p.title, x + 70, y + 40);
    ctx.fillStyle = PALETTE.inkSoft; ctx.font = font(15, 600); ctx.fillText(p.desc, x + 70, y + 59);
    ctx.restore();
  }

  /* ---------------- accesorios ---------------- */
  function accUnlocked(i, id) { const a = ACCESSORIES.find(x => x.id === id); if (!a) return false; if (a.camp) return !!(typeof Campaign !== 'undefined' && Campaign.data.rewards && Campaign.data.rewards[a.camp]); return count(S.names[i]) >= a.need; }
  function setAcc(i, id) { if (!accUnlocked(i, id)) return false; S.acc[i] = id; save('acc'); return true; }
  function accOf(i) { const id = S.acc[i]; return accUnlocked(i, id) ? id : 'ninguno'; }

  return {
    ACH, ACCESSORIES, on, unlock, drawHUD, dailySpec, dailyState, record, count, has,
    setName, setAcc, accOf, accUnlocked,
    get names() { return S.names.slice(); },
    stats: name => S.pstats[name] || { matches: 0, wins: 0 },
    get newAch() { return match ? match.newAch : [[], []]; },
  };
})();
