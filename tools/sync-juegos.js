// Copia el código de cada juego (las carpetas de trabajo) a juegos/ dentro de la colección.
// Lleva src/, assets/, vendor/, tools/, build.js y las pruebas (sin capturas ni páginas generadas).
// Uso: node tools/sync-juegos.js   (las carpetas se pueden cambiar con TYA=… VENTO=… SORTI=… VERTIGO=…)
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const SKIP = new Set(['dist', 'shots', 'proto', 'node_modules', 'PROGRESS.md', 'split.js']);
const map = [[process.env.TYA || '/home/claude/tya', 'tira-y-afloja'], [process.env.VENTO || '/home/claude/vento', 'ventolera'], [process.env.SORTI || '/home/claude/sorti', 'sortilegio'], [process.env.VERTIGO || '/home/claude/vertigo', 'vertigo']];
function copy(from, to, rel = '') {
  fs.mkdirSync(to, { recursive: true });
  for (const f of fs.readdirSync(from)) {
    if (SKIP.has(f) || (rel === 'test' && /\.(png|jpg|html)$/.test(f)) || (rel === 'tools' && /\.png$/.test(f))) continue;
    const a = path.join(from, f), b = path.join(to, f), st = fs.statSync(a);
    if (st.isDirectory()) copy(a, b, f); else fs.copyFileSync(a, b);
  }
}
for (const [from, id] of map) { const to = path.join(ROOT, 'juegos', id); fs.rmSync(to, { recursive: true, force: true }); copy(from, to); }
console.log('juegos/ al día');
