// palanca 3.0: nunca pegada (dedo perdido), cuatro dedos a la vez, vuelta rápida, segundo dedo, fija, tamaños.
// Uso: node juegos/sortilegio/test/stick.js   (VIEWS=844x390,587x262)
const { chromium } = require('playwright');
const path = require('path');
const VIEWS = (process.env.VIEWS || '844x390,587x262').split(',').map(v => v.split('x').map(Number));
(async () => {
  const browser = await chromium.launch();
  let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('  FALLA:', m); } };
  for (const [W, H] of VIEWS) {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(800);
    await page.tap('[data-act="play2"]'); await page.waitForTimeout(200); await page.tap('#goTop');
    await page.waitForFunction(() => Game.G.state === 'play', null, { timeout: 15000 });
    const cdp = await ctx.newCDPSession(page);
    const touch = async (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(p => ({ x: p[0], y: p[1], id: p[2] })) });
    const T = () => page.evaluate(() => JSON.parse(JSON.stringify({ t: Input.touch, n: Touch._n })));
    const L = await page.evaluate(() => Touch.layout());
    const same = await page.evaluate(() => Touch.layout() === Touch.layout());
    ok(same, 'la ubicación de los botones no queda guardada');
    const s1 = L[0].stickHome, s2 = L[1].stickHome, Tr = L[0].T;
    console.log(`${W}×${H}: recorrido ${Tr.toFixed(0)} px, botones ${L[0].R.toFixed(0)} px`);

    // A · mover normal: a medio recorrido ya va rápido; al fondo, a toda velocidad; al soltar, quieto
    await touch('touchStart', [[s1.x, s1.y, 1]]);
    await touch('touchMove', [[s1.x + Tr * 0.45, s1.y, 1]]); let r = await T();
    ok(r.t[0].mx > 0.45 && r.t[0].mx < 0.8, 'a medio recorrido mx=' + r.t[0].mx.toFixed(2));
    await touch('touchMove', [[s1.x + Tr * 0.75, s1.y, 1]]); r = await T();
    ok(r.t[0].mx > 0.99, 'al 75 % debe ir a toda velocidad, mx=' + r.t[0].mx.toFixed(2));
    await touch('touchEnd', []); r = await T(); ok(r.t[0].mx === 0 && r.n === 0, 'al soltar queda quieto');

    // B · dedo perdido: la palanca quedó empujando a la derecha; un dedo nuevo toma el control enseguida
    await page.evaluate(() => Touch._ghost(0, 1, 0)); r = await T(); ok(r.t[0].mx === 1, 'fantasma armado');
    await touch('touchStart', [[s1.x + 6, s1.y - 4, 7]]); await page.waitForTimeout(20); r = await T();
    ok(Math.abs(r.t[0].mx) < 0.2 && r.n === 1, 'el dedo nuevo no tomó el control: ' + JSON.stringify(r));
    await touch('touchMove', [[s1.x + 6 - Tr, s1.y - 4, 7]]); r = await T(); ok(r.t[0].mx < -0.99, 'con el dedo nuevo no va a la izquierda');
    await touch('touchEnd', []); r = await T(); ok(r.t[0].mx === 0 && r.n === 0, 'tras soltar sigue pegada');

    // C · dedo perdido y se tocan solo botones: al levantar todos los dedos se suelta todo
    await page.evaluate(() => Touch._ghost(0, 0, -1));
    const h = L[0].h[0]; await touch('touchStart', [[h.x, h.y, 8]]); await page.waitForTimeout(40); await touch('touchEnd', []);
    r = await T(); ok(r.t[0].my === 0 && r.n === 0, 'al levantar todos los dedos quedó pegada');

    // D · cuatro dedos a la vez (dos jugadores en un celular)
    if (L[1]) {
      const a = L[0].h[1], d = L[1].dz;
      await touch('touchStart', [[s1.x, s1.y, 11]]); await touch('touchStart', [[s1.x, s1.y, 11], [s2.x, s2.y, 12]]);
      await touch('touchStart', [[s1.x, s1.y, 11], [s2.x, s2.y, 12], [a.x, a.y, 13]]);
      await touch('touchStart', [[s1.x, s1.y, 11], [s2.x, s2.y, 12], [a.x, a.y, 13], [d.x, d.y, 14]]);
      await touch('touchMove', [[s1.x, s1.y + Tr, 11], [s2.x - Tr, s2.y, 12], [a.x, a.y, 13], [d.x, d.y, 14]]);
      r = await T();
      ok(r.t[0].my > 0.99 && r.t[0].h1 && r.t[1].mx < -0.99 && r.t[1].dash && r.n === 4, 'cuatro dedos: ' + JSON.stringify(r));
      await touch('touchEnd', []); r = await T(); ok(r.n === 0, 'cuatro dedos: no se soltaron todos');
    }

    // E · segundo dedo mientras la palanca está viva: no le roba la palanca (sirve para tocar a un enemigo)
    await touch('touchStart', [[s1.x, s1.y, 21]]); await touch('touchMove', [[s1.x + Tr, s1.y, 21]]);
    const mid = { x: (L[0].x0 + L[0].x1) / 2, y: H * 0.35 };
    await touch('touchStart', [[s1.x + Tr, s1.y, 21], [mid.x, mid.y, 22]]); await page.waitForTimeout(20);
    await touch('touchEnd', [[mid.x, mid.y, 22]]); await page.waitForTimeout(20); r = await T(); // levanta solo el dedo 22
    ok(r.t[0].mx > 0.99 && r.n === 1, 'el segundo dedo le robó la palanca: ' + JSON.stringify(r));
    await touch('touchEnd', []);

    // F · vuelta rápida: el pulgar se pasa mucho a la derecha y de un solo golpe se devuelve a la izquierda
    await touch('touchStart', [[s1.x, s1.y, 31]]); await touch('touchMove', [[s1.x + Tr * 2.5, s1.y, 31]]);
    await touch('touchMove', [[s1.x + Tr * 0.6, s1.y, 31]]); r = await T();
    ok(r.t[0].mx < -0.99, 'la vuelta rápida no respondió de inmediato, mx=' + r.t[0].mx.toFixed(2));
    await touch('touchEnd', []);

    // G · palanca fija: lejos de su sitio no hace nada; cerca, sí
    await page.evaluate(() => Touch.setCfg('fixed', true));
    const L2 = await page.evaluate(() => Touch.layout()), hm = L2[0].stickHome;
    await touch('touchStart', [[L2[0].x0 + 8, 30, 41]]); await touch('touchMove', [[L2[0].x0 + 8 + L2[0].T, 30, 41]]); r = await T();
    ok(r.t[0].mx === 0, 'palanca fija: un toque lejos la movió'); await touch('touchEnd', []);
    await touch('touchStart', [[hm.x + L2[0].T, hm.y, 42]]); r = await T();
    ok(r.t[0].mx > 0.99, 'palanca fija: cerca no respondió'); await touch('touchEnd', []);
    await page.evaluate(() => Touch.setCfg('fixed', false));

    // H · tamaños: grandes son más grandes y se guardan
    const big = await page.evaluate(() => { Touch.setCfg('size', 'l'); const R = Touch.layout()[0].R; Touch.setCfg('size', 'n'); return R; });
    ok(big > L[0].R * 1.1, 'controles grandes no crecieron');

    // el mago de verdad se mueve con la palanca
    const x0 = await page.evaluate(() => Game.G.mages[0].x);
    await touch('touchStart', [[s1.x, s1.y, 51]]); await touch('touchMove', [[s1.x - Tr, s1.y, 51]]); await page.waitForTimeout(400); await touch('touchEnd', []);
    const x1 = await page.evaluate(() => Game.G.mages[0].x); ok(x0 - x1 > 60, 'el mago no se movió: ' + (x0 - x1).toFixed(0) + ' ' + JSON.stringify(await page.evaluate(() => { const m = Game.G.mages[0]; return { s: Game.G.state, x: m.x, y: m.y, alive: m.alive, ctrl: m.ctrl, W: Game.G.A.W }; })));
    await page.screenshot({ path: path.join(__dirname, 'shots', `stick-${W}x${H}.png`) });
    ok(!errors.length, 'errores: ' + errors.join(' | '));
    await ctx.close();
  }
  console.log(fails ? `PALANCA: ${fails} falla(s)` : 'PALANCA OK');
  await browser.close(); process.exit(fails ? 1 : 0);
})();
