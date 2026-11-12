// capturas de escritorio (1280×720) del entrenamiento
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(1000);
  const shots = process.argv[2] ? JSON.parse(process.argv[2]) : [['d-entreno', `TYA.UI.show('entreno')`, 0.1], ['d-train0', `TYA.UI.show(null,false); TYA.Entreno.start(0)`, 2.2], ['d-train2', `TYA.UI.show(null,false); TYA.Entreno.start(2)`, 2.2], ['d-train7', `TYA.UI.show(null,false); TYA.Entreno.start(7, 1)`, 1.6]];
  for (const [n, code, secs] of shots) {
    await page.evaluate(code => eval(code), code);
    await page.evaluate(secs => { for (let k = 0; k < 60 * secs; k++) TYA.Game.update(1 / 60); }, secs);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `shots/${n}.png` });
  }
  console.log('ERR', errors.join(' | '));
  await browser.close();
})();
