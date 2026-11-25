# Guía: editar lo que ya existe sin dañar nada

> Para cambios en los cuatro juegos (Tira y Afloja, Ventolera, Sortilegio, VÉRTIGO) o en la portada de GameHub. Si es un juego nuevo, ver [GUIA-JUEGO-NUEVO.md](GUIA-JUEGO-NUEVO.md). Las reglas generales están en [CLAUDE.md](CLAUDE.md).

Contenido:
1. [Antes de tocar nada](#1-antes-de-tocar-nada)
2. [Lo que ya está hecho se respeta](#2-lo-que-ya-está-hecho-se-respeta)
3. [Lo que nunca se rompe](#3-lo-que-nunca-se-rompe)
4. [Según el tipo de cambio](#4-según-el-tipo-de-cambio-qué-tocar-y-qué-probar)
5. [Cómo comprobar que no se dañó nada](#5-cómo-comprobar-que-no-se-dañó-nada)
6. [Mapa de cada juego](#6-mapa-de-cada-juego)
7. [Publicar y dejar registro](#7-publicar-y-dejar-registro)

---

## 1. Antes de tocar nada

1. **Entender el pedido.** Si se puede leer de dos maneras que dan resultados distintos, preguntarle a Ignacio. Si no, hacer lo más razonable y contarle qué se decidió.
2. **Leer lo del juego:**
   - Su mapa (§6).
   - Su documento de diseño y la bitácora (enlaces en §7): ahí están las decisiones que ya se tomaron y por qué.
   - Si el cambio toca el modo en línea, también [ONLINE.md](ONLINE.md).
3. **Anotar dónde se parte:** `git rev-parse --short HEAD`. Sirve para comparar al final.
4. **Elegir dónde trabajar:**
   - Un arreglo pequeño puede ir directo a `main` una vez probado.
   - Algo grande o de varias sesiones va en una **rama** (`editar-<juego>-<tema>`), con un `.md` de plan y bitácora para poder retomarlo.

## 2. Lo que ya está hecho se respeta

- **Cambiar solo lo pedido.** No reescribir sistemas que funcionan, no «modernizar» código que no hace falta tocar y no cambiar el estilo de un juego por gusto propio.
- **No quitar nada** (modos, escenarios, personajes, atuendos, logros, retos, opciones) a menos que Ignacio lo pida. Si algo estorba, mejorarlo o esconderlo detrás de una opción, nunca borrarlo calladamente.
- **Lo que se encuentre roto en el camino** se arregla, y se le cuenta.
- **El juego conserva su identidad:** cada uno tiene su paleta, su letra, su música y su manera de animar. Lo nuevo debe verse como si siempre hubiera estado ahí.
- **Cómo se escribe el código aquí:**
  - Un archivo `NN-tema.js` por tema. Los archivos se unen en orden alfabético, así que el número define el orden.
  - Comentarios y textos en español.
  - Nada de librerías nuevas ni de archivos de internet: todo va incrustado en el HTML.
  - Los textos para el jugador, cortos y en tú.

## 3. Lo que nunca se rompe

1. **El progreso de los jugadores.** Vive en el navegador de cada uno:
   - No cambiar los prefijos (`tya_`, `vto_`, `srt_`, `vtg_`, `gamehub_`) ni el nombre de las llaves que ya existen.
   - Si un dato cambia de forma, leer el viejo, convertirlo y seguir; nunca borrarlo.
   - Lo nuevo se lee con un valor por defecto.
   - Logros, estrellas, récords, campañas desbloqueadas y lo ganado en el vestidor nunca se reinician ni se quitan.
2. **Los nombres internos (ids)** de modos, escenarios, pistas, personajes, atuendos, logros y retos **no se renombran ni se borran**. Están en lo guardado, en `app/catalog.js`, en los torneos guardados y en el modo en línea. Si hace falta otro, se agrega uno nuevo.
3. **Los otros juegos no cambian.** Tocar un juego no puede mover ni un píxel de los demás (ver §5, paso 2).
4. **Sin conexión, idéntico.** Si el cambio es del modo en línea, de `shared/` o es un reordenamiento que no debería cambiar cómo se juega, el juego sin conexión debe quedar exactamente igual (`test/offline-eq.js`).
5. **El torneo sigue funcionando.** El juego recibe la prueba (`hubPlay`), la arma sin tocar lo guardado y avisa quién ganó (`Hub.result`).
6. **El celular queda igual de bien que el PC**, nunca peor.
7. **En línea:** lo que ve el anfitrión es lo que ven los demás, y debe andar con datos móviles.
8. **Cada juego sigue siendo un solo HTML**, que funciona sin internet, suelto y dentro de GameHub.

## 4. Según el tipo de cambio: qué tocar y qué probar

En cada caso: **qué hacer**, **qué más hay que tocar** y **cómo probarlo**. Los archivos de cada juego están en §6.

### Arreglar un error
- Encontrar la causa real antes de tocar; no tapar el síntoma.
- Si se puede, escribir primero una prueba que muestre el error y que pase después del arreglo.
- Buscar si el mismo error existe en los otros juegos (comparten mucho diseño) y avisar.

### Balance, dificultad o física
- Medir antes y después con partidas entre máquinas. Ejemplos: `species.js` en Ventolera, `balance.js` en Sortilegio, `allsim.js` en Tira y Afloja, `tools/sim.js` en VÉRTIGO.
- Ojo con lo que depende de esos números: la máquina, la campaña y sus estrellas, los jefes y la predicción del modo en línea (usa la misma física).
- Que siga siendo justo para dos personas y que la máquina siga siendo jugable para humanos: ni fácil ni imposible.

### Agregar o cambiar un modo
- **En el juego:** la lógica del modo, su pantalla de preparar y lo que sepa hacer la máquina.
- **Para que entre al torneo:**
  - Agregarlo en `modes` de la ficha del juego en `app/catalog.js`, con el mismo `id`.
  - Que `hubPlay` lo arme y que avise el ganador con `Hub.result`.
  - Para quien ya tenía un torneo armado, aparece apagado hasta que lo prenda (es normal).
- **Para que vaya en línea:** su `id` en `net.modes` del catálogo, y que el adaptador `*-net.js` lo soporte. Probar con `test/netver.js`.
- **Probar:** que el modo termine entre máquinas, que no haya errores y que se vea bien en el celular.

### Agregar un escenario, una pista o una arena
- **Elegir el lugar:** el mejor del mundo para lo que se busca, con un estilo distinto a los que ya hay.
- **En el juego:** sus datos, su arte, su música si el juego la cambia por escenario, y la máquina (que sepa moverse ahí).
- **En la portada:** agregarlo a `maps` (o `arenas`) del catálogo. Si se quiere, una foto en `assets/shots/`.
- **En línea:** que lo propio del escenario (objetos que se mueven o se rompen) también llegue al remoto. Probar con `test/netver.js`.
- **Probar:** que no haya nada metido en el camino ni paredes invisibles, y que el rendimiento en celular siga bien.

### Agregar un personaje (piloto, mago, sabor)
- **En el juego:** sus datos y su arte. Que no rompa el balance (medir).
- **Su lugar en el vestidor**, si el juego tiene atuendos por personaje.
- **Lo que ya existe se conserva:** el orden y los ids. El nuevo va al final o donde el juego lo ponga sin mover a los demás.

### Atuendos y vestidor
- Cada juego tiene su catálogo en su `*-vest.js`.
- Se agrega; no se quita ni se renombra lo que ya existe.
- Lo ya ganado se queda ganado.
- Los atuendos más chéveres deben ser difíciles de conseguir.
- Si se cambia cómo se gana algo, quien ya lo tenía lo conserva.

### Gráficos y efectos
- **Respetar la calidad elegida** (alta, media o ligera, o el ajuste automático): lo nuevo debe tener su versión ligera para el celular.
- **Efectos donde de verdad lucen,** no en todo. Nunca capas oscuras delante de la acción (ya pasó en Ventolera y se quitaron).
- **La nube de Claude no tiene tarjeta gráfica,** así que no se puede juzgar cómo se ve ni qué tan fluido va. Hay que decírselo a Ignacio y pedirle que lo pruebe en su PC y su celular.
- **Probar:** `test/fluidez.js`, la prueba de rendimiento del juego (`perf*.js`, `prof*.js`) y fotos para revisar.

### Música y sonido
- Todo es sintetizado en el juego (WebAudio): no hay archivos de audio.
- Respetar las opciones de volumen y de apagar música o sonido.

### Controles (teclado y táctil)
- **Teclado:**
  - Ventolera, Sortilegio y VÉRTIGO dejan reasignar teclas (`KEY_ACTIONS` en `00-core.js`, guardado en `keys`). Cambiar las teclas de fábrica solo afecta a quien no las cambió.
  - Que J1 y J2 no choquen, y cuidado con las teclas de los teclados latinos (Ñ, Alt Gr).
- **Celular:** que ningún botón tape la acción y que los dedos de uno no le roben toques al otro.
- **Actualizar los textos:** `keys` y `touch` de la ficha en `app/catalog.js`, la ayuda de Controles del juego y su escuela o tutorial.

### Textos, menús y pantallas
- Probar en PC, celular de lado y celular parado: nada cortado ni encimado.
- Si el juego ganó algo nuevo que valga la pena contar, actualizar `desc` y `extras` de su ficha en el catálogo.

### Portada de GameHub y torneo
- **Dónde está:** `app/app.js` (vistas, lanzador, torneo, ajustes, copia de seguridad), `app/torneo.js` (motor del torneo) y `app/app.css`.
- **Lo guardado por la portada** (`gamehub_…`) sigue las mismas reglas que el progreso de los juegos.
- **Probar:** `test/ui.js`, `test/flujo.js`, `test/tablero.js`, `test/motor.js`, `test/elegir.js` y `test/app.js` (actualizar sin perder nada, sin internet, copia de seguridad).

### Modo en línea
- Leer antes la especificación y la bitácora en [ONLINE.md](ONLINE.md), y anotar ahí lo que se cambie.
- **Probar:**
  - La del juego: `test/netvtg.js`, `netvto.js`, `netsrt.js` o `nettya.js`.
  - `test/netver.js` (lo que ve el anfitrión lo ve el remoto).
  - `test/netmovil.js` (datos móviles).
  - `test/offline-eq.js` (sin conexión idéntico).
- **Campañas en línea** (desde la cuarta tanda, ver [TANDA4.md](TANDA4.md)): todas siguen el mismo patrón. En el
  catálogo son un `extra` con `seats: 2`, `watch: true`, `maps: []`. La cfg llega sin nivel (−1 o `null`): el anfitrión
  ve su propio mapa de campaña en modo en línea («Volver a la sala») y los demás un aviso (`NetPlay.notice`). Al elegir,
  `NetGame.again(nivel)` (VÉRTIGO: `NetGame.pick(ch)`). Al terminar, **cada aparato con jugadores guarda lo ganado en su
  propio progreso**; solo el anfitrión ve «Siguiente / Repetir / Elegir». Pruebas: `test/netcamp-srt.js`,
  `nettrav-vto.js`, `netcamp-tya.js`, `netcamp-vtg.js` (usan el servidor local de `servidor/` en el puerto 8799 para que
  cada aparato tenga su propio almacenamiento).
- La sala avisa si un aparato tiene **otra versión** de GameHub (`info.v` en `app/online.js`): los modos nuevos necesitan
  la misma en todos.

### Archivos de `shared/` (los usan los cuatro)
- Cualquier cambio aquí llega a los cuatro juegos: se prueba en los cuatro.
- Si algo debe ser distinto para un solo juego, se controla con un dato propio de ese juego (por ejemplo, en su `GAME_META`), y los demás siguen igual.
- **Probar:** `bash test/todo.sh` completo.

## 5. Cómo comprobar que no se dañó nada

**1. Construir:**
```sh
node build.js
```

**2. Ver qué juegos cambiaron:**
```sh
git status --short docs/games
```
Solo debe aparecer el juego que se tocó. Si sale otro, algo compartido cambió: revisar antes de seguir. `docs/index.html`, `docs/sw.js` y `docs/version.json` siempre cambian, porque llevan la fecha y eso es normal. La app solo avisa «Hay una versión nueva» si cambió algo de verdad. También cambian los `juegos/<juego>/test/index.html`: son copias para las pruebas y no importan. Se pueden devolver con `git checkout -- juegos/*/test/index.html`, pero no se borran: el `build.js` de VÉRTIGO necesita esa carpeta.

**3. Pruebas propias del juego.** Cada `juegos/<juego>/build.js` escribe `juegos/<juego>/test/index.html`, y sus pruebas lo abren:
```sh
node juegos/sortilegio/test/boot.js   # arranca en PC y celular sin errores
node juegos/sortilegio/test/modes.js  # los modos terminan entre máquinas
```
En §6 están las pruebas principales de cada juego.

**4. Pruebas de GameHub:**
```sh
bash test/todo.sh    # todas (levanta su propio servidor)
```
O solo las del tema (§4), con el servidor andando: `cd docs && python3 -m http.server 8765`.

**5. Sin conexión idéntico,** cuando el cambio no debía cambiar cómo se juega:
```sh
BASE=HEAD FAST=1 node test/offline-eq.js <juego>
```
Esto compara la última versión subida contra la nueva. Para comparar contra un commit más viejo, primero hay que traer la historia: `git fetch --depth=300 origin main`.

**6. Playwright.** Si sale «Executable doesn't exist», la versión de Playwright no coincide con los navegadores instalados. En la nube de Claude están en `/opt/pw-browsers`. Hay que instalar la versión que les corresponde (hoy, `npm i -D playwright@1.63`). Ese cambio en `package.json` no se sube.

**7. Prueba real.** Lo que dependa de cómo se ve, de cómo se siente o de una red de verdad lo tiene que probar Ignacio. Decirle exactamente qué mirar.

## 6. Mapa de cada juego

Los cuatro tienen la misma base:
- `Store.get/set`: el guardado, con su prefijo.
- `GAME_META`: el id, el nombre y la versión.
- `Input.read(i)`: los controles del jugador `i`.
- `00h-hub.js`, `00i-fs.js`, `00j-vest.js` y `00k-net.js`: copias de `shared/`. **Se editan en `shared/`, nunca aquí:** `build.js` las pisa.

Para ver las llaves guardadas de un juego: `grep -o "Store\.\(get\|set\)('[a-zA-Z0-9_]*" juegos/<juego>/src/*.js | sort -u`.

### Tira y Afloja (`tira-y-afloja`, `tya_`, `window.TYA`)
Duelo de chicle en 2D (canvas).

| Archivo | Qué es |
|---|---|
| `01-core.js` | Utilidades, colores, sabores (`FLAVORS`), `GAME_META`, `Store`, teclas |
| `02-audio.js` | Sonidos y música (estilos por arena) |
| `03-arena.js` | Motor de arenas (`ARENA_DEFS`, `ARENA_LIST`) |
| `03a-art.js` | Arte común |
| `03b` a `03j` | Una arena por archivo: pupitre, gimnasio, laboratorio, cafetería, arte, biblioteca, bus, profe y torre |
| `04-rope.js` | El hilo (elasticidad, temperatura) |
| `05-player.js` | El chicle: física, maniobras y dibujo |
| `06-fx.js` | Efectos y textos sobre el mundo |
| `07-game.js` | Flujo de partida (rondas, caneca, música por arena) |
| `07b-tutorial.js` | Tutorial |
| `07c-fiesta.js` | Modo Fiesta (ruleta de sorpresas) |
| `07d-modos.js` | Modos: atrapa chicles, rey, gol, escalada |
| `07e-progreso.js` | Logros, accesorios y premios |
| `07f-retos.js` | Retos de técnica |
| `07g-jefes.js` | Jefes |
| `07h-campana.js` y `07i-salas.js` | Campaña de 30 salas por zonas |
| `07j-entreno.js` | Entrenamiento |
| `08-bot.js` | La máquina (también la Fuga cooperativa) |
| `08b-tactil.js` | Controles táctiles |
| `09-ui.js` | Pantallas, opciones y `hubPlay` |
| `09b-vest.js` | Catálogo del vestidor |
| `09c-net.js` | Adaptador en línea (juegan 2, los demás miran) |

Pruebas principales: `boot.js`, `modes.js`, `chaos.js`, `screens.js`, `mobile.js`, `touch.js`, `camp.js` y `allsim.js` (en `juegos/tira-y-afloja/test/`).

### Ventolera (`ventolera`, `vto_`, `window.VTO`)
Duelo aéreo en 2D (canvas).

| Archivo | Qué es |
|---|---|
| `00-core.js` | Azar con semilla, ruido, `GAME_META`, `Store`, teclas (`KEY_ACTIONS`) |
| `01-touch.js` | Palanca flotante y botones táctiles |
| `02-world.js` | Escenarios (`ARENAS`, `ARENA_ORDER`): suelo, edificios, objetos, viento |
| `03-bird.js` | Vuelo y pilotos (`SPECIES`) |
| `04-pilot.js` | La máquina |
| `04b-combat.js` | Balas, misiles, bengalas y cajas |
| `04c-style.js` | Maniobras con nombre y Adrenalina |
| `04d-school.js` | Escuela de vuelo |
| `04e-modes.js` | Modos (`MODES`, `MODE_ORDER`) y recorridos de la Carrera |
| `04f-boss.js` | Jefe La Sombra |
| `04g-weather.js` | Clima: rayos, avión, ráfagas |
| `04h-progress.js` | Logros (`ACHIEVEMENTS`) y récords |
| `04i-coast.js` | Galeón y cañones (Cartagena) |
| `04j-travel.js` | Travesía (`STAGES`) |
| `04k-copa.js` | Copa |
| `04l-team.js` | Juego en equipo y maletín |
| `05-art-world.js`, `05b-art-city.js`, `05c-art-capa.js` | Arte de los escenarios |
| `06-art-pilot.js` | Pilotos y pinturas |
| `06b-art-fx.js` | Explosiones y efectos |
| `06c-post.js` | Acabado: resplandor, color, viñeta |
| `07-sound.js` y `07b-music.js` | Sonido y música (por escenario) |
| `08-game.js` | Partida y cámara |
| `09-ui.js` | Pantallas y `hubPlay` |
| `09b-vest.js` | Hangar (vestidor) |
| `09c-net.js` | Adaptador en línea |

Pruebas principales: `boot.js`, `modes.js`, `soakall.js`, `screens.js`, `devices.js`, `perfcel.js`, `species.js`, `race.js`, `boss.js` y `trav.js`.

### Sortilegio (`sortilegio`, `srt_`)
Duelo de magos en 2D (canvas).

| Archivo | Qué es |
|---|---|
| `00-core.js` | Utilidades, `GAME_META`, `Store`, teclas (`KEY_ACTIONS`) |
| `01-touch.js` | Controles táctiles (palanca, dos manos, rombo de fusión) |
| `02-magic.js` | Elementos, hechizos y fusiones (`ELEMENTS`, `SPELLS`, `FUSIONS`) y magos (`CHAR_ORDER`) |
| `03-terrain.js` y `03b-arenas.js` | Terreno y escenarios (`ARENAS`, `ARENA_ORDER`) |
| `04-mage.js` | El mago: vida, daño, efectos |
| `05-spells.js` y `05b-spells2.js` | Cómo actúa cada hechizo |
| `06-bot.js` | La máquina |
| `07-modes.js` | Modos (`MODES`, `MODE_ORDER`), runas y el tejo |
| `07b-events.js` | Presagios del escenario |
| `07c-creatures.js` | Espantos y criaturas |
| `07d-campaign.js` | Campaña |
| `08-game.js` | Partida |
| `09-fx.js` | Efectos |
| `10-art-ground.js` a `10g-art-beasts.js` | Arte: suelo, magos y atuendos, hechizos, luces, HUD, acabado y criaturas |
| `11-sound.js` y `11b-music.js` | Sonido y música (por escenario) |
| `12-ui.js` | Pantallas y `hubPlay` |
| `12b-net.js` | Adaptador en línea |
| `13-progress.js` | Logros y escuela |
| `13b-vest.js` | Catálogo del vestidor |

Pruebas principales: `boot.js`, `modes.js`, `chaos.js`, `screens.js`, `balance.js`, `spells.js`, `touch.js` y `camp.js`.

### VÉRTIGO (`vertigo`, `vtg_`, `window.__vtg`)
Carreras en 3D (three.js r128, en `vendor/`).

| Archivo | Qué es |
|---|---|
| `00-core.js` | `GAME_META`, `Store`, calidad gráfica (`gq`), teclas (`KEY_ACTIONS`) |
| `01-track.js` | La pista: curva, muestras y zonas (tierra, agua, aire, pueblo) |
| `02-tracks.js` | Pistas (`TRACKS`, `TRACK_ORDER`), arenas (`ARENA_ORDER`) y copas (`CUPS`) |
| `03-car.js` | El bólido y los pilotos (`PILOTS`, `PILOT_ORDER`) |
| `03b-items.js` | Objetos y especiales |
| `04-race.js` | Carrera y máquina |
| `04b-modes.js` | Modos (`MODE_NAMES`, reglas, lecciones) |
| `04c-boss.js` | Jefes y minijefes |
| `04d-world.js` | Vuelta al mundo (campaña) |
| `04e-challenge.js` | Retos |
| `05-gfx-world.js` | Mundo 3D, terreno y agua |
| `05b-scenery.js`, `05c`–`05n` | Escenografía de cada pista |
| `05g-post.js` | Acabado |
| `05h-props.js` | Utilería |
| `05i-arenas.js` | Arenas |
| `06-gfx-car.js` | El bólido en 3D y el garaje (pinturas, neón, turbo) |
| `07-gfx-fx.js` a `07d-gfx-mini.js` | Efectos, objetos, jefes y minijefes en 3D |
| `08-hud.js` | HUD |
| `09-touch.js` | Táctil |
| `10-sound.js` y `10b-music.js` | Sonido y música |
| `11-ui.js` | Pantallas, opciones y `hubPlay` |
| `11b-world.js` | Mapa de la Vuelta al mundo |
| `11c-vest.js` | Catálogo del garaje y estudio 3D |
| `12-main.js` | Bucle, cámaras, vistas y arranque |
| `12b-net.js` | Adaptador en línea |

Pruebas: sus pruebas de navegador no quedaron en el repositorio. Sin navegador hay `node juegos/vertigo/tools/sim.js <pista> <máquinas> <nivel>` (carreras de la máquina) y `node juegos/vertigo/tools/check.js <pista>` (largo, curvas y cruces de una pista). Con navegador, las de GameHub: `test/flujo.js`, `test/netvtg.js`, `test/netvtgmodos.js`, `test/fluidez.js` y `test/pantalla.js` (con `VIEW=400x225` y `VTG_GQ=0` sin tarjeta gráfica). Si se hace un cambio grande en VÉRTIGO, vale la pena dejar una prueba propia en `juegos/vertigo/test/`.

### Portada de GameHub (`app/`, `gamehub_`, `window.GAMEHUB`)

| Archivo | Qué es |
|---|---|
| `catalog.js` | La ficha de cada juego: modos, escenarios, teclas, en línea |
| `torneo.js` | El motor del torneo (serie, liga, eliminatoria, rey de la pista) |
| `app.js` | Portada, ficha, lanzador de juegos, asistente y tablero del torneo, campeón, salón de la fama, ajustes, app instalable, copia de seguridad (`PREFIXES`) |
| `net.js` | Red en línea: MQTT, WebRTC, relevo, sucesión del anfitrión |
| `online.js` | La sala en línea y el torneo en línea |
| `app.css` e `index.html` | Estilo y plantilla |

## 7. Publicar y dejar registro

1. **Subir la versión** del juego en su `GAME_META.version` (por ejemplo, 3.5 → 3.6).
2. **Construir y probar** (§5).
3. **Commit** con un mensaje claro en español (qué cambió y por qué), y **push** a `main` (o a la rama del trabajo).
4. **Republicar los artefactos** de claude.ai, si Ignacio los usa:
   - El del juego suelto: con `docs/games/<juego>.html` como su página.
   - El de GameHub: con `docs/`.

   | | Juego suelto | Documento de diseño (con bitácora) |
   |---|---|---|
   | GameHub | https://claude.ai/artifact/W2tSVHQkEKEYmHc8AYdgZt | (este repositorio) |
   | Tira y Afloja | https://claude.ai/artifact/HHry5BiETArBYT4ZaGN4Us | https://claude.ai/artifact/VqS6xfGbQaKrtNm4gMtXeg |
   | Ventolera | https://claude.ai/artifact/CWgu3rG8JHwRmvSRviL3Ak | https://claude.ai/artifact/3p4Jk1vUNnNLNnfwkwW4B9 |
   | Sortilegio | https://claude.ai/artifact/M65F6mgqGkHSsen7TpaDw8 | https://claude.ai/artifact/43yUYNNeWFqRKVRbc1X8BS |
   | VÉRTIGO | https://claude.ai/artifact/BhZX8m3rpkkRQHnXBqxF7U | https://claude.ai/artifact/4YT9c9uKJ41mKq8yhRZfd4 |

5. **Bitácora:** agregar una fila en la bitácora del documento de diseño del juego, con la fecha, la versión y qué cambió.
6. **Contarle a Ignacio** en dos o tres frases:
   - Qué cambió.
   - Qué debe probar, y dónde (PC o celular).
   - Antes de jugar en línea, **todos deben actualizar** (la app avisa «Hay una versión nueva»). Si se juntan versiones distintas, la partida en línea puede no cuadrar.
