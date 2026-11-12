// mecánicas de la campaña, una por una
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(700);
  const r = await page.evaluate(() => {
    const out = {}, G = Game.G;
    const go = (lv, chars) => { Game.start('camp', 2, { level: lv, chars }); UI.show(null, false); Game.advance(2.8); G.units = G.units.filter(u => !(u instanceof Creature)); return G.mages; };
    const S = (m, el, lvl) => Spells.cast(G, m, SPELLS[el][lvl - 1], el, { level: lvl, power: 1 });
    const F = (m, key) => Spells.cast(G, m, FUSIONS[key], key, { fusion: key, power: 1, size: 1 });
    // 1. brasero con una brasa
    let [a, b] = go(0, ['candela', 'yuma']); a.x = 450; a.y = 260; a.face = 0; S(a, 'fire', 1); Game.advance(0.6); out.brasero = G.objs[0].lit;
    // 2. ventisca congela la laguna y se cruza caminando
    [a, b] = go(1, ['yuma', 'catatumbo']); a.x = 600; a.y = 510; a.face = 0; a.hands = [{ el: 'water', nat: 'water', uses: 0, cd: 0, hold: -1 }, { el: 'wind', nat: 'wind', uses: 0, cd: 0, hold: -1 }];
    F(a, 'water+wind'); Game.advance(0.1); let ice = 0; for (let x = 660; x < 900; x += 40) { const i = Terrain.idx(G.T, x, 510); if (G.T.ice[i] > 0) ice++; } out.hielo = ice;
    // resonancia: agua de uno + soplo del otro
    a.x = 300; a.y = 700; a.face = -0.9; b.x = 300; b.y = 300; b.face = 0.9; S(a, 'water', 1); S(b, 'wind', 1); let res = 0; Game.tap = e => { if (e.type === 'resonance') res = e.key; }; Game.advance(0.4); Game.tap = null; out.resonancia = res;
    // 3. semilla en tierra fértil mojada → puente
    a.x = 880; a.y = 510; a.face = 0; S(a, 'water', 2); Game.advance(0.4); b.x = 900; b.y = 520; b.face = 0; b.hands[0].el = 'plant'; Spells.cast(G, b, SPELLS.plant[0], 'plant', { level: 1, power: 1 }); Game.advance(0.8); out.puente = G.objs.find(o => o.t === 'sprout').grown;
    // 4. placas y puerta
    a.x = 1500; a.y = 280; b.x = 1500; b.y = 740; Game.advance(0.2); out.puerta = G.objs.find(o => o.t === 'door').open;
    // 5. tótems con rayo
    [a, b] = go(4, ['yuma', 'catatumbo']); a.x = 560; a.y = 250; a.face = 0; b.x = 560; b.y = 750; b.face = 0; a.hands[1].hold = -1; Spells.cast(G, a, SPELLS.bolt[0], 'bolt', { level: 1, power: 1 }); Spells.cast(G, b, SPELLS.bolt[0], 'bolt', { level: 1, power: 1 }); Game.advance(0.3); out.totems = G.objs.filter(o => o.t === 'totem').map(o => +o.power.toFixed(1)); out.puenteRio = G.objs.find(o => o.t === 'bridge').open;
    // espinas
    a.x = 1560; a.y = 500; a.face = 0; S(a, 'fire', 2); Game.advance(6); out.espinas = !!G.cs.thorns;
    // 6. sellos
    [a, b] = go(7, ['candela', 'yuma']); a.x = 560; a.y = 300; a.face = 0; F(a, 'fire+water'); Game.advance(0.3); out.sello = G.objs.find(o => o.t === 'seal').done;
    // 7. lava que se enfría
    [a, b] = go(8, ['yuma', 'iguaque']); a.x = 900; a.y = 920; a.face = -Math.PI / 2; S(a, 'water', 2); Game.advance(0.8); let cool = 0; for (let y = 780; y <= 860; y += 40) { const i = Terrain.idx(G.T, 900, y); if (G.T.cool[i] > 0) cool++; } out.lavaFria = cool;
    // 8. jefes: Madremonte (escudo con fuego), Mohán (congelado)
    [a, b] = go(3, ['candela', 'yuma']); const B = G.boss; const s0 = B.shield; B.hurt(G, 30, { by: 0, el: 'water' }); const s1 = B.shield; B.hurt(G, 30, { by: 0, el: 'fire' }); out.madremonte = [s0, s1, Math.round(B.shield)];
    [a, b] = go(6, ['yuma', 'catatumbo']); const M = G.boss, h0 = M.hp; M.hurt(G, 20, { by: 0, el: 'fire' }); const h1 = M.hp; M.freeze(G, 2, 0); M.hurt(G, 20, { by: 0, el: 'earth' }); out.mohan = [Math.round(h0 - h1), Math.round(h1 - M.hp)];
    return out;
  });
  console.log(JSON.stringify(r)); console.log('ERR', errors.slice(0, 5).join(' | ') || 'ninguno');
  await browser.close();
})();
