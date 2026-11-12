/* =========================================================================
   RETOS DE TÉCNICA — doce pruebas cortas para un jugador (Fresa) contra un
   muñeco de práctica. Cada una enseña una jugada (salto doble, tirachinas,
   picada, pegarse a la pared, salvarse del filo…) y da medalla según el
   tiempo: oro, plata o bronce. Lo mejor de cada reto se guarda (tya_retos).
   ========================================================================= */
class RetoDummy {
  // pin: pegado para siempre donde está; walk: no se pega y vuelve despacio a su casa
  constructor(mode, home) { this.mode = mode; this.home = home; }
  think(dt, G) {
    const me = G.players[1];
    const none = { left: false, right: false, jump: false, stick: false, pull: false, release: false };
    if (this.mode === 'pin') return Object.assign(none, { stick: true });
    const dx = this.home.x - me.x;
    if (me.alive && me.onGround && me.stun <= 0 && Math.abs(dx) > 24) me.vx = clamp(dx * 1.5, -150, 150);
    return none;
  }
}

const Retos = (() => {
  // y de las superficies del Pupitre y del Gimnasio (para poner al muñeco encima)
  const FLOOR = 640, ERASER = 606, RULER = 452, BOOKS_TOP = 543, VAULT = 602;
  const LIST = [
    {
      id: 'saltos', title: 'Primeros saltos', arena: 'pupitre', skill: 'Salto',
      goal: 'Toca las 5 estrellas. Si mantienes saltar, subes más.',
      player: [700, FLOOR], dummy: { x: 960, on: ERASER, mode: 'pin' }, rope: 700,
      stars: [[400, 560], [574, 450], [960, 370], [1346, 450], [1520, 560]],
      gold: 8, silver: 13, limit: 45,
    },
    {
      id: 'alto', title: 'Alto vuelo', arena: 'pupitre', skill: 'Aflojar',
      goal: 'Lejos y muy alto: afloja el hilo. Te da más hilo para llegar lejos y, al pesar menos, saltas más. ¡Ojo con las canecas!',
      player: [760, FLOOR], dummy: { x: 960, on: ERASER, mode: 'pin' }, rope: 600,
      stars: [[221, 300], [960, 50], [1699, 300]],
      gold: 10, silver: 16, limit: 50,
    },
    {
      id: 'doble', title: 'Salto doble', arena: 'pupitre', skill: 'Salto doble',
      goal: 'Estas estrellas solo cuentan en el aire después del salto doble: salta otra vez sin tocar el piso.',
      player: [700, FLOOR], dummy: { x: 960, on: ERASER, mode: 'pin' }, rope: 720,
      stars: [[574, 190, 'air'], [960, 90, 'air'], [1346, 190, 'air']],
      gold: 8, silver: 13, limit: 50,
    },
    {
      id: 'embestida', title: 'Embestida', arena: 'gimnasio', skill: 'Embestir',
      goal: 'Choca 3 veces contra el muñeco. Hace falta carrerita: tocarlo despacio no cuenta.',
      player: [560, FLOOR], dummy: { x: 340, on: FLOOR, mode: 'pin' }, rope: 420,
      stars: [], need: { ram: 3 },
      gold: 4, silver: 7, limit: 40,
    },
    {
      id: 'tirachinas', title: 'Tirachinas', arena: 'pupitre', skill: 'Tirachinas',
      goal: 'Pégate, tira hasta estirar el hilo y suelta pegarse: sales disparado hacia el muñeco. Pasa volando por las estrellas.',
      player: [420, FLOOR], dummy: { x: 960, on: RULER, mode: 'pin' }, rope: 600,
      stars: [[740, 500, 'sling'], [1190, 420, 'sling'], [560, 375, 'sling']],
      gold: 14, silver: 24, limit: 75,
    },
    {
      id: 'picada', title: 'Picada y aplastón', arena: 'pupitre', skill: 'Picada',
      goal: 'En el aire, mantén pegarse para caer en picada. Toca las estrellas en picada y cáele encima al muñeco.',
      player: [760, FLOOR], dummy: { x: 960, on: RULER, mode: 'pin' }, rope: 720,
      stars: [[400, 560, 'dive'], [1346, 420, 'dive'], [1520, 560, 'dive']], need: { stomp: 1 },
      gold: 10, silver: 16, limit: 50,
    },
    {
      id: 'pared', title: 'Pared pegajosa', arena: 'pupitre', skill: 'Pegarse',
      goal: 'Bájate del pupitre y pégate a su costado (aprieta pegarse junto a la pared). Desde ahí, salta para volver arriba.',
      player: [700, FLOOR], dummy: { x: 960, on: ERASER, mode: 'pin' }, rope: 790,
      stars: [[228, 665, 'wall'], [1692, 665, 'wall']],
      gold: 9, silver: 15, limit: 50,
    },
    {
      id: 'filo', title: '¡Al filo!', arena: 'pupitre', skill: 'Salvarse',
      goal: 'Empiezas colgando sobre la caneca: tira del hilo para volver al pupitre. Después, sube al estante.',
      player: [222, 770], dummy: { x: 760, on: FLOOR, mode: 'pin' }, rope: 500,
      stars: [[221, 318]], need: { saved: 1 },
      gold: 4.5, silver: 8, limit: 40,
    },
    {
      id: 'caneca', title: '¡A la caneca!', arena: 'bus', skill: 'Ganar',
      goal: 'Echa al muñeco a una caneca: embístelo, úsalo de tirachinas, aprovecha el frenazo del bus o cuélgate del borde y tira.',
      player: [700, FLOOR], dummy: { x: 1000, on: FLOOR, mode: 'walk', mass: 3.4 }, rope: 450,
      stars: [], need: { dunk: 1 },
      gold: 6, silver: 11, limit: 50,
    },
    {
      id: 'rebotes', title: 'Rebotes', arena: 'gimnasio', skill: 'Colchonetas',
      goal: 'Usa las colchonetas: si saltas justo al caer en ellas, rebotas más alto.',
      player: [760, FLOOR], dummy: { x: 960, on: VAULT, mode: 'pin' }, rope: 700,
      stars: [[810, 200], [1110, 200], [435, 320], [1485, 320], [960, 90]],
      gold: 11, silver: 18, limit: 60,
    },
    {
      id: 'contrarreloj', title: 'Contrarreloj', arena: 'pupitre', skill: 'Ruta', seq: true,
      goal: 'Las estrellas aparecen de a una. Busca la ruta más rápida.',
      player: [700, FLOOR], dummy: { x: 960, on: ERASER, mode: 'pin' }, rope: 760,
      stars: [[400, 560], [574, 450], [960, 200], [1346, 450], [1520, 560], [1180, 380], [960, 560], [740, 380]],
      gold: 15, silver: 22, limit: 70,
    },
    {
      id: 'final', title: 'Gran final', arena: 'pupitre', skill: 'Todo', seq: true,
      goal: 'Un poco de todo, en orden: salto, tirachinas, salto doble, pared y picada. Al final, aplasta al muñeco.',
      player: [1100, FLOOR], dummy: { x: 574, on: BOOKS_TOP, mode: 'pin' }, rope: 640,
      stars: [[960, 370], [800, 520, 'sling'], [330, 300, 'air'], [228, 665, 'wall'], [420, 560, 'dive']], need: { stomp: 1 },
      gold: 18, silver: 28, limit: 90,
    },
  ];
  const KIND = {
    any: { color: '#ffd84d', label: '' },
    air: { color: '#7fd8ff', label: 'SALTO DOBLE', miss: '¡Con salto doble!' },
    sling: { color: '#ff9a5c', label: 'TIRACHINAS', miss: '¡Con tirachinas!' },
    dive: { color: '#ff8fc4', label: 'PICADA', miss: '¡En picada!' },
    wall: { color: '#8ff0a8', label: 'PARED', miss: '¡Pegado a la pared!' },
  };
  const NEED_LABEL = { ram: 'Embestidas', stomp: 'Aplastones', saved: 'Salvadas', dunk: 'A la caneca' };
  const MEDAL = [
    null,
    { name: 'BRONCE', color: '#d98a4e', light: '#f3b583' },
    { name: 'PLATA', color: '#b9c6d2', light: '#e6eef5' },
    { name: 'ORO', color: '#ffc93c', light: '#fff0a8' },
  ];

  const data = (() => { const d = Store.get('retos', null); return d && d.best && d.medal ? d : { best: {}, medal: {} }; })();
  let onExit = null;

  const R = () => Game.G.reto;
  const fmt = t => t.toFixed(1).replace('.', ',');
  const num = n => String(n).replace('.', ',');

  function start(idx) {
    const def = LIST[idx]; if (!def) return;
    const G = Game.G;
    Game.startMatch('caneca', true, def.arena);
    const [A, B] = G.players;
    const dm = def.dummy.mass || 3;
    A.reset(def.player[0], def.player[1], 3);
    B.reset(def.dummy.x, def.dummy.on, dm);
    const by = B.y;
    if (def.dummy.mode === 'pin') {
      B.stuck = true; B.stuckN = { x: 0, y: -1 }; B.stuckX = B.x; B.stuckY = B.y; B.stuckR = null;
      B.anchor = true; B.pinned = true;
    }
    G.rope.reset(A.x, A.y, B.x, B.y, def.rope); G.rope.visible = true;
    G.bots = [null, new RetoDummy(def.dummy.mode, { x: def.dummy.x, y: by })];
    G.reto = {
      idx, def, t: 0, phase: 'play', endT: 0, failT: 0, missT: {},
      stars: def.stars.map(([x, y, kind]) => ({ x, y, kind: kind || 'any', got: false, popT: 0 })),
      cnt: { ram: 0, stomp: 0, saved: 0, dunk: 0 }, result: null, prevIn: { jump: true, stick: true },
    };
    G.countdownLen = 1.3; G.hintsT = 0;
    Sound.Music.setMode('game');
  }

  function need(r) { return r.def.need || {}; }
  function activeStar(r) { return r.def.seq ? r.stars.find(s => !s.got) : null; }
  function complete(r) {
    if (r.stars.some(s => !s.got)) return false;
    const n = need(r);
    return Object.keys(n).every(k => r.cnt[k] >= n[k]);
  }

  function starOK(p, kind) {
    if (kind === 'air') return !p.onGround && p.airJumps === 0;
    if (kind === 'sling') return p.slingT > 0;
    if (kind === 'dive') return p.diveT > 0;
    if (kind === 'wall') return p.stuck && Math.abs(p.stuckN.x) > 0.6;
    return true;
  }

  function finish(r) {
    const G = Game.G, t = r.t, def = r.def;
    const medal = t <= def.gold ? 3 : t <= def.silver ? 2 : 1;
    const prevBest = data.best[def.id], prevMedal = data.medal[def.id] || 0;
    const newBest = prevBest === undefined || t < prevBest;
    if (newBest) data.best[def.id] = +t.toFixed(2);
    if (medal > prevMedal) data.medal[def.id] = medal;
    Store.set('retos', data);
    r.phase = 'done'; r.endT = 0;
    r.result = { t, medal, newBest, prevBest, upgraded: medal > prevMedal };
    G.canControl = false;
    const p = G.players[0];
    p.mood = 'happy';
    FX.confetti(960, 200, medal === 3 ? 140 : 70, 1300);
    Sound.play(medal === 3 ? 'win' : 'roundWin');
    FX.banner(medal === 3 ? '¡ORO!' : medal === 2 ? '¡PLATA!' : '¡BRONCE!', { size: 170, life: 1.4, color: MEDAL[medal].color, y: 0.3 });
    Progress.on('reto', { id: def.id, medal, golds: LIST.filter(d => data.medal[d.id] === 3).length, done: LIST.filter(d => data.medal[d.id]).length, total: LIST.length });
  }

  function fail(r, why) {
    if (r.phase !== 'play') return;
    r.phase = 'fail'; r.failT = 0;
    Game.G.canControl = false;
    FX.banner(why === 'time' ? '¡SE ACABÓ EL TIEMPO!' : '¡OTRA VEZ!', { size: 120, life: 1.2, color: '#ff8a7a', y: 0.36 });
    Sound.play('back');
  }

  function collect(r, s, p) {
    s.got = true; s.popT = 0.001;
    Sound.play('pellet', 1 + r.stars.filter(q => q.got).length * 0.07);
    FX.sparkle(s.x, s.y, KIND[s.kind].color, 16);
    FX.ring(s.x, s.y, '#ffffff', 70, 0.35, 6);
    if (s.kind !== 'any') FX.callout('¡BIEN!', s.x, s.y - 50, '#9dffb0', 40, 0.9);
    const nx = activeStar(r);
    if (nx) { FX.sparkle(nx.x, nx.y, '#ffffff', 10); }
    void p;
  }

  function update(dt) {
    const r = R(); if (!r) return;
    const G = Game.G;
    G.suddenDeath = false; G.golden = null; G.goldenNext = 1e9; G.pellets.length = 0;
    const p = G.players[0];
    for (const s of r.stars) if (s.popT > 0) s.popT += dt;
    for (const k in r.missT) r.missT[k] = Math.max(0, r.missT[k] - dt);
    if (r.phase === 'play') {
      r.t += dt;
      if (p.alive) {
        const act = activeStar(r);
        r.stars.forEach((s, i) => {
          if (s.got || (r.def.seq && s !== act)) return;
          if (Math.hypot(p.x - s.x, p.y - s.y) < p.r + 24) {
            if (starOK(p, s.kind)) collect(r, s, p);
            else if (!r.missT[i]) { r.missT[i] = 1.4; FX.callout(KIND[s.kind].miss, s.x, s.y - 54, '#ffffff', 30, 1); Sound.play('bump', 0.4); }
          }
        });
      }
      if (complete(r)) finish(r);
      else if (r.t > r.def.limit) fail(r, 'time');
    } else if (r.phase === 'fail') {
      r.failT += dt;
      if (r.failT > 1.5) start(r.idx);
    } else if (r.phase === 'done') {
      r.endT += dt;
      const inp = Input.player(0);
      const jumpP = inp.jump && !r.prevIn.jump, stickP = inp.stick && !r.prevIn.stick;
      r.prevIn = { jump: inp.jump, stick: inp.stick };
      if (r.endT > 0.8) {
        if (jumpP) { if (r.idx + 1 < LIST.length) start(r.idx + 1); else if (onExit) onExit(r.idx); }
        else if (stickP) start(r.idx);
      }
    }
    if (r.phase !== 'done') r.prevIn = { jump: true, stick: true };
  }

  /* ---------------- ganchos desde el juego ---------------- */
  function onRam(att, info) {
    const r = R(); if (!r || r.phase !== 'play' || att.id !== 0) return;
    if (info.stomp) r.cnt.stomp++;
    r.cnt.ram++;
  }
  function onSaved(p) { const r = R(); if (r && r.phase === 'play' && p.id === 0) r.cnt.saved++; }
  function onDunk(p) {
    const r = R(); if (!r) return;
    const G = Game.G;
    if (p.id === 1) {
      if (r.phase === 'play') {
        r.cnt.dunk++;
        G.rope.visible = false;
        FX.gum(p.x, p.y - 40, p.col, 10, 1.1, 0, -1); Sound.play('dunk');
      }
    } else if (r.phase === 'play') { Sound.play('dunk'); fail(r, 'dunk'); }
  }

  /* ---------------- dibujo ---------------- */
  function drawWorld(ctx, t) {
    const r = R(); if (!r) return;
    const act = activeStar(r);
    ctx.save();
    r.stars.forEach(s => {
      if (s.got) {
        if (s.popT > 0 && s.popT < 0.45) {
          const k = s.popT / 0.45;
          ctx.globalAlpha = 1 - k;
          drawStar(ctx, s.x, s.y, 24 * (1 + k * 1.2), KIND[s.kind].color, t * 3);
          ctx.globalAlpha = 1;
        }
        return;
      }
      const K = KIND[s.kind];
      const ghost = r.def.seq && s !== act;
      if (ghost) {
        ctx.globalAlpha = 0.22;
        drawStar(ctx, s.x, s.y, 16, '#ffffff', 0);
        ctx.globalAlpha = 1;
        return;
      }
      const pulse = 1 + Math.sin(t * 5 + s.x * 0.01) * 0.08;
      const gl = ctx.createRadialGradient(s.x, s.y, 4, s.x, s.y, 58);
      gl.addColorStop(0, rgba(K.color, 0.55)); gl.addColorStop(1, rgba(K.color, 0));
      ctx.fillStyle = gl; ctx.fillRect(s.x - 58, s.y - 58, 116, 116);
      drawStar(ctx, s.x, s.y, 25 * pulse, K.color, Math.sin(t * 1.6 + s.y) * 0.25);
      if (K.label) {
        ctx.font = font(14, 700);
        const w = ctx.measureText(K.label).width + 16;
        rr(ctx, s.x - w / 2, s.y + 30, w, 22, 11);
        ctx.fillStyle = '#fff6e6'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = PALETTE.ink; ctx.stroke();
        ctx.fillStyle = PALETTE.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(K.label, s.x, s.y + 42);
      }
    });
    ctx.restore();
  }

  function medalDisc(ctx, x, y, rad, m, label) {
    const M = MEDAL[m];
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU);
    ctx.fillStyle = M ? M.color : 'rgba(58,34,22,0.08)'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = M ? PALETTE.ink : 'rgba(58,34,22,0.35)';
    if (!M) ctx.setLineDash([5, 5]);
    ctx.stroke(); ctx.setLineDash([]);
    if (M) { ctx.beginPath(); ctx.arc(x - rad * 0.25, y - rad * 0.25, rad * 0.45, 0, TAU); ctx.fillStyle = rgba(M.light, 0.7); ctx.fill(); }
    if (label) { ctx.fillStyle = PALETTE.ink; ctx.font = font(Math.round(rad * 0.75), 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, x, y + 1); }
    ctx.restore();
  }

  function wrap(ctx, text, maxW) {
    const words = text.split(' '); let line = ''; const lines = [];
    for (const wd of words) { const tst = line ? line + ' ' + wd : wd; if (ctx.measureText(tst).width > maxW && line) { lines.push(line); line = wd; } else line = tst; }
    lines.push(line);
    return lines;
  }

  // franja libre abajo (con botones táctiles, entre los dos grupos de botones)
  function bottomBand(W, maxW) {
    let x0 = 40, x1 = W - 40;
    const ins = Touch.insets();
    if (ins) { const k = W / ins.vw; x0 = Math.max(x0, ins.l * k + 14); x1 = Math.min(x1, W - ins.r * k - 14); }
    const w = Math.min(maxW, x1 - x0);
    return { x: (x0 + x1) / 2 - w / 2, w };
  }

  function drawHUD(ctx, W, H) {
    const r = R(); if (!r) return;
    const def = r.def, ink = PALETTE.ink;
    const band = bottomBand(W, 1100), w = band.w, x = band.x;
    const compact = w < 1000, side = compact ? 250 : 380;
    ctx.save();
    ctx.font = font(compact ? 17 : 18, 500);
    const goal = wrap(ctx, def.goal, w - side - 40).slice(0, compact ? 3 : 2);
    const h = compact ? 96 + goal.length * 21 : 150, y = H - h - 18; // abajo: arriba están las estrellas
    ctx.fillStyle = 'rgba(40,20,10,0.25)'; rr(ctx, x + 5, y + 7, w, h, 24); ctx.fill();
    rr(ctx, x, y, w, h, 24); ctx.fillStyle = '#fff6e6'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = ink; ctx.stroke();
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = PALETTE.inkSoft; ctx.font = font(compact ? 15 : 17, 700);
    const head = `RETO ${r.idx + 1} DE ${LIST.length} · ${def.skill.toUpperCase()}`;
    ctx.fillText(head, x + 24, y + (compact ? 28 : 34));
    const headW = ctx.measureText(head).width;
    ctx.fillStyle = ink; ctx.font = font(compact ? 30 : 36, 700); ctx.fillText(def.title, x + 24, y + (compact ? 62 : 74));
    ctx.font = font(compact ? 17 : 18, 500); ctx.fillStyle = PALETTE.inkSoft;
    goal.forEach((l, k) => ctx.fillText(l, x + 24, y + (compact ? 88 : 102) + k * (compact ? 21 : 23)));
    // progreso: estrellas y lo demás
    const chips = [];
    if (r.stars.length) chips.push([`★ ${r.stars.filter(s => s.got).length}/${r.stars.length}`, '#ffd84d']);
    for (const k in need(r)) chips.push([`${NEED_LABEL[k]} ${Math.min(r.cnt[k], need(r)[k])}/${need(r)[k]}`, '#9dffb0']);
    ctx.font = font(compact ? 16 : 18, 700);
    if (compact) {
      // en una fila, junto al encabezado
      let cx = x + 24 + headW + 14;
      chips.forEach(([txt, col]) => {
        const cw = ctx.measureText(txt).width + 18;
        if (cx + cw > x + w - side) return;
        rr(ctx, cx, y + 10, cw, 26, 13); ctx.fillStyle = rgba(col, 0.55); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = ink; ctx.stroke();
        ctx.fillStyle = ink; ctx.fillText(txt, cx + 9, y + 29); cx += cw + 8;
      });
    } else {
      const cx = x + w - 380;
      chips.forEach(([txt, col], i) => {
        const cw = ctx.measureText(txt).width + 22, cy = y + 22 + i * 36;
        rr(ctx, cx, cy, cw, 30, 15); ctx.fillStyle = rgba(col, 0.55); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = ink; ctx.stroke();
        ctx.fillStyle = ink; ctx.fillText(txt, cx + 11, cy + 21);
      });
    }
    // reloj y medallas meta
    const tx = x + w - (compact ? 22 : 30);
    const tm = r.phase === 'done' && r.result ? r.result.t : r.t;
    const cur = tm <= def.gold ? 3 : tm <= def.silver ? 2 : 1;
    ctx.textAlign = 'right';
    ctx.font = font(compact ? 42 : 48, 700); ctx.fillStyle = MEDAL[cur].color === '#b9c6d2' ? '#7f8d99' : cur === 1 ? '#b8662c' : '#d9a300';
    ctx.fillText(fmt(tm) + ' s', tx, y + (compact ? 52 : 66));
    const my = y + (compact ? 80 : 100);
    medalDisc(ctx, tx - 200, my, 13, 3); ctx.textAlign = 'left'; ctx.fillStyle = ink; ctx.font = font(17, 700); ctx.fillText(`${num(def.gold)} s`, tx - 182, my + 6);
    medalDisc(ctx, tx - 112, my, 13, 2); ctx.fillStyle = ink; ctx.fillText(`${num(def.silver)} s`, tx - 94, my + 6);
    ctx.textAlign = 'right'; ctx.font = font(15, 600); ctx.fillStyle = PALETTE.inkSoft;
    const best = data.best[def.id];
    ctx.fillText(best !== undefined ? `récord ${fmt(best)} s` : `límite ${def.limit} s`, tx, my + (compact ? 30 : 34));
    ctx.restore();

    if (r.phase === 'done' && r.result) drawDone(ctx, W, H, r);
  }

  function drawDone(ctx, W, H, r) {
    const res = r.result, M = MEDAL[res.medal], ink = PALETTE.ink;
    const k = clamp(r.endT / 0.35, 0, 1), e = 1 - Math.pow(1 - k, 3);
    const w = 620, h = 300, x = W / 2 - w / 2, y = H * 0.5 - h / 2 + (1 - e) * 60;
    ctx.save();
    ctx.globalAlpha = e;
    ctx.fillStyle = 'rgba(40,20,10,0.3)'; rr(ctx, x + 6, y + 9, w, h, 28); ctx.fill();
    rr(ctx, x, y, w, h, 28); ctx.fillStyle = '#fff6e6'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = ink; ctx.stroke();
    medalDisc(ctx, x + 110, y + 120, 66, res.medal);
    drawStar(ctx, x + 110, y + 120, 30, '#ffffff', 0);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = ink; ctx.font = font(46, 700); ctx.fillText(`¡${M.name[0] + M.name.slice(1).toLowerCase()}!`, x + 210, y + 92);
    ctx.font = font(30, 700); ctx.fillText(`${fmt(res.t)} s`, x + 210, y + 136);
    ctx.font = font(18, 600); ctx.fillStyle = PALETTE.inkSoft;
    const sub = res.newBest && res.prevBest !== undefined ? `¡Récord nuevo! (antes ${fmt(res.prevBest)} s)` : res.newBest ? 'Primera vez superado' : `Récord: ${fmt(data.best[r.def.id])} s`;
    ctx.fillText(sub, x + 210, y + 166);
    if (res.medal < 3) { ctx.fillText(res.medal === 2 ? `Oro en ${num(r.def.gold)} s o menos` : `Plata en ${num(r.def.silver)} s · oro en ${num(r.def.gold)} s`, x + 210, y + 192); }
    // qué hacer ahora
    const last = r.idx + 1 >= LIST.length;
    const keys = Touch.enabled ? ['▲', '●'] : ['W', 'S'];
    ctx.font = font(20, 700); ctx.fillStyle = ink; ctx.textAlign = 'center';
    ctx.fillText(`${keys[0]}  ${last ? 'volver a la lista' : 'siguiente reto'}     ·     ${keys[1]}  repetir`, W / 2, y + h - 34);
    ctx.restore();
  }

  function camera() { return { x: 960, y: 540, z: 1 }; }

  return {
    LIST, MEDAL, data, start, update, onRam, onSaved, onDunk, drawWorld, drawHUD, camera, medalDisc, wrap, bottomBand,
    get count() { return LIST.length; },
    medals() { return LIST.reduce((a, d) => a + (data.medal[d.id] || 0), 0); },
    set onExit(fn) { onExit = fn; },
  };
})();
