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
  kitsune: { name: 'Kitsune', col: '#ffb27a', f0: 255, fs: 1.15, rate: 10.5, breath: 0.45, echo: 0.35, slide: 0.25, g: 3.2 },
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
  let on = Store.get('voice', true), vol = Store.get('voiceVol', 1), out = null, verbBuf = null, busy = {};
  const subs = [], BOOST = 2.1; // (antes las voces sonaban muy bajito)
  const VOW = { a: [730, 1240, 2500], e: [480, 1780, 2500], i: [300, 2240, 2950], o: [500, 880, 2400], u: [330, 760, 2300] };
  function ctx() {
    const ac = Sound.ac; if (!ac || !Sound.master) return null;
    if (!out || out.context !== ac) { out = ac.createGain(); out.gain.value = on ? vol * BOOST : 0; out.connect(Sound.master); verbBuf = null; }
    return ac;
  }
  // reverberación: ruido que se apaga (sala de templo)
  function verb(ac) {
    if (verbBuf) return verbBuf; const len = Math.floor(ac.sampleRate * 2.4); verbBuf = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = verbBuf.getChannelData(ch); let lp = 0; for (let i = 0; i < len; i++) { lp += ((Math.random() * 2 - 1) - lp) * (0.35 - 0.25 * i / len); d[i] = lp * Math.pow(1 - i / len, 3) * (i < ac.sampleRate * 0.012 ? i / (ac.sampleRate * 0.012) : 1); } }
    return verbBuf;
  }
  // frase → moras de la lengua mágica (consonante + vocal, o una «n» sola), siempre igual para el mismo texto.
  // Suena a idioma de verdad: las consonantes del español pasan a un juego propio (k, s, sh, t, ts, h, m, n, r, y, w, g, d, b, p),
  // las palabras llevan su acento de tono (sube en la segunda mora, cae después del acento) y el ritmo es parejo, de mora en mora.
  const CMAP = { b: 'b', v: 'b', c: 'k', k: 'k', q: 'k', d: 'd', t: 't', f: 'h', j: 'h', h: 'h', g: 'g', l: 'r', r: 'r', m: 'm', n: 'n', ñ: 'ny', p: 'p', s: 's', z: 's', x: 'sh', y: 'y', w: 'w' };
  function syllables(text) {
    const s = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ch/g, 'x').replace(/ll/g, 'y').replace(/y(?=[^aeiou]|$)/g, 'i').replace(/[^a-zñ!?¿¡ ,.…]/g, '');
    const out = [], re = /([^aeiou ,.!?¿¡…]*)([aeiou]+)|([ ,.!?¿¡…]+)/g; let m, wordK = 0, wi = 0, h = 7;
    while ((m = re.exec(s)) && out.length < 56) {
      if (m[3]) { if (/[,.…]/.test(m[3])) out.push({ pause: /[.…]/.test(m[3]) ? 0.24 : 0.13 }); else if (/ /.test(m[3])) out.push({ gap: 1 }); wordK++; wi = 0; continue; }
      for (const ch of m[1] + m[2]) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      const c0 = m[1].slice(-1), c = CMAP[c0] || (c0 ? 'k' : ''), v = m[2][0], v2 = m[2][1];
      // «t» antes de «i/u» se vuelve «ch/ts», «s» antes de «i» se vuelve «sh» (como en japonés)
      const cc = c === 't' && v === 'i' ? 'ch' : c === 't' && v === 'u' ? 'ts' : c === 's' && v === 'i' ? 'sh' : c === 'h' && v === 'u' ? 'f' : c;
      out.push({ c: cc, v, w: wordK, i: wi++, acc: (h % 5) });
      if (v2 && v2 !== v) out.push({ c: '', v: v2, w: wordK, i: wi++, acc: (h % 5), tail: 1 });
      // consonante suelta al final de la palabra: n → mora nasal; otras, una vocal corta muda
      const rest = s.slice(re.lastIndex).match(/^[^aeiou ,.!?¿¡…]+(?=[ ,.!?¿¡…]|$)/);
      if (rest) { const l = rest[0].slice(-1); out.push(l === 'n' || l === 'm' ? { c: 'N', v: 'u', w: wordK, i: wi++, acc: 9 } : { c: CMAP[l] || 'k', v: 'u', w: wordK, i: wi++, acc: 9, dev: 1 }); re.lastIndex += rest[0].length; }
    }
    return out;
  }
  // arma la voz en un contexto (el de verdad o uno sin parlantes para ponerla al revés).
  // Fuente: sierra suavizada (inclinación de la glotis) + triángulo para el pecho, con vibrato y temblor humanos;
  // cuatro formantes que se deslizan de vocal en vocal; consonantes con su cierre, su explosión o su soplido.
  function build(ac, dest, t0, P, syl, loud, ask, pitchK = 1) {
    let t = t0; const mora = 1 / P.rate, N = syl.length;
    const src = ac.createOscillator(); src.type = 'sawtooth'; const tri = ac.createOscillator(); tri.type = 'triangle';
    const tilt = ac.createBiquadFilter(); tilt.type = 'lowpass'; tilt.frequency.value = 2600 * P.fs; tilt.Q.value = 0.6;
    const vib = ac.createOscillator(); vib.frequency.value = 5.2 + (P.f0 % 7) * 0.12; const vg2 = ac.createGain(); vg2.gain.value = 0; vib.connect(vg2); vg2.connect(src.detune); vg2.connect(tri.detune);
    const jit = ac.createOscillator(); jit.frequency.value = 1.3; const jg = ac.createGain(); jg.gain.value = 7; jit.connect(jg); jg.connect(src.detune); jg.connect(tri.detune);
    vg2.gain.setValueAtTime(0, t0); vg2.gain.linearRampToValueAtTime(14 + (P.breath || 0) * 10, t0 + 0.35);
    const nsrc = ac.createBufferSource(); nsrc.buffer = Sound.noise || mkNoise(ac); nsrc.loop = true;
    const vg = ac.createGain(); vg.gain.value = 0.0001; const ng = ac.createGain(); ng.gain.value = 0.0001; const cg = ac.createGain(); cg.gain.value = 0.0001;
    const tg = ac.createGain(); tg.gain.value = 0.55;
    const F = [0, 1, 2, 3].map(k => { const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.Q.value = [5.5, 8, 11, 12][k]; const g = ac.createGain(); g.gain.value = [1, 0.62, 0.3, 0.12][k]; b.connect(g); g.connect(dest); return b; });
    const body = ac.createBiquadFilter(); body.type = 'lowpass'; body.frequency.value = 520 * P.fs; const bg = ac.createGain(); bg.gain.value = 0.16; body.connect(bg); bg.connect(dest);
    const cf = ac.createBiquadFilter(); cf.type = 'bandpass'; cf.Q.value = 1.8; cf.connect(cg); cg.connect(dest);
    src.connect(tilt); tri.connect(tg); tg.connect(tilt); tilt.connect(vg); vg.connect(body); nsrc.connect(ng); for (const b of F) { vg.connect(b); ng.connect(b); } nsrc.connect(cf);
    F[3].frequency.value = 3400 * P.fs;
    const breath = P.breath || 0, f0 = P.f0 * pitchK * (loud ? 1.14 : 1), amp0 = (loud ? 0.22 : 0.16) * (1 - breath * 0.45);
    src.frequency.setValueAtTime(f0, t); tri.frequency.setValueAtTime(f0, t);
    const setF = (fr, at, tau = 0.022) => { for (let q = 0; q < 3; q++) F[q].frequency.setTargetAtTime(fr[q] * P.fs, at, tau); };
    let last = 'a';
    syl.forEach((s, k) => {
      if (s.pause) { vg.gain.setTargetAtTime(0.0001, t, 0.03); ng.gain.setTargetAtTime(0.0001, t, 0.03); t += s.pause; return; }
      if (s.gap) { t += mora * 0.18; return; }
      const fr = VOW[s.v] || VOW.a, decl = 1 - 0.2 * (k / Math.max(1, N - 1));
      // acento de tono: la primera mora de la palabra baja, sube desde la segunda, cae después del acento
      const acc = s.i === 0 ? (s.acc === 0 ? 1.08 : 0.93) : s.i <= s.acc ? 1.06 : 0.96;
      const rise = ask && k >= N - 2 ? 1.25 + (k - N + 2) * 0.14 : 1, emph = loud && k < 3 ? 1.06 : 1;
      const fq = f0 * decl * acc * rise * emph * (1 + (P.slide ? P.slide * Math.sin(k * 0.8) : 0));
      const d = mora * (s.dev ? 0.45 : s.tail ? 0.8 : 1) * (0.94 + 0.12 * (((k * 7) % 5) / 4)) * (k === N - 1 ? 1.55 : 1);
      const c = s.c;
      // consonantes
      if (c === 'N') { F[0].frequency.setTargetAtTime(260 * P.fs, t, 0.02); F[1].frequency.setTargetAtTime(1150 * P.fs, t, 0.02); F[2].frequency.setTargetAtTime(2300 * P.fs, t, 0.02); vg.gain.setTargetAtTime(amp0 * 0.4, t, 0.02); src.frequency.linearRampToValueAtTime(fq * 0.97, t + d); tri.frequency.linearRampToValueAtTime(fq * 0.97, t + d); t += d * 0.9; return; }
      if (c) {
        const stop = 'ktpbdg'.includes(c[0]) && c !== 'ts', vstop = 'bdg'.includes(c), fric = ['s', 'sh', 'h', 'f', 'ts', 'ch'].includes(c), nas = c === 'm' || c === 'n' || c === 'ny', liq = c === 'r', gl = c === 'y' || c === 'w';
        if (stop || c === 'ts' || c === 'ch') { // cierre (silencio o murmullo) + explosión
          const cl = vstop ? 0.04 : 0.055; vg.gain.setTargetAtTime(vstop ? amp0 * 0.12 : 0.0001, t, 0.008); t += cl;
          cf.frequency.setValueAtTime(c[0] === 'k' || c === 'g' ? 1900 : c[0] === 'p' || c === 'b' ? 900 : 4200, t); cf.Q.setValueAtTime(c[0] === 'p' || c === 'b' ? 0.8 : 2, t);
          cg.gain.setValueAtTime(0.0001, t); cg.gain.exponentialRampToValueAtTime((vstop ? 0.05 : 0.09) * (loud ? 1.3 : 1), t + 0.004); cg.gain.exponentialRampToValueAtTime(0.0001, t + (c === 'ts' || c === 'ch' ? 0.07 : 0.03));
          if (c === 'ts' || c === 'ch') { cf.frequency.setValueAtTime(c === 'ts' ? 6000 : 3300, t + 0.012); t += 0.05; } else t += 0.012;
        } else if (fric) { // soplido
          const fq2 = c === 's' ? 6200 : c === 'sh' ? 3300 : c === 'f' ? 1600 : 1200; cf.frequency.setValueAtTime(fq2, t); cf.Q.setValueAtTime(c === 'h' || c === 'f' ? 0.7 : 2.2, t);
          vg.gain.setTargetAtTime(0.0001, t, 0.01); cg.gain.setValueAtTime(0.0001, t); cg.gain.exponentialRampToValueAtTime((c === 'h' ? 0.035 : 0.06) * (loud ? 1.3 : 1), t + 0.025); cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);
          if (c === 'h') { setF(fr, t, 0.01); ng.gain.setTargetAtTime(0.05, t, 0.01); } t += 0.07;
        } else if (nas) { F[0].frequency.setTargetAtTime(250 * P.fs, t, 0.01); F[1].frequency.setTargetAtTime((c === 'm' ? 1000 : 1500) * P.fs, t, 0.01); F[2].frequency.setTargetAtTime(2400 * P.fs, t, 0.01); vg.gain.setTargetAtTime(amp0 * 0.45, t, 0.01); t += 0.05; }
        else if (liq) { vg.gain.setTargetAtTime(amp0 * 0.35, t, 0.006); F[2].frequency.setTargetAtTime(1900 * P.fs, t, 0.006); t += 0.022; }
        else if (gl) { setF(c === 'y' ? VOW.i : VOW.u, t, 0.008); vg.gain.setTargetAtTime(amp0 * 0.6, t, 0.01); t += 0.035; }
      }
      // la vocal: tono que se desliza, formantes hacia la vocal, golpe de aire suave al empezar
      src.frequency.linearRampToValueAtTime(fq, t + d * 0.25); tri.frequency.linearRampToValueAtTime(fq, t + d * 0.25);
      src.frequency.linearRampToValueAtTime(fq * (P.glide ? 1 + P.glide * 0.25 : 0.985), t + d); tri.frequency.linearRampToValueAtTime(fq * (P.glide ? 1 + P.glide * 0.25 : 0.985), t + d);
      setF(fr, t, last === s.v ? 0.02 : 0.03); last = s.v;
      const a2 = amp0 * (s.dev ? 0.25 : 1) * (s.i === 0 ? 1.08 : 1);
      vg.gain.setTargetAtTime(a2, t, 0.014); vg.gain.setTargetAtTime(a2 * 0.78, t + d * 0.6, 0.04);
      ng.gain.setTargetAtTime(0.045 * breath + 0.005, t, 0.02);
      t += d;
    });
    vg.gain.setTargetAtTime(0.0001, t, 0.05); ng.gain.setTargetAtTime(0.0001, t, 0.05);
    for (const o of [src, tri, vib, jit]) { o.start(t0); o.stop(t + 0.4); } nsrc.start(t0); nsrc.stop(t + 0.4);
    return t - t0;
  }
  let nb = null; function mkNoise(ac) { if (nb && nb.sampleRate === ac.sampleRate) return nb; nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return nb; }
  // la salida: voz seca + aspereza + eco + sala; el coro son varias voces un poco corridas
  function chain(ac, P, dest) {
    const inp = ac.createGain(); inp.gain.value = (P.g || 2.2); let node = inp;
    if (P.rasp) { const ws = ac.createWaveShaper(), k = P.rasp * 40, n = 1024, cv = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; cv[i] = (1 + k) * x / (1 + k * Math.abs(x)); } ws.curve = cv; const g = ac.createGain(); g.gain.value = 1 / (1 + P.rasp * 1.5); node.connect(ws); ws.connect(g); node = g; }
    node.connect(dest);
    if (P.echo) { const d = ac.createDelay(1); d.delayTime.value = 0.19; const fb = ac.createGain(); fb.gain.value = P.echo * 0.55; const wg = ac.createGain(); wg.gain.value = P.echo; node.connect(d); d.connect(fb); fb.connect(d); d.connect(wg); wg.connect(dest); }
    const vb = P.verb != null ? P.verb : P.name ? 0.28 : 0;
    if (vb) { const cv = ac.createConvolver(); cv.buffer = verb(ac); const wg = ac.createGain(); wg.gain.value = vb * 0.6; node.connect(cv); cv.connect(wg); wg.connect(dest); }
    return inp;
  }
  function say(who, text, o = {}) {
    const P = Object.assign({}, VOICES[who] || VOICES.sumi, o.voice || {}), loud = /!/.test(text) || o.loud, ask = /\?/.test(text), syl = syllables(text);
    const dur = syl.reduce((s, x) => s + (x.pause || (x.gap ? 0.18 / P.rate : 1.05 / P.rate + (x.c ? 0.05 : 0))), 0) + 0.3;
    if (o.sub !== false && (VOICES[who] && VOICES[who].name)) subs.push({ who, name: VOICES[who].name, col: VOICES[who].col, text, t: 0, life: Math.max(1.8, dur + 0.9) });
    if (subs.length > 2) subs.splice(0, subs.length - 2);
    const ac = on ? ctx() : null; if (!ac || !on || !syl.length) return dur;
    const t0 = ac.currentTime + (o.delay || 0) + 0.02;
    if (o.sub !== false && typeof Music !== 'undefined' && Music.vduck) Music.vduck(dur + (o.delay || 0) + 0.2);
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
  function setOn(v) { on = !!v; Store.set('voice', on); if (out) out.gain.value = on ? vol * BOOST : 0; }
  function setVol(v) { vol = clamp(+v, 0, 1); Store.set('voiceVol', vol); if (out) out.gain.value = on ? vol * BOOST : 0; }
  // subtítulos: abajo al centro, con el nombre de quien habla en su color
  function drawSubs(x, sw, sh, dt) {
    for (let k = subs.length - 1; k >= 0; k--) { subs[k].t += dt; if (subs[k].t > subs[k].life) subs.splice(k, 1); }
    if (!subs.length) return; const u = Math.min(1.25, Math.max(0.7, Math.min(sw / 1280, sh / 720)));
    const Gm = typeof Game !== 'undefined' && Game.G, boss = Gm && Gm.boss && Gm.boss.alive && Gm.mode === 'camp';
    let y = sh - (boss ? 104 : 70) * u - (typeof getInsets === 'function' ? getInsets().bottom : 0);
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
    const P = Object.assign({}, VOICES[who] || VOICES.sumi), syl = syllables(text), dur = syl.reduce((s, x) => s + (x.pause || (x.gap ? 0.18 / P.rate : 1.05 / P.rate + (x.c ? 0.05 : 0))), 0) + 0.8;
    const oc = new OfflineAudioContext(1, Math.ceil(dur * 22050), 22050), d = chain(oc, P, oc.destination), n = Math.max(1, P.choir || 1);
    for (let k = 0; k < n; k++) build(oc, d, 0.02 + k * 0.011, P, syl, /!/.test(text), /\?/.test(text), 1 + (k - (n - 1) / 2) * 0.028);
    return oc.startRendering().then(b => { const a = b.getChannelData(0); if (P.reverse) a.reverse(); return a; });
  }
  const clearSubs = () => { subs.length = 0; };
  return { say, shout, setOn, setVol, drawSubs, syllables, render, clearSubs, get on() { return on; }, get vol() { return vol; }, subs };
})();
