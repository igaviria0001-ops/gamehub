// Prueba de maniobras: tirar en el aire, salto doble, picada, pegarse en el aire, carga visible
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1000);
  const setup = async arena => page.evaluate(arena => {
    TYA.UI.show(null, false); TYA.Game.startMatch('caneca', false, arena);
    const G = TYA.Game.G; G.hintsT = 0; let g = 0; while (G.state !== 'play' && g++ < 600) TYA.Game.update(1 / 60);
  }, arena);
  const run = (frames, fa, fb) => page.evaluate(([frames, fa, fb]) => {
    const I = (o = {}) => Object.assign({ left: false, right: false, jump: false, stick: false, pull: false, release: false }, o);
    const G = TYA.Game.G, [A, B] = G.players, log = [];
    const fA = new Function('i', 'A', 'return ' + fa), fB = new Function('i', 'A', 'return ' + fb);
    for (let i = 0; i < frames; i++) {
      TYA.over[0] = I(fA(i, A)); TYA.over[1] = I(fB(i, A));
      TYA.Game.update(1 / 60);
      log.push({ i, y: Math.round(A.y), vy: Math.round(A.vy), m: +A.mass.toFixed(2), g: A.onGround, s: A.stuck, dive: +A.diveT.toFixed(2), aj: A.airJumps, rope: Math.round(G.rope.len) });
    }
    TYA.over[0] = TYA.over[1] = null;
    return log;
  }, [frames, fa, fb]);
  await setup('cafeteria');
  // 1) saltar y tirar en el aire
  let L = await run(40, '({ jump: i < 20, pull: i > 6 && i < 30 })', '({})');
  const air = L.filter(r => !r.g && r.i > 6 && r.i < 30);
  console.log('pull en el aire: masa', air[0] && air[0].m, '->', air.at(-1) && air.at(-1).m);
  await run(60, '({})', '({})');
  // 2) salto doble
  L = await run(60, '({ jump: (i < 12) || (i >= 22 && i < 30) })', '({})');
  console.log('salto doble: airJumps', L[15].aj, '->', L[28].aj, ' minY', Math.min(...L.map(r => r.y)), ' masa', L[15].m, '->', L[28].m, ' hilo', L[15].rope, '->', L[28].rope);
  await run(90, '({})', '({})');
  // 3) picada
  L = await run(50, '({ jump: i < 14, stick: i >= 20 && i < 40 })', '({})');
  console.log('picada: maxDive', Math.max(...L.map(r => r.dive)), ' vy', L.slice(20, 30).map(r => r.vy).join(','));
  await run(90, '({})', '({})');
  // 4) carga visible: B se aleja, A pegado
  await setup('pupitre');
  await run(40, '({ stick: true })', '({ right: true })');
  await page.screenshot({ path: 'shots/m-charge.png' });
  await run(30, '({ stick: false })', '({})');
  await page.waitForTimeout(50);
  console.log('ERR', errors.join('\n'));
  await browser.close();
})();
