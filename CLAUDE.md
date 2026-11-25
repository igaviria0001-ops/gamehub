# CLAUDE.md — reglas para trabajar en GameHub

Este archivo es para Claude (y para quien trabaje en este repositorio). Se lee al empezar cada sesión.

## Alcance

- **Aplica solo a GameHub**: a este repositorio y a los juegos que viven aquí o que se van a agregar aquí.
- **Un juego que no va a GameHub no sigue nada de esto.** Se diseña y se construye libre, con sus propias reglas y su propio repositorio.
- **¿Editar algo que ya existe** (un juego, la portada, el torneo, el modo en línea)? Leer primero [GUIA-EDITAR.md](GUIA-EDITAR.md). Ahí está:
  - Lo que nunca se rompe.
  - Qué tocar y qué probar según el tipo de cambio.
  - El mapa de archivos de cada juego.
  - Cómo comprobar que no se dañó nada.
  - Los enlaces para publicar y anotar en la bitácora.
- **¿Juego nuevo para GameHub?** Leer primero [GUIA-JUEGO-NUEVO.md](GUIA-JUEGO-NUEVO.md). Ahí está la base mínima obligatoria (igual para cualquier estilo) y qué cambia según el tipo de juego. Un juego nuevo **no tiene que parecerse** a los cuatro actuales.

## Quién y cómo

- El dueño es **Ignacio** (GitHub `igaviria0001-ops`). Habla en español; explicarle todo sencillo y sin jerga. Él no corre comandos: si algo le toca a él (en GitHub, en el celular), darle pasos cortos y exactos.
- Si hay una duda que cambia el resultado, preguntarle. Si no, decidir lo más razonable y decirle qué se decidió.
- Los juegos son para jugar **con unos pocos amigos**, no para el público en general.

### Lo que Ignacio quiere en sus juegos (prioridad de arriba a abajo)

1. **El juego primero**: excelente, nunca antes visto, divertido, variado, con muy buenos gráficos. Ese factor «cool» difícil de explicar: efectos solo donde de verdad lucen, no en todo.
2. **Primero el computador** (en los actuales: dos jugadores en un mismo teclado, cada uno con su lado). Después se adapta al **celular**, y esa versión también tiene que quedar perfecta: nunca una versión pobre. No recortar el juego de PC por culpa del celular.
3. **En línea es un extra, no la meta.** Se hace después, reutilizando la base común (`shared/netplay.js`, `app/net.js`), y debe andar con **datos móviles**, no solo con wifi. No limitar el diseño para que quepa en línea.
4. **Lugares del mundo**: cada escenario en el mejor lugar del mundo para lo que se busca, con estilos variados. Colombia solo donde encaja perfecto, no por obligación.
5. Lo coleccionable (atuendos, pinturas): los más chéveres, muy difíciles de conseguir.

## Mapa del repositorio

```
app/            la portada de GameHub: catalog.js (lo que sabe de cada juego), torneo.js, net.js y online.js (en línea), app.js, app.css, index.html
shared/         archivos que build.js copia a cada juego: hub-link.js → src/00h-hub.js · fullscreen.js → 00i-fs.js · vestidor.js → 00j-vest.js · netplay.js → 00k-net.js
juegos/<juego>/ cada juego: src/ (template.html + NN-*.js, se unen en orden alfabético), assets/, build.js, test/ (y vendor/ con three.js en VÉRTIGO)
assets/         galaxia, fuentes, fotos (shots/) e íconos de la portada
docs/           lo que se publica (lo genera build.js; no editar a mano)
test/           pruebas con Playwright (todo.sh las corre todas)
tools/          generadores: galaxia, íconos, enlace, capturas
ONLINE.md       diseño y bitácora del modo en línea · README.md: cómo funciona todo · GUIA-GITHUB.md: guía vieja de la primera subida
```

Juegos actuales: `tira-y-afloja` (prefijo `tya_`), `ventolera` (`vto_`), `sortilegio` (`srt_`), `vertigo` (`vtg_`). La portada guarda con `gamehub_`.

## Compilar y probar

```sh
node build.js              # los juegos y la portada en docs/ (también copia shared/ a cada juego)
node build.js --solo-app   # solo la portada
bash test/todo.sh          # todas las pruebas (levanta su propio servidor en :8765); resumen de una línea por prueba
```

- Pruebas sueltas: levantar `cd docs && python3 -m http.server 8765` y correr `node test/<prueba>.js`. La tabla de qué prueba qué está en el README.
- Si falta Playwright: `npm i -D playwright`. Si dice «Executable doesn't exist», instalar la versión que corresponde a los navegadores de `/opt/pw-browsers` (en la nube de Claude, hoy `npm i -D playwright@1.63`). Ese cambio en `package.json` no se sube.
- **Sin tarjeta gráfica** (como en la nube de Claude), VÉRTIGO va muy lento: usar `VIEW=400x225` (todo.sh ya lo hace) y `VTG_GQ=0`. Con eso no se puede juzgar cómo se ve de verdad; si importa, decirlo.
- Pruebas propias de cada juego: `node juegos/<juego>/build.js` (escribe `juegos/<juego>/test/index.html`) y luego, por ejemplo, `node juegos/sortilegio/test/modes.js`.
- **Sin conexión debe quedar idéntico**: si se toca algo del modo en línea o de la base común, correr `node test/offline-eq.js`.

## Reglas que no se rompen

**El progreso de los jugadores** vive en el navegador de cada uno, no en los archivos:
- No cambiar el nombre del repositorio ni la cuenta (cambia la dirección y se pierde todo).
- No cambiar los prefijos ni el nombre de las llaves que ya existen. Si un dato cambia de forma, leer el viejo y convertirlo; nunca borrarlo.
- Lo nuevo se lee con valor por defecto: `Object.assign({ …por defecto… }, Store.get('llave', {}))`.
- Lo ganado en el vestidor nunca se quita.

**Cada juego es independiente**: se abre en su propio marco (`iframe` con `srcdoc`), no comparte nada con los otros y guarda solo con su prefijo. Como el marco comparte el almacenamiento con la portada, el prefijo es lo único que los separa.

**Cada juego es un solo archivo HTML** con todo adentro (fuentes en base64, librerías incrustadas, imágenes hechas por código o incrustadas). Nada de cargar archivos aparte ni de internet: dentro de `srcdoc` las rutas relativas no funcionan, y tiene que andar sin conexión.

**Publicación**: GitHub Pages publica desde la raíz de `main` (el `index.html` de la raíz lleva a `docs/`). La app vive en `https://igaviria0001-ops.github.io/gamehub/docs/`. No cambiar esa configuración: cambiaría la dirección de la app instalada.

**Git**:
- Todo lo que llega a `main` se publica a todos en 1–2 minutos, y las apps instaladas avisan «Hay una versión nueva». Por eso:
  - El trabajo grande o de varias sesiones va en una **rama** (como se hizo con `online`, `tanda2` y `tanda3`), con su plan y su bitácora en un `.md`.
  - A `main` solo llega cuando está probado.
- Nunca forzar (`--force`). Si `main` cambió, traer lo nuevo y acomodar encima.
- La rama remota `wip-vestidor` es vieja y no estorba (el proxy no deja borrarla).

## Trampas conocidas

- **`tools/sync-juegos.js` NO se corre.** Era de la primera sesión: borra `juegos/<juego>` y lo copia desde carpetas de trabajo (`/home/claude/tya`…) que ya no existen. El código de cada juego vive en `juegos/<juego>/`.
- `tools/capturas.js` y el final de `test/todo.sh` todavía apuntan a esas carpetas viejas. Antes de usarlos, cambiar las rutas a `juegos/<juego>/test/index.html`. todo.sh simplemente se salta esas pruebas.
- **Agregar un juego rompe datos guardados viejos** si no se ajusta la portada: `lastPool` y los torneos guardados no traen el juego nuevo. También hay que sumar su prefijo a `PREFIXES` para que entre en la copia de seguridad. Todo está en la guía.
- La portada y varios textos se pensaron para **cuatro** juegos («Cuatro juegos para dos», «los 4 juegos», rejillas de 4 columnas). Con un quinto, revisarlos.
- **El modo en línea solo funciona** desde la dirección de GitHub Pages o la app instalada, no dentro del artefacto de claude.ai.

## Publicar un cambio

1. `node build.js`, luego las pruebas que toquen el cambio (o `bash test/todo.sh` si fue grande).
2. Commit con un mensaje claro en español, y push a `main` (o a la rama del trabajo).
3. GameHub también tiene un artefacto en claude.ai (https://claude.ai/artifact/W2tSVHQkEKEYmHc8AYdgZt) que se republica con lo de `docs/`. Republicarlo si Ignacio lo usa para mostrarlo.
4. Contarle a Ignacio en dos o tres frases qué cambió y qué debe probar con sus amigos.

## Trabajo largo

Si una tarea no cabe en una sesión, dejar en el repositorio (en su rama) un `.md` con el plan, lo hecho, lo que falta y **cómo retomar**, como `ONLINE.md`. Así cualquier chat nuevo sigue donde quedó sin tener que reconstruir nada.
