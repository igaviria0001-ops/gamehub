/* =========================================================================
   SONIDO — todo sintetizado. Un sonido por elemento (rugido del fuego,
   chapoteo, silbido del viento, golpe sordo de piedra, crujido de raíces,
   estallido del rayo), más fusiones, golpes, esquives, fuentes y rondas.
   ========================================================================= */
const Sound = (() => {
  let ac = null, master = null, sfx = null, noiseBuf = null, on = Store.get('sound', true), lastT = {};
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume().catch(() => {}); return; }
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      master = ac.createGain(); master.gain.value = on ? 0.85 : 0;
      const comp = ac.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4;
      master.connect(comp); comp.connect(ac.destination);
      sfx = ac.createGain(); sfx.gain.value = 0.9; sfx.connect(master);
      const len = ac.sampleRate * 2; noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ac = null; }
    if (ac && typeof Music !== 'undefined') Music.start(ac, master);
  }
  function setOn(v) { on = !!v; Store.set('sound', on); if (master) master.gain.value = on ? 0.85 : 0; }
  function noise(freq, q, dur, vol, type = 'bandpass', sweep = 1, delay = 0, attack = 0.01) {
    if (!ac || !on) return;
    const t = ac.currentTime + delay, src = ac.createBufferSource(); src.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(freq, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, freq * sweep), t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(sfx); src.start(t, Math.random()); src.stop(t + dur + 0.05);
  }
  function tone(freq, dur, vol, type = 'sine', to = null, delay = 0, attack = 0.008) {
    if (!ac || !on) return;
    const t = ac.currentTime + delay, o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(sfx); o.start(t); o.stop(t + dur + 0.05);
  }
  const chime = (notes, gap = 0.06, vol = 0.06, type = 'triangle') => notes.forEach((f, i) => tone(f, 0.25, vol, type, null, i * gap));
  // hechizo por elemento (q = qué tan grande)
  function cast(el, q = 1) {
    switch (el) {
      case 'fire': noise(900, 0.7, 0.35 * q, 0.22, 'lowpass', 2.5, 0, 0.03); noise(2500, 1, 0.15, 0.06, 'bandpass', 0.5); break;
      case 'water': noise(1200, 2, 0.22 * q, 0.16, 'bandpass', 0.4); tone(600, 0.12, 0.05, 'sine', 300); break;
      case 'wind': noise(800, 1.5, 0.35 * q, 0.2, 'bandpass', 3, 0, 0.05); break;
      case 'earth': tone(120, 0.25 * q, 0.28, 'sine', 60); noise(400, 1, 0.18, 0.18, 'lowpass', 0.5); break;
      case 'plant': noise(2600, 4, 0.12, 0.08, 'bandpass', 0.7); tone(330, 0.15, 0.05, 'triangle', 500); noise(1400, 6, 0.2, 0.05, 'bandpass', 1.3, 0.05); break;
      case 'bolt': noise(5000, 0.5, 0.08, 0.2, 'highpass'); tone(1800, 0.06, 0.06, 'square', 200); break;
      case 'light': tone(1400, 0.16 * q, 0.07, 'sine', 2300); tone(2093, 0.22 * q, 0.04, 'triangle', 2637, 0.03); noise(6000, 2, 0.1, 0.05, 'highpass'); break;
      case 'shadow': tone(150, 0.3 * q, 0.16, 'sawtooth', 70); noise(500, 1.2, 0.3 * q, 0.12, 'lowpass', 0.4); tone(311, 0.25, 0.04, 'sine', 233, 0.05); break;
    }
  }
  function play(name, e = {}) {
    if (!ac || !on) return;
    const now = ac.currentTime; if (lastT[name] && now - lastT[name] < 0.03) return; lastT[name] = now;
    switch (name) {
      case 'hurt': tone(220, 0.12, 0.12, 'triangle', 110); noise(1800, 1, 0.08, 0.1, 'bandpass'); break;
      case 'boom': tone(80, 0.6, 0.45, 'sine', 30); noise(800, 0.5, 0.7, 0.4, 'lowpass', 0.2); break;
      case 'thunder': noise(3000, 0.3, 0.12, 0.3, 'highpass'); tone(60, e.big ? 0.9 : 0.4, e.big ? 0.4 : 0.15, 'sine', 30); noise(300, 0.6, e.big ? 1.1 : 0.4, e.big ? 0.3 : 0.12, 'lowpass', 0.3, 0.05); break;
      case 'down': tone(180, 1.2, 0.3, 'triangle', 40); noise(500, 0.5, 1.2, 0.3, 'lowpass', 0.2); chime([659, 523, 392, 330], 0.12, 0.05, 'sine'); break;
      case 'dash': noise(1500, 1, 0.16, 0.12, 'bandpass', 2.2, 0, 0.02); break;
      case 'graze': tone(1320, 0.12, 0.05, 'triangle', 1760); break;
      case 'absorb': chime([392, 523, 659, 784], 0.05, 0.05, 'sine'); noise(1200, 3, 0.4, 0.06, 'bandpass', 2); break;
      case 'deny': tone(180, 0.08, 0.06, 'square'); break;
      case 'fusion': tone(220, 0.5, 0.1, 'sawtooth', 440); tone(330, 0.5, 0.06, 'triangle', 660); noise(2000, 0.8, 0.4, 0.1, 'bandpass', 0.4); break;
      case 'granStart': tone(110, 1.0, 0.16, 'sawtooth', 440, 0, 0.6); tone(220, 1.0, 0.1, 'triangle', 880, 0.05, 0.6); noise(1800, 0.7, 1.0, 0.12, 'bandpass', 3, 0, 0.7); chime([392, 494, 587, 784], 0.16, 0.05, 'sine'); break;
      case 'gran': chime([523, 659, 784, 1047, 1319, 1568], 0.05, 0.1, 'triangle'); tone(70, 1.6, 0.5, 'sine', 30); tone(110, 1.4, 0.3, 'sawtooth', 55); noise(600, 0.5, 1.4, 0.32, 'lowpass', 0.3); noise(4000, 1, 0.5, 0.15, 'highpass', 0.5); break;
      case 'embReady': chime([784, 988, 1175], 0.07, 0.06, 'sine'); break;
      case 'combo': chime(e.n ? [659, 880] : [659, 880, 1109], 0.06, 0.06, 'triangle'); break;
      case 'freeze': noise(6000, 2, 0.4, 0.1, 'bandpass', 0.5); tone(1800, 0.3, 0.04, 'sine', 2600); break;
      case 'shatter': noise(5000, 1, 0.3, 0.16, 'highpass'); chime([2093, 1760, 2349], 0.03, 0.04, 'sine'); break;
      case 'wall': tone(90, 0.4, 0.3, 'sine', 50); noise(300, 0.7, 0.4, 0.25, 'lowpass', 0.4); break;
      case 'wallBreak': noise(500, 0.6, 0.4, 0.25, 'lowpass', 0.3); tone(100, 0.2, 0.2, 'sine', 50); break;
      case 'electrify': noise(4000, 0.8, 0.5, 0.12, 'bandpass', 0.6); break;
      case 'reflect': tone(900, 0.12, 0.08, 'triangle', 1800); noise(2000, 1.5, 0.12, 0.08, 'bandpass', 2); break;
      case 'clash': noise(2500, 1, 0.12, 0.12, 'bandpass', 0.5); tone(400, 0.08, 0.06, 'square', 200); break;
      case 'steam': noise(4000, 0.5, 0.5, 0.08, 'highpass', 0.6, 0, 0.05); break;
      case 'beam': tone(160, 0.5, 0.3, 'sawtooth', 80); noise(1500, 0.4, 0.5, 0.25, 'bandpass', 0.5); break;
      case 'tzap': noise(5000, 1, 0.05, 0.06, 'highpass'); break;
      case 'bounce': tone(1400, 0.05, 0.05, 'square', 900); break;
      case 'round': chime([392, 494, 587], 0.1, 0.06, 'triangle'); break;
      case 'go': chime([523, 784], 0.08, 0.1, 'triangle'); noise(800, 0.6, 0.4, 0.1, 'bandpass', 3); break;
      case 'count': tone(660, 0.1, 0.06, 'triangle'); break;
      case 'roundWin': chime([523, 659, 784], 0.1, 0.08, 'triangle'); break;
      case 'matchWin': chime([523, 659, 784, 1047, 784, 1047], 0.12, 0.09, 'triangle'); break;
      case 'mist': tone(110, 1.6, 0.18, 'sawtooth', 98); noise(400, 2, 1.6, 0.08, 'bandpass', 0.6, 0, 0.4); break;
      case 'select': tone(660, 0.08, 0.05, 'triangle', 880); break;
      case 'ray': if (e && e.small) { tone(1760, 0.1, 0.035, 'sine', 2637); break; } tone(880, 0.35, 0.1, 'sawtooth', 1760); tone(1320, 0.4, 0.07, 'sine', 2637); noise(5000, 0.6, 0.3, 0.1, 'highpass'); break;
      case 'blink': noise(900, 0.8, 0.22, 0.2, 'bandpass', 0.25); tone(420, 0.2, 0.1, 'sine', 90); tone(90, 0.3, 0.14, 'sine', 180, 0.12); break;
      case 'mirage': chime([1568, 2093, 1568, 2637], 0.05, 0.05, 'sine'); noise(3000, 2, 0.4, 0.05, 'bandpass', 2); break;
      case 'decoyPop': chime([2637, 2093], 0.04, 0.06, 'triangle'); noise(6000, 1, 0.12, 0.08, 'highpass'); break;
      case 'wispGo': tone(520, 0.25, 0.07, 'sine', 1040); noise(2000, 2, 0.2, 0.05, 'bandpass', 2); break;
      case 'bossWarn': tone(196, 0.35, 0.12, 'sawtooth', 247); tone(98, 0.4, 0.14, 'sine', 123); break;
      case 'bossExposed': chime([523, 784, 1047, 1568], 0.07, 0.09, 'triangle'); noise(2500, 0.8, 0.5, 0.12, 'bandpass', 2); break;
      case 'retarget': tone(1180, 0.05, 0.035, 'triangle', 1560); tone(1560, 0.05, 0.025, 'sine', 1760, 0.04); break;
      case 'back': tone(520, 0.08, 0.05, 'triangle', 390); break;
      case 'fall': tone(500, 0.6, 0.12, 'sine', 80); break;
      case 'counter': chime([1319, 1760, 2093], 0.04, 0.09, 'triangle'); noise(3000, 1, 0.25, 0.15, 'bandpass', 2); tone(220, 0.4, 0.12, 'sawtooth', 880); break;
      case 'ram': tone(140, 0.2, 0.3, 'sine', 60); noise(900, 0.8, 0.15, 0.2, 'bandpass', 0.5); break;
      case 'rune': chime([784, 988, 1175, 1568], 0.06, 0.08, 'triangle'); break;
      case 'runeSpawn': chime([523, 659], 0.12, 0.05, 'sine'); break;
      case 'shieldHit': tone(1600, 0.12, 0.06, 'sine', 2400); break;
      case 'bushGone': noise(600, 0.5, 0.5, 0.1, 'lowpass', 0.4); break;
      case 'beat': tone(62, 0.12, 0.22, 'sine', 45); tone(58, 0.12, 0.16, 'sine', 42, 0.17); break;
      case 'vs': noise(900, 0.6, 0.5, 0.18, 'bandpass', 3, 0, 0.05); tone(70, 1.1, 0.42, 'sine', 32, 0.42); noise(500, 0.5, 1, 0.28, 'lowpass', 0.3, 0.42); chime([392, 523, 784, 1047], 0.08, 0.07, 'triangle'); break;
    }
  }
  function onEvent(G, e) {
    if (!ac || !on) return;
    switch (e.type) {
      case 'cast': if (e.fusion) play('fusion'); else cast(e.el, e.level === 2 ? 1.6 : 1); if (e.fusion) cast(e.fusion.split('+')[1], 1.3); break;
      case 'hurt': if (!e.dot) play('hurt'); break;
      case 'boom': play('boom'); break; case 'thunder': play('thunder', e); break; case 'down': play('down'); break; case 'dash': play('dash'); break;
      case 'absorb': play('absorb'); break; case 'gran': play('gran'); break; case 'granStart': play('granStart'); break; case 'embReady': play('embReady'); break;
      case 'combo': play(e.key === 'porunpelo' ? 'graze' : 'combo', e); break; case 'freeze': play('freeze'); break; case 'shatter': play('shatter'); break;
      case 'wall': play('wall'); break; case 'wallBreak': play('wallBreak'); break; case 'electrify': play('electrify'); break; case 'reflect': play('reflect'); break;
      case 'clash': play(e.kind === 'vapor' ? 'steam' : 'clash'); break; case 'beam': play('beam'); break; case 'tzap': play('tzap'); break; case 'bounce': play('bounce'); break;
      case 'round': play('round'); break; case 'go': play('go'); break; case 'roundWin': play('roundWin'); break; case 'matchWin': play('matchWin'); break; case 'mist': play('mist'); break;
      case 'fall': play('fall'); break; case 'counter': play('counter'); break; case 'ram': play('ram'); break; case 'rune': play('rune'); break; case 'runeSpawn': play('runeSpawn'); break; case 'shieldHit': play('shieldHit'); break; case 'arenaEvent': play('mist'); break; case 'statueShot': cast('earth', 1.4); break; case 'bushGone': play('bushGone'); break; case 'quake': play('boom'); break; case 'intro': play('vs'); break; case 'retarget': if (!G.attract) play('retarget'); break; case 'ray': play('ray', e); break; case 'blink': play('blink'); break; case 'mirage': play('mirage'); break; case 'decoyPop': play('decoyPop'); break; case 'wispGo': play('wispGo'); break; case 'bossWarn': play('bossWarn'); break; case 'bossExposed': play('bossExposed'); break;
    }
  }
  return { init, play, onEvent, setOn, get on() { return on; }, get ac() { return ac; } };
})();
