/* ============================================================
   PROTOTIPO AGO — motor del sitio
   Un solo archivo. Cada página lleva data-pagina en su <body>
   y aquí abajo se decide qué dibujar.
   No hace falta tocar esto para añadir piezas: eso va en datos/
   ============================================================ */

(function () {
  "use strict";

  /* ---------- tema (claro / oscuro) ------------------------ */

  /* Se aplica ANTES que nada, en la primera linea util del script:
     si se esperara a pintar, quien tenga guardado el modo claro
     veria un fogonazo negro en cada carga. */
  /* Tres estados: oscuro fijo, claro fijo, y AUTO (2026-08-13),
     que sigue lo que tenga configurado el sistema. */
  var TEMAS = ["oscuro", "claro", "auto"];
  var tema = localStorage.getItem("tema");
  /* Por defecto OSCURO, y a proposito no se arranca en auto: la
     marca es negra, y quien no toque nada tiene que ver la marca. */
  if (TEMAS.indexOf(tema) === -1) { tema = "oscuro"; }

  var consultaOscuro = window.matchMedia("(prefers-color-scheme: dark)");
  /* En auto, si el sistema cambia de modo mientras la pagina esta
     abierta, la pagina cambia con el. */
  if (consultaOscuro.addEventListener) {
    consultaOscuro.addEventListener("change", function () {
      if (tema === "auto") aplicarTema();
    });
  }

  aplicarTema();

  function aplicarTema() {
    var claro = (tema === "claro") ||
                (tema === "auto" && !consultaOscuro.matches);
    if (claro) { document.documentElement.setAttribute("data-tema", "claro"); }
    else { document.documentElement.removeAttribute("data-tema"); }
    /* 06/09/2026 · Aviso para quien tenga IMÁGENES distintas por tema
       —los isométricos con cotas, que existen sobre negro y sobre
       blanco—. El tema en sí sigue viviendo en los tokens CSS y no
       necesita repintar nada; esto es solo para los archivos. */
    try {
      document.dispatchEvent(new CustomEvent("pa:tema", { detail: { claro: claro } }));
    } catch (e) { /* navegador viejo: se queda la imagen que hubiera */ }
  }

  function ponerTema(nuevo) {
    tema = nuevo;
    localStorage.setItem("tema", nuevo);
    aplicarTema();
    /* No hace falta repintar: el tema entero vive en los tokens
       CSS. Solo se refresca que boton se ve pulsado. */
    var bs = document.querySelectorAll(".tema button");
    for (var i = 0; i < bs.length; i++) {
      bs[i].setAttribute("aria-pressed", bs[i].dataset.tema === nuevo);
    }
  }

  /* ---------- idioma -------------------------------------- */

  var IDIOMAS = ["es", "en"];
  var idioma = localStorage.getItem("idioma");
  if (IDIOMAS.indexOf(idioma) === -1) {
    /* Español SIEMPRE al entrar por primera vez (él, 14/09/2026). Antes
       miraba el idioma del navegador y un teléfono en inglés abría la web
       en inglés. Si el visitante pulsa EN, eso sí se recuerda (arriba,
       localStorage) y manda sobre esto. */
    idioma = "es";
  }

  function t(clave) {
    var e = window.TEXTOS[clave];
    return e ? (e[idioma] || e.es) : "«" + clave + "»";
  }
  function tx(obj) {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    return obj[idioma] || obj.es || "";
  }
  function etiqueta(grupo, clave) {
    var g = window.TEXTOS[grupo];
    if (!g || !g[clave]) return clave;
    return g[clave][idioma] || g[clave].es;
  }
  function n(plantilla, valor) {
    return t(plantilla).replace("{n}", valor);
  }

  function ponerIdioma(nuevo) {
    idioma = nuevo;
    localStorage.setItem("idioma", nuevo);
    document.documentElement.lang = nuevo;
    pintar();
    /* La página de Prototipos se pinta desde otro archivo
       (js/prototipos.js) y no se entera del cambio de idioma por
       su cuenta. Este aviso es el único enganche entre los dos. */
    window.dispatchEvent(new CustomEvent("idioma-cambiado", { detail: nuevo }));
  }

  /* ---------- utilidades ---------------------------------- */

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ------------------------------------------------------------
     2026-08-17 · DOS MEDIDAS DE CADA FOTO

     Achicar-imagenes.ps1 deja al lado de cada foto grande una copia
     <nombre>-movil.webp de 1000 px, y apunta cuáles en
     datos/imagenes.js. Aquí se le ofrecen las dos al navegador con
     `srcset` y él baja la que le sirva.

     Por qué la copia es de 1000 px y no de 400, que es lo que mide
     el hueco en el teléfono: la pantalla de un teléfono moderno
     tiene entre 2,5 y 3 puntos físicos por cada píxel de CSS. Un
     hueco de 350 px pide en realidad unos 950 de imagen. Con una
     copia de 400 el navegador la descartaría por borrosa y bajaría
     la grande igual — el trabajo no habría servido de nada.

     El `sizes` es una PROMESA que le hacemos al navegador sobre el
     ancho que va a ocupar la foto, y tiene que decidirlo ANTES de
     maquetar, que es por lo que no puede averiguarlo solo. Los
     cortes son los de la rejilla en estilo.css: una columna hasta
     560px, dos hasta 900, tres por encima. Si se cambian allí, hay
     que cambiarlos aquí.
     ------------------------------------------------------------ */
  var MEDIDAS = "(max-width: 560px) 94vw, (max-width: 900px) 48vw, 32vw";
  var CON_MOVIL = null;

  function ponerSrcset(img, src) {
    if (CON_MOVIL === null) {
      /* Un objeto y no el array tal cual: esto se consulta una vez
         por cada foto de la página y buscar en una lista de 50 cada
         vez es tonto. Si el archivo no está —porque nunca se corrió
         el script— queda vacío y no pasa nada. */
      CON_MOVIL = {};
      (window.IMG_MOVIL || []).forEach(function (r) { CON_MOVIL[r] = 1; });
    }
    /* Las rutas del manifiesto son relativas a la raíz del sitio,
       igual que las que se escriben en datos/. Se limpia un ./ de
       delante y cualquier ?v= de detrás por si acaso. */
    var clave = String(src).replace(/^\.\//, "").split("?")[0];
    if (!CON_MOVIL[clave]) return;
    var A = window.IMG_MOVIL_ANCHOS || { grande: 1400, movil: 1000 };
    var chica = clave.replace(/\.webp$/, "-movil.webp");
    img.setAttribute("srcset", chica + " " + A.movil + "w, " +
                               clave + " " + A.grande + "w");
    img.setAttribute("sizes", MEDIDAS);
  }

  /* CAMBIAR LA FOTO DE UN <img> QUE YA ESTA EN LA PAGINA
     ------------------------------------------------------------
     2026-08-27 · Tocar solo `img.src` NO basta. Si la foto tiene
     copia de teléfono lleva también un `srcset`, y el `srcset`
     MANDA sobre el `src`: el navegador sigue enseñando la foto
     anterior aunque el `src` ya apunte a la nueva.

     Eso es lo que rompió las flechas de la cuadrícula de
     Exhibición. El fallo engañaba porque todo lo demás SÍ
     pasaba: el glitch se veía, el contador subía de 1/6 a 2/6...
     y la imagen se quedaba clavada en la primera. Dentro de la
     ficha de la pieza no ocurría, porque allí se sustituye el
     nodo <img> entero en vez de reescribirle el `src`.

     El orden importa: primero se quita el srcset viejo, luego se
     pone el src nuevo, y solo entonces se calcula el srcset que
     le toca. Al revés, el navegador arrancaría una descarga de
     la foto vieja antes de enterarse del cambio. */
  function ponerFoto(img, src) {
    img.removeAttribute("srcset");
    img.removeAttribute("sizes");
    img.src = src;
    ponerSrcset(img, src);
  }

  function el(tag, props, hijos) {
    var e = document.createElement(tag);
    for (var k in (props || {})) {
      if (k === "class") e.className = props[k];
      else if (k === "html") e.innerHTML = props[k];
      else if (k === "texto") e.textContent = props[k];
      else if (props[k] !== null && props[k] !== undefined) e.setAttribute(k, props[k]);
    }
    /* El srcset se pone DESPUÉS del src pero antes de que el nodo
       entre en la página. Si se pusiera más tarde —desde un
       MutationObserver, por ejemplo— el navegador ya habría empezado
       a bajar el src grande y se descargarían las dos. */
    if (tag === "img" && props && props.src) ponerSrcset(e, props.src);
    (hijos || []).forEach(function (h) { if (h) e.appendChild(h); });
    return e;
  }

  function dinero(v) {
    return "$" + (Math.round(v * 100) / 100).toLocaleString("en-US");
  }

  function parametro(nombre) {
    return new URLSearchParams(location.search).get(nombre);
  }

  var verBorradores = parametro("borradores") === "1";

  /* «Repicero Estefania» -> «repicero-estefania» */
  function aClave(texto) {
    return (texto || "")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");  }

  /* Devuelve la ruta del modelo 3D de una pieza, si tiene.
     Primero mira el campo modelo3d escrito a mano; si no, busca
     por el nombre de la carpeta del proyecto en la lista que
     genera Convertir-modelos.ps1. */
  function modeloDe(item) {
    if (item.modelo3d) return item.modelo3d;
    var mapa = window.MODELOS;
    if (mapa && item.carpeta) return mapa[aClave(item.carpeta)] || null;
    return null;
  }

  /* Portada de un video: video/algo.mp4 -> img/trabajos/algo-portada.webp
     Se generan con capturar-portada-video.html. Teniéndola, el
     navegador enseña esa imagen y NO descarga el video hasta que
     le dan al play: la portada pasó de bajar 15 MB a bajar 45 KB.

     15/08/2026 · Pasó de .jpg a .webp con el resto de las
     imágenes. Los .jpg siguen en img/trabajos/ sin tocar; si
     alguna vez hay que volver atrás, se cambia esta línea y ya.
     OJO: capturar-portada-video.html sigue GUARDANDO en .jpg (el
     servidor local solo acepta .jpg y .png), así que al generar
     una portada nueva hay que convertirla a .webp además. */
  function portadaDe(rutaVideo) {
    if (!rutaVideo) return null;
    var nombre = rutaVideo.split("/").pop().replace(/\.mp4$/i, "");
    return "img/trabajos/" + nombre + "-portada.webp";
  }

  /* Deja un <video> parado en el segundo que se le diga, para
     usarlo de portada. El truco de poner #t=2 en la dirección no
     basta: el navegador carga el video pero se queda en el
     fotograma 0, que casi siempre es negro. Hay que mover
     currentTime a mano cuando ya sabe cuánto dura.

     Si el video se puede reproducir, la primera vez que le den
     al play vuelve al principio: si no, se comería los primeros
     segundos. */
  function posarEn(video, segundos, reproducible) {
    function saltar() {
      try { video.currentTime = Math.min(segundos, (video.duration || segundos) - 0.1); }
      catch (e) { /* si no deja buscar, se queda en el primer fotograma */ }
    }
    if (video.readyState >= 1) saltar();
    else video.addEventListener("loadedmetadata", saltar, { once: true });

    if (reproducible) {
      video.addEventListener("play", function volver() {
        if (Math.abs(video.currentTime - segundos) < 0.35) video.currentTime = 0;
        video.removeEventListener("play", volver);
      });
    }
    return video;
  }

  /* ---------- visor de medios ----------------------------- *
   * Miniaturas a la izquierda, pieza grande a la derecha, con
   * flechas que aparecen al pasar el ratón por encima.
   * -------------------------------------------------------- */

  /* Saca la lista de medios de una pieza. Si trae el campo
     "medios" manda ese orden; si no, se arma con lo que haya. */
  function mediosDe(w) {
    if (w.medios && w.medios.length) return w.medios;
    var lista = [];
    if (w.imagen) lista.push({ tipo: "imagen", src: w.imagen });
    (w.galeria || []).forEach(function (g) { lista.push({ tipo: "imagen", src: g }); });
    /* El 3D es UN MEDIO MÁS, igual que en los prototipos (él,
       14/08/2026). Antes era un botón flotando encima de la foto,
       que no se leía como "otra vista" sino como un adorno. */
    var modelo = modeloDe(w);
    if (modelo) lista.push({ tipo: "3d", src: modelo });
    if (w.video) lista.push({ tipo: "video", src: w.video });
    return lista;
  }

  /* ---------- glitch al cambiar de medio ------------------- *
   * El mismo corte que usa el panel de prototipos (él,
   * 15/08/2026): la pieza que se va se rompe en bandas mientras
   * se le separan los canales de color, y la que entra da un
   * tirón corto. El CSS es compartido — vive en css/estilo.css
   * bajo las clases .pt-saliendo y .pt-entrando; antes estaba en
   * prototipos.css, que esta página no carga.
   *
   * Aquí NO se clona nada: se corta el nodo de verdad que sale.
   * De un canvas WebGL (el visor 3D) no hay copia que sacar, y
   * `clip-path` funciona igual sobre una imagen, un vídeo o el
   * visor.
   * -------------------------------------------------------- */
  var sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Saca los nodos viejos del flujo y los desintegra. Se los
     lleva a una capa suelta: si se quedaran dentro, empujarían al
     medio nuevo durante los 105 ms en que conviven los dos. */
  function sacarConGlitch(caja, viejos) {
    if (sinMovimiento || !viejos.length) {
      viejos.forEach(function (n) { n.remove(); });
      return;
    }

    /* Restos de un cambio anterior: pulsando rápido de una
       miniatura a otra se acumularían capas muertas. */
    $$(".pt-saliendo", caja).forEach(function (n) { n.remove(); });

    /* La capa cae justo sobre el hueco que ocupaba el medio, medido
       en píxeles. Con `inset: 0` no vale: la foto no llena el
       recuadro (va a `height: auto`, así que su alto depende de la
       proporción del archivo). */
    var r = viejos[0].getBoundingClientRect();
    var rc = caja.getBoundingClientRect();

    var capa = document.createElement("div");
    capa.className = "pt-saliendo" + (Math.random() < 0.5 ? " pt-saliendo--rojo" : "");
    capa.setAttribute("aria-hidden", "true");
    /* `inset: auto` PRIMERO: la hoja compartida trae `inset: 0`, y
       como es una abreviatura, ponerla después borraría el left y
       el top que se acaban de calcular. */
    capa.style.inset  = "auto";
    capa.style.left   = (r.left - rc.left) + "px";
    capa.style.top    = (r.top  - rc.top)  + "px";
    capa.style.width  = r.width  + "px";
    capa.style.height = r.height + "px";
    viejos.forEach(function (n) { capa.appendChild(n); });

    caja.appendChild(capa);
    setTimeout(function () { capa.remove(); }, 105);
  }

  /* El tirón de canales sobre lo que ENTRA, sea lo que sea. */
  function entrarConGlitch(nodo) {
    if (sinMovimiento || !nodo) return;
    nodo.classList.add("pt-entrando");
    setTimeout(function () { nodo.classList.remove("pt-entrando"); }, 105);
  }

  function visorMedios(lista, alt) {
    var principal = el("div", { class: "visor-medios__principal" });
    var tiras     = el("div", { class: "visor-medios__tiras" });
    var actual    = 0;

    function nodoGrande(m) {
      if (m.tipo === "video") {
        return el("video", { src: m.src, controls: "", preload: "none",
                             playsinline: "", poster: portadaDe(m.src) });
      }
      if (m.tipo === "3d") {
        var visor = el("div", { class: "visor3d" });
        /* se abre en el siguiente tick: Visor3D mide el contenedor
           para encuadrar, y aún no está dentro del documento */
        setTimeout(function () {
          window.Visor3D.abrir(visor, m.src, {
            cargando: t("v3d_cargando"), error: t("v3d_error"), ayuda: t("v3d_ayuda")
          });
        }, 0);
        return visor;
      }
      return el("img", { id: "img-grande", src: m.src, alt: alt || "" });
    }

    function mostrar(i) {
      /* Apagar el visor ANTES de sacarlo del DOM. Si se quita el
         nodo sin más, el bucle de dibujo sigue vivo contra un
         canvas huérfano y se queda comiendo GPU toda la visita. */
      var v3d = $$(".visor3d", principal)[0];
      if (v3d && window.Visor3D) window.Visor3D.cerrar(v3d);

      actual = (i + lista.length) % lista.length;

      /* Fuera lo anterior, pero se dejan las flechas. Solo los
         hijos DIRECTOS: los que ya están dentro de una capa
         .pt-saliendo se están yendo y no hay que tocarlos otra
         vez. */
      var viejos = $$("img, video, .visor3d", principal).filter(function (n) {
        return n.parentNode === principal;
      });

      /* AL 3D SE ENTRA SIN NADA, igual que en los prototipos: el
         .glb tarda en montarse y el corte pasaría sobre el
         recuadro del «Cargando…», no sobre la pieza. Al salir del
         3D sí se corta. */
      var entraA3D = lista[actual].tipo === "3d";
      if (entraA3D) viejos.forEach(function (n) { n.remove(); });
      else sacarConGlitch(principal, viejos);

      var nuevo = nodoGrande(lista[actual]);
      principal.insertBefore(nuevo, principal.firstChild);
      if (!entraA3D) entrarConGlitch(nuevo);
      $$("button", tiras).forEach(function (b, j) {
        b.setAttribute("aria-current", j === actual);
      });
    }

    lista.forEach(function (m, i) {
      var dentro;
      if (m.tipo === "video") {
        /* la miniatura es la portada, no el video: así la tira de
           la izquierda no arrastra megas */
        dentro = [el("img", { src: portadaDe(m.src), alt: "", loading: "lazy" }),
                  el("span", { class: "tira__play" }, [el("span", { html: "&#9654;" })])];
      } else if (m.tipo === "3d") {
        /* un .glb no tiene miniatura: va un rótulo, como el que
           usan los prototipos */
        dentro = [el("span", { class: "tira__glifo", texto: "3D" })];
      } else {
        dentro = [el("img", { src: m.src, alt: "", loading: "lazy" })];
      }
      var b = el("button", { class: "tira" + (m.tipo === "3d" ? " tira--glifo" : ""),
                             type: "button",
                             "aria-label": m.tipo === "3d" ? t("ver_3d") : (i + 1) + "" }, dentro);
      b.addEventListener("click", function () { mostrar(i); });
      tiras.appendChild(b);
    });

    if (lista.length > 1) {
      var izq = el("button", { class: "visor-medios__flecha visor-medios__flecha--izq",
                               type: "button", "aria-label": "Anterior", html: "&#8249;" });
      var der = el("button", { class: "visor-medios__flecha visor-medios__flecha--der",
                               type: "button", "aria-label": "Siguiente", html: "&#8250;" });
      izq.addEventListener("click", function () { mostrar(actual - 1); });
      der.addEventListener("click", function () { mostrar(actual + 1); });
      principal.appendChild(izq);
      principal.appendChild(der);
    }

    mostrar(0);

    /* Flechas del teclado (él, 14/08/2026). Se cuelgan del
       documento porque el foco casi nunca está en el visor, y se
       sueltan si el visor desaparece de la página — sin eso, al
       navegar a otra pieza quedarían dos oyentes peleándose. */
    if (lista.length > 1) {
      var raizVisor = el("div", { class: "visor-medios" }, [tiras, principal]);
      var alTeclado = function (e) {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        if (!document.body.contains(raizVisor)) {
          document.removeEventListener("keydown", alTeclado);
          return;
        }
        var act = document.activeElement;
        if (act && /^(INPUT|TEXTAREA|SELECT)$/.test(act.tagName)) return;
        e.preventDefault();
        mostrar(actual + (e.key === "ArrowRight" ? 1 : -1));
      };
      document.addEventListener("keydown", alTeclado);
      return { raiz: raizVisor, principal: principal };
    }

    return {
      raiz: el("div", { class: "visor-medios" }, [tiras, principal]),
      principal: principal
    };
  }

  /* Caja del visor. Desde el 14/08/2026 el 3D ya NO es un botón
     flotando encima de la foto: entró en la lista de medios (ver
     mediosDe), así que aquí solo queda el envoltorio.
     El botón sigue existiendo para el caso de una pieza que tenga
     modelo y NINGUNA foto, donde no hay tira de miniaturas. */
  function cajaConVisor(principal, modelo, nombre) {
    var caja = el("div", { class: "medios__caja" }, [principal]);
    if (!modelo) return caja;

    var cubo = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
               '<path d="M12 2.6 21 7.4v9.2L12 21.4 3 16.6V7.4z"/>' +
               '<path d="M3 7.4 12 12l9-4.6M12 12v9.4"/></svg>';
    var boton = el("button", { class: "boton3d", type: "button",
      html: cubo + "<span>" + t("ver_3d") + "</span>" });

    boton.addEventListener("click", function () {
      var visor = el("div", { class: "visor3d" });
      caja.replaceChild(visor, principal);
      boton.remove();
      window.Visor3D.abrir(visor, modelo, {
        cargando: t("v3d_cargando"), error: t("v3d_error"), ayuda: t("v3d_ayuda")
      });
    });
    caja.appendChild(boton);
    return caja;
  }

  /* Enlace para pedir o preguntar. Usa lo que haya configurado en
     datos/marca.js, en este orden: WhatsApp, mensaje directo de
     Instagram, y si no hay ninguno, la página de contacto.
     Así el sitio no se rompe cuando el teléfono está vacío. */
  function enlaceWhatsApp(pieza) {
    var M = window.MARCA;
    var m = pieza
      ? tx(M.mensaje).replace("{pieza}", pieza)
      : tx(M.mensaje_general);

    if (M.whatsapp) {
      return "https://wa.me/" + M.whatsapp + "?text=" + encodeURIComponent(m);
    }
    if (M.instagram) {
      return "https://ig.me/m/" + M.instagram;
    }
    return "contacto.html";
  }

  /* ---------- iconos (SVG dibujados aquí, sin archivos) ---- */

  var ICONOS = {
    whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.91-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.7.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.42.25-.69.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35M12.05 21.8h-.01a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 01-1.51-5.26c0-5.45 4.44-9.89 9.89-9.89 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 012.89 6.99c0 5.45-4.43 9.89-9.88 9.89m8.41-18.3A11.82 11.82 0 0012.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 005.69 1.45c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.49-8.42"/></svg>',
    correo:   '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2m0 4.24-7.47 4.67a1 1 0 01-1.06 0L4 8.24V6.4l8 5 8-5z"/></svg>',
    instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.02 4.85.07 3.25.15 4.77 1.7 4.92 4.92.05 1.27.07 1.65.07 4.85s-.02 3.58-.07 4.85c-.15 3.23-1.67 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.18 15.58 2.16 15.2 2.16 12s.02-3.58.07-4.85c.15-3.23 1.67-4.77 4.92-4.92C8.42 2.18 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 2.7.27.28 2.69.08 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.7 21.31.28 16.95.08 15.67.01 15.26 0 12 0m0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32M12 16a4 4 0 110-8 4 4 0 010 8m6.41-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88"/></svg>',
    lupa:     '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.4 15.4 21 21" stroke-linecap="round"/></svg>',

    /* 2026-08-17 · Los tres del tema. Antes eran los caracteres
       ◑ ○ y la palabra "auto", y nadie adivinaba cuál era cuál.
       Van en SVG y no en emoji (☀ ☾) a propósito: un emoji lo
       dibuja cada sistema a su manera —en Windows sale de color y
       más grande que la línea— mientras que un trazo heredado con
       currentColor se ve igual en todas partes y sigue al tema. */
    sol:  '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.4"/>' +
          '<path d="M12 1.8v2.6M12 19.6v2.6M22.2 12h-2.6M4.4 12H1.8' +
          'M19.2 4.8l-1.85 1.85M6.65 17.35 4.8 19.2M19.2 19.2l-1.85-1.85M6.65 6.65 4.8 4.8" stroke-linecap="round"/></svg>',
    luna: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.9A9 9 0 119.1 3.5a7.2 7.2 0 0011.4 11.4z" stroke-linejoin="round"/></svg>',
    /* Medio sol y media luna: la mitad de cada uno, que es
       literalmente lo que hace el modo automático. */
    auto: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.4"/>' +
          '<path d="M12 3.6a8.4 8.4 0 000 16.8z" fill="currentColor" stroke="none"/></svg>'
  };

  /* ---------- buscador ------------------------------------ */

  var cajaBuscador = null;

  /* Quita acentos y mayusculas para que "cubo" encuentre "Cúbo"
     y "meson" encuentre "Mesón". */
  function normalizar(s) {
    return (s || "").toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  /* Junta todo lo buscable del sitio en una sola lista. */
  function indiceBusqueda() {
    var filas = [];

    (window.TRABAJOS || []).forEach(function (w) {
      if (!w.publicado && !verBorradores) return;
      filas.push({
        grupo: "portafolio",
        titulo: tx(w.titulo),
        detalle: [w.anio, w.tipo ? etiqueta("tipo", w.tipo) : null].filter(Boolean).join(" · "),
        imagen: w.imagen,
        url: "trabajo.html?id=" + w.slug,
        texto: normalizar([
          tx(w.titulo), tx(w.resumen), w.anio,
          w.tipo ? etiqueta("tipo", w.tipo) : "",
          (w.materiales || []).map(function (m) { return etiqueta("material", m); }).join(" "),
          (w.acabado || []).map(function (a) { return etiqueta("acabado", a); }).join(" "),
          (tx(w.como) || []).join(" "), w.medidas
        ].join(" "))
      });
    });

    /* 2026-08-11 · El buscador indexaba TIENDA y apuntaba a
       producto.html, que ya no existe. Ahora indexa PROTOTIPOS y
       lleva a la portada, que es donde vive el catálogo. */
    (window.PROTOTIPOS || []).forEach(function (p) {
      if (!p.publicado && !verBorradores) return;
      var precios = p.matriz
        ? Object.keys(p.matriz).map(function (k) { return p.matriz[k]; })
        : null;
      filas.push({
        grupo: "tienda",
        titulo: tx(p.nombre),
        detalle: precios ? t("desde") + " " + dinero(Math.min.apply(null, precios))
                         : dinero(p.precio_usd || 0),
        imagen: p.imagen,
        url: "index.html#" + p.slug,
        texto: normalizar([
          tx(p.nombre), tx(p.resumen), p.medidas ? tx(p.medidas) : "",
          (p.opciones || []).map(function (o) {
            return tx(o.etiqueta) + " " + o.valores.map(function (v) { return tx(v.etiqueta); }).join(" ");
          }).join(" ")
        ].join(" "))
      });
    });

    return filas;
  }

  /* Quién tenía el foco antes de abrir el buscador, para
     devolvérselo al cerrar (15/08/2026). Sin esto, al pulsar Esc
     el foco se quedaba dentro del buscador ya cerrado: quien
     navega con teclado quedaba en un elemento invisible y tenía
     que tabular desde el principio de la página. */
  var focoAntesDelBuscador = null;

  function abrirBuscador() {
    if (!cajaBuscador) cajaBuscador = construirBuscador();
    focoAntesDelBuscador = document.activeElement;
    cajaBuscador.classList.add("abierto");
    var campo = $("input", cajaBuscador);
    campo.value = "";
    $(".buscador__lista", cajaBuscador).innerHTML =
      '<p class="buscador__vacio">' + t("buscar_ayuda") + "</p>";
    setTimeout(function () { campo.focus(); }, 60);
  }

  function cerrarBuscador() {
    /* Si ya estaba cerrado no se toca el foco: Esc se escucha en
       todo el documento y saltaría también con el buscador
       cerrado, robándole el foco a lo que estuviera activo. */
    if (!cajaBuscador || !cajaBuscador.classList.contains("abierto")) return;
    cajaBuscador.classList.remove("abierto");
    if (focoAntesDelBuscador && document.contains(focoAntesDelBuscador)) {
      focoAntesDelBuscador.focus();
    }
    focoAntesDelBuscador = null;
  }

  function construirBuscador() {
    var campo = el("input", { type: "search", placeholder: t("buscar_ph"),
                              "aria-label": t("buscar"), autocomplete: "off" });
    var lista = el("div", { class: "buscador__lista" });
    var cerrar = el("button", { class: "buscador__cerrar", type: "button", texto: "Esc" });

    var caja = el("div", { class: "buscador" }, [
      el("div", { class: "buscador__caja" }, [
        el("div", { class: "buscador__arriba" }, [
          el("span", { html: ICONOS.lupa }), campo, cerrar
        ]),
        lista
      ])
    ]);

    function pintarResultados() {
      var q = normalizar(campo.value.trim());
      lista.innerHTML = "";

      if (!q) {
        lista.appendChild(el("p", { class: "buscador__vacio", texto: t("buscar_ayuda") }));
        return;
      }

      /* todas las palabras tienen que aparecer, en cualquier orden */
      var trozos = q.split(/\s+/);
      var hallados = indiceBusqueda().filter(function (f) {
        return trozos.every(function (p) { return f.texto.indexOf(p) >= 0; });
      });

      if (!hallados.length) {
        lista.appendChild(el("p", { class: "buscador__vacio",
          texto: t("buscar_nada").replace("{q}", campo.value.trim()) }));
        return;
      }

      [["portafolio", "buscar_en_portafolio"], ["tienda", "buscar_en_tienda"]].forEach(function (g) {
        var trozo = hallados.filter(function (f) { return f.grupo === g[0]; });
        if (!trozo.length) return;
        lista.appendChild(el("div", { class: "buscador__grupo", texto: t(g[1]) }));
        trozo.forEach(function (f) {
          lista.appendChild(el("a", { class: "buscador__item", href: f.url }, [
            f.imagen ? el("img", { src: f.imagen, alt: "", loading: "lazy" }) : el("span", { class: "buscador__item-vacio" }),
            el("span", {}, [
              el("strong", { texto: f.titulo }),
              el("small", { texto: f.detalle })
            ])
          ]));
        });
      });
    }

    campo.addEventListener("input", pintarResultados);
    cerrar.addEventListener("click", cerrarBuscador);
    caja.addEventListener("click", function (e) { if (e.target === caja) cerrarBuscador(); });
    campo.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var primero = $(".buscador__item", lista);
        if (primero) location.href = primero.getAttribute("href");
      }
    });

    document.body.appendChild(caja);
    return caja;
  }

  /* Esc cierra · Ctrl+K abre, esté donde esté */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") cerrarBuscador();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault(); abrirBuscador();
    }
  });

  /* ---------- animaciones --------------------------------- */

  /* Se anima solo si el visitante no pidió menos movimiento Y el
     navegador sabe detectar qué hay en pantalla. Si falta una de
     las dos, no se esconde nada: mejor sin animación que con la
     página en blanco. */
  var menosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches
                     || typeof IntersectionObserver !== "function";
  var observador = null;

  /* Marca un elemento (y opcionalmente sus hijos, escalonados)
     para que aparezca cuando entre en pantalla. */
  /* Páginas donde el revelado al hacer scroll está APAGADO. Desde
     el 14/08/2026 estas cuatro entran solo con la cascada de
     js/escaner.js, que es la misma que la portada. Pedido suyo:
     una entrada igual en todo el sitio, sin animaciones sueltas
     encima. El resto —portada, fichas, herramientas— conserva el
     revelado al bajar. */
  var SIN_REVELADO = ["trabajos", "novedades", "taller", "contacto"];

  function revelar(raiz, selectorHijos, pasoMs) {
    if (menosMovimiento) return;
    if (SIN_REVELADO.indexOf(document.body.getAttribute("data-pagina")) !== -1) return;
    /* Saltando de una pieza a otra con las flechas de la ficha no
       se revela nada. Esta es la animación LARGA —0,85 s con 120
       de escalonado— y era la que seguía viéndose después de
       acortar la entrada de js/escaner.js: son dos sistemas
       distintos y hay que apagar los dos. */
    if (document.documentElement.classList.contains("esc-corta")) return;
    var objetivos = selectorHijos ? $$(selectorHijos, raiz) : [raiz];
    objetivos.forEach(function (e, i) {
      e.classList.add("revelar");
      e.style.setProperty("--retraso", (i * (pasoMs || 70)) + "ms");
      observador.observe(e);
    });
  }

  function iniciarObservador() {
    if (menosMovimiento || observador) return;
    observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("visible");
        observador.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: .08 });
  }

  /* La cabecera se encoge al bajar. Solo se engancha una vez,
     aunque se repinte la página al cambiar de idioma. */
  var cabeceraVigilada = false;
  /* Estado del menú desplegable, fuera de `pintarCabecera` para que
     los oyentes de cerrar (scroll, tocar fuera, Esc) se enganchen una
     sola vez y sigan hablando con el menú que esté pintado ahora. */
  var cierresEnganchados = false;
  var yMenuAbierto = 0;
  var menuEstaAbierto = function () { return false; };
  var cerrarMenuActivo = function () {};
  var enfocarHamb = function () {};
  function vigilarCabecera() {
    var cab = $("#cabecera");
    if (!cab || cabeceraVigilada) return;
    cabeceraVigilada = true;
    /* DOS umbrales y no uno (él, 14/09/2026: en el teléfono la cabecera
       "rebotaba" a medio camino). Con un solo corte en 40 px pasaba esto:
       al encogerse, la franja del logotipo se pliega, la página sube lo
       que medía esa franja y el scroll vuelve a quedar POR DEBAJO de 40
       → se desencoge → la página baja → pasa de 40 → se encoge... en
       bucle. Ahora se encoge al pasar de BAJA y solo vuelve a abrirse
       por debajo de SUBE. Entre los dos no cambia nada, y el hueco (132
       px) es más grande que lo que se mueve la página al plegarse, así
       que un cambio ya no puede provocar el contrario. */
    var BAJA = 140, SUBE = 8;
    function alScroll() {
      var y = window.scrollY, encogida = cab.classList.contains("encogida");
      if (!encogida && y > BAJA) cab.classList.add("encogida");
      else if (encogida && y < SUBE) cab.classList.remove("encogida");
    }
    window.addEventListener("scroll", alScroll, { passive: true });
    alScroll();
  }

  /* ---------- cabecera y pie ------------------------------ */

  /* 2026-08-11 · Orden nuevo, y Prototipos pasó a ser la portada.
     Salió "Creaciones" (piezas.html): esa línea la absorbe
     Prototipos, y lo histórico que no está en venta vive en
     Portafolio. Salió también "Herramientas e insumos", que
     nunca llegó a tener nada publicado.
     "Novedades" es lo que antes era la portada: el carrusel y el
     video, sin las rejillas de destacados. */
  /* [clave del nombre, archivo, clave de la palabra de encima,
      es de las tres principales].
     La tercera solo se pinta cuando esa sección es la abierta.

     2026-08-17 · La cuarta marca las TRES que en teléfono salen
     sueltas en el encabezado, en su propia fila: la tienda, el
     catálogo y el contacto. Decisión suya. Novedades y El taller
     se quedan solo dentro de la hamburguesa.
     En escritorio la marca no hace nada: ahí caben las cinco. */
  var MENU = [
    ["nav_prototipos",   "index.html",      "nav_pre_prototipos", true],
    ["nav_trabajos",     "trabajos.html",   "nav_pre_trabajos",   true],
    ["nav_novedades",    "novedades.html",  "nav_pre_novedades",  false],
    ["nav_sobre",        "taller.html",     "nav_pre_sobre",      false],
    ["nav_contacto",     "contacto.html",   "nav_pre_contacto",   true]
  ];

  function pintarCabecera() {
    var host = $("#cabecera");
    if (!host) return;
    var aqui = location.pathname.split("/").pop() || "index.html";

    /* Una sección sin nada publicado no aparece en el menú. Vale
       más no tener la pestaña que tenerla y que lleve a una
       vitrina vacía. Vuelve sola en cuanto haya algo dentro. */
    /* index.html NO se comprueba a propósito: es la portada y
       tiene que estar siempre, aunque un día se quede sin
       productos publicados. */
    var vacias = {
      "trabajos.html": trabajosVisibles().length === 0
    };

    var visibles = MENU.filter(function (m) { return !vacias[m[1]]; });

    /* La fila de tres accesos del teléfono. Va en el DOM SIEMPRE,
       y es el CSS quien la enseña o la esconde según el ancho.
       Los mismos tres enlaces existen también dentro de .menu; en
       teléfono el CSS oculta allí los principales, de modo que
       cada enlace se ve UNA sola vez y un lector de pantalla no
       lo oye repetido —`display: none` lo saca también del árbol
       de accesibilidad—. */
    var rapida = el("nav", { class: "barra-rapida",
                             "aria-label": t("nav_secciones") },
      visibles.filter(function (m) { return m[3]; })
              .map(function (m) {
                return el("a", {
                  class: "barra-rapida__a", href: m[1],
                  "aria-current": m[1] === aqui ? "page" : null,
                  texto: t(m[0])
                });
              })
    );

    var menu = el("nav", { class: "menu", id: "menu" },
      visibles.map(function (m) {
            var activa = m[1] === aqui;
            var a = el("a", {
              href: m[1],
              /* Con esto el CSS de teléfono oculta dentro del menú
                 los tres que ya están en la fila de arriba. */
              "data-principal": m[3] ? "1" : null,
              "aria-current": activa ? "page" : null
            });
            /* La palabra de encima solo existe en la sección
               abierta, y va aparte del nombre para poder darle
               su propio tamaño y opacidad. */
            if (activa && m[2]) {
              a.appendChild(el("span", { class: "menu__pre", texto: t(m[2]) }));
            }
            a.appendChild(el("span", { class: "menu__nombre", texto: t(m[0]) }));
            return a;
          })
    );

    /* 2026-08-17 · Cada control lleva DOS rótulos y el CSS enseña
       uno. En escritorio, donde el sitio son siete cosas apretadas
       en una esquina, va el corto («ES», el glifo). En teléfono,
       donde ahora viven dentro del menú desplegable y hay renglón
       entero, va el largo con la palabra escrita.
       No es duplicar contenido: solo uno está en el árbol de
       accesibilidad en cada momento, porque el otro va con
       `display: none`. Y el nombre hablado va en el aria-label del
       botón, que no depende de cuál se enseñe. */
    var NOMBRE_IDIOMA = { es: "Español", en: "English" };
    var botones = IDIOMAS.map(function (i) {
      var b = el("button", { type: "button", "aria-pressed": i === idioma,
                             "aria-label": NOMBRE_IDIOMA[i] });
      b.appendChild(el("span", { class: "ctrl__corto", texto: i.toUpperCase() }));
      /* El nombre de cada idioma va SIEMPRE en su propio idioma
         —«Español», «English»—, nunca traducido. Es la convención
         de todo selector de idioma que funciona: quien busca su
         lengua la reconoce escrita como la escribe él. */
      b.appendChild(el("span", { class: "ctrl__largo", texto: NOMBRE_IDIOMA[i] }));
      return b;
    });
    botones.forEach(function (b, n) {
      b.addEventListener("click", function () { ponerIdioma(IDIOMAS[n]); });
    });

    /* Conmutador de tema, hermano del de idioma. Sol y luna: no
       hay que traducirlos. La etiqueta hablada si va traducida. */
    var ETIQUETA_TEMA = {
      oscuro: { es: "Modo oscuro", en: "Dark mode" },
      claro:  { es: "Modo claro",  en: "Light mode" },
      auto:   { es: "Automático, según tu sistema",
                en: "Automatic, follows your system" }
    };
    /* La palabra corta que va DENTRO del botón en teléfono. Es
       distinta del aria-label de arriba, que es la frase completa
       para quien escucha la página. */
    var PALABRA_TEMA = {
      oscuro: { es: "Oscuro", en: "Dark" },
      claro:  { es: "Claro",  en: "Light" },
      auto:   { es: "Automático", en: "Automatic" }
    };
    var ICONO_TEMA = { oscuro: ICONOS.luna, claro: ICONOS.sol, auto: ICONOS.auto };
    var botonesTema = TEMAS.map(function (m) {
      var b = el("button", {
        type: "button",
        class: m === "auto" ? "tema__auto" : null,
        title: ETIQUETA_TEMA[m][idioma], "aria-label": ETIQUETA_TEMA[m][idioma],
        "aria-pressed": m === tema
      });
      /* El sol y la luna se dibujan en los dos tamaños. El
         AUTOMÁTICO no: en escritorio sigue diciendo «auto» con
         letras, como siempre (él, 2026-08-17). Y con razón — un
         círculo medio relleno no explica «sigue lo que tenga
         configurado tu computadora»; la palabra sí. */
      if (m === "auto") {
        b.appendChild(el("span", { class: "ctrl__corto", texto: "auto" }));
      } else {
        b.appendChild(el("span", { class: "tema__icono", html: ICONO_TEMA[m] }));
      }
      /* En teléfono los tres llevan su palabra, y el automático
         recupera además su icono, que ahí sí acompaña al texto. */
      if (m === "auto") {
        b.appendChild(el("span", { class: "tema__icono--movil", html: ICONO_TEMA[m] }));
      }
      b.appendChild(el("span", { class: "ctrl__largo", texto: PALABRA_TEMA[m][idioma] }));
      b.dataset.tema = m;
      b.addEventListener("click", function () { ponerTema(m); });
      return b;
    });

    /* aria-expanded dice si el menú está desplegado o no. Sin él,
       un lector de pantalla anuncia «Menú, botón» y se queda ahí:
       no hay forma de saber si pulsar lo abre o lo cierra, ni si
       lo que se acaba de pulsar hizo algo. Se marca también
       aria-controls para atar el botón con la lista que abre. */
    var hamb = el("button", { class: "hamburguesa", type: "button",
                              "aria-label": "Menú", "aria-expanded": "false",
                              "aria-controls": "menu", html: "&#9776;" });
    /* 2026-08-17 · Abrir y cerrar en un solo sitio, porque ahora se
       cierra desde cuatro lados distintos: el propio botón, al
       desplazar la página, al tocar fuera del encabezado y con Esc.
       La clase va también en la CABECERA y no solo en el menú:
       desde que la lupa, el idioma y el tema viven dentro del
       desplegable hay que enseñarlos y esconderlos con él, y son
       hermanos de .menu, no hijos. Con la clase en el padre común
       el CSS los alcanza sin depender del orden de los hermanos. */
    function ponerMenu(abierto) {
      menu.classList.toggle("abierto", abierto);
      host.classList.toggle("cabecera--abierta", abierto);
      hamb.setAttribute("aria-expanded", abierto ? "true" : "false");
      menuEstaAbierto = function () { return menu.classList.contains("abierto"); };
      if (abierto) yMenuAbierto = window.scrollY;
    }
    menuEstaAbierto = function () { return menu.classList.contains("abierto"); };

    hamb.addEventListener("click", function () { ponerMenu(!menuEstaAbierto()); });

    /* Los tres oyentes de cerrar cuelgan del documento y de la
       ventana, así que se enganchan UNA SOLA VEZ. `pintarCabecera`
       se vuelve a llamar cada vez que se cambia de idioma, y sin
       este candado se irían acumulando copias en cada cambio,
       todas apuntando a menús viejos que ya no están en la página.
       Por eso hablan con `cerrarMenuActivo`, una variable de fuera
       que siempre apunta al menú recién pintado. */
    cerrarMenuActivo = function () { ponerMenu(false); };
    enfocarHamb = function () { hamb.focus(); };
    if (!cierresEnganchados) {
      cierresEnganchados = true;

      /* Se recoge en cuanto empiezas a desplazar la página, para
         arriba o para abajo (él). El umbral de 4 px NO es capricho:
         en el móvil, al aparecer o desaparecer la barra de
         direcciones del navegador se dispara un evento de scroll sin
         que el dedo haya movido nada, y sin umbral el menú se
         cerraría solo nada más abrirlo. */
      window.addEventListener("scroll", function () {
        if (menuEstaAbierto() && Math.abs(window.scrollY - yMenuAbierto) > 4) {
          cerrarMenuActivo();
        }
      }, { passive: true });

      /* Y al tocar cualquier cosa que no sea el encabezado. Va en
         `pointerdown` y no en `click`: así se recoge en cuanto
         apoyas el dedo, no al levantarlo, que es cuando se espera
         que ya esté fuera de en medio.
         Comprueba `contains` sobre la cabecera, de modo que pulsar
         DENTRO del menú —cambiar de idioma, de tema— no lo cierra. */
      document.addEventListener("pointerdown", function (ev) {
        var cab = document.getElementById("cabecera");
        if (menuEstaAbierto() && cab && !cab.contains(ev.target)) cerrarMenuActivo();
      });

      /* Esc lo cierra y devuelve el foco al botón, que es de donde
         salió: si no, quien navega con teclado se queda con el foco
         en un enlace que acaba de desaparecer. */
      document.addEventListener("keydown", function (ev) {
        if (ev.key === "Escape" && menuEstaAbierto()) { cerrarMenuActivo(); enfocarHamb(); }
      });
    }

    /* La lupa lleva ahora su palabra al lado, que solo se ve en
       teléfono: dentro del menú desplegado es un renglón más entre
       renglones con nombre, y una lupa suelta ahí no se lee como
       «Buscar» sino como un adorno. */
    var lupa = el("button", { class: "lupa", type: "button",
      "aria-label": t("buscar") }, [
      el("span", { class: "lupa__icono", html: ICONOS.lupa }),
      el("span", { class: "ctrl__largo", texto: t("buscar") })
    ]);
    lupa.addEventListener("click", abrirBuscador);

    host.innerHTML = "";
    host.classList.add("cabecera");   /* add, no className=, para no borrar "encogida" */
    host.appendChild(el("div", { class: "cabecera__fila" }, [
      el("a", { class: "marca", href: "index.html", "aria-label": window.MARCA.nombre }, [
        /* 2026-08-11 · El logotipo dejó de ser imagen y pasó a ser
           TEXTO: Poppins 700, todo en caja baja, dos renglones al
           ras del mismo borde derecho. Es la misma geometría del
           PNG, dibujada por el navegador.

           Ventaja de que sea texto: se reescala sin pesar, hereda
           el color del tema (nada de dos archivos conmutados) y
           el modo claro sale solo.

           OJO: esto cambia SOLO la web. Los PNG de
           img/marca/ siguen ahí y los siguen usando los PDF de
           presupuesto y el Optimizador de Corte. No los borres. */
        el("span", { class: "marca__texto", "aria-hidden": "true",
                     html: "prototipo<br>ago" }),
        /* .webp desde el 15/08/2026: el PNG pesaba 168 KB para
           pintarse a 71 px y viajaba en TODAS las páginas — era lo
           más pesado que bajaba el sitio de entrada. En WebP son
           10 KB. El .png sigue en img/marca/ por si acaso. */
        el("img", { class: "marca__perfil", src: "img/marca/perfil.webp", alt: "" })
      ]),
      hamb,
      rapida,
      menu,
      /* 2026-08-17 · Lupa + idioma + tema cuelgan de UN envoltorio.
         Antes eran dos items sueltos de la fila.
         En escritorio siguen en la esquina de siempre. En teléfono
         el envoltorio se va DENTRO del desplegable, debajo de
         Novedades y El taller, y aparece y desaparece con él.
         Agrupados se mueven de una pieza; sueltos habría que
         colocar dos cosas y la fila se quedaba con el hueco de una
         de ellas. */
      el("div", { class: "cabecera__utiles" }, [
        lupa,
        /* Idioma y tema van dentro de UNA caja. Sueltos eran dos items
           del flex y en móvil la fila los partía en renglones
           distintos: el idioma acababa abajo con el menú y el tema
           arriba con la lupa. Agrupados no se separan nunca. */
        el("div", { class: "controles" }, [
          el("div", { class: "idioma" }, botones),
          el("div", { class: "tema" }, botonesTema)
        ])
      ])
    ]));
  }

  /* 2026-08-14 · Aquí se montaba la FRANJA DE NOVEDADES: una tira
     delgada bajo el encabezado con un aviso cruzando de derecha a
     izquierda. Se probó y no le gustó, así que fuera entera —el
     JS, su CSS y la lista `avisos` de datos/marca.js—. */

  function pintarPie() {
    var host = $("#pie");
    if (!host) return;
    var M = window.MARCA;
    var enlaces = [];
    if (M.whatsapp) {
      enlaces.push(el("a", { href: enlaceWhatsApp(null), target: "_blank",
                             rel: "noopener", texto: "WhatsApp" }));
    }
    if (M.correo) {
      enlaces.push(el("a", { href: "mailto:" + M.correo, texto: M.correo }));
    }
    if (M.instagram) {
      enlaces.push(el("a", {
        href: "https://instagram.com/" + M.instagram, target: "_blank", rel: "noopener",
        texto: "Instagram"
      }));
    }
    host.className = "pie";
    host.innerHTML = "";
    host.appendChild(el("div", { class: "contenedor" }, [
      el("div", { class: "pie__fila" }, [
        el("span", { texto: M.nombre + " · " + tx(M.ciudad) }),
        el("div", { class: "pie__enlaces" }, enlaces)
      ])
    ]));
  }

  /* ---------- tarjetas ------------------------------------ */

  /* Mira el brillo de la esquina de la imagen donde cae el sello
     3D. Si esa zona es oscura, el sello se pinta color hueso;
     si es clara, se queda en khaki oscuro. Así se ve siempre,
     tanto sobre una foto en el campo como sobre una vista de
     propuesta con fondo negro. */
  function ajustarSello(img, sello) {
    function medir() {
      try {
        var lienzo = document.createElement("canvas");
        var lado = 40;
        lienzo.width = lado; lienzo.height = lado;
        var ctx = lienzo.getContext("2d");
        /* solo la esquina superior izquierda, que es donde va */
        ctx.drawImage(img, 0, 0, img.naturalWidth * 0.3, img.naturalHeight * 0.3,
                      0, 0, lado, lado);
        var d = ctx.getImageData(0, 0, lado, lado).data;
        var suma = 0;
        for (var i = 0; i < d.length; i += 4) {
          suma += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
        }
        var brillo = suma / (d.length / 4);
        /* Se marcan los DOS casos, no solo uno. Antes solo se ponía
           la clase cuando la imagen era oscura y el otro caso se
           dejaba en el valor por defecto. Con el sitio en negro ese
           defecto es negro sobre tarjeta negra, así que mientras la
           imagen no cargaba el sello no se veía. Ahora el defecto es
           blanco (seguro sobre la tarjeta) y esta clase es la que
           pinta de negro cuando la imagen resulta ser clara. */
        sello.classList.toggle("marca3d--claro",  brillo < 120);
        sello.classList.toggle("marca3d--oscuro", brillo >= 120);
      } catch (e) { /* si el navegador no deja leer la imagen, se queda blanco */ }
    }
    if (img.complete && img.naturalWidth) medir();
    else img.addEventListener("load", medir, { once: true });
  }

  function marcoImagen(src, avisoRender, borrador, descripcion) {
    var hijos = [];
    if (borrador) hijos.push(el("span", { class: "insignia insignia--borrador", texto: "borrador" }));
    if (src) {
      /* el texto alternativo describe la pieza: lo usan los
         buscadores y quien navegue con lector de pantalla */
      var im = el("img", { src: src, alt: descripcion || "", loading: "lazy" });
      if (avisoRender) {
        var sello = el("span", { class: "marca3d", texto: "3D" });
        hijos.push(sello);
        ajustarSello(im, sello);
      }
      hijos.push(im);
    } else {
      hijos.push(el("span", { class: "tarjeta__vacio", texto: idioma === "es" ? "sin imagen" : "no image" }));
    }
    return el("div", { class: "tarjeta__marco" }, hijos);
  }

  function tarjetaTrabajo(w) {
    /* 2026-08-11 · El AÑO ya no sale en la cuadrícula: lo quitó él
       porque en una vitrina fecha la pieza sin aportar nada. Sigue
       apareciendo en la ficha de la pieza, al abrirla. Sí se deja
       en el texto alternativo, que es para buscadores y lectores
       de pantalla, no para la vista. */
    /* 2026-08-14 · La CATEGORÍA tampoco sale ya en la cuadrícula
       —«exterior», «exhibición», «mesa», «accesorio»—: la quitó
       él. Sigue en la ficha y en el texto alternativo, que es
       para buscadores y lectores de pantalla. */
    var meta = [];
    if (w.tipo) meta.push(etiqueta("tipo", w.tipo));

    var alt = [tx(w.titulo), w.anio, meta.join(", ")].filter(Boolean).join(" — ");

    /* El sello «3D» de la esquina se quitó de la cuadrícula
       (2026-08-12): ensuciaba la vitrina. Se sigue pasando
       `es_render` en la ficha de la pieza, donde sí tiene sentido
       avisar de que la imagen es un render y no una foto. */
    /* 2026-08-16 · Se puede pasar la galería SIN abrir la pieza, igual
       que en la cuadrícula de Prototipos.

       La tarjeta dejó de ser un <a> por eso: un enlace no puede
       contener botones —el navegador los desanida— y las flechas van
       dentro. Ahora es un <div> y el enlace de verdad es el del
       título, que se estira sobre toda la tarjeta con un ::after. Las
       flechas quedan por encima por z-index. Es el mismo arreglo que
       ya se hizo en js/prototipos.js; ver el comentario largo de allí.

       Enter y espacio siguen funcionando solos: el título es un <a>
       de verdad, no un div con rol. */
    var fotos = fotosDe(w);
    var i = fotoTarjeta[w.slug] || 0;
    if (i >= fotos.length) { i = 0; fotoTarjeta[w.slug] = 0; }

    var marco = marcoImagen(fotos[i] || w.imagen, false, !w.publicado, alt);
    if (fotos.length > 1) {
      marco.appendChild(el("button", {
        class: "tarjeta__flecha tarjeta__flecha--izq", type: "button",
        "data-paso": "-1", "aria-label": t("pt_anterior"), texto: "‹"
      }));
      marco.appendChild(el("button", {
        class: "tarjeta__flecha tarjeta__flecha--der", type: "button",
        "data-paso": "1", "aria-label": t("pt_siguiente"), texto: "›"
      }));
      marco.appendChild(el("span", {
        class: "tarjeta__cuenta", texto: (i + 1) + "/" + fotos.length
      }));
    }

    /* h2 y no h3 (15/08/2026): en Exhibición la cuadrícula cuelga
       directamente del <h1> de la página, sin ninguna sección
       intermedia, así que con h3 la jerarquía saltaba de 1 a 3.
       Es como una tabla de contenidos a la que le falta un
       escalón. El aspecto no cambia: el CSS de abajo apunta a los
       dos niveles. */
    return el("div", { class: "tarjeta", "data-slug": w.slug }, [
      marco,
      el("h2", {}, [
        el("a", { class: "tarjeta__abrir", href: "trabajo.html?id=" + w.slug,
                  texto: tx(w.titulo) })
      ])
    ]);
  }

  /* GLITCH AL PASAR DE FOTO EN LA CUADRÍCULA (2026-08-17).
     El de más arriba, `sacarConGlitch`, sirve para cambiar de MEDIO
     dentro de la ficha de una pieza: corta el nodo viejo mientras se
     va. Aquí no se puede, porque el <img> se queda y solo le cambia
     el `src`. Así que se clona: se deja encima una copia congelada de
     la foto vieja que se desintegra en 105 ms mientras la nueva ya
     está debajo.

     Es el mismo efecto que la cuadrícula de Prototipos —ver
     `cambiarFoto` en js/prototipos.js—, y usa sus mismas clases, que
     viven en estilo.css y por eso están disponibles aquí. */
  function cambiarFoto(img, nuevaSrc) {
    if (!img || img.getAttribute("src") === nuevaSrc) return;
    if (menosMovimiento) { ponerFoto(img, nuevaSrc); return; }

    var caja = img.parentNode;
    if (!caja) { ponerFoto(img, nuevaSrc); return; }

    /* dos glitches superpuestos se ven sucios y dejan basura en el
       DOM si se pulsa rápido */
    var previo = caja.querySelector(".pt-glitch");
    if (previo) previo.remove();

    /* `currentSrc` y no `src`: es la medida que el navegador tiene
       de verdad en pantalla (la de teléfono, si eligió esa). Con
       `src` a secas, la copia congelada se bajaba en grande solo
       para un fantasma de 105 ms. */
    var vieja = img.currentSrc || img.getAttribute("src");
    /* Cara o cruz en CADA cambio, no una vez por sesión: si no, el
       desfase de color se vuelve predecible. */
    var rojo = Math.random() < 0.5;

    var capa = document.createElement("span");
    capa.className = "pt-glitch" + (rojo ? " pt-glitch--rojo" : "");
    capa.setAttribute("aria-hidden", "true");
    capa.innerHTML = '<img src="' + vieja + '" alt="">' +
                     '<img src="' + vieja + '" alt="">' +
                     '<img src="' + vieja + '" alt="">';

    /* La copia tiene que caer EXACTAMENTE sobre la original, así que
       se mide y se coloca en píxeles: con `inset: 0` no basta, porque
       una imagen es un elemento reemplazado y usa su propio tamaño.
       Se copia también el `object-fit`. */
    var rImg = img.getBoundingClientRect();
    var rCaja = caja.getBoundingClientRect();
    capa.style.left   = (rImg.left - rCaja.left) + "px";
    capa.style.top    = (rImg.top  - rCaja.top)  + "px";
    capa.style.width  = rImg.width  + "px";
    capa.style.height = rImg.height + "px";

    var encaje = getComputedStyle(img).objectFit;
    Array.prototype.forEach.call(capa.children, function (c) {
      c.style.objectFit = encaje;
    });

    caja.appendChild(capa);

    ponerFoto(img, nuevaSrc);
    img.classList.remove("pt-entrando", "pt-entrando--rojo");
    void img.offsetWidth;                 /* reinicia la animación */
    img.classList.add("pt-entrando");
    if (rojo) img.classList.add("pt-entrando--rojo");

    /* 105 ms: la animación dura 85 y sobran 20 de margen. */
    setTimeout(function () {
      capa.remove();
      img.classList.remove("pt-entrando", "pt-entrando--rojo");
    }, 105);
  }

  /* Solo las IMÁGENES de la pieza: en la cuadrícula no se pasa a un
     video ni al visor 3D, que no se pueden enseñar en una miniatura. */
  function fotosDe(w) {
    return mediosDe(w).filter(function (m) { return m.tipo === "imagen"; })
                      .map(function (m) { return m.src; });
  }

  var fotoTarjeta = {};

  /* Un solo escuchador para toda la página, puesto una vez. Las
     flechas paran el evento: sin eso, cada flechazo abriría la pieza
     porque el enlace del título cubre la tarjeta entera. */
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".tarjeta__flecha");
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    var tarjeta = b.closest(".tarjeta");
    var slug = tarjeta.getAttribute("data-slug");
    var w = (window.TRABAJOS || []).filter(function (x) { return x.slug === slug; })[0];
    if (!w) return;
    var fotos = fotosDe(w);
    if (fotos.length < 2) return;

    var i = (fotoTarjeta[slug] || 0) + parseInt(b.getAttribute("data-paso"), 10);
    if (i < 0) i = fotos.length - 1;
    if (i >= fotos.length) i = 0;
    fotoTarjeta[slug] = i;

    var img = tarjeta.querySelector(".tarjeta__marco img");
    if (img) cambiarFoto(img, fotos[i]);
    var cuenta = tarjeta.querySelector(".tarjeta__cuenta");
    if (cuenta) cuenta.textContent = (i + 1) + "/" + fotos.length;
  });

  function tarjetaProducto(p) {
    var meta = [];
    if (p.familia === "herramienta" && p.categoria) meta.push(etiqueta("categoria", p.categoria));
    meta.push(p.disponibilidad === "stock" ? t("disp_stock")
            : p.disponibilidad === "agotado" ? t("disp_agotado")
            : t("disp_pedido"));

    var tienenOpciones = p.opciones && p.opciones.some(function (o) {
      return o.valores.some(function (v) { return v.delta !== 0; });
    });

    return el("a", { class: "tarjeta", href: "producto.html?id=" + p.slug }, [
      marcoImagen(p.imagen, p.es_render, !p.publicado, tx(p.nombre)),
      el("h3", { texto: tx(p.nombre) }),
      el("div", { class: "tarjeta__meta", texto: meta.join(" · ") }),
      el("div", { class: "tarjeta__precio",
        texto: p.precio_usd == null
                 ? t("consultar")
                 : (tienenOpciones ? t("desde") + " " : "") + dinero(p.precio_usd) })
    ]);
  }

  function rejilla(items, hacerTarjeta) {
    if (!items.length) return el("p", { class: "vacio", texto: t("sin_resultados") });
    return el("div", { class: "rejilla" }, items.map(hacerTarjeta));
  }

  /* ---------- datos visibles ------------------------------ */

  function trabajosVisibles() {
    var lista = window.TRABAJOS.filter(function (w) { return w.publicado || verBorradores; });
    /* Orden de prueba (14/09/2026). Si datos/trabajos.js trae
       window.ORDEN_TRABAJOS —una lista de slugs—, las piezas salen en
       ese orden; las que no estén en la lista van detrás, en el orden
       del archivo (sort es estable). Sin la lista, todo queda como antes. */
    var orden = window.ORDEN_TRABAJOS;
    if (!orden || !orden.length) return lista;
    function pos(w) { var i = orden.indexOf(w.slug); return i === -1 ? orden.length : i; }
    return lista.slice().sort(function (a, b) { return pos(a) - pos(b); });
  }
  function tiendaVisible(familia) {
    return window.TIENDA.filter(function (p) {
      return p.familia === familia && (p.publicado || verBorradores);
    });
  }

  /* ---------- carrusel ------------------------------------ *
   * Se desliza de lado. Avanza solo cada 5,5 s, se detiene
   * cuando el ratón está encima, y se puede arrastrar con el
   * dedo en el teléfono.
   * -------------------------------------------------------- */

  function montarCarrusel(host, items) {
    if (!host) return;
    host.innerHTML = "";
    if (!items.length) { host.hidden = true; return; }
    host.hidden = false;

    var actual = 0, reloj = null;

    var pista = el("div", { class: "carrusel__pista" }, items.map(function (w) {
      /* Si la novedad trae video, la portada es el propio video
         parado en el segundo 2 (#t=2): es su miniatura real, sin
         tener que extraer ningún fotograma aparte. */
      /* La portada de la novedad es una IMAGEN, aunque la pieza
         tenga video. Antes era el propio <video>, y eso hacia que
         la pagina de inicio se descargara el archivo entero solo
         para ensenar un fotograma. */
      var medio = el("img", {
        src: (w.video ? portadaDe(w.video) : w.imagen),
        alt: tx(w.titulo), loading: "eager"
      });
      var capa = el("div", { class: "novedad__capa" }, [
        el("span", { class: "novedad__etiqueta", texto: t("novedad") }),
        el("h2", { texto: t("novedad_cta") })
      ]);
      if (tx(w.resumen)) capa.appendChild(el("p", { texto: tx(w.resumen) }));
      capa.appendChild(el("span", { class: "novedad__ir" }, [
        document.createTextNode(t("saber_mas")),
        el("span", { html: "&rarr;" })
      ]));

      return el("a", { class: "carrusel__lamina novedad", href: "trabajo.html?id=" + w.slug }, [
        el("div", { class: "novedad__medio" }, [medio]),
        capa
      ]);
    }));

    var puntos = el("div", { class: "carrusel__puntos" }, items.map(function (w, i) {
      var b = el("button", { type: "button", "aria-label": tx(w.titulo), "aria-current": i === 0 });
      b.addEventListener("click", function () { ir(i); reiniciar(); });
      return b;
    }));

    function ir(i) {
      actual = (i + items.length) % items.length;
      pista.style.transform = "translateX(" + (-actual * 100) + "%)";
      $$("button", puntos).forEach(function (b, j) { b.setAttribute("aria-current", j === actual); });
    }
    function reiniciar() {
      clearInterval(reloj);
      if (menosMovimiento || items.length < 2) return;
      reloj = setInterval(function () { ir(actual + 1); }, 5500);
    }

    var izq = el("button", { class: "carrusel__flecha carrusel__flecha--izq", type: "button", "aria-label": "Anterior", html: "&#8249;" });
    var der = el("button", { class: "carrusel__flecha carrusel__flecha--der", type: "button", "aria-label": "Siguiente", html: "&#8250;" });
    izq.addEventListener("click", function () { ir(actual - 1); reiniciar(); });
    der.addEventListener("click", function () { ir(actual + 1); reiniciar(); });

    host.appendChild(pista);
    if (items.length > 1) { host.appendChild(izq); host.appendChild(der); host.appendChild(puntos); }

    host.addEventListener("mouseenter", function () { clearInterval(reloj); });
    host.addEventListener("mouseleave", reiniciar);

    /* arrastre con el dedo */
    var x0 = null;
    host.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; clearInterval(reloj); }, { passive: true });
    host.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var d = e.changedTouches[0].clientX - x0;
      if (Math.abs(d) > 45) ir(actual + (d < 0 ? 1 : -1));
      x0 = null; reiniciar();
    });

    ir(0);
    reiniciar();
  }

  /* ---------- páginas ------------------------------------- */

  var paginas = {};

  /* 2026-08-11 · Se llamaba `inicio`. Al pasar el catálogo a la
     portada, esta página se volvió `novedades.html` con
     data-pagina="novedades", y como aquí seguía diciendo `inicio`
     no se ejecutaba NADA: ni carrusel, ni video, ni los textos de
     la portada. La página salía en blanco. */
  paginas.novedades = function () {
    /* 2026-08-14 · Aquí se rellenaba la portada («Muebles hechos
       de a uno», su bajada y los dos botones) y se le montaba una
       entrada escalonada propia. Se quitó todo con el bloque del
       HTML: la página arranca en el carrusel y la entrada la lleva
       js/escaner.js, igual que el resto del sitio. */

    /* El titular invisible de la página. Se rellena aquí y no en
       el HTML para que cambie con el idioma como todo lo demás. */
    var h1nv = $("#nv-titulo");
    if (h1nv) h1nv.textContent = t("nav_novedades");

    /* El área de novedades: solo lo marcado con novedad:true en
       datos/trabajos.js. Si mañana hay dos, se desliza sola. */
    var novedades = trabajosVisibles().filter(function (w) { return w.novedad; });
    montarCarrusel($("#carrusel"), novedades);

    /* Reproductor del video largo, con su texto al lado */
    var conVideo = novedades.filter(function (w) { return w.video; })[0];
    var hostVideo = $("#video-novedad");
    if (hostVideo && conVideo) {
      var como = tx(conVideo.como) || [];
      hostVideo.innerHTML = "";
      hostVideo.appendChild(el("div", { class: "contenedor" }, [
        el("div", { class: "pieza-video" }, [
          el("video", { src: conVideo.video, controls: "", preload: "none",
                        playsinline: "", poster: portadaDe(conVideo.video) }),
          el("div", { class: "pieza-video__texto" }, [
            el("span", { class: "rotulo", texto: tx(conVideo.titulo) })
          ].concat(como.map(function (parrafo) {
            return el("p", { texto: parrafo });
          })).concat([
            el("a", { class: "boton", style: "margin-top:1.4rem",
                      href: "trabajo.html?id=" + conVideo.slug, texto: t("ver_ficha") })
          ]))
        ])
      ]));
      revelar(hostVideo, ".pieza-video > *", 140);
    } else if (hostVideo) {
      hostVideo.hidden = true;
    }

    /* 2026-08-11 · Quedan solo los trabajos. Las rejillas de
       Creaciones y Herramientas salieron de Novedades por
       petición suya, y sus páginas ya no existen. El bucle de
       abajo ignora los que no encuentra, así que esto es
       suficiente. */
    var bloques = [
      ["#dest-trabajos", trabajosVisibles().filter(function (w) { return w.destacado; }).slice(0, 4), tarjetaTrabajo, "trabajos_titulo", "trabajos.html"]
    ];

    bloques.forEach(function (b) {
      var host = $(b[0]);
      if (!host) return;
      host.innerHTML = "";
      host.appendChild(el("div", { class: "contenedor" }, [
        el("div", { class: "seccion__cabeza" }, [
          el("h2", { texto: t(b[3]) }),
          el("a", { href: b[4], texto: t("ver_todo") + " →" })
        ]),
        rejilla(b[1], b[2])
      ]));
      revelar(host, ".seccion__cabeza, .tarjeta", 80);
    });
  };

  /* 2026-08-11 · Aquí vivían los tres filtros (tipo, madera, año),
     el botón de limpiar y el contador. Los quitó él: quiere solo
     la cuadrícula. Con ellos se fueron unas 60 líneas de estado y
     manejadores que ya no hacen falta. Las claves filtro_* siguen
     en textos.js por si algún día vuelven. */
  paginas.trabajos = function () {
    $("#titulo").textContent = t("trabajos_titulo");
    $("#bajada").textContent = t("trabajos_bajada");

    var host = $("#rejilla");
    host.innerHTML = "";
    /* `rejilla--tres` la separa de la de Prototipos: aquí van tres
       por fila y con un hueco entre piezas, no pegadas. */
    var r = rejilla(trabajosVisibles(), tarjetaTrabajo);
    r.classList.add("rejilla--tres");
    host.appendChild(r);
    revelar(host, ".tarjeta", 45);
  };

  /* Los tres botones de la cabecera de una ficha: anterior, volver
     al catálogo, siguiente.

     Recorre la MISMA lista que la cuadrícula, así que el orden de
     aquí y el de allá no se pueden desincronizar. Da la vuelta en
     los extremos: de la última se pasa a la primera.

     Si la pieza que se está viendo no está en la lista —se llegó
     por un enlace directo a algo sin publicar, con ?borradores=1—
     no hay anterior ni siguiente, y queda solo el del medio. */
  function navegarPiezas(w) {
    var lista = trabajosVisibles();
    var i = -1;
    for (var k = 0; k < lista.length; k++) {
      if (lista[k].slug === w.slug) { i = k; break; }
    }

    var volver = el("a", {
      class: "volver navpieza__volver", href: "trabajos.html",
      texto: t("ficha_volver")
    });

    if (i < 0 || lista.length < 2) {
      return el("nav", { class: "navpieza navpieza--sola" }, [volver]);
    }

    var antes = lista[(i - 1 + lista.length) % lista.length];
    var luego = lista[(i + 1) % lista.length];

    /* El nombre de la pieza destino va en el `title` y en el texto
       para lectores de pantalla, no a la vista: con tres botones
       en una fila, tres nombres largos no caben. */
    function salto(pieza, clase, flecha, etiqueta) {
      var a = el("a", {
        class: "volver navpieza__salto " + clase,
        href: "trabajo.html?id=" + pieza.slug,
        title: etiqueta + ": " + tx(pieza.titulo),
        "aria-label": etiqueta + ": " + tx(pieza.titulo)
      }, [
        el("span", { "aria-hidden": "true", texto: flecha })
      ]);

      /* Se deja una marca para que la página que viene entre con
         la animación CORTA (él, 14/08/2026): saltando de una pieza
         a otra, ver la cascada entera cada vez cansa. Cuando se
         llega desde la cuadrícula sí va completa.

         Va en sessionStorage y no en la dirección: así el enlace
         que él copie y mande sigue siendo limpio, y la marca no
         sobrevive a cerrar la pestaña. La lee y la borra
         js/escaner.js. */
      a.addEventListener("click", function () {
        try { sessionStorage.setItem("pt-salto-pieza", "1"); } catch (e) { /* modo privado */ }
      });
      return a;
    }

    return el("nav", { class: "navpieza", "aria-label": t("ficha_volver") }, [
      salto(antes, "navpieza__antes", "←", t("pieza_anterior")),
      volver,
      salto(luego, "navpieza__luego", "→", t("pieza_siguiente"))
    ]);
  }

  paginas.trabajo = function () {
    var w = window.TRABAJOS.filter(function (x) { return x.slug === parametro("id"); })[0];
    var host = $("#ficha");
    host.innerHTML = "";

    if (!w) {
      host.appendChild(el("p", { class: "vacio", texto: t("no_encontrado") }));
      return;
    }
    document.title = tx(w.titulo) + " · " + window.MARCA.nombre;

    /* --- medios --- */
    var medios = el("div", { class: "ficha__medios" });
    var lista = mediosDe(w);
    if (lista.length > 1) {
      /* varias piezas de multimedia: tira de miniaturas + grande */
      /* sin modelo suelto: el 3D ya viene dentro de `lista` */
      var visor = visorMedios(lista, tx(w.titulo));
      medios.appendChild(el("div", { class: "medios__caja" }, [visor.raiz]));
    } else {
      var principal = el("div", { class: "ficha__principal" });
      if (w.imagen) principal.appendChild(el("img", { id: "img-grande", src: w.imagen, alt: tx(w.titulo) }));
      else principal.appendChild(el("span", { class: "tarjeta__vacio", texto: idioma === "es" ? "sin imagen" : "no image" }));
      medios.appendChild(cajaConVisor(principal, modeloDe(w), tx(w.titulo)));
    }

    /* Los avisos van DEBAJO del visor. La galería y el video ya
       no se pintan aparte: viven dentro del visor de medios. */
    if (w.es_render && w.imagen) {
      medios.appendChild(el("p", { class: "hueco-video", texto: t("aviso_render") }));
    }
    if (!w.video && lista.length < 2) {
      medios.appendChild(el("p", { class: "hueco-video", texto: t("video_pendiente") }));
    }

    /* --- datos --- */
    /* Tres botones en vez de uno (él, 14/08/2026): anterior, volver
       al catálogo, y siguiente. La idea es poder recorrer las
       piezas sin tener que subir a la cuadrícula cada vez.

       El orden es EL MISMO de la cuadrícula —sale de la misma
       función—, así que "siguiente" lleva a la que está al lado
       allá. Y da la vuelta al llegar al final: con seis piezas,
       un botón muerto en los extremos estorba más de lo que
       avisa. */
    /* 2026-08-17 · Los tres botones salen de .ficha__datos y pasan a
       ser hijos directos de .ficha. Motivo: en teléfono él los quiere
       ARRIBA DEL TODO, antes de la foto, y desde dentro de la columna
       de datos —que en teléfono va debajo de la foto— no hay forma de
       subirlos. Sueltos, el CSS los coloca con `order` en teléfono y
       con `grid-template-areas` en escritorio, donde siguen saliendo
       exactamente donde estaban: arriba de la columna derecha. */
    var navPiezas = navegarPiezas(w);

    var datos = el("div", { class: "ficha__datos" }, [
      el("h1", { texto: tx(w.titulo) })
    ]);

    if (tx(w.resumen)) datos.appendChild(el("p", { class: "bajada", texto: tx(w.resumen) }));

    var filas = [];
    if (w.anio)   filas.push([t("ficha_ano"), w.anio + (w.anio_estimado ? " (?)" : "")]);
    /* 2026-08-15 · Fuera la fila TIPO, en todas las piezas. Era el
       último sitio donde se veía la categoría —«exterior», «mesa»,
       «accesorio»—: de la cuadrícula la quitó él el 14/08 y de los
       filtros el 11/08. El campo `tipo` SIGUE en datos/trabajos.js
       a propósito: lo usan el buscador y el texto alternativo de
       las fotos, que no se ven pero sí se buscan. */
    if ((w.materiales || []).length) filas.push([t("ficha_material"), w.materiales.map(function (m) { return etiqueta("material", m); }).join(", ")]);
    if ((w.acabado || []).length)    filas.push([t("ficha_acabado"), w.acabado.map(function (a) { return etiqueta("acabado", a); }).join(" / ")]);
    if (w.medidas) filas.push([t("ficha_medidas"), tx(w.medidas)]);

    if (filas.length) {
      datos.appendChild(el("dl", { class: "especs" }, filas.map(function (f) {
        return el("div", {}, [el("dt", { texto: f[0] }), el("dd", { texto: f[1] })]);
      })));
    }

    var como = tx(w.como);
    if (como && como.length) {
      datos.appendChild(el("h2", { class: "rotulo", style: "margin-top:2.4rem", texto: t("ficha_como") }));
      /* 15/08/2026 · PÁRRAFOS, no viñetas (él). Lo que va aquí no
         es una lista de piezas sino un texto seguido, y la raya de
         la viñeta lo troceaba. Cada entrada del array es un
         párrafo. La lista con guiones se sigue usando en la ficha
         de Prototipos — ver `.lista-como` más abajo. */
      datos.appendChild(el("div", { class: "texto-como" }, como.map(function (c) {
        return el("p", { texto: c });
      })));
    }

    datos.appendChild(el("div", { style: "margin-top:2.6rem;border-top:1px solid var(--linea);padding-top:1.6rem" }, [
      el("h3", { texto: t("ficha_similar") }),
      el("p", { class: "bajada", style: "margin-bottom:1.2rem", texto: t("ficha_similar_t") }),
      el("a", { class: "boton", href: enlaceWhatsApp(tx(w.titulo)), target: "_blank", rel: "noopener", texto: t("ficha_escribir") })
    ]));

    host.appendChild(el("div", { class: "ficha" }, [navPiezas, medios, datos]));
    revelar(host, ".ficha__medios, .ficha__datos", 120);
  };

  paginas.piezas = function () {
    $("#titulo").textContent = t("piezas_titulo");
    $("#bajada").textContent = t("piezas_bajada");
    var host = $("#rejilla");
    host.innerHTML = "";
    host.appendChild(rejilla(tiendaVisible("pieza"), tarjetaProducto));
    revelar(host, ".tarjeta", 60);
  };

  paginas.herramientas = function () {
    $("#titulo").textContent = t("herr_titulo");
    $("#bajada").textContent = t("herr_bajada");

    var todos = tiendaVisible("herramienta");
    var host  = $("#rejilla");
    var sel   = $("#f-categoria");
    $("#l-categoria").textContent = idioma === "es" ? "Categoría" : "Category";

    var cats = [];
    todos.forEach(function (p) { if (p.categoria && cats.indexOf(p.categoria) === -1) cats.push(p.categoria); });

    sel.innerHTML = "";
    sel.appendChild(el("option", { value: "", texto: t("filtro_todos") }));
    cats.forEach(function (c) { sel.appendChild(el("option", { value: c, texto: etiqueta("categoria", c) })); });

    function aplicar() {
      var lista = sel.value ? todos.filter(function (p) { return p.categoria === sel.value; }) : todos;
      host.innerHTML = "";
      host.appendChild(rejilla(lista, tarjetaProducto));
      revelar(host, ".tarjeta", 45);
      $("#conteo").textContent = lista.length === 1 ? t("conteo_uno") : n("conteo", lista.length);
    }
    sel.onchange = aplicar;
    aplicar();
  };

  paginas.producto = function () {
    var p = window.TIENDA.filter(function (x) { return x.slug === parametro("id"); })[0];
    var host = $("#ficha");
    host.innerHTML = "";

    if (!p) {
      host.appendChild(el("p", { class: "vacio", texto: t("no_encontrado") }));
      return;
    }
    document.title = tx(p.nombre) + " · " + window.MARCA.nombre;

    /* --- medios --- */
    var medios = el("div", { class: "ficha__medios" });
    var principal = el("div", { class: "ficha__principal" });
    if (p.imagen) principal.appendChild(el("img", { id: "img-grande", src: p.imagen, alt: tx(p.nombre) }));
    else principal.appendChild(el("span", { class: "tarjeta__vacio", texto: idioma === "es" ? "falta la foto" : "photo pending" }));

    medios.appendChild(cajaConVisor(principal, modeloDe(p), tx(p.nombre)));
    if (p.es_render && p.imagen) medios.appendChild(el("p", { class: "hueco-video", texto: t("aviso_render") }));

    if ((p.galeria || []).length) {
      medios.appendChild(el("div", { class: "ficha__galeria" }, [p.imagen].concat(p.galeria).filter(Boolean).map(function (src) {
        var im = el("img", { src: src, alt: "", loading: "lazy" });
        im.addEventListener("click", function () { ponerFoto($("#img-grande"), src); });
        return im;
      })));
    }

    /* --- panel --- */
    var esPieza = p.familia === "pieza";
    var datos = el("div", { class: "ficha__datos" }, [
      el("a", { class: "volver", href: esPieza ? "piezas.html" : "herramientas.html",
                texto: "← " + t(esPieza ? "volver_piezas" : "volver_herr") }),
      el("h1", { texto: tx(p.nombre) })
    ]);
    if (tx(p.resumen)) datos.appendChild(el("p", { class: "bajada", texto: tx(p.resumen) }));

    var sinPrecio = (p.precio_usd == null);
    var precio = el("div", { class: "precio-vivo",
                             texto: sinPrecio ? t("consultar") : dinero(p.precio_usd) });
    datos.appendChild(precio);
    datos.appendChild(el("p", { class: "precio-nota",
                                texto: sinPrecio ? t("consultar_nota") : t("incluye_iva") }));

    /* disponibilidad */
    var punto = p.disponibilidad === "stock" ? "punto punto--si"
              : p.disponibilidad === "agotado" ? "punto punto--no" : "punto";
    var textoDisp = p.disponibilidad === "stock"
        ? t("disp_stock") + (p.stock ? " · " + p.stock : "")
        : p.disponibilidad === "agotado" ? t("disp_agotado") : t("disp_pedido");
    datos.appendChild(el("div", { class: "disponible" }, [
      el("span", { class: punto }), el("span", { texto: textoDisp })
    ]));

    /* opciones: mueven el precio en vivo */
    var elegido = {};
    (p.opciones || []).forEach(function (op) {
      elegido[op.id] = op.valores[0];
      var valores = el("div", { class: "opcion__valores" }, op.valores.map(function (v, i) {
        var input = el("input", { type: "radio", name: op.id, value: v.id });
        if (i === 0) input.checked = true;
        input.addEventListener("change", function () { elegido[op.id] = v; recalcular(); });
        var extra = v.delta ? el("small", { texto: (v.delta > 0 ? "+" : "−") + dinero(Math.abs(v.delta)) }) : null;
        return el("label", {}, [input, document.createTextNode(tx(v.etiqueta)), extra]);
      }));
      datos.appendChild(el("div", { class: "opcion" }, [
        el("span", { texto: tx(op.etiqueta) }), valores
      ]));
    });

    function total() {
      if (sinPrecio) return null;
      var s = p.precio_usd;
      for (var k in elegido) s += (elegido[k].delta || 0);
      return s;
    }
    function recalcular() {
      if (!sinPrecio) precio.textContent = dinero(total());
      boton.href = enlaceWhatsApp(descripcionPedido());
    }
    function descripcionPedido() {
      var partes = [tx(p.nombre)];
      (p.opciones || []).forEach(function (op) {
        partes.push(tx(op.etiqueta) + ": " + tx(elegido[op.id].etiqueta));
      });
      if (!sinPrecio) partes.push(dinero(total()));
      return partes.join(" · ");
    }

    var boton = el("a", {
      class: "boton boton--ancho", target: "_blank", rel: "noopener",
      href: enlaceWhatsApp(descripcionPedido()),
      texto: t(esPieza ? "pedir" : "pedir_herr")
    });
    datos.appendChild(el("div", { style: "margin:1.8rem 0 1rem" }, [boton]));

    /* plazo y pago */
    var filas = [];
    if (p.disponibilidad === "pedido") {
      filas.push([t("plazo"), n("plazo_semanas", p.plazo_semanas || 3)]);
      filas.push([idioma === "es" ? "Pago" : "Payment", t("pago_texto")]);
    } else if (p.disponibilidad === "stock") {
      filas.push([t("plazo"), t("plazo_inmediato")]);
    }
    if (p.medidas) filas.push([t("ficha_medidas"), tx(p.medidas)]);

    /* Lo que la gente busca antes de escribir. Se saca de
       datos/marca.js, así que es igual en todas las fichas. */
    var pol = (window.MARCA && window.MARCA.politicas) || {};
    if (pol.entrega)   filas.push([t("envio"),        tx(pol.entrega)]);
    if (pol.garantia)  filas.push([t("garantia"),     tx(pol.garantia)]);
    if (pol.bolivares) filas.push([t("en_bolivares"), tx(pol.bolivares)]);

    if (filas.length) {
      datos.appendChild(el("dl", { class: "especs" }, filas.map(function (f) {
        return el("div", {}, [el("dt", { texto: f[0] }), el("dd", { texto: f[1] })]);
      })));
    }

    var det = tx(p.detalles);
    if (det && det.length) {
      datos.appendChild(el("h2", { class: "rotulo", style: "margin-top:2.4rem", texto: t("detalles") }));
      datos.appendChild(el("ul", { class: "lista-como" }, det.map(function (d) { return el("li", { texto: d }); })));
    }

    host.appendChild(el("div", { class: "ficha" }, [navPiezas, medios, datos]));
    revelar(host, ".ficha__medios, .ficha__datos", 120);
  };

  paginas.taller = function () {
    $("#titulo").textContent = t("sobre_titulo");
    $$("[data-es]").forEach(function (e) {
      e.innerHTML = idioma === "es" ? e.getAttribute("data-es") : e.getAttribute("data-en");
    });
    revelar(document, ".intro-taller > *", 130);
    $$(".seccion").forEach(function (s) {
      revelar(s, "h2, .pasos li, .dos-columnas > div, .lista-marcas li, .prosa, .tramo__texto", 70);
    });
  };

  paginas.contacto = function () {
    $("#titulo").textContent = t("contacto_titulo");
    $("#bajada").textContent = t("contacto_bajada");
    $$("[data-es]").forEach(function (e) {
      e.innerHTML = idioma === "es" ? e.getAttribute("data-es") : e.getAttribute("data-en");
    });

    var M = window.MARCA;
    var host = $("#contactos");
    var es = idioma === "es";

    /* [icono, título, dato, enlace, qué pasa al hacer clic]
       Solo se pintan las vías que estén configuradas. */
    var tarjetas = [];
    if (M.whatsapp) {
      tarjetas.push(["whatsapp", "WhatsApp", M.whatsapp_visible, enlaceWhatsApp(null),
        es ? "Abre WhatsApp con el chat listo" : "Opens WhatsApp with the chat ready"]);
    }
    if (M.correo) {
      tarjetas.push(["correo", es ? "Correo" : "Email", M.correo, "mailto:" + M.correo,
        es ? "Abre tu gestor de correo" : "Opens your mail app"]);
    }
    if (M.instagram) {
      tarjetas.push(["instagram", "Instagram", "@" + M.instagram,
        "https://instagram.com/" + M.instagram,
        es ? "Abre el perfil en Instagram" : "Opens the profile on Instagram"]);
    }

    host.innerHTML = "";
    tarjetas.forEach(function (c) {
      host.appendChild(el("a", { href: c[3], target: "_blank", rel: "noopener" }, [
        el("span", { class: "contactos__icono", html: ICONOS[c[0]] }),
        el("span", { class: "contactos__texto" }, [
          el("span", { class: "rotulo", texto: c[1] }),
          el("strong", { texto: c[2] }),
          el("span", { class: "contactos__accion", texto: c[4] })
        ]),
        el("span", { class: "contactos__flecha", html: "&#8599;" })
      ]));
    });

    revelar(host, "a", 80);
  };

  /* ---------- arranque ------------------------------------ */

  function pintar() {
    document.documentElement.lang = idioma;
    iniciarObservador();
    pintarCabecera();
    vigilarCabecera();
    pintarPie();
    var cual = document.body.getAttribute("data-pagina");
    if (paginas[cual]) paginas[cual]();
    if (verBorradores) document.body.classList.add("con-borradores");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", pintar);
  } else {
    pintar();
  }
})();
