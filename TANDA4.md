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

## Bitácora
- **24 nov 20:10** — S: servidor escrito y probado en local con `wrangler dev` (sala, mensajes a uno y a todos,
  latido; `/ice` responde `sin-turn` sin secretos). Subido a `main` (b80adc7). Guía enviada a Ignacio.
