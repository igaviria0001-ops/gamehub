/* =========================================================================
   VESTIDOR DE SORTILEGIO — qué atuendos hay y cómo se ganan.
   · Cada mago tiene los suyos (2 y 6 duelos ganados con él).
   · Y hay atuendos para cualquier mago, cada vez más vistosos: se ganan con
     duelos, la Escuela, el grimorio, la Copa, cada jefe de la campaña y las
     estrellas. Los legendarios y míticos traen aura y, algunos, estela.
   El vestidor (pantalla, ceremonia y guardado) es el común de GameHub.
   ========================================================================= */
const Vestidor = (() => {
  const C = () => {
    const P = Progress.data, wins = P.wins || {}, camp = Store.get('camp', {});
    return { wins, ach: P.ach || {}, grim: Object.keys(P.grim || {}).filter(k => FUSIONS[k]).length, camp, stars: Camp.total(), total: Object.values(wins).reduce((a, b) => a + b, 0) };
  };
  const items = [];
  CHAR_ORDER.forEach((cid, i) => {
    const S = ArtMage.SKINS[cid], nm = CHARS[cid].name;
    items.push({ id: cid + '.0', slot: 'skin', char: cid, free: true, rar: 'comun', name: S[0].name, desc: `El atuendo de siempre de ${nm}.`, order: i });
    items.push({ id: cid + '.1', slot: 'skin', char: cid, rar: 'comun', name: S[1].name, how: `Gana 2 duelos con ${nm}.`, desc: `De ${nm}: por sus primeros duelos ganados.`, test: c => (c.wins[cid] || 0) >= 2, prog: c => [c.wins[cid] || 0, 2], order: i });
    items.push({ id: cid + '.2', slot: 'skin', char: cid, rar: 'raro', name: S[2].name, how: `Gana 6 duelos con ${nm}.`, desc: `De ${nm}: solo para quien lo domina.`, test: c => (c.wins[cid] || 0) >= 6, prog: c => [c.wins[cid] || 0, 6], order: i });
  });
  const U = (key, rar, how, desc, test, prog) => items.push({ id: 'u.' + key, slot: 'skin', rar, name: ArtMage.OUTFITS[key].name, how, desc, test, prog, order: 100 + items.length });
  const L = id => c => (c.camp[id] || 0) > 0;
  U('jaguar', 'raro', 'Gana 5 duelos con cualquier mago.', 'Capa de piel de jaguar con broches de oro. Para cualquier mago.', c => c.total >= 5, c => [c.total, 5]);
  U('caiman', 'raro', 'Termina la Escuela de magia.', 'Túnica de escamas de caimán que brillan al moverse.', c => !!c.ach.school);
  U('runico', 'epico', 'Descubre 14 fusiones en el grimorio.', 'Las runas del grimorio, bordadas en luz violeta que late.', c => c.grim >= 14, c => [c.grim, 14]);
  U('cristal', 'epico', 'Vence a la Madremonte (campaña, nivel 4).', 'Capa de cristal tallado que destella.', L('c4'));
  U('aurora', 'epico', 'Vence al Mohán (campaña, nivel 7).', 'Una aurora que se mueve por toda la túnica.', L('c7'));
  U('tormenta', 'epico', 'Gana una Copa del Páramo.', 'Nubes de tormenta con relámpagos, y rayos que lo rodean.', c => !!c.ach.copa);
  U('lava', 'legendario', 'Vence a Tragaluz, el jefe final del Mundo 1.', 'Roca de volcán con grietas de magma vivo. Aura de brasas y estela de fuego.', L('c10'));
  U('oro', 'legendario', 'Vence al Cóndor de Oro (Mundo 2).', 'Filigrana de oro que brilla, con corona de rayos de sol y halo.', L('c14'));
  U('fatuo', 'legendario', 'Gánale un duelo a la máquina en difícil.', 'Llamas azules que suben por la túnica. Aura de fuego fatuo y estela de escarcha.', c => !!c.ach.hard);
  U('dragon', 'legendario', 'Completa el grimorio: las 28 fusiones.', 'Escamas de jade y oro, y un dragón espíritu que lo rodea.', c => c.grim >= 28 || !!c.ach.fusion15, c => [c.grim, 28]);
  U('galaxia', 'mitico', 'Consigue 30 estrellas en la campaña.', 'Una galaxia entera en la túnica y la capa. Aura de galaxia con planetas y estela de cometa.', c => c.stars >= 30, c => [c.stars, 30]);
  U('abismo', 'mitico', 'Vence a Buziraco, el jefe final del Mundo 2.', 'Negro de agujero negro, con su disco de luz girando detrás y estela de sombra.', L('c18'));
  U('prisma', 'mitico', 'Consigue todas las estrellas de los dos mundos.', 'Tela holográfica que cambia de color, cristales de arcoíris y estela de arcoíris.', c => c.stars >= Camp.LEVELS.length * 3, c => [c.stars, Camp.LEVELS.length * 3]);

  let pickOf = p => Game.cfg.chars[p];
  const V = Vest.create({
    prefix: GAME_META.storagePrefix, title: 'Vestidor de magos',
    slots: [{ id: 'skin', name: 'Atuendos', one: 'atuendo', perChar: true }],
    items, ctx: C,
    pcolors: [PLAYER_COLORS[0].main, PLAYER_COLORS[1].main], pnames: () => ['J1', 'J2'],
    charOf: p => pickOf(p), charName: p => CHARS[pickOf(p)].name,
    preview(x, W, H, t, p, over, it, live) {
      const cid = it && it.char ? it.char : pickOf(p), sk = over.skin || V.eq(p, 'skin', cid);
      ArtMage.showcase(x, cid, W, H, t, sk);
      const Lk = ArtMage.look(cid, sk);
      if (live && Lk.trail2) { const s = H / 132, a = t * 2.1, X = W / 2 + Math.cos(a) * 46 * s, Y = H * 0.84 - 40 * s + Math.sin(a) * 15 * s; Vest.trailPush('prev', X, Y, t, 2); Vest.drawTrail(x, Lk.trail2, 'prev', 4.5 * s, t); Vest.put(x, Vest.glow('255,255,255', true), X, Y, 9 * s, 0.9); }
    },
    sound: { reveal: r => Sound.play(r === 'mitico' || r === 'legendario' ? 'gran' : 'matchWin'), open: () => Sound.play('select'), pick: () => Sound.play('select'), equip: () => Sound.play('absorb') },
  });
  // lo que se ganó antes de que existiera el vestidor queda ganado (sin ceremonia: aparece como «nuevo»)
  V.check(true);
  // los atuendos que ya tenían puestos (números de antes) pasan al vestidor
  try { const old = Game.cfg.skins || []; for (let p = 0; p < 2; p++) { const n = old[p]; if (typeof n === 'number' && n > 0 && !(V.S.eq[p] || {}).skin) V.setEq(p, 'skin', Game.cfg.chars[p] + '.' + n, Game.cfg.chars[p]); } } catch (e) { /* nada */ }
  return { V, setPick(f) { pickOf = f; } };
})();
// el menú ya existe: los atuendos puestos y el contador del botón «Vestidor»
Vestidor.setPick(p => UI.pickOf(p)); UI.syncSkins(); UI.vestBadge();
