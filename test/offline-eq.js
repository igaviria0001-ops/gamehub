// SIN CONEXIÓN IDÉNTICO: compara la versión de antes del juego en línea (commit 28e6638) con la actual.
// Las dos se cargan con el MISMO azar (Math.random sembrado), el MISMO reloj (performance.now / Date.now / rAF /
// setTimeout virtuales) y las MISMAS teclas a los mismos instantes; se juegan en paralelo y se compara el estado
// completo del juego (posiciones, vida, puntos, todo) cada pocos segundos, y la imagen final píxel por píxel.
// node test/offline-eq.js [juego,...]   · env BASE=28e6638 · SOLO=nombre-de-escena · FAST=1 (menos segundos)
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..'), BASE = process.env.BASE || '28e6638', FAST = !!process.env.FAST;
const TMP = fs.mkdtempSync('/tmp/offeq-');
const GAMES = (process.argv[2] || 'tira-y-afloja,ventolera,sortilegio,vertigo').split(',');
for (const g of GAMES) {
  fs.mkdirSync(TMP + '/old', { recursive: true }); fs.mkdirSync(TMP + '/new', { recursive: true });
  fs.writeFileSync(`${TMP}/old/${g}.html`, execSync(`git show ${BASE}:docs/games/${g}.html`, { cwd: ROOT, maxBuffer: 1 << 28 }));
  fs.copyFileSync(`${ROOT}/docs/games/${g}.html`, `${TMP}/new/${g}.html`);
}
const srv = http.createServer((q, s) => { const f = path.join(TMP, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(TMP) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); fs.createReadStream(f).pipe(s); });

// ---------- lo que se inyecta en las dos versiones antes de que cargue nada ----------
const INIT = () => {
  let s = 12345;
  window.__rlog = null; const who = () => { const L = String(new Error().stack).split('\n').slice(2, 5).map(l => (l.match(/at (\S+)/) || [])[1] || '?'); return L.join('<'); };
  Math.random = () => { if (window.__rlog) window.__rlog.push(who()); s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  window.__seed = n => { s = n | 0; };
  let T = 1e6; performance.now = () => T;
  // el reloj del audio también es virtual (la música agenda notas según él y usa azar)
  try { Object.defineProperty(BaseAudioContext.prototype, 'currentTime', { get() { return (T - 1e6) / 1000; }, configurable: true }); } catch (e) {}
  const RD = Date; window.Date = class extends RD { constructor(...a) { if (a.length) super(...a); else super(1.7e12 + Math.floor(T)); } static now() { return 1.7e12 + Math.floor(T); } };
  let raf = [], rid = 0; window.requestAnimationFrame = cb => { raf.push([++rid, cb]); return rid; }; window.cancelAnimationFrame = id => { raf = raf.filter(r => r[0] !== id); };
  // relojes virtuales: los temporizadores corren con el reloj del juego, no con el de la máquina
  const RT = window.setTimeout.bind(window), RC = window.clearTimeout.bind(window); let tm = [], tid = 1e6; window.__virt = false;
  window.setTimeout = (f, ms, ...a) => { if (!window.__virt) return RT(f, ms, ...a); const id = ++tid; tm.push({ id, at: T + (+ms || 0), f, a }); return id; };
  window.setInterval = (f, ms, ...a) => { const id = ++tid; tm.push({ id, at: T + Math.max(1, +ms || 0), f, a, every: Math.max(1, +ms || 0) }); return id; };
  window.clearTimeout = window.clearInterval = id => { tm = tm.filter(t => t.id !== id); RC(id); };
  const runTimers = () => { for (let k = 0; k < 500; k++) { const due = tm.filter(t => t.at <= T).sort((a, b) => a.at - b.at || a.id - b.id)[0]; if (!due) break; if (due.every) due.at += due.every; else tm = tm.filter(t => t !== due); try { typeof due.f === 'function' ? due.f(...due.a) : 0; } catch (e) { (window.__errs = window.__errs || []).push('timer: ' + e.message); } } };
  window.__frame = (ms = 1000 / 60) => { T += ms; runTimers(); const q = raf; raf = []; for (const [, cb] of q) try { cb(T); } catch (e) { (window.__errs = window.__errs || []).push('frame: ' + e.message); } };
  window.__tick = ms => { T += ms; runTimers(); };
  window.__errs = []; addEventListener('error', e => window.__errs.push(String(e.message).slice(0, 200)));
  try { localStorage.setItem('vtg_gq', '0'); } catch (e) {}
  const KEY = { Space: ' ', Enter: 'Enter', ShiftLeft: 'Shift', ShiftRight: 'Shift', Slash: '/', Period: '.', Comma: ',', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight' };
  window.__key = (type, code) => { const key = KEY[code] || (code.startsWith('Key') ? code.slice(3).toLowerCase() : code.startsWith('Numpad') ? code.slice(6) : code); const t = document.activeElement || document.body; t.dispatchEvent(new KeyboardEvent(type, { code, key, bubbles: true, cancelable: true })); };
  // el estado completo, aplanado: ruta → valor (números con 10 cifras); se ignoran funciones, lienzos, audio y DOM
  const SKIP = /Canvas|Context|Audio|Image|Path2D|WebGL|Element|Node$|Pattern|Gradient|Texture|Material|Geometry|Mesh|Object3D|Scene|Camera|Light|Renderer|Group|Sprite|Points|Line|Bone|Skeleton/;
  window.__flat = (root, maxD = 5, ign = null) => {
    const out = {}, stack = [];
    const walk = (v, p, d) => {
      if (ign && ign.test(p)) return;
      if (v == null || typeof v === 'boolean' || typeof v === 'string') { out[p] = v; return; }
      if (typeof v === 'number') { out[p] = Number.isFinite(v) ? +v.toPrecision(10) : String(v); return; }
      if (typeof v !== 'object') return;
      const cn = v.constructor && v.constructor.name || '';
      if (SKIP.test(cn) || v.isObject3D || v.isMaterial || v.isTexture || v.isBufferGeometry) return;
      if (ArrayBuffer.isView(v)) { let h = 0; for (let i = 0; i < v.length; i++) h = (Math.imul(h, 31) + Math.round(v[i] * 1000)) | 0; out[p] = 'ta' + v.length + ':' + h; return; }
      if (stack.includes(v)) { out[p] = '<ciclo>'; return; }
      if (d >= maxD) { out[p] = '<' + (Array.isArray(v) ? 'arr' + v.length : 'obj') + '>'; return; }
      stack.push(v);
      if (Array.isArray(v)) {
        out[p + '#'] = v.length;
        if (v.length > 400) { let h = 0; for (const x of v) if (typeof x === 'number') h = (Math.imul(h, 31) + Math.round(x * 1000)) | 0; out[p + '#h'] = h; }
        for (let i = 0; i < Math.min(v.length, 400); i++) walk(v[i], p + '[' + i + ']', d + 1);
      } else if (v instanceof Map) { out[p + '#'] = v.size; let i = 0; for (const [k, x] of v) { if (i++ > 200) break; walk(x, p + '{' + String(k) + '}', d + 1); } }
      else if (v instanceof Set) out[p + '#'] = v.size;
      else for (const k of Object.keys(v)) walk(v[k], p + '.' + k, d + 1);
      stack.pop();
    };
    walk(root, '', 0); return out;
  };
  window.__hash = (root, maxD, ign) => { const f = window.__flat(root, maxD, ign), ks = Object.keys(f).sort(); let h = 0; for (const k of ks) { const s = k + '=' + f[k]; for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0; } return h + ':' + ks.length; };
};

// ---------- escenas por juego ----------
// fast: pasos de simulación sin dibujar (largos) · frame: el bucle real del juego (dibuja, HUD, sonido…) con teclas
const S = FAST ? 0.4 : 1;
const keysFor = (codes, secs, seed) => { // teclas al azar pero iguales para las dos versiones
  let s = seed; const r = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff, out = [];
  for (let t = 0.3; t < secs; t += 0.15 + r() * 0.5) { const c = codes[Math.floor(r() * codes.length)]; out.push([t, 'keydown', c]); out.push([t + 0.1 + r() * 0.9, 'keyup', c]); }
  return out.sort((a, b) => a[0] - b[0]);
};
const K1 = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyE', 'KeyQ', 'KeyR', 'KeyT', 'Space', 'ShiftLeft', 'KeyC', 'KeyV', 'KeyX', 'KeyZ'];
const K2 = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyJ', 'KeyK', 'KeyL', 'KeyI', 'KeyO', 'KeyU', 'Slash', 'Period', 'Comma', 'ShiftRight', 'Enter', 'Numpad0', 'Numpad1', 'Numpad2', 'KeyM', 'KeyN'];
const SC = {
  // bumpCd (un solo par) pasó a bumpPair['0-1'] (un enfriamiento por pareja, para 3–4 pájaros): se comparan entre sí
  ventolera: { ready: () => typeof VTO !== 'undefined' && !!VTO.Game, root: 'VTO.Game.G', ign: /\.G$|cam\b|^\.bumpCd$|^\.bumpPair/, pairs: [['VTO.Game.G.bumpCd', "(VTO.Game.G.bumpPair || {})['0-1'] || 0"]], scenes: [
    ...['duel', 'targets', 'case', 'race', 'boss', 'free'].map((m, i) => ({ name: 'máquinas ' + m, kind: 'fast', secs: 60 * S, step: 'VTO.Game.advance(0.25)', dt: 0.25,
      setup: `VTO.Game.setArena(${JSON.stringify(['cocora', 'medellin', 'bogota', 'cartagena', 'capadocia', 'cocora'][i])}); VTO.Game.start('${m}', 1); VTO.UI.show(null, false); const G = VTO.Game.G; G.bots[0] = new VTO.Bot(G.birds[0], 7, 2); if (!G.bots[1]) G.bots[1] = new VTO.Bot(G.birds[1], 13, 1);` })),
    { name: '2 humanos duelo (bucle real)', kind: 'frame', secs: 25 * S, keys: [...K1, ...K2], setup: `VTO.Game.setArena('medellin'); VTO.Game.start('duel', 2); VTO.UI.show(null, false);` },
    { name: '1 humano carrera (bucle real)', kind: 'frame', secs: 25 * S, keys: K1, setup: `VTO.Game.setArena('bogota'); VTO.Game.start('race', 1); VTO.UI.show(null, false);` },
    { name: '2 humanos blancos (bucle real)', kind: 'frame', secs: 20 * S, keys: [...K1, ...K2], setup: `VTO.Game.setArena('cartagena'); VTO.Game.start('targets', 2); VTO.UI.show(null, false);` },
    { name: '1 humano escuela (bucle real)', kind: 'frame', secs: 15 * S, keys: K1, setup: `VTO.Game.setArena('cocora'); VTO.Game.start('school', 1); VTO.UI.show(null, false);` },
  ] },
  sortilegio: { ready: () => typeof Game !== 'undefined' && !!Game.G && typeof CHARS !== 'undefined', root: 'Game.G', ign: /\.G$|^\.cam|^\.net$|^\.sea$|^\.T\.(snow|leaf|sea|base0)$/, scenes: [ // G.net (nuevo) es false sin conexión · G.sea y T.snow/leaf/sea/base0 son del Mundo 3 (vacíos fuera de él)
    ...['duel', 'tejo', 'hunt', 'altar'].flatMap((m, i) => ['paramo', 'rio'].map((a, j) => ({ name: `máquinas ${m} ${a}`, kind: 'fast', secs: 70 * S, step: 'Game.advance(0.5)', dt: 0.5,
      setup: `const C = Object.keys(CHARS); Game.start('${m}', 0, { chars: [C[${i}], C[${i + j + 3}]], arena: '${a}', level: 2 }); UI.show(null, false);` }))),
    { name: '2 humanos duelo (bucle real)', kind: 'frame', secs: 25 * S, keys: [...K1, ...K2], setup: `const C = Object.keys(CHARS); Game.start('duel', 2, { chars: [C[0], C[1]], arena: 'paramo' }); UI.show(null, false);` },
    { name: '2 humanos tejo (bucle real)', kind: 'frame', secs: 20 * S, keys: [...K1, ...K2], setup: `const C = Object.keys(CHARS); Game.start('tejo', 2, { chars: [C[2], C[4]], arena: 'rio' }); UI.show(null, false);` },
    { name: '1 humano contra máquina (bucle real)', kind: 'frame', secs: 20 * S, keys: K1, setup: `const C = Object.keys(CHARS); Game.start('duel', 1, { chars: [C[3], C[5]], arena: 'paramo', level: 1 }); UI.show(null, false);` },
  ] },
  'tira-y-afloja': { ready: () => typeof TYA !== 'undefined' && !!TYA.Game, root: 'TYA.Game.G', ign: null, scenes: [
    ...['caneca', 'chicles', 'rey', 'gol', 'escalada', 'fuga'].map((m, i) => ({ name: 'máquinas ' + m, kind: 'fast', secs: 80 * S, step: 'for (let i = 0; i < 30; i++) TYA.Game.update(1 / 60)', dt: 0.5,
      setup: `TYA.Game.startMatch('${m}', false, '${['pupitre', 'laboratorio', 'cafeteria', 'gimnasio', 'torre', 'torre'][i]}'); const G = TYA.Game.G; G.winsNeeded = 99; G.bots = [TYA.makeBot(0, 2), TYA.makeBot(1, 1)];` })),
    { name: 'máquinas fiesta', kind: 'fast', secs: 80 * S, step: 'for (let i = 0; i < 30; i++) TYA.Game.update(1 / 60)', dt: 0.5, setup: `TYA.Game.startMatch('caneca', false, 'random', true); const G = TYA.Game.G; G.winsNeeded = 99; G.bots = [TYA.makeBot(0, 2), TYA.makeBot(1, 2)];` },
    { name: 'máquinas jefe', kind: 'fast', secs: 60 * S, step: 'for (let i = 0; i < 30; i++) TYA.Game.update(1 / 60)', dt: 0.5, setup: `const G = TYA.Game.G; G.jefeId = 'aspiradora'; TYA.Game.startMatch('jefe', true, null); G.bots[0] = TYA.makeBot(0, 2);` },
    { name: '2 humanos caneca (bucle real)', kind: 'frame', secs: 30 * S, keys: [...K1, ...K2], setup: `TYA.Game.startMatch('caneca', false, 'pupitre'); TYA.UI && TYA.UI.show && TYA.UI.show(null);` },
    { name: '1 humano contra máquina rey (bucle real)', kind: 'frame', secs: 25 * S, keys: K1, setup: `TYA.Game.startMatch('rey', true, 'cafeteria'); TYA.UI && TYA.UI.show && TYA.UI.show(null);` },
  ] },
  vertigo: { ready: () => !!window.__vtg && !!window.__vtg.R, root: 'window.__vtg.R', depth: 4, ign: /\.track\b|\.T\b|\.mesh|\.fx\b/, scenes: [
    ...[['quick', {}], ['gp', {}], ['elim', {}], ['battle', {}], ['duel', {}], ['tt', {}], ['world', { ch: 2 }]].map(([m, o]) => ({ name: 'máquinas ' + m, kind: 'fast', secs: (m === 'quick' || m === 'gp' ? 70 : 45) * S, step: 'for (let i = 0; i < 60; i++) { window.__vtg.R.step(1 / 120); Input.endStep(); }', dt: 0.5,
      setup: `Game.startCfg(${m === 'duel' || m === 'tt' ? 1 : 0}, Object.assign(UI.cfg(), { mode: '${m}', track: 'venecia', laps: 2, p: ['cumbia'] }, ${JSON.stringify(o)})); Game.introT = 0;` })),
    { name: '1 humano carrera (bucle real)', kind: 'frame', secs: 14 * S, keys: K1, setup: `Game.startCfg(1, Object.assign(UI.cfg(), { mode: 'quick', track: 'guatape', laps: 2, p: ['salsa'] }));` },
    { name: '2 humanos carrera (bucle real)', kind: 'frame', secs: 10 * S, keys: [...K1, ...K2], setup: `Game.startCfg(2, Object.assign(UI.cfg(), { mode: 'quick', track: 'tokio', laps: 2, p: ['cumbia', 'salsa'] }));` },
    { name: '1 humano persecución (bucle real)', kind: 'frame', secs: 10 * S, keys: K1, setup: `Game.startCfg(1, Object.assign(UI.cfg(), { mode: 'chase', boss: 'tren', diff: 1, p: ['cumbia'] }));` },
  ] },
};

const wait = ms => new Promise(r => setTimeout(r, ms));
// dos capturas son «la misma imagen» si no hay píxeles que cambien más de 6 niveles (el antialias de la GPU varía ±1–3)
const sameImg = (a, b) => { if (a.equals(b)) return true; fs.writeFileSync(TMP + '/a.png', a); fs.writeFileSync(TMP + '/b.png', b);
  const n = +execSync(`python3 -c "from PIL import Image, ImageChops; a=Image.open('${TMP}/a.png').convert('RGB'); b=Image.open('${TMP}/b.png').convert('RGB'); d=ImageChops.difference(a,b).convert('L').point(lambda v: 255 if v > 6 else 0); print(sum(1 for v in d.getdata() if v))"`).toString().trim(); return n === 0; };
(async () => {
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const port = srv.address().port;
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const open = async (build, g) => {
    const ctx = await browser.newContext({ viewport: process.env.VIEW ? { width: +process.env.VIEW.split('x')[0], height: +process.env.VIEW.split('x')[1] } : { width: 960, height: 540 } }); await ctx.addInitScript(INIT);
    const p = await ctx.newPage(); p.__errs = []; p.on('pageerror', e => p.__errs.push(e.message.slice(0, 200)));
    await p.goto(`http://127.0.0.1:${port}/${build}/${g}.html`);
    await p.waitForFunction(SC[g].ready, null, { timeout: 30000, polling: 100 });
    for (let i = 0; i < 4; i++) { await p.evaluate(() => window.__frame()); await wait(150); } // la portada, unos cuadros
    return { p, ctx };
  };
  let all = true; const report = [];
  for (const g of GAMES) {
    const D = SC[g], ign = D.ign ? D.ign.source : null, depth = D.depth || 5;
    // 1) la portada: misma imagen
    { const [a, b] = await Promise.all([open('old', g), open('new', g)]);
      const [ia, ib] = await Promise.all([a.p.screenshot({ animations: 'disabled' }), b.p.screenshot({ animations: 'disabled' })]);
      const same = sameImg(ia, ib); if (!same) { fs.writeFileSync(`/tmp/offeq-${g}-portada-old.png`, ia); fs.writeFileSync(`/tmp/offeq-${g}-portada-new.png`, ib); }
      report.push(`${g} · portada: ${same ? 'idéntica' : 'DISTINTA (ver /tmp/offeq-' + g + '-portada-*.png)'}`); console.log(report[report.length - 1]); if (!same) all = false;
      await a.ctx.close(); await b.ctx.close(); }
    for (const sc of D.scenes) {
      if (process.env.SOLO && !sc.name.includes(process.env.SOLO)) continue;
      const [A, B] = await Promise.all([open('old', g), open('new', g)]);
      const both = f => Promise.all([A.p.evaluate(f.fn || f, f.arg), B.p.evaluate(f.fn || f, f.arg)]);
      const ev = js => Promise.all([A.p.evaluate(js), B.p.evaluate(js)]);
      await ev(`window.__seed(777); window.__virt = true; ${process.env.RLOG ? 'window.__rlog = [];' : ''} ${sc.setup}`);
      const keys = sc.kind === 'frame' ? keysFor(sc.keys, sc.secs, 99 + sc.name.length) : [];
      const dt = sc.kind === 'frame' ? 1 / 60 : sc.dt, n = Math.round(sc.secs / dt), every = Math.max(1, Math.round((sc.kind === 'frame' ? 2 : 5) / dt));
      let t = 0, ki = 0, diff = null, checks = 0;
      const H = `window.__hash(${D.root}, ${depth}, ${ign ? 'new RegExp(' + JSON.stringify(ign) + ')' : 'null'})`;
      for (let i = 1; i <= n && !diff; i++) {
        t += dt; let js = '';
        while (ki < keys.length && keys[ki][0] <= t) { js += `window.__key('${keys[ki][1]}', '${keys[ki][2]}');`; ki++; }
        js += sc.kind === 'frame' ? 'window.__frame(1000 / 60);' : `${sc.step}; window.__tick(${dt * 1000});`;
        if (i % every === 0 || i === n) {
          let [ha, hb] = await ev(js + H); checks++;
          for (const [eo, en] of D.pairs || []) { const [va, vb] = await Promise.all([A.p.evaluate(eo), B.p.evaluate(en)]); if (+(+va).toPrecision(10) !== +(+vb).toPrecision(10)) { ha += ` ${eo}=${va}`; hb += ` ${en}=${vb}`; } }
          if (ha !== hb) {
            const F = `window.__flat(${D.root}, ${depth}, ${ign ? 'new RegExp(' + JSON.stringify(ign) + ')' : 'null'})`;
            const [fa, fb] = await ev(F); const d = ha.includes(' ') || hb.includes(' ') ? [`  pares: vieja ${ha} · nueva ${hb}`] : [];
            for (const k of new Set([...Object.keys(fa), ...Object.keys(fb)])) { if (!(k in fa)) d.push(`  solo en la nueva: ${k} = ${JSON.stringify(fb[k])}`); else if (!(k in fb)) d.push(`  solo en la vieja: ${k} = ${JSON.stringify(fa[k])}`); else if (fa[k] !== fb[k]) d.push(`  ${k}: vieja ${JSON.stringify(fa[k])} · nueva ${JSON.stringify(fb[k])}`); }
            if (process.env.RLOG) { const [la, lb] = await ev('window.__rlog'); let k = 0; while (k < la.length && k < lb.length && la[k] === lb[k]) k++; d.unshift(`  azar: ${la.length} vs ${lb.length} llamadas; primera distinta #${k}:`, ...la.slice(Math.max(0, k - 3), k + 4).map(x => '    vieja ' + x), ...lb.slice(Math.max(0, k - 3), k + 4).map(x => '    nueva ' + x)); }
            diff = { t: +t.toFixed(2), d };
          }
        } else await ev(js);
      }
      // imagen final: un cuadro dibujado con el mismo reloj
      await ev('window.__frame(0)'); const [ia, ib] = await Promise.all([A.p.screenshot({ animations: 'disabled' }), B.p.screenshot({ animations: 'disabled' })]);
      const img = sameImg(ia, ib), slug = sc.name.replace(/[^a-z0-9]+/gi, '-');
      if (!img) { fs.writeFileSync(`/tmp/offeq-${g}-${slug}-old.png`, ia); fs.writeFileSync(`/tmp/offeq-${g}-${slug}-new.png`, ib); }
      const errs = [...A.p.__errs, ...B.p.__errs, ...(await ev('window.__errs')).flat()];
      const ok = !diff && img && !errs.length; if (!ok) all = false;
      const line = `${g} · ${sc.name} (${sc.secs.toFixed(0)} s, ${checks} comparaciones): ${diff ? 'DISTINTO a los ' + diff.t + ' s' : 'estado idéntico'} · imagen ${img ? 'idéntica' : 'DISTINTA'}${errs.length ? ' · ERRORES ' + errs.slice(0, 3).join(' | ') : ''}`;
      report.push(line); console.log(line); if (diff) console.log(diff.d.slice(0, 25).join('\n') + (diff.d.length > 25 ? `\n  … y ${diff.d.length - 25} más` : ''));
      await A.ctx.close(); await B.ctx.close();
    }
  }
  await browser.close(); srv.close();
  console.log(all ? 'SIN CONEXIÓN IDÉNTICO ✓' : 'SIN CONEXIÓN: HAY DIFERENCIAS');
})().catch(e => { console.error(e); process.exit(1); });
