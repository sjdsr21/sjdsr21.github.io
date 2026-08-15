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
    idioma = (navigator.language || "es").slice(0, 2) === "en" ? "en" : "es";
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

  function el(tag, props, hijos) {
    var e = document.createElement(tag);
    for (var k in (props || {})) {
      if (k === "class") e.className = props[k];
      else if (k === "html") e.innerHTML = props[k];
      else if (k === "texto") e.textContent = props[k];
      else if (props[k] !== null && props[k] !== undefined) e.setAttribute(k, props[k]);
    }
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

  /* Portada de un video: video/algo.mp4 -> img/trabajos/algo-portada.jpg
     Se generan con capturar-portada-video.html. Teniéndola, el
     navegador enseña esa imagen y NO descarga el video hasta que
     le dan al play: la portada pasó de bajar 15 MB a bajar 45 KB. */
  function portadaDe(rutaVideo) {
    if (!rutaVideo) return null;
    var nombre = rutaVideo.split("/").pop().replace(/\.mp4$/i, "");
    return "img/trabajos/" + nombre + "-portada.jpg";
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
      /* fuera lo anterior, pero se dejan las flechas */
      $$("img, video, .visor3d", principal).forEach(function (n) { n.remove(); });
      principal.insertBefore(nodoGrande(lista[actual]), principal.firstChild);
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
    lupa:     '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.4 15.4 21 21" stroke-linecap="round"/></svg>'
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

  function abrirBuscador() {
    if (!cajaBuscador) cajaBuscador = construirBuscador();
    cajaBuscador.classList.add("abierto");
    var campo = $("input", cajaBuscador);
    campo.value = "";
    $(".buscador__lista", cajaBuscador).innerHTML =
      '<p class="buscador__vacio">' + t("buscar_ayuda") + "</p>";
    setTimeout(function () { campo.focus(); }, 60);
  }

  function cerrarBuscador() {
    if (cajaBuscador) cajaBuscador.classList.remove("abierto");
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
  function vigilarCabecera() {
    var cab = $("#cabecera");
    if (!cab || cabeceraVigilada) return;
    cabeceraVigilada = true;
    function alScroll() {
      cab.classList.toggle("encogida", window.scrollY > 40);
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
  /* [clave del nombre, archivo, clave de la palabra de encima].
     La tercera solo se pinta cuando esa sección es la abierta. */
  var MENU = [
    ["nav_prototipos",   "index.html",      "nav_pre_prototipos"],
    ["nav_trabajos",     "trabajos.html",   "nav_pre_trabajos"],
    ["nav_novedades",    "novedades.html",  "nav_pre_novedades"],
    ["nav_sobre",        "taller.html",     "nav_pre_sobre"],
    ["nav_contacto",     "contacto.html",   "nav_pre_contacto"]
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

    var menu = el("nav", { class: "menu", id: "menu" },
      MENU.filter(function (m) { return !vacias[m[1]]; })
          .map(function (m) {
            var activa = m[1] === aqui;
            var a = el("a", {
              href: m[1],
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

    var botones = IDIOMAS.map(function (i) {
      var b = el("button", { type: "button", texto: i.toUpperCase(), "aria-pressed": i === idioma });
      b.addEventListener("click", function () { ponerIdioma(i); });
      return b;
    });

    /* Conmutador de tema, hermano del de idioma. Sol y luna: no
       hay que traducirlos. La etiqueta hablada si va traducida. */
    var ETIQUETA_TEMA = {
      oscuro: { es: "Modo oscuro", en: "Dark mode" },
      claro:  { es: "Modo claro",  en: "Light mode" },
      auto:   { es: "Automático, según tu sistema",
                en: "Automatic, follows your system" }
    };
    /* El tercero dice "auto" con letras: un glifo no explicaría
       que sigue la configuración del ordenador. */
    var GLIFO_TEMA = { oscuro: "◑", claro: "○", auto: "auto" };
    var botonesTema = TEMAS.map(function (m) {
      var b = el("button", {
        type: "button", texto: GLIFO_TEMA[m],
        class: m === "auto" ? "tema__auto" : null,
        title: ETIQUETA_TEMA[m][idioma], "aria-label": ETIQUETA_TEMA[m][idioma],
        "aria-pressed": m === tema
      });
      b.dataset.tema = m;
      b.addEventListener("click", function () { ponerTema(m); });
      return b;
    });

    var hamb = el("button", { class: "hamburguesa", type: "button", "aria-label": "Menú", html: "&#9776;" });
    hamb.addEventListener("click", function () { menu.classList.toggle("abierto"); });

    var lupa = el("button", { class: "lupa", type: "button",
      "aria-label": t("buscar"), html: ICONOS.lupa });
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
        el("img", { class: "marca__perfil", src: "img/marca/perfil.png", alt: "" })
      ]),
      hamb,
      menu,
      lupa,
      /* Idioma y tema van dentro de UNA caja. Sueltos eran dos items
         del flex y en móvil la fila los partía en renglones
         distintos: el idioma acababa abajo con el menú y el tema
         arriba con la lupa. Agrupados no se separan nunca. */
      el("div", { class: "controles" }, [
        el("div", { class: "idioma" }, botones),
        el("div", { class: "tema" }, botonesTema)
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
    return el("a", { class: "tarjeta", href: "trabajo.html?id=" + w.slug }, [
      marcoImagen(w.imagen, false, !w.publicado, alt),
      el("h3", { texto: tx(w.titulo) })
    ]);
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
    var datos = el("div", { class: "ficha__datos" }, [
      navegarPiezas(w),
      el("h1", { texto: tx(w.titulo) })
    ]);

    if (tx(w.resumen)) datos.appendChild(el("p", { class: "bajada", texto: tx(w.resumen) }));

    var filas = [];
    if (w.anio)   filas.push([t("ficha_ano"), w.anio + (w.anio_estimado ? " (?)" : "")]);
    if (w.tipo)   filas.push([t("ficha_tipo"), etiqueta("tipo", w.tipo)]);
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
      datos.appendChild(el("ul", { class: "lista-como" }, como.map(function (c) {
        return el("li", { texto: c });
      })));
    }

    datos.appendChild(el("div", { style: "margin-top:2.6rem;border-top:1px solid var(--linea);padding-top:1.6rem" }, [
      el("h3", { texto: t("ficha_similar") }),
      el("p", { class: "bajada", style: "margin-bottom:1.2rem", texto: t("ficha_similar_t") }),
      el("a", { class: "boton", href: enlaceWhatsApp(tx(w.titulo)), target: "_blank", rel: "noopener", texto: t("ficha_escribir") })
    ]));

    host.appendChild(el("div", { class: "ficha" }, [medios, datos]));
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
        im.addEventListener("click", function () { $("#img-grande").src = src; });
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

    host.appendChild(el("div", { class: "ficha" }, [medios, datos]));
    revelar(host, ".ficha__medios, .ficha__datos", 120);
  };

  paginas.taller = function () {
    $("#titulo").textContent = t("sobre_titulo");
    $$("[data-es]").forEach(function (e) {
      e.innerHTML = idioma === "es" ? e.getAttribute("data-es") : e.getAttribute("data-en");
    });
    revelar(document, ".intro-taller > *", 130);
    $$(".seccion").forEach(function (s) {
      revelar(s, "h2, .pasos li, .dos-columnas > div, .lista-marcas li, .prosa", 70);
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
