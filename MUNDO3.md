# Sortilegio · Mundo 3 — «El Pergamino de las Estaciones»

> Archivo de trabajo para retomar en cualquier momento. Rama **`mundo3`** de `igaviria0001-ops/gamehub`
> (`main` no se toca hasta que todo esté probado, salvo el arreglo del joystick, que salió antes).
> Plan completo aprobado por Ignacio (26 nov 2026): https://claude.ai/artifact/QZtvqrLaQ3frLDnTRuYjb2

## Pedido (Ignacio, 26 nov 2026)
- Mundo 3 de la campaña de Sortilegio: dinámicas nuevas, voces nuevas, gráficos extraordinarios e innovadores, mapas
  distintos. Eligió el plan A (Japón pintado en tinta, estaciones que se cambian con los elementos).
- Tres jefes que no se sientan iguales; nada monótono; inmersión total desde el inicio (cinemática estilo anime al
  vencer a Buziraco: muere, se riega la tinta, nace el pergamino).
- Dificultad **un poco** mayor que el Mundo 2, progresiva, sin saltos bruscos; no regalado (no solo ingenio).
- Mapas del Mundo 2 y del Mundo 3 también para duelo y los demás modos.
- Integración completa (en línea y todo), música y voces bien hechas.
- Mejorar el joystick (se traba, se queda pegado; rango; velocidad; varios botones a la vez).
- En espera, pero tenerlo en cuenta: campaña para 3 y 4 jugadores en los tres mundos.
- Sin Fable: todo con el modelo actual. Calidad por encima de lo esperado, «que se sienta como un upgrade».

## Fases (detalle en el plan)
1. Preparación · 2. Joystick (se publica solo) · 3. Motor de estaciones y estilo tinta · 4. Voces y música ·
5. Niveles c19, c20, c22, c23, c25 · 6. Jefes c21 Kitsune, c24 Raijin y Fujin, c26 Orochi y el Borrón + modo Tinta
negra · 7. Cinemáticas · 8. Magos Fuji (fuego+agua) y Yoshino (planta+viento) · 9. 8 escenarios nuevos (4 del Mundo 2,
4 del Mundo 3), selector y Sumo mágico · 10. En línea y GameHub · 11. Revisión y publicación · 12. (en espera) campaña
para 3–4.

Metas de dificultad (jugador normal + compañero, 10 intentos): c19–c20 ganar 9–10 y perder 1–2 vidas; c21–c22 ganar 9,
2–3 vidas; c23–c25 ganar 8–9, 3 vidas; c26 ganar 7–8, 3 vidas (Buziraco hoy: 9/10, 3 vidas).

## Cómo retomar
1. Clonar `igaviria0001-ops/gamehub`, `git checkout mundo3` (si `main` avanzó, traerlo y acomodar encima).
2. Leer la bitácora de abajo: el último paso dice qué sigue.
3. `node build.js`; pruebas de Sortilegio en `juegos/sortilegio/test/` y las de GameHub con `bash test/todo.sh`.

## Bitácora (lo más nuevo abajo)
- **26 nov ~12:30** — Fase 1: rama `mundo3` creada desde `main` (d175705).
- **26 nov ~13:00** — Fase 2, **joystick 3.0** (`juegos/sortilegio/src/01-touch.js`, Sortilegio 2.9). Causas encontradas:
  (1) la palanca solo aceptaba un dedo nuevo si el juego se enteraba de que el anterior se levantó: si el celular
  perdía ese aviso, el mago seguía caminando solo y el dedo nuevo no tomaba el control; (2) recorrido de solo
  29–38 px (en el visor de la app de Ignacio, 587×262, la velocidad máxima llegaba con 29 px); (3) cada movimiento de
  cada dedo recalculaba los botones y leía el estilo de la página. Arreglos: la lista real de dedos del navegador
  (`touchstart/touchend`) suelta los «fantasmas»; un dedo nuevo en la zona de la palanca la toma si la vieja ya no
  existe (si sigue viva, el dedo nuevo solo marca enemigos); al levantar todos los dedos se suelta todo; recorrido
  40–68 px (≈1,4×), zona muerta 10 %, toda la velocidad al 70 %, curva suave, la base sigue al pulgar sin saltos;
  botones calculados solo al cambiar la pantalla; `pointerrawupdate` donde exista; Opciones → controles táctiles
  (tamaño, palanca flotante o fija, vibración; guardado en `touchCfg`). Prueba nueva `juegos/sortilegio/test/stick.js`
  (dedo perdido, 4 dedos, vuelta rápida, segundo dedo, palanca fija, tamaños; 844×390 y 587×262): OK. También pasan
  `touch.js`, `boot.js`, `test/netsrt.js`; `offline-eq sortilegio` idéntico salvo el número de versión en la portada.
- **26 nov ~15:30** — Fase 3 (en curso), **motor de estaciones y estilo tinta**:
  - `03-terrain.js`: celdas nuevas `sea` (estación: 0 ninguna, 1 primavera, 2 verano, 3 otoño, 4 invierno), `snow`, `leaf`
    (también en `Terrain.SYNC`, así viajan en línea). Factores por estación `SEA_FIRE/SEA_WET/SEA_VINE` (×1 fuera del
    Mundo 3: nada cambia). La hojarasca arde y el fuego corre ×3 sobre ella; la nieve se derrite como el hielo.
  - `03c-seasons.js` (`Seasons`): paneles con estación, toriis (se cambian golpeando un PILAR con planta/fuego/viento/agua
    o cargando una mano a su lado; la LUZ limpia los manchados), rotación sola en duelo (`rotate`, aviso 3 s antes),
    el invierno mantiene el agua congelada, `Seasons.mult` (+20 % / −15 % según la estación donde pega, en `Unit.hurt`).
    Se arma en `newRound` con `G.A.seasons` (duelo) o `L.seasons` (campaña).
  - `10i-art-ink.js` (`ArtInk`): suelo por estación pintado una vez (33–90 ms por estación en PC, se guarda por
    escenario): papel de fibra, aguadas, orillas redondeadas (máscara desenfocada), contornos de pincel en tres grosores,
    doble y triple línea de orilla, hierba de trazos, pétalos, hojarasca, nieve con sombras azules, hielo con grietas,
    rocas sumi-e (sprites por estación), pilas de piedra para las fuentes. Cada cuadro: paneles según `T.sea` (el remoto
    en línea ve lo mismo) con la PINCELADA que repinta (frente diagonal ondulado, 0,9 s), árboles por estación (pino,
    cerezo, arce, bambú) que cambian cuando pasa la pincelada (`seenAt`), toriis bermellón (el gran torii ×1,4 con ondas
    en el agua), puentes bermellón, nubes doradas (kasumi) entre paneles, lo que cambia el suelo (marea, vacío del
    Borrón), partículas de la estación, mesa y rodillos del pergamino alrededor (solo si se ven), grano de papel (alta).
    Temas `THEMES.wa` / `THEMES.miyajima` con luz y color por estación.
  - `03d-arenas3.js`: primer escenario del Mundo 3, **Itsukushima** (`miyajima`, aún no está en `ARENA_ORDER`): canal
    del mar en diagonal, gran torii en el agua baja, dos puentes, 8 fuentes (sin las extra de luz/sombra) y la **marea**
    (`07b-events.js`: la orilla se inunda hasta dos celdas; `T.base0` guarda el suelo original).
  - Pruebas: `test/ink.js` (capturas de las 4 estaciones y lo que tarda pintar cada una), `test/perfink.js` (cuadros por
    segundo contra un duelo normal: ligera más rápido, media ~15 % más lento en la nube sin tarjeta gráfica).
    `offline-eq sortilegio` idéntico (se ignoran los campos nuevos, vacíos fuera del Mundo 3); `test/netsrt.js` OK.
- **26 nov ~19:30** — Fase 4 (voces y música, ver commit 20d6afe) y **Fases 5, 6 y 7** (niveles, jefes, cinemáticas). Commit d6e771e.
  - **Pedido nuevo de Ignacio**: (1) subir música, efectos y voces en TODO el juego (la gente ni notaba que había sonido) y
    que las voces suenen imponentes, no robóticas, «como otro idioma de verdad», con subtítulos que funcionen; (2) las
    cinemáticas deben salir CADA VEZ que se pasa el nivel (no solo la primera), siempre con opción de saltarlas.
  - **Sonido** (`11-sound.js`, `11b-music.js`, `11d-voice.js`): compresor suave + ganancia de compensación (+8 dB) +
    limitador al final (más fuerte sin romperse); música 0,42→0,66 y se aparta (−58 %) mientras alguien habla
    (`Music.vduck`); voces ×2,1 y volumen inicial «altas». Voz nueva: «lengua mágica» por moras (consonantes del español
    pasan a k, s, sh, t, ts, ch, h, f, m, n, r, y, w, b, d, g, p; acento de tono por palabra; ritmo parejo), fuente de
    glotis suavizada + pecho, vibrato y temblor humanos, 4 formantes, cierres y explosiones de las oclusivas, sala de
    templo de 2,4 s para todos los que hablan con nombre. Subtítulos: máximo dos, se limpian al empezar ronda, suben si
    hay barra de jefe. `test/audio.js`: voces rms 0,026–0,065, nada satura.
  - **Niveles** (`07e-world3.js`, objetos nuevos por `Camp.EXT`: start/setup/step/plan/job/draw/event/update/boss/spawn):
    c19 El torii en el mar (lotos de primavera, seto verde que solo arde en verano, molinete de otoño, mar que se cruza
    congelado, el Borrón mancha el gran torii → luz), c20 El bosque de bambú (sendero entre bambú; laberinto que se
    rearma con la gran ráfaga; en otoño las ráfagas acuestan el bambú 2,6 s y el viento lo dobla un ratito; en verano
    arde; en primavera rebrota), c22 Himeji (foso: congelar o quemar la cuerda; escalera borrada → enredadera de
    primavera; tres toriis sueltos con tablillas, si se equivocan despierta una armadura), c23 Shirakawa-go (noche,
    defender 3 faroles 3 min, frío, Yuki-onna, verano de 30 s con el torii), c25 Kioto (huir del muro de tinta que se
    adapta a la velocidad; puestos de papel, molinete, río Kamo con lotos o hielo).
  - **Jefes** (`07f-bosses3.js`): Kitsune (ilusiones SIN sombra, la luz las deshace y la deja al descubierto; pelea por
    el verano), Raijin y Fujin (al compás del tambor; juntos se protegen ×0,3; si cae uno se levanta a los 12 s salvo
    que caiga el otro), Orochi (8 cabezas que suben y bajan, débiles a su contrario, el sake las emborracha) y el
    Borrón (coraza de tinta que solo rompe la luz, copias de tinta de los magos, fosas). Sumi pinta luz al salir el Borrón.
  - **Arte** (`10j-art-w3.js`, `10k-art-w3b.js`): criaturas, casas, puestos, molinete, tablillas, muros del castillo,
    machiya, lotos, enredadera, seto, ensō de salida, muro de tinta, fuegos artificiales, ventisca; temas por lugar
    (noche en Shirakawa, Kioto, Fushimi e Izumo; cielo de nubes en el Fuji; losas en Himeji, Kioto y Fushimi).
  - **Cinemáticas** (`10l-film.js`, `Film.play`): la caída de Buziraco (25 s), la entrada de cada nivel (4,4 s) y la
    presentación de cada jefe (10,5 s), el final (26 s). Salen SIEMPRE; «Saltar», Esc, Enter o dos toques; en línea no
    salen. Se vuelven a ver desde la campaña (fila «Cinemáticas»). `test/films.js`: dibujan sin errores y se saltan.
  - **Campaña**: pestaña «Mundo 3 · El Pergamino» (abre al vencer a Buziraco). Máquina compañera: elige fuentes a las
    que de verdad puede llegar y suelta la meta si no llega en 9 s.
  - **Dificultad con dos máquinas** (`test/w3dbg.js`, `/tmp` de pruebas): c19 51 s 5 vidas · c20 114 s 4 · c21 ~100 s 3 ·
    c22 89 s 3 · c23 gana ~50 % (defensa dura) · c24 130 s · c25 ~55 s (persecución) · c26 310–360 s, 1–4 vidas.
    (Cóndor 193 s / Buziraco ~240 s, 3 vidas.)
  - `offline-eq sortilegio` con `BASE=20d6afe`: estado e imagen idénticos en todas las escenas (la prueba ahora apaga las
    voces en las dos versiones porque gastan azar según lo que dura cada frase).
  - **Sigue**: Fase 8 (magos Fuji y Yoshino + atuendos + nivelar), Fase 9 (8 escenarios y Sumo mágico), Fase 10 (en línea:
    probar campaña del Mundo 3 con `test/netsrt.js`, catálogo, torneo, Copa, Escuela, logros, sellos → atuendo mítico),
    ajustes finos de c23 (defensa) y revisar en celular. Desviaciones del plan: criaturas de nieve débiles al FUEGO;
    recorrido de la palanca ~1,4×.
- **26 nov (tarde)** — **Fases 8, 9 y 10.** Commits 03ece42 (magos), 24f2919 (Sumo y mapas) y el de integración.
  - **Magos** Fuji (fuego+agua: alternar manos da *Equilibrio* ×1,15 y su Vapor lo cura) y Yoshino (planta+viento:
    +4 pétalos, 12 % más rápida sobre pasto y hojas), con sus tres atuendos. Suben Cocuy, Tatacoa, Frailejón y Tota.
  - **Sumo mágico** (`07-modes.js`): dohyō en el centro, daño ×0,2 y empujón ×1,75; 3 salidas ganan; la regla es la
    misma elipse que se dibuja (`sumoOut`). En línea con 2. Logro «Yokozuna» (3 a 0).
  - **13 mapas** en duelo y demás modos (`03e-arenas4.js`): los 4 del Japón (Miyajima, Arashiyama, Fushimi,
    Shirakawa-go: estación que rota sola y toriis que la fuerzan) y 4 del Mundo 2 (Islas, Templo, Coliseo, Huesos).
  - **Atuendos nuevos** (`10m-art-outfits3.js`: telas, auras y estelas propias sin tocar `shared/`): Yokozuna (raro,
    olas seigaiha), Kitsune de nueve colas (épico, c21), Tambores del trueno (legendario, c24: anillo de taiko con
    rayos, capa de viento de Fujin, estela de viento), Tinta viva (mítico, c26: papel de arroz con tinta que corre,
    ensō que se pinta solo, estela de pincel) y Cuatro estaciones (mítico, los 8 sellos: la tela, el aura y la estela
    cambian de estación cada 3,4 s). Vestidor: 48.
  - **Logros**: «El pergamino se cierra» (c26), «Ocho sellos», «Yokozuna». Arreglos: el gol del Sumo ya no da «¡Mecha!»;
    el sello 8 sí da su logro; en línea, ganar c26 ya no dice «¡Buziraco cayó!».
  - **En línea**: el remoto saca la estación de cada panel del suelo (`T.sea`), así ve y dibuja lo mismo.
    `test/netw3-srt.js` (en `todo.sh` como mundo3Srt): los 8 niveles iguales en los dos aparatos, sin errores.
    Sumo en línea (`MODE=sumo node test/netsrt.js`) y la campaña de antes, OK.
  - «Cómo se juega»: Sumo, Mundo 3 y sus estaciones, 15 magos, 13 escenarios. Versión 3.0.
  - Decidido: la Escuela no gana lección de estaciones (el primer nivel del Mundo 3 ya la enseña jugando).
  - `offline-eq sortilegio` con `BASE=24f2919`: todas las escenas idénticas salvo la portada (otro conteo del
    vestidor y otros atuendos al azar en la demostración: esperado).
  - Arreglos tras la prueba completa: en el remoto, el dibujo y la barra de Orochi buscan las cabezas entre las
    unidades (`W3B.headsOf`; la lista del cuerpo no viaja y tumbaba el dibujo). Las cabezas ya no se bebían solas
    6 de las 8 tinajas al empezar: solo persiguen la que va rodando (empujada, «caliente» 2,5 s) o la que tienen
    encima, y las tinajas quedan más abajo. Dos máquinas: c26 en 379 s, 3 vidas.
  - Portada: el último torneo guardado se completa con lo nuevo (`mergePool`): el Sumo y los mapas nuevos salen
    marcados; lo que alguien desmarcó sigue desmarcado.
  - Prueba completa (`BASE=24f2919 bash test/todo.sh`): todo OK salvo mundo3Srt (arreglado arriba, luego OK) y
    «sin conexión» por la portada (esperado). Celular 844×390: niveles, jefes y cinemáticas se leen bien.
- **26 nov (noche)** — Pedido de Ignacio: bajar un poquito el Plasma de Galeras (fusión y Gran Sortilegio) y que los
  jefes del Mundo 3 y los árboles se vean menos simples, con textura. Versión 3.1.
  - **Galeras**: Plasma 27 → 25 de golpe y quemadura 2 → 1,7 s (≈9 % menos en total); en Gran Sortilegio, además
    ×0,97 (≈11 % menos). Revisado si otro mago tenía el problema de puntería que tenía el Plasma (rayo fijo mientras
    carga): ninguno. Supernova, Relámpago, Magma y Juicio ya caen donde VA a estar el rival y dejan esquivar a
    propósito; Prisma y Rayo negro son instantáneos.
  - **Jefes** (`10k2-art-w3boss.js`, ArtW3B2; `10k-art-w3b.js` ahora solo avisos, barras y reparte): texturas en
    mosaico (pelo, escamas, piel de tigre, grano de tinta) dentro de cada forma, luz y sombra. Kitsune: nueve colas
    esponjosas, marcas de kumadori, cuerda sagrada con cascabel, joya hōju y fuegos de zorro. Raijin y Fujin: nube de
    buen agüero con rizos de oro, aro de tambores con rayos al compás, piel de tigre, chal celeste, melena de pincel;
    saco de viento con remolinos. Orochi: anillos de escamas con panza roja que late, cedros y musgo, cuellos con
    escamas; cabezas con cresta de su elemento, barbas, lengua bífida. El Borrón: tinta húmeda con grano, cuernos,
    máscara de hannya agrietada, letras de pincel que giran, grietas de luz cuando pierde la coraza. Copias y tinajas.
    Para no pesar más, lo quieto se pinta una vez (cuerpo de la Kitsune, colas, cuerpo de Orochi, torso y cabeza de
    los dioses, nubes, tambores, brillos y llamitas). Medido: mismos cuadros por segundo que antes.
  - **Árboles** (`10i-art-ink.js` treeSpr): pinos con almohadas de agujas, cerezos y arces de hojitas en tres capas
    (sombra, color, luz) y hojas que caen, corteza con vetas y nudo, bambú con brillo y nudos claros.
  - Pruebas: `juegos/sortilegio/test/bossgal3.js` (galería de jefes) y `treegal.js` (árboles); offline-eq idéntico
    con `BASE=f73e610`; films, spells, c21 con dos máquinas (88 s) y netw3 OK.
- **26 nov (noche, 2)** — Cinemáticas mejores y en línea. Versión 3.2.
  - **En línea** (`10l-film.js`): ya salen también en línea, en todos los aparatos (entrada de cada nivel del Mundo 3
    desde `netStart`, presentación de jefes, y la caída de Buziraco y el final desde `netResults`). Solo el anfitrión
    la salta: al terminar o saltarla manda `{t:'filmEnd'}` y se cierra en los demás; el remoto no tiene botón ni doble
    toque y ve «El anfitrión puede saltarla». Si un remoto llega tarde (el anfitrión ya la cerró hace < 9 s), no la ve
    solo. `test/netw3-srt.js` lo comprueba (la ven los dos, el remoto no puede saltarla, se cierra en los dos).
  - **Más cine**: acabado en todas (viñeta, grano de película, velo de luz). La caída de Buziraco usa el dibujo real
    del jefe, sobre el abismo con grietas de lava, humo y brasas, y se agrieta de luz; el Borrón sale del charco de
    tinta. El paisaje del pergamino se pinta de verdad: cielo por estación, sol con resplandor, cordilleras en aguada,
    Fuji con nieve que escurre, nubes doradas con remolinos, mar con olas seigaiha y reflejo, torii con su reflejo,
    pagoda, los árboles del juego por estación, pájaros y lo que cae en cada panel. Sumi con textura y copete de
    pincel. Tarjeta de cada nivel con colinas, árboles y estación. Túnel de toriis lacados con faroles y niebla;
    biombo de pan de oro con brillo, viento y rayo; tormenta de Orochi con lluvia, relámpagos, montes, río y cuellos
    con escamas. Final con los dos magos de cuerpo entero (con su atuendo), fuegos artificiales y estaciones que caen.
  - Arreglo: en línea, la Travesía del anfitrión abre en la pestaña del Mundo 3 si ya va por ahí.
