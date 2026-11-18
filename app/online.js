/* =========================================================================
   EN LÍNEA — la sala de GameHub (vista «online»).
   · Cada aparato dice quién juega en él: 1 o 2 personas, con nombre y color.
   · «Crear sala» → código de 5 letras + enlace para invitar (?sala=CÓDIGO).
   · «Unirme» con el código (o abriendo el enlace).
   · En la sala: aparatos conectados, sus jugadores, ping y tipo de conexión
     (directa, por TURN o por relevo). El anfitrión elige qué jugar.
   Usa Net (app/net.js). Lo de jugar de verdad está en netplay (fases F3+).
   ========================================================================= */
const Online = (() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const touch = (() => { try { return matchMedia('(hover: none) and (pointer: coarse)').matches; } catch (e) { return false; } })();
  const COLORS = ['#ff6fae', '#5ad8ff', '#ffd36b', '#6ff0b0', '#b98aff', '#ff8a4a', '#f6f2ff', '#7a9bff'];
  const KEY = 'gamehub_online';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } };
  const st = Object.assign({ players: [{ name: '', color: COLORS[0] }], n: 1 }, load());
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ players: st.players, n: st.n })); } catch (e) { /* nada */ } };
  const params = new URLSearchParams(location.search);
  let code0 = (params.get('sala') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5), note = '', busy = false;
  const el = () => $('#v-online');
  const visible = () => el() && !el().hidden;
  const myPlayers = () => st.players.slice(0, st.n).map((p, i) => ({ name: (p.name || '').trim() || (st.n === 1 ? 'Jugador' : 'Jugador ' + (i + 1)), color: p.color || COLORS[i] }));
  const info = () => ({ name: myPlayers().map(p => p.name).join(' y '), players: myPlayers(), dev: touch ? 'cel' : 'pc' });
  const VIA = { local: ['este aparato', 'ok'], p2p: ['directo', 'ok'], turn: ['por TURN', 'mid'], relay: ['por relevo · lento', 'bad'], conectando: ['conectando…', 'mid'] };
  const DEV = { cel: '📱', pc: '💻' };
  const sig = ms => ms <= 0 ? '' : ms < 60 ? 'ok' : ms < 140 ? 'mid' : 'bad';
  function linkFor(code) { const u = new URL(location.href); u.search = ''; u.hash = 'online'; u.searchParams.set('sala', code); if (params.get('net')) u.searchParams.set('net', params.get('net')); return u.toString(); }
  function players(room) { const out = []; for (const d of (room && room.devices) || []) for (const p of (d.info && d.info.players) || []) out.push(Object.assign({ dev: d.id, devName: d.info.name, kind: d.info.dev }, p)); return out; }

  /* ---------- quién juega en este aparato ---------- */
  function whoHTML() {
    return `<div class="field"><span class="lbl">¿Cuántos juegan en este aparato?</span>
        <div class="seg" id="on-n"><button data-v="1" aria-pressed="${st.n === 1}">1 persona</button><button data-v="2" aria-pressed="${st.n === 2}">2 personas</button></div>
        <div class="hint">${st.n === 2 ? (touch ? 'En el celular, cada uno usa su mitad de la pantalla.' : 'En el computador, cada uno con su lado del teclado (como siempre).') : 'Cada quien en su propio aparato, o dos en uno: como quieran.'}</div></div>
      ${st.players.slice(0, st.n).map((p, i) => `<div class="field"><span class="lbl">${st.n === 2 ? 'Jugador ' + (i + 1) : 'Tu nombre'}</span>
        <input class="textin" data-pname="${i}" maxlength="14" placeholder="${st.n === 2 ? 'Nombre del J' + (i + 1) : 'Tu nombre'}" value="${esc(p.name || '')}">
        <div class="on-colors">${COLORS.map(c => `<button class="on-col" data-pcol="${i}" data-c="${c}" style="--c:${c}" aria-pressed="${(p.color || COLORS[i]) === c}" aria-label="Color"></button>`).join('')}</div></div>`).join('')}`;
  }
  function bindWho(root) {
    $$('#on-n button', root).forEach(b => b.onclick = () => { st.n = +b.dataset.v; while (st.players.length < st.n) st.players.push({ name: '', color: COLORS[st.players.length] }); save(); if (Net.alive) Net.setInfo(info()); render(); });
    $$('[data-pname]', root).forEach(inp => inp.oninput = () => { st.players[+inp.dataset.pname].name = inp.value; save(); clearTimeout(inp._t); inp._t = setTimeout(() => { if (Net.alive) Net.setInfo(info()); }, 500); });
    $$('[data-pcol]', root).forEach(b => b.onclick = () => { st.players[+b.dataset.pcol].color = b.dataset.c; save(); if (Net.alive) Net.setInfo(info()); render(); });
  }

  /* ---------- pantalla ---------- */
  function render() {
    const root = el(); if (!root) return;
    const R = Net.alive ? Net.room : null;
    if (!Net.alive) {
      root.innerHTML = `<div class="wrap" style="max-width:860px"><div class="thead"><div><h1 class="h1">En línea</h1><p class="sub">Jueguen desde varios aparatos: cada uno con su celular, dos en uno y otro aparte, computadores y celulares mezclados. Por wifi o con datos.</p></div></div>
        <div class="stack">
          <div class="panel">${whoHTML()}</div>
          <div class="on-two">
            <div class="panel on-card"><div class="h2">CREAR UNA SALA</div><p class="note">Este aparato será el anfitrión: aquí corre la partida y los demás se unen con el código.</p><button class="btn gold big" id="on-host" ${busy ? 'disabled' : ''}>Crear sala</button></div>
            <div class="panel on-card"><div class="h2">UNIRME A UNA SALA</div><p class="note">Escribe el código que te pasaron (o abre el enlace de invitación).</p>
              <div class="row" style="flex-wrap:nowrap"><input class="textin on-code" id="on-code" maxlength="5" placeholder="CÓDIGO" value="${esc(code0)}" autocapitalize="characters" autocomplete="off"><button class="btn" id="on-join" ${busy ? 'disabled' : ''}>Unirme</button></div></div>
          </div>
          ${note ? `<div class="panel on-note">${esc(note)}</div>` : ''}
        </div></div>`;
      bindWho(root);
      $('#on-host', root).onclick = async () => { busy = true; note = ''; render(); try { await Net.host(info()); } catch (e) { note = 'No se pudo crear la sala: ' + e.message; } busy = false; render(); };
      const join = async () => { const c = $('#on-code', root).value.toUpperCase().replace(/[^A-Z0-9]/g, ''); if (c.length < 5) { note = 'El código tiene 5 letras o números.'; render(); return; } busy = true; note = ''; render(); try { await Net.join(c, info()); waitHost(); } catch (e) { note = 'No se pudo entrar: ' + e.message; } busy = false; render(); };
      $('#on-join', root).onclick = join; $('#on-code', root).onkeydown = e => { if (e.key === 'Enter') join(); };
      return;
    }
    const devs = (R && R.devices) || [], ps = players(R), me = Net.id, host = Net.isHost;
    const hostPeer = !host && Net.peers.get(Net.hostId), myRtt = hostPeer ? Math.round(hostPeer.rtt) : 0, connected = host || (hostPeer && hostPeer.open);
    root.innerHTML = `<div class="wrap" style="max-width:920px"><div class="thead"><div><h1 class="h1">Sala en línea</h1><p class="sub">${host ? 'Eres el anfitrión: aquí corren las partidas. Pásales el código o el enlace a los demás y deja esta pantalla abierta mientras juegan.' : connected ? 'Estás dentro. El anfitrión elige qué jugar.' : 'Buscando al anfitrión…'}</p></div><button class="btn small danger" id="on-leave">Salir de la sala</button></div>
      <div class="stack">
        <div class="panel on-room">
          <div class="on-codebox"><span class="lbl">CÓDIGO</span><b class="on-big">${esc(Net.code)}</b>
            <div class="row"><button class="btn small" id="on-copy">Copiar enlace</button>${navigator.share ? '<button class="btn small ghost" id="on-share">Compartir</button>' : ''}</div></div>
          <div class="on-sum"><b>${ps.length}</b> jugador${ps.length === 1 ? '' : 'es'} en <b>${devs.length}</b> aparato${devs.length === 1 ? '' : 's'}${!host && connected ? ` · tu ping <span class="on-ping ${sig(myRtt)}">${myRtt} ms</span>` : ''}${Net.signalReady ? '' : ' · <span class="on-ping mid">buscando la red…</span>'}</div>
        </div>
        <div class="panel"><div class="h2">APARATOS Y JUGADORES</div>
          <div class="on-devs">${devs.map(d => { const hp = d.host && !host ? hostPeer : null; if (hp) d = Object.assign({}, d, { via: hp.via, rtt: Math.round(hp.rtt) }); const v = VIA[d.id === me ? 'local' : d.via] || VIA.conectando; return `<div class="on-dev${d.id === me ? ' me' : ''}">
            <div class="on-dh"><span class="on-di">${DEV[d.info && d.info.dev] || '🎮'}</span><b>${esc(d.info ? d.info.name : '…')}</b>${d.host ? '<span class="on-tag gold">anfitrión</span>' : ''}${d.id === me ? '<span class="on-tag">tú</span>' : ''}
              <span class="on-via ${v[1]}">${v[0]}${d.id !== me && d.rtt ? ` · ${d.rtt} ms` : ''}</span></div>
            <div class="on-ps">${((d.info && d.info.players) || []).map(p => `<span class="on-p" style="--c:${esc(p.color)}"><i></i>${esc(p.name)}</span>`).join('')}</div></div>`; }).join('')}</div>
          <details class="on-me"><summary>Cambiar quién juega en este aparato</summary>${whoHTML()}</details>
        </div>
        <div class="panel" id="on-play"><div class="h2">${host ? '¿QUÉ JUGAMOS?' : 'LO QUE VIENE'}</div>${host ? hostPlayHTML(ps) : clientPlayHTML(connected)}</div>
        ${note ? `<div class="panel on-note">${esc(note)}</div>` : ''}
      </div></div>`;
    bindWho(root);
    $('#on-leave', root).onclick = () => { Net.leave(); note = ''; render(); };
    $('#on-copy', root).onclick = async () => { const u = linkFor(Net.code); try { await navigator.clipboard.writeText(u); note = 'Enlace copiado: ' + u; } catch (e) { note = u; } render(); };
    if ($('#on-share', root)) $('#on-share', root).onclick = () => navigator.share({ title: 'GameHub', text: `¡Juguemos en GameHub! Sala ${Net.code}`, url: linkFor(Net.code) }).catch(() => {});
    if (host) bindHostPlay(root);
  }
  // lo que el anfitrión puede lanzar: juego → modo, escenario y largo → ¡A jugar!
  let pick = null, pickEv = null, lastPick = null;
  const GAMES = () => (window.GAMEHUB ? GAMEHUB.GAMES : []);
  // los modos que ya van en línea (y que admiten tantos jugadores)
  const netModes = (g, n = players(Net.room).length) => g.modes.filter(m => (!g.net || !g.net.modes || g.net.modes.includes(m.id)) && !(g.net && g.net.max && g.net.max[m.id] < n));
  const mapsFor = (g, m) => (m && m.maps === 'arenas' ? g.arenas || [] : g.maps).filter(x => !(m && m.map) || x[0] === m.map);
  const lenTxt = (g, m, n) => (g.net && g.net.lenTxt && g.net.lenTxt[m.id] ? g.net.lenTxt[m.id](n) : m.lenTxt(n));
  function evText(g, ev) {
    if (!g || !ev) return ''; const m = g.modes.find(x => x.id === ev.mode), mp = (g.maps.concat(g.arenas || [])).find(x => x[0] === ev.map);
    return [g.name, m && m.name, mp ? mp[1] : 'escenario al azar', m && m.len && ev.len ? lenTxt(g, m, ev.len) : ''].filter(Boolean).join(' · ');
  }
  function hostPlayHTML(ps) {
    const gs = GAMES(), g = pick && gs.find(x => x.id === pick);
    const cards = `<div class="on-games">${gs.map(x => `<button class="on-game${x.id === pick ? ' sel' : ''}" data-ong="${x.id}" style="--c1:${x.c1};--c2:${x.c2}" ${ps.length < 2 ? 'disabled' : ''}><b>${esc(x.name)}</b><small>${x.net ? (x.net.watch ? `en línea · juegan ${x.net.seats}, los demás miran` : `en línea · hasta ${x.net.seats}`) : 'en línea · pronto'}</small></button>`).join('')}</div>`;
    if (!g) return `<p class="note">${ps.length < 2 ? 'Falta al menos un jugador más para jugar.' : `Con ${ps.length} jugadores: elige un juego.`}</p>${cards}`;
    const ms = netModes(g), m = ms.find(x => x.id === pickEv.mode) || ms[0], maps = mapsFor(g, m), seg = (k, items, v) => `<div class="seg" data-onseg="${k}">${items.map(([id, t]) => `<button data-v="${esc(id)}" aria-pressed="${String(id) === String(v)}">${esc(t)}</button>`).join('')}</div>`;
    const over = ps.length > g.net.seats ? `<p class="note warn">Este juego es de ${g.net.watch ? '' : 'hasta '}${g.net.seats}: juegan ${ps.slice(0, g.net.seats).map(p => esc(p.name)).join(' y ')}; ${g.net.watch ? 'los demás miran en vivo' : 'los demás esperan'}.</p>` : '';
    return `<p class="note">Con ${ps.length} jugadores.</p>${cards}
      <div class="on-cfg" style="--c1:${g.c1};--c2:${g.c2}">
        <div class="lbl">Modo</div>${seg('mode', ms.map(x => [x.id, x.name]), m.id)}<p class="on-desc">${esc((g.net.desc && g.net.desc[m.id]) || m.desc)}</p>
        ${maps.length > 1 ? `<div class="lbl">Escenario</div>${seg('map', [['', '🎲 Al azar']].concat(maps), pickEv.map || '')}` : ''}
        ${m.len ? `<div class="lbl">Largo</div>${seg('len', m.len.map(n => [n, lenTxt(g, m, n)]), pickEv.len || m.len[1] || m.len[0])}` : ''}
        ${over}<div class="row"><button class="btn gold big" id="on-go">¡A jugar!</button><button class="btn ghost" id="on-back">Otro juego</button></div>
      </div>`;
  }
  function bindHostPlay(root) {
    $$('[data-ong]', root).forEach(b => b.onclick = () => { const g = GAMES().find(x => x.id === b.dataset.ong); if (!g || !g.net) { note = 'Ese juego todavía no está listo para jugar en línea (en construcción).'; render(); return; }
      if (pick !== g.id) { pick = g.id; const m = netModes(g)[0]; pickEv = { mode: m.id, map: '', len: m.len ? m.len[1] || m.len[0] : 0 }; sendPick(); } note = ''; render(); });
    $$('[data-onseg]', root).forEach(sg => sg.querySelectorAll('button').forEach(b => b.onclick = () => { const k = sg.dataset.onseg, v = b.dataset.v; pickEv[k] = k === 'len' ? +v : v;
      if (k === 'mode') { const g = GAMES().find(x => x.id === pick), m = g.modes.find(x => x.id === v); if (!mapsFor(g, m).some(x => x[0] === pickEv.map)) pickEv.map = ''; if (m.len && !m.len.includes(pickEv.len)) pickEv.len = m.len[1] || m.len[0]; }
      sendPick(); render(); }));
    if ($('#on-go', root)) $('#on-go', root).onclick = () => { const g = GAMES().find(x => x.id === pick); if (!g) return; const m = g.modes.find(x => x.id === pickEv.mode), maps = mapsFor(g, m);
      const map = pickEv.map || (maps[Math.floor(Math.random() * maps.length)] || [])[0]; startGame(g, { mode: pickEv.mode, map, rounds: pickEv.len || 3, len: pickEv.len || 0 }); };
    if ($('#on-back', root)) $('#on-back', root).onclick = () => { pick = null; pickEv = null; sendPick(); render(); };
  }
  // los demás ven lo que el anfitrión está armando
  function sendPick() { Net.send('*', { $: 'pick', game: pick, ev: pickEv }, true); }
  // el anfitrión arranca una partida: puestos con los jugadores de la sala (en orden), y todos abren el juego
  function startGame(g, ev) {
    const ps = players(Net.room).slice(0, g.net.seats), sid = Math.random().toString(36).slice(2, 10);
    const seats = ps.map(p => ({ dev: p.dev, local: devLocal(p), name: p.name, color: p.color }));
    // que nadie se repita: colores (el siguiente libre de la paleta) y nombres (con número)
    const usedC = new Set(), usedN = {};
    for (const st of seats) {
      if (usedC.has(st.color) || !/^#[0-9a-f]{6}$/i.test(st.color || '')) st.color = COLORS.find(c => !usedC.has(c)) || st.color; usedC.add(st.color);
      const nm = String(st.name || 'Jugador').trim().slice(0, 16) || 'Jugador', k = (usedN[nm.toLowerCase()] || 0) + 1; usedN[nm.toLowerCase()] = k; st.name = k > 1 ? `${nm} ${k}` : nm;
    }
    ev = ev || { mode: g.net.mode || (g.modes[0] && g.modes[0].id), map: (g.maps[Math.floor(Math.random() * g.maps.length)] || [])[0], rounds: 3 };
    Net.send('*', { $: 'game', game: g.id, ev, seats, sid }, true);
    openNet(g.id, 'host', seats, ev, sid);
  }
  function devLocal(p) { const d = (Net.room.devices || []).find(x => x.id === p.dev); return d ? (d.info.players || []).findIndex(q => q.name === p.name && q.color === p.color) : 0; }
  function openNet(gid, role, seats, ev, sid) {
    const mine = seats.map((s, i) => (s.dev === Net.id ? i : -1)).filter(i => i >= 0).sort((a, b) => seats[a].local - seats[b].local);
    GAMEHUB.Launcher.open(gid, null, { role, seats, mine, ev, sid });
  }
  function clientPlayHTML(connected) {
    if (!connected) return '<p class="note">Conectando con el anfitrión…</p>';
    const g = lastPick && GAMES().find(x => x.id === lastPick.game);
    return g ? `<div class="on-next" style="--c1:${g.c1};--c2:${g.c2}"><span class="lbl">EL ANFITRIÓN PREPARA</span><b>${esc(evText(g, lastPick.ev).split(' · ')[0])}</b><small>${esc(evText(g, lastPick.ev).split(' · ').slice(1).join(' · '))}</small></div>` : '<p class="note">Esperando a que el anfitrión elija…</p>';
  }
  Net.on('msg', (from, m) => { if (m && m.$ === 'pick' && !Net.isHost && from === Net.hostId) { lastPick = m.game ? { game: String(m.game), ev: m.ev && typeof m.ev === 'object' ? { mode: String(m.ev.mode || ''), map: String(m.ev.map || ''), len: +m.ev.len || 0 } : {} } : null; if (visible()) render(); } });
  // al entrar alguien nuevo, el anfitrión le cuenta qué está armando
  Net.on('peers', () => { if (Net.isHost && pick) sendPick(); });
  // los remotos: el anfitrión arrancó una partida → abrirla aquí también
  Net.on('msg', (from, m) => { if (m && m.$ === 'game' && !Net.isHost && from === Net.hostId) openNet(m.game, 'client', m.seats, m.ev, m.sid); });
  let hostT = 0;
  function waitHost() { clearTimeout(hostT); hostT = setTimeout(() => { if (Net.alive && !Net.isHost && !Net.room) { note = 'No aparece el anfitrión. Revisa el código, o que su GameHub siga abierto en la sala.'; render(); } }, 15000); }
  Net.on('room', () => { if (visible()) render(); });
  Net.on('peers', () => { if (visible()) render(); });
  Net.on('status', s => { if (s.hostGone && Net.alive && !Net.isHost) { note = 'El anfitrión salió de la sala.'; Net.leave(); if (visible()) render(); } });
  // refrescar el ping de vez en cuando (sin tocar lo que se está escribiendo)
  setInterval(() => { if (visible() && Net.alive && !el().contains(document.activeElement && document.activeElement.tagName === 'INPUT' ? document.activeElement : null)) render(); }, 3000);
  return { render, get code0() { return code0; }, info, players: () => players(Net.room) };
})();
