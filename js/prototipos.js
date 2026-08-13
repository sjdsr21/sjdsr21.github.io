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
    var visual = p.imagen
      ? '<span class="pt-ficha__hueco pt-ficha__hueco--foto' +
          (p.sin_fondo ? ' pt-ficha__hueco--suelto' : '') + '">' +
          '<img src="' + p.imagen + '" alt="' + tx(p.nombre) + '" loading="lazy">' +
        '</span>'
      : '<span class="pt-ficha__hueco">' + t("pt_sin_imagen") + '</span>';

    return '<button class="pt-ficha" type="button" data-slug="' + p.slug + '">' +
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
    '</button>';
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
        var dentro = x.tipo === "foto"
          ? '<img src="' + x.src + '" alt="">'
          : '<span class="pt-medio__glifo">' + (x.tipo === "3d" ? "3D" : "VÍDEO") + '</span>';
        return '<button type="button" class="pt-medio' + (i === medioActivo ? " sel" : "") +
               '" data-i="' + i + '" aria-label="' + x.tipo + '">' + dentro + '</button>';
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
      (m && m.tipo === "foto" && sel.p.sin_fondo) ? "1" : "0");

    if (firma === montado) return;
    window.Visor3D.cerrar(host);
    montado = firma;

    var caja = $("#pt-pn-lienzo");
    caja.innerHTML = "";

    if (!m) {
      caja.innerHTML = '<span class="pt-visual__vacio">' + t("pt_sin_imagen") + '</span>';
      return;
    }
    if (m.tipo === "foto") {
      caja.innerHTML = '<img class="pt-visual__foto' +
        (sel.p.sin_fondo ? ' pt-visual__foto--suelto' : '') +
        '" src="' + m.src + '" alt="' + tx(sel.p.nombre) + '">';
      return;
    }
    if (m.tipo === "video") {
      caja.innerHTML = '<video class="pt-visual__foto" src="' + m.src + '" controls playsinline></video>';
      return;
    }
    /* 3D */
    var v = document.createElement("div");
    v.className = "visor3d";
    caja.appendChild(v);
    window.Visor3D.abrir(v, m.src, {
      cargando: t("v3d_cargando"), error: t("v3d_error"), ayuda: t("v3d_ayuda")
    });
    /* El apagado vive en la caja interna, pero cerrar() se llama
       sobre el host: se lo pasamos hacia arriba. */
    host.__cerrarVisor = function () { window.Visor3D.cerrar(v); };
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
      $("#pt-pn-nota-stock").textContent = n === 0
        ? t("pt_sin_combo")
        : rellena("pt_en_taller", {n: n});
    } else {
      $("#pt-pn-nota-stock").textContent = rellena("pt_se_produce", {
        p: rellena("pt_semanas", {n: p.plazo_semanas})
      });
    }

    pintarVisual();

    var total = precioUnidad(p, o) * sel.cant;
    $("#pt-pn-precio").textContent = dolar(total);
    $("#pt-pn-precio-bs").textContent = bolivar(aBs(total));
    $("#pt-pn-agregar").textContent = t("pt_agregar");
    $("#pt-pn-agregar").disabled = total === 0;
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
      return '<div class="pt-linea">' +
        '<div class="pt-linea__desc">' +
          '<b>' + l.cant + '× ' + tx(l.nombre) + '</b>' +
          (sub ? '<small>' + sub + '</small>' : '') +
          (l.uxp > 1 ? '<span class="pt-linea__packs">' +
             rellena("pt_en_total", {n: l.cant * l.uxp, cosa: tx(l.palabra_pack)}) + '</span>' : '') +
          '<button class="pt-quitar" type="button" data-i="' + i + '">' + t("pt_quitar") + '</button>' +
        '</div>' +
        '<div class="pt-linea__mon">' + dolar(l.unitario * l.cant) + '</div>' +
      '</div>';
    }).join("");

    Array.prototype.forEach.call(host.querySelectorAll(".pt-quitar"), function (b) {
      b.addEventListener("click", function () {
        carrito.splice(parseInt(b.dataset.i, 10), 1);
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
    $("#pt-pedir").textContent = t("pt_pedir");
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
  $("#pt-pn-mas").addEventListener("click", function () {
    if (!sel) return;
    var n = stockDe(sel.p, sel.o);
    if (sel.p.disponibilidad === "stock" && n !== null && sel.cant >= n) return;
    sel.cant++;
    pintarPanel();
  });
  $("#pt-pn-menos").addEventListener("click", function () {
    if (sel && sel.cant > 1) { sel.cant--; pintarPanel(); }
  });
  $("#pt-pn-agregar").addEventListener("click", function () {
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
    document.getElementById("pt-pedido-seccion").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  $("#pt-pn-cerrar").addEventListener("click", cerrarPanel);
  $("#pt-velo").addEventListener("click", cerrarPanel);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrarPanel(); });

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
