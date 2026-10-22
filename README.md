# Capacitación · Diseño Gráfico MIVAM

App de evaluaciones y prácticas del Área de Diseño Gráfico MIVAM (Departamento de Multimedia · Ministerio Internacional Visión al Mundo). Usa la identidad interna del área (Kit de Identidad v1.2): blanco primero, par Naranja de Capacitación, Riking en titulares y Poppins en el texto.

## Estructura
| Archivo | Qué es |
| --- | --- |
| `index.html` | La página. Carga el contenido y la app. |
| `estilos.css` | Estilos con los tokens del sistema de diseño. |
| `app.js` | La lógica: ingreso, evaluaciones, envío al registro, práctica en pareja y vista de proyector. |
| `contenido/photoshop.js` | Las 6 sesiones del programa de Photoshop (claves S01–S06). |
| `contenido/manual-m01.js` | Curso «De la marca al manual», Módulo 01, con su práctica en pareja. |
| `apps-script/Codigo.gs` | Código del Google Apps Script conectado a la hoja de resultados. |
| `assets/` | Fuentes (Riking, Poppins) e imagen del equipo. |

## Rutas
- `#/inicio`: mis evaluaciones.
- `#/sesion/M01-manual`: una evaluación.
- `#/practica/M01-logo`: práctica en pareja.
- `#/proyector/M01-logo`: puesta en común para proyectar, se actualiza cada 15 s.

## Agregar un módulo
1. Copia `contenido/manual-m01.js` como `manual-m02.js` y cambia la clave (`M02-manual`), las preguntas y la práctica.
2. Agrega `<script src="contenido/manual-m02.js"></script>` en `index.html`, antes de `app.js`.
3. El registro crea su columna solo la primera vez que alguien envía ese módulo.
