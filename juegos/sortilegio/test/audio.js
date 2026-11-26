// Audio del Mundo 3 sin parlantes: cada tema de música (por intensidad y estación) y cada voz se arman en un contexto
// fuera de línea; se mide el pico (que no sature), el volumen y que no quede mudo. Guarda los .wav en shots/audio/.
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, 'shots', 'audio'); fs.mkdirSync(OUT, { recursive: true });
function wav(samples, sr) { const b = Buffer.alloc(44 + samples.length * 2); b.write('RIFF', 0); b.writeUInt32LE(36 + samples.length * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(samples.length * 2, 40); for (let i = 0; i < samples.length; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767))), 44 + i * 2); return b; }
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext()).newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(600);
  let fails = 0;
  // música
  const styles = (process.env.ST || 'wa,miyajima,bamboo,kitsune,himeji,yuki,raijin,matsuri,orochi,orochiMain,cielo,infierno').split(',');
  for (const st of styles) for (const L of [0, 2]) for (const sea of (st === 'wa' || st === 'miyajima' ? ['spring', 'summer', 'autumn', 'winter'] : [null])) {
    const r = await page.evaluate(async ([st, L, sea]) => {
      const X = MusicWa.STYLES[st], sr = 22050, bars = 4, secs = X.e8 * 8 * bars + 4, oc = new OfflineAudioContext(1, Math.ceil(secs * sr), sr), out = oc.createGain(); out.gain.value = 0.42; out.connect(oc.destination);
      const nb = oc.createBuffer(1, sr, sr), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      // la estación: se finge una partida del Mundo 3 con esa estación donde mira la cámara
      if (sea) { Game.G.sea = { panels: [], toriis: [] }; Seasons.at = (() => { const f = Seasons.at; return () => sea; })(); }
      for (let s = 0; s < bars * 8; s++) X.step({ ac: oc, out, noise: nb, mtof: m => 440 * Math.pow(2, (m - 69) / 12), step: s, level: L, E8: X.e8 }, 0.05 + s * X.e8, s, L);
      const buf = await oc.startRendering(), a = buf.getChannelData(0); let pk = 0, ss = 0; for (const v of a) { pk = Math.max(pk, Math.abs(v)); ss += v * v; }
      return { pk, rms: Math.sqrt(ss / a.length), data: Array.from(a.filter((_, i) => i % 1 === 0)) };
    }, [st, L, sea]);
    const name = `${st}${sea ? '-' + sea : ''}-L${L}`, ok = r.pk < 0.98 && r.rms > 0.004;
    if (!ok) fails++; fs.writeFileSync(path.join(OUT, name + '.wav'), wav(r.data, 22050));
    console.log((ok ? '  ' : '✗ ') + name.padEnd(22), 'pico', r.pk.toFixed(2), 'rms', r.rms.toFixed(3));
  }
  // voces
  const lines = [['sumi', '¡Por fin llegan! El pergamino los estaba esperando.'], ['kitsune', '¿Cuál de nosotras es la verdadera?'], ['raijin', '¡Bailen al ritmo de mis tambores!'], ['fujin', 'El viento no se deja atrapar.'], ['orochi', 'Ocho cabezas, ocho tormentas.'], ['borron', '¡Todo lo pintado se puede borrar!'], ['yukionna', 'Qué frío... qué silencio.'], ['candela', '¡Ha!'], ['frailejon', '¡Así se hace!'], ['chia', '¡Sortilegio!']];
  for (const [who, txt] of lines) {
    const r = await page.evaluate(async ([who, txt]) => { const a = await Voice.render(who, txt); let pk = 0, ss = 0; for (const v of a) { pk = Math.max(pk, Math.abs(v)); ss += v * v; } return { pk, rms: Math.sqrt(ss / a.length), len: a.length / 22050, data: Array.from(a) }; }, [who, txt]);
    // se normaliza para escuchar; la prueba pide que suene (no muda) y que no sature sin el compresor del juego
    const ok = r.pk < 1.5 && r.rms > 0.006; if (!ok) fails++;
    fs.writeFileSync(path.join(OUT, `voz-${who}.wav`), wav(r.data.map(v => v / Math.max(0.01, r.pk) * 0.8), 22050));
    console.log((ok ? '  ' : '✗ ') + ('voz ' + who).padEnd(22), 'pico', r.pk.toFixed(2), 'rms', r.rms.toFixed(3), r.len.toFixed(1) + ' s');
  }
  console.log(errs.length ? 'ERR ' + errs.join(' | ') : '', fails ? `AUDIO: ${fails} falla(s)` : 'AUDIO OK'); await browser.close(); process.exit(fails ? 1 : 0);
})();
