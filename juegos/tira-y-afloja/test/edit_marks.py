import os
os.chdir('/home/claude/tya/src')
def edit(p, pairs):
    s = open(p).read()
    for old, new in pairs:
        assert s.count(old) == 1, (p, old[:70], s.count(old))
        s = s.replace(old, new)
    open(p, 'w').write(s)

edit('05-player.js', [
("""    // estrellas de aturdido""",
 """    // marca 1 / 2 encima (ayuda a quien confunde colores)
    if (Player.marks && this.alive) {
      const mx = this.x, my = this.y - this.r * 1.55 - 26;
      ctx.save();
      ctx.beginPath(); ctx.moveTo(mx - 15, my - 14); ctx.lineTo(mx + 15, my - 14); ctx.lineTo(mx + 15, my + 8); ctx.lineTo(mx + 5, my + 8); ctx.lineTo(mx, my + 15); ctx.lineTo(mx - 5, my + 8); ctx.lineTo(mx - 15, my + 8); ctx.closePath();
      ctx.fillStyle = '#fff6e6'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = PALETTE.ink; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.fillStyle = PALETTE.ink; ctx.font = font(17, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(this.id === 0 ? '1' : '2', mx, my - 2);
      ctx.restore();
    }
    // estrellas de aturdido"""),
("""function drawStar(ctx, x, y, r, color, rot = 0) {""",
 """Player.marks = Store.get('marks', false);

function drawStar(ctx, x, y, r, color, rot = 0) {"""),
])
edit('template.html', [
("""          <div class="opt"><label id="l-quality">""",
 """          <div class="opt"><label id="l-marks">Marcas 1 y 2 sobre los jugadores</label><div class="seg" role="group" aria-labelledby="l-marks" data-opt="marks"><button data-v="1">Sí</button><button data-v="0">No</button></div></div>
          <div class="opt"><label id="l-quality">"""),
])
edit('09-ui.js', [
("""        if (opt === 'shake') {""",
 """        if (opt === 'marks') { Player.marks = v === '1'; Store.set('marks', Player.marks); }
        if (opt === 'shake') {"""),
("""    set('shake', FX.settings.shake);""",
 """    set('marks', Player.marks ? 1 : 0); set('shake', FX.settings.shake);"""),
])
print('ok')
