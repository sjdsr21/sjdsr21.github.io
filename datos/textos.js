/* ============================================================
   TEXTOS DE LA INTERFAZ  ·  español / inglés
   Todo lo que se lee en el sitio y no es contenido de una pieza
   vive aquí. Para cambiar una palabra, cámbiala aquí una vez.
   ============================================================ */

window.TEXTOS = {

  /* --- Navegación ------------------------------------------ */
  nav_inicio:       { es: "Inicio",        en: "Home" },
  nav_trabajos:     { es: "Exhibición",    en: "Exhibition" },
  nav_piezas:       { es: "Creaciones",    en: "Creations" },
  nav_herramientas: { es: "Herramientas e insumos", en: "Tools & supplies" },
  nav_prototipos:   { es: "Prototipos",    en: "Prototypes" },
  nav_novedades:    { es: "Novedades",     en: "What's new" },

  /* La palabrita que sale ENCIMA del nombre de la sección, y solo
     cuando esa sección es la que estás viendo. Se lee de corrido
     con el nombre: "Tienda de Prototipos", "Establece Contacto". */
  nav_pre_prototipos:   { es: "Tienda de",   en: "Shop for" },
  nav_pre_trabajos:     { es: "Catálogo de", en: "Catalogue of" },
  nav_pre_novedades:    { es: "Área de",     en: "Area of" },
  nav_pre_sobre:        { es: "Descubre",    en: "Discover" },
  nav_pre_contacto:     { es: "Establece",   en: "Make" },
  nav_sobre:        { es: "El taller",     en: "The shop" },
  nav_contacto:     { es: "Contacto",      en: "Contact" },

  /* --- Prototipos: la colección propia, con pedido --------- */
  pt_titulo:    { es: "Prototipos", en: "Prototypes" },
  pt_bajada:    { es: "Piezas que puedes comprar. De diseño propio. Hechas en el taller.",
                  en: "Pieces you can buy. Of my own design. Made in the shop." },
  pt_con_stock: { es: "Listas ahora", en: "Ready now" },
  /* Va justo debajo del título "Listas ahora": es lo que antes
     decía la bajada de la página, pero pegado a lo que explica. */
  pt_sin_espera:{ es: "En inventario. Sin tiempo de espera por fabricación.",
                  en: "In stock. No waiting time for fabrication." },
  pt_por_encargo:{ es: "Por encargo", en: "Made to order" },
  pt_encargo_bajada: { es: "No las tengo hechas ahora mismo. Se producen cuando las pides, con un plazo acordado y sin compromiso hasta que cerremos por chat.",
                  en: "I don't have these on hand. They're made when you order, on an agreed lead time, with no commitment until we close it over chat." },
  pt_n_productos: { es: "{n} productos", en: "{n} products" },
  pt_agotado:   { es: "agotado", en: "sold out" },
  /* Poco stock y stock normal dicen LO MISMO; lo que cambia es el
     color (ver .pt-estado--poco). Antes el caso de pocas unidades
     decía "quedan 1", que además de sonar mal metía prisa. */
  /* "in stock" y no "available" (él, 14/08/2026): en inglés
     "available" se lee como "se puede pedir", y aquí lo que se
     dice es que ya está hecho y en el taller. El español se queda
     igual. */
  pt_hay:       { es: "{n} disponibles", en: "{n} in stock" },
  pt_hay_uno:   { es: "1 disponible",    en: "1 in stock" },
  /* «~3 semanas» y no «3 semanas» (él, 14/08/2026). Prometer un
     plazo cerrado no es cierto: depende de la cola del taller y de
     que llegue el material. Llevó un «+» unas horas —«~3+»— y lo
     quitó: con la virgulilla basta. */
  pt_semanas:   { es: "~{n} semanas", en: "~{n} weeks" },
  pt_sin_imagen:{ es: "sin imagen", en: "no image" },
  pt_plano:     { es: "PLANO", en: "PLAN" },
  pt_anterior:  { es: "Foto anterior",  en: "Previous photo" },
  pt_siguiente: { es: "Foto siguiente", en: "Next photo" },

  pt_cantidad:  { es: "Cantidad", en: "Quantity" },
  pt_cant_packs:{ es: "Cantidad de packs", en: "Number of packs" },
  pt_en_total:  { es: "({n} {cosa} en total)", en: "({n} {cosa} in total)" },
  pt_sin_combo: { es: "Sin stock en esta combinación — se puede hacer por encargo.",
                  en: "Out of stock in this combination — can be made to order." },
  pt_en_taller: { es: "{n} en el taller, sale de una vez.", en: "{n} in the shop, ships right away." },
  /* Aviso al pedir más de lo que hay hecho. {cosa} dice "unidades"
     o "paquetes" según el producto. */
  pt_sobre_stock: {
    es: "Solo hay {hay} en el taller. {falta} {cosa} tendrán que fabricarse por encargo, lo que puede tomar unas semanas. Puedes hacer el pedido con las {total} {cosa} y lo acordamos por mensaje al terminar.",
    en: "Only {hay} are in the shop. {falta} {cosa} would have to be made to order, which can take a few weeks. You can place the order for all {total} {cosa} and we'll sort it out by message afterwards."
  },
  pt_unidades: { es: "unidades", en: "units" },
  pt_paquetes: { es: "paquetes", en: "packs" },
  pt_se_produce:{ es: "Se produce al pedirlo · {p}", en: "Made to order · {p}" },
  pt_agregar:   { es: "Agregar al pedido", en: "Add to order" },
  /* Dos botones desde el 14/08/2026: uno para seguir mirando y
     otro para bajar al pedido. Antes solo estaba el segundo y
     mandaba al final de la página cada vez que agregabas algo. */
  pt_agregar_seguir:  { es: "Agregar y seguir viendo", en: "Add and keep browsing" },
  pt_agregar_cerrar:  { es: "Agregar y concretar",     en: "Add and check out" },
  pt_quitar_titulo:   { es: "Quitar",                  en: "Remove" },

  pt_tu_pedido: { es: "Tu pedido", en: "Your order" },
  pt_pedido_bajada: { es: "Arma aquí lo que quieres. Nada se cobra en esta página: al final se abre WhatsApp con el pedido ya escrito.",
                  en: "Build what you want here. Nothing is charged on this page: at the end WhatsApp opens with the order already written." },
  pt_vacio:     { es: "Todavía no has agregado nada.", en: "Nothing added yet." },
  pt_quitar:    { es: "quitar", en: "remove" },
  pt_como_recibes: { es: "¿Cómo lo recibes?", en: "How do you get it?" },
  pt_como_pagas:{ es: "¿Cómo pagas?", en: "How do you pay?" },
  pt_que_estado:{ es: "¿A qué estado?", en: "Which state?" },
  pt_los_de_siempre: { es: "Los de siempre", en: "The usual" },
  pt_resto_pais:{ es: "Resto del país", en: "Rest of the country" },
  pt_sin_costo: { es: "sin costo", en: "no charge" },
  pt_escoge_estado: { es: "escoge estado", en: "pick a state" },
  pt_no_efectivo: { es: "No aplica pagando en efectivo", en: "Not available when paying cash" },
  /* pt_muy_pesado salió el 12/08/2026: el delivery ya no está
     limitado a piezas pequeñas, así que no hay nada que avisar. */
  pt_datos_wa:  { es: "Los datos de la cuenta te los paso por WhatsApp cuando confirmemos. No van en la página.",
                  en: "I send you the account details over WhatsApp once we confirm. They don't live on this page." },
  pt_en_bs:     { es: "en bolívares", en: "in bolívares" },
  pt_en_usd:    { es: "en dólares", en: "in US dollars" },
  pt_en_usdt:   { es: "en USDT", en: "in USDT" },

  pt_piezas:    { es: "Piezas", en: "Pieces" },
  pt_total:     { es: "Total a pagar", en: "Total to pay" },
  pt_si_bs:     { es: "({m} si pagas en bolívares)", en: "({m} if you pay in bolívares)" },
  pt_equivale:  { es: "equivale a {m}", en: "equals {m}" },
  pt_envio_est: { es: "Envío estimado", en: "Estimated shipping" },
  pt_envio_escoge: { es: "Escoge el estado de destino para estimarlo.", en: "Pick the destination state to estimate it." },
  pt_envio_nota:{ es: "Aproximado. Lo cobra {a} al retirarlo, no yo — no entra en el total de arriba. {kg} kg.",
                  en: "Approximate. {a} charges it on collection, not me — it's not part of the total above. {kg} kg." },
  pt_envio_local: { es: "Aproximado, se confirma al coordinar.", en: "Approximate, confirmed when we arrange it." },
  pt_me_llega:  { es: "Lo que me va a llegar", en: "What reaches me" },
  pt_previa_vacia: { es: "El mensaje se arma solo cuando agregues algo.", en: "The message builds itself once you add something." },
  pt_pedir:     { es: "Hacer pedido por WhatsApp", en: "Order on WhatsApp" },
  pt_pedir_nota:{ es: "Se abre el chat con todo escrito. Todavía no compras nada — confirmamos disponibilidad y cerramos ahí.",
                  en: "The chat opens with everything written out. You're not buying yet — we confirm availability and close it there." },
  pt_sin_wa:    { es: "Falta configurar el número de WhatsApp en datos/marca.js. Mientras tanto, escríbeme por Instagram.",
                  en: "The WhatsApp number isn't set in datos/marca.js yet. In the meantime, message me on Instagram." },
  pt_tasa_bcv:  { es: "BCV {v} Bs/USD", en: "BCV {v} Bs/USD" },

  /* --- Inicio ---------------------------------------------- */
  hero_titulo:  { es: "Muebles hechos de a uno.",
                  en: "Furniture made one at a time." },
  hero_bajada:  { es: "Taller de carpintería en Caracas. Encargos a medida y piezas de diseño propio.",
                  en: "A woodworking shop in Caracas. Commissions and pieces of my own design." },
  hero_cta1:    { es: "Ver prototipos",    en: "See the prototypes" },
  hero_cta2:    { es: "Ver exhibición",    en: "See the exhibition" },

  destacados:   { es: "Selección",         en: "Selected" },
  ver_todo:     { es: "Ver todo",          en: "See all" },

  /* --- Novedades y video ----------------------------------- */
  novedad:      { es: "Novedad",           en: "New" },
  novedad_cta:  { es: "Descubre el Rolitronco", en: "Meet the Rolitronco" },
  saber_mas:    { es: "Saber más sobre el proyecto", en: "More about the project" },
  ver_ficha:    { es: "Ver en el portafolio", en: "See it in the portfolio" },

  /* --- Buscador -------------------------------------------- */
  buscar:       { es: "Buscar",            en: "Search" },
  buscar_ph:    { es: "Buscar una pieza, un material, un año…",
                  en: "Search a piece, a material, a year…" },
  buscar_nada:  { es: "Nada coincide con «{q}»", en: "Nothing matches “{q}”" },
  buscar_ayuda: { es: "Escribe para buscar en todo el sitio.",
                  en: "Type to search the whole site." },
  buscar_en_portafolio: { es: "Portafolio",  en: "Portfolio" },
  buscar_en_tienda:     { es: "En venta",    en: "For sale" },
  cerrar:       { es: "Cerrar",            en: "Close" },

  /* --- Catálogo de trabajos -------------------------------- */
  trabajos_titulo: { es: "Exhibición",
                     en: "Exhibition" },
  /* Lleva la palabra «catálogo» a propósito (él, 14/08/2026): es
     como llama a esta sección, y el enlace de volver dice lo
     mismo. */
  trabajos_bajada: { es: "El catálogo de lo que ha salido del taller. Ningún encargo se repite: aquí está cada pieza, de qué está hecha y cómo se resolvió.",
                     en: "The catalogue of what has come out of the shop. No commission is ever repeated: here is each piece, what it's made of and how it was solved." },

  filtro_tipo:     { es: "Tipo",           en: "Type" },
  filtro_madera:   { es: "Material",       en: "Material" },
  filtro_anio:     { es: "Año",            en: "Year" },
  filtro_todos:    { es: "Todos",          en: "All" },
  limpiar_filtros: { es: "Limpiar",        en: "Clear" },
  sin_resultados:  { es: "No hay nada con esos filtros.",
                     en: "Nothing matches those filters." },
  conteo:          { es: "{n} piezas",     en: "{n} pieces" },
  conteo_uno:      { es: "1 pieza",        en: "1 piece" },

  /* --- Ficha de un trabajo --------------------------------- */
  ficha_ano:       { es: "Año",            en: "Year" },
  ficha_tipo:      { es: "Tipo",           en: "Type" },
  ficha_material:  { es: "Material",       en: "Material" },
  ficha_medidas:   { es: "Medidas",        en: "Dimensions" },
  ficha_acabado:   { es: "Acabado",        en: "Finish" },
  ficha_como:      { es: "Cómo está hecha",en: "How it's made" },
  ficha_volver:    { es: "Volver al catálogo", en: "Back to the catalogue" },
  /* Los dos botones que flanquean al de volver, en la ficha de una
     pieza. El texto no se ve: va en el `title` y para lectores de
     pantalla, junto al nombre de la pieza a la que llevan. */
  pieza_anterior:  { es: "Pieza anterior",  en: "Previous piece" },
  pieza_siguiente: { es: "Pieza siguiente", en: "Next piece" },
  ficha_similar:   { es: "¿Quieres algo así?", en: "Want something like this?" },
  ficha_similar_t: { es: "No repito una pieza igual, pero sí trabajo sobre la misma idea. Escríbeme y lo conversamos.",
                     en: "I don't repeat a piece exactly, but I do work from the same idea. Write me and we'll talk it through." },
  ficha_escribir:  { es: "Escribir",       en: "Get in touch" },

  /* --- Tienda: piezas -------------------------------------- */
  piezas_titulo:   { es: "Creaciones",     en: "Creations" },
  piezas_bajada:   { es: "Creaciones de diseño propio. Se hacen por encargo, con la madera y las medidas que elijas.",
                     en: "My own designs. Made to order, in the wood and size you choose." },

  /* --- Tienda: herramientas -------------------------------- */
  herr_titulo:     { es: "Herramientas e insumos",
                     en: "Tools & supplies" },
  herr_bajada:     { es: "Cosas útiles del taller: herramientas, productos de cuidado y accesorios impresos en 3D.",
                     en: "Useful things from the shop: tools, care products and 3D-printed accessories." },

  /* --- Ficha de producto ----------------------------------- */
  desde:           { es: "Desde",          en: "From" },
  consultar:       { es: "Precio a consultar", en: "Price on request" },
  consultar_nota:  { es: "Depende de las medidas y del material. Escríbeme y te paso el número.",
                     en: "It depends on size and material. Write me and I'll give you the figure." },
  precio_total:    { es: "Precio",         en: "Price" },
  incluye_iva:     { es: "Precio en dólares. Si pagas en bolívares se cobra a la tasa BCV del día.",
                     en: "Price in US dollars." },
  disp_stock:      { es: "Disponible en inventario", en: "Available in stock" },
  disp_pedido:     { es: "Por encargo",    en: "Made to order" },
  disp_agotado:    { es: "Agotado",        en: "Sold out" },
  plazo:           { es: "Entrega",        en: "Lead time" },
  envio:           { es: "Traslado",       en: "Delivery" },
  garantia:        { es: "Garantía",       en: "Warranty" },
  en_bolivares:    { es: "En bolívares",   en: "In bolívares" },
  plazo_semanas:   { es: "~{n} semanas desde el anticipo",
                     en: "~{n} weeks from the deposit" },
  plazo_inmediato: { es: "Sale del taller en 2 a 3 días",
                    en: "Ships from the shop in 2–3 days" },
  pago_texto:      { es: "50% de anticipo para arrancar y 50% contra entrega.",
                     en: "50% deposit to start, 50% on delivery." },
  pedir:           { es: "Pedir esta creación", en: "Order this creation" },
  pedir_herr:      { es: "Pedir",          en: "Order" },
  detalles:        { es: "Detalles",       en: "Details" },
  especificaciones:{ es: "Especificaciones", en: "Specifications" },
  volver_piezas:   { es: "Volver a creaciones", en: "Back to creations" },
  volver_herr:     { es: "Volver a herramientas", en: "Back to tools" },
  no_encontrado:   { es: "No encontré eso.", en: "I couldn't find that." },

  /* --- Visor 3D -------------------------------------------- */
  ver_3d:          { es: "Ver en 3D",      en: "View in 3D" },
  v3d_cargando:    { es: "Cargando el modelo…", en: "Loading the model…" },
  v3d_error:       { es: "No se pudo cargar el modelo 3D.",
                     en: "The 3D model could not be loaded." },
  v3d_ayuda:       { es: "Arrastra para girar · rueda para acercar",
                     en: "Drag to rotate · scroll to zoom" },

  /* --- Sobre / El taller ----------------------------------- */
  sobre_titulo:    { es: "El taller",      en: "The shop" },
  encargos_titulo: { es: "Cómo funciona un encargo",
                     en: "How a commission works" },

  /* --- Contacto -------------------------------------------- */
  contacto_titulo: { es: "Contacto",       en: "Contact" },
  contacto_bajada: { es: "Escríbeme por WhatsApp o Instagram para desarrollar tu idea juntos. Si tienes imágenes de referencia y medidas a la mano, mejor.",
                     en: "Message me on WhatsApp or Instagram and let's develop your idea together. If you have reference images and measurements handy, even better." },

  /* --- Pie ------------------------------------------------- */
  pie_derechos:    { es: "Caracas, Venezuela",
                     en: "Caracas, Venezuela" },

  /* --- Avisos ---------------------------------------------- */
  aviso_render:    { es: "Vista del modelo 3D — falta la foto de la pieza terminada",
                     en: "3D model view — photo of the finished piece pending" },
  video_pendiente: { es: "Video pendiente", en: "Video coming" },


  /* ==========================================================
     TAXONOMÍA — las etiquetas de tipo, material y categoría.
     La CLAVE (izquierda) es lo que se escribe en los datos.
     Añade una fila aquí antes de usar una clave nueva.
     ========================================================== */

  tipo: {
    mesa:        { es: "Mesa",              en: "Table" },
    silla:       { es: "Silla",             en: "Chair" },
    almacenaje:  { es: "Almacenaje",        en: "Storage" },
    cocina:      { es: "Cocina",            en: "Kitchen" },
    closet:      { es: "Clóset",            en: "Closet" },
    repisa:      { es: "Repisas y flotantes",en: "Shelving" },
    accesorio:   { es: "Accesorio",         en: "Accessory" },
    exhibicion:  { es: "Exhibición",        en: "Display" },
    exterior:    { es: "Exterior",          en: "Outdoor" },
    taller:      { es: "Taller",            en: "Shop furniture" },
    otro:        { es: "Otro",              en: "Other" }
  },

  material: {
    "pino":            { es: "Pino",                       en: "Pine" },
    "contraenchapado": { es: "Contraenchapado de pino",    en: "Pine plywood" },
    "mdf":             { es: "MDF",                        en: "MDF" },
    "saman":           { es: "Samán",                      en: "Monkeypod" },
    "cedro":           { es: "Cedro",                      en: "Cedar" },
    "caoba":           { es: "Caoba",                      en: "Mahogany" },
    "roble":           { es: "Roble",                      en: "Oak" },
    "fibrocemento":    { es: "Fibrocemento",               en: "Fiber cement" },
    "ceramica":        { es: "Cerámica",                   en: "Ceramic tile" },
    "acero":           { es: "Acero",                      en: "Steel" },
    "vidrio":          { es: "Vidrio",                     en: "Glass" },
    "pla3d":           { es: "Impresión 3D (PLA)",         en: "3D printed (PLA)" }
  },

  acabado: {
    crudo:      { es: "Crudo",                  en: "Unfinished" },
    sellado:    { es: "Sellado",                en: "Sealed" },
    barnizado:  { es: "Barnizado",              en: "Varnished" },
    aceite:     { es: "Aceitado",               en: "Oiled" },
    pintado:    { es: "Pintado",                en: "Painted" },
    quemado:    { es: "Quemado (shou sugi ban)",en: "Charred (shou sugi ban)" }
  },

  categoria: {
    herramienta: { es: "Herramientas",        en: "Tools" },
    insumo:      { es: "Insumos y cuidado",   en: "Supplies & care" },
    impreso3d:   { es: "Impresos en 3D",      en: "3D printed" },
    accesorio:   { es: "Accesorios",          en: "Accessories" }
  }
};
