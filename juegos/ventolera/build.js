// Une src/*.js y las fuentes en una sola página HTML (funciona sin internet)
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, 'src'), assets = path.join(__dirname, 'assets');
const files = fs.readdirSync(src).filter(f => f.endsWith('.js')).sort();
const js = files.map(f => `/* ===== ${f} ===== */\n` + fs.readFileSync(path.join(src, f), 'utf8')).join('\n');
const font = w => `@font-face { font-family: "Comfortaa"; font-style: normal; font-weight: ${w}; font-display: swap; src: url(data:font/woff2;base64,${fs.readFileSync(path.join(assets, `comfortaa-latin-${w}-normal.woff2`)).toString('base64')}) format("woff2"); }`;
const html = fs.readFileSync(path.join(src, 'template.html'), 'utf8')
  .replace('/*__FONTS__*/', () => font(400) + '\n' + font(700))
  .replace('/*__SCRIPTS__*/', () => js);
const out = process.argv[2] || path.join(__dirname, 'dist', 'ventolera.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
fs.writeFileSync(path.join(__dirname, 'test', 'index.html'), html);
console.log('OK', out, (html.length / 1024).toFixed(1) + ' KB');
