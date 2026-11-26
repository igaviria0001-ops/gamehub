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
