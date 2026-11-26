/* =========================================================================
   VOCES — la «lengua mágica»: cada personaje habla con sílabas inventadas
   que siguen el ritmo y las vocales de su frase en español (la misma frase
   suena siempre igual), con subtítulos. Todo sintetizado:
   · fuente de voz (sierra con su tono) por tres filtros de formantes que
     se deslizan de vocal en vocal; consonantes de ruido (s, f, j) o golpes
     cortos (k, t, p); entonación: baja al final, sube en las preguntas,
     más fuerte y más aguda en las exclamaciones.
   · cada uno su timbre: tono, «tamaño» de la boca, rapidez, aire, voz
     rasposa, eco, coro de varias voces y, para el Borrón, la voz al revés.
   Los magos también tienen voz en todos los modos (al fundir, el Gran
   Sortilegio, al caer y al ganar). En Opciones: voces sí/no y volumen.
   ========================================================================= */
const VOICES = {
  // historia del Mundo 3
  sumi: { name: 'Sumi', col: '#ffe2a8', f0: 330, fs: 1.28, rate: 13, breath: 0.12, glide: 0.25, g: 1.3 },
  kitsune: { name: 'Kitsune', col: '#ffb27a', f0: 255, fs: 1.15, rate: 10.5, breath: 0.45, echo: 0.35, slide: 0.25, g: 2 },
  raijin: { name: 'Raijin', col: '#d7b8ff', f0: 78, fs: 0.76, rate: 7, rasp: 0.6, echo: 0.35, verb: 0.6, g: 0.22 },
  fujin: { name: 'Fujin', col: '#bff5dc', f0: 138, fs: 0.95, rate: 9, breath: 0.85, echo: 0.25, g: 3.4 },
  orochi: { name: 'Yamata no Orochi', col: '#ff8a6a', f0: 66, fs: 0.7, rate: 6, rasp: 0.45, choir: 6, verb: 0.5, g: 0.2 },
  borron: { name: 'El Borrón', col: '#c9b8ff', f0: 92, fs: 0.84, rate: 8, rasp: 0.3, choir: 3, reverse: true, verb: 0.5, g: 0.2 },
  yukionna: { name: 'Yuki-onna', col: '#e2f2ff', f0: 290, fs: 1.2, rate: 8, breath: 0.7, echo: 0.45, g: 3.2 },
  // magos (tono y tamaño de boca de cada uno)
  candela: { f0: 220, fs: 1.12, rate: 12 }, yuma: { f0: 172, fs: 1.02, rate: 11 }, frailejon: { f0: 112, fs: 0.86, rate: 9, breath: 0.2 }, purace: { f0: 104, fs: 0.84, rate: 10, rasp: 0.25 },
  iguaque: { f0: 236, fs: 1.15, rate: 11, breath: 0.2 }, catatumbo: { f0: 132, fs: 0.9, rate: 12, rasp: 0.15 }, cocuy: { f0: 205, fs: 1.08, rate: 11 }, tatacoa: { f0: 124, fs: 0.9, rate: 10, breath: 0.3 },
  galeras: { f0: 110, fs: 0.86, rate: 11, rasp: 0.3 }, zuhe: { f0: 245, fs: 1.18, rate: 12, verb: 0.2 }, chia: { f0: 262, fs: 1.2, rate: 10, echo: 0.2 }, mapale: { f0: 186, fs: 1.04, rate: 13, breath: 0.25 },
  tota: { f0: 160, fs: 0.98, rate: 9, echo: 0.2 }, fuji: { f0: 134, fs: 0.92, rate: 10 }, yoshino: { f0: 250, fs: 1.18, rate: 12, breath: 0.2 },
};
const Voice = (() => {
  let on = Store.get('voice', true), vol = Store.get('voiceVol', 0.8), out = null, verbBuf = null, busy = {};
  const subs = [];
  const VOW = { a: [730, 1240, 2500], e: [480, 1780, 2500], i: [300, 2240, 2950], o: [500, 880, 2400], u: [330, 760, 2300] };
  function ctx() {
    const ac = Sound.ac; if (!ac || !Sound.master) return null;
    if (!out || out.context !== ac) { out = ac.createGain(); out.gain.value = on ? vol : 0; out.connect(Sound.master); verbBuf = null; }
    return ac;
  }
  // reverberación: ruido que se apaga (sala de templo)
  function verb(ac) {
    if (verbBuf) return verbBuf; const len = Math.floor(ac.sampleRate * 1.6); verbBuf = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = verbBuf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    return verbBuf;
  }
  // frase → sílabas (consonante + vocal), siempre igual para el mismo texto
  function syllables(text) {
    const s = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/y(?=[^aeiou]|$)/g, 'i').replace(/[^a-zñ!?¿¡ ,.]/g, '');
    const out = [], re = /([^aeiou ,.!?¿¡]*)([aeiou]+)|([ ,.!?¿¡]+)/g; let m;
    while ((m = re.exec(s)) && out.length < 48) { if (m[3]) { if (/[,.]/.test(m[3])) out.push({ pause: /[.]/.test(m[3]) ? 0.22 : 0.12 }); continue; } out.push({ c: m[1].slice(-1), v: m[2][0] }); }
    return out;
  }
  // arma la voz en un contexto (el de verdad o uno sin parlantes para ponerla al revés)
  function build(ac, dest, t0, P, syl, loud, ask, pitchK = 1) {
    let t = t0; const dur = 1 / P.rate, N = syl.length;
    const src = ac.createOscillator(); src.type = 'sawtooth';
    const nsrc = ac.createBufferSource(); nsrc.buffer = Sound.noise || mkNoise(ac); nsrc.loop = true;
    const vg = ac.createGain(); vg.gain.value = 0.0001; const ng = ac.createGain(); ng.gain.value = 0.0001; const cg = ac.createGain(); cg.gain.value = 0.0001;
    const F = [0, 1, 2].map(k => { const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.Q.value = [7, 11, 14][k]; const g = ac.createGain(); g.gain.value = [1, 0.55, 0.28][k]; b.connect(g); g.connect(dest); return b; });
    const cf = ac.createBiquadFilter(); cf.type = 'bandpass'; cf.Q.value = 2.5; cf.connect(cg); cg.connect(dest);
    src.connect(vg); nsrc.connect(ng); for (const b of F) { vg.connect(b); ng.connect(b); } nsrc.connect(cf);
    const breath = P.breath || 0, f0 = P.f0 * pitchK * (loud ? 1.12 : 1);
    src.frequency.setValueAtTime(f0, t);
    syl.forEach((s, k) => {
      if (s.pause) { vg.gain.setTargetAtTime(0.0001, t, 0.02); ng.gain.setTargetAtTime(0.0001, t, 0.02); t += s.pause; return; }
      const fr = VOW[s.v] || VOW.a, decl = 1 - 0.16 * (k / Math.max(1, N - 1)), rise = ask && k >= N - 2 ? 1.3 + (k - N + 2) * 0.12 : 1, jit = 1 + 0.07 * Math.sin(k * 1.9 + f0) + (P.slide ? P.slide * Math.sin(k * 0.8) : 0);
      const fq = f0 * decl * rise * jit, d = dur * (0.85 + 0.3 * ((k * 7) % 3) / 2) * (k === N - 1 ? 1.5 : 1);
      // consonante: ruido (s, f, j, z, c) o golpe corto (k, t, p, b, d, g)
      if (s.c) { const fric = 'sfjzcxh'.includes(s.c), stop = 'ktpbdgq'.includes(s.c), nas = 'mnñ'.includes(s.c);
        if (fric) { cf.frequency.setValueAtTime(s.c === 's' || s.c === 'z' || s.c === 'c' ? 5200 : 2200, t); cg.gain.setValueAtTime(0.0001, t); cg.gain.exponentialRampToValueAtTime(0.06 * (loud ? 1.3 : 1), t + 0.02); cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.07); t += 0.05; }
        else if (stop) { cf.frequency.setValueAtTime(s.c === 'k' || s.c === 'g' || s.c === 'q' ? 1800 : 3200, t); cg.gain.setValueAtTime(0.0001, t); cg.gain.exponentialRampToValueAtTime(0.08, t + 0.004); cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.025); t += 0.02; }
        else if (nas) { F[0].frequency.setValueAtTime(260 * P.fs, t); F[1].frequency.setValueAtTime(1100 * P.fs, t); F[2].frequency.setValueAtTime(2400 * P.fs, t); vg.gain.setTargetAtTime(0.06, t, 0.01); t += 0.035; } }
      src.frequency.linearRampToValueAtTime(fq, t + d * 0.3); src.frequency.linearRampToValueAtTime(fq * (P.glide ? 1 + P.glide * 0.3 : 0.98), t + d);
      for (let q = 0; q < 3; q++) { F[q].frequency.setTargetAtTime(fr[q] * P.fs, t, 0.025); }
      const amp = (loud ? 0.2 : 0.15) * (1 - breath * 0.5);
      vg.gain.setTargetAtTime(amp, t, 0.012); vg.gain.setTargetAtTime(amp * 0.7, t + d * 0.55, 0.03);
      ng.gain.setTargetAtTime(0.05 * breath + 0.004, t, 0.015);
      t += d;
      vg.gain.setTargetAtTime(0.0001, t - 0.012, 0.02);
    });
    vg.gain.setTargetAtTime(0.0001, t, 0.03); ng.gain.setTargetAtTime(0.0001, t, 0.03);
    src.start(t0); src.stop(t + 0.3); nsrc.start(t0); nsrc.stop(t + 0.3);
    return t - t0;
  }
  let nb = null; function mkNoise(ac) { if (nb && nb.sampleRate === ac.sampleRate) return nb; nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return nb; }
  // la salida: voz seca + aspereza + eco + sala; el coro son varias voces un poco corridas
  function chain(ac, P, dest) {
    const inp = ac.createGain(); inp.gain.value = (P.g || 2.2); let node = inp;
    if (P.rasp) { const ws = ac.createWaveShaper(), k = P.rasp * 40, n = 1024, cv = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; cv[i] = (1 + k) * x / (1 + k * Math.abs(x)); } ws.curve = cv; const g = ac.createGain(); g.gain.value = 1 / (1 + P.rasp * 1.5); node.connect(ws); ws.connect(g); node = g; }
    node.connect(dest);
    if (P.echo) { const d = ac.createDelay(1); d.delayTime.value = 0.19; const fb = ac.createGain(); fb.gain.value = P.echo * 0.55; const wg = ac.createGain(); wg.gain.value = P.echo; node.connect(d); d.connect(fb); fb.connect(d); d.connect(wg); wg.connect(dest); }
    if (P.verb) { const cv = ac.createConvolver(); cv.buffer = verb(ac); const wg = ac.createGain(); wg.gain.value = P.verb * 0.5; node.connect(cv); cv.connect(wg); wg.connect(dest); }
    return inp;
  }
  function say(who, text, o = {}) {
    const P = Object.assign({}, VOICES[who] || VOICES.sumi, o.voice || {}), loud = /!/.test(text) || o.loud, ask = /\?/.test(text), syl = syllables(text);
    const dur = syl.reduce((s, x) => s + (x.pause || 1.12 / P.rate + (x.c ? 0.035 : 0)), 0) + 0.25;
    if (o.sub !== false && (VOICES[who] && VOICES[who].name)) subs.push({ who, name: VOICES[who].name, col: VOICES[who].col, text, t: 0, life: Math.max(1.8, dur + 0.9) });
    if (subs.length > 3) subs.splice(0, subs.length - 3);
    const ac = on ? ctx() : null; if (!ac || !on || !syl.length) return dur;
    const t0 = ac.currentTime + (o.delay || 0) + 0.02;
    if (P.reverse) {
      // al revés: se arma sin parlantes, se da vuelta y se toca
      const len = Math.ceil((dur + 0.6) * 22050), oc = new OfflineAudioContext(1, len, 22050), d = chain(oc, Object.assign({}, P, { echo: 0, verb: 0 }), oc.destination);
      const n = Math.max(1, P.choir || 1); for (let k = 0; k < n; k++) build(oc, d, 0.05 + k * 0.012, P, syl, loud, ask, 1 + (k - (n - 1) / 2) * 0.03);
      oc.startRendering().then(buf => { const a = buf.getChannelData(0); a.reverse(); const b = ac.createBuffer(1, buf.length, buf.sampleRate); b.copyToChannel(a, 0); const s = ac.createBufferSource(); s.buffer = b; const g = ac.createGain(); g.gain.value = 0.9 / Math.sqrt(n); s.connect(g); g.connect(chain(ac, Object.assign({}, P, { rasp: 0 }), out)); s.start(Math.max(ac.currentTime, t0)); }).catch(() => {});
      return dur;
    }
    const n = Math.max(1, P.choir || 1), dest = ac.createGain(); dest.gain.value = 1 / Math.sqrt(n); dest.connect(chain(ac, P, out));
    for (let k = 0; k < n; k++) build(ac, dest, t0 + k * 0.011, P, syl, loud, ask, 1 + (k - (n - 1) / 2) * 0.028);
    return dur;
  }
  // gritos cortos de los magos (sin subtítulo), con variaciones para que no se repitan
  const SHOUT = { fusion: ['¡Ha!', '¡Hai!', '¡Ya!', '¡Sei!'], gran: ['¡Haaaa-ya!', '¡Sortilegio!', '¡Ahora!'], hurt: ['¡Uh!', '¡Ah!', '¡Ugh!'], fall: ['¡Aaah...!', '¡Nooo...!'], win: ['¡Lo logré!', '¡Así se hace!', '¡Ja!'], dash: ['¡Hup!'] };
  function shout(cid, kind) {
    if (!on) return; const now = performance.now(); if (busy[cid] && now < busy[cid]) return; const L = SHOUT[kind]; if (!L) return;
    const txt = L[(Math.random() * L.length) | 0], d = say(cid, txt, { sub: false, loud: true }); busy[cid] = now + Math.max(350, d * 900);
  }
  function setOn(v) { on = !!v; Store.set('voice', on); if (out) out.gain.value = on ? vol : 0; }
  function setVol(v) { vol = clamp(+v, 0, 1); Store.set('voiceVol', vol); if (out) out.gain.value = on ? vol : 0; }
  // subtítulos: abajo al centro, con el nombre de quien habla en su color
  function drawSubs(x, sw, sh, dt) {
    for (let k = subs.length - 1; k >= 0; k--) { subs[k].t += dt; if (subs[k].t > subs[k].life) subs.splice(k, 1); }
    if (!subs.length) return; const u = Math.min(1.25, Math.max(0.7, Math.min(sw / 1280, sh / 720)));
    let y = sh - 70 * u - (typeof getInsets === 'function' ? getInsets().bottom : 0);
    for (let k = subs.length - 1; k >= 0; k--) {
      const s = subs[k], a = Math.min(1, s.t * 5, (s.life - s.t) * 3); x.save(); x.globalAlpha = a; x.font = fontB(17 * u, 800); x.textAlign = 'center'; x.textBaseline = 'middle';
      const tw = Math.min(sw * 0.86, x.measureText(s.text).width + 40 * u), name = s.name.toUpperCase();
      x.fillStyle = 'rgba(16,10,20,0.72)'; x.beginPath(); x.roundRect ? x.roundRect(sw / 2 - tw / 2, y - 18 * u, tw, 36 * u, 10 * u) : x.rect(sw / 2 - tw / 2, y - 18 * u, tw, 36 * u); x.fill();
      x.fillStyle = '#fbf4e6'; x.fillText(s.text, sw / 2, y + 1, sw * 0.84);
      x.font = fontB(11.5 * u, 900); x.fillStyle = s.col; x.fillText(name, sw / 2, y - 25 * u);
      x.restore(); y -= 58 * u;
    }
  }
  // para las pruebas (y para armar voces por adelantado): la frase en un contexto sin parlantes
  function render(who, text) {
    const P = Object.assign({}, VOICES[who] || VOICES.sumi), syl = syllables(text), dur = syl.reduce((s, x) => s + (x.pause || 1.12 / P.rate + (x.c ? 0.035 : 0)), 0) + 0.6;
    const oc = new OfflineAudioContext(1, Math.ceil(dur * 22050), 22050), d = chain(oc, P, oc.destination), n = Math.max(1, P.choir || 1);
    for (let k = 0; k < n; k++) build(oc, d, 0.02 + k * 0.011, P, syl, /!/.test(text), /\?/.test(text), 1 + (k - (n - 1) / 2) * 0.028);
    return oc.startRendering().then(b => { const a = b.getChannelData(0); if (P.reverse) a.reverse(); return a; });
  }
  return { say, shout, setOn, setVol, drawSubs, syllables, render, get on() { return on; }, get vol() { return vol; }, subs };
})();
