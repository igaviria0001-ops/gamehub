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
- **24 nov 21:30** — C VÉRTIGO: **Vuelta al mundo en línea, hecha y probada** (`test/netcamp-vtg.js` OK con los 24
  tipos de reto probados: recolección, troncos, tormenta, sin chocar, campeón, géiseres y los 6 jefes; `netvtgmodos.js`
  OK; `offline-eq vertigo «máquinas world»` idéntico). Cómo funciona: `04-race.js` siembra las reglas con `cfg.seed`
  (piezas iguales en todos, con `id`); `12-main.js` `worldPlan(ch, humans, pool)`; `12b-net.js` modo `world` (el
  anfitrión elige en su mapa, `NetGame.pick(ch)`, −1 = volver a elegir), instantánea `wp`/`pg` lentas + `lg` troncos +
  `bs` jefe + `dz` piezas del jefe por id (se conservan los objetos), jefe dibujado «ahora» (adelantado con su
  velocidad) y sólido para el bólido propio (`Boss.solid`), reloj de la pista `tt` (antes los géiseres no se movían en
  el remoto), los objetos de `R.hz` ya no se rehacen cada cuadro. `11-ui.js` `netWorld`, resultados con estrellas del
  anfitrión y botones Siguiente/Repetir (`resRep`)/Elegir reto. Arreglo aparte: el reto «sin chocar» no contaba choques.
- **Siguiente: E2 Sortilegio épico (plan concreto)**, mirar `ALTA=1 CHARS=… ARENA=… node juegos/sortilegio/test/film.js`
  (hoja de fotos en `juegos/sortilegio/test/shots/film.png`; `ALTA=1` fuerza calidad alta):
  1. **Cámara de cine**: ya existe un encuadre que sigue a los dos (`camTarget` en `08-game.js`: zoom entre «toda la
     arena» y `zMax` ≈ 1,05 en PC / 1,25 táctil, cámara del KO, sacudidas). Mejorar sin quitar visibilidad: empuje
     suave hacia quien lanza el Gran Sortilegio, un poco más de acercamiento cuando están cerca, y la toma del golpe
     final más cinematográfica. Probar en PC y celular; que no maree ni esconda hechizos que vienen de fuera.
  2. **Golpe que se siente**: ya hay `G.hitStop` en el Gran Sortilegio; sumar pausa corta (40–70 ms) a golpes muy
     grandes y al contraconjuro, y anillo de onda en el suelo.
  3. **Textos**: ya se apilan (`10d-art.js`), pero en una misma jugada salen 3 seguidos («¡Doble golpe! ¡Rebote!
     ¡CONTRACONJURO!») muy pegados: unirlos en un solo cartel de combo con más aire.
  4. **Lava del volcán** se ve como mancha amarilla plana (sobre todo en calidad media): costra oscura, grietas que
     laten, borde que humea.
  5. **Entrada de ronda de película**: cartel con los dos magos frente a frente, nombre de la arena, barras de cine.
  6. Clima propio de cada arena (ceniza, nieve, pétalos, brisa) solo donde luce. Todo con versión ligera en celular.
  Después medir que no cambie el equilibrio (`LV=4 node juegos/sortilegio/test/balance.js`) y revisar Candela con
  bots Normal (22 %).
- **Después**: volver a Sortilegio (más épica/cine; revisar Candela en bots Normal 22 %), luego P (todo.sh,
  offline-eq en TyA/Ventolera/VÉRTIGO, versiones, docs, merge a main, artefactos, bitácoras, README, memoria) y al
  final R/en línea + Cloudflare.
