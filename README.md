# GameHub

**Cuatro juegos para dos en un solo lugar, cada uno en su propio mundo, y un torneo combinado para jugar con los amigos.**

| | Juego | Qué es |
|---|---|---|
| 01 | **Tira y Afloja** | Duelo de chicle: dos chicles unidos por un hilo pelean en el colegio. Tirar te hace pesado, aflojar te vuelve ágil. |
| 02 | **Ventolera** | Duelo de alas de chorro: persecuciones, misiles, bengalas y maniobras entre palmas, rascacielos, galeones y globos. |
| 03 | **Sortilegio** | Duelo de magos: un elemento en cada mano, 28 fusiones, reacciones con el terreno y el Gran Sortilegio. |
| 04 | **VÉRTIGO** | Carreras en 3D: derrapes, lancha, alas, objetos y batallas por 10 pistas del mundo, en pantalla dividida. |

Los cuatro se juegan de a dos en el mismo computador (cada uno con su lado del teclado) y también en el celular.

## Cómo funciona

- **GameHub es solo el lugar donde viven los cuatro.** Al elegir un juego, se abre completo en su propio marco: no comparte nada con los otros.
- **Cada juego guarda lo suyo por separado** (ajustes, teclas, récords, campañas) con su propio prefijo: `tya_`, `vto_`, `srt_`, `vtg_`. GameHub guarda lo suyo con `gamehub_`.
- **Pantalla completa automática** al abrir un juego (en el celular, además, horizontal). Cada juego tiene en *Opciones* su botón para ponerla o quitarla a mano, y suelto también se pone sola con el primer toque (se puede apagar).
- **Torneo combinado:** de 2 a 8 jugadores, en serie mano a mano, liga, eliminatoria o rey de la pista. Cada prueba se sortea entre los juegos, modos y escenarios que se dejen encendidos; los personajes pueden elegirse, salir al azar o ser los de siempre. Al terminar cada partida, el juego avisa quién ganó y el resultado se anota solo (también se puede anotar a mano).
- **Salón de la fama:** los campeones de cada torneo terminado, con copas, podios y pruebas ganadas.
- **En línea (varios aparatos):** botón *En línea* → uno crea la sala (es el anfitrión: ahí corre la partida) y los demás entran con el código de 5 letras o el enlace. Cada aparato dice cuántos juegan en él (1 o 2) con nombre y color, así que se puede todo: cada uno con su celular, un celular con dos y otro con uno, PC y celulares mezclados. VÉRTIGO, Ventolera y Sortilegio son de **hasta 4**; Tira y Afloja es de 2 (el hilo une a dos) y **los demás miran en vivo**. Todos los modos de GameHub van en línea (en VÉRTIGO además el **Gran Premio**; en Tira y Afloja, el **Modo Fiesta**). **Tu personaje responde al instante** también en el aparato remoto (se predice con la misma física del juego y se corrige suave con lo del anfitrión). Si el anfitrión se va, **la sala sigue** con el siguiente aparato y el mismo código. **Con datos móviles:** si la conexión directa se corta (cambio de antena, señal floja), va por el relevo y **vuelve sola** a la directa; nadie se queda en la partida anterior (la siguiente partida, los resultados y «empezó / volvimos a la sala» se repiten hasta que llegan); si va lento, sale un aviso chiquito «Red lenta». También hay **torneo en línea** con los de la sala y su campeón entra al Salón de la fama de todos (marcado «en línea»). En *Ajustes → En línea* se puede **probar la conexión** de la red en la que estás y poner un TURN propio. Técnica: WebRTC directo entre aparatos (señales por brokers MQTT públicos cifradas con el código; TURN y relevo de respaldo), el anfitrión simula y manda instantáneas 30 veces por segundo; gasta ≈1–2 MB por minuto. Detalle y bitácora en [ONLINE.md](ONLINE.md). Solo funciona desde la dirección de GitHub Pages o la app instalada (no dentro de vistas previas).
- **App instalable** con botón *Instalar* (Android, PC y Mac; en iPhone se explica cómo: Compartir → «Agregar a inicio»). Funciona sin internet y se actualiza sola.

## Actualizar sin perder el progreso

El progreso de cada persona vive en el almacenamiento de su navegador (para la dirección de GitHub Pages), no en los archivos de la app. Cuando se sube una versión nueva:

1. El *service worker* (`docs/sw.js`) siempre pide primero lo más nuevo a la red y guarda una copia para usar sin internet.
2. La app revisa `docs/version.json`; si cambió, avisa «Hay una versión nueva» y se actualiza con un toque (nunca en medio de una partida).
3. El progreso no se toca: está en otro lugar y cada juego, al cargar, mezcla lo guardado con valores por defecto (lo nuevo que traiga una versión arranca con su valor por defecto).

Reglas para que eso siga siendo cierto:

- **No cambiar** el nombre del repositorio ni el usuario de GitHub (cambia la dirección y el navegador lo trata como otra app).
- **No cambiar** los prefijos `tya_`, `vto_`, `srt_`, `vtg_`, `gamehub_`, ni el nombre de las llaves que ya existen. Si un dato cambia de forma, leer el viejo y convertirlo; nunca borrarlo.
- Al agregar cosas nuevas (mundos, modos, logros), darles valor por defecto al leer: `Object.assign({ …por defecto… }, Store.get('llave', {}))`.
- En *Ajustes → Tu progreso* hay **copia de seguridad** (guardar y restaurar, como archivo o como texto), por si alguien cambia de celular o borra los datos del navegador.

## Carpetas

```
docs/                 la página lista para publicar (GitHub Pages: rama main, carpeta /docs)
  index.html          la portada (todo incrustado)
  games/*.html        cada juego, en un solo archivo que funciona sin internet
  assets/             galaxia, fotos de los juegos e íconos
  manifest.webmanifest, sw.js, version.json   app instalable, sin internet, avisos de versión
app/                  código de la portada: index.html, app.css, catalog.js, torneo.js, app.js
shared/               lo que comparten los cuatro juegos:
  hub-link.js         el enlace GameHub ↔ juego  (se copia como src/00h-hub.js)
  fullscreen.js       la pantalla completa       (se copia como src/00i-fs.js)
juegos/<juego>/       el código de cada juego: src/, assets/, build.js (y vendor/ en VÉRTIGO)
assets/               galaxia.jpg, letras, fotos e íconos (fuente de docs/assets)
tools/                galaxia.js (la nebulosa), iconos.js, capturas.js (fotos), sync-juegos.js
test/                 pruebas con Playwright
build.js              arma todo en docs/
```

## Construir y probar

Necesita [Node.js](https://nodejs.org/) 18 o más nuevo.

```sh
node build.js            # construye los 4 juegos y la portada en docs/
node build.js --solo-app # solo la portada
```

Para probarla en el computador hace falta un servidor, por ejemplo:

```sh
cd docs && python3 -m http.server 8765   # y abrir http://localhost:8765
```

Pruebas (con el servidor andando; usan Playwright, `npm i -D playwright`):

| | |
|---|---|
| `node test/ui.js` | pantallas de la portada en PC, celular de lado y celular parado |
| `node test/flujo.js` | cada juego abre aislado, vuelve con «⌂ GameHub» y una prueba de torneo anota sola el ganador |
| `node test/elegir.js` | torneo con «cada quien elige» personajes |
| `node test/tablero.js` | tableros de los 4 formatos de torneo, campeón y salón de la fama |
| `node test/motor.js` | 1225 torneos simulados (sin navegador) |
| `node test/fluidez.js` | cuadros por segundo de cada juego suelto vs. dentro de GameHub |
| `node test/pantalla.js` | pantalla completa automática y manual, dentro y fuera de GameHub |
| `node test/app.js` | app instalable: actualizar sin perder el progreso, sin internet y copia de seguridad |
| `node test/net.js` · `node test/sala.js` | red (WebRTC real entre pestañas) y sala en línea |
| `node test/netvtg.js` · `netvto.js` · `netsrt.js` · `nettya.js` | cada juego en línea (con `TRES=1`: 3 aparatos o un mirón; con `RED='netloss=0.15&netlag=120'`: red mala) |
| `node test/nettour.js` · `node test/netcel.js` | torneo en línea con 3 aparatos · celular táctil como remoto |
| `node test/netdatos.js` | datos por minuto de cada juego (`RELEVO=1`: sin WebRTC) |
| `node test/offline-eq.js` | **sin conexión idéntico**: la versión de antes del en línea contra la actual, mismo azar, reloj y teclas; estado completo e imagen iguales en todos los modos |
| `node test/netpred.js` | el personaje propio responde al instante en el remoto (con y sin predicción, `SIN=1`), con red mala simulada |
| `node test/netsucc.js` | si el anfitrión se va, la sala sigue con el siguiente aparato; el torneo sigue |
| `node test/netvtgmodos.js` | VÉRTIGO en línea: mano a mano, eliminación, batalla y Gran Premio |

En un computador sin tarjeta gráfica, VÉRTIGO va muy lento en las pruebas: usar `VTG_GQ=0` (gráficos ligeros) y, en `fluidez.js` y `pantalla.js`, `VIEW=640x360`.

## Publicar en GitHub Pages

1. Repositorio público llamado `gamehub` con todo esto en la rama `main`.
2. *Settings → Pages → Build and deployment*: **Deploy from a branch**, rama `main`, carpeta **`/docs`**, *Save*.
3. En uno o dos minutos queda en `https://<usuario>.github.io/gamehub/`.

Si Pages quedó publicando desde la raíz (`/ (root)`) en vez de `/docs`, igual funciona: el `index.html` de la raíz lleva a `docs/` (y `.nojekyll` evita que GitHub procese los archivos).

Cada vez que se sube un cambio a `main`, GitHub vuelve a publicar solo, y las apps instaladas se enteran.

## Enlace GameHub ↔ juego

Cada juego incluye `src/00h-hub.js` (copia de `shared/hub-link.js`). Si el juego corre suelto, no hace nada. Dentro de GameHub:

- el juego avisa `ready`, y en su portada aparece **⌂ GameHub**;
- para una prueba de torneo, GameHub manda `{ cmd: 'play', ev: { mode, map, rounds, chars, opts } }` y el juego la arma **sin tocar lo que tiene guardado**;
- al terminar, el juego responde `{ event: 'result', winner: 0 | 1 | -1 }` y muestra **Continuar torneo ▸**;
- pantalla completa: el juego pide `{ event: 'fs', on }` y GameHub la pone en toda la ventana (y le avisa `{ cmd: 'fs', on }`).

## Licencias

Letras Bungee, Fredoka, Nunito, Comfortaa, Macondo y Russo One: SIL Open Font License. VÉRTIGO usa three.js r128 (licencia MIT). La galaxia de fondo es generada por `tools/galaxia.js`.
