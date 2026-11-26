// En línea desde el celular: los dos aparatos con pantalla táctil; el remoto es un celular horizontal (844×390).
// JUEGO=tira-y-afloja (por defecto) o ventolera. El remoto mantiene apretado su botón táctil y su personaje se mueve en
// el anfitrión; los botones táctiles son los de UN jugador (el suyo); captura del celular.
const { chromium, devices } = require('playwright');
const URL = (process.env.URL || 'http://127.0.0.1:8765/') + '?net=bc#online', OUT = process.env.OUT || '/tmp/', GID = process.env.JUEGO || 'tira-y-afloja';
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--disable-features=WebRtcHideLocalIpsWithMdns'] });
  const ctx = await b.newContext({ hasTouch: true, isMobile: true, deviceScaleFactor: 2, userAgent: devices['Pixel 7'].userAgent }); const errs = [];
  await ctx.addInitScript(() => { window.__errs = []; if (!window.__autoPick) window.__autoPick = setInterval(() => { try { document.querySelectorAll("#netWait .pf button:not(.no)").forEach(b => b.click()); } catch (e) {} }, 700); addEventListener('error', e => window.__errs.push(String(e.message).slice(0, 160))); });
  const page = async (w, h) => { const p = await ctx.newPage(); await p.setViewportSize({ width: w, height: h }); p.on('pageerror', e => errs.push(e.message)); await p.goto(URL); await wait(800); return p; };
  const H = await page(1180, 820), C = await page(844, 390);
  await H.fill('[data-pname="0"]', 'Tablet'); await H.click('#on-host'); await wait(400);
  const code = await H.evaluate(() => Net.code);
  await C.fill('[data-pname="0"]', 'Celu'); await C.fill('#on-code', code); await C.click('#on-join');
  for (let i = 0; i < 60; i++) { if (await H.evaluate(() => Net.room && Net.room.devices.length === 2 && Net.room.devices.every(d => d.host || d.open))) break; await wait(300); }
  await C.screenshot({ path: OUT + 'netcel-sala.png' });
  await H.click(`[data-ong="${GID}"]`); await wait(300); await H.click('#on-go');
  const frameOf = async p => { for (let i = 0; i < 120; i++) { const f = p.frames().find(x => x !== p.mainFrame() && x.url() !== 'about:blank'); if (f) { try { if (await f.evaluate(() => typeof NetPlay !== 'undefined' && NetPlay.on && !!NetPlay.cfg)) return f; } catch (e) {} } await wait(500); } return null; };
  const fh = await frameOf(H), fc = await frameOf(C);
  if (!fh || !fc) { console.log('no abrió', !!fh, !!fc); await b.close(); process.exit(1); }
  const playing = GID === 'ventolera' ? () => Game.G.state === 'play' : () => Game.G.state === 'play';
  for (let i = 0; i < 60; i++) { if (await fh.evaluate(playing)) break; await wait(500); }
  await wait(1500);
  const seat = await fc.evaluate(() => NetPlay.mine[0]);
  const pos = async f => f.evaluate(s => { const o = (typeof Game.G.players !== 'undefined' && Game.G.players.length ? Game.G.players : Game.G.birds)[s]; return [Math.round(o.x), Math.round(o.y)]; }, seat);
  const groups = await fc.evaluate(() => [...document.querySelectorAll('#touch .tcl, #touch .tgrp')].filter(e => e.offsetParent).length);
  const before = await pos(fh);
  // el dedo: TyA → botón «derecha»; Ventolera → palanca (arrastrar hacia arriba a la derecha) y disparar
  const box = await fc.evaluate(gid => { const q = gid === 'ventolera' ? '#touch .tstick .tpad' : '#touch .k-right'; const e = document.querySelector(q); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, GID);
  const off = await C.evaluate(() => { const f = document.querySelector('#frame'); const r = f.getBoundingClientRect(); return { x: r.x, y: r.y }; });
  if (box) { await C.mouse.move(off.x + box.x, off.y + box.y); await C.mouse.down(); if (GID === 'ventolera') await C.mouse.move(off.x + box.x + 40, off.y + box.y - 50, { steps: 6 }); await wait(1400); await C.screenshot({ path: OUT + 'netcel-juego.png' }); await C.mouse.up(); }
  const after = await pos(fh);
  const ferr = async f => f.evaluate(() => window.__errs.slice(0, 3)).catch(() => []);
  const all = [...errs, ...await ferr(fh), ...await ferr(fc)];
  const moved = Math.hypot(after[0] - before[0], after[1] - before[1]) > 20;
  console.log({ juego: GID, botonesTactilesDelCelular: groups, dedo: !!box, seMueveEnElAnfitrion: moved, antes: before, despues: after, errores: all.slice(0, 4) });
  console.log(box && moved && groups >= 2 && !all.length ? 'CELULAR OK' : 'CELULAR FALLA');
  await b.close();
})();
