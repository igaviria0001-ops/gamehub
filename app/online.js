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
  const myBuild = () => window.__ghBuild || {};
  const info = () => ({ name: myPlayers().map(p => p.name).join(' y '), players: myPlayers(), dev: touch ? 'cel' : 'pc', v: myBuild().v, vd: myBuild().date });
  // ¿algún aparato tiene otra versión de GameHub? (los modos nuevos necesitan la misma en todos)
  const oldDev = d => { const mv = myBuild().v; return !!(d && d.info && d.info.v && mv && mv !== 'dev' && d.info.v !== 'dev' && d.info.v !== mv); };
  function verNote(devs) { const bad = (devs || []).filter(oldDev); if (!bad.length) return '';
    const mine = myBuild().date || '', older = bad.filter(d => (d.info.vd || '') < mine).map(d => esc(d.info.name || 'un aparato')), newer = bad.some(d => (d.info.vd || '') > mine);
    const what = older.length || newer ? (older.length ? older.join(' y ') + (older.length > 1 ? ' tienen' : ' tiene') + ' una versión vieja de GameHub' : '') + (older.length && newer ? '; y ' : '') + (newer ? 'este aparato tiene una versión más vieja que la de otro' : '') : 'Hay aparatos con versiones distintas de GameHub';
    return `<div class="on-warn">⚠ ${what}. Abran GameHub con internet y toquen «Actualizar» (o ciérrenlo y vuelvan a abrirlo) antes de jugar, para que todo salga igual en todos.</div>`; }
  const VIA = { local: ['este aparato', 'ok'], p2p: ['directo', 'ok'], turn: ['por TURN', 'mid'], srv: ['por tu servidor', 'ok'], relay: ['por relevo · lento', 'bad'], conectando: ['conectando…', 'mid'] };
  const DEV = { cel: '📱', pc: '💻' };
  const sig = ms => ms <= 0 ? '' : ms < 60 ? 'ok' : ms < 140 ? 'mid' : 'bad';
  function linkFor(code) { const u = new URL(location.href); u.search = ''; u.hash = 'online'; u.searchParams.set('sala', code); if (params.get('net')) u.searchParams.set('net', params.get('net')); return u.toString(); }
  // Mientras estás en una sala, la dirección de la página ES el enlace de invitación. Así el navegador ya tiene guardado el ícono
  // de GameHub para ese enlace exacto y, al compartirlo, no busca «otra página del mismo sitio» (las apps de Ignacio comparten
  // igaviria0001-ops.github.io y Chrome tomaba el ícono del cubo de Rubik). También sirve para volver a la sala si recargas.
  function syncUrl() {
    if (!Net.alive || !Net.code) return;
    try { const w = new URL(linkFor(Net.code)); w.hash = location.hash || '#online'; if (w.toString() !== location.href) history.replaceState(history.state, '', w.toString()); } catch (e) { /* nada */ }
  }
  function clearUrl() { try { const u = new URL(location.href); if (u.searchParams.has('sala')) { u.searchParams.delete('sala'); history.replaceState(history.state, '', u.toString()); } } catch (e) { /* nada */ } }
  // todos los jugadores de la sala, en orden; colores y nombres sin repetir (el que llegó después cede)
  function players(room) {
    const out = [], usedC = new Set(), usedN = {};
    for (const d of (room && room.devices) || []) for (const [li, p0] of ((d.info && d.info.players) || []).entries()) {
      const p = Object.assign({ dev: d.id, devName: d.info.name, kind: d.info.dev, li, name0: p0.name, color0: p0.color }, p0);
      if (usedC.has(p.color) || !/^#[0-9a-f]{6}$/i.test(p.color || '')) p.color = COLORS.find(c => !usedC.has(c)) || p.color; usedC.add(p.color);
      const nm = String(p.name || 'Jugador').trim().slice(0, 16) || 'Jugador', k = (usedN[nm.toLowerCase()] || 0) + 1; usedN[nm.toLowerCase()] = k; p.name = k > 1 ? `${nm} ${k}` : nm;
      out.push(p);
    }
    return out;
  }

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
          ${previewHTML()}
          ${resumeHTML()}
          ${note ? `<div class="panel on-note">${esc(note)}</div>` : ''}
        </div></div>`;
      bindWho(root); bindResume(root);
      $('#on-host', root).onclick = async () => { busy = true; note = ''; render(); try { await Net.host(info()); keepAwake(); } catch (e) { note = 'No se pudo crear la sala: ' + e.message; } busy = false; render(); };
      const join = async () => { const c = $('#on-code', root).value.toUpperCase().replace(/[^A-Z0-9]/g, ''); if (c.length < 5) { note = 'El código tiene 5 letras o números.'; render(); return; } busy = true; note = ''; render(); try { await Net.join(c, info()); waitHost(); keepAwake(); } catch (e) { note = 'No se pudo entrar: ' + e.message; } busy = false; render(); };
      $('#on-join', root).onclick = join; $('#on-code', root).onkeydown = e => { if (e.key === 'Enter') join(); };
      return;
    }
    syncUrl();
    const devs = (R && R.devices) || [], ps = players(R), me = Net.id, host = Net.isHost;
    const hostPeer = !host && Net.peers.get(Net.hostId), myRtt = hostPeer ? Math.round(hostPeer.rtt) : 0, connected = host || (hostPeer && hostPeer.open);
    root.innerHTML = `<div class="wrap" style="max-width:920px"><div class="thead"><div><h1 class="h1">Sala en línea</h1><p class="sub">${host ? 'Eres el anfitrión: aquí corren las partidas. Pásales el código o el enlace a los demás y deja esta pantalla abierta mientras juegan.' : connected ? (hostAway ? 'El anfitrión salió de la app un momento: todo sigue cuando vuelva.' : 'Estás dentro. El anfitrión elige qué jugar.') : 'Buscando al anfitrión…'}</p></div><button class="btn small danger" id="on-leave">Salir de la sala</button></div>
      <div class="stack">
        <div class="panel on-room">
          <div class="on-codebox"><span class="lbl">CÓDIGO</span><b class="on-big">${esc(Net.code)}</b>
            <div class="row"><button class="btn small" id="on-copy">Copiar enlace</button>${navigator.share ? '<button class="btn small ghost" id="on-share">Compartir</button>' : ''}</div></div>
          <div class="on-sum"><b>${ps.length}</b> jugador${ps.length === 1 ? '' : 'es'} en <b>${devs.length}</b> aparato${devs.length === 1 ? '' : 's'}${!host && connected ? ` · tu ping <span class="on-ping ${sig(myRtt)}">${myRtt} ms</span>` : ''}${Net.signalReady ? '' : ' · <span class="on-ping mid">buscando la red…</span>'}</div>
        </div>
        <div class="on-react" role="group" aria-label="Reacciones rápidas">${REACT.map(e => `<button class="on-rx" data-rx="${e}" aria-label="Enviar ${e}">${e}</button>`).join('')}</div>
        <div class="panel"><div class="h2">APARATOS Y JUGADORES</div>
          <div class="on-devs">${devs.map(d => { const hp = d.host && !host ? hostPeer : null; if (hp) d = Object.assign({}, d, { via: hp.via === 'relay' && Net.serverReady ? 'srv' : hp.via, rtt: Math.round(hp.rtt) }); const v = VIA[d.id === me ? 'local' : d.via] || VIA.conectando; return `<div class="on-dev${d.id === me ? ' me' : ''}">
            <div class="on-dh"><span class="on-di">${DEV[d.info && d.info.dev] || '🎮'}</span><b>${esc(d.info ? d.info.name : '…')}</b>${d.host ? '<span class="on-tag gold">anfitrión</span>' : ''}${d.id === me ? '<span class="on-tag">tú</span>' : ''}${d.id !== me && oldDev(d) ? '<span class="on-tag warn">otra versión</span>' : ''}
              <span class="on-via ${v[1]}">${v[0]}${d.id !== me && d.rtt ? ` · ${d.rtt} ms` : ''}</span></div>
            <div class="on-ps">${ps.filter(p => p.dev === d.id).map(p => `<span class="on-p" style="--c:${esc(p.color)}"><i></i>${esc(p.name)}</span>`).join('')}</div></div>`; }).join('')}</div>
          <details class="on-me"><summary>Cambiar quién juega en este aparato</summary>${whoHTML()}</details>
        </div>
        ${tourPanel(host)}
        <div class="panel" id="on-play"><div class="h2">${host ? '¿QUÉ JUGAMOS?' : 'LO QUE VIENE'}</div>${verNote(devs)}${host ? hostPlayHTML(ps) : clientPlayHTML(connected)}</div>
        ${note ? `<div class="panel on-note">${esc(note)}</div>` : ''}
      </div></div>`;
    bindWho(root);
    $('#on-leave', root).onclick = () => { Net.leave(); clearUrl(); note = ''; hostAway = false; render(); };
    $('#on-copy', root).onclick = async () => { const u = linkFor(Net.code); try { await navigator.clipboard.writeText(u); note = 'Enlace copiado: ' + u; } catch (e) { note = u; } render(); };
    if ($('#on-share', root)) $('#on-share', root).onclick = () => { syncUrl(); navigator.share({ title: 'GameHub · Sala ' + Net.code, text: `¡Juguemos en GameHub! Sala ${Net.code}`, url: linkFor(Net.code) }).catch(() => {}); };
    if (host) bindHostPlay(root);
    bindResume(root); bindReact(root);
  }
  // lo que el anfitrión puede lanzar: juego → modo, escenario y largo → ¡A jugar!
  let pick = null, pickEv = null, lastPick = null;
  const GAMES = () => (window.GAMEHUB ? GAMEHUB.GAMES : []);
  // los modos que ya van en línea (y que admiten tantos jugadores)
  const netModes = (g, n = players(Net.room).length) => g.modes.filter(m => (!g.net || !g.net.modes || g.net.modes.includes(m.id)) && !(g.net && g.net.max && g.net.max[m.id] < n)).concat((g.net && g.net.extra) || []);
  // opciones de sí/no que también van en línea (Modo Fiesta…)
  const netOpts = g => (g.opts || []).filter(o => o.type === 'bool' && g.net && (g.net.opts || []).includes(o.id));
  const allModes = g => g.modes.concat((g.net && g.net.extra) || []);
  const mapsFor = (g, m) => (m && Array.isArray(m.maps) ? m.maps : m && m.maps === 'arenas' ? g.arenas || [] : g.maps).filter(x => !(m && m.map) || x[0] === m.map);
  const lenTxt = (g, m, n) => (g.net && g.net.lenTxt && g.net.lenTxt[m.id] ? g.net.lenTxt[m.id](n) : m.lenTxt(n));

  // foto del juego para el escenario escogido (si hay), o la primera
  const shotFor = (g, map) => { const pre = (g.shots[0] || '').split('-')[0], k = g.shots.find(x => x === pre + '-' + map); return 'assets/shots/' + (k || g.shots[0]) + '.jpg'; };
  const logo = g => (GAMEHUB.glogo ? GAMEHUB.glogo(g) : `<h2 class="glogo">${esc(g.name)}</h2>`);
  const CHARS = [['pick', 'Cada quien elige'], ['random', 'Al azar']];
  const seatsOf = (g, m) => (m && m.seats) || g.net.seats;
  const watchOf = (g, m) => !!((m && m.watch) || g.net.watch);
  // quiénes juegan y quiénes miran (en orden de la sala)
  function whoPlays(g, m, ps) { const n = seatsOf(g, m); return { play: ps.slice(0, n), rest: ps.slice(n), watch: watchOf(g, m) }; }
  const pchips = L => L.map(p => `<span class="on-p" style="--c:${esc(p.color)}"><i></i>${esc(p.name)}</span>`).join('');
  function modeCard(g, x, sel, n) {
    const nS = seatsOf(g, x), w = watchOf(g, x), camp = Array.isArray(x.maps) && !x.maps.length;
    const meta = [nS === 2 ? (w && n > 2 ? '👥 juegan 2' : '👥 2') : `👥 2 a ${nS}`, x.mins ? `⏱ ~${x.mins} min` : '', camp ? '🗺️ eligen el nivel' : x.map ? '📍 cancha fija' : ''].filter(Boolean);
    return `<button class="on-mode" data-onmode="${esc(x.id)}" aria-pressed="${sel}"><b>${esc(x.name)}</b><span>${esc((g.net.desc && g.net.desc[x.id]) || x.desc)}</span><small>${meta.map(t => `<em>${t}</em>`).join('')}</small></button>`;
  }
  function hostPlayHTML(ps) {
    const gs = GAMES(), g = pick && gs.find(x => x.id === pick);
    const cards = `<div class="on-games${g ? ' has-sel' : ''}">${gs.map(x => `<button class="on-game${x.id === pick ? ' sel' : ''}" data-ong="${x.id}" style="${GAMEHUB.gvars ? GAMEHUB.gvars(x) : ''}" ${ps.length < 2 || !x.net ? 'disabled' : ''} aria-pressed="${x.id === pick}">
        <img src="assets/shots/${x.shots[0]}.jpg" alt="" loading="lazy" decoding="async"><span class="sh"></span>
        <span class="tx"><span class="num">${x.num} · ${esc(x.kind)}</span>${logo(x)}<small>${x.net ? (x.net.watch ? `juegan ${x.net.seats} · los demás miran` : `de 2 a ${x.net.seats}`) : 'pronto'}</small></span></button>`).join('')}</div>`;
    const T = GAMEHUB.Tour.T, tourOn = T && T.online && !T.done;
    const tourBtn = ps.length >= 2 ? `<div class="tbanner on-tb" id="on-tour" role="button" tabindex="0"><span class="cup">🏆</span><div><b>${tourOn ? 'Seguir el torneo' : 'Torneo con todos'}</b><p>Liga, eliminatoria, rey de la pista… con los ${ps.length} de la sala y los 4 juegos.</p></div><span class="btn small">${tourOn ? 'Seguir' : 'Armar uno'} ›</span></div>` : '';
    if (!g) return `<p class="note">${ps.length < 2 ? 'Falta al menos un jugador más para jugar: pásales el código.' : `Son ${ps.length}. Escoge un juego (o arma un torneo).`}</p>${cards}${tourBtn}`;
    const ms = netModes(g), m = ms.find(x => x.id === pickEv.mode) || ms[0], maps = mapsFor(g, m), camp = Array.isArray(m.maps) && !m.maps.length;
    if (pickEv.mode !== m.id) { pickEv.mode = m.id; if (!maps.some(x => x[0] === pickEv.map)) pickEv.map = ''; if (m.len && !m.len.includes(pickEv.len)) pickEv.len = m.len[1] || m.len[0]; } // (ese modo ya no cabe con tantos jugadores)
    const seg = (k, items, v) => `<div class="seg" data-onseg="${k}">${items.map(([id, t]) => `<button data-v="${esc(id)}" aria-pressed="${String(id) === String(v)}">${esc(t)}</button>`).join('')}</div>`;
    const vs = ms.filter(x => !x.coop), co = ms.filter(x => x.coop), W = whoPlays(g, m, ps), pn = g.net.pick;
    const curMap = maps.find(x => x[0] === pickEv.map);
    const opts = (m.noOpts ? [] : netOpts(g)).map(o => `<div class="on-f"><span class="lbl">${esc(o.name)}</span>${seg('opt:' + o.id, [['0', 'No'], ['1', 'Sí']], pickEv.opts && pickEv.opts[o.id] ? '1' : '0')}<span class="hint">${esc(o.desc[0].toUpperCase() + o.desc.slice(1))}.</span></div>`).join('');
    const sum = [m.name, camp ? 'nivel en el mapa' : maps.length > 1 ? (curMap ? curMap[1] : 'escenario al azar') : maps[0] ? maps[0][1] : '', m.len ? lenTxt(g, m, pickEv.len || m.len[1] || m.len[0]) : '', pn ? `${pn[1]}: ${pickEv.chars === 'random' ? 'al azar' : 'cada quien elige'}` : ''].filter(Boolean).join(' · ');
    return `${cards}
      <div class="on-cfg" style="${GAMEHUB.gvars ? GAMEHUB.gvars(g) : ''}">
        <div class="on-hero"><img src="${shotFor(g, pickEv.map)}" alt=""><span class="sh"></span><div class="tx"><span class="num">${g.num} · ${esc(g.tag)}</span>${logo(g)}</div><button class="btn small ghost" id="on-back">Otro juego</button></div>
        <div class="on-sec"><span class="lbl">Uno contra otro</span><div class="on-modes">${vs.map(x => modeCard(g, x, x.id === m.id, ps.length)).join('')}</div></div>
        ${co.length ? `<div class="on-sec"><span class="lbl">En equipo · todos juntos</span><div class="on-modes">${co.map(x => modeCard(g, x, x.id === m.id, ps.length)).join('')}</div></div>` : ''}
        ${camp ? `<div class="on-camp">🗺️ <span>Al entrar se abre el mapa de ${esc(m.name.toLowerCase())}: el anfitrión escoge el nivel entre los que tiene abiertos, y lo que ganen queda guardado en el aparato de cada uno.</span></div>` : ''}
        ${!camp && maps.length > 1 ? `<div class="on-sec"><span class="lbl">Escenario</span><div class="chips">${[['', '🎲 Al azar']].concat(maps).map(([id, t]) => `<button class="chipbtn" data-onmap="${esc(id)}" aria-pressed="${(pickEv.map || '') === id}">${esc(t)}</button>`).join('')}</div></div>` : ''}
        <div class="on-row">
          ${m.len ? `<div class="on-f"><span class="lbl">Largo</span>${seg('len', m.len.map(n => [n, lenTxt(g, m, n)]), pickEv.len || m.len[1] || m.len[0])}</div>` : ''}
          ${pn ? `<div class="on-f"><span class="lbl">${esc(pn[1][0].toUpperCase() + pn[1].slice(1))}</span>${seg('chars', CHARS, pickEv.chars || 'pick')}<span class="hint">${pickEv.chars === 'random' ? `A cada uno le toca un ${esc(pn[0])} al azar, sin repetir.` : `Antes de empezar, cada uno escoge su ${esc(pn[0])} (20 s); arranca apenas todos confirman.`}</span></div>` : ''}
          ${opts}
        </div>
        <div class="on-who"><span class="lbl">Juegan</span>${pchips(W.play)}${W.rest.length ? `<span class="lbl">${W.watch ? 'Miran en vivo' : 'Esperan'}</span>${pchips(W.rest)}` : ''}</div>
        <div class="on-go"><div><b>${esc(g.name)}</b><small>${esc(sum)}</small></div><button class="btn gold big" id="on-go">¡A jugar!</button></div>
      </div>`;
  }
  function bindHostPlay(root) {
    const tb = $('#on-tour', root); if (tb) { const go = () => { const T = GAMEHUB.Tour.T; if (T && T.online && !T.done) GAMEHUB.go('torneo'); else GAMEHUB.onlineTour(players(Net.room)); }; tb.onclick = go; tb.onkeydown = e => { if (e.key === 'Enter') go(); }; }
    const click = () => { try { GAMEHUB.Snd.click(); } catch (e) { /* nada */ } };
    $$('[data-ong]', root).forEach(b => b.onclick = () => { const g = GAMES().find(x => x.id === b.dataset.ong); if (!g || !g.net) { note = 'Ese juego todavía no está listo para jugar en línea (en construcción).'; render(); return; }
      click(); if (pick !== g.id) { pick = g.id; const m = netModes(g)[0]; pickEv = { mode: m.id, map: '', len: m.len ? m.len[1] || m.len[0] : 0, chars: (pickEv && pickEv.chars) || 'pick' }; sendPick(); } note = ''; render();
      requestAnimationFrame(() => { const c = $('.on-cfg', root); if (c && c.getBoundingClientRect().top > innerHeight * 0.6) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); });
    $$('[data-onmode]', root).forEach(b => b.onclick = () => { const g = GAMES().find(x => x.id === pick), m = allModes(g).find(x => x.id === b.dataset.onmode); if (!m) return; click(); pickEv.mode = m.id;
      if (!mapsFor(g, m).some(x => x[0] === pickEv.map)) pickEv.map = ''; if (m.len && !m.len.includes(pickEv.len)) pickEv.len = m.len[1] || m.len[0]; sendPick(); render(); });
    $$('[data-onmap]', root).forEach(b => b.onclick = () => { click(); pickEv.map = b.dataset.onmap; sendPick(); render(); });
    $$('[data-onseg]', root).forEach(sg => sg.querySelectorAll('button').forEach(b => b.onclick = () => { const k = sg.dataset.onseg, v = b.dataset.v; click(); if (k.startsWith('opt:')) { pickEv.opts = Object.assign({}, pickEv.opts, { [k.slice(4)]: v === '1' }); sendPick(); render(); return; } pickEv[k] = k === 'len' ? +v : v; sendPick(); render(); }));
    if ($('#on-go', root)) $('#on-go', root).onclick = () => { const g = GAMES().find(x => x.id === pick); if (!g) return; const m = allModes(g).find(x => x.id === pickEv.mode), maps = mapsFor(g, m);
      const map = pickEv.map || (maps[Math.floor(Math.random() * maps.length)] || [])[0]; startGame(g, { mode: pickEv.mode, map, rounds: pickEv.len || 3, len: pickEv.len || 0, opts: Object.assign({}, pickEv.opts), chars: g.net.pick ? pickEv.chars || 'pick' : undefined }); };
    if ($('#on-back', root)) $('#on-back', root).onclick = () => { click(); pick = null; pickEv = null; sendPick(); render(); };
  }
  // los demás ven lo que el anfitrión está armando
  function sendPick() { Net.send('*', { $: 'pick', game: pick, ev: pickEv }, true); if (pick) GAMEHUB.Launcher.preload(pick); }
  // el anfitrión arranca una partida: puestos con los jugadores de la sala (en orden), y todos abren el juego
  function startGame(g, ev, only, tour) {
    const M = allModes(g).find(m => ev && m.id === ev.mode), ps = (only || players(Net.room)).slice(0, (M && M.seats) || g.net.seats), sid = Math.random().toString(36).slice(2, 10);
    const seats = ps.map(p => ({ dev: p.dev, local: devLocal(p), name: p.name, color: p.color }));
    // que nadie se repita: colores (el siguiente libre de la paleta) y nombres (con número)
    const usedC = new Set(), usedN = {};
    for (const st of seats) {
      if (usedC.has(st.color) || !/^#[0-9a-f]{6}$/i.test(st.color || '')) st.color = COLORS.find(c => !usedC.has(c)) || st.color; usedC.add(st.color);
      const nm = String(st.name || 'Jugador').trim().slice(0, 16) || 'Jugador', k = (usedN[nm.toLowerCase()] || 0) + 1; usedN[nm.toLowerCase()] = k; st.name = k > 1 ? `${nm} ${k}` : nm;
    }
    ev = ev || { mode: g.net.mode || (g.modes[0] && g.modes[0].id), map: (g.maps[Math.floor(Math.random() * g.maps.length)] || [])[0], rounds: 3 };
    Net.send('*', { $: 'game', game: g.id, ev, seats, sid, tour: tour || null }, true);
    openNet(g.id, 'host', seats, ev, sid, tour);
    Net.setPlay({ game: g.id, ev, seats, sid, tour: tour || null });
  }
  /* ---------- reacciones rápidas (emojis que salen flotando en todos los aparatos de la sala) ---------- */
  const REACT = ['👋', '😂', '🔥', '😱', '👏', '🏆', '😎', '🙏'];
  let rxT = 0;
  function bubble(e, who) {
    const host = document.body; if (!REACT.includes(e)) return;
    const b = document.createElement('div'); b.className = 'on-bubble'; b.style.left = (12 + Math.random() * 70) + '%';
    b.innerHTML = `<span>${e}</span><small></small>`; b.querySelector('small').textContent = String(who || '').slice(0, 16);
    host.appendChild(b); setTimeout(() => b.remove(), 2600);
  }
  function bindReact(root) {
    $$('[data-rx]', root).forEach(btn => btn.onclick = () => { if (Date.now() - rxT < 400) return; rxT = Date.now(); const e = btn.dataset.rx, who = (st.players[0] && st.players[0].name) || 'Alguien'; bubble(e, who); if (Net.alive) Net.send('*', { $: 'rx', e, who }, true); });
  }
  Net.on('msg', (from, m) => { if (!m || m.$ !== 'rx' || typeof m.e !== 'string' || m.via === Net.id) return; if (visible()) bubble(m.e, typeof m.who === 'string' ? m.who : ''); if (Net.isHost) Net.send('*', { $: 'rx', e: m.e, who: m.who, via: from }, true); });

  /* ---------- torneo en línea ---------- */
  let tourNet = (() => { try { return JSON.parse(localStorage.getItem('gamehub_tourNet') || 'null'); } catch (e) { return null; } })();
  const saveTourNet = T => { tourNet = T; try { localStorage.setItem('gamehub_tourNet', JSON.stringify(T)); } catch (e) { /* nada */ } };
  // el anfitrión: cada cambio del torneo viaja a todos (y al que entra)
  setTimeout(() => { if (window.GAMEHUB) GAMEHUB.App.onTour = T => { if (Net.alive && Net.isHost) Net.send('*', { $: 'tour', T }, true); }; }, 0); // app.js arma GAMEHUB después
  Net.on('peers', () => { const T = GAMEHUB.Tour.T; if (Net.isHost && T && T.online) Net.send('*', { $: 'tour', T }, true); });
  Net.on('msg', (from, m) => {
    if (!m || m.$ !== 'tour' || Net.isHost || from !== Net.hostId || !m.T || typeof m.T !== 'object' || !Array.isArray(m.T.players)) return;
    saveTourNet(m.T); if (m.T.done) GAMEHUB.fameAdd(m.T); if (visible()) render();
  });
  function tourPanel(host) {
    if (host && !(GAMEHUB.Tour.T && GAMEHUB.Tour.T.online) && tourNet && tourNet.online && !tourNet.done) return `<div class="panel"><div class="h2">TORNEO EN LÍNEA A MEDIAS</div><p class="note">«${esc(tourNet.name)}» va en la prueba ${tourNet.events.filter(e => e.status === 'done').length + 1}. Como ahora eres el anfitrión, lo puedes seguir aquí con todos.</p><div class="row"><button class="btn gold" id="on-tourtake">Seguir el torneo</button></div></div>`;
    const T = host ? GAMEHUB.Tour.T : tourNet; if (!T || !T.online || (T.done && Date.now() - (T.ended || 0) > 6 * 3600e3)) return '';
    return `<div class="panel"><div class="h2">TORNEO EN LÍNEA</div>${GAMEHUB.tourHTML(T)}${host ? '<div class="row" style="margin-top:10px"><button class="btn small" id="on-tourgo">Abrir el tablero del torneo ›</button></div>' : '<p class="note">El anfitrión lanza cada prueba; quienes no juegan la miran en vivo.</p>'}</div>`;
  }
  // dentro de una vista previa (como el artefacto de Claude) el navegador no deja conectar aparatos: se avisa dónde sí
  function previewHTML() {
    let hosted = true; try { hosted = GAMEHUB.App.state().hosted; } catch (e) { /* nada */ }
    if (hosted && typeof RTCPeerConnection !== 'undefined') return '';
    const url = 'https://igaviria0001-ops.github.io/gamehub/';
    return `<div class="panel on-note"><b>Para jugar en línea, abre GameHub desde su dirección:</b> <a href="${url}" target="_blank" rel="noopener">igaviria0001-ops.github.io/gamehub</a> (o desde la app instalada). Aquí, dentro de la vista previa, el navegador no deja conectar aparatos.</div>`;
  }
  // si el anfitrión se cayó a mitad de torneo, cualquiera lo puede seguir desde su copia
  function resumeHTML() { const T = tourNet; if (!T || !T.online || T.done) return ''; return `<div class="panel"><div class="h2">TORNEO A MEDIAS</div><p class="note">«${esc(T.name)}» quedó a medias (${T.events.filter(e => e.status === 'done').length} pruebas jugadas). Si el anfitrión no vuelve, síguelo tú: creas una sala nueva y los demás entran con el código.</p><div class="row"><button class="btn gold" id="on-resume">Seguir el torneo como anfitrión</button><button class="btn small ghost" id="on-forget">Olvidarlo</button></div></div>`; }
  function bindResume(root) {
    if ($('#on-resume', root)) $('#on-resume', root).onclick = async () => { const T = tourNet; GAMEHUB.Tour.T = T; GAMEHUB.Tour.save(); try { await Net.host(info()); } catch (e) { note = 'No se pudo crear la sala: ' + e.message; } render(); };
    if ($('#on-forget', root)) $('#on-forget', root).onclick = () => { saveTourNet(null); render(); };
    if ($('#on-tourgo', root)) $('#on-tourgo', root).onclick = () => GAMEHUB.go('torneo');
    if ($('#on-tourtake', root)) $('#on-tourtake', root).onclick = () => { const L = GAMEHUB.Tour.T; const take = () => { GAMEHUB.Tour.T = tourNet; GAMEHUB.Tour.save(); GAMEHUB.go('torneo'); }; if (L && !L.done) GAMEHUB.confirm('¿Cambiar de torneo?', 'En este aparato hay otro torneo sin terminar; si sigues el de la sala, ese se pierde.', 'Sí, seguir el de la sala', take); else take(); };
  }
  // el anfitrión lanza una prueba del torneo: juegan los dos de la prueba (buscados por nombre en la sala); los demás miran
  function playTour(T, ev) {
    if (!Net.alive || !Net.isHost) return 'Para jugar el torneo en línea, primero crea la sala (En línea).';
    const g = GAMEHUB.GAMES.find(x => x.id === ev.game); if (!g || !g.net) return 'Ese juego todavía no va en línea.';
    const ps = players(Net.room), byName = id => { const p = T.players.find(x => x.id === id); return p && ps.find(q => q.name.trim().toLowerCase() === p.name.trim().toLowerCase()); };
    const a = byName(ev.j1), b = byName(ev.j2); if (!a || !b) return `Falta en la sala: ${[!a && ev.j1, !b && ev.j2].filter(Boolean).map(id => (T.players.find(x => x.id === id) || {}).name).join(' y ')}.`;
    const nm = id => (T.players.find(x => x.id === id) || {}).name;
    startGame(g, { mode: ev.mode, map: ev.map, rounds: ev.rounds || 3, len: ev.rounds || 0, tour: true, chars: ev.chars || T.rules.chars || 'pick', opts: ev.opts }, [a, b], { id: ev.id, n: ev.n, j1: ev.j1, j2: ev.j2, title: `Prueba ${ev.n}: ${nm(ev.j1)} contra ${nm(ev.j2)}` });
    return '';
  }
  function devLocal(p) { if (typeof p.li === 'number') return p.li; const d = (Net.room.devices || []).find(x => x.id === p.dev); return d ? Math.max(0, (d.info.players || []).findIndex(q => q.name === p.name)) : 0; }
  function openNet(gid, role, seats, ev, sid, tour) {
    const mine = seats.map((s, i) => (s.dev === Net.id ? i : -1)).filter(i => i >= 0).sort((a, b) => seats[a].local - seats[b].local);
    GAMEHUB.Launcher.open(gid, null, { role, seats, mine, ev, sid, tour: tour && typeof tour === 'object' ? { id: String(tour.id), n: +tour.n || 0, j1: String(tour.j1), j2: String(tour.j2), title: String(tour.title || '').slice(0, 80) } : null });
  }
  function clientPlayHTML(connected) {
    if (!connected) return '<p class="note">Conectando con el anfitrión…</p>';
    const g = lastPick && GAMES().find(x => x.id === lastPick.game);
    if (!g) return '<div class="on-idle"><span class="sp"></span><p class="note">El anfitrión está escogiendo el juego…</p></div>';
    const ev = lastPick.ev || {}, m = allModes(g).find(x => x.id === ev.mode), maps = m ? mapsFor(g, m) : [], camp = m && Array.isArray(m.maps) && !m.maps.length, mp = maps.find(x => x[0] === ev.map), pn = g.net && g.net.pick;
    const W = m ? whoPlays(g, m, players(Net.room)) : null, me = W && W.play.some(p => p.dev === Net.id);
    const bits = [camp ? 'el nivel se escoge en el mapa' : maps.length > 1 ? (mp ? mp[1] : 'escenario al azar') : maps[0] ? maps[0][1] : '', m && m.len && ev.len ? lenTxt(g, m, ev.len) : '', pn ? `${pn[1]}: ${ev.chars === 'random' ? 'al azar' : 'cada quien elige'}` : '', ...netOpts(g).filter(o => ev.opts && ev.opts[o.id]).map(o => o.name)].filter(Boolean);
    return `<div class="on-cfg on-peek" style="${GAMEHUB.gvars ? GAMEHUB.gvars(g) : ''}">
      <div class="on-hero"><img src="${shotFor(g, ev.map)}" alt=""><span class="sh"></span><div class="tx"><span class="num">EL ANFITRIÓN PREPARA</span>${logo(g)}</div></div>
      ${m ? `<div class="on-pm"><b>${esc(m.name)}</b><span>${esc((g.net.desc && g.net.desc[m.id]) || m.desc)}</span>${bits.length ? `<div class="chips">${bits.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}</div>` : ''}
      ${W ? `<div class="on-who"><span class="lbl">Juegan</span>${pchips(W.play)}${W.rest.length ? `<span class="lbl">${W.watch ? 'Miran en vivo' : 'Esperan'}</span>${pchips(W.rest)}` : ''}</div>` : ''}
      <p class="note on-pn">${me ? (pn && ev.chars !== 'random' ? `Cuando el anfitrión dé «¡A jugar!», escoges tu ${esc(pn[0])}.` : 'Cuando el anfitrión dé «¡A jugar!», arranca aquí solo.') : 'Esta vez te toca mirar: la partida se abre aquí en vivo.'}</p>
    </div>`;
  }
  Net.on('msg', (from, m) => { if (m && m.$ === 'pick' && !Net.isHost && from === Net.hostId) { lastPick = m.game ? { game: String(m.game), ev: m.ev && typeof m.ev === 'object' ? { mode: String(m.ev.mode || ''), map: String(m.ev.map || ''), len: +m.ev.len || 0, chars: m.ev.chars === 'random' ? 'random' : 'pick', opts: m.ev.opts && typeof m.ev.opts === 'object' ? Object.fromEntries(Object.entries(m.ev.opts).filter(([k, v]) => /^\w{1,20}$/.test(k) && typeof v === 'boolean')) : {} } : {} } : null; if (lastPick && lastPick.game) GAMEHUB.Launcher.preload(lastPick.game); if (visible()) render(); } });
  // al entrar alguien nuevo, el anfitrión le cuenta qué está armando
  Net.on('peers', () => { if (Net.isHost && pick) sendPick(); });
  // los remotos: el anfitrión arrancó una partida → abrirla aquí también
  Net.on('msg', (from, m) => { if (m && m.$ === 'game' && !Net.isHost && from === Net.hostId) joinPlay(m); });
  // el remoto sigue lo que dice la sala: si el anfitrión está en una partida y aquí no (se perdió el aviso en un bache de
  // la red), entra; si el anfitrión ya volvió a la sala y aquí sigue la partida vieja, sale. Lo que uno dejó a propósito
  // (botón de volver) no se le vuelve a abrir.
  let leftSid = null;
  function joinPlay(m) {
    if (!m || typeof m.sid !== 'string' || !Array.isArray(m.seats) || !GAMES().some(g => g.id === m.game)) return;
    const L = GAMEHUB.Launcher, cur = L.net; if (cur && cur.sid === m.sid) return; // ya está en esa
    if (L.open_ && !cur) return; // jugando otra cosa por su cuenta
    leftSid = null; openNet(m.game, 'client', m.seats, m.ev, m.sid, m.tour);
  }
  Net.on('room', R => {
    if (Net.isHost || !R) return; const L = GAMEHUB.Launcher, cur = L.net, P = R.play;
    if (P && P.sid !== leftSid && (!cur || cur.sid !== P.sid) && Array.isArray(P.seats) && P.seats.some(x => x && x.dev === Net.id)) joinPlay(P); // (solo si juega aquí: quien llega tarde a mirar no entra a la fuerza)
    else if (!P && cur && cur.role === 'client') { L.close(); hostAway = false; note = 'El anfitrión volvió a la sala.'; if (visible()) render(); }
  });

  let hostT = 0;
  function waitHost() { clearTimeout(hostT); hostT = setTimeout(() => { if (Net.alive && !Net.isHost && !Net.room) { note = 'No aparece el anfitrión. Revisa el código, o que su GameHub siga abierto en la sala.'; render(); } }, 15000); }
  Net.on('room', () => { if (visible()) render(); });
  Net.on('peers', () => { if (visible()) render(); });
  // si el anfitrión se va, la sala sigue: el siguiente aparato queda de anfitrión (mismo código) y el torneo sigue con él
  const nameOf = id => { const d = ((Net.room && Net.room.devices) || []).find(x => x.id === id); return d && d.info ? d.info.name : ''; };
  const closeNetGame = () => { try { if (GAMEHUB.Launcher.net) GAMEHUB.Launcher.close(); } catch (e) { /* nada */ } };
  Net.on('status', s => {
    if (!Net.alive) return;
    if (s.hostGone) { closeNetGame(); hostAway = false; note = 'Se fue el anfitrión: la sala sigue con el siguiente aparato…'; }
    else if (s.newHost && s.me) { closeNetGame(); note = 'Ahora tú eres el anfitrión: la sala sigue con el mismo código y los demás se reconectan solos.'; adoptTour(); }
    else if (s.newHost) { const n = nameOf(s.newHost); note = n ? `Ahora el anfitrión es ${n}.` : 'La sala sigue con un nuevo anfitrión.'; }
    else if (s.steppedDown) { closeNetGame(); note = 'Otro aparato quedó de anfitrión: sigues en la sala como invitado.'; }
    else return;
    if (visible()) render();
  });
  // el nuevo anfitrión sigue el torneo en línea que todos tenían guardado (si en este aparato no hay otro a medias)
  function adoptTour() {
    const T = tourNet, L = GAMEHUB.Tour.T; if (!T || !T.online || T.done) return;
    if (L && !L.done && !L.online) { note += ' El torneo en línea quedó a medias: ábrelo desde «Seguir el torneo» abajo.'; return; }
    GAMEHUB.Tour.T = T; GAMEHUB.Tour.save();
  }
  /* ---------- pantalla encendida y anfitrión en segundo plano ---------- */
  let wl = null, hostAway = false;
  async function keepAwake() { if (!Net.alive || document.hidden || wl || !navigator.wakeLock) return; try { wl = await navigator.wakeLock.request('screen'); wl.addEventListener('release', () => { wl = null; }); if (!Net.alive) letSleep(); } catch (e) { wl = null; } }
  function letSleep() { const w = wl; wl = null; if (w) w.release().catch(() => {}); }
  Net.on('peers', () => { if (Net.alive) keepAwake(); else letSleep(); });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) keepAwake();
    // el anfitrión avisa si sale de la app (en el celular, la partida se congela hasta que vuelva)
    if (Net.alive && Net.isHost) Net.send('*', { $: 'away', on: document.hidden }, true);
  });
  Net.on('msg', (from, m) => { if (m && m.$ === 'away' && !Net.isHost && from === Net.hostId) { hostAway = !!m.on; if (visible()) render(); } });
  // refrescar el ping de vez en cuando (sin tocar lo que se está escribiendo)
  setInterval(() => { if (visible() && Net.alive && !el().contains(document.activeElement && document.activeElement.tagName === 'INPUT' ? document.activeElement : null)) render(); }, 3000);
  return { render, get code0() { return code0; }, info, players: () => players(Net.room), playTour, leftNet(sid) { if (!Net.isHost) leftSid = sid; } };
})();
