// Física del vuelo: rizo, pérdida, picada, rozar, chocar, posarse y giro automático
const { chromium } = require('playwright');
const path = require('path');
const SP = process.env.SP || 'guacamaya';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => console.log('ERR', e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(600);
  await page.click('[data-act="play2"]');
  const r = await page.evaluate(SP => {
    const { Game, Bird } = VTO, G = Game.G; G.paused = true;
    const W = G.world; const out = {};
    const nb = () => { const b = new Bird(0, SP, 0); b.G = G; G.birds[0] = b; G.pilots = [null, null]; return b; };
    const run = (b, secs, inp, until) => { let t = 0; const I = typeof inp === 'function' ? inp : () => inp; while (t < secs) { b.step(1 / 120, I(t), G); t += 1 / 120; if (until && until(t)) break; } G.events.length = 0; return t; };
    // 1) rizo desde crucero
    { const b = nb(); b.reset(1300, 520, 1); let turned = 0, prev = b.a, minS = 1e9, y0 = 1e9, y1 = -1e9, stalled = false;
      const t = run(b, 4, { up: true }, () => { turned += angDiff(prev, b.a); prev = b.a; minS = Math.min(minS, b.s); y0 = Math.min(y0, b.y); y1 = Math.max(y1, b.y); stalled = stalled || b.stalled; return Math.abs(turned) >= TAU; });
      out.rizo = { vueltas: +(Math.abs(turned) / TAU).toFixed(2), seg: +t.toFixed(2), minVel: Math.round(minS), alto: Math.round(y1 - y0), perdida: stalled }; }
    // 1b) rizo lento (después de subir)
    { const b = nb(); b.reset(1300, 560, 1); b.s = 300; let turned = 0, prev = b.a, stalled = false;
      run(b, 4, { up: true }, () => { turned += angDiff(prev, b.a); prev = b.a; stalled = stalled || b.stalled; return Math.abs(turned) >= TAU; });
      out.rizoLento = { vueltas: +(Math.abs(turned) / TAU).toFixed(2), perdida: stalled }; }
    // 2) subir en vertical y soltar: pérdida y recuperación
    { const b = nb(); b.reset(1300, 700, 1); run(b, 3, { up: true }, () => b.a < -1.45);
      let stallAt = null, recAt = null; run(b, 6, {}, t => { if (b.stalled && stallAt == null) stallAt = t; if (stallAt != null && !b.stalled && recAt == null) recAt = t; return recAt != null; });
      out.perdida = { entra: stallAt != null ? +stallAt.toFixed(2) : 'no', sale: recAt != null ? +recAt.toFixed(2) : 'no', velSalida: Math.round(b.s) }; }
    // 3) picada desde arriba
    { const b = nb(); b.reset(1400, 400, 1); b.a = 1.2; let maxS = 0; run(b, 1.2, {}, () => { maxS = Math.max(maxS, b.s); return false; }); out.picada = { velMax: Math.round(maxS) }; }
    // 4) rozar el suelo en ángulo bajo
    { const b = nb(); const x = 1300; b.reset(x, W.groundY(x) - 80, 1); b.a = 0.25; let crash = false, skim = 0;
      const e0 = G.events; run(b, 1.2, {}, () => { for (const e of G.events) { if (e.type === 'crash') crash = true; if (e.type === 'skim') skim++; } G.events.length = 0; return false; });
      out.rozar = { choque: crash, roces: skim, vel: Math.round(b.s), alturaSobreSuelo: Math.round(W.groundY(b.x) - b.y) }; }
    // 5) chocar de frente contra el suelo
    { const b = nb(); const x = 1300; b.reset(x, W.groundY(x) - 160, 1); b.a = 1.1; b.s = 700; let crash = false;
      run(b, 1, {}, () => { for (const e of G.events) if (e.type === 'crash') crash = true; G.events.length = 0; return crash; }); out.choque = { choque: crash, aturdido: +b.stun.toFixed(2) }; }
    // 6) posarse en el suelo llegando despacio
    { const b = nb(); const x = 1300; b.reset(x, W.groundY(x) - 60, 1); b.a = 0.35; b.s = 260; let land = false;
      run(b, 1.5, {}, () => { for (const e of G.events) if (e.type === 'land') land = true; G.events.length = 0; return land; }); out.posarse = { posado: !!b.perch };
      run(b, 0.3, { up: true }); out.despegar = { enElAire: !b.perch, vel: Math.round(b.s) }; }
    // 6b) posarse en la copa de una palma
    { const b = nb(); const P = W.palms[2], C = P.crown; b.reset(C.x - 160, C.y - 60, 1); b.a = 0.18; b.s = 300; let land = false, kind = null;
      run(b, 1.5, {}, () => { for (const e of G.events) if (e.type === 'land') { land = true; kind = e.kind; } G.events.length = 0; return land; }); out.copa = { posado: land, en: kind, choque: b.stats.crashes }; }
    // 7) medio rizo, soltar arriba: se endereza solo y queda volando al otro lado
    { const b = nb(); b.reset(1300, 520, 1); let turned = 0, prev = b.a; run(b, 3, { up: true }, () => { turned += angDiff(prev, b.a); prev = b.a; return Math.abs(turned) >= Math.PI; });
      run(b, 0.5, {}); const backY = b.c > 0 ? -Math.cos(b.a) : Math.cos(b.a); out.enderezar = { mira: b.facing > 0 ? 'derecha' : 'izquierda', derecho: backY < 0 }; }
    // 8) aletazo
    { const b = nb(); b.reset(1300, 520, 1); const s0 = b.s; run(b, 0.6, { boost: true }); out.turbo = { antes: Math.round(s0), despues: Math.round(b.s), combustible: +b.fuel.toFixed(2) }; }
    return out;
  }, SP);
  for (const [k, v] of Object.entries(r)) console.log(k.padEnd(10), JSON.stringify(v));
  await browser.close();
})();
