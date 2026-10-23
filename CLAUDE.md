# Capacitación · Diseño Gráfico MIVAM — contexto para Claude

App web de evaluaciones y seguimiento de capacitación del Área de Diseño Gráfico MIVAM (Departamento de Multimedia · Ministerio Internacional Visión al Mundo). Líder del área y dueño del proyecto: Alejandro Marcano. Responde siempre en español; el código y los comentarios también van en español.

## Estado
- Producción: https://quiz-diseno.vercel.app (rama `main`, despliegue automático de Vercel en el equipo del área).
- Etapa 1 en producción desde el 22/10/2026: rediseño con el kit, Módulo 01 del curso de manual, práctica en pareja, vista de proyector y Apps Script v2.
- Los cambios van por PR (Vercel genera la vista previa) y se fusionan a `main` solo cuando Alejandro los aprueba.
- **Orden de despliegue:** primero se publica el Apps Script (`apps-script/Codigo.gs`, «Nueva versión» de la misma implementación para que no cambie la URL `/exec`) y después se fusiona a `main`.

## Hoja de ruta
1. Etapa 1 (hecha): sitio estático sin dependencias. El registro va a Google Sheets por Apps Script.
2. Etapa 2: Firebase con la cuenta de Google del área. Acceso con cuenta de Google (todos tienen) y modo competitivo en vivo tipo Kahoot: QR o código, cronómetro, puntos por acierto y rapidez, tabla de posiciones y podio con caritas. La corrección pasa al servidor para que las respuestas no queden en el cliente. La hoja de Excel se mantiene como reporte.
3. Etapa 3: tablero de seguimiento tipo Trello centrado en capacitación (Pendiente → En progreso → En revisión → Aprobado; tareas creadas por plantilla de módulo). Crean y aprueban tareas el líder y los miembros fijos. Incluye un panel del líder con el avance por fase y el criterio para pasar de fase.
4. Etapa 4: editor de quizzes dentro de la app.
- No duplicar el cronograma de servicios de Multimedia: es otro proyecto.

## Estructura
- `index.html`, `estilos.css` y `app.js`: rutas por hash (`#/inicio`, `#/sesion/<clave>`, `#/practica/<clave>`, `#/proyector/<clave>`).
- `contenido/*.js`: un archivo por programa o módulo que agrega a `window.CURSOS`. Claves: `S01`–`S06` (Photoshop, fijas en las columnas E–J de la hoja) y `M01-manual`, `M02-manual`… para los módulos del curso «De la marca al manual». Las prácticas en pareja usan `M01-logo`, `M02-radiografia`… El proyector muestra los campos con `proyectar` (ver README).
- `apps-script/Codigo.gs`: `doPost` (acciones `quiz` y `practica`, además del formato antiguo) y `doGet` (`progreso`, `practicas`, `ping`). `ping` devuelve `VERSION`: súbela en cada cambio para confirmar qué versión está publicada.

## Hoja de resultados («Base de Datos - Quiz Diseño»)
- La primera pestaña es una **tabla de Google Sheets** («Tabla_1», columnas con tipo: fecha, número, porcentaje). Columnas A–K: Nombre · Edad · FechaNacimiento · UltimaFecha · Sesion1–6 · Promedio; los módulos crean columnas desde la L.
- **El script nunca da formato a la hoja principal** (`setNumberFormat`, `setFontWeight`, etc.). La tabla no deja cambiar el formato de una columna con tipo, y como Sheets aplica los cambios en lote, el error sale después, en la siguiente lectura, y **`try/catch` no lo atrapa** (así fallaron los envíos hasta la 2.2). Las notas se escriben como texto `"83%"`, y las fechas como `Date`.
- Edad y Promedio son fórmulas de la hoja. El script no las pisa: copia la fórmula de la fila de arriba a una persona nueva.
- Las pestañas «Respuestas» y «Práctica <clave>» las crea el script y no son tablas.
- Antes de publicar un cambio del script, pruébalo con una hoja simulada que lance el error de formato en la **siguiente lectura**, no en la llamada.
- La fecha de nacimiento se pide a propósito, porque se usa para el registro de cumpleaños. La edad la calcula la hoja.

## Identidad (Kit de Identidad v1.2 · uso interno del área)
- Blanco primero: blanco ~70%, negro ~20% y **un solo par de color por pieza**. La app usa el par **Naranja** de Capacitación (fondo `#FFC79A`, tinta `#7A3410`).
- Otros pares, uno por frente: Azul `#A0B3FF`/`#010340` (Supervisión), Rosa `#FEB4FF`/`#6E3464` (Redes), Amarillo `#FFFFA7`/`#666634` (YouTube), Malva `#8D6969`/`#FFFFFF` (Visuales de servicio), Verde `#8AFFA6`/`#166B32` (Material interno).
- Grises: Gris trama `#8E8E8E` (solo relleno de caritas, nunca texto), Gris nube `#EBE9E9` (tarjetas) y texto secundario `#4D4D4D`.
- Estados aprobados: correcto = par Verde; error = `#FFD6CF`/`#8A1C0B`. El color nunca comunica solo: siempre va con su palabra.
- Tipografía: **Riking** solo en mayúsculas y titulares, nunca por debajo de 40 px en pantalla ni en párrafos (licencia web confirmada). **Poppins** para todo lo demás.
- Estilo plano: bordes negros de 2 px, sin sombras ni degradados, esquinas de 16 px y destellos máximo 3 por pantalla.
- Caritas del equipo: el color del frente va detrás, en un círculo; nunca se recolorean. Los aprendices sin carita usan iniciales sobre Naranja.
- Sistema de diseño completo en Claude Design: «Diseño Gráfico MIVAM».

## Cómo probar
- `python3 -m http.server` en la raíz y abrir `http://localhost:8000`.
- Para probar sin tocar la hoja real, interceptar `script.google.com` (por ejemplo con Playwright).
- Revisar a 390 px de ancho (sin desplazamiento horizontal) y en escritorio.
