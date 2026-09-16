/* ============================================================
   PALABRAS ASOCIADAS PARA EL BUSCADOR  (16/09/2026, pedido suyo)
   ------------------------------------------------------------
   El buscador ya encuentra por nombre, resumen, materiales y
   acabados. Esto le añade ASOCIACIONES: quien escribe «oficina» o
   «escritorio» debe ver las bases de laptop, aunque esas palabras no
   salgan en la ficha.

   Dos partes:
   - `piezas`: palabras extra por `slug`, tanto de Exhibición
     (datos/trabajos.js) como de Prototipos (datos/prototipos.js).
     Si un slug está en los dos archivos (p. ej. gancho-pared), las
     palabras valen para los dos. Una pieza sin publicar no sale
     aunque tenga palabras aquí.
   - `secciones`: resultados que llevan a una parte de una página
     (El taller, Contacto), con su título en los dos idiomas.

   Las palabras se escriben tal cual, con tildes o sin ellas: el
   buscador quita tildes y mayúsculas antes de comparar. Van en
   español (con el uso venezolano) y en inglés. Para añadir una,
   basta con escribirla dentro de la cadena, separada por espacios.
   ============================================================ */
window.BUSQUEDA = {

  piezas: {
    /* ---------- Prototipos ---------- */
    "base-laptop-alta": "oficina escritorio trabajo home office teletrabajo remoto computadora computador laptop portátil notebook pantalla monitor ergonomía ergonómico postura espalda cuello cervical altura ojos elevador soporte atril estudio estudiante universidad escribir teclado office desk work computer stand riser ergonomic posture",
    "base-laptop-baja": "oficina escritorio trabajo home office teletrabajo remoto computadora computador laptop portátil notebook pantalla ergonomía ergonómico postura inclinación ventilación calor enfriar aire soporte elevador estudio estudiante universidad teclado office desk work computer stand riser ergonomic cooling",
    "tabla-picar": "cocina cocinar cortar picar rebanar cuchillo chef parrilla asado carne vegetales verduras pan queso charcutería picada tabla servir regalo hogar kitchen cutting board chopping board cheese board serving gift",
    "butcher-block-l": "cocina cocinar cortar picar cuchillo chef carnicero carnicería parrilla asado carne tabla gruesa testa veta vertical end grain profesional regalo kitchen butcher block cutting board chopping chef gift",
    "butcher-block-xl": "cocina cocinar cortar picar cuchillo chef carnicero carnicería parrilla asado carne tabla grande gruesa testa end grain profesional kitchen butcher block cutting board chopping",
    "comedero-pequeno": "mascota mascotas gato gatos gatito perro perros perrito cachorro comida agua plato platos tazón bebedero alimentación postura veterinario pet pets cat dog feeder bowl food water raised",
    "comedero-grande": "mascota mascotas perro perros perrote raza grande comida agua plato tazón bebedero alimentación postura veterinario pet pets dog big large feeder bowl food water raised",
    "gancho-pared": "colgar colgador perchero percha ropa chaqueta abrigo bolso cartera llaves sombrero gorra toalla entrada recibidor pared organizar organización hook hanger coat rack wall entryway",
    "tumbona": "exterior jardín terraza patio piscina playa sol broncear descanso descansar acostarse reposera silla de playa camastro chaise longue relax exterior outdoor garden pool beach sun lounger deckchair",
    "banquito": "asiento sentarse silla taburete banco escalón escalera alcanzar mesa auxiliar mesita niños sala stool seat bench step side table",
    "utensilios": "cocina cocinar cuchara cucharón paleta espátula volteador revolver servir palita regalo juego set kitchen utensils spoon spatula cooking serving gift",
    "lampara": "luz iluminación alumbrar bombillo foco velador mesa de noche cuarto habitación sala ambiente decoración lamp light lighting bedside decor",
    "bases-foto": "fotografía foto fotos fotógrafo producto bodegón estudio exhibir exhibición mostrar vitrina pedestal podio soporte emprendimiento tienda instagram photo photography product display stand prop pedestal",
    "repisa-bano": "baño ducha poceta lavamanos jabón champú cosméticos organizar organización estante repisa pared bathroom shower shelf wall storage",
    "espejo-bano": "baño lavamanos tocador peinadora maquillaje afeitarse reflejo vestir espejo pared bathroom mirror vanity wall",
    "toallero-bano": "baño ducha toalla toallas colgar secar pared bathroom towel rack towel bar hanging",
    "porta-rollo-bano": "baño poceta inodoro wc papel higiénico papel toilet rollo pared bathroom toilet paper holder roll",

    /* ---------- Exhibición ---------- */
    "rolitronco": "exterior jardín fogata fuego fogón campamento camping asiento banco taburete mesa auxiliar pedestal tronco rústico quemado shou sugi ban yakisugi outdoor campfire stool log burnt",
    "rolo-orfebre": "joyería joyero orfebre orfebrería plata oro martillo yunque taller banco tronco jewelry jeweler silversmith anvil log workshop",
    "repicero-exhibicion": "tienda vitrina exhibidor exhibición estantería estante repisas biblioteca libros negocio comercio store display shelving shelves bookcase retail",
    "mesa-cubo-ceramica": "mesa auxiliar mesita sala mosaico cerámica azulejo baldosa cubo decoración side table tile mosaic",
    "quillas-pared": "repisa repisas estante pared flotante flotantes libros plantas decoración sala cuarto shelf shelves wall floating decor",
    "mueble-bano": "baño lavamanos lavabo vanitorio vanitario gabinete gavetas cajones mueble bajo lavamanos laca lacado bathroom vanity cabinet sink lacquered",
    "gavetero": "gavetas cajones cómoda almacenaje guardar ropa cuarto habitación organizar drawers dresser chest storage bedroom",
    "zapatera": "zapatos calzado zapatillas tenis guardar organizar entrada recibidor closet clóset estante shoe rack shoes storage entryway",
    "zapatera-teca": "zapatos calzado zapatillas tenis guardar organizar entrada recibidor closet clóset estante shoe rack shoes storage entryway teak",
    "consola-2": "consola aparador credenza mueble de tv televisión televisor sala retro vintage años 60 sesenta mid century modern sideboard tv stand living room",
    "repisas": "repisa repisas estante estantería pared removibles ajustables libros plantas cocina sala shelf shelves removable adjustable wall",
    "paraban": "biombo separador divisor dividir ambientes privacidad vestidor cambiarse hippie bohemio tela plegable room divider folding screen privacy",
    "caja": "reloj relojes joyero joyas estuche caja colección coleccionista guardar regalo watch box watches jewelry case collector gift",
    "madriguera": "conejo conejos mascota mascotas casita refugio jaula corral roedor cobayo cuyo hámster rabbit bunny pet house hutch hideout",
    "escenografia": "teatro obra escenario escena escenografía festival utilería set producción cine cultura trasnocho stage theatre theater set design props play",
    "elevacho": "impresión 3d impresora 3d diseño colaboración elevador soporte plataforma 3d printing collaboration riser",
    "bandeja": "servir servicio desayuno cama café té bebidas vasos llevar cocina bandeja tray serving breakfast coffee",
    "escritorio-teca": "escritorio oficina trabajo estudio home office teletrabajo computadora mesa de trabajo desk office work study table teak",
    "cuadro-tallado": "cuadro arte tallado talla escultura relieve decoración pared colgar regalo carving carved art wall decor relief",
    "anillos": "anillo anillos sortija joyería joya matrimonio boda compromiso regalo madera ring rings jewelry wedding engagement wooden gift",
    "plataforma-macetas": "macetero maceta matero materos plantas planta jardín jardinería terraza balcón base pedestal soporte colaboración planter plant stand garden pot",
    "puertas-closet": "puerta puertas closet clóset armario guardarropa escaparate cuarto habitación doors wardrobe closet bedroom",
    "set-de-utensilios": "cocina cocinar cuchara cucharón paleta espátula volteador servir juego set regalo kitchen utensils spoon spatula cooking gift",
    "mueble-espejo": "baño espejo gabinete botiquín lavamanos guardar bathroom mirror cabinet medicine cabinet storage",
    "rampa": "rampa acceso subir bajar mascota perro silla de ruedas accesibilidad desnivel escalón ramp access accessibility wheelchair pet",
    "meson-trabajo": "mesón mesa de trabajo patronaje costura corte tela diseño de modas taller confección workbench sewing pattern making cutting table",
    "banco-de-trabajo": "banco de trabajo mesa de trabajo taller herramientas carpintería workbench workshop tools"
  },

  secciones: [
    /* ---------- El taller ---------- */
    { url: "taller.html#introduccion",
      titulo: { es: "Quién hace las piezas", en: "Who makes the pieces" },
      donde: { es: "El taller", en: "The workshop" },
      palabras: "quién soy sobre mí acerca de historia santiago carpintero carpintería economista autodidacta youtube fracaso prototipo aprender caracas venezuela about me who story woodworker carpenter self-taught" },
    { url: "taller.html#encargo",
      titulo: { es: "Cómo funciona un encargo", en: "How a commission works" },
      donde: { es: "El taller", en: "The workshop" },
      palabras: "encargo encargar pedido a medida personalizado personalizar hecho a medida proceso pasos cómo pedir cotizar cotización presupuesto idea medidas referencia foto dibujo diseño anticipo arranque avances seguimiento entrega plazo tiempo cuánto tarda semanas custom made to measure commission process steps quote order how it works delivery deposit" },
    { url: "taller.html#encargo",
      titulo: { es: "Me escribes con la idea", en: "You write me with the idea" },
      donde: { es: "El taller · Cómo funciona un encargo", en: "The workshop · How a commission works" },
      palabras: "idea escribir contactar mensaje whatsapp foto referencia inspiración espacio medidas aproximadas empezar primer paso write idea reference photo first step" },
    { url: "taller.html#encargo",
      titulo: { es: "Lo dibujo", en: "I draw it" },
      donde: { es: "El taller · Cómo funciona un encargo", en: "The workshop · How a commission works" },
      palabras: "dibujo diseño modelo 3d sketchup render plano boceto maqueta visualizar ver antes drawing design 3d model sketch render" },
    { url: "taller.html#encargo",
      titulo: { es: "Presupuesto claro", en: "A clear quote" },
      donde: { es: "El taller · Cómo funciona un encargo", en: "The workshop · How a commission works" },
      palabras: "presupuesto cotización cotizar precio costo cuánto cuesta valor tarifa quote price cost estimate how much" },
    { url: "taller.html#encargo",
      titulo: { es: "Anticipo y arranque", en: "Deposit and start" },
      donde: { es: "El taller · Cómo funciona un encargo", en: "The workshop · How a commission works" },
      palabras: "anticipo adelanto inicial abono cincuenta por ciento 50% mitad arrancar empezar fabricación deposit advance down payment half start" },
    { url: "taller.html#encargo",
      titulo: { es: "Te voy contando", en: "I keep you posted" },
      donde: { es: "El taller · Cómo funciona un encargo", en: "The workshop · How a commission works" },
      palabras: "avances progreso fotos videos seguimiento actualizaciones noticias cómo va progress updates photos follow up" },
    { url: "taller.html#encargo",
      titulo: { es: "Entrega", en: "Delivery" },
      donde: { es: "El taller · Cómo funciona un encargo", en: "The workshop · How a commission works" },
      palabras: "entrega envío enviar despacho traslado instalación instalar montaje recoger retirar flete transporte delivery shipping installation pickup transport" },
    { url: "taller.html#propuesta",
      titulo: { es: "Cómo se arma una propuesta", en: "How a proposal is put together" },
      donde: { es: "El taller", en: "The workshop" },
      palabras: "propuesta pdf documento cotización presupuesto ejemplo qué recibo formato hoja proposal document quote example what you get" },
    { url: "taller.html#propuesta",
      titulo: { es: "Una sola cifra", en: "One single figure" },
      donde: { es: "El taller · Cómo se arma una propuesta", en: "The workshop · How a proposal is put together" },
      palabras: "precio total monto cifra rango mano de obra materiales cuánto cuesta bolívares dólares ref bcv price total amount range how much" },
    { url: "taller.html#propuesta",
      titulo: { es: "Cómo pagar", en: "How to pay" },
      donde: { es: "El taller · Cómo se arma una propuesta", en: "The workshop · How a proposal is put together" },
      palabras: "pago pagar métodos formas de pago pago móvil transferencia zelle usdt binance efectivo dólares bolívares divisas cuenta bancaria payment pay methods transfer cash dollars" },
    { url: "taller.html#propuesta",
      titulo: { es: "Plazo y anticipo", en: "Lead time and deposit" },
      donde: { es: "El taller · Cómo se arma una propuesta", en: "The workshop · How a proposal is put together" },
      palabras: "plazo tiempo tarda cuánto tarda semanas fecha anticipo adelanto 50/50 contra entrega cuotas lead time how long weeks deposit" },
    { url: "taller.html#propuesta",
      titulo: { es: "La pieza antes de que exista", en: "The piece before it exists" },
      donde: { es: "El taller · Cómo se arma una propuesta", en: "The workshop · How a proposal is put together" },
      palabras: "isométrico dibujo plano medidas cotas dimensiones ancho fondo alto modelo 3d vista isometric drawing dimensions measurements width depth height" },
    { url: "taller.html#propuesta",
      titulo: { es: "Qué incluye", en: "What's included" },
      donde: { es: "El taller · Cómo se arma una propuesta", en: "The workshop · How a proposal is put together" },
      palabras: "incluye incluido detalle madera espesores acabado herrajes bisagras correderas tornillos piezas included details hardware hinges finish" },
    { url: "taller.html#propuesta",
      titulo: { es: "Consideraciones", en: "Things to consider" },
      donde: { es: "El taller · Cómo se arma una propuesta", en: "The workshop · How a proposal is put together" },
      palabras: "consideraciones validez vigencia hasta cuándo vale el precio ajustes cambios condiciones garantía traslado cómo viaja considerations validity conditions changes warranty" },
    { url: "taller.html#propuesta",
      titulo: { es: "El ambiente", en: "The mood" },
      donde: { es: "El taller · Cómo se arma una propuesta", en: "The workshop · How a proposal is put together" },
      palabras: "ambiente referencia inspiración ilustración imagen inteligencia artificial ia render estilo mood reference illustration ai style" },
    { url: "taller.html#materiales",
      titulo: { es: "Con qué trabajo", en: "What I work with" },
      donde: { es: "El taller", en: "The workshop" },
      palabras: "materiales material madera sólida maciza aglomerados contraenchapado triplex compuestos mdf melamina metal metales hierro aluminio soldadura herrería pintura barniz laca poliuretano aceite linaza sellado crudo acabados materials wood plywood melamine metal welding paint varnish lacquer finish" },
    { url: "taller.html#maderas",
      titulo: { es: "Las maderas", en: "The woods" },
      donde: { es: "El taller", en: "The workshop" },
      palabras: "maderas madera especies tipos de madera muestras colores vetas tropicales nacionales woods wood species timber samples grain" },

    /* Las maderas, una por una: nombre común, científico, en inglés y
       rasgos por los que alguien la buscaría. */
    { url: "taller.html#maderas", titulo: { es: "Pino", en: "Pine" }, donde: { es: "El taller · Las maderas", en: "The workshop · The woods" },
      palabras: "pino caribe pinus caribaea claro amarillo económico blando estructuras pine caribbean light soft" },
    { url: "taller.html#maderas", titulo: { es: "Samán", en: "Monkeypod" }, donde: { es: "El taller · Las maderas", en: "The workshop · The woods" },
      palabras: "saman samanea saman parota veteado marrón dorado mesas monkeypod rain tree suar" },
    { url: "taller.html#maderas", titulo: { es: "Apamate", en: "Apamate" }, donde: { es: "El taller · Las maderas", en: "The workshop · The woods" },
      palabras: "apamate tabebuia rosea roble venezolano rosado claro pink poui" },
    { url: "taller.html#maderas", titulo: { es: "Cedro", en: "Spanish cedar" }, donde: { es: "El taller · Las maderas", en: "The workshop · The woods" },
      palabras: "cedro amargo cedrela odorata aromático olor rojizo puertas closet spanish cedar red cedar aromatic" },
    { url: "taller.html#maderas", titulo: { es: "Caoba", en: "Mahogany" }, donde: { es: "El taller · Las maderas", en: "The workshop · The woods" },
      palabras: "caoba swietenia macrophylla rojiza fina noble muebles finos mahogany" },
    { url: "taller.html#maderas", titulo: { es: "Aurora", en: "Aurora" }, donde: { es: "El taller · Las maderas", en: "The workshop · The woods" },
      palabras: "aurora mureillo erisma uncinatum cambara rosada" },
    { url: "taller.html#maderas", titulo: { es: "Puy", en: "Ipê" }, donde: { es: "El taller · Las maderas", en: "The workshop · The woods" },
      palabras: "puy pui tabebuia serratifolia ipe ipê lapacho dura pesada exterior resistente ironwood" },
    { url: "taller.html#maderas", titulo: { es: "Teca", en: "Teak" }, donde: { es: "El taller · Las maderas", en: "The workshop · The woods" },
      palabras: "teca tectona grandis dorada aceitosa exterior agua humedad resistente teak outdoor" },
    { url: "taller.html#maderas", titulo: { es: "Algarrobo", en: "Jatoba" }, donde: { es: "El taller · Las maderas", en: "The workshop · The woods" },
      palabras: "algarrobo hymenaea courbaril rojiza dura pesada cocina jatoba brazilian cherry" },
    { url: "taller.html#maderas", titulo: { es: "Nazareno", en: "Purpleheart" }, donde: { es: "El taller · Las maderas", en: "The workshop · The woods" },
      palabras: "nazareno peltogyne morado púrpura violeta purpleheart purple amaranth" },
    { url: "taller.html#maderas", titulo: { es: "Melina", en: "Gmelina" }, donde: { es: "El taller · Las maderas", en: "The workshop · The woods" },
      palabras: "melina gmelina arborea clara liviana económica gmelina white teak" },

    /* ---------- Contacto ---------- */
    { url: "contacto.html",
      titulo: { es: "Contacto", en: "Contact" },
      donde: { es: "Escríbeme", en: "Get in touch" },
      palabras: "contacto contactar escribir escríbeme hablar mensaje whatsapp instagram teléfono número celular correo dm redes sociales preguntar consulta dudas cotizar pedir encargo dirección caracas contact message phone call email social ask" }
  ]
};
