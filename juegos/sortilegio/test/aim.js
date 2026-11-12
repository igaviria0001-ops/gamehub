// apuntado nuevo: con varios enemigos se elige a quien uno señala; cargando, señalar a otro lo cambia
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
  const r = await page.evaluate(() => {
    const out = {}, G = Game.G;
    Game.start('camp', 2, { level: 0, chars: ['candela', 'yuma'] }); UI.show(null, false); Game.advance(3);
    G.units = G.units.filter(u => !(u instanceof Creature)); const m = G.mages[0], o = G.mages[1]; o.x = 200; o.y = 900;
    m.x = 600; m.y = 500; m.vx = m.vy = 0;
    const mk = (x, y) => { const c = new Creature(G, 'bruma', x, y); c.update = () => {}; G.units.push(c); return c; };
    const A = mk(520, 600), B = mk(1000, 500), C = mk(600, 160); // A cerca abajo-izq., B lejos a la derecha, C arriba
    const V = (mx, my, h0 = false, h1 = false) => { Input.virt[0] = { mx, my, h: [h0, h1], dash: false }; };
    const ang = u => Math.atan2(u.y - m.y, u.x - m.x), nm = u => u === A ? 'A' : u === B ? 'B' : u === C ? 'C' : u ? '?' : '-';
    // camina hacia B y se queda quieto: no debe voltearse al más cercano (A)
    V(1, 0); Game.advance(0.25); V(0, 0); Game.advance(0.6);
    out.quietoMiraB = Math.abs(angDiff(m.face, ang(B))) < 0.5; out.pick1 = nm(m.pickU);
    // carga y señala a C: cambia el fijado
    V(0, 0, true); Game.advance(0.15); out.lock1 = nm(m.lockOn);
    V(0, -1, true); Game.advance(0.3); out.lock2 = nm(m.lockOn);
    V(0, 0, false); Game.advance(0.05); const sp = G.spells.filter(s => s.by === 0).pop(); out.tiroHaciaC = sp ? Math.abs(angDiff(Math.atan2(sp.vy, sp.vx), ang(C))) < 0.35 : 'sin tiro';
    // con un solo enemigo (duelo) quieto se voltea solo hacia él
    G.units = G.units.filter(u => u !== A && u !== C); Game.advance(0.1); m.face = Math.PI; Game.advance(0.6); out.unoSoloLoMira = Math.abs(angDiff(m.face, ang(B))) < 0.4;
    // tocar enemigo (celular): pin
    const A2 = mk(520, 640); G.units.push(A2); m.face = 0; Game.advance(0.2);
    m.pin = { u: A2, until: G.time + 5 }; Game.advance(0.5); out.pinMira = Math.abs(angDiff(m.face, ang(A2))) < 0.4; out.pinPick = m.pickU === A2;
    Input.virt[0] = null; return out;
  });
  console.log(JSON.stringify(r));
  console.log('ERR', errors.slice(0, 5).join(' | ') || 'ninguno');
  await browser.close();
})();
