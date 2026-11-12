import os
os.chdir('/home/claude/tya/src')
def edit(p, pairs):
    s = open(p).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:70], s.count(old))
        s = s.replace(old, new)
    open(p, 'w').write(s)

edit('09-ui.js', [
("""      } else if (c.dataset.art === 'fuga') {""",
 """      } else if (c.dataset.art && c.dataset.art.startsWith('jefe')) {
        const which = c.dataset.art === 'jefe' ? 'todos' : c.dataset.art.slice(5), ink = PALETTE.ink, rr = ArenaArt.rr;
        const floor = H * 0.7;
        ctx.fillStyle = '#c98a4e'; ctx.fillRect(0, floor, W, H - floor); ctx.fillStyle = 'rgba(58,34,22,0.25)'; ctx.fillRect(0, floor, W, 4);
        const roomba = (x, y, s) => {
          rr(ctx, x - 70 * s, y - 34 * s, 140 * s, 34 * s, 14 * s); ctx.fillStyle = '#5a6475'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
          ctx.beginPath(); ctx.ellipse(x, y - 32 * s, 70 * s, 11 * s, 0, 0, TAU); ctx.fillStyle = '#8b96a8'; ctx.fill(); ctx.stroke();
          for (const k of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x - 30 * s + k * 12 * s, y - 33 * s, 6 * s, 4.5 * s, 0, 0, TAU); ctx.fillStyle = '#9dffb0'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); }
        };
        const sharp = (x, y, s) => {
          ctx.strokeStyle = '#333'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, y - 40 * s); ctx.stroke();
          rr(ctx, x - 50 * s, y - 40 * s, 100 * s, 80 * s, 14 * s); ctx.fillStyle = '#4aa3ff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
          ctx.beginPath(); ctx.arc(x + 22 * s, y + 12 * s, 13 * s, 0, TAU); ctx.fillStyle = '#222'; ctx.fill(); ctx.stroke();
          ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 50 * s, y); ctx.lineTo(x - 72 * s, y); ctx.stroke();
          ctx.beginPath(); ctx.arc(x - 72 * s, y, 7 * s, 0, TAU); ctx.fillStyle = '#e8574a'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
          for (const k of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x - 14 * s + k * 14 * s, y - 20 * s, 7 * s, 6 * s, 0, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); }
        };
        const mop = (x, y, s) => {
          ctx.lineCap = 'round'; ctx.strokeStyle = ink; ctx.lineWidth = 10 * s; ctx.beginPath(); ctx.moveTo(x + 60 * s, 0); ctx.lineTo(x, y - 30 * s); ctx.stroke();
          ctx.strokeStyle = '#c98a4e'; ctx.lineWidth = 6 * s; ctx.beginPath(); ctx.moveTo(x + 60 * s, 0); ctx.lineTo(x, y - 30 * s); ctx.stroke();
          rr(ctx, x - 50 * s, y - 36 * s, 100 * s, 14 * s, 5 * s); ctx.fillStyle = '#3c8fe0'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
          for (let k = 0; k < 9; k++) { const mx = x - 46 * s + k * 11.5 * s; ctx.strokeStyle = ink; ctx.lineWidth = 6 * s; ctx.beginPath(); ctx.moveTo(mx, y - 24 * s); ctx.lineTo(mx - 6 * s, y); ctx.stroke(); ctx.strokeStyle = '#eef2f6'; ctx.lineWidth = 3 * s; ctx.stroke(); }
        };
        if (which === 'todos') {
          roomba(110, floor, 0.9); sharp(250, 52, 0.62); mop(350, floor, 0.75);
          blob(200, floor - 18, 16, PALETTE.fresa, -1); blob(290, floor - 18, 16, PALETTE.menta, 1); rope(200, floor - 14, 290, floor - 14, 10);
        } else {
          if (which === 'aspiradora') roomba(W * 0.6, floor, 1.25);
          if (which === 'sacapuntas') sharp(W * 0.6, H * 0.36, 1.05);
          if (which === 'aseador') mop(W * 0.6, floor, 1.25);
          blob(W * 0.16, floor - 22, 20, PALETTE.fresa, 1); blob(W * 0.3, floor - 22, 20, PALETTE.menta, 1); rope(W * 0.16, floor - 18, W * 0.3, floor - 18, 12);
        }
      } else if (c.dataset.art === 'fuga') {"""),
])
edit('07e-progreso.js', [
("""    ['maestro', 'Maestro del chicle', 'Supera los 12 retos de técnica'],""",
 """    ['maestro', 'Maestro del chicle', 'Supera los 12 retos de técnica'],
    ['desenchufada', 'Desenchufada', 'Derrota a la Aspiradora'],
    ['sin_punta', 'Sin punta', 'Derrota al Sacapuntas eléctrico'],
    ['piso_limpio', 'Piso limpio', 'Derrota al Aseador'],"""),
("""   43 logros, accesorios""", """   46 logros, accesorios"""),
("""      case 'whip': unlock(d.p.id, 'latigazo'); break;""",
 """      case 'whip': unlock(d.p.id, 'latigazo'); break;
      case 'jefe': { const a = { aspiradora: 'desenchufada', sacapuntas: 'sin_punta', aseador: 'piso_limpio' }[d.id]; if (a) [0, 1].forEach(i => unlock(i, a)); break; }"""),
])
print('ok')
