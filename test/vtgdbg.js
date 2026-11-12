const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await (await b.newContext({ viewport: { width: 1000, height: 600 } })).newPage(), log = [];
  p.on('console', m => log.push(m.type() + ': ' + m.text())); p.on('pageerror', e => log.push('err: ' + e.message));
  await p.goto('http://127.0.0.1:8765/'); await p.waitForTimeout(500);
  await p.evaluate(() => { window.__msgs = []; addEventListener('message', e => { if (e.data && e.data.hub) window.__msgs.push(e.data.event); }); GAMEHUB.Launcher.open('vertigo'); });
  await p.waitForSelector('#stage.ready', { timeout: 90000 });
  await p.waitForTimeout(3000);
  const f = p.frames().find(x => x !== p.mainFrame());
  const info = await f.evaluate(() => { const b = document.querySelector('.hub-home'); const r = b.getBoundingClientRect(); return { disp: getComputedStyle(b).display, r: [r.x, r.y, r.width, r.height], title: !document.getElementById('s-title').hidden, top: document.elementFromPoint(r.x + 5, r.y + 5) && document.elementFromPoint(r.x + 5, r.y + 5).className }; });
  await f.evaluate(() => document.querySelector('.hub-home').click());
  await p.waitForTimeout(1500);
  console.log(JSON.stringify(info), await p.evaluate(() => JSON.stringify(window.__msgs)), await p.evaluate(() => document.getElementById('stage').hidden));
  console.log(log.slice(-10).join('\n'));
  await b.close();
})();
