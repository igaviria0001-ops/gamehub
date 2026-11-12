// Soluciones de guion por sala (se ejecutan dentro de la página). Devuelve { id: () => {...} }
const both = (c) => [c, c];
const S = {};

S['1-1'] = () => {
  run(W.go(560), W.go(660), () => P(1).x > 645 && P(0).x > 540, 400);
  run(W.go(1785), W.go(1795), null, 900);
};
S['1-2'] = () => {
  // A engorda y se para en la placa; luego los dos van a la puerta
  run(W.go(770, { pull: true }), W.go(560), () => P(0).mass >= 4.6 && Math.abs(P(0).x - 770) < 20, 400);
  run(W.go(770), W.idle, () => G.players.some(p => p.groundR && p.groundR.kind === 'plate' && p.groundR.pressed), 120);
  run(W.go(1725), W.go(1715), null, 700);
};
S['1-3'] = () => {
  run(W.hold({ release: true }), W.hold({ release: true }), () => P(0).mass <= 2.1 && P(1).mass <= 2.1, 200);
  run(W.go(1440), W.go(1330), () => P(0).x > 1420 && P(1).x > 1300, 600);
  run(W.go(1780), W.go(1760), null, 600);
};
S['1-4'] = () => {
  // A se ancla cerca del borde; B cruza por las tablas; luego B se ancla y A cruza cuando vuelven las tablas
  run(W.go(560), W.go(620), () => P(1).x > 610 && P(0).x > 545, 300);
  run(W.hold({ stick: true }), W.jumpTo(780, 30), () => P(1).onGround && P(1).x > 720, 90);
  run(W.hold({ stick: true }), W.jumpTo(960, 30), () => P(1).onGround && P(1).x > 900, 90);
  run(W.hold({ stick: true }), W.jumpTo(1200, 30), () => P(1).onGround && P(1).x > 1120, 90);
  run(W.go(600), W.go(1160), () => ARENA.L.objs.every(o => o.kind !== 'crumble' || !(o.gone > 0)), 300);
  run(W.jumpTo(780, 30), W.hold({ stick: true }), () => P(0).onGround && P(0).x > 720, 90);
  run(W.jumpTo(960, 30), W.hold({ stick: true }), () => P(0).onGround && P(0).x > 900, 90);
  run(W.jumpTo(1200, 30), W.hold({ stick: true }), () => P(0).onGround && P(0).x > 1120, 90);
  run(W.go(1755), W.go(1770), null, 600);
};
S['1-5'] = () => {
  run(W.go(900), W.go(1375), () => Math.abs(P(1).x - 1375) < 20 && P(0).x > 880, 500);
  run(W.jumpTo(1055, 30), W.go(1375), () => P(0).onGround && P(0).x > 1000, 120);
  run(W.go(1055, { pull: true }), W.go(1375), () => P(1).y < 660, 400);
  run(W.go(1055), W.jumpTo(1560, 30), () => P(1).onGround && P(1).x > 1470, 120);
  run(W.go(1100, { release: true }), W.go(1560), () => P(0).mass <= 1.6, 300);
  run(W.go(1130), W.go(1580), () => Math.abs(P(0).x - 1130) < 15, 300);
  run(W.jumpTo(1380, 30), W.go(1580), () => P(0).onGround && P(0).x > 1310, 100);
  run(W.jumpTo(1560, 30), W.go(1620), () => P(0).onGround && P(0).y < 560, 120);
  run(W.go(1700), W.go(1780), () => P(0).x > 1470 && P(0).onGround, 300);
  run(W.go(1790), W.go(1780), null, 600);
};

S['2-1'] = () => {
  run(W.go(1785), W.go(1795), null, 900);
};
S['2-3'] = () => {
  run(W.go(395, { pull: true }), W.go(500), () => P(0).mass >= 4.6 && Math.abs(P(0).x - 395) < 20, 400);
  run(W.go(395), W.idle, () => ARENA.L.objs.some(o => o.kind === 'gate' && o.open > 0.95), 200);
  run(W.hold({ release: true }), W.hold({ release: true }), () => P(0).mass <= 1.95 && P(1).mass <= 1.95, 300);
  // B adelante salta de papel en papel; A lo sigue
  const hop = (who, x, y) => { const c = W.jumpTo(x, 30); run(who === 0 ? c : W.idle, who === 1 ? c : W.idle, () => P(who).onGround && Math.abs(P(who).x - x) < 70 && P(who).y < y, 100); };
  run(W.go(470), W.go(560), () => P(1).x > 545, 200);
  hop(1, 690, 860); hop(0, 650, 860);
  hop(1, 930, 780); hop(0, 690, 860);
  hop(1, 1160, 700); hop(0, 930, 780);
  hop(1, 1390, 640); hop(0, 1160, 700);
  hop(1, 1660, 600); hop(0, 1390, 640);
  hop(0, 1640, 600);
  run(W.go(1780), W.go(1790), null, 600);
};
S['2-4'] = () => {
  run(W.hold({ release: true }), W.hold({ release: true }), () => P(0).mass <= 1.8 && P(1).mass <= 1.8, 300);
  run(W.go(1360), W.go(1420), () => P(1).y < 230 || P(0).y < 230, 600);
  run(W.go(1700), W.go(1700), () => P(0).x > 1520 && P(1).x > 1520 && P(0).onGround && P(1).onGround, 400);
  run(W.go(1760), W.go(1770), null, 600);
};
S['2-5'] = () => {
  run(W.hold({ release: true }), W.hold({ release: true }), () => P(0).mass <= 1.75 && P(1).mass <= 1.75, 300);
  run(W.go(1150), W.go(1475), () => Math.abs(P(1).x - 1475) < 20 && P(0).x > 1130 && P(0).onGround && P(0).y < 790, 600);
  run(W.jumpTo(1295, 30), W.go(1475), () => P(0).onGround && P(0).x > 1240 && P(0).y < 720, 120);
  run(W.go(1295, { pull: true }), W.go(1475), () => P(1).y < 650, 400);
  run(W.go(1295), W.jumpTo(1640, 30), () => P(1).onGround && P(1).x > 1580, 120);
  run(W.go(1295, { release: P(0).mass > 1.8 }), W.go(1700), () => P(0).mass <= 1.8, 300);
  run(W.go(1330), W.go(1700), () => P(0).onGround && P(0).y > 800, 300);
  run(W.go(1160), W.go(1700), () => Math.abs(P(0).x - 1160) < 15 && P(0).onGround, 300);
  run(W.jumpTo(1475, 30), W.go(1700), () => P(0).onGround && P(0).x > 1410 && P(0).y < 700, 100);
  run(W.jumpTo(1640, 30), W.go(1720), () => P(0).onGround && P(0).y < 420, 120);
  run(W.go(1760), W.go(1770), null, 600);
};

S['2-2'] = () => {
  const M = i => ARENA.oneway.filter(o => o.kind === 'mover')[i];
  const plank = () => ARENA.oneway.find(o => o.kind === 'plank');
  const lever = () => ARENA.L.objs.find(o => o.kind === 'lever');
  const on = (i, R) => P(i).onGround && P(i).groundR === R;
  const follow = (R, off = 0) => p => { const cx = R.x + R.w / 2 + off; return { left: p.x > cx + 8, right: p.x < cx - 8 }; };
  const hop = (R, hold = 28, lead = 0) => (p, m) => { m.f = (m.f || 0) + 1; const cx = R.x + R.w / 2 + lead; return { jump: m.f < hold, left: p.x > cx + 10, right: p.x < cx - 10 }; };
  const two = (who, ctl, other, until, max) => run(who === 0 ? ctl : other, who === 1 ? ctl : other, until, max);
  // B sube al primer caballete cuando pasa por la izquierda
  run(W.go(330), W.go(470), () => P(1).x > 455 && M(0).x < 418, 500);
  two(1, hop(M(0), 20), W.go(380), () => on(1, M(0)), 90);
  two(1, follow(M(0)), W.go(420), () => M(0).x > 700, 300);
  two(1, hop(M(1), 4, 30), W.go(440), () => on(1, M(1)), 90);
  two(1, follow(M(1)), W.go(470), () => M(1).y < 655, 300);
  two(1, hop(plank(), 30, -60), W.go(470), () => on(1, plank()), 90);
  two(1, W.go(960), W.go(470), () => Math.abs(P(1).x - 960) < 14, 120);
  two(1, W.jumpTo(1025, 30), W.go(470), () => lever().on, 120);
  // A sube al primer caballete; B espera en la tabla
  two(0, W.go(470), W.go(1000), () => M(0).x < 418 && P(0).x > 455, 500);
  two(0, hop(M(0), 20), W.go(1000), () => on(0, M(0)), 90);
  two(0, follow(M(0)), W.go(1000), () => M(0).x > 700, 300);
  two(0, hop(M(1), 4, 30), W.go(1000), () => on(0, M(1)), 90);
  // B baja al tercer caballete y a tierra firme; A se queda en el segundo
  two(1, W.go(1090), follow(M(1)), () => M(2).x > 1110 && M(2).dx > 0, 400);
  two(1, hop(M(2), 10, 40), follow(M(1)), () => on(1, M(2)), 120);
  two(1, follow(M(2), 40), follow(M(1)), () => M(2).x > 1290, 300);
  two(1, W.go(1500), follow(M(1)), () => P(1).x > 1440 && P(1).onGround, 200);
  // A: cuando el segundo esté abajo, salta al tercero
  two(0, follow(M(1)), W.go(1500), () => M(1).y > 860 && M(2).x < 1080, 500);
  two(0, hop(M(2), 18, 0), W.go(1500), () => on(0, M(2)), 120);
  two(0, follow(M(2), 40), W.go(1500), () => M(2).x > 1290, 300);
  run(W.go(1770), W.go(1790), null, 600);
};

S['3-1'] = () => {
  run(W.go(820), W.go(840), () => P(0).onGround && P(1).onGround && P(0).y < 600 && P(1).y < 600, 500);
  run(W.go(800), W.go(1560), () => P(1).onGround && P(1).y < 320, 300);
  run(W.go(1500), W.go(1600), () => P(0).onGround && P(0).y < 320, 300);
  run(W.go(1785), W.go(1795), null, 600);
};
S['3-2'] = () => {
  run(W.hold({ release: true }), W.hold({ release: true }), () => (P(0).mass <= 1.6 && P(1).mass <= 1.6) || G.rope.len >= 795, 300);
  run(W.go(1500), W.go(1690), () => P(1).x > 1660 && P(1).onGround, 700);
  run(W.go(1500), W.go(1690, { pull: true }), () => P(1).mass >= 4.6, 400);
  run(W.go(1500), W.go(1690), () => ARENA.L.objs.some(o => o.kind === 'gate' && o.open > 0.95), 200);
  run(W.go(1830), W.go(1840), null, 600);
};
S['3-4'] = () => {
  run(W.hold({ release: true }), W.hold({ release: true }), () => (P(0).mass <= 1.6 && P(1).mass <= 1.6) || G.rope.len >= 795, 300);
  run(W.go(380), W.go(900), () => P(1).onGround && P(1).y < 300, 300);
  run(W.go(900), W.go(1100), () => P(0).onGround && P(0).y < 300, 300);
  run(W.go(1100), W.go(1360), () => P(0).onGround && P(0).y < 600 && P(1).x > 1340, 300);
  const hop = (who, x, y) => { const c = W.jumpTo(x, 30); run(who === 0 ? c : W.go(P(0).x), who === 1 ? c : W.go(P(1).x), () => P(who).onGround && Math.abs(P(who).x - x) < 70 && P(who).y < y, 100); };
  hop(1, 1500, 470); hop(1, 1640, 420); hop(1, 1790, 270);
  run(W.go(1360), W.go(1790), () => ARENA.L.objs.every(o => o.kind !== 'crumble' || !(o.gone > 0)), 400);
  hop(0, 1500, 470); hop(0, 1640, 420); hop(0, 1760, 270);
  run(W.go(1790), W.go(1810), null, 600);
};

S['3-3'] = () => {
  const R = i => ARENA.pegs.filter(o => o.kind === 'ring')[i];
  const holdStick = () => ({ stick: true });
  // saltar desde donde esté (suelo o anilla) hacia x, manteniendo «pegarse» para agarrar lo que toque
  // «pegarse» solo cuando la anilla está al alcance (si se mantiene en el aire sin nada cerca, es la picada)
  const hopGrab = (x, ring = null) => (p, m) => { m.f = (m.f || 0) + 1; const dir = Math.sign(x - p.x); const near = ring && Math.hypot(p.x - ring.x, p.y - ring.y) < p.r + ring.r + 18; m.n = near ? (m.n || 0) + 1 : 0; return { jump: m.f > 2 && m.f < 26, stick: p.stuck || (near && m.n % 3 !== 0), left: dir < 0 && Math.abs(x - p.x) > 8, right: dir > 0 && Math.abs(x - p.x) > 8 }; };
  const dbg = (n, ctl0, ctl1) => { for (let k = 0; k < n; k++) { run(ctl0, ctl1, null, 4); const a = P(0), b = P(1); log(`f A ${a.x|0},${a.y|0} st${a.stuck?1:0} ${a.sticky.toFixed(2)} | B ${b.x|0},${b.y|0} st${b.stuck?1:0} ${b.sticky.toFixed(2)} g${b.gripLoad.toFixed(2)} | strain ${G.rope.strain.toFixed(2)}`); if (Campaign.state.fail) break; } };
  const step = (who, x, ring) => { const c = hopGrab(x, ring); run(who === 0 ? c : holdStick, who === 1 ? c : holdStick, () => P(who).stuck && P(who).stuckR === ring, 120); log(`step ${who} -> ${x}: ${P(who).stuck && P(who).stuckR === ring}`); };
  const land = (who, x) => { const c = hopGrab(x); run(who === 0 ? c : holdStick, who === 1 ? c : holdStick, () => P(who).onGround && P(who).x > 1530, 120); log(`land ${who}: ${P(who).onGround}`); };
  run(W.go(380), W.go(420), () => P(1).x > 405, 200);
  step(1, R(0).x, R(0));
  step(1, R(1).x, R(1));
  step(0, R(0).x, R(0));
  step(1, R(2).x, R(2));
  step(0, R(1).x, R(1));
  step(1, R(3).x, R(3));
  step(0, R(2).x, R(2));
  land(1, 1580);
  run(holdStick, W.go(1560), null, 20);
  step(0, R(3).x, R(3));
  land(0, 1640);
  run(W.go(1790), W.go(1810), null, 600);
};

S['3-5'] = () => {
  const R = i => ARENA.pegs.filter(o => o.kind === 'ring')[i];
  const holdStick = () => ({ stick: true });
  const hopGrab = (x, ring = null, dj = false) => (p, m) => { m.f = (m.f || 0) + 1; const tx = x - (p.onGround ? 0 : p.vx * 0.3), dir = Math.sign(tx - p.x); const near = ring && p.y < ring.y - 20 && Math.hypot(p.x - ring.x, p.y - ring.y) < p.r + ring.r + 18; m.n = near ? (m.n || 0) + 1 : 0; return { jump: (m.f > 2 && m.f < 26) || (dj && m.f > 30 && m.f < 40), stick: p.stuck || (near && m.n % 3 !== 0), left: dir < 0 && Math.abs(tx - p.x) > 8, right: dir > 0 && Math.abs(tx - p.x) > 8 }; };
  const step = (who, x, ring, other, dj) => { const c = hopGrab(x, ring, dj); run(who === 0 ? c : other || holdStick, who === 1 ? c : other || holdStick, () => P(who).stuck && P(who).stuckR === ring, 140); log(`step ${who} -> ${ring ? 'ring' : x}: ${P(who).stuck && P(who).stuckR === ring}`); };
  const land = (who, x) => { const c = hopGrab(x); run(who === 0 ? c : holdStick, who === 1 ? c : holdStick, () => P(who).onGround && P(who).x > 1390, 140); log(`land ${who}: ${P(who).onGround}`); };
  // B corre por la cinta y salta a la primera anilla
  run(W.go(520), W.go(800), () => P(1).x > 660, 200);
  step(1, R(0).x, R(0), W.go(600));
  step(1, R(1).x, R(1), W.go(640));
  run(W.go(680), holdStick, () => Math.abs(P(0).x - 680) < 14 && P(0).onGround, 200);
  step(0, R(0).x, R(0));
  land(1, 1440);
  run(holdStick, W.go(1520), null, 30);
  step(0, R(1).x, R(1), W.go(1520));
  { const c = hopGrab(1430); run(c, W.go(1520), () => P(0).onGround && P(0).x > 1390, 140); }
  // cama elástica a la torre
  run(W.go(1440), W.go(1800), () => P(1).onGround && P(1).y < 400, 300);
  run(W.go(1780), W.go(1860), () => P(0).onGround && P(0).y < 400, 300);
  run(W.go(1825), W.go(1835), null, 600);
};

S['4-1'] = () => {
  const eye = () => ARENA.L.objs.find(o => o.kind === 'eye');
  const rem = () => { const o = eye(); const c = (o.t + o.phase) % (o.open + o.closed); return o.state === 'closed' ? o.closed - c : 0; };
  // avanzar solo con los ojos cerrados (y tiempo de sobra); en el aire, terminar el salto
  const quiet = x => { const g = W.go(x); return (p, m) => (!p.onGround || rem() > 1.0 || p.x > 1560) ? g(p, m) : {}; };
  run(quiet(1600), quiet(1700), () => P(0).x > 1560 && P(1).x > 1560 && P(0).onGround && P(1).onGround, 1500);
  run(W.go(1790), W.go(1805), null, 600);
};
S['4-2'] = () => {
  const cart = () => ARENA.L.objs.find(o => o.kind === 'cart');
  run(W.go(140, { release: true }), W.go(240, { pull: true }), () => P(1).mass >= 3.9, 200);
  // B empuja el carrito desde la izquierda hasta la placa
  run(W.go(150), W.go(250), () => Math.abs(P(1).x - 250) < 15, 100);
  run(W.go(200), W.hold({ right: true }), () => cart().x + cart().w / 2 > 975, 600);
  run(W.go(200), W.go(870), () => ARENA.L.objs.some(o => o.kind === 'gate' && o.open > 0.95), 200);
  run(W.go(1500), W.jumpTo(1180, 34), () => P(1).onGround && P(1).x > 1100, 150);
  run(W.go(1785), W.go(1800), null, 900);
};
S['4-3'] = () => {
  const cart = () => ARENA.L.objs.find(o => o.kind === 'cart');
  const lift = () => ARENA.L.objs.find(o => o.kind === 'liftPair');
  // A se aliviana y se para en la plataforma derecha; B engorda y empuja el carrito
  run(W.go(140, { release: true }), W.go(240, { pull: true }), () => P(1).mass >= 4, 200);
  run(W.go(1050), W.go(250), () => P(0).onGround && P(0).groundR === lift().b && Math.abs(P(1).x - 250) < 15, 500);
  run(W.go(1050), W.hold({ right: true }), () => cart().onR === lift().a, 500);
  run(W.go(1050), W.go(560), () => lift().d > 40, 200);
  // B corre y salta a la plataforma que sube
  run(W.go(1050), W.go(840), () => P(1).x > 820, 200);
  run(W.go(1050), W.jumpTo(935, 30), () => P(1).onGround && P(1).groundR === lift().b, 120);
  run(W.go(1050), W.go(935), () => lift().b.y < 440, 600);
  run(W.go(1300), W.go(1250), () => P(0).onGround && P(0).y < 420 && P(1).onGround && P(1).y < 420, 300);
  run(W.go(1795), W.go(1810), null, 600);
};

const eyeRem = () => { const o = ARENA.L.objs.find(k => k.kind === 'eye'); const c = (o.t + o.phase) % (o.open + o.closed); return o.state === 'closed' ? o.closed - c : 0; };
const waitClosed = (need, c0, c1) => run(c0 || W.idle, c1 || W.idle, () => eyeRem() > need, 400);
S['4-4'] = () => {
  const hop = (who, x, y, other) => { const c = W.jumpTo(x, 30); run(who === 0 ? c : other || W.idle, who === 1 ? c : other || W.idle, () => P(who).onGround && Math.abs(P(who).x - x) < 60 && P(who).y < y, 100); log(`hop ${who} -> ${x}: ${P(who).onGround && P(who).y < y}`); };
  const crumbles = () => ARENA.L.objs.filter(o => o.kind === 'crumble');
  const respawn = (c0, c1) => run(c0 || W.idle, c1 || W.idle, () => crumbles().every(o => !(o.gone > 0) && !(o.t > 0)), 400);
  run(W.go(220), W.go(330), () => P(1).x > 315, 200);
  waitClosed(1.5);
  hop(1, 370, 730); hop(0, 250, 730);
  waitClosed(1.8);
  hop(1, 560, 640); hop(1, 860, 545);
  respawn(); waitClosed(1.8);
  hop(0, 560, 640); hop(0, 760, 545);
  respawn(); waitClosed(2.2);
  hop(1, 1065, 470); hop(1, 1295, 400); hop(1, 1540, 340);
  run(W.go(890), W.go(1490), () => Math.abs(P(0).x - 890) < 15 && Math.abs(P(1).x - 1490) < 15, 300);
  respawn(W.go(890), W.go(1490)); waitClosed(2.2, W.go(890), W.go(1490));
  hop(0, 1065, 470, W.go(1490)); hop(0, 1295, 400, W.go(1500)); hop(0, 1520, 340, W.go(1600));
  run(W.go(1790), W.go(1805), null, 600);
};
S['4-5'] = () => {
  const cart = () => ARENA.L.objs.find(o => o.kind === 'cart');
  run(W.go(130), W.go(230, { pull: true }), () => P(1).mass >= 3.9, 200);
  run(W.go(130), W.hold({ right: true }), () => cart().x > 560, 400);
  waitClosed(1.4, W.go(130), W.idle);
  run(W.go(400), W.hold({ right: true }), () => cart().onR && cart().y > 870, 200);
  log(`cart ${cart().x | 0},${cart().y | 0}`);
  run(W.hold({ right: true }), W.hold({ right: true }), () => P(1).x > 1000, 400);
  run(W.go(960), W.go(1040), () => P(0).x > 940 && P(1).x > 1020, 200);
  const hop = (who, x, y, other) => { const c = W.jumpTo(x, 30); run(who === 0 ? c : other || W.idle, who === 1 ? c : other || W.idle, () => P(who).onGround && Math.abs(P(who).x - x) < 60 && P(who).y < y, 100); log(`hop ${who} -> ${x}: ${P(who).onGround && P(who).y < y}`); };
  hop(1, 1165, 740); hop(1, 1295, 630); hop(0, 1165, 740); hop(1, 1420, 530); hop(0, 1295, 630);
  run(W.release ? W.idle : W.hold({ release: true }), W.hold({ release: true }), () => P(1).mass <= 2.2 || G.rope.len >= 795, 200);
  waitClosed(1.6);
  hop(1, 1830, 420);
  waitClosed(1.6, null, W.go(1830));
  hop(0, 1420, 530, W.go(1830));
  waitClosed(1.6, null, W.go(1830));
  hop(0, 1800, 420, W.go(1850));
  run(W.go(1835), W.go(1850), null, 600);
};

S['5-1'] = () => {
  run(W.go(860), W.go(880), () => P(1).x > 860, 400);
  run(W.jumpTo(1120, 30), W.jumpTo(1180, 30), () => P(0).onGround && P(1).onGround && P(0).x > 1060, 120);
  // en el jugo: frenar y saltar la segunda sopa
  run(W.go(1360), W.go(1380), () => Math.abs(P(1).x - 1380) < 30 && Math.abs(P(1).vx) < 80, 200);
  run(W.jumpTo(1620, 30), W.jumpTo(1700, 30), () => P(0).onGround && P(1).onGround && P(0).x > 1550 && P(1).x > 1550, 140);
  run(W.go(1795), W.go(1810), null, 600);
};
S['5-2'] = () => {
  const gey = i => ARENA.L.objs.filter(o => o.geyser)[i];
  // subir con el vapor: quedarse en la columna hasta pasar la altura y luego ir a la repisa
  const ride = (G0, h, tx, off = 0) => (p, m) => { if (p.y < h || m.out) { m.out = true; const d = Math.sign(tx - p.x); return { left: d < 0 && Math.abs(tx - p.x) > 10, right: d > 0 && Math.abs(tx - p.x) > 10 }; } const cx = G0.x + G0.w / 2 + off; return { left: p.x > cx + 8, right: p.x < cx - 8, jump: p.onGround && G0.on }; };
  run(W.go(470), W.go(540), () => !gey(0).on && Math.abs(P(0).x - 470) < 20, 400);
  run(W.go(470), W.go(540), () => gey(0).on, 400);
  run(ride(gey(0), 400, 780, -30), ride(gey(0), 400, 840, 30), () => P(0).onGround && P(1).onGround && P(0).y < 420 && P(1).y < 420, 300);
  log(`en repisa: ${P(0).x | 0},${P(0).y | 0} ${P(1).x | 0},${P(1).y | 0}`);
  run(W.go(770), W.go(860), () => !gey(1).on, 400);
  run(W.go(770), W.go(860), () => gey(1).on, 400);
  run(ride(gey(1), 280, 1460, -30), ride(gey(1), 280, 1540, 30), () => P(0).onGround && P(1).onGround && P(0).y < 300 && P(1).y < 300, 300);
  run(W.go(1790), W.go(1805), null, 600);
};
S['5-3'] = () => {
  // correr, saltar en xj, caer cerca de xl y pegarse para frenar en el hielo
  const dash = (xj, xl, xmin) => (p, m) => {
    m.f = (m.f || 0) + 1;
    if (m.landed) return { stick: Math.abs(p.vx) > 5 || m.landed++ < 20 };
    if (!m.jumped && p.onGround && p.x >= xj) { m.jumped = true; m.jf = m.f; }
    if (m.jumped && p.onGround && m.f - m.jf > 8 && p.x > xmin) { m.landed = 1; return { stick: true }; }
    const tx = m.jumped ? xl : 99999, d = Math.sign(tx - p.x);
    return { jump: m.jumped && m.f - m.jf < 30, right: d > 0, left: d < 0 && m.jumped };
  };
  const still = () => ({ stick: true });
  const go = (who, xj, xl, xmin) => { const c = dash(xj, xl, xmin); run(who === 0 ? c : still, who === 1 ? c : still, () => P(who).stuck && P(who).x > xmin, 240); log(`dash ${who} -> ${xl}: ${P(who).stuck} @${P(who).x | 0}`); run(still, still, null, 10); };
  go(1, 400, 760, 600); go(0, 380, 700, 600);
  go(1, 880, 1220, 1140); go(0, 860, 1190, 1140);
  go(1, 1230, 1360, 1290);
  go(1, 1400, 1720, 1630); go(0, 1230, 1360, 1290); go(0, 1400, 1700, 1630);
  run(W.go(1805), W.go(1815), null, 600);
};
// secuencia de pasos por jugador que corre en paralelo: [[controlador, condición de fin], ...]
const seq = (steps, tag) => { let k = 0, mem = {}; const c = (p, m) => { while (k < steps.length && steps[k][1](p)) { log(`${tag} paso ${k} ok t${ARENA.t.toFixed(2)}`); k++; mem = {}; } if (k >= steps.length) return {}; return steps[k][0](p, mem); }; c.done = () => k >= steps.length; return c; };
S['5-4'] = () => {
  const M = i => ARENA.oneway.filter(o => o.kind === 'mover')[i];
  const gey = () => ARENA.L.objs.find(o => o.geyser);
  const on = (p, R) => p.onGround && p.groundR === R;
  const follow = (Rf) => (p) => { const R = Rf(); const cx = R.x + R.w / 2; return { left: p.x > cx + 8, right: p.x < cx - 8 }; };
  const hop = (Rf, hold = 22) => (p, m) => { const R = Rf(); m.f = (m.f || 0) + 1; const cx = R.x + R.w / 2 - (p.onGround ? 0 : p.vx * 0.25); return { jump: m.f < hold, left: p.x > cx + 10, right: p.x < cx - 10 }; };
  const ride = (h, txf) => (p, m) => { if (p.y < h || m.out) { m.out = true; const tx = txf(); const d = Math.sign(tx - p.x); return { left: d < 0 && Math.abs(tx - p.x) > 10, right: d > 0 && Math.abs(tx - p.x) > 10 }; } const G0 = gey(), cx = G0.x + G0.w / 2; return { left: p.x > cx + 8, right: p.x < cx - 8, jump: p.onGround }; };
  const plan = (wait, extraWait, land) => [
    [W.go(380), p => extraWait() && M(0).x < 372 && M(0).dx < 0],
    [hop(() => M(0)), p => on(p, M(0))],
    [follow(() => M(0)), p => M(0).x > 575],
    [hop(() => M(1), 4), p => on(p, M(1))],
    [follow(() => M(1)), p => gey().on && M(1).y < 700],
    [ride(380, () => land), p => p.onGround && p.x > 1110],
    [W.go(land), p => false],
  ];
  const b = seq(plan(0, () => true, 1260), 'B');
  const a = seq(plan(0, () => ARENA.t > 2.0, 1180), 'A');
  run(a, b, () => P(0).onGround && P(0).x > 1110 && P(1).onGround && P(1).x > 1110, 1500);
  run(W.go(1795), W.go(1810), null, 600);
};
S['5-5'] = () => {
  const cart = () => ARENA.L.objs.find(o => o.kind === 'cart');
  const gey = () => ARENA.L.objs.find(o => o.geyser);
  run(W.go(110), W.go(260, { pull: true }), () => P(1).mass >= 3.9, 200);
  run(W.go(140), W.hold({ right: true }), () => cart().x + cart().w / 2 > 990, 700);
  run(W.go(800), W.go(860), () => ARENA.L.objs.some(o => o.kind === 'gate' && o.open > 0.95), 200);
  run(W.go(850), W.jumpTo(1230, 34), () => P(1).onGround && P(1).x > 1120, 150);
  run(W.jumpTo(1180, 34), W.go(1230), () => P(0).onGround && P(0).x > 1120, 150);
  run(W.go(1200), W.go(1260), () => gey().on, 400);
  run(W.go(1230), W.go(1230), () => P(0).y < 320 || P(1).y < 320, 300);
  run(W.go(1600), W.go(1650), () => P(0).onGround && P(1).onGround && P(0).y < 320 && P(1).y < 320, 300);
  run(W.go(1805), W.go(1820), null, 600);
};

S['6-1'] = () => {
  const plats = () => ARENA.oneway.filter(o => o.kind === 'mover');
  const W1 = () => plats().slice(0, 4), W2 = () => plats().slice(4, 8);
  const on = (p, list) => p.onGround && list.includes(p.groundR);
  const cur = p => p.groundR;
  const followG = p => { const R = cur(p); if (!R || !R.w) return {}; const cx = R.x + R.w / 2; return { left: p.x > cx + 8, right: p.x < cx - 8 }; };
  const hopBest = (cands, hold = 20) => (p, m) => { if (!m.t) { m.t = cands().slice().sort((a, b) => Math.hypot(a.x + a.w / 2 - p.x, a.y - p.y) - Math.hypot(b.x + b.w / 2 - p.x, b.y - p.y))[0]; } m.f = (m.f || 0) + 1; const R = m.t, cx = R.x + R.w / 2 - (p.onGround ? 0 : p.vx * 0.2); return { jump: m.f < hold, left: p.x > cx + 10, right: p.x < cx - 10 }; };
  // plataforma de la rueda 1 que pasa cerca del borde de partida (abajo-izquierda)
  const nearStart = () => W1().some(R => R.y > 700 && R.x + R.w / 2 < 560 && R.x + R.w / 2 > 420);
  const plan = (startOk, land) => [
    [W.go(330), p => startOk() && nearStart()],
    [hopBest(() => W1().filter(R => R.y > 650)), p => on(p, W1())],
    [followG, p => { const R = cur(p); return R && R.x + R.w / 2 > 780 && R.y < 640; }],
    [hopBest(() => W2().filter(R => R.x + R.w / 2 < 1080)), p => on(p, W2())],
    [followG, p => { const R = cur(p); return R && R.x + R.w / 2 > 1300 && R.y < 560; }],
    [W.jumpTo(land, 30), p => p.onGround && p.x > 1550 && p.y < 420],
    [W.go(land), p => false],
  ];
  const b = seq(plan(() => true, 1620), 'B'), a = seq(plan(() => ARENA.t > 2.5, 1560), 'A');
  run(a, b, () => P(0).onGround && P(0).x > 1550 && P(1).onGround && P(1).x > 1550 && P(0).y < 420 && P(1).y < 420, 1800);
  run(W.go(1795), W.go(1810), null, 600);
};
S['6-2'] = () => {
  const pend = i => ARENA.L.objs.filter(o => o.kind === 'pendulum')[i];
  const spots = [250, 540, 880, 1220, 1560];
  const tops = [880, 760, 760, 760, 880];
  const clear = k => { const a = k >= 1 ? pend(k - 1) : null, b = k <= 2 ? pend(k) : null; return (!a || (a.x < spots[k] - 40 && a.vx < 0)) && (!b || (b.x > spots[k + 1] + 40 && b.vx > 0)); };
  const danger = p => { for (let i = 0; i < 3; i++) { const o = pend(i); const d = Math.hypot(o.x - p.x, o.y - p.y), toward = (p.x - o.x) * o.vx > 0; if (d < 100 || (d < 135 && toward)) return true; } return false; };
  // esperar juntos en el bloque k (pegándose si viene el péndulo) y cruzar los dos en la misma ventana
  const wait = (x) => (p, m) => { if (danger(p)) return { stick: true }; const g = W.go(x, {}, 8)(p, m); delete g.jump; return g; };
  for (let k = 0; k < 4; k++) {
    const bx = spots[k] + (k ? 70 : 20), ax = spots[k] - (k ? 30 : 110);
    run(wait(ax), wait(bx), () => clear(k) && !P(0).stuck && !P(1).stuck && P(0).onGround && P(1).onGround, 600);
    log(`cruce ${k} t${Campaign.state.t.toFixed(2)}`);
    const tb = spots[k + 1] + (k === 3 ? 120 : 50), ta = spots[k + 1] - (k === 3 ? 0 : 50);
    let f = 0;
    run((p, m) => (f++ < 5 ? {} : W.jumpTo(ta, 14)(p, m)), W.jumpTo(tb, 14), () => P(0).onGround && P(1).onGround && P(0).x > spots[k + 1] - 120 && P(1).x > spots[k + 1] - 120 && P(0).y < tops[k + 1] && P(1).y < tops[k + 1], 160);
    log(`llegaron ${k + 1}: ${P(0).x | 0},${P(1).x | 0}`);
  }
  run(W.go(1800), W.go(1815), null, 600);
};

S['6-3'] = () => {
  const H = () => ARENA.L.objs.find(o => o.kind === 'hand' && o.len > 300);
  const ang = () => { const a = H().a % (2 * Math.PI); return a < 0 ? a + 2 * Math.PI : a; };
  const at = f => { const h = H(); return { x: h.cx + Math.cos(h.a) * h.len * f, y: h.cy + Math.sin(h.a) * h.len * f }; };
  // saltar hacia un punto de la manecilla y agarrarse (imán de las clavijas)
  const grab = f => (p, m) => { m.f = (m.f || 0) + 1; const q = at(f); const d = Math.sign(q.x - p.x); return { jump: m.f < 26, right: d > 0 && Math.abs(q.x - p.x) > 8, left: d < 0 && Math.abs(q.x - p.x) > 8, stick: m.f > 6 }; };
  const hold = () => ({ stick: true });
  run(W.go(250), W.go(340), () => Math.abs(P(1).x - 340) < 15, 200);
  run(W.go(250), W.go(340), () => ang() > 0.74 * Math.PI && ang() < 0.80 * Math.PI, 1400);
  log(`ang ${ang().toFixed(2)} t${Campaign.state.t.toFixed(2)}`);
  run(W.go(300), grab(0.78), () => P(1).stuck, 90);
  log(`B agarrado ${P(1).stuck} @${P(1).x | 0},${P(1).y | 0}`);
  run(grab(0.97), hold, () => P(0).stuck, 90);
  log(`A agarrado ${P(0).stuck} @${P(0).x | 0},${P(0).y | 0}`);
  run(hold, hold, () => ang() > 1.84 * Math.PI, 900);
  log(`suelta ang ${ang().toFixed(2)} B ${P(1).x | 0},${P(1).y | 0} A ${P(0).x | 0},${P(0).y | 0} st ${P(0).sticky.toFixed(2)},${P(1).sticky.toFixed(2)}`);
  run(hold, W.jumpTo(1650, 30), () => P(1).onGround && P(1).x > 1495, 120);
  log(`B en la salida ${P(1).onGround} @${P(1).x | 0}`);
  run(W.jumpTo(1620, 30), W.go(1700, { pull: true }), () => P(0).onGround && P(0).x > 1495, 200);
  run(W.go(1800), W.go(1820), null, 600);
};

S['6-4'] = () => {
  const R = i => ARENA.pegs.filter(o => o.kind === 'ring')[i];
  const bell = () => ARENA.L.objs.find(o => o.kind === 'bell');
  const toRing = () => { const o = bell(); const c = (o.t + o.phase) % o.period; return o.period - c; };
  const hopGrab = (x, ring = null) => (p, m) => { m.f = (m.f || 0) + 1; const tx = x - (p.onGround ? 0 : p.vx * 0.3), dir = Math.sign(tx - p.x); const near = ring && p.y < ring.y - 20 && Math.hypot(p.x - ring.x, p.y - ring.y) < p.r + ring.r + 30; return { jump: m.f > 2 && m.f < 28, stick: p.stuck || near, left: dir < 0 && Math.abs(tx - p.x) > 8, right: dir > 0 && Math.abs(tx - p.x) > 8 }; };
  const land = (x) => (p, m) => { m.f = (m.f || 0) + 1; const tx = x - (p.onGround ? 0 : p.vx * 0.25), dir = Math.sign(tx - p.x); return { jump: m.f > 2 && m.f < 28, left: dir < 0 && Math.abs(tx - p.x) > 8, right: dir > 0 && Math.abs(tx - p.x) > 8 }; };
  // en el suelo o una anilla: pegarse si la campana está por sonar
  const safe = (x) => (p, m) => { if (toRing() < 1.2 || p.stuck && toRing() > bell().period - 0.4) return { stick: true }; if (p.stuck && p.stuckR && p.stuckR.kind === 'ring') return { stick: true }; const g = W.go(x, {}, 10)(p, m); delete g.jump; return g; };
  const settled = q => q.stuck || q.onGround;
  const ok = () => toRing() > 1.3 && toRing() < bell().period - 0.3 && settled(P(0)) && settled(P(1));
  const steps = (who, plan) => plan.map(([ctl, until]) => [ctl, until]);
  const planFor = (lagOk, r1) => [
    [safe(1600), p => lagOk(0) && ok()],
    [land(r1), p => p.onGround && p.x > 1180 && p.y < 740],
    [safe(r1), p => lagOk(1) && ok()],
    [hopGrab(R(0).x, R(0)), p => p.stuck && p.stuckR === R(0)],
    [safe(0), p => lagOk(2) && ok()],
    [land(640), p => p.onGround && p.x < 740 && p.y < 620],
    [safe(660), p => lagOk(3) && ok()],
    [hopGrab(R(1).x, R(1)), p => p.stuck && p.stuckR === R(1)],
    [safe(0), p => lagOk(4) && ok()],
    [land(170), p => p.onGround && p.x < 330 && p.y < 340],
    [W.go(170), p => false],
  ];
  let kB = 0, kA = 0;
  const mk = (plan, who) => { let k = 0, mem = {}; const c = (p, m) => { while (k < plan.length && plan[k][1](p)) { k++; mem = {}; log(`${who} paso ${k} t${Campaign.state.t.toFixed(2)}`); } if (who === 'B') kB = k; else kA = k; return k < plan.length ? plan[k][0](p, mem) : {}; }; return c; };
  // B va adelante; A avanza un tramo cuando B ya llegó al siguiente
  const b = mk(planFor(() => true, 1300), 'B');
  const a = mk(planFor(i => (i === 0 ? kB >= 3 : kB >= 2 * i + 4) || kB >= 10, 1215), 'A');
  run(a, b, () => P(0).onGround && P(1).onGround && P(0).x < 330 && P(1).x < 330 && P(0).y < 340 && P(1).y < 340, 3600);
  run(W.go(160), W.go(180), null, 600);
};

S['6-5'] = () => {
  const plats = () => ARENA.oneway.filter(o => o.kind === 'mover');
  const pend = () => ARENA.L.objs.find(o => o.kind === 'pendulum');
  const H = () => ARENA.L.objs.find(o => o.kind === 'hand');
  const bell = () => ARENA.L.objs.find(o => o.kind === 'bell');
  const toRing = () => { const o = bell(); const c = (o.t + o.phase) % o.period; return o.period - c; };
  const ang = () => { const a = H().a % (2 * Math.PI); return a < 0 ? a + 2 * Math.PI : a; };
  const at = f => { const h = H(); return { x: h.cx + Math.cos(h.a) * h.len * f, y: h.cy + Math.sin(h.a) * h.len * f }; };
  const onPlat = p => p.onGround && plats().includes(p.groundR);
  const follow = p => { const R = p.groundR; if (!R || !R.w) return {}; const cx = R.x + R.w / 2; return { left: p.x > cx + 8, right: p.x < cx - 8 }; };
  const hopTo = (pf, hold = 22) => (p, m) => { m.f = (m.f || 0) + 1; if (!m.t) m.t = pf(p); const R = m.t, cx = R.x + R.w / 2 - (p.onGround ? 0 : p.vx * 0.2); return { jump: m.f < hold, left: p.x > cx + 10, right: p.x < cx - 10 }; };
  const free = R => !G.players.some(q => q.groundR === R);
  const nearStart = () => plats().find(R => R.y > 700 && R.y < 820 && R.x + R.w / 2 > 360 && R.x + R.w / 2 < 480 && R.dy < 0 && free(R));
  const danger = p => { const o = pend(); const d = Math.hypot(o.x - p.x, o.y - p.y), toward = (p.x - o.x) * o.vx > 0; return d < 100 || (d < 140 && toward) || toRing() < 1.0; };
  const waitP = x => (p, m) => { if (danger(p)) return { stick: true }; const g = W.go(x, {}, 8)(p, m); delete g.jump; return g; };
  const grab = f => (p, m) => { m.f = (m.f || 0) + 1; const q = at(f); const d = Math.sign(q.x - p.x); return { jump: m.f < 26, right: d > 0 && Math.abs(q.x - p.x) > 8, left: d < 0 && Math.abs(q.x - p.x) > 8, stick: m.f > 6 }; };
  let kB = 0, kA = 0;
  const mk = (plan, who) => { let k = 0, mem = {}; return (p, m) => { while (k < plan.length && plan[k][1](p)) { k++; mem = {}; log(`${who} paso ${k} t${Campaign.state.t.toFixed(2)} @${p.x | 0},${p.y | 0}`); } if (who === 'B') kB = k; else kA = k; return k < plan.length ? plan[k][0](p, mem) : {}; }; };
  const plan = (startOk, px, f, land, grabOk) => [
    [W.go(px < 900 ? 250 : 270), p => startOk() && !!nearStart()],
    [(p, m) => { m.f = (m.f || 0) + 1; const R = plats().filter(R => R.x + R.w / 2 < 700 && free(R)).sort((a, b) => Math.hypot(a.x + a.w / 2 - p.x, a.y - p.y) - Math.hypot(b.x + b.w / 2 - p.x, b.y - p.y))[0]; const cx = R.x + R.w / 2; return { jump: m.f < 22, left: p.x > cx + 10, right: p.x < cx - 10 }; }, p => onPlat(p)],
    [follow, p => { const R = p.groundR; return R && R.x + R.w / 2 > 590 && R.y < 560; }],
    [hopTo(() => ({ x: px - 65, w: 130 }), 20), p => p.onGround && p.x > 780 && p.y < 560],
    [waitP(px), p => !danger(p) && !p.stuck && grabOk()],
    [grab(f), p => p.stuck && p.stuckR && p.stuckR.kind === 'handpeg'],
    [() => ({ stick: true }), p => ang() > 1.78 * Math.PI && ang() < 1.95 * Math.PI],
    [W.jumpTo(land, 30), p => p.onGround && p.x > 1585],
    [W.go(land, { pull: true }), p => false],
  ];
  const b = mk(plan(() => true, 930, 1.0, 1700, () => ang() > 0.9 * Math.PI && ang() < 1.05 * Math.PI && kA >= 4), 'B');
  const a = mk(plan(() => kB >= 3, 840, 0.8, 1650, () => kB >= 6 && ang() < 1.2 * Math.PI), 'A');
  run(a, b, () => P(0).onGround && P(1).onGround && P(0).x > 1585 && P(1).x > 1585, 4800);
  run(W.go(1750), W.go(1770), null, 600);
};
return S;
