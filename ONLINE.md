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
- [~] **F4 · VÉRTIGO en línea** (carrera rápida en línea FUNCIONA; faltan pulidos, ver bitácora) (encaja mejor: estado pequeño, cámara por aparato, hasta 4).
- [ ] **F5 · Ventolera en línea** (pájaros, balas, misiles, cajas, blancos; hasta 4).
- [ ] **F6 · Sortilegio en línea** (magos, hechizos, terreno por cambios, criaturas; hasta 4).
- [ ] **F7 · Tira y Afloja en línea** (chicles, hilo, objetos; 2 o 2 contra 2).
- [ ] **F8 · Torneo y Salón de la fama en línea**; resultados a todos; reanudar si el
      anfitrión se cae (el torneo se guarda en todos).
- [ ] **F9 · Pruebas**: dos y tres navegadores en la misma máquina (WebRTC real), pérdida y
      retraso simulados, celular + PC, 30 min sin cortes; medir datos por minuto.
- [ ] **F10 · Publicar**: unir `online` → `main`, versión nueva, artefacto, bitácoras, guía.

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
