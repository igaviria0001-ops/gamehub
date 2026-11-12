// Física del control libre: crucero, subir, media vuelta, rizo, cobra, picada, flotar, tonel, rasante, posarse
const { chromium } = require('playwright');
const path = require('path');
const SP = process.env.SP || 'guacamaya';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => console.log('ERR', e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(600);
  await page.evaluate(() => VTO.Game.setArena('cocora'));
  await page.click('[data-act="practice"]');
  const r = await page.evaluate(SP => {
    const { Game, Bird } = VTO, G = Game.G; G.paused = true; G.cratesOn = false;
    const W = G.world, out = {};
    const nb = (x, y, f = 1) => { const b = new Bird(0, SP, 0); b.G = G; G.birds[0] = b; G.bots = [null, null]; b.reset(x, y, f); return b; };
    const I = (dx = 0, dy = 0, o = {}) => Object.assign({ dx, dy, fire: false, boost: false, missile: false, roll: false, rdx: 0, rdy: 0 }, o);
    const run = (b, secs, inp, each) => { let t = 0; const f = typeof inp === 'function' ? inp : () => inp; while (t < secs) { b.step(1 / 120, f(t), G); t += 1 / 120; if (each && each(t)) break; } G.events.length = 0; return t; };
    { const b = nb(1300, 600); const y0 = b.y; run(b, 2, I()); out.crucero = { vel: Math.round(b.s), bajó: Math.round(b.y - y0) }; }
    { const b = nb(1300, 1000); let stallAt = null; const t = run(b, 5, I(0, -1), t => { if (b.lift < 0.3 && stallAt == null) stallAt = t; return false; }); out.subirSinTurbo = { pierdeSustentacionA: stallAt && +stallAt.toFixed(2), alturaGanada: Math.round(1000 - Math.min(b.y, 1000)) }; }
    { const b = nb(1300, 1000); let minY = 1e9; run(b, 3, I(0, -1, { boost: true }), () => { minY = Math.min(minY, b.y); return false; }); out.subirConTurbo = { alturaGanada: Math.round(1000 - minY), turbo: +b.fuel.toFixed(2) }; }
    { const b = nb(1300, 700); let maxMis = 0, minY = b.y, t = run(b, 3, I(-1, 0), () => { maxMis = Math.max(maxMis, Math.abs(b.mis)); minY = Math.min(minY, b.y); return Math.cos(b.va) < -0.95; }); out.mediaVuelta = { seg: +t.toFixed(2), vel: Math.round(b.s), derrapeMax: +(maxMis * 57.3).toFixed(0) + '°', subió: Math.round(700 - minY) }; }
    { const b = nb(1300, 700); let acc = 0, prev = b.va; const seq = [[0, -1], [-1, 0], [0, 1], [1, 0]]; const t = run(b, 5, t => I(...seq[Math.floor(t / 0.42) % 4]), () => { acc += angDiff(prev, b.va); prev = b.va; return Math.abs(acc) >= TAU; }); out.rizoGirandoTeclas = { vueltas: +(Math.abs(acc) / TAU).toFixed(2), seg: +t.toFixed(2), vel: Math.round(b.s) }; }
    { const b = nb(1300, 700); b.vx = 950; b.s = 950; run(b, 0.45, I(0, -1)); const s1 = b.s; run(b, 0.4, I(1, 0)); out.cobra = { desde: 950, alSubir: Math.round(s1), despues: Math.round(b.s) }; }
    { const b = nb(1300, 300); let maxS = 0; run(b, 1.4, I(0, 1), () => { maxS = Math.max(maxS, b.s); return false; }); out.picada = { velMax: Math.round(maxS) }; }
    { const b = nb(1300, 800); b.vx = 100; b.vy = 0; b.a = -Math.PI / 2; const y0 = b.y; run(b, 1.5, I(0, -1, { boost: true })); out.flotar = { movioY: Math.round(b.y - y0), vel: Math.round(b.s) }; }
    { const b = nb(1300, 700); run(b, 0.02, I(0, 0, { roll: true, rdx: 0, rdy: -1 })); const ev = b.evadeT; run(b, 0.3, I()); out.tonel = { evade: +ev.toFixed(2), velY: Math.round(b.vy) }; }
    { const b = nb(1300, 700); b.vx = 80; b.vy = 0; b.s = 80; let rec = null; run(b, 3, I(0, 1), t => { if (b.lift > 0.9 && rec == null) { rec = t; return true; } }); out.recuperar = { seg: rec && +rec.toFixed(2), cayó: Math.round(b.y - 700) }; }
    { const x = 1300, b = nb(x, W.groundY(x) - 40); b.vx = 700; b.s = 700; b.fuel = 0.3; let ras = 0; run(b, 1, t => I(1, -0.06), () => { if (b.rasante) ras++; return false; }); out.rasante = { pasosRasante: ras, turbo: +b.fuel.toFixed(2) }; }
    { const x = 1300, b = nb(x, W.groundY(x) - 70); b.vx = 260; b.vy = 60; let land = false; run(b, 1.5, I(), () => { land = !!b.perch; return land; }); out.posarse = { posado: land }; run(b, 0.3, I(0.5, -1)); out.despegar = { enElAire: !b.perch, vel: Math.round(b.s) }; }
    return out;
  }, SP);
  for (const [k, v] of Object.entries(r)) console.log(k.padEnd(18), JSON.stringify(v));
  await browser.close();
})();
