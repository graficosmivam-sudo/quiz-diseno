/* Curso «De la marca al manual» · Módulo 01: ¿Qué es una identidad?
   Para agregar un módulo, copia este archivo como manual-m0X.js, cambia la clave (M0X-manual)
   y agrégalo en index.html debajo de los demás. */
window.CURSOS = window.CURSOS || [];
(function () {
  var curso = window.CURSOS.find(function (c) { return c.id === "manual"; });
  if (!curso) {
    curso = {
      id: "manual",
      titulo: "De la marca al manual",
      descripcion: "Curso de 6 módulos sobre manuales de identidad. Se toma después del programa de Photoshop.",
      sesiones: []
    };
    window.CURSOS.push(curso);
  }

  curso.sesiones.push({
    key: "M01-manual",
    etiqueta: "Módulo 01",
    title: "¿Qué es una identidad?",
    fase: "FASE 1",
    mode: "Presencial",
    desc: "Marca, identidad, logo y manual: las cuatro palabras que todo diseñador debe distinguir. Aprueba con 6 de 8.",
    aprobar: 75,
    criterio: "aprobacion",
    questions: [
      { id: "M01-1", type: "mc", text: "¿Cuál es la diferencia entre marca e identidad?",
        options: [
          { key: "A", text: "Son dos nombres para lo mismo." },
          { key: "B", text: "La marca es lo que el público piensa y siente; la identidad son los elementos con que se presenta." },
          { key: "C", text: "La marca es el logo y la identidad es el nombre." },
          { key: "D", text: "La identidad es lo que el público siente; la marca es la paleta de colores." } ],
        answer: "B",
        feedbackCorrect: "La marca se siente (vive en la mente del público); la identidad se diseña (logo, colores, tipografías, imágenes y tono).",
        feedbackWrong: "La respuesta correcta es B. La marca es percepción; la identidad es el conjunto de elementos que diseñamos para presentarnos." },
      { id: "M01-2", type: "mc", text: "El logo es…",
        options: [
          { key: "A", text: "Toda la marca." },
          { key: "B", text: "El manual de identidad." },
          { key: "C", text: "Una pieza de la identidad: la firma." },
          { key: "D", text: "La tipografía principal." } ],
        answer: "C",
        feedbackCorrect: "Exacto: el logo es la firma, la pieza más visible de la identidad, pero solo una pieza.",
        feedbackWrong: "La respuesta correcta es C. Recuerda: el logo no es la marca; es una pieza de la identidad." },
      { id: "M01-3", type: "mc", text: "¿Cuál es el propósito principal de un manual de identidad?",
        options: [
          { key: "A", text: "Que la identidad se aplique siempre igual, la haga quien la haga." },
          { key: "B", text: "Decorar el espacio de trabajo del equipo." },
          { key: "C", text: "Reemplazar al diseñador." },
          { key: "D", text: "Guardar los archivos del logo." } ],
        answer: "A",
        feedbackCorrect: "Un manual convierte decisiones de diseño en reglas compartidas para que todos produzcan piezas de la misma familia.",
        feedbackWrong: "La respuesta correcta es A. El manual existe para que la identidad se aplique igual, sin importar quién diseñe." },
      { id: "M01-4", type: "mc", text: "¿Cuál de estos problemas NO resuelve un manual?",
        options: [
          { key: "A", text: "La falta de coherencia entre piezas." },
          { key: "B", text: "La lentitud por decidir todo desde cero." },
          { key: "C", text: "La pérdida de conocimiento cuando cambia el equipo." },
          { key: "D", text: "Lograr que la marca le guste a todo el mundo." } ],
        answer: "D",
        feedbackCorrect: "Correcto. Un manual da coherencia, velocidad y continuidad; los gustos personales no son su tarea.",
        feedbackWrong: "La respuesta correcta es D. Coherencia, velocidad y continuidad sí los resuelve un manual; el gusto de todos, no." },
      { id: "M01-5", type: "mc", text: "El Kit de Identidad del Área de Diseño Gráfico MIVAM es un ejemplo de…",
        options: [
          { key: "A", text: "Centro de marca digital." },
          { key: "B", text: "Kit interno." },
          { key: "C", text: "Manual completo del ministerio." },
          { key: "D", text: "Logo nuevo del área." } ],
        answer: "B",
        feedbackCorrect: "Es un kit interno: pocas páginas para el material propio del área. En piezas públicas manda la marca del ministerio.",
        feedbackWrong: "La respuesta correcta es B. Nuestro kit es un kit interno, solo para el material del área." },
      { id: "M01-6", type: "mc", text: "Una buena regla de manual debe ser…",
        options: [
          { key: "A", text: "Larga, detallada y opcional." },
          { key: "B", text: "Bonita, flexible y abierta a interpretación." },
          { key: "C", text: "Concreta, medible y justificada." },
          { key: "D", text: "Secreta, para que solo el líder la conozca." } ],
        answer: "C",
        feedbackCorrect: "Concreta (dice qué hacer), medible (se puede comprobar) y justificada (explica para qué existe).",
        feedbackWrong: "La respuesta correcta es C. Una regla útil es concreta, medible y justificada." },
      { id: "M01-7", type: "mc", text: "Según nuestro kit, ¿cuántos pares de color se usan en una misma pieza?",
        options: [
          { key: "A", text: "Uno." },
          { key: "B", text: "Dos." },
          { key: "C", text: "Todos los que hagan falta." },
          { key: "D", text: "Ninguno: solo blanco y negro." } ],
        answer: "A",
        feedbackCorrect: "Un par por pieza, y la tinta siempre va sobre su propio fondo.",
        feedbackWrong: "La respuesta correcta es A. La regla del kit es un solo par de color por pieza." },
      { id: "M01-8", type: "mc", text: "Si tapas el logo de una marca y aún la reconoces, es porque…",
        options: [
          { key: "A", text: "Tienes muy buena memoria." },
          { key: "B", text: "La marca es muy antigua." },
          { key: "C", text: "El logo es muy grande." },
          { key: "D", text: "Su identidad es coherente: color, tipografía, imágenes y tono se repiten." } ],
        answer: "D",
        feedbackCorrect: "Eso es la coherencia: un sistema de elementos que se repiten siempre igual.",
        feedbackWrong: "La respuesta correcta es D. Lo que reconoces es el sistema completo, no solo el logo." }
    ],
    practica: {
      key: "M01-logo",
      titulo: "Test del logo tapado",
      instrucciones: "En pareja, elijan una marca conocida (bebida, comida, app o tienda; no de iglesias o ministerios) y descubran las reglas que sigue sin que nadie las vea escritas.",
      campos: [
        { id: "marca", label: "Marca elegida", tipo: "texto", proyectar: true },
        { id: "aplicaciones", label: "Paso 1 · Cinco aplicaciones (tipo de pieza y dónde la vieron)", tipo: "lista", filas: 5, ayuda: "Ej.: post de Instagram · cuenta oficial" },
        { id: "colores", label: "Paso 2 · Colores", tipo: "observacion" },
        { id: "tipografia", label: "Paso 2 · Tipografía", tipo: "observacion" },
        { id: "imagenes", label: "Paso 2 · Imágenes o fotografía", tipo: "observacion" },
        { id: "elementos", label: "Paso 2 · Elementos gráficos", tipo: "observacion" },
        { id: "tono", label: "Paso 2 · Tono de los textos", tipo: "observacion" },
        { id: "tapado", label: "Paso 3 · Con el logo tapado, ¿se reconoce? ¿Por qué?", tipo: "parrafo", proyectar: "Con el logo tapado" },
        { id: "regla", label: "Paso 4 · Una regla que seguro está en su manual", tipo: "parrafo", ayuda: "Concreta, medible y justificada.", proyectar: "Su regla" }
      ]
    }
  });
})();
