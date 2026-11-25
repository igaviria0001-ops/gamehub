# En línea con servidor propio en Cloudflare — plan completo (Tanda 5)

> Plan cerrado para seguirlo paso a paso, sin improvisar. Diseño y bitácora de lo anterior: [ONLINE.md](ONLINE.md) y
> [TANDA4.md](TANDA4.md). Pasos de Ignacio: [servidor/GUIA-CLOUDFLARE.md](servidor/GUIA-CLOUDFLARE.md).
> Trabajo en la rama `tanda5`; a `main` solo cuando todo lo de «Pruebas» pase.

## 1. Dónde estamos (25 nov 2026)
- Hoy el en línea funciona así: **señal** (encontrarse) por 3 servidores MQTT públicos a la vez; **datos** por WebRTC
  directo (canal ordenado `r` + canal rápido sin reenvío `u`); si no conecta, **TURN público** (Open Relay, lejos y
  lento) y, como último recurso, **relevo por MQTT** (lento). Ya hay: vuelta a directo apenas revive, colchón de hasta
  400 ms, predicción del personaje propio, instantáneas pequeñas, aviso de versión distinta.
- Ya está escrito y probado en local (`wrangler dev`): el **servidor** (`servidor/src/index.js`: un Durable Object por
  sala que reparte mensajes cifrados; `/ice` con credenciales TURN de Cloudflare; `/ping`) y el **cliente** que lo usa
  si `SERVER0` (`app/net.js`) tiene la dirección. Con `SERVER0 = ''` todo queda como hoy.
- **Falta**: que Ignacio active la cuenta, cree la llave TURN, conecte el repositorio y mande la dirección del Worker.

## 2. Meta (medible, se mide antes y después)
| | Hoy | Meta |
|---|---|---|
| Unirse a una sala (abrir el enlace → «conectado») | 3–10 s, a veces falla un broker | **< 2 s** |
| Conexión con datos móviles | directo o TURN público lejano | directo o **TURN de Cloudflare en Colombia** en ≥ 95 % |
| Ping entre dos celulares en Colombia por TURN | 150–300 ms (Open Relay) | **≤ 80 ms** |
| Relevo de último recurso | MQTT público (lento, a saltos) | **WebSocket propio** (mismo ritmo que lo directo) |
| Cambiar de wifi a datos en plena partida | 3–7 s congelado | **< 2 s** y sin salirse de la partida |
| «Hambre» del dibujo (`test/netmovil.js`, perfil mob/relay) | 0–3 % | **≤ 1 %**, ninguna congelada > 0,3 s |
| Costo | 0 | **0** (dentro del plan gratis, ver §6) |
| Sin conexión | — | **idéntico** (`test/offline-eq.js`) |

## 3. Cómo queda (arquitectura final)
> **Cambio del 25 nov 15:50**: Cloudflare le pide tarjeta a Ignacio para activar Realtime (TURN), aunque los primeros
> 1.000 GB sean gratis. Se sigue **sin TURN de Cloudflare** (no se paga ni se pone tarjeta): `/ice` responde `sin-turn` y el
> cliente usa STUN + Open Relay; cuando lo directo no se puede, el camino principal pasa a ser el **relevo propio por el
> WebSocket** (Durable Object en Sudamérica), que es lo que más hay que pulir (A5: medir si Open Relay o el relevo
> propio va mejor y elegir el más rápido). Si algún día se pone tarjeta, el TURN se suma sin cambiar nada más (pasos 2 y 4).
1. **Señal**: primero el WebSocket del servidor (Durable Object de la sala, pedido en Sudamérica con `locationHint: 'sam'`).
   Si en 2 s no abre, se suman los MQTT públicos (hoy van siempre los 3 a la vez: más tráfico y más lento).
2. **Datos**: WebRTC directo; si no se puede, por **TURN de Cloudflare** (anycast: entra por el punto más cercano,
   Bogotá/Medellín/Barranquilla), con `turns:…:443` para redes que bloquean UDP. Open Relay solo si Cloudflare no responde.
3. **Último recurso**: relevo por el WebSocket del servidor (no por MQTT).
4. **Elección por medida**: cada aparato mide el ping de cada camino que tiene abierto y usa el más rápido (con margen de
   20 ms y 3 medidas seguidas para no saltar de un lado a otro).
5. **Cambio de red**: al pasar a `disconnected` más de 1 s se hace `restartIce()` en la misma conexión (sin rehacer la sala);
   mientras tanto los datos siguen por el relevo propio, así la partida no se congela.

## 4. Pasos (en este orden; cada uno con su prueba)
**Parte A — se puede hacer ya, sin la dirección (se prueba con `cd servidor && npx wrangler dev --port 8799`)**
- **A1 · Servidor**: `locationHint: 'sam'` al pedir la sala; `/ping` devuelve también el `colo` del Worker y el de la sala;
  límite por aparato (≤ 120 mensajes/s y ≤ 64 KB por mensaje; si pasa, se cierra con 1008) para que un error no gaste el
  plan gratis; `/ice` sigue con caché de 6 h. Prueba: `test/netsrv.js` + nueva `test/srvlimit.js` (tasa y tamaño).
- **A2 · Señal por el servidor primero** (`app/net.js`, `Signal()`): MQTT entra solo si el servidor no abre en 2 s o se cae;
  si el servidor vuelve, MQTT se apaga a los 30 s. Prueba: `test/net.js`, `test/sala.js`, `test/netsync.js` con y sin
  `?server=`; nueva medida «tiempo hasta conectado» en `test/netmovil.js`.
- **A3 · TURN de Cloudflare completo**: no recortar las direcciones `turns:` (hoy `.slice(0, 8)`); Open Relay al final y
  solo si `/ice` falló. Prueba: `iceTypes()` en Ajustes → «Probar» muestra `relay` por Cloudflare.
- **A4 · Cambio de red sin congelarse**: `restartIce()` + relevo propio mientras tanto; el anfitrión también lo hace.
  Prueba: `PERFIL=corte` y `CORTE=directo` en `test/netmovil.js` (meta: < 2 s sin datos nuevos).
- **A5 · Elegir el camino más rápido** (directo / TURN / relevo propio) por ping medido, con margen. Prueba: perfil nuevo
  `PERFIL=lento-directo` (lo directo con +200 ms): debe pasarse al relevo propio y volver cuando mejore.
- **A6 · Se ve cómo va**: en la sala, junto a cada aparato, «Directo · 35 ms» / «Cloudflare · 60 ms» / «Respaldo · 90 ms»;
  en Ajustes → EN LÍNEA → «Probar»: servidor ✓ (y su ciudad), TURN ✓, ping. Prueba: `test/sala.js` (que se vea y no tape nada,
  también en celular).
- **A7 · Si el servidor falla o se acaba el plan del día**: el juego sigue solo con MQTT + Open Relay sin que nadie note
  nada. Prueba: servidor local apagado a mitad de partida y respuesta 429/1011 simulada.

**Parte B — cuando Ignacio mande la dirección**
- **B1** Poner la dirección en `SERVER0` (`app/net.js`); `node build.js`.
- **B2** Revisar `/ice` y `/ping` (si el navegador de pruebas de Claude no alcanza `workers.dev`, lo revisa Ignacio con
  «Probar» y manda una foto).
- **B3** Medir antes/después con `test/netmovil.js` (mob, relay, corte, lento-directo) apuntando al servidor de verdad
  si se alcanza; si no, al local, y la prueba real la hace Ignacio (B5).
- **B4** Pruebas completas (§5), publicar a `main`, republicar el artefacto.
- **B5** Prueba real con Ignacio (lista corta): dos celulares con datos (uno con Claro/Tigo/Movistar distinto si se
  puede), uno con wifi; Ajustes → «Probar» en los tres; jugar 5 min de Sortilegio y 5 de Ventolera; a mitad, apagar el
  wifi de uno; mandar foto de lo que dice la sala (camino y ms de cada uno).
- **B6** Mirar el uso en Cloudflare a la semana (Ignacio manda foto de «Metrics» del Worker) y confirmar que va muy
  por debajo del plan gratis.

## 5. Pruebas que tienen que pasar antes de `main`
`bash test/todo.sh` completo (levanta su servidor local), más: `test/netsrv.js`, `test/srvlimit.js`, `test/netmovil.js`
(los 4 perfiles, los 3 juegos que se pueden medir), `test/netpred.js`, `test/netver.js` (19 modos), `test/nettour.js`,
las 4 campañas en línea (`test/netcamp-*.js`) y `test/offline-eq.js` (sin conexión idéntico en los 4 juegos).

## 6. Plan gratis (cálculo; se revisa en B6)
- **TURN**: 1.000 GB al mes gratis (cuenta lo que sale de Cloudflare). Una partida de Sortilegio manda ~1,2 KB × 20 por
  segundo por remoto ≈ 90 MB por hora: alcanza para miles de horas al mes.
- **Durable Objects**: 100.000 pedidos al día; los mensajes de WebSocket que llegan cuentan 20 a 1 (≈ 2 millones de
  mensajes al día). La señal casi no gasta; el relevo de un aparato a 20 mensajes/s ≈ 3.600 pedidos por hora. Si un día se
  acabara, el juego sigue por MQTT (A7).
- **Workers**: 100.000 pedidos al día (cada conexión de sala y cada `/ice` es uno): sobra.

## 7. Lo que no se toca
Códigos de sala, enlace `?sala=`, cifrado de aparato a aparato (el servidor nunca ve el contenido), nombres y prefijos de
lo guardado, el modo sin conexión. Los secretos de TURN solo viven en Cloudflare, nunca en el código ni en el chat.
Para volver atrás en cualquier momento: `SERVER0 = ''`.

## 7b. Antes de escribir código: revisar lo que pueda estar viejo
- Volver a leer en la documentación de Cloudflare: `locationHint` (Durable Objects → Data location), límites del plan
  gratis (Durable Objects → Pricing) y la llamada de credenciales TURN (Realtime → TURN), porque Cloudflare los cambia.
- Volver a leer `app/net.js` (`Signal`, `iceServers`, `newPeer`, `toRelay`/`backToDirect`) para no repetir lo que ya hace.

## 8. Cómo retomar
1. `git checkout tanda5` (si no existe: crearla desde `main`).
2. Leer la bitácora de abajo: el último paso dice qué sigue.
3. Servidor local: `cd servidor && npx --yes wrangler dev --port 8799 --ip 127.0.0.1`; página: `cd docs && python3 -m
   http.server 8765 --bind 127.0.0.1` (los dos en segundo plano); probar con `?server=http://127.0.0.1:8799`.

## Bitácora (lo más nuevo abajo)
- **25 nov 15:50** — Plan escrito. Sin TURN de Cloudflare (pide tarjeta; ver nota en §3). Esperando la dirección del Worker de Ignacio para la Parte B; la Parte A se puede
  empezar cuando Ignacio diga.
- **25 nov 16:05** — Ignacio creó el Worker (sin TURN, sin tarjeta): `https://gamehub-red.igaviria0001.workers.dev`
  (responde `/ping`). Desde la nube de Claude no se alcanza `workers.dev` (lista de sitios): las pruebas van con el
  servidor local, que es el mismo código. Primer intento de Cloudflare falló porque corre `npm run build` y no había
  script → se agregó uno vacío en `servidor/package.json`.
- **25 nov ~17:00 — Parte A hecha (rama `tanda5`)**. Decisiones al hacerla (cambian el plan, con su razón):
  - **Sin `locationHint: 'sam'`**: la sala se crea cerca de quien la abre (el anfitrión). Desde Colombia el tráfico sale
    casi siempre por Miami; forzar Sudamérica podía mandarla a São Paulo, más lejos.
  - **MQTT sigue en paralelo** para encontrarse (no solo como respaldo): con un aparato de versión vieja o con el
    servidor caído igual se encuentran; la señal ya llega primero por el servidor y los repetidos se descartan.
  - **Elegir camino con medidas de verdad** (`choosePath` en `app/net.js`): cada 2 s un ping por el relevo del servidor
    (`relayPing`) mientras se va por un TURN, y uno por lo directo (`directSend`) mientras se va por el servidor. Solo si
    ICE terminó en un **TURN** (p. ej. el público lejano) y el servidor gana ≥ 60 ms o un 20 % (3 medidas seguidas, 5 s
    después de cada cambio) se pasa al servidor; vuelve si lo directo gana 30 ms. Lo **directo de verdad** entre dos
    aparatos no se cambia: con un estimado se pasaba de más, y aun midiendo, en el juego el ruido del ping (rachas de
    congestión) lo hacía cambiar sin razón y quedarse en el relevo (que junta instantáneas, ~30/s: menos fluido).
  - **Paso más rápido al relevo** con el servidor: 1 s de gracia (antes 2,5) y la conexión nueva a los 3 s (antes 6).
  - **Servidor «fresco»**: el latido es cada 3 s; si no contesta en 2,5 s (WebSocket medio muerto al cambiar de red) se
    deja de confiar en él y todo sale también por la señal pública; se cierra a los 12 s sin nada.
  - **Freno del servidor**: 300 mensajes/s por aparato durante 3 s (un anfitrión que releva a 4 aparatos manda ~140/s).
  - La sala muestra «por tu servidor» (verde) en vez de «por relevo · lento». Ajustes → Probar muestra el servidor y
    su ciudad de Cloudflare.
  - Medido (`test/netmovil.js`, 2 aparatos con la red simulada de datos móviles, Sortilegio y Ventolera):

    | Caso | Sin servidor (antes) | Con el servidor |
    |---|---|---|
    | Corte de 6 s de lo directo (cambio de antena), 4 pasadas | congelado hasta **2,8–3,3 s**, «hambre» 11–17 % | Sortilegio **0,05 s** (hambre 0,3–0,7 %), Ventolera ~**1 s** (5–7 %); los dos vuelven a directo |
    | Solo relevo (lo directo no se puede) | ping ~**0,9–1,0 s** | ping ~**0,46–0,50 s** |
    | Datos móviles normales | directo | directo (no cambia nada) |

  - Pruebas nuevas: `test/srvcae.js` (servidor que deja de contestar, se cae, vuelve y corta a quien manda de más) y
    `PERFIL=corte SRV=… test/netmovil.js` en `test/todo.sh`.
  - Plan gratis (para Ignacio): cada aparato que va por el servidor gasta ~10.800 pedidos por hora (60 mensajes/s a 20:1);
    con 100.000 al día alcanza para ~9 horas al día de un aparato por el relevo. Si un día se acaba, el juego sigue por MQTT.
- **25 nov ~17:45** — Suite completa (`bash test/todo.sh`, servidor local; las que se cayeron porque se apagó el servidor de
  pruebas se repitieron): todo OK. `test/offline-eq.js`: igual que antes de esta tanda (Sortilegio distinto a propósito;
  en Ventolera y VÉRTIGO solo el número de versión de la portada). Se publica a `main` con `SERVER0` = el Worker de Ignacio.
- **Sigue (B5)**: prueba real con Ignacio (lista en §4) y mirar el uso en Cloudflare a la semana (B6).
