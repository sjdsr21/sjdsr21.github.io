/* ============================================================
   TRABAJOS — el catálogo histórico
   ------------------------------------------------------------
   Una entrada por pieza. Para que aparezca en el sitio necesita
   publicado: true. Las que están en false se ven solo cuando
   abres el sitio con ?borradores=1 al final de la dirección.

   Campos:
     slug        nombre corto sin espacios. NO lo cambies después
                 de publicar: es la dirección de la ficha.
     carpeta     de dónde salió en D:\Carpinteria\Proyectos.
                 Solo referencia interna, nunca se publica.
     titulo      lo que ve el visitante. Sin nombre de cliente.
     anio        año. Si anio_estimado es true, sale de la fecha
                 del archivo .skp y hay que confirmarlo.
     tipo        UNA clave de TEXTOS.tipo
     materiales  lista de claves de TEXTOS.material
     acabado     lista de claves de TEXTOS.acabado
     medidas     texto libre, igual en los dos idiomas
     resumen     una o dos frases. Es lo que engancha.
     como        lista de frases de construcción (sale del pitch)
     imagen      ruta a la imagen principal
     es_render   true = es vista del modelo 3D, no foto.
                 Pinta el aviso de "falta la foto".
     galeria     imágenes adicionales (opcional)
     video       ruta a un .mp4 de 10 s (opcional, aún ninguno)
   ============================================================ */

window.TRABAJOS = [

  /* ---------- CON CONTENIDO REAL ------------------------- */

  {
    slug: "rolitronco",
    carpeta: null,          /* todavía no tiene carpeta en Proyectos */
    publicado: true,
    destacado: true,
    novedad: true,          /* ← esto es lo que lo pone en el slideshow */
    titulo: { es: "Rolitronco", en: "Rolitronco" },
    anio: 2026, anio_estimado: false,
    tipo: "exterior",
    materiales: ["saman"],
    acabado: ["quemado"],
    medidas: null,
    resumen: {
      es: "Un bloque macizo quemado, para exteriores. Pensado para acompañar una fogata: sirve de asiento, de mesa auxiliar o de pedestal, y se carga de un sitio a otro por la cadena.",
      en: "A charred solid block for outdoor use. Made to sit by a fire: a seat, a side table or a pedestal, carried from place to place by its chain."
    },
    /* Texto del equipo de producción que grabó el video */
    como: {
      es: [
        "El equilibrio entre lo estético y lo funcional es uno de los ejes principales del trabajo artesanal, que constantemente se enfrenta a interrogantes y posibilidades que parecen infinitas.",
        "Del ensayo y el error, de la experiencia, de los prototipos, el artesano desarrolla su buen gusto para crear.",
        "El proyecto de Prototipo Ago busca crear piezas únicas, jugando con cada atributo de su medio, la madera, con sus texturas, tonalidades y patrones.",
        "El Rolitronco es uno más de los prototipos que reflejan la misión del proyecto, creado intencionalmente para durar en los exteriores, aportando a la función y la belleza del espacio que ofrece una fogata o simplemente el estar rodeado de naturaleza."
      ],
      en: [
        "The balance between the beautiful and the useful is one of the main axes of craft work, which constantly faces questions and possibilities that seem endless.",
        "Through trial and error, through experience, through prototypes, the maker develops the taste to create.",
        "Prototipo Ago sets out to make singular pieces, playing with every attribute of its medium — wood, with its textures, tones and patterns.",
        "The Rolitronco is one more of the prototypes that reflect the project's mission: built on purpose to last outdoors, adding to the use and the beauty of a space around a fire, or simply of being surrounded by nature."
      ]
    },
    /* la representación digital va de portada: es la que sale en
       la rejilla del portafolio */
    imagen: "img/trabajos/rolitronco-render.jpg",
    es_render: true,
    galeria: [],
    video: "video/rolitronco.mp4",
    medidas: "29 × 20 × 20 cm",

    /* Los medios de la ficha, en el orden en que se ven en la
       tira de miniaturas de la izquierda. Si una pieza no tiene
       este campo, la ficha arma la tira sola con la imagen, la
       galería y el video. */
    medios: [
      /* representación digital, hecha sin modelo: se construyó a
         partir de la foto. Ver capturar-rolitronco.html */
      { tipo: "imagen", src: "img/trabajos/rolitronco-render.jpg" },
      { tipo: "imagen", src: "img/trabajos/rolitronco.jpg" },
      { tipo: "video",  src: "video/rolitronco-corto.mp4" },
      { tipo: "video",  src: "video/rolitronco.mp4" }
    ]
  },

  {
    slug: "repicero-exhibicion",
    carpeta: "Repicero Estefania",
    publicado: true,
    destacado: true,
    titulo: { es: "Repicero de exhibición", en: "Display shelving unit" },
    anio: 2026, anio_estimado: false,
    tipo: "exhibicion",
    materiales: ["pino", "contraenchapado", "acero"],
    acabado: ["crudo", "barnizado"],
    medidas: "200 × 180 × 43 cm",
    resumen: {
      es: "Cinco repisas de dos metros sobre columnas de pino macizo, tensadas en cruz por detrás. Las del medio se suben y se bajan entre siete alturas, sin herramientas.",
      en: "Five two-metre shelves on solid pine columns, cross-braced from behind. The middle three move between seven heights, no tools needed."
    },
    como: {
      es: [
        "Dos columnas de pino macizo en listón de 4 × 4 cm, con travesaños cada 17,5 cm.",
        "Cinco repisas de dos metros de largo en contraenchapado de pino de 15 mm, de 35 cm de fondo.",
        "Tensores de guaya de acero en cruz por detrás, con sus templadores. Son los que mantienen la pieza a escuadra y sin bamboleo.",
        "Las tres repisas del medio quedan sueltas y se pueden subir o bajar entre siete alturas distintas, sin herramientas, según lo que se vaya a exhibir."
      ],
      en: [
        "Two solid pine columns in 4 × 4 cm stock, with rails every 17.5 cm.",
        "Five two-metre shelves in 15 mm pine plywood, 35 cm deep.",
        "Steel cable cross-braces at the back with turnbuckles. They're what keep the unit square and free of wobble.",
        "The middle three shelves sit loose and move between seven different heights without tools, depending on what's being displayed."
      ]
    },
    /* la vista que hiciste para la propuesta, no la miniatura del .skp */
    imagen: "img/trabajos/repicero-propuesta.jpg",
    es_render: true,
    galeria: [],
    video: null
  },

  {
    slug: "mesa-cubo-ceramica",
    carpeta: "Mesa Cubo Ceramica",
    publicado: true,
    destacado: true,
    titulo: { es: "Mesa auxiliar cubo en cerámica", en: "Ceramic-clad cube side table" },
    anio: 2026, anio_estimado: false,
    tipo: "mesa",
    materiales: ["contraenchapado", "fibrocemento", "ceramica"],
    acabado: ["sellado"],
    medidas: "43 × 43 × 42 cm",
    resumen: {
      es: "Un cubo de contraenchapado forrado en fibrocemento y enchapado a mano con ochenta piezas de cerámica, una por una.",
      en: "A plywood cube clad in fibre cement and tiled by hand with eighty ceramic pieces, one at a time."
    },
    como: {
      es: [
        "Núcleo estructural en contraenchapado de pino de 18 mm, armado como una caja cerrada. No es un cubo hueco de tabla fina: aguanta peso y no se pandea.",
        "Las cuatro caras y la tapa forradas en fibrocemento de 6 mm, que es la base sobre la que se pega la cerámica sin que trabaje ni se agriete.",
        "Cerámica pegada pieza por pieza sobre mortero y emboquillada a mano. Son 80 piezas, cada una alineada por separado."
      ],
      en: [
        "Structural core in 18 mm pine plywood, built as a closed box. Not a hollow cube of thin board: it carries weight and won't bow.",
        "All four faces and the top clad in 6 mm fibre cement, the substrate that lets the tile bond without moving or cracking.",
        "Ceramic set piece by piece in mortar and grouted by hand. Eighty pieces, each one aligned on its own."
      ]
    },
    imagen: "img/trabajos/mesa-cubo-propuesta.jpg",
    es_render: true,
    galeria: [],
    video: null
  },

  {
    slug: "quillas-pared",
    carpeta: "Quillas Mariana",
    publicado: true,
    destacado: true,
    titulo: { es: "Quillas de pared", en: "Wall-mounted board rests" },
    anio: 2026, anio_estimado: false,
    tipo: "accesorio",
    materiales: ["saman"],
    acabado: ["aceite"],
    medidas: "26 × 18,5 × 4 cm",   /* de las cotas de tu propia vista */
    resumen: {
      es: "Dos soportes tallados en samán macizo. Colgados no se ve ni un tornillo: encajan sobre ranuras keyhole fresadas en la propia madera.",
      en: "Two rests carved from solid samán. Hung on the wall not a single screw shows — they seat on keyhole slots routed into the wood itself."
    },
    como: {
      es: [
        "Dos soportes tallados en samán macizo de 4 cm de espesor, con todo el canto redondeado.",
        "Montaje invisible: cada quilla encaja sobre ranuras keyhole fresadas en la propia madera. Colgadas, no se ve ni un tornillo ni un herraje.",
        "Acabado en aceite de linaza, que realza la veta del samán y protege la madera."
      ],
      en: [
        "Two rests carved from 4 cm solid samán, every edge rounded over.",
        "Invisible mounting: each one seats on keyhole slots routed into the wood itself. Hung, no screw or bracket is visible.",
        "Linseed oil finish, which brings up the samán's grain and protects the wood."
      ]
    },
    imagen: "img/trabajos/quillas-propuesta.jpg",
    es_render: true,
    galeria: [],
    video: null
  },

  {
    slug: "meson-comedor",
    carpeta: "Meson Lacho",
    publicado: false,   /* fuera del portafolio: no le gusta el proyecto */
    destacado: false,
    titulo: { es: "Mesón de comedor", en: "Dining hall table" },
    anio: 2025, anio_estimado: true,
    tipo: "mesa",
    materiales: [],
    acabado: [],
    medidas: null,
    resumen: {
      es: "",   // ← escribe una o dos frases aquí
      en: ""
    },
    como: { es: [], en: [] },
    imagen: "img/trabajos/meson-lacho-foto.jpg",
    es_render: false,
    galeria: ["img/trabajos/meson-lacho-foto-2.jpg", "img/trabajos/meson-lacho-foto-3.jpg"],
    video: null
  },


  /* ---------- POR LLENAR --------------------------------- *
   * Estas tienen imagen del modelo 3D y poco más. Para
   * publicar una: escribe el resumen, confirma el año, marca
   * los materiales y cámbiale publicado a true.
   * -------------------------------------------------------- */

  { slug:"cocina-completa",       carpeta:"Cocina Ery",             publicado:false, titulo:{es:"Cocina completa",en:"Full kitchen"},                    anio:2026, anio_estimado:true, tipo:"cocina",     materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/cocina-ery.png",             es_render:true, galeria:[], video:null },
  { slug:"mueble-bano",           carpeta:"Bano Wichi",             publicado:false, titulo:{es:"Mueble de baño",en:"Bathroom vanity"},                  anio:2026, anio_estimado:true, tipo:"almacenaje", materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/bano-wichi.png",             es_render:true, galeria:[], video:null },
  { slug:"gavetero",              carpeta:"Gavetero Wichi",         publicado:false, titulo:{es:"Gavetero",en:"Chest of drawers"},                       anio:2025, anio_estimado:true, tipo:"almacenaje", materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/gavetero-wichi.png",         es_render:true, galeria:[], video:null },
  { slug:"comoda",                carpeta:"Comoda",                 publicado:false, titulo:{es:"Cómoda",en:"Dresser"},                                  anio:2025, anio_estimado:true, tipo:"almacenaje", materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/comoda.png",                 es_render:true, galeria:[], video:null },
  { slug:"consola-1",             carpeta:"Consola Leo",            publicado:false, titulo:{es:"Consola",en:"Console table"},                           anio:2026, anio_estimado:true, tipo:"mesa",       materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/consola-leo.png",            es_render:true, galeria:[], video:null },
  { slug:"consola-2",             carpeta:"Consola Matias",         publicado:true,  titulo:{es:"Consola mid-century",en:"Mid-century console"},         anio:2026, anio_estimado:true, tipo:"mesa",       materiales:[], acabado:[], medidas:"152 × 60 × 43 cm", resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/consola-midcentury.jpg",     es_render:true, galeria:[], video:null },
  { slug:"mesa-comedor",          carpeta:"Mesa Maria",             publicado:false, titulo:{es:"Mesa de comedor",en:"Dining table"},                    anio:2026, anio_estimado:true, tipo:"mesa",       materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/mesa-maria.png",             es_render:true, galeria:[], video:null },
  { slug:"repisas-flotantes",     carpeta:"Flotantes Estefania",    publicado:false, titulo:{es:"Repisas flotantes",en:"Floating shelves"},              anio:2026, anio_estimado:true, tipo:"repisa",     materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/flotantes-estefania.png",    es_render:true, galeria:[], video:null },
  { slug:"repisas",               carpeta:"Repisas Julia",          publicado:false, titulo:{es:"Repisas",en:"Shelves"},                                 anio:2026, anio_estimado:true, tipo:"repisa",     materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/repisas-julia.png",          es_render:true, galeria:[], video:null },
  { slug:"mueble-flotante",       carpeta:"Mueble flotante Carlos", publicado:false, titulo:{es:"Mueble flotante",en:"Floating cabinet"},                anio:2026, anio_estimado:true, tipo:"repisa",     materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/mueble-flotante-carlos.png", es_render:true, galeria:[], video:null },
  { slug:"mobiliario-integral",   carpeta:"Mobiliario Carlos",      publicado:false, titulo:{es:"Mobiliario integral",en:"Furniture set"},               anio:2025, anio_estimado:true, tipo:"otro",       materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/mobiliario-carlos.png",      es_render:true, galeria:[], video:null },
  { slug:"cuarto-1",              carpeta:"Cuarto Emily",           publicado:false, titulo:{es:"Mobiliario de cuarto",en:"Bedroom furniture"},          anio:2026, anio_estimado:true, tipo:"closet",     materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/cuarto-emily.png",           es_render:true, galeria:[], video:null },
  { slug:"cuarto-2",              carpeta:"Cuarto victor",          publicado:false, titulo:{es:"Mobiliario de cuarto",en:"Bedroom furniture"},          anio:2025, anio_estimado:true, tipo:"closet",     materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/cuarto-victor.png",          es_render:true, galeria:[], video:null },
  { slug:"dos-cuartos",           carpeta:"Cuartos Mariela",        publicado:false, titulo:{es:"Mobiliario de dos cuartos",en:"Furniture for two bedrooms"}, anio:2026, anio_estimado:true, tipo:"closet", materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/cuartos-mariela.png",   es_render:true, galeria:[], video:null },
  { slug:"cuarto-propio",         carpeta:"Mi cuarto",              publicado:false, titulo:{es:"Mi propio cuarto",en:"My own bedroom"},                 anio:2026, anio_estimado:true, tipo:"closet",     materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/mi-cuarto.png",              es_render:true, galeria:[], video:null },
  { slug:"mueble-casa",           carpeta:"Mueble casa",            publicado:false, titulo:{es:"Mueble de casa",en:"Home cabinet"},                     anio:2025, anio_estimado:true, tipo:"almacenaje", materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/mueble-casa.png",            es_render:true, galeria:[], video:null },
  { slug:"paraban",               carpeta:"Paraban Veronica",       publicado:false, titulo:{es:"Parabán",en:"Folding screen"},                          anio:2026, anio_estimado:true, tipo:"otro",       materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/paraban-veronica.png",       es_render:true, galeria:[], video:null },
  { slug:"caja",                  carpeta:"Caja Martin",            publicado:false, titulo:{es:"Caja",en:"Box"},                                        anio:2026, anio_estimado:true, tipo:"accesorio",  materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/caja-martin.png",            es_render:true, galeria:[], video:null },
  { slug:"gancho-pared",          carpeta:"Gancho Ery",             publicado:false, titulo:{es:"Gancho de pared",en:"Wall hook"},                       anio:2026, anio_estimado:true, tipo:"accesorio",  materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/gancho-ery.png",             es_render:true, galeria:[], video:null },
  { slug:"posa-utensilios",       carpeta:"Posa Utensilios",        publicado:false, titulo:{es:"Posa utensilios",en:"Utensil holder"},                  anio:2026, anio_estimado:true, tipo:"accesorio",  materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/posa-utensilios.png",        es_render:true, galeria:[], video:null },
  { slug:"madriguera",            carpeta:"Madriguera Estefania",   publicado:false, titulo:{es:"Madriguera",en:"Pet den"},                              anio:2026, anio_estimado:true, tipo:"accesorio",  materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/madriguera-estefania.png",   es_render:true, galeria:[], video:null },
  { slug:"macetero",              carpeta:"Macetero Lacho",         publicado:false, titulo:{es:"Macetero",en:"Planter"},                                anio:2025, anio_estimado:true, tipo:"exterior",   materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/macetero-lacho.png",         es_render:true, galeria:[], video:null },
  { slug:"bases-boda",            carpeta:"Bases Boda",             publicado:false, titulo:{es:"Bases para boda",en:"Wedding display stands"},          anio:2025, anio_estimado:true, tipo:"exhibicion", materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/bases-boda.png",             es_render:true, galeria:[], video:null },
  { slug:"escenografia",          carpeta:"Escenografia Morochos",  publicado:false, titulo:{es:"Escenografía",en:"Set design"},                         anio:2026, anio_estimado:true, tipo:"otro",       materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/escenografia-morochos.png",  es_render:true, galeria:[], video:null },
  { slug:"rampa",                 carpeta:"Rampa alberto",          publicado:false, titulo:{es:"Rampa",en:"Ramp"},                                      anio:2026, anio_estimado:true, tipo:"otro",       materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/rampa-alberto.png",          es_render:true, galeria:[], video:null },
  { slug:"meson-trabajo",         carpeta:"MT Estefania",           publicado:true,  titulo:{es:"Mesón de patronaje",en:"Pattern-making counter"},                   anio:2026, anio_estimado:true, tipo:"taller",     materiales:["contraenchapado"], acabado:[], medidas:"222 × 97 × 81 cm", resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/meson-patronaje.jpg", es_render:true, galeria:[], video:null },
  { slug:"banco-de-trabajo",      carpeta:"Workbench",              publicado:false, titulo:{es:"Banco de trabajo",en:"Workbench"},                      anio:2024, anio_estimado:true, tipo:"taller",     materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/workbench.png",              es_render:true, galeria:[], video:null },
  { slug:"el-taller",             carpeta:"Taller",                 publicado:false, titulo:{es:"El taller",en:"The workshop"},                          anio:2026, anio_estimado:true, tipo:"taller",     materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/taller.png",                 es_render:true, galeria:[], video:null },
  { slug:"toldo-taller",          carpeta:"Toldo Taller",           publicado:false, titulo:{es:"Toldo del taller",en:"Shop awning"},                    anio:2026, anio_estimado:true, tipo:"exterior",   materiales:["acero"], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:null, es_render:true, galeria:[], video:null }

];
