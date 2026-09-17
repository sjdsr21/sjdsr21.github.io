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
      rotT: 90,                    /* tronco en la mano: 90 tumbado, 0 de pie */
      rasgueo: 0.5,                /* guitarra: 0 arriba de las cuerdas, 1 abajo */
      traste: 15,                  /* guitarra: dónde pisa la mano B */
      alza: 0,                     /* lápiz: 1 = levantado del papel */
      abierto: 0,                  /* libro: 0 cerrado, 1 abierto */
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
    /* estirarse: brazos al cielo, y luego doblarse hacia los pies */
    estira_arriba: pose({ tronco: 8, cabeza: 12, hombroA: 160, codoA: 148,
                          hombroB: 200, codoB: 212, caderaA: 2, rodillaA: 2,
                          caderaB: -2, rodillaB: -2 }),
    estira_puntas: pose({ tronco: -80, cabeza: -18, hombroA: 4, codoA: -4,
                          hombroB: 10, codoB: 2, caderaA: 2, rodillaA: 2,
                          caderaB: -2, rodillaB: -2 }),
    /* mirar a lo lejos: la mano de visera sobre la frente (los
       ángulos dejan la mano justo delante de la frente) */
    mira_lejos: pose({ tronco: -4, cabeza: 6, hombroA: 100, codoA: 206,
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
                   objeto: "libro", ang: 90, ik: 1, ikA: 1, hx: 9, hy: 11.5, abierto: 0 }),
    /* el libro apoyado en la rodilla, delante de la cara */
    l_lee: pose({ tronco: 12, cabeza: -14, y: 20,
                  caderaA: 128, rodillaA: 52, caderaB: 90, rodillaB: 90,
                  objeto: "libro", ang: 96, ik: 1, ikA: 1, hx: 11.2, hy: 6.1, abierto: 1 }),

    /* --- espada ---------------------------------------------- */
    desenvaina: pose({ tronco: -8, cabeza: -6, y: 2,
                       hombroA: 128, codoA: 60, hombroB: -26, codoB: 30,
                       caderaA: 20, rodillaA: 10, caderaB: -22, rodillaB: -14,
                       objeto: "espada", ang: 30 }),
    guardia: pose({ tronco: -10, cabeza: 4, y: 3,
                    hombroA: 150, codoA: 170, hombroB: -40, codoB: -80,
                    caderaA: 30, rodillaA: 16, caderaB: -30, rodillaB: -20,
                    objeto: "espada", ang: 186 }),
    tajo: pose({ tronco: 28, cabeza: -10, y: 6,
                 hombroA: 74, codoA: 88, hombroB: -70, codoB: -110,
                 caderaA: 46, rodillaA: 30, caderaB: -38, rodillaB: -52,
                 objeto: "espada", ang: 96 }),
    estocada: pose({ tronco: 20, cabeza: -4, y: 8,
                     hombroA: 88, codoA: 92, hombroB: -84, codoB: -60,
                     caderaA: 62, rodillaA: 40, caderaB: -44, rodillaB: -60,
                     objeto: "espada", ang: 92 }),
    envaina: pose({ tronco: -4, y: 1,
                    hombroA: 40, codoA: -20, hombroB: -24, codoB: 24,
                    objeto: "espada", ang: 20 }),

    /* --- esgrima encadenada (17/09) ---------------------------
       Estas poses no se usan sueltas: son puntos de paso de una
       `serie`, que las recorre con una curva continua sin frenar en
       cada una. El `ang` de la hoja se escribe SIN recortar a
       0..360, porque la serie interpola los números tal cual: de 220
       a -28 la hoja baja por delante y sigue hacia atrás; poner 332
       la haría girar por arriba. */
    s_alta: pose(mezcla(PIE.guardia, { tronco: 6, cabeza: 4,
                 hombroA: 165, codoA: 200, hombroB: -40, codoB: -70, objeto: "espada", ang: 220 })),
    s_corte: pose(mezcla(PIE.lance, { tronco: -14, cabeza: -6,
                 hombroA: 110, codoA: 100, hombroB: -60, codoB: -95, objeto: "espada", ang: 112 })),
    s_sigue: pose(mezcla(PIE.bajo, { tronco: -28, cabeza: -10,
                 hombroA: 42, codoA: 14, hombroB: -72, codoB: -110, objeto: "espada", ang: -28 })),
    s_subeM: pose(mezcla(PIE.lance, { tronco: -12, cabeza: -4,
                 hombroA: 78, codoA: 64, hombroB: -50, codoB: -80, objeto: "espada", ang: 62 })),
    s_subeF: pose(mezcla(PIE.recogido, { tronco: 8, cabeza: 6,
                 hombroA: 150, codoA: 150, hombroB: -30, codoB: -50, objeto: "espada", ang: 168 })),
    s_atras: pose(mezcla(PIE.guardia, { tronco: 10, cabeza: 6,
                 hombroA: 172, codoA: 236, hombroB: 30, codoB: 10, objeto: "espada", ang: 258 })),
    s_corte2: pose(mezcla(PIE.lance, { tronco: -18, cabeza: -6,
                 hombroA: 96, codoA: 78, hombroB: -64, codoB: -100, objeto: "espada", ang: 84 })),
    s_sigue2: pose(mezcla(PIE.bajo, { tronco: -24, cabeza: -8,
                 hombroA: 20, codoA: -24, hombroB: -70, codoB: -104, objeto: "espada", ang: 8 })),
    /* molinete de muñeca, junto al cuerpo, que acaba apuntando al
       frente (-268 = 92) */
    s_giro1: pose(mezcla(PIE.recogido, { tronco: -6,
                 hombroA: 50, codoA: 80, hombroB: -30, codoB: -40, objeto: "espada", ang: -60 })),
    s_giro2: pose(mezcla(PIE.recogido, { tronco: -4,
                 hombroA: 58, codoA: 96, hombroB: -26, codoB: -36, objeto: "espada", ang: -170 })),
    s_giro3: pose(mezcla(PIE.guardia, { tronco: -8,
                 hombroA: 70, codoA: 100, hombroB: -40, codoB: -60, objeto: "espada", ang: -268 })),
    s_estoc: pose(mezcla(PIE.lance, { tronco: -20, cabeza: -4,
                 hombroA: 88, codoA: 92, hombroB: -84, codoB: -60, objeto: "espada", ang: -268 })),
    /* barrido bajo: la hoja sale de atrás, pasa rozando el suelo y
       sube por delante */
    s_lateral: pose(mezcla(PIE.guardia, { tronco: 6, cabeza: 2,
                 hombroA: -30, codoA: -10, hombroB: 40, codoB: 70, objeto: "espada", ang: -110 })),
    s_barre: pose(mezcla(PIE.lance, { tronco: -16, cabeza: -6,
                 hombroA: 96, codoA: 90, hombroB: -60, codoB: -90, objeto: "espada", ang: 70 })),
    s_estoc2: pose(mezcla(PIE.lance, { tronco: -20, cabeza: -4,
                 hombroA: 88, codoA: 92, hombroB: -84, codoB: -60, objeto: "espada", ang: 92 })),
    /* la misma guardia con la hoja escrita una vuelta más atrás */
    guardiaN: pose({ tronco: -10, cabeza: 4, y: 3,
                     hombroA: 150, codoA: 170, hombroB: -40, codoB: -80,
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
      r.objeto = t < 0.5 ? a.objeto : b.objeto; r.ang = b.ang;
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
    hachaApoyada: false
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
    espada: linea(cuerpo, "monigote__espada")
  };
  var cabeza = el("circle", { "class": "monigote__cabeza" }, cuerpo);

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
  var LAPIZ_K = 2;           /* 17/09: el doble de grande */
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
     En "espacio libro": el lomo en el origen, el ancho a lo largo de
     x y el alto en y. Se ve de cara pero ESTRECHADO en x (el muñeco
     está de perfil), así se lee como un libro abierto sin que tape
     la cara. Dos mitades: la derecha se pliega sobre la izquierda
     para cerrarlo, y una hoja suelta hace el paso de página. */
  var LIBRO_K = 0.6;                   /* estrechamiento en x */
  var LIBRO_S = 1.5;                   /* 17/09: 1,5 veces más grande */
  var libro = el("g", {}, cuerpo);
  function mediaLibro(padre, lado, conTapa) {
    var g = el("g", {}, padre), x = function (v) { return (v * lado).toFixed(2); };
    if (conTapa) el("path", { "class": "monigote__libro-tapa", d:
      "M 0,-3.5 L " + x(5) + ",-3.3 L " + x(5) + ",3.5 L 0,3.6 Z" }, g);
    var hojas = el("g", {}, g);
    el("path", { "class": "monigote__libro-hojas", d:
      "M 0,-3.0 C " + x(1.5) + ",-3.35 " + x(3.2) + ",-3.15 " + x(4.6) + ",-2.85 L " + x(4.6) +
      ",3.0 C " + x(3.2) + ",2.75 " + x(1.5) + ",2.95 0,3.2 Z" }, hojas);
    [-1.9, -1.1, -0.3, 0.5, 1.3, 2.1].forEach(function (y, i) {
      el("line", { "class": "monigote__libro-renglon",
        x1: x(0.8), y1: y, x2: x(i === 5 ? 2.4 : 3.9), y2: y }, hojas);
    });
    return { g: g, hojas: hojas };
  }
  var libroIzq = mediaLibro(libro, -1, true);
  var libroDer = mediaLibro(libro, 1, true);
  var libroHoja = mediaLibro(libro, 1, false);
  el("line", { "class": "monigote__libro-lomo", x1: 0, y1: -3.4, x2: 0, y2: 3.5 }, libro);

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
  var B0 = [11, 22], B1 = [27, 29.2];
  function tablero(u) { return lerpP(B0, B1, u); }
  var DB = unir(B0, B1);                 /* a lo largo del tablero */
  var NB = [-DB[1], DB[0]];              /* normal, hacia arriba */
  var LAMPARA = { J: [23.2, 44.6], T: [18.2, 25.6] };

  (function construirMesa() {
    var g = escDibujo;
    /* taburete */
    L(g, -3.6, -15.4, 3.2, -15.4, "monigote__m monigote__m--asiento");
    L(g, -2.4, -14.6, -4.8, 0, "monigote__m");
    L(g, 2.2, -14.6, 4.4, 0, "monigote__m");
    L(g, -4.0, -5.6, 3.7, -5.6, "monigote__m monigote__m--fino");
    /* patas y travesaño de la mesa */
    L(g, 13.6, -21.2, 12.0, 0, "monigote__m");
    L(g, 25.4, -27.7, 27.6, 0, "monigote__m");
    L(g, 12.6, -7, 27.0, -7, "monigote__m monigote__m--fino");
    L(g, 19.3, -24.6, 19.9, -7, "monigote__m monigote__m--fino");
    L(g, 10.0, 0, 14.2, 0, "monigote__m");
    L(g, 25.4, 0, 29.8, 0, "monigote__m");
    /* tablero, papel y el listón que para los lápices */
    L(g, B0[0], -B0[1], B1[0], -B1[1], "monigote__m monigote__m--tablero");
    var p0 = mas(tablero(0.14), NB, 1.0), p1 = mas(tablero(0.8), NB, 1.0);
    L(g, p0[0], -p0[1], p1[0], -p1[1], "monigote__papel");
    var r0 = mas(B0, NB, 0.4), r1 = mas(B0, NB, 2.2);
    L(g, r0[0] - DB[0] * 0.4, -r0[1] + DB[1] * 0.4, r1[0] - DB[0] * 0.4, -r1[1] + DB[1] * 0.4, "monigote__m monigote__m--fino");

    /* lámpara tipo Luxo: pinza en el canto alto, dos brazos de
       varillas dobles, y la pantalla apuntando al papel */
    var base = mas(tablero(0.95), NB, 1.2);
    var E1 = [30.2, 40.4], J = LAMPARA.J;
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
    var q1 = mas(tablero(0.16), NB, 1.1), q2 = mas(tablero(0.6), NB, 1.1);
    el("path", { "class": "monigote__luz", d:
      "M " + fx(boca1[0]) + "," + fx(-boca1[1]) + " L " + fx(boca2[0]) + "," + fx(-boca2[1]) +
      " L " + fx(q2[0]) + "," + fx(-q2[1]) + " L " + fx(q1[0]) + "," + fx(-q1[1]) + " Z" }, escDibujoLuz);
    luzGrad.setAttribute("x1", J[0]); luzGrad.setAttribute("y1", -J[1]);
    luzGrad.setAttribute("x2", LAMPARA.T[0]); luzGrad.setAttribute("y2", -LAMPARA.T[1]);
    var c = mas(tablero(0.37), NB, 1.2);
    el("ellipse", { cx: 0, cy: 0, rx: 7, ry: 1.8, fill: "url(#mon-charco)",
      transform: "translate(" + fx(c[0]) + "," + fx(-c[1]) + ") rotate(" + fx(-Math.atan2(DB[1], DB[0]) / RAD) + ")" }, escDibujoLuz);
  })();

  /* --- el árbol donde se recuesta a leer (17/09) ---
     El borde del tronco que da a él está donde queda su espalda con
     el torso echado atrás 12°, y se abre en raíces hacia la cadera.
     La copa arranca por encima de su cabeza. */
  (function construirArbol() {
    var g = escArbol;
    el("path", { "class": "monigote__corteza", d:
      "M -2.2,0 C -3.6,-1.2 -4.8,-4 -5.5,-9 L -5.9,-44 L -12.6,-44 L -12.9,-9 " +
      "C -13.7,-4 -15.4,-1.2 -17.4,0 Z" }, g);
    [[-7.6, -3], [-9.4, -6], [-11.1, -4]].forEach(function (v) {
      el("path", { "class": "monigote__corteza-veta", fill: "none", d:
        "M " + v[0] + "," + v[1] + " C " + (v[0] + 0.6) + "," + (v[1] - 10) + " " +
        (v[0] - 0.5) + "," + (v[1] - 22) + " " + (v[0] + 0.3) + ",-40" }, g);
    });
    [["M -8,-38 Q -3,-43 2,-47", 1.8], ["M -10,-40 Q -15,-44 -20,-46", 1.6],
     ["M -9,-42 Q -9,-50 -12,-57", 1.5]].forEach(function (r) {
      el("path", { "class": "monigote__rama", d: r[0], "stroke-width": r[1] }, g);
    });
    [[-19, -46, 8, 1], [1, -47, 8, 1], [-9, -52, 11, 2], [-22, -55, 6, 1],
     [-12, -61, 8, 2], [-1, -58, 7, 2], [5, -53, 5.5, 3], [-16, -52, 5, 3],
     [-6, -63, 5, 3], [-4, -49, 4.5, 3]].forEach(function (c) {
      el("circle", { cx: c[0], cy: c[1], r: c[2], "class": "monigote__copa" + c[3] }, g);
    });
  })();

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
  function hacerMitad(padre, lado) {
    var g = el("g", {}, padre);
    el("rect", { x: -1.5, y: -4, width: 3, height: 8, rx: 0.35, "class": "monigote__corteza" }, g);
    /* la cara partida, clara, del lado del corte */
    el("rect", { x: lado < 0 ? 0.5 : -1.5, y: -3.9, width: 1, height: 7.8, "class": "monigote__testa" }, g);
    el("ellipse", { cx: 0, cy: -3.9, rx: 1.45, ry: 0.45, "class": "monigote__testa" }, g);
    return g;
  }
  var mitadesEl = [hacerMitad(dinFrente, -1), hacerMitad(dinFrente, 1)];

  /* ---------- efectos: fuego y partículas --------------------- */
  var bolasEl = [];
  for (var bi = 0; bi < 4; bi++) {
    var bg = el("g", { opacity: 0 }, capaEfectos);
    bolasEl.push({
      g: bg,
      halo: el("circle", { fill: "url(#mon-fuego)" }, bg),
      medio: el("circle", { "class": "monigote__fuego-medio" }, bg),
      nucleo: el("circle", { "class": "monigote__fuego-nucleo" }, bg)
    });
  }
  var partsEl = [];
  for (var pi = 0; pi < 140; pi++) partsEl.push(el("circle", { r: 0, opacity: 0 }, capaEfectos));

  var COLOR = {
    fuego: ["#FFD36B", "#FF9A2E", "#E8561A", "#A82A0C"],
    chispa: ["#FFF6D6", "#FFE39A", "#FFC766", "#FFA63D"],
    astilla: ["#D9B27A", "#C9A063", "#B68A52", "#A87C47"]
  };
  function particula(tipo, x, y, vx, vy, vida, r) {
    if (st.parts.length >= partsEl.length) st.parts.shift();
    st.parts.push({ tipo: tipo, x: x, y: y, vx: vx, vy: vy, edad: 0, vida: vida, r: r });
  }

  function disparar() {
    if (!st.punta) return;
    st.bolas.push({ x: st.punta[0], y: st.punta[1], edad: 0, r: 3.2,
                    vx: -0.17, fase: Math.random() * 6 });
    if (st.bolas.length > bolasEl.length) st.bolas.shift();
    /* fogonazo en la punta */
    for (var i = 0; i < 10; i++) {
      var a = Math.random() * Math.PI * 2, v = 0.02 + Math.random() * 0.05;
      particula("chispa", st.punta[0], st.punta[1], Math.cos(a) * v, Math.sin(a) * v, 260 + Math.random() * 200, 0.9);
    }
  }
  function estallar(b) {
    for (var i = 0; i < 18; i++) {
      var a = Math.random() * Math.PI * 2, v = 0.03 + Math.random() * 0.09;
      particula("fuego", b.x, b.y, Math.cos(a) * v, Math.sin(a) * v - 0.02, 380 + Math.random() * 260, 1.1 + Math.random() * 0.9);
    }
    particula("destello", b.x, b.y, 0, 0, 320, 2.5);
  }

  function efectos(dt) {
    /* bolas de fuego: van a la izquierda con un leve cabeceo y
       dejan estela; al llegar al borde, estallan */
    for (var i = st.bolas.length - 1; i >= 0; i--) {
      var b = st.bolas[i];
      b.edad += dt;
      b.x += b.vx * dt;
      b.y += Math.sin(b.edad / 90 + b.fase) * 0.012 * dt;
      var n = dt > 20 ? 3 : 2;
      for (var k = 0; k < n; k++) {
        particula("fuego", b.x + Math.random() * 2, b.y + (Math.random() - 0.5) * b.r * 1.3,
                  0.02 + Math.random() * 0.03, (Math.random() - 0.6) * 0.02,
                  260 + Math.random() * 220, b.r * (0.45 + Math.random() * 0.35));
      }
      if (b.x < 6) { estallar(b); st.bolas.splice(i, 1); }
    }
    /* chispas de la varita mientras hace florituras */
    if (st.chispas && st.punta && Math.random() < dt / 45) {
      particula("chispa", st.punta[0], st.punta[1],
                (Math.random() - 0.5) * 0.03, 0.005 + Math.random() * 0.02,
                380 + Math.random() * 300, 0.55 + Math.random() * 0.45);
    }
    for (var j = st.parts.length - 1; j >= 0; j--) {
      var p = st.parts[j];
      p.edad += dt;
      if (p.edad >= p.vida) { st.parts.splice(j, 1); continue; }
      if (p.tipo === "astilla") {
        p.vy += 0.0006 * dt;
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
      var r = b.r * (1 + 0.1 * Math.sin(b.edad / 35));
      e.g.setAttribute("opacity", Math.min(1, b.edad / 60));
      [[e.halo, 2.5], [e.medio, 1.15], [e.nucleo, 0.6]].forEach(function (c) {
        c[0].setAttribute("cx", b.x); c[0].setAttribute("cy", b.y);
        c[0].setAttribute("r", r * c[1]);
      });
    });
    partsEl.forEach(function (c, i) {
      var p = st.parts[i];
      if (!p) { if (c.getAttribute("opacity") !== "0") c.setAttribute("opacity", 0); return; }
      var f = p.edad / p.vida, r, o, col;
      if (p.tipo === "destello") {
        r = p.r + f * 7; o = 0.55 * (1 - f); col = "#FFE2A0";
      } else if (p.tipo === "astilla") {
        r = p.r; o = f < 0.7 ? 1 : 1 - (f - 0.7) / 0.3; col = COLOR.astilla[Math.floor(p.r * 7) % 4];
      } else {
        var pal = COLOR[p.tipo];
        col = pal[Math.min(3, Math.floor(f * 4))];
        r = p.r * (1 - f * (p.tipo === "fuego" ? 0.7 : 0.5));
        o = 1 - f;
      }
      c.setAttribute("cx", p.x); c.setAttribute("cy", p.y);
      c.setAttribute("r", Math.max(0.1, r));
      c.setAttribute("fill", col);
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
      var uL = p.uL == null ? 0.36 : p.uL;
      var punta = mas(tablero(uL), NB, 1.0 + (p.lift || 0) + p.alza * 4.5);
      var dl = unir([0, 0], mas(mas([0, 0], DB, -0.7), NB, 0.7 + p.alza * 0.5));
      var gir = (p.giro || 0) * RAD;
      dl = [dl[0] * Math.cos(gir) - dl[1] * Math.sin(gir), dl[0] * Math.sin(gir) + dl[1] * Math.cos(gir)];
      punta = eCuerpo(punta);
      tA = mas(punta, dl, 3.2 * LAPIZ_K);
      tB = eCuerpo(mas(tablero(0.6 + (p.papel || 0)), NB, 1.4));
      obj = { tipo: "lapiz", origen: punta, u: dl };
    } else if (o === "hacha") {
      var ua = dir(p.ang);
      tB = [cue[0] + p.hx, cue[1] - p.hy];
      var pomo = mas(tB, ua, -1);
      tA = mas(pomo, ua, p.agarre);
      obj = { tipo: "hacha", origen: pomo, u: ua };
    } else if (o === "libro") {
      var ub = dir(p.ang), cL = [cue[0] + p.hx, cue[1] - p.hy];
      var anchoL = 4.2 * LIBRO_K * LIBRO_S * (0.35 + 0.65 * p.abierto);
      tA = mas(cL, ub, anchoL);
      tB = mas(cL, ub, -anchoL);
      obj = { tipo: "libro", origen: cL, u: ub };
    } else if (o === "tronco" || o === "manos") {
      tB = [cue[0] + p.hx, cue[1] - p.hy];
      tA = [cue[0] + p.hx + 1, cue[1] - p.hy];
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

  var OBJETOS = { espada: partes.espada, varita: varita, lapiz: lapiz, hacha: hacha, libro: libro,
                  guitarra: null, tronco: null };
  var ORDEN = {
    base: ["musloB", "piernaB", "musloA", "piernaA", "tronco"],
    normal: ["brazoB", "antebrazoB", "cabeza", "espada", "varita", "brazoA", "antebrazoA"],
    guitarra: ["cabeza", "guitMastil", "antebrazoB", "guitCuerpo", "brazoA", "antebrazoA"],
    lapiz: ["brazoB", "antebrazoB", "cabeza", "lapiz", "brazoA", "antebrazoA"],
    hacha: ["hacha", "cabeza", "brazoB", "antebrazoB", "brazoA", "antebrazoA"],
    tronco: ["cabeza", "brazoB", "antebrazoB", "troncoMano", "brazoA", "antebrazoA"],
    libro: ["cabeza", "brazoB", "antebrazoB", "libro", "brazoA", "antebrazoA"]
  };
  var NODOS = {
    cabeza: cabeza, espada: partes.espada, varita: varita, lapiz: lapiz, hacha: hacha, libro: libro,
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
    var lista = (clave === "guitarra" ? ["brazoB"] : []).concat(ORDEN.base, ORDEN[clave]);
    lista.forEach(function (n) { cuerpo.appendChild(NODOS[n]); });
    partes.brazoB.style.display = clave === "guitarra" ? "none" : "";
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
    poner(partes.brazoA, P.cue, P.coA); poner(partes.antebrazoA, P.coA, P.maA);
    poner(partes.brazoB, P.cue, P.coB); poner(partes.antebrazoB, P.coB, P.maB);
    poner(partes.musloA, P.hip, P.roA); poner(partes.piernaA, P.roA, P.piA);
    poner(partes.musloB, P.hip, P.roB); poner(partes.piernaB, P.roB, P.piB);

    var o = g.obj ? g.obj.tipo : null;
    ordenar(o);
    for (var k in OBJETOS) if (OBJETOS[k] && k !== o) OBJETOS[k].style.display = "none";
    guitMastil.style.display = guitCuerpo.style.display = o === "guitarra" ? "" : "none";
    st.punta = null; st.enMano = null;

    if (o === "espada") {
      partes.espada.style.display = "";
      poner(partes.espada, P.maA, aP(mas(g.obj.origen, g.obj.u, H.espada)));
    } else {
      /* coordenadas válidas aunque esté oculta: sin x1/y1 queda NaN
         en el DOM y ensucia cualquier inspección */
      poner(partes.espada, P.maA, P.maA);
    }
    if (o === "guitarra") {
      tf(guitMastil, g.obj.origen, g.obj.u);
      tf(guitCuerpo, g.obj.origen, g.obj.u);
      var op = 0.5 + 0.5 * st.vibra;
      cuerdasCaja.setAttribute("opacity", op);
      cuerdasMastil.setAttribute("opacity", op);
    }
    if (o === "libro") {
      libro.style.display = "";
      var Pl = aP(g.obj.origen), ul = [st.mira * g.obj.u[0], -g.obj.u[1]];
      libro.setAttribute("transform", "translate(" + Pl[0] + "," + Pl[1] + ") rotate(" +
        (Math.atan2(ul[1], ul[0]) / RAD) + ") scale(" + (ESCALA * LIBRO_K * LIBRO_S) + "," + (ESCALA * LIBRO_S * st.mira) + ")");
      /* cerrar = plegar la mitad derecha sobre la izquierda */
      var sx = -1 + 2 * clamp(p.abierto, 0, 1);
      libroDer.g.setAttribute("transform", "scale(" + sx + ",1)");
      libroDer.hojas.style.display = sx > 0.05 ? "" : "none";
      /* paso de página: una hoja que gira sobre el lomo */
      if (p.hoja >= 0 && p.hoja <= 1) {
        libroHoja.g.style.display = "";
        libroHoja.g.setAttribute("transform", "scale(" + Math.cos(Math.PI * p.hoja) + ",1)");
      } else {
        libroHoja.g.style.display = "none";
      }
    }
    if (o === "varita" || o === "lapiz" || o === "hacha") {
      OBJETOS[o].style.display = "";
      tf(OBJETOS[o], g.obj.origen, g.obj.u, o === "lapiz" ? LAPIZ_K : 1);
    }
    if (o === "varita") {
      st.punta = aP(mas(g.obj.origen, g.obj.u, 14.6));
      puntaVarita.setAttribute("opacity", st.chispas ? 1 : 0.35);
    }
    if (o === "tronco") {
      st.enMano = aP(g.obj.centro);
      pintarTronco(troncoMano, st.enMano, 1 - p.rotT / 90, 1, 0);
    } else {
      pintarTronco(troncoMano, null, 0, 0);
    }
    pintarEscena();
    pintarEfectos();
  }

  function pintarEscena() {
    var s = ESCALA;
    var t = "translate(" + esc.x0 + "," + st.suelo + ") scale(" + (esc.m * s) + "," + s + ")";
    var enDibujo = esc.tipo === "dibujo" ? esc.op : 0;
    var enArbol = esc.tipo === "arbol" ? esc.op : 0;
    escArbol.setAttribute("transform", t);
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
    dinFondo.style.display = dinFrente.style.display = enHacha > 0 ? "" : "none";
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
      p.uL = 0.36 + 0.05 * Math.sin(td / 2300) + activo * 0.02 * Math.sin(td / 85);
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
    if (st.modo === "andando" && corriendo) {
      var peso = Math.min(1, (st.reloj - corriendo.t0) / 160);
      var cc = st.ciclo;
      var sA = Math.sin(cc), sB = Math.sin(cc + Math.PI);
      var zancada = 22, flexMin = 10, flexMax = 34, brazo = 16, codo = 34;
      var cA = sA * zancada, cB = sB * zancada;
      p.caderaA = lerp(p.caderaA, cA, peso);
      p.rodillaA = lerp(p.rodillaA, cA - (flexMin + (flexMax - flexMin) * (1 - sA) / 2), peso);
      p.caderaB = lerp(p.caderaB, cB, peso);
      p.rodillaB = lerp(p.rodillaB, cB - (flexMin + (flexMax - flexMin) * (1 - sB) / 2), peso);
      /* los brazos solo se balancean si no llevan nada agarrado */
      if (p.ikA < 0.5) { p.hombroA = lerp(p.hombroA, sB * brazo, peso); p.codoA = lerp(p.codoA, sB * brazo + codo, peso); }
      if (p.ik < 0.5) { p.hombroB = lerp(p.hombroB, sA * brazo, peso); p.codoB = lerp(p.codoB, sA * brazo + codo, peso); }
      p.y = lerp(p.y, Math.abs(sA) * -1.0, peso);
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
  function andar(f, atras, vel) { return { que: "andar", f: f, atras: !!atras, vel: vel || 0.05 }; }

  function escena(tipo) {
    return hacer(function () {
      esc.tipo = tipo; esc.vis = 1; esc.op = 0;
      esc.x0 = st.x; esc.m = st.mira; esc.t0 = st.reloj;
      esc.pila = [1, 1, 1];
      esc.bloque = null; esc.mitades = []; esc.hachaApoyada = false;
    });
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
  function rutinaEspada() {
    encolar(ir("desenvaina", 320), pausa(400), ir("guardia", 300), pausa(600));
    COMBOS.forEach(function (c) {
      encolar(serie(c.pasos), pausa(350), ir(c.hasta, 420), pausa(900 + Math.random() * 500));
    });
    encolar(ir("envaina", 380), pausa(250), ir("quieto", 380));
  }

  function rutinaGuitarra() {
    encolar(ir("g_saca", 420), pausa(500),
            ir("g_toca", 320), pausa(200),
            hacer(function () { st.musica = { t0: st.reloj, ultima: -1 }; }),
            pausa(COMPAS * 4),
            hacer(function () { st.musica = null; }),
            ir("g_toca", 150),
            ir("g_acorde", 280), hacer(function () { st.vibra = 1; }),
            pausa(1600),
            ir("g_saca", 380), pausa(300),
            ir("quieto", 420));
  }

  var FLORITURAS = [
    ["v_f1", "v_f2", "v_f3", "v_f4", "v_f2"],
    ["v_f3", "v_f5", "v_f1", "v_f4", "v_f5", "v_f2"],
    ["v_f4", "v_f1", "v_f5", "v_f3", "v_f2"]
  ];
  function rutinaVarita() {
    encolar(ir("v_saca", 420), pausa(400));
    FLORITURAS.forEach(function (serie) {
      encolar(hacer(function () { st.chispas = true; }));
      serie.forEach(function (n, i) { encolar(ir(n, 190 + (i % 2) * 60)); });
      encolar(hacer(function () { st.chispas = false; }),
              ir("v_carga", 340), pausa(300),
              ir("v_lanza", 130, "acel"), hacer(disparar),
              pausa(700), ir("v_retro", 320), pausa(1100));
    });
    encolar(ir("v_guarda", 400), pausa(300), ir("quieto", 420));
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
        ir("h_golpe", 190, "acel"),
        hacer(partir),
        ir("h_hunde", 110, "frena"),
        pausa(500),
        /* al hombro, hasta que desaparezcan las mitades y un poco más */
        ir("h_hombro", 750),
        pausa(2980 - 750 - 610 + (ultimo ? 300 : 2000))
      );
    });
    encolar(ir("quieto", 600), escenaFuera, pausa(500), ir("quieto", 420));
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
  var OBJETOS_RUTINA = [rutinaEspada, rutinaGuitarra, rutinaVarita, rutinaDibujo, rutinaHacha];
  var turno = -1;
  function rutinaObjeto() {
    turno = (turno + 1) % OBJETOS_RUTINA.length;
    OBJETOS_RUTINA[turno]();
  }

  /* Se sienta con una pierna estirada, al rato saca un libro y lee
     (él, 17/09). */
  function rutinaSentado() {
    encolar(escena("arbol"), ir("sentado", 650), pausa(3500),
            ir("l_saca", 550), pausa(350),
            ir("l_lee", 500),
            hacer(function () { st.lectura = { t0: st.reloj }; }),
            pausa(4600 * 3 - 200),
            hacer(function () { st.lectura = null; }),
            ir("l_saca", 500), pausa(400),
            ir("sentado", 500), pausa(900),
            /* se levanta como una persona, apoyándose en el piso */
            ir("lev_recoge", 650), pausa(300),
            ir("lev_cuclillas", 800), pausa(250),
            ir("lev_empuja", 650),
            ir("lev_pie", 550),
            /* ya de pie: el avance pasa a ser su posición real */
            hacer(function () {
              st.x += st.mira * POSES.lev_pie.avance * ESCALA;
              fijar("quieto");
            }),
            escenaFuera, pausa(500),
            /* y vuelve a su sitio con dos pasos atrás */
            andar(0, true, 0.025), pausa(300));
  }

  function rutinaSaludo() {
    encolar(ir("saluda_a", 420));
    for (var i = 0; i < 5; i++) encolar(ir("saluda_b", 190), ir("saluda_a", 190));
    encolar(pausa(500), ir("quieto", 420), pausa(1600), ir("saluda_a", 380));
    for (var j = 0; j < 4; j++) encolar(ir("saluda_b", 190), ir("saluda_a", 190));
    encolar(pausa(300), ir("quieto", 460));
  }

  function rutinaEstira() {
    encolar(ir("estira_arriba", 750), pausa(1900),
            ir("quieto", 520), pausa(300),
            ir("estira_puntas", 950), pausa(1600),
            ir("quieto", 850), pausa(400),
            ir("estira_arriba", 650), pausa(1200),
            ir("quieto", 600));
  }

  function rutinaMira() {
    var girar = hacer(function () { st.mira = -st.mira; });
    encolar(ir("mira_lejos", 500), pausa(2600),
            girar, pausa(2600),
            girar, pausa(1400),
            ir("quieto", 520));
  }

  /* Lo que hace cuando ya está en su sitio. */
  function rutinaOcio() {
    var r = Math.random();
    if (r < .40)      rutinaObjeto();
    else if (r < .60) rutinaSentado();
    else if (r < .73) rutinaSaludo();
    else if (r < .86) rutinaEstira();
    else              rutinaMira();
    encolar(pausa(1800 + Math.random() * 3600));
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
    if (esc.mitades.length && esc.mitades[0].edad > 3000) esc.mitades = [];

    if (st.modo === "andando" && corriendo) {
      st.x += corriendo.vel * dt * corriendo.sentido;
      st.ciclo += dt / 150 * (corriendo.atras ? -1 : 1);
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
    if (st.x < MARGEN) st.x = MARGEN;
    if (st.x > ancho - MARGEN) st.x = ancho - MARGEN;

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
          var destino = esc.x0 + esc.m * a.f * ESCALA;
          var sentido = destino < st.x ? -1 : 1;
          if (Math.abs(destino - st.x) > 0.5) {
            if (!a.atras) st.mira = sentido;
            corriendo = { sentido: sentido, destino: destino, atras: a.atras,
                          vel: a.vel, t0: st.reloj };
            st.modo = "andando";
          }
        }
      } else if (!st.guion.length && st.llegado) {
        rutinaOcio();
      }
    }

    efectos(dt);
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

  function tarjetaInstagram() {
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

    encolar(pausa(900), ir("quieto", 420));
    requestAnimationFrame(paso);
    vigilarTarjetas();
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
  var RUTINAS = { saludo: rutinaSaludo, estira: rutinaEstira, mira: rutinaMira,
                  sentado: rutinaSentado, espada: rutinaEspada, guitarra: rutinaGuitarra, varita: rutinaVarita,
                  dibujo: rutinaDibujo, hacha: rutinaHacha };
  window.__monigote = {
    estado: st, escena: esc, poses: POSES, leña: HACHA,
    get ancho() { return ancho; },
    geom: geom,
    avanzar: function (ms, salto) {
      salto = salto || 16;
      for (var i = 0; i < ms; i += salto) avanzarUno((anterior || 0) + salto);
    },
    hacer: function (nombre) {
      st.guion = []; st.espera = 0; corriendo = null; st.modo = "quieto";
      st.x = casa; st.mira = -1; esc.vis = 0; esc.op = 0; esc.tipo = null;
      st.musica = null; st.chispas = false; st.serie = null; st.lectura = null;
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
