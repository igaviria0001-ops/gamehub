# Guía: un juego nuevo para GameHub

> **Solo para juegos que van a vivir en GameHub.** Si el juego no va a GameHub, nada de esto aplica: se hace libre, en su propio repositorio.

Esta guía separa tres cosas:

1. **Lo libre:** casi todo.
2. **La base obligatoria:** lo mínimo para convivir con los otros juegos sin romper nada, igual para cualquier estilo.
3. **Lo que cambia según el tipo de juego:** las fichas A a F.

Las reglas generales del repositorio están en [CLAUDE.md](CLAUDE.md).

---

## 1. Lo libre

Género, 2D o 3D, estilo visual y letras, cuántos juegan, controles, duración, modos, escenarios y música.

**Un juego nuevo no tiene que parecerse a los cuatro actuales.** GameHub se adapta al juego (toma sus colores, su logo y sus fotos); el juego no se adapta a GameHub.

Lo que sí vale siempre son las prioridades de Ignacio (ver CLAUDE.md):
- El juego primero.
- Primero el computador y luego un celular igual de bueno.
- En línea después.
- Cada escenario en el mejor lugar del mundo para lo que se busca.

---

## 2. Base obligatoria (cualquier estilo)

1. **Carpeta y armado.** `juegos/<id>/` lleva:
   - `src/template.html`, con `/*__SCRIPTS__*/` y, si usa letras propias, `/*__FONTS__*/`.
   - `src/NN-nombre.js`: se unen en orden alfabético, así que el número define el orden.
   - `assets/`.
   - Un `build.js` que recibe la ruta de salida como primer argumento y escribe un solo HTML, además de `test/index.html` para sus pruebas. Copiar el de `juegos/sortilegio/build.js`, o el de `juegos/vertigo/build.js` si usa three.js.
   - El `<id>` va en minúsculas con guiones y no cambia nunca.
2. **Un solo archivo HTML con todo adentro:** fuentes en base64, librerías incrustadas e imágenes hechas por código o incrustadas. Nada de archivos aparte ni de internet: dentro de GameHub el juego corre en un `iframe` con `srcdoc`, donde las rutas relativas no funcionan, y además tiene que andar sin conexión.
3. **`GAME_META` global**, por ejemplo en `src/00-core.js`:
   ```js
   const GAME_META = { id: '<id>', name: '<Nombre>', version: '1.0', storagePrefix: '<xyz>_' };
   ```
   Subir `version` en cada entrega (GameHub la registra).
4. **Prefijo propio** para todo lo que se guarde en `localStorage`. Son 3 letras más `_`, distintas de `tya_`, `vto_`, `srt_`, `vtg_` y `gamehub_`. Se lee siempre con valores por defecto y no se cambia nunca después de publicar. El juego comparte el almacenamiento con la portada y con los otros juegos: el prefijo es lo único que los separa.
5. **Enlace con GameHub.** `build.js` copia `shared/hub-link.js` como `src/00h-hub.js` (objeto `Hub`). El juego debe:
   - Llamar `Hub.ready()` cuando ya puede recibir órdenes.
   - Tener en su portada un botón **⌂ GameHub** con clase `hub-home`, visible solo dentro de GameHub (`html.in-hub .hub-home`), que llame `Hub.exit()`. El CSS de ejemplo está en `juegos/ventolera/src/template.html`.
   - Funcionar igual cuando corre suelto, sin mostrar nada de esto.
6. **Pantalla completa.** `build.js` copia `shared/fullscreen.js` como `src/00i-fs.js` (objeto `FS`). En *Opciones* van:
   - Un botón que llama `FS.toggle()`.
   - La opción «Automática» (`FS.auto`), oculta dentro de GameHub con `html.in-hub .fs-auto { display: none }`.

   En el celular, `FS` pone la pantalla **horizontal**. Si el juego es vertical, ver la ficha D.
7. **No dañar a los otros juegos.** Si se cambia algo en `shared/`, los otros cuatro deben quedar idénticos: correr `node test/offline-eq.js`. Un ajuste para un solo juego se hace con un dato en su `GAME_META` (por ejemplo, `orientation: 'portrait'`), y lo que no tenga el dato sigue como antes.

`build.js` también copia `vestidor.js` y `netplay.js` a cada juego. Si el juego no los usa, no estorban: no hacen nada sin el catálogo o el adaptador del juego.

---

## 3. Torneo combinado

El torneo es siempre **mano a mano**: cada prueba enfrenta a J1 contra J2.

- GameHub llama al gancho de `Hub.onPlay(ev)` con:
  ```js
  ev = { id, game, mode, map, rounds, chars: 'pick' | 'random' | 'keep', title, p1, p2, opts }
  ```
  El juego arma esa partida **sin tocar lo guardado** (último modo, ajustes, personajes): guarda lo que cambie y lo devuelve al terminar.
- Según `chars`:
  - `'pick'`: abre su pantalla de elegir personajes con el modo y el escenario ya puestos.
  - `'random'`: sortea los personajes.
  - `'keep'`: usa los de siempre.
- Al terminar:
  1. `Hub.result(0 | 1 | -1, { score: '3 – 1' })`, una sola vez (0 = gana J1, 1 = gana J2, −1 = empate).
  2. `Hub.release()`.
  3. En la pantalla de resultados, un botón **Continuar torneo ▸** que llame `Hub.exit()`.
- Si el jugador sale a medias (pausa → salir): `Hub.leave()`.
- Ejemplos para copiar: `hubPlay` y `hubStart` en `juegos/ventolera/src/09-ui.js`, y `juegos/sortilegio/src/12-ui.js`.

**Si el juego no tiene nada justo para un mano a mano** (fichas C y E), puede quedar fuera del torneo:
- Poner `tour: false` en su ficha del catálogo.
- Filtrar con `g.tour !== false` donde se arma el banco del torneo: `defaultPool()` y la lista de juegos del asistente (`gpool`, dentro de la vista del torneo) en `app/app.js`, y `makeEvent` en `app/torneo.js`.

Ese campo todavía no existe: se agrega la primera vez que haga falta.

---

## 4. Fichas por tipo de juego

Cada juego nuevo cae en una ficha o mezcla varias. La ficha dice qué cambia frente a la base.

### A. Duelo en tiempo real para dos (como los cuatro actuales)
- **PC:** dos jugadores en un teclado. J1 a la izquierda (WASD y letras cercanas); J2 a la derecha (flechas o IJKL y letras cercanas). Cuidado con las teclas raras de los teclados latinos (Ñ, Alt Gr, Ctrl derecho) y con que no se bloqueen al apretar varias a la vez.
- **Celular:** cada uno en su mitad de la pantalla, con palanca o flechas y botones.
- **Torneo:** directo, gana J1 o J2.
- **En línea (después):** hasta 4 jugadores si el juego lo permite, como Ventolera y Sortilegio.

### B. Carreras o fiesta de 3 o más
- **Local:** 2 humanos y la máquina completa el resto. Pantalla dividida si cada uno necesita su cámara (como VÉRTIGO), o una sola cámara si caben todos.
- **Celular:** la pantalla dividida queda chica. Preferir una vista compartida cuando se pueda; si no, letras e indicadores grandes.
- **Torneo:** gana el que quede más adelante de los dos humanos, como la Carrera de VÉRTIGO.
- **En línea:** lo natural es hasta 4 humanos, con la máquina completando.

### C. Cooperativo (juntos contra el juego)
- **Torneo:** no hay ganador entre los dos. Hay dos caminos:
  - Un modo competitivo aparte para el torneo (por ejemplo, quién hace más puntos dentro del mismo reto).
  - `tour: false` (ver §3).
- **En línea:** encaja muy bien. Ya hay un ejemplo: el Jefe en pareja de Ventolera.

### D. Por turnos (tablero, cartas, preguntas, estrategia)
- **PC:** se comparte el teclado o el mouse por turnos. Si hay información oculta (como cartas en la mano), en un solo aparato hay que tapar la pantalla entre turnos («pasa el aparato»), o que cada uno juegue en su celular en línea.
- **Celular:** puede quedar mejor en vertical. Si es así, agregar `orientation` a `GAME_META` y hacer que `shared/fullscreen.js` lo respete (los otros cuatro siguen en horizontal).
- **Torneo:** directo.
- **En línea:** es el caso más fácil. No hacen falta instantáneas 30 veces por segundo: basta mandar cada jugada por el canal confiable (`NetPlay.send(d, true)`), y el anfitrión la valida.

### E. Por puntaje o récord (de a uno)
- **Local:** se juega por turnos (J1 y luego J2 en el mismo reto) o los dos al mismo tiempo en pantalla dividida.
- **Torneo:** los dos juegan con la misma semilla (el mismo azar) y gana el mejor puntaje, que se reporta con `Hub.result`.
- **En línea:** cada uno juega en su aparato con la misma semilla y se comparan los puntajes. No hace falta un anfitrión que simule.

### F. 3D (three.js) o gráficos pesados
- **three.js:** usar el mismo de VÉRTIGO (`juegos/vertigo/vendor/three.r128.min.js`), incrustado igual que en su `build.js`. Si se quiere una versión más nueva, va en el `vendor/` del juego nuevo; la de VÉRTIGO no se toca.
- **Calidad:** opciones de gráficos (alta, media, baja), y que baje sola si el aparato no da.
- **Pruebas:** la nube de Claude no tiene tarjeta gráfica. Ahí se comprueba la lógica, pero no se puede saber qué tan bonito o fluido se ve. Para eso hay que probarlo en el PC y el celular de Ignacio, o usar Claude Code en su PC.
- En la nube, correr `test/fluidez.js` y `test/pantalla.js` con un `VIEW` pequeño.

---

## 5. Extras opcionales (después del juego)

- **Vestidor** (`src/00j-vest.js`, objeto `Vest`):
  - Comparte rarezas, materiales, auras, estelas, la pantalla del vestidor y la ceremonia de «¡Nuevo!». El juego pone su catálogo y cómo dibujar a su personaje.
  - Ejemplos: `juegos/sortilegio/src/13b-vest.js` y `juegos/tira-y-afloja/src/09b-vest.js`.
  - Se guarda como `<prefijo>vest` y lo ganado nunca se quita.
  - En un juego sin personajes puede ser otra cosa (tableros, cartas, pistas) o nada.
  - Los atuendos más chéveres deben ser muy difíciles de conseguir.
- **En línea** (`src/00k-net.js`, objeto `NetPlay`):
  - El juego pone su adaptador `NetGame = { seatsMax, readLocal(li), neutral(), snap(), apply(a, b, k), event(e), start(cfg) }`.
  - Especificación en [ONLINE.md](ONLINE.md) («Especificación F3»). Ejemplos: `12b-net.js` en VÉRTIGO y Sortilegio, y `09c-net.js` en Ventolera y Tira y Afloja.
  - En la ficha del catálogo va `net: { seats, mode, modes, desc }`. Sin `net`, el juego simplemente no aparece en línea.
  - Tiene que andar con datos móviles. Probarlo con `test/netmovil.js` y `test/netver.js` (lo que ve el anfitrión es lo que ve el remoto).
  - El modo sin conexión debe quedar idéntico.

---

## 6. Conectarlo a la portada (archivos que se tocan)

1. **`build.js`:** agregar `['<id>', '<id>']` a `GAMES`. Así se arma, entra a `docs/games/`, al service worker (para jugar sin conexión) y a la versión.
2. **`app/catalog.js`:** su ficha en `GAMES`. El orden de la lista es el orden en la portada.
   - `id`, `file: 'games/<id>.html'`, `name`, `short`, `num` (`'05'`…), `tag` (subtítulo corto), `kind` (el tipo en 2 o 3 palabras), `desc` (1 o 2 frases).
   - Colores `c1`, `c2` y `c3`, `ink` (el fondo oscuro de su mundo) y `font` (la clave de su logo, ver punto 3).
   - `shots`: 4 nombres de fotos (`assets/shots/<nombre>.jpg`, 1280×720, JPEG).
   - `modes: [{ id, name, desc, mins, len?, lenTxt?, map?, maps? }]`:
     - Los `id` son los mismos que usa el juego por dentro.
     - `mins` son los minutos aproximados, para calcular la duración del torneo.
     - `len` son las opciones de largo (rondas o vueltas).
     - `map` fija un escenario; `maps: 'arenas'` usa la lista `arenas`.
   - `maps: [[id, nombre]]`: al menos uno. Si el juego no tiene escenarios, poner uno solo. `extraMaps` y `arenas` son opcionales.
   - `opts`: opciones del torneo, `{ id, name, desc, type: 'bool' | 'seg', def, items? }`.
   - `chars` (true o false) y `charsName` (`'pilotos'`, `'magos'`…).
   - `keys`: **exactamente dos filas**, `[['J1', '…'], ['J2', '…']]`, porque el torneo las muestra.
   - `touch` (una frase sobre cómo se juega en el celular) y `extras` (lo que trae el juego además de los modos).
   - `net` solo cuando tenga modo en línea.
3. **Logo:**
   - En `app/app.js` → `glogo()`, su clase.
   - En `app/app.css` → `.glogo.<clase>`, con su letra y su estilo.
   - Si usa una letra nueva: el archivo en `assets/fonts/` y su `ff(...)` en `build.js`.
4. **Datos guardados viejos.** Sin estos cambios, GameHub se le rompe a quien ya lo usaba:
   - **Banco del torneo.** Donde dice `pool: Store.get('lastPool', null) || defaultPool()`, completar con lo que falte:
     ```js
     const P = Store.get('lastPool', null) || {}, D = defaultPool(); for (const id in D) if (!P[id]) P[id] = D[id];
     ```
   - **Torneos guardados.** En `chooseCard`, cambiar `T.pool[g.id].on` por `T.pool[g.id] && T.pool[g.id].on`: un torneo guardado antes no conoce el juego nuevo (`torneo.js` ya lo hace bien).
   - **Copia de seguridad.** Agregar el prefijo nuevo a `PREFIXES`, o su progreso no entra.
5. **Textos que dicen «cuatro» o «los 4»:**
   - `app/app.js`: portada, torneo y copia de seguridad.
   - `app/index.html`: descripciones y vista previa.
   - El `index.html` de la raíz.
   - `build.js`: el manifest.
   - `README.md`.
   - La tarjeta para compartir (`tools/enlace.js` → `assets/enlace.jpg`).
6. **Pantallas pensadas para 4:** las tajadas de la portada y las rejillas de 4 columnas `.presets` y `.choose` en `app/app.css`. Revisarlas con `node test/ui.js` (PC, celular de lado y celular parado).
7. **Fotos:** con `tools/capturas.js` (cambiando sus rutas a `juegos/<id>/test/index.html`) o con un script propio. Se ocultan las pantallas, se pone una partida entre máquinas y se toma la foto.
8. **Pruebas con la lista de juegos escrita a mano:** `test/flujo.js`, `test/fluidez.js`, `test/pantalla.js`, `test/ui.js` y, si va en línea, las `test/net*.js`. Agregar el juego nuevo.

---

## 7. Orden de trabajo

1. **Diseño.** La idea, qué lo hace nunca antes visto, los modos, los escenarios (el mejor lugar del mundo para cada uno) y los controles en PC y celular. Mostrárselo a Ignacio en un documento de diseño con bitácora, como los otros juegos.
2. **El juego suelto**, en la rama `juego-<id>`. Se prueba solo con `node juegos/<id>/build.js` (que escribe `juegos/<id>/test/index.html`) y con pruebas propias: todos los modos entre máquinas, sin errores.
3. **Celular:** que quede igual de bien que en el PC.
4. **Base obligatoria** (§2) y **torneo** (§3).
5. **Conectarlo a la portada** (§6). Correr `node build.js` y `bash test/todo.sh`.
6. **Publicar:**
   - Unir a `main` y hacer push.
   - Republicar el artefacto de GameHub.
   - Contarle a Ignacio qué debe probar con sus amigos.
7. **Después, si él quiere:** vestidor y en línea, cada uno en su propia rama.

## Lista de chequeo final

- [ ] Un solo HTML; funciona sin internet, suelto y dentro de GameHub.
- [ ] `GAME_META` con prefijo único; todo lo guardado lleva el prefijo y se lee con valores por defecto.
- [ ] Botón ⌂ GameHub y pantalla completa (manual y automática).
- [ ] Torneo: `onPlay` sin tocar lo guardado, `result` una sola vez, botón Continuar torneo y `leave` (o `tour: false`).
- [ ] Ficha en el catálogo, logo, 4 fotos y el juego en `build.js`.
- [ ] `lastPool`, `chooseCard` y `PREFIXES` ajustados.
- [ ] Textos y pantallas de «cuatro» revisados.
- [ ] `bash test/todo.sh` sin fallas, y `offline-eq` idéntico para los otros juegos.
- [ ] Probado en PC y en celular. Si importan los gráficos o la fluidez, probado de verdad por Ignacio.
