# Capacitación · Diseño Gráfico MIVAM

App de evaluaciones y prácticas del Área de Diseño Gráfico MIVAM (Departamento de Multimedia · Ministerio Internacional Visión al Mundo). Usa la identidad interna del área (Kit de Identidad v1.2): blanco primero, par Naranja de Capacitación, Riking en titulares y Poppins en el texto.

## Estructura
| Archivo | Qué es |
| --- | --- |
| `index.html` | La página. Lista los módulos de contenido (la construcción los reemplaza por `cursos.js`). |
| `estilos.css` | Estilos con los tokens del sistema de diseño. |
| `app.js` | La lógica: acceso con Google, registro, evaluaciones, práctica en pareja y vista de proyector. |
| `contenido/photoshop.js` | Las 6 sesiones del programa de Photoshop (claves S01–S06). |
| `contenido/manual-m01.js`, `manual-m02.js` | Curso «De la marca al manual», un archivo por módulo, cada uno con su práctica en pareja. |
| `apps-script/Codigo.gs` | Apps Script de la hoja: verifica el token de Google, corrige y guarda. |
| `apps-script/Claves.gs` | Respuestas y retroalimentación para corregir. **Generado**: no se edita a mano. |
| `herramientas/construir.js` | Construye `publico/` (lo que publica Vercel, sin respuestas) y `Claves.gs`. |
| `vercel.json` | Construcción y cabeceras de seguridad. |
| `seguridad/README.md` | Modelo de seguridad, configuración de Google y reglas del cortafuegos. |
| `assets/` | Fuentes (Riking, Poppins) e imagen del equipo. |

## Construir y probar
```bash
node herramientas/construir.js           # crea publico/ y apps-script/Claves.gs
python3 -m http.server -d publico        # abre http://localhost:8000
```
Vercel ejecuta la misma construcción en cada despliegue. Para entrar en local hace falta `GOOGLE_CLIENT_ID` en `app.js`, con `http://localhost:8000` autorizado (ver `seguridad/README.md`).

## Rutas
- `#/inicio`: mis evaluaciones.
- `#/sesion/M01-manual`: una evaluación.
- `#/practica/M01-logo`: práctica en pareja.
- `#/proyector/M01-logo`: puesta en común para proyectar, se actualiza cada 15 s. Solo administradores (`ADMINS`).

Todas las rutas piden entrar con Google; la primera vez se completa el registro (nombre, fecha de nacimiento y teléfono).

## Agregar un módulo
1. Copia `contenido/manual-m01.js` como `manual-m02.js` y cambia la clave (`M02-manual`), las preguntas y la práctica.
2. Agrega `<script src="contenido/manual-m02.js"></script>` en `index.html`, antes de `app.js`.
3. Ejecuta `node herramientas/construir.js` y pega el nuevo `apps-script/Claves.gs` en el archivo «Claves» de Apps Script. Publica una «Nueva versión» **antes** de fusionar a `main`: sin la clave, el servidor no puede corregir el módulo.
4. El registro crea su columna solo la primera vez que alguien envía ese módulo, y la pestaña «Práctica <clave>» la primera vez que se envía su práctica.

En la práctica:
- `proyectar: true` en un campo lo muestra en la tarjeta de cada pareja en el proyector. El primer campo de tipo `texto` marcado así es el título de la tarjeta. Con un texto en lugar de `true` (`proyectar: "Su regla"`) se cambia su rótulo.
- `observacion: { pregunta, placeholder, conteo }` cambia los textos de las filas Sí/Casi/No. Por defecto: «¿Se repite?», «¿Qué observan?» y «se repite». La `pregunta` también nombra la columna en la hoja: no se cambia en una práctica que ya recibió envíos.
