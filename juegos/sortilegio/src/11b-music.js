/* =========================================================================
   MÚSICA — bambuco andino sintetizado en 6/8, en Mi menor (Em–D–C–B7):
   tiple rasgueado, bajo y bombo legüero, guacharaca y una quena que canta.
   Capas por intensidad: 0 menú (tiple suave y colchón), 1 pelea (bombo y
   guacharaca), 2 pelea cerrada (quena), 3 ronda decisiva o Gran Sortilegio.
   ========================================================================= */
const Music = (() => {
  let ac = null, out = null, on = Store.get('music', true), level = 0, want = 0, timer = null, next = 0, step = 0, noiseBuf = null, padNodes = null;
  let E8 = 0.19; // duración de una corchea
  // estilos por escenario: bambuco (páramo y menú), cumbia (ríos), tambores de volcán, currulao de marimba (Ciudad Perdida)
  const STY = {
    bambuco: { e8: 0.19, n: 6 },
    volcan: { e8: 0.165, n: 6, tr: -2, heavy: true, CH: [[62, 65, 69, 74], [58, 62, 65, 70], [60, 64, 67, 72], [61, 64, 69, 73]], BASS: [38, 34, 36, 33] },
    currulao: { e8: 0.17, n: 6, tr: 3, marimba: true, CH: [[67, 70, 74, 79], [65, 69, 72, 77], [63, 67, 70, 75], [62, 66, 69, 74]], BASS: [43, 41, 39, 38] },
    cumbia: { e8: 0.27, n: 8, CH: [[57, 60, 64, 69], [55, 59, 62, 67], [53, 57, 60, 65], [52, 56, 59, 64]], BASS: [45, 43, 41, 40] },
  };
  const MELC = [[[0, 69, 2], [2, 72, 1], [3, 74, 1], [4, 76, 2], [6, 74, 2]], [[0, 72, 2], [2, 71, 1], [3, 67, 1], [4, 71, 4]], [[0, 69, 1], [1, 72, 1], [2, 74, 2], [4, 72, 2], [6, 69, 2]], [[0, 68, 4], [4, 71, 2], [6, 76, 2]], [[0, 76, 2], [2, 74, 1], [3, 72, 1], [4, 74, 2], [6, 72, 2]], [[0, 71, 2], [2, 67, 2], [4, 71, 2], [6, 74, 2]], [[0, 72, 1], [1, 71, 1], [2, 69, 2], [4, 65, 2], [6, 69, 2]], [[0, 68, 2], [2, 71, 2], [4, 69, 4]]];
  let sty = 'bambuco', wantSty = 'bambuco';
  function tom(t, f, vol) { const o = ac.createOscillator(); o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.15); const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.22); nz(t, f * 6, 1.5, 0.03, vol * 0.3, 'bandpass'); }
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const CH = [[64, 67, 71, 76], [62, 66, 69, 74], [64, 67, 72, 76], [63, 66, 69, 71]];
  const BASS = [40, 38, 36, 35];
  const MEL = [
    [[0, 71, 2], [2, 69, 1], [3, 67, 2], [5, 64, 1]], [[0, 66, 3], [3, 69, 2], [5, 74, 1]], [[0, 76, 2], [2, 74, 1], [3, 72, 2], [5, 71, 1]], [[0, 71, 3], [3, 69, 1], [4, 66, 1], [5, 63, 1]],
    [[0, 76, 1], [1, 74, 1], [2, 71, 1], [3, 67, 3]], [[0, 69, 2], [2, 66, 1], [3, 62, 3]], [[0, 67, 1], [1, 69, 1], [2, 71, 1], [3, 72, 1], [4, 71, 1], [5, 69, 1]], [[0, 71, 5], [5, 75, 1]],
  ];
  function start(a, master) {
    if (ac) return; ac = a; out = ac.createGain(); out.gain.value = on ? 0.42 : 0;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9000; out.connect(lp); lp.connect(master); out.lp = lp;
    const len = ac.sampleRate; noiseBuf = ac.createBuffer(1, len, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // colchón místico (dos sierras desafinadas con filtro que respira)
    const g = ac.createGain(); g.gain.value = 0.05; const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700; f.Q.value = 2;
    const lfo = ac.createOscillator(); lfo.frequency.value = 0.08; const lg = ac.createGain(); lg.gain.value = 300; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
    const os = [52, 59, 64].map((m, k) => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = (k - 1) * 9; o.connect(f); o.start(); return o; });
    f.connect(g); g.connect(out); padNodes = { os, g };
    next = ac.currentTime + 0.1; timer = setInterval(tick, 25);
  }
  function pluck(t, m, vol, dur = 0.35, bright = 2600) {
    for (const det of [-6, 6]) {
      const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = mtof(m); o.detune.value = det;
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(bright, t); f.frequency.exponentialRampToValueAtTime(500, t + dur);
      const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(f); f.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
    }
  }
  function bombo(t, vol) {
    const o = ac.createOscillator(); o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.25);
    const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.45);
    nz(t, 1800, 1, 0.05, vol * 0.25, 'bandpass');
  }
  function nz(t, freq, q, dur, vol, type) { const s = ac.createBufferSource(); s.buffer = noiseBuf; const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02); }
  function quena(t, m, len) {
    const dur = len * E8 * 0.95, o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = mtof(m + 12);
    const vib = ac.createOscillator(); vib.frequency.value = 5.5; const vg = ac.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(mtof(m + 12) * 0.012, t + Math.min(dur, 0.4)); vib.connect(vg); vg.connect(o.frequency);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.075, t + 0.04); g.gain.setValueAtTime(0.07, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05); vib.start(t); vib.stop(t + dur + 0.05);
    nz(t, mtof(m + 12) * 2, 3, Math.min(dur, 0.25), 0.02, 'bandpass');
  }
  function tick() {
    if (!ac) return;
    level += Math.sign(want - level) * (want !== level ? 1 : 0); // cambia en el siguiente paso
    while (next < ac.currentTime + 0.12) {
      if (step % STY[sty].n === 0 && wantSty !== sty) { sty = wantSty; step = 0; }
      const S = STY[sty]; E8 = S.e8;
      const bar = Math.floor(step / S.n), e = step % S.n, ch = bar % 4, t = next, L = level, C = S.CH || CH, Bs = S.BASS || BASS, tr = S.tr || 0;
      if (sty === 'cumbia') {
        // cumbia: acordes a contratiempo, bajo, bombo, llamador, guache y gaita
        if (e % 2 === 1) C[ch].forEach((m, k) => pluck(t + k * 0.008, m, (L === 0 ? 0.025 : 0.04), 0.16, 3000));
        if (L >= 1 && (e === 0 || e === 4 || e === 7)) pluck(t, Bs[ch] + (e === 4 ? 7 : e === 7 ? 12 : 0), 0.12, 0.35, 900);
        if (L >= 1 && (e === 0 || e === 4)) bombo(t, 0.26);
        if (L >= 1 && (e === 2 || e === 6)) tom(t, 210, 0.16);
        if (L >= 1) { nz(t, 6500, 1.2, 0.05, e % 2 ? 0.05 : 0.03, 'highpass'); nz(t + E8 / 2, 6500, 1.2, 0.04, 0.02, 'highpass'); }
        if (L >= 2 && (e === 3 || e === 5 || (e === 7 && bar % 2))) tom(t, 330, 0.12);
        if (L >= 2) { for (const [at, m, len] of MELC[bar % 8]) if (at === e) quena(t, m - 12, len); }
        step++; next += E8 * (L >= 3 ? 0.93 : 1); continue;
      }
      if (S.marimba) {
        // currulao: marimba que arpegia, cununos y guasá
        const arp = C[ch][[0, 2, 1, 3, 2, 1][e]]; pluck(t, arp + 12, L === 0 ? 0.03 : 0.05, 0.22, 5200); if (e === 0 || e === 3) pluck(t, C[ch][0], 0.035, 0.3, 4000);
      } else if (e === 0 || e === 2 || e === 3 || e === 5) {
        // tiple: rasgueo con acentos de bambuco
        const acc = e === 2 || e === 5 ? 1.25 : 0.8; C[ch].forEach((m, k) => pluck(t + k * 0.012, m, (L === 0 ? 0.03 : 0.045) * acc, 0.3, L >= 2 ? 3400 : 2400));
      }
      // bajo
      if (L >= 1 && (e === 0 || e === 3)) pluck(t, Bs[ch] + (e === 3 ? 7 : 0), 0.12, 0.45, 900);
      if (L >= 1 && (e === 0 || e === 3)) bombo(t, e === 0 ? 0.32 : 0.2);
      if (L >= 2 && e === 5) bombo(t, 0.12);
      if (S.heavy && L >= 1) { if (e === 1 || e === 4) tom(t, 90, 0.2); if (L >= 2 && e === 5) tom(t, 140, 0.16); }
      if (S.marimba && L >= 1 && (e === 2 || e === 5)) tom(t, 240, 0.12);
      // guacharaca
      if (L >= 1) nz(t, 7000, 1.2, 0.06, e === 0 || e === 3 ? 0.06 : 0.03, 'highpass');
      if (L >= 3) nz(t + E8 / 2, 7000, 1.2, 0.04, 0.025, 'highpass');
      // quena
      if (L >= 2) { const ph = MEL[bar % 8]; for (const [at, m, len] of ph) if (at === e) (S.marimba ? pluck(t, m + tr + 12, 0.06, 0.4, 6000) : quena(t, m + tr, len)); }
      else if (L === 0 && bar % 8 >= 4) { const ph = MEL[bar % 8]; for (const [at, m, len] of ph) if (at === e && len >= 2) pluck(t, m + tr + 12, 0.025, 0.6, 3000); }
      step++; next += E8 * (L >= 3 ? 0.92 : 1);
    }
  }
  function setLevel(n) { want = clamp(n, 0, 3); }
  function setStyle(theme) { wantSty = { rio: 'cumbia', cano: 'cumbia', volcan: 'volcan', ciudad: 'currulao', cielo: 'currulao', infierno: 'volcan' }[theme] || 'bambuco'; }
  function setOn(v) { on = !!v; Store.set('music', on); if (out) out.gain.value = on ? 0.42 : 0; }
  function duck(v) { if (out && out.lp) out.lp.frequency.setTargetAtTime(v ? 600 : 9000, ac.currentTime, 0.2); }
  return { start, setLevel, setStyle, setOn, duck, get on() { return on; } };
})();
