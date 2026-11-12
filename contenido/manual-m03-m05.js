/* Curso «De la marca al manual» · Módulos 03, 04 y 05 (quiz + práctica de cada uno)
   M03 · Leer y aplicar un manual ····· sáb 7 nov 2026 · práctica M03-revision
   M04 · El proceso de creación ······· sáb 14 nov 2026 · 11:00 a. m. · práctica M04-ruta
   M05 · Diseñar el sistema ··········· sáb 21 nov 2026 · 9:00 a. m. · práctica M05-sistema
   Se carga en index.html después de manual-m02.js. Reemplaza a manual-m03.js (no cargar los dos).
   Si alguna clave ya existe en el curso, no se duplica. */
window.CURSOS = window.CURSOS || [];
(function () {
  var curso = window.CURSOS.find(function (c) { return c.id === "manual"; });
  if (!curso) {
    curso = { id: "manual", titulo: "De la marca al manual", descripcion: "Curso de 6 módulos sobre manuales de identidad. Se toma después del programa de Photoshop.", sesiones: [] };
    window.CURSOS.push(curso);
  }

  var M03 = {
    key: "M03-manual",
    etiqueta: "Módulo 03",
    title: "Leer y aplicar un manual",
    fase: "FASE 1",
    mode: "Presencial",
    desc: "Consultar un manual, revisar piezas con el checklist de marca y corregir con la regla en la mano. Aprueba con 6 de 8.",
    aprobar: 75,
    criterio: "aprobacion",
    questions: [
      { id: "M03-1", type: "mc", text: "Necesitas el color de un banner de capacitación. ¿Qué haces primero?",
        options: [
          { key: "A", text: "Elegir el naranja que mejor se vea en pantalla." },
          { key: "B", text: "Buscar la sección de color del kit y copiar el código exacto." },
          { key: "C", text: "Preguntar a un compañero qué usó la vez pasada." },
          { key: "D", text: "Usar el color del último carrusel del domingo." } ],
        answer: "B",
        feedbackCorrect: "Un manual se consulta: vas a la sección y copias el dato exacto (par Naranja, #FFC79A y #7A3410).",
        feedbackWrong: "La respuesta correcta es B. Nunca «a ojo»: busca la sección y copia el código exacto." },
      { id: "M03-2", type: "mc", text: "Según el checklist de marca, ¿qué revisas primero en cualquier pieza?",
        options: [
          { key: "A", text: "Si usa la identidad correcta: kit para lo interno, marca del ministerio para lo público." },
          { key: "B", text: "Si el nombre del archivo es correcto." },
          { key: "C", text: "Cuántos destellos tiene." },
          { key: "D", text: "Si la letra se ve moderna." } ],
        answer: "A",
        feedbackCorrect: "El alcance va primero: si la pieza usa la identidad equivocada, no vale la pena revisar el resto.",
        feedbackWrong: "La respuesta correcta es A. El punto 1 del checklist es el alcance." },
      { id: "M03-3", type: "mc", text: "En una pieza, una carita aparece con la piel coloreada. ¿Qué regla rompe?",
        options: [
          { key: "A", text: "La de tamaño mínimo." },
          { key: "B", text: "La de jerarquía tipográfica." },
          { key: "C", text: "La piel de las caritas siempre queda en trama gris; el color va detrás." },
          { key: "D", text: "Ninguna: las caritas se pueden pintar libremente." } ],
        answer: "C",
        feedbackCorrect: "Las caritas tienen estilo fijo: el color del frente va detrás, nunca dentro (kit pág. 08).",
        feedbackWrong: "La respuesta correcta es C. La piel siempre queda en trama gris (kit pág. 08)." },
      { id: "M03-4", type: "mc", text: "Un banner tiene fondo Rosa y el texto en tinta Verde. ¿Qué está mal?",
        options: [
          { key: "A", text: "El texto debería ir más grande." },
          { key: "B", text: "Falta un degradado entre los dos colores." },
          { key: "C", text: "Nada, mientras se lea." },
          { key: "D", text: "Mezcla el fondo y la tinta de pares distintos." } ],
        answer: "D",
        feedbackCorrect: "Un par por pieza: cada tinta va sobre su propio fondo (kit págs. 06 y 12).",
        feedbackWrong: "La respuesta correcta es D. No se mezclan fondo y tinta de pares distintos." },
      { id: "M03-5", type: "mc", text: "Tienes que hacer una pieza que el manual no menciona. ¿Qué es lo correcto?",
        options: [
          { key: "A", text: "Hacerla como te guste: si no está escrito, está permitido." },
          { key: "B", text: "Buscar una aplicación parecida y consultar al líder con una propuesta antes de entregar." },
          { key: "C", text: "No hacerla hasta que salga una nueva versión del kit." },
          { key: "D", text: "Copiar el estilo de otra iglesia." } ],
        answer: "B",
        feedbackCorrect: "Preguntar, no inventar: se busca lo parecido y se consulta con una propuesta lista.",
        feedbackWrong: "La respuesta correcta es B. Ante la duda se pregunta, con una propuesta, antes de entregar." },
      { id: "M03-6", type: "mc", text: "¿Cuál es la mejor forma de dar una corrección?",
        options: [
          { key: "A", text: "«Eso se ve feo, cámbialo»." },
          { key: "B", text: "Corregir la pieza sin decirle nada a quien la hizo." },
          { key: "C", text: "«El subtítulo está en serif y el kit (pág. 07) dice Riking o Poppins. Propongo Poppins SemiBold»." },
          { key: "D", text: "«Yo lo habría hecho diferente»." } ],
        answer: "C",
        feedbackCorrect: "Así: qué pasa, la regla con su página y una propuesta. Habla de la pieza, no de la persona.",
        feedbackWrong: "La respuesta correcta es C. Una corrección cita la regla y propone cómo arreglarlo." },
      { id: "M03-7", type: "mc", text: "Te entregan una portada de Notion en 1080 × 1080 PNG. Según la ficha técnica del kit, ¿cómo debería ser?",
        options: [
          { key: "A", text: "2880 × 1800 px, JPG, con nombre portada_[página].jpg." },
          { key: "B", text: "1080 × 1080 px, PNG; está bien así." },
          { key: "C", text: "6000 × 2000 px, JPG." },
          { key: "D", text: "Carta vertical, PDF." } ],
        answer: "A",
        feedbackCorrect: "Punto 7 del checklist: tamaño, formato y nombre según la ficha técnica (kit pág. 13).",
        feedbackWrong: "La respuesta correcta es A. 6000 × 2000 es el banner de categoría; carta vertical es el documento interno." },
      { id: "M03-8", type: "mc", text: "Recibes una corrección basada en una regla que no conocías. ¿Qué haces?",
        options: [
          { key: "A", text: "Defender tu diseño: era una decisión creativa." },
          { key: "B", text: "Ignorarla si la pieza ya se publicó." },
          { key: "C", text: "Pedir que te la corrija otra persona." },
          { key: "D", text: "Preguntar dónde está la regla, corregir y agradecer." } ],
        answer: "D",
        feedbackCorrect: "Corregir es parte del oficio, no algo personal: se aprende la regla y se aplica.",
        feedbackWrong: "La respuesta correcta es D. Escucha, pregunta dónde está la regla, corrige y agradece." }
    ],
    practica: {
      key: "M03-revision",
      titulo: "Revisión de marca",
      instrucciones: "En pareja, revisen con el checklist la pieza 2 (banner Briefing) y la pieza 3 (portada Nuestro equipo) que están en el grupo. Para cada error escriban: qué pasa · punto del checklist · regla y página del kit. Al final, corrijan un error con la fórmula.",
      campos: [
        { id: "p2-errores", label: "A · Pieza 2 · Errores encontrados", tipo: "lista", filas: 3, ayuda: "Ej.: Párrafo en Riking · 3 Tipografía · Riking solo en titulares · pág. 07", proyectar: true },
        { id: "p3-errores", label: "B · Pieza 3 · Errores encontrados", tipo: "lista", filas: 3, ayuda: "Recuerden revisar también el archivo: tamaño, formato y nombre.", proyectar: true },
        { id: "correccion", label: "C · Corrección con la fórmula", tipo: "parrafo", ayuda: "«Esta pieza [qué pasa] y el kit dice [regla, pág.]. Propongo [corrección].»", proyectar: true }
      ]
    }
  };

  var M04 = {
    key: "M04-manual",
    etiqueta: "Módulo 04",
    title: "El proceso de creación",
    fase: "FASE 2",
    mode: "Presencial",
    desc: "Del brief a la plataforma de marca y al nombre del Proyecto Café. Aprueba con 6 de 8.",
    aprobar: 75,
    criterio: "aprobacion",
    questions: [
      { id: "M04-1", type: "mc", text: "¿Qué es un brief?",
        options: [
          { key: "A", text: "El primer boceto del logo." },
          { key: "B", text: "El encargo por escrito: objetivo, públicos, contexto, entregables, restricciones y fechas." },
          { key: "C", text: "La lista de colores de la marca." },
          { key: "D", text: "El contrato de pago con el cliente." } ],
        answer: "B",
        feedbackCorrect: "Un brief reúne todo lo que hay que saber antes de diseñar. Lo que falta se pregunta.",
        feedbackWrong: "La respuesta correcta es B. El brief es el encargo completo por escrito, antes de cualquier boceto." },
      { id: "M04-2", type: "mc", text: "¿Cuál es el orden correcto para crear una marca?",
        options: [
          { key: "A", text: "Logo, colores, nombre y brief." },
          { key: "B", text: "Nombre, logo, públicos y plataforma." },
          { key: "C", text: "Plataforma, logo, brief y públicos." },
          { key: "D", text: "Brief, investigación, públicos, plataforma, nombre y después el sistema." } ],
        answer: "D",
        feedbackCorrect: "Primero se piensa y después se dibuja: la estrategia va antes del logo.",
        feedbackWrong: "La respuesta correcta es D. Saltar del brief al logo hace que el diseño se elija por gusto." },
      { id: "M04-3", type: "mc", text: "¿Qué define el propósito de una marca?",
        options: [
          { key: "A", text: "Por qué existe, más allá de lo que vende." },
          { key: "B", text: "Cuánto cuestan sus productos." },
          { key: "C", text: "Los colores que usa." },
          { key: "D", text: "A qué hora abre." } ],
        answer: "A",
        feedbackCorrect: "El propósito responde «¿y eso para qué?» hasta llegar a algo humano.",
        feedbackWrong: "La respuesta correcta es A. El propósito es la razón de existir, no el producto." },
      { id: "M04-4", type: "mc", text: "«Es cálido, pero no empalagoso». ¿A qué parte de la plataforma pertenece?",
        options: [
          { key: "A", text: "Propósito." },
          { key: "B", text: "Promesa." },
          { key: "C", text: "Personalidad." },
          { key: "D", text: "Públicos." } ],
        answer: "C",
        feedbackCorrect: "La personalidad se escribe en pares «es… pero no es…» para evitar extremos.",
        feedbackWrong: "La respuesta correcta es C. Es la personalidad: cómo sería la marca si fuera una persona." },
      { id: "M04-5", type: "mc", text: "El café quiere atraer a vecinos que no van a la iglesia. ¿Qué conviene en el nombre?",
        options: [
          { key: "A", text: "Usar un versículo completo." },
          { key: "B", text: "Evitar palabras que solo entienden los de adentro." },
          { key: "C", text: "Usar el nombre de la iglesia." },
          { key: "D", text: "Que sea en inglés para que suene moderno." } ],
        answer: "B",
        feedbackCorrect: "El vecino es el público clave: el nombre debe invitarlo, no dejarlo fuera.",
        feedbackWrong: "La respuesta correcta es B. Lenguaje de iglesia en el nombre aleja a quien no va a la iglesia." },
      { id: "M04-6", type: "mc", text: "El brief pide que el logo funcione en un sello de 3 cm a 1 tinta. ¿Qué implica?",
        options: [
          { key: "A", text: "Que debe verse bien pequeño y en un solo color, sin degradados ni detalles finos." },
          { key: "B", text: "Que debe tener muchos colores." },
          { key: "C", text: "Nada: el sello es aparte del logo." },
          { key: "D", text: "Que debe llevar una foto." } ],
        answer: "A",
        feedbackCorrect: "Las restricciones se piensan desde el nombre: un nombre larguísimo no cabe en 3 cm.",
        feedbackWrong: "La respuesta correcta es A. El sello exige un logo simple, legible pequeño y a una tinta." },
      { id: "M04-7", type: "mc", text: "Tres equipos proponen tres nombres. ¿Cómo se elige?",
        options: [
          { key: "A", text: "Gana el del líder." },
          { key: "B", text: "Gana el más largo." },
          { key: "C", text: "Se sortea." },
          { key: "D", text: "Con criterios acordados desde el brief." } ],
        answer: "D",
        feedbackCorrect: "Se vota por criterios, no por gustos, y cada voto vale lo mismo.",
        feedbackWrong: "La respuesta correcta es D. Los criterios salen del brief: así la decisión se puede defender." },
      { id: "M04-8", type: "mc", text: "Tu ruta no ganó la votación. ¿Qué haces?",
        options: [
          { key: "A", text: "Sigues diseñando la tuya aparte." },
          { key: "B", text: "Dejas de participar." },
          { key: "C", text: "Apoyas la ruta ganadora y aportas lo mejor de la tuya." },
          { key: "D", text: "Pides repetir la votación." } ],
        answer: "C",
        feedbackCorrect: "Defender ideas, no egos: cuando se elige, todos reman para la misma marca.",
        feedbackWrong: "La respuesta correcta es C. La ruta ganadora es de todo el equipo." }
    ],
    practica: {
      key: "M04-ruta",
      titulo: "Ruta creativa del Proyecto Café",
      instrucciones: "Una persona por equipo carga la ruta al final de la práctica, con lo que quedó en la plantilla de plataforma. Escriban frases cortas: se proyectan para todo el grupo.",
      campos: [
        { id: "nombre", label: "Nombre propuesto", tipo: "texto", ayuda: "Máximo 2 palabras.", proyectar: true },
        { id: "concepto", label: "Concepto en una frase", tipo: "texto", ayuda: "Ej.: «la mesa larga donde cabe uno más».", proyectar: true },
        { id: "proposito", label: "Propósito", tipo: "parrafo", ayuda: "¿Para qué existe el café, más allá de vender café?", proyectar: true },
        { id: "valores", label: "Valores y cómo se notan", tipo: "lista", filas: 3, ayuda: "Valor · cómo se nota dentro del café" },
        { id: "personalidad", label: "Personalidad", tipo: "lista", filas: 3, ayuda: "Es… pero no es…", proyectar: true },
        { id: "promesa", label: "Promesa", tipo: "texto", ayuda: "Lo que el café garantiza a cada visitante." },
        { id: "tono", label: "Tono de voz: saludo en Instagram", tipo: "texto", ayuda: "Escriban el saludo tal como lo publicarían." },
        { id: "por-que", label: "Por qué este nombre", tipo: "parrafo", ayuda: "Tipo de nombre, criterio que mejor cumple y su riesgo.", proyectar: true }
      ]
    }
  };

  var M05 = {
    key: "M05-manual",
    etiqueta: "Módulo 05",
    title: "Diseñar el sistema",
    fase: "FASE 2",
    mode: "Presencial",
    desc: "Logo, color, tipografía, elementos y fotografía del Proyecto Café, probados con las restricciones del brief. Aprueba con 6 de 8.",
    aprobar: 75,
    criterio: "aprobacion",
    questions: [
      { id: "M05-1", type: "mc", text: "¿Por qué el área de respeto se mide con una unidad X tomada del propio logo?",
        options: [
          { key: "A", text: "Porque así lo exige la imprenta." },
          { key: "B", text: "Porque crece y se achica junto con el logo." },
          { key: "C", text: "Porque siempre mide 1 cm." },
          { key: "D", text: "Porque es más rápido medir a ojo." } ],
        answer: "B",
        feedbackCorrect: "Una medida del propio logo mantiene la proporción a cualquier tamaño.",
        feedbackWrong: "La respuesta correcta es B. La unidad X escala con el logo; una medida fija no." },
      { id: "M05-2", type: "mc", text: "¿Qué versión del logo va en el perfil de Instagram de 110 px?",
        options: [
          { key: "A", text: "El isotipo." },
          { key: "B", text: "La versión principal con el nombre completo." },
          { key: "C", text: "El logo con la firma de la iglesia." },
          { key: "D", text: "Una foto del local." } ],
        answer: "A",
        feedbackCorrect: "En espacios pequeños va la versión compacta: el símbolo solo.",
        feedbackWrong: "La respuesta correcta es A. A 110 px el nombre completo deja de leerse." },
      { id: "M05-3", type: "mc", text: "¿Qué significa la proporción 60-30-10?",
        options: [
          { key: "A", text: "Tres tamaños de letra." },
          { key: "B", text: "Tres versiones del logo." },
          { key: "C", text: "Los porcentajes de descuento." },
          { key: "D", text: "60 % color dominante, 30 % secundario y 10 % acento." } ],
        answer: "D",
        feedbackCorrect: "Es un punto de partida; nuestro kit, por ejemplo, usa 70-20-10.",
        feedbackWrong: "La respuesta correcta es D. Es la proporción de uso de los colores por rol." },
      { id: "M05-4", type: "mc", text: "¿Cuál es el contraste mínimo para texto normal según WCAG (nivel AA)?",
        options: [
          { key: "A", text: "2:1" },
          { key: "B", text: "3:1" },
          { key: "C", text: "4.5:1" },
          { key: "D", text: "10:1" } ],
        answer: "C",
        feedbackCorrect: "4.5:1 para texto normal y 3:1 para texto grande. El contraste se mide, no se adivina.",
        feedbackWrong: "La respuesta correcta es C. 3:1 solo vale para texto grande." },
      { id: "M05-5", type: "mc", text: "El vaso se imprime a 2 tintas. ¿Qué implica para el diseño?",
        options: [
          { key: "A", text: "Funcionar con dos colores planos, sin degradados ni fotos." },
          { key: "B", text: "Usar dos fotos." },
          { key: "C", text: "Imprimir dos veces." },
          { key: "D", text: "Nada, la imprenta lo resuelve." } ],
        answer: "A",
        feedbackCorrect: "Las restricciones no limitan el diseño: lo hacen más claro.",
        feedbackWrong: "La respuesta correcta es A. Dos tintas planas: dos colores sólidos y nada más." },
      { id: "M05-6", type: "mc", text: "Encuentras una fuente «gratis» en una web sin licencia clara. ¿Qué haces?",
        options: [
          { key: "A", text: "La usas: si es gratis, se puede." },
          { key: "B", text: "Verificas la licencia; usas una con licencia OFL o la compras." },
          { key: "C", text: "La usas solo en el logo." },
          { key: "D", text: "Le cambias el nombre." } ],
        answer: "B",
        feedbackCorrect: "Si no sabes de dónde viene una fuente, no se usa.",
        feedbackWrong: "La respuesta correcta es B. Respetamos las licencias: OFL de Google Fonts o licencia comprada." },
      { id: "M05-7", type: "mc", text: "¿Qué fotos van en las redes del café?",
        options: [
          { key: "A", text: "Personas generadas con IA, para no pedir permisos." },
          { key: "B", text: "Fotos de otros cafés." },
          { key: "C", text: "Cualquier foto de internet." },
          { key: "D", text: "Fotos reales, con permiso de quienes aparecen." } ],
        answer: "D",
        feedbackCorrect: "Regla del área: nada de personas generadas con IA presentadas como reales.",
        feedbackWrong: "La respuesta correcta es D. Fotos reales y con permiso; ni IA de personas ni fotos ajenas." },
      { id: "M05-8", type: "mc", text: "¿Qué diferencia hay entre un logo y un sistema de identidad?",
        options: [
          { key: "A", text: "Ninguna." },
          { key: "B", text: "El sistema es solo la paleta." },
          { key: "C", text: "El sistema reúne logo, color, tipografía, elementos, fotografía y sus reglas." },
          { key: "D", text: "El logo es más importante que todo lo demás." } ],
        answer: "C",
        feedbackCorrect: "Un logo no es una marca: el sistema es lo que la hace reconocible.",
        feedbackWrong: "La respuesta correcta es C. El logo es una parte del sistema, no el sistema." }
    ],
    practica: {
      key: "M05-sistema",
      titulo: "Sistema de identidad del Proyecto Café",
      instrucciones: "Una persona por equipo carga SOLO los campos de su parte (Equipo 1: logo · Equipo 2: color y tipografía · Equipo 3: elementos y foto). La prueba de estrés se llena en la integración, con todo el grupo.",
      // Textos de las filas «observacion» (prueba de estrés): el Sí/Casi/No responde si el sistema pasa la prueba.
      observacion: { pregunta: "¿Pasa la prueba?", placeholder: "Qué falla o cómo se resolvió", conteo: "· pasa la prueba" },
      campos: [
        { id: "logo-versiones", label: "Equipo 1 · Logo: versiones", tipo: "lista", filas: 4, ayuda: "Principal · isotipo · monocromo · sello: cómo es cada una.", proyectar: true },
        { id: "logo-medidas", label: "Equipo 1 · Unidad X, área de respeto y tamaño mínimo", tipo: "parrafo", ayuda: "Ej.: X = altura de la «a» · respeto 1X · mínimo 24 px y 12 mm.", proyectar: true },
        { id: "paleta", label: "Equipo 2 · Paleta: HEX, rol y %", tipo: "lista", filas: 4, ayuda: "Ej.: #1F3A5F · dominante · 60 % · tinta de imprenta 1", proyectar: true },
        { id: "contraste", label: "Equipo 2 · Contraste medido", tipo: "lista", filas: 2, ayuda: "Texto sobre fondo · ratio · para qué tamaño sirve" },
        { id: "tipografia", label: "Equipo 2 · Tipografía: familia, uso y licencia", tipo: "lista", filas: 3, ayuda: "Titulares · textos · guía de pizarra a mano", proyectar: true },
        { id: "elementos", label: "Equipo 3 · Elementos gráficos y sus reglas", tipo: "parrafo", ayuda: "Qué son, cuántos por pieza, colores y dónde no se usan.", proyectar: true },
        { id: "fotografia", label: "Equipo 3 · Estilo de fotografía", tipo: "parrafo", ayuda: "Qué se fotografía, luz, encuadre y lo que nunca se hace." },
        { id: "estres-sello", label: "Prueba · Sello de 3 cm a 1 tinta", tipo: "observacion" },
        { id: "estres-perfil", label: "Prueba · Perfil de Instagram de 110 px", tipo: "observacion" },
        { id: "estres-vaso", label: "Prueba · Vaso a 2 tintas planas", tipo: "observacion" },
        { id: "estres-bordado", label: "Prueba · Delantal bordado (4 hilos, 2 mm)", tipo: "observacion" },
        { id: "estres-pizarra", label: "Prueba · Pizarra rotulada a mano", tipo: "observacion" },
        { id: "estres-respaldo", label: "Prueba · Firma de respaldo pequeña", tipo: "observacion" }
      ]
    }
  };

  [M03, M04, M05].forEach(function (s) {
    var existe = curso.sesiones.some(function (x) { return x.key === s.key; });
    if (!existe) curso.sesiones.push(s);
  });
})();
