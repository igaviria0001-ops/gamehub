/* =========================================================================
   SONIDO — efectos sintetizados y música en seis estilos (Web Audio)
   ========================================================================= */
const Sound = (() => {
  let ac = null, master, comp, sfxBus, musicBus, noiseBuf;
  let musicOn = Store.get('music', true), sfxOn = Store.get('sfx', true);
  let tension = null, reel = null;

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { ac = new AC(); } catch (e) { ac = null; return; }
    master = ac.createGain(); master.gain.value = 0.85; master.connect(ac.destination);
    comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 12; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.2;
    comp.connect(master);
    sfxBus = ac.createGain(); sfxBus.gain.value = sfxOn ? 0.9 : 0; sfxBus.connect(comp);
    musicBus = ac.createGain(); musicBus.gain.value = musicOn ? 0.34 : 0; musicBus.connect(comp);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    setupLoops();
    Music.boot();
  }

  const now = () => (ac ? ac.currentTime : 0);

  function env(g, t, a, peak, dur, endLevel = 0.0001) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
    g.gain.exponentialRampToValueAtTime(endLevel, t + a + dur);
  }

  function tone({ type = 'sine', f0 = 440, f1 = null, dur = 0.15, vol = 0.2, at = 0, attack = 0.004, dest = null, detune = 0, curve = 'exp' }) {
    if (!ac) return;
    const t = now() + at;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.detune.value = detune;
    o.frequency.setValueAtTime(Math.max(f0, 1), t);
    if (f1 !== null) {
      if (curve === 'exp') o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
      else o.frequency.linearRampToValueAtTime(f1, t + dur);
    }
    env(g, t, attack, vol, dur);
    o.connect(g); g.connect(dest || sfxBus);
    o.start(t); o.stop(t + attack + dur + 0.05);
  }

  function noise({ dur = 0.1, vol = 0.2, at = 0, type = 'bandpass', f0 = 1200, f1 = null, q = 1, attack = 0.003, dest = null }) {
    if (!ac) return;
    const t = now() + at;
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = ac.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    if (f1 !== null) f.frequency.exponentialRampToValueAtTime(Math.max(f1, 20), t + dur);
    const g = ac.createGain();
    env(g, t, attack, vol, dur);
    s.connect(f); f.connect(g); g.connect(dest || sfxBus);
    s.start(t, Math.random() * 0.5); s.stop(t + attack + dur + 0.05);
  }

  /* Bucles continuos: el hilo cruje más agudo mientras más se estira; el carrete chirría al tirar/aflojar */
  function setupLoops() {
    const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 110;
    const o2 = ac.createOscillator(); o2.type = 'triangle'; o2.frequency.value = 111.5;
    const lfo = ac.createOscillator(); lfo.frequency.value = 17;
    const lfoG = ac.createGain(); lfoG.gain.value = 0;
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 4; bp.frequency.value = 600;
    const g = ac.createGain(); g.gain.value = 0;
    const trem = ac.createGain(); trem.gain.value = 1;
    lfo.connect(lfoG); lfoG.connect(trem.gain);
    o.connect(bp); o2.connect(bp); bp.connect(trem); trem.connect(g); g.connect(sfxBus);
    o.start(); o2.start(); lfo.start();
    tension = { o, o2, bp, g, lfoG };

    const ns = ac.createBufferSource(); ns.buffer = noiseBuf; ns.loop = true;
    const nf = ac.createBiquadFilter(); nf.type = 'bandpass'; nf.Q.value = 2.5; nf.frequency.value = 900;
    const am = ac.createOscillator(); am.frequency.value = 22; const amG = ac.createGain(); amG.gain.value = 0.5;
    const ng = ac.createGain(); ng.gain.value = 0; const ng2 = ac.createGain(); ng2.gain.value = 0.5;
    am.connect(amG); amG.connect(ng2.gain);
    ns.connect(nf); nf.connect(ng2); ng2.connect(ng); ng.connect(sfxBus);
    ns.start(); am.start();
    reel = { nf, g: ng, am };
  }

  function setTension(strain, active) {
    if (!ac || !tension) return;
    const t = now();
    const s = active ? clamp((strain - 1.02) / 0.4, 0, 1) : 0;
    tension.o.frequency.setTargetAtTime(95 + 420 * s, t, 0.05);
    tension.o2.frequency.setTargetAtTime(96.5 + 424 * s, t, 0.05);
    tension.bp.frequency.setTargetAtTime(500 + 2200 * s, t, 0.05);
    tension.g.gain.setTargetAtTime(s > 0.02 ? 0.03 + 0.11 * s : 0, t, 0.06);
    tension.lfoG.gain.setTargetAtTime(0.25 * s, t, 0.08);
  }
  function setReel(amount, up) {
    if (!ac || !reel) return;
    const t = now();
    reel.g.gain.setTargetAtTime(amount > 0 ? 0.07 * amount : 0, t, 0.04);
    reel.nf.frequency.setTargetAtTime(up ? 1400 : 700, t, 0.08);
    reel.am.frequency.setTargetAtTime(up ? 26 : 16, t, 0.1);
  }
  function silenceLoops() { setTension(0, false); setReel(0, false); }

  /* ---------- efectos ---------- */
  const SFX = {
    jump(mass = 3) {
      const p = Math.pow(3 / mass, 0.35);
      tone({ type: 'sine', f0: 230 * p, f1: 520 * p, dur: 0.13, vol: 0.2 });
      tone({ type: 'triangle', f0: 460 * p, f1: 1000 * p, dur: 0.08, vol: 0.06 });
    },
    land(intensity = 1, mass = 3) {
      const p = Math.pow(3 / mass, 0.3), v = clamp(intensity, 0.15, 1.2);
      tone({ type: 'sine', f0: 170 * p, f1: 55, dur: 0.14, vol: 0.32 * v });
      noise({ dur: 0.08, vol: 0.14 * v, type: 'lowpass', f0: 900, f1: 200 });
    },
    boing(mass = 3) {
      const p = Math.pow(3 / mass, 0.25);
      tone({ type: 'sine', f0: 150 * p, f1: 560 * p, dur: 0.28, vol: 0.28 });
      tone({ type: 'triangle', f0: 300 * p, f1: 900 * p, dur: 0.18, vol: 0.07, at: 0.02 });
      noise({ dur: 0.06, vol: 0.08, type: 'lowpass', f0: 600 });
    },
    stick() {
      tone({ type: 'sine', f0: 620, f1: 170, dur: 0.1, vol: 0.26 });
      noise({ dur: 0.07, vol: 0.12, type: 'bandpass', f0: 2200, f1: 500, q: 2.5 });
    },
    unstick(strong = false) {
      tone({ type: 'sine', f0: 200, f1: strong ? 900 : 650, dur: 0.08, vol: 0.24 });
      noise({ dur: 0.04, vol: 0.1, type: 'highpass', f0: 2500 });
    },
    dry() {
      tone({ type: 'triangle', f0: 900, f1: 300, dur: 0.18, vol: 0.12 });
      noise({ dur: 0.12, vol: 0.08, type: 'highpass', f0: 3500 });
    },
    bump(intensity = 0.5) {
      tone({ type: 'sine', f0: 260, f1: 120, dur: 0.08, vol: 0.18 * intensity });
    },
    ram(intensity = 1) {
      const v = clamp(intensity, 0.4, 1.3);
      noise({ dur: 0.18, vol: 0.4 * v, type: 'lowpass', f0: 3200, f1: 300 });
      tone({ type: 'sine', f0: 190, f1: 48, dur: 0.24, vol: 0.45 * v });
      tone({ type: 'triangle', f0: 620, f1: 330, dur: 0.14, vol: 0.18 * v, at: 0.01 });
      tone({ type: 'square', f0: 1300, f1: 1700, dur: 0.06, vol: 0.04 * v, at: 0.05 });
    },
    whoosh() {
      noise({ dur: 0.35, vol: 0.18, type: 'bandpass', f0: 400, f1: 2400, q: 1.2, attack: 0.08 });
    },
    dunk() {
      // golpe metálico + papel arrugado
      [[310, 0.9], [823, 0.5], [1590, 0.3], [2690, 0.18]].forEach(([f, a]) =>
        tone({ type: 'sine', f0: f, f1: f * 0.985, dur: 1.1, vol: 0.12 * a, attack: 0.002 }));
      tone({ type: 'sine', f0: 140, f1: 50, dur: 0.3, vol: 0.4 });
      for (let i = 0; i < 9; i++) noise({ dur: 0.05 + Math.random() * 0.06, vol: 0.13, type: 'bandpass', f0: 2500 + Math.random() * 3500, q: 3, at: 0.04 + i * 0.045 + Math.random() * 0.03 });
    },
    pellet(p = 1) {
      tone({ type: 'triangle', f0: 880 * p, dur: 0.07, vol: 0.14 });
      tone({ type: 'triangle', f0: 1320 * p, dur: 0.1, vol: 0.14, at: 0.06 });
      tone({ type: 'sine', f0: 2640 * p, dur: 0.08, vol: 0.04, at: 0.06 });
    },
    golden() {
      [784, 988, 1175, 1568].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.16, vol: 0.13, at: i * 0.06 }));
      tone({ type: 'sine', f0: 3136, dur: 0.3, vol: 0.04, at: 0.24 });
    },
    beep(high = false) {
      tone({ type: 'square', f0: high ? 988 : 659, dur: high ? 0.32 : 0.13, vol: 0.09 });
      tone({ type: 'sine', f0: high ? 1976 : 1318, dur: high ? 0.32 : 0.13, vol: 0.05 });
      if (high) { tone({ type: 'triangle', f0: 659, dur: 0.4, vol: 0.06 }); tone({ type: 'triangle', f0: 784, dur: 0.4, vol: 0.06 }); }
    },
    bell() {
      for (let k = 0; k < 6; k++) {
        [[1250, 0.6], [2700, 0.25], [3900, 0.12]].forEach(([f, a]) =>
          tone({ type: 'sine', f0: f, dur: 0.11, vol: 0.11 * a, at: k * 0.075 }));
      }
    },
    callout() { tone({ type: 'triangle', f0: 523, f1: 784, dur: 0.12, vol: 0.09 }); tone({ type: 'triangle', f0: 784, f1: 1046, dur: 0.14, vol: 0.08, at: 0.08 }); },
    win() {
      const seq = [523, 659, 784, 1046, 784, 1046, 1318];
      seq.forEach((f, i) => marimba(f, i * 0.11, 0.2, sfxBus));
      [523, 659, 784].forEach(f => tone({ type: 'triangle', f0: f, dur: 0.9, vol: 0.06, at: 0.8 }));
    },
    roundWin() { [659, 784, 1046].forEach((f, i) => marimba(f, i * 0.09, 0.18, sfxBus)); },
    hover() { tone({ type: 'sine', f0: 1500, dur: 0.035, vol: 0.05 }); },
    select() { tone({ type: 'triangle', f0: 660, f1: 990, dur: 0.09, vol: 0.12 }); tone({ type: 'sine', f0: 1320, dur: 0.08, vol: 0.05, at: 0.05 }); },
    back() { tone({ type: 'triangle', f0: 700, f1: 440, dur: 0.09, vol: 0.1 }); },
    pause() { tone({ type: 'sine', f0: 880, f1: 440, dur: 0.15, vol: 0.1 }); },
    // modo Fiesta
    tick(i = 0) { tone({ type: 'triangle', f0: 1100 + (i % 3) * 140, dur: 0.035, vol: 0.07 }); noise({ dur: 0.02, vol: 0.05, type: 'highpass', f0: 4000 }); },
    party() {
      // corneta de fiesta + maracas
      [[392, 0], [523, 0.1], [659, 0.2], [784, 0.3]].forEach(([f, at]) => { tone({ type: 'sawtooth', f0: f * 0.98, f1: f, dur: 0.12, vol: 0.05, at }); marimba(f * 2, at, 0.1, sfxBus); });
      tone({ type: 'sawtooth', f0: 784, f1: 1046, dur: 0.38, vol: 0.06, at: 0.42 });
      tone({ type: 'square', f0: 1046, f1: 1060, dur: 0.38, vol: 0.025, at: 0.42 });
      for (let k = 0; k < 6; k++) noise({ dur: 0.05, vol: 0.09, type: 'highpass', f0: 5000, at: k * 0.11 });
    },
    splash() {
      noise({ dur: 0.5, vol: 0.3, type: 'lowpass', f0: 2400, f1: 300, attack: 0.005 });
      for (let k = 0; k < 6; k++) tone({ type: 'sine', f0: 500 + Math.random() * 600, f1: 900 + Math.random() * 800, dur: 0.06, vol: 0.05, at: 0.12 + k * 0.06 });
    },
    gust() { noise({ dur: 1.1, vol: 0.16, type: 'bandpass', f0: 300, f1: 1100, q: 0.8, attack: 0.25 }); noise({ dur: 0.9, vol: 0.08, type: 'highpass', f0: 2500, attack: 0.3 }); },
    snip() {
      noise({ dur: 0.05, vol: 0.2, type: 'highpass', f0: 3800 });
      tone({ type: 'square', f0: 2400, f1: 1800, dur: 0.04, vol: 0.05 });
      noise({ dur: 0.05, vol: 0.16, type: 'highpass', f0: 4200, at: 0.12 });
    },
  };

  function marimba(freq, at = 0, vol = 0.15, dest = null) {
    if (!ac) return;
    tone({ type: 'sine', f0: freq, dur: 0.32, vol, at, attack: 0.002, dest });
    tone({ type: 'sine', f0: freq * 3.99, dur: 0.06, vol: vol * 0.28, at, attack: 0.001, dest });
    tone({ type: 'sine', f0: freq * 10.1, dur: 0.02, vol: vol * 0.08, at, attack: 0.001, dest });
  }

  function play(name, ...args) { if (ac && sfxOn && SFX[name]) { try { SFX[name](...args); } catch (e) { /* nada */ } } }

  function setMusic(on) { musicOn = on; Store.set('music', on); if (musicBus) musicBus.gain.setTargetAtTime(on ? 0.34 : 0, now(), 0.1); }
  function setSfx(on) { sfxOn = on; Store.set('sfx', on); if (sfxBus) sfxBus.gain.setTargetAtTime(on ? 0.9 : 0, now(), 0.05); if (!on) silenceLoops(); }

  /* =======================================================================
     MÚSICA — seis estilos hechos con el mismo secuenciador (semicorcheas):
     cumbia, arcade, salsa, surf, lo-fi y dembow. Cada arena trae el suyo
     (o se elige en Opciones). La intensidad sube los repiques y rellenos.
     ======================================================================= */
  const Music = (() => {
    const N = n => 440 * Math.pow(2, (n - 69) / 12);
    let nextTime = 0, step = 0, timer = null, mode = 'menu', intensity = 0, started = false;
    let track = null, pending = null;
    let gPerc, gDrums, gBass, gKeys, gComp;

    /* ---------- instrumentos ---------- */
    function env2(g, t, a, peak, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dur); }
    function hit(dest, t, f0, f1, dur, vol, type = 'sine') {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      env2(g, t, 0.003, vol, dur);
      o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.03);
    }
    function nz(dest, t, vol, dur, type, freq, q = 1, attack = 0.004) {
      const s = ac.createBufferSource(); s.buffer = noiseBuf;
      const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ac.createGain(); env2(g, t, attack, vol, dur);
      s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random()); s.stop(t + dur + 0.03);
    }
    function osc(dest, t, freq, vol, dur, type, { attack = 0.006, cutoff = 0, q = 0.8, vib = 0, detune = 0, trem = 0 } = {}) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.value = freq; o.detune.value = detune;
      let node = o;
      if (cutoff) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; f.Q.value = q; o.connect(f); node = f; }
      if (vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 5.5; lg.gain.value = vib; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + attack + dur + 0.05); }
      env2(g, t, attack, vol, dur);
      if (trem) {
        const tg = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain();
        tg.gain.value = 1 - trem / 2; l.frequency.value = 9; lg.gain.value = trem / 2; l.connect(lg); lg.connect(tg.gain); l.start(t); l.stop(t + attack + dur + 0.05);
        node.connect(tg); tg.connect(g);
      } else node.connect(g);
      g.connect(dest); o.start(t); o.stop(t + attack + dur + 0.05);
    }
    const I = {
      kick: (t, v = 1) => hit(gDrums, t, 130, 42, 0.24, 0.55 * v),
      kick808: (t, f, v = 1) => { hit(gBass, t, f * 2.2, f, 0.42, 0.42 * v); hit(gDrums, t, 140, 50, 0.12, 0.35 * v); },
      snare: (t, v = 1) => { nz(gDrums, t, 0.22 * v, 0.14, 'bandpass', 1900, 0.9); hit(gDrums, t, 230, 160, 0.08, 0.16 * v); },
      rim: (t, v = 1) => { hit(gDrums, t, 1700, 1500, 0.035, 0.14 * v, 'triangle'); nz(gDrums, t, 0.08 * v, 0.03, 'bandpass', 3000, 3); },
      clap: (t, v = 1) => { for (let k = 0; k < 3; k++) nz(gDrums, t + k * 0.011, 0.14 * v, 0.05 + k * 0.03, 'bandpass', 1500, 1.2); },
      hat: (t, v = 1, open = false) => nz(gPerc, t, 0.07 * v, open ? 0.16 : 0.035, 'highpass', 7500, 0.7),
      guach: (t, v = 1, long = false) => nz(gPerc, t, 0.06 * v, long ? 0.09 : 0.04, 'bandpass', 6500, 1.4, 0.006),
      shaker: (t, v = 1) => nz(gPerc, t, 0.045 * v, 0.05, 'highpass', 5200, 0.8, 0.01),
      clave: (t, v = 1) => hit(gPerc, t, 2500, 2450, 0.05, 0.16 * v),
      cowbell: (t, v = 1) => { osc(gPerc, t, 562, 0.05 * v, 0.12, 'square', { cutoff: 2600, q: 3, attack: 0.002 }); osc(gPerc, t, 845, 0.04 * v, 0.1, 'square', { cutoff: 2600, q: 3, attack: 0.002 }); },
      conga: (t, f = 1, v = 1) => hit(gDrums, t, 300 * f, 230 * f, 0.18, 0.2 * v),
      slap: (t, v = 1) => { hit(gDrums, t, 420, 330, 0.06, 0.15 * v); nz(gDrums, t, 0.07 * v, 0.03, 'bandpass', 2500, 2); },
      crackle: t => { if (Math.random() < 0.6) nz(gPerc, t + Math.random() * 0.05, 0.012 + Math.random() * 0.02, 0.01, 'highpass', 3000, 0.5, 0.001); },
      marimba: (t, n, v = 1, dest = gKeys, dur = 0.34) => { hit(dest, t, N(n), N(n) * 0.999, dur, 0.11 * v); hit(dest, t, N(n) * 3.99, N(n) * 3.98, 0.07, 0.028 * v); },
      square: (t, n, v = 1, dur = 0.16, dest = gKeys) => osc(dest, t, N(n), 0.06 * v, dur, 'square', { cutoff: 3200, attack: 0.003 }),
      brass: (t, n, v = 1, dur = 0.22) => { osc(gKeys, t, N(n), 0.07 * v, dur, 'sawtooth', { cutoff: 2100, q: 1.2, attack: 0.02, vib: 4 }); osc(gKeys, t, N(n), 0.04 * v, dur, 'sawtooth', { cutoff: 1800, attack: 0.02, detune: 9 }); },
      surf: (t, n, v = 1, dur = 0.2) => osc(gKeys, t, N(n), 0.075 * v, dur, 'sawtooth', { cutoff: 2400, q: 2, attack: 0.004, vib: 3, trem: 0.5 }),
      rhodes: (t, n, v = 1, dur = 0.9, dest = gKeys) => { osc(dest, t, N(n), 0.07 * v, dur, 'sine', { attack: 0.012, trem: 0.25 }); osc(dest, t, N(n) * 2, 0.012 * v, dur * 0.4, 'sine', { attack: 0.005 }); },
      piano: (t, n, v = 1, dur = 0.3, dest = gComp) => { osc(dest, t, N(n), 0.05 * v, dur, 'triangle', { attack: 0.003 }); osc(dest, t, N(n) * 2, 0.016 * v, dur * 0.5, 'sine', { attack: 0.002 }); },
      pluck: (t, n, v = 1, dur = 0.22) => { osc(gKeys, t, N(n), 0.07 * v, dur, 'square', { cutoff: 1900, q: 4, attack: 0.002 }); osc(gKeys, t, N(n + 12), 0.02 * v, dur * 0.5, 'triangle', { attack: 0.002 }); },
      bass: (t, n, v = 1, dur = 0.3, type = 'triangle') => osc(gBass, t, N(n), 0.3 * v, dur, type, { cutoff: type === 'triangle' ? 700 : 900, attack: 0.01 }),
    };

    /* ---------- los estilos ---------- */
    const TRACKS = {
      cumbia: {
        name: 'Cumbia del recreo', bpm: 104, swing: 0.04,
        chords: [[48, 52, 55], [48, 52, 55], [43, 47, 50, 53], [43, 47, 50, 53], [41, 45, 48], [43, 47, 50, 53], [48, 52, 55], [48, 52, 55]],
        roots: [36, 36, 43, 43, 41, 43, 36, 36],
        mel: [
          [76, 0, 79, 0, 81, 79, 0, 76, 0, 0, 74, 0, 76, 0, 0, 0], [72, 0, 74, 0, 76, 0, 79, 0, 0, 76, 0, 74, 72, 0, 0, 0],
          [74, 0, 77, 0, 79, 77, 0, 74, 0, 0, 71, 0, 74, 0, 0, 0], [79, 0, 77, 0, 76, 0, 74, 0, 71, 0, 74, 0, 67, 0, 0, 0],
          [77, 0, 81, 0, 84, 81, 0, 77, 0, 0, 76, 0, 77, 0, 79, 0], [79, 0, 0, 77, 0, 0, 74, 0, 79, 0, 81, 0, 83, 0, 0, 0],
          [84, 0, 83, 0, 81, 79, 0, 76, 0, 0, 79, 0, 76, 0, 74, 0], [72, 0, 0, 0, 76, 0, 79, 0, 84, 0, 0, 0, 0, 0, 0, 0],
        ],
        step(st, bar, t, T) {
          const g = [1, 0, .5, .45, .8, 0, .5, .45, 1, 0, .5, .45, .8, 0, .5, .45][st];
          if (g) I.guach(t, g, g > 0.7);
          if (st === 0 || st === 8) I.kick(t, 0.9);
          if (st === 4 || st === 12) I.conga(t, 0.8, 1.1);
          if (intensity > 0.2 && [3, 6, 9, 13, 14].includes(st) && Math.random() < intensity) I.conga(t, 1.15, 0.7 * intensity);
          const r = T.roots[bar];
          if (st === 0) I.bass(t, r, 1, 0.5); if (st === 8) I.bass(t, r + 7, 0.9, 0.4); if (st === 14) I.bass(t, r + 12, 0.65, 0.2);
          if (st % 4 === 2) T.chords[bar].forEach(n => I.marimba(t, n + 12, 0.32, gComp, 0.14));
          const m = T.mel[bar][st]; if (m) I.marimba(t, m);
        },
      },
      arcade: {
        name: 'Arcade de laboratorio', bpm: 138, swing: 0,
        chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62], [57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 56, 59]],
        roots: [45, 41, 48, 43, 45, 41, 43, 40],
        mel: [
          [81, 0, 79, 0, 76, 0, 72, 0, 74, 0, 76, 0, 72, 0, 69, 0], [72, 0, 77, 0, 81, 0, 77, 0, 72, 0, 77, 0, 81, 0, 84, 0],
          [79, 0, 76, 0, 72, 0, 76, 0, 79, 0, 84, 0, 83, 0, 79, 0], [74, 0, 79, 0, 83, 0, 79, 0, 74, 0, 71, 0, 74, 0, 0, 0],
          [76, 76, 0, 76, 0, 72, 0, 76, 0, 79, 0, 0, 67, 0, 0, 0], [77, 77, 0, 77, 0, 72, 0, 77, 0, 81, 0, 0, 69, 0, 0, 0],
          [79, 0, 77, 0, 76, 0, 74, 0, 71, 0, 74, 0, 79, 0, 83, 0], [80, 0, 0, 76, 0, 0, 71, 0, 68, 0, 71, 0, 76, 0, 0, 0],
        ],
        step(st, bar, t, T) {
          if (st === 0 || st === 8 || (st === 10 && intensity > 0.3)) I.kick(t, 0.85);
          if (st === 4 || st === 12) I.snare(t, 0.8);
          if (st % 2 === 0) I.hat(t, st % 4 === 2 ? 1 : 0.6);
          if (intensity > 0.2 && st % 2 === 1 && Math.random() < intensity) I.hat(t, 0.5);
          const r = T.roots[bar];
          if (st % 2 === 0) I.bass(t, r + [0, 12, 0, 12, 7, 12, 0, 12][st / 2], 0.8, 0.12, 'square');
          const ch = T.chords[bar]; I.square(t, ch[st % ch.length] + 12, 0.28, 0.07, gComp);
          const m = T.mel[bar][st]; if (m) I.square(t, m, 1, 0.15);
        },
      },
      salsa: {
        name: 'Salsa del comedor', bpm: 98, swing: 0.02,
        chords: [[50, 53, 57, 60], [43, 47, 50, 53], [48, 52, 55, 59], [45, 49, 52, 55], [50, 53, 57, 60], [43, 47, 50, 53], [48, 52, 55, 59], [45, 49, 52, 55]],
        roots: [38, 43, 36, 45, 38, 43, 36, 45],
        mel: [
          [74, 0, 0, 77, 0, 0, 81, 0, 0, 0, 79, 0, 77, 0, 74, 0], [0, 0, 71, 0, 74, 0, 77, 0, 79, 0, 0, 77, 0, 74, 0, 0],
          [76, 0, 0, 79, 0, 0, 84, 0, 0, 0, 83, 0, 79, 0, 76, 0], [0, 0, 73, 0, 76, 0, 79, 0, 81, 0, 0, 79, 0, 76, 73, 0],
          [77, 0, 77, 0, 0, 81, 0, 0, 84, 0, 81, 0, 77, 0, 0, 0], [79, 0, 79, 0, 0, 83, 0, 0, 86, 0, 83, 0, 79, 0, 0, 0],
          [84, 0, 83, 0, 81, 0, 79, 0, 77, 0, 76, 0, 74, 0, 72, 0], [73, 0, 0, 76, 0, 0, 79, 0, 0, 0, 81, 0, 0, 0, 0, 0],
        ],
        step(st, bar, t, T) {
          const three = bar % 2 === 0;
          if ((three && (st === 0 || st === 6 || st === 12)) || (!three && (st === 4 || st === 8))) I.clave(t);
          if (st % 4 === 0) I.cowbell(t, st === 0 ? 1 : 0.7);
          if (st === 6 || st === 14) I.conga(t, 0.85); if (st === 7 || st === 15) I.conga(t, 0.75, 0.8);
          if (st === 4 || st === 12) I.slap(t);
          if (intensity > 0.2 && Math.random() < intensity * 0.5 && st % 2 === 1) I.conga(t, 1.2, 0.5);
          if (st === 0 || st === 8) I.kick(t, 0.45);
          const r = T.roots[bar], nr = T.roots[(bar + 1) % 8];
          if (st === 6) I.bass(t, r + 7, 0.95, 0.3); if (st === 12) I.bass(t, nr, 1, 0.4);
          if ([0, 3, 6, 8, 10, 13].includes(st)) T.chords[bar].forEach((n, i) => I.piano(t, n + 12 + (st % 2 && i === 0 ? 12 : 0), 0.8, 0.18));
          const m = T.mel[bar][st]; if (m) I.brass(t, m, 1, 0.2);
        },
      },
      surf: {
        name: 'Surf del bus', bpm: 150, swing: 0,
        chords: [[52, 55, 59], [48, 52, 55], [55, 59, 62], [50, 54, 57], [52, 55, 59], [48, 52, 55], [50, 54, 57], [47, 51, 54, 57]],
        roots: [40, 36, 43, 38, 40, 36, 38, 35],
        mel: [
          [76, 0, 76, 0, 79, 0, 76, 0, 74, 0, 71, 0, 74, 0, 76, 0], [72, 0, 72, 0, 76, 0, 72, 0, 71, 0, 67, 0, 71, 0, 72, 0],
          [74, 0, 74, 0, 79, 0, 74, 0, 83, 0, 81, 0, 79, 0, 74, 0], [78, 0, 76, 0, 74, 0, 73, 0, 74, 0, 0, 0, 69, 0, 0, 0],
          [83, 83, 83, 83, 81, 81, 81, 81, 79, 79, 79, 79, 76, 76, 76, 76], [84, 84, 84, 84, 83, 83, 83, 83, 81, 81, 81, 81, 79, 79, 79, 79],
          [78, 0, 81, 0, 78, 0, 74, 0, 78, 0, 81, 0, 86, 0, 0, 0], [75, 0, 78, 0, 81, 0, 78, 0, 75, 0, 71, 0, 75, 0, 0, 0],
        ],
        step(st, bar, t, T) {
          if (st === 0 || st === 6 || st === 8) I.kick(t, 0.9);
          if (st === 4 || st === 12) I.snare(t, 1);
          if (st % 2 === 0) I.hat(t, 0.8, st === 14);
          if (intensity > 0.2 && st >= 12 && bar % 2 === 1 && Math.random() < intensity) I.snare(t, 0.5);
          if (st % 2 === 0) I.bass(t, T.roots[bar] + (st === 6 || st === 14 ? 7 : 0), 0.85, 0.12, 'sawtooth');
          if (st === 2 || st === 10) T.chords[bar].forEach(n => I.piano(t, n + 12, 0.55, 0.12));
          const m = T.mel[bar][st]; if (m) I.surf(t, m, T.mel[bar][(st + 1) % 16] === m ? 0.75 : 1, 0.16);
        },
      },
      lofi: {
        name: 'Lo-fi de la biblioteca', bpm: 80, swing: 0.11,
        chords: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59], [46, 50, 53, 57], [45, 48, 52, 55], [43, 46, 50, 53], [48, 52, 55, 58]],
        roots: [41, 40, 38, 36, 46, 45, 43, 36],
        mel: [
          [81, 0, 0, 0, 79, 0, 0, 0, 76, 0, 0, 0, 0, 0, 0, 0], [79, 0, 0, 0, 76, 0, 0, 74, 0, 0, 72, 0, 0, 0, 0, 0],
          [77, 0, 0, 0, 74, 0, 0, 0, 72, 0, 0, 0, 69, 0, 0, 0], [71, 0, 72, 0, 0, 0, 76, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          [74, 0, 0, 0, 77, 0, 0, 0, 81, 0, 0, 0, 79, 0, 0, 0], [76, 0, 0, 0, 72, 0, 0, 0, 76, 0, 79, 0, 0, 0, 0, 0],
          [77, 0, 0, 0, 74, 0, 0, 70, 0, 0, 72, 0, 0, 0, 0, 0], [76, 0, 0, 0, 0, 0, 79, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ],
        step(st, bar, t, T) {
          if (st === 0 || st === 10 || (st === 7 && bar % 2)) I.kick(t, 0.7);
          if (st === 4 || st === 12) I.snare(t, 0.55);
          if (st % 2 === 0) I.hat(t, 0.45);
          I.crackle(t);
          if (intensity > 0.3 && st % 4 === 3 && Math.random() < intensity) I.rim(t, 0.6);
          if (st === 0) I.bass(t, T.roots[bar], 0.85, 0.7); if (st === 10) I.bass(t, T.roots[bar] + 7, 0.6, 0.35);
          if (st === 0 || st === 7) T.chords[bar].forEach(n => I.rhodes(t, n + 12, 0.42, st ? 0.6 : 1.1, gComp));
          const m = T.mel[bar][st]; if (m) I.rhodes(t, m, 1, 0.9);
        },
      },
      dembow: {
        name: 'Dembow del patio', bpm: 94, swing: 0,
        chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62], [57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]],
        roots: [33, 29, 36, 31, 33, 29, 36, 31],
        mel: [
          [76, 0, 0, 76, 0, 0, 74, 0, 72, 0, 74, 0, 76, 0, 0, 0], [77, 0, 0, 77, 0, 0, 76, 0, 74, 0, 72, 0, 69, 0, 0, 0],
          [76, 0, 0, 76, 0, 0, 79, 0, 76, 0, 74, 0, 72, 0, 0, 0], [74, 0, 0, 74, 0, 0, 72, 0, 71, 0, 72, 0, 74, 0, 0, 0],
          [81, 0, 0, 81, 0, 0, 79, 0, 76, 0, 79, 0, 81, 0, 0, 0], [81, 0, 0, 81, 0, 0, 79, 0, 77, 0, 76, 0, 77, 0, 0, 0],
          [79, 0, 0, 79, 0, 0, 76, 0, 79, 0, 84, 0, 79, 0, 0, 0], [79, 0, 0, 0, 77, 0, 0, 0, 74, 0, 0, 0, 71, 0, 0, 0],
        ],
        step(st, bar, t, T) {
          if (st % 4 === 0) I.kick808(t, N(T.roots[bar] + 12) / 2, 0.9);
          if (st === 3 || st === 6 || st === 11 || st === 14) I.rim(t, 1);
          if (st % 2 === 0) I.hat(t, 0.55); else if (intensity > 0.2 && Math.random() < intensity) I.hat(t, 0.4);
          if (st === 12 && bar % 4 === 3) I.clap(t, 0.8);
          if (st === 0 || st === 6 || st === 10) T.chords[bar].forEach(n => I.pluck(t, n + 12, 0.25, 0.12));
          const m = T.mel[bar][st]; if (m) I.pluck(t, m, 1, 0.2);
        },
      },
    };
    const ORDER = ['cumbia', 'arcade', 'salsa', 'surf', 'lofi', 'dembow'];

    function boot() {
      if (started || !ac) return;
      started = true;
      gPerc = ac.createGain(); gDrums = ac.createGain(); gBass = ac.createGain(); gKeys = ac.createGain(); gComp = ac.createGain();
      [gPerc, gDrums, gBass, gKeys, gComp].forEach(g => g.connect(musicBus));
      if (!track) track = TRACKS[pending || 'cumbia'];
      pending = null;
      applyMode(true);
      nextTime = ac.currentTime + 0.1;
      timer = setInterval(schedule, 25);
    }
    function applyMode(instant) {
      if (!gPerc) return;
      const t = ac.currentTime, tc = instant ? 0.01 : 0.6;
      const L = mode === 'game' ? { pe: 0.9, dr: 1, ba: 1, ke: 0.7, co: 0.5 } : mode === 'menu' ? { pe: 0.6, dr: 0.55, ba: 0.85, ke: 0.85, co: 0.45 } : { pe: 0, dr: 0, ba: 0.4, ke: 0.5, co: 0.3 };
      gPerc.gain.setTargetAtTime(L.pe, t, tc); gDrums.gain.setTargetAtTime(L.dr, t, tc);
      gBass.gain.setTargetAtTime(L.ba, t, tc); gKeys.gain.setTargetAtTime(L.ke, t, tc); gComp.gain.setTargetAtTime(L.co, t, tc);
    }
    function setMode(m) { if (m === mode) return; mode = m; applyMode(false); }
    function setIntensity(v) { intensity = clamp(v, 0, 1); }
    // cambia de estilo al empezar el próximo compás
    function setTrack(id) {
      if (!TRACKS[id]) return false;
      if (!started) { pending = id; track = TRACKS[id]; return true; }
      if (track === TRACKS[id] && !pending) return false;
      pending = id; return true;
    }

    function schedule() {
      if (!ac || !track) return;
      if (nextTime < ac.currentTime - 0.3) nextTime = ac.currentTime + 0.05; // la pestaña estuvo dormida
      while (nextTime < ac.currentTime + 0.12) {
        if (step % 16 === 0 && pending) { track = TRACKS[pending]; pending = null; step = 0; }
        const T = track, st = step % 16, bar = Math.floor(step / 16) % 8;
        try { T.step(st, bar, nextTime, T); } catch (e) { /* nada */ }
        const sd = 60 / T.bpm / 4;
        nextTime += sd * (step % 2 === 0 ? 1 + T.swing : 1 - T.swing);
        step = (step + 1) % 128;
      }
    }
    return {
      boot, setMode, setIntensity, setTrack, ORDER,
      name: id => (TRACKS[id] ? TRACKS[id].name : ''),
      get current() { return track ? ORDER.find(k => TRACKS[k] === track) : null; },
    };
  })();

  return {
    init, play, setTension, setReel, silenceLoops, setMusic, setSfx, marimba,
    get musicOn() { return musicOn; }, get sfxOn() { return sfxOn; },
    get ready() { return !!ac; },
    Music,
  };
})();
