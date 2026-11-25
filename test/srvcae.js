// El servidor propio se cae (o frena a un aparato que manda de más) y el juego sigue: necesita el servidor local en 8799
// (`cd servidor && npx wrangler dev --port 8799`). En las pruebas la «señal pública» es BroadcastChannel (en la vida real,
// MQTT). 1) por el relevo del servidor llega todo · 2) sin red (el servidor no se alcanza): sigue llegando por la señal
// pública · 3) vuelve la red: el servidor se reconecta solo · 4) un aparato manda más de 300 mensajes/s: el servidor lo
// desconecta y se reconecta solo.
const { chromium } = require('playwright'), http = require('http'), net = require('net'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), PORT = 8767;
const srv = http.createServer((q, s) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html' : 'text/javascript' }); s.end(d); }); }).listen(PORT);
const wait = ms => new Promise(r => setTimeout(r, ms));
// paso entre el juego y el servidor (8798 → 8799) para simular la red: «hoyo» = no pasa nada pero nada se cierra (como al
// cambiar de antena) · «caído» = se cierra todo y no acepta
let hoyo = false, caido = false; const socks = new Set();
const px = net.createServer(c => { if (caido) { c.destroy(); return; } const u = net.connect(8799, '127.0.0.1'); socks.add(c); socks.add(u);
  c.on('data', d => { if (!hoyo) u.write(d); }); u.on('data', d => { if (!hoyo) c.write(d); });
  const end = () => { socks.delete(c); socks.delete(u); c.destroy(); u.destroy(); }; c.on('error', end); u.on('error', end); c.on('close', end); u.on('close', end); }).listen(8798);
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(); const errs = [];
  const url = `http://127.0.0.1:${PORT}/test/net/harness.html?net=bc&server=http://127.0.0.1:8798&netforce=relay`;
  const pages = []; for (let i = 0; i < 2; i++) { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(url); pages.push(p); }
  const [H, A] = pages, out = {};
  const code = await H.evaluate(() => Net.host({ name: 'Anfitrión', players: [{ name: 'Ana' }] }));
  await A.evaluate(c => Net.join(c, { name: 'Celular', players: [{ name: 'Beto' }] }), code);
  for (let i = 0; i < 60; i++) { if (await H.evaluate(() => Net.room && Net.room.devices.filter(d => d.open || d.host).length === 2)) break; await wait(250); }
  await wait(1500);
  const count = (P, k) => P.evaluate(k => LOG.filter(l => l.m.k === k).length, k);
  out.servidor = await H.evaluate(() => Net.serverReady) && await A.evaluate(() => Net.serverReady);
  out.via = await H.evaluate(() => Net.room.devices.map(d => d.via));
  await H.evaluate(() => { for (let i = 0; i < 5; i++) Net.send('*', { k: 'uno', i }, true); }); await wait(800);
  out.llegaConServidor = await count(A, 'uno');
  // 2a) el servidor deja de contestar sin cerrar nada: en pocos segundos se da por «no fresco» y se sigue por la señal pública
  hoyo = true; let t = Date.now(); while (Date.now() - t < 9000 && (await A.evaluate(() => Net.serverReady))) await wait(200);
  out.detectaHoyoEn = Date.now() - t;
  await H.evaluate(() => { for (let i = 0; i < 5; i++) Net.send('*', { k: 'dos', i }, true); }); await wait(1200);
  out.llegaConHoyo = await count(A, 'dos');
  // 2b) el servidor se cae del todo
  hoyo = false; caido = true; for (const s of socks) s.destroy(); await wait(1500);
  out.servidorCaido = await A.evaluate(() => Net.serverReady);
  await H.evaluate(() => { for (let i = 0; i < 5; i++) Net.send('*', { k: 'tres', i }, true); }); await wait(1200);
  out.llegaSinServidor = await count(A, 'tres');
  // 3) vuelve: se reconecta solo (reintento ≤ 10 s)
  caido = false; t = Date.now(); while (Date.now() - t < 15000 && !(await A.evaluate(() => Net.serverReady))) await wait(300);
  out.reconectaEn = (await A.evaluate(() => Net.serverReady)) ? Date.now() - t : null;
  // 4) un error que manda de más: el servidor lo corta (más de 300/s durante 3 s) y el aparato se reconecta
  const cortes = await A.evaluate(async () => { let n = 0; const off = Net.on('status', s => { if (s && s.server && s.ok === false) n++; }); const t0 = performance.now();
    while (performance.now() - t0 < 4500) { for (let i = 0; i < 18; i++) Net.send(Net.hostId, { k: "spam", i }, true); await new Promise(r => setTimeout(r, 40)); }
    off(); return n; });
  t = Date.now(); while (Date.now() - t < 15000 && !(await A.evaluate(() => Net.serverReady))) await wait(300);
  out.cortadoPorMandarDeMas = cortes; out.vuelveTrasElCorte = await A.evaluate(() => Net.serverReady);
  out.errores = errs;
  console.log(JSON.stringify(out));
  const ok = out.servidor && out.llegaConServidor === 5 && out.detectaHoyoEn < 6500 && out.llegaConHoyo === 5 && !out.servidorCaido && out.llegaSinServidor === 5 && out.reconectaEn != null && out.cortadoPorMandarDeMas >= 1 && out.vuelveTrasElCorte && !errs.length;
  console.log(ok ? 'SERVIDOR: SE CAE Y SIGUE OK' : 'SERVIDOR: FALLA');
  await b.close(); srv.close(); px.close();
})();
