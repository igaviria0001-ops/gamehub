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
