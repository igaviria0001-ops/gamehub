/* =========================================================================
   SONIDO — todo sintetizado (sin archivos).
   · Turbinas de cada piloto: viento según la velocidad + zumbido que ruge
     con el turbo, ubicado a la izquierda o derecha según la pantalla.
   · Ráfagas, impactos, silbidos de bala, misiles, explosiones graves,
     alarma de misil que pita más rápido cuando se acerca, cajas, rondas.
   La música de acción llega en la fase 4.
   ========================================================================= */
const Sound = (() => {
  let ac = null, master = null, sfx = null, noiseBuf = null, on = Store.get('sound', true);
  const eng = [];
  const alarm = [{ t: 0 }, { t: 0 }];
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume().catch(() => {}); return; }
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = on ? 0.8 : 0;
      const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      master.connect(comp); comp.connect(ac.destination);
      sfx = ac.createGain(); sfx.gain.value = 1; sfx.connect(master);
      const len = ac.sampleRate * 2; noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
      const d = noiseBuf.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0527; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.22; }
      for (let i = 0; i < 2; i++) {
        const src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
        const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.9; f.frequency.value = 400;
        const g = ac.createGain(); g.gain.value = 0;
        const osc = ac.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 110;
        const of = ac.createBiquadFilter(); of.type = 'lowpass'; of.frequency.value = 600;
        const og = ac.createGain(); og.gain.value = 0;
        const pan = ac.createStereoPanner ? ac.createStereoPanner() : null;
        const out = pan || master;
        src.connect(f); f.connect(g); g.connect(out);
        osc.connect(of); of.connect(og); og.connect(out);
        if (pan) pan.connect(master);
        src.start(0, i * 0.7); osc.start();
        eng.push({ f, g, osc, of, og, pan });
      }
    } catch (e) { ac = null; }
    if (ac && typeof Music !== 'undefined') Music.start();
  }
  function setOn(v) { on = !!v; Store.set('sound', on); if (master) master.gain.value = on ? 0.8 : 0; }
  function noiseHit(freq, q, dur, vol, type = 'bandpass', sweep = 1, delay = 0) {
    if (!ac || !on) return;
    const t = ac.currentTime + delay, src = ac.createBufferSource(); src.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(freq, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, freq * sweep), t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(sfx); src.start(t, Math.random()); src.stop(t + dur + 0.05);
  }
  function tone(freq, dur, vol, type = 'sine', to = null, delay = 0) {
    if (!ac || !on) return;
    const t = ac.currentTime + delay, o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(sfx); o.start(t); o.stop(t + dur + 0.05);
  }
  function play(name, e, quiet) {
    if (!ac || !on) return;
    const q = quiet ? 0.25 : 1;
    switch (name) {
      case 'shot': noiseHit(1800, 0.7, 0.07, 0.16 * q, 'bandpass', 0.5); tone(140, 0.05, 0.06 * q, 'square', 70); break;
      case 'hit': tone(1400, 0.06, 0.08, 'triangle', 700); noiseHit(3000, 1, 0.05, 0.1, 'highpass'); break;
      case 'shieldHit': tone(1800, 0.1, 0.06, 'sine', 2400); break;
      case 'whiz': noiseHit(4200, 3, 0.12, 0.05, 'bandpass', 0.6); break;
      case 'launch': noiseHit(500, 0.8, 0.6, 0.3 * q, 'bandpass', 3); tone(220, 0.4, 0.05 * q, 'sawtooth', 440); break;
      case 'locked': tone(1320, 0.07, 0.06); tone(1320, 0.07, 0.06, 'sine', null, 0.1); break;
      case 'boom': tone(90, 0.7, 0.5 * q, 'sine', 30); noiseHit(900, 0.5, 0.8, 0.45 * q, 'lowpass', 0.15); noiseHit(2400, 0.8, 0.2, 0.15 * q, 'bandpass', 0.4); break;
      case 'down': tone(70, 1.2, 0.5, 'sine', 25); noiseHit(600, 0.4, 1.4, 0.4, 'lowpass', 0.1, 0.05); break;
      case 'crash': tone(120, 0.3, 0.3, 'sine', 45); noiseHit(500, 0.6, 0.25, 0.25, 'lowpass', 0.3); break;
      case 'bump': tone(160, 0.2, 0.3, 'sine', 60); noiseHit(800, 0.8, 0.12, 0.2, 'bandpass', 0.5); break;
      case 'skim': noiseHit(2600, 0.7, 0.16, 0.08, 'highpass', 0.8); break;
      case 'bounce': tone(180, 0.22, 0.22, 'sine', 420); tone(90, 0.16, 0.16, 'triangle', 160, 0.02); noiseHit(900, 1.2, 0.12, 0.06, 'bandpass', 0.6); break;
      case 'spark': noiseHit(3500, 2, 0.04, 0.04, 'bandpass'); break;
      case 'flares': for (let i = 0; i < 3; i++) noiseHit(2200, 1, 0.15, 0.12, 'bandpass', 0.5, i * 0.06); break;
      case 'dodged': tone(660, 0.1, 0.06, 'triangle', 990); break;
      case 'missileDown': tone(880, 0.12, 0.06, 'triangle', 1320); break;
      case 'pickup': [784, 988, 1319].forEach((f, i) => tone(f, 0.12, 0.08, 'triangle', null, i * 0.06)); break;
      case 'crateSpawn': tone(523, 0.1, 0.04, 'triangle'); tone(659, 0.12, 0.04, 'triangle', null, 0.08); break;
      case 'overheat': noiseHit(6000, 1, 0.3, 0.08, 'highpass'); tone(300, 0.25, 0.05, 'square', 150); break;
      case 'empty': tone(220, 0.06, 0.05, 'square'); break;
      case 'six': tone(880, 0.08, 0.05, 'square'); tone(660, 0.08, 0.05, 'square', null, 0.1); break;
      case 'crownGone': noiseHit(1200, 0.5, 0.5, 0.2, 'bandpass', 0.3); break;
      case 'chute': noiseHit(400, 0.7, 0.3, 0.15, 'lowpass', 2); break;
      case 'land': tone(520, 0.05, 0.05, 'triangle'); break;
      case 'takeoff': noiseHit(700, 0.9, 0.2, 0.12, 'bandpass', 2); break;
      case 'stall': tone(330, 0.25, 0.05, 'sine', 200); break;
      case 'go': tone(523, 0.12, 0.12, 'triangle'); tone(784, 0.25, 0.12, 'triangle', null, 0.1); break;
      case 'roundEnd': [392, 523, 659, 784].forEach((f, i) => tone(f, 0.3, 0.07, 'triangle', null, 0.8 + i * 0.08)); break;
      case 'timeUp': [659, 523, 392].forEach((f, i) => tone(f, 0.25, 0.08, 'triangle', null, i * 0.12)); break;
      case 'select': tone(660, 0.07, 0.07, 'triangle'); tone(990, 0.09, 0.06, 'triangle', null, 0.06); break;
      case 'back': tone(440, 0.08, 0.06, 'triangle', 330); break;
      case 'tick': tone(880, 0.05, 0.05, 'triangle'); break;
      case 'trick': { if (e && e.weak) { tone(700, 0.08, 0.04, 'triangle'); break; } const base = 660 * Math.pow(1.122, Math.min(5, (e && e.combo) || 1) - 1); tone(base, 0.09, 0.07, 'triangle'); tone(base * 1.5, 0.14, 0.06, 'triangle', null, 0.07); break; }
      case 'legend': [523, 659, 784, 1047].forEach((f, i) => { tone(f, 0.5, 0.08, 'sawtooth', null, i * 0.07); tone(f * 2, 0.4, 0.03, 'triangle', null, i * 0.07); }); noiseHit(1200, 0.5, 0.8, 0.2, 'bandpass', 3); break;
      case 'sonic': tone(55, 0.5, 0.45, 'sine', 30); noiseHit(300, 0.6, 0.35, 0.35, 'lowpass', 0.4); tone(48, 0.4, 0.35, 'sine', 28, 0.13); noiseHit(260, 0.6, 0.3, 0.25, 'lowpass', 0.4, 0.13); break;
      case 'pop': noiseHit(1500, 0.8, 0.08, 0.25, 'bandpass', 0.5); tone(520, 0.08, 0.06, 'triangle', 260); break;
      case 'ring': [880, 1175, 1568].forEach((f, i) => tone(f, 0.14, 0.07, 'triangle', null, i * 0.05)); break;
      case 'lessonDone': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 0.08, 'triangle', null, i * 0.08)); break;
      case 'schoolDone': [392, 523, 659, 784, 1047].forEach((f, i) => { tone(f, 0.4, 0.08, 'triangle', null, i * 0.1); tone(f * 1.5, 0.3, 0.03, 'sine', null, i * 0.1 + 0.05); }); break;
      case 'points': tone(e && e.n > 1 ? 1047 : 880, 0.1, 0.07, 'triangle'); if (e && e.n > 1) tone(1319, 0.14, 0.06, 'triangle', null, 0.06); break;
      case 'caseTake': [659, 880, 1175].forEach((f, i) => tone(f, 0.12, 0.08, 'square', null, i * 0.05)); break;
      case 'caseSteal': [1175, 880, 1319].forEach((f, i) => tone(f, 0.1, 0.08, 'square', null, i * 0.05)); noiseHit(900, 0.8, 0.2, 0.2, 'bandpass', 0.5); break;
      case 'caseDrop': tone(660, 0.25, 0.07, 'triangle', 330); break;
      case 'enemyShot': noiseHit(1200, 0.8, 0.06, 0.07, 'bandpass', 0.5); tone(110, 0.05, 0.04, 'square', 60); break;
      case 'partDown': tone(70, 0.9, 0.5, 'sine', 30); noiseHit(700, 0.5, 1, 0.4, 'lowpass', 0.15); [523, 659, 784].forEach((f, i) => tone(f, 0.15, 0.06, 'triangle', null, 0.3 + i * 0.07)); break;
      case 'shieldDown': [880, 660, 880, 660].forEach((f, i) => tone(f, 0.12, 0.07, 'square', null, i * 0.13)); break;
      case 'bossRing': tone(300, 0.3, 0.08, 'sawtooth', 120); break;
      case 'bossDrone': tone(500, 0.2, 0.05, 'square', 900); break;
      case 'bossDown': tone(50, 2.2, 0.6, 'sine', 22); noiseHit(500, 0.4, 2.4, 0.5, 'lowpass', 0.08); [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.4, 0.08, 'triangle', null, 1.2 + i * 0.1)); break;
      case 'boltWarn': noiseHit(6500, 2, 1.3, 0.05, 'highpass', 1.2); tone(90, 1.2, 0.04, 'sawtooth', 140); break;
      case 'bolt': noiseHit(3000, 0.6, 0.18, 0.55, 'highpass', 0.5); noiseHit(260, 0.4, 2.6, 0.55, 'lowpass', 0.3, 0.08); tone(45, 1.8, 0.35, 'sine', 30, 0.05); break;
      case 'zap': tone(1400, 0.25, 0.09, 'square', 300); noiseHit(5000, 1.5, 0.25, 0.15, 'highpass'); break;
      case 'planeWarn': tone(70, 2.2, 0.08, 'sawtooth', 150); noiseHit(500, 0.5, 2.2, 0.15, 'bandpass', 2.2); break;
      case 'planePass': noiseHit(700, 0.5, 3.4, 0.35, 'bandpass', 0.35); tone(140, 3, 0.08, 'sawtooth', 70); break;
      case 'gust': noiseHit(700, 0.5, 1.6, 0.18, 'bandpass', 2.4); break;
      case 'gate': tone(880 + (e && e.n || 0) * 40, 0.12, 0.07, 'triangle', 1320); tone(1760, 0.08, 0.025, 'sine', null, 0.05); break;
      case 'lap': [659, 880, 1047, 1319].forEach((f, i) => tone(f, 0.16, 0.08, 'triangle', null, i * 0.07)); if (e && e.last) [1568, 1319, 1568].forEach((f, i) => tone(f, 0.12, 0.06, 'square', null, 0.35 + i * 0.1)); break;
      case 'raceFinish': [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.25, 0.08, 'triangle', null, i * 0.06)); break;
      case 'deliver': [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.18, 0.08, 'triangle', null, i * 0.06)); noiseHit(6000, 1, 0.3, 0.05, 'highpass'); break;
      case 'wave': tone(220, 0.5, 0.12, 'sawtooth', 330); tone(110, 0.6, 0.12, 'square', 165, 0.05); break;
      case 'caseNew': tone(660, 0.2, 0.05, 'triangle', 990); break;
      case 'cannonWarn': noiseHit(5200, 3, 1.25, 0.06, 'bandpass', 1.4); tone(180, 1.2, 0.03, 'square', 260); break;
      case 'cannon': tone(60, 0.9, 0.55, 'sine', 26); noiseHit(500, 0.5, 0.9, 0.5, 'lowpass', 0.12); noiseHit(2600, 0.6, 0.12, 0.25, 'bandpass', 0.3); break;
      case 'splash': noiseHit(1800, 0.5, 0.9, 0.3, 'bandpass', 0.25); noiseHit(300, 0.6, 0.5, 0.25, 'lowpass', 0.5); break;
      case 'fw': noiseHit(1600, 0.7, 0.25, 0.09, 'bandpass', 0.4); for (let i = 0; i < 6; i++) noiseHit(5000 + Math.random() * 3000, 4, 0.05, 0.03, 'bandpass', 1, 0.15 + Math.random() * 0.6); break;
      case 'ballDown': [988, 1319].forEach((f, i) => tone(f, 0.12, 0.07, 'triangle', null, i * 0.06)); break;
      case 'cannonHit': tone(120, 0.4, 0.3, 'sine', 50); break;
      case 'achievement': [784, 988, 1175, 1568].forEach((f, i) => { tone(f, 0.25, 0.08, 'triangle', null, i * 0.07); tone(f * 2, 0.2, 0.025, 'sine', null, i * 0.07); }); break;
      case 'glass': { const k = Math.min(1, 0.35 + (e && e.n || 1) * 0.08); noiseHit(7000, 1.5, 0.18, 0.12 * k, 'highpass'); for (let i = 0; i < 4; i++) tone(2600 + Math.random() * 2600, 0.12, 0.035 * k, 'triangle', null, i * 0.035 + Math.random() * 0.02); break; }
      case 'roll': noiseHit(1400, 1.2, 0.3, 0.18, 'bandpass', 2.2); break;
    }
  }
  // cada cuadro: turbinas y alarma de misil
  function update(G, cam, sw) {
    if (!ac || !eng.length) return;
    if (typeof Music !== 'undefined') Music.update(G);
    const t = ac.currentTime, quiet = G.state === 'attract';
    for (let i = 0; i < 2; i++) {
      const b = G.birds[i], e = eng[i];
      if (!b || !b.alive || b.perch || G.paused || G.freeze) { e.g.gain.setTargetAtTime(0, t, 0.1); e.og.gain.setTargetAtTime(0, t, 0.1); continue; }
      const k = clamp((b.s - 150) / 900, 0, 1), vol = quiet ? 0.2 : 1;
      e.f.frequency.setTargetAtTime(280 + k * k * 1800, t, 0.08);
      e.g.gain.setTargetAtTime((0.03 + k * k * 0.32) * vol, t, 0.08);
      e.osc.frequency.setTargetAtTime((b.boosting ? 150 : 95) + k * 50, t, 0.12);
      e.of.frequency.setTargetAtTime(b.boosting ? 1400 : 500, t, 0.1);
      e.og.gain.setTargetAtTime((b.boosting ? 0.07 : 0.02) * vol, t, 0.1);
      if (e.pan) e.pan.pan.setTargetAtTime(clamp((b.x - cam.x) * cam.z / (sw / 2), -0.8, 0.8), t, 0.1);
      // alarma: pita más rápido mientras más cerca está el misil
      const th = !quiet && G.canFight !== undefined ? Combat.threat(G, b) : null;
      if (th && (!G.bots[i])) {
        const period = clamp(th.d / 1400, 0.07, 0.5);
        if (t > alarm[i].t) { alarm[i].t = t + period; tone(i ? 1180 : 1040, 0.05, 0.07, 'square'); }
      }
    }
  }
  return { init, play, update, setOn, get on() { return on; }, audio() { return ac ? { ac, master, noiseBuf } : null; } };
})();
