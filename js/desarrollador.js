(function () {
  "use strict";
  var host = document.getElementById("cabecera");
  if (!host) return;
  var zona, hamb, panel, contador = 0, reinicio, pendiente;
  var herramientas = [
    ["Configurador de texturas", "Cocina Ery", "/proyectos/cocina-ery/"],
    ["Catálogo de materiales", "En desarrollo", "/materiales/"],
    ["Configurador de espacios", "Demo 01", "/espacios/"]
  ];

  function cerrar(devolverFoco) {
    if (!panel || panel.hidden) return;
    panel.hidden = true;
    if (zona) zona.setAttribute("aria-expanded", "false");
    if (devolverFoco && hamb && hamb.isConnected) hamb.focus({preventScroll: true});
  }
  function crearPanel() {
    panel = document.createElement("section");
    panel.className = "desarrollador";
    panel.id = "ago-desarrollador";
    panel.setAttribute("aria-labelledby", "ago-desarrollador-titulo");
    panel.hidden = true;
    var cabecera = document.createElement("div");
    cabecera.className = "desarrollador__cabecera";
    var titulo = document.createElement("h2");
    titulo.id = "ago-desarrollador-titulo";
    titulo.textContent = "desarrollador";
    var cierre = document.createElement("button");
    cierre.type = "button";
    cierre.className = "desarrollador__cerrar";
    cierre.setAttribute("aria-label", "Cerrar desarrollador");
    cierre.textContent = "×";
    cierre.addEventListener("click", function () { cerrar(true); });
    cabecera.append(titulo, cierre);
    var nav = document.createElement("nav");
    nav.setAttribute("aria-label", "Herramientas de desarrollo");
    herramientas.forEach(function (datos) {
      var enlace = document.createElement("a");
      enlace.href = datos[2];
      var nombre = document.createElement("span");
      nombre.textContent = datos[0];
      var estado = document.createElement("small");
      estado.textContent = datos[1];
      enlace.append(nombre, estado);
      enlace.addEventListener("click", function () { cerrar(false); });
      nav.appendChild(enlace);
    });
    panel.append(cabecera, nav);
    document.body.appendChild(panel);
  }
  function alternar() {
    if (!panel) crearPanel();
    if (!panel.hidden) { cerrar(true); return; }
    if (hamb.getAttribute("aria-expanded") === "true") hamb.click();
    panel.hidden = false;
    zona.setAttribute("aria-expanded", "true");
    colocar();
    panel.querySelector("a").focus({preventScroll: true});
  }
  function colocar() {
    pendiente = null;
    if (!zona || !zona.isConnected || !hamb) return;
    var h = hamb.getBoundingClientRect(), cab = host.getBoundingClientRect();
    var lupa = host.querySelector(".cabecera__botones .lupa:not(.bolsa)");
    var l = lupa && lupa.getBoundingClientRect();
    // En móvil la lupa vive dentro del menú: se usa el hueco inmediatamente a la izquierda del ☰.
    var lupaEnFila = l && l.width && Math.abs(l.top - h.top) < h.height;
    var iconoHamb = hamb.querySelector("svg");
    var limite = lupaEnFila || !iconoHamb ? h.left : iconoHamb.getBoundingClientRect().left;
    var izquierda = lupaEnFila ? l.right : limite - 24;
    Array.from(host.querySelectorAll("a,button")).forEach(function (control) {
      if (control === hamb || control === zona) return;
      var r = control.getBoundingClientRect();
      if (r.width && r.right <= h.left && r.top < h.bottom && r.bottom > h.top) izquierda = Math.max(izquierda, r.right);
    });
    var ancho = Math.max(0, limite - izquierda);
    zona.style.left = (izquierda - cab.left) + "px";
    zona.style.top = (h.top - cab.top) + "px";
    zona.style.width = ancho + "px";
    zona.style.height = h.height + "px";
    zona.hidden = ancho < 1 || h.width < 1;
    if (panel && !panel.hidden) {
      var borde = 14, anchoPanel = Math.min(340, window.innerWidth - borde * 2);
      panel.style.width = anchoPanel + "px";
      panel.style.left = Math.max(borde, Math.min(h.right - anchoPanel, window.innerWidth - anchoPanel - borde)) + "px";
      var arriba = Math.min(cab.bottom + 8, Math.max(borde, window.innerHeight - 180));
      panel.style.top = arriba + "px";
      panel.style.maxHeight = Math.max(100, window.innerHeight - arriba - borde) + "px";
    }
  }
  function programar() {
    if (!pendiente) pendiente = requestAnimationFrame(colocar);
  }
  function instalar() {
    if (zona && zona.isConnected) return;
    cerrar(false);
    hamb = host.querySelector(".hamburguesa");
    if (!hamb) return;
    contador = 0;
    clearTimeout(reinicio);
    zona = document.createElement("button");
    zona.type = "button";
    zona.className = "desarrollador-zona";
    // El acceso es intencionadamente invisible y no añade una parada a la navegación normal.
    zona.tabIndex = -1;
    zona.setAttribute("aria-hidden", "true");
    zona.setAttribute("aria-controls", "ago-desarrollador");
    zona.setAttribute("aria-expanded", "false");
    zona.addEventListener("click", function (event) {
      event.preventDefault();
      clearTimeout(reinicio);
      contador += 1;
      if (contador === 5) { contador = 0; alternar(); }
      else reinicio = setTimeout(function () { contador = 0; }, 1600);
    });
    host.appendChild(zona);
    colocar();
  }
  document.addEventListener("pointerdown", function (event) {
    if (panel && !panel.hidden && !panel.contains(event.target) && event.target !== zona) cerrar(false);
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && panel && !panel.hidden) { cerrar(true); event.preventDefault(); }
  });
  document.addEventListener("focusin", function (event) {
    if (panel && !panel.hidden && !panel.contains(event.target) && event.target !== zona) cerrar(false);
  });
  window.addEventListener("resize", programar, {passive: true});
  window.addEventListener("scroll", function () { cerrar(false); programar(); }, {passive: true});
  host.addEventListener("transitionend", programar);
  new MutationObserver(function () { instalar(); programar(); }).observe(host, {childList: true, subtree: true});
  if (window.ResizeObserver) new ResizeObserver(programar).observe(host);
  instalar();
})();
