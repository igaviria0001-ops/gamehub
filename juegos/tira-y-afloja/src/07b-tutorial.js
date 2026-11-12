/* =========================================================================
   TUTORIAL JUGABLE — ocho pasos cortos en el Pupitre. En pareja, cada
   jugador marca su propio avance; solo, un muñeco de práctica se queda
   anclado para que puedas estirar el hilo y embestirlo.
   ========================================================================= */
class PracticeDummy {
  constructor(id) { this.id = id; }
  think(dt, G) {
    const me = G.players[this.id];
    me.anchor = true;
    // se queda pegado donde está; si se cae, vuelve a pegarse apenas toque algo
    return { left: false, right: false, jump: false, stick: me.sticky > 0.3, pull: false, release: false };
  }
}

const Tutorial = (() => {
  const STEPS = [
    { id: 'move', title: 'Muévete', keys: ['A · D', 'J · L'], tkeys: '◀ ▶', goal: 'Camina de un lado a otro.' },
    { id: 'jump', title: 'Salta', keys: ['W', 'I'], tkeys: '▲', goal: 'Salta dos veces. Si mantienes la tecla, saltas más alto.' },
    { id: 'pull', title: 'Tira del hilo', keys: ['mantén E', 'mantén O'], tkeys: 'mantén +', goal: 'El chicle del hilo pasa a tu cuerpo: creces y pesas más. Llega a peso 4,5.' },
    { id: 'release', title: 'Afloja el hilo', keys: ['mantén Q', 'mantén U'], tkeys: 'mantén −', goal: 'Te achicas, corres más rápido y saltas más alto. Baja a peso 1,8.' },
    { id: 'ruler', title: 'Salto liviano', keys: ['W', 'I'], tkeys: '▲', goal: 'Siendo liviano saltas mucho más alto: súbete a la regla amarilla.' },
    { id: 'stick', title: 'Pégate', keys: ['mantén S', 'mantén K'], tkeys: 'mantén ●', goal: 'Pégate al piso o a una pared un segundo. El anillo blanco muestra cuánto falta para que el chicle se seque.' },
    { id: 'sling', title: 'Tirachinas', keys: ['S + E, suelta S', 'K + O, suelta K'], tkeys: '● y +, suelta ●', goal: 'Pégate y tira hasta estirar el hilo. Luego suelta la tecla de pegarte: ¡sales disparado!' },
    { id: 'ram', title: 'Embestida', keys: ['A · D', 'J · L'], tkeys: '◀ ▶', goal: 'Choca contra el otro con más impulso que él (corriendo, saltando o con el tirachinas) y lo aturdes.' },
    { id: 'done', title: '¡Listos!', keys: ['', ''], goal: 'Para ganar, echa al otro a la caneca. Si alguien cuelga del borde: tirar lo sube y aflojar lo deja caer.' },
  ];
  let onEnd = null;

  function T() { return Game.G.tutorial; }
  function active(i) { const tu = T(); return tu && !(tu.solo && i === 1); }

  function start(solo) {
    const G = Game.G;
    Game.startMatch('caneca', solo, 'pupitre');
    G.bots = [null, solo ? new PracticeDummy(1) : null];
    G.tutorial = { solo, step: 0, done: [false, false], prog: [{}, {}], t: 0, stepT: 0, endT: 0 };
    G.hintsT = 0;
    G.countdownLen = 0.4;
    Sound.Music.setMode('menu');
  }

  function stepDone(i) {
    const tu = T(); if (tu.done[i]) return;
    tu.done[i] = true;
    const p = Game.G.players[i];
    Sound.play('pellet', 1.2);
    FX.callout('¡BIEN!', p.x, p.y - p.r - 40, '#9dffb0', 44, 1);
    FX.sparkle(p.x, p.y, p.col.light, 12);
  }

  function onEvent(p, e) {
    const tu = T(); if (!tu || !active(p.id)) return;
    const s = STEPS[tu.step].id, pr = tu.prog[p.id];
    if (s === 'jump' && e.type === 'jump') { pr.jumps = (pr.jumps || 0) + 1; if (pr.jumps >= 2) stepDone(p.id); }
    if (s === 'sling' && e.type === 'unstick' && e.strain > 1.1) stepDone(p.id);
  }
  function onRam(att) {
    const tu = T(); if (!tu || STEPS[tu.step].id !== 'ram') return;
    if (tu.solo) { if (att.id === 0) stepDone(0); }
    else { stepDone(0); stepDone(1); }
  }

  function update(dt) {
    const tu = T(); if (!tu) return;
    const G = Game.G;
    tu.t += dt; tu.stepT += dt;
    G.suddenDeath = false; G.roundT = 0; G.golden = null; G.goldenNext = 1e9;
    const s = STEPS[tu.step].id;
    for (let i = 0; i < 2; i++) {
      if (!active(i) || tu.done[i]) continue;
      const p = G.players[i], pr = tu.prog[i];
      if (!p.alive) continue;
      if (s === 'move') { if (pr.lx !== undefined) pr.dist = (pr.dist || 0) + Math.abs(p.x - pr.lx); pr.lx = p.x; if (pr.dist > 220) stepDone(i); }
      if (s === 'pull' && p.mass >= 4.5) stepDone(i);
      if (s === 'release' && p.mass <= 1.8) stepDone(i);
      if (s === 'ruler' && p.onGround && p.groundR && p.groundR.kind === 'ruler') stepDone(i);
      if (s === 'stick') { if (p.stuck) pr.st = (pr.st || 0) + dt; if (pr.st >= 1) stepDone(i); }
    }
    const allDone = [0, 1].every(i => !active(i) || tu.done[i]);
    if (s === 'done') {
      tu.endT += dt;
      if (tu.endT > 6 && onEnd) { const cb = onEnd; G.tutorial = null; cb(); }
      return;
    }
    if (allDone) {
      tu.wait = (tu.wait || 0) + dt;
      if (tu.wait > 0.9) {
        tu.step++; tu.done = [false, false]; tu.prog = [{}, {}]; tu.stepT = 0; tu.wait = 0;
        Sound.play('roundWin');
        if (STEPS[tu.step].id === 'done') { FX.confetti(960, 200, 120, 1400); Sound.play('win'); Progress.on('tutorial', { solo: tu.solo }); }
        // después del salto liviano, devolver un peso normal para pegarse y embestir
        if (STEPS[tu.step].id === 'stick') G.players.forEach(p => { if (p.alive) p.setMass(clamp(p.mass, 2.2, 4)); });
        // para el tirachinas, dejar el hilo casi tenso: basta tirar un momento
        if (STEPS[tu.step].id === 'sling' && G.rope.visible) G.rope.len = clamp(G.rope.pathLen * 0.97, 140, 700);
        // para embestir hace falta velocidad: volver a un peso medio
        if (STEPS[tu.step].id === 'ram') { G.players.forEach(p => { if (p.alive) p.setMass(clamp(p.mass, 2, 3.2)); }); if (G.rope.visible) G.rope.len = Math.max(G.rope.len, 420); }
      }
    }
  }

  function drawHUD(ctx, W, H) {
    const tu = T(); if (!tu) return;
    const st = STEPS[tu.step], ink = PALETTE.ink;
    const w = Math.min(980, W - 120), h = 166, x = W / 2 - w / 2, y = 26;
    ctx.save();
    ctx.fillStyle = 'rgba(40,20,10,0.25)'; rr(ctx, x + 5, y + 7, w, h, 24); ctx.fill();
    rr(ctx, x, y, w, h, 24); ctx.fillStyle = '#fff6e6'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = ink; ctx.stroke();
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = PALETTE.inkSoft; ctx.font = font(18, 700);
    const total = STEPS.length - 1;
    ctx.fillText(st.id === 'done' ? 'TUTORIAL COMPLETO' : `PASO ${tu.step + 1} DE ${total}`, x + 28, y + 36);
    ctx.fillStyle = ink; ctx.font = font(40, 700); ctx.fillText(st.title, x + 28, y + 80);
    ctx.font = font(20, 500); ctx.fillStyle = PALETTE.inkSoft;
    // texto de la meta, en una o dos líneas
    const words = st.goal.split(' '); let line = '', lines = [];
    const maxW = st.id === 'done' ? w - 280 : w - 330;
    for (const wd of words) { const tst = line ? line + ' ' + wd : wd; if (ctx.measureText(tst).width > maxW && line) { lines.push(line); line = wd; } else line = tst; }
    lines.push(line);
    lines.slice(0, 2).forEach((l, k) => ctx.fillText(l, x + 28, y + 110 + k * 25));
    // casillas por jugador: teclas, peso y si ya cumplió
    const P = Game.G.players;
    if (st.id !== 'done') [0, 1].forEach(i => {
      const bx = x + w - 290 + i * 140, by = y + 26;
      if (!active(i)) {
        ctx.setLineDash([6, 6]); rr(ctx, bx, by, 126, 98, 16); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(58,34,22,0.4)'; ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = PALETTE.inkSoft; ctx.font = font(14, 600); ctx.textAlign = 'center';
        ctx.fillText('Menta es un', bx + 63, by + 44); ctx.fillText('muñeco de', bx + 63, by + 62); ctx.fillText('práctica', bx + 63, by + 80);
        ctx.textAlign = 'left';
        return;
      }
      rr(ctx, bx, by, 126, 98, 16); ctx.fillStyle = rgba(P[i].col.base, tu.done[i] ? 0.35 : 0.14); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
      ctx.fillStyle = ink; ctx.font = font(18, 700); ctx.textAlign = 'left';
      ctx.fillText(P[i].name.toUpperCase(), bx + 12, by + 26);
      ctx.font = font(15, 700); ctx.fillText(Touch.enabled && st.tkeys ? st.tkeys : st.keys[i], bx + 12, by + 54);
      ctx.font = font(14, 600); ctx.fillStyle = PALETTE.inkSoft;
      ctx.fillText(P[i].alive ? `peso ${P[i].mass.toFixed(1).replace('.', ',')}` : 'volviendo…', bx + 12, by + 80);
      ctx.beginPath(); ctx.arc(bx + 104, by + 20, 12, 0, TAU);
      ctx.fillStyle = tu.done[i] ? '#4cb648' : '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
      if (tu.done[i]) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(bx + 98, by + 20); ctx.lineTo(bx + 102, by + 25); ctx.lineTo(bx + 111, by + 14); ctx.stroke(); }
    });
    else { ctx.font = font(18, 600); ctx.fillStyle = PALETTE.inkSoft; ctx.textAlign = 'right'; ctx.fillText('Volviendo al menú…', x + w - 30, y + 80); ctx.textAlign = 'left'; }
    // barra de progreso
    ctx.fillStyle = 'rgba(58,34,22,0.12)'; rr(ctx, x + 28, y + h - 13, w - 56, 6, 3); ctx.fill();
    ctx.fillStyle = PALETTE.fresa.base; rr(ctx, x + 28, y + h - 13, (w - 56) * Math.min(1, tu.step / total), 6, 3); ctx.fill();
    ctx.restore();
  }

  return { start, update, onEvent, onRam, drawHUD, STEPS, set onEnd(fn) { onEnd = fn; } };
})();
