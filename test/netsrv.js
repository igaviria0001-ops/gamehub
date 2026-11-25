// Red de GameHub por el SERVIDOR PROPIO (señal y, con RELAY=1, relevo): necesita `cd servidor && npx wrangler dev --port 8799` andando.
// Uso: node test/net.js   (sirve la carpeta del repo en 8766)
const { chromium } = require('playwright'), http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), PORT = 8766;
const srv = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : 'text/javascript' }); s.end(d); }); }).listen(PORT);
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const ctx = await b.newContext(), url = `http://127.0.0.1:${PORT}/test/net/harness.html?net=srv&server=http://127.0.0.1:8799${process.env.RELAY ? "&netforce=relay" : ""}`;
  const pages = []; for (let i = 0; i < 3; i++) { const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', i, e.message)); await p.goto(url); pages.push(p); }
  const [H, A, B] = pages;
  const code = await H.evaluate(() => Net.host({ name: 'Anfitrión', players: [{ name: 'Ignacio' }, { name: 'Juan' }] }));
  await A.evaluate(c => Net.join(c, { name: 'Celular A', players: [{ name: 'Ana' }] }), code);
  await B.evaluate(c => Net.join(c, { name: 'PC B', players: [{ name: 'Beto' }] }), code);
  const t0 = Date.now(); let room;
  while (Date.now() - t0 < 20000) { room = await H.evaluate(() => Net.room); if (room && room.devices.filter(d => d.open || d.host).length === 3) break; await wait(250); }
  console.log('conectados en', Date.now() - t0, 'ms:', room.devices.map(d => `${d.info.name}(${d.via})`).join(', '));
  await wait(4500);
  console.log('ping:', JSON.stringify(await H.evaluate(() => [...Net.peers.values()].map(p => Math.round(p.rtt)))), 'reloj A:', await A.evaluate(() => Math.round(Net.now() - performance.now())));
  // anfitrión → todos (confiable y no confiable) y cliente → anfitrión
  await H.evaluate(() => { Net.send('*', { k: 'hola', n: 1 }, true); for (let i = 0; i < 60; i++) Net.send('*', { k: 'snap', i }, false); });
  await A.evaluate(() => { for (let i = 0; i < 60; i++) Net.send(Net.hostId, { k: 'inp', i }, false); Net.send(Net.hostId, { k: 'evt' }, true); });
  await wait(800);
  const ra = await A.evaluate(() => [LOG.filter(l => l.m.k === 'hola').length, LOG.filter(l => l.m.k === 'snap').length, !!window.ROOM && window.ROOM.devices.length]);
  const rh = await H.evaluate(() => [LOG.filter(l => l.m.k === 'inp').length, LOG.filter(l => l.m.k === 'evt').length]);
  console.log('A recibió hola/snap/sala:', ra, '· anfitrión recibió inp/evt:', rh);
  // un aparato se va y vuelve
  await B.evaluate(() => Net.leave()); await wait(1500);
  console.log('tras salir B:', (await H.evaluate(() => Net.room.devices.length)));
  const ok = room.devices.length === 3 && ra[0] === 1 && ra[1] >= 50 && ra[2] === 3 && rh[0] >= 50 && rh[1] === 1;
  console.log(ok ? 'RED OK' : 'RED FALLA');
  await b.close(); srv.close();
})();
