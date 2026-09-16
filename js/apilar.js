/* ============================================================
   APILAR TABLAS — easter egg (él, 16/09/2026)
   Se abre con el huevo del pie de página. sitio.js carga este
   archivo SOLO al tocar el huevo, así que no pesa en la visita
   normal.
   Juego: una tabla va y viene sobre la pila; tocar (o espacio)
   la suelta. Lo que sobresale se corta y cae. Si no queda nada
   encima, se acaba. Soltarla casi justa (≤ 4 px) cuenta como
   corte perfecto y la tabla no pierde ancho.
   El récord vive en el navegador de cada quien (localStorage),
   sin cuentas ni servidor.
   ============================================================ */
(function () {
  "use strict";

  var CLAVE = "pa-apilar-record";
  var MADERAS = ["#B7793F", "#8A5A3B", "#C9A06A", "#6E4A33", "#A8683A"];
  var ALTO = 22;            /* alto de cada tabla, en px de dibujo */
  var ANCHO_JUEGO = 360;    /* ancho lógico del lienzo */
  var ALTO_JUEGO = 560;

  var es = (document.documentElement.lang || "es").indexOf("en") !== 0;
  var T = es
    ? { titulo: "apilar tablas", tocar: "toca para soltar la tabla", fin: "se cayó la pila", otra: "toca para jugar otra vez", general: "récord general", personal: "personal", cerrar: "Cerrar" }
    : { titulo: "stack the boards", tocar: "tap to drop the board", fin: "the stack fell", otra: "tap to play again", general: "world best", personal: "yours", cerrar: "Close" };

  /* RÉCORD GENERAL (él, 16/09/2026): el mejor de cualquier visitante,
     anónimo. Una página estática no puede guardarlo sola: lo guarda un
     Worker de Cloudflare cuya dirección va en MARCA.apilar_api
     (datos/marca.js). Mientras esa dirección no exista, el récord
     general no se muestra y todo lo demás funciona igual.
     El Worker: Herramientas/Sitio/record-apilar-worker.js. */
  var API = (window.MARCA && window.MARCA.apilar_api) || "";
  var general = null;
  function pedirGeneral() {
    if (!API) return;
    fetch(API, { cache: "no-store" }).then(function (r) { return r.json(); })
      .then(function (d) { if (typeof d.record === "number") { general = d.record; pintarMarcador(); } })
      .catch(function () {});
  }
  function enviarGeneral(n) {
    if (!API) return;
    fetch(API, { method: "POST", headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({ puntos: n }) })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (typeof d.record === "number") { general = d.record; pintarMarcador(); } })
      .catch(function () {});
  }

  function leerRecord() { try { return parseInt(localStorage.getItem(CLAVE), 10) || 0; } catch (e) { return 0; } }
  function guardarRecord(n) { try { localStorage.setItem(CLAVE, String(n)); } catch (e) {} }

  var caja, lienzo, ctx, marcador, aviso, animacion = null;
  var pila, movil, trozos, puntos, record, velocidad, camara, camaraObj, estado;

  function color(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "#fff"; }

  function construir() {
    caja = document.createElement("div");
    caja.className = "apilar";
    caja.setAttribute("role", "dialog");
    caja.setAttribute("aria-modal", "true");
    caja.setAttribute("aria-label", T.titulo);
    caja.innerHTML =
      '<div class="apilar__caja">' +
        '<div class="apilar__arriba">' +
          '<span class="apilar__marcador"></span>' +
          '<button type="button" class="apilar__cerrar" aria-label="' + T.cerrar + '">&times;</button>' +
        '</div>' +
        '<canvas class="apilar__lienzo"></canvas>' +
        '<p class="apilar__aviso"></p>' +
      '</div>';
    document.body.appendChild(caja);
    lienzo = caja.querySelector("canvas");
    ctx = lienzo.getContext("2d");
    marcador = caja.querySelector(".apilar__marcador");
    aviso = caja.querySelector(".apilar__aviso");

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    lienzo.width = ANCHO_JUEGO * dpr;
    lienzo.height = ALTO_JUEGO * dpr;
    ctx.scale(dpr, dpr);

    caja.querySelector(".apilar__cerrar").addEventListener("click", cerrar);
    caja.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".apilar__cerrar")) return;
      if (e.target === caja) { cerrar(); return; }   /* tocar fuera cierra */
      e.preventDefault();
      accion();
    });
    document.addEventListener("keydown", teclas);
  }

  function teclas(e) {
    if (!caja || !caja.classList.contains("abierto")) return;
    if (e.key === "Escape") cerrar();
    else if (e.key === " " || e.key === "Enter") { e.preventDefault(); accion(); }
  }

  function empezar() {
    var ancho0 = 200;
    pila = [{ x: (ANCHO_JUEGO - ancho0) / 2, w: ancho0, c: MADERAS[0] }];
    trozos = [];
    puntos = 0;
    record = leerRecord();
    velocidad = 2.2;
    camara = 0; camaraObj = 0;
    nuevaTabla();
    estado = "jugando";
    aviso.textContent = T.tocar;
    pintarMarcador();
  }

  function nuevaTabla() {
    var arriba = pila[pila.length - 1];
    var desdeIzq = pila.length % 2 === 0;
    movil = {
      x: desdeIzq ? -arriba.w : ANCHO_JUEGO,
      w: arriba.w,
      dir: desdeIzq ? 1 : -1,
      c: MADERAS[pila.length % MADERAS.length]
    };
  }

  function accion() {
    if (estado === "fin") { empezar(); return; }
    var arriba = pila[pila.length - 1];
    var ini = Math.max(movil.x, arriba.x);
    var fin = Math.min(movil.x + movil.w, arriba.x + arriba.w);
    var solape = fin - ini;
    var nivel = pila.length;

    if (solape <= 0) {
      trozos.push({ x: movil.x, w: movil.w, y: nivel, vy: 0, c: movil.c });
      terminar();
      return;
    }
    if (Math.abs(movil.x - arriba.x) <= 4) {
      /* corte perfecto: encaja justo encima, sin perder nada */
      pila.push({ x: arriba.x, w: arriba.w, c: movil.c, brillo: 1 });
    } else {
      if (movil.x < arriba.x) trozos.push({ x: movil.x, w: arriba.x - movil.x, y: nivel, vy: 0, c: movil.c });
      if (movil.x + movil.w > arriba.x + arriba.w) {
        trozos.push({ x: arriba.x + arriba.w, w: movil.x + movil.w - arriba.x - arriba.w, y: nivel, vy: 0, c: movil.c });
      }
      pila.push({ x: ini, w: solape, c: movil.c });
    }
    puntos++;
    velocidad = Math.min(6, 2.2 + puntos * 0.12);
    var altura = pila.length * ALTO;
    if (altura > ALTO_JUEGO * 0.55) camaraObj = altura - ALTO_JUEGO * 0.55;
    nuevaTabla();
    pintarMarcador();
  }

  function terminar() {
    estado = "fin";
    if (puntos > record) { record = puntos; guardarRecord(record); }
    if (puntos > 0 && (general === null || puntos > general)) {
      general = Math.max(general || 0, puntos);
      enviarGeneral(puntos);
    }
    pintarMarcador();
    aviso.textContent = T.fin + " · " + T.otra;
  }

  function pintarMarcador() {
    var s = "";
    if (general !== null) s += T.general + " " + Math.max(general, puntos) + "  ·  ";
    s += T.personal + " " + Math.max(record, puntos);
    marcador.textContent = s;
  }

  function yDe(nivel) { return ALTO_JUEGO - (nivel + 1) * ALTO + camara; }

  function tabla(x, y, w, c, brillo) {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, ALTO - 2);
    ctx.fillStyle = "rgba(0,0,0,.18)";           /* canto inferior */
    ctx.fillRect(x, y + ALTO - 6, w, 4);
    ctx.fillStyle = "rgba(255,255,255,.12)";     /* veta */
    ctx.fillRect(x + 4, y + 6, Math.max(0, w - 8), 1);
    if (brillo) {
      ctx.strokeStyle = "rgba(255,255,255," + brillo + ")";
      ctx.strokeRect(x + .5, y + .5, w - 1, ALTO - 3);
    }
  }

  function cuadro() {
    animacion = requestAnimationFrame(cuadro);
    camara += (camaraObj - camara) * 0.12;

    if (estado === "jugando") {
      movil.x += movil.dir * velocidad;
      var arriba = pila[pila.length - 1];
      var limIzq = Math.min(arriba.x - movil.w * 0.9, 0) - 20;
      var limDer = Math.max(arriba.x + arriba.w + movil.w * 0.9, ANCHO_JUEGO) + 20 - movil.w;
      if (movil.x > limDer) movil.dir = -1;
      if (movil.x < limIzq) movil.dir = 1;
    }

    ctx.fillStyle = color("--caja");
    ctx.fillRect(0, 0, ANCHO_JUEGO, ALTO_JUEGO);

    pila.forEach(function (b, i) {
      var y = yDe(i);
      if (y > ALTO_JUEGO || y < -ALTO) return;
      tabla(b.x, y, b.w, b.c, b.brillo);
      if (b.brillo) b.brillo = Math.max(0, b.brillo - 0.04);
    });

    trozos = trozos.filter(function (t) {
      t.vy += 0.5;
      t.caida = (t.caida || 0) + t.vy;
      var y = yDe(t.y) + t.caida;
      tabla(t.x, y, t.w, t.c);
      return y < ALTO_JUEGO + 40;
    });

    if (estado === "jugando") tabla(movil.x, yDe(pila.length), movil.w, movil.c);

    ctx.fillStyle = color("--tinta");
    ctx.font = "700 44px Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.globalAlpha = 0.18;
    ctx.fillText(String(puntos), ANCHO_JUEGO / 2, 70);
    ctx.globalAlpha = 1;
  }

  function abrir() {
    if (!caja) construir();
    caja.classList.add("abierto");
    document.documentElement.classList.add("apilar-abierto");
    empezar();
    pedirGeneral();
    if (!animacion) cuadro();
    caja.querySelector(".apilar__cerrar").focus();
  }

  function cerrar() {
    if (!caja) return;
    caja.classList.remove("abierto");
    document.documentElement.classList.remove("apilar-abierto");
    if (animacion) cancelAnimationFrame(animacion);
    animacion = null;
    var huevo = document.querySelector(".pie__huevo");
    if (huevo) huevo.focus();
  }

  window.PA_APILAR = { abrir: abrir };
})();
