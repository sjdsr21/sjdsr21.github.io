/* ============================================================
   PROTOTIPOS — la colección de diseño propio
   ------------------------------------------------------------
   Esto NO es lo mismo que TIENDA (datos/tienda.js). Aquella son
   muebles por encargo que salieron de trabajos de cliente. Esta
   es la línea propia: se compra por catálogo, tiene stock, y se
   arma un pedido que termina en WhatsApp.

   Va en archivo aparte porque el precio funciona distinto:
   aquí puede depender de DOS opciones a la vez (una tabla de
   picar L en algarrobo no cuesta lo mismo que una L en teca), y
   eso no cabe en el esquema de "delta" de tienda.js.

   PRECIOS: los suyos, confirmados el 11/08/2026.
   STOCK, PESO y MEDIDAS: de relleno donde dice RELLENO.

   Cómo se fija el precio, dos formas:
     precio_usd + delta      cuando la madera suma parejo
     matriz                  cuando dependen dos opciones
   ============================================================ */

window.PROTOTIPOS = [

  /* ==========  CON STOCK  ================================== */

  {
    slug: "base-laptop-alta",
    publicado: true,
    disponibilidad: "stock",
    nombre:  { es: "Base de laptop — alta", en: "Laptop stand — tall" },
    resumen: {
      es: "Eleva la pantalla a la altura de los ojos. Para trabajar con teclado aparte, sin encorvarte.",
      en: "Raises the screen to eye level. For working with a separate keyboard, without hunching over."
    },
    precio_usd: 60,
    peso: 1.4,               /* RELLENO — sale del modelo 3D */

    /* Fotos recortadas sin fondo (PNG con transparencia). Salen de
       los "sin fondo" que él exportó, pasados por
       Herramientas\Recortar-transparencia.ps1, que les quita el
       margen vacío y las encoge.
       `imagen` es la de la cuadrícula; `imagen_por` cambia con la
       madera dentro del panel. */
    imagen: "img/prototipos/base-alta-saman.png",
    sin_fondo: true,
    imagen_por: {
      pino:  "img/prototipos/base-alta-pino.png",
      saman: "img/prototipos/base-alta-saman.png"
    },

    /* Modelo 3D POR VARIANTE: al cambiar de madera cambia el
       modelo que se ve. La clave es el id del valor de la opción
       marcada como "visual" (abajo, opcion_visual).

       Salen de Convertir-modelos.ps1 sobre los .dae que exportó
       el 11/08/2026. OJO: el .dae del samán apunta a la carpeta
       de texturas `base-alta-de-laptop/` (sin sufijo), no a
       `base-alta-de-laptop-saman/`. Si se vuelve a exportar, hay
       que conservar las dos carpetas o el samán sale sin vetas. */
    opcion_visual: "madera",
    modelo_por: {
      pino:  "modelos/base-alta-de-laptop-pino.glb",
      saman: "modelos/base-alta-de-laptop-saman.glb"
    },

    opciones: [{
      id: "madera",
      etiqueta: { es: "Madera", en: "Wood" },
      valores: [
        { id: "pino",  etiqueta: { es: "Pino",  en: "Pine" },  delta: 0, stock: 3 },
        { id: "saman", etiqueta: { es: "Samán", en: "Samán" }, delta: 5, stock: 2 }
      ]
    }]
  },

  {
    slug: "base-laptop-baja",
    publicado: true,
    disponibilidad: "stock",
    nombre:  { es: "Base de laptop — baja", en: "Laptop stand — low" },
    resumen: {
      es: "Inclina el equipo y le da aire por debajo. Se sigue escribiendo en el teclado del portátil.",
      en: "Tilts the machine and lets it breathe underneath. You keep typing on the laptop's own keyboard."
    },
    /* Las dos maderas al mismo precio (él, 12/08/2026): apamate y
       samán cuestan lo mismo, 55. Por eso ningún valor lleva
       delta. */
    precio_usd: 55,
    peso: 1.1,               /* RELLENO */

    imagen: "img/prototipos/base-baja-saman.png",
    sin_fondo: true,
    imagen_por: {
      /* Solo hay foto del samán. El apamate se queda con la misma
         hasta que la haya: es el mismo diseño, distinta madera. */
      apamate: "img/prototipos/base-baja-saman.png",
      saman:   "img/prototipos/base-baja-saman.png"
    },

    /* Modelos 3D exportados el 12/08/2026. El .dae SIN sufijo es
       el primero que exportó; se toma como el apamate. Si al
       verlo resulta ser el otro, se cambia aquí y ya. */
    opcion_visual: "madera",
    modelo_por: {
      apamate: "modelos/base-baja-de-laptop.glb",
      saman:   "modelos/base-baja-de-laptop-saman.glb"
    },

    opciones: [{
      id: "madera",
      etiqueta: { es: "Madera", en: "Wood" },
      valores: [
        { id: "apamate", etiqueta: { es: "Apamate", en: "Apamate" }, delta: 0, stock: 3 },
        { id: "saman",   etiqueta: { es: "Samán",   en: "Samán" },   delta: 0, stock: 2 }
      ]
    }]
  },

  {
    slug: "tabla-picar",
    publicado: true,
    disponibilidad: "stock",
    nombre:  { es: "Tabla de picar", en: "Cutting board" },
    resumen: {
      es: "Veta a lo largo, cantos suavizados y buen espesor. Ese grosor de más es lo que evita que se tuerza con los años.",
      en: "Long grain, eased edges and generous thickness. That extra thickness is what keeps it from warping over the years."
    },
    matriz: {
      "s|teca": 30, "m|teca": 45, "l|teca": 60,
      "s|puy":  30, "m|puy":  45, "l|puy":  60,
      "s|algarrobo": 40, "m|algarrobo": 60, "l|algarrobo": 80
    },
    stock_matriz: {          /* RELLENO */
      "s|teca": 3, "m|teca": 2, "l|teca": 2,
      "s|puy":  0, "m|puy":  1, "l|puy":  0,
      "s|algarrobo": 0, "m|algarrobo": 0, "l|algarrobo": 1
    },
    peso_por: { s: 1.2, m: 2.6, l: 4.8 },   /* RELLENO */

    imagen: "img/prototipos/tabla-de-picar.png",
    sin_fondo: true,

    /* Aquí el modelo cambia con el TAMAÑO, no con la madera: solo
       exportó las tres tallas en teca. Por eso opcion_visual es
       "tamano" y no "madera" como en las bases de laptop. */
    opcion_visual: "tamano",
    modelo_por: {
      s: "modelos/tabla-de-picar-teca-talla-s.glb",
      m: "modelos/tabla-de-picar-teca-talla-m.glb",
      l: "modelos/tabla-de-picar-teca-talla-l.glb"
    },

    opciones: [
      {
        id: "tamano",
        etiqueta: { es: "Tamaño", en: "Size" },
        valores: [
          { id: "s", etiqueta: { es: "S", en: "S" }, nota: { es: "30 × 20 × 2,5 cm", en: "30 × 20 × 2.5 cm" } },
          { id: "m", etiqueta: { es: "M", en: "M" }, nota: { es: "45 × 30 × 3,5 cm", en: "45 × 30 × 3.5 cm" } },
          { id: "l", etiqueta: { es: "L", en: "L" }, nota: { es: "60 × 40 × 3,5 cm", en: "60 × 40 × 3.5 cm" } }
        ]
      },
      {
        id: "madera",
        etiqueta: { es: "Madera", en: "Wood" },
        valores: [
          { id: "teca",      etiqueta: { es: "Teca",      en: "Teak" } },
          { id: "puy",       etiqueta: { es: "Puy",       en: "Puy" } },
          { id: "algarrobo", etiqueta: { es: "Algarrobo", en: "Carob" } }
        ]
      }
    ]
  },

  {
    slug: "butcher-block-l",
    publicado: true,
    destacado: true,
    disponibilidad: "stock",
    nombre:  { es: "Butcher Block L", en: "Butcher Block L" },
    resumen: {
      es: "Veta vertical: el cuchillo entra entre las fibras en vez de cortarlas. No marca, no desafila y aguanta años de uso diario.",
      en: "End grain: the knife slips between the fibres instead of cutting them. It doesn't scar, doesn't dull the blade, and takes years of daily use."
    },
    precio_usd: 160,
    peso: 7.5,               /* RELLENO */
    medidas: { es: "60 × 40 × 4 cm", en: "60 × 40 × 4 cm" },

    imagen: "img/prototipos/butcher-block.png",
    sin_fondo: true,
    /* Una sola madera, así que el modelo va directo y no por
       variante como en las bases de laptop. */
    modelo3d: "modelos/butcher-block-l.glb",

    opciones: [{
      id: "madera",
      etiqueta: { es: "Madera", en: "Wood" },
      valores: [{ id: "teca", etiqueta: { es: "Teca", en: "Teak" }, delta: 0, stock: 1 }]
    }]
  },

  /* ==========  POR ENCARGO  ================================ */

  {
    slug: "butcher-block-xl",
    publicado: true,
    disponibilidad: "pedido",
    plazo_semanas: 3,
    nombre:  { es: "Butcher Block XL", en: "Butcher Block XL" },
    resumen: {
      es: "La misma construcción de veta vertical, en tamaño de cocina que se usa de verdad. Superficie de trabajo, no de adorno.",
      en: "The same end-grain build, in a kitchen size meant to actually be used. A work surface, not an ornament."
    },
    precio_usd: 250,
    peso: 12,                /* RELLENO */
    medidas: { es: "70 × 50 × 4 cm", en: "70 × 50 × 4 cm" },
    opciones: [{
      id: "madera",
      etiqueta: { es: "Madera", en: "Wood" },
      valores: [{ id: "teca", etiqueta: { es: "Teca", en: "Teak" }, delta: 0 }]
    }]
  },

  {
    slug: "comedero-pequeno",
    publicado: true,
    disponibilidad: "pedido",
    plazo_semanas: 3,
    nombre:  { es: "Comedero pequeño", en: "Pet feeder — small" },
    resumen: {
      es: "Para gatos o perros de talla chica. Levanta los envases del piso y los mantiene en su sitio.",
      en: "For cats or small dogs. Lifts the bowls off the floor and keeps them from sliding around."
    },
    precio_usd: 50,
    peso: 1.8,               /* RELLENO */

    /* Dos fotos: la de portada de tres cuartos y una de perfil,
       que es donde se ve el cruce de las patas. La segunda entra
       por `galeria`, así que sale como segunda miniatura. */
    imagen: "img/prototipos/comedero-pequeno-1.png",
    sin_fondo: true,
    galeria: ["img/prototipos/comedero-pequeno-2.png"]
  },

  {
    slug: "comedero-grande",
    publicado: true,
    disponibilidad: "pedido",
    plazo_semanas: 3,
    nombre:  { es: "Comedero grande", en: "Pet feeder — large" },
    resumen: {
      es: "Para perros grandes. A la altura que les evita agacharse a comer.",
      en: "For large dogs. At the height that saves them from stooping to eat."
    },
    precio_usd: 75,
    peso: 3.2                /* RELLENO */
  },

  {
    slug: "tumbona",
    publicado: true,
    disponibilidad: "pedido",
    plazo_semanas: 4,
    nombre:  { es: "Tumbona", en: "Lounger" },
    resumen: {
      es: "Silla larga de exterior. Listones separados para que el agua corra y la madera respire.",
      en: "Outdoor lounge chair. Spaced slats so water runs off and the wood breathes."
    },
    precio_usd: 200,
    peso: 14,                /* RELLENO */
    opciones: [{
      id: "madera",
      etiqueta: { es: "Madera", en: "Wood" },
      valores: [
        { id: "pino", etiqueta: { es: "Pino", en: "Pine" }, delta: 0 },
        { id: "teca", etiqueta: { es: "Teca", en: "Teak" }, delta: 50 }
      ]
    }]
  },

  {
    slug: "banquito",
    publicado: true,
    disponibilidad: "pedido",
    plazo_semanas: 3,
    nombre:  { es: "Banquito", en: "Stool" },
    resumen: {
      es: "Asiento bajo de diseño propio. Sirve de silla, de mesa auxiliar o de escalón.",
      en: "A low seat of my own design. Works as a chair, a side table or a step."
    },
    precio_usd: 140,
    peso: 4.5,               /* RELLENO */
    opciones: [{
      id: "madera",
      etiqueta: { es: "Madera", en: "Wood" },
      valores: [
        { id: "pino",  etiqueta: { es: "Pino",  en: "Pine" },  delta: 0 },
        { id: "saman", etiqueta: { es: "Samán", en: "Samán" }, delta: 20 },
        { id: "cedro", etiqueta: { es: "Cedro", en: "Cedar" }, delta: 20 },
        { id: "teca",  etiqueta: { es: "Teca",  en: "Teak" },  delta: 20 }
      ]
    }]
  },

  {
    slug: "utensilios",
    publicado: true,
    disponibilidad: "pedido",
    plazo_semanas: 4,
    nombre:  { es: "Pack de utensilios", en: "Utensil set" },
    resumen: {
      es: "Cuatro piezas de cocina en maderas mixtas. Cada una en la especie que mejor le sienta al uso.",
      en: "Four kitchen pieces in mixed woods. Each one in the species that suits its job best."
    },
    precio_usd: 100,
    peso: 0.8,               /* RELLENO */
    pack: 4,
    palabra_pack: { es: "utensilios", en: "utensils" },
    /* PENDIENTE: él quiere que la descripción diga de qué madera
       es cada uno de los cuatro. Todavía no lo especificó. */
    pendiente: "Falta decir de qué madera es cada utensilio."
  },

  {
    slug: "lampara",
    publicado: true,
    disponibilidad: "pedido",
    plazo_semanas: 3,
    nombre:  { es: "Lámpara", en: "Lamp" },
    resumen: {
      es: "Luz difusa a través de la madera. Enciende el ambiente sin encandilar.",
      en: "Diffused light through wood. Lights the room without glaring."
    },
    precio_usd: 90,
    peso: 2.2,               /* RELLENO */
    opciones: [{
      id: "madera",
      etiqueta: { es: "Madera", en: "Wood" },
      valores: [
        { id: "apamate", etiqueta: { es: "Apamate", en: "Apamate" }, delta: 0 },
        { id: "saman",   etiqueta: { es: "Samán",   en: "Samán" },   delta: 0 }
      ]
    }]
  },

  {
    slug: "bases-foto",
    publicado: true,
    /* Pasó a stock el 13/08/2026. En la carpeta el proyecto se
       llama "Bases Boda" (de ahí sale el modelo), pero en la
       página son las bases para foto. */
    disponibilidad: "stock",
    nombre:  { es: "Bases para foto", en: "Photo risers" },
    resumen: {
      es: "Piecitas para montar producto o fotografía de mesa. Se venden por pack.",
      en: "Small blocks for staging product or tabletop photography. Sold in packs."
    },
    peso_por_pack: { p5: 0.35, p20: 1.3 },   /* RELLENO */
    palabra_pack: { es: "bases", en: "risers" },

    /* Sin foto todavía — él la debe. Mientras tanto queda el
       recuadro rayado, y el 3D sí se puede ver. */
    modelo3d: "modelos/bases-boda.glb",

    opciones: [{
      id: "pack",
      etiqueta: { es: "Tamaño del pack", en: "Pack size" },
      valores: [
        /* STOCK DE RELLENO, como el del resto. */
        { id: "p5",  etiqueta: { es: "Pack de 5",  en: "Pack of 5" },  precio: 5,  unidades: 5,  stock: 6 },
        { id: "p20", etiqueta: { es: "Pack de 20", en: "Pack of 20" }, precio: 15, unidades: 20, stock: 3 }
      ]
    }]
  }
];
