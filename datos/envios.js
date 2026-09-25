window.TASAS = { bcv: 855.6625, fecha: "25/09/2026" };
window.MULTIPLICADOR_ENVIO = 1;
window.HORQUILLA = 0.3;
window.ZONAS = {
  1: { nombre: { es: "Gran Caracas", en: "Greater Caracas" }, base: 3.5, por_kg: 0.8 },
  2: { nombre: { es: "Centro y llanos", en: "Central plains" }, base: 5, por_kg: 1.2 },
  3: { nombre: { es: "Oriente y occidente", en: "East and west" }, base: 7, por_kg: 1.7 },
  4: { nombre: { es: "Zona remota", en: "Remote" }, base: 11, por_kg: 2.6 }
};
window.ESTADOS_PRINCIPALES = ["Distrito Capital", "Miranda", "La Guaira"];
window.ESTADOS = {
  "Distrito Capital": 1,
  "Miranda": 1,
  "La Guaira": 1,
  "Aragua": 2,
  "Barinas": 2,
  "Carabobo": 2,
  "Cojedes": 2,
  "Gu\xE1rico": 2,
  "Lara": 2,
  "Portuguesa": 2,
  "Yaracuy": 2,
  "Anzo\xE1tegui": 3,
  "Apure": 3,
  "Bol\xEDvar": 3,
  "Falc\xF3n": 3,
  "M\xE9rida": 3,
  "Monagas": 3,
  "Nueva Esparta": 3,
  "Sucre": 3,
  "T\xE1chira": 3,
  "Trujillo": 3,
  "Zulia": 3,
  "Amazonas": 4,
  "Delta Amacuro": 4
};
window.ENTREGAS = [
  /* «Por definir» (él, 16/09/2026): PRIMERA y marcada por defecto, para
     que el cliente escriba sin comprometerse todavía con un envío. */
  {
    id: "definir",
    tipo: "definir",
    nombre: { es: "Por definir", en: "To be decided" },
    detalle: { es: "Lo acordamos en el chat", en: "We'll agree on it in the chat" }
  },
  {
    id: "taller",
    tipo: "gratis",
    nombre: { es: "Retiro en el taller", en: "Pick up at the shop" },
    /* El Placer, en Caracas. La dirección exacta se pasa por
       chat al coordinar, no va en una página pública. */
    detalle: {
      es: "El Placer, Caracas \xB7 a coordinar",
      en: "El Placer, Caracas \xB7 to be arranged"
    }
  },
  /* Delivery dentro de Caracas, en moto o carro según el bulto.
     No se nombra una sola app a propósito: se usa la que salga
     mejor ese día. El rango cubre desde un trayecto corto dentro
     del mismo municipio hasta cruzar la ciudad con una pieza
     grande, que es cuando toca carro y no moto.
     21/09/2026 (él): $4–15 es para piezas pequeñas (antes 4–12). Una
     pieza grande va de $20 a $30 y entra en los $25 de entrega y
     montaje de datos/marca.js. */
  {
    id: "delivery",
    tipo: "local",
    monto_min: 4,
    monto_max: 15,
    piezas_mayores: ["tumbona", "espejo-bano", "toallero-bano"],
    monto_mayor_min: 10,
    monto_mayor_max: 25,
    nombre: {
      es: "Servicio de Delivery (Yummy, otros)",
      en: "Delivery service (Yummy, others)"
    },
    detalle: { es: "Misma ciudad", en: "Same city" }
  },
  {
    id: "mrw",
    tipo: "agencia",
    factor: 1,
    nombre: { es: "MRW", en: "MRW" },
    detalle: { es: "Cobro destino \xB7 24-72 h", en: "Paid on collection \xB7 24-72 h" }
  },
  {
    id: "zoom",
    tipo: "agencia",
    factor: 0.95,
    nombre: { es: "Zoom", en: "Zoom" },
    detalle: { es: "Cobro destino", en: "Paid on collection" }
  }
];
window.PAGOS = [
  /* «Por definir» (él, 16/09/2026): primera y marcada por defecto. */
  {
    id: "definir",
    moneda: "definir",
    nombre: { es: "Por definir", en: "To be decided" }
  },
  {
    id: "pagomovil",
    moneda: "bs",
    nombre: { es: "Pago M\xF3vil", en: "Pago M\xF3vil" }
  },
  {
    id: "transferencia",
    moneda: "bs",
    nombre: { es: "Transferencia", en: "Bank transfer" }
  },
  {
    id: "facebank",
    moneda: "usd",
    nombre: { es: "Facebank", en: "Facebank" }
  },
  {
    id: "binance",
    moneda: "usdt",
    nombre: { es: "Binance", en: "Binance" }
  },
  {
    id: "efectivo",
    moneda: "usd",
    nombre: { es: "Efectivo", en: "Cash" },
    /* El efectivo obliga a entrega personal: al escogerlo se
       apagan las encomiendas. */
    condicion: {
      es: "Solo con entrega personal, a coordinar.",
      en: "In-person handover only, to be arranged."
    }
  }
];
window.rangoDelivery = function(lineas, entrega) {
  var mayor = lineas.some(function(linea) {
    return linea.cant > 0 && (entrega.piezas_mayores || []).indexOf(linea.slug) !== -1;
  });
  return mayor ? { min: entrega.monto_mayor_min, max: entrega.monto_mayor_max } : { min: entrega.monto_min, max: entrega.monto_max };
};
