/* =========================================================================
   VESTIDOR DE TIRA Y AFLOJA — sabores y accesorios que se ganan jugando.
   · Sabores: los 6 de siempre, los 3 premios de la campaña y 12 especiales
     con material propio (escamas, jaguar, runas, cristal, aurora, tormenta,
     lava, fuego azul, dragón, galaxia, agujero negro, holográfico).
   · Accesorios: los de los logros, los de la campaña y 4 nuevos.
   · Se ganan con la campaña (cada jefe), el modo Jefes, los retos con oro,
     las partidas ganadas y los logros. Lo ganado vale para los dos jugadores.
   El vestidor (pantalla, ceremonia y guardado) es el común de GameHub.
   ========================================================================= */
const Vestidor = (() => {
  const ctx = () => {
    const ach = Store.get('ach', {}), ps = Store.get('pstats', {}), cd = Campaign.data || {}, rew = cd.rewards || {};
    const stars = Object.values(cd.stars || {}).reduce((a, b) => a + (+b || 0), 0);
    const maxAch = Math.max(0, ...Object.values(ach).map(o => Object.keys(o || {}).length));
    const wins = Object.values(ps).reduce((a, s) => a + ((s && s.wins) || 0), 0);
    const jf = Store.get('jefes', null) || { wins: {} }, jw = jf.wins || {}, jbeat = Object.keys(jw).filter(k => jw[k] > 0).length;
    const rt = Store.get('retos', null) || { medal: {} }, golds = Object.values(rt.medal || {}).filter(m => m === 3).length;
    return { maxAch, wins, rew, stars, jbeat, jw, golds };
  };
  const items = [], NA = Progress.ACH.length;
  const F = (id, rar, how, desc, test, prog) => items.push({ id, slot: 'flavor', rar, name: FLAVORS[id].name, how, desc, test, prog, free: !test });
  ['fresa', 'menta', 'uva', 'limon', 'mango', 'mora'].forEach(id => F(id, 'comun', '', 'Un sabor de siempre.'));
  const Z = (zone, boss) => [c => !!c.rew[zone], `Vence ${boss} en la campaña.`];
  const R = (id, rar, desc, [test, how], prog) => F(id, rar, how, desc, test, prog);
  R('kiwi', 'raro', 'Escamas verdes que brillan cuando se mueve.', Z('salon', 'a la Aspiradora'));
  F('maracuya', 'raro', 'Gana 10 partidas.', 'Piel de tigre con manchas de jaguar.', c => c.wins >= 10, c => [c.wins, 10]);
  R('algodon', 'raro', 'Premio de la zona de Arte.', Z('arte', 'al Sacapuntas eléctrico'));
  R('cola', 'raro', 'Premio de la Biblioteca.', Z('biblioteca', 'a la Fotocopiadora'));
  R('mora_runa', 'epico', 'Runas que laten con luz violeta.', Z('arte', 'al Sacapuntas eléctrico'));
  R('menta_polar', 'epico', 'Cristal de hielo tallado que destella.', Z('gimnasio', 'al Aseador'));
  R('boreal', 'epico', 'Una aurora boreal moviéndose adentro.', Z('biblioteca', 'a la Fotocopiadora'));
  F('uva_electrica', 'epico', 'Vence a 3 jefes en el modo Jefes.', 'Nubes de tormenta con relámpagos, y rayos alrededor.', c => c.jbeat >= 3, c => [c.jbeat, 3]);
  R('oro', 'epico', 'El premio de la Torre del Reloj.', Z('torre', 'al Reloj de la torre'));
  R('chile', 'legendario', 'Roca de lava con grietas vivas, aura de brasas y estela de fuego.', Z('cafeteria', 'al Microondas'));
  F('fatuo', 'legendario', 'Consigue 30 logros (cualquier jugador).', 'Llamas azules por dentro, aura de fuego fatuo y estela de escarcha.', c => c.maxAch >= 30, c => [c.maxAch, 30]);
  F('dragon', 'legendario', 'Vence a los 6 jefes en el modo Jefes.', 'Escamas de jade y un dragón espíritu que lo rodea.', c => c.jbeat >= 6, c => [c.jbeat, 6]);
  R('galaxia', 'mitico', 'Una galaxia entera adentro, aura con planetas y estela de cometa.', Z('torre', 'al Reloj de la torre (el final)'));
  F('agujero', 'mitico', 'Junta 100 estrellas en la campaña.', 'Negro de agujero negro con su disco de luz girando y estela de sombra.', c => c.stars >= 100, c => [c.stars, 100]);
  F('holo', 'mitico', `Consigue ${Math.min(45, NA)} logros (cualquier jugador).`, 'Holográfico que cambia de color, cristales de arcoíris y estela de arcoíris.', c => c.maxAch >= Math.min(45, NA), c => [c.maxAch, Math.min(45, NA)]);
  const A = (id, rar, how, test, prog, desc) => items.push({ id: 'acc.' + id, slot: 'acc', rar, name: Progress.ACCESSORIES.find(a => a.id === id).name.replace(/ \(campaña\)$/, ''), how, desc: desc || how, test, prog, free: !test });
  A('ninguno', 'comun', '', null, null, 'Sin nada en la cabeza.');
  Progress.ACCESSORIES.filter(a => !a.camp && !a.vest && a.need > 0 && a.need < 1e9).forEach(a => A(a.id, a.need >= 30 ? 'epico' : a.need >= 17 ? 'raro' : 'comun', `Consigue ${a.need} logros (cualquier jugador).`, c => c.maxAch >= a.need, c => [c.maxAch, a.need]));
  A('birrete', 'raro', 'Vence a la Aspiradora en la campaña.', c => !!c.rew.salon);
  A('vincha', 'raro', 'Vence al Aseador en la campaña.', c => !!c.rew.gimnasio);
  A('chef', 'raro', 'Vence al Microondas en la campaña.', c => !!c.rew.cafeteria);
  A('cuernos', 'raro', 'Gana 25 partidas.', c => c.wins >= 25, c => [c.wins, 25], 'Cuernitos de diablillo.');
  A('aureola', 'epico', 'Gana medalla de oro en 5 retos de técnica.', c => c.golds >= 5, c => [c.golds, 5], 'Aureola de luz que flota.');
  A('corona_fuego', 'legendario', 'Vence al Reloj en el modo Jefes.', c => (c.jw.reloj || 0) > 0, null, 'Corona de llamas vivas.');
  A('orbita', 'mitico', 'Gana 100 partidas.', c => c.wins >= 100, c => [c.wins, 100], 'Tres planetas que le dan la vuelta a la cabeza.');

  // vista previa: un chicle en una vitrina oscura (así brillan los materiales y las auras)
  const prevP = [null, null];
  function pp(p) { if (!prevP[p]) { prevP[p] = new Player(p, FLAVORS.fresa); prevP[p].preview = true; } return prevP[p]; }
  function preview(x, W, H, t, p, over, it, live) {
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#22184a'); g.addColorStop(0.68, '#3a2a6a'); g.addColorStop(0.69, '#8a5a34'); g.addColorStop(1, '#4a2e18'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const sp = x.createRadialGradient(W / 2, H * 0.1, 0, W / 2, H * 0.55, H * 0.75); sp.addColorStop(0, 'rgba(255,240,210,0.35)'); sp.addColorStop(1, 'rgba(255,240,210,0)'); x.fillStyle = sp; x.fillRect(0, 0, W, H);
    const fl = over.flavor || Game.G.flavors[p], ac = over.acc ? over.acc.slice(4) : Progress.accOf(p), P = pp(p), col = FLAVORS[fl] || FLAVORS.fresa;
    P.col = col; P.acc = ac; P.facing = p ? -1 : 1;
    const k = (H * 0.24) / P.r; let ox = 0, oy = 0;
    if (live && col.trail2) { ox = Math.sin(t * 1.7) * W * 0.24 / k; oy = Math.sin(t * 3.4) * H * 0.06 / k; Vest.trailPush('tya' + p + 'p', ox, oy, performance.now() / 1000, 3); }
    x.save(); x.translate(W / 2, H * 0.6); x.scale(k, k);
    const sh = x.createRadialGradient(ox, P.r * 1.05, 0, ox, P.r * 1.05, P.r * 1.2); sh.addColorStop(0, 'rgba(0,0,0,0.45)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = sh; x.beginPath(); x.ellipse(ox, P.r * 1.05, P.r * 1.2, P.r * 0.3, 0, 0, Math.PI * 2); x.fill();
    const mk = Player.marks; Player.marks = false; P.x = ox; P.y = oy; P.trail = []; P.stuck = false; P.stun = 0; P.alive = true; P.sticky = 1; P.charge = 0;
    try { P.draw(x, t); } catch (e) { /* nada */ }
    Player.marks = mk; x.restore();
  }
  const V = Vest.create({
    prefix: GAME_META.storagePrefix, title: 'Vestidor',
    slots: [{ id: 'flavor', name: 'Sabores', one: 'sabor', newWord: 'nuevo' }, { id: 'acc', name: 'Accesorios', one: 'accesorio', newWord: 'nuevo' }],
    items, ctx, preview,
    pcolors: () => [FLAVORS[Game.G.flavors[0]].base, FLAVORS[Game.G.flavors[1]].base],
    pnames: () => Progress.names,
    sound: { reveal: r => Sound.play(r === 'mitico' || r === 'legendario' ? 'win' : 'golden'), open: () => Sound.play('select'), pick: () => Sound.play('select'), equip: () => Sound.play('stick') },
    onEquip(p, slot, id) {
      if (slot === 'flavor') { const Fl = Game.G.flavors; if (Fl[1 - p] === id) Fl[1 - p] = Fl[p]; Fl[p] = id; Store.set('flavors', Fl.slice()); Game.applyFlavors(); }
      else Progress.setAcc(p, id.slice(4)) && Game.applyFlavors();
    },
  });
  // lo de siempre: lo que el juego ya tiene puesto es lo que el vestidor muestra como «puesto»
  const sync = () => { for (let p = 0; p < 2; p++) { V.S.eq[p] = V.S.eq[p] || {}; V.S.eq[p].flavor = Game.G.flavors[p]; V.S.eq[p].acc = 'acc.' + Progress.accOf(p); } };
  V.check(true);
  return {
    V, sync,
    open(p, after) { sync(); V.wardrobe({ player: p || 0, onClose() { Game.applyFlavors(); if (after) after(); } }); },
    after() { const got = V.check(); if (got.length) setTimeout(() => { sync(); V.reveal(() => { Game.applyFlavors(); if (UI.vestBadge) UI.vestBadge(); }); }, 1300); },
  };
})();
if (UI.vestBadge) UI.vestBadge();
