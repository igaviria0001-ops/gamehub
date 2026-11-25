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
- **25 nov 00:45–02:30 (continuación programada)** — E2 Sortilegio:
  - Lo que ya existía (no rehacer): encuadre que sigue a los dos, cámara del KO y del Gran Sortilegio, pausa de impacto,
    presentación cara a cara con barras de cine, textos apilados.
  - **Lava viva**: las orillas de agua y lava se redondean (mayoría alrededor + ruido) en `prerender` (`10-art-ground.js`);
    máscara `lavaMask` (y `waterMask`) suavizada; capa `Post.lava` (`10f-post.js`): placas de costra que derivan, grietas
    que laten, sin costra donde la lava se enfrió. Se acabó la escalera de cuadros (`test/lava0.js`, `ARENA=`).
  - **Tormenta de arena épica**: embudo de anillos que giran (cara de atrás oscura, adelante clara), cortina de polvo y
    luz cálida (`10c3-art-earth.js`).
  - **Clima por lugar** (`09-fx.js`): brasas que suben de la lava, ceniza en volcán/infierno, hojas en la selva
    (ciudad, caño). Suelo mojado y hielo sin cuadrícula. Combos seguidos en un solo cartel «×N» (también en línea).
  - Tierra revisada (`FILTRO=earth R=30 node test/fusionstat.js`): todas sirven (daño/vez 6–32, control 1,7–4,2 s).
  - Equilibrio con R=8: Maestro 40–60 %, Normal 43–60 % (Candela 47–48 %, ya no 22 %).
- **25 nov** — En línea: la sala avisa si un aparato tiene otra versión de GameHub. Guía de Cloudflare con los pasos
  para recuperar la cuenta (`servidor/GUIA-CLOUDFLARE.md`). `test/todo.sh` corre también las campañas en línea
  (arranca el servidor local). Versiones: Sortilegio 2.4, Ventolera 3.6, Tira y Afloja 0.29, VÉRTIGO 1.2.
- **25 nov ~02:00 — PUBLICADO**: suite completa OK (`bash test/todo.sh`: 40 pruebas; `netvtg` falló una vez por tiempo
  del temporizador de respaldo y pasó al repetir; sin conexión: estado idéntico en Tira y Afloja, Ventolera y VÉRTIGO,
  solo cambia el número de versión en la portada; Sortilegio cambia a propósito). `main` = `tanda4` (7ba97aa),
  artefacto de GameHub republicado. Fotos revisadas: lava con costra también en los niveles de volcán e infierno de la
  campaña.
- **Lo único que falta** (depende de Ignacio): que recupere su cuenta de Cloudflare con los pasos de
  `servidor/GUIA-CLOUDFLARE.md` y mande la dirección del Worker. Entonces: ponerla en `SERVER0` (`app/net.js`), revisar
  `/ice`, medir con `test/netmovil.js` y publicar. Mientras tanto el en línea funciona como antes (MQTT + TURN público).
- Ojo al probar juegos sueltos: `git checkout -- juegos/*/test/index.html` deja la página de prueba VIEJA; volver a
  correr `node juegos/<juego>/build.js` antes de mirar fotos.
- **25 nov mañana — pedido nuevo de Ignacio** (Llamarada quita poco; Eclipse épico y útil; todas las fusiones más
  épicas «como la tormenta de arena»; nivelar subiendo a los flojos, sin bajar a los buenos). Hecho:
  - **Eclipse** (Chía) rehecho: la luna tapa el sol donde VA a estar el rival (aviso 0,36 s); adentro no lanza, la
    oscuridad atrae y quema; salir por el anillo de luz quema y calla 1,1 s; al final el anillo de diamante (17, encandila,
    maleficio; cura a los aliados). Sol negro con corona, noche con estrellas, runas (`10c4-art-epic.js`, módulo nuevo
    para las fusiones épicas; se engancha en `10d-art.js` y por `ArtEarth.fx/shape`).
  - **Llamarada** 11 + 14 (antes 8 + 12), más rápida.
  - Más épicas: Flor de vida (loto gigante; polen, latidos que empujan, cierre que enreda), Cuervos (5, grandes, nube de
    plumas), Bola de rayo (esfera que suelta rayos al pasar), Torbellino de fuego (anillos de llama, más alto, menos
    encandilante), Ventisca (abanico de cristales; hielo como placas), Vapor, Tormenta (nubarrón que relampaguea),
    Pétalos, Vainas de fuego (saltan hacia el rival), Rayo negro (relámpago oscuro del cielo), Fuegos fatuos (5, más
    grandes). Sonidos nuevos.
  - Nivelación solo subiendo: Raíces 15, Tormenta 6,5 cada 0,5 s, Plasma 27, Ventisca 10, Marea negra 6,5, Frailejón
    plantas +40 % y más vida, Yuma/Chía/Tota/Cocuy/Tatacoa más vida, Yuma más rápido. (Se recortó solo lo que yo mismo había
    subido de más en esta tanda: loto, cuervos y bola.) Resultado (R=20, 3120 peleas por nivel): Maestro 47–55 %,
    Normal 41–60 %.
  - Arreglo: los reflejos del Espejismo podían salirse del mapa.
  - `test/powerstat.js`: daño por lanzamiento de cada poder (también los de un elemento y lo que hacen sus piezas).

- **25 nov 08:08 — corrección de Ignacio**: «el día de la llamada» NO era Llamarada sino el **Alud de lodo** (agua + tierra);
  Llamarada vuelve a como estaba (8 + 12). Y pidió a **Zuhé** (luz + fuego) más épico y un poco más útil, sin volverlo
  invencible. Hecho (Sortilegio 2.6):
  - **Supernova** rehecha: ya no estalla alrededor de Zuhé; lanza un sol pequeño (vuela en arco con estela) que se
    queda flotando sobre donde VA a estar el rival, lo atrae hacia el centro 0,65 s y estalla (17, quema, empuja,
    encandila; anillo de fuego en el suelo). Rayos, columna de luz, brasas, sacudida y sonidos nuevos (`sunForm`,
    `sunBlast`). Dibujo en `10c4-art-epic.js` (`sunPos`, `sunBall`, `novaUnder/Over`, `novaRays`).
  - Zuhé: 106 de vida (antes 100), cada golpe de luz cura 1,4 (antes 1); halo de sol a sus pies (no se ve si está escondido).
  - **Alud de lodo**: 15 (antes 11) y tumba 0,3 s; ola de barro más grande (lengua de lodo con grumos y cresta).
  - Al devolver la Llamarada los magos de fuego quedaron flojos; se subieron sin tocarla: Candela 168 de vida y
    Torbellino de fuego 20 por s; Galeras 178 de vida y Plasma 31, más ancho y sale más rápido; Puracé 136 de vida.
  - Resultado: Maestro (R=20, páramo) 43–54 % (Zuhé 54 %); Normal 33–63 % en el páramo, 35–64 % en todas las arenas
    (Galeras flojo en Normal porque la máquina Normal apunta mal los rayos; con Maestro queda en 52 %).
  - `test/balance.js` solo usa una arena; para mirar todas, rotar `ARENA_ORDER` (se hizo con una copia en /tmp).
- **25 nov 10:02 — pedido de Ignacio**: el Eclipse seguía sin convencer (explosión lenta, poco útil) → cambiar la idea;
  viento + luz (los clones) «se ve trabado y no es útil» → cambiarla o mejorarla mucho; y que agua + tierra y
  tierra + sombra no se parezcan. Hecho (Sortilegio 2.7):
  - **Media luna** (luz + sombra, firma de Chía; reemplaza al Eclipse): una luna creciente que gira y vuela en curva
    hasta un poco más allá del rival y vuelve a sus manos. A la ida es de luz (12, encandila, destapa al escondido); al
    dar la vuelta se voltea con un destello y vuelve de sombra (13 y maleficio). Corta los proyectiles que toca. En el
    Gran Sortilegio salen dos (una por cada lado). Estela de lunas fantasma y polvo de estrellas. `Spells2.crescentAt`
    da el camino (lo usan la cuenta y el dibujo).
  - **Cometa** (viento + luz; reemplaza al Espejismo): el mago sale disparado 310 px en una estela de luz (es un
    esquive largo con su propia velocidad: `dash.spd`, también en la predicción en línea), atraviesa al rival (15,
    encandila, lo empuja de lado), corta proyectiles y estalla al llegar (8). Sirve para atacar o para huir.
  - **Fosa** (tierra + sombra) ya no frena (eso lo hace el lodo): la sombra con manos persigue los pies del rival; si lo
    agarra (0,22 s encima sin esquivar), la tierra se lo traga: se hunde (estado `st.sunk`: no se mueve, no lanza y
    nadie lo puede tocar) y a los 0,85 s lo escupe (9 + 11 y maleficio). Boca violeta que se cierra, manos de sombra.
    El Alud de lodo sigue siendo la ola de barro que empuja, moja y deja lodo.
  - Resultado: Maestro (páramo, R=20) 45–55 % (Chía 54 %); Maestro en todas las arenas 44–57 %; Normal 37–61 %.
    `test/fusionstat.js` (R=120): Media luna 16 por lanzamiento (72 % tocan), Cometa 14,7 (75 %), Fosa 25 (100 %).
  - Lo viejo del Espejismo (reflejos `decoy`) quedó en el código pero ya no se lanza.
- **25 nov 11:14 — pedido de Ignacio (publicado como Sortilegio 2.8, ver abajo)**:
  - HECHO (commit «WIP»): **Zarzal** (planta + sombra) ya no es un anillo: una hilera recta de espinas brota hacia el
    rival (400 px, hasta el primer muro; golpe 13 + enredo + maleficio al que alcanza; la hilera se queda 3,4 s y
    cruzarla pincha y enreda; tres en abanico en el Gran Sortilegio). **Puntería**: el tiro va al rival fijado aunque
    camines para el otro lado (`casting` en `Mage.aim`) y el Plasma sigue al fijado durante la preparación
    (`s.tg`). Probado con /tmp/sim/aim.js: antes salía hacia atrás (3,14) o de lado; ahora va al rival.
  - FALTA: balance (LV=4 y LV=2, R=20), pruebas (chaos, spells, modes, gran, camp, campmech; en línea: netsrt,
    netcamp-srt, netver JUEGOS=sortilegio), versión 2.8, publicar a main y artefacto.
  - NUEVO: **Buziraco** (c18, jefe final del mundo 2): (1) en el celular de Ignacio se congela a la mitad (dos veces;
    tiene que cerrar el navegador entero) → buscar la causa (partículas/efectos que crecen sin límite, bucles,
    memoria) y arreglarlo; (2) hacerlo mucho más chévere de ver (calidad del jefe final).
- **25 nov ~12:30 — PUBLICADO Sortilegio 2.8**:
  - **Congelamiento de Buziraco (causa encontrada)**: al romperle la coraza queda aturdido y sus ojos se pintaban con el
    color `'#888' + 'cc'` = `'#888cc'`, que no es un color: el dibujo lanzaba un error en cada cuadro y el bucle del
    juego se detenía (pantalla congelada). Arreglado (`hex6` en `eye` de `10g-art-beasts.js`) y, además, el bucle de
    `08-game.js` ya no se puede detener por un error en un cuadro (pide el siguiente primero; avisa el error una vez).
    Probado con celular simulado (844×390, calidad alta y ligera): la pelea entera hasta el final, sin errores y sin
    memoria que crezca (/tmp/sim/buzi.js).
  - **Buziraco más épico**: 30 % más grande, llamas de sombra (con coraza) o de fuego (sin coraza) detrás del cuerpo,
    corona de fuego, esquirlas de sombra que giran (menos a medida que la luz rompe la coraza), sello del color del
    ataque sobre la cabeza al avisar, círculo del abismo bajo sus pies con grietas de lava; al cambiar de fase ruge
    (onda de fuego, cámara lenta, borde rojo, «¡Buziraco se enfurece!» / «¡El abismo despierta!»); al caer, rayos de
    luz y lluvia de brasas.
  - **Zarzal** apunta a donde VA a estar el rival (más rápido y un poco más ancho): 11 por lanzamiento, 74 % tocan.
  - **Puntería**: solo para personas (la máquina apunta como antes, si no la máquina Normal quedaba perfecta). El
    Plasma sigue al fijado mientras se prepara, menos el último instante (0,14 s) para que se pueda esquivar.
  - **Galeras vuelve a sus números de antes** (146 de vida, Plasma 27, ancho 30, 0,36 s): esos aumentos eran para
    compensar que su Plasma apuntaba mal; con la puntería arreglada quedaba en 73–93 %. Ahora: Maestro 44–57 %
    (Galeras 49 %), Normal 40–63 % (Galeras 53 %).
