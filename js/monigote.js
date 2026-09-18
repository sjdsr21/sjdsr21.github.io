/* ============================================================
   EL MONIGOTE
   ------------------------------------------------------------
   Un muñeco de palitos que vive en la página de Contacto, de pie
   sobre la tarjeta de Instagram, y se entretiene solo.

   Cómo está hecho, en corto:

   No hay dibujos ni fotogramas. Hay un ESQUELETO de ocho huesos
   y una POSE es solo una lista de números. Para animar se
   interpola de una pose a otra con una curva suave, y algunas
   actividades (tocar, dibujar, andar) le suman encima un
   movimiento calculado con el reloj.

   Los ángulos van en grados y se miden desde ABAJO:
       0   = el hueso apunta al suelo
       90  = apunta hacia adelante
       180 = apunta al cielo
   Son ángulos ABSOLUTOS, no relativos al hueso padre.
   OJO con el tronco: se suma a 180, así que un tronco NEGATIVO es
   inclinarse HACIA DELANTE (medido el 17/09/2026). Con la cabeza
   pasa lo mismo: negativa = mirar hacia abajo, al frente.

   UNIDADES. Toda la geometría se calcula en "unidades de cuerpo":
   f = hacia delante, h = altura sobre el suelo (hacia arriba). Solo
   al final se pasa a píxeles, multiplicando por ESCALA y por `mira`
   (1 derecha, -1 izquierda). Así una pose sirve para los dos lados.

   OBJETOS. Cada pose puede llevar un `objeto`: espada, varita,
   guitarra, lapiz, hacha, tronco, o "manos" (manos a un punto sin
   nada en ellas). Los que se agarran con precisión llevan las
   manos por CINEMÁTICA INVERSA (ik, ikA = cuánto manda el objeto
   sobre cada mano, de 0 a 1).

   ESCENAS. Dibujar y cortar leña traen decorado (mesa, taburete,
   lámpara, tocón, leña). El decorado vive en capas aparte, por
   detrás y por delante del muñeco, y aparece y se va con un
   fundido.

   Nada de setTimeout: todo pasa por el GUION, una cola de acciones
   que consume el bucle. Así `__monigote.avanzar(ms)` puede probarlo
   todo sin depender de requestAnimationFrame.

   Respeta prefers-reduced-motion: si el sistema pide menos
   movimiento, el monigote no aparece.
   ============================================================ */
(function () {
  "use strict";

  /* 16/09/2026 (él): vive en CONTACTO y QUIETO, de pie sobre el marco
     de la tarjeta de Instagram. La versión que corría por el filo del
     encabezado de Exhibición sigue en notas/archivado/.
     17/09/2026: actividades 3× más largas, guitarra rehecha, y tres
     actividades nuevas: varita con bolas de fuego, mesa de dibujo y
     cortar leña. Respaldo de la versión anterior en
     notas/archivado/respaldo-monigote-2026-09-17/. */
  if (document.body.getAttribute("data-pagina") !== "contacto") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  /* ---------- proporciones ----------------------------------- */
  var H = {
    cuello: 17, cabeza: 6.4,
    brazo: 9, antebrazo: 8.5,
    muslo: 10, pierna: 10,
    espada: 17
  };
  var ESCALA = 0.86;
  var RAD = Math.PI / 180;

  /* Dirección de un ángulo, en unidades (f, h). */
  function dir(a) { return [Math.sin(a * RAD), -Math.cos(a * RAD)]; }
  function mas(p, d, k) { return [p[0] + d[0] * k, p[1] + d[1] * k]; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpP(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; }
  function dist(a, b) { return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1])); }
  function unir(a, b) { var d = dist(a, b) || 1; return [(b[0] - a[0]) / d, (b[1] - a[1]) / d]; }
  /* El perpendicular que corresponde al +y local de un objeto
     dibujado con tf(): con el objeto apuntando al frente, cae
     hacia ABAJO. */
  function perp(u) { return [u[1], -u[0]]; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function suaveStep(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }

  /* ---------- poses ------------------------------------------- */
  function pose(o) {
    var base = {
      tronco: 0, cabeza: 0, y: 0,
      hombroA: 20, codoA: -30,     /* brazo de adelante */
      hombroB: -18, codoB: 26,     /* brazo de atrás */
      caderaA: 4, rodillaA: 4,
      caderaB: -4, rodillaB: -4,
      objeto: null, ang: 0,        /* qué lleva y con qué ángulo */
      ik: 0, ikA: 0,               /* cuánto mandan las manos-objetivo */
      hx: 4, hy: 10,               /* mano B respecto del hombro:
                                      adelante / hacia ABAJO */
      agarre: 10,                  /* hacha: la mano A, a cuánto del pomo */
      aX: 1, aY: 0,                /* "manos": la mano A, respecto de la B */
      rotT: 90,                    /* tronco en la mano: 90 tumbado, 0 de pie */
      rasgueo: 0.5,                /* guitarra: 0 arriba de las cuerdas, 1 abajo */
      traste: 15,                  /* guitarra: dónde pisa la mano B */
      alza: 0,                     /* lápiz: 1 = levantado del papel */
      abierto: 0,                  /* libro: 0 cerrado, 1 abierto */
      tension: 0,                  /* arco: 0 cuerda suelta, 1 tensado */
      carcajT: 0,                  /* arco: la mano B va a la cuerda (0) o al carcaj (1) */
      sube: 0,                     /* arco: cuánto ha sacado ya la flecha del carcaj */
      cep: 0,                      /* cepillo: 0 atrás, 1 al final de la pasada */
      golpe: 0,                    /* talla: 0 mazo en el formón, 1 levantado */
      angM: 120,                   /* talla: ángulo del mazo */
      avance: 0                    /* cuerpo corrido hacia delante, en
                                      unidades (al levantarse del piso,
                                      la cadera pasa sobre los pies) */
    };
    for (var k in o) base[k] = o[k];
    /* `apoyo`: calcula la altura de la cadera para que el pie más
       bajo toque el suelo. Evita afinar `y` a ojo en cada pose. */
    if (o.apoyo) {
      var vA = -dir(base.caderaA)[1] * H.muslo - dir(base.rodillaA)[1] * H.pierna;
      var vB = -dir(base.caderaB)[1] * H.muslo - dir(base.rodillaB)[1] * H.pierna;
      base.y = H.muslo + H.pierna - Math.max(vA, vB);
      delete base.apoyo;
    }
    return base;
  }

  /* Piernas que se repiten */
  var AGACHA = { caderaA: 40, rodillaA: -20, caderaB: 10, rodillaB: -40, apoyo: true };
  var ABIERTAS = { caderaA: 20, rodillaA: 8, caderaB: -18, rodillaB: -22, apoyo: true };
  /* De rodillas (una en el suelo), para recoger lo que está a ras de suelo. */
  var RODILLA = { caderaA: 70, rodillaA: -10, caderaB: 10, rodillaB: -80, apoyo: true };
  /* Pies del arquero: abiertos, de costado a la diana */
  var PIE_ARCO = { caderaA: 16, rodillaA: 8, caderaB: -16, rodillaB: -10, apoyo: true };
  /* Pies de la esgrima */
  var PIE = {
    guardia:  { caderaA: 30, rodillaA: 16, caderaB: -30, rodillaB: -20, apoyo: true },
    lance:    { caderaA: 52, rodillaA: 32, caderaB: -40, rodillaB: -58, apoyo: true },
    bajo:     { caderaA: 62, rodillaA: 14, caderaB: -34, rodillaB: -76, apoyo: true },
    recogido: { caderaA: 14, rodillaA: 4, caderaB: -22, rodillaB: -34, apoyo: true }
  };

  var POSES = {
    /* De pie, brazos relajados a los lados. Es la pose de descanso
       entre actividades (17/09: sustituye a los brazos cruzados, que
       él no entendía). */
    quieto: pose({ hombroA: 8, codoA: 4, hombroB: -8, codoB: -4 }),

    /* Andar: las amplitudes de piernas y brazos las pone el ciclo. */
    camina: pose({ tronco: -4, cabeza: 1 }),

    /* --- gestos de pie (17/09) ---------------------------------
       Pensar, cruzarse de brazos y quedarse quieto no se entendían.
       Estos tres se leen de un vistazo. */
    /* saludar: el brazo sale hacia delante, por fuera de la cabeza
       (a 150 quedaba tapado por ella), y el antebrazo va y viene */
    saluda_a: pose({ tronco: 2, cabeza: 5, hombroA: 115, codoA: 140,
                     hombroB: -8, codoB: -4 }),
    saluda_b: pose({ tronco: 2, cabeza: 5, hombroA: 115, codoA: 192,
                     hombroB: -8, codoB: -4 }),
    /* estirarse (2.ª versión, 17/09): las dos manos se juntan por
       encima de la cabeza y se arquea hacia atrás, balanceándose;
       luego los brazos van atrás abriendo el pecho, y los sacude.
       Lo de doblarse hasta los pies se quitó: se veía raro. */
    estira_arriba: pose({ tronco: 8, cabeza: 14, hombroA: 132, codoA: 174,
                          hombroB: 126, codoB: 186, caderaA: 2, rodillaA: 2,
                          caderaB: -2, rodillaB: -2 }),
    estira_arriba2: pose({ tronco: 13, cabeza: 18, hombroA: 138, codoA: 180,
                           hombroB: 132, codoB: 192, caderaA: 2, rodillaA: 2,
                           caderaB: -2, rodillaB: -2 }),
    estira_atras: pose({ tronco: 5, cabeza: 10, hombroA: -38, codoA: -54,
                         hombroB: -44, codoB: -60 }),
    sacude_a: pose({ hombroA: 6, codoA: 16, hombroB: -6, codoB: -14 }),
    sacude_b: pose({ hombroA: 2, codoA: -10, hombroB: -2, codoB: 10 }),
    /* patear una piedrita (17/09, en lugar de «mirar a lo lejos»,
       que no se entendía): la mira, echa la pierna atrás, patea y la
       sigue con la vista. Los brazos contrapesan la patada. */
    piedra_mira: pose({ tronco: -8, cabeza: -22, hombroA: 8, codoA: 4,
                        hombroB: -8, codoB: -4 }),
    patea_atras: pose({ tronco: -2, cabeza: -18, hombroA: 22, codoA: 40,
                        hombroB: -20, codoB: -6, caderaA: -28, rodillaA: -70,
                        caderaB: 2, rodillaB: 2, apoyo: true }),
    patea: pose({ tronco: 8, cabeza: -6, hombroA: -28, codoA: -10,
                  hombroB: 26, codoB: 44, caderaA: 55, rodillaA: 45,
                  caderaB: -4, rodillaB: -4, apoyo: true }),
    piedra_sigue: pose({ tronco: -2, cabeza: -5, hombroA: 8, codoA: 4,
                         hombroB: -8, codoB: -4 }),

    /* Sentado EN el piso (17/09, él: flotaba y estaba muy echado
       atrás). y = 20 pone la cadera a ras del suelo, igual que los
       pies, así que su remate redondo toca el borde de la tarjeta.
       Antes (y 17) quedaba 5 px por encima y las pantorrillas
       colgaban atravesando el borde. Ahora: tronco casi recto, un
       pelo hacia delante; rodillas arriba con los pies apoyados (los
       ángulos de la pierna están elegidos para que el pie caiga
       justo en h = 0) y las manos por delante de las espinillas,
       abrazando las rodillas. */
    /* 17/09 (él): una pierna se deja caer, estirada sobre el piso
       (cadera y rodilla a 90 = horizontal, h = 0), y la otra sigue
       con la rodilla arriba. La mano de delante abraza esa rodilla;
       la de atrás se apoya en el suelo, por detrás de la cadera. */
    /* 17/09, tercera vez: recostado en el tronco de un árbol que
       aparece a su espalda (tronco +12 = echado atrás) y las dos manos
       abrazando la rodilla levantada. */
    sentado: pose({ tronco: 12, cabeza: -2, y: 20,
                    hombroA: 15, codoA: 60, hombroB: 25, codoB: 64,
                    caderaA: 130, rodillaA: 50, caderaB: 90, rodillaB: 90 }),
    /* --- levantarse del piso (17/09) ---------------------------
       Como una persona: 1) se separa del árbol, recoge las piernas y
       apoya las manos en el suelo junto a la cadera; 2) se echa hacia
       delante y queda en cuclillas, con las manos en el piso por
       delante; 3) empuja con las manos sobre las rodillas; 4) de pie.
       `avance` corre el cuerpo hacia delante para que la cadera pase
       por encima de los pies en vez de arrastrarlos: los pies se
       quedan donde estaban (medido: a mitad de cada transición no se
       hunden en el piso). Las manos van por ik; su hx/hy se calcula
       en `medirLevantarse`. */
    lev_recoge: pose({ tronco: -8, cabeza: -6, y: 20,
                       caderaA: 130, rodillaA: 50, caderaB: 128, rodillaB: 52,
                       objeto: "manos", ik: 1, ikA: 1, hx: 1.5, hy: 16 }),
    lev_cuclillas: pose({ tronco: -60, cabeza: 14, y: 12.34, avance: 2,
                          caderaA: 100, rodillaA: 20, caderaB: 99, rodillaB: 19,
                          objeto: "manos", ik: 1, ikA: 1, hx: 5, hy: 15 }),
    lev_empuja: pose({ tronco: -34, cabeza: 6, avance: 9.8,
                       caderaA: 40, rodillaA: -5, caderaB: 39, rodillaB: -9, apoyo: true,
                       objeto: "manos", ik: 1, ikA: 1, hx: 3, hy: 15 }),
    lev_pie: pose({ hombroA: 8, codoA: 4, hombroB: -8, codoB: -4, avance: 15 }),

    /* --- el libro, sentado ------------------------------------
       Mismas piernas. Las manos van al libro por ik; `ang` es la
       dirección de su ancho (90 = de pie, de cara) y `abierto` lo
       abre por el lomo. */
    l_saca: pose({ tronco: 10, cabeza: -8, y: 20,
                   caderaA: 130, rodillaA: 50, caderaB: 90, rodillaB: 90,
                   objeto: "libro", ang: 82, ik: 1, ikA: 1, hx: 9, hy: 11.5, abierto: 0 }),
    /* el libro apoyado en la rodilla, delante de la cara, con la
       parte de arriba echada hacia él (ang 62; 124 lo dejaba boca abajo
       sobre la barriga): las páginas miran a
       su cabeza (él, 17/09) */
    l_lee: pose({ tronco: 12, cabeza: -14, y: 20,
                  caderaA: 128, rodillaA: 52, caderaB: 90, rodillaB: 90,
                  objeto: "libro", ang: 62, ik: 1, ikA: 1, hx: 11.2, hy: 6.1, abierto: 1 }),

    /* --- espada ---------------------------------------------- */
    desenvaina: pose({ tronco: -8, cabeza: -6, y: 2,
                       hombroA: 128, codoA: 60, hombroB: -26, codoB: 30,
                       caderaA: 20, rodillaA: 10, caderaB: -22, rodillaB: -14,
                       objeto: "espada", ang: 30 }),
    guardia: pose({ tronco: -10, cabeza: 4, y: 3,
                    hombroA: 150, codoA: 170, hombroB: -8, codoB: 70,
                    caderaA: 30, rodillaA: 16, caderaB: -30, rodillaB: -20,
                    objeto: "espada", ang: 186 }),
    tajo: pose({ tronco: 28, cabeza: -10, y: 6,
                 hombroA: 74, codoA: 88, hombroB: -22, codoB: 40,
                 caderaA: 46, rodillaA: 30, caderaB: -38, rodillaB: -52,
                 objeto: "espada", ang: 96 }),
    estocada: pose({ tronco: 20, cabeza: -4, y: 8,
                     hombroA: 88, codoA: 92, hombroB: -22, codoB: 40,
                     caderaA: 62, rodillaA: 40, caderaB: -44, rodillaB: -60,
                     objeto: "espada", ang: 92 }),
    envaina: pose({ tronco: -4, y: 1,
                    hombroA: 40, codoA: -20, hombroB: -10, codoB: 50,
                    objeto: "espada", ang: 20 }),

    /* --- esgrima encadenada (17/09) ---------------------------
       El brazo LIBRE va doblado y cerca del cuerpo, con la mano a la
       altura de la cintura (él, 17/09: antes iba estirado hacia atrás
       con el codo en una postura imposible). Cuatro posiciones según
       el paso: guardia, lance, bajo y recogido.
       Estas poses no se usan sueltas: son puntos de paso de una
       `serie`, que las recorre con una curva continua sin frenar en
       cada una. El `ang` de la hoja se escribe SIN recortar a
       0..360, porque la serie interpola los números tal cual: de 220
       a -28 la hoja baja por delante y sigue hacia atrás; poner 332
       la haría girar por arriba. */
    s_alta: pose(mezcla(PIE.guardia, { tronco: 6, cabeza: 4,
                 hombroA: 165, codoA: 200, hombroB: -8, codoB: 70, objeto: "espada", ang: 220 })),
    s_corte: pose(mezcla(PIE.lance, { tronco: -14, cabeza: -6,
                 hombroA: 110, codoA: 100, hombroB: -22, codoB: 40, objeto: "espada", ang: 112 })),
    s_sigue: pose(mezcla(PIE.bajo, { tronco: -28, cabeza: -10,
                 hombroA: 42, codoA: 14, hombroB: -18, codoB: 50, objeto: "espada", ang: -28 })),
    s_subeM: pose(mezcla(PIE.lance, { tronco: -12, cabeza: -4,
                 hombroA: 78, codoA: 64, hombroB: -22, codoB: 40, objeto: "espada", ang: 62 })),
    s_subeF: pose(mezcla(PIE.recogido, { tronco: 8, cabeza: 6,
                 hombroA: 150, codoA: 150, hombroB: -6, codoB: 76, objeto: "espada", ang: 168 })),
    s_atras: pose(mezcla(PIE.guardia, { tronco: 10, cabeza: 6,
                 hombroA: 172, codoA: 236, hombroB: -8, codoB: 70, objeto: "espada", ang: 258 })),
    s_corte2: pose(mezcla(PIE.lance, { tronco: -18, cabeza: -6,
                 hombroA: 96, codoA: 78, hombroB: -22, codoB: 40, objeto: "espada", ang: 84 })),
    s_sigue2: pose(mezcla(PIE.bajo, { tronco: -24, cabeza: -8,
                 hombroA: 20, codoA: -24, hombroB: -18, codoB: 50, objeto: "espada", ang: 8 })),
    /* molinete de muñeca, junto al cuerpo, que acaba apuntando al
       frente (-268 = 92) */
    s_giro1: pose(mezcla(PIE.recogido, { tronco: -6,
                 hombroA: 50, codoA: 80, hombroB: -6, codoB: 76, objeto: "espada", ang: -60 })),
    s_giro2: pose(mezcla(PIE.recogido, { tronco: -4,
                 hombroA: 58, codoA: 96, hombroB: -6, codoB: 76, objeto: "espada", ang: -170 })),
    s_giro3: pose(mezcla(PIE.guardia, { tronco: -8,
                 hombroA: 70, codoA: 100, hombroB: -8, codoB: 70, objeto: "espada", ang: -268 })),
    s_estoc: pose(mezcla(PIE.lance, { tronco: -20, cabeza: -4,
                 hombroA: 88, codoA: 92, hombroB: -22, codoB: 40, objeto: "espada", ang: -268 })),
    /* barrido bajo: la hoja sale de atrás, pasa rozando el suelo y
       sube por delante */
    s_lateral: pose(mezcla(PIE.guardia, { tronco: 6, cabeza: 2,
                 hombroA: -30, codoA: -10, hombroB: -8, codoB: 70, objeto: "espada", ang: -110 })),
    s_barre: pose(mezcla(PIE.lance, { tronco: -16, cabeza: -6,
                 hombroA: 96, codoA: 90, hombroB: -22, codoB: 40, objeto: "espada", ang: 70 })),
    s_estoc2: pose(mezcla(PIE.lance, { tronco: -20, cabeza: -4,
                 hombroA: 88, codoA: 92, hombroB: -22, codoB: 40, objeto: "espada", ang: 92 })),
    /* la misma guardia con la hoja escrita una vuelta más atrás */
    guardiaN: pose({ tronco: -10, cabeza: 4, y: 3,
                     hombroA: 150, codoA: 170, hombroB: -8, codoB: 70,
                     caderaA: 30, rodillaA: 16, caderaB: -30, rodillaB: -20,
                     objeto: "espada", ang: -174 }),

    /* --- guitarra ---------------------------------------------
       `ang` es la inclinación del mástil. La guitarra se apoya en
       la cintura y las dos manos van a ella por cinemática inversa:
       la A rasguea sobre la boca, la B pisa en el mástil. */
    g_saca: pose({ tronco: -2, cabeza: -4, y: 1,
                   caderaA: 8, rodillaA: 6, caderaB: -8, rodillaB: -8,
                   objeto: "guitarra", ang: 130, ik: 1, ikA: 1,
                   rasgueo: 0.3, traste: 15.5 }),
    g_toca: pose({ tronco: 1, cabeza: -8, y: 1.5,
                   caderaA: 12, rodillaA: 8, caderaB: -12, rodillaB: -10,
                   objeto: "guitarra", ang: 125, ik: 1, ikA: 1,
                   rasgueo: 0, traste: 15.5 }),
    /* El acorde final: rasgueo largo hacia abajo y se echa atrás. */
    g_acorde: pose({ tronco: 12, cabeza: 12, y: 2.5,
                     caderaA: 22, rodillaA: 14, caderaB: -22, rodillaB: -18,
                     objeto: "guitarra", ang: 142, ik: 1, ikA: 1,
                     rasgueo: 1.25, traste: 15.5 }),

    /* --- varita -----------------------------------------------
       La varita va en la mano A, por ángulos (sin ik). */
    v_saca: pose({ tronco: -2, hombroA: 30, codoA: 95, hombroB: -20, codoB: 20,
                   objeto: "varita", ang: 110 }),
    v_f1: pose({ tronco: 3, hombroA: 120, codoA: 170, hombroB: -24, codoB: 10,
                 objeto: "varita", ang: 205 }),
    v_f2: pose({ tronco: -2, hombroA: 150, codoA: 110, hombroB: -20, codoB: 20,
                 objeto: "varita", ang: 70 }),
    v_f3: pose({ tronco: 2, hombroA: 95, codoA: 200, hombroB: -26, codoB: 16,
                 objeto: "varita", ang: 262 }),
    v_f4: pose({ tronco: -5, cabeza: -3, hombroA: 135, codoA: 150, hombroB: -18, codoB: 24,
                 objeto: "varita", ang: 150 }),
    v_f5: pose({ tronco: -3, hombroA: 70, codoA: 130, hombroB: -22, codoB: 18,
                 objeto: "varita", ang: 22 }),
    /* Carga: se echa atrás, varita por detrás de la cabeza y la otra
       mano apuntando al blanco. */
    v_carga: pose({ tronco: 8, cabeza: 4,
                    hombroA: 165, codoA: 225, hombroB: 80, codoB: 95,
                    caderaA: 26, rodillaA: 14, caderaB: -24, rodillaB: -26, apoyo: true,
                    objeto: "varita", ang: 232 }),
    /* Lanza: el brazo acaba estirado hacia delante y ABAJO, con la
       varita a la altura de la barriga; de ahí sale la bola (él,
       17/09: antes salía a la altura de la cabeza). */
    v_lanza: pose({ tronco: -14, cabeza: -4,
                    hombroA: 46, codoA: 72, hombroB: -40, codoB: -10,
                    caderaA: 34, rodillaA: 20, caderaB: -32, rodillaB: -40, apoyo: true,
                    objeto: "varita", ang: 88 }),
    v_retro: pose({ tronco: -6, hombroA: 58, codoA: 100, hombroB: -30, codoB: 0,
                    caderaA: 22, rodillaA: 12, caderaB: -20, rodillaB: -26, apoyo: true,
                    objeto: "varita", ang: 122 }),
    v_guarda: pose({ tronco: -4, y: 1, hombroA: 40, codoA: -20, hombroB: -24, codoB: 24,
                     objeto: "varita", ang: 20 }),

    /* --- arco (17/09) ------------------------------------------
       El arco va en la mano A (la de delante), por ángulos; la mano B
       va a la cuerda por ik, al punto donde está el culatín, así que
       tensar = que `tension` suba y la mano venga detrás. Tensado del
       todo, el culatín queda junto a la barbilla y el codo de atrás
       sale hacia atrás, como en un arquero de verdad. */
    a_saca: pose(mezcla(PIE_ARCO, { tronco: 0, cabeza: -2, hombroA: 30, codoA: 50,
                 hombroB: -10, codoB: 20, objeto: "arco", ang: 90, ik: 0, ikA: 0, tension: 0 })),
    /* toma una flecha de la espalda */
    /* 17/09, 2.ª versión (él): la mano B va al CARCAJ de la espalda
       (ik), saca la flecha hacia arriba y la trae a la cuerda. */
    a_toma: pose(mezcla(PIE_ARCO, { tronco: 2, cabeza: 4, hombroA: 40, codoA: 60,
                 hombroB: -10, codoB: 20, objeto: "arco", ang: 90, ik: 1, ikA: 0, tension: 0,
                 carcajT: 1, sube: 4 })),
    a_extrae: pose(mezcla(PIE_ARCO, { tronco: 3, cabeza: 6, hombroA: 40, codoA: 60,
                   hombroB: -10, codoB: 20, objeto: "arco", ang: 90, ik: 1, ikA: 0, tension: 0,
                   carcajT: 1, sube: 13 })),
    /* lleva la flecha hasta el arco con el brazo casi estirado */
    a_lleva: pose(mezcla(PIE_ARCO, { tronco: -1, cabeza: -6, hombroA: 62, codoA: 72,
                  hombroB: -10, codoB: 30, objeto: "arco", ang: 88, ik: 1, ikA: 0, tension: -1 })),
    a_carga: pose(mezcla(PIE_ARCO, { tronco: -2, cabeza: -8, hombroA: 62, codoA: 72,
                  hombroB: -10, codoB: 30, objeto: "arco", ang: 88, ik: 1, ikA: 0, tension: 0.05 })),
    /* el brazo del arco un poco hacia abajo (80): así el culatín
       queda junto a la barbilla, algo POR DEBAJO del hombro, y el codo
       de la cuerda sale hacia atrás, como en un arquero de verdad */
    a_apunta: pose(mezcla(PIE_ARCO, { tronco: -2, cabeza: -2, hombroA: 80, codoA: 80,
                   hombroB: -30, codoB: 10, objeto: "arco", ang: 90, ik: 1, ikA: 0, tension: 1,
                   hx: -0.4, hy: 1.6 })),
    /* la mano de la cuerda sale hacia atrás al soltar */
    a_suelta: pose(mezcla(PIE_ARCO, { tronco: 1, cabeza: 0, hombroA: 80, codoA: 80,
                   hombroB: -60, codoB: -20, objeto: "arco", ang: 89, ik: 0, ikA: 0, tension: 0 })),

    /* --- mesa de dibujo ---------------------------------------
       Sentado en el taburete, inclinado sobre el tablero. Las manos
       van al tablero por ik; las piernas y el lápiz los mueve el
       reloj (ver `sobreponer`). */
    d_sienta: pose({ tronco: -22, cabeza: -16, y: 3.5,
                     hombroA: 60, codoA: 100, hombroB: 50, codoB: 90,
                     caderaA: 82, rodillaA: 10, caderaB: 78, rodillaB: 2,
                     objeto: "lapiz", ik: 1, ikA: 1 }),
    d_mira: pose({ tronco: -8, cabeza: 4, y: 3.5,
                   hombroA: 60, codoA: 100, hombroB: 50, codoB: 90,
                   caderaA: 82, rodillaA: 18, caderaB: 78, rodillaB: -4,
                   objeto: "lapiz", ik: 1, ikA: 1, alza: 1 }),

    /* --- hacha ------------------------------------------------
       La mano B agarra cerca del pomo (hx, hy); la A, a `agarre`
       unidades de él a lo largo del cabo. hy de algunas poses se
       calcula más abajo, contra el decorado. */
    h_hombro: pose({ hombroA: 22, codoA: -34,
                     objeto: "hacha", ang: 235, ik: 1, ikA: 0, hx: 3.5, hy: 2.6 }),
    h_apoya: pose(mezcla(AGACHA, { tronco: -60, cabeza: -8,
                     hombroA: 60, codoA: 30,
                     objeto: "hacha", ang: -60, ik: 1, ikA: 0 })),
    h_toma: pose(mezcla(AGACHA, { tronco: -60, cabeza: -8,
                     hombroA: 60, codoA: 30,
                     objeto: "manos", ang: -60, ik: 1, ikA: 0 })),
    h_libre: pose({ tronco: -4, hombroA: 12, codoA: 24, hombroB: -12, codoB: 8 }),
    h_agacha: pose(mezcla(AGACHA, { tronco: -60, cabeza: -10,
                     objeto: "manos", ik: 1, ikA: 1, hx: 3, rotT: 90 })),
    h_agachaBajo: pose(mezcla(RODILLA, { tronco: -70, cabeza: -10,
                     objeto: "manos", ik: 1, ikA: 1, hx: 3, rotT: 90 })),
    h_carga: pose({ tronco: 5, cabeza: -2,
                    objeto: "tronco", ik: 1, ikA: 1, hx: 5.5, hy: 12.5, rotT: 90 }),
    h_cerca: pose({ tronco: 6, cabeza: -2,
                    objeto: "tronco", ik: 1, ikA: 1, hx: 1.5, hy: 11, rotT: 90 }),
    h_coloca: pose(mezcla(AGACHA, { tronco: -60, cabeza: -12,
                     objeto: "tronco", ik: 1, ikA: 1, rotT: 0 })),
    h_colocaM: pose(mezcla(AGACHA, { tronco: -60, cabeza: -12,
                     objeto: "manos", ik: 1, ikA: 1, rotT: 0 })),
    h_lista: pose(mezcla(ABIERTAS, { tronco: -6, cabeza: -4,
                     objeto: "hacha", ang: 150, ik: 1, ikA: 1, hx: 6, hy: 11, agarre: 11 })),
    /* Arriba: el hacha por detrás de la cabeza, la mano de arriba
       deslizada hacia el pomo lo que dejan los brazos. */
    h_arriba: pose(mezcla(ABIERTAS, { tronco: 8, cabeza: 8,
                     objeto: "hacha", ang: 232, ik: 1, ikA: 1, hx: -1.5, hy: -13.5, agarre: 5 })),
    /* Cuando el hacha se queda atascada (último leño), las manos se
       quedan DONDE ESTÁ el cabo y es el cuerpo el que tira: hx/hy de
       estas poses se calculan en `medirLeña` a partir del golpe. */
    /* halar SIN soltar el cabo (él, 17/09): inclinado sobre el hacha,
       tira echando la cadera abajo y atrás con los brazos estirados; si
       se echaba hacia atrás, las manos no llegaban al cabo */
    h_hala_a: pose({ tronco: -13, cabeza: 10,
                     caderaA: 58, rodillaA: 22, caderaB: -30, rodillaB: -36, apoyo: true,
                     objeto: "hacha", ang: 88, ik: 1, ikA: 1, agarre: 2.5 }),
    h_hala_b: pose({ tronco: -26, cabeza: -6,
                     caderaA: 36, rodillaA: 18, caderaB: -18, rodillaB: -30, apoyo: true,
                     objeto: "hacha", ang: 88, ik: 1, ikA: 1, agarre: 2.5 }),
    h_suelta: pose({ tronco: -26, cabeza: -6,
                     caderaA: 36, rodillaA: 18, caderaB: -18, rodillaB: -30, apoyo: true,
                     objeto: "manos", ik: 1, ikA: 1 }),
    /* se rinde: manos a la cintura y la cabeza baja */
    h_rinde: pose({ tronco: -4, cabeza: -14, hombroA: 22, codoA: -34, hombroB: -22, codoB: 34 }),
    h_golpe: pose({ tronco: -30, cabeza: -12,
                    caderaA: 30, rodillaA: 12, caderaB: -26, rodillaB: -32, apoyo: true,
                    objeto: "hacha", ang: 88, ik: 1, ikA: 1, hx: 9, hy: 7, agarre: 2.5 }),
    /* El hachazo no se para en el leño: lo atraviesa y el filo se
       clava en la cara de arriba del tocón (él, 17/09). Se agacha más
       para llegar; hx y hy se calculan en `medirLeña`. */
    h_hunde: pose({ tronco: -44, cabeza: -16,
                    caderaA: 44, rodillaA: 18, caderaB: -30, rodillaB: -50, apoyo: true,
                    objeto: "hacha", ang: 82, ik: 1, ikA: 1, hx: 9, hy: 12, agarre: 2.5 })
  };
  function mezcla(a, b) {
    var r = {}, k;
    for (k in a) r[k] = a[k];
    for (k in b) r[k] = b[k];
    return r;
  }

  var CLAVES = Object.keys(POSES.quieto);
  function vacio(o) { return o == null || o === "manos"; }

  function mezclar(a, b, t) {
    var r = {};
    CLAVES.forEach(function (k) {
      if (k === "objeto" || k === "ang") return;
      r[k] = a[k] + (b[k] - a[k]) * t;
    });
    /* El objeto no se interpola: aparece de golpe al empezar la
       transición y se va justo al acabarla. La primera versión lo
       conservaba «si el destino no tiene objeto» y el muñeco se
       quedaba con la espada pegada PARA SIEMPRE, porque cada
       transición nueva arranca del valor conservado. */
    if (vacio(a.objeto) && !vacio(b.objeto)) { r.objeto = b.objeto; r.ang = b.ang; }
    else if (!vacio(a.objeto) && vacio(b.objeto)) {
      r.objeto = t < 1 ? a.objeto : b.objeto; r.ang = a.ang;
    } else if (vacio(a.objeto)) {
      /* entre "nada" y "manos", las manos mandan todo el rato: su peso
         (ik) ya se interpola; si se cambiaba a mitad, saltaban */
      r.objeto = a.objeto === "manos" || b.objeto === "manos" ? "manos" : null; r.ang = b.ang;
    } else if (a.objeto === b.objeto) {
      r.objeto = a.objeto; r.ang = a.ang + (b.ang - a.ang) * t;
    } else {
      r.objeto = t < 0.5 ? a.objeto : b.objeto; r.ang = t < 0.5 ? a.ang : b.ang;
    }
    return r;
  }
  function copia(p) { return mezclar(p, p, 0); }

  var CURVAS = {
    suave: function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    /* acelera: los golpes (el hachazo, el lanzamiento) ganan
       velocidad hasta el impacto en vez de frenar antes. */
    acel: function (t) { return t * t * t; },
    /* frena: sale a toda velocidad y se detiene al final (el filo
       que sigue del leño al tocón) */
    frena: function (t) { return 1 - Math.pow(1 - t, 3); }
  };

  /* ---------- estado ------------------------------------------ */
  var st = {
    x: 0, y: 0,           /* posición de los PIES, en píxeles */
    mira: -1,
    desde: POSES.quieto, hacia: POSES.quieto,
    t: 1, dur: 400, curva: "suave",
    modo: "quieto",
    ciclo: 0,
    llegado: false,
    suelo: 0,
    guion: [],
    espera: 0,
    reloj: 0,
    ultimo: null,         /* la última pose DIBUJADA (con lo que sumó el reloj) */
    musica: null,         /* guitarra sonando: { t0 } */
    vibra: 0,             /* cuerdas vibrando, 0..1 */
    chispas: false,       /* la varita suelta chispas */
    lectura: null,        /* leyendo: { t0 } */
    hechizo: "fuego",     /* el que prepara la varita */
    piedra: null,         /* la piedrita que patea */
    flechaCargada: false, /* hay flecha en la cuerda */
    flechaMano: false,    /* la lleva en la mano, del carcaj a la cuerda */
    dragon: null,         /* el dragoncito */
    pajaro: null,         /* el pájaro del árbol */
    regando: false,       /* está regando la mata */
    boquilla: null, boquillaPunta: null,
    brilloEspada: 0, brilloEspadaObj: 0,   /* la espada que brilla en azul */
    tiembla: false,       /* le tiemblan las piernas */
    fuera: false,         /* puede salir de la tarjeta (huye corriendo) */
    anillo: null,         /* el Anillo Único */
    opCuerpo: 1, opCuerpoObj: 1,   /* invisible con el anillo puesto */
    ojo: 0, ojoObj: 0,    /* el Ojo */
    vuelo: null,          /* la flecha que va por el aire */
    punta: null,          /* punta de la varita, en píxeles */
    enMano: null,         /* centro del tronco que lleva, en píxeles */
    bolas: [], parts: []
  };
  var esc = {
    tipo: null,           /* "dibujo" | "hacha" | null */
    vis: 0, op: 0,        /* visibilidad pedida y actual (fundido) */
    x0: 0, m: -1, t0: 0,
    pila: [1, 1, 1],      /* qué leños quedan en la pila (se agotan) */
    bloque: null,         /* tronco sobre el tocón: { de:[x,y], t } */
    mitades: [],
    flechas: [],          /* arco: las clavadas en la diana */
    talla: 0, brillo: 0, brilloObj: 0, abrir: 0, abrirObj: 0,   /* Moria */
    fresco: 0,            /* cepillo: cuánto de la tabla ya está cepillado */
    fuegoT: 0, quemado: 0,     /* dragón: el tronco */
    crece: 0, creceObj: 0,     /* la mata */
    gaveta: 0, moka: null, taza: null,   /* el café */
    llama: false, vapor: false, sirviendo: false, cafe: 0,
    mangueraSuelta: false,
    astillasF: [],        /* arco: las dos mitades de la flecha partida */
    hachaApoyada: false,
    clavada: false,       /* el hacha, abandonada dentro del último leño */
  };

  var corriendo = null;
  var MARGEN = 16;
  var ancho = 0;
  var casa = 0;           /* x de su sitio, en píxeles */

  function irA(nombre, dur, curva) {
    st.desde = st.ultimo ? copia(st.ultimo) : calcular();
    st.hacia = POSES[nombre];
    st.t = 0;
    st.dur = dur || 380;
    st.curva = curva || "suave";
  }
  /* Cambia de pose sin transición. Solo se usa entre dos poses
     idénticas salvo por el objeto (soltar o agarrar algo). */
  function fijar(nombre) {
    st.desde = st.hacia = POSES[nombre];
    st.t = 1;
    /* la última pose dibujada aún lleva el objeto de antes: si la
       siguiente transición arrancara de ahí, se vería el hacha en la
       mano y apoyada a la vez */
    st.ultimo = null;
  }
  function calcular() {
    if (st.serie) return enSerie();
    return mezclar(st.desde, st.hacia, CURVAS[st.curva](Math.min(1, st.t)));
  }

  /* ---------- series: varias poses de corrido ------------------
     Una transición normal frena en cada pose (curva suave de ida y
     vuelta), y una esgrima hecha así parece un robot: tajo, stop,
     tajo, stop. Una SERIE pasa por todas las poses con una curva de
     Hermite cuyas tangentes salen de las poses vecinas y de los
     tiempos: la hoja llega a cada punto de paso todavía en marcha, y
     solo arranca y para en los extremos. */
  function empezarSerie(pasos) {
    var lista = [st.ultimo ? copia(st.ultimo) : calcular()];
    var tiempos = [0];
    pasos.forEach(function (p) {
      lista.push(POSES[p[0]]);
      tiempos.push(tiempos[tiempos.length - 1] + p[1]);
    });
    st.serie = { lista: lista, tiempos: tiempos, e: 0 };
    st.hacia = lista[lista.length - 1];
    st.t = 0;
  }
  function enSerie() {
    var S = st.serie, Ls = S.lista, T = S.tiempos, n = Ls.length - 1;
    var e = Math.min(S.e, T[n]);
    var i = 0;
    while (i < n - 1 && e > T[i + 1]) i++;
    var d = T[i + 1] - T[i] || 1;
    var u = clamp((e - T[i]) / d, 0, 1);
    var u2 = u * u, u3 = u2 * u;
    var h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
    var p0 = Ls[Math.max(0, i - 1)], p1 = Ls[i], p2 = Ls[i + 1], p3 = Ls[Math.min(n, i + 2)];
    var t0 = T[Math.max(0, i - 1)], t3 = T[Math.min(n, i + 2)];
    function val(k) {
      var m1 = i === 0 ? 0 : (p2[k] - p0[k]) / (T[i + 1] - t0) * d;
      var m2 = i + 1 === n ? 0 : (p3[k] - p1[k]) / (t3 - T[i]) * d;
      return h00 * p1[k] + h10 * m1 + h01 * p2[k] + h11 * m2;
    }
    var r = {};
    CLAVES.forEach(function (k) { if (k !== "objeto") r[k] = val(k); });
    r.objeto = !vacio(p2.objeto) ? p2.objeto : p1.objeto;
    if (vacio(p1.objeto)) r.ang = p2.ang;
    return r;
  }

  /* ---------- SVG: capas -------------------------------------- */
  var NS = "http://www.w3.org/2000/svg";
  function el(tipo, attrs, padre) {
    var e = document.createElementNS(NS, tipo);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (padre) padre.appendChild(e);
    return e;
  }
  var svg = el("svg", { "class": "monigote", "aria-hidden": "true" });
  var defs = el("defs", {}, svg);
  var capaFondo = el("g", {}, svg);
  var cuerpo = el("g", {}, svg);
  var capaFrente = el("g", {}, svg);
  var capaEfectos = el("g", {}, svg);

  /* Degradados. Ids con prefijo para no chocar con nada de la página. */
  function degradado(tipo, id, paradas, attrs) {
    var g = el(tipo, mezcla({ id: id }, attrs || {}), defs);
    paradas.forEach(function (p) {
      el("stop", { offset: p[0], "stop-color": p[1], "stop-opacity": p[2] == null ? 1 : p[2] }, g);
    });
    return g;
  }
  degradado("radialGradient", "mon-sunburst",
    [["0", "#E6A85A"], [".55", "#B8621F"], [".85", "#7A2E0E"], ["1", "#4E1A06"]],
    { cx: "-3", cy: "0", r: "9", fx: "-2", fy: "-0.5", gradientUnits: "userSpaceOnUse" });
  degradado("radialGradient", "mon-fuego",
    [["0", "#FFF6CF"], [".25", "#FFD36B"], [".55", "#FF8A2A", .85], ["1", "#E03A12", 0]]);
  degradado("radialGradient", "mon-charco",
    [["0", "#FFE3A3", .55], ["1", "#FFE3A3", 0]]);
  var luzGrad = degradado("linearGradient", "mon-luz",
    [["0", "#FFE7B0", .42], ["1", "#FFE7B0", .06]], { gradientUnits: "userSpaceOnUse" });

  /* ---------- el muñeco --------------------------------------- */
  function linea(padre, clase) {
    return el("line", { "stroke-linecap": "round", "class": clase || "" }, padre);
  }
  var partes = {
    musloB: linea(cuerpo), piernaB: linea(cuerpo),
    musloA: linea(cuerpo), piernaA: linea(cuerpo),
    tronco: linea(cuerpo),
    brazoB: linea(cuerpo), antebrazoB: linea(cuerpo),
    brazoA: linea(cuerpo), antebrazoA: linea(cuerpo),
    espada: linea(cuerpo, "monigote__espada")   /* ya no se ve: queda por compatibilidad */
  };
  partes.espada.style.display = "none";
  var cabeza = el("circle", { "class": "monigote__cabeza" }, cuerpo);
  /* el disfraz de Odiseo (arco): capa marrón a la espalda, DETRÁS de
     todo el cuerpo, y un gorro cónico (píleo) encima de la cabeza */
  var capaEl = el("path", { "class": "monigote__capa" });
  cuerpo.insertBefore(capaEl, cuerpo.firstChild);
  var gorroEl = el("path", { "class": "monigote__gorro" }, cuerpo);

  /* ---------- la guitarra --------------------------------------
     Acústica, dibujada en "espacio guitarra": origen en el centro
     del cuerpo, el mástil sale hacia +x. Un 8 con el bombo de abajo
     más grande que el de arriba y la cintura entre los dos; boca con
     roseta, puente, diapasón con trastes y pala con clavijas. Va en
     dos grupos porque el antebrazo que pisa pasa POR DELANTE del
     mástil y POR DETRÁS de la caja. */
  var guitMastil = el("g", {}, cuerpo);
  var guitCuerpo = el("g", {}, cuerpo);
  el("path", { "class": "monigote__diapason", d:
    "M 6.5,-1.05 L 20.6,-0.85 L 20.6,0.85 L 6.5,1.05 Z" }, guitMastil);
  el("path", { "class": "monigote__pala", d:
    "M 20.4,-1.0 L 21.3,-1.05 C 22.6,-1.55 24.2,-1.55 25.0,-1.2 " +
    "L 25.3,0 L 25.0,1.2 C 24.2,1.55 22.6,1.55 21.3,1.05 L 20.4,1.0 Z" }, guitMastil);
  [8.4, 10.2, 11.8, 13.2, 14.5, 15.7, 16.8, 17.8, 18.7, 19.6].forEach(function (x) {
    el("line", { "class": "monigote__traste", x1: x, y1: -0.95, x2: x, y2: 0.95 }, guitMastil);
  });
  el("line", { "class": "monigote__cejuela", x1: 20.55, y1: -0.9, x2: 20.55, y2: 0.9 }, guitMastil);
  [21.9, 23.1, 24.3].forEach(function (x) {
    el("circle", { "class": "monigote__clavija", cx: x, cy: -1.75, r: 0.38 }, guitMastil);
    el("circle", { "class": "monigote__clavija", cx: x, cy: 1.75, r: 0.38 }, guitMastil);
  });
  var cuerdasMastil = el("g", { "class": "monigote__cuerdas" }, guitMastil);
  [-0.5, 0, 0.5].forEach(function (y) {
    el("line", { x1: 6.5, y1: y * 1.1, x2: 20.6, y2: y }, cuerdasMastil);
  });

  el("path", { "class": "monigote__caja", d:
    "M 7.5,0 C 7.5,-2.6 5.6,-4.4 3.2,-4.4 C 1.4,-4.4 0.8,-3.6 -0.3,-3.6 " +
    "C -1.6,-3.6 -2.4,-5.9 -4.6,-5.9 C -8.0,-5.9 -10.3,-3.4 -10.3,0 " +
    "C -10.3,3.4 -8.0,5.9 -4.6,5.9 C -2.4,5.9 -1.6,3.6 -0.3,3.6 " +
    "C 0.8,3.6 1.4,4.4 3.2,4.4 C 5.6,4.4 7.5,2.6 7.5,0 Z" }, guitCuerpo);
  el("circle", { "class": "monigote__roseta", cx: 2.3, cy: 0, r: 1.95 }, guitCuerpo);
  el("circle", { "class": "monigote__boca", cx: 2.3, cy: 0, r: 1.5 }, guitCuerpo);
  el("path", { "class": "monigote__puente", d:
    "M -6.9,-2.3 L -5.4,-2.3 L -5.2,0 L -5.4,2.3 L -6.9,2.3 L -6.7,0 Z" }, guitCuerpo);
  var cuerdasCaja = el("g", { "class": "monigote__cuerdas" }, guitCuerpo);
  [-0.55, 0, 0.55].forEach(function (y) {
    el("line", { x1: -5.9, y1: y * 1.25, x2: 7.6, y2: y * 1.1 }, cuerdasCaja);
  });

  /* ---------- la espada: gladius romana (17/09) -----------------
     Antes era una raya naranja. En "espacio espada": la mano en el
     origen y la punta hacia +x. Hoja de acero con un degradado a lo
     ancho (el lado de arriba recibe luz, el de abajo queda en
     sombra), canal central oscuro y el BISEL del filo en claro a los
     dos lados, para que el filo se distinga del cuerpo de la hoja. La
     hoja es la de una gladius «Pompeya»: lados casi paralelos y punta
     triangular corta. Guarda y pomo de bronce, empuñadura estriada. */
  var espadaG = el("g", {}, cuerpo);
  degradado("linearGradient", "mon-acero",
    [["0", "#F2F6F9"], [".16", "#CDD5DC"], [".42", "#A4AEB7"], [".5", "#6C7781"],
     [".58", "#9CA6AF"], [".84", "#7D8791"], ["1", "#535D66"]],
    { x1: "0", y1: "-1", x2: "0", y2: "1", gradientUnits: "userSpaceOnUse" });
  /* EL BRILLO AZUL (17/09, «Dardo»): dos halos por detrás de la hoja y
     un tinte por encima; su opacidad sigue a `st.brilloEspada`. */
  var HOJA_D = "M 1.9,-0.98 C 6,-1.02 10,-0.92 12.7,-0.98 L 15.8,0 L 12.7,0.98 " +
               "C 10,0.92 6,1.02 1.9,0.98 Z";
  var haloEspadaAncho = el("path", { d: HOJA_D, "class": "monigote__dardo-halo2", opacity: 0 }, espadaG);
  var haloEspada = el("path", { d: HOJA_D, "class": "monigote__dardo-halo", opacity: 0 }, espadaG);
  el("path", { "class": "monigote__hoja-espada", d:
    "M 1.9,-0.98 C 6,-1.02 10,-0.92 12.7,-0.98 L 15.8,0 L 12.7,0.98 " +
    "C 10,0.92 6,1.02 1.9,0.98 Z" }, espadaG);
  /* bisel: la franja afilada, más clara, a lo largo de los dos filos */
  el("path", { "class": "monigote__bisel", d:
    "M 2.2,-0.62 C 6,-0.66 10,-0.58 12.5,-0.62 L 15.2,0" }, espadaG);
  el("path", { "class": "monigote__bisel", d:
    "M 2.2,0.62 C 6,0.66 10,0.58 12.5,0.62 L 15.2,0" }, espadaG);
  var tinteEspada = el("path", { d: HOJA_D, "class": "monigote__dardo-tinte", opacity: 0 }, espadaG);
  /* canal central y unas marcas de pulido */
  el("line", { "class": "monigote__canal", x1: 2.6, y1: 0, x2: 11.2, y2: 0 }, espadaG);
  [[4.1, 6.2, -0.35], [7.6, 9.4, 0.3], [9.8, 11.6, -0.28]].forEach(function (r) {
    el("line", { "class": "monigote__pulido", x1: r[0], y1: r[2], x2: r[1], y2: r[2] * 0.6 }, espadaG);
  });
  /* guarda, empuñadura estriada y pomo */
  el("rect", { "class": "monigote__bronce", x: 0.95, y: -2.05, width: 1.05, height: 4.1, rx: 0.5 }, espadaG);
  el("rect", { "class": "monigote__empunadura", x: -2.8, y: -0.66, width: 3.8, height: 1.32, rx: 0.4 }, espadaG);
  [-1.9, -0.95, 0.0].forEach(function (x) {
    el("line", { "class": "monigote__estria", x1: x, y1: -0.62, x2: x, y2: 0.62 }, espadaG);
  });
  el("ellipse", { "class": "monigote__bronce", cx: -3.45, cy: 0, rx: 0.95, ry: 1.35 }, espadaG);
  el("circle", { "class": "monigote__remache", cx: -3.45, cy: 0, r: 0.3 }, espadaG);

  /* ---------- la cafetera moka y la taza (17/09) ---------------
     En su propio espacio: la base en el origen, el eje +x hacia
     ARRIBA y +y hacia delante (donde va el pico). El asa, en -y, que
     es el lado por donde la agarra. */
  function hacerMoka(padre) {
    var g = el("g", {}, padre);
    /* caldera de abajo, con las caras del octógono */
    el("path", { "class": "monigote__moka", d: "M 0,-3.3 L 0,3.3 L 4.6,2.3 L 4.6,-2.3 Z" }, g);
    el("line", { "class": "monigote__moka-arista", x1: 1.6, y1: -3, x2: 1.6, y2: 2.9 }, g);
    el("line", { "class": "monigote__moka-arista", x1: 3.1, y1: -2.7, x2: 3.1, y2: 2.6 }, g);
    /* cintura y cuerpo de arriba */
    el("rect", { "class": "monigote__moka-cintura", x: 4.6, y: -2.5, width: 0.9, height: 5 }, g);
    el("path", { "class": "monigote__moka", d: "M 5.5,-2.4 L 5.5,2.4 L 8.8,1.5 L 8.8,-1.5 Z" }, g);
    /* pico y tapa */
    el("path", { "class": "monigote__moka", d: "M 6.4,2.3 L 8.4,3.9 L 7.4,1.6 Z" }, g);
    el("ellipse", { "class": "monigote__moka-tapa", cx: 8.9, cy: 0, rx: 0.7, ry: 1.6 }, g);
    el("circle", { "class": "monigote__moka-pomo", cx: 9.9, cy: 0, r: 0.85 }, g);
    /* asa negra, del lado de él */
    el("path", { "class": "monigote__moka-asa", d: "M 5.6,-2.6 C 8.4,-3.6 9,-5.6 7.4,-6.4 L 6.4,-5.2 C 7,-4.6 6.6,-3.8 5,-3.4 Z" }, g);
    return g;
  }
  function hacerTaza(padre) {
    var g = el("g", {}, padre);
    var nivel = el("path", { "class": "monigote__cafe", d: "M 0,0" }, g);
    el("path", { "class": "monigote__taza", d: "M 0,-2.4 L 0,2.4 L 3.9,2.9 L 3.9,-2.9 Z" }, g);
    el("path", { "class": "monigote__taza-asa", d: "M 1,-2.7 C 3.4,-4.2 3.6,-1.2 1.2,-0.6" }, g);
    el("ellipse", { "class": "monigote__taza-boca", cx: 3.9, cy: 0, rx: 0.7, ry: 2.9 }, g);
    var cafe = el("ellipse", { "class": "monigote__cafe", cx: 3.4, cy: 0, rx: 0.55, ry: 2.4, opacity: 0 }, g);
    g.__cafe = cafe;
    return g;
  }
  /* ---------- el arco y las flechas (17/09) --------------------
     Arco en "espacio arco": la empuñadura en el origen (la mano), las
     palas hacia arriba y abajo, curvadas hacia delante (+x), con las
     puntas vueltas. La cuerda va de punta a punta pasando por el
     culatín, que se retrasa con la tensión.
     Flecha en "espacio flecha": la punta en el origen y el asta hacia
     +x (hacia atrás), con dos plumas junto al culatín. */
  function hacerFlecha(padre) {
    var g = el("g", {}, padre);
    el("line", { "class": "monigote__flecha-asta", x1: 1.6, y1: 0, x2: 18, y2: 0 }, g);
    el("path", { "class": "monigote__flecha-punta", d: "M 0,0 L 2.4,-0.8 L 1.9,0 L 2.4,0.8 Z" }, g);
    el("path", { "class": "monigote__flecha-pluma", d: "M 14.4,0 L 17.2,-1.35 L 18.3,-1.35 L 17.4,0 Z" }, g);
    el("path", { "class": "monigote__flecha-pluma2", d: "M 14.4,0 L 17.2,1.35 L 18.3,1.35 L 17.4,0 Z" }, g);
    return g;
  }
  /* EL CARCAJ (17/09): de cuero, a la espalda, con plumas asomando. En
     "espacio carcaj": la boca en el origen y el cuerpo hacia +x (hacia
     abajo, por la espalda). Solo se ve con el arco. */
  function carcajBoca(cue, tronco) {
    var arriba = dir(180 + tronco), atras = [-arriba[1], arriba[0]];
    return { punto: mas(mas(cue, atras, 2.6), arriba, 2.2) };
  }
  var carcajG = el("g", {}, cuerpo);
  el("path", { "class": "monigote__carcaj", d: "M 0,-1.3 L 11,-1.0 L 11.6,0 L 11,1.0 L 0,1.3 Z" }, carcajG);
  el("line", { "class": "monigote__carcaj-cinta", x1: 2.2, y1: -1.3, x2: 2.2, y2: 1.3 }, carcajG);
  el("line", { "class": "monigote__carcaj-cinta", x1: 8.6, y1: -1.1, x2: 8.6, y2: 1.1 }, carcajG);
  [-0.6, 0.1, 0.7].forEach(function (y, i) {
    el("line", { "class": "monigote__flecha-asta", x1: 0.5, y1: y, x2: -2.6 - i * 0.3, y2: y * 1.3 }, carcajG);
    el("path", { "class": i === 1 ? "monigote__flecha-pluma2" : "monigote__flecha-pluma",
      d: "M " + (-1.4 - i * 0.3) + "," + (y * 1.3) + " L " + (-3.2 - i * 0.3) + "," + (y * 1.3 - 0.7) +
         " L " + (-3.6 - i * 0.3) + "," + (y * 1.3) + " Z" }, carcajG);
  });
  var flechaManoG = el("g", {}, cuerpo);
  hacerFlecha(flechaManoG);
  var arco = el("g", {}, cuerpo);
  var cuerda = el("polyline", { "class": "monigote__cuerda" }, arco);
  el("path", { "class": "monigote__arco-pala", d:
    "M -4.7,-10.9 L -3.8,-10 C -1.4,-8.5 0.2,-4 0,-1.3 L 0,1.3 C 0.2,4 -1.4,8.5 -3.8,10 L -4.7,10.9" }, arco);
  el("path", { "class": "monigote__arco-veta", d:
    "M -3.5,-9.5 C -1.5,-8 -0.4,-4.5 -0.5,-1.6 M -3.5,9.5 C -1.5,8 -0.4,4.5 -0.5,1.6" }, arco);
  el("rect", { "class": "monigote__arco-agarre", x: -0.8, y: -1.6, width: 1.7, height: 3.2, rx: 0.45 }, arco);
  var flechaArcoG = el("g", {}, arco);
  hacerFlecha(flechaArcoG);

  /* ---------- herramientas de taller (17/09) -------------------
     Formón y mazo de la puerta de Moria, y el cepillo de carpintero.
     Cada uno en su espacio: la mano en el origen y +x hacia la punta
     (el cepillo: la suela en el origen y +x hacia delante). */
  var cincel = el("g", {}, cuerpo);
  el("rect", { "class": "monigote__mango-herr", x: -3.4, y: -0.55, width: 4.3, height: 1.1, rx: 0.35 }, cincel);
  el("rect", { "class": "monigote__virola", x: 0.9, y: -0.6, width: 0.45, height: 1.2 }, cincel);
  el("path", { "class": "monigote__acero", d: "M 1.35,-0.35 L 4.5,-0.32 L 4.65,0.32 L 1.35,0.35 Z" }, cincel);
  var mazo = el("g", {}, cuerpo);
  el("rect", { "class": "monigote__mango-herr", x: -1, y: -0.35, width: 6.4, height: 0.7, rx: 0.3 }, mazo);
  el("rect", { "class": "monigote__mazo-cabeza", x: 5.2, y: -1.7, width: 2.3, height: 3.4, rx: 0.35 }, mazo);
  var CEPILLO_K = 1.6;       /* 17/09: más grande, no se veía */
  var cepilloG = el("g", {}, cuerpo);
  /* cuerpo, suela, empuñadura trasera, pomo delantero y cuchilla */
  el("path", { "class": "monigote__cepillo-cuerpo", d: "M -4,0 L 4,0 L 4,-2.3 L -4,-2.3 Z" }, cepilloG);
  el("line", { "class": "monigote__cepillo-suela", x1: -4, y1: -0.15, x2: 4, y2: -0.15 }, cepilloG);
  el("path", { "class": "monigote__cepillo-mango", d:
    "M -1.4,-2.3 C -1.2,-4.2 -2.4,-5.2 -3.4,-5.4 L -4.1,-4.4 C -3.4,-3.9 -3.1,-3 -3.2,-2.3 Z" }, cepilloG);
  el("path", { "class": "monigote__cepillo-mango", d:
    "M 2.6,-2.3 C 2.6,-3 2.7,-3.4 3,-3.7 L 2.4,-4.3 C 2,-3.9 1.9,-3 2,-2.3 Z" }, cepilloG);
  el("circle", { "class": "monigote__cepillo-mango", cx: 2.7, cy: -4.3, r: 0.95 }, cepilloG);
  el("path", { "class": "monigote__cepillo-hierro-hoja", d: "M 1.2,-3.6 L 1.9,-3.3 L 0.2,-0.05 L -0.3,-0.2 Z" }, cepilloG);
  el("rect", { "class": "monigote__cepillo-tapa", x: -0.2, y: -3.2, width: 1.5, height: 1.2, rx: 0.3 }, cepilloG);

  /* ---------- la varita ----------------------------------------
     En "espacio varita": la mano en el origen, la punta hacia +x.
     Pomo redondo, empuñadura torneada con dos anillos, y la vara
     que se estrecha hasta la punta. */
  var varita = el("g", {}, cuerpo);
  el("path", { "class": "monigote__varita-vara", d:
    "M 3.4,-0.5 C 7,-0.36 11,-0.2 14.6,-0.06 L 14.6,0.06 C 11,0.2 7,0.36 3.4,0.5 Z" }, varita);
  el("path", { "class": "monigote__varita-mango", d:
    "M -1.9,-0.62 C -0.6,-0.9 1.6,-0.9 3.5,-0.66 L 3.5,0.66 " +
    "C 1.6,0.9 -0.6,0.9 -1.9,0.62 Z" }, varita);
  el("circle", { "class": "monigote__varita-mango", cx: -2.3, cy: 0, r: 0.85 }, varita);
  el("rect", { "class": "monigote__varita-anillo", x: 3.1, y: -0.78, width: 0.55, height: 1.56, rx: 0.2 }, varita);
  el("rect", { "class": "monigote__varita-anillo", x: -1.35, y: -0.74, width: 0.4, height: 1.48, rx: 0.15 }, varita);
  var puntaVarita = el("circle", { "class": "monigote__varita-luz", cx: 14.6, cy: 0, r: 0.9 }, varita);

  /* ---------- el lápiz -----------------------------------------
     Desde la punta (origen) hacia atrás. Largo a propósito: 12
     unidades, casi el largo del antebrazo. */
  var lapiz = el("g", {}, cuerpo);
  var LAPIZ_K = 1.5;
  var ESPADA_K = 1.4;        /* 17/09: la gladius, un 40 % más grande (él) */         /* 17/09: era 2, un poco menos largo (él) */
  /* 17/09: más grande (15 unidades) y más grueso, amarillo intenso
     con una arista más oscura, y goma rosa en el extremo. */
  el("path", { "class": "monigote__lapiz-madera", d: "M 0.75,-0.24 L 2.5,-0.62 L 2.5,0.62 L 0.75,0.24 Z" }, lapiz);
  el("path", { "class": "monigote__lapiz-mina", d: "M 0,0 L 0.8,-0.26 L 0.8,0.26 Z" }, lapiz);
  el("rect", { "class": "monigote__lapiz-cuerpo", x: 2.5, y: -0.62, width: 10.4, height: 1.24 }, lapiz);
  el("rect", { "class": "monigote__lapiz-arista", x: 2.5, y: -0.12, width: 10.4, height: 0.24 }, lapiz);
  el("rect", { "class": "monigote__lapiz-virola", x: 12.9, y: -0.66, width: 0.9, height: 1.32 }, lapiz);
  el("rect", { "class": "monigote__lapiz-goma", x: 13.8, y: -0.62, width: 1.3, height: 1.24, rx: 0.5 }, lapiz);

  /* ---------- el hacha -----------------------------------------
     En "espacio hacha": el pomo en el origen, el cabo hacia +x y el
     filo hacia +y (que es el lado hacia donde va el golpe).
     El cabo no es un palo recto: es un perfil ergonómico en S, con
     el remate del pomo abultado y curvado hacia el filo, la parte
     de agarre más fina, una panza en el medio y el cuello estrecho
     bajo la cabeza. La cabeza tiene nuca, ojo, barba y un filo
     curvo más ancho que el ojo. */
  var FILO = [18.2, 5.35];   /* centro del filo, en espacio hacha */
  function perfilCabo() {
    var arriba = [], abajo = [];
    for (var i = 0; i <= 24; i++) {
      var x = 19.4 * i / 24;
      var c = 0.38 * Math.sin(Math.PI * x / 19.4) - 0.22 * Math.sin(2 * Math.PI * x / 19.4);
      var w = 0.52 + 0.34 * Math.exp(-Math.pow(x / 0.9, 2))   /* pomo */
                   + 0.12 * Math.exp(-Math.pow((x - 9) / 3.6, 2)) /* panza */
                   - 0.08 * Math.exp(-Math.pow((x - 15.5) / 1.6, 2)); /* cuello */
      var gancho = 0.45 * Math.exp(-Math.pow(x / 0.7, 2));    /* el pomo se curva al filo */
      arriba.push([x, c - w + gancho * 0.3]);
      abajo.push([x, c + w + gancho]);
    }
    var d = "M -0.15," + (abajo[0][1] - 0.2).toFixed(2);
    arriba.forEach(function (p) { d += " L " + p[0].toFixed(2) + "," + p[1].toFixed(2); });
    for (var j = abajo.length - 1; j >= 0; j--) d += " L " + abajo[j][0].toFixed(2) + "," + abajo[j][1].toFixed(2);
    return d + " Z";
  }
  function hacerHacha(padre) {
    var g = el("g", {}, padre);
    el("path", { "class": "monigote__cabo", d: perfilCabo() }, g);
    el("path", { "class": "monigote__hoja", d:
      "M 16.5,-1.65 L 19.7,-1.65 L 19.9,0.9 " +
      "C 20.1,2.4 20.8,3.7 21.6,4.6 " +
      "Q 18.6,6.9 14.8,5.4 " +
      "C 15.7,4.2 16.2,2.6 16.3,0.9 Z" }, g);
    el("path", { "class": "monigote__hoja-filo", d: "M 21.6,4.6 Q 18.6,6.9 14.8,5.4" }, g);
    el("line", { "class": "monigote__hoja-ojo", x1: 16.9, y1: -0.35, x2: 19.3, y2: -0.35 }, g);
    return g;
  }
  var hacha = hacerHacha(cuerpo);

  /* ---------- troncos ------------------------------------------
     Un mismo dibujo sirve tumbado (se ve la testa: círculo con
     anillos) y de pie (se ve la corteza, con la tapa arriba). `k`
     va de 0 (testa) a 1 (de pie) y mezcla las dos vistas: así, al
     ponerlo sobre el tocón, parece que lo gira. */
  function hacerTronco(padre) {
    var t = { g: el("g", {}, padre) };
    t.corteza = el("rect", { "class": "monigote__corteza", x: -3 }, t.g);
    t.veta1 = el("line", { "class": "monigote__corteza-veta" }, t.g);
    t.veta2 = el("line", { "class": "monigote__corteza-veta" }, t.g);
    t.tapa = el("ellipse", { "class": "monigote__testa", cx: 0, rx: 2.8, ry: 0.85 }, t.g);
    t.testa = el("circle", { "class": "monigote__testa", cx: 0, cy: 0, r: 2.45 }, t.g);
    t.anillo = el("circle", { "class": "monigote__anillo", cx: 0.15, cy: 0.1, r: 1.5 }, t.g);
    t.nucleo = el("circle", { "class": "monigote__anillo", cx: 0.25, cy: 0.15, r: 0.55 }, t.g);
    return t;
  }
  function pintarTronco(t, P, k, alfa, rot) {
    if (!P || alfa <= 0.01) { t.g.setAttribute("opacity", 0); return; }
    var alto = 6 + 2 * k, r = 3 * (1 - k) + 0.5 * k;
    t.g.setAttribute("opacity", alfa);
    t.g.setAttribute("transform", "translate(" + P[0] + "," + P[1] + ") rotate(" + (rot || 0) + ") scale(" + ESCALA + ")");
    t.corteza.setAttribute("y", -alto / 2); t.corteza.setAttribute("width", 6);
    t.corteza.setAttribute("height", alto);
    t.corteza.setAttribute("rx", r); t.corteza.setAttribute("ry", r);
    [[t.veta1, -1.2], [t.veta2, 1.3]].forEach(function (v) {
      v[0].setAttribute("x1", v[1]); v[0].setAttribute("x2", v[1] + 0.2);
      v[0].setAttribute("y1", -alto / 2 + 1.2); v[0].setAttribute("y2", alto / 2 - 0.6);
      v[0].setAttribute("opacity", k);
    });
    t.tapa.setAttribute("cy", -alto / 2 + 0.2);
    t.tapa.setAttribute("opacity", k);
    [t.testa, t.anillo, t.nucleo].forEach(function (e) { e.setAttribute("opacity", 1 - k); });
  }
  var troncoMano = hacerTronco(cuerpo);

  /* ---------- el libro -----------------------------------------
     17/09, 2.ª versión (él): antes se abría enseñando las páginas
     hacia la pantalla, que no tiene sentido si el muñeco lee de lado.
     Ahora se ve como se vería de verdad desde un costado: la TAPA
     roja, un poco en perspectiva, con el lomo y sus nervios, y el
     canto de las hojas asomando por arriba y por el lado de su cara.
     Abrirlo ensancha ese canto (las dos mitades se separan) y pasar
     página es una hoja que se levanta por encima del canto.
     En "espacio libro": x hacia delante (el lomo, lejos de su cara),
     y hacia abajo. */
  var LIBRO_S = 1.25;
  var libro = el("g", {}, cuerpo);
  var libroHojasArriba = el("path", { "class": "monigote__libro-hojas" }, libro);
  var libroCanto = el("path", { "class": "monigote__libro-hojas" }, libro);
  el("path", { "class": "monigote__libro-tapa", d:
    "M 1.5,-5.3 L -1.8,-4.8 L -1.8,5.0 L 1.5,5.5 Z" }, libro);
  el("path", { "class": "monigote__libro-lomo-banda", d:
    "M 1.5,-5.3 L 0.9,-5.2 L 0.9,5.4 L 1.5,5.5 Z" }, libro);
  [-3.2, -2.4, 2.6, 3.4].forEach(function (y) {
    el("line", { "class": "monigote__libro-nervio", x1: 0.95, y1: y, x2: 1.45, y2: y + 0.05 }, libro);
  });
  el("path", { "class": "monigote__libro-titulo", d:
    "M -1.1,-2.2 L 0.35,-2.4 M -1.1,-1.4 L 0.35,-1.6 M -0.8,1.6 L 0.1,1.5" }, libro);
  var libroHoja = el("path", { "class": "monigote__libro-hoja" }, libro);

  function pintarLibro(abierto, hoja) {
    var k = clamp(abierto, 0, 1);
    var alto = 0.45 + 1.0 * k;           /* hojas por encima de la tapa */
    libroHojasArriba.setAttribute("d",
      "M 1.3,-5.25 L -1.75,-4.8 L -1.95," + (-4.8 - alto).toFixed(2) +
      " L 1.1," + (-5.25 - alto * 0.55).toFixed(2) + " Z");
    var canto = 0.35 + 0.9 * k;          /* canto de las hojas, del lado de su cara */
    libroCanto.setAttribute("d",
      "M -1.75,-4.8 L " + (-1.75 - canto).toFixed(2) + "," + (-4.95 - alto * 0.3).toFixed(2) +
      " L " + (-1.75 - canto).toFixed(2) + ",4.85 L -1.75,4.95 Z");
    if (hoja >= 0 && hoja <= 1) {
      var x = lerp(-1.9 - canto, 1.2, hoja), sube = 2.6 * Math.sin(Math.PI * hoja);
      libroHoja.setAttribute("d", "M " + (-1.8 - canto).toFixed(2) + "," + (-4.9 - alto).toFixed(2) +
        " Q " + x.toFixed(2) + "," + (-5.2 - alto - sube * 1.6).toFixed(2) +
        " 1.2," + (-5.2 - alto * 0.55).toFixed(2));
      libroHoja.style.display = "";
    } else {
      libroHoja.style.display = "none";
    }
  }

  /* ---------- cinemática inversa de un brazo -------------------
     Dado el hombro y DÓNDE tiene que acabar la mano, calcula el
     codo. Hay dos soluciones (el codo a un lado o al otro de la
     recta hombro-mano); `elegir` decide cuál. Si la mano no llega,
     se acerca la MANO hasta donde llega: el antebrazo nunca se
     estira. Todo en unidades. */
  function codoIK(hom, mano, l1, l2, elegir) {
    var dx = mano[0] - hom[0], dy = mano[1] - hom[1];
    var real = Math.sqrt(dx * dx + dy * dy) || 0.001;
    var ux = dx / real, uy = dy / real;
    var max = (l1 + l2) * 0.999, min = Math.abs(l1 - l2) * 1.001 + 0.001;
    var d = clamp(real, min, max);
    var fin = (d === real) ? mano : [hom[0] + ux * d, hom[1] + uy * d];
    var a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
    var h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    var c1 = [hom[0] + a * ux - h * uy, hom[1] + a * uy + h * ux];
    var c2 = [hom[0] + a * ux + h * uy, hom[1] + a * uy - h * ux];
    return { codo: elegir(c1, c2), mano: fin };
  }
  function masBajo(a, b) { return a[1] < b[1] ? a : b; }
  function masAtras(a, b) { return a[0] < b[0] ? a : b; }

  /* ---------- el decorado ------------------------------------- */
  /* De unidades de escena a píxeles. La escena se ancla donde está
     el muñeco al empezarla y mira hacia donde él mira. */
  function eP(f, h) { return [esc.x0 + esc.m * f * ESCALA, st.suelo - h * ESCALA]; }
  /* De unidades de escena a unidades del cuerpo (por si el muñeco
     no está justo en el ancla). */
  function eCuerpo(pt) {
    var X = esc.x0 + esc.m * pt[0] * ESCALA;
    return [(X - st.x) / (st.mira * ESCALA), pt[1]];
  }

  /* Los grupos estáticos se dibujan en coordenadas de escena
     (x = f, y = -h) y el grupo los coloca con un solo transform. */
  var escDibujo = el("g", { opacity: 0 }, capaFondo);
  var escDibujoLuz = el("g", { opacity: 0 }, capaEfectos);
  var escArbol = el("g", { opacity: 0 }, capaFondo);
  var escHachaFondo = el("g", { opacity: 0 }, capaFondo);
  var escHachaFrente = el("g", { opacity: 0 }, capaFrente);
  var dinFondo = el("g", {}, capaFondo);     /* piezas sueltas: pila */
  var dinFrente = el("g", {}, capaFrente);   /* tronco en el tocón, mitades, hacha apoyada */

  function L(p, x1, y1, x2, y2, clase) {
    return el("line", { x1: x1, y1: y1, x2: x2, y2: y2, "class": clase, "stroke-linecap": "round" }, p);
  }
  function fx(n) { return n.toFixed(2); }

  /* --- mesa de dibujo (vista lateral) ---
     Tablero inclinado de B0 (canto bajo, hacia él) a B1. */
  /* 17/09 (él): tablero más ancho, de 17,5 a 26 unidades, con la
     misma inclinación (24°). */
  var B0 = [10, 22], B1 = [33.8, 32.6];
  function tablero(u) { return lerpP(B0, B1, u); }
  var DB = unir(B0, B1);                 /* a lo largo del tablero */
  var NB = [-DB[1], DB[0]];              /* normal, hacia arriba */
  var LAMPARA = { J: [28.5, 50], T: [19.5, 28.5] };

  (function construirMesa() {
    var g = escDibujo;
    /* taburete */
    L(g, -3.6, -15.4, 3.2, -15.4, "monigote__m monigote__m--asiento");
    L(g, -2.4, -14.6, -4.8, 0, "monigote__m");
    L(g, 2.2, -14.6, 4.4, 0, "monigote__m");
    L(g, -4.0, -5.6, 3.7, -5.6, "monigote__m monigote__m--fino");
    /* patas y travesaño de la mesa */
    L(g, 13.2, -21.2, 11.6, 0, "monigote__m");
    L(g, 31.4, -30.6, 33.8, 0, "monigote__m");
    L(g, 12.2, -7, 33.2, -7, "monigote__m monigote__m--fino");
    L(g, 22.4, -26, 23.2, -7, "monigote__m monigote__m--fino");
    L(g, 9.6, 0, 13.8, 0, "monigote__m");
    L(g, 31.6, 0, 36.0, 0, "monigote__m");
    /* tablero, papel y el listón que para los lápices */
    L(g, B0[0], -B0[1], B1[0], -B1[1], "monigote__m monigote__m--tablero");
    var p0 = mas(tablero(0.14), NB, 1.0), p1 = mas(tablero(0.8), NB, 1.0);
    L(g, p0[0], -p0[1], p1[0], -p1[1], "monigote__papel");
    var r0 = mas(B0, NB, 0.4), r1 = mas(B0, NB, 2.2);
    L(g, r0[0] - DB[0] * 0.4, -r0[1] + DB[1] * 0.4, r1[0] - DB[0] * 0.4, -r1[1] + DB[1] * 0.4, "monigote__m monigote__m--fino");

    /* lámpara tipo Luxo: pinza en el canto alto, dos brazos de
       varillas dobles, y la pantalla apuntando al papel */
    var base = mas(tablero(0.95), NB, 1.2);
    var E1 = [37.2, 45.2], J = LAMPARA.J;
    var pinza = mas(tablero(0.95), NB, -0.6);
    L(g, pinza[0], -pinza[1], base[0], -base[1], "monigote__lamp monigote__lamp--pinza");
    function varilla(a, b) {
      var n = perp(unir(a, b));
      L(g, a[0], -a[1], b[0], -b[1], "monigote__lamp");
      L(g, a[0] + n[0] * 0.75, -(a[1] + n[1] * 0.75), b[0] + n[0] * 0.75, -(b[1] + n[1] * 0.75), "monigote__lamp monigote__lamp--fino");
    }
    varilla(base, E1);
    varilla(E1, J);
    /* muelles: dos zigzags pequeños junto a las varillas */
    [[base, E1], [E1, J]].forEach(function (par) {
      var u = unir(par[0], par[1]), n = perp(u), d = "";
      for (var i = 0; i <= 8; i++) {
        var q = mas(mas(par[0], u, 2 + i * 0.55), n, -0.6 + (i % 2 ? -0.35 : 0.35));
        d += (i ? " L " : "M ") + fx(q[0]) + "," + fx(-q[1]);
      }
      el("path", { d: d, "class": "monigote__lamp monigote__lamp--muelle" }, g);
    });
    [base, E1, J].forEach(function (q) {
      el("circle", { cx: q[0], cy: -q[1], r: 0.75, "class": "monigote__lamp-relleno" }, g);
    });
    /* pantalla */
    var d = unir(J, LAMPARA.T), n = perp(d);
    function pt(a, b) { var q = mas(mas(J, d, a), n, b); return fx(q[0]) + "," + fx(-q[1]); }
    el("path", { "class": "monigote__lamp-relleno", d:
      "M " + pt(-0.9, 0.9) + " Q " + pt(-1.9, 0) + " " + pt(-0.9, -0.9) +
      " L " + pt(0.6, -1.0) + " Q " + pt(2.6, -1.3) + " " + pt(4.3, -2.7) +
      " L " + pt(4.3, 2.7) + " Q " + pt(2.6, 1.3) + " " + pt(0.6, 1.0) + " Z" }, g);
    var bomb = mas(J, d, 3.9);
    el("circle", { cx: bomb[0], cy: -bomb[1], r: 1.0, "class": "monigote__bombillo" }, g);

    /* la luz: un cono cálido muy suave y un charco sobre el papel */
    var boca1 = mas(mas(J, d, 4.2), n, 2.6), boca2 = mas(mas(J, d, 4.2), n, -2.6);
    var q1 = mas(tablero(0.14), NB, 1.1), q2 = mas(tablero(0.5), NB, 1.1);
    el("path", { "class": "monigote__luz", d:
      "M " + fx(boca1[0]) + "," + fx(-boca1[1]) + " L " + fx(boca2[0]) + "," + fx(-boca2[1]) +
      " L " + fx(q2[0]) + "," + fx(-q2[1]) + " L " + fx(q1[0]) + "," + fx(-q1[1]) + " Z" }, escDibujoLuz);
    luzGrad.setAttribute("x1", J[0]); luzGrad.setAttribute("y1", -J[1]);
    luzGrad.setAttribute("x2", LAMPARA.T[0]); luzGrad.setAttribute("y2", -LAMPARA.T[1]);
    var c = mas(tablero(0.31), NB, 1.2);
    el("ellipse", { cx: 0, cy: 0, rx: 7, ry: 1.8, fill: "url(#mon-charco)",
      transform: "translate(" + fx(c[0]) + "," + fx(-c[1]) + ") rotate(" + fx(-Math.atan2(DB[1], DB[0]) / RAD) + ")" }, escDibujoLuz);
  })();

  /* --- el árbol donde se recuesta a leer (17/09) ---
     El borde del tronco que da a él está donde queda su espalda con
     el torso echado atrás 12°, y se abre en raíces hacia la cadera.
     La copa arranca por encima de su cabeza. */
  (function construirArbol() {
    /* 17/09, 2.ª versión (él): un SAMÁN, un 25 % más grande y con la
       copa mucho más ancha, en paraguas. El borde del tronco que da a
       su espalda NO se mueve (sigue donde queda su espalda); el resto
       crece hacia atrás y hacia arriba. Tronco corto que se abre en
       ramas largas casi horizontales, y la copa encima: una bóveda
       ancha y chata, más oscura por debajo. */
    var g = escArbol;
    el("path", { "class": "monigote__corteza", d:
      "M -2.2,0 C -3.8,-1.4 -5.2,-5 -5.9,-11 L -6.3,-30 " +
      "C -6.8,-34 -8.5,-37 -10.5,-38 L -14,-38 C -15.4,-36 -16.4,-33 -16.4,-30 " +
      "L -16.2,-11 C -17,-5 -19,-1.4 -21.6,0 Z" }, g);
    [[-8.6, -3], [-11, -6], [-13.6, -4]].forEach(function (v) {
      el("path", { "class": "monigote__corteza-veta", fill: "none", d:
        "M " + v[0] + "," + v[1] + " C " + (v[0] + 0.7) + "," + (v[1] - 12) + " " +
        (v[0] - 0.6) + "," + (v[1] - 24) + " " + (v[0] + 0.3) + ",-34" }, g);
    });
    /* ramas: salen del tronco y se abren como las varillas de un paraguas */
    [["M -9,-34 C -4,-40 6,-44 20,-49", 2.4], ["M -10,-35 C -8,-43 -2,-49 6,-54", 2.0],
     ["M -12,-35 C -12,-44 -12,-50 -11,-57", 2.0], ["M -14,-34 C -19,-42 -26,-48 -34,-51", 2.2],
     ["M -15,-33 C -24,-38 -36,-43 -46,-47", 2.4]].forEach(function (r) {
      el("path", { "class": "monigote__rama", d: r[0], "stroke-width": r[1] }, g);
    });
    /* la copa: bóveda de sombra y encima los bultos con luz */
    el("path", { "class": "monigote__copa1", d:
      "M -58,-48 C -58,-60 -40,-70 -12,-71 C 16,-70 34,-60 34,-48 " +
      "C 26,-44 14,-46 4,-45 C -8,-47 -18,-46 -30,-45 C -42,-46 -52,-44 -58,-48 Z" }, g);
    [[-49, -54, 9, 5.5, 2], [-36, -59, 11, 7, 2], [-21, -63, 11, 7.5, 2], [-5, -63, 11, 7.5, 2],
     [10, -59, 11, 7, 2], [24, -53, 9, 5.5, 2],
     [-42, -60, 6, 4, 3], [-27, -66, 7, 4.2, 3], [-11, -68, 7, 4, 3], [5, -66, 7, 4, 3],
     [19, -60, 6, 3.6, 3], [-33, -52, 5, 2.6, 3], [0, -54, 5, 2.6, 3]].forEach(function (c) {
      el("ellipse", { cx: c[0], cy: c[1], rx: c[2], ry: c[3], "class": "monigote__copa" + c[4] }, g);
    });
    /* la cara de abajo, en sombra, recta como la de un samán */
    el("path", { "class": "monigote__copa0", d:
      "M -56,-47 C -44,-43 -30,-46 -18,-45 C -6,-44 6,-46 16,-45 C 24,-44 30,-46 33,-48 " +
      "C 26,-49 12,-49 -4,-49 C -22,-50 -40,-50 -56,-47 Z" }, g);
  })();

  /* --- la diana del arco (17/09) ---
     Una diana de paja de cara al espectador, un poco girada (por eso
     elíptica), sobre un caballete. Va a la izquierda del todo; su
     centro, a la altura a la que sale la flecha. En unidades, con el
     centro en el origen y el suelo a DIANA.alto por debajo. */
  var DIANA = { x: 16, y: 0, alto: 34 };
  /* la punta de la flecha al apuntar, respecto de sus pies (px, medida
     con a_apunta): de ahí sale la línea recta por la que pasa */
  var PUNTA_ARCO = [-15.6, -28.8];
  var dianaG = el("g", { opacity: 0 }, capaFondo);
  (function construirDiana() {
    var H = DIANA.alto;
    L(dianaG, 0.5, 5, -4.5, H, "monigote__m");
    L(dianaG, 1.5, 5, 6.5, H, "monigote__m");
    L(dianaG, -2.6, 22, 4.6, 22, "monigote__m monigote__m--fino");
    el("ellipse", { cx: 1.3, cy: 0, rx: 3.7, ry: 11.3, "class": "monigote__diana-paja" }, dianaG);
    [[11, "blanco"], [8.8, "negro"], [6.6, "azul"], [4.4, "rojo"], [2.2, "oro"]].forEach(function (a) {
      el("ellipse", { cx: 0, cy: 0, rx: (a[0] * 0.33).toFixed(2), ry: a[0], "class": "monigote__diana-" + a[1] }, dianaG);
    });
    el("ellipse", { cx: 0, cy: 0, rx: 0.2, ry: 0.55, "class": "monigote__diana-centro" }, dianaG);
  })();
  /* LAS HACHAS DE ODISEO (él, 17/09/2026): cuatro pares, cada uno con
     los cabos cruzados y las cabezas juntas arriba; el hueco que queda
     es un rombo, y la flecha pasa por el de los cuatro. Van de frente
     (como la gaveta del café) sobre un tronco que las sube a la altura
     del tiro. En unidades, con el origen en la cara de arriba del
     tronco y -y hacia arriba. */
  var ROMBO_C = 15;             /* el centro del rombo, sobre el tronco */
  var paresG = [0, 1, 2, 3].map(function () {
    var g = el("g", { opacity: 0 }, capaFondo);
    var tronco = el("rect", { x: -7, y: 0, width: 14, height: 10, "class": "monigote__corteza" }, g);
    el("ellipse", { cx: 0, cy: 0, rx: 7, ry: 1.4, "class": "monigote__testa" }, g);
    [-1, 1].forEach(function (lado) {
      var h = hacerHacha(g);
      /* pomo a un lado, inclinada hacia el otro, el filo hacia dentro */
      h.setAttribute("transform", "translate(" + (lado * 5) + ",0) rotate(" + (lado < 0 ? -62 : -118) +
        ") scale(1.4," + (lado < 0 ? -1.4 : 1.4) + ")");
    });
    g.__tronco = tronco;
    return g;
  });
  function lineaTiro() {
    var xs = (PUESTOS.arco ? PUESTOS.arco() : casa) + PUNTA_ARCO[0], ys = st.suelo + PUNTA_ARCO[1];
    return { xs: xs, ys: ys, xt: DIANA.x + 0.6, yt: DIANA.y };
  }
  function pintarHachasArco(v) {
    var L0 = lineaTiro();
    paresG.forEach(function (g, i) {
      g.style.display = v > 0 ? "" : "none";
      if (!(v > 0)) return;
      var f = (i + 1) / 5;
      var x = L0.xt + (L0.xs - L0.xt) * f, y = L0.yt + (L0.ys - L0.yt) * f;
      var base = y + ROMBO_C * ESCALA;
      g.setAttribute("opacity", v);
      g.setAttribute("transform", "translate(" + x.toFixed(2) + "," + base.toFixed(2) + ") scale(" + ESCALA + ")");
      g.__tronco.setAttribute("height", Math.max(0, (st.suelo + 1 - base) / ESCALA).toFixed(2));
    });
  }
  var flechasG = el("g", {}, capaFrente);
  var clavadasEl = [0, 1, 2, 3, 4].map(function () { return hacerFlecha(flechasG); });
  var astillasFEl = [-1, 1].map(function (lado) {
    var g = el("g", {}, flechasG);
    el("line", { "class": "monigote__flecha-astilla", x1: 1.6, y1: 0, x2: 18, y2: 0 }, g);
    el("path", { "class": lado < 0 ? "monigote__flecha-pluma" : "monigote__flecha-pluma2",
      d: lado < 0 ? "M 14.4,0 L 17.2,-1.35 L 18.3,-1.35 L 17.4,0 Z"
                  : "M 14.4,0 L 17.2,1.35 L 18.3,1.35 L 17.4,0 Z" }, g);
    return g;
  });
  var flechaVueloEl = hacerFlecha(capaEfectos);

  /* Dónde da cada flecha, en píxeles desde el centro (+ = abajo). La
     ÚLTIMA va al centro y parte en dos la que ya estaba ahí. */
  var DISPAROS = [-4.3, 0, 3.6, 0];

  function soltarFlecha(dy, partir) {
    st.flechaCargada = false;
    if (!st.puntaFlecha) return;
    var x0 = st.puntaFlecha[0], y0 = st.puntaFlecha[1];
    var x1 = DIANA.x + 0.6, y1 = DIANA.y + dy;
    st.vuelo = { x0: x0, y0: y0, x1: x1, y1: y1, x: x0, y: y0, ang: 0, t: 0,
                 T: Math.max(120, Math.abs(x0 - x1) / 0.62), partir: partir };
  }
  /* el tiro de Odiseo: recto, sin parábola, por los cuatro rombos
     hasta el centro del blanco */
  function tiroOdiseo() {
    st.flechaCargada = false;
    if (!st.puntaFlecha) return;
    var x0 = st.puntaFlecha[0], y0 = st.puntaFlecha[1];
    var x1 = DIANA.x + 0.6, y1 = DIANA.y;
    st.vuelo = { x0: x0, y0: y0, x1: x1, y1: y1, x: x0, y: y0, ang: 0, t: 0, arco: 0,
                 T: Math.abs(x0 - x1) / 0.4, partir: false };
  }
  function moverFlechas(dt) {
    var v = st.vuelo;
    if (v) {
      v.t += dt;
      var u = Math.min(1, v.t / v.T), ARC = v.arco != null ? v.arco : 6;
      v.x = lerp(v.x0, v.x1, u);
      v.y = lerp(v.y0, v.y1, u) - ARC * 4 * u * (1 - u);
      var vx = v.x1 - v.x0, vy = (v.y1 - v.y0) - ARC * 4 * (1 - 2 * u);
      v.ang = Math.atan2(-vy, -vx) / RAD;
      if (u >= 1) {
        if (v.partir) {
          /* ROBIN HOOD: la flecha entra por el culatín de la que ya
             estaba en el centro y la abre en dos */
          for (var i = 0; i < esc.flechas.length; i++) {
            var f = esc.flechas[i];
            if (Math.abs(f.y - v.y1) < 1.2) {
              esc.flechas.splice(i, 1);
              esc.astillasF = [-1, 1].map(function (lado) {
                return { x: f.x, y: f.y, ang: f.ang, lado: lado, edad: 0 };
              });
              var cola = [f.x + Math.cos(f.ang * RAD) * 18 * ESCALA, f.y + Math.sin(f.ang * RAD) * 18 * ESCALA];
              for (var k = 0; k < 10; k++) {
                particula("astilla", cola[0], cola[1], alAzar(-0.02, 0.06), alAzar(-0.08, 0.02), alAzar(500, 900), alAzar(0.3, 0.6));
              }
              break;
            }
          }
        }
        esc.flechas.push({ x: v.x1, y: v.y1, ang: v.ang, edad: 0 });
        for (var n = 0; n < 5; n++) {
          particula("astilla", v.x1 + 0.5, v.y1, alAzar(0.01, 0.05), alAzar(-0.05, 0.02), alAzar(300, 600), alAzar(0.25, 0.5));
        }
        st.vuelo = null;
      }
    }
    esc.flechas.forEach(function (f) { f.edad += dt; });
    st.cuerdaVibra = Math.max(0, (st.cuerdaVibra || 0) - dt / 700);
    esc.astillasF.forEach(function (a) { a.edad += dt; });
    if (esc.astillasF.length && esc.astillasF[0].edad > 2600) esc.astillasF = [];
  }
  function ponerFlecha(e, x, y, ang, alfa) {
    e.style.display = "";
    e.setAttribute("opacity", alfa);
    e.setAttribute("transform", "translate(" + x.toFixed(2) + "," + y.toFixed(2) + ") rotate(" +
      ang.toFixed(1) + ") scale(" + ESCALA + ")");
  }
  function pintarFlechas(enArco) {
    pintarHachasArco(enArco);
    dianaG.style.display = enArco > 0 ? "" : "none";
    dianaG.setAttribute("opacity", enArco);
    dianaG.setAttribute("transform", "translate(" + DIANA.x + "," + DIANA.y + ") scale(" + ESCALA + ")");
    clavadasEl.forEach(function (e, i) {
      var f = esc.flechas[i];
      if (!f || !(enArco > 0)) { e.style.display = "none"; return; }
      /* al clavarse, vibra un momento */
      var vib = 5 * Math.sin(f.edad / 22) * Math.exp(-f.edad / 140);
      ponerFlecha(e, f.x, f.y, f.ang + vib, enArco);
    });
    astillasFEl.forEach(function (e, i) {
      var a = esc.astillasF[i];
      if (!a || !(enArco > 0)) { e.style.display = "none"; return; }
      var x = a.x, y = a.y, rot, alfa = enArco;
      if (a.edad < 170) {
        /* se abren desde la punta, una hacia arriba y otra hacia abajo */
        rot = a.ang + a.lado * 32 * (a.edad / 170);
      } else {
        var t = a.edad - 170;
        /* al tocar el suelo se QUEDAN donde cayeron (antes seguían
           corriéndose a la derecha) */
        var v0 = a.lado * 0.025 - 0.035, g0 = 0.00035, suelo = st.suelo + 1;
        var tSuelo = (-v0 + Math.sqrt(v0 * v0 + 4 * g0 * Math.max(0, suelo - a.y))) / (2 * g0);
        var tt = Math.min(t, tSuelo);
        x = a.x + 0.035 * tt;
        y = Math.min(suelo, a.y + v0 * tt + g0 * tt * tt);
        rot = a.ang + a.lado * 32 + a.lado * 0.45 * tt;
        if (t > 1500) alfa *= Math.max(0, 1 - (t - 1500) / 600);
      }
      ponerFlecha(e, x, y, rot, alfa);
    });
    var v = st.vuelo;
    if (v) ponerFlecha(flechaVueloEl, v.x, v.y, v.ang, 1);
    else flechaVueloEl.style.display = "none";
  }

  /* --- leña ---
     Las distancias salen del hachazo: el tocón se pone JUSTO donde
     cae el filo con la pose h_golpe, y los demás sitios se sacan de
     ahí. Todo en unidades de escena, desde los pies del muñeco. */
  var TOCON = { alto: 12, ancho: 13 };
  var LEÑO = 8;               /* alto del tronco de pie */
  var HACHA = {};             /* se rellena en `medirLeña` */

  function cuelloDe(p) {
    var hip = [0, H.muslo + H.pierna - p.y];
    return mas(hip, dir(180 + p.tronco), H.cuello);
  }
  function medirLeña() {
    /* 1. el golpe: hy para que el filo caiga a la altura del leño */
    var g = POSES.h_golpe, cue = cuelloDe(g);
    var u = dir(g.ang), v = perp(u);
    var arriba = TOCON.alto + LEÑO;
    /* pomo = mano - u ; filo = pomo + u*FILO.x + v*FILO.y */
    var off = mas(mas([-u[0], -u[1]], u, FILO[0]), v, FILO[1]);
    g.hy = cue[1] + off[1] - arriba;
    HACHA.fb = cue[0] + g.hx + off[0];

    /* el remate: el filo sobre el mismo punto, pero en la cara de
       arriba del tocón, entrando un poco en la madera */
    var hu = POSES.h_hunde, cueH = cuelloDe(hu);
    var uh = dir(hu.ang), vh = perp(uh);
    var offH = mas(mas([-uh[0], -uh[1]], uh, FILO[0]), vh, FILO[1]);
    hu.hx = HACHA.fb - cueH[0] - offH[0];
    hu.hy = cueH[1] + offH[1] - (TOCON.alto - 0.5);

    /* 2. dónde se para para apoyar el hacha y poner el leño */
    HACHA.xc = 6;
    /* el hacha apoyada: pomo contra la cara del tocón, cabeza en el
       suelo, del lado del muñeco */
    var ap = POSES.h_apoya, cueA = cuelloDe(ap), ua = dir(ap.ang);
    var pomo = [HACHA.fb - TOCON.ancho / 2 - 0.2, 10.6];
    HACHA.pomo = pomo;
    var mano = mas(pomo, ua, 1);
    ap.hx = mano[0] - HACHA.xc - cueA[0];
    ap.hy = cueA[1] - mano[1];
    POSES.h_toma.hx = ap.hx; POSES.h_toma.hy = ap.hy;

    /* poner el leño: su centro sobre el tocón */
    var co = POSES.h_coloca, cueC = cuelloDe(co);
    HACHA.centroLeño = [HACHA.fb, TOCON.alto + LEÑO / 2];
    co.hx = HACHA.fb - HACHA.xc - cueC[0] - 0.5;
    co.hy = cueC[1] - HACHA.centroLeño[1];
    POSES.h_colocaM.hx = co.hx; POSES.h_colocaM.hy = co.hy;

    /* las poses de tirar del hacha atascada: las manos, en el cabo */
    var uG = dir(g.ang), knob = [cue[0] + g.hx - uG[0], cue[1] - g.hy - uG[1]];
    ["h_hala_a", "h_hala_b", "h_suelta"].forEach(function (n) {
      var q = POSES[n], cq = cuelloDe(q);
      q.hx = knob[0] - cq[0] + uG[0];
      q.hy = cq[1] - (knob[1] + uG[1]);
    });
    HACHA.clavada = { pomo: knob, ang: g.ang };

    /* 3. la pila, al otro lado del tocón */
    HACHA.fp = HACHA.fb + 27;
    HACHA.pila = [[HACHA.fp - 3.1, 3], [HACHA.fp + 3.1, 3], [HACHA.fp, 3 + Math.sqrt(36 - 3.1 * 3.1)]];
    /* dónde se para para recoger cada leño: el de arriba agachado,
       los dos de abajo con una rodilla en el suelo */
    HACHA.xps = HACHA.pila.map(function (c, n) {
      var ag = POSES[n === 2 ? "h_agacha" : "h_agachaBajo"], cueG = cuelloDe(ag);
      ag.hy = cueG[1] - c[1];
      return c[0] - (cueG[0] + ag.hx + 0.5);
    });
  }
  medirLeña();

  /* Las manos del levantarse: al piso (h = 0,3, el remate redondo
     de la mano queda sobre el borde) o sobre la rodilla. Todo
     relativo al cuello, así que `avance` no cambia la cuenta. */
  function medirLevantarse() {
    var r = POSES.lev_recoge, c = POSES.lev_cuclillas, e = POSES.lev_empuja;
    r.hy = cuelloDe(r)[1] - 0.3;
    c.hy = cuelloDe(c)[1] - 0.3;
    var hipE = [0, H.muslo + H.pierna - e.y];
    var rodE = mas(hipE, dir(e.caderaA), H.muslo);
    var cE = cuelloDe(e);
    e.hx = rodE[0] - cE[0] + 0.3;
    e.hy = cE[1] - (rodE[1] + 1.4);
  }
  medirLevantarse();

  (function construirLeña() {
    var g = escHachaFrente, fb = HACHA.fb, w = TOCON.ancho, a = TOCON.alto;
    /* el tocón */
    el("rect", { x: fb - w / 2, y: -a, width: w, height: a, rx: 0.8, "class": "monigote__corteza" }, g);
    [-4.3, -1.6, 1.4, 3.9].forEach(function (dx, i) {
      L(g, fb + dx, -a + 2.2, fb + dx + (i % 2 ? 0.4 : -0.3), -1.2, "monigote__corteza-veta");
    });
    L(g, fb - w / 2 - 0.6, -0.2, fb + w / 2 + 0.6, -0.2, "monigote__corteza-veta");
    el("ellipse", { cx: fb, cy: -a, rx: w / 2, ry: 1.7, "class": "monigote__testa" }, g);
    el("ellipse", { cx: fb + 0.3, cy: -a, rx: 4.0, ry: 1.05, "class": "monigote__anillo" }, g);
    el("ellipse", { cx: fb + 0.5, cy: -a, rx: 1.8, ry: 0.5, "class": "monigote__anillo" }, g);
    /* marcas de hachazos viejos */
    L(g, fb - 2.6, -a - 0.5, fb - 0.8, -a + 0.4, "monigote__corteza-veta");
    L(g, fb + 1.2, -a - 0.7, fb + 3.2, -a + 0.2, "monigote__corteza-veta");

  })();

  /* los tres leños de la pila; se recogen en este orden: el de
     arriba, el de abajo más cercano, el otro */
  var pilaEl = [hacerTronco(dinFondo), hacerTronco(dinFondo), hacerTronco(dinFondo)];
  var ORDEN_PILA = [2, 0, 1];
  var troncoBloque = hacerTronco(dinFrente);
  var hachaApoyada = hacerHacha(dinFrente);
  var hachaClavadaEl = hacerHacha(dinFrente);
  function hacerMitad(padre, lado) {
    var g = el("g", {}, padre);
    el("rect", { x: -1.5, y: -4, width: 3, height: 8, rx: 0.35, "class": "monigote__corteza" }, g);
    /* la cara partida, clara, del lado del corte */
    el("rect", { x: lado < 0 ? 0.5 : -1.5, y: -3.9, width: 1, height: 7.8, "class": "monigote__testa" }, g);
    el("ellipse", { cx: 0, cy: -3.9, rx: 1.45, ry: 0.45, "class": "monigote__testa" }, g);
    return g;
  }
  var mitadesEl = [hacerMitad(dinFrente, -1), hacerMitad(dinFrente, 1)];

  /* ---------- efectos: hechizos y partículas -----------------
     17/09 (él): la bola de fuego va el doble de rápido, y hay tres
     hechizos más: RAYO (el más rápido, un zigzag que se dibuja detrás
     de la cabeza del rayo), HIELO (una esquirla con escarcha que se
     rompe en trozos) y AGUA (una esfera que va soltando gotas y
     revienta en salpicadura). Todos van a la izquierda. */
  degradado("radialGradient", "mon-hielo",
    [["0", "#FFFFFF"], [".3", "#D8F1FF"], [".6", "#8FD0F5", .7], ["1", "#5AB0E8", 0]]);
  degradado("radialGradient", "mon-agua",
    [["0", "#E6F6FF"], [".3", "#7CC6F2"], [".65", "#2F8FD6", .75], ["1", "#1D6FB8", 0]]);
  degradado("radialGradient", "mon-rayo",
    [["0", "#FFFFFF"], [".3", "#E4F1FF"], [".6", "#9CC8FF", .6], ["1", "#6FA8FF", 0]]);
  var HALO = { fuego: "url(#mon-fuego)", hielo: "url(#mon-hielo)",
               agua: "url(#mon-agua)", rayo: "url(#mon-rayo)" };
  var MEDIO = { fuego: "#FF9A2E", hielo: "#BFE7FF", agua: "#3D9BE0", rayo: "#CFE4FF" };
  var NUCLEO = { fuego: "#FFF7D6", hielo: "#FFFFFF", agua: "#DDF2FF", rayo: "#FFFFFF" };
  var VEL = { fuego: 0.34, hielo: 0.3, agua: 0.26, rayo: 1.05 };
  var PUNTA_COLOR = { fuego: "#FFE7A3", hielo: "#E4F6FF", agua: "#9FD6FF", rayo: "#F2F8FF" };

  var bolasEl = [];
  for (var bi = 0; bi < 4; bi++) {
    var bg = el("g", { opacity: 0 }, capaEfectos);
    bolasEl.push({
      g: bg,
      rayoAura: el("polyline", { "class": "monigote__rayo-aura" }, bg),
      rayo: el("polyline", { "class": "monigote__rayo" }, bg),
      halo: el("circle", { fill: "url(#mon-fuego)" }, bg),
      medio: el("circle", {}, bg),
      esquirla: el("path", { "class": "monigote__esquirla",
        d: "M 1.9,0 L 0.2,-0.75 L -1.6,-0.35 L -2.4,0 L -1.6,0.35 L 0.2,0.75 Z" }, bg),
      brillo: el("circle", { "class": "monigote__agua-brillo" }, bg),
      nucleo: el("circle", {}, bg)
    });
  }
  var partsEl = [];
  for (var pi = 0; pi < 160; pi++) partsEl.push(el("circle", { r: 0, opacity: 0 }, capaEfectos));

  var COLOR = {
    fuego: ["#FFD36B", "#FF9A2E", "#E8561A", "#A82A0C"],
    chispa: ["#FFF6D6", "#FFE39A", "#FFC766", "#FFA63D"],
    astilla: ["#D9B27A", "#C9A063", "#B68A52", "#A87C47"],
    escarcha: ["#FFFFFF", "#E2F5FF", "#BCE4FF", "#8FCBF2"],
    cafe: ["#7A4A26", "#5A3418", "#42250F", "#2E1808"],
    trozo: ["#F4FBFF", "#CDEBFF", "#A6D8F7", "#7FC0EB"],
    gota: ["#BFE6FF", "#76C1F2", "#3C98DC", "#2A74B8"],
    voltio: ["#FFFFFF", "#E6F2FF", "#B8D6FF", "#8AB8FF"],
    brasa: ["#FFE7A3", "#FFB347", "#F0621E", "#A82A0C"],
    viruta: ["#F1D3A4", "#EBC993", "#E3BE85", "#D9B27A"],
    vapor: ["#E8ECEF", "#D5DBE0", "#BFC6CC", "#A9B1B8"]
  };
  var CAE = { astilla: 0.0006, gota: 0.0007, trozo: 0.0006, brasa: 0.0005, viruta: 0.0005, cafe: 0.0004 };
  function particula(tipo, x, y, vx, vy, vida, r) {
    if (st.parts.length >= partsEl.length) st.parts.shift();
    st.parts.push({ tipo: tipo, x: x, y: y, vx: vx, vy: vy, edad: 0, vida: vida, r: r });
  }
  function alAzar(a, b) { return a + Math.random() * (b - a); }

  function disparar(tipo, hasta, alLlegar, yDestino) {
    if (!st.punta) return;
    tipo = tipo || "fuego";
    var b = { tipo: tipo, x: st.punta[0], y: st.punta[1], edad: 0, fase: Math.random() * 6,
              r: tipo === "rayo" ? 1.6 : tipo === "hielo" ? 2.6 : 3.2,
              vx: -VEL[tipo], muere: -1, camino: [], vy: 0,
              hasta: hasta || 6, alLlegar: alLlegar || null };
    /* con destino (el tronco del dragón): baja en línea hasta él */
    if (yDestino != null && hasta != null) {
      b.vy = (yDestino - b.y) / (Math.abs(b.x - hasta) / VEL[tipo]);
    }
    if (tipo === "rayo") b.camino.push([b.x, b.y]);
    st.bolas.push(b);
    if (st.bolas.length > bolasEl.length) st.bolas.shift();
    /* fogonazo en la punta, del color del hechizo */
    var pal = { fuego: "chispa", rayo: "voltio", hielo: "escarcha", agua: "gota" }[tipo];
    for (var i = 0; i < 10; i++) {
      var a = Math.random() * Math.PI * 2, v = alAzar(0.02, 0.07);
      particula(pal === "gota" ? "chispa" : pal, st.punta[0], st.punta[1], Math.cos(a) * v, Math.sin(a) * v, alAzar(240, 440), 0.9);
    }
  }
  /* 17/09 (él): impactos más dramáticos. Cada uno lleva un destello
     grande, una ONDA (anillo que se expande) y el doble de trozos. */
  function estallar(b) {
    var i, a, v;
    if (b.tipo === "fuego") {
      for (i = 0; i < 34; i++) {
        a = Math.random() * Math.PI * 2; v = alAzar(0.04, 0.2);
        particula("fuego", b.x, b.y, Math.cos(a) * v * 0.7, Math.sin(a) * v - 0.03, alAzar(420, 780), alAzar(1.2, 2.6));
      }
      for (i = 0; i < 14; i++) {
        a = alAzar(-Math.PI, 0); v = alAzar(0.06, 0.16);
        particula("brasa", b.x, b.y, Math.abs(Math.cos(a)) * v * 0.6, Math.sin(a) * v, alAzar(600, 1000), alAzar(0.4, 0.9));
      }
      particula("destello", b.x, b.y, 0, 0, 420, 5);
      onda(b.x, b.y, 18, "#FFB347", 460, 2.2);
      onda(b.x, b.y, 11, "#FFE7A3", 300, 1.4);
    } else if (b.tipo === "hielo") {
      for (i = 0; i < 26; i++) {
        a = alAzar(-2.6, 2.6); v = alAzar(0.04, 0.15);
        particula("trozo", b.x, b.y, Math.abs(Math.cos(a)) * v * 0.8, Math.sin(a) * v - 0.06, alAzar(600, 950), alAzar(0.6, 1.4));
      }
      for (i = 0; i < 14; i++) {
        a = Math.random() * Math.PI * 2; v = alAzar(0.02, 0.08);
        particula("escarcha", b.x, b.y, Math.cos(a) * v, Math.sin(a) * v, alAzar(500, 900), alAzar(0.5, 1.2));
      }
      particula("destelloFrio", b.x, b.y, 0, 0, 380, 4.5);
      onda(b.x, b.y, 16, "#BFE7FF", 420, 2);
    } else if (b.tipo === "agua") {
      for (i = 0; i < 36; i++) {
        a = alAzar(-Math.PI * 0.95, -Math.PI * 0.05); v = alAzar(0.05, 0.17);
        particula("gota", b.x, b.y, Math.cos(a) * v * 0.7 + 0.03, Math.sin(a) * v, alAzar(500, 900), alAzar(0.5, 1.4));
      }
      particula("destelloAgua", b.x, b.y, 0, 0, 340, 4);
      onda(b.x, b.y, 17, "#6FC0F2", 460, 2.2);
      onda(b.x, b.y, 10, "#DDF2FF", 320, 1.2);
    } else {
      for (i = 0; i < 26; i++) {
        a = Math.random() * Math.PI * 2; v = alAzar(0.07, 0.24);
        particula("voltio", b.x, b.y, Math.cos(a) * v, Math.sin(a) * v, alAzar(180, 380), alAzar(0.4, 1.1));
      }
      particula("destelloFrio", b.x, b.y, 0, 0, 320, 6);
      onda(b.x, b.y, 22, "#9CC8FF", 360, 2.4);
      onda(b.x, b.y, 12, "#FFFFFF", 220, 1.4);
    }
  }

  /* LAS ONDAS: anillos que crecen y se apagan */
  var ondasEl = [];
  for (var oi = 0; oi < 8; oi++) ondasEl.push(el("circle", { "class": "monigote__onda", r: 0, opacity: 0 }, capaEfectos));
  st.ondas = [];
  function onda(x, y, rmax, color, vida, ancho) {
    if (st.ondas.length >= ondasEl.length) st.ondas.shift();
    st.ondas.push({ x: x, y: y, rmax: rmax, color: color, vida: vida, ancho: ancho, edad: 0 });
  }
  function pintarOndas() {
    ondasEl.forEach(function (c, i) {
      var w = st.ondas[i];
      if (!w) { c.setAttribute("opacity", 0); return; }
      var f = Math.min(1, w.edad / w.vida), e = 1 - Math.pow(1 - f, 2);
      c.setAttribute("cx", w.x); c.setAttribute("cy", w.y);
      c.setAttribute("r", Math.max(0.1, w.rmax * e));
      c.style.stroke = w.color;
      c.style.strokeWidth = (w.ancho * (1 - f * 0.6)).toFixed(2);
      c.setAttribute("opacity", (1 - f) * 0.9);
    });
  }

  function efectos(dt) {
    for (var i = st.bolas.length - 1; i >= 0; i--) {
      var b = st.bolas[i], k;
      b.edad += dt;
      if (b.muere >= 0) {
        /* el rayo ya llegó: su trazo se apaga */
        b.muere += dt;
        if (b.muere > 260) st.bolas.splice(i, 1);
        continue;
      }
      b.x += b.vx * dt;
      if (b.tipo === "rayo") {
        /* zigzag: cada tramo nuevo se desvía al azar, sin alejarse de
           la línea de salida */
        var ultimo = b.camino[b.camino.length - 1];
        if (ultimo[0] - b.x > 7) {
          var y0 = b.camino[0][1];
          b.y = clamp(ultimo[1] + (Math.random() < 0.5 ? -1 : 1) * alAzar(2.2, 4.8), y0 - 6.5, y0 + 6.5);
          b.camino.push([b.x, b.y]);
          if (Math.random() < 0.5) particula("voltio", b.x, b.y, alAzar(-0.02, 0.02), alAzar(-0.03, 0.03), alAzar(120, 220), 0.5);
        }
      } else {
        b.y += Math.sin(b.edad / 90 + b.fase) * (b.tipo === "agua" ? 0.02 : 0.012) * dt;
        var n = Math.max(1, Math.round(dt / 8));
        for (k = 0; k < n; k++) {
          if (b.tipo === "fuego") {
            particula("fuego", b.x + alAzar(0, 3), b.y + (Math.random() - 0.5) * b.r * 1.3,
                      alAzar(0.02, 0.05), (Math.random() - 0.6) * 0.02, alAzar(220, 420), b.r * alAzar(0.45, 0.8));
          } else if (b.tipo === "hielo") {
            if (Math.random() < 0.6) particula("escarcha", b.x + alAzar(0, 3), b.y + alAzar(-1.2, 1.2),
                      alAzar(0.01, 0.03), alAzar(0, 0.015), alAzar(300, 520), alAzar(0.3, 0.7));
          } else if (Math.random() < 0.45) {
            particula("gota", b.x + alAzar(0, 2), b.y + alAzar(-1.5, 1.5),
                      alAzar(0.01, 0.04), alAzar(-0.01, 0.02), alAzar(350, 600), alAzar(0.4, 0.8));
          }
        }
      }
      b.y += (b.vy || 0) * dt;
      if (b.x < b.hasta) {
        estallar(b);
        if (b.alLlegar) b.alLlegar();
        if (b.tipo === "rayo") { b.x = 6; b.camino.push([b.x, b.y]); b.muere = 0; }
        else st.bolas.splice(i, 1);
      }
    }
    /* chispas de la varita mientras hace los ademanes, del color del hechizo */
    if (st.chispas && st.punta && Math.random() < dt / 45) {
      var pc = { fuego: "chispa", rayo: "voltio", hielo: "escarcha", agua: "escarcha" }[st.hechizo] || "chispa";
      particula(pc, st.punta[0], st.punta[1],
                (Math.random() - 0.5) * 0.03, 0.005 + Math.random() * 0.02,
                alAzar(380, 680), alAzar(0.55, 1));
    }
    for (var w = st.ondas.length - 1; w >= 0; w--) {
      st.ondas[w].edad += dt;
      if (st.ondas[w].edad >= st.ondas[w].vida) st.ondas.splice(w, 1);
    }
    for (var j = st.parts.length - 1; j >= 0; j--) {
      var p = st.parts[j];
      p.edad += dt;
      if (p.edad >= p.vida) { st.parts.splice(j, 1); continue; }
      /* las virutas se van con el banco */
      if (p.tipo === "viruta" && esc.tipo !== "cepillo") p.edad = Math.max(p.edad, p.vida * 0.85);
      if (CAE[p.tipo]) {
        p.vy += CAE[p.tipo] * dt;
        if (p.y > st.suelo - 0.5) { p.y = st.suelo - 0.5; p.vy *= -0.3; p.vx *= 0.6; }
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  function pintarEfectos() {
    bolasEl.forEach(function (e, i) {
      var b = st.bolas[i];
      if (!b) { e.g.setAttribute("opacity", 0); return; }
      var t = b.tipo;
      var r = b.r * (1 + 0.1 * Math.sin(b.edad / 35));
      var vivo = b.muere < 0;
      e.g.setAttribute("opacity", vivo ? Math.min(1, b.edad / 40) : Math.max(0, 1 - b.muere / 260));
      e.halo.setAttribute("fill", HALO[t]);
      e.medio.setAttribute("fill", MEDIO[t]);
      e.nucleo.setAttribute("fill", NUCLEO[t]);
      [[e.halo, t === "rayo" ? 3 : 2.5], [e.medio, 1.15], [e.nucleo, 0.6], [e.brillo, 0.35]].forEach(function (c) {
        c[0].setAttribute("cx", b.x + (c[0] === e.brillo ? r * 0.35 : 0));
        c[0].setAttribute("cy", b.y - (c[0] === e.brillo ? r * 0.35 : 0));
        c[0].setAttribute("r", r * c[1]);
      });
      var cabeza = vivo ? "" : "none";
      e.halo.style.display = cabeza;
      e.nucleo.style.display = cabeza;
      e.medio.style.display = vivo && t !== "hielo" && t !== "rayo" ? "" : "none";
      e.brillo.style.display = vivo && t === "agua" ? "" : "none";
      e.esquirla.style.display = vivo && t === "hielo" ? "" : "none";
      if (t === "hielo") {
        e.esquirla.setAttribute("transform", "translate(" + b.x + "," + b.y + ") scale(" + (b.r * 1.1) + ")");
      }
      var conRayo = t === "rayo";
      e.rayo.style.display = e.rayoAura.style.display = conRayo ? "" : "none";
      if (conRayo) {
        /* parpadeo: el trazo tiembla un poco en cada fotograma */
        var pts = b.camino.concat(vivo ? [[b.x, b.y]] : []).map(function (q, n) {
          var temblor = n && n < b.camino.length ? alAzar(-0.4, 0.4) : 0;
          return q[0].toFixed(1) + "," + (q[1] + temblor).toFixed(1);
        }).join(" ");
        e.rayo.setAttribute("points", pts);
        e.rayoAura.setAttribute("points", pts);
      }
    });
    partsEl.forEach(function (c, i) {
      var p = st.parts[i];
      if (!p) { if (c.getAttribute("opacity") !== "0") c.setAttribute("opacity", 0); return; }
      var f = p.edad / p.vida, r, o, col;
      if (p.tipo === "destello" || p.tipo === "destelloFrio" || p.tipo === "destelloAgua") {
        r = p.r * (1 + f * 2.4); o = 0.75 * (1 - f) * (1 - f);
        col = { destello: "#FFE2A0", destelloFrio: "#E4EEFF", destelloAgua: "#BFE6FF" }[p.tipo];
      } else if (p.tipo === "astilla") {
        r = p.r; o = f < 0.7 ? 1 : 1 - (f - 0.7) / 0.3; col = COLOR.astilla[Math.floor(p.r * 7) % 4];
      } else if (p.tipo === "viruta") {
        /* rizos: anillos de trazo que se quedan en el suelo */
        r = p.r; o = f < 0.8 ? 1 : 1 - (f - 0.8) / 0.2; col = COLOR.viruta[Math.floor(p.r * 5) % 4];
      } else if (p.riego) {
        r = p.r; o = f < 0.85 ? 0.95 : 0.95 * (1 - f) / 0.15; col = COLOR[p.tipo][1 + (i % 2)];
      } else if (p.tipo === "vapor") {
        r = p.r * (1 + f * 2.2); o = 0.5 * (1 - f); col = COLOR.vapor[Math.min(3, Math.floor(f * 4))];
      } else {
        var pal = COLOR[p.tipo];
        col = pal[Math.min(3, Math.floor(f * 4))];
        r = p.r * (1 - f * (p.tipo === "fuego" ? 0.7 : 0.5));
        o = CAE[p.tipo] ? (f < 0.6 ? 1 : 1 - (f - 0.6) / 0.4) : 1 - f;
      }
      c.setAttribute("cx", p.x); c.setAttribute("cy", p.y);
      c.setAttribute("r", Math.max(0.1, r));
      if (p.tipo === "viruta") {
        c.setAttribute("fill", "none"); c.setAttribute("stroke", col); c.setAttribute("stroke-width", "0.8");
      } else {
        c.setAttribute("fill", col); c.setAttribute("stroke", "none");
      }
      c.setAttribute("opacity", o);
    });
  }

  /* ---------- geometría del cuerpo, en unidades --------------- */
  var L1 = H.brazo, L2 = H.antebrazo;

  function geom(p) {
    var hip = [p.avance || 0, H.muslo + H.pierna - p.y];
    var cue = mas(hip, dir(180 + p.tronco), H.cuello);
    var cab = mas(cue, dir(180 + p.tronco + p.cabeza), H.cabeza * 0.95);
    var coA = mas(cue, dir(p.hombroA), L1), maA = mas(coA, dir(p.codoA), L2);
    var coB = mas(cue, dir(p.hombroB), L1), maB = mas(coB, dir(p.codoB), L2);
    var tA = null, tB = null, eligeA = masBajo, eligeB = masBajo;
    var o = p.objeto, obj = null;

    if (o === "guitarra") {
      var gc = [hip[0] + 3, hip[1] + 6];
      var u = dir(p.ang), v = perp(u);
      var gp = function (gx, gy) { return mas(mas(gc, u, gx), v, gy); };
      /* La mano que pisa: de ese brazo solo se ve el antebrazo, que
         sale de DETRÁS de la caja (el codo queda escondido dentro del
         bombo de arriba, por debajo del mástil) y cruza por delante
         del mástil hasta la mano. Sin ik: el codo va pegado a la
         guitarra y el largo visible cambia con la posición, como un
         brazo que se acerca o se aleja en profundidad. */
      coB = lerpP(coB, gp(4.6, 3.1), p.ik);
      maB = lerpP(maB, gp(p.traste, -0.55), p.ik);
      /* el rasgueo va de la cuerda de ARRIBA (la más cerca de la
         cabeza) a la de abajo, sea cual sea el signo de v */
      var arriba = gp(1.2, -3)[1] > gp(1.2, 3)[1] ? -1 : 1;
      tA = gp(1.2, arriba * (3.6 - 7.2 * p.rasgueo));
      eligeA = masAtras;
      obj = { tipo: "guitarra", origen: gc, u: u };
    } else if (o === "lapiz") {
      var uL = p.uL == null ? 0.3 : p.uL;
      var punta = mas(tablero(uL), NB, 1.0 + (p.lift || 0) + p.alza * 4.5);
      /* El lápiz sale casi de pie sobre el papel, apenas echado hacia
         delante, así asoma por ENCIMA de la mano y no se esconde detrás
         del antebrazo ni de la cabeza (él, 17/09). */
      var dl = unir([0, 0], mas(mas([0, 0], DB, 0.5), NB, 1 + p.alza * 0.3));
      var gir = (p.giro || 0) * RAD;
      dl = [dl[0] * Math.cos(gir) - dl[1] * Math.sin(gir), dl[0] * Math.sin(gir) + dl[1] * Math.cos(gir)];
      punta = eCuerpo(punta);
      tA = mas(punta, dl, 3.2 * LAPIZ_K);
      tB = eCuerpo(mas(tablero(0.5 + (p.papel || 0)), NB, 1.4));
      obj = { tipo: "lapiz", origen: punta, u: dl };
    } else if (o === "hacha") {
      var ua = dir(p.ang);
      tB = [cue[0] + p.hx, cue[1] - p.hy];
      var pomo = mas(tB, ua, -1);
      tA = mas(pomo, ua, p.agarre);
      obj = { tipo: "hacha", origen: pomo, u: ua };
    } else if (o === "arco") {
      var uArco = dir(p.ang);
      /* tensado del todo, el culatín queda junto a la barbilla, un poco
         por DELANTE del hombro: más atrás el brazo se plegaba del todo y
         el codo saltaba de lado (el «glitch» que él vio) */
      var culatin = -3.8;
      /* tensión negativa: la mano va POR DELANTE de la empuñadura, fuera
         de su alcance, así el brazo se estira del todo al llevar la
         flecha al arco */
      var enCuerda = p.tension < 0
        ? mas(maA, uArco, -3.8 - 7.8 * p.tension)
        : lerpP(mas(maA, uArco, culatin), [cue[0] + p.hx, cue[1] - p.hy], clamp(p.tension, 0, 1));
      var boca = carcajBoca(cue, p.tronco);
      var ejeC = dir(p.tronco - 12);
      var enCarcaj = mas(boca.punto, ejeC, -1.5 - p.sube);
      tB = lerpP(enCuerda, enCarcaj, p.carcajT);
      /* entre la cuerda y el carcaj la mano pasa POR ARRIBA, en arco:
         en línea recta cruzaba justo por el hombro, el brazo se plegaba
         del todo y el codo giraba de golpe */
      var arcoMano = Math.sin(Math.PI * clamp(p.carcajT, 0, 1));
      tB = [tB[0] + 8 * arcoMano, tB[1] + 9 * arcoMano];
      /* el codo SIEMPRE hacia atrás: con «el más bajo» cambiaba de lado
         a mitad del movimiento */
      /* Continuidad: el codo que quede más cerca del de antes. Solo
         cuando el brazo va casi estirado (las dos soluciones casi
         coinciden) se elige la solución c2: ahí el cambio no se ve, y
         desde ese lado, al tensar, el codo gira solo hasta quedar DETRÁS
         del hombro (medido: −8,9; con c1 acababa delante, +7,2). Por eso la rutina lleva la
         flecha hasta el arco con el brazo estirado antes de tensar. */
      eligeB = function (c1, c2) {
        if (!st.codoPrevB || dist(c1, c2) < 2.5) return c2;
        return dist(c1, st.codoPrevB) <= dist(c2, st.codoPrevB) ? c1 : c2;
      };
      obj = { tipo: "arco", origen: maA, u: uArco, culatin: culatin, ejeC: ejeC, carcajT: p.carcajT };
    } else if (o === "talla") {
      /* PUERTA DE MORIA: el formón apoya la punta en la puerta, en el
         punto de trabajo (unidades de escena), y el mazo golpea su mango */
      var uC = dir(84);
      var puntaT = eCuerpo([p.tallaF == null ? 11 : p.tallaF, p.tallaH == null ? 28 : p.tallaH]);
      tA = mas(puntaT, uC, -4.6);
      var uM = dir(p.angM);
      var culo = mas(tA, uC, -3.4);
      var enGolpe = mas(culo, uM, -6.3);
      tB = [enGolpe[0] - 2 * p.golpe, enGolpe[1] + 5 * p.golpe];
      obj = { tipo: "talla", origen: tA, u: uC, uM: uM, punta: puntaT };
    } else if (o === "cepillo") {
      /* el cepillo recorre la tabla; las manos, en el mango y el pomo */
      var fC = lerp(12, 22, p.cep);
      var baseC = eCuerpo([fC, 23.3]);
      tB = [baseC[0] - 2.6, baseC[1] + 3.4];
      tA = [baseC[0] + 2.6, baseC[1] + 2.6];
      obj = { tipo: "cepillo", origen: baseC, u: [1, 0], boca: eCuerpo([fC + 0.4, 25.5]) };
    } else if (o === "moka" || o === "taza") {
      /* La pose dice dónde va la MANO; la pieza cuelga de ella. `ang`
         es el eje de la pieza: 180 = de pie, menos = inclinada hacia
         delante (para servir). El asa queda del lado de él. */
      var uo = dir(p.ang), vo = perp(uo);
      var mano = [cue[0] + p.hx, cue[1] - p.hy];
      var alto = o === "moka" ? 3.6 : 2.2, lado = o === "moka" ? 3.4 : 2.6;
      obj = { tipo: o, origen: mas(mas(mano, uo, -alto), vo, lado), u: uo };
      tA = mano;
    } else if (o === "manguera") {
      obj = { tipo: "manguera", origen: maA, u: dir(p.ang) };
    } else if (o === "libro") {
      var ub = dir(p.ang), cL = [cue[0] + p.hx, cue[1] - p.hy];
      /* una mano en el lomo y la otra en el canto, por abajo */
      var vb = perp(ub);
      tA = mas(mas(cL, ub, 1.4 * LIBRO_S), vb, 3.6 * LIBRO_S);
      tB = mas(mas(cL, ub, -1.6 * LIBRO_S), vb, 3.2 * LIBRO_S);
      obj = { tipo: "libro", origen: cL, u: ub };
    } else if (o === "tronco" || o === "manos") {
      tB = [cue[0] + p.hx, cue[1] - p.hy];
      tA = [cue[0] + p.hx + p.aX, cue[1] - p.hy + p.aY];
      if (o === "tronco") obj = { tipo: "tronco", centro: [cue[0] + p.hx + 0.5, cue[1] - p.hy] };
    }

    /* Las manos-objetivo mandan en la proporción ik / ikA. Entre
       medias, la mano va de donde la ponían los ángulos al objetivo. */
    if (tB && p.ik > 0) {
      var rB = codoIK(cue, lerpP(maB, tB, p.ik), L1, L2, eligeB);
      coB = rB.codo; maB = rB.mano;
    }
    if (tA && p.ikA > 0) {
      var rA = codoIK(cue, lerpP(maA, tA, p.ikA), L1, L2, eligeA);
      coA = rA.codo; maA = rA.mano;
    }
    if (o === "espada" || o === "varita") obj = { tipo: o, origen: maA, u: dir(p.ang) };

    var roA = mas(hip, dir(p.caderaA), H.muslo), piA = mas(roA, dir(p.rodillaA), H.pierna);
    var roB = mas(hip, dir(p.caderaB), H.muslo), piB = mas(roB, dir(p.rodillaB), H.pierna);
    if (o === "arco") {
      obj.carcaj = carcajBoca(cue, p.tronco);
      /* dónde queda la mano de la cuerda, en "espacio arco" */
      var dM = [maB[0] - maA[0], maB[1] - maA[1]], vA = perp(obj.u);
      obj.manoLocal = [dM[0] * obj.u[0] + dM[1] * obj.u[1], dM[0] * vA[0] + dM[1] * vA[1]];
      obj.v = vA;
    }
    var r = { hip: hip, cue: cue, cab: cab, coA: coA, maA: maA, coB: coB, maB: maB,
              roA: roA, piA: piA, roB: roB, piB: piB, obj: obj };
    /* Ningún pie por debajo del piso. A mitad de una transición las
       piernas interpoladas pueden hundirse un poco (al levantarse,
       hasta 1,1 u); si pasa, el cuerpo entero sube esa diferencia.
       No toca lo que se ancla al decorado (lápiz, tablero). */
    var hundido = -Math.min(piA[1], piB[1]);
    if (hundido > 0.01 && o !== "lapiz") {
      ["hip", "cue", "cab", "coA", "maA", "coB", "maB", "roA", "piA", "roB", "piB"].forEach(function (k) {
        r[k] = [r[k][0], r[k][1] + hundido];
      });
      if (obj && obj.origen) obj.origen = [obj.origen[0], obj.origen[1] + hundido];
      if (obj && obj.centro) obj.centro = [obj.centro[0], obj.centro[1] + hundido];
    }
    return r;
  }

  /* ---------- el dibujo --------------------------------------- */
  function aP(pt) { return [st.x + st.mira * pt[0] * ESCALA, st.y - pt[1] * ESCALA]; }
  function poner(e, a, b) {
    e.setAttribute("x1", a[0]); e.setAttribute("y1", a[1]);
    e.setAttribute("x2", b[0]); e.setAttribute("y2", b[1]);
  }
  /* Coloca un objeto dibujado en su propio espacio (+x a lo largo,
     +y hacia el filo/abajo). */
  function tfPx(e, P, uPx, mira, k) {
    var sc = ESCALA * (k || 1);
    var rot = Math.atan2(uPx[1], uPx[0]) / RAD;
    e.setAttribute("transform", "translate(" + P[0] + "," + P[1] + ") rotate(" + rot + ") " +
                   "scale(" + sc + "," + (sc * mira) + ")");
  }
  function tf(e, o, u, k) { tfPx(e, aP(o), [st.mira * u[0], -u[1]], st.mira, k); }

  var OBJETOS = { manguera: boquillaG, cepillo: cepilloG, espada: espadaG, varita: varita, lapiz: lapiz, hacha: hacha, libro: libro, arco: arco,
                  guitarra: null, tronco: null };
  var ORDEN = {
    base: ["musloB", "piernaB", "musloA", "piernaA", "tronco"],
    normal: ["brazoB", "antebrazoB", "cabeza", "espada", "varita", "brazoA", "antebrazoA"],
    guitarra: ["cabeza", "guitMastil", "antebrazoB", "guitCuerpo", "brazoA", "antebrazoA"],
    /* el lápiz DELANTE de la mano (él, 17/09: no se veía) */
    lapiz: ["brazoB", "antebrazoB", "cabeza", "brazoA", "antebrazoA", "lapiz"],
    hacha: ["hacha", "cabeza", "brazoB", "antebrazoB", "brazoA", "antebrazoA"],
    tronco: ["cabeza", "brazoB", "antebrazoB", "troncoMano", "brazoA", "antebrazoA"],
    libro: ["cabeza", "brazoB", "antebrazoB", "libro", "brazoA", "antebrazoA"],
    arco: ["brazoB", "antebrazoB", "flechaMano", "cabeza", "arco", "brazoA", "antebrazoA"],
    talla: ["cabeza", "brazoB", "antebrazoB", "mazo", "cincel", "brazoA", "antebrazoA"],
    /* el cepillo DELANTE de las manos: detrás no se veía (él, 17/09) */
    cepillo: ["brazoB", "antebrazoB", "cabeza", "brazoA", "antebrazoA", "cepilloG"],
    manguera: ["brazoB", "antebrazoB", "cabeza", "brazoA", "antebrazoA", "manguera"]
  };
  var NODOS = {
    carcaj: carcajG, flechaMano: flechaManoG, cincel: cincel, mazo: mazo, cepilloG: cepilloG,
    manguera: boquillaG,
    cabeza: cabeza, espada: espadaG, varita: varita, lapiz: lapiz, hacha: hacha, libro: libro, arco: arco,
    guitMastil: guitMastil, guitCuerpo: guitCuerpo, troncoMano: troncoMano.g
  };
  for (var nk in partes) if (!NODOS[nk]) NODOS[nk] = partes[nk];
  var ordenActual = null;
  function ordenar(o) {
    var clave = ORDEN[o] ? o : "normal";
    if (clave === ordenActual) return;
    ordenActual = clave;
    /* Con la guitarra, el brazo de arriba de la mano que pisa queda
       tapado por el cuerpo: solo se ve el antebrazo cruzando por
       delante del mástil. Por eso va el primero y oculto. */
    /* el carcaj va detrás de todo el cuerpo */
    var lista = (clave === "guitarra" ? ["brazoB"] : clave === "arco" ? ["carcaj"] : [])
      .concat(ORDEN.base, ORDEN[clave]);
    lista.forEach(function (n) { cuerpo.appendChild(NODOS[n]); });
    partes.brazoB.style.display = clave === "guitarra" ? "none" : "";
  }

  function pintarDisfraz(P) {
    var ve = !!st.disfraz;
    capaEl.style.display = gorroEl.style.display = ve ? "" : "none";
    if (!ve) return;
    var E = ESCALA;
    /* el eje del tronco y su normal hacia la espalda */
    var d = unir(P.hip, P.cue), n = [d[1], -d[0]];
    if (n[0] * st.mira > 0) n = [-n[0], -n[1]];
    var ondea = Math.sin(st.reloj / 320) * 0.8 + (st.modo === "andando" ? 1.6 : 0);
    function en(o, a, b) { return [o[0] + d[0] * a * E + n[0] * b * E, o[1] + d[1] * a * E + n[1] * b * E]; }
    var c1 = en(P.cue, 0.6, -1.6), c2 = en(P.cue, 0.4, 1.4);
    var ab = en(P.hip, -9, 8.5 + ondea), ad = en(P.hip, -10, 0.6);
    var m1 = en(P.cue, -8, 7.5 + ondea * 0.5);
    gorroEl.parentNode.appendChild(gorroEl);      /* siempre encima de la cabeza */
    capaEl.setAttribute("d", "M " + c1.map(fx).join(",") + " L " + c2.map(fx).join(",") +
      " Q " + m1.map(fx).join(",") + " " + ab.map(fx).join(",") +
      " L " + ad.map(fx).join(",") + " Z");
    /* el gorro: cónico, sobre la coronilla, siguiendo la cabeza */
    var up = unir(P.cue, P.cab), lado = [up[1], -up[0]], r = H.cabeza * E;
    function g(a, b) { return [P.cab[0] + up[0] * a * r + lado[0] * b * r, P.cab[1] + up[1] * a * r + lado[1] * b * r]; }
    var i1 = g(0.35, -1.02), i2 = g(0.35, 1.02), punta = g(2.05, 0.25 * st.mira);
    gorroEl.setAttribute("d", "M " + i1.map(fx).join(",") + " Q " + g(0.75, 0).map(fx).join(",") + " " +
      i2.map(fx).join(",") + " L " + punta.map(fx).join(",") + " Z");
  }
  function dibujar(p) {
    var g = geom(p);
    var P = {};
    ["hip", "cue", "cab", "coA", "maA", "coB", "maB", "roA", "piA", "roB", "piB"].forEach(function (k) {
      P[k] = aP(g[k]);
    });
    poner(partes.tronco, P.hip, P.cue);
    cabeza.setAttribute("cx", P.cab[0]);
    cabeza.setAttribute("cy", P.cab[1]);
    cabeza.setAttribute("r", H.cabeza * ESCALA);
    pintarDisfraz(P);
    poner(partes.brazoA, P.cue, P.coA); poner(partes.antebrazoA, P.coA, P.maA);
    poner(partes.brazoB, P.cue, P.coB); poner(partes.antebrazoB, P.coB, P.maB);
    poner(partes.musloA, P.hip, P.roA); poner(partes.piernaA, P.roA, P.piA);
    poner(partes.musloB, P.hip, P.roB); poner(partes.piernaB, P.roB, P.piB);

    var o = g.obj ? g.obj.tipo : null;
    ordenar(o);
    for (var k in OBJETOS) if (OBJETOS[k] && k !== o) OBJETOS[k].style.display = "none";
    guitMastil.style.display = guitCuerpo.style.display = o === "guitarra" ? "" : "none";
    st.punta = null; st.enMano = null; st.puntaFlecha = null;

    /* la raya vieja: coordenadas válidas aunque no se vea (sin x1/y1
       queda NaN en el DOM y ensucia cualquier inspección) */
    poner(partes.espada, P.maA, P.maA);
    if (o === "guitarra") {
      tf(guitMastil, g.obj.origen, g.obj.u);
      tf(guitCuerpo, g.obj.origen, g.obj.u);
      var op = 0.5 + 0.5 * st.vibra;
      cuerdasCaja.setAttribute("opacity", op);
      cuerdasMastil.setAttribute("opacity", op);
    }
    /* recuerda el codo de la mano de la cuerda, para el siguiente fotograma */
    st.codoPrevB = o === "arco" ? g.coB : null;
    carcajG.style.display = o === "arco" ? "" : "none";
    cincel.style.display = mazo.style.display = o === "talla" ? "" : "none";
    st.puntaTalla = null; st.bocaCepillo = null; st.boquilla = null; st.boquillaPunta = null;
    st.picoMoka = null;
    if (o === "moka" || o === "taza") {
      OBJETOS[o].style.display = "";
      tf(OBJETOS[o], g.obj.origen, g.obj.u);
      if (o === "moka") st.picoMoka = aP(mas(mas(g.obj.origen, g.obj.u, 8.4), perp(g.obj.u), 3.9));
      if (o === "taza") tazaG.__cafe.setAttribute("opacity", esc.cafe > 0.05 ? 1 : 0);
    }
    if (o === "manguera") {
      boquillaG.style.display = "";
      tf(boquillaG, g.obj.origen, g.obj.u, 1.2);
      st.boquilla = aP(mas(g.obj.origen, g.obj.u, -3.4 * 1.2));
      st.boquillaPunta = aP(mas(g.obj.origen, g.obj.u, 6.6 * 1.2));
    }
    st.manoAPx = P.maA;
    if (o === "talla") {
      tf(cincel, g.obj.origen, g.obj.u);
      tf(mazo, g.maB, g.obj.uM);
      st.puntaTalla = aP(g.obj.punta);
    }
    if (o === "cepillo") {
      cepilloG.style.display = "";
      tf(cepilloG, g.obj.origen, g.obj.u, CEPILLO_K);
      st.bocaCepillo = aP(g.obj.boca);
    }
    flechaManoG.style.display = o === "arco" && st.flechaMano ? "" : "none";
    if (o === "arco") {
      /* el carcaj, a lo largo de la espalda */
      tf(carcajG, g.obj.carcaj.punto, g.obj.ejeC);
      if (st.flechaMano) {
        /* la flecha en la mano: al sacarla apunta hacia arriba, fuera
           del carcaj; al traerla, gira hacia el arco */
        /* con la mano ya en la empuñadura, "hacia el arco" no está
           definido: la flecha mira al frente */
        var haciaArco = dist(g.maB, g.maA) > 3 ? unir(g.maB, g.maA) : g.obj.u;
        var arribaC = [-g.obj.ejeC[0], -g.obj.ejeC[1]];
        var dT = unir([0, 0], lerpP(haciaArco, arribaC, clamp(g.obj.carcajT, 0, 1)));
        var puntaM = mas(g.maB, dT, 16);
        var PM = aP(puntaM), atrasPx = [-st.mira * dT[0], dT[1]];
        flechaManoG.setAttribute("transform", "translate(" + PM[0].toFixed(2) + "," + PM[1].toFixed(2) +
          ") rotate(" + (Math.atan2(atrasPx[1], atrasPx[0]) / RAD).toFixed(1) + ") scale(" + ESCALA + ")");
      }
      arco.style.display = "";
      tf(arco, g.obj.origen, g.obj.u);
      /* Con flecha cargada, la cuerda va a la MANO (el culatín está en
         sus dedos); sin ella, en reposo. Nunca por delante del reposo. */
      var nock = [-3.8 + 1.3 * (st.cuerdaVibra || 0) * Math.sin(st.reloj / 11), 0];
      if (st.flechaCargada || st.cuerdaEnMano) {
        nock = [Math.min(-3.8, g.obj.manoLocal[0]), clamp(g.obj.manoLocal[1], -2.5, 2.5)];
      }
      cuerda.setAttribute("points", "-4.4,-10.5 " + nock[0].toFixed(2) + "," + nock[1].toFixed(2) + " -4.4,10.5");
      flechaArcoG.style.display = st.flechaCargada ? "" : "none";
      /* la flecha va del culatín hacia la empuñadura */
      var aGrip = unir(nock, [0, 0]), puntaL = mas(nock, aGrip, 18);
      flechaArcoG.setAttribute("transform", "translate(" + puntaL[0].toFixed(2) + "," + puntaL[1].toFixed(2) +
        ") rotate(" + (Math.atan2(-aGrip[1], -aGrip[0]) / RAD).toFixed(1) + ")");
      st.puntaFlecha = aP(mas(mas(g.obj.origen, g.obj.u, puntaL[0]), g.obj.v, puntaL[1]));
    }
    if (o === "libro") {
      libro.style.display = "";
      var Pl = aP(g.obj.origen), ul = [st.mira * g.obj.u[0], -g.obj.u[1]];
      /* sin espejo en x: el lomo va siempre hacia delante */
      libro.setAttribute("transform", "translate(" + Pl[0] + "," + Pl[1] + ") rotate(" +
        (Math.atan2(ul[1], ul[0]) / RAD) + ") scale(" + (ESCALA * LIBRO_S) + "," + (ESCALA * LIBRO_S * st.mira) + ")");
      pintarLibro(p.abierto, p.hoja);
    }
    if (o === "espada") {
      var b = st.brilloEspada, parpadeo = 0.9 + 0.1 * Math.sin(st.reloj / 70);
      haloEspada.setAttribute("opacity", (0.75 * b * parpadeo).toFixed(3));
      haloEspadaAncho.setAttribute("opacity", (0.35 * b * parpadeo).toFixed(3));
      tinteEspada.setAttribute("opacity", (0.65 * b).toFixed(3));
      st.puntaEspada = aP(mas(g.obj.origen, g.obj.u, 12 * ESPADA_K));
    } else {
      st.puntaEspada = null;
    }
    if (o === "espada" || o === "varita" || o === "lapiz" || o === "hacha") {
      OBJETOS[o].style.display = "";
      tf(OBJETOS[o], g.obj.origen, g.obj.u,
         o === "lapiz" ? LAPIZ_K : o === "espada" ? ESPADA_K : 1);
    }
    if (o === "varita") {
      st.punta = aP(mas(g.obj.origen, g.obj.u, 14.6));
      puntaVarita.setAttribute("opacity", st.chispas ? 1 : 0.35);
      puntaVarita.style.fill = PUNTA_COLOR[st.hechizo] || "";
    }
    if (o === "tronco") {
      st.enMano = aP(g.obj.centro);
      pintarTronco(troncoMano, st.enMano, 1 - p.rotT / 90, 1, 0);
    } else {
      pintarTronco(troncoMano, null, 0, 0);
    }
    pintarEscena();
    pintarEfectos();
    pintarOndas();
    pintarPiedra();
    pintarNuevos();
    pintarVerde();
    var vCafe = esc.tipo === "cafe" ? esc.op : 0;
    escCafe.setAttribute("transform", "translate(" + esc.x0 + "," + st.suelo + ") scale(" +
      (esc.m * ESCALA) + "," + ESCALA + ")");
    escCafe.setAttribute("opacity", vCafe);
    escCafe.style.display = vCafe > 0 ? "" : "none";
    pintarCafe(vCafe);
  }

  function pintarEscena() {
    var s = ESCALA;
    var t = "translate(" + esc.x0 + "," + st.suelo + ") scale(" + (esc.m * s) + "," + s + ")";
    var enDibujo = esc.tipo === "dibujo" ? esc.op : 0;
    var enArbol = esc.tipo === "arbol" ? esc.op : 0;
    pintarFlechas(esc.tipo === "arco" ? esc.op : 0);
    /* 17/09 (él): el samán, un 20 % más grande todavía. Crece desde el
       borde del tronco que toca su espalda (f = -5,9, en el suelo), así
       el muñeco sigue recostado en él. */
    escArbol.setAttribute("transform", t + " translate(-5.9,0) scale(1.2) translate(5.9,0)");
    escArbol.setAttribute("opacity", enArbol);
    escArbol.style.display = enArbol > 0 ? "" : "none";
    var enHacha = esc.tipo === "hacha" ? esc.op : 0;
    [escDibujo, escDibujoLuz].forEach(function (e) {
      e.setAttribute("transform", t);
      e.setAttribute("opacity", enDibujo);
      e.style.display = enDibujo > 0 ? "" : "none";
    });
    [escHachaFondo, escHachaFrente].forEach(function (e) {
      e.setAttribute("transform", t);
      e.setAttribute("opacity", enHacha);
      e.style.display = enHacha > 0 ? "" : "none";
    });
    /* la capa de piezas sueltas la usan la leña Y el café */
    var sueltas = enHacha > 0 || esc.tipo === "cafe" || esc.tipo === "cepillo";
    dinFondo.style.display = dinFrente.style.display = sueltas ? "" : "none";
    /* el cepillo apoyado en la tabla, mientras descansa */
    var enBanco = esc.tipo === "cepillo" && esc.cepilloBanco && esc.op > 0;
    cepilloBancoEl.style.display = enBanco ? "" : "none";
    if (enBanco) {
      tfPx(cepilloBancoEl, eP(12, 23.3), [esc.m, 0], esc.m, CEPILLO_K);
      cepilloBancoEl.setAttribute("opacity", esc.op);
    }
    if (!(enHacha > 0)) return;

    HACHA.pila.forEach(function (pc, n) {
      pintarTronco(pilaEl[n], eP(pc[0], pc[1]), 0, esc.pila[n] * enHacha, 0);
    });

    if (esc.bloque) {
      var destino = eP(HACHA.centroLeño[0], HACHA.centroLeño[1]);
      var f = suaveStep(esc.bloque.t / 140);
      pintarTronco(troncoBloque, lerpP(esc.bloque.de, destino, f), 1, enHacha, 0);
    } else {
      pintarTronco(troncoBloque, null, 0, 0);
    }

    mitadesEl.forEach(function (e, i) {
      var m = esc.mitades[i];
      if (!m) { e.setAttribute("opacity", 0); return; }
      var tt = Math.min(1, m.edad / 480), q = 1 - (1 - tt) * (1 - tt);
      var fpos = lerp(m.f0, m.f1, q);
      var hpos = lerp(m.h0, m.h1, q) + 5 * tt * (1 - tt);
      var rot = m.rot * Math.min(1, tt * 1.15);
      var alfa = m.edad < 2480 ? 1 : Math.max(0, 1 - (m.edad - 2480) / 500);
      var Pm = eP(fpos, hpos);
      e.setAttribute("opacity", alfa * enHacha);
      e.setAttribute("transform", "translate(" + Pm[0] + "," + Pm[1] + ") rotate(" + (rot * esc.m) + ") scale(" + s + ")");
    });

    hachaClavadaEl.style.display = esc.clavada ? "" : "none";
    if (esc.clavada) {
      var uc = dir(HACHA.clavada.ang);
      tfPx(hachaClavadaEl, eP(HACHA.clavada.pomo[0], HACHA.clavada.pomo[1]), [esc.m * uc[0], -uc[1]], esc.m);
      hachaClavadaEl.setAttribute("opacity", enHacha);
    }
    hachaApoyada.style.display = esc.hachaApoyada ? "" : "none";
    if (esc.hachaApoyada) {
      var ua = dir(POSES.h_apoya.ang);
      tfPx(hachaApoyada, eP(HACHA.pomo[0], HACHA.pomo[1]), [esc.m * ua[0], -ua[1]], esc.m);
      hachaApoyada.setAttribute("opacity", enHacha);
    }
  }

  /* ---------- lo que suma el reloj ---------------------------- */
  var NEGRA = 625;                    /* 96 pulsaciones por minuto */
  var CORCHEA = NEGRA / 2;
  var COMPAS = NEGRA * 4;
  /* Rasgueo de siempre: ↓ · ↓↑ · ↑↓↑ — el hueco es la mano que pasa
     sin tocar. 1 = suena. */
  var PATRON = [1, 0, 1, 1, 0, 1, 1, 1];
  /* Un acorde por compás (dónde pisa, a lo largo del mástil). */
  var ACORDES = [16.4, 13.1, 14.6, 17.6];

  function sobreponer(p, ahora) {
    if (p.objeto === "guitarra" && st.musica) {
      var tm = st.reloj - st.musica.t0;
      var fase = tm / CORCHEA;
      /* La mano no para nunca: baja en las corcheas pares, sube en
         las impares, y el patrón solo decide si toca las cuerdas. */
      p.rasgueo = 0.5 - 0.5 * Math.cos(Math.PI * fase);
      var n = Math.floor(fase), enCompas = n % 8;
      if (n !== st.musica.ultima) {
        st.musica.ultima = n;
        if (PATRON[enCompas]) st.vibra = 1;
      }
      /* El cambio de acorde se hace en la última corchea del compás,
         para caer en el siguiente justo en el tiempo fuerte. */
      var c = Math.floor(tm / COMPAS), enC = (tm % COMPAS) / COMPAS;
      var a0 = ACORDES[c % 4], a1 = ACORDES[(c + 1) % 4];
      p.traste = lerp(a0, a1, suaveStep((enC - 0.875) / 0.1)) +
                 0.25 * Math.sin(tm / NEGRA * Math.PI);
      var pulso = Math.max(0, Math.cos(2 * Math.PI * tm / NEGRA));
      p.tronco += pulso * 1.6;
      p.cabeza -= pulso * 3.5;
      p.y += pulso * 0.5;
    }
    if (p.objeto === "talla") {
      /* el formón va recorriendo despacio la parte de la puerta a su alcance */
      var tt = st.reloj / 1000;
      p.tallaF = 11 + 2 * Math.sin(tt * 1.7);
      p.tallaH = 28 + 3.5 * Math.sin(tt * 1.1 + 1);
    }
    if (p.objeto === "cepillo" && esc.tipo === "cepillo") {
      /* virutas al avanzar, y la tabla queda más clara */
      var dc = p.cep - (st.cepPrev == null ? p.cep : st.cepPrev);
      st.cepPrev = p.cep;
      if (dc > 0 && st.bocaCepillo) {
        esc.fresco = Math.min(1, esc.fresco + dc / 6);
        /* pocas y pequeñas, y caen por delante, junto al banco */
        if (Math.random() < dc * 7) {
          particula("viruta", st.bocaCepillo[0], st.bocaCepillo[1],
                    st.mira * alAzar(0.0, 0.035), -alAzar(0.04, 0.09), alAzar(4500, 6500), alAzar(0.45, 0.85));
        }
      }
    } else {
      st.cepPrev = null;
    }
    if (p.objeto === "libro" && st.lectura) {
      var tl = st.reloj - st.lectura.t0;
      /* una página cada 4,6 s; la vuelta dura medio segundo */
      var enPag = tl % 4600;
      p.hoja = enPag > 4100 ? (enPag - 4100) / 500 : -1;
      /* los ojos recorren el renglón: la cabeza baja despacio y
         vuelve de golpe al empezar el siguiente */
      var renglon = (tl % 1300) / 1300;
      p.cabeza += 2.2 * (renglon < 0.85 ? renglon / 0.85 : 1 - (renglon - 0.85) / 0.15) - 1.1;
      p.ang += 1.5 * Math.sin(tl / 1900);
      p.hy += 0.4 * Math.sin(tl / 2300);
    }
    if (p.objeto === "lapiz" && esc.tipo === "dibujo") {
      var td = st.reloj - esc.t0;
      /* Rachas de trazo y pausas para pensar, sin patrón fijo. */
      var activo = suaveStep((Math.sin(td / 1700) + 0.6 * Math.sin(td / 730 + 2) + 0.3) / 0.9);
      p.uL = 0.3 + 0.05 * Math.sin(td / 2300) + activo * 0.02 * Math.sin(td / 85);
      p.lift = (1 - activo) * 0.9 + activo * 0.15 * Math.max(0, Math.sin(td / 170));
      p.giro = activo * 4 * Math.sin(td / 85 + 0.6) + 3 * Math.sin(td / 1100);
      p.papel = 0.02 * Math.sin(td / 3100);
      p.cabeza += activo * 1.5 * Math.sin(td / 340) - (1 - activo) * 2;
      /* Las piernas: se balancean, cada una a su aire, y de vez en
         cuando una se queda quieta. */
      var w = p.ik;
      p.rodillaA += w * (7 + 15 * Math.sin(td / 520) * (0.6 + 0.4 * Math.sin(td / 4100)));
      p.rodillaB += w * (2 + 11 * Math.sin(td / 760 + 1.3) * suaveStep(Math.sin(td / 2900) + 0.4));
      p.caderaA += w * 2.5 * Math.sin(td / 1900);
    }
    if (st.tiembla) {
      var tb = st.reloj / 28;
      p.rodillaA += 7 * Math.sin(tb);
      p.rodillaB += 7 * Math.sin(tb + 1.9);
      p.caderaA += 2.5 * Math.sin(tb * 1.3);
      p.caderaB += 2.5 * Math.sin(tb * 1.3 + 1);
      p.y += 0.6 + 0.4 * Math.sin(tb * 2);
    }
    if (st.modo === "andando" && corriendo) {
      var peso = Math.min(1, (st.reloj - corriendo.t0) / 160);
      var cc = st.ciclo;
      var sA = Math.sin(cc), sB = Math.sin(cc + Math.PI);
      var corre = corriendo.corre;
      /* corriendo: zancada larga, rodillas muy dobladas y el cuerpo volcado */
      var zancada = corre ? 45 : 22, flexMin = corre ? 30 : 10, flexMax = corre ? 70 : 34;
      var brazo = corre ? 38 : 16, codo = corre ? 72 : 34;
      if (corre) { p.tronco = lerp(p.tronco, -14, peso); p.cabeza = lerp(p.cabeza, -4, peso); }
      var cA = sA * zancada, cB = sB * zancada;
      p.caderaA = lerp(p.caderaA, cA, peso);
      p.rodillaA = lerp(p.rodillaA, cA - (flexMin + (flexMax - flexMin) * (1 - sA) / 2), peso);
      p.caderaB = lerp(p.caderaB, cB, peso);
      p.rodillaB = lerp(p.rodillaB, cB - (flexMin + (flexMax - flexMin) * (1 - sB) / 2), peso);
      /* los brazos solo se balancean si no llevan nada agarrado */
      if (p.ikA < 0.5) { p.hombroA = lerp(p.hombroA, sB * brazo, peso); p.codoA = lerp(p.codoA, sB * brazo + codo, peso); }
      if (p.ik < 0.5) { p.hombroB = lerp(p.hombroB, sA * brazo, peso); p.codoB = lerp(p.codoB, sA * brazo + codo, peso); }
      p.y = lerp(p.y, Math.abs(sA) * (corre ? -2.2 : -1.0), peso);
    } else if (st.t >= 1) {
      /* respiración: casi nada, pero sin esto parece congelado */
      p.y += Math.sin(ahora / 900) * 0.5;
      p.cabeza += Math.sin(ahora / 1400) * 1.2;
    }
    return p;
  }

  /* ---------- el guion ---------------------------------------- */
  function encolar() {
    for (var i = 0; i < arguments.length; i++) st.guion.push(arguments[i]);
  }
  function pausa(ms) { return { que: "espera", ms: ms }; }
  function ir(nombre, dur, curva) { return { que: "pose", nombre: nombre, dur: dur, curva: curva }; }
  function hacer(f) { return { que: "fn", f: f }; }
  /* Andar hasta `f` (unidades de escena). `atras`: sin darse la vuelta. */
  /* Andar hasta una x en píxeles que se decide AL EMPEZAR (la piedra
     no sabe dónde va a parar hasta que para). */
  function andarA(fx, vel, corre) { return { que: "andar", fx: fx, atras: false, vel: vel || 0.04, corre: !!corre }; }
  function andar(f, atras, vel) { return { que: "andar", f: f, atras: !!atras, vel: vel || 0.05 }; }

  /* `ancla` (opcional): dónde va el decorado, en px. Sin ella, donde
     está él; y si está fuera del marco (entrando por la puerta), en su
     sitio de siempre, que es donde va a llegar. */
  function escena(tipo, ancla) {
    var a = hacer(function () {
      var fuera = st.x < 0 || st.x > ancho;
      esc.tipo = tipo; esc.vis = 1; esc.op = 0;
      esc.x0 = ancla ? ancla() : fuera ? casa : st.x;
      esc.m = fuera ? -1 : st.mira; esc.t0 = st.reloj;
      esc.pila = [1, 1, 1];
      esc.bloque = null; esc.mitades = []; esc.hachaApoyada = false;
      esc.flechas = []; esc.astillasF = []; esc.clavada = false;
      esc.talla = esc.brillo = esc.brilloObj = esc.abrir = esc.abrirObj = 0;
      esc.fresco = 0; esc.fuegoT = 0; esc.quemado = 0; esc.cepilloBanco = false;
      esc.crece = esc.creceObj = 0; esc.mangueraSuelta = false;
      esc.gaveta = esc.gavetaV = 0; esc.moka = null; esc.taza = null;
      esc.llama = esc.vapor = esc.sirviendo = false; esc.cafe = 0;
      if (tipo === "arco") DIANA.y = st.suelo - DIANA.alto * ESCALA;
    });
    a.esEscena = true;
    return a;
  }
  var escenaFuera = hacer(function () { esc.vis = 0; });

  function serie(pasos) { return { que: "serie", pasos: pasos }; }

  /* Tres combinaciones de tajos encadenados (él, 17/09): la hoja no
     se para delante de él, sigue su curso hacia abajo y de ahí
     arranca el siguiente tajo con otro ángulo. [pose, ms hasta ella] */
  var COMBOS = [
    /* diagonal de arriba, que sigue hasta atrás; remonte hacia
       arriba; por encima de la cabeza y otra diagonal más plana */
    { desde: "guardia", pasos: [["s_alta", 320], ["s_corte", 150], ["s_sigue", 200],
        ["s_subeM", 190], ["s_subeF", 180], ["s_atras", 260],
        ["s_corte2", 170], ["s_sigue2", 210]], hasta: "guardia" },
    /* tajo, molinete de muñeca y estocada */
    { desde: "guardia", pasos: [["s_atras", 290], ["s_corte", 160], ["s_sigue", 200],
        ["s_giro1", 150], ["s_giro2", 170], ["s_giro3", 170], ["s_estoc", 150]], hasta: "guardiaN" },
    /* barrido bajo desde atrás, arriba, tajo y estocada */
    { desde: "guardiaN", pasos: [["s_lateral", 280], ["s_barre", 200], ["s_subeF", 180],
        ["s_atras", 240], ["s_corte", 150], ["s_sigue", 200], ["s_subeM", 190],
        ["s_estoc2", 160]], hasta: "guardia" }
  ];
  var VEL_ESPADA = 0.7;      /* factor de duración de los tajos */
  function rutinaEspada() {
    encolar(ir("desenvaina", 320), pausa(400), ir("guardia", 300), pausa(600));
    COMBOS.forEach(function (c) {
      /* los tajos, un 30 % más rápidos (él, 17/09); las pausas en
         guardia no cambian */
      var rapidos = c.pasos.map(function (q) { return [q[0], Math.round(q[1] * VEL_ESPADA)]; });
      encolar(serie(rapidos), pausa(350), ir(c.hasta, 420), pausa(900 + Math.random() * 500));
    });
    /* DARDO (él, 17/09): la sostiene delante, la hoja se vuelve azul
       y brilla cada vez más; al máximo se sobresalta, le tiemblan las
       piernas y sale corriendo por la derecha. Vuelve andando, sin
       espada, y lo siguiente empieza a los 4 s (ver rutinaOcio). */
    encolar(ir("e_contempla", 650), pausa(500),
            hacer(function () { st.brilloEspadaObj = 1; }),
            pausa(2700),
            hacer(function () {
              if (st.puntaEspada) {
                onda(st.puntaEspada[0], st.puntaEspada[1], 20, "#9CC8FF", 500, 2.4);
                particula("destelloFrio", st.puntaEspada[0], st.puntaEspada[1], 0, 0, 420, 5);
              }
            }),
            ir("e_susto", 170, "frena"),
            hacer(function () { st.tiembla = true; }),
            pausa(1500),
            hacer(function () { st.tiembla = false; st.fuera = true; }),
            ir("e_huye", 180),
            andarA(function () { return ancho + 40; }, 0.09, true),
            hacer(function () { st.brilloEspada = st.brilloEspadaObj = 0; fijar("quieto"); }),
            pausa(600));
  }

  function rutinaGuitarra() {
    encolar(escena("fogata"), pausa(500), ir("g_saca", 420), pausa(500),
            ir("g_toca", 320), pausa(200),
            hacer(function () { st.musica = { t0: st.reloj, ultima: -1 }; }),
            pausa(COMPAS * 4),
            hacer(function () { st.musica = null; }),
            ir("g_toca", 150),
            ir("g_acorde", 280), hacer(function () { st.vibra = 1; }),
            pausa(1600),
            ir("g_saca", 380), pausa(300), ir("quieto", 420), pausa(400),
            /* y se sienta un rato en el tronco, junto al fuego (él) */
            andarA(function () { return eP(TRONCO_F, 0)[0]; }, 0.045),
            hacer(function () { st.mira = esc.m; }),
            ir("g_sienta", 750), pausa(2600),
            ir("g_sienta2", 1400), pausa(1800),
            ir("g_sienta", 1300), pausa(2200),
            ir("quieto", 650), pausa(400),
            andarA(function () { return casa; }, 0.045),
            hacer(function () { st.mira = esc.m; }),
            escenaFuera, pausa(600));
  }

  /* Dos ademanes y lanza (él, 17/09: antes eran demasiados). */
  var FLORITURAS = [["v_f1", "v_f2"], ["v_f4", "v_f5"], ["v_f3", "v_f2"]];
  var HECHIZOS = ["fuego", "rayo", "hielo", "agua"];
  function rutinaVarita() {
    encolar(ir("v_saca", 420), pausa(400));
    /* tres hechizos distintos, al azar, sin repetir */
    var orden = HECHIZOS.slice().sort(function () { return Math.random() - 0.5; });
    FLORITURAS.forEach(function (serie, n) {
      var tipo = orden[n];
      encolar(hacer(function () { st.chispas = true; st.hechizo = tipo; }));
      serie.forEach(function (nombre) { encolar(ir(nombre, 260)); });
      encolar(hacer(function () { st.chispas = false; }),
              ir("v_carga", 340), pausa(250),
              ir("v_lanza", 130, "acel"), hacer(function () { disparar(tipo); }),
              pausa(700), ir("v_retro", 320), pausa(1300));
    });
    encolar(ir("v_guarda", 400), pausa(300), ir("quieto", 420));
  }

  /* Arco y flecha (17/09): aparece la diana, cuatro tiros que se
     quedan clavados, y el último parte en dos la del centro. */
  /* LA PRUEBA DE ODISEO (él, 17/09/2026): con capa y gorro, tensa el
     arco en vacío y suelta la cuerda; luego saca UNA flecha, apunta
     con mucha paciencia y la pasa por los cuatro pares de hachas
     hasta el centro del blanco. */
  function rutinaArco() {
    encolar(escena("arco"), ir("a_saca", 550), pausa(900),
            /* la cuerda, en vacío */
            hacer(function () { st.cuerdaEnMano = true; }),
            ir("a_carga", 380), pausa(150),
            ir("a_apunta", 1100), pausa(700),
            hacer(function () { st.cuerdaEnMano = false; st.cuerdaVibra = 1; }),
            ir("a_suelta", 90), pausa(1400),
            ir("a_saca", 600), pausa(1200),
            /* una sola flecha */
            ir("a_toma", 600), pausa(150),
            hacer(function () { st.flechaMano = true; }),
            ir("a_extrae", 420), pausa(120),
            ir("a_lleva", 650),
            hacer(function () { st.flechaMano = false; st.flechaCargada = true; }),
            ir("a_carga", 300), pausa(400),
            /* tensa despacio y aguanta: paciencia */
            ir("a_apunta", 1500), pausa(3000),
            hacer(tiroOdiseo),
            ir("a_suelta", 90), pausa(2600),
            ir("a_saca", 600), pausa(1800),
            escenaFuera, pausa(600), ir("quieto", 450));
  }

  function rutinaDibujo() {
    encolar(escena("dibujo"), ir("quieto", 300), ir("d_sienta", 800),
            pausa(9500),
            ir("d_mira", 600), pausa(2000),
            ir("d_sienta", 520), pausa(9000),
            ir("quieto", 700), escenaFuera, pausa(500),
            ir("quieto", 420));
  }

  function rutinaHacha() {
    var X = HACHA;
    encolar(escena("hacha"), ir("h_hombro", 520), pausa(1400));
    /* Un ciclo por cada leño de la pila, y la pila NO se repone (él,
       17/09): se agota de arriba abajo y, sin leña, se acaba la
       actividad. */
    ORDEN_PILA.forEach(function (n, i) {
      var ultimo = i === ORDEN_PILA.length - 1;
      encolar(
        /* deja el hacha apoyada en el tocón */
        andar(X.xc, false, 0.04),
        ir("h_apoya", 600),
        hacer(function () { esc.hachaApoyada = true; fijar("h_toma"); }),
        ir("h_libre", 420),
        /* va por un leño a la pila, al otro lado */
        andar(X.xps[n], false, 0.05),
        ir(n === 2 ? "h_agacha" : "h_agachaBajo", 560),
        hacer(function () { esc.pila[n] = 0; }),
        ir("h_carga", 560),
        andar(X.xc, false, 0.04),
        ir("h_cerca", 220),
        hacer(function () { st.mira = esc.m; }),
        /* lo pone de pie sobre el tocón */
        ir("h_coloca", 620),
        hacer(function () {
          esc.bloque = { de: st.enMano || eP(X.centroLeño[0], X.centroLeño[1]), t: 0 };
          fijar("h_colocaM");
        }),
        pausa(200),
        /* recoge el hacha y vuelve a su sitio sin darse la vuelta */
        ir("h_toma", 460),
        hacer(function () { esc.hachaApoyada = false; fijar("h_apoya"); }),
        ir("h_lista", 620),
        andar(0, true, 0.03),
        pausa(400),
        /* el hachazo */
        ir("h_arriba", 650), pausa(280),
        ir("h_golpe", 190, "acel"));
      if (ultimo) {
        /* EL ÚLTIMO SE RESISTE (él, 17/09): el hacha se queda clavada,
           tira dos veces sin conseguirlo y la deja ahí. */
        encolar(hacer(atascar), pausa(420),
                ir("h_hala_b", 240), ir("h_hala_a", 460, "frena"), pausa(260),
                ir("h_hala_b", 300), ir("h_hala_a", 430, "frena"), pausa(300),
                ir("h_hala_b", 340), pausa(500),
                hacer(function () { esc.clavada = true; fijar("h_suelta"); }),
                ir("h_rinde", 520), pausa(2200));
      } else {
        encolar(hacer(partir),
                ir("h_hunde", 110, "frena"),
                pausa(500),
                /* al hombro, hasta que desaparezcan las mitades y un poco más */
                ir("h_hombro", 750),
                pausa(2980 - 750 - 610 + 2000));
      }
    });
    encolar(ir("quieto", 600), escenaFuera, pausa(500), ir("quieto", 420));
  }

  /* el hacha se queda trabada en el leño: ni lo parte ni sale */
  function atascar() {
    var P = eP(HACHA.centroLeño[0], HACHA.centroLeño[1] + LEÑO / 2);
    for (var i = 0; i < 6; i++) {
      particula("astilla", P[0] + alAzar(-2, 2), P[1], alAzar(-0.04, 0.04), alAzar(-0.05, 0), alAzar(400, 700), alAzar(0.25, 0.45));
    }
  }
  function partir() {
    esc.bloque = null;
    var c = HACHA.centroLeño;
    esc.mitades = [
      { f0: c[0] + 1.5, h0: c[1], f1: c[0] + TOCON.ancho / 2 + 4.5, h1: 1.5, rot: -90, edad: 0 },
      { f0: c[0] - 1.5, h0: c[1], f1: c[0] - TOCON.ancho / 2 - 4, h1: 1.5, rot: 90, edad: 0 }
    ];
    var P = eP(c[0], c[1] + LEÑO / 2);
    for (var i = 0; i < 12; i++) {
      particula("astilla", P[0] + (Math.random() - 0.5) * 4, P[1],
                (Math.random() - 0.5) * 0.12, -0.06 - Math.random() * 0.08,
                700 + Math.random() * 500, 0.35 + Math.random() * 0.35);
    }
  }

  /* Espada, guitarra, varita, dibujo y hacha se turnan en ese
     orden: nunca sale la misma dos veces seguidas. */

  /* Se sienta con una pierna estirada, al rato saca un libro y lee
     (él, 17/09). */
  function rutinaSentado() {
    var AV = POSES.lev_pie.avance;
    encolar(
            /* Se sienta YA retrasado (él, 17/09: no quería verlo volver
               caminando). El ancla se corre atrás lo que luego avanzará
               al levantarse, y la pose equivalente lo deja donde está:
               no se ve ningún salto. Baja al piso con la secuencia de
               levantarse al revés. */
            escena("arbol", function () { return casa + AV * ESCALA; }),
            hacer(function () {
              st.x -= st.mira * AV * ESCALA;
              fijar("lev_pie");
            }),
            ir("lev_empuja", 650), pausa(150),
            ir("lev_cuclillas", 700), pausa(150),
            ir("lev_recoge", 650), pausa(150),
            ir("sentado", 600), pausa(3500),
            ir("l_saca", 550), pausa(350),
            ir("l_lee", 500),
            hacer(function () { st.lectura = { t0: st.reloj }; }),
            pausa(2600), hacer(ponerPajaro),
            pausa(4600 * 3 - 200 - 2600),
            hacer(function () { st.lectura = null; pajaroSeVa(); }),
            ir("l_saca", 500), pausa(400),
            ir("sentado", 500), pausa(900),
            /* se levanta como una persona, apoyándose en el piso */
            ir("lev_recoge", 650), pausa(300),
            ir("lev_cuclillas", 800), pausa(250),
            ir("lev_empuja", 650),
            ir("lev_pie", 550),
            /* ya de pie, justo en su sitio: el avance pasa a ser su
               posición real */
            hacer(function () {
              st.x += st.mira * AV * ESCALA;
              fijar("quieto");
            }),
            escenaFuera, pausa(800));
  }

  /* saluda UNA sola vez (él, 17/09: antes saludaba dos veces) */
  function rutinaSaludo() {
    encolar(ir("saluda_a", 420));
    for (var i = 0; i < 5; i++) encolar(ir("saluda_b", 190), ir("saluda_a", 190));
    encolar(pausa(500), ir("quieto", 460), pausa(600));
  }

  function rutinaEstira() {
    encolar(ir("estira_arriba", 800), pausa(400),
            ir("estira_arriba2", 900), ir("estira_arriba", 800), pausa(300),
            ir("quieto", 650), pausa(200),
            ir("estira_atras", 650), pausa(1400),
            ir("quieto", 500));
    for (var i = 0; i < 3; i++) encolar(ir("sacude_a", 120), ir("sacude_b", 120));
    encolar(ir("quieto", 300), pausa(300));
  }

  /* 17/09 (él): el único gesto además del saludo, y más largo. Dos
     patadas suaves, yendo andando hasta la piedra cada vez, y una
     tercera fuerte que la manda lejos. Después vuelve a su sitio. */
  function rutinaPiedra() {
    encolar(hacer(ponerPiedra),
            ir("piedra_mira", 550), pausa(1200));
    for (var k = 0; k < 3; k++) {
      var fuerte = k === 2;
      encolar(ir("patea_atras", fuerte ? 450 : 380), pausa(fuerte ? 250 : 120),
              ir("patea", fuerte ? 140 : 170, "acel"),
              hacer(fuerte ? function () { patearPiedra(0.17, true); }
                           : function () { patearPiedra(0.075, false); }),
              ir("piedra_sigue", 450), pausa(fuerte ? 2400 : 1500));
      if (!fuerte) {
        /* va hasta donde quedó, la mira y se prepara */
        encolar(andarA(function () {
                  return st.piedra ? st.piedra.x - st.mira * 5.5 * ESCALA : st.x;
                }, 0.035),
                ir("piedra_mira", 400), pausa(700));
      }
    }
    /* se da la vuelta y regresa andando */
    encolar(ir("quieto", 450), pausa(300),
            andarA(function () { return casa; }, 0.04),
            hacer(function () { st.mira = -1; }),
            pausa(400));
  }

  /* LA PIEDRITA: aparece a sus pies, sale volando con la patada,
     rebota, rueda y se desvanece al rato de pararse. En píxeles. */
  function sueloPiedra() { return st.suelo + 2 - 1.1; }
  function ponerPiedra() {
    var P = aP([5.5, 0]);
    st.piedra = { x: P[0], y: sueloPiedra(), vx: 0, vy: 0, rot: 0, alfa: 0,
                  suelta: false, quieta: 0 };
  }
  function patearPiedra(fuerza, ultima) {
    if (!st.piedra) return;
    st.piedra.vx = st.mira * (fuerza || 0.17);
    st.piedra.vy = ultima ? -0.15 : -0.1;
    st.piedra.suelta = true;
    st.piedra.quieta = 0;
    /* hasta la última patada no se desvanece: él tiene que llegar a ella */
    st.piedra.ultima = !!ultima;
    particula("astilla", st.piedra.x, st.piedra.y, st.mira * 0.02, -0.03, 300, 0.3);
  }
  function moverPiedra(dt) {
    var q = st.piedra;
    if (!q) return;
    if (!q.suelta) { q.alfa = Math.min(1, q.alfa + dt / 300); return; }
    q.vy += 0.0007 * dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.rot += q.vx * dt * 60;
    if (q.y >= sueloPiedra()) {
      q.y = sueloPiedra();
      if (Math.abs(q.vy) > 0.03) { q.vy *= -0.42; q.vx *= 0.8; }
      else { q.vy = 0; q.vx *= Math.pow(0.992, dt); }
    }
    if (q.x < 4) { q.x = 4; q.vx = Math.abs(q.vx) * 0.3; }
    if (q.x > ancho - 4) { q.x = ancho - 4; q.vx = -Math.abs(q.vx) * 0.3; }
    if (Math.abs(q.vx) < 0.004 && q.vy === 0) {
      q.quieta += dt;
      if (q.ultima && q.quieta > 1200) q.alfa -= dt / 500;
      if (q.alfa <= 0) st.piedra = null;
    }
  }
  var piedraEl = el("ellipse", { "class": "monigote__piedra", rx: 1.5, ry: 1.1, opacity: 0 }, capaFrente);
  function pintarPiedra() {
    var q = st.piedra;
    if (!q) { piedraEl.setAttribute("opacity", 0); return; }
    piedraEl.setAttribute("opacity", q.alfa);
    piedraEl.setAttribute("transform", "translate(" + q.x.toFixed(2) + "," + q.y.toFixed(2) + ") rotate(" + q.rot.toFixed(1) + ")");
  }

  /* EL CICLO (él, 17/09/2026): su casa es el escritorio de dibujo.
     Para cualquier otra actividad se levanta, sale por la IZQUIERDA
     (como por una puerta), entra por la DERECHA con el decorado nuevo
     apareciendo, la hace, sale por la derecha, entra por la izquierda,
     reaparece el escritorio y se sienta a dibujar otra vez.
     Ninguna actividad sale dos veces seguidas, ni intercalada (A, B,
     A): se elige entre todas MENOS las dos últimas. */
  var REPERTORIO = [
    ["espada", 1], ["guitarra", 1], ["varita", 1], ["arco", 1],
    ["hacha", 1], ["sentado", 1.2], ["saludo", 1], ["piedra", 1],
    /* «moria» quitada (él, 17/09: no le gustó); su código sigue abajo.
       «dibujo» ya no está: es su casa, a la que vuelve siempre */
    ["cepillo", 1], ["dragon", 1], ["anillo", 1], ["planta", 1], ["cafe", 1]
  ];
  var PUERTA = 26;              /* px más allá del borde: ya no se le ve */
  var VEL_PUERTA = 0.055;
  /* dónde se queda al entrar; si no está aquí, en su sitio */
  var PUESTOS = { arco: function () { return ancho - MARGEN - 6; } };
  var ultimas = [], forzada = null;
  function elegirActividad() {
    var libres = REPERTORIO.filter(function (r) { return ultimas.indexOf(r[0]) === -1; });
    var total = libres.reduce(function (a, r) { return a + r[1]; }, 0);
    var x = Math.random() * total, elegida = libres[libres.length - 1][0];
    for (var i = 0; i < libres.length; i++) {
      x -= libres[i][1];
      if (x <= 0) { elegida = libres[i][0]; break; }
    }
    if (forzada) { elegida = forzada; forzada = null; }   /* solo para probar */
    ultimas.push(elegida);
    if (ultimas.length > 2) ultimas.shift();
    return elegida;
  }
  /* los pasos de una rutina, sin encolarlos todavía */
  function pasosDe(nombre) {
    var antes = st.guion;
    st.guion = [];
    RUTINAS[nombre]();
    var r = st.guion;
    st.guion = antes;
    return r;
  }
  /* en el escritorio: aparece, se sienta y dibuja un buen rato */
  function sentarseADibujar() {
    encolar(hacer(function () { st.mira = -1; }),
            escena("dibujo"), pausa(450),
            ir("d_sienta", 800));
  }
  function ratoDibujando() {
    encolar(pausa(8000 + Math.random() * 4000),
            ir("d_mira", 600), pausa(1800),
            ir("d_sienta", 520), pausa(7000 + Math.random() * 5000));
  }
  function rutinaOcio() {
    var sig = elegirActividad();
    /* se levanta; el escritorio se va mientras sale por la izquierda */
    encolar(ir("quieto", 700), escenaFuera, pausa(200),
            hacer(function () { st.fuera = true; }),
            andarA(function () { return -PUERTA; }, VEL_PUERTA),
            pausa(500));
    /* entra por la derecha, y el decorado aparece mientras entra */
    var pasos = pasosDe(sig);
    var decorado = pasos.length && pasos[0].esEscena ? [pasos.shift()] : [];
    encolar(hacer(function () {
              st.x = ancho + PUERTA; st.mira = -1;
              st.disfraz = sig === "arco";
              fijar("quieto");
            }));
    encolar.apply(null, decorado);
    encolar(andarA(function () { return PUESTOS[sig] ? PUESTOS[sig]() : casa; }, VEL_PUERTA),
            hacer(function () { st.fuera = false; st.mira = -1; }));
    encolar.apply(null, pasos);
    /* sale por la derecha y vuelve por la izquierda a su escritorio */
    encolar(escenaFuera, ir("quieto", 350),
            hacer(function () { st.fuera = true; }),
            andarA(function () { return Math.max(st.x, ancho + PUERTA); }, VEL_PUERTA),
            pausa(500),
            hacer(function () { st.x = -PUERTA; st.mira = 1; st.disfraz = false; }),
            andarA(function () { return casa; }, VEL_PUERTA),
            hacer(function () { st.fuera = false; }));
    sentarseADibujar();
    ratoDibujando();
  }

  /* ==============================================================
     CUATRO ACTIVIDADES NUEVAS (17/09, elegidas por él)
     ============================================================== */

  /* ---------- poses ---------- */
  /* DARDO (17/09): la contempla en alto, se asusta y huye */
  POSES.e_contempla = pose({ tronco: -2, cabeza: -4, hombroA: 40, codoA: 130,
    hombroB: -8, codoB: 60, objeto: "espada", ang: 178 });
  POSES.e_susto = pose({ tronco: 15, cabeza: 16, hombroA: 90, codoA: 98,
    hombroB: -40, codoB: 12, objeto: "espada", ang: 140,
    caderaA: 16, rodillaA: 2, caderaB: -16, rodillaB: -26, apoyo: true });
  POSES.e_huye = pose({ tronco: -12, cabeza: -4, hombroA: 30, codoA: 80,
    hombroB: -20, codoB: 40, objeto: "espada", ang: 200 });
  POSES.m_talla = pose(mezcla(PIE_ARCO, { tronco: -10, cabeza: -8,
    objeto: "talla", ik: 1, ikA: 1, golpe: 1, angM: 165 }));
  POSES.m_golpe = pose(mezcla(PIE_ARCO, { tronco: -12, cabeza: -10,
    objeto: "talla", ik: 1, ikA: 1, golpe: 0, angM: 100 }));
  /* «habla, amigo, y entra»: la mano abierta hacia la puerta */
  POSES.m_habla = pose({ tronco: -2, cabeza: 6, hombroA: 118, codoA: 138, hombroB: -8, codoB: -4 });
  POSES.m_admira = pose({ tronco: 5, cabeza: 8, hombroA: 8, codoA: 4, hombroB: -8, codoB: -4 });
  var PIE_CEP = { caderaA: 36, rodillaA: 20, caderaB: -26, rodillaB: -40, apoyo: true };
  POSES.c_atras = pose(mezcla(PIE_CEP, { tronco: -26, cabeza: -14, objeto: "cepillo", ik: 1, ikA: 1, cep: 0 }));
  POSES.c_adelante = pose(mezcla(PIE_CEP, { tronco: -46, cabeza: -18, objeto: "cepillo", ik: 1, ikA: 1, cep: 1 }));
  POSES.c_mira = pose(mezcla(PIE_CEP, { tronco: -38, cabeza: -26, objeto: "cepillo", ik: 1, ikA: 1, cep: 0.45 }));
  /* el cepillo se queda en el banco (él, 17/09): las manos donde lo
     soltó, y de pie descansando */
  POSES.c_suelta_m = pose(mezcla(PIE_CEP, { tronco: -26, cabeza: -14, objeto: "manos", ik: 1, ikA: 1,
    aX: 5.2, aY: -0.8 }));
  (function () {
    var q = POSES.c_suelta_m, c = cuelloDe(q);
    q.hx = 12 - 2.6 - c[0];
    q.hy = c[1] - (23.3 + 3.4);
  })();
  POSES.c_descansa = pose({ tronco: 4, cabeza: -10, hombroA: 12, codoA: -20, hombroB: -14, codoB: 24 });
  POSES.c_estira = pose({ tronco: 8, cabeza: 14, hombroA: 150, codoA: 166, hombroB: 196, codoB: 212 });
  POSES.mira_arriba = pose({ tronco: 5, cabeza: 18, hombroA: 8, codoA: 4, hombroB: -8, codoB: -4 });
  POSES.susto = pose({ tronco: 9, cabeza: 10, hombroA: 55, codoA: 135, hombroB: 45, codoB: 145,
    caderaA: 10, rodillaA: 4, caderaB: -12, rodillaB: -12, apoyo: true });
  POSES.an_recoge = pose(mezcla(AGACHA, { tronco: -60, cabeza: -14, objeto: "manos", ik: 1, ikA: 1, hx: 3 }));
  POSES.an_mira = pose({ tronco: 2, cabeza: 4, hombroA: 58, codoA: 150, hombroB: -8, codoB: -4 });
  POSES.an_pone = pose({ tronco: -2, cabeza: -10, hombroA: 38, codoA: 108, hombroB: 28, codoB: 116 });
  POSES.an_susto_a = pose({ tronco: 7, cabeza: 9, hombroA: 50, codoA: 150, hombroB: 40, codoB: 160,
    caderaA: 12, rodillaA: 5, caderaB: -12, rodillaB: -12, apoyo: true });
  POSES.an_susto_b = pose({ tronco: 2, cabeza: 3, hombroA: 57, codoA: 142, hombroB: 47, codoB: 152,
    caderaA: 12, rodillaA: 5, caderaB: -12, rodillaB: -12, apoyo: true });
  POSES.an_guarda = pose({ tronco: -2, cabeza: -4, hombroA: -14, codoA: 20, hombroB: -8, codoB: -4 });
  /* dónde queda el anillo para que la mano A lo recoja */
  var ANILLO_F = (function () {
    var q = POSES.an_recoge, c = cuelloDe(q);
    q.hy = c[1] - 1.3;
    return c[0] + q.hx + 1;
  })();

  /* ---------- puerta de Moria ----------
     Dos hojas de madera en arco dentro de un marco de piedra, y
     detrás el hueco oscuro. El dibujo (ithildin) va tallándose trazo a
     trazo con cada golpe (stroke-dashoffset) y al final se ilumina en
     plata. En unidades, con el centro de la puerta en MORIA_F. */
  var MORIA_F = 16, MORIA_N;
  var escMoria = el("g", { opacity: 0 }, capaFondo);
  var moriaG = el("g", { transform: "translate(" + MORIA_F + ",0)" }, escMoria);
  el("path", { "class": "monigote__piedra-marco", d: "M -9.8,0 V -30 A 9.8 9.8 0 0 1 9.8 -30 V 0 Z" }, moriaG);
  el("path", { "class": "monigote__moria-hueco", d: "M -8,0 V -30 A 8 8 0 0 1 8 -30 V 0 Z" }, moriaG);
  function hojaMoria(lado) {
    var g = el("g", {}, moriaG);
    el("path", { "class": "monigote__moria-hoja", d:
      "M 0,0 V -38 A 8 8 0 0 " + (lado > 0 ? 1 : 0) + " " + (8 * lado) + ",-30 V 0 Z" }, g);
    [[2.7, -37.5], [5.4, -35.9]].forEach(function (q) {
      L(g, q[0] * lado, 0, q[0] * lado, q[1], "monigote__moria-tabla");
    });
    return g;
  }
  var hojaMI = hojaMoria(-1), hojaMD = hojaMoria(1);
  var TRAZOS_MORIA = [
    "M -6.6,0 V -30 A 6.6 6.6 0 0 1 6.6 -30 V 0",
    "M -5,0 V -24 M -5,-24 Q -7,-27 -6.2,-30 M -5,-24 Q -3,-27 -3.6,-30",
    "M 5,0 V -24 M 5,-24 Q 7,-27 6.2,-30 M 5,-24 Q 3,-27 3.6,-30",
    "M 0,-19.6 L 0,-14.4 M -2.6,-17 L 2.6,-17 M -1.6,-18.6 L 1.6,-15.4 M 1.6,-18.6 L -1.6,-15.4",
    "M -2,-25 L -1.3,-27 L -0.5,-25.6 L 0,-27.6 L 0.5,-25.6 L 1.3,-27 L 2,-25 Z",
    "M -1.6,-9 H 1.6 L 1,-7.8 H -1 Z M 0,-7.8 V -6 M -2.2,-11.6 L 0.6,-10.1"
  ];
  MORIA_N = TRAZOS_MORIA.length;
  var runasG = el("g", {}, moriaG);
  var surcos = TRAZOS_MORIA.map(function (d) {
    return el("path", { d: d, pathLength: 1, "class": "monigote__surco" }, runasG);
  });
  var luzRunas = el("g", { opacity: 0 }, runasG);
  TRAZOS_MORIA.forEach(function (d) { el("path", { d: d, "class": "monigote__ithildin-halo" }, luzRunas); });
  TRAZOS_MORIA.forEach(function (d) { el("path", { d: d, "class": "monigote__ithildin" }, luzRunas); });
  [30, 55, 90, 125, 150].forEach(function (a) {
    el("circle", { cx: (-Math.cos(a * RAD) * 5.3).toFixed(2), cy: (-30 - Math.sin(a * RAD) * 5.3).toFixed(2),
      r: 0.4, "class": "monigote__ithildin-estrella" }, luzRunas);
  });
  function pintarMoria() {
    var k = 1 - 0.88 * suaveStep(esc.abrir);
    hojaMI.setAttribute("transform", "translate(-8,0) scale(" + k.toFixed(3) + ",1) translate(8,0)");
    hojaMD.setAttribute("transform", "translate(8,0) scale(" + k.toFixed(3) + ",1) translate(-8,0)");
    runasG.setAttribute("opacity", clamp(1 - esc.abrir * 2, 0, 1));
    surcos.forEach(function (e, i) {
      e.style.strokeDashoffset = (1 - clamp(esc.talla * MORIA_N - i, 0, 1)).toFixed(3);
    });
    luzRunas.setAttribute("opacity", esc.brillo.toFixed(3));
  }

  /* ---------- banco de cepillar ----------
     17/09, 2.ª versión (él): un banco ROUBO de verdad — tapa gruesa,
     patas cuadradas a ras del canto, travesaños, tornillo de banco en
     la pata delantera y agujeros de bancada. La tabla NO cambia de
     largo (antes parecía que crecía con cada pasada): lo que cambia es
     el color, que se va aclarando a medida que la cepilla. */
  var escCepillo = el("g", { opacity: 0 }, capaFondo);
  (function construirBanco() {
    var g = escCepillo;
    /* tapa gruesa */
    el("rect", { x: 7, y: -21.5, width: 25, height: 3.2, rx: 0.4, "class": "monigote__banco-tapa" }, g);
    /* agujeros de bancada */
    [11, 15, 19, 23, 27].forEach(function (x) {
      el("rect", { x: x, y: -21.2, width: 0.9, height: 0.9, rx: 0.2, "class": "monigote__banco-hueco" }, g);
    });
    /* patas cuadradas, a ras del canto */
    [[8.4, 2.6], [27.4, 2.6]].forEach(function (q) {
      el("rect", { x: q[0], y: -18.3, width: q[1], height: 18.3, "class": "monigote__banco-pata" }, g);
    });
    /* travesaños y peana */
    el("rect", { x: 9.4, y: -6.4, width: 19.4, height: 1.5, "class": "monigote__banco-pata" }, g);
    el("rect", { x: 9.4, y: -13, width: 19.4, height: 1.1, "class": "monigote__banco-pata" }, g);
    /* tornillo de banco en la pata de delante */
    el("rect", { x: 6.4, y: -17.6, width: 1.5, height: 11, rx: 0.3, "class": "monigote__banco-mordaza" }, g);
    el("circle", { cx: 7.1, cy: -12.4, r: 1.1, "class": "monigote__banco-husillo" }, g);
    L(g, 7.1, -12.4, 4.6, -12.4, "monigote__banco-barra");
    L(g, 4.6, -13.6, 4.6, -11.2, "monigote__banco-barra");
    /* tope de cepillar, al final de la tapa */
    el("rect", { x: 30.6, y: -23.4, width: 1.4, height: 2.2, "class": "monigote__banco-tope" }, g);
    /* la tabla que cepilla: SIEMPRE del mismo largo */
    el("rect", { x: 9.6, y: -23.3, width: 20.6, height: 1.9, "class": "monigote__tabla-cruda" }, g);
  })();
  var tablaFresca = el("rect", { x: 9.6, y: -23.3, width: 20.6, height: 1.9, opacity: 0,
    "class": "monigote__tabla-fresca" }, escCepillo);
  function pintarCepillo() {
    /* la madera se aclara, no se alarga */
    tablaFresca.setAttribute("opacity", clamp(esc.fresco, 0, 1).toFixed(3));
  }

  /* ---------- el tronco del dragón ---------- */
  /* LEÑO_D: el extremo del tronco que da al muñeco. Más lejos (él,
     17/09/2026): el dragón aterriza al otro lado y lo quema de cerca. */
  var LEÑO_D = 31, LEÑO_DL = 13, LEÑO_DC = LEÑO_D + LEÑO_DL / 2;
  var escDragon = el("g", { opacity: 0 }, capaFondo);
  el("rect", { x: LEÑO_D, y: -4.6, width: LEÑO_DL, height: 4.6, rx: 2.3, "class": "monigote__corteza" }, escDragon);
  [3, 6.5, 10].forEach(function (x) { L(escDragon, LEÑO_D + x, -4, LEÑO_D + x + 0.6, -0.6, "monigote__corteza-veta"); });
  el("ellipse", { cx: LEÑO_D + 0.4, cy: -2.3, rx: 1.1, ry: 2.2, "class": "monigote__testa" }, escDragon);
  el("ellipse", { cx: LEÑO_D + 0.5, cy: -2.3, rx: 0.5, ry: 1.1, "class": "monigote__anillo" }, escDragon);
  var troncoQuemado = el("rect", { x: LEÑO_D, y: -4.6, width: LEÑO_DL, height: 4.6, rx: 2.3, "class": "monigote__quemado", opacity: 0 }, escDragon);
  function pintarTroncoDragon() { troncoQuemado.setAttribute("opacity", (0.8 * esc.quemado).toFixed(3)); }

  /* ---------- el dragoncito ----------
     Rojo, de perfil, mirando a +x; las alas se baten encogiendo en y.
     Más orgánico (él, 17/09/2026): el cuerpo va inclinado, respira y
     se mece; la cola ondula en ola; la cabeza cabecea. Aterriza sobre
     la pata de atrás y desde el suelo quema el tronco. */
  var DRAGON_S = ESCALA * 1.15;
  var PATA_D = [-2.4, 4.4];            /* el pie de atrás: pivote al posarse */
  var dragonG = el("g", { opacity: 0 }, capaEfectos);
  var alaLejos = el("path", { "class": "monigote__dragon-ala-lejos",
    d: "M -0.5,-1.2 L -4,-8 L -1.5,-6 L 1,-8.5 L 1.8,-1.4 Z" }, dragonG);
  var colaEl = el("path", { "class": "monigote__dragon-cola" }, dragonG);
  var colaPunta = el("path", { "class": "monigote__dragon", d: "M 0.4,0 L -1.6,-1.1 L -1.2,1 Z" }, dragonG);
  var pataTras = L(dragonG, -1.8, 1.8, PATA_D[0], PATA_D[1], "monigote__dragon-pata");
  var pataDel = L(dragonG, 1.8, 1.8, 2.3, 3.3, "monigote__dragon-pata");
  var torsoD = el("g", {}, dragonG);
  el("ellipse", { cx: 0, cy: 0, rx: 4.2, ry: 2.3, "class": "monigote__dragon" }, torsoD);
  el("path", { "class": "monigote__dragon-panza", d: "M -3,0.9 Q 0,2.7 3.2,0.8 Q 0,1.6 -3,0.9 Z" }, torsoD);
  var cabezaD = el("g", {}, dragonG);
  el("path", { "class": "monigote__dragon-cola", d: "M 3,-0.8 Q 5,-2 5.6,-3.6" }, cabezaD);
  el("path", { "class": "monigote__dragon", d: "M 4.8,-4.7 L 7.8,-4.2 L 8.5,-3.3 L 5.2,-2.8 Z" }, cabezaD);
  el("path", { "class": "monigote__dragon-cuerno", d: "M 5,-4.5 L 4,-6.1 L 5.7,-4.7 Z" }, cabezaD);
  el("circle", { cx: 6.2, cy: -4, r: 0.35, "class": "monigote__dragon-ojo" }, cabezaD);
  var alaCerca = el("path", { "class": "monigote__dragon-ala",
    d: "M 0,-1.2 L -2.6,-9 L 0,-6.8 L 2.4,-9.6 L 2.6,-1.4 Z" }, dragonG);
  var CUELLO_D = [3, -0.8];

  function dragonIr(x, y, ms) {
    var d = st.dragon;
    d.x0 = d.x; d.y0 = d.y; d.x1 = x; d.y1 = y; d.t = 0; d.T = ms;
    if (Math.abs(x - d.x) > 2) d.cara = x > d.x ? 1 : -1;
  }
  function logPx(f, h) { return eP(f, h); }
  function rotar(p, c, a) {
    var cs = Math.cos(a * RAD), sn = Math.sin(a * RAD), x = p[0] - c[0], y = p[1] - c[1];
    return [c[0] + x * cs - y * sn, c[1] + x * sn + y * cs];
  }
  /* la postura de este fotograma: inclinación, cabeceo, alas, cola */
  function posturaDragon(d) {
    var t = st.reloj, soplo = d.fuego > 0 ? 1 : 0;
    var q = {};
    if (d.posado) {
      q.incl = -40 + 3 * Math.sin(t / 520) + 6 * soplo;     /* erguido; se inclina al soplar */
      q.cab = 4 * Math.sin(t / 430) + 26 * soplo;
      q.alas = 0.3 + 0.08 * Math.sin(t / 300);
      q.flota = 0;
      q.amp = 1.1; q.ritmo = 330;
    } else {
      q.incl = -14 + 7 * Math.sin(d.fase / 3.1);
      q.cab = 6 * Math.sin(d.fase / 2.3 + 1);
      q.alas = 0.25 + 0.75 * Math.cos(d.fase);
      q.flota = Math.sin(t / 240) * 1.2;
      q.amp = 1.9; q.ritmo = 170;
    }
    q.resp = 1 + 0.05 * Math.sin(t / 380);
    return q;
  }
  /* de coordenadas del dibujo a píxeles, con la inclinación sobre el pie */
  function dragonAPx(d, q, p) {
    var r = rotar(p, PATA_D, q.incl);
    return [d.x + d.cara * DRAGON_S * r[0], d.y + q.flota + DRAGON_S * r[1]];
  }
  function moverDragon(dt) {
    var d = st.dragon;
    if (!d) return;
    d.t += dt; d.fase += dt / (d.aterriza ? 45 : 65);
    var u = suaveStep(d.T ? d.t / d.T : 1);
    d.x = lerp(d.x0, d.x1, u);
    d.y = lerp(d.y0, d.y1, u);
    d.alfa = d.vete ? Math.max(0, 1 - Math.max(0, u - 0.55) / 0.4) : Math.min(1, d.alfa + dt / 300);
    var q = posturaDragon(d);
    var boca = dragonAPx(d, q, rotar([8.5, -3.3], CUELLO_D, q.cab));
    if (d.fuego > 0) {
      d.fuego -= dt; d.soplando += dt;
      var blanco = logPx(LEÑO_DC + alAzar(-3, 4), 2.5);
      var dx = blanco[0] - boca[0], dy = blanco[1] - boca[1], dd = Math.sqrt(dx * dx + dy * dy) || 1;
      for (var k = 0; k < Math.max(1, Math.round(dt / 6)); k++) {
        var v = alAzar(0.07, 0.11);
        particula("fuego", boca[0], boca[1], dx / dd * v + alAzar(-0.015, 0.015), dy / dd * v + alAzar(-0.015, 0.015),
                  alAzar(220, 360), alAzar(0.8, 1.5));
      }
      if (d.soplando > 350) esc.fuegoT = Math.min(1, esc.fuegoT + dt / 500);
    }
    if (d.humo > 0) {
      d.humo -= dt;
      if (Math.random() < dt / 60) particula("vapor", boca[0], boca[1], d.cara * 0.01, -0.02, 700, 0.6);
    }
  }
  function pintarDragon() {
    var d = st.dragon;
    if (!d) { dragonG.setAttribute("opacity", 0); return; }
    var q = posturaDragon(d);
    dragonG.setAttribute("opacity", d.alfa);
    dragonG.setAttribute("transform", "translate(" + d.x.toFixed(2) + "," + (d.y + q.flota).toFixed(2) + ") scale(" +
      (d.cara * DRAGON_S).toFixed(3) + "," + DRAGON_S.toFixed(3) + ") rotate(" + q.incl.toFixed(2) + " " +
      PATA_D[0] + " " + PATA_D[1] + ")");
    /* el torso respira */
    torsoD.setAttribute("transform", "scale(1," + q.resp.toFixed(3) + ")");
    cabezaD.setAttribute("transform", "rotate(" + q.cab.toFixed(2) + " " + CUELLO_D[0] + " " + CUELLO_D[1] + ")");
    alaCerca.setAttribute("transform", "translate(0,-1.2) scale(1," + q.alas.toFixed(3) + ") translate(0,1.2)");
    alaLejos.setAttribute("transform", "translate(0,-1.2) scale(1," + (q.alas * 0.9).toFixed(3) + ") translate(0,1.2)");
    /* la cola: una ola que corre de la base a la punta, y se levanta
       un poco cuando está posado */
    var pts = [], fase = st.reloj / q.ritmo;
    for (var n = 0; n <= 10; n++) {
      var s2 = n / 10;
      var y = 0.5 + 0.6 * s2 + q.amp * s2 * Math.sin(fase - s2 * 3.2) - (d.posado ? 2.6 * s2 * s2 : 0);
      pts.push([-3 - 9.5 * s2, y]);
    }
    colaEl.setAttribute("d", "M " + pts.map(function (p) { return p[0].toFixed(2) + "," + p[1].toFixed(2); }).join(" L "));
    var fin = pts[10], ant = pts[9];
    var ang = Math.atan2(fin[1] - ant[1], fin[0] - ant[0]) / RAD + 180;
    colaPunta.setAttribute("transform", "translate(" + fin[0].toFixed(2) + "," + fin[1].toFixed(2) + ") rotate(" + ang.toFixed(1) + ")");
    /* las patas: colgando al volar; al posarse, la de atrás al suelo y
       la de adelante recogida */
    var cuelga = d.posado ? 0 : 0.6 * Math.sin(st.reloj / 300);
    pataTras.setAttribute("x2", (PATA_D[0] + cuelga).toFixed(2));
    pataDel.setAttribute("x2", (d.posado ? 3.2 : 2.3 + cuelga).toFixed(2));
    pataDel.setAttribute("y2", (d.posado ? 2.6 : 3.3).toFixed(2));
  }
  function fuegoTronco(dt) {
    if (!(esc.fuegoT > 0) || esc.tipo !== "dragon") return;
    var n = dt / 22 * esc.fuegoT;
    while (n > 0) {
      if (Math.random() < n) {
        var q = logPx(alAzar(LEÑO_D + 1.5, LEÑO_D + LEÑO_DL - 1), 4.2);
        particula("fuego", q[0], q[1], alAzar(-0.01, 0.01), alAzar(-0.07, -0.03), alAzar(350, 650), alAzar(0.9, 1.9));
        if (Math.random() < 0.15) particula("brasa", q[0], q[1], alAzar(-0.02, 0.02), alAzar(-0.1, -0.05), alAzar(500, 800), 0.5);
      }
      n -= 1;
    }
  }
  function apagarTronco() {
    esc.fuegoT = 0;
    esc.quemado = 1;
    for (var i = 0; i < 30; i++) {
      var q = logPx(alAzar(LEÑO_D + 1, LEÑO_D + LEÑO_DL - 1), alAzar(2, 5));
      particula("vapor", q[0], q[1], alAzar(-0.015, 0.015), alAzar(-0.05, -0.02), alAzar(900, 1500), alAzar(0.8, 1.6));
    }
  }

  /* ---------- el Anillo Único y el Ojo ---------- */
  var anilloEl = el("ellipse", { "class": "monigote__anillo-oro", rx: 1.2, ry: 0.8, opacity: 0 }, capaFrente);
  degradado("radialGradient", "mon-ojo",
    [["0", "#FFE9A0"], [".35", "#FF9A2A"], [".7", "#C0300C", .8], ["1", "#6A0E02", 0]]);
  var ojoG = el("g", { opacity: 0 }, capaEfectos);
  el("ellipse", { cx: 0, cy: 0, rx: 13, ry: 7, fill: "url(#mon-ojo)" }, ojoG);
  el("ellipse", { cx: 0, cy: 0, rx: 5.5, ry: 3.4, "class": "monigote__ojo-iris" }, ojoG);
  el("ellipse", { cx: 0, cy: 0, rx: 0.9, ry: 3.1, "class": "monigote__ojo-pupila" }, ojoG);
  function ponerAnillo() {
    var P = aP([ANILLO_F, 0]);
    st.anillo = { x: P[0], y: st.suelo + 2 - 0.8, estado: "suelo", alfa: 0 };
  }
  function moverAnillo(dt) {
    st.opCuerpo += clamp(st.opCuerpoObj - st.opCuerpo, -dt / 350, dt / 350);
    st.ojo += clamp(st.ojoObj - st.ojo, -dt / 450, dt / 450);
    var a = st.anillo;
    if (!a) return;
    a.alfa = Math.min(1, a.alfa + dt / 400);
    if (a.estado === "mano" && st.manoAPx) { a.x = st.manoAPx[0]; a.y = st.manoAPx[1] - 0.6; }
    if (a.estado !== "puesto" && Math.random() < dt / 380) {
      particula("chispa", a.x + alAzar(-1, 1), a.y + alAzar(-1, 0.5), alAzar(-0.01, 0.01), alAzar(-0.02, 0), alAzar(250, 450), alAzar(0.4, 0.7));
    }
  }
  function pintarAnillo() {
    /* al huir por la derecha se desvanece al pasar el borde de la
       tarjeta (nada lo recorta: se le vería fuera), y al volver aparece */
    var enBorde = clamp(Math.min(ancho + 2 - st.x, st.x + 2) / 18, 0, 1);
    cuerpo.setAttribute("opacity", (st.opCuerpo * enBorde).toFixed(3));
    var a = st.anillo;
    if (!a || a.estado === "puesto") anilloEl.setAttribute("opacity", 0);
    else {
      anilloEl.setAttribute("opacity", a.alfa);
      anilloEl.setAttribute("cx", a.x.toFixed(2)); anilloEl.setAttribute("cy", a.y.toFixed(2));
    }
    ojoG.setAttribute("opacity", (st.ojo * (0.85 + 0.15 * Math.sin(st.reloj / 90))).toFixed(3));
    var zoom = 1 + 0.06 * Math.sin(st.reloj / 400);
    ojoG.setAttribute("transform", "translate(" + Math.round(ancho * 0.2) + ",20) scale(" + zoom.toFixed(3) + ")");
  }

  function moverDardo(dt) {
    var sube = st.brilloEspadaObj > st.brilloEspada;
    st.brilloEspada += clamp(st.brilloEspadaObj - st.brilloEspada, -dt / 400, dt / 2600);
    if (!st.fuera && st.brilloEspada > 0.15 && st.puntaEspada && Math.random() < dt / (sube ? 90 : 60) * st.brilloEspada) {
      var q = st.puntaEspada;
      particula("voltio", q[0] + alAzar(-3, 3), q[1] + alAzar(-3, 3), alAzar(-0.02, 0.02), alAzar(-0.03, 0.01),
                alAzar(300, 600), alAzar(0.4, 0.8));
    }
  }
  function moverNuevos(dt) {
    moverDardo(dt);
    moverDragon(dt);
    fuegoTronco(dt);
    moverAnillo(dt);
    if (esc.tipo === "moria") {
      esc.brillo += clamp(esc.brilloObj - esc.brillo, -dt / 900, dt / 900);
      esc.abrir += clamp(esc.abrirObj - esc.abrir, -dt / 1400, dt / 1400);
      if (esc.brilloObj > 0 && esc.brillo < 1 && Math.random() < dt / 40) {
        var ang = alAzar(0, Math.PI), q = eP(MORIA_F + Math.cos(ang) * 6.6, 30 + Math.sin(ang) * 6.6);
        particula("escarcha", q[0], q[1], alAzar(-0.01, 0.01), alAzar(-0.02, 0.01), alAzar(400, 700), alAzar(0.4, 0.8));
      }
    }
  }
  function pintarNuevos() {
    var s = ESCALA;
    var t = "translate(" + esc.x0 + "," + st.suelo + ") scale(" + (esc.m * s) + "," + s + ")";
    [["moria", escMoria], ["cepillo", escCepillo], ["dragon", escDragon]].forEach(function (q) {
      var v = esc.tipo === q[0] ? esc.op : 0;
      q[1].setAttribute("transform", t);
      q[1].setAttribute("opacity", v);
      q[1].style.display = v > 0 ? "" : "none";
    });
    if (esc.tipo === "moria") pintarMoria();
    if (esc.tipo === "cepillo") pintarCepillo();
    if (esc.tipo === "dragon") pintarTroncoDragon();
    pintarDragon();
    pintarAnillo();
  }

  /* ---------- las rutinas ---------- */
  function golpeTalla() {
    esc.talla = Math.min(1, esc.talla + 1 / 14);
    if (!st.puntaTalla) return;
    for (var i = 0; i < 5; i++) {
      particula("astilla", st.puntaTalla[0], st.puntaTalla[1], st.mira * alAzar(-0.05, -0.01), alAzar(-0.06, 0), alAzar(400, 700), alAzar(0.25, 0.5));
    }
  }
  function rutinaMoria() {
    encolar(escena("moria"), pausa(600), ir("m_talla", 650), pausa(200));
    for (var i = 0; i < 14; i++) {
      encolar(ir("m_golpe", 110, "acel"), hacer(golpeTalla), pausa(90),
              ir("m_talla", 240), pausa(i % 4 === 3 ? 420 : 70));
    }
    encolar(ir("quieto", 500), pausa(600),
            ir("m_admira", 400), pausa(500),
            ir("m_habla", 500), pausa(400),
            hacer(function () { esc.brilloObj = 1; }), pausa(1500),
            ir("quieto", 400),
            hacer(function () { esc.abrirObj = 1; }), pausa(2200),
            ir("m_admira", 400), pausa(1500),
            hacer(function () { esc.abrirObj = 0; esc.brilloObj = 0; }), pausa(1700),
            escenaFuera, pausa(600), ir("quieto", 300));
  }

  function rutinaCepillo() {
    var dejar = hacer(function () { esc.cepilloBanco = true; fijar("c_suelta_m"); });
    var tomar = hacer(function () { esc.cepilloBanco = false; fijar("c_atras"); });
    encolar(escena("cepillo"), hacer(function () { esc.cepilloBanco = true; }), pausa(400),
            ir("c_suelta_m", 700), tomar, pausa(250));
    for (var i = 0; i < 6; i++) {
      encolar(ir("c_adelante", 820), pausa(120), ir("c_atras", 520), pausa(140));
      if (i === 1) encolar(ir("c_mira", 500), pausa(1000), ir("c_atras", 450), pausa(150));
      if (i === 3) {
        /* descansa: deja el cepillo en la tabla, se estira y lo retoma */
        encolar(dejar, ir("c_descansa", 600), pausa(500),
                ir("c_estira", 700), pausa(900), ir("c_descansa", 600), pausa(900),
                ir("c_suelta_m", 650), tomar, pausa(200));
      }
    }
    encolar(dejar, ir("quieto", 600), pausa(1600), escenaFuera, pausa(700));
  }

  function rutinaDragon() {
    var logX = function () { return logPx(LEÑO_D + 0.5, 0)[0]; };
    /* dónde se posa: al otro lado del tronco, mirando hacia él */
    var posada = function () { return logPx(LEÑO_D + LEÑO_DL + 8, 0)[0] - PATA_D[0] * DRAGON_S; };
    var pisoY = function () { return st.suelo - PATA_D[1] * DRAGON_S; };
    encolar(escena("dragon"), pausa(500),
            hacer(function () {
              st.dragon = { x: -20, y: st.suelo - 72, x0: -20, y0: st.suelo - 72, x1: -20, y1: st.suelo - 72,
                            t: 0, T: 0, cara: 1, fase: 0, alfa: 0, fuego: 0, soplando: 0, humo: 0,
                            posado: false, aterriza: false };
              /* llega volando hasta encima de donde se va a posar */
              dragonIr(posada(), st.suelo - 40, 1700);
            }),
            pausa(1700),
            ir("mira_arriba", 400),
            /* baja aleteando fuerte y se posa */
            hacer(function () { st.dragon.aterriza = true; dragonIr(posada(), pisoY(), 900); }),
            pausa(900),
            hacer(function () { st.dragon.posado = true; st.dragon.aterriza = false; }),
            ir("piedra_mira", 400), pausa(700),
            hacer(function () { st.dragon.fuego = 1500; st.dragon.soplando = 0; }),
            pausa(900),
            ir("susto", 200), pausa(800),
            ir("v_saca", 400), pausa(150),
            hacer(function () { st.chispas = true; st.hechizo = "agua"; }),
            ir("v_f1", 260), ir("v_f2", 260),
            hacer(function () { st.chispas = false; }),
            ir("v_carga", 320), pausa(200),
            ir("v_lanza", 130, "acel"),
            hacer(function () { disparar("agua", logX(), apagarTronco, logPx(LEÑO_DC, 3)[1]); }),
            pausa(900), ir("v_retro", 300), pausa(500),
            hacer(function () {
              st.dragon.humo = 900;
              st.dragon.posado = false;
              st.dragon.vete = true;
              /* a -40 seguía viéndose fuera del recuadro, flotando quieto
                 (él, 17/09): ahora sale de la pantalla y se desvanece */
              var izq = svg.getBoundingClientRect().left || 0;
              dragonIr(-izq - 80, st.suelo - 150, 2200);
            }),
            ir("v_guarda", 400), pausa(300), ir("quieto", 400),
            pausa(1600), hacer(function () { st.dragon = null; }),
            escenaFuera, pausa(600));
  }

  function rutinaAnillo() {
    var voltear = hacer(function () { st.mira = -st.mira; });
    encolar(hacer(ponerAnillo), pausa(1300),
            ir("piedra_mira", 500), pausa(900),
            ir("an_recoge", 650),
            hacer(function () { st.anillo.estado = "mano"; }),
            ir("quieto", 550), ir("an_mira", 450), pausa(1500),
            ir("an_pone", 400), pausa(250),
            hacer(function () { st.anillo.estado = "puesto"; st.opCuerpoObj = 0.16; st.ojoObj = 1; }),
            pausa(1000));
    for (var i = 0; i < 5; i++) encolar(ir("an_susto_a", 110), ir("an_susto_b", 110));
    encolar(pausa(300), ir("an_pone", 250),
            hacer(function () { st.anillo.estado = "mano"; st.opCuerpoObj = 1; st.ojoObj = 0; }),
            pausa(700), ir("an_mira", 350), pausa(700),
            ir("an_guarda", 450), hacer(function () { st.anillo = null; }), pausa(400),
            voltear, pausa(650), voltear, pausa(650),
            ir("quieto", 400), pausa(300));
  }

  /* ==============================================================
     FOGATA (guitarra), PÁJARO (lectura) y LA MATA (nueva) — 17/09
     ============================================================== */

  /* ---------- poses ---------- */
  /* sentado en el tronco junto al fuego: la cadera a la altura del
     tronco (8 u) y los pies en el suelo */
  POSES.g_sienta = pose({ tronco: 7, cabeza: -5, y: 12,
    hombroA: 42, codoA: 6, hombroB: -34, codoB: 12,
    caderaA: 95, rodillaA: 27, caderaB: 88, rodillaB: 20 });
  POSES.g_sienta2 = pose({ tronco: 10, cabeza: -2, y: 12,
    hombroA: 38, codoA: 10, hombroB: -30, codoB: 16,
    caderaA: 92, rodillaA: 24, caderaB: 85, rodillaB: 17 });
  /* la manguera: la agarra del grifo, la trae y riega */
  POSES.pl_toma = pose({ tronco: 4, cabeza: 6, hombroA: 150, codoA: 128,
    hombroB: -10, codoB: 10, objeto: "manguera", ang: 250 });
  POSES.pl_trae = pose({ tronco: -4, cabeza: -2, hombroA: 44, codoA: 60,
    hombroB: -12, codoB: 16, objeto: "manguera", ang: 120 });
  POSES.pl_riega = pose({ tronco: -4, cabeza: -6, hombroA: 78, codoA: 92,
    hombroB: -20, codoB: 18, objeto: "manguera", ang: 112,
    caderaA: 14, rodillaA: 6, caderaB: -14, rodillaB: -12, apoyo: true });
  POSES.pl_suelta = pose({ tronco: 12, cabeza: 12, hombroA: 120, codoA: 150,
    hombroB: 110, codoB: 160, caderaA: 14, rodillaA: 4, caderaB: -16, rodillaB: -18, apoyo: true });

  /* ---------- poses del café ----------
     Agachado en la gaveta, de pie en la hornilla, sirviendo y
     bebiendo. hx/hy de varias los calcula `medirCafe`. */
  /* DE RODILLA (él, 17/09): la pierna de adelante en escuadra, con el
     pie plano; la de atrás con la rodilla en el piso y la pierna hacia
     atrás. Muslo y pierna miden lo mismo, así que la cadera queda a
     un muslo del suelo. */
  var PIE_RODILLA = { caderaA: 90, rodillaA: 0, caderaB: 4, rodillaB: -95, y: H.pierna };
  /* Sin saltos de manos (él, 17/09): agarra el tirador, lo sigue al
     abrir, mete la mano, y la pieza aparece JUSTO en esa mano (las
     poses "_m" y "_bajo" tienen la mano en el mismo punto). Las
     manos las fija `medirCafe`. */
  POSES.c_agacha = pose(mezcla(PIE_RODILLA, { tronco: -22, cabeza: -12, objeto: "manos", ik: 1, ikA: 1 }));
  POSES.c_tira = pose(mezcla(PIE_RODILLA, { tronco: -22, cabeza: -12, objeto: "manos", ik: 1, ikA: 1 }));
  POSES.c_mete = pose(mezcla(PIE_RODILLA, { tronco: -24, cabeza: -16, objeto: "manos", ikA: 1 }));
  POSES.c_saca_bajo = pose(mezcla(PIE_RODILLA, { tronco: -24, cabeza: -16, objeto: "moka", ikA: 1, ang: 180 }));
  POSES.c_saca = pose(mezcla(PIE_RODILLA, { tronco: -16, cabeza: -10, objeto: "moka", ikA: 1, ang: 180 }));
  POSES.c_saca_taza_bajo = pose(mezcla(PIE_RODILLA, { tronco: -24, cabeza: -16, objeto: "taza", ikA: 1, ang: 180 }));
  POSES.c_saca_taza = pose(mezcla(PIE_RODILLA, { tronco: -16, cabeza: -10, objeto: "taza", ikA: 1, ang: 180 }));
  POSES.c_lleva = pose({ tronco: -4, cabeza: -6, objeto: "moka", ikA: 1, ang: 180 });
  POSES.c_lleva_taza = pose({ tronco: -4, cabeza: -6, objeto: "taza", ikA: 1, ang: 180 });
  POSES.c_pone = pose({ tronco: -12, cabeza: -10, objeto: "moka", ikA: 1, ang: 180 });
  POSES.c_pone_m = pose({ tronco: -12, cabeza: -10, objeto: "manos", ikA: 1 });
  POSES.c_perilla = pose({ tronco: -20, cabeza: -14, objeto: "manos", ik: 1, ikA: 1 });
  /* OJO: "c_mira" ya es del cepillo; con el mismo nombre la pisaba y
     el cepillo desaparecía al mirar la tabla */
  POSES.c_mira_moka = pose({ tronco: 0, cabeza: -6, hombroA: 22, codoA: -34, hombroB: -22, codoB: 34 });
  POSES.c_sirve = pose({ tronco: -10, cabeza: -10, objeto: "moka", ikA: 1 });
  POSES.c_deja_taza = pose({ tronco: -24, cabeza: -14, objeto: "taza", ikA: 1 });
  POSES.c_deja_taza_m = pose({ tronco: -24, cabeza: -14, objeto: "manos", ikA: 1 });
  /* la taza en la mano, y el sorbo */
  POSES.c_taza_arriba = pose({ tronco: 2, cabeza: 2, objeto: "taza", ikA: 1, hx: 6, hy: 6, ang: 180 });
  POSES.c_bebe = pose({ tronco: 6, cabeza: 12, objeto: "taza", ikA: 1, hx: 3.4, hy: -1.4, ang: 138 });

  /* ---------- la fogata y el tronco de sentarse ---------- */
  /* más lejos (él, 17/09/2026): sentado, los pies quedaban en el fuego */
  var FOGATA_F = 44, TRONCO_F = 17;
  var escFogata = el("g", { opacity: 0 }, capaFondo);
  (function construirFogata() {
    var g = escFogata;
    /* el tronco donde se sienta: cilindro tumbado */
    el("rect", { x: TRONCO_F - 5, y: -8, width: 10, height: 8, rx: 4, "class": "monigote__corteza" }, g);
    el("ellipse", { cx: TRONCO_F - 5, cy: -4, rx: 1.4, ry: 4, "class": "monigote__testa" }, g);
    el("ellipse", { cx: TRONCO_F - 4.9, cy: -4, rx: 0.6, ry: 1.9, "class": "monigote__anillo" }, g);
    /* piedras alrededor del fuego */
    [-6, -3, 0.5, 4, 6.5].forEach(function (dx, i) {
      el("ellipse", { cx: FOGATA_F + dx, cy: -1.1, rx: 1.9, ry: 1.2 + (i % 2) * 0.3, "class": "monigote__piedra-fuego" }, g);
    });
    /* leños cruzados */
    el("rect", { x: FOGATA_F - 5, y: -3.4, width: 10, height: 1.8, rx: 0.9,
      transform: "rotate(-12 " + FOGATA_F + " -2.5)", "class": "monigote__corteza" }, g);
    el("rect", { x: FOGATA_F - 5, y: -3.4, width: 10, height: 1.8, rx: 0.9,
      transform: "rotate(14 " + FOGATA_F + " -2.5)", "class": "monigote__corteza" }, g);
  })();
  degradado("radialGradient", "mon-brasa",
    [["0", "#FFD98A", .55], [".5", "#FF8A2A", .3], ["1", "#FF6A1A", 0]]);
  var resplandor = el("ellipse", { rx: 13, ry: 9, fill: "url(#mon-brasa)", opacity: 0 }, capaEfectos);
  function llamas(dt) {
    if (esc.tipo !== "fogata" || !(esc.op > 0.2)) return;
    var n = dt / 26;
    while (n > 0) {
      if (Math.random() < n) {
        var q = eP(FOGATA_F + alAzar(-3.4, 3.4), alAzar(1.5, 3));
        particula("fuego", q[0], q[1], alAzar(-0.012, 0.012), alAzar(-0.075, -0.035),
                  alAzar(320, 620), alAzar(0.9, 2));
        if (Math.random() < 0.12) particula("brasa", q[0], q[1], alAzar(-0.02, 0.02), alAzar(-0.09, -0.05), alAzar(600, 900), 0.45);
      }
      n -= 1;
    }
  }
  function pintarFogata(v) {
    if (!(v > 0)) { resplandor.setAttribute("opacity", 0); return; }
    var q = eP(FOGATA_F, 2);
    resplandor.setAttribute("opacity", (v * (0.75 + 0.25 * Math.sin(st.reloj / 180))).toFixed(3));
    resplandor.setAttribute("cx", q[0]); resplandor.setAttribute("cy", q[1]);
  }

  /* ---------- el pájaro del árbol ----------
     Aparece unos segundos después del libro, se posa en una rama y se
     va al final. Casi siempre azul; a veces de otro color (él). */
  var PLUMAS = ["#3E7BD8", "#3E7BD8", "#3E7BD8", "#D8B23E", "#D8503E", "#4EA35A", "#8E5AD8"];
  var PAJARO_S = ESCALA * 0.95;
  var pajaroG = el("g", { opacity: 0 }, capaEfectos);
  var pajaroCuerpo = el("ellipse", { cx: 0, cy: 0, rx: 2.7, ry: 1.9, "class": "monigote__pajaro" }, pajaroG);
  var pajaroCola = el("path", { d: "M -2.4,-0.3 L -5.4,-1.4 L -5,0.6 Z", "class": "monigote__pajaro" }, pajaroG);
  var pajaroCabeza = el("circle", { cx: 2.1, cy: -1.5, r: 1.4, "class": "monigote__pajaro" }, pajaroG);
  el("path", { d: "M 3.3,-1.5 L 5,-1.1 L 3.3,-0.7 Z", "class": "monigote__pajaro-pico" }, pajaroG);
  el("circle", { cx: 2.6, cy: -1.9, r: 0.3, "class": "monigote__pajaro-ojo" }, pajaroG);
  var pajaroAla = el("path", { d: "M -0.6,-0.9 L 1.4,-0.2 L -1.8,1 Z", "class": "monigote__pajaro-ala" }, pajaroG);
  function ponerPajaro() {
    var color = PLUMAS[Math.floor(Math.random() * PLUMAS.length)];
    var rama = eP(-22.8, 55.2);          /* una rama de la copa, ya escalada */
    st.pajaro = { x: st.suelo, y: 0, x0: 6, y0: st.suelo - 78, x1: rama[0], y1: rama[1],
                  t: 0, T: 1600, color: color, cara: 1, fase: 0, alfa: 0, posado: false };
    st.pajaro.x = st.pajaro.x0; st.pajaro.y = st.pajaro.y0;
  }
  function pajaroSeVa() {
    if (!st.pajaro) return;
    var q = st.pajaro;
    q.x0 = q.x; q.y0 = q.y; q.x1 = ancho + 30; q.y1 = st.suelo - 90; q.t = 0; q.T = 1800; q.posado = false; q.cara = 1;
  }
  function moverPajaro(dt) {
    var q = st.pajaro;
    if (!q) return;
    q.alfa = Math.min(1, q.alfa + dt / 300);
    if (q.t < q.T) {
      q.t += dt;
      var u = suaveStep(q.t / q.T);
      q.x = lerp(q.x0, q.x1, u);
      q.y = lerp(q.y0, q.y1, u) - 10 * Math.sin(Math.PI * u);
      q.fase += dt / 55;
      q.cara = q.x1 > q.x0 ? 1 : -1;
      if (q.t >= q.T) q.posado = q.x1 < ancho;
      if (q.t >= q.T && !q.posado) st.pajaro = null;
    } else if (q.posado) {
      /* posado: da saltitos y mira a los lados */
      q.fase = 0;
      if (Math.random() < dt / 2600) q.cara = -q.cara;
      if (Math.random() < dt / 3200) q.salto = 240;
      if (q.salto > 0) { q.salto -= dt; q.y = q.y1 - 2.4 * Math.sin(Math.PI * (1 - q.salto / 240)); }
      else q.y = q.y1;
    }
  }
  function pintarPajaro() {
    var q = st.pajaro;
    if (!q) { pajaroG.setAttribute("opacity", 0); return; }
    pajaroG.setAttribute("opacity", q.alfa);
    pajaroG.setAttribute("transform", "translate(" + q.x.toFixed(2) + "," + q.y.toFixed(2) + ") scale(" +
      (q.cara * PAJARO_S).toFixed(3) + "," + PAJARO_S.toFixed(3) + ")");
    [pajaroCuerpo, pajaroCola, pajaroCabeza].forEach(function (e) { e.style.fill = q.color; });
    pajaroAla.style.fill = q.color;
    var bate = q.posado ? 1 : 0.2 + 0.8 * Math.abs(Math.cos(q.fase));
    pajaroAla.setAttribute("transform", "translate(0,-0.9) scale(1," + bate.toFixed(3) + ") translate(0,0.9)");
  }

  /* ---------- la mata, la maceta y la manguera ----------
     La maceta a la izquierda; el grifo, en la pared de la derecha. La
     mata crece un poco y luego se dispara hasta salirse por arriba. */
  /* MATA_F más a la izquierda y RIEGO_F más lejos de la maceta (él,
     17/09/2026): que tenga que caminar más y no riegue pegado */
  var MATA_F = 62, RIEGO_F = MATA_F - 40, GRIFO_F = -34, GRIFO_H = 17;
  var escPlanta = el("g", { opacity: 0 }, capaFondo);
  (function construirPlanta() {
    var g = escPlanta;
    /* pared y grifo de la derecha */
    L(g, GRIFO_F - 3, 0, GRIFO_F - 3, -44, "monigote__pared");
    el("rect", { x: GRIFO_F - 3, y: -GRIFO_H - 1.6, width: 2.4, height: 3.2, rx: 0.4, "class": "monigote__grifo" }, g);
    el("path", { "class": "monigote__grifo", d: "M " + (GRIFO_F - 0.6) + "," + (-GRIFO_H - 0.9) +
      " h 1.8 v 1.8 h -1.8 Z" }, g);
    el("circle", { cx: GRIFO_F - 1.8, cy: -GRIFO_H - 2.6, r: 1, "class": "monigote__grifo" }, g);
    /* maceta de barro, ancha: que quepa un tallo gordo */
    el("path", { "class": "monigote__maceta", d: "M " + (MATA_F - 6.8) + ",-7 L " + (MATA_F + 6.8) +
      ",-7 L " + (MATA_F + 5) + ",0 L " + (MATA_F - 5) + ",0 Z" }, g);
    el("rect", { x: MATA_F - 7.6, y: -8.6, width: 15.2, height: 2, rx: 0.5, "class": "monigote__maceta" }, g);
    el("ellipse", { cx: MATA_F, cy: -7.1, rx: 6.2, ry: 0.8, "class": "monigote__tierra" }, g);
  })();
  /* la mata: se dibuja en píxeles cada fotograma, sin estirarla con
     scale (las hojas salían aplastadas). Crecida del todo, la punta
     llega justo al borde de abajo del encabezado. */
  var mataG = el("g", { opacity: 0 }, capaFondo);
  var talloEl = el("path", { "class": "monigote__tallo" }, mataG);
  var hojasMata = [];
  for (var hm = 0; hm < 30; hm++) hojasMata.push(el("ellipse", { "class": "monigote__hoja-mata" }, mataG));
  var cabeceraEl = document.getElementById("cabecera") || document.querySelector("header");
  function altoMaximoMata(baseY) {
    var r = svg.getBoundingClientRect(), c = cabeceraEl && cabeceraEl.getBoundingClientRect();
    var h = c && r.height ? r.top + baseY - c.bottom + 2 : 260;
    return Math.max(120, Math.min(h, window.innerHeight || h));
  }
  function pintarMata(v) {
    if (!(v > 0)) { mataG.setAttribute("opacity", 0); return; }
    var k = esc.crece, m = esc.m;
    var base = eP(MATA_F, 7.1);
    var H = 6 + (altoMaximoMata(base[1]) - 6) * Math.pow(k, 1.6);
    var vaiven = 1.2 + 5 * k;
    mataG.setAttribute("opacity", v);
    mataG.setAttribute("transform", "translate(" + base[0].toFixed(2) + "," + base[1].toFixed(2) + ")");
    /* el tallo: una S suave que engorda al crecer */
    function xEn(t) { return m * vaiven * Math.sin(t * Math.PI * 2.3) * (0.3 + 0.7 * t); }
    var d = "";
    for (var n = 0; n <= 24; n++) {
      var t = n / 24;
      d += (n ? " L " : "M ") + xEn(t).toFixed(2) + "," + (-t * H).toFixed(2);
    }
    talloEl.setAttribute("d", d);
    talloEl.style.strokeWidth = (1 + 3.4 * k).toFixed(2);
    /* hojas alternas a lo largo del tallo, más grandes abajo */
    var paso = 9 + 8 * k, cuantas = Math.min(hojasMata.length, Math.max(2, Math.floor(H / paso)));
    hojasMata.forEach(function (e, i) {
      if (i >= cuantas) { e.style.display = "none"; return; }
      var t = cuantas < 2 ? 1 : 0.14 + 0.86 * i / (cuantas - 1);
      var lado = i % 2 ? 1 : -1, largo = (2.2 + 5 * k) * (1.15 - 0.45 * t);
      var x = xEn(t), y = -t * H;
      var cx = x + m * lado * largo * 0.85;
      e.style.display = "";
      e.setAttribute("cx", cx.toFixed(2)); e.setAttribute("cy", y.toFixed(2));
      e.setAttribute("rx", largo.toFixed(2)); e.setAttribute("ry", (largo * 0.48).toFixed(2));
      e.setAttribute("transform", "rotate(" + (m * lado * -26) + " " + cx.toFixed(2) + " " + y.toFixed(2) + ")");
    });
  }
  /* la manguera: del grifo a la boquilla, con su panza */
  var mangueraEl = el("path", { "class": "monigote__manguera", opacity: 0 }, capaFrente);
  var boquillaG = el("g", {}, cuerpo);
  el("rect", { "class": "monigote__boquilla", x: -1.2, y: -0.75, width: 5.4, height: 1.5, rx: 0.5 }, boquillaG);
  el("path", { "class": "monigote__boquilla-punta", d: "M 4.2,-0.6 L 6.6,-0.25 L 6.6,0.25 L 4.2,0.6 Z" }, boquillaG);
  el("rect", { "class": "monigote__manguera-cuello", x: -3.4, y: -0.55, width: 2.4, height: 1.1, rx: 0.4 }, boquillaG);
  /* se registra AQUÍ: las tablas de objetos y de nodos se crean antes
     que este grupo, así que allá arriba todavía valía `undefined` */
  OBJETOS.manguera = boquillaG;
  NODOS.manguera = boquillaG;
  function pintarManguera(v) {
    var fin = st.boquilla || (esc.mangueraSuelta ? eP(RIEGO_F + 2, 1.5) : null);
    if (!(v > 0) || !fin) { mangueraEl.setAttribute("opacity", 0); return; }
    var ini = eP(GRIFO_F + 0.6, GRIFO_H);
    var panza = Math.min(st.suelo - 2, Math.max(ini[1], fin[1]) + 16);
    mangueraEl.setAttribute("opacity", v);
    mangueraEl.setAttribute("d", "M " + ini[0].toFixed(1) + "," + ini[1].toFixed(1) +
      " Q " + ((ini[0] + fin[0]) / 2).toFixed(1) + "," + panza.toFixed(1) +
      " " + fin[0].toFixed(1) + "," + fin[1].toFixed(1));
  }
  function regar(dt) {
    if (!st.regando || !st.boquillaPunta) return;
    /* el agua sale POR DONDE APUNTA la boquilla (antes salía hacia la
       mata y se veía doblada); la rapidez se calcula para que la
       parábola caiga justo en la tierra de la maceta */
    var q = st.boquillaPunta, b = st.boquilla;
    var ux = q[0] - b[0], uy = q[1] - b[1], lu = Math.sqrt(ux * ux + uy * uy) || 1;
    ux /= lu; uy /= lu;
    var n = dt / 16;
    while (n > 0) {
      if (Math.random() < n) {
        var blanco = eP(MATA_F + alAzar(-3.5, 3.5), 7.1);
        var dx = blanco[0] - q[0], dy = blanco[1] - q[1];
        var baja = ux ? dy - uy / ux * dx : -1;
        if (ux * dx > 0 && baja > 0) {
          var vel = Math.abs(dx / ux) * Math.sqrt(CAE.gota / (2 * baja));
          var vuelo = Math.abs(dx / (ux * vel));
          particula("gota", q[0], q[1], ux * vel, uy * vel, vuelo, alAzar(0.45, 0.7));
          st.parts[st.parts.length - 1].riego = true;
        }
      }
      n -= 1;
    }
  }

  function moverVerde(dt) {
    llamas(dt);
    moverPajaro(dt);
    regar(dt);
    esc.crece += clamp(esc.creceObj - esc.crece, -dt / 600, dt / (esc.creceObj > 0.4 ? 800 : 1500));
  }
  function pintarVerde() {
    var t = "translate(" + esc.x0 + "," + st.suelo + ") scale(" + (esc.m * ESCALA) + "," + ESCALA + ")";
    [["fogata", escFogata], ["planta", escPlanta]].forEach(function (q) {
      var v = esc.tipo === q[0] ? esc.op : 0;
      q[1].setAttribute("transform", t);
      q[1].setAttribute("opacity", v);
      q[1].style.display = v > 0 ? "" : "none";
    });
    pintarFogata(esc.tipo === "fogata" ? esc.op : 0);
    pintarMata(esc.tipo === "planta" ? esc.op : 0);
    pintarManguera(esc.tipo === "planta" ? esc.op : 0);
    pintarPajaro();
  }

  /* ---------- el café ----------
     Un gabinete bajo con encimera, una hornilla encima y una gaveta
     abajo. La cafetera y la taza salen de la gaveta. */
  var GAB = { f0: 6, f1: 28, alto: 20 }, ENC_H = 21.8;
  var HORNILLA_F = 11, TAZA_F = 20, PERILLA = [7.2, 16.8];
  var escCafe = el("g", { opacity: 0 }, capaFondo);
  var gavetaG = el("g", {}, escCafe);
  (function construirCocina() {
    var g = escCafe;
    el("rect", { x: GAB.f0, y: -GAB.alto, width: GAB.f1 - GAB.f0, height: GAB.alto, "class": "monigote__gabinete" }, g);
    /* encimera */
    el("rect", { x: GAB.f0 - 1.4, y: -ENC_H, width: GAB.f1 - GAB.f0 + 3, height: 1.8, rx: 0.3, "class": "monigote__encimera" }, g);
    /* zócalo */
    el("rect", { x: GAB.f0 + 1, y: -2.2, width: GAB.f1 - GAB.f0 - 2, height: 2.2, "class": "monigote__zocalo" }, g);
    /* puerta de al lado y perilla del fuego */
    el("rect", { x: GAB.f0 + 12, y: -17.6, width: 14, height: 15, rx: 0.4, "class": "monigote__gabinete-puerta" }, g);
    el("circle", { cx: PERILLA[0], cy: -PERILLA[1], r: 1.5, "class": "monigote__perilla" }, g);
    L(g, PERILLA[0], -PERILLA[1], PERILLA[0] + 0.2, -PERILLA[1] - 1.3, "monigote__perilla-raya");
    /* la hornilla, sobre la encimera */
    el("ellipse", { cx: HORNILLA_F, cy: -ENC_H - 0.6, rx: 4.4, ry: 1.1, "class": "monigote__hornilla" }, g);
    el("ellipse", { cx: HORNILLA_F, cy: -ENC_H - 1.1, rx: 3.1, ry: 0.8, "class": "monigote__hornilla-aro" }, g);
    [-3.4, 0, 3.4].forEach(function (dx) {
      L(g, HORNILLA_F + dx, -ENC_H - 1.6, HORNILLA_F + dx * 0.7, -ENC_H - 0.2, "monigote__hornilla-parrilla");
    });
  })();
  /* la gaveta, que sale hacia él */
  el("rect", { x: GAB.f0 + 0.6, y: -17.4, width: 11, height: 6.4, rx: 0.5, "class": "monigote__gaveta" }, gavetaG);
  el("rect", { x: GAB.f0 + 2.6, y: -14.6, width: 7, height: 1, rx: 0.5, "class": "monigote__tirador" }, gavetaG);
  /* la gaveta, al final: si no, el frente del gabinete la tapa */
  escCafe.appendChild(gavetaG);
  /* DETRÁS del muñeco (él, 17/09/2026): nada debe taparlo */
  var mokaProp = hacerMoka(dinFondo), tazaProp = hacerTaza(dinFondo);
  var cepilloBancoEl = dinFondo.appendChild(cepilloG.cloneNode(true));
  cepilloBancoEl.style.display = "none";
  /* las piezas que lleva en la mano, y su sitio en las tablas (se
     registran AQUÍ: arriba las tablas todavía no existen) */
  var mokaG = hacerMoka(cuerpo), tazaG = hacerTaza(cuerpo);
  OBJETOS.moka = mokaG; OBJETOS.taza = tazaG;
  NODOS.moka = mokaG; NODOS.taza = tazaG;
  ORDEN.moka = ["brazoB", "antebrazoB", "cabeza", "brazoA", "antebrazoA", "moka"];
  ORDEN.taza = ["brazoB", "antebrazoB", "cabeza", "brazoA", "antebrazoA", "taza"];

  function medirCafe() {
    /* la mano va donde tiene que quedar la pieza (base + asa) */
    function manoPara(nombre, base, ang, tipo) {
      var q = POSES[nombre], c = cuelloDe(q), u = dir(ang), v = perp(u);
      var alto = tipo === "moka" ? 3.6 : 2.2, lado = tipo === "moka" ? 3.4 : 2.6;
      var mano = mas(mas(base, u, alto), v, -lado);
      q.hx = mano[0] - c[0];
      q.hy = c[1] - mano[1];
      q.ang = ang;
    }
    CAFE.base = [HORNILLA_F, ENC_H + 1.3];
    CAFE.taza = [TAZA_F, ENC_H + 0.2];
    manoPara("c_pone", CAFE.base, 180, "moka");
    /* sirviendo: el PICO justo encima del centro de la taza */
    var us = dir(118), vs = perp(us);
    CAFE.pico = [CAFE.taza[0], CAFE.taza[1] + 3.9 + 2.6];
    manoPara("c_sirve", mas(mas(CAFE.pico, us, -8.4), vs, -3.9), 118, "moka");
    manoPara("c_deja_taza", CAFE.taza, 180, "taza");
    /* la mano A en el punto H. Con "manos", A = B + 1 (dx = 1); con
       una pieza, la mano A es el propio hx/hy (dx = 0) */
    function manoEn(nombre, H, dx) {
      var q = POSES[nombre], c = cuelloDe(q);
      q.hx = H[0] - dx - c[0];
      q.hy = c[1] - H[1];
    }
    function manoDe(nombre) {
      var q = POSES[nombre], c = cuelloDe(q);
      return [c[0] + q.hx, c[1] - q.hy];
    }
    /* el tirador: cerrado y abierto (la gaveta sale 7 hacia él) */
    var tirador = [GAB.f0 + 6.1, 14.1];
    manoEn("c_agacha", tirador, 0.5);
    manoEn("c_tira", [tirador[0] - 7, tirador[1]], 0.5);
    var adentro = [7, 12.8];
    manoEn("c_mete", adentro, 1);
    manoEn("c_saca_bajo", adentro, 0);
    manoEn("c_saca_taza_bajo", adentro, 0);
    manoEn("c_saca", [8, 19], 0);
    manoEn("c_saca_taza", [8, 19], 0);
    manoEn("c_lleva", [9, 27], 0);
    manoEn("c_lleva_taza", [9, 27], 0);
    /* soltar o agarrar: la misma mano, sin la pieza */
    manoEn("c_pone_m", manoDe("c_pone"), 1);
    manoEn("c_deja_taza_m", manoDe("c_deja_taza"), 1);
    manoEn("c_perilla", PERILLA, 0.5);
  }
  var CAFE = {};
  medirCafe();

  /* llama, vapor y el chorro de café */
  function cocinar(dt) {
    if (esc.tipo !== "cafe" || !(esc.op > 0.2)) return;
    esc.gavetaV = (esc.gavetaV || 0) + clamp(esc.gaveta - (esc.gavetaV || 0), -dt / 450, dt / 450);
    if (esc.llama) {
      var n = dt / 30;
      while (n > 0) {
        if (Math.random() < n) {
          var q = eP(HORNILLA_F + alAzar(-2.6, 2.6), ENC_H + alAzar(0.2, 1.1));
          particula(Math.random() < 0.35 ? "voltio" : "fuego", q[0], q[1],
                    alAzar(-0.008, 0.008), alAzar(-0.05, -0.02), alAzar(180, 320), alAzar(0.5, 1.1));
        }
        n -= 1;
      }
    }
    if (esc.vapor && Math.random() < dt / 120) {
      var v = eP(HORNILLA_F + 3.4, ENC_H + 8.9);
      particula("vapor", v[0] + alAzar(-1, 1), v[1], alAzar(-0.008, 0.008), alAzar(-0.035, -0.015),
                alAzar(900, 1400), alAzar(0.5, 1));
    }
    if (esc.sirviendo && st.picoMoka) {
      /* el chorro cae VERTICAL (él, 17/09) y muere al llegar al café */
      var fondo = eP(CAFE.taza[0], CAFE.taza[1] + 1.2 + 2.2 * esc.cafe)[1];
      var caida = Math.max(0.5, fondo - st.picoMoka[1]), v0 = 0.02;
      var vuelo = (-v0 + Math.sqrt(v0 * v0 + 2 * CAE.cafe * caida)) / CAE.cafe;
      var k = dt / 14;
      while (k > 0) {
        if (Math.random() < k) {
          particula("cafe", st.picoMoka[0] + alAzar(-0.15, 0.15), st.picoMoka[1], 0, v0,
                    vuelo, alAzar(0.4, 0.6));
          st.parts[st.parts.length - 1].riego = true;
        }
        k -= 1;
      }
      esc.cafe = Math.min(1, esc.cafe + dt / 2000);
    }
  }
  function pintarCafe(v) {
    gavetaG.setAttribute("transform", "translate(" + (-7 * (esc.gavetaV || 0)).toFixed(2) + ",0)");
    var enMesa = esc.moka === "hornilla" && v > 0;
    mokaProp.style.display = enMesa ? "" : "none";
    if (enMesa) {
      mokaProp.setAttribute("opacity", v);
      tfPx(mokaProp, eP(CAFE.base[0], CAFE.base[1]), [0, -1], esc.m);
    }
    var enEncimera = esc.taza === "encimera" && v > 0;
    tazaProp.style.display = enEncimera ? "" : "none";
    if (enEncimera) {
      tazaProp.setAttribute("opacity", v);
      tfPx(tazaProp, eP(CAFE.taza[0], CAFE.taza[1]), [0, -1], esc.m);
      tazaProp.__cafe.setAttribute("opacity", esc.cafe > 0.05 ? 1 : 0);
    }
  }

  /* ---------- la rutina del café ---------- */
  function rutinaCafe() {
    encolar(escena("cafe"), pausa(700),
            /* saca la cafetera de la gaveta */
            ir("c_agacha", 700), pausa(150),
            hacer(function () { esc.gaveta = 1; }), ir("c_tira", 450), pausa(150),
            ir("c_mete", 350), hacer(function () { fijar("c_saca_bajo"); }), pausa(120),
            ir("c_saca", 420),
            hacer(function () { esc.gaveta = 0; }),
            ir("c_lleva", 550), pausa(150),
            /* la pone en la hornilla y prende la llama */
            ir("c_pone", 700), pausa(200),
            hacer(function () { esc.moka = "hornilla"; fijar("c_pone_m"); }),
            ir("c_perilla", 600),
            hacer(function () { esc.llama = true; }), pausa(400),
            ir("c_mira_moka", 550), pausa(5000),
            /* sale vapor por el pico */
            hacer(function () { esc.vapor = true; }), pausa(2000),
            /* y apaga */
            ir("c_perilla", 550),
            hacer(function () { esc.llama = false; }), pausa(500),
            /* saca la taza, la pone en la encimera */
            ir("c_agacha", 650), pausa(120),
            hacer(function () { esc.gaveta = 1; }), ir("c_tira", 450), pausa(150),
            ir("c_mete", 350), hacer(function () { fijar("c_saca_taza_bajo"); }), pausa(120),
            ir("c_saca_taza", 420),
            hacer(function () { esc.gaveta = 0; }),
            ir("c_lleva_taza", 500),
            ir("c_deja_taza", 620),
            hacer(function () { esc.taza = "encimera"; fijar("c_deja_taza_m"); }),
            pausa(300),
            /* agarra la cafetera y sirve */
            ir("c_pone_m", 620),
            hacer(function () { esc.moka = null; fijar("c_pone"); }),
            ir("c_sirve", 700),
            hacer(function () { esc.sirviendo = true; }), pausa(2300),
            hacer(function () { esc.sirviendo = false; esc.vapor = false; }),
            /* devuelve la cafetera a la hornilla */
            ir("c_pone", 650),
            hacer(function () { esc.moka = "hornilla"; fijar("c_pone_m"); }),
            /* agarra la taza y se la toma */
            ir("c_deja_taza_m", 600),
            hacer(function () { esc.taza = null; fijar("c_deja_taza"); }),
            ir("c_taza_arriba", 500));
    for (var i = 0; i < 4; i++) {
      encolar(ir("c_bebe", 650), pausa(700), ir("c_taza_arriba", 550), pausa(i === 3 ? 400 : 800));
    }
    encolar(ir("c_deja_taza", 600),
            hacer(function () { esc.taza = "encimera"; fijar("c_deja_taza_m"); }),
            ir("quieto", 550), pausa(900),
            escenaFuera, pausa(700));
  }

  /* ---------- la rutina de la mata ---------- */
  function rutinaPlanta() {
    encolar(escena("planta"), pausa(600),
            ir("piedra_mira", 500), pausa(900),
            /* corre a la pared de la derecha a por la manguera */
            andarA(function () { return eP(GRIFO_F + 9, 0)[0]; }, 0.12, true),
            ir("pl_toma", 480), pausa(350),
            /* la trae estirándola hasta la maceta */
            andarA(function () { return eP(RIEGO_F, 0)[0]; }, 0.05),
            ir("pl_riega", 520),
            hacer(function () { st.regando = true; }),
            pausa(4000),
            /* primero crece un poco... */
            hacer(function () { esc.creceObj = 0.16; }),
            pausa(1800),
            /* ...y de repente se dispara */
            hacer(function () { esc.creceObj = 1; }),
            pausa(500),
            hacer(function () {
              st.regando = false;
              esc.mangueraSuelta = true;
            }),
            ir("pl_suelta", 200, "frena"), pausa(1800),
            ir("quieto", 600), pausa(1400),
            escenaFuera, pausa(700),
            hacer(function () { esc.mangueraSuelta = false; }),
            /* vuelve a su sitio */
            andarA(function () { return casa; }, 0.05),
            hacer(function () { st.mira = -1; }), pausa(300));
  }

  /* ---------- el bucle ---------------------------------------- */
  var anterior = null;

  function paso(ahora) {
    requestAnimationFrame(paso);
    avanzarUno(ahora);
  }
  function avanzarUno(ahora) {
    if (anterior === null) anterior = ahora;
    var dt = clamp(ahora - anterior, 0, 64);
    anterior = ahora;
    st.reloj += dt;

    if (st.serie) {
      st.serie.e += dt;
      var Ts = st.serie.tiempos;
      if (st.serie.e >= Ts[Ts.length - 1]) {
        var finS = st.serie.lista[st.serie.lista.length - 1];
        st.serie = null;
        st.desde = st.hacia = finS;
        st.t = 1;
      }
    } else if (st.t < 1) st.t = Math.min(1, st.t + dt / st.dur);
    st.vibra = Math.max(0, st.vibra - dt / 260);

    /* el decorado: fundido, la pila que se repone, lo que cae */
    esc.op = esc.vis > esc.op ? Math.min(esc.vis, esc.op + dt / 450)
                              : Math.max(esc.vis, esc.op - dt / 450);
    if (esc.vis === 0 && esc.op === 0) esc.tipo = null;
    if (esc.bloque) esc.bloque.t += dt;
    esc.mitades.forEach(function (m) { m.edad += dt; });
    moverFlechas(dt);
    if (esc.mitades.length && esc.mitades[0].edad > 3000) esc.mitades = [];

    if (st.modo === "andando" && corriendo) {
      st.x += corriendo.vel * dt * corriendo.sentido;
      st.ciclo += dt / (corriendo.corre ? 78 : 150) * (corriendo.atras ? -1 : 1);
      var llego = corriendo.sentido < 0 ? st.x <= corriendo.destino : st.x >= corriendo.destino;
      if (llego) {
        st.x = corriendo.destino;
        corriendo = null;
        st.modo = "quieto";
        /* vuelve a la pose que llevaba, desde donde quedaron las piernas */
        var fin = st.hacia;
        st.desde = copia(st.ultimo); st.hacia = fin; st.t = 0; st.dur = 260; st.curva = "suave";
      }
    }
    /* nunca sale de la tarjeta, salvo cuando huye */
    if (!st.fuera) {
      if (st.x < MARGEN) st.x = MARGEN;
      if (st.x > ancho - MARGEN) st.x = ancho - MARGEN;
    }

    if (st.espera > 0) {
      st.espera -= dt;
    } else if (st.modo !== "andando" && st.t >= 1) {
      /* las funciones no gastan fotograma: se encadenan */
      while (st.guion.length && st.guion[0].que === "fn") st.guion.shift().f();
      if (st.guion.length && st.t >= 1) {
        var a = st.guion.shift();
        if (a.que === "espera") st.espera = a.ms;
        else if (a.que === "pose") irA(a.nombre, a.dur, a.curva);
        else if (a.que === "serie") empezarSerie(a.pasos);
        else if (a.que === "andar") {
          var destino = a.fx ? a.fx() : esc.x0 + esc.m * a.f * ESCALA;
          var sentido = destino < st.x ? -1 : 1;
          if (Math.abs(destino - st.x) > 0.5) {
            if (!a.atras) st.mira = sentido;
            corriendo = { sentido: sentido, destino: destino, atras: a.atras, corre: !!a.corre,
                          vel: a.vel, t0: st.reloj };
            st.modo = "andando";
          }
        }
      } else if (!st.guion.length && st.llegado) {
        rutinaOcio();
      }
    }

    efectos(dt);
    moverPiedra(dt);
    moverNuevos(dt);
    moverVerde(dt);
    cocinar(dt);
    var p = sobreponer(calcular(), ahora);
    st.ultimo = p;
    dibujar(p);
  }

  /* ---------- colocación -------------------------------------- */
  /* El viewBox se saca del TAMAÑO REAL del SVG, no de
     window.innerWidth: innerWidth incluye la barra de desplazamiento
     y el SVG no, y el dibujo salía escalado un 1,2 %. */
  function medir() {
    var r = svg.getBoundingClientRect();
    var an = Math.round(r.width) || 300;
    var al = Math.round(r.height) || 100;
    svg.setAttribute("viewBox", "0 0 " + an + " " + al);
    ancho = an;
    /* El piso es el borde de abajo del SVG (el marco de la tarjeta).
       Los pies tienen remate redondo de 2 px: se suben esos 2 px. */
    st.suelo = al - 2;
    st.y = st.suelo;
    /* Su sitio: al 72 % del ancho, pero con hueco a la izquierda para
       la pila de leña, que es lo que más se aleja. */
    var hueco = (HACHA.fp + 8) * ESCALA + MARGEN;
    casa = Math.min(an - MARGEN - 8, Math.max(Math.round(an * 0.72), Math.round(hueco)));
  }

  /* DÓNDE VIVE (él, 17/09/2026): en computadora sigue sobre la tarjeta
     de Instagram; en TELÉFONO se muda a la de WhatsApp, que es la
     primera que se ve al abrir Contacto —así se le ve sin bajar y el
     espaciado de los botones no cambia—. Si esa tarjeta no existe,
     cae en la de Instagram. */
  function tarjetaInstagram() {
    if (window.matchMedia("(max-width: 780px)").matches) {
      var w = document.querySelector('#contactos a[href*="wa.me"]');
      if (w) return w;
    }
    return document.querySelector('#contactos a[href*="instagram.com"]');
  }
  function empezar() {
    var tarjeta = tarjetaInstagram();
    if (!tarjeta) {
      if ((empezar.intentos = (empezar.intentos || 0) + 1) < 40) setTimeout(empezar, 100);
      return;
    }
    svg.setAttribute("class", "monigote monigote--tarjeta");
    tarjeta.classList.add("contactos__con-monigote");
    tarjeta.appendChild(svg);
    medir();
    st.x = casa;
    esc.x0 = casa;
    st.mira = -1;
    esc.m = -1;
    st.llegado = true;
    st.desde = st.hacia = POSES.quieto;
    st.t = 1;

    /* Un fotograma YA, sin esperar al primer requestAnimationFrame. */
    dibujar(calcular());

    sentarseADibujar();
    ratoDibujando();
    requestAnimationFrame(paso);
    vigilarTarjetas();
    vigilarVisibilidad();
  }

  /* CON LA PÁGINA EN SEGUNDO PLANO (él, 17/09): el navegador deja de
     llamar a requestAnimationFrame, así que la animación se congelaba
     y al volver retomaba donde la dejó. Mientras está oculta la mueve
     un temporizador; al volver, manda otra vez rAF. */
  var relojOculto = null;
  function vigilarVisibilidad() {
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (!relojOculto) relojOculto = setInterval(function () {
          avanzarUno((anterior || 0) + 64);
        }, 64);
      } else if (relojOculto) {
        clearInterval(relojOculto);
        relojOculto = null;
      }
    });
  }

  /* Al cambiar de idioma, sitio.js BORRA las tarjetas y las vuelve a
     crear, y el muñeco se iba con la tarjeta vieja (él, 17/09). Se
     vigila la lista y, si el SVG quedó fuera, se muda a la tarjeta
     nueva sin reiniciar nada: sigue con lo que estaba haciendo. */
  function vigilarTarjetas() {
    var host = document.getElementById("contactos");
    if (!host || !window.MutationObserver) return;
    new MutationObserver(function () {
      var tarjeta = tarjetaInstagram();
      if (!tarjeta || svg.parentNode === tarjeta) return;
      tarjeta.classList.add("contactos__con-monigote");
      tarjeta.appendChild(svg);
      var antes = casa;
      medir();
      st.x += casa - antes;
      esc.x0 += casa - antes;
      if (corriendo) corriendo.destino += casa - antes;
    }).observe(host, { childList: true });
  }

  /* Punto de inspección. `avanzar` permite comprobar la animación
     cuando rAF está parado (pasa si la pestaña no se está pintando).
     `hacer(nombre)` vacía el guion y lanza una rutina concreta. */
  /* las piezas sueltas del fondo, encima de los muebles de cada
     escena (que se crean después) pero todavía detrás del muñeco */
  capaFondo.appendChild(dinFondo);

  var RUTINAS = { cafe: rutinaCafe, planta: rutinaPlanta, moria: rutinaMoria, cepillo: rutinaCepillo, dragon: rutinaDragon, anillo: rutinaAnillo,
                  arco: rutinaArco, saludo: rutinaSaludo, estira: rutinaEstira, piedra: rutinaPiedra,
                  sentado: rutinaSentado, espada: rutinaEspada, guitarra: rutinaGuitarra, varita: rutinaVarita,
                  dibujo: rutinaDibujo, hacha: rutinaHacha };
  window.__monigote = {
    estado: st, escena: esc, poses: POSES, leña: HACHA,
    get ancho() { return ancho; },
    geom: geom,
    disparar: disparar,
    get ultimas() { return ultimas.slice(); },
    elegir: function () { return elegirActividad(); },
    /* la próxima actividad del ciclo (para probar) */
    forzar: function (n) { forzada = n; },
    avanzar: function (ms, salto) {
      salto = salto || 16;
      for (var i = 0; i < ms; i += salto) avanzarUno((anterior || 0) + salto);
    },
    hacer: function (nombre) {
      st.guion = []; st.espera = 0; corriendo = null; st.modo = "quieto";
      st.x = casa; st.mira = -1; esc.vis = 0; esc.op = 0; esc.tipo = null;
      st.musica = null; st.chispas = false; st.serie = null; st.lectura = null;
      st.vuelo = null; st.flechaCargada = false; st.flechaMano = false;
      st.brilloEspada = st.brilloEspadaObj = 0; st.tiembla = false; st.fuera = false;
      st.dragon = null; st.anillo = null; st.opCuerpo = st.opCuerpoObj = 1; st.ojo = st.ojoObj = 0;
      st.pajaro = null; st.regando = false; st.piedra = null;
      st.disfraz = nombre === "arco"; st.cuerdaEnMano = false; st.cuerdaVibra = 0;
      RUTINAS[nombre]();
    }
  };

  window.addEventListener("resize", function () {
    if (!svg.parentNode) return;
    var antes = casa;
    medir();
    st.x += casa - antes;
    esc.x0 += casa - antes;
    if (corriendo) corriendo.destino += casa - antes;
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", empezar);
  } else {
    empezar();
  }
})();
