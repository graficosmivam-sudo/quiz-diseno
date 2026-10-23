/**
 * Registro de capacitación · Área de Diseño Gráfico MIVAM
 * Google Apps Script conectado a la hoja de resultados.
 *
 * Versión 2 (octubre 2026)
 * - Una fila por persona en la hoja principal (la primera pestaña).
 *   Columnas fijas: A Nombre · B Edad (se calcula sola) · C Fecha de nacimiento ·
 *   D Última actividad · E–J Sesiones 01–06 de Photoshop · K Promedio.
 *   Cada módulo nuevo crea su propia columna a partir de la L, con su nombre en la fila 1.
 * - Pestaña «Respuestas»: un registro por cada evaluación enviada (historial completo).
 * - Una pestaña por actividad en pareja (por ejemplo «Práctica M01»).
 * - Acepta también el formato de la app anterior, por si alguien envía desde una versión vieja.
 *
 * Versión 2.2: la hoja principal puede ser una tabla de Google Sheets (columnas con tipo).
 *   Las tablas no dejan cambiar el formato de una columna con tipo, y Sheets aplica los cambios
 *   en lote, así que ese error aparece después y no se puede atrapar con try/catch. Por eso la
 *   hoja principal nunca recibe formato: las notas se escriben como texto «83%», que Sheets
 *   reconoce como porcentaje al igual que si se escribiera a mano.
 *
 * Cómo publicarlo: Implementar → Administrar implementaciones → editar (lápiz) →
 * Versión: «Nueva versión» → Implementar. Así la dirección /exec no cambia.
 */

var VERSION = 2.2;
var COLUMNAS_SESIONES_FIJAS = { S01: 5, S02: 6, S03: 7, S04: 8, S05: 9, S06: 10 };
var COL_NOMBRE = 1, COL_EDAD = 2, COL_NACIMIENTO = 3, COL_ACTIVIDAD = 4, COL_PROMEDIO = 11;
var PRIMERA_COLUMNA_MODULOS = 12; // L

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    if (!e || !e.postData || !e.postData.contents) return responder({ status: 'error', message: 'No llegaron datos.' });
    var data = JSON.parse(e.postData.contents);

    if (data.sessions && !data.action) return responder(guardarFormatoAnterior(data));
    if (data.action === 'quiz') return responder(guardarQuiz(data));
    if (data.action === 'practica') return responder(guardarPractica(data));
    return responder({ status: 'error', message: 'Acción desconocida.' });
  } catch (error) {
    return responder({ status: 'error', message: String(error) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

/** Lecturas: ?action=ping · ?action=progreso&nombre=… · ?action=practicas&actividad=… */
function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.action === 'progreso') return responder(leerProgreso(p.nombre || ''));
    if (p.action === 'practicas') return responder(leerPracticas(p.actividad || ''));
    return responder({ status: 'ok', version: VERSION });
  } catch (error) {
    return responder({ status: 'error', message: String(error) });
  }
}

/* ---------- Evaluaciones ---------- */

function guardarQuiz(d) {
  var nombre = limpiarTexto(d.name);
  if (!nombre) return { status: 'error', message: 'Falta el nombre.' };
  var sheet = hojaPrincipal();
  var fila = buscarOCrearPersona(sheet, nombre, d.dob);
  var col = columnaDeSesion(sheet, d.sessionKey, d.columnLabel || d.sessionTitle);
  var celda = sheet.getRange(fila, col);
  celda.setValue(porcentaje(d.pct));
  sheet.getRange(fila, COL_ACTIVIDAD).setValue(new Date());
  actualizarPromedio(sheet, fila);

  hoja('Respuestas', ['Fecha', 'Nombre', 'Clave', 'Sesión o módulo', 'Correctas', 'Total', 'Nota', 'Respuestas'])
    .appendRow([new Date(), nombre, d.sessionKey, d.sessionTitle || '', d.correct, d.total, porcentaje(d.pct), JSON.stringify(d.answers || {})]);

  return { status: 'success', message: 'Resultado guardado.', fila: fila };
}

function guardarFormatoAnterior(d) {
  var nombre = limpiarTexto(d.name);
  if (!nombre) return { status: 'error', message: 'Falta el nombre.' };
  var sheet = hojaPrincipal();
  var fila = buscarOCrearPersona(sheet, nombre, d.dob);
  var claves = ['S01', 'S02', 'S03', 'S04', 'S05', 'S06'];
  for (var i = 0; i < claves.length; i++) {
    var s = d.sessions[i];
    if (s && s.score && s.score.pct !== undefined) {
      sheet.getRange(fila, COLUMNAS_SESIONES_FIJAS[claves[i]]).setValue(porcentaje(s.score.pct));
    }
  }
  sheet.getRange(fila, COL_ACTIVIDAD).setValue(new Date());
  actualizarPromedio(sheet, fila);
  return { status: 'success', message: 'Datos guardados (formato anterior).' };
}

/* ---------- Actividades en pareja ---------- */

function guardarPractica(d) {
  var campos = d.fields || [];
  var encabezados = ['Fecha', 'Integrantes'].concat(campos.map(function (c) { return c.label; }));
  var nombreHoja = ('Práctica ' + (d.activityKey || '')).slice(0, 90);
  var sheet = hoja(nombreHoja, encabezados);
  // Si la actividad ganó campos nuevos, se agregan al final del encabezado.
  var actuales = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  var fila = [new Date(), limpiarTexto(d.members)];
  campos.forEach(function (c) {
    var idx = actuales.indexOf(c.label);
    if (idx === -1) {
      idx = actuales.length;
      negrita(sheet.getRange(1, idx + 1).setValue(c.label));
      actuales.push(c.label);
    }
    fila[idx] = c.value;
  });
  for (var i = 0; i < fila.length; i++) if (fila[i] === undefined) fila[i] = '';
  sheet.appendRow(fila);
  return { status: 'success', message: 'Práctica guardada.' };
}

function leerPracticas(actividad) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(('Práctica ' + actividad).slice(0, 90));
  if (!sheet || sheet.getLastRow() < 2) return { status: 'ok', items: [] };
  var valores = sheet.getDataRange().getValues();
  var enc = valores[0];
  var items = valores.slice(1).map(function (fila) {
    var o = {};
    enc.forEach(function (h, i) { o[h] = fila[i] instanceof Date ? fila[i].toISOString() : fila[i]; });
    return o;
  });
  return { status: 'ok', items: items };
}

/* ---------- Progreso de una persona ---------- */

function leerProgreso(nombre) {
  var sheet = hojaPrincipal();
  var fila = buscarPersona(sheet, nombre);
  if (fila === -1) return { status: 'ok', encontrado: false, sesiones: {} };
  var ultimaCol = sheet.getLastColumn();
  var enc = sheet.getRange(1, 1, 1, ultimaCol).getValues()[0];
  var vals = sheet.getRange(fila, 1, 1, ultimaCol).getValues()[0];
  var sesiones = {};
  Object.keys(COLUMNAS_SESIONES_FIJAS).forEach(function (k) {
    var p = aPorcentaje(vals[COLUMNAS_SESIONES_FIJAS[k] - 1]);
    if (p !== null) sesiones[k] = p;
  });
  for (var c = PRIMERA_COLUMNA_MODULOS; c <= ultimaCol; c++) {
    var clave = claveDeEncabezado(enc[c - 1]);
    var pct = aPorcentaje(vals[c - 1]);
    if (clave && pct !== null) sesiones[clave] = pct;
  }
  return { status: 'ok', encontrado: true, sesiones: sesiones };
}

/* ---------- Utilidades ---------- */

function hojaPrincipal() { return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]; }

function hoja(nombre, encabezados) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(nombre);
  if (!sheet) {
    sheet = ss.insertSheet(nombre);
    sheet.appendRow(encabezados);
    negrita(sheet.getRange(1, 1, 1, encabezados.length));
    try { sheet.setFrozenRows(1); } catch (x) {}
  }
  return sheet;
}

function normalizar(t) {
  return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function limpiarTexto(t) { return String(t || '').replace(/\s+/g, ' ').trim(); }

function buscarPersona(sheet, nombre) {
  var objetivo = normalizar(nombre);
  if (!objetivo) return -1;
  var ultima = sheet.getLastRow();
  if (ultima < 2) return -1;
  var nombres = sheet.getRange(2, COL_NOMBRE, ultima - 1, 1).getValues();
  for (var i = 0; i < nombres.length; i++) {
    if (normalizar(nombres[i][0]) === objetivo) return i + 2;
  }
  return -1;
}

function buscarOCrearPersona(sheet, nombre, dob) {
  var fila = buscarPersona(sheet, nombre);
  if (fila === -1) {
    sheet.appendRow([nombre]);
    fila = sheet.getLastRow();
  }
  var fecha = aFecha(dob);
  if (fecha) {
    sheet.getRange(fila, COL_NACIMIENTO).setValue(fecha);
    var edad = sheet.getRange(fila, COL_EDAD);
    try {
      edad.setFormula('=IFERROR(DATEDIF(C' + fila + ',TODAY(),"Y"),"")');
    } catch (x) {
      edad.setValue(edadHoy(fecha)); // si la columna no admite fórmulas, se guarda la edad de hoy
    }
  }
  return fila;
}

function aFecha(dob) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dob || ''));
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

/** Encabezado de módulo: «M01-manual · ¿Qué es una identidad?» → clave «M01-manual». */
function claveDeEncabezado(h) {
  var s = String(h || '');
  var i = s.indexOf(' · ');
  return i > 0 ? s.slice(0, i) : (s || null);
}

function columnaDeSesion(sheet, clave, etiqueta) {
  if (COLUMNAS_SESIONES_FIJAS[clave]) return COLUMNAS_SESIONES_FIJAS[clave];
  var ultimaCol = Math.max(sheet.getLastColumn(), COL_PROMEDIO);
  var enc = sheet.getRange(1, 1, 1, ultimaCol).getValues()[0];
  for (var c = PRIMERA_COLUMNA_MODULOS; c <= ultimaCol; c++) {
    if (claveDeEncabezado(enc[c - 1]) === clave) return c;
  }
  var nueva = ultimaCol + 1;
  sheet.getRange(1, nueva).setValue(clave + (etiqueta ? ' · ' + etiqueta : '')); // sin negrita: la hoja principal no recibe formato
  return nueva;
}

/** Acepta 0.83, 83, «83%» o «0.83» y devuelve 83 (o null si la celda está vacía). */
function aPorcentaje(v) {
  if (v === '' || v === null || v === undefined) return null;
  var n = typeof v === 'number' ? v : parseFloat(String(v).replace('%', '').replace(',', '.'));
  if (isNaN(n)) return null;
  if (String(v).indexOf('%') === -1 && n <= 1) n = n * 100;
  return Math.round(n);
}

function actualizarPromedio(sheet, fila) {
  var ultimaCol = sheet.getLastColumn();
  var vals = sheet.getRange(fila, 1, 1, ultimaCol).getValues()[0];
  var notas = [];
  for (var c = 5; c <= ultimaCol; c++) {
    if (c === COL_PROMEDIO) continue;
    var p = aPorcentaje(vals[c - 1]);
    if (p !== null) notas.push(p);
  }
  var celda = sheet.getRange(fila, COL_PROMEDIO);
  if (!notas.length) { celda.setValue(''); return; }
  var suma = notas.reduce(function (a, b) { return a + b; }, 0);
  celda.setValue(porcentaje(suma / notas.length));
}

/** 83 → «83%». Sheets lo guarda como 0,83 con formato de porcentaje, sin pedir formato aparte. */
function porcentaje(n) {
  return Math.round(Number(n)) + '%';
}

/** Solo para las pestañas propias (Respuestas y prácticas), que no son tablas. */
function negrita(rango) {
  try { rango.setFontWeight('bold'); } catch (x) {}
  return rango;
}

function edadHoy(fecha) {
  var hoy = new Date();
  var edad = hoy.getFullYear() - fecha.getFullYear();
  if (hoy.getMonth() < fecha.getMonth() || (hoy.getMonth() === fecha.getMonth() && hoy.getDate() < fecha.getDate())) edad--;
  return edad;
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
