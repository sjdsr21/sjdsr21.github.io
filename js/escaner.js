/* ============================================================
   ENTRADA DE PÁGINA
   ------------------------------------------------------------
   Los bloques de la página aparecen EN CASCADA, de arriba abajo,
   subiendo un poco mientras se desvanecen hacia dentro.

   Historia corta: aquí hubo un "escáner" de dos barras que
   barrían la pantalla (fuera el 14/08/2026, lo quería
   instantáneo), luego un fade global de 0,18 s y después de
   0,6 s. Ninguno de los dos se notaba, porque un cambio de
   opacidad de TODA la página a la vez no se lee como movimiento:
   no hay nada quieto contra lo que compararlo. Por eso ahora se
   escalonan los bloques — el movimiento se ve porque unos entran
   antes que otros.

   El archivo conserva el nombre `escaner.js`: lo cargan ocho
   páginas y renombrarlo no ganaba nada.

   El orden lo da la POSICIÓN EN PANTALLA, no el orden del HTML.
   No siempre coinciden —la cabecera es fija, y hay rejillas que
   colocan sus hijos en otro orden— y lo que él pidió es que baje
   por la pantalla, no que siga el código.
   ============================================================ */
(function () {
  "use strict";

  var PASO_MS  = 55;    /* separación entre un bloque y el siguiente */
  var TOPE     = 14;    /* más allá de esto, todos entran a la vez:
                           con una rejilla larga el último bloque
                           llegaría varios segundos tarde */

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var raiz = document.documentElement;
  raiz.classList.add("esc-activo");

  /* ENTRADA CORTA al saltar de una pieza a la siguiente con las
     flechas de la ficha. La marca la deja js/sitio.js al pulsar.
     Motivo: recorriendo el catálogo pieza por pieza, la cascada
     entera cada vez cansa; llegando desde la cuadrícula sí va
     completa, que ahí es la primera vez que se ve la página.
     Se consume nada más leerla: si se quedara puesta, la
     siguiente visita entraría corta sin motivo. */
  var corta = false;
  try {
    corta = sessionStorage.getItem("pt-salto-pieza") === "1";
    if (corta) sessionStorage.removeItem("pt-salto-pieza");
  } catch (e) { /* modo privado: se queda en la entrada normal */ }
  if (corta) {
    /* La clase se deja puesta para que js/sitio.js sepa que no
       tiene que revelar nada tampoco (ver `revelar`). */
    raiz.classList.add("esc-corta");
    /* Y aquí, ni cascada ni fade: la página aparece y ya. Se
       intentó primero con la cascada sin escalonar y un fade de
       0,18 s, y seguía viéndose demasiado. */
    raiz.classList.remove("esc-activo");
    return;
  }

  function arrancar() {
    var bloques = [];

    function anadir(nodo) {
      if (!nodo || bloques.indexOf(nodo) !== -1) return;
      var r = nodo.getBoundingClientRect();
      /* fuera lo que no ocupa sitio: envoltorios vacíos y cosas
         que el CSS esconde en este ancho de pantalla */
      if (r.width < 4 || r.height < 4) return;
      bloques.push(nodo);
    }

    /* La CABECERA queda fuera de la cascada (él, 14/08/2026): es
       lo único que está en todas las páginas y en el mismo sitio,
       así que verla entrar cada vez cansaba. Entra el contenido,
       que es lo que cambia. */
    var cuerpo = document.querySelector("main");
    if (cuerpo) {
      var hijos = cuerpo.children;
      /* Si el <main> lleva un solo hijo —el caso de las páginas
         que son una rejilla y ya— se baja un nivel, o si no la
         cascada tendría un único escalón y no se vería. */
      if (hijos.length === 1 && hijos[0].children.length > 1) {
        hijos = hijos[0].children;
      }
      Array.prototype.forEach.call(hijos, anadir);
    }
    anadir(document.getElementById("pie"));

    if (!bloques.length) {
      raiz.classList.remove("esc-activo");
      return;
    }

    /* Los bloques que caen en la PRIMERA PANTALLA se abren en sus
       hijos. Sin esto la cascada tenía tres escalones donde se ve
       —cabecera, portada y el arranque de la primera sección— y
       duraba 170 ms: técnicamente escalonado, pero imperceptible.
       Lo de más abajo se deja entero: nadie lo está mirando, y ya
       tiene su propio revelado al hacer scroll. */
    var alto = window.innerHeight || 800;
    var abiertos = [];
    bloques.forEach(function (b) {
      var r = b.getBoundingClientRect();
      if (r.top < alto * 0.95 && b.children.length > 1 && b.id !== "cabecera") {
        Array.prototype.forEach.call(b.children, function (h) {
          var rh = h.getBoundingClientRect();
          if (rh.width >= 4 && rh.height >= 4) abiertos.push(h);
        });
      } else {
        abiertos.push(b);
      }
    });
    bloques = abiertos;

    bloques.sort(function (a, b) {
      return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
    });

    bloques.forEach(function (e, i) {
      e.classList.add("entra");
      e.style.setProperty("--entra-retraso",
        (Math.min(i, TOPE) * PASO_MS) + "ms");
    });

    /* Ya se puede enseñar la página: los bloques están escondidos
       por su cuenta, así que no hay destello. */
    raiz.classList.remove("esc-activo");

    /* Dos fotogramas: uno para que el navegador se quede con el
       estado inicial y otro para que la transición arranque. Con
       uno solo, ambos cambios se agrupan y no se ve nada. */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        bloques.forEach(function (e) { e.classList.add("entra--ya"); });
      });
    });

    /* Limpieza: quitadas las clases, estos bloques quedan como
       cualquier otro. Si se dejara el `transform`, crearía un
       contexto de apilamiento que rompe los `position: fixed` de
       dentro (el menú móvil, sin ir más lejos). */
    var total = (Math.min(bloques.length, TOPE) * PASO_MS) + 900;
    setTimeout(function () {
      bloques.forEach(function (e) {
        e.classList.remove("entra", "entra--ya");
        e.style.removeProperty("--entra-retraso");
      });
    }, total);
  }

  /* ESPERAR A QUE LA PÁGINA ESTÉ PINTADA. Esto no es un detalle:
     casi todas las páginas del sitio llegan con el <main> vacío y
     lo rellena js/sitio.js. Si se mide antes, los bloques tienen
     altura cero, el filtro de arriba los descarta y la cascada se
     queda en la cabecera — que es exactamente lo que pasaba en
     Exhibición, Novedades, Taller y Contacto mientras en la
     portada sí se veía, porque esa sí trae sus secciones en el
     HTML.

     Dos medidas, y hacen falta las dos: este script se cargó el
     último de todos (mira el final de los .html), y aun así se
     espera a que el contenido tenga cuerpo, por si algún día algo
     se pinta más tarde. */
  var intentos = 0;
  function cuandoHayaContenido() {
    var cuerpo = document.querySelector("main");
    var listo = !cuerpo || cuerpo.getBoundingClientRect().height > 120;
    /* ~20 fotogramas de margen y se arranca igual: más vale una
       cascada pobre que una página que no aparece. */
    if (listo || intentos++ > 20) { arrancar(); return; }
    requestAnimationFrame(cuandoHayaContenido);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", cuandoHayaContenido, { once: true });
  } else {
    cuandoHayaContenido();
  }

  /* Red de seguridad: la página no puede quedarse invisible si
     algo de lo de arriba no llega a correr. */
  setTimeout(function () { raiz.classList.remove("esc-activo"); }, 600);
})();
