/* =========================================================================
   MÚSICA DE ACCIÓN — cumbia electrónica sintetizada que sube con la pelea.
   Todo se programa con anticipación sobre el reloj de audio (sin cortes).
   Compás de 16 semicorcheas, 4 compases en La menor: Am – G – F – E
   (la cadencia andaluza que tanto usa la cumbia).
   Capas por intensidad:
     0  título/menús: marimba con el tema, colchón suave y guacharaca.
     1  ronda en juego: bombo, guacharaca, redoblante y bajo de tumbao.
     2  pelea cerca o misil en el aire: acordeón sintético con el tema y
        golpes de metales en contratiempo.
     3  ronda decisiva, modo leyenda o alguien a punto de caer: platillos,
        semicorcheas, metales más densos y redobles de toms.
   Pausa: el sonido se apaga detrás de un filtro, como escuchado de lejos.
   Cada escenario tiene su sabor (cambia al empezar la vuelta de 4 compases):
     Cocora: gaita (flauta de millo) y marimba, un tono más arriba.
     Medellín: acordeón y metales (cumbia electrónica).
     Bogotá: más oscura, sintetizador grave y más toms, un tono más abajo.
     Cartagena: guitarra champetera picada y campana, tres semitonos arriba.
   ========================================================================= */
const Music = (() => {
  const BPM = 108, STEP = 60 / BPM / 4;
  let A = null, out = null, filt = null, on = Store.get('music', true), timer = null, next = 0, step = 0;
  let level = 0, want = 0, hidden = false, paused = false, lastWantT = 0, sty = 'medellin', wantSty = 'medellin';
  const TRANS = { cocora: 2, medellin: 0, bogota: -2, cartagena: 3, capadocia: 0 };
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  // acordes (notas MIDI) y bajos por compás
  const CHORDS = [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 56, 59]];
  const ROOT = [45, 43, 41, 40], FIFTH = [52, 50, 48, 47];
  // el tema: [paso, nota] por compás
  const RIFF = [
    [[0, 76], [2, 72], [3, 74], [4, 76], [6, 69], [8, 72], [10, 71], [11, 72], [12, 76], [14, 74]],
    [[0, 74], [2, 71], [3, 72], [4, 74], [6, 67], [8, 71], [10, 69], [11, 71], [12, 74], [14, 72]],
    [[0, 72], [2, 69], [3, 71], [4, 72], [6, 65], [8, 69], [10, 67], [11, 69], [12, 72], [14, 71]],
    [[0, 71], [2, 68], [3, 69], [4, 71], [6, 64], [8, 68], [10, 71], [12, 76], [13, 74], [14, 72], [15, 71]],
  ];
  // respuesta (segunda vuelta del tema, más aguda y sincopada)
  const RIFF2 = [
    [[0, 81], [3, 79], [6, 76], [8, 81], [10, 79], [11, 81], [12, 83], [14, 84]],
    [[0, 83], [3, 79], [6, 74], [8, 79], [10, 77], [11, 79], [12, 81], [14, 83]],
    [[0, 81], [3, 77], [6, 72], [8, 77], [10, 76], [11, 77], [12, 79], [14, 81]],
    [[0, 80], [3, 76], [6, 71], [8, 76], [10, 80], [12, 83], [13, 81], [14, 80], [15, 76]],
  ];

  function ensure() {
    if (A) return true;
    const s = Sound.audio(); if (!s) return false;
    A = s;
    filt = A.ac.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 18000; filt.Q.value = 0.5;
    out = A.ac.createGain(); out.gain.value = on ? 0.34 : 0;
    out.connect(filt); filt.connect(A.master);
    return true;
  }
  function start() {
    if (!ensure() || timer) return;
    next = A.ac.currentTime + 0.1; step = 0;
    timer = setInterval(tick, 25);
  }
  function tick() {
    if (!A || hidden) return;
    const now = A.ac.currentTime;
    if (next < now - 0.05) next = now + 0.05; // vuelve de una pausa larga sin amontonar notas
    while (next < now + 0.14) { schedule(step, next); next += STEP; step = (step + 1) % 128; }
  }

  /* ---------- instrumentos ---------- */
  function env(g, t, a, peak, d, end = 0.0001) {
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(end, t + a + d);
  }
  function osc(type, f, t, dur, vol, dest, detune = 0) {
    const o = A.ac.createOscillator(), g = A.ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune;
    env(g, t, 0.005, vol, dur); o.connect(g); g.connect(dest || out); o.start(t); o.stop(t + dur + 0.05); return o;
  }
  function noise(t, dur, vol, type, freq, q = 1) {
    const s = A.ac.createBufferSource(); s.buffer = A.noiseBuf;
    const f = A.ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = A.ac.createGain(); env(g, t, 0.003, vol, dur);
    s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  }
  function kick(t, v = 1) {
    const o = A.ac.createOscillator(), g = A.ac.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
    env(g, t, 0.002, 0.9 * v, 0.22); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.3);
    noise(t, 0.012, 0.25 * v, 'highpass', 3000);
  }
  function snare(t, v = 1) { noise(t, 0.13, 0.32 * v, 'bandpass', 1900, 0.8); osc('triangle', 220, t, 0.08, 0.18 * v); }
  function rim(t, v = 1) { osc('square', 1650, t, 0.025, 0.06 * v); noise(t, 0.02, 0.1 * v, 'highpass', 4000); }
  function guacharaca(t, long, v = 1) { noise(t, long ? 0.1 : 0.035, (long ? 0.13 : 0.08) * v, 'highpass', long ? 5200 : 6800, 0.7); }
  function hat(t, v = 1) { noise(t, 0.025, 0.07 * v, 'highpass', 9000); }
  function crash(t) { noise(t, 1.4, 0.16, 'highpass', 6000, 0.5); }
  function tom(t, f) { const o = A.ac.createOscillator(), g = A.ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.18); env(g, t, 0.003, 0.4, 0.22); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.3); }
  function bass(t, m, dur = 0.2) {
    const f = mf(m), lp = A.ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(240, t + dur); lp.connect(out);
    osc('sawtooth', f, t, dur, 0.22, lp); osc('sine', f, t, dur + 0.05, 0.3);
  }
  function marimba(t, m, v = 1) { osc('sine', mf(m), t, 0.4, 0.26 * v); osc('sine', mf(m) * 4, t, 0.07, 0.06 * v); osc('triangle', mf(m) * 2, t, 0.12, 0.05 * v); }
  function accordion(t, m, dur, v = 1) {
    const f = mf(m), bp = A.ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 0.6; bp.connect(out);
    const lfo = A.ac.createOscillator(), lg = A.ac.createGain(); lfo.frequency.value = 6.2; lg.gain.value = 6; lfo.connect(lg);
    const a = osc('square', f, t, dur, 0.06 * v, bp, -7), b = osc('sawtooth', f, t, dur, 0.06 * v, bp, 7);
    lg.connect(a.detune); lg.connect(b.detune); lfo.start(t); lfo.stop(t + dur + 0.05);
  }
  function brass(t, notes, dur = 0.16, v = 1) {
    const lp = A.ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2;
    lp.frequency.setValueAtTime(500, t); lp.frequency.exponentialRampToValueAtTime(2800, t + 0.04); lp.frequency.exponentialRampToValueAtTime(700, t + dur);
    lp.connect(out);
    notes.forEach((m, i) => { osc('sawtooth', mf(m), t, dur, 0.07 * v, lp, (i - 1) * 6); });
  }
  // gaita: soplo con vibrato
  function gaita(t, m, dur, v = 1) {
    const f = mf(m), o = A.ac.createOscillator(), g = A.ac.createGain(), lfo = A.ac.createOscillator(), lg = A.ac.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(f, t); lfo.frequency.value = 5.4; lg.gain.value = 9; lfo.connect(lg); lg.connect(o.detune);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09 * v, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05); lfo.start(t); lfo.stop(t + dur + 0.05);
    noise(t, Math.min(0.08, dur), 0.03 * v, 'bandpass', f * 2, 3);
  }
  // guitarra champetera: picada corta y brillante
  function pluck(t, m, v = 1) { osc('triangle', mf(m), t, 0.16, 0.12 * v); osc('square', mf(m) * 2, t, 0.05, 0.025 * v); }
  // sintetizador oscuro (Bogotá)
  function synth(t, m, dur, v = 1) {
    const lp = A.ac.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 6; lp.frequency.setValueAtTime(2400, t); lp.frequency.exponentialRampToValueAtTime(500, t + dur); lp.connect(out);
    osc('sawtooth', mf(m - 12), t, dur, 0.07 * v, lp, -9); osc('square', mf(m - 12), t, dur, 0.05 * v, lp, 9);
  }
  // Capadocia: saz (cuerda pulsada con un ligado al entrar), ney (flauta soplada) y darbuka (dum y tek)
  function saz(t, m, v = 1) {
    const f = mf(m), o = A.ac.createOscillator(), g = A.ac.createGain(), lp = A.ac.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 0.97, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.035);
    lp.type = 'lowpass'; lp.Q.value = 3; lp.frequency.setValueAtTime(3600, t); lp.frequency.exponentialRampToValueAtTime(650, t + 0.3);
    env(g, t, 0.003, 0.085 * v, 0.32); o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + 0.4);
    osc('triangle', f * 2, t, 0.07, 0.03 * v);
  }
  function ney(t, m, dur, v = 1) {
    const f = mf(m), o = A.ac.createOscillator(), g = A.ac.createGain(), lfo = A.ac.createOscillator(), lg = A.ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f * 0.985, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.08);
    lfo.frequency.value = 4.6; lg.gain.value = 12; lfo.connect(lg); lg.connect(o.detune);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.1 * v, t + 0.07); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05); lfo.start(t); lfo.stop(t + dur + 0.05);
    noise(t, Math.min(0.16, dur), 0.035 * v, 'bandpass', f * 1.5, 2);
  }
  function dum(t, v = 1) { const o = A.ac.createOscillator(), g = A.ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.16); env(g, t, 0.002, 0.55 * v, 0.24); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.3); }
  function tek(t, v = 1) { noise(t, 0.035, 0.13 * v, 'bandpass', 3400, 1.6); osc('triangle', 720, t, 0.025, 0.04 * v); }
  // la escala con aire de Anatolia: el sol natural sube a sol sostenido (menos en el compás de sol mayor)
  const hz = (m, bar) => (sty === 'capadocia' && bar !== 1 && ((m % 12) + 12) % 12 === 7 ? m + 1 : m);
  function cowbell(t, v = 1) { osc('square', 800, t, 0.06, 0.035 * v); osc('square', 540, t, 0.06, 0.03 * v); }
  function pad(t, chord, dur) {
    const lp = A.ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(out);
    chord.forEach(m => { const o = A.ac.createOscillator(), g = A.ac.createGain(); o.type = 'sawtooth'; o.frequency.value = mf(m); o.detune.value = (Math.random() - 0.5) * 14;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.045, t + 0.5); g.gain.setValueAtTime(0.045, t + dur - 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(lp); o.start(t); o.stop(t + dur + 0.05); });
  }

  /* ---------- el arreglo ---------- */
  function schedule(s, t) {
    const st = s & 15, bar = (s >> 4) & 3, loop = s >> 6;
    // la intensidad cambia al empezar el compás (sube de a una capa; baja de golpe)
    if (st === 0) { if (want > level) { level++; if (level >= 2 && bar === 0) crash(t); } else level = want; }
    if (st === 0 && (bar === 0 || sty !== wantSty)) sty = wantSty;
    const L = level, tr = TRANS[sty] || 0, ch = CHORDS[bar].map(m => m + tr);
    const ROOTb = ROOT[bar] + tr, FIFTHb = FIFTH[bar] + tr;
    if (st === 0) pad(t, ch, STEP * 16);
    if (sty === 'cartagena' && L >= 1 && st % 4 === 2) cowbell(t, L >= 2 ? 1 : 0.7);
    if (sty === 'cartagena' && L >= 1 && st % 2 === 1) pluck(t, ch[(st >> 1) % 3] + 24, 0.55);
    // guacharaca: rasguño largo en el tiempo, corto en la mitad (ch-ka ch-ka); en Capadocia, darbuka
    if (sty === 'capadocia') { if (st === 0 || st === 6 || (L >= 2 && st === 10)) dum(t, L === 0 ? 0.6 : 1); if (st === 3 || st === 4 || st === 8 || st === 12 || st === 14 || (L >= 2 && st % 2)) tek(t, st % 2 ? 0.5 : (L === 0 ? 0.6 : 1)); }
    else if (st % 2 === 0) guacharaca(t, st % 4 === 0, L === 0 ? 0.6 : 1);
    if (L === 0) {
      if (st === 0 || st === 8) bass(t, ROOTb, 0.3);
      if (st === 6 || st === 14) bass(t, FIFTHb, 0.14);
      for (const [p, m] of RIFF[bar]) if (p === st) { if (sty === 'cartagena') pluck(t, m + tr, 1.2); else if (sty === 'capadocia') saz(t, hz(m, bar) + tr - 12, 1); else marimba(t, m + tr - (sty === 'bogota' ? 12 : 0), 0.9); }
      return;
    }
    // bombo y redoblante
    if (st === 0 || st === 8 || (L >= 3 && (st === 4 || st === 12))) kick(t, st === 0 ? 1 : 0.85);
    if (st === 4 || st === 12) snare(t, L >= 2 ? 1 : 0.8);
    if (L >= 2 && (st === 6 || st === 14 || st === 15)) rim(t, st === 15 ? 0.6 : 1);
    if (L >= 3) hat(t, st % 2 ? 0.6 : 1);
    // bajo de tumbao: fundamental, quinta en el contratiempo, fundamental, quinta
    if (st === 0) bass(t, ROOTb);
    if (st === 6) bass(t, FIFTHb, 0.14);
    if (st === 8) bass(t, ROOTb + 12, 0.16);
    if (st === 12) bass(t, FIFTHb, 0.14);
    if (L >= 2 && st === 14) bass(t, ROOTb + 7, 0.1);
    // el tema (vuelta A y vuelta B) con el instrumento del escenario
    if (L >= 2) {
      const R = loop % 2 ? RIFF2 : RIFF, v = L >= 3 ? 1.1 : 0.9;
      for (const [p, m] of R[bar]) if (p === st) {
        const dur = STEP * (p === 14 || p === 15 ? 1.8 : 1.6), n = hz(m, bar) + tr;
        if (sty === 'capadocia') { ney(t, n, dur * 1.3, v * 0.95); saz(t, n - 12, v * 0.8); } else if (sty === 'cocora') gaita(t, n, dur * 1.2, v); else if (sty === 'bogota') synth(t, n, dur, v); else if (sty === 'cartagena') { pluck(t, n, v * 1.3); pluck(t + STEP * 0.5, n, v * 0.7); } else accordion(t, n, dur, v);
      }
      // metales en contratiempo (en Cocora, la marimba hace ese papel)
      const hits = L >= 3 ? [2, 6, 10, 14] : [10];
      if (hits.includes(st)) { if (sty === 'capadocia') ch.forEach(m => saz(t, m + 12, 0.5)); else if (sty === 'cocora') ch.forEach(m => marimba(t, m + 12, 0.45)); else brass(t, ch.map(m => m + 12), 0.14, (L >= 3 ? 1 : 0.8) * (sty === 'bogota' ? 0.7 : 1)); }
    } else {
      for (const [p, m] of RIFF[bar]) if (p === st && (p % 4 === 0)) { if (sty === 'cocora') gaita(t, m + tr, STEP * 2.5, 0.7); else if (sty === 'capadocia') ney(t, hz(m, bar) + tr, STEP * 3, 0.75); else marimba(t, m + tr, 0.7); }
      if (sty === 'capadocia' && st % 2 === 0) saz(t, ch[(st >> 1) % 3] + 12, 0.45);
      else if (st === 10 && sty !== 'cocora') brass(t, ch.map(m => m + 12), 0.12, 0.5);
    }
    // redoble de toms al final de la vuelta (en Bogotá también en la capa 2)
    if ((L >= 3 || (sty === 'bogota' && L >= 2)) && bar === 3 && st >= 12) tom(t, [210, 180, 150, 120][st - 12] * (sty === 'bogota' ? 0.8 : 1));
    if (sty === 'bogota' && L >= 2 && bar === 1 && st >= 13) tom(t, [160, 140, 120][st - 13]);
  }

  /* ---------- qué tan tensa está la cosa ---------- */
  function update(G) {
    if (!A || !timer) return;
    const now = A.ac.currentTime;
    if (G.world && TRANS[G.world.id] != null) wantSty = G.world.id;
    let w = 0;
    if (G.state === 'play' || G.state === 'countdown' || G.state === 'roundEnd') {
      w = 1;
      const [a, b] = G.birds;
      if (a && b && a.alive && b.alive) {
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 750 || G.missiles.length) w = 2;
        const decisive = G.mode === 'duel' && G.wins[0] === G.winsNeeded - 1 && G.wins[1] === G.winsNeeded - 1;
        if (a.legendT > 0 || b.legendT > 0 || (w === 2 && (decisive || Math.min(a.hp / a.sp.hp, b.hp / b.sp.hp) < 0.3))) w = 3;
      }
      if (G.state === 'countdown') w = 1;
      if (G.mode === 'boss' && G.boss && G.state !== 'countdown') w = G.boss.phase >= 3 || G.boss.dead ? 3 : 2;
      if (G.tm && G.state === 'play') w = Math.max(w, G.mode === 'relay' ? (G.roundT < 30 ? 3 : 2) : G.targets.some(t => t.alive && t.hostile) ? 3 : 2);
    }
    // no bajar por un instante de calma: la tensión se sostiene un par de segundos
    if (w >= want) { want = w; lastWantT = now; } else if (now - lastWantT > 2.5) want = w;
    const p = G.paused || (typeof UI !== 'undefined' && UI.current === 'pause');
    if (p !== paused) { paused = p; filt.frequency.setTargetAtTime(p ? 500 : 18000, now, 0.15); out.gain.setTargetAtTime(on ? (p ? 0.22 : 0.34) : 0, now, 0.15); }
  }
  function setOn(v) { on = !!v; Store.set('music', on); if (out && A) out.gain.setTargetAtTime(on ? 0.34 : 0, A.ac.currentTime, 0.1); }
  document.addEventListener('visibilitychange', () => {
    hidden = document.hidden;
    if (out && A) out.gain.setTargetAtTime(hidden || !on ? 0 : 0.34, A.ac.currentTime, 0.05);
  });
  return { start, update, setOn, get on() { return on; }, get level() { return level; }, get style() { return sty; } };
})();
