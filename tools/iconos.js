// Íconos de GameHub: una «G» rellena de galaxia sobre el negro del espacio,
// con cuatro destellos de colores (uno por juego). Usa assets/galaxia.jpg y la letra Bungee.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const A = path.join(__dirname, '..', 'assets'), OUT = path.join(A, 'icons');
const font = fs.readFileSync(path.join(A, 'fonts', 'bungee-latin-400-normal.woff2')).toString('base64');
const gal = fs.readFileSync(path.join(A, 'galaxia.jpg')).toString('base64');

const PAGE = `<style>@font-face { font-family: B; src: url(data:font/woff2;base64,${font}); }</style><canvas id="c"></canvas><img id="g" src="data:image/jpeg;base64,${gal}"><script>
window.icon = async (S, mask) => {
  await document.fonts.load('400 100px B'); const img = document.getElementById('g'); await img.decode();
  const c = document.getElementById('c'); c.width = c.height = S; const x = c.getContext('2d');
  const R = mask ? 0 : S * 0.22, k = mask ? 0.74 : 1;
  // fondo: espacio profundo con un velo de nebulosa
  x.save(); x.beginPath(); x.roundRect(0, 0, S, S, R); x.clip();
  const bg = x.createRadialGradient(S * 0.5, S * 0.42, 0, S * 0.5, S * 0.5, S * 0.75); bg.addColorStop(0, '#1a0e3a'); bg.addColorStop(1, '#04020b'); x.fillStyle = bg; x.fillRect(0, 0, S, S);
  x.globalAlpha = 0.28; x.drawImage(img, 560, 200, 900, 900, 0, 0, S, S); x.globalAlpha = 1;
  // la G: se dibuja en otra capa y se rellena con la galaxia
  const t = document.createElement('canvas'); t.width = t.height = S; const y = t.getContext('2d');
  y.font = '400 ' + (S * 0.74 * k) + 'px B'; y.textAlign = 'center'; y.textBaseline = 'middle'; y.fillStyle = '#fff'; y.fillText('G', S * 0.5, S * 0.535);
  y.globalCompositeOperation = 'source-in'; y.drawImage(img, 700, 260, 760, 760, S * 0.12, S * 0.12, S * 0.76, S * 0.76);
  y.globalCompositeOperation = 'source-atop'; const sh = y.createLinearGradient(0, S * 0.15, 0, S * 0.9); sh.addColorStop(0, 'rgba(255,255,255,.28)'); sh.addColorStop(0.45, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(40,0,80,.25)'); y.fillStyle = sh; y.fillRect(0, 0, S, S);
  // brillo detrás de la letra
  x.shadowColor = 'rgba(190,110,255,.85)'; x.shadowBlur = S * 0.07; x.drawImage(t, 0, 0); x.shadowBlur = 0;
  // filo claro de la letra
  y.globalCompositeOperation = 'source-over';
  x.drawImage(t, 0, 0);
  // cuatro destellos, uno por juego
  const star = (cx, cy, r, col) => { x.save(); x.translate(cx, cy); const g = x.createRadialGradient(0, 0, 0, 0, 0, r * 1.6); g.addColorStop(0, '#fff'); g.addColorStop(0.25, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, r * 1.6, 0, 6.283); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.16 : r; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.closePath(); x.fill(); x.restore(); };
  const s = S * (mask ? 0.8 : 1), o = (S - s) / 2;
  star(o + s * 0.2, o + s * 0.2, s * 0.075, '#ff5d8f'); star(o + s * 0.83, o + s * 0.17, s * 0.06, '#ffb36b'); star(o + s * 0.86, o + s * 0.8, s * 0.07, '#3dffa8'); star(o + s * 0.16, o + s * 0.84, s * 0.055, '#9a5cff');
  x.restore();
  return c.toDataURL('image/png');
};
</script>`;
(async () => {
  const b = await chromium.launch({ args: ['--disable-gpu'] }); const p = await b.newPage();
  await p.setContent(PAGE);
  for (const [name, size, mask] of [['icon-192', 192, 0], ['icon-512', 512, 0], ['icon-180', 180, 1], ['icon-maskable-512', 512, 1], ['icon-64', 64, 0], ['icon-32', 32, 0]]) {
    const url = await p.evaluate(([s, m]) => window.icon(s, m), [size, mask]);
    fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(url.split(',')[1], 'base64'));
  }
  await b.close(); console.log('íconos listos');
})();
