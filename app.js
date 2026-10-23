/* Capacitación · Diseño Gráfico MIVAM — app de evaluaciones (etapa 1).
   Sin dependencias. El contenido vive en /contenido/*.js; los resultados se envían
   a la hoja de Google mediante Apps Script (ver /apps-script/Codigo.gs). */
(function () {
  "use strict";

  // ==========================================
  // CONFIGURACIÓN: ENLACE DE GOOGLE APPS SCRIPT
  // ==========================================
  var GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbymxEza1msJmXFQpm4_wxw0LCVmJriMO7HcVTYXrt5PXCSgo1YdZHFCFnjgMQwlr3A2Fw/exec";

  var CURSOS = window.CURSOS || [];
  var raiz = document.getElementById("app");
  var barraUsuario = document.getElementById("barra-usuario");

  /* ---------- Almacenamiento local (con tolerancia a errores) ---------- */
  function leer(clave, porDefecto) {
    try { var v = localStorage.getItem(clave); return v ? JSON.parse(v) : porDefecto; } catch (e) { return porDefecto; }
  }
  function guardar(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) { /* sin almacenamiento */ }
  }
  function quitar(clave) { try { localStorage.removeItem(clave); } catch (e) {} }

  function normalizar(t) {
    return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  }
  function persona() { return leer("mivam_persona", null); }
  function claveProgreso() { var p = persona(); return "mivam_progreso_" + normalizar(p ? p.nombre : ""); }
  function progreso() { return leer(claveProgreso(), {}); }
  function guardarProgreso(pr) { guardar(claveProgreso(), pr); }
  function notasRemotas() { return leer(claveProgreso() + "_remoto", {}); }

  /* ---------- Utilidades de DOM ---------- */
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    });
    for (var i = 2; i < arguments.length; i++) agregar(el, arguments[i]);
    return el;
  }
  function agregar(el, hijo) {
    if (hijo === null || hijo === undefined || hijo === false) return;
    if (Array.isArray(hijo)) { hijo.forEach(function (x) { agregar(el, x); }); return; }
    el.appendChild(typeof hijo === "string" || typeof hijo === "number" ? document.createTextNode(String(hijo)) : hijo);
  }
  function vaciar(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  function iniciales(nombre) {
    var partes = String(nombre || "").trim().split(/\s+/);
    return ((partes[0] || "")[0] || "") + ((partes[1] || "")[0] || "");
  }
  function dosDigitos(n) { return String(n).padStart(2, "0"); }

  function buscarSesion(key) {
    for (var i = 0; i < CURSOS.length; i++) {
      var s = CURSOS[i].sesiones.find(function (x) { return x.key === key; });
      if (s) return { curso: CURSOS[i], sesion: s };
    }
    return null;
  }
  function buscarPractica(key) {
    for (var i = 0; i < CURSOS.length; i++) {
      for (var j = 0; j < CURSOS[i].sesiones.length; j++) {
        var s = CURSOS[i].sesiones[j];
        if (s.practica && s.practica.key === key) return { sesion: s, practica: s.practica };
      }
    }
    return null;
  }

  /* ---------- Envío a la hoja: confirmado, con cola de reintentos ---------- */
  function enviar(payload) {
    return fetch(GOOGLE_SCRIPT_URL, { method: "POST", body: JSON.stringify(payload), redirect: "follow" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (res) { if (!res || res.status !== "success") throw new Error((res && res.message) || "Respuesta inesperada"); return res; });
  }
  function encolar(item) {
    var cola = leer("mivam_pendientes", []);
    cola = cola.filter(function (x) { return x.id !== item.id; });
    cola.push(item);
    guardar("mivam_pendientes", cola);
  }
  function desencolar(id) {
    guardar("mivam_pendientes", leer("mivam_pendientes", []).filter(function (x) { return x.id !== id; }));
  }
  function reintentarPendientes() {
    var cola = leer("mivam_pendientes", []);
    if (!cola.length || !navigator.onLine) return Promise.resolve();
    return cola.reduce(function (p, item) {
      return p.then(function () {
        return enviar(item.payload).then(function () {
          desencolar(item.id);
          marcarEnviado(item);
        }).catch(function () { /* queda en cola */ });
      });
    }, Promise.resolve());
  }
  function marcarEnviado(item) {
    if (item.tipo !== "quiz") return;
    var claveP = "mivam_progreso_" + normalizar(item.payload.name);
    var pr = leer(claveP, {});
    if (pr[item.payload.sessionKey]) { pr[item.payload.sessionKey].enviado = true; guardar(claveP, pr); }
  }
  window.addEventListener("online", function () { reintentarPendientes().then(render); });

  function traerProgresoRemoto() {
    var p = persona();
    if (!p || !navigator.onLine) return Promise.resolve();
    var url = GOOGLE_SCRIPT_URL + "?action=progreso&nombre=" + encodeURIComponent(p.nombre);
    return fetch(url).then(function (r) { return r.json(); }).then(function (res) {
      if (res && res.status === "ok" && res.sesiones) guardar(claveProgreso() + "_remoto", res.sesiones);
    }).catch(function () { /* sin conexión: se usa lo local */ });
  }

  /* ---------- Barra superior ---------- */
  function pintarBarra() {
    vaciar(barraUsuario);
    var p = persona();
    if (!p) return;
    barraUsuario.appendChild(h("div", { class: "usuario" },
      h("span", { class: "avatar", "aria-hidden": "true", text: iniciales(p.nombre) }),
      h("span", { class: "usuario__nombre", text: p.nombre }),
      h("button", { class: "btn btn--secundario btn--chico", type: "button", onclick: pedirSalida }, "Salir")
    ));
  }
  function pedirSalida() {
    var pendientes = leer("mivam_pendientes", []).length;
    vaciar(raiz);
    raiz.appendChild(h("div", { class: "contenedor" },
      h("div", { class: "panel", style: "max-width:520px" },
        h("p", { class: "etiqueta", text: "Cerrar sesión" }),
        h("h2", { class: "display display--m", text: "¿Salir?" }),
        pendientes
          ? h("p", { class: "aviso aviso--error" }, "Tienes " + pendientes + " resultado(s) sin enviar. Si sales en este dispositivo se seguirán reintentando, pero conéctate pronto.")
          : h("p", { class: "texto-apoyo", text: "Tus resultados ya están guardados en el registro del área." }),
        h("div", { class: "acciones" },
          h("button", { class: "btn", type: "button", onclick: function () { quitar("mivam_persona"); ir("#/"); } }, "Sí, salir"),
          h("button", { class: "btn btn--secundario", type: "button", onclick: render }, "Cancelar")
        )
      )
    ));
  }

  /* ---------- Rutas ---------- */
  function ir(hash) { if (location.hash === hash) render(); else location.hash = hash; }
  window.addEventListener("hashchange", render);

  function render() {
    var ruta = location.hash.replace(/^#\/?/, "").split("/");
    document.body.classList.toggle("proyector", ruta[0] === "proyector");
    window.scrollTo(0, 0);
    if (ruta[0] === "proyector" && ruta[1]) return vistaProyector(decodeURIComponent(ruta[1]));
    pintarBarra();
    if (!persona()) return vistaIngreso();
    if (ruta[0] === "sesion" && ruta[1]) return vistaSesion(decodeURIComponent(ruta[1]));
    if (ruta[0] === "practica" && ruta[1]) return vistaPractica(decodeURIComponent(ruta[1]));
    return vistaInicio();
  }

  /* ---------- Vista: ingreso ---------- */
  function vistaIngreso() {
    vaciar(raiz);
    var error = h("p", { class: "aviso aviso--error", hidden: true, role: "alert" });
    var nombre = h("input", { class: "control", id: "ing-nombre", type: "text", autocomplete: "name", placeholder: "Ej.: Alejandro Marcano", required: true });
    var nac = h("input", { class: "control", id: "ing-nacimiento", type: "date", required: true });
    var form = h("form", { class: "panel", novalidate: true, onsubmit: function (e) {
        e.preventDefault();
        var n = nombre.value.replace(/\s+/g, " ").trim();
        if (n.split(" ").length < 2) { error.textContent = "Escribe tu nombre y tu apellido."; error.hidden = false; nombre.focus(); return; }
        if (!nac.value) { error.textContent = "Indica tu fecha de nacimiento."; error.hidden = false; nac.focus(); return; }
        guardar("mivam_persona", { nombre: n, nacimiento: nac.value });
        ir("#/inicio");
        traerProgresoRemoto().then(function () { if (location.hash === "#/inicio") render(); });
      } },
      h("p", { class: "etiqueta", text: "Ingreso" }),
      h("h2", { style: "font-size:22px;font-weight:700", text: "Entra a tus evaluaciones" }),
      h("p", { class: "texto-apoyo", text: "Escribe tus datos igual que la primera vez: así tus notas se unen en el registro del área." }),
      h("div", { class: "campo" }, h("label", { for: "ing-nombre", text: "Nombre y apellido" }), nombre),
      h("div", { class: "campo" }, h("label", { for: "ing-nacimiento", text: "Fecha de nacimiento" }), nac,
        h("span", { class: "ayuda", text: "La usamos para el registro de cumpleaños del área." })),
      error,
      h("button", { class: "btn btn--bloque", type: "submit" }, "Entrar")
    );
    raiz.appendChild(h("div", { class: "contenedor" },
      h("div", { class: "ingreso__titular" },
        h("p", { class: "etiqueta", text: "Área de Diseño Gráfico MIVAM" }),
        h("h1", { class: "display display--xl", text: "Capacitación" }),
        h("p", { style: "font-size:18px;max-width:40ch", text: "Evaluaciones y prácticas del programa de formación del área." })
      ),
      h("div", { class: "ingreso" },
        h("div", { class: "ingreso__intro" },
          h("img", { src: "assets/img/equipo-caritas.jpg", alt: "Las caritas del equipo de diseño", width: "1600", height: "346" })
        ),
        form
      )
    ));
  }

  /* ---------- Vista: inicio ---------- */
  function vistaInicio() {
    vaciar(raiz);
    var p = persona();
    var pr = progreso();
    var remoto = notasRemotas();
    var pendientes = leer("mivam_pendientes", []).length;
    var cont = h("div", { class: "contenedor" },
      h("div", { class: "saludo" },
        h("p", { class: "etiqueta", text: "Tus evaluaciones" }),
        h("h1", { class: "display display--l", text: "Hola, " + p.nombre.split(" ")[0] }),
        pendientes ? h("p", { class: "aviso aviso--error" }, pendientes + " resultado(s) pendientes de envío. ",
          h("button", { class: "enlace", type: "button", onclick: function () { reintentarPendientes().then(render); } }, "Reintentar ahora")) : null
      )
    );
    CURSOS.forEach(function (curso) {
      var rejilla = h("div", { class: "rejilla" });
      curso.sesiones.forEach(function (s) {
        var local = pr[s.key];
        var nota = local ? local.score.pct : (remoto[s.key] !== undefined ? remoto[s.key] : null);
        rejilla.appendChild(h("button", { class: "tarjeta", type: "button", onclick: function () { ir("#/sesion/" + encodeURIComponent(s.key)); } },
          h("p", { class: "etiqueta", text: s.etiqueta + " · " + s.mode }),
          h("span", { class: "tarjeta__titulo", text: s.title }),
          h("div", { class: "tarjeta__pie" },
            nota === null
              ? h("span", { class: "pastilla", text: "Pendiente" })
              : h("span", { class: "pastilla " + (aprobada(s, nota) ? "pastilla--correcto" : "pastilla--naranja"), text: aprobada(s, nota) ? "Completada" : "Repasar" }),
            nota === null ? h("span", { class: "texto-apoyo", text: s.questions.length + " preguntas" }) : h("span", { class: "nota", text: nota + "%" })
          )
        ));
      });
      cont.appendChild(h("section", { class: "curso" },
        h("div", { class: "curso__cabecera" },
          h("h2", { class: "curso__titulo", text: curso.titulo }),
          h("p", { class: "texto-apoyo", text: curso.descripcion })
        ),
        rejilla
      ));
    });
    raiz.appendChild(cont);
  }
  function aprobada(s, pct) { return s.criterio === "aprobacion" ? pct >= s.aprobar : pct >= 50; }

  /* ---------- Vista: sesión (quiz) ---------- */
  function vistaSesion(key) {
    var hallado = buscarSesion(key);
    if (!hallado) return ir("#/inicio");
    var s = hallado.sesion;
    var pr = progreso();
    var previo = pr[key];
    var notaRemota = notasRemotas()[key];
    var modoRepaso = !previo && notaRemota !== undefined;
    var respuestas = previo ? Object.assign({}, previo.answers) : {};
    var evaluada = !!previo;

    vaciar(raiz);
    var relleno = h("div", { class: "progreso__relleno" });
    var textoProg = h("span", { class: "progreso__texto" });
    var lista = h("div", { class: "preguntas" });
    var botonEvaluar = h("button", { class: "btn btn--bloque", type: "button", disabled: true, onclick: evaluar }, "Evaluar " + s.etiqueta.toLowerCase());
    var zonaResultado = h("div");

    function actualizarProgreso() {
      var n = s.questions.filter(function (q) { return respuestas[q.id] !== undefined; }).length;
      relleno.style.width = (n / s.questions.length * 100) + "%";
      textoProg.textContent = n + " / " + s.questions.length;
      botonEvaluar.disabled = evaluada || n < s.questions.length;
    }

    function pintarPreguntas() {
      vaciar(lista);
      s.questions.forEach(function (q, i) {
        var opciones = q.type === "vf"
          ? [{ key: true, letra: "V", text: "Verdadero" }, { key: false, letra: "F", text: "Falso" }]
          : q.options.map(function (o) { return { key: o.key, letra: o.key, text: o.text }; });
        var cont = h("div", { class: "opciones" + (q.type === "vf" ? " opciones--vf" : ""), role: "group", "aria-label": "Opciones de la pregunta " + (i + 1) });
        opciones.forEach(function (o) {
          var elegida = respuestas[q.id] === o.key;
          var clase = "opcion";
          var estado = null;
          if (evaluada) {
            if (o.key === q.answer) { clase += " opcion--correcta"; estado = "Correcta"; }
            else if (elegida) { clase += " opcion--incorrecta"; estado = "Tu respuesta"; }
          } else if (elegida) clase += " opcion--seleccionada";
          var idBoton = "o-" + q.id + "-" + o.letra;
          cont.appendChild(h("button", { class: clase, id: idBoton, type: "button", disabled: evaluada, "aria-pressed": elegida ? "true" : "false",
              onclick: function () {
                respuestas[q.id] = o.key;
                pintarPreguntas();
                actualizarProgreso();
                var b = document.getElementById(idBoton); // conserva el foco del teclado tras repintar
                if (b) b.focus({ preventScroll: true });
              } },
            h("span", { class: "opcion__letra", text: o.letra }),
            h("span", { text: o.text }),
            estado ? h("span", { class: "opcion__estado", text: estado }) : null
          ));
        });
        var acierto = respuestas[q.id] === q.answer;
        lista.appendChild(h("article", { class: "pregunta", id: "p-" + q.id },
          h("div", { class: "pregunta__tipo" },
            h("span", { class: "pregunta__numero", text: dosDigitos(i + 1) }),
            h("span", { class: "etiqueta", text: q.type === "vf" ? "Verdadero o falso" : q.type === "case" ? "Caso de estudio" : "Opción múltiple" })
          ),
          q.type === "case" ? h("p", { class: "caso", text: q.caseText }) : null,
          h("p", { class: "pregunta__texto", text: q.text }),
          cont,
          evaluada ? h("p", { class: "retro " + (acierto ? "retro--correcto" : "retro--error") },
            h("strong", { text: acierto ? "Correcto" : "Incorrecto" }), acierto ? q.feedbackCorrect : q.feedbackWrong) : null
        ));
      });
    }

    function evaluar() {
      var correctas = s.questions.filter(function (q) { return respuestas[q.id] === q.answer; }).length;
      var pct = Math.round(correctas / s.questions.length * 100);
      evaluada = true;
      if (!modoRepaso) {
        pr = progreso();
        pr[key] = { score: { correct: correctas, total: s.questions.length, pct: pct }, answers: respuestas, enviado: false, fecha: new Date().toISOString() };
        guardarProgreso(pr);
      }
      pintarPreguntas();
      actualizarProgreso();
      pintarResultado(correctas, pct);
      zonaResultado.scrollIntoView({ behavior: "smooth", block: "start" });
      if (!modoRepaso) enviarResultado(correctas, pct);
    }

    var estadoEnvio = h("div", { class: "envio" });
    function pintarEstado(tipo, texto, reintento) {
      vaciar(estadoEnvio);
      if (tipo === "enviando") estadoEnvio.appendChild(h("span", { class: "cargando", "aria-hidden": "true" }));
      estadoEnvio.appendChild(h("p", { class: "aviso " + (tipo === "ok" ? "aviso--ok" : tipo === "error" ? "aviso--error" : "aviso--info"), role: "status", text: texto }));
      if (reintento) estadoEnvio.appendChild(h("button", { class: "btn btn--secundario btn--chico", type: "button", onclick: reintento }, "Reintentar envío"));
    }

    function enviarResultado(correctas, pct) {
      var p = persona();
      var item = {
        id: normalizar(p.nombre) + "|" + key,
        tipo: "quiz",
        payload: { action: "quiz", name: p.nombre, dob: p.nacimiento, sessionKey: key, sessionTitle: s.title,
          columnLabel: s.etiqueta + " · " + s.title, correct: correctas, total: s.questions.length, pct: pct, answers: respuestas }
      };
      encolar(item);
      pintarEstado("enviando", "Guardando tu resultado en el registro del área…");
      enviar(item.payload).then(function () {
        desencolar(item.id);
        marcarEnviado(item);
        pintarEstado("ok", "Resultado guardado en el registro del área.");
      }).catch(function () {
        pintarEstado("error", "No se pudo guardar todavía. Tu resultado quedó en este dispositivo y se reenviará solo al volver la conexión.", function () { enviarResultado(correctas, pct); });
      });
    }

    function pintarResultado(correctas, pct) {
      vaciar(zonaResultado);
      var nivel;
      if (s.criterio === "aprobacion") {
        nivel = pct >= s.aprobar
          ? { titulo: "Aprobado", texto: "Superaste el mínimo de " + Math.ceil(s.questions.length * s.aprobar / 100) + " de " + s.questions.length + ". ¡Bien hecho!", clase: "pastilla--correcto", fiesta: true }
          : { titulo: "Necesitas repasar", texto: "El mínimo es " + Math.ceil(s.questions.length * s.aprobar / 100) + " de " + s.questions.length + ". Repasa con tu diseñador de turno antes del próximo módulo.", clase: "pastilla--error", fiesta: false };
      } else {
        nivel = pct >= 83 ? { titulo: "Dominio sólido", texto: "Comprensión excelente del tema analizado.", clase: "pastilla--correcto", fiesta: true }
          : pct >= 50 ? { titulo: "Buen avance", texto: "Comprensión general estable, con pequeños detalles a reforzar.", clase: "pastilla--naranja", fiesta: false }
          : { titulo: "Necesita refuerzo", texto: "Se sugiere repasar los tópicos base de la sesión.", clase: "pastilla--error", fiesta: false };
      }
      var caja = h("section", { class: "resultado", "aria-live": "polite" },
        nivel.fiesta ? destellos() : null,
        h("p", { class: "etiqueta", text: modoRepaso ? "Repaso · no se envía" : "Tu resultado" }),
        h("p", { class: "resultado__nota", text: pct + "%" }),
        h("div", { class: "pastillas" }, h("span", { class: "pastilla " + nivel.clase, text: nivel.titulo })),
        h("p", { text: nivel.texto }),
        h("div", { class: "resultado__desglose" },
          h("div", { class: "resultado__dato" }, h("b", { text: correctas }), h("span", { text: "Correctas" })),
          h("div", { class: "resultado__dato" }, h("b", { text: s.questions.length - correctas }), h("span", { text: "Incorrectas" })),
          h("div", { class: "resultado__dato" }, h("b", { text: s.questions.length }), h("span", { text: "Preguntas" }))
        ),
        modoRepaso ? null : estadoEnvio,
        h("div", { class: "acciones" },
          s.practica ? h("a", { class: "btn btn--acento", href: "#/practica/" + encodeURIComponent(s.practica.key) }, "Ir a la práctica en pareja") : null,
          h("a", { class: "btn btn--secundario", href: "#/inicio" }, "Volver a mis evaluaciones")
        )
      );
      zonaResultado.appendChild(caja);
    }

    raiz.appendChild(h("div", { class: "contenedor" },
      h("div", { class: "volver" }, h("a", { class: "enlace", href: "#/inicio" }, "← Mis evaluaciones")),
      h("header", { class: "franja" },
        h("p", { class: "etiqueta", text: s.fase + " · " + s.etiqueta + " · " + s.mode }),
        h("h1", { class: "display display--m", text: s.title }),
        h("p", { text: s.desc }),
        modoRepaso ? h("p", { class: "aviso aviso--info", text: "Ya registraste esta evaluación (" + notaRemota + "%). Puedes responderla como repaso: esta vez no se envía." }) : null,
        s.practica ? h("p", { class: "texto-apoyo" }, "Práctica en pareja: ", h("a", { class: "enlace", href: "#/practica/" + encodeURIComponent(s.practica.key) }, s.practica.titulo)) : null
      ),
      h("div", { class: "progreso" }, h("div", { class: "progreso__barra" }, relleno), textoProg),
      lista,
      evaluada ? null : botonEvaluar,
      zonaResultado
    ));
    pintarPreguntas();
    actualizarProgreso();
    if (previo) {
      pintarResultado(previo.score.correct, previo.score.pct);
      var enCola = leer("mivam_pendientes", []).some(function (x) { return x.id === normalizar(persona().nombre) + "|" + key; });
      if (previo.enviado) pintarEstado("ok", "Resultado guardado en el registro del área.");
      else if (enCola) pintarEstado("error", "Este resultado todavía no llega al registro.", function () { enviarResultado(previo.score.correct, previo.score.pct); });
      else pintarEstado("info", "Resultado guardado en este dispositivo.");
    }
  }

  function destellos() {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "destellos");
    svg.setAttribute("viewBox", "0 0 120 100");
    svg.setAttribute("aria-hidden", "true");
    [[30, 30, 22], [86, 22, 14], [80, 74, 18]].forEach(function (d) { // máximo 3 destellos por pieza
      var path = document.createElementNS(ns, "path");
      var r = d[2];
      path.setAttribute("d", "M0,-" + r + " Q0,0 " + r + ",0 Q0,0 0," + r + " Q0,0 -" + r + ",0 Q0,0 0,-" + r + " Z");
      path.setAttribute("transform", "translate(" + d[0] + " " + d[1] + ")");
      path.setAttribute("fill", "#000000");
      svg.appendChild(path);
    });
    return svg;
  }

  /* Textos de las filas «observacion». Por defecto, los del Módulo 01; cada práctica puede cambiarlos.
     «pregunta» también nombra la columna en la hoja, así que no se cambia en una práctica ya en uso. */
  function textosObservacion(pr) {
    return Object.assign({ pregunta: "¿Se repite?", placeholder: "¿Qué observan?", conteo: "se repite" }, pr.observacion || {});
  }
  // «Paso 2 · Colores» → «Colores»
  function sinPrefijo(label) { return String(label).replace(/^.*? · /, ""); }

  /* ---------- Vista: práctica en pareja ---------- */
  function vistaPractica(key) {
    var hallado = buscarPractica(key);
    if (!hallado) return ir("#/inicio");
    var pr = hallado.practica;
    var p = persona();
    var borradorClave = "mivam_borrador_" + key + "_" + normalizar(p.nombre);
    var borrador = leer(borradorClave, {});
    var obs = textosObservacion(pr);
    vaciar(raiz);

    function control(id, tipo, extra) {
      var attrs = Object.assign({ class: "control", id: id, name: id }, extra || {});
      var el = tipo === "parrafo" ? h("textarea", attrs) : h("input", Object.assign({ type: "text" }, attrs));
      if (borrador[id]) el.value = borrador[id];
      el.addEventListener("input", function () { borrador[id] = el.value; guardar(borradorClave, borrador); });
      return el;
    }

    var compa = control("integrante-2", "texto", { placeholder: "Nombre y apellido", autocomplete: "off" });
    var form = h("form", { class: "formulario", novalidate: true });
    form.appendChild(h("div", { class: "bloque" },
      h("h3", { text: "Integrantes" }),
      h("div", { class: "fila-dos" },
        h("div", { class: "campo" }, h("label", { text: "Tú" }), h("input", { class: "control", type: "text", value: p.nombre, disabled: true })),
        h("div", { class: "campo" }, h("label", { for: "integrante-2", text: "Tu pareja (o pareja y tercer integrante)" }), compa)
      )
    ));

    pr.campos.forEach(function (c) {
      var bloque = h("div", { class: "bloque" });
      if (c.tipo === "lista") {
        bloque.appendChild(h("h3", { text: c.label }));
        if (c.ayuda) bloque.appendChild(h("p", { class: "texto-apoyo", text: c.ayuda }));
        for (var i = 1; i <= c.filas; i++) {
          bloque.appendChild(h("div", { class: "campo" }, h("label", { for: c.id + "-" + i, text: "Pieza " + i }), control(c.id + "-" + i, "texto")));
        }
      } else if (c.tipo === "observacion") {
        var sel = h("select", { class: "control", id: c.id + "-repite", name: c.id + "-repite" },
          h("option", { value: "", text: obs.pregunta }), h("option", { value: "Sí", text: "Sí" }), h("option", { value: "Casi", text: "Casi" }), h("option", { value: "No", text: "No" }));
        if (borrador[c.id + "-repite"]) sel.value = borrador[c.id + "-repite"];
        sel.addEventListener("change", function () { borrador[sel.id] = sel.value; guardar(borradorClave, borrador); });
        bloque.appendChild(h("div", { class: "campo" }, h("label", { for: c.id, text: c.label }),
          h("div", { class: "fila-obs" }, control(c.id, "texto", { placeholder: obs.placeholder }), sel)));
      } else {
        bloque.appendChild(h("div", { class: "campo" }, h("label", { for: c.id, text: c.label }),
          c.ayuda ? h("span", { class: "ayuda", text: c.ayuda }) : null, control(c.id, c.tipo)));
      }
      form.appendChild(bloque);
    });

    var estado = h("div", { class: "envio" });
    var boton = h("button", { class: "btn btn--bloque", type: "submit" }, "Enviar práctica");
    form.appendChild(estado);
    form.appendChild(boton);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!compa.value.trim()) { vaciar(estado); estado.appendChild(h("p", { class: "aviso aviso--error", role: "alert", text: "Escribe el nombre de tu pareja." })); compa.focus(); return; }
      var fields = [];
      pr.campos.forEach(function (c) {
        if (c.tipo === "lista") {
          var items = [];
          for (var i = 1; i <= c.filas; i++) { var v = (form.elements[c.id + "-" + i].value || "").trim(); if (v) items.push(i + ". " + v); }
          fields.push({ label: c.label, value: items.join("\n") });
        } else if (c.tipo === "observacion") {
          fields.push({ label: c.label, value: (form.elements[c.id].value || "").trim() });
          fields.push({ label: c.label + " · " + obs.pregunta, value: form.elements[c.id + "-repite"].value });
        } else {
          fields.push({ label: c.label, value: (form.elements[c.id].value || "").trim() });
        }
      });
      var payload = { action: "practica", activityKey: key, members: p.nombre + " · " + compa.value.trim(), fields: fields };
      boton.disabled = true;
      vaciar(estado);
      estado.appendChild(h("span", { class: "cargando", "aria-hidden": "true" }));
      estado.appendChild(h("p", { class: "aviso aviso--info", role: "status", text: "Enviando la práctica…" }));
      enviar(payload).then(function () {
        quitar(borradorClave);
        vaciar(estado);
        estado.appendChild(h("p", { class: "aviso aviso--ok", role: "status", text: "¡Práctica enviada! Ya aparece en el proyector para la puesta en común." }));
        boton.textContent = "Enviada";
      }).catch(function () {
        boton.disabled = false;
        vaciar(estado);
        estado.appendChild(h("p", { class: "aviso aviso--error", role: "alert", text: "No se pudo enviar. Tus respuestas siguen guardadas en este dispositivo: revisa la conexión y vuelve a intentarlo." }));
      });
    });

    raiz.appendChild(h("div", { class: "contenedor" },
      h("div", { class: "volver" }, h("a", { class: "enlace", href: "#/sesion/" + encodeURIComponent(hallado.sesion.key) }, "← " + hallado.sesion.etiqueta)),
      h("header", { class: "franja" },
        h("p", { class: "etiqueta", text: "Práctica en pareja · " + hallado.sesion.etiqueta }),
        h("h1", { class: "display display--m", text: pr.titulo }),
        h("p", { text: pr.instrucciones }),
        h("p", { class: "texto-apoyo", text: "Lo que escriban se guarda en este dispositivo mientras trabajan. Una sola persona de la pareja envía la práctica." })
      ),
      form
    ));
  }

  /* ---------- Vista: proyector (puesta en común) ---------- */
  var temporizador = null;
  function vistaProyector(key) {
    clearInterval(temporizador);
    vaciar(barraUsuario);
    var hallado = buscarPractica(key);
    vaciar(raiz);
    if (!hallado) { raiz.appendChild(h("div", { class: "contenedor" }, h("p", { text: "No existe esa práctica." }))); return; }
    var pr = hallado.practica;
    var estado = h("p", { class: "texto-apoyo", text: "Cargando respuestas…" });
    var conteo = h("div", { class: "conteo" });
    var muro = h("div", { class: "muro" });
    raiz.appendChild(h("div", { class: "contenedor" },
      h("p", { class: "etiqueta", text: "Puesta en común · " + hallado.sesion.etiqueta }),
      h("h1", { class: "display display--l", text: pr.titulo }),
      estado, conteo, muro
    ));

    var obs = textosObservacion(pr);
    var etiquetasObs = pr.campos.filter(function (c) { return c.tipo === "observacion"; });
    // La tarjeta de cada pareja muestra los campos con «proyectar»: el primero de tipo texto es el título.
    var aProyectar = pr.campos.filter(function (c) { return c.proyectar; });
    var cTitulo = aProyectar.find(function (c) { return c.tipo === "texto"; });
    var cDetalle = aProyectar.filter(function (c) { return c !== cTitulo; });

    function cargar() {
      fetch(GOOGLE_SCRIPT_URL + "?action=practicas&actividad=" + encodeURIComponent(key))
        .then(function (r) { return r.json(); })
        .then(function (res) {
          var items = (res && res.items) || [];
          estado.textContent = items.length + (items.length === 1 ? " pareja ha enviado" : " parejas han enviado") + " · se actualiza cada 15 segundos";
          vaciar(conteo);
          etiquetasObs.forEach(function (c) {
            var si = items.filter(function (it) { return it[c.label + " · " + obs.pregunta] === "Sí"; }).length;
            conteo.appendChild(h("div", null, h("b", { text: si }), sinPrefijo(c.label) + " " + obs.conteo));
          });
          vaciar(muro);
          items.slice().reverse().forEach(function (it) {
            muro.appendChild(h("article", { class: "pareja" },
              h("p", { class: "pareja__marca", text: (cTitulo && it[cTitulo.label]) || "Sin marca" }),
              h("p", { class: "texto-apoyo", text: it["Integrantes"] || "" }),
              h("dl", null, cDetalle.map(function (c) {
                return [h("dt", { text: typeof c.proyectar === "string" ? c.proyectar : sinPrefijo(c.label) }), h("dd", { text: it[c.label] || "—" })];
              }))
            ));
          });
        })
        .catch(function () { estado.textContent = "No se pudieron cargar las respuestas. Reintentando…"; });
    }
    cargar();
    temporizador = setInterval(function () { if (location.hash.indexOf("#/proyector/") === 0) cargar(); else clearInterval(temporizador); }, 15000);
  }

  /* ---------- Arranque ---------- */
  function migrarVersionAnterior() {
    // La app anterior guardaba «current_applicant» con nombre y fecha de nacimiento.
    var viejo = leer("current_applicant", null);
    if (viejo && !persona()) guardar("mivam_persona", { nombre: viejo.name, nacimiento: viejo.dob });
    quitar("current_applicant");
    quitar("quiz_db");
  }

  migrarVersionAnterior();
  render();
  reintentarPendientes().then(function () { return traerProgresoRemoto(); }).then(function () {
    if (/^#\/?(inicio)?$/.test(location.hash) || location.hash === "") render();
  });
})();
