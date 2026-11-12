/* =========================================================================
   VESTIDOR DE VENTOLERA — pinturas del ala y estelas que se ganan volando.
   · Pinturas de cada piloto: las dos de siempre y la dorada (Leyenda viva).
   · Pinturas especiales (para cualquier piloto), cada vez más vistosas:
     jaguar, caimán, llamarada, tormenta, aurora, hielo tallado, magma,
     filigrana de oro, fuego fatuo, galaxia, agujero negro y holográfica.
     Las legendarias y míticas llevan los bordes del ala encendidos.
   · Estelas: salen de las toberas (chispas, neón de tu color, fuego,
     escarcha, sombra, relámpago, arcoíris, cometa y polvo de galaxia).
   · Se ganan con derribos, maniobras, la Escuela, el Jefe, la Copa,
     la Travesía y los logros. El vestidor es el común de GameHub.
   ========================================================================= */
const Vestidor = (() => {
  const C = () => {
    const P = Progress.data, got = P.got || {};
    return { n: P.n, got, nach: ACHIEVEMENTS.filter(a => got[a.id]).length, trav: Travesia.total() };
  };
  const items = [], A = id => c => !!c.got[id];
  SPECIES_ORDER.forEach((sp, i) => {
    const Lk = PILOT_ART[sp].looks, nm = SPECIES[sp].name;
    items.push({ id: sp + '.0', slot: 'paint', char: sp, free: true, rar: 'comun', name: Lk[0].name, desc: `La pintura de siempre de ${nm}.`, order: i });
    items.push({ id: sp + '.1', slot: 'paint', char: sp, free: true, rar: 'comun', name: Lk[1].name, desc: `La otra pintura de ${nm}.`, order: i });
    items.push({ id: sp + '.2', slot: 'paint', char: sp, rar: 'epico', name: Lk[2].name, how: 'Entra 5 veces en Modo leyenda.', desc: `${nm} de oro: para las leyendas vivas.`, test: A('leyenda5'), prog: c => [c.n.leyendas, 5], order: i });
  });
  const U = (key, rar, how, desc, test, prog) => items.push({ id: 'u.' + key, slot: 'paint', rar, name: PAINTS[key].name, how, desc, test, prog, order: 100 + items.length });
  U('jaguar', 'raro', 'Derriba 20 rivales.', 'Piel de jaguar de punta a punta del ala. Para cualquier piloto.', c => c.n.derribos >= 20, c => [c.n.derribos, 20]);
  U('caiman', 'raro', 'Termina la Escuela de vuelo.', 'Escamas de caimán que destellan cuando el ala gira.', A('escuela'));
  U('llamarada', 'epico', 'Rompe la barrera del sonido.', 'Llamas de carreras que salen de la nariz y se mueven con el viento.', A('sonico'));
  U('tormenta', 'epico', 'Que te caiga un rayo… y seguir volando.', 'Nubes de tormenta en el ala, con relámpagos que la cruzan.', A('rayo'));
  U('aurora', 'epico', 'Gana una partida de Maletín y una Carrera.', 'Una aurora boreal ondulando sobre el ala de noche.', c => !!(c.got.maletin && c.got.carrera), c => [(c.got.maletin ? 1 : 0) + (c.got.carrera ? 1 : 0), 2]);
  U('cristal', 'epico', 'Revienta 50 blancos en total.', 'Hielo tallado en facetas que destellan.', A('globos'), c => [c.n.blancos, 50]);
  U('magma', 'legendario', 'Derrota a La Sombra (modo Jefe).', 'Roca de volcán con grietas de magma vivo y los bordes al rojo.', A('jefe'));
  U('oro', 'legendario', 'Gana una Copa de 5 pruebas.', 'Filigrana de oro que brilla, con los bordes encendidos. La de los campeones.', A('copa'));
  U('fatuo', 'legendario', 'Gánale un duelo a la máquina en difícil.', 'Llamas azules de la nariz a la cola y bordes de luz fría.', A('dificil'));
  U('galaxia', 'mitico', 'Gana el Duelo final de la Travesía.', 'Una galaxia entera moviéndose dentro del ala, con bordes de luz rosada.', A('travesia'));
  U('agujero', 'mitico', 'Terminen la Travesía para dos.', 'Negro de agujero negro con su disco de luz girando, y bordes violeta.', A('trav2'));
  U('holo', 'mitico', 'Saca las 30 estrellas de la Travesía.', 'Holográfica: cambia de color con la luz y los bordes pasan por todo el arcoíris.', A('estrellas'), c => [c.trav, 30]);

  const T = (key, rar, name, how, desc, test, prog) => items.push({ id: 't.' + key, slot: 'trail', rar, name, how, desc, test, prog, free: !test, order: items.length });
  T('ninguna', 'comun', 'Solo vapor', '', 'La estela de siempre: vapor blanco y la línea de tu color.');
  T('chispas', 'raro', 'Chispas', 'Juega 10 partidas.', 'Las toberas sueltan chispas doradas.', c => c.n.partidas >= 10, c => [c.n.partidas, 10]);
  T('neon', 'raro', 'Neón', 'Haz 100 maniobras.', 'Una cinta de neón del color de tu casco.', c => c.n.maniobras >= 100, c => [c.n.maniobras, 100]);
  T('fuego', 'epico', 'Estela de fuego', 'Derriba 50 rivales.', 'Fuego vivo detrás de las turbinas.', c => c.n.derribos >= 50, c => [c.n.derribos, 50]);
  T('hielo', 'epico', 'Escarcha', 'Encadena 5 maniobras distintas.', 'Luz helada y copos de nieve que se quedan en el aire.', A('combo5'));
  T('sombra', 'epico', 'Sombra', 'Revienta una bala de cañón en el aire.', 'Humo negro con destellos violeta.', A('artillero'));
  T('rayo', 'legendario', 'Relámpago', 'Atraviesa el avión con un tonel en Bogotá.', 'Un relámpago que te sigue a todas partes.', A('avion'));
  T('arcoiris', 'legendario', 'Arcoíris', 'Entra 15 veces en Modo leyenda.', 'Seis cintas de colores, de punta a punta del cielo.', c => c.n.leyendas >= 15, c => [c.n.leyendas, 15]);
  T('cometa', 'mitico', 'Cometa', 'Junta 20 estrellas en la Travesía.', 'Cabeza de luz y cola de estrellas, como un cometa.', c => c.trav >= 20, c => [c.trav, 20]);
  T('galaxia', 'mitico', 'Polvo de galaxia', 'Consigue 18 logros.', 'Nebulosas rosadas y azules con estrellas que titilan.', c => c.nach >= 18, c => [c.nach, 18]);

  /* ---- vista previa: el piloto volando en el cielo del atardecer, con su estela ---- */
  const prevS = { s: 0.2, ok: false };
  const sky = (x, W, H, camX) => {
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#16224e'); g.addColorStop(0.5, '#4f4a8c'); g.addColorStop(0.8, '#d98a74'); g.addColorStop(1, '#ffc887');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    const sn = x.createRadialGradient(W * 0.78, H * 0.92, 0, W * 0.78, H * 0.92, H * 0.6); sn.addColorStop(0, 'rgba(255,236,190,0.75)'); sn.addColorStop(0.25, 'rgba(255,190,130,0.3)'); sn.addColorStop(1, 'rgba(255,170,120,0)');
    x.fillStyle = sn; x.fillRect(0, 0, W, H);
    // nubes en dos capas que pasan (dan la sensación de velocidad)
    for (let L = 0; L < 2; L++) for (let i = 0; i < 4; i++) {
      const span = W + 260, cx = ((i * 197 + L * 91 - camX * (0.25 + L * 0.35)) % span + span) % span - 130, cy = H * (0.18 + 0.22 * i + L * 0.12) % H, r = (28 + 22 * L) * (H / 300);
      x.fillStyle = L ? 'rgba(255,214,200,0.16)' : 'rgba(200,190,255,0.1)';
      for (let k = 0; k < 3; k++) { x.beginPath(); x.ellipse(cx + (k - 1) * r * 0.9, cy + (k === 1 ? -r * 0.3 : 0), r * (k === 1 ? 1 : 0.75), r * 0.45 * (k === 1 ? 1.2 : 1), 0, 0, TAU); x.fill(); }
    }
  };
  function preview(x, W, H, t, p, over, it, live) {
    const sp = it && it.char ? it.char : Game.cfg.species[p], S = SPECIES[sp];
    const lk = over.paint || V.eq(p, 'paint', sp), tr = String(over.trail || V.eq(p, 'trail') || 't.ninguna').replace(/^t\./, '');
    // escala: el piloto ocupa como medio cuadro; el mundo se mueve a SPD unidades por segundo
    const s = Math.min(W / 138, H / 92) / S.size, SPD = 170, path = tt => ({ x: tt * SPD, y: Math.sin(tt * 1.7) * 16 + Math.sin(tt * 0.6) * 6 });
    const P0 = path(t), camX = P0.x - (W * 0.14) / s, camY = 0;
    sky(x, W, H, camX * s);
    x.save(); x.translate(W / 2, H / 2); x.scale(s, s); x.translate(-camX, -camY);
    // la estela: puntos sobre el camino ya recorrido (alineados en el tiempo para que no tiemblen)
    if (tr !== 'ninguna' && Vest.TRAIL[tr]) {
      const key = 'vtoprev' + p, life = Vest.TRAIL[tr].life, dt = 0.022, t0 = Math.floor(t / dt) * dt, r = S.r * 1.15;
      Vest.trailReset(key);
      for (let tt = t0 - life - dt; tt <= t + 1e-6; tt += dt) { const q = path(Math.min(tt, t)), q2 = path(Math.min(tt, t) + 0.01), a = Math.atan2(q2.y - q.y, q2.x - q.x); Vest.trailPush(key, q.x - Math.cos(a) * r, q.y - Math.sin(a) * r, Math.min(tt, t), 0); }
      Vest.drawTrail(x, tr, key, S.r * 0.34, t, PLAYER_COLORS[p].glow);
    }
    const q2 = path(t + 0.01), a = Math.atan2(q2.y - P0.y, q2.x - P0.x);
    const fake = { id: null, sp: S, look: lk, x: P0.x, y: P0.y, a, c: 1, s: 600, perch: null, flapPh: t * 9, rollT: 0, stun: 0, facing: 1, boosting: Math.sin(t * 1.1 + p * 2) > 0.2, hitT: 0, shield: 0, legendT: 0, flipT: 0, spin: 0, mis: 0, stalled: false };
    try { ArtPilot.draw(x, fake, t, PLAYER_COLORS[p]); } catch (e) { /* nada */ }
    x.restore();
  }

  const V = Vest.create({
    prefix: GAME_META.storagePrefix, title: 'Hangar',
    slots: [{ id: 'paint', name: 'Pinturas', one: 'pintura', perChar: true, newWord: 'nueva' }, { id: 'trail', name: 'Estelas', one: 'estela', newWord: 'nueva' }],
    items, ctx: C, preview,
    pcolors: [PLAYER_COLORS[0].main, PLAYER_COLORS[1].main], pnames: () => ['J1', 'J2'],
    charOf: p => Game.cfg.species[p], charName: p => SPECIES[Game.cfg.species[p]].name,
    sound: { reveal: r => Sound.play(r === 'mitico' || r === 'legendario' ? 'legend' : 'lessonDone'), open: () => Sound.play('select'), pick: () => Sound.play('select'), equip: () => Sound.play('pickup') },
    onEquip() { sync(); },
  });
  // lo puesto en el hangar es lo que usa la partida (las pinturas, por piloto)
  function sync() {
    const c = Game.cfg;
    for (let p = 0; p < 2; p++) { c.looks[p] = V.eq(p, 'paint', c.species[p]); c.trails[p] = V.eq(p, 'trail'); }
    Store.set('looks', c.looks);
    if (UI.refreshBirds) UI.refreshBirds();
  }
  // lo ganado antes de que existiera el hangar queda ganado (sin ceremonia: aparece como «nueva»)
  V.check(true);
  // las pinturas que ya tenían puestas (números de antes) pasan al hangar
  try { const c = Game.cfg; for (let p = 0; p < 2; p++) { const n = c.looks[p]; if (typeof n === 'number' && n > 0) V.setEq(p, 'paint', c.species[p] + '.' + (n % 3), c.species[p]); } } catch (e) { /* nada */ }
  sync();
  // pinturas que este jugador puede usar con ese piloto (en orden), para el botón «Pintura»
  const paints = sp => items.filter(it => it.slot === 'paint' && (!it.char || it.char === sp) && V.has(it.id)).map(it => it.id);
  return {
    V, sync, paints,
    open(p, after) { sync(); V.wardrobe({ player: p || 0, onClose() { sync(); if (UI.vestBadge) UI.vestBadge(); if (after) after(); } }); },
    // al volver a un menú: la ceremonia de lo nuevo (si ya están jugando otra vez, espera al próximo menú)
    after(delay = 1300) {
      V.check(); if (UI.vestBadge) UI.vestBadge();
      if (V.pending) setTimeout(() => { if (UI.current === null || V.isOpen || !V.pending) return; V.reveal(() => { sync(); if (UI.vestBadge) UI.vestBadge(); }); }, delay);
    },
  };
})();
if (UI.vestBadge) UI.vestBadge();
if (UI.refreshBirds) UI.refreshBirds();
