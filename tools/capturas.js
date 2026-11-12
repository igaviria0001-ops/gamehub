// Fotos reales de cada juego para las tarjetas de la colección (1280×720, JPEG)
const { chromium } = require('playwright');
const path = require('path');
const OUT = path.join(__dirname, '..', 'assets', 'shots');
const only = (process.env.ONLY || 'tya,vento,sorti,vertigo').split(',');
const W = 1280, H = 720;
(async () => {
  // VÉRTIGO necesita WebGL (SwiftShader); los juegos 2D van mejor sin GPU
  const browser = await chromium.launch({ args: only.includes('vertigo') ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : ['--disable-gpu'] });
  const shot = async (page, name) => { await page.screenshot({ path: path.join(OUT, name + '.jpg'), type: 'jpeg', quality: 84, timeout: 120000 }); console.log('ok', name); };
  const hideUI = `document.querySelectorAll('.screen, #toast, .hub-home').forEach(e => { e.hidden = true; e.style.display = 'none'; });`;
  if (only.includes('tya')) {
    const page = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
    await page.goto('file:///home/claude/tya/test/index.html'); await page.waitForTimeout(1500);
    for (const [arena, mode] of [['cafeteria', 'caneca'], ['bus', 'caneca'], ['arte', 'caneca'], ['profe', 'caneca']]) {
      await page.evaluate(([a, m]) => { const { Game, UI } = TYA; UI.show(null, false); Game.startMatch(m, false, a, false); Game.G.bots = [TYA.makeBot(0, 2), TYA.makeBot(1, 2)]; Game.G.hintsT = 0; }, [arena, mode]);
      await page.evaluate(hideUI); await page.waitForTimeout(6500); await page.evaluate(hideUI);
      await shot(page, 'tya-' + arena);
    }
  }
  if (only.includes('vento')) {
    const page = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
    await page.goto('file:///home/claude/vento/test/index.html'); await page.waitForTimeout(1500);
    await page.evaluate(() => { localStorage.setItem('vto_qManual', 'true'); VTO.Game.setQuality('alta'); });
    for (const arena of ['capadocia', 'medellin', 'cartagena', 'cocora']) {
      await page.evaluate(a => { const { Game, Bot } = VTO; Game.setArena(a); Game.start('duel', 2); VTO.UI.show(null, false); const G = Game.G; G.bots = [new Bot(G.birds[0], 3, 2), new Bot(G.birds[1], 7, 2)]; Game.advance(9); G.birds[0].hp = G.birds[0].sp.hp; G.birds[1].hp = G.birds[1].sp.hp; G.hintT = 0; G.hint = null; G.toast = null; }, arena);
      await page.evaluate(hideUI); await page.waitForTimeout(1200);
      await shot(page, 'vento-' + arena);
    }
  }
  if (only.includes('sorti')) {
    const page = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
    await page.goto('file:///home/claude/sorti/test/index.html'); await page.waitForTimeout(1800);
    for (const [arena, chars] of [['volcan', ['purace', 'yuma']], ['cano', ['candela', 'iguaque']], ['ciudad', ['zuhe', 'mapale']], ['paramo', ['catatumbo', 'frailejon']]]) {
      await page.evaluate(([a, c]) => { UI.show(null, false); Game.start('duel', 0, { arena: a, chars: c, wins: 9, level: 2 }); Game.G.introT = 0; }, [arena, chars]);
      await page.evaluate(hideUI); await page.waitForTimeout(7000); await page.evaluate(hideUI);
      await shot(page, 'sorti-' + arena);
    }
  }
  if (only.includes('vertigo')) {
    const page = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
    await page.goto('file:///home/claude/vertigo/test/index.html'); await page.waitForTimeout(5000);
    for (const tid of ['tokio', 'santorini', 'guatape', 'egipto']) {
      await page.evaluate(t => { Game.setup(2); Game.preview(t); }, tid); await page.waitForTimeout(4000);
      await page.evaluate(() => { Game.toTitle(); UI.show(null); }); await page.evaluate(hideUI); await page.waitForTimeout(9000);
      await shot(page, 'vertigo-' + tid);
    }
  }
  await browser.close();
})();
