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

  correo: null,

  instagram: "Prototipo_Ago",

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

     OJO CON LA GARANTÍA: ese texto es un borrador mío. Es un
     compromiso tuyo con el cliente, así que léelo y cámbialo
     antes de publicar el sitio. No me lo inventé de la nada,
     pero tampoco me lo dijiste tú.
     ============================================================ */
  politicas: {
    entrega: {
      es: "Entrega y montaje dentro de Caracas: $25. Fuera de Caracas se cotiza aparte según la distancia.",
      en: "Delivery and mounting within Caracas: $25. Outside Caracas quoted separately by distance."
    },
    garantia: {
      es: "Si algo falla por mi trabajo —una unión que cede, un acabado que se levanta— lo reparo o lo repongo sin costo. No cubre el desgaste normal ni los daños por golpes o humedad.",
      en: "If something fails because of my work — a joint that gives, a finish that lifts — I repair or replace it at no cost. It doesn't cover normal wear, knocks or moisture damage."
    },
    /* CORREGIDO 2026-08-11. Antes decía "se cobra a la tasa BCV
       del día del pago", que es justo la regla que NO se usa:
       convertir directo a BCV regala ~20% de cada venta. Lo que
       se cobra es REF × BCV. Ver datos/envios.js. */
    bolivares: {
      es: "Los precios están en dólares. En bolívares se cobra en REF a la tasa BCV del día del pago, y la cotización vale 7 días.",
      en: "Prices are in US dollars. Bolívar payments are charged in REF at the BCV rate on the day of payment; quotes hold for 7 days."
    }
  }
};
