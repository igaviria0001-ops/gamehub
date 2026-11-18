// Sala en línea de GameHub: un PC crea la sala, un celular (2 jugadores) y otro PC se unen (BroadcastChannel + WebRTC real).
// Requiere: python3 -m http.server 8765 en docs/.  OUT=carpeta para capturas.
const { chromium } = require('playwright');
const URL = (process.env.URL || 'http://127.0.0.1:8765/') + '?net=bc#online', OUT = process.env.OUT || '/tmp/';
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const ctx = await b.newContext(); const errs = [];
  const page = async (w, h) => { const p = await ctx.newPage(); await p.setViewportSize({ width: w, height: h }); p.on('pageerror', e => errs.push(e.message)); await p.goto(URL); await wait(800); return p; };
  const H = await page(1280, 800), A = await page(420, 860), B = await page(1100, 760);
  await H.fill('[data-pname="0"]', 'Ignacio'); await H.click('#on-host'); await wait(600);
  const code = await H.evaluate(() => Net.code);
  await A.click('#on-n [data-v="2"]'); await A.fill('[data-pname="0"]', 'Ana'); await A.fill('[data-pname="1"]', 'Sofi'); await A.click('[data-pcol="1"][data-c="#6ff0b0"]');
  await A.fill('#on-code', code); await A.click('#on-join');
  await B.fill('[data-pname="0"]', 'Beto'); await B.fill('#on-code', code); await B.click('#on-join');
  const t0 = Date.now(); let room; while (Date.now() - t0 < 20000) { room = await H.evaluate(() => Net.room); if (room && room.devices.length === 3 && room.devices.every(d => d.host || d.open)) break; await wait(300); }
  await wait(4200);
  const names = await H.evaluate(() => Online.players().map(p => p.name).join(', '));
  const seenA = await A.evaluate(() => Online.players().length);
  await H.screenshot({ path: OUT + 'sala-pc.png' }); await A.screenshot({ path: OUT + 'sala-cel.png' });
  console.log({ code, conectados: room.devices.length, ms: Date.now() - t0, jugadores: names, celularVe: seenA, errs: errs.slice(0, 3) });
  console.log(room.devices.length === 3 && seenA === 4 && !errs.length ? 'SALA OK' : 'SALA FALLA');
  await b.close();
})();
