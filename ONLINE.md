# GameHub en línea — plan y bitácora

> Archivo de trabajo para retomar en cualquier momento. Se actualiza en cada paso
> y se sube a la rama **`online`** de `igaviria0001-ops/gamehub` (la app publicada
> en `main` no se toca hasta que todo esté probado).

## Pedido (Ignacio, 17 nov 2026, 20:11)

- Volver GameHub **online**, lo mejor posible y lo más fluido posible para jugar con amigos
  (wifi y datos móviles).
- Seguir con lo de siempre (2 en un mismo aparato) y además **varios aparatos**:
  cada uno con su celular; o un celular con 2 jugadores y otro con 1; o mezcla de
  computadores y celulares. «Debe estar muy bien pensado para que se pueda usar de
  todas las maneras posibles y jugar ahora sí varios».
- Que funcione para **los 4 juegos**.
- El **Salón de la fama**, los torneos y todo lo demás pensado también para online.
- Investigar los mejores métodos; que quede perfecto y comprobado.
- Guardar el avance siempre y bien estructurado; continuar solo cuando se renueve el uso
  (tarea programada 00:12 hora de Bogotá).

## Decisiones de arquitectura (investigadas el 17 nov)

1. **Red: WebRTC entre los aparatos (P2P), sin servidor propio.** GitHub Pages no corre
   servidores. La señalización (encontrarse) va por **brokers MQTT públicos por WebSocket**
   (varios a la vez para que si uno cae, otro sirva: EMQX, HiveMQ, Mosquitto), con los
   mensajes **cifrados AES-GCM** con una clave sacada del código de la sala.
   Código propio, sin librerías (npm no estaba disponible y así queda en un solo archivo).
2. **NAT y datos móviles:** STUN públicos (Google, Cloudflare) + **TURN de respaldo**
   (Open Relay de Metered con credenciales temporales calculadas en el navegador,
   HMAC-SHA1 con el secreto público de su modo «static auth»). Opción de poner
   credenciales propias (Metered 20 GB/mes o Cloudflare 1000 GB/mes) en Ajustes.
   Último recurso si WebRTC no conecta: **reenviar los mensajes por el mismo MQTT**
   (más lento, pero nunca deja a nadie por fuera).
3. **Topología: estrella con anfitrión.** El aparato que crea la sala es el anfitrión:
   corre la partida de verdad. Los demás mandan sus controles y reciben el estado.
4. **Sincronía de juego: anfitrión con autoridad + instantáneas.**
   - Cada aparato remoto manda sus entradas (60 por segundo, muy pequeñas) por un canal
     **no confiable y sin orden** (sin esperas por paquetes perdidos).
   - El anfitrión manda **instantáneas** del estado (20–30 por segundo, compactas) por el
     canal no confiable y los **eventos** (golpes, sonidos, efectos) por el confiable.
   - Los demás dibujan con **interpolación** (100 ms atrás, suave aunque haya saltos) y
     generan efectos y sonidos desde los eventos. En VÉRTIGO cada aparato dibuja la cámara
     de sus propios jugadores.
   - Descartado: *lockstep* determinista (iPhone/Safari calcula `Math.sin` distinto y los
     juegos usan `Math.random` → se desincroniza) y video (gasta muchos datos y más retraso).
5. **Puestos de jugador («slots»):** cada aparato dice cuántos juegan en él (1 o 2, con
   nombre y color). La sala arma la lista de jugadores; el anfitrión asigna puestos a cada
   partida. En 2 juegos de 2 puestos, los puestos pueden estar en aparatos distintos.
6. **Más de 2 a la vez:** el torneo combinado (2–8) ya rota los duelos. Además, por juego,
   donde tenga sentido: VÉRTIGO hasta 4 humanos (+ máquina hasta 6), Sortilegio todos contra
   todos / 2 contra 2 hasta 4 magos, Ventolera hasta 4 pájaros, Tira y Afloja 2 contra 2
   (por estudiar).
7. **Salón de la fama y torneos en línea:** el torneo vive en el anfitrión; cada resultado
   se reparte a todos; al terminar, cada aparato guarda el campeón en su Salón de la fama
   (marcado «en línea», con los nombres de todos).

## Fases (marcar al terminar; el detalle de cada paso va en la bitácora)

- [x] **F1 · Red base** (base hecha y probada; faltan prueba de relevo y TURN en F9) `shared/net.js`: sala con código de 5 letras + enlace `?sala=` + QR,
      señalización MQTT cifrada con varios brokers, WebRTC (canal confiable + no confiable),
      TURN de respaldo, relevo por MQTT, ping/reloj, reconexión, salida de un aparato.
      Transporte de prueba por `BroadcastChannel` para las pruebas automáticas.
- [x] **F2 · Sala en GameHub** (falta: chat rápido y elegir modo/escenario antes de lanzar): botón «En línea» → crear / unirse; cada aparato pone sus
      jugadores (1 o 2) con nombre y color; lista con aparato, ping y señal; el anfitrión
      elige juego/modo/escenario o arma un torneo con todos; chat rápido (emojis).
- [x] **F3 · Enlace juego ↔ red** (puente hecho; se prueba de verdad con el primer adaptador, F4) (`shared/netplay.js`, copiado como `src/00k-net.js`):
      anfitrión: entradas remotas → `Input`; instantáneas y eventos → red. Remoto: modo
      «títere» (no simula, aplica instantáneas, interpola, dibuja, efectos por eventos).
- [x] **F4 · VÉRTIGO en línea** (carrera rápida con hasta 4 personas; duelo/eliminación/batalla en línea quedan para después) (encaja mejor: estado pequeño, cámara por aparato, hasta 4).
- [x] **F5 · Ventolera en línea** (pájaros, balas, misiles, cajas, blancos; hasta 4).
- [x] **F6 · Sortilegio en línea** (magos, hechizos, terreno por cambios, criaturas; hasta 4).
- [x] **F7 · Tira y Afloja en línea** (chicles, hilo, objetos; 2 o 2 contra 2).
- [x] **F8 · Torneo y Salón de la fama en línea**; resultados a todos; reanudar si el
      anfitrión se cae (el torneo se guarda en todos).
- [x] **F9 · Pruebas**: dos y tres navegadores en la misma máquina (WebRTC real), pérdida y
      retraso simulados, celular + PC, 30 min sin cortes; medir datos por minuto.
- [x] **F10 · Publicar**: unir `online` → `main`, versión nueva, artefacto, bitácoras, guía.

## Cómo retomar

1. `cd /home/claude/coleccion && git checkout online && git pull` (si el contenedor se
   reinició: clonar `igaviria0001-ops/gamehub`, rama `online`).
2. Leer la bitácora de abajo: el último paso dice qué sigue.
3. Construir: `node build.js` (copia `shared/*.js` a cada juego). Servidor de pruebas:
   `cd docs && python3 -m http.server 8765`. Pruebas en `test/`.
4. Al terminar cada paso: anotar aquí, `git commit` y `git -c push.negotiate=true push origin online`.

## Bitácora

- **17 nov 20:15** — Investigación y decisiones (arriba). npm sin acceso en el contenedor →
  red escrita a mano sin librerías. Rama `online` creada. Sigue: F1 `shared/net.js`.
- **17 nov 20:40** — F1: `app/net.js` (MQTT mínimo propio sobre WebSocket a 3 brokers, AES-GCM, WebRTC con
  canales negociados `r` confiable y `u` sin orden, TURN Open Relay por HMAC, relevo por MQTT a los 12 s,
  ping/reloj, sala transmitida por el anfitrión, salida). Prueba `node test/net.js` (3 páginas, WebRTC real,
  señalización BroadcastChannel con `?net=bc`): conectan en ~2 s, ping 2–3 ms, mensajes en los dos canales,
  salida de un aparato → RED OK. Sigue: F2 sala en GameHub (leer app/app.js: pantallas y portada).
- **17 nov 21:05** — F2 (primera parte): vista «En línea» (`app/online.js`, botón en la barra, `#online`,
  enlace `?sala=CÓDIGO` abre la sala). Quién juega en este aparato (1 o 2, nombre y color), crear/unirse,
  código grande, copiar enlace/compartir, aparatos con jugadores, ping y tipo de conexión, el anfitrión ve
  los 4 juegos («pronto»). Prueba `node test/sala.js` (PC anfitrión + celular con 2 + otro PC) → SALA OK.
  Sigue: F3 `shared/netplay.js` (enlace juego ↔ red) y luego VÉRTIGO en línea (F4).

## Especificación F3 · enlace juego ↔ red (para implementar)

**Puestos (seats):** el anfitrión arma `seats = [{ dev, local, name, color }]` (orden = J1, J2, J3…) con los
jugadores de la sala que van a jugar esa partida. `local` = 0 o 1 (qué jugador de ese aparato: teclado
izquierdo/derecho o mitad de la pantalla). Cada aparato sabe `mine = [índices de seats suyos]`.

**Arranque:** el anfitrión manda por `r` `{ $:'game', game, ev, seats, sid }` (sid = id de partida) → cada
aparato abre el juego con `Launcher.open(game, null, { net })` y, cuando el juego avisa `ready`, le manda
`{ cmd:'net', role:'host'|'client', seats, mine, ev, sid }`.

**Mensajes juego ↔ GameHub (postMessage, ya existe el canal `hub:'gamehub'`):**
- juego → app: `{ event:'net', ch:'u'|'r', to:'host'|'*', d }` · app → juego: `{ cmd:'netin', from, d }`.
- La app reenvía con `Net.send(to === 'host' ? Net.hostId : '*', { $g: sid, d }, ch === 'r')`.

**En el juego (`shared/netplay.js` → `src/00k-net.js`, objeto `NetPlay`):**
- `NetPlay.on`, `role`, `seats`, `mine`, `seatOf(localIdx)`, `send(d, reliable)`, `onMsg(fn)`.
- Remoto: cada cuadro manda `{ t:'in', s: seat, i: entrada, q: n }` por `u` (60/s; si no cambia, 15/s).
- Anfitrión: guarda la última entrada de cada seat remoto (si no llega en 0,5 s → neutra) y el juego la usa
  en lugar del teclado (Sortilegio: `Input.virt[i]`; los demás: un gancho igual en `Input.read`).
- Anfitrión: a 30/s `{ t:'s', n, tm, d: NetGame.snap() }` por `u` y los eventos del paso `{ t:'e', l:[…] }` por `r`.
- Remoto en modo títere: no simula; guarda las 3 últimas instantáneas y dibuja interpolando 100 ms atrás
  (`NetGame.apply(a, b, k)`); efectos y sonidos con los eventos (`NetGame.event(e)`); su HUD y su cámara son
  los de sus seats.
- Resultado: lo da el anfitrión (como hoy con `Hub.result`); la app del anfitrión lo reparte a todos `{ $:'res' }`.

**Por juego (`src/1x-net.js` en cada uno, objeto `NetGame`):** `seatsMax`, `start(ev, seats)` (armar la
partida con N humanos), `snap()`, `apply(a, b, k)`, `event(e)`, `views(mine)` (qué cámaras/HUD dibujar).
Orden sugerido: VÉRTIGO (autos = pocos números; hasta 4 humanos + máquina), Ventolera, Sortilegio, Tira y Afloja.
- **17 nov 21:30** — F3: `shared/netplay.js` (copiado como `src/00k-net.js` en los 4 juegos; inerte si no hay
  partida en línea): `NetPlay` con roles, puestos, entradas remotas (`NetPlay.input(seat)`), instantáneas a 30/s,
  eventos confiables, interpolación (`NetPlay.sample()` 100 ms atrás). Puente en `app/app.js`
  (`Launcher.open(id, ev, net)`, reenvío `net`/`netin`, `netoff` al cerrar, vuelve a la sala). `online.js`:
  `startGame(g)` arma los puestos y avisa `{ $:'game' }`; los remotos abren el mismo juego. Los juegos se activan
  en la sala cuando su ficha en `app/catalog.js` tenga `net: { seats, mode }`. Pruebas: sala OK, flujo OK.
  Sigue: **F4 VÉRTIGO** — adaptador `vertigo/src/12b-net.js` (`NetGame`): estudiar `04-race.js` (Race, cars),
  `12-main.js` (bucle, cámaras/vistas, `newRace`, `startCfg`), `08-hud.js`; hacer: N humanos (hasta 4) con
  `humans` de cada aparato, títere en remotos (sin `Race.step`, autos desde la instantánea, cámaras de `mine`),
  eventos → `FX.onEvents`/`Sound.onEvents`/HUD; luego `catalog.js` vertigo `net: { seats: 4, mode: 'quick' }`
  y una prueba `test/netvtg.js` con 2 páginas (anfitrión + remoto) que compare posiciones.

## Diseño F4 · VÉRTIGO en línea (estudiado el 17 nov; implementar así)

Archivos: `vertigo/src/04-race.js` (Race: `cars`, `order`, `state`, `countT`, `time`, `hz` peligros de objetos
`{k,s,u,h,life,owner,…}`, `boxes[].gone`, `track.gems[].gone`, `boss`/`bz` en Persecución, `rules`),
`03-car.js` (Car: `s,u,h,a,roll,pitch,f,mode,drift{on,dir,lv},boostT,boostK,gem,item,itemN,lap,laps[],finished,
finishT,place,respawnT,out,trick{kind,t,dur},hopT,wobT,spinT,steerS,shieldT,specT,fogT,invT,magnetT`),
`12-main.js` (`newRace`, `startCfg`, `frame`: `R.step` a 1/120, `humansCars()`, `views` por `G.nHumans`,
`cams[i]`, `chase(i, car)`, `HUD.player(views[i], car…)`, `UI.results`), `07b-gfx-items.js` (dibuja `R.hz`, `R.boxes`).

1. **Adaptador** nuevo `vertigo/src/12b-net.js` (después de 12-main): `NetGame` + ganchos:
   - `Input.read` envuelto: si `NetPlay.isHost`, puesto local → `Input.read(local)`; remoto → `NetPlay.input(seat)`
     (neutra `{steer:0,up:false,down:false,drift:false,item:false,turbo:false}`). `Input.solo = mine.length === 1`.
   - `readLocal(li)` = `Input.read(li)` original (táctil: mitad li).
2. **Arranque** (`NetPlay.onStart`): el anfitrión arma la carrera con `seats.length` humanos (pilotos: el que cada
   aparato tenga elegido → mandar en la info de la sala; por ahora `PILOT_ORDER[i]`), bots hasta 6, modo `quick`
   (luego duel/gp/elim/battle) y manda `{t:'cfg', tid, humans, bots, laps}` por `r`; los remotos hacen
   `newRace(tid, humans, bots)` igual (sin simular).
3. **Vistas por aparato:** reemplazar `humansCars()` en cámaras/render/HUD por `viewCars()` = humanos cuyo puesto
   está en `mine` (orden por `local`); `G.nHumans` = `mine.length` (1 o 2 vistas); `newRace` crea `cams` para
   esas vistas. Los demás autos humanos se ven como rivales (con su etiqueta de jugador).
4. **Instantánea** (20–30/s, compacta, números redondeados): por auto un arreglo
   `[s,u,h,a,roll,pitch,f,modo,driftOn,driftDir,driftLv,boostT,boostK,gem,itemId,itemN,lap,place,finished,finishT,
   respawnT,out,trickKind,trickT,trickDur,hopT,wobT,spinT,steerS,shieldT,specT]`; carrera `{st,cd,tm,ord,hz:[[k,s,u,h,life,o]],
   bx:[gone…], gm:[gone…]}`. Interpolar `s` con vuelta de pista (`T.L`), ángulos por el camino corto.
5. **Remoto títere:** en `frame`, si `NetPlay.isClient`: no `R.step`; `NetPlay.sample()` → aplicar a `R.cars` y
   `R`; eventos (`NetGame.event`) → `frameEv` (sonido, FX, HUD). Resultado: el del anfitrión (`{t:'fin'}`).
6. **Pieles:** cada aparato manda en su info de sala `skins` por jugador (pintura/neón/turbo) para que el
   anfitrión y los demás vean el garaje de cada quien (`CarArt.build(pid, seat, skin)`).
7. Ficha en `app/catalog.js`: `net: { seats: 4, mode: 'quick' }` y prueba `test/netvtg.js` (2 páginas con
   `?net=bc`, anfitrión + remoto: la posición del auto remoto en el anfitrión cambia con sus teclas y el remoto
   ve el mismo orden de carrera).
- **17 nov 22:30** — F4 base FUNCIONANDO: `vertigo/src/12b-net.js` (`NetGame`: `Input.read` envuelto, `HUD.msg` por
  vista, arranque del anfitrión con `seats.length` humanos + máquina hasta 6, `{t:'cfg'}` + el remoto lo pide con
  `{t:'want'}` hasta tenerlo, instantánea compacta por auto (40 números) + peligros/cajas/esmeraldas, `apply` con
  interpolación de `s` con vuelta y ángulos, eventos al `frameEv`). `12-main.js`: `viewCars()`/`vIdx()` (cámaras,
  HUD y avisos solo de los puestos de este aparato), `startNet(o)`, `Game.R`, pausa sin detener en línea, pieles por
  puesto local. `app/net.js`: un aparato «se fue» solo tras 30 s de silencio (60 s si WebRTC sigue conectado), porque
  al cargar un juego pesado se calla un rato. `catalog.js`: vertigo `net: { seats: 4, mode: 'quick' }`.
  Prueba `node test/netvtg.js` → VTG EN LÍNEA OK (el remoto abre la carrera, ve lo mismo que el anfitrión y su
  tecla mueve SU auto en el anfitrión; captura: el remoto dibuja su auto con su HUD).
  **Sigue F4 (pulido):** pantalla de resultados en línea (botón «Volver a la sala» para todos; el anfitrión «Otra
  carrera» = nueva partida con los mismos puestos); elegir piloto y pista antes de lanzar (en la sala, por aparato:
  `info.players[i].pilot` y `skin`); nombres sobre los autos de otros jugadores; modos duelo/eliminación/batalla/
  Gran Premio en línea; prueba con pérdida de paquetes. Luego **F5 Ventolera** (mismo patrón: `09c-net.js`).
- **17 nov 21:35** — F4 pulido (1): resultados en línea (todos: «Volver a la sala»; anfitrión: «Otra carrera
  (todos)» → `NetGame.again()` = otra pista, `cfg.id+1`, los remotos aceptan cfg con id distinto); nombres y colores
  de la sala en la tabla y el título («¡Gana Ana!», «·tú»); **pantalla de espera**: nadie arranca hasta que todos
  cargaron el juego (lista con «listo ✓ / cargando…», el anfitrión puede «Empezar ya» a los 5 s; sin respuesta en
  25 s arranca igual); cada aparato manda su **piloto elegido y lo que tiene puesto en el garaje** (`{t:'want', me}`),
  el anfitrión evita pilotos repetidos y reparte las pieles en `cfg.skins` (validadas); **nombre flotante sobre los
  autos** de jugadores de otros aparatos (se desvanece a 140 m); `PLAYER_COLORS` ahora 4 y en línea toman el color de
  la sala; el garaje cuenta victorias solo de los jugadores del aparato y «Ponérselo a…» solo a ellos
  (`vestidor.js`: opción `nPlayers`). `vertigo/src/00k-net.js` copiado (el juego suelto ya no falla).
  Prueba `node test/netvtg.js` ampliada (resultados + otra carrera para todos) → VTG EN LÍNEA OK. Nota: con dos
  páginas 3D por CPU en la misma máquina la prueba a veces va lenta (no es fallo del juego).
  **Pendiente F4:** el anfitrión en segundo plano detiene la carrera (rAF): seguir simulando con temporizador si
  `document.hidden`; modos duelo/eliminación/batalla en línea; elegir modo/pista en la sala; prueba con pérdida.
- **17 nov 21:45** — F4: si el anfitrión tapa el juego (otra app/pestaña), la carrera sigue con un temporizador de
  respaldo (`12-main.js`, cada 50 ms con `document.hidden`; probado: +1,7 s de carrera en 2 s ocultos). En la sala, el
  anfitrión ve «deja esta pantalla abierta mientras juegan». Orden decidido: F2 (elegir modo/escenario en la sala,
  sirve para todos) → F5 Ventolera → F6 Sortilegio → F7 Tira y Afloja → F8 torneo/Salón → modos extra de VÉRTIGO.
- **17 nov 22:05** — F2 (elegir antes de lanzar): el anfitrión toca un juego → panel con **modo** (solo los que ya
  funcionan en línea: `catalog.net.modes`), **escenario** (🎲 al azar o uno), **largo** (vueltas/rondas) y «¡A jugar!»;
  los demás ven «EL ANFITRIÓN PREPARA: VÉRTIGO · Carrera · Venecia · 2 vueltas» (`{$:'pick'}`, se reenvía al que entra).
  `catalog.net.desc` = texto del modo en línea. Prueba `test/netvtg.js` elige Venecia a 2 vueltas desde la sala y los
  dos aparatos corren ahí → OK. Celular revisado (sin desborde). Sigue **F5 Ventolera**.
- **18 nov 00:40** — Paquete común: la **sala de espera y el arranque** pasaron a `shared/netplay.js` (`NetPlay.gate({ me, make,
  apply })`, `NetPlay.again(f)`, `NetPlay.cfg`, `NetPlay.okId`); VÉRTIGO ya lo usa (prueba OK). `sample()` da también `dt`.
  En la sala, el anfitrión reparte **colores y nombres sin repetir** entre aparatos.
  **F5 Ventolera en línea HECHO (base):** el juego ahora admite 2 a 4 pilotos (`Combat.foe/foes/foeAhead` = rival más
  cercano o más a tiro; choques por parejas; duelo «todos contra todos» = la ronda es del último en el aire; Blancos,
  Maletín y Carrera con marcador para 3–4 (`Modes.drawHUDN`), aros repartidos en colores, logros solo de los pilotos del
  aparato). `vento/src/09c-net.js`: entradas remotas (tonel y misil se repiten 150 ms con número para no perderse ni
  duplicarse), instantánea compacta (~600–750 bytes: pilotos en lista fija, balas/misiles/bengalas, cajas, paracaídas,
  blancos, maletín, aros, tren/barco/globos/tormenta/costa), aplicar con interpolación y proyectiles llevados al mismo
  instante, estelas armadas en el remoto, eventos con el piloto como número (efectos y sonidos en el remoto),
  resultados a todos («¡Ganaste!», tabla de N columnas), «Revancha (todos)» del anfitrión. Cámara: cada aparato sigue a
  sus pilotos; HUD: paneles de los pilotos del aparato + fichas de los demás. `catalog`: ventolera `net` con 4 modos.
  Pruebas: `node test/netvto.js` (2 pilotos) y `TRES=1 node test/netvto.js` (anfitrión con 2 + remoto) → VTO EN LÍNEA OK;
  modos sin conexión siguen bien. **Sigue F6 Sortilegio** (mismo patrón: `sorti/src/…-net.js` + generalizar a 2–4 magos).
- **18 nov 01:30** — **F6 Sortilegio en línea HECHO (base):** el juego admite 2 a 4 magos (todos contra todos; 3.º y 4.º
  aparecen arriba/abajo al centro en sitio pisable; separación entre todas las parejas; Altar y Cacería para N; Tejo solo
  para 2 — `catalog.net.max`, la sala lo esconde si son más; marcador `boardN` y fichas de los demás; nombres de la sala
  sobre los magos; logros solo de los magos del aparato). Eventos partidos en `visual(e)` (efectos, sonido, cámara,
  letreros) y lógica. `sorti/src/12b-net.js`: referencias como números (`{$u}` magos/criaturas, `{$d}` tablas del juego),
  instantánea (~2–2,4 KB: magos, hechizos, criaturas/torretas/señuelos/tejo, estado de ronda), efectos y letreros de la
  lógica viajan como eventos, **terreno**: foto entera al empezar cada ronda (`kf`) + cada 100 ms solo las celdas que
  cambian de verdad (`td`, comparando con una copia que «se gasta» igual: `Terrain.decay`), el remoto arma la ronda con la
  misma semilla (`Game.netNewRound`). Toque en el celular para marcar enemigo viaja en la entrada (`pn`).
  Pruebas `node test/netsrt.js` y `TRES=1 …` → SRT EN LÍNEA OK; modos sin conexión bien.
  **Pendiente F9:** bajar datos de Sortilegio (≈4 MB/min a 30/s): delta entre instantáneas o 20/s.
  **Sigue F7 Tira y Afloja.**
- **18 nov 02:20** — **F7 Tira y Afloja en línea HECHO:** el hilo es de a dos → juegan 2 (cada uno en su aparato o los dos en
  uno) y **los demás de la sala miran en vivo** (aparatos sin puesto = espectadores; en la sala: «juegan X y Y; los demás
  miran»). `tya/src/09c-net.js`: entradas (saltar/pegarse se repiten 120 ms), instantánea (~1,5 KB: los dos chicles, el
  hilo de 30 puntos, bolitas, escenario que se mueve + su estado propio, estado del modo `Modes.M`, Fiesta), **efectos y
  sonidos copiados** (cada llamada a `FX.*`, `Sound.play` y `Player.bump` del anfitrión se repite en los remotos), el
  remoto anima los cuerpos él mismo; resultados con nombres, «Revancha (todos)», «Volver a la sala»; teclas y botones
  táctiles solo de los jugadores del aparato (del lado de su chicle). Espectadores también en VÉRTIGO (cámara al que va
  adelante; sin botones táctiles). Pruebas: `node test/nettya.js` y `TRES=1` (con mirón) → TYA EN LÍNEA OK; sin conexión OK.
  **Los 4 juegos ya se juegan en línea.** Sigue **F8**: torneo y Salón de la fama en línea.
- **18 nov 03:10** — **F8 Torneo y Salón de la fama en línea HECHO:** en la sala, el anfitrión toca «🏆 Torneo con todos» →
  el asistente de siempre con los jugadores de la sala (fijos) y solo los juegos que van en línea; `Tour.T.online`.
  «¡A jugar!» en el tablero lanza la prueba en línea (`Online.playTour`): juegan los dos de la prueba (buscados por
  nombre en la sala), los demás la miran en vivo; el juego sabe que es de torneo (`NetPlay.ev.tour`: sin «Revancha»,
  botón «Volver al torneo»); el resultado que manda el juego del anfitrión se anota solo (`Launcher`, mensaje `res`).
  Cada cambio del torneo viaja a todos (`{$:'tour'}`): en la sala se ve el tablero (prueba que sigue, tabla, pruebas
  jugadas, campeón). Al terminar, el campeón entra al Salón de la fama de **todos** los aparatos, marcado «EN LÍNEA».
  Si el anfitrión se cae, cualquiera ve «TORNEO A MEDIAS → Seguir el torneo como anfitrión» (copia guardada en cada
  aparato). La sala muestra colores y nombres ya sin repetir. `NetGame.rate`/`lag` por juego (ritmo de instantáneas).
  Prueba `node test/nettour.js` (3 aparatos, liga) → TORNEO EN LÍNEA OK. Sigue **F9 pruebas** (pérdida/retraso, datos
  por minuto y bajar Sortilegio, relevo/TURN, celular+PC, estabilidad) y **F10 publicar**.
- **18 nov 04:20** — **F9 pruebas (gran parte):** `app/net.js` con red simulada para pruebas (`?netloss=0.15&netlag=120`,
  `?netforce=relay`) y cuenta de datos (`Net.stats`). `test/netdatos.js` mide datos por minuto (1 contra 1, el remoto
  moviéndose): Tira y Afloja ≈1,9 MB/min (bajó de 3,1: partes «lentas» solo cuando cambian — `NetPlay.slow` — y el hilo
  como diferencias), Ventolera ≈1,6, Sortilegio ≈1,5 (VÉRTIGO ≈50 KB/s en carrera según el tamaño de su instantánea).
  Con 15 % de pérdida y 120 ms de retraso los 3 juegos siguen sin errores y sincronizados; **solo por relevo (sin WebRTC)**
  también se juega. Colchón de interpolación **adaptable** (55–250 ms según lo pareja que llegue la red: responde antes
  con buena red). Lo lento que se salta un cuadro pasa a la instantánea que sí se dibuja. **Celular:** `test/netcel.js`
  (tablet anfitrión + celular 844×390): el celular ve SUS botones táctiles (uno), del color de su jugador, y su dedo mueve
  su personaje en el anfitrión (Tira y Afloja y Ventolera) → CELULAR OK. Arreglos: botones táctiles de Sortilegio
  mostraban el mago 0 (ahora el del puesto), colores de los botones en VÉRTIGO/Ventolera/Sortilegio, disposición táctil
  de Tira y Afloja. Todas las pruebas en línea pasan (netvtg, netvto, netsrt, nettya, nettour, netcel).
  No se puede probar el TURN público desde aquí (el contenedor no sale a internet); queda configurado (Open Relay).
  Sigue: estabilidad larga, revisar pantallas en celular y **F10 publicar**.
- **18 nov 05:00** — F9 cerrado: estabilidad 2,5 min por juego (Ventolera ≈1,2 MB/min, Sortilegio ≈2,3 MB/min en pelea
  intensa) sin errores; **reacciones rápidas** en la sala (8 emojis que salen flotando en todos los aparatos; `test/sala.js`
  lo prueba); aviso en vistas previas (dentro del artefacto el navegador no deja conectar: «abre GameHub desde su
  dirección»). README con la sección «En línea» y las pruebas nuevas. Pruebas de siempre al día (flujo, app, ui, motor).
  **F10:** `online` → `main` y publicar.
- **18 nov 05:15** — **F10 PUBLICADO:** `online` unido a `main` (f19221c) y subido: GitHub Pages
  (https://igaviria0001-ops.github.io/gamehub/) ya trae el modo En línea. Artefactos: GameHub v8 (en la vista previa el
  navegador no deja conectar: allí sale el aviso con la dirección), Ventolera v34, Sortilegio v24, VÉRTIGO v27, Tira y
  Afloja v39. Bitácoras de los 4 docs con la fila «En línea». **Gran misión terminada.** Ideas para después: predicción
  local del propio personaje (respuesta aún más inmediata), duelo/eliminación/batalla de VÉRTIGO en línea, elegir quién
  juega cuando sobran personas en Tira y Afloja, bajar más los datos de Sortilegio.

## Segunda tanda (pedido 18 nov 06:01) — plan
Pedido: (1) asegurar que el modo SIN conexión quedó idéntico y perfecto; (2) que el propio personaje responda más rápido;
(3) todos los modos de todos los juegos también en línea, sin cambiar la estructura de los juegos (solo agregar); el
estilo de la app se adapta; (4) revisar su lista de ideas (inspiración, no obligación) y hacer las que sí mejoren, o
mejores; (5) todo optimizado y comprobado.
- **G1 · Sin conexión idéntico** — prueba de EQUIVALENCIA: la versión de antes del en línea (main 28e6638) y la nueva,
  con el mismo azar (Math.random sembrado) y pasos fijos, máquina contra máquina en cada modo de cada juego: el
  resultado debe ser idéntico (posiciones, vida, puntos). Más las pruebas propias de cada juego (soak/chaos/modos).
- **G2 · Red más sólida** (de la lista y propias): pantalla siempre encendida en la sala (Wake Lock); aviso al anfitrión
  de no salir de la app y aviso a los demás cuando sale; reloj recalibrado (mínimo de ventana, se adapta en 2 s si cambia
  de wifi a datos); relevo MQTT con ritmo propio (~12/s, solo lo último) para no saturar los brokers; TURN propio en
  Ajustes con botón «Probar» y que el anfitrión lo comparta con la sala por la señal cifrada; mapa completo a pedido
  (Sortilegio) si alguien entra o se reconecta a mitad de ronda; **sucesión automática del anfitrión** (mismo código de
  sala: el siguiente aparato toma el mando y los demás se reconectan solos; el torneo sigue).
  Descartadas: contador de toques en Tira y Afloja (tirar/aflojar se mantienen apretados; saltar/pegarse ya se repiten
  con número); vibración en cada toque (la predicción del personaje propio resuelve el retraso de verdad);
  interpolación dinámica (ya está hecha).
- **G3 · Respuesta inmediata** — predicción del personaje propio en el aparato remoto (se mueve con tus teclas al
  instante con la misma física del juego y se corrige suave con lo que manda el anfitrión): Ventolera, VÉRTIGO,
  Sortilegio (movimiento), Tira y Afloja (movimiento).
- **G4 · Todos los modos en línea** — VÉRTIGO: duelo, eliminación, batalla, Gran Premio, Persecución; Ventolera: Copa,
  Jefe en pareja; Sortilegio: Copa; Tira y Afloja: Modo Fiesta, jefes y Fuga en pareja; campañas en pareja si alcanza.
- **G5 · Comprobar y publicar** — todas las pruebas (sin conexión, equivalencia, en línea por modo, celular, red mala),
  unir a main, artefactos, bitácoras, memoria.

### Segunda tanda — bitácora
- **G1 hecho (18 nov)** — `test/offline-eq.js`: carga la versión de antes del en línea (28e6638) y la nueva lado a lado
  con el mismo azar, el mismo reloj (performance.now, Date, new Date, requestAnimationFrame, setTimeout/setInterval y el
  reloj del audio, todos virtuales) y las mismas teclas a los mismos instantes; compara el estado COMPLETO del juego
  (todo, aplanado: posiciones, velocidades, vida, puntos, cuerdas, terreno…) cada pocos segundos y la imagen final.
  Resultado: idéntico en los 4 juegos — Tira y Afloja 6 modos + Fiesta + jefe + 2 humanos (bucle real); Ventolera 6 modos
  + 2 humanos duelo/blancos + carrera + escuela; Sortilegio 4 modos × 2 escenarios + 2 humanos duelo/tejo + contra la
  máquina; VÉRTIGO 7 modos (carrera, GP, eliminación, batalla, duelo, contrarreloj, vuelta al mundo) + humanos (bucle
  real, con dibujo 3D). Portadas idénticas. Lo único distinto que encontró, y se arregló: en Sortilegio, el orden en que
  salían dos letreros a la vez (logro y fusión) cambió al separar «lo visual» para el en línea → vuelto al orden de antes.
  Diferencias aceptadas (no cambian nada): `bumpCd` de Ventolera pasó a `bumpPair['0-1']` (mismo valor, comprobado) y
  `G.net = false` en Sortilegio.
- **G2** — relevo con ritmo propio (≤12/s, lo más nuevo de cada tipo; las partes lentas pasan a la que sale); ping
  también por el relevo; reloj por mínimo de ventana de 2 s; aviso «Esperando al anfitrión…» en el juego si deja de
  llegar (1,5 s); pantalla encendida en la sala (Wake Lock); el anfitrión avisa si sale de la app; Ajustes → EN LÍNEA:
  «Probar la conexión» (señales, directo, respaldo TURN) y TURN propio que el anfitrión comparte cifrado; Sortilegio
  pide el terreno completo si le falta o se saltó un cambio (`kfreq`, cambios numerados); **sucesión del anfitrión**:
  si se va (o se calla 20–60 s), sigue el siguiente aparato con el mismo código, los demás se reconectan solos, el
  torneo sigue con él; si el viejo vuelve, queda uno solo (el que tenga más aparatos; si empatan, el más nuevo).
- **G3** — predicción del personaje propio en el remoto (los 4 juegos): una copia corre con la física del juego y tus
  teclas; con cada instantánea se compara con lo predicho para ese momento (hace un ping) y se corrige 30 % por
  instantánea; si pasó algo grande allá, se toma lo del anfitrión. `?nopred` la apaga (para comparar).
- **G4** — VÉRTIGO en línea: carrera, mano a mano (sin máquina, hasta que alguien gane 2), eliminación, batalla en arena y
  Gran Premio (Copa Esmeralda, Dorada o Gran Copa, con puntos). Tira y Afloja: Modo Fiesta en línea (opción en la sala).
  Ventolera: Jefe en pareja en línea (2 a 4 contra La Sombra; vidas = 4 + pilotos; con 3–4, el dirigible aguanta más).
  En torneo en línea, VÉRTIGO ahora anota solo el resultado (antes no mandaba `res`). La sala admite modos «extra» del
  juego (`net.extra` en catalog.js: Gran Premio con copas como escenario, Jefe en pareja) y opciones sí/no (`net.opts`).
  No van en línea (se juegan en el aparato porque guardan avance ahí): campañas, escuelas, jefes de Tira y Afloja,
  Persecución de VÉRTIGO, Copa y Travesía de Ventolera.
- **Más robustez encontrada en las pruebas** — si un aparato estuvo trabado (cargando un juego pesado), no se juzga el
  silencio de los demás por eso; si el anfitrión vuelve a la sala, los demás también vuelven solos («El anfitrión volvió
  a la sala»); al ceder el mando, el anfitrión viejo manda a los suyos con el nuevo (no «adiós», que dispararía otra
  sucesión). Nota de pruebas: en este contenedor (2 núcleos, sin GPU) VÉRTIGO necesita `VIEW=400x225` para que dos
  copias 3D quepan; `test/todo.sh` corre todo en fila.
