// Tira de fotos de una pelea real entre máquinas (para revisar cómo se ve): test/shots/film.png
// Uso: CHARS=tatacoa,purace ARENA=volcan N=12 node test/film.js
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const browser = await chromium.launch(); const page = await (await browser.newContext({ viewport: { width: 960, height: 540 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html')); await page.waitForTimeout(800);
  const chars = (process.env.CHARS || 'tatacoa,purace').split(','), arena = process.env.ARENA || 'volcan', N = +(process.env.N || 12);
  await page.evaluate(([chars, arena]) => { UI.show(null, false); Game.start('duel', 0, { chars, wins: 3, level: 4, arena }); Game.G.introT = 0; Game.G.countT = 0.1; Game.advance(5); }, [chars, arena]);
  fs.mkdirSync(path.join(__dirname, 'shots'), { recursive: true });
  const files = [];
  for (let k = 0; k < N; k++) { await page.waitForTimeout(+(process.env.GAP || 450)); const f = path.join(__dirname, 'shots', `film-${k}.png`); await page.screenshot({ path: f }); files.push(f); }
  console.log('ERR', errors.slice(0, 3).join(' | ') || 'ninguno');
  await browser.close();
  const py = `from PIL import Image\nimport json,sys\nfs=json.loads(sys.argv[1])\nims=[Image.open(f).resize((480,270)) for f in fs]\nc=4; r=(len(ims)+c-1)//c\ns=Image.new('RGB',(480*c,270*r))\nfor i,im in enumerate(ims): s.paste(im,((i%c)*480,(i//c)*270))\ns.save(sys.argv[2])\n`;
  try { require('child_process').execFileSync('python3', ['-c', py, JSON.stringify(files), path.join(__dirname, 'shots', 'film.png')]); } catch (e) { console.log('sin hoja de contacto', e.message); }
})();
