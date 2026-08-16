/* ============================================================
   INTERRUPTOR PARA COMPARAR LA TIPOGRAFÍA
   ------------------------------------------------------------
   Pone un botón abajo a la derecha que enciende y apaga
   `css/tipografia-nueva.css`. Sirve para ver la escala vieja y la
   nueva sobre la misma página, alternando, en vez de imaginárselo.

   SOLO SALE EN LOCAL. Se comprueba el nombre del servidor: en
   localhost aparece, en sjdsr21.github.io no. Así este archivo
   puede quedarse en el repositorio sin ensuciar el sitio
   publicado, y no hay que acordarse de quitarlo antes de subir.

   La elección se guarda, así que se puede navegar entre páginas
   con la escala nueva puesta y ver cómo queda el sitio entero.

   ATAJO: Alt + T alterna sin tocar el botón.

   CUANDO SE DECIDA:
     · si la escala nueva se queda, se pasan sus valores a las
       hojas de siempre y se borran este archivo, el
       css/tipografia-nueva.css y las dos líneas que los cargan.
     · si no se queda, se borra lo mismo y ya está: las hojas
       originales no se han tocado en ningún momento.
   ============================================================ */
(function () {
  "use strict";

  var LOCAL = /^(localhost|127\.0\.0\.1|\[::1\]|)$/.test(location.hostname);
  if (!LOCAL) return;

  var CLAVE = "pa-tipo-nueva";
  var raiz = document.documentElement;

  function puesta() {
    try { return localStorage.getItem(CLAVE) === "1"; } catch (e) { return false; }
  }

  /* Se aplica ANTES de que pinte nada, para que no se vea la
     página saltar de una escala a la otra al cargar. */
  function aplicar(si) {
    raiz.classList.toggle("tipo-nueva", si);
    try { localStorage.setItem(CLAVE, si ? "1" : "0"); } catch (e) {}
  }
  aplicar(puesta());

  /* Los estilos del propio interruptor van AQUÍ y no en una hoja:
     así este archivo es autosuficiente y borrarlo se lo lleva
     todo. Van con tamaños en px a propósito — es una herramienta
     de trabajo, no parte del sitio, y no debe cambiar de tamaño
     cuando se pulse el botón (si no, no se puede leer lo que
     dice). */
  var ESTILO = [
    "#tipo-interruptor{position:fixed;right:16px;bottom:16px;z-index:9;",
    "  display:flex;flex-direction:column;align-items:stretch;gap:0;",
    "  font-family:'Roboto',system-ui,sans-serif;",
    "  border:1px solid var(--linea,#2E2E2E);background:var(--caja,#0D0D0D);",
    "  box-shadow:0 6px 24px -8px rgba(0,0,0,.6)}",
    "#tipo-interruptor button{font:inherit;font-size:12px;font-weight:700;",
    "  letter-spacing:.09em;text-transform:uppercase;cursor:pointer;",
    "  padding:9px 14px;border:0;border-bottom:1px solid var(--linea,#2E2E2E);",
    "  background:transparent;color:var(--tinta,#fff)}",
    "#tipo-interruptor button:hover{background:var(--caja-alta,#171717)}",
    "#tipo-interruptor.tipo-interruptor--on button{",
    "  background:var(--realce-hondo,#B4441F);color:#fff;border-bottom-color:transparent}",
    ".tipo-interruptor__nota{font-size:10px;line-height:1;padding:7px 14px 8px;",
    "  color:var(--apagado,#A0A0A0);letter-spacing:.04em;white-space:nowrap}",
    "@media (max-width:520px){#tipo-interruptor{right:8px;bottom:8px}}",
    "@media print{#tipo-interruptor{display:none}}"
  ].join("");

  function montar() {
    if (document.getElementById("tipo-interruptor")) return;

    var hoja = document.createElement("style");
    hoja.textContent = ESTILO;
    document.head.appendChild(hoja);

    var caja = document.createElement("div");
    caja.id = "tipo-interruptor";

    var boton = document.createElement("button");
    boton.type = "button";

    var nota = document.createElement("span");
    nota.className = "tipo-interruptor__nota";

    function pintar() {
      var si = raiz.classList.contains("tipo-nueva");
      boton.textContent = si ? "Escala NUEVA" : "Escala actual";
      boton.setAttribute("aria-pressed", si ? "true" : "false");
      caja.classList.toggle("tipo-interruptor--on", si);
      nota.textContent = si ? "cuerpo 16 px · 6 tamaños"
                            : "cuerpo 11,8-15,2 px · 21 tamaños";
    }

    function alternar() {
      aplicar(!raiz.classList.contains("tipo-nueva"));
      pintar();
    }

    boton.addEventListener("click", alternar);
    document.addEventListener("keydown", function (e) {
      if (e.altKey && (e.key === "t" || e.key === "T")) { e.preventDefault(); alternar(); }
    });

    caja.appendChild(boton);
    caja.appendChild(nota);
    document.body.appendChild(caja);
    pintar();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", montar, { once: true });
  } else {
    montar();
  }
})();
