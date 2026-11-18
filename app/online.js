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
        <div class="panel" id="on-play"><div class="h2">${host ? '¿QUÉ JUGAMOS?' : 'LO QUE VIENE'}</div>${host ? hostPlayHTML(ps) : `<p class="note">${connected ? 'Esperando a que el anfitrión elija…' : 'Conectando con el anfitrión…'}</p>`}</div>
        ${note ? `<div class="panel on-note">${esc(note)}</div>` : ''}
      </div></div>`;
    bindWho(root);
    $('#on-leave', root).onclick = () => { Net.leave(); note = ''; render(); };
    $('#on-copy', root).onclick = async () => { const u = linkFor(Net.code); try { await navigator.clipboard.writeText(u); note = 'Enlace copiado: ' + u; } catch (e) { note = u; } render(); };
    if ($('#on-share', root)) $('#on-share', root).onclick = () => navigator.share({ title: 'GameHub', text: `¡Juguemos en GameHub! Sala ${Net.code}`, url: linkFor(Net.code) }).catch(() => {});
    if (host) bindHostPlay(root);
  }
  // lo que el anfitrión puede lanzar (las partidas en línea llegan en las fases siguientes)
  function hostPlayHTML(ps) {
    return `<p class="note">${ps.length < 2 ? 'Falta al menos un jugador más para jugar.' : `Con ${ps.length} jugadores: una partida de un juego o un torneo con todos.`}</p>
      <div class="on-games">${(window.GAMEHUB ? GAMEHUB.GAMES : []).map(g => `<button class="on-game" data-ong="${g.id}" style="--c1:${g.c1};--c2:${g.c2}" ${ps.length < 2 ? 'disabled' : ''}><b>${esc(g.name)}</b><small>${g.net ? `en línea · hasta ${g.net.seats}` : 'en línea · pronto'}</small></button>`).join('')}</div>`;
  }
  function bindHostPlay(root) { $$('[data-ong]', root).forEach(b => b.onclick = () => { const g = GAMEHUB.GAMES.find(x => x.id === b.dataset.ong); if (!g || !g.net) { note = 'Ese juego todavía no está listo para jugar en línea (en construcción).'; render(); return; } startGame(g); }); }
  // el anfitrión arranca una partida: puestos con los jugadores de la sala (en orden), y todos abren el juego
  function startGame(g, ev) {
    const ps = players(Net.room).slice(0, g.net.seats), sid = Math.random().toString(36).slice(2, 10);
    const seats = ps.map(p => ({ dev: p.dev, local: devLocal(p), name: p.name, color: p.color }));
    ev = ev || { mode: g.net.mode || (g.modes[0] && g.modes[0].id), map: (g.maps[Math.floor(Math.random() * g.maps.length)] || {}).id, rounds: 3 };
    Net.send('*', { $: 'game', game: g.id, ev, seats, sid }, true);
    openNet(g.id, 'host', seats, ev, sid);
  }
  function devLocal(p) { const d = (Net.room.devices || []).find(x => x.id === p.dev); return d ? (d.info.players || []).findIndex(q => q.name === p.name && q.color === p.color) : 0; }
  function openNet(gid, role, seats, ev, sid) {
    const mine = seats.map((s, i) => (s.dev === Net.id ? i : -1)).filter(i => i >= 0).sort((a, b) => seats[a].local - seats[b].local);
    GAMEHUB.Launcher.open(gid, null, { role, seats, mine, ev, sid });
  }
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
