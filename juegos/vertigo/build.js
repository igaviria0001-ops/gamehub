// Une Three.js + src/*.js + fuentes en una sola página HTML (funciona sin internet)
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, 'src'), assets = path.join(__dirname, 'assets');
const files = fs.readdirSync(src).filter(f => f.endsWith('.js')).sort();
const three = fs.readFileSync(path.join(__dirname, 'vendor', 'three.r128.min.js'), 'utf8');
const js = files.map(f => `/* ===== ${f} ===== */\n` + fs.readFileSync(path.join(src, f), 'utf8')).join('\n');
const b64 = f => fs.readFileSync(path.join(assets, f)).toString('base64');
const fonts = [
  `@font-face { font-family: "Russo One"; font-weight: 400; font-display: swap; src: url(data:font/ttf;base64,${b64('RussoOne-Regular.ttf')}) format("truetype"); }`,
  `@font-face { font-family: "Nunito"; font-weight: 600; font-display: swap; src: url(data:font/woff2;base64,${b64('nunito-latin-600-normal.woff2')}) format("woff2"); }`,
  `@font-face { font-family: "Nunito"; font-weight: 800; font-display: swap; src: url(data:font/woff2;base64,${b64('nunito-latin-800-normal.woff2')}) format("woff2"); }`,
  `@font-face { font-family: "Nunito"; font-weight: 900; font-display: swap; src: url(data:font/woff2;base64,${b64('nunito-latin-800-normal.woff2')}) format("woff2"); }`,
].join('\n');
const html = fs.readFileSync(path.join(src, 'template.html'), 'utf8')
  .replace('/*__FONTS__*/', () => fonts)
  .replace('/*__THREE__*/', () => '/* three.js r128 — MIT License, Copyright 2010-2021 Three.js Authors */\n' + three)
  .replace('/*__SCRIPTS__*/', () => js);
const out = process.argv[2] || path.join(__dirname, 'dist', 'vertigo.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
fs.writeFileSync(path.join(__dirname, 'test', 'index.html'), html);
console.log('OK', out, (html.length / 1024).toFixed(1) + ' KB');
