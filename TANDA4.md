# Cuarta tanda — campañas en línea, Sortilegio épico y red con servidor propio

> Archivo de trabajo para retomar en cualquier momento. Rama **`tanda4`** de `igaviria0001-ops/gamehub`
> (`main` no se toca hasta que todo esté probado). La carpeta `servidor/` sí está en `main` (Cloudflare la
> publica desde ahí).

## Pedido (Ignacio, 24 nov 2026, 19:53)
1. **Campañas en línea** en todos los juegos de GameHub (lo que aún no iba en línea), sin fallos.
2. **Sortilegio más épico**: animación mucho más épica, calidad cine, sin perder diversión ni equilibrio.
   Poderes de tierra: la fusión es casi inútil; tormenta de arena no se ve épica (y debe ser más útil);
   tierra+rayo debería poner algo de tierra que transmita electricidad; los encierros de tierra (tierra+luz,
   tierra+sombra) caen donde estaba el rival y casi nunca atrapan. Mejorar o replantear los inútiles.
3. **En línea de mejor calidad** en los 4 juegos; plantear opciones. Eligió: **servidor propio gratis en Cloudflare**.

**Aclaración (20:08)**: el en línea es **lo último**. Primero: campañas, calidad, épica y cine de Sortilegio, gráficos y
la solución de los poderes. Cloudflare no lo deja registrarse (un correo «ya usado», el otro «correo o contraseña
incorrectos», con GitHub «se usó otro método»): cuando toque el en línea, investigar por qué (lo más probable: ya hay
una cuenta creada con Google o GitHub con ese correo) y darle la mejor solución, o cambiar de método si conviene.

**20:48**: se le acaba el uso; pidió seguir solo mientras duerme. Hay una continuación programada en esta misma sesión
(00:42 hora de Bogotá); si aún falta, cada continuación programa otra 5 h 2 min después. No bajar la calidad por ahorrar uso.

## Plan
- **S · Servidor** (`servidor/`): Worker + Durable Object por sala (señal y relevo rápido, mensajes cifrados de
  aparato a aparato) + `/ice` con TURN de Cloudflare. Guía `servidor/GUIA-CLOUDFLARE.md`. Ignacio crea la cuenta
  y manda la dirección → va en `app/net.js` (`SERVER`).
- **R · Red**: señal por el servidor (MQTT queda de respaldo), TURN de Cloudflare primero, relevo por el servidor
  (más rápido y a más ritmo que MQTT), optimizaciones (tamaño de paquetes, reconexión). Medir con `test/netmovil.js`.
- **C · Campañas en línea**: Sortilegio (Travesía de los Tunjos, en pareja), Ventolera (Travesía), Tira y Afloja
  (campaña y jefes), VÉRTIGO (Vuelta al mundo y Persecución). Regla: el anfitrión elige entre los niveles que él
  tiene abiertos; al ganar, **cada aparato guarda en su propio progreso** lo ganado por sus jugadores.
- **T · Sortilegio, tierra**: rediseño de las fusiones de tierra y de las que no sirven; balance medido.
- **E · Sortilegio épico**: hechizos, impactos, cámara, luz, momentos de cine; versión ligera en celular.
- **P · Probar y publicar**.

## Cómo retomar
1. Clonar `igaviria0001-ops/gamehub`, `git checkout tanda4`.
2. Leer la bitácora de abajo: el último paso dice qué sigue.
3. `node build.js`; pruebas como dice CLAUDE.md. Servidor local para pruebas: `cd servidor && npx wrangler dev --port 8799`.

## Bitácora (lo más nuevo abajo)
- **24 nov 20:10** — S: servidor escrito y probado en local con `wrangler dev` (sala, mensajes a uno y a todos,
  latido; `/ice` responde `sin-turn` sin secretos). Subido a `main` (b80adc7). Guía enviada a Ignacio.
- **24 nov ~20:30** — T/E Sortilegio (commit 9f5a75e): tierra 3.0 (módulo `05c-earth.js` + arte `10c3-art-earth.js`):
  torre de cristal que conduce rayos (tierra+rayo), jaulas que se cierran **donde el rival va a estar** (predicción),
  tormenta de arena que persigue y cura en la Tatacoa, raíces en abanico, meteoro con cráter… Capa de cine `10h-cine.js`
  (cámara lenta, barras, golpes). Balance con `test/balance.js` (Maestro 44–59 %). Campaña en equipo en línea
  (`12b-net.js`, `12-ui.js`, prueba `test/netcamp-srt.js`).
- **24 nov** — C Ventolera (a5bb697): Travesía para dos en línea (`test/nettrav-vto.js`). C Tira y Afloja (77936ab):
  campaña y 6 jefes en línea (`test/netcamp-tya.js`). Las tres pruebas pasan (servidor local :8799 + docs en :8765,
  un contexto de navegador por aparato).
- **24 nov 20:50 — EN CURSO: C VÉRTIGO (Vuelta al mundo en línea)**. Hecho (sin probar aún):
  - `04-race.js`: `cfg.seed` → las reglas del reto se arman con semilla (tunjos, troncos, géiseres, campeón iguales en
    todos los aparatos) y cada pieza de `R.bz` lleva `id`.
  - `12-main.js`: `worldPlan(ch, humans)` (pista, máquina y vueltas de un reto; lo usa `startCfg` y el anfitrión en
    línea); `startNet` acepta `mode:'world'` con `ch`, `noItems`, `seed` (música e intro de jefe).
  - `04d-world.js`: **arreglo**: el reto «Curvas del acantilado» (clean) nunca contaba choques (siempre 3 estrellas).
    Ahora cuenta golpes fuertes contra la pared (uno cada 0,8 s), panel CHOQUES y aviso `cleanHit` en el HUD.
  - `12b-net.js`: modo `world` en `NET_MODES`; `make` devuelve `ch:-1` (el anfitrión elige en su mapa);
    `apply` llama `UI.netWorld(c|null)`; instantánea con `tt` (reloj de la pista: antes los géiseres no se movían en
    el remoto) y `wSnap` (wp/pg lentos, lg troncos, bs jefe, dz lo que suelta el jefe con id).
  - **Falta**: en `12b-net.js` aplicar en el remoto (`wApply`: wp, pg, lg, dz por id conservando los objetos, jefe
    con historial de cola y adelantado a «ahora» con su velocidad, `R.netStars`), `slowKeys: ['wp','pg']`, conservar
    los objetos de `R.hz` entre cuadros (hoy se rehacen cada cuadro), animar tunjos/troncos en el remoto
    (`Challenge.pickPose`), choque del bólido propio con el jefe en la predicción (`Boss.solid`), `again()` para
    world (repetir con semilla nueva) y `pick(ch)` (−1 = volver a elegir). `11-ui.js`: `netWorld(c)` (anfitrión: mapa
    en modo en línea, sin «1/2 jugadores», «Volver a la sala», jugar = `NetGame.pick(i)`; remoto: `NetPlay.notice`),
    resultados en línea del reto (estrellas del anfitrión, cada aparato con jugadores guarda con `World.save`;
    anfitrión: «Siguiente reto (todos)», «Repetir (todos)» —botón nuevo `resRep` en template—, «Elegir reto»), sin
    pisar el título con «¡Gana X!». Catálogo: `extra` de vertigo `{ id:'world', name:'Vuelta al mundo', seats:2,
    watch:true, maps:[], noOpts:true }`. Prueba `test/netcamp-vtg.js` (VIEW=400x225, VTG_GQ=0, un contexto por
    aparato, `?net=srv&server=http://127.0.0.1:8799`): reto normal, recolección, troncos, jefe (Tren de Oro) y
    resultados/estrellas en los dos aparatos.
- **Después**: volver a Sortilegio (más épica/cine; revisar Candela en bots Normal 22 %), luego P (todo.sh,
  offline-eq en TyA/Ventolera/VÉRTIGO, versiones, docs, merge a main, artefactos, bitácoras, README, memoria) y al
  final R/en línea + Cloudflare.
