// Tarjeta para compartir el enlace (vista previa en WhatsApp, Telegram, Messenger…) y favicon.ico de GameHub.
//   assets/enlace.jpg   1200×630: galaxia, el ícono «G», la palabra GAMEHUB y fotos de los 4 juegos a los lados.
//                       Lo importante va en el cuadrado del centro (630×630): algunas apps recortan la foto a un cuadrado.
//   assets/favicon.ico  16, 32 y 48 px (PNG dentro del ICO), sacado del ícono de 512.
// Uso: node tools/enlace.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const A = path.join(__dirname, '..', 'assets');
const b64 = f => fs.readFileSync(path.join(A, f)).toString('base64');
const bungee = b64('fonts/bungee-latin-400-normal.woff2'), nunito = b64('fonts/nunito-latin-800-normal.woff2');
const gal = 'data:image/jpeg;base64,' + b64('galaxia.jpg'), icon = 'data:image/png;base64,' + b64('icons/icon-512.png');
const shot = f => 'data:image/jpeg;base64,' + b64('shots/' + f);
// fotos: dos a cada lado, inclinadas y apagándose hacia el centro
const CARDS = [
  ['vertigo-santorini.jpg', 'VÉRTIGO', '#3dffa8', -36, 70, -9], ['vento-medellin.jpg', 'Ventolera', '#7fd4ff', -24, 330, 6],
  ['sorti-volcan.jpg', 'Sortilegio', '#ffd36b', 946, 60, 8], ['tya-cafeteria.jpg', 'Tira y Afloja', '#ff8fd0', 930, 322, -6],
];
const PAGE = `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: B; src: url(data:font/woff2;base64,${bungee}); }
@font-face { font-family: N; font-weight: 800; src: url(data:font/woff2;base64,${nunito}); }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; overflow: hidden; background: #05030c; position: relative; font-family: N, sans-serif; }
.bg { position: absolute; inset: 0; background: url(${gal}) 50% 55% / cover; filter: saturate(1.35) brightness(.8); }
.veil { position: absolute; inset: 0; background: radial-gradient(ellipse 46% 64% at 50% 50%, rgba(10,4,30,.15), rgba(5,3,12,.55) 70%, rgba(5,3,12,.85)); }
.card { position: absolute; width: 300px; height: 169px; border-radius: 16px; overflow: hidden; box-shadow: 0 14px 40px rgba(0,0,0,.6), 0 0 0 2px rgba(255,255,255,.14); }
.card img { width: 100%; height: 100%; object-fit: cover; display: block; }
.card b { position: absolute; z-index: 1; left: 12px; bottom: 9px; font: 400 17px/1 B; color: #fff; text-shadow: 0 2px 6px rgba(0,0,0,.9); }
.card.l b { left: auto; right: 14px; }
.card i { position: absolute; z-index: 1; left: 0; right: 0; bottom: 0; height: 4px; }
.card.l::after, .card.r::after { content: ""; position: absolute; inset: 0; }
.card.l::after { background: linear-gradient(90deg, rgba(5,3,12,0) 45%, rgba(5,3,12,.55)); }
.card.r::after { background: linear-gradient(270deg, rgba(5,3,12,0) 45%, rgba(5,3,12,.55)); }
.mid { position: absolute; left: 285px; top: 0; width: 630px; height: 630px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.glow { position: absolute; left: 50%; top: 50%; width: 560px; height: 560px; transform: translate(-50%, -52%); background: radial-gradient(closest-side, rgba(150,80,255,.38), rgba(150,80,255,0)); }
.ic { position: relative; width: 214px; height: 214px; border-radius: 48px; box-shadow: 0 0 60px rgba(190,110,255,.55), 0 18px 40px rgba(0,0,0,.6); }
.k { position: relative; margin-top: 26px; font: 800 17px/1 N; letter-spacing: .5em; color: #d9ccff; text-shadow: 0 0 14px rgba(170,110,255,.9); padding-left: .5em; }
.lw { position: relative; margin-top: 14px; font: 400 104px/.95 B; letter-spacing: .01em; white-space: nowrap; }
.ld { position: absolute; inset: 0; color: #160a36; text-shadow: 0 3px 0 #2b1563, 0 6px 0 #22104f, 0 9px 0 #190b3d, 0 12px 0 #10072a, 0 18px 14px rgba(0,0,0,.7), 0 0 60px rgba(150,80,255,.45); }
.lf { position: relative; background: #9a6bff url(${gal}) 30% 64% / 175% auto; -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-stroke: 1px rgba(255,226,255,.34); filter: saturate(1.55) contrast(1.15) brightness(1.1) drop-shadow(0 0 12px rgba(190,110,255,.6)); }
.t { position: relative; margin-top: 26px; font: 800 25px/1.2 N; color: #f6f2ff; text-shadow: 0 2px 10px rgba(0,0,0,.8); }
.t span { color: #ffd36b; }
</style>
<div class="bg"></div><div class="veil"></div>
${CARDS.map(([f, n, c, x, y, r]) => `<div class="card ${x < 600 ? 'l' : 'r'}" style="left:${x}px;top:${y}px;transform:rotate(${r}deg)"><img src="${shot(f)}"><b>${n}</b><i style="background:${c}"></i></div>`).join('')}
<div class="mid"><div class="glow"></div><img class="ic" src="${icon}"><div class="k">4 JUEGOS · 1 UNIVERSO</div>
<div class="lw"><span class="ld" aria-hidden="true">GAMEHUB</span><span class="lf">GAMEHUB</span></div>
<div class="t">Juega con tus amigos · <span>¡en línea!</span></div></div>`;

// ICO con PNG adentro (lo leen Chrome, Edge, Firefox, Safari y los lectores de enlaces)
function ico(pngs) {
  const head = Buffer.alloc(6 + 16 * pngs.length); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
  let off = head.length;
  pngs.forEach(({ s, buf }, i) => { const o = 6 + 16 * i; head.writeUInt8(s >= 256 ? 0 : s, o); head.writeUInt8(s >= 256 ? 0 : s, o + 1); head.writeUInt8(0, o + 2); head.writeUInt8(0, o + 3);
    head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6); head.writeUInt32LE(buf.length, o + 8); head.writeUInt32LE(off, o + 12); off += buf.length; });
  return Buffer.concat([head, ...pngs.map(p => p.buf)]);
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await p.setContent(PAGE); await p.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode())); });
  await p.screenshot({ path: path.join(A, 'enlace.jpg'), type: 'jpeg', quality: 86 });
  // favicon: el ícono de 512 achicado con buen filtro
  const pngs = [];
  for (const s of [16, 32, 48]) {
    const d = await p.evaluate(async ([src, s]) => { const im = new Image(); im.src = src; await im.decode(); let c = document.createElement('canvas'), w = 512, cur = im;
      while (w / 2 >= s) { w = Math.max(s, w / 2); const n = document.createElement('canvas'); n.width = n.height = w; const x = n.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(cur, 0, 0, w, w); cur = n; }
      c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(cur, 0, 0, s, s); return c.toDataURL('image/png'); }, [icon, s]);
    pngs.push({ s, buf: Buffer.from(d.split(',')[1], 'base64') });
  }
  fs.writeFileSync(path.join(A, 'favicon.ico'), ico(pngs));
  await b.close();
  console.log('enlace.jpg', fs.statSync(path.join(A, 'enlace.jpg')).size, 'B · favicon.ico', fs.statSync(path.join(A, 'favicon.ico')).size, 'B');
})();
