/* ============================================================
   VISOR 3D
   Muestra un modelo .glb dentro de la ficha de una pieza. El
   cliente puede girarlo, acercarse y moverse alrededor.

   La librería (three.js) NO se carga al abrir la página: pesa
   700 KB y solo se baja cuando alguien pulsa «Ver en 3D».
   ============================================================ */

window.Visor3D = (function () {
  "use strict";

  var ARCHIVOS = [
    "js/vendor/three.min.js",
    "js/vendor/OrbitControls.js",
    "js/vendor/GLTFLoader.js"
  ];

  var cargando = null;

  /* Carga los scripts en orden, una sola vez. */
  function cargarLibreria() {
    if (cargando) return cargando;
    cargando = ARCHIVOS.reduce(function (cadena, ruta) {
      return cadena.then(function () {
        return new Promise(function (ok, mal) {
          var s = document.createElement("script");
          s.src = ruta;
          s.onload = ok;
          s.onerror = function () { mal(new Error("No pude cargar " + ruta)); };
          document.head.appendChild(s);
        });
      });
    }, Promise.resolve());
    return cargando;
  }

  function color(nombre, respaldo) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(nombre).trim();
    return v || respaldo;
  }


  /* --------------------------------------------------------
     abrir(contenedor, rutaGlb, textos)
     textos = { cargando, error, ayuda }
     -------------------------------------------------------- */
  function abrir(contenedor, rutaGlb, textos) {
    textos = textos || {};
    /* Si ya había uno montado aquí, se apaga antes de montar el
       nuevo. */
    cerrar(contenedor);
    contenedor.innerHTML = '<div class="visor3d__aviso">' + (textos.cargando || "Cargando…") + "</div>";

    cargarLibreria().then(function () {
      construir(contenedor, rutaGlb, textos);
    }).catch(function (e) {
      contenedor.innerHTML = '<div class="visor3d__aviso">' + (textos.error || "No se pudo cargar el visor.") + "</div>";
      console.error(e);
    });
  }

  function construir(contenedor, rutaGlb, textos) {
    var ancho  = contenedor.clientWidth  || 600;
    var alto   = contenedor.clientHeight || 450;

    var escena = new THREE.Scene();
    escena.background = new THREE.Color(color("--caja", "#F0E7DA"));

    var camara = new THREE.PerspectiveCamera(42, ancho / alto, 0.01, 500);

    var render = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    render.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    render.setSize(ancho, alto);
    render.outputEncoding = THREE.sRGBEncoding;

    /* Tono de cine: comprime las luces altas en vez de quemarlas.
       Es lo que quita el aspecto de plástico. */
    render.toneMapping = THREE.ACESFilmicToneMapping;
    render.toneMappingExposure = 1.05;
    /* SIN SOMBRAS desde el 14/08/2026, por decisión suya. Las
       sombras proyectadas caían sobre las propias piezas y se
       leían como manchas de otro tono —"sombras que no parecen
       sombras"— sobre todo con el modelo despiezado, donde una
       tabla le tira la sombra encima a la de al lado. Sin ellas
       el mueble se lee por la veta y los cantos. */
    render.shadowMap.enabled = false;

    /* Cielo de estudio dibujado en un lienzo: da luz ambiente con
       direccion, que es lo que le falta a un modelo plano de
       SketchUp. Sin esto la madera se ve como cartulina. */
    (function () {
      var cv = document.createElement("canvas");
      cv.width = 8; cv.height = 128;
      var ctx = cv.getContext("2d");
      var grad = ctx.createLinearGradient(0, 0, 0, 128);
      /* 2026-08-14 · Degradado MUCHO más plano. El de antes iba de
         blanco puro a marrón oscuro, y desde que las piezas se
         pintan de un color liso eso se veía como dos tonos
         distintos en el mismo mueble: sin veta que lo disimule,
         cada cara plana queda de un tono uniforme y el salto entre
         caras canta. */
      grad.addColorStop(0.00, "#f0ece6");
      grad.addColorStop(0.50, "#e8e2da");
      grad.addColorStop(1.00, "#ded6cb");
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 8, 128);
      var tex = new THREE.CanvasTexture(cv);
      tex.mapping  = THREE.EquirectangularReflectionMapping;
      tex.encoding = THREE.sRGBEncoding;
      escena.environment = tex;
    })();

    contenedor.innerHTML = "";
    contenedor.appendChild(render.domElement);

    if (textos.ayuda) {
      contenedor.appendChild(
        Object.assign(document.createElement("div"), {
          className: "visor3d__ayuda", textContent: textos.ayuda
        })
      );
    }

    /* Luz: cielo cálido arriba, rebote de madera abajo, y dos
       direccionales suaves. Sin sombras duras, que en un mueble
       claro se ven sucias. */
    /* 2026-08-13 · Se bajó la luz general y se subió la sombra.
       Antes sumaba 2,70 de luz directa más el entorno, y la madera
       salía lavada respecto de SketchUp: los tonos existían pero
       el exceso de luz se los comía. Ahora suma 1,80 y la forma se
       lee por el contraste, no por el brillo. */
    /* 2026-08-14 · Se rebalanceó entero: manda la luz ambiente y
       la direccional pasa a ser un apunte. Con relleno plano el
       contraste entre caras baja de 1,22 a 1,10 —"todo del mismo
       tono", que es lo que él pidió— y la forma se sigue leyendo
       por los cantos. No bajes más la ambiente sin mirarlo: a
       partir de ahí la pieza se aplana y parece una silueta. */
    escena.add(new THREE.HemisphereLight(0xfff4e6, 0x6b5b49, 0.75));

    var principal = new THREE.DirectionalLight(0xfff6ea, 0.45);
    principal.position.set(4, 8, 6);
    principal.castShadow = false;
    escena.add(principal);

    var relleno = new THREE.DirectionalLight(0xe8eef5, 0.45);
    relleno.position.set(-6, 3, -5);
    escena.add(relleno);

    /* contraluz: separa la pieza del fondo por el borde */
    var contra = new THREE.DirectionalLight(0xffffff, 0.22);
    contra.position.set(-3, 4, -8);
    escena.add(contra);

    var control = null;

    new THREE.GLTFLoader().load(rutaGlb, function (gltf) {
      var modelo = gltf.scene;
      escena.add(modelo);

      /* encuadrar: se mide el modelo y se coloca la cámara
         a una distancia que lo deje entero en pantalla */
      var caja = new THREE.Box3().setFromObject(modelo);
      var tam    = caja.getSize(new THREE.Vector3());
      var centro = caja.getCenter(new THREE.Vector3());
      var mayor  = Math.max(tam.x, tam.y, tam.z) || 1;

      modelo.position.sub(centro);

      /* --- acabado de cada malla --------------------------- */
      var maxAniso = render.capabilities.getMaxAnisotropy();
      modelo.traverse(function (o) {
        if (!o.isMesh) return;

        o.castShadow = false;
        o.receiveShadow = false;

        /* NORMALES: se recalculan SIEMPRE, y esto no es un lujo.
           Las que trae el .glb están mal: el 72–79% de los
           triángulos, en TODOS los modelos, tienen la normal
           contraria a la cara que definen sus propios vértices.
           Como la luz se calcula con la normal, piezas de la
           MISMA madera salían con tonos distintos —la bandeja
           parecía pino al lado de las aletas de samán— y no había
           forma de arreglarlo tocando las luces.

           Medido el 14/08/2026: entre piezas de igual textura, la
           más clara era 2,95 veces más luminosa que la más
           oscura. Recalculando baja a 1,10, o sea uniforme.
           Se recalculan a partir del orden de los vértices, que
           SÍ es correcto; negarlas sin más no arregla (1,81).

           El fallo de raíz está en Herramientas\dae-a-glb.py, que
           es quien escribe esas normales. Mientras siga ahí, esta
           línea es lo que sostiene el color de todo el visor. */
        if (o.geometry) o.geometry.computeVertexNormals();

        var m = o.material;
        if (m && m.isMeshStandardMaterial) {
          /* TEXTURAS, tal como salen de SketchUp (él, 14/08/2026,
             después de haber probado el color plano y no gustarle).

             La ORIENTACIÓN de la veta —si va a lo largo o a lo
             ancho de la pieza— viene en las coordenadas UV y se
             respeta sin tocar nada: `dae-a-glb.py` las copia del
             .dae haciendo sólo el volteo de V que exige glTF
             (COLLADA cuenta la V desde abajo y glTF desde arriba)
             y NO intercambia los ejes, así que la dirección de la
             veta se conserva. Comprobado midiendo a qué dirección
             del mueble apunta el eje V en cada cara.

             Aquí NO se reorienta ni se reescala nada: si una veta
             sale torcida, está torcida en el .skp y se arregla
             allá, no aquí. */
          if (m.map) {
            m.map.anisotropy = maxAniso;   /* nítida en ángulo */
            m.map.needsUpdate = true;
          }
          /* Sin aoMap: reutilizaba el mapa de color como oclusión
             y lo que hacía era ensuciar la veta. */
          m.aoMap = null;
          m.roughness = 0.72;
          m.metalness = 0.0;
          m.envMapIntensity = 0.85;
          m.needsUpdate = true;
        }

        /* Las aristas se quitaron el 14/08/2026: se le veían como
           "líneas raras" cruzando las piezas, y no era percepción
           suya. La geometría que sale del conversor tiene los
           vértices sin soldar, así que EdgesGeometry no reconoce
           caras vecinas y dibujaba 4.441 segmentos donde tocaban
           un par de cientos — rayaba las caras enteras en vez de
           marcar los cantos. Subir el umbral a 55° no arreglaba
           nada (4.441 contra 4.445).
           Si algún día se quieren recuperar los cantos, primero
           hay que soldar la malla en el conversor. */
      });

      /* Aquí iban el suelo que recogía la sombra y la cámara de
         sombras. Se fueron los dos con las sombras (14/08/2026):
         sin `shadowMap` el suelo no pintaba nada y la cámara no
         se usa. */
      principal.position.set(mayor * 1.2, mayor * 2.2, mayor * 1.6);

      var dist = (mayor / 2) / Math.tan((camara.fov * Math.PI / 180) / 2);
      dist *= 1.9;
      camara.position.set(dist * 0.75, dist * 0.55, dist * 0.85);
      camara.near = mayor / 100;
      camara.far  = mayor * 60;
      camara.updateProjectionMatrix();
      camara.lookAt(0, 0, 0);

      control = new THREE.OrbitControls(camara, render.domElement);
      control.enableDamping = true;
      control.dampingFactor = 0.07;
      control.minDistance = mayor * 0.35;
      control.maxDistance = mayor * 6;
      control.maxPolarAngle = Math.PI * 0.92;
      control.autoRotate = true;
      control.autoRotateSpeed = 0.9;

      /* al tocarlo, deja de girar solo */
      render.domElement.addEventListener("pointerdown", function () {
        control.autoRotate = false;
      });

      contenedor.classList.add("visor3d--listo");
    }, undefined, function (e) {
      contenedor.innerHTML = '<div class="visor3d__aviso">' + (textos.error || "No se pudo cargar el modelo.") + "</div>";
      console.error(e);
    });

    /* 2026-08-11 · El bucle no tenía freno y el ResizeObserver no
       se soltaba nunca. Con un visor por página daba igual: se
       abría una vez y ahí se quedaba. Pero en el panel de
       Prototipos el visor se vuelve a montar CADA VEZ que cambias
       de madera, y sin esto cada cambio dejaba otro bucle vivo y
       otro contexto WebGL. El navegador solo aguanta unos 16:
       a la novena vuelta el visor se quedaba en negro. */
    var vivo = true;
    var cuadro = null;

    function bucle() {
      if (!vivo) return;
      cuadro = requestAnimationFrame(bucle);
      if (control) control.update();
      render.render(escena, camara);
    }
    bucle();

    /* Punto de inspección: si algo se ve raro, en la consola del
       navegador se puede mirar __visor para saber qué está pasando. */
    window.__visor = { escena: escena, camara: camara, render: render,
                       get control() { return control; } };

    /* que se reajuste si cambia el tamaño de la ventana */
    var ro = new ResizeObserver(function () {
      var a = contenedor.clientWidth, b = contenedor.clientHeight;
      if (!a || !b) return;
      camara.aspect = a / b;
      camara.updateProjectionMatrix();
      render.setSize(a, b);
    });
    ro.observe(contenedor);

    /* El apagado queda colgado del propio contenedor, así que
       cerrar() no necesita llevar registro de nada. */
    contenedor.__cerrarVisor = function () {
      vivo = false;
      if (cuadro) cancelAnimationFrame(cuadro);
      ro.disconnect();
      if (control && control.dispose) control.dispose();
      escena.traverse(function (o) {
        if (o.geometry) o.geometry.dispose();
        if (!o.material) return;
        [].concat(o.material).forEach(function (m) {
          Object.keys(m).forEach(function (k) {
            if (m[k] && m[k].isTexture) m[k].dispose();
          });
          m.dispose();
        });
      });
      /* forceContextLoss libera el contexto WebGL de una vez, sin
         esperar al recolector de basura. Sin esto el navegador se
         queda con los contextos ocupados un buen rato. */
      if (render.forceContextLoss) render.forceContextLoss();
      render.dispose();
      delete contenedor.__cerrarVisor;
    };
  }

  /* Apaga el visor de un contenedor, si tiene uno. Es seguro
     llamarla siempre, aunque no haya nada montado. */
  function cerrar(contenedor) {
    if (contenedor && contenedor.__cerrarVisor) contenedor.__cerrarVisor();
  }

  return { abrir: abrir, cerrar: cerrar };
})();
