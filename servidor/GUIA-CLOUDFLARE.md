# Servidor de GameHub en Cloudflare (gratis) — pasos para Ignacio

Esto se hace **una sola vez** (unos 15 minutos). Después, cada vez que Claude mejore el servidor en GitHub, Cloudflare lo actualiza solo.

**Qué gana el en línea:** con datos móviles, los celulares casi nunca logran conectarse directo entre sí. Hasta ahora, cuando pasaba eso, el juego iba por servidores públicos lejanos y lentos. Con esto:
- Se conectan por los servidores de Cloudflare, que tiene puntos en Bogotá, Medellín y Barranquilla (respuesta muy rápida).
- Si aun así falla, el respaldo va por tu propio servidor, también cercano, en vez de los públicos.
- Gratis: hasta 1.000 GB al mes (con tus amigos no llegas ni al 1 %). No pide tarjeta.

---

## 1. Crear la cuenta

1. Entra a **https://dash.cloudflare.com/sign-up**
2. Pon tu correo y una contraseña → **Sign up**.
3. Confirma el correo que te llega.
4. Si te pregunta qué quieres hacer o te ofrece planes, elige lo gratis (**Free**) o sáltalo.

### Si no te deja crear la cuenta o entrar (lo que te pasó)

Lo que te salió dice que **ya tienes una cuenta de Cloudflare** con ese correo, creada por otro camino (con Google,
con GitHub o con una contraseña de hace tiempo). Por eso «ya está usado» al registrarte y «se usó otro método» al
entrar con GitHub. No hace falta crear nada: solo recuperar la entrada.

1. Entra a **https://dash.cloudflare.com/login** y toca **Forgot your password?** (¿Olvidaste tu contraseña?).
2. Escribe el correo que te decía **«ya está usado»** → **Send** (Enviar).
3. Abre ese correo (mira también **Spam** y **Promociones**). Toca el enlace y pon una contraseña nueva.
4. Vuelve a **dash.cloudflare.com/login** y entra con **ese correo y la contraseña nueva** (no con el botón de GitHub).
   Si te pide un código, es el que te llega al correo.
5. Si en 10 minutos no te llega nada, haz lo mismo con tu otro correo.
6. Si con ninguno llega: crea un Gmail nuevo (gratis) y regístrate en **dash.cloudflare.com/sign-up** con ese correo y
   una contraseña. Da igual qué correo sea: el servidor solo necesita una cuenta.

Mientras tanto el en línea sigue funcionando como siempre (con los servidores públicos); con Cloudflare solo se vuelve
más rápido y estable con datos móviles.

## 2. Crear la llave de conexión (TURN)

1. En el menú de la izquierda busca **Realtime** (en algunas cuentas sale como **Calls**). Si no lo ves, usa el buscador de arriba y escribe `TURN`.
2. Entra a **TURN Server** → botón **Create** (o **Create TURN Key**).
3. Nombre: `gamehub` → **Create**.
4. Te muestra dos datos. **Cópialos en una nota del celular** (el segundo solo se muestra una vez):
   - **Turn Token ID** (o *Key ID*)
   - **API Token**

## 3. Conectar el servidor con GitHub

1. En el menú de la izquierda: **Compute (Workers)** → **Workers & Pages** (o busca `Workers`).
2. Botón **Create** (o **Create application**).
3. Elige **Import a repository** (Importar un repositorio).
4. Te pide conectar **GitHub**: entra con tu cuenta `igaviria0001-ops` y autoriza. Si pregunta a qué repositorios dar acceso, elige **Only select repositories** → `gamehub` → **Install / Save**.
5. De vuelta en Cloudflare, elige el repositorio **gamehub**.
6. En la configuración:
   - **Project name** (nombre): `gamehub-red` ← tiene que ser exactamente así.
   - Abre **Advanced settings** (configuración avanzada) → **Root directory** (o **Path**): `servidor`
   - Lo demás déjalo como está.
7. **Deploy** (o **Save and Deploy**). Espera 1–2 minutos hasta que diga que terminó (Success).

## 4. Darle la llave al servidor

1. Entra al Worker **gamehub-red** → pestaña **Settings** → **Variables and Secrets**.
2. **Add** → tipo **Secret** → nombre: `TURN_KEY_ID` → valor: el **Turn Token ID** del paso 2.
3. **Add** otra vez → tipo **Secret** → nombre: `TURN_KEY_API_TOKEN` → valor: el **API Token** del paso 2.
4. **Deploy** (o **Save**).

## 5. Mandarle la dirección a Claude

1. En el Worker **gamehub-red**, arriba sale su dirección, parecida a: `https://gamehub-red.TU-NOMBRE.workers.dev`
2. Ábrela en el navegador y agrégale `/ice` al final. Debe salir un texto con `turn.cloudflare.com`. Si sale `sin-turn`, revisa el paso 4.
3. **Mándale esa dirección a Claude** (sin el `/ice`). Con eso, Claude la pone en GameHub y queda funcionando para todos.

---

**Seguridad:** el Turn Token ID y el API Token **no** se los mandes a nadie ni los pegues en el chat; solo van en Cloudflare (paso 4). La dirección del Worker sí se puede compartir.

**Si algo no sale igual:** Cloudflare cambia los nombres de los menús de vez en cuando. Mándale a Claude una foto de la pantalla y te dice dónde tocar.
