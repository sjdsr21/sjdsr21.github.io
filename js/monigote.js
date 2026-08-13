/* ============================================================
   EL MONIGOTE
   ------------------------------------------------------------
   Un muñeco de palitos que vive en la página de Exhibición y se
   mueve solo, sin que nadie le pida nada.

   Cómo está hecho, en corto:

   No hay dibujos ni fotogramas. Hay un ESQUELETO de ocho huesos
   y una POSE es solo una lista de ángulos. Para animar se
   interpola de una pose a otra con una curva suave, y algunos
   estados (correr, respirar) le suman un vaivén calculado con un
   seno encima. Eso permite tener quince movimientos distintos
   sin un solo archivo de imagen.

   Los ángulos van en grados y se miden desde ABAJO:
       0   = el hueso apunta al suelo
       90  = apunta hacia adelante
       180 = apunta al cielo
   Son ángulos ABSOLUTOS, no relativos al hueso padre. Es menos
   elegante pero mucho más fácil de afinar a ojo: si quieres el
   antebrazo horizontal, escribes 90 y ya, sin pensar en cuánto
   valía el brazo.

   El eje X se multiplica por `mira` (1 derecha, -1 izquierda),
   así que una sola pose sirve para los dos lados.

   DÓNDE VIVE: la franja rayada del borde inferior del encabezado
   es su suelo, siempre. Empieza a la izquierda, corre a la
   derecha, derrapa y se queda ahí haciendo sus cosas. No baja al
   cuerpo de la página.

   Respeta prefers-reduced-motion: si el sistema pide menos
   movimiento, el monigote no aparece.
   ============================================================ */
(function () {
  "use strict";

  /* Solo en Exhibición, por ahora. */
  if (document.body.getAttribute("data-pagina") !== "trabajos") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  /* ---------- proporciones -----------------------------------
     Copiadas de la referencia que él pasó: cabeza grande y
     rellena, miembros del mismo grosor y sin puños. Todo esto va
     en unidades y luego se multiplica por ESCALA. */
  var H = {
    cuello: 17,   /* de la cadera al cuello */
    cabeza: 6.4,  /* radio */
    brazo: 9, antebrazo: 8.5,
    muslo: 10, pierna: 10,
    espada: 17,
    guitarra: 15, cajaGuitarra: 5.5
  };
  var ESCALA = 0.86;     /* bajó de 1.15: lo quería más pequeño */

  /* ---------- poses -------------------------------------------
     Cada pose son los mismos doce números. `y` es cuánto se baja
     la cadera respecto de su altura normal (para agacharse).   */
  function pose(o) {
    var base = {
      tronco: 0, cabeza: 0, y: 0,
      hombroA: 20, codoA: -30,     /* brazo de adelante */
      hombroB: -18, codoB: 26,     /* brazo de atrás */
      caderaA: 4, rodillaA: 4,
      caderaB: -4, rodillaB: -4,
      espada: null,                /* ángulo del objeto en la mano */
      guitarra: false,             /* si es true, ese objeto se
                                      dibuja como guitarra */
      rasgueo: 0                   /* 0..1, dónde va la mano que
                                      rasga sobre las cuerdas */
    };
    for (var k in o) base[k] = o[k];
    return base;
  }

  var POSES = {
    /* De pie, de frente, manos a la cintura y codos hacia afuera. */
    quieto: pose({ hombroA: 22, codoA: -34, hombroB: -22, codoB: 34 }),

    corre:  pose({ tronco: 14, cabeza: -6 }),

    /* Andar: el tronco casi recto, nada del volcado de la carrera.
       Las amplitudes de piernas y brazos las pone el ciclo. */
    camina: pose({ tronco: 4, cabeza: -1 }),

    /* Frenada: tronco atrás, pierna de adelante estirada clavando
       el talón, la de atrás doblada, brazos abiertos aguantando
       el equilibrio. */
    derrapa: pose({ tronco: -20, cabeza: 8, y: 4,
                    hombroA: 96, codoA: 120, hombroB: -74, codoB: -104,
                    caderaA: 52, rodillaA: 44, caderaB: -30, rodillaB: -74 }),

    /* Brazos cruzados sobre el pecho. Los antebrazos van casi
       horizontales, por eso los codos se van a ±104 y las manos
       acaban pasadas del centro. */
    cruzado: pose({ tronco: -3, cabeza: -2,
                    hombroA: 34, codoA: -104, hombroB: -34, codoB: 104 }),

    /* Mano al mentón; la otra sujeta el codo, que es el gesto que
       de verdad lee como "pensando". */
    piensa: pose({ tronco: 4, cabeza: 10,
                   hombroA: 26, codoA: -150, hombroB: 14, codoB: -84 }),

    sentado: pose({ tronco: 8, y: 17,
                    hombroA: 40, codoA: 16, hombroB: -30, codoB: 10,
                    caderaA: 84, rodillaA: 4, caderaB: 72, rodillaB: -6 }),

    /* Desenvaina: la mano cruza al hombro contrario. */
    desenvaina: pose({ tronco: -8, cabeza: -6, y: 2,
                       hombroA: 128, codoA: 60, hombroB: -26, codoB: 30,
                       caderaA: 20, rodillaA: 10, caderaB: -22, rodillaB: -14,
                       espada: 30 }),

    guardia: pose({ tronco: -10, cabeza: 4, y: 3,
                    hombroA: 150, codoA: 170, hombroB: -40, codoB: -80,
                    caderaA: 30, rodillaA: 16, caderaB: -30, rodillaB: -20,
                    espada: 186 }),

    tajo: pose({ tronco: 28, cabeza: -10, y: 6,
                 hombroA: 74, codoA: 88, hombroB: -70, codoB: -110,
                 caderaA: 46, rodillaA: 30, caderaB: -38, rodillaB: -52,
                 espada: 96 }),

    estocada: pose({ tronco: 20, cabeza: -4, y: 8,
                     hombroA: 88, codoA: 92, hombroB: -84, codoB: -60,
                     caderaA: 62, rodillaA: 40, caderaB: -44, rodillaB: -60,
                     espada: 92 }),

    envaina: pose({ tronco: -4, y: 1,
                    hombroA: 40, codoA: -20, hombroB: -24, codoB: 24,
                    espada: 20 }),

    /* --- la guitarra -------------------------------------------
       Aquí `espada` NO es el ángulo de un objeto en la mano: es la
       inclinación del MÁSTIL. La guitarra se apoya en la cintura y
       las manos van a ella por cinemática inversa, así que los
       ángulos de hombro y codo de estas poses no se usan — los
       calcula dibujar(). Lo que sí manda es el tronco, las piernas
       y `rasgueo`. */
    saca_guitarra: pose({ tronco: -3, cabeza: -4, y: 1,
                          caderaA: 8, rodillaA: 6, caderaB: -8, rodillaB: -8,
                          espada: 118, guitarra: true, rasgueo: 0.15 }),

    toca1: pose({ tronco: 4, cabeza: 7, y: 2,
                  caderaA: 13, rodillaA: 9, caderaB: -13, rodillaB: -11,
                  espada: 116, guitarra: true, rasgueo: 0 }),

    toca2: pose({ tronco: 1, cabeza: -7, y: 0,
                  caderaA: 10, rodillaA: 6, caderaB: -10, rodillaB: -8,
                  espada: 121, guitarra: true, rasgueo: 1 }),

    /* El acorde final: se echa atrás y levanta el mástil. */
    acorde: pose({ tronco: -16, cabeza: 12, y: 3,
                   caderaA: 24, rodillaA: 16, caderaB: -24, rodillaB: -20,
                   espada: 138, guitarra: true, rasgueo: 0.55 })
  };

  var CLAVES = Object.keys(POSES.quieto);

  function mezclar(a, b, t) {
    var r = {};
    CLAVES.forEach(function (k) {
      if (k === "espada") {
        /* El objeto de la mano no se puede interpolar desde null,
           así que aparece y desaparece de golpe.

           OJO CON EL CIERRE. La primera versión decía «si el
           destino es null, conserva el del origen», y eso dejaba
           al monigote con la espada pegada a la mano PARA SIEMPRE:
           cada transición nueva arranca de `calcular()`, o sea del
           valor conservado, así que nunca volvía a ser null. Se
           quedaba de brazos cruzados empuñando la espada.
           Ahora se conserva SOLO mientras dura la transición y se
           suelta justo al acabarla. */
        if (a.espada == null && b.espada == null) r.espada = null;
        else if (a.espada == null) r.espada = b.espada;
        else if (b.espada == null) r.espada = t < 1 ? a.espada : null;
        else r.espada = a.espada + (b.espada - a.espada) * t;
        return;
      }
      if (k === "guitarra") {
        /* Booleano: no hay forma de interpolar "media guitarra".
           Sigue la MISMA regla que `espada`, y esto importa: si
           solo cambiara a mitad de camino, al sacar la guitarra
           desde las manos vacías se veía un instante de espada
           antes del cambio, porque el ángulo sí aparece de golpe. */
        r.guitarra = (a.espada == null) ? b.guitarra
                   : (b.espada == null) ? a.guitarra
                   : (t < .5 ? a.guitarra : b.guitarra);
        return;
      }
      r[k] = a[k] + (b[k] - a[k]) * t;
    });
    return r;
  }

  var suave = function (t) { return t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; };

  /* ---------- estado ------------------------------------------ */
  var st = {
    x: 0, y: 0,           /* posición de los PIES, en píxeles de pantalla */
    mira: 1,
    vx: 0,
    desde: POSES.quieto, hacia: POSES.quieto,
    t: 1, dur: 400,
    modo: "quieto",
    ciclo: 0,             /* fase del vaivén al correr */
    llegado: false,       /* ¿ya hizo el viaje de izquierda a derecha? */
    escenario: 1,         /* 1 = corre · 2 = casco corintio y anda */
    suelo: 0,
    guion: [],
    espera: 0
  };

  var MARGEN = 32;

  function irA(nombre, dur) {
    st.desde = calcular();
    st.hacia = POSES[nombre];
    st.t = 0;
    st.dur = dur || 380;
  }
  function calcular() {
    return mezclar(st.desde, st.hacia, suave(Math.min(1, st.t)));
  }

  /* ---------- el dibujo --------------------------------------- */
  var NS = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "monigote");
  svg.setAttribute("aria-hidden", "true");
  var grupo = document.createElementNS(NS, "g");
  svg.appendChild(grupo);

  function linea(clase) {
    var l = document.createElementNS(NS, "line");
    l.setAttribute("stroke-linecap", "round");
    if (clase) l.setAttribute("class", clase);
    grupo.appendChild(l);
    return l;
  }
  var partes = {
    tronco: linea(),
    brazoA: linea(), antebrazoA: linea(),
    brazoB: linea(), antebrazoB: linea(),
    musloA: linea(), piernaA: linea(),
    musloB: linea(), piernaB: linea(),
    espada: linea("monigote__espada")
  };
  /* ---------- la guitarra --------------------------------------
     Silueta de Stratocaster, dibujada en "espacio guitarra": el
     origen es el centro del cuerpo y el mástil sale hacia +x. El
     cuerno de arriba es más largo que el de abajo, y entre los dos
     queda la escotadura donde encaja el mástil — eso es lo que
     hace que se lea como una Strat y no como una guitarra
     genérica.
     Después se traslada, se gira y se escala de una vez con un
     solo `transform`. */
  /* El contorno, punto por punto y en sentido horario desde la
     punta del cuerno largo:
       (8.8,-5.4)  punta del cuerno de arriba, el largo
       arriba del cuerpo, cintura y bombo grande abajo
       (5.6,6.9)   punta del cuerno de abajo, más corto y romo
       y de vuelta al mástil por la escotadura de en medio     */
  var GUITARRA =
    "M 10.1,-5.4 " +
    "C 7.6,-7.6 2.8,-8.6 -1.8,-7.9 " +
    "C -6.7,-7.2 -10.2,-4.4 -10.9,-0.7 " +
    "C -11.6,3.2 -8.9,6.7 -4.5,7.9 " +
    "C -0.6,9.0 3.7,8.5 6.4,6.9 " +
    "C 7.2,5.4 7.0,3.4 6.2,2.1 " +
    "C 7.5,1.7 7.5,-1.7 6.2,-2.1 " +
    "C 6.9,-3.5 8.3,-4.8 10.1,-5.4 Z";

  var cuerpo = document.createElementNS(NS, "path");
  cuerpo.setAttribute("class", "monigote__cuerpoguit");
  cuerpo.setAttribute("d", GUITARRA);
  grupo.appendChild(cuerpo);

  var mastil = document.createElementNS(NS, "path");
  mastil.setAttribute("class", "monigote__mastil");
  /* Mástil + pala. La pala va inclinada, como la de una Strat. */
  mastil.setAttribute("d", "M 6,-1.15 L 19,-1.15 L 23.4,-3.2 L 24.4,-1.4 " +
                           "L 24.4,1.1 L 23.4,2.1 L 19,1.15 L 6,1.15 Z");
  grupo.appendChild(mastil);

  var guit = [cuerpo, mastil];
  /* Cabeza RELLENA, como en la referencia. Sin puños: él pidió un
     dibujo más simple y las bolitas de las manos sobraban. */
  var cabeza = document.createElementNS(NS, "circle");
  cabeza.setAttribute("class", "monigote__cabeza");
  grupo.appendChild(cabeza);

  /* ---------- el casco (escenario 2) ---------------------------
     Casco corintio con cresta, tipo Agamenón. Dibujado en
     "espacio cabeza": origen en el centro de la cabeza, radio 1,
     y -y es hacia arriba. Luego se escala por el radio real.
     Son dos piezas: el casquete que cubre la calota y el
     penacho, una media luna por encima. */
  var casco = document.createElementNS(NS, "path");
  casco.setAttribute("class", "monigote__casco");
  casco.setAttribute("d",
    "M -1.18,0.30 C -1.30,-0.80 -0.72,-1.34 0,-1.34 " +
    "C 0.72,-1.34 1.30,-0.80 1.18,0.30 " +
    "C 1.02,0.02 0.86,-0.14 0.72,-0.20 " +
    "C 0.30,-0.40 -0.30,-0.40 -0.72,-0.20 " +
    "C -0.86,-0.14 -1.02,0.02 -1.18,0.30 Z");
  grupo.appendChild(casco);

  var cresta = document.createElementNS(NS, "path");
  cresta.setAttribute("class", "monigote__cresta");
  cresta.setAttribute("d",
    "M -1.02,-0.92 C -0.72,-2.34 0.62,-2.52 1.16,-1.44 " +
    "C 0.72,-1.86 0.02,-1.74 -0.34,-1.30 " +
    "C -0.56,-1.04 -0.80,-0.94 -1.02,-0.92 Z");
  grupo.appendChild(cresta);

  var piezasCasco = [casco, cresta];

  function punta(x, y, ang, largo) {
    var r = ang * Math.PI / 180;
    return [x + Math.sin(r) * largo * st.mira, y + Math.cos(r) * largo];
  }
  function poner(el, a, b) {
    el.setAttribute("x1", a[0]); el.setAttribute("y1", a[1]);
    el.setAttribute("x2", b[0]); el.setAttribute("y2", b[1]);
  }

  /* ---------- cinemática inversa de un brazo -------------------
     Dado el hombro y DÓNDE tiene que acabar la mano, calcula el
     codo. Es la forma correcta de agarrar un objeto: sin esto las
     manos se colocan «a ojo» con ángulos y nunca caen justo sobre
     el mástil, que es lo que hacía que no pareciera que la tocaba.

     Es la intersección de dos círculos (uno en el hombro de radio
     brazo, otro en la mano de radio antebrazo). `lado` elige cuál
     de las dos soluciones se usa, o sea hacia dónde apunta el
     codo.                                                        */
  function codoIK(hom, mano, l1, l2, lado) {
    var dx = mano[0] - hom[0], dy = mano[1] - hom[1];
    var real = Math.sqrt(dx * dx + dy * dy) || 0.001;
    var ux = dx / real, uy = dy / real;

    /* Si el objetivo queda fuera del alcance del brazo, NO se
       estira el antebrazo: se acerca la MANO hasta donde llega.
       La primera versión solo recortaba la distancia del cálculo y
       dejaba la mano donde estaba, así que el antebrazo salía
       midiendo 8,1 px cuando el hueso mide 7,3. */
    var max = (l1 + l2) * 0.999, min = Math.abs(l1 - l2) * 1.001 + 0.001;
    var d = real;
    if (d > max) d = max;
    if (d < min) d = min;
    var fin = (d === real) ? mano : [hom[0] + ux * d, hom[1] + uy * d];

    var a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
    var h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    return {
      codo: [hom[0] + a * ux - lado * h * uy,
             hom[1] + a * uy + lado * h * ux],
      mano: fin
    };
  }

  function dibujar(p) {
    var s = ESCALA;
    var cad = [st.x, st.y - (H.muslo + H.pierna) * s + p.y * s];
    var cue = punta(cad[0], cad[1], 180 + p.tronco, H.cuello * s);
    var cabC = punta(cue[0], cue[1], 180 + p.tronco + p.cabeza, H.cabeza * s * 0.95);

    poner(partes.tronco, cad, cue);
    cabeza.setAttribute("cx", cabC[0]);
    cabeza.setAttribute("cy", cabC[1]);
    cabeza.setAttribute("r", H.cabeza * s);

    /* El casco sigue a la cabeza: misma inclinación que ella. El
       giro se calcula llevando el "arriba" del dibujo (-y) al
       "arriba" real de la cabeza. */
    if (st.escenario === 2) {
      var ac = (180 + p.tronco + p.cabeza) * Math.PI / 180;
      var hx = Math.sin(ac) * st.mira, hy = Math.cos(ac);
      var giro = Math.atan2(hx, -hy) * 180 / Math.PI;
      var k = H.cabeza * s;
      piezasCasco.forEach(function (e) {
        e.setAttribute("opacity", 1);
        e.setAttribute("transform",
          "translate(" + cabC[0] + "," + cabC[1] + ") rotate(" + giro + ") " +
          "scale(" + (k * st.mira) + "," + k + ")");
      });
    } else {
      piezasCasco.forEach(function (e) { e.setAttribute("opacity", 0); });
    }

    var l1 = H.brazo * s, l2 = H.antebrazo * s;

    var coA = punta(cue[0], cue[1], p.hombroA, l1);
    var maA = punta(coA[0], coA[1], p.codoA, l2);
    var coB = punta(cue[0], cue[1], p.hombroB, l1);
    var maB = punta(coB[0], coB[1], p.codoB, l2);

    /* --------------------------------------------------------
       GUITARRA. Se apoya en el CUERPO, no cuelga de la mano, y
       son las manos las que van a ella — por eso las posiciones
       de las manos se recalculan aquí y los brazos se resuelven
       con cinemática inversa. Antes el mástil salía de la mano y
       por eso no parecía que la estuviera tocando.
       -------------------------------------------------------- */
    if (p.espada != null && p.guitarra) {
      /* El cuerpo de la guitarra, a la altura de la cintura y un
         poco por delante. */
      var gc = [cad[0] + 3.5 * s * st.mira, cad[1] - 6 * s];
      var ang = p.espada * Math.PI / 180;
      var ux = Math.sin(ang) * st.mira, uy = Math.cos(ang);
      var rot = Math.atan2(uy, ux);
      var cr = Math.cos(rot), sr = Math.sin(rot);

      /* de "espacio guitarra" (origen en el cuerpo, mástil hacia
         +x) a coordenadas de pantalla */
      var gp = function (gx, gy) {
        var lx = gx * s, ly = gy * s * st.mira;
        return [gc[0] + lx * cr - ly * sr, gc[1] + lx * sr + ly * cr];
      };

      guit.forEach(function (e) {
        e.setAttribute("opacity", 1);
        e.setAttribute("transform",
          "translate(" + gc[0] + "," + gc[1] + ") " +
          "rotate(" + (rot * 180 / Math.PI) + ") " +
          "scale(" + s + "," + (s * st.mira) + ")");
      });

      /* La mano de atrás pisa trastes arriba en el mástil; la de
         delante rasga sobre el cuerpo, y `rasgueo` la sube y baja
         por las cuerdas. */
      var ikB = codoIK(cue, gp(12, 0), l1, l2, -st.mira);
      /* El brazo que rasga dobla hacia ABAJO y hacia atrás, con el
         codo colgando por fuera del cuerpo de la guitarra. Estuvo
         con el signo contrario y el codo se le subía por encima
         del puente, que es justo lo que se veía raro. */
      /* La mano que rasga va sobre el bombo, BAJA. Estuvo a media
         altura de la guitarra y ahí el brazo quedaba tan recogido
         que el codo se le subía al nivel del hombro. Bajándola, el
         brazo se estira y el codo cuelga solo. */
      var ikA = codoIK(cue, gp(0.5, 0.5 + p.rasgueo * 6.5), l1, l2, -st.mira);
      coB = ikB.codo; maB = ikB.mano;
      coA = ikA.codo; maA = ikA.mano;
    } else {
      guit.forEach(function (e) { e.setAttribute("opacity", 0); });
    }

    poner(partes.brazoA, cue, coA); poner(partes.antebrazoA, coA, maA);
    poner(partes.brazoB, cue, coB); poner(partes.antebrazoB, coB, maB);

    var roA = punta(cad[0], cad[1], p.caderaA, H.muslo * s);
    var piA = punta(roA[0], roA[1], p.rodillaA, H.pierna * s);
    poner(partes.musloA, cad, roA); poner(partes.piernaA, roA, piA);

    var roB = punta(cad[0], cad[1], p.caderaB, H.muslo * s);
    var piB = punta(roB[0], roB[1], p.rodillaB, H.pierna * s);
    poner(partes.musloB, cad, roB); poner(partes.piernaB, roB, piB);

    /* La espada solo se dibuja cuando el objeto NO es la guitarra. */
    if (p.espada != null && !p.guitarra) {
      partes.espada.setAttribute("opacity", 1);
      poner(partes.espada, maA, punta(maA[0], maA[1], p.espada, H.espada * s));
    } else {
      partes.espada.setAttribute("opacity", 0);
      /* Coordenadas válidas aunque esté oculta: una línea sin
         x1/y1 deja NaN en el DOM y ensucia cualquier inspección. */
      poner(partes.espada, maA, maA);
    }
  }

  /* ---------- el guion ---------------------------------------- */
  function encolar() {
    for (var i = 0; i < arguments.length; i++) st.guion.push(arguments[i]);
  }
  function pausa(ms) { return { que: "espera", ms: ms }; }
  function ir(nombre, dur) { return { que: "pose", nombre: nombre, dur: dur }; }

  function rutinaEspada() {
    encolar(ir("desenvaina", 320), pausa(260),
            ir("guardia", 260), pausa(340),
            ir("tajo", 130), pausa(220),
            ir("guardia", 300), pausa(200),
            ir("estocada", 120), pausa(260),
            ir("guardia", 320), pausa(180),
            ir("tajo", 120), pausa(300),
            ir("envaina", 340), pausa(200),
            ir("cruzado", 340));
  }

  function rutinaGuitarra() {
    encolar(ir("saca_guitarra", 360), pausa(320));
    /* Cuatro compases de rasgueo: se alterna entre dos poses casi
       iguales, que es lo que da la sensación de mano moviéndose. */
    for (var i = 0; i < 4; i++) {
      encolar(ir("toca1", 190), pausa(90), ir("toca2", 190), pausa(90));
    }
    encolar(ir("acorde", 260), pausa(900),
            ir("saca_guitarra", 300), pausa(160),
            ir("cruzado", 380));
  }

  /* Espada y guitarra se turnan: nunca sale la misma dos veces
     seguidas. Él las quería intercaladas, no al azar. */
  var tocaGuitarra = false;
  function rutinaObjeto() {
    tocaGuitarra = !tocaGuitarra;
    if (tocaGuitarra) rutinaGuitarra(); else rutinaEspada();
  }

  /* Lo que hace cuando ya llegó a su sitio. Se queda ahí: nada de
     esto lo mueve de la x donde está.

     El reparto está MEDIDO, no estimado: con una de cada tres
     siendo objeto salía uno cada 15 s. A .17 la media sube a los
     ~30 s que él pidió. Si se tocan las duraciones de las
     rutinas, hay que volver a medirlo. */
  function rutinaOcio() {
    var r = Math.random();
    if (r < .17)      rutinaObjeto();
    else if (r < .48) encolar(ir("piensa", 520), pausa(2400), ir("cruzado", 480));
    else if (r < .78) encolar(ir("sentado", 600), pausa(3400), ir("quieto", 520), pausa(300), ir("cruzado", 400));
    else              encolar(ir("quieto", 460), pausa(2200), ir("cruzado", 460));
    encolar(pausa(1800 + Math.random() * 3600));
  }

  /* ---------- el bucle ---------------------------------------- */
  var anterior = null;
  var corriendo = null;

  function paso(ahora) {
    requestAnimationFrame(paso);
    if (anterior === null) anterior = ahora;
    var dt = Math.min(64, ahora - anterior);
    anterior = ahora;

    if (st.t < 1) st.t = Math.min(1, st.t + dt / st.dur);

    if (st.modo === "corriendo" && corriendo) {
      /* Andando va a menos de la mitad de velocidad y con el ciclo
         más lento, que es lo que separa un paso de una zancada. */
      st.x += (corriendo.anda ? 0.125 : 0.30) * dt * corriendo.mira;
      st.ciclo += dt / (corriendo.anda ? 150 : 78);
      var llego = corriendo.mira < 0 ? st.x <= corriendo.destino
                                     : st.x >= corriendo.destino;
      if (llego) {
        var andaba = corriendo.anda;
        st.modo = "quieto";
        corriendo = null;
        if (andaba) {
          /* Quien camina no derrapa: se para y ya. */
          irA("quieto", 320);
          st.guion.unshift(pausa(500), ir("cruzado", 420));
          st.llegado = true;
        } else {
          irA("derrapa", 150);
          st.guion.unshift({ que: "derrape" }, pausa(460), ir("cruzado", 420));
        }
      }
    } else if (st.modo === "derrapando") {
      st.x += st.vx * dt / 16;
      st.vx *= 0.90;
      if (Math.abs(st.vx) < 0.05) { st.vx = 0; st.modo = "quieto"; st.llegado = true; }
    }

    /* Nunca sale de la pantalla. Sin esto, el derrape lo dejaba
       con medio cuerpo fuera del borde. */
    if (st.x < MARGEN) { st.x = MARGEN; if (st.vx < 0) st.vx = 0; }
    if (st.x > ancho - MARGEN) {
      st.x = ancho - MARGEN; if (st.vx > 0) st.vx = 0;
    }

    if (st.espera > 0) {
      st.espera -= dt;
    } else if (st.modo !== "corriendo" && st.t >= 1) {
      if (st.guion.length) {
        var a = st.guion.shift();
        if (a.que === "espera") st.espera = a.ms;
        else if (a.que === "pose") irA(a.nombre, a.dur);
        else if (a.que === "derrape") { st.modo = "derrapando"; st.vx = 3.4 * st.mira; }
        else if (a.que === "avanzar") {
          st.mira = a.hacia;
          /* Corriendo, el destino deja sitio para el derrape (unos
             32 px más). Andando no hace falta: para en seco. */
          var hueco = a.anda ? 6 : 40;
          corriendo = { mira: a.hacia, anda: !!a.anda,
                        destino: a.hacia < 0 ? MARGEN + hueco : ancho - MARGEN - hueco };
          st.modo = "corriendo";
          irA(a.anda ? "camina" : "corre", 220);
        }
      } else if (st.llegado) {
        rutinaOcio();
      }
    }

    var p = calcular();
    if (st.modo === "corriendo") {
      /* --------------------------------------------------------
         El ciclo de carrera. Recordar que los ángulos son
         ABSOLUTOS desde abajo: 0 = al suelo, positivo = al frente.

         BRAZOS. El codo se dobla SUMANDO, no restando: el
         antebrazo tiene que ir por delante del brazo. Estuvo un
         rato con `codo = hombro - 58` y el resultado eran los dos
         antebrazos disparados hacia atrás, con los codos al revés.
         Ahora el brazo oscila ±38 y el antebrazo va 72° por
         delante, que es el codo doblado de cualquiera corriendo.

         PIERNAS. La rodilla solo dobla hacia ATRÁS, así que el
         ángulo de la pantorrilla se RESTA al del muslo. Y no
         dobla lo mismo todo el rato: casi recta cuando la pierna
         va adelante (30°) y muy plegada cuando va atrás (70°),
         que es lo que levanta el talón por detrás.
         -------------------------------------------------------- */
      var c = st.ciclo;
      p = mezclar(p, p, 0);   /* copia */
      var anda = corriendo && corriendo.anda;

      /* Andar es el mismo ciclo con todo más corto: menos zancada,
         menos flexión de rodilla, los brazos casi colgando y el
         tronco recto. */
      var zancada = anda ? 22 : 45;
      var flexMin = anda ? 10 : 30, flexMax = anda ? 34 : 70;
      var brazo   = anda ? 16 : 38;
      var codo    = anda ? 34 : 72;

      var sA = Math.sin(c), sB = Math.sin(c + Math.PI);

      p.caderaA  = sA * zancada;
      p.rodillaA = p.caderaA - (flexMin + (flexMax - flexMin) * (1 - sA) / 2);
      p.caderaB  = sB * zancada;
      p.rodillaB = p.caderaB - (flexMin + (flexMax - flexMin) * (1 - sB) / 2);

      /* los brazos van al revés que las piernas del mismo lado */
      p.hombroA  = sB * brazo;
      p.codoA    = p.hombroA + codo;
      p.hombroB  = sA * brazo;
      p.codoB    = p.hombroB + codo;

      p.tronco   = anda ? 4 : 14;
      p.cabeza   = anda ? -1 : -6;
      p.y        = Math.abs(sA) * (anda ? -1.0 : -2.2);
    } else if (st.t >= 1) {
      /* respiración: casi nada, pero sin esto parece congelado */
      p.y += Math.sin(ahora / 900) * 0.5;
      p.cabeza += Math.sin(ahora / 1400) * 1.2;
    }
    dibujar(p);
  }

  /* ---------- colocación -------------------------------------- */
  /* Su suelo es SIEMPRE el filo de abajo del encabezado, esté la
     página donde esté. El encabezado es sticky, así que ese filo
     no se mueve al bajar. */
  /* El viewBox se saca del TAMAÑO REAL del SVG, no de
     window.innerWidth. No es lo mismo: innerWidth incluye la barra
     de desplazamiento y el SVG no, así que había 15 px de
     diferencia y todo el dibujo salía escalado un 1,2% — las
     coordenadas que calculaba el código no caían donde se veían.
     Se nota sobre todo con la guitarra, donde las manos tienen que
     caer justo encima. */
  function medir() {
    var r = svg.getBoundingClientRect();
    var an = Math.round(r.width) || document.documentElement.clientWidth;
    var al = Math.round(r.height) || document.documentElement.clientHeight;
    svg.setAttribute("viewBox", "0 0 " + an + " " + al);
    ancho = an;
    var cab = document.querySelector(".cabecera");
    st.suelo = cab ? cab.getBoundingClientRect().bottom - 1 : 90;
    st.y = st.suelo;
  }
  var ancho = 0;   /* ancho útil, en unidades del viewBox */

  function empezar() {
    /* El SVG se mete en la página ANTES de medir: hasta que no
       está dentro no tiene tamaño que consultar. */
    document.body.appendChild(svg);
    medir();
    st.x = MARGEN + 26;          /* arranca a la izquierda */
    st.mira = 1;
    st.desde = st.hacia = POSES.quieto;
    st.t = 1;

    /* Un fotograma YA, sin esperar al primer requestAnimationFrame:
       si no, el SVG queda un instante con los atributos sin poner. */
    dibujar(calcular());

    /* Dos escenarios a cara o cruz, decididos al cargar la página:
         1 — sale corriendo y derrapa al llegar
         2 — se pone el casco corintio y va andando
       El resto del repertorio (pensar, sentarse, espada, guitarra)
       es el mismo en los dos. */
    st.escenario = Math.random() < 0.5 ? 1 : 2;

    encolar(pausa(1100), { que: "avanzar", hacia: 1, anda: st.escenario === 2 });
    requestAnimationFrame(paso);
  }

  /* Punto de inspección, como el __visor del visor 3D. `avanzar`
     permite comprobar la animación cuando rAF está parado (pasa
     si la pestaña no se está pintando). */
  window.__monigote = {
    estado: st, poses: POSES,
    get ancho() { return ancho; },
    avanzar: function (ms, salto) {
      salto = salto || 16;
      for (var i = 0; i < ms; i += salto) paso((anterior || 0) + salto);
    }
  };

  window.addEventListener("resize", function () {
    medir();
    if (st.x > ancho - MARGEN) st.x = ancho - MARGEN;
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", empezar);
  } else {
    empezar();
  }
})();
