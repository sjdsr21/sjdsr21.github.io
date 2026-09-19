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
    /* Pasó de «Rolitronco» a «Rolo» el 14/08/2026. El slug NO se
       toca: es la dirección de la ficha y ya está publicada. */
    /* «Rolo X Matías Arapé» desde el 14/09/2026 (él): la pieza lleva en el
       nombre la colaboración. Arapé CON tilde en la e, confirmado por él. */
    titulo: { es: "Rolo X Matías Arapé", en: "Rolo X Matías Arapé" },
    anio: 2026, anio_estimado: false,
    tipo: "exterior",
    /* Eucalipto, no samán (él, 15/08/2026). */
    materiales: ["eucalipto"],
    acabado: ["quemado"],
    medidas: null,
    resumen: {
      es: "Un bloque macizo quemado, para exteriores. Pensado para acompañar una fogata: sirve de asiento, de mesa auxiliar o de pedestal, y se carga de un sitio a otro por la cadena. El video y las fotos salieron de una colaboración con Matías Arapé, @matiasarape en Instagram.",
      en: "A charred solid block for outdoor use. Made to sit by a fire: a seat, a side table or a pedestal, carried from place to place by its chain. The video and photography came out of a collaboration with Matías Arapé, @matiasarape on Instagram."
    },
    /* 15/09/2026 · Él pidió QUITAR el texto de «Cómo está hecha» (dos
       párrafos del equipo que grabó el video: «El equilibrio entre lo
       estético y lo funcional…» y «El proyecto de Prototipo Ago busca
       crear piezas únicas…»). Si hace falta recuperarlo, está en el
       historial de git. El usuario de Instagram de Matías va en el resumen,
       en minúsculas y sin tilde: @matiasarape. */
    como: { es: [], en: [] },
    /* Desde el 14/08/2026 va de portada la FOTO REAL, no la
       representación digital: es una pieza terminada y enseñarla
       renderizada la vendía peor. Por eso `es_render` pasa a
       false — si no, la ficha saldría con el sello «3D». */
    /* Portada = la antigua segunda foto (él, 14/09/2026). */
    imagen: "img/trabajos/rolitronco-foto-2.webp",
    es_render: false,
    galeria: [],
    video: "video/rolitronco.mp4",
    medidas: "29 × 20 × 20 cm",

    /* Los medios de la ficha, en el orden en que se ven en la
       tira de miniaturas de la izquierda. Si una pieza no tiene
       este campo, la ficha arma la tira sola con la imagen, la
       galería y el video. */
    /* 08/09/2026 · Entran TRES fotos más de la sesión con Matías Arapé,
       las que él numeró «Rolo 2, 3 y 4» en E:\Contenido PrototipoAgo\Rolo.
       Van EXACTAMENTE a partir del segundo puesto (pedido suyo); la foto
       que ya estaba se queda de primera y todo lo demás baja un escalón.
       No hay `rolitronco-foto-1.webp`: la número 1 es `rolitronco.webp`,
       que además es la portada de la ficha (`imagen`) y tiene sus
       variantes `-portada`. Renombrarla rompería esas referencias por
       nada, así que la numeración empieza en el 2 a propósito.
       La representación digital pasa así del puesto 2 al 5. Se queda
       porque nadie pidió quitarla, pero con cuatro fotos reales delante
       ya casi no hace falta: si estorba, se borra esa línea. */
    medios: [
      /* 14/09/2026 (él): la segunda foto pasa a primera, y SALE la
         representación digital (rolitronco-render.webp, la isométrica
         hecha con capturar-rolitronco.html). El archivo sigue en img/
         por si se quiere reponer: basta volver a poner su línea. */
      { tipo: "imagen", src: "img/trabajos/rolitronco-foto-2.webp" },
      { tipo: "imagen", src: "img/trabajos/rolitronco.webp" },
      { tipo: "imagen", src: "img/trabajos/rolitronco-foto-3.webp" },
      { tipo: "imagen", src: "img/trabajos/rolitronco-foto-4.webp" },
      { tipo: "video",  src: "video/rolitronco-corto.mp4" },
      { tipo: "video",  src: "video/rolitronco.mp4" }
    ]
  },

  /* Fotos y video del 27/08/2026, en el orden en que él los
     numeró: las tres fotos y después el video. La ficha arma la
     tira de miniaturas sola con imagen + galería + video, que da
     ese mismo orden, así que no hace falta el campo `medios`.
     El video venía de cámara a 32 MB (1080p, 22 Mbps) y se
     recomprimió a 1280 px y 2,9 MB. */
  {
    slug: "rolo-orfebre",
    carpeta: null,          /* todavía no tiene carpeta en Proyectos */
    /* APARTADO el 14/09/2026 (él): "no lo quiero ver, escóndelo". La ficha
       queda completa —fotos, video, textos— para volver a ponerla en
       true cuando la quiera de nuevo. Se ve con ?borradores=1. */
    publicado: false,
    destacado: true,
    titulo: { es: "Rolo de orfebre", en: "Silversmith's block" },
    anio: 2026, anio_estimado: false,
    tipo: "taller",
    materiales: ["eucalipto"],
    acabado: [],
    medidas: null,
    resumen: { es: "", en: "" },
    como: { es: [], en: [] },
    imagen: "img/trabajos/rolo-orfebre-foto-1.webp",
    es_render: false,
    galeria: [
      "img/trabajos/rolo-orfebre-foto-2.webp",
      "img/trabajos/rolo-orfebre-foto-3.webp"
    ],
    video: "video/rolo-orfebre.mp4"
  },

  {
    slug: "repicero-exhibicion",
    carpeta: "Repicero Estefania",
    publicado: false,   /* fuera de Exhibición el 14/08/2026, decisión suya */
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
    imagen: "img/trabajos/repicero-propuesta.webp",
    es_render: true,
    galeria: [],
    video: null
  },

  {
    slug: "mesa-cubo-ceramica",
    carpeta: "Mesa Cubo Ceramica",
    publicado: false,   /* fuera de Exhibición el 14/08/2026, decisión suya */
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
    imagen: "img/trabajos/mesa-cubo-propuesta.webp",
    es_render: true,
    galeria: [],
    video: null
  },

  {
    slug: "quillas-pared",
    carpeta: "Quillas Mariana",
    /* 06/09/2026 · Vuelve a Exhibición. Ya hay fotos reales (4, las que
       él numeró) y un video, así que deja de ser render: `es_render:false`
       le quita el sello «3D». La vista de la propuesta
       (quillas-propuesta.webp) ya no se usa; el archivo se queda en img/. */
    publicado: true,
    destacado: true,
    titulo: { es: "Quillas de pared", en: "Wall-mounted board rests" },
    anio: 2026, anio_estimado: false,
    /* 15/09/2026 · De «accesorio» a «repisa» (él): son soportes de
       pared, y la etiqueta se lee «Repisas». */
    tipo: "repisa",
    materiales: ["saman"],
    acabado:["linaza","cera"],
    medidas: "26 × 18,5 × 4 cm",   /* de las cotas de tu propia vista */
    resumen: {
      /* 16/09/2026 · Crédito del diseño a @casagreca_ (él), al final y con
         la misma forma que el de Centro Estepario en el Elevacho. */
      es: "Dos soportes tallados en samán macizo. Colgados no se ve ni un tornillo: encajan sobre ranuras keyhole fresadas en la propia madera. El diseño se hizo en colaboración con @casagreca_ en Instagram.",
      en: "Two rests carved from solid monkeypod. Hung on the wall not a single screw shows — they seat on keyhole slots routed into the wood itself. Designed in collaboration with @casagreca_ on Instagram."
    },
    como: {
      es: [
        "Dos soportes tallados en samán macizo de 4 cm de espesor, con todo el canto redondeado.",
        "Montaje invisible: cada quilla encaja sobre ranuras keyhole fresadas en la propia madera. Colgadas, no se ve ni un tornillo ni un herraje.",
        "Acabado en aceite de linaza, que realza la veta del samán y protege la madera."
      ],
      en: [
        "Two rests carved from 4 cm solid monkeypod, every edge rounded over.",
        "Invisible mounting: each one seats on keyhole slots routed into the wood itself. Hung, no screw or bracket is visible.",
        "Linseed oil finish, which brings up the monkeypod's grain and protects the wood."
      ]
    },
    imagen: "img/trabajos/quillas-mariana-foto-1.webp",
    es_render: false,
    galeria: [
      "img/trabajos/quillas-mariana-foto-2.webp",
      "img/trabajos/quillas-mariana-foto-3.webp",
      "img/trabajos/quillas-mariana-foto-4.webp"
    ],
    video: "video/quillas-mariana.mp4"
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
    imagen: "img/trabajos/meson-lacho-foto.webp",
    es_render: false,
    galeria: ["img/trabajos/meson-lacho-foto-2.webp", "img/trabajos/meson-lacho-foto-3.webp"],
    video: null
  },


  /* ---------- POR LLENAR --------------------------------- *
   * Estas tienen imagen del modelo 3D y poco más. Para
   * publicar una: escribe el resumen, confirma el año, marca
   * los materiales y cámbiale publicado a true.
   * -------------------------------------------------------- */

  { slug:"cocina-completa",       carpeta:"Cocina Ery",             publicado:false, titulo:{es:"Cocina completa",en:"Full kitchen"},                    anio:2026, anio_estimado:true, tipo:"cocina",     materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/cocina-ery.webp",             es_render:true, galeria:[], video:null },
  /* Fotos reales del 14/08/2026 (4, las que él numeró). En la
     carpeta de contenido esto se llama «Vanitarios Wichi» y es el
     mismo proyecto que «Bano Wichi»; son DOS piezas, de ahí el
     plural en el título. */
  /* 14/09/2026 · AÑOS Y MATERIALES DICTADOS POR ÉL: zapatera en teca 2024,
     escenografía 2026, cuadro tallado 2025, gavetero 2025, zapatera en samán
     2025 (antes «Zapatera»; «en», como las demás con madera en el nombre), elevacho 2025, bandeja 2025, escritorio en teca
     2024. Todos pasan a anio_estimado:false, que quita el «(?)» de la ficha.
     Materiales: zapatera, caja y bandeja = samán; elevacho = pino; vanitarios
     = MDF HR; madriguera = pino + compuesto de okumé; escenografía = pino;
     gavetero = cedro. */
  { slug:"mueble-bano",           carpeta:"Bano Wichi",             publicado:true,  titulo:{es:"Vanitarios laqueados",en:"Lacquered bathroom vanities"},                    anio:2026, anio_estimado:false, tipo:"gabinete",   materiales:["mdf-hr"], acabado:["pintado","poliuretano"], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/vanitarios-wichi-foto-1.webp", es_render:false, galeria:["img/trabajos/vanitarios-wichi-foto-2.webp","img/trabajos/vanitarios-wichi-foto-3.webp"], video:null },
  /* Fotos reales del 06/09/2026. Las tres primeras se SUSTITUYERON esa
     misma tarde por su versión «final», con corrección de color, y entró
     una cuarta: son 4, las que él numeró con «final» en el nombre.
     Las anteriores quedaron en Backups\gavetero-fotos-viejas-2026-09-06.
     Sale de
     borradores y deja de ser render. La vista del modelo
     (gavetero-wichi.webp) ya no se usa; el archivo se queda en img/.
     El año sigue estimado: no lo ha confirmado. */
  { slug:"gavetero",              carpeta:"Gavetero Wichi",         publicado:true,  titulo:{es:"Gavetero",en:"Chest of drawers"},                       anio:2025, anio_estimado:false, tipo:"gabinete",   materiales:["cedro"], acabado:["linaza","cera"], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/gavetero-wichi-foto-1.webp", es_render:false, galeria:["img/trabajos/gavetero-wichi-foto-2.webp","img/trabajos/gavetero-wichi-foto-3.webp","img/trabajos/gavetero-wichi-foto-4.webp"], video:null },
  /* ZAPATERA — ficha nueva del 06/09/2026. No tiene carpeta en
     D:\Carpinteria\Proyectos ni .skp, así que el año no sale de ningún
     archivo: va estimado hasta que él lo diga. El título no lleva el
     nombre de la clienta, como todos.
     OJO: sus tres fotos vienen a ~800 px (parecen de WhatsApp), por
     debajo del tope de 1400 del sitio. No se pueden agrandar. */
  /* 14/09/2026 · 3D de la zapatera en samán y del elevacho. Van con `modelo3d`
     escrito a mano porque los .skp se llaman distinto que su carpeta
     («Zapatero Rosa» vs «Zapatera Rosa», «Elevador» vs «Elevacho»), y la
     búsqueda automática por carpeta no los encontraría. */
  { slug:"zapatera",              carpeta:"Zapatera Rosa",          publicado:true,  titulo:{es:"Zapatera en samán",en:"Monkeypod shoe rack"},                              anio:2025, anio_estimado:false,  tipo:"zapatera",   materiales:["saman"], acabado:["poliuretano"], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/zapatera-rosa-foto-0.webp",  es_render:false, galeria:["img/trabajos/zapatera-rosa-foto-2.webp","img/trabajos/zapatera-rosa-foto-1.webp","img/trabajos/zapatera-rosa-foto-3.webp"], video:null, modelo3d:"modelos/zapatero-rosa.glb" },
  { slug:"comoda",                carpeta:"Comoda",                 publicado:false, titulo:{es:"Cómoda",en:"Dresser"},                                  anio:2025, anio_estimado:true, tipo:"almacenaje", materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/comoda.webp",                 es_render:true, galeria:[], video:null },
  { slug:"consola-1",             carpeta:"Consola Leo",            publicado:false, titulo:{es:"Consola",en:"Console table"},                           anio:2026, anio_estimado:true, tipo:"mesa",       materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/consola-leo.webp",            es_render:true, galeria:[], video:null },
  { slug:"consola-2",             carpeta:"Consola Matias",         publicado:true,  titulo:{es:"Consola mid-century",en:"Mid-century console"},         anio:2026, anio_estimado:false, tipo:"gabinete",   materiales:["melamina","mdf","tela"], acabado:[], medidas:"152 × 60 × 43 cm", resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/consola-matias-foto-1.webp",  es_render:false, galeria:["img/trabajos/consola-matias-foto-2.webp","img/trabajos/consola-matias-foto-3.webp"], video:null },
  { slug:"mesa-comedor",          carpeta:"Mesa Maria",             publicado:false, titulo:{es:"Mesa de comedor",en:"Dining table"},                    anio:2026, anio_estimado:true, tipo:"mesa",       materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/mesa-maria.webp",             es_render:true, galeria:[], video:null },
  { slug:"repisas-flotantes",     carpeta:"Flotantes Estefania",    publicado:false, titulo:{es:"Repisas flotantes",en:"Floating shelves"},              anio:2026, anio_estimado:true, tipo:"repisa",     materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/flotantes-estefania.webp",    es_render:true, galeria:[], video:null },
  /* 14/09/2026 · PUBLICADA con fotos reales: las cinco que él numeró
     «Repisas Julia 1-5» en E:\Contenido PrototipoAgo\Repisas Julia (el IMG-WA y
     los dos PXL sin número se quedan fuera). Deja de ser render: la miniatura
     de SketchUp, repisas-julia.webp, sigue en img/ pero ya no se usa. Año
     confirmado por las fotos de cámara, del 13/04/2026. Sin 3D: no hay export.
     Madera: apamate (él, 14/09/2026). Título «Repisas removibles» (él, mismo día). */
  { slug:"repisas",               carpeta:"Repisas Julia",          publicado:true, titulo:{es:"Repisas removibles",en:"Removable shelves"},                                 anio:2026, anio_estimado:false, tipo:"repisa",     materiales:["apamate"], acabado:["poliuretano"], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/repisas-julia-foto-1.webp", es_render:false, galeria:["img/trabajos/repisas-julia-foto-2.webp","img/trabajos/repisas-julia-foto-3.webp","img/trabajos/repisas-julia-foto-4.webp","img/trabajos/repisas-julia-foto-5.webp"], video:null },
  { slug:"mueble-flotante",       carpeta:"Mueble flotante Carlos", publicado:false, titulo:{es:"Mueble flotante",en:"Floating cabinet"},                anio:2026, anio_estimado:true, tipo:"repisa",     materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/mueble-flotante-carlos.webp", es_render:true, galeria:[], video:null },
  { slug:"mobiliario-integral",   carpeta:"Mobiliario Carlos",      publicado:false, titulo:{es:"Mobiliario integral",en:"Furniture set"},               anio:2025, anio_estimado:true, tipo:"otro",       materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/mobiliario-carlos.webp",      es_render:true, galeria:[], video:null },
  { slug:"cuarto-1",              carpeta:"Cuarto Emily",           publicado:false, titulo:{es:"Mobiliario de cuarto",en:"Bedroom furniture"},          anio:2026, anio_estimado:true, tipo:"closet",     materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/cuarto-emily.webp",           es_render:true, galeria:[], video:null },
  { slug:"cuarto-2",              carpeta:"Cuarto victor",          publicado:false, titulo:{es:"Mobiliario de cuarto",en:"Bedroom furniture"},          anio:2025, anio_estimado:true, tipo:"closet",     materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/cuarto-victor.webp",          es_render:true, galeria:[], video:null },
  { slug:"dos-cuartos",           carpeta:"Cuartos Mariela",        publicado:false, titulo:{es:"Mobiliario de dos cuartos",en:"Furniture for two bedrooms"}, anio:2026, anio_estimado:true, tipo:"closet", materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/cuartos-mariela.webp",   es_render:true, galeria:[], video:null },
  { slug:"cuarto-propio",         carpeta:"Mi cuarto",              publicado:false, titulo:{es:"Mi propio cuarto",en:"My own bedroom"},                 anio:2026, anio_estimado:true, tipo:"closet",     materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/mi-cuarto.webp",              es_render:true, galeria:[], video:null },
  { slug:"mueble-casa",           carpeta:"Mueble casa",            publicado:false, titulo:{es:"Mueble de casa",en:"Home cabinet"},                     anio:2025, anio_estimado:true, tipo:"almacenaje", materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/mueble-casa.webp",            es_render:true, galeria:[], video:null },
  /* 27/08/2026 · Pasó de «Parabán» a «Parabán “hippie”», decisión
     suya. El slug NO se toca: es la dirección de la ficha.
     Fotos reales del 27/08/2026 (6, las que él numeró). Sale de
     borradores y deja de ser render: `es_render:false` le quita el
     sello «3D». La vista del modelo (paraban-veronica.webp) ya no
     se usa en la ficha; el archivo se queda en img/ por si acaso. */
  { slug:"paraban",               carpeta:"Paraban Veronica",       publicado:true,  titulo:{es:"Parabán “hippie”",en:"“Hippie” folding screen"},                          anio:2026, anio_estimado:false, tipo:"paraban",    materiales:["apamate","tela"], acabado:["poliuretano"], medidas:"90 × 4 × 142 cm", resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/paraban-veronica-foto-1.webp", es_render:false, galeria:["img/trabajos/paraban-veronica-foto-2.webp","img/trabajos/paraban-veronica-foto-3.webp","img/trabajos/paraban-veronica-foto-4.webp","img/trabajos/paraban-veronica-foto-5.webp","img/trabajos/paraban-veronica-foto-6.webp"], video:null },
  { slug:"caja",                  carpeta:"Caja Martin",            publicado:true,  titulo:{es:"Caja de relojes",en:"Watch box"},                                        anio:2026, anio_estimado:false, tipo:"accesorio",  materiales:["saman","tela"], acabado:["linaza","cera"], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/caja-martin-foto-1.webp",      es_render:false, galeria:["img/trabajos/caja-martin-foto-2.webp","img/trabajos/caja-martin-foto-3.webp","img/trabajos/caja-martin-foto-4.webp"], video:null },
  { slug:"gancho-pared",          carpeta:"Gancho Ery",             publicado:false, titulo:{es:"Gancho de pared",en:"Wall hook"},                       anio:2026, anio_estimado:true, tipo:"accesorio",  materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/gancho-ery.webp",             es_render:true, galeria:[], video:null },
  { slug:"posa-utensilios",       carpeta:"Posa Utensilios",        publicado:false, titulo:{es:"Posa utensilios",en:"Utensil holder"},                  anio:2026, anio_estimado:true, tipo:"accesorio",  materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/posa-utensilios.webp",        es_render:true, galeria:[], video:null },
  /* Fotos reales del 14/08/2026 (7, las que él numeró). Deja de ser
     render: `es_render:false` le quita el sello «3D» de la ficha. */
  { slug:"madriguera",            carpeta:"Madriguera Estefania",   publicado:true,  titulo:{es:"Madriguera de conejo",en:"Rabbit den"},                              anio:2026, anio_estimado:false, tipo:"mascotas",   materiales:["pino","okume","pvc-expandido"], acabado:["crudo"], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/madriguera-estefania-foto-4.webp",   es_render:false, galeria:["img/trabajos/madriguera-estefania-foto-1.webp","img/trabajos/madriguera-estefania-foto-2.webp","img/trabajos/madriguera-estefania-foto-5.webp","img/trabajos/madriguera-estefania-foto-6.webp","img/trabajos/madriguera-estefania-foto-7.webp"], video:"video/madriguera-estefania.mp4" },
  { slug:"macetero",              carpeta:"Macetero Lacho",         publicado:false, titulo:{es:"Macetero",en:"Planter"},                                anio:2025, anio_estimado:true, tipo:"exterior",   materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/macetero-lacho.webp",         es_render:true, galeria:[], video:null },
  { slug:"bases-de-foto",         carpeta:"Bases de Foto",             publicado:false, titulo:{es:"Bases para foto",en:"Photo risers"},          anio:2025, anio_estimado:true, tipo:"exhibicion", materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/bases-de-foto.webp",             es_render:true, galeria:[], video:null },
  /* Fotos reales del 06/09/2026 (foto-1 y foto-2). ÚNICO caso en que NO
     estaban numeradas: la carpeta solo traía dos IMG-…-WA, así que van en
     el orden de sus nombres (11/02 y luego 23/02).
     Esas fechas confirman el año 2026 que ya estaba estimado.

     08/09/2026 · Tres fotos MÁS, las que él numeró «Escenografía 1-3» en
     E:\Contenido PrototipoAgo\Escenografía → foto-3, foto-4 y foto-5.
     La PORTADA pasa a ser foto-3, el set montado en el teatro con las
     cuatro tumbonas encendidas (decisión suya): en una ficha de
     escenografía el montaje terminado dice más que los marcos apilados
     en el piso del taller, que es lo que había de portada.
     El orden de la galería va de lo terminado a lo hecho: la pieza en
     uso (4 y 5) y después el proceso en el taller (1 y 2).
     OJO: foto-4 es el mismo archivo que `Tumbona 1.jpg`, o sea la misma
     imagen que abre la galería de la tumbona en el catálogo. Es a
     propósito —la tumbona salió de este proyecto—, no un descuido. */
  /* 14/09/2026 (él) · Título «Escenografía X 40 Años de Paz» —A de Años y P de
     Paz en mayúscula— y el encargo en la descripción. El teatro es el
     «Trasnocho Cultural» (sin n tras la a; él lo dictó «Transnocho»). El
     nombre de la obra va igual en inglés: es un título propio. */
  /* 14/09/2026 · TRES VIDEOS: los que él numeró «Escenografía 4, 5 y 6» (siguen
     a las fotos 1-3). Venían en 4K de 34 a 76 MB; se recomprimieron con la
     receta de siempre (lado largo 1280, CRF 26, +faststart) y cada uno lleva
     su portada en img/trabajos/escenografia-morochos-N-portada.webp. El 6 es
     vertical. Con más de un video hace falta `medios`, como en el Rolo: manda
     sobre imagen+galería+video, que se quedan por si algo más los lee. Los
     cinco 20260311_*.mp4 sin número se quedan fuera. */
  { slug:"escenografia",          carpeta:"Escenografia Morochos",  publicado:true,  titulo:{es:"Escenografía X 40 Años de Paz",en:"Set design X 40 Años de Paz"},                         anio:2026, anio_estimado:false, tipo:"otro",       materiales:["pino"], acabado:["crudo"], medidas:null, resumen:{es:"Proyecto por encargo para la obra 40 Años de Paz, dirigida por Gabriel y Daniel La Rosa y presentada en la Decimoprimera edición del Festival de Jóvenes Directores del Trasnocho Cultural, donde fue galardonada con mención de honor y otros reconocimientos.",en:"A commissioned set for the play 40 Años de Paz, directed by Gabriel and Daniel La Rosa and staged at the 11th edition of the Trasnocho Cultural Young Directors' Festival, where it received an honourable mention and other awards."}, como:{es:[],en:[]}, imagen:"img/trabajos/escenografia-morochos-foto-3.webp", es_render:false, galeria:["img/trabajos/escenografia-morochos-foto-4.webp","img/trabajos/escenografia-morochos-foto-5.webp","img/trabajos/escenografia-morochos-foto-1.webp","img/trabajos/escenografia-morochos-foto-2.webp"], video:null, medios:[{tipo:"imagen",src:"img/trabajos/escenografia-morochos-foto-3.webp"},{tipo:"imagen",src:"img/trabajos/escenografia-morochos-foto-4.webp"},{tipo:"imagen",src:"img/trabajos/escenografia-morochos-foto-5.webp"},{tipo:"imagen",src:"img/trabajos/escenografia-morochos-foto-1.webp"},{tipo:"imagen",src:"img/trabajos/escenografia-morochos-foto-2.webp"},{tipo:"video",src:"video/escenografia-morochos-4.mp4"},{tipo:"video",src:"video/escenografia-morochos-6.mp4"}] },

  /* ------------------------------------------------------------------
     CINCO FICHAS NUEVAS del 06/09/2026. Ninguna tiene carpeta en
     D:\Carpinteria\Proyectos, así que `carpeta` apunta a la de contenido
     en E:\ y NO habrá modelo 3D hasta que se exporte uno.

     Los años salen de la fecha de las fotos SIN numerar que guarda cada
     carpeta — las numeradas son copias y llevan la fecha de la copia —,
     así que van todos con `anio_estimado:true` hasta que él los confirme.
     El Elevacho y la Bandeja no tienen ninguna foto con fecha buena.
     ------------------------------------------------------------------ */
  /* 12/09/2026 · Fotos nuevas, las que él numeró «Elevacho 1-8» en
     E:\Contenido PrototipoAgo\Elevacho, en ese orden. La 1 ya estaba
     publicada y no se tocó (se comprobó que es la misma foto).
     15/09/2026 · La foto-1 SÍ se cambió, por «Elevacho 1.png» (él: la más
     reciente, 1200 × 896). El respaldo de la anterior quedó apartado como
     img/_originales/trabajos/elevacho-foto-1-anterior-2026-09-06.webp, la
     misma maniobra de siempre para que Achicar-imagenes.ps1 no la resucite.
     La foto-2
     de antes era `sdfgsdfg.jpg`, que no está numerada: sale, y su
     original quedó apartado como
     img/_originales/trabajos/elevacho-foto-2-anterior-sdfgsdfg.webp
     —si no se apartaba, Achicar-imagenes.ps1 rehacía la foto-2 NUEVA
     desde ese original VIEJO y la devolvía—.
     La 5-8 venían en HEIC de iPhone, partidas en mosaicos de 512 px:
     ffmpeg las reensambla, pero no admite -vf en el mismo paso, así que
     van primero a PNG entero y luego a webp.
     OJO: la 2, 3 y 4 llegaron a 1080 px de ancho (exportadas de
     Instagram o WhatsApp), por debajo del tope de 1400 de las demás.
     Solo en local: no se subió a GitHub (él, 12/09/2026).
     Título cambiado a «Elevacho X Centro Estepario» (él, 12/09/2026).
     El slug y la carpeta siguen siendo «elevacho»: son la dirección de la
     ficha y la ruta de las fotos, no el nombre que se ve. */
  { slug:"elevacho",              carpeta:"Elevacho",               publicado:true,  titulo:{es:"Elevacho X Centro Estepario",en:"Elevacho X Centro Estepario"}, anio:2025, anio_estimado:false, tipo:"accesorio",  materiales:["pino","plastico"], acabado:["poliuretano"], medidas:null, resumen:{es:"Plataforma para elevar los monitores sobre el escritorio y mejorar así la postura. Diseño e impresión 3D elaborados por Centro Estepario, @centro_estepario en Instagram.",en:"A platform that raises your monitors above the desk to improve your posture. Design and 3D printing by Centro Estepario, @centro_estepario on Instagram."}, como:{es:[],en:[]}, imagen:"img/trabajos/elevacho-foto-1.webp",        es_render:false, galeria:["img/trabajos/elevacho-foto-2.webp","img/trabajos/elevacho-foto-3.webp","img/trabajos/elevacho-foto-4.webp","img/trabajos/elevacho-foto-5.webp","img/trabajos/elevacho-foto-6.webp","img/trabajos/elevacho-foto-7.webp","img/trabajos/elevacho-foto-8.webp"], video:null, modelo3d:"modelos/elevador.glb" },
  { slug:"bandeja",               carpeta:"Bandeja",                publicado:true,  titulo:{es:"Bandeja",en:"Serving tray"},                            anio:2025, anio_estimado:false, tipo:"accesorio",  materiales:["saman"], acabado:["linaza"], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/bandeja-foto-2.webp",         es_render:false, galeria:["img/trabajos/bandeja-foto-1.webp","img/trabajos/bandeja-foto-3.webp"], video:null },
  /* Fotos originales del 25/06/2024 */
  /* 15/09/2026 · Entran sus fotos numeradas 5 y 6, al final de la galería.
     OJO, y esto casi muerde: YA EXISTÍA un `escritorio-teca-foto-5.webp` en
     img/ (del 11/09) que ninguna ficha usaba, con su respaldo en _originales.
     Ese respaldo quedó apartado como
     img/_originales/trabajos/escritorio-teca-foto-5-anterior-2026-09-06.webp
     —si no, Achicar-imagenes.ps1 rehacía la 5 NUEVA desde el respaldo VIEJO y
     devolvía la imagen anterior sin avisar—. Comprobado después con PSNR: las
     dos dan ~42 dB contra sus fuentes, o sea son las de él. */
  { slug:"escritorio-teca",       carpeta:"Escritorio Teca",        publicado:true,  titulo:{es:"Escritorio en teca",en:"Teak desk"},                    anio:2024, anio_estimado:false, tipo:"mesa",       materiales:["teca"], acabado:["rubio-monocoat"], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/escritorio-teca-foto-2.webp", es_render:false, galeria:["img/trabajos/escritorio-teca-foto-1.webp","img/trabajos/escritorio-teca-foto-3.webp","img/trabajos/escritorio-teca-foto-4.webp","img/trabajos/escritorio-teca-foto-5.webp","img/trabajos/escritorio-teca-foto-6.webp"], video:null },
  /* Foto original del 24/07/2025 */
  { slug:"cuadro-tallado",        carpeta:"Cuadro tallado",         publicado:true,  titulo:{es:"Cuadro tallado",en:"Carved wall panel"},                anio:2025, anio_estimado:false, tipo:"decoracion", materiales:["teca"], acabado:["poliuretano"], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/cuadro-tallado-foto-1.webp",  es_render:false, galeria:["img/trabajos/cuadro-tallado-foto-2.webp"], video:null },
  /* Sus cuatro fotos son del 15/12/2023; hay otra suelta del 01/06/2024.
     Título con la madera dentro para no chocar con la «Zapatera» de
     Rosa, que ya está publicada — son dos piezas distintas. */
  { slug:"zapatera-teca",         carpeta:"Zapatera Teca",          publicado:true,  titulo:{es:"Zapatera en teca",en:"Teak shoe rack"},                 anio:2024, anio_estimado:false, tipo:"zapatera",   materiales:["teca"], acabado:["rubio-monocoat"], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/zapatera-teca-foto-4.webp",   es_render:false, galeria:["img/trabajos/zapatera-teca-foto-1.webp","img/trabajos/zapatera-teca-foto-2.webp","img/trabajos/zapatera-teca-foto-3.webp"], video:null },
  /* 15/09/2026 · TRES FICHAS NUEVAS, pedidas por él.
     ANILLOS — carpeta «Showcase Anillos» en E:\Contenido PrototipoAgo, publicada
     solo como «Anillos» (él). Van las cinco «Anillos N-2.jpg», que son las que
     él editó ese día (recortes nuevos); las «Anillos N.JPG» sin «-2» y los
     DSC/C37xx sin número se quedan fuera.
     Ese mismo día la foto-1 pasó a «Anillos 1.png» (él: la más reciente, con
     el fondo limpio, 1200 × 896). El respaldo de la anterior (la «1-2.jpg»)
     quedó apartado como img/_originales/trabajos/anillos-foto-1-anterior-1-2jpg.webp
     para que Achicar-imagenes.ps1 no la resucite. Año 2025 por la fecha de cámara de
     los DSC (10/01/2025), confirmado por él. Maderas dictadas por él el
     mismo día: zapatero, aceite y puy (con Y). Acabado poliuretano, igual
     que el macetero. El mueble de espejo también es 2025, confirmado.
     MACETERO X CENTRO ESTEPARIO — carpeta «Plataformacha» en E:\. Entró como
     «Plataforma para macetas» y ese mismo día él la renombró, confirmó 2025,
     pidió «hierro, pino» (no acero) y el crédito a Centro Estepario igual que
     en el Elevacho. El slug se queda en «plataforma-macetas» (ya existe otro
     «macetero», el de Lacho, sin publicar). Las tres fotos numeradas; los dos
     .mp4 sin número fuera.
     MUEBLE DE ESPEJO — de «Baño Ery» (D:\Carpinteria\Proyectos\Old). Una sola
     foto, «Mueble Espejo Baño 1.jpg»: es un cuadro del video con el color
     corregido y mide 602 × 781, muy por debajo del tope de 1400 — se verá
     algo blanda en pantalla grande. Melamina deducida de la foto y de los
     «cantos» del presupuesto (que no nombra el tablero); espejo 45 × 35 con
     dos LED según el mismo presupuesto (20/08/2025). */
  { slug:"anillos",               carpeta:"Showcase Anillos",       publicado:true,  titulo:{es:"Anillos",en:"Rings"},                                   anio:2025, anio_estimado:false, tipo:"accesorio",  materiales:["zapatero","aceite","puy"], acabado:["poliuretano"], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/anillos-foto-1.webp",         es_render:false, galeria:["img/trabajos/anillos-foto-2.webp","img/trabajos/anillos-foto-3.webp","img/trabajos/anillos-foto-4.webp","img/trabajos/anillos-foto-5.webp","img/trabajos/anillos-foto-6.webp"], video:null },
  /* LÁMPARA SHOJI (él, 16/09/2026): carpeta «Lampara Shoji» en E:, las
     cinco numeradas. Apamate y pino, 2025, categoría lámpara. Acabado sin
     dictar todavía. */
  { slug:"lampara-shoji",         carpeta:"Lampara Shoji",          publicado:true,  titulo:{es:"Lámpara Shoji",en:"Shoji lamp"},                          anio:2025, anio_estimado:false, tipo:"lampara",    materiales:["apamate","pino"], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/lampara-shoji-foto-1.webp",   es_render:false, galeria:["img/trabajos/lampara-shoji-foto-2.webp","img/trabajos/lampara-shoji-foto-3.webp","img/trabajos/lampara-shoji-foto-4.webp","img/trabajos/lampara-shoji-foto-5.webp"], video:null },
  { slug:"plataforma-macetas",    carpeta:"Plataformacha",          publicado:true,  titulo:{es:"Macetero X Centro Estepario",en:"Macetero X Centro Estepario"}, anio:2025, anio_estimado:false, tipo:"exterior",   materiales:["hierro","pino"], acabado:["poliuretano"], medidas:null, resumen:{es:"Diseño elaborado por Centro Estepario, @centro_estepario en Instagram.",en:"Design by Centro Estepario, @centro_estepario on Instagram."}, como:{es:[],en:[]}, imagen:"img/trabajos/plataformacha-foto-1.webp",   es_render:false, galeria:["img/trabajos/plataformacha-foto-2.webp","img/trabajos/plataformacha-foto-3.webp","img/trabajos/plataformacha-foto-4.webp","img/trabajos/plataformacha-foto-5.webp"], video:null },
  /* 15/09/2026 · PUERTAS DE CLÓSET (él). Los numerados de
     E:\Contenido PrototipoAgo\Puertas Closet: fotos 1 a 4 y videos 5 y 6.
     De la 1 va el .jpg, que es más nuevo que el .png y es la misma imagen;
     de la 2, 3 y 4 va su versión «-2», la que él editó ese día. Los
     20241212/20250213 sin numerar y el 20250218.mp4 se quedan fuera.
     OJO CON LA 1: viene a 607 × 1080, muy por debajo del tope de 1400 de las
     demás, y es la portada. Se verá blanda en pantalla grande.
     Los dos videos venían en 4K (82,9 y 32,6 MB) y se recomprimieron con la
     receta de siempre —lado largo 1280, CRF 26, +faststart— a 1,4 y 0,6 MB.
     Son verticales. Con más de un video hace falta `medios`, como en el Rolo
     y la escenografía: manda sobre imagen+galeria+video, que se quedan por si
     algo más los lee. Cada uno lleva su portada en
     img/trabajos/puertas-closet-N-portada.webp, que es el nombre que busca
     `portadaDe` en js/sitio.js.
     Año 2025 CONFIRMADO por él, que además cuadra con la fecha de las fotos
     sin numerar (las puertas puestas son del 13/02/2025; el .skp de
     D:\Carpinteria\Proyectos\Old\Puertas Clóset Ery es de diciembre de 2024).
     Madera y acabado dictados por él el 15/09/2026: cedro Y chapa de cedro
     —los dos, por eso van las dos claves— y barniz alquídico, que es clave
     nueva y aparte del `barnizado` genérico. */
  { slug:"puertas-closet",        carpeta:"Puertas Clóset Ery",     publicado:true,  titulo:{es:"Puertas de clóset",en:"Closet doors"},                  anio:2025, anio_estimado:false, tipo:"puerta",     materiales:["cedro","chapa-cedro"], acabado:["barniz-alquidico"], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/puertas-closet-foto-1.webp",  es_render:false, galeria:["img/trabajos/puertas-closet-foto-2.webp","img/trabajos/puertas-closet-foto-3.webp","img/trabajos/puertas-closet-foto-4.webp"], video:"video/puertas-closet-5.mp4", medios:[{tipo:"imagen",src:"img/trabajos/puertas-closet-foto-1.webp"},{tipo:"imagen",src:"img/trabajos/puertas-closet-foto-2.webp"},{tipo:"imagen",src:"img/trabajos/puertas-closet-foto-3.webp"},{tipo:"imagen",src:"img/trabajos/puertas-closet-foto-4.webp"},{tipo:"video",src:"video/puertas-closet-5.mp4"},{tipo:"video",src:"video/puertas-closet-6.mp4"}] },

  /* 15/09/2026 · SET DE UTENSILIOS (él). Carpeta «Set de utensilios» en
     E:\Contenido PrototipoAgo. Van las dos numeradas, «Utensilios 1.png» y
     «Utensilios 2.png»: son sus versiones editadas (fondo liso beige) de las
     fotos de cámara 20250712_162420 y 20250909_110835, que se quedan fuera.
     OJO: vienen chicas, 1200 × 896 y 896 × 896. Año 2026 dictado por él,
     aunque las fotos de cámara son de 2025 — manda lo que él dice. Acabado:
     aceite de tung (él). Maderas dictadas por él el mismo día, «en orden
     respectivo»: algarrobo, puy, teca y caoba — una por utensilio, en el orden
     en que se ven de izquierda a derecha en la foto 1. «Puy» con Y, como en
     los anillos. Maderas antes SIN marcar: son mixtas y
     nunca dijo cuál es cada una (el mismo pendiente que tiene el «Pack de
     utensilios» de prototipos.js, que sigue sin publicar). No es la ficha
     «posa-utensilios», que es otra pieza. */
  { slug:"set-de-utensilios",     carpeta:"Set de utensilios",      publicado:true,  titulo:{es:"Set de utensilios",en:"Utensil set"},                   anio:2026, anio_estimado:false, tipo:"cocina",     materiales:["algarrobo","puy","teca","caoba"], acabado:["tung"], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/set-de-utensilios-foto-1.webp", es_render:false, galeria:["img/trabajos/set-de-utensilios-foto-2.webp"], video:null },
  { slug:"mueble-espejo",        carpeta:"Baño Ery",               publicado:true,  titulo:{es:"Mueble de espejo",en:"Mirror cabinet"},                 anio:2025, anio_estimado:false, tipo:"gabinete",   materiales:["melamina","espejo"], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/bano-ery-espejo-foto-1.webp", es_render:false, galeria:[], video:null },
  { slug:"rampa",                 carpeta:"Rampa alberto",          publicado:false, titulo:{es:"Rampa",en:"Ramp"},                                      anio:2026, anio_estimado:true, tipo:"otro",       materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/rampa-alberto.webp",          es_render:true, galeria:[], video:null },
  { slug:"meson-trabajo",         carpeta:"MT Estefania",           publicado:true,  titulo:{es:"Mesón de patronaje",en:"Pattern-making counter"},                   anio:2026, anio_estimado:false, tipo:"taller",     materiales:["okume"], acabado:["poliuretano"], medidas:"222 × 97 × 81 cm", resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/mt-estefania-foto-1.webp", es_render:false, galeria:["img/trabajos/mt-estefania-foto-2.webp","img/trabajos/mt-estefania-foto-3.webp","img/trabajos/mt-estefania-foto-4.webp","img/trabajos/mt-estefania-foto-5.webp","img/trabajos/mt-estefania-foto-6.webp"], video:"video/mt-estefania.mp4" },
  { slug:"banco-de-trabajo",      carpeta:"Workbench",              publicado:false, titulo:{es:"Banco de trabajo",en:"Workbench"},                      anio:2024, anio_estimado:true, tipo:"taller",     materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/workbench.webp",              es_render:true, galeria:[], video:null },
  { slug:"el-taller",             carpeta:"Taller",                 publicado:false, titulo:{es:"El taller",en:"The workshop"},                          anio:2026, anio_estimado:true, tipo:"taller",     materiales:[], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:"img/trabajos/taller.webp",                 es_render:true, galeria:[], video:null },
  { slug:"toldo-taller",          carpeta:"Toldo Taller",           publicado:false, titulo:{es:"Toldo del taller",en:"Shop awning"},                    anio:2026, anio_estimado:true, tipo:"exterior",   materiales:["acero"], acabado:[], medidas:null, resumen:{es:"",en:""}, como:{es:[],en:[]}, imagen:null, es_render:true, galeria:[], video:null }

];

/* 14/09/2026 · Aquí hubo una lista fija, window.ORDEN_TRABAJOS, con un orden
   aleatorio de prueba sacado una sola vez. Ya no hace falta: desde el mismo
   día js/sitio.js BARAJA la Exhibición en cada carga (pedido suyo). El orden
   de este archivo sigue mandando en la portada y en Novedades. */
