/* =========================================================================
   EVENTOS DE CADA ESCENARIO Y PRESAGIOS — lo que cambia la pelea:
   · Páramo: baja la neblina (solo se ve cerca de las luces; mira corta).
   · Río: tormenta (todos mojados, rayos con aviso) y la corriente arrastra.
   · Volcán: erupción (bombas de lava con círculo de aviso).
   · Ciudad Perdida: los guardianes de piedra despiertan y disparan.
   Presagios (al azar por ronda, se pueden apagar): luna llena, aguacero,
   eclipse, viento de páramo, hojarasca.
   ========================================================================= */
const PRESAGES = {
  luna: { name: 'Luna llena', text: 'El Embrujo se llena el doble' },
  aguacero: { name: 'Aguacero', text: 'Todo está mojado: los rayos pegan más' },
  eclipse: { name: 'Eclipse', text: 'Casi oscuro: solo alumbran los hechizos' },
  viento: { name: 'Viento de páramo', text: 'Todo se desliza hacia un lado' },
  hojarasca: { name: 'Hojarasca', text: 'El suelo seco arde con nada' },
};
const Events = (() => {
  function setup(G) {
    const A = G.A; G.ev = { t: 0, phase: 0, next: 18 + G.rng() * 6, on: false, left: 0, every: 0 };
    G.current = A.current || null; G.rain = false; G.mist = 0; G.eclipse = false; G.wind = null; G.dry = 1; G.embMul = 1;
    G.statues = (A.statues || []).map(([x, y], k) => ({ x, y, k, awake: 0, cd: 1 + k, glow: 0 }));
    // presagio
    G.presage = null;
    if (G.usePresage) {
      const keys = Object.keys(PRESAGES), k = keys[G.rng.int(keys.length)]; G.presage = k;
      if (k === 'luna') G.embMul = 2;
      if (k === 'aguacero') G.rain = true;
      if (k === 'eclipse') G.eclipse = true;
      if (k === 'viento') { const a = G.rng() * TAU; G.wind = { x: Math.cos(a), y: Math.sin(a) * 0.6 }; }
      if (k === 'hojarasca') G.dry = 3.2;
    }
  }
  // MAREA (Itsukushima): la orilla se inunda poco a poco (hasta dos celdas tierra adentro) y el agua baja se vuelve honda
  function tideStart(G) {
    const T = G.T, B = T.base0 || T.base, A = G.A;
    if (!A.tideCells) { const d = new Uint8Array(T.n).fill(9), q = []; for (let i = 0; i < T.n; i++) if (B[i] === TT.SHALLOW || B[i] === TT.DEEP) { d[i] = 0; q.push(i); }
      for (let h = 0; h < q.length; h++) { const i = q[h], c = i % T.cols, r = (i / T.cols) | 0; for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const c2 = c + dc, r2 = r + dr; if (c2 < 0 || r2 < 0 || c2 >= T.cols || r2 >= T.rows) continue; const j = r2 * T.cols + c2; if (d[j] <= d[i] + 1) continue; if (B[j] !== TT.GRASS && B[j] !== TT.DIRT) continue; d[j] = d[i] + 1; if (d[j] < 2) q.push(j); } }
      A.tideCells = []; for (let i = 0; i < T.n; i++) if ((d[i] >= 1 && d[i] <= 2) || B[i] === TT.SHALLOW) A.tideCells.push(i, d[i]); }
    G.tide = { f: 0 };
  }
  function tideStep(G, dt, left) {
    const T = G.T, B = T.base0 || T.base, L = G.A.tideCells; G.tide.f = left > 2.5 ? Math.min(1, G.tide.f + dt / 2.5) : Math.max(0, left / 2.5);
    const f = G.tide.f; let ch = false;
    for (let k = 0; k < L.length; k += 2) { const i = L[k], d = L[k + 1], want = B[i] === TT.SHALLOW ? (f > 0.55 ? TT.DEEP : TT.SHALLOW) : f * 2.2 >= d ? TT.SHALLOW : B[i];
      if (T.base[i] !== want && (T.base[i] === B[i] || T.base[i] === TT.SHALLOW || T.base[i] === TT.DEEP)) { T.base[i] = want; if (want !== B[i]) { T.fire[i] = 0; T.leaf[i] = 0; T.snow[i] = 0; } ch = true; } }
    if (ch) T.ver++;
  }
  function tideEnd(G) { const T = G.T, B = T.base0 || T.base, L = G.A.tideCells || []; for (let k = 0; k < L.length; k += 2) { const i = L[k]; if (T.base[i] === TT.SHALLOW || T.base[i] === TT.DEEP) T.base[i] = B[i]; } if (G.sea) for (const p of G.sea.panels) Seasons.repaint && Seasons.repaint(G, p); T.ver++; G.tide = null; }
  function update(G, dt) {
    if (G.state !== 'play') return;
    const E = G.ev, A = G.A; E.t += dt;
    if (G.presage === 'aguacero') { for (const m of G.mages) if (m.alive) m.soak(G, 0.5); if (G.frame % 20 === 0) for (let k = 0; k < 3; k++) Terrain.wet(G, G.rng.int(G.T.n), 6); }
    if (!A.event) return;
    if (!E.on) { E.next -= dt; if (E.next <= 0) { E.on = true; E.left = A.event === 'eruption' ? 9 : A.event === 'guardians' || A.event === 'flood' || A.event === 'tide' ? 10 : 12; if (A.event === 'tide') tideStart(G); E.every = 0.5; G.events.push({ type: 'arenaEvent', ev: A.event }); } }
    else {
      E.left -= dt; E.every -= dt;
      if (A.event === 'mist') G.mist = Math.min(1, G.mist + dt);
      if (A.event === 'storm') {
        G.rain = true; for (const m of G.mages) if (m.alive) m.soak(G, 0.5);
        if (E.every <= 0) { E.every = 1.4 + G.rng() * 1.2; const tgt = G.rng() < 0.5 ? G.mages[G.rng.int(G.mages.length)] : null; const x = tgt ? tgt.x + (G.rng() - 0.5) * 160 : 80 + G.rng() * (G.T.W - 160), y = tgt ? tgt.y + (G.rng() - 0.5) * 120 : 80 + G.rng() * (G.T.H - 160); G.spells.push({ t: 'strike', id: -1, age: 0, S: { delay: 1.1 }, by: -1, team: -1, el: 'bolt', x, y, delay: 1.1, r: 52, dmg: 12, stun: 0.35, power: 1, size: 1 }); }
      }
      if (A.event === 'eruption' && E.every <= 0) {
        E.every = 0.9 + G.rng() * 0.8; const tgt = G.rng() < 0.45 ? G.mages[G.rng.int(G.mages.length)] : null;
        const tx = clamp(tgt ? tgt.x + (G.rng() - 0.5) * 140 : 100 + G.rng() * (G.T.W - 200), 60, G.T.W - 60), ty = clamp(tgt ? tgt.y + (G.rng() - 0.5) * 110 : 100 + G.rng() * (G.T.H - 200), 60, G.T.H - 60);
        G.spells.push({ t: 'lob', kind: 'meteor', id: -2, age: 0, by: -1, team: -1, el: 'fire', x0: G.T.W / 2, y0: G.T.H / 2 - 20, x: G.T.W / 2, y: G.T.H / 2, z: 0, tx, ty, T: 1.5, tt: 0, power: 1, size: 0.75, S: { r: 64, dmg: 15, knock: 220, flight: 1.5, pool: { r: 40, life: 3, dps: 10 } } });
      }
      if (A.event === 'guardians') for (const s of G.statues) s.awake = 1;
      if (A.event === 'tide') tideStep(G, dt, E.left);
      // creciente: el agua sube y moja todo cerca del río; la corriente arrastra río abajo
      if (A.event === 'flood') {
        G.current = { x: 95, y: 90 };
        if (E.every <= 0) { E.every = 0.35; const T = G.T, band = 70 + Math.min(1, (10 - E.left) / 3) * 120; for (let k = 0; k < 26; k++) { const i = G.rng.int(T.n); if (Math.abs(A.riverD(Terrain.cx(T, i), Terrain.cy(T, i))) < band && !Terrain.solid(T, i)) Terrain.wet(G, i, 7); } for (const m of G.mages) if (m.alive && Math.abs(A.riverD(m.x, m.y)) < band) m.soak(G, 0.6); }
        for (const m of G.mages) if (m.alive && Math.abs(A.riverD(m.x, m.y)) < 62) { m.vx += 95 * dt * 2.2; m.vy += 90 * dt * 2.2; }
      }
      if (E.left <= 0) { E.on = false; E.next = 22 + G.rng() * 10; G.rain = G.presage === 'aguacero'; for (const s of G.statues) s.awake = 0; if (A.event === 'flood') G.current = A.current || null; if (A.event === 'tide') tideEnd(G); G.events.push({ type: 'arenaEventEnd', ev: A.event }); }
    }
    if (!E.on && G.mist > 0) G.mist = Math.max(0, G.mist - dt * 0.6);
    // guardianes de piedra: disparan una piedra lenta al mago más cercano
    for (const s of G.statues) {
      s.glow += ((s.awake ? 1 : 0) - s.glow) * Math.min(1, dt * 3);
      if (!s.awake) continue; s.cd -= dt; if (s.cd > 0) continue;
      let best = null, bd = 420; for (const m of G.mages) if (m.alive) { const d = hypot(m.x - s.x, m.y - s.y); if (d < bd) { bd = d; best = m; } }
      if (!best) { s.cd = 0.4; continue; }
      s.cd = 2.2; const a = Math.atan2(best.y - s.y + 10, best.x - s.x), S = SPELLS.earth[0];
      G.spells.push({ t: 'proj', id: -3 - s.k, age: 0, S, by: -1, team: -1, el: 'earth', x: s.x + Math.cos(a) * 34, y: s.y + Math.sin(a) * 34, vx: Math.cos(a) * 380, vy: Math.sin(a) * 380, r: 16, life: 1.4, dmg: 11, bounce: 0, heavy: true, power: 1, size: 1 });
      G.events.push({ type: 'statueShot', x: s.x, y: s.y });
    }
  }
  return { setup, update };
})();
