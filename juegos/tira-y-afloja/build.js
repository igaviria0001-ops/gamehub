// Une los archivos de src/ en una sola página HTML
const fs = require('fs'), path = require('path');
const src = path.join(__dirname, 'src');
const files = fs.readdirSync(src).filter(f => f.endsWith('.js')).sort();
const js = files.map(f => `/* ===== ${f} ===== */\n` + fs.readFileSync(path.join(src, f), 'utf8')).join('\n');
const assets = path.join(__dirname, 'assets');
const fonts = [400, 500, 600, 700].map(w => `@font-face { font-family: "Fredoka"; font-style: normal; font-weight: ${w}; font-display: swap; src: url(data:font/woff2;base64,${fs.readFileSync(path.join(assets, `fredoka-latin-${w}-normal.woff2`)).toString('base64')}) format("woff2"); }`).join('\n');
const html = fs.readFileSync(path.join(src, 'template.html'), 'utf8').replace('/*__FONTS__*/', () => fonts).replace('/*__SCRIPTS__*/', () => js);
const out = process.argv[2] || path.join(__dirname, 'dist', 'tira-y-afloja.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
fs.writeFileSync(path.join(__dirname,'test','index.html'), html);
console.log('OK', out, (html.length / 1024).toFixed(1) + ' KB');
