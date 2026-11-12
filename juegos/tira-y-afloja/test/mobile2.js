// Celular apaisado: capturas de cada modo con los botones táctiles (para revisar que el HUD se lea y no choque)
const { chromium } = require('playwright');
const path = require('path');
const W = +(process.argv[2] || 693), H = +(process.argv[3] || 272), DPR = +(process.argv[4] || 2.625), tag = process.argv[5] || 'm2';
const only = process.argv[6] ? process.argv[6].split(',') : null;
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1200);
  await page.tap('#s-title [data-act="playbot"]'); await page.waitForTimeout(150);
  const cases = [
    ['caneca-fiesta', `TYA.Game.startMatch('caneca', true, 'pupitre', true)`, 6],
    ['jefe-reloj', `TYA.Game.G.jefeId='reloj'; TYA.Game.startMatch('jefe', true, 'campana')`, 4],
    ['fuga', `TYA.Game.G.fugaLevel=3; TYA.Game.startMatch('fuga', true, 'torre')`, 4],
    ['chicles', `TYA.Game.startMatch('chicles', true, 'arte')`, 4],
    ['tutorial', `TYA.Tutorial.start(true)`, 2],
    ['camp', `TYA.Game.G.campStage='3-3'; TYA.Game.startMatch('campana', true, 'campana')`, 4],
    ['train', `TYA.Entreno.start(0)`, 2.2],
    ['train1', `TYA.Entreno.start(1)`, 2.2],
    ['train4', `TYA.Entreno.start(4)`, 1.6],
    ['train5', `TYA.Entreno.start(5, 3)`, 1.6],
    ['train7', `TYA.Entreno.start(7, 2)`, 1.3],
    ['train8', `TYA.Entreno.start(8, 2)`, 3],
    ['pause-opts', `TYA.Game.startMatch('caneca', true, 'pupitre'); TYA.Game.setHandicap(0, 2); for (let k = 0; k < 200; k++) TYA.Game.update(1/60); TYA.UI.pause(); document.querySelector('#s-pause [data-act="options"]').click()`, 0.1],
    ['hc-hud', `TYA.UI.show(null, false); TYA.Game.startMatch('chicles', true, 'arte'); TYA.Game.setHandicap(0, 2); TYA.Game.setHandicap(1, 1)`, 3.2],
    ['menu-entreno', `TYA.UI.show('title'); document.querySelector('#s-title [data-act="entreno"]').click()`, 0.1],
  ];
  for (const [name, code, secs] of cases) {
    if (only && !only.includes(name)) continue;
    await page.evaluate(code => { TYA.UI.show(null, false); TYA.Game.startAttract(); eval(code); }, code);
    await page.evaluate(secs => { for (let k = 0; k < 60 * secs; k++) TYA.Game.update(1 / 60); TYA.Progress.unlock && 0; }, secs);
    await page.waitForTimeout(200);
    await page.screenshot({ path: `shots/${tag}-${name}.png` });
  }
  console.log('ERR', errors.join(' | '));
  await browser.close();
})();
