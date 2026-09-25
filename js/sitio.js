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
  /* Oscuro por defecto; una elección manual se conserva durante siete días. */
  var TEMAS = ["oscuro", "claro"];
  var TEMA_VIDA = 7 * 24 * 60 * 60 * 1000;
  var tema = "oscuro";
  try {
    var guardadoTema = JSON.parse(localStorage.getItem("tema") || "null");
    if (guardadoTema && TEMAS.indexOf(guardadoTema.tema) > -1 && guardadoTema.hasta > Date.now()) {
      tema = guardadoTema.tema;
    } else {
      localStorage.removeItem("tema");
    }
  } catch (e) {
    try { localStorage.removeItem("tema"); } catch (e2) {}
  }

  aplicarTema();

  function aplicarTema() {
    var claro = tema === "claro";
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

  function temaVisible() { return tema; }
  function marcarTema() {
    var bs = document.querySelectorAll(".tema button");
    for (var i = 0; i < bs.length; i++) {
      if (bs[i].classList.contains("tema__riel")) {
        bs[i].setAttribute("aria-checked", temaVisible() === TEMAS[1] ? "true" : "false");
        continue;
      }
      bs[i].setAttribute("aria-pressed", bs[i].dataset.tema === temaVisible());
    }
  }

  function ponerTema(nuevo) {
    tema = nuevo;
    try {
      localStorage.setItem("tema", JSON.stringify({ tema: nuevo, hasta: Date.now() + TEMA_VIDA }));
    } catch (e) {}
    aplicarTema();
    /* No hace falta repintar: el tema entero vive en los tokens
       CSS. Solo se refresca que boton se ve pulsado. */
    marcarTema();
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
                               type: "button", "aria-label": "Anterior", html: flechaHTML("izq") });
      var der = el("button", { class: "visor-medios__flecha visor-medios__flecha--der",
                               type: "button", "aria-label": "Siguiente", html: flechaHTML("der") });
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
    /* Sobre de LÍNEAS (él, 17/09/2026): como WhatsApp e Instagram, el
       color va solo en el contorno. Se dibuja con trazo y sin relleno. */
    correo:   '<svg viewBox="0 0 24 24" aria-hidden="true" class="icono-linea"><rect x="2.8" y="5" width="18.4" height="14" rx="2"/><path d="M3.6 6.4 12 12.6l8.4-6.2"/></svg>',
    /* Globo de conversación (él, 18/09/2026): el botón del encabezado
       del teléfono que lleva a Contacto, en el sitio del de WhatsApp. */
    globo:    '<svg viewBox="0 0 24 24" aria-hidden="true" class="icono-linea"><path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-8l-4.5 3.5V17H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>',
    /* El globo de «Contacto» (18/09/2026): cuadrado de esquinas vivas (él,
       2.ª vuelta, antes era redondo), con el mismo pico abajo a la izquierda. */
    globoRedondo: '<svg viewBox="0 0 24 24" aria-hidden="true" class="icono-linea"><path d="M6.5 3.5H19.5A1.5 1.5 0 0 1 21 5V17.3A1.5 1.5 0 0 1 19.5 18.8H9.7L2.5 21.5L5 15.5V5A1.5 1.5 0 0 1 6.5 3.5Z"/><circle class="globo__punto" cx="21" cy="3.5" r="4.6"/></svg>',
    /* Flecha curva hacia atrás: cierra la foto a pantalla completa. */
    volver:   '<svg viewBox="0 0 24 24" aria-hidden="true" class="icono-linea"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
    instagram:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.02 4.85.07 3.25.15 4.77 1.7 4.92 4.92.05 1.27.07 1.65.07 4.85s-.02 3.58-.07 4.85c-.15 3.23-1.67 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.18 15.58 2.16 15.2 2.16 12s.02-3.58.07-4.85c.15-3.23 1.67-4.77 4.92-4.92C8.42 2.18 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 2.7.27.28 2.69.08 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.7 21.31.28 16.95.08 15.67.01 15.26 0 12 0m0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32M12 16a4 4 0 110-8 4 4 0 010 8m6.41-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88"/></svg>',
    lupa:     '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.4 15.4 21 21" stroke-linecap="round"/></svg>',
    /* La bolsa del pedido (él, 16/09/2026): va en la cabecera, a la
       izquierda de la lupa, y junto a «Tu pedido» en Prototipos. */
    /* Easter egg (él, 16/09/2026): con 3 piezas o más la bolsa pasa a
       ser un CARRITO, y vuelve a bolsa al bajar a 2. Ver `iconoPedido`. */
    carrito:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.4 4.2h2.7l2.4 10.9h10.6l2.3-7.9H6.1" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9.3" cy="19.1" r="1.55"/><circle cx="16.8" cy="19.1" r="1.55"/></svg>',
    /* Y sigue (él, 16/09/2026): 5+ minivan de encomiendas, 7+ camión
       de fletes con cajón grande, 9+ buque carguero. */
    minivan:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 17.2V8.6a2 2 0 012-2h9.3l3.6 4 3.2 1.1a1.6 1.6 0 011.1 1.5v4" stroke-linejoin="round"/><path d="M13.8 6.6v4h3.6M2.5 11.2h8.6M2.5 17.2h3.1M10.6 17.2h3.8M19.4 17.2h2.1" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8.1" cy="17.4" r="1.9"/><circle cx="16.9" cy="17.4" r="1.9"/></svg>',
    camion:   '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1.5 4.8h13.2v12H1.5z" stroke-linejoin="round"/><path d="M14.7 9h4.1l3.2 3.9v3.9h-1.9M14.7 16.8h2.2M1.5 16.8h1.6M8.2 16.8h1.9" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5.6" cy="17.6" r="1.9"/><circle cx="18.6" cy="17.6" r="1.9"/></svg>',
    buque:    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1.8 13.4h20.4l-2.6 5H4.6z" stroke-linejoin="round"/><path d="M4.2 13.4v-3h4.4v3M8.6 13.4V8.2h4.4v5.2M13 13.4v-3h4v3M18.6 13.4V6.3h2.2v7.1M1.5 21.2c1.5 0 1.5-.9 3-.9s1.5.9 3 .9 1.5-.9 3-.9 1.5.9 3 .9 1.5-.9 3-.9 1.5.9 3 .9 1.5-.9 3-.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    /* 18/09/2026 (él) · Bolsa CUADRADA: cuerpo de lados rectos y asa en
       «U» de esquinas vivas, como el resto del diseño. */
    bolsa:    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.6 8h14.8l-1.2 13H5.8z" stroke-linejoin="miter"/><path d="M8.6 10.5V6.2L10.4 4h3.2l1.8 2.2v4.3" stroke-linejoin="miter" stroke-linecap="butt"/></svg>',

    /* 2026-08-17 · Los tres del tema. Antes eran los caracteres
       ◑ ○ y la palabra "auto", y nadie adivinaba cuál era cuál.
       Van en SVG y no en emoji (☀ ☾) a propósito: un emoji lo
       dibuja cada sistema a su manera —en Windows sale de color y
       más grande que la línea— mientras que un trazo heredado con
       currentColor se ve igual en todas partes y sigue al tema. */
    sol:  '<svg class="tema__astro tema__sol" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5.5"/>' +
          '<path d="M11.3 1.8h1.4v3.8h-1.4zM11.3 18.4h1.4v3.8h-1.4zM1.8 11.3h3.8v1.4H1.8zM18.4 11.3h3.8v1.4h-3.8z"/>' +
          '<path transform="rotate(45 12 12)" d="M11.3 1.8h1.4v3.8h-1.4zM11.3 18.4h1.4v3.8h-1.4zM1.8 11.3h3.8v1.4H1.8zM18.4 11.3h3.8v1.4h-3.8z"/></svg>',
    luna: '<svg class="tema__astro tema__luna" viewBox="0 0 24 24" aria-hidden="true"><path transform="translate(1.2 1.2) scale(.9)" d="M15.7 2.7A10 10 0 1 1 2.7 15.7A9.5 9.5 0 0 0 15.7 2.7Z"/></svg>',
    /* 2026-09-16 · El sol y la luna del conmutador pasaron a ser dos
       animales (él): un LOBO aullando para el oscuro y la cabeza de un
       GALLO para el claro. Son siluetas rellenas, del cuello hacia
       arriba, y el cuello sale del borde de abajo del botón: el SVG se
       ancla abajo (xMidYMax) y ocupa todo el alto, así que no queda
       aire entre el animal y el marco. El ojo es un hueco (evenodd). */
    /* Lobo, 6ª versión, empezada de cero (él, 16/09/2026). Silueta
       limpia de lobo aullando: hocico hacia arriba (30° de la vertical), oreja echada
       atrás, nuca en una sola línea del cuello a la oreja, y mechones en
       el cachete y la garganta. Huecos: ojo cerrado y el borde interior
       de la oreja. Se genera con un script (notas/lobo-icono.py con ángulo 30 (probó 20 y 35; se quedó con 30)) que
       coloca cada punto sobre el eje inclinado de la cabeza; el <g> la
       agranda para que llene el botón y el cuello sale por abajo. */
    lobo: '<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMax meet" aria-hidden="true">' +
          '<g transform="translate(-1.1 -2.9) scale(1.4)"><path fill-rule="evenodd" d="' +
          'M-5.07 30.00 C-1.37 25.00 3.83 17.20 7.03 12.75 L3.26 12.07 L6.43 9.98 Q6.44 9.17 7.10 8.6' +
          '3 Q8.23 7.67 9.59 7.30 Q10.33 7.03 10.81 6.39 L13.33 3.23 Q13.96 2.55 14.72 3.22 L14.97 3.' +
          '59 L14.57 4.98 L15.46 4.34 Q15.43 5.59 14.51 7.60 Q13.78 9.26 14.04 10.79 L14.93 11.65 L13' +
          '.93 12.00 L14.89 13.13 L13.71 13.37 L14.57 14.68 C14.37 17.38 13.27 22.00 10.97 30.00 Z M1' +
          '0.59 7.88 L11.50 6.90 L11.74 7.09 L10.83 8.07Z M6.55 10.97 L4.25 11.95 L4.70 11.98 L6.89 1' +
          '1.28Z' +
          '"/></g></svg>',
    /* La espalda del gallo (él, 16/09/2026) ya no baja recta: se curva
       hacia la izquierda y sigue en horizontal hasta salir por el borde,
       para que se lea que detrás hay un cuerpo. */
    /* 16/09/2026 · La espalda sigue en horizontal hasta x = -12 y el
       SVG deja ver lo que sale de su lienzo: así llega hasta el borde
       izquierdo del botón, que es quien la recorta. */
    /* 18/09/2026 (él) · La espalda ya NO sigue hasta el borde: el cuerpo
       termina antes, en una curva hacia abajo que hace de cola. */
    gallo: '<svg class="gallo" viewBox="0 0 24 24" preserveAspectRatio="xMidYMax meet" aria-hidden="true">' +
          '<path fill-rule="evenodd" d="M0 24C0.5 21.8 1.1 19.8 1.9 18.3C2.2 17.7 2.5 17.3 2.9 17.1' +
          'C4.4 16.9 5.7 16.2 6.4 14.8' +
          'C7 13.9 7.3 13 7.3 12.2C6.9 10.6 7.3 9 8.3 8.1' +
          'C7.7 6.4 8.6 5 10 5.3C10 3.1 12.1 2.5 13 4.1C13.9 2.3 16.1 2.8 15.9 4.8' +
          'C17.5 4.9 17.8 6.7 16.6 7.5L17.3 8.2 21 9.7 17.2 10.7' +
          'C17.9 12 17.8 14.1 16.4 14.3C15.2 14.5 14.8 13.1 15 12.1' +
          'C14.6 14 15.1 16 16.4 18C17.6 19.8 18.4 21.9 18.7 24Z' +
          'M12.3 8.9a.95.95 0 101.9 0 .95.95 0 10-1.9 0z"/></svg>',
    /* Medio sol y media luna: la mitad de cada uno, que es
       literalmente lo que hace el modo automático. */
    auto: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.4"/>' +
          '<path d="M12 3.6a8.4 8.4 0 000 16.8z" fill="currentColor" stroke="none"/></svg>'
  };

  /* ---------- el pedido guardado --------------------------
     2026-09-16 · El pedido ya no se pierde al cambiar de página:
     se guarda en ESTE navegador durante una semana (decisión suya,
     sin cuentas de usuario). Vive en localStorage bajo `pa-pedido`
     como {guardado: fecha en ms, lineas: [...]}. Pasada la semana
     desde el último cambio, se tira.

     js/prototipos.js lee y escribe por `window.PA_PEDIDO`; la bolsa
     de la cabecera solo lee. Cada escritura lanza el evento
     `pa:pedido` para que la bolsa se entere en la misma página, y
     el `storage` del navegador avisa a las otras pestañas. */
  var PEDIDO_CLAVE = "pa-pedido";
  var PEDIDO_VIDA = 7 * 24 * 60 * 60 * 1000;

  function leerPedido() {
    var dato = null;
    try { dato = JSON.parse(localStorage.getItem(PEDIDO_CLAVE) || "null"); } catch (e) { dato = null; }
    if (!dato || !Array.isArray(dato.lineas)) return [];
    if (!(Date.now() - dato.guardado < PEDIDO_VIDA)) {
      try { localStorage.removeItem(PEDIDO_CLAVE); } catch (e) {}
      return [];
    }
    /* Una pieza que se despublicó en esta semana no vuelve a aparecer. */
    var cat = window.PROTOTIPOS;
    return dato.lineas.filter(function (l) {
      if (!l || !l.slug || !(l.cant > 0)) return false;
      if (!cat) return true;
      return cat.some(function (p) { return p.slug === l.slug && (p.publicado || verBorradores); });
    });
  }

  function guardarPedido(lineas, origen) {
    try {
      if (lineas && lineas.length) {
        localStorage.setItem(PEDIDO_CLAVE, JSON.stringify({ guardado: Date.now(), lineas: lineas }));
      } else {
        localStorage.removeItem(PEDIDO_CLAVE);
      }
    } catch (e) { /* ventana privada o almacenamiento bloqueado: el pedido vive solo en la página */ }
    /* `origen` = "panel" cuando lo cambia el panel de la bolsa: así
       js/prototipos.js sabe que tiene que recargar su copia. */
    document.dispatchEvent(new CustomEvent("pa:pedido", { detail: { origen: origen || "" } }));
  }

  /* LA BOLSA SE CARGA (él, 16/09/2026). Al agregar algo al pedido, un
     circulito del color de acento —el mismo del triángulo de la vista—
     baja y entra en la bolsa de la cabecera; al entrar, la bolsa se
     infla un instante y vuelve a su tamaño. Si la bolsa no se ve (en
     teléfono vive dentro del menú plegado), el circulito entra en el
     botón del menú. Sin animación si el sistema pide menos movimiento. */
  /* Mientras la bolita cae, la bolsa NO cambia a carrito (ni vuelve):
     el cambio se ve justo cuando la bolita entra (él, 16/09/2026). Por
     eso prototipos.js llama a esto ANTES de guardar el pedido. */
  var bolaEnCamino = false;

  /* PRUEBA (él, 18/09/2026): un muñequito de palitos aparece junto a
     la bolsa y LANZA la bolita. Lo demás igual: al entrar cambia el
     número y la bolsa se infla; luego el muñequito desaparece.
     La animación de antes (la bolita que cae) sigue aquí intacta:
     BOLSA_ANIMACION = "cae" la devuelve, y ?bolsa=cae en la dirección
     la muestra sin tocar el código, para compararlas. */
  var BOLSA_ANIMACION = "muneco";

  function animarBolsa() {
    var pide = /[?&]bolsa=(cae|muneco)/.exec(location.search);
    if ((pide ? pide[1] : BOLSA_ANIMACION) === "muneco") animarBolsaMuneco();
    else animarBolsaCae();
  }

  function animarBolsaMuneco() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var destino = $$(".bolsa .lupa__icono").filter(function (x) {
      return x.getBoundingClientRect().width > 0;
    })[0];
    if (!destino) destino = $(".hamburguesa");
    if (!destino || !destino.animate) return;
    bolaEnCamino = true;
    var soltar = setTimeout(function () { bolaEnCamino = false; pintarBolsa(); }, 3200);
    var r = destino.getBoundingClientRect();
    var bx = r.left + r.width / 2, by = r.top + r.height / 2;

    /* Dónde se para: sobre el borde de abajo del encabezado, a la
       izquierda de la bolsa, mirando hacia ella. */
    var cab = document.getElementById("cabecera") || document.querySelector("header");
    var suelo = cab ? cab.getBoundingClientRect().bottom : by + 60;
    if (suelo < by + 30) suelo = by + 30;
    /* el dibujo: 60 × 72 px, los pies en (22, 68) */
    var AN = 60, AL = 72, PX = 22, PY = 68;
    var x0 = bx - 50 - PX, y0 = suelo - PY;

    var NS = "http://www.w3.org/2000/svg";
    function svgEl(tipo, at, padre) {
      var e = document.createElementNS(NS, tipo);
      for (var k in at) e.setAttribute(k, at[k]);
      if (padre) padre.appendChild(e);
      return e;
    }
    var fig = svgEl("svg", { width: AN, height: AL, viewBox: "0 0 " + AN + " " + AL, "aria-hidden": "true" });
    /* estilo aquí mismo: estilo.css lo edita a la vez otra sesión */
    fig.style.cssText = "position:fixed;z-index:299;pointer-events:none;opacity:0;overflow:visible;" +
      "color:var(--tinta,#fff);left:" + x0 + "px;top:" + y0 + "px";
    var trazo = { stroke: "currentColor", "stroke-width": 3, "stroke-linecap": "round",
                  "stroke-linejoin": "round", fill: "none" };
    function poli(padre) { return svgEl("polyline", trazo, padre || fig); }
    var piernaB = poli(), brazoB = poli(), torso = poli(), piernaA = poli();
    var cabeza = svgEl("circle", { r: 4.3, fill: "currentColor" }, fig);
    var brazoA = poli();
    /* el balón en la mano (el mismo naranja de la bolita) */
    var balon = svgEl("circle", { r: 4.3, fill: "var(--acento-texto, #E07A3F)" }, fig);
    document.body.appendChild(fig);

    /* ---- el esqueleto: ángulos desde ABAJO (0 abajo, 90 al frente,
       180 arriba), como el muñeco de Contacto ---- */
    var MUSLO = 7.5, PIERNA = 7.5, TRONCO = 12, CUELLO = 4.6, BRAZO = 6.2, ANTEB = 6, MANO = 2.4;
    function dir(a, l) { var r = a * Math.PI / 180; return [Math.sin(r) * l, Math.cos(r) * l]; }
    function mas(p, v) { return [p[0] + v[0], p[1] + v[1]]; }
    /* POSES del tiro: t (ms desde que aparece) y los ángulos.
       cad/rod: muslo y pierna (A la de delante); tr: inclinación del
       tronco (+ hacia delante); hom/cod/mun: brazo, antebrazo, muñeca;
       sal: altura del salto, en px */
    var POSES = [
      { t: 0,    cadA: 6,  rodA: 0,   cadB: -6, rodB: -4,  tr: 4,  cab: 0,
                 homA: 25, codA: 95,  munA: 110, homB: 20, codB: 88, sal: 0 },
      /* flexiona rodillas y recoge el balón al pecho */
      { t: 380,  cadA: 52, rodA: -22, cadB: 40, rodB: -34, tr: 20, cab: -8,
                 homA: 28, codA: 128, munA: 150, homB: 22, codB: 118, sal: 0 },
      /* sube el balón sobre la frente, muñeca atrás, aún flexionado */
      { t: 640,  cadA: 40, rodA: -18, cadB: 30, rodB: -26, tr: 10, cab: -14,
                 homA: 120, codA: 186, munA: 230, homB: 105, codB: 170, sal: 0 },
      /* salta y empuja SIN frenar (e: "in", acelera hasta soltar); la
         muñeca no se dobla hasta que el balón ya salió (él, 18/09) */
      { t: 830,  cadA: 4,  rodA: -6,  cadB: -4, rodB: -14, tr: 2,  cab: -18,
                 homA: 158, codA: 160, munA: 230, homB: 140, codB: 150, sal: 7, e: "in" },
      /* el golpe de muñeca, ya sin balón */
      { t: 960,  cadA: 2,  rodA: -8,  cadB: -6, rodB: -18, tr: 0,  cab: -16,
                 homA: 160, codA: 158, munA: 95,  homB: 138, codB: 146, sal: 8, e: "out" },
      /* cae flexionando las rodillas; el brazo SIGUE arriba, la mano
         doblada, hasta que desaparece (él, 18/09) */
      { t: 1180, cadA: 30, rodA: -14, cadB: 22, rodB: -24, tr: 8,  cab: -14,
                 homA: 158, codA: 156, munA: 92,  homB: 132, codB: 140, sal: 0 },
      { t: 1500, cadA: 8,  rodA: -2,  cadB: -4, rodB: -8,  tr: 3,  cab: -14,
                 homA: 158, codA: 156, munA: 92,  homB: 128, codB: 136, sal: 0 },
      { t: 2200, cadA: 8,  rodA: -2,  cadB: -4, rodB: -8,  tr: 3,  cab: -12,
                 homA: 158, codA: 156, munA: 92,  homB: 128, codB: 136, sal: 0 }
    ];
    var SUELTA = 830;                         /* ms: el balón sale de la mano */
    function suave(u) { return u * u * (3 - 2 * u); }
    var CURVA = { "in": function (u) { return u * u; },
                  out: function (u) { return 1 - (1 - u) * (1 - u); } };
    function poseEn(t) {
      var i = 0;
      while (i < POSES.length - 2 && t > POSES[i + 1].t) i++;
      var a = POSES[i], b = POSES[i + 1];
      var u = Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t)));
      u = (CURVA[b.e] || suave)(u);
      var p = {};
      for (var k in a) if (typeof a[k] === "number") p[k] = a[k] + (b[k] - a[k]) * u;
      return p;
    }
    function pts(lista) {
      return lista.map(function (q) { return q[0].toFixed(2) + "," + q[1].toFixed(2); }).join(" ");
    }
    var conBalon = true, manoA = [0, 0];
    function dibujar(t) {
      var p = poseEn(t);
      /* la cadera a la altura justa para que el pie más bajo pise */
      var caeA = dir(p.cadA, MUSLO)[1] + dir(p.rodA, PIERNA)[1];
      var caeB = dir(p.cadB, MUSLO)[1] + dir(p.rodB, PIERNA)[1];
      var cad = [PX, PY - Math.max(caeA, caeB) - p.sal];
      var rodA = mas(cad, dir(p.cadA, MUSLO)), pieA = mas(rodA, dir(p.rodA, PIERNA));
      var rodB = mas(cad, dir(p.cadB, MUSLO)), pieB = mas(rodB, dir(p.rodB, PIERNA));
      var cuello = mas(cad, dir(180 - p.tr, TRONCO));
      var cab = mas(cuello, dir(180 - p.tr - p.cab, CUELLO + 1));
      var hom = mas(cuello, [0, 1.2]);
      var codA = mas(hom, dir(p.homA, BRAZO)), munA = mas(codA, dir(p.codA, ANTEB)), dedA = mas(munA, dir(p.munA, MANO));
      var codB = mas(hom, dir(p.homB, BRAZO)), munB = mas(codB, dir(p.codB, ANTEB)), dedB = mas(munB, dir(p.codB + 10, MANO));
      piernaA.setAttribute("points", pts([cad, rodA, pieA]));
      piernaB.setAttribute("points", pts([cad, rodB, pieB]));
      torso.setAttribute("points", pts([cad, cuello]));
      brazoA.setAttribute("points", pts([hom, codA, munA, dedA]));
      brazoB.setAttribute("points", pts([hom, codB, munB, dedB]));
      cabeza.setAttribute("cx", cab[0].toFixed(2)); cabeza.setAttribute("cy", cab[1].toFixed(2));
      /* el balón va ENCIMA de las manos: siguiendo el antebrazo y un
         poco hacia arriba. Antes giraba alrededor de la muñeca y daba
         saltitos (él, 18/09) */
      var bal = mas(mas(munA, dir(p.codA, 2.2)), [0, -3.6]);
      manoA = bal;
      balon.style.display = conBalon ? "" : "none";
      balon.setAttribute("cx", bal[0].toFixed(2)); balon.setAttribute("cy", bal[1].toFixed(2));
    }

    var t0 = null, lanzado = false, fin = POSES[POSES.length - 1].t;
    fig.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: "forwards" });
    function paso(ahora) {
      if (t0 === null) t0 = ahora;
      var t = ahora - t0;
      dibujar(Math.min(t, fin));
      if (!lanzado && t >= SUELTA) { lanzado = true; lanzar(); }
      if (t < fin) requestAnimationFrame(paso);
    }
    dibujar(0);
    requestAnimationFrame(paso);
    /* red: con la pestaña en segundo plano rAF se para; que no quede
       un muñequito congelado en el encabezado */
    setTimeout(function () { if (fig.parentNode) fig.remove(); }, fin + 1500);

    function lanzar() {
      conBalon = false;
      var hx = x0 + manoA[0], hy = y0 + manoA[1];
      var bola = el("span", { class: "bolsa-bola", "aria-hidden": "true" });
      bola.style.left = hx + "px";
      bola.style.top = hy + "px";
      document.body.appendChild(bola);
      /* arco alto, como un tiro de tres */
      var dx = bx - hx, dy = by - hy, alto = Math.max(34, -dy + 30), marcos = [];
      for (var i = 0; i <= 16; i++) {
        var u = i / 16;
        var x = dx * u, y = dy * u - alto * 4 * u * (1 - u);
        var esc = u < 0.85 ? 1 : 1 - (u - 0.85) / 0.15 * 0.6;
        marcos.push({ transform: "translate(-50%, -50%) translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) scale(" + esc.toFixed(2) + ")",
                      opacity: u < 0.95 ? 1 : 0, offset: u });
      }
      var vuelo = bola.animate(marcos, { duration: 560, easing: "linear" });
      vuelo.onfinish = function () {
        bola.remove();
        clearTimeout(soltar);
        bolaEnCamino = false;
        pintarBolsa();
        destino.animate([
          { transform: "scale(1)" },
          { transform: "scale(1.32)", offset: .4 },
          { transform: "scale(.94)", offset: .75 },
          { transform: "scale(1)" }
        ], { duration: 420, easing: "ease-out" });
      };
      /* se desvanece cuando ya se ha enderezado */
      var fuera = fig.animate([{ opacity: 1 }, { opacity: 0 }],
                              { duration: 350, delay: fin - SUELTA - 200, easing: "ease-in", fill: "forwards" });
      fuera.onfinish = function () { fig.remove(); };
    }
  }

  function animarBolsaCae() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var destino = $$(".bolsa .lupa__icono").filter(function (x) {
      return x.getBoundingClientRect().width > 0;
    })[0];
    if (!destino) destino = $(".hamburguesa");
    if (!destino || !destino.animate) return;
    bolaEnCamino = true;
    /* Red por si la animación nunca termina (pestaña en segundo
       plano): el icono no se puede quedar congelado. */
    var soltar = setTimeout(function () { bolaEnCamino = false; pintarBolsa(); }, 1500);
    var r = destino.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var bola = el("span", { class: "bolsa-bola", "aria-hidden": "true" });
    bola.style.left = cx + "px";
    bola.style.top = cy + "px";
    document.body.appendChild(bola);
    var caida = bola.animate([
      { transform: "translate(-50%, -50%) translateY(-46px) scale(1)", opacity: 0 },
      { transform: "translate(-50%, -50%) translateY(-30px) scale(1)", opacity: 1, offset: .25 },
      { transform: "translate(-50%, -50%) translateY(0) scale(.45)", opacity: 1, offset: .9 },
      { transform: "translate(-50%, -50%) translateY(2px) scale(.3)", opacity: 0 }
    ], { duration: 520, easing: "cubic-bezier(.5, 0, .75, 0)" });
    caida.onfinish = function () {
      bola.remove();
      clearTimeout(soltar);
      bolaEnCamino = false;
      /* Ahora sí: si tocaba, la bolsa pasa a carrito (o al revés) en
         el mismo instante en que se infla. */
      pintarBolsa();
      destino.animate([
        { transform: "scale(1)" },
        { transform: "scale(1.32)", offset: .4 },
        { transform: "scale(.94)", offset: .75 },
        { transform: "scale(1)" }
      ], { duration: 420, easing: "ease-out" });
    };
  }

  window.PA_PEDIDO = {
    animar: animarBolsa,
    leer: leerPedido,
    guardar: guardarPedido,
    icono: iconoPedido
  };

  /* ---------- la bolsa y su panel lateral ------------------ */

  var cajaPedido = null;
  var focoAntesDelPedido = null;

  function piezasEnPedido() {
    return leerPedido().reduce(function (a, l) { return a + l.cant; }, 0);
  }
  function iconoPedido() {
    return ICONOS[vehiculoPedido(piezasEnPedido())];
  }
  function vehiculoPedido(n) {
    return n >= 9 ? "buque" : n >= 7 ? "camion" : n >= 5 ? "minivan" : n >= 3 ? "carrito" : "bolsa";
  }

  /* Solo el número y la etiqueta, sin tocar el dibujo. */
  function pintarNumeroBolsa(n) {
    $$(".bolsa__n").forEach(function (b) {
      b.textContent = n > 99 ? "99+" : String(n);
      b.hidden = n === 0;
    });
    $$(".bolsa").forEach(function (b) {
      b.setAttribute("aria-label", t("pedido_abrir") + (n ? " (" + n + ")" : ""));
    });
  }

  function pintarBolsa() {
    var n = piezasEnPedido();
    /* Bolsa o carrito, en los tres sitios donde sale. Solo se toca si
       cambia, para no cortar la animación de «bolsa cargada». */
    var cual = vehiculoPedido(n);
    /* Mientras la bolita cae no cambia NADA, tampoco el número: todo
       cambia a la vez cuando entra (él, 16/09/2026). */
    if (bolaEnCamino) return;
    $$(".bolsa .lupa__icono, #pt-bolsa-pedido, .pedido-lateral__icono").forEach(function (h) {
      if (h.getAttribute("data-icono") !== cual) {
        h.innerHTML = ICONOS[cual];
        h.setAttribute("data-icono", cual);
      }
    });
    pintarNumeroBolsa(n);
    if (cajaPedido && cajaPedido.classList.contains("abierto")) pintarPanelPedido();
  }

  function pintarPanelPedido() {
    var lineas = leerPedido();
    var lista = $(".pedido-lateral__lista", cajaPedido);
    var pie = $(".pedido-lateral__pie", cajaPedido);
    $(".pedido-lateral__titulo", cajaPedido).textContent = t("pt_tu_pedido");
    $(".pedido-lateral__cerrar", cajaPedido).setAttribute("aria-label", t("pedido_cerrar"));
    lista.innerHTML = "";
    pie.innerHTML = "";
    if (!lineas.length) {
      /* «Todavía no has agregado nada. Ir a prototipos», con el enlace
         subrayado (él, 16/09/2026). En Prototipos cierra el panel y
         sube al catálogo sin recargar. */
      var irPt = el("a", { href: "index.html", texto: t("pedido_ir_prototipos") });
      irPt.addEventListener("click", function (e) {
        var destino = document.getElementById("pt-stock");
        if (!destino) return;
        e.preventDefault();
        cerrarPedido(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      lista.appendChild(el("p", { class: "pedido-lateral__vacio" }, [
        document.createTextNode(t("pedido_vacio") + " "), irPt
      ]));
      return;
    }
    lineas.forEach(function (l, i) {
      /* El «−» del panel (él, 16/09/2026): a la IZQUIERDA, cuadrito
         GRIS (no rojo: no borra la fila de golpe) y resta UNA pieza; la
         fila solo se va cuando le queda una. */
      var quitar = el("button", { class: "pedido-lateral__quitar", type: "button",
        title: t("pedido_restar"), "aria-label": t("pedido_restar") + ": " + tx(l.nombre) },
        [el("span", { "aria-hidden": "true", texto: "−" })]);
      quitar.addEventListener("click", function () {
        var resto = leerPedido();
        if (resto[i] && resto[i].cant > 1) resto[i].cant--;
        else resto.splice(i, 1);
        guardarPedido(resto, "panel");
        pintarPanelPedido();
        var botones = cajaPedido.querySelectorAll(".pedido-lateral__quitar");
        var siguiente = botones[Math.min(i, botones.length - 1)] || $(".pedido-lateral__cerrar", cajaPedido);
        if (siguiente) siguiente.focus();
      });
      lista.appendChild(el("div", { class: "pedido-lateral__linea" }, [
        quitar,
        el("div", { class: "pedido-lateral__desc" }, [
          el("b", { texto: tx(l.nombre) }),
          l.etiqueta ? el("small", { texto: l.etiqueta }) : null
        ]),
        el("span", { class: "pedido-lateral__cant", texto: "×" + l.cant }),
        el("span", { class: "pedido-lateral__mon", texto: dinero(l.unitario * l.cant) })
      ]));
    });
    var suma = lineas.reduce(function (a, l) { return a + l.unitario * l.cant; }, 0);
    pie.appendChild(el("div", { class: "pedido-lateral__total" }, [
      el("span", { texto: t("pt_piezas") }),
      el("b", { texto: dinero(suma) })
    ]));
    /* Los bolívares debajo, a tasa BCV (él, 19/09/2026). Solo si la
       página cargó datos/envios.js, que es donde vive la tasa. */
    if (window.TASAS && window.TASAS.bcv) {
      pie.appendChild(el("p", { class: "pedido-lateral__bs", texto:
        "Bs " + (suma * window.TASAS.bcv).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
        " " + t("pt_a_tasa_bcv") }));
    }
    pie.appendChild(el("p", { class: "pedido-lateral__nota", texto: t("pedido_guardado") }));
    var ir = el("a", { class: "pedido-lateral__ir", href: "index.html#pt-pedido-seccion", texto: t("pedido_ir") });
    /* En Prototipos el pedido está en la misma página: se cierra el
       panel y se baja hasta él, sin recargar. */
    ir.addEventListener("click", function (e) {
      var destino = document.getElementById("pt-pedido-seccion");
      if (!destino) return;
      e.preventDefault();
      cerrarPedido(false);
      destino.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    pie.appendChild(ir);
  }

  function construirPanelPedido() {
    var cerrar = el("button", { class: "pedido-lateral__cerrar", type: "button", html: "&times;" });
    var velo = el("div", { class: "pedido-lateral__velo" });
    var caja = el("div", { class: "pedido-lateral" }, [
      velo,
      el("aside", { class: "pedido-lateral__caja", role: "dialog", "aria-modal": "true",
                    "aria-labelledby": "pedido-lateral-titulo" }, [
        el("div", { class: "pedido-lateral__arriba" }, [
          el("span", { class: "pedido-lateral__icono", html: iconoPedido() }),
          el("h2", { class: "pedido-lateral__titulo", id: "pedido-lateral-titulo" }),
          cerrar
        ]),
        el("div", { class: "pedido-lateral__lista" }),
        el("div", { class: "pedido-lateral__pie" })
      ])
    ]);
    cerrar.addEventListener("click", function () { cerrarPedido(true); });
    velo.addEventListener("click", function () { cerrarPedido(true); });

    /* DESLIZAR A LA DERECHA LO CIERRA (él, 16/09/2026). El panel sigue
       al dedo mientras se arrastra hacia la derecha; si pasa de 70 px,
       se cierra, y si no, vuelve a su sitio. Solo gestos más
       horizontales que verticales, para no estorbar el scroll. */
    var hoja = $(".pedido-lateral__caja", caja);
    /* Con eventos TÁCTILES y no de puntero (él, 16/09/2026: «se mueve,
       pero se detiene»): el navegador cancelaba el puntero en cuanto
       el dedo se desviaba un poco en vertical. Los táctiles no se
       cancelan, y al decidir que el gesto es horizontal se bloquea el
       scroll con preventDefault. */
    var x0 = null, y0 = 0, dx = 0, arrastrando = false;
    hoja.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) { x0 = null; return; }
      x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; arrastrando = false;
    }, { passive: true });
    hoja.addEventListener("touchmove", function (e) {
      if (x0 === null) return;
      var mx = e.touches[0].clientX - x0, my = e.touches[0].clientY - y0;
      if (!arrastrando) {
        if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
        if (Math.abs(my) > Math.abs(mx) || mx < 0) { x0 = null; return; }
        arrastrando = true;
        hoja.style.transition = "none";
      }
      e.preventDefault();
      dx = Math.max(0, mx);
      hoja.style.transform = "translateX(" + dx + "px)";
    }, { passive: false });
    function soltar() {
      if (x0 === null) return;
      x0 = null;
      if (!arrastrando) return;
      arrastrando = false;
      hoja.style.transition = "";
      hoja.style.transform = "";
      if (dx > 70) cerrarPedido(false);
    }
    hoja.addEventListener("touchend", soltar);
    hoja.addEventListener("touchcancel", soltar);
    document.body.appendChild(caja);
    return caja;
  }

  function abrirPedido() {
    if (!cajaPedido) cajaPedido = construirPanelPedido();
    focoAntesDelPedido = document.activeElement;
    pintarPanelPedido();
    cajaPedido.classList.add("abierto");
    /* EN TELÉFONO el botón ATRÁS cierra el pedido y deja al cliente
       donde estaba (él, 16/09/2026): antes lo sacaba de la página.
       Se apunta un paso en el historial al abrir; atrás lo consume. */
    if (esMovilPedido() && !(history.state && history.state.paPedido)) {
      try { history.pushState({ paPedido: 1 }, ""); } catch (e) {}
    }
    setTimeout(function () { $(".pedido-lateral__cerrar", cajaPedido).focus(); }, 60);
  }

  function esMovilPedido() { return window.matchMedia("(max-width: 560px)").matches; }
  var desdeAtras = false;
  window.addEventListener("popstate", function () {
    if (!cajaPedido || !cajaPedido.classList.contains("abierto")) return;
    desdeAtras = true;
    cerrarPedido(false);
    desdeAtras = false;
  });
  function cerrarPedido(devolverFoco) {
    if (!cajaPedido || !cajaPedido.classList.contains("abierto")) return;
    cajaPedido.classList.remove("abierto");
    /* Cerrado con la X o el velo: se deshace el paso apuntado. */
    if (!desdeAtras && history.state && history.state.paPedido) history.back();
    if (devolverFoco && focoAntesDelPedido && document.contains(focoAntesDelPedido)) {
      focoAntesDelPedido.focus();
    }
    focoAntesDelPedido = null;
  }

  /* ---------- precarga de las fotos del catálogo -----------
     18/09/2026 (él): todas las fotos de las cuadrículas —no solo la que
     se ve de cada tarjeta— se van bajando solas, de a tres, en segundo
     plano. Así, al pasar de una foto a otra ya están, y el glitch no se
     traba esperando la descarga. Mientras quede algo en la cola se ve
     la «ruedita» de texto ( | / — \ ) junto a los botones de vista.
     Con el mismo srcset que la foto de verdad, para que el navegador
     baje la MISMA versión (la de teléfono o la grande) que luego pinta. */
  var PRE = { cola: [], activos: 0, visto: {}, reloj: null, paso: 0 };
  var RUEDA = ["|", "/", "—", "\\"];
  function precargar(urls) {
    (urls || []).forEach(function (u) {
      if (!u || PRE.visto[u]) return;
      PRE.visto[u] = 1;
      PRE.cola.push(u);
    });
    siguientePrecarga();
    pintarRueda();
  }
  function siguientePrecarga() {
    while (PRE.activos < 6 && PRE.cola.length) {
      var u = PRE.cola.shift();
      PRE.activos++;
      var im = new Image();
      im.decoding = "async";
      ponerSrcset(im, u);
      im.onload = im.onerror = function () {
        PRE.activos--;
        siguientePrecarga();
        pintarRueda();
      };
      im.src = u;
    }
  }
  function pintarRueda() {
    var ocupado = PRE.activos > 0 || PRE.cola.length > 0;
    $$(".cargando").forEach(function (r) { r.classList.toggle("cargando--activo", ocupado); });
    if (ocupado && !PRE.reloj && !menosMovimiento) {
      PRE.reloj = setInterval(function () {
        PRE.paso = (PRE.paso + 1) % RUEDA.length;
        $$(".cargando").forEach(function (r) { r.textContent = RUEDA[PRE.paso]; });
      }, 110);
    } else if (!ocupado && PRE.reloj) {
      clearInterval(PRE.reloj); PRE.reloj = null;
    }
  }
  /* Pone la ruedita en una barra de catálogo, si no la tiene ya. */
  function ruedaEn(barra) {
    if (!barra || barra.querySelector(".cargando")) return;
    barra.appendChild(el("span", { class: "cargando", "aria-hidden": "true", texto: RUEDA[PRE.paso] }));
    pintarRueda();
  }
  /* 18/09/2026 (él: «no cargan antes de abrirlas») · Si llega una lista
     POR PIEZA (una lista de listas), se baja en ORDEN INTERCALADO: la
     1.ª foto de todas, luego la 2.ª de todas, la 3.ª… Así la foto que
     enseña la flecha de cada tarjeta está lista muy pronto, en vez de
     esperar a que se bajen enteras las piezas de más arriba. Y de a
     6 a la vez, no de a 3. */
  function intercalar(grupos) {
    var out = [], i, hay = true;
    for (i = 0; hay; i++) {
      hay = false;
      grupos.forEach(function (g) { if (g && i < g.length) { out.push(g[i]); hay = true; } });
    }
    return out;
  }
  window.PA_PRECARGA = function (urls, barra) {
    ruedaEn(barra);
    precargar(urls && Array.isArray(urls[0]) ? intercalar(urls) : urls);
  };

  /* ---------- foto a pantalla completa -----------------------
     18/09/2026 (él): en la ficha de una pieza —la página de Exhibición y
     el panel de Prototipos— un toque sobre la FOTO la agranda a toda la
     página (no a pantalla completa del sistema). Arriba a la izquierda,
     una flecha curva para volver; tocar fuera de la foto también cierra,
     y el gesto de «atrás» del teléfono igual. */
  function abrirFotoGrande(src, alt) {
    if (!src || $(".foto-grande")) return;
    var img = el("img", { class: "foto-grande__img", src: src, alt: alt || "" });
    var volver = el("button", { class: "foto-grande__volver", type: "button",
      "aria-label": t("ficha_volver"), html: ICONOS.volver });
    var capa = el("div", { class: "foto-grande", role: "dialog", "aria-modal": "true" }, [img, volver]);
    var prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function cerrar(desdeAtras) {
      if (!capa.parentNode) return;
      capa.remove();
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", tecla);
      window.removeEventListener("popstate", atras);
      if (!desdeAtras && history.state && history.state.paFoto) history.back();
    }
    function tecla(e) { if (e.key === "Escape") { e.stopPropagation(); cerrar(false); } }
    function atras() { cerrar(true); }
    volver.addEventListener("click", function (e) { e.stopPropagation(); cerrar(false); });
    capa.addEventListener("click", function (e) { if (e.target !== img) cerrar(false); });
    document.addEventListener("keydown", tecla, true);
    try { history.pushState({ paFoto: 1 }, ""); } catch (e) {}
    window.addEventListener("popstate", atras);
    document.body.appendChild(capa);
    volver.focus();
  }
  /* Un escuchador para las dos fichas. Solo fotos: el video, el 3D y
     los planos tienen sus propios controles. */
  document.addEventListener("click", function (e) {
    var img = e.target.closest && e.target.closest(".visor-medios__principal img, #pt-pn-visual img.pt-visual__foto");
    if (!img || e.target !== img) return;
    abrirFotoGrande(img.currentSrc || img.getAttribute("src"), img.getAttribute("alt"));
  });

  document.addEventListener("pa:pedido", pintarBolsa);
  window.addEventListener("storage", function (e) { if (e.key === PEDIDO_CLAVE) pintarBolsa(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") cerrarPedido(true);
  });

  /* ---------- flechas de los medios ------------------------
     2026-09-16 · En teléfono las flechas de las tarjetas y del visor
     son un TRIÁNGULO chato (la misma silueta que ‹ ›, cerrada con su
     lado vertical), con relleno translúcido para ver la foto detrás y
     sin recuadro. En computadora siguen siendo el glifo ‹ ›. Cada botón
     lleva los dos y el CSS enseña uno. */
  var FLECHA_TRI = {
    izq: '<svg class="flecha__tri" viewBox="0 0 12 20" aria-hidden="true" focusable="false"><path d="M10 2 2.5 10 10 18Z"/></svg>',
    der: '<svg class="flecha__tri" viewBox="0 0 12 20" aria-hidden="true" focusable="false"><path d="M2 2 9.5 10 2 18Z"/></svg>'
  };
  function flechaHTML(lado) {
    return '<span class="flecha__glifo">' + (lado === "izq" ? "&#8249;" : "&#8250;") + '</span>' + FLECHA_TRI[lado];
  }
  window.PA_FLECHA = flechaHTML;

  /* ---------- los cuadraditos de «qué foto es» --------------
     2026-09-16 · El contador «2/4» de las tarjetas pasa a ser una fila
     de cuadraditos centrada en el borde de abajo: uno por foto, el de
     la foto que se ve más opaco. No se ven siempre: solo con el ratón
     encima o en la última tarjeta que se tocó (clase `tarjeta-reciente`,
     que pone el escuchador de más abajo). La clase del contenedor se
     conserva (.tarjeta__cuenta / .pt-cuenta-fotos). */
  function puntosHTML(total, i) {
    var s = "";
    for (var k = 0; k < total; k++) s += '<i' + (k === i ? ' class="sel"' : '') + '></i>';
    return s;
  }
  /* LO QUE NO SE VE DESDE LA CUADRÍCULA (él, 17/09/2026): a la derecha
     de los cuadraditos de las fotos, un CUADRADO por cada medio que la
     pieza tiene dentro de su ficha —video, visor 3D— para que se note
     que hay algo más allá. Van en acento apagado y poco opaco (el CSS,
     .franja__extra). Devuelve "" si no hay ninguno. */
  function extrasHTML(tipos) {
    if (!tipos.length) return "";
    return '<span class="franja__extras">' + tipos.map(function (x) {
      return '<i class="franja__extra" data-medio="' + x + '"></i>';
    }).join("") + '</span>';
  }
  window.PA_EXTRAS = extrasHTML;

  function marcarPuntos(caja, i) {
    if (!caja) return;
    [].forEach.call(caja.children, function (c, k) { c.classList.toggle("sel", k === i); });
    caja.setAttribute("aria-label", (i + 1) + " / " + caja.children.length);
  }
  window.PA_PUNTOS = { html: puntosHTML, marcar: marcarPuntos };

  /* La última tarjeta tocada (clic o dedo) enseña sus cuadraditos. */
  function marcarReciente(e) {
    var t = e.target.closest && e.target.closest(".tarjeta, .pt-ficha");
    if (!t) return;
    $$(".tarjeta-reciente").forEach(function (x) { if (x !== t) x.classList.remove("tarjeta-reciente"); });
    t.classList.add("tarjeta-reciente");
  }
  document.addEventListener("click", marcarReciente, true);
  document.addEventListener("touchstart", marcarReciente, { capture: true, passive: true });

  /* ---------- deslizar con el dedo -------------------------
     2026-09-16 · En las tarjetas y en las fichas de Prototipos y
     Exhibición, deslizar de derecha a izquierda pasa al siguiente
     medio y al revés al anterior. No se reescribe el paso de foto: se
     PULSA la flecha que ya existe, así el gesto hace exactamente lo
     mismo que el botón. En el panel de Prototipos, que no tiene
     flechas, se avisa con el evento `pa:deslizar` (prototipos.js).
     Sobre el visor 3D no se hace nada: ahí el dedo gira el modelo. */
  /* 2ª vuelta (16/09/2026): con EVENTOS DE PUNTERO, que valen para el
     dedo y para el ratón (movil.html se prueba arrastrando con el
     ratón), y con la tarjeta ENTERA como zona: en Prototipos el dedo
     cae casi siempre sobre el enlace invisible que cubre la tarjeta,
     fuera del hueco de la foto. Tras un deslizamiento se anula el clic
     que viene detrás, para que no se abra la pieza. */
  var DESLIZABLES = [
    { caja: ".pt-ficha", izq: ".pt-flecha--izq", der: ".pt-flecha--der" },
    { caja: ".tarjeta", izq: ".tarjeta__flecha--izq", der: ".tarjeta__flecha--der" },
    { caja: ".visor-medios__principal", izq: ".visor-medios__flecha--izq", der: ".visor-medios__flecha--der" },
    { caja: ".pt-visual", izq: ".pt-visual__flecha--izq", der: ".pt-visual__flecha--der" }
  ];
  var toque = null, anularClic = false;
  document.addEventListener("pointerdown", function (e) {
    toque = null;
    if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0) || !e.target.closest) return;
    if (e.target.closest("canvas, .visor3d, [data-medio='3d'], .pt-medios, .visor-medios__tiras")) return;
    for (var k = 0; k < DESLIZABLES.length; k++) {
      var caja = e.target.closest(DESLIZABLES[k].caja);
      if (caja) {
        /* La flecha que se pulse después tiene que existir. */
        if (!caja.querySelector(DESLIZABLES[k].der)) return;
        toque = { x: e.clientX, y: e.clientY, caja: caja, d: DESLIZABLES[k] };
        return;
      }
    }
  }, true);
  function soltar(e) {
    if (!toque) return;
    var t0 = toque; toque = null;
    var dx = e.clientX - t0.x;
    var dy = e.clientY - t0.y;
    /* Sobre todo horizontal y de más de 40 px: un scroll vertical
       torcido no cuenta como deslizar. */
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    var b = t0.caja.querySelector(dx < 0 ? t0.d.der : t0.d.izq);
    if (!b) return;
    anularClic = true;
    setTimeout(function () { anularClic = false; }, 350);
    b.click();
  }
  document.addEventListener("pointerup", soltar, true);
  document.addEventListener("pointercancel", function () { toque = null; }, true);
  document.addEventListener("click", function (e) {
    if (!anularClic || !e.isTrusted) return;
    anularClic = false;
    e.preventDefault();
    e.stopPropagation();
  }, true);
  /* Que el navegador no arrastre la foto como archivo al deslizar con
     el ratón. */
  document.addEventListener("dragstart", function (e) {
    if (e.target.closest && e.target.closest(".pt-ficha, .tarjeta, .visor-medios__principal, .pt-visual")) e.preventDefault();
  });

  /* ---------- buscador ------------------------------------ */

  var cajaBuscador = null;

  /* Quita acentos y mayusculas para que "cubo" encuentre "Cúbo"
     y "meson" encuentre "Mesón". */
  function normalizar(s) {
    return (s || "").toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  /* Palabras asociadas de una pieza (datos/busqueda.js). */
  function palabrasDe(slug) {
    return (window.BUSQUEDA && window.BUSQUEDA.piezas && window.BUSQUEDA.piezas[slug]) || "";
  }

  /* ¿Aparece la palabra buscada? Si no, se prueba sin la «s» o el
     «es» final, para que «oficinas» o «maderas» también encuentren. */
  function contiene(texto, p) {
    if (texto.indexOf(p) >= 0) return true;
    if (p.length > 4 && /es$/.test(p) && texto.indexOf(p.slice(0, -2)) >= 0) return true;
    if (p.length > 3 && /s$/.test(p) && texto.indexOf(p.slice(0, -1)) >= 0) return true;
    return false;
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
          (tx(w.como) || []).join(" "), w.medidas, palabrasDe(w.slug)
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
          }).join(" "),
          palabrasDe(p.slug)
        ].join(" "))
      });
    });

    /* Partes de páginas (El taller, Contacto) con sus palabras
       asociadas, de datos/busqueda.js (16/09/2026). */
    ((window.BUSQUEDA && window.BUSQUEDA.secciones) || []).forEach(function (s) {
      filas.push({
        grupo: "sitio",
        titulo: tx(s.titulo),
        detalle: tx(s.donde),
        url: s.url,
        texto: normalizar([s.titulo.es, s.titulo.en, s.donde.es, s.donde.en, s.palabras].join(" "))
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
    var campo = el("input", { type: "search", placeholder: " ",
                              "aria-label": t("buscar"), autocomplete: "off" });
    var entrada = el("span", { class: "buscador__entrada" }, [campo,
      el("span", { class: "buscador__cursor", "aria-hidden": "true", texto: "|" })
    ]);
    var lista = el("div", { class: "buscador__lista" });
    var cerrar = el("button", { class: "buscador__cerrar", type: "button", texto: "Esc" });

    var caja = el("div", { class: "buscador" }, [
      el("div", { class: "buscador__caja" }, [
        el("div", { class: "buscador__arriba" }, [
          el("span", { html: ICONOS.lupa }), entrada, cerrar
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
        return trozos.every(function (p) { return contiene(f.texto, p); });
      });

      if (!hallados.length) {
        lista.appendChild(el("p", { class: "buscador__vacio",
          texto: t("buscar_nada").replace("{q}", campo.value.trim()) }));
        return;
      }

      [["tienda", "buscar_en_tienda"], ["portafolio", "buscar_en_portafolio"],
       ["sitio", "buscar_en_sitio"]].forEach(function (g) {
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
  var menuAbiertoEn = 0;
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
    /* false desde el 16/09/2026: en teléfono Contacto se va a la
       hamburguesa y su sitio en la fila lo ocupa la bolsa. */
    ["nav_contacto",     "contacto.html",   "nav_pre_contacto",   false]
  ];

  function etiquetaNavegacion(texto, activa, clase) {
    var nombre = el("span", { class: "nav-etiqueta" + (clase ? " " + clase : ""), texto: texto });
    if (activa) nombre.appendChild(el("span", { class: "nav-marca", "aria-hidden": "true", texto: ">" }));
    return nombre;
  }

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
                  class: "barra-rapida__a",
                  href: m[1],
                  "aria-current": m[1] === aqui ? "page" : null
                }, [etiquetaNavegacion(t(m[0]), m[1] === aqui)]);
              })
    );

    /* 2026-09-16 · En teléfono la bolsa va en la fila de abajo, al
       lado de Exhibición, solo con su dibujo. Y la lupa sube a la
       fila del logotipo, a la derecha (se va con él al encoger). */
    var bolsaMovil = el("button", { class: "lupa bolsa bolsa--rapida", type: "button",
      "aria-label": t("pedido_abrir") }, [
      el("span", { class: "lupa__icono", html: iconoPedido() }),
      el("span", { class: "bolsa__n", hidden: "" })
    ]);
    bolsaMovil.addEventListener("click", abrirPedido);
    rapida.appendChild(bolsaMovil);
    var lupaMovil = el("button", { class: "lupa lupa--movil", type: "button",
      "aria-label": t("buscar") }, [el("span", { class: "lupa__icono", html: ICONOS.lupa })]);
    lupaMovil.addEventListener("click", abrirBuscador);
    /* TELÉFONO: WhatsApp e Instagram junto a la lupa, arriba (él,
       16/09/2026). Contacto sigue también dentro del ☰. */
    var MR = window.MARCA || {};
    var redesMovil = el("div", { class: "redes-movil" });
    /* 18/09/2026 (él): aquí iba el icono de WhatsApp. Ahora es un globo
       de conversación que lleva a la página de Contacto —donde están
       WhatsApp, el correo, Instagram y el chatbot—, y Contacto sale del ☰
       en teléfono (el CSS lo esconde allí). */
    redesMovil.appendChild(el("a", { class: "redes-movil__a", href: "contacto.html",
      "aria-label": t("nav_contacto"),
      "aria-current": aqui === "contacto.html" ? "page" : null }, [
        el("span", { class: "redes-movil__icono", html: ICONOS.globoRedondo }),
        etiquetaNavegacion(t("nav_contacto"), aqui === "contacto.html")
      ]));
    /* 18/09/2026 (él, 2.ª vuelta): el globo no le convenció. Ahora es la
       PALABRA «Contacto» en esa esquina, y la lupa de arriba sale: se
       busca desde el ☰, a la derecha de los botones de modo. */

    /* Instagram salió de aquí (él, 16/09/2026): queda solo WhatsApp. */

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
            /* Contacto lleva su globo encima, para llamar la atención
               (él, 18/09/2026). En teléfono este enlace no se ve. */
            if (m[1] === "contacto.html") {
              a.classList.add("menu__contacto");
              a.appendChild(el("span", { class: "menu__globo", html: ICONOS.globoRedondo }));
            }
            a.appendChild(etiquetaNavegacion(t(m[0]), activa, "menu__nombre"));
            return a;
          })
    );

    var lupaMenu = el("button", { class: "lupa lupa--menu", type: "button",
      "aria-label": t("buscar") }, [el("span", { class: "lupa__icono", html: ICONOS.lupa })]);
    lupaMenu.addEventListener("click", function () { if (cerrarMenuActivo) cerrarMenuActivo(); abrirBuscador(); });
    /* Va en la fila de Novedades y El taller, en la 3.ª columna (él, 18/09). */
    menu.appendChild(lupaMenu);

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
    var BANDERA_IDIOMA = {
      es: '<svg viewBox="0 0 60 40" aria-hidden="true" focusable="false"><path class="b-l" d="M0 13.33H60M0 26.67H60"/><path class="b-estrella" d="M21.07 21.70 L21.43 22.56 L22.36 22.63 L21.65 23.24 L21.87 24.14 L21.07 23.66 L20.28 24.14 L20.50 23.24 L19.79 22.63 L20.72 22.56Z M23.09 18.43 L23.45 19.29 L24.37 19.36 L23.67 19.97 L23.88 20.87 L23.09 20.39 L22.30 20.87 L22.51 19.97 L21.81 19.36 L22.73 19.29Z M26.24 16.23 L26.59 17.09 L27.52 17.16 L26.82 17.76 L27.03 18.67 L26.24 18.18 L25.44 18.67 L25.66 17.76 L24.95 17.16 L25.88 17.09Z M30.00 15.45 L30.36 16.31 L31.28 16.38 L30.58 16.99 L30.79 17.89 L30.00 17.41 L29.21 17.89 L29.42 16.99 L28.72 16.38 L29.64 16.31Z M33.76 16.23 L34.12 17.09 L35.05 17.16 L34.34 17.76 L34.56 18.67 L33.76 18.18 L32.97 18.67 L33.18 17.76 L32.48 17.16 L33.41 17.09Z M36.91 18.43 L37.27 19.29 L38.19 19.36 L37.49 19.97 L37.70 20.87 L36.91 20.39 L36.12 20.87 L36.33 19.97 L35.63 19.36 L36.55 19.29Z M38.93 21.70 L39.28 22.56 L40.21 22.63 L39.50 23.24 L39.72 24.14 L38.93 23.66 L38.13 24.14 L38.35 23.24 L37.64 22.63 L38.57 22.56Z"/><path class="b-l b-fino" d="M3.5 3H9V7Q9 10 6.25 11Q3.5 10 3.5 7Z"/><path class="b-s" d="M6.25 4V10M4.7 5.6H7.8"/></svg>',
      en: '<svg viewBox="0 0 60 40" aria-hidden="true" focusable="false"><mask id="bandera-uk-m"><rect width="60" height="40" fill="#fff"/><path d="M25 0H35V15H60V25H35V40H25V25H0V15H25Z" fill="#000"/></mask><g mask="url(#bandera-uk-m)"><path class="b-l" d="M-16.66 -7.50 L73.34 52.50 M-13.34 -12.50 L76.66 47.50 M76.66 -7.50 L-13.34 52.50 M73.34 -12.50 L-16.66 47.50"/><path class="b-l" d="M0 0L60 40M60 0L0 40"/></g><path class="b-l" d="M25 0V15H0M35 0V15H60M25 40V25H0M35 40V25H60"/><path class="b-l" d="M27 0V17H0M33 0V17H60M27 40V23H0M33 40V23H60"/></svg>'
    };
    var botones = IDIOMAS.map(function (i) {
      var b = el("button", { type: "button", "aria-pressed": i === idioma,
                             "aria-label": NOMBRE_IDIOMA[i] });
      b.appendChild(el("span", { class: "ctrl__corto", texto: i.toUpperCase() }));
      /* El nombre de cada idioma va SIEMPRE en su propio idioma
         —«Español», «English»—, nunca traducido. Es la convención
         de todo selector de idioma que funciona: quien busca su
         lengua la reconoce escrita como la escribe él. */
      b.appendChild(el("span", { class: "ctrl__largo", texto: NOMBRE_IDIOMA[i] }));
      /* 17/09/2026 · ARCHIVADAS las banderas (Venezuela / Reino Unido)
         que se probaron el 16/09: vuelven las palabras «español» y
         «english» dentro del botón, en minúsculas y del mismo tamaño de
         botón. El dibujo se sigue montando pero el CSS lo esconde
         (.idioma__bandera { display: none }), así que para recuperarlo
         basta esa línea; no hace falta volver a dibujarlo. */
      b.appendChild(el("span", { class: "idioma__bandera", html: BANDERA_IDIOMA[i] }));
      b.classList.add("idioma__btn--" + i);
      return b;
    });
    botones.forEach(function (b, n) {
      b.addEventListener("click", function () { ponerIdioma(IDIOMAS[n]); });
    });

    /* 18/09/2026 (él) · El idioma pasa a ser un INTERRUPTOR: «ES», un
       riel con su bolita, «EN». Tocar el riel cambia al otro idioma;
       tocar ES o EN pone ese. Las dos palabras largas (español /
       english) siguen montadas pero el CSS las esconde. */
    var interruptorIdioma = el("button", { type: "button", class: "idioma__riel",
      role: "switch", "aria-checked": idioma === IDIOMAS[1] ? "true" : "false",
      "aria-label": NOMBRE_IDIOMA[IDIOMAS[1]] }, [el("span", { class: "idioma__bola" })]);
    interruptorIdioma.addEventListener("click", function () {
      ponerIdioma(idioma === IDIOMAS[0] ? IDIOMAS[1] : IDIOMAS[0]);
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
        class: m === "auto" ? "tema__auto" : "tema__bicho",
        title: ETIQUETA_TEMA[m][idioma], "aria-label": ETIQUETA_TEMA[m][idioma],
        "aria-pressed": m === temaVisible()
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
      /* 16/09/2026 (él): oscuro y claro, solo su dibujo, sin palabra;
         el automático, solo la palabra «auto», sin icono. Igual en
         computadora y en teléfono. */
      if (m === "auto") {
        b.appendChild(el("span", { class: "ctrl__largo", texto: "auto" }));
      }
      b.dataset.tema = m;
      b.addEventListener("click", function () { ponerTema(m); });
      return b;
    });

    /* 18/09/2026 (él) · El modo también es INTERRUPTOR, como el idioma:
       lobo sin marco, riel cuadrado, gallo sin marco. */
    var interruptorTema = el("button", { type: "button", class: "idioma__riel tema__riel",
      role: "switch", "aria-checked": temaVisible() === TEMAS[1] ? "true" : "false",
      "aria-label": ETIQUETA_TEMA[TEMAS[1]][idioma] }, [el("span", { class: "idioma__bola" })]);
    interruptorTema.addEventListener("click", function () {
      ponerTema(temaVisible() === TEMAS[0] ? TEMAS[1] : TEMAS[0]);
    });

    /* aria-expanded dice si el menú está desplegado o no. Sin él,
       un lector de pantalla anuncia «Menú, botón» y se queda ahí:
       no hay forma de saber si pulsar lo abre o lo cierra, ni si
       lo que se acaba de pulsar hizo algo. Se marca también
       aria-controls para atar el botón con la lista que abre. */
    var hamb = el("button", { class: "hamburguesa", type: "button",
                              "aria-label": "Menú", "aria-expanded": "false",
                              "aria-controls": "menu",
      /* 18/09/2026 (él) · El ☰ dibujado: tres líneas siena. */
      html: '<svg class="hamburguesa__lineas" viewBox="0 0 20 16" aria-hidden="true" focusable="false">' +
            '<rect y="1" width="20" height="2"/><rect y="7" width="20" height="2"/><rect y="13" width="20" height="2"/></svg>' });
    /* 2026-08-17 · Abrir y cerrar en un solo sitio, porque ahora se
       cierra desde cuatro lados distintos: el propio botón, al
       desplazar la página, al tocar fuera del encabezado y con Esc.
       La clase va también en la CABECERA y no solo en el menú:
       desde que la lupa, el idioma y el tema viven dentro del
       desplegable hay que enseñarlos y esconderlos con él, y son
       hermanos de .menu, no hijos. Con la clase en el padre común
       el CSS los alcanza sin depender del orden de los hermanos. */
    function ponerMenu(abierto) {
      /* 18/09/2026 (él) · TELÉFONO: la raya de abajo de la cabecera BAJA
         (o sube) hasta su sitio y va destapando los botones a su paso.
         Se anima la altura de la cabecera: se mide antes y después del
         cambio y se va de una a otra con la caja recortada. */
      var cambia = menu.classList.contains("abierto") !== abierto;
      var animar = cambia && window.matchMedia("(max-width: 780px)").matches &&
                   !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var h0 = animar ? host.getBoundingClientRect().height : 0;
      menu.classList.toggle("abierto", abierto);
      host.classList.toggle("cabecera--abierta", abierto);
      /* Idioma y modo se esconden TAMBIÉN por su cuenta (él, 16/09/2026:
         en su teléfono, al desplazar, se cerraban las páginas pero no
         estos botones). */
      var utiles = host.querySelector(".cabecera__utiles");
      if (utiles) utiles.classList.toggle("cabecera__utiles--cerrado", !abierto);
      hamb.setAttribute("aria-expanded", abierto ? "true" : "false");
      menuEstaAbierto = function () { return menu.classList.contains("abierto"); };
      if (animar) {
        var h1 = host.getBoundingClientRect().height;
        host.style.transition = "none";
        host.style.height = h0 + "px";
        host.style.overflow = "hidden";
        host.getBoundingClientRect();              /* fija el punto de partida */
        host.style.transition = "height .38s cubic-bezier(.22, .61, .36, 1)";
        host.style.height = h1 + "px";
        clearTimeout(host._cortina);
        host._cortina = setTimeout(function () {
          host.style.height = ""; host.style.overflow = ""; host.style.transition = "";
        }, 420);
      }
      if (abierto) {
        yMenuAbierto = window.scrollY;
        /* Al abrirse, la cabecera crece y el navegador puede mover la
           página unos píxeles por su cuenta (anclaje del scroll). Con la
           página un poco desplazada eso bastaba para cerrarlo al instante
           (él, 16/09/2026). Durante medio segundo se toma como nuevo
           punto de partida en vez de cerrar. */
        menuAbiertoEn = Date.now();
      }
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
        if (menuEstaAbierto() && Date.now() - menuAbiertoEn < 500) { yMenuAbierto = window.scrollY; return; }
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

    /* La bolsa del pedido, a la izquierda de la lupa (él, 16/09/2026).
       Abre el panel lateral; el número es cuántas piezas lleva. */
    var bolsa = el("button", { class: "lupa bolsa", type: "button",
      "aria-label": t("pedido_abrir") }, [
      el("span", { class: "lupa__icono", html: ICONOS.bolsa }),
      el("span", { class: "bolsa__n" }),
      el("span", { class: "ctrl__largo", texto: t("pt_tu_pedido") })
    ]);
    bolsa.addEventListener("click", abrirPedido);



    /* Si el menú estaba abierto (se cambió el idioma desde dentro), el
       nuevo se deja abierto también: antes el encabezado conservaba la
       marca de «abierto» pero la fila de páginas nacía cerrada, y en el
       teléfono desaparecían Novedades, El taller y Contacto (él,
       17/09/2026). */
    var menuEstabaAbierto = host.classList.contains("cabecera--abierta");
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
        el("span", { class: "marca__perfil-ventana", "aria-hidden": "true" }, [
          el("img", { class: "marca__perfil", src: "img/marca/perfil.webp", alt: "" })
        ])
      ]),
      redesMovil,
      rapida,
      menu,
      el("div", { class: "cabecera__botones" }, [bolsa, lupa]),
      hamb,
      /* 2026-08-17 · Lupa + idioma + tema cuelgan de UN envoltorio.
         Antes eran dos items sueltos de la fila.
         En escritorio siguen en la esquina de siempre. En teléfono
         el envoltorio se va DENTRO del desplegable, debajo de
         Novedades y El taller, y aparece y desaparece con él.
         Agrupados se mueven de una pieza; sueltos habría que
         colocar dos cosas y la fila se quedaba con el hueco de una
         de ellas. */
      el("div", { class: "cabecera__utiles" }, [
        /* Idioma y tema van dentro de UNA caja. Sueltos eran dos items
           del flex y en móvil la fila los partía en renglones
           distintos: el idioma acababa abajo con el menú y el tema
           arriba con la lupa. Agrupados no se separan nunca. */
        /* Con título cada grupo (él, 16/09/2026): ahora viven en la
           hamburguesa también en computadora y hay sitio. */
        el("div", { class: "controles" }, [
          /* 18/09/2026 (él) · SIN riel: el interruptor se probó y salió.
             Quedan solo los iconos (ES/EN en negrita y lobo/gallo); el
             puesto va en siena. Los interruptores siguen definidos arriba
             por si vuelven. */
          el("div", { class: "idioma idioma--interruptor" }, botones),
          el("div", { class: "tema tema--interruptor" }, botonesTema)
        ])
      ])
    ]));
    animarPerfil(host);
    ponerMenu(menuEstabaAbierto);
    pintarBolsa();
  }

  /* 2026-08-14 · Aquí se montaba la FRANJA DE NOVEDADES: una tira
     delgada bajo el encabezado con un aviso cruzando de derecha a
     izquierda. Se probó y no le gustó, así que fuera entera —el
     JS, su CSS y la lista `avisos` de datos/marca.js—. */

  function animarPerfil(host) {
    if (host._limpiarPerfil) host._limpiarPerfil();
    var foto=host.querySelector('.marca__perfil'),raf=0,muerto=false;
    host.classList.remove('perfil-listo');
    function mostrar(){
      if(muerto)return;
      raf=requestAnimationFrame(function(){raf=requestAnimationFrame(function(){if(!muerto)host.classList.add('perfil-listo');});});
    }
    foto.decode().then(mostrar,mostrar);
    host._limpiarPerfil=function(){muerto=true;cancelAnimationFrame(raf);};
  }
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
        /* En minúsculas, como el logotipo (él, 15/09/2026). Solo aquí:
           M.nombre sigue con mayúsculas para títulos y mensajes. */
        el("span", { class: "pie__marca", texto: M.nombre.toLowerCase() + " · " + tx(M.ciudad) }),
        el("div", { class: "pie__enlaces" }, enlaces)
      ]),
      el("div", { class: "pie__fila pie__fila--huevo" }, [huevoApilar()])
    ]));
  }

  /* EASTER EGG (él, 16/09/2026): un huevo bajo Instagram abre el juego
     de apilar tablas. js/apilar.js se descarga solo al tocarlo. */
  function huevoApilar() {
    var b = el("button", { class: "pie__huevo", type: "button", "aria-label": "?",
      html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c3.6 0 6.8 5.4 6.8 10.2 0 4.4-3 7.8-6.8 7.8s-6.8-3.4-6.8-7.8C5.2 7.9 8.4 2.5 12 2.5z"/></svg>' });
    b.addEventListener("click", function () {
      if (window.PA_APILAR) { window.PA_APILAR.abrir(); return; }
      var sc = document.createElement("script");
      sc.src = "js/apilar.js";
      sc.onload = function () { if (window.PA_APILAR) window.PA_APILAR.abrir(); };
      document.head.appendChild(sc);
    });
    return b;
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
        "data-paso": "-1", "aria-label": t("pt_anterior"), html: flechaHTML("izq")
      }));
      marco.appendChild(el("button", {
        class: "tarjeta__flecha tarjeta__flecha--der", type: "button",
        "data-paso": "1", "aria-label": t("pt_siguiente"), html: flechaHTML("der")
      }));
    }
    /* Los cuadraditos, en una franja bajo la foto (él, 16/09/2026);
       vacía con una sola foto, para que las cartas midan igual. */
    var franja = el("div", { class: "tarjeta__franja" });
    /* Con una sola foto también sale su cuadradito (él, 16/09/2026). */
    var totalFotos = fotos.length || (w.imagen ? 1 : 0);
    if (totalFotos >= 1) {
      franja.appendChild(el("span", {
        class: "tarjeta__cuenta", role: "img", "aria-label": (i + 1) + " / " + totalFotos,
        html: puntosHTML(totalFotos, i)
      }));
    }
    /* Video y 3D de esta pieza, como cuadrados a la derecha. */
    var extras = [];
    if (w.video) extras.push("video");
    if (modeloDe(w)) extras.push("3d");
    if (extras.length) franja.appendChild(el("span", { html: extrasHTML(extras) }));

    /* h2 y no h3 (15/08/2026): en Exhibición la cuadrícula cuelga
       directamente del <h1> de la página, sin ninguna sección
       intermedia, así que con h3 la jerarquía saltaba de 1 a 3.
       Es como una tabla de contenidos a la que le falta un
       escalón. El aspecto no cambia: el CSS de abajo apunta a los
       dos niveles. */
    var hijos = [
      marco,
      franja,
      el("h2", {}, [
        el("a", { class: "tarjeta__abrir", href: "trabajo.html?id=" + w.slug,
                  texto: tx(w.titulo) })
      ])
    ];

    /* EL BLOQUE DE DETALLES VA SIEMPRE EN EL MARCADO, y el CSS lo
       enseña solo en la vista de lista (él, 15/09/2026). Se hace así
       a propósito: si las tres vistas comparten el mismo marcado, el
       carrusel de flechas y la rotación automática siguen encontrando
       `.tarjeta__marco img` y `.tarjeta__cuenta` sin enterarse de qué
       vista está puesta. Cambiar de vista es cambiar UNA clase. */
    /* EN COLUMNAS, y en ESTE orden (él, 15/09/2026):
       material · acabado · tipo · medidas · año.

       Se pintan SIEMPRE las cinco, con un guion donde la pieza no
       tiene ese dato. Si se saltaran las vacías, las columnas
       dejarían de cuadrar de una pieza a la siguiente —el material
       de una quedaría encima del año de otra—, que es justo lo que
       se ve mal cuando una tabla no está alineada. */
    var datos = [
      [t("ficha_material"), (w.materiales || []).map(function (m) {
        return etiqueta("material", m);
      }).join(", ")],
      [t("ficha_acabado"), (w.acabado || []).map(function (a) {
        return etiqueta("acabado", a);
      }).join(", ")],
      [t("ficha_tipo"), w.tipo ? etiqueta("tipo", w.tipo) : ""],
      [t("ficha_medidas"), w.medidas || ""],
      [t("ficha_ano"), w.anio ? (w.anio + (w.anio_estimado ? " (?)" : "")) : ""]
    ];

    var filas = datos.map(function (d) {
      return el("div", { class: "tarjeta__dato" }, [
        el("span", { class: "tarjeta__clave", texto: d[0] }),
        el("span", { class: "tarjeta__valor", texto: String(d[1] || "—") })
      ]);
    });
    /* LA DESCRIPCIÓN VA DEBAJO DEL TÍTULO y antes de las categorías
       (él, 15/09/2026), como en Prototipos. Antes iba al final, dentro
       del bloque de datos. Solo si la pieza la tiene: hoy casi
       ninguna. El CSS la esconde fuera de la vista de lista. */
    var res = tx(w.resumen);
    if (res) hijos.push(el("p", { class: "tarjeta__res", texto: res }));
    if (filas.length) hijos.push(el("div", { class: "tarjeta__detalles" }, filas));

    return el("div", { class: "tarjeta", "data-slug": w.slug }, hijos);
  }

  /* ============================================================
     LAS TRES VISTAS DE EXHIBICIÓN (15/09/2026, pedido suyo)
     ------------------------------------------------------------
     Tres botones arriba a la izquierda de la cuadrícula:
       1. cuadrícula de tres  (la de siempre, la principal)
       2. cuadrícula de cinco (más densa, piezas más chicas)
       3. lista               (foto a la izquierda, y a la derecha
                               el título primero y los datos debajo)

     `rejilla--tres` se queda SIEMPRE: no significa «tres columnas»
     sino «esta es la cuadrícula de Exhibición», y hay CSS viejo que
     cuelga de ella (la foto cuadrada, el título centrado). Las otras
     dos vistas son una clase MÁS que la pisa donde hace falta.

     La elección se guarda en el navegador de quien mira, así que al
     volver encuentra la vista que dejó. Va en try/catch porque en
     ventana privada `localStorage` puede reventar al leerlo.
     ============================================================ */
  /* «cuatro» (él, 17/09/2026): cuadrícula de 4 columnas, en computadora
     entre la de tres y la de cinco; en teléfono va DESPUÉS de la de dos
     (el CSS reordena los botones allá). */
  var VISTAS = ["tres", "cuatro", "cinco", "lista"];

  /* LA VISTA YA NO SE GUARDA (él, 15/09/2026): al salir de la página y
     volver, arranca otra vez en la de tres. Antes vivía en
     localStorage, bajo `pa-vista-exhibicion`, y sobrevivía a la visita.
     Ahora es una variable normal: se pierde al recargar —que es lo que
     él quiere— pero se conserva DENTRO de la visita, que hace falta
     porque al cambiar un filtro se repinta la cuadrícula entera y
     `pintarRejillaTrabajos` necesita saber en qué vista está. */
  /* POR DEFECTO (él, 17/09/2026): en computadora la de CUATRO; en
     teléfono sigue la de tres (una columna). */
  var vistaActual = window.matchMedia("(min-width: 561px)").matches ? "cuatro" : "tres";

  function vistaGuardada() { return vistaActual; }

  /* LOS TRES ICONOS, CUADRADOS ENTRE SÍ (rehechos el 15/09/2026: él
     veía «espacios y grosores desiguales», y los tenía).

     Lo que fallaba: cada icono se dibujaba con sus propios números a
     ojo, así que el hueco del de tres era 2,0 y el del de cinco 1,6,
     y los bloques medían 20,5 y 21,4 de lado — uno se veía más
     grande que el otro aunque el marco fuera igual.

     Ahora los tres ocupan EXACTAMENTE la misma caja: de 2 a 22 en
     los dos ejes, sobre el lienzo de 24. El lado del cuadradito se
     calcula a partir del hueco, en vez de escribir los dos a mano:
     así el dibujo siempre llena la caja entera y los huecos salen
     todos iguales. El de cinco lleva hueco más chico a propósito —es
     la cuadrícula densa—, pero empieza y acaba donde los otros. */
  /* TODO EN NÚMEROS ENTEROS, y el icono se dibuja a 24 px justos
     (2ª vuelta, 15/09/2026: él seguía viendo «grosores desiguales»).

     La causa no era el reparto sino los MEDIOS PÍXELES. La versión
     anterior ponía los cuadrados en 2, 9,5 y 17 con lado 5, y el
     icono se dibujaba a 16,8 px: al escalar, esos 5 quedaban en
     3,5 px y el navegador redondeaba unos cuadrados a 3 y otros a 4.
     De ahí que uno se viera más gordo que el de al lado.

     Arreglo: el lienzo es de 24, el icono mide 24 px —así una unidad
     es un píxel— y ninguna coordenada lleva decimales.
       · tres:  lado 6, hueco 3   → 0, 9, 18
       · cinco: lado 3, hueco 2   → 0, 5, 10, 15, 20
       · lista: punto de 4 y raya de 4 de alto, el MISMO grosor, con
                3 de hueco entre los dos, como el icono de tres.
     `shape-rendering="crispEdges"` solo en los de cuadraditos: apaga
     el suavizado y los deja a filo de píxel. En la lista NO, que ahí
     hay círculos y sin suavizado saldrían dentados. */
  function iconoVista(v) {
    var s = "", x, y;
    if (v === "lista") {
      /* 15/09/2026 (él, 3ª vuelta): rayas MÁS FINAS —de 4 a 2— y los
         tres puntos MÁS JUNTOS: el paso baja de 10 a 8. Con paso 8 los
         tres renglones ocupan de 2 a 22, así que el dibujo queda
         centrado en el lienzo. Todo sigue en números enteros. */
      for (y = 0; y < 3; y++) {
        var cy = 4 + y * 8;
        s += '<rect x="0" y="' + (cy - 2) + '" width="4" height="4"/>' +
             '<rect x="7" y="' + (cy - 2) + '" width="17" height="4"/>';
      }
      return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + s + '</svg>';
    }
    var n = v === "cinco" ? 5 : v === "cuatro" ? 4 : 3;
    /* El de cinco iba con lado 3 y paso 5: el bloque medía 23 sobre un
       lienzo de 24, así que sobraba una unidad ABAJO y A LA DERECHA y el
       dibujo se veía corrido arriba y a la izquierda (él, 15/09/2026).
       Con lado 4 el bloque mide 24 justos y queda centrado, igual que el
       de tres (lado 6, paso 9 → también 24). El cuadradito engorda de 3
       a 4: es el precio de que todo caiga en píxeles enteros, que es lo
       que evita los grosores desiguales. */
    /* De cuatro (17/09/2026, más grandes): lado 5 y paso 6 → de 0 a 23. */
    var lado = n === 5 ? 4 : n === 4 ? 5 : 6;
    var paso = n === 5 ? 5 : n === 4 ? 6 : 9;
    for (y = 0; y < n; y++) {
      for (x = 0; x < n; x++) {
        s += '<rect x="' + (x * paso) + '" y="' + (y * paso) +
             '" width="' + lado + '" height="' + lado + '"/>';
      }
    }
    /* En teléfono la de «cuatro» pinta TRES columnas (él, 17/09/2026),
       así que su botón dibuja 3×3 y no 4×4. */
    return '<svg class="vistas__ico--pc" viewBox="0 0 24 24" shape-rendering="crispEdges" ' +
           'aria-hidden="true" focusable="false">' + s + '</svg>' +
           iconoVistaMovil(n === 5 ? 2 : n === 4 ? 3 : 1);
  }

  /* EN TELÉFONO (él, 16/09/2026) la cuadrícula de tres es de UNA
     columna y la de cinco es de DOS, así que sus botones dibujan eso:
     un cuadrado solo y una cuadrícula de 2×2. Van en el mismo botón que
     el dibujo de computadora y el CSS enseña uno u otro. Enteros sobre
     24, como los otros: 1×1 = lado 20; 2×2 = lado 9 y paso 11, para
     que llegue a los MISMOS bordes (2 a 22) que el cuadrado solo
     (él, 16/09/2026: se veía más grande que los otros). */
  function iconoVistaMovil(n) {
    var s = "", x, y;
    if (n === 1) s = '<rect x="2" y="2" width="20" height="20"/>';
    /* 3×3 en teléfono (él, 17/09/2026: antes 4×4). Lado 6 y paso 9,
       de 0 a 24, los mismos números del icono de computadora. */
    else if (n === 3) { for (y = 0; y < 3; y++) for (x = 0; x < 3; x++)
      s += '<rect x="' + (x * 9) + '" y="' + (y * 9) + '" width="6" height="6"/>'; }
    else for (y = 0; y < 2; y++) for (x = 0; x < 2; x++)
      s += '<rect x="' + (2 + x * 11) + '" y="' + (2 + y * 11) + '" width="9" height="9"/>';
    return '<svg class="vistas__ico--movil" viewBox="0 0 24 24" shape-rendering="crispEdges" ' +
           'aria-hidden="true" focusable="false">' + s + '</svg>';
  }
  window.PA_ICONO_VISTA_MOVIL = iconoVistaMovil;

  /* 18/09/2026 · LOS ICONOS DE VISTA CON ZOOM DE PANTALLA. Todo lo de
     arriba (una unidad = un píxel) solo se cumple con la pantalla al
     100 %. Su computadora va al 125 % (devicePixelRatio 1,25): un
     cuadradito de 6 medía 7,5 píxeles reales y el navegador pintaba
     unos de 7 y otros de 8 — «desproporcionados» otra vez. Además la
     barra caía en medio píxel real.
     Arreglo: con zoom fraccionario, cada icono de cuadraditos se
     REDIBUJA en píxeles reales (lado y paso redondeados UNA vez, así
     todos los huecos salen iguales) y se corre lo que haga falta para
     caer justo en la rejilla de la pantalla. La geometría original se
     guarda en data-* para no redondear sobre lo ya redondeado. */
  /* EL REPARTO DE LOS CUADRADITOS EN PÍXELES REALES (18/09/2026).
     Un icono de n×n que mide T píxeles reales cumple n·L + (n−1)·G = T,
     con L (lado) y G (hueco) ENTEROS: si no, unos cuadraditos salen de
     un píxel más que otros. Con pocos píxeles no hay T que sirva a la vez
     para todas las cuadrículas con la proporción de diseño, así que se
     busca, entre ~20 y ~30 px de pantalla, el T que más se acerque a 24
     px y a la proporción hueco/lado de cada icono (IDEAL), para el juego
     entero a la vez. Probado a 100, 125, 150, 200 y 300 %:
       100 % → 23 px: 3 = 7/1, 4 = 5/1, 5 = 3/2
       125 % → 33 px reales: 3 = 9/3, 4 = 6/3, 5 = 5/2
       teléfono ×3 → 71: 1 = 71, 2 = 32/7, 3 = 19/7 */
  var IDEAL_VISTA = { 2: .22, 3: .33, 4: .3, 5: .3 };
  function repartoVista(n, T) {
    if (n === 1) return { L: T, G: 0, e: 0 };
    var b = null;
    for (var G = 1; G < T; G++) {
      var L = (T - (n - 1) * G) / n;
      if (L < 2 || L % 1 || G > L * .8) continue;
      var e = Math.abs(G / L - IDEAL_VISTA[n]);
      if (!b || e < b.e) b = { L: L, G: G, e: e };
    }
    return b;
  }
  function lienzoPropio(d, n) {
    var tope = Math.floor(24 * d), b = null;
    /* El cuadrado solo (teléfono) mide lo mismo que el de 2×2: antes iba
       fijo a 20 px y se veía más chico que los otros (él, 18/09/2026). */
    if (n === 1) return lienzoPropio(d, 2);
    for (var T = tope; T >= Math.floor(21.5 * d); T--) {
      var m = repartoVista(n, T);
      if (!m) continue;
      var e = m.e + (tope - T) / tope;
      if (!b || e < b.e) b = { T: T, e: e };
    }
    return b ? b.T : tope;
  }
  function lienzoVista(d, juego) {
    var b = null;
    for (var T = Math.ceil(20 * d); T <= Math.floor(30 * d); T++) {
      var e = Math.abs(T / d - 24) / 24, ok = true;
      for (var k = 0; k < juego.length; k++) {
        var m = repartoVista(juego[k], T);
        if (!m) { ok = false; break; }
        e += m.e;
      }
      if (ok && (!b || e < b.e)) b = { T: T, e: e };
    }
    return b ? b.T : Math.round(24 * d);
  }

  function ajustarIconosVista() {
    var d = window.devicePixelRatio || 1;
    $$(".vistas__btn svg").forEach(function (svg) {
      var rs = svg.querySelectorAll("rect");
      if (!rs.length || svg.querySelector("circle")) return;
      /* La lista (rayas + puntos) no es una cuadrícula: solo se recoloca. */
      var esLista = rs[0].getAttribute("width") !== rs[0].getAttribute("height") ||
                    svg.closest("[data-vista='lista'], [data-vista-pt='lista']");
      if (esLista && svg.dataset.hecho !== String(d)) {
        /* Cada rectángulo a píxeles reales (guardando los originales). */
        if (!svg.dataset.orig) svg.dataset.orig = Array.prototype.map.call(rs, function (r) {
          return ["x", "y", "width", "height"].map(function (k) { return r.getAttribute(k); }).join(" ");
        }).join(";");
        /* 18/09/2026 (él) · Punto CUADRADO y raya del MISMO alto que el
           punto, en píxeles reales enteros: redondear cada borde por
           separado dejaba el primer punto más ancho que alto. */
        var TL = Math.round(24 * d), D = Math.round(4 * d),
            PASO = Math.round(8 * d), HX = Math.round(3 * d),
            Y0 = Math.floor((TL - (2 * PASO + D)) / 2), fil;
        svg.innerHTML = "";
        for (fil = 0; fil < 3; fil++) {
          var yy = Y0 + fil * PASO;
          svg.innerHTML += '<rect x="0" y="' + yy + '" width="' + D + '" height="' + D + '"/>' +
                           '<rect x="' + (D + HX) + '" y="' + yy + '" width="' + (TL - D - HX) + '" height="' + D + '"/>';
        }
        svg.setAttribute("viewBox", "0 0 " + TL + " " + TL);
        svg.setAttribute("shape-rendering", "crispEdges");
        svg.style.width = svg.style.height = (TL / d) + "px";
        svg.dataset.hecho = String(d);
      }
      if (esLista) svg.dataset.geo = svg.dataset.geo || "lista";
      if (!svg.dataset.geo) {
        var xs = [], lado = +rs[0].getAttribute("width");
        rs.forEach(function (r) { var x = +r.getAttribute("x"); if (xs.indexOf(x) < 0) xs.push(x); });
        xs.sort(function (a, b) { return a - b; });
        svg.dataset.geo = [xs.length, xs[0], xs.length > 1 ? xs[1] - xs[0] : 0, lado].join(",");
      }
      /* Ya redibujado para este zoom: solo se recoloca (sin tocar el
         DOM, o el vigilante de abajo entraría en bucle). */
      if (svg.dataset.hecho !== String(d)) {
      var n = +svg.dataset.geo.split(",")[0];
      /* 18/09/2026 (él) · TODOS los iconos de cuadrícula de un mismo juego
         miden EXACTAMENTE lo mismo de borde a borde (computadora: 3, 4 y
         5; teléfono: 1, 2 y 3), y dentro de cada uno los cuadraditos y
         los huecos son iguales en píxeles reales. Ver lienzoVista(). */
      /* 18/09/2026 (él, 2.ª vuelta): con un tamaño común para todos
         salían demasiado grandes. Ahora cada icono busca SU tamaño, a
         lo sumo 24 px de pantalla y como mucho ~2 menos, con cuadraditos
         y huecos enteros e iguales. Pueden diferir en un píxel o dos. */
      var T = lienzoPropio(d, n), m = repartoVista(n, T),
          L = m.L, P = m.L + m.G, I = 0, h = "", x, y;
      for (y = 0; y < n; y++) for (x = 0; x < n; x++)
        h += '<rect x="' + (I + x * P) + '" y="' + (I + y * P) + '" width="' + L + '" height="' + L + '"/>';
      svg.innerHTML = h;
      svg.setAttribute("viewBox", "0 0 " + T + " " + T);
      svg.style.width = svg.style.height = (T / d) + "px";
      svg.dataset.hecho = String(d);
      }
      svg.style.transform = "";
      var r = svg.getBoundingClientRect();
      var dx = (Math.round(r.left * d) - r.left * d) / d, dy = (Math.round(r.top * d) - r.top * d) / d;
      if (dx || dy) svg.style.transform = "translate(" + dx + "px," + dy + "px)";
    });
  }
  window.PA_AJUSTAR_ICONOS = ajustarIconosVista;
  if ("MutationObserver" in window) {
    var pendienteIconos = 0;
    new MutationObserver(function () {
      if (pendienteIconos) return;
      pendienteIconos = setTimeout(function () { pendienteIconos = 0; ajustarIconosVista(); }, 30);
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
  window.addEventListener("resize", function () { ajustarIconosVista(); });
  /* La ola de entrada mueve los botones: se recoloca cuando termina. */
  document.addEventListener("animationend", function (ev) {
    if (ev.target.classList && ev.target.classList.contains("vistas__btn")) ajustarIconosVista();
  });

  function barraVistas(actual) {
    var caja = el("div", { class: "vistas", role: "group",
                           "aria-label": t("vista_grupo") });
    VISTAS.forEach(function (v) {
      var b = el("button", {
        type: "button", class: "vistas__btn", "data-vista": v,
        "aria-pressed": v === actual ? "true" : "false",
        title: t("vista_" + v), "aria-label": t("vista_" + v)
      });
      b.innerHTML = iconoVista(v);
      caja.appendChild(b);
    });
    /* EL PUNTO ES UNO SOLO Y VIVE EN LA BARRA, no en cada botón (él,
       15/09/2026): quiere que se DESLICE de un botón a otro al pulsar,
       y una cosa no puede deslizarse de un elemento a otro. Siendo uno
       solo, basta moverle el `transform` y la transición hace el resto. */
    caja.appendChild(el("span", { class: "vistas__punto", "aria-hidden": "true" }));
    return caja;
  }

  /* Coloca el punto sobre el botón puesto. `animar` en false para la
     primera colocación: si no, el punto entraría deslizándose desde el
     borde izquierdo cada vez que se pinta la barra. */
  function moverPunto(animar) {
    var caja = document.querySelector(".vistas");
    if (!caja) return;
    var punto = caja.querySelector(".vistas__punto");
    var b = caja.querySelector('.vistas__btn[aria-pressed="true"]');
    if (!punto || !b) return;
    if (!animar) punto.style.transition = "none";
    punto.style.transform =
      "translateX(" + (b.offsetLeft + b.offsetWidth / 2) + "px) translateX(-50%)";
    if (!animar) {
      void punto.offsetWidth;            /* fuerza el cálculo antes de devolver la transición */
      punto.style.transition = "";
    }
  }

  /* CAMBIAR DE VISTA NO REPINTA NADA. Las tarjetas son idénticas en las
     tres vistas —lo único que cambia es una clase en la cuadrícula—, así
     que basta con eso, y además es lo que permite que el punto se
     deslice: si se rehiciera la barra, el punto nacería ya colocado. */
  function aplicarVista(v) {
    var caja = document.querySelector(".vistas");
    if (caja) {
      Array.prototype.forEach.call(caja.querySelectorAll(".vistas__btn"), function (b) {
        b.setAttribute("aria-pressed",
          b.getAttribute("data-vista") === v ? "true" : "false");
      });
    }
    var r = document.querySelector("#rejilla .rejilla");
    if (r) {
      VISTAS.forEach(function (x) { r.classList.remove("rejilla--" + x); });
      r.classList.add("rejilla--tres");
      if (v !== "tres") r.classList.add("rejilla--" + v);
    }
    moverPunto(true);
  }

  /* ============================================================
     FILTROS DEL CATÁLOGO (15/09/2026, pedido suyo)
     ------------------------------------------------------------
     Cuatro desplegables a la derecha de los botones de vista, que
     son las columnas de la vista de lista MENOS medidas: cada
     pieza mide algo distinto («222 × 97 × 81 cm»), así que ese
     desplegable tendría una opción por pieza y no filtraría nada.

     Esta barra ya existió y la quitó él el 11/08/2026. De aquella
     quedaron a propósito las claves `filtro_*` de textos.js, que
     son las que se reusan aquí. Lo que NO se reusa es la clase
     `.filtros` del CSS: esa es la barra ancha de Herramientas, con
     su borde y sus selects de 11rem, y aquí haría un bloque en vez
     de una línea. Por eso hay clases propias, y Herramientas se
     queda como estaba.

     Los filtros NO se guardan entre visitas, al revés que la vista:
     volver al catálogo y encontrarse media Exhibición escondida sin
     acordarse de por qué es de las cosas que peor sientan.

     La rotación automática de las fotos usa esta MISMA lista —ver
     `rotTurno`—: si no, sortearía piezas que el filtro dejó fuera y
     se pondría a cambiar fotos de tarjetas que no están.
     ============================================================ */
  var CAMPOS_FILTRO = [
    { id: "material", clave: "filtro_madera",  grupo: "material" },
    { id: "acabado",  clave: "filtro_acabado", grupo: "acabado"  },
    { id: "tipo",     clave: "filtro_tipo",    grupo: "tipo"     },
    { id: "anio",     clave: "filtro_anio",    grupo: null       }
  ];
  var filtros = { material: "", acabado: "", tipo: "", anio: "" };

  function valoresDe(w, campo) {
    if (campo === "material") return w.materiales || [];
    if (campo === "acabado")  return w.acabado || [];
    if (campo === "tipo")     return w.tipo ? [w.tipo] : [];
    return w.anio ? [String(w.anio)] : [];
  }

  function etiquetaFiltro(campo, v) {
    var c = CAMPOS_FILTRO.filter(function (x) { return x.id === campo; })[0];
    return c && c.grupo ? etiqueta(c.grupo, v) : String(v);
  }

  function hayFiltro() {
    return CAMPOS_FILTRO.some(function (c) { return filtros[c.id]; });
  }

  function trabajosFiltrados() {
    return trabajosVisibles().filter(function (w) {
      return CAMPOS_FILTRO.every(function (c) {
        if (!filtros[c.id]) return true;
        return valoresDe(w, c.id).indexOf(filtros[c.id]) > -1;
      });
    });
  }

  /* Solo los valores que EXISTEN en el catálogo: un desplegable con
     maderas que no ha usado nunca promete piezas que no hay. */
  function opcionesDe(campo) {
    var vistos = [];
    trabajosVisibles().forEach(function (w) {
      valoresDe(w, campo).forEach(function (v) {
        if (vistos.indexOf(v) === -1) vistos.push(v);
      });
    });
    if (campo === "anio") return vistos.sort(function (a, b) { return b - a; });
    return vistos.sort(function (a, b) {
      return etiquetaFiltro(campo, a).localeCompare(etiquetaFiltro(campo, b), idioma);
    });
  }

  /* EL EMBUDO. Dos dibujos, como en Excel: uno para «se puede
     filtrar» y otro para «hay un filtro puesto», que es el que lleva
     la flechita. (En Excel, de hecho, la flecha sola significa que no
     hay filtro y el embudo que sí lo hay; aquí el embudo está siempre
     y lo que aparece al filtrar es la flecha, que es como él lo pidió.)
     Mismo lienzo de 24 y coordenadas enteras que los demás iconos,
     pero sin `crispEdges`: el embudo es todo diagonales y sin
     suavizado saldría dentado. */
  function iconoEmbudo(activo) {
    var d = activo
      ? '<path d="M2 4 H18 L12 12 V19 L8 17 V12 Z"/>' +
        '<path d="M16 16 H22 L19 21 Z"/>'
      : '<path d="M2 4 H22 L14 13 V21 L10 19 V13 Z"/>';
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + d + '</svg>';
  }

  /* Si el panel está abierto o cerrado. Vive fuera de la función que
     lo pinta porque la barra se rehace entera con cada cambio de
     filtro: sin esto, el panel se cerraría solo al elegir algo. */
  var filtrosAbiertos = false;

  function barraFiltros() {
    var caja = el("div", { class: "filtros-mini" });
    CAMPOS_FILTRO.forEach(function (c) {
      /* CADA DESPLEGABLE LLEVA SU NOMBRE ENCIMA (él, 15/09/2026). Antes
         iba solo en el `aria-label`, que no se ve; con cuatro que dicen
         «Todos» no había forma de saber cuál era cuál. El `for` y el
         `id` los une, así que pulsar el nombre abre su desplegable. */
      var id = "f-" + c.id;
      var sel = el("select", { id: id, "data-campo": c.id });
      sel.appendChild(el("option", { value: "", texto: t("filtro_todos") }));
      opcionesDe(c.id).forEach(function (v) {
        sel.appendChild(el("option", { value: v, texto: etiquetaFiltro(c.id, v) }));
      });
      sel.value = filtros[c.id];
      caja.appendChild(el("div", { class: "filtro-mini" }, [
        el("label", { for: id, texto: t(c.clave) }),
        sel
      ]));
    });
    if (hayFiltro()) {
      caja.appendChild(el("button", { type: "button",
        class: "filtros-mini__limpiar", texto: t("limpiar_filtros") }));
      var cuantas = trabajosFiltrados().length;
      caja.appendChild(el("span", { class: "filtros-mini__conteo",
        texto: cuantas === 1 ? t("conteo_uno") : n("conteo", cuantas) }));
    }

    var boton = el("button", {
      type: "button", class: "filtros-btn", "data-filtros": "1",
      "aria-expanded": filtrosAbiertos ? "true" : "false",
      "aria-controls": "filtros-panel",
      "data-activo": hayFiltro() ? "1" : "0",
      title: t("filtros_boton")
    });
    boton.innerHTML = iconoEmbudo(hayFiltro()) +
                      '<span>' + t("filtros_boton") + '</span>';

    var panel = el("div", { class: "filtros-panel", id: "filtros-panel" }, [caja]);
    if (!filtrosAbiertos) panel.setAttribute("hidden", "hidden");

    return el("div", { class: "filtros-caja", "data-caja": "filtros" }, [boton, panel]);
  }

  /* ============================================================
     ORDENAR (15/09/2026, pedido suyo)
     ------------------------------------------------------------
     Un botón hermano del de filtros, con las MISMAS categorías, más
     ascendente/descendente. Sin orden elegido no toca nada: la
     Exhibición sigue barajada como siempre (ver ordenGuardado).

     Los campos de varios valores —materiales, acabados— se ordenan
     por el PRIMERO ya traducido, que es lo que se lee en la ficha.
     Las piezas sin ese dato van al final en los dos sentidos: un
     hueco no es ni el más pequeño ni el más grande, y ponerlo en
     medio de la lista solo despista.
     ============================================================ */
  var orden = { campo: "", dir: "asc" };
  var ordenAbierto = false;

  function iconoOrdenar() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
             '<path d="M7 3 L12 10 H2 Z"/><path d="M17 21 L22 14 H12 Z"/>' +
           '</svg>';
  }

  function valorOrden(w, campo) {
    if (campo === "anio") return w.anio || 0;
    var v = valoresDe(w, campo);
    if (!v.length) return "";
    return etiquetaFiltro(campo, v[0]).toLowerCase();
  }

  function ordenarLista(lista) {
    if (!orden.campo) return lista;
    var signo = orden.dir === "desc" ? -1 : 1;
    return lista.slice().sort(function (a, b) {
      var x = valorOrden(a, orden.campo), y = valorOrden(b, orden.campo);
      var vacioX = (x === "" || x === 0), vacioY = (y === "" || y === 0);
      if (vacioX && vacioY) return 0;
      if (vacioX) return 1;               /* los huecos, al final */
      if (vacioY) return -1;
      if (typeof x === "number") return (x - y) * signo;
      return x.localeCompare(y, idioma) * signo;
    });
  }

  function barraOrden() {
    var sel = el("select", { id: "orden-campo", "data-orden-campo": "1" });
    sel.appendChild(el("option", { value: "", texto: t("orden_ninguno") }));
    CAMPOS_FILTRO.forEach(function (c) {
      sel.appendChild(el("option", { value: c.id, texto: t(c.clave) }));
    });
    sel.value = orden.campo;

    var dirs = el("div", { class: "orden-dir" });
    [["asc", "orden_asc", "↑"], ["desc", "orden_desc", "↓"]].forEach(function (d) {
      var b = el("button", {
        type: "button", "data-orden-dir": d[0],
        "aria-pressed": orden.dir === d[0] ? "true" : "false",
        texto: d[2] + " " + t(d[1])
      });
      /* Sin campo elegido, el sentido no ordena nada: se apaga para
         no prometer un efecto que no va a pasar. */
      if (!orden.campo) b.setAttribute("disabled", "disabled");
      dirs.appendChild(b);
    });

    var dentro = el("div", { class: "filtros-mini" }, [
      el("div", { class: "filtro-mini" }, [
        el("label", { for: "orden-campo", texto: t("orden_campo") }), sel
      ]),
      dirs
    ]);

    /* El «limpiar» aparece solo cuando hay un orden puesto, igual que
       en el panel de filtros (él, 15/09/2026). */
    if (orden.campo) {
      dentro.appendChild(el("button", {
        type: "button", class: "filtros-mini__limpiar",
        "data-limpiar-orden": "1", texto: t("limpiar_filtros")
      }));
    }

    var boton = el("button", {
      type: "button", class: "filtros-btn", "data-orden": "1",
      "aria-expanded": ordenAbierto ? "true" : "false",
      "aria-controls": "orden-panel",
      "data-activo": orden.campo ? "1" : "0",
      title: t("orden_boton")
    });
    boton.innerHTML = iconoOrdenar() + '<span>' + t("orden_boton") + '</span>';

    var panel = el("div", { class: "filtros-panel", id: "orden-panel" }, [dentro]);
    if (!ordenAbierto) panel.setAttribute("hidden", "hidden");

    return el("div", { class: "filtros-caja", "data-caja": "orden" }, [boton, panel]);
  }

  function abrirOrden(abrir) {
    ordenAbierto = abrir;
    var panel = document.getElementById("orden-panel");
    var boton = document.querySelector("[data-orden]");
    if (panel) {
      if (abrir) panel.removeAttribute("hidden");
      else panel.setAttribute("hidden", "hidden");
    }
    if (boton) boton.setAttribute("aria-expanded", abrir ? "true" : "false");
  }

  document.addEventListener("click", function (e) {
    if (document.body.getAttribute("data-pagina") !== "trabajos") return;
    var bo = e.target.closest && e.target.closest("[data-orden]");
    if (bo) {
      /* Igual que el embudo: el icono de arriba quita el orden. */
      if (e.target.closest("svg")) {
        orden.campo = "";
        orden.dir = "asc";
        pintarRejillaTrabajos();
        return;
      }
      abrirOrden(!ordenAbierto);
      return;
    }
    var d = e.target.closest && e.target.closest("[data-orden-dir]");
    if (d) {
      orden.dir = d.getAttribute("data-orden-dir");
      pintarRejillaTrabajos();
      return;
    }
    /* Va ANTES del clic de fuera: el limpiar está dentro de la caja. */
    if (e.target.closest && e.target.closest("[data-limpiar-orden]")) {
      orden.campo = "";
      orden.dir = "asc";
      pintarRejillaTrabajos();
      return;
    }
    if (ordenAbierto && !(e.target.closest && e.target.closest('[data-caja="orden"]'))) {
      abrirOrden(false);
    }
  });

  document.addEventListener("change", function (e) {
    if (document.body.getAttribute("data-pagina") !== "trabajos") return;
    var s = e.target.closest && e.target.closest("[data-orden-campo]");
    if (!s) return;
    orden.campo = s.value;
    pintarRejillaTrabajos();
    var nuevo = document.getElementById("orden-campo");
    if (nuevo) nuevo.focus();
  });

  /* Abrir y cerrar el panel. No hace falta repintar nada: se enseña o
     se esconde el panel que ya está puesto. */
  function abrirFiltros(abrir) {
    filtrosAbiertos = abrir;
    var panel = document.getElementById("filtros-panel");
    var boton = document.querySelector(".filtros-btn");
    if (panel) {
      if (abrir) panel.removeAttribute("hidden");
      else panel.setAttribute("hidden", "hidden");
    }
    if (boton) boton.setAttribute("aria-expanded", abrir ? "true" : "false");
  }

  document.addEventListener("click", function (e) {
    if (document.body.getAttribute("data-pagina") !== "trabajos") return;
    /* `[data-filtros]` y NO `.filtros-btn`: el botón de ordenar lleva esa
       misma clase para verse igual, así que buscando por clase un clic en
       «Ordenar» abría además el panel de filtros. Pasó de verdad. */
    var bf = e.target.closest && e.target.closest("[data-filtros]");
    if (bf) {
      /* EL ICONO DE ARRIBA LIMPIA (él, 15/09/2026). Solo se ve cuando
         hay algo filtrado, así que pulsarlo siempre significa
         «quítalo»; el resto del botón abre y cierra el panel. El botón
         «Limpiar» de dentro se queda: es el camino que encuentra quien
         navega con teclado, porque el icono va como decoración. */
      if (e.target.closest("svg")) {
        CAMPOS_FILTRO.forEach(function (c) { filtros[c.id] = ""; });
        pintarRejillaTrabajos();
        return;
      }
      abrirFiltros(!filtrosAbiertos);
      return;
    }
    /* Un clic fuera de la caja lo cierra, que es lo que espera
       cualquiera que haya usado un desplegable. */
    /* `[data-caja="filtros"]` y no `.filtros-caja`: la de ordenar usa
       la misma clase, y sin acotarlo un clic allá dejaría este panel
       abierto. */
    if (filtrosAbiertos && !(e.target.closest && e.target.closest('[data-caja="filtros"]'))) {
      abrirFiltros(false);
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (document.body.getAttribute("data-pagina") !== "trabajos") return;
    if (filtrosAbiertos) {
      abrirFiltros(false);
      var b = document.querySelector("[data-filtros]");
      if (b) b.focus();
    }
    if (ordenAbierto) {
      abrirOrden(false);
      var o = document.querySelector("[data-orden]");
      if (o) o.focus();
    }
  });

  /* Un escuchador para los desplegables y otro para el limpiar, los
     dos delegados: la barra se rehace entera en cada repintado. */
  document.addEventListener("change", function (e) {
    var s = e.target.closest && e.target.closest(".filtros-mini select");
    if (!s) return;
    if (document.body.getAttribute("data-pagina") !== "trabajos") return;
    var campo = s.getAttribute("data-campo");
    filtros[campo] = s.value;
    pintarRejillaTrabajos();
    /* El repintado se lleva por delante el desplegable que se acaba de
       usar, y con él el foco del teclado. Se le devuelve al mismo. */
    var nuevo = document.querySelector('.filtros-mini select[data-campo="' + campo + '"]');
    if (nuevo) nuevo.focus();
  });

  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".filtros-mini__limpiar");
    if (!b) return;
    if (document.body.getAttribute("data-pagina") !== "trabajos") return;
    CAMPOS_FILTRO.forEach(function (c) { filtros[c.id] = ""; });
    pintarRejillaTrabajos();
  });

  /* La ola de la barra, solo en la primera pintada de la página
     (él, 16/09/2026). Gemela de `olaBarraPt` en js/prototipos.js. */
  var olaHecha = false;
  function olaBarra(barra) {
    if (olaHecha || !barra) return;
    olaHecha = true;
    [].forEach.call(barra.querySelectorAll(".vistas__btn, .filtros-btn"), function (b, i) {
      b.style.setProperty("--i", i);
    });
    barra.classList.add("catalogo-barra--ola");
  }

  function pintarRejillaTrabajos() {
    var host = $("#rejilla");
    if (!host) return;
    var v = vistaGuardada();
    host.innerHTML = "";

    /* LA BARRA VIVE EN LA PORTADA, en la misma fila que el título
       (él, 15/09/2026), no encima de la cuadrícula. Si ese hueco no
       estuviera —una página que no lo tenga—, cae dentro de #rejilla
       como antes y todo sigue funcionando. */
    var barra = el("div", { class: "catalogo-barra" }, [
      barraVistas(v), barraFiltros(), barraOrden()
    ]);
    var hueco = document.getElementById("barra-catalogo");
    if (hueco) { hueco.innerHTML = ""; hueco.appendChild(barra); }
    else host.appendChild(barra);
    olaBarra(barra);

    /* `ordenarLista` no toca nada si no hay orden elegido, así que la
       Exhibición sigue saliendo barajada como siempre. */
    var lista = ordenarLista(ordenGuardado(trabajosFiltrados()));
    if (!lista.length) {
      host.appendChild(el("p", { class: "vacio", texto: t("sin_resultados") }));
      return;
    }
    var r = rejilla(lista, tarjetaTrabajo);
    r.classList.add("rejilla--tres");
    if (v !== "tres") r.classList.add("rejilla--" + v);
    host.appendChild(r);
    revelar(host, ".tarjeta", 45);
    moverPunto(false);
    /* Todas las fotos de todas las piezas, en el orden en que salen. */
    window.PA_PRECARGA(lista.map(function (w) {
      var f = fotosDe(w);
      return f.length ? f : (w.imagen ? [w.imagen] : []);
    }), barra);
  }

  /* Un solo escuchador para toda la página, como el de las flechas. */
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".vistas__btn");
    if (!b) return;
    /* Prototipos tiene su propia barra con las MISMAS clases, pintada
       por js/prototipos.js. Sin este candado, un clic allá escribiría
       además la vista de Exhibición. */
    if (document.body.getAttribute("data-pagina") !== "trabajos") return;
    var v = b.getAttribute("data-vista");
    if (VISTAS.indexOf(v) === -1 || v === vistaActual) return;
    vistaActual = v;
    aplicarVista(v);
  });

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

    /* Esta pieza queda FUERA del sorteo automático de aquí abajo, y se
       queda fuera hasta que él toque las flechas de otra. */
    rotManual = slug;

    var i = (fotoTarjeta[slug] || 0) + parseInt(b.getAttribute("data-paso"), 10);
    if (i < 0) i = fotos.length - 1;
    if (i >= fotos.length) i = 0;
    fotoTarjeta[slug] = i;

    var img = tarjeta.querySelector(".tarjeta__marco img");
    if (img) cambiarFoto(img, fotos[i]);
    marcarPuntos(tarjeta.querySelector(".tarjeta__cuenta"), i);
    volverALaPrimera(slug);
  });

  /* VUELTA A LA PRIMERA FOTO (él, 16/09/2026): 20 s después del último
     cambio a mano, la carta regresa sola a su foto 1. Cada cambio nuevo
     reinicia la cuenta de esa pieza. */
  var ESPERA_VUELTA = 20000;
  var relojVuelta = {};
  function volverALaPrimera(slug) {
    clearTimeout(relojVuelta[slug]);
    if (!fotoTarjeta[slug]) return;
    relojVuelta[slug] = setTimeout(function () {
      delete relojVuelta[slug];
      var w = (window.TRABAJOS || []).filter(function (x) { return x.slug === slug; })[0];
      var t = document.querySelector('.tarjeta[data-slug="' + slug + '"]');
      fotoTarjeta[slug] = 0;
      if (!w || !t) return;
      var img = t.querySelector(".tarjeta__marco img");
      if (img) cambiarFoto(img, fotosDe(w)[0]);
      marcarPuntos(t.querySelector(".tarjeta__cuenta"), 0);
    }, ESPERA_VUELTA);
  }

  /* ============================================================
     LA CUADRÍCULA SE MUEVE SOLA (15/09/2026, pedido suyo)
     ------------------------------------------------------------
     Cada 6 segundos se sortea UNA pieza de la cuadrícula y se le
     cambia la foto por otra suya al azar. El primer turno es a los
     8 segundos de abrir la página.

     Tres reglas suyas, y las tres importan:
     1. En el MISMO turno en que cambia la nueva, la que cambió el
        turno pasado vuelve a su primera foto. Nunca hay dos piezas
        movidas a la vez.
     2. La pieza que él pasó A MANO con las flechas no entra en el
        sorteo, y sigue sin entrar hasta que toque las de otra. Se
        queda en la foto que él dejó: no se le devuelve nada.
     3. Da igual que la pieza sorteada esté fuera de la pantalla;
        no se mira si se ve o no.

     Con `prefers-reduced-motion` no arranca: una foto que se cambia
     sola es movimiento no pedido, y ese ajuste existe justo para eso.
     En Prototipos hay un gemelo de esto en js/prototipos.js; si se
     toca una regla, tocar las dos.
     ============================================================ */
  var ROT_ESPERA = 8000;   /* del primer turno */
  var ROT_CADA   = 6000;
  var rotManual = null;    /* la que él tocó a mano */
  var rotAuto   = null;    /* la que cambió el turno pasado */
  var rotTimer  = null;

  /* Se consulta el DOM en CADA turno y no se guardan los nodos: la
     cuadrícula se repinta entera al cambiar de idioma, y unos nodos
     guardados apuntarían a tarjetas que ya no están en la página. */
  function rotPonerFoto(slug, i) {
    var w = (window.TRABAJOS || []).filter(function (x) { return x.slug === slug; })[0];
    if (!w) return;
    var fotos = fotosDe(w);
    if (i >= fotos.length) return;
    var tarjeta = document.querySelector('#rejilla .tarjeta[data-slug="' + slug + '"]');
    if (!tarjeta) return;
    fotoTarjeta[slug] = i;
    var img = tarjeta.querySelector(".tarjeta__marco img");
    if (img) cambiarFoto(img, fotos[i]);
    marcarPuntos(tarjeta.querySelector(".tarjeta__cuenta"), i);
  }

  function rotTurno() {
    /* `trabajosFiltrados` y no `trabajosVisibles`: con un filtro puesto,
       las piezas escondidas no tienen tarjeta donde cambiar la foto. */
    var candidatas = trabajosFiltrados().filter(function (w) {
      return fotosDe(w).length > 1 && w.slug !== rotManual && w.slug !== rotAuto;
    });
    var elegida = candidatas.length
      ? candidatas[Math.floor(Math.random() * candidatas.length)]
      : null;

    /* El regreso de la anterior y el cambio de la nueva van en el
       mismo turno, que es lo que él pidió: «en simultáneo». */
    if (rotAuto) rotPonerFoto(rotAuto, 0);
    rotAuto = null;
    if (!elegida) return;

    /* Al azar, pero nunca la que ya se está viendo. */
    var fotos = fotosDe(elegida);
    var actual = fotoTarjeta[elegida.slug] || 0;
    var otras = [];
    for (var k = 0; k < fotos.length; k++) { if (k !== actual) otras.push(k); }
    if (!otras.length) return;
    rotPonerFoto(elegida.slug, otras[Math.floor(Math.random() * otras.length)]);
    rotAuto = elegida.slug;
  }

  /* El guardia del temporizador hace falta de verdad: la cuadrícula
     se vuelve a pintar con cada cambio de idioma, y sin él quedarían
     dos o tres relojes corriendo a la vez. */
  /* APAGADO el 16/09/2026 (él): las cuadrículas ya no cambian fotos
     solas. El código se queda por si vuelve; basta poner esto en true. */
  var ROT_ENCENDIDA = false;
  function arrancarRotacion() {
    if (!ROT_ENCENDIDA || rotTimer || menosMovimiento) return;
    rotTimer = setTimeout(function () {
      rotTurno();
      rotTimer = setInterval(rotTurno, ROT_CADA);
    }, ROT_ESPERA);
  }

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
    /* En el orden del archivo. El catálogo de Exhibición lo baraja en
       cada carga (ver barajar / ordenGuardado, junto a paginas.trabajos);
       la lista fija ORDEN_TRABAJOS de la prueba del 14/09 ya no existe. */
    return window.TRABAJOS.filter(function (w) { return w.publicado || verBorradores; });
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
    /* 17/09/2026 · La diapositiva es la BIENVENIDA escrita en
       novedades.html (él): textos en data-es/data-en y de fondo el
       carrusel de El taller. El de novedades solo se monta si esa
       bienvenida no está. */
    if ($(".bienvenida")) {
      $$(".bienvenida [data-es]").forEach(function (e) {
        e.innerHTML = idioma === "es" ? e.getAttribute("data-es") : e.getAttribute("data-en");
      });
      iniciarCarruselIntro();
    } else {
      montarCarrusel($("#carrusel"), novedades);
    }

    /* Reproductor del video largo, con su texto al lado */
    var conVideo = novedades.filter(function (w) { return w.video; })[0];
    var hostVideo = $("#video-novedad");
    if (hostVideo && conVideo) {
      var como = tx(conVideo.como) || [];
      /* 15/09/2026 · Si la pieza no trae «cómo está hecha» (el Rolo lo
         perdió a pedido suyo), va el resumen, para que el bloque no
         quede solo con el título y el botón. */
      if (!como.length && tx(conVideo.resumen)) como = [tx(conVideo.resumen)];
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
  /* ORDEN ALEATORIO DE LA EXHIBICIÓN (él, 14/09/2026): «con cada
     refrescar de la página, que se reorganicen». Se baraja UNA vez por
     carga de trabajos.html —cambiar de idioma repinta, pero no vuelve a
     barajar— y el orden se guarda en sessionStorage para que las
     flechas de la ficha (navegarPiezas) recorran las piezas en el mismo
     orden en que se vieron. Solo el catálogo: la portada y Novedades
     siguen en el orden del archivo. */
  var CLAVE_ORDEN = "orden-exhibicion";
  var ordenDeEstaCarga = null;

  function barajar(lista) {           /* Fisher-Yates: todos los órdenes igual de probables */
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var x = a[i]; a[i] = a[j]; a[j] = x;
    }
    return a;
  }
  function ordenGuardado(lista) {
    var o = null;
    try { o = JSON.parse(sessionStorage.getItem(CLAVE_ORDEN) || "null"); } catch (e) { /* modo privado */ }
    if (!o || !o.length) return lista;
    function pos(w) { var i = o.indexOf(w.slug); return i === -1 ? o.length : i; }
    return lista.slice().sort(function (a, b) { return pos(a) - pos(b); });
  }

  /* VOLVER A LA EXHIBICIÓN COMO SE DEJÓ (él, 18/09/2026): al abrir una
     pieza se apuntan la vista puesta y hasta dónde se había bajado. Al
     volver —con el gesto de atrás, con el botón del navegador o con
     «volver» de la ficha— la cuadrícula sale en el MISMO orden, la misma
     vista y a la misma altura, en vez de barajarse otra vez desde
     arriba. La nota se borra al usarla o al pasar por otra página. */
  var CLAVE_VOLVER = "exh-volver";
  document.addEventListener("click", function (e) {
    if (document.body.getAttribute("data-pagina") !== "trabajos") return;
    var a = e.target.closest && e.target.closest("#rejilla a[href^='trabajo.html']");
    if (!a) return;
    try { sessionStorage.setItem(CLAVE_VOLVER, JSON.stringify({ vista: vistaActual, y: window.scrollY })); } catch (x) {}
  });

  paginas.trabajos = function () {
    $("#titulo").textContent = t("trabajos_titulo");
    $("#bajada").textContent = t("trabajos_bajada");

    var vuelta = null;
    try { vuelta = JSON.parse(sessionStorage.getItem(CLAVE_VOLVER) || "null"); } catch (x) {}
    if (vuelta && !ordenDeEstaCarga) {
      try { sessionStorage.removeItem(CLAVE_VOLVER); } catch (x) {}
      var guardado = null;
      try { guardado = JSON.parse(sessionStorage.getItem(CLAVE_ORDEN) || "null"); } catch (x) {}
      if (guardado && guardado.length) ordenDeEstaCarga = guardado;   /* el mismo orden: no se baraja */
      if (vuelta.vista && VISTAS.indexOf(vuelta.vista) !== -1) vistaActual = vuelta.vista;
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      /* Varios intentos: la cuadrícula crece mientras entran las
         tarjetas y un solo salto temprano se queda corto. */
      [60, 250, 600, 1200].forEach(function (ms) {
        setTimeout(function () {
          if (Math.abs(window.scrollY - (vuelta.y || 0)) > 4)
            window.scrollTo({ top: vuelta.y || 0, behavior: "instant" });   /* sin el deslizamiento suave */
        }, ms);
      });
    }

    if (!ordenDeEstaCarga) {
      ordenDeEstaCarga = barajar(trabajosVisibles()).map(function (w) { return w.slug; });
      try { sessionStorage.setItem(CLAVE_ORDEN, JSON.stringify(ordenDeEstaCarga)); } catch (e) { /* modo privado */ }
    }

    /* La cuadrícula y su barra de vistas las pinta `pintarRejillaTrabajos`,
       que es la misma función que corre al pulsar uno de los tres botones. */
    pintarRejillaTrabajos();
    arrancarRotacion();
  };

  /* Los tres botones de la cabecera de una ficha: anterior, volver
     al catálogo, siguiente.

     Recorre la MISMA lista que la cuadrícula, así que el orden de
     aquí y el de allá no se pueden desincronizar. Da la vuelta en
     los extremos: de la última se pasa a la primera.

     Si la pieza que se está viendo no está en la lista —se llegó
     por un enlace directo a algo sin publicar, con ?borradores=1—
     no hay anterior ni siguiente, y queda solo el del medio. */
  /* Triángulos EQUILÁTEROS para pasar de pieza (él, 16/09/2026), en
     lugar de las flechas ← →. Lado 20, altura ≈ 17,3. */
  var TRIANGULO_NAV = {
    "←": '<svg viewBox="0 0 18 20" focusable="false"><path d="M0.7 10 18 0v20z"/></svg>',
    "→": '<svg viewBox="0 0 18 20" focusable="false"><path d="M17.3 10 0 0v20z"/></svg>'
  };

  function navegarPiezas(w) {
    /* En el orden barajado que se vio en el catálogo (ordenGuardado).
       Si se llegó sin pasar por él —enlace directo—, en el del archivo. */
    var lista = ordenGuardado(trabajosVisibles());
    var i = -1;
    for (var k = 0; k < lista.length; k++) {
      if (lista[k].slug === w.slug) { i = k; break; }
    }

    var volver = el("a", {
      class: "volver navpieza__volver", href: "trabajos.html",
      texto: t("ficha_volver")
    });
    /* «Volver» hace lo mismo que el gesto de atrás si se llegó desde el
       catálogo, para no dejar la ficha apilada detrás. */
    volver.addEventListener("click", function (e) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey) return;
      if (/trabajos\.html/.test(document.referrer)) { e.preventDefault(); history.back(); }
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
        el("span", { class: "navpieza__tri", "aria-hidden": "true", html: TRIANGULO_NAV[flecha] })
      ]);

      /* Se deja una marca para que la página que viene entre con
         la animación CORTA (él, 14/08/2026): saltando de una pieza
         a otra, ver la cascada entera cada vez cansa. Cuando se
         llega desde la cuadrícula sí va completa.

         Va en sessionStorage y no en la dirección: así el enlace
         que él copie y mande sigue siendo limpio, y la marca no
         sobrevive a cerrar la pestaña. La lee y la borra
         js/escaner.js. */
      a.addEventListener("click", function (e) {
        try { sessionStorage.setItem("pt-salto-pieza", "1"); } catch (x) { /* modo privado */ }
        /* REEMPLAZA en el historial en vez de apilar (él, 18/09/2026):
           así, pasando por diez piezas con las flechas, el gesto de
           atrás lleva de una vez a la cuadrícula y no pieza por pieza. */
        if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
          e.preventDefault();
          location.replace(a.getAttribute("href"));
        }
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
    document.title = tx(w.titulo) + " — prototipo ago";
    precargar(fotosDe(w));

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
    /* 15/09/2026 · Aquí iba el aviso «Video pendiente» en toda pieza con una
       sola foto y sin video. Él pidió dejar de mostrarlo en todo el sitio.
       El texto sigue en TEXTOS.video_pendiente por si se quiere reponer. */

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

    /* El título va en su propia caja (él, 16/09/2026): en teléfono sale
       JUSTO ENCIMA de las fotos; en computadora sigue a la derecha,
       encima de los datos. Lo reparte la rejilla de .ficha. */
    var titulo = el("div", { class: "ficha__titulo" }, [el("h1", { texto: tx(w.titulo) })]);
    var datos = el("div", { class: "ficha__datos" });

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
    /* Acabados separados por coma y, del segundo en adelante, con la
       primera letra en minúscula: «Pintura, poliuretano» (él, 15/09/2026).
       Solo la primera letra, para no bajar «Rubio Monocoat». */
    if ((w.acabado || []).length)    filas.push([t("ficha_acabado"), w.acabado.map(function (a, i) {
      var e = etiqueta("acabado", a);
      return i ? e.charAt(0).toLowerCase() + e.slice(1) : e;
    }).join(", ")]);
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
      /* Solo la pregunta, sin negrita, y el botón (él, 16/09/2026). La
         frase de debajo («No repito una pieza igual…») salió; su clave
         `ficha_similar_t` sigue en textos.js. */
      el("h3", { style: "font-weight:400;margin-bottom:1rem", texto: t("ficha_similar") }),
      /* «Contáctame» con la flecha ↗ de los botones de Contacto (él,
         16/09/2026). */
      el("a", { class: "boton boton--flecha", href: enlaceWhatsApp(tx(w.titulo)), target: "_blank", rel: "noopener" }, [
        document.createTextNode(t("ficha_escribir")),
        el("span", { class: "boton__flecha", "aria-hidden": "true", html: "&#8599;" })
      ])
    ]));

    host.appendChild(el("div", { class: "ficha ficha--titulo" }, [navPiezas, titulo, medios, datos]));
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
    document.title = tx(p.nombre) + " — prototipo ago";

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

  /* CARRUSEL DE LA INTRO DE EL TALLER (14/09/2026, pedido suyo): una
     foto cada 4 s, con fundido (el CSS, .carrusel-intro). Solo la
     primera trae src; las demás esperan en data-src y se cargan de UNA
     en una, la siguiente mientras se ve la actual, así nadie baja las
     11 de golpe. Si la siguiente aún no llegó, se espera al próximo
     turno en vez de fundir a un hueco. Con la pestaña oculta no avanza,
     y con «reducir movimiento» se queda en la primera.
     Arranca UNA sola vez: paginas.taller se vuelve a llamar al cambiar
     de idioma y sin el candado se acumularían relojes. */
  var carruselIniciado = false;
  function iniciarCarruselIntro() {
    if (carruselIniciado) return;
    var caja = $(".carrusel-intro");
    if (!caja) return;
    carruselIniciado = true;
    var fotos = $$("img", caja);
    if (fotos.length < 2 || menosMovimiento) return;

    /* «Lista» = el navegador avisó que la bajó (evento load), NO
       naturalWidth > 0: con srcset, naturalWidth se divide por la
       densidad que sale de `sizes`, y en una ventana de 0 px de ancho
       (el panel de pruebas oculto) daba 0 aunque la foto estuviera
       entera — el carrusel se quedaba parado para siempre. El oyente
       se pone ANTES de ponerFoto para no perderse el load. */
    function cargar(img) {
      var src = img.getAttribute("data-src");
      if (!src || img.getAttribute("src")) return;
      img.addEventListener("load", function () { img.setAttribute("data-lista", "1"); });
      ponerFoto(img, src);
    }
    fotos[0].setAttribute("data-lista", "1");   /* la primera ya viene en el HTML */
    function lista(img) { return img.getAttribute("data-lista") === "1"; }

    var i = 0;
    cargar(fotos[1]);
    setInterval(function () {
      if (document.hidden) return;
      var sig = (i + 1) % fotos.length;
      if (!lista(fotos[sig])) { cargar(fotos[sig]); return; }
      fotos[i].classList.remove("activa");
      fotos[sig].classList.add("activa");
      i = sig;
      cargar(fotos[(i + 1) % fotos.length]);
    }, 4000);
  }

  paginas.taller = function () {
    $("#titulo").textContent = t("sobre_titulo");
    $$("[data-es]").forEach(function (e) {
      e.innerHTML = idioma === "es" ? e.getAttribute("data-es") : e.getAttribute("data-en");
    });
    iniciarCarruselIntro();
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

    var chat = el("button", { class: "contactos__chatbot", type: "button" }, [
      el("span", { class: "contactos__icono", html: '<svg viewBox="0 0 24 24" class="icono-linea" aria-hidden="true"><path d="M12 3v3m-2-3h4M5 7h14v12H9l-4 3V7Z"/><path d="M8 11v2m8-2v2m-7 3h6"/></svg>' }),
      el("span", { class: "contactos__texto" }, [
        el("span", { class: "rotulo", texto: "Chatbot" }),
        el("strong", { texto: es ? "Asistente virtual" : "Virtual assistant" }),
        el("span", { class: "contactos__accion", texto: es ? "Consulta sobre las piezas y explora la página" : "Ask about the pieces and explore the website" })
      ])
    ]);
    chat.addEventListener("click", function () { window.dispatchEvent(new Event("chatbot-open")); });
    host.appendChild(chat);

    tarjetas.forEach(function (c) {
      host.appendChild(el("a", { href: c[3], target: "_blank", rel: "noopener" }, [
        el("span", { class: "contactos__icono", html: ICONOS[c[0]] }),
        el("span", { class: "contactos__texto" }, [
          el("span", { class: "rotulo", texto: c[1] }),
          el("strong", { texto: c[2] }),
          el("span", { class: "contactos__accion", texto: c[4] })
        ]),
        /* 17/09/2026 · Aquí iba la flechita ↗ de la esquina. Fuera:
           con la tarjeta más angosta se le montaba encima al texto. */
      ]));
    });

    revelar(host, "a", 80);
  };

  /* ---------- arranque ------------------------------------ */

  /* 2026-09-16 · Aquí estuvo el «descifrado» estilo Matrix de títulos
     y bajadas. Lo probó y lo quitó el mismo día: los títulos entran con
     el mismo fade que el resto (js/escaner.js). */

  function pintar() {
    document.documentElement.lang = idioma;
    iniciarObservador();
    pintarCabecera();
    vigilarCabecera();
    pintarPie();
    var cual = document.body.getAttribute("data-pagina");
    if (cual !== "trabajos" && cual !== "trabajo") {
      try { sessionStorage.removeItem("exh-volver"); } catch (x) {}
    }
    if (paginas[cual]) paginas[cual]();
    if (verBorradores) document.body.classList.add("con-borradores");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", pintar);
  } else {
    pintar();
  }
})();
