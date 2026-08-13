/* ============================================================
   TASAS, ENVÍO Y PAGO
   ============================================================ */

/* ------------------------------------------------------------
   LA REGLA QUE NO SE TOCA
   ------------------------------------------------------------
   Los bolívares SIEMPRE salen por REF, nunca por conversión
   directa:

       REF          = USD / relacion_efectiva      (0,8 → ×1,25)
       Bs a cobrar  = REF × tasa BCV

   Eso cancela correctamente: los bolívares recibidos, devueltos
   a dólares por Binance, dan el precio original en USD.

   Mostrar USD × BCV en vez de REF × BCV regala ~20% de cada
   venta. Es el mismo 0,8 de Proyectos!$W$7 en el libro
   "Finanzas Taller.xlsx", y es una decisión suya, no el spread
   real (que el 11/08/2026 estaba en 0,8776).

   ACTUALIZAR ESTO: Herramientas\Finanzas\Actualizar-Tasas.ps1
   ya trae bcv y paralelo de la API. Falta que además escriba
   este bloque. Mientras tanto se edita a mano.
   ------------------------------------------------------------ */
window.TASAS = {
  bcv: 761.2167,               /* ve.dolarapi.com → oficial.promedio */
  paralelo: 863.96439,         /* Binance P2P, mediana de 20 ofertas */
  relacion_efectiva: 0.8,      /* factor manual suyo */
  fecha: "11/08/2026"
};

/* ------------------------------------------------------------
   TARIFAS DE ENVÍO — ESTIMADAS, NO PUBLICADAS
   ------------------------------------------------------------
   Se buscó (12/08/2026) y NO hay tarifas públicas de MRW, Zoom
   ni de las apps de delivery: las calculadoras son formularios
   sin tabla ni API, y lo único que MRW publica es el rango de
   peso que acepta (de 501 g a 46 kg). Se descartó rasparlas: se
   rompen solas y darían precios falsos a un cliente.

   Se calibra a mano UNA vez: meter 5 o 6 combinaciones de peso
   y destino en la calculadora de MRW y ajustar base/por_kg. Los
   ajustes de después se hacen subiendo MULTIPLICADOR de golpe.

   FALTA EL PESO VOLUMÉTRICO. Las agencias cobran por volumen
   cuando el bulto es grande y liviano — justo las bases de
   laptop. Hace falta el tamaño real de cada pieza, que sale de
   los modelos 3D cuando estén refinados.
   ------------------------------------------------------------ */
window.MULTIPLICADOR_ENVIO = 1.0;

/* Se muestra una HORQUILLA, no una cifra: "~$11 – $20". Es lo
   honesto cuando el número no está publicado en ninguna parte, y
   además es como funciona de verdad — dos paquetes del mismo peso
   al mismo estado no cuestan igual según el bulto y la agencia.
   0.3 = ±30% alrededor del valor central. */
window.HORQUILLA = 0.3;

window.ZONAS = {
  1: { nombre: { es: "Gran Caracas",        en: "Greater Caracas" },   base: 3.5,  por_kg: 0.8 },
  2: { nombre: { es: "Centro y llanos",     en: "Central plains" },    base: 5.0,  por_kg: 1.2 },
  3: { nombre: { es: "Oriente y occidente", en: "East and west" },     base: 7.0,  por_kg: 1.7 },
  4: { nombre: { es: "Zona remota",         en: "Remote" },            base: 11.0, por_kg: 2.6 }
};

/* Miranda, Distrito Capital y La Guaira van arriba del
   desplegable, separados del resto: ahí está el grueso de las
   ventas y no se busca lo que se usa todos los días. */
window.ESTADOS_PRINCIPALES = ["Distrito Capital", "Miranda", "La Guaira"];

window.ESTADOS = {
  "Distrito Capital": 1, "Miranda": 1, "La Guaira": 1,
  "Aragua": 2, "Barinas": 2, "Carabobo": 2, "Cojedes": 2, "Guárico": 2,
  "Lara": 2, "Portuguesa": 2, "Yaracuy": 2,
  "Anzoátegui": 3, "Apure": 3, "Bolívar": 3, "Falcón": 3, "Mérida": 3,
  "Monagas": 3, "Nueva Esparta": 3, "Sucre": 3, "Táchira": 3,
  "Trujillo": 3, "Zulia": 3,
  "Amazonas": 4, "Delta Amacuro": 4
};

window.ENTREGAS = [
  { id: "taller", tipo: "gratis",
    nombre:  { es: "Retiro en el taller", en: "Pick up at the shop" },
    /* El Placer, en Caracas. La dirección exacta se pasa por
       chat al coordinar, no va en una página pública. */
    detalle: { es: "El Placer, Caracas · a coordinar",
               en: "El Placer, Caracas · to be arranged" } },

  /* Delivery dentro de Caracas, en moto o carro según el bulto.
     No se nombra una sola app a propósito: se usa la que salga
     mejor ese día. El rango cubre desde un trayecto corto dentro
     del mismo municipio hasta cruzar la ciudad con una pieza
     grande, que es cuando toca carro y no moto. */
  { id: "delivery", tipo: "local", monto_min: 4, monto_max: 12,
    nombre:  { es: "Servicio de Delivery (Yummy, otros)",
               en: "Delivery service (Yummy, others)" },
    detalle: { es: "Misma ciudad", en: "Same city" } },

  { id: "mrw", tipo: "agencia", factor: 1.00,
    nombre:  { es: "MRW", en: "MRW" },
    detalle: { es: "Cobro destino · 24-72 h", en: "Paid on collection · 24-72 h" } },

  { id: "zoom", tipo: "agencia", factor: 0.95,
    nombre:  { es: "Zoom", en: "Zoom" },
    detalle: { es: "Cobro destino", en: "Paid on collection" } }
];

/* Ningún dato de cuenta vive aquí: los pasa por WhatsApp al
   confirmar. Una página pública con el pago móvil es un regalo
   para quien quiera suplantarlo. */
window.PAGOS = [
  { id: "pagomovil", moneda: "bs",
    nombre: { es: "Pago Móvil", en: "Pago Móvil" } },

  { id: "transferencia", moneda: "bs",
    nombre: { es: "Transferencia", en: "Bank transfer" } },

  { id: "facebank", moneda: "usd",
    nombre: { es: "Facebank", en: "Facebank" } },

  { id: "binance", moneda: "usdt",
    nombre: { es: "Binance", en: "Binance" } },

  { id: "efectivo", moneda: "usd",
    nombre: { es: "Efectivo", en: "Cash" },
    /* El efectivo obliga a entrega personal: al escogerlo se
       apagan las encomiendas. */
    condicion: { es: "Solo con entrega personal, a coordinar conmigo.",
                 en: "In-person handover only, arranged with me." } }
];
