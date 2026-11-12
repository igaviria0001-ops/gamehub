/* =========================================================================
   SONIDO — todo sintetizado con WebAudio (sin archivos). Un motor por
   jugador con cambios de marcha y paneo (J1 izquierda, J2 derecha), chirrido
   del derrape que sube con el nivel, turbo, esmeraldas, piruetas, choques,
   cuenta regresiva y vueltas.
   ========================================================================= */
const Sound = (() => {
  let ac = null, master = null, comp = null, noiseBuf = null, muted = Store.get('mute', false);
  const engines = [];
  function unlock() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(ac.destination);
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(comp);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const now = () => ac.currentTime;
  function out(pan) { if (!ac) return null; if (pan && ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = pan; p.connect(master); return p; } return master; }
  function tone(freq, dur, o = {}) {
    if (!ac) return; const t = now() + (o.at || 0), g = ac.createGain(), os = ac.createOscillator(); os.type = o.type || 'sine'; os.frequency.setValueAtTime(freq, t);
    if (o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.vol || 0.3, t + (o.att || 0.008)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    os.connect(g); g.connect(out(o.pan)); os.start(t); os.stop(t + dur + 0.05);
  }
  function noise(dur, o = {}) {
    if (!ac) return; const t = now() + (o.at || 0), src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ac.createBiquadFilter(); f.type = o.ft || 'bandpass'; f.frequency.setValueAtTime(o.f || 1200, t); if (o.fTo) f.frequency.exponentialRampToValueAtTime(o.fTo, t + dur); f.Q.value = o.q || 1;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.vol || 0.3, t + (o.att || 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(out(o.pan)); src.start(t, Math.random()); src.stop(t + dur + 0.05);
  }
  // ---- motores ----
  function engine(i, pan) {
    if (!ac) return null; const e = {};
    e.o1 = ac.createOscillator(); e.o1.type = 'sawtooth'; e.o2 = ac.createOscillator(); e.o2.type = 'square'; e.o3 = ac.createOscillator(); e.o3.type = 'triangle';
    e.f = ac.createBiquadFilter(); e.f.type = 'lowpass'; e.f.frequency.value = 900; e.f.Q.value = 3;
    e.g = ac.createGain(); e.g.gain.value = 0; e.g2 = ac.createGain(); e.g2.gain.value = 0.35;
    e.o1.connect(e.f); e.o2.connect(e.g2); e.g2.connect(e.f); e.o3.connect(e.f); e.f.connect(e.g); e.g.connect(out(pan));
    // chirrido del derrape
    e.sq = ac.createBufferSource(); e.sq.buffer = noiseBuf; e.sq.loop = true; e.sqf = ac.createBiquadFilter(); e.sqf.type = 'bandpass'; e.sqf.Q.value = 6; e.sqf.frequency.value = 1800; e.sqg = ac.createGain(); e.sqg.gain.value = 0;
    e.sq.connect(e.sqf); e.sqf.connect(e.sqg); e.sqg.connect(out(pan));
    // viento / turbo
    e.wn = ac.createBufferSource(); e.wn.buffer = noiseBuf; e.wn.loop = true; e.wnf = ac.createBiquadFilter(); e.wnf.type = 'lowpass'; e.wnf.frequency.value = 600; e.wng = ac.createGain(); e.wng.gain.value = 0;
    e.wn.connect(e.wnf); e.wnf.connect(e.wng); e.wng.connect(out(pan));
    for (const o of [e.o1, e.o2, e.o3, e.sq, e.wn]) o.start();
    e.gear = 0; return e;
  }
  function startRace(nHumans) { stopRace(); if (!ac) return; for (let i = 0; i < nHumans; i++) engines.push(engine(i, nHumans === 2 ? (i ? 0.55 : -0.55) : 0)); }
  function stopRace() { for (const e of engines) if (e) { try { e.g.gain.setTargetAtTime(0, now(), 0.05); e.sqg.gain.setTargetAtTime(0, now(), 0.05); e.wng.gain.setTargetAtTime(0, now(), 0.05); const t = now() + 0.3; for (const o of [e.o1, e.o2, e.o3, e.sq, e.wn]) o.stop(t); } catch (err) { /* ya parado */ } } engines.length = 0; }
  const GEARS = [0, 14, 26, 38, 50, 62, 99];
  let bossNext = 0, bossFlap = 0;
  function bossAmb(R, humans, paused) {
    const B = R.boss; if (!B || paused || B.dead || R.state === 'count' || !humans.length) return; const t = now(); if (t < bossNext) return;
    const T = R.track; let d = 1e9; for (const c of humans) d = Math.min(d, Math.abs(T.wrap(B.s - c.s + T.L / 2) - T.L / 2)); const k = clamp(1 - d / 220, 0, 1); if (k <= 0) { bossNext = t + 0.2; return; }
    const id = B.def.id;
    if (id === 'tren') { noise(0.11, { f: 850, vol: 0.13 * k, q: 1.1 }); bossNext = t + clamp(5.5 / Math.max(6, B.v), 0.09, 0.6); }
    else if (id === 'galeon') { tone(82, 0.14, { to: 50, vol: 0.16 * k }); if (Math.random() < 0.25) noise(0.5, { f: 3500, vol: 0.05 * k, ft: 'highpass' }); bossNext = t + 0.34; }
    else { bossFlap++; noise(0.45, { f: 300, fTo: 950, vol: 0.14 * k, ft: 'lowpass', att: 0.1 }); bossNext = t + (B.dive ? 0.6 : 0.9); }
  }
  function update(R, humans, paused) {
    if (!ac) return; const t = now(), k = 0.04, solo = humans.length === 1; bossAmb(R, humans, paused);
    humans.forEach((car, i) => {
      const e = engines[i]; if (!e) return;
      if (paused || !car) { e.g.gain.setTargetAtTime(0, t, 0.05); e.sqg.gain.setTargetAtTime(0, t, 0.05); e.wng.gain.setTargetAtTime(0, t, 0.05); return; }
      const v = Math.max(0, car.f) / (car.vmax / 62); let g = 0; while (g < GEARS.length - 2 && v > GEARS[g + 1]) g++;
      const frac = clamp((v - GEARS[g]) / (GEARS[g + 1] - GEARS[g]), 0, 1), boost = car.boostT > 0;
      const base = (R.state === 'count' ? 48 + (car.prev.turbo ? 30 : 0) : 46 + frac * 70 + g * 6) * (boost ? 1.12 : 1) * (car.grounded ? 1 : 1.18);
      e.o1.frequency.setTargetAtTime(base, t, k); e.o2.frequency.setTargetAtTime(base * 0.5, t, k); e.o3.frequency.setTargetAtTime(base * 2.01, t, k);
      e.f.frequency.setTargetAtTime(500 + frac * 1400 + (boost ? 900 : 0), t, k);
      e.g.gain.setTargetAtTime((solo ? 0.13 : 0.1) * (0.6 + 0.4 * frac) * (car.respawnT > 0 ? 0.2 : 1), t, 0.06);
      const D = car.drift, wat = car.mode === 'water', air = car.mode === 'air';
      if (wat) { e.sqg.gain.setTargetAtTime(car.grounded ? 0.035 + clamp(car.f / 60, 0, 1) * 0.05 + (D.on ? 0.04 : 0) : 0.01, t, 0.05); e.sqf.frequency.setTargetAtTime(D.on ? 1600 : 900, t, 0.05); e.sqf.Q.value = 0.7; }
      else { e.sqg.gain.setTargetAtTime(D.on && car.grounded ? 0.05 + D.lv * 0.02 : car.offroad && car.f > 10 ? 0.025 : 0, t, 0.04); e.sqf.frequency.setTargetAtTime(D.on ? 1400 + D.lv * 500 : 500, t, 0.05); e.sqf.Q.value = D.on ? 6 : 1; }
      if (air) e.g.gain.setTargetAtTime((solo ? 0.07 : 0.05), t, 0.1);
      e.wng.gain.setTargetAtTime((boost ? 0.12 : 0) + clamp(car.f / 80, 0, 1) * (air ? 0.14 : 0.03), t, 0.1); e.wnf.frequency.setTargetAtTime(boost ? 2200 : air ? 1300 : 700, t, 0.1);
    });
  }
  // ---- efectos por evento ----
  const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
  function onEvents(R, events) {
    if (!ac) return; const n = R.humans;
    for (const e of events) {
      const car = e.car != null ? R.cars[e.car] : null, hum = car && !car.bot, pan = hum && n === 2 ? (car.human ? 0.55 : -0.55) : 0;
      switch (e.type) {
        // ---- jefes ----
        case 'bossHit': tone(240, 0.28, { type: 'square', to: 110, vol: 0.08 }); tone(720, 0.16, { type: 'triangle', vol: 0.07 }); noise(0.22, { f: 3200, vol: 0.1, q: 1.5 }); break;
        case 'bossRam': tone(72, 0.32, { to: 38, vol: 0.32, pan }); noise(0.3, { f: 500, vol: 0.2, ft: 'lowpass', pan }); break;
        case 'bossAtk': { const k = e.k;
          if (k === 'barrels' || k === 'coal' || k === 'wagon') { tone(784, 0.75, { type: 'square', vol: 0.045, att: 0.05 }); tone(988, 0.75, { type: 'square', vol: 0.035, att: 0.05 }); noise(0.7, { f: 4200, vol: 0.06, q: 2 }); }
          else if (k === 'cannon' || k === 'volley') { for (let q = 0; q < (k === 'volley' ? 3 : 1); q++) { noise(0.9, { f: 320, fTo: 60, vol: 0.32, ft: 'lowpass', at: q * 0.12 }); tone(58, 0.6, { to: 30, vol: 0.28, at: q * 0.12 }); } }
          else if (k === 'mines') tone(320, 0.22, { type: 'triangle', to: 120, vol: 0.1 });
          else if (k === 'steam') noise(1.3, { f: 3200, vol: 0.14, ft: 'highpass' });
          else if (k === 'feathers') { noise(0.55, { f: 5200, fTo: 1400, vol: 0.12, q: 3 }); tone(1300, 0.35, { type: 'triangle', to: 600, vol: 0.06 }); }
          else if (k === 'dive') { tone(1900, 0.9, { type: 'sawtooth', to: 900, vol: 0.05, att: 0.05 }); tone(1250, 0.9, { type: 'square', to: 700, vol: 0.035, att: 0.05 }); }
          else if (k === 'gust') noise(1.4, { f: 380, fTo: 1300, vol: 0.26, ft: 'lowpass', att: 0.2 });
          else if (k === 'flames') { noise(0.9, { f: 900, fTo: 300, vol: 0.22, ft: 'lowpass', att: 0.05 }); tone(220, 0.6, { type: 'sawtooth', to: 440, vol: 0.05 }); tone(330, 0.6, { type: 'sawtooth', to: 660, vol: 0.04 }); }
          else if (k === 'orbs') [0, 1, 2].forEach(q => tone(NOTE(76 + q * 4), 0.4, { type: 'sine', to: NOTE(64 + q * 4), vol: 0.07, at: q * 0.09 }));
          else if (k === 'lightning') { tone(2400, 0.5, { type: 'sawtooth', to: 600, vol: 0.04 }); noise(0.4, { f: 6000, vol: 0.06, q: 2 }); }
          else if (k === 'sandballs' || k === 'boulders') { noise(1.1, { f: k === 'boulders' ? 200 : 600, fTo: 90, vol: 0.22, ft: 'lowpass', att: 0.1 }); tone(k === 'boulders' ? 46 : 70, 0.8, { to: 34, vol: 0.14 }); }
          else if (k === 'quicksand') noise(1.2, { f: 2400, fTo: 700, vol: 0.12, q: 0.8, att: 0.2 });
          else if (k === 'burrow') { noise(1.4, { f: 400, fTo: 120, vol: 0.28, ft: 'lowpass', att: 0.15 }); tone(90, 1.2, { type: 'triangle', to: 50, vol: 0.12 }); }
          else if (k === 'lavabombs') { tone(80, 0.6, { type: 'sawtooth', to: 40, vol: 0.12 }); noise(0.6, { f: 300, fTo: 1200, vol: 0.16, ft: 'lowpass' }); }
          else if (k === 'stomp') { tone(48, 0.9, { to: 22, vol: 0.4 }); noise(0.8, { f: 260, fTo: 50, vol: 0.4, ft: 'lowpass' }); } break; }
        case 'featherLand': tone(1500, 0.12, { type: 'triangle', vol: 0.06 }); noise(0.12, { f: 6000, vol: 0.06 }); break;
        case 'bossPhase': tone(110, 1.3, { type: 'sawtooth', vol: 0.1, att: 0.1 }); tone(164, 1.3, { type: 'sawtooth', vol: 0.07, att: 0.1 }); break;
        case 'bossLow': [72, 79, 84].forEach((m, k) => tone(NOTE(m), 0.2, { type: 'triangle', vol: 0.1, at: k * 0.07 })); break;
        case 'bossDown': noise(2.4, { f: 900, fTo: 50, vol: 0.4, ft: 'lowpass' }); tone(60, 1.8, { to: 24, vol: 0.32 }); break;
        case 'bossDead': [60, 64, 67, 72, 76, 79, 84].forEach((m, k) => tone(NOTE(m), 0.32, { type: 'square', vol: 0.06, at: k * 0.09 })); break;
        case 'bossEscape': [67, 63, 60, 55].forEach((m, k) => tone(NOTE(m), 0.42, { type: 'square', vol: 0.07, at: k * 0.18 })); break;
        case 'bossWagonDown': noise(1.0, { f: 700, fTo: 90, vol: 0.3, ft: 'lowpass' }); tone(90, 0.5, { to: 40, vol: 0.2 }); break;
        case 'lootGot': [91, 96, 100].forEach((m, k) => tone(NOTE(m), 0.12, { type: 'triangle', vol: 0.08, pan, at: k * 0.05 })); break;
        case 'count': tone(e.n === 1 ? 660 : 523, 0.22, { type: 'square', vol: 0.12 }); break;
        case 'go': tone(1046, 0.5, { type: 'square', vol: 0.14 }); tone(1568, 0.5, { type: 'triangle', vol: 0.1 }); break;
        case 'boom': if (e.k === 'zap') { noise(0.7, { f: 2600, fTo: 300, vol: 0.24, q: 0.7 }); tone(140, 0.4, { type: 'square', to: 50, vol: 0.08 }); break; }
          if (e.k === 'mask') { [84, 88, 91].forEach((m, k) => tone(NOTE(m), 0.12, { type: 'triangle', vol: 0.08, at: k * 0.04 })); noise(0.25, { f: 5000, vol: 0.08 }); break; }
          noise(0.45, { f: 500, fTo: 120, vol: 0.12, ft: 'lowpass' }); if (e.k === 'shell' || e.k === 'lava') tone(52, 0.5, { to: 28, vol: 0.22 }); break;
        case 'bolt': noise(1.2, { f: 1200, fTo: 80, vol: 0.3, ft: 'lowpass' }); tone(60, 0.9, { type: 'sawtooth', to: 30, vol: 0.12 }); break;
      }
      if (!hum && e.type !== 'bump') continue;
      switch (e.type) {
        case 'pickGot': if (e.style === 'tunjo') [83, 88, 95, 100].forEach((m, k) => tone(NOTE(m), 0.18, { type: 'triangle', vol: 0.09, pan, at: k * 0.045 })); else { [86, 91, 95].forEach((m, k) => tone(NOTE(m), 0.14, { type: 'square', vol: 0.05, pan, at: k * 0.05 })); noise(0.2, { f: 6000, vol: 0.05, pan }); } break;
        case 'logHit': tone(110, 0.25, { type: 'triangle', to: 60, vol: 0.25, pan }); noise(0.5, { f: 900, fTo: 200, vol: 0.2, ft: 'lowpass', pan }); noise(0.6, { f: 2500, vol: 0.08, pan, at: 0.05 }); break;
        case 'stormCatch': noise(1.6, { f: 700, fTo: 2400, vol: 0.3, q: 0.6, att: 0.05, pan }); tone(80, 0.8, { to: 40, vol: 0.12, pan }); break;
        case 'stormFree': noise(0.5, { f: 800, fTo: 3000, vol: 0.12, pan }); tone(NOTE(79), 0.2, { type: 'triangle', vol: 0.1, pan }); break;
        case 'sandIn': noise(0.7, { f: 1600, fTo: 500, vol: 0.12, q: 0.7, pan }); break;
        case 'stompHit': tone(60, 0.4, { to: 34, vol: 0.28, pan }); noise(0.4, { f: 400, vol: 0.18, ft: 'lowpass', pan }); break;
        case 'perfectStart': tone(523, 0.12, { type: 'triangle', vol: 0.2, pan }); tone(1046, 0.25, { type: 'triangle', vol: 0.2, pan, at: 0.08 }); noise(0.5, { f: 800, fTo: 3000, vol: 0.12, pan }); break;
        case 'driftStart': noise(0.12, { f: 300, vol: 0.12, ft: 'lowpass', pan }); break;
        case 'driftLv': tone([0, 784, 988, 1318][e.lv], 0.14, { type: 'triangle', vol: 0.12, pan }); break;
        case 'driftBoost': case 'pad': case 'turbo': noise(0.55, { f: 600, fTo: 2600, vol: 0.18, q: 0.8, pan }); tone(180, 0.45, { type: 'sawtooth', to: 420, vol: 0.06, pan }); break;
        case 'gem': tone(NOTE(88), 0.1, { type: 'triangle', vol: 0.12, pan }); tone(NOTE(95), 0.16, { type: 'triangle', vol: 0.11, pan, at: 0.05 }); tone(NOTE(100), 0.22, { vol: 0.07, pan, at: 0.1 }); noise(0.18, { f: 7000, vol: 0.035, q: 3, pan, at: 0.04 }); break;
        case 'gemSeg': [84, 88, 91, 96].forEach((m, k) => tone(NOTE(m), 0.25, { type: 'triangle', vol: 0.09, pan, at: k * 0.05 })); break;
        case 'takeoff': if (e.why === 'wave') noise(0.25, { f: 1200, fTo: 400, vol: 0.1, ft: 'lowpass', pan }); else if (e.why !== 'crest') noise(0.3, { f: 900, fTo: 300, vol: 0.08, pan }); break;
        case 'trick': noise(0.25, { f: 2000, fTo: 600, vol: 0.12, q: 2, pan }); tone(NOTE(76 + Math.min(e.n, 5) * 2), 0.1, { type: 'triangle', vol: 0.08, pan }); break;
        case 'land': tone(90, 0.18, { to: 45, vol: 0.25, pan }); break;
        case 'landTrick': [72, 76, 79, 84].forEach((m, k) => tone(NOTE(m + 2 * Math.min(3, e.n - 1)), 0.18, { type: 'square', vol: 0.06, pan, at: k * 0.06 })); tone(90, 0.2, { to: 45, vol: 0.2, pan }); break;
        case 'landBad': tone(120, 0.3, { to: 50, vol: 0.25, type: 'sawtooth', pan }); noise(0.3, { f: 400, vol: 0.2, ft: 'lowpass', pan }); break;
        case 'wall': noise(0.18, { f: 1800, vol: Math.min(0.3, 0.08 + e.hit * 0.01), q: 0.6, pan }); tone(70, 0.15, { to: 40, vol: 0.2, pan }); break;
        case 'bump': { const a = R.cars[e.car], b = R.cars[e.other]; if ((a && !a.bot) || (b && !b.bot)) { const hp = n === 2 ? ((!a.bot ? a : b).human ? 0.55 : -0.55) : 0; tone(85, 0.14, { to: 50, vol: Math.min(0.3, 0.06 + e.imp * 0.02), pan: hp }); noise(0.1, { f: 1500, vol: 0.08, pan: hp }); } break; }
        case 'mode': if (e.mode === 'water') { noise(0.7, { f: 900, fTo: 300, vol: 0.25, ft: 'lowpass', pan }); tone(300, 0.25, { type: 'triangle', to: 150, vol: 0.06, pan }); } else if (e.mode === 'air') { noise(0.6, { f: 500, fTo: 2500, vol: 0.14, pan }); [76, 83, 88].forEach((m, k) => tone(NOTE(m), 0.2, { type: 'triangle', vol: 0.07, pan, at: k * 0.05 })); } else tone(180, 0.18, { type: 'square', to: 120, vol: 0.05, pan }); break;
        case 'ring': (e.big ? [79, 84, 88, 91, 96] : [84, 91, 96]).forEach((m, k) => tone(NOTE(m), 0.22, { type: 'triangle', vol: 0.09, pan, at: k * 0.045 })); break;
        case 'box': { if (!hum) break; noise(0.22, { f: 5200, fTo: 2200, vol: 0.09, q: 2, pan }); tone(NOTE(91), 0.12, { type: 'triangle', vol: 0.09, pan }); tone(NOTE(96), 0.14, { type: 'triangle', vol: 0.07, pan, at: 0.04 }); // cristal que se rompe y ruleta que se frena
          [0.1, 0.17, 0.25, 0.34, 0.44, 0.55, 0.67, 0.8].forEach((at, k) => tone(NOTE(84 + (k % 2) * 5), 0.045, { type: 'square', vol: 0.035, pan, at })); break; }
        case 'itemGot': { if (!hum) break; [79, 84, 88, 91].forEach((m, k) => tone(NOTE(m), 0.14, { type: 'triangle', vol: 0.08, pan, at: k * 0.045 })); const it = e.item || (car && car.item); if (it === 'bolt') noise(0.4, { f: 2500, fTo: 600, vol: 0.08, pan, at: 0.15 }); else if (it === 'shield' || it === 'emerald') [96, 100, 103].forEach((m, k) => tone(NOTE(m), 0.25, { vol: 0.05, pan, at: 0.18 + k * 0.05 })); else if (it === 'rocket' || it === 'rocket3' || it === 'wasp') tone(110, 0.22, { type: 'sawtooth', to: 165, vol: 0.05, pan, at: 0.16 }); break; }
        case 'itemUse': { const it = e.item;
          if (it === 'rocket' || it === 'rocket3') { noise(0.7, { f: 700, fTo: 3200, vol: 0.16, q: 0.8, pan }); tone(70, 0.25, { to: 40, vol: 0.18, pan }); if (it === 'rocket3') noise(0.6, { f: 900, fTo: 3600, vol: 0.1, pan, at: 0.08 }); }
          else if (it === 'wasp') { tone(220, 0.7, { type: 'sawtooth', to: 260, vol: 0.05, pan, att: 0.05 }); tone(223, 0.7, { type: 'square', to: 262, vol: 0.03, pan, att: 0.05 }); }
          else if (it === 'oil') { noise(0.3, { f: 500, fTo: 150, vol: 0.18, ft: 'lowpass', pan }); tone(140, 0.2, { type: 'triangle', to: 70, vol: 0.08, pan }); }
          else if (it === 'coco') [0, 0.08, 0.16].forEach(at => tone(320, 0.12, { type: 'triangle', to: 160, vol: 0.1, pan, at }));
          else if (it === 'shield') { [72, 79, 84, 91].forEach((m, k) => tone(NOTE(m), 0.35, { vol: 0.06, pan, at: k * 0.04 })); noise(0.5, { f: 6000, vol: 0.03, q: 2, pan }); }
          else if (it === 'chile') { noise(0.6, { f: 4000, fTo: 1500, vol: 0.08, ft: 'highpass', pan }); tone(200, 0.5, { type: 'sawtooth', to: 600, vol: 0.06, pan }); }
          else if (it === 'magnet') tone(300, 0.6, { type: 'sine', to: 150, vol: 0.12, pan });
          else if (it === 'fog') noise(0.9, { f: 600, fTo: 250, vol: 0.14, ft: 'lowpass', pan, att: 0.15 });
          else if (it === 'emerald') [84, 88, 91, 96, 100].forEach((m, k) => tone(NOTE(m), 0.22, { type: 'triangle', vol: 0.07, pan, at: k * 0.04 }));
          else tone(220, 0.15, { type: 'square', to: 110, vol: 0.06, pan }); break; }
        case 'hit': tone(400, 0.6, { type: 'sawtooth', to: 90, vol: 0.12, pan }); noise(0.3, { f: 900, vol: 0.18, pan }); break;
        case 'dodge': tone(NOTE(88), 0.1, { type: 'triangle', vol: 0.1, pan }); tone(NOTE(95), 0.18, { type: 'triangle', vol: 0.1, pan, at: 0.07 }); break;
        case 'shieldPop': tone(1400, 0.25, { type: 'triangle', to: 600, vol: 0.1, pan }); break;
        case 'special': [60, 64, 67, 72, 76].forEach((m, k) => tone(NOTE(m + (car.pid.length % 5)), 0.25, { type: 'square', vol: 0.06, pan, at: k * 0.06 })); noise(0.8, { f: 300, fTo: 3000, vol: 0.15, pan }); break;
        case 'draft': noise(0.6, { f: 400, fTo: 1800, vol: 0.12, pan }); break;
        case 'heart': tone(NOTE(e.n > 0 ? 64 : 55), 0.3, { type: 'square', to: NOTE(52), vol: 0.08, pan }); break;
        case 'lessonTick': [79, 84].forEach((m, k) => tone(NOTE(m), 0.16, { type: 'triangle', vol: 0.1, pan, at: k * 0.07 })); break;
        case 'lessonDone': [72, 76, 79, 84, 88, 91].forEach((m, k) => tone(NOTE(m), 0.3, { type: 'square', vol: 0.06, pan, at: k * 0.08 })); break;
        case 'lap': if (R.rules && R.rules.noLaps) break; if (car.lap === R.laps - 1) [72, 76, 79, 84].forEach((m, k) => tone(NOTE(m), 0.2, { type: 'square', vol: 0.07, pan, at: k * 0.09 })); else if (!car.finished) { tone(NOTE(79), 0.15, { type: 'triangle', vol: 0.12, pan }); tone(NOTE(84), 0.25, { type: 'triangle', vol: 0.12, pan, at: 0.1 }); } break;
        case 'finish': [72, 76, 79, 84, 88].forEach((m, k) => tone(NOTE(m), 0.35, { type: 'square', vol: 0.07, pan, at: k * 0.1 })); break;
        case 'fall': noise(0.8, { f: 700, fTo: 200, vol: 0.25, ft: 'lowpass', pan, at: 0.2 }); break;
        case 'respawn': [84, 91].forEach((m, k) => tone(NOTE(m), 0.15, { vol: 0.08, pan, at: k * 0.07 })); break;
      }
    }
  }
  function ui() { tone(880, 0.06, { type: 'triangle', vol: 0.08 }); }
  function toggle() { muted = !muted; Store.set('mute', muted); if (master) master.gain.value = muted ? 0 : 0.8; return muted; }
  let mbus = null;
  function musicBus() { if (!ac) return null; if (!mbus) { mbus = ac.createGain(); mbus.gain.value = 0.42; mbus.connect(master); } return mbus; }
  return { unlock, startRace, stopRace, update, onEvents, ui, toggle, musicBus, get ctx() { return ac; }, get noise() { return noiseBuf; }, get muted() { return muted; } };
})();
