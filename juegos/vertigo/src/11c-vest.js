/* =========================================================================
   GARAJE DE VÉRTIGO — pinturas, neón y turbo que se ganan corriendo.
   · Pinturas de cada piloto: la de fábrica, la invertida (2 victorias con
     ese piloto) y la de fibra de carbono (6 victorias).
   · Pinturas del garaje para cualquier bólido (diseño en toda la carrocería):
     jaguar, caimán, llamarada, tormenta, aurora, hielo, magma (brilla),
     oro (metal de verdad), fuego fatuo, galaxia, agujero negro y holográfica.
   · Neón: la luz bajo el chasis, los aros de las ruedas y las puntas del ala.
   · Turbo: el color de la llama; los épicos en adelante dejan estela.
   · Se ganan con victorias, la Escuela, la Vuelta al mundo (cada jefe), la
     Persecución y las Copas. La vista previa es el bólido en 3D en un estudio.
   ========================================================================= */
const Vestidor = (() => {
  const vstat = () => Object.assign({ races: 0, wins: 0, pw: {}, cups: {} }, Store.get('vstat', {}));
  const C = () => {
    const S = vstat(), w = Store.get('world', {}), ch = Store.get('chase', {}), md = Store.get('school', {});
    return { S, w, wst: CAMPAIGN.reduce((a, c) => a + (w[c.id] || 0), 0), chS: BOSS_ORDER.reduce((a, k) => a + (ch[k] || 0), 0), chB: BOSS_ORDER.filter(k => ch[k] > 0).length, med: LESSONS.filter(L => md[L.id] > 0).length, gold: LESSONS.filter(L => md[L.id] >= 3).length };
  };
  const NW = CAMPAIGN.length * 3, items = [], beat = id => c => (c.w[id] || 0) > 0, nm = id => (CAMPAIGN.find(c => c.id === id) || {}).name || 'el jefe';
  PILOT_ORDER.forEach((pid, i) => {
    const P = PILOTS[pid];
    items.push({ id: pid + '.0', slot: 'paint', char: pid, free: true, rar: 'comun', name: 'De fábrica', desc: `La pintura de siempre de ${P.name}.`, order: i });
    items.push({ id: pid + '.1', slot: 'paint', char: pid, rar: 'comun', name: 'Edición inversa', how: `Gana 2 carreras con ${P.name}.`, desc: `Los colores de ${P.name} al revés.`, test: c => (c.S.pw[pid] || 0) >= 2, prog: c => [c.S.pw[pid] || 0, 2], order: i });
    items.push({ id: pid + '.2', slot: 'paint', char: pid, rar: 'raro', name: 'Fibra de carbono', how: `Gana 6 carreras con ${P.name}.`, desc: `Carbono a la vista con los colores de ${P.name}.`, test: c => (c.S.pw[pid] || 0) >= 6, prog: c => [c.S.pw[pid] || 0, 6], order: i });
  });
  const U = (key, rar, how, desc, test, prog) => items.push({ id: 'u.' + key, slot: 'paint', rar, name: CAR_PAINTS[key].name, how, desc, test, prog, order: 100 + items.length });
  U('jaguar', 'raro', 'Gana 5 carreras.', 'Piel de jaguar en toda la carrocería. Para cualquier bólido.', c => c.S.wins >= 5, c => [c.S.wins, 5]);
  U('caiman', 'raro', `Consigue medalla en las ${LESSONS.length} lecciones de la Escuela.`, 'Escamas de caimán que brillan con la luz.', c => c.med >= LESSONS.length, c => [c.med, LESSONS.length]);
  U('llamarada', 'epico', `Vence a ${nm('w10')} en la Vuelta al mundo.`, 'Llamas de carreras que salen de la nariz y brillan de noche.', beat('w10'));
  U('tormenta', 'epico', `Vence a ${nm('n11')} en la Vuelta al mundo.`, 'Nubes de tormenta por toda la carrocería.', beat('n11'));
  U('aurora', 'epico', 'Consigue 24 estrellas en la Vuelta al mundo.', 'Una aurora boreal que brilla en la oscuridad.', c => c.wst >= 24, c => [c.wst, 24]);
  U('cristal', 'epico', 'Gana oro en 4 lecciones de la Escuela.', 'Hielo tallado en facetas, con brillo de vidrio.', c => c.gold >= 4, c => [c.gold, 4]);
  U('magma', 'legendario', `Vence a ${nm('n23')} en la Vuelta al mundo.`, 'Roca de volcán con grietas de magma que laten y alumbran.', beat('n23'));
  U('oro', 'legendario', 'Gana la Copa Dorada.', 'Filigrana de oro macizo: metal de verdad que refleja todo.', c => !!c.S.cups.dorada);
  U('fatuo', 'legendario', 'Consigue 12 estrellas en Persecución.', 'Llamas azules de la nariz a la cola que brillan de noche.', c => c.chS >= 12, c => [c.chS, 12]);
  U('galaxia', 'mitico', `Derriba a ${nm('w24')}, el jefe final de la Vuelta al mundo.`, 'Una galaxia entera en la carrocería, que brilla de noche.', beat('w24'));
  U('agujero', 'mitico', 'Gana la Gran Copa (todas las pistas).', 'Negro de agujero negro con su disco de luz que late.', c => !!c.S.cups.mundial);
  U('holo', 'mitico', `Consigue 60 estrellas en la Vuelta al mundo.`, 'Holográfica: cambia de color todo el tiempo.', c => c.wst >= 60, c => [c.wst, 60]);

  const N = (key, rar, name, how, desc, test, prog) => items.push({ id: 'n.' + key, slot: 'neon', rar, name, how, desc, test, prog, free: !test, order: items.length });
  N('piloto', 'comun', 'Del piloto', '', 'El neón del color de tu piloto.');
  N('cian', 'raro', 'Cian', 'Corre 5 carreras.', 'Luz cian bajo el chasis y en las ruedas.', c => c.S.races >= 5, c => [c.S.races, 5]);
  N('rosa', 'raro', 'Rosa', 'Gana 3 carreras.', 'Luz rosa eléctrica.', c => c.S.wins >= 3, c => [c.S.wins, 3]);
  N('verde', 'epico', 'Esmeralda', 'Consigue 10 estrellas en la Vuelta al mundo.', 'El verde de la Copa Esmeralda, más fuerte.', c => c.wst >= 10, c => [c.wst, 10]);
  N('violeta', 'epico', 'Violeta', 'Vence a 2 jefes en Persecución.', 'Luz violeta intensa.', c => c.chB >= 2, c => [c.chB, 2]);
  N('oro', 'legendario', 'Oro', 'Gana la Copa Esmeralda.', 'Luz dorada de campeón.', c => !!c.S.cups.esmeralda);
  N('fuego', 'legendario', 'Fuego', `Vence a ${nm('w14')} en la Vuelta al mundo.`, 'Neón que titila como una llama.', beat('w14'));
  N('arcoiris', 'mitico', 'Arcoíris', `Gana oro en las ${LESSONS.length} lecciones de la Escuela.`, 'Pasa por todos los colores sin parar.', c => c.gold >= LESSONS.length, c => [c.gold, LESSONS.length]);

  const T = (key, rar, name, how, desc, test, prog) => items.push({ id: 't.' + key, slot: 'turbo', rar, name, how, desc, test, prog, free: !test, order: items.length });
  T('azul', 'comun', 'Azul de fábrica', '', 'La llama azul de siempre.');
  T('fuego', 'raro', 'Fuego', 'Gana 10 carreras.', 'Llama naranja de motor de verdad.', c => c.S.wins >= 10, c => [c.S.wins, 10]);
  T('verde', 'raro', 'Plasma verde', 'Corre 15 carreras.', 'Llama verde de plasma.', c => c.S.races >= 15, c => [c.S.races, 15]);
  T('rosa', 'epico', 'Rosa', 'Consigue 36 estrellas en la Vuelta al mundo.', 'Llama rosa encendida.', c => c.wst >= 36, c => [c.wst, 36]);
  T('violeta', 'epico', 'Violeta', 'Vence a 4 jefes en Persecución.', 'Llama violeta con estela de luz.', c => c.chB >= 4, c => [c.chB, 4]);
  T('oro', 'legendario', 'Oro', `Vence a ${nm('n16')} en la Vuelta al mundo.`, 'Llama dorada que deja una lluvia de chispas de oro.', beat('n16'));
  T('arcoiris', 'mitico', 'Arcoíris', `Consigue las 3 estrellas contra los ${BOSS_ORDER.length} jefes de Persecución.`, 'Llama de arcoíris y una estela de todos los colores.', c => c.chS >= BOSS_ORDER.length * 3, c => [c.chS, BOSS_ORDER.length * 3]);
  T('cometa', 'mitico', 'Cometa', `Consigue las ${NW} estrellas de la Vuelta al mundo.`, 'Llama blanca y una cola de estrellas como un cometa.', c => c.wst >= NW, c => [c.wst, NW]);

  /* ---- estudio 3D para la vista previa: el bólido en una plataforma que gira ---- */
  const Studio = (() => {
    let r = null, sc = null, cam = null, car = null, carPid = null, fail = false;
    const RW = 640, RH = 480;
    function init() {
      r = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
      r.setPixelRatio(1); r.setSize(RW, RH, false); r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05; r.setClearColor(0x07060f);
      sc = new THREE.Scene();
      // reflejos: cúpula degradada con dos paneles de luz
      const env = new THREE.Scene(), g = new THREE.SphereGeometry(50, 32, 16), p = g.attributes.position, col = [], c = new THREE.Color();
      const top = new THREE.Color('#34407e').convertSRGBToLinear(), mid = new THREE.Color('#5e5288').convertSRGBToLinear(), bot = new THREE.Color('#05050a').convertSRGBToLinear();
      for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 50; c.copy(mid).lerp(y > 0 ? top : bot, Math.min(1, Math.abs(y) * (y > 0 ? 1.2 : 3))); col.push(c.r, c.g, c.b); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); env.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
      for (const [x, y, z, s] of [[0, 30, 10, 18], [-30, 12, -10, 10], [30, 8, 6, 8]]) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(s, s * 0.5), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.2, 2.4), side: THREE.DoubleSide })); pl.position.set(x, y, z); pl.lookAt(0, 0, 0); env.add(pl); }
      const pm = new THREE.PMREMGenerator(r); sc.environment = pm.fromScene(env, 0.03).texture; pm.dispose();
      sc.add(new THREE.HemisphereLight(new THREE.Color('#c8d8ff').convertSRGBToLinear(), new THREE.Color('#1a1428').convertSRGBToLinear(), 0.55));
      const key = new THREE.DirectionalLight(0xffffff, 2.1); key.position.set(4, 7, 5); sc.add(key);
      const rim = new THREE.DirectionalLight(new THREE.Color('#ff7ad8').convertSRGBToLinear(), 1.2); rim.position.set(-6, 3, -6); sc.add(rim);
      const rim2 = new THREE.DirectionalLight(new THREE.Color('#5ad8ff').convertSRGBToLinear(), 0.9); rim2.position.set(6, 2, -5); sc.add(rim2);
      // piso del estudio: oscuro, con un foco suave en el centro (así se luce el neón de abajo)
      const ft = GFX.canvasTex(256, 256, (x2, w, h) => { const g2 = x2.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g2.addColorStop(0, '#2c2650'); g2.addColorStop(0.55, '#141228'); g2.addColorStop(1, '#07060f'); x2.fillStyle = g2; x2.fillRect(0, 0, w, h); for (let i = 1; i < 6; i++) { x2.strokeStyle = `rgba(150,140,255,${0.05 + 0.02 * i})`; x2.lineWidth = 1; x2.beginPath(); x2.arc(w / 2, h / 2, i * w / 12, 0, Math.PI * 2); x2.stroke(); } }, false);
      const floor = new THREE.Mesh(new THREE.CircleGeometry(4.2, 64), new THREE.MeshBasicMaterial({ map: ft })); floor.rotation.x = -Math.PI / 2; sc.add(floor);
      const ring = new THREE.Mesh(new THREE.RingGeometry(4.1, 4.25, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color('#5ad8ff').convertSRGBToLinear() })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.005; sc.add(ring);
      cam = new THREE.PerspectiveCamera(30, RW / RH, 0.1, 200); cam.position.set(6.6, 3.1, 7.6); cam.lookAt(0, 0.45, 0);
    }
    function carFor(pid) {
      if (car && carPid === pid) return car;
      if (car) { sc.remove(car.root); GFX.disposeScene(car.root); }
      car = CarArt.build(pid, null, null); carPid = pid; sc.add(car.root);
      for (const l of car.lamps) l.visible = false;
      return car;
    }
    const exh = new THREE.Vector3(), scr = new THREE.Vector3();
    const TR2D = { violeta: ['neon', '170,110,255'], oro: ['chispas'], arcoiris: ['arcoiris'], cometa: ['cometa'] };
    function draw(x, W, H, t, pid, sk, live, focusTurbo) {
      if (fail) return false;
      try { if (!r) init(); } catch (e) { fail = true; return false; }
      const m = carFor(pid); CarArt.skin(m, pid, sk);
      const ang = 0.55 + t * 0.55; m.root.rotation.y = ang;
      const boost = focusTurbo ? 1 : 0.3; for (const f of m.flames) { f.visible = true; f.scale.set(1, boost * (live ? 0.85 + 0.25 * Math.sin(t * 40) : 1), 1); }
      m.under.material.opacity = 0.75 * (m.neonK || 1); CarArt.skinFx(m, t);
      m.core.material.emissiveIntensity = 1.2; m.coreGlow.material.opacity = 0.6;
      r.render(sc, cam);
      // recorte que llena el cuadro sin deformar
      const k = Math.max(W / RW, H / RH), sw = W / k, sh = H / k, sx = (RW - sw) / 2, sy = (RH - sh) / 2 - RH * 0.02;
      x.drawImage(r.domElement, sx, sy, sw, sh, 0, 0, W, H);
      // estela del turbo (2D sobre la imagen): las posiciones pasadas de la tobera mientras la plataforma gira
      const tr = TR2D[sk.turbo];
      if (focusTurbo && tr && Vest.TRAIL[tr[0]]) {
        const key = 'vtgprev', life = Vest.TRAIL[tr[0]].life, dt = 0.02; Vest.trailReset(key);
        for (let tt = Math.floor(t / dt) * dt - life - dt; tt <= t + 1e-6; tt += dt) {
          const a = 0.55 + Math.min(tt, t) * 0.55; exh.set(0, 0.64, -2.7).applyAxisAngle(new THREE.Vector3(0, 1, 0), a); scr.copy(exh).project(cam);
          Vest.trailPush(key, ((scr.x + 1) / 2 * RW - sx) * k, ((1 - scr.y) / 2 * RH - sy) * k, Math.min(tt, t), 0);
        }
        x.save(); Vest.drawTrail(x, tr[0], key, W * 0.016, t, tr[1] || '255,255,255'); x.restore();
      }
      return true;
    }
    return { draw };
  })();
  const slotId = (p, s) => String(V.eq(p, s) || '').replace(/^[nt]\./, '');
  function preview(x, W, H, t, p, over, it, live) {
    const pid = it && it.char ? it.char : UI.cfg().p[p] || PILOT_ORDER[0];
    const sk = { paint: over.paint || V.eq(p, 'paint', pid), neon: String(over.neon || V.eq(p, 'neon') || '').replace(/^n\./, ''), turbo: String(over.turbo || V.eq(p, 'turbo') || '').replace(/^t\./, '') };
    if (!Studio.draw(x, W, H, live ? t : 1.3, pid, sk, live, !!over.turbo)) { x.fillStyle = CarArt.lookOf(pid, sk.paint).color; x.fillRect(0, 0, W, H); }
  }
  const snd = type => { try { Sound.onEvents({ humans: 1, cars: [{ bot: false, human: 0 }] }, [{ type, car: 0 }]); } catch (e) { /* nada */ } };
  const V = Vest.create({
    prefix: GAME_META.storagePrefix, title: 'Garaje',
    slots: [{ id: 'paint', name: 'Pinturas', one: 'pintura', perChar: true, newWord: 'nueva' }, { id: 'neon', name: 'Neón', one: 'neón', newWord: 'nuevo' }, { id: 'turbo', name: 'Turbo', one: 'turbo', newWord: 'nuevo' }],
    items, ctx: C, preview,
    pcolors: [PLAYER_COLORS[0].main, PLAYER_COLORS[1].main], pnames: () => ['J1', 'J2'],
    charOf: p => UI.cfg().p[p], charName: p => PILOTS[UI.cfg().p[p]].name,
    sound: { reveal: r => snd(r === 'mitico' || r === 'legendario' ? 'lessonDone' : 'gemSeg'), open: () => Sound.ui(), pick: () => Sound.ui(), equip: () => snd('turbo') },
    onEquip() { if (UI.refreshSetup) UI.refreshSetup(); },
  });
  V.check(true);
  // lo que lleva puesto cada jugador con ese piloto (los bólidos de la máquina van de fábrica)
  function skinOf(p, pid) { return { paint: V.eq(p, 'paint', pid), neon: slotId(p, 'neon'), turbo: slotId(p, 'turbo') }; }
  // al terminar cada carrera: victorias, carreras corridas y copas ganadas (para los desbloqueos)
  function record(R, G) {
    if (!R || R._vrec) return; R._vrec = true;
    const hum = R.cars.filter(c => !c.bot); if (!hum.length) return;
    const S = vstat(), mode = G && G.cfg && G.cfg.mode, wc = mode === 'world' ? CAMPAIGN[G.cfg.ch || 0] : null;
    S.races++;
    const ranked = R.cars.length > 1 && !['tt', 'school', 'chase'].includes(mode) && (!wc || ['race', 'elim', 'battle', 'rival', 'escape'].includes(wc.kind));
    if (ranked) for (const c of hum) if (c.place === 1) { S.wins++; S.pw[c.pid] = (S.pw[c.pid] || 0) + 1; }
    if (mode === 'gp' && G.gp && G.gp.i >= G.gp.list.length - 1) { const order = PILOT_ORDER.filter(k => G.gp.pts[k] != null).sort((a, b) => G.gp.pts[b] - G.gp.pts[a]); if (R.cars.some(c => c.pid === order[0] && !c.bot)) S.cups[(CUPS[G.cfg.cup || 0] || CUPS[0]).id] = true; }
    Store.set('vstat', S);
  }
  return {
    V, skinOf, record,
    open(p, after) { V.wardrobe({ player: p || 0, onClose() { if (UI.refreshSetup) UI.refreshSetup(); if (UI.vestBadge) UI.vestBadge(); if (after) after(); } }); },
    after(delay = 1400) { V.check(); if (UI.vestBadge) UI.vestBadge(); if (V.pending) setTimeout(() => { if (V.isOpen || !V.pending || Game.mode === 'race' && !Game.paused && document.getElementById('s-results').hidden) return; V.reveal(() => { if (UI.vestBadge) UI.vestBadge(); if (UI.refreshSetup) UI.refreshSetup(); }); }, delay); },
  };
})();
UI.vestBadge();
