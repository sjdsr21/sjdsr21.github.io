/* ============================================================
   PROTOTIPOS — catálogo, configurador y pedido
   ------------------------------------------------------------
   Vive aparte de js/sitio.js a propósito: aquél pinta el sitio
   entero y no tiene estado; éste sí lo tiene (el carrito) y solo
   corre en prototipos.html.

   Lo único que los une es el aviso "idioma-cambiado" que dispara
   ponerIdioma() en sitio.js.
   ============================================================ */
(function () {
  "use strict";

  if (!document.getElementById("pt-stock")) return;   /* no es esta página */

  /* ---------- idioma ---------------------------------------- */
  var idioma = localStorage.getItem("idioma");
  if (idioma !== "es" && idioma !== "en") {
    idioma = (navigator.language || "es").slice(0, 2) === "en" ? "en" : "es";
  }
  window.addEventListener("idioma-cambiado", function (e) {
    idioma = e.detail;
    pintarTodo();
  });

  function t(clave) {
    var e = window.TEXTOS[clave];
    return e ? (e[idioma] || e.es) : "«" + clave + "»";
  }
  function tx(obj) {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    return obj[idioma] || obj.es || "";
  }
  /* t() con reemplazos: rellena("pt_hay", {n: 3}) */
  function rellena(clave, vals) {
    var s = t(clave);
    for (var k in vals) s = s.split("{" + k + "}").join(vals[k]);
    return s;
  }

  var $ = function (s, r) { return (r || document).querySelector(s); };

  /* ---------- dinero ---------------------------------------- */
  /* REGLA QUE NO SE TOCA: los bolívares salen por REF, nunca por
     USD × BCV. Ver el comentario largo en datos/envios.js. */
  function aRef(usd) { return usd / window.TASAS.relacion_efectiva; }
  function aBs(usd)  { return aRef(usd) * window.TASAS.bcv; }

  function dolar(v) {
    return "$" + (Math.round(v * 100) / 100).toLocaleString("en-US");
  }
  function bolivar(v) {
    return "Bs " + v.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* ---------- lectura de un producto ------------------------ */
  function visibles() {
    var borradores = new URLSearchParams(location.search).get("borradores") === "1";
    return window.PROTOTIPOS.filter(function (p) { return p.publicado || borradores; });
  }
  function claveMatriz(p, o) {
    return p.opciones.map(function (g) { return o[g.id]; }).join("|");
  }
  function precioUnidad(p, o) {
    if (p.matriz) return p.matriz[claveMatriz(p, o)] || 0;
    var base = p.precio_usd || 0;
    (p.opciones || []).forEach(function (g) {
      var v = g.valores.filter(function (v) { return v.id === o[g.id]; })[0];
      if (!v) return;
      /* "precio" pisa el base (los packs); "delta" lo mueve */
      if (v.precio != null) base = v.precio;
      else if (v.delta) base += v.delta;
    });
    return base;
  }
  function stockDe(p, o) {
    if (p.disponibilidad !== "stock") return null;
    if (p.stock_matriz) return p.stock_matriz[claveMatriz(p, o)] || 0;
    var g = (p.opciones || [])[0];
    if (!g) return 0;
    var v = g.valores.filter(function (v) { return v.id === o[g.id]; })[0];
    return v ? (v.stock || 0) : 0;
  }
  function stockTotal(p) {
    if (p.disponibilidad !== "stock") return null;
    if (p.stock_matriz) {
      return Object.keys(p.stock_matriz).reduce(function (a, k) { return a + p.stock_matriz[k]; }, 0);
    }
    return (p.opciones || [])[0].valores.reduce(function (a, v) { return a + (v.stock || 0); }, 0);
  }
  function pesoDe(p, o) {
    if (p.peso_por) return p.peso_por[o.tamano] || 1;
    if (p.peso_por_pack) return p.peso_por_pack[o.pack] || 1;
    return p.peso || 1;
  }
  function unidadesPorPack(p, o) {
    var g = (p.opciones || []).filter(function (g) { return g.id === "pack"; })[0];
    if (g) {
      var v = g.valores.filter(function (v) { return v.id === o.pack; })[0];
      return v ? v.unidades : 1;
    }
    return p.pack || 1;
  }
  function opcionesPorDefecto(p) {
    var o = {};
    (p.opciones || []).forEach(function (g) { o[g.id] = g.valores[0].id; });
    return o;
  }
  function etiquetaOpciones(p, o) {
    return (p.opciones || []).map(function (g) {
      var v = g.valores.filter(function (v) { return v.id === o[g.id]; })[0];
      return v ? tx(v.etiqueta) : "";
    }).filter(Boolean).join(" · ");
  }
  function precioDesde(p) {
    if (p.matriz) {
      return Math.min.apply(null, Object.keys(p.matriz).map(function (k) { return p.matriz[k]; }));
    }
    return precioUnidad(p, opcionesPorDefecto(p));
  }
  function tieneVariosPrecios(p) {
    if (p.matriz) return true;
    return (p.opciones || []).some(function (g) {
      return g.valores.some(function (v) { return v.delta || v.precio != null; });
    });
  }

  /* ============================================================
     CATÁLOGO
     ============================================================ */
  function fichaHTML(p) {
    var est, clase;
    if (p.disponibilidad === "stock") {
      var n = stockTotal(p);
      /* El texto es el mismo haya 1 o haya 9: lo que avisa de que
         queda poco es el color, no la palabra. */
      var cuantos = n === 1 ? t("pt_hay_uno") : rellena("pt_hay", {n: n});
      if (n === 0)      { est = t("pt_agotado"); clase = ""; }
      else if (n <= 2)  { est = cuantos;         clase = " pt-estado--poco"; }
      else              { est = cuantos;         clase = " pt-estado--hay"; }
    } else {
      est = rellena("pt_semanas", {n: p.plazo_semanas});
      clase = " pt-estado--pedido";
    }

    /* Si hay foto, va la foto; si no, el recuadro rayado. El
       rayado NO es un error de carga: es el hueco a propósito
       mientras no haya fotos de esa pieza. */
    /* `sin_fondo` marca los PNG recortados: esos se muestran
       ENTEROS sobre el rayado (contain), no recortados a la caja
       (cover). Si se recortaran se les cortarían las esquinas de
       la pieza, que es justo lo que se ve mal en un catálogo. */
    var fotos = todasLasFotos(p);
    var i = fotoActual[p.slug] || 0;
    if (i >= fotos.length) { i = 0; fotoActual[p.slug] = 0; }

    var visual;
    if (fotos.length) {
      /* Las flechas solo si hay más de una foto: con una sola
         estorban y no llevan a ningún sitio. */
      var flechas = fotos.length > 1
        ? '<button type="button" class="pt-flecha pt-flecha--izq" data-paso="-1"' +
            ' aria-label="' + t("pt_anterior") + '">&#8249;</button>' +
          '<button type="button" class="pt-flecha pt-flecha--der" data-paso="1"' +
            ' aria-label="' + t("pt_siguiente") + '">&#8250;</button>' +
          '<span class="pt-cuenta-fotos">' + (i + 1) + '/' + fotos.length + '</span>'
        : '';
      visual = '<span class="pt-ficha__hueco pt-ficha__hueco--foto' +
          (p.sin_fondo ? ' pt-ficha__hueco--suelto' : '') + '">' +
          '<img src="' + fotos[i] + '" alt="' + tx(p.nombre) + '" loading="lazy">' +
          flechas +
        '</span>';
    } else {
      visual = '<span class="pt-ficha__hueco">' + t("pt_sin_imagen") + '</span>';
    }

    /* La ficha dejó de ser un <button>: ahora lleva las flechas
       DENTRO, y un botón no puede contener otros botones — el
       navegador desanida el marcado y las flechas acaban fuera de
       la tarjeta. Va como div con rol de botón, y más abajo se le
       añade el manejo de teclado que un <button> daba gratis. */
    return '<div class="pt-ficha" role="button" tabindex="0" data-slug="' + p.slug + '">' +
      visual +
      '<span class="pt-ficha__cuerpo">' +
        '<h3>' + tx(p.nombre) + '</h3>' +
        '<span class="pt-ficha__res">' + tx(p.resumen) + '</span>' +
        '<span class="pt-ficha__pie">' +
          '<span class="pt-precio">' +
            (tieneVariosPrecios(p) ? '<span class="pt-desde">' + t("desde") + '</span>' : '') +
            dolar(precioDesde(p)) +
          '</span>' +
          '<span class="pt-estado' + clase + '">' + est + '</span>' +
        '</span>' +
      '</span>' +
    '</div>';
  }

  function pintarCatalogo() {
    var todos = visibles();
    var conStock = todos.filter(function (p) { return p.disponibilidad === "stock"; });
    var porPedido = todos.filter(function (p) { return p.disponibilidad !== "stock"; });

    $("#pt-stock").innerHTML  = conStock.map(fichaHTML).join("");
    $("#pt-pedido").innerHTML = porPedido.map(fichaHTML).join("");
    $("#pt-n-stock").textContent  = rellena("pt_n_productos", {n: conStock.length});
    $("#pt-n-pedido").textContent = rellena("pt_n_productos", {n: porPedido.length});

    /* títulos y bajadas, que también cambian con el idioma */
    $("#pt-titulo").textContent      = t("pt_titulo");
    $("#pt-bajada").textContent      = t("pt_bajada");
    $("#pt-tit-stock").textContent   = t("pt_con_stock");
    $("#pt-baj-stock").textContent   = t("pt_sin_espera");
    $("#pt-tit-pedido").textContent  = t("pt_por_encargo");
    $("#pt-baj-pedido").textContent  = t("pt_encargo_bajada");
    $("#pt-tit-pedidoc").textContent = t("pt_tu_pedido");
    $("#pt-baj-pedidoc").textContent = t("pt_pedido_bajada");
    $("#pt-tasa").textContent = rellena("pt_tasa_bcv", {
      v: window.TASAS.bcv.toLocaleString("es-VE", {minimumFractionDigits: 2, maximumFractionDigits: 2})
    }) + " · " + window.TASAS.fecha;

    Array.prototype.forEach.call(document.querySelectorAll(".pt-ficha"), function (f) {
      f.addEventListener("click", function () { abrirPanel(f.dataset.slug); });
      /* Lo que un <button> daba gratis y un div no: abrir con
         Enter o con espacio. */
      f.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          abrirPanel(f.dataset.slug);
        }
      });
    });

    /* Las flechas pasan la foto SIN abrir la ficha: por eso el
       stopPropagation. Sin él, cada flechazo abriría el panel. */
    Array.prototype.forEach.call(document.querySelectorAll(".pt-flecha"), function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        e.preventDefault();
        var ficha = b.closest(".pt-ficha");
        var slug = ficha.dataset.slug;
        var p = visibles().filter(function (x) { return x.slug === slug; })[0];
        var fotos = todasLasFotos(p);
        if (fotos.length < 2) return;

        var i = (fotoActual[slug] || 0) + parseInt(b.dataset.paso, 10);
        if (i < 0) i = fotos.length - 1;
        if (i >= fotos.length) i = 0;
        fotoActual[slug] = i;

        /* Se cambia solo la imagen y el contador, sin repintar la
           rejilla entera: repintarla perdería el foco del teclado
           y haría parpadear todas las tarjetas. */
        cambiarFoto(ficha.querySelector(".pt-ficha__hueco img"), fotos[i]);
        var cuenta = ficha.querySelector(".pt-cuenta-fotos");
        if (cuenta) cuenta.textContent = (i + 1) + "/" + fotos.length;
      });
    });
  }

  /* ============================================================
     PANEL DE CONFIGURACIÓN
     ============================================================ */
  var sel = null;

  function abrirPanel(slug) {
    var p = visibles().filter(function (x) { return x.slug === slug; })[0];
    if (!p) return;
    sel = { p: p, o: opcionesPorDefecto(p), cant: 1 };
    medioActivo = 0;   /* siempre abre por la foto de portada */
    $("#pt-panel").classList.add("abierto");
    $("#pt-velo").classList.add("abierto");
    pintarPanel();
  }
  function cerrarPanel() {
    $("#pt-panel").classList.remove("abierto");
    $("#pt-velo").classList.remove("abierto");
    /* Apagar el visor al cerrar. Si se deja vivo, sigue pintando
       cuadros contra un panel que nadie ve y se queda con el
       contexto WebGL ocupado. */
    var host = $("#pt-pn-visual");
    window.Visor3D.cerrar(host);
    /* Vaciar el lienzo además de apagar: si no, queda el canvas
       muerto colgando del DOM hasta la próxima apertura. */
    $("#pt-pn-lienzo").innerHTML = "";
    montado = null;
    sel = null;
  }

  /* ---------- la visual del panel ---------------------------- */
  /* Devuelve el .glb que le toca a la variante escogida, o null.
     modelo_por va indexado por el valor de opcion_visual (para la
     base de laptop, la madera). */
  function modeloDe(p, o) {
    if (!p.modelo_por) return p.modelo3d || null;
    var clave = o[p.opcion_visual || "madera"];
    return p.modelo_por[clave] || null;
  }

  /* ---------- todas las fotos de un producto ------------------
     Para el carrusel de la CUADRÍCULA: da igual la madera o la
     talla escogida, aquí van todas las fotos del producto una
     detrás de otra. Las de cada variante se INTERCALAN (una de
     samán, una de pino, una de samán...) en el orden en que las
     maderas aparecen en las opciones, que es lo que él pidió.
     El 3D queda fuera a propósito: eso solo se ve al abrir. */
  function todasLasFotos(p) {
    var listas = [];

    if (p.imagen_por) {
      var grupo = (p.opciones || []).filter(function (g) {
        return g.id === (p.opcion_visual || "madera");
      })[0];
      var claves = grupo ? grupo.valores.map(function (v) { return v.id; })
                         : Object.keys(p.imagen_por);
      claves.forEach(function (k) {
        var v = p.imagen_por[k];
        if (!v) return;
        listas.push(Array.isArray(v) ? v.slice() : [v]);
      });
    } else if (p.imagen) {
      listas.push([p.imagen]);
    }

    /* Round-robin: se saca la primera de cada variante, luego la
       segunda de cada una, y así. */
    var fotos = [];
    var largo = listas.reduce(function (a, l) { return Math.max(a, l.length); }, 0);
    for (var i = 0; i < largo; i++) {
      listas.forEach(function (l) { if (l[i]) fotos.push(l[i]); });
    }

    if (p.imagen && fotos.indexOf(p.imagen) === -1) fotos.unshift(p.imagen);
    (p.galeria || []).forEach(function (g) { fotos.push(g); });

    /* Sin repetidas: la base baja apunta a la misma foto desde
       las dos maderas mientras no haya una del apamate. */
    return fotos.filter(function (f, i) { return fotos.indexOf(f) === i; });
  }

  /* En qué foto va cada ficha. Sobrevive a los repintados (cambio
     de idioma), que es justo lo que se quiere. */
  var fotoActual = {};

  /* ---------- cambio de foto con glitch -----------------------
     Pone la foto nueva en el <img> y deja encima una copia de la
     vieja que se desintegra en bandas. La copia va por triplicado:
     la original más dos teñidas en rojo y cian que se desplazan a
     lados contrarios, que es lo que da la separación de canales.

     Se llama igual desde la cuadrícula y desde el panel.        */
  var menosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function cambiarFoto(img, nuevaSrc) {
    if (!img || img.getAttribute("src") === nuevaSrc) return;

    if (menosMovimiento) { img.src = nuevaSrc; return; }

    var caja = img.parentNode;
    if (!caja) { img.src = nuevaSrc; return; }

    /* Si ya había un glitch corriendo, se retira: dos superpuestos
       se ven sucios y dejan basura en el DOM si se pulsa rápido. */
    var previo = caja.querySelector(".pt-glitch");
    if (previo) previo.remove();

    var vieja = img.getAttribute("src");

    /* Cara o cruz: la mitad de las veces el segundo canal del
       desfase es ROJO en vez de amarillo. Se sortea en cada
       cambio, no una vez por sesión, para que no se vuelva
       predecible. */
    var rojo = Math.random() < 0.5;

    var capa = document.createElement("span");
    capa.className = "pt-glitch" + (rojo ? " pt-glitch--rojo" : "");
    capa.setAttribute("aria-hidden", "true");
    capa.innerHTML = '<img src="' + vieja + '" alt="">' +
                     '<img src="' + vieja + '" alt="">' +
                     '<img src="' + vieja + '" alt="">';

    /* La copia tiene que caer EXACTAMENTE encima de la original.
       Se mide dónde está la imagen de verdad y se coloca la capa
       ahí, en píxeles. Con `inset: 0` no vale: el recuadro lleva
       relleno, y además una imagen es un elemento reemplazado —
       con tamaño automático se salta los insets y usa el suyo.
       También se copia el `object-fit`, que cambia por producto. */
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

    img.src = nuevaSrc;
    img.classList.remove("pt-entrando", "pt-entrando--rojo");
    /* Forzar un reflow para que la animación vuelva a arrancar si
       se pulsa dos veces seguidas; sin esto la clase se reañade
       en el mismo cuadro y el navegador no la reinicia. */
    void img.offsetWidth;
    img.classList.add("pt-entrando");
    /* El tirón de la que entra usa el mismo par de colores que
       las bandas: si salió rojo, va rojo. */
    if (rojo) img.classList.add("pt-entrando--rojo");

    /* 105 ms: la animación dura 85 y sobran 20 de margen. Si se
       recorta el CSS hay que recortar esto, o la capa se queda
       colgada un rato después de terminar. */
    setTimeout(function () {
      capa.remove();
      img.classList.remove("pt-entrando", "pt-entrando--rojo");
    }, 105);
  }

  /* ---------- glitch al cambiar DE MEDIO ----------------------
     El de arriba (`cambiarFoto`) solo vale de foto a foto: clona
     el <img> viejo y desintegra la copia. Aquí no se puede clonar
     —el plano es un SVG o una imagen suelta—, así que se corta el
     nodo original mientras se va.

     NO se usa al entrar al visor 3D: ver el comentario en
     pintarVisual(). Sí al salir de él.

     Se saca del flujo antes de animarlo: si se quedara dentro,
     empujaría al medio nuevo mientras los dos conviven esos
     105 ms.                                                     */
  function sacarConGlitch(caja) {
    var viejos = Array.prototype.slice.call(caja.children);

    if (menosMovimiento || !viejos.length) {
      caja.innerHTML = "";
      return;
    }

    /* Restos de un cambio anterior: si se pulsa rápido de una
       miniatura a otra, se acumularían capas muertas. */
    Array.prototype.forEach.call(
      caja.parentNode.querySelectorAll(".pt-saliendo"),
      function (n) { n.remove(); });

    var capa = document.createElement("div");
    capa.className = "pt-saliendo" + (Math.random() < 0.5 ? " pt-saliendo--rojo" : "");
    capa.setAttribute("aria-hidden", "true");
    viejos.forEach(function (n) { capa.appendChild(n); });

    /* Cuelga del recuadro, no del lienzo: el lienzo cambia de
       posición y de tamaño con `data-medio`, y la capa se movería
       a media animación. */
    caja.parentNode.appendChild(capa);
    caja.innerHTML = "";

    setTimeout(function () { capa.remove(); }, 105);
  }

  /* El tirón de canales sobre lo que ENTRA, sea lo que sea. El
     mismo que usa `cambiarFoto` para las fotos. */
  function entrarConGlitch(caja) {
    if (menosMovimiento) return;
    var nuevo = caja.firstElementChild;
    if (!nuevo) return;
    nuevo.classList.add("pt-entrando");
    setTimeout(function () { nuevo.classList.remove("pt-entrando"); }, 105);
  }

  /* La lista de medios de un producto, en el orden en que salen
     las miniaturas. Primero la foto de portada (la misma de la
     cuadrícula), luego el 3D, luego lo que se vaya añadiendo:
     `galeria` para más fotos y `video` para vídeo. */
  function medios(p, o) {
    var l = [];
    /* Si hay foto POR VARIANTE, manda esa: al cambiar de madera
       cambia la foto igual que cambia el modelo. */
    var porVariante = p.imagen_por && p.imagen_por[o[p.opcion_visual || "madera"]];
    if (porVariante) l.push({ tipo: "foto", src: porVariante });
    else if (p.imagen) l.push({ tipo: "foto", src: p.imagen });
    (p.galeria || []).forEach(function (g) { l.push({ tipo: "foto", src: g }); });
    var m = modeloDe(p, o);
    if (m) l.push({ tipo: "3d", src: m });

    /* El plano de cotas. Puede depender de la opción escogida
       (cada talla de tabla tiene el suyo) o ser único. */
    /* `plano_img` gana al diagrama dibujado por código: es un plano
       hecho aparte y ya terminado, y donde existe es mejor que el
       SVG. Va en NEGRO sobre transparente, y en modo oscuro se
       invierte por CSS — ver .pt-visual__plano. */
    if (p.plano_img) {
      l.push({ tipo: "plano-img", src: p.plano_img });
    } else {
      var plano = p.diagrama_por ? p.diagrama_por[o[p.opcion_diagrama || "tamano"]]
                                 : p.diagrama;
      if (plano && window.DIAGRAMAS && window.DIAGRAMAS.tiene(plano)) {
        l.push({ tipo: "plano", src: plano });
      }
    }

    if (p.video) l.push({ tipo: "video", src: p.video });
    return l;
  }

  /* Qué medio se está viendo, y qué hay montado ahora mismo, para
     no recargar el .glb cada vez que se toca la cantidad. */
  var medioActivo = 0;
  var montado = null;

  function pintarVisual() {
    var host = $("#pt-pn-visual");
    var riel = $("#pt-pn-medios");
    if (!sel) return;

    var lista = medios(sel.p, sel.o);
    if (medioActivo >= lista.length) medioActivo = 0;
    var m = lista[medioActivo] || null;
    var firma = m ? m.tipo + ":" + m.src : "nada";

    /* Las miniaturas: solo si hay más de una. Con una sola no
       aportan nada y estorban encima de la imagen. */
    if (lista.length > 1) {
      riel.hidden = false;
      riel.innerHTML = lista.map(function (x, i) {
        /* Miniaturas (él, 14/08/2026): el plano se enseña, no se
           rotula — es una imagen y ya se sabe lo que es al verla.
           El vídeo lleva el triángulo de reproducir en vez de la
           palabra. Solo el 3D se queda con rótulo, porque un .glb
           no tiene nada que enseñar hasta que se carga. */
        var dentro;
        if (x.tipo === "foto" || x.tipo === "plano-img") {
          dentro = '<img src="' + x.src + '" alt="">';
        } else if (x.tipo === "video") {
          dentro = '<span class="pt-medio__play" aria-hidden="true">&#9654;</span>';
        } else if (x.tipo === "3d") {
          dentro = '<span class="pt-medio__glifo">3D</span>';
        } else {
          /* el plano dibujado por código: sigue sin imagen previa */
          dentro = '<span class="pt-medio__glifo">' + t("pt_plano") + '</span>';
        }
        var comoSeLlama = x.tipo === "video" ? "vídeo"
                        : (x.tipo === "plano" || x.tipo === "plano-img") ? t("pt_plano")
                        : x.tipo;
        return '<button type="button" class="pt-medio' +
               (x.tipo === "plano-img" ? " pt-medio--plano" : "") +
               (i === medioActivo ? " sel" : "") +
               '" data-i="' + i + '" aria-label="' + comoSeLlama + '">' + dentro + '</button>';
      }).join("");
      Array.prototype.forEach.call(riel.querySelectorAll(".pt-medio"), function (b) {
        b.addEventListener("click", function () {
          medioActivo = parseInt(b.dataset.i, 10);
          pintarVisual();
        });
      });
    } else {
      riel.hidden = true;
      riel.innerHTML = "";
    }

    /* La proporción del recuadro la decide el medio: el CSS la lee
       de data-medio. Una foto 4:3 en un recuadro cuadrado perdía
       la base de la pieza. */
    host.setAttribute("data-medio", m ? m.tipo : "vacio");
    /* Fondo liso (no rayado) cuando lo que se ve es una pieza
       recortada. Solo aplica a las fotos: el visor 3D trae su
       propio fondo y el recuadro vacío sí lleva rayado. */
    host.setAttribute("data-suelto",
      (m && ((m.tipo === "foto" && sel.p.sin_fondo) ||
             m.tipo === "plano" || m.tipo === "plano-img")) ? "1" : "0");

    if (firma === montado) return;

    var caja = $("#pt-pn-lienzo");
    var yaHabiaFoto = caja.querySelector(".pt-visual__foto");

    /* De foto a foto se REUTILIZA el <img> y se hace el glitch.
       Si se reemplazara el HTML no habría de dónde sacar la copia
       de la vieja, y el corte se vería como un parpadeo seco. */
    if (m && m.tipo === "foto" && yaHabiaFoto && montado &&
        montado.indexOf("foto:") === 0) {
      montado = firma;
      cambiarFoto(yaHabiaFoto, m.src);
      return;
    }

    window.Visor3D.cerrar(host);
    montado = firma;

    /* Glitch al pasar de foto a PLANO o a VÍDEO, y al revés (él,
       14/08/2026). El de foto a foto no sirve aquí: aquel clona el
       <img> viejo para desintegrarlo, y de un plano en SVG no hay
       imagen que clonar. Este corta el NODO DE VERDAD que se va —
       `clip-path` y `transform` funcionan sobre cualquier
       elemento.

       AL 3D SE ENTRA SIN NADA, por decisión suya del 14/08/2026.
       Se intentó dos veces: primero cortando al pulsar, y el
       corte pasaba sobre el recuadro vacío del "Cargando…" porque
       el modelo tarda un segundo en montarse; después dejando la
       foto quieta encima hasta que el visor avisara de que estaba
       listo. Ninguna de las dos le convenció, así que el cambio
       al 3D es seco. Lo demás conserva su corte. */
    if (m && m.tipo === "3d") {
      caja.innerHTML = "";
      var v3d = document.createElement("div");
      v3d.className = "visor3d";
      caja.appendChild(v3d);
      window.Visor3D.abrir(v3d, m.src, {
        cargando: t("v3d_cargando"), error: t("v3d_error"), ayuda: t("v3d_ayuda")
      });
      /* El apagado vive en la caja interna, pero cerrar() se llama
         sobre el host: se lo pasamos hacia arriba. */
      host.__cerrarVisor = function () { window.Visor3D.cerrar(v3d); };
      return;
    }

    sacarConGlitch(caja);

    if (!m) {
      caja.innerHTML = '<span class="pt-visual__vacio">' + t("pt_sin_imagen") + '</span>';
      return;
    }
    if (m.tipo === "foto") {
      caja.innerHTML = '<img class="pt-visual__foto' +
        (sel.p.sin_fondo ? ' pt-visual__foto--suelto' : '') +
        '" src="' + m.src + '" alt="' + tx(sel.p.nombre) + '">';
      entrarConGlitch(caja);
      return;
    }
    if (m.tipo === "plano") {
      caja.innerHTML = '<div class="pt-plano">' + window.DIAGRAMAS.dibujar(m.src) + '</div>';
      entrarConGlitch(caja);
      return;
    }
    if (m.tipo === "plano-img") {
      /* Se pinta primero el <img> de siempre, y si se puede se sustituye
         por el SVG metido DENTRO de la página. Merece la pena porque un
         <img> es un documento aislado: no recibe la Roboto que servimos
         desde fuentes/ ni deja traducir los rótulos de dentro.
         El <img> no es código muerto — es el camino que queda cuando se
         abre el HTML con doble clic (file://), donde fetch no funciona.
         Ver .pt-visual__plano en css/prototipos.css. */
      caja.innerHTML = '<img class="pt-visual__plano" src="' + m.src +
        '" alt="' + tx(sel.p.nombre) + ' — plano con medidas">';
      entrarConGlitch(caja);
      incrustarPlano(caja, m.src);
      return;
    }
    if (m.tipo === "video") {
      caja.innerHTML = '<video class="pt-visual__foto" src="' + m.src + '" controls playsinline></video>';
      entrarConGlitch(caja);
      return;
    }
  }

  /* Cambia el <img> del plano por el SVG en línea. Silencioso a propósito:
     si algo falla se queda el <img>, que ya está pintado y se ve igual. */
  var cachePlano = {};
  function incrustarPlano(caja, src) {
    if (!window.fetch || !/\.svg$/i.test(src)) return;

    function poner(txt) {
      /* El usuario pudo cambiar de medio mientras llegaba: si el <img> de
         ESTE plano ya no está, no se toca nada. */
      var img = caja.querySelector("img.pt-visual__plano");
      if (!img || img.getAttribute("src") !== src) return;
      var doc = new DOMParser().parseFromString(txt, "image/svg+xml");
      var svg = doc.documentElement;
      if (!svg || svg.nodeName.toLowerCase() !== "svg") return;
      svg.setAttribute("class", "pt-visual__plano");
      svg.setAttribute("role", "img");
      var alt = img.getAttribute("alt") || "";
      var tit = doc.createElementNS("http://www.w3.org/2000/svg", "title");
      tit.textContent = alt;
      svg.insertBefore(tit, svg.firstChild);
      traducirPlano(svg);
      img.parentNode.replaceChild(document.importNode(svg, true), img);
    }

    if (cachePlano[src]) { poner(cachePlano[src]); return; }
    fetch(src).then(function (r) { return r.ok ? r.text() : null; })
      .then(function (txt) { if (txt) { cachePlano[src] = txt; poner(txt); } })
      .catch(function () { /* se queda el <img> */ });
  }

  /* Los rótulos del plano traen sus dos idiomas en data-es/data-en, que
     los escribe Herramientas/plano-tecnico.py con --titulo-en. */
  function traducirPlano(raiz) {
    var ts = raiz.querySelectorAll("[data-" + idioma + "]");
    for (var i = 0; i < ts.length; i++) {
      ts[i].textContent = ts[i].getAttribute("data-" + idioma);
    }
  }

  function pintarPanel() {
    if (!sel) return;
    var p = sel.p, o = sel.o;

    $("#pt-pn-titulo").textContent = tx(p.nombre);
    $("#pt-pn-resumen").textContent =
      tx(p.resumen) + (p.medidas ? "  ·  " + tx(p.medidas) : "");

    $("#pt-pn-opciones").innerHTML = (p.opciones || []).map(function (g) {
      return '<div class="pt-grupo">' +
        '<span class="pt-etiqueta">' + tx(g.etiqueta) + '</span>' +
        '<div class="pt-ops">' +
        g.valores.map(function (v) {
          /* ¿esta combinación existe en stock? */
          var prueba = {};
          for (var k in o) prueba[k] = o[k];
          prueba[g.id] = v.id;
          var agotado = p.disponibilidad === "stock" && stockDe(p, prueba) === 0;

          var extra = "";
          if (p.matriz) {
            var pr = p.matriz[p.opciones.map(function (gg) {
              return gg.id === g.id ? v.id : o[gg.id];
            }).join("|")];
            if (pr) extra = '<span class="pt-d">' + dolar(pr) + '</span>';
          } else if (v.precio != null) {
            extra = '<span class="pt-d">' + dolar(v.precio) + '</span>';
          } else if (v.delta > 0) {
            extra = '<span class="pt-d">+' + dolar(v.delta) + '</span>';
          }

          return '<button type="button" class="pt-op' + (o[g.id] === v.id ? " sel" : "") + '"' +
                 ' data-g="' + g.id + '" data-v="' + v.id + '"' + (agotado ? " disabled" : "") + '>' +
                 tx(v.etiqueta) +
                 (v.nota ? ' <span class="pt-d">' + tx(v.nota) + '</span>' : '') +
                 extra + '</button>';
        }).join("") +
        '</div></div>';
    }).join("");

    Array.prototype.forEach.call(document.querySelectorAll("#pt-pn-opciones .pt-op"), function (b) {
      b.addEventListener("click", function () {
        sel.o[b.dataset.g] = b.dataset.v;
        sel.cant = 1;
        pintarPanel();
      });
    });

    var uxp = unidadesPorPack(p, o);
    $("#pt-pn-etiqueta-cant").textContent = uxp > 1 ? t("pt_cant_packs") : t("pt_cantidad");
    $("#pt-pn-cant").textContent = sel.cant;

    /* La cuenta que él pidió: que nadie crea que compró 2 piecitas
       cuando en realidad compró 2 packs de 20. */
    $("#pt-pn-nota-pack").textContent = uxp > 1
      ? rellena("pt_en_total", { n: sel.cant * uxp, cosa: tx(p.palabra_pack) })
      : "";

    if (p.disponibilidad === "stock") {
      var n = stockDe(p, o);
      var pasado = sel.cant > n;
      /* El número de cantidad se pone en acento cuando el pedido
         supera lo que hay hecho. */
      $("#pt-pn-cant").classList.toggle("pt-cant--sobre", pasado);
      $("#pt-pn-nota-stock").classList.toggle("pt-nota-sobre", pasado);

      if (pasado) {
        $("#pt-pn-nota-stock").textContent = rellena("pt_sobre_stock", {
          hay: n,
          falta: sel.cant - n,
          total: sel.cant,
          cosa: uxp > 1 ? t("pt_paquetes") : t("pt_unidades")
        });
      } else {
        $("#pt-pn-nota-stock").textContent = n === 0
          ? t("pt_sin_combo")
          : rellena("pt_en_taller", {n: n});
      }
    } else {
      $("#pt-pn-cant").classList.remove("pt-cant--sobre");
      $("#pt-pn-nota-stock").classList.remove("pt-nota-sobre");
      $("#pt-pn-nota-stock").textContent = rellena("pt_se_produce", {
        p: rellena("pt_semanas", {n: p.plazo_semanas})
      });
    }

    pintarVisual();

    var total = precioUnidad(p, o) * sel.cant;
    $("#pt-pn-precio").textContent = dolar(total);
    $("#pt-pn-precio-bs").textContent = bolivar(aBs(total));
    $("#pt-pn-agregar").textContent = t("pt_agregar_cerrar");
    $("#pt-pn-agregar").disabled = total === 0;
    $("#pt-pn-agregar-seguir").textContent = t("pt_agregar_seguir");
    $("#pt-pn-agregar-seguir").disabled = total === 0;
  }

  /* ============================================================
     EL PEDIDO
     ============================================================ */
  var carrito = [];
  var entregaSel = "taller";
  var estadoSel = "";
  var pagoSel = "pagomovil";
  var codigoPedido = null;

  function codigo() {
    if (!codigoPedido) codigoPedido = Math.random().toString(36).slice(2, 6).toUpperCase();
    return codigoPedido;
  }

  function pesoTotal() {
    return carrito.reduce(function (a, l) { return a + l.peso * l.cant; }, 0);
  }
  function entregaActual() {
    return window.ENTREGAS.filter(function (e) { return e.id === entregaSel; })[0];
  }
  /* Devuelve {min, max} o null si aún falta escoger el estado.
     Se trabaja con horquilla y no con una cifra suelta: el número
     no está publicado en ninguna parte, y dos bultos del mismo
     peso no cuestan igual. */
  function costoEnvio() {
    var e = entregaActual();
    if (!e || e.tipo === "gratis") return { min: 0, max: 0 };
    if (e.tipo === "local") return { min: e.monto_min, max: e.monto_max };
    if (!estadoSel) return null;
    var z = window.ZONAS[window.ESTADOS[estadoSel]];
    var centro = (z.base + z.por_kg * pesoTotal()) * e.factor * window.MULTIPLICADOR_ENVIO;
    var h = window.HORQUILLA;
    return { min: centro * (1 - h), max: centro * (1 + h) };
  }

  /* "$11 – $20", o "$12" si los dos extremos redondean igual. */
  function rango(r) {
    var a = Math.round(r.min), b = Math.round(r.max);
    return a === b ? dolar(a) : dolar(a) + " – " + dolar(b);
  }

  function pintarLineas() {
    var host = $("#pt-lineas");
    if (!carrito.length) {
      host.innerHTML = '<p class="pt-vacio">' + t("pt_vacio") + '</p>';
      return;
    }
    host.innerHTML = carrito.map(function (l, i) {
      var sub = [l.etiqueta, l.disponibilidad !== "stock"
        ? t("pt_por_encargo") + " · " + rellena("pt_semanas", {n: l.plazo_semanas}) : ""]
        .filter(Boolean).join(" · ");
      /* La cantidad se edita AQUÍ, con los mismos − y + del panel
         de producto (él, 14/08/2026). Antes había que quitar la
         línea y volver a agregarla para cambiar de dos a tres. */
      return '<div class="pt-linea">' +
        '<div class="pt-linea__desc">' +
          '<b>' + tx(l.nombre) + '</b>' +
          (sub ? '<small>' + sub + '</small>' : '') +
          (l.uxp > 1 ? '<span class="pt-linea__packs">' +
             rellena("pt_en_total", {n: l.cant * l.uxp, cosa: tx(l.palabra_pack)}) + '</span>' : '') +
        '</div>' +
        '<div class="pt-linea__cant">' +
          '<button class="pt-pasos__b" type="button" data-menos="' + i + '" ' +
            'aria-label="−">−</button>' +
          '<span class="pt-linea__n">' + l.cant + '</span>' +
          '<button class="pt-pasos__b" type="button" data-mas="' + i + '" ' +
            'aria-label="+">+</button>' +
        '</div>' +
        '<div class="pt-linea__mon">' + dolar(l.unitario * l.cant) + '</div>' +
        '<button class="pt-quitar" type="button" data-i="' + i + '" ' +
          'title="' + t("pt_quitar_titulo") + '" aria-label="' + t("pt_quitar_titulo") + '">' +
          '<span aria-hidden="true">−</span></button>' +
      '</div>';
    }).join("");

    Array.prototype.forEach.call(host.querySelectorAll(".pt-quitar"), function (b) {
      b.addEventListener("click", function () {
        carrito.splice(parseInt(b.dataset.i, 10), 1);
        pintarPedido();
      });
    });

    /* − y + sobre la línea ya agregada. Bajar de 1 NO borra la
       línea: para eso está el botón de quitar, y que un − de más
       te haga desaparecer el renglón es de las cosas que más
       molestan en un carrito. */
    Array.prototype.forEach.call(host.querySelectorAll("[data-menos],[data-mas]"), function (b) {
      b.addEventListener("click", function () {
        var esMas = b.hasAttribute("data-mas");
        var i = parseInt(b.getAttribute(esMas ? "data-mas" : "data-menos"), 10);
        var l = carrito[i];
        if (!l) return;
        l.cant = Math.max(1, l.cant + (esMas ? 1 : -1));
        pintarPedido();
      });
    });
  }

  function pintarEntrega() {
    var kg = pesoTotal();

    /* Esta corrección va AQUÍ y no en el click. Si se deja en el
       manejador, cambiar de método de pago apaga la opción pero
       deja la selección pegada en ella, y el envío sigue
       apareciendo. Ya pasó. */
    if (pagoSel === "efectivo" && entregaActual() && entregaActual().tipo !== "gratis") entregaSel = "taller";

    $("#pt-entrega").innerHTML = window.ENTREGAS.map(function (e) {
      var noEfectivo = pagoSel === "efectivo" && e.tipo !== "gratis";

      var val;
      if (e.tipo === "gratis") val = t("pt_sin_costo");
      else if (e.tipo === "local") val = "~" + rango({ min: e.monto_min, max: e.monto_max });
      else if (estadoSel) {
        var z = window.ZONAS[window.ESTADOS[estadoSel]];
        var c = (z.base + z.por_kg * kg) * e.factor * window.MULTIPLICADOR_ENVIO;
        val = "~" + rango({ min: c * (1 - window.HORQUILLA), max: c * (1 + window.HORQUILLA) });
      } else val = t("pt_escoge_estado");

      var detalle = noEfectivo ? t("pt_no_efectivo") : tx(e.detalle);

      return '<button type="button" class="pt-radio' + (entregaSel === e.id ? " sel" : "") + '"' +
             ' data-id="' + e.id + '"' + (noEfectivo ? " disabled" : "") + '>' +
        '<span class="pt-radio__punto"></span>' +
        '<span class="pt-radio__et">' + tx(e.nombre) + '<small>' + detalle + '</small></span>' +
        '<span class="pt-radio__val">' + val + '</span>' +
      '</button>';
    }).join("");

    Array.prototype.forEach.call(document.querySelectorAll("#pt-entrega .pt-radio"), function (b) {
      b.addEventListener("click", function () { entregaSel = b.dataset.id; pintarPedido(); });
    });

    $("#pt-zona-estado").style.display =
      (entregaActual() && entregaActual().tipo === "agencia") ? "block" : "none";
  }

  function pintarPago() {
    $("#pt-pago").innerHTML = window.PAGOS.map(function (p) {
      var moneda = p.moneda === "bs" ? t("pt_en_bs")
                 : p.moneda === "usdt" ? t("pt_en_usdt") : t("pt_en_usd");
      return '<button type="button" class="pt-radio' + (pagoSel === p.id ? " sel" : "") + '"' +
             ' data-id="' + p.id + '">' +
        '<span class="pt-radio__punto"></span>' +
        '<span class="pt-radio__et">' + tx(p.nombre) +
          (p.condicion ? '<small>' + tx(p.condicion) + '</small>' : '') + '</span>' +
        '<span class="pt-radio__val">' + moneda + '</span>' +
      '</button>';
    }).join("");

    Array.prototype.forEach.call(document.querySelectorAll("#pt-pago .pt-radio"), function (b) {
      b.addEventListener("click", function () { pagoSel = b.dataset.id; pintarPedido(); });
    });
  }

  function llenarEstados() {
    var principales = window.ESTADOS_PRINCIPALES;
    var resto = Object.keys(window.ESTADOS)
      .filter(function (e) { return principales.indexOf(e) === -1; })
      .sort(function (a, b) { return a.localeCompare(b, "es"); });

    $("#pt-estado").innerHTML =
      '<option value="">' + t("pt_que_estado") + '</option>' +
      '<optgroup label="' + t("pt_los_de_siempre") + '">' +
        principales.map(function (e) { return '<option value="' + e + '">' + e + '</option>'; }).join("") +
      '</optgroup>' +
      '<optgroup label="' + t("pt_resto_pais") + '">' +
        resto.map(function (e) { return '<option value="' + e + '">' + e + '</option>'; }).join("") +
      '</optgroup>';
    $("#pt-estado").value = estadoSel;
  }

  function pintarTotales() {
    var suma = carrito.reduce(function (a, l) { return a + l.unitario * l.cant; }, 0);
    $("#pt-l-piezas").textContent = t("pt_piezas");
    $("#pt-suma").textContent = dolar(suma);
    $("#pt-l-total").textContent = t("pt_total");

    var pago = window.PAGOS.filter(function (p) { return p.id === pagoSel; })[0];
    var principal = $("#pt-total-principal");
    var segundo = $("#pt-total-secundario");

    if (pago.moneda === "bs") {
      /* REF × BCV. Nunca USD × BCV: eso regalaría el 20%. */
      principal.textContent = bolivar(aBs(suma));
      segundo.textContent = dolar(suma) + " · REF " + dolar(aRef(suma)) + " × BCV";
    } else if (pago.moneda === "usdt") {
      principal.textContent = (Math.round(suma * 100) / 100).toLocaleString("en-US") + " USDT";
      segundo.textContent = rellena("pt_equivale", {m: dolar(suma)});
    } else {
      principal.textContent = dolar(suma);
      segundo.textContent = carrito.length ? rellena("pt_si_bs", {m: bolivar(aBs(suma))}) : "";
    }

    /* El envío va aparte y NO suma: lo cobra la agencia al
       entregarlo, no él. */
    var e = entregaActual();
    var caja = $("#pt-caja-envio");
    var env = costoEnvio();

    if (!carrito.length || e.tipo === "gratis") {
      caja.style.display = "none";
    } else {
      caja.style.display = "block";
      $("#pt-l-envio").textContent = t("pt_envio_est");
      if (env === null) {
        $("#pt-envio-monto").textContent = "—";
        $("#pt-envio-bs").textContent = "";
        $("#pt-envio-nota").textContent = t("pt_envio_escoge");
      } else {
        $("#pt-envio-monto").textContent = "~" + rango(env);
        $("#pt-envio-bs").textContent = "≈ " + bolivar(aBs(env.min)) + " – " + bolivar(aBs(env.max));
        $("#pt-envio-nota").textContent = e.tipo === "agencia"
          ? rellena("pt_envio_nota", {a: tx(e.nombre), kg: pesoTotal().toFixed(1)})
          : t("pt_envio_local");
      }
    }
  }

  /* ---------- el mensaje que le llega ------------------------ */
  function textoPedido() {
    var suma = carrito.reduce(function (a, l) { return a + l.unitario * l.cant; }, 0);
    var pago = window.PAGOS.filter(function (x) { return x.id === pagoSel; })[0];
    var e = entregaActual();
    var env = costoEnvio();
    var es = idioma === "es";

    var s = (es ? "Hola! Quiero hacer un pedido 👋" : "Hi! I'd like to place an order 👋") + "\n\n";

    carrito.forEach(function (l) {
      s += "• " + l.cant + "× " + tx(l.nombre);
      if (l.etiqueta) s += " — " + l.etiqueta;
      s += " — " + dolar(l.unitario * l.cant) + "\n";
      if (l.uxp > 1) {
        s += "   " + rellena("pt_en_total", {n: l.cant * l.uxp, cosa: tx(l.palabra_pack)}) + "\n";
      }
      if (l.disponibilidad !== "stock") {
        s += "   (" + t("pt_por_encargo") + " · " + rellena("pt_semanas", {n: l.plazo_semanas}) + ")\n";
      }
    });

    s += "\n" + (es ? "Total" : "Total") + ": " + dolar(suma);
    if (pago.moneda === "bs") s += " — " + bolivar(aBs(suma));
    else if (pago.moneda === "usdt") s += " — " + (Math.round(suma * 100) / 100) + " USDT";
    s += "\n" + (es ? "Pago" : "Payment") + ": " + tx(pago.nombre) + "\n";

    if (e.tipo === "gratis") {
      s += (es ? "Entrega" : "Delivery") + ": " + tx(e.nombre) + "\n";
    } else if (e.tipo === "local") {
      s += (es ? "Entrega" : "Delivery") + ": " + tx(e.nombre) + " (~" + rango(env) + ")\n";
    } else {
      s += (es ? "Envío" : "Shipping") + ": " + tx(e.nombre) +
           (estadoSel ? (es ? " a " : " to ") + estadoSel : "") +
           (es ? ", cobro destino" : ", paid on collection") +
           (env !== null ? " (~" + rango(env) + (es ? " aprox.)" : " approx.)") : "") + "\n";
    }

    s += "\n" + (es ? "Pedido" : "Order") + " #" + codigo() + " · " +
         new Date().toLocaleDateString(es ? "es-VE" : "en-GB");

    /* La tasa va estampada: es la mitad de la cláusula de validez.
       Sin ella, dentro de una semana nadie sabe de dónde salió
       ese número en bolívares. */
    if (pago.moneda === "bs") {
      s += "\n" + (es ? "Tasa BCV " : "BCV rate ") + window.TASAS.fecha + ": " +
           window.TASAS.bcv.toLocaleString("es-VE");
    }
    return s;
  }

  function pintarPrevia() {
    $("#pt-l-previa").textContent = t("pt_me_llega");
    var host = $("#pt-previa");
    host.textContent = carrito.length ? textoPedido() : t("pt_previa_vacia");
    /* El botón lleva el logo de WhatsApp y la flechita de enlace
       externo: avisa de que al pulsarlo se sale del sitio. */
    $("#pt-pedir").innerHTML =
      '<span class="pt-pedir__txt">' + t("pt_pedir") + '</span>' +
      '<svg class="pt-pedir__wa" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43l-.48-.01c-.16 0-.43.06-.65.31-.22.25-.85.83-.85 2.03s.87 2.35.99 2.51c.12.17 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.19 1.11.16 1.53.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z"/>' +
      '</svg>' +
      '<svg class="pt-pedir__ext" viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M7 17 17 7M9 7h8v8"/>' +
      '</svg>';
    $("#pt-pedir").disabled = !carrito.length;
    $("#pt-nota-pedir").textContent = t("pt_pedir_nota");
    $("#pt-nota-datos").textContent = t("pt_datos_wa");
    $("#pt-l-recibes").textContent = t("pt_como_recibes");
    $("#pt-l-pagas").textContent = t("pt_como_pagas");
  }

  function pintarPedido() {
    pintarLineas();
    pintarEntrega();
    pintarPago();
    pintarTotales();
    pintarPrevia();
  }

  function pintarTodo() {
    pintarCatalogo();
    llenarEstados();
    pintarPedido();
  }

  /* ============================================================
     ENGANCHES
     ============================================================ */
  /* Ya NO hay tope por stock: se puede pedir más de lo que hay
     hecho, y lo que falte se fabrica por encargo. Lo que avisa de
     que se pasó es el color del número y la nota de debajo. */
  $("#pt-pn-mas").addEventListener("click", function () {
    if (!sel) return;
    sel.cant++;
    pintarPanel();
  });
  $("#pt-pn-menos").addEventListener("click", function () {
    if (sel && sel.cant > 1) { sel.cant--; pintarPanel(); }
  });
  /* Agregar la selección al pedido. `bajar` decide si además se
     salta al final de la página: con dos botones, uno agrega y te
     deja donde estabas y el otro te lleva a concretar. */
  function agregarAlPedido(bajar) {
    if (!sel) return;
    var p = sel.p, o = sel.o;
    carrito.push({
      slug: p.slug, nombre: p.nombre, opciones: o,
      etiqueta: etiquetaOpciones(p, o),
      cant: sel.cant, unitario: precioUnidad(p, o),
      peso: pesoDe(p, o), uxp: unidadesPorPack(p, o),
      palabra_pack: p.palabra_pack,
      disponibilidad: p.disponibilidad, plazo_semanas: p.plazo_semanas
    });
    cerrarPanel();
    pintarPedido();
    if (bajar) {
      document.getElementById("pt-pedido-seccion")
        .scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  $("#pt-pn-agregar").addEventListener("click", function () { agregarAlPedido(true); });
  $("#pt-pn-agregar-seguir").addEventListener("click", function () { agregarAlPedido(false); });

  $("#pt-pn-cerrar").addEventListener("click", cerrarPanel);
  $("#pt-velo").addEventListener("click", cerrarPanel);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { cerrarPanel(); return; }

    /* Flechas para pasar de foto a 3D, a plano, a vídeo (él,
       14/08/2026). Solo con el panel abierto, y NO cuando el foco
       está escribiendo en un campo: ahí las flechas mueven el
       cursor y robárselas es peor que no tener el atajo. */
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    if (!sel || !$("#pt-panel").classList.contains("abierto")) return;
    var act = document.activeElement;
    if (act && /^(INPUT|TEXTAREA|SELECT)$/.test(act.tagName)) return;

    var lista = medios(sel.p, sel.o);
    if (lista.length < 2) return;
    e.preventDefault();
    var salto = e.key === "ArrowRight" ? 1 : -1;
    medioActivo = (medioActivo + salto + lista.length) % lista.length;
    pintarVisual();
  });

  $("#pt-estado").addEventListener("change", function (e) {
    estadoSel = e.target.value;
    pintarPedido();
  });

  $("#pt-pedir").addEventListener("click", function () {
    var M = window.MARCA;
    if (!M.whatsapp) {
      /* El número sigue en null a propósito: el sitio es público
         y Google lo indexa. Ver el comentario en datos/marca.js. */
      alert(t("pt_sin_wa"));
      return;
    }
    window.open("https://wa.me/" + M.whatsapp + "?text=" +
                encodeURIComponent(textoPedido()), "_blank");
  });

  pintarTodo();
})();
