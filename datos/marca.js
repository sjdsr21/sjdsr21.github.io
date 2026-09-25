/* ============================================================
   DATOS DE LA MARCA Y CONTACTO
   Revisa esto primero: puse lo que encontré en tus archivos,
   pero el WhatsApp y el Instagram son suposiciones mías.
   ============================================================ */

window.MARCA = {
  nombre: "Prototipo Ago",
  ciudad: { es: "Caracas, Venezuela", en: "Caracas, Venezuela" },

  /* ============================================================
     FUERA DE LA VERSIÓN PÚBLICA
     Mientras el sitio esté en GitHub sin dominio, el teléfono y
     el correo van vacíos: la página es pública y Google la
     indexa. Todo el contacto pasa por Instagram.

     Para volver a ponerlos, basta rellenar estas dos líneas: la
     página vuelve a enseñar la tarjeta de WhatsApp y la de
     correo sola, y los botones de pedido vuelven a abrir el chat.
     ============================================================ */
  /* Confirmado por él el 2026-08-11. Formato internacional sin
     signos: es lo que espera wa.me. */
  whatsapp: "584120152753",
  whatsapp_visible: "+58 412 015 27 53",

  correo: "sjdesousar@gmail.com",   /* él, 16/09/2026 */

  instagram: "prototipo_ago",   /* en minúsculas (él, 15/09/2026): así se ve en el pie y en Contacto */

  /* Récord general del juego de apilar tablas: un Worker de Cloudflare
     en su cuenta (16/09/2026). Código: Herramientas/Sitio/record-apilar-worker.js.
     Con null, el juego enseña solo el récord personal. */
  apilar_api: "https://record-apilar.sjdesousar.workers.dev/",


  /* Mensaje con el que se abre WhatsApp desde una ficha.
     {pieza} se reemplaza por el nombre de lo que estaba viendo. */
  mensaje: {
    es: "Hola, te escribo desde la página. Me interesa: {pieza}",
    en: "Hi, I'm writing from your website. I'm interested in: {pieza}"
  },
  mensaje_general: {
    es: "Hola, te escribo desde la página.",
    en: "Hi, I'm writing from your website."
  },

  /* ============================================================
     LO QUE LA GENTE PREGUNTA ANTES DE ESCRIBIR
     Sale en TODAS las fichas de la tienda. Se escribe una vez
     aquí y cambia en todas partes.

     LA GARANTÍA: la redactó Claude y él la APROBÓ tal cual el
     21/09/2026. Es un compromiso suyo con el cliente: no se
     cambia sin preguntarle.
     ============================================================ */
  politicas: {
    entrega: {
      /* 21/09/2026 (él): el delivery depende del tamaño. Pieza
         pequeña $4–15; pieza grande $20–30, y ahí entran los $25 de
         entrega y montaje. */
      es: "Delivery en Caracas: de $4 a $15 si la pieza es pequeña, y de $20 a $30 si es grande, con el montaje incluido. En el catálogo, los pedidos que incluyen tumbona, espejo de baño o toallero tienen un delivery estimado de $10 a $25. Fuera de Caracas se cotiza aparte según la distancia.",
      en: "Delivery in Caracas: $4 to $15 for a small piece, and $20 to $30 for a large one, mounting included. Catalogue orders containing a lounger, bathroom mirror or towel rail have an estimated delivery cost of $10 to $25. Outside Caracas quoted separately by distance."
    },
    garantia: {
      es: "Si algo falla por mi trabajo —una unión que cede, un acabado que se levanta— lo reparo o lo repongo sin costo. No cubre el desgaste normal ni los daños por golpes o humedad.",
      en: "If something fails because of my work — a joint that gives, a finish that lifts — I repair or replace it at no cost. It doesn't cover normal wear, knocks or moisture damage."
    },
    /* 21/09/2026 (él): se cobra dólar × tasa BCV, sin REF. Es la
       regla del 18/09 que ya usa el carrito (ver datos/envios.js);
       esta línea se había quedado con la del 11/08 (REF × BCV). */
    bolivares: {
      es: "Los precios están en dólares. Si pagas en bolívares, se cobra el monto en dólares a la tasa BCV del día del pago, y la cotización vale 7 días.",
      en: "Prices are in US dollars. If you pay in bolívares, the dollar amount is charged at the BCV rate on the day of payment; quotes hold for 7 days."
    }
  }
};
