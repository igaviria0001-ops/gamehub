#!/bin/bash
# Todas las pruebas, una tras otra (con el servidor de docs/ en 8765). Resumen al final: una línea por prueba.
# VIEW=400x225 achica las páginas de VÉRTIGO en máquinas lentas (sin GPU, 2 núcleos).
cd "$(dirname "$0")/.."
# servidor propio mientras duran las pruebas
(cd docs && exec python3 -m http.server 8765 --bind 127.0.0.1 >/dev/null 2>&1) & SRV=$!; trap "kill $SRV 2>/dev/null" EXIT; sleep 1
V=${VIEW:-400x225}
run() { local name="$1"; shift; local t0=$(date +%s); local out; out=$(timeout 1500 "$@" 2>&1 | tail -40); local last=$(echo "$out" | grep -E "OK|FALLA|IDÉNTICO|DIFERENCIAS|ERR |fallas|errores" | tail -1); echo "$(date +%H:%M) · $name · $(( $(date +%s) - t0 )) s · ${last:-sin resultado}"; echo "$out" > "/tmp/todo-$name.log"; }
run red node test/net.js
run sala node test/sala.js
run enlace node test/enlace.js
run vto node test/netvto.js
run vto3 env TRES=1 node test/netvto.js
run vtoJefe env MODE=boss node test/netvto.js
run srt node test/netsrt.js
run tya node test/nettya.js
run tyaFiesta env FIESTA=1 node test/nettya.js
run vtg env VIEW=$V node test/netvtg.js
run vtgModos env VIEW=$V node test/netvtgmodos.js
run torneo node test/nettour.js
run elegir node test/netelige.js
run elegirVtg env VIEW=640x360 G=vertigo node test/netelige.js
run elegirTyA env G=tira-y-afloja node test/netelige.js
run elegirAzar env CH=random G=ventolera node test/netelige.js
run celTyA node test/netcel.js
run celVto env JUEGO=ventolera node test/netcel.js
run sucesion node test/netsucc.js
run prediccion env VIEW=$V SIN=1 node test/netpred.js
run datos env VIEW=$V SECS=10 node test/netdatos.js
run relevo env VIEW=$V SECS=10 RELEVO=1 node test/netdatos.js
run redMala env RED='netloss=0.15&netlag=120' node test/netsrt.js
run movilCorte env PERFIL=corte CUT=9000 JUEGOS=sortilegio,ventolera,tira-y-afloja node test/netmovil.js
run movilRelevo env PERFIL=relay JUEGOS=sortilegio,ventolera,tira-y-afloja node test/netmovil.js
run sincronia node test/netsync.js
run iguales env VIEW=$V node test/netver.js
run ui node test/ui.js
run flujo node test/flujo.js
run app node test/app.js
run tablero node test/tablero.js
run motor node test/motor.js
# campañas en línea y servidor propio: necesitan el servidor local de la sala (servidor/, con wrangler) en 8799
if ! curl -s -m 2 http://127.0.0.1:8799/ping >/dev/null; then (cd servidor && exec npx --yes wrangler dev --port 8799 --ip 127.0.0.1 >/tmp/wrangler-todo.log 2>&1) & WR=$!; trap "kill $SRV $WR 2>/dev/null" EXIT; for i in $(seq 1 40); do curl -s -m 2 http://127.0.0.1:8799/ping >/dev/null && break; sleep 1; done; fi
if curl -s -m 2 http://127.0.0.1:8799/ping >/dev/null; then
  run servidor node test/netsrv.js
  run servidorCae node test/srvcae.js
  run movilServidor env PERFIL=corte SRV=http://127.0.0.1:8799 JUEGOS=sortilegio,ventolera node test/netmovil.js
  run campSrt node test/netcamp-srt.js
  run mundo3Srt env LVS=18,20,23,25 node test/netw3-srt.js
  run travVto node test/nettrav-vto.js
  run campTyA node test/netcamp-tya.js
  run mundoVtg env VIEW=$V node test/netcamp-vtg.js
else echo "campañas en línea: saltadas (no arrancó el servidor local en 8799)"; fi
run sinConexion env FAST=1 VIEW=480x270 node test/offline-eq.js
# pruebas propias de cada juego (sus carpetas de trabajo; la de VÉRTIGO está en el bloc de notas de la sesión)
for g in tya vento sorti; do [ -f /home/claude/$g/test/modes.js ] && run propias-$g node /home/claude/$g/test/modes.js; done
[ -f /home/claude/vento/test/soakall.js ] && run propias-vento-soak env ARENAS=cocora,capadocia node /home/claude/vento/test/soakall.js
[ -f /home/claude/sorti/test/chaos.js ] && run propias-sorti-chaos node /home/claude/sorti/test/chaos.js
[ -f /home/claude/tya/test/chaos.js ] && run propias-tya-chaos node /home/claude/tya/test/chaos.js
echo FIN
