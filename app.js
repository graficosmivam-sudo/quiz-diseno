/* Capacitación · Diseño Gráfico MIVAM — app de evaluaciones.
   Sin dependencias. El contenido vive en /contenido/*.js y herramientas/construir.js lo publica sin
   las respuestas: la corrección la hace el Apps Script (ver /apps-script/Codigo.gs).
   El acceso es con cuenta de Google: cada petición lleva el token de Google de quien la hace. */
(function () {
  "use strict";

  // ==========================================
  // CONFIGURACIÓN
  // ==========================================
  var GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbymxEza1msJmXFQpm4_wxw0LCVmJriMO7HcVTYXrt5PXCSgo1YdZHFCFnjgMQwlr3A2Fw/exec";
  // ID de cliente OAuth («Aplicación web») de Google Cloud. No es secreto. Ver seguridad/README.md.
  var GOOGLE_CLIENT_ID = "250612702128-ifn2gvge64vdkhq2tflpmli14rub53a8.apps.googleusercontent.com";

  var CURSOS = window.CURSOS || [];
  var raiz = document.getElementById("app");
  var barraUsuario = document.getElementById("barra-usuario");

  /* ---------- Almacenamiento (con tolerancia a errores) ---------- */
  function leer(clave, porDefecto, almacen) {
    try { var v = (almacen || localStorage).getItem(clave); return v ? JSON.parse(v) : porDefecto; } catch (e) { return porDefecto; }
  }
  function guardar(clave, valor, almacen) {
    try { (almacen || localStorage).setItem(clave, JSON.stringify(valor)); } catch (e) { /* sin almacenamiento */ }
  }
  function quitar(clave, almacen) { try { (almacen || localStorage).removeItem(clave); } catch (e) {} }
  function sesionStorage() { try { return window.sessionStorage; } catch (e) { return null; } }

  /* ---------- Sesión con Google ----------
     El token solo vive en esta pestaña (sessionStorage) y dura una hora. Al volver, Google vuelve a
     entrar solo si la persona ya eligió su cuenta antes («auto_select»). */
  var sesion = leer("mivam_sesion", null, sesionStorage());
  var cuenta = null;         // respuesta de «yo»: { registrado, admin, perfil, sesiones }
  var esperandoToken = [];   // promesas que esperan un token nuevo
  var googleListo = null;

  function decodificarToken(token) { // solo para mostrar datos y saber cuándo vence: quien verifica es el servidor
    try {
      var p = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(decodeURIComponent(escape(atob(p))));
    } catch (e) { return null; }
  }
  function sesionVigente() { return !!(sesion && sesion.exp * 1000 > Date.now() + 60000); }
  function correo() { return sesion ? sesion.correo : ""; }

  function cargarGoogle() {
    if (googleListo) return googleListo;
    googleListo = new Promise(function (resolver, rechazar) {
      var intentos = 0;
      (function esperar() {
        if (window.google && google.accounts && google.accounts.id) {
          google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: alRecibirCredencial,
            auto_select: true,
            cancel_on_tap_outside: false,
            use_fedcm_for_prompt: true,
            context: "signin"
          });
          return resolver();
        }
        if (++intentos > 100) { googleListo = null; return rechazar(new Error("No cargó el acceso de Google")); }
        setTimeout(esperar, 100);
      })();
    });
    return googleListo;
  }

  function alRecibirCredencial(respuesta) {
    var datos = decodificarToken(respuesta && respuesta.credential);
    if (!datos || !datos.email) return;
    var cambioDeCuenta = correo() && correo() !== String(datos.email).toLowerCase();
    sesion = { token: respuesta.credential, exp: datos.exp, correo: String(datos.email).toLowerCase(), nombreGoogle: datos.name || "" };
    guardar("mivam_sesion", sesion, sesionStorage());
    if (cambioDeCuenta) cuenta = null;
    var pendientes = esperandoToken; esperandoToken = [];
    pendientes.forEach(function (p) { p.resolver(); });
    if (!pendientes.length) {
      var volver = leer("mivam_volver", null, sesionStorage());
      quitar("mivam_volver", sesionStorage());
      if (volver && volver !== location.hash) location.hash = volver; else render();
    }
  }

  /** Pide a Google un token nuevo sin interrumpir (sirve cuando vence a la hora). */
  function renovarToken() {
    return cargarGoogle().then(function () {
      return new Promise(function (resolver, rechazar) {
        var item = { resolver: resolver };
        esperandoToken.push(item);
        google.accounts.id.prompt();
        setTimeout(function () {
          if (esperandoToken.indexOf(item) === -1) return;
          esperandoToken.splice(esperandoToken.indexOf(item), 1);
          rechazar(errorSesion());
        }, 20000);
      });
    });
  }
  function errorSesion() { var e = new Error("Tu sesión venció. Vuelve a entrar con Google."); e.codigo = "sesion"; return e; }

  function cerrarSesion(guardarVuelta) {
    if (guardarVuelta) guardar("mivam_volver", location.hash, sesionStorage());
    sesion = null;
    cuenta = null;
    quitar("mivam_sesion", sesionStorage());
  }

  /* ---------- Llamadas al registro ----------
     POST con cuerpo de texto: así el navegador no hace la consulta previa (CORS) que Apps Script no responde. */
  function api(accion, datos) {
    var listo = sesionVigente() ? Promise.resolve() : renovarToken();
    return listo.then(function () {
      var cuerpo = Object.assign({ action: accion, token: sesion.token }, datos || {});
      return fetch(GOOGLE_SCRIPT_URL, { method: "POST", body: JSON.stringify(cuerpo), redirect: "follow", credentials: "omit" });
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }).then(function (res) {
      if (res && (res.status === "ok" || res.status === "success")) return res;
      var e = new Error((res && res.message) || "Respuesta inesperada del registro.");
      e.codigo = res && res.codigo;
      throw e;
    }).catch(function (e) {
      if (e.codigo === "sesion") { cerrarSesion(true); render(); }
      throw e;
    });
  }

  /* ---------- Datos locales de la cuenta (solo como apoyo; la fuente es la hoja) ---------- */
  function claveLocal(nombre) { return "mivam_" + nombre + "_" + correo(); }
  function resultados() { return leer(claveLocal("resultados"), {}); }
  function guardarResultado(key, r) { var todo = resultados(); todo[key] = r; guardar(claveLocal("resultados"), todo); }

  function limpiarDatosLocales() {
    try {
      Object.keys(localStorage).forEach(function (k) {
        if (/^mivam_/.test(k) || k === "current_applicant" || k === "quiz_db") localStorage.removeItem(k);
      });
    } catch (e) {}
  }
  function migrarVersionAnterior() {
    // Las versiones sin cuenta guardaban nombre, nacimiento y notas en el dispositivo. Ya no se usan.
    if (leer("mivam_persona", null) || leer("current_applicant", null)) limpiarDatosLocales();
  }

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
  function contenedor() { var c = h("div", { class: "contenedor" }); agregar(c, Array.prototype.slice.call(arguments)); return c; }
  function cargando(texto) {
    vaciar(raiz);
    raiz.appendChild(contenedor(h("div", { class: "envio" },
      h("span", { class: "cargando", "aria-hidden": "true" }), h("p", { class: "texto-apoyo", text: texto }))));
  }

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

  /* ---------- Barra superior ---------- */
  function pintarBarra() {
    vaciar(barraUsuario);
    if (!cuenta || !cuenta.registrado) return;
    barraUsuario.appendChild(h("div", { class: "usuario" },
      h("span", { class: "avatar", "aria-hidden": "true", text: iniciales(cuenta.perfil.nombre) }),
      h("span", { class: "usuario__nombre", text: cuenta.perfil.nombre }),
      h("button", { class: "btn btn--secundario btn--chico", type: "button", onclick: pedirSalida }, "Salir")
    ));
  }
  function pedirSalida() {
    vaciar(raiz);
    raiz.appendChild(contenedor(
      h("div", { class: "panel panel--angosto" },
        h("p", { class: "etiqueta", text: "Cerrar sesión" }),
        h("h2", { class: "display display--m", text: "¿Salir?" }),
        h("p", { class: "texto-apoyo", text: "Tus resultados ya están en el registro del área. Al salir se borra lo guardado en este dispositivo." }),
        h("div", { class: "acciones" },
          h("button", { class: "btn", type: "button", onclick: salir }, "Sí, salir"),
          h("button", { class: "btn btn--secundario", type: "button", onclick: render }, "Cancelar")
        )
      )
    ));
  }
  function salir() {
    limpiarDatosLocales();
    cerrarSesion(false);
    if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect();
    ir("#/inicio");
  }

  /* ---------- Rutas ---------- */
  function ir(hash) { if (location.hash === hash) render(); else location.hash = hash; }
  window.addEventListener("hashchange", render);

  var temporizador = null;
  function render() {
    clearInterval(temporizador);
    var ruta = location.hash.replace(/^#\/?/, "").split("/");
    document.body.classList.toggle("proyector", ruta[0] === "proyector");
    window.scrollTo(0, 0);
    pintarBarra();
    if (!GOOGLE_CLIENT_ID) return vistaSinConfigurar();
    if (!sesionVigente()) return vistaIngreso();
    if (!cuenta) return cargarCuenta();
    if (!cuenta.registrado) return vistaRegistro();
    if (ruta[0] === "proyector" && ruta[1]) return vistaProyector(decodeURIComponent(ruta[1]));
    if (ruta[0] === "sesion" && ruta[1]) return vistaSesion(decodeURIComponent(ruta[1]));
    if (ruta[0] === "practica" && ruta[1]) return vistaPractica(decodeURIComponent(ruta[1]));
    return vistaInicio();
  }

  function cargarCuenta() {
    cargando("Cargando tu registro…");
    api("yo").then(function (res) { cuenta = res; render(); }).catch(function (e) {
      if (e.codigo === "sesion") return;
      vaciar(raiz);
      raiz.appendChild(contenedor(h("div", { class: "panel panel--angosto" },
        h("p", { class: "aviso aviso--error", role: "alert", text: "No se pudo conectar con el registro del área. " + e.message }),
        h("button", { class: "btn", type: "button", onclick: render }, "Reintentar"))));
    });
  }

  /* ---------- Vista: ingreso ---------- */
  function encabezadoIngreso() {
    return h("div", { class: "ingreso__titular" },
      h("p", { class: "etiqueta", text: "Área de Diseño Gráfico MIVAM" }),
      h("h1", { class: "display display--xl", text: "Capacitación" }),
      h("p", { class: "ingreso__bajada", text: "Evaluaciones y prácticas del programa de formación del área." })
    );
  }
  function fotoEquipo() {
    return h("div", { class: "ingreso__intro" },
      h("img", { src: "assets/img/equipo-caritas.jpg", alt: "Las caritas del equipo de diseño", width: "1600", height: "346" }));
  }

  function vistaIngreso() {
    vaciar(raiz);
    var boton = h("div", { class: "boton-google" });
    var estado = h("p", { class: "texto-apoyo", text: "Cargando el acceso de Google…" });
    raiz.appendChild(contenedor(encabezadoIngreso(),
      h("div", { class: "ingreso" }, fotoEquipo(),
        h("div", { class: "panel" },
          h("p", { class: "etiqueta", text: "Ingreso" }),
          h("h2", { class: "ingreso__subtitulo", text: "Entra con tu cuenta de Google" }),
          h("p", { class: "texto-apoyo", text: "Así tus notas quedan unidas a ti y nadie más puede verlas ni cambiarlas. Solo usamos tu nombre y tu correo." }),
          boton, estado
        ))
    ));
    cargarGoogle().then(function () {
      estado.hidden = true;
      google.accounts.id.renderButton(boton, { type: "standard", theme: "outline", size: "large", text: "continue_with", shape: "pill", locale: "es", width: 280 });
      google.accounts.id.prompt();
    }).catch(function () {
      estado.className = "aviso aviso--error";
      estado.textContent = "No se pudo cargar el acceso de Google. Revisa la conexión o desactiva el bloqueador de anuncios para este sitio y recarga la página.";
    });
  }

  function vistaSinConfigurar() {
    vaciar(raiz);
    raiz.appendChild(contenedor(encabezadoIngreso(), h("div", { class: "panel panel--angosto" },
      h("p", { class: "aviso aviso--info", text: "Falta configurar el acceso con Google (GOOGLE_CLIENT_ID en app.js). Ver seguridad/README.md." }))));
  }

  /* ---------- Vista: registro (primera vez) ---------- */
  function vistaRegistro() {
    vaciar(raiz);
    var error = h("p", { class: "aviso aviso--error", hidden: true, role: "alert" });
    var nombre = h("input", { class: "control", id: "reg-nombre", type: "text", autocomplete: "name", maxlength: "80", placeholder: "Ej.: Alejandro Marcano", required: true });
    nombre.value = cuenta.nombreGoogle || "";
    var nac = h("input", { class: "control", id: "reg-nacimiento", type: "date", required: true });
    var tel = h("input", { class: "control", id: "reg-telefono", type: "tel", autocomplete: "tel", maxlength: "20", placeholder: "+58 412 123 4567", required: true });
    var acepta = h("input", { id: "reg-acepta", type: "checkbox", required: true });
    var boton = h("button", { class: "btn btn--bloque", type: "submit" }, "Completar registro");

    function mostrarError(texto, foco) { error.textContent = texto; error.hidden = false; if (foco) foco.focus(); }
    var form = h("form", { class: "panel", novalidate: true, onsubmit: function (e) {
        e.preventDefault();
        var n = nombre.value.replace(/\s+/g, " ").trim();
        if (n.split(" ").length < 2) return mostrarError("Escribe tu nombre y tu apellido.", nombre);
        if (!nac.value) return mostrarError("Indica tu fecha de nacimiento.", nac);
        if (!/^\+?[0-9][0-9 ().-]{6,19}$/.test(tel.value.trim())) return mostrarError("Escribe un teléfono válido, con el código del país.", tel);
        if (!acepta.checked) return mostrarError("Para registrarte debes aceptar el uso de tus datos.", acepta);
        error.hidden = true;
        boton.disabled = true;
        boton.textContent = "Guardando…";
        api("registro", { nombre: n, nacimiento: nac.value, telefono: tel.value.trim(), acepta: true })
          .then(function (res) { cuenta = res; ir("#/inicio"); })
          .catch(function (err) { boton.disabled = false; boton.textContent = "Completar registro"; mostrarError(err.message); });
      } },
      h("p", { class: "etiqueta", text: "Registro" }),
      h("h2", { class: "ingreso__subtitulo", text: "Completa tu registro" }),
      h("p", { class: "texto-apoyo" }, "Entraste como ", h("strong", { text: correo() }), ". Si ya hiciste evaluaciones antes, escribe tu nombre igual que entonces: así se unen tus notas."),
      h("div", { class: "campo" }, h("label", { for: "reg-nombre", text: "Nombre y apellido" }), nombre),
      h("div", { class: "campo" }, h("label", { for: "reg-nacimiento", text: "Fecha de nacimiento" }), nac,
        h("span", { class: "ayuda", text: "La usamos para el registro de cumpleaños del área." })),
      h("div", { class: "campo" }, h("label", { for: "reg-telefono", text: "Teléfono (WhatsApp)" }), tel,
        h("span", { class: "ayuda", text: "Para avisarte de las sesiones y de tu avance." })),
      h("label", { class: "casilla", for: "reg-acepta" }, acepta,
        h("span", { text: "Acepto que el Área de Diseño Gráfico MIVAM guarde estos datos para la capacitación. Solo los ve el liderazgo del área y no se comparten." })),
      error,
      boton,
      h("button", { class: "enlace", type: "button", onclick: salir }, "Usar otra cuenta de Google")
    );
    raiz.appendChild(contenedor(encabezadoIngreso(), h("div", { class: "ingreso" }, fotoEquipo(), form)));
  }

  /* ---------- Vista: inicio ---------- */
  function notaDe(key) {
    if (cuenta.sesiones && cuenta.sesiones[key] !== undefined) return cuenta.sesiones[key];
    return null;
  }

  function vistaInicio() {
    vaciar(raiz);
    var cont = contenedor(
      h("div", { class: "saludo" },
        h("p", { class: "etiqueta", text: "Tus evaluaciones" }),
        h("h1", { class: "display display--l", text: "Hola, " + cuenta.perfil.nombre.split(" ")[0] })
      )
    );
    CURSOS.forEach(function (curso) {
      var rejilla = h("div", { class: "rejilla" });
      curso.sesiones.forEach(function (s) {
        var nota = notaDe(s.key);
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
    var notaRegistrada = notaDe(key);
    var previo = resultados()[key] || null;       // corrección que devolvió el servidor en este dispositivo
    if (previo && previo.registrado && notaRegistrada === null) previo = null; // el líder borró la nota: se puede repetir
    var borradorClave = claveLocal("borrador_" + key);
    var respuestas = previo ? Object.assign({}, previo.answers) : leer(borradorClave, {});
    var evaluada = !!previo;
    var modoRepaso = previo ? !previo.registrado : notaRegistrada !== null;

    vaciar(raiz);
    var relleno = h("div", { class: "progreso__relleno" });
    var textoProg = h("span", { class: "progreso__texto" });
    var lista = h("div", { class: "preguntas" });
    var botonEvaluar = h("button", { class: "btn btn--bloque", type: "button", disabled: true, onclick: evaluar }, "Evaluar " + s.etiqueta.toLowerCase());
    var estadoEnvio = h("div", { class: "envio" });
    var zonaResultado = h("div");

    function actualizarProgreso() {
      var n = s.questions.filter(function (q) { return respuestas[q.id] !== undefined; }).length;
      relleno.style.width = (n / s.questions.length * 100) + "%";
      textoProg.textContent = n + " / " + s.questions.length;
      botonEvaluar.disabled = evaluada || n < s.questions.length;
    }

    function pintarPreguntas() {
      vaciar(lista);
      var detalle = previo ? previo.detalle : {};
      s.questions.forEach(function (q, i) {
        var d = detalle[q.id];
        var opciones = q.type === "vf"
          ? [{ key: true, letra: "V", text: "Verdadero" }, { key: false, letra: "F", text: "Falso" }]
          : q.options.map(function (o) { return { key: o.key, letra: o.key, text: o.text }; });
        var cont = h("div", { class: "opciones" + (q.type === "vf" ? " opciones--vf" : ""), role: "group", "aria-label": "Opciones de la pregunta " + (i + 1) });
        opciones.forEach(function (o) {
          var elegida = respuestas[q.id] === o.key;
          var clase = "opcion";
          var estado = null;
          if (evaluada && d) {
            if (o.key === d.correcta) { clase += " opcion--correcta"; estado = "Correcta"; }
            else if (elegida) { clase += " opcion--incorrecta"; estado = "Tu respuesta"; }
          } else if (elegida) clase += " opcion--seleccionada";
          var idBoton = "o-" + q.id + "-" + o.letra;
          cont.appendChild(h("button", { class: clase, id: idBoton, type: "button", disabled: evaluada, "aria-pressed": elegida ? "true" : "false",
              onclick: function () {
                respuestas[q.id] = o.key;
                guardar(borradorClave, respuestas);
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
        lista.appendChild(h("article", { class: "pregunta", id: "p-" + q.id },
          h("div", { class: "pregunta__tipo" },
            h("span", { class: "pregunta__numero", text: dosDigitos(i + 1) }),
            h("span", { class: "etiqueta", text: q.type === "vf" ? "Verdadero o falso" : q.type === "case" ? "Caso de estudio" : "Opción múltiple" })
          ),
          q.type === "case" ? h("p", { class: "caso", text: q.caseText }) : null,
          h("p", { class: "pregunta__texto", text: q.text }),
          cont,
          evaluada && d ? h("p", { class: "retro " + (d.acierto ? "retro--correcto" : "retro--error") },
            h("strong", { text: d.acierto ? "Correcto" : "Incorrecto" }), d.retro) : null
        ));
      });
    }

    function pintarEstado(tipo, texto, reintento) {
      vaciar(estadoEnvio);
      if (tipo === "enviando") estadoEnvio.appendChild(h("span", { class: "cargando", "aria-hidden": "true" }));
      estadoEnvio.appendChild(h("p", { class: "aviso " + (tipo === "ok" ? "aviso--ok" : tipo === "error" ? "aviso--error" : "aviso--info"), role: "status", text: texto }));
      if (reintento) estadoEnvio.appendChild(h("button", { class: "btn btn--secundario btn--chico", type: "button", onclick: reintento }, "Reintentar"));
    }

    function evaluar() {
      botonEvaluar.disabled = true;
      pintarEstado("enviando", modoRepaso ? "Corrigiendo tu repaso…" : "Corrigiendo y guardando en el registro del área…");
      api("quiz", { sessionKey: key, answers: respuestas }).then(function (res) {
        previo = { answers: respuestas, detalle: res.detalle, correct: res.correct, total: res.total, pct: res.pct, registrado: res.registrado };
        guardarResultado(key, previo);
        quitar(borradorClave);
        if (res.registrado) cuenta.sesiones[key] = res.pct;
        evaluada = true;
        modoRepaso = !res.registrado;
        notaRegistrada = res.notaRegistrada;
        botonEvaluar.hidden = true;
        pintarPreguntas();
        actualizarProgreso();
        pintarResultado();
        zonaResultado.scrollIntoView({ behavior: "smooth", block: "start" });
      }).catch(function (err) {
        actualizarProgreso();
        pintarEstado("error", "No se pudo corregir: " + err.message + " Tus respuestas siguen guardadas en este dispositivo.", evaluar);
      });
    }

    function pintarResultado() {
      vaciar(zonaResultado);
      var correctas = previo.correct, pct = previo.pct, total = previo.total;
      var minimo = Math.ceil(total * s.aprobar / 100);
      var nivel;
      if (s.criterio === "aprobacion") {
        nivel = pct >= s.aprobar
          ? { titulo: "Aprobado", texto: "Superaste el mínimo de " + minimo + " de " + total + ". ¡Bien hecho!", clase: "pastilla--correcto", fiesta: true }
          : { titulo: "Necesitas repasar", texto: "El mínimo es " + minimo + " de " + total + ". Repasa con tu diseñador de turno antes del próximo módulo.", clase: "pastilla--error", fiesta: false };
      } else {
        nivel = pct >= 83 ? { titulo: "Dominio sólido", texto: "Comprensión excelente del tema analizado.", clase: "pastilla--correcto", fiesta: true }
          : pct >= 50 ? { titulo: "Buen avance", texto: "Comprensión general estable, con pequeños detalles a reforzar.", clase: "pastilla--naranja", fiesta: false }
          : { titulo: "Necesita refuerzo", texto: "Se sugiere repasar los tópicos base de la sesión.", clase: "pastilla--error", fiesta: false };
      }
      if (modoRepaso) pintarEstado("info", "Repaso: no cambia tu nota registrada" + (notaRegistrada !== null && notaRegistrada !== undefined ? " (" + notaRegistrada + "%)." : "."));
      else pintarEstado("ok", "Resultado guardado en el registro del área.");
      zonaResultado.appendChild(h("section", { class: "resultado", "aria-live": "polite" },
        nivel.fiesta ? destellos() : null,
        h("p", { class: "etiqueta", text: modoRepaso ? "Repaso · no se registra" : "Tu resultado" }),
        h("p", { class: "resultado__nota", text: pct + "%" }),
        h("div", { class: "pastillas" }, h("span", { class: "pastilla " + nivel.clase, text: nivel.titulo })),
        h("p", { text: nivel.texto }),
        h("div", { class: "resultado__desglose" },
          h("div", { class: "resultado__dato" }, h("b", { text: correctas }), h("span", { text: "Correctas" })),
          h("div", { class: "resultado__dato" }, h("b", { text: total - correctas }), h("span", { text: "Incorrectas" })),
          h("div", { class: "resultado__dato" }, h("b", { text: total }), h("span", { text: "Preguntas" }))
        ),
        estadoEnvio,
        h("div", { class: "acciones" },
          s.practica ? h("a", { class: "btn btn--acento", href: "#/practica/" + encodeURIComponent(s.practica.key) }, "Ir a la práctica en pareja") : null,
          h("a", { class: "btn btn--secundario", href: "#/inicio" }, "Volver a mis evaluaciones")
        )
      ));
    }

    raiz.appendChild(contenedor(
      h("div", { class: "volver" }, h("a", { class: "enlace", href: "#/inicio" }, "← Mis evaluaciones")),
      h("header", { class: "franja" },
        h("p", { class: "etiqueta", text: s.fase + " · " + s.etiqueta + " · " + s.mode }),
        h("h1", { class: "display display--m", text: s.title }),
        h("p", { text: s.desc }),
        !previo && modoRepaso ? h("p", { class: "aviso aviso--info", text: "Ya registraste esta evaluación (" + notaRegistrada + "%). Puedes responderla como repaso: tu nota no cambia." }) : null,
        s.practica ? h("p", { class: "texto-apoyo" }, "Práctica en pareja: ", h("a", { class: "enlace", href: "#/practica/" + encodeURIComponent(s.practica.key) }, s.practica.titulo)) : null
      ),
      h("div", { class: "progreso" }, h("div", { class: "progreso__barra" }, relleno), textoProg),
      lista,
      evaluada ? null : botonEvaluar,
      evaluada ? null : estadoEnvio,
      zonaResultado
    ));
    pintarPreguntas();
    actualizarProgreso();
    if (previo) pintarResultado();
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
    var borradorClave = claveLocal("borrador_" + key);
    var borrador = leer(borradorClave, {});
    var obs = textosObservacion(pr);
    vaciar(raiz);

    function control(id, tipo, extra) {
      var attrs = Object.assign({ class: "control", id: id, name: id, maxlength: "2000" }, extra || {});
      var el = tipo === "parrafo" ? h("textarea", attrs) : h("input", Object.assign({ type: "text" }, attrs));
      if (borrador[id]) el.value = borrador[id];
      el.addEventListener("input", function () { borrador[id] = el.value; guardar(borradorClave, borrador); });
      return el;
    }

    var compa = control("integrante-2", "texto", { placeholder: "Nombre y apellido", autocomplete: "off", maxlength: "160" });
    var form = h("form", { class: "formulario", novalidate: true });
    form.appendChild(h("div", { class: "bloque" },
      h("h3", { text: "Integrantes" }),
      h("div", { class: "fila-dos" },
        h("div", { class: "campo" }, h("label", { for: "integrante-1", text: "Tú" }), h("input", { class: "control", id: "integrante-1", type: "text", value: cuenta.perfil.nombre, disabled: true })),
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
        var sel = h("select", { class: "control", id: c.id + "-repite", name: c.id + "-repite", "aria-label": c.label + " · " + obs.pregunta },
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
      boton.disabled = true;
      vaciar(estado);
      estado.appendChild(h("span", { class: "cargando", "aria-hidden": "true" }));
      estado.appendChild(h("p", { class: "aviso aviso--info", role: "status", text: "Enviando la práctica…" }));
      api("practica", { activityKey: key, pareja: compa.value.trim(), fields: fields }).then(function () {
        quitar(borradorClave);
        vaciar(estado);
        estado.appendChild(h("p", { class: "aviso aviso--ok", role: "status", text: "¡Práctica enviada! Ya aparece en el proyector para la puesta en común." }));
        boton.textContent = "Enviada";
      }).catch(function (err) {
        boton.disabled = false;
        vaciar(estado);
        estado.appendChild(h("p", { class: "aviso aviso--error", role: "alert", text: "No se pudo enviar: " + err.message + " Tus respuestas siguen guardadas en este dispositivo." }));
      });
    });

    raiz.appendChild(contenedor(
      h("div", { class: "volver" }, h("a", { class: "enlace", href: "#/sesion/" + encodeURIComponent(hallado.sesion.key) }, "← " + hallado.sesion.etiqueta)),
      h("header", { class: "franja" },
        h("p", { class: "etiqueta", text: "Práctica en pareja · " + hallado.sesion.etiqueta }),
        h("h1", { class: "display display--m", text: pr.titulo }),
        h("p", { text: pr.instrucciones }),
        h("p", { class: "texto-apoyo", text: "Lo que escriban se guarda en este dispositivo mientras trabajan. Una sola persona de la pareja envía la práctica." }),
        cuenta.admin ? h("p", { class: "texto-apoyo" }, "Líder: ", h("a", { class: "enlace", href: "#/proyector/" + encodeURIComponent(key) }, "abrir la puesta en común en el proyector")) : null
      ),
      form
    ));
  }

  /* ---------- Vista: proyector (puesta en común, solo administradores) ---------- */
  function vistaProyector(key) {
    vaciar(barraUsuario);
    var hallado = buscarPractica(key);
    vaciar(raiz);
    if (!hallado) { raiz.appendChild(contenedor(h("p", { text: "No existe esa práctica." }))); return; }
    if (!cuenta.admin) {
      raiz.appendChild(contenedor(h("p", { class: "aviso aviso--error", role: "alert", text: "El proyector es solo para el líder y los miembros fijos del área." }),
        h("a", { class: "enlace", href: "#/inicio" }, "← Mis evaluaciones")));
      return;
    }
    var pr = hallado.practica;
    var estado = h("p", { class: "texto-apoyo", text: "Cargando respuestas…" });
    var conteo = h("div", { class: "conteo" });
    var muro = h("div", { class: "muro" });
    raiz.appendChild(contenedor(
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
      api("practicas", { actividad: key })
        .then(function (res) {
          var items = res.items || [];
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
                return [h("dt", { text: typeof c.proyectar === "string" ? c.proyectar : sinPrefijo(c.label) }), h("dd", { text: String(it[c.label] || "—") })];
              }))
            ));
          });
        })
        .catch(function (e) { if (e.codigo !== "sesion") estado.textContent = "No se pudieron cargar las respuestas (" + e.message + "). Reintentando…"; });
    }
    cargar();
    temporizador = setInterval(function () { if (location.hash.indexOf("#/proyector/") === 0) cargar(); else clearInterval(temporizador); }, 15000);
  }

  /* ---------- Arranque ---------- */
  migrarVersionAnterior();
  if (sesion && !sesionVigente()) cerrarSesion(false);
  render();
})();
