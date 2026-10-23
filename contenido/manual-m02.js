/* Curso «De la marca al manual» · Módulo 02: Anatomía de un manual
   Sesión: sábado 31 de octubre de 2026 · 9:00 a. m. · Studio de Multimedia MIVAM.
   Se carga en index.html después de manual-m01.js. */
window.CURSOS = window.CURSOS || [];
(function () {
  var curso = window.CURSOS.find(function (c) { return c.id === "manual"; });
  if (!curso) {
    curso = { id: "manual", titulo: "De la marca al manual", descripcion: "Curso de 6 módulos sobre manuales de identidad. Se toma después del programa de Photoshop.", sesiones: [] };
    window.CURSOS.push(curso);
  }

  curso.sesiones.push({
    key: "M02-manual",
    etiqueta: "Módulo 02",
    title: "Anatomía de un manual",
    fase: "FASE 1",
    mode: "Presencial",
    desc: "Las nueve secciones de un manual de identidad y qué decide cada una. Aprueba con 6 de 8.",
    aprobar: 75,
    criterio: "aprobacion",
    questions: [
      { id: "M02-1", type: "mc", text: "¿Qué define la sección de esencia de un manual?",
        options: [
          { key: "A", text: "Los colores y las tipografías." },
          { key: "B", text: "El propósito, los valores, la personalidad y el tono de la marca." },
          { key: "C", text: "Los tamaños y nombres de los archivos." },
          { key: "D", text: "Las versiones del logo." } ],
        answer: "B",
        feedbackCorrect: "La esencia es el porqué de la marca; todas las demás secciones se deciden a partir de ella.",
        feedbackWrong: "La respuesta correcta es B. La esencia reúne propósito, valores, personalidad y tono." },
      { id: "M02-2", type: "mc", text: "¿Qué es el área de respeto de un logo?",
        options: [
          { key: "A", text: "El tamaño más pequeño al que se puede usar el logo." },
          { key: "B", text: "El color de fondo donde siempre va el logo." },
          { key: "C", text: "La zona libre alrededor del logo donde no entra ningún otro elemento." },
          { key: "D", text: "El espacio entre dos piezas de un carrusel." } ],
        answer: "C",
        feedbackCorrect: "Es el espacio personal del logo: si un texto o una foto se le pega, pierde fuerza.",
        feedbackWrong: "La respuesta correcta es C. El área de respeto es la zona libre alrededor del logo." },
      { id: "M02-3", type: "mc", text: "¿Por qué el área de respeto se mide con una «unidad X» tomada del propio logo?",
        options: [
          { key: "A", text: "Para que crezca y se achique junto con el logo." },
          { key: "B", text: "Porque es más fácil medir en centímetros." },
          { key: "C", text: "Para que todas las marcas tengan el mismo espacio." },
          { key: "D", text: "Porque así lo pide la imprenta." } ],
        answer: "A",
        feedbackCorrect: "Al venir del propio logo, la medida funciona igual en un post que en una valla.",
        feedbackWrong: "La respuesta correcta es A. La unidad X es proporcional al logo, así escala con él." },
      { id: "M02-4", type: "mc", text: "¿Qué indica el tamaño mínimo de un logo?",
        options: [
          { key: "A", text: "El tamaño recomendado para redes sociales." },
          { key: "B", text: "La versión más simple del logo." },
          { key: "C", text: "El espacio que debe quedar alrededor." },
          { key: "D", text: "El tamaño más pequeño al que se reproduce y sigue siendo legible." } ],
        answer: "D",
        feedbackCorrect: "Por debajo de ese tamaño el logo se vuelve una mancha. Se da en píxeles y en milímetros.",
        feedbackWrong: "La respuesta correcta es D. El tamaño mínimo garantiza que el logo siga legible." },
      { id: "M02-5", type: "mc", text: "Vas a mandar a imprimir un flyer. ¿Qué códigos de color necesita la imprenta?",
        options: [
          { key: "A", text: "HEX." },
          { key: "B", text: "CMYK o Pantone." },
          { key: "C", text: "RGB." },
          { key: "D", text: "Ninguno: basta con el nombre del color." } ],
        answer: "B",
        feedbackCorrect: "HEX y RGB son para pantalla; CMYK y Pantone, para impresión.",
        feedbackWrong: "La respuesta correcta es B. Para imprimir se usan CMYK (cuatro tintas) o Pantone (tinta exacta)." },
      { id: "M02-6", type: "mc", text: "¿Cuándo se usa la versión negativa de un logo?",
        options: [
          { key: "A", text: "Sobre fondos oscuros." },
          { key: "B", text: "Cuando el espacio es muy pequeño." },
          { key: "C", text: "En impresiones a una sola tinta." },
          { key: "D", text: "Cuando el logo se ve demasiado grande." } ],
        answer: "A",
        feedbackCorrect: "El negativo es la versión en claro para que el logo se lea sobre fondos oscuros.",
        feedbackWrong: "La respuesta correcta es A. Espacios pequeños usan el isotipo; una tinta, el monocromo." },
      { id: "M02-7", type: "mc", text: "En el mapa de nueve secciones, ¿en cuál entran las caritas del equipo?",
        options: [
          { key: "A", text: "Logo." },
          { key: "B", text: "Ficha técnica." },
          { key: "C", text: "Imágenes (ilustración y personajes)." },
          { key: "D", text: "Esencia." } ],
        answer: "C",
        feedbackCorrect: "Las caritas son ilustraciones con estilo fijo: pertenecen a la sección de imágenes.",
        feedbackWrong: "La respuesta correcta es C. Las caritas son la «imagen» del kit, con su estilo de ilustración fijo." },
      { id: "M02-8", type: "mc", text: "¿Qué encuentras en la ficha técnica de un manual?",
        options: [
          { key: "A", text: "Los valores de la marca." },
          { key: "B", text: "Ejemplos de errores." },
          { key: "C", text: "El estilo de fotografía." },
          { key: "D", text: "Tamaños, formatos y nombres de archivo." } ],
        answer: "D",
        feedbackCorrect: "La ficha técnica evita preguntar «¿de qué tamaño era?» y ordena los archivos.",
        feedbackWrong: "La respuesta correcta es D. La ficha técnica reúne tamaños, formatos y nombres de archivo." }
    ],
    practica: {
      key: "M02-radiografia",
      titulo: "Radiografía de un manual",
      // Textos de las filas «observacion»: aquí el Sí/Casi/No responde si el kit tiene la sección.
      observacion: { pregunta: "¿El kit la tiene?", placeholder: "Página y nota", conteo: "completa en el kit" },
      instrucciones: "En pareja y con el Kit de Identidad abierto: A) marquen si el kit tiene cada sección (Sí = completa, Casi = parcial, No = no la tiene) y anoten la página; B) con sus fotos de la tarea, digan qué secciones del manual de esa marca se ven; C) propongan una regla que le falte al kit.",
      campos: [
        { id: "esencia", label: "A · 01 Esencia", tipo: "observacion" },
        { id: "logo", label: "A · 02 Logo", tipo: "observacion" },
        { id: "color", label: "A · 03 Color", tipo: "observacion" },
        { id: "tipografia", label: "A · 04 Tipografía", tipo: "observacion" },
        { id: "elementos", label: "A · 05 Elementos gráficos", tipo: "observacion" },
        { id: "imagenes", label: "A · 06 Imágenes", tipo: "observacion" },
        { id: "aplicaciones", label: "A · 07 Aplicaciones", tipo: "observacion" },
        { id: "incorrectos", label: "A · 08 Usos incorrectos", tipo: "observacion" },
        { id: "ficha", label: "A · 09 Ficha técnica", tipo: "observacion" },
        { id: "marca", label: "B · Marca de sus fotos", tipo: "texto", proyectar: true },
        { id: "secciones-fotos", label: "B · ¿Qué secciones de su manual se ven en las fotos?", tipo: "parrafo", proyectar: true },
        { id: "regla", label: "C · Una regla que le falta al kit", tipo: "parrafo", ayuda: "Concreta, medible y justificada.", proyectar: true }
      ]
    }
  });
})();
