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
    /* Acabado y uso dictados por él el 15/09/2026. `uso` es lista:
       una pieza puede servir para varias cosas. Ver TEXTOS.uso. */
    acabado: ["linaza", "cera"],
    uso: ["escritorio"],
    resumen: {
      es: "Eleva la pantalla entre 18 y 30 cm, hasta la altura de los ojos. Para trabajar con teclado aparte, sin encorvarte.",
      en: "Raises the screen by 18 to 30 cm, up to eye level. For working with a separate keyboard, without hunching over."
    },
    /* $60 -> $50 el 14/09/2026 (él). El samán sigue con +5, o sea $55. */
    precio_usd: 50,
    peso: 1.4,               /* RELLENO — sale del modelo 3D */

    /* Fotos recortadas sin fondo (PNG con transparencia). Salen de
       los "sin fondo" que él exportó, pasados por
       Herramientas\Recortar-transparencia.ps1, que les quita el
       margen vacío y las encoge.
       `imagen` es la de la cuadrícula; `imagen_por` cambia con la
       madera dentro del panel. */
    imagen: "img/prototipos/base-alta-saman.webp",
    sin_fondo: true,
    /* Plano de cotas. Las medidas salen del MODELO 3D: era el
       único sitio donde existían. Ver js/diagramas.js. */
    /* Plano generado (14/08/2026) por Herramientas/plano-tecnico.py a
       partir de la GEOMETRIA del .obj exportado de SketchUp, no trazado
       a mano: las cotas 56/21/24 y 47/18/24 salen medidas de la malla.
       Negro sobre transparente; el modo oscuro lo invierte por CSS.
       El .png anterior (Nano Banana) sigue en la carpeta por si acaso. */
    plano_img: "img/prototipos/base-alta-plano.svg",
    /* Isométrico con cotas, uno por madera (él, 14/09/2026): se SUMA al
       plano, no lo sustituye. Salen de capturar-isometrico.html con los
       .glb de modelo_por; el modelo está en la configuración BAJA, así
       que acota 24 × 20 × 18 cm. La versión -claro la elige srcTema(). */
    iso_img_por: {
      pino:  "img/prototipos/base-alta-pino-iso.webp",
      saman: "img/prototipos/base-alta-saman-iso.webp"
    },
    imagen_por: {
      pino:  "img/prototipos/base-alta-pino.webp",
      saman: "img/prototipos/base-alta-saman.webp"
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
      /* Stock REAL desde el 12/09/2026 (él): una unidad de cada madera,
         las de la ronda 1 de inventario. Los 3 y 2 de antes eran relleno. */
      valores: [
        { id: "pino",  etiqueta: { es: "Pino",  en: "Pine" },  delta: 0, stock: 1 },
        { id: "saman", etiqueta: { es: "Samán", en: "Monkeypod" }, delta: 5, stock: 1 }
      ]
    }]
  },

  {
    slug: "base-laptop-baja",
    publicado: true,
    disponibilidad: "stock",
    nombre:  { es: "Base de laptop — baja", en: "Laptop stand — low" },
    acabado: ["linaza", "cera"],
    uso: ["escritorio"],
    resumen: {
      es: "Eleva la pantalla entre 11 y 13 cm, inclina el equipo y le da aire por debajo. Puedes seguir escribiendo en el teclado de la laptop.",
      en: "Raises the screen by 11 to 13 cm, tilts the machine and lets it breathe underneath. You can keep typing on the laptop's own keyboard."
    },
    /* Las dos maderas al mismo precio (él, 12/08/2026): apamate y
       samán cuestan lo mismo, 55. Por eso ningún valor lleva
       delta. */
    /* $55 -> $50 el 14/09/2026 (él), igual en las dos maderas. */
    precio_usd: 50,
    peso: 1.1,               /* RELLENO */

    imagen: "img/prototipos/base-baja-saman.webp",
    sin_fondo: true,
    /* Plano generado (14/08/2026) por Herramientas/plano-tecnico.py desde la
       GEOMETRIA del .obj de SketchUp. El portatil NO estaba en ese .skp: se
       trajo del modelo de la base alta con Herramientas/montar-accesorio.py,
       movido como bloque rigido y con la tapa puesta a plomo (pedido suyo).
       `plano_img` gana a `diagrama`, que se deja como estaba por si hay que
       volver al esquema dibujado por codigo. */
    plano_img: "img/prototipos/base-baja-plano.svg",
    /* Isométrico con cotas por madera (14/09/2026), igual que la alta:
       24 × 23 × 11 cm medidos del modelo. */
    iso_img_por: {
      apamate: "img/prototipos/base-baja-apamate-iso.webp",
      saman:   "img/prototipos/base-baja-saman-iso.webp"
    },
    diagrama: "base-baja",
    imagen_por: {
      /* Solo hay foto del samán. El apamate se queda con la misma
         hasta que la haya: es el mismo diseño, distinta madera. */
      apamate: "img/prototipos/base-baja-saman.webp",
      saman:   "img/prototipos/base-baja-saman.webp"
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
      /* Stock REAL desde el 12/09/2026 (él): una unidad de cada madera,
         las de la ronda 1 de inventario. Los 3 y 2 de antes eran relleno. */
      valores: [
        { id: "apamate", etiqueta: { es: "Apamate", en: "Apamate" }, delta: 0, stock: 1 },
        { id: "saman",   etiqueta: { es: "Samán",   en: "Monkeypod" },   delta: 0, stock: 1 }
      ]
    }]
  },

  {
    slug: "tabla-picar",
    publicado: true,
    /* A POR ENCARGO el 14/09/2026 (él): no queda ninguna tabla hecha, stock
       real 0. Plazo 3 semanas, el de siempre. Para volver a stock: poner
       "stock" aquí y el stock real en stock_matriz. */
    disponibilidad: "pedido",
    plazo_semanas: 3,
    /* En singular y sin el paréntesis de tamaños (él,
       14/08/2026): los tamaños ya se escogen en las opciones. */
    nombre:  { es: "Tabla de picar clásica", en: "Classic cutting board" },
    acabado: ["tung"],
    uso: ["cocina"],
    resumen: {
      es: "Veta a lo largo, cantos suavizados y buen espesor. Acabado en aceite de tung, apto para uso alimentario: máxima durabilidad sin meterle a la tabla nada nocivo para la salud. La talla L viene sobre cuatro patas de goma.",
      en: "Long grain, eased edges and generous thickness. Finished in food-safe tung oil: maximum durability without putting anything harmful into the board. The L size comes on four rubber feet."
    },
    /* Lo que se ve en la CUADRÍCULA. Corta donde él dijo: hasta «apto
       para uso alimentario». El resto —lo del aceite y las patas de
       goma— sale al abrir el producto. */
    resumen_corto: {
      es: "Veta a lo largo, cantos suavizados y buen espesor. Acabado en aceite de tung, apto para uso alimentario.",
      en: "Long grain, eased edges and generous thickness. Finished in food-safe tung oil."
    },
    matriz: {
      "s|teca": 30, "m|teca": 45, "l|teca": 60,
      /* Puy sube por encima de teca (él, 07/09/2026). */
      "s|puy":  35, "m|puy":  55, "l|puy":  70,
      /* Algarrobo sube a 45 / 70 / 90 (él, 16/09/2026). */
      "s|algarrobo": 45, "m|algarrobo": 70, "l|algarrobo": 90
    },
    /* Stock REAL 0 el 14/09/2026 (él): no queda ninguna tabla hecha. */
    stock_matriz: {          /* REAL: 0 de todo */
      "s|teca": 0, "m|teca": 0, "l|teca": 0,
      "s|puy":  0, "m|puy":  0, "l|puy":  0,
      "s|algarrobo": 0, "m|algarrobo": 0, "l|algarrobo": 0
    },
    peso_por: { s: 1.2, m: 2.6, l: 4.8 },   /* RELLENO */

    imagen: "img/prototipos/tabla-de-picar.webp",
    sin_fondo: true,
    /* De SEGUNDA la foto de ambiente, «Tablas normales 1.png» (él,
       14/09/2026). Esta trae su fondo, al revés que la recortada de
       arriba; como en las bases de foto, `sin_fondo` es del producto
       entero y la pinta igual, encajada entera sobre fondo liso. */
    galeria: ["img/prototipos/tabla-de-picar-2.webp"],
    /* Un plano por talla: el diagrama cambia con el tamaño. */
    opcion_diagrama: "tamano",
    /* UNA lámina por talla, con SOLO esa talla: vista superior arriba y
       vista de canto abajo, que es donde se lee el espesor.
       Se probó dibujar las tres juntas para compararlas y se descartó
       (él, 15/08/2026): con tres tablas metidas en la caja de 505 px de
       la ficha, la letra de las cotas bajaba a 2,6 px y no se leía nada.
       La comparación de tamaños ya la da una foto suya. */
    /* 06/09/2026 · El plano técnico se sustituye por el ISOMÉTRICO
       con cotas. Decisión suya: para estas piezas el isométrico se
       entiende mejor que las vistas ortogonales. El plano de líneas
       se queda SOLO en las dos bases de laptop, donde hacen falta
       la vista lateral y las dos configuraciones.
       Sigue entrando por `plano_img`, que es el hueco de la tira que
       le corresponde; lo que cambió es el CSS, que ya no invierte en
       modo oscuro lo que no sea .svg — un render en color invertido
       salía con la madera azul. Ver css/prototipos.css. */
       plano_img_por: {
      s: "img/prototipos/tabla-iso-s.webp",
      m: "img/prototipos/tabla-iso-m.webp",
      l: "img/prototipos/tabla-iso-l.webp"
    },
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
          /* 4 cm de espesor, no 3,5 (el, 15/08/2026). El .skp de la L trae
             58,74 × 40 × 4,5 y NO cuadra con esto: manda la medida oficial,
             y el plano la lleva forzada. Queda pendiente corregir el modelo
             y reexportarlo. */
          { id: "l", etiqueta: { es: "L", en: "L" }, nota: { es: "60 × 40 × 4 cm", en: "60 × 40 × 4 cm" } }
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
    /* A POR ENCARGO el 14/09/2026 (él): solo las bases de laptop y las de
       foto quedan como disponibles. Plazo 3 semanas, igual que el XL. */
    disponibilidad: "pedido",
    plazo_semanas: 3,
    nombre:  { es: "Butcher Block L", en: "Butcher Block L" },
    acabado: ["tung"],
    uso: ["cocina"],
    resumen: {
      es: "Veta vertical: el cuchillo entra entre las fibras en vez de cortarlas. No marca, no desafila y aguanta años de uso diario. Va sobre cuatro patas de goma, que la despegan del mesón y la dejan agarrada mientras picas.",
      en: "End grain: the knife slips between the fibres instead of cutting them. It doesn't scar, doesn't dull the blade, and takes years of daily use. It sits on four rubber feet that lift it off the counter and keep it from sliding while you chop."
    },
    /* En la cuadrícula, hasta «aguanta años de uso diario» (él). Lo
       de las patas de goma queda para la ficha abierta. */
    resumen_corto: {
      es: "Veta vertical: el cuchillo entra entre las fibras en vez de cortarlas. No marca, no desafila y aguanta años de uso diario.",
      en: "End grain: the knife slips between the fibres instead of cutting them. It doesn't scar, doesn't dull the blade, and takes years of daily use."
    },
    precio_usd: 160,
    peso: 7.5,               /* RELLENO */
    medidas: { es: "60 × 40 × 4 cm", en: "60 × 40 × 4 cm" },

    imagen: "img/prototipos/butcher-block.webp",
    sin_fondo: true,
    /* 06/09/2026 · El plano técnico se sustituye por el ISOMÉTRICO
       con cotas. Decisión suya: para estas piezas el isométrico se
       entiende mejor que las vistas ortogonales. El plano de líneas
       se queda SOLO en las dos bases de laptop, donde hacen falta
       la vista lateral y las dos configuraciones.
       Sigue entrando por `plano_img`, que es el hueco de la tira que
       le corresponde; lo que cambió es el CSS, que ya no invierte en
       modo oscuro lo que no sea .svg — un render en color invertido
       salía con la madera azul. Ver css/prototipos.css. */
       plano_img: "img/prototipos/butcher-block-l-iso.webp",
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
   /* Fuera del catalogo el 16/08/2026 (el): quiere tener piezas
      hechas en el taller antes de ofrecerlo con seguridad. */
    publicado: false,
    disponibilidad: "pedido",
    plazo_semanas: 3,
    nombre:  { es: "Butcher Block XL", en: "Butcher Block XL" },
    /* Mismo acabado y uso que el L: él dijo «el butcher block» y son
       la misma pieza en dos tamaños. Este sigue sin publicar. */
    acabado: ["tung"],
    uso: ["cocina"],
    resumen: {
      /* La misma descripción que el Butcher Block L (él,
         15/08/2026): es la misma construcción, solo cambia el
         tamaño, y el tamaño ya sale en sus medidas. */
      es: "Veta vertical: el cuchillo entra entre las fibras en vez de cortarlas. No marca, no desafila y aguanta años de uso diario.",
      en: "End grain: the knife slips between the fibres instead of cutting them. It doesn't scar, doesn't dull the blade, and takes years of daily use."
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
    /* El paréntesis dice cuántos platos lleva (él, 07/09/2026): el
       pequeño es de dos y el grande de uno, y sin eso no se distinguen
       más que por el tamaño. */
    nombre:  { es: "Comedero pequeño (doble)", en: "Pet feeder — small (double)" },
    acabado: ["poliuretano"],
    uso: ["mascotas"],
    resumen: {
      es: "Para gatos o perros pequeños. Levanta los envases del piso, los mantiene en su sitio y mejora la postura de la mascota al comer.",
      en: "For cats or small dogs. Lifts the bowls off the floor, keeps them in place and improves your pet's posture while it eats."
    },
    precio_usd: 50,
    peso: 1.8,               /* RELLENO */

    /* Dos fotos: la de portada de tres cuartos y una de perfil,
       que es donde se ve el cruce de las patas. La segunda entra
       por `galeria`, así que sale como segunda miniatura. */
    imagen: "img/prototipos/comedero-pequeno-1.webp",
    /* 06/09/2026 · El plano técnico se sustituye por el ISOMÉTRICO
       con cotas. Decisión suya: para estas piezas el isométrico se
       entiende mejor que las vistas ortogonales. El plano de líneas
       se queda SOLO en las dos bases de laptop, donde hacen falta
       la vista lateral y las dos configuraciones.
       Sigue entrando por `plano_img`, que es el hueco de la tira que
       le corresponde; lo que cambió es el CSS, que ya no invierte en
       modo oscuro lo que no sea .svg — un render en color invertido
       salía con la madera azul. Ver css/prototipos.css. */
       plano_img: "img/prototipos/comedero-pequeno-iso.webp",
    sin_fondo: true,
    galeria: [
      "img/prototipos/comedero-pequeno-2.webp",
      "img/prototipos/comedero-pequeno-3.webp"   /* foto, con fondo */
    ],

    /* Modelo exportado el 13/08/2026 y convertido el 14. Es el
       comedero PEQUEÑO: el grande no tiene .skp, así que esa
       ficha sigue sin 3D. */
    modelo3d: "modelos/comedero-mascota.glb",

    /* Lleva las DOS maderas combinadas en la misma pieza (él,
       07/09/2026), no una a elegir: por eso es un solo valor y no dos.
       Se muestra igual, para que se vea de qué está hecho. */
    opciones: [{
      id: "madera",
      etiqueta: { es: "Madera", en: "Wood" },
      /* «Apamate, Puy» con COMA y no con «y» (él, 15/09/2026). La coma
         es la marca de que las dos maderas van juntas en la pieza; el
         punto y coma, la de que hay que elegir una. Ver datosHTML en
         js/prototipos.js. */
      valores: [ { id: "apamate-puy", etiqueta: { es: "Apamate, Puy", en: "Apamate, Puy" } } ]
    }]
  },

  {
    slug: "comedero-grande",
    publicado: true,
    disponibilidad: "pedido",
    plazo_semanas: 3,
    nombre:  { es: "Comedero grande (individual)", en: "Pet feeder — large (single)" },
    acabado: ["poliuretano"],
    uso: ["mascotas"],
    resumen: {
      es: "Para perros grandes. Levanta los envases del piso, los mantiene en su sitio y mejora la postura de la mascota al comer.",
      en: "For large dogs. Lifts the bowls off the floor, keeps them in place and improves your pet's posture while it eats."
    },
    /* 45 y no 75 (él, 07/09/2026). Lo bajó al decidir que la ficha
       dijera "individual": lleva un solo plato, no dos como el pequeño.
       Mismo precio en las dos maderas. */
    precio_usd: 45,
    peso: 3.2,               /* RELLENO */

    /* 06/09/2026 · Ya tiene modelo: lo hizo en SketchUp en DOS
       maderas, samán y apamate, más el plato por separado. Corrige
       el comentario de la ficha del pequeño, que decía que el
       grande no tenía .skp.

       La imagen es el isométrico con cotas, y lleva DOS piezas en
       la misma lámina a petición suya: el mueble a la izquierda y
       el plato suelto a la derecha. El plato es el que contiene la
       comida, así que su tamaño es lo que de verdad se pregunta y
       no se leía en una vista del conjunto.

       PENDIENTE SUYO: el VOLUMEN del plato, que dijo que no tenía
       a mano. Cuando lo dé, va en el resumen o en las medidas.
       PENDIENTE MÍO DE PREGUNTARLE: si quiere las dos maderas como
       opción de compra (`modelo_por` existe para eso) y si valen
       lo mismo. De momento la ficha enseña la de samán. */
    /* LAS DOS MADERAS (él, 06/09/2026). Modeló el mueble en samán y
       en apamate, así que la madera es una opción de compra y cambia
       tanto la imagen como el modelo que se ve girar. Mismo precio
       las dos: no lleva `delta`. */
    opcion_visual: "madera",
    opcion_diagrama: "madera",
    /* Su imagen es el isométrico, un dibujo sobre fondo TRANSPARENTE, y
       por ahí asomaba el rayado del hueco (él, 15/09/2026: lo quiere
       liso). Mismo caso y mismo arreglo que la tumbona. */
    fondo_liso: true,
    imagen: "img/prototipos/comedero-grande-iso.webp",
    imagen_por: {
      saman:   "img/prototipos/comedero-grande-iso.webp",
      apamate: "img/prototipos/comedero-grande-apamate-iso.webp"
    },
    galeria: [],
    modelo_por: {
      saman:   "modelos/comedero-grande.glb",
      apamate: "modelos/comedero-grande-apamate.glb"
    },
    opciones: [{
      id: "madera",
      etiqueta: { es: "Madera", en: "Wood" },
      valores: [
        { id: "saman",   etiqueta: { es: "Samán",   en: "Monkeypod" } },
        { id: "apamate", etiqueta: { es: "Apamate", en: "Apamate" } }
      ]
    }]
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
    acabado: ["linaza", "cera"],
    /* «Gancho» (él, 15/09/2026). Al principio me dejó el uso a mí y puse
       «organización»; él lo cambió porque lo piensa como familia: cuenta
       con tener más tipos de gancho. */
    uso: ["gancho"],
    resumen: {
      es: "Bloque con gancho retráctil de tres puestos, para ropa o lo que se te ocurra.",
      en: "A block with a three-position retractable hook, for coats or whatever you come up with."
    },
    precio_usd: 40,          /* Él, 14/08/2026. Sin stock. */
    peso: 0.6,               /* RELLENO */

    /* Dos vistas de la misma pieza (confirmado por él): la de
       tres cuartos y la de las placas, que enseña la ranura y el
       tamaño en la mano. */
    imagen: "img/prototipos/gancho-pared-1.webp",
    /* 06/09/2026 · El plano técnico se sustituye por el ISOMÉTRICO
       con cotas. Decisión suya: para estas piezas el isométrico se
       entiende mejor que las vistas ortogonales. El plano de líneas
       se queda SOLO en las dos bases de laptop, donde hacen falta
       la vista lateral y las dos configuraciones.
       Sigue entrando por `plano_img`, que es el hueco de la tira que
       le corresponde; lo que cambió es el CSS, que ya no invierte en
       modo oscuro lo que no sea .svg — un render en color invertido
       salía con la madera azul. Ver css/prototipos.css. */
       plano_img: "img/prototipos/gancho-pared-iso.webp",
    sin_fondo: true,
    /* 2026-08-16 · Las 2, 3 y 4 se REENCUADRARON: en la miniatura, que
       recorta al centro, la pieza quedaba cortada y lejos.
       - La 2 y la 3 tenían un margen transparente enorme (la 3, media
         imagen vacía arriba): se pasaron por
         Herramientas\Recortar-transparencia.ps1, que lo quita. Eso las
         acerca sin tocar píxeles de la pieza.
       - La 4 no tenía transparencia que recortar, así que lleva un
         recorte a mano: fuera la pared vacía de arriba y la caja azul
         del borde derecho.
       Los originales siguen intactos en la carpeta del proyecto. */
    galeria: [
      "img/prototipos/gancho-pared-2.webp",
      "img/prototipos/gancho-pared-3.webp",
      "img/prototipos/gancho-pared-4.webp"
    ],
    /* Sin video (el, 16/08/2026): la tira son solo las cuatro fotos.
       El .mp4 sigue en video/ por si se repone. */
    modelo3d: "modelos/gancho-ery.glb",

    /* Samán, única especie por ahora (él, 07/09/2026). */
    opciones: [{
      id: "madera",
      etiqueta: { es: "Madera", en: "Wood" },
      valores: [ { id: "saman", etiqueta: { es: "Samán", en: "Monkeypod" } } ]
    }]
  },

  {
    slug: "tumbona",
    /* Fuera del catalogo el 16/08/2026 (el): queria tener piezas hechas
       en el taller antes de ofrecerlo con seguridad.
       08/09/2026 · YA LAS HAY: entran las seis fotos que el numero
       «Tumbona 1-6» en E:\Contenido PrototipoAgo\Escenografia, todas de
       la pieza real en pino. Con eso se cumple la condicion y vuelve al
       catalogo. */
    publicado: true,
    disponibilidad: "pedido",
    plazo_semanas: 4,
    nombre:  { es: "Tumbona", en: "Lounger" },
    /* Aceite de tung desde el 16/09/2026 (él). Antes, barniz marino. */
    acabado: ["tung"],
    /* Dos usos, y es el ejemplo de por qué `uso` es lista (él). */
    uso: ["silla", "playa"],
    resumen: {
      /* 15/08/2026 · Descripción nueva: la anterior hablaba de
         listones y drenaje —construcción— y él quería otra cosa.
         Esta va por el uso; el detalle técnico queda de cierre. */
      es: "Asiento tipo playero, con tres configuraciones de inclinación: decides si te quieres acostar o sentar.",
      en: "A beach-chair style seat with three recline settings: you decide whether to lie back or sit up."
    },
    /* Precio confirmado el 08/09/2026 al publicarla: sigue el mismo. */
    precio_usd: 200,
    peso: 14,                /* RELLENO */

    /* De portada va la 2 y no la 1, aunque el las numero al reves: es la
       unica toma limpia de la pieza ENTERA, bien iluminada y sin nada que
       le compita en el encuadre. En la 1 la silla queda mas escorzada y
       entra el brazo de un sofa por la derecha. Mismo criterio que en la
       madriguera de trabajos.js, donde la portada es la foto-4.
       Los nombres de archivo SI respetan su numeracion. */
    /* 15/09/2026 · DE PORTADA VA LA RECORTADA (él): la foto 1, la que no
       tiene fondo. Antes iba la 2 por lo que dice el comentario de arriba
       —era la única toma limpia de la pieza entera—, y esa pasa ahora al
       segundo puesto. `sin_fondo` sigue APAGADO, decisión suya del mismo
       día, así que la recortada se recorta para llenar la tarjeta. */
    imagen: "img/prototipos/tumbona-1.webp",
    /* La portada es recortada y tiene transparencia alrededor de la
       silla: por ahí se veía el rayado del hueco. Con esto el fondo
       queda liso —negro o blanco según el tema— sin cambiar el
       encuadre, que es lo que él quería (15/09/2026). */
    fondo_liso: true,
    galeria: [
      "img/prototipos/tumbona-2.webp",
      "img/prototipos/tumbona-6.webp",
      "img/prototipos/tumbona-5.webp",
      "img/prototipos/tumbona-3.webp",
      "img/prototipos/tumbona-4.webp"
    ],

    /* Las fotos son TODAS de pino, que es lo unico fabricado hasta hoy.
       La teca se ofrece igual —el quiere hacerlas— y hasta que exista una
       se queda con las mismas imagenes: es el mismo diseno, distinta
       especie. Es la decision que ya se tomo en la base de laptop baja
       con el apamate. Cuando haya fotos de teca, esto se parte en un
       `imagen_por` como el de la base alta.
       Sin `opcion_visual`: sin `imagen_por` ni `modelo_por` no hace nada
       —el codigo ya cae en "madera" solo— y ponerlo haria creer que hay
       material por variante cuando no lo hay. */
    /* 15/09/2026 · YA HAY MODELO 3D, y uno POR MADERA: él modeló las dos
       tumbonas en SketchUp (`Proyectos\Escenografía Morochos\Tumbona
       Pino.skp` y `Tumbona Teca.skp`) y exportó los .obj con veta, que
       es el export que conserva la orientación de las texturas. Con
       `modelo_por` puesto, `opcion_visual` SÍ hace falta: es lo que le
       dice al visor que al cambiar de madera cambie el modelo.
       Las fotos siguen siendo todas de pino, como dice el comentario de
       arriba; lo que cambia por variante es el 3D. */
    opcion_visual: "madera",
    modelo_por: {
      pino: "modelos/tumbona-pino.glb",
      teca: "modelos/tumbona-teca.glb"
    },
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
   /* Fuera del catalogo el 16/08/2026 (el): quiere tener piezas
      hechas en el taller antes de ofrecerlo con seguridad. */
    publicado: false,
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
   /* Fuera del catalogo el 16/08/2026 (el): quiere tener piezas
      hechas en el taller antes de ofrecerlo con seguridad. */
    publicado: false,
    disponibilidad: "pedido",
    plazo_semanas: 4,
    nombre:  { es: "Pack de utensilios", en: "Utensil set" },
    /* Aceite de tung, el mismo que él dictó para el set en Exhibición. */
    acabado: ["tung"],
    uso: ["cocina"],
    /* 15/09/2026 · YA DIJO LAS MADERAS, «en orden respectivo»: algarrobo,
       puy, teca y caoba, una por utensilio. El orden se entiende como el de
       la foto 1 del set, de izquierda a derecha. «Puy» con Y, como en los
       anillos de trabajos.js. Con esto se cae el `pendiente` que tenía.
       El acabado es aceite de tung (él, el mismo día). */
    resumen: {
      es: "Cuatro piezas de cocina, cada una en una madera distinta: algarrobo, puy, teca y caoba. Acabadas en aceite de tung.",
      en: "Four kitchen pieces, each in a different wood: algarrobo, puy, teak and mahogany. Finished in tung oil."
    },
    precio_usd: 100,
    peso: 0.8,               /* RELLENO */
    pack: 4,
    palabra_pack: { es: "utensilios", en: "utensils" }
  },

  {
    slug: "lampara",
   /* Fuera del catalogo el 16/08/2026 (el): quiere tener piezas
      hechas en el taller antes de ofrecerlo con seguridad. */
    publicado: false,
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
    nombre:  { es: "Bases para foto (paquete)", en: "Photo risers (pack)" },
    acabado: ["crudo"],
    uso: ["decoracion"],
    resumen: {
      es: "Piecitas para montar producto o fotografía de mesa. Se venden por paquete.",
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
    imagen: "img/prototipos/bases-foto-1.webp",
    /* 06/09/2026 · El plano técnico se sustituye por el ISOMÉTRICO
       con cotas. Decisión suya: para estas piezas el isométrico se
       entiende mejor que las vistas ortogonales. El plano de líneas
       se queda SOLO en las dos bases de laptop, donde hacen falta
       la vista lateral y las dos configuraciones.
       Sigue entrando por `plano_img`, que es el hueco de la tira que
       le corresponde; lo que cambió es el CSS, que ya no invierte en
       modo oscuro lo que no sea .svg — un render en color invertido
       salía con la madera azul. Ver css/prototipos.css. */
       plano_img_por: {
      pino:  "img/prototipos/bases-foto-pino-iso.webp",
      saman: "img/prototipos/bases-foto-saman-iso.webp"
    },
    /* el hueco del plano se indexa por `opcion_diagrama`, que por
       defecto es "tamano"; aquí la variante es la madera. */
    opcion_diagrama: "madera",
    sin_fondo: true,
    /* La portada enseña las dos maderas juntas y se queda fija;
       dentro del panel la foto cambia con la madera escogida.
       En la cuadrícula salen las tres igual, porque `imagen`
       se cuela delante de las de `imagen_por`. */
    opcion_visual: "madera",
    imagen_por: {
      pino:  "img/prototipos/bases-foto-2.webp",
      saman: "img/prototipos/bases-foto-3.webp"
    },
    /* La de ambiente va al final y sale con las dos maderas.
       OJO: esta SÍ trae fondo, al revés que las otras tres, pero
       `sin_fondo` es del producto entero y no de cada foto. Se
       pinta igual, encajada sin recuadro. */
    galeria: ["img/prototipos/bases-foto-4.webp"],

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
      etiqueta: { es: "Tamaño del paquete", en: "Pack size" },
      valores: [
        /* STOCK DE RELLENO, como el del resto. */
        /* El stock ya no vive aquí sino en `stock_matriz`. */
        { id: "p5",  etiqueta: { es: "Paquete de 5",  en: "Pack of 5" },  precio: 5,  unidades: 5 },
        { id: "p20", etiqueta: { es: "Paquete de 20", en: "Pack of 20" }, precio: 15, unidades: 20 }
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
  },

  /* ==========  BAÑO  ·  06/09/2026  ==========================
     Tres piezas nuevas, modeladas por él en SketchUp y exportadas
     como .obj. De momento NO hay foto: la `imagen` es el
     isométrico con cotas que saca capturar-isometrico.html a
     partir del propio .glb, y se sustituirá cuando las fabrique
     y las fotografíe.

     PRECIOS SUYOS, dictados el 06/09/2026: portarrollo 30,
     repisa 50, toallero 90 y espejo 120. El del espejo INCLUYE
     el espejo, no solo el marco (lo dijo él).

     Estuvieron unas horas en `publicado: false` porque sin precio
     `precioUnidad()` hace `p.precio_usd || 0` y la ficha habría
     salido anunciando **$0** con su botón de añadir al pedido. Con
     los precios puestos, ya van publicadas.

     Son CUATRO: las tres primeras y el portarrollo, que mandó
     después. Ahora sí está completo el baño.
     ========================================================== */

  {
    slug: "repisa-bano",
    publicado: true,
    disponibilidad: "pedido",
    plazo_semanas: 3,
    /* 15/09/2026 · Pasó de «Repisa de baño» a «REPISA 1.0» (él): no es
       solo de baño, así que ni el nombre ni el resumen la encierran ahí.
       El slug sigue siendo `repisa-bano` —es su dirección— y también los
       nombres de sus archivos de imagen y modelo. */
    nombre:  { es: "Repisa 1.0", en: "Shelf 1.0" },
    resumen: {
      es: "Repisa de pared con reborde.",
      en: "A wall shelf with a lip."
    },
    acabado: ["poliuretano"],
    uso: ["repisas"],
    medidas: { es: "50 × 15 × 12 cm", en: "50 × 15 × 12 cm" },
    precio_usd: 50,          /* Él, 06/09/2026 */
    peso: 1.0,               /* RELLENO */
    /* Isométrico con transparencia: fondo liso, sin rayado (él). */
    fondo_liso: true,
    imagen: "img/prototipos/repisa-bano-iso.webp",
    galeria: [],
    modelo3d: "modelos/repisa-bano.glb",

    /* Pino, y es la única especie por ahora (él, 07/09/2026). Aun así
       el selector se muestra: quiere que se vea de qué madera es, no
       que se adivine. Sin `delta`, así que no mueve el precio. */
    opciones: [{
      id: "madera",
      etiqueta: { es: "Madera", en: "Wood" },
      valores: [ { id: "pino", etiqueta: { es: "Pino", en: "Pine" } } ]
    }]
  },

  {
    slug: "espejo-bano",
    publicado: true,
    disponibilidad: "pedido",
    plazo_semanas: 3,
    nombre:  { es: "Espejo de baño", en: "Bathroom mirror" },
    acabado: ["poliuretano"],
    uso: ["bano"],
    resumen: {
      es: "Espejo con marco de madera maciza.",
      en: "A mirror in a solid wood frame."
    },
    medidas: { es: "52 × 2,5 × 63 cm", en: "52 × 2.5 × 63 cm" },
    precio_usd: 120,          /* Él, 06/09/2026 */
    peso: 4.0,               /* RELLENO */
    /* Isométrico con transparencia: fondo liso, sin rayado (él). */
    fondo_liso: true,
    imagen: "img/prototipos/espejo-bano-iso.webp",
    galeria: [],
    modelo3d: "modelos/espejo-bano.glb",

    /* Pino, y es la única especie por ahora (él, 07/09/2026). Aun así
       el selector se muestra: quiere que se vea de qué madera es, no
       que se adivine. Sin `delta`, así que no mueve el precio. */
    opciones: [{
      id: "madera",
      etiqueta: { es: "Madera", en: "Wood" },
      valores: [ { id: "pino", etiqueta: { es: "Pino", en: "Pine" } } ]
    }]
  },

  {
    slug: "toallero-bano",
    publicado: true,
    disponibilidad: "pedido",
    plazo_semanas: 3,
    nombre:  { es: "Toallero", en: "Towel rail" },
    acabado: ["poliuretano"],
    uso: ["bano"],
    resumen: {
      es: "Toallero de pared de dos barras, en madera maciza.",
      en: "A two-bar wall towel rail in solid wood."
    },
    medidas: { es: "84 × 15,5 × 13 cm", en: "84 × 15.5 × 13 cm" },
    precio_usd: 90,          /* Él, 06/09/2026 */
    peso: 1.6,               /* RELLENO */
    /* Isométrico con transparencia: fondo liso, sin rayado (él). */
    fondo_liso: true,
    imagen: "img/prototipos/toallero-bano-iso.webp",
    galeria: [],
    modelo3d: "modelos/toallero-bano.glb",

    /* Pino, y es la única especie por ahora (él, 07/09/2026). Aun así
       el selector se muestra: quiere que se vea de qué madera es, no
       que se adivine. Sin `delta`, así que no mueve el precio. */
    opciones: [{
      id: "madera",
      etiqueta: { es: "Madera", en: "Wood" },
      valores: [ { id: "pino", etiqueta: { es: "Pino", en: "Pine" } } ]
    }]
  },

  {
    /* Llegó unas horas después que las otras tres. Es una tabla con
       el brazo en U tallado en la propia pieza, no un herraje
       aparte: por eso el modelo sale de una sola pieza de 3 cm. */
    slug: "porta-rollo-bano",
    publicado: true,
    disponibilidad: "pedido",
    plazo_semanas: 3,
    nombre:  { es: "Portarrollo", en: "Toilet roll holder" },
    acabado: ["poliuretano"],
    uso: ["bano"],
    resumen: {
      es: "Portarrollo de pared en madera maciza, con el brazo tallado en la propia tabla.",
      en: "A solid wood wall roll holder, its arm carved from the board itself."
    },
    medidas: { es: "34 × 13 × 3 cm", en: "34 × 13 × 3 cm" },
    precio_usd: 30,          /* Él, 06/09/2026 */
    peso: 0.7,               /* RELLENO */
    /* Isométrico con transparencia: fondo liso, sin rayado (él). */
    fondo_liso: true,
    imagen: "img/prototipos/porta-rollo-bano-iso.webp",
    galeria: [],
    modelo3d: "modelos/porta-rollo-bano.glb",

    /* Pino, y es la única especie por ahora (él, 07/09/2026). Aun así
       el selector se muestra: quiere que se vea de qué madera es, no
       que se adivine. Sin `delta`, así que no mueve el precio. */
    opciones: [{
      id: "madera",
      etiqueta: { es: "Madera", en: "Wood" },
      valores: [ { id: "pino", etiqueta: { es: "Pino", en: "Pine" } } ]
    }]
  }
];
