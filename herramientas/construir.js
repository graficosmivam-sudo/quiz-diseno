#!/usr/bin/env node
/* Construcción del sitio · Diseño Gráfico MIVAM
   Sin dependencias: solo Node.

   1. Lee los módulos de contenido/*.js en el orden en que index.html los carga.
   2. Escribe publico/: el sitio que publica Vercel. Su cursos.js lleva las preguntas SIN las
      respuestas correctas ni la retroalimentación, que la revelaría.
   3. Escribe apps-script/Claves.gs: las respuestas y la retroalimentación que el Apps Script usa
      para corregir en el servidor. Se pega en el proyecto de Apps Script junto a Codigo.gs.

   Uso:  node herramientas/construir.js              → construye
         node herramientas/construir.js --comprobar  → falla si Claves.gs no está al día */
"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");
var crypto = require("crypto");

var RAIZ = path.resolve(__dirname, "..");
var SALIDA = path.join(RAIZ, "publico");
var CLAVES_GS = path.join(RAIZ, "apps-script", "Claves.gs");
var comprobar = process.argv.indexOf("--comprobar") !== -1;

function leerArchivo(rel) { return fs.readFileSync(path.join(RAIZ, rel), "utf8"); }
function huella(texto) { return crypto.createHash("sha256").update(texto).digest("hex").slice(0, 10); }
function fallar(msg) { console.error("✗ " + msg); process.exit(1); }

/* ---------- 1. Contenido, en el orden de index.html ---------- */
var indice = leerArchivo("index.html");
var reScript = /<script src="(contenido\/[^"]+\.js)"><\/script>\s*\n?/g;
var modulos = [];
var m;
while ((m = reScript.exec(indice))) modulos.push(m[1]);
if (!modulos.length) fallar("index.html no carga ningún archivo de contenido/.");

var caja = { window: {} };
vm.createContext(caja);
modulos.forEach(function (rel) { vm.runInContext(leerArchivo(rel), caja, { filename: rel }); });
var cursos = JSON.parse(JSON.stringify(caja.window.CURSOS || []));

/* ---------- 2. Separar las claves ---------- */
var CLAVES = {};
var PRACTICAS = {};
var vistas = {};

function textosObservacion(pr) { // igual que en app.js
  return Object.assign({ pregunta: "¿Se repite?", placeholder: "¿Qué observan?", conteo: "se repite" }, pr.observacion || {});
}

cursos.forEach(function (curso) {
  curso.sesiones.forEach(function (s) {
    if (!s.key) fallar("Hay una sesión sin clave en el curso «" + curso.titulo + "».");
    if (CLAVES[s.key]) fallar("La clave " + s.key + " está repetida.");
    CLAVES[s.key] = {
      titulo: s.title,
      columna: s.etiqueta + " · " + s.title, // mismo rótulo de columna que usaba la app
      preguntas: s.questions.map(function (q) {
        if (vistas[q.id]) fallar("El id de pregunta " + q.id + " está repetido.");
        vistas[q.id] = true;
        if (q.answer === undefined) fallar("La pregunta " + q.id + " no tiene respuesta («answer»).");
        return { id: q.id, respuesta: q.answer, bien: q.feedbackCorrect || "", mal: q.feedbackWrong || "" };
      })
    };
    s.questions.forEach(function (q) { delete q.answer; delete q.feedbackCorrect; delete q.feedbackWrong; });

    if (s.practica) {
      var pr = s.practica;
      var obs = textosObservacion(pr);
      var rotulos = [];
      pr.campos.forEach(function (c) {
        rotulos.push(c.label);
        if (c.tipo === "observacion") rotulos.push(c.label + " · " + obs.pregunta);
      });
      if (PRACTICAS[pr.key]) fallar("La práctica " + pr.key + " está repetida.");
      PRACTICAS[pr.key] = { sesion: s.key, campos: rotulos };
    }
  });
});

var clavesGs = "/**\n" +
  " * Claves de corrección · GENERADO por herramientas/construir.js a partir de contenido/*.js.\n" +
  " * No se edita a mano: cambia el módulo en contenido/, vuelve a construir y pega este archivo\n" +
  " * en el proyecto de Apps Script (archivo «Claves») antes de publicar la nueva versión.\n" +
  " */\n\n" +
  "var CLAVES = " + JSON.stringify(CLAVES, null, 2) + ";\n\n" +
  "var PRACTICAS = " + JSON.stringify(PRACTICAS, null, 2) + ";\n";

if (comprobar) {
  var actual = fs.existsSync(CLAVES_GS) ? fs.readFileSync(CLAVES_GS, "utf8") : "";
  if (actual !== clavesGs) fallar("apps-script/Claves.gs no está al día. Ejecuta: node herramientas/construir.js");
  console.log("✓ apps-script/Claves.gs está al día (" + Object.keys(CLAVES).length + " evaluaciones).");
  process.exit(0);
}

/* ---------- 3. Escribir publico/ ---------- */
fs.rmSync(SALIDA, { recursive: true, force: true });
fs.mkdirSync(SALIDA, { recursive: true });

var cursosJs = "/* Generado por herramientas/construir.js. Las respuestas se corrigen en el servidor. */\n" +
  "window.CURSOS = " + JSON.stringify(cursos) + ";\n";
var archivos = {
  "cursos.js": cursosJs,
  "app.js": leerArchivo("app.js"),
  "estilos.css": leerArchivo("estilos.css")
};
Object.keys(archivos).forEach(function (n) { fs.writeFileSync(path.join(SALIDA, n), archivos[n]); });

// index.html: un solo cursos.js en lugar de los módulos, y ?v= para que el navegador no use copias viejas.
var primero = true;
var html = indice.replace(reScript, function () {
  if (!primero) return "";
  primero = false;
  return '<script src="cursos.js?v=' + huella(cursosJs) + '"></script>\n  ';
});
html = html.replace(/<!-- Contenido:[^>]*-->\s*\n\s*/, "");
html = html.replace('src="app.js"', 'src="app.js?v=' + huella(archivos["app.js"]) + '"')
  .replace('href="estilos.css"', 'href="estilos.css?v=' + huella(archivos["estilos.css"]) + '"');
fs.writeFileSync(path.join(SALIDA, "index.html"), html);

fs.cpSync(path.join(RAIZ, "assets"), path.join(SALIDA, "assets"), { recursive: true });
fs.writeFileSync(CLAVES_GS, clavesGs);

// Última defensa: ninguna respuesta puede quedar en lo publicado.
if (/"answer"\s*:|feedbackWrong|feedbackCorrect/.test(cursosJs)) fallar("Quedaron respuestas en publico/cursos.js.");

console.log("✓ publico/ listo: " + modulos.length + " módulos, " + Object.keys(CLAVES).length + " evaluaciones, " +
  Object.keys(PRACTICAS).length + " prácticas.");
console.log("✓ apps-script/Claves.gs actualizado. Si cambió, pégalo en Apps Script antes de publicar.");
