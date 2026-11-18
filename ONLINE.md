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
- [ ] **F2 · Sala en GameHub**: botón «En línea» → crear / unirse; cada aparato pone sus
      jugadores (1 o 2) con nombre y color; lista con aparato, ping y señal; el anfitrión
      elige juego/modo/escenario o arma un torneo con todos; chat rápido (emojis).
- [ ] **F3 · Enlace juego ↔ red** (`shared/netplay.js`, copiado como `src/00k-net.js`):
      anfitrión: entradas remotas → `Input`; instantáneas y eventos → red. Remoto: modo
      «títere» (no simula, aplica instantáneas, interpola, dibuja, efectos por eventos).
- [ ] **F4 · VÉRTIGO en línea** (encaja mejor: estado pequeño, cámara por aparato, hasta 4).
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
