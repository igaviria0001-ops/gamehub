/* =========================================================================
   MÚSICA — sintetizada y por estilo de pista (sin archivos). Secuenciador con
   adelanto: bajo, acordes, melodía, percusión. Guatapé = cumbia (guacharaca,
   tambora, acordeón); menú = groove tranquilo; Venecia = tarantela en 6/8.
   ========================================================================= */
const Music = (() => {
  const N = m => 440 * Math.pow(2, (m - 69) / 12);
  // acordes como listas de notas MIDI (raíz primero)
  const STYLES = {
    menu: { bpm: 92, spb: 4, bpb: 4, chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], kick: 'x...x.....x.x...', snare: '....x.......x...', hat: '..x...x...x...x.', scrape: '', bass: 'x..x..x...x..x..', lead: 'saw', leadDen: 0.18, chordPat: '..x...x...x...x.', pad: true, vol: 0.8 },
    guatape: { bpm: 100, spb: 4, bpb: 4, chords: [[57, 60, 64], [52, 56, 59, 62], [57, 60, 64], [50, 53, 57]], kick: 'x.......x.......', snare: '....x.......x...', hat: '', scrape: 'x.xxx.xxx.xxx.xx', bass: 'x...x.x.x...x.x.', lead: 'acc', leadDen: 0.55, chordPat: '..x...x...x...x.', pad: false, vol: 1 },
    tokio: { bpm: 118, spb: 4, bpb: 4, chords: [[57, 60, 64, 67], [53, 57, 60, 64], [50, 53, 57, 60], [52, 56, 59, 62]], kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', scrape: '', bass: 'x.xx..x.x.xx..x.', lead: 'saw', leadDen: 0.5, chordPat: 'x..x..x...x..x..', pad: true, vol: 0.85 },
    halong: { bpm: 96, spb: 4, bpb: 4, chords: [[50, 55, 57, 62], [48, 52, 55, 60], [45, 50, 52, 57], [47, 50, 55, 59]], kick: 'x.......x.......', snare: '..........x.....', hat: '', scrape: 'x...x...x...x.x.', bass: 'x.....x...x.....', lead: 'mando', leadDen: 0.4, chordPat: '....x.......x...', pad: true, vol: 0.85 },
    canon: { bpm: 124, spb: 3, bpb: 4, chords: [[52, 56, 59], [57, 61, 64], [59, 63, 66], [52, 56, 59]], kick: 'x.....x.....', snare: '...x.....x..', hat: 'x.xx.xx.xx.x', scrape: '', bass: 'x..x..x..x..', lead: 'mando', leadDen: 0.5, chordPat: '..x..x..x..x', pad: false, vol: 0.9 },
    venecia: { bpm: 132, spb: 3, bpb: 2, chords: [[50, 53, 57], [45, 49, 52, 55], [50, 53, 57], [43, 46, 50]], kick: 'x..x..', snare: '...x..', hat: '.xx.xx', scrape: '', bass: 'x..x..', lead: 'mando', leadDen: 0.7, chordPat: '.xx.xx', pad: false, vol: 0.9 },
    islandia: { bpm: 88, spb: 4, bpb: 4, chords: [[50, 53, 57, 60], [46, 50, 53, 57], [43, 46, 50, 55], [45, 48, 52, 57]], kick: 'x.......x..x....', snare: '........x.......', hat: '..x...x...x...x.', scrape: '', bass: 'x.......x.......', lead: 'flute', leadDen: 0.35, chordPat: 'x...............', pad: true, vol: 0.85 },
    amazonas: { bpm: 108, spb: 4, bpb: 4, chords: [[52, 55, 59], [50, 53, 57], [48, 52, 55], [47, 50, 55]], kick: 'x..x..x...x..x..', snare: '....x.......x...', hat: '', scrape: 'x.x.xx.xx.x.xx.x', bass: 'x..x..x...x.x...', lead: 'flute', leadDen: 0.5, chordPat: '..x...x...x...x.', pad: true, vol: 0.9 },
    santorini: { bpm: 126, spb: 4, bpb: 4, chords: [[50, 53, 57], [55, 58, 62], [50, 53, 57], [45, 49, 52, 55]], kick: 'x...x...x...x...', snare: '..x...x...x...x.', hat: '', scrape: '', bass: 'x.x.x.x.x.x.x.x.', lead: 'mando', leadDen: 0.65, chordPat: '.x.x.x.x.x.x.x.x', pad: false, vol: 0.9 },
    egipto: { bpm: 112, spb: 4, bpb: 4, chords: [[50, 51, 54, 57], [50, 53, 57], [49, 52, 56], [50, 51, 54, 57]], kick: 'x...x..x..x.x...', snare: '....x.......x...', hat: '', scrape: 'x.xx.x.xx.x.x.xx', bass: 'x..x..x.x..x..x.', lead: 'acc', leadDen: 0.5, chordPat: '..x...x...x...x.', pad: true, vol: 0.9 },
    dorado: { bpm: 118, spb: 4, bpb: 4, chords: [[50, 53, 57], [46, 50, 53, 58], [48, 52, 55], [45, 49, 52, 57]], kick: 'x..x..x.x...x...', snare: '....x.......x..x', hat: 'x.x.x.x.x.x.x.x.', scrape: 'x..x..x.', bass: 'x.xx..x.x.x...x.', lead: 'flute', leadDen: 0.6, chordPat: 'x...x...x...x...', pad: true, vol: 0.95 },
    // jefes: persecución con ritmo de tren, saloma pirata en 6/8 y epopeya andina
    boss_tren: { bpm: 142, spb: 4, bpb: 4, chords: [[52, 55, 59], [48, 52, 55], [50, 54, 57], [47, 51, 54]], kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.xxx.xxx.xxx.xx', scrape: '', bass: 'x.x.x.x.x.x.x.x.', lead: 'mando', leadDen: 0.6, chordPat: 'x..x..x.x..x..x.', pad: true, vol: 0.95 },
    boss_galeon: { bpm: 152, spb: 3, bpb: 2, chords: [[50, 53, 57], [55, 58, 62], [45, 49, 52], [50, 53, 57]], kick: 'x..x..', snare: '...x..', hat: 'xxxxxx', scrape: '', bass: 'x..x..', lead: 'acc', leadDen: 0.75, chordPat: '.xx.xx', pad: true, vol: 0.95 },
    boss_condor: { bpm: 134, spb: 4, bpb: 4, chords: [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 56, 59]], kick: 'x..x..x.x..x..x.', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', scrape: 'x..x..x.', bass: 'x..x..x.x..x..x.', lead: 'flute', leadDen: 0.65, chordPat: 'x...x...x...x...', pad: true, vol: 0.95 },
    // arenas: marcha de gladiadores, huayno del altiplano, champeta del Caribe
    coliseo: { bpm: 116, spb: 4, bpb: 4, chords: [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]], kick: 'x...x...x...x...', snare: '..x...x.x.x...xx', hat: '', scrape: '', bass: 'x.x.x.x.x.x.x.x.', lead: 'saw', leadDen: 0.45, chordPat: 'x.......x.......', pad: true, vol: 0.9 },
    uyuni: { bpm: 110, spb: 4, bpb: 4, chords: [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 55, 59]], kick: 'x..x....x..x....', snare: '....x.......x...', hat: '..x...x...x...x.', scrape: '', bass: 'x..x....x..x....', lead: 'flute', leadDen: 0.55, chordPat: 'x.x.x.x.x.x.x.x.', pad: true, vol: 0.85 },
    totumo: { bpm: 104, spb: 4, bpb: 4, chords: [[52, 55, 59], [57, 60, 64], [50, 54, 57], [55, 59, 62]], kick: 'x..x..x.x..x..x.', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', scrape: 'x..x..x.', bass: 'x..x..x.x..x..x.', lead: 'mando', leadDen: 0.6, chordPat: '.x.x.x.x.x.x.x.x', pad: false, vol: 0.9 },
  };
  let st = null, timer = null, step = 0, nextT = 0, bar = 0, melody = [], cur = null, bus = null;
  function voice(t, f, dur, type, vol, o = {}) {
    const ac = Sound.ctx, g = ac.createGain(), os = ac.createOscillator(); os.type = type; os.frequency.setValueAtTime(f, t);
    if (o.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 5.5; lg.gain.value = f * 0.008; l.connect(lg); lg.connect(os.frequency); l.start(t); l.stop(t + dur + 0.1); }
    let out = os; if (o.lp) { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; os.connect(fl); out = fl; }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + (o.att || 0.01)); g.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol * (o.sus || 0.3)), t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    out.connect(g); g.connect(bus); os.start(t); os.stop(t + dur + 0.05);
  }
  function hit(t, kind, vol) {
    const ac = Sound.ctx;
    if (kind === 'kick') { const g = ac.createGain(), o = ac.createOscillator(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.25); return; }
    const src = ac.createBufferSource(); src.buffer = Sound.noise; const f = ac.createBiquadFilter(), g = ac.createGain();
    const P = { snare: ['bandpass', 1800, 0.9, 0.16], hat: ['highpass', 7000, 0.7, 0.05], scrape: ['bandpass', 4200, 2.5, 0.07] }[kind];
    f.type = P[0]; f.frequency.value = P[1]; f.Q.value = P[2]; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + P[3]);
    src.connect(f); f.connect(g); g.connect(bus); src.start(t, Math.random()); src.stop(t + P[3] + 0.02);
  }
  // melodía: por compás, notas del acorde y de paso, con silencios (se repite cada 4 compases y varía un poco)
  function makeMelody(S) {
    const steps = S.spb * S.bpb, rng = makeRng(Math.floor(Math.random() * 1e6)); melody = [];
    for (let b = 0; b < 4; b++) { const ch = S.chords[b], row = []; for (let k = 0; k < steps; k++) { const on = rng() < S.leadDen && (k % 2 === 0 || rng() < 0.35); row.push(on ? ch[Math.floor(rng() * ch.length)] + 12 + (rng() < 0.25 ? 2 : 0) : null); } melody.push(row); }
  }
  function schedule() {
    const ac = Sound.ctx; if (!ac || !st) return; const S = st, spd = 60 / S.bpm / S.spb, steps = S.spb * S.bpb;
    while (nextT < ac.currentTime + 0.25) {
      const t = nextT, k = step % steps, b = Math.floor(step / steps) % 4, ch = S.chords[b], v = S.vol, P = (pat) => pat && pat[k % pat.length] === 'x';
      if (P(S.kick)) hit(t, 'kick', 0.5 * v); if (P(S.snare)) hit(t, 'snare', 0.22 * v); if (P(S.hat)) hit(t, 'hat', 0.08 * v); if (P(S.scrape)) hit(t, 'scrape', (k % 4 === 0 ? 0.11 : 0.06) * v);
      if (P(S.bass)) voice(t, N(ch[0] - 12 + (k % 8 === 6 ? 7 : 0)), spd * 2.2, 'triangle', 0.32 * v, { lp: 600, sus: 0.6 });
      if (P(S.chordPat)) for (const m of ch) voice(t, N(m), spd * 1.5, S.lead === 'mando' ? 'triangle' : 'square', 0.035 * v, { lp: 1800, sus: 0.2 });
      if (S.pad && k === 0) for (const m of ch) voice(t, N(m), spd * steps, 'sine', 0.05 * v, { att: 0.3, sus: 0.8 });
      const mn = melody[b] && melody[b][k];
      if (mn && bar >= 2) {
        if (S.lead === 'acc') { voice(t, N(mn), spd * 1.8, 'sawtooth', 0.05 * v, { lp: 2600, vib: true, sus: 0.7 }); voice(t, N(mn) * 1.005, spd * 1.8, 'square', 0.03 * v, { lp: 2000, sus: 0.7 }); }
        else if (S.lead === 'flute') { voice(t, N(mn + 12), spd * 1.6, 'sine', 0.07 * v, { vib: true, sus: 0.6 }); voice(t, N(mn + 12) * 2, spd * 1.2, 'triangle', 0.012 * v, { sus: 0.4 }); }
        else if (S.lead === 'mando') { for (let r = 0; r < 3; r++) voice(t + r * spd / 3, N(mn), spd / 2.6, 'triangle', 0.07 * v, { sus: 0.1 }); }
        else voice(t, N(mn), spd * 2, 'sawtooth', 0.035 * v, { lp: 1400, vib: true, sus: 0.6 });
      }
      step++; nextT += spd; if (step % (steps * 4) === 0) { bar++; if (bar % 4 === 0) makeMelody(S); }
    }
  }
  function play(name) {
    const S = STYLES[name] || STYLES.menu; if (cur === name && timer) return; cur = name;
    stop(); if (!Sound.ctx) return; bus = Sound.musicBus(); st = S; step = 0; bar = 0; nextT = Sound.ctx.currentTime + 0.1; makeMelody(S);
    timer = setInterval(schedule, 60);
  }
  function stop() { if (timer) clearInterval(timer); timer = null; st = null; }
  // el contexto de audio nace con el primer toque: reintentar la pista pendiente
  addEventListener('pointerdown', () => { if (cur && !timer) { const c = cur; cur = null; setTimeout(() => play(c), 50); } });
  return { play, stop, STYLES };
})();
