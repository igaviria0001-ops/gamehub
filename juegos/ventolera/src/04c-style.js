/* =========================================================================
   MANIOBRAS Y ADRENALINA — premian la habilidad y la variedad.
   Cada maniobra con nombre suma Adrenalina; repetir la misma seguido vale
   cada vez menos (así conviene variar), y encadenar distintas multiplica.
   Con la barra llena: MODO LEYENDA (7 s): el arma no se recalienta, turbo
   sin límite, dispara más rápido y gana un misil.
   ========================================================================= */
const Style = (() => {
  const TRICKS = {
    derrape: { name: '¡Derrape!', pts: 0.13 },
    espaldas: { name: '¡Tiro de espaldas!', pts: 0.3 },
    cobra: { name: '¡Cobra!', pts: 0.2 },
    rizo: { name: '¡Rizo!', pts: 0.13 },
    martillo: { name: '¡Martillo!', pts: 0.2 },
    rasante: { name: '¡Rasante!', pts: 0.11 },
    limite: { name: '¡Al límite!', pts: 0.12 },
    pelo: { name: '¡Por un pelo!', pts: 0.22 },
    rebufo: { name: '¡Rebufo!', pts: 0.09 },
    flotar: { name: '¡Cohete!', pts: 0.1 },
    misil: { name: '¡Misil derribado!', pts: 0.2 },
    tonel: { name: '¡Tonel!', pts: 0.12 },
    metro: { name: '¡Bajo el metro!', pts: 0.24 },
    callejon: { name: '¡Por el callejón!', pts: 0.2 },
    cabina: { name: '¡Entre cabinas!', pts: 0.16 },
    sonico: { name: '¡Bum sónico!', pts: 0.14 },
    torre: { name: '¡Bajo la torre!', pts: 0.18 },
    artillero: { name: '¡Bala de cañón al aire!', pts: 0.24 },
    vigia: { name: '¡Vigía!', pts: 0.18 },
    abordaje: { name: '¡Abordaje!', pts: 0.12 },
    reloj: { name: '¡Bajo el reloj!', pts: 0.2 },
  };
  function award(G, b, key, extra = 1) {
    if (!b.alive || !G.canFight) return;
    const T = TRICKS[key], st = b.st, now = G.time;
    if ((st.cool[key] || 0) > now) return;
    st.cool[key] = now + 1.2;
    // repetir la misma maniobra en los últimos 12 s vale la mitad cada vez
    const rep = (st.rep[key] || []).filter(t => now - t < 12);
    rep.push(now); st.rep[key] = rep;
    const decay = Math.pow(0.5, rep.length - 1);
    // cadena: maniobras distintas seguidas multiplican
    st.combo = now - st.lastTrick < 2.6 ? Math.min(st.combo + 1, 5) : 1;
    st.lastTrick = now;
    const mult = 1 + (st.combo - 1) * 0.25;
    const gain = T.pts * decay * mult * extra;
    b.stats.tricks++;
    G.events.push({ type: 'trick', b, x: b.x, y: b.y, key, name: T.name, combo: st.combo, weak: decay < 0.4 });
    if (b.legendT > 0) return;
    b.adren = Math.min(1, b.adren + gain);
    if (b.adren >= 1) {
      b.adren = 0; b.legendT = 7; b.missiles = Math.min(4, b.missiles + 1); b.stats.legends++;
      G.events.push({ type: 'legend', b, x: b.x, y: b.y });
    }
  }
  // cada paso: detectar maniobras de un piloto
  function step(G, b, dt) {
    if (!b.alive || b.perch) { b.st.misT = 0; b.st.rasT = 0; return; }
    const st = b.st, W = G.world;
    // derrape: el cuerpo apunta lejos de la trayectoria, yendo rápido
    if (Math.abs(b.mis) > 1.05 && b.s > 300) { st.misT += dt; if (st.misT > 0.28 && st.misT - dt <= 0.28) award(G, b, 'derrape'); }
    else st.misT = 0;
    // cobra: frenazo brusco con el cuerpo hacia arriba
    st.sHist.push([G.time, b.s]); while (st.sHist.length && G.time - st.sHist[0][0] > 0.8) st.sHist.shift();
    if (st.sHist.length > 2) { const s0 = Math.max(...st.sHist.map(h => h[1])); if (s0 > 680 && b.s < s0 - 380 && Math.abs(angDiff(b.a, -Math.PI / 2)) < 0.7) { award(G, b, 'cobra'); st.sHist.length = 0; } }
    // rizo: la trayectoria da una vuelta completa
    const dva = angDiff(st.vaPrev, b.va); st.vaPrev = b.va;
    if (b.lift > 0.3) {
      if (Math.sign(dva) !== Math.sign(st.loopAcc) && Math.abs(dva) > 0.002) { st.loopAcc = 0; st.loopT = 0; }
      st.loopAcc += dva; st.loopT += dt;
      if (Math.abs(st.loopAcc) >= TAU) { if (st.loopT < 4) award(G, b, 'rizo'); st.loopAcc = 0; st.loopT = 0; }
      if (st.loopT > 4) { st.loopAcc = 0; st.loopT = 0; }
    }
    // martillo: subir en vertical hasta quedarse sin velocidad y caer de nariz
    if (b.va < -1.2 && b.va > -1.95 && b.s > 380) st.hammer = G.time;
    if (st.hammer && G.time - st.hammer < 2 && b.s < 260 && Math.sin(b.a) > 0.85) { award(G, b, 'martillo'); st.hammer = 0; }
    // rasante
    if (b.rasante) { st.rasT += dt; if (st.rasT > 0.8 && st.rasT - dt <= 0.8) award(G, b, 'rasante'); } else st.rasT = 0;
    // rebufo
    if (b.drafting) { st.draftT += dt; if (st.draftT > 0.9 && st.draftT - dt <= 0.9) award(G, b, 'rebufo'); } else st.draftT = 0;
    // cohete: subir en vertical con turbo a toda máquina
    if (b.boosting && b.vy < -420 && Math.sin(b.a) < -0.9) { st.hoverT = (st.hoverT || 0) + dt; if (st.hoverT > 0.7 && st.hoverT - dt <= 0.7) award(G, b, 'flotar'); } else st.hoverT = 0;
    // al límite: pasar rapidísimo a un pelo de una copa o del suelo
    if (b.s > 650 && !b.stun) {
      let near = false;
      for (const P of W.palms) { const C = P.crown; if (C.gone) continue; const d = Math.hypot(b.x - C.x, b.y - C.y) - C.r * 0.55 - b.r; if (d > 0 && d < 22) near = true; }
      if (W.buildings) for (const B of W.buildings) { const d = Math.max(B.x0 - b.x, b.x - B.x1, B.top - b.y, b.y - B.bottom) - b.r; if (d > 0 && d < 20) near = true; }
      if (near) award(G, b, 'limite');
    }
    // Medellín: por debajo del viaducto, entre dos edificios por debajo de sus azoteas, o rozando una cabina
    const V = W.viaduct;
    // (antes esto solo corría donde hay metro: en Bogotá no salían el callejón ni la torre)
    if (W.buildings && b.s > 380 && !b.perch) {
      if (V && b.x > V.x0 && b.x < V.x1 && b.y > V.top + V.h && b.y < W.groundY(b.x)) { st.metroT = (st.metroT || 0) + dt; if (st.metroT > 0.35 && st.metroT - dt <= 0.35) award(G, b, 'metro'); } else st.metroT = 0;
      let lane = false;
      for (let i = 0; i + 1 < W.buildings.length; i++) { const A = W.buildings[i], B = W.buildings[i + 1]; if (b.x > A.x1 && b.x < B.x0 && B.x0 - A.x1 < 260 && b.y > Math.max(A.top, B.top) + 30 && b.y < Math.min(A.bottom, B.bottom)) lane = true; }
      if (lane) { st.laneT = (st.laneT || 0) + dt; if (st.laneT > 0.25 && st.laneT - dt <= 0.25) award(G, b, 'callejon'); } else st.laneT = 0;
      let under = null;
      for (const B of W.buildings) if (b.x > B.x0 && b.x < B.x1 && b.y > B.bottom && b.y < B.ground) under = B;
      if (under) { st.underT = (st.underT || 0) + dt; if (st.underT > 0.12 && st.underT - dt <= 0.12) award(G, b, under.style === 'clock' ? 'reloj' : 'torre'); } else st.underT = 0;
      if (W.cable && b.s > 450) for (let i = 0; i < W.cable.n; i++) { const c = World.cabin(W, i), d = Math.max(Math.abs(b.x - c.x) - c.w / 2, Math.abs(b.y - c.y) - c.h / 2) - b.r; if (d > 0 && d < 24) award(G, b, 'cabina'); }
    }
  }
  // eventos que también cuentan
  function event(G, e) {
    if (e.type === 'hit' && e.from >= 0 && !e.shield) {
      const a = G.birds[e.from];
      if (a && Math.abs(a.mis) > 1.45) award(G, a, 'espaldas');
    } else if (e.type === 'nearMiss') {
      award(G, e.b, e.b.evadeT > 0 ? 'tonel' : 'pelo');
    } else if (e.type === 'sonic') {
      award(G, e.b, 'sonico');
    } else if (e.type === 'missileDown') {
      const a = G.birds[e.by]; if (a) award(G, a, 'misil');
    } else if (e.type === 'ballDown') {
      const a = G.birds[e.by]; if (a) award(G, a, 'artillero');
    } else if (e.type === 'land' && (e.kind === 'cofa' || e.kind === 'deck')) {
      award(G, e.b, e.kind === 'cofa' ? 'vigia' : 'abordaje');
    }
  }
  return { step, event, award, TRICKS };
})();
