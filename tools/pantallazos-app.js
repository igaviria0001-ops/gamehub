// Fotos de la portada para la ventana de «Instalar» (manifest.screenshots): ancha (PC) y angosta (celular).
// Requiere: python3 -m http.server 8765 en docs/.  Uso: node tools/pantallazos-app.js
const { chromium } = require('playwright');
const path = require('path');
const OUT = path.join(__dirname, '..', 'assets', 'shots');
(async () => {
  const b = await chromium.launch();
  for (const [name, o] of [['app-wide', { viewport: { width: 1280, height: 720 } }], ['app-narrow', { viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }]]) {
    const ctx = await b.newContext(o), p = await ctx.newPage();
    await p.goto(process.env.URL || 'http://127.0.0.1:8765/'); await p.waitForTimeout(2200);
    await p.screenshot({ path: path.join(OUT, name + '.jpg'), type: 'jpeg', quality: 84 });
    await ctx.close();
  }
  await b.close(); console.log('listo');
})();
