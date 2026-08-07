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
    render.toneMappingExposure = 1.15;
    render.shadowMap.enabled = true;
    render.shadowMap.type = THREE.PCFSoftShadowMap;

    /* Cielo de estudio dibujado en un lienzo: da luz ambiente con
       direccion, que es lo que le falta a un modelo plano de
       SketchUp. Sin esto la madera se ve como cartulina. */
    (function () {
      var cv = document.createElement("canvas");
      cv.width = 8; cv.height = 128;
      var ctx = cv.getContext("2d");
      var grad = ctx.createLinearGradient(0, 0, 0, 128);
      grad.addColorStop(0.00, "#ffffff");
      grad.addColorStop(0.45, "#efe6da");
      grad.addColorStop(0.55, "#c9bcab");
      grad.addColorStop(1.00, "#6d5c4a");
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
    escena.add(new THREE.HemisphereLight(0xfff4e6, 0x8d7b66, 0.55));

    var principal = new THREE.DirectionalLight(0xfff6ea, 1.35);
    principal.position.set(4, 8, 6);
    principal.castShadow = true;
    principal.shadow.mapSize.set(1024, 1024);
    principal.shadow.bias = -0.0012;
    escena.add(principal);

    var relleno = new THREE.DirectionalLight(0xe8eef5, 0.35);
    relleno.position.set(-6, 3, -5);
    escena.add(relleno);

    /* contraluz: separa la pieza del fondo por el borde */
    var contra = new THREE.DirectionalLight(0xffffff, 0.45);
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

        o.castShadow = true;
        o.receiveShadow = true;

        var m = o.material;
        if (m) {
          /* la veta de la madera se ve borrosa en angulo si no se
             filtra; esto la mantiene nitida */
          if (m.map) {
            m.map.anisotropy = maxAniso;
            m.map.needsUpdate = true;
          }
          /* SketchUp no exporta rugosidad: sin esto todo sale con
             el mismo brillo plano de plastico */
          if (m.isMeshStandardMaterial) {
            m.roughness = m.map ? 0.72 : 0.62;
            m.metalness = 0.0;
            m.envMapIntensity = 0.85;
          }
        }

        /* Aristas: SketchUp se lee por sus lineas, y al exportar
           solo geometria el mueble pierde todos los cantos. Se
           redibujan a partir de la propia malla, marcando solo
           los quiebres de mas de 30 grados. */
        try {
          var aristas = new THREE.LineSegments(
            new THREE.EdgesGeometry(o.geometry, 30),
            new THREE.LineBasicMaterial({
              color: 0x2e2118, transparent: true, opacity: 0.34
            })
          );
          aristas.renderOrder = 1;
          o.add(aristas);
        } catch (e) { /* si una malla no admite aristas, se deja sin */ }
      });

      /* --- suelo que solo recoge la sombra ------------------ */
      var suelo = new THREE.Mesh(
        new THREE.PlaneGeometry(mayor * 12, mayor * 12),
        new THREE.ShadowMaterial({ opacity: 0.22 })
      );
      suelo.rotation.x = -Math.PI / 2;
      suelo.position.y = -tam.y / 2 - mayor * 0.002;
      suelo.receiveShadow = true;
      escena.add(suelo);

      /* la camara de sombras tiene que abrazar la pieza */
      var s = mayor * 0.85;
      principal.shadow.camera.left = -s;
      principal.shadow.camera.right = s;
      principal.shadow.camera.top = s;
      principal.shadow.camera.bottom = -s;
      principal.shadow.camera.near = mayor * 0.05;
      principal.shadow.camera.far = mayor * 30;
      principal.position.set(mayor * 1.2, mayor * 2.2, mayor * 1.6);
      principal.shadow.camera.updateProjectionMatrix();

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

    function bucle() {
      requestAnimationFrame(bucle);
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
  }

  return { abrir: abrir };
})();
