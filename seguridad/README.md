# Seguridad · Capacitación Diseño Gráfico MIVAM

Qué protege la app, qué hay que configurar una sola vez y qué reglas activar en el cortafuegos de Vercel.

## Modelo de seguridad (desde la versión 3)

| Riesgo | Antes | Ahora |
| --- | --- | --- |
| Subir notas a nombre de otra persona | Cualquiera con la URL `/exec` | Cada petición lleva el token de Google; el Apps Script lo verifica con Google y usa **solo** el correo que viene dentro. |
| Ver las notas de otra persona | `?action=progreso&nombre=…` abierto | Cada quien recibe solo sus notas. Las lecturas por GET ya no existen. |
| Ver las prácticas de todos | Abierto | Solo los correos de `ADMINS` (proyector). |
| Respuestas correctas en el navegador | Estaban en `contenido/*.js` | La construcción las quita; se corrige en el servidor con `Claves.gs`. |
| Mejorar la nota repitiendo | El cliente decidía | La primera evaluación enviada cuenta; las demás son repaso (lo decide el servidor). |
| Fórmulas en la hoja (`=IMPORTXML(…)`) | Se escribían tal cual | Todo texto que empieza con `= + - @` se guarda como texto. |
| Crear pestañas o columnas basura | Cualquier clave | Solo claves y campos que existen en `Claves.gs`. |
| Abuso (muchas peticiones) | Sin límite | 40 peticiones por minuto por cuenta y envíos de máximo 20 000 caracteres. |
| Insertar la app en otro sitio, scripts ajenos | Sin cabeceras | CSP estricta, `frame-ancestors 'none'`, HSTS, `nosniff` y demás (ver `vercel.json`). |
| Robar un nombre ya registrado | — | Un nombre pertenece a una sola cuenta. Para unir una persona antigua, su fecha de nacimiento debe coincidir. |

Datos personales: nombre, fecha de nacimiento y teléfono viven solo en la hoja (pestaña «Registro»). El navegador guarda el token en la pestaña (`sessionStorage`) y los resultados propios mientras dure la sesión. «Salir» borra todo.

## Configuración (una sola vez)

### 1. ID de cliente de Google (OAuth)
1. Entra a <https://console.cloud.google.com> con la cuenta de Google del área y crea un proyecto, por ejemplo «Capacitación MIVAM».
2. **APIs y servicios → Pantalla de consentimiento de OAuth**: tipo **Externo**, nombre de la app «Capacitación · Diseño Gráfico MIVAM», correo de soporte del área. No agregues permisos (scopes) extra: basta con los básicos (`openid`, correo y perfil). Después pulsa **Publicar app** (en producción), porque en «Prueba» solo pueden entrar los usuarios de prueba. Con los permisos básicos Google no pide verificación.
3. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth**, tipo **Aplicación web**.
   - **Orígenes de JavaScript autorizados**:
     - `https://diseno-grafico-mivam.vercel.app`
     - `https://quiz-diseno.vercel.app`
     - `http://localhost:8000` (para probar en tu computadora)
     - La URL fija de la rama de vista previa, por ejemplo `https://quiz-diseno-git-<rama>-<equipo>.vercel.app`. Google no acepta comodines, así que las URLs aleatorias de cada despliegue no sirven para entrar.
   - No hace falta «URI de redireccionamiento».
4. Copia el **ID de cliente** (termina en `.apps.googleusercontent.com`). No es secreto.
5. Pégalo en `app.js`, en `GOOGLE_CLIENT_ID`.

### 2. Apps Script
1. Abre la hoja → **Extensiones → Apps Script**.
2. Reemplaza el contenido de `Código.gs` por `apps-script/Codigo.gs`.
3. Crea un archivo nuevo llamado **Claves** y pega `apps-script/Claves.gs`. Cada vez que cambies un módulo, vuelve a construir (`node herramientas/construir.js`) y vuelve a pegar este archivo.
4. **Configuración del proyecto (engranaje) → Propiedades del script**:
   - `CLIENT_ID` = el mismo ID de cliente del paso 1.
   - `ADMINS` = correos de los administradores separados por coma (Alejandro y los miembros fijos).
5. **Implementar → Administrar implementaciones → editar (lápiz) → Versión: «Nueva versión» → Implementar**. Google pedirá autorizar de nuevo, porque ahora el script consulta a Google para verificar el token (`UrlFetchApp`). Mantén «Ejecutar como: Yo» y «Quién tiene acceso: Cualquier usuario»: la seguridad la da el token, no el acceso al script.
6. Comprueba que `…/exec` responde `{"status":"ok","version":3}`.

### 3. Orden de despliegue
1. Publica el Apps Script v3 (paso 2).
2. Fusiona el PR a `main`.

Entre el paso 1 y el 2, la versión vieja de la app deja de poder guardar, porque el script ya exige token. Hazlo fuera del horario de sesiones.

### 4. La hoja
- Comparte la hoja solo con quien la necesita (Archivo → Compartir). Nadie fuera del liderazgo debe tener acceso de lectura: contiene teléfonos y fechas de nacimiento.
- Para dejar que alguien repita una evaluación, borra su nota en la hoja principal.
- Para cambiar el nombre o el estado de una cuenta (Aspirante, Participante, Miembro), edítalo en la pestaña «Registro». El nombre debe coincidir con la columna A de la hoja principal.

## Cortafuegos de Vercel (lo activas tú en el panel)

Proyecto → **Firewall**. Después de cada cambio, **Review Changes → Publish**.

> El cortafuegos protege el sitio estático. Las peticiones al registro van directo del navegador a `script.google.com`, así que a esas las protege el token de Google y el límite del Apps Script, no Vercel.

### Reglas recomendadas

| # | Nombre | Condición | Acción |
| --- | --- | --- | --- |
| 1 | Solo lectura | Request Method **no es** `GET` ni `HEAD` | Deny |
| 2 | Rutas de ataque conocidas | Request Path **empieza con** `/wp-`, `/.env`, `/.git`, `/admin`, `/phpmyadmin`, `/cgi-bin` **o** Path **termina en** `.php` | Deny (1 h) |
| 3 | Límite por IP | Request Path **empieza con** `/` · Rate limit: **300 peticiones / 60 s por IP**, fixed window | Rate limit → Deny |

Una clase completa entrando a la vez desde la misma red (misma IP) carga unas 10 peticiones por persona. 300 por minuto alcanza para unas 30 personas a la vez. Si en una sesión grande aparecen bloqueos, sube el límite.

### Protecciones administradas
- **Bot Protection** (reglas administradas): en **Challenge**. Deja pasar a los navegadores reales y frena scripts.
- **AI Bots**: en **Deny**. La app es interna y no necesita que la rastreen (además se envía `X-Robots-Tag: noindex`).
- **Attack Challenge Mode**: solo si hay un ataque en curso. Pide un desafío a todo visitante; la app sigue funcionando para personas.

### Deployment Protection
Proyecto → Settings → **Deployment Protection**: deja **Vercel Authentication** en «Standard Protection». Así las vistas previas de cada PR solo las abre el equipo.

### Con la CLI (opcional)
```bash
vercel firewall rules add "Solo lectura" \
  --condition '{"type":"method","op":"inc","value":["GET","HEAD"],"neg":true}' \
  --action deny --yes
vercel firewall rules add "Límite por IP" \
  --condition '{"type":"path","op":"pre","value":"/"}' \
  --action rate_limit --rate-limit-window 60 --rate-limit-requests 300 \
  --rate-limit-keys ip --rate-limit-action deny --yes
```
Revisa el resultado en el panel antes de publicar.

## Cabeceras (en `vercel.json`, se despliegan con el código)
- `Content-Security-Policy`: solo scripts propios y el de Google Identity; conexiones solo a Apps Script y Google; sin iframes externos.
- `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`, que la ventana de Google necesita.

Si se agrega un servicio externo (fuentes, analítica, Firebase en la Etapa 2), hay que sumarlo a la CSP o el navegador lo bloqueará.

## Pendiente para la Etapa 2 (Firebase)
- Reglas de seguridad de Firestore por usuario y corrección en Cloud Functions (plan Blaze).
- App Check o BotID para el modo en vivo.
- Mover `ADMINS` a roles en Firestore.
