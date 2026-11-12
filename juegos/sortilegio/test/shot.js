// escena armada para mirar el arte de cerca: SCENE=nombre
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const name = process.env.VP || 'pc', vps = { pc: [{ width: 1280, height: 720 }, {}], cel: [{ width: 844, height: 390 }, { deviceScaleFactor: 2, isMobile: true, hasTouch: true }] };
  const ctx = await browser.newContext(Object.assign({ viewport: vps[name][0] }, vps[name][1]));
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(900);
  const scene = process.env.SCENE || 'mix', chars = (process.env.CHARS || 'candela,yuma').split(',');
  await page.evaluate(([scene, chars, process_ARENA]) => {
    Game.start('free', 2, { chars, arena: process_ARENA, level: 0 }); UI.show(null, false);
    const G = Game.G; Game.advance(2.8);
    const [a, b] = G.mages; a.x = 560; a.y = 470; b.x = 860; b.y = 430; a.face = 0; b.face = Math.PI;
    const S = (m, el, lvl) => Spells.cast(G, m, SPELLS[el][lvl - 1], el, { level: lvl, power: 1 });
    const F = (m, key) => Spells.cast(G, m, FUSIONS[key], key, { fusion: key, power: 1, size: 1 });
    window.__S = S; window.__F = F;
    if (scene === 'mix') { S(a, 'fire', 1); Game.advance(0.2); S(b, 'water', 2); F(a, 'fire+wind'); Game.advance(0.4); S(b, 'earth', 2); F(b, 'water+bolt'); Game.advance(0.3); a.hands[0].hold = 0.7; b.fuse = true; b.hands[0].hold = 0.3; b.hands[1].hold = 0.3; }
    if (scene === 'fus') { F(a, 'fire+earth'); F(b, 'plant+bolt'); Game.advance(0.8); F(a, 'water+wind'); F(b, 'earth+bolt'); Game.advance(0.2); F(a, 'wind+plant'); Game.advance(0.25); }
    if (scene === 'fus2') { F(a, 'fire+bolt'); F(b, 'wind+earth'); Game.advance(0.45); F(b, 'water+plant'); F(a, 'fire+plant'); S(b, 'plant', 2); Game.advance(0.3); }
  }, [scene, chars, process.env.ARENA || 'paramo']);
  await page.waitForTimeout(250);
  await page.evaluate(() => { Game.G.paused = true; });
  await page.screenshot({ path: path.join(__dirname, 'shots', `scene-${scene}-${name}.png`) });
  console.log('ERR', errors.join(' | ') || 'ninguno');
  await browser.close();
})();
