// Galería de auras y estelas del vestidor (para revisarlas a ojo): node tools/galeria-vestidor.js [t]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const V = fs.readFileSync(path.join(__dirname, '..', 'shared', 'vestidor.js'), 'utf8');
const OUT = process.argv[3] || path.join(__dirname, '..', 'test', 'shots', 'galeria-vestidor.png');
(async () => {
  const b = await chromium.launch({ args: ['--disable-gpu'] }), p = await b.newPage({ viewport: { width: 1400, height: 1060 } });
  await p.setContent('<body style="margin:0;background:#0a0716"><canvas id="c" width="1400" height="1060"></canvas></body>');
  await p.addScriptTag({ content: V });
  await p.evaluate(T => {
    const x = document.getElementById('c').getContext('2d'), A = Object.keys(Vest.AURA).filter(k => k !== 'ninguna'), Tr = Object.keys(Vest.TRAIL).filter(k => k !== 'ninguna');
    const body = (X, Y, R) => { x.save(); const g = x.createLinearGradient(X, Y - R, X, Y + R); g.addColorStop(0, '#7a5ad8'); g.addColorStop(1, '#2a1a5a'); x.fillStyle = g; x.beginPath(); x.ellipse(X, Y, R * 0.5, R, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = '#ffe2c8'; x.beginPath(); x.arc(X, Y - R * 0.75, R * 0.3, 0, 7); x.fill(); x.restore(); };
    const cw = 175, ch = 170; x.font = '700 13px system-ui'; x.textAlign = 'center';
    A.forEach((k, i) => { const cx = (i % 8) * cw + cw / 2, cy = Math.floor(i / 8) * ch + 95, R = 36; x.fillStyle = '#140e2c'; x.fillRect(cx - cw / 2 + 4, cy - 90, cw - 8, ch - 8); Vest.drawAura(x, k, cx, cy, R, T, 0); body(cx, cy, R); Vest.drawAura(x, k, cx, cy, R, T, 1); x.fillStyle = '#fff'; x.globalAlpha = 1; x.fillText(k, cx, cy + 70); });
    Tr.forEach((k, i) => { const cx = (i % 8) * cw + cw / 2, cy = 3 * ch + Math.floor(i / 8) * ch + 95; x.fillStyle = '#140e2c'; x.fillRect(cx - cw / 2 + 4, cy - 90, cw - 8, ch - 8);
      for (let s = 0; s <= 40; s++) { const tt = T - 0.9 + s * 0.9 / 40, a = tt * 2.2; Vest.trailPush('g' + k, cx + Math.sin(a) * 60, cy + Math.sin(a * 2) * 30, tt); }
      const a = T * 2.2; Vest.drawTrail(x, k, 'g' + k, 9, T, '255,120,220'); body(cx + Math.sin(a) * 60, cy + Math.sin(a * 2) * 30, 14); x.fillStyle = '#fff'; x.globalAlpha = 1; x.fillText('estela ' + k, cx, cy + 70); });
  }, +(process.argv[2] || 2.3));
  await p.screenshot({ path: OUT }); await b.close(); console.log('listo', OUT);
})();
