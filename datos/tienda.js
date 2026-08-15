/* ============================================================
   TIENDA — piezas propias y herramientas/insumos
   ------------------------------------------------------------
   Un solo archivo para las dos secciones. Lo que decide dónde
   aparece cada cosa es el campo "familia":

     familia: "pieza"        → página Piezas
     familia: "herramienta"  → página Herramientas e insumos

   La diferencia real entre las dos no es qué son, es cómo se
   compran. Una PIEZA se configura (madera, medidas), tiene
   plazo y el precio se mueve con las opciones. Una HERRAMIENTA
   tiene precio fijo y sale del taller ya hecha.

   ¡OJO! Todo lo que tiene ejemplo:true son inventados por mí
   para que veas la página funcionando. Los precios NO son
   tuyos. Bórralos o corrígelos antes de mostrarle esto a nadie.

   Campos:
     precio_usd     número. Precio base, sin opciones.
     opciones       cada opción suma o resta al precio base con
                    "delta". delta: 0 = no cambia el precio.
     disponibilidad "stock" | "pedido" | "agotado"
     plazo_semanas  solo si es "pedido". null = inmediato.
     stock          solo si es "stock". Número de unidades.
     categoria      solo herramientas. Clave de TEXTOS.categoria
   ============================================================ */

window.TIENDA = [

  /* ==========  PIEZAS  ==================================== */

  {
    slug: "quillas-tabla",
    familia: "pieza",
    ejemplo: false,
    publicado: true,
    destacado: true,
    nombre: { es: "Quillas de pared", en: "Wall board rests" },
    resumen: {
      es: "Un par de soportes tallados para colgar una tabla, una bandeja o una pieza plana en la pared. Sin herrajes a la vista.",
      en: "A pair of carved rests for hanging a board, tray or flat piece on the wall. No visible hardware."
    },
    precio_usd: 65,
    disponibilidad: "stock",   /* hay pares hechos, salen del taller ya */
    plazo_semanas: null,
    stock: 3,
    medidas: "26 × 18,5 × 4 cm",
    /* El modelo 3D se engancha solo por la carpeta del proyecto:
       en cuanto exista modelos/quillas-mariana.glb sale el botón. */
    carpeta: "Quillas Mariana",
    imagen: "img/trabajos/quillas-propuesta.jpg",
    es_render: true,
    galeria: [],
    video: null,
    opciones: [
      {
        id: "madera",
        etiqueta: { es: "Madera", en: "Wood" },
        valores: [
          { id: "saman", etiqueta: { es: "Samán", en: "Monkeypod" }, delta: 0 },
          { id: "pino",  etiqueta: { es: "Pino",  en: "Pine" },  delta: -15 },
          { id: "cedro", etiqueta: { es: "Cedro", en: "Cedar" }, delta: 20 }
        ]
      },
      {
        id: "acabado",
        etiqueta: { es: "Acabado", en: "Finish" },
        valores: [
          { id: "aceite",    etiqueta: { es: "Aceite de linaza", en: "Linseed oil" }, delta: 0 },
          { id: "crudo",     etiqueta: { es: "Crudo",            en: "Unfinished" },  delta: -10 },
          { id: "barnizado", etiqueta: { es: "Poliuretano",      en: "Polyurethane" }, delta: 15 }
        ]
      },
      {
        id: "montaje",
        etiqueta: { es: "Entrega", en: "Delivery" },
        valores: [
          { id: "retiro",  etiqueta: { es: "Retiro en el taller", en: "Pick up at the shop" }, delta: 0 },
          { id: "domicilio", etiqueta: { es: "Entrega y montaje en Caracas", en: "Delivery and mounting in Caracas" }, delta: 25 }
        ]
      }
    ],
    detalles: {
      es: [
        "Talladas en madera maciza de 4 cm, con todo el canto redondeado a mano.",
        "Montaje invisible sobre ranuras keyhole fresadas en la propia madera: colgadas no se ve ni un tornillo.",
        "Van cuatro tornillos con ramplug (dos por soporte). Pensadas para pared de ladrillo o concreto."
      ],
      en: [
        "Carved from 4 cm solid stock, every edge rounded over by hand.",
        "Invisible mounting on keyhole slots routed into the wood itself: hung, not a screw shows.",
        "Four screws with wall plugs (two per rest). Made for brick or concrete walls."
      ]
    }
  },

  {
    slug: "mesa-cubo",
    familia: "pieza",
    ejemplo: false,
    publicado: true,
    destacado: true,
    nombre: { es: "Mesa cubo cerámica", en: "Ceramic cube side table" },
    resumen: {
      es: "Cubo auxiliar de 43 cm, enchapado a mano pieza por pieza. Sirve de mesa de sala, de banqueta o de pedestal.",
      en: "A 43 cm auxiliary cube, tiled by hand one piece at a time. Works as a side table, a stool or a pedestal."
    },
    precio_usd: 350,
    disponibilidad: "pedido",
    plazo_semanas: 3,
    stock: null,
    medidas: "43 × 43 × 42 cm",
    carpeta: "Mesa Cubo Ceramica",
    imagen: "img/trabajos/mesa-cubo-propuesta.jpg",
    es_render: true,
    galeria: [],
    video: null,
    opciones: [
      {
        id: "superficie",
        etiqueta: { es: "Superficie", en: "Surface" },
        valores: [
          { id: "ceramica", etiqueta: { es: "Cerámica",           en: "Ceramic tile" }, delta: 0 },
          { id: "madera",   etiqueta: { es: "Madera barnizada",   en: "Varnished wood" }, delta: -90 }
        ]
      }
    ],
    detalles: {
      es: [
        "Núcleo estructural en contraenchapado de pino de 18 mm armado como caja cerrada: aguanta peso y no se pandea.",
        "Caras y tapa forradas en fibrocemento de 6 mm, que es lo que evita que el enchape trabaje y se agriete.",
        "El piso no lleva enchape: apoya directo sobre el contraenchapado sellado."
      ],
      en: [
        "Structural core in 18 mm pine plywood built as a closed box: it carries weight and won't bow.",
        "Faces and top clad in 6 mm fibre cement, which is what stops the tile from moving and cracking.",
        "The underside is left unclad, resting directly on sealed plywood."
      ]
    }
  },


  {
    slug: "repicero",
    familia: "pieza",
    ejemplo: false,   /* los precios de esta SI son tuyos, del pitch */
    publicado: true,
    destacado: true,
    nombre: { es: "Repicero de exhibición", en: "Display shelving unit" },
    resumen: {
      es: "Dos metros de repisa sobre columnas de pino macizo, tensadas en cruz por detrás. Las tres del medio suben y bajan entre siete alturas, sin herramientas.",
      en: "Two metres of shelf on solid pine columns, cross-braced from behind. The middle three move between seven heights, no tools needed."
    },
    precio_usd: 400,
    disponibilidad: "pedido",
    plazo_semanas: 3,
    stock: null,
    medidas: "200 × 180 × 43 cm",
    carpeta: "Repicero Estefania",
    imagen: "img/trabajos/repicero-propuesta.jpg",
    es_render: true,
    galeria: [],
    video: null,
    opciones: [
      {
        id: "acabado",
        etiqueta: { es: "Acabado", en: "Finish" },
        valores: [
          /* 400 y 550 salen de tu propia propuesta del 2026-08-04 */
          { id: "crudo",     etiqueta: { es: "Pino al natural", en: "Natural pine" }, delta: 0 },
          { id: "barnizado", etiqueta: { es: "Poliuretano",     en: "Polyurethane" }, delta: 150 }
        ]
      }
    ],
    detalles: {
      es: [
        "Dos columnas de pino macizo en listón de 4 × 4 cm, con travesaños cada 17,5 cm.",
        "Cinco repisas de dos metros en contraenchapado de pino de 15 mm, de 35 cm de fondo.",
        "Tensores de guaya de acero en cruz por detrás, con templadores: son los que la mantienen a escuadra y sin bamboleo.",
        "Sin acabado, el pino toma con el tiempo un tono más dorado y es sensible a las manchas. Con el poliuretano queda sellado desde el primer día.",
        "La entrega en el sitio va incluida en los dos precios."
      ],
      en: [
        "Two solid pine columns in 4 × 4 cm stock, with rails every 17.5 cm.",
        "Five two-metre shelves in 15 mm pine plywood, 35 cm deep.",
        "Steel cable cross-braces at the back with turnbuckles: they're what keep it square and free of wobble.",
        "Left bare, the pine turns more golden over time and marks easily. With polyurethane it's sealed from day one.",
        "On-site delivery is included in both prices."
      ]
    }
  },

  {
    slug: "meson-mt",
    familia: "pieza",
    ejemplo: false,   /* precio real: hoja Proyectos, fila 49 */
    publicado: true,
    destacado: false,
    nombre: { es: "Mesón de patronaje", en: "Pattern-making counter" },
    resumen: { es: "", en: "" },
    precio_usd: 250,
    disponibilidad: "pedido",
    plazo_semanas: 3,
    stock: null,
    medidas: "222 × 97 × 81 cm",   /* medido sobre el modelo 3D */
    carpeta: "MT Estefania",
    imagen: "img/trabajos/meson-patronaje.jpg",
    es_render: true,
    galeria: [],
    video: null,
    opciones: [],
    detalles: { es: [], en: [] }
  },

  {
    slug: "consola",
    familia: "pieza",
    ejemplo: false,   /* precio real: hoja Proyectos, fila 42 */
    publicado: true,
    destacado: false,
    nombre: { es: "Consola mid-century", en: "Mid-century console" },
    resumen: { es: "", en: "" },
    precio_usd: 400,
    disponibilidad: "pedido",
    plazo_semanas: 3,
    stock: null,
    medidas: "152 × 60 × 43 cm",   /* medido sobre el modelo 3D */
    carpeta: "Consola Matias",
    imagen: "img/trabajos/consola-midcentury.jpg",
    es_render: true,
    galeria: [],
    video: null,
    opciones: [],
    detalles: { es: [], en: [] }
  },


  /* ==========  HERRAMIENTAS E INSUMOS  ==================== */

  {
    slug: "limpiador-madera",
    familia: "herramienta",
    categoria: "insumo",
    ejemplo: true,
    publicado: false,   /* inventado por mí y sin foto: fuera hasta que exista */
    destacado: true,
    nombre: { es: "Limpiador para madera barnizada", en: "Cleaner for varnished wood" },
    resumen: {
      es: "Para el mantenimiento del día a día de una superficie sellada o barnizada. No deja película ni opaca el acabado.",
      en: "For day-to-day upkeep of a sealed or varnished surface. Leaves no film and won't dull the finish."
    },
    precio_usd: 12,
    disponibilidad: "stock",
    plazo_semanas: null,
    stock: 8,
    medidas: "500 ml",
    imagen: null,
    es_render: false,
    galeria: [],
    video: null,
    opciones: [],
    detalles: {
      es: ["Escribe aquí de qué está hecho, cada cuánto usarlo y sobre qué acabados sí y sobre cuáles no."],
      en: ["Write here what it's made of, how often to use it, and which finishes it does and doesn't suit."]
    }
  },

  {
    slug: "esquineros-marcos",
    familia: "herramienta",
    categoria: "herramienta",
    ejemplo: true,
    publicado: false,   /* inventado por mí y sin foto: fuera hasta que exista */
    destacado: false,
    nombre: { es: "Esquineros para prensar marcos", en: "Corner clamps for frames" },
    resumen: {
      es: "Cuatro esquineros que sujetan un marco a escuadra mientras el encolado fragua. Se tensan con una sola guaya.",
      en: "Four corner blocks that hold a frame square while the glue sets. Tensioned with a single cable."
    },
    precio_usd: 28,
    disponibilidad: "stock",
    plazo_semanas: null,
    stock: 4,
    medidas: null,
    imagen: null,
    es_render: false,
    galeria: [],
    video: null,
    opciones: [
      {
        id: "juego",
        etiqueta: { es: "Juego", en: "Set" },
        valores: [
          { id: "4", etiqueta: { es: "4 esquineros", en: "4 corners" }, delta: 0 },
          { id: "8", etiqueta: { es: "8 esquineros", en: "8 corners" }, delta: 22 }
        ]
      }
    ],
    detalles: {
      es: ["Escribe aquí el material, hasta qué grosor de marco aguantan y qué trae el juego."],
      en: ["Write here the material, the maximum frame thickness they take, and what the set includes."]
    }
  },

  {
    slug: "bandejas-gaveta",
    familia: "herramienta",
    categoria: "impreso3d",
    ejemplo: true,
    publicado: false,   /* inventado por mí y sin foto: fuera hasta que exista */
    destacado: true,
    nombre: { es: "Bandejas organizadoras para gaveta", en: "Drawer organiser trays" },
    resumen: {
      es: "Bandejas impresas en 3D que se encajan entre sí para dividir cualquier gaveta. Se combinan según lo que guardes.",
      en: "3D-printed trays that lock into each other to divide any drawer. Combine them to suit what you keep."
    },
    precio_usd: 9,
    disponibilidad: "stock",
    plazo_semanas: null,
    stock: 20,
    medidas: { es: "10 × 10 cm por módulo", en: "10 × 10 cm per module" },
    imagen: null,
    es_render: false,
    galeria: [],
    video: null,
    opciones: [
      {
        id: "tamano",
        etiqueta: { es: "Módulo", en: "Module" },
        valores: [
          { id: "1x1", etiqueta: { es: "1 × 1", en: "1 × 1" }, delta: 0 },
          { id: "1x2", etiqueta: { es: "1 × 2", en: "1 × 2" }, delta: 5 },
          { id: "2x2", etiqueta: { es: "2 × 2", en: "2 × 2" }, delta: 11 }
        ]
      },
      {
        id: "color",
        etiqueta: { es: "Color", en: "Colour" },
        valores: [
          { id: "negro",  etiqueta: { es: "Negro",  en: "Black" }, delta: 0 },
          { id: "blanco", etiqueta: { es: "Blanco", en: "White" }, delta: 0 },
          { id: "madera", etiqueta: { es: "Símil madera", en: "Wood-look" }, delta: 2 }
        ]
      }
    ],
    detalles: {
      es: ["Escribe aquí el material de impresión, si aguanta lavado y cómo se encajan entre ellas."],
      en: ["Write here the print material, whether they're washable, and how they lock together."]
    }
  },

  {
    slug: "lija-taller",
    familia: "herramienta",
    categoria: "insumo",
    ejemplo: true,
    publicado: false,   /* inventado por mí y sin foto: fuera hasta que exista */
    destacado: false,
    nombre: { es: "Lija de taller", en: "Shop sandpaper" },
    resumen: {
      es: "La lija que uso yo. Vendida por juego de granos, no suelta.",
      en: "The sandpaper I actually use. Sold as a grit set, not loose sheets."
    },
    precio_usd: 15,
    disponibilidad: "stock",
    plazo_semanas: null,
    stock: 12,
    medidas: null,
    imagen: null,
    es_render: false,
    galeria: [],
    video: null,
    opciones: [
      {
        id: "granos",
        etiqueta: { es: "Juego", en: "Set" },
        valores: [
          { id: "basico", etiqueta: { es: "80 · 120 · 180", en: "80 · 120 · 180" }, delta: 0 },
          { id: "fino",   etiqueta: { es: "180 · 220 · 320", en: "180 · 220 · 320" }, delta: 3 }
        ]
      }
    ],
    detalles: {
      es: ["Escribe aquí la marca, el tipo de grano y por qué esta y no otra."],
      en: ["Write here the brand, the abrasive type, and why this one over another."]
    }
  }

];
