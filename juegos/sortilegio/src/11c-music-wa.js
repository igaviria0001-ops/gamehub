/* =========================================================================
   MÚSICA DEL MUNDO 3 (y temas propios del Mundo 2) — todo sintetizado.
   Instrumentos: koto (cuerda pulsada que se dobla al apretar), shamisen
   (púa seca con zumbido), shakuhachi (flauta de bambú con aire y deslices),
   flauta de festival, taiko, golpe de borde (ka), campana de templo,
   campanas de viento, sho (órgano de boca), hyoshigi (tablillas), cigarras.
   Escalas japonesas: In (melancólica) y Yo (de fiesta).
   Cada tema cambia con la ESTACIÓN de donde mira la cámara: primavera
   arpegios de koto y campanitas; verano cigarras y más taiko; otoño
   shakuhachi; invierno campana de templo y koto en armónicos.
   Capas por intensidad como el resto: 0 calma, 1 pelea, 2 cerrada, 3 final.
   ========================================================================= */
const MusicWa = (() => {
  const IN = [0, 1, 5, 7, 8], YO = [0, 2, 5, 7, 9];
  const note = (sc, root, d) => root + sc[((d % 5) + 5) % 5] + 12 * Math.floor(d / 5);
  const env = (A, g, t, a, v, d) => { g.gain.value = 0.0001; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
  /* ---------- instrumentos ---------- */
  function koto(A, t, m, vol, dur = 1.1, press = 0) {
    const { ac, out, mtof } = A, f = mtof(m);
    for (const [type, det, k] of [['triangle', -4, 1], ['sawtooth', 5, 0.35]]) {
      const o = ac.createOscillator(); o.type = type; o.detune.value = det; o.frequency.setValueAtTime(f * (press ? 0.97 : 1.006), t); o.frequency.exponentialRampToValueAtTime(f, t + (press ? 0.18 : 0.04));
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(9000, f * 9), t); lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.6), t + dur * 0.6);
      const g = ac.createGain(); env(A, g, t, 0.003, vol * k, dur); o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
    }
    nz(A, t, f * 3, 2, 0.02, vol * 0.4, 'bandpass');
  }
  function shamisen(A, t, m, vol, dur = 0.45) {
    const { ac, out, mtof } = A, f = mtof(m), o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 1.01, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.03);
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(f * 3.2, t); bp.Q.value = 1.6; bp.frequency.exponentialRampToValueAtTime(f * 1.4, t + dur);
    const g = ac.createGain(); env(A, g, t, 0.002, vol, dur); o.connect(bp); bp.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05);
    nz(A, t, 2400, 3, 0.035, vol * 0.9, 'bandpass'); // la púa (bachi) contra la piel
    nz(A, t + 0.01, f * 6, 8, dur * 0.4, vol * 0.25, 'bandpass'); // zumbido (sawari)
  }
  function shaku(A, t, m, len, vol = 0.07) {
    const { ac, out, mtof, E8 } = A, f = mtof(m), dur = Math.max(0.25, len * E8 * 0.96), o = ac.createOscillator(); o.type = 'sine';
    // entra un poco abajo y sube (meri → kari), vibrato que llega tarde
    o.frequency.setValueAtTime(f * 0.94, t); o.frequency.exponentialRampToValueAtTime(f, t + Math.min(0.22, dur * 0.4));
    const vib = ac.createOscillator(); vib.frequency.value = 5; const vg = ac.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * 0.014, t + Math.min(dur, 0.7)); vib.connect(vg); vg.connect(o.frequency);
    const h = ac.createOscillator(); h.type = 'sine'; h.frequency.value = f * 2; const hg = ac.createGain(); hg.gain.value = 0.18; h.connect(hg);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.09); g.gain.setValueAtTime(vol * 0.85, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); hg.connect(g); g.connect(out); for (const x of [o, h, vib]) { x.start(t); x.stop(t + dur + 0.05); }
    nz(A, t, f * 1.5, 1.2, Math.min(0.35, dur), vol * 0.55, 'bandpass'); // el aire del soplo (muraiki)
  }
  function fue(A, t, m, len, vol = 0.055) {
    const { ac, out, mtof, E8 } = A, f = mtof(m + 12), dur = Math.max(0.12, len * E8 * 0.9), o = ac.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(f * 1.03, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.04);
    const vib = ac.createOscillator(); vib.frequency.value = 6.5; const vg = ac.createGain(); vg.gain.value = f * 0.009; vib.connect(vg); vg.connect(o.frequency);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05); vib.start(t); vib.stop(t + dur + 0.05); nz(A, t, f, 2, 0.06, vol * 0.3, 'bandpass');
  }
  function taiko(A, t, vol, big = 1) {
    const { ac, out } = A, o = ac.createOscillator(); o.frequency.setValueAtTime(110 / big, t); o.frequency.exponentialRampToValueAtTime(44 / big, t + 0.35);
    const g = ac.createGain(); env(A, g, t, 0.004, vol, 0.7 * big); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.8 * big);
    nz(A, t, 260 / big, 0.8, 0.25 * big, vol * 0.7, 'lowpass');
  }
  const ka = (A, t, vol) => { nz(A, t, 3200, 2.5, 0.03, vol, 'bandpass'); nz(A, t, 900, 4, 0.05, vol * 0.4, 'bandpass'); };
  const hyoshigi = (A, t, vol) => { for (const k of [0, 0.012]) nz(A, t + k, 2300, 9, 0.04, vol, 'bandpass'); };
  function bell(A, t, m, vol, dur = 5) {
    const { ac, out, mtof } = A, f = mtof(m);
    for (const [r, a, d] of [[1, 1, 1], [2.76, 0.5, 0.6], [5.4, 0.25, 0.35], [8.93, 0.12, 0.2], [0.5, 0.35, 1.2]]) {
      const o = ac.createOscillator(); o.frequency.value = f * r; o.detune.value = (r * 7) % 5 - 2; const g = ac.createGain(); env(A, g, t, 0.005, vol * a, dur * d); o.connect(g); g.connect(out); o.start(t); o.stop(t + dur * d + 0.1);
    }
  }
  function chime(A, t, vol) { const { ac, out } = A; for (let k = 0; k < 3; k++) { const o = ac.createOscillator(), tk = t + k * 0.07 + Math.random() * 0.05; o.frequency.value = 2400 + Math.random() * 2600; const g = ac.createGain(); env(A, g, tk, 0.002, vol, 0.9); o.connect(g); g.connect(out); o.start(tk); o.stop(tk + 1.1); } }
  function sho(A, t, ms, dur, vol) {
    const { ac, out, mtof } = A, lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.35); g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    lp.connect(g); g.connect(out); for (const m of ms) for (const det of [-5, 5]) { const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = mtof(m); o.detune.value = det; o.connect(lp); o.start(t); o.stop(t + dur + 0.05); }
  }
  function cicada(A, t, dur, vol) {
    const { ac, out, noise } = A, s = ac.createBufferSource(); s.buffer = noise; s.loop = true; const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4600 + Math.random() * 900; bp.Q.value = 6;
    const am = ac.createOscillator(); am.frequency.value = 28 + Math.random() * 10; const ag = ac.createGain(); ag.gain.value = 0.5; const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    am.connect(ag); ag.connect(g.gain); s.connect(bp); bp.connect(g); g.connect(out); s.start(t); s.stop(t + dur + 0.05); am.start(t); am.stop(t + dur + 0.05);
  }
  function waves(A, t, dur, vol) { const { ac, out, noise } = A, s = ac.createBufferSource(); s.buffer = noise; s.loop = true; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(lp); lp.connect(g); g.connect(out); s.start(t); s.stop(t + dur + 0.05); }
  function nz(A, t, freq, q, dur, vol, type) { const { ac, out, noise } = A, s = ac.createBufferSource(); s.buffer = noise; const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = ac.createGain(); g.gain.setValueAtTime(Math.max(0.0002, vol), t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + dur + 0.02); }
  // Mundo 2: arpa, coro «aah» y metales oscuros
  function harp(A, t, m, vol) { const { ac, out, mtof } = A, o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = mtof(m); const g = ac.createGain(); env(A, g, t, 0.002, vol, 1.6); const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200; o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + 1.7); }
  function choir(A, t, ms, dur, vol, dark) {
    const { ac, out, mtof } = A, g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3); g.gain.setValueAtTime(vol, t + dur * 0.75); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); g.connect(out);
    const F = dark ? [[500, 6], [850, 7]] : [[730, 7], [1090, 8]]; const fs = F.map(([fr, q]) => { const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fr; b.Q.value = q; b.connect(g); return b; });
    for (const m of ms) for (const det of [-7, 0, 7]) { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = det; for (const b of fs) o.connect(b); o.start(t); o.stop(t + dur + 0.05); }
  }
  function brass(A, t, m, dur, vol) { const { ac, out, mtof } = A; for (const det of [-6, 6]) { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m); o.detune.value = det; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(400, t); lp.frequency.exponentialRampToValueAtTime(1800, t + 0.12); lp.frequency.exponentialRampToValueAtTime(500, t + dur); const g = ac.createGain(); env(A, g, t, 0.03, vol, dur); o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.05); } }

  /* ---------- frases (grados de la escala de cinco: 0 = la tónica, 5 = la octava) ---------- */
  const MOT = {
    calm: [[[0, 5, 3], [3, 4, 1], [4, 3, 4]], [[0, 2, 2], [2, 3, 2], [4, 1, 4]], [[0, 0, 3], [3, 1, 1], [4, 2, 2], [6, 3, 2]], [[0, 4, 6], [6, 3, 2]], [[0, 5, 2], [2, 7, 2], [4, 6, 2], [6, 5, 2]], [[0, 4, 3], [3, 3, 1], [4, 2, 4]], [[0, 1, 2], [2, 2, 2], [4, 0, 2], [6, -1, 2]], [[0, 0, 8]]],
    fest: [[[0, 5, 1], [1, 5, 1], [2, 7, 1], [3, 5, 1], [4, 4, 2], [6, 2, 2]], [[0, 4, 1], [1, 5, 1], [2, 4, 1], [3, 2, 1], [4, 0, 4]], [[0, 2, 1], [1, 4, 1], [2, 5, 2], [4, 7, 2], [6, 5, 2]], [[0, 4, 2], [2, 2, 2], [4, 4, 4]], [[0, 7, 1], [1, 7, 1], [2, 9, 1], [3, 7, 1], [4, 5, 2], [6, 4, 2]], [[0, 5, 1], [1, 7, 1], [2, 5, 1], [3, 4, 1], [4, 2, 4]], [[0, 0, 1], [1, 2, 1], [2, 4, 1], [3, 5, 1], [4, 4, 1], [5, 2, 1], [6, 0, 2]], [[0, 0, 8]]],
    dark: [[[0, 0, 2], [2, 1, 1], [3, 0, 1], [4, -1, 4]], [[0, 0, 2], [2, 2, 2], [4, 3, 3], [7, 2, 1]], [[0, 1, 4], [4, 0, 2], [6, -1, 2]], [[0, -2, 8]], [[0, 5, 2], [2, 6, 1], [3, 5, 1], [4, 3, 4]], [[0, 2, 2], [2, 3, 2], [4, 1, 4]], [[0, 0, 1], [1, 1, 1], [2, 0, 1], [3, -1, 1], [4, -2, 4]], [[0, 0, 8]]],
  };
  const BASSD = { calm: [0, -2, 0, 1, -1, 0, -2, 0], fest: [0, 2, 0, -1, 0, 2, -1, 0], dark: [0, 0, -1, -2, 0, 1, -1, 0] };
  // el tema principal del juego (el bambuco), para que vuelva en la pelea final tocado con instrumentos de acá
  const MAIN = [[[0, 71, 2], [2, 69, 1], [3, 67, 2], [5, 64, 1]], [[0, 66, 3], [3, 69, 2], [5, 74, 1]], [[0, 76, 2], [2, 74, 1], [3, 72, 2], [5, 71, 1]], [[0, 71, 3], [3, 69, 1], [4, 66, 1], [5, 63, 1]], [[0, 76, 1], [1, 74, 1], [2, 71, 1], [3, 67, 3]], [[0, 69, 2], [2, 66, 1], [3, 62, 3]], [[0, 67, 1], [1, 69, 1], [2, 71, 1], [3, 72, 1], [4, 71, 1], [5, 69, 1]], [[0, 71, 5], [5, 75, 1]]];
  const seasonNow = () => { try { const G = Game.G; return G && G.sea && Game.cam ? Seasons.at(G, Game.cam.x, Game.cam.y) || 'spring' : null; } catch (e) { return null; } };

  /* ---------- un tema = una receta ---------- */
  // cfg: e8, root, scale ('in'|'yo'|'season'), mot, lead ('shaku'|'fue'|'shamisen'|'koto'), perc ('taiko'|'march'|'matsuri'|'light'|'bamboo'|'none'), pad (sho), bed ('waves'), bells
  function makeStyle(cfg) {
    return { e8: cfg.e8, n: 8, step(A, t, step, L) {
      const sea = cfg.seasonal ? seasonNow() || 'spring' : cfg.sea || null, bar = Math.floor(step / 8), e = step % 8, b8 = bar % 8;
      const sc = cfg.scale === 'yo' ? YO : cfg.scale === 'in' ? IN : sea === 'autumn' || sea === 'winter' ? IN : YO;
      const root = cfg.root + (sea === 'winter' ? 2 : sea === 'summer' ? -2 : 0), mot = MOT[cfg.mot], bd = BASSD[cfg.mot][b8];
      const lead = cfg.seasonal ? (sea === 'autumn' || sea === 'summer' ? 'shaku' : sea === 'winter' ? 'koto' : 'fue') : cfg.lead;
      // koto: arpegio del acorde de la barra (en invierno, en armónicos altos y más espaciado)
      const arp = [bd, bd + 2, bd + 4, bd + 5, bd + 4, bd + 2, bd + 5, bd + 7];
      if (sea === 'winter') { if (e % 4 === 0) koto(A, t, note(sc, root + 12, arp[e]), 0.035, 1.6); }
      else if (cfg.lead !== 'koto' || L < 2) { if (e % 2 === 0 || L >= 1) koto(A, t, note(sc, root, arp[e]), L === 0 ? 0.028 : 0.036, 0.9, e === 0 && bar % 4 === 3); }
      // bajo de koto grave en la cabeza del compás
      if (e === 0) koto(A, t, note(sc, root - 12, bd), 0.06, 1.6); if (L >= 1 && e === 4) koto(A, t, note(sc, root - 12, bd + 3), 0.045, 1.2);
      // primavera: glissando cada cuatro compases y campanitas; verano: cigarras; invierno: campana de templo
      if (sea === 'spring' && e === 7 && bar % 4 === 3) for (let k = 0; k < 6; k++) koto(A, t + k * 0.035, note(sc, root, 5 + k), 0.022, 0.7);
      if (sea === 'spring' && e === 0 && bar % 2 === 1) chime(A, t + 0.1, 0.012);
      if (sea === 'summer' && e === 0 && bar % 2 === 0 && L <= 1) cicada(A, t, 3.2, 0.018);
      if ((sea === 'winter' || cfg.bells) && e === 0 && bar % 4 === 0) bell(A, t, note(sc, root - 12, 0), 0.05, 6);
      if (cfg.bed === 'waves' && e === 0 && bar % 2 === 0) waves(A, t, E8x(A) * 16, 0.045);
      if (cfg.pad && e === 0 && bar % 2 === 0) sho(A, t, [note(sc, root, bd + 5), note(sc, root, bd + 7), note(sc, root, bd + 8), note(sc, root, bd + 9)], E8x(A) * 16, 0.018);
      // percusión
      const P = cfg.perc;
      if (P === 'taiko' && L >= 1) { if (e === 0) taiko(A, t, 0.32, 1.2); if (e === 4) taiko(A, t, 0.2); if (e === 6 || (L >= 2 && e === 7)) ka(A, t, 0.06); if (L >= 3 && e % 2 === 1) taiko(A, t, 0.1, 0.8); if (sea === 'summer' && e === 3) taiko(A, t, 0.14, 0.9); }
      if (P === 'march' && L >= 1) { if (e === 0 || e === 4) taiko(A, t, 0.3, 1.3); if (e === 2 || e === 6) taiko(A, t, 0.14, 0.9); if (L >= 2 && e % 2 === 1) ka(A, t, 0.04); }
      if (P === 'matsuri') { if (L >= 1 || e % 4 === 0) { if (e === 0 || e === 3 || e === 6) taiko(A, t, 0.24, 1); if (e % 2 === 1) bellKane(A, t, L >= 1 ? 0.03 : 0.015); if (L >= 1 && (e === 2 || e === 5)) hyoshigi(A, t, 0.05); } }
      if (P === 'light' && L >= 1) { if (e === 0 || e === 5) taiko(A, t, 0.16, 0.8); if (e % 2 === 1 && L >= 2) ka(A, t, 0.04); }
      if (P === 'bamboo') { if (e === 0 && L >= 1) taiko(A, t, 0.22, 1.1); if (e === 3 || e === 6) hollow(A, t, L >= 1 ? 0.05 : 0.025); if (L >= 2 && e % 2 === 1) hyoshigi(A, t, 0.03); }
      // la melodía (desde la pelea cerrada; en calma, solo de vez en cuando)
      if (L >= 2 || (L === 0 && b8 >= 4)) {
        const ph = cfg.main ? null : mot[b8];
        if (cfg.main) { for (const [at, m, len] of MAIN[b8]) if (at === e) shaku(A, t, m - 5 + (cfg.mainTr || 0), len * 1.3, 0.075); }
        else for (const [at, d, len] of ph) if (at === e) {
          const m = note(sc, root, d);
          if (lead === 'shaku') shaku(A, t, m, len, L === 0 ? 0.045 : 0.07); else if (lead === 'fue') fue(A, t, m, len, L === 0 ? 0.03 : 0.055); else if (lead === 'shamisen') shamisen(A, t, m, L === 0 ? 0.05 : 0.08, 0.3 + len * 0.08); else koto(A, t, m + 12, L === 0 ? 0.04 : 0.06, 1.2, len >= 4);
          if (lead === 'shamisen' && L >= 2 && len >= 2) shamisen(A, t + A.E8, m, 0.05, 0.25);
        }
      }
      return 1;
    } };
  }
  const E8x = A => A.E8;
  function bellKane(A, t, vol) { const { ac, out } = A; for (const f of [2100, 3350]) { const o = ac.createOscillator(); o.type = 'square'; o.frequency.value = f; const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 8; const g = ac.createGain(); env(A, g, t, 0.001, vol, 0.12); o.connect(bp); bp.connect(g); g.connect(out); o.start(t); o.stop(t + 0.16); } }
  function hollow(A, t, vol) { const { ac, out } = A, o = ac.createOscillator(); o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(380, t + 0.08); const g = ac.createGain(); env(A, g, t, 0.002, vol, 0.12); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.15); }

  // Raijin y Fujin: solo taiko (los golpes fuertes son los ataques del dios del trueno) y truenos de fondo
  const raijin = { e8: 0.17, n: 8, step(A, t, step, L) {
    const e = step % 8, bar = Math.floor(step / 8);
    const PAT = [[0, 1.4, 0.34], [3, 1, 0.2], [4, 1.2, 0.26], [6, 1, 0.18], [7, 0.8, 0.12]];
    for (const [at, big, v] of PAT) if (at === e && (L >= 1 || at === 0 || at === 4)) taiko(A, t, v * (L >= 2 ? 1.15 : 1), big);
    if (L >= 2 && e % 2 === 1) ka(A, t, 0.05); if (L >= 3) taiko(A, t + A.E8 / 2, 0.08, 0.7);
    if (e === 0 && bar % 4 === 0) nz(A, t, 120, 0.7, 3.5, 0.08, 'lowpass');
    if (L >= 1 && e === 0 && bar % 2 === 0) sho(A, t, [50, 57, 62, 64], A.E8 * 16, 0.012);
    return 1;
  } };
  // Mundo 2 · el cielo: arpa en arpegios, coro y pandero suave (modo lidio, luminoso)
  const cielo = { e8: 0.21, n: 8, step(A, t, step, L) {
    const e = step % 8, bar = Math.floor(step / 8), CH = [[60, 64, 67, 71, 74, 78], [62, 66, 69, 73, 76, 79], [57, 64, 67, 71, 72, 76], [59, 62, 66, 69, 74, 78]], c = CH[bar % 4];
    harp(A, t, c[[0, 2, 4, 5, 4, 2, 3, 1][e]] + 12, L === 0 ? 0.04 : 0.05);
    if (e === 0) { harp(A, t, c[0] - 12, 0.07); if (bar % 2 === 0) choir(A, t, [c[0], c[2], c[4]], A.E8 * 16, 0.016); }
    if (L >= 1 && (e === 0 || e === 4)) { nz(A, t, 180, 0.8, 0.2, 0.2, 'lowpass'); } if (L >= 1 && (e === 2 || e === 6)) nz(A, t, 5000, 1.5, 0.06, 0.03, 'highpass');
    if (L >= 2) { const mel = [[0, 4, 3], [3, 5, 1], [4, 3, 4]][e % 3]; if (e === 0 || e === 3 || e === 4) shaku(A, t, c[[4, 5, 3][e % 3]] + 12, 2, 0.04); }
    if (L >= 3 && e % 2 === 1) harp(A, t, c[5] + 12, 0.03);
    return 1;
  } };
  // Mundo 2 · el infierno: drones graves, tambores de guerra y metales oscuros
  const infierno = { e8: 0.165, n: 8, step(A, t, step, L) {
    const e = step % 8, bar = Math.floor(step / 8), R = [38, 38, 37, 41][bar % 4];
    if (e === 0 && bar % 2 === 0) choir(A, t, [R, R + 7, R + 12], A.E8 * 16, 0.022, true);
    if (e === 0) taiko(A, t, 0.34, 1.5); if (L >= 1 && (e === 3 || e === 6)) taiko(A, t, 0.22, 1.2); if (L >= 1 && e === 7) taiko(A, t, 0.14, 1);
    if (L >= 2 && (e === 0 || e === 3)) brass(A, t, R + 12 + (e === 3 ? 1 : 0), A.E8 * 2.6, 0.04);
    if (L >= 2 && e % 2 === 1) ka(A, t, 0.035); if (L >= 3) taiko(A, t + A.E8 / 2, 0.1, 0.9);
    return 1;
  } };
  const STYLES = {
    wa: makeStyle({ e8: 0.22, root: 62, seasonal: true, mot: 'calm', perc: 'taiko' }),
    miyajima: makeStyle({ e8: 0.24, root: 62, seasonal: true, mot: 'calm', perc: 'taiko', bed: 'waves' }),
    bamboo: makeStyle({ e8: 0.22, root: 59, scale: 'in', mot: 'calm', lead: 'shaku', perc: 'bamboo' }),
    kitsune: makeStyle({ e8: 0.16, root: 61, scale: 'in', mot: 'dark', lead: 'shamisen', perc: 'light' }),
    himeji: makeStyle({ e8: 0.2, root: 57, scale: 'yo', mot: 'calm', lead: 'fue', perc: 'march', pad: true }),
    yuki: makeStyle({ e8: 0.26, root: 66, scale: 'in', mot: 'calm', lead: 'koto', perc: 'none', bells: true, sea: 'winter' }),
    matsuri: makeStyle({ e8: 0.15, root: 67, scale: 'yo', mot: 'fest', lead: 'fue', perc: 'matsuri' }),
    orochi: makeStyle({ e8: 0.17, root: 50, scale: 'in', mot: 'dark', lead: 'shamisen', perc: 'taiko', pad: true, bells: true }),
    orochiMain: makeStyle({ e8: 0.19, root: 52, scale: 'in', mot: 'dark', main: true, perc: 'taiko', pad: true }),
    raijin, cielo, infierno,
  };
  for (const k in STYLES) Music.addStyle(k, STYLES[k]);
  return { koto, shamisen, shaku, fue, taiko, ka, bell, chime, sho, hyoshigi, STYLES };
})();
