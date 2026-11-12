// Revisa cada recorrido de Carrera: tramos rectos entre aros que chocan con algo, y largo de la vuelta
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 800, height: 450 } })).newPage();
  await page.goto('file://' + path.resolve(__dirname, 'index.html'));
  await page.waitForTimeout(500);
  const courses = process.env.COURSES ? JSON.parse(require('fs').readFileSync(process.env.COURSES, 'utf8')) : null;
  const r = await page.evaluate((courses) => {
    const { World, Modes } = VTO, out = [];
    const C = courses || Modes.RACE;
    for (const id of Object.keys(C)) {
      const W = World.build(id), list = C[id], n = list.length, bad = [];
      let len = 0;
      for (let i = 0; i < n; i++) {
        const [x0, y0] = list[(i - 1 + n) % n], [x1, y1, r] = list[i], d = Math.hypot(x1 - x0, y1 - y0); len += d;
        if (World.solidAt(W, x1, y1, (r || 95) * 0.7) || y1 > W.groundY(x1) - (r || 95) - 40) bad.push(`aro ${i + 1} metido`);
        for (let k = 1; k < 30; k++) { const x = x0 + (x1 - x0) * k / 30, y = y0 + (y1 - y0) * k / 30; if (World.solidAt(W, x, y, 34) || y > W.groundY(x) - 50) { bad.push(`tramo ${((i - 1 + n) % n) + 1}→${i + 1} choca en ${Math.round(x)},${Math.round(y)}`); break; } }
      }
      out.push({ id, aros: n, vuelta: Math.round(len), malos: bad });
    }
    return out;
  }, courses);
  r.forEach(x => console.log(JSON.stringify(x)));
  await browser.close();
})();
