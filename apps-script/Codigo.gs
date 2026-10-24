/**
 * Registro de capacitación · Área de Diseño Gráfico MIVAM
 * Google Apps Script conectado a la hoja de resultados.
 *
 * Versión 3 (octubre 2026): acceso con cuenta de Google y corrección en el servidor.
 * - Toda petición trae el token de Google (ID token) de quien la hace. El script lo verifica con
 *   Google y solo confía en el correo que viene dentro: nunca en un nombre o correo que mande la app.
 * - La app ya no tiene las respuestas: se corrige aquí con CLAVES (archivo Claves.gs, generado por
 *   herramientas/construir.js). La primera evaluación enviada es la que cuenta; las siguientes son repaso.
 * - Pestaña «Registro»: una fila por cuenta (correo, nombre, nacimiento, teléfono, estado). Une el
 *   correo con la fila de la persona en la hoja principal, que sigue siendo por nombre.
 * - Solo los administradores (propiedad ADMINS) leen las prácticas de todos para el proyector.
 * - Límite de peticiones por cuenta y tamaño máximo de envío. Todo texto que se escribe en la hoja
 *   se neutraliza para que no se interprete como fórmula.
 *
 * Hoja principal (primera pestaña), igual que en la versión 2:
 *   A Nombre · B Edad (se calcula sola) · C Fecha de nacimiento · D Última actividad ·
 *   E–J Sesiones 01–06 de Photoshop · K Promedio · desde la L, una columna por módulo.
 *   Puede ser una tabla de Google Sheets: por eso nunca recibe formato (ver v2.2) y las notas se
 *   escriben como texto «83%».
 *
 * Propiedades del script (Configuración del proyecto → Propiedades del script):
 *   CLIENT_ID  ID de cliente OAuth (tipo «Aplicación web») de Google Cloud. Es el mismo de app.js.
 *   ADMINS     Correos de los administradores separados por coma.
 *
 * Cómo publicarlo: Implementar → Administrar implementaciones → editar (lápiz) →
 * Versión: «Nueva versión» → Implementar. Así la dirección /exec no cambia.
 * Ejecutar como: «Yo». Quién tiene acceso: «Cualquier usuario» (la seguridad la da el token).
 */

var VERSION = 3.0;
var COLUMNAS_SESIONES_FIJAS = { S01: 5, S02: 6, S03: 7, S04: 8, S05: 9, S06: 10 };
var COL_NOMBRE = 1, COL_EDAD = 2, COL_NACIMIENTO = 3, COL_ACTIVIDAD = 4, COL_PROMEDIO = 11;
var PRIMERA_COLUMNA_MODULOS = 12; // L

var HOJA_REGISTRO = 'Registro';
var ENC_REGISTRO = ['Correo', 'Nombre', 'Fecha de nacimiento', 'Teléfono', 'Estado', 'Alta', 'Último acceso'];
var R_CORREO = 1, R_NOMBRE = 2, R_NACIMIENTO = 3, R_TELEFONO = 4, R_ESTADO = 5, R_ALTA = 6, R_ACCESO = 7;

var MAX_ENVIO = 20000;          // caracteres por petición
var MAX_PETICIONES_MINUTO = 40; // por cuenta
var MAX_TEXTO = 2000;           // por campo de práctica

/** Error con un mensaje que sí se le puede mostrar a la persona. */
function ErrorUsuario(mensaje, codigo) { this.message = mensaje; this.codigo = codigo || 'datos'; }

/* ---------- Entrada ---------- */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) throw new ErrorUsuario('No llegaron datos.');
    if (e.postData.contents.length > MAX_ENVIO) throw new ErrorUsuario('El envío es demasiado grande.');
    var data;
    try { data = JSON.parse(e.postData.contents); } catch (x) { throw new ErrorUsuario('Datos mal formados.'); }

    var usuario = verificarToken(data.token);
    limitarPeticiones(usuario.correo);

    switch (data.action) {
      case 'yo': return responder(accionYo(usuario));
      case 'registro': return responder(conCandado(function () { return accionRegistro(usuario, data); }));
      case 'quiz': return responder(conCandado(function () { return accionQuiz(usuario, data); }));
      case 'practica': return responder(conCandado(function () { return accionPractica(usuario, data); }));
      case 'practicas': return responder(accionLeerPracticas(usuario, data));
      default: throw new ErrorUsuario('Acción desconocida.');
    }
  } catch (error) {
    if (error instanceof ErrorUsuario) return responder({ status: 'error', codigo: error.codigo, message: error.message });
    console.error(error && error.stack || error); // queda en «Ejecuciones» del editor de Apps Script
    return responder({ status: 'error', codigo: 'interno', message: 'Error interno del registro. Avísale al líder del área.' });
  }
}

/** Solo para comprobar que el script responde. Ya no hay lecturas por GET. */
function doGet() {
  return responder({ status: 'ok', version: VERSION });
}

function conCandado(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new ErrorUsuario('El registro está ocupado. Intenta de nuevo en unos segundos.', 'ocupado');
  try { return fn(); } finally { try { lock.releaseLock(); } catch (x) {} }
}

/* ---------- Identidad ---------- */

function propiedad(nombre) { return PropertiesService.getScriptProperties().getProperty(nombre) || ''; }

/** Verifica el ID token con Google y devuelve { correo, nombre }. Guarda el resultado en caché. */
function verificarToken(token) {
  if (typeof token !== 'string' || token.length < 100 || token.length > 4096) {
    throw new ErrorUsuario('Inicia sesión con tu cuenta de Google.', 'sesion');
  }
  var clientId = propiedad('CLIENT_ID');
  if (!clientId) throw new Error('Falta la propiedad CLIENT_ID del script.');

  var cache = CacheService.getScriptCache();
  var claveCache = 'tok:' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token));
  var guardado = cache.get(claveCache);
  if (guardado) return JSON.parse(guardado);

  var r = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token), { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) throw new ErrorUsuario('Tu sesión venció. Vuelve a entrar con Google.', 'sesion');
  var t = JSON.parse(r.getContentText());
  var ahora = Math.floor(Date.now() / 1000);
  var valido = t.aud === clientId &&
    (t.iss === 'accounts.google.com' || t.iss === 'https://accounts.google.com') &&
    String(t.email_verified) === 'true' && t.email &&
    Number(t.exp) > ahora;
  if (!valido) throw new ErrorUsuario('Tu sesión no es válida. Vuelve a entrar con Google.', 'sesion');

  var usuario = { correo: String(t.email).toLowerCase(), nombre: String(t.name || '') };
  var segundos = Math.min(Number(t.exp) - ahora, 21600);
  if (segundos > 30) cache.put(claveCache, JSON.stringify(usuario), segundos);
  return usuario;
}

function limitarPeticiones(correo) {
  var cache = CacheService.getScriptCache();
  var clave = 'rl:' + correo + ':' + Math.floor(Date.now() / 60000);
  var n = Number(cache.get(clave) || 0) + 1;
  cache.put(clave, String(n), 120);
  if (n > MAX_PETICIONES_MINUTO) throw new ErrorUsuario('Demasiadas peticiones seguidas. Espera un minuto.', 'limite');
}

function esAdmin(correo) {
  return propiedad('ADMINS').toLowerCase().split(/[\s,;]+/).filter(String).indexOf(correo) !== -1;
}

/* ---------- Cuenta y registro ---------- */

/** Perfil de la cuenta y sus notas. Si no se ha registrado, la app muestra el formulario. */
function accionYo(usuario) {
  var cuenta = buscarCuenta(usuario.correo);
  if (!cuenta) return { status: 'ok', registrado: false, nombreGoogle: usuario.nombre, admin: esAdmin(usuario.correo) };
  try { cuenta.hoja.getRange(cuenta.fila, R_ACCESO).setValue(new Date()); } catch (x) {}
  return {
    status: 'ok', registrado: true, admin: esAdmin(usuario.correo),
    perfil: { nombre: cuenta.nombre, estado: cuenta.estado },
    sesiones: notasDe(cuenta.nombre)
  };
}

function accionRegistro(usuario, d) {
  var existente = buscarCuenta(usuario.correo);
  if (existente) return accionYo(usuario); // el nombre ya no se cambia desde la app: lo corrige el líder

  var nombre = limpiarTexto(d.nombre);
  if (nombre.length > 80 || !/^[\p{L}'’.-]+( [\p{L}'’.-]+)+$/u.test(nombre)) {
    throw new ErrorUsuario('Escribe tu nombre y tu apellido, solo con letras.');
  }
  var fecha = aFecha(d.nacimiento);
  var edad = fecha ? edadHoy(fecha) : -1;
  if (!fecha || edad < 8 || edad > 100) throw new ErrorUsuario('Revisa tu fecha de nacimiento.');
  var telefono = limpiarTexto(d.telefono);
  if (!/^\+?[0-9][0-9 ().-]{6,19}$/.test(telefono)) throw new ErrorUsuario('Escribe un teléfono válido, por ejemplo +58 412 123 4567.');
  if (d.acepta !== true) throw new ErrorUsuario('Debes aceptar el uso de tus datos para registrarte.');

  // Un nombre solo puede pertenecer a una cuenta.
  var registro = hojaRegistro();
  if (filaPorValor(registro, R_NOMBRE, nombre) !== -1) {
    throw new ErrorUsuario('Ese nombre ya está unido a otra cuenta de Google. Habla con el líder del área.');
  }
  // Si la persona ya tenía notas (versión anterior, sin cuenta), su fecha de nacimiento debe coincidir.
  var principal = hojaPrincipal();
  var fila = buscarPersona(principal, nombre);
  var estado = 'Aspirante';
  if (fila !== -1) {
    var previa = principal.getRange(fila, COL_NACIMIENTO).getValue();
    if (esFecha(previa) && textoFecha(previa) !== textoFecha(fecha)) {
      throw new ErrorUsuario('Ese nombre ya está en el registro con otra fecha de nacimiento. Habla con el líder del área.');
    }
    estado = 'Participante';
  }

  registro.appendRow([seguro(usuario.correo), seguro(nombre), fecha, seguro(telefono), estado, new Date(), new Date()]);
  buscarOCrearPersona(principal, nombre, fecha);
  return accionYo(usuario);
}

function cuentaObligatoria(usuario) {
  var cuenta = buscarCuenta(usuario.correo);
  if (!cuenta) throw new ErrorUsuario('Completa tu registro antes de continuar.', 'registro');
  return cuenta;
}

/* ---------- Evaluaciones: corrección en el servidor ---------- */

function accionQuiz(usuario, d) {
  var cuenta = cuentaObligatoria(usuario);
  var clave = typeof d.sessionKey === 'string' && CLAVES.hasOwnProperty(d.sessionKey) ? CLAVES[d.sessionKey] : null;
  if (!clave) throw new ErrorUsuario('Esa evaluación no existe.');
  var resp = d.answers && typeof d.answers === 'object' ? d.answers : {};

  var correctas = 0;
  var detalle = {};
  var limpias = {};
  clave.preguntas.forEach(function (q) {
    var r = resp[q.id];
    if (typeof r !== typeof q.respuesta) throw new ErrorUsuario('Faltan respuestas: contesta todas las preguntas.');
    var acierto = r === q.respuesta;
    if (acierto) correctas++;
    limpias[q.id] = r;
    detalle[q.id] = { acierto: acierto, correcta: q.respuesta, retro: acierto ? q.bien : q.mal };
  });
  var total = clave.preguntas.length;
  var pct = Math.round(correctas / total * 100);

  // La primera evaluación enviada es la que cuenta. Las siguientes se corrigen como repaso.
  var previa = notasDe(cuenta.nombre)[d.sessionKey];
  var registrado = previa === undefined;
  if (registrado) {
    var sheet = hojaPrincipal();
    var fila = buscarOCrearPersona(sheet, cuenta.nombre, null);
    var col = columnaDeSesion(sheet, d.sessionKey, clave.columna);
    sheet.getRange(fila, col).setValue(porcentaje(pct));
    sheet.getRange(fila, COL_ACTIVIDAD).setValue(new Date());
    actualizarPromedio(sheet, fila);

    var respuestas = hoja('Respuestas', ['Fecha', 'Nombre', 'Clave', 'Sesión o módulo', 'Correctas', 'Total', 'Nota', 'Respuestas', 'Correo']);
    respuestas.appendRow([new Date(), seguro(cuenta.nombre), d.sessionKey, seguro(clave.titulo), correctas, total, porcentaje(pct), JSON.stringify(limpias), seguro(usuario.correo)]);
  }

  return {
    status: 'success', registrado: registrado, notaRegistrada: registrado ? pct : previa,
    correct: correctas, total: total, pct: pct, detalle: detalle
  };
}

/* ---------- Actividades en pareja ---------- */

function accionPractica(usuario, d) {
  var cuenta = cuentaObligatoria(usuario);
  var def = typeof d.activityKey === 'string' && PRACTICAS.hasOwnProperty(d.activityKey) ? PRACTICAS[d.activityKey] : null;
  if (!def) throw new ErrorUsuario('Esa práctica no existe.');
  var pareja = limpiarTexto(d.pareja).slice(0, 160);
  if (!pareja) throw new ErrorUsuario('Escribe el nombre de tu pareja.');

  // Solo se aceptan los campos que la práctica define, en su orden.
  var valores = {};
  (Array.isArray(d.fields) ? d.fields : []).forEach(function (c) {
    if (c && def.campos.indexOf(c.label) !== -1) valores[c.label] = String(c.value || '').slice(0, MAX_TEXTO);
  });
  var campos = def.campos.map(function (label) { return { label: label, value: valores[label] || '' }; });
  campos.push({ label: 'Enviado por', value: usuario.correo });
  guardarPractica(d.activityKey, cuenta.nombre + ' · ' + pareja, campos);
  return { status: 'success', message: 'Práctica guardada.' };
}

function guardarPractica(clave, integrantes, campos) {
  var encabezados = ['Fecha', 'Integrantes'].concat(campos.map(function (c) { return c.label; }));
  var sheet = hoja(('Práctica ' + clave).slice(0, 90), encabezados);
  // Si la actividad ganó campos nuevos, se agregan al final del encabezado.
  var actuales = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  var fila = [new Date(), seguro(integrantes)];
  campos.forEach(function (c) {
    var idx = actuales.indexOf(c.label);
    if (idx === -1) {
      idx = actuales.length;
      negrita(sheet.getRange(1, idx + 1).setValue(c.label));
      actuales.push(c.label);
    }
    fila[idx] = seguro(c.value);
  });
  for (var i = 0; i < fila.length; i++) if (fila[i] === undefined) fila[i] = '';
  sheet.appendRow(fila);
}

/** Para el proyector: solo administradores. No incluye quién lo envió. */
function accionLeerPracticas(usuario, d) {
  if (!esAdmin(usuario.correo)) throw new ErrorUsuario('El proyector es solo para el líder y los miembros fijos del área.', 'permiso');
  if (typeof d.actividad !== 'string' || !PRACTICAS.hasOwnProperty(d.actividad)) throw new ErrorUsuario('Esa práctica no existe.');
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(('Práctica ' + d.actividad).slice(0, 90));
  if (!sheet || sheet.getLastRow() < 2) return { status: 'ok', items: [] };
  var valores = sheet.getDataRange().getValues();
  var enc = valores[0];
  var items = valores.slice(1).map(function (fila) {
    var o = {};
    enc.forEach(function (h, i) {
      if (h === 'Enviado por') return;
      o[h] = esFecha(fila[i]) ? fila[i].toISOString() : fila[i];
    });
    return o;
  });
  return { status: 'ok', items: items };
}

/* ---------- Notas de una persona ---------- */

function notasDe(nombre) {
  var sheet = hojaPrincipal();
  var fila = buscarPersona(sheet, nombre);
  var sesiones = {};
  if (fila === -1) return sesiones;
  var ultimaCol = sheet.getLastColumn();
  var enc = sheet.getRange(1, 1, 1, ultimaCol).getValues()[0];
  var vals = sheet.getRange(fila, 1, 1, ultimaCol).getValues()[0];
  Object.keys(COLUMNAS_SESIONES_FIJAS).forEach(function (k) {
    var p = aPorcentaje(vals[COLUMNAS_SESIONES_FIJAS[k] - 1]);
    if (p !== null) sesiones[k] = p;
  });
  for (var c = PRIMERA_COLUMNA_MODULOS; c <= ultimaCol; c++) {
    var clave = claveDeEncabezado(enc[c - 1]);
    var pct = aPorcentaje(vals[c - 1]);
    if (clave && pct !== null) sesiones[clave] = pct;
  }
  return sesiones;
}

/* ---------- Utilidades ---------- */

function hojaPrincipal() { return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]; }

function hojaRegistro() { return hoja(HOJA_REGISTRO, ENC_REGISTRO); }

function hoja(nombre, encabezados) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(nombre);
  if (!sheet) {
    sheet = ss.insertSheet(nombre);
    sheet.appendRow(encabezados);
    negrita(sheet.getRange(1, 1, 1, encabezados.length));
    try { sheet.setFrozenRows(1); } catch (x) {}
  } else if (sheet.getLastColumn() < encabezados.length) {
    // Pestaña de una versión anterior: se completan los encabezados nuevos (por ejemplo «Correo»).
    var actuales = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
    for (var i = actuales.length; i < encabezados.length; i++) negrita(sheet.getRange(1, i + 1).setValue(encabezados[i]));
  }
  return sheet;
}

function buscarCuenta(correo) {
  var sheet = hojaRegistro();
  var fila = filaPorValor(sheet, R_CORREO, correo);
  if (fila === -1) return null;
  var v = sheet.getRange(fila, 1, 1, ENC_REGISTRO.length).getValues()[0];
  return { hoja: sheet, fila: fila, nombre: limpiarTexto(v[R_NOMBRE - 1]), estado: String(v[R_ESTADO - 1] || '') };
}

/** Fila (desde la 2) cuyo valor en la columna coincide sin importar mayúsculas ni acentos, o -1. */
function filaPorValor(sheet, col, valor) {
  var objetivo = normalizar(valor);
  var ultima = sheet.getLastRow();
  if (!objetivo || ultima < 2) return -1;
  var vals = sheet.getRange(2, col, ultima - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) if (normalizar(vals[i][0]) === objetivo) return i + 2;
  return -1;
}

function normalizar(t) {
  return String(t || '').replace(/^'/, '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function limpiarTexto(t) { return String(t || '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim(); }

/** Neutraliza fórmulas: un texto que empieza con = + - @ se guarda como texto literal. */
function seguro(v) {
  if (typeof v !== 'string') return v;
  var t = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  return /^[=+\-@\t\r]/.test(t) ? "'" + t : t;
}

function buscarPersona(sheet, nombre) { return filaPorValor(sheet, COL_NOMBRE, nombre); }

function buscarOCrearPersona(sheet, nombre, fecha) {
  var fila = buscarPersona(sheet, nombre);
  if (fila === -1) {
    sheet.appendRow([seguro(nombre)]);
    fila = sheet.getLastRow();
  }
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
  if (!m) return null;
  var f = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return f.getMonth() === Number(m[2]) - 1 ? f : null; // descarta fechas imposibles como 31/02
}

function esFecha(v) { return Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime()); }

function textoFecha(f) { return Utilities.formatDate(f, Session.getScriptTimeZone(), 'yyyy-MM-dd'); }

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

/** Solo para las pestañas propias (Registro, Respuestas y prácticas), que no son tablas. */
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
