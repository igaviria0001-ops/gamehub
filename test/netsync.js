// Nadie se queda atrás aunque se pierda un aviso (bache de la red, relevo): se borra a propósito en el remoto
//   A) el aviso «empezó la partida»       → igual entra (la sala dice qué partida tiene abierta el anfitrión)
//   B) la cfg de «otra partida (todos)»   → igual pasa a la nueva (el anfitrión la repite; las instantáneas traen el número)
//   C) el aviso «volvimos a la sala»       → igual sale
// JUEGO=ventolera (por defecto)
const { chromium } = require('playwright');
const BASE = (process.env.URL || 'http://127.0.0.1:8765/') + '?net=bc#online', GID = process.env.JUEGO || 'ventolera';
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-background-timer-throttling'] });
  const ctx = await b.newContext({ viewport: { width: 800, height: 450 } }); const errs = [];
  const page = async () => { const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); await p.goto(BASE); await wait(700); return p; };
  const H = await page(), C = await page();
  await H.fill('[data-pname="0"]', 'Ana'); await H.click('#on-host'); await wait(400);
  const code = await H.evaluate(() => Net.code);
  await C.fill('[data-pname="0"]', 'Beto'); await C.fill('#on-code', code); await C.click('#on-join');
  for (let i = 0; i < 60; i++) { if (await H.evaluate(() => Net.room && Net.room.devices.length === 2 && Net.room.devices.every(d => d.host || d.open))) break; await wait(300); }
  const res = {};
  // A) se pierde el aviso de empezar
  await C.evaluate(() => Net.simDrop(m => m && m.$ === 'game', 60000));
  await H.click(`[data-ong="${GID}"]`); await wait(300); await H.click('#on-go'); const tA = Date.now();
  const sidH = await (async () => { for (let i = 0; i < 40; i++) { const s = await H.evaluate(() => GAMEHUB.Launcher.net && GAMEHUB.Launcher.net.sid); if (s) return s; await wait(250); } })();
  let sidC = null; for (let i = 0; i < 60 && sidC !== sidH; i++) { sidC = await C.evaluate(() => GAMEHUB.Launcher.net && GAMEHUB.Launcher.net.sid); if (sidC !== sidH) await wait(250); }
  res.A = { entro: sidC === sidH, seg: +((Date.now() - tA) / 1000).toFixed(1) };
  await C.evaluate(() => Net.simDrop(null));
  const frameOf = async p => { for (let i = 0; i < 160; i++) { const f = p.frames().find(x => x !== p.mainFrame() && x.url() !== 'about:blank'); if (f) { try { if (await f.evaluate(() => typeof NetPlay !== 'undefined' && NetPlay.on && !!NetPlay.cfg)) return f; } catch (e) {} } await wait(400); } return null; };
  const fh = await frameOf(H), fc = await frameOf(C);
  if (!fh || !fc) { console.log(JSON.stringify({ res, error: 'no abrió el juego', errs: errs.slice(0, 3) })); console.log('SINCRONÍA FALLA'); await b.close(); return; }
  await wait(3000);
  // B) se pierde la cfg de la siguiente partida (2,5 s)
  await C.evaluate(() => Net.simDrop(m => m && m.$g && m.d && m.d.t === 'cfg', 2500));
  const idH = await fh.evaluate(() => { NetGame.again(); return NetPlay.cfg.id; }); const tB = Date.now();
  let idC = 0; for (let i = 0; i < 60 && idC !== idH; i++) { idC = await fc.evaluate(() => NetPlay.cfg && NetPlay.cfg.id).catch(() => 0); if (idC !== idH) await wait(250); }
  res.B = { paso: idC === idH, partida: [idH, idC], seg: +((Date.now() - tB) / 1000).toFixed(1) };
  await wait(2500);
  // C) se pierde el aviso de volver a la sala
  await C.evaluate(() => Net.simDrop(m => m && m.$ === 'endgame', 60000));
  await H.evaluate(() => GAMEHUB.Launcher.close()); const tC = Date.now();
  let open = true; for (let i = 0; i < 60 && open; i++) { open = await C.evaluate(() => !!GAMEHUB.Launcher.net); if (open) await wait(250); }
  res.C = { salio: !open, seg: +((Date.now() - tC) / 1000).toFixed(1) };
  await b.close();
  console.log(JSON.stringify({ juego: GID, res, errores: errs.slice(0, 3) }));
  const ok = res.A.entro && res.B.paso && res.C.salio && !errs.length;
  console.log(ok ? 'SINCRONÍA OK' : 'SINCRONÍA FALLA');
})();
