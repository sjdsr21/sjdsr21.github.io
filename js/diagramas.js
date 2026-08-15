/* ============================================================
   DIAGRAMAS TÉCNICOS
   ------------------------------------------------------------
   Dibujos de cota para el panel de producto. Son SVG generados
   aquí, no imágenes: así heredan el color del tema (todo va con
   `currentColor`) y se ven nítidos a cualquier tamaño.

   Todo se dibuja en CENTÍMETROS y se escala al final, de modo
   que las medidas del código son las de la pieza real. Las cotas
   salen de dos sitios:

   · Tablas de picar y Butcher Block — de la ficha de venta.
   · Bases de laptop — MEDIDAS DEL MODELO 3D (12/08/2026), que
     era el único sitio donde existían. Calibrado contra la tabla
     S y la M, que coinciden al milímetro con lo declarado.

   OJO: la tabla L y el Butcher Block L miden en el modelo 2 cm
   más de espesor que lo que dice su ficha (5,5 contra 3,5 y 4).
   Aquí manda la ficha, que es lo que se vende. Si se corrige uno
   de los dos, hay que corregir el otro.
   ============================================================ */

window.DIAGRAMAS = (function () {
  "use strict";

  var ESC = 7;          /* píxeles por centímetro */
  var MARGEN = 34;      /* sitio para las cotas alrededor */

  function cm(v) { return v * ESC; }

  /* ---------- piezas sueltas de dibujo técnico --------------- */

  /* Cota horizontal: línea con flechas, líneas de referencia que
     bajan de la pieza, y el número encima. */
  function cotaH(x1, x2, y, texto, refArriba) {
    var d = refArriba || 0;
    return '' +
      '<path class="dg-ref" d="M' + x1 + ',' + (y - d) + ' L' + x1 + ',' + (y + 5) + '"/>' +
      '<path class="dg-ref" d="M' + x2 + ',' + (y - d) + ' L' + x2 + ',' + (y + 5) + '"/>' +
      '<path class="dg-cota" marker-start="url(#dgf)" marker-end="url(#dgf)" ' +
        'd="M' + x1 + ',' + y + ' L' + x2 + ',' + y + '"/>' +
      '<text class="dg-txt" x="' + ((x1 + x2) / 2) + '" y="' + (y - 5) + '" ' +
        'text-anchor="middle">' + texto + '</text>';
  }

  /* Cota vertical. `lado` -1 la pone a la izquierda del dibujo. */
  function cotaV(y1, y2, x, texto, ref, lado) {
    var s = lado || 1;
    return '' +
      '<path class="dg-ref" d="M' + (x - s * ref) + ',' + y1 + ' L' + (x + s * 5) + ',' + y1 + '"/>' +
      '<path class="dg-ref" d="M' + (x - s * ref) + ',' + y2 + ' L' + (x + s * 5) + ',' + y2 + '"/>' +
      '<path class="dg-cota" marker-start="url(#dgf)" marker-end="url(#dgf)" ' +
        'd="M' + x + ',' + y1 + ' L' + x + ',' + y2 + '"/>' +
      '<text class="dg-txt" x="' + (x + s * 7) + '" y="' + ((y1 + y2) / 2) + '" ' +
        'text-anchor="' + (s > 0 ? 'start' : 'end') + '" dominant-baseline="middle">' +
        texto + '</text>';
  }

  function envoltura(ancho, alto, dentro, titulo) {
    return '<svg class="dg" viewBox="0 0 ' + ancho + ' ' + alto + '" ' +
      'role="img" aria-label="' + titulo + '">' +
      '<defs><marker id="dgf" viewBox="0 0 10 10" refX="9" refY="5" ' +
        'markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
        '<path d="M0,1 L9,5 L0,9 z" fill="currentColor"/></marker></defs>' +
      dentro + '</svg>';
  }

  /* Un portátil abierto, visto de lado. `abierto` es el ángulo de
     la pantalla respecto de la base. Se dibuja tumbado sobre el
     punto (x,y), que es la esquina delantera de la base. */
  function portatil(x, y, largoBase, inclinacion, abierto) {
    var rad = inclinacion * Math.PI / 180;
    var bx = Math.cos(rad) * cm(largoBase);
    var by = -Math.sin(rad) * cm(largoBase);
    /* la pantalla sale del extremo trasero de la base */
    var ax = (inclinacion + abierto) * Math.PI / 180;
    var px = x + bx + Math.cos(ax) * cm(largoBase * 0.95);
    var py = y + by - Math.sin(ax) * cm(largoBase * 0.95);
    return '' +
      '<path class="dg-obj" d="M' + x + ',' + y + ' L' + (x + bx) + ',' + (y + by) + '"/>' +
      '<path class="dg-obj" d="M' + (x + bx) + ',' + (y + by) + ' L' + px + ',' + py + '"/>' +
      '<text class="dg-nota" x="' + ((x + bx + px) / 2 + 8) + '" y="' + ((y + by + py) / 2) + '">' +
        'portátil' + '</text>';
  }

  /* =========================================================
     BASES DE LAPTOP — alzado lateral
     ========================================================= */
  function baseLaptop(o) {
    var fondo = cm(o.fondo), alto = cm(o.alto);

    /* El alto del lienzo NO puede ser fijo: el portátil abierto
       sobresale bastante por encima de la pieza, y con un alto
       calculado a ojo la pantalla se salía del dibujo. Se calcula
       cuánto sube de verdad y se le da sitio.
       El brazo va del frente de la pieza hasta `caida`; sobre él
       apoya la base del portátil, y de ahí sale la pantalla. */
    var angBrazo = Math.atan2(alto * o.caida - cm(o.frente), fondo * o.hombro);
    var angPantalla = angBrazo + o.tapa * Math.PI / 180;
    var subeBase = Math.sin(angBrazo) * cm(o.laptop);
    var subePant = Math.sin(angPantalla) * cm(o.laptop * 0.95);
    var cima = cm(o.frente) + Math.max(alto, subeBase + Math.max(0, subePant));

    /* 3.8 y no 3.2: a la derecha va la cota de altura con su
       número, y con el margen justo el texto se salía del lienzo
       en la base baja. */
    var W = fondo + MARGEN * 3.8;
    var H = cima + MARGEN * 2.4;
    var x0 = MARGEN * 1.1, suelo = H - MARGEN * 1.4;

    /* Perfil esquemático: montante trasero con el canto curvo y
       un brazo inclinado que es donde apoya el portátil. */
    var xTras = x0 + fondo, yAlto = suelo - alto;
    var perfil =
      'M' + x0 + ',' + suelo +
      ' L' + xTras + ',' + suelo +
      ' L' + xTras + ',' + (yAlto + cm(2.2)) +
      ' Q' + xTras + ',' + yAlto + ' ' + (xTras - cm(2.2)) + ',' + yAlto +
      ' L' + (x0 + fondo * o.hombro) + ',' + (suelo - alto * o.caida) +
      ' L' + x0 + ',' + (suelo - cm(o.frente)) +
      ' Z';

    var g = '<g class="dg-pieza">' +
      '<path class="dg-obj dg-relleno" d="' + perfil + '"/>' +
      /* travesaño */
      '<circle class="dg-obj" cx="' + (xTras - cm(1.6)) + '" cy="' + (yAlto + cm(3.2)) + '" r="' + cm(0.9) + '"/>' +
      '</g>';

    /* El portátil apoyado en el brazo inclinado. */
    var angulo = Math.atan2(alto * o.caida - cm(o.frente), fondo * o.hombro) * 180 / Math.PI;
    g += '<g class="dg-fantasma">' +
      portatil(x0 + cm(1), suelo - cm(o.frente) - cm(0.4), o.laptop, angulo, o.tapa) +
      '</g>';

    /* suelo */
    g += '<path class="dg-suelo" d="M' + (x0 - 14) + ',' + suelo + ' L' + (xTras + 14) + ',' + suelo + '"/>';

    /* cotas: la altura es la protagonista, va en acento */
    g += '<g class="dg-destacada">' +
      cotaV(suelo, yAlto, xTras + MARGEN * 0.75, o.alto + ' cm', fondo * 0.12, 1) +
      '</g>';
    g += cotaH(x0, xTras, suelo + MARGEN * 0.8, o.fondo + ' cm', 0);
    g += '<text class="dg-nota" x="' + x0 + '" y="' + (H - 9) + '">ancho ' + o.ancho + ' cm</text>';

    return envoltura(W, H, g, o.titulo);
  }

  /* =========================================================
     BASE ALTA — alzado lateral, las dos configuraciones
     ---------------------------------------------------------
     Esto NO es el esquema de `baseLaptop`: es la silueta real
     trazada de sus vistas laterales de SketchUp del 14/08/2026
     (`Base Alta de Laptop Saman 1 plano configuracion baja.skp`).

     La pieza es AJUSTABLE: la aleta gira sobre un pasador y se
     fija en dos posiciones. Por eso aquí NO hay dos dibujos
     sueltos sino UNA geometría con dos ángulos, y las alturas
     salen CALCULADAS. Que den 17,69 y 20,50 —sus cotas— es la
     comprobación de que el trazado es correcto; si alguien toca
     el perfil y los números dejan de salir, el perfil está mal.

     El ángulo se despeja en cerrado. La altura del vértice de la
     aleta, girada φ desde la vertical, es:

         h(φ) = PIVOTE_Y + L·cos φ − V·sin φ
              = PIVOTE_Y + R·cos(φ + δ)

     con R = √(L² + V²) y δ = atan(V/L). De ahí φ sale de un
     arcocoseno y no de tantear.

     OJO con la cota de altura TOTAL (46,89 / 55,69): depende de
     cuánto abra la tapa, que es cosa del portátil y no de la
     pieza. Por eso el ángulo de la tapa no está escrito a mano
     sino DESPEJADO de esa altura: el dibujo reproduce sus
     renders exactamente, pero la cifra es ilustrativa.
     ========================================================= */

  /* --- la pieza, en centímetros ---------------------------- */

  /* La bandeja: trapecio con los cantos abiertos hacia arriba y
     la muesca donde entra el morro del portátil. */
  var BANDEJA = { fondo: 24, alto: 8.8, sangra: 2 };
  var MUESCA  = { x: 20.8, r: 2.1 };

  /* La aleta, en su propio sistema: el origen es el pasador,
     +u a lo largo de la aleta y +v hacia el frente. */
  var ALETA = {
    pivote: { x: 14.6, y: 2.0 },
    perfil: [ [-2.5, -3.7], [-2.5, 3.8], [13.0, 3.8] ],  /* [u,v] hasta el arranque de la curva */
    curva:  { ctrl: [17.0, 3.8], fin: [18.7, 0.9] },     /* el canto redondeado */
    baja:   [ [9.0, -1.6], [-3.7, -2.5] ],               /* el regreso por detrás */
    vertice: [18.7, 0.9]
  };

  /* El portátil de los renders. La base se toma de la vista (24
     cm de fondo); el largo de la tapa y su apertura NO se
     inventan: se calibran abajo contra sus dos alturas. */
  var PORTATIL = { base: 24 };

  /* Las dos configuraciones, medidas por él en SketchUp el
     14/08/2026. Son la entrada de todo el dibujo.

     `tapaSuelo` es el ángulo al que se ve la pantalla sobre el
     suelo en cada una de sus vistas. No es una cota: es lo que
     se usa para escoger el largo de la tapa, para que el dibujo
     se parezca a lo que él mandó. */
  var OBJETIVOS = [
    { etiqueta: "Configuración baja", altura: 17.69, total: 46.89, tapaSuelo: 97 },
    { etiqueta: "Configuración alta", altura: 20.50, total: 55.69, tapaSuelo: 90 }
  ];

  /* Gira un punto [u,v] de la aleta φ radianes. Devuelve
     centímetros en el mundo: x hacia el frente, y hacia arriba
     desde el suelo. φ se mide desde la vertical, cayendo hacia
     atrás. */
  function giraAleta(uv, phi) {
    var s = Math.sin(phi), c = Math.cos(phi);
    return [ALETA.pivote.x + uv[1] * c - uv[0] * s,
            ALETA.pivote.y + uv[0] * c + uv[1] * s];
  }

  /* El contorno de la aleta como lista densa de puntos, con la
     curva del canto YA MUESTREADA. Hace falta densa y no solo
     los vértices porque el punto más alto de la aleta cae DENTRO
     de esa curva, no en una esquina. */
  function contornoAleta(phi) {
    var pts = ALETA.perfil.map(function (uv) { return giraAleta(uv, phi); });
    var p0 = ALETA.perfil[ALETA.perfil.length - 1],
        pc = ALETA.curva.ctrl, p1 = ALETA.curva.fin;
    for (var i = 1; i <= 24; i++) {
      var t = i / 24, m = 1 - t;
      pts.push(giraAleta([m * m * p0[0] + 2 * m * t * pc[0] + t * t * p1[0],
                          m * m * p0[1] + 2 * m * t * pc[1] + t * t * p1[1]], phi));
    }
    ALETA.baja.forEach(function (uv) { pts.push(giraAleta(uv, phi)); });
    return pts;
  }

  function alturaAleta(phi) {
    return contornoAleta(phi).reduce(function (a, p) { return Math.max(a, p[1]); }, -1e9);
  }

  /* El ángulo al que hay que poner la aleta para que su punto más
     alto quede a `altura` del suelo.

     Antes esto se despejaba en cerrado contra un vértice fijo, y
     ESO MENTÍA: la cota decía 17,69 y la aleta dibujada medía
     18,60, porque el punto más alto no es el vértice sino el
     hombro de la curva, y cuál de los dos manda cambia con el
     ángulo. Se resuelve por bisección sobre la altura real del
     contorno, que no se puede desincronizar del dibujo. */
  function anguloParaAltura(altura) {
    var lo = 0, hi = Math.PI / 3;                 /* de vertical a 60° */
    if (alturaAleta(lo) < altura) return null;    /* ni de pie llega */
    if (alturaAleta(hi) > altura) return null;    /* ni tumbada baja tanto */
    for (var i = 0; i < 60; i++) {
      var md = (lo + hi) / 2;
      if (alturaAleta(md) > altura) lo = md; else hi = md;
    }
    return (lo + hi) / 2;
  }

  /* ---- el portátil, calibrado contra SUS DOS renders --------
     La altura total no es una propiedad de la pieza: depende del
     portátil y de cuánto se abra la tapa. Pero si sus dos vistas
     llevan el MISMO portátil abierto IGUAL —que es lo lógico,
     son dos fotos del mismo montaje—, entonces existe un único
     par (largo de tapa, apertura) que da las dos alturas a la
     vez. Eso es lo que se busca aquí.

     Se hace así y no fijando el ángulo a ojo porque antes la
     tapa salía a 120° del suelo en una vista y a 70° en la otra:
     dos portátiles distintos, que es justo lo que un plano no
     puede hacer. */
  function apoyos(phi) {
    var c = contornoAleta(phi);
    var A = c.reduce(function (a, p) { return p[1] > a[1] ? p : a; }, c[0]);
    return { A: A, F: [MUESCA.x, BANDEJA.alto - 1.2] };
  }

  /* Altura de la punta de la tapa, en cm sobre el suelo. */
  function alturaPunta(phi, largoTapa, apertura) {
    var q = apoyos(phi);
    var dx = q.A[0] - q.F[0], dy = q.A[1] - q.F[1];
    var n = Math.sqrt(dx * dx + dy * dy);
    var ux = dx / n, uy = dy / n;
    var hy = q.F[1] + uy * PORTATIL.base;
    /* la tapa se abre girando desde la base */
    return hy + largoTapa * (-ux * Math.sin(apertura) + uy * Math.cos(apertura));
  }

  /* La apertura que deja la punta a `total`, con la tapa `L`.
     De las dos soluciones se toma la que deja la tapa más cerca
     de la vertical, que es como salen sus dos renders. */
  function aperturaPara(phi, L, total, tapaSuelo) {
    var q = apoyos(phi);
    var dx = q.A[0] - q.F[0], dy = q.A[1] - q.F[1];
    var n = Math.sqrt(dx * dx + dy * dy), ux = dx / n, uy = dy / n;
    var hy = q.F[1] + uy * PORTATIL.base;
    var k = (total - hy) / L;
    if (k > 1 || k < -1) return null;               /* no alcanza */
    /* De  −ux·sinθ + uy·cosθ = cos(θ+δ)  sale  cosδ = uy y
       sinδ = ux, o sea δ = atan2(ux, uy). Con el signo cambiado
       la punta caía 24 cm BAJO el suelo. */
    var delta = Math.atan2(ux, uy);
    return [Math.acos(k) - delta, -Math.acos(k) - delta].map(function (th) {
      var vy = -ux * Math.sin(th) + uy * Math.cos(th);
      var vx = ux * Math.cos(th) + uy * Math.sin(th);
      var grados = Math.abs(Math.atan2(vy, vx)) * 180 / Math.PI;
      /* Las dos soluciones son espejo respecto de la vertical y
         dan la MISMA altura. Se escoge por parecido al ángulo de
         su render: con el criterio de "la más vertical" la vista
         baja salía a 68° cuando en su render va a 97°, o sea la
         tapa casi cerrada en vez de casi de pie. */
      return { ang: th, desvio: Math.abs(grados - tapaSuelo) };
    }).sort(function (a, b) { return a.desvio - b.desvio; })[0].ang;
  }

  /* ---- calibración -----------------------------------------
     Se intentó primero con UNA sola apertura para las dos
     vistas, y NO EXISTE: entre configuraciones la pieza sube
     2,81 cm (17,69 → 20,50) pero la punta de la pantalla sube
     8,80 (46,89 → 55,69). Con el mismo portátil igual de abierto
     no da; el mejor compromiso dejaba las cotas a 2,3 y 2,6 cm
     del dibujo, o sea un plano que miente.

     La explicación es sencilla: en sus dos renders la tapa está
     abierta a ángulos distintos. Así que aquí el portátil es UNO
     —mismo fondo, misma tapa— y lo que cambia entre paneles es
     lo abierto que está, que es lo que de verdad pasó. El largo
     de la tapa se escoge como el que deja las dos lo más
     verticales posible, como se ven en sus vistas. */
  var PORT = (function calibrar() {
    var mejor = null;
    for (var i = 0; i <= 250; i++) {
      var L = 20 + (45 - 20) * i / 250;
      var aps = [], coste = 0, sirve = true;
      OBJETIVOS.forEach(function (o) {
        var phi = anguloParaAltura(o.altura);
        var ap = phi === null ? null : aperturaPara(phi, L, o.total, o.tapaSuelo);
        if (ap === null) { sirve = false; return; }
        aps.push(ap);
        var q = apoyos(phi);
        var dx = q.A[0] - q.F[0], dy = q.A[1] - q.F[1];
        var n = Math.sqrt(dx * dx + dy * dy), ux = dx / n, uy = dy / n;
        var vy = -ux * Math.sin(ap) + uy * Math.cos(ap);
        var vx = ux * Math.cos(ap) + uy * Math.sin(ap);
        /* lo lejos que cae la tapa del ángulo que se ve en su
           render. Antes esto pedía "lo más vertical posible" y
           salía una tapa abierta 38°, o sea casi cerrada. */
        var grados = Math.abs(Math.atan2(vy, vx)) * 180 / Math.PI;
        coste += Math.pow(grados - o.tapaSuelo, 2);
      });
      if (sirve && (!mejor || coste < mejor.coste)) mejor = { tapa: L, aperturas: aps, coste: coste };
    }
    return mejor;
  })();

  /* Un panel: la pieza a un ángulo, con su portátil y sus cotas.
     Devuelve el dibujo ya colocado en (x0, suelo). */
  function panelBase(o, x0, suelo) {
    var phi = anguloParaAltura(o.altura);
    if (phi === null) return '<text class="dg-nota" x="' + x0 + '" y="' + suelo + '">sin geometría</text>';

    var X = function (v) { return x0 + cm(v); };
    var Y = function (v) { return suelo - cm(v); };
    /* de centímetros del mundo a píxeles del dibujo */
    var P = function (uv) { var q = giraAleta(uv, phi); return [X(q[0]), Y(q[1])]; };
    var Pt = function (cmp) { return [X(cmp[0]), Y(cmp[1])]; };

    /* --- bandeja --- */
    var mIzq = MUESCA.x - MUESCA.r, mDer = MUESCA.x + MUESCA.r;
    var bandeja =
      'M' + X(BANDEJA.sangra) + ',' + Y(0) +
      ' L' + X(BANDEJA.fondo - BANDEJA.sangra) + ',' + Y(0) +
      ' L' + X(BANDEJA.fondo) + ',' + Y(BANDEJA.alto) +
      ' L' + X(mDer) + ',' + Y(BANDEJA.alto) +
      /* la muesca, cóncava hacia abajo */
      ' A' + cm(MUESCA.r) + ',' + cm(MUESCA.r) + ' 0 0 1 ' + X(mIzq) + ',' + Y(BANDEJA.alto) +
      ' L' + X(0) + ',' + Y(BANDEJA.alto) + ' Z';

    /* --- aleta --- */
    var p0 = P(ALETA.perfil[0]);
    var aleta = 'M' + p0[0] + ',' + p0[1];
    ALETA.perfil.slice(1).forEach(function (uv) {
      var p = P(uv); aleta += ' L' + p[0] + ',' + p[1];
    });
    var pc = P(ALETA.curva.ctrl), pf = P(ALETA.curva.fin);
    aleta += ' Q' + pc[0] + ',' + pc[1] + ' ' + pf[0] + ',' + pf[1];
    ALETA.baja.forEach(function (uv) {
      var p = P(uv); aleta += ' L' + p[0] + ',' + p[1];
    });
    aleta += ' Z';

    /* --- portátil: apoya en el punto más alto de la aleta y en
           la muesca. El largo de la tapa y la apertura son los
           MISMOS en los dos paneles: salen de PORT, calibrado
           una sola vez contra las dos alturas. --- */
    var q = apoyos(phi);
    var dx = q.A[0] - q.F[0], dy = q.A[1] - q.F[1];
    var n = Math.sqrt(dx * dx + dy * dy);
    var ux = dx / n, uy = dy / n;                   /* en cm, y hacia ARRIBA */
    var hCm = [q.F[0] + ux * PORTATIL.base, q.F[1] + uy * PORTATIL.base];
    /* MISMA rotación que en alturaPunta(), y en el mismo sentido:
       la base apunta arriba-atrás, así que la tapa se abre
       girando HACIA DELANTE (horario). Si estas dos fórmulas se
       separan, la cota deja de corresponder al dibujo. */
    var ap = PORT.aperturas[o.indice];
    var tCm = [hCm[0] + PORT.tapa * (ux * Math.cos(ap) + uy * Math.sin(ap)),
               hCm[1] + PORT.tapa * (-ux * Math.sin(ap) + uy * Math.cos(ap))];

    var F = Pt(q.F), H = Pt(hCm), T = Pt(tCm);

    var g = '<g class="dg-fantasma">' +
      '<path class="dg-obj" d="M' + F[0] + ',' + F[1] + ' L' + H[0] + ',' + H[1] + '"/>' +
      '<path class="dg-obj" d="M' + H[0] + ',' + H[1] + ' L' + T[0] + ',' + T[1] + '"/>' +
      '</g>';

    /* la pieza va DESPUÉS del portátil para quedar por delante */
    g += '<g class="dg-pieza">' +
      '<path class="dg-obj dg-relleno" d="' + bandeja + '"/>' +
      '<path class="dg-obj dg-relleno" d="' + aleta + '"/>' +
      '</g>';

    /* suelo */
    g += '<path class="dg-suelo" d="M' + (X(-8)) + ',' + Y(0) + ' L' + (X(BANDEJA.fondo + 3)) + ',' + Y(0) + '"/>';

    /* --- cotas --- */
    /* La altura de la PIEZA es la protagonista: es lo que se
       vende. La total con portátil va más floja y a la izquierda
       del todo, como en sus renders. */
    var xTot = X(-13), xPie = X(-7);
    /* Las líneas de referencia llegan hasta lo que cotan: la
       total hasta la punta de la tapa, la de la pieza hasta el
       punto más alto de la aleta. */
    g += cotaV(Y(0), Y(o.total), xTot, o.total.toFixed(2).replace('.', ',') + ' cm',
               Math.abs(xTot - T[0]), -1);
    g += '<g class="dg-destacada">' +
      cotaV(Y(0), Y(o.altura), xPie, o.altura.toFixed(2).replace('.', ',') + ' cm',
            Math.abs(xPie - X(q.A[0])), -1) +
      '</g>';
    g += cotaH(X(0), X(BANDEJA.fondo), Y(0) + MARGEN * 0.75, '24,00 cm', 0);

    g += '<text class="dg-nota" x="' + X(BANDEJA.fondo / 2) + '" y="' + (Y(0) + MARGEN * 1.5) + '" ' +
      'text-anchor="middle">' + o.etiqueta + '</text>';

    return g;
  }

  function baseAjustable(o) {
    /* Sitio para el portátil, que sobresale bastante por detrás
       de la pieza, y para las dos cotas de la izquierda. */
    var anchoPanel = cm(BANDEJA.fondo + 20);
    var W = anchoPanel * 2 + MARGEN;
    /* El alto lo manda la configuración MÁS ALTA, no la primera:
       con configs[0] la punta de la pantalla se salía del
       lienzo en el panel de la derecha. */
    var masAlta = Math.max.apply(null, o.configs.map(function (c) { return c.total; }));
    var H = cm(masAlta) + MARGEN * 3.4;
    var suelo = H - MARGEN * 2;

    var g = '';
    o.configs.forEach(function (c, i) {
      c.indice = i;
      /* cm(19) y no cm(15): el portátil y las dos cotas se salían
         27 px por la izquierda del lienzo. */
      g += '<g>' + panelBase(c, MARGEN * 0.4 + anchoPanel * i + cm(19), suelo) + '</g>';
    });

    /* Separador entre las dos configuraciones. */
    g += '<path class="dg-suelo" d="M' + (anchoPanel + MARGEN * 0.2) + ',' + (MARGEN * 0.3) +
         ' L' + (anchoPanel + MARGEN * 0.2) + ',' + (suelo + MARGEN * 0.6) + '"/>';

    return envoltura(W, H, g, o.titulo);
  }

  /* =========================================================
     TABLAS DE PICAR — planta, con un cambur de referencia
     ========================================================= */

  /* Cambur de unos 18 cm, tumbado. Dibujado en cm y colocado
     donde se le diga. Sirve para que se entienda el tamaño sin
     tener que leer las cotas. */
  function cambur(x, y, giro) {
    var d =
      'M1,5.2 C4.6,0.8 12.4,-0.4 17.2,2.6' +
      ' C17.9,3.1 17.6,4.1 16.7,4.0' +
      ' C12.4,2.2 6.2,3.1 2.9,6.4' +
      ' C2.2,7.1 1.0,6.3 1,5.2 Z';
    return '<g class="dg-cambur" transform="translate(' + x + ',' + y + ') ' +
      'rotate(' + (giro || 0) + ') scale(' + ESC + ')">' +
      '<path d="' + d + '"/>' +
      '<path d="M1.1,5.0 L0.1,4.4" />' +
      '</g>';
  }

  function tablaPicar(o) {
    var L = cm(o.largo), A = cm(o.ancho);
    var W = L + MARGEN * 3.4, H = A + MARGEN * 3.2;
    var x0 = MARGEN * 1.2, y0 = MARGEN * 1.1;
    var r = cm(1.2);

    var g = '<g class="dg-pieza">' +
      '<rect class="dg-obj dg-relleno" x="' + x0 + '" y="' + y0 + '" width="' + L + '" height="' + A + '" rx="' + r + '"/>' +
      /* canal recogejugos */
      '<rect class="dg-obj dg-fino" x="' + (x0 + cm(2)) + '" y="' + (y0 + cm(2)) + '" ' +
        'width="' + (L - cm(4)) + '" height="' + (A - cm(4)) + '" rx="' + (r * 0.6) + '"/>' +
      '</g>';

    /* el cambur, centrado y en diagonal suave */
    g += cambur(x0 + L / 2 - cm(9), y0 + A / 2 - cm(2.6), -8);
    g += '<text class="dg-nota dg-cambur-txt" x="' + (x0 + L / 2) + '" y="' + (y0 + A / 2 + cm(6)) + '" ' +
      'text-anchor="middle">cambur, ~18 cm · referencia de tamaño</text>';

    g += cotaH(x0, x0 + L, y0 + A + MARGEN * 0.85, o.largo + ' cm', 0);
    g += '<g class="dg-destacada">' +
      cotaV(y0, y0 + A, x0 + L + MARGEN * 0.8, o.ancho + ' cm', 0, 1) + '</g>';
    g += '<text class="dg-nota" x="' + x0 + '" y="' + (H - 9) + '">espesor ' + o.espesor + ' cm</text>';

    return envoltura(W, H, g, o.titulo);
  }

  /* =========================================================
     El catálogo de diagramas, por clave
     ========================================================= */
  var HECHOS = {
    /* Las dos configuraciones juntas, para que se entienda de un
       vistazo el rango de ajuste. Las cifras son suyas, medidas
       en SketchUp el 14/08/2026. */
    "base-alta": function () {
      return baseAjustable({
        titulo: "Base de laptop alta: configuración baja y alta, alzado lateral con cotas",
        configs: OBJETIVOS
      });
    },
    "base-baja": function () {
      return baseLaptop({
        titulo: "Base de laptop baja, alzado lateral con cotas",
        alto: 11.2, fondo: 23, ancho: 23.8,
        hombro: 0.30, caida: 0.55, frente: 2.2,
        laptop: 24, tapa: 115
      });
    },
    "tabla-s": function () {
      return tablaPicar({ titulo: "Tabla de picar S en planta, con cotas",
                          largo: 30, ancho: 20, espesor: 2.5 });
    },
    "tabla-m": function () {
      return tablaPicar({ titulo: "Tabla de picar M en planta, con cotas",
                          largo: 45, ancho: 30, espesor: 3.5 });
    },
    "tabla-l": function () {
      return tablaPicar({ titulo: "Tabla de picar L en planta, con cotas",
                          largo: 60, ancho: 40, espesor: 3.5 });
    },
    "butcher-l": function () {
      return tablaPicar({ titulo: "Butcher Block L en planta, con cotas",
                          largo: 60, ancho: 40, espesor: 4 });
    },
    "butcher-xl": function () {
      return tablaPicar({ titulo: "Butcher Block XL en planta, con cotas",
                          largo: 70, ancho: 50, espesor: 4 });
    }
  };

  return {
    /* Devuelve el SVG de una clave, o null si no existe. */
    dibujar: function (clave) {
      return HECHOS[clave] ? HECHOS[clave]() : null;
    },
    tiene: function (clave) { return !!HECHOS[clave]; }
  };
})();
