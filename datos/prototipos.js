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
    /* Plano de cotas. Las medidas salen del MODELO 3D: era el
       único sitio donde existían. Ver js/diagramas.js. */
    /* Plano generado (14/08/2026) por Herramientas/plano-tecnico.py a
       partir de la GEOMETRIA del .obj exportado de SketchUp, no trazado
       a mano: las cotas 56/21/24 y 47/18/24 salen medidas de la malla.
       Negro sobre transparente; el modo oscuro lo invierte por CSS.
       El .png anterior (Nano Banana) sigue en la carpeta por si acaso. */
    plano_img: "img/prototipos/base-alta-plano.svg",
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
       que conservar las dos carpetas o el samán sale sin vetas.

       Y por eso mismo el samán salía con UNA PIEZA COLOR PINO:
       en esa carpeta compartida, el `__.jpg` —que es como
       SketchUp llama a los materiales sin nombre— lo había
       pisado el del pino. Arreglado el 14/08/2026 apuntando esa
       pieza a `material_3.jpg`. Si se reexporta, comprueba el
       color: cada .dae debe usar SU carpeta y ninguna otra. */
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
        { id: "saman", etiqueta: { es: "Samán", en: "Monkeypod" }, delta: 5, stock: 2 }
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
    diagrama: "base-baja",
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
      /* Desde el 14/08/2026 el apamate tiene su propio archivo, del
         .skp "Base Baja de Laptop Apamate": ya no hay que suponer
         que el genérico era el apamate. Y viene del export CON
         VETA, así que la madera va orientada como en el modelo. */
      apamate: "modelos/base-baja-de-laptop-apamate.glb",
      saman:   "modelos/base-baja-de-laptop-saman.glb"
    },

    opciones: [{
      id: "madera",
      etiqueta: { es: "Madera", en: "Wood" },
      valores: [
        { id: "apamate", etiqueta: { es: "Apamate", en: "Apamate" }, delta: 0, stock: 3 },
        { id: "saman",   etiqueta: { es: "Samán",   en: "Monkeypod" },   delta: 0, stock: 2 }
      ]
    }]
  },

  {
    slug: "tabla-picar",
    publicado: true,
    disponibilidad: "stock",
    /* En singular y sin el paréntesis de tamaños (él,
       14/08/2026): los tamaños ya se escogen en las opciones. */
    nombre:  { es: "Tabla de picar clásica", en: "Classic cutting board" },
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
    /* Un plano por talla: el diagrama cambia con el tamaño. */
    opcion_diagrama: "tamano",
    diagrama_por: { s: "tabla-s", m: "tabla-m", l: "tabla-l" },

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
    diagrama: "butcher-l",
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
    diagrama: "butcher-xl",
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
    galeria: [
      "img/prototipos/comedero-pequeno-2.png",
      "img/prototipos/comedero-pequeno-3.jpg"   /* foto, con fondo */
    ],

    /* Modelo exportado el 13/08/2026 y convertido el 14. Es el
       comedero PEQUEÑO: el grande no tiene .skp, así que esa
       ficha sigue sin 3D. */
    modelo3d: "modelos/comedero-mascota.glb"
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
    /* En la carpeta el proyecto se llama "Gancho Ery" (decisión
       suya el 14/08/2026: la carpeta NO se renombra). En la
       página va sin nombre de cliente, como todo el catálogo.
       Por eso el modelo 3D se sigue sirviendo como
       modelos/gancho-ery.glb. */
    slug: "gancho-pared",
    publicado: true,
    disponibilidad: "pedido",
    plazo_semanas: 3,
    nombre:  { es: "Gancho de pared", en: "Wall hook" },
    resumen: {
      es: "Bandeja y peine de cuatro dientes en una sola pieza. Deja las llaves donde se ven y cuelga lo que haga falta debajo.",
      en: "A tray and a four-tooth comb in one piece. Keeps your keys in plain sight and hangs whatever else you need underneath."
    },
    precio_usd: 40,          /* Él, 14/08/2026. Sin stock. */
    peso: 0.6,               /* RELLENO */

    /* Dos vistas de la misma pieza (confirmado por él): la de
       tres cuartos y la de las placas, que enseña la ranura y el
       tamaño en la mano. */
    imagen: "img/prototipos/gancho-pared-1.png",
    sin_fondo: true,
    /* La 1 y la 2 son recortes sin fondo; la 3 y la 4 son fotos
       normales que agregó el 14/08/2026, y van en su orden detrás.
       OJO: `sin_fondo` es del producto entero, así que estas dos
       se pintan encajadas igual, con su fondo. */
    galeria: [
      "img/prototipos/gancho-pared-2.png",
      "img/prototipos/gancho-pared-3.jpg",
      "img/prototipos/gancho-pared-4.jpg"
    ],
    video: "video/gancho-pared.mp4",
    modelo3d: "modelos/gancho-ery.glb"
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
        { id: "saman", etiqueta: { es: "Samán", en: "Monkeypod" }, delta: 20 },
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
        { id: "saman",   etiqueta: { es: "Samán",   en: "Monkeypod" },   delta: 0 }
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

    /* Stock por COMBINACIÓN de pack y madera, no por pack a secas.
       Hace falta `stock_matriz` porque `stockDe()` sin ella mira
       solo el PRIMER grupo de opciones: si se acaba el pino, la
       página lo seguiría ofreciendo. Ojo, esto NO convierte el
       precio en matriz — ese sigue saliendo del `precio` del
       pack, que es igual en las dos maderas (él, 14/08/2026). */
    stock_matriz: {          /* RELLENO, repartido del stock viejo */
      "p5|pino": 3, "p5|saman": 3,
      "p20|pino": 2, "p20|saman": 1
    },

    /* Fotos sin fondo del 14/08/2026. La portada es la que
       enseña las dos maderas juntas y va apaisada, que es lo que
       le sienta a la cuadrícula; las otras dos son el pack de 5
       en cada madera.
       OJO: las fotos delatan DOS maderas (una clara y una
       oscura) que el producto todavía no ofrece como opción.
       Pendiente de que él diga si se escoge o si va surtido. */
    imagen: "img/prototipos/bases-foto-1.png",
    sin_fondo: true,
    /* La portada enseña las dos maderas juntas y se queda fija;
       dentro del panel la foto cambia con la madera escogida.
       En la cuadrícula salen las tres igual, porque `imagen`
       se cuela delante de las de `imagen_por`. */
    opcion_visual: "madera",
    imagen_por: {
      pino:  "img/prototipos/bases-foto-2.png",
      saman: "img/prototipos/bases-foto-3.png"
    },
    /* La de ambiente va al final y sale con las dos maderas.
       OJO: esta SÍ trae fondo, al revés que las otras tres, pero
       `sin_fondo` es del producto entero y no de cada foto. Se
       pinta igual, encajada sin recuadro. */
    galeria: ["img/prototipos/bases-foto-4.png"],

    /* El proyecto se renombró de "Bases Boda" a "Bases de Foto"
       el 14/08/2026, y con él el .skp, el .dae y este .glb. */
    /* Un modelo por madera desde el 14/08/2026: exportó también el
       samán ("Bases de Foto Samán.skp"). El sin sufijo es el pino. */
    modelo_por: {
      pino:  "modelos/bases-de-foto.glb",
      saman: "modelos/bases-de-foto-saman.glb"
    },

    opciones: [{
      id: "pack",
      etiqueta: { es: "Tamaño del pack", en: "Pack size" },
      valores: [
        /* STOCK DE RELLENO, como el del resto. */
        /* El stock ya no vive aquí sino en `stock_matriz`. */
        { id: "p5",  etiqueta: { es: "Pack de 5",  en: "Pack of 5" },  precio: 5,  unidades: 5 },
        { id: "p20", etiqueta: { es: "Pack de 20", en: "Pack of 20" }, precio: 15, unidades: 20 }
      ]
    }, {
      /* Mismo precio en las dos maderas (él, 14/08/2026), así que
         ningún valor lleva delta. La clara de las fotos es el
         pino y la oscura el samán. */
      id: "madera",
      etiqueta: { es: "Madera", en: "Wood" },
      valores: [
        { id: "pino",  etiqueta: { es: "Pino",  en: "Pine" } },
        { id: "saman", etiqueta: { es: "Samán", en: "Monkeypod" } }
      ]
    }]
  }
];
